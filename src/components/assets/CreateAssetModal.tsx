import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { Asset } from "@/data/types";

interface CreateAssetModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (asset: Asset) => void;
}

type AssetType = "fiat" | "custom" | null;

export function CreateAssetModal({ open, onClose, onCreated }: CreateAssetModalProps) {
  const [assetType, setAssetType] = useState<AssetType>("fiat");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [scale, setScale] = useState("2");
  const [rate, setRate] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setAssetType("fiat");
    setCode("");
    setDisplayName("");
    setSymbol("");
    setScale("2");
    setRate("");
    setEffectiveDate(new Date().toISOString().split("T")[0]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const perUnit = useMemo(() => {
    const r = parseFloat(rate);
    if (!r || r <= 0) return null;
    return (1 / r).toFixed(4);
  }, [rate]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!assetType) errs.type = "Select an asset type";
    if (!code.trim()) errs.code = "Asset code is required";
    else if (code !== code.toUpperCase() || /\s/.test(code)) errs.code = "Must be uppercase, no spaces";
    if (!displayName.trim()) errs.displayName = "Display name is required";
    if (assetType === "custom") {
      if (!rate.trim()) errs.rate = "Exchange rate is required";
      else if (parseFloat(rate) <= 0) errs.rate = "Rate must be greater than 0";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const canSubmit = !!assetType && code.trim() && displayName.trim() && (assetType === "fiat" || (rate && parseFloat(rate) > 0));

  const handleCreate = () => {
    if (!validate()) return;
    const asset: Asset = {
      id: `asset_${Date.now().toString(36)}`,
      code: code.trim(),
      name: displayName.trim(),
      type: assetType!,
      scale: parseInt(scale) || (assetType === "fiat" ? 2 : 0),
      symbol: symbol.trim() || undefined,
      rates: assetType === "custom" && rate
        ? [{ from_asset: "USD", to_asset: code.trim(), rate: parseFloat(rate), effective_at: `${effectiveDate}T00:00:00Z` }]
        : [],
    };
    onCreated(asset);
    toast({ title: `done: Asset ${asset.code} created` });
    resetForm();
  };

  const inputCls = "w-full border border-dotted border-white/20 bg-transparent px-3 py-2 font-ibm-plex text-sm placeholder:text-white/30 focus:outline-none focus:border-white/60";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <div className="border-b border-dotted border-white/[0.08] px-8 py-4">
          <span className="font-space text-xs text-white/50">┌─ CREATE ASSET ───────────────────────┐</span>
        </div>

        <div className="space-y-5 px-8 py-6 max-h-[70vh] overflow-y-auto">
          {/* Type selection cards */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setAssetType("fiat"); setScale("2"); }}
              className={`relative min-h-[120px] flex flex-col justify-between text-left p-4 border border-dotted transition-colors ${
                assetType === "fiat"
                  ? "bg-white text-black border-white"
                  : "border-white/15 bg-transparent hover:bg-white/5 hover:border-white/30"
              }`}
            >
              {assetType === "fiat" && <span className="absolute top-2 right-3 font-space text-xs">✓</span>}
              <div>
                <div className="font-space text-sm uppercase font-bold">Fiat Currency</div>
                <div className="text-xs mt-1 opacity-70">USD, EUR, GBP</div>
                <div className="text-xs mt-1 opacity-50">Standard fiat with 2 decimal places</div>
              </div>
              {assetType === "fiat" && (
                <div className="border-t border-black/20 mt-3 pt-2 text-xs font-space opacity-60">→ exchange rates managed automatically</div>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setAssetType("custom"); setScale("0"); }}
              className={`relative min-h-[120px] flex flex-col justify-between text-left p-4 border border-dotted transition-colors ${
                assetType === "custom"
                  ? "bg-white text-black border-white"
                  : "border-white/15 bg-transparent hover:bg-white/5 hover:border-white/30"
              }`}
            >
              {assetType === "custom" && <span className="absolute top-2 right-3 font-space text-xs">✓</span>}
              <div>
                <div className="font-space text-sm uppercase font-bold">Custom Asset</div>
                <div className="text-xs mt-1 opacity-70">Credits, Tokens, Minutes</div>
                <div className="text-xs mt-1 opacity-50">Define your own unit and exchange rate</div>
              </div>
              {assetType === "custom" && (
                <div className="border-t border-black/20 mt-3 pt-2 text-xs font-space opacity-60">→ you define the rate from USD</div>
              )}
            </button>
          </div>

          {/* Common fields */}
          <div>
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Asset Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
              placeholder={assetType === "custom" ? "e.g. CREDITS" : "e.g. EUR"}
              className={inputCls}
            />
            <p className="mt-1 font-ibm-plex text-xs text-white/30">
              {assetType === "custom" ? "Uppercase, no spaces" : "3-letter ISO currency code, uppercase"}
            </p>
            {errors.code && <p className="mt-1 font-ibm-plex text-xs text-[#F87171]">{errors.code}</p>}
          </div>

          <div>
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={assetType === "custom" ? "e.g. Credits" : "e.g. Euro"}
              className={inputCls}
            />
            {errors.displayName && <p className="mt-1 font-ibm-plex text-xs text-[#F87171]">{errors.displayName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Symbol</label>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.slice(0, 3))}
                placeholder={assetType === "custom" ? "e.g. CR" : "e.g. €"}
                className={inputCls}
                maxLength={3}
              />
            </div>
            <div>
              <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Scale</label>
              <input
                type="number"
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                className={inputCls}
              />
              <p className="mt-1 font-ibm-plex text-xs text-white/30">
                {assetType === "custom" ? "Usually 0 for custom units" : "Usually 2 for fiat"}
              </p>
            </div>
          </div>

          {/* Exchange Rate section for CUSTOM only */}
          {assetType === "custom" && (
            <div className="border-t border-dotted border-white/[0.08] pt-5 space-y-5">
              <div className="font-space text-xs uppercase tracking-wider text-white/40">Exchange Rate</div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">From</label>
                  <input value="USD" readOnly className={`${inputCls} text-white/50 cursor-not-allowed`} />
                </div>
                <div>
                  <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">To</label>
                  <input value={code || "—"} readOnly className={`${inputCls} text-white/50 cursor-not-allowed`} />
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
                  <p className="mt-1 font-ibm-plex text-xs text-white/30">How many {code || "[CODE]"} does 1 USD buy?</p>
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
                  <p className="mt-1 font-ibm-plex text-xs text-white/30">Rate applies from this date</p>
                </div>
              </div>

              {rate && parseFloat(rate) > 0 && (
                <div className="bg-white/5 px-4 py-3 font-ibm-plex text-xs text-[#2DD4BF] mt-2">
                  1 USD = {rate} {code || "[CODE]"} · ${perUnit} per {code || "[CODE]"}
                  <br />
                  <span className="text-white/30">Effective: {effectiveDate}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-dotted border-white/[0.08] px-8 py-4">
          <button onClick={handleClose} className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canSubmit}
            className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Asset →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}