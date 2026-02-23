import type { DesignProfile, ExportFormats } from "../types/profile";

// ── CSS Variables ────────────────────────────────────────────────────

function generateCSSVariables(profile: DesignProfile): string {
  const lines: string[] = [":root {"];

  // Colors
  profile.colors.palette.forEach((color, i) => {
    lines.push(`  --color-${color.role}-${i}: ${color.hex};`);
  });

  // Fonts
  profile.typography.fonts.forEach((font) => {
    lines.push(
      `  --font-${font.role}: "${font.family}", ${font.fallback};`
    );
  });

  // Spacing
  profile.spacing.scale.forEach((s) => {
    lines.push(`  --spacing-${s.label}: ${s.value}px;`);
  });

  // Border radius
  const br = profile.effects.border_radius;
  lines.push(`  --radius-sm: ${br.sm};`);
  lines.push(`  --radius-md: ${br.md};`);
  lines.push(`  --radius-lg: ${br.lg};`);
  lines.push(`  --radius-full: ${br.full};`);

  lines.push("}");
  return lines.join("\n");
}

// ── SCSS Variables ───────────────────────────────────────────────────

function generateSCSSVariables(profile: DesignProfile): string {
  const lines: string[] = [];

  profile.colors.palette.forEach((color, i) => {
    lines.push(`$color-${color.role}-${i}: ${color.hex};`);
  });

  profile.typography.fonts.forEach((font) => {
    lines.push(`$font-${font.role}: "${font.family}", ${font.fallback};`);
  });

  profile.spacing.scale.forEach((s) => {
    lines.push(`$spacing-${s.label}: ${s.value}px;`);
  });

  return lines.join("\n");
}

// ── Tailwind Config ──────────────────────────────────────────────────

function generateTailwindConfig(profile: DesignProfile): string {
  const colors: Record<string, string> = {};
  profile.colors.palette.forEach((color, i) => {
    colors[`${color.role}-${i}`] = color.hex;
  });

  const fontFamily: Record<string, string[]> = {};
  profile.typography.fonts.forEach((font) => {
    fontFamily[font.role] = [font.family, font.fallback];
  });

  const spacing: Record<string, string> = {};
  profile.spacing.scale.forEach((s) => {
    spacing[s.label] = `${s.value}px`;
  });

  const config = {
    theme: {
      extend: {
        colors,
        fontFamily,
        spacing,
        borderRadius: {
          sm: profile.effects.border_radius.sm,
          md: profile.effects.border_radius.md,
          lg: profile.effects.border_radius.lg,
          full: profile.effects.border_radius.full,
        },
      },
    },
  };

  return `module.exports = ${JSON.stringify(config, null, 2)}`;
}

// ── Figma Tokens (Tokens Studio v2) ──────────────────────────────────

function generateFigmaTokens(profile: DesignProfile): string {
  const tokens: Record<string, Record<string, { $value: string; $type: string }>> = {
    colors: {},
    typography: {},
    spacing: {},
  };

  profile.colors.palette.forEach((color) => {
    tokens.colors[color.role] = { $value: color.hex, $type: "color" };
  });

  profile.typography.fonts.forEach((font) => {
    tokens.typography[`font${font.role.charAt(0).toUpperCase() + font.role.slice(1)}`] = {
      $value: font.family,
      $type: "fontFamilies",
    };
  });

  profile.typography.scale.forEach((s) => {
    tokens.typography[`size${s.label.charAt(0).toUpperCase() + s.label.slice(1)}`] = {
      $value: s.size,
      $type: "fontSizes",
    };
  });

  profile.spacing.scale.forEach((s) => {
    tokens.spacing[s.label] = { $value: `${s.value}px`, $type: "spacing" };
  });

  return JSON.stringify({ global: tokens }, null, 2);
}

// ── Adobe ASE (minimal — color swatches only) ────────────────────────

function generateAdobeASE(profile: DesignProfile): string {
  // ASE binary format: simplified implementation
  // Header: ASEF (4 bytes) + version (4 bytes) + block count (4 bytes)
  // Each block: type (2 bytes) + length (4 bytes) + name + color model + values

  const colors = profile.colors.palette;
  const blocks: number[] = [];

  // Header: "ASEF"
  blocks.push(0x41, 0x53, 0x45, 0x46);
  // Version: 1.0
  blocks.push(0x00, 0x01, 0x00, 0x00);
  // Block count
  const count = colors.length;
  blocks.push((count >> 24) & 0xff, (count >> 16) & 0xff, (count >> 8) & 0xff, count & 0xff);

  for (const color of colors) {
    // Block type: 0x0001 (color entry)
    blocks.push(0x00, 0x01);

    // Parse hex to RGB floats
    const hex = color.hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Name as UTF-16BE null-terminated
    const name = color.role;
    const nameBytes: number[] = [];
    const nameLen = name.length + 1; // +1 for null terminator
    nameBytes.push((nameLen >> 8) & 0xff, nameLen & 0xff);
    for (const char of name) {
      nameBytes.push(0x00, char.charCodeAt(0));
    }
    nameBytes.push(0x00, 0x00); // null terminator

    // Color model: "RGB " (4 bytes)
    const colorModel = [0x52, 0x47, 0x42, 0x20];

    // RGB float values (4 bytes each, big-endian IEEE 754)
    const floatToBytes = (f: number): number[] => {
      const buf = Buffer.alloc(4);
      buf.writeFloatBE(f, 0);
      return [...buf];
    };

    const colorData = [...colorModel, ...floatToBytes(r), ...floatToBytes(g), ...floatToBytes(b)];

    // Color type: 0 = Global
    colorData.push(0x00, 0x00);

    // Block length
    const blockLen = nameBytes.length + colorData.length;
    blocks.push(
      (blockLen >> 24) & 0xff,
      (blockLen >> 16) & 0xff,
      (blockLen >> 8) & 0xff,
      blockLen & 0xff
    );

    blocks.push(...nameBytes, ...colorData);
  }

  return Buffer.from(blocks).toString("base64");
}

// ── Main Export Function ─────────────────────────────────────────────

export function generateExports(profile: DesignProfile): ExportFormats {
  return {
    css_variables: generateCSSVariables(profile),
    figma_tokens_json: generateFigmaTokens(profile),
    scss_variables: generateSCSSVariables(profile),
    tailwind_config: generateTailwindConfig(profile),
    adobe_ase: generateAdobeASE(profile),
  };
}
