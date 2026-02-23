import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { useProductStore } from "@/stores/productStore";
import { X, ArrowRight, ArrowLeft, Check, Plus, Trash2, Zap, CreditCard, Layers, HelpCircle } from "lucide-react";
import type { Product, Price, Entitlement, PriceTier } from "@/data/types";

type PricingModel = "realtime" | "fixed" | "hybrid";
type Step = "basics" | "model" | "prices" | "entitlements" | "review";

const ALL_STEPS: { key: Step; label: string }[] = [
  { key: "basics", label: "Basics" },
  { key: "model", label: "Model" },
  { key: "prices", label: "Prices" },
  { key: "entitlements", label: "Entitlements" },
  { key: "review", label: "Review" },
];

const STEP_HELP: Record<Step, string> = {
  basics: "$ set the product name and code. the code is used in API calls and event matching.",
  model: "$ choose how you want to charge customers. this determines which pricing options are available.",
  prices: "$ configure your pricing rules based on your chosen model.",
  entitlements: "$ define included credits or allowances bundled with the subscription.",
  review: "$ review your product configuration before creating it.",
};

const MODEL_INFO: Record<PricingModel, { icon: typeof Zap; title: string; desc: string; detail: string; examples: string }> = {
  realtime: {
    icon: Zap,
    title: "Real-time Usage-Based",
    desc: "Customers prepay. Usage deducts from balance instantly.",
    detail: "Best for API-style products where each event has a measurable cost. Charges are deducted from the customer's wallet in real-time as events occur.",
    examples: "e.g. OpenAI API, Twilio, AWS Lambda",
  },
  fixed: {
    icon: CreditCard,
    title: "Fixed Recurring",
    desc: "Flat monthly or yearly fee. No usage metering.",
    detail: "Simple subscription pricing. Customers pay a fixed amount on a recurring schedule regardless of usage.",
    examples: "e.g. Netflix, Notion, Linear",
  },
  hybrid: {
    icon: Layers,
    title: "Hybrid (Subscription + Usage)",
    desc: "Subscription fee with included credits. Overage charged on usage.",
    detail: "Combines a recurring base fee with included credit entitlements. When credits are exhausted, overage is charged per event.",
    examples: "e.g. Cursor Pro, Vercel, Clay",
  },
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

  // Model
  const [pricingModel, setPricingModel] = useState<PricingModel | null>(null);

  // Prices
  const [prices, setPrices] = useState<Partial<Price>[]>([]);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [editingPriceType, setEditingPriceType] = useState<"usage" | "fixed">("usage");
  const [billingModel, setBillingModel] = useState<"real_time" | "recurring">("real_time");
  const [eventType, setEventType] = useState("");
  const [usageCalc, setUsageCalc] = useState<"unit" | "volume" | "unit_and_volume">("unit");
  const [volumeField, setVolumeField] = useState("total_tokens");
  const [unitPrice, setUnitPrice] = useState("");
  const [volumeRate, setVolumeRate] = useState("");
  const [fixedAmount, setFixedAmount] = useState("");
  const [recurringInterval, setRecurringInterval] = useState<"monthly" | "yearly">("monthly");
  const [assetCode, setAssetCode] = useState("USD");

  // Dimensions
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [newDimension, setNewDimension] = useState("");
  const [dimensionalTiers, setDimensionalTiers] = useState<PriceTier[]>([]);

  // Tiered pricing
  const [useTiers, setUseTiers] = useState(false);
  const [tiers, setTiers] = useState<PriceTier[]>([{ up_to: 1000, unit_price: 0 }, { up_to: null, unit_price: 0 }]);

  // Entitlements
  const [entitlements, setEntitlements] = useState<Partial<Entitlement>[]>([]);
  const [showEntForm, setShowEntForm] = useState(false);
  const [entAsset, setEntAsset] = useState("CREDITS");
  const [entAmount, setEntAmount] = useState("");
  const [entRefresh, setEntRefresh] = useState<"none" | "reset" | "rollover">("reset");

  const activeSteps = ALL_STEPS.filter((s) => {
    if (s.key === "entitlements") return pricingModel === "fixed" || pricingModel === "hybrid";
    return true;
  });

  const stepIndex = activeSteps.findIndex((s) => s.key === step);

  const canNext = (): boolean => {
    if (step === "basics") return name.trim().length > 0 && code.trim().length > 0;
    if (step === "model") return pricingModel !== null;
    return true;
  };

  const goNext = () => {
    if (stepIndex < activeSteps.length - 1) setStep(activeSteps[stepIndex + 1].key);
  };
  const goBack = () => {
    if (stepIndex > 0) setStep(activeSteps[stepIndex - 1].key);
  };

  const openPriceForm = (type: "usage" | "fixed") => {
    setEditingPriceType(type);
    setShowPriceForm(true);
    setDimensions([]);
    setDimensionalTiers([]);
    setUseTiers(false);
    setTiers([{ up_to: 1000, unit_price: 0 }, { up_to: null, unit_price: 0 }]);
    setEventType("");
    setUnitPrice("");
    setVolumeRate("");
    setFixedAmount("");
  };

  const addPrice = () => {
    const newPrice: Partial<Price> = {
      id: `price_new_${Date.now()}`,
      type: editingPriceType,
      billing_model: billingModel,
      asset_code: assetCode,
      entitlements: [],
    };
    if (editingPriceType === "usage") {
      newPrice.event_type = eventType;
      newPrice.usage_calculation = usageCalc;
      if (usageCalc === "volume" || usageCalc === "unit_and_volume") newPrice.volume_field = volumeField;
      if (usageCalc === "unit" || usageCalc === "unit_and_volume") newPrice.unit_price = parseFloat(unitPrice) || 0;
      if (usageCalc === "volume") newPrice.unit_price = parseFloat(unitPrice) || 0;
      if (usageCalc === "unit_and_volume") newPrice.volume_rate = parseFloat(volumeRate) || 0;
      if (dimensions.length > 0) {
        newPrice.dimensions = dimensions;
        if (dimensionalTiers.length > 0) newPrice.tiers = dimensionalTiers;
      }
      if (useTiers && !dimensions.length) newPrice.tiers = tiers;
    } else {
      newPrice.amount = parseFloat(fixedAmount) || 0;
      newPrice.billing_model = "recurring";
      newPrice.recurring_interval = recurringInterval;
    }
    setPrices([...prices, newPrice]);
    setShowPriceForm(false);
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

  // Validation warnings for review
  const warnings: string[] = [];
  if (pricingModel === "realtime" && !prices.some((p) => p.type === "usage")) {
    warnings.push("real-time model requires at least one usage price");
  }
  if (pricingModel === "hybrid" && !prices.some((p) => p.type === "fixed")) {
    warnings.push("hybrid model should include a fixed subscription price");
  }
  if (pricingModel === "hybrid" && !prices.some((p) => p.type === "usage")) {
    warnings.push("hybrid model should include at least one usage price");
  }

  const progressPct = ((stepIndex + 1) / activeSteps.length) * 100;
  const progressFilled = Math.round(progressPct / 5);
  const progressBar = "█".repeat(progressFilled) + "░".repeat(20 - progressFilled);

  const modelLabel = pricingModel ? MODEL_INFO[pricingModel].title : "";

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
          {activeSteps.map((s, i) => (
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
                {i < stepIndex ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline uppercase">{s.label}</span>
              {i < activeSteps.length - 1 && <span className="text-muted-foreground">→</span>}
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

      {/* ===== Step: Basics ===== */}
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

      {/* ===== Step: Pricing Model ===== */}
      {step === "model" && (
        <div className="space-y-3">
          {(Object.keys(MODEL_INFO) as PricingModel[]).map((key) => {
            const m = MODEL_INFO[key];
            const Icon = m.icon;
            const selected = pricingModel === key;
            return (
              <button
                key={key}
                onClick={() => setPricingModel(key)}
                className={`w-full text-left border border-dashed p-4 transition-colors ${
                  selected
                    ? "border-foreground bg-foreground/5"
                    : "border-foreground/20 hover:border-foreground/40 hover:bg-accent/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? "text-terminal-green" : "text-muted-foreground"}`} />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-space text-xs font-bold uppercase tracking-wide">{m.title}</span>
                      {selected && <span className="text-terminal-green text-[10px]">✓ selected</span>}
                    </div>
                    <p className="font-ibm-plex text-xs">{m.desc}</p>
                    <p className="font-ibm-plex text-[10px] text-muted-foreground">{m.detail}</p>
                    <p className="font-ibm-plex text-[10px] text-muted-foreground/70 italic">{m.examples}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ===== Step: Prices ===== */}
      {step === "prices" && (
        <div className="space-y-4">
          {/* Contextual guidance */}
          <div className="border border-dashed border-foreground/10 p-3 font-ibm-plex text-[10px] text-muted-foreground space-y-1">
            {pricingModel === "realtime" && (
              <>
                <p>→ add usage-based prices that deduct from customer wallets in real-time.</p>
                <p>→ each price matches an event_type from your API events.</p>
              </>
            )}
            {pricingModel === "fixed" && (
              <>
                <p>→ add a fixed recurring price (monthly or yearly subscription fee).</p>
                <p>→ you can add multiple tiers or plans as separate prices.</p>
              </>
            )}
            {pricingModel === "hybrid" && (
              <>
                <p>→ add a fixed subscription price + usage-based prices for overage.</p>
                <p>→ included credits are configured in the next step (entitlements).</p>
              </>
            )}
          </div>

          {/* Existing prices */}
          {prices.length > 0 && (
            <div className="space-y-2">
              {prices.map((p, i) => (
                <div key={i} className="flex items-center justify-between border border-dashed border-foreground/15 p-3 font-ibm-plex text-xs">
                  <div>
                    <span className="font-bold uppercase">{p.type}</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span>{p.billing_model}</span>
                    {p.event_type && <span className="ml-2 text-terminal-yellow">{p.event_type}</span>}
                    {p.usage_calculation && <span className="ml-2 text-muted-foreground">({p.usage_calculation})</span>}
                    {p.unit_price !== undefined && <span className="ml-2">{p.unit_price} {p.asset_code}/unit</span>}
                    {p.volume_rate !== undefined && <span className="ml-1">+ {p.volume_rate}/vol</span>}
                    {p.amount !== undefined && <span className="ml-2">{p.amount} {p.asset_code}/{p.recurring_interval}</span>}
                    {p.dimensions && p.dimensions.length > 0 && (
                      <span className="ml-2 text-muted-foreground">dims: [{p.dimensions.join(",")}]</span>
                    )}
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
              <div className="flex gap-2">
                {(pricingModel === "realtime" || pricingModel === "hybrid") && (
                  <button
                    onClick={() => openPriceForm("usage")}
                    className="flex items-center gap-2 border border-dashed border-foreground/30 px-4 py-2 font-space text-xs uppercase tracking-wide transition-colors hover:bg-accent"
                  >
                    <Plus className="h-3 w-3" /> Usage Price
                  </button>
                )}
                {(pricingModel === "fixed" || pricingModel === "hybrid") && (
                  <button
                    onClick={() => openPriceForm("fixed")}
                    className="flex items-center gap-2 border border-dashed border-foreground/30 px-4 py-2 font-space text-xs uppercase tracking-wide transition-colors hover:bg-accent"
                  >
                    <Plus className="h-3 w-3" /> Fixed Price
                  </button>
                )}
              </div>
              {prices.length === 0 && (
                <p className="font-ibm-plex text-xs text-muted-foreground">
                  ⚠ products need at least one price. you can also add prices later.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 border border-dashed border-foreground/20 p-4">
              <div className="font-space text-xs uppercase tracking-wide text-muted-foreground">
                Add {editingPriceType === "usage" ? "Usage" : "Fixed"} Price
              </div>

              {editingPriceType === "usage" ? (
                <>
                  {/* Billing Model */}
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

                  {/* Event Type */}
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

                  {/* Usage Calculation */}
                  <div>
                    <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Usage Calculation</label>
                    <div className="flex gap-0">
                      {(["unit", "volume", "unit_and_volume"] as const).map((c) => (
                        <button
                          key={c}
                          onClick={() => setUsageCalc(c)}
                          className={`border border-dashed border-foreground/30 px-3 py-1.5 font-space text-[10px] uppercase ${
                            usageCalc === c ? "bg-foreground text-background" : "hover:bg-accent"
                          }`}
                        >
                          {c.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1 font-ibm-plex text-[10px] text-muted-foreground">
                      {usageCalc === "unit" && "charge a flat fee per event occurrence (e.g. $0.50/image)"}
                      {usageCalc === "volume" && "multiply a payload field by rate (e.g. $0.001/token)"}
                      {usageCalc === "unit_and_volume" && "flat fee per event + volume-based charge (e.g. $0.05/chat + $0.0001/token)"}
                    </p>
                  </div>

                  {/* Volume Field */}
                  {(usageCalc === "volume" || usageCalc === "unit_and_volume") && (
                    <div>
                      <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Volume Field</label>
                      <input
                        value={volumeField}
                        onChange={(e) => setVolumeField(e.target.value)}
                        placeholder="e.g. total_tokens"
                        className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-1.5 font-ibm-plex text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                      />
                      <p className="mt-1 font-ibm-plex text-[10px] text-muted-foreground">the event property whose value determines quantity</p>
                    </div>
                  )}

                  {/* Price fields */}
                  <div className="grid grid-cols-2 gap-3">
                    {(usageCalc === "unit" || usageCalc === "unit_and_volume") && (
                      <div>
                        <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">
                          {usageCalc === "unit_and_volume" ? "Unit Price (per event)" : "Unit Price"}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(e.target.value)}
                          placeholder={usageCalc === "unit_and_volume" ? "0.05" : "0.00003"}
                          className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-1.5 font-ibm-plex text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                        />
                      </div>
                    )}
                    {(usageCalc === "volume") && (
                      <div>
                        <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Rate (per volume unit)</label>
                        <input
                          type="number"
                          step="any"
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(e.target.value)}
                          placeholder="0.001"
                          className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-1.5 font-ibm-plex text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                        />
                      </div>
                    )}
                    {usageCalc === "unit_and_volume" && (
                      <div>
                        <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Volume Rate (per unit)</label>
                        <input
                          type="number"
                          step="any"
                          value={volumeRate}
                          onChange={(e) => setVolumeRate(e.target.value)}
                          placeholder="0.0001"
                          className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-1.5 font-ibm-plex text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                        />
                      </div>
                    )}
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

                  {/* Dimensional Pricing */}
                  <div className="border-t border-dashed border-foreground/10 pt-3 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="font-space text-[10px] uppercase text-muted-foreground">Dimensional Pricing</label>
                      <span className="font-ibm-plex text-[10px] text-muted-foreground/60">(optional)</span>
                    </div>
                    <p className="font-ibm-plex text-[10px] text-muted-foreground mb-2">
                      charge different rates based on event properties, e.g. model=gpt-4 vs model=gpt-3.5
                    </p>
                    <div className="flex gap-2 mb-2">
                      <input
                        value={newDimension}
                        onChange={(e) => setNewDimension(e.target.value)}
                        placeholder="e.g. model"
                        className="flex-1 border border-dashed border-foreground/30 bg-transparent px-2 py-1 font-ibm-plex text-[10px] focus:outline-none focus:ring-1 focus:ring-foreground"
                      />
                      <button
                        onClick={() => {
                          if (newDimension.trim() && !dimensions.includes(newDimension.trim())) {
                            setDimensions([...dimensions, newDimension.trim()]);
                            setNewDimension("");
                          }
                        }}
                        className="border border-dashed border-foreground/30 px-2 py-1 font-space text-[10px] uppercase hover:bg-accent"
                      >
                        Add Dim
                      </button>
                    </div>
                    {dimensions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {dimensions.map((d) => (
                            <span key={d} className="flex items-center gap-1 border border-dashed border-foreground/20 px-2 py-0.5 font-ibm-plex text-[10px]">
                              {d}
                              <button onClick={() => setDimensions(dimensions.filter((x) => x !== d))} className="text-muted-foreground hover:text-terminal-red">×</button>
                            </span>
                          ))}
                        </div>
                        <p className="font-ibm-plex text-[10px] text-muted-foreground">
                          → add per-dimension rates below. each row defines the rate for a specific dimension value.
                        </p>
                        {dimensionalTiers.map((tier, i) => (
                          <div key={i} className="flex items-center gap-2">
                            {dimensions.map((d) => (
                              <input
                                key={d}
                                value={tier.dimensions?.[d] || ""}
                                onChange={(e) => {
                                  const updated = [...dimensionalTiers];
                                  updated[i] = { ...updated[i], dimensions: { ...updated[i].dimensions, [d]: e.target.value } };
                                  setDimensionalTiers(updated);
                                }}
                                placeholder={d}
                                className="flex-1 border border-dashed border-foreground/30 bg-transparent px-2 py-1 font-ibm-plex text-[10px] focus:outline-none"
                              />
                            ))}
                            <input
                              type="number"
                              step="any"
                              value={tier.unit_price || ""}
                              onChange={(e) => {
                                const updated = [...dimensionalTiers];
                                updated[i] = { ...updated[i], unit_price: parseFloat(e.target.value) || 0 };
                                setDimensionalTiers(updated);
                              }}
                              placeholder="rate"
                              className="w-24 border border-dashed border-foreground/30 bg-transparent px-2 py-1 font-ibm-plex text-[10px] focus:outline-none"
                            />
                            <button
                              onClick={() => setDimensionalTiers(dimensionalTiers.filter((_, j) => j !== i))}
                              className="text-muted-foreground hover:text-terminal-red"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setDimensionalTiers([...dimensionalTiers, { up_to: null, unit_price: 0, dimensions: {} }])}
                          className="flex items-center gap-1 font-space text-[10px] uppercase text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-3 w-3" /> Add Rate Row
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tiered Pricing (non-dimensional) */}
                  {dimensions.length === 0 && (
                    <div className="border-t border-dashed border-foreground/10 pt-3 mt-2">
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          onClick={() => setUseTiers(!useTiers)}
                          className={`border border-dashed border-foreground/30 px-3 py-1 font-space text-[10px] uppercase ${
                            useTiers ? "bg-foreground text-background" : "hover:bg-accent"
                          }`}
                        >
                          {useTiers ? "✓ Tiered" : "Add Tiers"}
                        </button>
                        <span className="font-ibm-plex text-[10px] text-muted-foreground">
                          different rates at volume thresholds
                        </span>
                      </div>
                      {useTiers && (
                        <div className="space-y-2">
                          {tiers.map((tier, i) => (
                            <div key={i} className="flex items-center gap-2 font-ibm-plex text-[10px]">
                              <span className="text-muted-foreground w-12">up to</span>
                              <input
                                type="number"
                                value={tier.up_to ?? ""}
                                onChange={(e) => {
                                  const updated = [...tiers];
                                  updated[i] = { ...updated[i], up_to: e.target.value ? parseInt(e.target.value) : null };
                                  setTiers(updated);
                                }}
                                placeholder="∞"
                                className="w-20 border border-dashed border-foreground/30 bg-transparent px-2 py-1 focus:outline-none"
                              />
                              <span className="text-muted-foreground">→</span>
                              <input
                                type="number"
                                step="any"
                                value={tier.unit_price || ""}
                                onChange={(e) => {
                                  const updated = [...tiers];
                                  updated[i] = { ...updated[i], unit_price: parseFloat(e.target.value) || 0 };
                                  setTiers(updated);
                                }}
                                placeholder="rate"
                                className="w-24 border border-dashed border-foreground/30 bg-transparent px-2 py-1 focus:outline-none"
                              />
                              <span className="text-muted-foreground">{assetCode}</span>
                              {tiers.length > 1 && (
                                <button onClick={() => setTiers(tiers.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-terminal-red">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => setTiers([...tiers, { up_to: null, unit_price: 0 }])}
                            className="flex items-center gap-1 font-space text-[10px] uppercase text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="h-3 w-3" /> Add Tier
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Fixed price form */
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
                  <p className="font-ibm-plex text-[10px] text-muted-foreground">
                    customers will be charged this amount on a {recurringInterval} basis.
                  </p>
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

      {/* ===== Step: Entitlements ===== */}
      {step === "entitlements" && (
        <div className="space-y-4">
          <div className="border border-dashed border-foreground/10 p-3 font-ibm-plex text-[10px] text-muted-foreground space-y-1">
            <p>→ entitlements are right-to-use grants bundled with the subscription.</p>
            {pricingModel === "hybrid" && (
              <p className="text-terminal-yellow">→ these credits will be consumed by your usage-based prices. when exhausted, overage charges apply.</p>
            )}
            {pricingModel === "fixed" && (
              <p>→ give customers included credits or allowances that refresh each billing cycle.</p>
            )}
          </div>

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
                  <label className="mb-1 block font-space text-[10px] uppercase text-muted-foreground">Refresh Strategy</label>
                  <select
                    value={entRefresh}
                    onChange={(e) => setEntRefresh(e.target.value as any)}
                    className="w-full border border-dashed border-foreground/30 bg-transparent px-3 py-1.5 font-ibm-plex text-xs text-foreground focus:outline-none"
                  >
                    <option value="reset">Reset</option>
                    <option value="rollover">Rollover</option>
                    <option value="none">None (one-time)</option>
                  </select>
                  <p className="mt-1 font-ibm-plex text-[10px] text-muted-foreground">
                    reset = expire &amp; replace · rollover = carry unused · none = one-time grant
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
              → {pricingModel === "hybrid"
                ? "hybrid products typically include credits. add entitlements so overage kicks in after they're used."
                : "skip this step if your subscription doesn't include any credits or allowances."}
            </p>
          )}
        </div>
      )}

      {/* ===== Step: Review ===== */}
      {step === "review" && (
        <div className="space-y-4">
          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="font-ibm-plex text-xs text-terminal-yellow">⚠ {w}</p>
              ))}
            </div>
          )}

          <div className="border border-dashed border-foreground/15 p-4 font-ibm-plex text-xs">
            <div className="mb-3 font-space text-xs uppercase tracking-wide">Product Summary</div>
            <div className="space-y-1">
              <div><span className="text-muted-foreground">name:</span> <span className="font-bold">{name}</span></div>
              <div><span className="text-muted-foreground">code:</span> {code.trim().toLowerCase().replace(/\s+/g, "-")}</div>
              <div><span className="text-muted-foreground">model:</span> <span className="text-terminal-green">{modelLabel}</span></div>
              <div><span className="text-muted-foreground">status:</span> <span className="text-terminal-yellow">→ draft</span></div>
              <div><span className="text-muted-foreground">prices:</span> {prices.length}</div>
              <div><span className="text-muted-foreground">entitlements:</span> {entitlements.length}</div>
            </div>
          </div>

          {prices.length > 0 && (
            <div className="border border-dashed border-foreground/15 p-4 font-ibm-plex text-xs">
              <div className="mb-2 font-space text-xs uppercase tracking-wide">Prices</div>
              {prices.map((p, i) => (
                <div key={i} className="border-b border-dashed border-foreground/10 py-2 last:border-0 space-y-1">
                  <div>
                    <span className="font-bold uppercase">{p.type}</span>
                    {p.type === "usage" && (
                      <span className="ml-1 text-muted-foreground">
                        · {p.billing_model} · {p.event_type} · {p.usage_calculation}
                      </span>
                    )}
                    {p.type === "fixed" && (
                      <span className="ml-1 text-muted-foreground">
                        · {p.amount} {p.asset_code}/{p.recurring_interval}
                      </span>
                    )}
                  </div>
                  {p.type === "usage" && (
                    <div className="text-muted-foreground pl-2">
                      {p.unit_price !== undefined && <span>unit_price: {p.unit_price} </span>}
                      {p.volume_rate !== undefined && <span>volume_rate: {p.volume_rate} </span>}
                      {p.volume_field && <span>field: {p.volume_field} </span>}
                      <span>{p.asset_code}</span>
                    </div>
                  )}
                  {p.dimensions && p.dimensions.length > 0 && (
                    <div className="pl-2 text-muted-foreground">
                      dimensions: [{p.dimensions.join(", ")}]
                      {p.tiers && p.tiers.length > 0 && (
                        <table className="mt-1 w-full text-[10px]">
                          <thead>
                            <tr className="border-b border-dashed border-foreground/20">
                              {p.dimensions.map((d) => (
                                <th key={d} className="px-1 py-0.5 text-left">{d}</th>
                              ))}
                              <th className="px-1 py-0.5 text-left">rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.tiers.map((t, j) => (
                              <tr key={j} className="border-b border-dashed border-foreground/10">
                                {p.dimensions!.map((d) => (
                                  <td key={d} className="px-1 py-0.5">{t.dimensions?.[d] || "—"}</td>
                                ))}
                                <td className="px-1 py-0.5">{t.unit_price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                  {p.tiers && p.tiers.length > 0 && !p.dimensions?.length && (
                    <div className="pl-2 text-muted-foreground text-[10px]">
                      tiers: {p.tiers.map((t, j) => (
                        <span key={j}>
                          {t.up_to ? `≤${t.up_to}` : "∞"}: {t.unit_price} {p.asset_code}
                          {j < p.tiers!.length - 1 ? " → " : ""}
                        </span>
                      ))}
                    </div>
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
