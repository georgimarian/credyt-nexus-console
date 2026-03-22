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
          border: isSelected ? "1px solid #222" : "1px dashed #bbb",
          backgroundColor: isSelected ? "#f5f5f5" : "white",
          borderRadius: "4px",
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[13px] font-medium text-[#111]">{title}</span>
            {badge && (
              <span className="font-mono text-[10px] uppercase tracking-wider border border-dashed border-[#bbb] px-1.5 py-0.5 text-[#888]">
                {badge}
              </span>
            )}
          </div>
          <div className="font-mono text-[11px] text-[#999] mt-1">{desc}</div>
        </div>
        {isSelected && <span className="font-mono text-[13px] text-[#222] shrink-0">✓</span>}
      </button>
    );
  };

  return (
    <div>
      <StepIndicator current={2} total={3} />
      <h2 className="font-mono text-lg font-bold text-[#111] mb-1">What do users see when they're charged?</h2>
      <p className="font-mono text-[13px] text-[#888] mb-6">
        Dollars are transparent. Credits let you smooth over variable costs and tweak pricing without resetting user expectations.
      </p>

      {card("usd", "US Dollars (USD)", "Users see exact dollar amounts. Best for API products and technical users.")}
      {card("custom", "Custom credits / tokens", "Users see credits, not dollars. Best when costs vary per request, or when you want to adjust pricing later without touching what users see.", "Popular for AI apps")}

      <div className="flex justify-between mt-4">
        <button onClick={onBack} className="font-mono text-[13px] px-4 py-2 border border-dashed border-[#bbb] text-[#888] bg-transparent" style={{ borderRadius: "4px" }}>
          ← Back
        </button>
        <button
          onClick={onContinue}
          disabled={!selected}
          className="font-mono text-[13px] px-4 py-2 border transition-all"
          style={{
            borderColor: selected ? "#222" : "#d4d4d4",
            color: selected ? "#111" : "#bbb",
            backgroundColor: "transparent",
            borderRadius: "4px",
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
