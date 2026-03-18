import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export type SidebarPage = "dashboard" | "chat" | "library" | "profile" | "admin";

interface DesktopSidebarProps {
  active: SidebarPage;
  isAdmin?: boolean;
  children?: React.ReactNode;
}

const navItems: { id: SidebarPage; icon: string; label: string; path: string }[] = [
  { id: "dashboard", icon: "dashboard",     label: "Dashboard",    path: "/dashboard" },
  { id: "library",   icon: "library_books", label: "Library",      path: "/resources" },
  { id: "chat",      icon: "chat_bubble",   label: "AI Assistant", path: "/chat" },
  { id: "profile",   icon: "person",        label: "Profile",      path: "/profile" },
];

export default function DesktopSidebar({ active, isAdmin, children }: DesktopSidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 flex-col shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-50">
        <button
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/dashboard")}
        >
          <div className="w-8 h-8 bg-harbor-primary rounded-xl flex items-center justify-center shadow-sm shadow-harbor-primary/25">
            <span
              className="material-symbols-outlined text-white text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              psychology
            </span>
          </div>
          <span className="text-slate-900 text-base font-bold tracking-tight">Harbor AI</span>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer w-full text-left ${
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${isActive ? "text-slate-700" : ""}`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-400" />
              )}
            </button>
          );
        })}

        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer w-full text-left ${
              active === "admin"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            <span>Admin</span>
            {active === "admin" && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-400" />
            )}
          </button>
        )}

        {/* Optional children (e.g. conversation list) */}
        {children}
      </div>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-50">
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
