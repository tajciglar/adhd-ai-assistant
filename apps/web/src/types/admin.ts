export interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalEntries: number;
  totalUsers: number;
  entriesByCategory: Record<string, number>;
}

export interface TestQuerySource {
  entryId: string;
  title: string;
  category: string;
  chunkIndex: number;
  text: string;
  score: number;
}

export interface TestQueryResult {
  query: string;
  sources: TestQuerySource[];
  totalRetrieved: number;
}

export interface ReportTemplateData {
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

export interface ReportTemplateRecord {
  id: string;
  archetypeId: string;
  template: ReportTemplateData;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  filename: string;
  originalName: string;
  sizeBytes: number;
  createdAt: string;
}
