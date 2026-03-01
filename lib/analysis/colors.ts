import { Vibrant } from 'node-vibrant/node';
import sharp from "sharp";

// ── Hex/RGB Helpers ──────────────────────────────────────────────────

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => {
        const hex = Math.round(Math.max(0, Math.min(255, c)))
          .toString(16)
          .padStart(2, "0");
        return hex;
      })
      .join("")
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

// ── WCAG Contrast ────────────────────────────────────────────────────

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// ── Types ────────────────────────────────────────────────────────────

interface PaletteEntry {
  hex: string;
  role: string;
  usage_percent: number;
}

interface WcagPair {
  foreground: string;
  background: string;
  ratio: number;
  level: "AA" | "AAA";
}

interface ColorRatios {
  background: number;
  text: number;
  accent: number;
  interactive: number;
}

interface ColorAnalysisResult {
  palette: PaletteEntry[];
  ratios: ColorRatios;
  wcag_pairs: WcagPair[];
}

// ── Color Distance ───────────────────────────────────────────────────

function colorDistance(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// ── Main Function ────────────────────────────────────────────────────

export async function analyzeColors(
  imageBase64: string
): Promise<ColorAnalysisResult> {
  // 1. Convert base64 to buffer, resize for performance
  const inputBuffer = Buffer.from(imageBase64, "base64");
  const resizedBuffer = await sharp(inputBuffer)
    .resize({ width: 800, withoutEnlargement: true })
    .png()
    .toBuffer();

  // 2. Run Vibrant palette extraction (6 semantic swatches)
  const vibrantPalette = await Vibrant.from(resizedBuffer).getPalette();

  // 3. Map Vibrant swatches to semantic roles
  const swatchMap: Record<string, { role: string; hex: string }> = {};

  const vibrantMapping: Array<{
    key: keyof typeof vibrantPalette;
    role: string;
  }> = [
    { key: "Vibrant", role: "accent" },
    { key: "DarkMuted", role: "text" },
    { key: "LightMuted", role: "background" },
    { key: "DarkVibrant", role: "primaryDark" },
    { key: "LightVibrant", role: "primaryLight" },
    { key: "Muted", role: "secondary" },
  ];

  for (const { key, role } of vibrantMapping) {
    const swatch = vibrantPalette[key];
    if (swatch) {
      const hex = swatch.hex;
      swatchMap[role] = { role, hex };
    }
  }

  // 4. Extract dominant colors via sharp raw pixel analysis
  const { data, info } = await sharp(resizedBuffer)
    .resize({ width: 100, withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const colorCounts: Record<string, number> = {};
  const pixelCount = info.width * info.height;

  for (let i = 0; i < data.length; i += info.channels) {
    // Quantize to reduce unique colors (round to nearest 16)
    const r = Math.round(data[i] / 16) * 16;
    const g = Math.round(data[i + 1] / 16) * 16;
    const b = Math.round(data[i + 2] / 16) * 16;
    const hex = rgbToHex(r, g, b);
    colorCounts[hex] = (colorCounts[hex] || 0) + 1;
  }

  // Sort by frequency, take top 12
  const sortedColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const totalPopulation = sortedColors.reduce((sum, [, count]) => sum + count, 0);

  // 5. Assign roles based on closest Vibrant swatch
  const roleColors: Record<string, string[]> = {
    background: [],
    text: [],
    accent: [],
    interactive: [],
  };

  const palette: PaletteEntry[] = sortedColors.map(([hex, count]) => {
    const usage_percent = Math.round((count / totalPopulation) * 100);

    // Find closest swatch role
    let closestRole = "background"; // default
    let closestDistance = Infinity;

    for (const [role, swatch] of Object.entries(swatchMap)) {
      const dist = colorDistance(hex, swatch.hex);
      if (dist < closestDistance) {
        closestDistance = dist;
        const mappedRole =
          role === "text"
            ? "text"
            : role === "background"
              ? "background"
              : role === "accent"
                ? "accent"
                : role === "primaryDark" || role === "primaryLight"
                  ? "interactive"
                  : "background";
        closestRole = mappedRole;
      }
    }

    roleColors[closestRole].push(hex);

    return { hex, role: closestRole, usage_percent };
  });

  // 6. Normalize usage_percent to sum to 100
  const totalPercent = palette.reduce((sum, p) => sum + p.usage_percent, 0);
  if (totalPercent > 0 && totalPercent !== 100) {
    const diff = 100 - totalPercent;
    palette[0].usage_percent += diff;
  }

  // 7. Compute ratio breakdown
  const ratios: ColorRatios = {
    background: 0,
    text: 0,
    accent: 0,
    interactive: 0,
  };

  for (const entry of palette) {
    ratios[entry.role as keyof ColorRatios] += entry.usage_percent;
  }

  // 8. Compute WCAG pairs from semantic palette
  const semanticHexes = Object.values(swatchMap).map((s) => s.hex);
  const wcag_pairs: WcagPair[] = [];

  for (let i = 0; i < semanticHexes.length; i++) {
    for (let j = i + 1; j < semanticHexes.length; j++) {
      const ratio = getContrastRatio(semanticHexes[i], semanticHexes[j]);
      if (ratio >= 4.5) {
        wcag_pairs.push({
          foreground: semanticHexes[i],
          background: semanticHexes[j],
          ratio: Math.round(ratio * 100) / 100,
          level: ratio >= 7.0 ? "AAA" : "AA",
        });
      }
    }
  }

  return { palette, ratios, wcag_pairs };
}