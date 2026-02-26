# 🎨 Design Decoder — Backend Architecture & Implementation Guide

> Stack: Next.js (App Router) + React + Mistral AI + Free OSS Libraries  
> Scope: Industry-grade design extraction from images and web pages  
> Cost: $0 — Free tiers only

---

## 1. Model Selection

### Primary Vision Model — `pixtral-12b-2409` → Replaced by `ministral-3-14b-25-12`

After reviewing the Mistral model catalog, the recommended model for this app is:

**`mistral-small-2506` (Mistral Small 3.2)** for text reasoning + **`ministral-3-14b-25-12` (Ministral 3 14B)** for vision tasks.

| Task | Model | Why |
|---|---|---|
| Analyze image composition, typography, design language | `ministral-3-14b-25-12` | Best-in-class vision on free tier, multimodal |
| Label UX patterns, classify design systems from extracted CSS | `mistral-small-2506` | Fast, cheap, strong reasoning |
| Structured JSON output enforcement | `mistral-small-2506` | Reliable structured outputs |

**API Endpoint:** `https://api.mistral.ai/v1/chat/completions`  
**Auth:** Bearer token from [console.mistral.ai](https://console.mistral.ai) — free tier available

---

## 2. Full Stack Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App Router                   │
│                                                          │
│   /app                                                   │
│   ├── api/                                               │
│   │   ├── analyze/image/route.ts   ← Image pipeline     │
│   │   ├── analyze/web/route.ts     ← Web pipeline        │
│   │   └── analyze/css/route.ts     ← CSS extraction      │
│   └── (frontend - already done)                          │
└──────────────────┬──────────────────────────────────────┘
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
  [Code Layer] [AI Layer]  [Scrape Layer]
  colorthief   Mistral AI   Playwright/
  node-vibrant ministral    Cheerio
  css-parser   mistral-small Puppeteer
```

### Pipeline A — Image Analysis
```
User uploads image
       │
       ├──▶ colorthief.js        → Dominant color palette (hex codes)
       ├──▶ node-vibrant          → Extended swatches (vibrant, muted, dark)
       ├──▶ base64 encode image
       └──▶ Mistral Vision API   → Typography, composition, design language
                │
                └──▶ Structured JSON response
```

### Pipeline B — Web Page Analysis
```
User submits URL
       │
       ├──▶ Puppeteer/Playwright  → Headless browser, full page screenshot
       │         │
       │         ├──▶ DOM scrape  → CSS variables, font links, computed styles
       │         ├──▶ HTML parse  → Component structure, layout patterns
       │         └──▶ Screenshot  → PNG for vision model
       │
       ├──▶ css-parser            → All :root variables, typography rules
       ├──▶ Google Fonts detector → Font family identification from <link> tags
       └──▶ Mistral Vision API   → Visual style, UX tactics, design language
                │
                └──▶ Structured JSON response
```

---

## 3. Project Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@mistralai/mistralai": "^1.3.4",
    "colorthief": "^2.4.0",
    "node-vibrant": "^3.1.6",
    "puppeteer": "^22.0.0",
    "cheerio": "^1.0.0",
    "css": "^3.0.0",
    "sharp": "^0.33.0",
    "jimp": "^0.22.10"
  }
}
```

Install:
```bash
npm install @mistralai/mistralai colorthief node-vibrant puppeteer cheerio css sharp jimp
```

---

## 4. Environment Variables

Create `.env.local`:

```env
MISTRAL_API_KEY=your_mistral_api_key_here
MISTRAL_VISION_MODEL=ministral-3-14b-25-12
MISTRAL_TEXT_MODEL=mistral-small-2506
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 5. API Routes Implementation

### 5.1 — Image Analysis Route

**`/app/api/analyze/image/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Vibrant from 'node-vibrant';
import sharp from 'sharp';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!;
const VISION_MODEL = process.env.MISTRAL_VISION_MODEL!;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const mimeType = file.type;

    // ── 1. Color Extraction (code-only, no AI) ──────────────────────
    const colors = await extractColors(buffer);

    // ── 2. Mistral Vision Analysis ──────────────────────────────────
    const designProfile = await analyzeImageWithMistral(base64Image, mimeType);

    return NextResponse.json({
      success: true,
      data: {
        colors,
        ...designProfile,
      },
    });

  } catch (error: any) {
    console.error('Image analysis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── Color Extraction ────────────────────────────────────────────────
async function extractColors(buffer: Buffer) {
  const palette = await Vibrant.from(buffer).getPalette();

  const swatches = Object.entries(palette)
    .filter(([_, swatch]) => swatch !== null)
    .map(([name, swatch]) => ({
      name,
      hex: swatch!.hex,
      rgb: swatch!.rgb,
      hsl: swatch!.hsl,
      population: swatch!.population,
    }));

  // Get top 10 dominant colors
  const dominantColors = swatches
    .sort((a, b) => b.population - a.population)
    .slice(0, 10);

  return {
    palette: swatches,
    dominant: dominantColors[0]?.hex || '#000000',
    dominantColors,
    colorCount: swatches.length,
  };
}

// ── Mistral Vision Call ─────────────────────────────────────────────
async function analyzeImageWithMistral(base64Image: string, mimeType: string) {
  const systemPrompt = `You are an expert design analyst and creative director. 
Analyze the provided image and extract a complete design profile.
Always respond with valid JSON only. No prose, no markdown, just raw JSON.`;

  const userPrompt = `Analyze this design image and return a JSON object with exactly this structure:
{
  "typography": {
    "primaryFont": "detected font name or style description",
    "fontCategory": "serif | sans-serif | display | monospace | script",
    "fontWeight": "light | regular | medium | semibold | bold | black",
    "typographyStyle": "description of typography personality",
    "hierarchy": "description of typographic hierarchy observed",
    "estimatedFonts": ["list", "of", "detected", "fonts"]
  },
  "composition": {
    "layoutType": "grid | asymmetric | centered | rule-of-thirds | golden-ratio | freeform",
    "visualBalance": "symmetric | asymmetric | radial",
    "whitespace": "minimal | moderate | generous | extreme",
    "contentDensity": "sparse | balanced | dense | chaotic",
    "focalPoint": "description of where the eye is drawn",
    "gridStructure": "description of underlying grid",
    "visualFlow": "description of how the eye moves through the design"
  },
  "designLanguage": {
    "style": "minimal | brutalist | material | glassmorphism | neumorphism | flat | skeuomorphic | corporate | playful | editorial | luxury",
    "era": "design era or movement (e.g. Swiss Style, Memphis, Y2K, Contemporary)",
    "mood": "description of emotional tone",
    "personality": ["adjective1", "adjective2", "adjective3"],
    "influences": ["design movement or brand this resembles"]
  },
  "colorProfile": {
    "colorScheme": "monochromatic | analogous | complementary | triadic | split-complementary",
    "colorTemperature": "warm | cool | neutral | mixed",
    "contrast": "low | medium | high | ultra-high",
    "colorMood": "description of how colors feel"
  },
  "designScore": {
    "clarity": 0-10,
    "hierarchy": 0-10,
    "consistency": 0-10,
    "overall": 0-10
  },
  "summary": "2-3 sentence expert summary of the design"
}`;

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            { type: 'text', text: userPrompt },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Mistral API error: ${err}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;

  return JSON.parse(content);
}
```

---

### 5.2 — Web Page Analysis Route

**`/app/api/analyze/web/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import css from 'css';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!;
const VISION_MODEL = process.env.MISTRAL_VISION_MODEL!;
const TEXT_MODEL = process.env.MISTRAL_TEXT_MODEL!;

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // ── 1. Screenshot for Vision Model ──────────────────────────────
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 85,
      fullPage: false, // Viewport only — above the fold
    });
    const base64Screenshot = Buffer.from(screenshot).toString('base64');

    // ── 2. Extract CSS Variables + Styles ───────────────────────────
    const cssData = await extractCSSFromPage(page);

    // ── 3. Extract Fonts ─────────────────────────────────────────────
    const fonts = await extractFonts(page);

    // ── 4. Extract Design Tokens from DOM ───────────────────────────
    const domData = await extractDOMStructure(page);

    // ── 5. Mistral Vision — Visual & UX Analysis ────────────────────
    const visualProfile = await analyzeWebScreenshot(base64Screenshot, {
      cssData,
      fonts,
      domData,
    });

    // ── 6. Mistral Text — UX Tactics from DOM structure ─────────────
    const uxProfile = await analyzeUXTactics({ cssData, fonts, domData, url });

    await browser.close();

    return NextResponse.json({
      success: true,
      data: {
        url,
        css: cssData,
        fonts,
        dom: domData,
        visual: visualProfile,
        ux: uxProfile,
      },
    });

  } catch (error: any) {
    if (browser) await browser.close();
    console.error('Web analysis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── CSS Variable & Style Extraction ────────────────────────────────
async function extractCSSFromPage(page: any) {
  return await page.evaluate(() => {
    // Extract :root CSS variables
    const variables: Record<string, string> = {};
    const root = document.documentElement;
    const rootStyles = getComputedStyle(root);

    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i];
      if (prop.startsWith('--')) {
        variables[prop] = rootStyles.getPropertyValue(prop).trim();
      }
    }

    // Extract color values from variables
    const colorVars: Record<string, string> = {};
    const colorRegex = /#[0-9A-Fa-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(/;
    for (const [key, value] of Object.entries(variables)) {
      if (colorRegex.test(value)) {
        colorVars[key] = value;
      }
    }

    // Extract computed body styles
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

// ── Font Detection ──────────────────────────────────────────────────
async function extractFonts(page: any) {
  const fonts = await page.evaluate(() => {
    const fontFamilies = new Set<string>();
    const googleFontsLinks: string[] = [];
    const fontFiles: string[] = [];

    // From link tags (Google Fonts)
    document.querySelectorAll('link[href]').forEach((el) => {
      const href = (el as HTMLLinkElement).href;
      if (href.includes('fonts.googleapis.com')) {
        googleFontsLinks.push(href);
        const match = href.match(/family=([^&:]+)/g);
        if (match) {
          match.forEach((m) => {
            fontFamilies.add(decodeURIComponent(m.replace('family=', '').replace(/\+/g, ' ')));
          });
        }
      }
    });

    // From computed styles on key elements
    const selectors = ['body', 'h1', 'h2', 'h3', 'p', 'button', 'a', 'nav', 'header'];
    selectors.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        const font = getComputedStyle(el).fontFamily;
        font.split(',').forEach((f) => {
          fontFamilies.add(f.trim().replace(/['"]/g, ''));
        });
      }
    });

    // From @font-face in stylesheets
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        Array.from(sheet.cssRules || []).forEach((rule) => {
          if (rule instanceof CSSFontFaceRule) {
            const src = rule.style.getPropertyValue('src');
            if (src) fontFiles.push(src);
            const family = rule.style.getPropertyValue('font-family');
            if (family) fontFamilies.add(family.replace(/['"]/g, ''));
          }
        });
      } catch {}
    });

    return {
      detected: Array.from(fontFamilies).filter(Boolean),
      googleFontsLinks,
      fontFiles,
    };
  });

  return fonts;
}

// ── DOM Structure for UX Pattern Detection ──────────────────────────
async function extractDOMStructure(page: any) {
  return await page.evaluate(() => {
    return {
      hasStickyNav: !!document.querySelector('[style*="sticky"], [style*="fixed"], .sticky, .fixed, nav'),
      hasHero: !!document.querySelector('.hero, [class*="hero"], section:first-of-type'),
      hasCTA: document.querySelectorAll('button, .btn, [class*="cta"], a[class*="btn"]').length,
      hasSocialProof: !!(
        document.querySelector('[class*="testimonial"], [class*="review"], [class*="trust"]') ||
        document.querySelector('[class*="logo"], [class*="partner"], [class*="client"]')
      ),
      hasModal: !!document.querySelector('[class*="modal"], [class*="popup"], [class*="overlay"]'),
      hasAnimation: !!document.querySelector('[class*="animate"], [class*="transition"], [data-aos]'),
      hasDarkMode: document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches,
      sectionCount: document.querySelectorAll('section').length,
      navItemCount: document.querySelectorAll('nav a').length,
      imageCount: document.querySelectorAll('img').length,
      hasVideo: !!document.querySelector('video'),
      hasPricing: !!document.querySelector('[class*="pricing"], [class*="plan"], [class*="tier"]'),
      hasForm: !!document.querySelector('form'),
      metaTitle: document.title,
      metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
    };
  });
}

// ── Mistral Vision: Web Screenshot Analysis ─────────────────────────
async function analyzeWebScreenshot(
  base64Screenshot: string,
  context: { cssData: any; fonts: any; domData: any }
) {
  const contextStr = JSON.stringify({
    cssVariables: Object.keys(context.cssData.variables).length,
    colorVars: context.cssData.colorVariables,
    fonts: context.fonts.detected.slice(0, 5),
    dom: context.domData,
  }, null, 2);

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert UI/UX designer and brand analyst. Analyze websites and return only valid JSON.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Screenshot}` },
            },
            {
              type: 'text',
              text: `Analyze this website screenshot. I've also extracted this technical context: ${contextStr}
              
Return a JSON object with this exact structure:
{
  "visualStyle": {
    "designSystem": "custom | material | tailwind | bootstrap | ant-design | chakra | shadcn",
    "styleCategory": "minimal | corporate | playful | editorial | luxury | startup | saas | ecommerce | portfolio",
    "colorUsage": "monochrome | duotone | full-color | gradient-heavy | muted | vibrant",
    "spacing": "tight | comfortable | spacious | inconsistent",
    "borderRadius": "sharp | slightly-rounded | rounded | pill | mixed",
    "shadows": "none | subtle | moderate | heavy | neumorphic",
    "darkMode": true | false,
    "glassEffect": true | false
  },
  "typography": {
    "headingStyle": "description",
    "bodyStyle": "description",
    "scaleHarmony": "tight | harmonious | dramatic | inconsistent",
    "readability": 0-10
  },
  "composition": {
    "layoutPattern": "hero-cta | magazine | dashboard | landing | blog | portfolio | ecommerce",
    "aboveFold": "description of what user sees first",
    "navigationStyle": "minimal | expanded | mega-menu | sidebar | hamburger",
    "gridSystem": "single-col | two-col | three-col | masonry | custom",
    "responsiveClues": "description of responsive design approach"
  },
  "brandPersonality": ["word1", "word2", "word3", "word4"],
  "summary": "Expert 2-3 sentence design critique"
}`,
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1200,
    }),
  });

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

// ── Mistral Text: UX Tactics Analysis ──────────────────────────────
async function analyzeUXTactics(context: {
  cssData: any;
  fonts: any;
  domData: any;
  url: string;
}) {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a UX strategist and conversion rate expert. Return only valid JSON.',
        },
        {
          role: 'user',
          content: `Analyze this website DOM data and identify UX tactics used.
          
URL: ${context.url}
DOM Data: ${JSON.stringify(context.domData, null, 2)}
Detected Fonts: ${context.fonts.detected.join(', ')}
CSS Variable Count: ${context.cssData.variableCount}

Return this JSON structure:
{
  "uxTactics": {
    "persuasion": ["list of persuasion techniques detected e.g. social proof, scarcity, authority"],
    "navigation": "description of navigation UX strategy",
    "conversionOptimization": ["CTA strategy", "funnel patterns detected"],
    "trustSignals": ["list of trust signals found"],
    "accessibility": {
      "likelyScore": "poor | fair | good | excellent",
      "observations": ["list of accessibility observations"]
    }
  },
  "designPatterns": ["list of UI/UX patterns used e.g. sticky nav, hero banner, card grid"],
  "technologyClues": {
    "cssFramework": "likely CSS framework from class naming conventions",
    "animationLibrary": "detected or likely animation approach",
    "designTokens": ${context.cssData.variableCount > 20 ? 'true' : 'false'}
  },
  "improvementOpportunities": ["top 3 actionable suggestions"],
  "overallUXRating": {
    "score": 0-10,
    "label": "Poor | Fair | Good | Excellent",
    "reasoning": "one sentence justification"
  }
}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1000,
    }),
  });

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

// ── Utility ──────────────────────────────────────────────────────────
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

---

### 5.3 — CSS Deep-Dive Route

**`/app/api/analyze/css/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!;
const TEXT_MODEL = process.env.MISTRAL_TEXT_MODEL!;

export async function POST(req: NextRequest) {
  const { cssVariables, fonts, colorTokens } = await req.json();

  // Send extracted CSS data to Mistral to classify the design system
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a design systems expert. Analyze CSS variables and return structured JSON insights.',
        },
        {
          role: 'user',
          content: `Analyze these CSS design tokens:

CSS Variables: ${JSON.stringify(cssVariables, null, 2)}
Color Tokens: ${JSON.stringify(colorTokens, null, 2)}
Fonts: ${JSON.stringify(fonts, null, 2)}

Return JSON:
{
  "designSystem": {
    "hasTokenSystem": true | false,
    "tokenNamingConvention": "BEM | atomic | semantic | custom | inconsistent",
    "colorSystem": {
      "hasScales": true | false,
      "hasPrimary": true | false,
      "hasNeutrals": true | false,
      "hasSemantic": true | false,
      "extractedPalette": {}
    },
    "spacingSystem": "detected spacing scale or null",
    "typographyScale": "detected type scale or null"
  },
  "tokenAudit": {
    "totalTokens": 0,
    "colorTokens": 0,
    "quality": "poor | fair | good | excellent",
    "observations": []
  },
  "reconstructedPalette": {
    "primary": "hex or null",
    "secondary": "hex or null",
    "accent": "hex or null",
    "background": "hex or null",
    "surface": "hex or null",
    "text": "hex or null"
  }
}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 800,
    }),
  });

  const result = await response.json();
  return NextResponse.json({
    success: true,
    data: JSON.parse(result.choices[0].message.content),
  });
}
```

---

## 6. React Hook — `useDesignAnalysis`

Place in `/hooks/useDesignAnalysis.ts`:

```typescript
import { useState } from 'react';

type AnalysisMode = 'image' | 'web';

interface AnalysisState {
  loading: boolean;
  error: string | null;
  data: any | null;
  stage: string;
}

export function useDesignAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    error: null,
    data: null,
    stage: '',
  });

  const setStage = (stage: string) => setState((s) => ({ ...s, stage }));

  const analyzeImage = async (file: File) => {
    setState({ loading: true, error: null, data: null, stage: 'Extracting colors...' });

    try {
      const formData = new FormData();
      formData.append('image', file);

      setStage('Running AI vision analysis...');
      const res = await fetch('/api/analyze/image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Analysis failed');

      const result = await res.json();
      setState({ loading: false, error: null, data: result.data, stage: '' });
    } catch (err: any) {
      setState({ loading: false, error: err.message, data: null, stage: '' });
    }
  };

  const analyzeWeb = async (url: string) => {
    setState({ loading: true, error: null, data: null, stage: 'Launching browser...' });

    try {
      setStage('Scraping page & extracting CSS...');
      const res = await fetch('/api/analyze/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) throw new Error('Web analysis failed');

      setStage('Running AI design analysis...');
      const result = await res.json();
      setState({ loading: false, error: null, data: result.data, stage: '' });
    } catch (err: any) {
      setState({ loading: false, error: err.message, data: null, stage: '' });
    }
  };

  return { ...state, analyzeImage, analyzeWeb };
}
```

---

## 7. Output Data Shape

Both pipelines return a unified JSON profile. Here's the full shape your frontend can consume:

```typescript
// Image Analysis Result
interface ImageAnalysisResult {
  colors: {
    dominant: string;                  // "#3A86FF"
    dominantColors: ColorSwatch[];
    palette: ColorSwatch[];
    colorCount: number;
  };
  typography: {
    primaryFont: string;
    fontCategory: string;
    fontWeight: string;
    typographyStyle: string;
    hierarchy: string;
    estimatedFonts: string[];
  };
  composition: {
    layoutType: string;
    visualBalance: string;
    whitespace: string;
    contentDensity: string;
    focalPoint: string;
    gridStructure: string;
    visualFlow: string;
  };
  designLanguage: {
    style: string;
    era: string;
    mood: string;
    personality: string[];
    influences: string[];
  };
  colorProfile: {
    colorScheme: string;
    colorTemperature: string;
    contrast: string;
    colorMood: string;
  };
  designScore: {
    clarity: number;
    hierarchy: number;
    consistency: number;
    overall: number;
  };
  summary: string;
}

// Web Analysis Result
interface WebAnalysisResult {
  url: string;
  css: {
    variables: Record<string, string>;
    colorVariables: Record<string, string>;
    variableCount: number;
    bodyFont: string;
    bodyBackground: string;
    bodyColor: string;
  };
  fonts: {
    detected: string[];
    googleFontsLinks: string[];
  };
  dom: {
    hasStickyNav: boolean;
    hasCTA: boolean;
    hasSocialProof: boolean;
    sectionCount: number;
    // ...
  };
  visual: {
    visualStyle: object;
    typography: object;
    composition: object;
    brandPersonality: string[];
    summary: string;
  };
  ux: {
    uxTactics: object;
    designPatterns: string[];
    technologyClues: object;
    improvementOpportunities: string[];
    overallUXRating: { score: number; label: string; reasoning: string };
  };
}
```

---

## 8. Next.js Config (Required for Puppeteer)

**`next.config.js`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Allow larger image uploads
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('puppeteer');
    }
    return config;
  },
};

module.exports = nextConfig;
```

---

## 9. Rate Limiting (Middleware)

Protect your Mistral API quota. Create `/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/api/analyze')) {
    return NextResponse.next();
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 5;       // 5 requests per minute per IP

  const current = rateLimitMap.get(ip);

  if (!current || current.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return NextResponse.next();
  }

  if (current.count >= maxRequests) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in a minute.' },
      { status: 429 }
    );
  }

  current.count++;
  return NextResponse.next();
}

export const config = {
  matcher: '/api/analyze/:path*',
};
```

---

## 10. Error Handling Strategy

All routes follow this pattern — never let the frontend hang:

```typescript
// Wrap every Mistral call with this utility
async function safeMistralCall<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    console.error('Mistral call failed:', err.message);
    return fallback;
  }
}
```

---

## 11. Recommended Folder Structure

```
/app
├── api/
│   └── analyze/
│       ├── image/
│       │   └── route.ts
│       ├── web/
│       │   └── route.ts
│       └── css/
│           └── route.ts
/hooks/
│   └── useDesignAnalysis.ts
/lib/
│   ├── mistral.ts          ← Shared Mistral client config
│   ├── colorExtractor.ts   ← Color utilities
│   ├── cssParser.ts        ← CSS variable extraction helpers
│   └── prompts.ts          ← All system/user prompts centralized
/types/
│   └── analysis.ts         ← All TypeScript interfaces
```

---

## 12. Free Tier Summary & Limits

| Service | Free Limit | Notes |
|---|---|---|
| Mistral AI | 1B tokens/month on free tier | Monitor at console.mistral.ai |
| `ministral-3-14b` | Vision capable, free tier | Best Mistral multimodal option |
| `mistral-small-2506` | Text reasoning, free tier | Fast, structured outputs |
| Puppeteer | Unlimited | Self-hosted in your server |
| node-vibrant | Unlimited | Client or server-side |
| colorthief | Unlimited | Client or server-side |

> **Pro tip:** Cache analysis results by image hash or URL to avoid re-calling the API for the same input. Use `localStorage`, a simple Redis instance, or even a JSON file for MVP caching.

---

## 13. Quick Start Checklist

- [ ] Get Mistral API key from [console.mistral.ai](https://console.mistral.ai)
- [ ] Add key to `.env.local`
- [ ] `npm install @mistralai/mistralai colorthief node-vibrant puppeteer cheerio sharp`
- [ ] Create `/app/api/analyze/image/route.ts`
- [ ] Create `/app/api/analyze/web/route.ts`
- [ ] Add `/middleware.ts` for rate limiting
- [ ] Update `next.config.js` for Puppeteer
- [ ] Wire up `useDesignAnalysis` hook to your existing frontend
- [ ] Test image route with a sample image
- [ ] Test web route with a public URL

---

*Built for indie speed. Designed for production quality.*
