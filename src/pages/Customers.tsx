import { useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { CreateCustomerModal } from "@/components/customers/CreateCustomerModal";
import { customers as initialCustomers } from "@/data/customers";
import { Input } from "@/components/ui/input";

const PER_PAGE = 20;

export default function Customers() {
  const [search, setSearch] = useState("");
  const [customerList, setCustomerList] = useState(initialCustomers);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(0);

  const filtered = customerList.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.external_id.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const getAvgDailySpend = (customer: typeof initialCustomers[0]) => {
    const charges = customer.wallet.transactions.filter((t) => t.type === "charge");
    const totalSpend = charges.reduce((s, t) => s + Math.abs(t.amount), 0);
    const created = new Date(customer.created_at);
    const days = Math.max(1, Math.ceil((Date.now() - created.getTime()) / 86400000));
    return totalSpend / days;
  };

  const getBalance = (customer: typeof initialCustomers[0]) => {
    const primary = customer.wallet.accounts[0];
    if (!primary) return "—";
    if (primary.asset_code === "USD") {
      return `$${primary.available.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${primary.available.toLocaleString()} ${primary.asset_code}`;
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <p className="font-ibm-plex text-sm text-white/40">{customerList.length} customers</p>
        <button
          onClick={() => setShowCreate(true)}
          className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5"
        >
          + New Customer
        </button>
      </div>

      <Input
        placeholder="Search by name, email, or external_id..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        className="border-white/[0.08] bg-transparent pl-4 font-ibm-plex text-sm"
      />

      <div className="border border-white/10">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-white/15">
              <th className="w-[30%] px-4 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Customer</th>
              <th className="w-[25%] px-4 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Email</th>
              <th className="w-[10%] px-4 py-3 text-left font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Status</th>
              <th className="w-[15%] px-4 py-3 text-right font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Balance</th>
              <th className="w-[12%] px-4 py-3 text-right font-space text-xs uppercase tracking-wider text-white/40 whitespace-nowrap">Avg Daily</th>
              <th className="w-[8%] px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {paged.map((customer) => (
              <tr key={customer.id} className="border-b border-white/10 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-4">
                  <Link to={`/customers/${customer.id}`} className="block hover:opacity-80">
                    <div className="font-ibm-plex text-sm font-medium">{customer.name}</div>
                    <div className="font-ibm-plex text-xs text-white/40 mt-1">{customer.id}</div>
                  </Link>
                </td>
                <td className="px-4 py-4 font-ibm-plex text-sm font-light text-white/60">{customer.email}</td>
                <td className="px-4 py-4"><StatusBadge status={customer.status} /></td>
                <td className="px-4 py-4 text-right font-ibm-plex text-sm font-light">{getBalance(customer)}</td>
                <td className="px-4 py-4 text-right font-ibm-plex text-sm font-light text-white/40">${getAvgDailySpend(customer).toFixed(2)}</td>
                <td className="px-4 py-4 text-right">
                  <Link to={`/customers/${customer.id}`} className="text-white/40 hover:text-white text-sm">→</Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center font-ibm-plex text-sm text-white/40">No customers found matching "{search}"</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-4 pt-4 mt-2 border-t border-white/10">
          <button disabled={page === 0} onClick={() => setPage(page - 1)} className="text-xs font-mono uppercase tracking-wide text-white/40 hover:text-white cursor-pointer disabled:text-white/15 disabled:pointer-events-none">← Previous</button>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="text-xs font-mono uppercase tracking-wide text-white/40 hover:text-white cursor-pointer disabled:text-white/15 disabled:pointer-events-none">Next →</button>
        </div>
      )}

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
