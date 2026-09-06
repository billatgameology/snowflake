import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { studyPanes } from "../src/three-views.ts";

const output = resolve(import.meta.dirname, "../../out/three-views");
mkdirSync(output, { recursive: true });
const base = process.env.DENDRITE_STUDY_URL ?? "http://127.0.0.1:5192/dendrite-styles.html";
const browser = await chromium.launch({ headless: true });
const errors = [], centering = [], samples = [];
const listen = page => {
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
};
const seek = (page, value) => page.evaluate(value => window.dendriteStudy.seek(value), value);
const focus = (page, value) => page.evaluate(value => window.dendriteStudy.focus(value), value);
const state = page => page.evaluate(() => window.dendriteStudy.state);
const loaded = (page, id) => page.waitForFunction(id => window.dendriteStudy?.ready && window.dendriteStudy.state.crystalId === id, id);
async function pixels(page, part) {
  return page.evaluate(part => {
    const source = document.querySelector("#crystal-canvas"), rect = document.querySelector(".study.selected .viewport").getBoundingClientRect();
    const area = part ?? { left: 0, top: 0, width: rect.width, height: rect.height };
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d"), scale = source.width / innerWidth;
    ctx.drawImage(source, (rect.left + area.left) * scale, (rect.top + area.top) * scale, area.width * scale, area.height * scale, 0, 0, 256, 256);
    const bytes = ctx.getImageData(0, 0, 256, 256).data;
    let minX = 256, minY = 256, maxX = 0, maxY = 0, count = 0, colored = 0, hash = 2166136261;
    // Ignore only the rasterized viewport seam; a clipped crystal still reaches this inset.
    for (let y = 2; y < 254; y++) for (let x = 2; x < 254; x++) {
      const i = (y * 256 + x) * 4;
      hash = Math.imul(hash ^ bytes[i], 16777619); hash = Math.imul(hash ^ bytes[i + 1], 16777619);
      if (bytes[i + 1] > 40 && bytes[i + 2] > 40) colored++;
      if (bytes[i + 1] < 185 && bytes[i + 1] > 30) {
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); count++;
      }
    }
    return { minX, minY, maxX, maxY, count, colored, hash: hash >>> 0, center: [(minX + maxX) / 512, (minY + maxY) / 512] };
  }, part);
}
const centered = sample => {
  assert.ok(sample.count > 1000); assert.ok(Math.abs(sample.center[0] - .5) < .035); assert.ok(Math.abs(sample.center[1] - .5) < .035);
  assert.ok(sample.minX > 3 && sample.minY > 3 && sample.maxX < 252 && sample.maxY < 252, JSON.stringify(sample));
};
try {
  for (const dpr of [1, 1.5, 2]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: dpr }); listen(page);
    await page.goto(`${base}?capture=1&style=3&crystal=sweep-t1-sharp`); await loaded(page, "sweep-t1-sharp"); await seek(page, 1);
    const sample = await pixels(page); centered(sample); centering.push({ dpr, layout: "focused", ...sample });
    await page.screenshot({ path: resolve(output, `cast-dpr-${dpr}.png`) });
    await page.setViewportSize({ width: 1000, height: 950 });
    await page.locator(".study.selected .viewport").scrollIntoViewIfNeeded(); await seek(page, 1);
    await page.screenshot({ path: resolve(output, `cast-resized-${dpr}.png`) });
    const resized = await pixels(page); centered(resized); centering.push({ dpr, layout: "resized/scrolled", ...resized });
    await page.setViewportSize({ width: 1440, height: 1500 }); await focus(page, null); await seek(page, 1);
    const comparison = await pixels(page); centered(comparison); centering.push({ dpr, layout: "comparison", ...comparison });
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1.5, acceptDownloads: true }); listen(page);
  await page.goto(`${base}?capture=1&style=2&crystal=sweep-t1-sharp`); await loaded(page, "sweep-t1-sharp");
  assert.doesNotMatch(await page.locator("body").innerText(), /Growth Front|Darkfield|Chronograph/u);
  assert.equal(await page.locator("#growth-window").count(), 0);
  assert.equal(await page.locator("#view option[value='2']").innerText(), "Three Views");
  for (const id of ["sweep-t1-sharp", "named-stellar-dendrites-baseline", "named-cups-baseline", "named-radiating-dendrites-baseline"]) {
    await page.locator("#crystal").selectOption(id, { force: true }); await loaded(page, id); await focus(page, 2);
    const box = await page.locator(".study.selected .viewport").boundingBox(), panes = studyPanes(box.width, box.height);
    const hashes = [];
    for (const at of [0, .35, .82, 1, .35]) {
      await seek(page, at); const current = await state(page);
      if (at === 1) assert.equal(current.visible, current.eventCount);
      assert.ok(current.geometries <= 2); hashes.push((await pixels(page)).hash);
      if (at === .82) {
        for (const [pane, rect] of Object.entries(panes)) {
          const sample = await pixels(page, rect); assert.ok(sample.colored > 100, `${id}/${pane} blank`);
          samples.push({ id, pane, ...sample });
        }
        await page.screenshot({ path: resolve(output, `${id}-three.png`) });
      }
    }
    assert.equal(hashes[1], hashes[4]); assert.notEqual(hashes[1], hashes[2]);
  }
  await page.click("#browse-crystals"); await page.fill("#crystal-search", "sharpened");
  await page.click('[data-crystal="sweep-t1-sharp"]'); await loaded(page, "sweep-t1-sharp");
  assert.equal((await state(page)).selected, 2); await seek(page, .82);
  const box = await page.locator(".study.selected .viewport").boundingBox(), panes = studyPanes(box.width, box.height);
  const initial = await state(page), topBefore = await pixels(page, panes.top), detailBefore = await pixels(page, panes.detail);
  const detail = panes.detail, x = box.x + detail.left + detail.width / 2, y = box.y + detail.top + detail.height / 2;
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 45, y + 25); await page.mouse.up(); await seek(page, .82);
  assert.equal((await pixels(page, panes.top)).hash, topBefore.hash); assert.notEqual((await pixels(page, panes.detail)).hash, detailBefore.hash);
  assert.deepEqual((await state(page)).paneAngles.top, initial.paneAngles.top);
  await page.mouse.dblclick(x, y); await seek(page, .82); assert.equal((await pixels(page, panes.detail)).hash, detailBefore.hash);
  await page.locator("#detail-zoom").fill("5"); await seek(page, .82); assert.notEqual((await pixels(page, panes.detail)).hash, detailBefore.hash);
  await page.locator("#detail-zoom").fill("3.2"); await seek(page, .82);
  await page.click("#toggle-graphs"); await page.check('[data-graph="reach"]'); await seek(page, .62);
  assert.equal((await state(page)).statistics.attached, (await state(page)).visible);
  await page.click("#export-mp4"); await page.selectOption("#export-duration", "10"); await page.selectOption("#export-resolution", "1080");
  const downloaded = page.waitForEvent("download", { timeout: 180000 }); await page.click("#start-export");
  const video = resolve(output, "three-views-with-graphs.mp4"); await (await downloaded).saveAs(video);
  await page.waitForFunction(() => !window.dendriteStudy.state.exporting);
  assert.equal((await state(page)).progress, .62); assert.equal((await state(page)).playing, false); assert.deepEqual((await state(page)).paneAngles, initial.paneAngles);
  const movie = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name,width,height,nb_frames,r_frame_rate", "-show_entries", "format=duration,size", "-of", "json", video], { encoding: "utf8" }));
  assert.equal(movie.streams[0].codec_name, "h264"); assert.equal(movie.streams[0].height, 1080); assert.equal(movie.streams[0].nb_frames, "300");
  execFileSync("ffmpeg", ["-v", "error", "-i", video, "-f", "null", "-"], { stdio: "pipe" });
  execFileSync("ffmpeg", ["-y", "-v", "error", "-ss", "6", "-i", video, "-frames:v", "1", resolve(output, "export-frame.png")], { stdio: "pipe" });
  await page.click("#close-export");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const style of [2, 3]) {
    await focus(page, style); await seek(page, .82); await page.locator(".study.selected .viewport").scrollIntoViewIfNeeded(); await seek(page, .82);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    // A fixed WebGL canvas must be inspected at its real viewport, not in a full-page mosaic.
    await page.screenshot({ path: resolve(output, `mobile-${style}.png`) });
  }
  await focus(page, 2); await page.emulateMedia({ reducedMotion: "reduce" }); await page.reload(); await loaded(page, "sweep-t1-sharp");
  assert.equal((await state(page)).playing, false); assert.equal((await state(page)).progress, .82);
  assert.deepEqual(errors, []);
  const report = { base, centering, samples, movie, errors, checks: ["three synchronized panes", "real branch target", "independent pane rotation/reset", "detail zoom", "retired controls removed", "direct/axial/composed forms", "deterministic backward seek", "gallery retention", "graphs", "DPR centering", "scroll/resize/comparison", "1080p MP4 with all panes and graphs", "restored state", "mobile", "reduced motion"] };
  writeFileSync(resolve(output, "browser-smoke.json"), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
} finally { await browser.close(); }
