import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

interface Recipe {
  id: string;
  number: string;
  name: string;
  pricingModel: "realtime" | "fixed" | "hybrid";
  defaultName: string;
  defaultCode: string;
  description: string;
  solves: string;
  worksFor: string[];
  risk: string;
  creates: { products: number; prices: number };
  billing: string;
  asset: string;
  prices: Partial<Price>[];
}

const RECIPES: Recipe[] = [
  {
    id: "payg",
    number: "#01",
    name: "PAY-AS-YOU-GO",
    pricingModel: "realtime",
    defaultName: "Pay-As-You-Go",
    defaultCode: "pay-as-you-go",
    description: "API usage billed from prepaid wallet",
    solves: "Real-time deduction without invoice complexity",
    worksFor: ["LLM APIs", "image tools", "video generation"],
    risk: "Low Risk",
    creates: { products: 1, prices: 1 },
    billing: "real_time",
    asset: "USD",
    prices: [
      {
        id: `price_recipe_payg_1`,
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
    id: "sub-usage",
    number: "#02",
    name: "SUBSCRIPTION + USAGE",
    pricingModel: "hybrid",
    defaultName: "Subscription + Usage",
    defaultCode: "subscription-usage",
    description: "Monthly fee with included credit bundle",
    solves: "Predictable base revenue with usage upside",
    worksFor: ["SaaS with API", "Cursor-style products"],
    risk: "Low Risk",
    creates: { products: 1, prices: 2 },
    billing: "real_time + recurring",
    asset: "USD",
    prices: [
      {
        id: `price_recipe_sub_1`,
        type: "fixed",
        billing_model: "recurring",
        amount: 29,
        recurring_interval: "monthly",
        asset_code: "USD",
        entitlements: [],
      },
      {
        id: `price_recipe_sub_2`,
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
    id: "flat",
    number: "#03",
    name: "FLAT RECURRING",
    pricingModel: "fixed",
    defaultName: "Flat Recurring",
    defaultCode: "flat-recurring",
    description: "Fixed monthly or annual fee, no metering",
    solves: "Simple subscription without usage tracking",
    worksFor: ["Early-stage SaaS", "enterprise contracts"],
    risk: "Low Risk",
    creates: { products: 1, prices: 1 },
    billing: "recurring",
    asset: "USD",
    prices: [
      {
        id: `price_recipe_flat_1`,
        type: "fixed",
        billing_model: "recurring",
        amount: 29,
        recurring_interval: "monthly",
        asset_code: "USD",
        entitlements: [],
      },
    ],
  },
];

export function RecipePath({ onClose, onBack, onUseRecipe }: RecipePathProps) {
  const [selected, setSelected] = useState<string>("sub-usage");

  const selectedRecipe = RECIPES.find((r) => r.id === selected)!;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 gap-0 border-dotted border-white/10 bg-[#0F0F0F]">
        <DialogHeader className="px-8 pt-8 pb-0">
          <DialogTitle className="font-space text-xs uppercase tracking-widest text-white/50">
            ┌─ PRICING RECIPES ────────────────────────┐
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-white/40 mt-1">
            Pre-built patterns for common billing models
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 pb-8 pt-4">
          <button
            onClick={onBack}
            className="font-mono text-xs text-white/30 hover:text-white/60 cursor-pointer mb-4"
          >
            ← back
          </button>

          <div className="space-y-3">
            {RECIPES.map((recipe) => {
              const isSelected = selected === recipe.id;
              return (
                <button
                  key={recipe.id}
                  onClick={() => setSelected(recipe.id)}
                  className={`w-full text-left p-5 transition-all ${
                    isSelected
                      ? "border border-dotted border-green-400/40 bg-green-400/[0.02]"
                      : "border border-dotted border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="flex justify-between gap-6">
                    {/* Left column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 relative">
                        <span className="text-xs text-white/20 font-mono">{recipe.number}</span>
                        <span className="font-mono text-base font-bold">{recipe.name}</span>
                        <span className="border border-dotted border-green-400/30 text-green-400/70 text-xs px-2 py-0.5 font-mono">{recipe.risk}</span>
                        {isSelected && (
                          <span className="absolute right-0 top-0 text-green-400 font-bold text-sm font-mono">✓</span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-white/50 mt-1 ml-9">{recipe.description}</p>
                      <p className="font-mono text-xs text-white/30 mt-1 ml-9 italic">
                        <span className="text-white/20 not-italic">Solves:</span> {recipe.solves}
                      </p>
                      <div className="flex gap-2 mt-3 ml-9">
                        {recipe.worksFor.map((tag) => (
                          <span key={tag} className="bg-white/5 px-2 py-0.5 text-xs font-mono text-white/40">{tag}</span>
                        ))}
                      </div>
                    </div>

                    {/* Right column — "what you get" summary */}
                    <div className="bg-white/[0.03] border border-dotted border-white/8 p-3 w-48 shrink-0">
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-white/20 uppercase font-mono mb-1">Creates</div>
                          <div className="text-xs font-mono text-white/60">{recipe.creates.products} product</div>
                          <div className="text-xs font-mono text-white/60">{recipe.creates.prices} price{recipe.creates.prices > 1 ? "s" : ""}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/20 uppercase font-mono mb-1">Billing</div>
                          <div className="text-xs font-mono text-white/60">{recipe.billing}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/20 uppercase font-mono mb-1">Asset</div>
                          <div className="text-xs font-mono text-white/60">{recipe.asset}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-dotted border-white/10 pt-6 mt-6 flex justify-between items-center">
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
      </DialogContent>
    </Dialog>
  );
}
