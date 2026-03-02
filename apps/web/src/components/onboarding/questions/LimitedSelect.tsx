import type { OptionItem } from "../../../types/onboarding";

interface LimitedSelectProps {
  title: string;
  subtitle?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: OptionItem[];
  maxSelections: number;
}

export default function LimitedSelect({
  title,
  subtitle,
  value,
  onChange,
  options,
  maxSelections,
}: LimitedSelectProps) {
  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else if (value.length < maxSelections) {
      onChange([...value, optValue]);
    }
  };

  const atLimit = value.length >= maxSelections;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-harbor-text mb-2">{title}</h2>
      {subtitle && (
        <p className="text-harbor-text/50 mb-2">{subtitle}</p>
      )}
      <p className="text-sm text-harbor-accent mb-8">
        {value.length} of {maxSelections} selected
      </p>
      <div className="space-y-3">
        {options.map((opt) => {
          const selected = value.includes(opt.value);
          const disabled = atLimit && !selected;

          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              disabled={disabled}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                selected
                  ? "border-harbor-accent bg-harbor-accent/10 cursor-pointer"
                  : disabled
                    ? "border-harbor-primary/10 bg-white opacity-40 cursor-not-allowed"
                    : "border-harbor-primary/15 hover:border-harbor-primary/30 bg-white cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    selected
                      ? "bg-harbor-accent border-harbor-accent"
                      : "border-harbor-primary/30"
                  }`}
                >
                  {selected && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="font-medium">{opt.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
