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

const recentEvents = events.slice(0, 10);

function formatTime(ts: string) {
  const d = new Date(ts);
  const mo = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${mo} ${day} ${h}:${m}:${s}`;
}

export default function Overview() {
  return (
    <div className="space-y-10">
      {/* Stat Row */}
      <div className="flex items-stretch divide-x divide-white/[0.08]">
        {[
          { label: "TOTAL CUSTOMERS", value: totalCustomers, delta: "+2 this month", deltaColor: "text-[#4ADE80]" },
          { label: "ACTIVE WALLETS", value: activeWallets, delta: `$${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} total balance`, deltaColor: "text-white/40" },
          { label: "EVENTS TODAY", value: todayCount, delta: `$${todayBilled.toFixed(2)} billed`, deltaColor: "text-[#4ADE80]" },
          { label: "AVG WALLET BAL", value: `$${avgWalletBal.toFixed(2)}`, delta: null, deltaColor: "" },
        ].map((stat) => (
          <div key={stat.label} className="flex-1 px-6 first:pl-0 last:pr-0">
            <div className="font-space text-xs uppercase tracking-wider text-white/40 mb-2">{stat.label}</div>
            <div className="font-ibm-plex text-3xl font-bold text-white">{stat.value}</div>
            {stat.delta && <div className={`font-ibm-plex text-xs mt-1 ${stat.deltaColor}`}>{stat.delta}</div>}
          </div>
        ))}
      </div>

      {/* Revenue Chart + Recent Events */}
      <div className="grid grid-cols-5 gap-10">
        <div className="col-span-3">
          <div className="font-space text-xs uppercase tracking-wider text-white/40 mb-4">REVENUE — LAST 30 DAYS</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono", fill: "rgba(255,255,255,0.3)" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, background: "#0F0F0F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0 }} />
              <Area type="monotone" dataKey="revenue" stroke="#4ADE80" fill="rgba(74,222,128,0.08)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="col-span-2">
          <div className="font-space text-xs uppercase tracking-wider text-white/40 mb-4">RECENT EVENTS</div>
          <div className="space-y-0">
            {recentEvents.map((event) => {
              const feeAmount = event.fees?.[0]
                ? `$${event.fees[0].amount.toFixed(4)}`
                : "";
              return (
                <div key={event.id} className="flex items-center gap-3 border-b border-white/[0.06] py-3">
                  <span className="font-ibm-plex text-xs text-white/40 w-28 shrink-0">{formatTime(event.timestamp)}</span>
                  <span className="font-ibm-plex text-xs font-medium flex-1">{event.customer_name}</span>
                  <span className="font-ibm-plex text-xs text-white/50">{event.event_type}</span>
                  <span className="font-ibm-plex text-xs text-[#4ADE80] ml-auto">{feeAmount}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}