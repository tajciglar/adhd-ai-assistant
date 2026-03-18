import type { FastifyInstance } from "fastify";
import { createChatCompletion } from "./geminiClient.js";

/**
 * Extract memorable facts from a conversation exchange and store them.
 * Runs non-blocking (fire-and-forget) after each AI response.
 */
export async function extractMemories(
  fastify: FastifyInstance,
  userId: string,
  userMessage: string,
  assistantResponse: string,
): Promise<void> {
  try {
    const messages = [
      {
        role: "system" as const,
        content: `You extract key facts from parent-AI conversations about ADHD parenting that would be useful to remember for future conversations.

Extract ONLY facts that are:
- Specific to this family (child's school, specific strategies tried, specific challenges)
- Actionable for future personalization (what worked, what didn't, preferences)
- NOT generic ADHD information

Return a JSON array of short fact strings (max 100 chars each).
Return an empty array [] if there's nothing new worth remembering.

Examples of good facts:
- "Max is in 2nd grade at Lincoln Elementary"
- "Visual timers helped with homework but not with morning routine"
- "Parent works from home on Tuesdays and Thursdays"
- "Bedtime meltdowns happen most on school nights"
- "Child takes medication in the morning"

Examples of what NOT to extract:
- "ADHD affects executive function" (generic knowledge)
- "Parent asked about homework" (too vague)
- "AI suggested using timers" (AI advice, not family fact)`,
      },
      {
        role: "user" as const,
        content: `Parent said: "${userMessage.slice(0, 500)}"

Assistant responded: "${assistantResponse.slice(0, 500)}"

Extract memorable facts as a JSON array:`,
      },
    ];

    const result = await createChatCompletion(messages);
    const content = result.content?.trim();
    if (!content) return;

    // Parse JSON array from response
    let facts: string[];
    try {
      // Handle markdown code blocks
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      facts = JSON.parse(cleaned);
    } catch {
      fastify.log.debug({ content }, "memory.parse.failed");
      return;
    }

    if (!Array.isArray(facts) || facts.length === 0) return;

    // Deduplicate against existing memories
    const existing = await fastify.prisma.userMemory.findMany({
      where: { userId },
      select: { fact: true },
    });
    const existingFacts = new Set(
      existing.map((m) => m.fact.toLowerCase().trim()),
    );

    const newFacts = facts
      .filter(
        (f): f is string =>
          typeof f === "string" &&
          f.length > 5 &&
          f.length <= 200 &&
          !existingFacts.has(f.toLowerCase().trim()),
      )
      .slice(0, 5); // Max 5 new facts per exchange

    if (newFacts.length === 0) return;

    await fastify.prisma.userMemory.createMany({
      data: newFacts.map((fact) => ({
        userId,
        fact,
        category: "conversation",
        source: "conversation",
      })),
    });

    fastify.log.info(
      { userId, factsCount: newFacts.length },
      "memory.extracted",
    );
  } catch (error) {
    fastify.log.warn(
      { err: error instanceof Error ? error : new Error(String(error)) },
      "memory.extraction.error",
    );
  }
}
