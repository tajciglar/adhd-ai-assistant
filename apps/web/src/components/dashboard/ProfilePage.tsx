import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";

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
    { icon: "person", label: "Personal Information" },
    { icon: "notifications", label: "Notification Preferences", badge: "All On" },
    { icon: "security", label: "Privacy & Security" },
    { icon: "help", label: "Help & Support" },
  ];

  return (
    <div className="flex min-h-screen bg-harbor-bg">
      <DesktopSidebar active="profile" isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center bg-harbor-bg p-4 pb-2 justify-between sticky top-0 z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex size-12 shrink-0 items-center justify-start cursor-pointer text-slate-900"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center">
            Profile
          </h2>
          <div className="flex w-12 items-center justify-end">
            <button className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-harbor-primary/10 transition-colors text-slate-900">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <header className="hidden md:flex h-16 border-b border-harbor-primary/10 bg-white items-center justify-between px-8 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">Account Settings</h2>
          <div className="flex items-center gap-3">
            <button className="px-6 py-2.5 bg-harbor-primary text-white font-semibold rounded-xl shadow-lg shadow-harbor-primary/25 hover:opacity-90 transition-all cursor-pointer">
              Edit Profile
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Mobile Profile */}
          <div className="md:hidden">
            {/* Avatar & Name */}
            <div className="flex flex-col items-center gap-4 p-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-md bg-harbor-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-harbor-primary/40">person</span>
                </div>
                <div className="absolute bottom-0 right-0 bg-harbor-primary text-white p-1.5 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-xs">edit</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <p className="text-[22px] font-bold leading-tight tracking-tight text-center text-slate-900">
                    {capitalizedName}
                  </p>
                  <span className="bg-harbor-primary/10 text-harbor-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    Premium
                  </span>
                </div>
                {childName && (
                  <p className="text-slate-500 text-sm font-normal text-center mt-1">
                    Supporting {childName}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3 px-4">
              <div className="flex min-w-[100px] flex-1 flex-col gap-1 rounded-xl p-4 bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-harbor-primary">
                  <span className="material-symbols-outlined text-lg">local_fire_department</span>
                  <p className="text-slate-600 text-xs font-medium">Streak</p>
                </div>
                <p className="text-slate-900 text-xl font-bold">12 Days</p>
              </div>
              <div className="flex min-w-[100px] flex-1 flex-col gap-1 rounded-xl p-4 bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <span className="material-symbols-outlined text-lg">emoji_events</span>
                  <p className="text-slate-600 text-xs font-medium">Milestones</p>
                </div>
                <p className="text-slate-900 text-xl font-bold">24</p>
              </div>
              <div className="flex min-w-[100px] flex-1 flex-col gap-1 rounded-xl p-4 bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-amber-500">
                  <span className="material-symbols-outlined text-lg">stars</span>
                  <p className="text-slate-600 text-xs font-medium">Points</p>
                </div>
                <p className="text-slate-900 text-xl font-bold">1,250</p>
              </div>
            </div>

            {/* Subscription Card */}
            <div className="p-4 mt-2">
              <div className="flex flex-col gap-4 rounded-xl border-2 border-harbor-primary/20 bg-harbor-primary/5 p-5 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-harbor-primary/10">
                  <span
                    className="material-symbols-outlined text-8xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    workspace_premium
                  </span>
                </div>
                <div className="flex flex-col gap-1 relative z-10">
                  <p className="text-harbor-primary text-base font-bold leading-tight">
                    Premium Plan Active
                  </p>
                  <p className="text-slate-600 text-sm pr-12">
                    You have full access to all ADHD tools, expert content, and priority support.
                  </p>
                </div>
                <button className="flex max-w-fit cursor-pointer items-center justify-center rounded-lg h-9 px-4 bg-harbor-primary text-white text-sm font-semibold shadow-sm hover:bg-harbor-primary/90 transition-all z-10">
                  Manage Billing
                </button>
              </div>
            </div>

            {/* Settings Menu */}
            <div className="flex flex-col px-4 py-2">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest px-2 mb-2">
                Account Settings
              </h3>
              <div className="flex flex-col bg-white rounded-xl overflow-hidden border border-slate-100">
                {settingsItems.map((item, i) => (
                  <button
                    key={item.label}
                    className={`flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                      i < settingsItems.length - 1 ? "border-b border-slate-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-harbor-primary">{item.icon}</span>
                      <span className="text-slate-800 font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && <span className="text-xs text-slate-400">{item.badge}</span>}
                      <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Logout */}
            <div className="px-4 py-6">
              <button
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl text-red-500 font-semibold hover:bg-red-50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">logout</span>
                Logout
              </button>
            </div>
            <div className="h-20" />
          </div>

          {/* Desktop Profile */}
          <div className="hidden md:block max-w-5xl mx-auto p-8 lg:p-12">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-harbor-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-harbor-primary/40">person</span>
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-harbor-primary text-white rounded-full shadow-lg border-2 border-white cursor-pointer">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-slate-900">{capitalizedName}</h1>
                    <span className="bg-harbor-primary/10 text-harbor-primary text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
                      Premium
                    </span>
                  </div>
                  <p className="text-slate-500">Member since 2024</p>
                  {childName && <p className="text-slate-500 font-medium">Supporting {childName}</p>}
                </div>
              </div>
            </div>

            {/* Milestones Grid */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Parenting Milestones</h2>
                <button className="text-harbor-primary text-sm font-semibold hover:underline cursor-pointer">
                  View All Badges
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Strategies Mastered", value: "12", change: "+2 this month", icon: "verified", width: "w-3/4" },
                  { label: "Focus Sessions", value: "48", change: "+5%", icon: "timer", width: "w-1/2" },
                  { label: "Community Kudos", value: "156", change: "+12%", icon: "favorite", width: "w-full" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white p-6 rounded-2xl border border-harbor-primary/5 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-sm font-medium">{stat.label}</span>
                      <span className="material-symbols-outlined text-harbor-primary bg-harbor-primary/10 p-2 rounded-lg">
                        {stat.icon}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-emerald-500 text-sm font-semibold">{stat.change}</p>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                      <div className={`bg-harbor-primary h-1.5 rounded-full ${stat.width}`} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Settings + Subscription 2-col */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Account Settings</h2>
                <div className="bg-white rounded-2xl border border-harbor-primary/5 shadow-sm overflow-hidden">
                  {[
                    { icon: "mail", label: "Email Address", sub: user?.email ?? "" },
                    { icon: "lock", label: "Security", sub: "Password and two-factor auth" },
                    { icon: "notifications", label: "Notifications", sub: "Push, email, and daily reminders" },
                    { icon: "visibility", label: "Privacy", sub: "Community visibility settings" },
                  ].map((item, i, arr) => (
                    <button
                      key={item.label}
                      className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                        i < arr.length - 1 ? "border-b border-harbor-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-harbor-primary/5 text-harbor-primary flex items-center justify-center">
                          <span className="material-symbols-outlined">{item.icon}</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.sub}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subscription */}
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Subscription</h2>
                  <div className="bg-harbor-primary rounded-2xl p-6 text-white shadow-xl shadow-harbor-primary/20 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative z-10">
                      <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Current Plan</p>
                      <h3 className="text-2xl font-bold mb-4">Premium Plus</h3>
                      <div className="flex flex-col gap-2">
                        <button className="w-full py-2.5 bg-white text-harbor-primary font-bold rounded-xl text-sm hover:bg-opacity-90 transition-all cursor-pointer">
                          Manage Subscription
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
