// Small product stills, captured from the existing Timeglass renderer and verified replays.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { loadStudyManifest } from "../growth-study-assets.ts";

const root = resolve(import.meta.dirname, "../..");
const folder = resolve(root, "app/data/growth-previews");
mkdirSync(folder, { recursive: true });
const entries = loadStudyManifest(root).entries;
const url = process.env.DENDRITE_STUDY_URL ?? "http://127.0.0.1:5192/dendrite-styles.html?capture=1";
const rendererCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 384, height: 320 }, deviceScaleFactor: 1 });
const previews = [], errors = [];
page.on("pageerror", e => errors.push(e.message));
try {
  await page.goto(url);
  await page.waitForFunction(() => window.dendriteStudy?.ready);
  await page.addStyleTag({ content: "main{opacity:0!important}.study.selected .viewport{position:fixed!important;inset:0!important;width:384px!important;height:320px!important;min-height:0!important}" });
  for (const [index, entry] of entries.entries()) {
    await page.evaluate(id => { const select = document.querySelector("#crystal"); select.value = id; select.dispatchEvent(new Event("change")); }, entry.id);
    await page.waitForFunction(id => window.dendriteStudy?.ready && window.dendriteStudy.state.crystalId === id, entry.id);
    const result = await page.evaluate(() => {
      window.dendriteStudy.focus(1); window.dendriteStudy.seek(1);
      const canvas = document.querySelector("#crystal-canvas");
      const sample = document.createElement("canvas"); sample.width = sample.height = 64;
      const context = sample.getContext("2d"); context.drawImage(canvas, 0, 0, 64, 64);
      const pixels = context.getImageData(0, 0, 64, 64).data, colors = new Set();
      for (let i = 0; i < pixels.length; i += 4) colors.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`);
      return { ...window.dendriteStudy.state, colors: colors.size, image: canvas.toDataURL("image/png") };
    });
    assert.equal(result.sourceSha256, entry.sourceSha256);
    assert.equal(result.visible, entry.eventCount);
    assert.ok(result.colors > 4, `Empty preview: ${entry.id}`);
    const bytes = Buffer.from(result.image.split(",")[1], "base64");
    writeFileSync(resolve(folder, `${entry.id}.png`), bytes);
    previews.push({ id: entry.id, sourceSha256: entry.sourceSha256, sha256: createHash("sha256").update(bytes).digest("hex"), byteLength: bytes.length });
    if (index % 20 === 0) console.log(`Timeglass previews: ${index + 1}/${entries.length}`);
  }
  assert.deepEqual(errors, []);
  const manifest = { format: "growth-study-previews-v1", recipe: "timeglass-final-384x320-v1", rendererCommit, previews };
  writeFileSync(resolve(folder, "index.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(JSON.stringify({ previews: previews.length, bytes: previews.reduce((sum, p) => sum + p.byteLength, 0), errors }));
} finally { await browser.close(); }
