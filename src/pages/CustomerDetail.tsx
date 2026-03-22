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

function formatDateShort(ts: string) {
  const d = new Date(ts);
  const mo = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const yr = d.getFullYear();
  return `${mo} ${day}, ${yr}`;
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
  const [walletPeriod, setWalletPeriod] = useState("30");
  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [configAsset, setConfigAsset] = useState("USD");
  const [configThreshold, setConfigThreshold] = useState("");
  const [configAmount, setConfigAmount] = useState("");
  const [inlineTopupAsset, setInlineTopupAsset] = useState<string | null>(null);
  const [inlineTopupValue, setInlineTopupValue] = useState("20.00");
  const [inlineTopupStatus, setInlineTopupStatus] = useState<"idle" | "done">("idle");

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
  const charges = customer.wallet.transactions.filter((t) => t.type === "charge");
  const assetCodes = customer.wallet.accounts.map((a) => a.asset_code);

  const hasChartData = chartData.some((d) => d.spend > 0);

  const lastEvent = customerEvents.length > 0 ? customerEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] : null;

  const INITIAL_EVENT_COUNT = 10;
  const visibleEvents = eventsShowAll ? customerEvents : customerEvents.slice(0, INITIAL_EVENT_COUNT);

  const selectedEventObj = selectedEvent ? customerEvents.find((e) => e.id === selectedEvent) : null;

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

  // Auto top-up: any enabled?
  const anyTopupEnabled = customer.auto_topup ? Object.values(customer.auto_topup).some(c => c.enabled) : false;

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

      {/* ===== WALLET CARDS — 2 side-by-side ===== */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[10px] uppercase text-[#555] tracking-wider">Wallet</div>
        <select
          value={walletPeriod}
          onChange={(e) => setWalletPeriod(e.target.value)}
          className="border border-solid border-[#1e1e1e] text-[#555] text-[10px] px-2.5 py-1 font-mono bg-transparent appearance-none cursor-pointer hover:text-white/60 focus:outline-none"
        >
          <option value="month" className="bg-[#0d0d0d] text-white">This month</option>
          <option value="30" className="bg-[#0d0d0d] text-white">Last 30 days</option>
          <option value="all" className="bg-[#0d0d0d] text-white">All time</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {customer.wallet.accounts.map((account) => {
          const isFiat = account.asset_code === "USD";
          const symbol = isFiat ? "$" : account.asset_code[0];
          const formatVal = (v: number) => isFiat ? `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${v.toLocaleString()} ${account.asset_code}`;
          const acctTopups = topups.filter((t) => t.asset_code === account.asset_code).reduce((s, t) => s + t.amount, 0);
          const acctSpent = charges.filter((t) => t.asset_code === account.asset_code).reduce((s, t) => s + Math.abs(t.amount), 0);
          const totalBal = account.available + account.pending_out;
          const balColor = totalBal >= 0 ? "text-[#4ADE80]" : "text-[#ef4444]";

          return (
            <div key={account.asset_code} className="border border-solid border-white/[0.08] p-4">
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-white/[0.05] flex items-center justify-center font-mono text-[10px] text-[#555] font-bold">
                    {symbol}
                  </div>
                  <div>
                    <div className="font-mono text-xs font-bold text-white">{isFiat ? "US Dollar" : account.asset_code}</div>
                    <div className="font-mono text-[9px] text-[#444]">{account.asset_code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-mono text-lg font-bold ${balColor}`}>{formatVal(totalBal)}</div>
                  <div className="font-mono text-[9px] text-[#444]">Available</div>
                </div>
              </div>
              {/* Stats row */}
              <div className="border-t border-solid border-white/[0.06] pt-3 grid grid-cols-3 gap-2">
                <div>
                  <div className="font-mono text-[9px] uppercase text-[#444] tracking-wider mb-0.5">Available</div>
                  <div className="font-mono text-[12px] text-white">{formatVal(account.available)}</div>
                  <div className="font-mono text-[9px] text-[#333] mt-0.5">{isFiat ? `$${account.pending_out.toFixed(2)} reserved` : `${account.pending_out} reserved`}</div>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase text-[#444] tracking-wider mb-0.5">Top-ups</div>
                  <div className="font-mono text-[12px] text-white">{formatVal(acctTopups)}</div>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase text-[#444] tracking-wider mb-0.5">Spent</div>
                  <div className="font-mono text-[12px] text-white">{formatVal(acctSpent)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== STATS ROW — 4 columns with dividers ===== */}
      <div className="grid grid-cols-4 mb-6">
        <div className="pr-4 py-3">
          <div className="font-mono text-[10px] uppercase text-[#555] tracking-wider mb-1">Last Activity</div>
          <div className="font-mono text-[13px] text-white font-bold">{lastEvent ? formatTime(lastEvent.timestamp) : "—"}</div>
        </div>
        <div className="px-4 py-3 border-l border-solid border-white/[0.06]">
          <div className="font-mono text-[10px] uppercase text-[#555] tracking-wider mb-1">Total Events</div>
          <div className="font-mono text-[13px] text-white font-bold">{customerEvents.length}</div>
        </div>
        <div className="px-4 py-3 border-l border-solid border-white/[0.06]">
          <div className="font-mono text-[10px] uppercase text-[#555] tracking-wider mb-1">Subscription</div>
          <div className="font-mono text-[13px] text-white font-bold">{customer.subscriptions.filter(s => s.status === "active").length} active</div>
        </div>
        <div className="pl-4 py-3 border-l border-solid border-white/[0.06]">
          <div className="font-mono text-[10px] uppercase text-[#555] tracking-wider mb-1">Auto Top-Up</div>
          <div className={`font-mono text-[13px] font-bold ${anyTopupEnabled ? "text-[#4ADE80]" : "text-[#ef4444]"}`}>
            {anyTopupEnabled ? "Enabled" : "Disabled"}
          </div>
        </div>
      </div>

      {/* ===== RECENT SPEND + SUBSCRIBED PRODUCTS (side by side) ===== */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Chart — 3/4 width */}
        <div className="col-span-3 border border-solid border-white/[0.08] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-mono text-[10px] uppercase text-[#555] tracking-wider">Recent Spend</div>
            <div className="flex items-center gap-2">
              {assetCodes.length > 1 && (
                <div className="flex gap-0">
                  {assetCodes.map((code) => (
                    <button
                      key={code}
                      onClick={() => setChartAsset(code)}
                      className={`text-[10px] px-2.5 py-1 font-mono border border-solid border-white/[0.08] ${chartAsset === code ? "bg-white text-black" : "text-[#555] hover:text-white/60"} ${code !== assetCodes[0] ? "-ml-px" : ""}`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              )}
              <select
                value={chartRange}
                onChange={(e) => setChartRange(e.target.value as "7" | "30" | "90")}
                className="border border-solid border-white/[0.08] text-[#555] text-[10px] px-2.5 py-1 font-mono bg-transparent appearance-none cursor-pointer hover:text-white/60 focus:outline-none"
              >
                <option value="7" className="bg-[#0d0d0d] text-white">7 days</option>
                <option value="30" className="bg-[#0d0d0d] text-white">30 days</option>
                <option value="90" className="bg-[#0d0d0d] text-white">90 days</option>
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

        {/* Subscribed Products — 1/4 width */}
        <div className="col-span-1 border border-solid border-white/[0.08] p-4">
          <div className="font-mono text-[10px] uppercase text-[#555] tracking-wider mb-3">Subscribed Products</div>
          <div className="space-y-3">
            {customer.subscriptions.map((sub) => {
              const product = products.find((p) => p.id === sub.product_id);
              const price = product?.prices?.[0];
              return (
                <div key={sub.id} className="border border-solid border-white/[0.06] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] text-white font-bold">{sub.product_name}</span>
                    <span className={`text-[9px] font-mono uppercase ${sub.status === "active" ? "text-[#4ADE80]" : "text-[#FACC15]"}`}>
                      {sub.status}
                    </span>
                  </div>
                  {price && (
                    <div className="font-mono text-[9px] text-[#444]">
                      {price.billing_model === "recurring" ? "Recurring" : "Per-event"} · ${price.unit_price || price.amount || 0} / {price.event_type || "month"}
                    </div>
                  )}
                  <div className="font-mono text-[9px] text-[#333] mt-1">Since {formatDateShort(sub.start_date)}</div>
                </div>
              );
            })}
            {customer.subscriptions.length === 0 && (
              <div className="font-mono text-[10px] text-[#444]">No subscriptions</div>
            )}
          </div>
          <button className="mt-3 font-mono text-[10px] text-[#555] hover:text-white cursor-pointer">+ Add subscription</button>
        </div>
      </div>

      {/* ===== TAB BAR ===== */}
      <div className="flex gap-0 border-b border-solid border-white/[0.06] mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-[11px] font-mono uppercase tracking-[0.1em] cursor-pointer ${activeTab === tab.key ? "text-white border-b-2 border-solid border-white -mb-px font-bold" : "text-[#555] hover:text-white/60"}`}
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
              <tr className="border-b border-solid border-white/[0.08]">
                <th className="w-[16%] px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Timestamp</th>
                <th className="w-[14%] px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Event Type</th>
                <th className="w-[16%] px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Event ID</th>
                <th className="w-[26%] px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Description</th>
                <th className="w-[8%] px-3 py-2.5 text-center font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Fee</th>
                <th className="w-[12%] px-3 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider text-[#555] whitespace-nowrap">Total</th>
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
                  <tr key={event.id} className="border-b border-solid border-white/[0.06] hover:bg-white/[0.02] cursor-pointer" onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}>
                    <td className="px-3 py-3 font-mono text-[12px] text-white whitespace-nowrap">{formatTime(event.timestamp)}</td>
                    <td className="px-3 py-3 font-mono text-[12px] text-white whitespace-nowrap">{event.event_type}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-[#555] whitespace-nowrap">
                      {truncateId(event.id)}
                      <CopyBtn text={event.id} />
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-[#555] truncate">{description}</td>
                    <td className="px-3 py-3 text-center">
                      {event.status === "processed" ? (
                        <CheckCircle size={13} className="text-[#4ADE80] mx-auto" />
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
            <div className="flex justify-center pt-4 mt-2 border-t border-solid border-white/[0.06]">
              <button onClick={() => setEventsShowAll(true)} className="text-[11px] font-mono uppercase tracking-wide text-[#555] hover:text-white cursor-pointer">Load More ({customerEvents.length - INITIAL_EVENT_COUNT} remaining)</button>
            </div>
          )}
        </div>
      )}

      {/* ==================== SUBSCRIPTIONS TAB ==================== */}
      {activeTab === "subscriptions" && (
        <div>
          <div className="flex items-center justify-end mb-4">
            <button className="border border-solid border-[#333] bg-transparent px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white hover:bg-white/5">+ Add Subscription</button>
          </div>
          <div className="space-y-0">
            {customer.subscriptions.map((sub) => {
              const product = products.find((p) => p.id === sub.product_id);
              const isExpanded = expandedSub === sub.id;
              return (
                <div key={sub.id}>
                  <div
                    className="flex items-center justify-between py-3 px-3 border-b border-solid border-white/[0.06] hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => setExpandedSub(isExpanded ? null : sub.id)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[11px] text-[#555]">
                        {truncateId(sub.id)}
                        <CopyBtn text={sub.id} />
                      </span>
                      <span className={`border text-[10px] px-1.5 py-0.5 font-mono uppercase ${sub.status === "active" ? "border-[#4ADE80]/40 text-[#4ADE80]" : "border-[#FACC15]/40 text-[#FACC15]"}`}>
                        {sub.status}
                      </span>
                      <span className="font-mono text-[11px] text-[#555]">Started {formatDateShort(sub.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      {sub.status === "active" && (
                        <button className="border border-solid border-[#ef4444]/30 text-[#ef4444] bg-transparent px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide hover:bg-[#ef4444]/5">Unsubscribe</button>
                      )}
                      <span className="text-[#333] text-[10px] font-mono">{isExpanded ? "▾" : "▸"}</span>
                    </div>
                  </div>
                  {isExpanded && product && (
                    <div className="px-6 py-3 border-b border-solid border-white/[0.06] bg-white/[0.01]">
                      <div className="font-mono text-[10px] uppercase text-[#555] tracking-wider mb-2">Products</div>
                      {product.prices.map((price) => (
                        <div key={price.id} className="flex items-center justify-between py-1.5">
                          <span className="font-mono text-[11px] text-white">{product.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[9px] text-[#444]">
                              {price.billing_model === "recurring" ? "Recurring" : "Per-event"} · ${price.unit_price || price.amount || 0} / {price.event_type || "month"}
                            </span>
                            <span className="text-[9px] font-mono text-[#4ADE80] uppercase">Active</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {customer.subscriptions.length === 0 && (
              <div className="py-8 text-center font-mono text-sm text-[#555]">$ no subscriptions <span className="animate-pulse">█</span></div>
            )}
          </div>
        </div>
      )}

      {/* ==================== AUTO TOP-UP TAB ==================== */}
      {activeTab === "autotopup" && (
        <div className="space-y-4">
          {customer.wallet.accounts.map((account) => {
            const code = account.asset_code;
            const cfg = customer.auto_topup?.[code];
            const enabled = cfg?.enabled || false;
            const isFiat = allAssets.find(a => a.code === code)?.type === "fiat";
            const formatVal = (v: number) => isFiat ? `$${v.toFixed(2)}` : `${v} ${code}`;
            const isInlineOpen = inlineTopupAsset === code;

            return (
              <div key={code} className="border border-solid border-white/[0.08] p-5">
                <div className="font-mono text-[11px] text-[#444] mb-4">├─ AUTO TOP-UP · {code} ──────────────────────</div>
                <div className="space-y-0">
                  <div className="flex justify-between items-center py-2.5 border-b border-solid border-white/[0.06]">
                    <span className="font-mono text-[12px] text-[#555]">Status</span>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-[12px] ${enabled ? "text-[#4ADE80]" : "text-[#ef4444]"}`}>
                        • {enabled ? "Enabled" : "Disabled"}
                      </span>
                      {!enabled && (
                        <button className="border border-solid border-[#333] bg-transparent px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-white hover:bg-white/5">Enable</button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-solid border-white/[0.06]">
                    <span className="font-mono text-[12px] text-[#555]">Threshold</span>
                    <span className="font-mono text-[12px] text-white">
                      {enabled && cfg ? formatVal(cfg.threshold) : "Not configured"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-solid border-white/[0.06]">
                    <span className="font-mono text-[12px] text-[#555]">Top-up amount</span>
                    <span className="font-mono text-[12px] text-white">
                      {enabled && cfg ? formatVal(cfg.amount) : "Not configured"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="font-mono text-[12px] text-[#555]">Linked subscriptions</span>
                    <span className="font-mono text-[12px] text-white">{customer.subscriptions.filter(s => s.status === "active").length} active</span>
                  </div>
                </div>

                {/* Inline top-up row */}
                {isInlineOpen && (
                  <div className="border-t border-solid border-white/[0.06] pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-[10px] text-white font-bold">Auto Top-up:</span>
                      <span className={`font-mono text-[10px] font-bold ${enabled ? "text-[#4ADE80]" : "text-[#ef4444]"}`}>{enabled ? "ON" : "OFF"}</span>
                    </div>
                    <div className="flex items-stretch">
                      <div className="flex-1 flex items-center border border-solid border-[#333] bg-[#0a0a0a]">
                        <span className="font-mono text-[12px] text-[#4ADE80] pl-2.5 select-none">{isFiat ? "$" : code[0]}</span>
                        <input
                          type="number" step="any" value={inlineTopupValue}
                          onChange={(e) => setInlineTopupValue(e.target.value)}
                          className="flex-1 bg-transparent font-mono text-[12px] text-white px-2 py-2 focus:outline-none"
                          placeholder="20.00"
                        />
                        {inlineTopupValue && (
                          <button onClick={() => setInlineTopupValue("")} className="text-[#555] hover:text-white/60 pr-2 font-mono text-[12px]">×</button>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const amount = parseFloat(inlineTopupValue);
                          if (!amount || amount <= 0) return;
                          setInlineTopupStatus("done");
                          toast({ title: "done: Top-up processed", description: `${isFiat ? "$" : ""}${amount.toFixed(isFiat ? 2 : 0)}${!isFiat ? ` ${code}` : ""} added to wallet.` });
                          setTimeout(() => { setInlineTopupStatus("idle"); setInlineTopupValue(""); }, 2000);
                        }}
                        className={`font-mono text-[11px] font-bold uppercase tracking-wide px-4 py-2 ${inlineTopupStatus === "done" ? "bg-[#4ADE80] text-black" : "bg-[#16a34a] text-black hover:bg-[#15803d]"}`}
                      >
                        {inlineTopupStatus === "done" ? "✓ DONE" : "TOP UP"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-4">
                  <button
                    className="border border-solid border-[#333] bg-transparent px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white hover:bg-white/5"
                    onClick={() => {
                      setConfigAsset(code);
                      setConfigThreshold(enabled && cfg ? String(cfg.threshold) : "");
                      setConfigAmount(enabled && cfg ? String(cfg.amount) : "");
                      setShowConfigureModal(true);
                    }}
                  >Configure auto top-up</button>
                  <button
                    className="border border-solid border-[#333] bg-transparent px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white hover:bg-white/5"
                    onClick={() => {
                      setInlineTopupAsset(isInlineOpen ? null : code);
                      setInlineTopupValue("20.00");
                      setInlineTopupStatus("idle");
                    }}
                  >+ Add funds manually</button>
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

      {/* Configure Auto Top-Up Modal */}
      <Dialog open={showConfigureModal} onOpenChange={setShowConfigureModal}>
        <DialogContent className="border-solid border-[#1a1a1a] sm:max-w-md p-0 gap-0 bg-[#0d0d0d]">
          {(() => {
            const primaryCode = customer.wallet.accounts[0]?.asset_code || "USD";
            const cfg = customer.auto_topup?.[primaryCode];
            const enabled = cfg?.enabled || false;
            const isFiat = allAssets.find(a => a.code === primaryCode)?.type === "fiat";
            const symbol = isFiat ? "$" : primaryCode[0];

            return (
              <>
                <div className="border-b border-solid border-[#1a1a1a] px-8 py-4">
                  <div className="font-mono text-[11px] text-[#444]">├─ CONFIGURE AUTO TOP-UP - {primaryCode} ──────────</div>
                  <div className="font-mono text-[10px] text-[#555] mt-1">
                    Auto Top-Up {enabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
                <div className="space-y-5 px-8 py-6">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#555] mb-2">When balance falls below</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#ef4444]">{symbol}</span>
                      <input
                        type="number" step="any" value={configThreshold}
                        onChange={(e) => setConfigThreshold(e.target.value)}
                        placeholder="10"
                        className="w-full border border-solid border-[#1e1e1e] bg-transparent py-2 pl-7 pr-3 font-mono text-sm text-white focus:outline-none focus:border-[#333]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#555] mb-2">Automatically top up</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#4ADE80]">{symbol}</span>
                      <input
                        type="number" step="any" value={configAmount}
                        onChange={(e) => setConfigAmount(e.target.value)}
                        placeholder="20"
                        className="w-full border border-solid border-[#1e1e1e] bg-transparent py-2 pl-7 pr-3 font-mono text-sm text-white focus:outline-none focus:border-[#333]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#555] mb-2">Payment method</label>
                    <div className="border border-dashed border-[#333] p-4 flex items-center justify-center">
                      <span className="font-mono text-[12px] text-[#555]">⊕ ADD CARD</span>
                    </div>
                    <div className="font-mono text-[9px] text-[#444] mt-1.5">To enable auto top-up, please add a card first</div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-solid border-[#1a1a1a] px-8 py-4">
                  <button onClick={() => setShowConfigureModal(false)} className="border border-solid border-[#333] bg-transparent px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white hover:bg-white/5">Cancel</button>
                  <button
                    disabled
                    className="bg-[#16a34a] text-white px-4 py-2 font-mono text-[11px] uppercase tracking-wide font-bold opacity-40 cursor-not-allowed"
                  >Enable</button>
                </div>
              </>
            );
          })()}
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
