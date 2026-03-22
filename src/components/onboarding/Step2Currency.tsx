import StepIndicator from "./StepIndicator";

interface Props {
  selected: "usd" | "custom" | "";
  onSelect: (v: "usd" | "custom") => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function Step2Currency({ selected, onSelect, onBack, onContinue }: Props) {
  const card = (key: "usd" | "custom", title: string, desc: string, badge?: string) => {
    const isSelected = selected === key;
    return (
      <button
        key={key}
        onClick={() => onSelect(key)}
        className="w-full text-left p-4 flex items-start gap-3 transition-all mb-3"
        style={{
          border: isSelected ? "1px solid #2dd4aa" : "1px dashed #2a2a2a",
          backgroundColor: isSelected ? "#0d2420" : "#0a0a0a",
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-mono text-[13px] font-medium ${isSelected ? "text-white" : "text-[#e0e0e0]"}`}>{title}</span>
            {badge && (
              <span className="font-mono text-[10px] uppercase tracking-wider border border-dashed border-[#333] px-1.5 py-0.5 text-[#555]">
                {badge}
              </span>
            )}
          </div>
          <div className="font-mono text-[11px] text-[#666] mt-1">{desc}</div>
        </div>
        {isSelected && <span className="font-mono text-[13px] text-[#2dd4aa] shrink-0">✓</span>}
      </button>
    );
  };

  return (
    <div>
      <StepIndicator current={2} total={3} />
      <h2 className="font-mono text-lg font-bold text-[#e0e0e0] mb-1">What do users see when they're charged?</h2>
      <p className="font-mono text-[13px] text-[#666] mb-6">
        Dollars are transparent. Credits let you smooth over variable costs and tweak pricing without resetting user expectations.
      </p>

      {card("usd", "US Dollars (USD)", "Users see exact dollar amounts. Best for API products and technical users.")}
      {card("custom", "Custom credits / tokens", "Users see credits, not dollars. Best when costs vary per request, or when you want to adjust pricing later without touching what users see.", "Popular for AI apps")}

      <div className="flex justify-between mt-4">
        <button onClick={onBack} className="font-mono text-[13px] px-4 py-2 border border-dashed border-[#333] text-[#555] bg-transparent">
          ← Back
        </button>
        <button
          onClick={onContinue}
          disabled={!selected}
          className="font-mono text-[13px] px-4 py-2 border transition-all bg-transparent"
          style={{
            borderColor: selected ? "#e0e0e0" : "#222",
            color: selected ? "#e0e0e0" : "#333",
            cursor: selected ? "pointer" : "default",
            opacity: selected ? 1 : 0.5,
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
