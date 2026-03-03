import type { FastifyInstance } from "fastify";

export default async function userRoutes(fastify: FastifyInstance) {
  // GET /user/me — return user info + profile for chat greeting & admin check
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
              onboardingResponses: true,
              traitProfile: true,
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      const responses =
        (user.profile?.onboardingResponses as Record<string, unknown>) ?? {};

      return reply.send({
        id: user.id,
        email: user.email,
        role: user.role,
        profile: {
          childName: (responses.childName as string) ?? "",
          onboardingCompleted: user.profile?.onboardingCompleted ?? false,
          traitProfile: user.profile?.traitProfile ?? null,
        },
      });
    },
  );
}
