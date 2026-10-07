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
import {
  CAPTURE_SCENE_ID,
  CAPTURE_SCENE_SHA256,
  GLASS_CAPTURE_FORMAT,
  assertGlassSceneWitness,
  assertHeldPresentation,
  captureSceneWitness,
} from "./growth-comparison-contract.ts";

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

function normalizeBrowserRenderedWhitespace(value) {
  return value.replace(/\s+/gu, " ").trim();
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

function responseBodyBytes(response) {
  if (typeof response.body === "string") return Buffer.from(response.body, "utf8");
  if (response.body instanceof Uint8Array) return Buffer.from(response.body);
  fail("capture override must carry a string or byte body");
}

async function installRoutes(
  context,
  map,
  requests,
  overrides = new Map(),
  overrideApplications = [],
) {
  await context.route("**/*", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    requests.push({ url: request.url(), method: request.method(), resourceType: request.resourceType() });
    const override = overrides.get(pathname);
    if (override !== undefined) {
      const body = responseBodyBytes(override);
      await route.fulfill(override);
      overrideApplications.push({
        pathname,
        status: override.status ?? 200,
        contentType: override.contentType ?? "",
        bytes: body.byteLength,
        sha256: sha256(body),
      });
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
    // Capture is a closed six-byte-source environment. Never fall through to a repository /nas
    // plugin if a record or page unexpectedly asks for another share path.
    if (pathname === "/nas" || pathname.startsWith("/nas/")) {
      await route.fulfill({
        status: 404,
        body: "unregistered NAS request refused by local comparison capture",
        contentType: "text/plain",
      });
      return;
    }
    await route.continue();
  });
}

function assertNoUnmappedNasRequests(requests, map, label) {
  const unexpected = requests
    .map((request) => new URL(request.url).pathname)
    .filter((pathname) =>
      (pathname === "/nas" || pathname.startsWith("/nas/")) && !map.has(pathname));
  if (unexpected.length > 0) {
    fail(`${label} made unregistered NAS requests: ${[...new Set(unexpected)].join(", ")}`);
  }
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

function assertContainedFraming(growth, label) {
  const bounds = growth.framing.projectedBounds;
  if (Object.values(bounds).some((value) => !Number.isFinite(value)) ||
      bounds.xMin < -1 || bounds.xMax > 1 || bounds.yMin < -1 || bounds.yMax > 1) {
    fail(`${label} compact framing clips: ${JSON.stringify(bounds)}`);
  }
}

async function assertComparisonStatusPlacement(page, frame, label) {
  const status = page.locator('[data-role="compact-presentation-status"]');
  const text = normalizeBrowserRenderedWhitespace(await status.innerText());
  if (!(await status.isVisible()) || !text.includes("MODEL / UNVALIDATED") || !text.includes("Nonphysical")) {
    fail(`${label} compact presentation warning is missing`);
  }
  const statusBounds = await status.boundingBox();
  const frameBounds = await page.locator('[data-role="compact-frame"]').boundingBox();
  if (statusBounds === null || frameBounds === null || statusBounds.y + statusBounds.height > frameBounds.y + 0.5) {
    fail(`${label} compact warning overlaps the interactive canvas`);
  }
  if (await frame.locator('[data-growth-status="player"]').count() !== 0) {
    fail(`${label} embedded player duplicates the parent warning over its canvas`);
  }
  const standaloneUrl = new URL(await page.locator('[data-role="open-player"]').getAttribute("href"));
  if (standaloneUrl.searchParams.has("status")) fail("standalone link suppresses its own status");
  const drawn = await page.locator('[data-role="compact-frame"]').evaluate((element) => ({
    frame: element.getBoundingClientRect().toJSON(),
    shell: element.parentElement.getBoundingClientRect().toJSON(),
    panel: element.closest(".media-panel").getBoundingClientRect().toJSON(),
    viewportWidth: window.innerWidth,
  }));
  const headings = await page.locator(".media-panel").evaluateAll((panels) => panels.map((panel) => ({
    panel: panel.getBoundingClientRect().toJSON(),
    heading: panel.querySelector(".panel-heading").getBoundingClientRect().toJSON(),
    status: panel.querySelector(".status-pill").getBoundingClientRect().toJSON(),
  })));
  for (const item of headings) {
    if (item.heading.left < item.panel.left - 1 || item.heading.right > item.panel.right + 1 ||
        item.status.left < item.heading.left - 1 || item.status.right > item.heading.right + 1 ||
        item.status.top < item.heading.top - 1 || item.status.bottom > item.heading.bottom + 1) {
      fail(`${label} panel heading/status pill is clipped: ${JSON.stringify(item)}`);
    }
  }
  for (const [outer, inner] of [[drawn.panel, drawn.shell], [drawn.shell, drawn.frame]]) {
    if (inner.left < outer.left - 1 || inner.right > outer.right + 1 ||
        inner.top < outer.top - 1 || inner.bottom > outer.bottom + 1) {
      fail(`${label} compact iframe/shell is clipped inside its panel: ${JSON.stringify(drawn)}`);
    }
  }
  if (drawn.panel.left < -1 || drawn.panel.right > drawn.viewportWidth + 1) {
    fail(`${label} compact panel extends outside the viewport`);
  }
  const controls = await frame.locator('[data-growth-control="bar"]').evaluate((bar) => ({
    canvas: document.querySelector("canvas").getBoundingClientRect().toJSON(),
    bar: bar.getBoundingClientRect().toJSON(),
    children: Array.from(bar.children).map((element) => element.getBoundingClientRect().toJSON()),
    viewportWidth: window.innerWidth,
  }));
  if (controls.canvas.bottom > controls.bar.top + 1 ||
      controls.children.some((rect) => rect.left < -1 || rect.right > controls.viewportWidth + 1)) {
    fail(`${label} compact controls obscure the canvas or extend outside the iframe`);
  }
  return { text, statusBounds, frameBounds, drawn, headings, controls,
    innerStatusCount: 0, standaloneStatusOverride: null };
}

async function runValidLane(browser, base, map, record, scene, outDir, viewport) {
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
  assertGlassSceneWitness(initialGrowth, captureSceneWitness(scene, initialGrowth.presentation.sceneSeconds));
  const headline = (await page.locator("h1").textContent()) ?? "";
  if (!/^One crystal\.\s*Two timelines\.$/u.test(headline)) {
    fail("comparison headline is missing");
  }
  const tableCount = await page.locator("table").count();
  if (tableCount !== 1) fail("semantic comparison table is missing");
  const iframeTitle = await page.locator('[data-role="compact-frame"]').getAttribute("title");
  if (iframeTitle !== "Interactive compact Run B growth replay") fail("compact iframe title is missing");
  const iframeSrc = await page.locator('[data-role="compact-frame"]').getAttribute("src");
  const iframeUrl = new URL(iframeSrc, base);
  if (iframeUrl.searchParams.get("look") !== "glass" ||
      iframeUrl.searchParams.get("presentation") !== CAPTURE_SCENE_ID ||
      iframeUrl.searchParams.get("status") !== "parent") {
    fail("comparison iframe does not request glass and the exact authored scene");
  }
  const landscapeStatusPlacement = await assertComparisonStatusPlacement(page, frame, "landscape");
  const presentationText = normalizeBrowserRenderedWhitespace(await page.locator("body").innerText());
  for (const expected of ["glass-styled", "nonphysical", "MODEL / UNVALIDATED", "not transport-locked"]) {
    if (!presentationText.includes(expected)) fail(`comparison omits presentation limit: ${expected}`);
  }
  const displayedLegacy = (await page.locator('[data-value="legacy-size-note"]').textContent()) ?? "";
  const displayedCompact = (await page.locator('[data-value="compact-size-note"]').textContent()) ?? "";
  if (!displayedLegacy?.includes(record.legacy.v2qSequence.totalBytes.toLocaleString("en-US"))) {
    fail("legacy exact byte count is not rendered");
  }
  if (!displayedCompact?.includes(record.compact.asset.bytes.toLocaleString("en-US"))) {
    fail("compact exact byte count is not rendered");
  }
  const ratio = Math.round(record.legacy.v2qSequence.totalBytes / record.compact.asset.bytes);
  const displayedRatio = (await page.locator('[data-value="ratio"]').textContent()) ?? "";
  if (displayedRatio !== `${ratio.toLocaleString("en-US")}× smaller`) {
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
  const buttonCount = await buttons.count();
  if (buttonCount !== 3) fail("comparison does not expose three exact-tick controls");
  const compactCanvas = page.locator('[data-role="compact-frame"]').contentFrame().locator("canvas");
  const posterSeeks = [];
  for (const [index, label] of ["start", "middle", "final"].entries()) {
    await buttons.nth(index).click();
    const tick = record.legacy.lightweightMedia.posters[index].tick;
    await frame.waitForFunction((expected) => window.__growthDebug?.tick === expected, tick);
    const videoTime = await page.locator('[data-role="legacy-video"]').evaluate((video) => video.currentTime);
    const expectedTime = record.legacy.lightweightMedia.posters[index].videoTimeSeconds;
    if (Math.abs(videoTime - expectedTime) > 0.08) {
      fail(`${label} video seek landed at ${videoTime}, expected ${expectedTime}`);
    }
    const growth = await frame.evaluate(() => window.__growthDebug);
    assertGlassSceneWitness(growth, captureSceneWitness(scene, expectedTime));
    assertContainedFraming(growth, label);
    posterSeeks.push({ label, tick: growth.tick, videoTimeSeconds: videoTime, presentation: growth.presentation });
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
  await frame.evaluate(async () => {
    await window.__growthSeek(0);
    await window.__growthSetView(0, 0, 8);
  });
  const seedDetail = await frame.evaluate(() => window.__growthDebug);
  if (seedDetail.tick !== 0 || seedDetail.presentation.camera.zoom !== 8 ||
      seedDetail.presentation.cameraMode !== "manualHold") fail("seed detail did not preserve tick zero with manual magnification");
  screenshots.seedDetail = await pngHash(compactCanvas, join(outDir, "compact-seed-detail.png"));
  await frame.locator('[data-growth-control="follow-tour"]').click();
  const seedDetailRestored = await frame.evaluate(() => window.__growthDebug);
  assertGlassSceneWitness(seedDetailRestored, captureSceneWitness(scene, 0));

  const sceneSeeks = [];
  for (const seconds of [0, 3, 6, 8.5, 11, 13, 14.5, 15.5, 16]) {
    await frame.evaluate((time) => window.__growthSeekTime(time), seconds);
    const growth = await frame.evaluate(() => window.__growthDebug);
    assertGlassSceneWitness(growth, captureSceneWitness(scene, seconds));
    assertContainedFraming(growth, `authored scene at ${seconds}s`);
    if (growth.playing) fail("manual authored scene seek left autoplay running");
    sceneSeeks.push({ tick: growth.tick, displayTick: growth.displayTick,
      ...growth.presentation, framing: growth.framing });
    if (seconds === 11) {
      screenshots.authoredOblique = await pngHash(compactCanvas, join(outDir, "compact-authored-oblique.png"));
    }
    if (seconds === 16) {
      screenshots.finalHold = await pngHash(compactCanvas, join(outDir, "compact-final-hold.png"));
    }
  }
  if (screenshots.final === screenshots.finalHold) fail("final hold did not retain the moving authored camera");
  await frame.evaluate(() => window.__growthSeek(11));
  const exactTick = await frame.evaluate(() => window.__growthDebug);
  if (exactTick.tick !== 11 || exactTick.presentation.sceneSeconds !== (0.11 / 700) * 13) {
    fail("exact tick 11 was lost while deriving its authored camera time");
  }
  assertGlassSceneWitness(exactTick, { ...captureSceneWitness(scene, exactTick.presentation.sceneSeconds), tick: 11 });

  await buttons.nth(1).click();
  await frame.waitForFunction((tick) => window.__growthDebug?.tick === tick, 35_000);
  await frame.evaluate(() => window.__growthSetView(55, 35));
  const manualView = await frame.evaluate(() => window.__growthDebug);
  if (manualView.presentation.cameraMode !== "manualHold") fail("manual view did not suspend the authored camera");
  screenshots.orbit = await pngHash(compactCanvas, join(outDir, "compact-orbit.png"));
  if (screenshots.orbit === screenshots.middle) fail("orbit interaction did not change the compact view");
  await frame.locator('[data-growth-control="follow-tour"]').click();
  const followed = await frame.evaluate(() => window.__growthDebug);
  assertGlassSceneWitness(followed, captureSceneWitness(scene, followed.presentation.sceneSeconds));

  // Exercise OrbitControls rather than only its programmatic presentation helper.
  const canvasBounds = await compactCanvas.boundingBox();
  if (canvasBounds === null) fail("compact canvas has no pointer bounds");
  await page.mouse.move(canvasBounds.x + canvasBounds.width / 2, canvasBounds.y + canvasBounds.height / 2);
  await page.mouse.down();
  const pointerStarted = await frame.evaluate(() => window.__growthDebug);
  if (pointerStarted.presentation.cameraMode !== "manualHold") fail("pointer orbit did not suspend camera following");
  await page.mouse.move(canvasBounds.x + canvasBounds.width / 2 + 60, canvasBounds.y + canvasBounds.height / 2 + 20, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  const pointerMoved = await frame.evaluate(() => window.__growthDebug);
  if (JSON.stringify(pointerMoved.presentation.camera) === JSON.stringify(followed.presentation.camera)) {
    fail("pointer orbit left the camera unchanged");
  }
  // Drain the remaining OrbitControls damping using its observed pose. Camera-follow
  // suspension is separate from the expected short physical settling after a drag.
  await frame.evaluate((pose) => window.__growthSetView(pose.tiltDegrees, pose.yawDegrees, pose.zoom),
    pointerMoved.presentation.camera);
  const manualSettled = await frame.evaluate(() => window.__growthDebug);
  const play = frame.locator('[data-growth-control="play"]');
  await play.click();
  await frame.waitForFunction((seconds) => window.__growthDebug?.presentation.sceneSeconds > seconds,
    manualSettled.presentation.sceneSeconds);
  const manualPlaying = await frame.evaluate(() => window.__growthDebug);
  if (manualPlaying.presentation.cameraMode !== "manualHold") fail("autoplay overwrote manual camera mode");
  for (const key of ["tiltDegrees", "yawDegrees", "zoom"]) {
    if (Math.abs(manualPlaying.presentation.camera[key] - manualSettled.presentation.camera[key]) > 0.02) {
      fail(`autoplay moved the manual camera ${key}`);
    }
  }
  await play.click();
  await frame.locator('[data-growth-control="follow-tour"]').click();
  const pointerRestored = await frame.evaluate(() => window.__growthDebug);
  assertGlassSceneWitness(pointerRestored, captureSceneWitness(scene, pointerRestored.presentation.sceneSeconds));

  const range = frame.locator('[data-growth-control="timeline"]');
  await range.evaluate((element) => {
    element.value = "0";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await play.click();
  await frame.waitForFunction(() => window.__growthDebug?.playing === true && window.__growthDebug.tick > 0);
  const started = await frame.evaluate(() => window.__growthDebug);
  assertGlassSceneWitness(started, captureSceneWitness(scene, started.presentation.sceneSeconds));
  await frame.waitForFunction((seconds) => window.__growthDebug?.presentation.sceneSeconds > seconds,
    started.presentation.sceneSeconds);
  const advancing = await frame.evaluate(() => window.__growthDebug);
  assertGlassSceneWitness(advancing, captureSceneWitness(scene, advancing.presentation.sceneSeconds));
  if (JSON.stringify(started.presentation.camera) === JSON.stringify(advancing.presentation.camera)) {
    fail("autoplay advanced growth without advancing its authored camera");
  }
  await play.click();
  const paused = await frame.evaluate(() => window.__growthDebug);
  await page.waitForTimeout(120);
  const pausedLater = await frame.evaluate(() => window.__growthDebug);
  assertHeldPresentation(paused, pausedLater);

  // Start shortly before the hold so real autoplay crosses it and stops at 16 s.
  await frame.evaluate(() => window.__growthSeekTime(12.9));
  await play.click();
  await frame.waitForFunction(() => window.__growthDebug?.presentation.sceneSeconds >= 13);
  const holdStarted = await frame.evaluate(() => window.__growthDebug);
  assertGlassSceneWitness(holdStarted, captureSceneWitness(scene, holdStarted.presentation.sceneSeconds));
  await frame.waitForFunction(() => window.__growthDebug?.playing === false &&
    window.__growthDebug?.presentation.sceneSeconds === 16);
  const holdCompleted = await frame.evaluate(() => window.__growthDebug);
  assertGlassSceneWitness(holdCompleted, captureSceneWitness(scene, 16));
  if (holdStarted.tick !== 70_000 || holdCompleted.tick !== 70_000 ||
      holdStarted.displayTick !== holdCompleted.displayTick) fail("final growth did not hold while the camera completed its tour");
  await frame.evaluate(() => window.__growthSeek(35_000));
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
  const portraitStatusPlacement = await assertComparisonStatusPlacement(page, frame, "portrait");
  const portraitWitnesses = [];
  for (const seconds of [0, 6, 6.5, 11, 13, 15.5, 16]) {
    await frame.evaluate((time) => window.__growthSeekTime(time), seconds);
    const growth = await frame.evaluate(() => window.__growthDebug);
    assertGlassSceneWitness(growth, captureSceneWitness(scene, seconds));
    assertContainedFraming(growth, `portrait at ${seconds}s`);
    portraitWitnesses.push({ tick: growth.tick, ...growth.presentation, framing: growth.framing });
  }
  await frame.evaluate(() => window.__growthSeekTime(6.5));
  const portraitGrowth = await frame.evaluate(() => window.__growthDebug);
  const bounds = portraitGrowth.framing.projectedBounds;
  assertContainedFraming(portraitGrowth, "portrait middle");
  const portraitPng = await page.screenshot({ path: join(outDir, "portrait.png"), type: "png", fullPage: true });
  screenshots.portrait = sha256(portraitPng);
  const compactPanel = page.locator(".media-panel").filter({ has: page.locator('[data-role="compact-frame"]') });
  screenshots.portraitPanel = await pngHash(compactPanel, join(outDir, "compact-panel-portrait.png"));
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
  assertNoUnmappedNasRequests(requests, map, "valid comparison");
  await context.close();
  return {
    viewport,
    initialTick: initialGrowth.tick,
    readiness: {
      comparisonReady: initial.ready,
      comparisonError: initial.error,
      comparisonDebugPresent: initial.debug !== null,
      comparisonReducedMotion: initial.debug.reducedMotion,
      compactDebugPresent: initialGrowth !== undefined,
      compactPlaying: initialGrowth.playing,
      compactAppearance: initialGrowth.appearance,
      compactPresentation: initialGrowth.presentation,
      compactFraming: initialGrowth.framing,
    },
    content: {
      headline,
      tableCount,
      iframeTitle,
      iframeSrc,
      legacySizeNote: displayedLegacy,
      compactSizeNote: displayedCompact,
      ratio: displayedRatio,
    },
    screenshots,
    layout: { landscape: landscapeLayout, portrait: portraitLayout },
    statusPlacement: { landscape: landscapeStatusPlacement, portrait: portraitStatusPlacement },
    requests: {
      total: requests.length,
      comparisonRecord: recordRequests.length,
      compactAsset: growthRequests.length,
      legacyManifest: legacyManifestRequests.length,
      legacyMeshes: legacyMeshRequests.length,
      entries: requests,
    },
    controls: { buttonCount, posterSeeks, seedDetail, seedDetailRestored, sceneSeeks, exactTick, manualView,
      followed, pointerStarted, pointerMoved, manualSettled, manualPlaying, pointerRestored },
    playback: {
      startedPlaying: started.playing,
      startedTick: started.tick,
      pausedPlaying: paused.playing,
      pausedTick: paused.tick,
      pausedDisplayTick: paused.displayTick,
      heldTick: pausedLater.tick,
      heldDisplayTick: pausedLater.displayTick,
      startedPresentation: started.presentation,
      advancingPresentation: advancing.presentation,
      pausedPresentation: paused.presentation,
      heldPresentation: pausedLater.presentation,
      finalHold: { started: holdStarted, completed: holdCompleted },
    },
    keyboard: { beforeArrow, afterArrow },
    portraitFraming: bounds,
    portraitWitnesses,
    errors,
  };
}

async function runReducedMotionLane(browser, base, map, record, scene) {
  const context = await browser.newContext({
    viewport: { width: 900, height: 720 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const requests = [];
  await installRoutes(context, map, requests);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto(pageUrl(base), { waitUntil: "domcontentloaded" });
  const state = await waitForComparison(page);
  const frame = await embeddedFrame(page);
  const growth = await frame.evaluate(() => window.__growthDebug);
  if (!state.debug.reducedMotion || !growth.reducedMotion || growth.playing) {
    fail("reduced motion did not suppress compact autoplay");
  }
  assertGlassSceneWitness(growth, captureSceneWitness(scene, 0));
  if (!(await frame.locator('[data-growth-control="play"]').isDisabled())) {
    fail("reduced-motion playback control is not disabled");
  }
  await page.waitForTimeout(160);
  const initialHeld = await frame.evaluate(() => window.__growthDebug);
  assertHeldPresentation(growth, initialHeld);
  await page.locator('[data-role="poster-controls"] button').nth(1).click();
  await frame.waitForFunction(
    (expected) => window.__growthDebug?.tick === expected,
    record.legacy.lightweightMedia.posters[1].tick,
  );
  const manual = await frame.evaluate(() => window.__growthDebug);
  assertGlassSceneWitness(manual, captureSceneWitness(scene, 6.5));
  await page.waitForTimeout(160);
  const manualHeld = await frame.evaluate(() => window.__growthDebug);
  assertHeldPresentation(manual, manualHeld);
  if (errors.length > 0) fail(`reduced-motion page errors: ${errors.join(" | ")}`);
  assertNoUnmappedNasRequests(requests, map, "reduced-motion comparison");
  await context.close();
  return {
    requested: true,
    comparisonReducedMotion: state.debug.reducedMotion,
    compactReducedMotion: growth.reducedMotion,
    playing: growth.playing,
    manualTick: manual.tick,
    initialPresentation: growth.presentation,
    initialHeldPresentation: initialHeld.presentation,
    manualPresentation: manual.presentation,
    manualHeldPresentation: manualHeld.presentation,
    errors,
  };
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
  collectContextNullWitness = false,
) {
  const context = await browser.newContext({ viewport: { width: 720, height: 560 }, deviceScaleFactor: 1 });
  if (initScript !== null) await context.addInitScript(initScript);
  const requests = [];
  const overrideApplications = [];
  await installRoutes(context, map, requests, overrides, overrideApplications);
  const page = await context.newPage();
  await page.goto(pageUrl(base), { waitUntil: "domcontentloaded" });
  const state = await waitForComparison(page, true);
  if (state.error === null || state.error === "") fail(`${label} did not publish a scoped error`);
  if (expectedError !== null && !expectedError.test(state.error)) {
    fail(`${label} published the wrong error: ${state.error}`);
  }
  const iframe = page.locator('[data-role="compact-frame"]');
  const iframeCount = await iframe.count();
  if (iframeCount > 1) fail(`${label} rendered more than one compact iframe`);
  const iframeSrc = iframeCount === 0 ? null : await iframe.getAttribute("src");
  const iframeReady = state.debug?.iframeReady ?? null;
  if (expectIframeNotLoaded) {
    if (state.ready || state.debug?.iframeReady !== false || iframeSrc !== null) {
      fail(`${label} reached the embedded replay before rejecting the asset`);
    }
  }
  const bodyText = await page.locator("body").innerText();
  const displayedBody = normalizeBrowserRenderedWhitespace(bodyText);
  const displayedError = normalizeBrowserRenderedWhitespace(state.error);
  if (displayedError === "" || !displayedBody.includes(displayedError)) {
    fail(`${label} scoped error is not visible on the page`);
  }
  let contextNullWitness = null;
  if (collectContextNullWitness) {
    const playerFrame = page.frames().find((candidate) => {
      try {
        return new URL(candidate.url()).pathname === "/spike-gg-realism.html";
      } catch {
        return false;
      }
    });
    if (playerFrame === undefined) fail(`${label} did not exercise the embedded player frame`);
    const marker = await playerFrame.evaluate(() => window.__growthNoWebglWitness ?? null);
    if (
      marker === null ||
      marker.installed !== true ||
      marker.returnedNull !== true ||
      !(marker.webgl2Calls >= 1)
    ) {
      fail(`${label} did not exercise the installed WebGL2 context-null mutation`);
    }
    contextNullWitness = { ...marker, frameUrl: playerFrame.url() };
  }
  assertNoUnmappedNasRequests(requests, map, label);
  await context.close();
  return {
    label,
    error: state.error,
    ready: state.ready,
    bodyText,
    iframeReady,
    iframeSrc,
    requests,
    overrideApplications,
    contextNullWitness,
  };
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
  const scenePath = resolve(appDir, "scenes/growth-B-intro.json");
  const sceneBytes = readFileSync(scenePath);
  if (sha256(sceneBytes) !== CAPTURE_SCENE_SHA256) fail("committed scene bytes differ from the capture contract");
  const scene = readJson(sceneBytes, "authored scene");
  mkdirSync(dirname(outDir), { recursive: true });
  mkdirSync(outDir); // Deliberate no-clobber publication.
  const map = mediaMap(recordBytes, record, growthBytes, videoBytes, posterBytes);

  const dev = await createServer({
    configFile: false,
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
      scene,
      outDir,
      { width: options.width, height: options.height },
    );
    const reducedMotion = await runReducedMotionLane(browser, base, map, record, scene);
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
        window.__growthNoWebglWitness = {
          installed: true,
          webgl2Calls: 0,
          returnedNull: false,
        };
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function patched(type, ...args) {
          if (type === "webgl2") {
            window.__growthNoWebglWitness.webgl2Calls++;
            window.__growthNoWebglWitness.returnedNull = true;
            return null;
          }
          return original.call(this, type, ...args);
        };
      },
      null,
      false,
      true,
    );
    const browserVersion = await browser.version();
    const report = {
      format: GLASS_CAPTURE_FORMAT,
      status: "pass",
      command: [process.execPath, ...process.argv.slice(1)],
      browser: browserVersion,
      renderer: "Chromium ANGLE SwiftShader",
      inputs: {
        record: { path: recordPath, bytes: recordBytes.length, sha256: sha256(recordBytes) },
        growth: { path: growthPath, bytes: growthBytes.length, sha256: sha256(growthBytes) },
        legacyVideo: { path: videoPath, bytes: videoBytes.length, sha256: sha256(videoBytes) },
        authoredScene: { path: scenePath, bytes: sceneBytes.length, sha256: sha256(sceneBytes), id: CAPTURE_SCENE_ID },
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
        "Product appearance/camera acceptance with Chromium/ANGLE SwiftShader; visual readability requires direct inspection of the named screenshots. The glass treatment is nonphysical, the panes are not transport-locked, and this does not measure hardware-GPU performance, VRAM, production compression, mobile-device performance, cross-browser behavior or scientific validity.",
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
