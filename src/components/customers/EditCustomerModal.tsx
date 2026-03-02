import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { Customer } from "@/data/types";
import { assets as allAssets } from "@/data/assets";

interface AssetTopupConfig {
  enabled: boolean;
  threshold: string;
  amount: string;
}

interface EditCustomerModalProps {
  open: boolean;
  onClose: () => void;
  customer: Customer;
  onSaved: (customer: Customer) => void;
}

export function EditCustomerModal({ open, onClose, customer, onSaved }: EditCustomerModalProps) {
  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(false);

  // Build per-asset topup state from customer wallet accounts
  const customerAssets = customer.wallet.accounts.map(a => a.asset_code);
  const [topupConfigs, setTopupConfigs] = useState<Record<string, AssetTopupConfig>>({});

  useEffect(() => {
    setName(customer.name);
    setEmail(customer.email);
    setErrors({});

    const configs: Record<string, AssetTopupConfig> = {};
    for (const code of customerAssets) {
      const existing = customer.auto_topup?.[code];
      configs[code] = {
        enabled: existing?.enabled || false,
        threshold: existing?.threshold?.toString() || "",
        amount: existing?.amount?.toString() || "",
      };
    }
    setTopupConfigs(configs);

    // Auto-expand if any are enabled
    const anyEnabled = Object.values(configs).some(c => c.enabled);
    setExpanded(anyEnabled || customerAssets.length <= 1);
  }, [customer, open]);

  const updateConfig = (code: string, patch: Partial<AssetTopupConfig>) => {
    setTopupConfigs(prev => ({ ...prev, [code]: { ...prev[code], ...patch } }));
  };

  const allOff = Object.values(topupConfigs).every(c => !c.enabled);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Display name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email format";
    for (const [code, cfg] of Object.entries(topupConfigs)) {
      if (cfg.enabled) {
        if (!cfg.threshold.trim()) errs[`${code}_threshold`] = "Required";
        if (!cfg.amount.trim()) errs[`${code}_amount`] = "Required";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const autoTopup: Record<string, { enabled: boolean; threshold: number; amount: number }> = {};
    for (const [code, cfg] of Object.entries(topupConfigs)) {
      autoTopup[code] = {
        enabled: cfg.enabled,
        threshold: parseFloat(cfg.threshold) || 0,
        amount: parseFloat(cfg.amount) || 0,
      };
    }
    const updated: Customer = {
      ...customer,
      name: name.trim(),
      email: email.trim(),
      auto_topup: autoTopup,
    };
    onSaved(updated);
    toast({ title: "done: Customer updated" });
  };

  const getAssetMeta = (code: string) => {
    const asset = allAssets.find(a => a.code === code);
    const isFiat = asset?.type === "fiat";
    return {
      symbol: asset?.symbol || code,
      prefix: isFiat ? "$" : code,
      prefixColor: isFiat ? "text-white/40" : "text-teal-400/60",
    };
  };

  const inputCls = "w-full border border-dotted border-white/20 bg-transparent px-3 py-2 font-ibm-plex text-sm placeholder:text-white/30 focus:outline-none focus:border-white/50";
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
            <input value={customer.wallet.accounts.map(a => a.asset_code).join(", ")} readOnly className={readOnlyCls} />
          </div>

          {/* Per-asset auto top-up */}
          <div className="border-t border-dotted border-white/20 pt-5">
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-3">Auto Top-up</label>

            {/* Collapsed summary when all off and 2+ assets */}
            {allOff && customerAssets.length >= 2 && !expanded ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/30 font-mono">Auto Top-up: OFF for all assets</span>
                <button
                  onClick={() => setExpanded(true)}
                  className="text-xs font-mono text-white/50 hover:text-white/80 border-b border-dotted border-white/20"
                >
                  CONFIGURE →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {customerAssets.map(code => {
                  const cfg = topupConfigs[code];
                  if (!cfg) return null;
                  const meta = getAssetMeta(code);
                  return (
                    <div key={code} className="border border-dotted border-white/15 p-4">
                      {/* Block header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono font-bold text-white/70">{code}</span>
                        <button
                          type="button"
                          onClick={() => updateConfig(code, { enabled: !cfg.enabled })}
                          className={`w-10 h-5 relative transition-colors ${cfg.enabled ? "bg-[#4ADE80]" : "bg-white/20"}`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 bg-white transition-transform ${cfg.enabled ? "left-[22px]" : "left-0.5"}`}
                          />
                        </button>
                      </div>

                      {/* Fields */}
                      <div className={cfg.enabled ? "" : "opacity-40 pointer-events-none"}>
                        <div className="flex items-center justify-between py-2 border-b border-dotted border-white/10">
                          <span className="text-xs text-white/40 font-mono">Threshold</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-mono ${meta.prefixColor}`}>{meta.prefix}</span>
                            <input
                              type="number"
                              step="any"
                              value={cfg.threshold}
                              onChange={(e) => updateConfig(code, { threshold: e.target.value })}
                              placeholder="0"
                              className="bg-transparent border border-dotted border-white/20 text-xs font-mono text-white px-2 py-1 w-28 text-right focus:outline-none focus:border-white/50"
                            />
                          </div>
                        </div>
                        {errors[`${code}_threshold`] && <p className="text-right font-ibm-plex text-xs text-[#F87171] mt-0.5">{errors[`${code}_threshold`]}</p>}

                        <div className="flex items-center justify-between py-2">
                          <span className="text-xs text-white/40 font-mono">Top-up Amount</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-mono ${meta.prefixColor}`}>+{meta.prefix}</span>
                            <input
                              type="number"
                              step="any"
                              value={cfg.amount}
                              onChange={(e) => updateConfig(code, { amount: e.target.value })}
                              placeholder="0"
                              className="bg-transparent border border-dotted border-white/20 text-xs font-mono text-white px-2 py-1 w-28 text-right focus:outline-none focus:border-white/50"
                            />
                          </div>
                        </div>
                        {errors[`${code}_amount`] && <p className="text-right font-ibm-plex text-xs text-[#F87171] mt-0.5">{errors[`${code}_amount`]}</p>}
                      </div>
                    </div>
                  );
                })}
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
