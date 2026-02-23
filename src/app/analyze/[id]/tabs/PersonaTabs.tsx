"use client";

import { useState } from "react";
import GraphicTab from "./GraphicTab";
import WebUITab from "./WebUITab";
import DeveloperTab from "./DeveloperTab";
import BrandTab from "./BrandTab";
import { DesignProfile } from "../../../../../lib/types/profile";

export default function PersonaTabs({ profile }: { profile: DesignProfile }) {
  const [activeTab, setActiveTab] = useState("graphic");

  const tabs = [
    { id: "graphic", label: "Graphic" },
    { id: "ui", label: "Web/UI" },
    { id: "developer", label: "Developer" },
    { id: "brand", label: "Brand" },
  ];

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-6 border-b border-[#394739]/10 mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id 
                ? "text-[var(--fg)]" 
                : "text-[#394739]/40 hover:text-[#394739]"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--fg)]" />
            )}
          </button>
        ))}
      </div>

      <div className="w-full">
         {activeTab === "graphic" && <GraphicTab profile={profile} />}
         {activeTab === "ui" && <WebUITab profile={profile} />}
         {activeTab === "developer" && <DeveloperTab profile={profile} />}
         {activeTab === "brand" && <BrandTab profile={profile} />}
      </div>
    </div>
  );
}
