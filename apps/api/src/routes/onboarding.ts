import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  TOTAL_STEPS,
  getStepConfig,
  computeTraitProfile,
  ARCHETYPES,
} from "@adhd-ai-assistant/shared";

const patchBodySchema = z.object({
  step: z.number().int().min(1).max(TOTAL_STEPS),
  responses: z.record(z.string(), z.unknown()),
});

// Keys that belong on UserProfile (parent info)
const PARENT_KEYS = new Set([
  "parentGender",
  "parentAgeRange",
  "householdStructure",
]);

// Keys that are stored as dedicated columns on ChildProfile
const CHILD_COLUMN_KEYS = new Set(["childName", "childAge", "childGender"]);

/**
 * Validate a single step's response payload.
 * Returns null if valid, or an error string if invalid.
 */
function validateStepResponse(
  step: number,
  responses: Record<string, unknown>,
): string | null {
  const config = getStepConfig(step);
  if (!config) return `Unknown step ${step}`;

  if (config.type === "basic-info") {
    const val = responses[config.question.key];
    switch (config.question.type) {
      case "single-select":
        if (typeof val !== "string" || val.length === 0) {
          return `${config.question.key} must be a non-empty string`;
        }
        if (
          config.question.options &&
          !config.question.options.includes(val)
        ) {
          return `Invalid option for ${config.question.key}`;
        }
        break;
      case "text":
        if (typeof val !== "string" || val.trim().length === 0) {
          return `${config.question.key} must be a non-empty string`;
        }
        break;
      case "number": {
        if (typeof val !== "number" || !Number.isInteger(val)) {
          return `${config.question.key} must be an integer`;
        }
        const min = config.question.min ?? 0;
        const max = config.question.max ?? 100;
        if (val < min || val > max) {
          return `${config.question.key} must be between ${min} and ${max}`;
        }
        break;
      }
    }
    return null;
  }

  // Likert step
  const key = `${config.categoryId}_${config.questionIndex}`;
  const val = responses[key];
  if (typeof val !== "number" || !Number.isInteger(val) || val < 0 || val > 3) {
    return `${key} must be an integer 0-3`;
  }
  return null;
}

/**
 * Get or create User + UserProfile + ChildProfile in a single transaction.
 * Uses upsert to minimize round-trips.
 */
async function getOrCreateProfileWithChild(
  fastify: FastifyInstance,
  userId: string,
  email: string,
) {
  // Single query: try to get everything at once
  const existing = await fastify.prisma.userProfile.findUnique({
    where: { userId },
    include: { children: true },
  });

  if (existing && existing.children.length > 0) {
    return { profile: existing, child: existing.children[0] };
  }

  // Need to create — use a transaction
  const result = await fastify.prisma.$transaction(async (tx) => {
    // Upsert user
    await tx.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email },
    });

    // Upsert profile
    const profile = await tx.userProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        children: {
          create: { onboardingResponses: {} },
        },
      },
      include: { children: true },
    });

    // Ensure child exists
    let child = profile.children[0];
    if (!child) {
      child = await tx.childProfile.create({
        data: {
          profileId: profile.id,
          onboardingResponses: {},
        },
      });
    }

    return { profile, child };
  });

  return result;
}

/**
 * Build the merged responses object from parent profile + child profile.
 * Frontend expects a flat key-value map of all responses.
 */
function buildResponsesObject(
  profile: {
    parentGender: string | null;
    parentAgeRange: string | null;
    householdStructure: string | null;
  },
  child: {
    childName: string;
    childAge: number | null;
    childGender: string | null;
    onboardingResponses: unknown;
  },
): Record<string, unknown> {
  const assessmentResponses =
    (child.onboardingResponses as Record<string, unknown>) ?? {};

  return {
    ...assessmentResponses,
    // Parent info from dedicated columns
    ...(profile.parentGender && { parentGender: profile.parentGender }),
    ...(profile.parentAgeRange && { parentAgeRange: profile.parentAgeRange }),
    ...(profile.householdStructure && {
      householdStructure: profile.householdStructure,
    }),
    // Child info from dedicated columns
    ...(child.childName && { childName: child.childName }),
    ...(child.childAge != null && { childAge: child.childAge }),
    ...(child.childGender && { childGender: child.childGender }),
  };
}

export default async function onboardingRoutes(fastify: FastifyInstance) {
  // GET /onboarding — fetch current progress for resume
  fastify.get(
    "/onboarding",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: userId, email } = request.user;
      const { profile, child } = await getOrCreateProfileWithChild(
        fastify,
        userId,
        email,
      );

      const responses = buildResponsesObject(profile, child);

      return reply.send({
        onboardingStep: child.onboardingStep,
        onboardingCompleted: profile.onboardingCompleted,
        responses,
      });
    },
  );

  // PATCH /onboarding — save a single step answer (autosave)
  fastify.patch(
    "/onboarding",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = patchBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { step, responses } = parsed.data;

      // Validate per-step responses
      const validationError = validateStepResponse(
        step,
        responses as Record<string, unknown>,
      );
      if (validationError) {
        return reply.status(400).send({ error: validationError });
      }

      const { id: userId, email } = request.user;
      const { profile, child } = await getOrCreateProfileWithChild(
        fastify,
        userId,
        email,
      );

      const nextStep = step + 1;

      // Route data to the correct table based on response keys
      const parentUpdates: Record<string, unknown> = {};
      const childData: Record<string, unknown> = { onboardingStep: nextStep };
      const assessmentUpdates: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(responses)) {
        if (PARENT_KEYS.has(key)) {
          if (key === "parentGender") parentUpdates.parentGender = value;
          if (key === "parentAgeRange") parentUpdates.parentAgeRange = value;
          if (key === "householdStructure")
            parentUpdates.householdStructure = value;
        } else if (CHILD_COLUMN_KEYS.has(key)) {
          if (key === "childName") childData.childName = value;
          if (key === "childAge") childData.childAge = value;
          if (key === "childGender") childData.childGender = value;
        } else {
          // Assessment (Likert) answers → JSONB
          assessmentUpdates[key] = value;
        }
      }

      // Merge assessment answers into existing JSONB
      if (Object.keys(assessmentUpdates).length > 0) {
        const existingResponses =
          (child.onboardingResponses as Record<string, unknown>) ?? {};
        childData.onboardingResponses = {
          ...existingResponses,
          ...assessmentUpdates,
        } as Prisma.InputJsonValue;
      }

      // Run parent + child updates in parallel (or just child if no parent data)
      const hasParentUpdates = Object.keys(parentUpdates).length > 0;

      const [updatedChild] = await Promise.all([
        fastify.prisma.childProfile.update({
          where: { id: child.id },
          data: childData,
        }),
        ...(hasParentUpdates
          ? [
              fastify.prisma.userProfile.update({
                where: { userId },
                data: parentUpdates,
              }),
            ]
          : []),
      ]);

      // Build merged response from what we already have — no refetch needed
      const mergedProfile = {
        parentGender: (parentUpdates.parentGender as string) ?? profile.parentGender,
        parentAgeRange: (parentUpdates.parentAgeRange as string) ?? profile.parentAgeRange,
        householdStructure: (parentUpdates.householdStructure as string) ?? profile.householdStructure,
      };

      const mergedResponses = buildResponsesObject(mergedProfile, updatedChild);

      return reply.send({
        onboardingStep: updatedChild.onboardingStep,
        responses: mergedResponses,
      });
    },
  );

  // POST /onboarding/complete — compute trait profile + mark done
  fastify.post(
    "/onboarding/complete",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: userId, email } = request.user;
      const { profile, child } = await getOrCreateProfileWithChild(
        fastify,
        userId,
        email,
      );

      if (profile.onboardingCompleted && child.onboardingCompleted) {
        return reply.status(409).send({
          error: "Onboarding already completed",
        });
      }

      // Compute trait profile from the child's assessment responses
      const assessmentResponses =
        (child.onboardingResponses as Record<string, unknown>) ?? {};
      const traitProfile = computeTraitProfile(assessmentResponses);

      // Look up the full archetype info
      const archetype = ARCHETYPES.find(
        (a) => a.id === traitProfile.archetypeId,
      );

      // Store trait profile with archetype details on the child
      const enrichedTraitProfile = {
        ...traitProfile,
        archetypeName: archetype?.animal ?? "",
        archetypeTypeName: archetype?.typeName ?? "",
      };

      // Update both in parallel
      await Promise.all([
        fastify.prisma.childProfile.update({
          where: { id: child.id },
          data: {
            onboardingCompleted: true,
            onboardingStep: TOTAL_STEPS + 1,
            traitProfile:
              enrichedTraitProfile as unknown as Prisma.InputJsonValue,
          },
        }),
        fastify.prisma.userProfile.update({
          where: { userId },
          data: { onboardingCompleted: true },
        }),
      ]);

      return reply.send({
        onboardingCompleted: true,
        traitProfile: enrichedTraitProfile,
      });
    },
  );
}
