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

function getIntensityLabel(score: number): string {
  if (score <= 6) return "Low";
  if (score <= 12) return "Moderate";
  return "High";
}

function buildProfileContext(child: ChildContext | null): string {
  if (!child) return "No child profile available yet.";

  const lines: string[] = [];

  if (child.childName) lines.push(`Child's name: ${child.childName}`);
  if (child.childAge != null) lines.push(`Child's age: ${child.childAge}`);
  if (child.childGender) lines.push(`Child's gender: ${child.childGender}`);

  if (child.traitProfile) {
    const tp = child.traitProfile;
    if (tp.archetypeName && tp.archetypeTypeName) {
      lines.push(
        `ADHD archetype: ${tp.archetypeName} — ${tp.archetypeTypeName}`,
      );
    }

    const scores = tp.scores;
    if (scores) {
      const scoreLabels: Record<string, string> = {
        filter: "Attention Filter (Inattention)",
        engine: "Engine Speed (Hyperactivity/Impulse)",
        sensory: "Sensory Guard (Sensory Processing)",
        fuse: "Emotional Thermostat (Dysregulation)",
        time: "Time Horizon (Executive Function)",
        social: "Social Radar (Social Cues)",
      };

      const traitLines = Object.entries(scores)
        .map(([key, score]) => {
          const label = scoreLabels[key] ?? key;
          return `  ${label}: ${score}/18 (${getIntensityLabel(score)})`;
        })
        .join("\n");

      lines.push(`Trait scores:\n${traitLines}`);
    }

    // Identify high dimensions for targeted advice
    const highDimensions = Object.entries(scores ?? {})
      .filter(([, score]) => score >= 13)
      .map(([key]) => key);

    if (highDimensions.length > 0) {
      lines.push(
        `Primary areas of support needed: ${highDimensions.join(", ")}`,
      );
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
  const systemInstructions = [
    "You are Harbor, an ADHD parenting support assistant.",
    "Use ONLY the provided Knowledge Base Sources for factual claims.",
    "If the sources are insufficient, respond exactly with: I don't have enough information in your current Harbor knowledge base to answer that confidently. Please upload content about this topic so I can help.",
    "Never invent facts, references, or citations.",
    "Use a calm, practical, parent-supportive tone.",
    "Keep answers concise and actionable.",
    "When the child's trait profile is available, tailor your advice to their specific ADHD archetype and trait scores.",
    "Focus on the child's high-scoring dimensions when providing strategies.",
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
