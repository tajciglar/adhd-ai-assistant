import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../hooks/useOnboarding";
import { ONBOARDING_STEPS, TOTAL_STEPS } from "../../lib/constants";
import type { OnboardingResponses } from "../../types/onboarding";
import OnboardingLayout from "./OnboardingLayout";
import AnimationWrapper from "./AnimationWrapper";
import StepRenderer from "./StepRenderer";
import MicroCopy from "./MicroCopy";
import FamilySnapshot from "./FamilySnapshot";

function isStepValid(step: number, responses: OnboardingResponses): boolean {
  const config = ONBOARDING_STEPS[step - 1];
  if (!config) return false;

  const val = responses[config.key];

  switch (config.type) {
    case "single-select":
      return typeof val === "string" && val.length > 0;
    case "multi-select":
      return Array.isArray(val) && val.length > 0;
    case "limited-select":
      return Array.isArray(val) && val.length > 0;
    case "text":
      return typeof val === "string" && val.trim().length > 0;
    case "number":
      return typeof val === "number" && val >= 0;
    case "textarea":
      return typeof val === "string" && val.trim().length > 0;
    default:
      return false;
  }
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
    (
      step: number,
      key: keyof OnboardingResponses,
      value: unknown,
      immediate?: boolean,
    ) => {
      saveAnswer(step, key, value, immediate);

      const config = ONBOARDING_STEPS[step - 1];
      if (config?.type === "single-select" && typeof value === "string") {
        goNext();
      }
    },
    [saveAnswer, goNext],
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

  if (completed || currentStep > TOTAL_STEPS) {
    return <FamilySnapshot responses={responses} onComplete={handleComplete} />;
  }

  const canContinue = isStepValid(currentStep, responses);

  return (
    <OnboardingLayout
      currentStep={currentStep}
      saveStatus={saveStatus}
      canContinue={canContinue}
      onBack={goBack}
      onContinue={goNext}
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
