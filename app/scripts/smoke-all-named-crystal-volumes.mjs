import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
const request = await browser.newPage();
const indexResponse = await request.request.get(`${baseUrl}/named-crystal-catalog-api/index.json`);
if (!indexResponse.ok()) throw new Error(`catalog index returned ${indexResponse.status()}`);
const index = await indexResponse.json();
const variants = index.entries.flatMap((entry) => entry.variants.map((variant) => ({
  ...variant,
  route: entry.route,
})));
await request.close();

let maxReadyMs = 0;
let direct = 0;
let compose = 0;
const page = await browser.newPage({ viewport: { width: 640, height: 640 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
try {
  for (const [position, variant] of variants.entries()) {
    errors.length = 0;
    const started = performance.now();
    const query = new URLSearchParams({
      growthScene: variant.sceneUrl,
      ui: "0",
      capture: "1",
    });
    await page.goto(`${baseUrl}/catalog-volume-player.html?${query.toString()}`);
    await page.waitForFunction(() => window.__catalogVolumeReady === true, undefined, {
      timeout: 180_000,
    });
    maxReadyMs = Math.max(maxReadyMs, performance.now() - started);
    await page.evaluate(async () => window.__catalogVolumeSeek(window.__sceneDuration));
    const result = await page.evaluate(() => ({
      bounds: window.__catalogVolumeProjectedBounds,
      stats: window.__catalogVolumeStats,
    }));
    const bounds = result.bounds;
    if (
      bounds === undefined
      || bounds.xMin < -0.92
      || bounds.xMax > 0.92
      || bounds.yMin < -0.92
      || bounds.yMax > 0.92
    ) {
      throw new Error(`${variant.entryId} is outside the safe frame: ${JSON.stringify(bounds)}`);
    }
    if (result.stats === undefined || result.stats.uniqueTextureCount > result.stats.componentCount) {
      throw new Error(`${variant.entryId} did not report valid texture sharing`);
    }
    if (errors.length > 0) throw new Error(`${variant.entryId}: ${errors.join("; ")}`);
    if (variant.route === "compose") compose += 1;
    else direct += 1;
    if ((position + 1) % 10 === 0 || position + 1 === variants.length) {
      process.stdout.write(`checked ${position + 1}/${variants.length}\n`);
    }
  }
  process.stdout.write(
    `all volume players passed: ${direct} direct, ${compose} Compose; max ready ${Math.round(maxReadyMs)} ms\n`,
  );
} finally {
  await page.close();
  await browser.close();
}
