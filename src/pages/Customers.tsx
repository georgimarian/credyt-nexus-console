import { useState } from "react";
import { Link } from "react-router-dom";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { CopyableId } from "@/components/terminal/CopyableId";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { CreateCustomerModal } from "@/components/customers/CreateCustomerModal";
import { customers as initialCustomers } from "@/data/customers";
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowRight } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [customerList, setCustomerList] = useState(initialCustomers);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = customerList.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.external_id.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-space text-2xl font-bold uppercase tracking-wider mb-1">Customers</h1>
          <p className="font-ibm-plex text-sm text-muted-foreground">{customerList.length} customers</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 font-space text-xs uppercase tracking-wide text-background transition-all duration-150 hover:bg-foreground/80"
        >
          <Plus className="h-3.5 w-3.5" />
          New Customer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or external_id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border-foreground/[0.12] bg-transparent pl-10 font-ibm-plex text-sm"
        />
      </div>

      <TerminalCard title="CUSTOMER LIST">
        <Table>
          <TableHeader>
            <TableRow className="border-foreground/[0.06] hover:bg-transparent">
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Customer</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Email</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">External ID</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Status</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest text-center">Subs</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest text-right">Balance</TableHead>
              <TableHead className="h-10 w-12 px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((customer) => {
              const primaryBalance = customer.wallet.accounts[0];
              return (
                <TableRow key={customer.id} className="border-foreground/[0.04] transition-all duration-150 hover:bg-accent/20">
                  <TableCell className="px-4 py-3">
                    <Link to={`/customers/${customer.id}`} className="block transition-all duration-150 hover:opacity-70">
                      <div className="font-ibm-plex text-sm font-medium">{customer.name}</div>
                      <div className="font-ibm-plex text-xs text-muted-foreground mt-0.5"># {customer.id}</div>
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-ibm-plex text-sm text-muted-foreground">{customer.email}</TableCell>
                  <TableCell className="px-4 py-3">
                    <CopyableId value={customer.external_id} />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusBadge status={customer.status} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center font-ibm-plex text-sm">{customer.subscriptions.length}</TableCell>
                  <TableCell className="px-4 py-3 text-right font-ibm-plex text-sm">
                    {primaryBalance ? `${primaryBalance.available.toFixed(2)} ${primaryBalance.asset_code}` : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Link to={`/customers/${customer.id}`} className="inline-flex text-muted-foreground transition-all duration-150 hover:text-foreground">
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

      <CreateCustomerModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(customer) => {
          setCustomerList([customer, ...customerList]);
          setShowCreate(false);
        }}
      />
    </div>
  );
}
