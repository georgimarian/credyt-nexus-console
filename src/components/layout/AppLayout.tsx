import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

const pageTitles: Record<string, string> = {
  "/": "Overview",
  "/products": "Products",
  "/customers": "Customers",
  "/events": "Events",
  "/assets": "Assets",
  "/vendors": "Vendors",
  "/webhooks": "Webhooks",
  "/settings": "Settings",
};

export function AppLayout() {
  const location = useLocation();
  const pageTitle = Object.entries(pageTitles).find(([path]) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)
  )?.[1] || "Dashboard";

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar collapsed={false} onToggle={() => {}} />
      <div className="flex-1 ml-52 flex flex-col">
        {/* Sandbox Banner — absolute top */}
        <div className="flex items-center gap-2 px-10 py-2 font-space text-xs shrink-0" style={{ backgroundColor: "#FACC15", color: "#000" }}>
          ⚠ YOU'RE VIEWING DEMO DATA — Changes made here will not affect any live account
        </div>

        {/* Top Bar */}
        <header className="h-12 border-b border-white/[0.08] flex items-center justify-between px-10 shrink-0" style={{ backgroundColor: "#0C0D10" }}>
          <span className="font-space text-xs uppercase tracking-widest text-white/40">{pageTitle}</span>
          <div className="flex items-center gap-3">
            <span className="text-white/30 cursor-pointer">☽</span>
            <span className="font-space text-sm text-white/60">John Doe</span>
            <div className="flex h-7 w-7 items-center justify-center bg-white/10 font-space text-xs text-white">
              JD
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto px-10 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}