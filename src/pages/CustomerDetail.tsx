import { useParams, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { customers as initialCustomers } from "@/data/customers";
import { events } from "@/data/events";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EditCustomerModal } from "@/components/customers/EditCustomerModal";
import { EventDetailSheet } from "@/components/events/EventDetailSheet";
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
  const [customerData, setCustomerData] = useState(initialCustomers);
  const customer = customerData.find((c) => c.id === id);
  const [chartRange, setChartRange] = useState<"7" | "30" | "90">("30");
  const [showTopups, setShowTopups] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [visibleEvents, setVisibleEvents] = useState(10);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

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

  const hasChartData = chartData.some((d) => d.spend > 0);
  const metadataEntries = customer.metadata ? Object.entries(customer.metadata) : [];

  const handleTopup = () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) return;
    toast({ title: "done: Top-up processed", description: `$${amount.toFixed(2)} added to wallet.` });
    setShowTopupModal(false);
    setTopupAmount("");
  };

  const selectedEventObj = selectedEvent ? customerEvents.find((e) => e.id === selectedEvent) : null;

  const asciiHeader = (label: string) => (
    <div className="font-space text-xs text-white/50 mb-4">┌─ {label} ──────────────────────────┐</div>
  );

  const fieldRow = (label: string, value: React.ReactNode) => (
    <div className="flex items-center justify-between font-ibm-plex text-sm py-2.5 border-b border-dotted border-white/10">
      <span className="text-white/40">{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <div className="space-y-0">
      {/* Breadcrumb */}
      <nav className="font-ibm-plex text-xs text-white/40 mb-6">
        <Link to="/customers" className="hover:text-white">CUSTOMERS</Link>
        <span className="mx-2">{">"}</span>
        <span className="text-white">{customer.name}</span>
      </nav>

      {/* 1. HEADER ROW */}
      <div className="flex items-start justify-between border-b border-dotted border-white/[0.08] pb-6 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-space text-2xl font-bold tracking-wider">{customer.name}</h1>
            <StatusBadge status={customer.status} />
          </div>
          <div className="mt-1 font-ibm-plex text-xs text-white/30">{customer.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEditModal(true)} className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5">Edit</button>
          <button onClick={() => setShowTopupModal(true)} className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90">Top Up Wallet</button>
          <button className="border border-[#F87171]/30 text-[#F87171] bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-[#F87171]/5">Suspend</button>
        </div>
      </div>

      {/* 2. STATS BAR */}
      <div className="grid grid-cols-4 border-b border-dotted border-white/[0.08] pb-6 mb-8">
        {[
          { label: "Balance", value: `$${balance.toFixed(2)}` },
          { label: "Available", value: `$${(primaryAccount?.available || 0).toFixed(2)}` },
          { label: "This Month", value: `$${totalSpend.toFixed(2)} spent` },
          { label: "Runway", value: runway === Infinity ? "∞" : `${runway} days` },
        ].map((stat, i) => (
          <div key={stat.label} className={`${i > 0 ? "border-l border-dotted border-white/[0.08] pl-6" : ""} ${i < 3 ? "pr-6" : ""}`}>
            <div className="font-space text-xs uppercase text-white/40 tracking-wider mb-1">{stat.label}</div>
            <div className="font-ibm-plex text-xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* 3. WALLET + DETAILS — two equal columns */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* WALLET */}
        <div className="border border-dotted border-white/10 p-5">
          {asciiHeader("WALLET")}
          {fieldRow("Balance", `$${balance.toFixed(2)}`)}
          {fieldRow("Available", `$${(primaryAccount?.available || 0).toFixed(2)}`)}
          {fieldRow("Pending", `$${(primaryAccount?.pending_in || 0).toFixed(2)}`)}
          {fieldRow("Reserved", `$${(primaryAccount?.pending_out || 0).toFixed(2)}`)}
          <div className="my-2" />
          {fieldRow("Auto Top-up", (
            <span className={customer.auto_topup?.enabled ? "text-[#4ADE80]" : "text-white/40"}>
              {customer.auto_topup?.enabled ? "✓ ENABLED" : "OFF"}
            </span>
          ))}
          {customer.auto_topup?.enabled && (
            <>
              {fieldRow("Threshold", `below $${customer.auto_topup.threshold.toFixed(2)}`)}
              {fieldRow("Top-up Amount", `+$${customer.auto_topup.amount.toFixed(2)}`)}
            </>
          )}
        </div>

        {/* DETAILS */}
        <div className="border border-dotted border-white/10 p-5">
          {asciiHeader("DETAILS")}
          {fieldRow("External ID", customer.external_id)}
          {fieldRow("Email", customer.email)}
          {fieldRow("Currency", primaryAccount?.asset_code || "USD")}
          {fieldRow("Created", formatTime(customer.created_at))}
          {metadataEntries.length > 0 && <div className="my-2" />}
          {metadataEntries.map(([key, value]) => fieldRow(key, String(value)))}
        </div>
      </div>

      {/* 4. USAGE CHART — full width */}
      <div className="border border-dotted border-white/10 p-5 mb-8">
        {asciiHeader("USAGE")}
        <div className="flex gap-6 mb-4">
          {(["30", "7", "90"] as const).map((r) => (
            <button key={r} onClick={() => setChartRange(r)} className={`font-space text-xs uppercase tracking-wide pb-1 ${chartRange === r ? "text-white border-b-2 border-white" : "text-white/40 hover:text-white"}`}>
              {r} Days
            </button>
          ))}
        </div>
        {hasChartData ? (
          <ResponsiveContainer width="100%" height={192}>
            <AreaChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: "IBM Plex Mono", fill: "rgba(255,255,255,0.3)" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, background: "#0F0F0F", border: "1px dotted rgba(255,255,255,0.08)", borderRadius: 0 }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Spend"]} />
              <Area type="monotone" dataKey="spend" stroke="#4ADE80" fill="rgba(74,222,128,0.08)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <span className="font-ibm-plex text-sm text-white/40">$ no usage data for this period <span className="animate-pulse">█</span></span>
          </div>
        )}
      </div>

      {/* 5. USAGE EVENTS TABLE — full width */}
      <div className="border border-dotted border-white/10 p-5 mb-8">
        {asciiHeader(`USAGE EVENTS (${customerEvents.length})`)}
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-dotted border-white/20">
              <th className="w-[20%] px-4 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Timestamp</th>
              <th className="w-[20%] px-4 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Event Type</th>
              <th className="w-[35%] px-4 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Dimensions</th>
              <th className="w-[10%] px-4 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Status</th>
              <th className="w-[15%] px-4 py-3 text-right font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Cost</th>
            </tr>
          </thead>
          <tbody>
            {customerEvents.slice(0, visibleEvents).map((event) => {
              const dims = Object.entries(event.properties).filter(([k]) => k !== "event_type");
              const MAX_DIMS = 3;
              const visibleDims = dims.slice(0, MAX_DIMS);
              const extraCount = dims.length - MAX_DIMS;
              const fee = event.fees?.[0];

              return (
                <tr
                  key={event.id}
                  className="border-b border-dotted border-white/10 hover:bg-white/[0.02] cursor-pointer"
                  onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                >
                  <td className="px-4 py-4 font-ibm-plex text-xs text-white/60 whitespace-nowrap">{formatTime(event.timestamp)}</td>
                  <td className="px-4 py-4 font-ibm-plex text-sm font-medium whitespace-nowrap">{event.event_type}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {visibleDims.map(([k, v]) => (
                        <span key={k} className="bg-white/5 px-1.5 py-0.5 font-ibm-plex text-xs text-white/50">{k}:{String(v)}</span>
                      ))}
                      {extraCount > 0 && <span className="font-ibm-plex text-xs text-white/20">+{extraCount} more</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap"><StatusBadge status={event.status} /></td>
                  <td className="px-4 py-4 text-right font-ibm-plex text-sm whitespace-nowrap">
                    {fee ? (
                      <span className="text-[#4ADE80]">${fee.amount.toFixed(4)}</span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {visibleEvents < customerEvents.length && (
          <button onClick={() => setVisibleEvents((v) => v + 10)} className="mt-4 w-full border border-dotted border-white/10 bg-transparent py-3 font-space text-xs uppercase tracking-wide text-white/40 hover:text-white hover:bg-white/5">
            Load More
          </button>
        )}
      </div>

      {/* 6. TOP-UP HISTORY — collapsible */}
      <div className="mb-8">
        <button onClick={() => setShowTopups(!showTopups)} className="font-space text-xs uppercase tracking-wide text-white/40 hover:text-white cursor-pointer">
          {showTopups ? "▼" : "▶"} Top-up History ({topups.length})
        </button>
        {showTopups && topups.length > 0 && (
          <div className="border border-dotted border-white/10 mt-4">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-dotted border-white/20">
                  <th className="w-[25%] px-4 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Date</th>
                  <th className="w-[25%] px-4 py-3 text-right font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Amount</th>
                  <th className="w-[30%] px-4 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Description</th>
                  <th className="w-[20%] px-4 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {topups.map((tx) => (
                  <tr key={tx.id} className="border-b border-dotted border-white/10 hover:bg-white/[0.02]">
                    <td className="px-4 py-4 font-ibm-plex text-xs text-white/60">{formatTime(tx.created_at)}</td>
                    <td className="px-4 py-4 text-right font-ibm-plex text-sm text-[#4ADE80]">+${tx.amount.toFixed(2)}</td>
                    <td className="px-4 py-4 font-ibm-plex text-xs text-white/60">{tx.description}</td>
                    <td className="px-4 py-4"><StatusBadge status="processed" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event Detail Sheet */}
      {selectedEventObj && (
        <EventDetailSheet
          event={selectedEventObj}
          customerExternalId={customer.external_id}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Top-up Modal */}
      <Dialog open={showTopupModal} onOpenChange={setShowTopupModal}>
        <DialogContent className="border-dotted border-white/10 sm:max-w-sm p-0 gap-0" style={{ backgroundColor: "#111111" }}>
          <div className="border-b border-dotted border-white/[0.08] px-8 py-4">
            <span className="font-space text-xs text-white/50">┌─ TOP UP WALLET ──────────────────────┐</span>
          </div>
          <div className="space-y-4 px-8 py-6">
            <div>
              <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-ibm-plex text-sm text-white/40">$</span>
                <input type="number" step="any" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} placeholder="25.00" autoFocus
                  className="w-full border border-dotted border-white/20 bg-transparent py-2 pl-7 pr-3 font-ibm-plex text-sm focus:outline-none focus:border-white/60" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-dotted border-white/[0.08] px-8 py-4">
            <button onClick={() => setShowTopupModal(false)} className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5">Cancel</button>
            <button onClick={handleTopup} className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90">Confirm Top Up</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <EditCustomerModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        customer={customer}
        onSaved={(updated) => {
          setCustomerData(prev => prev.map(c => c.id === updated.id ? updated : c));
          setShowEditModal(false);
        }}
      />
    </div>
  );
}