// ── Types ────────────────────────────────────────────────────────────

export interface RawCSSData {
  fonts: Record<string, number>;
  colors: Record<string, number>;
  spacing: number[];
  borderRadii: string[];
  shadows: string[];
}

interface FontEntry {
  family: string;
  role: "primary" | "secondary" | "code";
  fallback: string;
  weight: number;
}

interface TypographyScale {
  label: string;
  size: string;
}

interface SpacingScale {
  label: string;
  value: number;
}

interface BorderRadiusMap {
  sm: string;
  md: string;
  lg: string;
  full: string;
}

interface CSSProfile {
  typography: {
    fonts: FontEntry[];
    scale: TypographyScale[];
  };
  spacing: {
    base_unit: number;
    scale: SpacingScale[];
    grid: {
      columns: number;
      gutter: number;
      margin: number;
    };
  };
  effects: {
    border_radius: BorderRadiusMap;
    shadows: string[];
    transitions: string;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function detectBaseUnit(values: number[]): number {
  const filtered = values.filter((v) => v > 0 && v <= 64);
  if (filtered.length === 0) return 8;
  const g = filtered.reduce(gcd);
  const rounded = g <= 2 ? 4 : g <= 6 ? 4 : g <= 10 ? 8 : 8;
  return rounded;
}

function detectFallback(fontName: string): string {
  const lower = fontName.toLowerCase();
  if (lower.includes("mono") || lower.includes("code") || lower.includes("courier")) {
    return "monospace";
  }
  if (lower.includes("serif") && !lower.includes("sans")) {
    return "serif";
  }
  return "sans-serif";
}

function mostCommon<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const item of arr) {
    const key = String(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let maxKey = "";
  let maxCount = 0;
  for (const [key, count] of counts) {
    if (count > maxCount) {
      maxKey = key;
      maxCount = count;
    }
  }
  return arr.find((item) => String(item) === maxKey);
}

function clusterValues(values: number[], maxClusters: number): number[] {
  if (values.length === 0) return [];
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  if (sorted.length <= maxClusters) return sorted;

  // Simple downsampling: pick evenly spaced values
  const step = (sorted.length - 1) / (maxClusters - 1);
  const result: number[] = [];
  for (let i = 0; i < maxClusters; i++) {
    const idx = Math.round(i * step);
    result.push(sorted[idx]);
  }
  return result;
}

// ── Main Function ────────────────────────────────────────────────────

export function normalizeCSSData(cssData: RawCSSData): CSSProfile {
  // ── 1. Fonts ──────────────────────────────────────────────────────
  const sortedFonts = Object.entries(cssData.fonts)
    .sort((a, b) => b[1] - a[1]);

  const fonts: FontEntry[] = [];

  if (sortedFonts.length > 0) {
    const [primaryName, primaryWeight] = sortedFonts[0];
    fonts.push({
      family: primaryName,
      role: "primary",
      fallback: detectFallback(primaryName),
      weight: primaryWeight,
    });

    // Secondary: second font if area > 10% of primary
    if (sortedFonts.length > 1) {
      const [secondaryName, secondaryWeight] = sortedFonts[1];
      if (secondaryWeight > primaryWeight * 0.1) {
        const isCode = detectFallback(secondaryName) === "monospace";
        fonts.push({
          family: secondaryName,
          role: isCode ? "code" : "secondary",
          fallback: detectFallback(secondaryName),
          weight: secondaryWeight,
        });
      }
    }
  }

  // ── 2. Typography Scale ───────────────────────────────────────────
  const scaleLabels = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"];
  const typographyScale: TypographyScale[] = [];

  // We don't have fontSize in the raw cssData from Playwright extraction
  // Default reasonable scale based on common web patterns
  const defaultSizes = [12, 14, 16, 18, 20, 24, 30, 36];
  const sizes = defaultSizes.slice(0, 8);

  for (let i = 0; i < sizes.length; i++) {
    typographyScale.push({
      label: scaleLabels[i],
      size: `${Math.round(sizes[i] * 2) / 2}px`,
    });
  }

  // ── 3. Spacing ────────────────────────────────────────────────────
  const baseUnit = detectBaseUnit(cssData.spacing);

  const spacingLabels = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"];
  const spacingMultipliers = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32];

  const spacingScale: SpacingScale[] = spacingMultipliers
    .map((m, i) => ({
      label: spacingLabels[i],
      value: baseUnit * m,
    }))
    .filter((s) => s.value <= 256)
    .slice(0, 10);

  // Grid defaults
  const gutterValue = mostCommon(cssData.spacing.filter((v) => v >= 8 && v <= 32)) || 16;
  const marginValue = mostCommon(cssData.spacing.filter((v) => v >= 16 && v <= 64)) || 24;

  // ── 4. Effects ────────────────────────────────────────────────────

  // Border radius
  const radiusValues = cssData.borderRadii
    .map((br) => parseInt(br))
    .filter((v) => !isNaN(v) && v > 0)
    .sort((a, b) => a - b);

  const uniqueRadii = [...new Set(radiusValues)];
  const borderRadius: BorderRadiusMap = {
    sm: uniqueRadii[0] ? `${uniqueRadii[0]}px` : "2px",
    md: uniqueRadii[Math.floor(uniqueRadii.length * 0.33)] ? `${uniqueRadii[Math.floor(uniqueRadii.length * 0.33)]}px` : "4px",
    lg: uniqueRadii[Math.floor(uniqueRadii.length * 0.66)] ? `${uniqueRadii[Math.floor(uniqueRadii.length * 0.66)]}px` : "8px",
    full: "9999px",
  };

  // Shadows — top 3 by frequency
  const shadowCounts = new Map<string, number>();
  for (const sh of cssData.shadows) {
    shadowCounts.set(sh, (shadowCounts.get(sh) || 0) + 1);
  }
  const topShadows = [...shadowCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([shadow]) => shadow);

  // Transitions
  const transitions = "0.2s ease";

  return {
    typography: {
      fonts,
      scale: typographyScale,
    },
    spacing: {
      base_unit: baseUnit,
      scale: spacingScale,
      grid: {
        columns: 12,
        gutter: gutterValue,
        margin: marginValue,
      },
    },
    effects: {
      border_radius: borderRadius,
      shadows: topShadows,
      transitions,
    },
  };
}
