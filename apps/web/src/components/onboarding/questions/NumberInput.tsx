interface NumberInputProps {
  title: string;
  subtitle?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
}

export default function NumberInput({
  title,
  subtitle,
  value,
  onChange,
  placeholder,
}: NumberInputProps) {
  const decrement = () => {
    if (value !== undefined && value > 0) onChange(value - 1);
  };

  const increment = () => {
    if (value === undefined) onChange(1);
    else if (value < 25) onChange(value + 1);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-harbor-text mb-2 text-center">{title}</h2>
      {subtitle && (
        <p className="text-harbor-text/50 mb-8">{subtitle}</p>
      )}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={decrement}
          disabled={value === undefined || value <= 0}
          className="w-12 h-12 rounded-xl border-2 border-harbor-primary/15 bg-white text-harbor-text text-xl font-bold hover:border-harbor-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          -
        </button>
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? undefined : Math.max(0, Math.min(25, Number(v))));
          }}
          placeholder={placeholder}
          min={0}
          max={25}
          className="w-24 p-4 rounded-xl border-2 border-harbor-primary/15 focus:border-harbor-accent focus:ring-2 focus:ring-harbor-accent/20 bg-white text-harbor-text outline-none transition-all text-2xl text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          autoFocus
        />
        <button
          onClick={increment}
          disabled={value !== undefined && value >= 25}
          className="w-12 h-12 rounded-xl border-2 border-harbor-primary/15 bg-white text-harbor-text text-xl font-bold hover:border-harbor-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          +
        </button>
      </div>
    </div>
  );
}
