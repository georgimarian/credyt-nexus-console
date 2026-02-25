import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status.toLowerCase();
  let color = "text-white/40";

  if (["active", "published", "processed", "success"].includes(s)) {
    color = "text-[#4ADE80]";
  } else if (["suspended", "failed", "error", "cancelled"].includes(s)) {
    color = "text-[#F87171]";
  } else if (["draft", "pending", "inactive"].includes(s)) {
    color = "text-white/40";
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-ibm-plex text-xs", className)}>
      <span className={color}>●</span>
      <span className="text-white/60 uppercase">{status}</span>
    </span>
  );
}