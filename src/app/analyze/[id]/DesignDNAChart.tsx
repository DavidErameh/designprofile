"use client";

import RadarChart from "@/components/RadarChart";
import { QualityScores } from "../../../../lib/types/profile";

export default function DesignDNAChart({ scores }: { scores: QualityScores }) {
  const data = [
    { axis: "Consistency", value: scores.consistency },
    { axis: "Hierarchy", value: scores.hierarchy },
    { axis: "Whitespace", value: scores.whitespace },
    { axis: "Typography", value: scores.typography },
    { axis: "Color Harmony", value: scores.color_harmony },
  ];

  return (
    <div className="flex flex-col items-center py-6">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[#A3A3A3] mb-4">Design DNA</h3>
      <RadarChart data={data} size={320} />
    </div>
  );
}
