import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { customers } from "@/data/customers";
import { events } from "@/data/events";
import { vendors } from "@/data/vendors";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// KPI calculations
const totalCustomers = customers.length;
const totalRevenue = customers.reduce((sum, c) => {
  return sum + c.wallet.transactions
    .filter(t => t.type === "charge")
    .reduce((s, t) => s + Math.abs(t.amount), 0);
}, 0);
const totalCosts = vendors.reduce((sum, v) => sum + v.total_costs, 0);
const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;

// Generate 30-day chart data
function generateChartData() {
  const data = [];
  const now = new Date("2025-02-23");
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStr = date.toISOString().split("T")[0];
    const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;
    const dayEvents = events.filter(e => e.timestamp.startsWith(dayStr));
    const revenue = dayEvents.reduce((s, e) => s + (e.fees?.reduce((fs, f) => fs + (f.asset_code === "USD" ? f.amount : 0), 0) || 0), 0);
    const costs = dayEvents.reduce((s, e) => s + (e.costs?.reduce((cs, c) => cs + c.amount, 0) || 0), 0);
    data.push({ day: dayLabel, revenue: +revenue.toFixed(2), costs: +costs.toFixed(2), events: dayEvents.length });
  }
  return data;
}

const chartData = generateChartData();

const kpis = [
  { title: "CUSTOMERS", value: totalCustomers, trend: "+2 this month", trendUp: true },
  { title: "REVENUE", value: `$${totalRevenue.toFixed(2)}`, trend: "+12.4%", trendUp: true },
  { title: "COSTS", value: `$${totalCosts.toFixed(2)}`, trend: "+8.1%", trendUp: false },
  { title: "GROSS MARGIN", value: `${grossMargin.toFixed(1)}%`, trend: "healthy", trendUp: true },
];

export default function Overview() {
  const recentEvents = events.slice(0, 15);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-space text-2xl font-bold uppercase tracking-wide">$ overview</h1>
        <p className="font-ibm-plex text-sm text-muted-foreground">system status: <span className="text-terminal-green">✓ online</span></p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <TerminalCard key={kpi.title} title={kpi.title}>
            <div className="space-y-1">
              <div className="font-space text-2xl font-bold">{kpi.value}</div>
              <div className={`font-ibm-plex text-xs ${kpi.trendUp ? "text-terminal-green" : "text-terminal-red"}`}>
                {kpi.trend}
              </div>
            </div>
          </TerminalCard>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TerminalCard title="REVENUE VS COSTS">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12, background: "hsl(var(--card))", border: "1px dashed hsl(var(--border))" }} />
              <Area type="monotone" dataKey="revenue" stackId="1" stroke="hsl(var(--terminal-green))" fill="hsl(var(--terminal-green) / 0.2)" />
              <Area type="monotone" dataKey="costs" stackId="2" stroke="hsl(var(--terminal-red))" fill="hsl(var(--terminal-red) / 0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        </TerminalCard>

        <TerminalCard title="EVENTS / DAY">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12, background: "hsl(var(--card))", border: "1px dashed hsl(var(--border))" }} />
              <Bar dataKey="events" fill="hsl(var(--foreground))" opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </TerminalCard>
      </div>

      {/* Activity Feed */}
      <TerminalCard title="RECENT ACTIVITY">
        <div className="max-h-80 space-y-0.5 overflow-y-auto font-ibm-plex text-xs">
          {recentEvents.map((event) => {
            const time = new Date(event.timestamp).toLocaleString("en-US", {
              month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
            });
            const feeAmount = event.fees?.[0]
              ? `→ ${event.fees[0].amount} ${event.fees[0].asset_code}`
              : "";

            return (
              <div key={event.id} className="flex items-center gap-2 py-1 hover:bg-accent/50">
                <span className="text-muted-foreground">$</span>
                <span className="w-32 text-muted-foreground">[{time}]</span>
                <StatusBadge status={event.status} />
                <span className="text-terminal-yellow">{event.event_type}</span>
                <span className="text-muted-foreground">{event.customer_name}</span>
                <span className="ml-auto text-terminal-green">{feeAmount}</span>
              </div>
            );
          })}
          <div className="pt-2 text-muted-foreground terminal-cursor"> </div>
        </div>
      </TerminalCard>
    </div>
  );
}
