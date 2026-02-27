import { useState } from "react";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { webhooks } from "@/data/webhooks";

const PER_PAGE = 20;

function formatTime(ts: string) {
  const d = new Date(ts);
  const mo = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${mo} ${day} ${h}:${m}:${s}`;
}

export default function Webhooks() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(webhooks.length / PER_PAGE);
  const paged = webhooks.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-white/40 mb-6">{webhooks.length} endpoints configured</p>
        <button className="border border-dotted border-white/30 bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-wide text-white hover:bg-white/5">+ New Endpoint</button>
      </div>

      <div className="border border-dotted border-white/10">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-dotted border-white/20">
              <th className="w-[40%] px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Endpoint URL</th>
              <th className="w-[25%] px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Events</th>
              <th className="w-[10%] px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Status</th>
              <th className="w-[15%] px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Last Triggered</th>
              <th className="w-[10%] px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {paged.map((wh) => (
              <tr key={wh.id} className="border-b border-dotted border-white/10 hover:bg-white/[0.02] cursor-pointer" onClick={() => setExpandedId(expandedId === wh.id ? null : wh.id)}>
                <td className="px-4 py-4 font-mono text-sm font-light truncate">{wh.url}</td>
                <td className="px-4 py-4 font-mono text-xs text-white/60">{wh.events.join(", ")}</td>
                <td className="px-4 py-4"><StatusBadge status={wh.status} /></td>
                <td className="px-4 py-4 font-mono text-xs text-white/60">
                  {wh.deliveries[0] ? formatTime(wh.deliveries[0].delivered_at) : "—"}
                </td>
                <td className="px-4 py-4">
                  <button className="border border-dotted border-white/30 bg-transparent px-3 py-1 font-mono text-xs uppercase text-white hover:bg-white/5" onClick={(e) => e.stopPropagation()}>
                    Send Test
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-4 pt-4 mt-2 border-t border-dotted border-white/10">
          <button disabled={page === 0} onClick={() => setPage(page - 1)} className="text-xs font-mono uppercase tracking-wide text-white/40 hover:text-white cursor-pointer disabled:text-white/15 disabled:pointer-events-none">← Previous</button>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="text-xs font-mono uppercase tracking-wide text-white/40 hover:text-white cursor-pointer disabled:text-white/15 disabled:pointer-events-none">Next →</button>
        </div>
      )}

      {expandedId && (() => {
        const wh = webhooks.find(w => w.id === expandedId);
        if (!wh) return null;
        return (
          <div className="p-6 bg-white/[0.02]">
            <div className="font-mono text-xs uppercase tracking-wider text-white/40 mb-3">Subscribed Events</div>
            <div className="flex flex-wrap gap-2 mb-6">
              {wh.events.map((evt) => (
                <span key={evt} className="border border-dotted border-white/[0.08] px-3 py-1 font-mono text-xs">{evt}</span>
              ))}
            </div>
            <div className="font-mono text-xs uppercase tracking-wider text-white/40 mb-3">Recent Deliveries</div>
            <div className="border border-dotted border-white/10">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-dotted border-white/20">
                    <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Time</th>
                    <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Event</th>
                    <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Retries</th>
                  </tr>
                </thead>
                <tbody>
                  {wh.deliveries.map((del) => (
                    <tr key={del.id} className="border-b border-dotted border-white/10 hover:bg-white/[0.02]">
                      <td className="px-4 py-4 font-mono text-xs text-white/60">{formatTime(del.delivered_at)}</td>
                      <td className={`px-4 py-4 font-mono text-xs font-medium ${del.status_code < 300 ? "text-green-400" : "text-red-400"}`}>{del.status_code}</td>
                      <td className="px-4 py-4 font-mono text-xs">{del.event_type}</td>
                      <td className="px-4 py-4 font-mono text-xs">{del.retries > 0 ? <span className="text-amber-400">⚠ {del.retries}</span> : "0"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
