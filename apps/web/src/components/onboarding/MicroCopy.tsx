import { motion } from "framer-motion";
import { MICRO_COPY } from "../../lib/constants";

interface MicroCopyProps {
  step: number;
}

export default function MicroCopy({ step }: MicroCopyProps) {
  const text = MICRO_COPY[step];
  if (!text) return null;

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="text-harbor-accent italic mb-6 text-lg"
    >
      {text}
    </motion.p>
  );
}
