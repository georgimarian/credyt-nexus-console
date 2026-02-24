import { useState } from "react";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { CopyableId } from "@/components/terminal/CopyableId";
import { events } from "@/data/events";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function Events() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const perPage = 20;

  const eventTypes = [...new Set(events.map((e) => e.event_type))];

  const filtered = events.filter((e) => {
    if (search && !e.customer_name.toLowerCase().includes(search.toLowerCase()) && !e.id.includes(search)) return false;
    if (typeFilter && e.event_type !== typeFilter) return false;
    return true;
  });

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-space text-2xl font-bold uppercase tracking-wider mb-1">Events</h1>
        <p className="font-ibm-plex text-sm text-muted-foreground">{events.length} total events</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by customer or event ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="rounded-md border-foreground/[0.12] bg-transparent pl-10 font-ibm-plex text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
          className="rounded-md border border-foreground/[0.12] bg-transparent px-4 py-2.5 font-ibm-plex text-sm text-foreground focus:outline-none"
        >
          <option value="">All event types</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <TerminalCard title={`EVENT LOG (${filtered.length})`}>
        <Table>
          <TableHeader>
            <TableRow className="border-foreground/[0.06] hover:bg-transparent">
              <TableHead className="h-10 w-8 px-2"></TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Time</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Event</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Status</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Type</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Customer</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest text-right">Fee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((event) => (
              <>
                <TableRow
                  key={event.id}
                  className="border-foreground/[0.04] cursor-pointer transition-all duration-150 hover:bg-accent/20"
                  onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                >
                  <TableCell className="px-2 py-3">
                    {expandedId === event.id
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    }
                  </TableCell>
                  <TableCell className="px-4 py-3 font-ibm-plex text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div>
                      <CopyableId value={event.id} truncate={14} />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3"><StatusBadge status={event.status} /></TableCell>
                  <TableCell className="px-4 py-3 font-ibm-plex text-xs text-terminal-yellow">{event.event_type}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div>
                      <div className="font-ibm-plex text-xs font-medium">{event.customer_name}</div>
                      <div className="font-ibm-plex text-[10px] text-muted-foreground mt-0.5"># {event.customer_id}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-ibm-plex text-xs text-terminal-green">
                    {event.fees?.[0] && `${event.fees[0].amount.toFixed(4)} ${event.fees[0].asset_code}`}
                  </TableCell>
                </TableRow>

                {expandedId === event.id && (
                  <TableRow key={`${event.id}-detail`} className="hover:bg-transparent">
                    <TableCell colSpan={7} className="px-0 py-0">
                      <div className="bg-muted/10 px-6 py-5">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                          <div>
                            <div className="mb-2 font-space text-[10px] uppercase tracking-widest text-muted-foreground">Payload</div>
                            <pre className="overflow-auto rounded-md border border-foreground/[0.08] bg-background p-4 font-ibm-plex text-xs leading-relaxed">
                              {JSON.stringify(event.properties, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <div className="mb-2 font-space text-[10px] uppercase tracking-widest text-muted-foreground">Fees</div>
                            {event.fees && event.fees.length > 0 ? (
                              <div className="space-y-2">
                                {event.fees.map((fee, i) => (
                                  <div key={i} className="rounded-md border border-foreground/[0.08] p-4 space-y-2">
                                    <div className="font-ibm-plex text-sm font-semibold">{fee.amount.toFixed(6)} {fee.asset_code}</div>
                                    <div className="space-y-1">
                                      <CopyableId label="Product" value={fee.product_code} />
                                      <CopyableId label="Price" value={fee.price_id} />
                                    </div>
                                    {fee.dimensions && (
                                      <div className="font-ibm-plex text-xs text-muted-foreground">
                                        Dims: {JSON.stringify(fee.dimensions)}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="font-ibm-plex text-xs text-muted-foreground">No fees</p>
                            )}
                          </div>
                          <div>
                            <div className="mb-2 font-space text-[10px] uppercase tracking-widest text-muted-foreground">Costs</div>
                            {event.costs && event.costs.length > 0 ? (
                              <div className="space-y-2">
                                {event.costs.map((cost, i) => (
                                  <div key={i} className="rounded-md border border-foreground/[0.08] p-4 space-y-1">
                                    <div className="font-ibm-plex text-sm font-semibold">{cost.amount.toFixed(4)} {cost.asset_code}</div>
                                    <CopyableId label="Vendor" value={cost.vendor_id} />
                                    <div className="font-ibm-plex text-xs text-muted-foreground">{cost.vendor_name}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="font-ibm-plex text-xs text-muted-foreground">No costs</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between border-t border-foreground/[0.06] pt-4 font-ibm-plex text-xs text-muted-foreground">
            <span>Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="rounded-md border border-foreground/[0.12] px-4 py-2 transition-all duration-150 hover:bg-foreground hover:text-background disabled:opacity-30"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="rounded-md border border-foreground/[0.12] px-4 py-2 transition-all duration-150 hover:bg-foreground hover:text-background disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </TerminalCard>
    </div>
  );
}
