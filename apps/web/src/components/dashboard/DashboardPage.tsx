import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import LoadingScreen from "../shared/LoadingScreen";
import Mascot from "../shared/Mascot";
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
    return <LoadingScreen />;
  }

  // Streak data (placeholder — will be dynamic later)
  const streakDays = 12;
  const completedCount = 3;

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
            <Mascot size={32} />
            <span className="text-base font-bold tracking-tight text-harbor-primary font-display">Harbor</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate("/resources")}
              className="flex items-center justify-center w-9 h-9 text-harbor-primary/70 hover:text-harbor-primary hover:bg-harbor-primary/5 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center justify-center w-9 h-9 text-harbor-primary/70 hover:text-harbor-primary hover:bg-harbor-primary/5 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              </button>
            )}
            <button
              onClick={() => navigate("/chat")}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-harbor-orange/30 text-harbor-orange rounded-xl text-sm font-semibold hover:bg-harbor-orange/5 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
              <span>Chat</span>
            </button>
          </div>
        </header>

        {/* ── Desktop Header ── */}
        <header className="hidden md:flex h-16 border-b border-slate-100 bg-white items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-harbor-primary/40 text-lg">search</span>
              <input
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm shadow-inner shadow-slate-100/50 focus:ring-2 focus:ring-harbor-orange/20 focus:border-harbor-orange/30 focus:shadow-none outline-none transition-all"
                placeholder="Search resources, tips, or guides…"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center rounded-xl h-10 w-10 hover:bg-harbor-primary/10 text-harbor-primary transition-colors border border-harbor-primary/15">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center justify-center rounded-xl h-10 w-10 hover:bg-harbor-primary/10 text-harbor-primary transition-colors border border-harbor-primary/15"
            >
              <span className="material-symbols-outlined text-[22px]">settings</span>
            </button>
            <div className="w-px h-6 bg-slate-100 mx-1" />
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-right">
                <p className="text-sm font-bold leading-tight text-slate-900">
                  {childName ? `${childName}'s Parent` : user?.email?.split("@")[0] ?? "Parent"}
                </p>
                <p className="text-xs text-slate-400">Parent Member</p>
              </div>
              <Mascot size={42} className="rounded-full" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-28 md:pb-10">
          {/* Mobile greeting */}
          <div className="md:hidden px-4 pt-4 pb-2">
            <p className="text-slate-500 text-sm">Good morning</p>
            <h1 className="text-xl font-bold text-slate-900 font-display">
              {childName ? `${childName}'s Parent` : user?.email?.split("@")[0] ?? "Welcome back"}
            </h1>
          </div>

          {/* Desktop greeting */}
          <div className="hidden md:block px-8 pt-8 pb-4">
            <h1 className="text-2xl font-bold text-harbor-primary font-display">
              {childName ? `Welcome back, ${childName}'s parent` : "Welcome back!"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">Here's your parenting snapshot for today.</p>
          </div>

          {/* ── Chat CTA ── */}
          <div className="px-4 md:px-8 mb-6">
            <button
              onClick={() => navigate("/chat")}
              className="relative w-full overflow-hidden bg-harbor-bg-alt border border-harbor-orange/15 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md active:scale-[0.99] transition-all cursor-pointer text-left group"
            >
              <Mascot size={56} mood="waving" className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-slate-900 leading-snug font-display">
                  {childName ? `Need help with ${childName}?` : "Need parenting support?"}
                </p>
                <p className="text-slate-500 text-sm mt-0.5">
                  Chat with Harbor for personalized ADHD strategies
                </p>
              </div>
              <span className="material-symbols-outlined text-harbor-orange text-[24px] shrink-0 group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>

          {/* ── Streak bar (compact) ── */}
          <div className="px-4 md:px-8 mb-6">
            <div className="bg-harbor-bg-alt rounded-xl px-4 py-3 flex items-center gap-3 border border-harbor-orange/10 shadow-sm">
              <span
                className="material-symbols-outlined text-harbor-orange text-[20px] animate-pulse"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_fire_department
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{streakDays} Day Streak</p>
                    <span className="text-[10px] text-harbor-success font-medium">Active now</span>
                  </div>
                  <p className="text-xs text-slate-400">{completedCount}/7 this week</p>
                </div>
                <div className="w-full bg-white rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-harbor-orange transition-all"
                    style={{ width: `${(completedCount / 7) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Resources ── */}
          <div className="md:px-8">
            <section className="px-4 md:px-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-harbor-primary font-display">Recent Resources</h3>
                <button
                  onClick={() => navigate("/resources")}
                  className="text-harbor-orange text-sm font-semibold cursor-pointer hover:text-harbor-orange/80 hover:underline transition-colors"
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

      <BottomNav active="home" isAdmin={isAdmin} />
    </div>
  );
}
