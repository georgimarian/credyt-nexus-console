import { useState } from "react";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { FieldLabel } from "@/components/terminal/FieldLabel";
import { assets } from "@/data/assets";

export default function Assets() {
  const [quoteInput, setQuoteInput] = useState("10");
  const [quoteAsset] = useState("CREDITS");

  const creditsAsset = assets.find((a) => a.code === "CREDITS");
  const currentRate = creditsAsset?.rates[creditsAsset.rates.length - 1]?.rate || 100;
  const quoteResult = parseFloat(quoteInput || "0") * currentRate;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="font-space text-2xl font-bold uppercase tracking-wider">Asset Registry</h1>
        <button className="rounded-none border border-terminal-teal px-4 py-2.5 font-space text-xs uppercase tracking-wide text-terminal-teal transition-all duration-150 hover:bg-terminal-teal hover:text-background">
          + New Asset
        </button>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {assets.map((asset) => {
          const isFiat = asset.type === "fiat";
          const icon = isFiat ? "$" : "★";
          const typeBadgeColor = isFiat
            ? "border-terminal-green text-terminal-green"
            : "border-terminal-yellow text-terminal-yellow";

          return (
            <div
              key={asset.id}
              className="border border-foreground/10 bg-[hsl(185_30%_6%)] p-8 dark:bg-[hsl(185_30%_6%)] light:bg-[hsl(185_10%_96%)]"
              style={{ background: "hsl(185, 30%, 6%)" }}
            >
              {/* Top section */}
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl text-terminal-teal">{icon}</span>
                  <span className="font-space text-2xl font-bold">{asset.code}</span>
                </div>
                <span className={`rounded-none border px-2 py-0.5 font-space text-[10px] uppercase tracking-widest ${typeBadgeColor}`}>
                  {asset.type}
                </span>
              </div>
              <div className="font-ibm-plex text-sm text-muted-foreground mb-6">{asset.name}</div>

              {/* Middle section */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="font-space text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Label</div>
                  <div className="font-ibm-plex text-sm">{asset.symbol || "—"}</div>
                </div>
                <div>
                  <div className="font-space text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Precision</div>
                  <div className="font-ibm-plex text-sm">{asset.scale} decimals</div>
                </div>
              </div>

              {/* Exchange rates section */}
              {asset.rates.length > 0 && (
                <>
                  <div className="border-t border-foreground/10 my-6" />
                  <div className="font-space text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Exchange Rates</div>
                  {asset.rates.slice(-1).map((rate, i) => {
                    const perUnit = rate.rate > 0 ? (1 / rate.rate).toFixed(4) : "0";
                    return (
                      <div key={i} className="mb-3">
                        <div className="font-ibm-plex text-sm">
                          <span className="text-muted-foreground">1 </span>
                          <span className="font-bold text-terminal-teal">{rate.from_asset}</span>
                          <span className="text-muted-foreground"> = </span>
                          <span className="font-bold text-terminal-teal">{rate.rate} {rate.to_asset}</span>
                        </div>
                        <div className="font-ibm-plex text-xs text-muted-foreground mt-0.5">
                          (${perUnit} per {rate.to_asset})
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-4 bg-foreground/5 p-4 font-ibm-plex text-sm text-muted-foreground">
                    Customers top up in {asset.rates[0]?.from_asset} → receive {asset.code} at configured rate. Used in product pricing as a billing unit.
                  </div>
                </>
              )}

              {/* No rates — fiat base */}
              {asset.rates.length === 0 && (
                <>
                  <div className="border-t border-foreground/10 my-6" />
                  <div className="bg-foreground/5 p-4 font-ibm-plex text-sm text-muted-foreground">
                    Base fiat asset — used as the settlement currency for customer wallets and billing.
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Quote Calculator */}
      <TerminalCard title="QUOTE CALCULATOR">
        <div className="flex flex-wrap items-end gap-6 font-ibm-plex text-sm">
          <div>
            <FieldLabel label="USD Amount" tooltip="Enter a USD amount to convert to credits at the current exchange rate." />
            <input
              type="number"
              value={quoteInput}
              onChange={(e) => setQuoteInput(e.target.value)}
              className="w-36 rounded-none border border-foreground/[0.12] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-terminal-teal"
            />
          </div>
          <div className="py-2 text-lg text-muted-foreground">→</div>
          <div>
            <FieldLabel label={quoteAsset} />
            <div className="w-36 rounded-none border border-foreground/[0.06] bg-muted/30 px-3 py-2 font-bold text-terminal-teal">
              {quoteResult.toFixed(0)}
            </div>
          </div>
          <div className="py-2 font-ibm-plex text-xs text-muted-foreground">
            Rate: 1 USD = {currentRate} {quoteAsset}
          </div>
        </div>
      </TerminalCard>
    </div>
  );
}
