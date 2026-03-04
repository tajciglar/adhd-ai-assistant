import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { reindexKnowledgeEntry } from "../services/ai/knowledgeIndex.js";
import { retrieveRelevantKnowledge } from "../services/ai/retrieval.js";

async function requireAdmin(
  fastify: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = await fastify.prisma.user.findUnique({
    where: { id: request.user.id },
  });

  if (!user || user.role !== "admin") {
    return reply.status(403).send({ error: "Admin access required" });
  }
}

const entryBodySchema = z.object({
  category: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(50000),
});

const bulkImportSchema = z.object({
  entries: z
    .array(
      z.object({
        category: z.string().min(1).max(200),
        title: z.string().min(1).max(500),
        content: z.string().min(1).max(50000),
      }),
    )
    .min(1)
    .max(500),
});

export default async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require auth + admin role
  const preHandler = [
    fastify.authenticate,
    async (request: FastifyRequest, reply: FastifyReply) =>
      requireAdmin(fastify, request, reply),
  ];

  // GET /admin/stats — dashboard stats
  fastify.get("/admin/stats", { preHandler }, async (_request, reply) => {
    const [totalEntries, totalUsers, categoryCounts] = await Promise.all([
      fastify.prisma.knowledgeEntry.count(),
      fastify.prisma.user.count(),
      fastify.prisma.knowledgeEntry.groupBy({
        by: ["category"],
        _count: { category: true },
        orderBy: { category: "asc" },
      }),
    ]);

    const entriesByCategory: Record<string, number> = {};
    for (const row of categoryCounts) {
      entriesByCategory[row.category] = row._count.category;
    }

    return reply.send({ totalEntries, totalUsers, entriesByCategory });
  });

  // GET /admin/entries — list all knowledge entries
  fastify.get<{ Querystring: { category?: string } }>(
    "/admin/entries",
    { preHandler },
    async (request, reply) => {
      const { category } = request.query as { category?: string };

      const where = category ? { category } : {};

      const entries = await fastify.prisma.knowledgeEntry.findMany({
        where,
        orderBy: [{ category: "asc" }, { title: "asc" }],
      });

      return reply.send({ entries });
    },
  );

  // GET /admin/entries/:id — get single entry
  fastify.get<{ Params: { id: string } }>(
    "/admin/entries/:id",
    { preHandler },
    async (request, reply) => {
      const { id } = request.params;

      const entry = await fastify.prisma.knowledgeEntry.findUnique({
        where: { id },
      });

      if (!entry) {
        return reply.status(404).send({ error: "Entry not found" });
      }

      return reply.send({ entry });
    },
  );

  // POST /admin/entries — create entry
  fastify.post("/admin/entries", { preHandler }, async (request, reply) => {
    const parsed = entryBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const entry = await fastify.prisma.knowledgeEntry.create({
      data: parsed.data,
    });

    try {
      await reindexKnowledgeEntry(fastify, entry);
    } catch (error) {
      fastify.log.error(
        { err: error instanceof Error ? error : new Error(String(error)), entryId: entry.id },
        "admin.indexing_failed",
      );
      await fastify.prisma.knowledgeEntry.delete({ where: { id: entry.id } });
      return reply.status(500).send({
        error: "Failed to index knowledge entry for retrieval",
      });
    }

    return reply.status(201).send({ entry });
  });

  // PUT /admin/entries/:id — update entry
  fastify.put<{ Params: { id: string } }>(
    "/admin/entries/:id",
    { preHandler },
    async (request, reply) => {
      const { id } = request.params;
      const parsed = entryBodySchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const existing = await fastify.prisma.knowledgeEntry.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.status(404).send({ error: "Entry not found" });
      }

      const entry = await fastify.prisma.knowledgeEntry.update({
        where: { id },
        data: parsed.data,
      });

      try {
        await reindexKnowledgeEntry(fastify, entry);
      } catch (error) {
        fastify.log.error(
        { err: error instanceof Error ? error : new Error(String(error)), entryId: entry.id },
        "admin.indexing_failed",
      );
        return reply.status(500).send({
          error: "Entry updated but failed to re-index for retrieval",
        });
      }

      return reply.send({ entry });
    },
  );

  // DELETE /admin/entries/:id — delete entry
  fastify.delete<{ Params: { id: string } }>(
    "/admin/entries/:id",
    { preHandler },
    async (request, reply) => {
      const { id } = request.params;

      const existing = await fastify.prisma.knowledgeEntry.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.status(404).send({ error: "Entry not found" });
      }

      await fastify.prisma.knowledgeEntry.delete({ where: { id } });

      return reply.send({ success: true });
    },
  );

  // POST /admin/entries/bulk — bulk import entries
  fastify.post(
    "/admin/entries/bulk",
    { preHandler },
    async (request, reply) => {
      const parsed = bulkImportSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const createdEntryIds: string[] = [];

      try {
        for (const row of parsed.data.entries) {
          const entry = await fastify.prisma.knowledgeEntry.create({
            data: row,
          });
          createdEntryIds.push(entry.id);
          await reindexKnowledgeEntry(fastify, entry);
        }
      } catch (error) {
        fastify.log.error(
          { err: error instanceof Error ? error : new Error(String(error)) },
          "admin.bulk_indexing_failed",
        );
        if (createdEntryIds.length > 0) {
          await fastify.prisma.knowledgeEntry.deleteMany({
            where: { id: { in: createdEntryIds } },
          });
        }
        return reply.status(500).send({
          error: "Bulk import failed while indexing entries",
        });
      }

      return reply.status(201).send({
        imported: createdEntryIds.length,
        total: parsed.data.entries.length,
      });
    },
  );

  // POST /admin/test-query — test retrieval without generating an answer
  fastify.post(
    "/admin/test-query",
    { preHandler },
    async (request, reply) => {
      const schema = z.object({ query: z.string().min(1).max(1000) });
      const parsed = schema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ error: "query is required" });
      }

      const { query } = parsed.data;

      try {
        const sources = await retrieveRelevantKnowledge(fastify, query, 10);

        fastify.log.info(
          {
            query: query.slice(0, 80),
            sourcesCount: sources.length,
            topScore: sources[0]?.score,
            topTitle: sources[0]?.title?.slice(0, 50),
          },
          "admin.test_query.result",
        );

        return reply.send({ sources });
      } catch (error) {
        fastify.log.error(
          { err: error instanceof Error ? error : new Error(String(error)) },
          "admin.test_query.failed",
        );
        return reply.status(500).send({ error: "Test query failed" });
      }
    },
  );
}
