import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { FieldLabel } from "@/components/terminal/FieldLabel";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import type { Customer } from "@/data/types";

interface CreateCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}

export function CreateCustomerModal({ open, onClose, onCreated }: CreateCustomerModalProps) {
  const [externalId, setExternalId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [initialBalance, setInitialBalance] = useState("");
  const [autoTopup, setAutoTopup] = useState(false);
  const [threshold, setThreshold] = useState("");
  const [topupAmount, setTopupAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      subscriptions: [],
      wallet: {
        accounts: [
          { asset_code: currency, available: parseFloat(initialBalance) || 0, pending_in: 0, pending_out: 0 },
        ],
        credit_grants: [],
        transactions:
          parseFloat(initialBalance) > 0
            ? [
                {
                  id: `tx_${Date.now().toString(36)}`,
                  type: "top_up" as const,
                  amount: parseFloat(initialBalance),
                  asset_code: currency,
                  description: "Initial deposit",
                  created_at: new Date().toISOString(),
                },
              ]
            : [],
      },
    };
    onCreated(customer);
    toast({ title: "✓ Customer created", description: `${customer.name} has been added.` });
    setExternalId("");
    setName("");
    setEmail("");
    setCurrency("USD");
    setInitialBalance("");
    setAutoTopup(false);
    setThreshold("");
    setTopupAmount("");
    setErrors({});
  };

  const inputCls =
    "w-full rounded-md border border-foreground/[0.12] bg-transparent px-3 py-2.5 font-ibm-plex text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/30 transition-all duration-150";
  const selectCls =
    "w-full rounded-md border border-foreground/[0.12] bg-transparent px-3 py-2.5 font-ibm-plex text-sm text-foreground focus:outline-none transition-all duration-150";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-md border-foreground/[0.12] bg-card dark:bg-[hsl(0_0%_6%)] sm:max-w-lg p-0 gap-0">
        <div className="border-b border-dashed border-foreground/[0.08] px-6 py-4">
          <span className="font-space text-xs uppercase tracking-widest text-muted-foreground">
            ┌─ CREATE CUSTOMER ──────────────────┐
          </span>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div>
            <FieldLabel label="External ID" tooltip="Your system's user ID. Maps this customer to your internal records." />
            <input value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder="e.g. usr_8821" className={inputCls} />
            {errors.externalId && <p className="mt-1 font-ibm-plex text-xs text-terminal-red">{errors.externalId}</p>}
          </div>
          <div>
            <FieldLabel label="Display Name" required />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corp" className={inputCls} />
            {errors.name && <p className="mt-1 font-ibm-plex text-xs text-terminal-red">{errors.name}</p>}
          </div>
          <div>
            <FieldLabel label="Email" required />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="billing@example.com" className={inputCls} />
            {errors.email && <p className="mt-1 font-ibm-plex text-xs text-terminal-red">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel label="Currency" />
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectCls}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="CREDITS">CREDITS</option>
              </select>
            </div>
            <div>
              <FieldLabel label="Initial Balance" tooltip="Optional opening balance for the customer's wallet." />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-ibm-plex text-sm text-muted-foreground">$</span>
                <input type="number" step="any" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} placeholder="0.00" className={`${inputCls} pl-7`} />
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-foreground/[0.06] pt-5">
            <div className="flex items-center justify-between">
              <FieldLabel label="Auto Top-up" tooltip="Automatically add funds when balance drops below a threshold." />
              <Switch checked={autoTopup} onCheckedChange={setAutoTopup} />
            </div>
            {autoTopup && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel label="Threshold" tooltip="Top up when balance falls below this amount." />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-ibm-plex text-sm text-muted-foreground">$</span>
                    <input type="number" step="any" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="10.00" className={`${inputCls} pl-7`} />
                  </div>
                  {errors.threshold && <p className="mt-1 font-ibm-plex text-xs text-terminal-red">{errors.threshold}</p>}
                </div>
                <div>
                  <FieldLabel label="Top-up Amount" />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-ibm-plex text-sm text-muted-foreground">+$</span>
                    <input type="number" step="any" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} placeholder="25.00" className={`${inputCls} pl-8`} />
                  </div>
                  {errors.topupAmount && <p className="mt-1 font-ibm-plex text-xs text-terminal-red">{errors.topupAmount}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-foreground/[0.06] px-6 py-4">
          <button onClick={onClose} className="rounded-md px-4 py-2.5 font-space text-xs uppercase tracking-wide text-muted-foreground transition-all duration-150 hover:text-foreground">
            Cancel
          </button>
          <button onClick={handleCreate} className="flex items-center gap-2 rounded-md bg-foreground px-5 py-2.5 font-space text-xs uppercase tracking-wide text-background transition-all duration-150 hover:bg-foreground/80">
            Create Customer →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
