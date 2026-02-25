import { useState } from "react";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { CopyableId } from "@/components/terminal/CopyableId";
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

function EventDetailPanel({ event, cust }: { event: typeof events[0]; cust: any }) {
  const [showRaw, setShowRaw] = useState(false);
  const fee = event.fees?.[0];
  const dims = event.properties ? Object.entries(event.properties) : [];

  return (
    <div className="bg-[#0F0F0F] border-l-2 border-white/20 mx-4 mb-2 p-5">
      <div className="font-space text-xs text-white/40 mb-4">┌─ EVENT DETAILS ──────────────────────────────────────┐</div>

      {/* Header row */}
      <div className="flex items-center gap-4 mb-4">
        <span className="font-ibm-plex text-sm font-medium">{event.id}</span>
        <span className="font-ibm-plex text-xs text-white/40">{formatTimeParts(event.timestamp)}</span>
        <StatusBadge status={event.status} />
      </div>

      {/* Field rows */}
      <div className="space-y-0">
        <div className="flex gap-4 py-1.5">
          <span className="font-space text-xs text-white/40 w-28 shrink-0 uppercase tracking-wider">Customer</span>
          <span className="font-ibm-plex text-sm text-white">{event.customer_name} · {event.customer_id}{cust?.external_id ? ` · ${cust.external_id}` : ""}</span>
        </div>
        <div className="flex gap-4 py-1.5">
          <span className="font-space text-xs text-white/40 w-28 shrink-0 uppercase tracking-wider">Event Type</span>
          <span className="font-ibm-plex text-sm text-white">{event.event_type}</span>
        </div>
        <div className="flex gap-4 py-1.5">
          <span className="font-space text-xs text-white/40 w-28 shrink-0 uppercase tracking-wider">Fee</span>
          <span className="font-ibm-plex text-sm text-[#4ADE80]">{fee ? `$${fee.amount.toFixed(4)} ${fee.asset_code}` : "—"}</span>
        </div>
      </div>

      {/* Dimensions */}
      {dims.length > 0 && (
        <div className="mt-4">
          <span className="font-space text-xs text-white/40 uppercase tracking-wider">Dimensions</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {dims.map(([k, v]) => (
              <span key={k} className="bg-white/5 px-2 py-0.5 text-xs font-ibm-plex text-white/60">
                {k}:{String(v)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Raw Payload */}
      <div className="mt-4">
        <span className="font-space text-xs text-white/40 uppercase tracking-wider">Raw Payload</span>
        <button
          onClick={(e) => { e.stopPropagation(); setShowRaw(!showRaw); }}
          className="ml-3 font-ibm-plex text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          {showRaw ? "− hide raw" : "+ show raw"}
        </button>
        {showRaw && (
          <div className="bg-white/5 p-4 mt-2 font-ibm-plex text-xs text-white/50">
            <pre className="whitespace-pre-wrap">{JSON.stringify({
              id: event.id,
              event_type: event.event_type,
              customer_id: event.customer_id,
              timestamp: formatTimeParts(event.timestamp),
              dimensions: event.properties,
              fee: fee ? { amount: fee.amount, asset: fee.asset_code } : null,
              status: event.status,
            }, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

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

  const totalBilled = events.reduce((s, e) => s + (e.fees?.reduce((fs, f) => fs + (f.asset_code === "USD" ? f.amount : 0), 0) || 0), 0);
  const todayCount = 12;

  const customerMap = new Map(customers.map(c => [c.id, c]));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-space text-2xl font-bold uppercase tracking-wider mb-2">Events</h1>
        <p className="font-space text-xs uppercase tracking-widest text-white/40">
          {events.length} Events · ${totalBilled.toFixed(2)} Billed · Today: {todayCount}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by customer or event ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="border-white/[0.08] bg-transparent pl-4 font-ibm-plex text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
          className="border border-white/[0.08] bg-transparent px-4 py-2 font-ibm-plex text-sm text-white focus:outline-none"
          style={{ backgroundColor: "#0C0D10" }}
        >
          <option value="">All event types</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Card-feed layout */}
      <div>
        {paged.map((event) => {
          const cust = customerMap.get(event.customer_id);
          const isExpanded = expandedId === event.id;
          const fee = event.fees?.[0];
          const dims = event.properties ? Object.entries(event.properties) : [];

          return (
            <div key={event.id}>
              <div
                onClick={() => setExpandedId(isExpanded ? null : event.id)}
                className={`border-b border-white/[0.06] py-4 px-4 hover:bg-white/[0.02] cursor-pointer transition-colors ${isExpanded ? "border-l-2 border-l-white/20" : ""}`}
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
                    <span className="font-ibm-plex text-sm text-[#4ADE80] w-20 text-right">
                      {fee ? `$${fee.amount.toFixed(2)}` : "—"}
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

              {/* Expanded detail panel */}
              {isExpanded && <EventDetailPanel event={event} cust={cust} />}
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
    </div>
  );
}
