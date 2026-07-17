#!/usr/bin/env node
// Screenshot harness. TWO modes:
//
// Phase 3 (default; A2-9 + A3-5): builds the app, serves it with `vite preview`, drives the
// LIVE GGThreshold worker in headless chromium, and captures PNGs + a manifest to
// out/phase3-visual/ (overridable with --out-dir; review evidence in the default directory is
// regenerated only deliberately, never as a side effect of a verification run).
//
// Phase 4 (--phase4; V4-5/V4-6): VERIFIES the published Pass A / Pass B evidence bundles
// BEFORE any capture (artifact-index file-set equality, SHA-256 of every artifact,
// report/index cross-links, canonical-JSON shape of index+report, checkpoint strict decode +
// metadata/array-length consistency with the report run summaries — every mismatch fails by
// a stable V4-* name), then loads the actual gate checkpoints into the app's view-only
// inspect mode and captures the required views on BOTH backend passes (auto backend + forced
// ?webgl2=1), writing full-resolution PNGs and a manifest to out/phase4-visual/ (--out-dir
// overrides). The harness NEVER executes evidence runs; it only renders published evidence.
//
//   node app/scripts/visual.mjs [--out-dir <dir>]
//   node app/scripts/visual.mjs --phase4 [--pass-a-dir <dir>] [--pass-b-dir <dir>]
//                               [--out-dir <dir>] [--require-pass-b]
//
// Ports: 4319 (phase 3) / 4321 (phase 4). WebGPU is attempted (--enable-unsafe-webgpu,
// Metal ANGLE); the manifest records the backend that ACTUALLY ran (charter §1.5). Exit is
// nonzero on any console error, page error, in-app fault, verification failure, or
// incomplete view manifest.
//
// Dev tooling only: nothing in app/src imports from here or from Playwright.

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  PASS_A_IDENTITY,
  PASS_B_IDENTITY,
  REQUIRED_PASS_A_VIEWS,
  assertViewManifestComplete,
  planPassBViews,
  verifyPhase4Bundle,
} from "./phase4-verify.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(scriptDir, "..");
const repoRoot = resolve(appDir, "..");
const viteBin = resolve(repoRoot, "node_modules", "vite", "bin", "vite.js");

const PHASE3_PORT = 4319;
const PHASE4_PORT = 4321;
const EARLY_TICK = 300;
const MID_TICK = 1500;
const ORBIT_DEGREES = 40;

function log(line) {
  process.stdout.write(`[visual] ${line}\n`);
}

// ── CLI arguments ──────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    phase4: false,
    outDir: null,
    passADir: null,
    passBDir: null,
    requirePassB: false,
  };
  for (let n = 0; n < argv.length; n++) {
    const flag = argv[n];
    const valueOf = () => {
      const value = argv[n + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`${flag} requires a value`);
      }
      n++;
      return value;
    };
    if (flag === "--phase4") args.phase4 = true;
    else if (flag === "--out-dir") args.outDir = valueOf();
    else if (flag === "--pass-a-dir") args.passADir = valueOf();
    else if (flag === "--pass-b-dir") args.passBDir = valueOf();
    else if (flag === "--require-pass-b") args.requirePassB = true;
    else throw new Error(`unknown argument: ${flag}`);
  }
  return args;
}

// ── Shared plumbing ────────────────────────────────────────────────────────────────────────

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`preview server did not answer at ${url} within ${timeoutMs} ms`);
}

function buildApp() {
  log("vite build…");
  const build = spawnSync(process.execPath, [viteBin, "build"], {
    cwd: appDir,
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (build.status !== 0) throw new Error(`vite build failed with status ${build.status}`);
}

function startPreview(port) {
  log(`vite preview on :${port}…`);
  const preview = spawn(
    process.execPath,
    [viteBin, "preview", "--port", String(port), "--strictPort"],
    { cwd: appDir, stdio: ["ignore", "pipe", "pipe"] },
  );
  preview.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return preview;
}

/** Open the app, wire error collection, and wait for the first snapshot. */
async function openApp(browser, url, consoleErrors, pageErrors, viewport) {
  const page = await browser.newPage({ viewport });
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(
    () => window.__vccDebug && window.__vccDebug.backend !== null && window.__vccDebug.snapshotCount > 0,
    undefined,
    { timeout: 30_000 },
  );
  return page;
}

async function debugState(page) {
  return page.evaluate(() => ({
    tick: window.__vccDebug.tick,
    attached: window.__vccDebug.attached,
    ticksPerSec: window.__vccDebug.ticksPerSec,
    depletion: window.__vccDebug.depletion,
    lastPick: window.__vccDebug.lastPick,
    errors: window.__vccDebug.errors.slice(),
  }));
}

async function runToTick(page, targetTick, timeoutMs) {
  await page.evaluate(() => window.__vccDebug.start());
  await page.waitForFunction((t) => window.__vccDebug.tick >= t, targetTick, {
    timeout: timeoutMs,
    polling: 250,
  });
  await page.evaluate(() => window.__vccDebug.pause());
  await page.waitForTimeout(400); // let the forced pause snapshot land and render
}

// ── Phase 3 mode (unchanged flow; out dir injectable via --out-dir) ────────────────────────

async function runPhase3(outDir) {
  const startedAt = Date.now();
  mkdirSync(outDir, { recursive: true });

  buildApp();
  const preview = startPreview(PHASE3_PORT);

  let browser = null;
  const consoleErrors = [];
  const pageErrors = [];
  const captures = [];

  try {
    await waitForServer(`http://localhost:${PHASE3_PORT}/`, 20_000);

    browser = await chromium.launch({
      headless: true,
      args: ["--enable-unsafe-webgpu", "--use-angle=metal"],
    });

    // ── Primary pass (backend auto-selected; record what actually ran) ────────────────────
    const page = await openApp(
      browser,
      `http://localhost:${PHASE3_PORT}/`,
      consoleErrors,
      pageErrors,
      { width: 1280, height: 800 },
    );
    const backend = await page.evaluate(() => window.__vccDebug.backend);
    log(`active backend: ${backend}`);

    async function capture(name, description, extra = {}) {
      const state = await debugState(page);
      const file = resolve(outDir, `${name}.png`);
      await page.screenshot({ path: file });
      captures.push({
        name,
        description,
        file,
        backend,
        tick: state.tick,
        attached: state.attached,
        ticksPerSec: state.ticksPerSec,
        depletion: state.depletion,
        ...extra,
      });
      log(`${name}.png @ tick ${state.tick} (attached ${state.attached})`);
      return state;
    }

    log(`running to tick ${EARLY_TICK}…`);
    await runToTick(page, EARLY_TICK, 120_000);
    await capture("plate-early", `plate preset, first capture at >= tick ${EARLY_TICK}`);

    log(`running to tick ${MID_TICK}…`);
    await runToTick(page, MID_TICK, 180_000);
    await capture("plate-mid", `plate preset, mid-run capture at >= tick ${MID_TICK}`);

    await page.evaluate((deg) => window.__vccDebug.orbit(deg), ORBIT_DEGREES);
    await page.waitForTimeout(400);
    await capture(
      "plate-mid-orbit",
      `same state as plate-mid, camera orbited ${ORBIT_DEGREES} degrees about +z`,
    );
    // Return to the canonical face-on view (normal to the vertical slice) for WP3 shots.
    await page.evaluate((deg) => window.__vccDebug.orbit(-deg), ORBIT_DEGREES);
    await page.waitForTimeout(300);

    // ── WP3: advance to a deterministic ratio < 1 moment (A3-5d). The ratio sawtooths with
    // basal layer nucleation (plan, Tried-and-rejected: ring episodes read > 1 transiently),
    // so the capture lands on the starved phase of the layer cycle, found by stepping the
    // deterministic run forward — never by editing numbers.
    let wp3State = await debugState(page);
    let advanceRounds = 0;
    while (!(wp3State.depletion && wp3State.depletion.ratio < 1) && advanceRounds < 40) {
      await runToTick(page, wp3State.tick + 25, 30_000);
      wp3State = await debugState(page);
      advanceRounds++;
    }
    const ratioBelow1Found = wp3State.depletion !== null && wp3State.depletion.ratio < 1;
    log(
      `WP3 capture state: tick ${wp3State.tick}, ratio ${wp3State.depletion?.ratio} (ratio<1: ${ratioBelow1Found})`,
    );

    // ── WP3: overlay (A3-1) — range tightened to the boundary-layer scale via the same
    // adjustable-range hook the UI uses. Surface-adjacent d is drained by freezing each tick
    // (measured spread over surface cells at this tick: ~4e-4 .. 2.2e-3, see
    // out/wp3-depletion-probe.ts), so [0, rho] renders near-uniform; the adjustability IS
    // the criterion.
    await page.evaluate(() => window.__vccDebug.setOverlay("vaporAvailability"));
    await page.evaluate(() => window.__vccDebug.setOverlayRange(0, 0.0025));
    await page.waitForTimeout(400);
    await capture("overlay-vapor", "vapor-availability overlay + legend, range [0, 0.0025]", {
      overlay: "vaporAvailability",
      overlayRange: [0, 0.0025],
    });

    // ── WP3: vertical slice, the Berg view (A3-2, A3-5a) ──────────────────────────────────
    // Composition for legibility (coordinator finding, R3 round): camera zoomed face-on to
    // the slice plane with the well centered; HUD/status/readout/pane hidden so no panel
    // occludes the crystal or its depletion well; the slice LEGEND stays (the colormap key
    // is part of the honest picture). Overlay off so the crystal edge reads in base color.
    // distance 75 keeps the visible frame inside the slice plane's 64-cell z-extent (no
    // background bands); targetZ 0 centers the plate with the well above it.
    const SLICE_CAMERA = { azimuthDeg: 0, elevationDeg: 8, distance: 75, targetZ: 0 };
    await page.evaluate((cam) => {
      window.__vccDebug.setOverlay("none");
      window.__vccDebug.setSlice({ enabled: true, orientation: "vertical", min: 0, max: 0.1 });
      window.__vccDebug.setCamera(cam);
      window.__vccDebug.setChrome({ hud: false, status: false, readout: false, pane: false, legends: true });
    }, SLICE_CAMERA);
    await page.waitForTimeout(400);
    await capture(
      "slice-vertical",
      "vertical slice (j through center) of vapor d — Berg-view depression over the facet; default range [0, 0.1]; panels hidden, camera face-on",
      { slice: { orientation: "vertical", range: [0, 0.1] }, camera: SLICE_CAMERA, chrome: "legend only" },
    );

    // Same framing, range calibrated from measured profiles (out/wp3-slice-profile.ts:
    // above-center 0.017..0.06 vs above-rim 0.030..0.07 over the first ~10 cells) so the
    // saturation contour itself traces the well dipping toward the facet center.
    await page.evaluate(() => window.__vccDebug.setSlice({ min: 0, max: 0.05 }));
    await page.waitForTimeout(400);
    await capture(
      "slice-vertical-mid",
      "vertical slice of vapor d, range [0, 0.05] — the depletion well: contours visibly deeper above the facet center than above the rim",
      { slice: { orientation: "vertical", range: [0, 0.05] }, camera: SLICE_CAMERA, chrome: "legend only" },
    );

    // ── WP3: HUD (A3-5d) — same frozen state and framing, HUD + status back on ────────────
    await page.evaluate(() => {
      window.__vccDebug.setChrome({ hud: true, status: true, legends: false, readout: false, pane: false });
    });
    await page.waitForTimeout(300);
    await capture("hud-depletion", "depletion HUD (ratio < 1, sparkline) beside the unoccluded depletion well", {
      slice: { orientation: "vertical", range: [0, 0.05] },
      camera: SLICE_CAMERA,
      chrome: "hud + status",
      ratioBelow1Found,
    });

    // ── Restore chrome (legends stay hidden: they have their own captures and the readout
    // is this shot's subject), canonical camera, overlay on for the readout's overlay line.
    await page.evaluate(() => {
      window.__vccDebug.setChrome({ hud: true, status: true, legends: false, readout: true, pane: true });
      window.__vccDebug.setCamera({});
      window.__vccDebug.setOverlay("vaporAvailability");
      window.__vccDebug.setOverlayRange(0, 0.0025);
      window.__vccDebug.setSlice({ min: 0, max: 0.1 });
    });
    await page.waitForTimeout(300);

    // ── WP3: picking (A3-3, A3-5c) — real raycast first, then the deterministic rim cell ──
    await page.mouse.move(640, 400);
    await page.waitForTimeout(250);
    const rayState = await debugState(page);
    const rayHit = rayState.lastPick;
    const rimCell = await page.evaluate(() => window.__vccDebug.pickRimCell());
    await page.waitForTimeout(250);
    await capture("picking-rim", "picking readout for a deterministic rim cell (top layer, max i)", {
      raycastHit: rayHit,
      pickedCell: rimCell,
    });

    const ratioTail = await page.evaluate(() => window.__vccDebug.ratioSeriesTail(12));
    const finalState = await debugState(page);
    await page.close();

    // ── Fallback pass: forced WebGL2 (?webgl2=1) proves overlays/slice on the fallback ────
    log("fallback pass (?webgl2=1)…");
    const fbConsoleErrors = [];
    const fbPageErrors = [];
    const fbPage = await openApp(
      browser,
      `http://localhost:${PHASE3_PORT}/?webgl2=1`,
      fbConsoleErrors,
      fbPageErrors,
      { width: 1280, height: 800 },
    );
    const fbBackend = await fbPage.evaluate(() => window.__vccDebug.backend);
    log(`fallback backend: ${fbBackend}`);
    await fbPage.evaluate(() => window.__vccDebug.start());
    await fbPage.waitForFunction((t) => window.__vccDebug.tick >= t, EARLY_TICK, {
      timeout: 120_000,
      polling: 250,
    });
    await fbPage.evaluate(() => window.__vccDebug.pause());
    await fbPage.waitForTimeout(400);
    await fbPage.evaluate(() => {
      window.__vccDebug.setOverlay("vaporAvailability");
      window.__vccDebug.setSlice({ enabled: true, orientation: "vertical" });
    });
    await fbPage.waitForTimeout(400);
    const fbState = await debugState(fbPage);
    const fbFile = resolve(outDir, "fallback-webgl2.png");
    await fbPage.screenshot({ path: fbFile });
    captures.push({
      name: "fallback-webgl2",
      description: "forced WebGL2 fallback: overlay + vertical slice at >= tick 300",
      file: fbFile,
      backend: fbBackend,
      tick: fbState.tick,
      attached: fbState.attached,
      ticksPerSec: fbState.ticksPerSec,
      depletion: fbState.depletion,
      overlay: "vaporAvailability",
      slice: { orientation: "vertical" },
    });
    log(`fallback-webgl2.png @ tick ${fbState.tick}`);
    const fbInAppErrors = fbState.errors;
    await fbPage.close();

    const manifest = {
      command: "node app/scripts/visual.mjs",
      server: "vite build + vite preview (production bundle)",
      backend,
      fallbackBackend: fbBackend,
      viewport: { width: 1280, height: 800 },
      config: "plate preset, dims 128x128x64, hexPrism, reflecting, seed 1, noise 0 (app defaults)",
      ticks: Object.fromEntries(captures.map((c) => [c.name, c.tick])),
      ticksPerSec: finalState.ticksPerSec,
      depletionAtWp3Capture: finalState.depletion,
      ratioBelow1Found,
      depletionRatioTail: ratioTail,
      consoleErrors: [...consoleErrors, ...fbConsoleErrors],
      pageErrors: [...pageErrors, ...fbPageErrors],
      inAppErrors: [...finalState.errors, ...fbInAppErrors],
      screenshots: captures.map((c) => ({ ...c, file: c.file.replace(`${repoRoot}/`, "") })),
      durationSeconds: (Date.now() - startedAt) / 1000,
      generatedAt: new Date().toISOString(),
    };
    writeFileSync(resolve(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    log(`manifest written to ${resolve(outDir, "manifest.json")}`);

    const failures =
      manifest.consoleErrors.length + manifest.pageErrors.length + manifest.inAppErrors.length;
    if (failures > 0) {
      log(
        `FAIL: ${manifest.consoleErrors.length} console error(s), ${manifest.pageErrors.length} page error(s), ${manifest.inAppErrors.length} in-app error(s)`,
      );
      process.exitCode = 1;
    } else {
      log(
        `OK in ${manifest.durationSeconds.toFixed(1)}s — backend ${backend} (+ forced ${fbBackend} pass), ${captures.length} screenshots`,
      );
    }
  } finally {
    if (browser !== null) await browser.close();
    preview.kill();
  }
}

// ── Phase 4 mode (V4-5/V4-6): verify bundles, then capture inspected evidence states ───────

/** Per-view scene setup: camera pose and slice; the slice range spans the operator's own
 * field scale (GG rho / LK sigmaInfinity), recorded in the manifest entry. */
function viewSetup(style, fieldScale) {
  switch (style) {
    case "solid":
      return { camera: { azimuthDeg: 20, elevationDeg: 32 }, slice: null };
    case "column":
      return { camera: { azimuthDeg: 20, elevationDeg: 12 }, slice: null };
    case "slice":
      return {
        camera: { azimuthDeg: 0, elevationDeg: 8 },
        slice: { orientation: "vertical", min: 0, max: fieldScale },
      };
    case "profile":
      return { camera: { azimuthDeg: 0, elevationDeg: 5 }, slice: null };
    case "top":
      return { camera: { azimuthDeg: 0, elevationDeg: 88 }, slice: null };
    default:
      throw new Error(`unknown view style ${style}`);
  }
}

async function runPhase4(options) {
  const startedAt = Date.now();
  const outDir = options.outDir ?? resolve(repoRoot, "out", "phase4-visual");
  const passADir = options.passADir ?? resolve(repoRoot, "out", "phase4", "pass-a");
  const passBDir = options.passBDir ?? resolve(repoRoot, "out", "phase4", "pass-b");

  // ── Bundle verification: EVERY integrity check happens BEFORE any capture ───────────────
  if (!existsSync(passADir)) {
    throw new Error(
      `V4-BUNDLE-FILESET: pass-a evidence directory is missing: ${passADir} (Pass A is ` +
        `required; there is nothing to capture)`,
    );
  }
  log(`verifying pass-a bundle: ${passADir}`);
  const bundleA = verifyPhase4Bundle(passADir, PASS_A_IDENTITY);
  log(`pass-a bundle OK (${bundleA.runs.size} runs)`);

  let bundleB = null;
  let passBRecord;
  if (existsSync(passBDir)) {
    log(`verifying pass-b bundle: ${passBDir}`);
    bundleB = verifyPhase4Bundle(passBDir, PASS_B_IDENTITY);
    log(`pass-b bundle OK (${bundleB.runs.size} runs)`);
    passBRecord = { present: true, directory: passBDir };
  } else if (options.requirePassB) {
    throw new Error(`V4-BUNDLE-FILESET: --require-pass-b given but ${passBDir} is absent`);
  } else {
    passBRecord = {
      present: false,
      directory: passBDir,
      reason: "pass-b evidence directory is absent (Pass A precedes Pass B in the phase plan)",
    };
    log(`pass-b bundle absent (recorded explicitly, not silently skipped): ${passBDir}`);
  }
  const passBPlan = planPassBViews(bundleB);
  for (const absent of passBPlan.absent) {
    log(`pass-b view ABSENT: ${absent.name} — ${absent.reason}`);
  }
  const requiredViews = [...REQUIRED_PASS_A_VIEWS, ...passBPlan.available];

  mkdirSync(outDir, { recursive: true });
  buildApp();
  const preview = startPreview(PHASE4_PORT);

  let browser = null;
  const consoleErrors = [];
  const pageErrors = [];
  const inAppErrors = [];
  const entries = [];
  const backendPassNames = [];
  const actualBackends = {};

  try {
    await waitForServer(`http://localhost:${PHASE4_PORT}/`, 20_000);
    browser = await chromium.launch({
      headless: true,
      args: ["--enable-unsafe-webgpu", "--use-angle=metal"],
    });

    const backendPasses = [
      { name: "primary", query: "" },
      { name: "forced-webgl2", query: "?webgl2=1" },
    ];

    for (const backendPass of backendPasses) {
      backendPassNames.push(backendPass.name);
      const page = await openApp(
        browser,
        `http://localhost:${PHASE4_PORT}/${backendPass.query}`,
        consoleErrors,
        pageErrors,
        { width: 1600, height: 1200 },
      );
      const actualBackend = await page.evaluate(() => window.__vccDebug.backend);
      actualBackends[backendPass.name] = actualBackend;
      log(`backend pass "${backendPass.name}": actual backend ${actualBackend}`);
      // The live worker is not this mode's subject; keep it paused for stable captures.
      await page.evaluate(() => window.__vccDebug.pause());

      for (const view of requiredViews) {
        const bundle = view.pass === "A" ? bundleA : bundleB;
        const identity = view.pass === "A" ? PASS_A_IDENTITY : PASS_B_IDENTITY;
        const run = bundle.runs.get(view.runId);
        if (run === undefined) {
          throw new Error(`V4-VIEW-MANIFEST: view ${view.name} needs missing run ${view.runId}`);
        }
        const bytes = readFileSync(join(bundle.directory, run.checkpointPath));
        const evidenceStatus =
          view.pass === "A"
            ? `published Pass A evidence (${identity.reportPath}, gatePass=true)`
            : `published Pass B evidence (${identity.reportPath}, executionValid=true, ` +
              `diagnosticPass=${String(bundle.verdict.diagnosticPass)})`;
        const context = {
          runId: run.runId,
          pass: view.pass,
          operator: identity.operator,
          backend: String(run.config.backend ?? "float64-cpu-oracle"),
          evidenceStatus,
          checkpointSha256: run.checkpointSha256,
        };
        const loadResult = await page.evaluate(
          ({ b64, ctx }) => window.__vccDebug.loadArtifactBase64(b64, ctx),
          { b64: Buffer.from(bytes).toString("base64"), ctx: context },
        );
        if (!loadResult.ok) {
          throw new Error(`V4-ARTIFACT-LOAD: ${view.name}: ${loadResult.error}`);
        }

        // Label honesty before capture acceptance (the plan's visual adversarial bullet):
        // the DISPLAYED operator and field/surface identities must match the bundle's.
        const info = await page.evaluate(() => window.__vccDebug.inspectedInfo());
        if (info === null || info.operator !== identity.operator) {
          throw new Error(
            `V4-LABEL-MISMATCH: ${view.name} displays operator ${info?.operator}, expected ` +
              identity.operator,
          );
        }
        const expectedField = identity.operator === "GGThreshold" ? "d" : "sigma";
        const expectedSurface = identity.operator === "GGThreshold" ? "b" : "f";
        if (info.fieldName !== expectedField || info.surfaceName !== expectedSurface) {
          throw new Error(
            `V4-LABEL-MISMATCH: ${view.name} labels fields ${info.fieldName}/${info.surfaceName}, ` +
              `expected ${expectedField}/${expectedSurface}`,
          );
        }
        if (info.runId !== run.runId || info.sha256 !== run.checkpointSha256) {
          throw new Error(`V4-LABEL-MISMATCH: ${view.name} shows a different run/checkpoint`);
        }

        const fieldScale =
          identity.operator === "GGThreshold"
            ? Number(info.ggControl?.rho ?? 0.1)
            : Number(info.sigmaInfinity ?? 0.002);
        const setup = viewSetup(view.style, fieldScale);
        await page.evaluate(
          ({ camera, slice }) => {
            window.__vccDebug.setInspectOverlay("none");
            if (slice === null) {
              window.__vccDebug.setSlice({ enabled: false });
            } else {
              window.__vccDebug.setSlice({
                enabled: true,
                orientation: slice.orientation,
                min: slice.min,
                max: slice.max,
              });
            }
            window.__vccDebug.setCamera(camera);
            window.__vccDebug.setChrome({
              hud: true,
              status: true,
              legends: true,
              readout: false,
              pane: false,
            });
          },
          { camera: setup.camera, slice: setup.slice },
        );
        await page.waitForTimeout(500);

        const file = resolve(outDir, `${view.name}--${backendPass.name}.png`);
        await page.screenshot({ path: file });
        entries.push({
          name: view.name,
          backendPass: backendPass.name,
          file: file.replace(`${repoRoot}/`, ""),
          actualBackend,
          pass: view.pass,
          runId: run.runId,
          sourceCheckpoint: {
            path: join(bundle.directory, run.checkpointPath).replace(`${repoRoot}/`, ""),
            sha256: run.checkpointSha256,
          },
          operator: info.operator,
          policy:
            info.operator === "GGThreshold"
              ? "GGThreshold (abstract thresholds; no physical surface policy)"
              : info.surfacePolicy,
          controls:
            info.operator === "GGThreshold"
              ? { ggControl: info.ggControl }
              : { tempC: info.tempC, sigmaInfinity: info.sigmaInfinity },
          seed: info.seed,
          noiseEpsilon: info.noiseEpsilon,
          dims: info.dims,
          tick: info.tick,
          simTimeSeconds: info.simTimeSeconds,
          recordedBackend: info.recordedBackend,
          evidenceStatus: info.evidenceStatus,
          metrics: {
            depletionCenter: info.depletion.center,
            depletionRim: info.depletion.rim,
            depletionRatio: info.depletion.ratio,
            aspectRatio: info.aspectRatio,
            attachedCount: info.attachedCount,
          },
          camera: setup.camera,
          slice: setup.slice,
        });
        log(`${view.name}--${backendPass.name}.png (run ${run.runId}, ${info.operator})`);
      }

      const pageState = await debugState(page);
      inAppErrors.push(...pageState.errors);
      await page.close();
    }

    // ── Self-check BEFORE exit: a manifest missing any required view fails by name ────────
    assertViewManifestComplete(
      entries,
      requiredViews,
      backendPassNames,
      passBPlan.absent,
      passBPlan.absent,
    );

    const manifest = {
      command: "node app/scripts/visual.mjs --phase4",
      server: "vite build + vite preview (production bundle)",
      viewport: { width: 1600, height: 1200 },
      passA: { present: true, directory: passADir },
      passB: passBRecord,
      absentViews: passBPlan.absent,
      backendPasses: backendPassNames,
      actualBackends,
      captures: entries,
      consoleErrors,
      pageErrors,
      inAppErrors,
      durationSeconds: (Date.now() - startedAt) / 1000,
      generatedAt: new Date().toISOString(),
    };
    writeFileSync(resolve(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    log(`manifest written to ${resolve(outDir, "manifest.json")}`);

    const failures = consoleErrors.length + pageErrors.length + inAppErrors.length;
    if (failures > 0) {
      log(
        `FAIL: ${consoleErrors.length} console error(s), ${pageErrors.length} page error(s), ` +
          `${inAppErrors.length} in-app error(s)`,
      );
      process.exitCode = 1;
    } else {
      log(
        `OK in ${manifest.durationSeconds.toFixed(1)}s — ${entries.length} captures across ` +
          `${backendPassNames.length} backend passes (${passBPlan.absent.length} absent pass-b ` +
          `view(s) recorded)`,
      );
    }
  } finally {
    if (browser !== null) await browser.close();
    preview.kill();
  }
}

// ── Entry ──────────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.phase4) {
    await runPhase4({
      outDir: args.outDir === null ? null : resolve(args.outDir),
      passADir: args.passADir === null ? null : resolve(args.passADir),
      passBDir: args.passBDir === null ? null : resolve(args.passBDir),
      requirePassB: args.requirePassB,
    });
  } else {
    const outDir =
      args.outDir === null ? resolve(repoRoot, "out", "phase3-visual") : resolve(args.outDir);
    await runPhase3(outDir);
  }
}

main().catch((err) => {
  console.error(`[visual] FAILED: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
  process.exitCode = 1;
});
