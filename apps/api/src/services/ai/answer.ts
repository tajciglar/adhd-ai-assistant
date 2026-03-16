import type { FastifyInstance } from "fastify";
import type { ArchetypeReportTemplate } from "@adhd-ai-assistant/shared";
import { createChatCompletion, AI_CHAT_MODEL } from "./geminiClient.js";
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

  try {
    const retrieval = await retrieveRelevantKnowledge(fastify, question, 8);
    sources = retrieval.sources;
    retrievalMs = retrieval.retrievalMs;
    retrievalCacheHit = retrieval.cacheHit;
  } catch (error) {
    fastify.log.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      "retrieval.failed",
    );
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

  // Fetch active child profile, report template, and user memories in parallel
  const [profile, memoriesResult] = await Promise.all([
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

  const activeChild = profile?.children?.[0] ?? null;
  const childContext: ChildContext | null = activeChild
    ? {
        childName: activeChild.childName,
        childAge: activeChild.childAge,
        childGender: activeChild.childGender,
        traitProfile: activeChild.traitProfile as ChildContext["traitProfile"],
      }
    : null;

  // Fetch report template for the child's archetype
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
