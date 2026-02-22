"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ColorProfile } from "../../../../../lib/types/profile";

export default function ColorRatioPie({ ratios }: { ratios: ColorProfile["ratios"] }) {
  const data = [
    { name: "Background", value: ratios.background },
    { name: "Text", value: ratios.text },
    { name: "Primary/Accent", value: ratios.primary },
    { name: "Interactive", value: ratios.interactive },
  ].filter((d) => d.value > 0);

  // Monochrome blues based on accent #0066FF
  const COLORS = ["#E5F0FF", "#99C2FF", "#3385FF", "#0066FF"];

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: "#0A0A0A", border: "1px solid #333", borderRadius: "8px", fontSize: "12px", color: "#F5F5F5" }}
              itemStyle={{ color: "#F5F5F5" }}
              formatter={(value: number) => [`${Math.round(value * 100)}%`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 max-w-sm">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span className="text-[12px] font-mono text-[#737373]">
              {entry.name} <span className="text-[var(--fg)] ml-1">{Math.round(entry.value * 100)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
