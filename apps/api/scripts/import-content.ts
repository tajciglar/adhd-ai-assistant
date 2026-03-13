/**
 * Import script: Parses the 21-Day ADHD Self-Esteem doc,
 * maps 25 parent questions to relevant day content,
 * creates KnowledgeEntry records and indexes them for RAG retrieval.
 *
 * Usage:
 *   pnpm --filter @adhd-ai-assistant/api import-content
 *
 * Requires:
 *   - DATABASE_URL env var (or .env file)
 *   - GEMINI_API_KEY env var (for embedding)
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import fs from "node:fs";

// ─── Config ────────────────────────────────────────────────────
const CATEGORY = "Self-Esteem & Shame Loop";
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 1536;
const MAX_TOKENS_PER_CHUNK = 700;
const OVERLAP_TOKENS = 100;
const CHARS_PER_TOKEN = 4;
const WORDS_PER_TOKEN = 0.75;
const BATCH_SIZE = 64;
const REQUEST_TIMEOUT_MS = 20_000;
const RETRY_DELAYS = [400, 1200, 2500];

// ─── Chunking (inlined from services/ai/chunking.ts) ──────────
interface TextChunk {
  chunkIndex: number;
  text: string;
  tokenCount: number;
}

function estimateTokenCount(text: string): number {
  return Math.max(1, Math.ceil(text.length / CHARS_PER_TOKEN));
}

function splitIntoChunks(rawText: string): TextChunk[] {
  const text = rawText.trim().replace(/\s+/g, " ");
  if (!text) return [];
  const words = text.split(" ");
  const maxWords = Math.floor(MAX_TOKENS_PER_CHUNK * WORDS_PER_TOKEN);
  const overlapWords = Math.floor(OVERLAP_TOKENS * WORDS_PER_TOKEN);
  const stride = Math.max(1, maxWords - overlapWords);
  const chunks: TextChunk[] = [];
  for (let start = 0; start < words.length; start += stride) {
    const end = Math.min(words.length, start + maxWords);
    const chunkText = words.slice(start, end).join(" ").trim();
    if (!chunkText) continue;
    chunks.push({
      chunkIndex: chunks.length,
      text: chunkText,
      tokenCount: estimateTokenCount(chunkText),
    });
    if (end >= words.length) break;
  }
  return chunks;
}

// ─── Embedding (inlined from services/ai/geminiClient.ts) ─────
function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}

async function postGemini<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const url = new URL(`https://generativelanguage.googleapis.com/v1beta${path}`);
    url.searchParams.set("key", getGeminiApiKey());
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini ${path} failed (${res.status}): ${errorText.slice(0, 500)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function withRetries<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === RETRY_DELAYS.length) break;
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Embedding failed");
}

async function createEmbeddings(input: string[]): Promise<number[][]> {
  if (input.length === 0) return [];
  const payload = {
    requests: input.map((text) => ({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    })),
  };
  const data = await withRetries(() =>
    postGemini<{ embeddings?: Array<{ values?: number[] }> }>(
      `/models/${EMBED_MODEL}:batchEmbedContents`,
      payload,
    ),
  );
  const embeddings = data.embeddings ?? [];
  if (embeddings.length !== input.length) {
    throw new Error(`Batch embedding count mismatch: ${embeddings.length} vs ${input.length}`);
  }
  return embeddings.map((emb) => {
    const vector = emb.values ?? [];
    if (vector.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Dimension mismatch: ${vector.length}`);
    }
    return vector;
  });
}

async function embedTexts(input: string[]): Promise<number[][]> {
  const vectors: number[][] = [];
  for (let i = 0; i < input.length; i += BATCH_SIZE) {
    const batch = input.slice(i, i + BATCH_SIZE);
    const batchVectors = await createEmbeddings(batch);
    vectors.push(...batchVectors);
  }
  return vectors;
}

// ─── Indexing (inlined from services/ai/knowledgeIndex.ts) ────
function toVectorLiteral(vector: number[]): string {
  return `[${vector.map((v) => Number(v).toFixed(8)).join(",")}]`;
}

async function reindexEntry(
  prisma: PrismaClient,
  entry: { id: string; title: string; category: string; content: string },
): Promise<number> {
  const chunks = splitIntoChunks(entry.content);
  if (chunks.length === 0) return 0;

  const searchableTexts = chunks.map(
    (c) => `Category: ${entry.category}\nTitle: ${entry.title}\n${c.text}`,
  );
  const embeddings = await embedTexts(searchableTexts);

  const insertStatements = chunks.map((chunk, i) => {
    const vectorLiteral = toVectorLiteral(embeddings[i]);
    return Prisma.sql`
      INSERT INTO "knowledge_chunks" (
        "id", "entry_id", "chunk_index", "text", "token_count",
        "embedding", "created_at", "updated_at"
      ) VALUES (
        ${randomUUID()}, ${entry.id}, ${chunk.chunkIndex}, ${chunk.text},
        ${chunk.tokenCount}, ${vectorLiteral}::vector, NOW(), NOW()
      )
    `;
  });

  await prisma.$transaction([
    prisma.$executeRaw(
      Prisma.sql`DELETE FROM "knowledge_chunks" WHERE "entry_id" = ${entry.id}`,
    ),
    ...insertStatements.map((sql) => prisma.$executeRaw(sql)),
  ]);

  return chunks.length;
}

// ─── Doc Parser ───────────────────────────────────────────────
function parseDaySections(text: string): Map<string, string> {
  const sections = new Map<string, string>();
  // Match day headers like "Day 1 - ...", "DAY 0.1 - ...", "Day 22: ..."
  const dayRegex = /^(DAY\s+[\d.]+)\s*[-:–]\s*(.*)/gim;
  const matches: { key: string; index: number; name: string }[] = [];

  let m;
  while ((m = dayRegex.exec(text)) !== null) {
    const key = m[1].toUpperCase().replace(/\s+/g, " ").trim(); // "DAY 1", "DAY 0.2"
    matches.push({ key, index: m.index, name: m[2].trim() });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const rawContent = text.slice(start, end);
    sections.set(matches[i].key, rawContent);
  }

  return sections;
}

function cleanContent(text: string): string {
  return (
    text
      // Remove SUBJ: lines
      .replace(/^SUBJ:.*$/gm, "")
      // Remove Preview: lines
      .replace(/^Preview:.*$/gm, "")
      // Remove sign-off blocks
      .replace(/(?:Warmly|My best|Keep up the great work),?\s*\n+Marko Juhant\s*\n*(?:StrategicParenting(?:\.com)?\s*)?$/gm, "")
      // Remove "reply to this email" / "tell me" / "let me know" call-to-action lines
      .replace(/^(?:I'd love to (?:know|hear)|Tell me|Let me know|So,? tell me|If (?:you|your)|Once you hear).*$/gm, "")
      // Remove email-specific instructions (Step #1: Let me know why you joined, etc.)
      .replace(/^Step #\d+:.*(?:survey|e-?mails?|challenge|contact).*$/gim, "")
      // Remove multiple blank lines
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

// ─── Question-to-Day Mapping ─────────────────────────────────
interface QuestionMapping {
  title: string;
  dayKeys: string[]; // e.g., ["DAY 1", "DAY 12"]
}

const QUESTIONS: QuestionMapping[] = [
  {
    title: 'My child says "I\'m stupid" after mistakes.',
    dayKeys: ["DAY 1"],
  },
  {
    title: 'My child says "I can\'t do anything right."',
    dayKeys: ["DAY 18", "DAY 3"],
  },
  {
    title: "How do I build confidence in my ADHD child?",
    dayKeys: ["DAY 2", "DAY 10"],
  },
  {
    title: "Why does my ADHD child have low self-esteem?",
    dayKeys: ["DAY 0.2"],
  },
  {
    title: "My child gives up before even trying.",
    dayKeys: ["DAY 8", "DAY 9"],
  },
  {
    title: "My child takes every correction personally.",
    dayKeys: ["DAY 6", "DAY 1"],
  },
  {
    title: "My child melts down after small failures.",
    dayKeys: ["DAY 13"],
  },
  {
    title: "My child compares themselves to siblings constantly.",
    dayKeys: ["DAY 4"],
  },
  {
    title: "My child thinks everyone is better than them.",
    dayKeys: ["DAY 11", "DAY 4"],
  },
  {
    title: "My child avoids hard tasks because they're afraid to fail.",
    dayKeys: ["DAY 9", "DAY 10"],
  },
  {
    title: 'My child says "I\'m bad" when disciplined.',
    dayKeys: ["DAY 18"],
  },
  {
    title: "My child overreacts to small criticism.",
    dayKeys: ["DAY 13"],
  },
  {
    title: "My child shuts down when corrected.",
    dayKeys: ["DAY 7"],
  },
  {
    title: "My child seems ashamed when they make mistakes.",
    dayKeys: ["DAY 18", "DAY 1"],
  },
  {
    title: "How do I stop negative self-talk in my child?",
    dayKeys: ["DAY 12"],
  },
  {
    title: "My child says nobody likes them.",
    dayKeys: ["DAY 1", "DAY 5", "DAY 20"],
  },
  {
    title: "My child says everyone hates them after small conflicts.",
    dayKeys: ["DAY 7", "DAY 1"],
  },
  {
    title: "Is low self-esteem common in ADHD?",
    dayKeys: ["DAY 0.2", "DAY 2"],
  },
  {
    title: "How do I correct behavior without hurting confidence?",
    dayKeys: ["DAY 6"],
  },
  {
    title: "Will ADHD damage my child's confidence long term?",
    dayKeys: ["DAY 0.2", "DAY 11"],
  },
  {
    title: "My child seems confident outside but collapses at home.",
    dayKeys: ["DAY 20", "DAY 5"],
  },
  {
    title: "My child cries when they can't do something perfectly.",
    dayKeys: ["DAY 10", "DAY 13"],
  },
  {
    title: "My child refuses to try new things.",
    dayKeys: ["DAY 8", "DAY 15"],
  },
  {
    title: "How do I help my child bounce back after failure?",
    dayKeys: ["DAY 9", "DAY 18"],
  },
  {
    title: "My child calls themselves dumb during homework.",
    dayKeys: ["DAY 12", "DAY 14"],
  },
];

// ─── Main ────────────────────────────────────────────────────
async function main() {
  // Validate env
  if (!process.env.GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY env var is required for embedding.");
    process.exit(1);
  }

  // Parse the doc
  const docPath = process.argv[2];
  if (!docPath) {
    console.error("Usage: pnpm import-content <path-to-doc-text-file>");
    console.error("");
    console.error("First export your .docx to text:");
    console.error("  The script expects plain text, not .docx directly.");
    console.error("  A pre-parsed text file should be at /tmp/docx-text.txt");
    process.exit(1);
  }

  const docText = fs.readFileSync(docPath, "utf-8");
  console.log(`📄 Read doc: ${docText.length} characters`);

  const sections = parseDaySections(docText);
  console.log(`📑 Parsed ${sections.size} day sections: ${[...sections.keys()].join(", ")}`);

  const prisma = new PrismaClient();

  try {
    // Check for existing entries in same category
    const existing = await prisma.knowledgeEntry.count({
      where: { category: CATEGORY },
    });
    if (existing > 0) {
      console.log(`⚠️  Found ${existing} existing entries in category "${CATEGORY}".`);
      console.log(`   Skipping import to avoid duplicates.`);
      console.log(`   Delete existing entries first if you want to re-import.`);
      return;
    }

    console.log(`\n🚀 Importing ${QUESTIONS.length} entries into category "${CATEGORY}"...\n`);

    let totalChunks = 0;

    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];

      // Combine content from relevant days
      const contentParts: string[] = [];
      for (const dayKey of q.dayKeys) {
        const section = sections.get(dayKey);
        if (section) {
          contentParts.push(cleanContent(section));
        } else {
          console.warn(`  ⚠️  Day "${dayKey}" not found for question: ${q.title}`);
        }
      }

      const content = contentParts.join("\n\n---\n\n");

      if (!content.trim()) {
        console.warn(`  ❌ No content for: ${q.title} — skipping`);
        continue;
      }

      // Create entry
      const entry = await prisma.knowledgeEntry.create({
        data: {
          category: CATEGORY,
          title: q.title,
          content,
        },
      });

      // Index (chunk + embed)
      const chunksIndexed = await reindexEntry(prisma, entry);
      totalChunks += chunksIndexed;

      console.log(
        `  ✅ [${i + 1}/${QUESTIONS.length}] "${q.title}" — ${chunksIndexed} chunks, ${content.length} chars`,
      );

      // Small delay to avoid rate limiting
      if (i < QUESTIONS.length - 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    console.log(`\n🎉 Done! Imported ${QUESTIONS.length} entries with ${totalChunks} total chunks.`);
    console.log(`   Category: "${CATEGORY}"`);
    console.log(`   Use the Test Query tool in the admin panel to verify retrieval.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message ?? err);
  process.exit(1);
});
