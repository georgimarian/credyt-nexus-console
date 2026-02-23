import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { useProductStore } from "@/stores/productStore";
import { X, ArrowRight, ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import type { Product, Price, Entitlement } from "@/data/types";

type Step = "basics" | "pricing" | "entitlements" | "review";

const STEPS: { key: Step; label: string; number: number }[] = [
  { key: "basics", label: "Basics", number: 1 },
  { key: "pricing", label: "Pricing", number: 2 },
  { key: "entitlements", label: "Entitlements", number: 3 },
  { key: "review", label: "Review", number: 4 },
];

const STEP_HELP: Record<Step, string> = {
  basics: "$ set the product name and code. the code is used in API calls and event matching.",
  pricing: "$ add pricing rules. usage-based charges per event, or fixed recurring fees.",
  entitlements: "$ optionally include credits or allowances that reset each billing cycle.",
  review: "$ review your product configuration before creating it.",
};

interface CreateProductWizardProps {
  onClose: () => void;
}

export function CreateProductWizard({ onClose }: CreateProductWizardProps) {
  const navigate = useNavigate();
  const { addProduct } = useProductStore();
  const [step, setStep] = useState<Step>("basics");

  // Basics
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  // Prices
  const [prices, setPrices] = useState<Partial<Price>[]>([]);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [priceType, setPriceType] = useState<"usage" | "fixed">("usage");
  const [billingModel, setBillingModel] = useState<"real_time" | "recurring">("real_time");
  const [eventType, setEventType] = useState("");
  const [usageCalc, setUsageCalc] = useState<"unit" | "volume">("unit");
  const [volumeField, setVolumeField] = useState("total_tokens");
  const [unitPrice, setUnitPrice] = useState("");
  const [fixedAmount, setFixedAmount] = useState("");
  const [recurringInterval, setRecurringInterval] = useState<"monthly" | "yearly">("monthly");
  const [assetCode, setAssetCode] = useState("USD");

  // Entitlements
  const [entitlements, setEntitlements] = useState<Partial<Entitlement>[]>([]);
  const [showEntForm, setShowEntForm] = useState(false);
  const [entAsset, setEntAsset] = useState("CREDITS");
  const [entAmount, setEntAmount] = useState("");
  const [entRefresh, setEntRefresh] = useState<"none" | "reset" | "rollover">("reset");

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const canNext = (): boolean => {
    if (step === "basics") return name.trim().length > 0 && code.trim().length > 0;
    return true;
  };

  const goNext = () => {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
  };
  const goBack = () => {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx > 0) setStep(STEPS[idx - 1].key);
  };

  const addPrice = () => {
    const newPrice: Partial<Price> = {
      id: `price_new_${Date.now()}`,
      type: priceType,
      billing_model: billingModel,
      asset_code: assetCode,
      entitlements: [],
    };
    if (priceType === "usage") {
      newPrice.event_type = eventType;
      newPrice.usage_calculation = usageCalc;
      if (usageCalc === "volume") newPrice.volume_field = volumeField;
      newPrice.unit_price = parseFloat(unitPrice) || 0;
    } else {
      newPrice.amount = parseFloat(fixedAmount) || 0;
      newPrice.billing_model = "recurring";
      newPrice.recurring_interval = recurringInterval;
    }
    setPrices([...prices, newPrice]);
    setShowPriceForm(false);
    setEventType("");
    setUnitPrice("");
    setFixedAmount("");
  };

  const addEntitlement = () => {
    setEntitlements([
      ...entitlements,
      { asset_code: entAsset, amount: parseFloat(entAmount) || 0, refresh_strategy: entRefresh, schedule: "monthly" },
    ]);
    setShowEntForm(false);
    setEntAmount("");
  };

  const handleCreate = () => {
    const product: Product = {
      id: `prod_${Date.now()}`,
      code: code.trim().toLowerCase().replace(/\s+/g, "-"),
      name: name.trim(),
      status: "draft",
      created_at: new Date().toISOString(),
      prices: prices as Price[],
      versions: [{ version: 1, status: "draft", created_at: new Date().toISOString() }],
      subscriber_count: 0,
    };
    // Attach entitlements to first fixed price if exists, else to product-level
    if (entitlements.length > 0) {
      const fixedPrice = product.prices.find((p) => p.type === "fixed");
      if (fixedPrice) {
        fixedPrice.entitlements = entitlements as Entitlement[];
      } else if (product.prices.length > 0) {
        product.prices[0].entitlements = entitlements as Entitlement[];
      }
    }
    addProduct(product);
    navigate(`/products/${product.id}`);
  };

  // Progress bar
  const progressPct = ((stepIndex + 1) / STEPS.length) * 100;
  const progressFilled = Math.round(progressPct / 5);
  const progressBar = "█".repeat(progressFilled) + "░".repeat(20 - progressFilled);

  return (
    <TerminalCard
      title="CREATE PRODUCT"
      actions={
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      }
    >
      {/* Step indicator */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-4 font-ibm-plex text-xs">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => { if (i <= stepIndex || canNext()) setStep(s.key); }}
              className={`flex items-center gap-1.5 transition-colors ${
                s.key === step
                  ? "text-foreground font-bold"
                  : i < stepIndex
                  ? "text-terminal-green"
                  : "text-muted-foreground"
              }`}
            >
              <span className="border border-dashed border-current px-1.5 py-0.5 text-[10px]">
                {i < stepIndex ? "✓" : s.number}
              </span>
              <span className="hidden sm:inline uppercase">{s.label}</span>
              {i < STEPS.length - 1 && <span className="text-muted-foreground">→</span>}
            </button>
          ))}
        </div>
        <div className="font-ibm-plex text-xs text-muted-foreground">
          {progressBar} {progressPct.toFixed(0)}%
        </div>
      </div>

      {/* Help text */}
      <div className="mb-4 font-ibm-plex text-xs text-muted-foreground">
        {STEP_HELP[step]}
      </div>

      {/* Step: Basics */}
      {step === "basics" && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block font-space text-xs uppercase tracking-wide text-muted-foreground">
              Product Name <span className="text-terminal-red">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI Agent Pro"
              autoFocus
              className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-2 font-ibm-plex text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <p className="mt-1 font-ibm-plex text-[10px] text-muted-foreground">display name shown to customers</p>
          </div>
          <div>
            <label className="mb-1 block font-space text-xs uppercase tracking-wide text-muted-foreground">
              Product Code <span className="text-terminal-red">*</span>
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. ai-agent-pro"
              className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-2 font-ibm-plex text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <p className="mt-1 font-ibm-plex text-[10px] text-muted-foreground">unique identifier for API calls (lowercase, no spaces)</p>
          </div>
        </div>
      )}

      {/* Step: Pricing */}
      {step === "pricing" && (
        <div className="space-y-4">
          {prices.length > 0 && (
            <div className="space-y-2">
              {prices.map((p, i) => (
                <div key={i} className="flex items-center justify-between border border-dashed border-foreground/15 p-3 font-ibm-plex text-xs">
                  <div>
                    <span className="font-bold uppercase">{p.type}</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span>{p.billing_model}</span>
                    {p.event_type && <span className="ml-2 text-terminal-yellow">{p.event_type}</span>}
                    {p.unit_price !== undefined && <span className="ml-2">{p.unit_price} {p.asset_code}/unit</span>}
                    {p.amount !== undefined && <span className="ml-2">{p.amount} {p.asset_code}</span>}
                  </div>
                  <button onClick={() => setPrices(prices.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-terminal-red">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!showPriceForm ? (
            <div className="space-y-2">
              <button
                onClick={() => setShowPriceForm(true)}
                className="flex items-center gap-2 border border-dashed border-foreground/30 px-4 py-2 font-space text-xs uppercase tracking-wide transition-colors hover:bg-accent"
              >
                <Plus className="h-3 w-3" /> Add Price
              </button>
              {prices.length === 0 && (
                <p className="font-ibm-plex text-xs text-muted-foreground">
                  ⚠ products need at least one price. you can also add prices later.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 border border-dashed border-foreground/20 p-4">
              <div className="font-space text-xs uppercase tracking-wide text-muted-foreground">Add Price Rule</div>

              {/* Type toggle */}
              <div>
                <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Price Type</label>
                <div className="flex gap-0">
                  {(["usage", "fixed"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPriceType(t)}
                      className={`border border-dashed border-foreground/30 px-4 py-1.5 font-space text-xs uppercase ${
                        priceType === t ? "bg-foreground text-background" : "hover:bg-accent"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="mt-1 font-ibm-plex text-[10px] text-muted-foreground">
                  {priceType === "usage" ? "charge per event based on usage" : "flat recurring fee"}
                </p>
              </div>

              {priceType === "usage" ? (
                <>
                  <div>
                    <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Billing Model</label>
                    <div className="flex gap-0">
                      {(["real_time", "recurring"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setBillingModel(m)}
                          className={`border border-dashed border-foreground/30 px-3 py-1.5 font-space text-[10px] uppercase ${
                            billingModel === m ? "bg-foreground text-background" : "hover:bg-accent"
                          }`}
                        >
                          {m.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1 font-ibm-plex text-[10px] text-muted-foreground">
                      {billingModel === "real_time" ? "deduct from wallet instantly per event" : "aggregate and bill at end of cycle"}
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Event Type</label>
                    <input
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      placeholder="e.g. chat_completion"
                      className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-1.5 font-ibm-plex text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                    />
                    <p className="mt-1 font-ibm-plex text-[10px] text-muted-foreground">matches the event_type field in your API events</p>
                  </div>
                  <div>
                    <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Calculation</label>
                    <div className="flex gap-0">
                      {(["unit", "volume"] as const).map((c) => (
                        <button
                          key={c}
                          onClick={() => setUsageCalc(c)}
                          className={`border border-dashed border-foreground/30 px-3 py-1.5 font-space text-[10px] uppercase ${
                            usageCalc === c ? "bg-foreground text-background" : "hover:bg-accent"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1 font-ibm-plex text-[10px] text-muted-foreground">
                      {usageCalc === "unit" ? "charge a flat fee per event" : "multiply a field value by unit price"}
                    </p>
                  </div>
                  {usageCalc === "volume" && (
                    <div>
                      <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Volume Field</label>
                      <input
                        value={volumeField}
                        onChange={(e) => setVolumeField(e.target.value)}
                        placeholder="e.g. total_tokens"
                        className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-1.5 font-ibm-plex text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                      />
                      <p className="mt-1 font-ibm-plex text-[10px] text-muted-foreground">the event property to multiply by unit_price</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Unit Price</label>
                      <input
                        type="number"
                        step="any"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        placeholder="0.00003"
                        className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-1.5 font-ibm-plex text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Asset</label>
                      <select
                        value={assetCode}
                        onChange={(e) => setAssetCode(e.target.value)}
                        className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-1.5 font-ibm-plex text-xs text-foreground focus:outline-none"
                      >
                        <option value="USD">USD</option>
                        <option value="CREDITS">CREDITS</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Amount</label>
                      <input
                        type="number"
                        step="any"
                        value={fixedAmount}
                        onChange={(e) => setFixedAmount(e.target.value)}
                        placeholder="49.00"
                        className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-1.5 font-ibm-plex text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Interval</label>
                      <select
                        value={recurringInterval}
                        onChange={(e) => setRecurringInterval(e.target.value as any)}
                        className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-1.5 font-ibm-plex text-xs text-foreground focus:outline-none"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={addPrice}
                  className="border border-dashed border-foreground/30 bg-foreground px-3 py-1.5 font-space text-[10px] uppercase text-background hover:bg-muted-foreground"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowPriceForm(false)}
                  className="border border-dashed border-foreground/30 px-3 py-1.5 font-space text-[10px] uppercase hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Entitlements */}
      {step === "entitlements" && (
        <div className="space-y-4">
          <p className="font-ibm-plex text-xs text-muted-foreground">
            entitlements give customers included credits or allowances that reset each billing cycle.
            great for "X free credits per month" plans.
          </p>

          {entitlements.length > 0 && (
            <div className="space-y-2">
              {entitlements.map((e, i) => (
                <div key={i} className="flex items-center justify-between border border-dashed border-foreground/15 p-3 font-ibm-plex text-xs">
                  <span>
                    <span className="font-bold">{e.amount}</span> {e.asset_code}
                    <span className="ml-2 text-muted-foreground">· refresh: {e.refresh_strategy}</span>
                  </span>
                  <button onClick={() => setEntitlements(entitlements.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-terminal-red">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!showEntForm ? (
            <button
              onClick={() => setShowEntForm(true)}
              className="flex items-center gap-2 border border-dashed border-foreground/30 px-4 py-2 font-space text-xs uppercase tracking-wide transition-colors hover:bg-accent"
            >
              <Plus className="h-3 w-3" /> Add Entitlement
            </button>
          ) : (
            <div className="space-y-3 border border-dashed border-foreground/20 p-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Asset</label>
                  <select
                    value={entAsset}
                    onChange={(e) => setEntAsset(e.target.value)}
                    className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-1.5 font-ibm-plex text-xs text-foreground focus:outline-none"
                  >
                    <option value="CREDITS">CREDITS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Amount</label>
                  <input
                    type="number"
                    value={entAmount}
                    onChange={(e) => setEntAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-1.5 font-ibm-plex text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Refresh</label>
                  <select
                    value={entRefresh}
                    onChange={(e) => setEntRefresh(e.target.value as any)}
                    className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-1.5 font-ibm-plex text-xs text-foreground focus:outline-none"
                  >
                    <option value="reset">Reset</option>
                    <option value="rollover">Rollover</option>
                    <option value="none">None</option>
                  </select>
                  <p className="mt-1 font-ibm-plex text-[10px] text-muted-foreground">
                    reset = start fresh · rollover = carry over unused
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addEntitlement} className="border border-dashed border-foreground/30 bg-foreground px-3 py-1.5 font-space text-[10px] uppercase text-background hover:bg-muted-foreground">Add</button>
                <button onClick={() => setShowEntForm(false)} className="border border-dashed border-foreground/30 px-3 py-1.5 font-space text-[10px] uppercase hover:bg-accent">Cancel</button>
              </div>
            </div>
          )}

          {entitlements.length === 0 && !showEntForm && (
            <p className="font-ibm-plex text-xs text-muted-foreground">
              → skip this step if your product is purely usage-based with no included credits.
            </p>
          )}
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div className="space-y-4">
          <div className="border border-dashed border-foreground/15 p-4 font-ibm-plex text-xs">
            <div className="mb-3 font-space text-xs uppercase tracking-wide">Product Summary</div>
            <div className="space-y-1">
              <div><span className="text-muted-foreground">name:</span> <span className="font-bold">{name}</span></div>
              <div><span className="text-muted-foreground">code:</span> {code.trim().toLowerCase().replace(/\s+/g, "-")}</div>
              <div><span className="text-muted-foreground">status:</span> <span className="text-terminal-yellow">→ draft</span></div>
              <div><span className="text-muted-foreground">prices:</span> {prices.length}</div>
              <div><span className="text-muted-foreground">entitlements:</span> {entitlements.length}</div>
            </div>
          </div>

          {prices.length > 0 && (
            <div className="border border-dashed border-foreground/15 p-4 font-ibm-plex text-xs">
              <div className="mb-2 font-space text-xs uppercase tracking-wide">Prices</div>
              {prices.map((p, i) => (
                <div key={i} className="border-b border-dashed border-foreground/10 py-1.5 last:border-0">
                  <span className="font-bold uppercase">{p.type}</span>
                  {p.type === "usage" && (
                    <span className="ml-1 text-muted-foreground">
                      · {p.billing_model} · {p.event_type} · {p.unit_price} {p.asset_code}/{p.usage_calculation}
                    </span>
                  )}
                  {p.type === "fixed" && (
                    <span className="ml-1 text-muted-foreground">
                      · {p.amount} {p.asset_code}/{p.recurring_interval}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {entitlements.length > 0 && (
            <div className="border border-dashed border-foreground/15 p-4 font-ibm-plex text-xs">
              <div className="mb-2 font-space text-xs uppercase tracking-wide">Entitlements</div>
              {entitlements.map((e, i) => (
                <div key={i} className="py-1">
                  {e.amount} {e.asset_code} · refresh: {e.refresh_strategy}
                </div>
              ))}
            </div>
          )}

          {prices.length === 0 && (
            <p className="font-ibm-plex text-xs text-terminal-yellow">
              ⚠ no prices configured. you can add them later on the product detail page.
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between border-t border-dashed border-foreground/20 pt-4">
        <div>
          {stepIndex > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 font-space text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="border border-dashed border-foreground/30 px-4 py-2 font-space text-xs uppercase tracking-wide transition-colors hover:bg-accent"
          >
            Cancel
          </button>
          {step !== "review" ? (
            <button
              onClick={goNext}
              disabled={!canNext()}
              className="flex items-center gap-1 border border-dashed border-foreground/30 bg-foreground px-4 py-2 font-space text-xs uppercase tracking-wide text-background transition-colors hover:bg-muted-foreground disabled:opacity-30"
            >
              Next <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="flex items-center gap-1 border border-dashed border-foreground/30 bg-foreground px-4 py-2 font-space text-xs uppercase tracking-wide text-background transition-colors hover:bg-muted-foreground"
            >
              <Check className="h-3 w-3" /> Create Product
            </button>
          )}
        </div>
      </div>
    </TerminalCard>
  );
}
