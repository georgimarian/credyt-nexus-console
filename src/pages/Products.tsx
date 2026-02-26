import { useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { CopyableId } from "@/components/terminal/CopyableId";
import { useProductStore } from "@/stores/productStore";
import { CreateProductWizard } from "@/components/products/CreateProductWizard";
import { Input } from "@/components/ui/input";

const PER_PAGE = 20;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Products() {
  const { products } = useProductStore();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(0);

  const filtered = products.filter(
    (p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

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
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        className="border-white/[0.08] bg-transparent pl-4 font-ibm-plex text-sm"
      />

      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-dashed border-white/20">
            <th className="w-[35%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Product Name</th>
            <th className="w-[18%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Product ID</th>
            <th className="w-[10%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Status</th>
            <th className="w-[8%] px-4 pb-3 text-center font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Prices</th>
            <th className="w-[8%] px-4 pb-3 text-center font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Subs</th>
            <th className="w-[15%] px-4 pb-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Type</th>
            <th className="w-[6%] px-4 pb-3"></th>
          </tr>
        </thead>
        <tbody>
          {paged.map((product) => {
            const version = product.versions[0]?.version || 1;
            const model = product.pricing_model || "USAGE_BASED";

            return (
              <tr
                key={product.id}
                className="border-b border-dotted border-white/[0.08] hover:bg-white/[0.02] transition-colors cursor-pointer"
                onClick={() => {}}
              >
                <td className="px-4 py-4">
                  <Link to={`/products/${product.id}`} className="block">
                    <div className="font-ibm-plex text-sm font-bold">
                      {product.name}
                      <span className="ml-2 border border-white/20 text-white/60 text-xs px-1.5 py-0.5 font-ibm-plex font-normal">v{version}</span>
                    </div>
                    <div className="text-xs text-white/30 font-ibm-plex mt-0.5">
                      {product.code} · {formatDate(product.created_at)}
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-4"><CopyableId value={product.id} /></td>
                <td className="px-4 py-4"><StatusBadge status={product.status} /></td>
                <td className="px-4 py-4 text-center font-ibm-plex text-sm font-light">{product.prices.length}</td>
                <td className="px-4 py-4 text-center font-ibm-plex text-sm font-light">{product.subscriber_count}</td>
                <td className="px-4 py-4">
                  <span className="border border-white/20 text-white/40 text-xs px-2 py-0.5 font-ibm-plex">{model}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <Link to={`/products/${product.id}`} className="text-white/40 hover:text-white text-sm">→</Link>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center font-ibm-plex text-sm text-white/40">
                <span className="terminal-cursor">$ no products found </span>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-4 pt-4 mt-2 border-t border-dotted border-white/10">
          <button disabled={page === 0} onClick={() => setPage(page - 1)} className="text-xs font-mono uppercase tracking-wide text-white/40 hover:text-white cursor-pointer disabled:text-white/15 disabled:pointer-events-none">← Previous</button>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="text-xs font-mono uppercase tracking-wide text-white/40 hover:text-white cursor-pointer disabled:text-white/15 disabled:pointer-events-none">Next →</button>
        </div>
      )}
    </div>
  );
}
