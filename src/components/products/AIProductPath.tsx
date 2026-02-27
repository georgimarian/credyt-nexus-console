import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProductStore } from "@/stores/productStore";
import type { Product, Price } from "@/data/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AIProductPathProps {
  onClose: () => void;
  onBack: () => void;
  onManualEdit: (data: {
    name?: string;
    code?: string;
    pricingModel?: "realtime" | "fixed" | "hybrid";
    recipeBanner?: string;
  }) => void;
  onCreateDirect: () => void;
}

interface MockResponse {
  name: string;
  code: string;
  pricingModel: "realtime" | "fixed" | "hybrid";
  description: string;
  confidence: string;
  prices: {
    event_type?: string;
    calculation: string;
    volume_field?: string;
    unit_price?: number;
    amount?: number;
    billing_model: string;
    asset_code: string;
    entitlement?: string;
  }[];
}

const SUGGESTIONS = [
  "Bill like OpenAI — per token",
  "Charge $0.04 per image generated",
  "$29/month with 1000 included credits",
];

const MOCK_RESPONSES: Record<string, MockResponse> = {
  "Bill like OpenAI — per token": {
    name: "AI Usage Billing",
    code: "ai-usage-billing",
    pricingModel: "realtime",
    confidence: "BASED ON OPENAI GPT-4",
    description: "Based on OpenAI's GPT-4 pricing model. You can edit any field before saving.",
    prices: [
      {
        event_type: "chat_completion",
        calculation: "volume",
        volume_field: "total_tokens",
        unit_price: 0.00003,
        billing_model: "real_time",
        asset_code: "USD",
      },
    ],
  },
  "Charge $0.04 per image generated": {
    name: "Image Generation",
    code: "image-generation",
    pricingModel: "realtime",
    confidence: "BASED ON PER-EVENT BILLING",
    description: "Per-event billing for image generation. Each API call incurs a flat fee.",
    prices: [
      {
        event_type: "image_generation",
        calculation: "unit",
        unit_price: 0.04,
        billing_model: "real_time",
        asset_code: "USD",
      },
    ],
  },
  "$29/month with 1000 included credits": {
    name: "Pro Plan",
    code: "pro-plan",
    pricingModel: "hybrid",
    confidence: "BASED ON SAAS + CREDITS",
    description: "Monthly subscription with included credit bundle. Overage charged at usage rates.",
    prices: [
      {
        calculation: "fixed",
        amount: 29,
        billing_model: "recurring",
        asset_code: "USD",
        entitlement: "1000 CREDITS included · resets monthly",
      },
    ],
  },
};

export function AIProductPath({ onClose, onBack, onManualEdit, onCreateDirect }: AIProductPathProps) {
  const navigate = useNavigate();
  const { addProduct } = useProductStore();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<MockResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = (input: string) => {
    setIsGenerating(true);
    const key = Object.keys(MOCK_RESPONSES).find((k) =>
      input.toLowerCase().includes(k.toLowerCase().slice(0, 10))
    );
    setTimeout(() => {
      setResponse(MOCK_RESPONSES[key || SUGGESTIONS[0]]);
      setIsGenerating(false);
    }, 800);
  };

  const handleCreateDirect = () => {
    if (!response) return;
    const product: Product = {
      id: `prod_${Date.now()}`,
      code: response.code,
      name: response.name,
      status: "draft",
      created_at: new Date().toISOString(),
      prices: response.prices.map((p, i) => ({
        id: `price_ai_${Date.now()}_${i}`,
        type: (p.calculation === "fixed" ? "fixed" : "usage") as "fixed" | "usage",
        billing_model: p.billing_model as "real_time" | "recurring",
        event_type: p.event_type,
        usage_calculation: p.calculation === "fixed" ? undefined : (p.calculation as "unit" | "volume"),
        volume_field: p.volume_field,
        unit_price: p.unit_price,
        amount: p.amount,
        asset_code: p.asset_code,
        entitlements: [],
      })) as Price[],
      versions: [{ version: 1, status: "draft", created_at: new Date().toISOString() }],
      subscriber_count: 0,
    };
    addProduct(product);
    onCreateDirect();
    navigate(`/products/${product.id}`);
  };

  const billingModelLabel = (pm: string) =>
    pm === "realtime" ? "REAL-TIME USAGE" : pm === "fixed" ? "FIXED RECURRING" : "HYBRID";

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 gap-0 border-dotted border-white/10 bg-[#0F0F0F]">
        <DialogHeader className="px-8 pt-8 pb-0">
          <DialogTitle className="font-space text-xs uppercase tracking-widest text-white/50">
            ┌─ AI PRODUCT SETUP ───────────────────────┐
          </DialogTitle>
          <DialogDescription className="sr-only">AI-assisted product creation</DialogDescription>
        </DialogHeader>

        <div className="px-8 pb-8 pt-4">
          <button
            onClick={onBack}
            className="font-mono text-xs text-white/30 hover:text-white/60 cursor-pointer mb-4"
          >
            ← back
          </button>

          {/* Suggestion chips */}
          {!response && (
            <div className="flex flex-wrap gap-2 mb-4">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setPrompt(s); generate(s); }}
                  className="border border-dotted border-white/20 text-white/40 text-xs px-3 py-2 font-mono cursor-pointer hover:border-white/40 hover:text-white/70 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe how you want to bill your customers..."
            className="w-full bg-transparent border border-dotted border-white/20 p-4 font-mono text-sm text-white placeholder:text-white/20 resize-none rounded-none h-28 focus:outline-none focus:border-white/40"
          />

          {!response && (
            <button
              onClick={() => generate(prompt)}
              disabled={!prompt.trim() || isGenerating}
              className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide mt-3 hover:bg-white/90 disabled:opacity-40 disabled:pointer-events-none"
            >
              {isGenerating ? "Generating..." : "⚡ Generate Config →"}
            </button>
          )}

          {/* AI Response — beautified */}
          {response && (
            <div className="bg-white/[0.03] border border-dotted border-teal-400/20 p-5 mt-4">
              {/* Header row */}
              <div className="flex items-center justify-between mb-5">
                <div className="text-xs text-teal-400 font-mono uppercase">⚡ Suggested Configuration</div>
                <span className="border border-dotted border-teal-400/30 text-teal-400/60 text-xs px-2 py-0.5 font-mono">
                  {response.confidence}
                </span>
              </div>

              {/* Product block */}
              <div className="bg-white/[0.03] border border-dotted border-white/10 p-4 mb-3">
                <div className="text-xs text-white/30 uppercase font-mono mb-3">PRODUCT</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <div>
                    <div className="text-xs text-white/30 font-mono">NAME</div>
                    <div className="text-xs font-mono text-white">{response.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/30 font-mono">CODE</div>
                    <div className="text-xs font-mono text-white">{response.code}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/30 font-mono">BILLING MODEL</div>
                    <div className="text-xs font-mono text-white">{billingModelLabel(response.pricingModel)}</div>
                  </div>
                </div>
              </div>

              {/* Price blocks */}
              {response.prices.map((p, i) => (
                <div key={i} className="bg-white/[0.03] border border-dotted border-teal-400/20 p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-white/30 uppercase font-mono">PRICE #{i + 1}</div>
                    <span className="border border-dotted border-green-400/30 text-green-400/60 text-xs px-2 py-0.5 font-mono">
                      {p.billing_model}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {p.event_type && (
                      <div>
                        <div className="text-xs text-white/30 font-mono">EVENT TYPE</div>
                        <div className="text-xs font-mono text-white">{p.event_type}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-white/30 font-mono">CALCULATION</div>
                      <div className="text-xs font-mono text-white">{p.calculation}</div>
                    </div>
                    {p.volume_field && (
                      <div>
                        <div className="text-xs text-white/30 font-mono">VOLUME FIELD</div>
                        <div className="text-xs font-mono text-white">{p.volume_field}</div>
                      </div>
                    )}
                    {p.unit_price !== undefined && (
                      <div>
                        <div className="text-xs text-white/30 font-mono">UNIT PRICE</div>
                        <div className="text-sm font-mono text-green-400 font-bold">${p.unit_price} per {p.volume_field || "event"}</div>
                      </div>
                    )}
                    {p.amount !== undefined && (
                      <div>
                        <div className="text-xs text-white/30 font-mono">AMOUNT</div>
                        <div className="text-sm font-mono text-green-400 font-bold">${p.amount}/month</div>
                      </div>
                    )}
                    {p.entitlement && (
                      <div className="col-span-2">
                        <div className="text-xs text-white/30 font-mono">ENTITLEMENT</div>
                        <div className="text-xs font-mono text-white">{p.entitlement}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Insight line */}
              <div className="border-t border-dotted border-white/10 pt-3 mt-3 text-xs text-white/30 font-mono italic">
                {response.description}
              </div>

              {/* Action buttons */}
              <div className="flex justify-between mt-5">
                <button
                  onClick={() =>
                    onManualEdit({
                      name: response.name,
                      code: response.code,
                      pricingModel: response.pricingModel,
                      recipeBanner: `⚡ Pre-filled from AI: ${response.name} — review and adjust before activating`,
                    })
                  }
                  className="border border-dotted border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5"
                >
                  Edit Manually →
                </button>
                <button
                  onClick={handleCreateDirect}
                  className="bg-white text-black px-4 py-2 font-space text-xs uppercase tracking-wide hover:bg-white/90"
                >
                  Create Product →
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
