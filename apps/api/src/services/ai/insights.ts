import type { FastifyInstance } from "fastify";
import { createChatCompletion } from "./geminiClient.js";

interface InsightContext {
  sourceCount: number;
  avgScore: number;
  archetypeId: string | null;
}

/**
 * Extract topic classification from a user question and store as a conversation insight.
 * Runs non-blocking (fire-and-forget) after each AI response.
 */
export async function extractConversationInsight(
  fastify: FastifyInstance,
  userId: string,
  userMessage: string,
  context: InsightContext,
): Promise<void> {
  try {
    const messages = [
      {
        role: "system" as const,
        content: `Classify the following parent's question into exactly ONE topic category.

Available categories:
- morning-routines
- bedtime-routines
- homework-school
- emotional-regulation
- meltdowns
- focus-attention
- energy-impulse
- sensory-needs
- social-skills
- organization-planning
- family-dynamics
- discipline-behavior
- understanding-adhd
- medication
- professional-help
- transitions
- self-care-parent
- other

Return ONLY the category string, nothing else.`,
      },
      {
        role: "user" as const,
        content: userMessage.slice(0, 300),
      },
    ];

    const result = await createChatCompletion(messages);
    const topic = result.content?.trim().toLowerCase().replace(/[^a-z-]/g, "") || "other";

    await fastify.prisma.conversationInsight.create({
      data: {
        userId,
        topic,
        userMessage: userMessage.slice(0, 500),
        retrievalScore: context.avgScore,
        hadSufficientSources: context.sourceCount >= 2,
        archetypeId: context.archetypeId,
      },
    });

    fastify.log.debug({ userId, topic }, "insight.extracted");
  } catch (error) {
    fastify.log.warn(
      { err: error instanceof Error ? error : new Error(String(error)) },
      "insight.extraction.error",
    );
  }
}
