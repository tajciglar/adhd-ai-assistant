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

/**
 * Parse a large document into individual Q&A pairs using Gemini.
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

  const categoryContext =
    existingCategories.length > 0
      ? `Existing categories in the knowledge base: ${existingCategories.join(", ")}`
      : "No existing categories yet — create appropriate ones.";

  const moduleContext = opts.moduleName
    ? `This document belongs to the module: "${opts.moduleName}"`
    : "";

  // Truncate very long docs to stay within reasonable prompt limits (~100k chars)
  const docText = opts.documentText.slice(0, 100_000);

  const { content: result } = await createChatCompletion(
    [
      {
        role: "system",
        content: [
          "You are a content parser for an ADHD parenting knowledge base.",
          "Your job is to split a large document into individual question-and-answer entries.",
          "",
          "Rules:",
          "- Identify each distinct question/topic and its corresponding answer/content.",
          "- Each entry should have: category, title (the question), and content (the answer).",
          `- ${categoryContext}`,
          moduleContext ? `- ${moduleContext}` : "",
          "- Return valid JSON array only. No markdown, no code blocks, no explanation.",
          '- Format: [{"category": "...", "title": "...", "content": "..."}]',
          "- The title should be a clear question that a parent might ask.",
          "- Preserve ALL content — do not summarize or shorten the answers.",
          "- If a section is very long, keep it as one entry (the system will chunk it).",
        ]
          .filter(Boolean)
          .join("\n"),
      },
      {
        role: "user",
        content: docText,
      },
    ],
    { timeoutMs: LONG_REQUEST_TIMEOUT_MS },
  );

  // Parse the JSON response — handle potential markdown wrapping
  const cleaned = result
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const entries = JSON.parse(cleaned) as Array<{
      category?: string;
      title?: string;
      content?: string;
    }>;

    if (!Array.isArray(entries)) {
      throw new Error("Response is not an array");
    }

    return entries
      .filter((e) => e.title && e.content)
      .map((e) => ({
        category: e.category || opts.moduleName || "Uncategorized",
        title: e.title!,
        content: e.content!,
      }));
  } catch {
    throw new Error(
      "Failed to parse document into entries. The AI response was not valid JSON. Try with a shorter or more structured document.",
    );
  }
}
