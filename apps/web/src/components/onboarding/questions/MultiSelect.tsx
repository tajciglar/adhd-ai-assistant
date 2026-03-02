import type { OptionItem } from "../../../types/onboarding";

interface MultiSelectProps {
  title: string;
  subtitle?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: OptionItem[];
}

export default function MultiSelect({
  title,
  subtitle,
  value,
  onChange,
  options,
}: MultiSelectProps) {
  const toggle = (optValue: string) => {
    // "None of the above" logic
    if (optValue === "none") {
      onChange(["none"]);
      return;
    }

    const without = value.filter((v) => v !== "none");

    if (without.includes(optValue)) {
      onChange(without.filter((v) => v !== optValue));
    } else {
      onChange([...without, optValue]);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-harbor-text mb-2">{title}</h2>
      {subtitle && (
        <p className="text-harbor-text/50 mb-8">{subtitle}</p>
      )}
      <div className="space-y-3">
        {options.map((opt) => {
          const selected = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                selected
                  ? "border-harbor-accent bg-harbor-accent/10"
                  : "border-harbor-primary/15 hover:border-harbor-primary/30 bg-white"
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
