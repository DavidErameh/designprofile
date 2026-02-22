"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { DesignProfile } from "../../../../../lib/types/profile";
import { generateExports } from "../../../../../lib/analysis/exports";
import SpacingScaleDisplay from "./SpacingScale";
import ComponentChips from "./ComponentChips";

export default function WebUITab({ profile }: { profile: DesignProfile }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const figmaTokens = generateExports(profile).figma_tokens_json;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(figmaTokens);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 w-full">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#A3A3A3]">
            Figma Tokens JSON
          </h3>
          <p className="text-[11px] text-[#737373]">Paste into Tokens Studio plugin.</p>
        </div>
        
        <div className="relative rounded-lg overflow-hidden border border-[#333] bg-[#0A0A0A] text-[#F5F5F5] w-full max-w-full">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors z-10"
            title="Copy JSON"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#A3A3A3]" />}
          </button>
          
          <pre className={`p-4 font-mono text-[12px] leading-relaxed overflow-x-auto w-full ${!expanded ? "max-h-[320px] overflow-y-hidden" : ""}`}>
            {figmaTokens}
          </pre>
          
          {!expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0A0A0A] to-transparent flex items-end justify-center pb-4">
              <button
                onClick={() => setExpanded(true)}
                className="text-[12px] font-medium text-white px-4 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                Show more
              </button>
            </div>
          )}
        </div>
      </section>

      <section>
        <SpacingScaleDisplay scale={profile.spacing.scale} baseUnit={profile.spacing.base_unit} />
      </section>

      <section>
        <ComponentChips components={profile.components?.detected || []} />
      </section>
    </div>
  );
}
