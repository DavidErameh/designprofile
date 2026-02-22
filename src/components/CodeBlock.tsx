"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-scss";

interface CodeBlockProps {
  code: string;
  language: string;
  label: string;
  collapsible?: boolean;
}

export default function CodeBlock({ code, language, label, collapsible = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(!collapsible);

  useEffect(() => {
    if (expanded) {
      Prism.highlightAll();
    }
  }, [code, expanded]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-[#A3A3A3] font-semibold">{label}</span>
        {collapsible && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-[var(--accent)] hover:underline"
          >
            {expanded ? `Hide ${label} \u2191` : `Show ${label} \u2193`}
          </button>
        )}
      </div>
      
      {expanded && (
        <div className="relative rounded-lg overflow-hidden border border-[#333] bg-[#2d2d2d] w-full max-w-full">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors z-10"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#A3A3A3]" />}
          </button>
          
          <pre className="p-4 font-mono text-[12px] leading-relaxed overflow-x-auto max-h-[400px] overflow-y-auto w-full !bg-transparent !m-0 !pt-5">
            <code className={`language-${language}`}>
              {code}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}
