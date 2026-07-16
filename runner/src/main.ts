// Headless CLI (plan, Stage 2a "runner"):
//
//   node runner/src/main.ts grow --preset plate --dims 128,128,64 --ticks 10000 --out out/run.ckpt
//
// Options:
//   --preset plate|needle|hollowColumn|dendrite   (required)
//   --dims nx,ny,nz          default 128,128,64
//   --domain hexPrism|box    active-domain shape (default hexPrism — the paper's own domain
//                            shape, §III, and the only one on which exact D6h symmetry is
//                            geometrically possible; see core/state DomainShape)
//   --ticks N                tick cap; stopping rules may end the run earlier (default 10000)
//   --out path.ckpt          checkpoint written at end of run (round-trip verified)
//   --seed N                 PRNG seed (default 1); only consumed when --noise > 0
//   --seed-radius N|none     hex seed radius (default 2); none = crystal-free control run
//                            (float-floor characterization, plan "solver-cpu" check)
//   --noise EPS              gg-machinery §6 noiseEpsilon (default 0 = off)
//   --metrics-every N        light metrics line cadence (default 250; 0 = off)
//   --full-metrics-every N   full morphology metrics cadence (default 2000; 0 = off)
//   --symmetry-every N       full |A Δ g(A)|/|A| cadence (default 1000); the exact
//                            incremental delta check runs EVERY tick regardless
//   --pgm-every N            PGM dump cadence (default 0 = off)
//   --pgm-dir DIR            where PGM dumps land (default out/pgm)
//   --stop-check-every N     far-field stopping-rule cadence (default 25)
//   --enforce-gate           make this run an ENFORCING Phase 2a gate (maker audit
//                            2026-07-15: printing gate metrics is not a gate; a failing
//                            build is). Exits 1 unless ALL TWELVE hold: preset is plate
//                            (the gate is defined on it), hexPrism domain (a box can pass a
//                            short run before the walls bite — maker round-5), seed radius
//                            2 AND the seed actually initialized as the canonical 19 sites
//                            (gg-machinery §5 — the behavioral check also fails if anyone
//                            ever "fixes" the seed back to the paper's erroneous 20), noise
//                            exactly 0, the crystal actually grew (charter §3.2 "a crystal
//                            grows at all" — a seed-only run must not pass), per-tick delta
//                            check clean, full symmetry metric 0 at every cadence point and
//                            at end, mass drift < 1e-10, aspect ratio < 1, no domain
//                            contact, and the run ended by the far-field stopping rule.
//                            (Seed thickness has no CLI flag and stays at the canonical
//                            default 1; if a flag is ever added, enforcement must learn it.)
//                            Off by default: grow is otherwise a neutral instrument
//                            (noise-on and box runs are asymmetric by design and must stay
//                            runnable).
//
// Stopping rules (gg-machinery §7 + charter §3.1 guard), whichever fires first:
//   far-field       mean vapor over free domain-face cells < (2/3) * rho
//   domain-contact  crystal bounding box > 65% of any domain extent — the final state is
//                   past the guard by construction, so the run is flagged NOT VALID EVIDENCE
//   tick-cap        --ticks reached without either rule firing (recorded honestly)

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  aspectRatio,
  computeMetrics,
  decodeCheckpoint,
  decodeLKCheckpoint,
  domainCenter,
  encodeCheckpoint,
  encodeLKCheckpoint,
  isD6hInvariantSet,
  pecletUpperBound,
  symmetryError,
  totalMass,
  validateParams,
  GG_PRESETS,
  type Dims,
  type DomainShape,
  type GGPresetName,
  type Metrics,
} from "@vcc/core";
import { GGSolver, LKSolver, FAR_FIELD_STOP_FRACTION } from "@vcc/solver-cpu";
import { occupancyTopDownPGM, propensitySlicePGM, vaporSlicePGM } from "./pgm.ts";

interface GrowOptions {
  preset: GGPresetName;
  dims: Dims;
  domain: DomainShape;
  ticks: number;
  out: string | null;
  seed: number;
  seedRadius: number | null;
  noise: number;
  metricsEvery: number;
  fullMetricsEvery: number;
  symmetryEvery: number;
  pgmEvery: number;
  pgmDir: string;
  stopCheckEvery: number;
  enforceGate: boolean;
}

function parseArgs(argv: string[]): GrowOptions {
  const options: GrowOptions = {
    preset: "plate",
    dims: { nx: 128, ny: 128, nz: 64 },
    domain: "hexPrism",
    ticks: 10_000,
    out: null,
    seed: 1,
    seedRadius: 2,
    noise: 0,
    metricsEvery: 250,
    fullMetricsEvery: 2000,
    symmetryEvery: 1000,
    pgmEvery: 0,
    pgmDir: "out/pgm",
    stopCheckEvery: 25,
    enforceGate: false,
  };
  let presetSeen = false;
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`missing value for ${flag}`);
      return v;
    };
    switch (flag) {
      case "--preset": {
        const name = value();
        if (!(name in GG_PRESETS)) throw new Error(`unknown preset: ${name}`);
        options.preset = name as GGPresetName;
        presetSeen = true;
        break;
      }
      case "--dims": {
        const parts = value().split(",").map(Number);
        if (parts.length !== 3 || parts.some((p) => !Number.isInteger(p) || p < 8)) {
          throw new Error("--dims wants nx,ny,nz integers >= 8");
        }
        options.dims = { nx: parts[0], ny: parts[1], nz: parts[2] };
        break;
      }
      case "--domain": {
        const shape = value();
        if (shape !== "box" && shape !== "hexPrism") {
          throw new Error(`--domain wants box or hexPrism, got ${shape}`);
        }
        options.domain = shape;
        break;
      }
      case "--ticks":
        options.ticks = Number(value());
        break;
      case "--out":
        options.out = value();
        break;
      case "--seed":
        options.seed = Number(value());
        break;
      case "--seed-radius": {
        const v = value();
        if (v === "none") {
          options.seedRadius = null;
        } else if (/^\d+$/.test(v)) {
          // Strict digits only: Number("") is 0, and a silent radius-0 (single-cell) seed is
          // exactly the spurious-needle trap gg-machinery §5 warns about.
          options.seedRadius = Number(v);
        } else {
          throw new Error(`--seed-radius wants a non-negative integer or "none", got "${v}"`);
        }
        break;
      }
      case "--noise": {
        const raw = value();
        const eps = Number(raw);
        // Reject, don't coerce: a negative or non-finite epsilon silently behaves as
        // noise-off in the solver (eps > 0 gates the noise path) while poisoning the
        // recorded metadata (maker round-5: --noise -0.00001 and --noise NaN both ran).
        if (!Number.isFinite(eps) || eps < 0) {
          throw new Error(`--noise wants a finite epsilon >= 0, got "${raw}"`);
        }
        options.noise = eps;
        break;
      }
      case "--metrics-every":
        options.metricsEvery = Number(value());
        break;
      case "--full-metrics-every":
        options.fullMetricsEvery = Number(value());
        break;
      case "--symmetry-every":
        options.symmetryEvery = Number(value());
        break;
      case "--pgm-every":
        options.pgmEvery = Number(value());
        break;
      case "--pgm-dir":
        options.pgmDir = value();
        break;
      case "--stop-check-every":
        options.stopCheckEvery = Number(value());
        break;
      case "--enforce-gate":
        options.enforceGate = true;
        break;
      default:
        throw new Error(`unknown flag: ${flag}`);
    }
  }
  if (!presetSeen) throw new Error("--preset is required");
  return options;
}

function fmt(x: number): string {
  return Number.isInteger(x) ? String(x) : x.toPrecision(6);
}

function printFullMetrics(label: string, m: Metrics, massDrift: number): void {
  console.log(
    `${label} tick=${m.tick} attached=${m.attachedCount} massDrift=${massDrift.toExponential(3)} ` +
      `symErr=${fmt(m.symmetryError)} AR=${fmt(m.aspectRatio)} hollow=${fmt(m.crossSectionHollowness)} ` +
      `sealedVoid=${fmt(m.sealedVoidFraction)} branches=${m.branchCount} radius=${fmt(m.boundingRadius)} ` +
      `farField=${fmt(m.farFieldVapor)} domainContact=${m.domainContact}`,
  );
}

function grow(options: GrowOptions): void {
  const params = GG_PRESETS[options.preset];
  const validation = validateParams(params);
  for (const w of validation.warnings) console.log(`param warning: ${w}`);
  if (validation.errors.length > 0) {
    for (const e of validation.errors) console.error(`param error: ${e}`);
    process.exit(1);
  }

  const solver = new GGSolver({
    dims: options.dims,
    params,
    rngSeed: options.seed,
    noiseEpsilon: options.noise,
    domain: options.domain,
    seedRadius: options.seedRadius,
  });
  const { dims, center } = solver;
  const kc = center[2];
  const initialAttached = solver.attachedCount;
  const m0 = totalMass(solver.b, solver.d);
  const startSym = symmetryError(solver.a, dims, center);
  console.log(
    `grow preset=${options.preset} dims=${dims.nx},${dims.ny},${dims.nz} domain=${options.domain}` +
      (options.domain === "hexPrism"
        ? ` (hexRadius=${solver.hexRadius}, zHalfExtent=${solver.zHalfExtent}, activeCells=${solver.activeCellCount})`
        : "") +
      ` ticks<=${options.ticks} seed=${options.seed} noise=${options.noise}` +
      ` seedRadius=${options.seedRadius === null ? "none" : options.seedRadius}` +
      ` seedSites=${initialAttached} ` +
      `m0=${m0.toPrecision(10)} seedSymErr=${startSym}`,
  );
  if (startSym !== 0) throw new Error("seed is not D6h-symmetric; aborting");

  if (options.pgmEvery > 0) mkdirSync(options.pgmDir, { recursive: true });

  // Symmetry accounting for the gate: the exact incremental check every tick, the full
  // metric on a cadence and at the end. deltaSymmetricAllTicks && full checks 0 => the
  // symmetry error was exactly 0 across the entire run.
  let deltaSymmetricAllTicks = true;
  let firstAsymmetricTick = -1;
  let maxFullSymErr = 0;
  let stopReason: string = "tick-cap";

  const dumpPGMs = (): void => {
    const t = String(solver.tick).padStart(6, "0");
    writeFileSync(join(options.pgmDir, `vapor-${t}.pgm`), vaporSlicePGM(solver, kc));
    writeFileSync(join(options.pgmDir, `propensity-${t}.pgm`), propensitySlicePGM(solver, kc));
    writeFileSync(join(options.pgmDir, `occupancy-${t}.pgm`), occupancyTopDownPGM(solver));
  };

  const started = Date.now();
  for (let t = 1; t <= options.ticks; t++) {
    solver.step();

    if (solver.lastAttached.length > 0 && !isD6hInvariantSet(solver.lastAttached, dims, center)) {
      if (deltaSymmetricAllTicks) firstAsymmetricTick = solver.tick;
      deltaSymmetricAllTicks = false;
    }
    if (options.symmetryEvery > 0 && t % options.symmetryEvery === 0) {
      const err = symmetryError(solver.a, dims, center);
      if (err > maxFullSymErr) maxFullSymErr = err;
    }
    if (options.metricsEvery > 0 && t % options.metricsEvery === 0) {
      const mass = totalMass(solver.b, solver.d);
      const drift = Math.abs(mass - m0) / m0;
      console.log(
        `tick=${solver.tick} attached=${solver.attachedCount} boundary=${solver.boundarySize()} ` +
          `massDrift=${drift.toExponential(3)} farField=${fmt(solver.farFieldMean())} ` +
          `deltaSym=${deltaSymmetricAllTicks} elapsed=${((Date.now() - started) / 1000).toFixed(1)}s`,
      );
    }
    if (options.fullMetricsEvery > 0 && t % options.fullMetricsEvery === 0) {
      const m = computeMetrics(
        solver.a, solver.b, solver.d, dims, center, solver.tick, solver.farFieldMean(),
      );
      printFullMetrics("metrics", m, Math.abs(m.totalMass - m0) / m0);
    }
    if (options.pgmEvery > 0 && t % options.pgmEvery === 0) dumpPGMs();

    if (solver.domainContact()) {
      stopReason = "domain-contact";
      break;
    }
    if (t % options.stopCheckEvery === 0) {
      if (solver.farFieldMean() < FAR_FIELD_STOP_FRACTION * params.rho) {
        stopReason = "far-field";
        break;
      }
    }
  }

  const final = computeMetrics(
    solver.a, solver.b, solver.d, dims, center, solver.tick, solver.farFieldMean(),
  );
  const finalDrift = Math.abs(final.totalMass - m0) / m0;
  if (final.symmetryError > maxFullSymErr) maxFullSymErr = final.symmetryError;
  if (options.pgmEvery > 0) dumpPGMs();

  console.log(`stop reason=${stopReason} tick=${solver.tick}`);
  printFullMetrics("final", final, finalDrift);
  console.log(
    `symmetry: deltaCheckCleanAllTicks=${deltaSymmetricAllTicks}` +
      (firstAsymmetricTick >= 0 ? ` firstAsymmetricTick=${firstAsymmetricTick}` : "") +
      ` maxFullSymErr=${maxFullSymErr} (full metric every ${options.symmetryEvery} ticks and at end)`,
  );
  if (stopReason === "domain-contact") {
    // The guard is checked after each tick, so a contact-stopped run's final state exceeds
    // the 65% limit by construction (maker audit 2026-07-15: needle z extent 125/192 =
    // 65.104%). Charter §3.1: such runs never enter validation results.
    console.log(
      "WARNING: run ended by the domain-contact guard; the final state exceeds the 65% " +
        "limit (charter §3.1) and these metrics are NOT valid evidence.",
    );
  }

  if (options.out !== null) {
    mkdirSync(dirname(options.out) || ".", { recursive: true });
    const encoded = encodeCheckpoint(solver.state(), final);
    writeFileSync(options.out, encoded);
    // Round-trip verification on a grown crystal (plan, core/checkpoint check).
    const back = decodeCheckpoint(new Uint8Array(readFileSync(options.out)));
    let identical =
      back.state.tick === solver.tick &&
      back.state.a.length === solver.a.length &&
      back.header.farField === "reflecting";
    if (identical) {
      for (let i = 0; i < solver.a.length; i++) {
        if (
          back.state.a[i] !== solver.a[i] ||
          back.state.b[i] !== solver.b[i] ||
          back.state.d[i] !== solver.d[i]
        ) {
          identical = false;
          break;
        }
      }
    }
    console.log(
      `checkpoint written: ${options.out} (${encoded.length} bytes) roundTripIdentical=${identical}`,
    );
    if (!identical) process.exit(1);
  }

  if (options.enforceGate) {
    // The Phase 2a gate, enforced (plan, Done when; maker audit 2026-07-15: a printed
    // metric that nobody has to read is not a gate). Every criterion that fails is named.
    // Exit 0 must be the whole claim by itself — so the preset is a criterion too (round-3
    // review: without it, a dendrite run printed GATE PASSED).
    const failures: string[] = [];
    if (options.preset !== "plate") {
      failures.push(`preset is ${options.preset}: the 2a gate is defined on the plate preset`);
    }
    if (options.domain !== "hexPrism") {
      failures.push(
        `domain is ${options.domain}: exact D6h symmetry requires the hexPrism domain ` +
          "(plan, Done when — a box run can stay symmetric until the walls bite)",
      );
    }
    if (options.seedRadius !== 2) {
      failures.push(
        `seed radius is ${options.seedRadius === null ? "none" : options.seedRadius}: ` +
          "the 2a gate requires the canonical radius-2 seed (gg-machinery §5)",
      );
    }
    if (initialAttached !== 19) {
      failures.push(
        `seed initialized as ${initialAttached} sites, not the canonical 19 ` +
          "(gg-machinery §5 erratum: the paper says 20; 19 is correct — do not fix it back)",
      );
    }
    if (!(final.attachedCount > initialAttached)) {
      failures.push(
        `no growth: ${final.attachedCount} attached vs ${initialAttached} seed sites — ` +
          `"a crystal grows at all" (charter §3.2) not met`,
      );
    }
    if (!deltaSymmetricAllTicks) {
      failures.push(`per-tick symmetry delta broke at tick ${firstAsymmetricTick}`);
    }
    if (maxFullSymErr !== 0) {
      failures.push(`full symmetry error ${maxFullSymErr} (gate requires exactly 0)`);
    }
    if (!(finalDrift < 1e-10)) {
      failures.push(`mass drift ${finalDrift.toExponential(3)} not < 1e-10`);
    }
    if (!(final.aspectRatio < 1)) {
      failures.push(`aspect ratio ${fmt(final.aspectRatio)} not < 1 (not a plate)`);
    }
    if (final.domainContact) {
      failures.push("domain-contact guard tripped: not valid evidence (charter §3.1)");
    }
    if (stopReason !== "far-field") {
      failures.push(`run ended by ${stopReason}, not the far-field stopping rule`);
    }
    if (options.noise !== 0) {
      failures.push("noise is ON; the symmetry gate is defined noise-off (plan, Done when)");
    }
    if (failures.length > 0) {
      console.error(`GATE FAILED (${failures.length} criteria):`);
      for (const f of failures) console.error(`  - ${f}`);
      process.exit(1);
    }
    console.log("GATE PASSED: every Phase 2a criterion enforced; exit 0 is the evidence.");
  }
}

// ── LibbrechtKinetics runs (Phase 2b; attachment-kinetics §4.4) ─────────────────────────────

interface GrowLKOptions {
  tempC: number | null;
  sigmaInf: number | null;
  dims: Dims;
  dxUm: number;
  paramSet: "CAK_A1" | "CAK";
  cfl: number;
  tol: number;
  steps: number;
  targetExtent: number;
  seed: number;
  noise: number;
  out: string | null;
  metricsEvery: number;
  /** Pinned explicitly by gate2b (round-2 review: no mutable constructor defaults in a gate;
      round-3: divTol and center too). */
  pressurePa: number;
  seedRadius: number;
  seedThickness: number;
  relaxMaxSweeps: number;
  divTol: number;
}

function parseLKArgs(argv: string[]): GrowLKOptions {
  const options: GrowLKOptions = {
    tempC: null,
    sigmaInf: null,
    dims: { nx: 96, ny: 96, nz: 96 },
    dxUm: 0.35,
    paramSet: "CAK_A1",
    cfl: 0.1,
    tol: 1e-9,
    steps: 100_000,
    targetExtent: 60,
    seed: 1,
    noise: 0,
    out: null,
    metricsEvery: 100,
    pressurePa: 101325,
    seedRadius: 2,
    seedThickness: 1,
    relaxMaxSweeps: 200_000,
    divTol: 1e-7,
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`missing value for ${flag}`);
      return v;
    };
    switch (flag) {
      case "--div-tol":
        options.divTol = Number(value());
        break;
      case "--temp-c":
        options.tempC = Number(value());
        break;
      case "--sigma-inf":
        options.sigmaInf = Number(value());
        break;
      case "--dims": {
        const parts = value().split(",").map(Number);
        if (parts.length !== 3 || parts.some((p) => !Number.isInteger(p) || p < 8)) {
          throw new Error("--dims wants nx,ny,nz integers >= 8");
        }
        options.dims = { nx: parts[0], ny: parts[1], nz: parts[2] };
        break;
      }
      case "--dx-um":
        options.dxUm = Number(value());
        break;
      case "--param-set": {
        const v = value();
        if (v !== "CAK_A1" && v !== "CAK") {
          throw new Error(`--param-set wants CAK_A1 or CAK, got ${v}`);
        }
        options.paramSet = v;
        break;
      }
      case "--cfl":
        options.cfl = Number(value());
        break;
      case "--tol":
        options.tol = Number(value());
        break;
      case "--steps":
        options.steps = Number(value());
        break;
      case "--target-extent":
        options.targetExtent = Number(value());
        break;
      case "--seed":
        options.seed = Number(value());
        break;
      case "--noise": {
        const raw = value();
        const eps = Number(raw);
        if (!Number.isFinite(eps) || eps < 0) {
          throw new Error(`--noise wants a finite epsilon >= 0, got "${raw}"`);
        }
        options.noise = eps;
        break;
      }
      case "--out":
        options.out = value();
        break;
      case "--metrics-every":
        options.metricsEvery = Number(value());
        break;
      default:
        throw new Error(`unknown flag: ${flag}`);
    }
  }
  if (options.tempC === null || options.sigmaInf === null) {
    throw new Error("grow-lk requires --temp-c and --sigma-inf");
  }
  return options;
}

interface LKRunResult {
  stopReason: "size-target" | "domain-contact" | "step-cap" | "stalled" | "unconverged";
  aspectRatio: number;
  attached: number;
  seedSites: number;
  tick: number;
  extent: number;
  symmetryClean: boolean;
  finalSymErr: number;
  allConverged: boolean;
  worstDivergence: number;
  maxKineticFillEver: number;
  holeFillCountTotal: number;
  pecletBound: number;
  simTimeSeconds: number;
}

function growLK(options: GrowLKOptions): LKRunResult {
  const solver = new LKSolver({
    dims: options.dims,
    tempC: options.tempC as number,
    sigmaInfinity: options.sigmaInf as number,
    dxUm: options.dxUm,
    pressurePa: options.pressurePa,
    paramSet: options.paramSet,
    cflFill: options.cfl,
    relaxTol: options.tol,
    divTol: options.divTol,
    relaxMaxSweeps: options.relaxMaxSweeps,
    rngSeed: options.seed,
    noiseEpsilon: options.noise,
    domain: "hexPrism",
    farField: "dirichlet",
    seedRadius: options.seedRadius,
    seedThickness: options.seedThickness,
    center: domainCenter(options.dims), // explicit — no constructor defaults in gate paths
  });
  const seedSites = solver.attachedCount;
  const pecletBound = pecletUpperBound(
    options.tempC as number,
    options.sigmaInf as number,
    Math.max(options.dims.nx, options.dims.ny, options.dims.nz) * options.dxUm * 1e-6,
    options.pressurePa,
  );
  const { dims, center } = solver;
  console.log(
    `grow-lk T=${options.tempC}C sigmaInf=${options.sigmaInf} dims=${dims.nx},${dims.ny},${dims.nz}` +
      ` (hexRadius=${solver.hexRadius}, zHalfExtent=${solver.zHalfExtent}, active=${solver.activeCellCount})` +
      ` dx=${options.dxUm}um P=${options.pressurePa}Pa paramSet=${options.paramSet}` +
      ` cfl=${options.cfl} tol=${options.tol} divTol=${options.divTol} maxSweeps=${options.relaxMaxSweeps}` +
      ` targetExtent=${options.targetExtent} seed=${options.seed} noise=${options.noise}` +
      ` seedRadius=${options.seedRadius} seedSites=${seedSites}` +
      ` vKin=${solver.vKinMS.toExponential(4)}m/s X0=${(solver.x0M * 1e6).toFixed(4)}um` +
      ` peclet<=${pecletBound.toExponential(2)} seedSymErr=${symmetryError(solver.a, dims, center)}`,
  );

  let symmetryClean = true;
  let allConverged = true;
  let worstDivergence = 0;
  let maxKineticFillEver = 0;
  let stopReason: LKRunResult["stopReason"] = "step-cap";
  const started = Date.now();

  for (let t = 1; t <= options.steps; t++) {
    const { relaxation, surface } = solver.step();
    if (!relaxation.converged) {
      allConverged = false;
      stopReason = "unconverged"; // step() skipped the surface; growing further is invalid
      break;
    }
    const divergence = relaxation.divergenceResidual ?? 0;
    if (divergence > worstDivergence) worstDivergence = divergence;
    const kinetic = surface.maxKineticFillIncrement ?? 0;
    if (kinetic > maxKineticFillEver) maxKineticFillEver = kinetic;
    if (
      solver.lastAttached.length > 0 &&
      !isD6hInvariantSet(solver.lastAttached, dims, center)
    ) {
      symmetryClean = false;
    }
    if (options.metricsEvery > 0 && t % options.metricsEvery === 0) {
      console.log(
        `step=${solver.tick} attached=${solver.attachedCount} extent=${solver.largestExtent()}` +
          ` AR=${fmt(aspectRatio(solver.a, dims))} sweeps=${relaxation.sweeps}` +
          ` div=${divergence.toExponential(2)}` +
          ` simTime=${solver.simTimeSeconds.toFixed(2)}s deltaSym=${symmetryClean}` +
          ` elapsed=${((Date.now() - started) / 1000).toFixed(1)}s`,
      );
    }
    if (surface.stalled) {
      stopReason = "stalled";
      break;
    }
    if (solver.largestExtent() >= options.targetExtent) {
      stopReason = "size-target";
      break;
    }
    if (solver.domainContact()) {
      stopReason = "domain-contact";
      break;
    }
  }

  const finalAR = aspectRatio(solver.a, dims);
  const finalSymErr = symmetryError(solver.a, dims, center);
  const result: LKRunResult = {
    stopReason,
    aspectRatio: finalAR,
    attached: solver.attachedCount,
    seedSites,
    tick: solver.tick,
    extent: solver.largestExtent(),
    symmetryClean,
    finalSymErr,
    allConverged,
    worstDivergence,
    maxKineticFillEver,
    holeFillCountTotal: solver.holeFillCountTotal,
    pecletBound,
    simTimeSeconds: solver.simTimeSeconds,
  };
  console.log(
    `stop reason=${stopReason} step=${solver.tick} attached=${solver.attachedCount}` +
      ` extent=${result.extent} AR=${fmt(finalAR)} symErr=${fmt(finalSymErr)}` +
      ` deltaSymClean=${symmetryClean} allConverged=${allConverged}` +
      ` worstDiv=${worstDivergence.toExponential(3)} maxKineticFill=${maxKineticFillEver.toFixed(4)}` +
      ` holeFills=${solver.holeFillCountTotal}` +
      ` simTime=${solver.simTimeSeconds.toFixed(2)}s fillLedger=${solver.fillLedger.toFixed(3)}` +
      ` holeFillDeficit=${solver.holeFillDeficit.toFixed(3)}` +
      ` saturationClipped=${solver.saturationClippedFill.toFixed(3)}`,
  );

  if (options.out !== null) {
    mkdirSync(dirname(options.out) || ".", { recursive: true });
    const encoded = encodeLKCheckpoint({
      dims,
      tick: solver.tick,
      simTimeSeconds: solver.simTimeSeconds,
      rngSeed: options.seed,
      noiseEpsilon: options.noise,
      domain: solver.domain,
      center,
      tempC: options.tempC as number,
      sigmaInfinity: options.sigmaInf as number,
      dxUm: options.dxUm,
      pressurePa: solver.pressurePa,
      paramSet: options.paramSet,
      cflFill: options.cfl,
      relaxTol: options.tol,
      divTol: options.divTol,
      relaxMaxSweeps: options.relaxMaxSweeps,
      a: solver.a,
      f: solver.f,
      sigma: solver.sigma,
    });
    writeFileSync(options.out, encoded);
    const back = decodeLKCheckpoint(new Uint8Array(readFileSync(options.out)));
    let identical = back.state.tick === solver.tick && back.state.a.length === solver.a.length;
    if (identical) {
      for (let i = 0; i < solver.a.length; i++) {
        if (
          back.state.a[i] !== solver.a[i] ||
          back.state.f[i] !== solver.f[i] ||
          back.state.sigma[i] !== solver.sigma[i]
        ) {
          identical = false;
          break;
        }
      }
    }
    console.log(
      `checkpoint written: ${options.out} (${encoded.length} bytes) roundTripIdentical=${identical}`,
    );
    if (!identical) process.exit(1);
  }
  return result;
}

/**
 * The ENFORCED Phase 2b habit gate — RE-REGISTERED (protocol v3) after the round-3 maker
 * review invalidated v2 mid-run (v1: domain confound + mislabeled set + sink/growth sigma
 * split; v2: uniform fill ignored the hexagonal-prism FACE GEOMETRY — a lateral face fills a
 * cell at 2/3 the basal rate, so v2 overdrove prism growth 50% — plus divergence-blind
 * convergence and silent saturation clipping). v3, PINNED here flagless and recorded in the
 * plan BEFORE the first accepted run:
 *   ONE domain for both runs: 96,96,96 hexPrism + Dirichlet — temperature is the only
 *   difference; parameter set CAK_A1 (honest name; see libbrecht-parameters.md);
 *   sigma_infinity = 0.002 (v3: with the corrected 2/3 lateral face factor, 0.005 left the
 *   warm-side volume-fill ratio ~1.18 — inside the AR threshold; 0.002 gives worst-case
 *   lateral/vertical fill ratio 3.24 at -5 C and vertical/lateral 81.9 at -15 C — the
 *   plan's RE-REGISTRATION v3 arithmetic; round-4 review recomputed 3.24445 / 81.8819,
 *   and this comment's earlier ">= 3.1 / >= 55" was drift), dx = 0.35 um, P = 101325 Pa,
 *   cfl 0.1, tol 1e-9, divTol 1e-7
 *   (convergence REQUIRES the divergence identity), maxSweeps 2e5, noise OFF, seed 1,
 *   canonical radius-2/thickness-1 seed asserted as 19 sites, explicit center;
 *   run PLATE  at T = -5 C  -> expect AR <= 1/1.5 at first extent >= 60 cells, and
 *   run COLUMN at T = -15 C -> expect AR >= 1.5   at first extent >= 60 cells.
 * NOTE the -15 C expectation is deliberately Nakaya-INVERTED (the no-SDAK large-facet model
 * predicts columns there — 1910.09067 Fig. 4's own "striking difference"): the gate claims
 * habit is an OUTPUT of temperature, not that it matches nature. That is Phase 6's job.
 */
function gate2b(): void {
  const failures: string[] = [];
  const common: GrowLKOptions = {
    tempC: null,
    sigmaInf: 0.002,
    dims: { nx: 96, ny: 96, nz: 96 }, // SAME domain for both runs — temperature only
    dxUm: 0.35,
    paramSet: "CAK_A1",
    cfl: 0.1,
    tol: 1e-9,
    steps: 200_000,
    targetExtent: 60,
    seed: 1,
    noise: 0,
    out: null,
    metricsEvery: 200,
    pressurePa: 101325,
    seedRadius: 2,
    seedThickness: 1,
    relaxMaxSweeps: 200_000,
    divTol: 1e-7,
  };
  console.log("=== 2b GATE run 1/2: plate expectation, T = -5 C ===");
  const plate = growLK({ ...common, tempC: -5, out: "out/gate2b-plate.ckpt" });
  console.log("=== 2b GATE run 2/2: column expectation, T = -15 C ===");
  const column = growLK({ ...common, tempC: -15, out: "out/gate2b-column.ckpt" });

  const checkRun = (label: string, r: LKRunResult): void => {
    if (r.seedSites !== 19) {
      failures.push(`${label}: seed initialized as ${r.seedSites} sites, not the canonical 19`);
    }
    if (r.stopReason !== "size-target") {
      failures.push(`${label}: ended by ${r.stopReason}, not size-target`);
    }
    if (!(r.extent >= 60)) {
      failures.push(`${label}: measured at extent ${r.extent}, below the stated 60`);
    }
    if (!r.symmetryClean || r.finalSymErr !== 0) {
      failures.push(`${label}: symmetry broke (deltaClean=${r.symmetryClean}, err=${r.finalSymErr})`);
    }
    if (!r.allConverged) failures.push(`${label}: a relaxation failed to converge`);
    if (!(r.worstDivergence < 1e3 * common.tol)) {
      failures.push(`${label}: divergence identity ${r.worstDivergence} not < ${1e3 * common.tol}`);
    }
    if (!(r.maxKineticFillEver <= common.cfl + 1e-12)) {
      failures.push(`${label}: kinetic fill-CFL bound violated (${r.maxKineticFillEver})`);
    }
    if (!(r.pecletBound < 1e-2)) {
      failures.push(`${label}: quasi-static validity bound Pe ${r.pecletBound} not < 1e-2`);
    }
  };
  checkRun("plate(-5C)", plate);
  checkRun("column(-15C)", column);
  if (!(plate.aspectRatio <= 1 / 1.5)) {
    failures.push(`plate(-5C): AR ${plate.aspectRatio} not <= ${1 / 1.5} — not a plate`);
  }
  if (!(column.aspectRatio >= 1.5)) {
    failures.push(`column(-15C): AR ${column.aspectRatio} not >= 1.5 — not a column`);
  }

  if (failures.length > 0) {
    console.error(`2B GATE FAILED (${failures.length} criteria):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(
    `2B GATE PASSED: habit is an output of temperature alone (same domain, same everything,` +
      ` T only) — AR(-5C)=${fmt(plate.aspectRatio)} (plate), AR(-15C)=${fmt(column.aspectRatio)}` +
      ` (column); every criterion enforced; exit 0 is the evidence.`,
  );
}

const [command, ...rest] = process.argv.slice(2);
if (command === "grow") {
  grow(parseArgs(rest));
} else if (command === "grow-lk") {
  growLK(parseLKArgs(rest));
} else if (command === "gate2b") {
  if (rest.length > 0) {
    console.error("gate2b takes no flags: the protocol is pinned (pre-registered in the plan)");
    process.exit(2);
  }
  gate2b();
} else {
  console.error(
    "usage: node runner/src/main.ts grow --preset <name> [options]\n" +
      "       node runner/src/main.ts grow-lk --temp-c <C> --sigma-inf <frac> [options]\n" +
      "       node runner/src/main.ts gate2b",
  );
  process.exit(2);
}
