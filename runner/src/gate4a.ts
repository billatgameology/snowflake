// Phase 4 Pass A: the blocking GGThreshold morphology and evidence gauntlet.
//
// Importing this module never starts a run. The CLI calls gate4a() with no injectable seams;
// tests use the exported pure validators or pass direct-function dependencies to runGate4A.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  GG_PRESETS,
  DOMAIN_CONTACT_FRACTION,
  STREAM_NOISE_XI,
  aspectRatio,
  branchCount,
  cappedColumnProfile,
  cellCount,
  centerRimDepletion,
  computeMetrics,
  createTimelineCursor,
  crossSectionHollowness,
  decodeCheckpoint,
  domainCenter,
  encodeCheckpoint,
  evaluateTimelineBoundary,
  ggParamsFromTimelineEnvironment,
  ggTimelineEnvironmentFromParams,
  hexDistance,
  hexSeedSites,
  idx,
  isD6hInvariantSet,
  latticeExtents,
  randomBit,
  sealedVoidFraction,
  symmetryError,
  type Dims,
  type CheckpointMetrics,
  type GGTimelineEnvironment,
  type GGTimelineSchedule,
  type LatticeExtents,
  type TimelineCursor,
  type TimelineEventLogEntry,
} from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";
import {
  canonicalJson,
  canonicalJsonBytes,
  canonicalJsonSha256,
  parseCanonicalJson,
  publishEvidenceBundle,
  rawTypedArraySha256,
  readRegularArtifact,
  sha256Bytes,
  strictJsonSnapshot,
  type EvidenceArtifactInput,
  type PublishedEvidenceBundle,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  decodeGGNoiseWitness,
  encodeGGNoiseWitness,
  evaluateGGNoiseWitness,
  type GGNoiseWitness,
  type GGNoiseWitnessVerdict,
} from "./gate4a-reference.ts";
import {
  A_DEPLETION_STEP_CAP,
  A_EXECUTION_CRITERIA,
  A_HABIT_BETA_01,
  A_HABIT_CONTROLS,
  A_HABIT_STEP_CAP,
  A_HABIT_TARGET_LARGEST_EXTENT,
  A_HOLLOW_STEP_CAP,
  evaluateABranch,
  evaluateADepletion,
  evaluateAHabit,
  evaluateAHollow,
  evaluateATimeline,
  evaluateGate4A,
  createPhase4CriterionRecord,
  type AExecutionCriterion,
  type AMorphologyCriterion,
  type DepletionSample,
  type Gate4AVerdict,
  type HollowRun,
  type Phase4CriterionRecord,
} from "./gate4-protocol.ts";

export const GATE4A_PROTOCOL = "phase4-pass-a-v2";
export const GATE4A_REPORT_PATH = "gate4a-report.json";
export const GATE4A_MANIFEST_PATH = "manifest.json";
export const GATE4A_CANONICAL_DIRECTORY = "out/phase4/pass-a";
export const GATE4A_NODE = "v24.13.1";
export const GATE4A_V8 = "13.6.233.17-node.40";
export const GATE4A_CRITERIA_FREEZE = "e567767";
export const GATE4A_RUNNER_FREEZE = "cd24365";
export const GATE4A_CADENCE_FREEZE = "7be4c5d";
export const GATE4A_V2_CRITERIA_FREEZE = "9c9dd5a45eafb80f3e547298494f005a73d19086";
export const GATE4A_FAR_FIELD_CADENCE = 25;
export const GATE4A_FAR_FIELD_KIND = "phase4-far-field-f64le-v1";
export const GATE4A_FAR_FIELD_SUPPORT_DEFINITION = "hex-prism-active-outer-shell-v1";
export const GATE4A_GG_SOURCE_SHA256 = "e13cd4c487eb9918b5b68529cc6f0e5c80ce53319343d9f0e7c102f4cf65563b";
export const GATE4A_LK_SOURCE_SHA256 = "1b10e3b97103000746f02e5989828e8c83eab9014108949f8b0e5bd556c1ecbc";

type Gate4AScenario = "habit" | "depletion" | "hollow" | "timeline" | "branch" | "branch-comparator";

export type Gate4AStopContract =
  | { readonly kind: "largestExtent"; readonly target: number; readonly cap: number }
  | { readonly kind: "farField"; readonly cap: number };

export interface Gate4ARunConfig {
  readonly id: string;
  readonly scenario: Gate4AScenario;
  readonly operator: "GGThreshold";
  readonly backend: "float64-cpu-oracle";
  readonly dims: Dims;
  readonly domain: "hexPrism";
  readonly farField: "reflecting";
  readonly seedRadius: 2;
  readonly seedThickness: 1;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly noiseStreamId: number | null;
  readonly params: GGTimelineEnvironment;
  readonly stop: Gate4AStopContract;
  readonly farFieldCadence: 25;
  readonly depletionTargets: readonly number[];
  readonly habitControl: { readonly u: number; readonly ggThreshBeta01: number } | null;
  readonly replayOf: string | null;
  readonly schedule: GGTimelineSchedule | null;
}

export interface Gate4AManifest {
  readonly version: 2;
  readonly protocol: typeof GATE4A_PROTOCOL;
  readonly operator: "GGThreshold";
  readonly backend: "float64-cpu-oracle";
  readonly precision: "float64";
  readonly canonicalSeedSites: 19;
  readonly criteriaFreezes: readonly [string, string, string, string];
  readonly solverSourceHashes: {
    readonly gg: string;
    readonly lk: string;
  };
  readonly runs: readonly Gate4ARunConfig[];
}

function environmentWith(
  base: GGTimelineEnvironment,
  changes: {
    readonly rho?: number;
    readonly phi?: number;
    readonly kappa?: readonly number[];
    readonly mu?: readonly number[];
    readonly ggThreshBeta?: readonly number[];
  },
): GGTimelineEnvironment {
  const vector = (value: readonly number[] | undefined, fallback: readonly number[]) => {
    const result = [...(value ?? fallback)];
    if (result.length !== 7) throw new Error("G-G timeline vectors must contain seven values");
    return result as unknown as GGTimelineEnvironment["kappa"];
  };
  return {
    rho: changes.rho ?? base.rho,
    phi: changes.phi ?? base.phi,
    kappa: vector(changes.kappa, base.kappa),
    mu: vector(changes.mu, base.mu),
    ggThreshBeta: vector(changes.ggThreshBeta, base.ggThreshBeta),
  };
}

function baseRun(
  id: string,
  scenario: Gate4AScenario,
  dims: Dims,
  params: GGTimelineEnvironment,
  stop: Gate4AStopContract,
  options: {
    readonly seed?: number;
    readonly noise?: number;
    readonly depletionTargets?: readonly number[];
    readonly habitControl?: { readonly u: number; readonly ggThreshBeta01: number };
    readonly replayOf?: string;
    readonly schedule?: GGTimelineSchedule;
  } = {},
): Gate4ARunConfig {
  const noiseEpsilon = options.noise ?? 0;
  return {
    id,
    scenario,
    operator: "GGThreshold",
    backend: "float64-cpu-oracle",
    dims,
    domain: "hexPrism",
    farField: "reflecting",
    seedRadius: 2,
    seedThickness: 1,
    rngSeed: options.seed ?? 1,
    noiseEpsilon,
    noiseStreamId: noiseEpsilon > 0 ? STREAM_NOISE_XI : null,
    params,
    stop,
    farFieldCadence: GATE4A_FAR_FIELD_CADENCE,
    depletionTargets: [...(options.depletionTargets ?? [])],
    habitControl: options.habitControl ?? null,
    replayOf: options.replayOf ?? null,
    schedule: options.schedule ?? null,
  };
}

/** Rebuild the frozen manifest from source constants; callers receive fresh owned data. */
export function buildGate4AManifest(): Gate4AManifest {
  const plate = ggTimelineEnvironmentFromParams(GG_PRESETS.plate);
  const hollow = ggTimelineEnvironmentFromParams(GG_PRESETS.hollowColumn);
  const dendrite = environmentWith(ggTimelineEnvironmentFromParams(GG_PRESETS.dendrite), {
    rho: 0.105,
  });
  const habitRuns = A_HABIT_CONTROLS.map((u, index) => {
    const thresholds = [...plate.ggThreshBeta];
    thresholds[0] = A_HABIT_BETA_01[index]; // PARAM_CONFIGS[0] is (0,1), the basal facet.
    return baseRun(
      `A-HABIT-U${String(u).replace(".", "P")}`,
      "habit",
      { nx: 64, ny: 64, nz: 128 },
      environmentWith(plate, { ggThreshBeta: thresholds }),
      { kind: "largestExtent", target: A_HABIT_TARGET_LARGEST_EXTENT, cap: A_HABIT_STEP_CAP },
      { habitControl: { u, ggThreshBeta01: A_HABIT_BETA_01[index] } },
    );
  });
  const simpleCap = environmentWith(hollow, {
    rho: 0.1,
    phi: 0,
    kappa: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    mu: [0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001],
    ggThreshBeta: [5, 2.4, 2.4, 2.4, 1, 1, 1],
  });
  const timelineSchedule: GGTimelineSchedule = {
    version: 1,
    mode: "abrupt",
    operator: "GGThreshold",
    initialEnvironment: hollow,
    events: [
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "zExtent", value: 25 },
        environment: simpleCap,
      },
    ],
  };
  const noise = 0.001;
  const runs: Gate4ARunConfig[] = [
    ...habitRuns,
    baseRun(
      "A-DEPLETION",
      "depletion",
      { nx: 64, ny: 64, nz: 128 },
      hollow,
      { kind: "largestExtent", target: 36, cap: A_DEPLETION_STEP_CAP },
      { depletionTargets: [12, 16, 20, 24, 28, 32, 36] },
    ),
    ...[1, 2, 3].map((seed) =>
      baseRun(
        `A-HOLLOW-SEED-${seed}`,
        "hollow",
        { nx: 64, ny: 64, nz: 128 },
        hollow,
        { kind: "largestExtent", target: 36, cap: A_HOLLOW_STEP_CAP },
        { seed, noise },
      ),
    ),
    baseRun(
      "A-HOLLOW-SEED-1-REPLAY",
      "hollow",
      { nx: 64, ny: 64, nz: 128 },
      hollow,
      { kind: "largestExtent", target: 36, cap: A_HOLLOW_STEP_CAP },
      { seed: 1, noise, replayOf: "A-HOLLOW-SEED-1" },
    ),
    baseRun(
      "A-TIMELINE",
      "timeline",
      { nx: 64, ny: 64, nz: 128 },
      hollow,
      { kind: "farField", cap: 10_000 },
      { schedule: timelineSchedule },
    ),
    baseRun(
      "A-BRANCH-DENDRITE",
      "branch",
      { nx: 160, ny: 160, nz: 48 },
      dendrite,
      { kind: "farField", cap: 12_000 },
    ),
    baseRun(
      "A-BRANCH-COMPARATOR",
      "branch-comparator",
      { nx: 160, ny: 160, nz: 48 },
      plate,
      { kind: "farField", cap: 12_000 },
    ),
  ];
  return strictJsonSnapshot({
    version: 2,
    protocol: GATE4A_PROTOCOL,
    operator: "GGThreshold",
    backend: "float64-cpu-oracle",
    precision: "float64",
    canonicalSeedSites: 19,
    criteriaFreezes: [
      GATE4A_CRITERIA_FREEZE,
      GATE4A_RUNNER_FREEZE,
      GATE4A_CADENCE_FREEZE,
      GATE4A_V2_CRITERIA_FREEZE,
    ],
    solverSourceHashes: {
      gg: GATE4A_GG_SOURCE_SHA256,
      lk: GATE4A_LK_SOURCE_SHA256,
    },
    runs,
  }) as unknown as Gate4AManifest;
}

/** Reviewed freeze: never derive an alleged protocol freeze from the mutable builder. */
export const GATE4A_MANIFEST_SHA256 = "e5e85c70d377e90dcca2974579122e67417c60fd2c11683276f528615e608644";

export interface Gate4AProvenance {
  readonly node: string;
  readonly v8: string;
  readonly head: string;
  readonly trackedStatus: string;
  readonly criteriaFreezeIsAncestor: boolean;
  readonly runnerFreezeIsAncestor: boolean;
  readonly cadenceFreezeIsAncestor: boolean;
  readonly v2CriteriaFreezeIsAncestor: boolean;
}

type ExecFile = typeof execFileSync;

/** Collect exact engine/git facts without shell parsing. */
export function collectGate4AProvenance(
  repoRoot = process.cwd(),
  execFile: ExecFile = execFileSync,
): Gate4AProvenance {
  const run = (args: readonly string[]) =>
    execFile("git", [...args], { cwd: repoRoot, encoding: "utf8" }).trim();
  const head = run(["rev-parse", "HEAD"]);
  const ancestor = (commit: string): boolean => {
    try {
      execFile("git", ["merge-base", "--is-ancestor", commit, head], {
        cwd: repoRoot,
        stdio: "ignore",
      });
      return true;
    } catch {
      return false;
    }
  };
  return {
    node: process.version,
    v8: process.versions.v8,
    head,
    trackedStatus: run(["status", "--porcelain", "--untracked-files=no"]),
    criteriaFreezeIsAncestor: ancestor(GATE4A_CRITERIA_FREEZE),
    runnerFreezeIsAncestor: ancestor(GATE4A_RUNNER_FREEZE),
    cadenceFreezeIsAncestor: ancestor(GATE4A_CADENCE_FREEZE),
    v2CriteriaFreezeIsAncestor: ancestor(GATE4A_V2_CRITERIA_FREEZE),
  };
}

export function validateGate4AProvenance(provenance: Gate4AProvenance): readonly string[] {
  const failures: string[] = [];
  const expectedKeys = [
    "node",
    "v8",
    "head",
    "trackedStatus",
    "criteriaFreezeIsAncestor",
    "runnerFreezeIsAncestor",
    "cadenceFreezeIsAncestor",
    "v2CriteriaFreezeIsAncestor",
  ].sort();
  if (Object.keys(provenance).sort().join("\n") !== expectedKeys.join("\n")) {
    failures.push("provenance keys differ from the exact Pass-A v2 shape");
  }
  if (provenance.node !== GATE4A_NODE || provenance.v8 !== GATE4A_V8) {
    failures.push(
      `engine expected Node ${GATE4A_NODE} / V8 ${GATE4A_V8}, got Node ${provenance.node} / V8 ${provenance.v8}`,
    );
  }
  if (!/^[0-9a-f]{40}$/.test(provenance.head)) failures.push("execution HEAD is not 40-hex");
  if (provenance.trackedStatus.trim() !== "") failures.push("tracked worktree is not clean");
  if (!provenance.criteriaFreezeIsAncestor) failures.push(`${GATE4A_CRITERIA_FREEZE} is not an ancestor`);
  if (!provenance.runnerFreezeIsAncestor) failures.push(`${GATE4A_RUNNER_FREEZE} is not an ancestor`);
  if (!provenance.cadenceFreezeIsAncestor) failures.push(`${GATE4A_CADENCE_FREEZE} is not an ancestor`);
  if (!provenance.v2CriteriaFreezeIsAncestor) failures.push(`${GATE4A_V2_CRITERIA_FREEZE} is not an ancestor`);
  return failures;
}

export interface Gate4ASourceHashes {
  readonly gg: string;
  readonly lk: string;
}

export function collectGate4ASourceHashes(repoRoot = process.cwd()): Gate4ASourceHashes {
  return {
    gg: sha256Bytes(readRegularArtifact(join(repoRoot, "solver-cpu/src/gg-solver.ts"))),
    lk: sha256Bytes(readRegularArtifact(join(repoRoot, "solver-cpu/src/lk-solver.ts"))),
  };
}

export function validateGate4ASourceHashes(hashes: Gate4ASourceHashes): boolean {
  return hashes.gg === GATE4A_GG_SOURCE_SHA256 && hashes.lk === GATE4A_LK_SOURCE_SHA256;
}

export interface Gate4ACycleRow {
  readonly cycle: number;
  readonly attachedCount: number;
  readonly iExtent: number;
  readonly jExtent: number;
  readonly tExtent: number;
  readonly zExtent: number;
  readonly largestExtent: number;
  readonly totalMass: number;
  readonly relativeMassDrift: number;
  readonly domainContact: boolean;
  readonly farFieldObserved: boolean;
  readonly farFieldMean: number | null;
  readonly deltaCount: number;
  readonly deltaSha256: string;
  readonly deltaSymmetric: boolean | null;
  readonly relaxationValid: boolean;
  readonly surfaceValid: boolean;
  readonly stateFinite: boolean;
}

export interface Gate4ADeltaWitness {
  readonly cycle: number;
  readonly indices: readonly number[];
}

export interface Gate4AExtentCrossing {
  readonly previousCycle: number;
  readonly crossingCycle: number;
  readonly previousExtents: LatticeExtents;
  readonly crossingExtents: LatticeExtents;
}

export interface Gate4AFarFieldCrossing {
  readonly previousObservedCycle: number;
  readonly previousMean: number;
  readonly crossingObservedCycle: number;
  readonly crossingMean: number;
  readonly threshold: number;
}

export interface Gate4ATimelineEvidence {
  readonly schedule: GGTimelineSchedule;
  readonly eventLog: readonly TimelineEventLogEntry[];
  readonly transitionReports: readonly StrictJson[];
  readonly beforeFieldHash: string;
  readonly afterFieldHash: string;
  readonly beforeMass: number;
  readonly afterMass: number;
  readonly eventAspectRatio: number;
  readonly eventZExtent: number;
}

export interface Gate4AFarFieldWitness {
  readonly supportIndices: Int32Array;
  readonly sampleCycles: readonly number[];
  readonly values: Float64Array;
}

export interface Gate4ARunResult {
  readonly config: Gate4ARunConfig;
  readonly registeredConfigSha256: string;
  readonly executionId: string;
  readonly initialOccupancy: Uint8Array;
  readonly initialMass: number;
  readonly seedSymmetric: boolean;
  readonly rows: readonly Gate4ACycleRow[];
  readonly deltas: readonly Gate4ADeltaWitness[];
  readonly depletionSamples: readonly DepletionSample[];
  readonly stopReason: string;
  readonly extentCrossing: Gate4AExtentCrossing | null;
  readonly farFieldCrossing: Gate4AFarFieldCrossing | null;
  readonly farFieldWitness: Gate4AFarFieldWitness;
  readonly previousOccupancy: Uint8Array | null;
  readonly finalA: Uint8Array;
  readonly finalB: Float64Array;
  readonly finalD: Float64Array;
  readonly finalMetrics: ReturnType<typeof computeMetrics>;
  readonly checkpoint: Uint8Array;
  readonly noiseWitness: GGNoiseWitness | null;
  readonly noiseVerdict: GGNoiseWitnessVerdict | null;
  readonly timeline: Gate4ATimelineEvidence | null;
}

interface StateScan {
  readonly totalMass: number;
  readonly extents: LatticeExtents;
}

/** One finite/binary/nonnegative scan plus a Neumaier compensated mass sum. */
function scanGGState(solver: GGSolver): StateScan {
  const { nx, ny } = solver.dims;
  const plane = nx * ny;
  let sum = 0;
  let compensation = 0;
  let iMin = Number.POSITIVE_INFINITY;
  let iMax = Number.NEGATIVE_INFINITY;
  let jMin = Number.POSITIVE_INFINITY;
  let jMax = Number.NEGATIVE_INFINITY;
  let kMin = Number.POSITIVE_INFINITY;
  let kMax = Number.NEGATIVE_INFINITY;
  let attached = 0;
  for (let index = 0; index < solver.a.length; index++) {
    const a = solver.a[index];
    const b = solver.b[index];
    const d = solver.d[index];
    const wall = solver.wall[index];
    if ((a !== 0 && a !== 1) || (wall !== 0 && wall !== 1)) {
      throw new Error(`A-EXEC-NUMERIC: nonbinary state at cell ${index}`);
    }
    if (!Number.isFinite(b) || !Number.isFinite(d) || b < 0 || d < 0) {
      throw new Error(`A-EXEC-NUMERIC: nonfinite or negative field at cell ${index}`);
    }
    if (wall === 1 && (a !== 0 || b !== 0 || d !== 0)) {
      throw new Error(`A-EXEC-NUMERIC: inactive wall state shifted at cell ${index}`);
    }
    if (a === 1) {
      attached++;
      if (d !== 0) throw new Error(`A-EXEC-NUMERIC: attached vapor is nonzero at cell ${index}`);
      const k = Math.floor(index / plane);
      const inPlane = index - k * plane;
      const j = Math.floor(inPlane / nx);
      const i = inPlane - j * nx;
      if (i < iMin) iMin = i;
      if (i > iMax) iMax = i;
      if (j < jMin) jMin = j;
      if (j > jMax) jMax = j;
      if (k < kMin) kMin = k;
      if (k > kMax) kMax = k;
    }
    const value = b + d;
    const next = sum + value;
    compensation += Math.abs(sum) >= Math.abs(value)
      ? sum - next + value
      : value - next + sum;
    sum = next;
  }
  const totalMass = sum + compensation;
  if (!Number.isFinite(totalMass) || totalMass <= 0 || attached === 0) {
    throw new Error("A-EXEC-NUMERIC: state mass/extents are undefined");
  }
  const iExtent = iMax - iMin + 1;
  const jExtent = jMax - jMin + 1;
  const zExtent = kMax - kMin + 1;
  return {
    totalMass,
    extents: {
      iExtent,
      jExtent,
      zExtent,
      tExtent: Math.max(iExtent, jExtent),
      largestExtent: Math.max(iExtent, jExtent, zExtent),
      attachedCount: attached,
    },
  };
}

function rawBytes(value: Uint8Array | Int32Array | Float64Array): Uint8Array {
  return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

/** Independently derive the registered hex-prism active outer shell in flat-index order. */
export function deriveGate4AFarFieldSupport(dims: Dims): Int32Array {
  const [ic, jc, kc] = domainCenter(dims);
  const radius = Math.min(ic, dims.nx - 1 - ic, jc, dims.ny - 1 - jc);
  const halfZ = Math.min(kc, dims.nz - 1 - kc);
  const support: number[] = [];
  for (let k = 0; k < dims.nz; k++) {
    for (let j = 0; j < dims.ny; j++) {
      for (let i = 0; i < dims.nx; i++) {
        const distance = hexDistance(i - ic, j - jc);
        if (
          distance <= radius && Math.abs(k - kc) <= halfZ &&
          (distance === radius || Math.abs(k - kc) === halfZ)
        ) {
          support.push(idx(dims, i, j, k));
        }
      }
    }
  }
  return Int32Array.from(support);
}

function encodeInt32LE(values: Int32Array): Uint8Array {
  const bytes = new Uint8Array(values.length * 4);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < values.length; index++) view.setInt32(index * 4, values[index], true);
  return bytes;
}

/** Encode raw far-field samples explicitly, independent of host endianness. */
export function encodeGate4AFarFieldWitness(witness: Gate4AFarFieldWitness): Uint8Array {
  const bytes = new Uint8Array(witness.values.length * 8);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < witness.values.length; index++) {
    view.setFloat64(index * 8, witness.values[index], true);
  }
  return bytes;
}

function orderedFarFieldMean(
  values: Float64Array,
  offset: number,
  support: Int32Array,
  occupancy: Uint8Array,
): number {
  let sum = 0;
  let compensation = 0;
  let count = 0;
  for (let index = 0; index < support.length; index++) {
    if (occupancy[support[index]] === 1) continue;
    const value = values[offset + index];
    const next = sum + value;
    compensation += Math.abs(sum) >= Math.abs(value)
      ? sum - next + value
      : value - next + sum;
    sum = next;
    count++;
  }
  return count === 0 ? Number.NaN : (sum + compensation) / count;
}

function combinedFieldHash(a: Uint8Array, b: Float64Array, d: Float64Array): string {
  return createHash("sha256").update(a).update(rawBytes(b)).update(rawBytes(d)).digest("hex");
}

function typedBitsEqual(
  left: Uint8Array | Int32Array | Float64Array,
  right: Uint8Array | Int32Array | Float64Array,
): boolean {
  return left.byteLength === right.byteLength && sha256Bytes(rawBytes(left)) === sha256Bytes(rawBytes(right));
}

function deltaBytes(indices: readonly number[]): Uint8Array {
  const bytes = new Uint8Array(indices.length * 4);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < indices.length; index++) {
    const cell = indices[index];
    if (!Number.isSafeInteger(cell) || cell < 0 || cell > 0xffff_ffff) {
      throw new Error("A-EXEC-NUMERIC: attachment delta index is invalid");
    }
    view.setUint32(index * 4, cell, true);
  }
  return bytes;
}

function exactSeedOccupancy(solver: GGSolver): boolean {
  const expected = new Uint8Array(solver.a.length);
  for (const site of hexSeedSites(solver.dims, 2, 1, solver.center)) expected[site] = 1;
  return typedBitsEqual(expected, solver.a) && solver.attachedCount === 19;
}

function stopCap(config: Gate4ARunConfig): number {
  return config.stop.cap;
}

function registeredTarget(config: Gate4ARunConfig): { readonly kind: "largestExtent"; readonly value: number } | null {
  if (config.stop.kind === "largestExtent") {
    return { kind: "largestExtent", value: config.stop.target };
  }
  return null;
}

function targetValue(extents: LatticeExtents, target: { readonly kind: "largestExtent"; readonly value: number }): number {
  return extents.largestExtent;
}

function relaxationReportValid(report: ReturnType<GGSolver["relaxField"]>): boolean {
  return report.sweeps === 1 && report.converged === true && report.residual === null &&
    report.divergenceResidual === null && report.shellClampDiagnostic === null &&
    report.surfaceExchangeDiagnostic === null && report.minLocalSurfaceExchangeDiagnostic === null;
}

function surfaceReportValid(report: ReturnType<GGSolver["advanceSurface"]>): boolean {
  return Number.isSafeInteger(report.attachedNow) && report.attachedNow >= 0 &&
    report.maxKineticFillIncrement === null && Number.isSafeInteger(report.holeFillCount) &&
    report.holeFillCount >= 0 && report.deltaTimeSeconds === null &&
    report.stalled === false && report.skippedUnconverged === false;
}

function shouldSnapshotNoise(solver: GGSolver): boolean {
  let zeros = 0;
  let ones = 0;
  for (let index = 0; index < solver.d.length; index++) {
    if (solver.a[index] === 1 || solver.wall[index] === 1 || !(solver.d[index] > 0)) continue;
    if (randomBit(solver.rngSeed, index, solver.tick, STREAM_NOISE_XI) === 0) zeros++;
    else ones++;
    if (zeros > 0 && ones > 0) return true;
  }
  return false;
}

export interface ExecuteGate4ARunOptions {
  readonly onProgress?: (runId: string, cycle: number, attached: number) => void;
}

export interface Gate4ACheckpointExpectation {
  readonly config: Gate4ARunConfig;
  readonly tick: number;
  readonly environment: GGTimelineEnvironment;
  readonly a: Uint8Array;
  readonly b: Float64Array;
  readonly d: Float64Array;
  readonly metrics: ReturnType<typeof computeMetrics>;
}

function checkpointMetricProjection(
  metrics: ReturnType<typeof computeMetrics>,
): CheckpointMetrics {
  return {
    tick: metrics.tick,
    attachedCount: metrics.attachedCount,
    totalMass: metrics.totalMass,
    symmetryError: metrics.symmetryError,
    aspectRatio: metrics.aspectRatio,
    crossSectionHollowness: metrics.crossSectionHollowness,
    sealedVoidFraction: metrics.sealedVoidFraction,
    branchCount: metrics.branchCount,
    boundingRadius: metrics.boundingRadius,
    domainContact: metrics.domainContact,
    farFieldVapor: metrics.farFieldVapor,
  };
}

/** Strict GG v1 decode/re-encode plus exact metadata and raw field comparison. */
export function verifyGate4ACheckpoint(
  bytes: Uint8Array,
  expected: Gate4ACheckpointExpectation,
): void {
  const decoded = decodeCheckpoint(bytes);
  const header = decoded.header;
  if (
    header.version !== 1 ||
    header.endianness !== "LE" ||
    canonicalJson(header.dims) !== canonicalJson(expected.config.dims) ||
    header.tick !== expected.tick ||
    header.rngSeed !== expected.config.rngSeed ||
    header.noiseEpsilon !== expected.config.noiseEpsilon ||
    header.farField !== expected.config.farField ||
    header.domain !== expected.config.domain ||
    canonicalJson(header.center) !== canonicalJson(domainCenter(expected.config.dims)) ||
    canonicalJson(ggTimelineEnvironmentFromParams(decoded.state.params)) !==
      canonicalJson(expected.environment) ||
    header.metrics === null ||
    header.metrics.tick !== expected.tick ||
    canonicalJson(header.metrics) !== canonicalJson(checkpointMetricProjection(expected.metrics))
  ) {
    throw new Error(`A-EXEC-NUMERIC: ${expected.config.id} checkpoint metadata shifted`);
  }
  if (
    !typedBitsEqual(decoded.state.a, expected.a) ||
    !typedBitsEqual(decoded.state.b, expected.b) ||
    !typedBitsEqual(decoded.state.d, expected.d)
  ) {
    throw new Error(`A-EXEC-NUMERIC: ${expected.config.id} checkpoint field bits shifted`);
  }
  const reencoded = encodeCheckpoint(decoded.state, header.metrics);
  if (!typedBitsEqual(reencoded, bytes)) {
    throw new Error(`A-EXEC-NUMERIC: ${expected.config.id} checkpoint is not byte-stable`);
  }
}

/** Execute one exact registered run. This never writes files. */
export function executeGate4ARun(
  configInput: Gate4ARunConfig,
  options: ExecuteGate4ARunOptions = {},
): Gate4ARunResult {
  const manifest = buildGate4AManifest();
  const registered = manifest.runs.find((candidate) => candidate.id === configInput.id);
  if (registered === undefined || canonicalJson(registered) !== canonicalJson(configInput)) {
    throw new Error(`A-EXEC-CONFIG: ${configInput.id} differs from the frozen manifest`);
  }
  const config = strictJsonSnapshot(configInput) as unknown as Gate4ARunConfig;
  const registeredConfigSha256 = canonicalJsonSha256(config);
  const target = registeredTarget(config);
  const params = ggParamsFromTimelineEnvironment(config.params);
  const center = domainCenter(config.dims);
  const solver = new GGSolver({
    dims: config.dims,
    params,
    rngSeed: config.rngSeed,
    noiseEpsilon: config.noiseEpsilon,
    domain: config.domain,
    farField: config.farField,
    seedRadius: config.seedRadius,
    seedThickness: config.seedThickness,
    center,
  });
  if (!exactSeedOccupancy(solver)) throw new Error(`A-EXEC-CONFIG: ${config.id} seed is not canonical`);
  const seedSymmetric = symmetryError(solver.a, solver.dims, solver.center) === 0;
  if (!seedSymmetric) throw new Error(`A-EXEC-SYMMETRY: ${config.id} seed is asymmetric`);
  const initialOccupancy = solver.a.slice();
  const farFieldSupport = deriveGate4AFarFieldSupport(config.dims);
  const farFieldSampleCycles: number[] = [0];
  const farFieldValues: number[] = [];
  for (const cell of farFieldSupport) farFieldValues.push(solver.d[cell]);
  const initialScan = scanGGState(solver);
  const initialMass = initialScan.totalMass;
  let previousExtents = initialScan.extents;
  let timelineCursor: TimelineCursor | null = null;
  if (config.schedule !== null) {
    if (canonicalJson(config.schedule.initialEnvironment) !== canonicalJson(solver.timelineEnvironment())) {
      throw new Error("A-EXEC-CONFIG: timeline initial environment differs from solver controls");
    }
    timelineCursor = createTimelineCursor(config.schedule);
    const initialDecision = evaluateTimelineBoundary(
      config.schedule,
      timelineCursor,
      { phase: "initial", completedCycles: 0 },
    );
    if (initialDecision.event !== null) throw new Error("A-EXEC-TERMINATION: timeline fired before growth");
    timelineCursor = initialDecision.cursor;
  }

  const rows: Gate4ACycleRow[] = [];
  const deltas: Gate4ADeltaWitness[] = [];
  const depletionSamples: DepletionSample[] = [];
  let nextDepletion = 0;
  let stopReason = "step-cap";
  let extentCrossing: Gate4AExtentCrossing | null = null;
  let farFieldCrossing: Gate4AFarFieldCrossing | null = null;
  let previousOccupancy: Uint8Array | null = null;
  let previousFarFieldCycle = 0;
  let previousFarFieldMean = solver.farFieldMean();
  let noiseWitness: GGNoiseWitness | null = null;
  let noiseVerdict: GGNoiseWitnessVerdict | null = null;
  const transitionReports: StrictJson[] = [];
  let timelineBeforeHash = "";
  let timelineAfterHash = "";
  let timelineBeforeMass = 0;
  let timelineAfterMass = 0;
  let timelineEventAspectRatio = 0;
  let timelineEventZExtent = 0;

  for (let cycle = 1; cycle <= stopCap(config); cycle++) {
    let stagedNoise: Omit<GGNoiseWitness, "postD"> | null = null;
    if (config.noiseEpsilon > 0 && noiseWitness === null && shouldSnapshotNoise(solver)) {
      stagedNoise = {
        version: 1,
        dims: solver.dims,
        tick: solver.tick,
        rngSeed: solver.rngSeed,
        noiseEpsilon: solver.noiseEpsilon,
        streamId: STREAM_NOISE_XI,
        phi: solver.params.phi,
        a: solver.a.slice(),
        wall: solver.wall.slice(),
        preD: solver.d.slice(),
      };
    }
    const relaxation = solver.relaxField();
    const relaxationValid = relaxationReportValid(relaxation);
    if (stagedNoise !== null) {
      noiseWitness = { ...stagedNoise, postD: solver.d.slice() };
      noiseVerdict = evaluateGGNoiseWitness(noiseWitness);
      if (!noiseVerdict.passed) throw new Error(`A-EXEC-NOISE: ${config.id} independent reference failed`);
    }
    const surface = solver.advanceSurface();
    const surfaceValid = surfaceReportValid(surface);
    if (solver.tick !== cycle) throw new Error(`A-EXEC-TERMINATION: ${config.id} cycle counter shifted`);
    const delta = [...solver.lastAttached];
    if (surface.attachedNow !== delta.length) {
      throw new Error(`A-EXEC-NUMERIC: ${config.id} surface report differs from lastAttached`);
    }
    const scan = scanGGState(solver);
    const extents = scan.extents;
    if (extents.attachedCount !== previousExtents.attachedCount + delta.length) {
      throw new Error(`A-EXEC-NUMERIC: ${config.id} post-step attached count differs from delta`);
    }
    const deltaSha256 = sha256Bytes(deltaBytes(delta));
    const deltaSymmetric = config.noiseEpsilon === 0
      ? (delta.length === 0 || isD6hInvariantSet(delta, solver.dims, solver.center))
      : null;
    if (delta.length > 0) deltas.push({ cycle, indices: delta });

    if (config.schedule !== null && timelineCursor !== null) {
      const decision = evaluateTimelineBoundary(
        config.schedule,
        timelineCursor,
        { phase: "afterInterfaceStep", completedCycles: cycle, extents },
      );
      timelineCursor = decision.cursor;
      if (decision.event !== null) {
        if (decision.event.operator !== "GGThreshold") {
          throw new Error("A-EXEC-CONFIG: timeline emitted the wrong operator");
        }
        const beforeScan = scanGGState(solver);
        timelineBeforeHash = combinedFieldHash(solver.a, solver.b, solver.d);
        timelineBeforeMass = beforeScan.totalMass;
        timelineEventAspectRatio = aspectRatio(solver.a, solver.dims);
        timelineEventZExtent = extents.zExtent;
        const transition = solver.applyTimelineEnvironment(decision.event.environment);
        const afterScan = scanGGState(solver);
        timelineAfterHash = combinedFieldHash(solver.a, solver.b, solver.d);
        timelineAfterMass = afterScan.totalMass;
        transitionReports.push(strictJsonSnapshot(transition));
      }
    }

    while (
      nextDepletion < config.depletionTargets.length &&
      extents.largestExtent >= config.depletionTargets[nextDepletion]
    ) {
      const sampleTarget = config.depletionTargets[nextDepletion];
      const depletion = centerRimDepletion(solver.a, solver.d, solver.dims, solver.center, solver.wall);
      depletionSamples.push({
        targetExtent: sampleTarget,
        tExtent: extents.tExtent,
        depletionRatio: depletion.depletionRatio,
        previousCycle: cycle - 1,
        crossingCycle: cycle,
        previousLargestExtent: previousExtents.largestExtent,
        crossingLargestExtent: extents.largestExtent,
      });
      nextDepletion++;
    }

    const farFieldObserved = cycle % config.farFieldCadence === 0;
    const farFieldMean = farFieldObserved ? solver.farFieldMean() : null;
    if (farFieldObserved) {
      farFieldSampleCycles.push(cycle);
      for (const cell of farFieldSupport) farFieldValues.push(solver.d[cell]);
    }
    const relativeMassDrift = Math.abs(scan.totalMass - initialMass) / initialMass;
    const contact = solver.domainContact();
    rows.push({
      cycle,
      attachedCount: solver.attachedCount,
      iExtent: extents.iExtent,
      jExtent: extents.jExtent,
      tExtent: extents.tExtent,
      zExtent: extents.zExtent,
      largestExtent: extents.largestExtent,
      totalMass: scan.totalMass,
      relativeMassDrift,
      domainContact: contact,
      farFieldObserved,
      farFieldMean,
      deltaCount: delta.length,
      deltaSha256,
      deltaSymmetric,
      relaxationValid,
      surfaceValid,
      stateFinite: true,
    });
    options.onProgress?.(config.id, cycle, solver.attachedCount);

    const candidates: string[] = [];
    if (contact) candidates.push("domain-contact");
    if (
      target !== null &&
      targetValue(previousExtents, target) < target.value &&
      targetValue(extents, target) >= target.value
    ) {
      extentCrossing = {
        previousCycle: cycle - 1,
        crossingCycle: cycle,
        previousExtents,
        crossingExtents: extents,
      };
      previousOccupancy = solver.a.slice();
      for (const index of solver.lastAttached) previousOccupancy[index] = 0;
      candidates.push("size-target");
    }
    if (farFieldObserved) {
      const threshold = (2 * solver.params.rho) / 3;
      if ((farFieldMean as number) < threshold) {
        farFieldCrossing = {
          previousObservedCycle: previousFarFieldCycle,
          previousMean: previousFarFieldMean,
          crossingObservedCycle: cycle,
          crossingMean: farFieldMean as number,
          threshold,
        };
        candidates.push("far-field");
      }
      previousFarFieldCycle = cycle;
      previousFarFieldMean = farFieldMean as number;
    }
    if (cycle === stopCap(config)) candidates.push("step-cap");
    if (candidates.length > 0) {
      stopReason = candidates.length === 1 ? candidates[0] : `ambiguous:${candidates.join("+")}`;
      break;
    }
    previousExtents = extents;
  }

  if (config.noiseEpsilon > 0 && (noiseWitness === null || noiseVerdict?.passed !== true)) {
    throw new Error(`A-EXEC-NOISE: ${config.id} never produced a valid applied-noise witness`);
  }
  const finalScan = scanGGState(solver);
  const finalMetrics = computeMetrics(
    solver.a,
    solver.b,
    solver.d,
    solver.dims,
    solver.center,
    solver.tick,
    solver.farFieldMean(),
    solver.wall,
  );
  if (finalMetrics.totalMass !== finalScan.totalMass) {
    throw new Error(`A-EXEC-NUMERIC: ${config.id} metric mass differs from independent scan`);
  }
  const checkpoint = encodeCheckpoint(solver.state(), finalMetrics);
  verifyGate4ACheckpoint(checkpoint, {
    config,
    tick: solver.tick,
    environment: solver.timelineEnvironment(),
    a: solver.a,
    b: solver.b,
    d: solver.d,
    metrics: finalMetrics,
  });
  const finalA = solver.a.slice();
  const finalB = solver.b.slice();
  const finalD = solver.d.slice();
  const executionId = canonicalJsonSha256({
    runId: config.id,
    configSha256: registeredConfigSha256,
    tick: solver.tick,
    a: rawTypedArraySha256(finalA),
    b: rawTypedArraySha256(finalB),
    d: rawTypedArraySha256(finalD),
  });
  const timeline: Gate4ATimelineEvidence | null = config.schedule === null || timelineCursor === null
    ? null
    : {
        schedule: config.schedule,
        eventLog: timelineCursor.eventLog,
        transitionReports,
        beforeFieldHash: timelineBeforeHash,
        afterFieldHash: timelineAfterHash,
        beforeMass: timelineBeforeMass,
        afterMass: timelineAfterMass,
        eventAspectRatio: timelineEventAspectRatio,
        eventZExtent: timelineEventZExtent,
      };
  return {
    config,
    registeredConfigSha256,
    executionId,
    initialOccupancy,
    initialMass,
    seedSymmetric,
    rows,
    deltas,
    depletionSamples,
    stopReason,
    extentCrossing,
    farFieldCrossing,
    farFieldWitness: {
      supportIndices: farFieldSupport,
      sampleCycles: farFieldSampleCycles,
      values: Float64Array.from(farFieldValues),
    },
    previousOccupancy,
    finalA,
    finalB,
    finalD,
    finalMetrics,
    checkpoint,
    noiseWitness,
    noiseVerdict,
    timeline,
  };
}

export const GATE4A_SERIES_HEADER = [
  "cycle",
  "attachedCount",
  "iExtent",
  "jExtent",
  "tExtent",
  "zExtent",
  "largestExtent",
  "totalMass",
  "relativeMassDrift",
  "domainContact",
  "farFieldObserved",
  "farFieldMean",
  "deltaCount",
  "deltaSha256",
  "deltaSymmetric",
  "relaxationValid",
  "surfaceValid",
  "stateFinite",
] as const;

function csvBoolean(value: boolean): string {
  return value ? "true" : "false";
}

/** Full-precision, one-row-per-completed-cycle Pass-A series. */
export function gate4ASeriesCsv(rows: readonly Gate4ACycleRow[]): string {
  const body = rows.map((row) => [
    row.cycle,
    row.attachedCount,
    row.iExtent,
    row.jExtent,
    row.tExtent,
    row.zExtent,
    row.largestExtent,
    row.totalMass,
    row.relativeMassDrift,
    csvBoolean(row.domainContact),
    csvBoolean(row.farFieldObserved),
    row.farFieldMean === null ? "" : row.farFieldMean,
    row.deltaCount,
    row.deltaSha256,
    row.deltaSymmetric === null ? "" : csvBoolean(row.deltaSymmetric),
    csvBoolean(row.relaxationValid),
    csvBoolean(row.surfaceValid),
    csvBoolean(row.stateFinite),
  ].map(String).join(","));
  return `${GATE4A_SERIES_HEADER.join(",")}\n${body.join("\n")}\n`;
}

function parsedFinite(raw: string, label: string): number {
  if (raw.trim() !== raw || raw.length === 0) throw new Error(`${label} is empty or padded`);
  const value = Number(raw);
  if (!Number.isFinite(value) || Object.is(value, -0)) throw new Error(`${label} is nonfinite or negative zero`);
  if (String(value) !== raw) throw new Error(`${label} is not in canonical numeric form`);
  return value;
}

function parsedInteger(raw: string, label: string, minimum: number): number {
  const value = parsedFinite(raw, label);
  if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`${label} is not a valid integer`);
  return value;
}

function parsedBoolean(raw: string, label: string): boolean {
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new Error(`${label} is not a canonical boolean`);
}

/** Parse/cross-check exact cadence and canonical scalar spellings. */
export function validateGate4ASeriesCsv(
  text: string,
  expectedRows?: readonly Gate4ACycleRow[],
): readonly Gate4ACycleRow[] {
  if (!text.endsWith("\n") || text.includes("\r")) throw new Error("Pass-A CSV newline form is invalid");
  const lines = text.slice(0, -1).split("\n");
  if (lines[0] !== GATE4A_SERIES_HEADER.join(",")) throw new Error("Pass-A CSV header shifted");
  const rows = lines.slice(1).map((line, index): Gate4ACycleRow => {
    const fields = line.split(",");
    if (fields.length !== GATE4A_SERIES_HEADER.length) {
      throw new Error(`Pass-A CSV row ${index + 1} has ${fields.length} fields`);
    }
    const cycle = parsedInteger(fields[0], `row ${index + 1} cycle`, 1);
    if (cycle !== index + 1) throw new Error(`Pass-A CSV skipped or duplicated cycle ${index + 1}`);
    const farFieldObserved = parsedBoolean(fields[10], `row ${cycle} farFieldObserved`);
    if (farFieldObserved !== (cycle % GATE4A_FAR_FIELD_CADENCE === 0)) {
      throw new Error(`Pass-A CSV far-field cadence shifted at cycle ${cycle}`);
    }
    const farFieldMean = fields[11] === "" ? null : parsedFinite(fields[11], `row ${cycle} farFieldMean`);
    if ((farFieldMean !== null) !== farFieldObserved) {
      throw new Error(`Pass-A CSV far-field value presence shifted at cycle ${cycle}`);
    }
    const deltaSha256 = fields[13];
    if (!/^[0-9a-f]{64}$/.test(deltaSha256)) throw new Error(`Pass-A CSV delta hash is invalid at cycle ${cycle}`);
    const deltaSymmetric = fields[14] === "" ? null : parsedBoolean(fields[14], `row ${cycle} deltaSymmetric`);
    return {
      cycle,
      attachedCount: parsedInteger(fields[1], `row ${cycle} attachedCount`, 1),
      iExtent: parsedInteger(fields[2], `row ${cycle} iExtent`, 1),
      jExtent: parsedInteger(fields[3], `row ${cycle} jExtent`, 1),
      tExtent: parsedInteger(fields[4], `row ${cycle} tExtent`, 1),
      zExtent: parsedInteger(fields[5], `row ${cycle} zExtent`, 1),
      largestExtent: parsedInteger(fields[6], `row ${cycle} largestExtent`, 1),
      totalMass: parsedFinite(fields[7], `row ${cycle} totalMass`),
      relativeMassDrift: parsedFinite(fields[8], `row ${cycle} relativeMassDrift`),
      domainContact: parsedBoolean(fields[9], `row ${cycle} domainContact`),
      farFieldObserved,
      farFieldMean,
      deltaCount: parsedInteger(fields[12], `row ${cycle} deltaCount`, 0),
      deltaSha256,
      deltaSymmetric,
      relaxationValid: parsedBoolean(fields[15], `row ${cycle} relaxationValid`),
      surfaceValid: parsedBoolean(fields[16], `row ${cycle} surfaceValid`),
      stateFinite: parsedBoolean(fields[17], `row ${cycle} stateFinite`),
    };
  });
  if (expectedRows !== undefined && canonicalJson(rows) !== canonicalJson(expectedRows)) {
    throw new Error("Pass-A CSV rows differ from raw in-memory cycle evidence");
  }
  return rows;
}

function runArtifactPath(runId: string, name: string): string {
  return `runs/${runId}/${name}`;
}

function finalEnvironment(result: Gate4ARunResult): GGTimelineEnvironment {
  const lastEvent = result.timeline?.eventLog[result.timeline.eventLog.length - 1];
  return lastEvent === undefined
    ? result.config.params
    : lastEvent.afterEnvironment as GGTimelineEnvironment;
}

function farFieldWitnessPayload(result: Gate4ARunResult): StrictJson {
  const bytes = encodeGate4AFarFieldWitness(result.farFieldWitness);
  return strictJsonSnapshot({
    version: 1,
    path: runArtifactPath(result.config.id, "far-field.f64le"),
    kind: GATE4A_FAR_FIELD_KIND,
    encoding: "float64-le",
    supportDefinition: GATE4A_FAR_FIELD_SUPPORT_DEFINITION,
    supportCount: result.farFieldWitness.supportIndices.length,
    supportIndicesSha256: sha256Bytes(encodeInt32LE(result.farFieldWitness.supportIndices)),
    sampleCycles: result.farFieldWitness.sampleCycles,
    valuesPerSample: result.farFieldWitness.supportIndices.length,
    byteLength: bytes.byteLength,
    sha256: sha256Bytes(bytes),
  });
}

function scenarioPayload(result: Gate4ARunResult): StrictJson {
  const decoded = decodeCheckpoint(result.checkpoint);
  return strictJsonSnapshot({
    version: 2,
    runId: result.config.id,
    executionId: result.executionId,
    registeredConfigSha256: result.registeredConfigSha256,
    completedCycles: result.rows.length,
    stopReason: result.stopReason,
    initial: {
      occupancySha256: rawTypedArraySha256(result.initialOccupancy),
      mass: result.initialMass,
      seedSymmetric: result.seedSymmetric,
    },
    termination: {
      extentCrossing: result.extentCrossing,
      farFieldCrossing: result.farFieldCrossing,
    },
    depletionSamples: result.depletionSamples,
    final: {
      aSha256: rawTypedArraySha256(result.finalA),
      bSha256: rawTypedArraySha256(result.finalB),
      dSha256: rawTypedArraySha256(result.finalD),
      metrics: result.finalMetrics,
      environment: finalEnvironment(result),
    },
    checkpoint: {
      sha256: sha256Bytes(result.checkpoint),
      byteLength: result.checkpoint.byteLength,
      header: decoded.header,
    },
    noise: result.noiseVerdict === null
      ? null
      : {
          witnessSha256: sha256Bytes(encodeGGNoiseWitness(result.noiseWitness as GGNoiseWitness)),
          verdict: result.noiseVerdict,
        },
    timeline: result.timeline,
    deltaWitnessCount: result.deltas.length,
    farFieldWitness: farFieldWitnessPayload(result),
  });
}

function deltaPayload(result: Gate4ARunResult): StrictJson {
  return strictJsonSnapshot({
    version: 1,
    runId: result.config.id,
    witnesses: result.deltas,
  });
}

interface ReconstructedDeltaChain {
  readonly finalOccupancy: Uint8Array;
  readonly anyDomainContact: boolean;
  readonly finalDomainContact: boolean;
  readonly contactEvidenceConsistent: boolean;
  readonly recordedTimelineAspectRatio: number | null;
}

interface ValidatedFarFieldWitness {
  readonly means: readonly number[];
  readonly firstCrossing: Gate4AFarFieldCrossing | null;
}

function deltaChainFailure(result: Gate4ARunResult, message: string): never {
  throw new Error(`A-EXEC-NUMERIC: ${result.config.id} ${message}`);
}

function exactRowExtents(row: Gate4ACycleRow, extents: LatticeExtents): boolean {
  return row.attachedCount === extents.attachedCount &&
    row.iExtent === extents.iExtent &&
    row.jExtent === extents.jExtent &&
    row.tExtent === extents.tExtent &&
    row.zExtent === extents.zExtent &&
    row.largestExtent === extents.largestExtent;
}

/**
 * Rebuild the monotonic crystal from the canonical seed and raw attachment deltas. Bounding
 * extents are updated incrementally, so the audit is O(n + rows + total delta entries).
 */
function validateDeltaWitnesses(result: Gate4ARunResult): ReconstructedDeltaChain {
  const { dims } = result.config;
  const n = cellCount(dims);
  const occupancy = new Uint8Array(n);
  const center = domainCenter(dims);
  let attachedCount = 0;
  let iMin = Number.POSITIVE_INFINITY;
  let iMax = Number.NEGATIVE_INFINITY;
  let jMin = Number.POSITIVE_INFINITY;
  let jMax = Number.NEGATIVE_INFINITY;
  let kMin = Number.POSITIVE_INFINITY;
  let kMax = Number.NEGATIVE_INFINITY;
  const addCell = (cell: number): void => {
    occupancy[cell] = 1;
    attachedCount++;
    const plane = dims.nx * dims.ny;
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

  const byCycle = new Map<number, Gate4ADeltaWitness>();
  let previousWitnessCycle = 0;
  for (const witness of result.deltas) {
    if (!Number.isSafeInteger(witness.cycle) || witness.cycle < 1 || !Array.isArray(witness.indices)) {
      deltaChainFailure(result, "delta witness shape is invalid");
    }
    if (byCycle.has(witness.cycle)) deltaChainFailure(result, `has duplicate delta cycle ${witness.cycle}`);
    if (witness.cycle <= previousWitnessCycle) {
      deltaChainFailure(result, `delta witnesses are out of order at cycle ${witness.cycle}`);
    }
    previousWitnessCycle = witness.cycle;
    byCycle.set(witness.cycle, witness);
  }

  let anyDomainContact = false;
  let finalDomainContact = false;
  let contactEvidenceConsistent = true;
  const recordedTimelineCycle = result.timeline?.eventLog[0]?.crossingBoundary.completedCycles;
  let recordedTimelineAspectRatio: number | null = recordedTimelineCycle === 0
    ? aspectRatio(occupancy, dims)
    : null;
  for (let rowIndex = 0; rowIndex < result.rows.length; rowIndex++) {
    const row = result.rows[rowIndex];
    const expectedCycle = rowIndex + 1;
    if (row.cycle !== expectedCycle) deltaChainFailure(result, `row cycle ${row.cycle} is not ${expectedCycle}`);
    const witness = byCycle.get(row.cycle);
    const indices = witness?.indices ?? [];
    if (row.deltaCount === 0) {
      if (witness !== undefined) deltaChainFailure(result, `empty delta has a witness at cycle ${row.cycle}`);
      if (row.deltaSha256 !== sha256Bytes(new Uint8Array(0))) {
        deltaChainFailure(result, `empty delta hash shifted at cycle ${row.cycle}`);
      }
    } else {
      if (witness === undefined || indices.length !== row.deltaCount) {
        deltaChainFailure(result, `nonempty delta witness is missing at cycle ${row.cycle}`);
      }
      if (sha256Bytes(deltaBytes(indices)) !== row.deltaSha256) {
        deltaChainFailure(result, `delta witness hash shifted at cycle ${row.cycle}`);
      }
    }

    if (
      result.config.stop.kind !== "farField" &&
      result.extentCrossing?.crossingCycle === row.cycle
    ) {
      if (
        result.previousOccupancy === null ||
        !typedBitsEqual(result.previousOccupancy, occupancy)
      ) {
        deltaChainFailure(result, "previous occupancy is not the state before the crossing cycle");
      }
    }

    const priorAttachedCount = attachedCount;
    for (const cell of indices) {
      if (!Number.isSafeInteger(cell) || cell < 0 || cell >= n) {
        deltaChainFailure(result, `delta index ${String(cell)} is out of range at cycle ${row.cycle}`);
      }
      if (occupancy[cell] === 1) {
        deltaChainFailure(result, `delta index ${cell} is duplicate or already attached at cycle ${row.cycle}`);
      }
      addCell(cell);
    }
    if (row.attachedCount !== priorAttachedCount + indices.length) {
      deltaChainFailure(result, `attached count shifted at cycle ${row.cycle}`);
    }
    const iExtent = iMax - iMin + 1;
    const jExtent = jMax - jMin + 1;
    const zExtent = kMax - kMin + 1;
    const extents: LatticeExtents = {
      iExtent,
      jExtent,
      tExtent: Math.max(iExtent, jExtent),
      zExtent,
      largestExtent: Math.max(iExtent, jExtent, zExtent),
      attachedCount,
    };
    if (!exactRowExtents(row, extents)) {
      deltaChainFailure(result, `row extents shifted at cycle ${row.cycle}`);
    }
    const contact = iExtent > DOMAIN_CONTACT_FRACTION * dims.nx ||
      jExtent > DOMAIN_CONTACT_FRACTION * dims.ny ||
      zExtent > DOMAIN_CONTACT_FRACTION * dims.nz;
    contactEvidenceConsistent &&= row.domainContact === contact;
    anyDomainContact ||= contact;
    finalDomainContact = contact;

    if (result.config.noiseEpsilon === 0) {
      const symmetric = isD6hInvariantSet(indices, dims, center);
      if (row.deltaSymmetric !== symmetric) {
        deltaChainFailure(result, `delta symmetry witness shifted at cycle ${row.cycle}`);
      }
    } else if (row.deltaSymmetric !== null) {
      deltaChainFailure(result, `noise-on delta has a symmetry threshold at cycle ${row.cycle}`);
    }
    if (row.cycle === recordedTimelineCycle) {
      recordedTimelineAspectRatio = aspectRatio(occupancy, dims);
    }
  }
  for (const cycle of byCycle.keys()) {
    if (cycle > result.rows.length || result.rows[cycle - 1].deltaCount === 0) {
      deltaChainFailure(result, `has orphan delta witness at cycle ${cycle}`);
    }
  }
  if (!typedBitsEqual(occupancy, result.finalA)) {
    deltaChainFailure(result, "reconstructed occupancy differs from finalA");
  }
  contactEvidenceConsistent &&= result.finalMetrics.domainContact === finalDomainContact;
  return {
    finalOccupancy: occupancy,
    anyDomainContact,
    finalDomainContact,
    contactEvidenceConsistent,
    recordedTimelineAspectRatio,
  };
}

/**
 * Reconstruct every raw far-field observation from the canonical seed and attachment deltas.
 * The support is derived here rather than trusted from the solver or scenario metadata.
 */
export function validateGate4AFarFieldWitness(
  result: Gate4ARunResult,
  artifactBytes = encodeGate4AFarFieldWitness(result.farFieldWitness),
): ValidatedFarFieldWitness {
  validateDeltaWitnesses(result);
  const fail = (message: string): never => {
    throw new Error(`A-EXEC-TERMINATION: ${result.config.id} ${message}`);
  };
  const expectedSupport = deriveGate4AFarFieldSupport(result.config.dims);
  if (
    result.farFieldWitness.supportIndices.length !== expectedSupport.length ||
    !typedBitsEqual(result.farFieldWitness.supportIndices, expectedSupport)
  ) fail("far-field support differs from the independently derived shell");
  const expectedCycles = [
    0,
    ...result.rows.filter((row) => row.farFieldObserved).map((row) => row.cycle),
  ];
  if (canonicalJson(result.farFieldWitness.sampleCycles) !== canonicalJson(expectedCycles)) {
    fail("far-field samples are missing, duplicated, or reordered");
  }
  const valuesPerSample = expectedSupport.length;
  const expectedValueCount = valuesPerSample * expectedCycles.length;
  if (
    result.farFieldWitness.values.length !== expectedValueCount ||
    artifactBytes.byteLength !== expectedValueCount * 8 ||
    !typedBitsEqual(artifactBytes, encodeGate4AFarFieldWitness(result.farFieldWitness))
  ) fail("far-field artifact byte shape or encoding shifted");

  const occupancy = new Uint8Array(cellCount(result.config.dims));
  for (const site of hexSeedSites(
    result.config.dims,
    result.config.seedRadius,
    result.config.seedThickness,
    domainCenter(result.config.dims),
  )) occupancy[site] = 1;
  const deltasByCycle = new Map(result.deltas.map((witness) => [witness.cycle, witness.indices]));
  let appliedThrough = 0;
  const means: number[] = [];
  for (let sample = 0; sample < expectedCycles.length; sample++) {
    const cycle = expectedCycles[sample];
    for (let current = appliedThrough + 1; current <= cycle; current++) {
      for (const cell of deltasByCycle.get(current) ?? []) occupancy[cell] = 1;
    }
    appliedThrough = cycle;
    const offset = sample * valuesPerSample;
    for (let index = 0; index < valuesPerSample; index++) {
      const value = result.farFieldWitness.values[offset + index];
      if (!Number.isFinite(value) || value < 0 || Object.is(value, -0)) {
        fail(`far-field sample ${cycle} contains a noncanonical value`);
      }
      if (cycle === 0 && !Object.is(value, result.config.params.rho)) {
        fail(`cycle-0 far-field sample differs from registered initial rho at cell ${expectedSupport[index]}`);
      }
      if (cycle === result.rows.length && !Object.is(value, result.finalD[expectedSupport[index]])) {
        fail(`final far-field sample differs from final checkpoint field at cell ${expectedSupport[index]}`);
      }
    }
    const mean = orderedFarFieldMean(
      result.farFieldWitness.values,
      offset,
      expectedSupport,
      occupancy,
    );
    if (!Number.isFinite(mean)) fail(`far-field mean is undefined at cycle ${cycle}`);
    means.push(mean);
    if (cycle > 0) {
      const row = result.rows[cycle - 1];
      if (!row.farFieldObserved || row.farFieldMean === null || !Object.is(mean, row.farFieldMean)) {
        fail(`far-field raw mean differs bitwise from CSV at cycle ${cycle}`);
      }
    }
  }

  const threshold = (2 * result.config.params.rho) / 3;
  let firstCrossing: Gate4AFarFieldCrossing | null = null;
  for (let sample = 1; sample < expectedCycles.length; sample++) {
    if (means[sample] < threshold) {
      firstCrossing = {
        previousObservedCycle: expectedCycles[sample - 1],
        previousMean: means[sample - 1],
        crossingObservedCycle: expectedCycles[sample],
        crossingMean: means[sample],
        threshold,
      };
      break;
    }
  }
  if (result.config.stop.kind === "farField") {
    if (
      firstCrossing === null ||
      firstCrossing.crossingObservedCycle !== result.rows.length ||
      result.stopReason !== "far-field" ||
      canonicalJson(firstCrossing) !== canonicalJson(result.farFieldCrossing)
    ) fail("far-field stop is not the first raw below-threshold observation");
  } else if (firstCrossing !== null || result.farFieldCrossing !== null) {
    fail("size-target run crossed the raw far-field threshold before stopping");
  }
  return { means, firstCrossing };
}

/** Build every payload artifact; report/index are added only by the shared publisher. */
export function buildGate4AArtifacts(
  manifest: Gate4AManifest,
  results: readonly Gate4ARunResult[],
): readonly EvidenceArtifactInput[] {
  const artifacts: EvidenceArtifactInput[] = [
    {
      path: GATE4A_MANIFEST_PATH,
      kind: "phase4-pass-a-manifest+json",
      bytes: canonicalJsonBytes(manifest),
    },
  ];
  for (const result of results) {
    validateDeltaWitnesses(result);
    validateGate4AFarFieldWitness(result);
    const csv = gate4ASeriesCsv(result.rows);
    validateGate4ASeriesCsv(csv, result.rows);
    artifacts.push(
      {
        path: runArtifactPath(result.config.id, "series.csv"),
        kind: "phase4-pass-a-series+csv",
        bytes: new TextEncoder().encode(csv),
      },
      {
        path: runArtifactPath(result.config.id, "deltas.json"),
        kind: "phase4-pass-a-attachment-deltas+json",
        bytes: canonicalJsonBytes(deltaPayload(result)),
      },
      {
        path: runArtifactPath(result.config.id, "final.ckpt"),
        kind: "gg-checkpoint-v1",
        bytes: result.checkpoint,
      },
      {
        path: runArtifactPath(result.config.id, "scenario.json"),
        kind: "phase4-pass-a-scenario+json",
        bytes: canonicalJsonBytes(scenarioPayload(result)),
      },
      {
        path: runArtifactPath(result.config.id, "far-field.f64le"),
        kind: GATE4A_FAR_FIELD_KIND,
        bytes: encodeGate4AFarFieldWitness(result.farFieldWitness),
      },
    );
    if (result.noiseWitness !== null) {
      artifacts.push({
        path: runArtifactPath(result.config.id, "noise-witness.bin"),
        kind: "phase4-gg-noise-witness-v1",
        bytes: encodeGGNoiseWitness(result.noiseWitness),
      });
    }
  }
  return artifacts;
}

/** Independently validate the exact artifact set and all artifact-to-memory cross-links. */
export function validateGate4AArtifacts(
  manifest: Gate4AManifest,
  results: readonly Gate4ARunResult[],
  artifacts: readonly EvidenceArtifactInput[],
): readonly string[] {
  const expectedPaths = [GATE4A_MANIFEST_PATH];
  const expectedKinds = new Map<string, string>([
    [GATE4A_MANIFEST_PATH, "phase4-pass-a-manifest+json"],
  ]);
  for (const result of results) {
    const seriesPath = runArtifactPath(result.config.id, "series.csv");
    const deltasPath = runArtifactPath(result.config.id, "deltas.json");
    const checkpointPath = runArtifactPath(result.config.id, "final.ckpt");
    const scenarioPath = runArtifactPath(result.config.id, "scenario.json");
    const farFieldPath = runArtifactPath(result.config.id, "far-field.f64le");
    expectedPaths.push(seriesPath, deltasPath, checkpointPath, scenarioPath, farFieldPath);
    expectedKinds.set(seriesPath, "phase4-pass-a-series+csv");
    expectedKinds.set(deltasPath, "phase4-pass-a-attachment-deltas+json");
    expectedKinds.set(checkpointPath, "gg-checkpoint-v1");
    expectedKinds.set(scenarioPath, "phase4-pass-a-scenario+json");
    expectedKinds.set(farFieldPath, GATE4A_FAR_FIELD_KIND);
    if (result.noiseWitness !== null) {
      const witnessPath = runArtifactPath(result.config.id, "noise-witness.bin");
      expectedPaths.push(witnessPath);
      expectedKinds.set(witnessPath, "phase4-gg-noise-witness-v1");
    }
  }
  const actualPaths = artifacts.map((item) => item.path);
  if (new Set(actualPaths).size !== actualPaths.length) throw new Error("A-EXEC-NUMERIC: duplicate artifact path");
  if (
    [...actualPaths].sort().join("\n") !== [...expectedPaths].sort().join("\n")
  ) {
    throw new Error("A-EXEC-NUMERIC: missing or unexpected Pass-A artifact");
  }
  for (const artifact of artifacts) {
    if (artifact.kind !== expectedKinds.get(artifact.path)) {
      throw new Error(`A-EXEC-NUMERIC: artifact kind shifted for ${artifact.path}`);
    }
  }
  const byPath = new Map(artifacts.map((item) => [item.path, item]));
  const independentlyValidatedNoiseRuns: string[] = [];
  const manifestArtifact = byPath.get(GATE4A_MANIFEST_PATH) as EvidenceArtifactInput;
  let parsedManifest: StrictJson;
  try {
    parsedManifest = parseCanonicalJson(manifestArtifact.bytes, "Pass-A manifest");
  } catch (error) {
    // Corrupt manifest bytes are frozen-configuration evidence, owned by A-EXEC-CONFIG.
    throw new Error(`A-EXEC-CONFIG: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (
    canonicalJson(parsedManifest) !== canonicalJson(manifest) ||
    sha256Bytes(manifestArtifact.bytes) !== GATE4A_MANIFEST_SHA256
  ) {
    throw new Error("A-EXEC-CONFIG: manifest bytes differ from the freeze");
  }
  for (const result of results) {
    const csvArtifact = byPath.get(runArtifactPath(result.config.id, "series.csv")) as EvidenceArtifactInput;
    const csvText = new TextDecoder("utf-8", { fatal: true }).decode(csvArtifact.bytes);
    validateGate4ASeriesCsv(csvText, result.rows);
    const deltasArtifact = byPath.get(runArtifactPath(result.config.id, "deltas.json")) as EvidenceArtifactInput;
    const parsedDeltas = parseCanonicalJson(deltasArtifact.bytes, `${result.config.id} deltas`);
    if (canonicalJson(parsedDeltas) !== canonicalJson(deltaPayload(result))) {
      throw new Error(`A-EXEC-NUMERIC: ${result.config.id} delta artifact shifted`);
    }
    validateDeltaWitnesses(result);
    const farFieldArtifact = byPath.get(runArtifactPath(result.config.id, "far-field.f64le")) as EvidenceArtifactInput;
    validateGate4AFarFieldWitness(result, farFieldArtifact.bytes);
    const checkpointArtifact = byPath.get(runArtifactPath(result.config.id, "final.ckpt")) as EvidenceArtifactInput;
    verifyGate4ACheckpoint(checkpointArtifact.bytes, {
      config: result.config,
      tick: result.rows.length,
      environment: finalEnvironment(result),
      a: result.finalA,
      b: result.finalB,
      d: result.finalD,
      metrics: result.finalMetrics,
    });
    const scenarioArtifact = byPath.get(runArtifactPath(result.config.id, "scenario.json")) as EvidenceArtifactInput;
    const parsedScenario = parseCanonicalJson(scenarioArtifact.bytes, `${result.config.id} scenario`);
    if (canonicalJson(parsedScenario) !== canonicalJson(scenarioPayload(result))) {
      throw new Error(`A-EXEC-NUMERIC: ${result.config.id} scenario artifact shifted`);
    }
    const witnessPath = runArtifactPath(result.config.id, "noise-witness.bin");
    if (result.noiseWitness !== null) {
      const witnessArtifact = byPath.get(witnessPath) as EvidenceArtifactInput;
      const expectedWitnessBytes = encodeGGNoiseWitness(result.noiseWitness);
      if (!typedBitsEqual(witnessArtifact.bytes, expectedWitnessBytes)) {
        throw new Error(`A-EXEC-NOISE: ${result.config.id} witness bytes shifted`);
      }
      const decoded = decodeGGNoiseWitness(witnessArtifact.bytes);
      if (
        decoded.version !== result.noiseWitness.version ||
        canonicalJson(decoded.dims) !== canonicalJson(result.noiseWitness.dims) ||
        decoded.tick !== result.noiseWitness.tick ||
        decoded.rngSeed !== result.noiseWitness.rngSeed ||
        decoded.noiseEpsilon !== result.noiseWitness.noiseEpsilon ||
        decoded.streamId !== result.noiseWitness.streamId ||
        decoded.phi !== result.noiseWitness.phi
      ) {
        throw new Error(`A-EXEC-NOISE: ${result.config.id} witness metadata shifted`);
      }
      for (const field of ["a", "wall", "preD", "postD"] as const) {
        if (!typedBitsEqual(decoded[field], result.noiseWitness[field])) {
          throw new Error(`A-EXEC-NOISE: ${result.config.id} witness ${field} shifted`);
        }
      }
      const decodedVerdict = evaluateGGNoiseWitness(decoded);
      if (
        result.noiseVerdict === null ||
        !decodedVerdict.passed ||
        canonicalJson(decodedVerdict) !== canonicalJson(result.noiseVerdict)
      ) {
        throw new Error(`A-EXEC-NOISE: ${result.config.id} witness verdict shifted`);
      }
      independentlyValidatedNoiseRuns.push(result.config.id);
    } else if (byPath.has(witnessPath)) {
      throw new Error(`A-EXEC-NOISE: ${result.config.id} has an unexpected witness`);
    }
  }
  return independentlyValidatedNoiseRuns;
}

function exactInitialSeed(result: Gate4ARunResult): boolean {
  const expected = new Uint8Array(cellCount(result.config.dims));
  for (const site of hexSeedSites(result.config.dims, 2, 1, domainCenter(result.config.dims))) {
    expected[site] = 1;
  }
  return result.initialOccupancy.length === expected.length &&
    typedBitsEqual(result.initialOccupancy, expected);
}

function configResultValid(result: Gate4ARunResult, registered: Gate4ARunConfig): boolean {
  return canonicalJson(result.config) === canonicalJson(registered) &&
    result.registeredConfigSha256 === canonicalJsonSha256(registered) &&
    /^[0-9a-f]{64}$/.test(result.executionId) &&
    exactInitialSeed(result) &&
    result.seedSymmetric === true &&
    result.config.operator === "GGThreshold" &&
    result.config.backend === "float64-cpu-oracle" &&
    result.config.domain === "hexPrism" &&
    result.config.farField === "reflecting" &&
    result.config.seedRadius === 2 &&
    result.config.seedThickness === 1 &&
    result.config.farFieldCadence === GATE4A_FAR_FIELD_CADENCE;
}

function sameRecordedExtents(left: LatticeExtents, right: LatticeExtents): boolean {
  return left.iExtent === right.iExtent &&
    left.jExtent === right.jExtent &&
    left.tExtent === right.tExtent &&
    left.zExtent === right.zExtent &&
    left.largestExtent === right.largestExtent &&
    left.attachedCount === right.attachedCount;
}

function rowRecordedExtents(row: Gate4ACycleRow): LatticeExtents {
  return {
    iExtent: row.iExtent,
    jExtent: row.jExtent,
    tExtent: row.tExtent,
    zExtent: row.zExtent,
    largestExtent: row.largestExtent,
    attachedCount: row.attachedCount,
  };
}

function rowsStructurallyValid(result: Gate4ARunResult): boolean {
  if (result.rows.length === 0 || result.rows.length > stopCap(result.config)) return false;
  return result.rows.every((row, index) =>
    row.cycle === index + 1 &&
    Number.isSafeInteger(row.attachedCount) && row.attachedCount >= 19 &&
    Number.isSafeInteger(row.iExtent) && row.iExtent > 0 &&
    Number.isSafeInteger(row.jExtent) && row.jExtent > 0 &&
    Number.isSafeInteger(row.tExtent) && row.tExtent === Math.max(row.iExtent, row.jExtent) &&
    Number.isSafeInteger(row.zExtent) && row.zExtent > 0 &&
    Number.isSafeInteger(row.largestExtent) &&
    row.largestExtent === Math.max(row.tExtent, row.zExtent) &&
    Number.isFinite(row.totalMass) && !Object.is(row.totalMass, -0) && row.totalMass > 0 &&
    Number.isFinite(row.relativeMassDrift) && !Object.is(row.relativeMassDrift, -0) &&
    row.relativeMassDrift >= 0 &&
    row.farFieldObserved === (row.cycle % GATE4A_FAR_FIELD_CADENCE === 0) &&
    ((row.farFieldObserved && row.farFieldMean !== null && Number.isFinite(row.farFieldMean) &&
      !Object.is(row.farFieldMean, -0) && row.farFieldMean >= 0) ||
      (!row.farFieldObserved && row.farFieldMean === null)) &&
    Number.isSafeInteger(row.deltaCount) && row.deltaCount >= 0 &&
    /^[0-9a-f]{64}$/.test(row.deltaSha256) &&
    row.relaxationValid === true && row.surfaceValid === true && row.stateFinite === true &&
    (index === 0 || (
      row.attachedCount >= result.rows[index - 1].attachedCount &&
      row.iExtent >= result.rows[index - 1].iExtent &&
      row.jExtent >= result.rows[index - 1].jExtent &&
      row.tExtent >= result.rows[index - 1].tExtent &&
      row.zExtent >= result.rows[index - 1].zExtent &&
      row.largestExtent >= result.rows[index - 1].largestExtent
    )),
  );
}

function sizeTerminationValid(result: Gate4ARunResult, target: number): boolean {
  const crossing = result.extentCrossing;
  if (
    result.stopReason !== "size-target" ||
    crossing === null ||
    result.rows.length !== crossing.crossingCycle ||
    crossing.crossingCycle >= stopCap(result.config) ||
    crossing.previousCycle !== crossing.crossingCycle - 1
  ) {
    return false;
  }
  if (!(crossing.previousExtents.largestExtent < target && crossing.crossingExtents.largestExtent >= target)) return false;
  if (result.previousOccupancy === null) return false;
  const previous = latticeExtents(result.previousOccupancy, result.config.dims);
  const crossingFinal = latticeExtents(result.finalA, result.config.dims);
  return previous !== null && crossingFinal !== null &&
    sameRecordedExtents(previous, crossing.previousExtents) &&
    sameRecordedExtents(crossingFinal, crossing.crossingExtents);
}

function farFieldTerminationValid(result: Gate4ARunResult): boolean {
  const crossing = result.farFieldCrossing;
  if (
    result.stopReason !== "far-field" ||
    crossing === null ||
    result.rows.length !== crossing.crossingObservedCycle ||
    crossing.crossingObservedCycle >= stopCap(result.config) ||
    crossing.crossingObservedCycle % GATE4A_FAR_FIELD_CADENCE !== 0 ||
    !Object.is(crossing.threshold, (2 * result.config.params.rho) / 3) ||
    !(crossing.crossingMean < crossing.threshold) ||
    !(crossing.previousMean >= crossing.threshold)
  ) {
    return false;
  }
  const observed = result.rows.filter((row) => row.farFieldObserved);
  const finalObserved = observed[observed.length - 1];
  if (
    finalObserved === undefined ||
    finalObserved.cycle !== crossing.crossingObservedCycle ||
    finalObserved.farFieldMean !== crossing.crossingMean ||
    observed.slice(0, -1).some((row) => (row.farFieldMean as number) < crossing.threshold)
  ) {
    return false;
  }
  const previous = observed[observed.length - 2];
  return previous === undefined
    ? crossing.previousObservedCycle === 0 && crossing.previousMean === result.config.params.rho
    : crossing.previousObservedCycle === previous.cycle && crossing.previousMean === previous.farFieldMean;
}

export function gate4ATimelineEvidenceValid(result: Gate4ARunResult): boolean {
  if (result.config.schedule === null) return result.timeline === null;
  const timeline = result.timeline;
  if (
    timeline === null ||
    canonicalJson(timeline.schedule) !== canonicalJson(result.config.schedule) ||
    timeline.eventLog.length !== 1 ||
    timeline.transitionReports.length !== 1 ||
    timeline.beforeFieldHash !== timeline.afterFieldHash ||
    !Object.is(timeline.beforeMass, timeline.afterMass)
  ) {
    return false;
  }
  let reconstructed: ReconstructedDeltaChain;
  try {
    reconstructed = validateDeltaWitnesses(result);
  } catch {
    // Broken attachment evidence belongs to A-EXEC-NUMERIC, not a second timeline failure.
    return true;
  }
  const entry = timeline.eventLog[0];
  const crossingCycle = entry.crossingBoundary.completedCycles;
  if (!Number.isSafeInteger(crossingCycle) || crossingCycle < 1 || crossingCycle > result.rows.length) {
    return false;
  }
  const crossingRow = result.rows[crossingCycle - 1];
  const expectedCrossingBoundary = {
    phase: "afterInterfaceStep" as const,
    completedCycles: crossingCycle,
    extents: rowRecordedExtents(crossingRow),
  };
  const expectedPreviousBoundary = crossingCycle === 1
    ? { phase: "initial" as const, completedCycles: 0 as const }
    : {
        phase: "afterInterfaceStep" as const,
        completedCycles: crossingCycle - 1,
        extents: rowRecordedExtents(result.rows[crossingCycle - 2]),
      };
  let initialExtents: LatticeExtents | null;
  try {
    initialExtents = latticeExtents(result.initialOccupancy, result.config.dims);
  } catch {
    return false;
  }
  if (initialExtents === null) return false;
  const previousZExtent = crossingCycle === 1
    ? initialExtents.zExtent
    : result.rows[crossingCycle - 2].zExtent;
  const expectedTransitionReport = strictJsonSnapshot({
    operator: "GGThreshold",
    boundary: {
      phase: "completedCycleBoundary",
      completedCycles: crossingCycle,
      tick: crossingCycle,
    },
    beforeEnvironment: entry.beforeEnvironment,
    afterEnvironment: entry.afterEnvironment,
  });
  return entry.eventIndex === 0 && entry.operator === "GGThreshold" &&
    entry.trigger.kind === "zExtent" && entry.trigger.value === 25 &&
    canonicalJson(entry.previousBoundary) === canonicalJson(expectedPreviousBoundary) &&
    canonicalJson(entry.crossingBoundary) === canonicalJson(expectedCrossingBoundary) &&
    previousZExtent < 25 &&
    expectedCrossingBoundary.extents.zExtent >= 25 &&
    canonicalJson(timeline.transitionReports[0]) === canonicalJson(expectedTransitionReport) &&
    Number.isFinite(crossingRow.totalMass) && !Object.is(crossingRow.totalMass, -0) &&
    crossingRow.totalMass > 0 &&
    Object.is(timeline.beforeMass, crossingRow.totalMass) &&
    Object.is(timeline.afterMass, crossingRow.totalMass) &&
    timeline.eventZExtent === crossingRow.zExtent &&
    reconstructed.recordedTimelineAspectRatio !== null &&
    Object.is(timeline.eventAspectRatio, reconstructed.recordedTimelineAspectRatio) &&
    canonicalJson(entry.beforeEnvironment) === canonicalJson(result.config.schedule.initialEnvironment) &&
    canonicalJson(entry.afterEnvironment) === canonicalJson(result.config.schedule.events[0].environment);
}

function terminationValid(result: Gate4ARunResult): boolean {
  if (
    result.rows.length === 0 ||
    result.rows.length > stopCap(result.config) ||
    result.rows.some((row, index) =>
      row.cycle !== index + 1 ||
      row.farFieldObserved !== (row.cycle % GATE4A_FAR_FIELD_CADENCE === 0) ||
      ((row.farFieldMean !== null) !== row.farFieldObserved)
    )
  ) return false;
  const stop = result.config.stop;
  if (
    (stop.kind === "farField" && (result.extentCrossing !== null || result.previousOccupancy !== null)) ||
    (stop.kind !== "farField" && result.farFieldCrossing !== null)
  ) return false;
  const primary = stop.kind === "largestExtent"
    ? sizeTerminationValid(result, stop.target)
    : farFieldTerminationValid(result);
  if (!primary) return false;
  // No size-target run may have crossed the far-field threshold first on an observed row.
  if (stop.kind !== "farField") {
    const rho = result.config.params.rho;
    if (result.rows.some((row) => row.farFieldObserved && (row.farFieldMean as number) < (2 * rho) / 3)) {
      return false;
    }
  }
  try {
    validateGate4AFarFieldWitness(result);
  } catch (error) {
    // Malformed attachment reconstruction remains owned by A-EXEC-NUMERIC alone.
    if (error instanceof Error && error.message.startsWith("A-EXEC-NUMERIC:")) return true;
    return false;
  }
  return gate4ATimelineEvidenceValid(result);
}

function finalFieldsNumeric(result: Gate4ARunResult): boolean {
  const n = cellCount(result.config.dims);
  if (
    result.finalA.length !== n || result.finalB.length !== n || result.finalD.length !== n ||
    result.initialOccupancy.length !== n
  ) return false;
  for (let index = 0; index < n; index++) {
    if ((result.finalA[index] !== 0 && result.finalA[index] !== 1) ||
        !Number.isFinite(result.finalB[index]) || result.finalB[index] < 0 ||
        !Number.isFinite(result.finalD[index]) || result.finalD[index] < 0 ||
        (result.finalA[index] === 1 && result.finalD[index] !== 0)) return false;
  }
  try {
    strictJsonSnapshot(result.finalMetrics);
    verifyGate4ACheckpoint(result.checkpoint, {
      config: result.config,
      tick: result.rows.length,
      environment: finalEnvironment(result),
      a: result.finalA,
      b: result.finalB,
      d: result.finalD,
      metrics: result.finalMetrics,
    });
  } catch {
    return false;
  }
  return true;
}

function massValid(result: Gate4ARunResult): boolean {
  return Number.isFinite(result.initialMass) && result.initialMass > 0 &&
    result.rows.every((row) => row.relativeMassDrift < 1e-10) &&
    result.rows[result.rows.length - 1]?.totalMass === result.finalMetrics.totalMass;
}

/** Exact D6h invariance of every final state bit, including both float64 fields. */
function finalStateD6hInvariant(result: Gate4ARunResult): boolean {
  const { dims } = result.config;
  const n = cellCount(dims);
  if (result.finalA.length !== n || result.finalB.length !== n || result.finalD.length !== n) {
    return false;
  }
  const bBits = new BigUint64Array(
    result.finalB.buffer,
    result.finalB.byteOffset,
    result.finalB.length,
  );
  const dBits = new BigUint64Array(
    result.finalD.buffer,
    result.finalD.byteOffset,
    result.finalD.length,
  );
  const [ic, jc, kc] = domainCenter(dims);
  const radius = Math.min(ic, dims.nx - 1 - ic, jc, dims.ny - 1 - jc);
  const halfZ = Math.min(kc, dims.nz - 1 - kc);
  const sameCell = (left: number, right: number): boolean =>
    result.finalA[left] === result.finalA[right] &&
    bBits[left] === bBits[right] &&
    dBits[left] === dBits[right];
  for (let k = 0; k < dims.nz; k++) {
    for (let j = 0; j < dims.ny; j++) {
      for (let i = 0; i < dims.nx; i++) {
        const di = i - ic;
        const dj = j - jc;
        const hexRadius = (Math.abs(di) + Math.abs(dj) + Math.abs(di + dj)) / 2;
        if (hexRadius > radius || Math.abs(k - kc) > halfZ) continue;
        const cell = idx(dims, i, j, k);
        const ri = ic - dj;
        const rj = jc + di + dj;
        const mi = ic + dj;
        const mj = jc + di;
        const zk = 2 * kc - k;
        if (
          ri < 0 || ri >= dims.nx || rj < 0 || rj >= dims.ny ||
          mi < 0 || mi >= dims.nx || mj < 0 || mj >= dims.ny ||
          zk < 0 || zk >= dims.nz ||
          !sameCell(cell, idx(dims, ri, rj, k)) ||
          !sameCell(cell, idx(dims, mi, mj, k)) ||
          !sameCell(cell, idx(dims, i, j, zk))
        ) return false;
      }
    }
  }
  return true;
}

function symmetryValid(result: Gate4ARunResult): boolean {
  if (result.config.noiseEpsilon !== 0) return true;
  try {
    validateDeltaWitnesses(result);
  } catch {
    // A malformed chain is A-EXEC-NUMERIC. Do not double-classify it as physical asymmetry.
    return true;
  }
  const n = cellCount(result.config.dims);
  if (result.finalB.length !== n || result.finalD.length !== n) return true;
  return result.seedSymmetric && result.rows.every((row) => row.deltaSymmetric === true) &&
    finalStateD6hInvariant(result) &&
    symmetryError(result.finalA, result.config.dims, domainCenter(result.config.dims)) === 0 &&
    result.finalMetrics.symmetryError === 0;
}

function noiseRunEvidenceValid(
  result: Gate4ARunResult,
  independentReferenceAlreadyValidated = false,
): boolean {
  if (result.config.noiseEpsilon === 0) return result.noiseWitness === null && result.noiseVerdict === null;
  if (
    result.config.noiseStreamId !== STREAM_NOISE_XI ||
    result.noiseWitness === null ||
    result.noiseVerdict === null ||
    result.noiseWitness.version !== 1 ||
    canonicalJson(result.noiseWitness.dims) !== canonicalJson(result.config.dims) ||
    result.noiseWitness.tick !== 0 ||
    result.noiseWitness.rngSeed !== result.config.rngSeed ||
    result.noiseWitness.noiseEpsilon !== result.config.noiseEpsilon ||
    result.noiseWitness.streamId !== STREAM_NOISE_XI ||
    !Object.is(result.noiseWitness.phi, result.config.params.phi) ||
    !typedBitsEqual(result.noiseWitness.a, result.initialOccupancy)
  ) return false;
  const witness = result.noiseWitness;
  const { dims } = result.config;
  const n = cellCount(dims);
  if (witness.wall.length !== n || witness.preD.length !== n) return false;
  const [ic, jc, kc] = domainCenter(dims);
  const radius = Math.min(ic, dims.nx - 1 - ic, jc, dims.ny - 1 - jc);
  const halfZ = Math.min(kc, dims.nz - 1 - kc);
  const plane = dims.nx * dims.ny;
  for (let cell = 0; cell < n; cell++) {
    const k = Math.floor(cell / plane);
    const inPlane = cell - k * plane;
    const j = Math.floor(inPlane / dims.nx);
    const i = inPlane - j * dims.nx;
    const di = i - ic;
    const dj = j - jc;
    const hexRadius = (Math.abs(di) + Math.abs(dj) + Math.abs(di + dj)) / 2;
    const expectedWall = hexRadius <= radius && Math.abs(k - kc) <= halfZ ? 0 : 1;
    if (witness.wall[cell] !== expectedWall) return false;
    const expectedPreD = result.initialOccupancy[cell] === 1 || expectedWall === 1
      ? 0
      : result.config.params.rho;
    if (!Object.is(witness.preD[cell], expectedPreD)) return false;
  }
  if (independentReferenceAlreadyValidated) return result.noiseVerdict.passed;
  try {
    const independent = evaluateGGNoiseWitness(witness);
    return independent.passed && canonicalJson(independent) === canonicalJson(result.noiseVerdict);
  } catch {
    return false;
  }
}

/** Direct raw-evidence guard for one Pass-A run; always recomputes the independent reference. */
export function gate4ANoiseRunEvidenceValid(result: Gate4ARunResult): boolean {
  return noiseRunEvidenceValid(result);
}

function deltaChainNumericValid(result: Gate4ARunResult): boolean {
  try {
    validateDeltaWitnesses(result);
    return true;
  } catch {
    return false;
  }
}

function domainValid(result: Gate4ARunResult): boolean {
  try {
    const reconstructed = validateDeltaWitnesses(result);
    return !reconstructed.anyDomainContact && reconstructed.contactEvidenceConsistent;
  } catch {
    // Broken or falsified chain evidence belongs to A-EXEC-NUMERIC alone.
    return true;
  }
}

function singleRunExecutionValid(result: Gate4ARunResult, registered: Gate4ARunConfig): boolean {
  return configResultValid(result, registered) && terminationValid(result) && massValid(result) &&
    domainValid(result) && deltaChainNumericValid(result) && finalFieldsNumeric(result) &&
    symmetryValid(result) && noiseRunEvidenceValid(result);
}

export interface DeriveGate4AExecutionOptions {
  readonly provenance: Gate4AProvenance;
  readonly sourceHashes: Gate4ASourceHashes;
  readonly manifest: Gate4AManifest;
  readonly results: readonly Gate4ARunResult[];
  readonly artifacts: readonly EvidenceArtifactInput[];
}

/** Derive all eight A-EXEC records from raw run/artifact/provenance evidence. */
export function deriveGate4AExecutionRecords(
  options: DeriveGate4AExecutionOptions,
): readonly Phase4CriterionRecord<AExecutionCriterion>[] {
  const provenanceFailures = validateGate4AProvenance(options.provenance);
  const provenancePass = provenanceFailures.length === 0;
  const ids = options.results.map((result) => result.config.id);
  const registeredIds = options.manifest.runs.map((run) => run.id);
  const resultById = new Map(options.results.map((result) => [result.config.id, result]));
  const configPass =
    canonicalJson(options.manifest) === canonicalJson(buildGate4AManifest()) &&
    canonicalJsonSha256(options.manifest) === GATE4A_MANIFEST_SHA256 &&
    ids.length === registeredIds.length && new Set(ids).size === ids.length &&
    canonicalJson(ids) === canonicalJson(registeredIds) &&
    options.manifest.runs.every((registered) => {
      const result = resultById.get(registered.id);
      return result !== undefined && configResultValid(result, registered);
    });
  const noiseOff = options.results.filter((result) => result.config.noiseEpsilon === 0);
  const noiseOn = options.results.filter((result) => result.config.noiseEpsilon > 0);
  const symmetryPass = noiseOff.length === 9 && noiseOff.every(symmetryValid);
  const primaryReplay = resultById.get("A-HOLLOW-SEED-1");
  const replay = resultById.get("A-HOLLOW-SEED-1-REPLAY");
  const replayBits = primaryReplay !== undefined && replay !== undefined &&
    primaryReplay !== replay && primaryReplay.executionId !== replay.executionId &&
    primaryReplay.rows.length === replay.rows.length && primaryReplay.stopReason === replay.stopReason &&
    typedBitsEqual(primaryReplay.finalA, replay.finalA) &&
    typedBitsEqual(primaryReplay.finalB, replay.finalB) &&
    typedBitsEqual(primaryReplay.finalD, replay.finalD);
  const massPass = options.results.length === registeredIds.length && options.results.every(massValid);
  const domainPass = options.results.length === registeredIds.length && options.results.every(domainValid);
  const rawTerminationPass = options.results.length === registeredIds.length && options.results.every(terminationValid);
  let artifactFailure = "";
  let independentlyValidatedNoiseRuns: readonly string[] = [];
  try {
    independentlyValidatedNoiseRuns = validateGate4AArtifacts(
      options.manifest,
      options.results,
      options.artifacts,
    );
  } catch (error) {
    artifactFailure = error instanceof Error ? error.message : String(error);
  }
  const validatedNoiseRunIds = new Set(independentlyValidatedNoiseRuns);
  const rawNoisePass = noiseOn.length === 4 && noiseOn.every((result) =>
    noiseRunEvidenceValid(result, validatedNoiseRunIds.has(result.config.id))
  ) && replayBits;
  const noiseArtifactFailure = artifactFailure.startsWith("A-EXEC-NOISE:");
  const configArtifactFailure = artifactFailure.startsWith("A-EXEC-CONFIG:");
  const terminationArtifactFailure = artifactFailure.startsWith("A-EXEC-TERMINATION:");
  const noisePass = rawNoisePass && !noiseArtifactFailure;
  const configCriterionPass = configPass && !configArtifactFailure;
  const terminationPass = rawTerminationPass && !terminationArtifactFailure;
  const numericArtifactPass = artifactFailure === "" || noiseArtifactFailure ||
    configArtifactFailure || terminationArtifactFailure;
  const numericPass = numericArtifactPass && options.results.length === registeredIds.length &&
    options.results.every((result) =>
      rowsStructurallyValid(result) && deltaChainNumericValid(result) && finalFieldsNumeric(result)
    );
  const maxDrift = options.results.reduce(
    (maximum, result) => Math.max(maximum, ...result.rows.map((row) => row.relativeMassDrift)),
    0,
  );
  return [
    createPhase4CriterionRecord("A-EXEC-PROVENANCE", provenancePass,
      provenancePass ? "exact engine and clean registered ancestry pass" : `provenance failed: ${provenanceFailures.join("; ")}`,
      { head: options.provenance.head, node: options.provenance.node, v8: options.provenance.v8 }),
    createPhase4CriterionRecord("A-EXEC-CONFIG", configCriterionPass,
      configCriterionPass ? "manifest, configs, canonical seeds, operator, and backend match byte-level freeze" : `manifest/config/seed/operator/backend mismatch${configArtifactFailure ? `: ${artifactFailure}` : ""}`,
      { manifestSha256: canonicalJsonSha256(options.manifest), runs: options.results.length }),
    createPhase4CriterionRecord("A-EXEC-SYMMETRY", symmetryPass,
      symmetryPass ? "all noise-off seeds, nonempty deltas, and final states are exactly D6h" : "noise-off raw symmetry evidence failed",
      { noiseOffRuns: noiseOff.length }),
    createPhase4CriterionRecord("A-EXEC-NOISE", noisePass,
      noisePass ? "all noisy runs reproduce the applied refusal operator and seed-1 replays raw fields" : "noise provenance/application/reference/replay failed",
      { noiseRuns: noiseOn.length, replayBits }),
    createPhase4CriterionRecord("A-EXEC-MASS", massPass,
      massPass ? "every per-cycle compensated mass sample satisfies drift bound" : "a per-cycle mass sample is missing, nonfinite, or out of tolerance",
      { maxRelativeMassDrift: Number.isFinite(maxDrift) ? maxDrift : null }),
    createPhase4CriterionRecord("A-EXEC-DOMAIN", domainPass,
      domainPass ? "domain contact is false on every cycle and final state" : "domain contact occurred or evidence is incomplete",
      { runs: options.results.length }),
    createPhase4CriterionRecord("A-EXEC-TERMINATION", terminationPass,
      terminationPass ? "every first stop/crossing/cadence/cap contract passes" : "a first-crossing, cadence, stop reason, or strict cap failed",
      { runs: options.results.length }),
    createPhase4CriterionRecord("A-EXEC-NUMERIC", numericPass,
      numericPass ? "all raw numeric fields and reopened artifacts/checkpoints are complete" : `numeric/artifact completeness failed${artifactFailure === "" ? "" : `: ${artifactFailure}`}`,
      { artifacts: options.artifacts.length, runs: options.results.length }),
  ];
}

function requiredResult(
  byId: ReadonlyMap<string, Gate4ARunResult>,
  id: string,
): Gate4ARunResult {
  const result = byId.get(id);
  if (result === undefined) throw new Error(`A-EXEC-NUMERIC: required run ${id} is missing`);
  return result;
}

function crossingOrThrow(result: Gate4ARunResult): Gate4AExtentCrossing {
  if (result.extentCrossing === null) {
    throw new Error(`A-EXEC-TERMINATION: ${result.config.id} has no extent crossing`);
  }
  return result.extentCrossing;
}

function habitCommonConfigHash(config: Gate4ARunConfig): string {
  return canonicalJsonSha256({
    operator: config.operator,
    backend: config.backend,
    dims: config.dims,
    domain: config.domain,
    farField: config.farField,
    seedRadius: config.seedRadius,
    seedThickness: config.seedThickness,
    rngSeed: config.rngSeed,
    noiseEpsilon: config.noiseEpsilon,
    noiseStreamId: config.noiseStreamId,
    params: {
      rho: config.params.rho,
      phi: config.params.phi,
      kappa: config.params.kappa,
      mu: config.params.mu,
      // The first meaningful vector slot is the sole registered swept control.
      ggThreshBetaExcept01: config.params.ggThreshBeta.slice(1),
    },
    stop: config.stop,
    farFieldCadence: config.farFieldCadence,
    depletionTargets: config.depletionTargets,
    replayOf: config.replayOf,
    schedule: config.schedule,
  });
}

function branchSharedConfigHash(config: Gate4ARunConfig): string {
  return canonicalJsonSha256({
    dims: config.dims,
    domain: config.domain,
    farField: config.farField,
    rngSeed: config.rngSeed,
    noiseEpsilon: config.noiseEpsilon,
    seedRadius: config.seedRadius,
    seedThickness: config.seedThickness,
  });
}

/** Derive every morphology record from final arrays and raw crossings, after stepping. */
export function deriveGate4AMorphologyRecords(
  manifest: Gate4AManifest,
  results: readonly Gate4ARunResult[],
  sourceHashes: Gate4ASourceHashes,
  sharedExecutionValid: boolean,
): readonly Phase4CriterionRecord<AMorphologyCriterion>[] {
  const byId = new Map(results.map((result) => [result.config.id, result]));
  const registeredById = new Map(manifest.runs.map((config) => [config.id, config]));
  const structural = validateGate4ASourceHashes(sourceHashes);
  const valid = (result: Gate4ARunResult) => {
    const registered = registeredById.get(result.config.id);
    return sharedExecutionValid && structural && registered !== undefined &&
      singleRunExecutionValid(result, registered);
  };
  const habitResults = A_HABIT_CONTROLS.map((u) =>
    requiredResult(byId, `A-HABIT-U${String(u).replace(".", "P")}`),
  );
  const habitRecords = evaluateAHabit(habitResults.map((result) => {
    const crossing = crossingOrThrow(result);
    const control = result.config.habitControl;
    if (control === null || result.config.stop.kind !== "largestExtent") {
      throw new Error(`A-EXEC-CONFIG: habit controls missing for ${result.config.id}`);
    }
    return {
      u: control.u,
      ggThreshBeta01: control.ggThreshBeta01,
      targetLargestExtent: result.config.stop.target,
      stepCap: result.config.stop.cap,
      stopReason: result.stopReason,
      previousCycle: crossing.previousCycle,
      crossingCycle: crossing.crossingCycle,
      previousLargestExtent: crossing.previousExtents.largestExtent,
      crossingLargestExtent: crossing.crossingExtents.largestExtent,
      executionValid: valid(result),
      commonConfigHash: habitCommonConfigHash(result.config),
      aspectRatio: aspectRatio(result.finalA, result.config.dims),
      crossSectionHollowness: crossSectionHollowness(result.finalA, result.config.dims),
      sealedVoidFraction: sealedVoidFraction(result.finalA, result.config.dims),
    };
  }));

  const depletion = requiredResult(byId, "A-DEPLETION");
  const depletionCrossing = crossingOrThrow(depletion);
  const depletionRecords = evaluateADepletion(depletion.depletionSamples, {
    targetExtent: 36,
    stopReason: depletion.stopReason,
    completedCycles: depletion.rows.length,
    largestExtent: depletionCrossing.crossingExtents.largestExtent,
    aspectRatio: aspectRatio(depletion.finalA, depletion.config.dims),
    stepCap: A_DEPLETION_STEP_CAP,
  });

  const hollowResults = [1, 2, 3].map((seed) => requiredResult(byId, `A-HOLLOW-SEED-${seed}`));
  const replay = requiredResult(byId, "A-HOLLOW-SEED-1-REPLAY");
  const asHollow = (result: Gate4ARunResult): HollowRun => {
    const crossing = crossingOrThrow(result);
    if (result.previousOccupancy === null || result.config.stop.kind !== "largestExtent") {
      throw new Error(`A-EXEC-NUMERIC: ${result.config.id} lacks raw hollow crossing arrays`);
    }
    return {
      executionId: result.executionId,
      seed: result.config.rngSeed,
      dims: result.config.dims,
      targetLargestExtent: result.config.stop.target,
      stepCap: result.config.stop.cap,
      stopReason: result.stopReason,
      previousCycle: crossing.previousCycle,
      crossingCycle: crossing.crossingCycle,
      previousLargestExtent: crossing.previousExtents.largestExtent,
      crossingLargestExtent: crossing.crossingExtents.largestExtent,
      executionValid: valid(result),
      initialOccupancy: result.initialOccupancy,
      previousOccupancy: result.previousOccupancy,
      state: {
        occupancy: result.finalA,
        surfaceField: result.finalB,
        vaporField: result.finalD,
      },
    };
  };
  const hollowRecords = evaluateAHollow(
    hollowResults.map(asHollow),
    asHollow(replay),
    structural,
  );

  const timeline = requiredResult(byId, "A-TIMELINE");
  const timelineEvidence = timeline.timeline;
  const timelineRecords = evaluateATimeline({
    eventCount: timelineEvidence?.eventLog.length ?? 0,
    eventZExtent: timelineEvidence?.eventZExtent ?? 0,
    eventAspectRatio: timelineEvidence?.eventAspectRatio ?? 0,
    beforeFieldHash: timelineEvidence?.beforeFieldHash ?? "",
    afterFieldHash: timelineEvidence?.afterFieldHash ?? "",
    beforeMass: timelineEvidence?.beforeMass ?? 0,
    afterMass: timelineEvidence?.afterMass ?? 1,
    profile: cappedColumnProfile(timeline.finalA, timeline.config.dims, domainCenter(timeline.config.dims)),
    finalZExtent: latticeExtents(timeline.finalA, timeline.config.dims)?.zExtent ?? 0,
    stopReason: timeline.stopReason,
    finalSymmetryError: symmetryError(timeline.finalA, timeline.config.dims, domainCenter(timeline.config.dims)),
    domainContact: timeline.finalMetrics.domainContact,
    maxRelativeMassDrift: Math.max(...timeline.rows.map((row) => row.relativeMassDrift)),
  });

  const dendrite = requiredResult(byId, "A-BRANCH-DENDRITE");
  const comparator = requiredResult(byId, "A-BRANCH-COMPARATOR");
  const dendriteCrossing = dendrite.farFieldCrossing;
  const comparatorCrossing = comparator.farFieldCrossing;
  const comparatorReconstruction = validateDeltaWitnesses(comparator);
  let comparatorAttachedCount = 0;
  for (const attached of comparatorReconstruction.finalOccupancy) comparatorAttachedCount += attached;
  const branchMeasurement = (
    result: Gate4ARunResult,
    crossing: Gate4AFarFieldCrossing | null,
  ) => ({
    rho: result.config.params.rho,
    threshold: crossing?.threshold ?? Number.NaN,
    previousObservedCycle: crossing?.previousObservedCycle ?? -1,
    previousMean: crossing?.previousMean ?? Number.NaN,
    crossingObservedCycle: crossing?.crossingObservedCycle ?? -1,
    crossingMean: crossing?.crossingMean ?? Number.NaN,
    stopReason: result.stopReason,
    finalTExtent: latticeExtents(result.finalA, result.config.dims)?.tExtent ?? 0,
    branchCount: branchCount(result.finalA, result.config.dims, domainCenter(result.config.dims)),
    aspectRatio: aspectRatio(result.finalA, result.config.dims),
    executionValid: valid(result),
    sharedConfigHash: branchSharedConfigHash(result.config),
  });
  const branchRecord = evaluateABranch({
    dendrite: branchMeasurement(dendrite, dendriteCrossing),
    comparator: {
      ...branchMeasurement(comparator, comparatorCrossing),
      finalAttachedCount: comparatorAttachedCount,
      nonemptyAttachmentDeltaCycles: comparator.deltas.filter((witness) => witness.indices.length > 0).length,
    },
  });
  return [
    ...habitRecords,
    ...depletionRecords,
    ...hollowRecords,
    ...timelineRecords,
    branchRecord,
  ];
}

export interface Gate4ARunOutcome {
  readonly manifest: Gate4AManifest;
  readonly provenance: Gate4AProvenance;
  readonly sourceHashes: Gate4ASourceHashes;
  readonly results: readonly Gate4ARunResult[];
  readonly records: readonly Phase4CriterionRecord<AExecutionCriterion | AMorphologyCriterion>[];
  readonly verdict: Gate4AVerdict;
  readonly artifacts: readonly EvidenceArtifactInput[];
  readonly publication: PublishedEvidenceBundle | null;
}

export interface RunGate4AOptions {
  readonly repoRoot?: string;
  readonly canonicalDirectory?: string;
  /** Test-only preflight seam. The CLI always rebuilds the registered manifest directly. */
  readonly buildManifest?: () => Gate4AManifest;
  readonly collectProvenance?: () => Gate4AProvenance;
  readonly collectSourceHashes?: () => Gate4ASourceHashes;
  readonly executeRun?: (
    config: Gate4ARunConfig,
    options: ExecuteGate4ARunOptions,
  ) => Gate4ARunResult;
  readonly publish?: typeof publishEvidenceBundle;
  readonly onProgress?: (runId: string, cycle: number, attached: number) => void;
}

function resultSummary(result: Gate4ARunResult): StrictJson {
  return strictJsonSnapshot({
    runId: result.config.id,
    executionId: result.executionId,
    configSha256: result.registeredConfigSha256,
    completedCycles: result.rows.length,
    stopReason: result.stopReason,
    extentCrossing: result.extentCrossing,
    farFieldCrossing: result.farFieldCrossing,
    final: {
      aSha256: rawTypedArraySha256(result.finalA),
      bSha256: rawTypedArraySha256(result.finalB),
      dSha256: rawTypedArraySha256(result.finalD),
      metrics: result.finalMetrics,
      checkpointSha256: sha256Bytes(result.checkpoint),
    },
    noise: result.noiseVerdict,
    schedule: result.timeline === null
      ? null
      : {
          registered: result.timeline.schedule,
          eventLog: result.timeline.eventLog,
          transitions: result.timeline.transitionReports,
        },
  });
}

/** Stable criterion ownership for all Pass-A publication failures. */
export function publishGate4ABundle(
  options: Parameters<typeof publishEvidenceBundle>[0],
  publish: typeof publishEvidenceBundle = publishEvidenceBundle,
): PublishedEvidenceBundle {
  try {
    return publish(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      message.startsWith("A-EXEC-NUMERIC:")
        ? message
        : `A-EXEC-NUMERIC: evidence publication failed: ${message}`,
    );
  }
}

/** Serial Pass-A orchestration. The real CLI supplies no dependencies or bypasses. */
export function runGate4A(options: RunGate4AOptions = {}): Gate4ARunOutcome {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const manifest = options.buildManifest?.() ?? buildGate4AManifest();
  if (canonicalJsonSha256(manifest) !== GATE4A_MANIFEST_SHA256) {
    throw new Error("A-EXEC-CONFIG: rebuilt Pass-A manifest differs from the reviewed freeze");
  }
  const canonicalDirectory = resolve(
    repoRoot,
    options.canonicalDirectory ?? GATE4A_CANONICAL_DIRECTORY,
  );
  if (existsSync(canonicalDirectory)) {
    throw new Error(`A-EXEC-NUMERIC: canonical evidence already exists: ${canonicalDirectory}`);
  }
  const provenance = options.collectProvenance?.() ?? collectGate4AProvenance(repoRoot);
  const provenanceFailures = validateGate4AProvenance(provenance);
  if (provenanceFailures.length > 0) {
    throw new Error(`A-EXEC-PROVENANCE: ${provenanceFailures.join("; ")}`);
  }
  const sourceHashes = options.collectSourceHashes?.() ?? collectGate4ASourceHashes(repoRoot);
  if (!validateGate4ASourceHashes(sourceHashes)) {
    throw new Error(
      `A-HOLLOW-STRUCTURAL: solver source hashes shifted (gg=${sourceHashes.gg}, lk=${sourceHashes.lk})`,
    );
  }
  const executeRun = options.executeRun ?? executeGate4ARun;
  const results: Gate4ARunResult[] = [];
  for (const config of manifest.runs) {
    const result = executeRun(config, {
      onProgress: options.onProgress,
    });
    results.push(result);
  }
  const artifacts = buildGate4AArtifacts(manifest, results);
  const executionRecords = deriveGate4AExecutionRecords({
    provenance,
    sourceHashes,
    manifest,
    results,
    artifacts,
  });
  const morphologyRecords = deriveGate4AMorphologyRecords(
    manifest,
    results,
    sourceHashes,
    executionRecords.every((record) => record.passed),
  );
  const records = [...executionRecords, ...morphologyRecords];
  const verdict = evaluateGate4A(records);
  let publication: PublishedEvidenceBundle | null = null;
  if (verdict.gatePass) {
    const publish = options.publish ?? publishEvidenceBundle;
    publication = publishGate4ABundle({
      canonicalDirectory,
      reportPath: GATE4A_REPORT_PATH,
      protocol: GATE4A_PROTOCOL,
      pass: "A",
      operator: "GGThreshold",
      payload: {
        version: 2,
        manifestSha256: GATE4A_MANIFEST_SHA256,
        provenance,
        sourceHashes,
        records,
        verdict,
        runs: results.map(resultSummary),
      },
      artifacts,
    }, publish);
  }
  return {
    manifest,
    provenance,
    sourceHashes,
    results,
    records,
    verdict,
    artifacts,
    publication,
  };
}

export interface Gate4ATerminalPresentation {
  readonly exitCode: 0 | 1;
  readonly stdoutLines: readonly string[];
  readonly stderrLines: readonly string[];
}

function terminalFact(label: string, value: unknown): string {
  return `GATE4A ${label} ${canonicalJson(strictJsonSnapshot(value))}`;
}

/** Deterministic terminal evidence derived only from the verified orchestration outcome. */
export function formatGate4ATerminalPresentation(
  outcome: Gate4ARunOutcome,
): Gate4ATerminalPresentation {
  // A terminal result requires publication evidence consistent with its verdict; the real
  // CLI cannot produce a mismatch, so one here is a forged or corrupted outcome.
  if (outcome.verdict.gatePass && outcome.publication === null) {
    throw new Error("A-EXEC-NUMERIC: passing verdict requires a verified publication");
  }
  if (!outcome.verdict.gatePass && outcome.publication !== null) {
    throw new Error("A-EXEC-NUMERIC: failed verdict must not carry a publication");
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
  const stdoutLines = [
    terminalFact("PROVENANCE", outcome.provenance),
    terminalFact("SURFACE", {
      operator: "GGThreshold",
      protocol: GATE4A_PROTOCOL,
      domain: "hexPrism",
      farField: "reflecting",
    }),
    terminalFact("SOURCE-HASHES", outcome.sourceHashes),
    `GATE4A MANIFEST ${canonicalJson(outcome.manifest)}`,
    ...outcome.results.map((result) => terminalFact("TERMINATION", {
      runId: result.config.id,
      executionId: result.executionId,
      completedCycles: result.rows.length,
      stopReason: result.stopReason,
      extentCrossing: result.extentCrossing,
      farFieldCrossing: result.farFieldCrossing,
    })),
    ...sortedArtifacts.map((artifact) => terminalFact("ARTIFACT", artifact)),
  ];
  if (outcome.verdict.gatePass) {
    stdoutLines.push(terminalFact("PASSED", {
      executions: outcome.results.length,
      payloadArtifacts: outcome.artifacts.length,
      manifestSha256: GATE4A_MANIFEST_SHA256,
      published: outcome.publication?.directory ?? null,
    }));
    stdoutLines.push("GATE4A EXIT STATUS: 0");
    return { exitCode: 0, stdoutLines, stderrLines: [] };
  }
  const stderrLines = [
    "GATE4A FAILED:",
    ...outcome.verdict.contractFailures.map((failure) => `  - ${failure}`),
    ...outcome.verdict.blockingFailures.map((criterion) => `  - ${criterion}`),
    "GATE4A EXIT STATUS: 1",
  ];
  return { exitCode: 1, stdoutLines, stderrLines };
}

/** CLI presentation only; main.ts owns exit-code assignment and flag rejection. */
export function gate4a(): 0 | 1 {
  const outcome = runGate4A({
    onProgress: (runId, cycle, attached) => {
      if (cycle % 250 === 0) console.log(`gate4a run=${runId} cycle=${cycle} attached=${attached}`);
    },
  });
  const presentation = formatGate4ATerminalPresentation(outcome);
  for (const line of presentation.stdoutLines) console.log(line);
  for (const line of presentation.stderrLines) console.error(line);
  return presentation.exitCode;
}
