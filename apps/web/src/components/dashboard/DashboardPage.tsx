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
        <div className="text-center">
          <h1 className="text-3xl font-bold text-harbor-primary mb-2">
            Harbor
          </h1>
          <p className="text-harbor-text/40">Loading...</p>
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
  ];

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="flex min-h-screen bg-harbor-bg">
      <DesktopSidebar active="dashboard" isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-harbor-primary rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Harbor
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/chat")}
              className="flex items-center gap-1.5 px-3 py-2 bg-harbor-primary text-white rounded-xl text-sm font-semibold shadow-sm shadow-harbor-primary/20 hover:opacity-90 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">chat_bubble</span>
              <span className="hidden sm:inline">Chat</span>
            </button>
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-16 border-b border-harbor-primary/10 bg-white items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                className="w-full bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-harbor-primary/20 outline-none"
                placeholder="Search resources, tips, or guides..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">settings</span>
            </button>
            <div className="h-8 w-px bg-harbor-primary/10 mx-1" />
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold leading-tight text-slate-900">
                  {childName ? `${childName}'s Parent` : user?.email?.split("@")[0] ?? "Parent"}
                </p>
                <p className="text-[10px] text-slate-500">Parent Member</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-harbor-primary/10 border-2 border-white shadow-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-harbor-primary text-lg">person</span>
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-28 md:pb-8">
          {/* Mobile Search */}
          <div className="md:hidden px-4 py-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-3 bg-white border-none rounded-xl shadow-sm focus:ring-2 focus:ring-harbor-primary text-sm outline-none"
                placeholder="Search resources, tips, or guides..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Desktop greeting */}
          <div className="hidden md:block px-8 pt-8 pb-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back{childName ? `, ${childName}'s Parent` : ""}!
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Here's what's happening with your parenting journey.
            </p>
          </div>

          {/* AI Consultation CTA */}
          <div className="px-4 md:px-8 mb-6">
            <div className="relative overflow-hidden bg-harbor-primary rounded-2xl p-6 text-white shadow-lg shadow-harbor-primary/20">
              <div className="relative z-10 flex flex-col gap-2">
                <span className="bg-white/20 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  AI Coach
                </span>
                <h2 className="text-xl font-bold">Start AI Consultation</h2>
                <p className="text-white/90 text-sm mb-4 max-w-[80%]">
                  Get instant personalized guidance and strategies tailored for
                  {childName ? ` ${childName}'s` : " your child's"} unique needs.
                </p>
                <button
                  onClick={() => navigate("/chat")}
                  className="bg-white text-harbor-primary font-bold py-3 px-6 rounded-xl w-full md:w-auto md:max-w-xs flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
                >
                  <span>Begin Session</span>
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </button>
              </div>
              {/* Decorative background elements */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -left-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
            </div>
          </div>

          {/* Two-column layout on desktop */}
          <div className="md:grid md:grid-cols-2 md:gap-6 md:px-8">
            {/* Weekly Momentum Section */}
            <section className="px-4 md:px-0 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Weekly Momentum
                </h3>
                <span className="text-harbor-primary text-sm font-semibold">
                  {streakDays} Day Streak
                </span>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  {weekDays.map((day, i) => (
                    <div
                      key={i}
                      className={`flex flex-col items-center gap-2 ${!day.completed && !day.isToday ? "opacity-40" : ""}`}
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {day.label}
                      </span>
                      {day.isToday ? (
                        <div className="w-10 h-10 rounded-full bg-harbor-primary flex items-center justify-center text-white ring-4 ring-harbor-primary/20">
                          <span className="material-symbols-outlined text-xl">
                            bolt
                          </span>
                        </div>
                      ) : day.completed ? (
                        <div className="w-10 h-10 rounded-full bg-harbor-primary/10 text-harbor-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-xl">
                            check_circle
                          </span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="material-symbols-outlined text-yellow-600">
                      emoji_events
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Next Milestone: 14 Days
                    </p>
                    <p className="text-[10px] text-slate-500">
                      2 more days to unlock the "Focus Pro" badge!
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Resources */}
            <section className="px-4 md:px-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Recent Resources
                </h3>
                <button
                  onClick={() => navigate("/resources")}
                  className="text-harbor-primary text-sm font-semibold cursor-pointer"
                >
                  View All
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {resources.length > 0 ? (
                  resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4"
                    >
                      <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-red-500 text-3xl">
                          picture_as_pdf
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate text-slate-900">
                          {resource.title}
                        </h4>
                        <p className="text-xs text-slate-500">
                          PDF &bull; {formatFileSize(resource.sizeBytes)}
                        </p>
                        {resource.category && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500">
                              {resource.category}
                            </span>
                          </div>
                        )}
                      </div>
                      <button className="p-2 text-slate-400 cursor-pointer">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                      <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-red-500 text-3xl">
                          picture_as_pdf
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate text-slate-900">
                          Evening Routine Guide
                        </h4>
                        <p className="text-xs text-slate-500">PDF &bull; 1.2 MB</p>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500 inline-block mt-1">
                          Parenting
                        </span>
                      </div>
                      <button className="p-2 text-slate-400">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-blue-500 text-3xl">
                          play_circle
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate text-slate-900">
                          Managing Meltdowns
                        </h4>
                        <p className="text-xs text-slate-500">
                          Video Lesson &bull; 12 mins
                        </p>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500 inline-block mt-1">
                          Behavioral
                        </span>
                      </div>
                      <button className="p-2 text-slate-400">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                      <div className="w-16 h-16 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-harbor-primary text-3xl">
                          article
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate text-slate-900">
                          Nutrition & ADHD Symptoms
                        </h4>
                        <p className="text-xs text-slate-500">
                          Article &bull; 5 min read
                        </p>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500 inline-block mt-1">
                          Wellness
                        </span>
                      </div>
                      <button className="p-2 text-slate-400">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      <BottomNav active="home" />
    </div>
  );
}
