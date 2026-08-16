// Real-browser verification for the measured per-frame-versus-compact comparison page.
// The harness independently checks every referenced byte before serving it, then proves the
// valid page loads one compact asset and no legacy manifest or mesh frame.
//
// node app/scripts/growth-comparison-capture.mjs \
//   --record out/gutcheck-growth-runB/comparison-record.json \
//   --growth out/gutcheck-growth-runB/gutcheck-growth-v1.bin \
//   --legacy-video /path/to/growth-B-intro.mp4 \
//   --poster /path/to/start.png --poster /path/to/middle.png --poster /path/to/final.png \
//   --out-dir out/gutcheck-growth-runB/comparison-browser

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

import { decodeGrowthComparisonRecord } from "../src/gutcheck-growth-comparison-record.ts";
import { decodeGrowthAsset, growthCropSize } from "../src/gutcheck-growth-format.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(scriptDir, "..");

function fail(message) {
  throw new Error(`growth comparison capture: ${message}`);
}

function parseInteger(text, minimum, label) {
  if (!/^(?:0|[1-9][0-9]*)$/u.test(text)) fail(`${label} must be a base-10 integer`);
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value < minimum) fail(`${label} must be >= ${minimum}`);
  return value;
}

function parseArgs(argv) {
  const options = {
    record: "",
    growth: "",
    legacyVideo: "",
    posters: [],
    outDir: "",
    width: 1440,
    height: 900,
    port: 4334,
  };
  const singleton = new Set();
  for (let index = 0; index < argv.length; index++) {
    const option = argv[index];
    const next = () => {
      const value = argv[++index];
      if (value === undefined || value === "") fail(`${option} wants a non-empty value`);
      return value;
    };
    if (option === "--poster") {
      options.posters.push(next());
      continue;
    }
    if (singleton.has(option)) fail(`duplicate option ${option}`);
    singleton.add(option);
    switch (option) {
      case "--record": options.record = next(); break;
      case "--growth": options.growth = next(); break;
      case "--legacy-video": options.legacyVideo = next(); break;
      case "--out-dir": options.outDir = next(); break;
      case "--width": options.width = parseInteger(next(), 640, "--width"); break;
      case "--height": options.height = parseInteger(next(), 480, "--height"); break;
      case "--port": options.port = parseInteger(next(), 1, "--port"); break;
      default: fail(`unknown option ${option}`);
    }
  }
  if (options.record === "" || options.growth === "" || options.legacyVideo === "" || options.outDir === "") {
    fail("need --record, --growth, --legacy-video, and --out-dir");
  }
  if (options.posters.length !== 3) fail("need exactly three --poster paths in start/middle/final order");
  return options;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function readJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    fail(`${label} is not valid JSON`);
  }
}

function assertFileReference(bytes, reference, label) {
  if (bytes.length !== reference.bytes) {
    fail(`${label} has ${bytes.length} bytes, record says ${reference.bytes}`);
  }
  const digest = sha256(bytes);
  if (digest !== reference.sha256) fail(`${label} SHA-256 ${digest} differs from ${reference.sha256}`);
}

function assertGrowthIdentity(bytes, record) {
  assertFileReference(bytes, record.compact.asset, "compact asset");
  const decoded = decodeGrowthAsset(bytes);
  const header = decoded.header;
  const mismatches = [];
  if (header.eventCount !== record.compact.eventCount) mismatches.push("event count");
  if (header.attachedCount !== record.compact.eventCount) mismatches.push("attached count");
  if (header.finalTick !== record.compact.finalTick) mismatches.push("final tick");
  if (header.config.preset !== record.run.preset) mismatches.push("preset");
  if (header.config.domain !== record.run.domain) mismatches.push("domain");
  if (header.config.rngSeed !== record.run.rngSeed) mismatches.push("RNG seed");
  if (header.config.noiseEpsilon !== record.run.noiseEpsilon) mismatches.push("noise");
  if (
    header.config.dims.nx !== record.run.dims.nx ||
    header.config.dims.ny !== record.run.dims.ny ||
    header.config.dims.nz !== record.run.dims.nz
  ) mismatches.push("dimensions");
  for (const key of ["iMin", "iMax", "jMin", "jMax", "kMin", "kMax", "padding"]) {
    if (header.crop[key] !== record.compact.crop[key]) mismatches.push(`crop ${key}`);
  }
  const size = growthCropSize(header.crop);
  const samples = size[0] * size[1] * size[2];
  if (samples !== record.compact.crop.sampleCount) mismatches.push("crop samples");
  if (samples * 4 !== record.compact.crop.r32uiBytes) mismatches.push("R32UI bytes");
  const endpoint = header.source.endpoint;
  if (
    endpoint === null || typeof endpoint !== "object" || Array.isArray(endpoint) ||
    endpoint.measuredOccupancySha256 !== record.compact.sourceIdentity.occupancySha256
  ) mismatches.push("occupancy SHA-256");
  const legacy = header.source.legacyComparison;
  if (
    legacy === null || typeof legacy !== "object" || Array.isArray(legacy) ||
    legacy.sha256 !== record.compact.sourceIdentity.manifestSha256
  ) mismatches.push("legacy manifest SHA-256");
  if (mismatches.length > 0) fail(`compact asset differs from record: ${mismatches.join(", ")}`);
  if (decoded.attachTicks[0] !== record.compact.firstTick) fail("first event tick differs from record");
  if (decoded.attachTicks.at(-1) > record.compact.finalTick) fail("event tick exceeds final tick");
  return decoded;
}

function referencePath(reference) {
  return new URL(reference, "http://capture.invalid/base/").pathname;
}

function mediaMap(recordBytes, record, growthBytes, videoBytes, posterBytes) {
  const map = new Map();
  map.set("/comparison-record.json", { body: recordBytes, contentType: "application/json" });
  map.set(referencePath(record.compact.asset.url), {
    body: growthBytes,
    contentType: "application/octet-stream",
  });
  map.set(referencePath(record.legacy.lightweightMedia.derivedVideo.url), {
    body: videoBytes,
    contentType: "video/mp4",
  });
  for (let index = 0; index < 3; index++) {
    map.set(referencePath(record.legacy.lightweightMedia.posters[index].url), {
      body: posterBytes[index],
      contentType: "image/png",
    });
  }
  if (map.size !== 6) fail("comparison media URLs collide after same-origin path resolution");
  return map;
}

async function installRoutes(context, map, requests, overrides = new Map()) {
  await context.route("**/*", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    requests.push({ url: request.url(), method: request.method(), resourceType: request.resourceType() });
    const override = overrides.get(pathname);
    if (override !== undefined) {
      await route.fulfill(override);
      return;
    }
    const media = map.get(pathname);
    if (media !== undefined) {
      await route.fulfill({
        status: 200,
        body: media.body,
        contentType: media.contentType,
        headers: { "cache-control": "no-store", "accept-ranges": "bytes" },
      });
      return;
    }
    await route.continue();
  });
}

function pageUrl(base) {
  const query = new URLSearchParams({ record: "/comparison-record.json" });
  return `${base}/gutcheck-growth-comparison.html?${query}`;
}

async function waitForComparison(page, allowError = false) {
  await page.waitForFunction(
    () => window.__growthComparisonReady === true || window.__growthComparisonError !== undefined,
    undefined,
    { timeout: 150_000 },
  );
  const state = await page.evaluate(() => ({
    ready: window.__growthComparisonReady ?? false,
    error: window.__growthComparisonError ?? null,
    debug: window.__growthComparisonDebug ?? null,
  }));
  if (!allowError && (!state.ready || state.error !== null || state.debug === null)) {
    fail(`valid comparison failed: ${state.error ?? "not ready"}`);
  }
  return state;
}

async function embeddedFrame(page) {
  const handle = await page.locator('[data-role="compact-frame"]').elementHandle();
  if (handle === null) fail("compact iframe is missing");
  const frame = await handle.contentFrame();
  if (frame === null) fail("compact iframe has no content frame");
  return frame;
}

async function pngHash(locator, path) {
  const bytes = await locator.screenshot({ path, type: "png" });
  return sha256(bytes);
}

function assertNoOverflow(measurement, label) {
  if (measurement.scrollWidth > measurement.innerWidth + 1) {
    fail(`${label} page overflows horizontally: ${JSON.stringify(measurement)}`);
  }
}

async function runValidLane(browser, base, map, record, outDir, viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const requests = [];
  await installRoutes(context, map, requests);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(pageUrl(base), { waitUntil: "domcontentloaded" });
  const initial = await waitForComparison(page);
  const frame = await embeddedFrame(page);
  const initialGrowth = await frame.evaluate(() => window.__growthDebug);
  if (initialGrowth === undefined) fail("embedded viewer did not publish its debug state");
  if (initial.debug.reducedMotion || !initialGrowth.playing) {
    fail("normal-motion comparison did not start compact autoplay");
  }
  if (!/^One crystal\.\s*Two timelines\.$/u.test((await page.locator("h1").textContent()) ?? "")) {
    fail("comparison headline is missing");
  }
  if (await page.locator("table").count() !== 1) fail("semantic comparison table is missing");
  const iframeTitle = await page.locator('[data-role="compact-frame"]').getAttribute("title");
  if (iframeTitle !== "Interactive compact Run B growth replay") fail("compact iframe title is missing");
  const displayedLegacy = await page.locator('[data-value="legacy-size-note"]').textContent();
  const displayedCompact = await page.locator('[data-value="compact-size-note"]').textContent();
  if (!displayedLegacy?.includes(record.legacy.v2qSequence.totalBytes.toLocaleString("en-US"))) {
    fail("legacy exact byte count is not rendered");
  }
  if (!displayedCompact?.includes(record.compact.asset.bytes.toLocaleString("en-US"))) {
    fail("compact exact byte count is not rendered");
  }
  const ratio = Math.round(record.legacy.v2qSequence.totalBytes / record.compact.asset.bytes);
  if ((await page.locator('[data-value="ratio"]').textContent()) !== `${ratio.toLocaleString("en-US")}× smaller`) {
    fail("displayed size ratio differs from the record");
  }

  const screenshots = {};
  screenshots.landscape = await pngHash(page, join(outDir, "landscape.png"));
  const fullPagePng = await page.screenshot({
    path: join(outDir, "full-page.png"),
    type: "png",
    fullPage: true,
  });
  screenshots.fullPage = sha256(fullPagePng);
  const buttons = page.locator('[data-role="poster-controls"] button');
  if (await buttons.count() !== 3) fail("comparison does not expose three exact-tick controls");
  const compactCanvas = page.locator('[data-role="compact-frame"]').contentFrame().locator("canvas");
  for (const [index, label] of ["start", "middle", "final"].entries()) {
    await buttons.nth(index).click();
    const tick = record.legacy.lightweightMedia.posters[index].tick;
    await frame.waitForFunction((expected) => window.__growthDebug?.tick === expected, tick);
    const videoTime = await page.locator('[data-role="legacy-video"]').evaluate((video) => video.currentTime);
    const expectedTime = record.legacy.lightweightMedia.posters[index].videoTimeSeconds;
    if (Math.abs(videoTime - expectedTime) > 0.08) {
      fail(`${label} video seek landed at ${videoTime}, expected ${expectedTime}`);
    }
    screenshots[label] = await pngHash(compactCanvas, join(outDir, `compact-${label}.png`));
  }
  await buttons.nth(1).click();
  await frame.waitForFunction(
    (expected) => window.__growthDebug?.tick === expected,
    record.legacy.lightweightMedia.posters[1].tick,
  );
  screenshots.reverse = await pngHash(compactCanvas, join(outDir, "compact-reverse.png"));
  if (screenshots.middle !== screenshots.reverse) fail("reverse seek did not reproduce middle pixels");
  if (
    screenshots.start === screenshots.middle ||
    screenshots.middle === screenshots.final ||
    screenshots.start === screenshots.final
  ) fail("compact start/middle/final images are not distinct");

  await frame.evaluate(() => window.__growthSetView(55, 35));
  screenshots.orbit = await pngHash(compactCanvas, join(outDir, "compact-orbit.png"));
  if (screenshots.orbit === screenshots.middle) fail("orbit interaction did not change the compact view");
  await frame.evaluate(() => window.__growthSetView(0, 0));

  const play = frame.locator('[data-growth-control="play"]');
  const range = frame.locator('[data-growth-control="timeline"]');
  await range.evaluate((element) => {
    element.value = "0";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await play.click();
  await frame.waitForFunction(() => window.__growthDebug?.playing === true && window.__growthDebug.tick > 0);
  await play.click();
  const paused = await frame.evaluate(() => window.__growthDebug);
  await page.waitForTimeout(120);
  const pausedLater = await frame.evaluate(() => window.__growthDebug);
  if (paused.playing || paused.tick !== pausedLater.tick || paused.displayTick !== pausedLater.displayTick) {
    fail("embedded play/pause controls did not hold the selected tick");
  }
  await range.focus();
  const beforeArrow = await frame.evaluate(() => window.__growthDebug.tick);
  await range.press("ArrowRight");
  const afterArrow = await frame.evaluate(() => window.__growthDebug.tick);
  if (!(afterArrow > beforeArrow)) fail("keyboard ArrowRight did not operate the compact timeline");

  const landscapeLayout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assertNoOverflow(landscapeLayout, "landscape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  const portraitLayout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assertNoOverflow(portraitLayout, "portrait");
  const portraitGrowth = await frame.evaluate(() => window.__growthDebug);
  const bounds = portraitGrowth.framing.projectedBounds;
  if (bounds.xMin < -1 || bounds.xMax > 1 || bounds.yMin < -1 || bounds.yMax > 1) {
    fail(`portrait compact framing clips: ${JSON.stringify(bounds)}`);
  }
  screenshots.portrait = await pngHash(page, join(outDir, "portrait.png"));
  if (errors.length > 0) fail(`valid page errors: ${errors.join(" | ")}`);

  const assetPath = referencePath(record.compact.asset.url);
  const recordRequests = requests.filter((request) => new URL(request.url).pathname === "/comparison-record.json");
  const growthRequests = requests.filter((request) => new URL(request.url).pathname === assetPath);
  const legacyMeshRequests = requests.filter((request) => /\/mesh-t\d+\.bin$/u.test(new URL(request.url).pathname));
  const legacyManifestRequests = requests.filter((request) => /\/manifest\.json$/u.test(new URL(request.url).pathname));
  if (recordRequests.length !== 1) fail(`expected one comparison-record request, got ${recordRequests.length}`);
  if (growthRequests.length !== 1) fail(`expected one compact asset request, got ${growthRequests.length}`);
  if (legacyMeshRequests.length !== 0 || legacyManifestRequests.length !== 0) {
    fail(`comparison fetched legacy source bytes: meshes=${legacyMeshRequests.length}, manifests=${legacyManifestRequests.length}`);
  }
  await context.close();
  return {
    viewport,
    initialTick: initialGrowth.tick,
    screenshots,
    layout: { landscape: landscapeLayout, portrait: portraitLayout },
    requests: {
      total: requests.length,
      comparisonRecord: recordRequests.length,
      compactAsset: growthRequests.length,
      legacyManifest: legacyManifestRequests.length,
      legacyMeshes: legacyMeshRequests.length,
    },
    keyboard: { beforeArrow, afterArrow },
    errors,
  };
}

async function runReducedMotionLane(browser, base, map, record) {
  const context = await browser.newContext({
    viewport: { width: 900, height: 720 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const requests = [];
  await installRoutes(context, map, requests);
  const page = await context.newPage();
  await page.goto(pageUrl(base), { waitUntil: "domcontentloaded" });
  const state = await waitForComparison(page);
  const frame = await embeddedFrame(page);
  const growth = await frame.evaluate(() => window.__growthDebug);
  if (!state.debug.reducedMotion || !growth.reducedMotion || growth.playing) {
    fail("reduced motion did not suppress compact autoplay");
  }
  await page.locator('[data-role="poster-controls"] button').nth(1).click();
  await frame.waitForFunction(
    (expected) => window.__growthDebug?.tick === expected,
    record.legacy.lightweightMedia.posters[1].tick,
  );
  const manualTick = await frame.evaluate(() => window.__growthDebug.tick);
  await context.close();
  return { requested: true, playing: growth.playing, manualTick };
}

async function runErrorLane(
  browser,
  base,
  map,
  label,
  overrides,
  initScript = null,
  expectedError = null,
  expectIframeNotLoaded = false,
) {
  const context = await browser.newContext({ viewport: { width: 720, height: 560 }, deviceScaleFactor: 1 });
  if (initScript !== null) await context.addInitScript(initScript);
  const requests = [];
  await installRoutes(context, map, requests, overrides);
  const page = await context.newPage();
  await page.goto(pageUrl(base), { waitUntil: "domcontentloaded" });
  const state = await waitForComparison(page, true);
  if (state.error === null || state.error === "") fail(`${label} did not publish a scoped error`);
  if (expectedError !== null && !expectedError.test(state.error)) {
    fail(`${label} published the wrong error: ${state.error}`);
  }
  if (expectIframeNotLoaded) {
    const iframeSrc = await page.locator('[data-role="compact-frame"]').getAttribute("src");
    if (state.ready || state.debug?.iframeReady !== false || iframeSrc !== null) {
      fail(`${label} reached the embedded replay before rejecting the asset`);
    }
  }
  const bodyText = await page.locator("body").innerText();
  if (!/comparison|replay|unavailable/iu.test(bodyText)) fail(`${label} error is not visible on the page`);
  await context.close();
  return { label, error: state.error };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const recordPath = resolve(options.record);
  const growthPath = resolve(options.growth);
  const videoPath = resolve(options.legacyVideo);
  const posterPaths = options.posters.map((path) => resolve(path));
  const outDir = resolve(options.outDir);
  const recordBytes = readFileSync(recordPath);
  const record = decodeGrowthComparisonRecord(readJson(recordBytes, "comparison record"));
  const growthBytes = readFileSync(growthPath);
  const decoded = assertGrowthIdentity(growthBytes, record);
  const videoBytes = readFileSync(videoPath);
  assertFileReference(videoBytes, record.legacy.lightweightMedia.derivedVideo, "legacy video");
  const posterBytes = posterPaths.map((path, index) => {
    const bytes = readFileSync(path);
    assertFileReference(bytes, record.legacy.lightweightMedia.posters[index], `legacy poster ${index}`);
    return bytes;
  });
  mkdirSync(dirname(outDir), { recursive: true });
  mkdirSync(outDir); // Deliberate no-clobber publication.
  const map = mediaMap(recordBytes, record, growthBytes, videoBytes, posterBytes);

  const dev = await createServer({
    root: appDir,
    logLevel: "error",
    server: { host: "127.0.0.1", port: options.port, strictPort: true },
  });
  let browser = null;
  try {
    await dev.listen();
    const base = `http://127.0.0.1:${options.port}`;
    browser = await chromium.launch({
      headless: true,
      args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    });
    const valid = await runValidLane(
      browser,
      base,
      map,
      record,
      outDir,
      { width: options.width, height: options.height },
    );
    const reducedMotion = await runReducedMotionLane(browser, base, map, record);
    const assetPath = referencePath(record.compact.asset.url);
    const malformedObject = readJson(recordBytes, "comparison record");
    malformedObject.unexpected = true;
    const malformed = await runErrorLane(
      browser,
      base,
      map,
      "malformed record",
      new Map([["/comparison-record.json", {
        status: 200,
        body: Buffer.from(`${JSON.stringify(malformedObject)}\n`),
        contentType: "application/json",
      }]]),
    );
    const truncated = await runErrorLane(
      browser,
      base,
      map,
      "truncated compact asset",
      new Map([[assetPath, {
        status: 200,
        body: growthBytes.subarray(0, Math.min(9, growthBytes.length)),
        contentType: "application/octet-stream",
      }]]),
    );
    const mutatedGrowth = Buffer.from(growthBytes);
    mutatedGrowth[mutatedGrowth.length - 1] ^= 1;
    const payloadMutation = await runErrorLane(
      browser,
      base,
      map,
      "same-size compact payload mutation",
      new Map([[assetPath, {
        status: 200,
        body: mutatedGrowth,
        contentType: "application/octet-stream",
      }]]),
      null,
      /asset SHA-256/u,
      true,
    );
    const missing = await runErrorLane(
      browser,
      base,
      map,
      "missing compact asset",
      new Map([[assetPath, { status: 404, body: "missing", contentType: "text/plain" }]]),
    );
    const noWebgl = await runErrorLane(
      browser,
      base,
      map,
      "WebGL2 unavailable",
      new Map(),
      () => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function patched(type, ...args) {
          if (type === "webgl2") return null;
          return original.call(this, type, ...args);
        };
      },
    );
    const browserVersion = await browser.version();
    const report = {
      format: "gutcheck-growth-comparison-browser-v1",
      status: "pass",
      command: [process.execPath, ...process.argv.slice(1)],
      browser: browserVersion,
      renderer: "Chromium ANGLE SwiftShader",
      inputs: {
        record: { path: recordPath, bytes: recordBytes.length, sha256: sha256(recordBytes) },
        growth: { path: growthPath, bytes: growthBytes.length, sha256: sha256(growthBytes) },
        legacyVideo: { path: videoPath, bytes: videoBytes.length, sha256: sha256(videoBytes) },
        posters: posterPaths.map((path, index) => ({
          path,
          bytes: posterBytes[index].length,
          sha256: sha256(posterBytes[index]),
        })),
      },
      independentlyDecoded: {
        eventCount: decoded.header.eventCount,
        finalTick: decoded.header.finalTick,
        crop: decoded.header.crop,
        finalEventTick: decoded.attachTicks.at(-1),
      },
      valid,
      reducedMotion,
      errors: { malformed, truncated, payloadMutation, missing, noWebgl },
      limits:
        "This verifies page composition and interaction with Chromium/ANGLE SwiftShader. It does not measure hardware-GPU performance, VRAM, production compression, mobile-device performance, or cross-browser behavior.",
    };
    writeFileSync(join(outDir, "record.json"), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (browser !== null) await browser.close();
    await dev.close();
  }
}

main().catch((error) => {
  console.error(`growth-comparison-capture FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
