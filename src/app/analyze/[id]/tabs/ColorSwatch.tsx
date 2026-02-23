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
        className="w-12 h-12 rounded shadow-sm border border-[#394739]/10 flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: hex }}
      >
        {copied && (
          <div className="absolute inset-0 bg-[#394739]/80 flex items-center justify-center text-[var(--bg)] text-[10px] font-bold">
            Copied
          </div>
        )}
      </div>
      <div className="flex flex-col items-center text-center">
        <span className="font-mono text-[11px] text-[var(--fg)] font-semibold">{hex}</span>
        <span className="text-[10px] text-[#394739]/40">{Math.round(usage * 100)}%</span>
        <span className="text-[10px] text-[#394739]/60 capitalize mt-0.5">{role}</span>
      </div>
    </div>
  );
}
