import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const settingsNav = [
  { label: "Settings", path: "/settings", prefix: "⚙" },
  { label: "Team Management", path: "/team", prefix: "◈" },
  { label: "Developers", path: "/developers", prefix: "<>" },
  { label: "Contact Support", path: "#", prefix: "⊙" },
];

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-[200px_1fr] gap-0 min-h-[calc(100vh-6rem)]">
      {/* Left sub-nav */}
      <div className="border-r border-dotted border-white/20 pt-8 px-4">
        <div className="space-y-1">
          {settingsNav.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => item.path !== "#" && navigate(item.path)}
                className={cn(
                  "w-full text-left font-mono text-sm pl-3 py-1.5 transition-colors block",
                  active
                    ? "text-white border-l-2 border-white -ml-0"
                    : "text-white/40 hover:text-white/70 cursor-pointer"
                )}
              >
                <span className="mr-2 text-xs">{item.prefix}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right content */}
      <div className="pt-8 px-10">{children}</div>
    </div>
  );
}
