import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { reindexKnowledgeEntry } from "../services/ai/knowledgeIndex.js";
import {
  invalidateRetrievalCaches,
  retrieveRelevantKnowledge,
} from "../services/ai/retrieval.js";

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

const testQuerySchema = z.object({
  query: z.string().min(1).max(2000),
});

const reportTemplateSchema = z.object({
  archetypeId: z.string().min(1).max(120),
  title: z.string().min(1).max(500),
  innerVoiceQuote: z.string().min(1).max(2000),
  animalDescription: z.string().min(1).max(50000),
  aboutChild: z.string().min(1).max(50000),
  hiddenSuperpower: z.string().min(1).max(50000),
  brainSections: z
    .array(
      z.object({
        title: z.string().min(1).max(300),
        content: z.string().min(1).max(50000),
      }),
    )
    .min(1)
    .max(20),
  dayInLife: z.object({
    morning: z.string().min(1).max(50000),
    school: z.string().min(1).max(50000),
    afterSchool: z.string().min(1).max(50000),
    bedtime: z.string().min(1).max(50000),
  }),
  drains: z.array(z.string().min(1).max(2000)).min(1).max(40),
  fuels: z.array(z.string().min(1).max(2000)).min(1).max(40),
  overwhelm: z.string().min(1).max(50000),
  affirmations: z.array(z.string().min(1).max(2000)).min(1).max(40),
  doNotSay: z
    .array(
      z.object({
        insteadOf: z.string().min(1).max(2000),
        tryThis: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(40),
  closingLine: z.string().min(1).max(2000),
});

const readRateLimitConfig = { rateLimit: { max: 60, timeWindow: "1 minute" } };
const writeRateLimitConfig = { rateLimit: { max: 20, timeWindow: "1 minute" } };
const bulkRateLimitConfig = { rateLimit: { max: 5, timeWindow: "1 minute" } };

type BulkImportPayload = z.infer<typeof bulkImportSchema>;

export default async function adminRoutes(fastify: FastifyInstance) {
  const basePreHandler = [
    fastify.authenticate,
    async (request: FastifyRequest, reply: FastifyReply) =>
      requireAdmin(fastify, request, reply),
  ];

  const queuedJobs: string[] = [];
  let processingQueue = false;

  async function audit(
    actorUserId: string,
    action: string,
    targetType: string,
    targetId?: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      await fastify.prisma.adminAuditLog.create({
        data: {
          actorUserId,
          action,
          targetType,
          targetId,
          metadata: metadata as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      fastify.log.error({ error, action, targetType }, "admin.audit.failed");
    }
  }

  async function processImportJob(jobId: string) {
    const job = await fastify.prisma.adminImportJob.findUnique({
      where: { id: jobId },
    });
    if (!job || job.status !== "queued") return;

    const parsedPayload = bulkImportSchema.safeParse(
      (job.payload as BulkImportPayload) ?? {},
    );
    if (!parsedPayload.success) {
      await fastify.prisma.adminImportJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          error: "Invalid bulk import payload",
          finishedAt: new Date(),
        },
      });
      return;
    }

    const entries = parsedPayload.data.entries;
    await fastify.prisma.adminImportJob.update({
      where: { id: jobId },
      data: {
        status: "processing",
        startedAt: new Date(),
      },
    });

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let lastError = "";

    for (const entryData of entries) {
      try {
        const entry = await fastify.prisma.knowledgeEntry.create({
          data: entryData,
        });
        await reindexKnowledgeEntry(fastify, entry);
        succeeded += 1;
      } catch (error) {
        failed += 1;
        lastError = error instanceof Error ? error.message : "Unknown import error";
      } finally {
        processed += 1;
        await fastify.prisma.adminImportJob.update({
          where: { id: jobId },
          data: {
            processed,
            succeeded,
            failed,
            ...(lastError ? { error: lastError.slice(0, 1000) } : {}),
          },
        });
      }
    }

    const finalStatus = failed > 0 ? "completed_with_errors" : "completed";
    await fastify.prisma.adminImportJob.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        finishedAt: new Date(),
      },
    });

    await audit(job.createdById, "admin.bulk_import.complete", "knowledge_entry", jobId, {
      processed,
      succeeded,
      failed,
      status: finalStatus,
    });
  }

  async function processQueue() {
    if (processingQueue) return;
    processingQueue = true;

    try {
      while (queuedJobs.length > 0) {
        const jobId = queuedJobs.shift();
        if (!jobId) continue;
        await processImportJob(jobId);
      }
    } finally {
      processingQueue = false;
    }
  }

  function enqueueJob(jobId: string) {
    queuedJobs.push(jobId);
    void processQueue();
  }

  fastify.addHook("onReady", async () => {
    try {
      await fastify.prisma.adminImportJob.updateMany({
        where: { status: "processing" },
        data: { status: "queued" },
      });

      const jobs = await fastify.prisma.adminImportJob.findMany({
        where: { status: "queued" },
        select: { id: true },
        orderBy: { createdAt: "asc" },
        take: 100,
      });
      for (const job of jobs) {
        queuedJobs.push(job.id);
      }
      void processQueue();
    } catch (error) {
      // Keep API booting if local DB is behind migrations.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2021"
      ) {
        fastify.log.warn(
          "Skipping admin import queue bootstrap: missing admin_import_jobs table. Run prisma migrations.",
        );
        return;
      }

      throw error;
    }
  });

  fastify.get(
    "/admin/stats",
    { preHandler: basePreHandler, config: readRateLimitConfig },
    async (_request: FastifyRequest, reply: FastifyReply) => {
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
    },
  );

  fastify.get<{ Querystring: { category?: string } }>(
    "/admin/entries",
    { preHandler: basePreHandler, config: readRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { category } = request.query as { category?: string };
      const entries = await fastify.prisma.knowledgeEntry.findMany({
        where: category ? { category } : {},
        orderBy: [{ category: "asc" }, { title: "asc" }],
      });
      return reply.send({ entries });
    },
  );

  fastify.get<{ Params: { id: string } }>(
    "/admin/entries/:id",
    { preHandler: basePreHandler, config: readRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
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

  fastify.post(
    "/admin/entries",
    { preHandler: basePreHandler, config: writeRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
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
        fastify.log.error({ error, entryId: entry.id }, "admin.indexing_failed");
        await fastify.prisma.knowledgeEntry.delete({ where: { id: entry.id } });
        return reply.status(500).send({
          error: "Failed to index knowledge entry for retrieval",
        });
      }

      await audit(request.user.id, "admin.entry.create", "knowledge_entry", entry.id, {
        category: entry.category,
      });

      return reply.status(201).send({ entry });
    },
  );

  fastify.put<{ Params: { id: string } }>(
    "/admin/entries/:id",
    { preHandler: basePreHandler, config: writeRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
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
        fastify.log.error({ error, entryId: entry.id }, "admin.indexing_failed");
        return reply.status(500).send({
          error: "Entry updated but failed to re-index for retrieval",
        });
      }

      await audit(request.user.id, "admin.entry.update", "knowledge_entry", entry.id, {
        category: entry.category,
      });

      return reply.send({ entry });
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/admin/entries/:id",
    { preHandler: basePreHandler, config: writeRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params;
      const existing = await fastify.prisma.knowledgeEntry.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.status(404).send({ error: "Entry not found" });
      }

      await fastify.prisma.knowledgeEntry.delete({ where: { id } });
      invalidateRetrievalCaches();
      await audit(request.user.id, "admin.entry.delete", "knowledge_entry", id, {
        category: existing.category,
      });

      return reply.send({ success: true });
    },
  );

  fastify.post(
    "/admin/entries/bulk",
    { preHandler: basePreHandler, config: bulkRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = bulkImportSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const job = await fastify.prisma.adminImportJob.create({
        data: {
          createdById: request.user.id,
          status: "queued",
          total: parsed.data.entries.length,
          payload: parsed.data as unknown as Prisma.InputJsonValue,
        },
      });

      enqueueJob(job.id);
      await audit(request.user.id, "admin.bulk_import.start", "admin_import_job", job.id, {
        total: parsed.data.entries.length,
      });

      return reply.status(202).send({
        jobId: job.id,
        status: job.status,
        total: job.total,
      });
    },
  );

  fastify.get<{ Params: { id: string } }>(
    "/admin/jobs/:id",
    { preHandler: basePreHandler, config: readRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params;
      const job = await fastify.prisma.adminImportJob.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          total: true,
          processed: true,
          succeeded: true,
          failed: true,
          error: true,
          startedAt: true,
          finishedAt: true,
          createdAt: true,
          updatedAt: true,
          createdById: true,
        },
      });

      if (!job) {
        return reply.status(404).send({ error: "Job not found" });
      }

      return reply.send({ job });
    },
  );

  fastify.post(
    "/admin/test-query",
    { preHandler: basePreHandler, config: readRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = testQuerySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { query } = parsed.data;

      try {
        const result = await retrieveRelevantKnowledge(fastify, query, 8);
        return reply.send({
          query,
          sources: result.sources,
          totalRetrieved: result.sources.length,
          retrievalMs: result.retrievalMs,
          cacheHit: result.cacheHit,
        });
      } catch (error) {
        fastify.log.error({ error }, "admin.test_query_failed");
        return reply.status(500).send({
          error: "Failed to run test query. Make sure the vector extension is enabled.",
        });
      }
    },
  );

  fastify.get(
    "/admin/report-templates",
    { preHandler: basePreHandler, config: readRateLimitConfig },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const templates = await fastify.prisma.reportTemplate.findMany({
        orderBy: { archetypeId: "asc" },
        select: {
          id: true,
          archetypeId: true,
          template: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.send({ templates });
    },
  );

  fastify.post(
    "/admin/report-templates",
    { preHandler: basePreHandler, config: writeRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = reportTemplateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const existing = await fastify.prisma.reportTemplate.findUnique({
        where: { archetypeId: parsed.data.archetypeId },
        select: { id: true },
      });
      if (existing) {
        return reply.status(409).send({
          error: "Template for this archetype already exists",
        });
      }

      const template = await fastify.prisma.reportTemplate.create({
        data: {
          archetypeId: parsed.data.archetypeId,
          template: parsed.data as unknown as Prisma.InputJsonValue,
        },
        select: {
          id: true,
          archetypeId: true,
          template: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await audit(request.user.id, "admin.report_template.create", "report_template", template.id, {
        archetypeId: template.archetypeId,
      });

      return reply.status(201).send({ template });
    },
  );

  fastify.put<{ Params: { id: string } }>(
    "/admin/report-templates/:id",
    { preHandler: basePreHandler, config: writeRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params;
      const parsed = reportTemplateSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const existing = await fastify.prisma.reportTemplate.findUnique({
        where: { id },
        select: { id: true, archetypeId: true },
      });
      if (!existing) {
        return reply.status(404).send({ error: "Report template not found" });
      }

      const conflict = await fastify.prisma.reportTemplate.findFirst({
        where: {
          archetypeId: parsed.data.archetypeId,
          NOT: { id },
        },
        select: { id: true },
      });
      if (conflict) {
        return reply.status(409).send({
          error: "Template for this archetype already exists",
        });
      }

      const template = await fastify.prisma.reportTemplate.update({
        where: { id },
        data: {
          archetypeId: parsed.data.archetypeId,
          template: parsed.data as unknown as Prisma.InputJsonValue,
        },
        select: {
          id: true,
          archetypeId: true,
          template: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await audit(request.user.id, "admin.report_template.update", "report_template", template.id, {
        archetypeId: template.archetypeId,
      });

      return reply.send({ template });
    },
  );
}
