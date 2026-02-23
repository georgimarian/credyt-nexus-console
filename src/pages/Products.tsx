import { useState } from "react";
import { Link } from "react-router-dom";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { useProductStore } from "@/stores/productStore";
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowRight, X } from "lucide-react";
import type { Product } from "@/data/types";

export default function Products() {
  const { products, addProduct } = useProductStore();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  const filtered = products.filter(
    (p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!newName.trim() || !newCode.trim()) return;
    const product: Product = {
      id: `prod_${Date.now()}`,
      code: newCode.trim().toLowerCase().replace(/\s+/g, "-"),
      name: newName.trim(),
      status: "draft",
      created_at: new Date().toISOString(),
      prices: [],
      versions: [{ version: 1, status: "draft", created_at: new Date().toISOString() }],
      subscriber_count: 0,
    };
    addProduct(product);
    setNewName("");
    setNewCode("");
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-space text-2xl font-bold uppercase tracking-wide">$ products</h1>
          <p className="font-ibm-plex text-sm text-muted-foreground">{products.length} products configured</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 border border-dashed border-foreground/30 bg-foreground px-4 py-2 font-space text-xs uppercase tracking-wide text-background transition-colors hover:bg-muted-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          New Product
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <TerminalCard
          title="NEW PRODUCT"
          actions={
            <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-space text-xs uppercase tracking-wide text-muted-foreground">
                  Product Name
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. AI Agent Pro"
                  className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-2 font-ibm-plex text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>
              <div>
                <label className="mb-1 block font-space text-xs uppercase tracking-wide text-muted-foreground">
                  Product Code
                </label>
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. ai-agent-pro"
                  className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-2 font-ibm-plex text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || !newCode.trim()}
                className="border border-dashed border-foreground/30 bg-foreground px-4 py-2 font-space text-xs uppercase tracking-wide text-background transition-colors hover:bg-muted-foreground disabled:opacity-30"
              >
                Create Product
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="border border-dashed border-foreground/30 px-4 py-2 font-space text-xs uppercase tracking-wide transition-colors hover:bg-accent"
              >
                Cancel
              </button>
            </div>
            <p className="font-ibm-plex text-xs text-muted-foreground">
              $ product will be created as draft. add prices on the detail page.
            </p>
          </div>
        </TerminalCard>
      )}

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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    no products found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TerminalCard>
    </div>
  );
}
