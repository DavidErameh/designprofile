import { analyzeWithGemini, GeminiAnalysisResult } from "./gemini";

// Mock test — does not call actual Gemini API
describe("analyzeWithGemini", () => {
  it("returns PARTIAL_FAILURE when no API key is configured", async () => {
    // Temporarily clear keys
    const key1 = process.env.GEMINI_API_KEY_1;
    const key2 = process.env.GEMINI_API_KEY_2;
    delete process.env.GEMINI_API_KEY_1;
    delete process.env.GEMINI_API_KEY_2;

    const result = await analyzeWithGemini("dGVzdA==", "url");
    expect(result._partial).toBe(true);
    expect(result.design_style).toBeNull();
    expect(result.quality_scores).toBeNull();

    // Restore
    if (key1) process.env.GEMINI_API_KEY_1 = key1;
    if (key2) process.env.GEMINI_API_KEY_2 = key2;
  });

  it("PARTIAL_FAILURE has all expected fields", async () => {
    delete process.env.GEMINI_API_KEY_1;
    delete process.env.GEMINI_API_KEY_2;

    const result = await analyzeWithGemini("dGVzdA==", "image");
    const expectedKeys: (keyof GeminiAnalysisResult)[] = [
      "design_style",
      "brand_personality",
      "visual_weight",
      "layout_pattern",
      "whitespace_usage",
      "quality_scores",
      "designer_insight",
      "components",
      "fonts_detected",
      "_partial",
    ];

    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }
  });
});
