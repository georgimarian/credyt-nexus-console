import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useProductStore } from "@/stores/productStore";
import type { Customer } from "@/data/types";

interface CreateCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}

export function CreateCustomerModal({ open, onClose, onCreated }: CreateCustomerModalProps) {
  const { products } = useProductStore();
  const activeProducts = products.filter(p => p.status === "active");

  const [externalId, setExternalId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [initialBalance, setInitialBalance] = useState("");
  const [autoTopup, setAutoTopup] = useState(false);
  const [threshold, setThreshold] = useState("");
  const [topupAmount, setTopupAmount] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!externalId.trim()) errs.externalId = "External ID is required";
    if (!name.trim()) errs.name = "Display name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email format";
    if (autoTopup) {
      if (!threshold.trim()) errs.threshold = "Threshold is required";
      if (!topupAmount.trim()) errs.topupAmount = "Top-up amount is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;

    const subscriptions = selectedProductIds.map(pid => {
      const prod = activeProducts.find(p => p.id === pid)!;
      return {
        id: `sub_${Date.now().toString(36)}_${pid}`,
        product_id: prod.id,
        product_name: prod.name,
        status: "active" as const,
        start_date: new Date().toISOString(),
      };
    });

    const customer: Customer = {
      id: `cust_${Date.now().toString(36)}`,
      name: name.trim(),
      email: email.trim(),
      external_id: externalId.trim(),
      status: "active",
      created_at: new Date().toISOString(),
      auto_topup: autoTopup
        ? { enabled: true, threshold: parseFloat(threshold) || 0, amount: parseFloat(topupAmount) || 0 }
        : undefined,
      subscriptions,
      wallet: {
        accounts: [{ asset_code: currency, available: parseFloat(initialBalance) || 0, pending_in: 0, pending_out: 0 }],
        credit_grants: [],
        transactions: parseFloat(initialBalance) > 0
          ? [{ id: `tx_${Date.now().toString(36)}`, type: "top_up" as const, amount: parseFloat(initialBalance), asset_code: currency, description: "Initial deposit", created_at: new Date().toISOString() }]
          : [],
      },
    };
    onCreated(customer);
    toast({ title: "done: Customer created", description: `${customer.name} has been added.` });
    setExternalId(""); setName(""); setEmail(""); setCurrency("USD"); setInitialBalance(""); setAutoTopup(false); setThreshold(""); setTopupAmount(""); setSelectedProductIds([]); setErrors({});
  };

  const inputCls = "w-full border border-dotted border-white/20 bg-transparent px-3 py-2 font-ibm-plex text-sm placeholder:text-white/30 focus:outline-none focus:border-white/60";
  const selectCls = "w-full border border-dotted border-white/20 bg-transparent px-3 py-2 font-ibm-plex text-sm text-white focus:outline-none";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <div className="border-b border-dotted border-white/[0.08] px-8 py-4">
          <span className="font-space text-xs text-white/50">┌─ CREATE CUSTOMER ────────────────────┐</span>
        </div>

        <div className="space-y-5 px-8 py-6 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corp" className={inputCls} />
            {errors.name && <p className="mt-1 font-ibm-plex text-xs text-[#F87171]">{errors.name}</p>}
          </div>
          <div>
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">External ID</label>
            <input value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder="e.g. usr_8821" className={inputCls} />
            <p className="mt-1 font-ibm-plex text-xs text-white/30">Your system's user ID</p>
            {errors.externalId && <p className="mt-1 font-ibm-plex text-xs text-[#F87171]">{errors.externalId}</p>}
          </div>
          <div>
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="billing@example.com" className={inputCls} />
            {errors.email && <p className="mt-1 font-ibm-plex text-xs text-[#F87171]">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`${selectCls} bg-card`}>
                <option value="USD">USD</option>
                <option value="CREDITS">CREDITS</option>
              </select>
            </div>
            <div>
              <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Initial Balance</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-ibm-plex text-sm text-white/40">$</span>
                <input type="number" step="any" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} placeholder="0.00" className={`${inputCls} pl-7`} />
              </div>
            </div>
          </div>

          <div className="border-t border-dotted border-white/[0.08] pt-5">
            <div className="flex items-center justify-between">
              <label className="font-space text-xs uppercase tracking-wider text-white/40">Auto Top-up</label>
              <Switch checked={autoTopup} onCheckedChange={setAutoTopup} />
            </div>
            {autoTopup && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Threshold</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-ibm-plex text-sm text-white/40">$</span>
                    <input type="number" step="any" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="10.00" className={`${inputCls} pl-7`} />
                  </div>
                  {errors.threshold && <p className="mt-1 font-ibm-plex text-xs text-[#F87171]">{errors.threshold}</p>}
                </div>
                <div>
                  <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Top-up Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-ibm-plex text-sm text-white/40">+$</span>
                    <input type="number" step="any" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} placeholder="25.00" className={`${inputCls} pl-8`} />
                  </div>
                  {errors.topupAmount && <p className="mt-1 font-ibm-plex text-xs text-[#F87171]">{errors.topupAmount}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Subscription — multi-select product list */}
          <div className="border-t border-dotted border-white/[0.08] pt-5">
            <div className="font-space text-xs uppercase tracking-wider text-white/40 mb-3">Subscription</div>
            <div>
              {activeProducts.length === 0 ? (
                <div className="font-ibm-plex text-sm text-white/30">No active products available</div>
              ) : (
                <div>
                  {activeProducts.map(p => {
                    const selected = selectedProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProduct(p.id)}
                        className={`flex items-center justify-between py-3 border-b border-dotted border-white/[0.08] cursor-pointer transition-colors ${selected ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-ibm-plex text-sm font-medium">{p.name}</span>
                          <span className="border border-dotted border-white/20 px-1.5 font-ibm-plex text-xs text-white/60">{p.code}</span>
                        </div>
                        <span className={`font-mono text-sm ${selected ? "text-[#4ADE80]" : "text-white/20"}`}>
                          {selected ? "✓" : "○"}
                        </span>
                      </div>
                    );
                  })}
                  <p className="mt-2 font-ibm-plex text-xs text-white/30">
                    {selectedProductIds.length} product{selectedProductIds.length !== 1 ? "s" : ""} selected
                  </p>
                </div>
              )}
              <p className="mt-1 font-ibm-plex text-xs text-white/30">Subscribing provisions wallet accounts automatically</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-dotted border-white/[0.08] px-8 py-4">
          <button onClick={onClose} className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5">Cancel</button>
          <button onClick={handleCreate} className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90">Create Customer</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}