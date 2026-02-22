const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3001;
const API_SECRET = process.env.API_SECRET;

// ── Browser Pool ──────────────────────────────────────────────────────
let browser = null;

async function getBrowser() {
  if (browser && browser.isConnected()) return browser;
  browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  console.log("[browser] Chromium launched");
  return browser;
}

// ── Auth Middleware ───────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  if (!API_SECRET) return next(); // skip if no secret configured (dev mode)
  const key = req.headers["x-api-key"];
  if (!key || key !== API_SECRET) {
    return res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
  }
  next();
}

// ── Health ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Extract ───────────────────────────────────────────────────────────
app.post("/extract", authMiddleware, async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing or invalid url", code: "BAD_REQUEST" });
  }

  try {
    new URL(url); // validate URL format
  } catch {
    return res.status(400).json({ error: "Invalid URL format", code: "BAD_REQUEST" });
  }

  let context = null;
  try {
    const b = await getBrowser();
    context = await b.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    console.log(`[extract] Navigating to ${url}`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });

    // Wait for web fonts to load
    await page.waitForTimeout(1200);

    // ── CSS Extraction ──────────────────────────────────────────────
    const cssData = await page.evaluate(() => {
      const els = [
        ...document.querySelectorAll(
          "h1,h2,h3,h4,h5,h6,p,a,button,nav,header,footer,main,section,[class]"
        ),
      ].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top < window.innerHeight * 1.5;
      });

      const fonts = {};
      const colors = {};
      const spacing = [];
      const borderRadii = [];
      const shadows = [];

      els.forEach((el) => {
        const cs = window.getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const area = r.width * r.height;

        // Fonts — area-weighted
        const font = cs.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
        if (font) fonts[font] = (fonts[font] || 0) + area;

        // Colors — area-weighted
        [cs.backgroundColor, cs.color, cs.borderColor].forEach((c, i) => {
          if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") {
            const weight = i === 0 ? area : area * 0.3;
            colors[c] = (colors[c] || 0) + weight;
          }
        });

        // Spacing
        const pad = parseInt(cs.paddingTop);
        if (pad > 0 && pad < 200) spacing.push(pad);

        // Border radius
        const br = cs.borderRadius;
        if (br && br !== "0px") borderRadii.push(br);

        // Shadows
        const sh = cs.boxShadow;
        if (sh && sh !== "none") shadows.push(sh);
      });

      return { fonts, colors, spacing, borderRadii, shadows };
    });

    // ── Screenshot ──────────────────────────────────────────────────
    const screenshotBuffer = await page.screenshot({
      type: "png",
      fullPage: false,
    });
    const screenshot = screenshotBuffer.toString("base64");

    console.log(
      `[extract] Done: ${Object.keys(cssData.fonts).length} fonts, ${Object.keys(cssData.colors).length} colors`
    );

    res.json({ cssData, screenshot });
  } catch (err) {
    console.error(`[extract] Error: ${err.message}`);
    res.status(500).json({
      error: `Extraction failed: ${err.message}`,
      code: "EXTRACTION_ERROR",
    });
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }
  }
});

// ── Start ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] Playwright service listening on port ${PORT}`);
  // Pre-warm browser
  getBrowser().catch((err) =>
    console.error(`[server] Failed to pre-warm browser: ${err.message}`)
  );
});

// ── Graceful Shutdown ─────────────────────────────────────────────────
process.on("SIGINT", async () => {
  console.log("[server] Shutting down...");
  if (browser) await browser.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("[server] Shutting down...");
  if (browser) await browser.close();
  process.exit(0);
});
