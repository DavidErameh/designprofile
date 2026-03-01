/**
 * @jest-environment node
 */
import { analyzeColors } from "./colors";
import sharp from "sharp";

// Helper: create a simple test image as base64
async function createTestImage(): Promise<string> {
  // Create a 200x200 image with distinct color blocks
  const width = 200;
  const height = 200;
  const channels = 3;
  const data = Buffer.alloc(width * height * channels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (y < 100 && x < 100) {
        // Top-left: dark blue (#003366)
        data[idx] = 0;
        data[idx + 1] = 51;
        data[idx + 2] = 102;
      } else if (y < 100) {
        // Top-right: white (#FFFFFF)
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
      } else if (x < 100) {
        // Bottom-left: bright red (#FF3333)
        data[idx] = 255;
        data[idx + 1] = 51;
        data[idx + 2] = 51;
      } else {
        // Bottom-right: light gray (#CCCCCC)
        data[idx] = 204;
        data[idx + 1] = 204;
        data[idx + 2] = 204;
      }
    }
  }

  const buffer = await sharp(data, {
    raw: { width, height, channels },
  })
    .png()
    .toBuffer();

  return buffer.toString("base64");
}

describe("analyzeColors", () => {
  let testImageBase64: string;

  beforeAll(async () => {
    testImageBase64 = await createTestImage();
  });

  it("returns a palette with at least 2 entries", async () => {
    const result = await analyzeColors(testImageBase64);
    expect(result.palette.length).toBeGreaterThanOrEqual(2);
  });

  it("usage_percent values sum to 100 (±1)", async () => {
    const result = await analyzeColors(testImageBase64);
    const sum = result.palette.reduce((s, p) => s + p.usage_percent, 0);
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(1);
  });

  it("ratios values sum to 100", async () => {
    const result = await analyzeColors(testImageBase64);
    const { background, text, accent, interactive } = result.ratios;
    const sum = background + text + accent + interactive;
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(1);
  });

  it("returns wcag_pairs array", async () => {
    const result = await analyzeColors(testImageBase64);
    expect(Array.isArray(result.wcag_pairs)).toBe(true);
  });

  it("each palette entry has hex, role, and usage_percent", async () => {
    const result = await analyzeColors(testImageBase64);
    for (const entry of result.palette) {
      expect(entry).toHaveProperty("hex");
      expect(entry).toHaveProperty("role");
      expect(entry).toHaveProperty("usage_percent");
      expect(entry.hex).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("completes in under 2 seconds", async () => {
    const start = Date.now();
    await analyzeColors(testImageBase64);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });
});
