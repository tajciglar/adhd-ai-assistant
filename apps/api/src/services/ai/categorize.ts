import { createChatCompletion, LONG_REQUEST_TIMEOUT_MS } from "./geminiClient.js";
import type { PrismaClient } from "@prisma/client";

/**
 * Auto-classify a knowledge entry into an existing (or new) category
 * using Gemini. Returns the suggested category name.
 */
export async function classifyContent(opts: {
  title: string;
  content: string;
  prisma: PrismaClient;
}): Promise<{ category: string; isNew: boolean }> {
  // Fetch existing categories from the database
  const existingEntries = await opts.prisma.knowledgeEntry.findMany({
    select: { category: true },
    distinct: ["category"],
  });
  const existingCategories = existingEntries.map((e) => e.category).sort();

  const categoryList =
    existingCategories.length > 0
      ? existingCategories.join(", ")
      : "(no categories yet)";

  const snippet = opts.content.slice(0, 800);

  const { content: result } = await createChatCompletion([
    {
      role: "system",
      content: [
        "You are a content classifier for an ADHD parenting knowledge base.",
        "Given a title and content snippet, classify it into the most appropriate category.",
        `Existing categories: ${categoryList}`,
        "Rules:",
        "- If the content clearly fits an existing category, return that exact category name.",
        "- If none of the existing categories fit well, suggest a short new category name (2-4 words).",
        "- Return ONLY the category name, nothing else. No quotes, no explanation.",
      ].join("\n"),
    },
    {
      role: "user",
      content: `Title: ${opts.title}\n\nContent:\n${snippet}`,
    },
  ]);

  const suggested = result.trim().replace(/^["']|["']$/g, "");
  const isNew = !existingCategories.some(
    (c) => c.toLowerCase() === suggested.toLowerCase(),
  );

  return { category: suggested, isNew };
}

// ─── Document Section Splitting ────────────────────────────────────────────

interface DocSection {
  heading: string;
  content: string;
}

const MAX_CHARS_PER_BATCH = 80_000;

/**
 * Clean email-course artifacts (greetings, sign-offs, CTAs, survey links).
 */
function cleanEmailContent(text: string): string {
  return text
    .replace(/^SUBJ:.*$/gm, "")
    .replace(/^Preview:.*$/gm, "")
    .replace(
      /(?:Warmly|My best|Keep up the great work),?\s*\n+Marko Juhant\s*\n*(?:StrategicParenting(?:\.com)?\s*)?$/gm,
      "",
    )
    .replace(
      /^(?:I'd love to (?:know|hear)|Tell me|Let me know|So,? tell me).*$/gm,
      "",
    )
    .replace(
      /^Step #\d+:.*(?:survey|e-?mails?|challenge|contact).*$/gim,
      "",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Split a document into logical sections by detecting its structure.
 * Handles DAY-based (email courses) and heading-based (textbook chapters).
 */
function splitDocIntoSections(text: string): DocSection[] {
  // Try DAY sections first (email course style)
  const dayRegex = /^(DAY\s+[\d.]+)\s*[-:–]\s*(.*)/gim;
  const dayMatches: { heading: string; index: number }[] = [];
  let m;
  while ((m = dayRegex.exec(text)) !== null) {
    dayMatches.push({
      heading: `${m[1].trim()}: ${m[2].trim()}`,
      index: m.index,
    });
  }

  if (dayMatches.length >= 3) {
    return dayMatches.map((match, i) => {
      const start = match.index;
      const end =
        i + 1 < dayMatches.length ? dayMatches[i + 1].index : text.length;
      return {
        heading: match.heading,
        content: cleanEmailContent(text.slice(start, end)),
      };
    });
  }

  // Try heading-based sections (## or # headings)
  const headingRegex = /^#{1,3}\s+(.+)/gm;
  const headingMatches: { heading: string; index: number }[] = [];
  while ((m = headingRegex.exec(text)) !== null) {
    headingMatches.push({ heading: m[1].trim(), index: m.index });
  }

  if (headingMatches.length >= 3) {
    return headingMatches.map((match, i) => {
      const start = match.index;
      const end =
        i + 1 < headingMatches.length
          ? headingMatches[i + 1].index
          : text.length;
      return {
        heading: match.heading,
        content: text.slice(start, end).trim(),
      };
    });
  }

  // Fallback: treat as one section
  return [{ heading: "Full Document", content: text.trim() }];
}

/**
 * Group sections into batches that fit within Gemini's context window.
 */
function batchSections(sections: DocSection[]): DocSection[][] {
  const batches: DocSection[][] = [];
  let currentBatch: DocSection[] = [];
  let currentSize = 0;

  for (const section of sections) {
    if (
      currentSize + section.content.length > MAX_CHARS_PER_BATCH &&
      currentBatch.length > 0
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentSize = 0;
    }
    currentBatch.push(section);
    currentSize += section.content.length;
  }
  if (currentBatch.length > 0) batches.push(currentBatch);

  return batches;
}

/**
 * Extract Q&A entries from a batch of sections using Gemini.
 */
async function extractEntriesFromBatch(
  batch: DocSection[],
  categoryContext: string,
  moduleContext: string,
): Promise<Array<{ category: string; title: string; content: string }>> {
  const sectionText = batch
    .map((s) => `=== ${s.heading} ===\n${s.content}`)
    .join("\n\n---\n\n");

  const { content: result } = await createChatCompletion(
    [
      {
        role: "system",
        content: [
          "You are extracting knowledge base entries from an ADHD parenting content document.",
          "Your job is to turn this educational content into Q&A entries that will be retrieved when parents ask questions.",
          "",
          "RULES:",
          "1. For each distinct topic/technique in the content, create one entry.",
          "2. The TITLE must be a realistic parent question that would trigger retrieval of this content.",
          '   Good: "My child refuses to listen unless I yell."',
          '   Good: "How do I discipline my ADHD child without damaging self-esteem?"',
          '   Bad: "Day 5: Positive Reinforcement" (not a question)',
          "3. The CONTENT should be the practical knowledge extracted from the section.",
          "   - Remove email-style language (greetings, sign-offs, CTAs, survey links).",
          "   - Keep ALL actionable strategies, examples, and explanations.",
          "   - Preserve the expert voice and practical tips.",
          "   - Do NOT summarize — keep the full detail.",
          "4. Generate 2-5 entries per section depending on content richness.",
          "   One section about multiple techniques = multiple entries.",
          "   One section about one focused topic = one entry.",
          `5. ${categoryContext}`,
          moduleContext ? `6. ${moduleContext}` : "",
          "",
          "Return valid JSON array ONLY. No markdown wrapping, no explanation.",
          'Format: [{"category": "...", "title": "...", "content": "..."}]',
        ]
          .filter(Boolean)
          .join("\n"),
      },
      {
        role: "user",
        content: sectionText,
      },
    ],
    { timeoutMs: LONG_REQUEST_TIMEOUT_MS },
  );

  const cleaned = result
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const entries = JSON.parse(cleaned) as Array<{
    category?: string;
    title?: string;
    content?: string;
  }>;

  if (!Array.isArray(entries)) {
    throw new Error("Response is not an array");
  }

  return entries
    .filter((e) => e.title && e.content && e.content.length > 50)
    .map((e) => ({
      category: e.category || "Uncategorized",
      title: e.title!,
      content: e.content!,
    }));
}

/**
 * Parse a large document into individual Q&A pairs using Gemini.
 * Handles documents of any size by splitting into sections and batching.
 * Returns structured entries ready for bulk import.
 */
export async function parseDocumentIntoEntries(opts: {
  documentText: string;
  moduleName?: string;
  prisma: PrismaClient;
}): Promise<Array<{ category: string; title: string; content: string }>> {
  // Fetch existing categories for context
  const existingEntries = await opts.prisma.knowledgeEntry.findMany({
    select: { category: true },
    distinct: ["category"],
  });
  const existingCategories = existingEntries.map((e) => e.category).sort();

  const categoryContext = opts.moduleName
    ? `Use this category for ALL entries: "${opts.moduleName}"`
    : existingCategories.length > 0
      ? `Existing categories: ${existingCategories.join(", ")}. Reuse where appropriate, or create new ones (2-4 words).`
      : "Create appropriate category names (2-4 words) for each entry.";

  const moduleContext = opts.moduleName
    ? `This document belongs to the module: "${opts.moduleName}"`
    : "";

  // Split into sections and batch
  const sections = splitDocIntoSections(opts.documentText);
  const batches = batchSections(sections);

  const allEntries: Array<{ category: string; title: string; content: string }> = [];

  for (const batch of batches) {
    try {
      const entries = await extractEntriesFromBatch(
        batch,
        categoryContext,
        moduleContext,
      );
      allEntries.push(
        ...entries.map((e) => ({
          ...e,
          category: opts.moduleName || e.category,
        })),
      );
    } catch {
      // If a batch fails, log and continue with other batches
      // (partial results are better than total failure)
      continue;
    }
  }

  if (allEntries.length === 0) {
    throw new Error(
      "Failed to parse document into entries. No Q&A pairs could be extracted. Try a more structured document or a smaller section.",
    );
  }

  return allEntries;
}
