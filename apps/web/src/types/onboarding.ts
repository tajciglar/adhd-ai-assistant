export interface OnboardingResponses {
  // Basic info (steps 1-6)
  parentGender?: string;
  parentAgeRange?: string;
  childName?: string;
  childAge?: number;
  childGender?: string;
  householdStructure?: string;
  // Likert answers: category_questionIndex → 0-3
  // e.g. filter_0, engine_3, social_4, etc.
  [key: string]: string | number | undefined;
}

export type QuestionType = "single-select" | "text" | "number" | "likert";

export interface OptionItem {
  value: string;
  label: string;
  emoji?: string;
}
