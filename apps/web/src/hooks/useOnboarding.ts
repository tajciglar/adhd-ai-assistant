import { useCallback, useEffect, useReducer, useRef } from "react";
import { api } from "../lib/api";
import { TOTAL_STEPS } from "../lib/constants";
import type { OnboardingResponses } from "../types/onboarding";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface OnboardingState {
  currentStep: number;
  responses: OnboardingResponses;
  saveStatus: SaveStatus;
  loading: boolean;
  completed: boolean;
  direction: 1 | -1;
}

type Action =
  | {
      type: "RESUME";
      step: number;
      responses: OnboardingResponses;
      completed: boolean;
    }
  | { type: "SET_ANSWER"; key: string; value: string | number | undefined }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SAVE_STATUS"; status: SaveStatus }
  | { type: "COMPLETE" };

const initialState: OnboardingState = {
  currentStep: 1,
  responses: {},
  saveStatus: "idle",
  loading: true,
  completed: false,
  direction: 1,
};

function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case "RESUME":
      return {
        ...state,
        currentStep: action.completed
          ? TOTAL_STEPS + 1
          : Math.max(1, Math.min(action.step, TOTAL_STEPS)),
        responses: action.responses,
        completed: action.completed,
        loading: false,
      };
    case "SET_ANSWER":
      return {
        ...state,
        responses: { ...state.responses, [action.key]: action.value },
      };
    case "NEXT_STEP":
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS),
        direction: 1,
      };
    case "PREV_STEP":
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 1),
        direction: -1,
      };
    case "SAVE_STATUS":
      return { ...state, saveStatus: action.status };
    case "COMPLETE":
      return { ...state, completed: true };
    default:
      return state;
  }
}

export function useOnboarding() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch existing progress on mount
  useEffect(() => {
    api
      .get("/api/onboarding")
      .then((data) => {
        const d = data as {
          onboardingStep: number;
          onboardingCompleted: boolean;
          responses: OnboardingResponses;
        };
        dispatch({
          type: "RESUME",
          step: d.onboardingStep || 1,
          responses: d.responses || {},
          completed: d.onboardingCompleted,
        });
      })
      .catch(() => {
        dispatch({
          type: "RESUME",
          step: 1,
          responses: {},
          completed: false,
        });
      });
  }, []);

  // Clear saved indicator after 2s
  useEffect(() => {
    if (state.saveStatus === "saved") {
      savedTimerRef.current = setTimeout(() => {
        dispatch({ type: "SAVE_STATUS", status: "idle" });
      }, 2000);
    }
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, [state.saveStatus]);

  const saveToServer = useCallback(
    (step: number, responses: Record<string, unknown>) => {
      dispatch({ type: "SAVE_STATUS", status: "saving" });
      api
        .patch("/api/onboarding", { step, responses })
        .then(() => {
          dispatch({ type: "SAVE_STATUS", status: "saved" });
        })
        .catch(() => {
          dispatch({ type: "SAVE_STATUS", status: "error" });
        });
    },
    [],
  );

  const saveAnswer = useCallback(
    (step: number, key: string, value: string | number | undefined, immediate = false) => {
      dispatch({ type: "SET_ANSWER", key, value });

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      if (immediate) {
        saveToServer(step, { [key]: value });
      } else {
        saveTimeoutRef.current = setTimeout(() => {
          saveToServer(step, { [key]: value });
        }, 800);
      }
    },
    [saveToServer],
  );

  const goNext = useCallback(() => {
    dispatch({ type: "NEXT_STEP" });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: "PREV_STEP" });
  }, []);

  const complete = useCallback(async () => {
    try {
      await api.post("/api/onboarding/complete");
      dispatch({ type: "COMPLETE" });
    } catch {
      dispatch({ type: "COMPLETE" });
    }
  }, []);

  return {
    ...state,
    saveAnswer,
    goNext,
    goBack,
    complete,
  };
}
