import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../hooks/useOnboarding";
import { TOTAL_STEPS } from "../../lib/constants";
import { getStepConfig } from "@adhd-ai-assistant/shared";
import type { OnboardingResponses } from "../../types/onboarding";
import OnboardingLayout from "./OnboardingLayout";
import AnimationWrapper from "./AnimationWrapper";
import StepRenderer from "./StepRenderer";
import MicroCopy from "./MicroCopy";

function isStepValid(step: number, responses: OnboardingResponses): boolean {
  const config = getStepConfig(step);
  if (!config) return false;

  if (config.type === "basic-info") {
    const val = responses[config.question.key];
    switch (config.question.type) {
      case "single-select":
        return typeof val === "string" && val.length > 0;
      case "text":
        return typeof val === "string" && val.trim().length > 0;
      case "number":
        return typeof val === "number" && val >= 1;
      default:
        return false;
    }
  }

  // Likert step
  const key = `${config.categoryId}_${config.questionIndex}`;
  const val = responses[key];
  return typeof val === "number" && val >= 0 && val <= 3;
}

export default function OnboardingPage() {
  const {
    currentStep,
    responses,
    saveStatus,
    loading,
    completed,
    direction,
    saveAnswer,
    goNext,
    goBack,
    complete,
  } = useOnboarding();
  const navigate = useNavigate();

  const handleComplete = useCallback(async () => {
    await complete();
    navigate("/chat");
  }, [complete, navigate]);

  const handleAnswer = useCallback(
    (step: number, key: string, value: string | number | undefined, immediate?: boolean) => {
      saveAnswer(step, key, value, immediate);

      const config = getStepConfig(step);
      if (!config) return;

      // Auto-advance for single-select basic info and likert
      const shouldAutoAdvance =
        (config.type === "basic-info" && config.question.type === "single-select") ||
        config.type === "likert";

      if (shouldAutoAdvance) {
        // Use setTimeout to let React batch the state update before advancing
        setTimeout(() => {
          if (step === TOTAL_STEPS) {
            handleComplete();
          } else {
            goNext();
          }
        }, 50);
      }
    },
    [saveAnswer, goNext, handleComplete],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-harbor-primary mb-2">
            Harbor
          </h1>
          <p className="text-harbor-text/40">Loading your progress...</p>
        </div>
      </div>
    );
  }

  // If completed, redirect to chat
  if (completed || currentStep > TOTAL_STEPS) {
    navigate("/chat");
    return null;
  }

  const canContinue = isStepValid(currentStep, responses);

  return (
    <OnboardingLayout
      currentStep={currentStep}
      saveStatus={saveStatus}
      canContinue={canContinue}
      onBack={goBack}
      onContinue={() => {
        if (currentStep === TOTAL_STEPS) {
          handleComplete();
        } else {
          goNext();
        }
      }}
    >
      <AnimationWrapper stepKey={currentStep} direction={direction}>
        <MicroCopy step={currentStep} />
        <StepRenderer
          step={currentStep}
          responses={responses}
          onAnswer={handleAnswer}
        />
      </AnimationWrapper>
    </OnboardingLayout>
  );
}
