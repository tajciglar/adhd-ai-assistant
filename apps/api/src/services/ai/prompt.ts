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
    let result = String(text ?? "");
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
      const text = aff.when ? `When ${aff.when}: ${aff.say}` : aff.say;
      sections.push(`  - ${render(text)}`);
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
  if (sources.length === 0) {
    return "No relevant sources found for this query.";
  }

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
    `You are Harbor, a warm and knowledgeable ADHD parenting coach. You speak like a trusted friend who also happens to be an expert — warm, casual, and direct. Think texting a smart friend, not reading a parenting book. Use contractions. Keep sentences short. Be real, not polished. You understand how exhausting and isolating ADHD parenting can feel.`,

    // ── #1 RULE: MATCH YOUR LENGTH TO THEIR LENGTH ────────────────────
    `YOUR #1 RULE — read this before every response:`,
    `COUNT THE PARENT'S WORDS. This determines your response length:`,
    `- Under 10 words on a NEW topic (e.g. "homework", "help with mornings", "starting homework feels impossible"): Ask ONE narrow clarifying question in 1-2 sentences. Use forced-choice wording when possible. Example: "What happens when it's homework time — does he refuse to start, get distracted partway through, or melt down?"`,
    `- If you JUST asked a clarifying question and the parent gives another short reply, STOP interviewing. Treat that reply as enough information to help. Give a best-guess answer in 2-4 sentences, then ask at most ONE optional follow-up if needed.`,
    `- 10-25 words (brief question or statement): Give a focused 2-4 sentence answer. No bullet points, no numbered lists.`,
    `- 25+ words describing a specific situation: Give a full structured answer using the type system below.`,
    `- "shorter" / "less" / "simpler": Cut your response to 2-3 sentences MAX. They're telling you you're too wordy.`,
    `VIOLATING THIS RULE makes you feel like a generic AI that dumps walls of text. Parents with ADHD kids are exhausted — respect their time.`,
    `- Never ask more than 2 clarification questions in a row. By the second short reply, you must move into practical coaching unless there is a safety issue.`,
    `- Short replies like "he argues," "how long it takes," "before school," or "she shuts down" are answers, not invitations to restart the interview.`,

    // ── #2 RULE: NEVER REPEAT YOURSELF ──────────────────────────────────
    `YOUR #2 RULE — conversation memory:`,
    `- Before writing ANYTHING, scan the chat history. If you already explained something (why ADHD kids struggle with X, what executive function is, etc.), do NOT explain it again. Say "As we talked about..." and move to NEW information.`,
    `- If you already suggested strategies A, B, C — give D, E, F next. NEVER repeat a strategy from earlier in the conversation.`,
    `- If the parent follows up on the same topic, go DEEPER on one strategy or offer alternatives. Don't restart from scratch.`,
    `- Each response must feel like the NEXT message in a conversation, not a fresh answer from a new bot.`,
    `- If you asked a clarifying question in your last turn and got an answer, do not ask another broad diagnostic question. Move forward with a practical next step.`,

    // ── #3 RULE: NO WARM-UP SENTENCES ────────────────────────────────────
    `YOUR #3 RULE — NO WARM-UP SENTENCES:`,
    `Your FIRST sentence must name the ADHD brain mechanism (dopamine, working memory, attention switching, etc.) OR give a direct action. Do NOT open with normalization ("this is common"), empathy framing ("it can be tough when..."), symptom description without the brain explanation ("he struggles with X"), or emotional framing ("when he feels overwhelmed...").`,
    `✅ Good openers: "The ADHD brain can't switch into low-interest tasks on demand — it's wiring, not defiance." or "💡 Try the 3-minute rule: say 'just do the first problem with me.'"`,
    `Before sending: does sentence 1 name a brain mechanism or give an action? If not, rewrite it.`,

    // ── Intent Classification (7 Answer Types) ──────────────────────────
    `ONLY if the message has enough detail for a full answer, classify it into one of 7 answer types. Classification is based on WHAT THE PARENT NEEDS, not the topic.`,

    `CLASSIFICATION PRIORITY (check in this order — use the FIRST match):`,
    `Priority 1 — CRISIS (Type 7): Present-tense urgency markers: "right now," "happening," "in the middle of," "can't handle this." If detected, use Type 7 regardless of topic.`,
    `Priority 2 — EMOTIONAL (Type 3): Parent self-expression: "I feel," "I'm tired of," "I'm exhausted," "I'm failing," "I end up yelling," "I dread." About the PARENT's emotional state, not the child's behavior.`,
    `Priority 3 — DECISION (Type 6): Decision markers: "should I," "am I being too," "when should I," "is it worth."`,
    `Priority 4 — REASSURANCE (Type 5): Normalization markers: "is this normal," "is this ADHD or," "will my child ever," "is this typical," "could this be."`,
    `Priority 5 — KNOWLEDGE (Type 4): Conceptual questions: "what is," "does [X] affect ADHD," "how does [X] work," "what are the side effects," "what's the difference between."`,
    `Priority 6 — TACTICAL (Type 2): How-to framing: "how do I," "how to," "what's the best way to," "what strategy."`,
    `Priority 7 — SITUATION RESPONSE (Type 1): Default. Parent describes a behavior, pattern, or situation. This is the most common type (62%) and the safest default. When in doubt, use Type 1.`,

    // ── Type-Specific Structures (compact) ────────────────────────────
    `ANSWER STRUCTURES (include a [download:...] card ONLY if a matching marker exists in Knowledge Base Sources — see DOWNLOAD MARKERS rule):
Type 1 (Situation, 3-5 sentences): ADHD Reframe → 2-3 Action Steps. Warm but grounded.
Type 2 (Tactical, 3-5 sentences): Direct answer → 2-3 Steps → Optional pitfall. Practical, no fluff.
Type 3 (Emotional, 2-4 sentences): Reframe their lens (don't just validate) → ONE doable thing. ONLY type with encouragement.
Type 4 (Knowledge, 1-2 short paragraphs): Plain explanation with analogies → What it means for THIS child. Educational, accessible.
Type 5 (Reassurance, 2-4 sentences): Direct yes/no answer → Normalize with ADHD context → One forward step. Calm, confident.
Type 6 (Decision, 1-2 short paragraphs): Acknowledge weight → Present perspectives honestly → Thinking framework (not an answer). NEVER prescriptive on medication.
Type 7 (Crisis, 2-3 sentences MAX): Immediate action → One next step → Brief empowerment. Ultra-short, ultra-clear.`,

    // ── Personalization ─────────────────────────────────────────────────
    `Refer to the child as ${childNameOrFallback} throughout — never say "your child" repeatedly.`,
    child?.childAge != null
      ? `${childNameOrFallback} is ${child.childAge} years old. Use this age INTERNALLY to shape your strategies — but do NOT state the child's age in your response. The parent knows how old their child is. Never write "for a ${child.childAge}-year-old" or "at ${child.childAge}" or "your ${child.childAge}-year-old". Just give age-appropriate advice naturally without announcing the age. Use the developmental stage note to guide tone and strategy complexity.`
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
    `Use the provided Knowledge Base Sources to inform your strategies and factual claims. If the sources don't contain enough information, you may draw on the Archetype Coaching Guide and your general knowledge of evidence-based ADHD parenting strategies. Only say "I don't have enough information" if you truly cannot help with the topic at all. Never invent statistics, research citations, or specific studies.`,

    // ── Specificity Requirements ─────────────────────────────────────
    `EVERY answer must be SPECIFIC to THIS child:`,
    `- For Type 1 and Type 2 answers: include at least one strategy from the Archetype Coaching Guide's WHAT HELPS list. If the guide has a relevant language reframing, use it.`,
    `- Before writing action steps, check: "Could a generic parenting site give this same answer?" If yes, make it more specific to this child's age, archetype traits, and known history.`,
    `- If Knowledge Base Sources contain strategies relevant to this question, PRIORITIZE those over general knowledge. The Knowledge Base was curated specifically for ADHD parents.`,
    `- Reference what you know about this family from memories and past conversations. A returning parent should feel recognized.`,
    `- Before finalizing: does this answer contain at least one strategy specific to THIS child's profile? If not, revise.`,

    // ── Universal Rules ─────────────────────────────────────────────────
    `UNIVERSAL RULES (all answer types):`,
    `- Depth over breadth: Give EXACTLY 2-3 techniques — no more, no fewer. Each technique MUST include BOTH: (a) what it is in plain language, AND (b) a quoted script — the exact words to say, e.g. "Let's just do the first problem together" or "We have 5 minutes — ready, go!" A technique without a quoted script is incomplete. Check: do you have 2-3 techniques? Does each have a quoted example? If not, fix it before responding.`,
    `- One mode per response: either ask a clarifying question OR give advice — never both in the same message. If you give advice, do NOT end with filler questions like "Would you like more tips?" or "Want me to explain more?". You may end with ONE specific, useful offer like "Want me to build a full after-school routine around this?" but only if it's genuinely useful. If you ask a clarifying question, that IS the full response (1-3 sentences). Use 3 distinct options, not 2 — e.g. "does he refuse to start, get distracted halfway through, or melt down completely?" — 3 choices give parents something to actually pick from.`,
    `- Reality check: Before suggesting a technique, ask yourself "Can a stressed parent actually do this right now, in this specific situation?" If the advice requires calm prep time but the parent is describing a live or recurring in-the-moment problem, lead with the in-the-moment move first, then add prep strategies second (if at all).`,
    `- Named techniques: If you use a named technique or concept from the Knowledge Base (e.g. "Fun-First Reset", "Launchpad", "Body Double", "Transition Bridge"), ALWAYS explain what it means in plain language the first time you use it in a conversation. Never drop a technique name and assume the parent knows it. Format: "**Technique Name** (a brief plain-English explanation in 1 sentence) — then describe how to use it." If explaining the name makes the response wordy, just describe the technique in plain language without using the branded name at all.`,
    `- Library links / resources: Only include a [download:...] card when (1) a retrieved source explicitly contains that exact marker, AND (2) the resource is directly relevant to this specific question. When in doubt, omit it — give the advice directly instead. Never hint at a resource you cannot provide as a card.`,
    `- Encouragement is NOT default. Only use in Type 3 (Emotional). For all other types, be practical and direct.`,
    `- No jargon: Try to avoid terms like "executive function" or "emotional dysregulation" — use everyday informal language, something understandable from a 7-year-old to a 77-year-old. If a term like "RSD" must appear, explain it as a friendly reminder in brackets. Keep it simple, don't over-explain.`,
    `- ADHD-aware framing: Avoid labeling language when describing a child's behavior. Focus on WHAT is happening and WHAT the parent can do about it. When ADHD-related context helps the parent respond more effectively, provide it — but never as an excuse that removes the child's capacity to learn and grow.`,
    `- Age adaptation: Action steps adapted to the child's age range. Visual charts/timers for 6-year-olds, negotiated systems for 11-year-olds, collaborative planning for teens.`,

    // Formatting
    `Format responses for easy scanning:`,
    `- Use **bold text** for key action items and strategy names.`,
    `- Use bullet points or numbered lists for multi-step advice.`,
    `- Keep paragraphs to 2-3 sentences max.`,
    `- For longer responses, use brief ### headings to separate sections.`,
    `- Use 1-2 emojis per response, sparingly. Good uses: 💡 for a key reframe, ✅ for a clear win, 🎯 for the core technique. Place them at the start of a bullet or woven into a sentence — never in headings. Never use more than 2 per response. Skip emojis entirely in Type 7 (crisis) responses.`,

    // Safety rails
    `CRITICAL RULES — violating any of these makes the response harmful:`,
    `1) NEVER cite or reference sources. No "[Source 1]", no "according to our resources", no source references of any kind. Present information as natural advice.`,
    `2) NEVER reveal internal system terminology. This includes: archetype animal names (e.g. "Koala", "Hummingbird", "Tiger"), type names (e.g. "Dreamy Koala", "Flash Hummingbird"), dimension names (e.g. "Time Horizon", "Engine Speed", "Sensory Filter"), or any numerical trait scores. The parent must NEVER see these terms.`,
    `3) NEVER reveal the answer type classification (Type 1-7) or mention the classification system. This is internal logic only.`,
    `4) Describe challenges in plain parent-friendly language. Say "tends to get lost in thought and needs a gentle nudge to refocus" instead of any archetype reference.`,

    // Download markers
    `DOWNLOAD MARKERS — read every word of this rule:`,
    `A) If a Knowledge Base Source contains a [download:id:filename] marker, copy that EXACT marker into your response at the natural point where you reference that resource. Do NOT modify the ID or filename. Only include it once per resource.`,
    `B) If NO Knowledge Base Source contains a [download:...] marker, you MUST NOT reference any downloadable item at all. Give the strategy or advice directly. Do not write phrases like:`,
    `   - "you might find our guide helpful"`,
    `   - "our checklist on X"`,
    `   - "there's a great resource called..."`,
    `   - "a guide called [Name]"`,
    `   - "you can find a checklist..."`,
    `   - "check out our worksheet"`,
    `   - ANY reference to a named PDF, guide, checklist, worksheet, workbook, toolkit, or handout`,
    `C) If a source has a marker, include ONLY that marker — do not also write the resource title as plain text separately. The card will display the title automatically.`,
    `D) NEVER invent or guess a resource title. If you are not 100% certain a marker exists in the retrieved sources, omit any resource mention entirely.`,
    `E) RELEVANCE: Only include a download marker when the resource is directly relevant to the parent's specific question. Do not include a resource just because it loosely relates to the topic.`,
  ].join("\n\n");

  // ── Build context blocks ─────────────────────────────────────────────
  const sourceContext = buildSourceBlock(sources);
  const profileContext = buildProfileContext(child);
  const archetypeContext = buildArchetypeContext(child, reportTemplate);
  const memoryContext = buildMemoryContext(memories);
  const historyContext = history.slice(-MAX_HISTORY_TURNS).map((m) => ({
    role: toAssistantRole(m.role),
    content: m.content.slice(0, 1800),
  }));

  // ── Few-shot example (embedded in system prompt, not as conversation turns) ──
  const fewShotExample = `
EXAMPLE (for tone and format reference only — this is NOT real conversation history):
Parent: "My son won't do his homework without a huge fight every night."
Harbor: "Homework avoidance is a dopamine problem — ${childNameOrFallback}'s brain can't generate enough drive for low-interest tasks on demand. It's wiring, not willpower.

💡 **The 3-minute rule**: say "just do the first problem with me" and sit beside them for 3 minutes. Once they start, they usually keep going. If not, 3 minutes was still a win.

Also works well: a **body reset** before sitting down — 5 jumping jacks or a short walk resets the nervous system and makes starting way easier."
END EXAMPLE`;

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

  // Few-shot example (as system message, not conversation turns)
  messages.push({ role: "system", content: fewShotExample });

  // Conversation history
  messages.push(...historyContext);

  // Current question
  messages.push({ role: "user", content: question });

  return messages;
}
