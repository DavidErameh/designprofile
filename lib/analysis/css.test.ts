import { normalizeCSSData, RawCSSData } from "./css";

const mockCSSData: RawCSSData = {
  fonts: {
    Inter: 500000,
    "JetBrains Mono": 30000,
    Georgia: 5000,
  },
  colors: {
    "rgb(255, 255, 255)": 800000,
    "rgb(0, 0, 0)": 200000,
    "rgb(0, 102, 255)": 50000,
  },
  spacing: [4, 8, 8, 12, 16, 16, 16, 24, 32, 48, 64],
  borderRadii: ["4px", "4px", "8px", "8px", "8px", "12px", "16px", "9999px"],
  shadows: [
    "0 1px 3px rgba(0,0,0,0.1)",
    "0 1px 3px rgba(0,0,0,0.1)",
    "0 4px 6px rgba(0,0,0,0.1)",
    "0 10px 15px rgba(0,0,0,0.1)",
  ],
};

describe("normalizeCSSData", () => {
  const result = normalizeCSSData(mockCSSData);

  it("returns typography with at least 1 font", () => {
    expect(result.typography.fonts.length).toBeGreaterThanOrEqual(1);
  });

  it("primary font is Inter", () => {
    expect(result.typography.fonts[0].family).toBe("Inter");
    expect(result.typography.fonts[0].role).toBe("primary");
  });

  it("secondary font is JetBrains Mono with code role", () => {
    const secondary = result.typography.fonts.find(
      (f) => f.family === "JetBrains Mono"
    );
    expect(secondary).toBeDefined();
    expect(secondary?.role).toBe("code");
  });

  it("spacing base_unit is 4 or 8", () => {
    expect([4, 8]).toContain(result.spacing.base_unit);
  });

  it("spacing scale has between 6 and 10 entries", () => {
    expect(result.spacing.scale.length).toBeGreaterThanOrEqual(6);
    expect(result.spacing.scale.length).toBeLessThanOrEqual(10);
  });

  it("effects.border_radius has sm, md, lg, full keys", () => {
    expect(result.effects.border_radius).toHaveProperty("sm");
    expect(result.effects.border_radius).toHaveProperty("md");
    expect(result.effects.border_radius).toHaveProperty("lg");
    expect(result.effects.border_radius).toHaveProperty("full");
    expect(result.effects.border_radius.full).toBe("9999px");
  });

  it("shadows has at most 3 entries", () => {
    expect(result.effects.shadows.length).toBeLessThanOrEqual(3);
    expect(result.effects.shadows.length).toBeGreaterThan(0);
  });

  it("transitions is a valid CSS value", () => {
    expect(result.effects.transitions).toBe("0.2s ease");
  });

  it("grid has 12 columns", () => {
    expect(result.spacing.grid.columns).toBe(12);
  });
});
