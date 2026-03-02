import { AnimatePresence, motion } from "framer-motion";

interface SaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
}

export default function SaveIndicator({ status }: SaveIndicatorProps) {
  return (
    <div className="h-6 flex items-center justify-end">
      <AnimatePresence mode="wait">
        {status !== "idle" && (
          <motion.p
            key={status}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className={`text-sm ${
              status === "error"
                ? "text-harbor-error"
                : "text-harbor-text/40"
            }`}
          >
            {status === "saving" && "Saving..."}
            {status === "saved" && "Progress saved"}
            {status === "error" && "Could not save"}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
