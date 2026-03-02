import type { FastifyInstance } from "fastify";
import { z } from "zod";

const TOTAL_STEPS = 16;

const stepValidators: Record<number, z.ZodSchema> = {
  1: z.object({ gender: z.enum(["male", "female", "non-binary-other"]) }),
  2: z.object({ ageRange: z.enum(["18-30", "31-45", "46-60", "61+"]) }),
  3: z.object({
    knowledgeLevel: z.enum(["beginner", "some-experience", "advanced"]),
  }),
  4: z.object({ childName: z.string().min(1).max(100) }),
  5: z.object({ childAge: z.number().int().min(0).max(25) }),
  6: z.object({
    diagnosisStatus: z.enum([
      "combined-type",
      "inattentive-type",
      "hyperactive-impulsive-type",
      "suspected-evaluation",
    ]),
  }),
  7: z.object({
    householdStructure: z.enum([
      "two-parent",
      "single-parent",
      "co-parenting",
      "multi-generational",
    ]),
  }),
  8: z.object({
    schoolSupport: z.enum(["iep", "504-plan", "no-formal", "homeschooled"]),
  }),
  9: z.object({
    currentInterventions: z.array(z.string().min(1)).min(1).max(5),
  }),
  10: z.object({
    stressfulAreas: z.array(z.string().min(1)).min(1).max(3),
  }),
  11: z.object({
    executiveFunctioningGaps: z.array(z.string().min(1)).min(1).max(4),
  }),
  12: z.object({
    physicalActivity: z.array(z.string().min(1)).min(1).max(6),
  }),
  13: z.object({
    impulseControlMarkers: z.array(z.string().min(1)).min(1).max(6),
  }),
  14: z.object({
    childMotivators: z.array(z.string().min(1)).min(1).max(6),
  }),
  15: z.object({ theReality: z.string().min(1).max(5000) }),
  16: z.object({ theVision: z.string().min(1).max(5000) }),
};

const patchBodySchema = z.object({
  step: z.number().int().min(1).max(TOTAL_STEPS),
  responses: z.record(z.string(), z.unknown()),
});

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
      const { profile } = await ensureUserAndProfile(fastify, userId, email);

      return reply.send({
        onboardingStep: profile.onboardingStep,
        onboardingCompleted: profile.onboardingCompleted,
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
      const validator = stepValidators[step];
      if (validator) {
        const stepParsed = validator.safeParse(responses);
        if (!stepParsed.success) {
          return reply.status(400).send({
            error: "Invalid response for this step",
            details: stepParsed.error.flatten().fieldErrors,
          });
        }
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
          onboardingResponses: mergedResponses,
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

  // POST /onboarding/complete — mark onboarding as finished
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

      const updated = await fastify.prisma.userProfile.update({
        where: { userId },
        data: {
          onboardingCompleted: true,
          onboardingStep: TOTAL_STEPS + 1,
        },
      });

      return reply.send({
        onboardingCompleted: updated.onboardingCompleted,
        responses:
          (updated.onboardingResponses as Record<string, unknown>) ?? {},
      });
    },
  );

  // GET /onboarding/snapshot — grouped data for Family Snapshot page
  fastify.get(
    "/onboarding/snapshot",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: userId } = request.user;

      const profile = await fastify.prisma.userProfile.findUnique({
        where: { userId },
      });

      if (!profile || !profile.onboardingCompleted) {
        return reply.status(404).send({
          error: "Onboarding not completed",
        });
      }

      const r = (profile.onboardingResponses as Record<string, unknown>) ?? {};

      return reply.send({
        parent: {
          gender: r.gender,
          ageRange: r.ageRange,
          knowledgeLevel: r.knowledgeLevel,
        },
        child: {
          name: r.childName,
          age: r.childAge,
          diagnosisStatus: r.diagnosisStatus,
          motivators: r.childMotivators,
        },
        household: {
          structure: r.householdStructure,
          schoolSupport: r.schoolSupport,
          currentInterventions: r.currentInterventions,
        },
        challenges: {
          stressfulAreas: r.stressfulAreas,
          executiveFunctioningGaps: r.executiveFunctioningGaps,
          impulseControlMarkers: r.impulseControlMarkers,
          physicalActivity: r.physicalActivity,
        },
        narrative: {
          theReality: r.theReality,
          theVision: r.theVision,
        },
      });
    },
  );
}
