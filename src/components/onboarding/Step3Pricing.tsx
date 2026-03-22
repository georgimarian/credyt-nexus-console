import { useState } from "react";
import { HelpCircle } from "lucide-react";
import StepIndicator from "./StepIndicator";
import { OnboardingSelections, getUseCaseLabel, getUseCaseUnit } from "./onboardingState";

const volumeExamples = ["tokens", "minutes", "pages", "rows", "images"];

interface Props {
  selections: OnboardingSelections;
  onUpdate: (partial: Partial<OnboardingSelections>) => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function Step3Pricing({ selections, onUpdate, onBack, onContinue }: Props) {
  const [showDimensions, setShowDimensions] = useState(
    selections.dimensions.field !== "" || selections.dimensions.tiers.length > 0
  );
  const label = getUseCaseLabel(selections.useCase);
  const unit = getUseCaseUnit(selections.useCase);
  const pt = selections.pricingType;

  const showVolumeFields = pt === "volume" || pt === "unit_and_volume";
  const showFlatField = pt === "unit" || pt === "unit_and_volume";
  const canContinue = pt !== "" && (
    (pt === "unit" && selections.flatCharge !== "") ||
    (pt === "volume" && selections.volumeField !== "" && selections.rate !== "") ||
    (pt === "unit_and_volume" && selections.volumeField !== "" && selections.rate !== "" && selections.flatCharge !== "")
  );

  const pricingCard = (key: "unit" | "volume" | "unit_and_volume", title: string, desc: string) => {
    const isSelected = pt === key;
    return (
      <button
        key={key}
        onClick={() => onUpdate({ pricingType: key })}
        className="w-full text-left p-4 flex items-start gap-3 transition-all mb-3"
        style={{
          border: isSelected ? "1px solid #222" : "1px dashed #bbb",
          backgroundColor: isSelected ? "#f5f5f5" : "white",
          borderRadius: "4px",
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-mono text-[13px] font-medium text-[#111]">{title}</span>
            <HelpCircle size={14} className="text-[#bbb]" />
          </div>
          <div className="font-mono text-[11px] text-[#999] mt-0.5">{desc}</div>
        </div>
        {isSelected && <span className="font-mono text-[13px] text-[#222] shrink-0">✓</span>}
      </button>
    );
  };

  const inputStyle: React.CSSProperties = {
    borderBottom: "1px dashed #bbb",
    borderTop: "none",
    borderLeft: "none",
    borderRight: "none",
    background: "transparent",
    outline: "none",
    fontFamily: "monospace",
    fontSize: "14px",
    padding: "4px 0",
    width: "100%",
    color: "#111",
  };

  return (
    <div>
      <StepIndicator current={3} total={3} />
      <h2 className="font-mono text-lg font-bold text-[#111] mb-1">How is each {label} measured?</h2>
      <p className="font-mono text-[13px] text-[#888] mb-6">
        Credyt reads your usage events to calculate charges.
      </p>

      {pricingCard("unit", `Per ${unit} — flat fee`, `Fixed charge every time the event fires.`)}
      {pricingCard("volume", "By quantity consumed", "Charge based on a numeric value in each event — tokens, minutes, rows.")}
      {pricingCard("unit_and_volume", `Flat fee + quantity`, `Fixed charge per ${unit} plus a rate based on consumption.`)}

      {pt && (
        <>
          <div className="border-t border-dashed border-[#ccc] my-6" />

          {showVolumeFields && (
            <div className="mb-5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-[#999] block mb-2">
                What field in your event carries the quantity?
              </label>
              <input
                style={inputStyle}
                value={selections.volumeField}
                onChange={(e) => onUpdate({ volumeField: e.target.value })}
                placeholder="e.g. results"
              />
              <p className="font-mono text-[11px] text-[#aaa] mt-1">
                This becomes the "volume_field" in your product's usage_calculation config. Your app must include this field with a numeric value in every usage event it sends.
              </p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {volumeExamples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => onUpdate({ volumeField: ex })}
                    className="font-mono text-[11px] px-2 py-0.5 border border-dashed border-[#ccc] text-[#888] bg-transparent hover:bg-[#f5f5f0] transition-colors"
                    style={{ borderRadius: "4px" }}
                  >
                    {ex}
                  </button>
                ))}
              </div>

              <label className="font-mono text-[11px] uppercase tracking-wider text-[#999] block mb-2 mt-5">
                Rate per unit (in USD)
              </label>
              <input
                style={inputStyle}
                value={selections.rate}
                onChange={(e) => onUpdate({ rate: e.target.value })}
                placeholder="e.g. 0.01"
                type="number"
                step="any"
              />
              <p className="font-mono text-[11px] text-[#aaa] mt-1">
                Amount charged for each unit reported in the event.
              </p>
            </div>
          )}

          {showFlatField && (
            <div className="mb-5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-[#999] block mb-2">
                Flat charge per {unit} (USD)
              </label>
              <input
                style={inputStyle}
                value={selections.flatCharge}
                onChange={(e) => onUpdate({ flatCharge: e.target.value })}
                placeholder="e.g. 5"
                type="number"
                step="any"
              />
              <p className="font-mono text-[11px] text-[#aaa] mt-1">
                Fixed amount deducted every time this event fires.
              </p>
            </div>
          )}

          {/* Collapsible dimensions */}
          <div className="mt-4">
            <button
              onClick={() => setShowDimensions(!showDimensions)}
              className="font-mono text-[13px] text-[#888] hover:text-[#555] transition-colors"
            >
              {showDimensions ? "▼" : "▶"} Pricing varies by quality, speed, or type
            </button>
            {showDimensions && (
              <div className="mt-3 p-4 border border-dashed border-[#ccc] bg-[#f9f9f5]" style={{ borderRadius: "4px" }}>
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#999] block mb-2">
                  Tier field name
                </label>
                <input
                  style={inputStyle}
                  value={selections.dimensions.field}
                  onChange={(e) =>
                    onUpdate({
                      dimensions: { ...selections.dimensions, field: e.target.value },
                    })
                  }
                  placeholder="e.g. tier"
                />
                <p className="font-mono text-[11px] text-[#aaa] mt-1 mb-4">
                  Field in event data holding the tier string.
                </p>

                {selections.dimensions.tiers.map((tier, i) => (
                  <div key={i} className="flex items-center gap-3 mb-2">
                    <div className="flex-1">
                      <label className="font-mono text-[11px] uppercase tracking-wider text-[#999] block mb-1">When field =</label>
                      <input
                        style={inputStyle}
                        value={tier.value}
                        onChange={(e) => {
                          const tiers = [...selections.dimensions.tiers];
                          tiers[i] = { ...tiers[i], value: e.target.value };
                          onUpdate({ dimensions: { ...selections.dimensions, tiers } });
                        }}
                        placeholder="premium"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="font-mono text-[11px] uppercase tracking-wider text-[#999] block mb-1">Rate per unit (USD)</label>
                      <input
                        style={inputStyle}
                        value={tier.rate}
                        onChange={(e) => {
                          const tiers = [...selections.dimensions.tiers];
                          tiers[i] = { ...tiers[i], rate: e.target.value };
                          onUpdate({ dimensions: { ...selections.dimensions, tiers } });
                        }}
                        placeholder="1.00"
                        type="number"
                        step="any"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const tiers = selections.dimensions.tiers.filter((_, j) => j !== i);
                        onUpdate({ dimensions: { ...selections.dimensions, tiers } });
                      }}
                      className="font-mono text-[13px] text-[#999] hover:text-[#555] mt-4"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const tiers = [...selections.dimensions.tiers, { value: "", rate: "" }];
                    onUpdate({ dimensions: { ...selections.dimensions, tiers } });
                  }}
                  className="font-mono text-[11px] px-3 py-1.5 border border-dashed border-[#ccc] text-[#888] bg-transparent hover:bg-[#f0f0eb] transition-colors mt-2"
                  style={{ borderRadius: "4px" }}
                >
                  + Add tier
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="font-mono text-[13px] px-4 py-2 border border-dashed border-[#bbb] text-[#888] bg-transparent" style={{ borderRadius: "4px" }}>
          ← Back
        </button>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="font-mono text-[13px] px-4 py-2 border transition-all"
          style={{
            borderColor: canContinue ? "#222" : "#d4d4d4",
            color: canContinue ? "#111" : "#bbb",
            backgroundColor: "transparent",
            borderRadius: "4px",
            cursor: canContinue ? "pointer" : "default",
            opacity: canContinue ? 1 : 0.5,
          }}
        >
          Review & configure →
        </button>
      </div>
    </div>
  );
}
