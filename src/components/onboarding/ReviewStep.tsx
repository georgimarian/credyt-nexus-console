import { OnboardingReview } from "./onboardingState";

interface Props {
  review: OnboardingReview;
  onUpdate: (partial: Partial<OnboardingReview>) => void;
  onBack: () => void;
  onConfigure: () => void;
}

export default function ReviewStep({ review, onUpdate, onBack, onConfigure }: Props) {
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

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-green-600 text-lg">✅</span>
        <span className="font-mono text-[15px] font-bold text-green-700">Billing config ready</span>
      </div>
      <p className="font-mono text-[13px] text-[#888] mb-6">
        The fields below are yours to adjust — nothing gets created until you hit Configure.
      </p>

      <div className="border border-dashed border-[#ccc] p-5 bg-[#f9f9f5] mb-6" style={{ borderRadius: "4px" }}>
        <div className="font-mono text-[11px] uppercase tracking-wider text-[#999] mb-4">Customise names</div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-[#999] block mb-2">Product name</label>
            <input
              style={inputStyle}
              value={review.productName}
              onChange={(e) => {
                onUpdate({
                  productName: e.target.value,
                  productCode: slugify(e.target.value),
                });
              }}
            />
          </div>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-[#999] block mb-2">Product code</label>
            <input style={inputStyle} value={review.productCode} onChange={(e) => onUpdate({ productCode: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="font-mono text-[11px] uppercase tracking-wider text-[#999] block mb-2">Event type</label>
          <input style={inputStyle} value={review.eventType} onChange={(e) => onUpdate({ eventType: e.target.value })} />
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="font-mono text-[13px] px-4 py-2 border border-dashed border-[#bbb] text-[#888] bg-transparent" style={{ borderRadius: "4px" }}>
          ← Back
        </button>
        <button
          onClick={onConfigure}
          className="font-mono text-[13px] font-bold px-6 py-2.5 bg-[#111] text-white w-full ml-4 hover:bg-[#222] transition-colors"
          style={{ borderRadius: "4px" }}
        >
          Configure →
        </button>
      </div>
    </div>
  );
}
