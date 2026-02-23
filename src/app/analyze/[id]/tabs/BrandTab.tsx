"use client";

import { useState } from "react";
import { DesignProfile } from "../../../../../lib/types/profile";
import ColorRatioPie from "./ColorRatioPie";
import { Lock } from "lucide-react";

export default function BrandTab({ profile }: { profile: DesignProfile }) {
  const [showModal, setShowModal] = useState(false);
  const userPlan = "free"; 

  const handleExportClick = () => {
    if (userPlan === "free") {
      setShowModal(true);
    } else {
      window.open(`/api/export/${profile.id}/pdf`, "_blank");
    }
  };

  const levels: Record<string, number> = { generous: 3, moderate: 2, tight: 1 };
  const whitespaceUsage = profile.meta.whitespace_usage || "moderate";
  const level = levels[whitespaceUsage] || 2;

  return (
    <div className="flex flex-col gap-12 animate-in fade-in duration-500 w-full relative">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#394739]/40 mb-6">
          Color Ratios
        </h3>
        <ColorRatioPie ratios={profile.colors.ratios} />
      </section>

      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#394739]/40 mb-4">
          Brand Personality
        </h3>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {profile.meta.brand_personality?.map((p) => (
            <span key={p} className="text-[20px] font-semibold text-[var(--fg)] capitalize">
              {p}
            </span>
          )) || <span className="text-[20px] font-semibold text-[var(--fg)]">Neutral</span>}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#394739]/40">
          Whitespace Usage: <span className="text-[var(--fg)] capitalize">{whitespaceUsage}</span>
        </h3>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-8 h-2 rounded-sm ${i <= level ? "bg-[var(--fg)]" : "bg-[#394739]/10"}`}
            />
          ))}
        </div>
      </section>

      <section className="pt-6 border-t border-[#394739]/10">
        <button
          onClick={handleExportClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#394739]/10 hover:bg-[#394739]/5 transition-colors"
        >
          {userPlan === "free" && <Lock className="w-4 h-4 text-[#394739]/40" />}
          <span className="text-[13px] font-medium">Download PDF Report</span>
        </button>
      </section>

      {showModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/80 backdrop-blur-sm animate-in fade-in">
          <div className="p-6 max-w-sm rounded-xl border border-[#394739]/10 shadow-2xl bg-[var(--bg)]">
            <h4 className="text-lg font-semibold mb-2">Creator Feature</h4>
            <p className="text-sm text-[#394739]/70 mb-6">
              PDF reports are a Creator feature. Upgrade to unlock downloadable brand reports.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md text-sm font-medium hover:bg-[#394739]/5 transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => window.location.href = "/pricing"}
                className="px-4 py-2 rounded-md text-sm font-bold bg-[var(--fg)] text-[var(--bg)] hover:opacity-90 transition-opacity"
              >
                Upgrade to Creator &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
