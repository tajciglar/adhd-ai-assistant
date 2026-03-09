import { useCallback, useReducer, useEffect, useRef } from "react";
import { TOTAL_STEPS } from "../lib/constants";
import type { OnboardingResponses } from "../types/onboarding";
import { trackFunnelEvent } from "../lib/analytics";

const STORAGE_KEY = "harbor_onboarding";

interface OnboardingState {
  currentStep: number;
  responses: OnboardingResponses;
  direction: 1 | -1;
}

type Action =
  | { type: "SET_ANSWER"; key: string; value: string | number | undefined }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" };

function loadFromStorage(): OnboardingState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { currentStep: 1, responses: {}, direction: 1 };
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      currentStep: typeof parsed.currentStep === "number" ? parsed.currentStep : 1,
      responses: parsed.responses ?? {},
      direction: 1,
    };
  } catch {
    return { currentStep: 1, responses: {}, direction: 1 };
  }
}

function saveToStorage(state: OnboardingState) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ currentStep: state.currentStep, responses: state.responses }),
    );
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}

function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
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
    default:
      return state;
  }
}

export function useOnboarding() {
  const [state, dispatch] = useReducer(reducer, undefined, loadFromStorage);

  // Persist on every state change
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // Track step views (fire once per step change)
  const lastTrackedStep = useRef(0);
  useEffect(() => {
    if (state.currentStep !== lastTrackedStep.current) {
      lastTrackedStep.current = state.currentStep;
      trackFunnelEvent("step_viewed", state.currentStep);
    }
  }, [state.currentStep]);

  const saveAnswer = useCallback(
    (
      _step: number,
      key: string,
      value: string | number | undefined,
      _immediate?: boolean,
    ) => {
      dispatch({ type: "SET_ANSWER", key, value });
    },
    [],
  );

  const goNext = useCallback(() => {
    dispatch({ type: "NEXT_STEP" });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: "PREV_STEP" });
  }, []);

  return {
    ...state,
    loading: false,
    saveAnswer,
    goNext,
    goBack,
  };
}

/** Call this after a successful submit to clear saved progress */
export function clearOnboardingStorage() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
