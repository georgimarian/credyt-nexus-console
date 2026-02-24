import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { label: "Overview", path: "/" },
  { label: "Products", path: "/products" },
  { label: "Customers", path: "/customers" },
  { label: "Events", path: "/events" },
  { label: "Assets", path: "/assets" },
  { label: "Vendors", path: "/vendors" },
  { label: "Webhooks", path: "/webhooks" },
  { label: "Settings", path: "/settings" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-foreground/[0.08] bg-sidebar transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-foreground/[0.06] px-3">
        {!collapsed && (
          <span className="font-doto text-lg font-semibold tracking-wider text-foreground">
            CREDYT
          </span>
        )}
        <button
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center font-space text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 font-space text-xs uppercase tracking-wide transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              {!collapsed && (
                <span>
                  <span className="mr-1 text-muted-foreground group-hover:text-current">▸</span>
                  {item.label}
                </span>
              )}
              {collapsed && <span className="text-[10px]">{item.label.charAt(0)}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-foreground/[0.06] p-3">
        <ThemeToggle />
      </div>
    </aside>
  );
}
