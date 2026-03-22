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
      <h2 className="font-mono text-lg font-bold text-[#e0e0e0] mb-1">What does your app charge for?</h2>
      <p className="font-mono text-[13px] text-[#666] mb-6">
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
                border: isSelected ? "1px solid #2dd4aa" : "1px dashed #2a2a2a",
                backgroundColor: isSelected ? "#0d2420" : "#0a0a0a",
              }}
            >
              <Icon size={16} className="text-[#666] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className={`font-mono text-[13px] font-medium ${isSelected ? "text-white" : "text-[#e0e0e0]"}`}>{opt.label}</div>
                {opt.desc && <div className="font-mono text-[11px] text-[#666] mt-0.5">{opt.desc}</div>}
              </div>
              {isSelected && <span className="font-mono text-[13px] text-[#2dd4aa] shrink-0">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
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
