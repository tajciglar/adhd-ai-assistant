import type { RetrievedSource } from "./retrieval.js";

export interface ChildContext {
  childName: string;
  childAge: number | null;
  childGender: string | null;
  traitProfile: {
    scores: Record<string, number>;
    archetypeId: string;
    archetypeName?: string;
    archetypeTypeName?: string;
  } | null;
}

interface PromptInput {
  question: string;
  sources: RetrievedSource[];
  child: ChildContext | null;
  history: Array<{ role: "USER" | "ASSISTANT"; content: string }>;
}

const MAX_SOURCES_IN_PROMPT = 5;
const MAX_SOURCE_CHARS = 900;
const MAX_HISTORY_TURNS = 6;

function toAssistantRole(role: "USER" | "ASSISTANT"): "user" | "assistant" {
  return role === "USER" ? "user" : "assistant";
}

function buildProfileContext(child: ChildContext | null): string {
  if (!child) return "No child profile available yet.";

  const lines: string[] = [];

  if (child.childName) lines.push(`Child's name: ${child.childName}`);
  if (child.childAge != null) lines.push(`Child's age: ${child.childAge}`);
  if (child.childGender) lines.push(`Child's gender: ${child.childGender}`);

  if (child.traitProfile) {
    const tp = child.traitProfile;

    // Only include archetype internally for context — never surface it to the parent
    if (tp.archetypeName) {
      lines.push(`(Internal reference — ADHD archetype: ${tp.archetypeName})`);
    }

    // Convert scores to plain-language strength areas
    const scores = tp.scores;
    if (scores) {
      const dimensionLabels: Record<string, string> = {
        filter: "attention and focus",
        engine: "energy and impulse control",
        sensory: "sensory processing",
        fuse: "emotional regulation",
        time: "time management and planning",
        social: "social cues and interactions",
      };

      const highAreas = Object.entries(scores)
        .filter(([, score]) => score >= 13)
        .map(([key]) => dimensionLabels[key] ?? key);

      const moderateAreas = Object.entries(scores)
        .filter(([, score]) => score >= 7 && score < 13)
        .map(([key]) => dimensionLabels[key] ?? key);

      if (highAreas.length > 0) {
        lines.push(
          `Areas where this child needs the most support: ${highAreas.join(", ")}`,
        );
      }
      if (moderateAreas.length > 0) {
        lines.push(
          `Areas with moderate challenges: ${moderateAreas.join(", ")}`,
        );
      }
    }
  }

  return lines.length > 0
    ? lines.join("\n")
    : "No child profile context available.";
}

function buildSourceBlock(sources: RetrievedSource[]): string {
  return sources
    .slice(0, MAX_SOURCES_IN_PROMPT)
    .map(
      (source, i) =>
        [
          `[Source ${i + 1}]`,
          `Entry ID: ${source.entryId}`,
          `Category: ${source.category}`,
          `Title: ${source.title}`,
          `Chunk Index: ${source.chunkIndex}`,
          `Content: ${source.text.slice(0, MAX_SOURCE_CHARS)}`,
        ].join("\n"),
    )
    .join("\n\n");
}

export function buildGroundedPrompt({
  question,
  sources,
  child,
  history,
}: PromptInput): Array<{
  role: "system" | "user" | "assistant";
  content: string;
}> {
  const childNameOrFallback = child?.childName || "the child";

  const systemInstructions = [
    "You are Harbor, an ADHD parenting support assistant.",
    "Use ONLY the provided Knowledge Base Sources for factual claims.",
    "If the sources are insufficient, respond exactly with: I don't have enough information in your current Harbor knowledge base to answer that confidently. Please upload content about this topic so I can help.",
    "Never invent facts, references, or citations.",
    "Use a calm, practical, parent-supportive tone.",
    "Keep answers concise and actionable.",
    `Refer to the child by name (${childNameOrFallback}) — never say "your child" repeatedly.`,
    "NEVER mention archetype names, trait scores, score numbers, or internal labels (e.g. 'Emotional Thermostat score', 'Engine Speed 14/18') to the parent. These are internal context for you only.",
    "Instead, naturally tailor your advice to the child's challenge areas without exposing the underlying data.",
    "Focus strategies on the areas where the child needs the most support.",
    "Do not add sources like [Source 1], or any other source references in your answer. The sources are there for you to use, but do not mention them explicitly in the response.",
    "If the answer containes a list, format it with bullet points for easier readability and make it bold.",
  ].join(" ");

  const sourceContext = buildSourceBlock(sources);
  const profileContext = buildProfileContext(child);
  const historyContext = history.slice(-MAX_HISTORY_TURNS).map((m) => ({
    role: toAssistantRole(m.role),
    content: m.content.slice(0, 1200),
  }));

  return [
    { role: "system", content: systemInstructions },
    {
      role: "system",
      content: `Child profile context (for personalization only, not factual grounding):\n${profileContext}`,
    },
    {
      role: "system",
      content: `Knowledge Base Sources:\n${sourceContext}`,
    },
    ...historyContext,
    { role: "user", content: question },
  ];
}
