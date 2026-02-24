import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { CopyableId } from "@/components/terminal/CopyableId";
import { customers } from "@/data/customers";
import { events } from "@/data/events";
import { vendors } from "@/data/vendors";
import { useProductStore } from "@/stores/productStore";
import { Link } from "react-router-dom";
import { Check, Package, Users, Activity, ArrowRight } from "lucide-react";
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

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  done: boolean;
  link: string;
  linkLabel: string;
}

export default function Overview() {
  const { products } = useProductStore();
  const recentEvents = events.slice(0, 15);

  const hasProducts = products.length > 0;
  const hasCustomers = customers.length > 0;
  const hasEvents = events.length > 0;

  const checklist: ChecklistItem[] = [
    {
      key: "product",
      label: "Create your first product",
      description: "Define how you charge — usage-based, fixed, or both.",
      icon: <Package className="h-4 w-4" />,
      done: hasProducts,
      link: "/products",
      linkLabel: "Go to Products",
    },
    {
      key: "customer",
      label: "Add a customer",
      description: "Register a customer and set up their wallet.",
      icon: <Users className="h-4 w-4" />,
      done: hasCustomers,
      link: "/customers",
      linkLabel: "Go to Customers",
    },
    {
      key: "event",
      label: "Send your first event",
      description: "Send a usage event via the API to start billing.",
      icon: <Activity className="h-4 w-4" />,
      done: hasEvents,
      link: "/events",
      linkLabel: "View Events",
    },
  ];

  const completedCount = checklist.filter((c) => c.done).length;
  const allDone = completedCount === checklist.length;
  const progressFilled = Math.round((completedCount / checklist.length) * 20);
  const progressBar = "█".repeat(progressFilled) + "░".repeat(20 - progressFilled);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-space text-2xl font-bold uppercase tracking-wider mb-1">Overview</h1>
        <p className="font-ibm-plex text-sm text-muted-foreground">System status: <span className="text-terminal-green">✓ Online</span></p>
      </div>

      {/* Onboarding Checklist */}
      {!allDone && (
        <TerminalCard title="GETTING STARTED">
          <div className="space-y-4">
            <div className="flex items-center justify-between font-ibm-plex text-xs">
              <span className="text-muted-foreground">{completedCount}/{checklist.length} completed</span>
              <span className="text-muted-foreground tracking-wider">{progressBar} {Math.round((completedCount / checklist.length) * 100)}%</span>
            </div>
            {checklist.map((item) => (
              <div
                key={item.key}
                className={`flex items-start gap-4 rounded-md border p-4 transition-all duration-150 ${
                  item.done
                    ? "border-terminal-green/20 bg-terminal-green/5"
                    : "border-foreground/[0.08] hover:bg-accent/20"
                }`}
              >
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border ${
                  item.done ? "border-terminal-green text-terminal-green" : "border-foreground/20 text-muted-foreground"
                }`}>
                  {item.done ? <Check className="h-3.5 w-3.5" /> : item.icon}
                </div>
                <div className="flex-1">
                  <div className={`font-space text-xs uppercase tracking-wide ${item.done ? "text-terminal-green line-through" : ""}`}>
                    {item.label}
                  </div>
                  <p className="mt-1 font-ibm-plex text-[11px] text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
                {!item.done && (
                  <Link
                    to={item.link}
                    className="flex items-center gap-1.5 font-space text-[10px] uppercase tracking-wide text-muted-foreground transition-all duration-150 hover:text-foreground"
                  >
                    {item.linkLabel} <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </TerminalCard>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <TerminalCard key={kpi.title} title={kpi.title}>
            <div className="space-y-1.5">
              <div className="font-space text-2xl font-bold tracking-tight">{kpi.value}</div>
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
              <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }} />
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
              <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }} />
              <Bar dataKey="events" fill="hsl(var(--foreground))" opacity={0.7} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </TerminalCard>
      </div>

      {/* Activity Feed */}
      <TerminalCard title="RECENT ACTIVITY">
        <div className="max-h-80 space-y-0 overflow-y-auto">
          {recentEvents.map((event) => {
            const time = new Date(event.timestamp).toLocaleString("en-US", {
              month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
            });
            const feeAmount = event.fees?.[0]
              ? `→ ${event.fees[0].amount} ${event.fees[0].asset_code}`
              : "";

            return (
              <div key={event.id} className="flex items-center gap-3 border-b border-foreground/[0.04] py-2.5 transition-all duration-150 hover:bg-accent/20">
                <span className="w-32 font-ibm-plex text-xs text-muted-foreground">[{time}]</span>
                <StatusBadge status={event.status} />
                <span className="font-ibm-plex text-xs text-terminal-yellow">{event.event_type}</span>
                <div className="flex-1">
                  <span className="font-ibm-plex text-xs font-medium">{event.customer_name}</span>
                  <span className="ml-1.5 font-ibm-plex text-[10px] text-muted-foreground"># {event.customer_id}</span>
                </div>
                <span className="ml-auto font-ibm-plex text-xs text-terminal-green">{feeAmount}</span>
              </div>
            );
          })}
          <div className="pt-2 text-muted-foreground terminal-cursor"> </div>
        </div>
      </TerminalCard>
    </div>
  );
}
