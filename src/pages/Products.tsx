import { useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { CopyableId } from "@/components/terminal/CopyableId";
import { useProductStore } from "@/stores/productStore";
import { CreateProductWizard } from "@/components/products/CreateProductWizard";
import { Input } from "@/components/ui/input";

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

      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-dashed border-white/15">
            <th className="w-[35%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Product Name</th>
            <th className="w-[25%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Product ID</th>
            <th className="w-[10%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Status</th>
            <th className="w-[10%] px-4 pb-3 text-center font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Prices</th>
            <th className="w-[10%] px-4 pb-3 text-center font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Subs</th>
            <th className="w-[10%] px-4 pb-3"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((product) => (
            <tr key={product.id} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-4">
                <div className="font-ibm-plex text-sm font-medium">{product.name}
                  <span className="ml-2 border border-white/20 text-white/60 text-xs px-1.5 py-0.5 font-ibm-plex">v{product.versions[0]?.version || 1}</span>
                </div>
              </td>
              <td className="px-4 py-4"><CopyableId value={product.id} /></td>
              <td className="px-4 py-4"><StatusBadge status={product.status} /></td>
              <td className="px-4 py-4 text-center font-ibm-plex text-sm font-light">{product.prices.length}</td>
              <td className="px-4 py-4 text-center font-ibm-plex text-sm font-light">{product.subscriber_count}</td>
              <td className="px-4 py-4 text-right">
                <Link to={`/products/${product.id}`} className="text-white/40 hover:text-white text-sm">→</Link>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center font-ibm-plex text-sm text-white/40">
                <span className="terminal-cursor">$ no products found </span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}