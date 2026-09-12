import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:5173";
const headed = process.argv.includes("--headed");
const repositoryRoot = resolve(import.meta.dirname, "../..");
const outputRoot = resolve(
  repositoryRoot,
  `out/named-crystal-volume-stability/${headed ? "hardware-review" : "final-review"}`,
);
mkdirSync(outputRoot, { recursive: true });

const completeSentinels = [
  { entryId: "simple-stars-baseline", second: 8, role: "direct-dense-planar" },
  { entryId: "12-branched-stars-upper", second: 5.5, role: "compose-dense-before" },
  {
    entryId: "12-branched-stars-upper",
    second: 5.5,
    role: "diagnostic-solid-hit-mask",
    debug: "coverage",
  },
  { entryId: "12-branched-stars-upper", second: 5.6, role: "compose-dense-small-orbit-step" },
  { entryId: "12-branched-stars-upper", second: 8, role: "compose-dense-final" },
  { entryId: "radiating-dendrites-baseline", second: 8, role: "compose-six-component" },
  { entryId: "hexagonal-plates-baseline", second: 8, role: "direct-thin-planar" },
  { entryId: "simple-needles-baseline", second: 8, role: "direct-tall-needle" },
  { entryId: "hollow-columns-baseline", second: 8, role: "direct-tall-hollow" },
  { entryId: "capped-columns-baseline", second: 8, role: "direct-tall-capped" },
];
const sentinels = headed
  ? completeSentinels.filter((sentinel) =>
      sentinel.role === "compose-dense-before" || sentinel.role === "compose-dense-small-orbit-step")
  : completeSentinels;

const browser = await chromium.launch({ headless: !headed });
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) {
    browserErrors.push(message.text());
  }
});
page.on("response", (response) => {
  if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) {
    browserErrors.push(`HTTP ${response.status()} ${response.url()}`);
  }
});

const records = [];
let graphics = null;
try {
  for (const sentinel of sentinels) {
    browserErrors.length = 0;
    const query = new URLSearchParams({
      growthScene: `/named-crystal-catalog-api/scene/${sentinel.entryId}.json`,
      ui: "0",
      capture: "1",
    });
    if (sentinel.debug !== undefined) query.set("debug", sentinel.debug);
    const readyStarted = performance.now();
    await page.goto(`${baseUrl}/catalog-volume-player.html?${query.toString()}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForFunction(() => window.__catalogVolumeReady === true, undefined, {
      timeout: 180_000,
    });
    graphics ??= await page.locator("canvas").evaluate((canvas) => {
      const context = canvas.getContext("webgl2");
      const extension = context?.getExtension("WEBGL_debug_renderer_info");
      return context === null || extension === null
        ? { vendor: "unavailable", renderer: "unavailable" }
        : {
            vendor: String(context.getParameter(extension.UNMASKED_VENDOR_WEBGL)),
            renderer: String(context.getParameter(extension.UNMASKED_RENDERER_WEBGL)),
          };
    });
    const readyMs = performance.now() - readyStarted;
    const renderStarted = performance.now();
    await page.evaluate(async (second) => {
      await window.__catalogVolumeSeek(second);
      await new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)));
    }, sentinel.second);
    await page.waitForTimeout(250);
    const state = await page.evaluate(() => ({
      bounds: window.__catalogVolumeProjectedBounds,
      stats: window.__catalogVolumeStats,
    }));
    if (
      state.bounds === undefined
      || state.bounds.xMin < -0.92
      || state.bounds.xMax > 0.92
      || state.bounds.yMin < -0.92
      || state.bounds.yMax > 0.92
    ) {
      throw new Error(`${sentinel.entryId} is outside the safe frame: ${JSON.stringify(state.bounds)}`);
    }
    if (browserErrors.length > 0) {
      throw new Error(`${sentinel.entryId}: ${browserErrors.join("; ")}`);
    }
    const fileName = `${sentinel.entryId}-${String(sentinel.second).replace(".", "p")}${
      sentinel.debug === undefined ? "" : `-${sentinel.debug}`
    }.png`;
    const bytes = await page.screenshot({ path: resolve(outputRoot, fileName), type: "png" });
    records.push({
      ...sentinel,
      fileName,
      byteLength: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      readyMs: Math.round(readyMs),
      seekAndCaptureMs: Math.round(performance.now() - renderStarted),
      bounds: state.bounds,
      stats: state.stats,
    });
    process.stdout.write(`captured ${sentinel.entryId}@${sentinel.second}\n`);
  }
  const report = {
    format: "named-crystal-volume-stability-review-v1",
    renderer: "catalog-volume-player",
    mode: headed ? "headed-hardware" : "headless-complete",
    viewport: [900, 900],
    graphics,
    records,
  };
  writeFileSync(resolve(outputRoot, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`captured ${records.length} stability sentinels to ${outputRoot}\n`);
} finally {
  await page.close();
  await browser.close();
}
