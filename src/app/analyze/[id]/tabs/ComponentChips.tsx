"use client";

export default function ComponentChips({ components }: { components: string[] }) {
  if (!components || components.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#394739]/40">
        Detected Components
      </h3>
      <div className="flex flex-wrap gap-2">
        {components.map((c) => (
          <span
            key={c}
            className="px-3 py-1.5 text-[12px] rounded-full border border-[#394739]/10 text-[#394739]/70 hover:text-[var(--fg)] hover:border-[#394739]/30 transition-colors cursor-default"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
