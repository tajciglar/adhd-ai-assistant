import { motion } from "framer-motion";

interface ChatWelcomeProps {
  childName: string;
  onStarterClick: (message: string) => void;
}

const STARTERS = [
  { icon: "school", label: "Homework & Focus", color: "text-sky-600", bg: "bg-sky-50" },
  { icon: "wb_sunny", label: "Morning Routines", color: "text-amber-600", bg: "bg-amber-50" },
  { icon: "devices", label: "Managing Screen Time", color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: "favorite", label: "Emotional Regulation", color: "text-rose-500", bg: "bg-rose-50" },
] as const;

export default function ChatWelcome({ childName, onStarterClick }: ChatWelcomeProps) {
  const name = childName || "your child";

  const starters = [
    `How can I help ${name} with homework?`,
    "Tips for morning routines",
    "Managing screen time",
    `Understanding ${name}'s emotions`,
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-md">
        {/* Harbor AI avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative mb-5">
            <div className="w-16 h-16 bg-harbor-primary rounded-2xl flex items-center justify-center shadow-lg shadow-harbor-primary/25">
              <span
                className="material-symbols-outlined text-white text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                neurology
              </span>
            </div>
            {/* Active status dot */}
            <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-harbor-success opacity-60" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-harbor-success border-2 border-white" />
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-center"
          >
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Hi there!</h1>
            <p className="text-slate-500 text-base leading-relaxed">
              Ready to talk about {name}? I'm here to help.
            </p>
          </motion.div>
        </motion.div>

        {/* Suggestion chips */}
        <div className="flex flex-col gap-2.5">
          {starters.map((starter, i) => (
            <motion.button
              key={starter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 + i * 0.07, ease: [0.4, 0, 0.2, 1] }}
              onClick={() => onStarterClick(starter)}
              className="flex items-center gap-3 text-left p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className={`w-8 h-8 rounded-lg ${STARTERS[i].bg} flex items-center justify-center shrink-0 transition-colors`}>
                <span
                  className={`material-symbols-outlined ${STARTERS[i].color} text-[18px] transition-colors`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {STARTERS[i].icon}
                </span>
              </div>
              <span className="text-slate-700 text-sm font-medium flex-1">{starter}</span>
              <span className="material-symbols-outlined text-slate-300 text-[18px] group-hover:text-slate-400 transition-colors">
                chevron_right
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
