"use client";

interface SpacingScaleProps {
  scale: { label: string; value: number }[];
  baseUnit: number;
}

export default function SpacingScaleDisplay({ scale, baseUnit }: SpacingScaleProps) {
  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#A3A3A3]">
        Spacing Scale &mdash; Base unit: {baseUnit}px
      </h3>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-8">
        {scale.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-2">
            <span className="font-mono text-[10px] text-[#737373]">{s.value}px</span>
            <div
              className="bg-[var(--accent)] rounded-[2px]"
              style={{
                width: Math.min(s.value * 2, 120),
                height: 8,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
