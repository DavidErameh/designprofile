import { generateExports } from "./exports";
import type { DesignProfile } from "../types/profile";

const mockProfile: DesignProfile = {
  id: "test-id",
  source_type: "url",
  source_value: "https://example.com",
  analyzed_at: new Date().toISOString(),
  processing_ms: 1000,
  meta: {
    design_style: "Minimal",
    brand_personality: ["Clean", "Professional"],
    visual_weight: "light",
    layout_pattern: "Hero + Features Grid",
    whitespace_usage: "generous",
    quality_scores: {
      consistency: 8,
      hierarchy: 7,
      whitespace: 9,
      typography: 8,
      color_harmony: 7,
    },
    designer_insight: "Clean minimal design with generous whitespace.",
  },
  colors: {
    palette: [
      { hex: "#FFFFFF", role: "background", usage_percent: 60 },
      { hex: "#1A1A1A", role: "text", usage_percent: 25 },
      { hex: "#0066FF", role: "accent", usage_percent: 10 },
      { hex: "#F5F5F5", role: "interactive", usage_percent: 5 },
    ],
    ratios: { background: 60, text: 25, accent: 10, interactive: 5 },
    wcag_pairs: [
      {
        foreground: "#1A1A1A",
        background: "#FFFFFF",
        ratio: 17.15,
        level: "AAA",
      },
    ],
  },
  typography: {
    fonts: [
      { family: "Inter", role: "primary", fallback: "sans-serif", weight: 500000 },
      { family: "JetBrains Mono", role: "code", fallback: "monospace", weight: 30000 },
    ],
    scale: [
      { label: "xs", size: "12px" },
      { label: "sm", size: "14px" },
      { label: "base", size: "16px" },
      { label: "lg", size: "18px" },
      { label: "xl", size: "20px" },
      { label: "2xl", size: "24px" },
    ],
    line_heights: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
    letter_spacing: { tight: "-0.025em", normal: "0em", wide: "0.05em" },
  },
  spacing: {
    base_unit: 8,
    scale: [
      { label: "xs", value: 4 },
      { label: "sm", value: 8 },
      { label: "md", value: 16 },
      { label: "lg", value: 24 },
      { label: "xl", value: 32 },
      { label: "2xl", value: 48 },
    ],
    grid: { columns: 12, gutter: 16, margin: 24 },
  },
  effects: {
    border_radius: { sm: "2px", md: "4px", lg: "8px", full: "9999px" },
    shadows: ["0 1px 3px rgba(0,0,0,0.1)"],
    transitions: "0.2s ease",
  },
  components: ["navbar", "hero", "feature cards", "footer"],
};

describe("generateExports", () => {
  const exports = generateExports(mockProfile);

  it("returns all 5 export format keys", () => {
    expect(exports).toHaveProperty("css_variables");
    expect(exports).toHaveProperty("figma_tokens_json");
    expect(exports).toHaveProperty("scss_variables");
    expect(exports).toHaveProperty("tailwind_config");
    expect(exports).toHaveProperty("adobe_ase");
  });

  it("css_variables contains --color- and --font- variables", () => {
    expect(exports.css_variables).toContain("--color-");
    expect(exports.css_variables).toContain("--font-");
    expect(exports.css_variables).toContain(":root");
  });

  it("scss_variables contains $color- and $font- variables", () => {
    expect(exports.scss_variables).toContain("$color-");
    expect(exports.scss_variables).toContain("$font-");
  });

  it("tailwind_config is parseable as a module", () => {
    expect(exports.tailwind_config).toContain("module.exports");
    // Extract JSON part
    const jsonPart = exports.tailwind_config.replace("module.exports = ", "");
    expect(() => JSON.parse(jsonPart)).not.toThrow();
  });

  it("figma_tokens_json is valid JSON with a 'global' key", () => {
    const parsed = JSON.parse(exports.figma_tokens_json);
    expect(parsed).toHaveProperty("global");
    expect(parsed.global).toHaveProperty("colors");
    expect(parsed.global).toHaveProperty("typography");
    expect(parsed.global).toHaveProperty("spacing");
  });

  it("adobe_ase is a non-empty base64 string", () => {
    expect(exports.adobe_ase.length).toBeGreaterThan(0);
    // Validate it's valid base64
    expect(() => Buffer.from(exports.adobe_ase, "base64")).not.toThrow();
  });
});
