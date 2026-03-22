import { Sparkles, Search, Cog, MessageSquare, ShoppingBag, CircleEllipsis } from "lucide-react";
import StepIndicator from "./StepIndicator";

const options = [
  { key: "ai_generation", label: "AI generation", desc: "Text, images, audio, video, code", icon: Sparkles },
  { key: "search", label: "Search & retrieval", desc: "Semantic search, RAG, lookups", icon: Search },
  { key: "processing", label: "Processing", desc: "Documents, files, transforms, analysis", icon: Cog },
  { key: "conversations", label: "Conversations", desc: "Chat sessions, AI agents, copilots", icon: MessageSquare },
  { key: "in_app_purchases", label: "In-app purchases", desc: "Credits, power-ups, unlocks, upgrades", icon: ShoppingBag },
  { key: "something_else", label: "Something else", desc: "", icon: CircleEllipsis },
];

interface Props {
  selected: string;
  onSelect: (key: string) => void;
  onContinue: () => void;
}

export default function Step1UseCase({ selected, onSelect, onContinue }: Props) {
  return (
    <div>
      <StepIndicator current={1} total={3} />
      <h2 className="font-mono text-lg font-bold text-[#111] mb-1">What does your app charge for?</h2>
      <p className="font-mono text-[13px] text-[#888] mb-6">
        Pick the closest match — you can rename everything before configuring.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {options.map((opt) => {
          const isSelected = selected === opt.key;
          const Icon = opt.icon;
          return (
            <button
              key={opt.key}
              onClick={() => onSelect(opt.key)}
              className="text-left p-4 flex items-start gap-3 transition-all"
              style={{
                border: isSelected ? "1px solid #222" : "1px dashed #bbb",
                backgroundColor: isSelected ? "#f5f5f5" : "white",
                borderRadius: "4px",
              }}
            >
              <Icon size={16} className="text-[#666] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[13px] font-medium text-[#111]">{opt.label}</div>
                {opt.desc && <div className="font-mono text-[11px] text-[#999] mt-0.5">{opt.desc}</div>}
              </div>
              {isSelected && <span className="font-mono text-[13px] text-[#222] shrink-0">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
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
