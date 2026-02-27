import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import type { Customer } from "@/data/types";

interface EditCustomerModalProps {
  open: boolean;
  onClose: () => void;
  customer: Customer;
  onSaved: (customer: Customer) => void;
}

export function EditCustomerModal({ open, onClose, customer, onSaved }: EditCustomerModalProps) {
  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email);
  const [autoTopup, setAutoTopup] = useState(customer.auto_topup?.enabled || false);
  const [threshold, setThreshold] = useState(customer.auto_topup?.threshold?.toString() || "");
  const [topupAmount, setTopupAmount] = useState(customer.auto_topup?.amount?.toString() || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setName(customer.name);
    setEmail(customer.email);
    setAutoTopup(customer.auto_topup?.enabled || false);
    setThreshold(customer.auto_topup?.threshold?.toString() || "");
    setTopupAmount(customer.auto_topup?.amount?.toString() || "");
    setErrors({});
  }, [customer, open]);

  const validate = () => {
    const errs: Record<string, string> = {};
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

  const handleSave = () => {
    if (!validate()) return;
    const updated: Customer = {
      ...customer,
      name: name.trim(),
      email: email.trim(),
      auto_topup: autoTopup
        ? { enabled: true, threshold: parseFloat(threshold) || 0, amount: parseFloat(topupAmount) || 0 }
        : customer.auto_topup ? { ...customer.auto_topup, enabled: false } : undefined,
    };
    onSaved(updated);
    toast({ title: "done: Customer updated" });
  };

  const inputCls = "w-full border border-dotted border-white/20 bg-transparent px-3 py-2 font-ibm-plex text-sm placeholder:text-white/30 focus:outline-none focus:border-white/60";
  const readOnlyCls = "w-full bg-white/5 px-3 py-2 font-ibm-plex text-sm text-white/40 border border-dotted border-white/10 cursor-not-allowed";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <div className="border-b border-dotted border-white/20 px-8 py-4">
          <span className="font-space text-xs text-white/50">┌─ EDIT CUSTOMER ──────────────────────┐</span>
        </div>

        <div className="space-y-5 px-8 py-6">
          <div>
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            {errors.name && <p className="mt-1 font-ibm-plex text-xs text-[#F87171]">{errors.name}</p>}
          </div>
          <div>
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            {errors.email && <p className="mt-1 font-ibm-plex text-xs text-[#F87171]">{errors.email}</p>}
          </div>
          <div>
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">External ID</label>
            <input value={customer.external_id} readOnly className={readOnlyCls} />
            <p className="mt-1 font-ibm-plex text-xs text-white/30">Cannot be changed after creation</p>
          </div>
          <div>
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Currency</label>
            <input value={customer.wallet.accounts[0]?.asset_code || "USD"} readOnly className={readOnlyCls} />
          </div>

          <div className="border-t border-dotted border-white/20 pt-5">
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
        </div>

        <div className="flex items-center justify-between border-t border-dotted border-white/20 px-8 py-4">
          <button onClick={onClose} className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5">Cancel</button>
          <button onClick={handleSave} className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90">Save Changes →</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}