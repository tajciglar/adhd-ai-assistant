import { useCallback, useEffect, useReducer } from "react";
import { api } from "../lib/api";
import type { Resource } from "../types/admin";

interface ResourcesState {
  resources: Resource[];
  loading: boolean;
  uploading: boolean;
}

type Action =
  | { type: "SET_RESOURCES"; resources: Resource[] }
  | { type: "ADD_RESOURCE"; resource: Resource }
  | { type: "UPDATE_RESOURCE"; resource: Resource }
  | { type: "REMOVE_RESOURCE"; id: string }
  | { type: "UPLOADING"; uploading: boolean }
  | { type: "LOADED" };

const initialState: ResourcesState = {
  resources: [],
  loading: true,
  uploading: false,
};

function reducer(state: ResourcesState, action: Action): ResourcesState {
  switch (action.type) {
    case "SET_RESOURCES":
      return { ...state, resources: action.resources };
    case "ADD_RESOURCE":
      return {
        ...state,
        resources: [action.resource, ...state.resources],
        uploading: false,
      };
    case "UPDATE_RESOURCE":
      return {
        ...state,
        resources: state.resources.map((r) =>
          r.id === action.resource.id ? action.resource : r,
        ),
      };
    case "REMOVE_RESOURCE":
      return {
        ...state,
        resources: state.resources.filter((r) => r.id !== action.id),
      };
    case "UPLOADING":
      return { ...state, uploading: action.uploading };
    case "LOADED":
      return { ...state, loading: false };
    default:
      return state;
  }
}

export function useResources() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    api
      .get("/api/admin/resources")
      .then((data) => {
        const d = data as { resources: Resource[] };
        dispatch({ type: "SET_RESOURCES", resources: d.resources });
        dispatch({ type: "LOADED" });
      })
      .catch(() => {
        dispatch({ type: "LOADED" });
      });
  }, []);

  const uploadResource = useCallback(async (formData: FormData) => {
    dispatch({ type: "UPLOADING", uploading: true });
    try {
      const data = (await api.upload(
        "/api/admin/resources",
        formData,
      )) as { resource: Resource };
      dispatch({ type: "ADD_RESOURCE", resource: data.resource });
    } catch (error) {
      dispatch({ type: "UPLOADING", uploading: false });
      throw error;
    }
  }, []);

  const updateResource = useCallback(
    async (
      id: string,
      updates: { title?: string; description?: string; category?: string },
    ) => {
      const data = (await api.patch(`/api/admin/resources/${id}`, updates)) as {
        resource: Resource;
      };
      dispatch({ type: "UPDATE_RESOURCE", resource: data.resource });
    },
    [],
  );

  const deleteResource = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/admin/resources/${id}`);
      dispatch({ type: "REMOVE_RESOURCE", id });
    } catch {
      // ignore
    }
  }, []);

  return {
    ...state,
    uploadResource,
    updateResource,
    deleteResource,
  };
}
