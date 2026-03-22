interface StepIndicatorProps {
  current: number;
  total: number;
}

export default function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="font-mono text-[11px] uppercase tracking-wider text-[#555]">
        Step {current} of {total}
      </span>
      <div className="flex items-center gap-1 ml-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-[3px] w-5"
            style={{ backgroundColor: i < current ? "#e0e0e0" : "#333" }}
          />
        ))}
      </div>
    </div>
  );
}
