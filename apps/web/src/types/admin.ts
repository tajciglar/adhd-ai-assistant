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
  totalLikes: number;
  totalDislikes: number;
}

export interface AdminImportJob {
  id: string;
  status: "queued" | "processing" | "completed" | "completed_with_errors" | "failed";
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
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
  retrievalMs: number;
  cacheHit?: boolean;
  answerPreview?: string;
  answerMetadata?: {
    model: string;
    sourceCount?: number;
    latencyMs?: number;
    retrievalMs?: number;
    providerMs?: number;
    errorCode?: string;
  };
}

export interface ReportTemplateData {
  archetypeId: string;
  title: string;
  innerVoiceQuote: string;
  animalDescription: string;
  aboutChild: string;
  aboutWhatHelps?: string;
  hiddenSuperpower: string;
  hiddenGiftWhatHelps?: string;
  brainSections: Array<{
    title: string;
    content: string;
    whatHelps?: string;
  }>;
  dayInLife: {
    morning: string;
    school: string;
    schoolWhatHelps?: string;
    afterSchool: string;
    bedtime: string;
  };
  drains: string[];
  fuels: string[];
  overwhelm: string;
  overwhelmWhatHelps?: string;
  needsToHear: Array<{
    when: string;
    say: string;
  }>;
  affirmations: string[];
  doNotSay: Array<{
    context?: string;
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
