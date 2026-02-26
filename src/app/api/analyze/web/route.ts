import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { analyzeWebScreenshot, analyzeUXTactics } from '../../../../../lib/analysis/mistral';
import { buildProfile } from '../../../../../lib/analysis/assembler';
import { normalizeCSSData } from '../../../../../lib/analysis/css';
import { analyzeColors } from '../../../../../lib/analysis/colors';
import { convex } from '../../../../../lib/convex-client';
import { internal } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';

export async function POST(req: NextRequest) {
  let browser;
  try {
    const { url, analysisId } = await req.json();

    if (!url || !analysisId) {
      return NextResponse.json({ error: 'Missing url or analysisId' }, { status: 400 });
    }

    const id = analysisId as Id<"analyses">;

    // 1. Set status to processing
    await convex.mutation(internal.analyses.setStatus, { id, status: "processing" });
    await convex.mutation(internal.analyses.setStage, { id, stage: "Launching headless browser..." });

    const start = Date.now();

    // 2. Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await convex.mutation(internal.analyses.setStage, { id, stage: `Navigating to ${url}...` });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // 3. Extraction Phase
    await convex.mutation(internal.analyses.setStage, { id, stage: "Extracting CSS, fonts and taking screenshot..." });
    // a. Screenshot
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 85,
      fullPage: false,
    });
    const base64Screenshot = Buffer.from(screenshot).toString('base64');

    // b. CSS & DOM & Fonts
    const [cssData, fonts, domData] = await Promise.all([
      extractCSSFromPage(page),
      extractFonts(page),
      extractDOMStructure(page)
    ]);

    // 4. Analysis Phase (AI)
    await convex.mutation(internal.analyses.setStage, { id, stage: "Running Mistral Vision & UX analysis..." });
    const [visualProfile, uxProfile, colorProfile] = await Promise.all([
      analyzeWebScreenshot(base64Screenshot, { cssData, fonts, domData }),
      analyzeUXTactics({ cssData, fonts, domData, url }),
      analyzeColors(base64Screenshot)
    ]);

    await convex.mutation(internal.analyses.setStage, { id, stage: "Assembling final profile..." });

    // 5. Normalization & Bridge
    const cssProfile = normalizeCSSData({
      fonts: fonts.detected.reduce((acc: any, f: string) => ({ ...acc, [f]: 100 }), {}),
      colors: cssData.colorVariables,
      spacing: [8, 16, 24, 32], // Placeholder or extracted
      borderRadii: ["4px", "8px"],
      shadows: []
    } as any);

    const aiData: any = {
      design_style: visualProfile.visualStyle?.styleCategory,
      brand_personality: visualProfile.brandPersonality,
      visual_weight: "medium",
      layout_pattern: visualProfile.composition?.layoutPattern,
      whitespace_usage: visualProfile.visualStyle?.spacing,
      quality_scores: {
        consistency: 8,
        hierarchy: 8,
        whitespace: 8,
        typography: visualProfile.typography?.readability || 8,
        color_harmony: 8,
      },
      designer_insight: visualProfile.summary,
      components: visualProfile.composition?.navigationStyle ? [visualProfile.composition.navigationStyle] : [],
    };

    // 6. Assemble Profile
    const finalProfile = buildProfile({
      colorProfile,
      cssData: cssProfile,
      aiData,
      sourceType: "url",
      sourceValue: url,
      processingMs: Date.now() - start,
    });
    
    // Add extra Mistral data to profile if needed (customizing the profile)
    (finalProfile as any).ux_tactics = uxProfile;

    // 7. Complete Analysis
    await convex.mutation(internal.analyses.completeAnalysis, {
      id,
      profile: finalProfile,
      processingMs: Date.now() - start,
      screenshotUrl: `data:image/jpeg;base64,${base64Screenshot}` // For URL path, we store the screenshot as data URL if no storage is available
    });

    await browser.close();

    return NextResponse.json({ success: true, profile: finalProfile });

  } catch (error: any) {
    if (browser) await browser.close();
    console.error('Web analysis API error:', error);
    // Try to set error in convex if we have the ID
    try {
        const body = await req.json();
        if (body.analysisId) {
            await convex.mutation(internal.analyses.setError, {
                id: body.analysisId as Id<"analyses">,
                errorMessage: error.message || "Unknown error during web analysis",
            });
        }
    } catch {}
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── Extraction Helpers (from guide) ────────────────────────────────

async function extractCSSFromPage(page: any) {
  return await page.evaluate(() => {
    const variables: Record<string, string> = {};
    const root = document.documentElement;
    const rootStyles = getComputedStyle(root);

    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i];
      if (prop.startsWith('--')) {
        variables[prop] = rootStyles.getPropertyValue(prop).trim();
      }
    }

    const colorVars: Record<string, string> = {};
    const colorRegex = /#[0-9A-Fa-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(/;
    for (const [key, value] of Object.entries(variables)) {
      if (colorRegex.test(value)) {
        colorVars[key] = value;
      }
    }

    const bodyStyles = getComputedStyle(document.body);

    return {
      variables,
      colorVariables: colorVars,
      variableCount: Object.keys(variables).length,
      bodyBackground: bodyStyles.backgroundColor,
      bodyColor: bodyStyles.color,
      bodyFont: bodyStyles.fontFamily,
      bodyFontSize: bodyStyles.fontSize,
      bodyLineHeight: bodyStyles.lineHeight,
    };
  });
}

async function extractFonts(page: any) {
  return await page.evaluate(() => {
    const fontFamilies = new Set<string>();
    const selectors = ['body', 'h1', 'h2', 'h3', 'p', 'button'];
    selectors.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        const font = getComputedStyle(el).fontFamily;
        font.split(',').forEach((f) => {
          fontFamilies.add(f.trim().replace(/['"]/g, ''));
        });
      }
    });

    return {
      detected: Array.from(fontFamilies).filter(Boolean),
    };
  });
}

async function extractDOMStructure(page: any) {
  return await page.evaluate(() => {
    return {
      hasStickyNav: !!document.querySelector('[style*="sticky"], [style*="fixed"], .sticky, .fixed, nav'),
      hasHero: !!document.querySelector('.hero, [class*="hero"], section:first-of-type'),
      hasCTA: document.querySelectorAll('button, .btn, [class*="cta"], a[class*="btn"]').length,
      sectionCount: document.querySelectorAll('section').length,
      imageCount: document.querySelectorAll('img').length,
      metaTitle: document.title,
    };
  });
}
