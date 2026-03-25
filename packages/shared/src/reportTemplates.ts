export interface ArchetypeReportTemplate {
  archetypeId: string;
  title: string;
  innerVoiceQuote: string;
  animalDescription: string;
  aboutChild: string;
  hiddenGift: string;
  aboutBrain: string;
  brainSections: Array<{
    title: string;
    content: string;
  }>;
  dayInLife: {
    morning: string;
    school: string;
    afterSchool: string;
    bedtime: string;
  };
  drains: string[];
  fuels: string[];
  overwhelm: string;
  affirmations: Array<{
    when: string;
    say: string;
  }>;
  doNotSay: Array<{
    when: string;
    insteadOf: string;
    tryThis: string;
  }>;
  closingLine: string;
  whatHelps?: {
    aboutChild?: string;
    hiddenGift?: string;
    brain?: string;
    morning?: string;
    school?: string;
    afterSchool?: string;
    bedtime?: string;
    overwhelm?: string;
  };
}

// Source of truth is now DB-backed report_templates via API.
const REPORT_TEMPLATES: ArchetypeReportTemplate[] = [];

export function getReportTemplate(
  archetypeId: string,
): ArchetypeReportTemplate | null {
  return REPORT_TEMPLATES.find((t) => t.archetypeId === archetypeId) ?? null;
}
