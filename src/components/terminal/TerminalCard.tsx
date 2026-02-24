import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TerminalCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function TerminalCard({ title, children, className, actions }: TerminalCardProps) {
  const dashCount = Math.max(1, 30 - title.length);
  const dashes = "─".repeat(dashCount);

  return (
    <div className={cn("", className)}>
      <div className="flex items-center justify-between px-0 py-3">
        <span className="font-space text-[10px] uppercase tracking-widest text-muted-foreground">
          ┌─ {title} {dashes}┐
        </span>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="py-6">{children}</div>
    </div>
  );
}
