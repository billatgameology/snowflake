import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, totalmem, arch, platform, release } from "node:os";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import {
  aspectRatio,
  coordsOf,
  createTimelineCursor,
  domainCenter,
  evaluateTimelineBoundary,
  isD6hInvariantSet,
  latticeExtents,
  symmetryError,
  validateTimelineCursor,
  type FacetClass,
  type LKTimelineSchedule,
  type NucleationParamSet,
  type TimelineCursor,
  type TimelineEventLogEntry,
} from "@vcc/core";
import {
  float64SmootherDriftAbsLimit,
  LKSolver,
  type LKFacetDipArm,
  type LKExperimentalHoleFilling,
  type LKExperimentalBasalWidthHistory,
  type LKEnvironmentTransitionReport,
} from "@vcc/solver-cpu";
import { validateLKStepEvidence } from "./gate2b-validation.ts";
import { acquireDiscoveryRowLease, DiscoveryCheckpointStore, type DiscoveryRunnerResumeState } from "./discovery-resume-io.ts";

export type DiscoveryLane =
  | "A"
  | "B"
  | "C"
  | "adaptive-map"
  | "adaptive-pressure"
  | "adaptive-seed"
  | "long-map"
  | "long-pressure"
  | "long-seed"
  | "confirm-seed"
  | "confirm-pressure"
  | "confirm-map"
  | "followup-seed-timestep"
  | "followup-seed-forcing"
  | "followup-seed-localization"
  | "followup-mixed-timestep"
  | "followup-larger"
  | "followup-history"
  | "cavity-mechanism";

export interface DiscoveryTimelineEvent {
  readonly triggerLargestExtent: number;
  readonly tempC: number;
  readonly sigmaInfinity: number;
}

export interface DiscoveryRow {
  readonly id: string;
  readonly lane: DiscoveryLane;
  readonly conditional: boolean;
  readonly tempC: number;
  readonly fraction: number;
  readonly sigmaInfinity: number;
  readonly pressurePa?: number;
  readonly paramSet: Extract<NucleationParamSet, "M1" | "M1_NO_DIP_ABLATION">;
  readonly dimsN: number;
  readonly dxUm: number;
  readonly cflFill: number;
  readonly seedRadius: number;
  readonly seedThickness: number;
  readonly targetExtent: number;
  readonly maxSteps: number;
  readonly timelineEvent?: DiscoveryTimelineEvent;
  /** First pre-update extent crossings at which to retain the accepted spatial boundary. */
  readonly spatialSampleExtents?: readonly number[];
  /** Explicit development kinetics; paramSet remains the M1 base preparation, not the arm. */
  readonly experimentalFacetDips?: LKFacetDipArm;
  /** Explicit geometric-completion intervention; ordinary kinetics are retained. */
  readonly experimentalHoleFilling?: LKExperimentalHoleFilling;
  /** P4 exposed-terrace chord threshold; basal kinetics are local, not a global M1 arm. */
  readonly experimentalBasalWidthCells?: number;
  /** Early-growth-history counterfactual; the cutoff uses pre-update physical time. */
  readonly experimentalBasalWidthHistory?: LKExperimentalBasalWidthHistory;
}

export const DISCOVERY_FACET_EXPERIMENT_ID = "post-phase10-facet-isolation-v1" as const;
export const DISCOVERY_HOLEFILL_EXPERIMENT_ID = "post-phase10-holefill-isolation-v1" as const;
export const DISCOVERY_PRISM_HOLEFILL_INTERACTION_ID = "post-phase10-prism-holefill-interaction-v1" as const;
export const DISCOVERY_BASAL_WIDTH_EXPERIMENT_ID = "post-phase10-local-basal-width-v1" as const;
export const DISCOVERY_BASAL_WIDTH_HISTORY_EXPERIMENT_ID = "post-phase10-basal-width-history-v1" as const;

export interface DiscoveryExperimentIdentity {
  readonly experimentId?: typeof DISCOVERY_FACET_EXPERIMENT_ID | typeof DISCOVERY_HOLEFILL_EXPERIMENT_ID |
    typeof DISCOVERY_PRISM_HOLEFILL_INTERACTION_ID | typeof DISCOVERY_BASAL_WIDTH_EXPERIMENT_ID |
    typeof DISCOVERY_BASAL_WIDTH_HISTORY_EXPERIMENT_ID;
  readonly experimentalFacetDips?: LKFacetDipArm;
  readonly experimentalHoleFilling?: LKExperimentalHoleFilling;
  readonly experimentalBasalWidthCells?: number;
  readonly experimentalBasalWidthHistory?: LKExperimentalBasalWidthHistory;
}

/** Absent for ordinary rows so historical artifact shapes stay unchanged. */
export function discoveryExperimentIdentity(
  row: Pick<DiscoveryRow, "experimentalFacetDips" | "experimentalHoleFilling" | "experimentalBasalWidthCells" |
    "experimentalBasalWidthHistory">,
): DiscoveryExperimentIdentity {
  const history = row.experimentalBasalWidthHistory;
  if (history !== undefined) {
    if (row.experimentalBasalWidthCells === undefined) {
      throw new Error("basal-width history requires experimentalBasalWidthCells");
    }
    if (history === null || (history.mode !== "early-only" && history.mode !== "late-only") ||
      !Number.isFinite(history.cutoffSeconds) || history.cutoffSeconds <= 0) {
      throw new Error("basal-width history requires early-only/late-only and a finite positive cutoffSeconds");
    }
  }
  if (row.experimentalBasalWidthCells !== undefined) {
    if (!Number.isSafeInteger(row.experimentalBasalWidthCells) || row.experimentalBasalWidthCells < 1) {
      throw new Error("experimentalBasalWidthCells must be a positive integer");
    }
    if (row.experimentalFacetDips !== undefined || row.experimentalHoleFilling !== undefined) {
      throw new Error("local basal-width rows cannot combine experimental options");
    }
    return { experimentId: history === undefined ? DISCOVERY_BASAL_WIDTH_EXPERIMENT_ID :
      DISCOVERY_BASAL_WIDTH_HISTORY_EXPERIMENT_ID,
      experimentalBasalWidthCells: row.experimentalBasalWidthCells,
      ...(history === undefined ? {} : { experimentalBasalWidthHistory: history }) };
  }
  if (row.experimentalHoleFilling !== undefined) {
    if (row.experimentalFacetDips !== undefined) {
      if (row.experimentalFacetDips !== "prism-only" || row.experimentalHoleFilling !== "disabled") {
        throw new Error("only prism-only with disabled hole filling may be combined");
      }
      return {
        experimentId: DISCOVERY_PRISM_HOLEFILL_INTERACTION_ID,
        experimentalFacetDips: row.experimentalFacetDips,
        experimentalHoleFilling: row.experimentalHoleFilling,
      };
    }
    return {
      experimentId: DISCOVERY_HOLEFILL_EXPERIMENT_ID,
      experimentalHoleFilling: row.experimentalHoleFilling,
    };
  }
  return row.experimentalFacetDips === undefined ? {} : {
    experimentId: DISCOVERY_FACET_EXPERIMENT_ID,
    experimentalFacetDips: row.experimentalFacetDips,
  };
}

export type DiscoveryStopReason =
  | "size-target"
  | "domain-contact"
  | "unconverged"
  | "stalled"
  | "step-cap"
  | "wall-budget"
  | "checkpoint-pause"
  | "solver-error";

export type DiscoveryHabitClass = "plate" | "neutral" | "column" | "invalid";

/** Budget stops preserve completed observations, not a resumable solver state. */
export interface DiscoveryExecutionBudget {
  readonly maxWallSeconds: number;
  readonly stoppedAt: "cycle-boundary" | "relaxation" | null;
  readonly completedCycles: number;
  readonly interruptedRelaxation: { readonly cycle: number; readonly sweeps: number } | null;
  readonly timelineEventReached: boolean | null;
}

export interface DiscoveryTerminalResult extends DiscoveryExperimentIdentity {
  readonly schema: "post-phase10-discovery-result-v1";
  readonly rowId: string;
  readonly lane: DiscoveryLane;
  readonly stopReason: DiscoveryStopReason;
  readonly admissible: boolean;
  readonly habitClass: DiscoveryHabitClass;
  readonly cycles: number;
  readonly totalSweeps: number;
  readonly attachedCount: number;
  readonly seedSites: number;
  readonly extent: number;
  readonly aspectRatio: number;
  readonly symmetryError: number;
  readonly allAttachmentEventsD6h: boolean;
  readonly allRelaxationsConverged: boolean;
  readonly simTimeSeconds: number;
  readonly wallSeconds: number;
  readonly peakRssBytes: number;
  readonly maxKineticFillIncrement: number;
  readonly maxDivergenceResidual: number;
  readonly maxAbsSmootherDrift: number;
  readonly smootherDriftAbsLimit: number;
  readonly minShellInjection: number | null;
  readonly minSurfaceExchange: number | null;
  readonly fillLedger: number;
  readonly saturationClippedFill: number;
  readonly holeFillDeficit: number;
  readonly holeFillCountTotal: number;
  readonly integrityErrors: readonly string[];
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly gitHead: string;
  readonly node: string;
  readonly timeline?: DiscoveryTimelineResult;
  readonly spatialSnapshots?: readonly DiscoverySpatialSnapshotRecord[];
  /** Absent for legacy unbudgeted invocations. */
  readonly executionBudget?: DiscoveryExecutionBudget;
}

export interface DiscoverySpatialSnapshotRecord {
  readonly path: string;
  readonly triggerExtent: number;
  readonly actualExtent: number;
  readonly completedCycles: number;
  readonly simTimeSeconds: number;
}

export interface DiscoverySpatialSnapshot extends DiscoveryExperimentIdentity {
  readonly schema: "post-phase10-spatial-boundary-v1";
  readonly rowId: string;
  readonly timing: "after-converged-relaxation-before-surface-advance";
  readonly record: DiscoverySpatialSnapshotRecord;
  readonly dims: { readonly nx: number; readonly ny: number; readonly nz: number };
  readonly center: readonly number[];
  readonly dxUm: number;
  readonly tempC: number;
  readonly sigmaInfinity: number;
  readonly seedRadius: number;
  readonly seedThickness: number;
  readonly attachedCount: number;
  readonly cells: readonly {
    readonly index: number;
    readonly coords: readonly number[];
    readonly neighborCounts: readonly number[];
    readonly facet: FacetClass;
    readonly fill: number;
    readonly sigmaOpp: number;
    readonly sigmaBoundary: number;
    readonly alphaHKBoundary: number;
    readonly robinGeometry: number;
    readonly fillGeometry: number;
    readonly basalWidthCells?: number;
    readonly basalWidthSelected?: boolean;
  }[];
}

export interface DiscoveryTimelineResult {
  readonly schedule: LKTimelineSchedule;
  readonly eventLog: readonly TimelineEventLogEntry[];
  readonly eventCycle: number;
  readonly transitionReport: LKEnvironmentTransitionReport;
}

const FIXED = {
  surfacePolicy: "aggregate-hv-g1h1-v6" as const,
  farField: "monopole-matched" as const,
  pressurePa: 101_325,
  rngSeed: 1,
  noiseEpsilon: 0,
  relaxTol: 1e-9,
  divTol: 1e-7,
  relaxMaxSweeps: 200_000,
} as const;

function row(input: DiscoveryRow): DiscoveryRow {
  return Object.freeze(input);
}

const anchor = (id: string, dimsN: number, conditional = false): DiscoveryRow =>
  row({
    id,
    lane: "A",
    conditional,
    tempC: -6,
    fraction: 0.15,
    sigmaInfinity: 0.00906,
    paramSet: "M1",
    dimsN,
    dxUm: 0.7,
    cflFill: 0.1,
    seedRadius: 8,
    seedThickness: 17,
    targetExtent: 27,
    maxSteps: 100_000,
  });

const laneABRows: readonly DiscoveryRow[] = Object.freeze([
  anchor("a80", 80),
  anchor("a96", 96),
  anchor("a112", 112, true),
  row({
    ...anchor("b80-c05", 80),
    id: "b80-c05",
    lane: "B",
    cflFill: 0.05,
  }),
  row({
    ...anchor("b96-c05", 96),
    id: "b96-c05",
    lane: "B",
    cflFill: 0.05,
  }),
  row({
    ...anchor("b96-seed7", 96),
    id: "b96-seed7",
    lane: "B",
    seedRadius: 7,
    seedThickness: 15,
  }),
  row({
    ...anchor("b96-seed9", 96),
    id: "b96-seed9",
    lane: "B",
    seedRadius: 9,
    seedThickness: 19,
  }),
]);

const laneCConditions = Object.freeze([
  { tempC: -5, fraction: 0.125, sigmaInfinity: 0.00625 },
  { tempC: -5, fraction: 0.15, sigmaInfinity: 0.0075 },
  { tempC: -5, fraction: 0.2, sigmaInfinity: 0.01 },
  { tempC: -6, fraction: 0.125, sigmaInfinity: 0.00755 },
  { tempC: -6, fraction: 0.15, sigmaInfinity: 0.00906 },
  { tempC: -6, fraction: 0.2, sigmaInfinity: 0.01208 },
  { tempC: -19, fraction: 0.1, sigmaInfinity: 0.02034 },
  { tempC: -19, fraction: 0.125, sigmaInfinity: 0.025425 },
  { tempC: -19, fraction: 0.2, sigmaInfinity: 0.04068 },
  { tempC: -24, fraction: 0.1, sigmaInfinity: 0.0265 },
  { tempC: -24, fraction: 0.125, sigmaInfinity: 0.033125 },
  { tempC: -24, fraction: 0.2, sigmaInfinity: 0.053 },
] as const);

function fractionTag(value: number): string {
  return value.toString().replace(".", "p");
}

const laneCRows: readonly DiscoveryRow[] = Object.freeze(
  laneCConditions.flatMap((condition) =>
    (["M1", "M1_NO_DIP_ABLATION"] as const).map((paramSet) =>
      row({
        id:
          `c-t${String(Math.abs(condition.tempC)).padStart(2, "0")}` +
          `-f${fractionTag(condition.fraction)}-${paramSet === "M1" ? "m1" : "nodip"}`,
        lane: "C",
        conditional: false,
        ...condition,
        paramSet,
        dimsN: 48,
        dxUm: 0.35,
        cflFill: 0.1,
        seedRadius: 2,
        seedThickness: 1,
        targetExtent: 21,
        maxSteps: 100_000,
      }),
    ),
  ),
);

export const POST_PHASE10_DISCOVERY_ROWS: readonly DiscoveryRow[] = Object.freeze([
  ...laneABRows,
  ...laneCRows,
]);

const rowIndex = new Map(POST_PHASE10_DISCOVERY_ROWS.map((candidate) => [candidate.id, candidate]));

if (rowIndex.size !== POST_PHASE10_DISCOVERY_ROWS.length) {
  throw new Error("post-Phase-10 discovery roster contains duplicate row ids");
}

export const POST_PHASE10_INITIAL_ROWS: readonly DiscoveryRow[] = Object.freeze([
  // Begin the heavy rows immediately, then fill freed slots with the short trajectory rows.
  ...laneABRows.filter((candidate) => !candidate.conditional),
  ...laneCRows,
]);

export function postPhase10DiscoveryRow(rowId: string): DiscoveryRow {
  const candidate = rowIndex.get(rowId);
  if (candidate === undefined) throw new Error(`unknown post-Phase-10 discovery row: ${rowId}`);
  return candidate;
}

export function discoveryHabitClass(value: number): DiscoveryHabitClass {
  if (!Number.isFinite(value) || value <= 0) return "invalid";
  if (value <= 1 / 1.5) return "plate";
  if (value >= 1.5) return "column";
  return "neutral";
}

export interface DiscoveryA112Eligibility {
  readonly eligible: boolean;
  readonly reason: string;
  readonly attachedCountRelativeDifference: number | null;
}

export function discoveryA112Eligibility(
  a80: DiscoveryTerminalResult,
  a96: DiscoveryTerminalResult,
): DiscoveryA112Eligibility {
  if (a80.rowId !== "a80" || a96.rowId !== "a96") {
    return {
      eligible: false,
      reason: `expected a80/a96 results, got ${a80.rowId}/${a96.rowId}`,
      attachedCountRelativeDifference: null,
    };
  }
  if (!a80.admissible || !a96.admissible) {
    return {
      eligible: false,
      reason: "A80 and A96 must both be admissible",
      attachedCountRelativeDifference: null,
    };
  }
  if (a80.habitClass !== a96.habitClass) {
    return {
      eligible: false,
      reason: `habit class changed from ${a80.habitClass} to ${a96.habitClass}`,
      attachedCountRelativeDifference: null,
    };
  }
  const relative = Math.abs(a96.attachedCount - a80.attachedCount) / a80.attachedCount;
  return relative <= 0.005
    ? {
        eligible: true,
        reason: "same habit class and attached-count difference is at most 0.5%",
        attachedCountRelativeDifference: relative,
      }
    : {
        eligible: false,
        reason: `attached-count difference ${(relative * 100).toFixed(6)}% exceeds 0.5%`,
        attachedCountRelativeDifference: relative,
      };
}

interface NumericSummary {
  readonly min: number;
  readonly max: number;
  readonly mean: number;
}

interface BoundaryFacetSummary {
  readonly count: number;
  readonly sigmaBoundary: NumericSummary | null;
  readonly sigmaOpp: NumericSummary | null;
  readonly alphaHKBoundary: NumericSummary | null;
  readonly fill: NumericSummary | null;
}

interface BoundarySummary {
  readonly count: number;
  readonly facets: Readonly<Record<FacetClass, BoundaryFacetSummary>>;
  readonly neighborConfigurations: Readonly<Record<string, number>>;
}

interface MutableNumericSummary {
  count: number;
  sum: number;
  min: number;
  max: number;
}

function accumulator(): MutableNumericSummary {
  return { count: 0, sum: 0, min: Infinity, max: -Infinity };
}

function add(summary: MutableNumericSummary, value: number): void {
  if (!Number.isFinite(value)) throw new Error(`boundary telemetry is non-finite: ${String(value)}`);
  summary.count++;
  summary.sum += value;
  if (value < summary.min) summary.min = value;
  if (value > summary.max) summary.max = value;
}

function finish(summary: MutableNumericSummary): NumericSummary | null {
  return summary.count === 0
    ? null
    : { min: summary.min, max: summary.max, mean: summary.sum / summary.count };
}

interface BasalWidthBoundaryRates {
  readonly thresholdCells: number;
  readonly historyActive?: boolean;
  readonly completedCyclesBeforeUpdate: number;
  readonly simTimeSecondsBeforeUpdate: number;
  readonly widthHistogram: Record<string, number>;
  selectedBasalCells: number;
  unselectedBasalCells: number;
  selectedRatePerSecond: number;
  unselectedRatePerSecond: number;
}

function summarizeBoundary(solver: LKSolver, basalWidthThreshold?: number): {
  readonly summary: BoundarySummary;
  readonly facetByIndex: ReadonlyMap<number, FacetClass>;
  readonly basalWidthRates?: BasalWidthBoundaryRates;
} {
  const historyActive = solver.experimentalBasalWidthHistory === undefined
    ? true : solver.basalWidthHistoryActive();
  const basalWidthRates: BasalWidthBoundaryRates | undefined = basalWidthThreshold === undefined
    ? undefined : { thresholdCells: basalWidthThreshold, completedCyclesBeforeUpdate: solver.tick,
      ...(solver.experimentalBasalWidthHistory === undefined ? {} : { historyActive }),
      simTimeSecondsBeforeUpdate: solver.simTimeSeconds, widthHistogram: {}, selectedBasalCells: 0,
      unselectedBasalCells: 0, selectedRatePerSecond: 0, unselectedRatePerSecond: 0 };
  const facets = ["basal", "prism", "inhibited", "rough"] as const;
  const mutable = new Map(
    facets.map((facet) => [
      facet,
      {
        count: 0,
        sigmaBoundary: accumulator(),
        sigmaOpp: accumulator(),
        alphaHKBoundary: accumulator(),
        fill: accumulator(),
      },
    ]),
  );
  const facetByIndex = new Map<number, FacetClass>();
  const neighborConfigurations: Record<string, number> = {};
  for (const index of solver.boundaryCells()) {
    const facet = solver.facetClassOf(index);
    const state = solver.boundaryState(index);
    if (basalWidthRates !== undefined && facet === "basal") {
      const width = state.basalWidthCells;
      if (width === undefined || !Number.isSafeInteger(width) || width < 1 ||
        state.basalWidthSelected !== (historyActive && width <= basalWidthRates.thresholdCells)) {
        throw new Error(`basal-width observation is missing or inconsistent at cell ${index}`);
      }
      basalWidthRates.widthHistogram[width] = (basalWidthRates.widthHistogram[width] ?? 0) + 1;
      const rate = (state.alphaHKBoundary * solver.vKinMS * state.sigmaBoundary) /
        (state.fillGeometry * solver.dxM);
      if (state.basalWidthSelected) {
        basalWidthRates.selectedBasalCells++;
        basalWidthRates.selectedRatePerSecond += rate;
      } else {
        basalWidthRates.unselectedBasalCells++;
        basalWidthRates.unselectedRatePerSecond += rate;
      }
    }
    const facetSummary = mutable.get(facet) as NonNullable<ReturnType<typeof mutable.get>>;
    facetSummary.count++;
    add(facetSummary.sigmaBoundary, state.sigmaBoundary);
    add(facetSummary.sigmaOpp, state.sigmaOpp);
    add(facetSummary.alphaHKBoundary, state.alphaHKBoundary);
    add(facetSummary.fill, solver.f[index]);
    facetByIndex.set(index, facet);
    const [nT, nZ] = solver.neighborCounts(index);
    const key = `${nT},${nZ}`;
    neighborConfigurations[key] = (neighborConfigurations[key] ?? 0) + 1;
  }
  const finalFacets = Object.fromEntries(
    facets.map((facet) => {
      const summary = mutable.get(facet) as NonNullable<ReturnType<typeof mutable.get>>;
      return [
        facet,
        {
          count: summary.count,
          sigmaBoundary: finish(summary.sigmaBoundary),
          sigmaOpp: finish(summary.sigmaOpp),
          alphaHKBoundary: finish(summary.alphaHKBoundary),
          fill: finish(summary.fill),
        },
      ];
    }),
  ) as Record<FacetClass, BoundaryFacetSummary>;
  return {
    summary: {
      count: solver.boundarySize(),
      facets: finalFacets,
      neighborConfigurations,
    },
    facetByIndex,
    ...(basalWidthRates === undefined ? {} : { basalWidthRates }),
  };
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function gitHead(): string {
  return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

function hostRecord(head: string): Record<string, unknown> {
  const processors = cpus();
  return {
    schema: "post-phase10-discovery-host-v1",
    gitHead: head,
    node: process.version,
    v8: process.versions.v8,
    platform: platform(),
    release: release(),
    arch: arch(),
    logicalProcessors: processors.length,
    cpuModels: [...new Set(processors.map((processor) => processor.model))],
    totalMemoryBytes: totalmem(),
  };
}

function finiteMinimum(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

function eventFacets(
  attached: readonly number[],
  facetByIndex: ReadonlyMap<number, FacetClass>,
): Readonly<Record<FacetClass | "unknown", number>> {
  const counts: Record<FacetClass | "unknown", number> = {
    basal: 0,
    prism: 0,
    inhibited: 0,
    rough: 0,
    unknown: 0,
  };
  for (const index of attached) counts[facetByIndex.get(index) ?? "unknown"]++;
  return counts;
}

export interface RunDiscoveryRowOptions {
  /** Separate identified continuation; legacy row callers remain unchanged. */
  readonly checkpoint?: "create" | "resume";
  /** Operational pause at an absolute completed cycle, after publishing its checkpoint. */
  readonly pauseAfterCycles?: number;
  readonly heartbeat?: (message: string) => void;
  /** Cooperative terminal observation limit; never implies checkpoint continuation. */
  readonly maxWallSeconds?: number;
  /** Monotonic elapsed-time source, injectable for deterministic budget-boundary tests. */
  readonly budgetClockMilliseconds?: () => number;
}

class DiscoveryWallBudgetReached extends Error {}

export function runPostPhase10DiscoveryRow(
  candidate: DiscoveryRow,
  outputDirectory: string,
  options: RunDiscoveryRowOptions = {},
): DiscoveryTerminalResult {
  if (options.checkpoint === undefined) return runDiscoveryRow(candidate, outputDirectory, options);
  const release = acquireDiscoveryRowLease(resolve(outputDirectory));
  try { return runDiscoveryRow(candidate, outputDirectory, options); } finally { release(); }
}

function runDiscoveryRow(candidate: DiscoveryRow, outputDirectory: string, options: RunDiscoveryRowOptions): DiscoveryTerminalResult {
  if (options.pauseAfterCycles !== undefined && (options.checkpoint === undefined || !Number.isSafeInteger(options.pauseAfterCycles) || options.pauseAfterCycles < 1)) {
    throw new Error("pauseAfterCycles requires checkpointing and a positive integer cycle");
  }
  if (options.checkpoint !== undefined && options.maxWallSeconds !== undefined) throw new Error("resumable science has no wall budget");
  if (options.maxWallSeconds !== undefined &&
    (!Number.isFinite(options.maxWallSeconds) || options.maxWallSeconds <= 0)) {
    throw new Error("maxWallSeconds must be finite and positive");
  }
  if (candidate.experimentalFacetDips !== undefined &&
    (candidate.paramSet !== "M1" || candidate.timelineEvent !== undefined)) {
    throw new Error("facet-isolation rows require the M1 base and a constant environment");
  }
  if (candidate.experimentalHoleFilling !== undefined && candidate.timelineEvent !== undefined) {
    throw new Error("hole-fill-isolation rows require a constant environment");
  }
  if (candidate.experimentalBasalWidthCells !== undefined &&
    (candidate.paramSet !== "M1" || candidate.timelineEvent !== undefined)) {
    throw new Error("local basal-width rows require the M1 base and a constant environment");
  }
  const experimentIdentity = discoveryExperimentIdentity(candidate);
  const experimentLabel = experimentIdentity.experimentId === undefined ? "" :
    ` experimentId=${experimentIdentity.experimentId}` +
    (candidate.experimentalFacetDips === undefined ? "" : ` experimentalFacetDips=${candidate.experimentalFacetDips}`) +
    (candidate.experimentalHoleFilling === undefined ? "" : ` experimentalHoleFilling=${candidate.experimentalHoleFilling}`) +
    (candidate.experimentalBasalWidthCells === undefined ? "" : ` experimentalBasalWidthCells=${candidate.experimentalBasalWidthCells}`) +
    (candidate.experimentalBasalWidthHistory === undefined ? "" :
      ` experimentalBasalWidthHistory=${candidate.experimentalBasalWidthHistory.mode}` +
      ` cutoffSeconds=${candidate.experimentalBasalWidthHistory.cutoffSeconds}`);
  const output = resolve(outputDirectory);
  mkdirSync(output, { recursive: true });
  for (const leaf of ["spec.json", "events.jsonl", "result.json"] as const) {
    if (existsSync(resolve(output, leaf)) && options.checkpoint !== "resume") {
      throw new Error(`discovery row output already exists: ${resolve(output, leaf)}`);
    }
  }

  const head = gitHead();
  const expectedSpec = {
    schema: "post-phase10-discovery-row-v1",
    ...experimentIdentity,
    row: candidate,
    fixed: FIXED,
    effectivePressurePa: candidate.pressurePa ?? FIXED.pressurePa,
    ...(options.maxWallSeconds === undefined ? {} : {
      executionBudget: { maxWallSeconds: options.maxWallSeconds },
    }),
    ...(options.checkpoint === undefined ? {} : { checkpointFormat: "discovery-resume-v1" }),
  };
  if (options.checkpoint === "resume" && existsSync(resolve(output, "spec.json"))) {
    if (JSON.stringify(JSON.parse(readFileSync(resolve(output, "spec.json"), "utf8"))) !== JSON.stringify(expectedSpec)) throw new Error("resume row spec mismatch");
    if (existsSync(resolve(output, "host.json"))) {
      const previousHost = JSON.parse(readFileSync(resolve(output, "host.json"), "utf8"));
      if (previousHost.gitHead !== head || previousHost.node !== process.version || previousHost.v8 !== process.versions.v8) throw new Error("resume source/runtime mismatch");
    }
  } else {
    writeJson(resolve(output, "spec.json"), expectedSpec);
    writeJson(resolve(output, "host.json"), { ...hostRecord(head), ...experimentIdentity });
  }
  const checkpointStore = options.checkpoint === undefined ? null : new DiscoveryCheckpointStore(output, candidate, head);
  const restored = options.checkpoint === "resume" ? checkpointStore!.load() : null;
  const attemptStartedAt = new Date();
  const startedAt = restored === null ? attemptStartedAt : new Date(restored.runner.startedAt);
  const priorWallSeconds = restored?.runner.activeWallSeconds ?? 0;
  const activeWallSeconds = (): number => priorWallSeconds + (Date.now() - attemptStartedAt.getTime()) / 1000;
  const budgetClock = options.budgetClockMilliseconds ?? (() => performance.now());
  const budgetStart = options.maxWallSeconds === undefined ? 0 : budgetClock();
  if (!Number.isFinite(budgetStart)) throw new Error("budget clock must be finite");
  let previousBudgetClock = budgetStart;
  let budgetStoppedAt: DiscoveryExecutionBudget["stoppedAt"] = null;
  let interruptedRelaxation: DiscoveryExecutionBudget["interruptedRelaxation"] = null;
  const checkBudget = (
    phase: Exclude<DiscoveryExecutionBudget["stoppedAt"], null>,
    interrupted: DiscoveryExecutionBudget["interruptedRelaxation"] = null,
  ): void => {
    if (options.maxWallSeconds === undefined) return;
    const currentBudgetClock = budgetClock();
    if (!Number.isFinite(currentBudgetClock) || currentBudgetClock < previousBudgetClock) {
      throw new Error("budget clock must remain finite and monotonic");
    }
    previousBudgetClock = currentBudgetClock;
    const elapsedMilliseconds = currentBudgetClock - budgetStart;
    if (elapsedMilliseconds / 1000 >= options.maxWallSeconds) {
      budgetStoppedAt = phase;
      interruptedRelaxation = interrupted;
      throw new DiscoveryWallBudgetReached("registered wall budget reached");
    }
  };
  // A stop before the first update still supplies an explicit, empty completed prefix.
  if (options.maxWallSeconds !== undefined) {
    writeFileSync(resolve(output, "events.jsonl"), "", { flag: "wx" });
  }
  let peakRssBytes = process.memoryUsage().rss;
  let totalSweeps = 0;
  let completedCycleRecords = 0;
  let allAttachmentEventsD6h = true;
  let allRelaxationsConverged = true;
  let maxKineticFillIncrement = 0;
  let maxDivergenceResidual = 0;
  let maxAbsSmootherDrift = 0;
  let minShellInjection = Infinity;
  let minSurfaceExchange = Infinity;
  let stopReason: DiscoveryStopReason = "step-cap";
  const integrityErrors: string[] = [];
  const dims = { nx: candidate.dimsN, ny: candidate.dimsN, nz: candidate.dimsN };
  const center = domainCenter(dims);
  let solver = new LKSolver({
    surfacePolicy: FIXED.surfacePolicy,
    dims,
    tempC: candidate.tempC,
    sigmaInfinity: candidate.sigmaInfinity,
    dxUm: candidate.dxUm,
    pressurePa: candidate.pressurePa ?? FIXED.pressurePa,
    paramSet: candidate.paramSet,
    ...(candidate.experimentalFacetDips === undefined ? {} : {
      experimentalFacetDips: candidate.experimentalFacetDips,
    }),
    ...(candidate.experimentalHoleFilling === undefined ? {} : {
      experimentalHoleFilling: candidate.experimentalHoleFilling,
    }),
    ...(candidate.experimentalBasalWidthCells === undefined ? {} : {
      experimentalBasalWidthCells: candidate.experimentalBasalWidthCells,
    }),
    ...(candidate.experimentalBasalWidthHistory === undefined ? {} : {
      experimentalBasalWidthHistory: candidate.experimentalBasalWidthHistory,
    }),
    cflFill: candidate.cflFill,
    relaxTol: FIXED.relaxTol,
    divTol: FIXED.divTol,
    relaxMaxSweeps: FIXED.relaxMaxSweeps,
    rngSeed: FIXED.rngSeed,
    noiseEpsilon: FIXED.noiseEpsilon,
    domain: "hexPrism",
    farField: FIXED.farField,
    seedRadius: candidate.seedRadius,
    seedThickness: candidate.seedThickness,
    center,
  });
  let seedSites = solver.attachedCount;
  const spatialSnapshots: DiscoverySpatialSnapshotRecord[] = [];
  const pendingSpatialExtents = new Set(candidate.spatialSampleExtents ?? []);
  let currentSmootherDriftAbsLimit = float64SmootherDriftAbsLimit(
    solver.activeCellCount,
    candidate.sigmaInfinity,
  );
  let maximumSmootherDriftAbsLimit = currentSmootherDriftAbsLimit;
  const timelineSchedule: LKTimelineSchedule | null =
    candidate.timelineEvent === undefined
      ? null
      : {
          version: 1,
          mode: "abrupt",
          operator: "LibbrechtKinetics",
          initialEnvironment: {
            tempC: candidate.tempC,
            sigmaInfinity: candidate.sigmaInfinity,
          },
          events: [
            {
              index: 0,
              operator: "LibbrechtKinetics",
              trigger: {
                kind: "largestExtent",
                value: candidate.timelineEvent.triggerLargestExtent,
              },
              environment: {
                tempC: candidate.timelineEvent.tempC,
                sigmaInfinity: candidate.timelineEvent.sigmaInfinity,
              },
            },
          ],
        };
  let timelineCursor: TimelineCursor | null = null;
  let timelineTransition:
    | {
        readonly eventCycle: number;
        readonly transitionReport: LKEnvironmentTransitionReport;
      }
    | undefined;
  if (timelineSchedule !== null) {
    timelineCursor = createTimelineCursor(timelineSchedule);
    const initialDecision = evaluateTimelineBoundary(timelineSchedule, timelineCursor, {
      phase: "initial",
      completedCycles: 0,
    });
    if (initialDecision.event !== null) {
      throw new Error(`row ${candidate.id} timeline fired before growth`);
    }
    timelineCursor = initialDecision.cursor;
  }
  let terminalStopReason: DiscoveryStopReason | null = null;
  if (restored !== null) {
    const initialControls = solver.exportDiscoveryResumeState();
    solver = LKSolver.restoreDiscovery(restored.decoded);
    const state = solver.exportDiscoveryResumeState();
    const restoredRunner = restored.runner;
    const controls = ["dxUm", "pressurePa", "paramSet", "cflFill", "relaxTol", "divTol", "relaxMaxSweeps", "rngSeed", "noiseEpsilon", "domain", "farField", "surfacePolicy", "experimentalFacetDips", "experimentalBasalWidthCells"] as const;
    if (controls.some((key) => !Object.is(state[key], initialControls[key])) ||
        JSON.stringify(state.dims) !== JSON.stringify(dims) || JSON.stringify(state.center) !== JSON.stringify(center) ||
        JSON.stringify(state.experimentalBasalWidthHistory) !== JSON.stringify(initialControls.experimentalBasalWidthHistory)) throw new Error("resume solver controls disagree with row");
    if (timelineSchedule === null) {
      if (restoredRunner.timelineCursor !== null || restoredRunner.timelineTransition !== null || state.acceptedEnvironmentEventCount !== 0) throw new Error("unexpected resume timeline state");
    } else {
      if (restoredRunner.timelineCursor === null) throw new Error("missing resume timeline cursor");
      validateTimelineCursor(timelineSchedule, restoredRunner.timelineCursor);
      if (restoredRunner.timelineCursor.lastBoundary?.completedCycles !== solver.tick || restoredRunner.timelineCursor.nextEventIndex !== state.acceptedEnvironmentEventCount ||
          (restoredRunner.timelineCursor.nextEventIndex === 0) !== (restoredRunner.timelineTransition === null) ||
          (restoredRunner.timelineTransition !== null && restoredRunner.timelineTransition.eventCycle !== restoredRunner.timelineCursor.eventLog[0]?.crossingBoundary.completedCycles)) throw new Error("resume timeline/solver boundary mismatch");
    }
    const expectedEnvironment = restoredRunner.timelineTransition === null ? candidate : candidate.timelineEvent!;
    if (!Object.is(solver.tempC, expectedEnvironment.tempC) || !Object.is(solver.sigmaInfinity, expectedEnvironment.sigmaInfinity)) throw new Error("resume environment disagrees with timeline");
    const sampled = restoredRunner.spatialSnapshots.map((x) => x.triggerExtent);
    const pending = restoredRunner.pendingSpatialExtents;
    const expectedExtents = [...(candidate.spatialSampleExtents ?? [])].sort((a,b) => a-b);
    if (new Set([...sampled, ...pending]).size !== sampled.length + pending.length || JSON.stringify([...sampled,...pending].sort((a,b) => a-b)) !== JSON.stringify(expectedExtents) ||
        restoredRunner.spatialSnapshots.some((x) => x.path !== `boundary-e${x.triggerExtent}.json` || x.completedCycles > solver.tick)) throw new Error("resume spatial sampling state mismatch");
    totalSweeps = restoredRunner.totalSweeps; completedCycleRecords = restoredRunner.completedCycleRecords;
    peakRssBytes = Math.max(peakRssBytes, restoredRunner.peakRssBytes);
    allAttachmentEventsD6h = restoredRunner.allAttachmentEventsD6h; allRelaxationsConverged = restoredRunner.allRelaxationsConverged;
    maxKineticFillIncrement = restoredRunner.maxKineticFillIncrement; maxDivergenceResidual = restoredRunner.maxDivergenceResidual;
    maxAbsSmootherDrift = restoredRunner.maxAbsSmootherDrift; minShellInjection = restoredRunner.minShellInjection ?? Infinity;
    minSurfaceExchange = restoredRunner.minSurfaceExchange ?? Infinity; seedSites = restoredRunner.seedSites;
    spatialSnapshots.push(...restoredRunner.spatialSnapshots); pendingSpatialExtents.clear(); for (const x of pending) pendingSpatialExtents.add(x);
    currentSmootherDriftAbsLimit = restoredRunner.currentSmootherDriftAbsLimit; maximumSmootherDriftAbsLimit = restoredRunner.maximumSmootherDriftAbsLimit;
    timelineCursor = restoredRunner.timelineCursor; timelineTransition = restoredRunner.timelineTransition ?? undefined;
    integrityErrors.push(...restoredRunner.integrityErrors); terminalStopReason = restoredRunner.terminalStopReason;
    if (terminalStopReason === "size-target" && solver.largestExtent() < candidate.targetExtent ||
        terminalStopReason === "step-cap" && solver.tick < candidate.maxSteps ||
        terminalStopReason === "domain-contact" && !solver.domainContact()) throw new Error("resume terminal condition mismatch");
    restored.recover();
  }
  const checkpoint = (): void => {
    if (checkpointStore === null) return;
    const runnerState: DiscoveryRunnerResumeState = { startedAt: startedAt.toISOString(), activeWallSeconds: activeWallSeconds(), peakRssBytes,
      totalSweeps, completedCycleRecords, allAttachmentEventsD6h, allRelaxationsConverged, maxKineticFillIncrement, maxDivergenceResidual,
      maxAbsSmootherDrift, minShellInjection: finiteMinimum(minShellInjection), minSurfaceExchange: finiteMinimum(minSurfaceExchange), seedSites,
      spatialSnapshots, pendingSpatialExtents: [...pendingSpatialExtents], currentSmootherDriftAbsLimit, maximumSmootherDriftAbsLimit,
      timelineCursor, timelineTransition: timelineTransition ?? null, integrityErrors, terminalStopReason };
    checkpointStore.save(solver.exportDiscoveryResumeState(), runnerState);
  };
  if (checkpointStore !== null && restored === null) checkpoint();
  let lastHeartbeat = Date.now();
  options.heartbeat?.(
    `start row=${candidate.id}${experimentLabel} lane=${candidate.lane} dims=${candidate.dimsN} ` +
      `paramSet=${candidate.paramSet} pressurePa=${solver.pressurePa} ` +
      `target=${candidate.targetExtent}`,
  );

  try {
    if (terminalStopReason !== null) stopReason = terminalStopReason;
    for (let cycle = solver.tick + 1; terminalStopReason === null && cycle <= candidate.maxSteps; cycle++) {
      checkBudget("cycle-boundary");
      const relaxation = solver.relaxField((progress) => {
        checkBudget("relaxation", { cycle, sweeps: progress.sweeps });
        const now = Date.now();
        if (now - lastHeartbeat < 60_000) return;
        options.heartbeat?.(
          `relax row=${candidate.id}${experimentLabel} cycle=${cycle} sweeps=${progress.sweeps} ` +
            `residual=${progress.residual} divergence=${String(progress.divergenceResidual)}`,
        );
        lastHeartbeat = now;
      });
      totalSweeps += relaxation.sweeps;
      peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss);
      if (!relaxation.converged) {
        allRelaxationsConverged = false;
        stopReason = "unconverged";
        appendFileSync(
          resolve(output, "events.jsonl"),
          `${JSON.stringify({
            schema: "post-phase10-discovery-cycle-v1",
            ...experimentIdentity,
            rowId: candidate.id,
            cycle,
            relaxation,
            boundary: null,
            surface: null,
            stopReason,
          })}\n`,
          "utf8",
        );
        break;
      }

      const boundary = summarizeBoundary(solver, candidate.experimentalBasalWidthCells);
      const actualExtent = solver.largestExtent();
      for (const triggerExtent of pendingSpatialExtents) {
        if (actualExtent < triggerExtent) continue;
        const record: DiscoverySpatialSnapshotRecord = {
          path: `boundary-e${triggerExtent}.json`,
          triggerExtent,
          actualExtent,
          completedCycles: solver.tick,
          simTimeSeconds: solver.simTimeSeconds,
        };
        const snapshot: DiscoverySpatialSnapshot = {
          schema: "post-phase10-spatial-boundary-v1",
          ...experimentIdentity,
          rowId: candidate.id,
          timing: "after-converged-relaxation-before-surface-advance",
          record,
          dims,
          center,
          dxUm: candidate.dxUm,
          tempC: solver.tempC,
          sigmaInfinity: solver.sigmaInfinity,
          seedRadius: candidate.seedRadius,
          seedThickness: candidate.seedThickness,
          attachedCount: solver.attachedCount,
          cells: solver.boundaryCells().map((index) => ({
            index,
            coords: coordsOf(dims, index),
            neighborCounts: solver.neighborCounts(index),
            facet: solver.facetClassOf(index),
            fill: solver.f[index],
            ...solver.boundaryState(index),
          })),
        };
        writeJson(resolve(output, record.path), snapshot);
        spatialSnapshots.push(record);
        pendingSpatialExtents.delete(triggerExtent);
      }
      const fillBefore = solver.fillLedger;
      const clippedBefore = solver.saturationClippedFill;
      const holeDeficitBefore = solver.holeFillDeficit;
      const surface = solver.advanceSurface();
      // SurfaceReport is shared with G-G, whose timestep is null; this observation is LK-only.
      const widthStepSeconds = boundary.basalWidthRates === undefined ? 0 : surface.deltaTimeSeconds;
      if (widthStepSeconds === null) throw new Error("basal-width demand requires an LK physical timestep");
      if (surface.stalled) {
        stopReason = "stalled";
      } else {
        const validated = validateLKStepEvidence(
          relaxation,
          surface,
          FIXED.relaxTol,
          FIXED.divTol,
          FIXED.surfacePolicy,
          currentSmootherDriftAbsLimit,
        );
        if (validated.maxKineticFillIncrement > candidate.cflFill + 1e-12) {
          throw new Error(
            `row ${candidate.id} kinetic fill ${validated.maxKineticFillIncrement} exceeds ` +
              `cflFill ${candidate.cflFill}`,
          );
        }
        maxKineticFillIncrement = Math.max(
          maxKineticFillIncrement,
          validated.maxKineticFillIncrement,
        );
        maxDivergenceResidual = Math.max(
          maxDivergenceResidual,
          validated.divergenceResidual,
        );
        maxAbsSmootherDrift = Math.max(
          maxAbsSmootherDrift,
          Math.abs(validated.smootherDrift ?? 0),
        );
        minShellInjection = Math.min(minShellInjection, validated.shellInjection);
        minSurfaceExchange = Math.min(minSurfaceExchange, validated.surfaceExchange);
      }

      const attached = [...solver.lastAttached];
      const eventD6h = isD6hInvariantSet(attached, dims, center);
      allAttachmentEventsD6h &&= eventD6h;
      const currentAspectRatio = aspectRatio(solver.a, dims);
      const currentSymmetryError = symmetryError(solver.a, dims, center);
      const extents = latticeExtents(solver.a, dims);
      if (extents === null) throw new Error(`row ${candidate.id} lost its crystal`);
      const extent = extents.largestExtent;
      let cycleTimelineEvent:
        | {
            readonly logEntry: TimelineEventLogEntry;
            readonly transitionReport: LKEnvironmentTransitionReport;
          }
        | undefined;
      if (timelineSchedule !== null && timelineCursor !== null) {
        const decision = evaluateTimelineBoundary(timelineSchedule, timelineCursor, {
          phase: "afterInterfaceStep",
          completedCycles: solver.tick,
          extents,
        });
        timelineCursor = decision.cursor;
        if (decision.event !== null) {
          if (decision.event.operator !== "LibbrechtKinetics" || decision.logEntry === null) {
            throw new Error(`row ${candidate.id} timeline emitted an invalid event`);
          }
          if (timelineTransition !== undefined) {
            throw new Error(`row ${candidate.id} timeline fired more than once`);
          }
          const transitionReport = solver.applyTimelineEnvironment(decision.event.environment);
          timelineTransition = { eventCycle: solver.tick, transitionReport };
          cycleTimelineEvent = { logEntry: decision.logEntry, transitionReport };
          currentSmootherDriftAbsLimit = float64SmootherDriftAbsLimit(
            solver.activeCellCount,
            solver.sigmaInfinity,
          );
          maximumSmootherDriftAbsLimit = Math.max(
            maximumSmootherDriftAbsLimit,
            currentSmootherDriftAbsLimit,
          );
        }
      }
      const rssBytes = process.memoryUsage().rss;
      peakRssBytes = Math.max(peakRssBytes, rssBytes);
      const cycleRecord = {
        schema: "post-phase10-discovery-cycle-v1",
        ...experimentIdentity,
        rowId: candidate.id,
        cycle: solver.tick,
        relaxation,
        boundary: boundary.summary,
        ...(boundary.basalWidthRates === undefined ? {} : { basalWidthObservation: {
          timing: "after-converged-relaxation-before-surface-advance",
          thresholdCells: boundary.basalWidthRates.thresholdCells,
          ...(boundary.basalWidthRates.historyActive === undefined ? {} : {
            historyActive: boundary.basalWidthRates.historyActive,
          }),
          completedCyclesBeforeUpdate: boundary.basalWidthRates.completedCyclesBeforeUpdate,
          simTimeSecondsBeforeUpdate: boundary.basalWidthRates.simTimeSecondsBeforeUpdate,
          widthHistogram: boundary.basalWidthRates.widthHistogram,
          selectedBasalCells: boundary.basalWidthRates.selectedBasalCells,
          unselectedBasalCells: boundary.basalWidthRates.unselectedBasalCells,
          selectedKineticDemandFill: boundary.basalWidthRates.selectedRatePerSecond * widthStepSeconds,
          unselectedKineticDemandFill: boundary.basalWidthRates.unselectedRatePerSecond * widthStepSeconds,
        } }),
        surface,
        attached: attached.map((index) => ({
          index,
          coords: coordsOf(dims, index),
          facetBeforeAttachment: boundary.facetByIndex.get(index) ?? null,
        })),
        attachmentFacets: eventFacets(attached, boundary.facetByIndex),
        attachmentEventD6h: eventD6h,
        attachedCount: solver.attachedCount,
        extent,
        aspectRatio: currentAspectRatio,
        symmetryError: currentSymmetryError,
        simTimeSeconds: solver.simTimeSeconds,
        ledgers: {
          fillLedger: solver.fillLedger,
          fillIncrement: solver.fillLedger - fillBefore,
          saturationClippedFill: solver.saturationClippedFill,
          saturationClippedIncrement: solver.saturationClippedFill - clippedBefore,
          holeFillDeficit: solver.holeFillDeficit,
          holeFillDeficitIncrement: solver.holeFillDeficit - holeDeficitBefore,
          holeFillCountTotal: solver.holeFillCountTotal,
        },
        ...(cycleTimelineEvent === undefined
          ? {}
          : { timelineEvent: cycleTimelineEvent }),
        rssBytes,
      };
      appendFileSync(
        resolve(output, "events.jsonl"),
        `${JSON.stringify(cycleRecord)}\n`,
        "utf8",
      );
      completedCycleRecords = solver.tick;
      writeJson(resolve(output, "status.json"), {
        schema: "post-phase10-discovery-status-v1",
        ...experimentIdentity,
        rowId: candidate.id,
        cycle: solver.tick,
        attachedCount: solver.attachedCount,
        extent,
        totalSweeps,
        simTimeSeconds: solver.simTimeSeconds,
        wallSeconds: activeWallSeconds(),
        peakRssBytes,
        updatedAt: new Date().toISOString(),
      });

      const now = Date.now();
      if (now - lastHeartbeat >= 60_000 || cycle === 1) {
        options.heartbeat?.(
          `cycle row=${candidate.id}${experimentLabel} tick=${solver.tick} attached=${solver.attachedCount} ` +
            `extent=${extent} aspectRatio=${currentAspectRatio} sweeps=${relaxation.sweeps}`,
        );
        lastHeartbeat = now;
      }
      if (surface.stalled) terminalStopReason = "stalled";
      else if (solver.domainContact()) terminalStopReason = "domain-contact";
      else if (extent >= candidate.targetExtent) terminalStopReason = "size-target";
      else if (cycle === candidate.maxSteps) terminalStopReason = "step-cap";
      checkpoint();
      if (terminalStopReason !== null) { stopReason = terminalStopReason; break; }
      if (options.pauseAfterCycles !== undefined && solver.tick >= options.pauseAfterCycles) { stopReason = "checkpoint-pause"; break; }
      checkBudget("cycle-boundary");
    }
  } catch (error) {
    if (error instanceof DiscoveryWallBudgetReached) {
      stopReason = "wall-budget";
    } else {
      stopReason = "solver-error";
      integrityErrors.push(error instanceof Error ? error.stack ?? error.message : String(error));
    }
  }

  const cappedBudgetPrefix = (options.maxWallSeconds !== undefined || options.checkpoint !== undefined) &&
    (stopReason === "wall-budget" || stopReason === "step-cap" || stopReason === "checkpoint-pause");
  if (timelineSchedule !== null && timelineTransition === undefined && !cappedBudgetPrefix) {
    integrityErrors.push(`row ${candidate.id} did not reach its registered timeline event`);
  }

  const finishedAt = new Date();
  if (options.maxWallSeconds !== undefined) {
    peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss);
  }
  const finalAspectRatio = aspectRatio(solver.a, dims);
  const finalSymmetryError = symmetryError(solver.a, dims, center);
  const admissible =
    stopReason === "size-target" &&
    allRelaxationsConverged &&
    allAttachmentEventsD6h &&
    finalSymmetryError === 0 &&
    integrityErrors.length === 0;
  const result: DiscoveryTerminalResult = {
    schema: "post-phase10-discovery-result-v1",
    ...experimentIdentity,
    rowId: candidate.id,
    lane: candidate.lane,
    stopReason,
    admissible,
    habitClass: discoveryHabitClass(finalAspectRatio),
    cycles: solver.tick,
    totalSweeps,
    attachedCount: solver.attachedCount,
    seedSites,
    extent: solver.largestExtent(),
    aspectRatio: finalAspectRatio,
    symmetryError: finalSymmetryError,
    allAttachmentEventsD6h,
    allRelaxationsConverged,
    simTimeSeconds: solver.simTimeSeconds,
    wallSeconds: activeWallSeconds(),
    peakRssBytes,
    maxKineticFillIncrement,
    maxDivergenceResidual,
    maxAbsSmootherDrift,
    smootherDriftAbsLimit: maximumSmootherDriftAbsLimit,
    minShellInjection: finiteMinimum(minShellInjection),
    minSurfaceExchange: finiteMinimum(minSurfaceExchange),
    fillLedger: solver.fillLedger,
    saturationClippedFill: solver.saturationClippedFill,
    holeFillDeficit: solver.holeFillDeficit,
    holeFillCountTotal: solver.holeFillCountTotal,
    integrityErrors,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    gitHead: head,
    node: process.version,
    ...(options.maxWallSeconds === undefined ? {} : {
      executionBudget: {
        maxWallSeconds: options.maxWallSeconds,
        stoppedAt: budgetStoppedAt,
        completedCycles: completedCycleRecords,
        interruptedRelaxation,
        timelineEventReached: timelineSchedule === null ? null : timelineTransition !== undefined,
      },
    }),
    ...(candidate.spatialSampleExtents === undefined ? {} : { spatialSnapshots }),
    ...(timelineSchedule === null || timelineCursor === null || timelineTransition === undefined
      ? {}
      : {
          timeline: {
            schedule: timelineSchedule,
            eventLog: timelineCursor.eventLog,
            eventCycle: timelineTransition.eventCycle,
            transitionReport: timelineTransition.transitionReport,
          },
        }),
  };
  writeJson(resolve(output, "result.json"), result);
  options.heartbeat?.(
    `finish row=${candidate.id}${experimentLabel} stop=${stopReason} cycles=${result.cycles} ` +
      `attached=${result.attachedCount} extent=${result.extent} wall=${result.wallSeconds}s`,
  );
  return result;
}

export function readDiscoveryResult(path: string): DiscoveryTerminalResult {
  const value = JSON.parse(readFileSync(path, "utf8")) as DiscoveryTerminalResult;
  if (value.schema !== "post-phase10-discovery-result-v1") {
    throw new Error(`not a post-Phase-10 discovery result: ${path}`);
  }
  return value;
}

export const POST_PHASE10_SMOKE_ROWS: readonly DiscoveryRow[] = Object.freeze([
  row({
    id: "smoke-m1",
    lane: "C",
    conditional: false,
    tempC: -5,
    fraction: 0.15,
    sigmaInfinity: 0.0075,
    paramSet: "M1",
    dimsN: 16,
    dxUm: 0.35,
    cflFill: 0.1,
    seedRadius: 1,
    seedThickness: 1,
    targetExtent: 3,
    maxSteps: 1,
  }),
  row({
    id: "smoke-nodip",
    lane: "C",
    conditional: false,
    tempC: -5,
    fraction: 0.15,
    sigmaInfinity: 0.0075,
    paramSet: "M1_NO_DIP_ABLATION",
    dimsN: 16,
    dxUm: 0.35,
    cflFill: 0.1,
    seedRadius: 1,
    seedThickness: 1,
    targetExtent: 3,
    maxSteps: 1,
  }),
]);
