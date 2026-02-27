import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { customers } from "@/data/customers";
import { events } from "@/data/events";
import { useProductStore } from "@/stores/productStore";
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
} from "recharts";

const totalCustomers = customers.length;
const activeWallets = customers.filter(c => c.status === "active").length;
const totalBalance = customers.reduce((sum, c) => {
  const usdAccount = c.wallet.accounts.find(a => a.asset_code === "USD");
  return sum + (usdAccount?.available || 0);
}, 0);
const todayCount = 12;
const todayBilled = 4.20;
const avgWalletBal = totalBalance / Math.max(1, activeWallets);

function generateChartData() {
  const data = [];
  const now = new Date("2026-02-25");
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;
    const dayEvents = events.filter(e => e.timestamp.startsWith(date.toISOString().split("T")[0]));
    const revenue = dayEvents.reduce((s, e) => s + (e.fees?.reduce((fs, f) => fs + (f.asset_code === "USD" ? f.amount : 0), 0) || 0), 0);
    data.push({ day: dayLabel, revenue: +revenue.toFixed(2) });
  }
  return data;
}

const chartData = generateChartData();
const recentEvents = events.slice(0, 5);

function formatTime(ts: string) {
  const d = new Date(ts);
  const mo = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${mo} ${day} ${h}:${m}:${s}`;
}

const profitabilityLeaders: Record<string, { name: string; id: string; amount: number; events: number }> = {
  chat_completion: { name: "Acme Corp", id: "cust_01", amount: 1.64, events: 11 },
  image_generation: { name: "DataFlow Inc", id: "cust_04", amount: 0.24, events: 6 },
  api_call: { name: "TechStart AI", id: "cust_02", amount: 0.01, events: 5 },
};

const powerUserBreakdowns: Record<string, { type: string; events: number; amount: number; pct: number; isLeader: boolean }[]> = {
  cust_01: [
    { type: "chat_completion", events: 11, amount: 1.64, pct: 89, isLeader: true },
    { type: "image_generation", events: 3, amount: 0.18, pct: 11, isLeader: false },
  ],
  cust_03: [
    { type: "chat_completion", events: 8, amount: 0.63, pct: 100, isLeader: false },
  ],
  cust_02: [
    { type: "chat_completion", events: 5, amount: 0.39, pct: 81, isLeader: false },
    { type: "api_call", events: 4, amount: 0.09, pct: 19, isLeader: false },
  ],
  cust_06: [
    { type: "image_generation", events: 4, amount: 0.16, pct: 76, isLeader: false },
    { type: "chat_completion", events: 2, amount: 0.05, pct: 24, isLeader: false },
  ],
  cust_05: [
    { type: "chat_completion", events: 5, amount: 0.18, pct: 100, isLeader: false },
  ],
};

export default function Overview() {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      {/* Stat Row */}
      <div className="flex items-stretch divide-x divide-dotted divide-white/20">
        {[
          { label: "TOTAL CUSTOMERS", value: totalCustomers, delta: "+2 this month", deltaColor: "text-green-400" },
          { label: "ACTIVE WALLETS", value: activeWallets, delta: `$${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} total balance`, deltaColor: "text-white/40" },
          { label: "EVENTS TODAY", value: todayCount, delta: `$${todayBilled.toFixed(2)} billed`, deltaColor: "text-green-400" },
          { label: "AVG WALLET BAL", value: `$${avgWalletBal.toFixed(2)}`, delta: null, deltaColor: "" },
        ].map((stat) => (
          <div key={stat.label} className="flex-1 px-6 first:pl-0 last:pr-0">
            <div className="font-mono text-xs uppercase tracking-widest text-white/40 mb-2">{stat.label}</div>
            <div className="font-mono text-3xl font-bold text-white">{stat.value}</div>
            {stat.delta && <div className={`font-mono text-xs mt-1 ${stat.deltaColor}`}>{stat.delta}</div>}
          </div>
        ))}
      </div>

      {/* Revenue Chart + Recent Events */}
      <div className="grid grid-cols-5 gap-10">
        <div className="col-span-3">
          <div className="font-mono text-xs uppercase tracking-widest text-white/40 mb-4">REVENUE — LAST 30 DAYS</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono", fill: "rgba(255,255,255,0.3)" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, background: "#030712", border: "1px dotted rgba(255,255,255,0.20)", borderRadius: 0 }} />
              <Area type="monotone" dataKey="revenue" stroke="#4ADE80" fill="rgba(74,222,128,0.08)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="col-span-2">
          <div className="font-mono text-xs uppercase tracking-widest text-white/40 mb-4">RECENT EVENTS</div>
          <div className="border border-dotted border-white/20">
            {recentEvents.map((event) => {
              const feeAmount = event.fees?.[0]
                ? `$${event.fees[0].amount.toFixed(4)}`
                : "";
              return (
                <div key={event.id} className="flex items-center gap-3 border-b border-dotted border-white/15 py-3 px-4 last:border-b-0">
                  <span className="font-mono text-xs text-white/40 w-28 shrink-0">{formatTime(event.timestamp)}</span>
                  <span className="font-mono text-xs font-medium flex-1">{event.customer_name}</span>
                  <span className="font-mono text-xs text-white/50">{event.event_type}</span>
                  <span className="font-mono text-xs text-green-400 ml-auto">{feeAmount}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Profitability + Wallet Health + Power Users */}
      <div className="grid grid-cols-[3fr_2fr_2fr] gap-6 mt-8">
        {/* LEFT — Profitability */}
        <div className="border border-dotted border-white/20 p-6">
          <div className="font-mono text-xs text-white/50 mb-1">┌─ PROFITABILITY BY EVENT TYPE ──────────────────────────┐</div>
          <div className="flex justify-end gap-6 text-xs text-white/40 font-mono uppercase mb-4">
            <span>REVENUE</span><span>COST</span><span>MARGIN</span>
          </div>
          <div className="space-y-0">
            {[
              { type: "chat_completion", count: 38, customers: 6, revenue: 2.85, cost: 1.71, margin: 40 },
              { type: "image_generation", count: 12, customers: 4, revenue: 0.48, cost: 0.29, margin: 40 },
              { type: "api_call", count: 5, customers: 2, revenue: 0.01, cost: 0.00, margin: 100 },
            ].map((row, i, arr) => {
              const leader = profitabilityLeaders[row.type];
              return (
              <div key={row.type} className={`pb-5 ${i < arr.length - 1 ? "border-b border-dotted border-white/15 mb-5" : ""}`}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="font-mono text-sm text-white">{row.type}</span>
                    <span className="text-xs text-white/30 ml-2">{row.count.toLocaleString()} EVENTS</span>
                    <span className="text-xs text-white/15 mx-1">·</span>
                    <span className="text-xs text-white/30">{row.customers} CUSTOMERS</span>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <div className="text-right">
                      <span className="text-green-400 font-mono font-bold">${row.revenue.toFixed(2)}</span>
                      <div className="text-xs text-white/40 uppercase font-mono">REVENUE</div>
                    </div>
                    <div className="text-right">
                      <span className="text-red-400 font-mono">${row.cost.toFixed(2)}</span>
                      <div className="text-xs text-white/40 uppercase font-mono">COST</div>
                    </div>
                    <div className="text-right">
                      <span className="text-green-400 font-mono text-lg font-bold">{row.margin}%</span>
                      <div className="text-xs text-white/40 uppercase font-mono">MARGIN</div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="w-full h-1 bg-white/5"><div className="h-1 bg-red-400/60" style={{ width: `${row.cost / Math.max(row.revenue, 0.01) * 100}%` }} /></div>
                  <div className="w-full h-1 bg-white/5"><div className="h-1 bg-green-400/60 w-full" /></div>
                </div>
                {leader && (
                  <div className="border-t border-dotted border-white/[0.12] mt-2 pt-2">
                    <span className="text-xs text-white/20 font-mono">↑ led by </span>
                    <span
                      className="text-xs text-white/60 font-mono font-medium cursor-pointer hover:text-white/80"
                      onClick={() => navigate(`/customers/${leader.id}`)}
                    >{leader.name}</span>
                    <span className="text-xs text-white/30 font-mono"> ${leader.amount.toFixed(2)} · {leader.events} events</span>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        </div>

        {/* MIDDLE — Wallet Health */}
        <div className="border border-dotted border-white/20 p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="font-mono text-xs text-white/50">┌─ WALLET HEALTH ──────────────────────────┐</div>
            {customers.some(c => {
              const usd = c.wallet.accounts.find(a => a.asset_code === "USD");
              const cr = c.wallet.accounts.find(a => a.asset_code === "CREDITS");
              return (usd && usd.available < 10) || (cr && cr.available < 100);
            }) && (
              <span className="text-amber-400 text-xs font-mono">⚠ {customers.filter(c => {
                const usd = c.wallet.accounts.find(a => a.asset_code === "USD");
                const cr = c.wallet.accounts.find(a => a.asset_code === "CREDITS");
                return (usd && usd.available < 10) || (cr && cr.available < 100);
              }).length} low</span>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {customers.map((c) => {
              const usd = c.wallet.accounts.find(a => a.asset_code === "USD");
              const cr = c.wallet.accounts.find(a => a.asset_code === "CREDITS");
              const isLowUsd = usd && usd.available < 10;
              const isLowCr = cr && cr.available > 0 && cr.available < 100;
              const isLow = isLowUsd || isLowCr;
              return (
                <div key={c.id} className="flex items-center justify-between py-3 border-b border-dotted border-white/15">
                  <div>
                    <div className="font-mono text-sm font-medium text-white">{c.name}</div>
                    <div className="text-xs text-white/30 font-mono mt-0.5">{c.id}</div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right">
                      {usd && usd.available > 0 && <div className="font-mono text-sm text-white">${usd.available.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>}
                      {cr && cr.available > 0 && <div className="font-mono text-xs text-teal-400">{cr.available.toLocaleString()} CR</div>}
                      {(!usd || usd.available === 0) && (!cr || cr.available === 0) && <div className="font-mono text-sm text-white/30">$0.00</div>}
                    </div>
                    {isLow && <span className="border border-dotted border-amber-400/60 text-amber-400 text-xs px-2 py-0.5 font-mono ml-2">LOW</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Power Users */}
        <div className="border border-dotted border-white/20 p-6">
          <div className="font-mono text-xs text-white/50 mb-1">┌─ POWER USERS ──────────────────────────┐</div>
          <div className="text-xs text-white/40 font-mono mb-4">by spend, last 30 days</div>
          <div>
            {[
              { rank: 1, name: "Acme Corp", id: "cust_01", spend: 1.82, eventCount: 14 },
              { rank: 2, name: "Neural Labs", id: "cust_03", spend: 0.63, eventCount: 8 },
              { rank: 3, name: "TechStart AI", id: "cust_02", spend: 0.48, eventCount: 9 },
              { rank: 4, name: "Orbit AI", id: "cust_06", spend: 0.21, eventCount: 6 },
              { rank: 5, name: "CloudMind", id: "cust_05", spend: 0.18, eventCount: 5 },
            ].map((user) => {
              const isExpanded = expandedUser === user.id;
              const breakdown = powerUserBreakdowns[user.id] || [];
              return (
                <div key={user.id} className={`border-b border-dotted border-white/15 ${isExpanded ? "bg-white/[0.02]" : ""}`}>
                  <div
                    className="flex items-center justify-between py-3 cursor-pointer"
                    onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                  >
                    <div className="flex items-start">
                      <span className={`text-white/20 text-xs mr-1 transition-transform duration-150 inline-block ${isExpanded ? "rotate-90" : ""}`}>›</span>
                      <span className="text-xs text-white/20 font-mono w-5 shrink-0">#{user.rank}</span>
                      <div className="ml-3">
                        <div className="font-mono text-sm font-medium text-white">{user.name}</div>
                        <div className="text-xs text-white/30 font-mono mt-0.5">{user.id}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white text-sm">${user.spend.toFixed(2)}</div>
                      <div className="text-xs text-white/30 font-mono mt-0.5">{user.eventCount} events</div>
                    </div>
                  </div>
                  {isExpanded && breakdown.length > 0 && (
                    <div className="border-t border-dotted border-white/[0.12] mt-0 pt-3 ml-8 space-y-2 pb-3">
                      {breakdown.map((b) => (
                        <div key={b.type} className="flex items-center">
                          <span className="text-xs font-mono text-white/70 w-36 shrink-0">{b.type}</span>
                          <span className="text-xs text-white/30 font-mono w-16">{b.events} events</span>
                          <span className="text-xs text-green-400 font-mono w-14">${b.amount.toFixed(2)}</span>
                          <div className="h-0.5 bg-white/10 flex-1 mx-3">
                            <div className="h-0.5 bg-green-400/60" style={{ width: `${b.pct}%` }} />
                          </div>
                          <span className="text-xs text-white/20 font-mono w-10 text-right">{b.pct}%</span>
                          {b.isLeader && <span className="text-amber-400 text-xs font-mono ml-2">★ top spender</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t border-dotted border-white/20 pt-3 mt-2 text-xs text-white/30 font-mono">
            Top 5 of 8 customers · based on billed events
          </div>
        </div>
      </div>
    </div>
  );
}
