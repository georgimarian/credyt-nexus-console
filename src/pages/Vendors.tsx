import { TerminalCard } from "@/components/terminal/TerminalCard";
import { CopyableId } from "@/components/terminal/CopyableId";
import { vendors } from "@/data/vendors";
import { events } from "@/data/events";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const costByVendor = vendors.map((v) => ({
  name: v.name,
  costs: v.total_costs,
}));

export default function Vendors() {
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
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-space text-2xl font-bold uppercase tracking-wider mb-1">Vendors</h1>
          <p className="font-ibm-plex text-sm text-muted-foreground">{vendors.length} vendors</p>
        </div>
        <button className="rounded-none bg-foreground px-4 py-2.5 font-space text-xs uppercase tracking-wide text-background transition-all duration-150 hover:bg-foreground/80">
          + New Vendor
        </button>
      </div>

      <TerminalCard title="VENDOR LIST">
        <Table>
          <TableHeader>
            <TableRow className="border-foreground/[0.06] hover:bg-transparent">
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Vendor</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">External ID</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest text-right">Total Costs</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((v) => (
              <TableRow key={v.id} className="border-foreground/[0.04] transition-all duration-150 hover:bg-accent/20">
                <TableCell className="px-4 py-4">
                  <div className="space-y-1">
                    <div className="font-ibm-plex text-sm font-medium">{v.name}</div>
                    <div className="font-ibm-plex text-[10px] text-muted-foreground"># {v.id}</div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <CopyableId value={v.external_id} />
                </TableCell>
                <TableCell className="px-4 py-4 text-right font-ibm-plex text-sm text-terminal-red">${v.total_costs.toFixed(2)}</TableCell>
                <TableCell className="px-4 py-4 font-ibm-plex text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TerminalCard>

      <TerminalCard title="COSTS BY VENDOR">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={costByVendor} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} stroke="hsl(var(--muted-foreground))" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} stroke="hsl(var(--muted-foreground))" width={80} />
            <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0 }} />
            <Bar dataKey="costs" fill="hsl(var(--terminal-red))" opacity={0.7} radius={[0, 0, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </TerminalCard>

      <TerminalCard title="RECENT COSTS">
        <Table>
          <TableHeader>
            <TableRow className="border-foreground/[0.06] hover:bg-transparent">
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Time</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest text-right">Amount</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Vendor</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Event Type</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Customer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendorCosts.map((c, i) => (
              <TableRow key={i} className="border-foreground/[0.04] transition-all duration-150 hover:bg-accent/20">
                <TableCell className="px-4 py-4 font-ibm-plex text-xs text-muted-foreground">
                  {new Date(c.timestamp).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
                </TableCell>
                <TableCell className="px-4 py-4 text-right font-ibm-plex text-sm font-semibold text-terminal-red">${c.amount.toFixed(4)}</TableCell>
                <TableCell className="px-4 py-4 font-ibm-plex text-xs">{c.vendor_name}</TableCell>
                <TableCell className="px-4 py-4 font-ibm-plex text-xs">{c.event_type}</TableCell>
                <TableCell className="px-4 py-4 font-ibm-plex text-xs text-muted-foreground">{c.customer_name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TerminalCard>
    </div>
  );
}
