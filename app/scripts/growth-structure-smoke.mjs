import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const output = resolve(import.meta.dirname, "../../out/growth-structure");
mkdirSync(output, { recursive: true });
const base = process.env.DENDRITE_STUDY_URL ?? "http://127.0.0.1:5192/dendrite-styles.html";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1120 }, deviceScaleFactor: 1 });
const errors = [], samples = [];
page.on("pageerror", e => errors.push(e.message));
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
const loaded = id => page.waitForFunction(id => window.dendriteStudy?.ready && window.dendriteStudy.state.crystalId === id, id);
const seek = value => page.evaluate(value => window.dendriteStudy.seek(value), value);
const focus = value => page.evaluate(value => window.dendriteStudy.focus(value), value);
const control = (id, value) => page.locator(id).evaluate((el, value) => { el.value = String(value); el.dispatchEvent(new Event("input", { bubbles: true })); window.dendriteStudy.seek(window.dendriteStudy.state.progress); }, value);
const pixels = () => page.evaluate(() => {
  const canvas = document.querySelector("#crystal-canvas"), rect = document.querySelector(".study.selected .viewport").getBoundingClientRect();
  const sample = document.createElement("canvas"); sample.width = sample.height = 160;
  const context = sample.getContext("2d");
  const scale = canvas.width / innerWidth;
  context.drawImage(canvas, rect.x * scale, rect.y * scale, rect.width * scale, rect.height * scale, 0, 0, 160, 160);
  const data = context.getImageData(0, 0, 160, 160).data;
  let hash = 2166136261, bright = 0; const colors = new Set();
  for (let i = 0; i < data.length; i += 4) {
    hash = Math.imul(hash ^ data[i], 16777619); hash = Math.imul(hash ^ data[i + 1], 16777619);
    colors.add(`${data[i]},${data[i+1]},${data[i+2]}`);
    if (data[i] > 210 && data[i+1] > 210) bright++;
  }
  return { hash: hash >>> 0, bright, colors: colors.size, ...window.dendriteStudy.state };
});
try {
  await page.goto(`${base}?capture=1&style=2&crystal=named-stellar-dendrites-baseline`);
  await loaded("named-stellar-dendrites-baseline");
  assert.doesNotMatch(await page.locator("body").innerText(), /Chronograph|Darkfield|UNFOLD TIME/u);
  assert.equal(await page.locator("#depth").count(), 0);
  assert.deepEqual(await page.locator("#view option").allTextContents(), ["Timeglass", "Ion Bloom", "Growth Front", "Crystal Cast", "Compare all four"]);
  const cases = ["named-stellar-dendrites-baseline", "sweep-t1-sharp", "named-cups-baseline", "named-radiating-dendrites-baseline", "named-needle-clusters-baseline"];
  for (const id of cases) {
    await page.locator("#crystal").selectOption(id, { force: true }); await loaded(id);
    for (const style of [2, 3]) {
      await focus(style);
      const hashes = [];
      for (const fraction of [0, 0.35, 0.72, 1, 0.35]) {
        await seek(fraction); const sample = await pixels();
        assert.ok(sample.colors > 4, `${id}/${style}/${fraction} is blank`);
        assert.equal(sample.geometries, 2, "Only one recording geometry and the shared quad should remain");
        assert.ok(sample.recent.start + sample.recent.count <= sample.visible);
        if (fraction === 1) assert.equal(sample.visible, sample.eventCount);
        hashes.push(sample.hash);
      }
      assert.equal(hashes[1], hashes[4], "Backward seeking depends on past frames");
      assert.notEqual(hashes[1], hashes[2], "Growth did not change the rendered shape");
      samples.push({ id, style, hashes });
      await seek(id === "named-stellar-dendrites-baseline" ? 0.72 : 0.82);
      await page.screenshot({ path: resolve(output, `${id}-${style}.png`) });
    }
  }
  // Actual gallery selection retains the new view.
  await page.click("#browse-crystals"); await page.fill("#crystal-search", "stellar dendrites");
  await page.click('[data-crystal="named-stellar-dendrites-baseline"]'); await loaded("named-stellar-dendrites-baseline");
  assert.equal(await page.locator("#view").inputValue(), "3");
  await focus(2); await seek(.72);
  await control("#growth-window", 0.5); const narrow = await pixels();
  await control("#growth-window", 16); const wide = await pixels();
  assert.ok(wide.recent.count > narrow.recent.count); assert.ok(wide.bright > narrow.bright);
  assert.notEqual(wide.hash, narrow.hash); await control("#growth-window", 2);
  await focus(3); await seek(.82);
  await control("#light-angle", 0); const right = await pixels();
  await control("#light-angle", 180); const left = await pixels();
  assert.notEqual(right.hash, left.hash, "Moving the light did not redraw the relief");
  assert.equal(right.visible, left.visible);
  await control("#light-angle", 130);
  const rect = await page.locator(".study.selected .viewport").boundingBox();
  const beforeDrag = await pixels();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2); await page.mouse.down();
  await page.mouse.move(rect.x + rect.width / 2 + 85, rect.y + rect.height / 2 + 55); await page.mouse.up();
  await seek(.82); assert.notEqual((await pixels()).hash, beforeDrag.hash);
  await page.screenshot({ path: resolve(output, "cast-rotated.png") });
  await page.setViewportSize({ width: 1440, height: 1500 });
  await focus(null); await seek(.72);
  await page.screenshot({ path: resolve(output, "comparison.png") });
  await page.setViewportSize({ width: 1440, height: 1120 });
  await focus(2); await page.click("#play");
  const beforePlay = await page.evaluate(() => window.dendriteStudy.state.progress);
  await page.waitForTimeout(450); assert.ok(await page.evaluate(() => window.dendriteStudy.state.progress) > beforePlay);
  await page.click("#play"); assert.equal(await page.evaluate(() => window.dendriteStudy.state.playing), false);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const style of [2, 3]) {
    await focus(style); await seek(.82);
    await page.locator(".study.selected .viewport").scrollIntoViewIfNeeded(); await seek(.82);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: resolve(output, `mobile-${style}.png`) });
  }
  await page.emulateMedia({ reducedMotion: "reduce" }); await page.reload();
  await loaded("named-stellar-dendrites-baseline");
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.playing), false);
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.progress), .82);
  assert.deepEqual(errors, []);
  const report = { samples, controls: { narrow: narrow.recent.count, wide: wide.recent.count, changedLight: right.hash !== left.hash }, errors,
    checks: ["retired UI removed", "representative direct/axial/composed renders", "nonempty masks", "exact repeat after backward seek", "no future events", "window changes displayed sites", "light changes relief", "paused camera drag", "gallery preserves new view", "bounded geometry reuse", "comparison", "play/pause", "mobile overflow", "reduced motion"] };
  writeFileSync(resolve(output, "browser-smoke.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ renders: samples.length * 5, ...report, samples: samples.length }));
} finally { await browser.close(); }
