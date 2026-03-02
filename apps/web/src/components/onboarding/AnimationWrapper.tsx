import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

interface AnimationWrapperProps {
  stepKey: number;
  direction: 1 | -1;
  children: ReactNode;
}

export default function AnimationWrapper({
  stepKey,
  direction,
  children,
}: AnimationWrapperProps) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepKey}
        custom={direction}
        initial={{ opacity: 0, x: direction * 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -24 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
