import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import type { Resource } from "../../types/admin";

interface DashboardUserInfo {
  id: string;
  email: string;
  role: string;
  profile: {
    childName: string;
    onboardingCompleted: boolean;
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getResourceStyle(resource: Resource): { icon: string; bg: string; color: string; label: string } {
  const cat = (resource.category ?? "").toLowerCase();
  if (cat.includes("video")) return { icon: "play_circle", bg: "bg-emerald-50", color: "text-emerald-600", label: "Video" };
  if (cat.includes("article")) return { icon: "article", bg: "bg-sky-50", color: "text-sky-600", label: "Article" };
  if (cat.includes("checklist") || cat.includes("printable"))
    return { icon: "task_alt", bg: "bg-harbor-surface-soft", color: "text-harbor-primary", label: "Checklist" };
  return { icon: "picture_as_pdf", bg: "bg-red-50", color: "text-red-500", label: "PDF" };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState<DashboardUserInfo | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/api/user/me").catch(() => null),
      api.get("/api/admin/resources").catch(() => ({ resources: [] })),
    ]).then(([userData, resourceData]) => {
      if (userData) setUserInfo(userData as DashboardUserInfo);
      const rd = resourceData as { resources: Resource[] };
      setResources(rd.resources?.slice(0, 3) ?? []);
      setLoading(false);
    });
  }, []);

  const childName = userInfo?.profile?.childName
    ? userInfo.profile.childName
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "";
  const isAdmin = userInfo?.role === "admin";

  if (loading) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 bg-harbor-primary rounded-2xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-white">psychology</span>
          </div>
          <p className="text-harbor-text/40 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // Streak data (placeholder — will be dynamic later)
  const streakDays = 12;
  const weekDays = [
    { label: "M", completed: true },
    { label: "T", completed: true },
    { label: "W", completed: true, isToday: true },
    { label: "T", completed: false },
    { label: "F", completed: false },
    { label: "S", completed: false },
    { label: "S", completed: false },
  ];
  const completedCount = weekDays.filter((d) => d.completed).length;
  const todayIndex = weekDays.findIndex((d) => d.isToday);

  const displayResources: Resource[] =
    resources.length > 0
      ? resources
      : ([
          { id: "p1", title: "Evening Routine Guide", category: "PDF", sizeBytes: 1228800 } as Resource,
          { id: "p2", title: "Managing Meltdowns", category: "Video", sizeBytes: 0 } as Resource,
          { id: "p3", title: "Nutrition & ADHD Symptoms", category: "Article", sizeBytes: 0 } as Resource,
        ]);

  return (
    <div className="flex min-h-screen bg-harbor-bg">
      <DesktopSidebar active="dashboard" isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col">
        {/* ── Mobile Header ── */}
        <header className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-harbor-primary rounded-xl flex items-center justify-center shadow-sm shadow-harbor-primary/30">
              <span className="material-symbols-outlined text-white text-[18px]">psychology</span>
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">Harbor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate("/chat")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-harbor-primary text-white rounded-xl text-sm font-semibold shadow-sm shadow-harbor-primary/25 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
              <span>Chat</span>
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-harbor-error rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        {/* ── Desktop Header ── */}
        <header className="hidden md:flex h-16 border-b border-slate-100 bg-white items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-200 outline-none transition-all"
                placeholder="Search resources, tips, or guides…"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center rounded-xl h-9 w-9 hover:bg-slate-50 text-slate-500 transition-colors border border-slate-100">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center justify-center rounded-xl h-9 w-9 hover:bg-slate-50 text-slate-500 transition-colors border border-slate-100"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
            <div className="w-px h-6 bg-slate-100 mx-1" />
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-right">
                <p className="text-xs font-bold leading-tight text-slate-900">
                  {childName ? `${childName}'s Parent` : user?.email?.split("@")[0] ?? "Parent"}
                </p>
                <p className="text-[10px] text-slate-400">Parent Member</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-harbor-surface-soft border-2 border-white shadow-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-harbor-primary text-[18px]">person</span>
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-28 md:pb-10">
          {/* Mobile Search */}
          <div className="md:hidden px-4 pt-4 pb-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-200 text-sm outline-none transition-all"
                placeholder="Search resources, tips, or guides…"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Mobile greeting */}
          <div className="md:hidden px-4 pt-4 pb-2">
            <p className="text-slate-500 text-sm">Good morning</p>
            <h1 className="text-xl font-bold text-slate-900">
              {childName ? `${childName}'s Parent` : user?.email?.split("@")[0] ?? "Welcome back"}
            </h1>
          </div>

          {/* Desktop greeting */}
          <div className="hidden md:block px-8 pt-8 pb-4">
            <h1 className="text-2xl font-bold text-slate-900">
              {childName ? `Welcome back, ${childName}'s parent` : "Welcome back!"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">Here's your parenting snapshot for today.</p>
          </div>

          {/* ── AI Consultation CTA ── */}
          <div className="px-4 md:px-8 mb-6">
            <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              {/* Left accent bar */}
              <div className="absolute left-0 top-4 bottom-4 w-1 bg-harbor-primary rounded-r-full" />

              {/* Content */}
              <div className="relative z-10 flex flex-col gap-2 pl-4 max-w-[75%] md:max-w-md">
                <span className="bg-harbor-primary/10 text-harbor-primary w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  AI Coach
                </span>
                <h2 className="text-xl font-bold leading-snug text-slate-900">
                  Start AI Consultation
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-3">
                  Get personalized strategies tailored for{childName ? ` ${childName}'s` : " your child's"} unique needs.
                </p>
                <button
                  onClick={() => navigate("/chat")}
                  className="bg-harbor-primary text-white font-bold py-2.5 px-5 rounded-xl w-fit flex items-center gap-2 active:scale-95 transition-transform cursor-pointer text-sm shadow-sm shadow-harbor-primary/20"
                >
                  <span>Begin Session</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>

              {/* Decorative icon */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none select-none">
                <span
                  className="material-symbols-outlined text-slate-900"
                  style={{ fontSize: "140px", fontVariationSettings: "'FILL' 1" }}
                >
                  neurology
                </span>
              </div>
            </div>
          </div>

          {/* ── Two-column layout on desktop ── */}
          <div className="md:grid md:grid-cols-2 md:gap-6 md:px-8">
            {/* Weekly Momentum */}
            <section className="px-4 md:px-0 mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900">Weekly Momentum</h3>
                <span className="flex items-center gap-1 text-harbor-highlight text-sm font-bold">
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    local_fire_department
                  </span>
                  {streakDays} Day Streak
                </span>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                {/* Day circles */}
                <div className="relative flex justify-between items-center mb-5">
                  {/* Progress line */}
                  <div className="absolute top-5 left-5 right-5 h-px bg-slate-100" />
                  <div
                    className="absolute top-5 left-5 h-px bg-harbor-success/40 transition-all"
                    style={{ width: `calc(${(todayIndex / (weekDays.length - 1)) * 100}% - 0px)` }}
                  />

                  {weekDays.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 z-10">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{day.label}</span>
                      {day.isToday ? (
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/20">
                          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            bolt
                          </span>
                        </div>
                      ) : day.completed ? (
                        <div className="w-10 h-10 rounded-full bg-harbor-success/15 text-harbor-success flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-200 bg-slate-50/80 flex items-center justify-center" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>{completedCount} of 7 days</span>
                    <span>{Math.round((completedCount / 7) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-slate-800 transition-all"
                      style={{ width: `${(completedCount / 7) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Milestone */}
                <div className="flex items-center gap-3 p-3 bg-harbor-highlight/10 rounded-xl border border-harbor-highlight/20">
                  <div className="w-8 h-8 bg-harbor-highlight/20 rounded-lg flex items-center justify-center shrink-0">
                    <span
                      className="material-symbols-outlined text-harbor-highlight text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      emoji_events
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Next Milestone: 14 Days</p>
                    <p className="text-[11px] text-slate-500">2 more days to unlock "Focus Pro"</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Resources */}
            <section className="px-4 md:px-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900">Recent Resources</h3>
                <button
                  onClick={() => navigate("/resources")}
                  className="text-slate-500 text-sm font-semibold cursor-pointer hover:text-slate-800 hover:underline transition-colors"
                >
                  View All
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {displayResources.map((resource) => {
                  const style = getResourceStyle(resource);
                  return (
                    <button
                      key={resource.id}
                      onClick={() => navigate("/resources")}
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-slate-200 hover:shadow-md transition-all cursor-pointer text-left w-full"
                    >
                      <div className={`w-12 h-12 ${style.bg} rounded-xl flex items-center justify-center shrink-0`}>
                        <span className={`material-symbols-outlined ${style.color} text-2xl`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {style.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate text-slate-900">{resource.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {style.label}
                          {resource.sizeBytes > 0 && ` · ${formatFileSize(resource.sizeBytes)}`}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 shrink-0">chevron_right</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>

      <BottomNav active="home" />
    </div>
  );
}
