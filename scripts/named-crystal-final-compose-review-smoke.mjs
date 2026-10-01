// Built-app browser smoke for strict growthScene review-camera integration.
// Run `npm run build --workspace app` first.
//
// node scripts/named-crystal-final-compose-review-smoke.mjs --port 5207

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { chromium } from "playwright";

const argument = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (value === undefined || value === "") throw new Error(`--${name} wants a non-empty value`);
  return value;
};
const port = Number(argument("port", "5207"));
if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) throw new Error("--port is invalid");
const repo = resolve(import.meta.dirname, "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const encodeGrowth = () => {
  const events = [[1, 0], [2, 0], [3, 5], [7, 20]];
  const header = new TextEncoder().encode(JSON.stringify({
    format: "gutcheck-growth-v1",
    eventCount: events.length,
    attachedCount: events.length,
    seedCount: 2,
    finalTick: 20,
    config: { dims: { nx: 4, ny: 4, nz: 2 }, center: [2, 2, 1] },
  }));
  const bytes = new Uint8Array(4 + header.length + events.length * 8);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, header.length, true);
  bytes.set(header, 4);
  for (const [index, [flat, tick]] of events.entries()) {
    view.setUint32(4 + header.length + index * 8, flat, true);
    view.setUint32(4 + header.length + index * 8 + 4, tick, true);
  }
  return bytes;
};

const growth = encodeGrowth();
const growthSha = sha256(growth);
const component = (id, rotateDegrees) => ({
  id,
  growthAsset: { url: "/smoke-growth-v1.bin", byteLength: growth.byteLength, sha256: growthSha },
  scientificBundle: { locator: `smoke:${id}`, identitySha256: "b".repeat(64) },
  transform: { translate: [0, 0, 0], rotateDegrees, scale: 1 },
  phaseOffset: 0,
});
const scene = JSON.stringify({
  format: "growth-scene-v1",
  title: "Review camera smoke",
  disclosure: "composed-visualization",
  durationSeconds: 8,
  variation: { driver: "cross-angle", value: 60, unit: "degrees" },
  bounds: { xMin: -10, xMax: 10, yMin: -8, yMax: 8, zMin: -5, zMax: 5 },
  camera: { tiltDegrees: 38, yawDegrees: 15, zoom: 1 },
  components: [component("part-a", [0, 0, 0]), component("part-b", [30, 0, 0])],
});

const preview = spawn(
  process.execPath,
  [join(repo, "node_modules/vite/bin/vite.js"), "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
  { cwd: join(repo, "app"), stdio: ["ignore", "ignore", "inherit"] },
);
const deadline = Date.now() + 30_000;
while (true) {
  try {
    if ((await fetch(`http://127.0.0.1:${port}/spike-gg-realism.html`)).ok) break;
  } catch {}
  if (Date.now() >= deadline) throw new Error("built app preview did not start");
  await new Promise((resolveWait) => setTimeout(resolveWait, 200));
}

const browser = await chromium.launch({ headless: true, args: ["--enable-unsafe-webgpu"] });
const open = async (params) => {
  const page = await browser.newPage({ viewport: { width: 640, height: 640 } });
  await page.route("**/smoke-scene.json", (route) =>
    route.fulfill({ body: scene, contentType: "application/json" }),
  );
  await page.route("**/smoke-growth-v1.bin", (route) =>
    route.fulfill({ body: Buffer.from(growth), contentType: "application/octet-stream" }),
  );
  await page.goto(`http://127.0.0.1:${port}/spike-gg-realism.html?${new URLSearchParams({
    growthScene: "/smoke-scene.json",
    ui: "0",
    look: "glass",
    ...params,
  })}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => window.__spikeReady === true || window.__spikeError !== undefined,
    undefined,
    { timeout: 120_000 },
  );
  return page;
};

try {
  const bounded = await open({ capture: "1", reviewTilt: "85", reviewYaw: "0" });
  const boundedError = await bounded.evaluate(() => window.__spikeError);
  if (boundedError !== undefined) throw new Error(`bounded override failed: ${String(boundedError)}`);
  const duration = await bounded.evaluate(() => window.__sceneDuration);
  if (duration !== 8) throw new Error(`built viewer duration drift: ${String(duration)}`);
  await bounded.evaluate((seconds) => window.__sceneSeek(seconds), duration);
  const capture = await bounded.screenshot();
  await bounded.close();

  const ignored = await open({ capture: "0", reviewTilt: "91", reviewYaw: "181" });
  const ignoredError = await ignored.evaluate(() => window.__spikeError);
  if (ignoredError !== undefined) throw new Error(`normal playback applied capture-only params: ${String(ignoredError)}`);
  await ignored.close();

  const refused = await open({ capture: "1", reviewTilt: "91", reviewYaw: "0" });
  const refusedError = await refused.evaluate(() => window.__spikeError);
  if (typeof refusedError !== "string" || !refusedError.includes("reviewTilt must be finite")) {
    throw new Error(`out-of-range capture override was not refused: ${String(refusedError)}`);
  }
  await refused.close();
  console.log(JSON.stringify({
    builtPlayback: "ok",
    boundedCaptureSha256: sha256(capture),
    normalPlaybackIgnoredReviewParams: true,
    outOfRangeCaptureRefused: true,
  }));
} finally {
  await browser.close();
  preview.kill("SIGTERM");
}
