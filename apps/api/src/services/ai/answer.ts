import type { FastifyInstance } from "fastify";
import { createChatCompletion, AI_CHAT_MODEL } from "./geminiClient.js";
import {
  retrieveRelevantKnowledge,
  type RetrievedSource,
} from "./retrieval.js";
import { buildGroundedPrompt, type ChildContext } from "./prompt.js";

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

  // Fetch active child profile (first child) with trait profile
  const profile = await fastify.prisma.userProfile.findUnique({
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
  });

  const activeChild = profile?.children?.[0] ?? null;
  const childContext: ChildContext | null = activeChild
    ? {
        childName: activeChild.childName,
        childAge: activeChild.childAge,
        childGender: activeChild.childGender,
        traitProfile: activeChild.traitProfile as ChildContext["traitProfile"],
      }
    : null;

  const messages = buildGroundedPrompt({
    question,
    sources,
    child: childContext,
    history,
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
