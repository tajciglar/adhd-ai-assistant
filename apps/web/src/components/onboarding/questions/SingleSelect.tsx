import type { OptionItem } from "../../../types/onboarding";

interface SingleSelectProps {
  title: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  options: OptionItem[];
}

export default function SingleSelect({
  title,
  subtitle,
  value,
  onChange,
  options,
}: SingleSelectProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-harbor-text mb-2 text-center">{title}</h2>
      {subtitle && (
        <p className="text-harbor-text/50 mb-8">{subtitle}</p>
      )}
      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              value === opt.value
                ? "border-harbor-accent bg-harbor-accent/10"
                : "border-harbor-primary/15 hover:border-harbor-primary/30 bg-white"
            }`}
          >
            <span className="font-medium">{opt.emoji ? `${opt.emoji}  ${opt.label}` : opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
