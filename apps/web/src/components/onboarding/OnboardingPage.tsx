import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding, clearOnboardingStorage } from "../../hooks/useOnboarding";
import { TOTAL_STEPS } from "../../lib/constants";
import { getStepConfig } from "@adhd-ai-assistant/shared";
import type { OnboardingResponses } from "../../types/onboarding";
import type { ArchetypeReportTemplate } from "@adhd-ai-assistant/shared";
import { api } from "../../lib/api";
import OnboardingLayout from "./OnboardingLayout";
import AnimationWrapper from "./AnimationWrapper";
import StepRenderer from "./StepRenderer";
import MicroCopy from "./MicroCopy";
import CalculatingScreen from "./CalculatingScreen";

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

  const key = `${config.categoryId}_${config.questionIndex}`;
  const val = responses[key];
  return typeof val === "number" && val >= 0 && val <= 3;
}

function EmailStep({
  responses,
  onSubmit,
  submitting,
  submitError,
}: {
  responses: OnboardingResponses;
  onSubmit: (email: string) => void;
  submitting: boolean;
  submitError: string | null;
}) {
  const [email, setEmail] = useState("");
  const childName = responses.childName ?? "your child";
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-8">
          <div className="mb-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h1 className="text-2xl font-bold text-harbor-primary mb-2">
              Almost there!
            </h1>
            <p className="text-harbor-text/70">
              Where should we send {childName}'s personalised ADHD guide?
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-harbor-text mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isValid && !submitting) {
                    onSubmit(email);
                  }
                }}
                placeholder="you@example.com"
                autoFocus
                className="w-full rounded-xl border border-harbor-text/20 bg-harbor-bg px-4 py-3 text-harbor-text placeholder:text-harbor-text/30 focus:outline-none focus:ring-2 focus:ring-harbor-primary/30 focus:border-harbor-primary transition"
              />
            </div>

            {submitError ? (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
                {submitError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => onSubmit(email)}
              disabled={!isValid || submitting}
              className="w-full rounded-xl bg-harbor-primary text-white px-5 py-3 font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Preparing your guide..." : "Send my results →"}
            </button>

            <p className="text-xs text-center text-harbor-text/40">
              We'll email you the PDF guide and show your results here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const {
    currentStep,
    responses,
    direction,
    saveAnswer,
    goNext,
    goBack,
  } = useOnboarding();
  const navigate = useNavigate();

  const [showCalculating, setShowCalculating] = useState(false);
  const [showEmailStep, setShowEmailStep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleShowEmailStep = useCallback(() => {
    setShowCalculating(true);
  }, []);

  const handleAnswer = useCallback(
    (
      step: number,
      key: string,
      value: string | number | undefined,
      immediate?: boolean,
    ) => {
      saveAnswer(step, key, value, immediate);

      const config = getStepConfig(step);
      if (!config) return;

      const shouldAutoAdvance =
        (config.type === "basic-info" &&
          config.question.type === "single-select") ||
        config.type === "likert";

      if (shouldAutoAdvance) {
        setTimeout(() => {
          if (step === TOTAL_STEPS) {
            handleShowEmailStep();
          } else {
            goNext();
          }
        }, 50);
      }
    },
    [saveAnswer, goNext, handleShowEmailStep],
  );

  const handleSubmit = useCallback(
    async (email: string) => {
      setSubmitting(true);
      setSubmitError(null);

      try {
        const result = (await api.post("/api/guest/submit", {
          email,
          responses,
          childName: responses.childName ?? "Your child",
          childGender: responses.childGender,
        })) as { report: ArchetypeReportTemplate };

        clearOnboardingStorage();
        navigate("/report", {
          state: { report: result.report, email },
          replace: true,
        });
      } catch (err) {
        setSubmitError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [responses, navigate],
  );

  // PDF download directly using the raw report JSON returned from submit
  // (only used if user navigates back — normally goes to /report)

  if (showCalculating && !showEmailStep) {
    return <CalculatingScreen onDone={() => setShowEmailStep(true)} />;
  }

  if (showEmailStep) {
    return (
      <EmailStep
        responses={responses}
        onSubmit={(email) => void handleSubmit(email)}
        submitting={submitting}
        submitError={submitError}
      />
    );
  }

  const canContinue = isStepValid(currentStep, responses);

  return (
    <OnboardingLayout
      currentStep={currentStep}
      saveStatus="idle"
      canContinue={canContinue}
      onBack={goBack}
      onContinue={() => {
        if (currentStep === TOTAL_STEPS) {
          handleShowEmailStep();
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
