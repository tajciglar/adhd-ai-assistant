import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import MemoriesModal from "./MemoriesModal";

interface ProfileUserInfo {
  id: string;
  email: string;
  role: string;
  profile: {
    childName: string;
    onboardingCompleted: boolean;
  };
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [userInfo, setUserInfo] = useState<ProfileUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMemories, setShowMemories] = useState(false);

  useEffect(() => {
    api
      .get("/api/user/me")
      .then((data) => {
        setUserInfo(data as ProfileUserInfo);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const displayName = user?.email?.split("@")[0] ?? "Parent";
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  const isAdmin = userInfo?.role === "admin";
  const childName = userInfo?.profile?.childName
    ? userInfo.profile.childName
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-harbor-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const settingsItems = [
    { icon: "psychology", label: "Harbor's Memory", action: "memories" as const, sub: "" },
    { icon: "person", label: "Personal Information", sub: "" },
    { icon: "notifications", label: "Notification Preferences", badge: "All On", sub: "" },
    { icon: "security", label: "Privacy & Security", sub: "" },
    { icon: "help", label: "Help & Support", sub: "" },
  ];

  const stats = [
    { icon: "local_fire_department", label: "Streak", value: "12", unit: "days", color: "text-harbor-highlight", bg: "bg-harbor-highlight/10" },
    { icon: "emoji_events",          label: "Milestones", value: "24", unit: "earned", color: "text-harbor-success", bg: "bg-harbor-success/10" },
    { icon: "stars",                  label: "Points", value: "1,250", unit: "total", color: "text-harbor-secondary", bg: "bg-harbor-secondary/10" },
  ];

  return (
    <div className="flex min-h-screen bg-harbor-bg">
      <DesktopSidebar active="profile" isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col">
        {/* ── Mobile Header ── */}
        <div className="md:hidden flex items-center bg-harbor-bg px-4 py-3 justify-between sticky top-0 z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex w-9 h-9 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer text-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h2 className="text-slate-900 text-base font-bold flex-1 text-center">Profile</h2>
          <button className="flex w-9 h-9 cursor-pointer items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-600">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>

        {/* ── Desktop Header ── */}
        <header className="hidden md:flex h-16 border-b border-slate-100 bg-white items-center justify-between px-8 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Account Settings</h2>
          <button className="px-5 py-2 bg-harbor-primary text-white font-semibold rounded-xl text-sm shadow-sm shadow-harbor-primary/25 hover:opacity-90 transition-all cursor-pointer">
            Edit Profile
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* ── Mobile Profile ── */}
          <div className="md:hidden">
            {/* Avatar & Name */}
            <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-harbor-surface-soft flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-harbor-primary/30">person</span>
                </div>
                <button className="absolute bottom-0 right-0 bg-harbor-primary text-white p-1.5 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[12px]">edit</span>
                </button>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-slate-900">{capitalizedName}</p>
                  <span className="bg-harbor-highlight/15 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Premium
                  </span>
                </div>
                {childName && (
                  <p className="text-slate-500 text-sm">Supporting {childName}</p>
                )}
                <p className="text-slate-400 text-xs">{user?.email}</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-3 px-4 pb-4">
              {stats.map((s) => (
                <div key={s.label} className="flex-1 flex flex-col items-center gap-1 bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                  <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center`}>
                    <span
                      className={`material-symbols-outlined text-[16px] ${s.color}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {s.icon}
                    </span>
                  </div>
                  <p className="text-slate-900 text-lg font-bold leading-none">{s.value}</p>
                  <p className="text-slate-400 text-[10px] font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Premium card */}
            <div className="px-4 pb-4">
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-amber-50/40 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-amber-600 text-[16px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        workspace_premium
                      </span>
                      <p className="text-slate-800 text-sm font-bold">Premium Plan Active</p>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed max-w-[220px]">
                      Full access to all ADHD tools, expert content, and priority support.
                    </p>
                  </div>
                </div>
                <button className="mt-3 flex items-center gap-1.5 cursor-pointer px-4 py-2 bg-harbor-primary text-white text-xs font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all">
                  Manage Billing
                </button>
              </div>
            </div>

            {/* Settings list */}
            <div className="px-4 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1 mb-2">Account Settings</p>
              <div className="flex flex-col bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                {settingsItems.map((item, i) => (
                  <button
                    key={item.label}
                    onClick={"action" in item && item.action === "memories" ? () => setShowMemories(true) : undefined}
                    className={`flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                      i < settingsItems.length - 1 ? "border-b border-slate-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-500 text-[16px]">{item.icon}</span>
                      </div>
                      <span className="text-slate-800 text-sm font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && <span className="text-[11px] text-slate-400">{item.badge}</span>}
                      <span className="material-symbols-outlined text-slate-300 text-[18px]">chevron_right</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Logout */}
            <div className="px-4 pb-8">
              <button
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 py-3 border border-red-100 rounded-xl text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign Out
              </button>
            </div>
            <div className="h-20" />
          </div>

          {/* ── Desktop Profile ── */}
          <div className="hidden md:block max-w-4xl mx-auto p-8 lg:p-10">
            {/* Profile Header */}
            <div className="flex items-center gap-6 mb-10">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl border-2 border-white shadow-lg bg-harbor-surface-soft flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-harbor-primary/30">person</span>
                </div>
                <button className="absolute -bottom-1 -right-1 p-1.5 bg-harbor-primary text-white rounded-lg shadow-md border-2 border-white cursor-pointer">
                  <span className="material-symbols-outlined text-[12px]">edit</span>
                </button>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900">{capitalizedName}</h1>
                  <span className="bg-harbor-highlight/15 text-amber-700 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
                    Premium
                  </span>
                </div>
                <p className="text-slate-500 text-sm">Member since 2024</p>
                {childName && <p className="text-slate-500 text-sm">Supporting {childName}</p>}
              </div>
            </div>

            {/* Milestones */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Parenting Milestones</h2>
                <button className="text-slate-500 text-sm font-semibold hover:text-slate-800 hover:underline cursor-pointer transition-colors">
                  View All Badges
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Strategies Mastered", value: "12", change: "+2 this month", icon: "verified",  progress: 0.75, color: "bg-sky-500" },
                  { label: "Focus Sessions",       value: "48", change: "+5%",           icon: "timer",     progress: 0.5,  color: "bg-amber-500" },
                  { label: "Community Kudos",      value: "156", change: "+12%",          icon: "favorite",  progress: 1.0,  color: "bg-rose-400" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-500 text-xs font-medium">{stat.label}</span>
                      <span className={`material-symbols-outlined p-1.5 rounded-lg text-[18px] ${
                        stat.icon === "verified" ? "text-sky-600 bg-sky-50" :
                        stat.icon === "timer" ? "text-amber-600 bg-amber-50" :
                        "text-rose-500 bg-rose-50"
                      }`}>
                        {stat.icon}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-harbor-success text-xs font-semibold">{stat.change}</p>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full">
                      <div className={`h-1 rounded-full ${stat.color}`} style={{ width: `${stat.progress * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Settings + Subscription */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <h2 className="text-base font-bold text-slate-900 mb-4">Account Settings</h2>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {[
                    { icon: "psychology",   label: "Harbor's Memory", sub: "What Harbor remembers about your family", action: "memories" as const },
                    { icon: "mail",         label: "Email Address",  sub: user?.email ?? "" },
                    { icon: "lock",         label: "Security",       sub: "Password and two-factor auth" },
                    { icon: "notifications",label: "Notifications",  sub: "Push, email, and daily reminders" },
                    { icon: "visibility",   label: "Privacy",        sub: "Community visibility settings" },
                  ].map((item, i, arr) => (
                    <button
                      key={item.label}
                      onClick={"action" in item && item.action === "memories" ? () => setShowMemories(true) : undefined}
                      className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                        i < arr.length - 1 ? "border-b border-slate-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-400">{item.sub}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 text-[20px]">chevron_right</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subscription — less purple-heavy version */}
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-4">Subscription</h2>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
                  {/* Subtle accent strip at top */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-harbor-highlight rounded-t-2xl" />
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="material-symbols-outlined text-amber-600 text-[18px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        workspace_premium
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Plan</p>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Premium Plus</h3>
                    <ul className="flex flex-col gap-1.5 mb-4">
                      {["All ADHD tools", "Expert content library", "Priority support"].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="w-4 h-4 bg-harbor-success/15 rounded-full flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-harbor-success text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button className="w-full py-2.5 bg-harbor-primary text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-all cursor-pointer shadow-sm shadow-harbor-primary/20">
                      Manage Subscription
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="profile" />

      {showMemories && <MemoriesModal onClose={() => setShowMemories(false)} />}
    </div>
  );
}
