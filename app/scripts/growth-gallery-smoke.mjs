import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const output = resolve(import.meta.dirname, "../../out/growth-gallery");
const base = process.env.DENDRITE_STUDY_URL ?? "http://127.0.0.1:5192/dendrite-styles.html";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [], growthRequests = [], previewRequests = [];
page.on("pageerror", e => errors.push(e.message));
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
page.on("request", request => {
  if (/\/growth-studies\/.*\.bin/u.test(request.url())) growthRequests.push(request.url());
  if (/\/growth-studies\/.*\.png/u.test(request.url())) previewRequests.push(request.url());
});
const loaded = id => page.waitForFunction(id => window.dendriteStudy?.ready && window.dendriteStudy.state.crystalId === id, id);
try {
  await page.goto(`${base}?capture=1&browse=1&style=2`);
  await page.waitForSelector("#crystal-browser[open]");
  await page.waitForFunction(() => [...document.querySelectorAll(".crystal-card img")].some(img => img.naturalWidth > 0));
  assert.equal(await page.locator(".crystal-card").count(), 151);
  assert.equal(growthRequests.length, 0, "Browsing fetched full growth data");
  const initiallyLoadedPreviews = previewRequests.length;
  assert.ok(initiallyLoadedPreviews < 151, "Thumbnails were not lazy-loaded");
  await page.evaluate(() => { for (const image of document.querySelectorAll(".crystal-card img")) image.loading = "eager"; });
  await page.waitForFunction(() => [...document.querySelectorAll(".crystal-card img")].every(img => img.complete && img.naturalWidth === 384 && img.naturalHeight === 320));
  const previews = await page.locator(".crystal-card img").count(); assert.equal(previews, 151);
  await page.screenshot({ path: resolve(output, "desktop-gallery.png") });
  await page.click('[data-collection="named"]'); assert.equal(await page.locator(".crystal-card").count(), 99);
  await page.click('[data-shape="dendrites"]');
  await page.fill("#crystal-search", "radiating dendrites"); assert.equal(await page.locator(".crystal-card").count(), 3);
  await page.screenshot({ path: resolve(output, "filtered-gallery.png") });
  await page.fill("#crystal-search", "no such snow crystal");
  assert.equal(await page.locator("#gallery-empty").isVisible(), true);
  await page.click("#gallery-reset"); assert.equal(await page.locator(".crystal-card").count(), 151);
  await page.click('[data-collection="original"]'); await page.click('[data-shape="dendrites"]');
  assert.equal(await page.locator('[data-crystal="fig13"]').count(), 1, "Earlier dendrites are missing from shape filtering");
  await page.click('[data-collection="named"]'); await page.fill("#crystal-search", "radiating dendrites");
  await page.click('[data-crystal="named-radiating-dendrites-baseline"]');
  await loaded("named-radiating-dendrites-baseline");
  assert.equal(await page.locator("#crystal-browser").isVisible(), false);
  assert.equal(await page.locator("#view").inputValue(), "2");
  assert.equal(new URL(page.url()).searchParams.has("browse"), false);
  assert.equal(growthRequests.length, 1, "Card selection fetched unrelated recordings");
  await page.click("#browse-crystals");
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.playing), false);
  assert.equal(await page.locator(".crystal-card").count(), 3, "Search/filter state was lost");
  assert.equal(await page.locator('[data-crystal="named-radiating-dendrites-baseline"]').getAttribute("aria-pressed"), "true");
  for (let i = 0; i < 22; i++) {
    await page.keyboard.press("Tab");
    assert.ok(await page.evaluate(() => document.activeElement.closest("#crystal-browser") !== null));
  }
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#crystal-browser").isVisible(), false);
  assert.ok(await page.locator("#browse-crystals").evaluate(el => el === document.activeElement));
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.selected), 2);
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.focused), true);
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.playing), true);
  await page.evaluate(() => window.dendriteStudy.seek(0.55));
  await page.click("#browse-crystals"); await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.playing), false);
  await page.click("#browse-crystals");
  await page.fill("#crystal-search", ""); await page.click('[data-shape="all"]');
  const scrollTop = await page.locator("#gallery-results").evaluate(el => { el.scrollTop = 950; return el.scrollTop; });
  await page.keyboard.press("Escape"); await page.click("#browse-crystals");
  assert.equal(await page.locator("#gallery-results").evaluate(el => el.scrollTop), scrollTop);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#gallery-results").evaluate(el => { el.scrollTop = 0; });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.ok(await page.locator("#crystal-browser").evaluate(el => el.scrollWidth <= el.clientWidth));
  await page.screenshot({ path: resolve(output, "mobile-gallery.png") });
  await page.fill("#crystal-search", "solid columns");
  await page.click('[data-crystal="named-solid-columns-baseline"]'); await loaded("named-solid-columns-baseline");
  assert.equal(await page.locator("#view").inputValue(), "2");
  await page.selectOption("#view", "all");
  await page.click("#browse-crystals"); await page.fill("#crystal-search", "stellar dendrites");
  await page.click('[data-crystal="named-stellar-dendrites-baseline"]'); await loaded("named-stellar-dendrites-baseline");
  assert.equal(await page.locator("#view").inputValue(), "all");
  // A recording finishing while the browser is open must remain paused until close.
  let releaseRecording;
  const recordingRelease = new Promise(resolve => { releaseRecording = resolve; });
  const delayedRecording = "**/growth-studies/named-stellar-dendrites-upper.bin";
  await page.route(delayedRecording, async route => { await recordingRelease; await route.continue(); });
  await page.click("#browse-crystals");
  await page.click('[data-crystal="named-stellar-dendrites-upper"]');
  await page.click("#browse-crystals");
  releaseRecording();
  await loaded("named-stellar-dendrites-upper");
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.playing), false);
  await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.playing), true);
  await page.unroute(delayedRecording);
  assert.deepEqual(errors, []);

  // A missing/undecodable thumbnail keeps its exact card and replay action usable.
  const fallback = await browser.newPage();
  await fallback.route("**/growth-studies/named-stellar-dendrites-lower.png", route => route.fulfill({ status: 200, contentType: "image/png", body: "not a PNG" }));
  await fallback.goto(`${base}?browse=1`);
  const broken = fallback.locator('[data-crystal="named-stellar-dendrites-lower"]');
  await broken.waitFor();
  await broken.locator("img").waitFor({ state: "detached" });
  assert.ok(await broken.locator(".preview-fallback").isVisible()); assert.equal(await broken.isDisabled(), false);
  await fallback.close();
  const report = { cards: 151, verifiedPreviews: previews, initiallyLoadedPreviews, initialGrowthRequests: 0, errors,
    checks: ["all registered cards and image decoding", "lazy previews", "collection and shape filters", "earlier audited shape", "search/empty/reset", "exact composed card selection", "view and comparison retained", "one recording per selection", "keyboard focus containment and return", "Escape retains current view", "playback pause/resume", "load completion while browsing", "filter and scroll retention", "mobile selection and overflow", "broken image fallback"] };
  writeFileSync(resolve(output, "browser-smoke.json"), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
} finally { await browser.close(); }
