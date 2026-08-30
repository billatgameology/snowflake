// Capture strict growth-scene-v1 playback at start, middle, and final time for every completed
// final Compose entry. The browser fetches, hashes, and decodes the actual component assets before
// __spikeReady becomes true. This script records capture identities but never accepts catalog rows.
//
// node scripts/named-crystal-final-compose-review.mjs \
//   --root out/named-crystal-catalog/final-compose-v1 --port 5206

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { chromium } from "playwright";

const argument = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (value === undefined || value === "") throw new Error(`--${name} wants a non-empty value`);
  return value;
};

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const webPath = (value) => value.replaceAll("\\", "/");
const repo = resolve(import.meta.dirname, "..");
const rawRoot = argument("root", "");
if (rawRoot === "") throw new Error("need --root <completed final Compose output root>");
const root = resolve(repo, rawRoot);
const reportPath = join(root, "report.json");
const reportBytes = readFileSync(reportPath);
const report = JSON.parse(reportBytes.toString());
if (
  report.format !== "named-crystal-final-compose-report-v1"
  || report.completed !== 33
  || report.failed !== 0
  || !Array.isArray(report.results)
  || report.results.length !== 33
) {
  throw new Error("review root does not contain a complete successful final Compose report");
}
if (new Set(report.results.map(({ entryId }) => entryId)).size !== 33) {
  throw new Error("final Compose report duplicates an entry identity");
}

const port = Number(argument("port", "5206"));
if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) throw new Error("--port is invalid");
const outputRoot = join(root, "browser-review");
mkdirSync(outputRoot, { recursive: true });
const stages = [
  { id: "start", fraction: 0 },
  { id: "middle", fraction: 0.55 },
  { id: "final", fraction: 1 },
];

const vite = spawn(
  process.execPath,
  [join(repo, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
  { cwd: join(repo, "app"), stdio: ["ignore", "ignore", "inherit"] },
);
const deadline = Date.now() + 30_000;
while (true) {
  try {
    if ((await fetch(`http://127.0.0.1:${port}/spike-gg-realism.html`)).ok) break;
  } catch {}
  if (Date.now() >= deadline) throw new Error("Vite did not start");
  await new Promise((resolveWait) => setTimeout(resolveWait, 200));
}

const captures = [];
const browser = await chromium.launch({ headless: true, args: ["--enable-unsafe-webgpu"] });
try {
  for (const result of report.results) {
    if (
      typeof result.entryId !== "string"
      || result.entryId === ""
      || typeof result.scene?.path !== "string"
      || !Number.isSafeInteger(result.scene.byteLength)
      || !/^[0-9a-f]{64}$/.test(result.scene.sha256)
      || result.coldWebPayloadBytes >= report.webPayloadLimitBytes
    ) {
      throw new Error("final Compose report contains a malformed result");
    }
    const scenePath = resolve(repo, result.scene.path);
    const sceneBytes = readFileSync(scenePath);
    if (sceneBytes.byteLength !== result.scene.byteLength || sha256(sceneBytes) !== result.scene.sha256) {
      throw new Error(`${result.entryId}: scene identity drift`);
    }
    const page = await browser.newPage({ viewport: { width: 720, height: 720 } });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    try {
      const sceneUrl = `/@fs/${webPath(scenePath)}`;
      const params = new URLSearchParams({
        growthScene: sceneUrl,
        capture: "1",
        ui: "0",
        look: "glass",
      });
      await page.goto(`http://127.0.0.1:${port}/spike-gg-realism.html?${params}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForFunction(
        () => window.__spikeReady === true || window.__spikeError !== undefined,
        undefined,
        { timeout: 120_000 },
      );
      const error = await page.evaluate(() => window.__spikeError);
      if (error !== undefined) throw new Error(`${result.entryId}: ${String(error)}`);
      const duration = await page.evaluate(() => window.__sceneDuration);
      if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
        throw new Error(`${result.entryId}: browser did not expose a valid scene duration`);
      }
      for (const stage of stages) {
        await page.evaluate((seconds) => window.__sceneSeek(seconds), duration * stage.fraction);
        const path = join(outputRoot, `${result.entryId}-${stage.id}.png`);
        const bytes = await page.screenshot({ path });
        captures.push({
          entryId: result.entryId,
          typeId: result.typeId,
          slot: result.slot,
          stage: stage.id,
          fraction: stage.fraction,
          path: webPath(relative(repo, path)),
          byteLength: bytes.byteLength,
          sha256: sha256(bytes),
        });
      }
      if (pageErrors.length !== 0) {
        throw new Error(`${result.entryId}: page errors: ${pageErrors.join(" | ")}`);
      }
    } finally {
      await page.close();
    }
    console.log(result.entryId);
  }
} finally {
  await browser.close();
  vite.kill("SIGTERM");
}

if (captures.length !== 99) throw new Error(`expected 99 captures, got ${captures.length}`);
const review = {
  format: "named-crystal-final-compose-browser-review-v1",
  sourceReport: {
    path: webPath(relative(repo, reportPath)),
    byteLength: reportBytes.byteLength,
    sha256: sha256(reportBytes),
  },
  playback: {
    page: "app/spike-gg-realism.html",
    queryMode: "growthScene",
    componentVerification: "browser-fetch-sha256-decodeGrowthAssetV1",
    stages,
  },
  completedEntries: 33,
  captures,
};
const reviewPath = join(root, "browser-review.json");
writeFileSync(reviewPath, canonicalJson(review));
console.log(JSON.stringify({ review: reviewPath, captures: captures.length, bytes: statSync(reviewPath).size }));
