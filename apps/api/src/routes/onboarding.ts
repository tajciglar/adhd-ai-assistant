import type { FastifyInstance } from "fastify";
import { z } from "zod";

const onboardingBodySchema = z.object({
  adhdType: z.enum(["inattentive", "hyperactive", "combined"]),
  struggles: z.array(z.string().min(1)).min(1).max(20),
  sensoryTriggers: z.array(z.string().min(1)).max(20).optional().default([]),
  goals: z.array(z.string().min(1)).min(1).max(20),
});

type OnboardingBody = z.infer<typeof onboardingBodySchema>;

export default async function onboardingRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: OnboardingBody }>(
    "/onboarding",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = onboardingBodySchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { adhdType, struggles, sensoryTriggers, goals } = parsed.data;
      const { id: userId, email } = request.user;

      const existingUser = await fastify.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      if (existingUser?.profile?.onboardingCompleted) {
        return reply.status(409).send({
          error: "User has already completed onboarding",
        });
      }

      const user =
        existingUser ??
        (await fastify.prisma.user.create({
          data: { id: userId, email },
        }));

      const profile = await fastify.prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {
          adhdType,
          struggles,
          sensoryTriggers,
          goals,
          onboardingCompleted: true,
        },
        create: {
          userId: user.id,
          adhdType,
          struggles,
          sensoryTriggers,
          goals,
          onboardingCompleted: true,
        },
      });

      return reply.status(201).send({
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
        profile: {
          id: profile.id,
          adhdType: profile.adhdType,
          struggles: profile.struggles,
          sensoryTriggers: profile.sensoryTriggers,
          goals: profile.goals,
          onboardingCompleted: profile.onboardingCompleted,
        },
      });
    },
  );
}
