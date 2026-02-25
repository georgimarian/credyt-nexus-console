import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TerminalCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function TerminalCard({ title, children, className, actions }: TerminalCardProps) {
  return (
    <div className={cn("", className)}>
      <div className="flex items-center justify-between py-3">
        <span className="font-space text-xs uppercase tracking-wider text-white/40 border-b border-dashed border-white/15 pb-3 w-full">
          -- {title} ----------------------------------------
        </span>
        {actions && <div className="flex items-center gap-2 shrink-0 ml-4">{actions}</div>}
      </div>
      <div className="py-4">{children}</div>
    </div>
  );
}