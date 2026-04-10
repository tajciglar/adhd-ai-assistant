import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  /** Additional classes for the backdrop */
  className?: string;
  /** Label for screen readers */
  ariaLabel?: string;
}

/**
 * Shared modal wrapper with:
 * - role="dialog" + aria-modal
 * - Escape key to close
 * - Click-outside to close
 * - Focus trap (Tab / Shift+Tab cycle)
 */
export default function Modal({ onClose, children, className = "", ariaLabel }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Save + restore focus, auto-focus first element
  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement;

    // Focus the first focusable element inside the modal
    const focusable = getFocusableElements(dialogRef.current);
    if (focusable.length > 0) {
      (focusable[0] as HTMLElement).focus();
    } else {
      dialogRef.current?.focus();
    }

    return () => {
      previousFocus.current?.focus();
    };
  }, []);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus trap
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;

    const focusable = getFocusableElements(dialogRef.current);
    if (focusable.length === 0) return;

    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        className="relative z-10 outline-none"
      >
        {children}
      </div>
    </div>
  );
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}
