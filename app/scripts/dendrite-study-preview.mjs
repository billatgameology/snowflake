// Live product smoke and optional deterministic comparison film. No solver runs.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "../..");
const output = resolve(root, "out/dendrite-styles");
mkdirSync(output, { recursive: true });
const url = process.env.DENDRITE_STUDY_URL ?? "http://127.0.0.1:5191/dendrite-styles.html?capture=1";
const browser = await chromium.launch({ headless: true });
const errors = [];
let encoder;
const page = await browser.newPage({ viewport: { width: 1440, height: 1260 }, deviceScaleFactor: 1 });
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
try {
  await page.goto(url);
  await page.waitForFunction(() => window.dendriteStudy?.ready);
  await page.evaluate(() => { window.dendriteStudy.focus(null); window.dendriteStudy.seek(0); });
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.visible), 19);
  await page.evaluate(() => window.dendriteStudy.seek(1));
  const endpoint = await page.evaluate(() => window.dendriteStudy.state);
  assert.equal(endpoint.visible, endpoint.eventCount);
  await page.evaluate(() => window.dendriteStudy.seek(0.6));
  const middle = await page.evaluate(() => window.dendriteStudy.state.visible);
  await page.evaluate(() => window.dendriteStudy.seek(0.2));
  assert.ok(await page.evaluate(() => window.dendriteStudy.state.visible) < middle);
  await page.locator("#timeline").fill("820");
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.progress), 0.82);
  await page.screenshot({ path: resolve(output, "comparison.png") });
  for (let index = 0; index < 4; index++) {
    await page.evaluate(i => window.dendriteStudy.focus(i), index);
    await page.screenshot({ path: resolve(output, `style-${index + 1}.png`) });
  }
  await page.locator("#light-angle").fill("0");
  await page.screenshot({ path: resolve(output, "crystal-cast-light-right.png") });
  await page.locator("#light-angle").fill("180");
  await page.screenshot({ path: resolve(output, "crystal-cast-light-left.png") });
  // Exercise the actual drag path while paused (a dirty-render regression boundary).
  const viewport = await page.locator('.study.selected .viewport').boundingBox();
  await page.mouse.move(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2);
  await page.mouse.down();
  await page.mouse.move(viewport.x + viewport.width / 2 + 90, viewport.y + viewport.height / 2 + 25);
  await page.mouse.up();
  await page.screenshot({ path: resolve(output, "crystal-cast-orbit.png") });
  await page.locator("#layout").click();
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.focused), false);
  await page.locator("#play").click();
  const before = await page.evaluate(() => window.dendriteStudy.state.progress);
  await page.waitForTimeout(350);
  assert.ok(await page.evaluate(() => window.dendriteStudy.state.progress) > before);
  await page.locator("#play").click();
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.playing), false);
  await page.locator("#replay").click();
  assert.ok(await page.evaluate(() => window.dendriteStudy.state.progress) < 0.1);
  await page.evaluate(() => window.dendriteStudy.seek(0.82));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(output, "mobile.png"), fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.waitForFunction(() => window.dendriteStudy?.ready);
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.playing), false);
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => window.dendriteStudy.state.progress), 0.82);

  if (process.argv.includes("--video")) {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1440, height: 1260 });
    await page.evaluate(() => window.dendriteStudy.focus(null));
    await page.locator("#light-angle").evaluate(node => { node.value = "130"; node.dispatchEvent(new Event("input", { bubbles: true })); });
    const film = resolve(output, "dendrite-styles.mp4");
    encoder = spawn("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-f", "image2pipe", "-vcodec", "mjpeg", "-framerate", "24", "-i", "pipe:0", "-an", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", film], { stdio: ["pipe", "ignore", "inherit"] });
    const finished = once(encoder, "close");
    for (let frame = 0; frame < 240; frame++) {
      await page.evaluate(fraction => window.dendriteStudy.seek(fraction), Math.min(1, frame / 192));
      const jpeg = await page.screenshot({ type: "jpeg", quality: 92 });
      if (!encoder.stdin.write(jpeg)) await once(encoder.stdin, "drain");
      if (frame % 48 === 0) console.log(`Preview film: frame ${frame}/240`);
    }
    encoder.stdin.end();
    const [exit] = await finished;
    assert.equal(exit, 0, "video encoder failed");
    console.log(film);
  }
  assert.deepEqual(errors, []);
  const report = { page: url, endpoint, browserErrors: errors, checks: ["seed", "endpoint", "backward seek", "UI scrub", "four styles", "light direction", "paused drag", "play/pause", "replay", "mobile overflow", "reduced motion"], video: process.argv.includes("--video") };
  writeFileSync(resolve(output, "browser-smoke.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  if (encoder && encoder.exitCode === null) encoder.kill();
  await browser.close();
}
