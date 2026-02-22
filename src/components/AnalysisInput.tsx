"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function AnalysisInput() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const createAnalysis = useMutation(api.analyses.createAnalysis);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!value.trim()) return;
    
    // Auth check before mutation
    if (!isSignedIn) {
      // Could open Clerk modal here, but the mutation will throw UNAUTHENTICATED
      // NextJS Clerk middleware usually handles protecting routes or we can handle the error.
    }

    setLoading(true);
    setError(null);
    try {
      const isUrl =
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        (!value.includes(" ") && value.includes("."));
        
      const id = await createAnalysis({
        sourceType: isUrl ? "url" : "image",
        sourceValue: isUrl ? value.trim() : value,
      });
      router.push(`/analyze/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create analysis");
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const examples = ["lemonsqueezy.com", "linear.app", "notion.so"];

  return (
    <div className="w-full max-w-[640px] mx-auto flex flex-col gap-3">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center w-full"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste a URL or drop an image"
          disabled={loading}
          className="w-full pl-5 pr-14 py-4 rounded-xl border border-[#E5E5E5] dark:border-[#333] bg-[var(--bg)] text-[var(--fg)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all placeholder:text-[#A3A3A3]"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="absolute right-3 p-2 rounded-lg bg-[var(--accent)] text-white disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center"
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
        </button>
      </form>
      
      {error && <p className="text-red-500 text-sm pl-1">{error}</p>}
      
      <div className="flex items-center gap-2 pl-1 text-[13px] text-[#A3A3A3]">
        <span>Try:</span>
        {examples.map((ex, i) => (
          <span key={ex} className="flex items-center gap-2">
            <button
              onClick={() => setValue(`https://${ex}`)}
              className="hover:text-[var(--fg)] transition-colors"
              disabled={loading}
            >
              {ex}
            </button>
            {i < examples.length - 1 && <span>&middot;</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
