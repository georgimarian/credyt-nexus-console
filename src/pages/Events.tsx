import { useState, useMemo } from "react";
import { StatusBadge } from "@/components/terminal/StatusBadge";
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

  // Summary calculations based on filtered events
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

      {/* Card-feed layout */}
      <div>
        {paged.map((event) => {
          const cust = customerMap.get(event.customer_id);
          const isSelected = selectedId === event.id;
          const fee = event.fees?.[0];
          const cost = event.costs?.[0];
          const dims = event.properties ? Object.entries(event.properties) : [];

          return (
            <div
              key={event.id}
              onClick={() => setSelectedId(isSelected ? null : event.id)}
              className={`border-b border-white/[0.06] py-4 px-4 hover:bg-white/[0.02] cursor-pointer transition-colors ${isSelected ? "bg-white/[0.04] border-l-2 border-l-[#4ADE80]" : ""}`}
            >
              {/* Line 1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="font-ibm-plex text-xs text-white/40 w-36 shrink-0">{formatTimeParts(event.timestamp)}</span>
                  <span className="font-ibm-plex text-sm font-medium ml-4 w-36 shrink-0">{event.event_type}</span>
                  <span className="font-ibm-plex text-sm font-medium ml-4">{event.customer_name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={event.status} />
                  <span className="font-ibm-plex text-sm w-28 text-right">
                    {fee ? (
                      <>
                        <span className="text-[#4ADE80]">${fee.amount.toFixed(fee.amount < 0.01 ? 4 : 2)}</span>
                        {cost && (
                          <>
                            <span className="text-white/20 mx-1">·</span>
                            <span className="text-[#F87171] text-xs">cost ${cost.amount.toFixed(cost.amount < 0.01 ? 4 : 2)}</span>
                          </>
                        )}
                      </>
                    ) : "—"}
                  </span>
                  <span className="text-white/40 text-sm">→</span>
                </div>
              </div>

              {/* Line 2 */}
              <div className="flex items-center mt-1 ml-0 sm:ml-36 text-xs text-white/30 font-ibm-plex gap-1">
                <CopyableId value={event.id} />
                <span>·</span>
                <span>{event.customer_id}</span>
                {cust?.external_id && (
                  <>
                    <span>·</span>
                    <span>{cust.external_id}</span>
                  </>
                )}
              </div>

              {/* Line 3 — dimensions */}
              {dims.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1.5 ml-0 sm:ml-36">
                  {dims.map(([k, v]) => (
                    <span key={k} className="bg-white/5 px-2 py-0.5 text-xs font-ibm-plex text-white/50">
                      {k}:{String(v)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-4 font-ibm-plex text-xs text-white/40">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5 disabled:opacity-30">Prev</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5 disabled:opacity-30">Next</button>
          </div>
        </div>
      )}

      {/* Detail sheet */}
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
