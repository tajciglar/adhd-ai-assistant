export {
  // Constants
  LIKERT_OPTIONS,
  CATEGORY_IDS,
  BASIC_INFO_QUESTIONS,
  ASSESSMENT_CATEGORIES,
  ARCHETYPES,
  TOTAL_STEPS,
  // Step helpers
  getStepConfig,
  getStepKey,
  // Scoring
  scoreCategory,
  normalizeScore,
  getIntensity,
  extractCategoryAnswers,
  computeScores,
  matchArchetype,
  computeTraitProfile,
} from "./assessment.js";

export type {
  CategoryId,
  BasicInfoQuestion,
  AssessmentCategory,
  Archetype,
  LikertStepConfig,
  BasicInfoStepConfig,
  StepConfig,
  Intensity,
  TraitScores,
  TraitProfile,
} from "./assessment.js";
