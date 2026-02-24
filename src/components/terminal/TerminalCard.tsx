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
    <div className={cn("rounded-md border border-foreground/[0.12] bg-card dark:bg-white/[0.02]", className)}>
      <div className="flex items-center justify-between border-b border-foreground/[0.08] px-6 py-3">
        <span className="font-space text-[10px] uppercase tracking-widest text-muted-foreground">
          ┌─ {title} {dashes}┐
        </span>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
