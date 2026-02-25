import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", prefix: ">", path: "/" },
  { label: "Products", prefix: "#", path: "/products" },
  { label: "Customers", prefix: "@", path: "/customers" },
  { label: "Events", prefix: "~", path: "/events" },
  { label: "Assets", prefix: "*", path: "/assets" },
  { label: "Vendors", prefix: "%", path: "/vendors" },
  { label: "Webhooks", prefix: "&", path: "/webhooks" },
];

const settingsItem = { label: "Settings", prefix: "$", path: "/settings" };

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const renderNavItem = (item: typeof navItems[0]) => {
    const active = isActive(item.path);
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={cn(
          "flex items-center gap-3 py-2 px-4 font-space text-sm transition-colors",
          active
            ? "text-white border-l-2 border-white pl-3 bg-white/[0.02]"
            : "text-white/50 hover:text-white/80 hover:bg-white/[0.02]"
        )}
        title={collapsed ? item.label : undefined}
      >
        <span className="text-white/30 text-xs">{item.prefix}</span>
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-white/[0.08] fixed" style={{ backgroundColor: "#0D0F12" }}>
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-white/[0.08]">
        <span className="font-space text-lg font-bold tracking-wider text-white">
          CREDYT
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map(renderNavItem)}
      </nav>

      {/* Settings at bottom */}
      <div className="mt-auto border-t border-white/[0.08]">
        {renderNavItem(settingsItem)}
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex h-7 w-7 items-center justify-center bg-white/10 font-space text-xs text-white">
            JD
          </div>
          <span className="font-space text-xs text-white/40">John Doe</span>
        </div>
      </div>
    </aside>
  );
}