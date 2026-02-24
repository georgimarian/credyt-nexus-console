import { useState } from "react";
import { Link } from "react-router-dom";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { CopyableId } from "@/components/terminal/CopyableId";
import { customers } from "@/data/customers";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function Customers() {
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.external_id.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-space text-2xl font-bold uppercase tracking-wide">Customers</h1>
        <p className="mt-1 font-ibm-plex text-sm text-muted-foreground">{customers.length} customers</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or external_id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-dashed border-foreground/30 bg-transparent pl-10 font-ibm-plex text-sm"
        />
      </div>

      <TerminalCard title="CUSTOMER LIST">
        <Table>
          <TableHeader>
            <TableRow className="border-dashed border-foreground/20 hover:bg-transparent">
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Name</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Email</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Customer ID</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">External ID</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest text-center">Subs</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest text-right">Balance</TableHead>
              <TableHead className="h-10 w-16 px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((customer) => {
              const primaryBalance = customer.wallet.accounts[0];
              return (
                <TableRow key={customer.id} className="border-dashed border-foreground/10 hover:bg-accent/30">
                  <TableCell className="px-4 py-3.5 font-ibm-plex text-sm font-semibold">{customer.name}</TableCell>
                  <TableCell className="px-4 py-3.5 font-ibm-plex text-sm text-muted-foreground">{customer.email}</TableCell>
                  <TableCell className="px-4 py-3.5">
                    <CopyableId value={customer.id} truncate={16} />
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <CopyableId value={customer.external_id} />
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-center font-ibm-plex text-sm">{customer.subscriptions.length}</TableCell>
                  <TableCell className="px-4 py-3.5 text-right font-ibm-plex text-sm">
                    {primaryBalance
                      ? `${primaryBalance.available.toFixed(2)} ${primaryBalance.asset_code}`
                      : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <Link
                      to={`/customers/${customer.id}`}
                      className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="px-4 py-12 text-center font-ibm-plex text-sm text-muted-foreground">
                  No customers found matching "{search}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TerminalCard>
    </div>
  );
}
