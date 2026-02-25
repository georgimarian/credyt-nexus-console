import { useState, useMemo } from "react";
import { FieldLabel } from "@/components/terminal/FieldLabel";
import { toast } from "@/hooks/use-toast";
import type { Product, Price } from "@/data/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type BillingModel = "real_time" | "recurring";
type UsageCalc = "unit" | "volume" | "unit_and_volume";
type AddPriceStep = "billing_model" | "event_rate" | "review";

const STEPS: { key: AddPriceStep; label: string }[] = [
  { key: "billing_model", label: "Billing Model" },
  { key: "event_rate", label: "Event & Rate" },
  { key: "review", label: "Review" },
];

interface AddPriceWizardProps {
  product: Product;
  onClose: () => void;
  onPriceAdded: (price: Price) => void;
}

export function AddPriceWizard({ product, onClose, onPriceAdded }: AddPriceWizardProps) {
  const [step, setStep] = useState<AddPriceStep>("billing_model");
  const [billingModel, setBillingModel] = useState<BillingModel | null>(null);
  const [usageCalc, setUsageCalc] = useState<UsageCalc | null>(null);

  // Event & Rate
  const [eventType, setEventType] = useState("");
  const [volumeField, setVolumeField] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [assetCode, setAssetCode] = useState("USD");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const canNext = (): boolean => {
    if (step === "billing_model") return billingModel !== null && usageCalc !== null;
    if (step === "event_rate") {
      if (!eventType.trim()) return false;
      if (!unitPrice.trim()) return false;
      if ((usageCalc === "volume" || usageCalc === "unit_and_volume") && !volumeField.trim()) return false;
      return true;
    }
    return true;
  };

  const validateEventRate = () => {
    const errs: Record<string, string> = {};
    if (!eventType.trim()) errs.eventType = "Event type is required";
    if (!unitPrice.trim()) errs.unitPrice = "Unit price is required";
    else if (parseFloat(unitPrice) <= 0) errs.unitPrice = "Must be a positive number";
    if ((usageCalc === "volume" || usageCalc === "unit_and_volume") && !volumeField.trim()) errs.volumeField = "Volume field is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (step === "event_rate" && !validateEventRate()) return;
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1].key);
  };
  const goBack = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1].key);
  };

  const costPreview = useMemo(() => {
    const price = parseFloat(unitPrice);
    if (!price || price <= 0) return null;
    if (usageCalc === "volume" || usageCalc === "unit_and_volume") {
      const cost = price * 10000;
      return `If a customer uses 10,000 ${volumeField || "units"}, they'll be charged $${cost.toFixed(2)}`;
    }
    return `Each ${eventType || "event"} occurrence costs $${price.toFixed(6)}`;
  }, [unitPrice, usageCalc, volumeField, eventType]);

  const handleActivate = () => {
    const newPrice: Price = {
      id: `price_new_${Date.now()}`,
      type: "usage",
      billing_model: billingModel!,
      event_type: eventType.trim(),
      usage_calculation: usageCalc!,
      volume_field: (usageCalc === "volume" || usageCalc === "unit_and_volume") ? volumeField.trim() : undefined,
      unit_price: parseFloat(unitPrice),
      asset_code: assetCode,
      entitlements: [],
    };
    onPriceAdded(newPrice);
    toast({ title: `done: Price added to ${product.name}` });
  };

  const inputCls = "w-full border border-white/20 bg-transparent px-3 py-2 font-ibm-plex text-sm placeholder:text-white/30 focus:outline-none focus:border-white/60";

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-8 pt-6 pb-0">
          <DialogTitle className="font-space text-xs uppercase tracking-widest text-white/50">
            ┌─ ADD PRICE TO {product.name.toUpperCase()} ────────┐
          </DialogTitle>
          <DialogDescription className="sr-only">Add a new price to {product.name}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-8 py-6">
            {/* Step indicator */}
            <div className="mb-8 flex items-center gap-2">
              <span className="font-space text-xs text-white/40">STEP {stepIndex + 1} OF {STEPS.length}</span>
              <span className="mx-2 text-white/20">·</span>
              <div className="flex gap-2">
                {STEPS.map((s, i) => (
                  <span key={s.key} className={`inline-block h-2 w-2 ${i < stepIndex ? "bg-[#4ADE80]" : i === stepIndex ? "bg-white" : "bg-white/20"}`} />
                ))}
              </div>
              <span className="mx-2 text-white/20">·</span>
              <span className="font-space text-xs text-white/60 uppercase">{STEPS[stepIndex].label}</span>
            </div>

            {/* Step 1: Billing Model */}
            {step === "billing_model" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-space text-sm uppercase font-bold mb-1">How should this price bill?</h2>
                  <p className="font-ibm-plex text-xs text-white/40">Choose the billing model and calculation method</p>
                </div>

                <div>
                  <div className="font-space text-xs uppercase tracking-wider text-white/40 mb-3">Billing Model</div>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { key: "real_time" as BillingModel, title: "Real-Time", desc: "Wallet deducted instantly as events occur", example: "e.g. $0.002 per API call", strip: "wallet will be charged instantly on each event" },
                      { key: "recurring" as BillingModel, title: "Recurring", desc: "Accumulate usage and bill at period end", example: "e.g. Monthly token bundle", strip: "usage accumulates and bills at period end" },
                    ]).map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setBillingModel(m.key)}
                        className={`relative min-h-[140px] flex flex-col justify-between text-left p-4 border transition-colors ${
                          billingModel === m.key ? "bg-white text-black border-white" : "border-white/15 bg-transparent hover:bg-white/5 hover:border-white/30"
                        }`}
                      >
                        {billingModel === m.key && <span className="absolute top-2 right-3 font-space text-xs">✓</span>}
                        <div>
                          <div className="font-space text-sm uppercase font-bold">{m.title}</div>
                          <div className="text-xs mt-1 opacity-70">{m.desc}</div>
                          <div className="text-xs mt-1 opacity-50">{m.example}</div>
                        </div>
                        {billingModel === m.key && (
                          <div className="border-t border-black/20 mt-4 pt-3 text-xs font-space opacity-60">→ {m.strip}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-space text-xs uppercase tracking-wider text-white/40 mb-3">Calculation</div>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { key: "unit" as UsageCalc, title: "Per Unit", desc: "Flat charge per event occurrence", example: "e.g. $0.50 per video generated", strip: "flat fee charged per event occurrence" },
                      { key: "volume" as UsageCalc, title: "Volume", desc: "Charge based on quantity in event payload", example: "e.g. $0.001 per token", strip: "quantity field in payload multiplied by unit price" },
                    ]).map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setUsageCalc(c.key)}
                        className={`relative min-h-[140px] flex flex-col justify-between text-left p-4 border transition-colors ${
                          usageCalc === c.key ? "bg-white text-black border-white" : "border-white/15 bg-transparent hover:bg-white/5 hover:border-white/30"
                        }`}
                      >
                        {usageCalc === c.key && <span className="absolute top-2 right-3 font-space text-xs">✓</span>}
                        <div>
                          <div className="font-space text-sm uppercase font-bold">{c.title}</div>
                          <div className="text-xs mt-1 opacity-70">{c.desc}</div>
                          <div className="text-xs mt-1 opacity-50">{c.example}</div>
                        </div>
                        {usageCalc === c.key && (
                          <div className="border-t border-black/20 mt-4 pt-3 text-xs font-space opacity-60">→ {c.strip}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Event & Rate */}
            {step === "event_rate" && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-space text-sm uppercase font-bold mb-1">What triggers a charge?</h2>
                  <p className="font-ibm-plex text-xs text-white/40">Define the event type and pricing rate</p>
                </div>

                <div>
                  <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Event Type</label>
                  <input value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="e.g. chat_completion" className={inputCls} />
                  <p className="mt-1 font-ibm-plex text-xs text-white/30">Must match event_type in your API calls exactly</p>
                  {errors.eventType && <p className="mt-1 font-ibm-plex text-xs text-[#F87171]">{errors.eventType}</p>}
                </div>

                {(usageCalc === "volume" || usageCalc === "unit_and_volume") && (
                  <div>
                    <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Volume Field</label>
                    <input value={volumeField} onChange={(e) => setVolumeField(e.target.value)} placeholder="e.g. total_tokens" className={inputCls} />
                    <p className="mt-1 font-ibm-plex text-xs text-white/30">The numeric field Credyt will multiply against unit price</p>
                    {errors.volumeField && <p className="mt-1 font-ibm-plex text-xs text-[#F87171]">{errors.volumeField}</p>}
                  </div>
                )}

                <div className="border-t border-white/[0.08] pt-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Unit Price</label>
                      <input type="number" step="any" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="0.00003" className={inputCls} />
                      {errors.unitPrice && <p className="mt-1 font-ibm-plex text-xs text-[#F87171]">{errors.unitPrice}</p>}
                    </div>
                    <div>
                      <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">Asset</label>
                      <select value={assetCode} onChange={(e) => setAssetCode(e.target.value)} className={`${inputCls} bg-[#111]`}>
                        <option value="USD">USD</option>
                        <option value="CREDITS">CREDITS</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Live payload preview */}
                <div className="bg-white/5 p-4 font-ibm-plex text-xs text-white/40">
                  <pre>{JSON.stringify({
                    event_type: eventType || "...",
                    customer_id: "cust_xxx",
                    data: {
                      ...(volumeField ? { [volumeField]: 1500 } : {}),
                    }
                  }, null, 2)}</pre>
                </div>

                {/* Cost calculator */}
                {costPreview && (
                  <div className="bg-white/5 p-4 text-sm font-ibm-plex text-white/60">
                    {costPreview}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Review */}
            {step === "review" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-space text-sm uppercase font-bold mb-1">Review your price</h2>
                  <p className="font-ibm-plex text-xs text-white/40">Confirm the configuration before adding</p>
                </div>

                <div className="bg-white/5 p-6 font-ibm-plex text-sm text-white/70 space-y-1">
                  <div className="font-space text-xs text-white/50 mb-4">┌─ PRICE SUMMARY ─────────────────────┐</div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <span className="text-white/40 text-xs">product</span><span>{product.name}</span>
                    <span className="text-white/40 text-xs">event_type</span><span>{eventType}</span>
                    <span className="text-white/40 text-xs">billing_model</span><span>{billingModel}</span>
                    <span className="text-white/40 text-xs">calculation</span><span>{usageCalc}</span>
                    {volumeField && <><span className="text-white/40 text-xs">volume_field</span><span>{volumeField}</span></>}
                    <span className="text-white/40 text-xs">unit_price</span><span className="text-[#4ADE80]">{unitPrice} {assetCode}</span>
                  </div>
                </div>

                <p className="font-ibm-plex text-xs text-white/30">You can add more prices to this product after creation.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] px-8 py-4">
          {stepIndex > 0 ? (
            <button onClick={goBack} className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5">Back</button>
          ) : (
            <button onClick={onClose} className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5">Cancel</button>
          )}
          {step === "review" ? (
            <button onClick={handleActivate} className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90">Activate Price →</button>
          ) : (
            <button onClick={goNext} disabled={!canNext()} className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90 disabled:opacity-40 disabled:pointer-events-none">Next →</button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
