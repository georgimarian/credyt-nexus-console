import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FieldLabelProps {
  label: string;
  tooltip?: string;
  required?: boolean;
}

export function FieldLabel({ label, tooltip, required }: FieldLabelProps) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <label className="font-space text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-terminal-red">*</span>}
      </label>
      {tooltip && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/50 transition-colors hover:text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-[280px] border-dashed border-foreground/30 bg-popover font-ibm-plex text-xs leading-relaxed"
            >
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
