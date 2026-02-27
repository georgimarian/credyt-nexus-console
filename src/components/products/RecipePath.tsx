import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Price } from "@/data/types";

interface RecipePathProps {
  onClose: () => void;
  onBack: () => void;
  onUseRecipe: (data: {
    name?: string;
    code?: string;
    pricingModel?: "realtime" | "fixed" | "hybrid";
    recipeBanner?: string;
    prices?: Partial<Price>[];
  }) => void;
}

type Category = "all" | "subscription" | "usage" | "hybrid";

interface Recipe {
  id: string;
  number: string;
  name: string;
  category: Category;
  pricingModel: "realtime" | "fixed" | "hybrid";
  defaultName: string;
  defaultCode: string;
  description: string;
  useCase: string;
  workflows: string[];
  benefit: string;
  badge?: string;
  prices: Partial<Price>[];
}

const RECIPES: Recipe[] = [
  {
    id: "simple-saas",
    number: "#01",
    name: "Simple SaaS Subscription",
    category: "subscription",
    pricingModel: "fixed",
    defaultName: "SaaS Subscription",
    defaultCode: "saas-subscription",
    description: "Straightforward monthly/annual subscriptions without complexity",
    useCase: "Early-stage SaaS, billing-first teams",
    workflows: ["Recurring Fee", "Payment Capture", "Invoice"],
    benefit: "Straightforward monthly/annual subscriptions without complexity",
    badge: "Recommended for SaaS",
    prices: [
      {
        id: "price_recipe_saas_1",
        type: "fixed",
        billing_model: "recurring",
        amount: 29,
        recurring_interval: "monthly",
        asset_code: "USD",
        entitlements: [],
      },
    ],
  },
  {
    id: "sub-usage",
    number: "#02",
    name: "Subscription + Included Usage",
    category: "subscription",
    pricingModel: "hybrid",
    defaultName: "Subscription + Usage",
    defaultCode: "subscription-usage",
    description: "Monthly fee with included credit bundle",
    useCase: "API + SaaS hybrids",
    workflows: ["Recurring Fee", "Entitlement Grant", "Usage Debit", "Soft Limits"],
    benefit: "Bundled allowances without proration complexity",
    badge: "Recommended for SaaS",
    prices: [
      {
        id: "price_recipe_sub_1",
        type: "fixed",
        billing_model: "recurring",
        amount: 29,
        recurring_interval: "monthly",
        asset_code: "USD",
        entitlements: [],
      },
      {
        id: "price_recipe_sub_2",
        type: "usage",
        billing_model: "real_time",
        event_type: "api_call",
        usage_calculation: "volume",
        volume_field: "total_tokens",
        unit_price: 0.00003,
        asset_code: "USD",
        entitlements: [],
      },
    ],
  },
  {
    id: "prepaid-credits",
    number: "#03",
    name: "Prepaid Credits Starter",
    category: "usage",
    pricingModel: "realtime",
    defaultName: "Prepaid Credits",
    defaultCode: "prepaid-credits",
    description: "Monetization before pricing clarity exists",
    useCase: "AI startups, vibe coders",
    workflows: ["Credit Grant", "Usage Debit", "Hard Stop"],
    benefit: "Monetization before pricing clarity exists",
    prices: [
      {
        id: "price_recipe_prepaid_1",
        type: "usage",
        billing_model: "real_time",
        event_type: "chat_completion",
        usage_calculation: "volume",
        volume_field: "total_tokens",
        unit_price: 0.00003,
        asset_code: "USD",
        entitlements: [],
      },
    ],
  },
  {
    id: "auto-topup",
    number: "#04",
    name: "Auto-Topup Credits",
    category: "usage",
    pricingModel: "realtime",
    defaultName: "Auto-Topup Credits",
    defaultCode: "auto-topup-credits",
    description: "Prevents service interruption while controlling spend",
    useCase: "Usage-heavy products",
    workflows: ["Balance Threshold", "Auto-Topup", "Payment Capture"],
    benefit: "Prevents service interruption while controlling spend",
    prices: [
      {
        id: "price_recipe_topup_1",
        type: "usage",
        billing_model: "real_time",
        event_type: "api_call",
        usage_calculation: "unit",
        unit_price: 0.002,
        asset_code: "USD",
        entitlements: [],
      },
    ],
  },
  {
    id: "payg-api",
    number: "#05",
    name: "Pay-As-You-Go API",
    category: "hybrid",
    pricingModel: "realtime",
    defaultName: "Pay-As-You-Go",
    defaultCode: "pay-as-you-go",
    description: "Real-time deduction without invoice complexity",
    useCase: "LLM APIs, inference tools",
    workflows: ["Usage Debit", "Real-Time", "Wallet"],
    benefit: "Real-time deduction without invoice complexity",
    prices: [
      {
        id: "price_recipe_payg_1",
        type: "usage",
        billing_model: "real_time",
        event_type: "chat_completion",
        usage_calculation: "volume",
        volume_field: "total_tokens",
        unit_price: 0.00003,
        asset_code: "USD",
        entitlements: [],
      },
    ],
  },
];

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all", label: "ALL RECIPES" },
  { key: "subscription", label: "I. SUBSCRIPTION" },
  { key: "usage", label: "II. USAGE" },
  { key: "hybrid", label: "III. HYBRID" },
];

const SECTIONS: { category: Category; numeral: string; title: string; subtitle: string }[] = [
  { category: "subscription", numeral: "I", title: "SUBSCRIPTION & SAAS", subtitle: "Billing-first teams" },
  { category: "usage", numeral: "II", title: "USAGE & CREDIT-BASED", subtitle: "Prepaid & postpaid" },
  { category: "hybrid", numeral: "III", title: "HYBRID", subtitle: "Subscription + usage overage" },
];

export function RecipePath({ onClose, onBack, onUseRecipe }: RecipePathProps) {
  const [selected, setSelected] = useState<string>("sub-usage");
  const [filter, setFilter] = useState<Category>("all");

  const selectedRecipe = RECIPES.find((r) => r.id === selected)!;

  const filteredSections = SECTIONS.filter(
    (s) => filter === "all" || s.category === filter
  );

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 gap-0 border-dotted border-white/10 bg-card">
        <DialogHeader className="px-8 pt-8 pb-0">
          <DialogTitle className="font-space text-xs uppercase tracking-widest text-white/50">
            ┌─ PRICING RECIPES ────────────────────────┐
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-white/40 mt-1">
            Pre-built patterns for common billing models
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          <div className="px-8 pb-8 pt-4">
            <button
              onClick={onBack}
              className="font-mono text-xs text-white/30 hover:text-white/60 cursor-pointer mb-4"
            >
              ← back
            </button>

            {/* Filter chips */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setFilter(cat.key)}
                  className={
                    filter === cat.key
                      ? "bg-white text-black text-xs px-3 py-1 font-mono"
                      : "border border-dotted border-white/20 text-white/40 text-xs px-3 py-1 font-mono hover:border-white/40 hover:text-white/60"
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Category sections */}
            {filteredSections.map((section) => {
              const sectionRecipes = RECIPES.filter((r) => r.category === section.category);
              return (
                <div key={section.category} className="mb-6">
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-white/5 text-white/40 text-xs px-2 py-0.5 font-mono">{section.numeral}</span>
                    <span className="text-sm font-bold font-mono text-white">{section.title}</span>
                    <span className="text-xs text-white/30 font-mono">— {section.subtitle}</span>
                  </div>

                  {/* Cards grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {sectionRecipes.map((recipe) => {
                      const isSelected = selected === recipe.id;
                      return (
                        <button
                          key={recipe.id}
                          onClick={() => setSelected(recipe.id)}
                          className={`text-left p-4 cursor-pointer transition-all relative ${
                            isSelected
                              ? "border border-dotted border-teal-400/50 bg-teal-400/[0.03] border-l-2 border-l-teal-400 pl-3"
                              : "border border-dotted border-white/10 hover:border-white/25 border-l-2 border-l-white/20 pl-3"
                          }`}
                        >
                          {/* Number */}
                          <div className="text-xs text-white/20 font-mono mb-1">{recipe.number}</div>

                          {/* Name + badge */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold font-mono text-sm text-white">{recipe.name}</span>
                            <span className="text-green-400 text-xs font-mono shrink-0">● Simple</span>
                          </div>

                          {/* Use case */}
                          <div className="text-xs text-white/30 font-mono mt-1">
                            <span className="text-white/20">Use case:</span> {recipe.useCase}
                          </div>

                          {/* Workflow chips */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {recipe.workflows.map((w) => (
                              <span key={w} className="bg-white/5 text-white/40 text-xs px-2 py-0.5 font-mono">{w}</span>
                            ))}
                          </div>

                          {/* Benefit */}
                          <div className="text-xs text-white/40 font-mono mt-2">
                            <span className="text-green-400 mr-1">✓</span>{recipe.benefit}
                          </div>

                          {/* Badge */}
                          {recipe.badge && (
                            <div className="absolute top-3 right-3">
                              <span className="border border-dotted border-teal-400/30 text-teal-400/60 text-xs px-2 font-mono">
                                {recipe.badge}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Bottom insight */}
            <div className="border-t border-dotted border-white/10 pt-4 mt-4 text-xs text-white/30 font-mono">
              Recipes provide structure. Start with confidence and iterate toward your perfect monetization model.
            </div>

            {/* Footer */}
            <div className="border-t border-dotted border-white/10 pt-6 mt-4 flex justify-between items-center">
              <button
                onClick={onClose}
                className="border border-dotted border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  onUseRecipe({
                    name: selectedRecipe.defaultName,
                    code: selectedRecipe.defaultCode,
                    pricingModel: selectedRecipe.pricingModel,
                    recipeBanner: `◈ Pre-filled from recipe: ${selectedRecipe.name} — review and adjust before activating`,
                    prices: selectedRecipe.prices,
                  })
                }
                className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90"
              >
                Use This Recipe →
              </button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
