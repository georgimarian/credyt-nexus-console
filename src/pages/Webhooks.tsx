import { useState } from "react";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { webhooks } from "@/data/webhooks";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";

export default function Webhooks() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-space text-2xl font-bold uppercase tracking-wide">$ webhooks</h1>
          <p className="font-ibm-plex text-sm text-muted-foreground">{webhooks.length} endpoints configured</p>
        </div>
        <button className="flex items-center gap-2 border border-dashed border-foreground/30 bg-foreground px-4 py-2 font-space text-xs uppercase tracking-wide text-background transition-colors hover:bg-muted-foreground">
          <Plus className="h-3.5 w-3.5" />
          New Endpoint
        </button>
      </div>

      <TerminalCard title="WEBHOOK ENDPOINTS">
        <div className="space-y-0">
          {webhooks.map((wh) => (
            <div key={wh.id}>
              <button
                onClick={() => setExpandedId(expandedId === wh.id ? null : wh.id)}
                className="flex w-full items-center gap-3 border-b border-dashed border-foreground/10 py-3 font-ibm-plex text-sm text-left transition-colors hover:bg-accent/50"
              >
                {expandedId === wh.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <StatusBadge status={wh.status} />
                <span className="flex-1 truncate text-xs">{wh.url}</span>
                <span className="text-xs text-muted-foreground">{wh.events.length} events</span>
              </button>

              {expandedId === wh.id && (
                <div className="border-b border-dashed border-foreground/10 bg-muted/30 p-4 space-y-3">
                  <div>
                    <div className="mb-1 font-space text-xs uppercase text-muted-foreground">Subscribed Events</div>
                    <div className="flex flex-wrap gap-2">
                      {wh.events.map((evt) => (
                        <span key={evt} className="border border-dashed border-foreground/30 px-2 py-0.5 font-ibm-plex text-xs">
                          {evt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 font-space text-xs uppercase text-muted-foreground">Recent Deliveries</div>
                    <div className="space-y-0.5">
                      {wh.deliveries.map((del) => (
                        <div key={del.id} className="flex items-center gap-3 font-ibm-plex text-xs">
                          <span className="w-32 text-muted-foreground">
                            {new Date(del.delivered_at).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
                          </span>
                          <span className={del.status_code < 300 ? "text-terminal-green" : "text-terminal-red"}>
                            {del.status_code}
                          </span>
                          <span className="text-terminal-yellow">{del.event_type}</span>
                          {del.retries > 0 && (
                            <span className="text-terminal-yellow">⚠ {del.retries} retries</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </TerminalCard>
    </div>
  );
}
