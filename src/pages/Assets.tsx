import { useState } from "react";
import { assets as initialAssets } from "@/data/assets";
import { CreateAssetModal } from "@/components/assets/CreateAssetModal";
import { AddExchangeRateModal } from "@/components/assets/AddExchangeRateModal";
import type { Asset, ExchangeRate } from "@/data/types";

export default function Assets() {
  const [assetList, setAssetList] = useState<Asset[]>(initialAssets);
  const [quoteInput, setQuoteInput] = useState("10");
  const [modalOpen, setModalOpen] = useState(false);
  const [rateModalAsset, setRateModalAsset] = useState<Asset | null>(null);

  const creditsAsset = assetList.find((a) => a.type === "custom");
  const currentRate = creditsAsset?.rates[creditsAsset.rates.length - 1]?.rate || 100;
  const quoteResult = parseFloat(quoteInput || "0") * currentRate;

  const handleRateAdded = (assetId: string, newRate: ExchangeRate) => {
    setAssetList((prev) =>
      prev.map((a) =>
        a.id === assetId ? { ...a, rates: [...a.rates, newRate] } : a
      )
    );
    setRateModalAsset(null);
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-space text-2xl font-bold uppercase tracking-wider">Assets</h1>
          <p className="font-ibm-plex text-sm text-white/40 mt-1">{assetList.length} assets configured</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5"
        >
          + New Asset
        </button>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {assetList.map((asset) => {
          const isFiat = asset.type === "fiat";
          const icon = isFiat ? "$" : "★";

          return (
            <div key={asset.id} className="border border-white/10 p-8" style={{ backgroundColor: "#0d1f24" }}>
              {/* Top */}
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl text-[#2DD4BF]">{icon}</span>
                  <span className="font-space text-2xl font-bold">{asset.code}</span>
                </div>
                <span className={`border px-2 py-0.5 font-space text-xs uppercase tracking-widest ${isFiat ? "border-[#4ADE80]/40 text-[#4ADE80]" : "border-[#FACC15]/40 text-[#FACC15]"}`}>
                  {asset.type}
                </span>
              </div>
              <div className="font-ibm-plex text-sm text-white/50 mb-6">{asset.name}</div>

              {/* Middle */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="font-space text-xs uppercase tracking-wider text-white/40 mb-1">Type</div>
                  <div className="font-ibm-plex text-sm">{asset.type}</div>
                </div>
                <div>
                  <div className="font-space text-xs uppercase tracking-wider text-white/40 mb-1">Precision</div>
                  <div className="font-ibm-plex text-sm">{asset.scale} decimals</div>
                </div>
                <div>
                  <div className="font-space text-xs uppercase tracking-wider text-white/40 mb-1">Symbol</div>
                  <div className="font-ibm-plex text-sm">{asset.symbol || "—"}</div>
                </div>
              </div>

              {/* Exchange rates */}
              {asset.rates.length > 0 && (
                <>
                  <div className="border-t border-white/10 my-6" />
                  <div className="font-space text-xs uppercase tracking-wider text-white/40 mb-3">Exchange Rates</div>
                  {asset.rates.slice(-1).map((rate, i) => {
                    const perUnit = rate.rate > 0 ? (1 / rate.rate).toFixed(4) : "0";
                    return (
                      <div key={i} className="mb-3">
                        <div className="font-ibm-plex text-sm">
                          <span className="text-white/50">1 </span>
                          <span className="font-bold text-[#2DD4BF]">{rate.from_asset}</span>
                          <span className="text-white/50"> = </span>
                          <span className="font-bold text-[#2DD4BF]">{rate.rate} {rate.to_asset}</span>
                        </div>
                        <div className="font-ibm-plex text-xs text-white/40 mt-0.5">
                          (${perUnit} per {rate.to_asset})
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-4 bg-white/5 p-4 font-ibm-plex text-sm text-white/50">
                    Customers top up in {asset.rates[0]?.from_asset} → receive {asset.code} at configured rate. Used in product pricing as a billing unit.
                  </div>
                  <button
                    onClick={() => setRateModalAsset(asset)}
                    className="mt-4 border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5"
                  >
                    + Add Rate
                  </button>
                </>
              )}

              {asset.rates.length === 0 && (
                <>
                  <div className="border-t border-white/10 my-6" />
                  <div className="bg-white/5 p-4 font-ibm-plex text-sm text-white/50">
                    Base fiat asset — used as the settlement currency for customer wallets and billing.
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Quote Calculator */}
      <div>
        <div className="font-space text-xs uppercase tracking-wider text-white/40 border-b border-dashed border-white/15 pb-3 mb-4">
          -- QUOTE CALCULATOR ----------------------------------------
        </div>
        <div className="flex flex-wrap items-end gap-6 font-ibm-plex text-sm">
          <div>
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">USD Amount</label>
            <input
              type="number"
              value={quoteInput}
              onChange={(e) => setQuoteInput(e.target.value)}
              className="w-36 border border-white/[0.08] bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-[#2DD4BF]"
            />
          </div>
          <div className="py-2 text-lg text-white/40">→</div>
          <div>
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">CREDITS</label>
            <div className="w-36 border border-white/[0.06] bg-white/5 px-3 py-2 font-bold text-[#2DD4BF]">
              {quoteResult.toFixed(0)}
            </div>
          </div>
          <div className="py-2 font-ibm-plex text-xs text-white/30">
            Rate: 1 USD = {currentRate} CREDITS
          </div>
        </div>
      </div>

      <CreateAssetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(asset) => {
          setAssetList((prev) => [...prev, asset]);
          setModalOpen(false);
        }}
      />

      {rateModalAsset && (
        <AddExchangeRateModal
          open={!!rateModalAsset}
          onClose={() => setRateModalAsset(null)}
          asset={rateModalAsset}
          onRateAdded={(newRate) => handleRateAdded(rateModalAsset.id, newRate)}
        />
      )}
    </div>
  );
}
