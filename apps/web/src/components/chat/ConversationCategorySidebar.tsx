import { useState } from "react";

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  "General": { icon: "chat_bubble", color: "text-harbor-primary", bg: "bg-harbor-primary/10" },
  "Behavior": { icon: "sentiment_very_dissatisfied", color: "text-rose-500", bg: "bg-rose-50" },
  "School & Learning": { icon: "school", color: "text-sky-600", bg: "bg-sky-50" },
  "Routines": { icon: "schedule", color: "text-amber-600", bg: "bg-amber-50" },
  "Sleep & Rest": { icon: "bedtime", color: "text-indigo-500", bg: "bg-indigo-50" },
  "Emotional Support": { icon: "favorite", color: "text-pink-500", bg: "bg-pink-50" },
  "Screen & Activities": { icon: "devices", color: "text-emerald-600", bg: "bg-emerald-50" },
  "Communication": { icon: "forum", color: "text-violet-500", bg: "bg-violet-50" },
  "Medication & Therapy": { icon: "medication", color: "text-teal-600", bg: "bg-teal-50" },
};

function getConfig(cat: string) {
  return CATEGORY_CONFIG[cat] ?? { icon: "folder", color: "text-slate-500", bg: "bg-slate-50" };
}

interface ConversationCategorySidebarProps {
  categories: Array<{ name: string; count: number }>;
  activeCategory: string | null;
  onSelect: (category: string | null) => void;
}

export default function ConversationCategorySidebar({
  categories,
  activeCategory,
  onSelect,
}: ConversationCategorySidebarProps) {
  const [expanded, setExpanded] = useState(false);

  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div
      className={`hidden md:flex flex-col border-l border-harbor-orange/10 bg-gradient-to-b from-harbor-bg-alt to-white transition-all duration-300 shrink-0 overflow-hidden ${
        expanded ? "w-52" : "w-14"
      }`}
    >
      {/* Toggle button */}
      <div className="flex items-center justify-between px-2 py-4 border-b border-harbor-orange/10">
        {expanded && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Topics
          </span>
        )}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-harbor-primary/10 text-harbor-primary/50 transition-colors ml-auto"
          title={expanded ? "Collapse" : "Expand topics"}
        >
          <span className="material-symbols-outlined text-[18px]">
            {expanded ? "chevron_right" : "chevron_left"}
          </span>
        </button>
      </div>

      {/* All button */}
      <div className="px-2 pt-2">
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center rounded-xl transition-colors ${
            expanded ? "gap-2 px-2 py-2" : "justify-center py-2"
          } ${
            activeCategory === null
              ? "bg-harbor-primary/10 text-harbor-primary"
              : "hover:bg-harbor-primary/5 text-slate-500"
          }`}
          title="All conversations"
        >
          <div
            className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg ${
              activeCategory === null ? "bg-harbor-primary/20" : "bg-slate-100"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">inbox</span>
          </div>
          {expanded && (
            <>
              <span className="text-xs font-medium truncate flex-1 text-left">All</span>
              <span
                className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 shrink-0 ${
                  activeCategory === null
                    ? "bg-harbor-primary/20 text-harbor-primary"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {totalCount}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Category list */}
      <div className="flex flex-col gap-0.5 px-2 pt-1 pb-4 overflow-y-auto flex-1 custom-scrollbar">
        {categories.map(({ name, count }) => {
          const config = getConfig(name);
          const isActive = activeCategory === name;
          return (
            <button
              key={name}
              onClick={() => onSelect(name)}
              className={`w-full flex items-center rounded-xl transition-colors ${
                expanded ? "gap-2 px-2 py-2" : "justify-center py-2"
              } ${
                isActive
                  ? "bg-harbor-primary/10 text-harbor-primary"
                  : "hover:bg-harbor-primary/5 text-slate-500"
              }`}
              title={name}
            >
              <div
                className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg ${
                  isActive ? config.bg : "bg-slate-100"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    isActive ? config.color : "text-slate-400"
                  }`}
                >
                  {config.icon}
                </span>
              </div>
              {expanded && (
                <>
                  <span className="text-xs font-medium truncate flex-1 text-left">{name}</span>
                  <span
                    className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 shrink-0 ${
                      isActive
                        ? "bg-harbor-primary/20 text-harbor-primary"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
