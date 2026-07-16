#!/usr/bin/env node
// Screenshot harness (A2-9): builds the app, serves it with `vite preview`, drives it in
// headless chromium via Playwright, and captures PNGs + a manifest to out/phase3-visual/.
//
// Server choice, stated per the WP2 criteria: `vite build` + `vite preview` — the harness
// exercises the production bundling path (including worker bundling), not just the dev
// transform pipeline, and the built page loads faster for repeated review rounds.
//
// WebGPU is attempted (--enable-unsafe-webgpu, Metal ANGLE); if headless chromium does not
// expose navigator.gpu the app's automatic WebGL2 fallback renders instead. Either way the
// manifest records the backend that ACTUALLY ran (charter §1.5: the claim is only ever what
// happened). Exit is nonzero on any console error, page error, or in-app fault (A2-2).
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
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(String(err)));

    await page.goto(`http://localhost:${PORT}/`, { waitUntil: "load" });

    log("waiting for renderer init + first snapshot…");
    await page.waitForFunction(
      () => window.__vccDebug && window.__vccDebug.backend !== null && window.__vccDebug.snapshotCount > 0,
      undefined,
      { timeout: 30_000 },
    );
    const backend = await page.evaluate(() => window.__vccDebug.backend);
    log(`active backend: ${backend}`);

    async function debugState() {
      return page.evaluate(() => ({
        tick: window.__vccDebug.tick,
        attached: window.__vccDebug.attached,
        ticksPerSec: window.__vccDebug.ticksPerSec,
        errors: window.__vccDebug.errors.slice(),
      }));
    }

    async function capture(name, description) {
      // Pause for a coherent frame, then let the forced snapshot land and render.
      await page.evaluate(() => window.__vccDebug.pause());
      await page.waitForTimeout(400);
      const state = await debugState();
      const file = resolve(outDir, `${name}.png`);
      await page.screenshot({ path: file });
      captures.push({
        name,
        description,
        file,
        tick: state.tick,
        attached: state.attached,
        ticksPerSec: state.ticksPerSec,
      });
      log(`${name}.png @ tick ${state.tick} (attached ${state.attached}, ${state.ticksPerSec?.toFixed(1)} ticks/s)`);
      return state;
    }

    log(`running to tick ${EARLY_TICK}…`);
    await page.evaluate(() => window.__vccDebug.start());
    await page.waitForFunction((t) => window.__vccDebug.tick >= t, EARLY_TICK, {
      timeout: 120_000,
      polling: 250,
    });
    await capture("plate-early", `plate preset, first capture at >= tick ${EARLY_TICK}`);

    log(`running to tick ${MID_TICK}…`);
    await page.evaluate(() => window.__vccDebug.start());
    await page.waitForFunction((t) => window.__vccDebug.tick >= t, MID_TICK, {
      timeout: 180_000,
      polling: 250,
    });
    const mid = await capture("plate-mid", `plate preset, mid-run capture at >= tick ${MID_TICK}`);

    await page.evaluate((deg) => window.__vccDebug.orbit(deg), ORBIT_DEGREES);
    await page.waitForTimeout(400);
    const orbitFile = resolve(outDir, "plate-mid-orbit.png");
    await page.screenshot({ path: orbitFile });
    captures.push({
      name: "plate-mid-orbit",
      description: `same state as plate-mid, camera orbited ${ORBIT_DEGREES} degrees about +z`,
      file: orbitFile,
      tick: mid.tick,
      attached: mid.attached,
      ticksPerSec: mid.ticksPerSec,
    });
    log(`plate-mid-orbit.png @ tick ${mid.tick}`);

    const finalState = await debugState();
    const manifest = {
      command: "node app/scripts/visual.mjs",
      server: "vite build + vite preview (production bundle)",
      backend,
      viewport: { width: 1280, height: 800 },
      config: "plate preset, dims 128x128x64, hexPrism, reflecting, seed 1, noise 0 (app defaults)",
      ticks: Object.fromEntries(captures.map((c) => [c.name, c.tick])),
      ticksPerSec: mid.ticksPerSec,
      consoleErrors,
      pageErrors,
      inAppErrors: finalState.errors,
      screenshots: captures.map((c) => ({ ...c, file: c.file.replace(`${repoRoot}/`, "") })),
      durationSeconds: (Date.now() - startedAt) / 1000,
      generatedAt: new Date().toISOString(),
    };
    writeFileSync(resolve(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    log(`manifest written to ${resolve(outDir, "manifest.json")}`);

    const failures = consoleErrors.length + pageErrors.length + finalState.errors.length;
    if (failures > 0) {
      log(`FAIL: ${consoleErrors.length} console error(s), ${pageErrors.length} page error(s), ${finalState.errors.length} in-app error(s)`);
      process.exitCode = 1;
    } else {
      log(`OK in ${manifest.durationSeconds.toFixed(1)}s — backend ${backend}, ${captures.length} screenshots`);
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
