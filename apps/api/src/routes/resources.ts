import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabaseAdmin.js";
import { reindexKnowledgeEntry } from "../services/ai/knowledgeIndex.js";
import { invalidateRetrievalCaches } from "../services/ai/retrieval.js";
import { createChatCompletion } from "../services/ai/geminiClient.js";

/** Robustly extract a string value from a @fastify/multipart field.
 *  Handles: plain strings, { value: string } objects, and arrays of either. */
function extractFieldValue(
  fields: Record<string, unknown>,
  name: string,
): string | undefined {
  let field = fields[name];
  if (!field) return undefined;
  // @fastify/multipart may wrap fields in an array
  if (Array.isArray(field)) field = field[0];
  if (typeof field === "string") return field.trim() || undefined;
  if (typeof field === "object" && field !== null) {
    // MultipartValue shape: { value: string, fieldname, ... }
    const val = (field as Record<string, unknown>).value;
    if (typeof val === "string") return val.trim() || undefined;
  }
  return undefined;
}

const BUCKET = "resources";
const ALLOWED_MIME = new Set(["application/pdf"]);
const SIGNED_URL_EXPIRY = 60; // seconds

const readRateLimitConfig = { rateLimit: { max: 60, timeWindow: "1 minute" } };
const writeRateLimitConfig = { rateLimit: { max: 20, timeWindow: "1 minute" } };

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

function buildCompanionContent(
  resourceId: string,
  filename: string,
  title: string,
  description: string,
): string {
  const lines = [`Downloadable PDF Resource: ${title}`];
  if (description) lines.push("", description);
  lines.push(
    "",
    `This is a downloadable resource available for parents. When recommending this resource, include this marker so a download link is shown: [download:${resourceId}:${filename}]`,
  );
  return lines.join("\n");
}

// In-memory store for pending bulk uploads (file buffers awaiting confirmation)
const pendingBulkUploads = new Map<
  string,
  {
    files: { buffer: Buffer; filename: string; mimetype: string }[];
    expiresAt: number;
  }
>();

// Cleanup expired batches every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, batch] of pendingBulkUploads) {
    if (batch.expiresAt < now) pendingBulkUploads.delete(id);
  }
}, 5 * 60 * 1000);

export default async function resourceRoutes(fastify: FastifyInstance) {
  const adminPreHandler = [
    fastify.authenticate,
    async (request: FastifyRequest, reply: FastifyReply) =>
      requireAdmin(fastify, request, reply),
  ];

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
      fastify.log.error({ error, action, targetType }, "resource.audit.failed");
    }
  }

  // ── Upload PDF ──
  fastify.post(
    "/admin/resources",
    { preHandler: adminPreHandler, config: writeRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return reply
          .status(503)
          .send({ error: "Storage not configured" });
      }

      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: "No file uploaded" });
      }

      if (!ALLOWED_MIME.has(data.mimetype)) {
        return reply
          .status(400)
          .send({ error: "Only PDF files are allowed" });
      }

      // Read multipart fields — handle various @fastify/multipart field shapes
      const fields = data.fields as Record<string, unknown>;
      const title = extractFieldValue(fields, "title");
      const description = extractFieldValue(fields, "description") ?? "";
      const category =
        extractFieldValue(fields, "category") || "Downloadable Resources";

      if (!title) {
        return reply.status(400).send({ error: "Title is required" });
      }

      const buffer = await data.toBuffer();
      const resourceId = randomUUID();
      const sanitizedName = data.filename
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 200);
      const storagePath = `${resourceId}/${sanitizedName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, {
          contentType: data.mimetype,
          upsert: false,
        });

      if (uploadError) {
        fastify.log.error({ error: uploadError }, "resource.upload.failed");
        return reply
          .status(500)
          .send({ error: "Failed to upload file to storage" });
      }

      try {
        // Create companion KnowledgeEntry for RAG discoverability
        const companionContent = buildCompanionContent(
          resourceId,
          sanitizedName,
          title,
          description,
        );

        const knowledgeEntry = await fastify.prisma.knowledgeEntry.create({
          data: {
            title: `PDF Resource: ${title}`,
            content: companionContent,
            category,
          },
        });

        // Create Resource row
        const resource = await fastify.prisma.resource.create({
          data: {
            id: resourceId,
            filename: sanitizedName,
            originalName: data.filename,
            mimeType: data.mimetype,
            sizeBytes: buffer.length,
            storagePath,
            title,
            description,
            category,
            knowledgeEntryId: knowledgeEntry.id,
          },
        });

        // Index the companion entry for vector search
        await reindexKnowledgeEntry(fastify, {
          id: knowledgeEntry.id,
          title: knowledgeEntry.title,
          category: knowledgeEntry.category,
          content: knowledgeEntry.content,
        });

        await audit(
          request.user.id,
          "admin.resource.upload",
          "resource",
          resource.id,
          { title, filename: sanitizedName, sizeBytes: buffer.length },
        );

        return reply.status(201).send({ resource });
      } catch (error) {
        // Clean up uploaded file if DB operations fail
        await supabase.storage.from(BUCKET).remove([storagePath]);
        throw error;
      }
    },
  );

  // ── Bulk Upload PDFs (multi-file) ──
  // Step 1: Upload files + get AI-generated metadata for review
  fastify.post(
    "/admin/resources/bulk-prepare",
    { preHandler: adminPreHandler, config: writeRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parts = request.parts();
      const files: { buffer: Buffer; filename: string; mimetype: string }[] = [];

      for await (const part of parts) {
        if (part.type === "file" && ALLOWED_MIME.has(part.mimetype)) {
          const buffer = await part.toBuffer();
          files.push({
            buffer,
            filename: part.filename,
            mimetype: part.mimetype,
          });
        }
      }

      if (files.length === 0) {
        return reply.status(400).send({ error: "No PDF files uploaded" });
      }

      // Generate AI titles + descriptions for each file
      const prepared = await Promise.all(
        files.map(async (f) => {
          const cleanName = f.filename
            .replace(/\.pdf$/i, "")
            .replace(/[-_]/g, " ");

          try {
            const { content } = await createChatCompletion(
              [
                {
                  role: "system",
                  content: `You generate metadata for ADHD parenting PDF resources. Given a filename, produce a JSON object with "title" (clear, parent-friendly title, max 60 chars) and "description" (1-2 sentence description of what this resource likely contains, focused on how it helps parents, max 200 chars) and "category" (short category like "Downloadable Resources", "Worksheets", "Checklists", "Guides"). Respond ONLY with the JSON object, no markdown.`,
                },
                { role: "user", content: `Filename: "${f.filename}"` },
              ],
              { timeoutMs: 10_000 },
            );

            const parsed = JSON.parse(content || "{}");
            return {
              filename: f.filename,
              sizeBytes: f.buffer.length,
              title: parsed.title || cleanName,
              description: parsed.description || "",
              category: parsed.category || "Downloadable Resources",
            };
          } catch {
            return {
              filename: f.filename,
              sizeBytes: f.buffer.length,
              title: cleanName,
              description: "",
              category: "Downloadable Resources",
            };
          }
        }),
      );

      // Store the buffers temporarily in memory (keyed by filename) for the confirm step
      const batchId = randomUUID();
      pendingBulkUploads.set(batchId, {
        files,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 min TTL
      });

      return reply.send({ batchId, files: prepared });
    },
  );

  // Step 2: Confirm bulk upload with reviewed/edited metadata
  fastify.post<{
    Body: {
      batchId: string;
      files: {
        filename: string;
        title: string;
        description: string;
        category: string;
      }[];
    };
  }>(
    "/admin/resources/bulk-confirm",
    { preHandler: adminPreHandler, config: writeRateLimitConfig },
    async (request, reply) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return reply.status(503).send({ error: "Storage not configured" });
      }

      const { batchId, files: metadata } = request.body;
      const pending = pendingBulkUploads.get(batchId);

      if (!pending || pending.expiresAt < Date.now()) {
        pendingBulkUploads.delete(batchId);
        return reply
          .status(400)
          .send({ error: "Batch expired or not found. Please re-upload." });
      }

      const results: {
        filename: string;
        success: boolean;
        error?: string;
        resourceId?: string;
      }[] = [];

      for (const meta of metadata) {
        const fileData = pending.files.find(
          (f) => f.filename === meta.filename,
        );
        if (!fileData) {
          results.push({
            filename: meta.filename,
            success: false,
            error: "File not found in batch",
          });
          continue;
        }

        const resourceId = randomUUID();
        const sanitizedName = fileData.filename
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .slice(0, 200);
        const storagePath = `${resourceId}/${sanitizedName}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, fileData.buffer, {
              contentType: fileData.mimetype,
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const companionContent = buildCompanionContent(
            resourceId,
            sanitizedName,
            meta.title,
            meta.description,
          );

          const knowledgeEntry = await fastify.prisma.knowledgeEntry.create({
            data: {
              title: `PDF Resource: ${meta.title}`,
              content: companionContent,
              category: meta.category,
            },
          });

          await fastify.prisma.resource.create({
            data: {
              id: resourceId,
              filename: sanitizedName,
              originalName: fileData.filename,
              mimeType: fileData.mimetype,
              sizeBytes: fileData.buffer.length,
              storagePath,
              title: meta.title,
              description: meta.description,
              category: meta.category,
              knowledgeEntryId: knowledgeEntry.id,
            },
          });

          await reindexKnowledgeEntry(fastify, {
            id: knowledgeEntry.id,
            title: knowledgeEntry.title,
            category: knowledgeEntry.category,
            content: knowledgeEntry.content,
          });

          results.push({ filename: meta.filename, success: true, resourceId });
        } catch (err) {
          results.push({
            filename: meta.filename,
            success: false,
            error: err instanceof Error ? err.message : "Upload failed",
          });
        }
      }

      pendingBulkUploads.delete(batchId);

      await audit(
        request.user.id,
        "admin.resource.bulk_upload",
        "resource",
        batchId,
        {
          total: metadata.length,
          succeeded: results.filter((r) => r.success).length,
        },
      );

      return reply.send({ results });
    },
  );

  // ── List resources ──
  fastify.get(
    "/admin/resources",
    { preHandler: adminPreHandler, config: readRateLimitConfig },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const resources = await fastify.prisma.resource.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          filename: true,
          originalName: true,
          sizeBytes: true,
          createdAt: true,
        },
      });
      return reply.send({ resources });
    },
  );

  // ── Update resource metadata ──
  fastify.patch<{
    Params: { id: string };
    Body: { title?: string; description?: string; category?: string };
  }>(
    "/admin/resources/:id",
    { preHandler: adminPreHandler, config: writeRateLimitConfig },
    async (request, reply) => {
      const { id } = request.params;
      const { title, description, category } = request.body;

      const resource = await fastify.prisma.resource.findUnique({
        where: { id },
      });
      if (!resource) {
        return reply.status(404).send({ error: "Resource not found" });
      }

      const updatedTitle = title?.trim() || resource.title;
      const updatedDescription =
        description !== undefined ? description.trim() : resource.description;
      const updatedCategory = category?.trim() || resource.category;

      // Update the Resource row
      const updated = await fastify.prisma.resource.update({
        where: { id },
        data: {
          title: updatedTitle,
          description: updatedDescription,
          category: updatedCategory,
        },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          filename: true,
          originalName: true,
          sizeBytes: true,
          createdAt: true,
        },
      });

      // Update companion KnowledgeEntry so RAG stays in sync
      if (resource.knowledgeEntryId) {
        const companionContent = buildCompanionContent(
          resource.id,
          resource.filename,
          updatedTitle,
          updatedDescription,
        );

        const knowledgeEntry = await fastify.prisma.knowledgeEntry.update({
          where: { id: resource.knowledgeEntryId },
          data: {
            title: `PDF Resource: ${updatedTitle}`,
            content: companionContent,
            category: updatedCategory,
          },
        });

        // Re-index so vector embeddings reflect the new metadata
        await reindexKnowledgeEntry(fastify, {
          id: knowledgeEntry.id,
          title: knowledgeEntry.title,
          category: knowledgeEntry.category,
          content: knowledgeEntry.content,
        });

        invalidateRetrievalCaches();
      }

      await audit(request.user.id, "admin.resource.update", "resource", id, {
        title: updatedTitle,
        category: updatedCategory,
      });

      return reply.send({ resource: updated });
    },
  );

  // ── Delete resource ──
  fastify.delete<{ Params: { id: string } }>(
    "/admin/resources/:id",
    { preHandler: adminPreHandler, config: writeRateLimitConfig },
    async (request, reply) => {
      const { id } = request.params;

      const resource = await fastify.prisma.resource.findUnique({
        where: { id },
      });
      if (!resource) {
        return reply.status(404).send({ error: "Resource not found" });
      }

      // Delete from Supabase Storage
      const supabase = getSupabaseAdmin();
      if (supabase) {
        await supabase.storage.from(BUCKET).remove([resource.storagePath]);
      }

      // Delete companion KnowledgeEntry (cascade deletes chunks)
      if (resource.knowledgeEntryId) {
        await fastify.prisma.knowledgeEntry.delete({
          where: { id: resource.knowledgeEntryId },
        });
      }

      await fastify.prisma.resource.delete({ where: { id } });
      invalidateRetrievalCaches();

      await audit(
        request.user.id,
        "admin.resource.delete",
        "resource",
        id,
        { title: resource.title, filename: resource.filename },
      );

      return reply.send({ success: true });
    },
  );

  // ── Get recommended resources for the current user ──
  fastify.get(
    "/resources/recommended",
    { preHandler: [fastify.authenticate], config: readRateLimitConfig },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id: userId } = request.user;
      const messages = await fastify.prisma.message.findMany({
        where: { conversation: { userId }, role: "ASSISTANT" },
        select: { content: true },
      });

      const DOWNLOAD_REGEX = /\[download:([a-f0-9-]+):[^\]]+\]/g;
      const resourceIds = new Set<string>();
      for (const msg of messages) {
        const re = new RegExp(DOWNLOAD_REGEX.source, "g");
        let match: RegExpExecArray | null;
        while ((match = re.exec(msg.content)) !== null) resourceIds.add(match[1]);
      }

      if (resourceIds.size === 0) return reply.send({ resources: [] });

      const resources = await fastify.prisma.resource.findMany({
        where: { id: { in: [...resourceIds] } },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          filename: true,
          originalName: true,
          sizeBytes: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.send({ resources });
    },
  );

  // ── Get resource metadata (authenticated users) ──
  fastify.get<{ Params: { id: string } }>(
    "/resources/:id",
    { preHandler: [fastify.authenticate], config: readRateLimitConfig },
    async (request, reply) => {
      const { id } = request.params;
      const resource = await fastify.prisma.resource.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          filename: true,
          originalName: true,
          sizeBytes: true,
        },
      });
      if (!resource) {
        return reply.status(404).send({ error: "Resource not found" });
      }
      return reply.send({ resource });
    },
  );

  // ── Download resource (authenticated users) ──
  fastify.get<{ Params: { id: string } }>(
    "/resources/:id/download",
    {
      preHandler: [fastify.authenticate],
      config: readRateLimitConfig,
    },
    async (request, reply) => {
      const { id } = request.params;

      const resource = await fastify.prisma.resource.findUnique({
        where: { id },
        select: { storagePath: true, originalName: true },
      });
      if (!resource) {
        return reply.status(404).send({ error: "Resource not found" });
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return reply.status(503).send({ error: "Storage not configured" });
      }

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(resource.storagePath, SIGNED_URL_EXPIRY);

      if (error || !data?.signedUrl) {
        fastify.log.error({ error }, "resource.signed_url.failed");
        return reply
          .status(500)
          .send({ error: "Failed to generate download link" });
      }

      return reply.send({
        url: data.signedUrl,
        filename: resource.originalName,
      });
    },
  );
}
