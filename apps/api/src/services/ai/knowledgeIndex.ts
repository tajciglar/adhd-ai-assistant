import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { splitIntoChunks } from "./chunking.js";
import { embedTexts } from "./embed.js";

interface KnowledgeEntryForIndexing {
  id: string;
  title: string;
  category: string;
  content: string;
}

function toVectorLiteral(vector: number[]): string {
  const safe = vector.map((v) => Number(v).toFixed(8));
  return `[${safe.join(",")}]`;
}

function buildSearchableText(entry: KnowledgeEntryForIndexing, chunkText: string) {
  return `Category: ${entry.category}\nTitle: ${entry.title}\n${chunkText}`;
}

export async function reindexKnowledgeEntry(
  fastify: FastifyInstance,
  entry: KnowledgeEntryForIndexing,
): Promise<{ chunksIndexed: number }> {
  const chunks = splitIntoChunks(entry.content);
  const fallback = chunks.length > 0 ? chunks : splitIntoChunks(entry.title);

  if (fallback.length === 0) {
    await fastify.prisma.$executeRaw(
      Prisma.sql`DELETE FROM "knowledge_chunks" WHERE "entry_id" = ${entry.id}`,
    );
    return { chunksIndexed: 0 };
  }

  const searchable = fallback.map((chunk) => buildSearchableText(entry, chunk.text));
  const embeddings = await embedTexts(searchable);

  // Build all chunk insert statements for a single transaction
  const insertStatements = fallback.map((chunk, i) => {
    const embedding = embeddings[i];
    const vectorLiteral = toVectorLiteral(embedding);

    return Prisma.sql`
      INSERT INTO "knowledge_chunks" (
        "id",
        "entry_id",
        "chunk_index",
        "text",
        "token_count",
        "embedding",
        "created_at",
        "updated_at"
      ) VALUES (
        ${randomUUID()},
        ${entry.id},
        ${chunk.chunkIndex},
        ${chunk.text},
        ${chunk.tokenCount},
        ${vectorLiteral}::vector,
        NOW(),
        NOW()
      )
    `;
  });

  // Delete old chunks + insert all new chunks in a single transaction
  await fastify.prisma.$transaction([
    fastify.prisma.$executeRaw(
      Prisma.sql`DELETE FROM "knowledge_chunks" WHERE "entry_id" = ${entry.id}`,
    ),
    ...insertStatements.map((sql) => fastify.prisma.$executeRaw(sql)),
  ]);

  return { chunksIndexed: fallback.length };
}
