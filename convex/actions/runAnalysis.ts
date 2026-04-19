"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal, api } from "../_generated/api";

// Analysis logic functions
import { analyzeColors } from "../lib/analysis/colors";
import { normalizeCSSData } from "../lib/analysis/css";
import { analyzeWithGemini } from "../lib/analysis/gemini";
import { buildProfile } from "../lib/analysis/assembler";
import { generateExports } from "../lib/analysis/exports";

// Crypto for SHA-256
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

export const runAnalysis = internalAction({
  args: { analysisId: v.id("analyses") },
  handler: async (ctx, { analysisId }) => {
    const start = Date.now();
    try {
      // 1. Set status to processing
      await ctx.runMutation(internal.analyses.setStatus, {
        id: analysisId,
        status: "processing",
      });

      // 2. Fetch analysis document
      const analysis = await ctx.runQuery(api.analyses.getAnalysis, { id: analysisId });
      if (!analysis) throw new Error("Analysis not found");

      let finalProfile: any = null;

      if (analysis.sourceType === "url") {
        // ── URL Path ──────────────────────────────────────────────────
        
        // a. Hash sourceValue
        const urlHash = await sha256(analysis.sourceValue);

        // b. Check urlCache
        const cachedProfile = await ctx.runQuery(api.urlCache.getCache, { urlHash });

        // c. If cache hit
        if (cachedProfile) {
          await ctx.runMutation(internal.analyses.completeAnalysis, {
            id: analysisId,
            profile: cachedProfile,
            processingMs: Date.now() - start,
          });
          return;
        }

        // d. If cache miss: POST to Playwright service
        const pwUrl = process.env.PLAYWRIGHT_SERVICE_URL;
        const pwSecret = process.env.PLAYWRIGHT_SECRET;
        
        if (!pwUrl || !pwSecret) {
          throw new Error("Playwright service missing config");
        }

        const res = await fetch(`${pwUrl}/extract`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": pwSecret,
          },
          body: JSON.stringify({ url: analysis.sourceValue }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Playwright extraction failed: ${res.status} ${text}`);
        }

        const extractionData = await res.json();
        const screenshotBase64 = extractionData.screenshot;
        const rawCssData = extractionData.cssData;

        // Perform analysis pipeline
        const colorProfile = await analyzeColors(screenshotBase64);
        const cssProfile = normalizeCSSData(rawCssData);
        const geminiData = await analyzeWithGemini(screenshotBase64, "url");

        finalProfile = buildProfile({
          colorProfile,
          cssData: cssProfile,
          geminiData,
          sourceType: "url",
          sourceValue: analysis.sourceValue,
          processingMs: Date.now() - start,
          screenshotUrl: extractionData.screenshot, // For URL path, playwright service returns it
        });

        // Add exports
        finalProfile.exports = generateExports(finalProfile);

        // Set cache for URL
        await ctx.runMutation(api.urlCache.setCache, {
          urlHash,
          profile: finalProfile,
        });

      } else {
        // ── Image Path ────────────────────────────────────────────────
        // For images, the base64 data is in sourceValue (stored as screenshotUrl on creation)
        const screenshotBase64 = analysis.sourceValue;
        
        if (!screenshotBase64) throw new Error("Image analysis missing screenshot data");

        // Perform analysis pipeline
        const colorProfile = await analyzeColors(screenshotBase64);
        const geminiData = await analyzeWithGemini(screenshotBase64, "image");

        finalProfile = buildProfile({
          colorProfile,
          // CSS data is omitted for image path
          geminiData,
          sourceType: "image",
          sourceValue: analysis.sourceValue,
          processingMs: Date.now() - start,
        });

        // Add exports
        finalProfile.exports = generateExports(finalProfile);
      }

      // Finish the analysis
      await ctx.runMutation(internal.analyses.completeAnalysis, {
        id: analysisId,
        profile: finalProfile,
        processingMs: Date.now() - start,
      });
      
    } catch (e) {
      console.error("runAnalysis error:", e);
      await ctx.runMutation(internal.analyses.setError, {
        id: analysisId,
        errorMessage: e instanceof Error ? e.message : "Unknown error",
      });
    }
  },
});
