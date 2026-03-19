import { useParams, Link } from "react-router-dom";
import React, { useState, useMemo } from "react";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { customers as initialCustomers } from "@/data/customers";
import { events } from "@/data/events";
import { assets as allAssets } from "@/data/assets";
import { products } from "@/data/products";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EditCustomerModal } from "@/components/customers/EditCustomerModal";
import { EventDetailSheet } from "@/components/events/EventDetailSheet";
import { ExternalLink, Copy, CheckCircle } from "lucide-react";
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

function truncateId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-1.5 text-[#444] hover:text-white/60 inline-flex items-center"
      title="Copy"
    >
      {copied ? <CheckCircle size={11} className="text-[#4ADE80]" /> : <Copy size={11} />}
    </button>
  );
}

type TabKey = "events" | "subscriptions" | "autotopup";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customerData, setCustomerData] = useState(initialCustomers);
  const customer = customerData.find((c) => c.id === id);
  const [chartRange, setChartRange] = useState<"7" | "30" | "90">("30");
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("events");
  const [chartAsset, setChartAsset] = useState("USD");
  const [eventsShowAll, setEventsShowAll] = useState(false);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const customerEvents = customer ? events.filter((e) => e.customer_id === customer.id) : [];
  const allCharges = customer ? customer.wallet.transactions.filter((t) => t.type === "charge") : [];

  const chartDays = parseInt(chartRange);
  const chartData = useMemo(() => {
    if (!customer) return [];
    const nowLocal = new Date();
    const isCustomAsset = chartAsset !== "USD";
    
    if (isCustomAsset) {
      const account = customer.wallet.accounts.find(a => a.asset_code === chartAsset);
      if (!account) return [];
      const assetTxns = customer.wallet.transactions
        .filter(t => t.asset_code === chartAsset)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const initialTopup = assetTxns.filter(t => t.type === "top_up").reduce((s, t) => s + t.amount, 0);
      
      return Array.from({ length: chartDays }, (_, i) => {
        const date = new Date(nowLocal);
        date.setDate(date.getDate() - (chartDays - 1 - i));
        const dayStr = date.toISOString().split("T")[0];
        const mo = date.toLocaleString("en-US", { month: "short" });
        const dayLabel = `${mo} ${String(date.getDate()).padStart(2, "0")}`;
        const spent = assetTxns
          .filter(t => t.type === "charge" && t.created_at.split("T")[0] <= dayStr)
          .reduce((s, t) => s + Math.abs(t.amount), 0);
        return { day: dayLabel, spend: initialTopup - spent };
      });
    }
    
    return Array.from({ length: chartDays }, (_, i) => {
      const date = new Date(nowLocal);
      date.setDate(date.getDate() - (chartDays - 1 - i));
      const dayStr = date.toISOString().split("T")[0];
      const mo = date.toLocaleString("en-US", { month: "short" });
      const dayLabel = `${mo} ${String(date.getDate()).padStart(2, "0")}`;
      const dayEvts = customerEvents.filter((e) => e.timestamp.startsWith(dayStr));
      let spend = 0;
      dayEvts.forEach((e) => {
        spend += e.fees?.reduce((s, f) => s + (f.asset_code === "USD" ? f.amount : 0), 0) || 0;
      });
      if (spend === 0) {
        spend = allCharges.filter((t) => t.asset_code === "USD" && t.created_at.startsWith(dayStr)).reduce((s, t) => s + Math.abs(t.amount), 0);
      }
      return { day: dayLabel, spend: +spend.toFixed(4) };
    });
  }, [chartDays, chartAsset, customer?.id]);

  if (!customer) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-mono text-[#555]">Customer not found</p>
      </div>
    );
  }

  const topups = customer.wallet.transactions.filter((t) => t.type === "top_up");
  const primaryAccount = customer.wallet.accounts[0];
  const charges = customer.wallet.transactions.filter((t) => t.type === "charge");
  const assetCodes = customer.wallet.accounts.map((a) => a.asset_code);

  const hasChartData = chartData.some((d) => d.spend > 0);

  // Last activity
  const lastEvent = customerEvents.length > 0 ? customerEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] : null;

  const INITIAL_EVENT_COUNT = 10;
  const visibleEvents = eventsShowAll ? customerEvents : customerEvents.slice(0, INITIAL_EVENT_COUNT);

  const selectedEventObj = selectedEvent ? customerEvents.find((e) => e.id === selectedEvent) : null;

  const terminalHeader = (label: string) => (
    <div className="font-mono text-[11px] text-[#444] mb-3 tracking-wide">├─ {label} ──────────────────────────</div>
  );

  const handleTopup = () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) return;
    toast({ title: "done: Top-up processed", description: `$${amount.toFixed(2)} added to wallet.` });
    setShowTopupModal(false);
    setTopupAmount("");
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "events", label: "Usage Events" },
    { key: "subscriptions", label: "Subscriptions" },
    { key: "autotopup", label: "Auto Top-Up" },
  ];

  const periodOptions = [
    { label: "Last 7 days", value: "7" },
    { label: "Last 30 days", value: "30" },
    { label: "Last 90 days", value: "90" },
  ];

  return (
    <div className="space-y-0">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 font-mono text-[13px] flex-wrap">
          <Link to="/customers" className="text-[#555] hover:text-white">CUSTOMERS</Link>
          <span className="text-[#333]">/</span>
          <span className="text-white font-bold">{customer.name}</span>
          <span className={`border text-[10px] px-1.5 py-0.5 font-mono uppercase ${customer.status === "active" ? "border-[#4ADE80]/40 text-[#4ADE80]" : "border-[#F87171]/40 text-[#F87171]"}`}>
            {customer.status === "active" ? "✓" : "✗"} {customer.status}
          </span>
          <span className="text-[#333]">|</span>
          <span className="text-[#555] text-[11px]">{customer.email}</span>
          <span className="text-[#333]">|</span>
          <span className="text-[#555] text-[11px]">{truncateId(customer.id)}</span>
          <CopyBtn text={customer.id} />
          <span className="text-[#333]">|</span>
          <span className="text-[#555] text-[11px]">{customer.external_id}</span>
          <CopyBtn text={customer.external_id} />
        </div>
        <button className="border border-solid border-[#333] bg-transparent px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white hover:bg-white/5 flex items-center gap-2 shrink-0">
          Open Billing Portal <ExternalLink size={12} />
        </button>
      </div>

      {/* ===== BALANCE CARDS — 2 asset cards ===== */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {customer.wallet.accounts.map((account) => {
          const isFiat = account.asset_code === "USD";
          const symbol = isFiat ? "$" : account.asset_code[0];
          const formatVal = (v: number) => isFiat ? `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${v.toLocaleString()} ${account.asset_code}`;
          const acctTopups = topups.filter((t) => t.asset_code === account.asset_code).reduce((s, t) => s + t.amount, 0);
          const acctSpent = charges.filter((t) => t.asset_code === account.asset_code).reduce((s, t) => s + Math.abs(t.amount), 0);
          const totalBal = account.available + account.pending_out;
          const balColor = totalBal >= 0 ? "text-[#2dd4aa]" : "text-[#ef4444]";

          return (
            <div key={account.asset_code} className="bg-[#0d0d0d] border border-solid border-[#1a1a1a] p-5">
              {/* Card header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-[#1a1a1a] flex items-center justify-center font-mono text-[11px] text-[#555] font-bold">
                    {symbol}
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-white">{account.asset_code}</div>
                    <div className="font-mono text-[10px] text-[#444]">{isFiat ? "US Dollar" : account.asset_code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-mono text-xl font-bold ${balColor}`}>{formatVal(totalBal)}</div>
                  <div className="font-mono text-[10px] text-[#444]">Available</div>
                </div>
              </div>
              {/* Divider */}
              <div className="border-t border-solid border-[#1a1a1a] mb-3" />
              {/* Breakdown rows */}
              {[
                { label: "Top-ups", value: formatVal(acctTopups) },
                { label: "Spent", value: formatVal(acctSpent) },
                ...(account.pending_in > 0 ? [{ label: "Pending", value: formatVal(account.pending_in) }] : []),
                ...(account.pending_out > 0 ? [{ label: "Reserved", value: formatVal(account.pending_out) }] : []),
              ].map(row => (
                <div key={row.label} className="flex justify-between py-1.5 font-mono text-[13px]">
                  <span className="text-[#555]">{row.label}</span>
                  <span className="text-white">{row.value}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ===== STATS ROW — 4 cards ===== */}
      <div className="grid grid-cols-4 gap-0 mb-6">
        {/* Last Activity */}
        <div className="border border-solid border-[#1e1e1e] px-4 py-3 border-r-0">
          <div className="font-mono text-[10px] uppercase text-[#555] tracking-wider mb-1">Last Activity</div>
          <div className="font-mono text-[13px] text-white font-bold">{lastEvent ? formatTime(lastEvent.timestamp) : "—"}</div>
        </div>
        {/* Total Events */}
        <div className="border border-solid border-[#1e1e1e] px-4 py-3 border-r-0">
          <div className="font-mono text-[10px] uppercase text-[#555] tracking-wider mb-1">Total Events</div>
          <div className="font-mono text-[13px] text-white font-bold">{customerEvents.length}</div>
        </div>
        {/* Subscriptions */}
        <div className="border border-solid border-[#1e1e1e] px-4 py-3 border-r-0">
          <div className="font-mono text-[10px] uppercase text-[#555] tracking-wider mb-1">Subscriptions</div>
          <div className="font-mono text-[13px] text-white font-bold">{customer.subscriptions.length}</div>
        </div>
        {/* Auto Top-Up */}
        <div className="border border-solid border-[#1e1e1e] px-4 py-3">
          <div className="font-mono text-[10px] uppercase text-[#555] tracking-wider mb-1">Auto Top-Up</div>
          {customer.auto_topup ? (
            <div className="space-y-0.5">
              {Object.entries(customer.auto_topup).map(([code, cfg]) => (
                <div key={code} className="font-mono text-[11px]">
                  <span className="text-white font-bold">{code}</span>
                  <span className="mx-1 text-[#333]">·</span>
                  <span className={cfg.enabled ? "text-[#4ADE80]" : "text-[#ef4444]"}>
                    {cfg.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-mono text-[11px] text-[#555]">Not configured</div>
          )}
        </div>
      </div>

      {/* ===== RECENT SPEND CHART ===== */}
      <div className="bg-[#0d0d0d] border border-solid border-[#1a1a1a] p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-mono text-[11px] uppercase text-[#555] tracking-wider">Recent Spend</div>
          <div className="flex items-center gap-2">
            {assetCodes.length > 1 && (
              <div className="flex gap-0">
                {assetCodes.map((code) => (
                  <button
                    key={code}
                    onClick={() => setChartAsset(code)}
                    className={`text-[11px] px-3 py-1 font-mono border border-solid border-[#1e1e1e] ${chartAsset === code ? "bg-white text-black" : "text-[#555] hover:text-white/60"} ${code !== assetCodes[0] ? "-ml-px" : ""}`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            )}
            <select
              value={chartRange}
              onChange={(e) => setChartRange(e.target.value as "7" | "30" | "90")}
              className="border border-solid border-[#1e1e1e] text-[#555] text-[11px] px-3 py-1 font-mono bg-transparent appearance-none cursor-pointer hover:text-white/60 focus:outline-none"
            >
              {periodOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0d0d0d] text-white">{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {hasChartData ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: "IBM Plex Mono", fill: "#444" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fontFamily: "IBM Plex Mono", fill: "#444" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => chartAsset === "USD" ? `$${v}` : `${v}`} width={50} />
              <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 0 }} formatter={(v: number) => [chartAsset === "USD" ? `$${v.toFixed(4)}` : `${v.toLocaleString()} ${chartAsset}`, chartAsset === "USD" ? "Spend" : "Balance"]} />
              <Line type="monotone" dataKey="spend" stroke="#FAFAFA" strokeWidth={1.5} dot={{ r: 2, fill: "#FAFAFA" }} activeDot={{ r: 4, fill: "#FAFAFA" }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <span className="font-mono text-sm text-[#555]">$ no usage data for this period <span className="animate-pulse">█</span></span>
          </div>
        )}
      </div>

      {/* ===== TAB BAR ===== */}
      <div className="flex gap-0 border-b border-solid border-[#222] mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-[12px] font-mono uppercase tracking-[0.1em] cursor-pointer ${activeTab === tab.key ? "text-white border-b border-solid border-white -mb-px" : "text-[#555] hover:text-white/60"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== USAGE EVENTS TAB ==================== */}
      {activeTab === "events" && (
        <div>
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-solid border-[#222]">
                <th className="w-[16%] px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Timestamp</th>
                <th className="w-[14%] px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Event Type</th>
                <th className="w-[16%] px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Event ID</th>
                <th className="w-[26%] px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Description</th>
                <th className="w-[8%] px-3 py-2.5 text-center font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Fee</th>
                <th className="w-[12%] px-3 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Total Fees</th>
              </tr>
            </thead>
            <tbody>
              {visibleEvents.map((event) => {
                const fee = event.fees?.[0];
                const feeAsset = fee?.asset_code || "USD";
                const isTok = feeAsset === "TOK";
                const dims = Object.entries(event.properties).filter(([k]) => k !== "event_type");
                const description = dims.length > 0 ? dims.map(([k, v]) => `${k}:${v}`).join(", ") : "—";
                return (
                  <tr key={event.id} className="border-b border-solid border-[#1a1a1a] hover:bg-white/[0.02] cursor-pointer" onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}>
                    <td className="px-3 py-3 font-mono text-[12px] text-white whitespace-nowrap">{formatTime(event.timestamp)}</td>
                    <td className="px-3 py-3 font-mono text-[12px] text-white whitespace-nowrap">{event.event_type}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-[#555] whitespace-nowrap">
                      {truncateId(event.id)}
                      <CopyBtn text={event.id} />
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-[#555] truncate">{description}</td>
                    <td className="px-3 py-3 text-center">
                      {event.status === "processed" ? (
                        <CheckCircle size={14} className="text-[#4ADE80] mx-auto" />
                      ) : (
                        <span className="text-[#ef4444] text-[11px] font-mono">✗</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[12px] text-white whitespace-nowrap">
                      {fee ? (isTok ? `${fee.amount.toLocaleString()} TOK` : `$${fee.amount.toFixed(4)}`) : "—"}
                    </td>
                  </tr>
                );
              })}
              {visibleEvents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center font-mono text-sm text-[#555]">$ no events <span className="animate-pulse">█</span></td>
                </tr>
              )}
            </tbody>
          </table>
          {!eventsShowAll && customerEvents.length > INITIAL_EVENT_COUNT && (
            <div className="flex justify-center pt-4 mt-2 border-t border-solid border-[#1a1a1a]">
              <button onClick={() => setEventsShowAll(true)} className="text-[11px] font-mono uppercase tracking-wide text-[#555] hover:text-white cursor-pointer">Load More ({customerEvents.length - INITIAL_EVENT_COUNT} remaining)</button>
            </div>
          )}
        </div>
      )}

      {/* ==================== SUBSCRIPTIONS TAB ==================== */}
      {activeTab === "subscriptions" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div />
            <button className="border border-solid border-[#333] bg-transparent px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white hover:bg-white/5">+ Add Subscription</button>
          </div>
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-solid border-[#222]">
                <th className="w-[20%] px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">ID</th>
                <th className="w-[12%] px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Status</th>
                <th className="w-[16%] px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Started</th>
                <th className="w-[16%] px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Renews</th>
                <th className="w-[16%] px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Products</th>
                <th className="w-[8%] px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Alerts</th>
                <th className="w-[12%] px-3 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {customer.subscriptions.map((sub) => {
                const product = products.find((p) => p.id === sub.product_id);
                const isExpanded = expandedSub === sub.id;
                return (
                  <React.Fragment key={sub.id}>
                    <tr className="border-b border-solid border-[#1a1a1a] hover:bg-white/[0.02] cursor-pointer" onClick={() => setExpandedSub(isExpanded ? null : sub.id)}>
                      <td className="px-3 py-3 font-mono text-[11px] text-[#555] whitespace-nowrap">
                        {truncateId(sub.id)}
                        <CopyBtn text={sub.id} />
                      </td>
                      <td className="px-3 py-3">
                        <span className={`border text-[10px] px-1.5 py-0.5 font-mono uppercase ${sub.status === "active" ? "border-[#4ADE80]/40 text-[#4ADE80]" : "border-[#FACC15]/40 text-[#FACC15]"}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px] text-white">{formatTime(sub.start_date)}</td>
                      <td className="px-3 py-3 font-mono text-[11px] text-[#555]">—</td>
                      <td className="px-3 py-3 font-mono text-[11px] text-white">
                        {sub.product_name}
                        <span className="text-[#333] ml-1 text-[10px]">{isExpanded ? "▾" : "▸"}</span>
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px] text-[#555]">—</td>
                      <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {sub.status === "active" && (
                          <button className="border border-solid border-[#ef4444]/30 text-[#ef4444] bg-transparent px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide hover:bg-[#ef4444]/5">Unsubscribe</button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && product && (
                      <tr>
                        <td colSpan={7} className="px-3 pb-3">
                          <div className="ml-6 border-t border-solid border-[#1a1a1a] pt-3 space-y-1.5">
                            {product.prices.map((price) => (
                              <div key={price.id} className="flex items-center gap-4 font-mono text-[11px] text-[#555]">
                                <span className="text-white/70 w-36">{price.event_type || "flat fee"}</span>
                                <span className="text-[#444] w-20">{price.usage_calculation || "recurring"}</span>
                                <span className="text-[#444] w-20">{price.billing_model}</span>
                                <span className="text-[#4ADE80]">
                                  {price.unit_price != null ? `$${price.unit_price} per ${price.volume_field || "event"}` : price.amount != null ? `$${price.amount.toFixed(2)}/month` : "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {customer.subscriptions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center font-mono text-sm text-[#555]">$ no subscriptions <span className="animate-pulse">█</span></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== AUTO TOP-UP TAB ==================== */}
      {activeTab === "autotopup" && (
        <div className="grid grid-cols-2 gap-4">
          {customer.wallet.accounts.map((account) => {
            const code = account.asset_code;
            const cfg = customer.auto_topup?.[code];
            const isFiat = allAssets.find(a => a.code === code)?.type === "fiat";
            const enabled = cfg?.enabled || false;

            return (
              <div key={code} className="bg-[#0d0d0d] border border-solid border-[#1a1a1a] p-5">
                {terminalHeader(`AUTO TOP-UP · ${code}`)}
                <div className="space-y-0">
                  <div className="flex justify-between py-2 font-mono text-[13px] border-b border-solid border-[#1a1a1a]">
                    <span className="text-[#555]">Status</span>
                    <span className={enabled ? "text-[#4ADE80]" : "text-[#ef4444]"}>
                      {enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 font-mono text-[13px] border-b border-solid border-[#1a1a1a]">
                    <span className="text-[#555]">Threshold</span>
                    <span className="text-white">
                      {enabled && cfg ? `${isFiat ? "$" : ""}${cfg.threshold.toFixed(isFiat ? 2 : 0)}${!isFiat ? ` ${code}` : ""}` : "Not configured"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 font-mono text-[13px] border-b border-solid border-[#1a1a1a]">
                    <span className="text-[#555]">Top-up Amount</span>
                    <span className="text-white">
                      {enabled && cfg ? `${isFiat ? "$" : ""}${cfg.amount.toFixed(isFiat ? 2 : 0)}${!isFiat ? ` ${code}` : ""}` : "Not configured"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 font-mono text-[13px]">
                    <span className="text-[#555]">Linked Subscriptions</span>
                    <span className="text-white">{customer.subscriptions.filter(s => s.status === "active").length} active</span>
                  </div>
                </div>
              </div>
            );
          })}
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
        <DialogContent className="border-solid border-[#1a1a1a] sm:max-w-sm p-0 gap-0 bg-[#0d0d0d]">
          <div className="border-b border-solid border-[#1a1a1a] px-8 py-4">
            <span className="font-mono text-[11px] text-[#444]">├─ TOP UP WALLET ──────────────────────</span>
          </div>
          <div className="space-y-4 px-8 py-6">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#555] mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#555]">$</span>
                <input type="number" step="any" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} placeholder="25.00" autoFocus
                  className="w-full border border-solid border-[#1e1e1e] bg-transparent py-2 pl-7 pr-3 font-mono text-sm text-white focus:outline-none focus:border-[#333]" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-solid border-[#1a1a1a] px-8 py-4">
            <button onClick={() => setShowTopupModal(false)} className="border border-solid border-[#333] bg-transparent px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white hover:bg-white/5">Cancel</button>
            <button onClick={handleTopup} className="bg-white text-black px-4 py-2 font-mono text-[11px] uppercase tracking-wide hover:bg-white/90">Confirm Top Up</button>
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
