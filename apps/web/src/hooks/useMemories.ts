import { useCallback, useEffect, useReducer } from "react";
import { api } from "../lib/api";

export interface Memory {
  id: string;
  fact: string;
  category: string;
  source: string;
  createdAt: string;
}

interface MemoriesState {
  memories: Memory[];
  loading: boolean;
  deleting: string | null; // id of memory being deleted, or "all"
}

type Action =
  | { type: "SET_MEMORIES"; memories: Memory[] }
  | { type: "REMOVE_MEMORY"; id: string }
  | { type: "CLEAR_ALL" }
  | { type: "DELETING"; id: string | null }
  | { type: "LOADED" };

const initialState: MemoriesState = {
  memories: [],
  loading: true,
  deleting: null,
};

function reducer(state: MemoriesState, action: Action): MemoriesState {
  switch (action.type) {
    case "SET_MEMORIES":
      return { ...state, memories: action.memories, loading: false };
    case "REMOVE_MEMORY":
      return {
        ...state,
        memories: state.memories.filter((m) => m.id !== action.id),
        deleting: null,
      };
    case "CLEAR_ALL":
      return { ...state, memories: [], deleting: null };
    case "DELETING":
      return { ...state, deleting: action.id };
    case "LOADED":
      return { ...state, loading: false };
    default:
      return state;
  }
}

export function useMemories() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    api
      .get("/api/user/memories")
      .then((data) => {
        const res = data as { memories: Memory[] };
        dispatch({ type: "SET_MEMORIES", memories: res.memories });
      })
      .catch(() => dispatch({ type: "LOADED" }));
  }, []);

  const deleteMemory = useCallback(async (id: string) => {
    dispatch({ type: "DELETING", id });
    try {
      await api.delete(`/api/user/memories/${id}`);
      dispatch({ type: "REMOVE_MEMORY", id });
    } catch {
      dispatch({ type: "DELETING", id: null });
    }
  }, []);

  const clearAll = useCallback(async () => {
    dispatch({ type: "DELETING", id: "all" });
    try {
      await api.delete("/api/user/memories");
      dispatch({ type: "CLEAR_ALL" });
    } catch {
      dispatch({ type: "DELETING", id: null });
    }
  }, []);

  return { ...state, deleteMemory, clearAll };
}
