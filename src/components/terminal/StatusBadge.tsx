import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status.toLowerCase();
  let borderColor = "border-white/30";
  let textColor = "text-white/40";
  let symbol = "–";

  if (["active", "published", "processed", "success"].includes(s)) {
    borderColor = "border-[#4ADE80]";
    textColor = "text-[#4ADE80]";
    symbol = "✓";
  } else if (["suspended", "failed", "error", "cancelled"].includes(s)) {
    borderColor = "border-[#F87171]";
    textColor = "text-[#F87171]";
    symbol = "✗";
  } else if (["draft", "pending", "inactive"].includes(s)) {
    borderColor = "border-white/30";
    textColor = "text-white/40";
    symbol = "–";
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-ibm-plex text-xs", className)}>
      <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border", borderColor)}>
        <span className={cn("text-[8px] leading-none", textColor)}>{symbol}</span>
      </span>
      <span className="text-white/60 uppercase">{status}</span>
    </span>
  );
}
