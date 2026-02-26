"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, ImageIcon, Upload, X, ArrowRight, Loader2 } from "lucide-react";

type Mode = "web" | "image";

import { useDesignAnalysis } from "@/hooks/useDesignAnalysis";

export default function AnalysisInput() {
  const [mode, setMode] = useState<Mode>("web");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { loading: apiLoading, stage, analyzeImage, analyzeWeb } = useDesignAnalysis();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loading = apiLoading || submitLoading;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createAnalysis = useMutation(api.analyses.createAnalysis);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const examples = ["lemonsqueezy.com", "linear.app", "notion.so"];

  // ── File Handling ───────────────────────────────────────────────────

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  // ── Submit ──────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitLoading(true);
    setError(null);
    try {
      if (mode === "web") {
        if (!url.trim()) return;
        let finalUrl = url.trim();
        if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
          finalUrl = "https://" + finalUrl;
        }
        
        // 1. Create record in Convex (without orchestrate field)
        const id = await createAnalysis({
          sourceType: "url",
          sourceValue: finalUrl,
        });
        
        // 2. Start the redirect to the analyze page immediately 
        // OR wait for the API call to finish? 
        // The current app redirects and shows a loading state. 
        // Let's stick to that but trigger the API call in the background or right here.
        router.push(`/analyze/${id}`);
        
        // 3. Trigger API (it will update Convex status)
        analyzeWeb(finalUrl, id).catch(console.error);
        
      } else {
        if (!file || !preview) return;
        
        // 1. Create record in Convex
        const id = await createAnalysis({
          sourceType: "image",
          sourceValue: "Uploaded Image",
        });
        
        router.push(`/analyze/${id}`);
        
        // 2. Trigger API
        analyzeImage(file, id).catch(console.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create analysis");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Animation Variants ─────────────────────────────────────────────

  const panelVariants = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: "easeIn" } },
  };

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-[640px] mx-auto flex flex-col items-center gap-5">
      {/* ── Toggle Bar ─────────────────────────────────────────────── */}
      <div className="relative flex items-center p-1 rounded-lg bg-[#394739]/5 border border-[#394739]/10">
        {/* Sliding Indicator */}
        <div
          className="absolute top-1 bottom-1 rounded-md bg-[#aff6b0] shadow-sm transition-all duration-300 ease-out"
          style={{
            left: mode === "web" ? "4px" : "50%",
            width: "calc(50% - 4px)",
          }}
        />
        <button
          onClick={() => setMode("web")}
          className={`relative z-10 flex items-center gap-1.5 px-5 py-1.5 text-[13px] font-medium rounded-md transition-colors duration-200 ${
            mode === "web" ? "text-[var(--fg)]" : "text-[#394739]/50 hover:text-[#394739]"
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          Web
        </button>
        <button
          onClick={() => setMode("image")}
          className={`relative z-10 flex items-center gap-1.5 px-5 py-1.5 text-[13px] font-medium rounded-md transition-colors duration-200 ${
            mode === "image" ? "text-[var(--fg)]" : "text-[#394739]/50 hover:text-[#394739]"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Image
        </button>
      </div>

      {/* ── Content Panel ──────────────────────────────────────────── */}
      <div className="w-full min-h-[72px]">
        <AnimatePresence mode="wait">
          {mode === "web" ? (
            <motion.div
              key="web"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-3 w-full"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="relative flex items-center w-full"
              >
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Paste any website URL..."
                  disabled={loading}
                  className="w-full pl-5 pr-14 py-4 rounded-lg border border-[#394739]/10 bg-[var(--bg)] text-[var(--fg)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--fg)]/20 transition-all placeholder:text-[#394739]/40"
                />
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="absolute right-2 p-2 rounded-md bg-[#aff6b0] text-[#394739] disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center h-10 w-10 min-w-[40px]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                       <Loader2 className="w-5 h-5 animate-spin" />
                       {stage && <span className="text-[10px] absolute -bottom-6 right-0 whitespace-nowrap text-[#394739]/60">{stage}</span>}
                    </div>
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </button>
              </form>

              <div className="flex items-center gap-2 pl-1 text-[13px] text-[#394739]/60">
                <span>Try:</span>
                {examples.map((ex, i) => (
                  <span key={ex} className="flex items-center gap-2">
                    <button
                      onClick={() => setUrl(`https://${ex}`)}
                      className="hover:text-[var(--fg)] transition-colors"
                      disabled={loading}
                    >
                      {ex}
                    </button>
                    {i < examples.length - 1 && <span>&middot;</span>}
                  </span>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="image"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-4 w-full"
            >
              {!file ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center gap-3 min-h-[160px] rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? "border-[var(--fg)] bg-[var(--fg)]/5 scale-[1.01]"
                      : "border-[#394739]/10 hover:border-[#394739]/30 bg-[var(--bg)]"
                  }`}
                >
                  <Upload
                    className={`w-8 h-8 transition-colors ${
                      isDragging ? "text-[var(--fg)]" : "text-[#394739]/40"
                    }`}
                  />
                  <div className="text-center">
                    <p className="text-[15px] font-medium text-[var(--fg)]">
                      Drop your screenshot here
                    </p>
                    <p className="text-[13px] text-[#394739]/60 mt-0.5">
                      or click to browse
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-lg border border-[#394739]/10 bg-[var(--bg)]">
                  {preview && (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-16 h-16 rounded-lg object-cover border border-[#394739]/10"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[var(--fg)] truncate">
                      {file.name}
                    </p>
                    <p className="text-[12px] text-[#394739]/60">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-1.5 rounded-md hover:bg-[#394739]/5 transition-colors"
                  >
                    <X className="w-4 h-4 text-[#394739]/60" />
                  </button>
                </div>
              )}

              {file && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex flex-col items-center justify-center gap-1 w-full py-3 rounded-lg bg-[#aff6b0] text-[#394739] text-[14px] font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Analyze Screenshot
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </div>
                  {loading && stage && (
                    <span className="text-[11px] font-medium opacity-60 animate-pulse">
                      {stage}
                    </span>
                  )}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="text-red-500 text-sm w-full pl-1">{error}</p>
      )}
    </div>
  );
}
