import type { RetrievedSource } from "./retrieval.js";
import type { ArchetypeReportTemplate } from "@adhd-ai-assistant/shared";
import { ARCHETYPES, buildPlaceholderMap } from "@adhd-ai-assistant/shared";

// ─── Types ─────────────────────────────────────────────────────────────────

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

export interface UserMemory {
  fact: string;
  category: string;
  createdAt: Date;
}

interface PromptInput {
  question: string;
  sources: RetrievedSource[];
  child: ChildContext | null;
  history: Array<{ role: "USER" | "ASSISTANT"; content: string }>;
  reportTemplate: ArchetypeReportTemplate | null;
  memories: UserMemory[];
}

const MAX_SOURCES_IN_PROMPT = 8;
const MAX_SOURCE_CHARS = 1500;
const MAX_HISTORY_TURNS = 6;
const MAX_MEMORIES = 20;

function toAssistantRole(role: "USER" | "ASSISTANT"): "user" | "assistant" {
  return role === "USER" ? "user" : "assistant";
}

function capitalizeName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Profile Context (age-aware, rich trait descriptions) ──────────────────

const DIMENSION_INFO: Record<
  string,
  { label: string; highDesc: string; moderateDesc: string }
> = {
  inattentive: {
    label: "attention and focus",
    highDesc:
      "gets easily distracted, often loses track of tasks, needs frequent redirection",
    moderateDesc:
      "sometimes drifts off-task, benefits from gentle reminders",
  },
  hyperactive: {
    label: "energy and impulse control",
    highDesc:
      "has a lot of physical energy, acts before thinking, finds it hard to wait",
    moderateDesc:
      "can be restless at times, occasionally acts impulsively",
  },
  sensory: {
    label: "sensory processing",
    highDesc:
      "is very sensitive to sounds, textures, or crowds, or actively seeks intense sensory input",
    moderateDesc:
      "has some sensory preferences that can affect comfort and focus",
  },
  emotional: {
    label: "emotional regulation",
    highDesc:
      "experiences big emotions quickly, meltdowns can escalate fast, takes longer to calm down",
    moderateDesc:
      "sometimes has strong emotional reactions, usually recovers with support",
  },
  executive_function: {
    label: "organization and time management",
    highDesc:
      "struggles significantly with planning, losing things, and estimating how long tasks take",
    moderateDesc: "needs some help staying organized and managing time",
  },
  social: {
    label: "social interactions",
    highDesc:
      "often misses social cues, struggles with turn-taking, may interrupt or have difficulty reading the room",
    moderateDesc:
      "sometimes has trouble in social situations, benefits from coaching on social skills",
  },
};

function getDevelopmentalNote(age: number): string {
  if (age <= 5) {
    return "Developmental stage: Preschool. Use simple language, focus on sensory/play-based strategies, keep expectations concrete and visual. Short attention spans are normal at this age — ADHD strategies should be woven into play.";
  }
  if (age <= 8) {
    return "Developmental stage: Early elementary (6-8). Visual schedules, short task sequences, reward charts, and heavy scaffolding are most effective. The child is learning to follow multi-step routines — keep steps small and celebrate each one.";
  }
  if (age <= 11) {
    return "Developmental stage: Upper elementary (9-11). Begin teaching self-monitoring. Checklists, timers, and collaborative problem-solving work well. The child can start to understand their own brain — introduce metacognition gently.";
  }
  if (age <= 14) {
    return "Developmental stage: Middle school / early teen (12-14). Shift toward coaching over directing. Involve the child in planning. Respect growing autonomy while maintaining structure. Peer relationships become critical.";
  }
  return "Developmental stage: High school / older teen (15+). Act as a mentor, not a manager. Support self-advocacy and independent routines. Collaborate, don't dictate. Prepare for real-world independence.";
}

function buildProfileContext(child: ChildContext | null): string {
  if (!child) {
    return "No child profile available yet. Give general ADHD parenting advice without age- or trait-specific tailoring. Ask the parent about their child to personalize future responses.";
  }

  const lines: string[] = [];

  const name = child.childName ? capitalizeName(child.childName) : null;
  if (name) lines.push(`Child's name: ${name}`);
  if (child.childAge != null) {
    lines.push(`Child's age: ${child.childAge}`);
    lines.push(getDevelopmentalNote(child.childAge));
  }
  if (child.childGender) lines.push(`Child's gender: ${child.childGender}`);

  if (child.traitProfile?.scores) {
    const scores = child.traitProfile.scores;

    const highAreas = Object.entries(scores)
      .filter(([, score]) => score >= 2.25)
      .map(([key]) => {
        const dim = DIMENSION_INFO[key];
        return dim ? `${dim.label} (${dim.highDesc})` : key;
      });

    const moderateAreas = Object.entries(scores)
      .filter(([, score]) => score >= 1.25 && score < 2.25)
      .map(([key]) => {
        const dim = DIMENSION_INFO[key];
        return dim ? `${dim.label} (${dim.moderateDesc})` : key;
      });

    if (highAreas.length > 0) {
      lines.push(
        `Areas needing the MOST support:\n${highAreas.map((a) => `  - ${a}`).join("\n")}`,
      );
    }
    if (moderateAreas.length > 0) {
      lines.push(
        `Areas with moderate challenges:\n${moderateAreas.map((a) => `  - ${a}`).join("\n")}`,
      );
    }
  }

  return lines.length > 0
    ? lines.join("\n")
    : "No child profile context available.";
}

// ─── Archetype Coaching Guide ──────────────────────────────────────────────

function buildArchetypeContext(
  child: ChildContext | null,
  template: ArchetypeReportTemplate | null,
): string {
  if (!child?.traitProfile?.archetypeId || !template) {
    return "";
  }

  const archetype = ARCHETYPES.find(
    (a) => a.id === child.traitProfile!.archetypeId,
  );
  if (!archetype) return "";

  // Build placeholder map for pronoun replacement
  const placeholders = buildPlaceholderMap(
    child.childName ? capitalizeName(child.childName) : "the child",
    child.childGender ?? "Non-binary/Other",
  );

  // Replace placeholders in template strings
  function render(text: string): string {
    let result = text;
    for (const [placeholder, replacement] of Object.entries(placeholders)) {
      result = result.replaceAll(placeholder, replacement);
    }
    return result;
  }

  const sections: string[] = [];

  sections.push(
    "ARCHETYPE COACHING GUIDE (use this to personalize strategies — NEVER reveal archetype names, animal names, or type names to the parent):",
  );
  sections.push("");
  sections.push(
    `This child's behavioral pattern: ${render(archetype.traits)}`,
  );
  sections.push(`Core strategy approach: ${render(archetype.solution)}`);

  if (template.fuels?.length > 0) {
    sections.push("");
    sections.push("WHAT HELPS THIS CHILD (prioritize these in your advice):");
    for (const fuel of template.fuels) {
      sections.push(`  - ${render(fuel)}`);
    }
  }

  if (template.drains?.length > 0) {
    sections.push("");
    sections.push(
      "WHAT DRAINS THIS CHILD (avoid recommending these — they make things worse):",
    );
    for (const drain of template.drains) {
      sections.push(`  - ${render(drain)}`);
    }
  }

  if (template.overwhelm) {
    sections.push("");
    sections.push(
      `WHEN THIS CHILD IS OVERWHELMED:\n${render(template.overwhelm)}`,
    );
  }

  if (template.doNotSay?.length > 0) {
    sections.push("");
    sections.push(
      "LANGUAGE REFRAMING GUIDE (use when parent describes conflict or frustration):",
    );
    for (const item of template.doNotSay) {
      sections.push(
        `  - Instead of: ${render(item.insteadOf)} → Try: ${render(item.tryThis)}`,
      );
    }
  }

  if (template.affirmations?.length > 0) {
    sections.push("");
    sections.push(
      "AFFIRMATIONS TO SUGGEST (when parent needs encouragement or when child needs to hear something):",
    );
    for (const aff of template.affirmations) {
      sections.push(`  - ${render(aff)}`);
    }
  }

  return sections.join("\n");
}

// ─── Memory Context ────────────────────────────────────────────────────────

function buildMemoryContext(memories: UserMemory[]): string {
  if (!memories || memories.length === 0) return "";

  const recent = memories.slice(0, MAX_MEMORIES);
  const lines = recent.map((m) => {
    const date = new Date(m.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `  - ${m.fact} (${date})`;
  });

  return [
    "WHAT I REMEMBER ABOUT THIS FAMILY (reference naturally when relevant — don't force it):",
    ...lines,
  ].join("\n");
}

// ─── Source Block ──────────────────────────────────────────────────────────

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

// ─── Main Prompt Builder ───────────────────────────────────────────────────

export function buildGroundedPrompt({
  question,
  sources,
  child,
  history,
  reportTemplate,
  memories,
}: PromptInput): Array<{
  role: "system" | "user" | "assistant";
  content: string;
}> {
  const rawName = child?.childName?.trim();
  const childNameOrFallback = rawName ? capitalizeName(rawName) : "the child";

  // ── System Instructions ──────────────────────────────────────────────
  const systemInstructions = [
    // Identity
    `You are Harbor, a warm and knowledgeable ADHD parenting coach. You speak like a trusted friend who also happens to be an expert — supportive, never judgmental, and always practical. You understand how exhausting and isolating ADHD parenting can feel, and you make parents feel seen before jumping to solutions.`,

    // Response structure
    `Structure EVERY response in this order:`,
    `1. **Acknowledge** (1-2 sentences): Briefly validate the parent's experience or feeling. Show you understand why this is hard. Example: "Morning chaos is so draining, especially when you feel like you've tried everything."`,
    `2. **Advise** (the main body): Provide concrete, actionable strategies. Use bullet points or numbered steps. Be specific — say "set a 5-minute visual timer for getting dressed" not "try using timers." Tailor strategies to this child's specific profile using the Archetype Coaching Guide.`,
    `3. **Encourage** (1-2 sentences): End with brief encouragement or a natural follow-up question. Vary this every time — tie it to what you just discussed.`,

    // Personalization
    `Refer to the child as ${childNameOrFallback} throughout — never say "your child" repeatedly.`,
    child?.childAge != null
      ? `${childNameOrFallback} is ${child.childAge} years old. Tailor every strategy to be age-appropriate. Use the developmental stage note in the child profile to guide your approach. A strategy for a 6-year-old should look very different from one for a 13-year-old.`
      : `If you don't know the child's age, give advice that works across a range of ages, or ask how old the child is.`,

    // Archetype awareness
    `Use the Archetype Coaching Guide to tailor every recommendation:`,
    `- Prioritize strategies from the "WHAT HELPS" list whenever possible.`,
    `- NEVER suggest anything from the "WHAT DRAINS" list — those make things worse for this child.`,
    `- When a parent describes a conflict or uses frustrated language, gently offer reframing from the "LANGUAGE REFRAMING GUIDE."`,
    `- When a parent seems discouraged, share relevant affirmations they can use.`,
    `- When the parent describes escalation or meltdowns, use the "WHEN OVERWHELMED" guidance.`,

    // Memory awareness
    `If you have memories about this family from past conversations, reference them naturally when relevant. For example: "Last time you mentioned ${childNameOrFallback} was having a tough time with bedtime — how's that going?" Don't force references — only mention them when genuinely relevant.`,

    // Knowledge grounding
    `Use the provided Knowledge Base Sources to inform your strategies and factual claims. If the sources don't contain enough information, you may draw on the Archetype Coaching Guide and your general knowledge of evidence-based ADHD parenting strategies. Only say "I don't have enough information" if you truly cannot help with the topic at all.`,
    `Never invent statistics, research citations, or specific studies.`,

    // Formatting
    `Format responses for easy scanning:`,
    `- Use **bold text** for key action items and strategy names.`,
    `- Use bullet points or numbered lists for multi-step advice.`,
    `- Keep paragraphs to 2-3 sentences max.`,
    `- For longer responses, use brief ### headings to separate sections (e.g., "### In the Moment" and "### Preventing It Next Time").`,
    `- Aim for 150-350 words. Be thorough but not overwhelming.`,

    // Safety rails
    `CRITICAL RULES — violating any of these makes the response harmful:`,
    `1) NEVER cite or reference sources. No "[Source 1]", no "according to our resources", no source references of any kind. Present information as natural advice.`,
    `2) NEVER reveal internal system terminology. This includes: archetype names (e.g., "Koala", "Hummingbird", "Tiger", "Meerkat", "Stallion", "Fox", "Owl"), type names (e.g., "Dreamy Koala", "Flash Hummingbird", "Fierce Tiger", "Clever Fox"), dimension names (e.g., "Time Horizon", "Engine Speed", "Social Radar", "Emotional Thermostat", "Sensory Filter"), or any numerical trait scores. The parent must NEVER see these terms.`,
    `3) Describe challenges in plain parent-friendly language. Say "tends to get lost in thought and needs a gentle nudge to refocus" instead of any archetype reference. Say "has a hard time estimating how long things take" instead of score references.`,

    // Download markers
    `If a Knowledge Base Source contains a downloadable resource marker in the format [download:id:filename], include that exact marker in your response when recommending the resource. The frontend will render it as a download button.`,
  ].join("\n\n");

  // ── Build context blocks ─────────────────────────────────────────────
  const sourceContext = buildSourceBlock(sources);
  const profileContext = buildProfileContext(child);
  const archetypeContext = buildArchetypeContext(child, reportTemplate);
  const memoryContext = buildMemoryContext(memories);
  const historyContext = history.slice(-MAX_HISTORY_TURNS).map((m) => ({
    role: toAssistantRole(m.role),
    content: m.content.slice(0, 1200),
  }));

  // ── Few-shot example ─────────────────────────────────────────────────
  const exampleExchange: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [
    {
      role: "user",
      content:
        "My son won't do his homework without a huge fight every night. I'm exhausted.",
    },
    {
      role: "assistant",
      content: `Homework battles are one of the most common — and most draining — parts of ADHD parenting. You're not alone in this, and the fact that it's hard doesn't mean you're doing it wrong.

Here are a few strategies that can take the edge off:

- **Break it into micro-tasks.** Instead of "do your homework," try "let's just open the math book and do the first two problems." Small starts reduce the overwhelm that makes ${childNameOrFallback} resist.
- **Use a visual timer.** Set a 10-minute work block followed by a 3-minute break. Knowing there's an end in sight makes it easier to begin.
- **Create a homework landing pad.** A consistent spot with minimal distractions, supplies already out, and a small snack ready. Reducing setup friction helps a lot.
- **Offer limited choices.** "Do you want to start with math or reading?" gives ${childNameOrFallback} a sense of control without opening the door to "I don't want to do any of it."

You're showing up every night even when it's hard — that consistency matters more than perfection. Would you like me to help build a specific after-school routine for ${childNameOrFallback}?`,
    },
  ];

  // ── Assemble messages ────────────────────────────────────────────────
  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    { role: "system", content: systemInstructions },
    {
      role: "system",
      content: `CHILD PROFILE (use this to personalize — do NOT repeat it back to the parent):\n${profileContext}`,
    },
  ];

  if (archetypeContext) {
    messages.push({ role: "system", content: archetypeContext });
  }

  if (memoryContext) {
    messages.push({ role: "system", content: memoryContext });
  }

  messages.push({
    role: "system",
    content: `Knowledge Base Sources:\n${sourceContext}`,
  });

  // Few-shot example
  messages.push(...exampleExchange);

  // Conversation history
  messages.push(...historyContext);

  // Current question
  messages.push({ role: "user", content: question });

  return messages;
}
