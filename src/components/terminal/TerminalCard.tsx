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
    <div className={cn("border border-dashed border-foreground/30 bg-card", className)}>
      <div className="flex items-center justify-between border-b border-dashed border-foreground/30 px-4 py-2">
        <span className="font-space text-xs uppercase tracking-widest text-muted-foreground">
          ┌─ {title} {dashes}┐
        </span>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
