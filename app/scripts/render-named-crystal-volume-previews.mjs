import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:5173";
const repositoryRoot = resolve(import.meta.dirname, "../..");
const outputRoot = resolve(repositoryRoot, "out/named-crystal-gallery-volume-previews");
mkdirSync(outputRoot, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 720, height: 720 }, deviceScaleFactor: 1 });
const indexResponse = await page.request.get(`${baseUrl}/named-crystal-catalog-api/index.json`);
if (!indexResponse.ok()) throw new Error(`catalog index returned ${indexResponse.status()}`);
const index = await indexResponse.json();
const variants = index.entries.flatMap((entry) => entry.variants.map((variant) => ({
  ...variant,
  route: entry.route,
})));
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") browserErrors.push(message.text());
});

const records = [];
try {
  for (const [position, variant] of variants.entries()) {
    browserErrors.length = 0;
    const query = new URLSearchParams({ growthScene: variant.sceneUrl, ui: "0", capture: "1" });
    await page.goto(`${baseUrl}/catalog-volume-player.html?${query.toString()}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForFunction(() => window.__catalogVolumeReady === true, undefined, {
      timeout: 180_000,
    });
    await page.evaluate(async () => {
      await window.__catalogVolumeSeek(window.__sceneDuration);
      await new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)));
    });
    const bounds = await page.evaluate(() => window.__catalogVolumeProjectedBounds);
    if (
      bounds === undefined
      || bounds.xMin < -0.92
      || bounds.xMax > 0.92
      || bounds.yMin < -0.92
      || bounds.yMax > 0.92
    ) {
      throw new Error(`${variant.entryId} is outside the safe frame: ${JSON.stringify(bounds)}`);
    }
    if (browserErrors.length > 0) {
      throw new Error(`${variant.entryId}: ${browserErrors.join("; ")}`);
    }
    const outputPath = resolve(outputRoot, `${variant.entryId}.png`);
    const bytes = await page.screenshot({ path: outputPath, type: "png" });
    records.push({
      entryId: variant.entryId,
      route: variant.route,
      byteLength: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
    if ((position + 1) % 10 === 0 || position + 1 === variants.length) {
      process.stdout.write(`rendered ${position + 1}/${variants.length}\n`);
    }
  }
  writeFileSync(resolve(outputRoot, "report.json"), `${JSON.stringify({
    format: "named-crystal-volume-preview-report-v1",
    renderer: "catalog-volume-player",
    viewport: [720, 720],
    records,
  }, null, 2)}\n`);
  process.stdout.write(`rendered ${records.length} volume previews to ${outputRoot}\n`);
} finally {
  await page.close();
  await browser.close();
}
