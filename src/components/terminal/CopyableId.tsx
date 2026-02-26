import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CopyableIdProps {
  value: string;
  label?: string;
  href?: string;
  truncate?: number;
  size?: "xs" | "sm";
  className?: string;
}

function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return id.slice(0, 6) + "..." + id.slice(-4);
}

export function CopyableId({ value, label, href, truncate, size = "xs", className }: CopyableIdProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  const displayed = truncateId(value);
  const textSize = size === "sm" ? "text-xs" : "text-[11px]";

  return (
    <span
      className={cn(
        "group/id inline-flex items-center gap-1.5 font-ibm-plex transition-colors",
        textSize,
        className
      )}
    >
      {label && <span className="text-white/40">{label}</span>}
      {href ? (
        <a href={href} className="text-white/80 hover:text-white">{displayed}</a>
      ) : (
        <span className="text-white/80 select-all">{displayed}</span>
      )}
      <button
        onClick={handleCopy}
        className={cn(
          "inline-flex items-center justify-center text-xs transition-all cursor-pointer",
          copied
            ? "text-[#4ADE80]"
            : "text-white/25 hover:text-white/70"
        )}
        aria-label={`Copy ${value}`}
      >
        {copied ? "✓" : "❐"}
      </button>
    </span>
  );
}
