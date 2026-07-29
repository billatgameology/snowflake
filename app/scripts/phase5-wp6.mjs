#!/usr/bin/env node
// Phase 5 WP6 S5: the CPU-oracle-alive differential probe over the PRODUCTION app page.
// Implementation-stage evidence, not the final Phase 5 gate.
//
// What it proves, in the real app (Vite dev server over app/, pinned Playwright Chromium):
//   1. Engine switching BOTH directions through the real Tweakpane engine selector
//      (trusted DOM select events; the __vccDebug fallback is recorded by name if used).
//   2. The frozen fixture gg-plate-reflecting-48x48x24 executed to its registered 256-cycle
//      cap on the production CPU worker engine at its exact registered dims, compared
//      bit-exactly against an independent in-page float64 GGSolver oracle.
//      The GPU engine's dims are budget-coupled (main.ts configFromUI substitutes the
//      selected FROZEN budget's dims in GPU mode, and GpuEngine.constructOp faults on any
//      non-budget dims), so 48x48x24 cannot be requested on the GPU engine through any app
//      path. That seam is OBSERVED here (not hacked around), and the cross-engine
//      differential runs on the closest legitimate path: the dev-plate budget (128x128x64)
//      with the fixture's exact parameters, on BOTH engines, to the same 256-cycle cap.
//   3. CPU-vs-GPU differential at the cap: occupancy exact, per-cell attach ticks exact
//      (the complete attachment-decision history at tick resolution), attachedCount/
//      boundary/tick/stop-reason equal, wall/topology exact, and b/d under the frozen
//      PHASE5_FIELD_TOLERANCES via TEST-purpose readbacks through the production audit —
//      never a display frame.
//   4. Overlay parity on the same paused state: gpuViewSample packed colors vs
//      host-recomputed overlayValuesFor + viridis from the CPU snapshot at the same tick,
//      tolerance <= 2/255 per channel, for every overlay.
//   5. View-only artifact inspection works in BOTH modes and clearing resumes the live
//      engine (a post-clear step advances it).
//   6. Fallback honesty: ?engine=cpu and ?webgl2=1 boot the CPU path with their exact
//      status lines.
//   7. Residency: gpuAuditSummary().fullFieldDisplayFrameReadCount === 0 after everything.

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import os from "node:os";
import process from "node:process";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer as createViteServer } from "vite";
import { canonicalJsonSha256 } from "../../runner/src/gate4-evidence.ts";
import {
  PHASE5_EXPECTED_WINDOWS_BACKEND,
  PHASE5_FIELD_TOLERANCES,
  PHASE5_FIXTURES,
  PHASE5_HEADLESS_RUNTIME,
  PHASE5_HEADLESS_RUNTIME_VERSION,
  PHASE5_PROTOCOL,
  PHASE5_PROTOCOL_SHA256,
  PHASE5_SCALAR_TOLERANCES,
  phase5ProtocolManifest,
} from "../../runner/src/phase5-protocol.ts";
import { GPU_TOPOLOGY_FAR_FIELD } from "../../solver-gpu/src/index.ts";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const appDir = resolve(repoRoot, "app");
const require = createRequire(import.meta.url);
const playwrightPackage = require("playwright/package.json");
const launchFlags = [
  "--enable-unsafe-webgpu",
  "--enable-webgpu-developer-features",
];
const expectedRuntime = {
  playwrightVersion: "1.61.1",
  chromiumRevision: "1228",
  product: "Chrome/149.0.7827.55",
  revision: "@3188f8a607ae7e067593be8aab7f02d2451fec07",
};
const expectedHost = {
  platform: "win32",
  cpu: "AMD Ryzen 7 5700G with Radeon Graphics",
};
const expectedAdapter = {
  vendor: "nvidia",
  architecture: "ampere",
  device: "0x2206",
  description: "NVIDIA GeForce RTX 3080",
  backend: "D3D12",
  type: "discrete GPU",
};

/** The registered frozen fixture this probe executes (asserted against the protocol). */
const FIXTURE_ID = "gg-plate-reflecting-48x48x24";
/** The closest legitimate cross-engine path for the fixture's parameters (see header). */
const DEV_BUDGET_ID = "dev-plate";
const DEV_DIMS = { nx: 128, ny: 128, nz: 64 };
/** Overlay parity tolerance: <= 2/255 per 8-bit channel (S4 checklist item). */
const OVERLAY_CHANNEL_TOLERANCE = 2;

function git(...args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/** Absolute /@fs/ dev-server URL for a repo file (Vite root is app/, fs.allow covers the repo). */
function fsUrl(origin, ...segments) {
  const absolute = resolve(repoRoot, ...segments).replaceAll("\\", "/");
  return `${origin}/@fs/${encodeURI(absolute)}`;
}

function registeredFixture() {
  const fixture = PHASE5_FIXTURES.find((entry) => entry.id === FIXTURE_ID);
  if (fixture === undefined) throw new Error(`registered fixture is absent: ${FIXTURE_ID}`);
  const shape = {
    kind: fixture.kind,
    dims: fixture.dims,
    domain: fixture.domain,
    seedRadius: fixture.seedRadius,
    seedThickness: fixture.seedThickness,
    rngSeed: fixture.rngSeed,
    noiseEpsilon: fixture.noiseEpsilon,
    farField: fixture.farField,
    preset: fixture.preset,
    phi: fixture.phi,
    timeline: fixture.timeline,
    stop: fixture.stop,
  };
  const expected = {
    kind: "gg",
    dims: { nx: 48, ny: 48, nz: 24 },
    domain: "hexPrism",
    seedRadius: 2,
    seedThickness: 1,
    rngSeed: 1,
    noiseEpsilon: 0,
    farField: "reflecting",
    preset: "plate",
    phi: 0,
    timeline: null,
    stop: { kind: "completed-cycle-cap", value: 256 },
  };
  if (JSON.stringify(shape) !== JSON.stringify(expected)) {
    throw new Error(`${FIXTURE_ID} no longer matches its registered shape`);
  }
  return { id: fixture.id, ...expected, cycleCap: Number(fixture.stop.value) };
}

function attachPageObservers(page, sink) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      sink.consoleErrors.push({
        text: message.text(),
        url: message.location()?.url ?? "",
      });
    }
  });
  page.on("pageerror", (error) => {
    sink.pageErrors.push(String(error?.message ?? error));
  });
}

/**
 * Console errors that count against the run. The app ships no favicon, so headless Chromium
 * auto-requests /favicon.ico and the dev server answers 404 — an environmental artifact of
 * the harness, recorded verbatim but not an app fault. EVERY other console error blocks.
 */
function blockingConsoleErrors(entries) {
  return entries.filter((entry) => !entry.url.endsWith("/favicon.ico"));
}

/** Wait for the app to boot: __vccDebug installed and a first snapshot posted. */
async function waitForBoot(page, timeoutMs) {
  await page.waitForFunction(
    () => {
      const dbg = window.__vccDebug;
      return dbg !== undefined && dbg.snapshotCount > 0;
    },
    undefined,
    { timeout: timeoutMs },
  );
}

/**
 * Switch engines through the REAL pane selector with trusted DOM events; the __vccDebug
 * fallback is used (and recorded by name) only if the select cannot be driven.
 */
async function switchEngine(page, targetKind) {
  const targetLabel =
    targetKind === "cpu" ? "cpu worker (float64 oracle)" : "gpu (float32, unvalidated)";
  const before = await page.evaluate(() => ({
    engine: window.__vccDebug.engine(),
    snapshotCount: window.__vccDebug.snapshotCount,
  }));
  if (before.engine === targetKind) {
    throw new Error(`engine switch to ${targetKind} requested while already active`);
  }
  let method = "trusted-ui-select";
  try {
    const select = page
      .locator(".tp-dfwv select")
      .filter({ has: page.locator("option", { hasText: "cpu worker (float64 oracle)" }) })
      .first();
    await select.waitFor({ state: "visible", timeout: 10_000 });
    await select.selectOption({ label: targetLabel }, { timeout: 10_000 });
  } catch (err) {
    method = `debug-hook-setEngine (pane select not drivable: ${
      err instanceof Error ? err.message.split("\n")[0] : String(err)
    })`;
    await page.evaluate((kind) => {
      window.__vccDebug.setEngine(kind);
    }, targetKind);
  }
  await page.waitForFunction(
    (input) => {
      const dbg = window.__vccDebug;
      return (
        dbg.engine() === input.kind &&
        dbg.snapshotCount > input.prevCount &&
        dbg.tick === 0
      );
    },
    { kind: targetKind, prevCount: before.snapshotCount },
    { timeout: 120_000 },
  );
  const statusText = await page.evaluate(
    () => document.getElementById("status")?.textContent ?? "",
  );
  const expectedSolverLine =
    targetKind === "gpu"
      ? "solver: float32 GPU engine (CPU oracle worker selectable)"
      : "solver: CPU worker (float32 GPU engine selectable)";
  const expectedBackendLine =
    targetKind === "gpu"
      ? "GGThreshold float32 GPU engine (solver work on the GPU"
      : "GGThreshold oracle in a Web Worker";
  return {
    from: before.engine,
    to: targetKind,
    method,
    statusSolverLineExact: statusText.includes(expectedSolverLine),
    statusBackendLinePresent: statusText.includes(expectedBackendLine),
    pass: statusText.includes(expectedSolverLine) && statusText.includes(expectedBackendLine),
  };
}

async function main() {
  if (process.argv.length !== 2) {
    throw new Error("WP6 app differential probe accepts no options");
  }
  if (process.platform !== "win32") {
    throw new Error(`WP6 app differential probe does not support ${process.platform}`);
  }
  const fixture = registeredFixture();
  const browserPath = chromium.executablePath();
  if (!existsSync(browserPath)) {
    throw new Error(`the frozen Chromium executable is absent: ${browserPath}`);
  }
  const vite = await createViteServer({
    root: appDir,
    logLevel: "error",
    server: {
      host: "127.0.0.1",
      port: 0,
      strictPort: false,
      fs: { allow: [repoRoot] },
    },
  });
  await vite.listen();
  const address = vite.httpServer?.address();
  if (address === null || address === undefined || typeof address === "string") {
    throw new Error("WP6 Vite server did not receive an IPv4 port");
  }
  const origin = `http://127.0.0.1:${address.port}`;
  let browser = null;
  try {
    browser = await chromium.launch({
      executablePath: browserPath,
      headless: true,
      args: launchFlags,
    });
    const mainSink = { consoleErrors: [], pageErrors: [] };
    const page = await browser.newPage();
    page.setDefaultTimeout(120_000);
    attachPageObservers(page, mainSink);
    await page.goto(`${origin}/`, { waitUntil: "load" });
    await waitForBoot(page, 120_000);

    // ── Install the in-page toolkit: app/core module instances + shared helpers ──────────
    await page.evaluate(
      async (input) => {
        const dbg = window.__vccDebug;
        if (dbg === undefined) throw new Error("__vccDebug is absent");
        const [core, cpu, overlays, colormap, surface] = await Promise.all([
          import(input.coreUrl),
          import(input.cpuUrl),
          import(input.overlaysUrl),
          import(input.colormapUrl),
          import(input.surfaceUrl),
        ]);
        function sleep(ms) {
          return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
        }
        async function waitFor(label, predicate, timeoutMs, intervalMs = 25) {
          const deadline = performance.now() + timeoutMs;
          for (;;) {
            const value = predicate();
            if (value) return value;
            if (performance.now() > deadline) {
              throw new Error(`WP6 wait timed out: ${label}`);
            }
            await sleep(intervalMs);
          }
        }
        /** Settled = not running and tick unchanged over four consecutive polls. */
        async function waitForSettled(timeoutMs) {
          let stableTick = -1;
          let stableCount = 0;
          await waitFor(
            "engine settle",
            () => {
              if (dbg.running) {
                stableCount = 0;
                return false;
              }
              if (dbg.tick === stableTick) stableCount++;
              else {
                stableTick = dbg.tick;
                stableCount = 1;
              }
              return stableCount >= 4;
            },
            timeoutMs,
            50,
          );
        }
        /** Single-step the ACTIVE engine to targetTick (never past it; stops honor stops). */
        async function stepTo(targetTick, perStepTimeoutMs) {
          while (dbg.tick < targetTick && dbg.stopReason === null) {
            const before = dbg.tick;
            dbg.step();
            await waitFor(
              `step to ${before + 1}`,
              () => dbg.tick > before || dbg.stopReason !== null,
              perStepTimeoutMs,
              5,
            );
          }
          return { tick: dbg.tick, stopReason: dbg.stopReason };
        }
        async function waitForCpuReady(cells, prevCount, timeoutMs) {
          await waitFor(
            `cpu ready at ${cells} cells`,
            () => {
              if (dbg.snapshotCount <= prevCount) return false;
              const fields = dbg.cpuSnapshotFields();
              return (
                fields !== null &&
                fields.snapshot.tick === 0 &&
                fields.snapshot.a.length === cells
              );
            },
            timeoutMs,
            50,
          );
        }
        function statusText() {
          return document.getElementById("status")?.textContent ?? "";
        }
        function readoutText() {
          return document.getElementById("readout")?.textContent ?? "";
        }
        function exactMismatch(reference, candidate) {
          if (reference.length !== candidate.length) return Infinity;
          let mismatch = 0;
          for (let index = 0; index < reference.length; index++) {
            if (reference[index] !== candidate[index]) mismatch++;
          }
          return mismatch;
        }
        /** Occupancy compare across representations: CPU u8 0/1 vs GPU u32 0/nonzero. */
        function occupancyMismatch(cpuA, gpuOccupancy) {
          if (cpuA.length !== gpuOccupancy.length) return Infinity;
          let mismatch = 0;
          for (let index = 0; index < cpuA.length; index++) {
            if ((cpuA[index] !== 0) !== (gpuOccupancy[index] !== 0)) mismatch++;
          }
          return mismatch;
        }
        /** Frozen-tolerance field comparison (same semantics as the WP3 probe). */
        function fieldComparison(reference, candidate, tolerance) {
          if (reference.length !== candidate.length) {
            throw new Error("WP6 field comparison length mismatch");
          }
          let maxAbs = 0;
          let squareSum = 0;
          let maxRelative = 0;
          let relativeComparedCount = 0;
          for (let index = 0; index < reference.length; index++) {
            const expected = reference[index];
            const actual = candidate[index];
            if (!Number.isFinite(expected) || !Number.isFinite(actual)) {
              throw new Error(`WP6 field comparison requires finite values at ${index}`);
            }
            const difference = Math.abs(actual - expected);
            maxAbs = Math.max(maxAbs, difference);
            squareSum += difference * difference;
            if (Math.abs(expected) >= tolerance.relativeDenominatorFloor) {
              maxRelative = Math.max(maxRelative, difference / Math.abs(expected));
              relativeComparedCount++;
            }
          }
          const rms = Math.sqrt(squareSum / reference.length);
          return {
            maxAbs,
            rms,
            maxRelative,
            relativeComparedCount,
            length: reference.length,
            bounds: {
              maxAbs: tolerance.maxAbs,
              rms: tolerance.rms,
              maxRelative: tolerance.maxRelative,
            },
            pass:
              maxAbs <= tolerance.maxAbs &&
              rms <= tolerance.rms &&
              maxRelative <= tolerance.maxRelative,
          };
        }
        function base64FromBytes(bytes) {
          let binary = "";
          const chunkSize = 0x8000;
          for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
          }
          return btoa(binary);
        }
        function clonedPresetParams(name, phi) {
          const preset = core.GG_PRESETS[name];
          return {
            rho: preset.rho,
            phi: phi ?? preset.phi,
            kappa: new Float64Array(preset.kappa),
            mu: new Float64Array(preset.mu),
            ggThreshBeta: new Float64Array(preset.ggThreshBeta),
          };
        }
        /** Shell mean over free far-field cells of ONE lane's own field (f64 accumulate). */
        function shellMeanOf(field, occupancy, farFieldCells) {
          let sum = 0;
          let count = 0;
          for (const cell of farFieldCells) {
            if (occupancy[cell] !== 0) continue;
            sum += field[cell];
            count++;
          }
          return count === 0 ? Number.NaN : sum / count;
        }
        /** The 10x10x10 GG artifact fixture (inspect.test.ts pattern), built in-page. */
        function buildGgArtifact() {
          const dims = { nx: 10, ny: 10, nz: 10 };
          const center = [5, 5, 5];
          const cells = dims.nx * dims.ny * dims.nz;
          const a = new Uint8Array(cells);
          const b = new Float64Array(cells);
          const d = new Float64Array(cells);
          let attachedCount = 0;
          for (let k = 0; k < dims.nz; k++) {
            for (let j = 0; j < dims.ny; j++) {
              for (let i = 0; i < dims.nx; i++) {
                const dist = core.hexDistance(i - center[0], j - center[1]);
                if (dist > 4 || Math.abs(k - center[2]) > 4) continue;
                const x = core.idx(dims, i, j, k);
                if (k === center[2] && dist <= 2) {
                  a[x] = 1;
                  b[x] = 1;
                  attachedCount++;
                } else {
                  d[x] = 0.02 + 0.01 * dist;
                }
              }
            }
          }
          const state = {
            dims,
            tick: 77,
            rngSeed: 42,
            noiseEpsilon: 0,
            farField: "reflecting",
            domain: "hexPrism",
            params: core.GG_PRESETS.plate,
            a,
            b,
            d,
            center,
          };
          const metrics = core.computeMetrics(a, b, d, dims, center, state.tick);
          return {
            base64: base64FromBytes(core.encodeCheckpoint(state, metrics)),
            attachedCount,
            tick: state.tick,
          };
        }
        /**
         * The shared view-only inspection regression (requirement 4): load a strict GG
         * artifact, verify view-only semantics and per-operator overlay honesty, clear it,
         * and prove the LIVE engine resumes by advancing exactly one tick.
         */
        async function inspectionRegression(mode) {
          const artifact = buildGgArtifact();
          const tickBefore = dbg.tick;
          const load = dbg.loadArtifactBase64(artifact.base64);
          const info = dbg.inspectedInfo();
          const statusDuring = statusText();
          const crossOperatorRefused = dbg.setInspectOverlay("lkSigmaAvailability") === false;
          const refusalRecorded = dbg.lastInspectError !== null;
          const ggOverlayAccepted = dbg.setInspectOverlay("vaporAvailability") === true;
          dbg.step(); // must be refused: inspecting is view-only
          await sleep(500);
          const tickDuringInspect = dbg.tick;
          const gpuViewHiddenDuringInspect =
            mode === "gpu" ? dbg.gpuViewInfo()?.visible === false : null;
          dbg.clearArtifact();
          const clearedInfo = dbg.inspectedInfo();
          const tickAfterClear = dbg.tick;
          const gpuViewVisibleAfterClear =
            mode === "gpu" ? dbg.gpuViewInfo()?.visible === true : null;
          const stepFrom = dbg.tick;
          dbg.step();
          await waitFor(
            `post-clear ${mode} step`,
            () => dbg.tick === stepFrom + 1,
            60_000,
            10,
          );
          const result = {
            mode,
            loadOk: load.ok,
            loadError: load.error,
            operator: info?.operator ?? null,
            artifactTick: info?.tick ?? null,
            artifactAttachedCount: info?.attachedCount ?? null,
            expectedAttachedCount: artifact.attachedCount,
            evidenceStatus: info?.evidenceStatus ?? null,
            statusShowsInspectProvenance: statusDuring.includes(
              "(this page; not the evidence backend)",
            ),
            crossOperatorRefused,
            refusalRecorded,
            ggOverlayAccepted,
            tickBefore,
            tickDuringInspect,
            tickAfterClear,
            tickAfterResumeStep: dbg.tick,
            clearedInfoNull: clearedInfo === null,
            gpuViewHiddenDuringInspect,
            gpuViewVisibleAfterClear,
          };
          result.pass =
            result.loadOk &&
            result.operator === "GGThreshold" &&
            result.artifactTick === artifact.tick &&
            result.artifactAttachedCount === artifact.attachedCount &&
            result.statusShowsInspectProvenance &&
            result.crossOperatorRefused &&
            result.refusalRecorded &&
            result.ggOverlayAccepted &&
            result.tickDuringInspect === tickBefore &&
            result.clearedInfoNull &&
            result.tickAfterClear === tickBefore &&
            result.tickAfterResumeStep === tickBefore + 1 &&
            (mode === "cpu" ||
              (result.gpuViewHiddenDuringInspect === true &&
                result.gpuViewVisibleAfterClear === true));
          return result;
        }
        window.__wp6 = {
          input,
          core,
          cpu,
          overlays,
          colormap,
          surface,
          data: {},
          helpers: {
            sleep,
            waitFor,
            waitForSettled,
            stepTo,
            waitForCpuReady,
            statusText,
            readoutText,
            exactMismatch,
            occupancyMismatch,
            fieldComparison,
            base64FromBytes,
            clonedPresetParams,
            shellMeanOf,
            buildGgArtifact,
            inspectionRegression,
          },
        };
      },
      {
        coreUrl: fsUrl(origin, "core", "src", "index.ts"),
        cpuUrl: fsUrl(origin, "solver-cpu", "src", "index.ts"),
        overlaysUrl: `${origin}/src/overlays.ts`,
        colormapUrl: `${origin}/src/colormap.ts`,
        surfaceUrl: `${origin}/src/surface.ts`,
      },
    );

    // ── Boot facts (D4 default: GPU engine at dev budget on the acquired device) ─────────
    const bootFacts = await page.evaluate(() => {
      const dbg = window.__vccDebug;
      const device = dbg.gpuDeviceStatus();
      return {
        engine: dbg.engine(),
        budget: dbg.gpuBudget(),
        backend: dbg.backend,
        deviceState: device?.state ?? null,
        deviceStatusLine: device?.statusLine ?? null,
        deviceLabel: device?.label ?? null,
        observedLimits: device?.observedLimits ?? null,
        statusText: window.__wp6.helpers.statusText(),
      };
    });
    const bootCheck = {
      ...bootFacts,
      statusText: undefined,
      gpuDefault: bootFacts.engine === "gpu" && bootFacts.deviceState === "acquired",
      budgetIsDevPlate: bootFacts.budget === DEV_BUDGET_ID,
      statusNamesSharedDevice: bootFacts.statusText.includes(
        "gpu: production device acquired (checked against frozen Phase 5 features/limits)",
      ),
    };
    bootCheck.pass =
      bootCheck.gpuDefault && bootCheck.budgetIsDevPlate && bootCheck.statusNamesSharedDevice;

    // Adapter facts: a read-only high-performance adapter observation on the same page.
    const adapterFacts = await page.evaluate(async () => {
      if (navigator.gpu === undefined) return null;
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: "high-performance",
      });
      if (adapter === null) return null;
      return {
        vendor: adapter.info.vendor,
        architecture: adapter.info.architecture,
        device: adapter.info.device,
        description: adapter.info.description,
        backend: adapter.info.backend,
        type: adapter.info.type,
        driver: adapter.info.driver,
      };
    });

    // ── 1a. Engine switch GPU → CPU through the real selector ────────────────────────────
    const switchToCpu = await switchEngine(page, "cpu");

    // ── 2a. The frozen fixture on the production CPU engine at its EXACT registered dims,
    //        to its registered cap, vs an independent in-page float64 oracle ──────────────
    const fixtureCpu = await page.evaluate(
      async (input) => {
        const dbg = window.__vccDebug;
        const { core, cpu, helpers } = window.__wp6;
        const cells = input.dims.nx * input.dims.ny * input.dims.nz;
        const prevCount = dbg.snapshotCount;
        dbg.applyConfig({
          preset: input.preset,
          seed: input.rngSeed,
          noiseEpsilon: input.noiseEpsilon,
          nx: input.dims.nx,
          ny: input.dims.ny,
          nz: input.dims.nz,
          domain: input.domain,
          farField: input.farField,
        });
        await helpers.waitForCpuReady(cells, prevCount, 60_000);
        const initialAttached = dbg.cpuSnapshotFields().snapshot.attachedCount;
        const drive = await helpers.stepTo(input.cycleCap, 60_000);
        await helpers.waitForSettled(30_000);
        const fields = dbg.cpuSnapshotFields();
        const snap = fields.snapshot;

        // Independent float64 oracle, stepped with the worker's exact per-tick semantics
        // (attach ticks from lastAttached; stop rules evaluated after EVERY tick).
        const params = helpers.clonedPresetParams(input.preset, input.phi);
        const oracle = new cpu.GGSolver({
          dims: input.dims,
          params,
          rngSeed: input.rngSeed,
          noiseEpsilon: input.noiseEpsilon,
          domain: input.domain,
          farField: input.farField,
          seedRadius: input.seedRadius,
          seedThickness: input.seedThickness,
        });
        const oracleInitialAttached = oracle.attachedCount;
        const attachTickOracle = new Uint32Array(oracle.a.length);
        let oracleStop = null;
        while (oracle.tick < input.cycleCap && oracleStop === null) {
          oracle.step();
          for (const x of oracle.lastAttached) attachTickOracle[x] = oracle.tick;
          if (oracle.domainContact()) oracleStop = "domain-contact";
          else if (
            oracle.farFieldMean() <
            cpu.FAR_FIELD_STOP_FRACTION * params.rho
          ) {
            oracleStop = "far-field-stop";
          }
          if (oracle.tick % 64 === 0) await helpers.sleep(0);
        }

        const bOracle32 = Float32Array.from(oracle.b, Math.fround);
        const dOracle32 = Float32Array.from(oracle.d, Math.fround);
        let bMaxAbs = 0;
        let dMaxAbs = 0;
        for (let index = 0; index < cells; index++) {
          bMaxAbs = Math.max(bMaxAbs, Math.abs(snap.b[index] - bOracle32[index]));
          dMaxAbs = Math.max(dMaxAbs, Math.abs(snap.d[index] - dOracle32[index]));
        }
        const result = {
          fixtureId: input.id,
          dims: input.dims,
          cycleCap: input.cycleCap,
          initialAttached,
          oracleInitialAttached,
          appTick: drive.tick,
          appStopReason: drive.stopReason,
          oracleTick: oracle.tick,
          oracleStopReason: oracleStop,
          occupancyMismatchCount: helpers.exactMismatch(snap.a, oracle.a),
          bBitMismatchCount: helpers.exactMismatch(
            new Uint32Array(snap.b.buffer, snap.b.byteOffset, cells),
            new Uint32Array(bOracle32.buffer),
          ),
          dBitMismatchCount: helpers.exactMismatch(
            new Uint32Array(snap.d.buffer, snap.d.byteOffset, cells),
            new Uint32Array(dOracle32.buffer),
          ),
          bMaxAbs,
          dMaxAbs,
          attachTickMismatchCount: helpers.exactMismatch(snap.attachTick, attachTickOracle),
          attachedCount: { app: snap.attachedCount, oracle: oracle.attachedCount },
          boundarySize: { app: snap.boundarySize, oracle: oracle.boundarySize() },
          farFieldMean: { app: snap.farFieldMean, oracle: oracle.farFieldMean() },
          farFieldMeanExact: Object.is(snap.farFieldMean, oracle.farFieldMean()),
          wallCells: fields.wall === null ? 0 : fields.wall.length,
        };
        result.pass =
          result.initialAttached === 19 &&
          result.oracleInitialAttached === 19 &&
          result.appTick === input.cycleCap &&
          result.appStopReason === null &&
          result.oracleTick === input.cycleCap &&
          result.oracleStopReason === null &&
          result.occupancyMismatchCount === 0 &&
          result.bBitMismatchCount === 0 &&
          result.dBitMismatchCount === 0 &&
          result.attachTickMismatchCount === 0 &&
          result.attachedCount.app === result.attachedCount.oracle &&
          result.boundarySize.app === result.boundarySize.oracle &&
          result.farFieldMeanExact;
        return result;
      },
      { ...fixture },
    );

    // ── 2b. CPU lane of the dev-budget differential (fixture params at dev-plate dims) ───
    const cpuDevLane = await page.evaluate(
      async (input) => {
        const dbg = window.__vccDebug;
        const { helpers, surface } = window.__wp6;
        const cells = input.dims.nx * input.dims.ny * input.dims.nz;
        const prevCount = dbg.snapshotCount;
        dbg.applyConfig({
          preset: input.preset,
          seed: input.rngSeed,
          noiseEpsilon: input.noiseEpsilon,
          nx: input.dims.nx,
          ny: input.dims.ny,
          nz: input.dims.nz,
          domain: input.domain,
          farField: input.farField,
        });
        await helpers.waitForCpuReady(cells, prevCount, 120_000);
        // Free-run below the cap (worker batches are 16 ticks), pause, then single-step
        // exactly to the cap — the run can never overshoot 256. Wait for the run state to
        // actually arrive first (dbg.running flips on the first running snapshot), or the
        // predicate would fire before the free run begins.
        dbg.start();
        await helpers.waitFor(
          "cpu dev run state",
          () => dbg.running || dbg.tick > 0,
          60_000,
          25,
        );
        await helpers.waitFor(
          "cpu dev free-run",
          () => dbg.tick >= input.freeRunTarget || dbg.stopReason !== null || !dbg.running,
          600_000,
          100,
        );
        dbg.pause();
        await helpers.waitForSettled(60_000);
        const pausedTick = dbg.tick;
        const drive = await helpers.stepTo(input.cycleCap, 120_000);
        await helpers.waitForSettled(60_000);
        const fields = dbg.cpuSnapshotFields();
        const snap = fields.snapshot;
        let occupancySum = 0;
        for (let index = 0; index < snap.a.length; index++) {
          if (snap.a[index] !== 0) occupancySum++;
        }
        window.__wp6.data.cpuDev = {
          tick: snap.tick,
          stopReason: snap.stopReason,
          attachedCount: snap.attachedCount,
          boundarySize: snap.boundarySize,
          farFieldMean: snap.farFieldMean,
          environment: JSON.parse(JSON.stringify(snap.environment)),
          a: snap.a.slice(),
          b: snap.b.slice(),
          d: snap.d.slice(),
          attachTick: snap.attachTick.slice(),
          wall: fields.wall === null ? null : fields.wall.slice(),
          surfaceCells: surface.surfaceCellIndices(snap.a, fields.wall, input.dims),
        };
        const result = {
          dims: input.dims,
          pausedTick,
          tick: drive.tick,
          stopReason: drive.stopReason,
          attachedCount: snap.attachedCount,
          occupancySumRecomputed: occupancySum,
          boundarySize: snap.boundarySize,
          farFieldMean: snap.farFieldMean,
          surfaceCellCount: window.__wp6.data.cpuDev.surfaceCells.length,
          domainContact: snap.domainContact,
        };
        result.pass =
          pausedTick <= input.cycleCap &&
          result.tick === input.cycleCap &&
          result.stopReason === null &&
          result.occupancySumRecomputed === result.attachedCount &&
          !result.domainContact;
        return result;
      },
      {
        dims: DEV_DIMS,
        preset: fixture.preset,
        rngSeed: fixture.rngSeed,
        noiseEpsilon: fixture.noiseEpsilon,
        domain: fixture.domain,
        farField: fixture.farField,
        cycleCap: fixture.cycleCap,
        freeRunTarget: 180,
      },
    );

    // ── 5a. View-only inspection regression in CPU mode (after the lane is captured) ─────
    const inspectionCpu = await page.evaluate(() =>
      window.__wp6.helpers.inspectionRegression("cpu"),
    );

    // ── 1b. Engine switch CPU → GPU through the real selector ────────────────────────────
    const switchToGpu = await switchEngine(page, "gpu");

    // ── 2c. The budget-dims seam, observed: requesting the fixture dims in GPU mode
    //        re-inits at the FROZEN budget dims (never at 48x48x24) ───────────────────────
    const budgetSeam = await page.evaluate(
      async (input) => {
        const dbg = window.__vccDebug;
        const { helpers } = window.__wp6;
        const prevCount = dbg.snapshotCount;
        dbg.applyConfig({ nx: input.requested.nx, ny: input.requested.ny, nz: input.requested.nz });
        await helpers.waitFor(
          "gpu re-init after dims request",
          () => dbg.snapshotCount > prevCount && dbg.tick === 0,
          120_000,
          50,
        );
        const viewDims = dbg.gpuViewInfo()?.dims ?? null;
        const status = helpers.statusText();
        const result = {
          requestedDims: input.requested,
          appliedViewDims: viewDims,
          budget: dbg.gpuBudget(),
          statusNamesBudgetDims: status.includes(
            `gpu budget: ${input.budgetId} (${input.budgetDims.nx}x${input.budgetDims.ny}x${input.budgetDims.nz}`,
          ),
          seam:
            "main.ts configFromUI substitutes the selected frozen budget's dims in GPU mode; " +
            "GpuEngine.constructOp faults by name on any non-budget dims — no app path can " +
            "request 48x48x24 on the GPU engine, so the cross-engine differential runs at " +
            "the dev-plate budget dims with the fixture's exact parameters",
        };
        result.pass =
          result.budget === input.budgetId &&
          viewDims !== null &&
          viewDims.nx === input.budgetDims.nx &&
          viewDims.ny === input.budgetDims.ny &&
          viewDims.nz === input.budgetDims.nz &&
          result.statusNamesBudgetDims;
        return result;
      },
      { requested: fixture.dims, budgetId: DEV_BUDGET_ID, budgetDims: DEV_DIMS },
    );

    // ── 2d. GPU lane of the dev-budget differential: step to the cap ─────────────────────
    const gpuDevDrive = await page.evaluate(
      async (input) => {
        const dbg = window.__vccDebug;
        const { helpers } = window.__wp6;
        const drive = await helpers.stepTo(input.cycleCap, 120_000);
        await helpers.waitForSettled(60_000);
        const status = helpers.statusText();
        const boundaryMatch = /boundary (\d+)/.exec(status);
        return {
          tick: drive.tick,
          stopReason: drive.stopReason,
          attachedCount: dbg.attached,
          statusBoundarySize: boundaryMatch === null ? null : Number(boundaryMatch[1]),
          pass: drive.tick === input.cycleCap && drive.stopReason === null,
        };
      },
      { cycleCap: fixture.cycleCap },
    );

    // ── 3. The differential at the cap: TEST-purpose audited readbacks vs the CPU lane ───
    const differential = await page.evaluate(
      async (input) => {
        const dbg = window.__vccDebug;
        const { cpu, helpers } = window.__wp6;
        const cpuDev = window.__wp6.data.cpuDev;
        if (cpuDev === undefined) throw new Error("CPU dev-lane capture is absent");
        const readback = await dbg.gpuFieldReadback();
        if (readback === null) throw new Error("GPU field readback answered null");
        window.__wp6.data.gpuDev = readback;
        const cells = cpuDev.a.length;

        // Constructor-only oracle at the dev dims: the expected wall mask and far-field
        // cell set for topology verification (no stepping — construction is deterministic).
        const seedOracle = new cpu.GGSolver({
          dims: input.dims,
          params: helpers.clonedPresetParams(input.preset, input.phi),
          rngSeed: input.rngSeed,
          noiseEpsilon: input.noiseEpsilon,
          domain: input.domain,
          farField: input.farField,
        });
        const expectedFarFieldMask = new Uint8Array(cells);
        for (const cell of seedOracle.farFieldCells) expectedFarFieldMask[cell] = 1;
        let topologyMismatchCount = 0;
        let gpuFarFieldCellCount = 0;
        for (let index = 0; index < cells; index++) {
          const gpuBit = (readback.topology[index] & input.farFieldBit) !== 0 ? 1 : 0;
          if (gpuBit === 1) gpuFarFieldCellCount++;
          if (gpuBit !== expectedFarFieldMask[index]) topologyMismatchCount++;
        }
        let gpuOccupancySum = 0;
        for (let index = 0; index < cells; index++) {
          if (readback.occupancy[index] !== 0) gpuOccupancySum++;
        }
        const farFieldCells = Array.from(seedOracle.farFieldCells);
        const cpuShellMean = helpers.shellMeanOf(cpuDev.d, cpuDev.a, farFieldCells);
        const gpuShellMean = helpers.shellMeanOf(
          readback.vapor,
          readback.occupancy,
          farFieldCells,
        );
        const result = {
          tick: { cpu: cpuDev.tick, gpu: readback.tick },
          stopReason: { cpu: cpuDev.stopReason, gpu: dbg.stopReason },
          attachedCount: {
            cpu: cpuDev.attachedCount,
            gpu: dbg.attached,
            gpuOccupancySumRecomputed: gpuOccupancySum,
          },
          boundarySize: { cpu: cpuDev.boundarySize, gpu: input.gpuStatusBoundarySize },
          occupancyMismatchCount: helpers.occupancyMismatch(cpuDev.a, readback.occupancy),
          wallMismatchCount: helpers.exactMismatch(cpuDev.wall, readback.wall),
          wallVsConstructorOracleMismatchCount: helpers.exactMismatch(
            seedOracle.wall,
            cpuDev.wall,
          ),
          topologyMismatchCount,
          gpuFarFieldCellCount,
          expectedFarFieldCellCount: farFieldCells.length,
          attachTickMismatchCount: helpers.exactMismatch(
            cpuDev.attachTick,
            readback.attachTick,
          ),
          boundaryMass: helpers.fieldComparison(
            cpuDev.b,
            readback.boundaryMass,
            input.tolerances.ggBoundaryMass,
          ),
          vapor: helpers.fieldComparison(cpuDev.d, readback.vapor, input.tolerances.ggVapor),
          shellMean: {
            cpu: cpuShellMean,
            gpu: gpuShellMean,
            cpuEngineReported: cpuDev.farFieldMean,
            difference: Math.abs(gpuShellMean - cpuShellMean),
            bound: input.fieldDerivedMetricMaxAbs,
          },
        };
        result.pass =
          result.tick.cpu === input.cycleCap &&
          result.tick.gpu === input.cycleCap &&
          result.stopReason.cpu === result.stopReason.gpu &&
          result.attachedCount.cpu === result.attachedCount.gpu &&
          result.attachedCount.gpuOccupancySumRecomputed === result.attachedCount.gpu &&
          result.boundarySize.cpu === result.boundarySize.gpu &&
          result.occupancyMismatchCount === 0 &&
          result.wallMismatchCount === 0 &&
          result.wallVsConstructorOracleMismatchCount === 0 &&
          result.topologyMismatchCount === 0 &&
          result.attachTickMismatchCount === 0 &&
          result.boundaryMass.pass &&
          result.vapor.pass &&
          Number.isFinite(result.shellMean.difference) &&
          result.shellMean.difference <= result.shellMean.bound;
        return result;
      },
      {
        dims: DEV_DIMS,
        preset: fixture.preset,
        phi: fixture.phi,
        rngSeed: fixture.rngSeed,
        noiseEpsilon: fixture.noiseEpsilon,
        domain: fixture.domain,
        farField: fixture.farField,
        cycleCap: fixture.cycleCap,
        farFieldBit: GPU_TOPOLOGY_FAR_FIELD,
        gpuStatusBoundarySize: gpuDevDrive.statusBoundarySize,
        tolerances: {
          ggBoundaryMass: PHASE5_FIELD_TOLERANCES.ggBoundaryMass,
          ggVapor: PHASE5_FIELD_TOLERANCES.ggVapor,
        },
        fieldDerivedMetricMaxAbs: PHASE5_SCALAR_TOLERANCES.fieldDerivedMetricMaxAbs,
      },
    );

    // ── 4. Overlay parity on the SAME paused state (every overlay, <= 2/255 / channel) ───
    const overlayParity = await page.evaluate(
      async (input) => {
        const dbg = window.__vccDebug;
        const { core, helpers, overlays, colormap } = window.__wp6;
        const cpuDev = window.__wp6.data.cpuDev;
        const dims = input.dims;
        const surfaceSet = new Set(cpuDev.surfaceCells);
        const context = {
          dims,
          a: cpuDev.a,
          wall: cpuDev.wall,
          b: cpuDev.b,
          d: cpuDev.d,
          attachTick: cpuDev.attachTick,
          tick: cpuDev.tick,
          // The environment's vectors are in PARAM_CONFIGS order; the app maps them to the
          // slot-indexed params vector before use (main.ts activeGGThreshBeta) — the host
          // recompute must apply the SAME mapping or growthPropensity reads wrong slots.
          ggThreshBeta: core.ggParamsFromTimelineEnvironment(cpuDev.environment).ggThreshBeta,
          recencyWindowTicks: input.recencyWindowTicks,
        };
        const baseBytes = [0x9f, 0xc4, 0xe8];
        const noDataBytes = input.noDataSrgb.map((c) => Math.round(c * 255));
        const perOverlay = [];
        for (const spec of input.specs) {
          if (!dbg.setOverlay(spec.name)) {
            throw new Error(`overlay selection refused: ${spec.name}`);
          }
          const range =
            spec.range === "rho" ? [0, cpuDev.environment.rho] : spec.range;
          if (range !== null) dbg.setOverlayRange(range[0], range[1]);
          await helpers.sleep(80);
          const sample = await dbg.gpuViewSample(input.sampleEntries);
          if (sample === null) throw new Error(`gpuViewSample answered null: ${spec.name}`);
          const cellsSampled = Uint32Array.from(sample.cells);
          const values =
            spec.name === "none"
              ? null
              : overlays.overlayValuesFor(spec.name, context, cellsSampled);
          let maxChannelDelta = 0;
          let overTolerance = 0;
          let definedCount = 0;
          let noDataCount = 0;
          let membershipViolations = 0;
          let opacityViolations = 0;
          const seen = new Set();
          let duplicateCells = 0;
          for (let n = 0; n < cellsSampled.length; n++) {
            const cell = cellsSampled[n];
            if (!surfaceSet.has(cell)) membershipViolations++;
            if (seen.has(cell)) duplicateCells++;
            seen.add(cell);
            let expected;
            if (values === null) {
              expected = baseBytes;
            } else {
              const value = values[n];
              if (Number.isNaN(value)) {
                expected = noDataBytes;
                noDataCount++;
              } else {
                definedCount++;
                const rgb = colormap.viridis(
                  colormap.normalizeToUnit(value, range[0], range[1]),
                );
                expected = rgb.map((c) =>
                  Math.round(Math.min(Math.max(c, 0), 1) * 255),
                );
              }
            }
            const packed = sample.colorsPacked[n];
            const observed = [
              packed & 0xff,
              (packed >>> 8) & 0xff,
              (packed >>> 16) & 0xff,
            ];
            const opacityByte = (packed >>> 24) & 0xff;
            if (opacityByte !== 255) opacityViolations++;
            let entryDelta = 0;
            for (let channel = 0; channel < 3; channel++) {
              entryDelta = Math.max(
                entryDelta,
                Math.abs(observed[channel] - expected[channel]),
              );
            }
            maxChannelDelta = Math.max(maxChannelDelta, entryDelta);
            if (entryDelta > input.channelTolerance) overTolerance++;
          }
          const entry = {
            overlay: spec.name,
            range,
            sampleTick: sample.tick,
            instanceCount: sample.instanceCount,
            hostSurfaceCount: cpuDev.surfaceCells.length,
            entriesCompared: cellsSampled.length,
            definedCount,
            noDataCount,
            maxChannelDelta,
            entriesOverTolerance: overTolerance,
            membershipViolations,
            duplicateCells,
            opacityViolations,
          };
          entry.pass =
            entry.sampleTick === input.cycleCap &&
            entry.instanceCount === entry.hostSurfaceCount &&
            entry.entriesCompared > 0 &&
            entry.entriesOverTolerance === 0 &&
            entry.membershipViolations === 0 &&
            entry.duplicateCells === 0 &&
            entry.opacityViolations === 0;
          perOverlay.push(entry);
        }
        return {
          channelTolerance: input.channelTolerance,
          recencyWindowTicks: input.recencyWindowTicks,
          perOverlay,
          pass: perOverlay.every((entry) => entry.pass),
        };
      },
      {
        dims: DEV_DIMS,
        cycleCap: fixture.cycleCap,
        sampleEntries: 1024,
        channelTolerance: OVERLAY_CHANNEL_TOLERANCE,
        recencyWindowTicks: 600,
        noDataSrgb: [0.42, 0.4, 0.45],
        specs: [
          { name: "none", range: null },
          { name: "vaporAvailability", range: "rho" },
          { name: "growthPropensity", range: [0, 1] },
          { name: "boundaryMass", range: [0, 2.5] },
          { name: "growthRecency", range: [0, 1] },
        ],
      },
    );

    // ── 4b. Named-probe pick readout on the paused GPU state (S4 picking floor) ──────────
    const pickProbe = await page.evaluate(async () => {
      const dbg = window.__vccDebug;
      const { helpers } = window.__wp6;
      const cpuDev = window.__wp6.data.cpuDev;
      dbg.setOverlay("boundaryMass");
      const cell = cpuDev.surfaceCells[0];
      const plane = 128 * 128;
      const k = Math.floor(cell / plane);
      const remainder = cell - k * plane;
      const j = Math.floor(remainder / 128);
      const i = remainder - j * 128;
      const accepted = dbg.pickCell(i, j, k);
      await helpers.waitFor(
        "gpu pick readout",
        () => helpers.readoutText().includes("audited named probes"),
        30_000,
        50,
      );
      const text = helpers.readoutText();
      const bMatch = /b = ([-\d.]+)/.exec(text);
      const dMatch = /d = ([-\d.]+)/.exec(text);
      const bPrinted = bMatch === null ? null : Number(bMatch[1]);
      const dPrinted = dMatch === null ? null : Number(dMatch[1]);
      const result = {
        cell: { i, j, k },
        accepted,
        bPrinted,
        bCpu: cpuDev.b[cell],
        dPrinted,
        dCpu: cpuDev.d[cell],
        provenanceLinePresent: text.includes(
          "float32 GPU-resident state via audited named probes",
        ),
      };
      result.pass =
        accepted &&
        result.provenanceLinePresent &&
        bPrinted !== null &&
        dPrinted !== null &&
        Math.abs(bPrinted - result.bCpu) <= 5e-4 &&
        Math.abs(dPrinted - result.dCpu) <= 5e-4;
      return result;
    });

    // ── 5b. View-only inspection regression in GPU mode (after all state captures) ───────
    const inspectionGpu = await page.evaluate(() =>
      window.__wp6.helpers.inspectionRegression("gpu"),
    );

    // ── 7. Residency + audit + controller + device observations ──────────────────────────
    const auditFacts = await page.evaluate(() => {
      const dbg = window.__vccDebug;
      const audit = dbg.gpuAuditSummary();
      const controllers = dbg.gpuSubmissionRecords();
      const device = dbg.gpuDeviceStatus();
      const wallSorted = controllers.solver
        .map((record) => record.wallMs)
        .sort((left, right) => left - right);
      const p99Index = Math.max(0, Math.ceil(wallSorted.length * 0.99) - 1);
      return {
        audit,
        solverSubmissionCount: controllers.solver.length,
        editSubmissionCount: controllers.edit.length,
        solverGeneration: controllers.solverGeneration,
        editGeneration: controllers.editGeneration,
        pendingEnvironmentEdits: controllers.pendingEnvironmentEdits,
        maxSolverSubmissionWallMs: wallSorted.length === 0 ? null : wallSorted.at(-1),
        p99SolverSubmissionWallMs: wallSorted.length === 0 ? null : wallSorted[p99Index],
        uncapturedErrors: [...(device?.uncapturedErrors ?? [])],
        deviceLossRecords: [...(device?.deviceLossRecords ?? [])],
        appErrors: [...dbg.errors],
      };
    });
    const auditCheck = {
      ...auditFacts,
      pass:
        auditFacts.audit !== null &&
        auditFacts.audit.fullFieldDisplayFrameReadCount === 0 &&
        auditFacts.audit.byPurpose.test === 6 &&
        auditFacts.uncapturedErrors.length === 0 &&
        auditFacts.deviceLossRecords.length === 0 &&
        auditFacts.appErrors.length === 0 &&
        auditFacts.pendingEnvironmentEdits === 0,
    };

    // ── 6. Fallback honesty: exact status lines for ?engine=cpu and ?webgl2=1 ────────────
    async function fallbackCase(query, exactLine, expectations) {
      const sink = { consoleErrors: [], pageErrors: [] };
      const fallbackPage = await browser.newPage();
      fallbackPage.setDefaultTimeout(120_000);
      attachPageObservers(fallbackPage, sink);
      await fallbackPage.goto(`${origin}/?${query}`, { waitUntil: "load" });
      await waitForBoot(fallbackPage, 120_000);
      const facts = await fallbackPage.evaluate(() => {
        const dbg = window.__vccDebug;
        const device = dbg.gpuDeviceStatus();
        return {
          engine: dbg.engine(),
          backend: dbg.backend,
          deviceState: device?.state ?? null,
          fallbackReason: device?.reason ?? null,
          statusLineReported: device?.statusLine ?? null,
          statusText: document.getElementById("status")?.textContent ?? "",
        };
      });
      await fallbackPage.close();
      const result = {
        query,
        expectedExactLine: exactLine,
        engine: facts.engine,
        backend: facts.backend,
        deviceState: facts.deviceState,
        fallbackReason: facts.fallbackReason,
        statusLineReported: facts.statusLineReported,
        exactLineInStatusPanel: facts.statusText.includes(exactLine),
        statusLineReportedExact: facts.statusLineReported === exactLine,
        cpuWorkerLinePresent: facts.statusText.includes(
          "GGThreshold oracle in a Web Worker",
        ),
        consoleErrors: sink.consoleErrors,
        blockingConsoleErrorCount: blockingConsoleErrors(sink.consoleErrors).length,
        pageErrorCount: sink.pageErrors.length,
      };
      result.pass =
        result.engine === "cpu" &&
        result.deviceState === "fallback" &&
        result.fallbackReason === expectations.reason &&
        result.exactLineInStatusPanel &&
        result.statusLineReportedExact &&
        result.cpuWorkerLinePresent &&
        expectations.backend(result.backend) &&
        result.blockingConsoleErrorCount === 0 &&
        result.pageErrorCount === 0;
      return result;
    }
    const fallbackEngineCpu = await fallbackCase(
      "engine=cpu",
      "gpu: not requested (?engine=cpu pins the CPU engine) — solver: CPU worker",
      { reason: "forced-cpu-engine", backend: () => true },
    );
    const fallbackWebgl2 = await fallbackCase(
      "webgl2=1",
      "gpu: not requested (?webgl2=1 forces the WebGL2 rendering fallback) — solver: CPU worker",
      { reason: "forced-webgl2", backend: (name) => name === "WebGL2" },
    );

    // ── Report ───────────────────────────────────────────────────────────────────────────
    const repository = {
      commit: git("rev-parse", "HEAD"),
      clean: git("status", "--porcelain").length === 0,
    };
    const browserVersion = await (
      await browser.newBrowserCDPSession()
    ).send("Browser.getVersion");
    const protocolManifest = phase5ProtocolManifest();
    const protocolSha256 = canonicalJsonSha256(protocolManifest);
    const host = {
      platform: process.platform,
      release: os.release(),
      architecture: os.arch(),
      cpu: os.cpus()[0]?.model.trim() ?? "unknown",
      logicalProcessors: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
    };
    const protocolProvenancePass =
      PHASE5_PROTOCOL === "phase5-gpu-conformance-windows-v6" &&
      PHASE5_PROTOCOL_SHA256 ===
        "5ef6d11bab19e722379b3ba0c6a39bddc619cb22e21ed672478f0530a19ad115" &&
      protocolSha256 === PHASE5_PROTOCOL_SHA256;
    const runtimeProvenancePass =
      PHASE5_HEADLESS_RUNTIME === "playwright-bundled-chromium" &&
      PHASE5_HEADLESS_RUNTIME_VERSION ===
        `playwright-${expectedRuntime.playwrightVersion}/chromium-${expectedRuntime.chromiumRevision}` &&
      playwrightPackage.version === expectedRuntime.playwrightVersion &&
      browserPath
        .toLowerCase()
        .includes(`\\chromium-${expectedRuntime.chromiumRevision}\\`) &&
      browserVersion.product === expectedRuntime.product &&
      browserVersion.revision === expectedRuntime.revision &&
      JSON.stringify(launchFlags) ===
        JSON.stringify([
          "--enable-unsafe-webgpu",
          "--enable-webgpu-developer-features",
        ]);
    const hostProvenancePass =
      host.platform === expectedHost.platform && host.cpu === expectedHost.cpu;
    const adapterProvenancePass =
      adapterFacts !== null &&
      Object.entries(expectedAdapter).every(
        ([name, expected]) => adapterFacts[name] === expected,
      ) &&
      String(adapterFacts.backend).toLowerCase() ===
        PHASE5_EXPECTED_WINDOWS_BACKEND.toLowerCase();
    const consoleObservations = {
      mainPageConsoleErrors: mainSink.consoleErrors,
      mainPageBlockingConsoleErrorCount: blockingConsoleErrors(mainSink.consoleErrors).length,
      mainPagePageErrors: mainSink.pageErrors,
      pass:
        blockingConsoleErrors(mainSink.consoleErrors).length === 0 &&
        mainSink.pageErrors.length === 0,
    };
    const checks = {
      boot: bootCheck,
      engineSwitch: {
        gpuToCpu: switchToCpu,
        cpuToGpu: switchToGpu,
        pass: switchToCpu.pass && switchToGpu.pass,
      },
      fixtureCpu,
      cpuDevLane,
      inspection: {
        cpu: inspectionCpu,
        gpu: inspectionGpu,
        pass: inspectionCpu.pass && inspectionGpu.pass,
      },
      budgetSeam,
      gpuDevDrive,
      differential,
      overlayParity,
      pickProbe,
      audit: auditCheck,
      fallback: {
        engineCpu: fallbackEngineCpu,
        webgl2: fallbackWebgl2,
        pass: fallbackEngineCpu.pass && fallbackWebgl2.pass,
      },
      console: consoleObservations,
    };
    const observedChecksPass =
      checks.boot.pass &&
      checks.engineSwitch.pass &&
      checks.fixtureCpu.pass &&
      checks.cpuDevLane.pass &&
      checks.inspection.pass &&
      checks.budgetSeam.pass &&
      checks.gpuDevDrive.pass &&
      checks.differential.pass &&
      checks.overlayParity.pass &&
      checks.pickProbe.pass &&
      checks.audit.pass &&
      checks.fallback.pass &&
      checks.console.pass;
    const report = {
      schema: "phase5-wp6-app-differential-v1",
      protocol: PHASE5_PROTOCOL,
      protocolSha256: {
        expected: PHASE5_PROTOCOL_SHA256,
        actual: protocolSha256,
        pass: protocolProvenancePass,
      },
      lane: "windows-d3d12",
      fixture: { id: fixture.id, cycleCap: fixture.cycleCap, dims: fixture.dims },
      devBudget: { id: DEV_BUDGET_ID, dims: DEV_DIMS },
      fieldTolerances: {
        ggBoundaryMass: PHASE5_FIELD_TOLERANCES.ggBoundaryMass,
        ggVapor: PHASE5_FIELD_TOLERANCES.ggVapor,
      },
      pass:
        repository.clean &&
        protocolProvenancePass &&
        runtimeProvenancePass &&
        hostProvenancePass &&
        adapterProvenancePass &&
        observedChecksPass,
      observedChecksPass,
      repository,
      host: {
        ...host,
        expected: expectedHost,
        provenancePass: hostProvenancePass,
      },
      runtime: {
        name: PHASE5_HEADLESS_RUNTIME,
        frozenVersion: PHASE5_HEADLESS_RUNTIME_VERSION,
        actualPlaywrightVersion: playwrightPackage.version,
        product: browserVersion.product,
        revision: browserVersion.revision,
        executablePath: browserPath,
        launchFlags,
        expected: expectedRuntime,
        provenancePass: runtimeProvenancePass,
      },
      adapter: {
        expectedBackend: PHASE5_EXPECTED_WINDOWS_BACKEND,
        expected: expectedAdapter,
        observed: adapterFacts,
        provenancePass: adapterProvenancePass,
      },
      checks,
    };
    console.log(JSON.stringify(report, null, 2));
    if (!report.pass) process.exitCode = 1;
  } finally {
    if (browser !== null) await browser.close();
    await vite.close();
  }
}

await main();
