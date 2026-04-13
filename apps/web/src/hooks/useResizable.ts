import { useCallback, useEffect, useRef, useState } from "react";

interface UseResizableOptions {
  initial: number;
  min: number;
  max: number;
  /** "x" tracks horizontal drag (sidebar width); "y" would track vertical (not used yet) */
  axis?: "x" | "y";
  /** "left" anchors the resizer to the left of the dragged element; "right" anchors it to the right (mirror direction) */
  anchor?: "left" | "right";
}

/**
 * Pointer-driven resize hook with rAF throttling.
 * Returns the current size and an onPointerDown handler for the drag handle.
 */
export function useResizable({
  initial,
  min,
  max,
  axis = "x",
  anchor = "left",
}: UseResizableOptions) {
  const [size, setSize] = useState(initial);
  const dragging = useRef(false);
  const startCoord = useRef(0);
  const startSize = useRef(initial);
  const pendingFrame = useRef<number | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      startCoord.current = axis === "x" ? e.clientX : e.clientY;
      startSize.current = size;
      document.body.style.cursor = axis === "x" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [size, axis],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const current = axis === "x" ? e.clientX : e.clientY;
      const delta = (current - startCoord.current) * (anchor === "right" ? -1 : 1);
      const next = Math.min(max, Math.max(min, startSize.current + delta));

      if (pendingFrame.current !== null) return;
      pendingFrame.current = requestAnimationFrame(() => {
        setSize(next);
        pendingFrame.current = null;
      });
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (pendingFrame.current !== null) {
        cancelAnimationFrame(pendingFrame.current);
        pendingFrame.current = null;
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [min, max, axis, anchor]);

  return { size, onPointerDown };
}
