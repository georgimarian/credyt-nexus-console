import { useState } from "react";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { webhooks } from "@/data/webhooks";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function Webhooks() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-space text-2xl font-bold uppercase tracking-wider mb-1">Webhooks</h1>
          <p className="font-ibm-plex text-sm text-muted-foreground">{webhooks.length} endpoints configured</p>
        </div>
        <button className="rounded-none bg-foreground px-4 py-2.5 font-space text-xs uppercase tracking-wide text-background transition-all duration-150 hover:bg-foreground/80">
          + New Endpoint
        </button>
      </div>

      <TerminalCard title="WEBHOOK ENDPOINTS">
        <Table>
          <TableHeader>
            <TableRow className="border-foreground/[0.06] hover:bg-transparent">
              <TableHead className="h-10 w-8 px-2"></TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Endpoint</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">URL</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Status</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest text-center">Events</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhooks.map((wh) => (
              <>
                <TableRow
                  key={wh.id}
                  className="border-foreground/[0.04] cursor-pointer transition-all duration-150 hover:bg-accent/20"
                  onClick={() => setExpandedId(expandedId === wh.id ? null : wh.id)}
                >
                  <TableCell className="px-2 py-4">
                    {expandedId === wh.id
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    }
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="font-ibm-plex text-sm font-medium truncate max-w-[200px]">{wh.url.replace(/https?:\/\//, "")}</div>
                      <div className="font-ibm-plex text-[10px] text-muted-foreground"># {wh.id}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 font-ibm-plex text-xs truncate max-w-[300px] text-muted-foreground">{wh.url}</TableCell>
                  <TableCell className="px-4 py-4"><StatusBadge status={wh.status} /></TableCell>
                  <TableCell className="px-4 py-4 text-center font-ibm-plex text-sm">{wh.events.length}</TableCell>
                </TableRow>

                {expandedId === wh.id && (
                  <TableRow key={`${wh.id}-detail`} className="hover:bg-transparent">
                    <TableCell colSpan={5} className="px-0 py-0">
                      <div className="bg-muted/10 px-6 py-5 space-y-5">
                        <div>
                          <div className="mb-2 font-space text-[10px] uppercase tracking-widest text-muted-foreground">Subscribed Events</div>
                          <div className="flex flex-wrap gap-2">
                            {wh.events.map((evt) => (
                              <span key={evt} className="border border-foreground/[0.08] px-3 py-1 font-ibm-plex text-xs">
                                {evt}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 font-space text-[10px] uppercase tracking-widest text-muted-foreground">Recent Deliveries</div>
                          <Table>
                            <TableHeader>
                              <TableRow className="border-foreground/[0.06] hover:bg-transparent">
                                <TableHead className="h-8 px-3 font-space text-[10px] uppercase tracking-wide">Time</TableHead>
                                <TableHead className="h-8 px-3 font-space text-[10px] uppercase tracking-wide">Status</TableHead>
                                <TableHead className="h-8 px-3 font-space text-[10px] uppercase tracking-wide">Event</TableHead>
                                <TableHead className="h-8 px-3 font-space text-[10px] uppercase tracking-wide">Retries</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {wh.deliveries.map((del) => (
                                <TableRow key={del.id} className="border-foreground/[0.04] transition-all duration-150 hover:bg-accent/20">
                                  <TableCell className="px-3 py-4 font-ibm-plex text-xs text-muted-foreground">
                                    {new Date(del.delivered_at).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
                                  </TableCell>
                                  <TableCell className={`px-3 py-4 font-ibm-plex text-xs font-semibold ${del.status_code < 300 ? "text-terminal-green" : "text-terminal-red"}`}>
                                    {del.status_code}
                                  </TableCell>
                                  <TableCell className="px-3 py-4 font-ibm-plex text-xs">{del.event_type}</TableCell>
                                  <TableCell className="px-3 py-4 font-ibm-plex text-xs">
                                    {del.retries > 0 ? <span className="text-terminal-yellow">⚠ {del.retries}</span> : "0"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </TerminalCard>
    </div>
  );
}
