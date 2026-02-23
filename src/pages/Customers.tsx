import { useState } from "react";
import { Link } from "react-router-dom";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { customers } from "@/data/customers";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";

export default function Customers() {
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.external_id.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-space text-2xl font-bold uppercase tracking-wide">$ customers</h1>
        <p className="font-ibm-plex text-sm text-muted-foreground">{customers.length} customers</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="search by name, email, or external_id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-dashed border-foreground/30 bg-transparent pl-10 font-ibm-plex text-sm"
        />
      </div>

      <TerminalCard title="CUSTOMER LIST">
        <div className="overflow-x-auto">
          <table className="w-full font-ibm-plex text-sm">
            <thead>
              <tr className="border-b border-dashed border-foreground/30 text-left">
                <th className="px-3 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground">Name</th>
                <th className="px-3 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground">Email</th>
                <th className="px-3 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground">External ID</th>
                <th className="px-3 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground">Subs</th>
                <th className="px-3 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground">Balance</th>
                <th className="px-3 py-2 font-space text-xs uppercase tracking-wide text-muted-foreground">Created</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => {
                const primaryBalance = customer.wallet.accounts[0];
                return (
                  <tr key={customer.id} className="border-b border-dashed border-foreground/10 transition-colors hover:bg-accent/50">
                    <td className="px-3 py-3 font-bold">{customer.name}</td>
                    <td className="px-3 py-3 text-muted-foreground">{customer.email}</td>
                    <td className="px-3 py-3">{customer.external_id}</td>
                    <td className="px-3 py-3">{customer.subscriptions.length}</td>
                    <td className="px-3 py-3">
                      {primaryBalance
                        ? `${primaryBalance.available.toFixed(2)} ${primaryBalance.asset_code}`
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground text-xs">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        view <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                    no customers found matching "{search}"
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
