import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status.toLowerCase();

  if (["active", "published", "processed", "success"].includes(s)) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 font-mono text-xs", className)}>
        <span className="flex h-4 w-4 items-center justify-center border border-green-400/60">
          <span className="text-[9px] leading-none text-green-400">✓</span>
        </span>
        <span className="text-white/60 uppercase">{status}</span>
      </span>
    );
  }

  if (["suspended", "failed", "error", "cancelled"].includes(s)) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 font-mono text-xs", className)}>
        <span className="flex h-4 w-4 items-center justify-center border border-red-400/60">
          <span className="text-[9px] leading-none text-red-400">✗</span>
        </span>
        <span className="text-white/60 uppercase">{status}</span>
      </span>
    );
  }

  // draft, pending, inactive
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono text-xs", className)}>
      <span className="text-white/30">→</span>
      <span className="text-white/60 uppercase">{status}</span>
    </span>
  );
}
