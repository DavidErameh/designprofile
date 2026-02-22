"use client";

import { useState } from "react";

interface ColorSwatchProps {
  hex: string;
  usage: number;
  role: string;
}

export default function ColorSwatch({ hex, usage, role }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={handleCopy}
      className="group flex flex-col items-center gap-2 cursor-pointer transition-transform hover:-translate-y-1"
      title="Click to copy hex"
    >
      <div 
        className="w-12 h-12 rounded shadow-sm border border-[#E5E5E5] dark:border-[#333] flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: hex }}
      >
        {copied && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-medium">
            Copied
          </div>
        )}
      </div>
      <div className="flex flex-col items-center text-center">
        <span className="font-mono text-[11px] text-[var(--fg)]">{hex}</span>
        <span className="text-[10px] text-[#A3A3A3]">{Math.round(usage * 100)}%</span>
        <span className="text-[10px] text-[#737373] capitalize mt-0.5">{role}</span>
      </div>
    </div>
  );
}
