"use client";

import {
  Radar,
  RadarChart as ReChartsRadar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

interface RadarChartProps {
  data: { axis: string; value: number }[];
  size?: number;
}

export default function RadarChart({ data, size = 280 }: RadarChartProps) {
  return (
    <div style={{ width: "100%", height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReChartsRadar data={data} cx="50%" cy="50%" outerRadius="80%">
          <PolarGrid stroke="#E5E5E5" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#737373", fontSize: 12, fontWeight: 500 }}
          />
          <Radar
            name="Design DNA"
            dataKey="value"
            stroke="#0066FF"
            strokeWidth={1.5}
            fill="#0066FF"
            fillOpacity={0.1}
          />
        </ReChartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
