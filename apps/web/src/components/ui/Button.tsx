import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export default function Button({
  variant = "primary",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base =
    "px-8 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer";
  const variants = {
    primary: disabled
      ? "bg-harbor-primary/30 text-white cursor-not-allowed"
      : "bg-harbor-primary text-white hover:bg-harbor-primary-light active:scale-[0.98]",
    secondary:
      "text-harbor-text/50 hover:text-harbor-text/80",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
