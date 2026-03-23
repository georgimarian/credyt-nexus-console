import { useParams, Link } from "react-router-dom";
import { CopyableId } from "@/components/terminal/CopyableId";
import { useProductStore } from "@/stores/productStore";
import { customers } from "@/data/customers";
import { useState } from "react";
import { AddPriceWizard } from "@/components/products/AddPriceWizard";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { format } from "date-fns";

function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return id.slice(0, 5) + "..." + id.slice(-5);
}

function PriceBadge({ label, variant }: { label: string; variant: "usage" | "recurring" | "realtime" | "muted" }) {
  const styles = {
    usage: "border-[#38bdf8] text-[#38bdf8] bg-[#0a2a35]",
    realtime: "border-[#2dd4aa] text-[#2dd4aa] bg-[#0a2a20]",
    recurring: "border-[#555] text-[#555] bg-transparent",
    muted: "border-[#555] text-[#555] bg-transparent",
  };
  return (
    <span className={`inline-flex items-center border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${styles[variant]}`}>
      {label}
    </span>
  );
}

function StatusBadgeOutlined({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (["active", "published"].includes(s)) {
    return (
      <span className="inline-flex items-center border border-[#2dd4aa] text-[#2dd4aa] px-1.5 py-0.5 font-mono text-[11px] uppercase">
        {status}
      </span>
    );
  }
  if (["draft"].includes(s)) {
    return (
      <span className="inline-flex items-center border border-[#f59e0b] text-[#f59e0b] px-1.5 py-0.5 font-mono text-[11px] uppercase">
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center border border-[#555] text-[#555] px-1.5 py-0.5 font-mono text-[11px] uppercase">
      {status}
    </span>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { products, addPriceToProduct } = useProductStore();
  const product = products.find((p) => p.id === id);
  const [simPayload, setSimPayload] = useState('{\n  "event_type": "chat_completion",\n  "total_tokens": 1500\n}');
  const [simResult, setSimResult] = useState<string | null>(null);
  const [showAddPrice, setShowAddPrice] = useState(false);
  const [expandedPrices, setExpandedPrices] = useState<Record<string, boolean>>({});
  const [showVersions, setShowVersions] = useState(false);

  if (!product) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-mono text-white/40">product not found</p>
      </div>
    );
  }

  const subscribers = customers.filter((c) =>
    c.subscriptions.some((s) => s.product_id === product.id)
  );

  const togglePrice = (priceId: string) => {
    setExpandedPrices((prev) => ({ ...prev, [priceId]: !prev[priceId] }));
  };

  const runSimulation = () => {
    try {
      const payload = JSON.parse(simPayload);
      const price = product.prices.find((p) => p.event_type === payload.event_type);
      if (!price) { setSimResult("⚠ No matching price for event_type: " + payload.event_type); return; }
      let fee = 0;
      if (price.usage_calculation === "volume" && price.volume_field && price.unit_price) {
        fee = (payload[price.volume_field] || 0) * price.unit_price;
      } else if (price.usage_calculation === "unit" && price.unit_price) {
        fee = price.unit_price;
      }
      setSimResult(`✓ Calculated fee: ${fee.toFixed(6)} ${price.asset_code}\n  Price: ${price.id}\n  Calculation: ${price.usage_calculation}`);
    } catch { setSimResult("✗ Invalid JSON payload"); }
  };

  const currentVersion = product.versions.find(v => v.status === "published") || product.versions[0];

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav className="font-mono text-xs text-white/40">
        <Link to="/products" className="hover:text-white">Products</Link>
        <span className="mx-2">{">"}</span>
        <span className="text-white/60">{product.code}</span>
      </nav>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-2xl font-bold uppercase tracking-wider text-white">{product.name}</h1>
          <span className="border border-dotted border-white/20 text-white/60 text-xs px-1.5 py-0.5 font-mono">v{currentVersion?.version || 1}</span>
          <StatusBadgeOutlined status={currentVersion?.status || product.status} />
        </div>
        <div className="mt-2 flex items-center gap-2 font-mono text-xs text-white/40">
          <span>{product.code}</span>
          <span>·</span>
          <CopyableId value={product.id} size="sm" />
        </div>
      </div>

      {/* Prices Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[11px] uppercase tracking-wider text-white/40">Prices</span>
          <span className="inline-flex items-center justify-center bg-white/10 text-white font-mono text-[10px] min-w-[18px] h-[18px] px-1">
            {product.prices.length}
          </span>
        </div>

        <div className="space-y-2">
          {product.prices.map((price) => {
            const isExpanded = expandedPrices[price.id] || false;
            const priceName = price.event_type || (price.type === "fixed" ? "subscription" : "usage");
            const billingBadgeVariant = price.billing_model === "real_time" ? "realtime" : "recurring";

            return (
              <div
                key={price.id}
                className={`border bg-[#0a0a0a] ${isExpanded ? "border-solid border-[#1e1e1e]" : "border-dashed border-[#2a2a2a]"}`}
              >
                {/* Collapsed row */}
                <button
                  onClick={() => togglePrice(price.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span className="font-mono text-sm font-bold text-white">{priceName}</span>
                  <PriceBadge label={price.type === "usage" ? "USAGE_BASED" : "FIXED"} variant="usage" />
                  <PriceBadge label={price.billing_model === "real_time" ? "REAL_TIME" : "RECURRING"} variant={billingBadgeVariant} />
                  <span className="ml-auto flex items-center gap-2">
                    <CopyableId value={price.id} size="xs" />
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                  </span>
                </button>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="border-t border-[#1e1e1e] px-6 py-4 space-y-4">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-2">Usage Calculation</div>
                    <div className="space-y-2">
                      {price.event_type && (
                        <div className="flex justify-between font-mono text-[13px]">
                          <span className="text-white/40">EVENT TYPE</span>
                          <span className="text-white">{price.event_type}</span>
                        </div>
                      )}
                      {price.usage_calculation && (
                        <div className="flex justify-between font-mono text-[13px]">
                          <span className="text-white/40">USAGE TYPE</span>
                          <span className="text-white">{price.usage_calculation}</span>
                        </div>
                      )}
                      {price.volume_field && (
                        <div className="flex justify-between font-mono text-[13px]">
                          <span className="text-white/40">VOLUME FIELD</span>
                          <span className="text-white">{price.volume_field}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[#1e1e1e] pt-3">
                      {price.tiers && price.tiers.length > 0 ? (
                        <div className="space-y-2">
                          {price.tiers.map((tier, i) => (
                            <div key={i} className="flex justify-between font-mono text-[13px]">
                              <span className="text-white/40">
                                {tier.dimensions ? Object.values(tier.dimensions).join(", ") : `Tier ${i + 1}`}
                              </span>
                              <span className="text-white font-bold">
                                {price.asset_code === "USD" ? "$" : ""}{tier.unit_price}/{price.volume_field || "unit"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-between font-mono text-[13px]">
                          <span className="text-white/40">{price.asset_code}</span>
                          <span className="text-white font-bold">
                            {price.asset_code === "USD" ? "$" : ""}
                            {price.unit_price !== undefined ? price.unit_price : price.amount}
                            /{price.volume_field || "unit"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setShowAddPrice(true)}
          className="mt-3 w-full border border-dashed border-[#2a2a2a] bg-transparent px-4 py-3 font-mono text-xs text-white/60 hover:bg-white/[0.02] hover:text-white"
        >
          + Add Price
        </button>
      </div>

      {/* Usage Simulator — kept exactly as-is */}
      <div>
        <div className="font-mono text-xs text-white/50 border-b border-dotted border-white/30 pb-3 mb-4">
          ┌─ USAGE SIMULATOR ──────────────────────────┐
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-white/40 mb-2">Event Payload</label>
            <textarea
              value={simPayload}
              onChange={(e) => setSimPayload(e.target.value)}
              className="h-36 w-full border border-dotted border-white/20 bg-white/5 p-4 font-mono text-xs leading-relaxed focus:outline-none focus:border-white/30"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-white/40 mb-2">Result</label>
            <pre className="h-36 overflow-auto border border-dotted border-white/20 bg-white/5 p-4 font-mono text-xs leading-relaxed text-white/60">
              {simResult || "$ run simulation to see calculated fees..."}
            </pre>
          </div>
        </div>
        <button onClick={runSimulation} className="mt-4 bg-white text-black px-4 py-2 font-mono text-xs uppercase tracking-wide hover:bg-white/90">
          ▶ Run
        </button>
      </div>

      {/* Subscribers */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[11px] uppercase tracking-wider text-white/40">Subscribers</span>
          <span className="inline-flex items-center justify-center bg-white/10 text-white font-mono text-[10px] min-w-[18px] h-[18px] px-1">
            {subscribers.length}
          </span>
        </div>

        {subscribers.length === 0 ? (
          <p className="font-mono text-sm text-white/40 py-4">
            <span className="terminal-cursor">$ no subscribers </span>
          </p>
        ) : (
          <div className="space-y-0">
            {subscribers.map((c) => {
              const sub = c.subscriptions.find((s) => s.product_id === product.id);
              return (
                <div key={c.id} className="flex items-center justify-between border-b border-[#1a1a1a] py-4 px-1">
                  {/* Left: name + email */}
                  <div>
                    <Link to={`/customers/${c.id}`} className="font-mono text-sm font-bold text-white hover:text-[#2dd4aa]">
                      {c.name}
                    </Link>
                    <div className="font-mono text-xs text-white/40 mt-0.5">{c.email}</div>
                  </div>

                  {/* Middle: status + sub info */}
                  <div className="flex flex-col items-center">
                    <SubscriberStatusBadge status={sub?.status || c.status} />
                    <div className="font-mono text-xs text-white/30 mt-1">
                      v{currentVersion?.version || 1} · {truncateId(sub?.id || "")}
                    </div>
                  </div>

                  {/* Right: date */}
                  <div className="font-mono text-xs text-white/40">
                    {sub?.start_date ? format(new Date(sub.start_date), "M/d/yyyy") : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Version History */}
      <div>
        <button
          onClick={() => setShowVersions(!showVersions)}
          className="flex items-center gap-2 font-mono text-[13px] text-white/40 hover:text-white/60 w-full"
        >
          {showVersions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <Clock className="w-3.5 h-3.5" />
          <span>Version History</span>
          <span className="inline-flex items-center justify-center bg-white/10 text-white font-mono text-[10px] min-w-[18px] h-[18px] px-1 ml-1">
            {product.versions.length}
          </span>
        </button>

        {showVersions && (
          <div className="mt-3 pl-6 space-y-3">
            {product.versions.map((v) => (
              <div key={v.version} className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-white">v{v.version}</span>
                  <StatusBadgeOutlined status={v.status} />
                </div>
                <span className="font-mono text-xs text-white/30 mt-0.5">
                  {format(new Date(v.created_at), "MMM dd HH:mm:ss")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddPrice && (
        <AddPriceWizard
          product={product}
          onClose={() => setShowAddPrice(false)}
          onPriceAdded={(price) => {
            addPriceToProduct(product.id, price);
            setShowAddPrice(false);
          }}
        />
      )}
    </div>
  );
}

function SubscriberStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (["active", "published"].includes(s)) {
    return (
      <span className="inline-flex items-center border border-[#2dd4aa] text-[#2dd4aa] px-1.5 py-0.5 font-mono text-[10px] uppercase">
        {status}
      </span>
    );
  }
  if (["suspended", "cancelled", "inactive"].includes(s)) {
    return (
      <span className="inline-flex items-center bg-[#2a0d0d] text-[#ef4444] px-1.5 py-0.5 font-mono text-[10px] uppercase">
        {status}
      </span>
    );
  }
  if (["pending", "action_required"].includes(s)) {
    return (
      <span className="inline-flex items-center bg-[#2a1a00] text-[#f59e0b] px-1.5 py-0.5 font-mono text-[10px] uppercase">
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center border border-[#555] text-[#555] px-1.5 py-0.5 font-mono text-[10px] uppercase">
      {status}
    </span>
  );
}
