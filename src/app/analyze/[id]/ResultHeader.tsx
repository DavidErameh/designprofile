"use client";

import { useState } from "react";
import { Share2, Bookmark } from "lucide-react";

export default function ResultHeader({ 
  sourceValue, 
  processingMs 
}: { 
  sourceValue: string, 
  processingMs: number 
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="flex items-center justify-between py-3 mb-8 border-b border-[#394739]/10 text-[13px] text-[#394739]/70">
      <div className="flex items-center gap-4 truncate">
        <span className="font-mono truncate">{sourceValue}</span>
        <span className="shrink-0 opacity-50">&middot;</span>
        <span className="shrink-0">Analyzed in {(processingMs / 1000).toFixed(1)}s</span>
      </div>
      
      <div className="flex items-center gap-3 shrink-0">
        <button 
          onClick={handleShare}
          className="flex items-center gap-1.5 hover:text-[var(--fg)] transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          {copied ? "Copied!" : "Share"}
        </button>
        <button className="flex items-center gap-1.5 hover:text-[var(--fg)] transition-colors">
          <Bookmark className="w-3.5 h-3.5" />
          Save
        </button>
      </div>
    </header>
  );
}
