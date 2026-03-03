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
 * Ensure User + UserProfile + ChildProfile exist.
 * For initial onboarding, creates a single child profile.
 */
async function ensureUserProfileAndChild(
  fastify: FastifyInstance,
  userId: string,
  email: string,
) {
  let user = await fastify.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    user = await fastify.prisma.user.create({
      data: { id: userId, email },
    });
  }

  let profile = await fastify.prisma.userProfile.findUnique({
    where: { userId },
    include: { children: true },
  });

  if (!profile) {
    profile = await fastify.prisma.userProfile.create({
      data: {
        userId,
        children: {
          create: { onboardingResponses: {} },
        },
      },
      include: { children: true },
    });
  }

  // Ensure at least one child exists
  let child = profile.children[0];
  if (!child) {
    child = await fastify.prisma.childProfile.create({
      data: {
        profileId: profile.id,
        onboardingResponses: {},
      },
    });
    profile = await fastify.prisma.userProfile.findUniqueOrThrow({
      where: { userId },
      include: { children: true },
    });
  }

  return { user, profile, child };
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
      const { profile, child } = await ensureUserProfileAndChild(
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
      const { profile, child } = await ensureUserProfileAndChild(
        fastify,
        userId,
        email,
      );

      const nextStep = step + 1;

      // Route data to the correct table based on response keys
      const parentUpdates: Record<string, unknown> = {};
      const childColumnUpdates: Record<string, unknown> = {};
      const assessmentUpdates: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(responses)) {
        if (PARENT_KEYS.has(key)) {
          if (key === "parentGender") parentUpdates.parentGender = value;
          if (key === "parentAgeRange") parentUpdates.parentAgeRange = value;
          if (key === "householdStructure")
            parentUpdates.householdStructure = value;
        } else if (CHILD_COLUMN_KEYS.has(key)) {
          if (key === "childName") childColumnUpdates.childName = value;
          if (key === "childAge") childColumnUpdates.childAge = value;
          if (key === "childGender") childColumnUpdates.childGender = value;
        } else {
          // Assessment (Likert) answers → JSONB
          assessmentUpdates[key] = value;
        }
      }

      // Update parent profile if needed
      if (Object.keys(parentUpdates).length > 0) {
        await fastify.prisma.userProfile.update({
          where: { userId },
          data: parentUpdates,
        });
      }

      // Build child update data
      const childData: Record<string, unknown> = {
        onboardingStep: nextStep,
      };

      // Add child column updates
      if (Object.keys(childColumnUpdates).length > 0) {
        Object.assign(childData, childColumnUpdates);
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

      const updatedChild = await fastify.prisma.childProfile.update({
        where: { id: child.id },
        data: childData,
      });

      // Refetch parent for merged response
      const updatedProfile =
        await fastify.prisma.userProfile.findUniqueOrThrow({
          where: { userId },
        });

      const mergedResponses = buildResponsesObject(
        updatedProfile,
        updatedChild,
      );

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
      const { profile, child } = await ensureUserProfileAndChild(
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

      // Update child profile
      await fastify.prisma.childProfile.update({
        where: { id: child.id },
        data: {
          onboardingCompleted: true,
          onboardingStep: TOTAL_STEPS + 1,
          traitProfile:
            enrichedTraitProfile as unknown as Prisma.InputJsonValue,
        },
      });

      // Mark parent onboarding as completed
      await fastify.prisma.userProfile.update({
        where: { userId },
        data: { onboardingCompleted: true },
      });

      return reply.send({
        onboardingCompleted: true,
        traitProfile: enrichedTraitProfile,
      });
    },
  );
}
