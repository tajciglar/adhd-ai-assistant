export interface OnboardingResponses {
  gender?: string;
  ageRange?: string;
  knowledgeLevel?: string;
  childName?: string;
  childAge?: number;
  diagnosisStatus?: string;
  householdStructure?: string;
  schoolSupport?: string;
  currentInterventions?: string[];
  stressfulAreas?: string[];
  executiveFunctioningGaps?: string[];
  physicalActivity?: string[];
  impulseControlMarkers?: string[];
  childMotivators?: string[];
  theReality?: string;
  theVision?: string;
}

export type QuestionType =
  | "single-select"
  | "multi-select"
  | "limited-select"
  | "text"
  | "number"
  | "textarea";

export interface OptionItem {
  value: string;
  label: string;
}

export interface StepConfig {
  step: number;
  key: keyof OnboardingResponses;
  type: QuestionType;
  title: string;
  subtitle?: string;
  options?: OptionItem[];
  maxSelections?: number;
  placeholder?: string;
}
