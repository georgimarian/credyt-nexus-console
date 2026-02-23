import { TerminalCard } from "@/components/terminal/TerminalCard";
import { vendors } from "@/data/vendors";
import { events } from "@/data/events";
import { Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const costByVendor = vendors.map((v) => ({
  name: v.name,
  costs: v.total_costs,
}));

export default function Vendors() {
  // Costs linked to events
  const vendorCosts = events.flatMap((e) =>
    (e.costs || []).map((c) => ({
      event_id: e.id,
      event_type: e.event_type,
      customer_name: e.customer_name,
      timestamp: e.timestamp,
      ...c,
    }))
  ).slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-space text-2xl font-bold uppercase tracking-wide">$ vendors</h1>
          <p className="font-ibm-plex text-sm text-muted-foreground">{vendors.length} vendors</p>
        </div>
        <button className="flex items-center gap-2 border border-dashed border-foreground/30 bg-foreground px-4 py-2 font-space text-xs uppercase tracking-wide text-background transition-colors hover:bg-muted-foreground">
          <Plus className="h-3.5 w-3.5" />
          New Vendor
        </button>
      </div>

      {/* Vendor List */}
      <TerminalCard title="VENDOR LIST">
        <table className="w-full font-ibm-plex text-sm">
          <thead>
            <tr className="border-b border-dashed border-foreground/30 text-left">
              <th className="px-3 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground">Name</th>
              <th className="px-3 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground">External ID</th>
              <th className="px-3 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground">Total Costs</th>
              <th className="px-3 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground">Created</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-b border-dashed border-foreground/10 transition-colors hover:bg-accent/50">
                <td className="px-3 py-3 font-bold">{v.name}</td>
                <td className="px-3 py-3">{v.external_id}</td>
                <td className="px-3 py-3 text-terminal-red">${v.total_costs.toFixed(2)}</td>
                <td className="px-3 py-3 text-muted-foreground text-xs">{new Date(v.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TerminalCard>

      {/* Cost Chart */}
      <TerminalCard title="COSTS BY VENDOR">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={costByVendor} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} stroke="hsl(var(--muted-foreground))" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} stroke="hsl(var(--muted-foreground))" width={80} />
            <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12, background: "hsl(var(--card))", border: "1px dashed hsl(var(--border))" }} />
            <Bar dataKey="costs" fill="hsl(var(--terminal-red))" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </TerminalCard>

      {/* Recent Costs */}
      <TerminalCard title="RECENT COSTS">
        <div className="space-y-0.5">
          {vendorCosts.map((c, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-dashed border-foreground/10 py-2 font-ibm-plex text-xs">
              <span className="w-32 text-muted-foreground">
                {new Date(c.timestamp).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
              </span>
              <span className="font-bold text-terminal-red">${c.amount.toFixed(4)}</span>
              <span>{c.vendor_name}</span>
              <span className="text-terminal-yellow">{c.event_type}</span>
              <span className="text-muted-foreground">{c.customer_name}</span>
            </div>
          ))}
        </div>
      </TerminalCard>
    </div>
  );
}
