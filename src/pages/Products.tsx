import { useState } from "react";
import { Link } from "react-router-dom";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { EmptyState } from "@/components/terminal/EmptyState";
import { useProductStore } from "@/stores/productStore";
import { CreateProductWizard } from "@/components/products/CreateProductWizard";
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowRight, Package } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

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
          <p className="font-ibm-plex text-sm text-muted-foreground">{products.length} products configured</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 font-space text-xs uppercase tracking-wide text-background transition-all duration-150 hover:bg-foreground/80"
        >
          <Plus className="h-3.5 w-3.5" />
          New Product
        </button>
      </div>

      {showCreate && <CreateProductWizard onClose={() => setShowCreate(false)} />}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border-foreground/[0.12] bg-transparent pl-10 font-ibm-plex text-sm"
        />
      </div>

      <TerminalCard title="PRODUCT CATALOG">
        {filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-foreground/[0.06] hover:bg-transparent">
                <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Product</TableHead>
                <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Code</TableHead>
                <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Status</TableHead>
                <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest text-center">Prices</TableHead>
                <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest text-center">Subs</TableHead>
                <TableHead className="h-10 w-12 px-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id} className="border-foreground/[0.04] transition-all duration-150 hover:bg-accent/20">
                  <TableCell className="px-4 py-3">
                    <div>
                      <div className="font-ibm-plex text-sm font-medium">{product.name}</div>
                      <div className="font-ibm-plex text-xs text-muted-foreground mt-0.5"># {product.id}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-ibm-plex text-sm text-muted-foreground">{product.code}</TableCell>
                  <TableCell className="px-4 py-3"><StatusBadge status={product.status} /></TableCell>
                  <TableCell className="px-4 py-3 text-center font-ibm-plex text-sm">{product.prices.length}</TableCell>
                  <TableCell className="px-4 py-3 text-center font-ibm-plex text-sm">{product.subscriber_count}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Link
                      to={`/products/${product.id}`}
                      className="inline-flex text-muted-foreground transition-all duration-150 hover:text-foreground"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={<Package className="h-8 w-8" />}
            title={search ? `No products matching "${search}"` : "No products yet"}
            description={
              search
                ? "Try a different search term or create a new product."
                : "Products define how you charge your customers. Create your first product to get started."
            }
            action={
              !search ? (
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 font-space text-xs uppercase tracking-wide text-background transition-all duration-150 hover:bg-foreground/80"
                >
                  <Plus className="h-3 w-3" /> Create First Product
                </button>
              ) : undefined
            }
          />
        )}
      </TerminalCard>
    </div>
  );
}
