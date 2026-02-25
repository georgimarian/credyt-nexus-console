import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { CopyableId } from "@/components/terminal/CopyableId";
import { customers } from "@/data/customers";
import { events } from "@/data/events";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { toast } from "@/hooks/use-toast";

function formatTime(ts: string) {
  const d = new Date(ts);
  const mo = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${mo} ${day} ${h}:${m}:${s}`;
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const customer = customers.find((c) => c.id === id);
  const [chartRange, setChartRange] = useState<"7" | "30" | "90">("30");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [showTopups, setShowTopups] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [visibleEvents, setVisibleEvents] = useState(10);

  if (!customer) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-ibm-plex text-white/40">Customer not found</p>
      </div>
    );
  }

  const customerEvents = events.filter((e) => e.customer_id === customer.id);
  const topups = customer.wallet.transactions.filter((t) => t.type === "top_up");
  const charges = customer.wallet.transactions.filter((t) => t.type === "charge");
  const primaryAccount = customer.wallet.accounts[0];
  const balance = primaryAccount ? primaryAccount.available + primaryAccount.pending_out : 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthCharges = charges.filter((t) => new Date(t.created_at) >= monthStart);
  const totalSpend = monthCharges.reduce((s, t) => s + Math.abs(t.amount), 0);
  const monthTopups = topups.filter((t) => new Date(t.created_at) >= monthStart);
  const daysElapsed = Math.max(1, Math.ceil((now.getTime() - monthStart.getTime()) / 86400000));
  const avgDaily = totalSpend / daysElapsed;
  const runway = avgDaily > 0 ? Math.round((primaryAccount?.available || 0) / avgDaily) : Infinity;

  const chartDays = parseInt(chartRange);
  const chartData = Array.from({ length: chartDays }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (chartDays - 1 - i));
    const dayStr = date.toISOString().split("T")[0];
    const spend = charges.filter((t) => t.created_at.startsWith(dayStr)).reduce((s, t) => s + Math.abs(t.amount), 0);
    return { day: `${date.getMonth() + 1}/${date.getDate()}`, spend: +spend.toFixed(2) };
  });

  const metadataEntries = customer.metadata ? Object.entries(customer.metadata) : [];

  const handleTopup = () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) return;
    toast({ title: "✓ Top-up processed", description: `$${amount.toFixed(2)} added to wallet.` });
    setShowTopupModal(false);
    setTopupAmount("");
  };

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav className="font-ibm-plex text-xs text-white/40">
        <Link to="/customers" className="hover:text-white">CUSTOMERS</Link>
        <span className="mx-2">{">"}</span>
        <span className="text-white">{customer.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-space text-2xl font-bold tracking-wider">{customer.name}</h1>
            <StatusBadge status={customer.status} />
          </div>
          <div className="mt-1 font-ibm-plex text-xs text-white/40">{customer.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5">Edit</button>
          <button onClick={() => setShowTopupModal(true)} className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90">Top Up Wallet</button>
          <button className="border border-[#F87171]/30 text-[#F87171] bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-[#F87171]/5">Suspend</button>
        </div>
      </div>

      {/* 40/60 Layout */}
      <div className="grid grid-cols-5 gap-10">
        {/* Left 40% */}
        <div className="col-span-2 space-y-0">
          {/* WALLET */}
          <div className="font-space text-xs uppercase tracking-wider text-white/40 mb-3">WALLET</div>
          {[
            { label: "Balance", value: `$${balance.toFixed(2)}` },
            { label: "Available", value: `$${(primaryAccount?.available || 0).toFixed(2)}` },
            { label: "Pending", value: `$${(primaryAccount?.pending_in || 0).toFixed(2)}` },
            { label: "Reserved", value: `$${(primaryAccount?.pending_out || 0).toFixed(2)}` },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between font-ibm-plex text-sm py-2 border-b border-white/[0.06]">
              <span className="text-white/40">{row.label}</span>
              <span>{row.value}</span>
            </div>
          ))}
          <div className="py-2 border-b border-white/[0.06]">
            <div className="flex items-center justify-between font-ibm-plex text-sm">
              <span className="text-white/40">Auto Top-up</span>
              <span className={customer.auto_topup?.enabled ? "text-[#4ADE80]" : "text-white/40"}>
                {customer.auto_topup?.enabled ? "ENABLED" : "OFF"}
              </span>
            </div>
            {customer.auto_topup?.enabled && (
              <div className="mt-1 space-y-1">
                <div className="flex justify-between font-ibm-plex text-xs text-white/40">
                  <span>Threshold</span><span>below ${customer.auto_topup.threshold.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-ibm-plex text-xs text-white/40">
                  <span>Top-up Amount</span><span>+${customer.auto_topup.amount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div className="font-space text-xs uppercase tracking-wider text-white/40 mt-8 mb-3">DETAILS</div>
          {[
            { label: "External ID", value: customer.external_id },
            { label: "Email", value: customer.email },
            { label: "Currency", value: primaryAccount?.asset_code || "USD" },
            { label: "Created", value: formatTime(customer.created_at) },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between font-ibm-plex text-sm py-2 border-b border-white/[0.06]">
              <span className="text-white/40">{row.label}</span>
              <span>{row.value}</span>
            </div>
          ))}
          {metadataEntries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between font-ibm-plex text-sm py-2 border-b border-white/[0.06]">
              <span className="text-white/40">{key}</span>
              <span>{String(value)}</span>
            </div>
          ))}

          {/* THIS MONTH */}
          <div className="font-space text-xs uppercase tracking-wider text-white/40 mt-8 mb-3">THIS MONTH</div>
          {[
            { label: "Total Spend", value: `$${totalSpend.toFixed(2)}` },
            { label: "Top-ups", value: monthTopups.length > 0 ? `${monthTopups.length} × $${(monthTopups.reduce((s, t) => s + t.amount, 0) / monthTopups.length).toFixed(2)}` : "None" },
            { label: "Events", value: customerEvents.filter((e) => new Date(e.timestamp) >= monthStart).length.toLocaleString() },
            { label: "Avg Daily", value: `$${avgDaily.toFixed(2)}` },
            { label: "Runway Est.", value: runway === Infinity ? "∞" : `${runway} days` },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between font-ibm-plex text-sm py-2 border-b border-white/[0.06]">
              <span className="text-white/40">{row.label}</span>
              <span>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Right 60% */}
        <div className="col-span-3 space-y-8">
          {/* Period toggle */}
          <div className="flex gap-6">
            {(["30", "7", "90"] as const).map((r) => (
              <button key={r} onClick={() => setChartRange(r)} className={`font-space text-xs uppercase tracking-wide pb-1 ${chartRange === r ? "text-white border-b-2 border-white" : "text-white/40 hover:text-white"}`}>
                {r} Days
              </button>
            ))}
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: "IBM Plex Mono", fill: "rgba(255,255,255,0.3)" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, background: "#0F0F0F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0 }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Spend"]} />
              <Area type="monotone" dataKey="spend" stroke="#4ADE80" fill="rgba(74,222,128,0.08)" />
            </AreaChart>
          </ResponsiveContainer>

          {/* Usage Events */}
          <div className="font-space text-xs uppercase tracking-wider text-white/40 mb-4">USAGE EVENTS</div>
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-dashed border-white/15">
                <th className="w-[15%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Timestamp</th>
                <th className="w-[18%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Event Type</th>
                <th className="w-[30%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Dimensions</th>
                <th className="w-[16%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Status</th>
                <th className="w-[21%] px-4 pb-3 text-right font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Cost</th>
              </tr>
            </thead>
            <tbody>
              {customerEvents.slice(0, visibleEvents).map((event) => (
                <tr key={event.id} className="border-b border-white/[0.06] hover:bg-white/[0.02] cursor-pointer" onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}>
                  <td className="px-4 py-4 font-ibm-plex text-xs text-white/60">{formatTime(event.timestamp)}</td>
                  <td className="px-4 py-4 font-ibm-plex text-sm font-light">{event.event_type}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(event.properties).filter(([k]) => k !== "event_type").slice(0, 3).map(([k, v]) => (
                        <span key={k} className="bg-white/5 px-1 py-0.5 font-ibm-plex text-xs text-white/50">{k}:{String(v)}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={event.status} /></td>
                  <td className="px-4 py-4 text-right font-ibm-plex text-sm text-[#4ADE80]">
                    {event.fees?.[0] && `$${event.fees[0].amount.toFixed(4)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleEvents < customerEvents.length && (
            <button onClick={() => setVisibleEvents((v) => v + 10)} className="mt-4 w-full border border-white/30 bg-transparent py-2 font-space text-xs uppercase tracking-wide text-white/40 hover:text-white hover:bg-white/5">
              Load More
            </button>
          )}

          {/* Top-up History */}
          <div className="mt-6">
            <button onClick={() => setShowTopups(!showTopups)} className="font-space text-xs uppercase tracking-wide text-white/40 hover:text-white cursor-pointer">
              {showTopups ? "▼" : "▶"} Top-up History ({topups.length})
            </button>
            {showTopups && topups.length > 0 && (
              <table className="w-full table-fixed mt-4">
                <thead>
                  <tr className="border-b border-dashed border-white/15">
                    <th className="px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40">Date</th>
                    <th className="px-4 pb-3 text-right font-space text-xs uppercase tracking-wider text-white/40">Amount</th>
                    <th className="px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40">Description</th>
                    <th className="px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topups.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                      <td className="px-4 py-4 font-ibm-plex text-xs text-white/60">{formatTime(tx.created_at)}</td>
                      <td className="px-4 py-4 text-right font-ibm-plex text-sm text-[#4ADE80]">+${tx.amount.toFixed(2)}</td>
                      <td className="px-4 py-4 font-ibm-plex text-xs text-white/60">{tx.description}</td>
                      <td className="px-4 py-4"><StatusBadge status="processed" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Top-up Modal */}
      <Dialog open={showTopupModal} onOpenChange={setShowTopupModal}>
        <DialogContent className="border-white/10 sm:max-w-sm p-0 gap-0" style={{ backgroundColor: "#111111" }}>
          <div className="border-b border-white/[0.08] px-8 py-4">
            <span className="font-space text-xs text-white/50">-- TOP UP WALLET ---------------------------------</span>
          </div>
          <div className="space-y-4 px-8 py-6">
            <div>
              <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-ibm-plex text-sm text-white/40">$</span>
                <input type="number" step="any" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} placeholder="25.00" autoFocus
                  className="w-full border border-white/20 bg-transparent py-2 pl-7 pr-3 font-ibm-plex text-sm focus:outline-none focus:border-white/60" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.08] px-8 py-4">
            <button onClick={() => setShowTopupModal(false)} className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5">Cancel</button>
            <button onClick={handleTopup} className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90">Confirm Top Up</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}