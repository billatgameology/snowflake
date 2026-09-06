import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "../..");
const output = resolve(root, "out/growth-study-library");
mkdirSync(output, { recursive: true });
const url = process.env.DENDRITE_STUDY_URL ?? "http://127.0.0.1:5192/dendrite-styles.html?capture=1";
const manifest = JSON.parse(readFileSync(resolve(root, "app/data/growth-library.json"), "utf8"));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1150 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error" && !message.text().includes("503")) errors.push(message.text()); });
const loaded = id => page.waitForFunction(id => window.dendriteStudy?.ready && window.dendriteStudy.state.crystalId === id, id);
const rows = [];
try {
  await page.goto(url);
  await loaded(manifest.defaultId);
  assert.equal(await page.locator("#view").inputValue(), "1", "Timeglass should open by default");
  const options = await page.locator("#crystal option:not([disabled])").count();
  assert.equal(options, manifest.entries.length);
  for (const [index, entry] of manifest.entries.entries()) {
    await page.selectOption("#crystal", entry.id);
    await loaded(entry.id);
    await page.evaluate(() => window.dendriteStudy.seek(1));
    const styles = [];
    for (const style of [0, 1, 2, 3]) {
      const result = await page.evaluate(style => {
        window.dendriteStudy.focus(style);
        const sample = document.createElement("canvas");
        sample.width = sample.height = 128;
        const context = sample.getContext("2d");
        context.drawImage(document.querySelector("#crystal-canvas"), 0, 0, 128, 128);
        const pixels = context.getImageData(0, 0, 128, 128).data;
        const colors = new Set();
        for (let i = 0; i < pixels.length; i += 4) colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
        return { ...window.dendriteStudy.state, colors: colors.size };
      }, style);
      assert.equal(result.visible, entry.eventCount, entry.id);
      assert.equal(result.sourceSha256, entry.sourceSha256, entry.id);
      assert.ok(result.colors > 4, `${entry.id} style ${style} rendered blank`);
      assert.equal(result.geometries, 1, "previous GPU geometry was retained");
      styles.push({ style, sampledColors: result.colors });
    }
    rows.push({ id: entry.id, events: entry.eventCount, styles });
    if ([manifest.defaultId, "fig29", "fig30", "fig38", "run-b"].includes(entry.id)) {
      await page.evaluate(() => { window.dendriteStudy.focus(1); window.dendriteStudy.seek(0.82); });
      await page.screenshot({ path: resolve(output, `${entry.id}-verified.png`) });
    }
    if (index % 10 === 0) console.log(`Rendered ${index + 1}/${manifest.entries.length} crystals through all four views`);
  }
  await page.fill("#crystal-search", "needle");
  assert.ok(await page.locator("#crystal option:not([disabled])").count() >= 1);
  await page.selectOption("#crystal", "fig29");
  await loaded("fig29");
  await page.fill("#crystal-search", "no such snow crystal");
  assert.equal(await page.locator("#crystal").isDisabled(), true);
  await page.fill("#crystal-search", "");
  await page.locator("#next-crystal").click();
  await loaded("fig30");
  await page.locator("#previous-crystal").click();
  await loaded("fig29");
  await page.selectOption("#view", "2");
  await page.reload();
  await loaded("fig29");
  assert.equal(await page.locator("#view").inputValue(), "2");

  // A slower earlier fetch must never replace the user's later selection.
  await page.route("**/growth-studies/fig29.bin", async route => {
    await new Promise(resolvePromise => setTimeout(resolvePromise, 1200));
    await route.continue().catch(() => {});
  });
  await page.selectOption("#crystal", "run-b"); await loaded("run-b");
  await page.selectOption("#crystal", "fig29");
  await page.selectOption("#crystal", "fig30"); await loaded("fig30");
  await page.waitForTimeout(1500);
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.crystalId), "fig30");
  await page.unroute("**/growth-studies/fig29.bin");

  await page.route("**/growth-studies/fig29.bin", route => route.fulfill({ status: 503, body: "Temporarily unavailable" }));
  await page.selectOption("#crystal", "fig29");
  await page.locator("#retry").waitFor({ state: "visible" });
  assert.equal(await page.evaluate(() => window.dendriteStudy.ready), false);
  assert.equal(await page.locator("#play").isDisabled(), true);
  await page.unroute("**/growth-studies/fig29.bin");
  await page.locator("#retry").click(); await loaded("fig29");
  await page.selectOption("#view", "1");
  await page.evaluate(() => window.dendriteStudy.seek(0.82));
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: resolve(output, "mobile-library.png"), fullPage: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload(); await loaded("fig29");
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.playing), false);
  await page.selectOption("#crystal", "fig30"); await loaded("fig30");
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.playing), false);
  assert.deepEqual(errors, []);
  const report = { url, entries: rows.length, viewRenders: rows.length * 4, errors, checks: ["all registered replays", "all four views produce pixels", "matching endpoints", "one GPU geometry", "search", "next/previous", "deep link and view retained", "rapid switch cancellation", "failure and retry", "mobile overflow", "reduced motion"], rows };
  writeFileSync(resolve(output, "browser-smoke.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ entries: report.entries, viewRenders: report.viewRenders, errors }));
} finally { await browser.close(); }
