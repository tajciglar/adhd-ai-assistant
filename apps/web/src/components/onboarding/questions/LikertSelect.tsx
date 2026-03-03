import { LIKERT_OPTIONS } from "@adhd-ai-assistant/shared";

interface LikertSelectProps {
  categoryLabel: string;
  categorySubtitle: string;
  questionText: string;
  value: number | undefined;
  onChange: (value: number) => void;
}

export default function LikertSelect({
  categoryLabel,
  categorySubtitle,
  questionText,
  value,
  onChange,
}: LikertSelectProps) {
  return (
    <div>
      <p className="text-sm font-medium text-harbor-accent/70 mb-1 tracking-wide uppercase">
        {categoryLabel}{" "}
        <span className="normal-case text-harbor-text/30 font-normal">
          — {categorySubtitle}
        </span>
      </p>
      <h2 className="text-2xl font-semibold text-harbor-text mb-8">
        {questionText}
      </h2>
      <div className="space-y-3">
        {LIKERT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              value === opt.value
                ? "border-harbor-accent bg-harbor-accent/10"
                : "border-harbor-primary/15 hover:border-harbor-primary/30 bg-white"
            }`}
          >
            <span className="font-medium">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
