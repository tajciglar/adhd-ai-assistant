import React from "react";
import { getStepConfig } from "@adhd-ai-assistant/shared";
import type { OnboardingResponses } from "../../types/onboarding";
import SingleSelect from "./questions/SingleSelect";
import TextInput from "./questions/TextInput";
import NumberInput from "./questions/NumberInput";
import LikertSelect from "./questions/LikertSelect";
import { TrustPilotReview } from "./TrustPilotReview";

interface StepRendererProps {
  step: number;
  responses: OnboardingResponses;
  onAnswer: (step: number, key: string, value: string | number | undefined, immediate?: boolean) => void;
}

function interpolate(template: string, responses: OnboardingResponses): string {
  const childName = (responses.childName as string) || "your child";
  const gender = ((responses.childGender as string) ?? "").toLowerCase();
  const isMale = gender === "male" || gender.includes("boy");
  const isFemale = gender === "female" || gender.includes("girl");
  const pos = isMale ? "his" : isFemale ? "her" : "their";
  const obj = isMale ? "him" : isFemale ? "her" : "them";
  const sub = isMale ? "he" : isFemale ? "she" : "they";

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

    let inner: React.ReactNode = null;
    switch (q.type) {
      case "single-select":
        inner = (
          <SingleSelect
            title={title}
            value={(responses[q.key] as string) ?? ""}
            onChange={(v) => onAnswer(step, q.key, v, true)}
            options={q.options!.map((o, i) => ({ value: o, label: o, emoji: q.optionEmojis?.[i] }))}
          />
        );
        break;
      case "text":
        inner = (
          <TextInput
            title={title}
            value={(responses[q.key] as string) ?? ""}
            onChange={(v) => onAnswer(step, q.key, v)}
            placeholder={q.placeholder}
          />
        );
        break;
      case "number":
        inner = (
          <NumberInput
            title={title}
            value={responses[q.key] as number | undefined}
            onChange={(v) => onAnswer(step, q.key, v)}
          />
        );
        break;
      default:
        return null;
    }

    return (
      <div>
        {step === 1 && (
          <div className="mb-6 space-y-2">
            <TrustPilotReview />
            <h1 className="text-2xl font-bold text-harbor-primary leading-snug text-center">
              Discover Your Child's ADHD Wildprint
            </h1>
            <p className="text-sm text-harbor-text/60 leading-relaxed">
              A 5-minute quiz backed by 40+ years of clinical experience — revealing who your child really is, why they do what they do, and the hidden superpower most people around them completely miss.
            </p>
          </div>
        )}
        {q.emoji && (
          <div className="text-4xl mb-4 text-center">{q.emoji}</div>
        )}
        {inner}
      </div>
    );
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
