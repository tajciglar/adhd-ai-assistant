import { getStepConfig } from "@adhd-ai-assistant/shared";
import type { OnboardingResponses } from "../../types/onboarding";
import SingleSelect from "./questions/SingleSelect";
import TextInput from "./questions/TextInput";
import NumberInput from "./questions/NumberInput";
import LikertSelect from "./questions/LikertSelect";

interface StepRendererProps {
  step: number;
  responses: OnboardingResponses;
  onAnswer: (step: number, key: string, value: string | number | undefined, immediate?: boolean) => void;
}

function interpolate(template: string, responses: OnboardingResponses): string {
  return template.replace(
    /\{childName\}/g,
    (responses.childName as string) || "your child",
  );
}

export default function StepRenderer({
  step,
  responses,
  onAnswer,
}: StepRendererProps) {
  const config = getStepConfig(step);
  if (!config) return null;

  if (config.type === "basic-info") {
    const q = config.question;
    const title = interpolate(q.title, responses);

    switch (q.type) {
      case "single-select":
        return (
          <SingleSelect
            title={title}
            value={(responses[q.key] as string) ?? ""}
            onChange={(v) => onAnswer(step, q.key, v, true)}
            options={q.options!.map((o) => ({ value: o, label: o }))}
          />
        );

      case "text":
        return (
          <TextInput
            title={title}
            value={(responses[q.key] as string) ?? ""}
            onChange={(v) => onAnswer(step, q.key, v)}
            placeholder={q.placeholder}
          />
        );

      case "number":
        return (
          <NumberInput
            title={title}
            value={responses[q.key] as number | undefined}
            onChange={(v) => onAnswer(step, q.key, v)}
          />
        );

      default:
        return null;
    }
  }

  // Likert question
  const key = `${config.categoryId}_${config.questionIndex}`;
  return (
    <LikertSelect
      questionText={interpolate(config.questionText, responses)}
      value={responses[key] as number | undefined}
      onChange={(v) => onAnswer(step, key, v, true)}
    />
  );
}
