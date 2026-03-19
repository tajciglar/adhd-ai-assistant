import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Mascot from "../shared/Mascot";

export type SidebarPage = "dashboard" | "chat" | "library" | "profile" | "admin";

interface DesktopSidebarProps {
  active: SidebarPage;
  isAdmin?: boolean;
  children?: React.ReactNode;
}

const navItems: { id: SidebarPage; icon: string; label: string; path: string }[] = [
  { id: "dashboard", icon: "home",           label: "Home",    path: "/dashboard" },
  { id: "chat",      icon: "chat_bubble",   label: "Chat",    path: "/chat" },
  { id: "library",   icon: "library_books", label: "Library", path: "/resources" },
  { id: "profile",   icon: "person",        label: "Profile", path: "/profile" },
];

export default function DesktopSidebar({ active, isAdmin, children }: DesktopSidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <aside className="hidden md:flex w-64 bg-[#F5F7F9] border-r border-slate-200/60 flex-col shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center border-b border-slate-200/40">
        <button
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/dashboard")}
        >
          <Mascot size={40} />
          <span className="text-harbor-primary text-lg font-extrabold tracking-tight font-display">Harbor</span>
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-hidden">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer w-full text-left ${
                isActive
                  ? "bg-harbor-orange/12 text-harbor-orange"
                  : "text-harbor-text/60 hover:bg-white hover:text-slate-900"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] ${isActive ? "text-harbor-orange" : "text-harbor-primary"}`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-harbor-primary" />
              )}
            </button>
          );
        })}

        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer w-full text-left ${
              active === "admin"
                ? "bg-harbor-surface-soft text-slate-900"
                : "text-harbor-text/70 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[22px] ${active === "admin" ? "text-harbor-orange" : "text-harbor-primary"}`}
              style={active === "admin" ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              admin_panel_settings
            </span>
            <span>Admin</span>
            {active === "admin" && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-harbor-primary" />
            )}
          </button>
        )}

        {children}
      </div>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-200/40">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
