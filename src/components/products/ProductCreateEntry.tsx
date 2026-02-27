import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AIProductPath } from "./AIProductPath";
import { RecipePath } from "./RecipePath";
import { CreateProductWizard } from "./CreateProductWizard";
import type { Price } from "@/data/types";

type Path = "select" | "ai" | "recipes" | "manual";

interface ProductCreateEntryProps {
  onClose: () => void;
}

interface PrefilledData {
  name?: string;
  code?: string;
  pricingModel?: "realtime" | "fixed" | "hybrid";
  recipeBanner?: string;
  prices?: Partial<Price>[];
}

export function ProductCreateEntry({ onClose }: ProductCreateEntryProps) {
  const [path, setPath] = useState<Path>("select");
  const [prefilled, setPrefilled] = useState<PrefilledData | null>(null);

  const goBack = () => {
    setPrefilled(null);
    setPath("select");
  };

  if (path === "manual") {
    return (
      <CreateProductWizard
        onClose={onClose}
        onBack={goBack}
        prefilled={prefilled ?? undefined}
      />
    );
  }

  if (path === "ai") {
    return (
      <AIProductPath
        onClose={onClose}
        onBack={goBack}
        onManualEdit={(data) => {
          setPrefilled(data);
          setPath("manual");
        }}
        onCreateDirect={onClose}
      />
    );
  }

  if (path === "recipes") {
    return (
      <RecipePath
        onClose={onClose}
        onBack={goBack}
        onUseRecipe={(data) => {
          setPrefilled(data);
          setPath("manual");
        }}
      />
    );
  }

  // Path selector — vertical stack
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 gap-0 border-dotted border-white/10 bg-card">
        <DialogHeader className="px-8 pt-8 pb-0">
          <DialogTitle className="font-space text-xs uppercase tracking-widest text-white/50">
            ┌─ CREATE PRODUCT ─────────────────────────┐
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-white/40 mt-1">
            Choose how you want to configure pricing
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 pb-8 pt-6">
          <div className="space-y-3">
            {/* AI Assistant */}
            <button
              onClick={() => setPath("ai")}
              className="flex items-center justify-between w-full border border-dotted border-white/15 p-5 cursor-pointer hover:border-white/30 hover:bg-white/[0.02] transition-all text-left"
            >
              <div className="flex items-center">
                <span className="text-lg mr-3">⚡</span>
                <div>
                  <span className="font-mono text-sm font-bold">AI ASSISTANT</span>
                  <span className="font-mono text-xs text-white/40 ml-3">Describe what you want · we'll configure it</span>
                </div>
              </div>
              <span className="border border-dotted border-teal-400/40 text-teal-400 text-xs px-2 py-0.5 font-mono shrink-0">AI</span>
            </button>

            {/* Recipes */}
            <button
              onClick={() => setPath("recipes")}
              className="flex items-center justify-between w-full border border-dotted border-white/15 p-5 cursor-pointer hover:border-white/30 hover:bg-white/[0.02] transition-all text-left"
            >
              <div className="flex items-center">
                <span className="text-lg mr-3">◈</span>
                <div>
                  <span className="font-mono text-sm font-bold">RECIPES</span>
                  <span className="font-mono text-xs text-white/40 ml-3">Pick a pre-built pattern and customize it</span>
                </div>
              </div>
              <span className="border border-dotted border-green-400/40 text-green-400 text-xs px-2 py-0.5 font-mono shrink-0">RECOMMENDED</span>
            </button>

            {/* Manual */}
            <button
              onClick={() => setPath("manual")}
              className="flex items-center justify-between w-full border border-dotted border-white/15 p-5 cursor-pointer hover:border-white/30 hover:bg-white/[0.02] transition-all text-left"
            >
              <div className="flex items-center">
                <span className="text-lg mr-3">⌘</span>
                <div>
                  <span className="font-mono text-sm font-bold">MANUAL</span>
                  <span className="font-mono text-xs text-white/40 ml-3">Configure every field yourself with full control</span>
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-dotted border-white/10 pt-6 mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="border border-dotted border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
