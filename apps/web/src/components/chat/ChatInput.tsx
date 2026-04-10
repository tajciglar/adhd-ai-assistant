import { useState, useRef, useCallback, type KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  childName?: string;
}

export default function ChatInput({ onSend, disabled, childName }: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  const placeholder = childName
    ? `Ask Harbor about ${childName}...`
    : "Ask Harbor anything...";

  const hasText = text.trim().length > 0;

  return (
    <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:border-slate-300 focus-within:bg-white focus-within:shadow-sm transition-all">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent py-1.5 text-harbor-text placeholder:text-slate-400 focus:outline-none text-sm leading-relaxed"
            style={{ fontSize: "16px" }}
          />
          <button
            onClick={handleSend}
            disabled={disabled || !hasText}
            aria-label="Send message"
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer mb-0.5 ${
              hasText && !disabled
                ? "bg-harbor-primary text-white shadow-sm shadow-harbor-primary/25 active:scale-95"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
