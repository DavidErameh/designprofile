"use client";

import { generateExports } from "../../../../../lib/analysis/exports";
import { DesignProfile } from "../../../../../lib/types/profile";
import ColorSwatch from "./ColorSwatch";
import FontPreview from "./FontPreview";
import { Download } from "lucide-react";

export default function GraphicTab({ profile }: { profile: DesignProfile }) {
  const decodeBase64 = (b64: string) => {
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf;
  };

  const handleDownloadASE = () => {
    const aseBase64 = generateExports(profile).adobe_ase;
    const blob = new Blob([decodeBase64(aseBase64)], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.source_value.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ase`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      {/* Color Palette */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#A3A3A3]">
            Color Palette
          </h3>
          <button
            onClick={handleDownloadASE}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#E5E5E5] dark:border-[#333] text-[12px] font-medium hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download .ase palette
          </button>
        </div>
        <div className="flex flex-wrap gap-6">
          {profile.colors.palette.map((color, i) => (
            <ColorSwatch
              key={`${color.hex}-${i}`}
              hex={color.hex}
              usage={color.usage_ratio}
              role={color.role}
            />
          ))}
        </div>
      </section>

      {/* WCAG Pairs */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#A3A3A3] mb-4">
          WCAG Contrast Pairs
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profile.colors.contrast_ratios.map((pair, i) => (
            <div
              key={`${pair.fg}-${pair.bg}-${i}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#F5F5F5] dark:bg-[#1A1A1A]"
            >
              <div className="flex -space-x-1">
                <div
                  className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 z-10"
                  style={{ backgroundColor: pair.fg }}
                />
                <div
                  className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10"
                  style={{ backgroundColor: pair.bg }}
                />
              </div>
              <div className="flex items-center gap-2 text-[12px] font-mono whitespace-nowrap overflow-hidden text-ellipsis">
                <span>{pair.fg}</span>
                <span className="text-[#A3A3A3]">+</span>
                <span>{pair.bg}</span>
                <span className="text-[#A3A3A3] mx-1">&mdash;</span>
                <span className="text-[#737373]">ratio:{pair.ratio.toFixed(2)}</span>
                <span className="text-[#A3A3A3] mx-1">&mdash;</span>
                <span className={`font-semibold ${pair.score.includes("Fail") ? "text-red-500" : "text-green-600 dark:text-green-500"}`}>
                  {pair.score}
                </span>
              </div>
            </div>
          ))}
          {profile.colors.contrast_ratios.length === 0 && (
            <div className="text-sm text-[#A3A3A3] italic">No contrast pairs analyzed.</div>
          )}
        </div>
      </section>

      {/* Fonts */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#A3A3A3] mb-4">
          Typography
        </h3>
        <div className="flex flex-col gap-2">
          {profile.typography.fonts.map((font, i) => (
            <FontPreview
              key={`${font.family}-${i}`}
              family={font.family}
              role={font.role}
            />
          ))}
          {profile.typography.fonts.length === 0 && (
            <div className="text-sm text-[#A3A3A3] italic">No fonts detected.</div>
          )}
        </div>
      </section>
    </div>
  );
}
