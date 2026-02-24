import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CopyableIdProps {
  /** The ID value to display and copy */
  value: string;
  /** Optional label shown before the ID */
  label?: string;
  /** Optional link href — makes the value a clickable link */
  href?: string;
  /** Truncate the displayed value to this many chars */
  truncate?: number;
  /** Size variant */
  size?: "xs" | "sm";
  className?: string;
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

  const displayed = truncate && value.length > truncate
    ? value.slice(0, truncate) + "…"
    : value;

  const textSize = size === "sm" ? "text-xs" : "text-[11px]";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "group/id inline-flex items-center gap-1.5 font-ibm-plex transition-colors",
              textSize,
              className
            )}
          >
            {label && (
              <span className="text-muted-foreground">{label}</span>
            )}
            {href ? (
              <a
                href={href}
                className="text-foreground underline decoration-foreground/20 underline-offset-2 transition-colors hover:decoration-foreground/60"
              >
                {displayed}
              </a>
            ) : (
              <span className="text-foreground/80 select-all">{displayed}</span>
            )}
            <button
              onClick={handleCopy}
              className={cn(
                "inline-flex h-5 w-5 shrink-0 items-center justify-center border border-dashed transition-all",
                copied
                  ? "border-terminal-green text-terminal-green"
                  : "border-transparent text-muted-foreground/40 opacity-0 group-hover/id:opacity-100 hover:border-foreground/20 hover:text-foreground"
              )}
              aria-label={`Copy ${value}`}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="border-dashed border-foreground/30 bg-popover font-ibm-plex text-[11px]"
        >
          {copied ? "Copied!" : `Click to copy: ${value}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
