// Phase 4 Pass B: the diagnostic LibbrechtKinetics execution-witness protocol.
//
// Importing this module never starts a run. The CLI calls gate4b() with no injectable seams;
// tests use the exported validators, the executeRun seam of runGate4B, or the unregistered
// scenario executor at tiny dims. Execution integrity (B-EXEC-*) is blocking; morphology is
// recorded as diagnostic verdicts and never blocks publication or exit 0.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  STREAM_NOISE_ALPHA_HK,
  alphaHK,
  aspectRatio,
  branchCount,
  cSat,
  cappedColumnProfile,
  cellCount,
  centerRimDepletion,
  classifyFacet,
  createTimelineCursor,
  crossSectionHollowness,
  decodeLKCheckpoint,
  domainCenter,
  encodeLKCheckpoint,
  evaluateTimelineBoundary,
  hexDistance,
  hexSeedSites,
  idx,
  isD6hInvariantSet,
  kineticLength,
  latticeExtents,
  mIce,
  pecletUpperBound,
  randomBit,
  sealedVoidFraction,
  symmetryError,
  validateTimelineSchedule,
  vKin,
  type Dims,
  type LKSurfacePolicy,
  type LKTimelineEnvironment,
  type LKTimelineSchedule,
  type LatticeExtents,
  type TimelineCursor,
  type TimelineEventLogEntry,
} from "@vcc/core";
import { LKSolver } from "@vcc/solver-cpu";
import type { RelaxationReport, SurfaceReport } from "@vcc/solver-cpu";
import {
  canonicalJson,
  canonicalJsonBytes,
  canonicalJsonSha256,
  parseCanonicalJson,
  publishEvidenceBundle,
  rawTypedArraySha256,
  sha256Bytes,
  strictJsonSnapshot,
  type EvidenceArtifactInput,
  type PublishedEvidenceBundle,
  type StrictJson,
} from "./gate4-evidence.ts";
import { collectGate4AProvenance, type Gate4AProvenance } from "./gate4a.ts";
import {
  B_EXECUTION_CRITERIA,
  B_HABIT_TEMPERATURES,
  createPhase4CriterionRecord,
  evaluateBBranch,
  evaluateBDepletion,
  evaluateBHabit,
  evaluateBHollow,
  evaluateBTimeline,
  evaluateGate4B,
  type BExecutionCriterion,
  type BMorphologyCriterion,
  type DepletionSample,
  type Gate4BVerdict,
  type HollowRun,
  type Phase4CriterionRecord,
} from "./gate4-protocol.ts";

export const GATE4B_PROTOCOL = "phase4-pass-b-v1";
export const GATE4B_REPORT_PATH = "gate4b-report.json";
export const GATE4B_MANIFEST_PATH = "manifest.json";
export const GATE4B_CANONICAL_DIRECTORY = "out/phase4/pass-b";
export const GATE4B_NODE = "v24.13.1";
export const GATE4B_V8 = "13.6.233.17-node.40";
export const GATE4B_CRITERIA_FREEZE = "e567767";
export const GATE4B_SURFACE_POLICY: LKSurfacePolicy = "aggregate-hv-g1h1-v4";
export const GATE4B_DIMS: Dims = { nx: 48, ny: 48, nz: 48 };
export const GATE4B_TARGET_LARGEST_EXTENT = 24;
export const GATE4B_STEP_CAP = 50_000;
export const GATE4B_SIGMA_INFINITY = 0.002;
export const GATE4B_BRANCH_SIGMA_INFINITY = 0.01;
export const GATE4B_DX_UM = 0.35;
export const GATE4B_PRESSURE_PA = 101_325;
export const GATE4B_PARAM_SET = "CAK_A1";
export const GATE4B_CFL_FILL = 0.1;
export const GATE4B_RELAX_TOL = 1e-9;
export const GATE4B_DIV_TOL = 1e-7;
export const GATE4B_RELAX_MAX_SWEEPS = 200_000;
export const GATE4B_NOISE_EPSILON = 0.001;
export const GATE4B_DEPLETION_TARGETS = [10, 12, 14, 16, 18, 20, 22, 24] as const;
export const GATE4B_TIMELINE_Z_TRIGGER = 16;
export const GATE4B_TIMELINE_EVENT_TEMP_C = -5;
export const GATE4B_PECLET_BOUND_LIMIT = 1e-2;

export type Gate4BScenario = "habit" | "hollow" | "timeline" | "branch";

export interface Gate4BRunConfig {
  readonly id: string;
  readonly scenario: Gate4BScenario;
  readonly operator: "LibbrechtKinetics";
  readonly backend: "float64-cpu-oracle";
  readonly surfacePolicy: "aggregate-hv-g1h1-v4";
  readonly dims: Dims;
  readonly domain: "hexPrism";
  readonly farField: "dirichlet";
  readonly seedRadius: 2;
  readonly seedThickness: 1;
  readonly tempC: number;
  readonly sigmaInfinity: number;
  readonly dxUm: number;
  readonly pressurePa: number;
  readonly paramSet: "CAK_A1";
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly divTol: number;
  readonly relaxMaxSweeps: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly noiseStreamId: number | null;
  readonly targetLargestExtent: number;
  readonly stepCap: number;
  readonly depletionTargets: readonly number[];
  readonly replayOf: string | null;
  readonly schedule: LKTimelineSchedule | null;
}

export interface Gate4BManifest {
  readonly version: 1;
  readonly protocol: typeof GATE4B_PROTOCOL;
  readonly operator: "LibbrechtKinetics";
  readonly backend: "float64-cpu-oracle";
  readonly precision: "float64";
  readonly canonicalSeedSites: 19;
  readonly surfacePolicy: "aggregate-hv-g1h1-v4";
  readonly criteriaFreeze: string;
  readonly runs: readonly Gate4BRunConfig[];
}

function habitRunId(tempC: number): string {
  return `B-HABIT-TM${String(-tempC).replace(".", "P")}`;
}

function baseRun(
  id: string,
  scenario: Gate4BScenario,
  options: {
    readonly tempC: number;
    readonly sigmaInfinity?: number;
    readonly seed?: number;
    readonly noise?: number;
    readonly depletionTargets?: readonly number[];
    readonly replayOf?: string;
    readonly schedule?: LKTimelineSchedule;
  },
): Gate4BRunConfig {
  const noiseEpsilon = options.noise ?? 0;
  return {
    id,
    scenario,
    operator: "LibbrechtKinetics",
    backend: "float64-cpu-oracle",
    surfacePolicy: GATE4B_SURFACE_POLICY as "aggregate-hv-g1h1-v4",
    dims: GATE4B_DIMS,
    domain: "hexPrism",
    farField: "dirichlet",
    seedRadius: 2,
    seedThickness: 1,
    tempC: options.tempC,
    sigmaInfinity: options.sigmaInfinity ?? GATE4B_SIGMA_INFINITY,
    dxUm: GATE4B_DX_UM,
    pressurePa: GATE4B_PRESSURE_PA,
    paramSet: GATE4B_PARAM_SET,
    cflFill: GATE4B_CFL_FILL,
    relaxTol: GATE4B_RELAX_TOL,
    divTol: GATE4B_DIV_TOL,
    relaxMaxSweeps: GATE4B_RELAX_MAX_SWEEPS,
    rngSeed: options.seed ?? 1,
    noiseEpsilon,
    noiseStreamId: noiseEpsilon > 0 ? STREAM_NOISE_ALPHA_HK : null,
    targetLargestExtent: GATE4B_TARGET_LARGEST_EXTENT,
    stepCap: GATE4B_STEP_CAP,
    depletionTargets: [...(options.depletionTargets ?? [])],
    replayOf: options.replayOf ?? null,
    schedule: options.schedule ?? null,
  };
}

/** Rebuild the frozen manifest from source constants; callers receive fresh owned data. */
export function buildGate4BManifest(): Gate4BManifest {
  const timelineSchedule: LKTimelineSchedule = {
    version: 1,
    mode: "abrupt",
    operator: "LibbrechtKinetics",
    initialEnvironment: { tempC: -15, sigmaInfinity: GATE4B_SIGMA_INFINITY },
    events: [
      {
        index: 0,
        operator: "LibbrechtKinetics",
        trigger: { kind: "zExtent", value: GATE4B_TIMELINE_Z_TRIGGER },
        environment: {
          tempC: GATE4B_TIMELINE_EVENT_TEMP_C,
          sigmaInfinity: GATE4B_SIGMA_INFINITY,
        },
      },
    ],
  };
  const runs: Gate4BRunConfig[] = [
    ...B_HABIT_TEMPERATURES.map((tempC) =>
      baseRun(habitRunId(tempC), "habit", {
        tempC,
        // The -15 C habit endpoint is ALSO the registered B-DEPLETION run.
        depletionTargets: tempC === -15 ? GATE4B_DEPLETION_TARGETS : [],
      }),
    ),
    ...[1, 2, 3].map((seed) =>
      baseRun(`B-HOLLOW-SEED-${seed}`, "hollow", {
        tempC: -15,
        seed,
        noise: GATE4B_NOISE_EPSILON,
      }),
    ),
    baseRun("B-HOLLOW-SEED-1-REPLAY", "hollow", {
      tempC: -15,
      seed: 1,
      noise: GATE4B_NOISE_EPSILON,
      replayOf: "B-HOLLOW-SEED-1",
    }),
    baseRun("B-TIMELINE", "timeline", {
      tempC: -15,
      schedule: timelineSchedule,
    }),
    baseRun("B-BRANCH", "branch", {
      tempC: -5,
      sigmaInfinity: GATE4B_BRANCH_SIGMA_INFINITY,
    }),
  ];
  return strictJsonSnapshot({
    version: 1,
    protocol: GATE4B_PROTOCOL,
    operator: "LibbrechtKinetics",
    backend: "float64-cpu-oracle",
    precision: "float64",
    canonicalSeedSites: 19,
    surfacePolicy: GATE4B_SURFACE_POLICY,
    criteriaFreeze: GATE4B_CRITERIA_FREEZE,
    runs,
  }) as unknown as Gate4BManifest;
}

/** Reviewed freeze: never derive an alleged protocol freeze from the mutable builder. */
export const GATE4B_MANIFEST_SHA256 = "c0ceed5b0ebb68defee85b1d78d52c9563f5edd35ed415b8cfdad57dd7c3e812";

// ── Provenance ─────────────────────────────────────────────────────────────────────────────

export type Gate4BProvenance = Gate4AProvenance;

type ExecFile = typeof execFileSync;

/** Reuse the reviewed Pass-A collector; Pass B validates its own subset of the facts. */
export function collectGate4BProvenance(
  repoRoot = process.cwd(),
  execFile: ExecFile = execFileSync,
): Gate4BProvenance {
  return collectGate4AProvenance(repoRoot, execFile);
}

export function validateGate4BProvenance(provenance: Gate4BProvenance): readonly string[] {
  const failures: string[] = [];
  if (provenance.node !== GATE4B_NODE || provenance.v8 !== GATE4B_V8) {
    failures.push(
      `engine expected Node ${GATE4B_NODE} / V8 ${GATE4B_V8}, got Node ${provenance.node} / V8 ${provenance.v8}`,
    );
  }
  if (!/^[0-9a-f]{40}$/.test(provenance.head)) failures.push("execution HEAD is not 40-hex");
  if (provenance.trackedStatus.trim() !== "") failures.push("tracked worktree is not clean");
  if (!provenance.criteriaFreezeIsAncestor) {
    failures.push(`${GATE4B_CRITERIA_FREEZE} is not an ancestor`);
  }
  return failures;
}

// ── Small shared helpers ───────────────────────────────────────────────────────────────────

function norm0(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function bytesOf(value: Uint8Array | Float64Array): Uint8Array {
  return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

function typedBitsEqual(
  left: Uint8Array | Float64Array,
  right: Uint8Array | Float64Array,
): boolean {
  const leftBytes = bytesOf(left);
  const rightBytes = bytesOf(right);
  if (leftBytes.length !== rightBytes.length) return false;
  for (let index = 0; index < leftBytes.length; index++) {
    if (leftBytes[index] !== rightBytes[index]) return false;
  }
  return true;
}

function deltaBytes(indices: readonly number[]): Uint8Array {
  const bytes = new Uint8Array(indices.length * 4);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < indices.length; index++) {
    const cell = indices[index];
    if (!Number.isSafeInteger(cell) || cell < 0 || cell > 0xffff_ffff) {
      throw new Error("B-EXEC-NUMERIC: attachment delta index is invalid");
    }
    view.setUint32(index * 4, cell, true);
  }
  return bytes;
}

/** Neumaier-compensated accumulator for well-conditioned witness sums. */
class CompensatedSum {
  private sum = 0;
  private compensation = 0;
  add(value: number): void {
    const next = this.sum + value;
    this.compensation += Math.abs(this.sum) >= Math.abs(value)
      ? this.sum - next + value
      : value - next + this.sum;
    this.sum = next;
  }
  value(): number {
    return norm0(this.sum + this.compensation);
  }
}

function hexPrismGeometry(dims: Dims, center: readonly [number, number, number]): {
  readonly radius: number;
  readonly halfZ: number;
} {
  const [ic, jc, kc] = center;
  return {
    radius: Math.min(ic, dims.nx - 1 - ic, jc, dims.ny - 1 - jc),
    halfZ: Math.min(kc, dims.nz - 1 - kc),
  };
}

function hexPrismWallMask(dims: Dims, center: readonly [number, number, number]): Uint8Array {
  const wall = new Uint8Array(cellCount(dims));
  const [ic, jc, kc] = center;
  const { radius, halfZ } = hexPrismGeometry(dims, center);
  for (let k = 0; k < dims.nz; k++) {
    for (let j = 0; j < dims.ny; j++) {
      for (let i = 0; i < dims.nx; i++) {
        if (hexDistance(i - ic, j - jc) > radius || Math.abs(k - kc) > halfZ) {
          wall[idx(dims, i, j, k)] = 1;
        }
      }
    }
  }
  return wall;
}

/** Mirror of the LK Dirichlet shell membership (constructor order is not needed for a set). */
function hexPrismShellMask(dims: Dims, center: readonly [number, number, number]): Uint8Array {
  const shell = new Uint8Array(cellCount(dims));
  const [ic, jc, kc] = center;
  const { radius, halfZ } = hexPrismGeometry(dims, center);
  for (let k = 0; k < dims.nz; k++) {
    for (let j = 0; j < dims.ny; j++) {
      for (let i = 0; i < dims.nx; i++) {
        const dist = hexDistance(i - ic, j - jc);
        const inHex = dist <= radius && Math.abs(k - kc) <= halfZ;
        if (inHex && (dist === radius || Math.abs(k - kc) === halfZ)) {
          shell[idx(dims, i, j, k)] = 1;
        }
      }
    }
  }
  return shell;
}

function canonicalSeedOccupancy(dims: Dims, center: readonly [number, number, number]): Uint8Array {
  const occupancy = new Uint8Array(cellCount(dims));
  for (const site of hexSeedSites(dims, 2, 1, center)) occupancy[site] = 1;
  return occupancy;
}

/** The registered conservative Péclet bound over every environment the run visits. */
export function gate4BRegisteredPecletBound(config: Gate4BRunConfig): number {
  const lengthM = Math.max(config.dims.nx, config.dims.ny, config.dims.nz) * config.dxUm * 1e-6;
  const environments: LKTimelineEnvironment[] = [
    { tempC: config.tempC, sigmaInfinity: config.sigmaInfinity },
    ...(config.schedule?.events.map((event) => event.environment) ?? []),
  ];
  let bound = 0;
  for (const environment of environments) {
    const value = pecletUpperBound(
      environment.tempC,
      environment.sigmaInfinity,
      lengthM,
      config.pressurePa,
    );
    if (!Number.isFinite(value)) return Number.NaN;
    if (value > bound) bound = value;
  }
  return bound;
}

// ── Run evidence types ─────────────────────────────────────────────────────────────────────

export interface Gate4BStepRow {
  readonly step: number;
  readonly attachedCount: number;
  readonly iExtent: number;
  readonly jExtent: number;
  readonly tExtent: number;
  readonly zExtent: number;
  readonly largestExtent: number;
  readonly deltaCount: number;
  readonly deltaSha256: string;
  readonly deltaSymmetric: boolean | null;
  readonly sweeps: number;
  readonly residual: number;
  readonly shellInjection: number;
  readonly surfaceExchange: number;
  readonly divergenceResidual: number;
  readonly deltaTimeSeconds: number;
  readonly simTimeSeconds: number;
  readonly maxKineticFillIncrement: number;
  readonly holeFillCount: number;
  /** Runner-reconstructed per-step deltas bound to the raw f field during execution. */
  readonly deltaPlacedFill: number;
  readonly deltaSaturationClippedFill: number;
  readonly deltaHoleFillDeficit: number;
  /** Independent per-boundary-pixel Hertz-Knudsen demand recomputed by the runner. */
  readonly independentDemand: number;
  readonly tempC: number;
  readonly sigmaInfinity: number;
}

export interface Gate4BDeltaWitness {
  readonly step: number;
  readonly indices: readonly number[];
}

export interface Gate4BExtentCrossing {
  readonly previousStep: number;
  readonly crossingStep: number;
  readonly previousExtents: LatticeExtents;
  readonly crossingExtents: LatticeExtents;
}

export interface Gate4BNoiseWitnessCell {
  readonly index: number;
  readonly nT: number;
  readonly nZ: number;
  readonly sigmaOpp: number;
  readonly sigmaBoundary: number;
  readonly cachedAlphaHK: number;
}

export interface Gate4BNoiseWitness {
  readonly version: 1;
  readonly runId: string;
  /** Completed steps when the witness relaxation was accepted (the PRNG tick input). */
  readonly tick: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly streamId: number;
  readonly tempC: number;
  readonly sigmaInfinity: number;
  readonly dxUm: number;
  readonly pressurePa: number;
  readonly paramSet: "CAK_A1";
  readonly surfacePolicy: "aggregate-hv-g1h1-v4";
  readonly cells: readonly Gate4BNoiseWitnessCell[];
}

export interface Gate4BTimelineEvidence {
  readonly schedule: LKTimelineSchedule;
  readonly eventLog: readonly TimelineEventLogEntry[];
  readonly transitionReport: StrictJson;
  readonly eventStep: number;
  readonly sigmaBefore: Float64Array;
  readonly sigmaAfter: Float64Array;
  readonly aHashAtEvent: string;
  readonly fHashBefore: string;
  readonly fHashAfter: string;
}

export interface Gate4BRunResult {
  readonly config: Gate4BRunConfig;
  readonly registeredConfigSha256: string;
  readonly executionId: string;
  readonly initialOccupancy: Uint8Array;
  readonly seedSymmetric: boolean;
  readonly rows: readonly Gate4BStepRow[];
  readonly deltas: readonly Gate4BDeltaWitness[];
  readonly depletionSamples: readonly DepletionSample[];
  readonly stopReason: string;
  readonly extentCrossing: Gate4BExtentCrossing | null;
  readonly previousOccupancy: Uint8Array | null;
  readonly finalA: Uint8Array;
  readonly finalF: Float64Array;
  readonly finalSigma: Float64Array;
  readonly finalFillLedger: number;
  readonly finalSaturationClippedFill: number;
  readonly finalHoleFillDeficit: number;
  readonly finalVaporUnits: number;
  readonly finalHoleFillCountTotal: number;
  readonly pecletBound: number;
  readonly checkpoint: Uint8Array;
  readonly noiseWitness: Gate4BNoiseWitness | null;
  readonly timeline: Gate4BTimelineEvidence | null;
}

// ── Independent kinetics mirrors ───────────────────────────────────────────────────────────

/**
 * Independent per-cell fill rate mirroring the v4 interface arithmetic exactly:
 * facet class from raw counts, core alphaHK at the raw-field boundary value, the identical
 * noise multiplier, then velocity/dx with H_b = 1 (attachment-kinetics section 4.4).
 */
function independentKineticRate(
  config: Gate4BRunConfig,
  tempC: number,
  vKinMS: number,
  dxM: number,
  tick: number,
  cellIndex: number,
  nT: number,
  nZ: number,
  sigmaBoundary: number,
): number {
  const facet = classifyFacet(nT, nZ, config.surfacePolicy);
  let coefficient = alphaHK(facet, tempC, sigmaBoundary, config.paramSet);
  if (config.noiseEpsilon > 0) {
    coefficient *=
      1 - config.noiseEpsilon * randomBit(config.rngSeed, cellIndex, tick, STREAM_NOISE_ALPHA_HK);
  }
  const velocity = coefficient * vKinMS * sigmaBoundary;
  return velocity / dxM;
}

/**
 * Independent Pass-B noise witness verification (registered B-EXEC-NOISE arithmetic): the
 * unperturbed coefficient and expected applied value are recomputed from core kinetics and
 * the counter PRNG; the cached boundary coefficient and the aggregate Robin closure are then
 * checked against the registered tolerances, and both PRNG outcomes must occur on
 * positive-demand boundary cells.
 */
export function validateGate4BNoiseWitness(
  witness: Gate4BNoiseWitness,
  config: Gate4BRunConfig,
): readonly string[] {
  const failures: string[] = [];
  const push = (message: string): void => {
    if (failures.length < 8) failures.push(message);
  };
  if (witness.version !== 1) push("noise witness version must be 1");
  if (witness.runId !== config.id) push("noise witness run id mismatch");
  if (witness.streamId !== STREAM_NOISE_ALPHA_HK) {
    push(`noise witness stream must be the pinned alphaHK stream ${STREAM_NOISE_ALPHA_HK}`);
  }
  if (witness.rngSeed !== config.rngSeed) push("noise witness rngSeed mismatch");
  if (!(witness.noiseEpsilon > 0) || witness.noiseEpsilon !== config.noiseEpsilon) {
    push("noise witness epsilon is off or mismatched");
  }
  if (config.schedule === null && witness.tempC !== config.tempC) {
    push("noise witness temperature differs from the registered run");
  }
  if (witness.sigmaInfinity !== config.sigmaInfinity) push("noise witness sigmaInfinity mismatch");
  if (witness.dxUm !== config.dxUm || witness.pressurePa !== config.pressurePa) {
    push("noise witness grid/pressure controls mismatch");
  }
  if (witness.paramSet !== config.paramSet) push("noise witness parameter set mismatch");
  if (witness.surfacePolicy !== config.surfacePolicy) push("noise witness surface policy mismatch");
  if (
    !Number.isSafeInteger(witness.tick) ||
    witness.tick < 0 ||
    witness.tick >= config.stepCap
  ) {
    push("noise witness tick is out of the registered range");
  }
  if (witness.cells.length === 0) push("noise witness has no boundary cells");
  const dxM = witness.dxUm * 1e-6;
  const x0M = kineticLength(witness.tempC, witness.pressurePa);
  const ratio = dxM / x0M;
  const seen = new Set<number>();
  let zeroOutcomes = 0;
  let oneOutcomes = 0;
  const n = cellCount(config.dims);
  for (const cell of witness.cells) {
    if (failures.length >= 8) break;
    if (
      !Number.isSafeInteger(cell.index) || cell.index < 0 || cell.index >= n ||
      seen.has(cell.index)
    ) {
      push(`noise witness cell index ${String(cell.index)} is invalid or duplicated`);
      continue;
    }
    seen.add(cell.index);
    if (
      !Number.isSafeInteger(cell.nT) || cell.nT < 0 || cell.nT > 6 ||
      !Number.isSafeInteger(cell.nZ) || cell.nZ < 0 || cell.nZ > 2 ||
      (cell.nT === 0 && cell.nZ === 0)
    ) {
      push(`noise witness cell ${cell.index} has invalid boundary counts`);
      continue;
    }
    if (
      !Number.isFinite(cell.sigmaOpp) ||
      !Number.isFinite(cell.sigmaBoundary) ||
      !Number.isFinite(cell.cachedAlphaHK) ||
      cell.cachedAlphaHK < 0 ||
      cell.cachedAlphaHK > 1
    ) {
      push(`noise witness cell ${cell.index} carries nonfinite or out-of-range values`);
      continue;
    }
    const facet = classifyFacet(cell.nT, cell.nZ, witness.surfacePolicy);
    const bit = randomBit(witness.rngSeed, cell.index, witness.tick, witness.streamId);
    const base = alphaHK(facet, witness.tempC, cell.sigmaBoundary, witness.paramSet);
    const expected = base * (1 - witness.noiseEpsilon * bit);
    if (!(Math.abs(cell.cachedAlphaHK - expected) <= 8 * Number.EPSILON * Math.max(1, Math.abs(expected)))) {
      push(
        `noise witness cell ${cell.index} cached coefficient ${cell.cachedAlphaHK} does not ` +
          `match the expected applied value ${expected}`,
      );
      continue;
    }
    const solved = cell.sigmaOpp / (1 + expected * ratio);
    if (!(Math.abs(cell.sigmaBoundary - solved) <= 1e-12 * Math.max(1, Math.abs(cell.sigmaOpp)))) {
      push(
        `noise witness cell ${cell.index} does not close the aggregate Robin equation with ` +
          `the expected applied coefficient`,
      );
      continue;
    }
    if (expected > 0 && cell.sigmaBoundary > 0) {
      if (bit === 0) zeroOutcomes++;
      else oneOutcomes++;
    }
  }
  if (failures.length === 0 && (zeroOutcomes === 0 || oneOutcomes === 0)) {
    push(
      `noise witness lacks both PRNG outcomes on positive-demand boundary cells ` +
        `(zero=${zeroOutcomes}, one=${oneOutcomes})`,
    );
  }
  return failures;
}

// ── Timeline transition mirror (ADR 0011) ──────────────────────────────────────────────────

export interface Gate4BTimelineExpectation {
  readonly report: StrictJson;
  readonly sigmaAfter: Float64Array;
}

/**
 * Independent mirror of LKSolver.applyTimelineEnvironment: the density transform
 * sigmaNew = (1 + sigmaOld) * cSat(oldT) / cSat(newT) - 1 over active unattached cells with
 * identical arithmetic, compensation, and iteration order, plus the derived-scale and
 * reservoir blocks. Attached and wall cells are excluded; negative results are preserved.
 */
export function gate4BTimelineTransitionExpectation(
  config: Gate4BRunConfig,
  occupancyAtEvent: Uint8Array,
  sigmaBefore: Float64Array,
  beforeEnvironment: LKTimelineEnvironment,
  afterEnvironment: LKTimelineEnvironment,
  eventStep: number,
  simTimeSeconds: number,
): Gate4BTimelineExpectation {
  const dims = config.dims;
  const n = cellCount(dims);
  if (occupancyAtEvent.length !== n || sigmaBefore.length !== n) {
    throw new Error("B-EXEC-TERMINATION: timeline witness field lengths are invalid");
  }
  const center = domainCenter(dims);
  const wall = hexPrismWallMask(dims, center);
  const shell = hexPrismShellMask(dims, center);
  const dxM = config.dxUm * 1e-6;
  const scales = (environment: LKTimelineEnvironment) => {
    const cSatPerCubicMeter = cSat(environment.tempC);
    const vKinMS = vKin(environment.tempC);
    const x0M = kineticLength(environment.tempC, config.pressurePa);
    const mIceLedger = mIce(environment.tempC);
    const maximumKineticVelocityScaleMS = 6 * vKinMS * environment.sigmaInfinity;
    return {
      cSatPerCubicMeter,
      vKinMS,
      x0M,
      mIceLedger,
      maximumKineticVelocityScaleMS,
      maximumKineticFillRateScalePerSecond: maximumKineticVelocityScaleMS / dxM,
    };
  };
  const derivedBefore = scales(beforeEnvironment);
  const derivedAfter = scales(afterEnvironment);
  const temperatureChanged = !Object.is(afterEnvironment.tempC, beforeEnvironment.tempC);
  const cSatRatioOldToNew = derivedBefore.cSatPerCubicMeter / derivedAfter.cSatPerCubicMeter;

  const sigmaAfter = sigmaBefore.slice();
  let activeUnattachedCellCount = 0;
  let activeUnattachedShellCellCount = 0;
  let sumBefore = 0;
  let sumBeforeCompensation = 0;
  let sumAfter = 0;
  let sumAfterCompensation = 0;
  let maxAbsoluteError = 0;
  let maxRelativeError = 0;
  for (let index = 0; index < n; index++) {
    if (occupancyAtEvent[index] === 1 || wall[index] === 1) continue;
    const sigmaOld = sigmaBefore[index];
    if (!Number.isFinite(sigmaOld) || sigmaOld < -1) {
      throw new Error(
        `B-EXEC-TERMINATION: timeline witness sigma[${index}] is invalid before the event`,
      );
    }
    activeUnattachedCellCount++;
    if (shell[index] === 1) activeUnattachedShellCellCount++;
    const densityBefore = (1 + sigmaOld) * derivedBefore.cSatPerCubicMeter;
    const sigmaNew = temperatureChanged
      ? (1 + sigmaOld) * derivedBefore.cSatPerCubicMeter / derivedAfter.cSatPerCubicMeter - 1
      : sigmaOld;
    sigmaAfter[index] = sigmaNew;
    const densityAfter = (1 + sigmaNew) * derivedAfter.cSatPerCubicMeter;
    {
      const next = sumBefore + densityBefore;
      sumBeforeCompensation += Math.abs(sumBefore) >= Math.abs(densityBefore)
        ? sumBefore - next + densityBefore
        : densityBefore - next + sumBefore;
      sumBefore = next;
    }
    {
      const next = sumAfter + densityAfter;
      sumAfterCompensation += Math.abs(sumAfter) >= Math.abs(densityAfter)
        ? sumAfter - next + densityAfter
        : densityAfter - next + sumAfter;
      sumAfter = next;
    }
    const absoluteError = Math.abs(densityAfter - densityBefore);
    const relativeError = absoluteError / Math.max(Math.abs(densityBefore), 1e-300);
    if (absoluteError > maxAbsoluteError) maxAbsoluteError = absoluteError;
    if (relativeError > maxRelativeError) maxRelativeError = relativeError;
  }
  sumBefore += sumBeforeCompensation;
  sumAfter += sumAfterCompensation;
  const transformedCellCount = temperatureChanged ? activeUnattachedCellCount : 0;
  const transformedDirichletShellCellCount =
    temperatureChanged && config.farField === "dirichlet" ? activeUnattachedShellCellCount : 0;
  const report = strictJsonSnapshot({
    operator: "LibbrechtKinetics",
    boundary: {
      phase: "completedCycleBoundary",
      completedCycles: eventStep,
      tick: eventStep,
      simTimeSeconds,
    },
    beforeEnvironment: {
      tempC: beforeEnvironment.tempC,
      sigmaInfinity: beforeEnvironment.sigmaInfinity,
    },
    afterEnvironment: {
      tempC: afterEnvironment.tempC,
      sigmaInfinity: afterEnvironment.sigmaInfinity,
    },
    densityTransform: {
      temperatureChanged,
      cSatRatioOldToNew,
      activeUnattachedCellCount,
      transformedCellCount,
      transformedInteriorCellCount: transformedCellCount - transformedDirichletShellCellCount,
      transformedDirichletShellCellCount,
      absoluteNumberDensitySumBefore: sumBefore,
      absoluteNumberDensitySumAfter: sumAfter,
      maxCellAbsoluteNumberDensityError: maxAbsoluteError,
      maxCellRelativeNumberDensityError: maxRelativeError,
    },
    reservoir: {
      farField: config.farField,
      activeUnattachedShellCellCount,
      shellReclampPending: config.farField === "dirichlet",
      shellClampTargetBefore: beforeEnvironment.sigmaInfinity,
      shellClampTargetAfter: afterEnvironment.sigmaInfinity,
    },
    derivedBefore,
    derivedAfter,
  });
  return { report, sigmaAfter };
}

// ── Timeline witness binary codec ──────────────────────────────────────────────────────────

const TIMELINE_WITNESS_MAGIC = "VCCG4BT1";
const encoder = new TextEncoder();

export interface Gate4BTimelineWitnessBinary {
  readonly runId: string;
  readonly eventStep: number;
  readonly dims: Dims;
  readonly beforeEnvironment: LKTimelineEnvironment;
  readonly afterEnvironment: LKTimelineEnvironment;
  readonly sigmaBefore: Float64Array;
  readonly sigmaAfter: Float64Array;
}

function writeF64(target: Uint8Array, offset: number, values: Float64Array): number {
  const view = new DataView(target.buffer, target.byteOffset, target.byteLength);
  for (let index = 0; index < values.length; index++) {
    view.setFloat64(offset + index * 8, values[index], true);
  }
  return offset + values.length * 8;
}

function readF64(source: Uint8Array, offset: number, length: number): Float64Array {
  const view = new DataView(source.buffer, source.byteOffset, source.byteLength);
  const values = new Float64Array(length);
  for (let index = 0; index < length; index++) {
    values[index] = view.getFloat64(offset + index * 8, true);
  }
  return values;
}

export function encodeGate4BTimelineWitness(witness: Gate4BTimelineWitnessBinary): Uint8Array {
  const n = cellCount(witness.dims);
  if (witness.sigmaBefore.length !== n || witness.sigmaAfter.length !== n) {
    throw new Error("timeline witness field lengths do not match dims");
  }
  const header = {
    version: 1,
    runId: witness.runId,
    eventStep: witness.eventStep,
    dims: witness.dims,
    beforeEnvironment: witness.beforeEnvironment,
    afterEnvironment: witness.afterEnvironment,
    fields: [
      { name: "sigmaBefore", dtype: "f64", length: n },
      { name: "sigmaAfter", dtype: "f64", length: n },
    ],
  };
  const headerBytes = canonicalJsonBytes(header);
  const output = new Uint8Array(12 + headerBytes.length + 16 * n);
  output.set(encoder.encode(TIMELINE_WITNESS_MAGIC), 0);
  new DataView(output.buffer).setUint32(8, headerBytes.length, true);
  output.set(headerBytes, 12);
  let offset = 12 + headerBytes.length;
  offset = writeF64(output, offset, witness.sigmaBefore);
  writeF64(output, offset, witness.sigmaAfter);
  return output;
}

function jsonObject(value: StrictJson, label: string): { readonly [key: string]: StrictJson } {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as { readonly [key: string]: StrictJson };
}

function jsonInteger(
  record: { readonly [key: string]: StrictJson },
  name: string,
  minimum: number,
): number {
  const value = record[name];
  if (!Number.isSafeInteger(value) || (value as number) < minimum) {
    throw new Error(`timeline witness ${name} is invalid`);
  }
  return value as number;
}

export function decodeGate4BTimelineWitness(bytes: Uint8Array): Gate4BTimelineWitnessBinary {
  if (!(bytes instanceof Uint8Array) || bytes.length < 12) {
    throw new Error("timeline witness is truncated");
  }
  if (new TextDecoder().decode(bytes.subarray(0, 8)) !== TIMELINE_WITNESS_MAGIC) {
    throw new Error("timeline witness magic is invalid");
  }
  const headerLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    .getUint32(8, true);
  if (headerLength <= 0 || 12 + headerLength > bytes.length) {
    throw new Error("timeline witness header length is invalid");
  }
  const header = jsonObject(
    parseCanonicalJson(bytes.subarray(12, 12 + headerLength), "timeline witness header"),
    "timeline witness header",
  );
  const expectedKeys = [
    "afterEnvironment", "beforeEnvironment", "dims", "eventStep", "fields", "runId", "version",
  ];
  const keys = Object.keys(header).sort();
  if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])) {
    throw new Error("timeline witness header keys are invalid");
  }
  if (header.version !== 1) throw new Error("timeline witness version is invalid");
  if (typeof header.runId !== "string" || header.runId.length === 0) {
    throw new Error("timeline witness runId is invalid");
  }
  const dimsRecord = jsonObject(header.dims, "timeline witness dims");
  if (Object.keys(dimsRecord).sort().join(",") !== "nx,ny,nz") {
    throw new Error("timeline witness dims keys are invalid");
  }
  const dims: Dims = {
    nx: jsonInteger(dimsRecord, "nx", 1),
    ny: jsonInteger(dimsRecord, "ny", 1),
    nz: jsonInteger(dimsRecord, "nz", 1),
  };
  const n = cellCount(dims);
  const environment = (value: StrictJson, label: string): LKTimelineEnvironment => {
    const record = jsonObject(value, label);
    if (Object.keys(record).sort().join(",") !== "sigmaInfinity,tempC") {
      throw new Error(`${label} keys are invalid`);
    }
    const tempC = record.tempC;
    const sigmaInfinity = record.sigmaInfinity;
    if (typeof tempC !== "number" || typeof sigmaInfinity !== "number") {
      throw new Error(`${label} values are invalid`);
    }
    return { tempC, sigmaInfinity };
  };
  const expectedFields = [
    { dtype: "f64", length: n, name: "sigmaBefore" },
    { dtype: "f64", length: n, name: "sigmaAfter" },
  ];
  if (canonicalJson(header.fields) !== canonicalJson(expectedFields)) {
    throw new Error("timeline witness field table is invalid");
  }
  if (bytes.length !== 12 + headerLength + 16 * n) {
    throw new Error("timeline witness payload length is invalid");
  }
  const sigmaBefore = readF64(bytes, 12 + headerLength, n);
  const sigmaAfter = readF64(bytes, 12 + headerLength + 8 * n, n);
  return {
    runId: header.runId,
    eventStep: jsonInteger(header, "eventStep", 1),
    dims,
    beforeEnvironment: environment(header.beforeEnvironment, "timeline witness beforeEnvironment"),
    afterEnvironment: environment(header.afterEnvironment, "timeline witness afterEnvironment"),
    sigmaBefore,
    sigmaAfter,
  };
}

// ── Per-step report validation ─────────────────────────────────────────────────────────────

interface ValidatedRelaxation {
  readonly sweeps: number;
  readonly residual: number;
  readonly shellInjection: number;
  readonly surfaceExchange: number;
  readonly divergenceResidual: number;
}

/** Registered B-EXEC-CONVERGENCE arithmetic over one relaxation report. */
function validateGate4BRelaxation(
  runId: string,
  step: number,
  relaxTol: number,
  divTol: number,
  relaxMaxSweeps: number,
  relaxation: RelaxationReport,
): ValidatedRelaxation {
  const fail = (message: string): never => {
    throw new Error(`B-EXEC-CONVERGENCE: ${runId} step ${step} ${message}`);
  };
  if (relaxation.converged !== true) fail(`relaxation did not converge (sweeps=${relaxation.sweeps})`);
  if (
    !Number.isSafeInteger(relaxation.sweeps) ||
    relaxation.sweeps < 1 ||
    relaxation.sweeps > relaxMaxSweeps
  ) {
    fail(`sweep count ${String(relaxation.sweeps)} is outside [1, ${relaxMaxSweeps}]`);
  }
  const residual = relaxation.residual;
  if (residual === null || !Number.isFinite(residual) || residual < 0 || !(residual < relaxTol)) {
    fail(`residual ${String(residual)} is not finite in [0, ${relaxTol})`);
  }
  const shell = relaxation.shellClampDiagnostic;
  if (shell === null || !Number.isFinite(shell) || !(shell > 0)) {
    fail(`shell injection ${String(shell)} is not finite and positive`);
  }
  const exchange = relaxation.surfaceExchangeDiagnostic;
  if (exchange === null || !Number.isFinite(exchange)) {
    fail(`signed net surface exchange ${String(exchange)} is not finite`);
  }
  const reported = relaxation.divergenceResidual;
  if (reported === null || !Number.isFinite(reported) || reported < 0) {
    fail(`reported divergence ${String(reported)} is not finite and nonnegative`);
  }
  const recomputed =
    Math.abs((shell as number) - (exchange as number)) /
    Math.max(Math.abs(exchange as number), 1e-300);
  if (
    !Number.isFinite(recomputed) ||
    Math.abs((reported as number) - recomputed) >
      8 * Number.EPSILON * Math.max(1, reported as number, recomputed)
  ) {
    fail(`reported divergence ${String(reported)} disagrees with recomputed ${recomputed}`);
  }
  if (!(recomputed < divTol)) {
    fail(`recomputed divergence ${recomputed} did not satisfy divTol ${divTol}`);
  }
  return {
    sweeps: relaxation.sweeps,
    residual: norm0(residual as number),
    shellInjection: norm0(shell as number),
    surfaceExchange: norm0(exchange as number),
    divergenceResidual: norm0(reported as number),
  };
}

/** Registered B-EXEC-SURFACE bounds over one interface report. */
function validateGate4BSurface(
  runId: string,
  step: number,
  cflFill: number,
  surface: SurfaceReport,
): { readonly deltaTimeSeconds: number; readonly maxKineticFillIncrement: number } {
  const fail = (message: string): never => {
    throw new Error(`B-EXEC-SURFACE: ${runId} step ${step} ${message}`);
  };
  if (surface.skippedUnconverged) fail("skipped an unconverged advance");
  if (surface.stalled) fail("stalled with no positive kinetic demand");
  const deltaTime = surface.deltaTimeSeconds;
  if (deltaTime === null || !Number.isFinite(deltaTime) || !(deltaTime > 0)) {
    fail(`interface timestep ${String(deltaTime)} is not finite and positive`);
  }
  const kinetic = surface.maxKineticFillIncrement;
  if (
    kinetic === null || !Number.isFinite(kinetic) || !(kinetic > 0) ||
    !(kinetic <= cflFill + 1e-12)
  ) {
    fail(`max kinetic fill increment ${String(kinetic)} violates (0, ${cflFill} + 1e-12]`);
  }
  if (!Number.isSafeInteger(surface.holeFillCount) || surface.holeFillCount < 0) {
    fail(`hole-fill count ${String(surface.holeFillCount)} is invalid`);
  }
  if (!Number.isSafeInteger(surface.attachedNow) || surface.attachedNow < 0) {
    fail(`attachedNow ${String(surface.attachedNow)} is invalid`);
  }
  return {
    deltaTimeSeconds: deltaTime as number,
    maxKineticFillIncrement: kinetic as number,
  };
}

// ── Scenario execution ─────────────────────────────────────────────────────────────────────

export interface ExecuteGate4BRunOptions {
  readonly onProgress?: (runId: string, step: number, attached: number) => void;
  /** Liveness only: forwarded to the solver's relaxation progress reporting. */
  readonly onRelaxation?: (
    runId: string,
    step: number,
    sweeps: number,
    residual: number,
    divergenceResidual: number | null,
  ) => void;
}

function stageGate4BNoiseWitness(
  config: Gate4BRunConfig,
  solver: LKSolver,
  environment: LKTimelineEnvironment,
): Gate4BNoiseWitness | null {
  const tick = solver.tick;
  const cells: Gate4BNoiseWitnessCell[] = [];
  let zeroOutcomes = 0;
  let oneOutcomes = 0;
  for (const index of solver.boundaryCells()) {
    const state = solver.boundaryState(index);
    const [nT, nZ] = solver.neighborCounts(index);
    cells.push({
      index,
      nT,
      nZ,
      sigmaOpp: norm0(state.sigmaOpp),
      sigmaBoundary: norm0(state.sigmaBoundary),
      cachedAlphaHK: norm0(state.alphaHKBoundary),
    });
    if (state.alphaHKBoundary > 0 && state.sigmaBoundary > 0) {
      if (randomBit(config.rngSeed, index, tick, STREAM_NOISE_ALPHA_HK) === 0) zeroOutcomes++;
      else oneOutcomes++;
    }
  }
  if (zeroOutcomes === 0 || oneOutcomes === 0) return null;
  return {
    version: 1,
    runId: config.id,
    tick,
    rngSeed: config.rngSeed,
    noiseEpsilon: config.noiseEpsilon,
    streamId: STREAM_NOISE_ALPHA_HK,
    tempC: environment.tempC,
    sigmaInfinity: environment.sigmaInfinity,
    dxUm: config.dxUm,
    pressurePa: config.pressurePa,
    paramSet: config.paramSet,
    surfacePolicy: config.surfacePolicy,
    cells,
  };
}

/**
 * Execute one LK run with independently recomputed per-step witnesses. This function does not
 * check the frozen manifest — executeGate4BRun (the only path the flagless CLI reaches) does.
 * It never writes files. Any violated execution witness throws by its stable criterion name.
 */
export function executeGate4BScenario(
  configInput: Gate4BRunConfig,
  options: ExecuteGate4BRunOptions = {},
): Gate4BRunResult {
  const config = strictJsonSnapshot(configInput) as unknown as Gate4BRunConfig;
  const registeredConfigSha256 = canonicalJsonSha256(config);
  const center = domainCenter(config.dims);
  if (config.schedule !== null) validateTimelineSchedule(config.schedule);
  const solver = new LKSolver({
    surfacePolicy: config.surfacePolicy,
    dims: config.dims,
    tempC: config.tempC,
    sigmaInfinity: config.sigmaInfinity,
    dxUm: config.dxUm,
    pressurePa: config.pressurePa,
    paramSet: config.paramSet,
    cflFill: config.cflFill,
    relaxTol: config.relaxTol,
    divTol: config.divTol,
    relaxMaxSweeps: config.relaxMaxSweeps,
    rngSeed: config.rngSeed,
    noiseEpsilon: config.noiseEpsilon,
    domain: config.domain,
    farField: config.farField,
    seedRadius: config.seedRadius,
    seedThickness: config.seedThickness,
    center,
  });
  const expectedSeed = canonicalSeedOccupancy(config.dims, center);
  if (solver.attachedCount !== 19 || !typedBitsEqual(solver.a, expectedSeed)) {
    throw new Error(`B-EXEC-CONFIG: ${config.id} seed is not the canonical 19-site prism`);
  }
  const seedSymmetric = symmetryError(solver.a, config.dims, center) === 0;
  if (!seedSymmetric) throw new Error(`B-EXEC-SYMMETRY: ${config.id} seed is asymmetric`);
  const initialOccupancy = solver.a.slice();
  const dxM = config.dxUm * 1e-6;

  let environment: LKTimelineEnvironment = {
    tempC: config.tempC,
    sigmaInfinity: config.sigmaInfinity,
  };
  let vKinNow = vKin(environment.tempC);

  let timelineCursor: TimelineCursor | null = null;
  if (config.schedule !== null) {
    if (canonicalJson(config.schedule.initialEnvironment) !== canonicalJson(environment)) {
      throw new Error(
        `B-EXEC-CONFIG: ${config.id} timeline initial environment differs from run controls`,
      );
    }
    timelineCursor = createTimelineCursor(config.schedule);
    const initialDecision = evaluateTimelineBoundary(config.schedule, timelineCursor, {
      phase: "initial",
      completedCycles: 0,
    });
    if (initialDecision.event !== null) {
      throw new Error(`B-EXEC-TERMINATION: ${config.id} timeline fired before growth`);
    }
    timelineCursor = initialDecision.cursor;
  }

  const rows: Gate4BStepRow[] = [];
  const deltas: Gate4BDeltaWitness[] = [];
  const depletionSamples: DepletionSample[] = [];
  let nextDepletion = 0;
  let stopReason = "step-cap";
  let extentCrossing: Gate4BExtentCrossing | null = null;
  let previousOccupancy: Uint8Array | null = null;
  let noiseWitness: Gate4BNoiseWitness | null = null;
  let timelineTransition: Omit<Gate4BTimelineEvidence, "eventLog"> | null = null;
  let previousExtents = latticeExtents(initialOccupancy, config.dims) as LatticeExtents;
  let previousSimTime = 0;
  let previousFillLedger = 0;
  let previousClipped = 0;
  let previousDeficit = 0;

  for (let step = 1; step <= config.stepCap; step++) {
    const onRelaxation = options.onRelaxation;
    const relaxation = solver.relaxField(
      onRelaxation === undefined
        ? undefined
        : (progress) => onRelaxation(
            config.id,
            step,
            progress.sweeps,
            progress.residual,
            progress.divergenceResidual,
          ),
    );
    const convergence = validateGate4BRelaxation(
      config.id,
      step,
      config.relaxTol,
      config.divTol,
      config.relaxMaxSweeps,
      relaxation,
    );
    if (
      !Object.is(solver.tempC, environment.tempC) ||
      !Object.is(solver.sigmaInfinity, environment.sigmaInfinity)
    ) {
      throw new Error(`B-EXEC-NUMERIC: ${config.id} solver environment drifted at step ${step}`);
    }
    if (config.noiseEpsilon > 0 && noiseWitness === null) {
      const staged = stageGate4BNoiseWitness(config, solver, environment);
      if (staged !== null) {
        const witnessFailures = validateGate4BNoiseWitness(staged, config);
        if (witnessFailures.length > 0) {
          throw new Error(`B-EXEC-NOISE: ${config.id} ${witnessFailures[0]}`);
        }
        noiseWitness = staged;
      }
    }

    // Pre-advance raw snapshot: boundary list, fill state, raw counts, and the raw-field
    // aggregate boundary values that define this step's independent kinetic demand.
    const boundary = [...solver.boundaryCells()];
    const fBefore = new Float64Array(boundary.length);
    const ntArr = new Uint8Array(boundary.length);
    const nzArr = new Uint8Array(boundary.length);
    const rates = new Float64Array(boundary.length);
    const tickAtRelaxation = solver.tick;
    for (let bi = 0; bi < boundary.length; bi++) {
      const x = boundary[bi];
      fBefore[bi] = solver.f[x];
      const [nT, nZ] = solver.neighborCounts(x);
      ntArr[bi] = nT;
      nzArr[bi] = nZ;
      rates[bi] = independentKineticRate(
        config,
        environment.tempC,
        vKinNow,
        dxM,
        tickAtRelaxation,
        x,
        nT,
        nZ,
        solver.sigma[x],
      );
    }

    const surface = solver.advanceSurface();
    if (solver.tick !== step) {
      throw new Error(`B-EXEC-TERMINATION: ${config.id} step counter shifted at step ${step}`);
    }
    const surfaceFacts = validateGate4BSurface(config.id, step, config.cflFill, surface);
    const dt = surfaceFacts.deltaTimeSeconds;

    // Independent interface reconstruction: demand, per-cell fill binding, attachment set.
    const demandSum = new CompensatedSum();
    const placedSum = new CompensatedSum();
    const clippedSum = new CompensatedSum();
    const deficitSum = new CompensatedSum();
    let expectedMaxRaw = 0;
    let expectedHoleFills = 0;
    const expectedAttach = new Set<number>();
    for (let bi = 0; bi < boundary.length; bi++) {
      const x = boundary[bi];
      const raw = rates[bi] * dt;
      demandSum.add(raw);
      if (raw > expectedMaxRaw) expectedMaxRaw = raw;
      const room = 1 - fBefore[bi];
      const fAfterKinetic = fBefore[bi] + raw;
      // The fill-CFL quantizes near-max-rate cells into equal increments, so raw and room
      // legitimately coincide to within the boundary-solve residual on saturating steps. The
      // attachment outcome is therefore read from the raw post-step state and each branch is
      // verified consistent with the independent demand, instead of predicting the borderline
      // bit exactly.
      const nearRoom = Math.abs(raw - room) <= 1e-9 * Math.max(raw, room, 1e-300);
      const attached = solver.a[x] === 1;
      if (attached) {
        if (solver.f[x] !== 1) {
          throw new Error(
            `B-EXEC-SURFACE: ${config.id} step ${step} attached cell ${x} has fill below one`,
          );
        }
        if (raw < room && fAfterKinetic < 1 && ntArr[bi] >= 4 && nzArr[bi] >= 1) {
          expectedAttach.add(x);
          expectedHoleFills++;
          placedSum.add(raw);
          deficitSum.add(1 - fAfterKinetic);
        } else if (raw >= room || nearRoom) {
          expectedAttach.add(x);
          placedSum.add(room);
          clippedSum.add(Math.max(raw - room, 0));
        } else {
          throw new Error(
            `B-EXEC-SURFACE: ${config.id} step ${step} cell ${x} attached without ` +
              "independent kinetic or hole-fill justification",
          );
        }
      } else {
        if (raw >= room && !nearRoom) {
          throw new Error(
            `B-EXEC-LEDGER: ${config.id} step ${step} saturated cell ${x} did not attach`,
          );
        }
        const fAfter = solver.f[x];
        const binding = 1e-6 * Math.max(Math.abs(raw), 1e-300) + 8 * Number.EPSILON;
        if (!(Math.abs(fAfter - fAfterKinetic) <= binding)) {
          throw new Error(
            `B-EXEC-LEDGER: ${config.id} step ${step} fill field at cell ${x} diverged ` +
              `from the independent kinetic demand (got ${fAfter}, expected ${fAfterKinetic})`,
          );
        }
        placedSum.add(fAfter - fBefore[bi]);
      }
    }
    const delta = [...solver.lastAttached];
    if (surface.attachedNow !== delta.length) {
      throw new Error(`B-EXEC-NUMERIC: ${config.id} step ${step} surface report differs from lastAttached`);
    }
    if (
      expectedAttach.size !== delta.length ||
      delta.some((cell) => !expectedAttach.has(cell))
    ) {
      throw new Error(
        `B-EXEC-SURFACE: ${config.id} step ${step} attachment set differs from the ` +
          "independent interface reconstruction",
      );
    }
    if (surface.holeFillCount !== expectedHoleFills) {
      throw new Error(
        `B-EXEC-SURFACE: ${config.id} step ${step} hole-fill count ${surface.holeFillCount} ` +
          `differs from the independent reconstruction ${expectedHoleFills}`,
      );
    }
    const reportedMax = surfaceFacts.maxKineticFillIncrement;
    if (
      !(Math.abs(reportedMax - expectedMaxRaw) <=
        1e-6 * Math.max(reportedMax, expectedMaxRaw, 1e-300))
    ) {
      throw new Error(
        `B-EXEC-SURFACE: ${config.id} step ${step} reported max kinetic fill ${reportedMax} ` +
          `differs from the independent maximum ${expectedMaxRaw}`,
      );
    }
    const placedStep = placedSum.value();
    const clippedStep = clippedSum.value();
    const deficitStep = deficitSum.value();
    const demandStep = demandSum.value();
    const solverPlacedDelta = solver.fillLedger - previousFillLedger;
    const solverClippedDelta = solver.saturationClippedFill - previousClipped;
    const solverDeficitDelta = solver.holeFillDeficit - previousDeficit;
    previousFillLedger = solver.fillLedger;
    previousClipped = solver.saturationClippedFill;
    previousDeficit = solver.holeFillDeficit;
    const ledgerBinding = (mine: number, theirs: number, label: string): void => {
      if (!(Math.abs(theirs - mine) <= 1e-6 * Math.max(1, Math.abs(mine)))) {
        throw new Error(
          `B-EXEC-LEDGER: ${config.id} step ${step} solver ${label} ${theirs} diverged from ` +
            `the independent reconstruction ${mine}`,
        );
      }
    };
    ledgerBinding(placedStep, solverPlacedDelta, "placed-fill delta");
    ledgerBinding(clippedStep, solverClippedDelta, "saturation-clipped delta");
    ledgerBinding(deficitStep, solverDeficitDelta, "hole-fill deficit delta");
    const ledgerError = Math.abs(placedStep + clippedStep - demandStep);
    if (!(ledgerError <= 1e-12 * Math.max(1, Math.abs(demandStep)))) {
      throw new Error(
        `B-EXEC-LEDGER: ${config.id} step ${step} placed+clipped ${placedStep + clippedStep} ` +
          `did not close the independent demand ${demandStep} (error ${ledgerError})`,
      );
    }
    const simTime = solver.simTimeSeconds;
    if (!Object.is(simTime, previousSimTime + dt)) {
      throw new Error(`B-EXEC-SURFACE: ${config.id} step ${step} physical time chain broke`);
    }
    previousSimTime = simTime;

    const extents = latticeExtents(solver.a, config.dims);
    if (extents === null) throw new Error(`B-EXEC-NUMERIC: ${config.id} lost its crystal`);
    if (extents.attachedCount !== previousExtents.attachedCount + delta.length) {
      throw new Error(`B-EXEC-NUMERIC: ${config.id} step ${step} attached count differs from delta`);
    }
    const deltaSymmetric = config.noiseEpsilon === 0
      ? delta.length === 0 || isD6hInvariantSet(delta, config.dims, center)
      : null;
    if (delta.length > 0) deltas.push({ step, indices: delta });

    rows.push({
      step,
      attachedCount: solver.attachedCount,
      iExtent: extents.iExtent,
      jExtent: extents.jExtent,
      tExtent: extents.tExtent,
      zExtent: extents.zExtent,
      largestExtent: extents.largestExtent,
      deltaCount: delta.length,
      deltaSha256: sha256Bytes(deltaBytes(delta)),
      deltaSymmetric,
      sweeps: convergence.sweeps,
      residual: convergence.residual,
      shellInjection: convergence.shellInjection,
      surfaceExchange: convergence.surfaceExchange,
      divergenceResidual: convergence.divergenceResidual,
      deltaTimeSeconds: norm0(dt),
      simTimeSeconds: norm0(simTime),
      maxKineticFillIncrement: norm0(reportedMax),
      holeFillCount: surface.holeFillCount,
      deltaPlacedFill: placedStep,
      deltaSaturationClippedFill: clippedStep,
      deltaHoleFillDeficit: deficitStep,
      independentDemand: demandStep,
      tempC: environment.tempC,
      sigmaInfinity: environment.sigmaInfinity,
    });

    while (
      nextDepletion < config.depletionTargets.length &&
      extents.largestExtent >= config.depletionTargets[nextDepletion]
    ) {
      const depletion = centerRimDepletion(solver.a, solver.sigma, config.dims, center, solver.wall);
      depletionSamples.push({
        targetExtent: config.depletionTargets[nextDepletion],
        tExtent: extents.tExtent,
        depletionRatio: depletion.depletionRatio,
        previousCycle: step - 1,
        crossingCycle: step,
        previousLargestExtent: previousExtents.largestExtent,
        crossingLargestExtent: extents.largestExtent,
      });
      nextDepletion++;
    }

    if (config.schedule !== null && timelineCursor !== null) {
      const decision = evaluateTimelineBoundary(config.schedule, timelineCursor, {
        phase: "afterInterfaceStep",
        completedCycles: step,
        extents,
      });
      timelineCursor = decision.cursor;
      if (decision.event !== null) {
        if (decision.event.operator !== "LibbrechtKinetics") {
          throw new Error(`B-EXEC-CONFIG: ${config.id} timeline emitted the wrong operator`);
        }
        if (timelineTransition !== null) {
          throw new Error(`B-EXEC-TERMINATION: ${config.id} timeline fired more than once`);
        }
        const sigmaBefore = solver.sigma.slice();
        const fHashBefore = rawTypedArraySha256(solver.f);
        const aHashAtEvent = rawTypedArraySha256(solver.a);
        const beforeEnvironment = environment;
        const transition = solver.applyTimelineEnvironment(decision.event.environment);
        const sigmaAfter = solver.sigma.slice();
        const expectation = gate4BTimelineTransitionExpectation(
          config,
          solver.a,
          sigmaBefore,
          beforeEnvironment,
          decision.event.environment,
          step,
          simTime,
        );
        const transitionSnapshot = strictJsonSnapshot(transition);
        if (canonicalJson(transitionSnapshot) !== canonicalJson(expectation.report)) {
          throw new Error(
            `B-EXEC-TERMINATION: ${config.id} transition report differs from the independent ` +
              "density-transform recomputation",
          );
        }
        if (!typedBitsEqual(sigmaAfter, expectation.sigmaAfter)) {
          throw new Error(
            `B-EXEC-TERMINATION: ${config.id} post-event sigma field differs bit-for-bit from ` +
              "the independent density transform",
          );
        }
        environment = {
          tempC: decision.event.environment.tempC,
          sigmaInfinity: decision.event.environment.sigmaInfinity,
        };
        vKinNow = vKin(environment.tempC);
        if (
          !Object.is(solver.tempC, environment.tempC) ||
          !Object.is(solver.sigmaInfinity, environment.sigmaInfinity) ||
          !Object.is(solver.vKinMS, vKinNow) ||
          !Object.is(solver.x0M, kineticLength(environment.tempC, config.pressurePa)) ||
          !Object.is(solver.mIceLedger, mIce(environment.tempC))
        ) {
          throw new Error(
            `B-EXEC-TERMINATION: ${config.id} temperature-derived controls did not update atomically`,
          );
        }
        timelineTransition = {
          schedule: config.schedule,
          transitionReport: transitionSnapshot,
          eventStep: step,
          sigmaBefore,
          sigmaAfter,
          aHashAtEvent,
          fHashBefore,
          fHashAfter: rawTypedArraySha256(solver.f),
        };
      }
    }

    options.onProgress?.(config.id, step, solver.attachedCount);

    const candidates: string[] = [];
    if (solver.domainContact()) candidates.push("domain-contact");
    if (
      previousExtents.largestExtent < config.targetLargestExtent &&
      extents.largestExtent >= config.targetLargestExtent
    ) {
      extentCrossing = {
        previousStep: step - 1,
        crossingStep: step,
        previousExtents,
        crossingExtents: extents,
      };
      previousOccupancy = solver.a.slice();
      for (const cell of solver.lastAttached) previousOccupancy[cell] = 0;
      candidates.push("size-target");
    }
    if (step === config.stepCap) candidates.push("step-cap");
    if (candidates.length > 0) {
      stopReason = candidates.length === 1 ? candidates[0] : `ambiguous:${candidates.join("+")}`;
      break;
    }
    previousExtents = extents;
  }

  if (config.noiseEpsilon > 0 && noiseWitness === null) {
    throw new Error(
      `B-EXEC-NOISE: ${config.id} never captured a dual-outcome positive-demand witness`,
    );
  }
  const finalA = solver.a.slice();
  const finalF = solver.f.slice();
  const finalSigma = solver.sigma.slice();
  const ledger = solver.ledger();
  const checkpoint = encodeLKCheckpoint({
    surfacePolicy: config.surfacePolicy,
    dims: config.dims,
    tick: solver.tick,
    simTimeSeconds: solver.simTimeSeconds,
    rngSeed: config.rngSeed,
    noiseEpsilon: config.noiseEpsilon,
    domain: config.domain,
    center,
    tempC: environment.tempC,
    sigmaInfinity: environment.sigmaInfinity,
    dxUm: config.dxUm,
    pressurePa: config.pressurePa,
    paramSet: config.paramSet,
    cflFill: config.cflFill,
    relaxTol: config.relaxTol,
    divTol: config.divTol,
    relaxMaxSweeps: config.relaxMaxSweeps,
    farField: config.farField,
    a: finalA,
    f: finalF,
    sigma: finalSigma,
  });
  const executionId = canonicalJsonSha256({
    runId: config.id,
    configSha256: registeredConfigSha256,
    tick: solver.tick,
    a: rawTypedArraySha256(finalA),
    f: rawTypedArraySha256(finalF),
    sigma: rawTypedArraySha256(finalSigma),
  });
  const timeline: Gate4BTimelineEvidence | null =
    config.schedule === null || timelineCursor === null || timelineTransition === null
      ? null
      : { ...timelineTransition, eventLog: timelineCursor.eventLog };
  if (config.schedule !== null && timeline === null) {
    throw new Error(`B-EXEC-TERMINATION: ${config.id} timeline event never fired`);
  }
  const result: Gate4BRunResult = {
    config,
    registeredConfigSha256,
    executionId,
    initialOccupancy,
    seedSymmetric,
    rows,
    deltas,
    depletionSamples,
    stopReason,
    extentCrossing,
    previousOccupancy,
    finalA,
    finalF,
    finalSigma,
    finalFillLedger: norm0(ledger.fillLedgerIceCells as number),
    finalSaturationClippedFill: norm0(ledger.saturationClippedFill as number),
    finalHoleFillDeficit: norm0(ledger.holeFillDeficit as number),
    finalVaporUnits: norm0(ledger.fillLedgerVaporUnits as number),
    finalHoleFillCountTotal: solver.holeFillCountTotal,
    pecletBound: gate4BRegisteredPecletBound(config),
    checkpoint,
    noiseWitness,
    timeline,
  };
  verifyGate4BCheckpoint(checkpoint, result);
  return result;
}

/** Execute one exact registered run. This never writes files. */
export function executeGate4BRun(
  configInput: Gate4BRunConfig,
  options: ExecuteGate4BRunOptions = {},
): Gate4BRunResult {
  const manifest = buildGate4BManifest();
  const registered = manifest.runs.find((candidate) => candidate.id === configInput.id);
  if (registered === undefined || canonicalJson(registered) !== canonicalJson(configInput)) {
    throw new Error(`B-EXEC-CONFIG: ${configInput.id} differs from the frozen manifest`);
  }
  return executeGate4BScenario(configInput, options);
}

// ── Checkpoint verification ────────────────────────────────────────────────────────────────

function finalEnvironmentOf(result: Gate4BRunResult): LKTimelineEnvironment {
  const lastEvent = result.timeline?.eventLog[result.timeline.eventLog.length - 1];
  return lastEvent === undefined
    ? { tempC: result.config.tempC, sigmaInfinity: result.config.sigmaInfinity }
    : (lastEvent.afterEnvironment as LKTimelineEnvironment);
}

/**
 * Strict LK v2 decode, exact metadata comparison against the registered run and policy,
 * bit-for-bit field comparison with length checks, byte-stable re-encode, and a solver
 * reconstruction from the decoded controls. Never rewrites the source artifact.
 */
export function verifyGate4BCheckpoint(bytes: Uint8Array, result: Gate4BRunResult): void {
  const fail = (message: string): never => {
    throw new Error(`B-EXEC-CHECKPOINT: ${result.config.id} ${message}`);
  };
  let decoded: ReturnType<typeof decodeLKCheckpoint>;
  try {
    decoded = decodeLKCheckpoint(bytes);
  } catch (error) {
    return fail(`strict decode failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  const header = decoded.header;
  const config = result.config;
  const environment = finalEnvironmentOf(result);
  const expectedSimTime = result.rows[result.rows.length - 1]?.simTimeSeconds ?? 0;
  const center = domainCenter(config.dims);
  if (
    header.version !== 2 ||
    header.rule !== "LibbrechtKinetics" ||
    header.endianness !== "LE" ||
    header.surfacePolicy !== config.surfacePolicy ||
    decoded.state.surfacePolicy !== config.surfacePolicy ||
    canonicalJson(header.dims) !== canonicalJson(config.dims) ||
    header.tick !== result.rows.length ||
    !Object.is(header.simTimeSeconds, expectedSimTime) ||
    header.rngSeed !== config.rngSeed ||
    header.noiseEpsilon !== config.noiseEpsilon ||
    header.domain !== config.domain ||
    canonicalJson(header.center) !== canonicalJson(center) ||
    !Object.is(header.tempC, environment.tempC) ||
    !Object.is(header.sigmaInfinity, environment.sigmaInfinity) ||
    header.dxUm !== config.dxUm ||
    header.pressurePa !== config.pressurePa ||
    header.paramSet !== config.paramSet ||
    header.cflFill !== config.cflFill ||
    header.relaxTol !== config.relaxTol ||
    header.divTol !== config.divTol ||
    header.relaxMaxSweeps !== config.relaxMaxSweeps ||
    header.farField !== config.farField
  ) {
    fail("checkpoint metadata shifted from the registered run and policy");
  }
  if (
    decoded.state.a.length !== result.finalA.length ||
    decoded.state.f.length !== result.finalF.length ||
    decoded.state.sigma.length !== result.finalSigma.length ||
    !typedBitsEqual(decoded.state.a, result.finalA) ||
    !typedBitsEqual(decoded.state.f, result.finalF) ||
    !typedBitsEqual(decoded.state.sigma, result.finalSigma)
  ) {
    fail("checkpoint field bits shifted");
  }
  const reencoded = encodeLKCheckpoint(decoded.state);
  if (!typedBitsEqual(reencoded, bytes)) fail("checkpoint is not byte-stable");
  try {
    // Reconstruction: the recorded controls must construct a real solver on this engine.
    new LKSolver({
      surfacePolicy: decoded.state.surfacePolicy,
      dims: decoded.state.dims,
      tempC: decoded.state.tempC,
      sigmaInfinity: decoded.state.sigmaInfinity,
      dxUm: decoded.state.dxUm,
      pressurePa: decoded.state.pressurePa,
      paramSet: decoded.state.paramSet as "CAK_A1",
      cflFill: decoded.state.cflFill,
      relaxTol: decoded.state.relaxTol,
      divTol: decoded.state.divTol,
      relaxMaxSweeps: decoded.state.relaxMaxSweeps,
      rngSeed: decoded.state.rngSeed,
      noiseEpsilon: decoded.state.noiseEpsilon,
      domain: decoded.state.domain,
      farField: decoded.state.farField,
      seedRadius: null,
      center: [...decoded.state.center] as [number, number, number],
    });
  } catch (error) {
    fail(`solver reconstruction failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ── Series CSV ─────────────────────────────────────────────────────────────────────────────

export const GATE4B_SERIES_HEADER = [
  "step",
  "attachedCount",
  "iExtent",
  "jExtent",
  "tExtent",
  "zExtent",
  "largestExtent",
  "deltaCount",
  "deltaSha256",
  "deltaSymmetric",
  "sweeps",
  "residual",
  "shellInjection",
  "surfaceExchange",
  "divergenceResidual",
  "deltaTimeSeconds",
  "simTimeSeconds",
  "maxKineticFillIncrement",
  "holeFillCount",
  "deltaPlacedFill",
  "deltaSaturationClippedFill",
  "deltaHoleFillDeficit",
  "independentDemand",
  "tempC",
  "sigmaInfinity",
] as const;

function csvBoolean(value: boolean): string {
  return value ? "true" : "false";
}

/** Full-precision, one-row-per-completed-interface-step Pass-B series. */
export function gate4BSeriesCsv(rows: readonly Gate4BStepRow[]): string {
  const body = rows.map((row) => [
    row.step,
    row.attachedCount,
    row.iExtent,
    row.jExtent,
    row.tExtent,
    row.zExtent,
    row.largestExtent,
    row.deltaCount,
    row.deltaSha256,
    row.deltaSymmetric === null ? "" : csvBoolean(row.deltaSymmetric),
    row.sweeps,
    row.residual,
    row.shellInjection,
    row.surfaceExchange,
    row.divergenceResidual,
    row.deltaTimeSeconds,
    row.simTimeSeconds,
    row.maxKineticFillIncrement,
    row.holeFillCount,
    row.deltaPlacedFill,
    row.deltaSaturationClippedFill,
    row.deltaHoleFillDeficit,
    row.independentDemand,
    row.tempC,
    row.sigmaInfinity,
  ].map(String).join(","));
  return `${GATE4B_SERIES_HEADER.join(",")}\n${body.join("\n")}\n`;
}

function parsedFinite(raw: string, label: string): number {
  if (raw.trim() !== raw || raw.length === 0) throw new Error(`${label} is empty or padded`);
  const value = Number(raw);
  if (!Number.isFinite(value) || Object.is(value, -0)) {
    throw new Error(`${label} is nonfinite or negative zero`);
  }
  if (String(value) !== raw) throw new Error(`${label} is not in canonical numeric form`);
  return value;
}

function parsedInteger(raw: string, label: string, minimum: number): number {
  const value = parsedFinite(raw, label);
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`${label} is not a valid integer`);
  }
  return value;
}

function parsedBoolean(raw: string, label: string): boolean {
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new Error(`${label} is not a canonical boolean`);
}

/** Parse/cross-check exact canonical scalar spellings and the recorded step sequence. */
export function validateGate4BSeriesCsv(
  text: string,
  expectedRows?: readonly Gate4BStepRow[],
): readonly Gate4BStepRow[] {
  if (!text.endsWith("\n") || text.includes("\r")) {
    throw new Error("Pass-B CSV newline form is invalid");
  }
  const lines = text.slice(0, -1).split("\n");
  if (lines[0] !== GATE4B_SERIES_HEADER.join(",")) throw new Error("Pass-B CSV header shifted");
  const rows = lines.slice(1).map((line, index): Gate4BStepRow => {
    const fields = line.split(",");
    if (fields.length !== GATE4B_SERIES_HEADER.length) {
      throw new Error(`Pass-B CSV row ${index + 1} has ${fields.length} fields`);
    }
    const step = parsedInteger(fields[0], `row ${index + 1} step`, 1);
    if (step !== index + 1) throw new Error(`Pass-B CSV skipped or duplicated step ${index + 1}`);
    const deltaSha256 = fields[8];
    if (!/^[0-9a-f]{64}$/.test(deltaSha256)) {
      throw new Error(`Pass-B CSV delta hash is invalid at step ${step}`);
    }
    const deltaSymmetric = fields[9] === ""
      ? null
      : parsedBoolean(fields[9], `row ${step} deltaSymmetric`);
    const nonNegative = (column: number, label: string): number => {
      const value = parsedFinite(fields[column], `row ${step} ${label}`);
      if (value < 0) throw new Error(`row ${step} ${label} is negative`);
      return value;
    };
    return {
      step,
      attachedCount: parsedInteger(fields[1], `row ${step} attachedCount`, 1),
      iExtent: parsedInteger(fields[2], `row ${step} iExtent`, 1),
      jExtent: parsedInteger(fields[3], `row ${step} jExtent`, 1),
      tExtent: parsedInteger(fields[4], `row ${step} tExtent`, 1),
      zExtent: parsedInteger(fields[5], `row ${step} zExtent`, 1),
      largestExtent: parsedInteger(fields[6], `row ${step} largestExtent`, 1),
      deltaCount: parsedInteger(fields[7], `row ${step} deltaCount`, 0),
      deltaSha256,
      deltaSymmetric,
      sweeps: parsedInteger(fields[10], `row ${step} sweeps`, 1),
      residual: nonNegative(11, "residual"),
      shellInjection: parsedFinite(fields[12], `row ${step} shellInjection`),
      surfaceExchange: parsedFinite(fields[13], `row ${step} surfaceExchange`),
      divergenceResidual: nonNegative(14, "divergenceResidual"),
      deltaTimeSeconds: parsedFinite(fields[15], `row ${step} deltaTimeSeconds`),
      simTimeSeconds: parsedFinite(fields[16], `row ${step} simTimeSeconds`),
      maxKineticFillIncrement: parsedFinite(fields[17], `row ${step} maxKineticFillIncrement`),
      holeFillCount: parsedInteger(fields[18], `row ${step} holeFillCount`, 0),
      deltaPlacedFill: nonNegative(19, "deltaPlacedFill"),
      deltaSaturationClippedFill: nonNegative(20, "deltaSaturationClippedFill"),
      deltaHoleFillDeficit: nonNegative(21, "deltaHoleFillDeficit"),
      independentDemand: nonNegative(22, "independentDemand"),
      tempC: parsedFinite(fields[23], `row ${step} tempC`),
      sigmaInfinity: parsedFinite(fields[24], `row ${step} sigmaInfinity`),
    };
  });
  if (expectedRows !== undefined && canonicalJson(rows) !== canonicalJson(expectedRows)) {
    throw new Error("Pass-B CSV rows differ from raw in-memory step evidence");
  }
  return rows;
}

// ── Attachment-delta reconstruction ────────────────────────────────────────────────────────

export interface Gate4BReconstructedChain {
  readonly finalOccupancy: Uint8Array;
  readonly anyDomainContact: boolean;
  readonly occupancyAtNoiseTick: Uint8Array | null;
  readonly occupancyAtEventStep: Uint8Array | null;
  readonly preEventAspectRatio: number | null;
}

function chainFailure(result: Gate4BRunResult, message: string): never {
  throw new Error(`B-EXEC-NUMERIC: ${result.config.id} ${message}`);
}

const DOMAIN_CONTACT_FRACTION = 0.65;

/**
 * Rebuild the monotonic crystal from the canonical seed and raw attachment deltas. Every
 * recorded per-step extent, count, symmetry flag, contact fact, crossing occupancy, and the
 * final occupancy must agree with this independent reconstruction.
 */
export function validateGate4BDeltaChain(result: Gate4BRunResult): Gate4BReconstructedChain {
  const { dims } = result.config;
  const n = cellCount(dims);
  const center = domainCenter(dims);
  const occupancy = new Uint8Array(n);
  const wall = hexPrismWallMask(dims, center);
  let attachedCount = 0;
  let iMin = Number.POSITIVE_INFINITY;
  let iMax = Number.NEGATIVE_INFINITY;
  let jMin = Number.POSITIVE_INFINITY;
  let jMax = Number.NEGATIVE_INFINITY;
  let kMin = Number.POSITIVE_INFINITY;
  let kMax = Number.NEGATIVE_INFINITY;
  const plane = dims.nx * dims.ny;
  const addCell = (cell: number): void => {
    occupancy[cell] = 1;
    attachedCount++;
    const k = Math.floor(cell / plane);
    const inPlane = cell - k * plane;
    const j = Math.floor(inPlane / dims.nx);
    const i = inPlane - j * dims.nx;
    if (i < iMin) iMin = i;
    if (i > iMax) iMax = i;
    if (j < jMin) jMin = j;
    if (j > jMax) jMax = j;
    if (k < kMin) kMin = k;
    if (k > kMax) kMax = k;
  };
  for (const site of hexSeedSites(dims, 2, 1, center)) addCell(site);
  if (
    result.initialOccupancy.length !== n ||
    !typedBitsEqual(result.initialOccupancy, occupancy)
  ) {
    chainFailure(result, "initial occupancy is not the canonical 19-site seed");
  }

  const byStep = new Map<number, Gate4BDeltaWitness>();
  let previousWitnessStep = 0;
  for (const witness of result.deltas) {
    if (!Number.isSafeInteger(witness.step) || witness.step < 1 || !Array.isArray(witness.indices)) {
      chainFailure(result, "delta witness shape is invalid");
    }
    if (byStep.has(witness.step)) chainFailure(result, `has duplicate delta step ${witness.step}`);
    if (witness.step <= previousWitnessStep) {
      chainFailure(result, `delta witnesses are out of order at step ${witness.step}`);
    }
    previousWitnessStep = witness.step;
    byStep.set(witness.step, witness);
  }

  const noiseTick = result.noiseWitness?.tick ?? null;
  const eventStep = result.timeline?.eventStep ?? null;
  let occupancyAtNoiseTick: Uint8Array | null = noiseTick === 0 ? occupancy.slice() : null;
  let occupancyAtEventStep: Uint8Array | null = null;
  let preEventAspectRatio: number | null = null;
  let anyDomainContact = false;
  for (let rowIndex = 0; rowIndex < result.rows.length; rowIndex++) {
    const row = result.rows[rowIndex];
    const expectedStep = rowIndex + 1;
    if (row.step !== expectedStep) chainFailure(result, `row step ${row.step} is not ${expectedStep}`);
    const witness = byStep.get(row.step);
    const indices = witness?.indices ?? [];
    if (row.deltaCount === 0) {
      if (witness !== undefined) chainFailure(result, `empty delta has a witness at step ${row.step}`);
      if (row.deltaSha256 !== sha256Bytes(new Uint8Array(0))) {
        chainFailure(result, `empty delta hash shifted at step ${row.step}`);
      }
    } else {
      if (witness === undefined || indices.length !== row.deltaCount) {
        chainFailure(result, `nonempty delta witness is missing at step ${row.step}`);
      }
      if (sha256Bytes(deltaBytes(indices)) !== row.deltaSha256) {
        chainFailure(result, `delta witness hash shifted at step ${row.step}`);
      }
    }
    if (result.extentCrossing?.crossingStep === row.step) {
      if (
        result.previousOccupancy === null ||
        result.previousOccupancy.length !== n ||
        !typedBitsEqual(result.previousOccupancy, occupancy)
      ) {
        chainFailure(result, "previous occupancy is not the state before the crossing step");
      }
    }
    const priorAttachedCount = attachedCount;
    for (const cell of indices) {
      if (!Number.isSafeInteger(cell) || cell < 0 || cell >= n) {
        chainFailure(result, `delta index ${String(cell)} is out of range at step ${row.step}`);
      }
      if (wall[cell] === 1) {
        chainFailure(result, `delta index ${cell} is an inactive wall cell at step ${row.step}`);
      }
      if (occupancy[cell] === 1) {
        chainFailure(result, `delta index ${cell} is duplicate or already attached at step ${row.step}`);
      }
      addCell(cell);
    }
    if (row.attachedCount !== priorAttachedCount + indices.length) {
      chainFailure(result, `attached count shifted at step ${row.step}`);
    }
    const iExtent = iMax - iMin + 1;
    const jExtent = jMax - jMin + 1;
    const zExtent = kMax - kMin + 1;
    const tExtent = Math.max(iExtent, jExtent);
    const largestExtent = Math.max(tExtent, zExtent);
    if (
      row.iExtent !== iExtent || row.jExtent !== jExtent || row.tExtent !== tExtent ||
      row.zExtent !== zExtent || row.largestExtent !== largestExtent
    ) {
      chainFailure(result, `row extents shifted at step ${row.step}`);
    }
    const contact = iExtent > DOMAIN_CONTACT_FRACTION * dims.nx ||
      jExtent > DOMAIN_CONTACT_FRACTION * dims.ny ||
      zExtent > DOMAIN_CONTACT_FRACTION * dims.nz;
    anyDomainContact ||= contact;
    if (result.config.noiseEpsilon === 0) {
      const symmetric = indices.length === 0 || isD6hInvariantSet(indices, dims, center);
      if (row.deltaSymmetric !== symmetric) {
        chainFailure(result, `delta symmetry witness shifted at step ${row.step}`);
      }
    } else if (row.deltaSymmetric !== null) {
      chainFailure(result, `noise-on delta has a symmetry threshold at step ${row.step}`);
    }
    if (noiseTick === row.step) occupancyAtNoiseTick = occupancy.slice();
    if (eventStep === row.step) {
      occupancyAtEventStep = occupancy.slice();
      preEventAspectRatio = aspectRatio(occupancy, dims);
    }
  }
  for (const step of byStep.keys()) {
    if (step > result.rows.length || result.rows[step - 1].deltaCount === 0) {
      chainFailure(result, `has orphan delta witness at step ${step}`);
    }
  }
  if (result.finalA.length !== n || !typedBitsEqual(occupancy, result.finalA)) {
    chainFailure(result, "reconstructed occupancy differs from finalA");
  }
  if (noiseTick !== null && occupancyAtNoiseTick === null) {
    chainFailure(result, `noise witness tick ${noiseTick} has no reconstructed state`);
  }
  if (eventStep !== null && occupancyAtEventStep === null) {
    chainFailure(result, `timeline event step ${eventStep} has no reconstructed state`);
  }
  return {
    finalOccupancy: occupancy,
    anyDomainContact,
    occupancyAtNoiseTick,
    occupancyAtEventStep,
    preEventAspectRatio,
  };
}

// ── Artifact payloads ──────────────────────────────────────────────────────────────────────

function runArtifactPath(runId: string, name: string): string {
  return `runs/${runId}/${name}`;
}

function jsonSafeDepletionSamples(samples: readonly DepletionSample[]): StrictJson {
  // A non-finite depletion ratio is an honest diagnostic instrument reading, recorded as
  // null rather than blocking execution validity; the diagnostic evaluator fails it by name.
  return strictJsonSnapshot(samples.map((sample) => ({
    targetExtent: sample.targetExtent,
    tExtent: sample.tExtent,
    depletionRatio: Number.isFinite(sample.depletionRatio) && !Object.is(sample.depletionRatio, -0)
      ? sample.depletionRatio
      : null,
    previousCycle: sample.previousCycle,
    crossingCycle: sample.crossingCycle,
    previousLargestExtent: sample.previousLargestExtent,
    crossingLargestExtent: sample.crossingLargestExtent,
  })));
}

/** Deterministic per-run scenario payload derived from raw arrays, never a solver self-report. */
export function gate4BScenarioPayload(result: Gate4BRunResult): StrictJson {
  // An undecodable checkpoint is owned by B-EXEC-CHECKPOINT; the payload records the raw
  // bytes' identity either way instead of masking that failure as a payload crash.
  let checkpointHeader: StrictJson = null;
  try {
    checkpointHeader = strictJsonSnapshot(decodeLKCheckpoint(result.checkpoint).header);
  } catch {
    checkpointHeader = null;
  }
  const center = domainCenter(result.config.dims);
  return strictJsonSnapshot({
    version: 1,
    runId: result.config.id,
    executionId: result.executionId,
    registeredConfigSha256: result.registeredConfigSha256,
    completedSteps: result.rows.length,
    stopReason: result.stopReason,
    initial: {
      occupancySha256: rawTypedArraySha256(result.initialOccupancy),
      seedSymmetric: result.seedSymmetric,
    },
    termination: { extentCrossing: result.extentCrossing },
    depletionSamples: jsonSafeDepletionSamples(result.depletionSamples),
    ledger: {
      fillLedgerIceCells: result.finalFillLedger,
      saturationClippedFill: result.finalSaturationClippedFill,
      holeFillDeficit: result.finalHoleFillDeficit,
      fillLedgerVaporUnits: result.finalVaporUnits,
      holeFillCountTotal: result.finalHoleFillCountTotal,
    },
    pecletBound: result.pecletBound,
    environment: {
      initial: { tempC: result.config.tempC, sigmaInfinity: result.config.sigmaInfinity },
      final: finalEnvironmentOf(result),
    },
    final: {
      aSha256: rawTypedArraySha256(result.finalA),
      fSha256: rawTypedArraySha256(result.finalF),
      sigmaSha256: rawTypedArraySha256(result.finalSigma),
      symmetryError: symmetryError(result.finalA, result.config.dims, center),
      aspectRatio: aspectRatio(result.finalA, result.config.dims),
      crossSectionHollowness: crossSectionHollowness(result.finalA, result.config.dims),
      sealedVoidFraction: sealedVoidFraction(result.finalA, result.config.dims),
      branchCount: branchCount(result.finalA, result.config.dims, center),
    },
    checkpoint: {
      sha256: sha256Bytes(result.checkpoint),
      byteLength: result.checkpoint.byteLength,
      header: checkpointHeader,
    },
    noise: result.noiseWitness === null
      ? null
      : {
          witnessSha256: sha256Bytes(canonicalJsonBytes(result.noiseWitness)),
          tick: result.noiseWitness.tick,
          streamId: result.noiseWitness.streamId,
          cellCount: result.noiseWitness.cells.length,
        },
    timeline: result.timeline === null
      ? null
      : {
          schedule: result.timeline.schedule,
          eventLog: result.timeline.eventLog,
          transitionReport: result.timeline.transitionReport,
          eventStep: result.timeline.eventStep,
          sigmaBeforeSha256: rawTypedArraySha256(result.timeline.sigmaBefore),
          sigmaAfterSha256: rawTypedArraySha256(result.timeline.sigmaAfter),
          aHashAtEvent: result.timeline.aHashAtEvent,
          fHashBefore: result.timeline.fHashBefore,
          fHashAfter: result.timeline.fHashAfter,
        },
    deltaWitnessCount: result.deltas.length,
  });
}

function deltaPayload(result: Gate4BRunResult): StrictJson {
  return strictJsonSnapshot({
    version: 1,
    runId: result.config.id,
    witnesses: result.deltas,
  });
}

function timelineWitnessBinary(result: Gate4BRunResult): Gate4BTimelineWitnessBinary {
  const timeline = result.timeline as Gate4BTimelineEvidence;
  return {
    runId: result.config.id,
    eventStep: timeline.eventStep,
    dims: result.config.dims,
    beforeEnvironment: { tempC: result.config.tempC, sigmaInfinity: result.config.sigmaInfinity },
    afterEnvironment: finalEnvironmentOf(result),
    sigmaBefore: timeline.sigmaBefore,
    sigmaAfter: timeline.sigmaAfter,
  };
}

/** Build every payload artifact; report/index are added only by the shared publisher. */
export function buildGate4BArtifacts(
  manifest: Gate4BManifest,
  results: readonly Gate4BRunResult[],
): readonly EvidenceArtifactInput[] {
  const artifacts: EvidenceArtifactInput[] = [
    {
      path: GATE4B_MANIFEST_PATH,
      kind: "phase4-pass-b-manifest+json",
      bytes: canonicalJsonBytes(manifest),
    },
  ];
  for (const result of results) {
    validateGate4BDeltaChain(result);
    const csv = gate4BSeriesCsv(result.rows);
    validateGate4BSeriesCsv(csv, result.rows);
    artifacts.push(
      {
        path: runArtifactPath(result.config.id, "series.csv"),
        kind: "phase4-pass-b-series+csv",
        bytes: encoder.encode(csv),
      },
      {
        path: runArtifactPath(result.config.id, "deltas.json"),
        kind: "phase4-pass-b-attachment-deltas+json",
        bytes: canonicalJsonBytes(deltaPayload(result)),
      },
      {
        path: runArtifactPath(result.config.id, "final.ckpt"),
        kind: "lk-checkpoint-v2",
        bytes: result.checkpoint,
      },
      {
        path: runArtifactPath(result.config.id, "scenario.json"),
        kind: "phase4-pass-b-scenario+json",
        bytes: canonicalJsonBytes(gate4BScenarioPayload(result)),
      },
    );
    if (result.noiseWitness !== null) {
      artifacts.push({
        path: runArtifactPath(result.config.id, "noise-witness.json"),
        kind: "phase4-lk-noise-witness+json",
        bytes: canonicalJsonBytes(result.noiseWitness),
      });
    }
    if (result.timeline !== null) {
      artifacts.push({
        path: runArtifactPath(result.config.id, "timeline-witness.bin"),
        kind: "phase4-lk-timeline-witness-v1",
        bytes: encodeGate4BTimelineWitness(timelineWitnessBinary(result)),
      });
    }
  }
  return artifacts;
}

/** Independently validate the exact artifact set and all artifact-to-memory cross-links. */
export function validateGate4BArtifacts(
  manifest: Gate4BManifest,
  results: readonly Gate4BRunResult[],
  artifacts: readonly EvidenceArtifactInput[],
): void {
  const expectedKinds = new Map<string, string>([
    [GATE4B_MANIFEST_PATH, "phase4-pass-b-manifest+json"],
  ]);
  for (const result of results) {
    expectedKinds.set(runArtifactPath(result.config.id, "series.csv"), "phase4-pass-b-series+csv");
    expectedKinds.set(
      runArtifactPath(result.config.id, "deltas.json"),
      "phase4-pass-b-attachment-deltas+json",
    );
    expectedKinds.set(runArtifactPath(result.config.id, "final.ckpt"), "lk-checkpoint-v2");
    expectedKinds.set(
      runArtifactPath(result.config.id, "scenario.json"),
      "phase4-pass-b-scenario+json",
    );
    if (result.noiseWitness !== null) {
      expectedKinds.set(
        runArtifactPath(result.config.id, "noise-witness.json"),
        "phase4-lk-noise-witness+json",
      );
    }
    if (result.timeline !== null) {
      expectedKinds.set(
        runArtifactPath(result.config.id, "timeline-witness.bin"),
        "phase4-lk-timeline-witness-v1",
      );
    }
  }
  const actualPaths = artifacts.map((item) => item.path);
  if (new Set(actualPaths).size !== actualPaths.length) {
    throw new Error("B-EXEC-NUMERIC: duplicate artifact path");
  }
  if ([...actualPaths].sort().join("\n") !== [...expectedKinds.keys()].sort().join("\n")) {
    throw new Error("B-EXEC-NUMERIC: missing or unexpected Pass-B artifact");
  }
  for (const artifact of artifacts) {
    if (artifact.kind !== expectedKinds.get(artifact.path)) {
      throw new Error(`B-EXEC-NUMERIC: artifact kind shifted for ${artifact.path}`);
    }
  }
  const byPath = new Map(artifacts.map((item) => [item.path, item]));
  const manifestArtifact = byPath.get(GATE4B_MANIFEST_PATH) as EvidenceArtifactInput;
  let parsedManifest: StrictJson;
  try {
    parsedManifest = parseCanonicalJson(manifestArtifact.bytes, "Pass-B manifest");
  } catch (error) {
    // Corrupt manifest bytes are frozen-configuration evidence, owned by B-EXEC-CONFIG.
    throw new Error(`B-EXEC-CONFIG: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (
    canonicalJson(parsedManifest) !== canonicalJson(manifest) ||
    sha256Bytes(manifestArtifact.bytes) !== GATE4B_MANIFEST_SHA256
  ) {
    throw new Error("B-EXEC-CONFIG: manifest bytes differ from the freeze");
  }
  for (const result of results) {
    const csvArtifact = byPath.get(runArtifactPath(result.config.id, "series.csv")) as EvidenceArtifactInput;
    const csvText = new TextDecoder("utf-8", { fatal: true }).decode(csvArtifact.bytes);
    validateGate4BSeriesCsv(csvText, result.rows);
    const deltasArtifact = byPath.get(runArtifactPath(result.config.id, "deltas.json")) as EvidenceArtifactInput;
    const parsedDeltas = parseCanonicalJson(deltasArtifact.bytes, `${result.config.id} deltas`);
    if (canonicalJson(parsedDeltas) !== canonicalJson(deltaPayload(result))) {
      throw new Error(`B-EXEC-NUMERIC: ${result.config.id} delta artifact shifted`);
    }
    validateGate4BDeltaChain(result);
    const checkpointArtifact = byPath.get(runArtifactPath(result.config.id, "final.ckpt")) as EvidenceArtifactInput;
    if (!typedBitsEqual(checkpointArtifact.bytes, result.checkpoint)) {
      throw new Error(`B-EXEC-CHECKPOINT: ${result.config.id} checkpoint artifact bytes shifted`);
    }
    verifyGate4BCheckpoint(checkpointArtifact.bytes, result);
    const scenarioArtifact = byPath.get(runArtifactPath(result.config.id, "scenario.json")) as EvidenceArtifactInput;
    const parsedScenario = parseCanonicalJson(scenarioArtifact.bytes, `${result.config.id} scenario`);
    if (canonicalJson(parsedScenario) !== canonicalJson(gate4BScenarioPayload(result))) {
      throw new Error(`B-EXEC-NUMERIC: ${result.config.id} scenario artifact shifted`);
    }
    const witnessPath = runArtifactPath(result.config.id, "noise-witness.json");
    if (result.noiseWitness !== null) {
      const witnessArtifact = byPath.get(witnessPath) as EvidenceArtifactInput;
      let parsedWitness: StrictJson;
      try {
        parsedWitness = parseCanonicalJson(witnessArtifact.bytes, `${result.config.id} noise witness`);
      } catch (error) {
        throw new Error(`B-EXEC-NOISE: ${error instanceof Error ? error.message : String(error)}`);
      }
      if (canonicalJson(parsedWitness) !== canonicalJson(result.noiseWitness)) {
        throw new Error(`B-EXEC-NOISE: ${result.config.id} witness bytes shifted`);
      }
      const decodedWitness = parsedWitness as unknown as Gate4BNoiseWitness;
      const witnessFailures = validateGate4BNoiseWitness(decodedWitness, result.config);
      if (witnessFailures.length > 0) {
        throw new Error(`B-EXEC-NOISE: ${result.config.id} ${witnessFailures[0]}`);
      }
    }
    const timelinePath = runArtifactPath(result.config.id, "timeline-witness.bin");
    if (result.timeline !== null) {
      const timelineArtifact = byPath.get(timelinePath) as EvidenceArtifactInput;
      const expectedBytes = encodeGate4BTimelineWitness(timelineWitnessBinary(result));
      if (!typedBitsEqual(timelineArtifact.bytes, expectedBytes)) {
        throw new Error(`B-EXEC-TERMINATION: ${result.config.id} timeline witness bytes shifted`);
      }
      const decodedTimeline = decodeGate4BTimelineWitness(timelineArtifact.bytes);
      if (
        decodedTimeline.runId !== result.config.id ||
        decodedTimeline.eventStep !== result.timeline.eventStep ||
        !typedBitsEqual(decodedTimeline.sigmaBefore, result.timeline.sigmaBefore) ||
        !typedBitsEqual(decodedTimeline.sigmaAfter, result.timeline.sigmaAfter)
      ) {
        throw new Error(`B-EXEC-TERMINATION: ${result.config.id} timeline witness decode shifted`);
      }
    }
  }
}

// ── Per-run raw-evidence checks ────────────────────────────────────────────────────────────

const chainCache = new WeakMap<Gate4BRunResult, Gate4BReconstructedChain>();

function reconstructedChain(result: Gate4BRunResult): Gate4BReconstructedChain {
  const cached = chainCache.get(result);
  if (cached !== undefined) return cached;
  const chain = validateGate4BDeltaChain(result);
  chainCache.set(result, chain);
  return chain;
}

function expectedRowEnvironment(
  result: Gate4BRunResult,
  step: number,
): LKTimelineEnvironment {
  const eventStep = result.timeline?.eventStep ?? null;
  return eventStep !== null && step > eventStep
    ? finalEnvironmentOf(result)
    : { tempC: result.config.tempC, sigmaInfinity: result.config.sigmaInfinity };
}

function finiteNonNegative(value: number): boolean {
  return Number.isFinite(value) && !Object.is(value, -0) && value >= 0;
}

/** Structural row validity plus registered environment sequencing. B-EXEC-NUMERIC territory. */
function gate4BRowsStructurallyValid(result: Gate4BRunResult): boolean {
  if (result.rows.length === 0 || result.rows.length > result.config.stepCap) return false;
  let previousSimTime = 0;
  for (let index = 0; index < result.rows.length; index++) {
    const row = result.rows[index];
    const environment = expectedRowEnvironment(result, index + 1);
    if (
      row.step !== index + 1 ||
      !Number.isSafeInteger(row.attachedCount) || row.attachedCount < 19 ||
      !Number.isSafeInteger(row.iExtent) || row.iExtent < 1 ||
      !Number.isSafeInteger(row.jExtent) || row.jExtent < 1 ||
      row.tExtent !== Math.max(row.iExtent, row.jExtent) ||
      !Number.isSafeInteger(row.zExtent) || row.zExtent < 1 ||
      row.largestExtent !== Math.max(row.tExtent, row.zExtent) ||
      !Number.isSafeInteger(row.deltaCount) || row.deltaCount < 0 ||
      !/^[0-9a-f]{64}$/.test(row.deltaSha256) ||
      !Number.isSafeInteger(row.sweeps) ||
      !Number.isFinite(row.residual) ||
      !Number.isFinite(row.shellInjection) ||
      !Number.isFinite(row.surfaceExchange) ||
      !Number.isFinite(row.divergenceResidual) ||
      !Number.isFinite(row.deltaTimeSeconds) ||
      !Number.isFinite(row.simTimeSeconds) ||
      !Number.isFinite(row.maxKineticFillIncrement) ||
      !Number.isSafeInteger(row.holeFillCount) || row.holeFillCount < 0 ||
      !finiteNonNegative(row.deltaPlacedFill) ||
      !finiteNonNegative(row.deltaSaturationClippedFill) ||
      !finiteNonNegative(row.deltaHoleFillDeficit) ||
      !finiteNonNegative(row.independentDemand) ||
      !Object.is(row.tempC, environment.tempC) ||
      !Object.is(row.sigmaInfinity, environment.sigmaInfinity) ||
      (index > 0 && (
        row.attachedCount < result.rows[index - 1].attachedCount ||
        row.iExtent < result.rows[index - 1].iExtent ||
        row.jExtent < result.rows[index - 1].jExtent ||
        row.zExtent < result.rows[index - 1].zExtent ||
        row.largestExtent < result.rows[index - 1].largestExtent
      ))
    ) {
      return false;
    }
    previousSimTime = row.simTimeSeconds;
  }
  return previousSimTime > 0;
}

/** Registered B-EXEC-CONVERGENCE recomputation over every recorded step. */
function gate4BConvergenceValid(result: Gate4BRunResult): boolean {
  const { relaxTol, divTol, relaxMaxSweeps } = result.config;
  return result.rows.length > 0 && result.rows.every((row) => {
    if (
      !Number.isSafeInteger(row.sweeps) || row.sweeps < 1 || row.sweeps > relaxMaxSweeps ||
      !Number.isFinite(row.residual) || row.residual < 0 || !(row.residual < relaxTol) ||
      !Number.isFinite(row.shellInjection) || !(row.shellInjection > 0) ||
      !Number.isFinite(row.surfaceExchange) ||
      !Number.isFinite(row.divergenceResidual) || row.divergenceResidual < 0
    ) {
      return false;
    }
    const recomputed = Math.abs(row.shellInjection - row.surfaceExchange) /
      Math.max(Math.abs(row.surfaceExchange), 1e-300);
    return (
      Number.isFinite(recomputed) &&
      Math.abs(row.divergenceResidual - recomputed) <=
        8 * Number.EPSILON * Math.max(1, row.divergenceResidual, recomputed) &&
      recomputed < divTol
    );
  });
}

/** Registered B-EXEC-SURFACE bounds plus the exact physical-time chain. */
function gate4BSurfaceValid(result: Gate4BRunResult): boolean {
  let previousSimTime = 0;
  let holeFillTotal = 0;
  for (const row of result.rows) {
    if (
      !Number.isFinite(row.deltaTimeSeconds) || !(row.deltaTimeSeconds > 0) ||
      !Number.isFinite(row.maxKineticFillIncrement) || !(row.maxKineticFillIncrement > 0) ||
      !(row.maxKineticFillIncrement <= result.config.cflFill + 1e-12) ||
      !Number.isSafeInteger(row.holeFillCount) || row.holeFillCount < 0 ||
      !finiteNonNegative(row.deltaHoleFillDeficit) ||
      (row.holeFillCount > 0) !== (row.deltaHoleFillDeficit > 0) ||
      !Object.is(row.simTimeSeconds, previousSimTime + row.deltaTimeSeconds)
    ) {
      return false;
    }
    previousSimTime = row.simTimeSeconds;
    holeFillTotal += row.holeFillCount;
  }
  return result.rows.length > 0 && holeFillTotal === result.finalHoleFillCountTotal;
}

interface Gate4BLedgerVerdict {
  readonly valid: boolean;
  readonly failure: string;
}

/**
 * Registered B-EXEC-LEDGER arithmetic: the per-step identity at 1e-12, the run-total closure
 * at 1e-10, the solver-ledger binding at 1e-10, and the per-segment vapor-unit accumulation
 * at each step's temperature. Multiplying the whole history by the final M_ice fails here.
 */
function gate4BLedgerVerdict(result: Gate4BRunResult): Gate4BLedgerVerdict {
  if (result.rows.length === 0) return { valid: false, failure: "no recorded steps" };
  const placedTotal = new CompensatedSum();
  const clippedTotal = new CompensatedSum();
  const deficitTotal = new CompensatedSum();
  const demandTotal = new CompensatedSum();
  const vaporTotal = new CompensatedSum();
  for (const row of result.rows) {
    if (
      !finiteNonNegative(row.deltaPlacedFill) ||
      !finiteNonNegative(row.deltaSaturationClippedFill) ||
      !finiteNonNegative(row.deltaHoleFillDeficit) ||
      !finiteNonNegative(row.independentDemand)
    ) {
      return { valid: false, failure: `step ${row.step} ledger values are not finite and nonnegative` };
    }
    const error = Math.abs(
      row.deltaPlacedFill + row.deltaSaturationClippedFill - row.independentDemand,
    );
    if (!(error <= 1e-12 * Math.max(1, Math.abs(row.independentDemand)))) {
      return {
        valid: false,
        failure: `step ${row.step} placed+clipped did not close the independent demand (error ${error})`,
      };
    }
    placedTotal.add(row.deltaPlacedFill);
    clippedTotal.add(row.deltaSaturationClippedFill);
    deficitTotal.add(row.deltaHoleFillDeficit);
    demandTotal.add(row.independentDemand);
    vaporTotal.add(row.deltaPlacedFill * mIce(row.tempC));
  }
  const closure = (mine: number, recorded: number, scale: number, label: string): string | null =>
    Math.abs(recorded - mine) <= 1e-10 * Math.max(1, Math.abs(scale)) ? null : label;
  const totalDemand = demandTotal.value();
  const failures = [
    closure(placedTotal.value(), result.finalFillLedger, result.finalFillLedger,
      "recorded fill ledger diverged from the accumulated per-step placed fill"),
    closure(clippedTotal.value(), result.finalSaturationClippedFill, result.finalSaturationClippedFill,
      "recorded saturation-clipped total diverged from the accumulated per-step clipping"),
    closure(deficitTotal.value(), result.finalHoleFillDeficit, result.finalHoleFillDeficit,
      "recorded hole-fill deficit diverged from the accumulated per-step deficit"),
    closure(placedTotal.value() + clippedTotal.value(), totalDemand, totalDemand,
      "run-total demand closure failed"),
    closure(vaporTotal.value(), result.finalVaporUnits, result.finalVaporUnits,
      "vapor-unit ledger is not the per-step accumulation at each step's temperature " +
        "(final-temperature M_ice multiplication is a named failure)"),
  ].filter((value): value is string => value !== null);
  return failures.length === 0
    ? { valid: true, failure: "" }
    : { valid: false, failure: failures[0] };
}

function sameRecordedExtents(left: LatticeExtents, right: LatticeExtents): boolean {
  return left.iExtent === right.iExtent && left.jExtent === right.jExtent &&
    left.tExtent === right.tExtent && left.zExtent === right.zExtent &&
    left.largestExtent === right.largestExtent && left.attachedCount === right.attachedCount;
}

function rowRecordedExtents(row: Gate4BStepRow): LatticeExtents {
  return {
    iExtent: row.iExtent,
    jExtent: row.jExtent,
    tExtent: row.tExtent,
    zExtent: row.zExtent,
    largestExtent: row.largestExtent,
    attachedCount: row.attachedCount,
  };
}

/** Registered B-TIMELINE execution semantics, bound to reconstructed raw rows. */
export function gate4BTimelineEvidenceValid(result: Gate4BRunResult): boolean {
  if (result.config.schedule === null) return result.timeline === null;
  const timeline = result.timeline;
  if (
    timeline === null ||
    canonicalJson(timeline.schedule) !== canonicalJson(result.config.schedule) ||
    timeline.eventLog.length !== 1 ||
    result.config.schedule.events.length !== 1
  ) {
    return false;
  }
  let chain: Gate4BReconstructedChain;
  try {
    chain = reconstructedChain(result);
  } catch {
    // Broken attachment evidence belongs to B-EXEC-NUMERIC, not a second timeline failure.
    return true;
  }
  const entry = timeline.eventLog[0];
  const eventStep = timeline.eventStep;
  if (
    !Number.isSafeInteger(eventStep) || eventStep < 2 || eventStep > result.rows.length ||
    entry.crossingBoundary.phase !== "afterInterfaceStep" ||
    entry.crossingBoundary.completedCycles !== eventStep
  ) {
    return false;
  }
  const scheduledEvent = result.config.schedule.events[0];
  const trigger = scheduledEvent.trigger;
  if (trigger.kind === "tick") return false; // the registered history is extent-triggered
  const crossingRow = result.rows[eventStep - 1];
  const previousRow = result.rows[eventStep - 2];
  const expectedCrossingBoundary = {
    phase: "afterInterfaceStep" as const,
    completedCycles: eventStep,
    extents: rowRecordedExtents(crossingRow),
  };
  const expectedPreviousBoundary = {
    phase: "afterInterfaceStep" as const,
    completedCycles: eventStep - 1,
    extents: rowRecordedExtents(previousRow),
  };
  if (
    entry.eventIndex !== 0 ||
    entry.operator !== "LibbrechtKinetics" ||
    canonicalJson(entry.trigger) !== canonicalJson(trigger) ||
    canonicalJson(entry.previousBoundary) !== canonicalJson(expectedPreviousBoundary) ||
    canonicalJson(entry.crossingBoundary) !== canonicalJson(expectedCrossingBoundary) ||
    expectedPreviousBoundary.extents[trigger.kind] >= trigger.value ||
    expectedCrossingBoundary.extents[trigger.kind] < trigger.value ||
    canonicalJson(entry.beforeEnvironment) !==
      canonicalJson(result.config.schedule.initialEnvironment) ||
    canonicalJson(entry.afterEnvironment) !== canonicalJson(scheduledEvent.environment)
  ) {
    return false;
  }
  if (
    chain.occupancyAtEventStep === null ||
    timeline.aHashAtEvent !== rawTypedArraySha256(chain.occupancyAtEventStep) ||
    timeline.fHashBefore !== timeline.fHashAfter
  ) {
    return false;
  }
  try {
    const expectation = gate4BTimelineTransitionExpectation(
      result.config,
      chain.occupancyAtEventStep,
      timeline.sigmaBefore,
      result.config.schedule.initialEnvironment,
      scheduledEvent.environment,
      eventStep,
      crossingRow.simTimeSeconds,
    );
    return (
      canonicalJson(timeline.transitionReport) === canonicalJson(expectation.report) &&
      typedBitsEqual(timeline.sigmaAfter, expectation.sigmaAfter)
    );
  } catch {
    return false;
  }
}

/** Registered B-EXEC-TERMINATION: first-crossing size stop with no contact or alternate stop. */
function gate4BTerminationValid(result: Gate4BRunResult): boolean {
  const target = result.config.targetLargestExtent;
  const crossing = result.extentCrossing;
  if (
    result.stopReason !== "size-target" ||
    result.rows.length === 0 ||
    crossing === null ||
    crossing.crossingStep !== result.rows.length ||
    crossing.crossingStep >= result.config.stepCap ||
    crossing.previousStep !== crossing.crossingStep - 1 ||
    !(crossing.previousExtents.largestExtent < target) ||
    !(crossing.crossingExtents.largestExtent >= target) ||
    result.previousOccupancy === null
  ) {
    return false;
  }
  let previous: LatticeExtents | null;
  let final: LatticeExtents | null;
  try {
    previous = latticeExtents(result.previousOccupancy, result.config.dims);
    final = latticeExtents(result.finalA, result.config.dims);
  } catch {
    return false;
  }
  if (
    previous === null || final === null ||
    !sameRecordedExtents(previous, crossing.previousExtents) ||
    !sameRecordedExtents(final, crossing.crossingExtents)
  ) {
    return false;
  }
  const crossingRow = result.rows[result.rows.length - 1];
  if (
    crossingRow.largestExtent !== crossing.crossingExtents.largestExtent ||
    crossingRow.attachedCount !== crossing.crossingExtents.attachedCount
  ) {
    return false;
  }
  try {
    if (reconstructedChain(result).anyDomainContact) return false;
  } catch {
    // A malformed chain is B-EXEC-NUMERIC; do not double-classify it here.
    return true;
  }
  return gate4BTimelineEvidenceValid(result);
}

/** Registered B-EXEC-SYMMETRY on noise-off runs; the delta chain recomputes every flag. */
function gate4BSymmetryValid(result: Gate4BRunResult): boolean {
  if (result.config.noiseEpsilon !== 0) return true;
  try {
    reconstructedChain(result);
  } catch {
    return true; // malformed chains belong to B-EXEC-NUMERIC
  }
  return (
    result.seedSymmetric &&
    result.rows.every((row) => row.deltaSymmetric === true || row.deltaCount === 0) &&
    symmetryError(result.finalA, result.config.dims, domainCenter(result.config.dims)) === 0
  );
}

interface NeighborCounts {
  readonly nT: Uint8Array;
  readonly nZ: Uint8Array;
}

/** Independent raw neighbor counts from an occupancy array (6 T-contacts, 2 Z-contacts). */
function neighborCountsOf(occupancy: Uint8Array, dims: Dims): NeighborCounts {
  const n = cellCount(dims);
  const nT = new Uint8Array(n);
  const nZ = new Uint8Array(n);
  const plane = dims.nx * dims.ny;
  for (let index = 0; index < n; index++) {
    if (occupancy[index] !== 1) continue;
    const k = Math.floor(index / plane);
    const inPlane = index - k * plane;
    const j = Math.floor(inPlane / dims.nx);
    const i = inPlane - j * dims.nx;
    if (i + 1 < dims.nx) nT[index + 1]++;
    if (i - 1 >= 0) nT[index - 1]++;
    if (j + 1 < dims.ny) nT[index + dims.nx]++;
    if (j - 1 >= 0) nT[index - dims.nx]++;
    if (i + 1 < dims.nx && j - 1 >= 0) nT[index + 1 - dims.nx]++;
    if (i - 1 >= 0 && j + 1 < dims.ny) nT[index - 1 + dims.nx]++;
    if (k + 1 < dims.nz) nZ[index + plane]++;
    if (k - 1 >= 0) nZ[index - plane]++;
  }
  return { nT, nZ };
}

/**
 * Registered B-EXEC-NOISE per-run evidence: pinned stream and controls, an independently
 * revalidated dual-outcome witness, checkpoint round-trip of epsilon and seed (not the fixed
 * stream id), and raw-chain binding of every witness cell's boundary membership and counts.
 */
function gate4BNoiseRunValid(result: Gate4BRunResult): boolean {
  if (result.config.noiseEpsilon === 0) {
    return result.noiseWitness === null && result.config.noiseStreamId === null;
  }
  const witness = result.noiseWitness;
  if (witness === null || result.config.noiseStreamId !== STREAM_NOISE_ALPHA_HK) return false;
  if (validateGate4BNoiseWitness(witness, result.config).length > 0) return false;
  let decoded: ReturnType<typeof decodeLKCheckpoint>;
  try {
    decoded = decodeLKCheckpoint(result.checkpoint);
  } catch {
    return false;
  }
  if (
    decoded.header.noiseEpsilon !== result.config.noiseEpsilon ||
    decoded.header.rngSeed !== result.config.rngSeed
  ) {
    return false;
  }
  let chain: Gate4BReconstructedChain;
  try {
    chain = reconstructedChain(result);
  } catch {
    return true; // malformed chains belong to B-EXEC-NUMERIC
  }
  const occupancy = chain.occupancyAtNoiseTick;
  if (occupancy === null) return false;
  const { dims } = result.config;
  const wall = hexPrismWallMask(dims, domainCenter(dims));
  const counts = neighborCountsOf(occupancy, dims);
  const boundary = new Set<number>();
  for (let index = 0; index < occupancy.length; index++) {
    if (
      occupancy[index] === 0 && wall[index] === 0 &&
      (counts.nT[index] > 0 || counts.nZ[index] > 0)
    ) {
      boundary.add(index);
    }
  }
  if (witness.cells.length !== boundary.size) return false;
  for (const cell of witness.cells) {
    if (
      !boundary.has(cell.index) ||
      cell.nT !== counts.nT[cell.index] ||
      cell.nZ !== counts.nZ[cell.index]
    ) {
      return false;
    }
  }
  return true;
}

/** Same-seed replay must be a distinct execution that is bit-identical across a, f, sigma. */
function gate4BReplayBitsValid(
  primary: Gate4BRunResult | undefined,
  replay: Gate4BRunResult | undefined,
): boolean {
  return (
    primary !== undefined && replay !== undefined && primary !== replay &&
    primary.executionId !== replay.executionId &&
    primary.config.rngSeed === replay.config.rngSeed &&
    primary.rows.length === replay.rows.length &&
    primary.stopReason === replay.stopReason &&
    canonicalJson(primary.rows) === canonicalJson(replay.rows) &&
    typedBitsEqual(primary.finalA, replay.finalA) &&
    typedBitsEqual(primary.finalF, replay.finalF) &&
    typedBitsEqual(primary.finalSigma, replay.finalSigma)
  );
}

function gate4BCheckpointValid(result: Gate4BRunResult): boolean {
  try {
    verifyGate4BCheckpoint(result.checkpoint, result);
    return true;
  } catch {
    return false;
  }
}

function gate4BPecletValid(result: Gate4BRunResult): boolean {
  const recomputed = gate4BRegisteredPecletBound(result.config);
  return (
    Number.isFinite(recomputed) &&
    recomputed < GATE4B_PECLET_BOUND_LIMIT &&
    Object.is(result.pecletBound, recomputed)
  );
}

function gate4BChainNumericValid(result: Gate4BRunResult): boolean {
  try {
    reconstructedChain(result);
    return true;
  } catch {
    return false;
  }
}

function gate4BFinalNumericValid(result: Gate4BRunResult): boolean {
  const n = cellCount(result.config.dims);
  if (
    result.finalA.length !== n || result.finalF.length !== n || result.finalSigma.length !== n ||
    result.initialOccupancy.length !== n
  ) {
    return false;
  }
  for (let index = 0; index < n; index++) {
    if (result.finalA[index] !== 0 && result.finalA[index] !== 1) return false;
    const f = result.finalF[index];
    const sigma = result.finalSigma[index];
    // Negative LK supersaturation is permitted (>= -1); NaN and infinities are not.
    if (!Number.isFinite(f) || f < 0 || f > 1) return false;
    if (!Number.isFinite(sigma) || sigma < -1) return false;
    if (result.finalA[index] === 1 && (f !== 1 || sigma !== 0)) return false;
  }
  if (
    !finiteNonNegative(result.finalFillLedger) ||
    !finiteNonNegative(result.finalSaturationClippedFill) ||
    !finiteNonNegative(result.finalHoleFillDeficit) ||
    !finiteNonNegative(result.finalVaporUnits) ||
    !Number.isSafeInteger(result.finalHoleFillCountTotal) || result.finalHoleFillCountTotal < 0 ||
    !Number.isFinite(result.pecletBound)
  ) {
    return false;
  }
  try {
    gate4BScenarioPayload(result);
  } catch {
    return false;
  }
  return true;
}

function gate4BConfigResultValid(result: Gate4BRunResult, registered: Gate4BRunConfig): boolean {
  const center = domainCenter(result.config.dims);
  return (
    canonicalJson(result.config) === canonicalJson(registered) &&
    result.registeredConfigSha256 === canonicalJsonSha256(registered) &&
    /^[0-9a-f]{64}$/.test(result.executionId) &&
    result.initialOccupancy.length === cellCount(result.config.dims) &&
    typedBitsEqual(result.initialOccupancy, canonicalSeedOccupancy(result.config.dims, center)) &&
    result.seedSymmetric === true
  );
}

/** Shared configuration slots that every registered Pass-B run must carry identically. */
function gate4BCommonConfigHash(config: Gate4BRunConfig): string {
  return canonicalJsonSha256({
    operator: config.operator,
    backend: config.backend,
    surfacePolicy: config.surfacePolicy,
    dims: config.dims,
    domain: config.domain,
    farField: config.farField,
    seedRadius: config.seedRadius,
    seedThickness: config.seedThickness,
    dxUm: config.dxUm,
    pressurePa: config.pressurePa,
    paramSet: config.paramSet,
    cflFill: config.cflFill,
    relaxTol: config.relaxTol,
    divTol: config.divTol,
    relaxMaxSweeps: config.relaxMaxSweeps,
    targetLargestExtent: config.targetLargestExtent,
    stepCap: config.stepCap,
  });
}

/** Every per-run execution check for one result against its registered configuration. */
export function gate4BSingleRunExecutionValid(
  result: Gate4BRunResult,
  registered: Gate4BRunConfig,
): boolean {
  return (
    gate4BConfigResultValid(result, registered) &&
    gate4BRowsStructurallyValid(result) &&
    gate4BChainNumericValid(result) &&
    gate4BConvergenceValid(result) &&
    gate4BSurfaceValid(result) &&
    gate4BLedgerVerdict(result).valid &&
    gate4BTerminationValid(result) &&
    gate4BSymmetryValid(result) &&
    gate4BNoiseRunValid(result) &&
    gate4BCheckpointValid(result) &&
    gate4BPecletValid(result) &&
    gate4BFinalNumericValid(result)
  );
}

// ── Execution-criteria derivation ──────────────────────────────────────────────────────────

export interface DeriveGate4BExecutionOptions {
  readonly provenance: Gate4BProvenance;
  readonly manifest: Gate4BManifest;
  readonly results: readonly Gate4BRunResult[];
  readonly artifacts: readonly EvidenceArtifactInput[];
}

interface Gate4BCompleteness {
  readonly passed: boolean;
  readonly failures: readonly string[];
}

/** B-EXEC-COMPLETE: every registered sweep point, seed, replay, sample extent, and timeline
    event appears exactly once; missing and duplicate records fail by name. */
function gate4BCompleteness(
  manifest: Gate4BManifest,
  results: readonly Gate4BRunResult[],
): Gate4BCompleteness {
  const failures: string[] = [];
  const registeredIds = manifest.runs.map((run) => run.id);
  const ids = results.map((result) => result.config.id);
  for (const id of registeredIds) {
    const count = ids.filter((candidate) => candidate === id).length;
    if (count === 0) failures.push(`registered run ${id} is missing`);
    if (count > 1) failures.push(`registered run ${id} appears ${count} times`);
  }
  for (const id of ids) {
    if (!registeredIds.includes(id)) failures.push(`run ${id} is not registered`);
  }
  if (failures.length === 0 && canonicalJson(ids) !== canonicalJson(registeredIds)) {
    failures.push("registered run order shifted");
  }
  const byId = new Map(results.map((result) => [result.config.id, result]));
  const habitTemps = B_HABIT_TEMPERATURES.map(
    (tempC) => byId.get(habitRunId(tempC))?.config.tempC ?? null,
  );
  if (canonicalJson(habitTemps) !== canonicalJson([...B_HABIT_TEMPERATURES])) {
    failures.push("registered temperature sweep is incomplete or reordered");
  }
  const depletionRun = byId.get(habitRunId(-15));
  const sampleTargets = depletionRun?.depletionSamples.map((sample) => sample.targetExtent) ?? [];
  if (canonicalJson(sampleTargets) !== canonicalJson([...GATE4B_DEPLETION_TARGETS])) {
    failures.push("registered depletion sample extents are missing, duplicated, or reordered");
  }
  const hollowSeeds = [1, 2, 3].map(
    (seed) => byId.get(`B-HOLLOW-SEED-${seed}`)?.config.rngSeed ?? null,
  );
  if (canonicalJson(hollowSeeds) !== canonicalJson([1, 2, 3])) {
    failures.push("registered hollow ensemble seeds are incomplete");
  }
  const replay = byId.get("B-HOLLOW-SEED-1-REPLAY");
  if (replay === undefined || replay.config.replayOf !== "B-HOLLOW-SEED-1") {
    failures.push("registered seed-1 replay is missing or unlinked");
  }
  const timeline = byId.get("B-TIMELINE");
  if (timeline === undefined || timeline.timeline === null || timeline.timeline.eventLog.length !== 1) {
    failures.push("registered timeline event did not appear exactly once");
  }
  if (byId.get("B-BRANCH") === undefined) failures.push("registered branch run is missing");
  return { passed: failures.length === 0, failures };
}

/** Derive all twelve B-EXEC records from raw run/artifact/provenance evidence. */
export function deriveGate4BExecutionRecords(
  options: DeriveGate4BExecutionOptions,
): readonly Phase4CriterionRecord<BExecutionCriterion>[] {
  const provenanceFailures = validateGate4BProvenance(options.provenance);
  const provenancePass = provenanceFailures.length === 0;
  const registeredById = new Map(options.manifest.runs.map((run) => [run.id, run]));
  const resultById = new Map(options.results.map((result) => [result.config.id, result]));
  const commonHashes = new Set(options.results.map((result) => gate4BCommonConfigHash(result.config)));
  const configPass =
    canonicalJson(options.manifest) === canonicalJson(buildGate4BManifest()) &&
    canonicalJsonSha256(options.manifest) === GATE4B_MANIFEST_SHA256 &&
    commonHashes.size <= 1 &&
    options.results.every((result) => {
      const registered = registeredById.get(result.config.id);
      return registered !== undefined && gate4BConfigResultValid(result, registered);
    });

  let artifactFailure = "";
  try {
    validateGate4BArtifacts(options.manifest, options.results, options.artifacts);
  } catch (error) {
    artifactFailure = error instanceof Error ? error.message : String(error);
  }
  const routedArtifactCriterion = (B_EXECUTION_CRITERIA as readonly string[]).find((name) =>
    artifactFailure.startsWith(`${name}:`),
  ) ?? (artifactFailure === "" ? null : "B-EXEC-NUMERIC");

  // Presence/uniqueness of registered records is owned by B-EXEC-COMPLETE alone; the per-run
  // criteria below evaluate every record that is present.
  const everyRun = (check: (result: Gate4BRunResult) => boolean): boolean =>
    options.results.every(check);

  const terminationPass = everyRun(gate4BTerminationValid);
  const symmetryPass = everyRun(gate4BSymmetryValid);
  const primary = resultById.get("B-HOLLOW-SEED-1");
  const replay = resultById.get("B-HOLLOW-SEED-1-REPLAY");
  const replayBits = gate4BReplayBitsValid(primary, replay);
  const noiseOn = options.results.filter((result) => result.config.noiseEpsilon > 0);
  const noisePass = noiseOn.length === 4 && options.results.every(gate4BNoiseRunValid) &&
    replayBits && routedArtifactCriterion !== "B-EXEC-NOISE";
  const convergencePass = everyRun(gate4BConvergenceValid);
  const surfacePass = everyRun(gate4BSurfaceValid);
  const ledgerVerdicts = options.results.map((result) => ({
    id: result.config.id,
    verdict: gate4BLedgerVerdict(result),
  }));
  const ledgerFailures = ledgerVerdicts
    .filter((item) => !item.verdict.valid)
    .map((item) => `${item.id}: ${item.verdict.failure}`);
  const ledgerPass = ledgerFailures.length === 0;
  const pecletPass = everyRun(gate4BPecletValid);
  const checkpointPass = everyRun(gate4BCheckpointValid) &&
    routedArtifactCriterion !== "B-EXEC-CHECKPOINT";
  const numericPass =
    everyRun((result) =>
      gate4BRowsStructurallyValid(result) &&
      gate4BChainNumericValid(result) &&
      gate4BFinalNumericValid(result)
    ) &&
    (routedArtifactCriterion === null || routedArtifactCriterion !== "B-EXEC-NUMERIC");
  const completeness = gate4BCompleteness(options.manifest, options.results);
  const configCriterionPass = configPass && routedArtifactCriterion !== "B-EXEC-CONFIG";
  const terminationCriterionPass = terminationPass &&
    routedArtifactCriterion !== "B-EXEC-TERMINATION";
  const worstDivergence = options.results.reduce(
    (maximum, result) => result.rows.reduce(
      (inner, row) => Math.max(inner, row.divergenceResidual),
      maximum,
    ),
    0,
  );
  const maxPeclet = options.results.reduce(
    (maximum, result) => Math.max(maximum, result.pecletBound),
    0,
  );
  return [
    createPhase4CriterionRecord("B-EXEC-PROVENANCE", provenancePass,
      provenancePass
        ? "exact engine and clean criteria-freeze ancestry pass"
        : `provenance failed: ${provenanceFailures.join("; ")}`,
      { head: options.provenance.head, node: options.provenance.node, v8: options.provenance.v8 }),
    createPhase4CriterionRecord("B-EXEC-CONFIG", configCriterionPass,
      configCriterionPass
        ? "manifest bytes, registered configs, canonical seeds, and shared constants match the freeze"
        : `manifest/config/seed mismatch${routedArtifactCriterion === "B-EXEC-CONFIG" ? `: ${artifactFailure}` : ""}`,
      { manifestSha256: canonicalJsonSha256(options.manifest), runs: options.results.length }),
    createPhase4CriterionRecord("B-EXEC-TERMINATION", terminationCriterionPass,
      terminationCriterionPass
        ? "every run reached its registered size target with a proven first crossing"
        : "a stop reason, first crossing, contact, cap, or timeline execution fact failed",
      { runs: options.results.length }),
    createPhase4CriterionRecord("B-EXEC-SYMMETRY", symmetryPass,
      symmetryPass
        ? "all noise-off deltas and final occupancies are exactly D6h"
        : "noise-off raw symmetry evidence failed",
      { noiseOffRuns: options.results.filter((result) => result.config.noiseEpsilon === 0).length }),
    createPhase4CriterionRecord("B-EXEC-NOISE", noisePass,
      noisePass
        ? "pinned-stream dual-outcome witnesses verify and seed-1 replays raw fields bitwise"
        : "noise provenance, applied-coefficient witness, or replay failed",
      { noiseRuns: noiseOn.length, replayBits }),
    createPhase4CriterionRecord("B-EXEC-CONVERGENCE", convergencePass,
      convergencePass
        ? "every step satisfies dual convergence with an independently recomputed divergence"
        : "a step's convergence report or recomputed divergence identity failed",
      { worstDivergence: Number.isFinite(worstDivergence) ? worstDivergence : null }),
    createPhase4CriterionRecord("B-EXEC-SURFACE", surfacePass,
      surfacePass
        ? "every interface step has a positive physical timestep within the fill-CFL bound"
        : "an interface step stalled, skipped, broke the time chain, or violated the fill-CFL",
      { runs: options.results.length }),
    createPhase4CriterionRecord("B-EXEC-LEDGER", ledgerPass,
      ledgerPass
        ? "placed fill plus recorded clipping closes the independent Hertz-Knudsen demand"
        : `ledger identity failed: ${ledgerFailures.join("; ") || "registered records incomplete"}`,
      { runs: options.results.length }),
    createPhase4CriterionRecord("B-EXEC-PECLET", pecletPass,
      pecletPass
        ? "every registered conservative Peclet bound is finite and below 1e-2"
        : "a registered Peclet bound is missing, nonfinite, or too large",
      { maxPecletBound: Number.isFinite(maxPeclet) ? maxPeclet : null }),
    createPhase4CriterionRecord("B-EXEC-CHECKPOINT", checkpointPass,
      checkpointPass
        ? "every final LK v2 checkpoint decodes strictly and matches raw fields bit-for-bit"
        : `a checkpoint decode, metadata, field, or byte-stability check failed${routedArtifactCriterion === "B-EXEC-CHECKPOINT" ? `: ${artifactFailure}` : ""}`,
      { runs: options.results.length }),
    createPhase4CriterionRecord("B-EXEC-NUMERIC", numericPass,
      numericPass
        ? "all raw rows, chains, fields, and reopened artifacts are complete and finite"
        : `numeric/artifact completeness failed${routedArtifactCriterion === "B-EXEC-NUMERIC" ? `: ${artifactFailure}` : ""}`,
      { artifacts: options.artifacts.length, runs: options.results.length }),
    createPhase4CriterionRecord("B-EXEC-COMPLETE", completeness.passed,
      completeness.passed
        ? "every registered sweep point, seed, replay, sample extent, and timeline event appears exactly once"
        : completeness.failures.join("; "),
      { runs: options.results.length }),
  ];
}

// ── Morphology derivation (diagnostic) ─────────────────────────────────────────────────────

function requiredResult(
  byId: ReadonlyMap<string, Gate4BRunResult>,
  id: string,
): Gate4BRunResult {
  const result = byId.get(id);
  if (result === undefined) throw new Error(`B-EXEC-COMPLETE: required run ${id} is missing`);
  return result;
}

function crossingOrThrow(result: Gate4BRunResult): Gate4BExtentCrossing {
  if (result.extentCrossing === null) {
    throw new Error(`B-EXEC-TERMINATION: ${result.config.id} has no extent crossing`);
  }
  return result.extentCrossing;
}

/** Derive every diagnostic morphology record from final raw arrays and registered evidence. */
export function deriveGate4BMorphologyRecords(
  manifest: Gate4BManifest,
  results: readonly Gate4BRunResult[],
): readonly Phase4CriterionRecord<BMorphologyCriterion>[] {
  const byId = new Map(results.map((result) => [result.config.id, result]));
  const registeredById = new Map(manifest.runs.map((run) => [run.id, run]));
  const valid = (result: Gate4BRunResult): boolean => {
    const registered = registeredById.get(result.config.id);
    return registered !== undefined && gate4BSingleRunExecutionValid(result, registered);
  };
  const habitRecords = evaluateBHabit(B_HABIT_TEMPERATURES.map((tempC) => {
    const result = requiredResult(byId, habitRunId(tempC));
    return {
      tempC: result.config.tempC,
      aspectRatio: aspectRatio(result.finalA, result.config.dims),
      crossSectionHollowness: crossSectionHollowness(result.finalA, result.config.dims),
      sealedVoidFraction: sealedVoidFraction(result.finalA, result.config.dims),
    };
  }));

  const depletionResult = requiredResult(byId, habitRunId(-15));
  const depletionCrossing = crossingOrThrow(depletionResult);
  const depletionRecords = evaluateBDepletion(depletionResult.depletionSamples, {
    targetExtent: GATE4B_TARGET_LARGEST_EXTENT,
    stopReason: depletionResult.stopReason,
    completedCycles: depletionResult.rows.length,
    largestExtent: depletionCrossing.crossingExtents.largestExtent,
    aspectRatio: aspectRatio(depletionResult.finalA, depletionResult.config.dims),
    stepCap: GATE4B_STEP_CAP,
  });

  const asHollow = (result: Gate4BRunResult): HollowRun => {
    const crossing = crossingOrThrow(result);
    if (result.previousOccupancy === null) {
      throw new Error(`B-EXEC-NUMERIC: ${result.config.id} lacks raw hollow crossing arrays`);
    }
    return {
      executionId: result.executionId,
      seed: result.config.rngSeed,
      dims: result.config.dims,
      targetLargestExtent: result.config.targetLargestExtent,
      stepCap: result.config.stepCap,
      stopReason: result.stopReason,
      previousCycle: crossing.previousStep,
      crossingCycle: crossing.crossingStep,
      previousLargestExtent: crossing.previousExtents.largestExtent,
      crossingLargestExtent: crossing.crossingExtents.largestExtent,
      executionValid: valid(result),
      initialOccupancy: result.initialOccupancy,
      previousOccupancy: result.previousOccupancy,
      state: {
        occupancy: result.finalA,
        surfaceField: result.finalF,
        vaporField: result.finalSigma,
      },
    };
  };
  const hollowRecord = evaluateBHollow(
    [1, 2, 3].map((seed) => asHollow(requiredResult(byId, `B-HOLLOW-SEED-${seed}`))),
    asHollow(requiredResult(byId, "B-HOLLOW-SEED-1-REPLAY")),
  );

  const timelineResult = requiredResult(byId, "B-TIMELINE");
  let preEventAspectRatio = Number.NaN;
  try {
    preEventAspectRatio = reconstructedChain(timelineResult).preEventAspectRatio ?? Number.NaN;
  } catch {
    preEventAspectRatio = Number.NaN;
  }
  const timelineRecord = evaluateBTimeline({
    preEventAspectRatio,
    profile: cappedColumnProfile(
      timelineResult.finalA,
      timelineResult.config.dims,
      domainCenter(timelineResult.config.dims),
    ),
  });

  const branchResult = requiredResult(byId, "B-BRANCH");
  const branchRecord = evaluateBBranch(
    branchCount(branchResult.finalA, branchResult.config.dims, domainCenter(branchResult.config.dims)),
    aspectRatio(branchResult.finalA, branchResult.config.dims),
  );
  return [...habitRecords, ...depletionRecords, hollowRecord, timelineRecord, branchRecord];
}

// ── Orchestration ──────────────────────────────────────────────────────────────────────────

export interface Gate4BRunOutcome {
  readonly manifest: Gate4BManifest;
  readonly provenance: Gate4BProvenance;
  readonly results: readonly Gate4BRunResult[];
  readonly records: readonly Phase4CriterionRecord<BExecutionCriterion | BMorphologyCriterion>[];
  readonly verdict: Gate4BVerdict;
  readonly artifacts: readonly EvidenceArtifactInput[];
  readonly publication: PublishedEvidenceBundle | null;
}

export interface RunGate4BOptions {
  readonly repoRoot?: string;
  readonly canonicalDirectory?: string;
  /** Test-only preflight seam. The CLI always rebuilds the registered manifest directly. */
  readonly buildManifest?: () => Gate4BManifest;
  readonly collectProvenance?: () => Gate4BProvenance;
  readonly executeRun?: (
    config: Gate4BRunConfig,
    options: ExecuteGate4BRunOptions,
  ) => Gate4BRunResult;
  readonly publish?: typeof publishEvidenceBundle;
  readonly onProgress?: (runId: string, step: number, attached: number) => void;
  readonly onRelaxation?: ExecuteGate4BRunOptions["onRelaxation"];
}

function resultSummary(result: Gate4BRunResult): StrictJson {
  return strictJsonSnapshot({
    runId: result.config.id,
    executionId: result.executionId,
    configSha256: result.registeredConfigSha256,
    completedSteps: result.rows.length,
    stopReason: result.stopReason,
    extentCrossing: result.extentCrossing,
    simTimeSeconds: result.rows[result.rows.length - 1]?.simTimeSeconds ?? 0,
    pecletBound: result.pecletBound,
    ledger: {
      fillLedgerIceCells: result.finalFillLedger,
      saturationClippedFill: result.finalSaturationClippedFill,
      holeFillDeficit: result.finalHoleFillDeficit,
      fillLedgerVaporUnits: result.finalVaporUnits,
    },
    final: {
      aSha256: rawTypedArraySha256(result.finalA),
      fSha256: rawTypedArraySha256(result.finalF),
      sigmaSha256: rawTypedArraySha256(result.finalSigma),
      checkpointSha256: sha256Bytes(result.checkpoint),
    },
    environment: {
      initial: { tempC: result.config.tempC, sigmaInfinity: result.config.sigmaInfinity },
      final: finalEnvironmentOf(result),
    },
  });
}

/** Stable criterion ownership for all Pass-B publication failures. */
export function publishGate4BBundle(
  options: Parameters<typeof publishEvidenceBundle>[0],
  publish: typeof publishEvidenceBundle = publishEvidenceBundle,
): PublishedEvidenceBundle {
  try {
    return publish(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      message.startsWith("B-EXEC-NUMERIC:")
        ? message
        : `B-EXEC-NUMERIC: evidence publication failed: ${message}`,
    );
  }
}

/** Serial Pass-B orchestration. The real CLI supplies no dependencies or bypasses. */
export function runGate4B(options: RunGate4BOptions = {}): Gate4BRunOutcome {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const manifest = options.buildManifest?.() ?? buildGate4BManifest();
  if (canonicalJsonSha256(manifest) !== GATE4B_MANIFEST_SHA256) {
    throw new Error("B-EXEC-CONFIG: rebuilt Pass-B manifest differs from the reviewed freeze");
  }
  const canonicalDirectory = resolve(
    repoRoot,
    options.canonicalDirectory ?? GATE4B_CANONICAL_DIRECTORY,
  );
  if (existsSync(canonicalDirectory)) {
    throw new Error(`B-EXEC-NUMERIC: canonical evidence already exists: ${canonicalDirectory}`);
  }
  const provenance = options.collectProvenance?.() ?? collectGate4BProvenance(repoRoot);
  const provenanceFailures = validateGate4BProvenance(provenance);
  if (provenanceFailures.length > 0) {
    throw new Error(`B-EXEC-PROVENANCE: ${provenanceFailures.join("; ")}`);
  }
  const executeRun = options.executeRun ?? executeGate4BRun;
  const results: Gate4BRunResult[] = [];
  for (const config of manifest.runs) {
    results.push(executeRun(config, {
      onProgress: options.onProgress,
      onRelaxation: options.onRelaxation,
    }));
  }
  const artifacts = buildGate4BArtifacts(manifest, results);
  const executionRecords = deriveGate4BExecutionRecords({
    provenance,
    manifest,
    results,
    artifacts,
  });
  const morphologyRecords = deriveGate4BMorphologyRecords(manifest, results);
  const records = [...executionRecords, ...morphologyRecords];
  const verdict = evaluateGate4B(records);
  let publication: PublishedEvidenceBundle | null = null;
  if (verdict.executionValid) {
    const publish = options.publish ?? publishEvidenceBundle;
    publication = publishGate4BBundle({
      canonicalDirectory,
      reportPath: GATE4B_REPORT_PATH,
      protocol: GATE4B_PROTOCOL,
      pass: "B",
      operator: "LibbrechtKinetics",
      payload: {
        version: 1,
        manifestSha256: GATE4B_MANIFEST_SHA256,
        provenance,
        records,
        verdict,
        runs: results.map(resultSummary),
      },
      artifacts,
    }, publish);
  }
  return { manifest, provenance, results, records, verdict, artifacts, publication };
}

// ── Terminal presentation ──────────────────────────────────────────────────────────────────

export interface Gate4BTerminalPresentation {
  readonly exitCode: 0 | 1;
  readonly stdoutLines: readonly string[];
  readonly stderrLines: readonly string[];
}

function terminalFact(label: string, value: unknown): string {
  return `GATE4B ${label} ${canonicalJson(strictJsonSnapshot(value))}`;
}

/** Deterministic terminal evidence derived only from the verified orchestration outcome. */
export function formatGate4BTerminalPresentation(
  outcome: Gate4BRunOutcome,
): Gate4BTerminalPresentation {
  // Pass B's terminal analog of the Pass-A verdict/publication guard: execution validity is
  // the publication condition, independent of the diagnostic morphology verdicts.
  if (outcome.verdict.executionValid && outcome.publication === null) {
    throw new Error("B-EXEC-NUMERIC: execution-valid verdict requires a verified publication");
  }
  if (!outcome.verdict.executionValid && outcome.publication !== null) {
    throw new Error("B-EXEC-NUMERIC: execution-invalid verdict must not carry a publication");
  }
  const artifactDescriptors = outcome.publication === null
    ? outcome.artifacts.map((artifact) => ({
        path: artifact.path,
        kind: artifact.kind,
        byteLength: artifact.bytes.byteLength,
        sha256: sha256Bytes(artifact.bytes),
      }))
    : outcome.publication.index.artifacts;
  const sortedArtifacts = [...artifactDescriptors].sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0
  );
  const diagnosticRecords = outcome.records.filter(
    (record) => (B_EXECUTION_CRITERIA as readonly string[]).indexOf(record.criterion) === -1,
  );
  const stdoutLines = [
    terminalFact("PROVENANCE", outcome.provenance),
    terminalFact("SURFACE", {
      operator: "LibbrechtKinetics",
      protocol: GATE4B_PROTOCOL,
      surfacePolicy: GATE4B_SURFACE_POLICY,
      domain: "hexPrism",
      farField: "dirichlet",
      paramSet: GATE4B_PARAM_SET,
    }),
    `GATE4B MANIFEST ${canonicalJson(outcome.manifest)}`,
    ...outcome.results.map((result) => terminalFact("TERMINATION", {
      runId: result.config.id,
      executionId: result.executionId,
      completedSteps: result.rows.length,
      stopReason: result.stopReason,
      extentCrossing: result.extentCrossing,
    })),
    ...sortedArtifacts.map((artifact) => terminalFact("ARTIFACT", artifact)),
    ...diagnosticRecords.map((record) => terminalFact("DIAGNOSTIC", {
      criterion: record.criterion,
      diagnosticPass: record.passed,
      summary: record.summary,
      measurements: record.measurements,
    })),
  ];
  if (outcome.verdict.executionValid) {
    stdoutLines.push(terminalFact("PASSED", {
      executions: outcome.results.length,
      payloadArtifacts: outcome.artifacts.length,
      manifestSha256: GATE4B_MANIFEST_SHA256,
      diagnosticPass: outcome.verdict.diagnosticPass,
      diagnosticFailures: outcome.verdict.diagnosticFailures,
      published: outcome.publication?.directory ?? null,
    }));
    stdoutLines.push("GATE4B EXIT STATUS: 0");
    return { exitCode: 0, stdoutLines, stderrLines: [] };
  }
  const stderrLines = [
    "GATE4B FAILED:",
    ...outcome.verdict.contractFailures.map((failure) => `  - ${failure}`),
    ...outcome.verdict.executionFailures.map((criterion) => `  - ${criterion}`),
    "GATE4B EXIT STATUS: 1",
  ];
  return { exitCode: 1, stdoutLines, stderrLines };
}

/** CLI presentation only; main.ts owns exit-code assignment and flag rejection. */
export function gate4b(): 0 | 1 {
  let lastHeartbeat = Date.now();
  const outcome = runGate4B({
    onProgress: (runId, step, attached) => {
      if (step % 25 === 0) console.log(`gate4b run=${runId} step=${step} attached=${attached}`);
    },
    onRelaxation: (runId, step, sweeps, residual, divergenceResidual) => {
      const now = Date.now();
      if (now - lastHeartbeat < 60_000) return;
      lastHeartbeat = now;
      console.log(
        `gate4b relax run=${runId} step=${step} sweeps=${sweeps}` +
          ` residual=${residual.toExponential(2)}` +
          ` div=${divergenceResidual === null ? "n/a" : divergenceResidual.toExponential(2)}`,
      );
    },
  });
  const presentation = formatGate4BTerminalPresentation(outcome);
  for (const line of presentation.stdoutLines) console.log(line);
  for (const line of presentation.stderrLines) console.error(line);
  return presentation.exitCode;
}
