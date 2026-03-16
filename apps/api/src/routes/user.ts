import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { tryImportFromQuiz } from "../services/quizImport.js";

type ChildSelect = Prisma.ChildProfileGetPayload<{
  select: {
    id: true;
    childName: true;
    childAge: true;
    childGender: true;
    traitProfile: true;
    onboardingCompleted: true;
  };
}>;

export default async function userRoutes(fastify: FastifyInstance) {
  // GET /user/me — return user info + profile + children for chat & admin
  fastify.get(
    "/user/me",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: userId, email } = request.user;

      // Ensure user exists in our DB (may be first login via Supabase)
      await fastify.prisma.user.upsert({
        where: { id: userId },
        update: {},
        // All email/password signups get chat access automatically
        create: { id: userId, email, hasChatAccess: true },
      });

      // Try importing quiz data if no profile exists yet
      const existingProfile = await fastify.prisma.userProfile.findUnique({
        where: { userId },
        select: { onboardingCompleted: true },
      });

      if (!existingProfile?.onboardingCompleted) {
        try {
          await tryImportFromQuiz(fastify, userId, email);
        } catch (err) {
          fastify.log.warn({ err, userId }, "user.me.quiz_import_failed");
        }
      }

      // Fetch full user data (including any just-imported profile)
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

      const activeChild = user.profile?.children?.[0];

      return reply.send({
        id: user.id,
        email: user.email,
        role: user.role,
        hasChatAccess: user.hasChatAccess,
        profile: {
          onboardingCompleted: user.profile?.onboardingCompleted ?? false,
          parentGender: user.profile?.parentGender ?? null,
          parentAgeRange: user.profile?.parentAgeRange ?? null,
          householdStructure: user.profile?.householdStructure ?? null,
          children:
            user.profile?.children?.map((c: ChildSelect) => ({
              id: c.id,
              childName: c.childName,
              childAge: c.childAge,
              childGender: c.childGender,
              traitProfile: c.traitProfile,
              onboardingCompleted: c.onboardingCompleted,
            })) ?? [],
          childName: activeChild?.childName ?? "",
          traitProfile: activeChild?.traitProfile ?? null,
        },
      });
    },
  );
}
