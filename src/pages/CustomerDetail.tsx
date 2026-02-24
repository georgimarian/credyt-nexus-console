import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { CopyableId } from "@/components/terminal/CopyableId";
import { customers } from "@/data/customers";
import { events } from "@/data/events";
import { ChevronRight } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Tab = "subscriptions" | "wallet" | "events";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const customer = customers.find((c) => c.id === id);
  const [activeTab, setActiveTab] = useState<Tab>("subscriptions");

  if (!customer) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-ibm-plex text-muted-foreground">Customer not found</p>
      </div>
    );
  }

  const customerEvents = events.filter((e) => e.customer_id === customer.id);

  const tabs: { key: Tab; label: string }[] = [
    { key: "subscriptions", label: `Subscriptions (${customer.subscriptions.length})` },
    { key: "wallet", label: "Wallet" },
    { key: "events", label: `Events (${customerEvents.length})` },
  ];

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-ibm-plex text-sm text-muted-foreground">
        <Link to="/customers" className="transition-colors hover:text-foreground">Customers</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{customer.name}</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="font-space text-2xl font-bold uppercase tracking-wide">{customer.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <CopyableId label="ID" value={customer.id} size="sm" />
          <CopyableId label="External" value={customer.external_id} size="sm" />
          <span className="font-ibm-plex text-xs text-muted-foreground">{customer.email}</span>
          <span className="font-ibm-plex text-xs text-muted-foreground">
            Created {new Date(customer.created_at).toLocaleDateString()}
          </span>
        </div>
        {customer.metadata && (
          <div className="mt-2 font-ibm-plex text-xs text-muted-foreground">
            metadata: {JSON.stringify(customer.metadata)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-dashed border-foreground/20">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 font-space text-xs uppercase tracking-wide transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subscriptions Tab */}
      {activeTab === "subscriptions" && (
        <TerminalCard title="SUBSCRIPTIONS">
          {customer.subscriptions.length === 0 ? (
            <p className="font-ibm-plex text-sm text-muted-foreground">No subscriptions</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-dashed border-foreground/20 hover:bg-transparent">
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Product</TableHead>
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Subscription ID</TableHead>
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Product ID</TableHead>
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Status</TableHead>
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Start</TableHead>
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.subscriptions.map((sub) => (
                  <TableRow key={sub.id} className="border-dashed border-foreground/10 hover:bg-accent/30">
                    <TableCell className="px-4 py-3.5">
                      <Link to={`/products/${sub.product_id}`} className="font-ibm-plex text-sm font-semibold transition-colors hover:text-terminal-green">
                        {sub.product_name}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <CopyableId value={sub.id} truncate={18} />
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <CopyableId value={sub.product_id} truncate={16} href={`/products/${sub.product_id}`} />
                    </TableCell>
                    <TableCell className="px-4 py-3.5"><StatusBadge status={sub.status} /></TableCell>
                    <TableCell className="px-4 py-3.5 font-ibm-plex text-xs text-muted-foreground">
                      {new Date(sub.start_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 font-ibm-plex text-xs text-muted-foreground">
                      {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TerminalCard>
      )}

      {/* Wallet Tab */}
      {activeTab === "wallet" && (
        <div className="space-y-6">
          <TerminalCard title="ACCOUNT BALANCES">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customer.wallet.accounts.map((acc) => (
                <div key={acc.asset_code} className="border border-dashed border-foreground/15 p-5">
                  <div className="font-space text-[10px] uppercase tracking-widest text-muted-foreground">{acc.asset_code}</div>
                  <div className="mt-1 font-space text-2xl font-bold tracking-tight">{acc.available.toFixed(2)}</div>
                  <div className="mt-3 flex gap-4 font-ibm-plex text-xs text-muted-foreground">
                    <span>Pending in: {acc.pending_in.toFixed(2)}</span>
                    <span>Pending out: {acc.pending_out.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </TerminalCard>

          <TerminalCard title="CREDIT GRANTS">
            {customer.wallet.credit_grants.length === 0 ? (
              <p className="font-ibm-plex text-sm text-muted-foreground">No credit grants</p>
            ) : (
              <div className="space-y-3">
                {customer.wallet.credit_grants.map((cg) => {
                  const pct = cg.amount > 0 ? (cg.remaining / cg.amount) * 100 : 0;
                  const barFilled = Math.round(pct / 5);
                  const bar = "█".repeat(barFilled) + "░".repeat(20 - barFilled);
                  return (
                    <div key={cg.id} className="border border-dashed border-foreground/10 p-4">
                      <div className="flex items-center gap-3">
                        <span className="font-ibm-plex text-sm font-bold">{cg.remaining}/{cg.amount} {cg.asset_code}</span>
                        <StatusBadge status={cg.purpose === "paid" ? "active" : cg.purpose === "promotional" ? "warning" : "published"} />
                        <span className="font-ibm-plex text-xs text-muted-foreground">{cg.purpose}</span>
                      </div>
                      <div className="mt-2 font-ibm-plex text-xs text-muted-foreground tracking-wider">
                        {bar} {pct.toFixed(0)}%
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <CopyableId label="Grant" value={cg.id} truncate={20} />
                        <span className="font-ibm-plex text-xs text-muted-foreground">
                          Effective: {new Date(cg.effective_at).toLocaleDateString()}
                          {cg.expires_at && ` · Expires: ${new Date(cg.expires_at).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TerminalCard>

          <TerminalCard title="TRANSACTION HISTORY">
            <Table>
              <TableHeader>
                <TableRow className="border-dashed border-foreground/20 hover:bg-transparent">
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Date</TableHead>
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest text-right">Amount</TableHead>
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Asset</TableHead>
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Type</TableHead>
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Description</TableHead>
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">TX ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.wallet.transactions.map((tx) => (
                  <TableRow key={tx.id} className="border-dashed border-foreground/10 hover:bg-accent/30">
                    <TableCell className="px-4 py-3 font-ibm-plex text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className={`px-4 py-3 text-right font-ibm-plex text-sm font-semibold ${tx.amount >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>
                      {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-ibm-plex text-xs text-muted-foreground">{tx.asset_code}</TableCell>
                    <TableCell className="px-4 py-3 font-ibm-plex text-xs uppercase">{tx.type}</TableCell>
                    <TableCell className="px-4 py-3 font-ibm-plex text-xs text-muted-foreground">{tx.description}</TableCell>
                    <TableCell className="px-4 py-3">
                      <CopyableId value={tx.id} truncate={14} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TerminalCard>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === "events" && (
        <TerminalCard title="EVENT LOG">
          {customerEvents.length === 0 ? (
            <p className="font-ibm-plex text-sm text-muted-foreground">No events</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-dashed border-foreground/20 hover:bg-transparent">
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Time</TableHead>
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Event ID</TableHead>
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Status</TableHead>
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Type</TableHead>
                  <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest text-right">Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerEvents.map((event) => (
                  <TableRow key={event.id} className="border-dashed border-foreground/10 hover:bg-accent/30">
                    <TableCell className="px-4 py-3 font-ibm-plex text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <CopyableId value={event.id} truncate={14} />
                    </TableCell>
                    <TableCell className="px-4 py-3"><StatusBadge status={event.status} /></TableCell>
                    <TableCell className="px-4 py-3 font-ibm-plex text-xs text-terminal-yellow">{event.event_type}</TableCell>
                    <TableCell className="px-4 py-3 text-right font-ibm-plex text-xs text-terminal-green">
                      {event.fees?.[0] && `${event.fees[0].amount} ${event.fees[0].asset_code}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TerminalCard>
      )}
    </div>
  );
}
