import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Round-Robin Key Selection ────────────────────────────────────────

let callCounter = 0;

function getApiKey(): string {
  const keys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    throw new Error("No GEMINI_API_KEY configured");
  }

  const key = keys[callCounter % keys.length];
  callCounter++;
  console.log(`[gemini] Using API key ${(callCounter % keys.length) + 1}`);
  return key;
}

// ── Prompts ──────────────────────────────────────────────────────────

const DESIGN_ANALYSIS_PROMPT = `
You are a senior design systems expert analyzing a design screenshot.
Return ONLY valid JSON matching this exact schema. No markdown. No explanation.
{
  "design_style": "string (e.g. 'Minimal', 'Brutalist', 'Corporate', 'Playful')",
  "brand_personality": ["string (3-5 adjectives)"],
  "visual_weight": "light" | "medium" | "heavy",
  "layout_pattern": "string (e.g. 'Hero + Features Grid', 'Dashboard', 'Magazine')",
  "whitespace_usage": "generous" | "moderate" | "tight",
  "quality_scores": {
    "consistency": "number 1-10",
    "hierarchy": "number 1-10",
    "whitespace": "number 1-10",
    "typography": "number 1-10",
    "color_harmony": "number 1-10"
  },
  "designer_insight": "string (max 2 sentences describing the most notable design decision)",
  "components": ["string (list of UI components visible, e.g. 'navbar', 'hero', 'card grid', 'footer')"]
}`;

const IMAGE_FONT_PROMPT = `
You are a senior design systems expert analyzing a design screenshot.
Return ONLY valid JSON matching this exact schema. No markdown. No explanation.
{
  "design_style": "string (e.g. 'Minimal', 'Brutalist', 'Corporate', 'Playful')",
  "brand_personality": ["string (3-5 adjectives)"],
  "visual_weight": "light" | "medium" | "heavy",
  "layout_pattern": "string (e.g. 'Hero + Features Grid', 'Dashboard', 'Magazine')",
  "whitespace_usage": "generous" | "moderate" | "tight",
  "quality_scores": {
    "consistency": "number 1-10",
    "hierarchy": "number 1-10",
    "whitespace": "number 1-10",
    "typography": "number 1-10",
    "color_harmony": "number 1-10"
  },
  "designer_insight": "string (max 2 sentences describing the most notable design decision)",
  "components": ["string (list of UI components visible)"],
  "fonts_detected": [{"name": "string", "role": "heading|body|accent", "confidence": "number 0-100"}]
}`;

// ── Types ────────────────────────────────────────────────────────────

interface QualityScores {
  consistency: number;
  hierarchy: number;
  whitespace: number;
  typography: number;
  color_harmony: number;
}

interface FontDetected {
  name: string;
  role: "heading" | "body" | "accent";
  confidence: number;
}

interface GeminiAnalysisResult {
  design_style: string | null;
  brand_personality: string[] | null;
  visual_weight: "light" | "medium" | "heavy" | null;
  layout_pattern: string | null;
  whitespace_usage: "generous" | "moderate" | "tight" | null;
  quality_scores: QualityScores | null;
  designer_insight: string | null;
  components: string[] | null;
  fonts_detected?: FontDetected[] | null;
  _partial: boolean;
}

// ── Partial Failure Default ──────────────────────────────────────────

const PARTIAL_FAILURE: GeminiAnalysisResult = {
  design_style: null,
  brand_personality: null,
  visual_weight: null,
  layout_pattern: null,
  whitespace_usage: null,
  quality_scores: null,
  designer_insight: null,
  components: null,
  fonts_detected: null,
  _partial: true,
};

// ── Validation ───────────────────────────────────────────────────────

function validateScores(scores: unknown): QualityScores | null {
  if (!scores || typeof scores !== "object") return null;
  const s = scores as Record<string, unknown>;
  const keys = ["consistency", "hierarchy", "whitespace", "typography", "color_harmony"];
  const result: Record<string, number> = {};

  for (const key of keys) {
    const val = Number(s[key]);
    if (isNaN(val) || val < 1 || val > 10) return null;
    result[key] = Math.round(val);
  }

  return result as unknown as QualityScores;
}

function validateResult(
  raw: Record<string, unknown>,
  sourceType: "url" | "image"
): GeminiAnalysisResult {
  return {
    design_style: typeof raw.design_style === "string" ? raw.design_style : null,
    brand_personality: Array.isArray(raw.brand_personality)
      ? raw.brand_personality.filter((s): s is string => typeof s === "string")
      : null,
    visual_weight: ["light", "medium", "heavy"].includes(raw.visual_weight as string)
      ? (raw.visual_weight as "light" | "medium" | "heavy")
      : null,
    layout_pattern: typeof raw.layout_pattern === "string" ? raw.layout_pattern : null,
    whitespace_usage: ["generous", "moderate", "tight"].includes(
      raw.whitespace_usage as string
    )
      ? (raw.whitespace_usage as "generous" | "moderate" | "tight")
      : null,
    quality_scores: validateScores(raw.quality_scores),
    designer_insight: typeof raw.designer_insight === "string"
      ? raw.designer_insight
      : null,
    components: Array.isArray(raw.components)
      ? raw.components.filter((s): s is string => typeof s === "string")
      : null,
    fonts_detected:
      sourceType === "image" && Array.isArray(raw.fonts_detected)
        ? raw.fonts_detected
        : null,
    _partial: false,
  };
}

// ── Main Function ────────────────────────────────────────────────────

export async function analyzeWithGemini(
  imageBase64: string,
  sourceType: "url" | "image"
): Promise<GeminiAnalysisResult> {
  try {
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-05-20",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 1500,
      },
    });

    const prompt = sourceType === "image" ? IMAGE_FONT_PROMPT : DESIGN_ANALYSIS_PROMPT;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/png",
          data: imageBase64,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("[gemini] Failed to parse JSON response:", text.slice(0, 200));
      return { ...PARTIAL_FAILURE };
    }

    return validateResult(parsed, sourceType);
  } catch (err) {
    console.error(
      `[gemini] Analysis failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return { ...PARTIAL_FAILURE };
  }
}

export type { GeminiAnalysisResult, QualityScores, FontDetected };
