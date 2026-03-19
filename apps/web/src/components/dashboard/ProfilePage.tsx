import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import MemoriesModal from "./MemoriesModal";
import LoadingScreen from "../shared/LoadingScreen";
import Mascot from "../shared/Mascot";

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
    return <LoadingScreen />;
  }

  const settingsItems = [
    { icon: "mascot", label: "Harbor's Memory", action: "memories" as const, sub: "What Harbor remembers about your family" },
    { icon: "person", label: "Personal Information", sub: "Name, email, child profile" },
    { icon: "lock_reset", label: "Forgot Password", sub: "Reset your password via email" },
    { icon: "notifications", label: "Notifications", sub: "Push, email, and daily reminders" },
    { icon: "security", label: "Privacy & Security", sub: "Data and account protection" },
    { icon: "help", label: "Help & Support", sub: "FAQs and contact us" },
  ];

  return (
    <div className="flex min-h-screen bg-harbor-bg">
      <DesktopSidebar active="profile" isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col">
        {/* ── Mobile Header ── */}
        <div className="md:hidden flex items-center bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 justify-between sticky top-0 z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex w-9 h-9 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer text-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h2 className="text-harbor-primary text-base font-bold flex-1 text-center font-display">Profile</h2>
          <div className="w-9" />
        </div>

        {/* ── Desktop Header ── */}
        <header className="hidden md:flex h-16 border-b border-slate-100 bg-white items-center px-8 shrink-0">
          <h2 className="text-lg font-bold text-harbor-primary font-display">Account Settings</h2>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* ── Avatar & Name (shared) ── */}
          <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6">
            <Mascot size={100} mood="happy" />
            <div className="flex flex-col items-center gap-1">
              <p className="text-xl font-bold text-slate-900 font-display">{capitalizedName}</p>
              {childName && (
                <p className="text-slate-500 text-sm">Supporting {childName}</p>
              )}
              <p className="text-slate-400 text-xs">{user?.email}</p>
            </div>
          </div>

          {/* ── Settings List ── */}
          <div className="px-4 md:px-0 md:max-w-2xl md:mx-auto pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1 mb-2 md:px-0">Settings</p>
            <div className="flex flex-col bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm">
              {settingsItems.map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.action === "memories" ? () => setShowMemories(true) : undefined}
                  className={`flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                    i < settingsItems.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-harbor-primary/15 rounded-xl flex items-center justify-center">
                      {item.icon === "mascot" ? (
                        <Mascot size={24} />
                      ) : (
                        <span className="material-symbols-outlined text-harbor-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                      )}
                    </div>
                    <div className="text-left">
                      <span className="text-slate-800 text-sm font-medium block">{item.label}</span>
                      <span className="text-xs text-slate-400">{item.sub}</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 text-[18px]">chevron_right</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Sign Out ── */}
          <div className="px-4 md:px-0 md:max-w-2xl md:mx-auto pb-8">
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 py-3 border border-red-100 rounded-xl text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign Out
            </button>
          </div>
          <div className="h-20 md:h-0" />
        </div>
      </div>

      <BottomNav active="profile" isAdmin={isAdmin} />

      {showMemories && <MemoriesModal onClose={() => setShowMemories(false)} />}
    </div>
  );
}
