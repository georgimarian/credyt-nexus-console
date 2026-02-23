import { useState } from "react";
import { Link } from "react-router-dom";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { EmptyState } from "@/components/terminal/EmptyState";
import { useProductStore } from "@/stores/productStore";
import { CreateProductWizard } from "@/components/products/CreateProductWizard";
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowRight, Package } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-space text-2xl font-bold uppercase tracking-wide">$ products</h1>
          <p className="font-ibm-plex text-sm text-muted-foreground">{products.length} products configured</p>
        </div>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 border border-dashed border-foreground/30 bg-foreground px-4 py-2 font-space text-xs uppercase tracking-wide text-background transition-colors hover:bg-muted-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            New Product
          </button>
        )}
      </div>

      {/* Wizard */}
      {showCreate && <CreateProductWizard onClose={() => setShowCreate(false)} />}

      {!showCreate && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="search by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-dashed border-foreground/30 bg-transparent pl-10 font-ibm-plex text-sm"
            />
          </div>

          <TerminalCard title="PRODUCT CATALOG">
            {filtered.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full font-ibm-plex text-sm">
                  <thead>
                    <tr className="border-b border-dashed border-foreground/30 text-left">
                      <th className="px-3 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground">Code</th>
                      <th className="px-3 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground">Name</th>
                      <th className="px-3 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground">Status</th>
                      <th className="px-3 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground">Prices</th>
                      <th className="px-3 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground">Subscribers</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((product) => (
                      <tr key={product.id} className="border-b border-dashed border-foreground/10 transition-colors hover:bg-accent/50">
                        <td className="px-3 py-3 font-bold">{product.code}</td>
                        <td className="px-3 py-3">{product.name}</td>
                        <td className="px-3 py-3"><StatusBadge status={product.status} /></td>
                        <td className="px-3 py-3">{product.prices.length}</td>
                        <td className="px-3 py-3">{product.subscriber_count}</td>
                        <td className="px-3 py-3">
                          <Link
                            to={`/products/${product.id}`}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                          >
                            view <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={<Package className="h-8 w-8" />}
                title={search ? `no products matching "${search}"` : "no products yet"}
                description={
                  search
                    ? "try a different search term or create a new product."
                    : "products define how you charge your customers. create your first product to get started."
                }
                action={
                  !search ? (
                    <button
                      onClick={() => setShowCreate(true)}
                      className="flex items-center gap-2 border border-dashed border-foreground/30 bg-foreground px-4 py-2 font-space text-xs uppercase tracking-wide text-background transition-colors hover:bg-muted-foreground"
                    >
                      <Plus className="h-3 w-3" /> Create First Product
                    </button>
                  ) : undefined
                }
              />
            )}
          </TerminalCard>
        </>
      )}
    </div>
  );
}
