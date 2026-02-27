import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Zap, Users, Package, Coins, Building2, Webhook, Settings, Users2, Code2, LifeBuoy } from "lucide-react";

const navItems = [
  { label: "Overview", path: "/", icon: Home },
  { label: "Products", path: "/products", icon: Package },
  { label: "Customers", path: "/customers", icon: Users },
  { label: "Events", path: "/events", icon: Zap },
  { label: "Assets", path: "/assets", icon: Coins },
  { label: "Vendors", path: "/vendors", icon: Building2 },
  { label: "Webhooks", path: "/webhooks", icon: Webhook },
];

const bottomItems = [
  { label: "Settings", path: "/settings", icon: Settings },
];

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
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={cn(
          "flex items-center py-2 px-4 font-space text-sm transition-colors",
          active
            ? "text-white font-medium"
            : "text-white/40 hover:text-white/70"
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className={cn("w-4 h-4 mr-3 shrink-0", active ? "text-white" : "text-white/40")} />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <aside className="flex h-screen w-52 flex-col border-r border-dotted border-white/[0.08] fixed bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-dotted border-white/[0.08]">
        <span className="font-space text-lg font-bold tracking-wider text-white">
          CREDYT
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map(renderNavItem)}
      </nav>

      {/* Bottom items */}
      <div className="mt-auto border-t border-dotted border-white/[0.08] pt-4">
        {bottomItems.map(renderNavItem)}
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
