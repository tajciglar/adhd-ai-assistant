import type { FastifyInstance } from "fastify";

export default async function userRoutes(fastify: FastifyInstance) {
  // GET /user/me — return user info + profile + children for chat & admin
  fastify.get(
    "/user/me",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: userId } = request.user;

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            select: {
              onboardingCompleted: true,
              parentGender: true,
              parentAgeRange: true,
              householdStructure: true,
              children: {
                select: {
                  id: true,
                  childName: true,
                  childAge: true,
                  childGender: true,
                  traitProfile: true,
                  onboardingCompleted: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      // Active child = first child (supports multiple in the future)
      const activeChild = user.profile?.children?.[0];

      return reply.send({
        id: user.id,
        email: user.email,
        role: user.role,
        profile: {
          onboardingCompleted: user.profile?.onboardingCompleted ?? false,
          parentGender: user.profile?.parentGender ?? null,
          parentAgeRange: user.profile?.parentAgeRange ?? null,
          householdStructure: user.profile?.householdStructure ?? null,
          children:
            user.profile?.children?.map((c) => ({
              id: c.id,
              childName: c.childName,
              childAge: c.childAge,
              childGender: c.childGender,
              traitProfile: c.traitProfile,
              onboardingCompleted: c.onboardingCompleted,
            })) ?? [],
          // Convenience: active child info for backward compat
          childName: activeChild?.childName ?? "",
          traitProfile: activeChild?.traitProfile ?? null,
        },
      });
    },
  );
}
