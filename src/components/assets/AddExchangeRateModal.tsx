import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { Asset, ExchangeRate } from "@/data/types";

interface AddExchangeRateModalProps {
  open: boolean;
  onClose: () => void;
  asset: Asset;
  onRateAdded: (rate: ExchangeRate) => void;
}

export function AddExchangeRateModal({ open, onClose, asset, onRateAdded }: AddExchangeRateModalProps) {
  const [rate, setRate] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const perUnit = useMemo(() => {
    const r = parseFloat(rate);
    if (!r || r <= 0) return null;
    return (1 / r).toFixed(4);
  }, [rate]);

  const resetForm = () => {
    setRate("");
    setEffectiveDate(new Date().toISOString().split("T")[0]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!rate.trim()) errs.rate = "Rate is required";
    else if (parseFloat(rate) <= 0) errs.rate = "Rate must be a positive number";
    if (!effectiveDate) errs.effectiveDate = "Effective date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const newRate: ExchangeRate = {
      from_asset: "USD",
      to_asset: asset.code,
      rate: parseFloat(rate),
      effective_at: `${effectiveDate}T00:00:00Z`,
    };
    onRateAdded(newRate);

    const today = new Date().toISOString().split("T")[0];
    const isFuture = effectiveDate > today;
    const formatted = new Date(effectiveDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

    if (isFuture) {
      toast({ title: `scheduled: Rate scheduled for ${formatted}` });
    } else {
      toast({ title: "done: Exchange rate added" });
    }
    resetForm();
  };

  const inputCls = "w-full border border-dotted border-white/20 bg-transparent px-3 py-2 font-ibm-plex text-sm placeholder:text-white/30 focus:outline-none focus:border-white/60";
  const readOnlyCls = "w-full bg-white/5 px-3 py-2 font-ibm-plex text-sm text-white/40 border border-dotted border-white/10 cursor-not-allowed";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <div className="border-b border-dotted border-white/[0.08] px-8 py-4">
          <span className="font-space text-xs text-white/50">┌─ ADD EXCHANGE RATE ──────────────────┐</span>
        </div>

        <div className="space-y-5 px-8 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">From</label>
              <input value="USD" readOnly className={readOnlyCls} />
            </div>
            <div>
              <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">To</label>
              <input value={asset.code} readOnly className={readOnlyCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Rate</label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 100"
                className={inputCls}
              />
              <p className="mt-1 font-ibm-plex text-xs text-white/30">
                How many {asset.code} does 1 USD buy?
              </p>
              {errors.rate && <p className="mt-1 font-ibm-plex text-xs text-[#F87171]">{errors.rate}</p>}
            </div>
            <div>
              <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Effective Date</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className={`${inputCls} [color-scheme:dark]`}
              />
              <p className="mt-1 font-ibm-plex text-xs text-white/30">
                Rate will apply from this date. Can be future-dated.
              </p>
              {errors.effectiveDate && <p className="mt-1 font-ibm-plex text-xs text-[#F87171]">{errors.effectiveDate}</p>}
            </div>
          </div>

          {/* Live preview */}
          {rate && parseFloat(rate) > 0 && (
            <div className="bg-white/5 px-4 py-3 font-ibm-plex text-xs text-[#2DD4BF] mt-4">
              1 USD = {rate} {asset.code}<br />
              ${perUnit} per {asset.code}<br />
              <span className="text-white/30">Effective: {effectiveDate}</span>
            </div>
          )}

          {/* Existing rates */}
          <div className="border-t border-dotted border-white/[0.08] mt-5 pt-5">
            <div className="font-space text-xs uppercase tracking-wider text-white/40 mb-3">Existing Rates</div>
            {asset.rates.length === 0 ? (
              <div className="font-ibm-plex text-sm text-white/40">
                $ no rates configured <span className="inline-block w-2 h-4 bg-white/40 animate-pulse ml-1 align-middle" />
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="text-xs text-white/40 uppercase tracking-wider border-b border-dotted border-white/20">
                    <th className="text-left py-2 font-normal whitespace-nowrap">From</th>
                    <th className="text-left py-2 font-normal whitespace-nowrap">To</th>
                    <th className="text-left py-2 font-normal whitespace-nowrap">Rate</th>
                    <th className="text-left py-2 font-normal whitespace-nowrap">Effective</th>
                  </tr>
                </thead>
                <tbody>
                  {asset.rates.map((r, i) => {
                    const d = new Date(r.effective_at);
                    const formatted = d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
                    return (
                      <tr key={i} className="border-b border-dotted border-white/[0.08] text-xs font-ibm-plex">
                        <td className="py-2">{r.from_asset}</td>
                        <td className="py-2">{r.to_asset}</td>
                        <td className="py-2 text-[#2DD4BF]">{r.rate}</td>
                        <td className="py-2 text-white/50">{formatted}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-dotted border-white/[0.08] px-8 py-4">
          <button onClick={handleClose} className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5">
            Cancel
          </button>
          <button onClick={handleSubmit} className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90">
            Add Rate →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
