// ── DesignProfile — canonical schema ──────────────────────────────────

export interface DesignProfile {
  id: string;
  source_type: "url" | "image";
  source_value: string;
  analyzed_at: string;
  processing_ms: number;
  screenshot_url?: string;

  meta: {
    design_style: string | null;
    brand_personality: string[] | null;
    visual_weight: "light" | "medium" | "heavy" | null;
    layout_pattern: string | null;
    whitespace_usage: "generous" | "moderate" | "tight" | null;
    quality_scores: QualityScores | null;
    designer_insight: string | null;
  };

  colors: {
    palette: PaletteEntry[];
    ratios: ColorRatios;
    wcag_pairs: WcagPair[];
  };

  typography: {
    fonts: FontEntry[];
    scale: TypographyScale[];
    line_heights: Record<string, number>;
    letter_spacing: Record<string, string>;
  };

  spacing: {
    base_unit: number;
    scale: SpacingScale[];
    grid: GridConfig;
  };

  effects: {
    border_radius: BorderRadiusMap;
    shadows: string[];
    transitions: string;
  };

  components: string[];
}

// ── Sub-types ────────────────────────────────────────────────────────

export interface QualityScores {
  consistency: number;
  hierarchy: number;
  whitespace: number;
  typography: number;
  color_harmony: number;
}

export interface PaletteEntry {
  hex: string;
  role: string;
  usage_percent: number;
}

export interface ColorRatios {
  background: number;
  text: number;
  accent: number;
  interactive: number;
}

export interface WcagPair {
  foreground: string;
  background: string;
  ratio: number;
  level: "AA" | "AAA";
}

export interface FontEntry {
  family: string;
  role: string;
  fallback: string;
  weight: number;
}

export interface TypographyScale {
  label: string;
  size: string;
}

export interface SpacingScale {
  label: string;
  value: number;
}

export interface GridConfig {
  columns: number;
  gutter: number;
  margin: number;
}

export interface BorderRadiusMap {
  sm: string;
  md: string;
  lg: string;
  full: string;
}

export interface ExportFormats {
  css_variables: string;
  figma_tokens_json: string;
  scss_variables: string;
  tailwind_config: string;
  adobe_ase: string;
}
