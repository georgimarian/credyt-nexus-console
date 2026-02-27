import { useParams, Link } from "react-router-dom";
import React, { useState, useMemo } from "react";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { customers as initialCustomers } from "@/data/customers";
import { events } from "@/data/events";
import { products } from "@/data/products";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EditCustomerModal } from "@/components/customers/EditCustomerModal";
import { EventDetailSheet } from "@/components/events/EventDetailSheet";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
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

type TabKey = "overview" | "events" | "wallet" | "subscriptions";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customerData, setCustomerData] = useState(initialCustomers);
  const customer = customerData.find((c) => c.id === id);
  const [chartRange, setChartRange] = useState<"7" | "30" | "90">("30");
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [eventPage, setEventPage] = useState(0);
  const [chartAsset, setChartAsset] = useState("USD");
  const [productFilter, setProductFilter] = useState("all");
  const [eventsShowAll, setEventsShowAll] = useState(false);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const customerEvents = customer ? events.filter((e) => e.customer_id === customer.id) : [];
  const charges = customer ? customer.wallet.transactions.filter((t) => t.type === "charge") : [];

  // Generate sparse spend data for chart (must be before early return)
  const chartDays = parseInt(chartRange);
  const chartData = useMemo(() => {
    if (!customer) return [];
    const nowLocal = new Date();
    return Array.from({ length: chartDays }, (_, i) => {
      const date = new Date(nowLocal);
      date.setDate(date.getDate() - (chartDays - 1 - i));
      const dayStr = date.toISOString().split("T")[0];
      const mo = date.toLocaleString("en-US", { month: "short" });
      const dayLabel = `${mo} ${String(date.getDate()).padStart(2, "0")}`;
      const dayEvts = customerEvents.filter((e) => e.timestamp.startsWith(dayStr));
      let spend = 0;
      dayEvts.forEach((e) => {
        spend += e.fees?.reduce((s, f) => s + (f.asset_code === chartAsset ? f.amount : 0), 0) || 0;
      });
      if (spend === 0) {
        spend = charges.filter((t) => t.created_at.startsWith(dayStr)).reduce((s, t) => s + Math.abs(t.amount), 0);
      }
      return { day: dayLabel, spend: +spend.toFixed(4) };
    });
  }, [chartDays, chartAsset, customer?.id]);

  if (!customer) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-ibm-plex text-white/40">Customer not found</p>
      </div>
    );
  }

  const topups = customer.wallet.transactions.filter((t) => t.type === "top_up");
  const primaryAccount = customer.wallet.accounts[0];
  const balance = primaryAccount ? primaryAccount.available + primaryAccount.pending_out : 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthCharges = charges.filter((t) => new Date(t.created_at) >= monthStart);
  const totalSpend = monthCharges.reduce((s, t) => s + Math.abs(t.amount), 0);
  const daysElapsed = Math.max(1, Math.ceil((now.getTime() - monthStart.getTime()) / 86400000));
  const avgDaily = totalSpend / daysElapsed;
  const runway = avgDaily > 0 ? Math.round((primaryAccount?.available || 0) / avgDaily) : Infinity;
  const monthEventCount = customerEvents.filter((e) => new Date(e.timestamp) >= monthStart).length;

  const runwayColor = runway === Infinity ? "text-[#4ADE80]" : runway > 30 ? "text-[#4ADE80]" : runway >= 7 ? "text-[#FACC15]" : "text-[#F87171]";

  const hasChartData = chartData.some((d) => d.spend > 0);
  const metadataEntries = customer.metadata ? Object.entries(customer.metadata) : [];

  // Overview tab mini stats
  const peakDay = chartData.reduce((max, d) => d.spend > max.spend ? d : max, chartData[0]);
  const eventTypeCounts: Record<string, number> = {};
  customerEvents.forEach((e) => { eventTypeCounts[e.event_type] = (eventTypeCounts[e.event_type] || 0) + 1; });
  const mostUsedType = Object.entries(eventTypeCounts).sort((a, b) => b[1] - a[1])[0];
  const totalFees = customerEvents.reduce((s, e) => s + (e.fees?.[0]?.amount || 0), 0);
  const avgPerEvent = customerEvents.length > 0 ? totalFees / customerEvents.length : 0;

  // Filtered events for events tab
  const filteredEvents = productFilter === "all"
    ? customerEvents
    : customerEvents.filter((e) => {
        const product = products.find((p) => p.code === productFilter);
        if (!product) return false;
        return product.prices.some((pr) => pr.event_type === e.event_type);
      });

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

  const EVENTS_PER_PAGE = 10;
  const INITIAL_EVENT_COUNT2 = 10;
  const visibleEvents = eventsShowAll ? filteredEvents : filteredEvents.slice(0, INITIAL_EVENT_COUNT2);
  const pagedEvents = visibleEvents;
  const totalEventPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "events", label: "Usage Events" },
    { key: "wallet", label: "Wallet" },
    { key: "subscriptions", label: "Subscriptions" },
  ];

  // Wallet tab helpers
  const totalTopups = topups.reduce((s, t) => s + t.amount, 0);
  const totalSpentAll = charges.reduce((s, t) => s + Math.abs(t.amount), 0);
  const assetCodes = customer.wallet.accounts.map((a) => a.asset_code);


  // Period dropdown options
  const periodOptions = [
    { label: "Last 7 days", value: "7" },
    { label: "Last 30 days", value: "30" },
    { label: "Last 90 days", value: "90" },
  ];

  return (
    <div className="space-y-0">
      {/* Breadcrumb */}
      <nav className="font-ibm-plex text-xs text-white/40 mb-6">
        <Link to="/customers" className="hover:text-white">CUSTOMERS</Link>
        <span className="mx-2">{">"}</span>
        <span className="text-white">{customer.name}</span>
      </nav>

      {/* HEADER ROW */}
      <div className="flex items-start justify-between border-b border-dotted border-white/[0.08] pb-6 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-space text-2xl font-bold tracking-wider">{customer.name}</h1>
            <StatusBadge status={customer.status} />
          </div>
          <div className="mt-1 font-ibm-plex text-xs text-white/30">{customer.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEditModal(true)} className="border border-dotted border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5">Edit</button>
          <button onClick={() => setShowTopupModal(true)} className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90">Top Up Wallet</button>
          <button className="border border-dotted border-[#F87171]/30 text-[#F87171] bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-[#F87171]/5">Suspend</button>
        </div>
      </div>

      {/* STATS BAR — 4 cards matching overview style */}
      <div className="grid grid-cols-4 gap-0 border border-dotted border-white/10 mb-8">
        {[
          { label: "Balance", value: `$${balance.toFixed(2)}`, sub: `$${(primaryAccount?.pending_out || 0).toFixed(2)} reserved`, color: "" },
          { label: "Available", value: `$${(primaryAccount?.available || 0).toFixed(2)}`, sub: `$${(primaryAccount?.pending_in || 0).toFixed(2)} pending`, color: "" },
          { label: "This Month", value: `$${totalSpend.toFixed(2)} spent`, sub: `${monthEventCount} events`, color: "" },
          { label: "Runway", value: runway === Infinity ? "∞" : `${runway} days`, sub: "at current spend rate", color: runwayColor },
        ].map((stat, i) => (
          <div key={stat.label} className={`px-6 py-5 ${i < 3 ? "border-r border-dotted border-white/10" : ""}`}>
            <div className="font-space text-xs uppercase text-white/40 tracking-wider mb-2">{stat.label}</div>
            <div className={`font-space text-2xl font-bold ${stat.color || "text-white"}`}>{stat.value}</div>
            <div className="text-xs font-mono text-white/30 mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* DETAILS section — always visible */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="border border-dotted border-white/10 p-5">
          {asciiHeader("DETAILS")}
          {fieldRow("External ID", customer.external_id)}
          {fieldRow("Email", customer.email)}
          {fieldRow("Currency", primaryAccount?.asset_code || "USD")}
          {fieldRow("Created", formatTime(customer.created_at))}
          {metadataEntries.length > 0 && <div className="my-2" />}
          {metadataEntries.map(([key, value]) => fieldRow(key, String(value)))}
        </div>
        <div className="border border-dotted border-white/10 p-5">
          {asciiHeader("AUTO TOP-UP")}
          {fieldRow("Status", (
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
          {fieldRow("Subscriptions", `${customer.subscriptions.length} active`)}
          {customer.subscriptions.map((sub) => fieldRow(sub.product_name, <StatusBadge status={sub.status} />))}
        </div>
      </div>

      {/* TAB BAR */}
      <div className="flex gap-0 border-b border-dotted border-white/10 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setEventPage(0); }}
            className={`px-5 py-2.5 text-xs font-mono uppercase tracking-wide cursor-pointer ${activeTab === tab.key ? "text-white border-b-2 border-white -mb-px" : "text-white/30 hover:text-white/60"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === "overview" && (
        <div className="space-y-0">
          <div className="border border-dotted border-white/10 p-5 mb-4">
            {/* Chart header with asset switcher + period */}
            <div className="flex items-center justify-between mb-4">
              {asciiHeader("RECENT SPEND")}
              <div className="flex items-center gap-3">
                {/* Asset switcher */}
                {assetCodes.length > 1 && (
                  <div className="flex gap-1">
                    {assetCodes.map((code) => (
                      <button
                        key={code}
                        onClick={() => setChartAsset(code)}
                        className={`text-xs px-3 py-1 font-mono ${chartAsset === code ? "bg-white text-black" : "border border-dotted border-white/20 text-white/40 hover:text-white/60"}`}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                )}
                {/* Period dropdown */}
                <select
                  value={chartRange}
                  onChange={(e) => setChartRange(e.target.value as "7" | "30" | "90")}
                  className="border border-dotted border-white/20 text-white/40 text-xs px-3 py-1 font-mono bg-transparent appearance-none cursor-pointer hover:text-white/60 focus:outline-none"
                >
                  {periodOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#111] text-white">{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {hasChartData ? (
              <ResponsiveContainer width="100%" height={224}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: "IBM Plex Mono", fill: "rgba(255,255,255,0.3)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fontFamily: "IBM Plex Mono", fill: "rgba(255,255,255,0.3)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} width={40} />
                  <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, background: "#0F0F0F", border: "1px dotted rgba(255,255,255,0.08)", borderRadius: 0 }} formatter={(v: number) => [`$${v.toFixed(4)}`, "Spend"]} />
                  <Line type="monotone" dataKey="spend" stroke="#FAFAFA" strokeWidth={1.5} dot={{ r: 3, fill: "#FAFAFA" }} activeDot={{ r: 4, fill: "#FAFAFA" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center">
                <span className="font-ibm-plex text-sm text-white/40">$ no usage data for this period <span className="animate-pulse">█</span></span>
              </div>
            )}
          </div>
          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dotted border-white/10">
            <div className="border border-dotted border-white/10 px-4 py-3">
              <div className="font-space text-xs uppercase text-white/40 tracking-wider mb-1">Peak Day</div>
              <div className="font-ibm-plex text-sm font-bold">{peakDay ? `${peakDay.day} — $${peakDay.spend.toFixed(2)}` : "—"}</div>
            </div>
            <div className="border border-dotted border-white/10 px-4 py-3">
              <div className="font-space text-xs uppercase text-white/40 tracking-wider mb-1">Most Used Event</div>
              <div className="font-ibm-plex text-sm font-bold">{mostUsedType ? `${mostUsedType[0]} (${mostUsedType[1]})` : "—"}</div>
            </div>
            <div className="border border-dotted border-white/10 px-4 py-3">
              <div className="font-space text-xs uppercase text-white/40 tracking-wider mb-1">Avg Per Event</div>
              <div className="font-ibm-plex text-sm font-bold">${avgPerEvent.toFixed(4)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== USAGE EVENTS TAB ==================== */}
      {activeTab === "events" && (
        <div className="border border-dotted border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            {asciiHeader(`USAGE EVENTS (${filteredEvents.length})`)}
            <select
              value={productFilter}
              onChange={(e) => { setProductFilter(e.target.value); setEventPage(0); }}
              className="border border-dotted border-white/20 text-white/40 text-xs px-3 py-1 font-mono bg-transparent appearance-none cursor-pointer hover:text-white/60 focus:outline-none"
            >
              <option value="all" className="bg-[#111] text-white">All Products</option>
              {products.map((p) => (
                <option key={p.code} value={p.code} className="bg-[#111] text-white">{p.name}</option>
              ))}
            </select>
          </div>
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
              {pagedEvents.map((event) => {
                const dims = Object.entries(event.properties).filter(([k]) => k !== "event_type");
                const visibleDims = dims.slice(0, 3);
                const extraCount = dims.length - 3;
                const fee = event.fees?.[0];
                return (
                  <tr key={event.id} className="border-b border-dotted border-white/10 hover:bg-white/[0.02] cursor-pointer" onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}>
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
                      {fee ? <span className="text-[#4ADE80]">${fee.amount.toFixed(4)}</span> : <span className="text-white/20">—</span>}
                    </td>
                  </tr>
                );
              })}
              {pagedEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center font-ibm-plex text-sm text-white/40">$ no events match filter <span className="animate-pulse">█</span></td>
                </tr>
              )}
            </tbody>
          </table>
          {!eventsShowAll && filteredEvents.length > INITIAL_EVENT_COUNT2 && (
            <div className="flex justify-center pt-4 mt-2 border-t border-dotted border-white/10">
              <button onClick={() => setEventsShowAll(true)} className="text-xs font-mono uppercase tracking-wide text-white/40 hover:text-white cursor-pointer">Load More ({filteredEvents.length - INITIAL_EVENT_COUNT2} remaining)</button>
            </div>
          )}
        </div>
      )}

      {/* ==================== WALLET TAB ==================== */}
      {activeTab === "wallet" && (
        <div className="space-y-6">
          {/* Asset balance cards */}
          <div className={`grid gap-4 ${customer.wallet.accounts.length > 2 ? "grid-cols-3" : customer.wallet.accounts.length === 2 ? "grid-cols-2" : "grid-cols-1 max-w-md"}`}>
            {customer.wallet.accounts.map((account) => {
              const isFiat = account.asset_code === "USD";
              const symbol = isFiat ? "$" : "CR";
              const formatVal = (v: number) => isFiat ? `$${v.toFixed(2)}` : `${v.toLocaleString()} ${account.asset_code}`;
              const acctTopups = topups.filter((t) => t.asset_code === account.asset_code).reduce((s, t) => s + t.amount, 0);
              const acctSpent = charges.filter((t) => t.asset_code === account.asset_code).reduce((s, t) => s + Math.abs(t.amount), 0);

              return (
                <div key={account.asset_code} className="border border-dotted border-white/10 bg-[#0F0F0F] p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-teal-400 font-bold font-mono">{symbol}</span>
                      <span className="font-bold font-mono text-sm">{account.asset_code}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[#4ADE80] font-bold text-lg font-mono">{formatVal(account.available)}</div>
                      <div className="text-xs text-white/40">Available</div>
                    </div>
                  </div>

                  {/* Field rows */}
                  <div className="space-y-0">
                    <div className="flex justify-between py-1.5 text-sm font-mono">
                      <span className="text-white/40">Top-ups</span>
                      <span className="text-white">{formatVal(acctTopups)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-sm font-mono">
                      <span className="text-white/40">Spent</span>
                      <span className="text-white">{formatVal(acctSpent)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-sm font-mono">
                      <span className="text-white/40">Pending</span>
                      <span className="text-white">{formatVal(account.pending_in)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-sm font-mono">
                      <span className="text-white/40">Reserved</span>
                      <span className="text-white">{formatVal(account.pending_out)}</span>
                    </div>
                  </div>

                  {/* Auto top-up */}
                  <div className="text-xs font-mono mt-3 space-y-1">
                    <div>
                      <span className="text-white/40">Auto Top-up: </span>
                      {customer.auto_topup?.enabled ? (
                        <span className="text-[#4ADE80]">✓ ENABLED</span>
                      ) : (
                        <span className="text-[#F87171]">✗ OFF</span>
                      )}
                    </div>
                    {customer.auto_topup?.enabled && (
                      <>
                        <div>
                          <span className="text-white/40">Threshold: </span>
                          <span className="text-white">${customer.auto_topup.threshold.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-white/40">Top-up Amount: </span>
                          <span className="text-white">${customer.auto_topup.amount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Top Up button */}
                  <button
                    onClick={() => setShowTopupModal(true)}
                    className="bg-white text-black w-full py-2 text-xs font-mono uppercase tracking-wide mt-4 hover:bg-white/90"
                  >
                    Top Up
                  </button>
                </div>
              );
            })}
          </div>

          {/* Top-up history */}
          <div className="border border-dotted border-white/10 p-5">
            {asciiHeader(`TOP-UP HISTORY (${topups.length})`)}
            {topups.length > 0 ? (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-dotted border-white/20">
                    <th className="w-[30%] px-2 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Date</th>
                    <th className="w-[25%] px-2 py-3 text-right font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Amount</th>
                    <th className="w-[30%] px-2 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Description</th>
                    <th className="w-[15%] px-2 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topups.map((tx) => (
                    <tr key={tx.id} className="border-b border-dotted border-white/10 hover:bg-white/[0.02]">
                      <td className="px-2 py-3 font-ibm-plex text-xs text-white/60">{formatTime(tx.created_at)}</td>
                      <td className="px-2 py-3 text-right font-ibm-plex text-sm text-[#4ADE80]">+${tx.amount.toFixed(2)}</td>
                      <td className="px-2 py-3 font-ibm-plex text-xs text-white/60">{tx.description}</td>
                      <td className="px-2 py-3"><StatusBadge status="processed" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center font-ibm-plex text-sm text-white/40">$ no top-ups <span className="animate-pulse">█</span></div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUBSCRIPTIONS TAB ==================== */}
      {activeTab === "subscriptions" && (
        <div className="border border-dotted border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            {asciiHeader("SUBSCRIPTIONS")}
            <button className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90">+ Add Subscription</button>
          </div>
          {customer.subscriptions.length > 0 ? (
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-dotted border-white/20">
                  <th className="w-[30%] px-4 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Product</th>
                  <th className="w-[20%] px-4 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Code</th>
                  <th className="w-[15%] px-4 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Status</th>
                  <th className="w-[20%] px-4 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Start Date</th>
                  <th className="w-[15%] px-4 py-3 text-right font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {customer.subscriptions.map((sub) => {
                  const product = products.find((p) => p.id === sub.product_id);
                  const isExpanded = expandedSub === sub.id;
                  return (
                    <React.Fragment key={sub.id}>
                      <tr className="border-b border-dotted border-white/10 hover:bg-white/[0.02] cursor-pointer" onClick={() => setExpandedSub(isExpanded ? null : sub.id)}>
                        <td className="px-4 py-4 font-ibm-plex text-sm font-medium">
                          <span className={`text-white/20 text-xs mr-2 inline-block transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}>›</span>
                          {sub.product_name}
                        </td>
                        <td className="px-4 py-4">
                          <span className="border border-dotted border-white/20 text-white/60 text-xs px-1.5 py-0.5 font-mono">{product?.code || "—"}</span>
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={sub.status} /></td>
                        <td className="px-4 py-4 font-ibm-plex text-xs text-white/60">{formatTime(sub.start_date)}</td>
                        <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {sub.status === "active" && (
                            <button className="border border-dotted border-[#F87171]/30 text-[#F87171] bg-transparent px-3 py-1 font-space text-xs uppercase tracking-wide hover:bg-[#F87171]/5">Unsubscribe</button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && product && (
                        <tr>
                          <td colSpan={5} className="px-4 pb-4">
                            <div className="ml-8 border-t border-dotted border-white/8 pt-3 space-y-2">
                              {product.prices.map((price) => (
                                <div key={price.id} className="flex items-center gap-4 font-mono text-xs text-white/50">
                                  <span className="text-white/70 w-36">{price.event_type || "flat fee"}</span>
                                  <span className="text-white/30 w-20">{price.usage_calculation || "recurring"}</span>
                                  <span className="text-white/30 w-20">{price.billing_model}</span>
                                  <span className="text-[#4ADE80]">
                                    {price.unit_price != null ? `$${price.unit_price} per ${price.volume_field || "event"}` : price.amount != null ? `$${price.amount.toFixed(2)}/month` : "—"}
                                  </span>
                                  {price.entitlements && price.entitlements.length > 0 && (
                                    <span className="text-white/20 ml-2">(overage)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center font-ibm-plex text-sm text-white/40">$ no subscriptions <span className="animate-pulse">█</span></div>
          )}
        </div>
      )}

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
            <button onClick={() => setShowTopupModal(false)} className="border border-dotted border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5">Cancel</button>
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
