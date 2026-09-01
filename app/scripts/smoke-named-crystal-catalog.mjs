import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:5173";
const repositoryRoot = resolve(import.meta.dirname, "../..");
const captureRoot = resolve(repositoryRoot, "out/named-crystal-gallery-site");
mkdirSync(captureRoot, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const failures = [];
page.on("pageerror", (error) => failures.push(`page: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") failures.push(`console: ${message.text()}`);
});

try {
  const unknown = await page.request.get(`${baseUrl}/named-crystal-catalog-api/preview/not-catalogued.png`);
  const repositoryUrlPath = repositoryRoot.replaceAll("\\", "/");
  const genericOut = await page.request.get(
    `${baseUrl}/@fs/${repositoryUrlPath}/out/named-crystal-catalog/final-compose-v1/report.json`,
  );
  if (unknown.status() !== 403 || genericOut.status() !== 403) {
    throw new Error(`serving boundary returned ${unknown.status()} for unknown and ${genericOut.status()} for generic out`);
  }
  await page.goto(`${baseUrl}/named-crystal-catalog.html`, { waitUntil: "networkidle" });
  await page.locator("[data-family-id]").first().waitFor();
  const families = await page.locator("[data-family-id]").count();
  const variants = await page.locator("[data-entry-id]").count();
  if (families !== 35 || variants !== 99) {
    throw new Error(`gallery counts were ${families} families and ${variants} variants`);
  }

  for (const entryId of ["simple-prisms-lower", "crossed-plates-lower"]) {
    process.stdout.write(`checking ${entryId}\n`);
    await page.locator(`[data-entry-id="${entryId}"]`).click();
    await page.locator("dialog[open]").waitFor();
    await page.waitForFunction(() => {
      const frame = document.querySelector("dialog[open] iframe");
      return frame instanceof HTMLIFrameElement
        && frame.contentWindow?.__spikeReady === true;
    }, undefined, { timeout: 120_000 });
    await page.locator("dialog[open] .close-player").click();
    await page.locator("dialog[open]").waitFor({ state: "detached" }).catch(async () => {
      await page.waitForFunction(() => !document.querySelector("dialog[open]"));
    });
  }

  await page.screenshot({ path: resolve(captureRoot, "gallery-smoke.png") });
  if (failures.length > 0) throw new Error(failures.join("\n"));
  process.stdout.write(`gallery smoke passed: ${families} families, ${variants} listed variants; direct and Compose playback passed\n`);
} finally {
  await browser.close();
}
