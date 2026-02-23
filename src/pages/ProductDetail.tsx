import { useParams, Link } from "react-router-dom";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { products } from "@/data/products";
import { customers } from "@/data/customers";
import { ChevronRight, Play } from "lucide-react";
import { useState } from "react";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const product = products.find((p) => p.id === id);
  const [simPayload, setSimPayload] = useState('{\n  "event_type": "chat_completion",\n  "total_tokens": 1500\n}');
  const [simResult, setSimResult] = useState<string | null>(null);

  if (!product) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-ibm-plex text-muted-foreground">product not found</p>
      </div>
    );
  }

  const subscribers = customers.filter((c) =>
    c.subscriptions.some((s) => s.product_id === product.id)
  );

  const runSimulation = () => {
    try {
      const payload = JSON.parse(simPayload);
      const price = product.prices.find((p) => p.event_type === payload.event_type);
      if (!price) {
        setSimResult("⚠ No matching price for event_type: " + payload.event_type);
        return;
      }
      let fee = 0;
      if (price.usage_calculation === "volume" && price.volume_field && price.unit_price) {
        fee = (payload[price.volume_field] || 0) * price.unit_price;
      } else if (price.usage_calculation === "unit" && price.unit_price) {
        fee = price.unit_price;
      }
      setSimResult(`✓ Calculated fee: ${fee.toFixed(6)} ${price.asset_code}\n  Price: ${price.id}\n  Calculation: ${price.usage_calculation}`);
    } catch {
      setSimResult("✗ Invalid JSON payload");
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 font-ibm-plex text-sm text-muted-foreground">
        <Link to="/products" className="transition-colors hover:text-foreground">Products</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-space text-2xl font-bold uppercase tracking-wide">{product.name}</h1>
          <p className="font-ibm-plex text-sm text-muted-foreground">code: {product.code}</p>
        </div>
        <StatusBadge status={product.status} />
      </div>

      {/* Prices */}
      <TerminalCard title="PRICES">
        <div className="space-y-4">
          {product.prices.map((price) => (
            <div key={price.id} className="border border-dashed border-foreground/15 p-4">
              <div className="mb-2 flex items-center gap-3">
                <span className="font-space text-xs font-bold uppercase">{price.id}</span>
                <StatusBadge status={price.type === "usage" ? "active" : "published"} />
                <span className="font-ibm-plex text-xs text-muted-foreground">
                  {price.type} · {price.billing_model}{price.recurring_interval ? ` (${price.recurring_interval})` : ""}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-ibm-plex text-xs">
                {price.event_type && (
                  <div><span className="text-muted-foreground">event_type:</span> {price.event_type}</div>
                )}
                {price.usage_calculation && (
                  <div><span className="text-muted-foreground">calculation:</span> {price.usage_calculation}</div>
                )}
                {price.volume_field && (
                  <div><span className="text-muted-foreground">volume_field:</span> {price.volume_field}</div>
                )}
                {price.unit_price !== undefined && (
                  <div><span className="text-muted-foreground">unit_price:</span> {price.unit_price} {price.asset_code}</div>
                )}
                {price.amount !== undefined && (
                  <div><span className="text-muted-foreground">amount:</span> {price.amount} {price.asset_code}</div>
                )}
                {price.dimensions && price.dimensions.length > 0 && (
                  <div><span className="text-muted-foreground">dimensions:</span> [{price.dimensions.join(", ")}]</div>
                )}
              </div>

              {/* Tiers */}
              {price.tiers && price.tiers.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1 font-space text-xs uppercase text-muted-foreground">Dimensional Tiers</div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-dashed border-foreground/20">
                        <th className="px-2 py-1 text-left text-muted-foreground">Dimensions</th>
                        <th className="px-2 py-1 text-left text-muted-foreground">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {price.tiers.map((tier, i) => (
                        <tr key={i} className="border-b border-dashed border-foreground/10">
                          <td className="px-2 py-1">{tier.dimensions ? JSON.stringify(tier.dimensions) : "—"}</td>
                          <td className="px-2 py-1">{tier.unit_price} {price.asset_code}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Entitlements */}
              {price.entitlements && price.entitlements.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1 font-space text-xs uppercase text-muted-foreground">Entitlements</div>
                  {price.entitlements.map((ent, i) => (
                    <div key={i} className="font-ibm-plex text-xs">
                      {ent.amount} {ent.asset_code} · refresh: {ent.refresh_strategy}
                      {ent.schedule ? ` (${ent.schedule})` : ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </TerminalCard>

      {/* Usage Simulator */}
      <TerminalCard title="USAGE SIMULATOR" actions={
        <button
          onClick={runSimulation}
          className="flex items-center gap-1 border border-dashed border-foreground/30 px-3 py-1 font-space text-xs uppercase tracking-wide transition-colors hover:bg-foreground hover:text-background"
        >
          <Play className="h-3 w-3" /> Run
        </button>
      }>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-1 font-space text-xs uppercase text-muted-foreground">Event Payload</div>
            <textarea
              value={simPayload}
              onChange={(e) => setSimPayload(e.target.value)}
              className="h-32 w-full border border-dashed border-foreground/30 bg-transparent p-3 font-ibm-plex text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
              spellCheck={false}
            />
          </div>
          <div>
            <div className="mb-1 font-space text-xs uppercase text-muted-foreground">Result</div>
            <pre className="h-32 overflow-auto border border-dashed border-foreground/15 bg-muted/50 p-3 font-ibm-plex text-xs">
              {simResult || "$ run simulation to see calculated fees..."}
            </pre>
          </div>
        </div>
      </TerminalCard>

      {/* Version History */}
      <TerminalCard title="VERSION HISTORY">
        <div className="space-y-1">
          {product.versions.map((v) => (
            <div key={v.version} className="flex items-center gap-4 border-b border-dashed border-foreground/10 py-2 font-ibm-plex text-xs">
              <span className="font-bold">v{v.version}</span>
              <StatusBadge status={v.status} />
              <span className="text-muted-foreground">
                created: {new Date(v.created_at).toLocaleDateString()}
              </span>
              {v.published_at && (
                <span className="text-muted-foreground">
                  published: {new Date(v.published_at).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </TerminalCard>

      {/* Subscribers */}
      <TerminalCard title={`SUBSCRIBERS (${subscribers.length})`}>
        {subscribers.length === 0 ? (
          <p className="font-ibm-plex text-xs text-muted-foreground">no subscribers</p>
        ) : (
          <div className="space-y-1">
            {subscribers.map((c) => (
              <Link
                key={c.id}
                to={`/customers/${c.id}`}
                className="flex items-center gap-4 border-b border-dashed border-foreground/10 py-2 font-ibm-plex text-xs transition-colors hover:bg-accent/50"
              >
                <span className="font-bold">{c.name}</span>
                <span className="text-muted-foreground">{c.email}</span>
                <span className="ml-auto text-muted-foreground">{c.external_id}</span>
              </Link>
            ))}
          </div>
        )}
      </TerminalCard>
    </div>
  );
}
