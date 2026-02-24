import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { CopyableId } from "@/components/terminal/CopyableId";
import { customers } from "@/data/customers";
import { events } from "@/data/events";
import { ChevronRight, ChevronDown } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { toast } from "@/hooks/use-toast";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const customer = customers.find((c) => c.id === id);
  const [chartRange, setChartRange] = useState<"7" | "30" | "90">("30");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [showTopups, setShowTopups] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [visibleEvents, setVisibleEvents] = useState(10);

  if (!customer) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-ibm-plex text-muted-foreground">Customer not found</p>
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
  const monthTopups = topups.filter((t) => new Date(t.created_at) >= monthStart);
  const daysElapsed = Math.max(1, Math.ceil((now.getTime() - monthStart.getTime()) / 86400000));
  const avgDaily = totalSpend / daysElapsed;
  const runway = avgDaily > 0 ? Math.round((primaryAccount?.available || 0) / avgDaily) : Infinity;

  const chartDays = parseInt(chartRange);
  const chartData = Array.from({ length: chartDays }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (chartDays - 1 - i));
    const dayStr = date.toISOString().split("T")[0];
    const spend = charges
      .filter((t) => t.created_at.startsWith(dayStr))
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    return { day: `${date.getMonth() + 1}/${date.getDate()}`, spend: +spend.toFixed(2) };
  });

  const relativeTime = (ts: string) => {
    const diff = now.getTime() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleTopup = () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) return;
    toast({ title: "✓ Top-up processed", description: `$${amount.toFixed(2)} added to wallet.` });
    setShowTopupModal(false);
    setTopupAmount("");
  };

  const metadataEntries = customer.metadata ? Object.entries(customer.metadata) : [];

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-ibm-plex text-sm text-muted-foreground">
        <Link to="/customers" className="flex items-center gap-1 transition-all duration-150 hover:text-foreground">
          ← Customers
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{customer.id}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-space text-2xl font-bold tracking-wider">{customer.name}</h1>
            <span className={`font-ibm-plex text-xs uppercase tracking-wide ${customer.status === "active" ? "text-terminal-green" : "text-terminal-red"}`}>
              {customer.status === "active" ? "✓" : "✗"} {customer.status}
            </span>
          </div>
          <div className="mt-1 font-ibm-plex text-sm text-muted-foreground"># {customer.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-none border border-foreground/40 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-foreground transition-all duration-150 hover:bg-accent">
            Edit
          </button>
          <button
            onClick={() => setShowTopupModal(true)}
            className="rounded-none bg-foreground px-4 py-2 font-space text-xs uppercase tracking-wide text-background transition-all duration-150 hover:bg-foreground/80"
          >
            Top Up Wallet →
          </button>
          <button className="rounded-none border border-foreground/40 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-foreground transition-all duration-150 hover:text-terminal-red">
            ⚠ Suspend
          </button>
        </div>
      </div>

      {/* Two-column layout — 40/60 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
        {/* ── Left column ── */}
        <div className="space-y-6">
          <TerminalCard title="WALLET">
            <div className="space-y-3">
              {[
                { label: "Balance", value: `$${balance.toFixed(2)}`, bold: true },
                { label: "Reserved", value: `$${(primaryAccount?.pending_out || 0).toFixed(2)}` },
                { label: "Pending", value: `$${(primaryAccount?.pending_in || 0).toFixed(2)}` },
                { label: "Available", value: `$${(primaryAccount?.available || 0).toFixed(2)}`, bold: true },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between font-ibm-plex text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={row.bold ? "font-semibold" : ""}>{row.value}</span>
                </div>
              ))}
              <div className="border-t border-foreground/[0.06] pt-3 mt-1">
                <div className="flex items-center justify-between font-ibm-plex text-sm">
                  <span className="text-muted-foreground">Auto Top-up</span>
                  <span className={customer.auto_topup?.enabled ? "text-terminal-green" : "text-muted-foreground"}>
                    {customer.auto_topup?.enabled ? "✓ ENABLED" : "OFF"}
                  </span>
                </div>
                {customer.auto_topup?.enabled && (
                  <>
                    <div className="flex items-center justify-between font-ibm-plex text-xs text-muted-foreground mt-1.5">
                      <span>Threshold</span>
                      <span>below ${customer.auto_topup.threshold.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between font-ibm-plex text-xs text-muted-foreground mt-1">
                      <span>Top-up Amount</span>
                      <span>+${customer.auto_topup.amount.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </TerminalCard>

          <TerminalCard title="DETAILS">
            <div className="space-y-3">
              {[
                { label: "External ID", value: customer.external_id, copy: true },
                { label: "Email", value: customer.email },
                { label: "Currency", value: primaryAccount?.asset_code || "USD" },
                { label: "Created", value: new Date(customer.created_at).toLocaleDateString() },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between font-ibm-plex text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  {row.copy ? <CopyableId value={row.value} /> : <span>{row.value}</span>}
                </div>
              ))}
              {metadataEntries.length > 0 && (
                <div className="border-t border-foreground/[0.06] pt-3 mt-1 space-y-2">
                  {metadataEntries.map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between font-ibm-plex text-sm">
                      <span className="text-muted-foreground">{key}</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TerminalCard>

          <TerminalCard title="THIS MONTH">
            <div className="space-y-3">
              {[
                { label: "Total Spend", value: `$${totalSpend.toFixed(2)}` },
                {
                  label: "Top-ups",
                  value: monthTopups.length > 0
                    ? `${monthTopups.length} × $${(monthTopups.reduce((s, t) => s + t.amount, 0) / monthTopups.length).toFixed(2)}`
                    : "None",
                },
                { label: "Events", value: customerEvents.filter((e) => new Date(e.timestamp) >= monthStart).length.toLocaleString() },
                { label: "Avg Daily", value: `$${avgDaily.toFixed(2)}` },
                { label: "Runway Est.", value: runway === Infinity ? "∞" : `${runway} days` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between font-ibm-plex text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>
          </TerminalCard>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">
          <TerminalCard title="USAGE">
            <div className="mb-5 flex gap-4">
              {(["30", "7", "90"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={`font-space text-xs uppercase tracking-wide pb-1 transition-all duration-150 ${
                    chartRange === r ? "text-foreground border-b border-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r} Days
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: "IBM Plex Mono" }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fontFamily: "IBM Plex Mono" }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0 }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Spend"]}
                />
                <Bar dataKey="spend" fill="hsl(var(--foreground))" opacity={0.8} radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TerminalCard>

          <TerminalCard title={`USAGE EVENTS (${customerEvents.length})`}>
            {customerEvents.length === 0 ? (
              <p className="py-8 text-center font-ibm-plex text-sm text-muted-foreground">
                <span className="terminal-cursor">$ no events found </span>
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-foreground/[0.06] hover:bg-transparent">
                      <TableHead className="h-9 px-4 font-space text-[10px] uppercase tracking-widest">Timestamp</TableHead>
                      <TableHead className="h-9 px-4 font-space text-[10px] uppercase tracking-widest">Event Type</TableHead>
                      <TableHead className="h-9 px-4 font-space text-[10px] uppercase tracking-widest">Dimensions</TableHead>
                      <TableHead className="h-9 px-4 font-space text-[10px] uppercase tracking-widest">Status</TableHead>
                      <TableHead className="h-9 px-4 font-space text-[10px] uppercase tracking-widest text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerEvents.slice(0, visibleEvents).map((event) => (
                      <>
                        <TableRow
                          key={event.id}
                          className="border-foreground/[0.04] cursor-pointer transition-all duration-150 hover:bg-accent/20"
                          onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                        >
                          <TableCell className="px-4 py-4 font-ibm-plex text-xs text-muted-foreground" title={event.timestamp}>
                            {relativeTime(event.timestamp)}
                          </TableCell>
                          <TableCell className="px-4 py-4 font-ibm-plex text-xs">{event.event_type}</TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(event.properties)
                                .filter(([k]) => k !== "event_type")
                                .slice(0, 3)
                                .map(([k, v]) => (
                                  <span key={k} className="border border-foreground/[0.08] px-1.5 py-0.5 font-ibm-plex text-[10px] text-muted-foreground">
                                    {k}:{String(v)}
                                  </span>
                                ))}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <StatusBadge status={event.status} />
                          </TableCell>
                          <TableCell className="px-4 py-4 text-right font-ibm-plex text-xs text-terminal-green">
                            {event.fees?.[0] && `$${event.fees[0].amount.toFixed(4)}`}
                          </TableCell>
                        </TableRow>
                        {expandedEventId === event.id && (
                          <TableRow key={`${event.id}-exp`} className="hover:bg-transparent">
                            <TableCell colSpan={5} className="p-0">
                              <pre className="mx-4 mb-3 overflow-auto bg-muted/30 p-4 font-ibm-plex text-xs leading-relaxed">
                                {JSON.stringify(event.properties, null, 2)}
                              </pre>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
                {visibleEvents < customerEvents.length && (
                  <button
                    onClick={() => setVisibleEvents((v) => v + 10)}
                    className="mt-4 w-full rounded-none border border-foreground/40 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground transition-all duration-150 hover:text-foreground"
                  >
                    Load More
                  </button>
                )}
              </>
            )}
          </TerminalCard>

          {/* Top-up History */}
          <div>
            <button
              onClick={() => setShowTopups(!showTopups)}
              className="mb-3 flex items-center gap-2 font-space text-xs uppercase tracking-wide text-muted-foreground transition-all duration-150 hover:text-foreground"
            >
              {showTopups ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Top-up History ({topups.length})
            </button>
            {showTopups && (
              <TerminalCard title="TOP-UPS">
                {topups.length === 0 ? (
                  <p className="py-6 text-center font-ibm-plex text-sm text-muted-foreground">
                    <span className="terminal-cursor">$ no top-ups recorded </span>
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-foreground/[0.06] hover:bg-transparent">
                        <TableHead className="h-9 px-4 font-space text-[10px] uppercase tracking-widest">Date</TableHead>
                        <TableHead className="h-9 px-4 font-space text-[10px] uppercase tracking-widest text-right">Amount</TableHead>
                        <TableHead className="h-9 px-4 font-space text-[10px] uppercase tracking-widest">Description</TableHead>
                        <TableHead className="h-9 px-4 font-space text-[10px] uppercase tracking-widest">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topups.map((tx) => (
                        <TableRow key={tx.id} className="border-foreground/[0.04] transition-all duration-150 hover:bg-accent/20">
                          <TableCell className="px-4 py-4 font-ibm-plex text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="px-4 py-4 text-right font-ibm-plex text-sm font-semibold text-terminal-green">
                            +${tx.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="px-4 py-4 font-ibm-plex text-xs text-muted-foreground">{tx.description}</TableCell>
                          <TableCell className="px-4 py-4">
                            <StatusBadge status="processed" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TerminalCard>
            )}
          </div>
        </div>
      </div>

      {/* Top-up Modal */}
      <Dialog open={showTopupModal} onOpenChange={setShowTopupModal}>
        <DialogContent className="rounded-none border-foreground/[0.12] bg-card sm:max-w-sm p-0 gap-0">
          <div className="border-b border-foreground/[0.08] px-6 py-4">
            <span className="font-space text-xs uppercase tracking-widest text-muted-foreground">
              ┌─ TOP UP WALLET ─┐
            </span>
          </div>
          <div className="space-y-4 px-6 py-6">
            <div>
              <label className="mb-1.5 block font-space text-[10px] uppercase tracking-wide text-muted-foreground">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-ibm-plex text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  step="any"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="25.00"
                  autoFocus
                  className="w-full rounded-none border border-foreground/[0.12] bg-transparent py-2.5 pl-7 pr-3 font-ibm-plex text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-foreground/[0.06] px-6 py-4">
            <button
              onClick={() => setShowTopupModal(false)}
              className="rounded-none border border-foreground/40 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-foreground transition-all duration-150 hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleTopup}
              className="rounded-none bg-foreground px-5 py-2 font-space text-xs uppercase tracking-wide text-background transition-all duration-150 hover:bg-foreground/80"
            >
              Confirm Top Up →
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
