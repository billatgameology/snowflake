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

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { execFileSync, fork } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import {
  aspectRatio,
  centerRimDepletion,
  computeMetrics,
  decodeCheckpoint,
  decodeLKCheckpoint,
  domainCenter,
  encodeCheckpoint,
  encodeLKCheckpoint,
  isLKSurfacePolicy,
  isD6hInvariantSet,
  latticeExtents,
  metersSmootherDrift,
  pecletUpperBound,
  symmetryError,
  totalMass,
  validateParams,
  GG_PRESETS,
  type Dims,
  type DomainShape,
  type GGPresetName,
  type FarFieldCondition,
  type LKSurfacePolicy,
  type Metrics,
} from "@vcc/core";
import {
  GGSolver,
  LKSolver,
  FAR_FIELD_STOP_FRACTION,
  float64SmootherDriftAbsLimit,
} from "@vcc/solver-cpu";
import { GROW_LK_DEFAULTS, type GrowLKDefaults } from "./grow-lk-defaults.ts";
import { gate3 } from "./gate3.ts";
import { gate4a } from "./gate4a.ts";
import { gate4b } from "./gate4b.ts";
import { gate4 } from "./gate4-aggregate.ts";
import { gate5Lane } from "./gate5-lane.ts";
import { gate5 } from "./gate5-aggregate.ts";
import {
  GATE2B_NODE,
  GATE2B_PREREGISTRATION,
  GATE2B_WORKER_SPECS,
  GATE2B_V8,
  type Gate2bRole,
  type Gate2bWorkerEnvelope,
  type Gate2bWorkerSpec,
  type LKRunResult,
  validateGate2bDriftSummary,
  validateGate2bOutputAbsence,
  validateGate2bProvenance,
  validateGate2bWorkerCompletion,
  validateLKStepEvidence,
} from "./gate2b-validation.ts";
import { occupancyTopDownPGM, propensitySlicePGM, vaporSlicePGM } from "./pgm.ts";
import {
  PHASE6_CROSSPLATFORM_FIXTURE,
  phase6FixturePointSigmaInf,
  phase6LibmDigest,
  phase6LibmFingerprint,
} from "./phase6-crossplatform.ts";
import { phase6RenderDiagram } from "./phase6-diagram.ts";
import {
  PHASE6_ARM1,
  PHASE6_ARM2,
  phase6Aggregate,
  phase6RunSweep,
  phase6SweepPlan,
  phase6SweepPreflight,
} from "./phase6-sweep.ts";

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

const UINT32_MAX = 0xffff_ffff;

function parseSafeInteger(
  raw: string,
  flag: string,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    const range = maximum === Number.MAX_SAFE_INTEGER ? `>= ${minimum}` : `${minimum}..${maximum}`;
    throw new Error(`${flag} wants a safe integer in ${range}, got "${raw}"`);
  }
  return value;
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
        options.ticks = parseSafeInteger(value(), "--ticks", 0);
        break;
      case "--out":
        options.out = value();
        break;
      case "--seed":
        options.seed = parseSafeInteger(value(), "--seed", 0, UINT32_MAX);
        break;
      case "--seed-radius": {
        const v = value();
        if (v === "none") {
          options.seedRadius = null;
        } else if (/^\d+$/.test(v)) {
          // Strict digits only: Number("") is 0, and a silent radius-0 (single-cell) seed is
          // exactly the spurious-needle trap gg-machinery §5 warns about.
          options.seedRadius = parseSafeInteger(v, "--seed-radius", 0);
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
        if (!Number.isFinite(eps) || eps < 0 || eps > 1) {
          throw new Error(`--noise wants a finite epsilon in [0, 1], got "${raw}"`);
        }
        options.noise = eps;
        break;
      }
      case "--metrics-every":
        options.metricsEvery = parseSafeInteger(value(), "--metrics-every", 0);
        break;
      case "--full-metrics-every":
        options.fullMetricsEvery = parseSafeInteger(value(), "--full-metrics-every", 0);
        break;
      case "--symmetry-every":
        options.symmetryEvery = parseSafeInteger(value(), "--symmetry-every", 0);
        break;
      case "--pgm-every":
        options.pgmEvery = parseSafeInteger(value(), "--pgm-every", 0);
        break;
      case "--pgm-dir":
        options.pgmDir = value();
        break;
      case "--stop-check-every":
        options.stopCheckEvery = parseSafeInteger(value(), "--stop-check-every", 1);
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
  // depCenter/depRim are samples of G-G vapor mass d (model units, unvalidated); depRatio is
  // their unitless center/rim quotient (plan phase-3-dev-visualization, honest-field note).
  console.log(
    `${label} tick=${m.tick} attached=${m.attachedCount} massDrift=${massDrift.toExponential(3)} ` +
      `symErr=${fmt(m.symmetryError)} AR=${fmt(m.aspectRatio)} hollow=${fmt(m.crossSectionHollowness)} ` +
      `sealedVoid=${fmt(m.sealedVoidFraction)} branches=${m.branchCount} radius=${fmt(m.boundingRadius)} ` +
      `farField=${fmt(m.farFieldVapor)} domainContact=${m.domainContact} ` +
      `depCenter=${fmt(m.depletionCenter)} depRim=${fmt(m.depletionRim)} ` +
      `depRatio=${fmt(m.depletionRatio)}`,
  );
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) return false;
  }
  return true;
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
      // Cheap enough for the light line (one plane scan): the Phase 3 depletion samples of
      // G-G vapor mass d (model units, unvalidated) and their unitless center/rim ratio.
      const dep = centerRimDepletion(solver.a, solver.d, dims, center, solver.wall);
      console.log(
        `tick=${solver.tick} attached=${solver.attachedCount} boundary=${solver.boundarySize()} ` +
          `massDrift=${drift.toExponential(3)} farField=${fmt(solver.farFieldMean())} ` +
          `depCenter=${fmt(dep.depletionCenter)} depRim=${fmt(dep.depletionRim)} ` +
          `depRatio=${fmt(dep.depletionRatio)} ` +
          `deltaSym=${deltaSymmetricAllTicks} elapsed=${((Date.now() - started) / 1000).toFixed(1)}s`,
      );
    }
    if (options.fullMetricsEvery > 0 && t % options.fullMetricsEvery === 0) {
      const m = computeMetrics(
        solver.a, solver.b, solver.d, dims, center, solver.tick, solver.farFieldMean(),
        solver.wall,
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
    solver.wall,
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
    // A crystal-free diagnostic has undefined morphology ratios, which JSON cannot represent
    // without silently rewriting them to null. Its fields and controls remain checkpointable;
    // metrics are explicitly absent instead of dishonest.
    const checkpointMetrics = final.attachedCount > 0 ? final : null;
    const encoded = encodeCheckpoint(solver.state(), checkpointMetrics);
    writeFileSync(options.out, encoded);
    // Re-encoding the decoded checkpoint compares every v1 control, parameter, metric and
    // field bit. Comparing the file too makes the filesystem write part of the evidence path.
    const written = new Uint8Array(readFileSync(options.out));
    const back = decodeCheckpoint(written);
    const reencoded = encodeCheckpoint(back.state, back.header.metrics);
    const identical = bytesEqual(encoded, written) && bytesEqual(written, reencoded);
    console.log(
      `checkpoint written: ${options.out} (${encoded.length} bytes) roundTripIdentical=${identical}`,
    );
    if (!identical) throw new Error("GG checkpoint round trip changed header controls or field bits");
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
  surfacePolicy: LKSurfacePolicy;
  farField: FarFieldCondition;
  tempC: number | null;
  sigmaInf: number | null;
  dims: Dims;
  dxUm: number;
  // "M1" for Phase 6 arm 2 (ADR 0036). Sourced from GrowLKDefaults so the CLI allow-list, the
  // defaults object and this option type cannot drift apart.
  paramSet: GrowLKDefaults["paramSet"];
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
  // Sourced from GROW_LK_DEFAULTS so the Phase 6 preflight can CHECK these against the frozen
  // protocol. Seven of them reach a sweep run through this object rather than the command line —
  // see the header of runner/src/grow-lk-defaults.ts and ADR 0031.
  const options: GrowLKOptions = {
    ...GROW_LK_DEFAULTS,
    tempC: null,
    sigmaInf: null,
    out: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`missing value for ${flag}`);
      return v;
    };
    switch (flag) {
      case "--surface-policy": {
        const policy = value();
        if (!isLKSurfacePolicy(policy)) {
          throw new Error(`--surface-policy is invalid: ${policy}`);
        }
        options.surfacePolicy = policy;
        break;
      }
      case "--far-field": {
        // Only the two clamped-shell lanes. `reflecting` has no source against which the
        // divergence identity could be stated, so it cannot support a physics run here
        // (attachment-kinetics §4.4); offering it would invite a diagnostic-only field to be
        // mistaken for evidence.
        const condition = value();
        if (condition !== "dirichlet" && condition !== "monopole-matched") {
          throw new Error(
            `--far-field wants dirichlet or monopole-matched, got ${condition}`,
          );
        }
        options.farField = condition;
        break;
      }
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
        // "M1" added for Phase 6 arm 2 (ADR 0036). Validated by an explicit allow-list rather than
        // a cast, so a typo is a named error at the command line instead of a silent default —
        // ADR 0031's defect was exactly a param set arriving unvalidated.
        if (v !== "CAK_A1" && v !== "CAK" && v !== "M1") {
          throw new Error(`--param-set wants CAK_A1, CAK or M1, got ${v}`);
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

function growLK(options: GrowLKOptions): LKRunResult {
  const solver = new LKSolver({
    surfacePolicy: options.surfacePolicy,
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
    farField: options.farField,
    seedRadius: options.seedRadius,
    seedThickness: options.seedThickness,
    center: domainCenter(options.dims), // explicit — no constructor defaults in gate paths
  });
  const seedSites = solver.attachedCount;
  const smootherDriftAbsLimit = metersSmootherDrift(solver.surfacePolicy)
    ? float64SmootherDriftAbsLimit(solver.activeCellCount, options.sigmaInf as number)
    : null;
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
      ` surfacePolicy=${solver.surfacePolicy} farField=${solver.farField}` +
      ` cfl=${options.cfl} tol=${options.tol} divTol=${options.divTol} maxSweeps=${options.relaxMaxSweeps}` +
      ` targetExtent=${options.targetExtent} seed=${options.seed} noise=${options.noise}` +
      ` seedRadius=${options.seedRadius} seedSites=${seedSites}` +
      ` vKin=${solver.vKinMS.toExponential(4)}m/s X0=${(solver.x0M * 1e6).toFixed(4)}um` +
      ` peclet<=${pecletBound.toExponential(2)} seedSymErr=${symmetryError(solver.a, dims, center)}`,
      ` smootherDriftLimit=${smootherDriftAbsLimit?.toExponential(3) ?? "n/a"}`,
  );

  let symmetryClean = true;
  let allConverged = true;
  let minShellInjection = Infinity;
  let minSurfaceExchange = Infinity;
  let worstDivergence = 0;
  let maxAbsSmootherDrift: number | null = metersSmootherDrift(solver.surfacePolicy) ? 0 : null;
  let maxKineticFillEver = 0;
  let stopReason: LKRunResult["stopReason"] = "step-cap";
  const started = Date.now();
  let lastHeartbeat = started;

  for (let t = 1; t <= options.steps; t++) {
    const { relaxation, surface } = solver.step(
      options.metricsEvery > 0
        ? (progress) => {
            const now = Date.now();
            if (now - lastHeartbeat < 60_000) return;
            const div =
              progress.divergenceResidual === null
                ? "n/a"
                : progress.divergenceResidual.toExponential(2);
            console.log(
              `relax growthStep=${solver.tick + 1} sweeps=${progress.sweeps}` +
                ` residual=${progress.residual.toExponential(2)} div=${div}` +
                ` elapsed=${((now - started) / 1000).toFixed(1)}s`,
            );
            lastHeartbeat = now;
          }
        : undefined,
    );
    if (!relaxation.converged) {
      allConverged = false;
      stopReason = "unconverged"; // step() skipped the surface; growing further is invalid
      break;
    }
    const evidence = validateLKStepEvidence(
      relaxation,
      surface,
      options.tol,
      options.divTol,
      options.surfacePolicy,
      smootherDriftAbsLimit,
    );
    const divergence = evidence.divergenceResidual;
    if (divergence > worstDivergence) worstDivergence = divergence;
    if (
      evidence.smootherDrift !== null &&
      (maxAbsSmootherDrift === null || Math.abs(evidence.smootherDrift) > maxAbsSmootherDrift)
    ) {
      maxAbsSmootherDrift = Math.abs(evidence.smootherDrift);
    }
    if (evidence.shellInjection < minShellInjection) {
      minShellInjection = evidence.shellInjection;
    }
    if (evidence.surfaceExchange < minSurfaceExchange) {
      minSurfaceExchange = evidence.surfaceExchange;
    }
    const kinetic = evidence.maxKineticFillIncrement;
    if (kinetic > maxKineticFillEver) maxKineticFillEver = kinetic;
    if (
      solver.lastAttached.length > 0 &&
      !isD6hInvariantSet(solver.lastAttached, dims, center)
    ) {
      symmetryClean = false;
    }
    const now = Date.now();
    const shouldReport =
      options.metricsEvery > 0 &&
      (t === 1 || t % options.metricsEvery === 0 || now - lastHeartbeat >= 60_000);
    if (shouldReport) {
      console.log(
        `step=${solver.tick} attached=${solver.attachedCount} extent=${solver.largestExtent()}` +
          ` AR=${fmt(aspectRatio(solver.a, dims))} sweeps=${relaxation.sweeps}` +
          ` div=${divergence.toExponential(2)}` +
          ` simTime=${solver.simTimeSeconds.toFixed(2)}s deltaSym=${symmetryClean}` +
          ` elapsed=${((Date.now() - started) / 1000).toFixed(1)}s`,
      );
      lastHeartbeat = now;
    }
    if (surface.stalled) {
      stopReason = "stalled";
      break;
    }
    // Contact wins if one simultaneous attachment batch crosses both thresholds. Otherwise a
    // large jump could be mislabeled size-target and admitted as boundary-confounded evidence.
    if (solver.domainContact()) {
      stopReason = "domain-contact";
      break;
    }
    if (solver.largestExtent() >= options.targetExtent) {
      stopReason = "size-target";
      break;
    }
  }

  const finalAR = aspectRatio(solver.a, dims);
  const finalSymErr = symmetryError(solver.a, dims, center);
  const result: LKRunResult = {
    surfacePolicy: solver.surfacePolicy,
    stopReason,
    aspectRatio: finalAR,
    attached: solver.attachedCount,
    seedSites,
    tick: solver.tick,
    extent: solver.largestExtent(),
    symmetryClean,
    finalSymErr,
    allConverged,
    minShellInjection,
    minSurfaceExchange,
    worstDivergence,
    maxAbsSmootherDrift,
    smootherDriftAbsLimit,
    maxKineticFillEver,
    holeFillCountTotal: solver.holeFillCountTotal,
    pecletBound,
    simTimeSeconds: solver.simTimeSeconds,
  };
  console.log(
    `stop reason=${stopReason} step=${solver.tick} attached=${solver.attachedCount}` +
      ` extent=${result.extent} AR=${fmt(finalAR)} symErr=${fmt(finalSymErr)}` +
      ` deltaSymClean=${symmetryClean} allConverged=${allConverged}` +
      ` minShell=${minShellInjection.toExponential(3)}` +
      ` minExchange=${minSurfaceExchange.toExponential(3)}` +
      ` worstDiv=${worstDivergence.toExponential(3)} maxKineticFill=${maxKineticFillEver.toFixed(4)}` +
      ` maxAbsSmootherDrift=${maxAbsSmootherDrift?.toExponential(3) ?? "n/a"}` +
      ` smootherDriftLimit=${smootherDriftAbsLimit?.toExponential(3) ?? "n/a"}` +
      ` holeFills=${solver.holeFillCountTotal}` +
      ` simTime=${solver.simTimeSeconds.toFixed(2)}s fillLedger=${solver.fillLedger.toFixed(3)}` +
      ` holeFillDeficit=${solver.holeFillDeficit.toFixed(3)}` +
      ` saturationClipped=${solver.saturationClippedFill.toFixed(3)}`,
  );

  if (options.out !== null) {
    mkdirSync(dirname(options.out) || ".", { recursive: true });
    if (solver.farField !== "dirichlet") {
      throw new Error(
        "LK evidence checkpoints require the solver's actual far field to be Dirichlet",
      );
    }
    const encoded = encodeLKCheckpoint({
      surfacePolicy: solver.surfacePolicy,
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
      farField: solver.farField,
      a: solver.a,
      f: solver.f,
      sigma: solver.sigma,
    });
    writeFileSync(options.out, encoded);
    const back = decodeLKCheckpoint(new Uint8Array(readFileSync(options.out)));
    // Verify every v2 policy/control field plus every array bit. Seed geometry and termination
    // controls remain in the pre-registration + launch/result log + process exit.
    let identical =
      back.header.version === 2 &&
      back.header.rule === "LibbrechtKinetics" &&
      back.header.endianness === "LE" &&
      back.header.farField === "dirichlet" &&
      back.header.surfacePolicy === solver.surfacePolicy &&
      back.state.surfacePolicy === solver.surfacePolicy &&
      back.header.dims.nx === dims.nx &&
      back.header.dims.ny === dims.ny &&
      back.header.dims.nz === dims.nz &&
      back.state.tick === solver.tick &&
      back.header.simTimeSeconds === solver.simTimeSeconds &&
      back.header.rngSeed === options.seed &&
      back.header.noiseEpsilon === options.noise &&
      back.header.domain === solver.domain &&
      back.header.center[0] === center[0] &&
      back.header.center[1] === center[1] &&
      back.header.center[2] === center[2] &&
      back.state.a.length === solver.a.length &&
      back.header.tempC === (options.tempC as number) &&
      back.header.sigmaInfinity === (options.sigmaInf as number) &&
      back.header.dxUm === options.dxUm &&
      back.header.pressurePa === solver.pressurePa &&
      back.header.paramSet === options.paramSet &&
      back.header.cflFill === options.cfl &&
      back.header.relaxTol === options.tol &&
      back.header.divTol === options.divTol &&
      back.header.relaxMaxSweeps === options.relaxMaxSweeps;
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
    if (!identical) throw new Error("LK checkpoint round trip changed header controls or field bits");
  }
  return result;
}

function gate2bOptions(spec: Gate2bWorkerSpec): GrowLKOptions {
  return {
    surfacePolicy: "aggregate-hv-g1h1-v5",
    // Gate 2b's executed protocol, pinned: the accepted v5p evidence ran fixed-σ Dirichlet, and
    // ADR 0024's monopole shell must never be retrofitted onto a completed gate.
    farField: "dirichlet",
    tempC: spec.tempC,
    sigmaInf: 0.002,
    dims: { nx: 96, ny: 96, nz: 96 }, // SAME domain for both jobs — temperature only
    dxUm: 0.35,
    paramSet: "CAK_A1",
    cfl: 0.1,
    tol: 1e-9,
    steps: 200_000,
    targetExtent: 60,
    seed: 1,
    noise: 0,
    out: spec.checkpointPath,
    metricsEvery: 200,
    pressurePa: 101325,
    seedRadius: 2,
    seedThickness: 1,
    relaxMaxSweeps: 200_000,
    divTol: 1e-7,
  };
}

function prefixGate2bWorkerStream(
  stream: NodeJS.ReadableStream,
  label: string,
  toError: boolean,
): void {
  const lines = createInterface({ input: stream });
  lines.on("line", (line) => {
    const message = `[${label}] ${line}`;
    if (toError) console.error(message);
    else console.log(message);
  });
}

function validateGate2bWorkerCheckpoint(spec: Gate2bWorkerSpec, result: LKRunResult): void {
  const decoded = decodeLKCheckpoint(new Uint8Array(readFileSync(spec.checkpointPath)));
  const { header, state } = decoded;
  const expectedDims = { nx: 96, ny: 96, nz: 96 } as const;
  const expectedCenter = domainCenter(expectedDims);
  if (
    header.version !== 2 ||
    header.rule !== "LibbrechtKinetics" ||
    header.surfacePolicy !== "aggregate-hv-g1h1-v5" ||
    state.surfacePolicy !== "aggregate-hv-g1h1-v5" ||
    header.tempC !== spec.tempC ||
    header.sigmaInfinity !== 0.002 ||
    header.dims.nx !== expectedDims.nx ||
    header.dims.ny !== expectedDims.ny ||
    header.dims.nz !== expectedDims.nz ||
    header.domain !== "hexPrism" ||
    header.farField !== "dirichlet" ||
    header.center[0] !== expectedCenter[0] ||
    header.center[1] !== expectedCenter[1] ||
    header.center[2] !== expectedCenter[2] ||
    header.dxUm !== 0.35 ||
    header.pressurePa !== 101325 ||
    header.paramSet !== "CAK_A1" ||
    header.cflFill !== 0.1 ||
    header.relaxTol !== 1e-9 ||
    header.divTol !== 1e-7 ||
    header.relaxMaxSweeps !== 200_000 ||
    header.rngSeed !== 1 ||
    header.noiseEpsilon !== 0 ||
    state.tick !== result.tick ||
    header.simTimeSeconds !== result.simTimeSeconds
  ) {
    throw new Error(`${spec.label} parent checkpoint control/result authentication failed`);
  }
  let attached = 0;
  for (const value of state.a) attached += value;
  const extents = latticeExtents(state.a, expectedDims);
  if (extents === null) throw new Error(`${spec.label} parent checkpoint contains no crystal`);
  const extent = extents.largestExtent;
  const checkpointAspectRatio = aspectRatio(state.a, expectedDims);
  const checkpointSymmetry = symmetryError(state.a, expectedDims, expectedCenter);
  if (
    attached !== result.attached ||
    extent !== result.extent ||
    checkpointAspectRatio !== result.aspectRatio ||
    checkpointSymmetry !== result.finalSymErr
  ) {
    throw new Error(
      `${spec.label} parent checkpoint morphology/result authentication failed: ` +
        `attached=${attached}/${result.attached}, extent=${extent}/${result.extent}, ` +
        `AR=${checkpointAspectRatio}/${result.aspectRatio}, ` +
        `symmetry=${checkpointSymmetry}/${result.finalSymErr}`,
    );
  }
}

function launchGate2bWorker(spec: Gate2bWorkerSpec): Promise<LKRunResult> {
  const child = fork(fileURLToPath(import.meta.url), ["__gate2b-worker", spec.role], {
    cwd: process.cwd(),
    silent: true,
  });
  console.log(
    `gate2b v5p launched role=${spec.role} tempC=${spec.tempC}` +
      ` checkpoint=${spec.checkpointPath} pid=${String(child.pid)}`,
  );
  if (child.stdout !== null) prefixGate2bWorkerStream(child.stdout, spec.label, false);
  if (child.stderr !== null) prefixGate2bWorkerStream(child.stderr, spec.label, true);
  const messages: unknown[] = [];
  child.on("message", (message) => messages.push(message));
  return new Promise<LKRunResult>((resolve, reject) => {
    let settled = false;
    child.once("error", (error) => {
      if (settled) return;
      settled = true;
      reject(new Error(`${spec.label} worker process error: ${error.message}`, { cause: error }));
    });
    child.once("close", (exitCode, signal) => {
      if (settled) return;
      settled = true;
      try {
        const envelope = validateGate2bWorkerCompletion(spec, messages, exitCode, signal);
        validateGate2bWorkerCheckpoint(spec, envelope.result);
        resolve(envelope.result);
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function runGate2bWorker(role: Gate2bRole): Promise<void> {
  const spec = GATE2B_WORKER_SPECS[role];
  const result = growLK(gate2bOptions(spec));
  if (typeof process.send !== "function" || !process.connected) {
    throw new Error(`${spec.label} gate worker requires a connected parent IPC channel`);
  }
  const envelope: Gate2bWorkerEnvelope = {
    kind: "gate2b-v5p-result",
    role: spec.role,
    tempC: spec.tempC,
    checkpointPath: spec.checkpointPath,
    result,
  };
  await new Promise<void>((resolve, reject) => {
    process.send?.(envelope, (error) => {
      if (error !== null) {
        reject(error);
        return;
      }
      process.disconnect?.();
      resolve();
    });
  });
}

/** The flagless Phase 2b protocol v5p, frozen at the pinned concurrent pre-registration. */
async function gate2b(): Promise<void> {
  const failures: string[] = [];
  const executionCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const trackedChanges = execFileSync(
    "git",
    ["status", "--porcelain", "--untracked-files=no"],
    { encoding: "utf8" },
  ).trim();
  let preregistrationIsAncestor = false;
  try {
    execFileSync("git", [
      "merge-base",
      "--is-ancestor",
      GATE2B_PREREGISTRATION,
      executionCommit,
    ]);
    preregistrationIsAncestor = true;
  } catch {
    preregistrationIsAncestor = false;
  }
  validateGate2bProvenance({
    node: process.version,
    v8: process.versions.v8,
    head: executionCommit,
    trackedStatus: trackedChanges,
    preregistrationIsAncestor,
  });
  console.log(
    `gate2b protocol=v5p surfacePolicy=aggregate-hv-g1h1-v5` +
      ` preregistration=${GATE2B_PREREGISTRATION}` +
      ` executionCommit=${executionCommit}` +
      ` node=${GATE2B_NODE} v8=${GATE2B_V8}`,
  );
  const common = gate2bOptions(GATE2B_WORKER_SPECS.plate);
  validateGate2bOutputAbsence(
    Object.values(GATE2B_WORKER_SPECS)
      .map((spec) => spec.checkpointPath)
      .filter((path) => existsSync(path)),
  );
  console.log("=== 2b GATE concurrent pair: -5 C plate + -15 C column ===");
  // Both calls synchronously fork before either returned promise is awaited.
  const platePromise = launchGate2bWorker(GATE2B_WORKER_SPECS.plate);
  const columnPromise = launchGate2bWorker(GATE2B_WORKER_SPECS.column);
  const [plateSettlement, columnSettlement] = await Promise.allSettled([
    platePromise,
    columnPromise,
  ]);
  const plate = plateSettlement.status === "fulfilled" ? plateSettlement.value : null;
  const column = columnSettlement.status === "fulfilled" ? columnSettlement.value : null;
  if (plateSettlement.status === "rejected") {
    failures.push(
      `plate(-5C): worker failed: ${plateSettlement.reason instanceof Error ? plateSettlement.reason.message : String(plateSettlement.reason)}`,
    );
  }
  if (columnSettlement.status === "rejected") {
    failures.push(
      `column(-15C): worker failed: ${columnSettlement.reason instanceof Error ? columnSettlement.reason.message : String(columnSettlement.reason)}`,
    );
  }

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
    if (r.surfacePolicy !== common.surfacePolicy) {
      failures.push(`${label}: ran surface policy ${r.surfacePolicy}, expected ${common.surfacePolicy}`);
    }
    if (
      !Number.isFinite(r.minShellInjection) ||
      !(r.minShellInjection > 0) ||
      !Number.isFinite(r.minSurfaceExchange) ||
      !(r.minSurfaceExchange > 0)
    ) {
      failures.push(
        `${label}: invalid source/exchange minima ` +
          `(shell=${r.minShellInjection}, exchange=${r.minSurfaceExchange})`,
      );
    }
    if (!(r.worstDivergence < common.divTol)) {
      failures.push(`${label}: divergence identity ${r.worstDivergence} not < ${common.divTol}`);
    }
    try {
      validateGate2bDriftSummary(
        r.surfacePolicy,
        r.maxAbsSmootherDrift,
        r.smootherDriftAbsLimit,
      );
    } catch (error) {
      failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!(r.maxKineticFillEver <= common.cfl + 1e-12)) {
      failures.push(`${label}: kinetic fill-CFL bound violated (${r.maxKineticFillEver})`);
    }
    if (!(r.pecletBound < 1e-2)) {
      failures.push(`${label}: quasi-static validity bound Pe ${r.pecletBound} not < 1e-2`);
    }
  };
  if (plate !== null) checkRun("plate(-5C)", plate);
  if (column !== null) checkRun("column(-15C)", column);
  if (plate !== null && !(plate.aspectRatio <= 1 / 1.5)) {
    failures.push(`plate(-5C): AR ${plate.aspectRatio} not <= ${1 / 1.5} — not a plate`);
  }
  if (column !== null && !(column.aspectRatio >= 1.5)) {
    failures.push(`column(-15C): AR ${column.aspectRatio} not >= 1.5 — not a column`);
  }

  if (failures.length > 0) {
    console.error(`2B GATE FAILED (${failures.length} criteria):`);
    for (const f of failures) console.error(`  - ${f}`);
    console.error("2B GATE EXIT STATUS: 1");
    process.exit(1);
  }
  if (plate === null || column === null) {
    throw new Error("gate2b v5p reached an impossible empty-result success path");
  }
  console.log(
    `2B GATE PASSED: habit is an output of temperature alone (same domain, same everything,` +
      ` T only) — AR(-5C)=${fmt(plate.aspectRatio)} (plate), AR(-15C)=${fmt(column.aspectRatio)}` +
      ` (column); every criterion enforced; exit 0 is the evidence.`,
  );
  console.log("2B GATE EXIT STATUS: 0");
}

/**
 * Phase 6 cross-platform reproducibility control, tier 1 — the libm fingerprint.
 *
 * Prints exact float64 bits for every named transcendental-dependent quantity on the historical
 * −2…−30 °C sampled grid, plus a one-line digest and a self-reported host header. The registered
 * −31…−35 °C sweep tail is absent and must be added by R15. Tier 2 (the
 * end-to-end habit runs) is a `grow-lk` invocation and is printed here as the exact command
 * rather than executed, because it costs a full growth run per point and the operator running
 * this on a second machine should decide when to spend that.
 *
 * See docs/phase6-cross-platform-control.md.
 */
function phase6Fixture(): void {
  const entries = phase6LibmFingerprint();
  console.log("PHASE 6 CROSS-PLATFORM CONTROL — tier 1, libm fingerprint");
  console.log(
    `host platform=${process.platform} arch=${process.arch} node=${process.version} ` +
      `v8=${process.versions.v8}`,
  );
  console.log(`entries=${entries.length}`);
  for (const entry of entries) {
    console.log(`  ${entry.name}\t${entry.argument}\t${entry.bits}`);
  }
  console.log(`PHASE6 LIBM DIGEST: ${phase6LibmDigest(entries)}`);
  console.log("");
  console.log("tier 2 — run each of these and compare the habit class, not the digits:");
  const f = PHASE6_CROSSPLATFORM_FIXTURE;
  // Two bugs fixed here 2026-07-29, both found by audit. (1) sigma_inf came from
  // phase6FixtureSigmaInf, which uses the TIER-1 sampling fraction 0.15 for every temperature —
  // wrong for 3 of the 4 tier-2 points, which sit at f = 0.10/0.10/0.25/0.15. It must come from
  // each point's own registered fraction. (2) --param-set was omitted, so an operator pasting
  // these would silently get the CLI default CAK_A1 — the exact defect ADR 0031 exists to fix —
  // and produce a run not comparable to the baseline.
  for (const point of f.points) {
    console.log(
      `  # ${point.label}` +
        `\n  node runner/src/main.ts grow-lk --temp-c ${point.tempC} ` +
        `--sigma-inf ${phase6FixturePointSigmaInf(point.label).toFixed(6)} ` +
        `--dims ${f.dims.nx},${f.dims.ny},${f.dims.nz} --dx-um ${f.dxUm} --cfl ${f.cflFill} ` +
        `--target-extent ${f.targetExtent} --surface-policy ${f.surfacePolicy} ` +
        `--far-field ${f.farField} --param-set ${f.paramSet} --metrics-every 100000`,
    );
  }
  console.log("");
  console.log("--param-set is MANDATORY: omitting it falls back to CAK_A1 and the run is not");
  console.log("comparable to the registered baseline. See docs/phase6-cross-platform-control.md.");
}

const [command, ...rest] = process.argv.slice(2);
if (command === "__gate2b-worker") {
  const role = rest.length === 1 ? rest[0] : null;
  if (role !== "plate" && role !== "column") {
    console.error("internal gate2b worker requires exactly one recognized fixed role");
    process.exit(2);
  }
  try {
    await runGate2bWorker(role);
  } catch (error) {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    process.exitCode = 1;
  }
} else if (command === "grow") {
  grow(parseArgs(rest));
} else if (command === "grow-lk") {
  growLK(parseLKArgs(rest));
} else if (command === "gate2b") {
  if (rest.length > 0) {
    console.error("gate2b takes no flags: the protocol is pinned (pre-registered in the plan)");
    console.error("2B GATE EXIT STATUS: 2");
    process.exit(2);
  }
  try {
    await gate2b();
  } catch (error) {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    console.error("2B GATE EXIT STATUS: 1");
    process.exitCode = 1;
  }
} else if (command === "gate3") {
  if (rest.length > 0) {
    console.error(
      "gate3 takes no flags: the protocol is pinned (registered in the plan, " +
        "phase-3-dev-visualization)",
    );
    console.error("GATE3 EXIT STATUS: 2");
    process.exit(2);
  }
  try {
    gate3();
  } catch (error) {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    console.error("GATE3 EXIT STATUS: 1");
    process.exitCode = 1;
  }
} else if (command === "gate4a") {
  if (rest.length > 0) {
    console.error(
      "gate4a takes no flags: the Phase 4 Pass-A protocol is pinned in " +
        "docs/plans/phase-4-morphology-gauntlet.md",
    );
    console.error("GATE4A EXIT STATUS: 2");
    process.exit(2);
  }
  try {
    process.exitCode = gate4a();
  } catch (error) {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    console.error("GATE4A EXIT STATUS: 1");
    process.exitCode = 1;
  }
} else if (command === "gate4b") {
  if (rest.length > 0) {
    console.error(
      "gate4b takes no flags: the Phase 4 Pass-B protocol is pinned in " +
        "docs/plans/phase-4-morphology-gauntlet.md",
    );
    console.error("GATE4B EXIT STATUS: 2");
    process.exit(2);
  }
  try {
    process.exitCode = gate4b();
  } catch (error) {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    console.error("GATE4B EXIT STATUS: 1");
    process.exitCode = 1;
  }
} else if (command === "gate4") {
  if (rest.length > 0) {
    console.error(
      "gate4 takes no flags: the Phase 4 aggregate protocol is pinned in " +
        "docs/plans/phase-4-morphology-gauntlet.md",
    );
    console.error("GATE4 EXIT STATUS: 2");
    process.exit(2);
  }
  try {
    process.exitCode = gate4();
  } catch (error) {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    console.error("GATE4 EXIT STATUS: 1");
    process.exitCode = 1;
  }
} else if (command === "gate5-lane") {
  if (rest.length > 0) {
    console.error(
      "gate5-lane takes no flags: the Windows/D3D12 protocol is pinned in " +
        "docs/plans/phase-5-gpu-port.md",
    );
    console.error("GATE5-LANE EXIT STATUS: 2");
    process.exit(2);
  }
  try {
    process.exitCode = gate5Lane();
  } catch (error) {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    console.error("GATE5-LANE EXIT STATUS: 1");
    process.exitCode = 1;
  }
} else if (command === "gate5") {
  if (rest.length > 0) {
    console.error(
      "gate5 takes no flags: the Phase 5 aggregate protocol is pinned in " +
        "docs/plans/phase-5-gpu-port.md",
    );
    console.error("GATE5 EXIT STATUS: 2");
    process.exit(2);
  }
  try {
    process.exitCode = gate5();
  } catch (error) {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    console.error("GATE5 EXIT STATUS: 1");
    process.exitCode = 1;
  }
} else if (command === "phase6-sweep" || command === "phase6-sweep-arm2") {
  // ADR 0036. One code path, one operand: the ARM. Everything downstream reads it from the single
  // descriptor rather than re-deciding, so an arm-2 run cannot inherit an arm-1 scorer or write
  // into arm 1's directory.
  const arm = command === "phase6-sweep-arm2" ? PHASE6_ARM2 : PHASE6_ARM1;
  const concurrency = rest.length === 0 ? 7 : Number(rest[0]);
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 64) {
    console.error("usage: node runner/src/main.ts phase6-sweep [concurrency]");
    process.exit(2);
  }
  const preflight = phase6SweepPreflight(process.cwd(), arm);
  console.log(`PHASE 6 SWEEP [${arm.id}] paramSet=${arm.paramSet} — protocol ${preflight.protocolSha256}`);
  console.log(`arm values hash ${preflight.valuesSha256} (GATED) · justification ${preflight.justificationSha256} (reported)`);
  console.log(`head=${preflight.head} node=${preflight.node} v8=${preflight.v8}`);
  if (!preflight.ok) {
    console.error("PREFLIGHT FAILED — no sweep evidence may be produced:");
    for (const failure of preflight.failures) console.error(`  - ${failure}`);
    console.error("PHASE6 SWEEP EXIT STATUS: 2");
    process.exit(2);
  }
  const plan = phase6SweepPlan();
  console.log(`preflight OK; ${plan.length} registered grid points, concurrency ${concurrency}`);
  const outDir = join(process.cwd(), "out", arm.outDirName);
  // REFUSE to write into a directory that already holds evidence. out/ is gitignored, so arm 1's
  // 204 rows exist in no commit: typing `phase6-sweep` when you meant `phase6-sweep-arm2` would
  // destroy 89 core-hours of published evidence irrecoverably, and the two commands differ by one
  // suffix. Found by the arm-2 freeze review; the guard costs one line.
  if (existsSync(join(outDir, "points.json"))) {
    console.error(`REFUSING to run: ${outDir} already contains points.json.`);
    console.error("Move or delete the existing artifact deliberately before re-running this arm.");
    console.error("PHASE6 SWEEP EXIT STATUS: 3");
    process.exit(3);
  }
  mkdirSync(outDir, { recursive: true });
  const scored = await phase6RunSweep({
    concurrency,
    arm,
    repoRoot: process.cwd(),
    // `accumulated` comes FROM the harness. Reading the binding this await assigns would be a
    // temporal dead zone error, because the callback fires while the await is still pending.
    onPoint: ({ done, total, scored: point, accumulated }) => {
      console.log(
        `[${String(done).padStart(3)}/${total}] T=${String(point.point.tempC).padStart(4)} ` +
          `f=${point.point.fraction.toFixed(2)} ${point.modelClass.padEnd(8)} ` +
          `${point.score.padEnd(9)} AR=${Number.isFinite(point.result.aspectRatio) ? point.result.aspectRatio.toFixed(4) : "n/a"} ` +
          `${point.inHeadlineScope ? "headline" : "        "} ` +
          `${point.extentFragile ? "extent-fragile" : ""}` +
          `${point.exclusionReason === null ? "" : `EXCLUDED: ${point.exclusionReason}`} ` +
          `| ${point.result.seconds.toFixed(1)}s`,
      );
      writeFileSync(join(outDir, "points.json"), JSON.stringify(accumulated, null, 1));
    },
  });
  const report = phase6Aggregate(scored, preflight.protocolSha256, preflight.head, arm);
  writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 1));
  writeFileSync(
    join(outDir, "diagram.svg"),
    phase6RenderDiagram(
      scored,
      `${arm.id} · paramSet ${arm.paramSet} · values ${preflight.valuesSha256.slice(0, 12)} · ` +
        `head ${preflight.head.slice(0, 12)} · node ${preflight.node} · ${plan.length} points`,
      arm.diagramLabel,
    ),
  );
  console.log("");
  console.log(
    `HEADLINE (measured class, ${report.headlineTotal} headline-scope points): ` +
      `${report.headlineAgree} agree`,
  );
  console.log(
    `beneath it — neutral ${report.neutralCount}, excluded ${report.excludedCount}, ` +
      `extent-fragile ${report.extentFragileCount}`,
  );
  for (const tally of report.perRegime) {
    console.log(
      `  ${tally.regime.padEnd(20)} ${tally.inHeadline ? "headline" : "reported"} ` +
        `agree=${tally.agree} disagree=${tally.disagree} excluded=${tally.excluded} ` +
        `neutral=${tally.neutralCount}`,
    );
  }
  console.log(`artifacts: ${outDir}`);
  console.log("PHASE6 SWEEP EXIT STATUS: 0");
} else if (command === "phase6-fixture") {
  if (rest.length > 0) {
    console.error(
      "phase6-fixture takes no flags: the fixture is registered in " +
        "runner/src/phase6-crossplatform.ts and a comparison across machines is only " +
        "meaningful if both ran exactly the same thing",
    );
    process.exit(2);
  }
  phase6Fixture();
} else {
  console.error(
    "usage: node runner/src/main.ts grow --preset <name> [options]\n" +
      "       node runner/src/main.ts grow-lk --temp-c <C> --sigma-inf <frac> [options]\n" +
      "       node runner/src/main.ts gate2b\n" +
      "       node runner/src/main.ts gate3\n" +
      "       node runner/src/main.ts gate4a\n" +
      "       node runner/src/main.ts gate4b\n" +
      "       node runner/src/main.ts gate4\n" +
      "       node runner/src/main.ts gate5-lane\n" +
      "       node runner/src/main.ts gate5\n" +
      "       node runner/src/main.ts phase6-fixture\n" +
      "       node runner/src/main.ts phase6-sweep [concurrency]\n" +
      "       node runner/src/main.ts phase6-sweep-arm2 [concurrency]",
  );
  process.exit(2);
}
