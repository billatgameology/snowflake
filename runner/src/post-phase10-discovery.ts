import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, totalmem, arch, platform, release } from "node:os";
import { resolve } from "node:path";
import {
  aspectRatio,
  coordsOf,
  domainCenter,
  isD6hInvariantSet,
  symmetryError,
  type FacetClass,
  type NucleationParamSet,
} from "@vcc/core";
import { float64SmootherDriftAbsLimit, LKSolver } from "@vcc/solver-cpu";
import { validateLKStepEvidence } from "./gate2b-validation.ts";

export type DiscoveryLane =
  | "A"
  | "B"
  | "C"
  | "adaptive-map"
  | "adaptive-pressure"
  | "adaptive-seed";

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
}

export type DiscoveryStopReason =
  | "size-target"
  | "domain-contact"
  | "unconverged"
  | "stalled"
  | "step-cap"
  | "solver-error";

export type DiscoveryHabitClass = "plate" | "neutral" | "column" | "invalid";

export interface DiscoveryTerminalResult {
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

function summarizeBoundary(solver: LKSolver): {
  readonly summary: BoundarySummary;
  readonly facetByIndex: ReadonlyMap<number, FacetClass>;
} {
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
  readonly heartbeat?: (message: string) => void;
}

export function runPostPhase10DiscoveryRow(
  candidate: DiscoveryRow,
  outputDirectory: string,
  options: RunDiscoveryRowOptions = {},
): DiscoveryTerminalResult {
  const output = resolve(outputDirectory);
  mkdirSync(output, { recursive: true });
  for (const leaf of ["spec.json", "events.jsonl", "result.json"] as const) {
    if (existsSync(resolve(output, leaf))) {
      throw new Error(`discovery row output already exists: ${resolve(output, leaf)}`);
    }
  }

  const head = gitHead();
  writeJson(resolve(output, "spec.json"), {
    schema: "post-phase10-discovery-row-v1",
    row: candidate,
    fixed: FIXED,
    effectivePressurePa: candidate.pressurePa ?? FIXED.pressurePa,
  });
  writeJson(resolve(output, "host.json"), hostRecord(head));

  const startedAt = new Date();
  let peakRssBytes = process.memoryUsage().rss;
  let totalSweeps = 0;
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
  const solver = new LKSolver({
    surfacePolicy: FIXED.surfacePolicy,
    dims,
    tempC: candidate.tempC,
    sigmaInfinity: candidate.sigmaInfinity,
    dxUm: candidate.dxUm,
    pressurePa: candidate.pressurePa ?? FIXED.pressurePa,
    paramSet: candidate.paramSet,
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
  const seedSites = solver.attachedCount;
  const smootherDriftAbsLimit = float64SmootherDriftAbsLimit(
    solver.activeCellCount,
    candidate.sigmaInfinity,
  );
  let lastHeartbeat = Date.now();
  options.heartbeat?.(
    `start row=${candidate.id} lane=${candidate.lane} dims=${candidate.dimsN} ` +
      `paramSet=${candidate.paramSet} pressurePa=${solver.pressurePa} ` +
      `target=${candidate.targetExtent}`,
  );

  try {
    for (let cycle = 1; cycle <= candidate.maxSteps; cycle++) {
      const relaxation = solver.relaxField((progress) => {
        const now = Date.now();
        if (now - lastHeartbeat < 60_000) return;
        options.heartbeat?.(
          `relax row=${candidate.id} cycle=${cycle} sweeps=${progress.sweeps} ` +
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

      const boundary = summarizeBoundary(solver);
      const fillBefore = solver.fillLedger;
      const clippedBefore = solver.saturationClippedFill;
      const holeDeficitBefore = solver.holeFillDeficit;
      const surface = solver.advanceSurface();
      if (surface.stalled) {
        stopReason = "stalled";
      } else {
        const validated = validateLKStepEvidence(
          relaxation,
          surface,
          FIXED.relaxTol,
          FIXED.divTol,
          FIXED.surfacePolicy,
          smootherDriftAbsLimit,
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
      const extent = solver.largestExtent();
      const rssBytes = process.memoryUsage().rss;
      peakRssBytes = Math.max(peakRssBytes, rssBytes);
      const cycleRecord = {
        schema: "post-phase10-discovery-cycle-v1",
        rowId: candidate.id,
        cycle: solver.tick,
        relaxation,
        boundary: boundary.summary,
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
        rssBytes,
      };
      appendFileSync(
        resolve(output, "events.jsonl"),
        `${JSON.stringify(cycleRecord)}\n`,
        "utf8",
      );
      writeJson(resolve(output, "status.json"), {
        schema: "post-phase10-discovery-status-v1",
        rowId: candidate.id,
        cycle: solver.tick,
        attachedCount: solver.attachedCount,
        extent,
        totalSweeps,
        simTimeSeconds: solver.simTimeSeconds,
        wallSeconds: (Date.now() - startedAt.getTime()) / 1000,
        peakRssBytes,
        updatedAt: new Date().toISOString(),
      });

      const now = Date.now();
      if (now - lastHeartbeat >= 60_000 || cycle === 1) {
        options.heartbeat?.(
          `cycle row=${candidate.id} tick=${solver.tick} attached=${solver.attachedCount} ` +
            `extent=${extent} aspectRatio=${currentAspectRatio} sweeps=${relaxation.sweeps}`,
        );
        lastHeartbeat = now;
      }
      if (surface.stalled) break;
      if (solver.domainContact()) {
        stopReason = "domain-contact";
        break;
      }
      if (extent >= candidate.targetExtent) {
        stopReason = "size-target";
        break;
      }
    }
  } catch (error) {
    stopReason = "solver-error";
    integrityErrors.push(error instanceof Error ? error.stack ?? error.message : String(error));
  }

  const finishedAt = new Date();
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
    wallSeconds: (finishedAt.getTime() - startedAt.getTime()) / 1000,
    peakRssBytes,
    maxKineticFillIncrement,
    maxDivergenceResidual,
    maxAbsSmootherDrift,
    smootherDriftAbsLimit,
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
  };
  writeJson(resolve(output, "result.json"), result);
  options.heartbeat?.(
    `finish row=${candidate.id} stop=${stopReason} cycles=${result.cycles} ` +
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
