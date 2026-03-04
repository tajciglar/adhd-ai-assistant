import { useCallback, useEffect, useReducer, useState } from "react";
import { api } from "../lib/api";
import type {
  KnowledgeEntry,
  AdminStats,
  TestQuerySource,
  TestQueryResult,
} from "../types/admin";

interface AdminState {
  entries: KnowledgeEntry[];
  stats: AdminStats | null;
  activeEntry: KnowledgeEntry | null;
  loading: boolean;
  saving: boolean;
  filter: string | null;
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
  | { type: "LOADED" };

const initialState: AdminState = {
  entries: [],
  stats: null,
  activeEntry: null,
  loading: true,
  saving: false,
  filter: null,
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
    default:
      return state;
  }
}

export function useAdmin() {
  const [state, dispatch] = useReducer(reducer, initialState);

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
      dispatch({ type: "SAVING", saving: true });
      try {
        await api.post("/api/admin/entries/bulk", { entries });
        // Refetch everything
        await fetchData();
        dispatch({ type: "SAVING", saving: false });
        return true;
      } catch {
        dispatch({ type: "SAVING", saving: false });
        return false;
      }
    },
    [fetchData],
  );

  // Test query state
  const [testQueryResults, setTestQueryResults] = useState<TestQuerySource[]>(
    [],
  );
  const [testQuerying, setTestQuerying] = useState(false);

  const testQuery = useCallback(async (query: string) => {
    setTestQuerying(true);
    try {
      const result = (await api.post("/api/admin/test-query", {
        query,
      })) as TestQueryResult;
      setTestQueryResults(result.sources);
    } catch {
      setTestQueryResults([]);
    } finally {
      setTestQuerying(false);
    }
  }, []);

  const clearTestResults = useCallback(() => {
    setTestQueryResults([]);
  }, []);

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
    testQueryResults,
    testQuerying,
    testQuery,
    clearTestResults,
  };
}
