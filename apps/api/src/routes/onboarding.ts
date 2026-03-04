import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  TOTAL_STEPS,
  getStepConfig,
  computeTraitProfile,
} from "@adhd-ai-assistant/shared";

const patchBodySchema = z.object({
  step: z.number().int().min(1).max(TOTAL_STEPS),
  responses: z.record(z.string(), z.unknown()),
});

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

async function ensureUserAndProfile(
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
  });

  if (!profile) {
    profile = await fastify.prisma.userProfile.create({
      data: { userId, onboardingResponses: {} },
    });
  }

  return { user, profile };
}

export default async function onboardingRoutes(fastify: FastifyInstance) {
  // GET /onboarding — fetch current progress for resume
  fastify.get(
    "/onboarding",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: userId, email } = request.user;
      const { user, profile } = await ensureUserAndProfile(fastify, userId, email);

      return reply.send({
        onboardingStep: profile.onboardingStep,
        onboardingCompleted: profile.onboardingCompleted,
        role: user.role,
        responses:
          (profile.onboardingResponses as Record<string, unknown>) ?? {},
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
      const { profile } = await ensureUserAndProfile(fastify, userId, email);

      const existingResponses =
        (profile.onboardingResponses as Record<string, unknown>) ?? {};
      const mergedResponses = { ...existingResponses, ...responses };

      const nextStep = step + 1;

      const updated = await fastify.prisma.userProfile.update({
        where: { userId },
        data: {
          onboardingResponses: mergedResponses as Prisma.InputJsonValue,
          onboardingStep: nextStep,
        },
      });

      return reply.send({
        onboardingStep: updated.onboardingStep,
        responses:
          (updated.onboardingResponses as Record<string, unknown>) ?? {},
      });
    },
  );

  // POST /onboarding/complete — compute trait profile + mark done
  fastify.post(
    "/onboarding/complete",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: userId, email } = request.user;
      const { profile } = await ensureUserAndProfile(fastify, userId, email);

      if (profile.onboardingCompleted) {
        return reply.status(409).send({
          error: "Onboarding already completed",
        });
      }

      // Compute trait profile from responses
      const responses =
        (profile.onboardingResponses as Record<string, unknown>) ?? {};
      const traitProfile = computeTraitProfile(responses);

      const updated = await fastify.prisma.userProfile.update({
        where: { userId },
        data: {
          onboardingCompleted: true,
          onboardingStep: TOTAL_STEPS + 1,
          traitProfile: traitProfile as unknown as Prisma.InputJsonValue,
        },
      });

      return reply.send({
        onboardingCompleted: updated.onboardingCompleted,
        traitProfile: updated.traitProfile,
      });
    },
  );
}
