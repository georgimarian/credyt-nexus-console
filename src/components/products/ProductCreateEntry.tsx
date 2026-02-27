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

type Path = "select" | "ai" | "recipes" | "manual";

interface ProductCreateEntryProps {
  onClose: () => void;
}

interface PrefilledData {
  name?: string;
  code?: string;
  pricingModel?: "realtime" | "fixed" | "hybrid";
  recipeBanner?: string;
}

export function ProductCreateEntry({ onClose }: ProductCreateEntryProps) {
  const [path, setPath] = useState<Path>("select");
  const [prefilled, setPrefilled] = useState<PrefilledData | null>(null);

  if (path === "manual") {
    return (
      <CreateProductWizard
        onClose={onClose}
        prefilled={prefilled ?? undefined}
      />
    );
  }

  if (path === "ai") {
    return (
      <AIProductPath
        onClose={onClose}
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
        onUseRecipe={(data) => {
          setPrefilled(data);
          setPath("manual");
        }}
      />
    );
  }

  // Path selector
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 gap-0 border-dotted border-white/10 bg-[#0F0F0F]">
        <DialogHeader className="px-8 pt-8 pb-0">
          <DialogTitle className="font-space text-xs uppercase tracking-widest text-white/50">
            ┌─ CREATE PRODUCT ─────────────────────────┐
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-white/40 mt-1">
            Choose how you want to configure pricing
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 pb-8 pt-6">
          <div className="grid grid-cols-3 gap-4">
            {/* AI Assistant */}
            <button
              onClick={() => setPath("ai")}
              className="border border-dotted border-white/15 p-5 text-left hover:border-white/30 hover:bg-white/[0.02] transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg">⚡</span>
                <span className="border border-dotted border-teal-400/40 text-teal-400 text-xs px-2 py-0.5 font-mono">AI</span>
              </div>
              <div className="font-space text-sm font-bold uppercase tracking-wide mb-2">AI Assistant</div>
              <p className="font-mono text-xs text-white/50 leading-relaxed mb-3">
                Describe what you want to charge for and we'll configure it for you.
              </p>
              <div className="space-y-1">
                <div className="font-mono text-xs text-white/30">"Bill like OpenAI"</div>
                <div className="font-mono text-xs text-white/30">"Charge per video generated"</div>
                <div className="font-mono text-xs text-white/30">"SaaS with included credits"</div>
              </div>
            </button>

            {/* Recipes */}
            <button
              onClick={() => setPath("recipes")}
              className="border border-dotted border-white/15 p-5 text-left hover:border-white/30 hover:bg-white/[0.02] transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg">◈</span>
                <span className="border border-dotted border-green-400/40 text-green-400 text-xs px-2 py-0.5 font-mono">RECOMMENDED</span>
              </div>
              <div className="font-space text-sm font-bold uppercase tracking-wide mb-2">Recipes</div>
              <p className="font-mono text-xs text-white/50 leading-relaxed mb-3">
                Pick a pre-built pricing pattern and customize it.
              </p>
              <div className="font-mono text-xs text-white/30">3 recipes available</div>
            </button>

            {/* Manual */}
            <button
              onClick={() => setPath("manual")}
              className="border border-dotted border-white/15 p-5 text-left hover:border-white/30 hover:bg-white/[0.02] transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg">⌘</span>
              </div>
              <div className="font-space text-sm font-bold uppercase tracking-wide mb-2">Manual</div>
              <p className="font-mono text-xs text-white/50 leading-relaxed mb-3">
                Configure every field yourself with full control.
              </p>
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
