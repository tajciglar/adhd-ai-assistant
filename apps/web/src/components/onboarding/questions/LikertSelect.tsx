import { LIKERT_OPTIONS } from "@adhd-ai-assistant/shared";

interface LikertSelectProps {
  questionText: string;
  value: number | undefined;
  onChange: (value: number) => void;
}

const LIKERT_EMOJIS = ["🙂", "🤔", "😬", "😩"];

export default function LikertSelect({
  questionText,
  value,
  onChange,
}: LikertSelectProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-harbor-text mb-8 text-center">
        {questionText}
      </h2>
      <div className="space-y-3">
        {LIKERT_OPTIONS.map((opt, i) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              value === opt.value
                ? "border-harbor-accent bg-harbor-accent/10"
                : "border-harbor-primary/15 hover:border-harbor-primary/30 bg-white"
            }`}
          >
            <span className="font-medium">{LIKERT_EMOJIS[i]}  {opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
