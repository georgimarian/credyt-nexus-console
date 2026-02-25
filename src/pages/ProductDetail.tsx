import { useParams, Link } from "react-router-dom";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { CopyableId } from "@/components/terminal/CopyableId";
import { useProductStore } from "@/stores/productStore";
import { customers } from "@/data/customers";
import { useState } from "react";
import { AddPriceWizard } from "@/components/products/AddPriceWizard";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { products, addPriceToProduct } = useProductStore();
  const product = products.find((p) => p.id === id);
  const [simPayload, setSimPayload] = useState('{\n  "event_type": "chat_completion",\n  "total_tokens": 1500\n}');
  const [simResult, setSimResult] = useState<string | null>(null);
  const [showAddPrice, setShowAddPrice] = useState(false);

  if (!product) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-ibm-plex text-white/40">product not found</p>
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

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav className="font-ibm-plex text-xs text-white/40">
        <Link to="/products" className="hover:text-white">PRODUCTS</Link>
        <span className="mx-2">{">"}</span>
        <span className="text-white">{product.code}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-space text-2xl font-bold uppercase tracking-wider">{product.name}</h1>
            <span className="border border-white/20 text-white/60 text-xs px-1.5 py-0.5 font-ibm-plex">v{product.versions[0]?.version || 1}</span>
            <StatusBadge status={product.status} />
          </div>
          <div className="mt-2 flex items-center gap-4">
            <CopyableId label="ID" value={product.id} size="sm" />
            <span className="font-ibm-plex text-xs text-white/40">code: {product.code}</span>
          </div>
        </div>
        <button
          onClick={() => setShowAddPrice(true)}
          className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90"
        >
          Configure Pricing →
        </button>
      </div>

      {/* Prices — flat rows */}
      <div>
        <div className="font-space text-xs uppercase tracking-wider text-white/40 border-b border-dashed border-white/15 pb-3 mb-4">
          ┌─ PRICES ─────────────────────────────┐
        </div>
        {product.prices.map((price, idx) => (
          <div key={price.id} className={idx < product.prices.length - 1 ? "border-b border-white/[0.06] py-4" : "py-4"}>
            <div className="flex items-center gap-6 font-ibm-plex text-sm">
              <span className="font-medium">{price.event_type || "subscription"}</span>
              <span className="text-white/40">{price.usage_calculation || "fixed"}</span>
              <span className="text-white/40">{price.billing_model}</span>
              <span className="text-[#4ADE80] ml-auto">
                {price.unit_price !== undefined ? `${price.unit_price} ${price.asset_code}` : price.amount !== undefined ? `${price.amount} ${price.asset_code}` : ""}
              </span>
              {price.volume_field && <span className="text-white/40 text-xs">per {price.volume_field}</span>}
            </div>
            {price.tiers && price.tiers.length > 0 && (
              <div className="mt-3 ml-6 space-y-1">
                {price.tiers.map((tier, i) => (
                  <div key={i} className="font-ibm-plex text-xs text-white/50">
                    {tier.dimensions ? JSON.stringify(tier.dimensions) : `up to ${tier.up_to || "∞"}`}: {tier.unit_price} {price.asset_code}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <button
          onClick={() => setShowAddPrice(true)}
          className="mt-8 border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5"
        >
          + Add Price
        </button>
      </div>

      {/* Usage Simulator */}
      <div>
        <div className="font-space text-xs uppercase tracking-wider text-white/40 border-b border-dashed border-white/15 pb-3 mb-4">
          ┌─ USAGE SIMULATOR ────────────────────┐
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Event Payload</label>
            <textarea
              value={simPayload}
              onChange={(e) => setSimPayload(e.target.value)}
              className="h-36 w-full border border-white/10 bg-white/5 p-4 font-ibm-plex text-xs leading-relaxed focus:outline-none focus:border-white/30"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Result</label>
            <pre className="h-36 overflow-auto border border-white/[0.06] bg-white/5 p-4 font-ibm-plex text-xs leading-relaxed text-white/60">
              {simResult || "$ run simulation to see calculated fees..."}
            </pre>
          </div>
        </div>
        <button onClick={runSimulation} className="mt-4 bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90">
          ▶ Run
        </button>
      </div>

      {/* Subscribers */}
      <div>
        <div className="font-space text-xs uppercase tracking-wider text-white/40 border-b border-dashed border-white/15 pb-3 mb-4">
          ┌─ SUBSCRIBERS ({subscribers.length}) ──────────────────┐
        </div>
        {subscribers.length === 0 ? (
          <p className="font-ibm-plex text-sm text-white/40 py-4">
            <span className="terminal-cursor">$ no subscribers </span>
          </p>
        ) : (
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-dashed border-white/15">
                <th className="px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Name</th>
                <th className="px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Email</th>
                <th className="px-4 pb-3 text-right font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">External ID</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((c) => (
                <tr key={c.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                  <td className="px-4 py-4">
                    <Link to={`/customers/${c.id}`} className="font-ibm-plex text-sm font-medium hover:text-[#4ADE80]">{c.name}</Link>
                  </td>
                  <td className="px-4 py-4 font-ibm-plex text-sm font-light text-white/60">{c.email}</td>
                  <td className="px-4 py-4 text-right font-ibm-plex text-xs text-white/40">{c.external_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
