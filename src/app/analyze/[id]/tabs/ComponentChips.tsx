"use client";

export default function ComponentChips({ components }: { components: string[] }) {
  if (!components || components.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#A3A3A3]">
        Detected Components
      </h3>
      <div className="flex flex-wrap gap-2">
        {components.map((c) => (
          <span
            key={c}
            className="px-3 py-1.5 text-[12px] rounded-full border border-[#E5E5E5] dark:border-[#333] text-[#737373] hover:text-[var(--fg)] hover:border-[#A3A3A3] transition-colors cursor-default"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
