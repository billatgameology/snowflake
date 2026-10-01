import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { readGrowthStudy } from "../src/growth-study-data.ts";

const root = resolve(import.meta.dirname, "../.."), out = resolve(root, "out/growth-insights");
mkdirSync(out, { recursive: true });
const base = process.env.DENDRITE_STUDY_URL ?? "http://127.0.0.1:5192/dendrite-styles.html";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, acceptDownloads: true });
const errors = [], exports = [], quantities = [];
page.on("pageerror", e => errors.push(e.message));
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
const state = () => page.evaluate(() => window.dendriteStudy.state);
const seek = value => page.evaluate(value => window.dendriteStudy.seek(value), value);
const loaded = id => page.waitForFunction(id => window.dendriteStudy?.ready && window.dendriteStudy.state.crystalId === id, id);
async function exportVideo(name, resolution, includeGraphs) {
  await page.click("#export-mp4"); await page.selectOption("#export-duration", "10");
  await page.selectOption("#export-resolution", String(resolution));
  await page.locator("#export-graphs").setChecked(includeGraphs);
  const download = page.waitForEvent("download", { timeout: 180000 });
  await page.click("#start-export"); const file = await download;
  const path = resolve(out, `${name}.mp4`); await file.saveAs(path);
  await page.waitForFunction(() => !window.dendriteStudy.state.exporting);
  const info = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height,r_frame_rate,nb_frames,duration", "-show_entries", "format=format_name,duration,size", "-of", "json", path], { encoding: "utf8" }));
  const stream = info.streams[0]; assert.equal(stream.codec_name, "h264"); assert.equal(stream.height, resolution);
  assert.equal(stream.width, resolution * 16 / 9); assert.equal(stream.r_frame_rate, "30/1");
  assert.equal(Number(stream.nb_frames), 300); assert.equal(Number(info.format.duration), 10);
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", path, "-f", "null", "-"], { stdio: "pipe" });
  execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-ss", "6", "-i", path, "-frames:v", "1", resolve(out, `${name}-frame.png`)], { stdio: "pipe" });
  exports.push({ name, includeGraphs, ...info });
  await page.click("#close-export");
}
try {
  await page.goto(`${base}?capture=1&crystal=sweep-t1-sharp&style=1`); await loaded("sweep-t1-sharp");
  assert.equal(await page.locator("#growth-graphs").isVisible(), false);
  await page.click("#toggle-graphs"); await seek(.62);
  assert.deepEqual((await state()).graphs, ["attached", "activity"]);
  await page.check('[data-graph="reach"]'); await seek(.62);
  assert.equal((await state()).statistics.attached, (await state()).visible);
  const chart = page.locator('[data-chart="attached"] canvas'), box = await chart.boundingBox();
  await page.mouse.click(box.x + 46 + (box.width - 64) * .33, box.y + 100);
  assert.ok(Math.abs((await state()).progress - .33) < .001); assert.equal((await state()).playing, false);
  await chart.focus(); await page.keyboard.press("ArrowRight"); assert.ok(Math.abs((await state()).progress - .34) < .001);
  for (const kind of ["attached", "activity", "reach"]) await page.uncheck(`[data-graph="${kind}"]`);
  assert.equal(await page.locator("#graphs-empty").isVisible(), true);
  for (const kind of ["attached", "activity", "reach"]) await page.check(`[data-graph="${kind}"]`);
  await page.selectOption("#view", "all"); assert.equal(await page.locator("#growth-graphs").isVisible(), false);
  assert.equal(await page.locator("#export-mp4").isVisible(), false);
  await page.selectOption("#view", "1"); assert.deepEqual((await state()).graphs, ["attached", "activity", "reach"]);
  // A pending selection clears old statistics instead of displaying them under the new title.
  let release; const released = new Promise(resolve => { release = resolve; });
  await page.route("**/growth-studies/named-radiating-dendrites-baseline.bin", async route => { await released; await route.continue(); });
  await page.locator("#crystal").selectOption("named-radiating-dendrites-baseline", { force: true });
  await page.waitForFunction(() => window.dendriteStudy.state.loading);
  assert.equal((await state()).statistics, null); assert.equal(await page.locator("#export-mp4").isDisabled(), true);
  release(); await loaded("named-radiating-dendrites-baseline"); await page.unroute("**/growth-studies/named-radiating-dendrites-baseline.bin");
  assert.match(await page.locator("#graphs-provenance").textContent(), /scene instances.*scene origin/u);
  const bytes = readFileSync(resolve(root, "app/dist/growth-studies/named-radiating-dendrites-baseline.bin"));
  const data = readGrowthStudy(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  for (const progress of [0, .07, .14, .28, .375, .55, .56, .995, 1]) {
    const interval = Array.from({ length: 100 }, (_, i) => (i + 1) / 100).findIndex(end => progress <= end) + 1;
    const time = progress * data.finalTick, lower = (interval - 1) / 100 * data.finalTick;
    let attached = 0, activity = 0, reachSquared = 0;
    for (let i = 0; i < data.ticks.length; i++) if (data.ticks[i] <= time) {
      attached++; if (progress > 0 && data.ticks[i] > lower) activity++;
      reachSquared = Math.max(reachSquared, data.positions[i*3] ** 2 + data.positions[i*3+1] ** 2 + data.positions[i*3+2] ** 2);
    }
    await seek(progress); const actual = (await state()).statistics;
    assert.equal(actual.attached, attached); assert.equal(actual.activity, activity);
    assert.ok(Math.abs(actual.reach - Math.sqrt(reachSquared)) < 1e-7);
    quantities.push({ progress, attached, activity, reach: actual.reach });
  }
  await page.locator("#crystal").selectOption("sweep-t1-sharp", { force: true }); await loaded("sweep-t1-sharp");
  await seek(.62); await page.locator("#toggle-graphs").scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(out, "graphs-final.png") });
  await page.click("#export-mp4"); await page.selectOption("#export-duration", "30");
  await page.click("#start-export"); await page.waitForFunction(() => window.dendriteStudy.state.exporting);
  await page.click("#close-export"); await page.waitForFunction(() => !window.dendriteStudy.state.exporting);
  assert.match(await page.locator("#export-message").textContent(), /cancelled/u);
  assert.equal((await state()).progress, .62); assert.equal((await state()).playing, false);
  await page.keyboard.press("Escape"); assert.equal(await page.locator("#video-export").isVisible(), false);
  assert.ok(await page.locator("#export-mp4").evaluate(el => el === document.activeElement));
  await exportVideo("timeglass-with-graphs", 720, true);
  assert.equal((await state()).progress, .62); assert.equal((await state()).playing, false);
  await page.selectOption("#view", "3"); await seek(.45);
  await page.locator("#light-angle").fill("35");
  await exportVideo("crystal-cast-1080p", 1080, false);
  assert.equal((await state()).progress, .45); assert.equal((await state()).selected, 3);
  // A running view resumes after cancellation as well.
  await page.click("#play"); await page.click("#export-mp4"); await page.click("#start-export");
  await page.waitForFunction(() => window.dendriteStudy.state.exporting); await page.click("#close-export");
  await page.waitForFunction(() => !window.dendriteStudy.state.exporting);
  assert.equal((await state()).playing, true); await page.click("#close-export"); await seek(.62);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#growth-graphs").scrollIntoViewIfNeeded(); await seek(.62);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: resolve(out, "mobile-graphs.png") });
  await page.click("#export-mp4");
  assert.ok(await page.locator("#video-export").evaluate(el => el.scrollWidth <= el.clientWidth));
  await page.screenshot({ path: resolve(out, "mobile-export.png") });
  await page.click("#close-export");
  // Missing browser encoder support is reported with state restored and no fake file.
  const unsupported = await browser.newPage();
  await unsupported.addInitScript(() => { Object.defineProperty(window, "VideoEncoder", { value: undefined }); });
  await unsupported.goto(`${base}?capture=1&style=1`); await unsupported.waitForFunction(() => window.dendriteStudy?.ready);
  await unsupported.evaluate(() => window.dendriteStudy.seek(.4));
  await unsupported.click("#export-mp4"); await unsupported.click("#start-export");
  await unsupported.waitForFunction(() => !window.dendriteStudy.state.exporting);
  assert.match(await unsupported.locator("#export-message").textContent(), /browser video encoding/u);
  assert.equal(await unsupported.evaluate(() => window.dendriteStudy.state.progress), .4); await unsupported.close();
  assert.deepEqual(errors, []);
  const report = { quantities, exports, errors, checks: ["optional independent graphs", "click and keyboard seek", "comparison hides graphs/export", "choices retained", "stale stats cleared", "composed source comparison", "MP4 720p with graphs", "MP4 1080p without graphs", "decoded video streams", "cancel restores paused/running state", "success restores view", "unsupported encoder error", "mobile layout"] };
  writeFileSync(resolve(out, "browser-smoke.json"), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
} finally { await browser.close(); }
