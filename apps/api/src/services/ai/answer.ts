import type { FastifyInstance } from "fastify";
import { createChatCompletion, AI_CHAT_MODEL } from "./geminiClient.js";
import { retrieveRelevantKnowledge, type RetrievedSource } from "./retrieval.js";
import { buildGroundedPrompt } from "./prompt.js";

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

  try {
    sources = await retrieveRelevantKnowledge(fastify, question, 8);
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
      },
    };
  }

  const profile = await fastify.prisma.userProfile.findUnique({
    where: { userId },
    select: { onboardingResponses: true },
  });

  const onboardingResponses =
    (profile?.onboardingResponses as Record<string, unknown>) ?? {};

  const messages = buildGroundedPrompt({
    question,
    sources,
    onboardingResponses,
    history,
  });

  try {
    const completion = await createChatCompletion(messages);
    const content = completion.content || NO_CONTENT_RESPONSE;

    fastify.log.info(
      {
        retrieval: { topK: 8, sourcesCount: sourceMetadata.length },
        model: AI_CHAT_MODEL,
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
        usage: {
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          totalTokens: completion.usage?.total_tokens,
        },
      },
    };
  } catch (error) {
    fastify.log.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      "chat.gemini.failed",
    );
    return {
      content:
        "Harbor is temporarily unable to generate an answer. Please try again in a moment.",
      metadata: {
        model: AI_CHAT_MODEL,
        grounded: true,
        sources: sourceMetadata,
        errorCode: "gemini_error",
      },
    };
  }
}
