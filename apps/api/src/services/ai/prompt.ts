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

const MAX_SOURCES_IN_PROMPT = 8;
const MAX_SOURCE_CHARS = 1500;
const MAX_HISTORY_TURNS = 6;

function toAssistantRole(role: "USER" | "ASSISTANT"): "user" | "assistant" {
  return role === "USER" ? "user" : "assistant";
}

function buildProfileContext(child: ChildContext | null): string {
  if (!child) return "No child profile available yet.";

  const lines: string[] = [];

  if (child.childName) {
    const name = child.childName
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    lines.push(`Child's name: ${name}`);
  }
  if (child.childAge != null) lines.push(`Child's age: ${child.childAge}`);
  if (child.childGender) lines.push(`Child's gender: ${child.childGender}`);

  if (child.traitProfile) {
    const tp = child.traitProfile;

    // Convert scores to plain-language strength areas (archetype name intentionally excluded to prevent leaking)
    const scores = tp.scores;
    if (scores) {
      const dimensionLabels: Record<string, string> = {
        inattentive: "attention and focus",
        hyperactive: "energy and impulse control",
        sensory: "sensory processing",
        emotional: "emotional regulation",
        executive_function: "time management and planning",
        social: "social cues and interactions",
      };

      const highAreas = Object.entries(scores)
        .filter(([, score]) => score >= 2.25)
        .map(([key]) => dimensionLabels[key] ?? key);

      const moderateAreas = Object.entries(scores)
        .filter(([, score]) => score >= 1.25 && score < 2.25)
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
      (source) =>
        [
          `---`,
          `Category: ${source.category}`,
          `Title: ${source.title}`,
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
  const rawName = child?.childName?.trim();
  const childNameOrFallback = rawName
    ? rawName
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "the child";

  const systemInstructions = [
    "You are Harbor, an ADHD parenting support assistant.",
    "Use ONLY the provided Knowledge Base Sources for factual claims.",
    "If the sources are insufficient, respond exactly with: I don't have enough information in the current knowledge base to answer that confidently.",
    "Never invent facts, references, or citations.",
    "Use a calm, practical, parent-supportive tone.",
    "Keep answers concise and actionable.",
    `Refer to the child by name (${childNameOrFallback}) — never say "your child" repeatedly.`,
    "CRITICAL RULES — violating these makes the response useless:",
    "1) NEVER cite or reference sources. No '[Source 1]', no '[Source 1, Source 2]', no 'according to Source 3', no source references of any kind. Just give the advice directly.",
    "2) NEVER use internal/clinical terminology from the knowledge base. This includes archetype names (e.g. 'Deep Dreamer', 'Firecracker'), dimension names (e.g. 'Time Horizon', 'Engine Speed', 'Social Radar', 'Emotional Thermostat', 'Sensory Filter'), trait scores, or score numbers. The parent must NEVER see these terms.",
    "3) Instead, describe challenges in plain parent-friendly language. Say 'struggles with staying organized' instead of 'low Time Horizon score'. Say 'has big emotions' instead of 'Emotional Thermostat'.",
    "Focus strategies on the areas where the child needs the most support.",
    "If the answer contains a list, format it with bullet points for easier readability and make it bold.",
    "If a Knowledge Base Source contains a downloadable resource marker in the format [download:id:filename], include that exact marker in your response when recommending the resource. The frontend will render it as a download button.",
    "At the end of every response, add a brief friendly follow-up — for example: 'Would you like more detail on any of these?' or 'Is there a specific situation you'd like me to help with?' or 'Want me to suggest a step-by-step plan for this?'. Keep it short (one sentence), warm, and relevant to the topic you just discussed. Do NOT repeat the same follow-up each time — vary it naturally.",
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
