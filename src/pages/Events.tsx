import { useState } from "react";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { events } from "@/data/events";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronRight } from "lucide-react";

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
    <div className="space-y-6">
      <div>
        <h1 className="font-space text-2xl font-bold uppercase tracking-wide">$ events</h1>
        <p className="font-ibm-plex text-sm text-muted-foreground">{events.length} total events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="search by customer or event id..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="border-dashed border-foreground/30 bg-transparent pl-10 font-ibm-plex text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
          className="border border-dashed border-foreground/30 bg-transparent px-3 py-2 font-ibm-plex text-sm text-foreground focus:outline-none"
        >
          <option value="">all event types</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <TerminalCard title={`EVENT LOG (${filtered.length})`}>
        <div className="space-y-0">
          {paged.map((event) => (
            <div key={event.id}>
              <button
                onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                className="flex w-full items-center gap-2 border-b border-dashed border-foreground/10 py-2 font-ibm-plex text-xs text-left transition-colors hover:bg-accent/50"
              >
                {expandedId === event.id ? <ChevronDown className="h-3 w-3 flex-shrink-0" /> : <ChevronRight className="h-3 w-3 flex-shrink-0" />}
                <span className="w-32 text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
                <span className="w-20 text-muted-foreground">{event.id}</span>
                <StatusBadge status={event.status} />
                <span className="text-terminal-yellow">{event.event_type}</span>
                <span className="text-muted-foreground">{event.customer_name}</span>
                <span className="ml-auto text-terminal-green">
                  {event.fees?.[0] && `${event.fees[0].amount.toFixed(4)} ${event.fees[0].asset_code}`}
                </span>
              </button>

              {expandedId === event.id && (
                <div className="border-b border-dashed border-foreground/10 bg-muted/30 p-4">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Payload */}
                    <div>
                      <div className="mb-1 font-space text-xs uppercase text-muted-foreground">Payload</div>
                      <pre className="overflow-auto rounded-none border border-dashed border-foreground/15 bg-background p-3 font-ibm-plex text-xs">
                        {JSON.stringify(event.properties, null, 2)}
                      </pre>
                    </div>

                    {/* Fees */}
                    <div>
                      <div className="mb-1 font-space text-xs uppercase text-muted-foreground">Fees</div>
                      {event.fees && event.fees.length > 0 ? (
                        <div className="space-y-1">
                          {event.fees.map((fee, i) => (
                            <div key={i} className="border border-dashed border-foreground/15 p-2 font-ibm-plex text-xs">
                              <div className="font-bold">{fee.amount.toFixed(6)} {fee.asset_code}</div>
                              <div className="text-muted-foreground">product: {fee.product_code}</div>
                              <div className="text-muted-foreground">price: {fee.price_id}</div>
                              {fee.dimensions && <div className="text-muted-foreground">dims: {JSON.stringify(fee.dimensions)}</div>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">no fees</p>
                      )}
                    </div>

                    {/* Costs */}
                    <div>
                      <div className="mb-1 font-space text-xs uppercase text-muted-foreground">Costs</div>
                      {event.costs && event.costs.length > 0 ? (
                        <div className="space-y-1">
                          {event.costs.map((cost, i) => (
                            <div key={i} className="border border-dashed border-foreground/15 p-2 font-ibm-plex text-xs">
                              <div className="font-bold">{cost.amount.toFixed(4)} {cost.asset_code}</div>
                              <div className="text-muted-foreground">vendor: {cost.vendor_name}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">no costs</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between font-ibm-plex text-xs text-muted-foreground">
            <span>page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="border border-dashed border-foreground/30 px-3 py-1 transition-colors hover:bg-foreground hover:text-background disabled:opacity-30"
              >
                prev
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="border border-dashed border-foreground/30 px-3 py-1 transition-colors hover:bg-foreground hover:text-background disabled:opacity-30"
              >
                next
              </button>
            </div>
          </div>
        )}
      </TerminalCard>
    </div>
  );
}
