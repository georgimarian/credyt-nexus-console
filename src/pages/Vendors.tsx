import { useState } from "react";
import { CopyableId } from "@/components/terminal/CopyableId";
import { vendors } from "@/data/vendors";
import { events } from "@/data/events";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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

const costByVendor = vendors.map((v) => ({ name: v.name, costs: v.total_costs }));

export default function Vendors() {
  const [page, setPage] = useState(0);

  const vendorCosts = events.flatMap((e) =>
    (e.costs || []).map((c) => ({ event_type: e.event_type, customer_name: e.customer_name, timestamp: e.timestamp, ...c }))
  );

  const totalPages = Math.ceil(vendorCosts.length / PER_PAGE);
  const pagedCosts = vendorCosts.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-space text-2xl font-bold uppercase tracking-wider mb-1">Vendors</h1>
          <p className="font-ibm-plex text-sm text-white/40">{vendors.length} vendors configured</p>
        </div>
        <button className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5">+ New Vendor</button>
      </div>

      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-dashed border-white/20">
            <th className="w-[35%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Vendor</th>
            <th className="w-[25%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Code</th>
            <th className="w-[15%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Status</th>
            <th className="w-[15%] px-4 pb-3 text-right font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Costs</th>
            <th className="w-[10%] px-4 pb-3"></th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v) => (
            <tr key={v.id} className="border-b border-dotted border-white/[0.08] hover:bg-white/[0.02]">
              <td className="px-4 py-4">
                <div className="font-ibm-plex text-sm font-medium">{v.name}</div>
                <div className="font-ibm-plex text-xs text-white/40 mt-1">{v.id}</div>
              </td>
              <td className="px-4 py-4"><CopyableId value={v.external_id} /></td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center gap-1.5 font-ibm-plex text-xs">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#4ADE80]">
                    <span className="text-[8px] leading-none text-[#4ADE80]">✓</span>
                  </span>
                  <span className="text-white/60 uppercase">active</span>
                </span>
              </td>
              <td className="px-4 py-4 text-right font-ibm-plex text-sm text-[#F87171]">${v.total_costs.toFixed(2)}</td>
              <td className="px-4 py-4 text-right text-white/40 text-sm">→</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <div className="font-space text-xs uppercase tracking-wider text-white/40 border-b border-dashed border-white/20 pb-3 mb-4">┌─ COSTS BY VENDOR ────────────────────┐</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={costByVendor} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono", fill: "rgba(255,255,255,0.3)" }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: "IBM Plex Mono", fill: "rgba(255,255,255,0.5)" }} width={80} />
            <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12, background: "#0F0F0F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0 }} />
            <Bar dataKey="costs" fill="#F87171" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div className="font-space text-xs uppercase tracking-wider text-white/40 border-b border-dashed border-white/20 pb-3 mb-4">┌─ RECENT COSTS ───────────────────────┐</div>
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-dashed border-white/20">
              <th className="px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Time</th>
              <th className="px-4 pb-3 text-right font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Amount</th>
              <th className="px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Vendor</th>
              <th className="px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Event Type</th>
              <th className="px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Customer</th>
            </tr>
          </thead>
          <tbody>
            {pagedCosts.map((c, i) => (
              <tr key={i} className="border-b border-dotted border-white/[0.08] hover:bg-white/[0.02]">
                <td className="px-4 py-4 font-ibm-plex text-xs text-white/60">{formatTime(c.timestamp)}</td>
                <td className="px-4 py-4 text-right font-ibm-plex text-sm text-[#F87171]">${c.amount.toFixed(4)}</td>
                <td className="px-4 py-4 font-ibm-plex text-xs">{c.vendor_name}</td>
                <td className="px-4 py-4 font-ibm-plex text-xs">{c.event_type}</td>
                <td className="px-4 py-4 font-ibm-plex text-xs text-white/60">{c.customer_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex justify-end items-center gap-4 pt-4 mt-2 border-t border-dotted border-white/10">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="text-xs font-mono uppercase tracking-wide text-white/40 hover:text-white cursor-pointer disabled:text-white/15 disabled:pointer-events-none">← Previous</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="text-xs font-mono uppercase tracking-wide text-white/40 hover:text-white cursor-pointer disabled:text-white/15 disabled:pointer-events-none">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
