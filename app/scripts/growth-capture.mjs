// Compact G-G growth replay smoke (docs/plans/explore-gutcheck-growth-volume.md).
// Serves the Vite spike page, fulfills exactly one gutcheck-growth-v1 request from disk,
// seeks deterministic start/middle/end/reverse states, checks reduced-motion behavior,
// records WebGL2 limits and frame intervals, and proves no legacy mesh frame was fetched.
//
//   node app/scripts/growth-capture.mjs --growth out/growth-smoke.bin \
//        --out-dir out/growth-smoke-browser [--width 960] [--height 720] [--port 4328]

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(scriptDir, "..");
const RESERVED_PARAMS = new Set(["growth", "capture", "ui", "quality", "autoplay", "reduceMotion"]);

function parseArgs(argv) {
  const options = {
    growth: "",
    outDir: "",
    width: 960,
    height: 720,
    port: 4328,
    quality: "low",
    params: "",
  };
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    const next = () => {
      const value = argv[++index];
      if (value === undefined || value === "") throw new Error(`${argument} wants a non-empty value`);
      return value;
    };
    switch (argument) {
      case "--growth": options.growth = next(); break;
      case "--out-dir": options.outDir = next(); break;
      case "--width": options.width = Number(next()); break;
      case "--height": options.height = Number(next()); break;
      case "--port": options.port = Number(next()); break;
      case "--quality": options.quality = next(); break;
      case "--params": options.params = next(); break;
      default: throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (options.growth === "" || options.outDir === "") {
    throw new Error("need --growth <asset.bin> and --out-dir <new-directory>");
  }
  for (const [name, value, minimum] of [
    ["width", options.width, 320],
    ["height", options.height, 240],
    ["port", options.port, 1],
  ]) {
    if (!Number.isInteger(value) || value < minimum) {
      throw new Error(`--${name} wants an integer >= ${minimum}`);
    }
  }
  if (!["low", "medium", "high"].includes(options.quality)) {
    throw new Error(`--quality must be low, medium, or high, got ${options.quality}`);
  }
  return options;
}

function percentile(sorted, fraction) {
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertFramed(state, label) {
  const bounds = state.framing.projectedBounds;
  if (
    ![bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax].every(Number.isFinite) ||
    bounds.xMin < -1 || bounds.xMax > 1 || bounds.yMin < -1 || bounds.yMax > 1
  ) {
    throw new Error(`${label} proxy bounds clip outside the viewport: ${JSON.stringify(bounds)}`);
  }
}

async function rawCanvasPng(page, outputPath) {
  const dataUrl = await page.locator("canvas").evaluate((canvas) => canvas.toDataURL("image/png"));
  const prefix = "data:image/png;base64,";
  if (!dataUrl.startsWith(prefix)) throw new Error("canvas did not return a PNG data URL");
  const bytes = Buffer.from(dataUrl.slice(prefix.length), "base64");
  writeFileSync(outputPath, bytes, { flag: "wx" });
  return bytes;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const growthPath = resolve(options.growth);
  const outDir = resolve(options.outDir);
  const growthBytes = readFileSync(growthPath);
  mkdirSync(dirname(outDir), { recursive: true });
  mkdirSync(outDir); // No-clobber: a smoke record never silently replaces an earlier run.

  const extraParams = new URLSearchParams(options.params);
  for (const key of extraParams.keys()) {
    if (RESERVED_PARAMS.has(key)) {
      throw new Error(`--params cannot override capture contract key ${key}`);
    }
  }

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
    const page = await browser.newPage({
      viewport: { width: options.width, height: options.height },
      deviceScaleFactor: 1,
    });
    await page.emulateMedia({ reducedMotion: "reduce" });

    const validConsoleErrors = [];
    const validPageErrors = [];
    const requests = [];
    page.on("console", (message) => {
      if (message.type() === "error") validConsoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => validPageErrors.push(String(error)));
    page.on("request", (request) => requests.push(request.url()));
    await page.route("**/gutcheck-growth.bin", (route) =>
      route.fulfill({ body: growthBytes, contentType: "application/octet-stream" }),
    );

    const params = new URLSearchParams({
      growth: "/gutcheck-growth.bin",
      capture: "1",
      ui: "0",
      quality: options.quality,
      autoplay: "1", // reduced motion must override this request.
    });
    for (const [key, value] of extraParams) params.set(key, value);
    await page.goto(`${base}/spike-gg-realism.html?${params}`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () => window.__spikeReady === true || window.__spikeError !== undefined,
      undefined,
      { timeout: 120_000 },
    );
    const loadState = await page.evaluate(() => ({
      error: window.__spikeError ?? null,
      debug: window.__growthDebug ?? null,
    }));
    if (loadState.error !== null) throw new Error(`valid page reported failure: ${loadState.error}`);
    if (loadState.debug === null) throw new Error("valid page did not expose __growthDebug");
    if (!loadState.debug.reducedMotion || loadState.debug.playing) {
      throw new Error("reduced motion did not suppress requested autoplay");
    }
    if (loadState.debug.quality !== options.quality) {
      throw new Error(`viewer quality ${loadState.debug.quality} differs from requested ${options.quality}`);
    }
    if (!/swiftshader/i.test(loadState.debug.capabilities.renderer)) {
      throw new Error(
        `capture requested SwiftShader but observed ${loadState.debug.capabilities.renderer}`,
      );
    }
    assertFramed(loadState.debug, "initial landscape");

    const finalTick = loadState.debug.finalTick;
    const middleTick = loadState.debug.representativeGrowthTick;
    if (!(Number.isInteger(middleTick) && middleTick > 0 && middleTick < finalTick)) {
      throw new Error(`asset has no representative post-seed, pre-final growth tick: ${middleTick}`);
    }
    const captures = [
      ["start", 0],
      ["middle", middleTick],
      ["final", finalTick],
      ["reverse", middleTick],
    ];
    const seekStates = [];
    const screenshotSha256 = {};
    for (const [name, tick] of captures) {
      await page.evaluate((target) => window.__growthSeek(target), tick);
      const state = await page.evaluate(() => window.__growthDebug);
      if (state.tick !== tick) throw new Error(`seek ${name} landed on ${state.tick}, wanted ${tick}`);
      seekStates.push({
        name,
        tick: state.tick,
        displayTick: state.displayTick,
        normalizedTime: state.normalizedTime,
      });
      const png = await page.screenshot({ path: join(outDir, `${name}.png`), type: "png" });
      screenshotSha256[name] = sha256(png);
    }
    if (screenshotSha256.middle !== screenshotSha256.reverse) {
      throw new Error("reverse seek did not reproduce the same pixels as the forward seek");
    }
    if (
      screenshotSha256.start === screenshotSha256.middle ||
      screenshotSha256.middle === screenshotSha256.final ||
      screenshotSha256.start === screenshotSha256.final
    ) {
      throw new Error(`growth screenshots did not produce three distinct states: ${JSON.stringify(screenshotSha256)}`);
    }

    const portraitViewport = { width: 420, height: 760 };
    await page.setViewportSize(portraitViewport);
    await page.evaluate((target) => window.__growthSeek(target), middleTick);
    const resized = await page.evaluate(() => window.__growthDebug);
    if (resized.viewport.width !== portraitViewport.width || resized.viewport.height !== portraitViewport.height) {
      throw new Error(`resize was not reflected by viewer: ${JSON.stringify(resized.viewport)}`);
    }
    assertFramed(resized, "portrait");
    const portraitPng = await page.screenshot({ path: join(outDir, "portrait.png"), type: "png" });
    screenshotSha256.portrait = sha256(portraitPng);
    await page.setViewportSize({ width: options.width, height: options.height });
    await page.evaluate((target) => window.__growthSeek(target), middleTick);

    const timing = {};
    for (const [name, tilt] of [["faceOn", 0], ["tilt75", 75]]) {
      await page.evaluate((degrees) => window.__growthSetView(degrees, 0), tilt);
      const samples = await page.evaluate(() => window.__growthBenchmark(45));
      const sorted = [...samples].sort((a, b) => a - b);
      timing[name] = {
        samples: sorted.length,
        p50Ms: percentile(sorted, 0.5),
        p95Ms: percentile(sorted, 0.95),
      };
    }

    // A normal-motion page exercises requested autoplay and the actual play/pause + range
    // controls. The reduced-motion page above remains the independent suppression check.
    const controlPage = await browser.newPage({
      viewport: { width: options.width, height: options.height },
      deviceScaleFactor: 1,
    });
    const controlErrors = [];
    controlPage.on("console", (message) => {
      if (message.type() === "error") controlErrors.push(message.text());
    });
    controlPage.on("pageerror", (error) => controlErrors.push(String(error)));
    await controlPage.route("**/gutcheck-growth.bin", (route) =>
      route.fulfill({ body: growthBytes, contentType: "application/octet-stream" }),
    );
    const controlParams = new URLSearchParams({
      growth: "/gutcheck-growth.bin",
      capture: "1",
      ui: "1",
      quality: options.quality,
      autoplay: "1",
      duration: "4",
      transitionTicks: "4",
    });
    await controlPage.goto(`${base}/spike-gg-realism.html?${controlParams}`, {
      waitUntil: "domcontentloaded",
    });
    await controlPage.waitForFunction(
      () => window.__spikeReady === true || window.__spikeError !== undefined,
      undefined,
      { timeout: 120_000 },
    );
    const controlStart = await controlPage.evaluate(() => ({
      error: window.__spikeError ?? null,
      debug: window.__growthDebug ?? null,
    }));
    if (controlStart.error !== null || controlStart.debug === null) {
      throw new Error(`normal-motion page failed: ${controlStart.error ?? "missing debug state"}`);
    }
    if (controlStart.debug.reducedMotion || !controlStart.debug.playing) {
      throw new Error("normal-motion page did not begin requested autoplay");
    }
    if (controlStart.debug.displayTick < 0) throw new Error("autoplay published a negative display tick");
    const playControl = controlPage.locator('[data-growth-control="play"]');
    const timelineControl = controlPage.locator('[data-growth-control="timeline"]');
    await timelineControl.evaluate((element) => {
      element.value = "0";
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const rewound = await controlPage.evaluate(() => window.__growthDebug);
    if (rewound.tick !== 0 || rewound.playing) {
      throw new Error(`timeline control did not rewind and stop: ${JSON.stringify(rewound)}`);
    }
    const controlBefore = await rawCanvasPng(controlPage, join(outDir, "control-before.png"));
    await playControl.click();
    await controlPage.waitForFunction(
      (target) => window.__growthDebug.tick >= target,
      middleTick,
      { timeout: 10_000 },
    );
    const controlAfter = await rawCanvasPng(controlPage, join(outDir, "control-after.png"));
    const reached = await controlPage.evaluate(() => window.__growthDebug);
    if (sha256(controlBefore) === sha256(controlAfter)) {
      throw new Error("playback advanced its tick without changing canvas pixels");
    }
    await timelineControl.evaluate((element) => {
      element.value = "0";
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await playControl.click();
    await controlPage.waitForFunction(
      () => window.__growthDebug.playing && window.__growthDebug.tick > 0,
      undefined,
      { timeout: 5_000 },
    );
    const paused = await controlPage.evaluate(() => {
      const button = document.querySelector('[data-growth-control="play"]');
      if (!(button instanceof HTMLButtonElement)) throw new Error("play control is missing");
      button.click();
      return window.__growthDebug;
    });
    if (paused.playing) throw new Error("play control did not pause playback");
    await controlPage.waitForTimeout(150);
    const pausedLater = await controlPage.evaluate(() => window.__growthDebug);
    if (pausedLater.tick !== paused.tick || pausedLater.displayTick !== paused.displayTick) {
      throw new Error("paused playback continued advancing");
    }
    await timelineControl.evaluate((element, target) => {
      element.value = String(target);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, Math.max(0, finalTick - 1));
    await playControl.click();
    await controlPage.waitForFunction(
      () =>
        window.__growthDebug.playing === false &&
        window.__growthDebug.tick === window.__growthDebug.finalTick &&
        window.__growthDebug.displayTick > window.__growthDebug.finalTick,
      undefined,
      { timeout: 10_000 },
    );
    const terminal = await controlPage.evaluate(() => window.__growthDebug);
    const controlEnd = await controlPage.evaluate(() => ({
      ready: window.__spikeReady ?? false,
      error: window.__spikeError ?? null,
    }));
    if (controlEnd.ready !== true || controlEnd.error !== null) {
      throw new Error(`normal-motion page lost readiness: ${controlEnd.error ?? "ready=false"}`);
    }
    const controlsRecord = {
      requestedAutoplay: true,
      initialTick: controlStart.debug.tick,
      reachedTick: reached.tick,
      pausedTick: pausedLater.tick,
      rewoundTick: rewound.tick,
      terminalTick: terminal.tick,
      terminalDisplayTick: terminal.displayTick,
      beforeFile: "control-before.png",
      beforeSha256: sha256(controlBefore),
      afterFile: "control-after.png",
      afterSha256: sha256(controlAfter),
      errors: controlErrors,
    };
    if (controlErrors.length > 0) {
      throw new Error(`normal-motion page errors: ${controlErrors.join(" | ")}`);
    }
    await controlPage.close();

    const growthRequests = requests.filter((url) => new URL(url).pathname === "/gutcheck-growth.bin");
    const legacyRequests = requests.filter((url) => /\/mesh-t\d+\.bin(?:$|\?)/.test(url));
    if (growthRequests.length !== 1) {
      throw new Error(`expected one growth request, observed ${growthRequests.length}`);
    }
    if (legacyRequests.length !== 0) {
      throw new Error(`growth mode fetched ${legacyRequests.length} legacy mesh frame(s)`);
    }
    if (validPageErrors.length > 0 || validConsoleErrors.length > 0) {
      throw new Error(
        `valid page errors: ${[...validPageErrors, ...validConsoleErrors].join(" | ")}`,
      );
    }

    // A separate page proves malformed bytes fail closed. Its expected console error does not
    // contaminate the valid-page zero-error assertion above.
    const badPage = await browser.newPage({ viewport: { width: 480, height: 360 } });
    await badPage.route("**/bad-growth.bin", (route) =>
      route.fulfill({ body: growthBytes.subarray(0, Math.min(9, growthBytes.length)), contentType: "application/octet-stream" }),
    );
    await badPage.goto(
      `${base}/spike-gg-realism.html?growth=/bad-growth.bin&capture=1&ui=0&quality=low`,
      { waitUntil: "domcontentloaded" },
    );
    await badPage.waitForFunction(() => window.__spikeError !== undefined, undefined, { timeout: 30_000 });
    const malformedError = await badPage.evaluate(() => window.__spikeError);
    if (
      typeof malformedError !== "string" ||
      malformedError.length === 0 ||
      !malformedError.includes("gutcheck growth:")
    ) {
      throw new Error(`malformed asset did not publish a specific codec error: ${String(malformedError)}`);
    }
    await badPage.close();

    const finalState = await page.evaluate(() => ({
      ready: window.__spikeReady ?? false,
      error: window.__spikeError ?? null,
      debug: window.__growthDebug ?? null,
    }));
    if (finalState.ready !== true || finalState.error !== null || finalState.debug === null) {
      throw new Error(`valid page lost readiness: ${finalState.error ?? "ready=false or debug missing"}`);
    }
    const finalDebug = finalState.debug;
    const record = {
      format: "gutcheck-growth-browser-smoke-v1",
      status: "pass",
      command: [process.execPath, ...process.argv.slice(1)],
      node: process.version,
      platform: `${process.platform}-${process.arch}`,
      browser: await browser.version(),
      requestedRenderer: "Chromium ANGLE SwiftShader",
      observedRenderer: finalDebug.capabilities.renderer,
      effectiveQuery: Object.fromEntries(params),
      asset: {
        path: growthPath,
        bytes: growthBytes.length,
        sha256: sha256(growthBytes),
        validated: finalDebug.asset,
        representation:
          "One exact attachment index/tick event per ultimately attached lattice site is decoded into an R32UI tick field. Unlike legacy gutcheck-anim-v1 partial-boundary mesh extraction, the visible geometry is a temporally and spatially interpolated implicit presentation surface, not an extracted solver mesh or gate artifact.",
      },
      viewport: {
        initial: [options.width, options.height],
        portrait: resized.viewport,
        final: finalDebug.viewport,
        portraitProjectedBounds: resized.framing.projectedBounds,
      },
      quality: finalDebug.quality,
      requests: { growth: growthRequests.length, legacyMeshes: legacyRequests.length },
      seeks: seekStates,
      screenshots: screenshotSha256,
      reducedMotion: { matched: finalDebug.reducedMotion, playing: finalDebug.playing },
      controls: controlsRecord,
      capabilities: finalDebug.capabilities,
      volume: finalDebug.volume,
      timing,
      malformedAssetError: malformedError,
      limits:
        "Observed SwiftShader timing checks this smoke host only; nominal R32UI texture bytes are calculated, not measured VRAM. " +
        (finalDebug.volume.syntheticProbe === null
          ? "This tiny smoke is not a Run B performance measurement. "
          : `The synthetic probe expands allocation dimensions while retaining only the tiny smoke's ${finalDebug.volume.eventCount} occupied events; its timing and image complexity are NON-TRANSFERABLE to Run B. `) +
        "Hardware-GPU performance, context-loss recovery, and OOM behavior were not tested.",
    };
    writeFileSync(join(outDir, "record.json"), `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
    console.log(JSON.stringify(record, null, 2));
  } finally {
    if (browser !== null) await browser.close();
    await dev.close();
  }
}

main().catch((error) => {
  console.error(`growth-capture FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
