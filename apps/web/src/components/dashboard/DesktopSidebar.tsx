import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export type SidebarPage = "dashboard" | "chat" | "library" | "profile" | "admin";

interface DesktopSidebarProps {
  active: SidebarPage;
  isAdmin?: boolean;
  children?: React.ReactNode;
}

const navItems: { id: SidebarPage; icon: string; label: string; path: string }[] = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard", path: "/dashboard" },
  { id: "library", icon: "library_books", label: "Library", path: "/resources" },
  { id: "chat", icon: "chat_bubble", label: "AI Assistant", path: "/chat" },
  { id: "profile", icon: "person", label: "Profile", path: "/profile" },
];

export default function DesktopSidebar({ active, isAdmin, children }: DesktopSidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <aside className="hidden md:flex w-72 bg-white border-r border-harbor-primary/10 flex-col shrink-0 h-screen sticky top-0">
      {/* Logo + Nav */}
      <div className="p-4 flex flex-col gap-2">
        <div
          className="flex items-center gap-3 px-3 py-2 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <div className="w-8 h-8 bg-harbor-primary/10 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-harbor-primary">psychology</span>
          </div>
          <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight">
            Harbor AI
          </h2>
        </div>
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-harbor-primary/10 text-harbor-primary"
                  : "text-slate-600 hover:bg-harbor-primary/5 hover:text-harbor-primary"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <p className="text-sm font-medium">{item.label}</p>
            </button>
          );
        })}
        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              active === "admin"
                ? "bg-harbor-primary/10 text-harbor-primary"
                : "text-slate-600 hover:bg-harbor-primary/5 hover:text-harbor-primary"
            }`}
          >
            <span className="material-symbols-outlined">admin_panel_settings</span>
            <p className="text-sm font-medium">Admin</p>
          </button>
        )}
      </div>

      {/* Optional extra content (e.g., conversation list in chat) */}
      {children}

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-harbor-primary/10">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <p className="text-sm font-medium">Sign Out</p>
        </button>
      </div>
    </aside>
  );
}
