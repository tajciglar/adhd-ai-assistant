import { useNavigate } from "react-router-dom";

export type BottomNavTab = "home" | "chat" | "library" | "planner" | "profile" | "admin";

interface BottomNavProps {
  active: BottomNavTab;
  isAdmin?: boolean;
}

const navItems: { id: BottomNavTab; icon: string; label: string; path: string }[] = [
  { id: "home",    icon: "home",           label: "Home",    path: "/dashboard" },
  { id: "chat",    icon: "chat_bubble",    label: "Chat",    path: "/chat" },
  { id: "library", icon: "library_books",  label: "Library", path: "/resources" },
  { id: "profile", icon: "account_circle", label: "Profile", path: "/profile" },
];

export default function BottomNav({ active }: BottomNavProps) {
  const navigate = useNavigate();

  const items = navItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-2 pb-safe-area-inset-bottom pt-1 z-50 flex">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 cursor-pointer transition-colors"
          >
            <div
              className={`flex items-center justify-center w-10 h-8 rounded-xl transition-all ${
                isActive ? "bg-harbor-orange/10" : ""
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] transition-colors ${
                  isActive ? "text-harbor-orange" : "text-harbor-primary/70"
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
            </div>
            <p
              className={`text-[10px] font-semibold transition-colors ${
                isActive ? "text-harbor-orange" : "text-harbor-primary/70"
              }`}
            >
              {item.label}
            </p>
          </button>
        );
      })}
    </nav>
  );
}
