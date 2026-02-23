import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { customers } from "@/data/customers";
import { events } from "@/data/events";
import { ChevronRight } from "lucide-react";

type Tab = "subscriptions" | "wallet" | "events";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const customer = customers.find((c) => c.id === id);
  const [activeTab, setActiveTab] = useState<Tab>("subscriptions");

  if (!customer) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-ibm-plex text-muted-foreground">customer not found</p>
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
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 font-ibm-plex text-sm text-muted-foreground">
        <Link to="/customers" className="transition-colors hover:text-foreground">Customers</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{customer.name}</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="font-space text-2xl font-bold uppercase tracking-wide">{customer.name}</h1>
        <div className="mt-1 flex flex-wrap gap-4 font-ibm-plex text-xs text-muted-foreground">
          <span>email: {customer.email}</span>
          <span>external_id: {customer.external_id}</span>
          <span>created: {new Date(customer.created_at).toLocaleDateString()}</span>
        </div>
        {customer.metadata && (
          <div className="mt-2 font-ibm-plex text-xs text-muted-foreground">
            metadata: {JSON.stringify(customer.metadata)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-dashed border-foreground/30">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-space text-xs uppercase tracking-wide transition-colors ${
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
            <p className="font-ibm-plex text-xs text-muted-foreground">no subscriptions</p>
          ) : (
            <div className="space-y-2">
              {customer.subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center gap-4 border-b border-dashed border-foreground/10 py-3 font-ibm-plex text-xs">
                  <Link to={`/products/${sub.product_id}`} className="font-bold hover:underline">{sub.product_name}</Link>
                  <StatusBadge status={sub.status} />
                  <span className="text-muted-foreground">start: {new Date(sub.start_date).toLocaleDateString()}</span>
                  {sub.end_date && <span className="text-terminal-red">end: {new Date(sub.end_date).toLocaleDateString()}</span>}
                </div>
              ))}
            </div>
          )}
        </TerminalCard>
      )}

      {/* Wallet Tab */}
      {activeTab === "wallet" && (
        <div className="space-y-4">
          {/* Balances */}
          <TerminalCard title="ACCOUNT BALANCES">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {customer.wallet.accounts.map((acc) => (
                <div key={acc.asset_code} className="border border-dashed border-foreground/15 p-3">
                  <div className="font-space text-xs uppercase text-muted-foreground">{acc.asset_code}</div>
                  <div className="font-space text-xl font-bold">{acc.available.toFixed(2)}</div>
                  <div className="mt-1 flex gap-3 font-ibm-plex text-xs text-muted-foreground">
                    <span>pending_in: {acc.pending_in.toFixed(2)}</span>
                    <span>pending_out: {acc.pending_out.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </TerminalCard>

          {/* Credit Grants */}
          <TerminalCard title="CREDIT GRANTS">
            {customer.wallet.credit_grants.length === 0 ? (
              <p className="font-ibm-plex text-xs text-muted-foreground">no credit grants</p>
            ) : (
              <div className="space-y-2">
                {customer.wallet.credit_grants.map((cg) => {
                  const pct = cg.amount > 0 ? (cg.remaining / cg.amount) * 100 : 0;
                  const barFilled = Math.round(pct / 5);
                  const bar = "█".repeat(barFilled) + "░".repeat(20 - barFilled);
                  return (
                    <div key={cg.id} className="border-b border-dashed border-foreground/10 py-2 font-ibm-plex text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{cg.remaining}/{cg.amount} {cg.asset_code}</span>
                        <StatusBadge status={cg.purpose === "paid" ? "active" : cg.purpose === "promotional" ? "warning" : "published"} />
                        <span className="text-muted-foreground">{cg.purpose}</span>
                      </div>
                      <div className="mt-1 font-ibm-plex text-xs text-muted-foreground">
                        {bar} {pct.toFixed(0)}%
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        effective: {new Date(cg.effective_at).toLocaleDateString()}
                        {cg.expires_at && ` · expires: ${new Date(cg.expires_at).toLocaleDateString()}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TerminalCard>

          {/* Transactions */}
          <TerminalCard title="TRANSACTION HISTORY">
            <div className="space-y-0.5">
              {customer.wallet.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 border-b border-dashed border-foreground/10 py-2 font-ibm-plex text-xs">
                  <span className="w-24 text-muted-foreground">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </span>
                  <span className={`w-16 font-bold ${tx.amount >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>
                    {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(2)}
                  </span>
                  <span className="w-12 text-muted-foreground">{tx.asset_code}</span>
                  <span className="uppercase">{tx.type}</span>
                  <span className="flex-1 text-muted-foreground">{tx.description}</span>
                </div>
              ))}
            </div>
          </TerminalCard>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === "events" && (
        <TerminalCard title="EVENT LOG">
          {customerEvents.length === 0 ? (
            <p className="font-ibm-plex text-xs text-muted-foreground">no events</p>
          ) : (
            <div className="space-y-0.5 max-h-96 overflow-y-auto">
              {customerEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-2 py-1 font-ibm-plex text-xs hover:bg-accent/50">
                  <span className="text-muted-foreground">$</span>
                  <span className="w-32 text-muted-foreground">
                    [{new Date(event.timestamp).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}]
                  </span>
                  <StatusBadge status={event.status} />
                  <span className="text-terminal-yellow">{event.event_type}</span>
                  <span className="ml-auto text-terminal-green">
                    {event.fees?.[0] && `→ ${event.fees[0].amount} ${event.fees[0].asset_code}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TerminalCard>
      )}
    </div>
  );
}
