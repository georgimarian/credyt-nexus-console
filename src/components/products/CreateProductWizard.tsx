import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FieldLabel } from "@/components/terminal/FieldLabel";
import { useProductStore } from "@/stores/productStore";
import { X, ArrowRight, ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import type { Product, Price, Entitlement, PriceTier } from "@/data/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type PricingModel = "realtime" | "fixed" | "hybrid";
type Step = "basics" | "model" | "prices" | "entitlements" | "review";

const ALL_STEPS: { key: Step; label: string }[] = [
  { key: "model", label: "Model" },
  { key: "basics", label: "Basics" },
  { key: "prices", label: "Prices" },
  { key: "entitlements", label: "Entitlements" },
  { key: "review", label: "Review" },
];

const STEP_HELP: Record<Step, string> = {
  basics: "Set the product name and code. The code is used in API calls and event matching.",
  model: "Choose how you want to charge customers. This determines which pricing options are available.",
  prices: "Configure your pricing rules based on your chosen model.",
  entitlements: "Define included credits or allowances bundled with the subscription.",
  review: "Review your product configuration before creating it.",
};

const MODEL_INFO: Record<PricingModel, { icon: string; title: string; tagline: string; desc: string; examples: string[]; reasons: string[] }> = {
  realtime: {
    icon: "⚡",
    title: "Real-time Usage-Based",
    tagline: "LLM APIs, image generators, video tools",
    desc: "Real-time usage deducted from prepaid wallet balance",
    examples: ["$0.005 per 1K tokens", "$0.04 per image", "$2.50 per video"],
    reasons: [
      "Infrastructure costs are variable & unpredictable",
      "Can't afford to front costs for customers",
      "Customers expect pay-as-you-go (devs / prosumers)",
    ],
  },
  fixed: {
    icon: "↻",
    title: "Fixed Recurring",
    tagline: "Early-stage SaaS, enterprise contracts",
    desc: "Fixed recurring fee per billing cycle",
    examples: ["$29/month flat", "€99/year access fee"],
    reasons: [
      "Need predictable baseline revenue",
      "Still figuring out cost structure",
      "Enterprise buyers want invoice cycles",
    ],
  },
  hybrid: {
    icon: "◈",
    title: "Hybrid (Subscription + Usage)",
    tagline: "Clay, Cursor, GitHub Copilot-style products",
    desc: "Subscription fee with included credits. Overage charged on usage.",
    examples: ["$20/month + 10 credits/image", "$49/month, top-up beyond quota"],
    reasons: [
      "Want baseline revenue + usage-based growth",
      "Some features seat-based, others consumption-based",
      "Customers want predictability + flexibility",
    ],
  },
};

interface CreateProductWizardProps {
  onClose: () => void;
  prefilled?: {
    name?: string;
    code?: string;
    pricingModel?: "realtime" | "fixed" | "hybrid";
    recipeBanner?: string;
  };
}

export function CreateProductWizard({ onClose, prefilled }: CreateProductWizardProps) {
  const navigate = useNavigate();
  const { addProduct } = useProductStore();
  const [step, setStep] = useState<Step>(prefilled?.pricingModel ? "basics" : "model");

  // Basics
  const [name, setName] = useState(prefilled?.name || "");
  const [code, setCode] = useState(prefilled?.code || "");

  // Model
  const [pricingModel, setPricingModel] = useState<PricingModel | null>(prefilled?.pricingModel || null);

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
    if (step === "model") return pricingModel !== null;
    if (step === "basics") return name.trim().length > 0 && code.trim().length > 0;
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
    warnings.push("Real-time model requires at least one usage price");
  }
  if (pricingModel === "hybrid" && !prices.some((p) => p.type === "fixed")) {
    warnings.push("Hybrid model should include a fixed subscription price");
  }
  if (pricingModel === "hybrid" && !prices.some((p) => p.type === "usage")) {
    warnings.push("Hybrid model should include at least one usage price");
  }

  const progressPct = ((stepIndex + 1) / activeSteps.length) * 100;
  const progressFilled = Math.round(progressPct / 5);
  const progressBar = "█".repeat(progressFilled) + "░".repeat(20 - progressFilled);

  const modelLabel = pricingModel ? MODEL_INFO[pricingModel].title : "";

  /* ── Shared input class ── */
  const inputCls = "w-full border border-dashed border-foreground/30 bg-transparent px-3 py-2 font-ibm-plex text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground";
  const selectCls = "w-full border border-dashed border-foreground/30 bg-transparent px-3 py-2 font-ibm-plex text-sm text-foreground focus:outline-none";
  const toggleCls = (active: boolean) =>
    `border border-dashed border-foreground/30 px-3 py-2 font-space text-[11px] uppercase tracking-wide transition-colors ${
      active ? "bg-foreground text-background" : "hover:bg-accent/60"
    }`;
  const btnOutlineCls = "flex items-center gap-2 border border-dashed border-foreground/30 px-4 py-2.5 font-space text-xs uppercase tracking-wide transition-colors hover:bg-accent/60";
  const btnPrimaryCls = "border border-dashed border-foreground/30 bg-foreground px-4 py-2.5 font-space text-xs uppercase text-background transition-colors hover:bg-muted-foreground";

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 gap-0 border-foreground/[0.12] bg-background dark:bg-background">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-space text-xs uppercase tracking-widest text-muted-foreground">
            ┌─ CREATE PRODUCT ─────────────────────────┐
          </DialogTitle>
          <DialogDescription className="sr-only">Create a new product</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[85vh]">
          <div className="px-6 py-6">
            {/* ── Recipe / AI banner ── */}
            {prefilled?.recipeBanner && (
              <div className="bg-teal-400/10 border border-dotted border-teal-400/20 px-4 py-2 text-xs font-mono text-teal-400 mb-4">
                {prefilled.recipeBanner}
              </div>
            )}

            {/* ── Step indicator ── */}
            <div className="mb-8 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-space text-xs text-white/40">STEP {stepIndex + 1} OF {activeSteps.length}</span>
                <span className="font-space text-xs text-white/60 uppercase">{activeSteps[stepIndex].label}</span>
              </div>
              <div className="w-full h-0.5 bg-white/10">
                <div className="h-full bg-[#4ADE80] transition-all duration-300" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            {/* ── Help text ── */}
            <p className="mb-6 font-ibm-plex text-xs text-muted-foreground leading-relaxed">
              {STEP_HELP[step]}
            </p>

            {/* ═══════════════ Step 1: Model ═══════════════ */}
            {step === "model" && (
              <div className="space-y-4">
                {(Object.keys(MODEL_INFO) as PricingModel[]).map((key) => {
                  const m = MODEL_INFO[key];
                  const selected = pricingModel === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setPricingModel(key)}
                      className={`w-full text-left p-6 transition-all ${
                        selected
                          ? "border border-[#4ADE80]/40 bg-[#4ADE80]/5"
                          : "border border-white/10 bg-[#0F0F0F] hover:border-white/25"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[#2DD4BF] text-lg">{m.icon}</span>
                          <span className="font-space text-sm font-bold uppercase tracking-wide">{m.title}</span>
                          <span className="text-xs text-white/30 font-ibm-plex ml-1">{m.tagline}</span>
                        </div>
                        {selected && <span className="text-[#4ADE80] text-sm font-space">✓</span>}
                      </div>
                      <p className="font-ibm-plex text-xs text-white/60 mb-3">{m.desc}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {m.examples.map((ex, i) => (
                          <span key={i} className="bg-white/5 text-[#2DD4BF] text-xs px-2 py-0.5 font-ibm-plex">{ex}</span>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {m.reasons.map((r, i) => (
                          <div key={i} className="text-xs text-white/40 font-ibm-plex">✓ {r}</div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ═══════════════ Step 2: Basics ═══════════════ */}
            {step === "basics" && (
              <div className="space-y-6">
                <div>
                  <FieldLabel label="Product Name" required tooltip="Display name shown to customers in invoices and the dashboard." />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. AI Agent Pro"
                    autoFocus
                    className={inputCls}
                  />
                </div>
                <div>
                  <FieldLabel label="Product Code" required tooltip="Unique identifier used in API calls and event matching. Lowercase, no spaces." />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. ai-agent-pro"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* ═══════════════ Step: Prices ═══════════════ */}
            {step === "prices" && (
        <div className="space-y-6">
          {/* Contextual guidance */}
          <div className="border border-dashed border-foreground/10 p-4 font-ibm-plex text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            {pricingModel === "realtime" && (
              <>
                <p>→ Add usage-based prices that deduct from customer wallets in real-time.</p>
                <p>→ Each price matches an <code className="bg-muted px-1 py-0.5 text-[10px]">event_type</code> from your API events.</p>
              </>
            )}
            {pricingModel === "fixed" && (
              <>
                <p>→ Add a fixed recurring price (monthly or yearly subscription fee).</p>
                <p>→ You can add multiple tiers or plans as separate prices.</p>
              </>
            )}
            {pricingModel === "hybrid" && (
              <>
                <p>→ Add a fixed subscription price + usage-based prices for overage.</p>
                <p>→ Included credits are configured in the next step (entitlements).</p>
              </>
            )}
          </div>

          {/* Existing prices table */}
          {prices.length > 0 && (
            <div className="border border-dashed border-foreground/15">
              <table className="w-full font-ibm-plex text-xs">
                <thead>
                  <tr className="border-b border-dashed border-foreground/20">
                    <th className="px-4 py-2.5 text-left font-space text-[10px] uppercase tracking-wide text-muted-foreground">Type</th>
                    <th className="px-4 py-2.5 text-left font-space text-[10px] uppercase tracking-wide text-muted-foreground">Model</th>
                    <th className="px-4 py-2.5 text-left font-space text-[10px] uppercase tracking-wide text-muted-foreground">Details</th>
                    <th className="px-4 py-2.5 text-left font-space text-[10px] uppercase tracking-wide text-muted-foreground">Rate</th>
                    <th className="w-10 px-2 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map((p, i) => (
                    <tr key={i} className="border-b border-dashed border-foreground/10 last:border-0">
                      <td className="px-4 py-3 font-bold uppercase">{p.type}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.billing_model?.replace("_", " ")}</td>
                      <td className="px-4 py-3">
                        {p.event_type && <span className="text-terminal-yellow">{p.event_type}</span>}
                        {p.usage_calculation && <span className="ml-1.5 text-muted-foreground">({p.usage_calculation.replace(/_/g, " ")})</span>}
                        {p.amount !== undefined && <span>{p.amount} {p.asset_code}/{p.recurring_interval}</span>}
                        {p.dimensions && p.dimensions.length > 0 && (
                          <span className="ml-1.5 text-muted-foreground text-[10px]">[{p.dimensions.join(",")}]</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.unit_price !== undefined && <span>{p.unit_price} {p.asset_code}</span>}
                        {p.volume_rate !== undefined && <span className="ml-1 text-muted-foreground">+ {p.volume_rate}/vol</span>}
                      </td>
                      <td className="px-2 py-3">
                        <button onClick={() => setPrices(prices.filter((_, j) => j !== i))} className="text-muted-foreground transition-colors hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!showPriceForm ? (
            <div className="space-y-3">
              <div className="flex gap-3">
                {(pricingModel === "realtime" || pricingModel === "hybrid") && (
                  <button onClick={() => openPriceForm("usage")} className={btnOutlineCls}>
                    <Plus className="h-3.5 w-3.5" /> Usage Price
                  </button>
                )}
                {(pricingModel === "fixed" || pricingModel === "hybrid") && (
                  <button onClick={() => openPriceForm("fixed")} className={btnOutlineCls}>
                    <Plus className="h-3.5 w-3.5" /> Fixed Price
                  </button>
                )}
              </div>
              {prices.length === 0 && (
                <p className="font-ibm-plex text-xs text-muted-foreground">
                  ⚠ Products need at least one price. You can also add prices later.
                </p>
              )}
            </div>
          ) : (
            /* ── Price form ── */
            <div className="space-y-5 border border-dashed border-foreground/20 p-5">
              <div className="font-space text-xs uppercase tracking-widest text-muted-foreground">
                ┌─ New {editingPriceType === "usage" ? "Usage" : "Fixed"} Price ─┐
              </div>

              {editingPriceType === "usage" ? (
                <>
                  {/* Billing Model */}
                  <div>
                    <FieldLabel
                      label="Billing Model"
                      tooltip="Real-time: deducts from wallet instantly per event. Recurring: aggregates usage and bills at end of billing cycle."
                    />
                    <div className="flex">
                      {(["real_time", "recurring"] as const).map((m) => (
                        <button key={m} onClick={() => setBillingModel(m)} className={toggleCls(billingModel === m)}>
                          {m.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Event Type */}
                  <div>
                    <FieldLabel
                      label="Event Type"
                      tooltip="Matches the event_type field in your API events. Each incoming event is routed to the price with the same event_type."
                    />
                    <input
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      placeholder="e.g. chat_completion"
                      className={inputCls}
                    />
                  </div>

                  {/* Usage Calculation */}
                  <div>
                    <FieldLabel
                      label="Usage Calculation"
                      tooltip="Unit: flat fee per event. Volume: multiply a payload field by rate. Unit & Volume: both a flat fee per event plus a volume-based charge."
                    />
                    <div className="flex flex-wrap">
                      {(["unit", "volume", "unit_and_volume"] as const).map((c) => (
                        <button key={c} onClick={() => setUsageCalc(c)} className={toggleCls(usageCalc === c)}>
                          {c === "unit_and_volume" ? "unit + volume" : c}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 font-ibm-plex text-[11px] text-muted-foreground leading-relaxed">
                      {usageCalc === "unit" && "Charge a flat fee per event occurrence (e.g. $0.50/image generated)"}
                      {usageCalc === "volume" && "Multiply a payload field by rate (e.g. $0.001/token)"}
                      {usageCalc === "unit_and_volume" && "Flat fee per event + volume-based charge (e.g. $0.05/chat + $0.0001/token)"}
                    </p>
                  </div>

                  {/* Volume Field */}
                  {(usageCalc === "volume" || usageCalc === "unit_and_volume") && (
                    <div>
                      <FieldLabel
                        label="Volume Field"
                        tooltip="The property name in your event payload whose numeric value determines quantity. For example, 'total_tokens' in a chat completion event."
                      />
                      <input
                        value={volumeField}
                        onChange={(e) => setVolumeField(e.target.value)}
                        placeholder="e.g. total_tokens"
                        className={inputCls}
                      />
                    </div>
                  )}

                  {/* Price fields */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {(usageCalc === "unit" || usageCalc === "unit_and_volume") && (
                      <div>
                        <FieldLabel
                          label={usageCalc === "unit_and_volume" ? "Unit Price (per event)" : "Unit Price"}
                          tooltip="The flat fee charged for each event occurrence."
                        />
                        <input
                          type="number"
                          step="any"
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(e.target.value)}
                          placeholder={usageCalc === "unit_and_volume" ? "0.05" : "0.00003"}
                          className={inputCls}
                        />
                      </div>
                    )}
                    {usageCalc === "volume" && (
                      <div>
                        <FieldLabel
                          label="Rate (per volume unit)"
                          tooltip="The rate multiplied by the volume field value to calculate the charge."
                        />
                        <input
                          type="number"
                          step="any"
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(e.target.value)}
                          placeholder="0.001"
                          className={inputCls}
                        />
                      </div>
                    )}
                    {usageCalc === "unit_and_volume" && (
                      <div>
                        <FieldLabel
                          label="Volume Rate"
                          tooltip="Additional rate per volume unit, on top of the flat unit price."
                        />
                        <input
                          type="number"
                          step="any"
                          value={volumeRate}
                          onChange={(e) => setVolumeRate(e.target.value)}
                          placeholder="0.0001"
                          className={inputCls}
                        />
                      </div>
                    )}
                    <div>
                      <FieldLabel label="Asset" tooltip="The currency or token used for billing. USD for fiat, or CREDITS for custom tokens." />
                      <select value={assetCode} onChange={(e) => setAssetCode(e.target.value)} className={selectCls}>
                        <option value="USD">USD</option>
                        <option value="CREDITS">CREDITS</option>
                      </select>
                    </div>
                  </div>

                  {/* ── Dimensional Pricing ── */}
                  <div className="border-t border-dashed border-foreground/10 pt-5">
                    <FieldLabel
                      label="Dimensional Pricing"
                      tooltip="Charge different rates based on event properties. For example, different prices for model=gpt-4 vs model=gpt-3.5-turbo."
                    />
                    <p className="mb-3 font-ibm-plex text-[11px] text-muted-foreground leading-relaxed">
                      Optional. Add dimensions to vary rates by event properties.
                    </p>
                    <div className="flex gap-2 mb-3">
                      <input
                        value={newDimension}
                        onChange={(e) => setNewDimension(e.target.value)}
                        placeholder="e.g. model"
                        className="flex-1 border border-dashed border-foreground/30 bg-transparent px-3 py-2 font-ibm-plex text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                      />
                      <button
                        onClick={() => {
                          if (newDimension.trim() && !dimensions.includes(newDimension.trim())) {
                            setDimensions([...dimensions, newDimension.trim()]);
                            setNewDimension("");
                          }
                        }}
                        className={btnOutlineCls}
                      >
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                    {dimensions.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          {dimensions.map((d) => (
                            <span key={d} className="flex items-center gap-1.5 border border-dashed border-foreground/20 px-2.5 py-1 font-ibm-plex text-[11px]">
                              {d}
                              <button onClick={() => setDimensions(dimensions.filter((x) => x !== d))} className="text-muted-foreground hover:text-destructive">×</button>
                            </span>
                          ))}
                        </div>
                        {/* Dimension rate table */}
                        <div className="border border-dashed border-foreground/15">
                          <table className="w-full font-ibm-plex text-xs">
                            <thead>
                              <tr className="border-b border-dashed border-foreground/20">
                                {dimensions.map((d) => (
                                  <th key={d} className="px-3 py-2 text-left font-space text-[10px] uppercase tracking-wide text-muted-foreground">{d}</th>
                                ))}
                                <th className="px-3 py-2 text-left font-space text-[10px] uppercase tracking-wide text-muted-foreground">Rate</th>
                                <th className="w-10 px-2 py-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {dimensionalTiers.map((tier, i) => (
                                <tr key={i} className="border-b border-dashed border-foreground/10 last:border-0">
                                  {dimensions.map((d) => (
                                    <td key={d} className="px-3 py-2">
                                      <input
                                        value={tier.dimensions?.[d] || ""}
                                        onChange={(e) => {
                                          const updated = [...dimensionalTiers];
                                          updated[i] = { ...updated[i], dimensions: { ...updated[i].dimensions, [d]: e.target.value } };
                                          setDimensionalTiers(updated);
                                        }}
                                        placeholder={d}
                                        className="w-full border-b border-dashed border-foreground/20 bg-transparent py-1 font-ibm-plex text-xs focus:outline-none"
                                      />
                                    </td>
                                  ))}
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      step="any"
                                      value={tier.unit_price || ""}
                                      onChange={(e) => {
                                        const updated = [...dimensionalTiers];
                                        updated[i] = { ...updated[i], unit_price: parseFloat(e.target.value) || 0 };
                                        setDimensionalTiers(updated);
                                      }}
                                      placeholder="0.001"
                                      className="w-full border-b border-dashed border-foreground/20 bg-transparent py-1 font-ibm-plex text-xs focus:outline-none"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <button onClick={() => setDimensionalTiers(dimensionalTiers.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <button
                          onClick={() => setDimensionalTiers([...dimensionalTiers, { up_to: null, unit_price: 0, dimensions: {} }])}
                          className="flex items-center gap-1.5 font-space text-[11px] uppercase text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Plus className="h-3 w-3" /> Add Rate Row
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Tiered Pricing (non-dimensional) ── */}
                  {dimensions.length === 0 && (
                    <div className="border-t border-dashed border-foreground/10 pt-5">
                      <div className="flex items-center gap-4 mb-3">
                        <button onClick={() => setUseTiers(!useTiers)} className={toggleCls(useTiers)}>
                          {useTiers ? "✓ Tiered Pricing" : "Add Tiers"}
                        </button>
                        <span className="font-ibm-plex text-[11px] text-muted-foreground">
                          Different rates at volume thresholds
                        </span>
                      </div>
                      {useTiers && (
                        <div className="space-y-3">
                          <div className="border border-dashed border-foreground/15">
                            <table className="w-full font-ibm-plex text-xs">
                              <thead>
                                <tr className="border-b border-dashed border-foreground/20">
                                  <th className="px-3 py-2 text-left font-space text-[10px] uppercase tracking-wide text-muted-foreground">Up To</th>
                                  <th className="px-3 py-2 text-left font-space text-[10px] uppercase tracking-wide text-muted-foreground">Rate ({assetCode})</th>
                                  <th className="w-10 px-2 py-2"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {tiers.map((tier, i) => (
                                  <tr key={i} className="border-b border-dashed border-foreground/10 last:border-0">
                                    <td className="px-3 py-2">
                                      <input
                                        type="number"
                                        value={tier.up_to ?? ""}
                                        onChange={(e) => {
                                          const updated = [...tiers];
                                          updated[i] = { ...updated[i], up_to: e.target.value ? parseInt(e.target.value) : null };
                                          setTiers(updated);
                                        }}
                                        placeholder="∞"
                                        className="w-full border-b border-dashed border-foreground/20 bg-transparent py-1 focus:outline-none"
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="number"
                                        step="any"
                                        value={tier.unit_price || ""}
                                        onChange={(e) => {
                                          const updated = [...tiers];
                                          updated[i] = { ...updated[i], unit_price: parseFloat(e.target.value) || 0 };
                                          setTiers(updated);
                                        }}
                                        placeholder="0.001"
                                        className="w-full border-b border-dashed border-foreground/20 bg-transparent py-1 focus:outline-none"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      {tiers.length > 1 && (
                                        <button onClick={() => setTiers(tiers.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <button
                            onClick={() => setTiers([...tiers, { up_to: null, unit_price: 0 }])}
                            className="flex items-center gap-1.5 font-space text-[11px] uppercase text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <Plus className="h-3 w-3" /> Add Tier
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* ── Fixed price form ── */
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <FieldLabel label="Amount" tooltip="The fixed amount charged each billing interval." />
                      <input
                        type="number"
                        step="any"
                        value={fixedAmount}
                        onChange={(e) => setFixedAmount(e.target.value)}
                        placeholder="49.00"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <FieldLabel label="Interval" tooltip="How often the customer is charged. Monthly or yearly." />
                      <select value={recurringInterval} onChange={(e) => setRecurringInterval(e.target.value as any)} className={selectCls}>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div>
                      <FieldLabel label="Asset" tooltip="The currency used for billing." />
                      <select value={assetCode} onChange={(e) => setAssetCode(e.target.value)} className={selectCls}>
                        <option value="USD">USD</option>
                        <option value="CREDITS">CREDITS</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 border-t border-dashed border-foreground/10 pt-4">
                <button onClick={addPrice} className={btnPrimaryCls}>
                  Add Price
                </button>
                <button onClick={() => setShowPriceForm(false)} className={btnOutlineCls}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

            {/* ═══════════════ Step: Entitlements ═══════════════ */}
            {step === "entitlements" && (
        <div className="space-y-6">
          <div className="border border-dashed border-foreground/10 p-4 font-ibm-plex text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <p>→ Entitlements are right-to-use grants bundled with the subscription.</p>
            {pricingModel === "hybrid" && (
              <p className="text-terminal-yellow">→ These credits will be consumed by your usage-based prices. When exhausted, overage charges apply.</p>
            )}
            {pricingModel === "fixed" && (
              <p>→ Give customers included credits or allowances that refresh each billing cycle.</p>
            )}
          </div>

          {/* Entitlements table */}
          {entitlements.length > 0 && (
            <div className="border border-dashed border-foreground/15">
              <table className="w-full font-ibm-plex text-xs">
                <thead>
                  <tr className="border-b border-dashed border-foreground/20">
                    <th className="px-4 py-2.5 text-left font-space text-[10px] uppercase tracking-wide text-muted-foreground">Amount</th>
                    <th className="px-4 py-2.5 text-left font-space text-[10px] uppercase tracking-wide text-muted-foreground">Asset</th>
                    <th className="px-4 py-2.5 text-left font-space text-[10px] uppercase tracking-wide text-muted-foreground">Refresh</th>
                    <th className="w-10 px-2 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {entitlements.map((e, i) => (
                    <tr key={i} className="border-b border-dashed border-foreground/10 last:border-0">
                      <td className="px-4 py-3 font-bold">{e.amount}</td>
                      <td className="px-4 py-3">{e.asset_code}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.refresh_strategy}</td>
                      <td className="px-2 py-3">
                        <button onClick={() => setEntitlements(entitlements.filter((_, j) => j !== i))} className="text-muted-foreground transition-colors hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!showEntForm ? (
            <div className="space-y-3">
              <button onClick={() => setShowEntForm(true)} className={btnOutlineCls}>
                <Plus className="h-3.5 w-3.5" /> Add Entitlement
              </button>
              {entitlements.length === 0 && (
                <p className="font-ibm-plex text-xs text-muted-foreground leading-relaxed">
                  {pricingModel === "hybrid"
                    ? "→ Hybrid products typically include credits. Add entitlements so overage kicks in after they're used."
                    : "→ Skip this step if your subscription doesn't include any credits or allowances."}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-5 border border-dashed border-foreground/20 p-5">
              <div className="font-space text-xs uppercase tracking-widest text-muted-foreground">
                ┌─ New Entitlement ─┐
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <FieldLabel label="Asset" tooltip="The type of credit or token being granted." />
                  <select value={entAsset} onChange={(e) => setEntAsset(e.target.value)} className={selectCls}>
                    <option value="CREDITS">CREDITS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <FieldLabel label="Amount" tooltip="Number of credits or units included per billing cycle." />
                  <input
                    type="number"
                    value={entAmount}
                    onChange={(e) => setEntAmount(e.target.value)}
                    placeholder="10000"
                    className={inputCls}
                  />
                </div>
                <div>
                  <FieldLabel
                    label="Refresh Strategy"
                    tooltip="Reset: expire remaining and grant full amount. Rollover: carry unused credits forward. None: one-time grant that doesn't refresh."
                  />
                  <select value={entRefresh} onChange={(e) => setEntRefresh(e.target.value as any)} className={selectCls}>
                    <option value="reset">Reset (expire & replace)</option>
                    <option value="rollover">Rollover (carry unused)</option>
                    <option value="none">None (one-time grant)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 border-t border-dashed border-foreground/10 pt-4">
                <button onClick={addEntitlement} className={btnPrimaryCls}>Add Entitlement</button>
                <button onClick={() => setShowEntForm(false)} className={btnOutlineCls}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

            {/* ═══════════════ Step: Review ═══════════════ */}
            {step === "review" && (
        <div className="space-y-6">
          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="border border-dashed border-terminal-yellow/30 p-4 space-y-1.5">
              {warnings.map((w, i) => (
                <p key={i} className="font-ibm-plex text-xs text-terminal-yellow">⚠ {w}</p>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="border border-dashed border-foreground/15 p-5">
            <div className="mb-4 font-space text-xs uppercase tracking-widest text-muted-foreground">
              ┌─ Product Summary ─┐
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 font-ibm-plex text-sm">
              <div className="text-muted-foreground text-xs">Name</div>
              <div className="font-bold">{name}</div>
              <div className="text-muted-foreground text-xs">Code</div>
              <div>{code.trim().toLowerCase().replace(/\s+/g, "-")}</div>
              <div className="text-muted-foreground text-xs">Model</div>
              <div className="text-terminal-green">{modelLabel}</div>
              <div className="text-muted-foreground text-xs">Status</div>
              <div className="text-terminal-yellow">Draft</div>
              <div className="text-muted-foreground text-xs">Prices</div>
              <div>{prices.length}</div>
              <div className="text-muted-foreground text-xs">Entitlements</div>
              <div>{entitlements.length}</div>
            </div>
          </div>

          {/* Prices detail */}
          {prices.length > 0 && (
            <div className="border border-dashed border-foreground/15">
              <div className="border-b border-dashed border-foreground/15 px-5 py-3 font-space text-xs uppercase tracking-widest text-muted-foreground">
                ┌─ Prices ─┐
              </div>
              <div className="divide-y divide-dashed divide-foreground/10">
                {prices.map((p, i) => (
                  <div key={i} className="px-5 py-4 font-ibm-plex text-xs space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold uppercase">{p.type}</span>
                      {p.type === "usage" && (
                        <span className="text-muted-foreground">
                          {p.billing_model?.replace("_", " ")} · {p.event_type} · {p.usage_calculation?.replace(/_/g, " ")}
                        </span>
                      )}
                      {p.type === "fixed" && (
                        <span className="text-muted-foreground">
                          {p.amount} {p.asset_code}/{p.recurring_interval}
                        </span>
                      )}
                    </div>
                    {p.type === "usage" && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 pl-3 text-muted-foreground text-[11px]">
                        {p.unit_price !== undefined && <div>unit_price: <span className="text-foreground">{p.unit_price}</span></div>}
                        {p.volume_rate !== undefined && <div>volume_rate: <span className="text-foreground">{p.volume_rate}</span></div>}
                        {p.volume_field && <div>volume_field: <span className="text-foreground">{p.volume_field}</span></div>}
                        <div>asset: <span className="text-foreground">{p.asset_code}</span></div>
                      </div>
                    )}
                    {p.dimensions && p.dimensions.length > 0 && (
                      <div className="pl-3">
                        <div className="mb-1.5 text-[11px] text-muted-foreground">dimensions: [{p.dimensions.join(", ")}]</div>
                        {p.tiers && p.tiers.length > 0 && (
                          <div className="border border-dashed border-foreground/10">
                            <table className="w-full text-[11px]">
                              <thead>
                                <tr className="border-b border-dashed border-foreground/15">
                                  {p.dimensions.map((d) => (
                                    <th key={d} className="px-3 py-1.5 text-left font-space text-[10px] uppercase text-muted-foreground">{d}</th>
                                  ))}
                                  <th className="px-3 py-1.5 text-left font-space text-[10px] uppercase text-muted-foreground">Rate</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.tiers.map((t, j) => (
                                  <tr key={j} className="border-b border-dashed border-foreground/5 last:border-0">
                                    {p.dimensions!.map((d) => (
                                      <td key={d} className="px-3 py-1.5">{t.dimensions?.[d] || "—"}</td>
                                    ))}
                                    <td className="px-3 py-1.5">{t.unit_price}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                    {p.tiers && p.tiers.length > 0 && !p.dimensions?.length && (
                      <div className="pl-3 text-[11px] text-muted-foreground">
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
            </div>
          )}

          {/* Entitlements detail */}
          {entitlements.length > 0 && (
            <div className="border border-dashed border-foreground/15">
              <div className="border-b border-dashed border-foreground/15 px-5 py-3 font-space text-xs uppercase tracking-widest text-muted-foreground">
                ┌─ Entitlements ─┐
              </div>
              <div className="px-5 py-4 font-ibm-plex text-xs space-y-2">
                {entitlements.map((e, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="font-bold">{e.amount} {e.asset_code}</span>
                    <span className="text-muted-foreground">refresh: {e.refresh_strategy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {prices.length === 0 && (
            <p className="font-ibm-plex text-xs text-terminal-yellow">
              ⚠ No prices configured. You can add them later on the product detail page.
            </p>
          )}
        </div>
      )}

            {/* ── Navigation ── */}
            <div className="mt-8 flex items-center justify-between border-t border-foreground/[0.08] pt-5">
              <div>
                {stepIndex > 0 && (
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 font-space text-xs uppercase tracking-wide text-muted-foreground transition-all duration-150 hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className={btnOutlineCls}>
                  Cancel
                </button>
                {step !== "review" ? (
                  <button
                    onClick={goNext}
                    disabled={!canNext()}
                    className={`flex items-center gap-1.5 ${btnPrimaryCls} disabled:opacity-30`}
                  >
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button onClick={handleCreate} className={`flex items-center gap-1.5 ${btnPrimaryCls}`}>
                    <Check className="h-3.5 w-3.5" /> Create Product
                  </button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
