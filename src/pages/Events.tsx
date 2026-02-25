import { useState } from "react";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { CopyableId } from "@/components/terminal/CopyableId";
import { events } from "@/data/events";
import { Input } from "@/components/ui/input";

function formatTime(ts: string) {
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

      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-dashed border-white/15">
            <th className="w-[16%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Timestamp</th>
            <th className="w-[14%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Event Type</th>
            <th className="w-[16%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Event ID</th>
            <th className="w-[18%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Customer</th>
            <th className="w-[16%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Ext Customer ID</th>
            <th className="w-[5%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Status</th>
            <th className="w-[8%] px-4 pb-3 text-right font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Fee</th>
            <th className="w-[7%] px-4 pb-3"></th>
          </tr>
        </thead>
        <tbody>
          {paged.map((event) => (
            <tr key={event.id} className="border-b border-white/[0.06] hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}>
              <td className="px-4 py-4 font-ibm-plex text-sm font-light text-white/60">{formatTime(event.timestamp)}</td>
              <td className="px-4 py-4 font-ibm-plex text-sm font-light">{event.event_type}</td>
              <td className="px-4 py-4"><CopyableId value={event.id} /></td>
              <td className="px-4 py-4">
                <div className="font-ibm-plex text-sm font-medium">{event.customer_name}</div>
                <div className="font-ibm-plex text-xs text-white/40 mt-1">{event.customer_id}</div>
              </td>
              <td className="px-4 py-4 font-ibm-plex text-xs text-white/40">{/* ext id from customer data */}—</td>
              <td className="px-4 py-4"><StatusBadge status={event.status} /></td>
              <td className="px-4 py-4 text-right font-ibm-plex text-sm font-light text-[#4ADE80]">
                {event.fees?.[0] && `$${event.fees[0].amount.toFixed(4)}`}
              </td>
              <td className="px-4 py-4 text-right text-white/40 text-sm">→</td>
            </tr>
          ))}
        </tbody>
      </table>

      {expandedId && (() => {
        const event = events.find(e => e.id === expandedId);
        if (!event) return null;
        return (
          <div className="p-4 font-ibm-plex text-xs" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
            <pre className="whitespace-pre-wrap">{JSON.stringify(event.properties, null, 2)}</pre>
          </div>
        );
      })()}

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