import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { reindexKnowledgeEntry } from "../services/ai/knowledgeIndex.js";
import { generateGroundedAnswer } from "../services/ai/answer.js";
import {
  invalidateRetrievalCaches,
  retrieveRelevantKnowledge,
} from "../services/ai/retrieval.js";
import { getQuizAnalytics } from "../services/quizAnalytics.js";
import { getSupabaseAdmin } from "../services/supabaseAdmin.js";
import {
  classifyContent,
  parseDocumentIntoEntries,
} from "../services/ai/categorize.js";

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

const classifySchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(10000),
});

const parseDocumentSchema = z.object({
  documentText: z.string().min(1).max(500000),
  moduleName: z.string().max(200).optional(),
});

const checkDuplicatesSchema = z.object({
  entries: z
    .array(
      z.object({
        title: z.string().min(1).max(500),
        content: z.string().max(50000).optional(),
      }),
    )
    .min(1)
    .max(500),
});

const reportTemplateSchema = z.object({
  archetypeId: z.string().min(1).max(120),
  title: z.string().min(1).max(500),
  innerVoiceQuote: z.string().min(1).max(2000),
  animalDescription: z.string().min(1).max(50000),
  aboutChild: z.string().min(1).max(50000),
  hiddenGift: z.string().max(50000).optional().default(""),
  aboutBrain: z.string().max(50000).optional().default(""),
  brainSections: z
    .array(
      z.object({
        title: z.string().max(300),
        content: z.string().max(50000),
      }),
    )
    .max(20)
    .optional()
    .default([]),
  dayInLife: z.object({
    morning: z.string().max(50000).optional().default(""),
    school: z.string().max(50000).optional().default(""),
    afterSchool: z.string().max(50000).optional().default(""),
    bedtime: z.string().max(50000).optional().default(""),
  }),
  drains: z.array(z.string().min(1).max(2000)).max(40).optional().default([]),
  fuels: z.array(z.string().min(1).max(2000)).max(40).optional().default([]),
  overwhelm: z.string().max(50000).optional().default(""),
  affirmations: z
    .array(
      z.object({
        when: z.string().max(2000).optional().default(""),
        say: z.string().max(2000),
      }),
    )
    .max(40)
    .optional()
    .default([]),
  doNotSay: z
    .array(
      z.object({
        when: z.string().max(2000).optional().default(""),
        insteadOf: z.string().max(2000),
        tryThis: z.string().max(2000),
      }),
    )
    .max(40)
    .optional()
    .default([]),
  closingLine: z.string().max(2000).optional().default(""),
  whatHelps: z
    .object({
      aboutChild: z.string().max(50000).optional(),
      hiddenGift: z.string().max(50000).optional(),
      brain: z.string().max(50000).optional(),
      morning: z.string().max(50000).optional(),
      school: z.string().max(50000).optional(),
      afterSchool: z.string().max(50000).optional(),
      bedtime: z.string().max(50000).optional(),
      overwhelm: z.string().max(50000).optional(),
    })
    .optional(),
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
      const [totalEntries, totalUsers, categoryCounts, totalLikes, totalDislikes] = await Promise.all([
        fastify.prisma.knowledgeEntry.count(),
        fastify.prisma.user.count(),
        fastify.prisma.knowledgeEntry.groupBy({
          by: ["category"],
          _count: { category: true },
          orderBy: { category: "asc" },
        }),
        fastify.prisma.messageFeedback.count({ where: { rating: 1 } }),
        fastify.prisma.messageFeedback.count({ where: { rating: -1 } }),
      ]);

      const entriesByCategory: Record<string, number> = {};
      for (const row of categoryCounts) {
        entriesByCategory[row.category] = row._count.category;
      }

      return reply.send({ totalEntries, totalUsers, entriesByCategory, totalLikes, totalDislikes });
    },
  );

  // GET /admin/feedback — recent feedback with message context
  fastify.get(
    "/admin/feedback",
    { preHandler: basePreHandler, config: readRateLimitConfig },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const recentFeedback = await fastify.prisma.messageFeedback.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          rating: true,
          createdAt: true,
          userId: true,
          message: {
            select: {
              content: true,
              role: true,
              conversation: {
                select: { title: true },
              },
            },
          },
        },
      });

      return reply.send({ feedback: recentFeedback });
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
    async (request, reply) => {
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
    async (request, reply) => {
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
        const answerPreview = await generateGroundedAnswer({
          fastify,
          userId: request.user.id,
          question: query,
          history: [],
          enablePostProcessing: false,
        });

        return reply.send({
          query,
          sources: result.sources,
          totalRetrieved: result.sources.length,
          retrievalMs: result.retrievalMs,
          cacheHit: result.cacheHit,
          answerPreview: answerPreview.content,
          answerMetadata: answerPreview.metadata,
        });
      } catch (error) {
        fastify.log.error({ error }, "admin.test_query_failed");
        return reply.status(500).send({
          error: "Failed to run test query. Make sure the vector extension is enabled.",
        });
      }
    },
  );

  // ── Rename Category (bulk update all entries) ─────────────────────────
  fastify.patch<{ Body: { oldName: string; newName: string } }>(
    "/admin/entries/rename-category",
    { preHandler: basePreHandler, config: writeRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { oldName, newName } = request.body as {
        oldName: string;
        newName: string;
      };

      if (!oldName?.trim() || !newName?.trim()) {
        return reply
          .status(400)
          .send({ error: "Both oldName and newName are required" });
      }

      const trimmedOld = oldName.trim();
      const trimmedNew = newName.trim();

      if (trimmedOld === trimmedNew) {
        return reply.send({ success: true, updated: 0 });
      }

      const { count } = await fastify.prisma.knowledgeEntry.updateMany({
        where: { category: trimmedOld },
        data: { category: trimmedNew },
      });

      await audit(
        request.user.id,
        "admin.rename_category",
        "knowledge_entry",
        undefined,
        { oldName: trimmedOld, newName: trimmedNew, entriesUpdated: count },
      );

      return reply.send({ success: true, updated: count });
    },
  );

  // ── AI Classification ──────────────────────────────────────────────────
  fastify.post(
    "/admin/entries/classify",
    { preHandler: basePreHandler, config: writeRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = classifySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      try {
        const result = await classifyContent({
          title: parsed.data.title,
          content: parsed.data.content,
          prisma: fastify.prisma,
        });

        await audit(
          request.user.id,
          "admin.entry.classify",
          "knowledge_entry",
          undefined,
          { suggestedCategory: result.category, isNew: result.isNew },
        );

        return reply.send(result);
      } catch (error) {
        fastify.log.error({ error }, "admin.classify_failed");
        return reply.status(500).send({
          error: "Failed to classify content. Please try again.",
        });
      }
    },
  );

  fastify.post(
    "/admin/entries/parse-document",
    { preHandler: basePreHandler, config: bulkRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = parseDocumentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      try {
        const entries = await parseDocumentIntoEntries({
          documentText: parsed.data.documentText,
          moduleName: parsed.data.moduleName,
          prisma: fastify.prisma,
        });

        await audit(
          request.user.id,
          "admin.entry.parse_document",
          "knowledge_entry",
          undefined,
          {
            moduleName: parsed.data.moduleName,
            entriesFound: entries.length,
            inputLength: parsed.data.documentText.length,
          },
        );

        return reply.send({ entries });
      } catch (error) {
        fastify.log.error({ error }, "admin.parse_document_failed");
        const message =
          error instanceof Error ? error.message : "Failed to parse document";
        return reply.status(500).send({ error: message });
      }
    },
  );

  // ── Duplicate Detection ──────────────────────────────────────────────────
  fastify.post(
    "/admin/entries/check-duplicates",
    { preHandler: basePreHandler, config: readRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = checkDuplicatesSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const existingEntries = await fastify.prisma.knowledgeEntry.findMany({
        select: { id: true, title: true, category: true },
      });

      // Build a map of lowercased titles for fast lookup
      const exactMap = new Map<string, { id: string; title: string; category: string }>();
      for (const e of existingEntries) {
        exactMap.set(e.title.toLowerCase().trim(), e);
      }

      // Simple word-overlap similarity
      function wordOverlap(a: string, b: string): number {
        const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
        const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
        if (wordsA.size === 0 || wordsB.size === 0) return 0;
        let overlap = 0;
        for (const w of wordsA) {
          if (wordsB.has(w)) overlap++;
        }
        return overlap / Math.max(wordsA.size, wordsB.size);
      }

      const results = parsed.data.entries.map((entry, index) => {
        const titleLower = entry.title.toLowerCase().trim();

        // Check exact match
        const exact = exactMap.get(titleLower);
        if (exact) {
          return {
            index,
            status: "duplicate" as const,
            existingEntryId: exact.id,
            existingTitle: exact.title,
            existingCategory: exact.category,
          };
        }

        // Check fuzzy similarity
        let bestMatch: { id: string; title: string; category: string; score: number } | null = null;
        for (const e of existingEntries) {
          const score = wordOverlap(entry.title, e.title);
          if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { id: e.id, title: e.title, category: e.category, score };
          }
        }

        if (bestMatch) {
          return {
            index,
            status: "similar" as const,
            existingEntryId: bestMatch.id,
            existingTitle: bestMatch.title,
            existingCategory: bestMatch.category,
          };
        }

        return { index, status: "new" as const };
      });

      return reply.send({ results });
    },
  );

  // ── Token Usage Analytics ───────────────────────────────────────────────
  fastify.get(
    "/admin/token-usage",
    { preHandler: basePreHandler, config: readRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { days } = request.query as { days?: string };
      const numDays = Math.min(Math.max(Number(days) || 7, 1), 90);

      try {
        const since = new Date();
        since.setDate(since.getDate() - numDays);

        const messages = await fastify.prisma.message.findMany({
          where: {
            role: "ASSISTANT",
            createdAt: { gte: since },
          },
          select: {
            createdAt: true,
            metadata: true,
          },
          orderBy: { createdAt: "asc" },
        });

        // Aggregate by day
        const dailyMap = new Map<
          string,
          { promptTokens: number; completionTokens: number; totalTokens: number; messageCount: number }
        >();

        let totalPromptTokens = 0;
        let totalCompletionTokens = 0;
        let totalTokens = 0;
        let totalMessages = 0;

        for (const msg of messages) {
          const usage = (msg.metadata as Record<string, unknown>)?.usage as
            | { promptTokens?: number; completionTokens?: number; totalTokens?: number }
            | undefined;

          if (!usage) continue;

          const day = msg.createdAt.toISOString().slice(0, 10);
          const existing = dailyMap.get(day) ?? {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            messageCount: 0,
          };

          const pt = usage.promptTokens ?? 0;
          const ct = usage.completionTokens ?? 0;
          const tt = usage.totalTokens ?? pt + ct;

          existing.promptTokens += pt;
          existing.completionTokens += ct;
          existing.totalTokens += tt;
          existing.messageCount += 1;
          dailyMap.set(day, existing);

          totalPromptTokens += pt;
          totalCompletionTokens += ct;
          totalTokens += tt;
          totalMessages += 1;
        }

        const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
          date,
          ...data,
        }));

        // Gemini 2.5 Flash pricing: $0.15/M input, $0.60/M output
        const estimatedCost =
          (totalPromptTokens / 1_000_000) * 0.15 +
          (totalCompletionTokens / 1_000_000) * 0.6;

        return reply.send({
          totalPromptTokens,
          totalCompletionTokens,
          totalTokens,
          totalMessages,
          estimatedCost: Math.round(estimatedCost * 10000) / 10000,
          avgTokensPerResponse:
            totalMessages > 0 ? Math.round(totalTokens / totalMessages) : 0,
          daily,
          days: numDays,
        });
      } catch (error) {
        fastify.log.error({ error }, "admin.token_usage_failed");
        return reply.status(500).send({
          error: "Failed to fetch token usage analytics",
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
    async (request, reply) => {
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

  // ── Quiz Analytics ────────────────────────────────────────────────────────
  fastify.get(
    "/admin/quiz-analytics",
    { preHandler: basePreHandler, config: readRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { days } = request.query as { days?: string };
      const numDays = Math.min(Math.max(Number(days) || 7, 1), 90);

      try {
        const analytics = await getQuizAnalytics(numDays);
        return reply.send(analytics);
      } catch (err) {
        fastify.log.error({ err }, "admin.quiz_analytics.query_failed");
        return reply.status(500).send({ error: "Failed to fetch quiz analytics" });
      }
    },
  );

  // ── Conversation Insights ──────────────────────────────────────────────────
  fastify.get(
    "/admin/conversation-insights",
    { preHandler: basePreHandler, config: readRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { days } = request.query as { days?: string };
      const numDays = Math.min(Math.max(Number(days) || 30, 1), 90);
      const since = new Date();
      since.setDate(since.getDate() - numDays);

      try {
        // Top topics by count
        const topTopics = await fastify.prisma.conversationInsight.groupBy({
          by: ["topic"],
          where: { createdAt: { gte: since } },
          _count: { topic: true },
          _avg: { retrievalScore: true },
          orderBy: { _count: { topic: "desc" } },
          take: 15,
        });

        // Content gaps: topics with low avg retrieval scores
        const contentGaps = await fastify.prisma.conversationInsight.groupBy({
          by: ["topic"],
          where: {
            createdAt: { gte: since },
            hadSufficientSources: false,
          },
          _count: { topic: true },
          _avg: { retrievalScore: true },
          orderBy: { _count: { topic: "desc" } },
          take: 10,
        });

        // Topics by archetype
        const archetypeTopics = await fastify.prisma.conversationInsight.groupBy({
          by: ["archetypeId", "topic"],
          where: {
            createdAt: { gte: since },
            archetypeId: { not: null },
          },
          _count: { topic: true },
          orderBy: { _count: { topic: "desc" } },
          take: 30,
        });

        // Total conversations in period
        const totalCount = await fastify.prisma.conversationInsight.count({
          where: { createdAt: { gte: since } },
        });

        return reply.send({
          period: { days: numDays, since: since.toISOString() },
          totalConversations: totalCount,
          topTopics: topTopics.map((t) => ({
            topic: t.topic,
            count: t._count.topic,
            avgRetrievalScore: Number((t._avg.retrievalScore ?? 0).toFixed(3)),
          })),
          contentGaps: contentGaps.map((t) => ({
            topic: t.topic,
            count: t._count.topic,
            avgRetrievalScore: Number((t._avg.retrievalScore ?? 0).toFixed(3)),
          })),
          archetypeTopics: archetypeTopics.map((t) => ({
            archetypeId: t.archetypeId,
            topic: t.topic,
            count: t._count.topic,
          })),
        });
      } catch (err) {
        fastify.log.error({ err }, "admin.conversation_insights.query_failed");
        return reply.status(500).send({ error: "Failed to fetch conversation insights" });
      }
    },
  );

  // ── Invite user by email ──
  fastify.post<{ Body: { email: string } }>(
    "/admin/invite-user",
    { preHandler: basePreHandler },
    async (request, reply) => {
      const { email } = request.body;
      if (!email?.trim()) {
        return reply.status(400).send({ error: "Email is required" });
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return reply.status(503).send({ error: "Supabase admin not configured" });
      }

      const appUrl = process.env.APP_URL || "http://localhost:5173";
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${appUrl}/set-password` },
      );

      if (error) {
        fastify.log.error({ error, email }, "admin.invite_user.failed");
        return reply.status(400).send({ error: error.message });
      }

      // Pre-create the DB user with chat access so they land on /dashboard after setting their password
      await fastify.prisma.user.upsert({
        where: { id: data.user.id },
        update: { hasChatAccess: true },
        create: { id: data.user.id, email: data.user.email!, hasChatAccess: true },
      });

      await audit(request.user.id, "admin.invite_user", "user", data.user.id, { email });
      return reply.send({ success: true, email: data.user.email });
    },
  );
}
