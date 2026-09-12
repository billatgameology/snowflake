import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "../..");
const output = resolve(root, "out/named-growth-studies");
const verified = JSON.parse(readFileSync(resolve(output, "packaging.json")));
const url = process.env.DENDRITE_STUDY_URL ?? "http://127.0.0.1:5192/dendrite-styles.html?capture=1";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1150 } });
const selectCrystal = value => page.locator("#crystal").selectOption(value, { force: true });
const selectCollection = value => page.locator("#collection").selectOption(value, { force: true });
const errors = [], rows = [];
page.on("pageerror", e => errors.push(e.message));
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
const loaded = id => page.waitForFunction(id => window.dendriteStudy?.ready && window.dendriteStudy.state.crystalId === id, id);
try {
  await page.goto(url);
  await page.waitForFunction(() => window.dendriteStudy?.ready);
  await selectCollection( "named");
  assert.equal(await page.locator("#crystal option:not([disabled])").count(), 99);
  for (const id of ["named-cups-baseline", "named-hollow-columns-baseline", "named-double-plates-baseline", "named-stellar-dendrites-baseline", "named-needle-clusters-lower"]) {
    await selectCrystal( id); await loaded(id);
    const expected = verified.sceneRows.find(r => r.id === id);
    if (expected) {
      for (const check of expected.checks) {
        const count = await page.evaluate(progress => { window.dendriteStudy.seek(progress); return window.dendriteStudy.state.visible; }, check.progress);
        assert.equal(count, check.visible, `${id} at ${check.progress}`);
      }
    }
    const styles = [];
    for (let style = 0; style < 4; style++) {
      const state = await page.evaluate(style => {
        window.dendriteStudy.focus(style); window.dendriteStudy.seek(0.82);
        const canvas = document.createElement("canvas"), context = canvas.getContext("2d");
        canvas.width = canvas.height = 128;
        context.drawImage(document.querySelector("#crystal-canvas"), 0, 0, 128, 128);
        const pixels = context.getImageData(0, 0, 128, 128).data, colors = new Set();
        for (let i = 0; i < pixels.length; i += 4) colors.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`);
        return { ...window.dendriteStudy.state, colors: colors.size };
      }, style);
      assert.ok(state.colors > 4); assert.ok(state.geometries >= 1 && state.geometries <= 2);
      styles.push({ style, visible: state.visible, colors: state.colors });
    }
    await page.evaluate(() => { window.dendriteStudy.focus(1); window.dendriteStudy.seek(0.82); });
    await page.screenshot({ path: resolve(output, `${id}-final.png`) });
    rows.push({ id, styles });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: resolve(output, "named-mobile-final.png"), fullPage: true });
  assert.deepEqual(errors, []);
  writeFileSync(resolve(output, "final-browser-smoke.json"), JSON.stringify({ url, entries: rows.length, viewRenders: rows.length * 4, sourceTimelineChecks: 5, errors, rows }, null, 2));
  console.log(JSON.stringify({ entries: rows.length, viewRenders: rows.length * 4, errors }));
} finally { await browser.close(); }
