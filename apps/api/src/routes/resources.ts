import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabaseAdmin.js";
import { reindexKnowledgeEntry } from "../services/ai/knowledgeIndex.js";
import { invalidateRetrievalCaches } from "../services/ai/retrieval.js";

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

      // Read multipart fields
      const fields = data.fields as Record<
        string,
        { value?: string } | undefined
      >;
      const title = fields.title?.value?.trim();
      const description = fields.description?.value?.trim() ?? "";
      const category =
        fields.category?.value?.trim() || "Downloadable Resources";

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
