import { cn } from "@/lib/utils";

type Status = "active" | "published" | "processed" | "success" |
              "inactive" | "archived" | "cancelled" | "failed" | "error" |
              "pending" | "draft" | "warning";

const statusConfig: Record<string, { symbol: string; color: string }> = {
  active: { symbol: "▇", color: "text-terminal-green" },
  published: { symbol: "▇", color: "text-terminal-green" },
  processed: { symbol: "✓", color: "text-terminal-green" },
  success: { symbol: "✓", color: "text-terminal-green" },
  inactive: { symbol: "░", color: "text-muted-foreground" },
  archived: { symbol: "░", color: "text-muted-foreground" },
  cancelled: { symbol: "✗", color: "text-terminal-red" },
  failed: { symbol: "✗", color: "text-terminal-red" },
  error: { symbol: "✗", color: "text-terminal-red" },
  suspended: { symbol: "✗", color: "text-terminal-red" },
  pending: { symbol: "→", color: "text-terminal-yellow" },
  draft: { symbol: "→", color: "text-terminal-yellow" },
  warning: { symbol: "⚠", color: "text-terminal-yellow" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { symbol: "?", color: "text-muted-foreground" };

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-ibm-plex text-xs uppercase tracking-wide", config.color, className)}>
      <span>{config.symbol}</span>
      <span>{status}</span>
    </span>
  );
}
