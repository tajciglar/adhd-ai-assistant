// ─── Likert Scale ───────────────────────────────────────────────────────────

export const LIKERT_OPTIONS = [
  { label: "Never / Not at all", value: 0 },
  { label: "Occasionally / A little", value: 1 },
  { label: "Often / A lot", value: 2 },
  { label: "Very Often / Always", value: 3 },
] as const;

// ─── Category IDs ───────────────────────────────────────────────────────────

export type CategoryId =
  | "filter"
  | "engine"
  | "sensory"
  | "fuse"
  | "time"
  | "social";

export const CATEGORY_IDS: CategoryId[] = [
  "filter",
  "engine",
  "sensory",
  "fuse",
  "time",
  "social",
];

// ─── Basic Info Steps (1-6) ─────────────────────────────────────────────────

export interface BasicInfoQuestion {
  type: "single-select" | "text" | "number";
  key: string;
  title: string;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export const BASIC_INFO_QUESTIONS: BasicInfoQuestion[] = [
  {
    type: "single-select",
    key: "parentGender",
    title: "Your Gender",
    options: ["Male", "Female", "Non-binary/Other"],
  },
  {
    type: "single-select",
    key: "parentAgeRange",
    title: "Your Age Range",
    options: ["18–30", "31–45", "46–60", "61+"],
  },
  {
    type: "text",
    key: "childName",
    title: "Child's Name",
    placeholder: "First name",
  },
  {
    type: "number",
    key: "childAge",
    title: "Child's Age",
    min: 1,
    max: 25,
  },
  {
    type: "single-select",
    key: "childGender",
    title: "Child's Gender",
    options: ["Male", "Female", "Non-binary/Other"],
  },
  {
    type: "single-select",
    key: "householdStructure",
    title: "Household Structure",
    options: [
      "Two-parent household",
      "Single-parent household",
      "Co-parenting (separate households)",
      "Multi-generational (grandparents/relatives living in)",
    ],
  },
];

// ─── Assessment Categories (steps 7-37) ─────────────────────────────────────

export interface AssessmentCategory {
  id: CategoryId;
  label: string;
  subtitle: string;
  questions: string[];
}

export const ASSESSMENT_CATEGORIES: AssessmentCategory[] = [
  {
    id: "filter",
    label: "The Attention Filter",
    subtitle: "Inattentive Traits",
    questions: [
      "Makes careless mistakes in schoolwork or chores.",
      "Has trouble sustaining attention during play or tasks.",
      'Seems not to listen when spoken to directly (the "in a fog" look).',
      'Fails to finish instructions or complete "boring" tasks.',
      "Frequently loses things necessary for tasks (shoes, pencils, toys).",
      "Is easily distracted by unrelated noises or thoughts.",
    ],
  },
  {
    id: "engine",
    label: "The Engine Speed",
    subtitle: "Hyperactive/Impulsive Traits",
    questions: [
      "Fidgets with hands/feet or squirms constantly in their seat.",
      "Leaves their seat in situations where staying seated is expected.",
      "Runs or climbs excessively in inappropriate situations.",
      'Talks excessively or "blurts out" answers before a question is finished.',
      'Acts as if "driven by a motor" (hard to slow down).',
      "Has extreme difficulty waiting for their turn.",
    ],
  },
  {
    id: "sensory",
    label: "The Sensory Guard",
    subtitle: "Sensory Processing",
    questions: [
      "Gets upset by clothing tags, seams in socks, or messy play (mud/glue).",
      'Craves "crashing," jumping, or roughhousing to feel "centered."',
      "Is distressed by loud, sudden noises (vacuums, hand dryers, crowds).",
      'Gets overwhelmed in "busy" places like toy stores or cluttered rooms.',
      "Appears clumsy or uses too much force (e.g., slamming doors unintentionally).",
    ],
  },
  {
    id: "fuse",
    label: "The Emotional Thermostat",
    subtitle: "Dysregulation",
    questions: [
      'Has a very "low fuse" or low frustration tolerance.',
      "Experiences rapid mood changes based on small changes in the environment.",
      'Is hypersensitive to criticism or perceived "rejection."',
      'Has "explosive" meltdowns that seem out of proportion to the trigger.',
      "Has trouble calming down once they are already upset.",
    ],
  },
  {
    id: "time",
    label: "The Time Horizon",
    subtitle: "Executive Function",
    questions: [
      'Struggles to "get started" on a task even when they know how.',
      "Forgets what they were doing mid-task (e.g., goes to get a coat, ends up playing with a toy).",
      'Seems to have no concept of "5 minutes" vs "30 minutes."',
      'Struggles with multi-step directions (e.g., "Get your bag, put on shoes, and meet me at the car").',
    ],
  },
  {
    id: "social",
    label: "The Social Radar",
    subtitle: "Social Cues",
    questions: [
      "Interrupts others' conversations or games frequently.",
      'Struggles to "read the room" (noticing when a friend is annoyed or bored).',
      'Plays too "roughly" or gets too close to people\'s personal space.',
      'Gets "stuck" on a topic they love, even if no one else is interested.',
      'Struggles with "give and take" in imaginative play.',
    ],
  },
];

// ─── Archetypes ─────────────────────────────────────────────────────────────

export interface Archetype {
  id: string;
  animal: string;
  typeName: string;
  highDimensions: CategoryId[];
  explanation: string;
  traits: string;
  solution: string;
  childPerspective: string;
}

export const ARCHETYPES: Archetype[] = [
  {
    id: "koala",
    animal: "The Koala",
    typeName: "The Deep Dreamer",
    highDimensions: ["filter", "time"],
    explanation:
      'High Inattention + High Time Blindness. Their brain struggles to stay "online" in the present moment.',
    traits: 'Quiet, forgetful, "spacey," prone to staring out windows.',
    solution:
      'Visual Cues: Don\'t just say "get ready." Use a photo checklist of what "ready" looks like.',
    childPerspective:
      '"I forgot what I was doing before I even started."',
  },
  {
    id: "deer",
    animal: "The Deer",
    typeName: "The Observer",
    highDimensions: ["filter", "sensory"],
    explanation:
      'High Inattention + Sensory Avoiding. They use daydreaming as a shield.',
    traits: "Withdrawn, avoids groups, daydreams to escape noise.",
    solution:
      "Safe Zones: Give them a quiet, low-stimulation corner to retreat to when they are overwhelmed.",
    childPerspective:
      '"It\'s safer and quieter inside my own head."',
  },
  {
    id: "owl",
    animal: "The Owl",
    typeName: "The Professor",
    highDimensions: ["filter", "social"],
    explanation:
      'High Inattention + Social Blindness. They often "hyper-focus" on a specific topic and miss the cue that others aren\'t interested.',
    traits:
      'Hyper-focused on one hobby, misses social cues, "know-it-all."',
    solution:
      'Topic Timers: Use a "timer" for their favorite topic to teach them the "give and take" of conversation.',
    childPerspective:
      '"Did you know that sharks have no bones? Listen..."',
  },
  {
    id: "border-collie",
    animal: "The Border Collie",
    typeName: "The Tornado",
    highDimensions: ["engine", "sensory"],
    explanation:
      'High Engine + Sensory Seeking. They have "Low Proprioception," meaning they don\'t feel where their body is unless they are crashing or moving fast.',
    traits: "Loud, crashing, constantly moving, high physical risk-taker.",
    solution:
      'Heavy Work: Have them carry groceries, push a weighted cart, or do "wall pushes" to ground their body.',
    childPerspective:
      '"I need to feel my body move to feel alive."',
  },
  {
    id: "golden-retriever",
    animal: "The Golden Retriever",
    typeName: "The High-Wire",
    highDimensions: ["engine", "fuse"],
    explanation:
      'High Engine + Emotional Dysregulation. They act on an emotion before the "logical brain" can intervene.',
    traits: 'Impulsive, acts before thinking, frequent "accidents."',
    solution:
      'The "Pause" Button: Practice a physical "freeze" game during play to build the muscle of stopping mid-action.',
    childPerspective:
      '"I did it before I realized it was a bad idea."',
  },
  {
    id: "butterfly",
    animal: "The Butterfly",
    typeName: "The Sparkler",
    highDimensions: ["engine", "social"],
    explanation:
      "High Engine + Social Radar. They are desperate to connect but move too fast.",
    traits:
      'Interrupts, talks over people, "too much" for peers.',
    solution:
      'Wait-Stickers: Give them a physical object (like a fidget) to hold when someone else is talking to remind them to "hold" their thought.',
    childPerspective:
      '"I have so many ideas I have to say them NOW!"',
  },
  {
    id: "hedgehog",
    animal: "The Hedgehog",
    typeName: "The High-Definition Soul",
    highDimensions: ["sensory", "fuse"],
    explanation:
      'High Sensory Avoiding + Emotional Dysregulation. Their "volume knob" is turned up too high.',
    traits:
      'Prickly, hates loud noises/labels, "moody" in crowds.',
    solution:
      'Control: Let them choose their clothes/textures. Use noise-canceling headphones in public to lower the "threat" level.',
    childPerspective:
      '"Everything is too loud and my socks hurt."',
  },
  {
    id: "panda",
    animal: "The Panda",
    typeName: "The Sensitive Perfectionist",
    highDimensions: ["filter", "fuse"],
    explanation:
      'High Emotionality + Focus Gaps. When they can\'t do a task immediately, they experience "task paralysis."',
    traits:
      "Easily overwhelmed, cries or gets angry when frustrated.",
    solution:
      'Micro-Steps: Break a task down into something so small it\'s impossible to fail (e.g., "Just write your name on the paper").',
    childPerspective:
      '"This is too hard. I\'m not even going to try."',
  },
  {
    id: "elephant",
    animal: "The Elephant",
    typeName: "The Justice Warrior",
    highDimensions: ["fuse", "social"],
    explanation:
      'High Emotionality + Social Blindness. They have a rigid "moral" brain.',
    traits:
      "Argumentative about rules, hyper-aware of unfairness, blunt.",
    solution:
      '"My Truth vs. The Truth": Use social stories to explain that different people can have different rules or feelings at the same time.',
    childPerspective:
      '"That\'s not the rule! Why are you doing it wrong?"',
  },
  {
    id: "cheetah",
    animal: "The Cheetah",
    typeName: "The Sprint Finisher",
    highDimensions: ["time", "fuse"],
    explanation:
      'High Time Blindness + Emotional Avoidance. They only feel the "Now."',
    traits:
      'Panic-driven, only works under pressure, hates transitions.',
    solution:
      'External Clocks: Use sand timers or "Time Timer" visual clocks so they can see time moving.',
    childPerspective:
      '"I\'ll do it later... [1 hour later] ...OH NO!"',
  },
  {
    id: "fox",
    animal: "The Fox",
    typeName: "The Negotiator",
    highDimensions: ["time", "social"],
    explanation:
      'High Time Blindness + Social Skills. They use their high verbal intelligence to "talk their way out" of tasks.',
    traits:
      "Manipulates situations to avoid tasks, very charming.",
    solution:
      '"First/Then": Keep it simple. "First, socks. Then, iPad." Do not enter the debate; repeat the phrase calmly.',
    childPerspective:
      '"If I be extra nice, maybe they\'ll forget the chores."',
  },
  {
    id: "bison",
    animal: "The Bison",
    typeName: "The Thunderstorm",
    highDimensions: ["engine", "sensory", "fuse"],
    explanation:
      "High physical power mixed with a very low threshold for sensory irritation.",
    traits:
      'Intense, physically strong, prone to sudden "explosions."',
    solution:
      'Heavy Work: Pushing, pulling, or carrying heavy items to "ground" the nervous system.',
    childPerspective: "",
  },
  {
    id: "firefly",
    animal: "The Firefly",
    typeName: "The Starry-Eyed Scholar",
    highDimensions: ["filter", "time", "social"],
    explanation:
      'A bright, creative mind that struggles to stay "lit" in social or timed settings.',
    traits:
      "Imaginative, socially drifting, loses track of time mid-sentence.",
    solution:
      'Visual Anchors: Using "Time Timers" and picture-based schedules to stay in the "Now."',
    childPerspective: "",
  },
  {
    id: "snow-leopard",
    animal: "The Snow Leopard",
    typeName: "The Stealth Fighter",
    highDimensions: ["filter", "sensory", "time"],
    explanation:
      'An internalizer who hides their struggle by withdrawing or appearing "lazy."',
    traits:
      "Observant, easily overwhelmed by noise, avoids new tasks.",
    solution:
      'Low-Stim Zones: Creating a "sensory cave" where they can work without noise or bright light.',
    childPerspective: "",
  },
  {
    id: "peacock",
    animal: "The Peacock",
    typeName: "The Lead Singer",
    highDimensions: ["engine", "fuse", "social"],
    explanation:
      "Driven by social connection and high-octane emotional energy.",
    traits:
      "Charismatic, dramatic, seeks constant feedback/attention.",
    solution:
      'Positive Redirection: Giving them a "stage" or leadership role to channel their energy.',
    childPerspective: "",
  },
  {
    id: "beaver",
    animal: "The Beaver",
    typeName: "The Architect",
    highDimensions: ["filter", "social", "time", "sensory"],
    explanation:
      "Needs their environment to be perfectly structured to feel safe.",
    traits:
      "Rigid, detail-oriented, struggles deeply with transitions.",
    solution:
      'The "5-Minute Warning": Using clear, repetitive transition rituals before changing activities.',
    childPerspective: "",
  },
  {
    id: "jackrabbit",
    animal: "The Jackrabbit",
    typeName: "The Fire-Cracker",
    highDimensions: ["engine", "fuse", "time"],
    explanation:
      'High-speed movement without a "braking system" for emotions or consequences.',
    traits:
      'Impulsive, impatient, gets "hot" fast when frustrated.',
    solution:
      'The "Pause" Button: Practicing physical "Stop/Go" games to build inhibitory control.',
    childPerspective: "",
  },
  {
    id: "blue-whale",
    animal: "The Blue Whale",
    typeName: "The Gentle Giant",
    highDimensions: ["sensory", "social", "filter"],
    explanation:
      'Absorbs the emotions of everyone in the room; feels "too much."',
    traits:
      "Deeply empathetic, quiet, easily exhausted by crowds.",
    solution:
      'Emotional Shielding: Teaching them to identify "their" feelings vs. "other people\'s" feelings.',
    childPerspective: "",
  },
  {
    id: "peregrine-falcon",
    animal: "The Peregrine Falcon",
    typeName: "The Speed-Reader",
    highDimensions: ["engine", "filter", "time"],
    explanation:
      "Operates at such high speeds that details and safety are often left behind.",
    traits:
      'Fast-moving, forgetful, prone to "silly" mistakes in work.',
    solution:
      'The "Pit Stop": Forcing a mandatory 2-minute "review period" after every completed task.',
    childPerspective: "",
  },
  {
    id: "german-shepherd",
    animal: "The German Shepherd",
    typeName: "The Guardian",
    highDimensions: ["social", "fuse", "sensory", "engine"],
    explanation:
      'Always on "high alert" for rules, fairness, and potential threats.',
    traits:
      'Protective, blunt, hyper-aware, struggles with "authority."',
    solution:
      'Collaborative Problem Solving: Giving them a say in the rules so they feel like a "partner," not a "subject."',
    childPerspective: "",
  },
  {
    id: "chameleon",
    animal: "The Chameleon",
    typeName: "The Multi-Processor",
    highDimensions: [
      "filter",
      "engine",
      "sensory",
      "fuse",
      "time",
      "social",
    ],
    explanation:
      'A "Multi-Processor" who changes based on the overwhelming input of the world. High Scores in 4+ categories.',
    traits:
      "Vibrant, highly creative, but prone to total system burnout. High support needs.",
    solution:
      'Pacing & Rest: Reducing the daily "cognitive load" by 30% to prevent "The Crash."',
    childPerspective:
      '"The whole world is coming at me all at once."',
  },
];

// ─── Step Configuration ─────────────────────────────────────────────────────

export const TOTAL_STEPS = 37;
const BASIC_INFO_COUNT = BASIC_INFO_QUESTIONS.length; // 6

/** Flat list of all Likert questions with their category info */
export interface LikertStepConfig {
  type: "likert";
  categoryId: CategoryId;
  categoryLabel: string;
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
      categoryLabel: cat.label,
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
  return answers.reduce((sum, a) => sum + a, 0);
}

export function normalizeScore(rawScore: number, maxRaw: number): number {
  if (maxRaw === 0) return 0;
  return Math.round((rawScore / maxRaw) * 18);
}

export function getIntensity(normalized: number): Intensity {
  if (normalized <= 6) return "low";
  if (normalized <= 12) return "moderate";
  return "high";
}

export interface TraitScores {
  filter: number;
  engine: number;
  sensory: number;
  fuse: number;
  time: number;
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

/**
 * Compute normalized scores (0-18) for each category.
 */
export function computeScores(
  responses: Record<string, unknown>,
): TraitScores {
  const categoryAnswers = extractCategoryAnswers(responses);
  const scores = {} as TraitScores;

  for (const cat of ASSESSMENT_CATEGORIES) {
    const answers = categoryAnswers[cat.id];
    const raw = scoreCategory(answers);
    const maxRaw = cat.questions.length * 3;
    scores[cat.id] = normalizeScore(raw, maxRaw);
  }

  return scores;
}

/**
 * Match the best archetype based on which dimensions score "High" (13+).
 * Uses overlap scoring: archetype with highest match ratio wins.
 * Tie-break: prefer archetypes with fewer required dimensions (more specific).
 */
export function matchArchetype(scores: TraitScores): Archetype {
  const highDimensions = CATEGORY_IDS.filter(
    (id) => getIntensity(scores[id]) === "high",
  );

  let bestArchetype = ARCHETYPES[0];
  let bestScore = -1;

  for (const arch of ARCHETYPES) {
    // Count how many of the archetype's required dimensions are High
    const matchCount = arch.highDimensions.filter((d) =>
      highDimensions.includes(d),
    ).length;
    const matchRatio = matchCount / arch.highDimensions.length;

    // Perfect match: all required dimensions are high
    if (matchRatio === 1 && matchCount > bestScore) {
      bestScore = matchCount;
      bestArchetype = arch;
    }
  }

  // If no perfect match, find best partial match
  if (bestScore === -1) {
    let bestPartial = -1;

    for (const arch of ARCHETYPES) {
      const matchCount = arch.highDimensions.filter((d) =>
        highDimensions.includes(d),
      ).length;

      if (matchCount > bestPartial) {
        bestPartial = matchCount;
        bestArchetype = arch;
      } else if (
        matchCount === bestPartial &&
        arch.highDimensions.length < bestArchetype.highDimensions.length
      ) {
        // Prefer more specific archetype on tie
        bestArchetype = arch;
      }
    }
  }

  return bestArchetype;
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
