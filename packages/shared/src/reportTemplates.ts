export interface ArchetypeReportTemplate {
  archetypeId: string;
  title: string;
  innerVoiceQuote: string;
  animalDescription: string;
  aboutChild: string;
  hiddenSuperpower: string;
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
  affirmations: string[];
  doNotSay: Array<{
    insteadOf: string;
    tryThis: string;
  }>;
  closingLine: string;
}

// Source of truth is now DB-backed report_templates via API.
const REPORT_TEMPLATES: ArchetypeReportTemplate[] = [];

export function getReportTemplate(
  archetypeId: string,
): ArchetypeReportTemplate | null {
  return REPORT_TEMPLATES.find((t) => t.archetypeId === archetypeId) ?? null;
}
