import { buildProfile, AIAnalysisResult, AssemblerInputs } from "./assembler";

describe("buildProfile", () => {
  const mockColorProfile = {
    palette: [{ hex: "#000000", role: "background", usage_percent: 100 }],
    ratios: { background: 100, text: 0, accent: 0, interactive: 0 },
    wcag_pairs: []
  };

  const mockAiData: AIAnalysisResult = {
    design_style: "Minimal",
    brand_personality: ["Clean", "Modern"],
    visual_weight: "light",
    layout_pattern: "Single Column",
    whitespace_usage: "generous",
    quality_scores: {
      consistency: 10,
      hierarchy: 9,
      whitespace: 10,
      typography: 8,
      color_harmony: 9
    },
    designer_insight: "Excellent use of whitespace.",
    components: ["Navbar", "Footer"],
    fonts_detected: [
      { name: "Inter", role: "heading", confidence: 95 },
      { name: "Roboto", role: "body", confidence: 90 }
    ]
  };

  const baseInputs: AssemblerInputs = {
    colorProfile: mockColorProfile,
    aiData: mockAiData,
    sourceType: "image",
    sourceValue: "test.png",
    processingMs: 1234,
  };

  it("assembles a full DesignProfile from image inputs", () => {
    const profile = buildProfile(baseInputs);

    expect(profile.source_type).toBe("image");
    expect(profile.meta.design_style).toBe("Minimal");
    expect(profile.meta.brand_personality).toContain("Clean");
    expect(profile.typography.fonts.length).toBe(2);
    expect(profile.typography.fonts[0].family).toBe("Inter");
    expect(profile.colors.palette[0].hex).toBe("#000000");
  });

  it("uses provided cssData when sourceType is url", () => {
    const mockCssData = {
      typography: {
        fonts: [{ family: "Custom Font", role: "primary", fallback: "sans-serif", weight: 400 }],
        scale: [{ label: "base", size: "16px" }]
      },
      spacing: {
        base_unit: 8,
        scale: [{ label: "md", value: 16 }],
        grid: { columns: 12, gutter: 16, margin: 24 }
      },
      effects: {
        border_radius: { sm: "2px", md: "4px", lg: "8px", full: "9999px" },
        shadows: [],
        transitions: "0.2s"
      }
    };

    const urlInputs: AssemblerInputs = {
      ...baseInputs,
      sourceType: "url",
      cssData: mockCssData as any
    };

    const profile = buildProfile(urlInputs);

    expect(profile.source_type).toBe("url");
    expect(profile.typography.fonts[0].family).toBe("Custom Font");
  });

  it("handles missing fonts_detected in image path", () => {
    const inputsWithoutFonts: AssemblerInputs = {
      ...baseInputs,
      aiData: { ...mockAiData, fonts_detected: null }
    };

    const profile = buildProfile(inputsWithoutFonts);
    expect(profile.typography.fonts[0].family).toBe("System UI");
  });
});
