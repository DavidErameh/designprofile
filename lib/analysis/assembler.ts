import { randomUUID } from "crypto";
import type { DesignProfile } from "../types/profile";
import type { GeminiAnalysisResult } from "./gemini";

// ── Input Types ──────────────────────────────────────────────────────

interface ColorProfile {
  palette: Array<{ hex: string; role: string; usage_percent: number }>;
  ratios: { background: number; text: number; accent: number; interactive: number };
  wcag_pairs: Array<{
    foreground: string;
    background: string;
    ratio: number;
    level: "AA" | "AAA";
  }>;
}

interface CSSProfile {
  typography: {
    fonts: Array<{ family: string; role: string; fallback: string; weight: number }>;
    scale: Array<{ label: string; size: string }>;
  };
  spacing: {
    base_unit: number;
    scale: Array<{ label: string; value: number }>;
    grid: { columns: number; gutter: number; margin: number };
  };
  effects: {
    border_radius: { sm: string; md: string; lg: string; full: string };
    shadows: string[];
    transitions: string;
  };
}

export interface AssemblerInputs {
  colorProfile: ColorProfile;
  cssData?: CSSProfile;
  geminiData: GeminiAnalysisResult;
  sourceType: "url" | "image";
  sourceValue: string;
  processingMs: number;
  screenshotUrl?: string;
}

// ── Default values for image path ────────────────────────────────────

const DEFAULT_TYPOGRAPHY = {
  fonts: [{ family: "System UI", role: "primary", fallback: "sans-serif", weight: 1 }],
  scale: [
    { label: "xs", size: "12px" },
    { label: "sm", size: "14px" },
    { label: "base", size: "16px" },
    { label: "lg", size: "18px" },
    { label: "xl", size: "20px" },
    { label: "2xl", size: "24px" },
    { label: "3xl", size: "30px" },
    { label: "4xl", size: "36px" },
  ],
};

const DEFAULT_SPACING = {
  base_unit: 8,
  scale: [
    { label: "xs", value: 4 },
    { label: "sm", value: 8 },
    { label: "md", value: 16 },
    { label: "lg", value: 24 },
    { label: "xl", value: 32 },
    { label: "2xl", value: 48 },
    { label: "3xl", value: 64 },
    { label: "4xl", value: 96 },
  ],
  grid: { columns: 12, gutter: 16, margin: 24 },
};

const DEFAULT_EFFECTS = {
  border_radius: { sm: "2px", md: "4px", lg: "8px", full: "9999px" },
  shadows: ["0 1px 3px rgba(0,0,0,0.1)"],
  transitions: "0.2s ease",
};

// ── Main Function ────────────────────────────────────────────────────

export function buildProfile(inputs: AssemblerInputs): DesignProfile {
  const { colorProfile, cssData, geminiData, sourceType, sourceValue, processingMs } =
    inputs;

  // Typography: URL path uses cssData, image path uses Gemini-detected fonts
  let fonts = cssData?.typography.fonts ?? DEFAULT_TYPOGRAPHY.fonts;
  if (sourceType === "image" && geminiData.fonts_detected) {
    fonts = geminiData.fonts_detected.map((f) => ({
      family: f.name,
      role: f.role,
      fallback: "sans-serif",
      weight: f.confidence,
    }));
  }

  const scale = cssData?.typography.scale ?? DEFAULT_TYPOGRAPHY.scale;
  const spacing = cssData?.spacing ?? DEFAULT_SPACING;
  const effects = cssData?.effects ?? DEFAULT_EFFECTS;

  return {
    id: randomUUID(),
    source_type: sourceType,
    source_value: sourceValue,
    analyzed_at: new Date().toISOString(),
    processing_ms: processingMs,

    meta: {
      design_style: geminiData.design_style,
      brand_personality: geminiData.brand_personality,
      visual_weight: geminiData.visual_weight,
      layout_pattern: geminiData.layout_pattern,
      whitespace_usage: geminiData.whitespace_usage,
      quality_scores: geminiData.quality_scores,
      designer_insight: geminiData.designer_insight,
    },

    colors: {
      palette: colorProfile.palette,
      ratios: colorProfile.ratios,
      wcag_pairs: colorProfile.wcag_pairs,
    },

    typography: {
      fonts,
      scale,
      line_heights: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
      letter_spacing: { tight: "-0.025em", normal: "0em", wide: "0.05em" },
    },

    spacing,
    effects,

    components: geminiData.components ?? [],
  };
}
