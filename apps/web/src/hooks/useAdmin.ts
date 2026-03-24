import { useCallback, useEffect, useReducer, useRef } from "react";
import { api } from "../lib/api";
import type {
  KnowledgeEntry,
  AdminStats,
  TestQueryResult,
  AdminImportJob,
} from "../types/admin";

interface AdminState {
  entries: KnowledgeEntry[];
  stats: AdminStats | null;
  activeEntry: KnowledgeEntry | null;
  loading: boolean;
  saving: boolean;
  filter: string | null;
  testQueryResults: TestQueryResult | null;
  testQuerying: boolean;
  importJob: AdminImportJob | null;
}

type Action =
  | { type: "SET_ENTRIES"; entries: KnowledgeEntry[] }
  | { type: "SET_STATS"; stats: AdminStats }
  | { type: "SET_ACTIVE"; entry: KnowledgeEntry | null }
  | { type: "SET_FILTER"; filter: string | null }
  | { type: "SAVING"; saving: boolean }
  | { type: "ADD_ENTRY"; entry: KnowledgeEntry }
  | { type: "UPDATE_ENTRY"; entry: KnowledgeEntry }
  | { type: "REMOVE_ENTRY"; id: string }
  | { type: "LOADED" }
  | { type: "SET_TEST_RESULTS"; results: TestQueryResult | null }
  | { type: "TEST_QUERYING"; querying: boolean }
  | { type: "SET_IMPORT_JOB"; job: AdminImportJob | null };

const initialState: AdminState = {
  entries: [],
  stats: null,
  activeEntry: null,
  loading: true,
  saving: false,
  filter: null,
  testQueryResults: null,
  testQuerying: false,
  importJob: null,
};

function reducer(state: AdminState, action: Action): AdminState {
  switch (action.type) {
    case "SET_ENTRIES":
      return { ...state, entries: action.entries };
    case "SET_STATS":
      return { ...state, stats: action.stats };
    case "SET_ACTIVE":
      return { ...state, activeEntry: action.entry };
    case "SET_FILTER":
      return { ...state, filter: action.filter };
    case "SAVING":
      return { ...state, saving: action.saving };
    case "ADD_ENTRY":
      return {
        ...state,
        entries: [action.entry, ...state.entries],
        activeEntry: null,
        saving: false,
      };
    case "UPDATE_ENTRY":
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.entry.id ? action.entry : e,
        ),
        activeEntry: null,
        saving: false,
      };
    case "REMOVE_ENTRY":
      return {
        ...state,
        entries: state.entries.filter((e) => e.id !== action.id),
        activeEntry:
          state.activeEntry?.id === action.id ? null : state.activeEntry,
      };
    case "LOADED":
      return { ...state, loading: false };
    case "SET_TEST_RESULTS":
      return { ...state, testQueryResults: action.results, testQuerying: false };
    case "TEST_QUERYING":
      return { ...state, testQuerying: action.querying };
    case "SET_IMPORT_JOB":
      return { ...state, importJob: action.job, saving: !!action.job && !["completed", "completed_with_errors", "failed"].includes(action.job.status) };
    default:
      return state;
  }
}

export function useAdmin() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const importPollTimeoutRef = useRef<number | null>(null);

  const stopImportPolling = useCallback(() => {
    if (importPollTimeoutRef.current !== null) {
      window.clearTimeout(importPollTimeoutRef.current);
      importPollTimeoutRef.current = null;
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [entriesData, statsData] = await Promise.all([
        api.get("/api/admin/entries") as Promise<{
          entries: KnowledgeEntry[];
        }>,
        api.get("/api/admin/stats") as Promise<AdminStats>,
      ]);
      dispatch({ type: "SET_ENTRIES", entries: entriesData.entries });
      dispatch({ type: "SET_STATS", stats: statsData });
      dispatch({ type: "LOADED" });
    } catch {
      dispatch({ type: "LOADED" });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => stopImportPolling();
  }, [stopImportPolling]);

  const setFilter = useCallback((filter: string | null) => {
    dispatch({ type: "SET_FILTER", filter });
  }, []);

  const setActiveEntry = useCallback((entry: KnowledgeEntry | null) => {
    dispatch({ type: "SET_ACTIVE", entry });
  }, []);

  const createEntry = useCallback(
    async (data: { category: string; title: string; content: string }) => {
      dispatch({ type: "SAVING", saving: true });
      try {
        const result = (await api.post("/api/admin/entries", data)) as {
          entry: KnowledgeEntry;
        };
        dispatch({ type: "ADD_ENTRY", entry: result.entry });
        // Refresh stats
        const stats = (await api.get("/api/admin/stats")) as AdminStats;
        dispatch({ type: "SET_STATS", stats });
      } catch {
        dispatch({ type: "SAVING", saving: false });
      }
    },
    [],
  );

  const updateEntry = useCallback(
    async (
      id: string,
      data: { category: string; title: string; content: string },
    ) => {
      dispatch({ type: "SAVING", saving: true });
      try {
        const result = (await api.put(
          `/api/admin/entries/${id}`,
          data,
        )) as { entry: KnowledgeEntry };
        dispatch({ type: "UPDATE_ENTRY", entry: result.entry });
        const stats = (await api.get("/api/admin/stats")) as AdminStats;
        dispatch({ type: "SET_STATS", stats });
      } catch {
        dispatch({ type: "SAVING", saving: false });
      }
    },
    [],
  );

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/admin/entries/${id}`);
      dispatch({ type: "REMOVE_ENTRY", id });
      const stats = (await api.get("/api/admin/stats")) as AdminStats;
      dispatch({ type: "SET_STATS", stats });
    } catch {
      // ignore
    }
  }, []);

  const bulkImport = useCallback(
    async (
      entries: { category: string; title: string; content: string }[],
    ) => {
      stopImportPolling();
      dispatch({ type: "SAVING", saving: true });
      try {
        const result = (await api.post("/api/admin/entries/bulk", { entries })) as {
          jobId: string;
          status: AdminImportJob["status"];
          total: number;
        };

        const pollJob = async (jobId: string) => {
          try {
            const jobResult = (await api.get(`/api/admin/jobs/${jobId}`)) as {
              job: AdminImportJob;
            };
            const job = jobResult.job;
            dispatch({ type: "SET_IMPORT_JOB", job });

            if (job.status === "queued" || job.status === "processing") {
              importPollTimeoutRef.current = window.setTimeout(() => {
                void pollJob(jobId);
              }, 1200);
              return;
            }

            await fetchData();
          } catch {
            dispatch({ type: "SAVING", saving: false });
          }
        };

        dispatch({
          type: "SET_IMPORT_JOB",
          job: {
            id: result.jobId,
            status: result.status,
            total: result.total,
            processed: 0,
            succeeded: 0,
            failed: 0,
            error: null,
            startedAt: null,
            finishedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdById: "",
          },
        });
        void pollJob(result.jobId);
        return true;
      } catch {
        dispatch({ type: "SAVING", saving: false });
        return false;
      }
    },
    [fetchData, stopImportPolling],
  );

  const clearImportJob = useCallback(() => {
    stopImportPolling();
    dispatch({ type: "SET_IMPORT_JOB", job: null });
    dispatch({ type: "SAVING", saving: false });
  }, [stopImportPolling]);

  const testQuery = useCallback(async (query: string) => {
    dispatch({ type: "TEST_QUERYING", querying: true });
    try {
      const result = (await api.post(
        "/api/admin/test-query",
        { query },
      )) as TestQueryResult;
      dispatch({ type: "SET_TEST_RESULTS", results: result });
    } catch {
      dispatch({ type: "TEST_QUERYING", querying: false });
    }
  }, []);

  const clearTestResults = useCallback(() => {
    dispatch({ type: "SET_TEST_RESULTS", results: null });
  }, []);

  const classifyEntry = useCallback(
    async (
      title: string,
      content: string,
    ): Promise<{ category: string; isNew: boolean } | null> => {
      try {
        const result = (await api.post("/api/admin/entries/classify", {
          title,
          content,
        })) as { category: string; isNew: boolean };
        return result;
      } catch {
        return null;
      }
    },
    [],
  );

  const parseDocument = useCallback(
    async (
      documentText: string,
      moduleName?: string,
    ): Promise<{ category: string; title: string; content: string }[]> => {
      const result = (await api.post("/api/admin/entries/parse-document", {
        documentText,
        moduleName,
      })) as {
        entries: { category: string; title: string; content: string }[];
      };
      return result.entries;
    },
    [],
  );

  const checkDuplicates = useCallback(
    async (
      entries: { title: string; content?: string }[],
    ): Promise<
      {
        index: number;
        status: "new" | "duplicate" | "similar";
        existingEntryId?: string;
        existingTitle?: string;
        existingCategory?: string;
      }[]
    > => {
      try {
        const result = (await api.post(
          "/api/admin/entries/check-duplicates",
          { entries },
        )) as {
          results: {
            index: number;
            status: "new" | "duplicate" | "similar";
            existingEntryId?: string;
            existingTitle?: string;
            existingCategory?: string;
          }[];
        };
        return result.results;
      } catch {
        return entries.map((_, index) => ({ index, status: "new" as const }));
      }
    },
    [],
  );

  const filteredEntries = state.filter
    ? state.entries.filter((e) => e.category === state.filter)
    : state.entries;

  const categories = [
    ...new Set(state.entries.map((e) => e.category)),
  ].sort();

  return {
    ...state,
    filteredEntries,
    categories,
    setFilter,
    setActiveEntry,
    createEntry,
    updateEntry,
    deleteEntry,
    bulkImport,
    testQuery,
    clearTestResults,
    classifyEntry,
    parseDocument,
    checkDuplicates,
    clearImportJob,
    refetch: fetchData,
  };
}
