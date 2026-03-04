import { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { embedTexts } from "./embed.js";

const DEFAULT_TOP_K = 8;
const MIN_SCORE = 0.35;

export interface RetrievedSource {
  entryId: string;
  title: string;
  category: string;
  chunkIndex: number;
  text: string;
  score: number;
}

function toVectorLiteral(vector: number[]): string {
  const safe = vector.map((v) => Number(v).toFixed(8));
  return `[${safe.join(",")}]`;
}

function keywordBonus(query: string, title: string, category: string, text: string) {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 4);

  if (terms.length === 0) return 0;

  const haystack = `${title} ${category} ${text}`.toLowerCase();
  let hits = 0;

  for (const term of terms) {
    if (haystack.includes(term)) hits += 1;
  }

  return Math.min(0.12, hits * 0.02);
}

export async function retrieveRelevantKnowledge(
  fastify: FastifyInstance,
  query: string,
  topK = DEFAULT_TOP_K,
): Promise<RetrievedSource[]> {
  const embedStart = Date.now();
  const [queryEmbedding] = await embedTexts([query]);
  if (!queryEmbedding || queryEmbedding.length === 0) {
    fastify.log.warn("retrieval.embed — empty embedding, returning []");
    return [];
  }

  fastify.log.info(
    { dim: queryEmbedding.length, latencyMs: Date.now() - embedStart },
    "retrieval.embed",
  );

  const searchStart = Date.now();
  const vectorLiteral = toVectorLiteral(queryEmbedding);
  const sql = Prisma.sql`
    SELECT
      kc."entry_id" AS "entryId",
      ke."title" AS "title",
      ke."category" AS "category",
      kc."chunk_index" AS "chunkIndex",
      kc."text" AS "text",
      (1 - (kc."embedding" <=> ${vectorLiteral}::vector)) AS "score"
    FROM "knowledge_chunks" kc
    INNER JOIN "knowledge_entries" ke ON ke."id" = kc."entry_id"
    ORDER BY kc."embedding" <=> ${vectorLiteral}::vector
    LIMIT ${topK}
  `;

  const rows = (await fastify.prisma.$queryRaw(sql)) as Array<{
    entryId: string;
    title: string;
    category: string;
    chunkIndex: number;
    text: string;
    score: number | string;
  }>;

  fastify.log.info(
    {
      rowCount: rows.length,
      topScore: rows[0] ? Number(rows[0].score).toFixed(4) : null,
      latencyMs: Date.now() - searchStart,
    },
    "retrieval.search",
  );

  const adjusted = rows
    .map((row) => {
      const score = Number(row.score);
      const bonus = keywordBonus(query, row.title, row.category, row.text);
      return {
        ...row,
        score: score + bonus,
      };
    })
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const deduped: RetrievedSource[] = [];

  for (const row of adjusted) {
    const key = `${row.entryId}:${row.chunkIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (row.score < MIN_SCORE) continue;

    deduped.push({
      entryId: row.entryId,
      title: row.title,
      category: row.category,
      chunkIndex: row.chunkIndex,
      text: row.text,
      score: row.score,
    });
  }

  const result = deduped.slice(0, topK);

  fastify.log.info(
    {
      before: rows.length,
      afterFilter: result.length,
      minScore: MIN_SCORE,
    },
    "retrieval.filter",
  );

  return result;
}

