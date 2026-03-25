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
        // New users (e.g. OAuth without prior invite) start with no access
        create: { id: userId, email, hasChatAccess: false },
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

  // ── Update Profile ─────────────────────────────────────────────────
  fastify.patch<{
    Body: {
      parentGender?: string;
      parentAgeRange?: string;
      householdStructure?: string;
      childName?: string;
      childAge?: number;
      childGender?: string;
    };
  }>(
    "/user/profile",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: userId } = request.user;
      const body = request.body ?? {};

      // Update parent profile fields
      const parentData: Record<string, string> = {};
      if (body.parentGender !== undefined) parentData.parentGender = body.parentGender;
      if (body.parentAgeRange !== undefined) parentData.parentAgeRange = body.parentAgeRange;
      if (body.householdStructure !== undefined) parentData.householdStructure = body.householdStructure;

      if (Object.keys(parentData).length > 0) {
        await fastify.prisma.userProfile.update({
          where: { userId },
          data: parentData,
        });
      }

      // Update child profile fields
      const childData: Record<string, string | number> = {};
      if (body.childName !== undefined) childData.childName = body.childName;
      if (body.childAge !== undefined) childData.childAge = body.childAge;
      if (body.childGender !== undefined) childData.childGender = body.childGender;

      if (Object.keys(childData).length > 0) {
        const profile = await fastify.prisma.userProfile.findUnique({
          where: { userId },
          include: { children: { select: { id: true } } },
        });
        const childId = profile?.children?.[0]?.id;
        if (childId) {
          await fastify.prisma.childProfile.update({
            where: { id: childId },
            data: childData,
          });
        }
      }

      return reply.send({ success: true });
    },
  );

  // ── Child Report ───────────────────────────────────────────────────
  fastify.get(
    "/user/child-report",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: userId } = request.user;

      const profile = await fastify.prisma.userProfile.findUnique({
        where: { userId },
        include: {
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
      });

      const child = profile?.children?.[0];
      if (!child || !child.traitProfile) {
        return reply.send({
          child: null,
          traitProfile: null,
          report: null,
        });
      }

      const tp = child.traitProfile as {
        scores: Record<string, number>;
        archetypeId: string;
        archetypeName?: string;
        archetypeTypeName?: string;
        pdfUrl?: string | null;
      };

      // Fetch the report template for this archetype
      let report = null;
      if (tp.archetypeId) {
        const template = await fastify.prisma.reportTemplate.findUnique({
          where: { archetypeId: tp.archetypeId },
        });

        if (template?.template) {
          // Render with child's name and gender
          const { renderReportTemplate } = await import(
            "@adhd-ai-assistant/shared"
          );
          report = renderReportTemplate(
            template.template as unknown as Parameters<typeof renderReportTemplate>[0],
            {
              name: child.childName || "your child",
              gender: child.childGender || "Other",
            },
          );
        }
      }

      return reply.send({
        child: {
          id: child.id,
          name: child.childName,
          age: child.childAge,
          gender: child.childGender,
        },
        traitProfile: tp,
        report,
      });
    },
  );

  // ── Memory Management ───────────────────────────────────────────────

  // GET /user/memories — list all memories for the authenticated user
  fastify.get(
    "/user/memories",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: userId } = request.user;

      const memories = await fastify.prisma.userMemory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fact: true,
          category: true,
          source: true,
          createdAt: true,
        },
      });

      return reply.send({ memories });
    },
  );

  // DELETE /user/memories/:id — delete a single memory (ownership verified)
  fastify.delete<{ Params: { id: string } }>(
    "/user/memories/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: userId } = request.user;
      const { id: memoryId } = request.params;

      const memory = await fastify.prisma.userMemory.findUnique({
        where: { id: memoryId },
        select: { userId: true },
      });

      if (!memory || memory.userId !== userId) {
        return reply.status(404).send({ error: "Memory not found" });
      }

      await fastify.prisma.userMemory.delete({ where: { id: memoryId } });

      return reply.send({ success: true });
    },
  );

  // DELETE /user/memories — clear ALL memories for the authenticated user
  fastify.delete(
    "/user/memories",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: userId } = request.user;

      const { count } = await fastify.prisma.userMemory.deleteMany({
        where: { userId },
      });

      return reply.send({ success: true, deleted: count });
    },
  );
}
