import type { FastifyInstance } from "fastify";
import type { ArchetypeReportTemplate } from "@adhd-ai-assistant/shared";
import { createChatCompletion, streamChatCompletion, AI_CHAT_MODEL } from "./geminiClient.js";
import {
  retrieveRelevantKnowledge,
  type RetrievedSource,
} from "./retrieval.js";
import { buildGroundedPrompt, type ChildContext, type UserMemory } from "./prompt.js";
import { extractMemories } from "./memory.js";
import { extractConversationInsight } from "./insights.js";

interface AnswerInput {
  fastify: FastifyInstance;
  userId: string;
  question: string;
  history: Array<{ role: "USER" | "ASSISTANT"; content: string }>;
}

interface SourceMetadata {
  entryId: string;
  title: string;
  category: string;
  chunkIndex: number;
  score: number;
}

export interface AssistantMetadata {
  model: string;
  grounded: boolean;
  sources: SourceMetadata[];
  latencyMs?: number;
  retrievalMs?: number;
  providerMs?: number;
  sourceCount?: number;
  promptChars?: number;
  errorCode?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AnswerResult {
  content: string;
  metadata: AssistantMetadata;
}

const NO_CONTENT_RESPONSE =
  "I don't have enough information in your current Harbor knowledge base to answer that confidently. Please upload content about this topic so I can help.";

function toMetadataSources(sources: RetrievedSource[]): SourceMetadata[] {
  return sources.map((source) => ({
    entryId: source.entryId,
    title: source.title,
    category: source.category,
    chunkIndex: source.chunkIndex,
    score: Number(source.score.toFixed(4)),
  }));
}

export async function generateGroundedAnswer({
  fastify,
  userId,
  question,
  history,
}: AnswerInput): Promise<AnswerResult> {
  const start = Date.now();
  let sources: RetrievedSource[] = [];
  let retrievalMs = 0;
  let retrievalCacheHit = false;

  // ── Parallel: retrieval + profile + memories all at once ────────────
  const [retrievalResult, profile, memoriesResult] = await Promise.all([
    retrieveRelevantKnowledge(fastify, question, 8).catch((error) => {
      fastify.log.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "retrieval.failed",
      );
      return null;
    }),
    fastify.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        children: {
          take: 1,
          select: {
            childName: true,
            childAge: true,
            childGender: true,
            traitProfile: true,
          },
        },
      },
    }),
    fastify.prisma.userMemory
      .findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { fact: true, category: true, createdAt: true },
      })
      .catch(() => [] as UserMemory[]),
  ]);

  if (retrievalResult) {
    sources = retrievalResult.sources;
    retrievalMs = retrievalResult.retrievalMs;
    retrievalCacheHit = retrievalResult.cacheHit;
  } else {
    return {
      content: NO_CONTENT_RESPONSE,
      metadata: {
        model: AI_CHAT_MODEL,
        grounded: true,
        sources: [],
        retrievalMs,
        latencyMs: Date.now() - start,
        errorCode: "retrieval_error",
      },
    };
  }

  const sourceMetadata = toMetadataSources(sources);

  if (sources.length === 0) {
    fastify.log.info(
      {
        retrieval: { topK: 8, sourcesCount: 0 },
        model: AI_CHAT_MODEL,
        cache: { retrieval: retrievalCacheHit },
        retrievalMs,
        latencyMs: Date.now() - start,
      },
      "chat.grounded.no_sources",
    );

    return {
      content: NO_CONTENT_RESPONSE,
      metadata: {
        model: AI_CHAT_MODEL,
        grounded: true,
        sources: [],
        sourceCount: 0,
        retrievalMs,
        latencyMs: Date.now() - start,
      },
    };
  }

  const activeChild = profile?.children?.[0] ?? null;
  const childContext: ChildContext | null = activeChild
    ? {
        childName: activeChild.childName,
        childAge: activeChild.childAge,
        childGender: activeChild.childGender,
        traitProfile: activeChild.traitProfile as ChildContext["traitProfile"],
      }
    : null;

  // Fetch report template (only DB query left — needs archetypeId from profile)
  let reportTemplate: ArchetypeReportTemplate | null = null;
  const archetypeId = childContext?.traitProfile?.archetypeId;
  if (archetypeId) {
    const templateRow = await fastify.prisma.reportTemplate.findUnique({
      where: { archetypeId },
    });
    if (templateRow) {
      reportTemplate = templateRow.template as unknown as ArchetypeReportTemplate;
    }
  }

  const messages = buildGroundedPrompt({
    question,
    sources,
    child: childContext,
    history,
    reportTemplate,
    memories: memoriesResult as UserMemory[],
  });
  const promptChars = messages.reduce((sum, message) => sum + message.content.length, 0);

  try {
    const providerStart = Date.now();
    const completion = await createChatCompletion(messages);
    const providerMs = Date.now() - providerStart;
    const content = completion.content || NO_CONTENT_RESPONSE;

    fastify.log.info(
      {
        retrieval: { topK: 8, sourcesCount: sourceMetadata.length },
        model: AI_CHAT_MODEL,
        cache: { retrieval: retrievalCacheHit },
        retrievalMs,
        providerMs,
        promptChars,
        usage: completion.usage,
        latencyMs: Date.now() - start,
      },
      "chat.grounded.success",
    );

    // Non-blocking: extract memories and insights from this exchange
    extractMemories(fastify, userId, question, content).catch((err) =>
      fastify.log.warn({ err }, "memory.extraction.failed"),
    );
    extractConversationInsight(fastify, userId, question, {
      sourceCount: sourceMetadata.length,
      avgScore:
        sourceMetadata.length > 0
          ? sourceMetadata.reduce((sum, s) => sum + s.score, 0) /
            sourceMetadata.length
          : 0,
      archetypeId: archetypeId ?? null,
    }).catch((err) =>
      fastify.log.warn({ err }, "insight.extraction.failed"),
    );

    return {
      content,
      metadata: {
        model: AI_CHAT_MODEL,
        grounded: true,
        sources: sourceMetadata,
        sourceCount: sourceMetadata.length,
        retrievalMs,
        providerMs,
        promptChars,
        latencyMs: Date.now() - start,
        usage: {
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          totalTokens: completion.usage?.total_tokens,
        },
      },
    };
  } catch (error) {
    fastify.log.error({ error }, "chat.gemini.failed");
    return {
      content:
        "Harbor is temporarily unable to generate an answer. Please try again in a moment.",
      metadata: {
        model: AI_CHAT_MODEL,
        grounded: true,
        sources: sourceMetadata,
        sourceCount: sourceMetadata.length,
        retrievalMs,
        promptChars,
        latencyMs: Date.now() - start,
        errorCode: "gemini_error",
      },
    };
  }
}

// ── Streaming variant ──────────────────────────────────────────────────

export interface StreamPreamble {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  sourceCount: number;
  retrievalMs: number;
}

/**
 * Same retrieval + prompt logic as generateGroundedAnswer, but yields SSE
 * text chunks from Gemini's streaming endpoint. Emits a "preamble" event
 * first (with IDs and metadata), then "delta" events with text, then a
 * final "done" event with usage/latency info.
 */
export async function* streamGroundedAnswer({
  fastify,
  userId,
  question,
  history,
  conversationId,
  userMessageId,
}: AnswerInput & {
  conversationId: string;
  userMessageId: string;
}): AsyncGenerator<
  | { type: "preamble"; data: StreamPreamble }
  | { type: "delta"; text: string }
  | { type: "done"; metadata: AssistantMetadata; assistantMessageId: string }
  | { type: "error"; error: string }
> {
  const start = Date.now();

  // ── Parallel: retrieval + profile + memories ────────────────────────
  const [retrievalResult, profile, memoriesResult] = await Promise.all([
    retrieveRelevantKnowledge(fastify, question, 8).catch((error) => {
      fastify.log.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "retrieval.failed",
      );
      return null;
    }),
    fastify.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        children: {
          take: 1,
          select: {
            childName: true,
            childAge: true,
            childGender: true,
            traitProfile: true,
          },
        },
      },
    }),
    fastify.prisma.userMemory
      .findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { fact: true, category: true, createdAt: true },
      })
      .catch(() => [] as UserMemory[]),
  ]);

  if (!retrievalResult) {
    yield { type: "error", error: NO_CONTENT_RESPONSE };
    return;
  }

  const { sources, retrievalMs, cacheHit: retrievalCacheHit } = retrievalResult;
  const sourceMetadata = toMetadataSources(sources);

  if (sources.length === 0) {
    yield { type: "error", error: NO_CONTENT_RESPONSE };
    return;
  }

  const activeChild = profile?.children?.[0] ?? null;
  const childContext: ChildContext | null = activeChild
    ? {
        childName: activeChild.childName,
        childAge: activeChild.childAge,
        childGender: activeChild.childGender,
        traitProfile: activeChild.traitProfile as ChildContext["traitProfile"],
      }
    : null;

  let reportTemplate: ArchetypeReportTemplate | null = null;
  const archetypeId = childContext?.traitProfile?.archetypeId;
  if (archetypeId) {
    const templateRow = await fastify.prisma.reportTemplate.findUnique({
      where: { archetypeId },
    });
    if (templateRow) {
      reportTemplate = templateRow.template as unknown as ArchetypeReportTemplate;
    }
  }

  const messages = buildGroundedPrompt({
    question,
    sources,
    child: childContext,
    history,
    reportTemplate,
    memories: memoriesResult as UserMemory[],
  });
  const promptChars = messages.reduce((sum, m) => sum + m.content.length, 0);

  // Create a placeholder assistant message in DB so we have an ID
  const assistantRow = await fastify.prisma.message.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      content: "", // Will be updated after streaming completes
    },
  });

  // Emit preamble so frontend knows the IDs
  yield {
    type: "preamble",
    data: {
      conversationId,
      userMessageId,
      assistantMessageId: assistantRow.id,
      sourceCount: sourceMetadata.length,
      retrievalMs,
    },
  };

  // ── Stream from Gemini ──────────────────────────────────────────────
  let fullContent = "";
  let usage: AssistantMetadata["usage"];
  const providerStart = Date.now();

  try {
    const stream = streamChatCompletion(messages, {
      onUsage: (u) => {
        usage = {
          promptTokens: u.prompt_tokens,
          completionTokens: u.completion_tokens,
          totalTokens: u.total_tokens,
        };
      },
    });

    for await (const chunk of stream) {
      fullContent += chunk;
      yield { type: "delta", text: chunk };
    }
  } catch (error) {
    fastify.log.error({ error }, "chat.stream.gemini.failed");
    const errorMsg =
      "Harbor is temporarily unable to generate an answer. Please try again in a moment.";
    yield { type: "delta", text: errorMsg };
    fullContent = errorMsg;
  }

  const providerMs = Date.now() - providerStart;
  const content = fullContent.trim() || NO_CONTENT_RESPONSE;

  // Update the assistant message with the full content + metadata
  const metadata: AssistantMetadata = {
    model: AI_CHAT_MODEL,
    grounded: true,
    sources: sourceMetadata,
    sourceCount: sourceMetadata.length,
    retrievalMs,
    providerMs,
    promptChars,
    latencyMs: Date.now() - start,
    usage,
  };

  await fastify.prisma.message.update({
    where: { id: assistantRow.id },
    data: {
      content,
      metadata: metadata as any,
    },
  });

  // Non-blocking side effects
  void fastify.prisma.conversation
    .update({ where: { id: conversationId }, data: { updatedAt: new Date() } })
    .catch(() => {});

  extractMemories(fastify, userId, question, content).catch((err) =>
    fastify.log.warn({ err }, "memory.extraction.failed"),
  );
  extractConversationInsight(fastify, userId, question, {
    sourceCount: sourceMetadata.length,
    avgScore:
      sourceMetadata.length > 0
        ? sourceMetadata.reduce((sum, s) => sum + s.score, 0) / sourceMetadata.length
        : 0,
    archetypeId: archetypeId ?? null,
  }).catch((err) =>
    fastify.log.warn({ err }, "insight.extraction.failed"),
  );

  fastify.log.info(
    {
      retrieval: { topK: 8, sourcesCount: sourceMetadata.length },
      model: AI_CHAT_MODEL,
      cache: { retrieval: retrievalCacheHit },
      retrievalMs,
      providerMs,
      promptChars,
      usage,
      latencyMs: Date.now() - start,
    },
    "chat.stream.success",
  );

  yield { type: "done", metadata, assistantMessageId: assistantRow.id };
}
