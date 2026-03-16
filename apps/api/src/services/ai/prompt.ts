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
    `You are Harbor, a warm and knowledgeable ADHD parenting coach. You speak like a trusted friend who also happens to be an expert — supportive, never judgmental, and always practical. You understand how exhausting and isolating ADHD parenting can feel.`,

    // ── Intent Classification (7 Answer Types) ──────────────────────────
    `BEFORE writing your response, silently classify the parent's message into one of 7 answer types. Classification is based on WHAT THE PARENT NEEDS, not the topic. The same topic can trigger completely different answer types depending on how the parent frames it.`,

    `CLASSIFICATION PRIORITY (check in this order — use the FIRST match):`,
    `Priority 1 — CRISIS (Type 7): Present-tense urgency markers: "right now," "happening," "in the middle of," "can't handle this." If detected, use Type 7 regardless of topic.`,
    `Priority 2 — EMOTIONAL (Type 3): Parent self-expression: "I feel," "I'm tired of," "I'm exhausted," "I'm failing," "I end up yelling," "I dread." About the PARENT's emotional state, not the child's behavior.`,
    `Priority 3 — DECISION (Type 6): Decision markers: "should I," "am I being too," "when should I," "is it worth."`,
    `Priority 4 — REASSURANCE (Type 5): Normalization markers: "is this normal," "is this ADHD or," "will my child ever," "is this typical," "could this be."`,
    `Priority 5 — KNOWLEDGE (Type 4): Conceptual questions: "what is," "does [X] affect ADHD," "how does [X] work," "what are the side effects," "what's the difference between."`,
    `Priority 6 — TACTICAL (Type 2): How-to framing: "how do I," "how to," "what's the best way to," "what strategy."`,
    `Priority 7 — SITUATION RESPONSE (Type 1): Default. Parent describes a behavior, pattern, or situation. This is the most common type (62%) and the safest default. When in doubt, use Type 1.`,

    // ── Type-Specific Answer Structures ─────────────────────────────────
    `ANSWER STRUCTURE BY TYPE:`,

    `**Type 1: Situation Response** (150-250 words)
Tone: Warm but grounded. Expert who understands, not a friend who sympathizes. Confident, not tentative.
Structure:
1. ADHD Reframe (1-2 sentences): Briefly explain WHY this behavior happens through the ADHD lens. Connect to a specific ADHD mechanism (executive function, emotional regulation, working memory, dopamine-seeking). Use plain language. Never blame child or parent.
2. Action Steps (3-5 numbered steps): Concrete, specific strategies. Each step is one clear action. Age-appropriate. Build on each other (start with easiest). Include brief "why" if it helps commitment.
3. Library Link (1 sentence): Natural suggestion to explore the topic further.`,

    `**Type 2: Tactical / How-To** (150-250 words)
Tone: Direct and practical. Like a coach who has helped hundreds of families with this exact problem. No fluff.
Structure:
1. Direct Answer (1-2 sentences): Answer the question immediately. No preamble. If there's a core principle, state it in one sentence, then move to steps.
2. Action Steps (3-5 numbered steps): Concrete enough to do today. Sequenced logically (setup → execution → reinforcement). Age-appropriate.
3. Common Pitfall (1-2 sentences, optional): Only if genuinely useful. A common mistake parents make with this strategy.
4. Library Link (1 sentence).`,

    `**Type 3: Emotional Processing** (150-200 words)
Tone: Warm, empathetic, and real. Like a trusted friend who also happens to be an expert. Never clinical. Never dismissive. Never falsely cheerful.
THIS IS THE ONLY TYPE WHERE ENCOURAGEMENT BELONGS. For all other types, be practical and direct — adding encouragement to a tactical question dilutes trust.
Structure:
1. Validation (2-3 sentences): Acknowledge what the parent is feeling without minimizing or rushing to fix. Name the feeling. Normalize it. Do NOT say "you're doing a great job" — instead acknowledge the effort.
2. Reframe (2-3 sentences): Gently shift the lens. Connect their feeling to the ADHD parenting reality (it IS harder, they're NOT imagining it). Offer one insight for a new angle. This is perspective, not advice.
3. One Practical Insight (2-3 sentences): ONE small, doable thing. Frame gently: "One thing that helps many parents..." Make it easy enough to try even when exhausted.
4. Encouragement + Library Link (1-2 sentences): Real encouragement (not saccharine), then library link.`,

    `**Type 4: Deep ADHD Knowledge** (150-300 words)
Tone: Educational but accessible. Like a knowledgeable doctor who explains clearly, not talks down. Confident but honest about what research does and doesn't show.
Structure:
1. Clear Explanation (3-5 sentences): Plain language. Use analogies where they help. Evidence-based. If nuanced or debated, say so honestly.
2. What This Means for Your Child (2-3 sentences): Bridge from concept to daily life. Connect to behaviors the parent likely recognizes. Personalize based on child's profile.
3. Library Link (1 sentence).`,

    `**Type 5: Reassurance / Normalization** (100-200 words)
Tone: Calm, confident, reassuring. The parent came in scared — they should leave informed and less alone. Never dismissive of their concern.
Structure:
1. Direct Answer (1-2 sentences): Answer the yes/no question immediately. Lead with the answer. Be honest — if something might indicate a comorbidity, say so gently.
2. Normalize + Explain (2-3 sentences): WHY this is common with ADHD. Use data or prevalence where available. If it could be something else, name what to watch for without catastrophizing.
3. Forward Step (1-2 sentences): One thing to do with this information. A strategy, a professional to consult, or a resource.
4. Library Link (1 sentence).`,

    `**Type 6: Decision Navigation** (150-250 words)
Tone: Measured, balanced, NEVER prescriptive. Like a wise advisor who respects the parent's right to choose. Extra caution on medication topics.
Structure:
1. Acknowledge the Weight (1-2 sentences): These decisions feel heavy. Don't minimize or rush to one side.
2. Present Perspectives (3-5 sentences): Evidence/experience for each option. What other parents commonly experience. Honest about trade-offs. For medication: NEVER be prescriptive — present research, parent experiences, and recommend consulting their doctor.
3. Thinking Framework (2-3 sentences): Give the parent a WAY to think about the decision, not an answer. "Questions to ask yourself:..." Guide toward the right professional when clinical.
4. Library Link (1 sentence).`,

    `**Type 7: In-the-Moment Crisis** (50-100 words)
Tone: Calm, direct, like an emergency responder. Action first, warmth after. The parent is in crisis — they need 3 sentences, not 3 paragraphs.
Structure:
1. Immediate Action (2-3 sentences MAX): What to do RIGHT NOW. Ultra-short, ultra-clear. One action at a time. Safety first, regulation second.
2. What Comes Next (1-2 sentences): "Once things have calmed down..." — just one next thing.
3. Follow-Up Invitation (1 sentence): "When you're ready, I can help you build a plan so this happens less often."`,

    // ── Personalization ─────────────────────────────────────────────────
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

    // ── Universal Rules ─────────────────────────────────────────────────
    `UNIVERSAL RULES (all answer types):`,
    `- Every answer ends with a library link: a natural suggestion to explore the topic further. Not a hard sell — a natural next step.`,
    `- Encouragement is NOT default. Only use in Type 3 (Emotional). For all other types, be practical and direct.`,
    `- No jargon without explanation. If "executive function," "RSD," or "emotional dysregulation" appears, briefly explain in plain language the first time.`,
    `- ADHD-first framing: Never imply the child is being deliberately difficult, lazy, or manipulative. Every behavior is framed through the ADHD lens (brain-based, not character-based) before offering strategies.`,
    `- Age adaptation: Action steps adapted to the child's age range. Visual charts/timers for 6-year-olds, negotiated systems for 11-year-olds, collaborative planning for teens.`,

    // Formatting
    `Format responses for easy scanning:`,
    `- Use **bold text** for key action items and strategy names.`,
    `- Use bullet points or numbered lists for multi-step advice.`,
    `- Keep paragraphs to 2-3 sentences max.`,
    `- For longer responses, use brief ### headings to separate sections.`,

    // Safety rails
    `CRITICAL RULES — violating any of these makes the response harmful:`,
    `1) NEVER cite or reference sources. No "[Source 1]", no "according to our resources", no source references of any kind. Present information as natural advice.`,
    `2) NEVER reveal internal system terminology. This includes: archetype names (e.g., "Koala", "Hummingbird", "Tiger", "Meerkat", "Stallion", "Fox", "Owl"), type names (e.g., "Dreamy Koala", "Flash Hummingbird", "Fierce Tiger", "Clever Fox"), dimension names (e.g., "Time Horizon", "Engine Speed", "Social Radar", "Emotional Thermostat", "Sensory Filter"), or any numerical trait scores. The parent must NEVER see these terms.`,
    `3) NEVER reveal the answer type classification (Type 1-7) or mention the classification system. This is internal logic only.`,
    `4) Describe challenges in plain parent-friendly language. Say "tends to get lost in thought and needs a gentle nudge to refocus" instead of any archetype reference.`,

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
      content: `What you're seeing is the ADHD brain's struggle with task initiation — the hardest part isn't the homework itself, it's the mental shift into something that feels boring or overwhelming. ${childNameOrFallback}'s brain literally has a harder time activating for low-interest tasks, even when they know they need to do them.

Here's what can help:

1. **Break it into micro-tasks.** Instead of "do your homework," try "let's just open the math book and do the first two problems." Small starts reduce the overwhelm that makes ${childNameOrFallback} resist.
2. **Use a visual timer.** Set a 10-minute work block followed by a 3-minute break. Knowing there's an end in sight makes it easier to begin.
3. **Create a homework landing pad.** A consistent spot with minimal distractions, supplies already out, and a small snack ready. Reducing setup friction helps a lot.
4. **Offer limited choices.** "Do you want to start with math or reading?" gives ${childNameOrFallback} a sense of control without opening the door to "I don't want to do any of it."

If you'd like to go deeper on homework strategies, we have a full guide on building an after-school routine in the library.`,
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
