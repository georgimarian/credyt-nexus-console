import { useState, useMemo } from "react";
import { CopyableId } from "@/components/terminal/CopyableId";
import { EventDetailSheet } from "@/components/events/EventDetailSheet";
import { events } from "@/data/events";
import { customers } from "@/data/customers";
import { Input } from "@/components/ui/input";

function formatTimeParts(ts: string) {
  const d = new Date(ts);
  const mo = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${mo} ${day} ${h}:${m}:${s}`;
}

const MAX_TAGS = 4;

export default function Events() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const summary = useMemo(() => {
    const revenue = filtered.reduce((s, e) => s + (e.fees?.reduce((fs, f) => fs + (f.asset_code === "USD" ? f.amount : 0), 0) || 0), 0);
    const cost = filtered.reduce((s, e) => s + (e.costs?.reduce((cs, c) => cs + (c.asset_code === "USD" ? c.amount : 0), 0) || 0), 0);
    const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
    return { revenue, cost, margin };
  }, [filtered]);

  const todayCount = 12;
  const customerMap = new Map(customers.map(c => [c.id, c]));
  const selectedEvent = selectedId ? events.find(e => e.id === selectedId) : null;
  const selectedCust = selectedEvent ? customerMap.get(selectedEvent.customer_id) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-space text-2xl font-bold uppercase tracking-wider mb-2">Events</h1>
        <p className="font-space text-xs uppercase tracking-widest text-white/40">
          {events.length} Events · Today: {todayCount}
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by customer or event ID..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-64 shrink-0 border-white/[0.08] bg-transparent pl-4 font-ibm-plex text-sm"
        />
        <button
          onClick={() => { setTypeFilter(""); setPage(0); }}
          className={`border text-xs px-3 py-1 font-ibm-plex cursor-pointer ${
            typeFilter === "" ? "border-[#4ADE80] text-[#4ADE80] bg-[#4ADE80]/5" : "border-white/20 text-white/50 hover:border-white/40"
          }`}
        >
          ALL
        </button>
        {eventTypes.map((t) => (
          <button
            key={t}
            onClick={() => { setTypeFilter(typeFilter === t ? "" : t); setPage(0); }}
            className={`border text-xs px-3 py-1 font-ibm-plex cursor-pointer whitespace-nowrap ${
              typeFilter === t ? "border-[#4ADE80] text-[#4ADE80] bg-[#4ADE80]/5" : "border-white/20 text-white/50 hover:border-white/40"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-end gap-1 text-xs font-ibm-plex">
        <span className="text-white/40">revenue:</span>
        <span className="text-[#4ADE80]">${summary.revenue.toFixed(2)}</span>
        <span className="text-white/20 mx-1">·</span>
        <span className="text-white/40">cost:</span>
        <span className="text-[#F87171]">${summary.cost.toFixed(2)}</span>
        <span className="text-white/20 mx-1">·</span>
        <span className="text-white/40">margin:</span>
        <span className="text-white/60">{summary.margin.toFixed(0)}%</span>
      </div>

      {/* Event feed */}
      <div>
        {paged.map((event) => {
          const cust = customerMap.get(event.customer_id);
          const isSelected = selectedId === event.id;
          const fee = event.fees?.[0];
          const cost = event.costs?.[0];
          const dims = event.properties ? Object.entries(event.properties) : [];
          const visibleDims = dims.slice(0, MAX_TAGS);
          const hiddenCount = dims.length - MAX_TAGS;

          const isUsdFee = fee && fee.asset_code === "USD";

          return (
            <div
              key={event.id}
              onClick={() => setSelectedId(isSelected ? null : event.id)}
              className={`grid grid-cols-[180px_1fr_200px] gap-4 items-start py-5 px-4 border-b border-dotted border-white/[0.08] hover:bg-white/[0.02] cursor-pointer transition-colors ${isSelected ? "bg-white/[0.04] border-l-2 border-l-[#4ADE80]" : ""}`}
            >
              {/* Zone 1 — LEFT: timestamp + event ID */}
              <div className="shrink-0">
                <div className="font-ibm-plex text-xs text-white/40">{formatTimeParts(event.timestamp)}</div>
                <div className="font-ibm-plex text-xs text-white/20 mt-0.5">{event.id}</div>
              </div>

              {/* Zone 2 — CENTER: event type, customer, dimensions */}
              <div className="min-w-0">
                <div className="flex items-center flex-wrap">
                  <span className="font-ibm-plex text-sm font-bold text-white">{event.event_type}</span>
                  <span className="font-ibm-plex text-sm font-medium text-white ml-3">{event.customer_name}</span>
                  <span className="font-ibm-plex text-xs text-white/30 ml-2">
                    · {event.customer_id}
                    {cust?.external_id && ` · ${cust.external_id}`}
                  </span>
                </div>
                {dims.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {visibleDims.map(([k, v]) => (
                      <span key={k} className="bg-white/5 px-2 py-0.5 text-xs font-ibm-plex text-white/50">
                        {k}:{String(v)}
                      </span>
                    ))}
                    {hiddenCount > 0 && (
                      <span className="text-white/20 text-xs font-ibm-plex self-center">+{hiddenCount} more</span>
                    )}
                  </div>
                )}
              </div>

              {/* Zone 3 — RIGHT: status, revenue, cost, search icon */}
              <div className="flex items-start justify-end gap-3">
                <div className="text-right">
                  <div className="mb-1">
                    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${event.status === "processed" ? "border-[#4ADE80]" : "border-[#F87171]"}`}>
                      <span className={`text-[8px] leading-none ${event.status === "processed" ? "text-[#4ADE80]" : "text-[#F87171]"}`}>{event.status === "processed" ? "✓" : "✗"}</span>
                    </span>
                  </div>
                  {fee ? (
                    isUsdFee ? (
                      <>
                        <div className="text-[#4ADE80] font-ibm-plex font-bold text-base">${fee.amount.toFixed(fee.amount < 0.01 ? 4 : 2)}</div>
                        {cost && (
                          <div className="text-[#F87171] font-ibm-plex text-xs mt-0.5">${cost.amount.toFixed(cost.amount < 0.01 ? 4 : 2)}</div>
                        )}
                      </>
                    ) : (
                      <div className="text-white/60 font-ibm-plex font-bold text-base">{fee.amount.toLocaleString()} {fee.asset_code}</div>
                    )
                  ) : (
                    <div className="text-white/30 font-ibm-plex text-sm">—</div>
                  )}
                </div>
                <span
                  className="text-white/20 hover:text-white/60 text-sm self-center cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setSelectedId(event.id); }}
                >
                  ⌕
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-4 pt-4 mt-2 border-t border-dotted border-white/10">
          <button disabled={page === 0} onClick={() => setPage(page - 1)} className="text-xs font-mono uppercase tracking-wide text-white/40 hover:text-white cursor-pointer disabled:text-white/15 disabled:pointer-events-none">← Previous</button>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="text-xs font-mono uppercase tracking-wide text-white/40 hover:text-white cursor-pointer disabled:text-white/15 disabled:pointer-events-none">Next →</button>
        </div>
      )}

      {selectedEvent && (
        <EventDetailSheet
          event={selectedEvent}
          customerExternalId={selectedCust?.external_id}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
