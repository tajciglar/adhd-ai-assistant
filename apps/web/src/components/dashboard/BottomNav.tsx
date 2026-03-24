import { useNavigate } from "react-router-dom";

export type BottomNavTab = "home" | "chat" | "library" | "planner" | "profile" | "admin";

interface BottomNavProps {
  active: BottomNavTab;
  isAdmin?: boolean;
}

const navItems: { id: BottomNavTab; icon: string; label: string; path: string; isCenter?: boolean }[] = [
  { id: "home",    icon: "home",           label: "Home",    path: "/dashboard" },
  { id: "library", icon: "library_books",  label: "Library", path: "/resources" },
  { id: "chat",    icon: "chat_bubble",    label: "Chat",    path: "/chat", isCenter: true },
  { id: "planner", icon: "child_care",     label: "Child",   path: "/child-profile" },
  { id: "profile", icon: "account_circle", label: "Profile", path: "/profile" },
];

export default function BottomNav({ active }: BottomNavProps) {
  const navigate = useNavigate();

  const items = navItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-harbor-bg-alt to-white/95 backdrop-blur-md border-t border-harbor-orange/10 px-2 pt-1 z-50 flex" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.25rem)" }}>
      {items.map((item) => {
        const isActive = active === item.id;

        if (item.isCenter) {
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex flex-1 flex-col items-center justify-center cursor-pointer transition-all -mt-5"
            >
              <div
                className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all ${
                  isActive
                    ? "bg-harbor-primary shadow-harbor-primary/30"
                    : "bg-harbor-primary/90 shadow-harbor-primary/20"
                }`}
              >
                <span
                  className="material-symbols-outlined text-white text-[26px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {item.icon}
                </span>
              </div>
              <p className={`text-[10px] font-semibold mt-0.5 ${isActive ? "text-harbor-primary" : "text-harbor-primary/70"}`}>
                {item.label}
              </p>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 cursor-pointer transition-colors"
          >
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
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
