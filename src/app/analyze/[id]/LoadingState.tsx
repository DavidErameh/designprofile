"use client";

import { useEffect, useState } from "react";

export default function LoadingState({ 
  sourceValue, 
  stage 
}: { 
  sourceValue: string;
  stage?: string;
}) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (stage && !history.includes(stage)) {
      setHistory(prev => [...prev, stage]);
    }
  }, [stage]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      {/* Indeterminate Progress Bar */}
      <div className="fixed top-14 left-0 w-full h-1 bg-[#E5E5E5] dark:bg-[#333] overflow-hidden z-40">
        <div className="progress-bar-inner h-full bg-[var(--accent)] w-1/4 animate-indeterminate" />
      </div>

      <div className="w-full max-w-[400px] flex flex-col gap-2 font-mono text-[13px] text-[#737373]">
        <p className="animate-in fade-in slide-in-from-left-2 duration-500">
          &rarr; Initializing analysis for {sourceValue}
        </p>
        
        {history.map((h, i) => (
          <p key={i} className="animate-in fade-in slide-in-from-left-2 duration-500">
            &rarr; {h}
          </p>
        ))}

        {!stage && (
          <p className="animate-in fade-in slide-in-from-left-2 duration-500 opacity-50 italic">
            &rarr; Waiting for server...
          </p>
        )}
      </div>

      <style jsx>{`
        .animate-indeterminate {
          animation: indeterminate 1.4s ease-in-out infinite;
        }
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
