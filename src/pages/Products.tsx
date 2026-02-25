import { useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { useProductStore } from "@/stores/productStore";
import { CreateProductWizard } from "@/components/products/CreateProductWizard";
import { Input } from "@/components/ui/input";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Products() {
  const { products } = useProductStore();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-space text-2xl font-bold uppercase tracking-wider mb-1">Products</h1>
          <p className="font-ibm-plex text-sm text-white/40">{products.length} products configured</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5"
        >
          + New Product
        </button>
      </div>

      {showCreate && <CreateProductWizard onClose={() => setShowCreate(false)} />}

      <Input
        placeholder="Search by code or name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border-white/[0.08] bg-transparent pl-4 font-ibm-plex text-sm"
      />

      <div className="space-y-0">
        {filtered.map((product) => {
          const version = product.versions[0]?.version || 1;
          const model = product.pricing_model || "USAGE_BASED";

          return (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="block border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors px-4 py-4"
            >
              {/* Line 1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-ibm-plex text-sm font-bold">{product.name}</span>
                  <StatusBadge status={product.status} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="border border-white/20 text-white/40 text-xs px-2 py-0.5 font-ibm-plex">
                    {model}
                  </span>
                  <span className="text-white/40 text-sm">→</span>
                </div>
              </div>
              {/* Line 2 */}
              <div className="text-xs text-white/30 font-ibm-plex mt-1">
                {product.code} · v{version} · {product.prices.length} price{product.prices.length !== 1 ? "s" : ""} · {formatDate(product.created_at)}
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center font-ibm-plex text-sm text-white/40">
            <span className="terminal-cursor">$ no products found </span>
          </div>
        )}
      </div>
    </div>
  );
}
