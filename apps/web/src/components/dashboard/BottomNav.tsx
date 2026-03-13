import { useNavigate } from "react-router-dom";

export type BottomNavTab = "home" | "chat" | "library" | "planner" | "profile";

interface BottomNavProps {
  active: BottomNavTab;
}

const navItems: { id: BottomNavTab; icon: string; label: string; path: string }[] = [
  { id: "home", icon: "dashboard", label: "Home", path: "/dashboard" },
  { id: "chat", icon: "chat_bubble", label: "Chat", path: "/chat" },
  { id: "library", icon: "library_books", label: "Library", path: "/resources" },
  { id: "profile", icon: "account_circle", label: "Profile", path: "/profile" },
];

export default function BottomNav({ active }: BottomNavProps) {
  const navigate = useNavigate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-harbor-primary/10 px-2 pb-6 pt-2 z-50 flex">
      {navItems.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              isActive ? "text-harbor-primary" : "text-slate-400 hover:text-harbor-primary"
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <p className={`text-[10px] uppercase tracking-widest ${isActive ? "font-bold" : "font-semibold"}`}>
              {item.label}
            </p>
          </button>
        );
      })}
    </nav>
  );
}
