"use client";

import { useEffect, useState } from "react";

interface FontPreviewProps {
  family: string;
  role: string;
}

function loadGoogleFont(family: string) {
  try {
    const id = `gfont-${family.replace(/\s/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family
    )}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  } catch (error) {
    console.error("Failed to load font", family, error);
  }
}

export default function FontPreview({ family, role }: FontPreviewProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Attempt to load potentially valid Google Fonts
    if (family && family !== "sans-serif" && family !== "serif" && family !== "monospace") {
      loadGoogleFont(family);
      setLoaded(true);
    }
  }, [family]);

  return (
    <div className="flex flex-col gap-3 py-4 border-b border-[#F5F5F5] dark:border-[#1A1A1A] last:border-0">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <span className="font-mono text-[11px] text-[var(--fg)] bg-[#F5F5F5] dark:bg-[#1A1A1A] px-2 py-0.5 rounded">
          {family}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-semibold">
          {role}
        </span>
      </div>
      <div 
        className="flex flex-col gap-2 overflow-hidden" 
        style={{ fontFamily: `"${family}", sans-serif` }}
      >
        <div className="text-base truncate truncate leading-normal">
          The quick brown fox jumps over the lazy dog
        </div>
        <div className="text-[24px] truncate leading-normal font-semibold">
          The quick brown fox
        </div>
        <div className="text-[32px] truncate leading-tight font-bold">
          The quick brown fox
        </div>
      </div>
    </div>
  );
}
