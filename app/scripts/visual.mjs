#!/usr/bin/env node
// Screenshot harness (A2-9 + A3-5): builds the app, serves it with `vite preview`, drives it
// in headless chromium via Playwright, and captures PNGs + a manifest to out/phase3-visual/.
//
// Server choice, stated per the WP2 criteria: `vite build` + `vite preview` — the harness
// exercises the production bundling path (including worker bundling), not just the dev
// transform pipeline, and the built page loads faster for repeated review rounds.
//
// WebGPU is attempted (--enable-unsafe-webgpu, Metal ANGLE); if headless chromium does not
// expose navigator.gpu the app's automatic WebGL2 fallback renders instead. Either way the
// manifest records the backend that ACTUALLY ran (charter §1.5: the claim is only ever what
// happened). A dedicated ?webgl2=1 pass additionally forces the WebGL2 fallback so overlays,
// slice, and picking are proven on BOTH backends. Exit is nonzero on any console error, page
// error, or in-app fault (A2-2), on either page.
//
// WP3 captures (A3-5 visual gate rehearsal): vapor-availability overlay, vertical slice
// through the facet center (Berg view), picking readout on a deterministic rim cell, and the
// depletion HUD; depletion numbers ride the manifest (NaN serializes as null).
//
// Dev tooling only: nothing in app/src imports from here or from Playwright.

import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(scriptDir, "..");
const repoRoot = resolve(appDir, "..");
const outDir = resolve(repoRoot, "out", "phase3-visual");
const viteBin = resolve(repoRoot, "node_modules", "vite", "bin", "vite.js");

const PORT = 4319;
const EARLY_TICK = 300;
const MID_TICK = 1500;
const ORBIT_DEGREES = 40;

function log(line) {
  process.stdout.write(`[visual] ${line}\n`);
}

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

/** Open the app, wire error collection, and wait for the first snapshot. */
async function openApp(browser, url, consoleErrors, pageErrors) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
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

async function main() {
  const startedAt = Date.now();
  mkdirSync(outDir, { recursive: true });

  log("vite build…");
  const build = spawnSync(process.execPath, [viteBin, "build"], {
    cwd: appDir,
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (build.status !== 0) throw new Error(`vite build failed with status ${build.status}`);

  log(`vite preview on :${PORT}…`);
  const preview = spawn(
    process.execPath,
    [viteBin, "preview", "--port", String(PORT), "--strictPort"],
    { cwd: appDir, stdio: ["ignore", "pipe", "pipe"] },
  );
  preview.stderr.on("data", (chunk) => process.stderr.write(chunk));

  let browser = null;
  const consoleErrors = [];
  const pageErrors = [];
  const captures = [];

  try {
    await waitForServer(`http://localhost:${PORT}/`, 20_000);

    browser = await chromium.launch({
      headless: true,
      args: ["--enable-unsafe-webgpu", "--use-angle=metal"],
    });

    // ── Primary pass (backend auto-selected; record what actually ran) ────────────────────
    const page = await openApp(browser, `http://localhost:${PORT}/`, consoleErrors, pageErrors);
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
    await page.evaluate(() => window.__vccDebug.setSlice({ enabled: true, orientation: "vertical" }));
    await page.waitForTimeout(400);
    await capture(
      "slice-vertical",
      "vertical slice (j through center) of vapor d — Berg-view depression over the facet; HUD visible; default range [0, 0.1]",
      { slice: { orientation: "vertical", range: [0, 0.1] }, overlay: "vaporAvailability" },
    );

    // Same slice with the range tightened to the boundary-layer scale: the center-vs-rim
    // contrast in the sampled layer itself, the A3-5a "watch it starve" picture (far field
    // saturates to the ramp top by construction — stated here and in the legend range).
    await page.evaluate(() => window.__vccDebug.setSlice({ min: 0, max: 0.0025 }));
    await page.waitForTimeout(400);
    await capture(
      "slice-vertical-tight",
      "vertical slice of vapor d, range [0, 0.0025] — boundary-layer depression, darkest above the facet center",
      { slice: { orientation: "vertical", range: [0, 0.0025] }, overlay: "vaporAvailability" },
    );

    // ── WP3: HUD (A3-5d) — same frozen state ──────────────────────────────────────────────
    await capture("hud-depletion", "depletion HUD with ratio < 1 and sparkline", {
      overlay: "vaporAvailability",
      slice: { orientation: "vertical", range: [0, 0.0025] },
      ratioBelow1Found,
    });

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
      `http://localhost:${PORT}/?webgl2=1`,
      fbConsoleErrors,
      fbPageErrors,
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

main().catch((err) => {
  console.error(`[visual] FAILED: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
  process.exitCode = 1;
});
