import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", path: "/" },
  { label: "Products", path: "/products" },
  { label: "Customers", path: "/customers" },
  { label: "Events", path: "/events" },
  { label: "Assets", path: "/assets" },
  { label: "Vendors", path: "/vendors" },
  { label: "Webhooks", path: "/webhooks" },
];

const bottomItems = [
  { label: "Settings", path: "/settings" },
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
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={cn(
          "block py-2 px-4 font-space text-sm transition-colors",
          active
            ? "text-white font-medium"
            : "text-white/40 hover:text-white/70"
        )}
        title={collapsed ? item.label : undefined}
      >
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <aside className="flex h-screen w-52 flex-col border-r border-white/[0.08] fixed" style={{ backgroundColor: "#0A0B0E" }}>
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

      {/* Bottom items */}
      <div className="mt-auto border-t border-white/[0.08] pt-4">
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
