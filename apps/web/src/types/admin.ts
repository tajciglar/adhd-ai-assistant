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
  sources: TestQuerySource[];
}
