"use client";

import { motion } from "framer-motion";
import { DesignProfile } from "../../../../lib/types/profile";
import ResultHeader from "./ResultHeader";
import DesignDNAChart from "./DesignDNAChart";
import PersonaTabs from "./tabs/PersonaTabs";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.06
    }
  }
};

export default function ResultPage({ profile }: { profile: DesignProfile }) {
  return (
    <div className="max-w-[1280px] mx-auto px-6 pb-24">
      <ResultHeader 
        sourceValue={profile.source_value} 
        processingMs={profile.processing_ms} 
      />

      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-12 lg:gap-24 items-start">
        {/* Left Column: Visual Analysis */}
        <motion.div 
          variants={stagger}
          initial="initial"
          animate="animate"
          className="flex flex-col gap-12"
        >
          {/* Screenshot */}
          <motion.div variants={fadeIn} className="overflow-hidden rounded-lg border border-[#394739]/10 shadow-xl">
             {profile.screenshot_url ? (
               <img 
                 src={profile.screenshot_url} 
                 alt="Source screenshot" 
                 className="w-full h-auto block"
               />
             ) : (
                <div className="aspect-video bg-[#394739]/5 flex items-center justify-center text-[#394739]/40 text-sm italic">
                  No screenshot available
                </div>
             )}
          </motion.div>

          {/* DNA Section */}
          <motion.div variants={fadeIn} className="flex flex-col gap-6">
            <DesignDNAChart scores={profile.meta.quality_scores!} />
            
            {profile.meta.designer_insight && (
              <blockquote className="border-l-2 border-[#394739]/10 pl-6 py-1 italic text-[#394739]/70 text-[15px] leading-relaxed">
                "{profile.meta.designer_insight}"
              </blockquote>
            )}
          </motion.div>

          {/* Basic Info (Style & Personality) */}
          <motion.div variants={fadeIn} className="flex flex-wrap gap-8 py-8 border-y border-[#394739]/10">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-[#394739]/40 font-semibold">Style</span>
              <span className="text-lg font-medium">{profile.meta.design_style || "Neutral"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-[#394739]/40 font-semibold">Personality</span>
              <div className="flex flex-wrap gap-2">
                {profile.meta.brand_personality?.map((p: string) => (
                  <span key={p} className="text-sm px-2 py-0.5 rounded bg-[#394739]/5 text-[#394739]/70">
                    {p}
                  </span>
                )) || "None detected"}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Persona Tabs */}
        <div className="md:sticky md:top-24 flex flex-col">
          <PersonaTabs profile={profile} />
        </div>
      </div>
    </div>
  );
}
