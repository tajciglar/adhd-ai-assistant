import { useCallback, useEffect, useReducer } from "react";
import { api } from "../lib/api";
import type { ReportTemplateData, ReportTemplateRecord } from "../types/admin";
import { normalizeReportTemplateRecord } from "../lib/reportTemplate";

interface TemplatesState {
  templates: ReportTemplateRecord[];
  loading: boolean;
  saving: boolean;
}

type Action =
  | { type: "SET_TEMPLATES"; templates: ReportTemplateRecord[] }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_SAVING"; saving: boolean }
  | { type: "UPSERT_TEMPLATE"; template: ReportTemplateRecord };

const initialState: TemplatesState = {
  templates: [],
  loading: true,
  saving: false,
};

function reducer(state: TemplatesState, action: Action): TemplatesState {
  switch (action.type) {
    case "SET_TEMPLATES":
      return { ...state, templates: action.templates };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_SAVING":
      return { ...state, saving: action.saving };
    case "UPSERT_TEMPLATE": {
      const exists = state.templates.some((t) => t.id === action.template.id);
      if (!exists) {
        return {
          ...state,
          templates: [...state.templates, action.template].sort((a, b) =>
            a.archetypeId.localeCompare(b.archetypeId),
          ),
          saving: false,
        };
      }

      return {
        ...state,
        templates: state.templates
          .map((t) => (t.id === action.template.id ? action.template : t))
          .sort((a, b) => a.archetypeId.localeCompare(b.archetypeId)),
        saving: false,
      };
    }
    default:
      return state;
  }
}

export function useReportTemplatesAdmin() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchTemplates = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const data = (await api.get("/api/admin/report-templates")) as {
        templates: ReportTemplateRecord[];
      };
      dispatch({
        type: "SET_TEMPLATES",
        templates: (data.templates ?? []).map(normalizeReportTemplateRecord),
      });
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = useCallback(async (template: ReportTemplateData) => {
    dispatch({ type: "SET_SAVING", saving: true });
    try {
      const result = (await api.post("/api/admin/report-templates", template)) as {
        template: ReportTemplateRecord;
      };
      dispatch({ type: "UPSERT_TEMPLATE", template: normalizeReportTemplateRecord(result.template) });
      return true;
    } catch {
      dispatch({ type: "SET_SAVING", saving: false });
      return false;
    }
  }, []);

  const updateTemplate = useCallback(
    async (id: string, template: ReportTemplateData) => {
      dispatch({ type: "SET_SAVING", saving: true });
      try {
        const result = (await api.put(`/api/admin/report-templates/${id}`, template)) as {
          template: ReportTemplateRecord;
        };
        dispatch({ type: "UPSERT_TEMPLATE", template: normalizeReportTemplateRecord(result.template) });
        return true;
      } catch {
        dispatch({ type: "SET_SAVING", saving: false });
        return false;
      }
    },
    [],
  );

  return {
    ...state,
    fetchTemplates,
    createTemplate,
    updateTemplate,
  };
}
