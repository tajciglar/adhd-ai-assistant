import { useEffect, useState } from "react";

const STAGES = [
  { label: "Reading response patterns", duration: 700 },
  { label: "Mapping emotional regulation profile", duration: 900 },
  { label: "Scoring executive function indicators", duration: 800 },
  { label: "Cross-referencing attention markers", duration: 750 },
  { label: "Analysing sensory processing signals", duration: 850 },
  { label: "Identifying archetype match", duration: 1100 },
  { label: "Generating personalised insights", duration: 950 },
];

function ProgressBar({ duration, label, onComplete }: {
  duration: number;
  label: string;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Fast initial surge to ~30%, then slower fill, brief pause before 100%
    const steps = 60;
    const interval = duration / steps;
    let tick = 0;

    const timer = setInterval(() => {
      tick++;
      // Ease-in-out curve: fast start, slows in middle, finishes cleanly
      const t = tick / steps;
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const jitter = (Math.random() - 0.5) * 3;
      const val = Math.min(100, Math.max(0, eased * 100 + jitter));
      setProgress(val);

      if (tick >= steps) {
        clearInterval(timer);
        setProgress(100);
        setDone(true);
        onComplete();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [duration, onComplete]);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm text-harbor-text/70">{label}</span>
        <span className="text-xs font-mono text-harbor-primary/60">
          {done ? "✓" : `${Math.round(progress)}%`}
        </span>
      </div>
      <div className="h-1.5 bg-harbor-text/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-harbor-primary rounded-full transition-all"
          style={{
            width: `${progress}%`,
            transitionDuration: "80ms",
            transitionTimingFunction: "linear",
          }}
        />
      </div>
    </div>
  );
}

export default function CalculatingScreen({ onDone }: { onDone: () => void }) {
  const [activeStage, setActiveStage] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // Show stages sequentially — each bar starts when the previous one is ~70% done
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;

    STAGES.forEach((stage, i) => {
      const delay = elapsed + (i === 0 ? 0 : Math.round(STAGES[i - 1].duration * 0.55));
      elapsed += Math.round(stage.duration * 0.55);
      timers.push(setTimeout(() => setActiveStage(i), delay));
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  const handleBarComplete = () => {
    setCompletedCount((n) => {
      const next = n + 1;
      if (next === STAGES.length) {
        setTimeout(onDone, 400);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="text-3xl animate-pulse">🧠</div>
            <h2 className="text-xl font-bold text-harbor-primary">
              Preparing {String.fromCharCode(8203)}{/* zero-width keeps line short */}
              your child's report
            </h2>
            <p className="text-sm text-harbor-text/50">
              Analysing {completedCount} of {STAGES.length} dimensions…
            </p>
          </div>

          <div className="space-y-4">
            {STAGES.slice(0, activeStage + 1).map((stage, i) => (
              <ProgressBar
                key={stage.label}
                label={stage.label}
                duration={stage.duration}
                onComplete={i === activeStage ? handleBarComplete : () => {}}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
