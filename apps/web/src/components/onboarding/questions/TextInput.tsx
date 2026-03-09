interface TextInputProps {
  title: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TextInput({
  title,
  subtitle,
  value,
  onChange,
  placeholder,
}: TextInputProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-harbor-text mb-2 text-center">{title}</h2>
      {subtitle && (
        <p className="text-harbor-text/50 mb-8">{subtitle}</p>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 rounded-xl border-2 border-harbor-primary/15 focus:border-harbor-accent focus:ring-2 focus:ring-harbor-accent/20 bg-white text-harbor-text outline-none transition-all text-lg"
        autoFocus
      />
    </div>
  );
}
