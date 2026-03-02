import type { ReactNode } from "react";
import ProgressBar from "../ui/ProgressBar";
import SaveIndicator from "../ui/SaveIndicator";
import Button from "../ui/Button";

interface OnboardingLayoutProps {
  currentStep: number;
  saveStatus: "idle" | "saving" | "saved" | "error";
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
  children: ReactNode;
}

export default function OnboardingLayout({
  currentStep,
  saveStatus,
  canContinue,
  onBack,
  onContinue,
  children,
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-harbor-bg">
      <ProgressBar current={currentStep} />

      <div className="max-w-xl mx-auto px-6 py-12 pt-16">
        <SaveIndicator status={saveStatus} />

        <div className="mt-4 mb-12">{children}</div>

        <div className="flex items-center justify-between">
          {currentStep > 1 ? (
            <Button variant="secondary" onClick={onBack}>
              Back
            </Button>
          ) : (
            <div />
          )}
          <Button
            variant="primary"
            disabled={!canContinue}
            onClick={onContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
