import { motion } from "framer-motion";
import { TOTAL_STEPS } from "../../lib/constants";

interface ProgressBarProps {
  current: number;
}

export default function ProgressBar({ current }: ProgressBarProps) {
  const percentage = Math.min((current / TOTAL_STEPS) * 100, 100);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-harbor-primary/15 z-50">
      <motion.div
        className="h-full bg-harbor-accent"
        initial={false}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
}
