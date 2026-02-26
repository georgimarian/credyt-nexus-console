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
        <p className="font-ibm-plex text-sm text-white/40">{assetList.length} assets configured</p>
        <button
          onClick={() => setModalOpen(true)}
          className="border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5"
        >
          + New Asset
        </button>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-stretch">
        {assetList.map((asset) => {
          const isFiat = asset.type === "fiat";
          const icon = isFiat ? "$" : "★";
          const latestRate = asset.rates.length > 0 ? asset.rates[asset.rates.length - 1] : null;

          return (
            <div key={asset.id} className="border border-dotted border-white/10 p-8 flex flex-col" style={{ backgroundColor: "#0D1117" }}>
              {/* Top */}
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl text-[#2DD4BF]">{icon}</span>
                  <span className="font-space text-2xl font-bold text-white">{asset.code}</span>
                </div>
                <span className={`border border-dotted px-2 py-0.5 font-space text-xs uppercase tracking-widest ${isFiat ? "border-[#4ADE80]/40 text-[#4ADE80]" : "border-[#FACC15]/40 text-[#FACC15]"}`}>
                  {asset.type}
                </span>
              </div>
              <div className="font-ibm-plex text-sm text-white/50 mb-4">{asset.name}</div>

              {/* 2-column grid fields */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-2">
                <div>
                  <div className="font-space text-xs text-white/40 uppercase tracking-wider mb-1">Type</div>
                  <div className="font-ibm-plex text-sm text-white">{asset.type}</div>
                </div>
                <div>
                  <div className="font-space text-xs text-white/40 uppercase tracking-wider mb-1">Precision</div>
                  <div className="font-ibm-plex text-sm text-white">{asset.scale} decimals</div>
                </div>
                <div>
                  <div className="font-space text-xs text-white/40 uppercase tracking-wider mb-1">Symbol</div>
                  <div className="font-ibm-plex text-sm text-white">{asset.symbol || "—"}</div>
                </div>
              </div>

              {/* Exchange rates — custom assets only */}
              {!isFiat && latestRate && (
                <div className="border-t border-dotted border-white/10 mt-6 pt-6">
                  <div className="font-space text-xs uppercase tracking-wider text-white/40 mb-3">Exchange Rates</div>
                  <div className="font-ibm-plex text-sm">
                    <span className="text-white/50">1 USD = </span>
                    <span className="font-bold text-[#2DD4BF]">{latestRate.rate} {latestRate.to_asset}</span>
                    <span className="text-white/30 text-xs ml-2">(${latestRate.rate > 0 ? (1 / latestRate.rate).toFixed(4) : "0"} per {latestRate.to_asset})</span>
                  </div>
                </div>
              )}

              {/* Explanation block — custom only */}
              {!isFiat && (
                <div className="bg-black/20 p-4 font-ibm-plex text-xs text-white/40 mt-4">
                  Customers top up in {latestRate?.from_asset || "USD"} → receive {asset.code} at configured rate. Used in product pricing as a billing unit.
                </div>
              )}

              {/* Add Rate button — custom only */}
              {!isFiat && (
                <button
                  onClick={() => setRateModalAsset(asset)}
                  className="mt-4 border border-white/30 bg-transparent px-4 py-2 font-space text-xs uppercase tracking-wide text-white hover:bg-white/5 self-start"
                >
                  + Add Rate
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Quote Calculator */}
      <div>
        <div className="font-space text-xs uppercase tracking-wider text-white/40 border-b border-dotted border-white/20 pb-3 mb-4">
          ┌─ QUOTE CALCULATOR ────────────────────┐
        </div>
        <div className="flex flex-wrap items-end gap-6 font-ibm-plex text-sm">
          <div>
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">USD Amount</label>
            <input
              type="number"
              value={quoteInput}
              onChange={(e) => setQuoteInput(e.target.value)}
              className="w-36 border border-dotted border-white/[0.08] bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-[#2DD4BF]"
            />
          </div>
          <div className="py-2 text-lg text-white/40">→</div>
          <div>
            <label className="block font-space text-xs uppercase tracking-wider text-white/40 mb-2">CREDITS</label>
            <div className="w-36 border border-dotted border-white/[0.06] bg-white/5 px-3 py-2 font-bold text-[#2DD4BF]">
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