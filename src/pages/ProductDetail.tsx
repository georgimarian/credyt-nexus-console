import { useParams, Link } from "react-router-dom";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { FieldLabel } from "@/components/terminal/FieldLabel";
import { CopyableId } from "@/components/terminal/CopyableId";
import { useProductStore } from "@/stores/productStore";
import { customers } from "@/data/customers";
import { ChevronRight, Play } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { products } = useProductStore();
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
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-ibm-plex text-sm text-muted-foreground">
        <Link to="/products" className="transition-colors hover:text-foreground">Products</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-space text-2xl font-bold uppercase tracking-wide">{product.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">
            <CopyableId label="ID" value={product.id} size="sm" />
            <span className="font-ibm-plex text-xs text-muted-foreground">code: {product.code}</span>
          </div>
        </div>
        <StatusBadge status={product.status} />
      </div>

      {/* Prices */}
      <TerminalCard title="PRICES">
        <div className="space-y-6">
          {product.prices.map((price) => (
            <div key={price.id} className="border border-dashed border-foreground/15 p-5">
              <div className="mb-4 flex items-center gap-3">
                <CopyableId value={price.id} size="sm" />
                <StatusBadge status={price.type === "usage" ? "active" : "published"} />
                <span className="font-ibm-plex text-xs text-muted-foreground">
                  {price.type} · {price.billing_model}{price.recurring_interval ? ` (${price.recurring_interval})` : ""}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2 font-ibm-plex text-xs sm:grid-cols-3">
                {price.event_type && (
                  <div>
                    <span className="text-muted-foreground">event_type</span>
                    <div className="mt-0.5 font-medium">{price.event_type}</div>
                  </div>
                )}
                {price.usage_calculation && (
                  <div>
                    <span className="text-muted-foreground">calculation</span>
                    <div className="mt-0.5 font-medium">{price.usage_calculation}</div>
                  </div>
                )}
                {price.volume_field && (
                  <div>
                    <span className="text-muted-foreground">volume_field</span>
                    <div className="mt-0.5 font-medium">{price.volume_field}</div>
                  </div>
                )}
                {price.unit_price !== undefined && (
                  <div>
                    <span className="text-muted-foreground">unit_price</span>
                    <div className="mt-0.5 font-medium">{price.unit_price} {price.asset_code}</div>
                  </div>
                )}
                {price.amount !== undefined && (
                  <div>
                    <span className="text-muted-foreground">amount</span>
                    <div className="mt-0.5 font-medium">{price.amount} {price.asset_code}</div>
                  </div>
                )}
                {price.dimensions && price.dimensions.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">dimensions</span>
                    <div className="mt-0.5 font-medium">[{price.dimensions.join(", ")}]</div>
                  </div>
                )}
              </div>

              {/* Tiers */}
              {price.tiers && price.tiers.length > 0 && (
                <div className="mt-5">
                  <div className="mb-2 font-space text-[10px] uppercase tracking-widest text-muted-foreground">Dimensional Tiers</div>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-dashed border-foreground/20 hover:bg-transparent">
                        <TableHead className="h-8 px-3 font-space text-[10px] uppercase tracking-wide">Dimensions</TableHead>
                        <TableHead className="h-8 px-3 font-space text-[10px] uppercase tracking-wide">Unit Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {price.tiers.map((tier, i) => (
                        <TableRow key={i} className="border-dashed border-foreground/10 hover:bg-accent/30">
                          <TableCell className="px-3 py-2.5 font-ibm-plex text-xs">
                            {tier.dimensions ? JSON.stringify(tier.dimensions) : "—"}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 font-ibm-plex text-xs">
                            {tier.unit_price} {price.asset_code}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Entitlements */}
              {price.entitlements && price.entitlements.length > 0 && (
                <div className="mt-5">
                  <div className="mb-2 font-space text-[10px] uppercase tracking-widest text-muted-foreground">Entitlements</div>
                  <div className="space-y-1.5">
                    {price.entitlements.map((ent, i) => (
                      <div key={i} className="font-ibm-plex text-xs">
                        <span className="font-bold">{ent.amount}</span> {ent.asset_code} · refresh: {ent.refresh_strategy}
                        {ent.schedule ? ` (${ent.schedule})` : ""}
                      </div>
                    ))}
                  </div>
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
          className="flex items-center gap-1.5 border border-dashed border-foreground/30 px-3 py-1.5 font-space text-xs uppercase tracking-wide transition-colors hover:bg-foreground hover:text-background"
        >
          <Play className="h-3 w-3" /> Run
        </button>
      }>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <FieldLabel label="Event Payload" tooltip="Paste a sample event JSON to simulate fee calculation against this product's prices." />
            <textarea
              value={simPayload}
              onChange={(e) => setSimPayload(e.target.value)}
              className="h-36 w-full border border-dashed border-foreground/30 bg-transparent p-4 font-ibm-plex text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground"
              spellCheck={false}
            />
          </div>
          <div>
            <FieldLabel label="Result" tooltip="Shows the calculated fee based on matching price rules." />
            <pre className="h-36 overflow-auto border border-dashed border-foreground/15 bg-muted/50 p-4 font-ibm-plex text-xs leading-relaxed">
              {simResult || "$ run simulation to see calculated fees..."}
            </pre>
          </div>
        </div>
      </TerminalCard>

      {/* Version History */}
      <TerminalCard title="VERSION HISTORY">
        <Table>
          <TableHeader>
            <TableRow className="border-dashed border-foreground/20 hover:bg-transparent">
              <TableHead className="h-9 px-3 font-space text-[10px] uppercase tracking-wide">Version</TableHead>
              <TableHead className="h-9 px-3 font-space text-[10px] uppercase tracking-wide">Status</TableHead>
              <TableHead className="h-9 px-3 font-space text-[10px] uppercase tracking-wide">Created</TableHead>
              <TableHead className="h-9 px-3 font-space text-[10px] uppercase tracking-wide">Published</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {product.versions.map((v) => (
              <TableRow key={v.version} className="border-dashed border-foreground/10 hover:bg-accent/30">
                <TableCell className="px-3 py-2.5 font-ibm-plex text-xs font-bold">v{v.version}</TableCell>
                <TableCell className="px-3 py-2.5"><StatusBadge status={v.status} /></TableCell>
                <TableCell className="px-3 py-2.5 font-ibm-plex text-xs text-muted-foreground">
                  {new Date(v.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="px-3 py-2.5 font-ibm-plex text-xs text-muted-foreground">
                  {v.published_at ? new Date(v.published_at).toLocaleDateString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TerminalCard>

      {/* Subscribers */}
      <TerminalCard title={`SUBSCRIBERS (${subscribers.length})`}>
        {subscribers.length === 0 ? (
          <p className="font-ibm-plex text-xs text-muted-foreground">No subscribers</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-dashed border-foreground/20 hover:bg-transparent">
                <TableHead className="h-9 px-3 font-space text-[10px] uppercase tracking-wide">Name</TableHead>
                <TableHead className="h-9 px-3 font-space text-[10px] uppercase tracking-wide">Email</TableHead>
                <TableHead className="h-9 px-3 text-right font-space text-[10px] uppercase tracking-wide">External ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((c) => (
                <TableRow key={c.id} className="border-dashed border-foreground/10 hover:bg-accent/30">
                  <TableCell className="px-3 py-2.5">
                    <Link to={`/customers/${c.id}`} className="font-ibm-plex text-xs font-bold transition-colors hover:text-terminal-green">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 font-ibm-plex text-xs text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-ibm-plex text-xs text-muted-foreground">{c.external_id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TerminalCard>
    </div>
  );
}
