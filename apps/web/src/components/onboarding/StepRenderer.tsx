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
  const childName = (responses.childName as string) || "your child";
  const gender = ((responses.childGender as string) ?? "").toLowerCase();
  const pos = gender === "male" ? "his" : gender === "female" ? "her" : "their";
  const obj = gender === "male" ? "him" : gender === "female" ? "her" : "them";
  const sub = gender === "male" ? "he" : gender === "female" ? "she" : "they";

  return template
    .replace(/\{childName\}/g, childName)
    .replace(/\{pos\}/g, pos)
    .replace(/\{obj\}/g, obj)
    .replace(/\{sub\}/g, sub);
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
