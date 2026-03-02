import { ONBOARDING_STEPS } from "../../lib/constants";
import type { OnboardingResponses } from "../../types/onboarding";
import SingleSelect from "./questions/SingleSelect";
import MultiSelect from "./questions/MultiSelect";
import LimitedSelect from "./questions/LimitedSelect";
import TextInput from "./questions/TextInput";
import NumberInput from "./questions/NumberInput";
import TextArea from "./questions/TextArea";

interface StepRendererProps {
  step: number;
  responses: OnboardingResponses;
  onAnswer: (
    step: number,
    key: keyof OnboardingResponses,
    value: unknown,
    immediate?: boolean,
  ) => void;
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
  const config = ONBOARDING_STEPS[step - 1];
  if (!config) return null;

  const title = interpolate(config.title, responses);
  const subtitle = config.subtitle
    ? interpolate(config.subtitle, responses)
    : undefined;

  switch (config.type) {
    case "single-select":
      return (
        <SingleSelect
          title={title}
          subtitle={subtitle}
          value={(responses[config.key] as string) ?? ""}
          onChange={(v) => onAnswer(step, config.key, v, true)}
          options={config.options!}
        />
      );

    case "multi-select":
      return (
        <MultiSelect
          title={title}
          subtitle={subtitle}
          value={(responses[config.key] as string[]) ?? []}
          onChange={(v) => onAnswer(step, config.key, v, true)}
          options={config.options!}
        />
      );

    case "limited-select":
      return (
        <LimitedSelect
          title={title}
          subtitle={subtitle}
          value={(responses[config.key] as string[]) ?? []}
          onChange={(v) => onAnswer(step, config.key, v, true)}
          options={config.options!}
          maxSelections={config.maxSelections!}
        />
      );

    case "text":
      return (
        <TextInput
          title={title}
          subtitle={subtitle}
          value={(responses[config.key] as string) ?? ""}
          onChange={(v) => onAnswer(step, config.key, v)}
          placeholder={config.placeholder}
        />
      );

    case "number":
      return (
        <NumberInput
          title={title}
          subtitle={subtitle}
          value={responses[config.key] as number | undefined}
          onChange={(v) => onAnswer(step, config.key, v)}
          placeholder={config.placeholder}
        />
      );

    case "textarea":
      return (
        <TextArea
          title={title}
          subtitle={subtitle}
          value={(responses[config.key] as string) ?? ""}
          onChange={(v) => onAnswer(step, config.key, v)}
          placeholder={config.placeholder}
        />
      );

    default:
      return null;
  }
}
