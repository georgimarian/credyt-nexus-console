import { useState } from "react";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { assets } from "@/data/assets";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";

export default function Assets() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [quoteInput, setQuoteInput] = useState("10");
  const [quoteAsset, setQuoteAsset] = useState("CREDITS");

  const creditsAsset = assets.find((a) => a.code === "CREDITS");
  const currentRate = creditsAsset?.rates[creditsAsset.rates.length - 1]?.rate || 100;
  const quoteResult = parseFloat(quoteInput || "0") * currentRate;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-space text-2xl font-bold uppercase tracking-wide">$ assets</h1>
          <p className="font-ibm-plex text-sm text-muted-foreground">{assets.length} assets configured</p>
        </div>
        <button className="flex items-center gap-2 border border-dashed border-foreground/30 bg-foreground px-4 py-2 font-space text-xs uppercase tracking-wide text-background transition-colors hover:bg-muted-foreground">
          <Plus className="h-3.5 w-3.5" />
          New Asset
        </button>
      </div>

      <TerminalCard title="ASSET LIST">
        <div className="space-y-0">
          {assets.map((asset) => (
            <div key={asset.id}>
              <button
                onClick={() => setExpandedId(expandedId === asset.id ? null : asset.id)}
                className="flex w-full items-center gap-4 border-b border-dashed border-foreground/10 py-3 font-ibm-plex text-sm text-left transition-colors hover:bg-accent/50"
              >
                {expandedId === asset.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <span className="font-bold">{asset.code}</span>
                <span className="text-muted-foreground">{asset.name}</span>
                <StatusBadge status={asset.type === "fiat" ? "active" : "draft"} />
                <span className="text-xs text-muted-foreground">scale: {asset.scale}</span>
                {asset.symbol && <span className="ml-auto text-muted-foreground">{asset.symbol}</span>}
              </button>

              {expandedId === asset.id && (
                <div className="border-b border-dashed border-foreground/10 bg-muted/30 p-4">
                  {asset.rates.length > 0 ? (
                    <div>
                      <div className="mb-2 font-space text-xs uppercase text-muted-foreground">Exchange Rates</div>
                      <table className="w-full font-ibm-plex text-xs">
                        <thead>
                          <tr className="border-b border-dashed border-foreground/20">
                            <th className="px-2 py-1 text-left text-muted-foreground">From</th>
                            <th className="px-2 py-1 text-left text-muted-foreground">To</th>
                            <th className="px-2 py-1 text-left text-muted-foreground">Rate</th>
                            <th className="px-2 py-1 text-left text-muted-foreground">Effective</th>
                          </tr>
                        </thead>
                        <tbody>
                          {asset.rates.map((rate, i) => (
                            <tr key={i} className="border-b border-dashed border-foreground/10">
                              <td className="px-2 py-1">{rate.from_asset}</td>
                              <td className="px-2 py-1">{rate.to_asset}</td>
                              <td className="px-2 py-1 font-bold">{rate.rate}</td>
                              <td className="px-2 py-1 text-muted-foreground">{new Date(rate.effective_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="font-ibm-plex text-xs text-muted-foreground">base fiat asset — no exchange rates</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </TerminalCard>

      {/* Quote Calculator */}
      <TerminalCard title="QUOTE CALCULATOR">
        <div className="flex flex-wrap items-end gap-4 font-ibm-plex text-sm">
          <div>
            <label className="mb-1 block text-xs uppercase text-muted-foreground">USD Amount</label>
            <input
              type="number"
              value={quoteInput}
              onChange={(e) => setQuoteInput(e.target.value)}
              className="w-32 border border-dashed border-foreground/30 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>
          <div className="py-2 text-muted-foreground">→</div>
          <div>
            <label className="mb-1 block text-xs uppercase text-muted-foreground">{quoteAsset}</label>
            <div className="w-32 border border-dashed border-foreground/15 bg-muted/50 px-3 py-2 font-bold">
              {quoteResult.toFixed(0)}
            </div>
          </div>
          <div className="py-2 text-xs text-muted-foreground">
            rate: 1 USD = {currentRate} {quoteAsset}
          </div>
        </div>
      </TerminalCard>
    </div>
  );
}
