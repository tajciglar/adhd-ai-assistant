import { useCallback, useState } from "react";
import { useOnboarding } from "../../hooks/useOnboarding";
import { TOTAL_STEPS } from "../../lib/constants";
import { getStepConfig, ASSESSMENT_CATEGORIES, BASIC_INFO_QUESTIONS } from "@adhd-ai-assistant/shared";
import type { CategoryId } from "@adhd-ai-assistant/shared";
import type { OnboardingResponses } from "../../types/onboarding";
import OnboardingLayout from "./OnboardingLayout";
import AnimationWrapper from "./AnimationWrapper";
import StepRenderer from "./StepRenderer";
import MicroCopy from "./MicroCopy";
import CalculatingScreen from "./CalculatingScreen";
import InterstitialScreen from "./InterstitialScreen";
import HalfwayScreen from "./HalfwayScreen";

// Derived from shared package so it stays in sync automatically
const BASIC_INFO_COUNT = BASIC_INFO_QUESTIONS.length;

// Total assessment (Likert) questions across all categories
const TOTAL_ASSESSMENT_QUESTIONS = ASSESSMENT_CATEGORIES.reduce(
  (sum, cat) => sum + cat.questions.length,
  0,
);

// Halfway step: basic info count + half of assessment questions
const HALFWAY_STEP = BASIC_INFO_COUNT + Math.floor(TOTAL_ASSESSMENT_QUESTIONS / 2);

// Last step of each category except the last → triggers an interstitial card
// e.g. with 7+7+7+6+6+6 questions: steps 12, 19, 26, 32, 38
const INTERSTITIAL_TRIGGER_STEPS = new Map<number, CategoryId>();
{
  let offset = BASIC_INFO_COUNT;
  for (let i = 0; i < ASSESSMENT_CATEGORIES.length - 1; i++) {
    offset += ASSESSMENT_CATEGORIES[i].questions.length;
    INTERSTITIAL_TRIGGER_STEPS.set(offset, ASSESSMENT_CATEGORIES[i].id as CategoryId);
  }
}

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

function IntroScreen({
  childName,
  onReady,
}: {
  childName: string;
  onReady: () => void;
}) {
  return (
    <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6 py-8">
      <div className="max-w-md w-full overflow-y-auto">
        <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-6 space-y-5">
          <div className="text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-harbor-primary leading-snug">
              You're about to discover {childName}'s unique brain profile
            </h2>
          </div>

          <p className="text-harbor-text/70 leading-relaxed">
            Their strengths, their struggles, and the hidden superpower most
            people around them completely miss.
          </p>

          <p className="text-harbor-text/70 leading-relaxed">
            Answer based on what you actually see. The more honest you are, the
            more accurate {childName}'s profile will be.
          </p>

          <button
            type="button"
            onClick={onReady}
            className="w-full rounded-xl bg-harbor-primary text-white px-5 py-3 font-medium hover:opacity-90 active:scale-[0.98] transition-all"
          >
            I'm ready →
          </button>
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

  const [showIntro, setShowIntro] = useState(false);
  const [showCalculating, setShowCalculating] = useState(false);
  const [showHalfway, setShowHalfway] = useState(false);
  const [interstitialCategory, setInterstitialCategory] = useState<CategoryId | null>(null);

  const childName = (responses.childName as string | undefined) ?? "your child";
  const gender = ((responses.childGender as string) ?? "").toLowerCase();
  const objPronoun = gender.includes("boy") ? "him" : gender.includes("girl") ? "her" : "them";

  const handleShowCalculating = useCallback(() => {
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
            handleShowCalculating();
          } else if (step === BASIC_INFO_COUNT) {
            setShowIntro(true);
          } else if (step === HALFWAY_STEP) {
            setShowHalfway(true);
          } else if (INTERSTITIAL_TRIGGER_STEPS.has(step)) {
            setInterstitialCategory(INTERSTITIAL_TRIGGER_STEPS.get(step)!);
          } else {
            goNext();
          }
        }, 50);
      }
    },
    [saveAnswer, goNext, handleShowCalculating],
  );

  if (showCalculating) {
    return <CalculatingScreen responses={responses} />;
  }

  if (showHalfway) {
    return (
      <HalfwayScreen
        childName={childName}
        pronoun={objPronoun}
        onContinue={() => {
          setShowHalfway(false);
          goNext();
        }}
      />
    );
  }

  if (interstitialCategory) {
    return (
      <InterstitialScreen
        categoryId={interstitialCategory}
        onContinue={() => {
          setInterstitialCategory(null);
          goNext();
        }}
      />
    );
  }

  if (showIntro) {
    return (
      <IntroScreen
        childName={childName}
        onReady={() => {
          setShowIntro(false);
          goNext();
        }}
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
          handleShowCalculating();
        } else if (currentStep === BASIC_INFO_COUNT) {
          setShowIntro(true);
        } else if (currentStep === HALFWAY_STEP) {
          setShowHalfway(true);
        } else if (INTERSTITIAL_TRIGGER_STEPS.has(currentStep)) {
          setInterstitialCategory(INTERSTITIAL_TRIGGER_STEPS.get(currentStep)!);
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
