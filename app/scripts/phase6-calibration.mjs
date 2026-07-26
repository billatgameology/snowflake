#!/usr/bin/env node
// Phase 6 WP0 GPU calibration probe.
//
// ── WHAT THIS IS, AND WHAT IT IS NOT ────────────────────────────────────────────────────────
//
// This is COORDINATOR-ONLY CALIBRATION. It is explicitly NOT gate evidence, NOT a Phase 5
// conformance lane, and NOT a registered protocol. It exists to answer exactly two questions
// that block the Phase 6 WP0 measurement-size and grid freeze:
//
//   (a) at what measurement extent does the habit metric (`aspectRatio`) stop being degenerate?
//   (b) what does one GPU run cost in wall seconds, so a grid size can be computed?
//
// CPU calibration established that at extent ~17 the habit metric returned 0.740 from five
// physically different runs, while Phase 2b at extent 61 separated 0.118644 (plate, -15 C)
// from 12.2 (column, -5 C). The resolving size sits somewhere between. CPU cost (191-289 s at
// 48^3 / extent 17, two points unfinished in 300 s) cannot reach a resolving size across a
// grid, so the ladder has to be measured on the GPU.
//
// Nothing here writes to `out/`. Nothing here modifies solver, core, or runner source. The
// report goes to stdout as JSON; progress goes to stderr.
//
// ── HOW IT WORKS ────────────────────────────────────────────────────────────────────────────
//
//   * Vite serves the repository root (the pattern `app/scripts/phase5-wp4.mjs` uses to drive
//     `GpuLkSolver` headlessly). The application UI is not needed and is not booted.
//   * The PINNED Chromium is launched by explicit `executablePath` with the WebGPU flags. A
//     default launch resolves a different browser whose headless WebGPU returns no adapter.
//   * Inside the page the probe imports `@vcc/core`, `@vcc/solver-cpu` and `@vcc/solver-gpu`
//     and drives `GpuLkSolver` directly.
//   * Per run, a float64 `LKSolver` is constructed ONLY to build the initial state (hexPrism
//     wall mask, Dirichlet shell, the canonical 19-site radius-2 seed, the initial field). No
//     CPU stepping happens; the physics is mirrored from `runner/src/main.ts`'s `grow-lk`
//     defaults rather than re-derived here.
//   * The stepping loop mirrors `growLK`'s stopping rules in the same order: unconverged,
//     stalled, domain-contact, size-target, step-cap. A wall-budget stop is added on top so a
//     runaway point is recorded as over-budget instead of hanging.
//   * Extent tracking uses the solver's own `largestExtent()` (the exact mirror of the CPU
//     runner's trigger). Every `--check-every` steps the probe additionally reads occupancy
//     back through `exportConversionSnapshot` -- an explicit evidence-snapshot readback, not a
//     display frame -- and recomputes the extent with `@vcc/core`'s `latticeExtents`, so the
//     GPU-tracked bounds are cross-checked against the shared metric rather than trusted.
//   * Final metrics come from `@vcc/core`'s own `latticeExtents`, `aspectRatio`,
//     `domainContact` and `symmetryError` applied to the read-back occupancy. Nothing is
//     reimplemented.
//   * Readback time is metered separately, so the reported per-run solver cost is not inflated
//     by the probe's own cross-check reads.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import process from "node:process";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer as createViteServer } from "vite";
import {
  PHASE5_REQUIRED_FEATURES,
  PHASE5_REQUIRED_LIMITS,
} from "../../runner/src/phase5-protocol.ts";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const require = createRequire(import.meta.url);
const playwrightPackage = require("playwright/package.json");
const PAGE_PATH = "/phase6-calibration";
const LAUNCH_FLAGS = ["--enable-unsafe-webgpu", "--enable-webgpu-developer-features"];

/**
 * The `grow-lk` defaults mirrored from `runner/src/main.ts` `parseLKArgs` + `growLK`.
 * Every field here is a copy of a runner default, NOT an independent choice. `center` is
 * `domainCenter(dims)`, applied per run because it depends on the domain.
 */
const MIRRORED_PHYSICS = {
  surfacePolicy: "aggregate-hv-g1h1-v5",
  dxUm: 0.35,
  pressurePa: 101_325,
  paramSet: "CAK_A1",
  cflFill: 0.1,
  relaxTol: 1e-9,
  divTol: 1e-7,
  relaxMaxSweeps: 200_000,
  rngSeed: 1,
  noiseEpsilon: 0,
  domain: "hexPrism",
  farField: "dirichlet",
  seedRadius: 2,
  seedThickness: 1,
};

const DEFAULTS = {
  targetExtents: [16, 24, 32, 48, 61],
  tempC: -15,
  sigmaInf: 0.0785,
  confirmTempC: -5,
  confirmSigmaInf: 0.025,
  budgetSeconds: 1200,
  stepCap: 100_000,
  checkEvery: 50,
  confirmExtent: null,
  skipConfirmation: false,
  // Mirrors the runner default. Overridable ONLY so a diagnostic can bound the cost of a
  // refusing elliptic solve; any value other than 200000 is flagged in the report.
  relaxMaxSweeps: MIRRORED_PHYSICS.relaxMaxSweeps,
  // Mirrors the runner default (its own `--div-tol` control). The GPU float32 path cannot
  // reach 1e-7 for sustained runs; overriding this makes a run a LABELLED DIAGNOSTIC whose
  // numbers are NOT comparable to any float64 result, and the report says so by name.
  divTol: MIRRORED_PHYSICS.divTol,
};

/**
 * Domain for a target extent: the smallest multiple of 4 that keeps the target strictly under
 * the 65% domain-contact guard (`core/src/metrics.ts` DOMAIN_CONTACT_FRACTION). At target 61
 * this lands on 96^3, the Phase 2b domain, so the largest rung is directly comparable to the
 * published 0.118644 / 12.2 pair.
 */
function dimsForTarget(target) {
  let n = Math.ceil(target / 0.65);
  if (n % 4 !== 0) n += 4 - (n % 4);
  return { nx: n, ny: n, nz: n };
}

function git(...args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function note(line) {
  process.stderr.write(`${line}\n`);
}

function parseArgs(argv) {
  const options = { ...DEFAULTS, dimsOverride: new Map() };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => {
      const raw = argv[++i];
      if (raw === undefined) throw new Error(`missing value for ${flag}`);
      return raw;
    };
    switch (flag) {
      case "--target-extents": {
        const parts = value().split(",").map(Number);
        if (parts.length === 0 || parts.some((p) => !Number.isInteger(p) || p < 3)) {
          throw new Error("--target-extents wants a comma list of integers >= 3");
        }
        options.targetExtents = parts;
        break;
      }
      case "--temp-c":
        options.tempC = Number(value());
        break;
      case "--sigma-inf":
        options.sigmaInf = Number(value());
        break;
      case "--confirm-temp-c":
        options.confirmTempC = Number(value());
        break;
      case "--confirm-sigma-inf":
        options.confirmSigmaInf = Number(value());
        break;
      case "--confirm-extent":
        options.confirmExtent = Number(value());
        break;
      case "--skip-confirmation":
        options.skipConfirmation = true;
        break;
      case "--budget-seconds":
        options.budgetSeconds = Number(value());
        break;
      case "--step-cap":
        options.stepCap = Number(value());
        break;
      case "--check-every":
        options.checkEvery = Number(value());
        break;
      case "--relax-max-sweeps":
        options.relaxMaxSweeps = Number(value());
        break;
      case "--div-tol":
        options.divTol = Number(value());
        break;
      case "--dims": {
        // "extent:n,extent:n" — override the derived domain for named rungs.
        for (const entry of value().split(",")) {
          const [target, n] = entry.split(":").map(Number);
          if (!Number.isInteger(target) || !Number.isInteger(n) || n < 8) {
            throw new Error(`--dims wants extent:n pairs with n >= 8, got "${entry}"`);
          }
          options.dimsOverride.set(target, { nx: n, ny: n, nz: n });
        }
        break;
      }
      default:
        throw new Error(`unknown flag: ${flag}`);
    }
  }
  for (const [name, bound] of [
    ["budgetSeconds", options.budgetSeconds],
    ["stepCap", options.stepCap],
    ["relax-max-sweeps", options.relaxMaxSweeps],
  ]) {
    if (!Number.isFinite(bound) || bound <= 0) {
      throw new Error(`--${name} must be finite and positive`);
    }
  }
  if (!Number.isFinite(options.checkEvery) || options.checkEvery < 0) {
    throw new Error("--check-every must be finite and >= 0");
  }
  return options;
}

// ── In-page probe ───────────────────────────────────────────────────────────────────────────

/**
 * Acquires ONE device for the whole ladder against the frozen Phase 5 features/limits, and
 * caches the three module namespaces on `window`. Adapter/device request counting is installed
 * before anything acquires, so a silent re-acquisition would be observed rather than assumed.
 */
async function installProbe(input) {
  if (!isSecureContext) throw new Error("the calibration probe requires a secure context");
  if (navigator.gpu === undefined) throw new Error("navigator.gpu is unavailable");
  const acquisitions = { adapter: 0, device: 0 };
  const nativeRequestAdapter = navigator.gpu.requestAdapter.bind(navigator.gpu);
  navigator.gpu.requestAdapter = function requestAdapter(options) {
    acquisitions.adapter++;
    return nativeRequestAdapter(options);
  };
  const nativeRequestDevice = GPUAdapter.prototype.requestDevice;
  GPUAdapter.prototype.requestDevice = function requestDevice(descriptor) {
    acquisitions.device++;
    return nativeRequestDevice.call(this, descriptor);
  };
  const [core, cpu, gpu] = await Promise.all([
    import(input.coreModuleUrl),
    import(input.cpuModuleUrl),
    import(input.gpuModuleUrl),
  ]);
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
  if (adapter === null) throw new Error("WebGPU returned no adapter");
  const requirements = {
    requiredFeatures: input.requiredFeatures,
    requiredLimits: input.requiredLimits,
  };
  const device = await gpu.requestCheckedGpuDevice(
    adapter,
    requirements,
    requirements,
    "vcc-phase6-calibration-device",
  );
  const uncapturedErrors = [];
  device.addEventListener("uncapturederror", (event) => {
    uncapturedErrors.push(event.error.message);
  });
  const deviceLossRecords = [];
  void device.lost.then((info) => {
    deviceLossRecords.push({ reason: String(info.reason), message: String(info.message) });
  });
  window.__vccPhase6 = {
    core,
    cpu,
    gpu,
    device,
    submissions: new gpu.GpuSubmissionController(device),
    audit: new gpu.GpuReadbackAudit(),
    generation: 0,
    acquisitions,
    uncapturedErrors,
    deviceLossRecords,
  };
  return {
    adapter: {
      vendor: adapter.info.vendor,
      architecture: adapter.info.architecture,
      device: adapter.info.device,
      description: adapter.info.description,
      backend: adapter.info.backend,
      type: adapter.info.type,
      driver: adapter.info.driver,
    },
    features: [...device.features].sort(),
    limits: Object.fromEntries(
      Object.keys(input.requiredLimits).map((name) => [name, Number(device.limits[name])]),
    ),
  };
}

/**
 * One calibration run. Mirrors `runner/src/main.ts` `growLK`: same constructor arguments, same
 * stopping rules in the same order, plus a wall budget.
 */
async function runCalibration(spec) {
  const probe = window.__vccPhase6;
  const { core, cpu, gpu } = probe;
  const dims = spec.dims;
  const center = core.domainCenter(dims);

  // Initial state only. This oracle is never stepped; it is the shared, already-reviewed
  // constructor for the hexPrism wall mask, the Dirichlet shell, and the canonical seed.
  const oracle = new cpu.LKSolver({
    surfacePolicy: spec.physics.surfacePolicy,
    dims,
    tempC: spec.tempC,
    sigmaInfinity: spec.sigmaInf,
    dxUm: spec.physics.dxUm,
    pressurePa: spec.physics.pressurePa,
    paramSet: spec.physics.paramSet,
    cflFill: spec.physics.cflFill,
    relaxTol: spec.physics.relaxTol,
    divTol: spec.divTol,
    relaxMaxSweeps: spec.relaxMaxSweeps,
    rngSeed: spec.physics.rngSeed,
    noiseEpsilon: spec.physics.noiseEpsilon,
    domain: spec.physics.domain,
    farField: spec.physics.farField,
    seedRadius: spec.physics.seedRadius,
    seedThickness: spec.physics.seedThickness,
    center,
  });

  const topology = new Uint32Array(oracle.a.length);
  if (oracle.farField === "dirichlet") {
    for (const index of oracle.dirichletCells) {
      topology[index] |= gpu.GPU_LK_TOPOLOGY_FAR_FIELD;
    }
  }
  for (const index of oracle.boundaryCells()) {
    topology[index] |= gpu.GPU_LK_TOPOLOGY_BOUNDARY;
  }
  const solverInput = {
    surfacePolicy: spec.physics.surfacePolicy,
    initialSigma: Float32Array.from(oracle.sigma, Math.fround),
    initialFill: Float32Array.from(oracle.f, Math.fround),
    occupancy: Uint32Array.from(oracle.a),
    wall: Uint32Array.from(oracle.wall),
    topology,
    initialBoundaryIndices: Uint32Array.from(oracle.boundaryCells()),
    tempC: oracle.tempC,
    sigmaInfinity: oracle.sigmaInfinity,
    dxUm: oracle.dxM * 1e6,
    pressurePa: oracle.pressurePa,
    paramSet: oracle.paramSet,
    cflFill: oracle.cflFill,
    relaxTol: oracle.relaxTol,
    divTol: oracle.divTol,
    relaxMaxSweeps: oracle.relaxMaxSweeps,
    rngSeed: oracle.rngSeed,
    noiseEpsilon: oracle.noiseEpsilon,
    tick: oracle.tick,
    simTimeSeconds: oracle.simTimeSeconds,
    farField: oracle.farField,
    domain: oracle.domain,
    center: oracle.center,
    fillLedgerIceCells: 0,
    closedPlacedFillVaporUnits: 0,
    currentTemperatureSegmentStartFillIceCells: 0,
    kineticDemand: 0,
    saturationClippedFill: 0,
    holeFillDeficit: 0,
    holeFillCountTotal: 0,
    lastMaxFillVelocityMS: 0,
  };

  const occupancyToLattice = (occupancy) =>
    Uint8Array.from(occupancy, (value) => (value === 0 ? 0 : 1));

  probe.generation += 1;
  probe.submissions.acknowledgeEdit(probe.generation);
  const arena = gpu.GpuBufferArena.create(
    probe.device,
    probe.generation,
    gpu.createGpuBufferPlan(dims, "lk"),
  );
  let solver = null;
  const constructionStartedMs = performance.now();
  try {
    solver = await gpu.GpuLkSolver.create(
      probe.device,
      probe.submissions,
      arena,
      probe.audit,
      solverInput,
    );
    const constructionMs = performance.now() - constructionStartedMs;
    const seedSites = solver.attachedCount();

    let stopReason = "step-cap";
    let steps = 0;
    let allConverged = true;
    let worstDivergence = 0;
    let minShellInjection = Infinity;
    let minSurfaceExchange = Infinity;
    let maxKineticFillIncrement = 0;
    let holeFillCount = 0;
    let totalSweeps = 0;
    let maxRelaxationSweeps = 0;
    let sweepCapHits = 0;
    let readbackMs = 0;
    let crossChecks = 0;
    let crossCheckDisagreements = 0;
    let failedRelaxation = null;
    const convergenceModes = { "fixed-point": 0, "bounded-two-cycle": 0, incomplete: 0 };
    const startedMs = performance.now();

    for (let t = 1; t <= spec.stepCap; t++) {
      const { relaxation, surface } = await solver.step(`${spec.id}:step-${t}`);
      steps = t;
      convergenceModes[relaxation.convergenceMode] += 1;
      totalSweeps += relaxation.sweeps;
      if (relaxation.sweeps > maxRelaxationSweeps) maxRelaxationSweeps = relaxation.sweeps;
      if (relaxation.sweeps >= spec.relaxMaxSweeps) sweepCapHits += 1;
      if (!relaxation.converged) {
        allConverged = false;
        stopReason = "unconverged";
        // The whole diagnostic surface of the refusing solve. Without this an unconverged
        // stop is unattributable, and the difference between "needs more sweeps" and "the
        // float32 divergence identity cannot reach divTol" is invisible.
        failedRelaxation = {
          step: t,
          sweeps: relaxation.sweeps,
          hitSweepCap: relaxation.sweeps >= spec.relaxMaxSweeps,
          convergenceMode: relaxation.convergenceMode,
          residual: relaxation.residual,
          relaxTol: spec.physics.relaxTol,
          residualUnderTol: relaxation.residual < spec.physics.relaxTol,
          divergenceResidual: relaxation.divergenceResidual,
          divergenceStatus: relaxation.divergenceStatus,
          divTol: spec.divTol,
          divergenceUnderTol:
            relaxation.divergenceResidual !== null &&
            relaxation.divergenceResidual < spec.divTol,
          previousDivergenceResidual: relaxation.previousDivergenceResidual,
          previousDivergenceStatus: relaxation.previousDivergenceStatus,
          maximumCurrentStepUlpDistance: relaxation.maximumCurrentStepUlpDistance,
          maximumTwoBackUlpDistance: relaxation.maximumTwoBackUlpDistance,
          completedSweepsAfterMutation: relaxation.completedSweepsAfterMutation,
          shellClampDiagnostic: relaxation.shellClampDiagnostic,
          surfaceExchangeDiagnostic: relaxation.surfaceExchangeDiagnostic,
          smootherDriftDiagnostic: relaxation.smootherDriftDiagnostic,
          minLocalSurfaceExchangeDiagnostic: relaxation.minLocalSurfaceExchangeDiagnostic,
        };
        break;
      }
      if (
        relaxation.divergenceResidual !== null &&
        relaxation.divergenceResidual > worstDivergence
      ) {
        worstDivergence = relaxation.divergenceResidual;
      }
      if (
        relaxation.shellClampDiagnostic !== null &&
        relaxation.shellClampDiagnostic < minShellInjection
      ) {
        minShellInjection = relaxation.shellClampDiagnostic;
      }
      if (relaxation.surfaceExchangeDiagnostic < minSurfaceExchange) {
        minSurfaceExchange = relaxation.surfaceExchangeDiagnostic;
      }
      if (surface.maxKineticFillIncrement > maxKineticFillIncrement) {
        maxKineticFillIncrement = surface.maxKineticFillIncrement;
      }
      holeFillCount += surface.holeFillCount;
      if (surface.stalled) {
        stopReason = "stalled";
        break;
      }
      // Contact wins over the size target, exactly as `growLK` orders them: a single
      // attachment batch crossing both must not be admitted as a clean size-target stop.
      if (solver.domainContact()) {
        stopReason = "domain-contact";
        break;
      }
      if (solver.largestExtent() >= spec.targetExtent) {
        stopReason = "size-target";
        break;
      }
      if (performance.now() - startedMs > spec.budgetMs) {
        stopReason = "over-budget";
        break;
      }
      if (spec.checkEvery > 0 && t % spec.checkEvery === 0) {
        // Explicit evidence-snapshot readback (not a display frame): cross-check the
        // GPU-tracked bounds against core's own metric, and report liveness.
        const readbackStartedMs = performance.now();
        const snapshot = await solver.exportConversionSnapshot(`${spec.id}:cross-check-${t}`);
        const lattice = occupancyToLattice(snapshot.occupancy);
        const extents = core.latticeExtents(lattice, dims);
        readbackMs += performance.now() - readbackStartedMs;
        crossChecks += 1;
        const solverExtent = solver.largestExtent();
        const coreExtent = extents === null ? 0 : extents.largestExtent;
        if (coreExtent !== solverExtent) crossCheckDisagreements += 1;
        await window.vccPhase6Progress({
          id: spec.id,
          step: t,
          solverExtent,
          coreExtent,
          attachedCount: extents === null ? 0 : extents.attachedCount,
          elapsedSeconds: (performance.now() - startedMs) / 1000,
        });
      }
    }

    const loopMs = performance.now() - startedMs;
    const finalReadbackStartedMs = performance.now();
    const snapshot = await solver.exportConversionSnapshot(`${spec.id}:final`);
    const lattice = occupancyToLattice(snapshot.occupancy);
    const extents = core.latticeExtents(lattice, dims);
    const measured = {
      aspectRatio: core.aspectRatio(lattice, dims),
      symmetryError: core.symmetryError(lattice, dims, center),
      domainContact: core.domainContact(lattice, dims),
    };
    const finalReadbackMs = performance.now() - finalReadbackStartedMs;

    return {
      id: spec.id,
      role: spec.role,
      tempC: spec.tempC,
      sigmaInf: spec.sigmaInf,
      dims,
      center,
      targetExtent: spec.targetExtent,
      seedSites,
      stopReason,
      steps,
      // Metrics: every value below is `@vcc/core`'s own function applied to the read-back
      // occupancy. `zExtent` and `tExtent` are the RAW integer lattice extents, published so
      // metric degeneracy is visible rather than hidden behind the ratio.
      extent: extents === null ? 0 : extents.largestExtent,
      iExtent: extents === null ? 0 : extents.iExtent,
      jExtent: extents === null ? 0 : extents.jExtent,
      zExtent: extents === null ? 0 : extents.zExtent,
      tExtent: extents === null ? 0 : extents.tExtent,
      attachedCount: extents === null ? 0 : extents.attachedCount,
      aspectRatio: measured.aspectRatio,
      symmetryError: measured.symmetryError,
      domainContact: measured.domainContact,
      solverReportedExtent: solver.largestExtent(),
      solverReportedAttachedCount: solver.attachedCount(),
      solverReportedDomainContact: solver.domainContact(),
      simTimeSeconds: snapshot.metadata.simTimeSeconds,
      tick: snapshot.metadata.tick,
      // Cost. `wallSeconds` is the whole stepping loop; `solverWallSeconds` subtracts the
      // probe's own cross-check readbacks so a grid estimate is not inflated by them.
      wallSeconds: loopMs / 1000,
      solverWallSeconds: (loopMs - readbackMs) / 1000,
      crossCheckReadbackSeconds: readbackMs / 1000,
      finalReadbackSeconds: finalReadbackMs / 1000,
      solverConstructionSeconds: constructionMs / 1000,
      msPerStep: steps === 0 ? null : (loopMs - readbackMs) / steps,
      // Numerical liveness. Recorded so a cheap-looking rung that was actually unconverged
      // cannot be mistaken for a resolving measurement.
      allConverged,
      convergenceModes,
      worstDivergenceResidual: worstDivergence,
      minShellInjection: Number.isFinite(minShellInjection) ? minShellInjection : null,
      minSurfaceExchange: Number.isFinite(minSurfaceExchange) ? minSurfaceExchange : null,
      maxKineticFillIncrement,
      holeFillCount,
      totalRelaxationSweeps: totalSweeps,
      maxRelaxationSweeps,
      relaxMaxSweeps: spec.relaxMaxSweeps,
      divTol: spec.divTol,
      relaxationSweepCapHits: sweepCapHits,
      failedRelaxation,
      crossChecks,
      crossCheckDisagreements,
    };
  } finally {
    solver?.destroy();
    arena.destroy();
  }
}

function teardownProbe() {
  const probe = window.__vccPhase6;
  const observed = {
    adapterRequests: probe.acquisitions.adapter,
    deviceRequests: probe.acquisitions.device,
    uncapturedErrors: [...probe.uncapturedErrors],
    deviceLossRecords: [...probe.deviceLossRecords],
    unexpectedDeviceLoss: probe.submissions.unexpectedLossReason(),
    submissionCount: probe.submissions.records().length,
    readbackCount: probe.audit.records().length,
    readbackTotalBytes: probe.audit.totalBytes(),
    fullFieldDisplayFrameReadCount: probe.audit.fullFieldDisplayFrameCount(),
  };
  probe.submissions.destroy();
  return observed;
}

// ── Node-side driving ───────────────────────────────────────────────────────────────────────

/**
 * A run must never hang the probe. `budgetMs` stops the loop between interface steps; this
 * outer guard covers the case where a SINGLE step (an elliptic solve that will not converge)
 * outlives the budget. The page cannot be interrupted mid-step, so a hard timeout ends the
 * whole ladder and the report is published with what was measured.
 */
function withHardTimeout(promise, timeoutMs, label) {
  let timer = null;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} exceeded its hard wall guard of ${timeoutMs} ms`));
    }, timeoutMs);
  });
  return Promise.race([promise, guard]).finally(() => {
    if (timer !== null) clearTimeout(timer);
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (process.platform !== "win32") {
    note(`warning: this probe has only been exercised on win32; running on ${process.platform}`);
  }
  const browserPath = chromium.executablePath();
  if (!existsSync(browserPath)) {
    throw new Error(`the pinned Chromium executable is absent: ${browserPath}`);
  }
  const vite = await createViteServer({
    root: repoRoot,
    appType: "custom",
    logLevel: "error",
    cacheDir: resolve(repoRoot, "node_modules", ".vite-phase6-calibration"),
    server: {
      host: "127.0.0.1",
      port: 0,
      strictPort: false,
      fs: { allow: [repoRoot] },
    },
    plugins: [{
      name: "vcc-phase6-calibration-page",
      configureServer(viteServer) {
        viteServer.middlewares.use((request, response, next) => {
          if (request.url?.split("?")[0] !== PAGE_PATH) {
            next();
            return;
          }
          response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          response.end("<!doctype html><title>VCC Phase 6 WP0 calibration</title>");
        });
      },
    }],
  });
  await vite.listen();
  const address = vite.httpServer?.address();
  if (address === null || address === undefined || typeof address === "string") {
    throw new Error("the calibration Vite server did not receive an IPv4 port");
  }
  const origin = `http://127.0.0.1:${address.port}`;

  const consoleErrors = [];
  const pageErrors = [];
  const ladder = [];
  let confirmation = null;
  let installed = null;
  let observed = null;
  let aborted = null;
  let browser = null;
  try {
    browser = await chromium.launch({
      executablePath: browserPath,
      headless: true,
      args: LAUNCH_FLAGS,
    });
    const page = await browser.newPage();
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const location = message.location();
      consoleErrors.push({
        text: message.text(),
        url: location.url,
        lineNumber: location.lineNumber,
      });
    });
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    await page.exposeFunction("vccPhase6Progress", (record) => {
      note(
        `  ${record.id} step=${record.step} extent=${record.solverExtent}` +
          `(core ${record.coreExtent}) attached=${record.attachedCount}` +
          ` elapsed=${record.elapsedSeconds.toFixed(1)}s`,
      );
    });
    await page.goto(`${origin}${PAGE_PATH}`, { waitUntil: "load" });
    installed = await page.evaluate(installProbe, {
      coreModuleUrl: `${origin}/core/src/index.ts`,
      cpuModuleUrl: `${origin}/solver-cpu/src/index.ts`,
      gpuModuleUrl: `${origin}/solver-gpu/src/index.ts`,
      requiredFeatures: [...PHASE5_REQUIRED_FEATURES],
      requiredLimits: { ...PHASE5_REQUIRED_LIMITS },
    });
    note(
      `adapter: ${installed.adapter.description} (${installed.adapter.backend},` +
        ` ${installed.adapter.type})`,
    );

    const budgetMs = options.budgetSeconds * 1000;
    // The hard guard allows one over-budget interface step to finish before the ladder is
    // abandoned; it is deliberately generous so a merely slow rung is measured, not killed.
    const hardGuardMs = budgetMs * 2 + 120_000;

    const specs = options.targetExtents.map((targetExtent) => ({
      id: `ladder-e${targetExtent}`,
      role: "resolution-ladder",
      targetExtent,
      dims: options.dimsOverride.get(targetExtent) ?? dimsForTarget(targetExtent),
      tempC: options.tempC,
      sigmaInf: options.sigmaInf,
      physics: MIRRORED_PHYSICS,
      relaxMaxSweeps: options.relaxMaxSweeps,
      divTol: options.divTol,
      stepCap: options.stepCap,
      checkEvery: options.checkEvery,
      budgetMs,
    }));

    for (const spec of specs) {
      note(
        `run ${spec.id}: T=${spec.tempC}C sigmaInf=${spec.sigmaInf}` +
          ` dims=${spec.dims.nx},${spec.dims.ny},${spec.dims.nz} target=${spec.targetExtent}`,
      );
      const startedMs = Date.now();
      const report = await withHardTimeout(
        page.evaluate(runCalibration, spec),
        hardGuardMs,
        spec.id,
      );
      report.nodeWallSeconds = (Date.now() - startedMs) / 1000;
      ladder.push(report);
      note(
        `  -> stop=${report.stopReason} extent=${report.extent}` +
          ` AR=${report.aspectRatio} z/T=${report.zExtent}/${report.tExtent}` +
          ` attached=${report.attachedCount} steps=${report.steps}` +
          ` wall=${report.wallSeconds.toFixed(1)}s`,
      );
    }

    // The confirmation runs at the largest rung that actually reached its size target with a
    // clean domain-contact result. A rung that stopped on contact, stalled, ran out of budget
    // or failed to converge cannot define a measurement size.
    const resolved = ladder.filter(
      (entry) => entry.stopReason === "size-target" && !entry.domainContact && entry.allConverged,
    );
    const chosen =
      options.confirmExtent === null
        ? resolved.at(-1) ?? null
        : ladder.find((entry) => entry.targetExtent === options.confirmExtent) ?? null;
    if (!options.skipConfirmation && chosen !== null) {
      const spec = {
        id: `confirm-e${chosen.targetExtent}`,
        role: "second-condition-confirmation",
        targetExtent: chosen.targetExtent,
        dims: chosen.dims,
        tempC: options.confirmTempC,
        sigmaInf: options.confirmSigmaInf,
        physics: MIRRORED_PHYSICS,
        relaxMaxSweeps: options.relaxMaxSweeps,
        divTol: options.divTol,
        stepCap: options.stepCap,
        checkEvery: options.checkEvery,
        budgetMs,
      };
      note(
        `run ${spec.id}: T=${spec.tempC}C sigmaInf=${spec.sigmaInf}` +
          ` dims=${spec.dims.nx},${spec.dims.ny},${spec.dims.nz} target=${spec.targetExtent}`,
      );
      const startedMs = Date.now();
      confirmation = await withHardTimeout(
        page.evaluate(runCalibration, spec),
        hardGuardMs,
        spec.id,
      );
      confirmation.nodeWallSeconds = (Date.now() - startedMs) / 1000;
      note(
        `  -> stop=${confirmation.stopReason} extent=${confirmation.extent}` +
          ` AR=${confirmation.aspectRatio} z/T=${confirmation.zExtent}/${confirmation.tExtent}` +
          ` attached=${confirmation.attachedCount} steps=${confirmation.steps}` +
          ` wall=${confirmation.wallSeconds.toFixed(1)}s`,
      );
    }
    observed = await page.evaluate(teardownProbe);
  } catch (error) {
    // A failure mid-ladder still publishes every completed rung; the abort is named in the
    // report so partial coverage is never read as a complete ladder.
    aborted = error instanceof Error ? error.message : String(error);
    note(`ABORTED: ${aborted}`);
  } finally {
    if (browser !== null) await browser.close().catch(() => undefined);
    await vite.close().catch(() => undefined);
  }

  const report = {
    probe: "phase6-wp0-gpu-calibration",
    status: aborted === null ? "complete" : "aborted",
    abortReason: aborted,
    evidenceStatus:
      "COORDINATOR-ONLY CALIBRATION. Not gate evidence, not a registered protocol, " +
      "not a Phase 5 conformance lane.",
    generatedAt: new Date().toISOString(),
    command: `node app/scripts/phase6-calibration.mjs ${process.argv.slice(2).join(" ")}`.trim(),
    options: {
      targetExtents: options.targetExtents,
      tempC: options.tempC,
      sigmaInf: options.sigmaInf,
      confirmTempC: options.confirmTempC,
      confirmSigmaInf: options.confirmSigmaInf,
      confirmExtent: options.confirmExtent,
      budgetSeconds: options.budgetSeconds,
      stepCap: options.stepCap,
      checkEvery: options.checkEvery,
      relaxMaxSweeps: options.relaxMaxSweeps,
      relaxMaxSweepsIsMirrored:
        options.relaxMaxSweeps === MIRRORED_PHYSICS.relaxMaxSweeps,
      divTol: options.divTol,
      divTolIsMirrored: options.divTol === MIRRORED_PHYSICS.divTol,
      dimsOverride: Object.fromEntries(options.dimsOverride),
    },
    physics: {
      ...MIRRORED_PHYSICS,
      relaxMaxSweeps: options.relaxMaxSweeps,
      divTol: options.divTol,
      centerRule: "core domainCenter(dims)",
      mirroredFrom: "runner/src/main.ts parseLKArgs defaults + growLK constructor",
      stoppingRules: [
        "unconverged (relaxation did not converge; surface skipped)",
        "stalled (surface reported stall)",
        "domain-contact (65% guard, checked before the size target)",
        "size-target (largestExtent >= targetExtent)",
        "step-cap",
        "over-budget (probe-only addition; not a runner rule)",
      ],
      seedNote: "canonical radius-2 thickness-1 hexagonal plate: 19 sites",
    },
    repository: (() => {
      try {
        return { commit: git("rev-parse", "HEAD"), clean: git("status", "--porcelain").length === 0 };
      } catch {
        return { commit: null, clean: null };
      }
    })(),
    host: {
      platform: process.platform,
      release: os.release(),
      architecture: os.arch(),
      cpu: os.cpus()[0]?.model.trim() ?? "unknown",
      logicalProcessors: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
      node: process.version,
    },
    runtime: {
      playwrightVersion: playwrightPackage.version,
      chromiumExecutable: browserPath,
      launchFlags: LAUNCH_FLAGS,
    },
    device: installed,
    ladder,
    confirmation,
    observed,
    consoleErrors,
    pageErrors,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (aborted !== null) process.exitCode = 1;
}

await main();
