import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface RecipePathProps {
  onClose: () => void;
  onUseRecipe: (data: {
    name?: string;
    code?: string;
    pricingModel?: "realtime" | "fixed" | "hybrid";
    recipeBanner?: string;
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
  creates: string;
  prices: string;
  configurable: string;
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
    creates: "1 product · 1 usage price",
    prices: "1 price · volume-based",
    configurable: "event_type · unit_price · volume_field",
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
    creates: "1 product · 2 prices (fixed + usage)",
    prices: "2 prices · fixed + volume",
    configurable: "event_type · unit_price · volume_field",
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
    creates: "1 product · 1 fixed price",
    prices: "1 price · recurring",
    configurable: "amount · interval",
  },
];

export function RecipePath({ onClose, onUseRecipe }: RecipePathProps) {
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
            onClick={onClose}
            className="font-mono text-xs text-white/30 hover:text-white/60 cursor-pointer mb-4"
          >
            ← back
          </button>

          <div className="space-y-3">
            {RECIPES.map((recipe) => {
              const isSelected = selected === recipe.id;
              return (
                <div key={recipe.id}>
                  <button
                    onClick={() => setSelected(recipe.id)}
                    className={`w-full text-left p-5 transition-all ${
                      isSelected
                        ? "border border-dotted border-green-400/40 bg-green-400/[0.03]"
                        : "border border-dotted border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs text-white/20 font-mono">{recipe.number}</span>
                          <span className="font-mono text-sm font-bold">{recipe.name}</span>
                          <span className="border border-dotted border-white/20 text-white/30 text-xs px-2 py-0.5 font-mono">{recipe.risk}</span>
                        </div>
                        <p className="font-mono text-xs text-white/50 mt-1 ml-9">{recipe.description}</p>
                        <p className="font-mono text-xs text-white/30 mt-1 ml-9">
                          <span className="text-white/20">Solves:</span> {recipe.solves}
                        </p>
                        <div className="flex gap-2 mt-3 ml-9">
                          {recipe.worksFor.map((tag) => (
                            <span key={tag} className="bg-white/5 px-2 py-0.5 text-xs font-mono text-white/40">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <span className={`text-sm font-mono mt-1 ${isSelected ? "text-green-400 font-bold" : "text-white/20"}`}>
                        {isSelected ? "✓" : "○"}
                      </span>
                    </div>
                  </button>

                  {/* Detail panel */}
                  {isSelected && (
                    <div className="bg-white/[0.02] border border-dotted border-white/10 p-4 mt-2 ml-6 transition-all">
                      <div className="font-mono text-xs text-white/40 space-y-1">
                        <div className="text-white/50 font-bold mb-2">CREATES:</div>
                        <div>  {recipe.creates}</div>
                        <div className="mt-2 text-white/50 font-bold">CONFIGURABLE AFTER:</div>
                        <div>  {recipe.configurable}</div>
                      </div>
                    </div>
                  )}
                </div>
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
