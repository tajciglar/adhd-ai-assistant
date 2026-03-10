// ─── Likert Scale ───────────────────────────────────────────────────────────

export const LIKERT_OPTIONS = [
  { label: "Not really", value: 0 },
  { label: "Sometimes", value: 1 },
  { label: "Often", value: 2 },
  { label: "Always", value: 3 },
] as const;

// ─── Category IDs ───────────────────────────────────────────────────────────

export type CategoryId =
  | "inattentive"
  | "hyperactive"
  | "sensory"
  | "emotional"
  | "executive_function"
  | "social";

export const CATEGORY_IDS: CategoryId[] = [
  "inattentive",
  "hyperactive",
  "sensory",
  "emotional",
  "executive_function",
  "social",
];

// ─── Basic Info Steps (1-6) ─────────────────────────────────────────────────

export interface BasicInfoQuestion {
  type: "single-select" | "text" | "number";
  key: string;
  title: string;
  emoji?: string;
  options?: string[];
  optionEmojis?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export const BASIC_INFO_QUESTIONS: BasicInfoQuestion[] = [
  {
    type: "single-select",
    key: "caregiverType",
    title: "You are",
    emoji: "🧑",
    options: ["Mom", "Dad", "Grandma / Grandpa", "Other Caregiver"],
    optionEmojis: ["👩", "👨", "👴", "🧑"],
  },
  {
    type: "single-select",
    key: "childAgeRange",
    title: "How old is your child?",
    emoji: "🎂",
    options: ["3-5", "6-8", "9-11", "12-14", "15+"],
    optionEmojis: ["👶", "🧒", "👦", "🧑‍🎓", "🎓"],
  },
  {
    type: "single-select",
    key: "childGender",
    title: "You are raising:",
    emoji: "👶",
    options: ["A Boy", "A Girl", "A Non-binary/Other"],
    optionEmojis: ["👦", "👧", "🌈"],
  },
  {
    type: "single-select",
    key: "adhdJourney",
    title: "Where are you on the ADHD journey?",
    emoji: "🧩",
    options: ["Formally diagnosed", "Self-diagnosed", "Suspected, figuring it out"],
    optionEmojis: ["📋", "🔍", "🤔"],
  },
  {
    type: "text",
    key: "childName",
    title: "Your Child's Name",
    emoji: "🌟",
    placeholder: "First name",
  },
];

// ─── Assessment Categories (steps 7-37) ─────────────────────────────────────

export interface AssessmentCategory {
  id: CategoryId;
  subtitle: string;
  questions: string[];
}

export const ASSESSMENT_CATEGORIES: AssessmentCategory[] = [
  {
    id: "inattentive",
    subtitle: "Inattentive Traits",
    questions: [
      "Makes careless mistakes in schoolwork or chores.",
      "Has trouble sustaining attention during play or tasks.",
      "Zones out when spoken to directly, even in a quiet setting.",
      'Fails to finish instructions or complete "boring" tasks.',
      "Frequently loses things necessary for tasks (shoes, pencils, toys).",
      "Is easily distracted by unrelated noises or thoughts.",
      "Gets so lost in {pos} own thoughts {sub} {dont} notice time passing.",
    ],
  },
  {
    id: "hyperactive",
    subtitle: "Hyperactive/Impulsive Traits",
    questions: [
      "Fidgets with hands/feet or squirms constantly in {pos} seat.",
      "Leaves {pos} seat in situations where staying seated is expected.",
      "Runs or climbs excessively in inappropriate situations.",
      'Talks excessively or "blurts out" answers before a question is finished.',
      "Has energy that seems impossible to switch off, even at bedtime.",
      "Has extreme difficulty waiting for {pos} turn.",
      "Does physically dangerous things without stopping to think first.",
    ],
  },
  {
    id: "sensory",
    subtitle: "Sensory Processing",
    questions: [
      "Gets upset by clothing tags, sock seams, or messy textures (mud, glue).",
      'Craves "crashing," jumping, or roughhousing to feel "centered."',
      "Is distressed by loud, sudden noises (vacuums, hand dryers, crowds).",
      "Gets overwhelmed in busy or cluttered places (toy stores, busy classrooms).",
      "Uses more force than needed (slams doors, breaks toys, hugs too hard).",
      "Chews on clothing, pencils, or non-food objects.",
      "Constantly needs to touch things.",
    ],
  },
  {
    id: "emotional",
    subtitle: "Dysregulation",
    questions: [
      "Has a very low frustration tolerance, gets upset quickly over small obstacles.",
      "Can go from happy to devastated over something that seems very small to others.",
      'Is hypersensitive to criticism or perceived "rejection."',
      'Has "explosive" meltdowns that seem out of proportion to the trigger.',
      "Has trouble calming down once {sub} {is} already upset.",
      "Holds onto feelings from an argument or disappointment, long after others have moved on.",
    ],
  },
  {
    id: "executive_function",
    subtitle: "Executive Function",
    questions: [
      'Struggles to "get started" on a task, even knowing how.',
      "Forgets what {sub} {was} doing mid-task (e.g., sent to get shoes, found playing instead).",
      'Seems to have no concept of "5 minutes" vs "30 minutes."',
      "Struggles with multi-step directions (e.g., 'Get your bag, put on shoes, and come downstairs').",
      "Gets so absorbed in a favourite activity {sub} {is} shocked when told how much time has passed.",
      "Can't seem to start a task without someone sitting with {obj}, even when knowing what to do.",
    ],
  },
  {
    id: "social",
    subtitle: "Social Cues",
    questions: [
      "Interrupts others' conversations or games frequently.",
      'Struggles to "read the room" (noticing when a friend is annoyed or bored).',
      "Struggles to understand why a friendship ended or why a peer is upset with {obj}.",
      'Gets "stuck" on a favourite topic, even if no one else is interested.',
      "Insists on controlling the rules of games and gets upset if others change them.",
      "Shares very personal thoughts or information with strangers, seems to have no 'filter'.",
    ],
  },
];

// ─── Archetypes ─────────────────────────────────────────────────────────────

export interface Archetype {
  id: string;
  animal: string;
  typeName: string;
  primaryTrait: CategoryId[];
  explanation: string;
  traits: string;
  solution: string;
  childPerspective: string;
}

export const ARCHETYPES: Archetype[] = [
  {
    id: "koala",
    animal: "The Koala",
    typeName: "The Dreamy Koala",
    primaryTrait: ["inattentive", "executive_function"],
    explanation: "Inattentive + Executive Function profile.",
    traits: "Reflective, imaginative, loses track of steps and time.",
    solution: "Use visual structure and one-step instructions.",
    childPerspective: "",
  },
  {
    id: "hummingbird",
    animal: "The Hummingbird",
    typeName: "The Flash Hummingbird",
    primaryTrait: ["inattentive", "hyperactive"],
    explanation: "Inattentive + Hyperactive profile.",
    traits: "Fast shifts in attention, very active, impulsive starts.",
    solution: "Short task cycles, movement breaks, rapid feedback.",
    childPerspective: "",
  },
  {
    id: "tiger",
    animal: "The Tiger",
    typeName: "The Fierce Tiger",
    primaryTrait: ["inattentive", "emotional"],
    explanation: "Inattentive + Emotional profile.",
    traits: "Fluctuating focus with big emotional reactions.",
    solution: "Co-regulation first, then task re-entry.",
    childPerspective: "",
  },
  {
    id: "meerkat",
    animal: "The Meerkat",
    typeName: "The Observing Meerkat",
    primaryTrait: ["inattentive", "sensory"],
    explanation: "Inattentive + Sensory profile.",
    traits: "Easily overloaded, scanning environment, variable focus.",
    solution: "Lower sensory load and add predictable routines.",
    childPerspective: "",
  },
  {
    id: "stallion",
    animal: "The Stallion",
    typeName: "The Bold Stallion",
    primaryTrait: ["emotional", "executive_function"],
    explanation: "Emotional + Executive Function profile.",
    traits: "Strong feelings and friction around transitions/planning.",
    solution: "External time supports plus calm transition rituals.",
    childPerspective: "",
  },
  {
    id: "fox",
    animal: "The Fox",
    typeName: "The Clever Fox",
    primaryTrait: ["executive_function", "social"],
    explanation: "Executive Function + Social profile.",
    traits: "Socially agile with timing/planning weak points.",
    solution: "First/Then flows and clear social boundaries.",
    childPerspective: "",
  },
];

// ─── Step Configuration ─────────────────────────────────────────────────────

export const TOTAL_STEPS = 44;
const BASIC_INFO_COUNT = BASIC_INFO_QUESTIONS.length; // 6

/** Flat list of all Likert questions with their category info */
export interface LikertStepConfig {
  type: "likert";
  categoryId: CategoryId;
  categorySubtitle: string;
  questionIndex: number;
  questionText: string;
}

export interface BasicInfoStepConfig {
  type: "basic-info";
  question: BasicInfoQuestion;
}

export type StepConfig = BasicInfoStepConfig | LikertStepConfig;

/** Build flat list of all Likert steps */
const LIKERT_STEPS: LikertStepConfig[] = ASSESSMENT_CATEGORIES.flatMap(
  (cat) =>
    cat.questions.map((q, i) => ({
      type: "likert" as const,
      categoryId: cat.id,
      categorySubtitle: cat.subtitle,
      questionIndex: i,
      questionText: q,
    })),
);

/** Get configuration for a 1-indexed step number */
export function getStepConfig(step: number): StepConfig {
  if (step >= 1 && step <= BASIC_INFO_COUNT) {
    return {
      type: "basic-info",
      question: BASIC_INFO_QUESTIONS[step - 1],
    };
  }
  const likertIndex = step - BASIC_INFO_COUNT - 1;
  return LIKERT_STEPS[likertIndex];
}

/** Get the onboarding response key for a given step */
export function getStepKey(step: number): string {
  const config = getStepConfig(step);
  if (config.type === "basic-info") {
    return config.question.key;
  }
  return `${config.categoryId}_${config.questionIndex}`;
}

// ─── Scoring ────────────────────────────────────────────────────────────────

export type Intensity = "low" | "moderate" | "high";

export function scoreCategory(answers: number[]): number {
  if (answers.length === 0) return 0;
  const total = answers.reduce((sum, a) => sum + a, 0);
  return Number((total / answers.length).toFixed(2));
}

export function normalizeScore(rawScore: number, maxRaw: number): number {
  if (maxRaw === 0) return 0;
  return Math.round((rawScore / maxRaw) * 18);
}

export function getIntensity(normalized: number): Intensity {
  // Scales for section averages on a 0..3 Likert scale.
  if (normalized < 1.25) return "low";
  if (normalized < 2.25) return "moderate";
  return "high";
}

export interface TraitScores {
  inattentive: number;
  hyperactive: number;
  sensory: number;
  emotional: number;
  executive_function: number;
  social: number;
}

export interface TraitProfile {
  scores: TraitScores;
  archetypeId: string;
}

/**
 * Extract per-category answer arrays from the flat onboarding responses.
 * Keys are like "filter_0", "filter_1", "engine_0", etc.
 */
export function extractCategoryAnswers(
  responses: Record<string, unknown>,
): Record<CategoryId, number[]> {
  const result = {} as Record<CategoryId, number[]>;

  for (const cat of ASSESSMENT_CATEGORIES) {
    const answers: number[] = [];
    for (let i = 0; i < cat.questions.length; i++) {
      const key = `${cat.id}_${i}`;
      const val = responses[key];
      answers.push(typeof val === "number" ? val : 0);
    }
    result[cat.id] = answers;
  }

  return result;
}

function sortCategoriesByScore(scores: TraitScores): CategoryId[] {
  const rankOrder: Record<CategoryId, number> = {
    inattentive: 0,
    hyperactive: 1,
    sensory: 2,
    emotional: 3,
    executive_function: 4,
    social: 5,
  };

  return [...CATEGORY_IDS].sort((a, b) => {
    const diff = scores[b] - scores[a];
    if (diff !== 0) return diff;
    return rankOrder[a] - rankOrder[b];
  });
}

/**
 * Compute section averages (0..3) for each category.
 */
export function computeScores(
  responses: Record<string, unknown>,
): TraitScores {
  const categoryAnswers = extractCategoryAnswers(responses);
  const scores = {} as TraitScores;

  for (const cat of ASSESSMENT_CATEGORIES) {
    const answers = categoryAnswers[cat.id];
    scores[cat.id] = scoreCategory(answers);
  }

  return scores;
}

/**
 * Match archetype by top-2 ranking:
 * 1) Rank all six categories by section average.
 * 2) Take top two.
 * 3) Find archetype with exact 2-dimension combination (order-insensitive).
 * 4) If no exact pair exists, fallback to the first archetype containing both dimensions.
 */
export function matchArchetype(scores: TraitScores): Archetype {
  const ranked = sortCategoriesByScore(scores);
  const topA = ranked[0];
  const topB = ranked[1];
  const topTwo = new Set<CategoryId>([topA, topB]);

  const exactCandidates = ARCHETYPES.filter(
    (arch) =>
      arch.primaryTrait.length === 2 &&
      arch.primaryTrait.every((d) => topTwo.has(d)),
  );

  if (exactCandidates.length > 0) {
    return exactCandidates[0];
  }

  const inclusiveCandidates = ARCHETYPES.filter((arch) =>
    arch.primaryTrait.includes(topA) && arch.primaryTrait.includes(topB),
  );

  if (inclusiveCandidates.length > 0) {
    return inclusiveCandidates[0];
  }

  return ARCHETYPES[0];
}

/**
 * Full pipeline: responses → scores → archetype → TraitProfile
 */
export function computeTraitProfile(
  responses: Record<string, unknown>,
): TraitProfile {
  const scores = computeScores(responses);
  const archetype = matchArchetype(scores);
  return { scores, archetypeId: archetype.id };
}
