import { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { embedTexts } from "./embed.js";

const DEFAULT_TOP_K = 8;
const MIN_SCORE = 0.35;
const EMBEDDING_CACHE_TTL_MS = 60_000;
const RETRIEVAL_CACHE_TTL_MS = 30_000;
const MAX_EMBEDDING_CACHE = 2_000;
const MAX_RETRIEVAL_CACHE = 2_000;

export interface RetrievedSource {
  entryId: string;
  title: string;
  category: string;
  chunkIndex: number;
  text: string;
  score: number;
}

export interface RetrievalResult {
  sources: RetrievedSource[];
  retrievalMs: number;
  cacheHit: boolean;
}

const embeddingCache = new Map<
  string,
  { value: number[]; expiresAt: number; lastAccessedAt: number }
>();
const retrievalCache = new Map<
  string,
  { value: RetrievalResult; expiresAt: number; lastAccessedAt: number }
>();

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

function normalizeQuery(query: string) {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function evictLru<
  T extends { lastAccessedAt: number; expiresAt: number },
>(cache: Map<string, T>, maxSize: number) {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }

  if (cache.size < maxSize) return;

  let oldestKey: string | null = null;
  let oldestAccess = Number.POSITIVE_INFINITY;
  for (const [key, entry] of cache) {
    if (entry.lastAccessedAt < oldestAccess) {
      oldestAccess = entry.lastAccessedAt;
      oldestKey = key;
    }
  }

  if (oldestKey) cache.delete(oldestKey);
}

export function invalidateRetrievalCaches() {
  embeddingCache.clear();
  retrievalCache.clear();
}

export function rerankAndFilterSources(
  rows: Array<{
    entryId: string;
    title: string;
    category: string;
    chunkIndex: number;
    text: string;
    score: number | string;
  }>,
  query: string,
  minScore = MIN_SCORE,
  topK = DEFAULT_TOP_K,
): RetrievedSource[] {
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
    if (row.score < minScore) continue;
    deduped.push({
      entryId: row.entryId,
      title: row.title,
      category: row.category,
      chunkIndex: row.chunkIndex,
      text: row.text,
      score: row.score,
    });
  }

  return deduped.slice(0, topK);
}

async function getQueryEmbedding(normalizedQuery: string): Promise<{
  embedding: number[];
  cacheHit: boolean;
}> {
  const now = Date.now();
  const cached = embeddingCache.get(normalizedQuery);
  if (cached && cached.expiresAt > now) {
    cached.lastAccessedAt = now;
    embeddingCache.set(normalizedQuery, cached);
    return { embedding: cached.value, cacheHit: true };
  }

  const [queryEmbedding] = await embedTexts([normalizedQuery]);
  if (!queryEmbedding || queryEmbedding.length === 0) {
    return { embedding: [], cacheHit: false };
  }

  evictLru(embeddingCache, MAX_EMBEDDING_CACHE);
  embeddingCache.set(normalizedQuery, {
    value: queryEmbedding,
    expiresAt: now + EMBEDDING_CACHE_TTL_MS,
    lastAccessedAt: now,
  });

  return { embedding: queryEmbedding, cacheHit: false };
}

export async function retrieveRelevantKnowledge(
  fastify: FastifyInstance,
  query: string,
  topK = DEFAULT_TOP_K,
): Promise<RetrievalResult> {
  const start = Date.now();
  const normalizedQuery = normalizeQuery(query);
  const retrievalKey = `${normalizedQuery}::${topK}`;
  const now = Date.now();

  const cachedRetrieval = retrievalCache.get(retrievalKey);
  if (cachedRetrieval && cachedRetrieval.expiresAt > now) {
    cachedRetrieval.lastAccessedAt = now;
    retrievalCache.set(retrievalKey, cachedRetrieval);
    return {
      ...cachedRetrieval.value,
      cacheHit: true,
    };
  }

  const { embedding: queryEmbedding, cacheHit: embeddingCacheHit } =
    await getQueryEmbedding(normalizedQuery);
  if (queryEmbedding.length === 0) {
    return {
      sources: [],
      retrievalMs: Date.now() - start,
      cacheHit: embeddingCacheHit,
    };
  }

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

  const sources = rerankAndFilterSources(rows, normalizedQuery, MIN_SCORE, topK);
  const retrievalMs = Date.now() - start;
  const result: RetrievalResult = {
    sources,
    retrievalMs,
    cacheHit: embeddingCacheHit,
  };

  evictLru(retrievalCache, MAX_RETRIEVAL_CACHE);
  retrievalCache.set(retrievalKey, {
    value: result,
    expiresAt: Date.now() + RETRIEVAL_CACHE_TTL_MS,
    lastAccessedAt: Date.now(),
  });

  return result;
}

