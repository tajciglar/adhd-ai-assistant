interface TextAreaProps {
  title: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TextArea({
  title,
  subtitle,
  value,
  onChange,
  placeholder,
}: TextAreaProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-harbor-text mb-2">{title}</h2>
      {subtitle && (
        <p className="text-harbor-text/50 mb-8">{subtitle}</p>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        maxLength={5000}
        className="w-full p-4 rounded-xl border-2 border-harbor-primary/15 focus:border-harbor-accent focus:ring-2 focus:ring-harbor-accent/20 bg-white text-harbor-text outline-none transition-all resize-none text-lg leading-relaxed"
        autoFocus
      />
      <p className="text-sm text-harbor-text/30 mt-2 text-right">
        {value.length} / 5,000
      </p>
    </div>
  );
}
