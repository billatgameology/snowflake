// Phase 4 Pass A runner acceptance tests. These tests exercise the frozen registration and
// evidence validators on synthetic raw states; they never launch the hours-scale gate4a run.

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import {
  DOMAIN_CONTACT_FRACTION,
  STREAM_NOISE_XI,
  cellCount,
  computeMetrics,
  domainCenter,
  encodeCheckpoint,
  ggParamsFromTimelineEnvironment,
  hexDistance,
  hexSeedSites,
  idx,
  isD6hInvariantSet,
  latticeExtents,
  type Dims,
  type LatticeExtents,
} from "@vcc/core";
import {
  canonicalJson,
  canonicalJsonBytes,
  canonicalJsonSha256,
  sha256Bytes,
  strictJsonSnapshot,
  type EvidenceArtifactInput,
  type PublishedEvidenceBundle,
} from "../src/gate4-evidence.ts";
import {
  evaluateGGNoiseWitness,
  independentGGDiffusion,
  type GGNoiseWitness,
} from "../src/gate4a-reference.ts";
import {
  GATE4A_CADENCE_FREEZE,
  GATE4A_CRITERIA_FREEZE,
  GATE4A_FAR_FIELD_CADENCE,
  GATE4A_MANIFEST_SHA256,
  GATE4A_NODE,
  GATE4A_PROTOCOL,
  GATE4A_REPORT_PATH,
  GATE4A_RUNNER_FREEZE,
  GATE4A_V8,
  GATE4A_V2_CRITERIA_FREEZE,
  GATE4A_GG_SOURCE_SHA256,
  GATE4A_LK_SOURCE_SHA256,
  buildGate4AArtifacts,
  buildGate4AManifest,
  deriveGate4AExecutionRecords,
  deriveGate4AFarFieldSupport,
  executeGate4ARun,
  formatGate4ATerminalPresentation,
  gate4ANoiseRunEvidenceValid,
  gate4ASeriesCsv,
  gate4ATimelineEvidenceValid,
  publishGate4ABundle,
  runGate4A,
  validateGate4AArtifacts,
  validateGate4AFarFieldWitness,
  validateGate4AProvenance,
  validateGate4ASeriesCsv,
  verifyGate4ACheckpoint,
  type Gate4ACycleRow,
  type Gate4ADeltaWitness,
  type Gate4AManifest,
  type Gate4AProvenance,
  type Gate4ARunConfig,
  type Gate4ARunOutcome,
  type Gate4ARunResult,
} from "../src/gate4a.ts";
import type { AExecutionCriterion } from "../src/gate4-protocol.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const main = join(repoRoot, "runner", "src", "main.ts");

// This suite is minutes of back-to-back synchronous CPU work, which starves the vitest
// worker RPC channel until its 60s call timeout reports a spurious unhandled error.
// Yield one macrotask per test so queued channel responses are delivered.
beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
});

function passingProvenance(): Gate4AProvenance {
  return {
    node: GATE4A_NODE,
    v8: GATE4A_V8,
    head: "a".repeat(40),
    trackedStatus: "",
    criteriaFreezeIsAncestor: true,
    runnerFreezeIsAncestor: true,
    cadenceFreezeIsAncestor: true,
    v2CriteriaFreezeIsAncestor: true,
  };
}

const encoder = new TextEncoder();
const EMPTY_DELTA_SHA256 = sha256Bytes(new Uint8Array(0));

function wallMask(dims: Dims): Uint8Array {
  const wall = new Uint8Array(cellCount(dims));
  const [ic, jc, kc] = domainCenter(dims);
  const radius = Math.min(ic, dims.nx - 1 - ic, jc, dims.ny - 1 - jc);
  const halfZ = Math.min(kc, dims.nz - 1 - kc);
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

function prism(dims: Dims, radius: number, thickness: number): Uint8Array {
  const a = new Uint8Array(cellCount(dims));
  const [ic, jc, kc] = domainCenter(dims);
  const half = (thickness - 1) / 2;
  for (let k = kc - half; k <= kc + half; k++) {
    for (let dj = -radius; dj <= radius; dj++) {
      for (let di = -radius; di <= radius; di++) {
        if (hexDistance(di, dj) <= radius) a[idx(dims, ic + di, jc + dj, k)] = 1;
      }
    }
  }
  return a;
}

function initialSeed(dims: Dims): Uint8Array {
  const a = new Uint8Array(cellCount(dims));
  for (const site of hexSeedSites(dims, 2, 1, domainCenter(dims))) a[site] = 1;
  return a;
}

function finalFields(config: Gate4ARunConfig, a: Uint8Array): {
  readonly b: Float64Array;
  readonly d: Float64Array;
  readonly wall: Uint8Array;
} {
  const wall = wallMask(config.dims);
  const seed = initialSeed(config.dims);
  const b = new Float64Array(a.length);
  const d = new Float64Array(a.length);
  for (let index = 0; index < a.length; index++) {
    if (a[index] === 1) b[index] = seed[index] === 1 ? 1 : config.params.rho;
    else if (wall[index] === 0) d[index] = config.params.rho;
  }
  return { b, d, wall };
}

function difference(next: Uint8Array, previous: Uint8Array): number[] {
  const result: number[] = [];
  for (let index = 0; index < next.length; index++) {
    if (next[index] === 1 && previous[index] === 0) result.push(index);
  }
  return result;
}

function deltaSha256(indices: readonly number[]): string {
  const bytes = new Uint8Array(indices.length * 4);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < indices.length; index++) view.setUint32(index * 4, indices[index], true);
  return sha256Bytes(bytes);
}

function cycleRow(
  config: Gate4ARunConfig,
  cycle: number,
  occupancy: Uint8Array,
  totalMass: number,
  delta: readonly number[],
  farFieldMean: number | null,
): Gate4ACycleRow {
  const extents = latticeExtents(occupancy, config.dims) as LatticeExtents;
  return {
    cycle,
    ...extents,
    totalMass,
    relativeMassDrift: 0,
    domainContact: extents.iExtent > DOMAIN_CONTACT_FRACTION * config.dims.nx ||
      extents.jExtent > DOMAIN_CONTACT_FRACTION * config.dims.ny ||
      extents.zExtent > DOMAIN_CONTACT_FRACTION * config.dims.nz,
    farFieldObserved: cycle % GATE4A_FAR_FIELD_CADENCE === 0,
    farFieldMean,
    deltaCount: delta.length,
    deltaSha256: delta.length === 0 ? EMPTY_DELTA_SHA256 : deltaSha256(delta),
    deltaSymmetric: config.noiseEpsilon > 0
      ? null
      : isD6hInvariantSet(delta, config.dims, domainCenter(config.dims)),
    relaxationValid: true,
    surfaceValid: true,
    stateFinite: true,
  };
}

function noiseWitness(
  config: Gate4ARunConfig,
  options: {
    readonly dims?: Dims;
    readonly tick?: number;
    readonly phi?: number;
    readonly mutatePreD?: (
      preD: Float64Array,
      a: Uint8Array,
      wall: Uint8Array,
    ) => void;
    readonly mutateWall?: (
      wall: Uint8Array,
      preD: Float64Array,
      a: Uint8Array,
    ) => void;
  } = {},
): GGNoiseWitness {
  const dims = options.dims ?? config.dims;
  const n = cellCount(dims);
  const a = initialSeed(dims);
  const wall = wallMask(dims);
  const preD = new Float64Array(n);
  for (let index = 0; index < n; index++) {
    if (a[index] === 0 && wall[index] === 0) preD[index] = config.params.rho;
  }
  options.mutatePreD?.(preD, a, wall);
  options.mutateWall?.(wall, preD, a);
  const tick = options.tick ?? 0;
  const phi = options.phi ?? config.params.phi;
  const reference = independentGGDiffusion({
    dims,
    a,
    wall,
    d: preD,
    phi,
    noiseEpsilon: config.noiseEpsilon,
    rngSeed: config.rngSeed,
    tick,
    streamId: STREAM_NOISE_XI,
  });
  const witness: GGNoiseWitness = {
    version: 1,
    dims,
    tick,
    rngSeed: config.rngSeed,
    noiseEpsilon: config.noiseEpsilon,
    streamId: STREAM_NOISE_XI,
    phi,
    a,
    wall,
    preD,
    postD: reference.d,
  };
  if (!evaluateGGNoiseWitness(witness).passed) throw new Error("synthetic noise witness is vacuous");
  return witness;
}

function finalOccupancy(config: Gate4ARunConfig): Uint8Array {
  if (config.scenario === "habit") return prism(config.dims, 7, 1);
  if (config.scenario === "depletion" || config.scenario === "hollow") {
    return prism(config.dims, 2, 37);
  }
  if (config.scenario === "timeline") return prism(config.dims, 2, 25);
  return prism(config.dims, 10, 1);
}

function makeRunResult(config: Gate4ARunConfig): Gate4ARunResult {
  const initialOccupancy = initialSeed(config.dims);
  const finalA = finalOccupancy(config);
  const fields = finalFields(config, finalA);
  const isFarField = config.stop.kind === "farField";
  const crossingFarFieldMean = isFarField ? config.params.rho / 2 : null;
  const farFieldSupport = deriveGate4AFarFieldSupport(config.dims);
  if (isFarField) {
    for (const cell of farFieldSupport) {
      if (finalA[cell] === 0) fields.d[cell] = crossingFarFieldMean as number;
    }
  }
  const finalMetrics = computeMetrics(
    finalA,
    fields.b,
    fields.d,
    config.dims,
    domainCenter(config.dims),
    isFarField ? GATE4A_FAR_FIELD_CADENCE : 1,
    crossingFarFieldMean ?? config.params.rho,
    fields.wall,
  );
  const totalMass = finalMetrics.totalMass;
  const rows: Gate4ACycleRow[] = [];
  const deltas: Gate4ADeltaWitness[] = [];
  let previousOccupancy: Uint8Array | null = null;
  let extentCrossing = null;
  let farFieldCrossing = null;
  let timeline = null;

  if (isFarField) {
    let cycleOneOccupancy = finalA;
    if (config.scenario === "timeline") cycleOneOccupancy = prism(config.dims, 2, 23);
    const firstDelta = difference(cycleOneOccupancy, initialOccupancy);
    rows.push(cycleRow(config, 1, cycleOneOccupancy, totalMass, firstDelta, null));
    if (firstDelta.length > 0) deltas.push({ cycle: 1, indices: firstDelta });
    if (config.scenario === "timeline") {
      const secondDelta = difference(finalA, cycleOneOccupancy);
      rows.push(cycleRow(config, 2, finalA, totalMass, secondDelta, null));
      if (secondDelta.length > 0) deltas.push({ cycle: 2, indices: secondDelta });
    }
    for (let cycle = rows.length + 1; cycle <= GATE4A_FAR_FIELD_CADENCE; cycle++) {
      rows.push(cycleRow(
        config,
        cycle,
        finalA,
        totalMass,
        [],
        cycle === GATE4A_FAR_FIELD_CADENCE ? crossingFarFieldMean : null,
      ));
    }
    farFieldCrossing = {
      previousObservedCycle: 0,
      previousMean: config.params.rho,
      crossingObservedCycle: GATE4A_FAR_FIELD_CADENCE,
      crossingMean: crossingFarFieldMean as number,
      threshold: (2 * config.params.rho) / 3,
    };
    if (config.scenario === "timeline") {
      const previousExtents = latticeExtents(prism(config.dims, 2, 23), config.dims) as LatticeExtents;
      const crossingExtents = latticeExtents(finalA, config.dims) as LatticeExtents;
      const schedule = config.schedule as NonNullable<Gate4ARunConfig["schedule"]>;
      timeline = {
        schedule,
        eventLog: [{
          eventIndex: 0,
          operator: "GGThreshold" as const,
          trigger: { kind: "zExtent" as const, value: 25 },
          previousBoundary: {
            phase: "afterInterfaceStep" as const,
            completedCycles: 1,
            extents: previousExtents,
          },
          crossingBoundary: {
            phase: "afterInterfaceStep" as const,
            completedCycles: 2,
            extents: crossingExtents,
          },
          beforeEnvironment: schedule.initialEnvironment,
          afterEnvironment: schedule.events[0].environment,
        }],
        transitionReports: [strictJsonSnapshot({
          operator: "GGThreshold",
          boundary: {
            phase: "completedCycleBoundary",
            completedCycles: 2,
            tick: 2,
          },
          beforeEnvironment: schedule.initialEnvironment,
          afterEnvironment: schedule.events[0].environment,
        })],
        beforeFieldHash: "b".repeat(64),
        afterFieldHash: "b".repeat(64),
        beforeMass: totalMass,
        afterMass: totalMass,
        eventAspectRatio: finalMetrics.aspectRatio,
        eventZExtent: crossingExtents.zExtent,
      };
    }
  } else {
    const delta = difference(finalA, initialOccupancy);
    rows.push(cycleRow(config, 1, finalA, totalMass, delta, null));
    if (delta.length > 0) deltas.push({ cycle: 1, indices: delta });
    previousOccupancy = initialOccupancy.slice();
    extentCrossing = {
      previousCycle: 0,
      crossingCycle: 1,
      previousExtents: latticeExtents(initialOccupancy, config.dims) as LatticeExtents,
      crossingExtents: latticeExtents(finalA, config.dims) as LatticeExtents,
    };
  }

  const witness = config.noiseEpsilon > 0 ? noiseWitness(config) : null;
  const finalEnvironment = timeline === null
    ? config.params
    : timeline.eventLog[0].afterEnvironment;
  const checkpoint = encodeCheckpoint({
    dims: config.dims,
    tick: rows.length,
    rngSeed: config.rngSeed,
    noiseEpsilon: config.noiseEpsilon,
    farField: config.farField,
    domain: config.domain,
    params: ggParamsFromTimelineEnvironment(finalEnvironment),
    a: finalA,
    b: fields.b,
    d: fields.d,
    center: domainCenter(config.dims),
  }, { ...finalMetrics, tick: rows.length });
  const metrics = { ...finalMetrics, tick: rows.length };
  const farFieldValues: number[] = [];
  for (const cell of farFieldSupport) farFieldValues.push(config.params.rho);
  if (isFarField) {
    for (const cell of farFieldSupport) farFieldValues.push(fields.d[cell]);
  }
  return {
    config,
    registeredConfigSha256: canonicalJsonSha256(config),
    executionId: sha256Bytes(encoder.encode(`${config.id}:synthetic-execution`)),
    initialOccupancy,
    initialMass: totalMass,
    seedSymmetric: true,
    rows,
    deltas,
    depletionSamples: [],
    stopReason: isFarField ? "far-field" : "size-target",
    extentCrossing,
    farFieldCrossing,
    farFieldWitness: {
      supportIndices: farFieldSupport,
      sampleCycles: isFarField ? [0, GATE4A_FAR_FIELD_CADENCE] : [0],
      values: Float64Array.from(farFieldValues),
    },
    previousOccupancy,
    finalA,
    finalB: fields.b,
    finalD: fields.d,
    finalMetrics: metrics,
    checkpoint,
    noiseWitness: witness,
    noiseVerdict: witness === null ? null : evaluateGGNoiseWitness(witness),
    timeline,
  };
}

function timelineCrossingAtCycleOne(result: Gate4ARunResult): Gate4ARunResult {
  if (result.timeline === null || result.config.schedule === null) {
    throw new Error("cycle-1 timeline fixture requires a registered schedule");
  }
  const delta = difference(result.finalA, result.initialOccupancy);
  const totalMass = result.rows[0].totalMass;
  const rows = result.rows.map((row, index) => {
    if (index === 0) return cycleRow(result.config, 1, result.finalA, totalMass, delta, null);
    if (index === 1) return cycleRow(result.config, 2, result.finalA, totalMass, [], null);
    return row;
  });
  const crossingExtents = latticeExtents(result.finalA, result.config.dims) as LatticeExtents;
  const entry = result.timeline.eventLog[0];
  return {
    ...result,
    rows,
    deltas: [{ cycle: 1, indices: delta }],
    timeline: {
      ...result.timeline,
      eventLog: [{
        ...entry,
        previousBoundary: { phase: "initial", completedCycles: 0 },
        crossingBoundary: {
          phase: "afterInterfaceStep",
          completedCycles: 1,
          extents: crossingExtents,
        },
      }],
      transitionReports: [strictJsonSnapshot({
        operator: "GGThreshold",
        boundary: { phase: "completedCycleBoundary", completedCycles: 1, tick: 1 },
        beforeEnvironment: entry.beforeEnvironment,
        afterEnvironment: entry.afterEnvironment,
      })],
      eventAspectRatio: result.finalMetrics.aspectRatio,
      eventZExtent: crossingExtents.zExtent,
    },
  };
}

function rebuildFinalState(
  result: Gate4ARunResult,
  changes: {
    readonly finalA?: Uint8Array;
    readonly finalB?: Float64Array;
    readonly finalD?: Float64Array;
    readonly rows?: readonly Gate4ACycleRow[];
    readonly deltas?: readonly Gate4ADeltaWitness[];
    readonly extentCrossing?: Gate4ARunResult["extentCrossing"];
    readonly previousOccupancy?: Uint8Array | null;
  },
): Gate4ARunResult {
  const finalA = changes.finalA ?? result.finalA;
  const finalB = changes.finalB ?? result.finalB;
  const finalD = changes.finalD ?? result.finalD;
  const rows = changes.rows ?? result.rows;
  const wall = wallMask(result.config.dims);
  const farField = rows.at(-1)?.farFieldMean ?? result.config.params.rho;
  const finalMetrics = computeMetrics(
    finalA,
    finalB,
    finalD,
    result.config.dims,
    domainCenter(result.config.dims),
    rows.length,
    farField,
    wall,
  );
  const massRows = rows.map((row) => ({ ...row, totalMass: finalMetrics.totalMass }));
  const finalEnvironment = (
    result.timeline?.eventLog.at(-1)?.afterEnvironment ?? result.config.params
  ) as Gate4ARunConfig["params"];
  const checkpoint = encodeCheckpoint({
    dims: result.config.dims,
    tick: massRows.length,
    rngSeed: result.config.rngSeed,
    noiseEpsilon: result.config.noiseEpsilon,
    farField: result.config.farField,
    domain: result.config.domain,
    params: ggParamsFromTimelineEnvironment(finalEnvironment),
    a: finalA,
    b: finalB,
    d: finalD,
    center: domainCenter(result.config.dims),
  }, finalMetrics);
  return {
    ...result,
    initialMass: finalMetrics.totalMass,
    rows: massRows,
    deltas: changes.deltas ?? result.deltas,
    extentCrossing: changes.extentCrossing ?? result.extentCrossing,
    previousOccupancy: changes.previousOccupancy === undefined
      ? result.previousOccupancy
      : changes.previousOccupancy,
    finalA,
    finalB,
    finalD,
    finalMetrics,
    checkpoint,
  };
}

function sizeResultWithOccupancy(result: Gate4ARunResult, finalA: Uint8Array): Gate4ARunResult {
  const initial = initialSeed(result.config.dims);
  const delta = difference(finalA, initial);
  const fields = finalFields(result.config, finalA);
  const provisional = cycleRow(result.config, 1, finalA, 1, delta, null);
  const crossingExtents = latticeExtents(finalA, result.config.dims) as LatticeExtents;
  return rebuildFinalState(result, {
    finalA,
    finalB: fields.b,
    finalD: fields.d,
    rows: [provisional],
    deltas: delta.length === 0 ? [] : [{ cycle: 1, indices: delta }],
    extentCrossing: {
      previousCycle: 0,
      crossingCycle: 1,
      previousExtents: latticeExtents(initial, result.config.dims) as LatticeExtents,
      crossingExtents,
    },
    previousOccupancy: initial,
  });
}

interface PassingFixture {
  readonly manifest: Gate4AManifest;
  readonly results: readonly Gate4ARunResult[];
  readonly artifacts: readonly EvidenceArtifactInput[];
}

let cachedFixture: PassingFixture | undefined;

function passingFixture(): PassingFixture {
  if (cachedFixture !== undefined) return cachedFixture;
  const manifest = buildGate4AManifest();
  const results = manifest.runs.map(makeRunResult);
  const artifacts = buildGate4AArtifacts(manifest, results);
  cachedFixture = { manifest, results, artifacts };
  return cachedFixture;
}

function executionRecords(
  changes: Partial<PassingFixture> & { readonly provenance?: Gate4AProvenance } = {},
) {
  const fixture = passingFixture();
  return deriveGate4AExecutionRecords({
    manifest: changes.manifest ?? fixture.manifest,
    results: changes.results ?? fixture.results,
    artifacts: changes.artifacts ?? fixture.artifacts,
    provenance: changes.provenance ?? passingProvenance(),
    sourceHashes: {
      gg: GATE4A_GG_SOURCE_SHA256,
      lk: GATE4A_LK_SOURCE_SHA256,
    },
  });
}

function replaceResult(
  id: string,
  replace: (result: Gate4ARunResult) => Gate4ARunResult,
): readonly Gate4ARunResult[] {
  return passingFixture().results.map((result) => result.config.id === id ? replace(result) : result);
}

function expectOnlyFailure(
  criterion: AExecutionCriterion,
  changes: Partial<PassingFixture> & { readonly provenance?: Gate4AProvenance },
): void {
  expect(executionRecords(changes).filter((record) => !record.passed).map((record) => record.criterion))
    .toEqual([criterion]);
}

interface SerialOrchestrationFixture {
  readonly outcome: Gate4ARunOutcome;
  readonly calls: readonly string[];
  readonly publishCalls: number;
}

let cachedSerialOrchestration: SerialOrchestrationFixture | undefined;

function serialOrchestrationFixture(): SerialOrchestrationFixture {
  if (cachedSerialOrchestration !== undefined) return cachedSerialOrchestration;
  const fixture = passingFixture();
  const byId = new Map(fixture.results.map((result) => [result.config.id, result]));
  const calls: string[] = [];
  let publishCalls = 0;
  const outcome = runGate4A({
    collectProvenance: passingProvenance,
    collectSourceHashes: () => ({
      gg: GATE4A_GG_SOURCE_SHA256,
      lk: GATE4A_LK_SOURCE_SHA256,
    }),
    executeRun: (config) => {
      calls.push(config.id);
      return byId.get(config.id) as Gate4ARunResult;
    },
    publish: () => {
      publishCalls++;
      throw new Error("a failed gate must not publish");
    },
  });
  cachedSerialOrchestration = { outcome, calls, publishCalls };
  return cachedSerialOrchestration;
}

/** An honest in-memory mirror of what the shared publisher records for these artifacts. */
function syntheticPublication(outcome: Gate4ARunOutcome): PublishedEvidenceBundle {
  const payloadDescriptors = [...outcome.artifacts]
    .map((artifact) => ({
      path: artifact.path,
      kind: artifact.kind,
      byteLength: artifact.bytes.byteLength,
      sha256: sha256Bytes(artifact.bytes),
    }))
    .sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
  const report = {
    version: 1 as const,
    protocol: GATE4A_PROTOCOL,
    pass: "A",
    operator: "GGThreshold",
    artifacts: payloadDescriptors,
    payload: strictJsonSnapshot({ synthetic: true }),
  };
  const reportBytes = canonicalJsonBytes(report);
  const reportDescriptor = {
    path: GATE4A_REPORT_PATH,
    kind: "phase4-evidence-report+json",
    byteLength: reportBytes.byteLength,
    sha256: sha256Bytes(reportBytes),
  };
  return {
    directory: "/synthetic/pass-a",
    report,
    index: {
      version: 1,
      publication: "complete",
      report: reportDescriptor,
      artifacts: [reportDescriptor, ...payloadDescriptors],
    },
  };
}

describe("gate4a frozen registration", () => {
  it("registers the exact 13-run Pass-A matrix and caps", () => {
    const manifest = buildGate4AManifest();
    expect(manifest.criteriaFreezes).toEqual([
      GATE4A_CRITERIA_FREEZE,
      GATE4A_RUNNER_FREEZE,
      GATE4A_CADENCE_FREEZE,
      GATE4A_V2_CRITERIA_FREEZE,
    ]);
    expect(manifest.version).toBe(2);
    expect(manifest.protocol).toBe("phase4-pass-a-v2");
    expect(manifest.runs).toHaveLength(13);
    expect(manifest.runs.map((run) => run.id)).toEqual([
      "A-HABIT-U0",
      "A-HABIT-U0P25",
      "A-HABIT-U0P5",
      "A-HABIT-U0P75",
      "A-HABIT-U1",
      "A-DEPLETION",
      "A-HOLLOW-SEED-1",
      "A-HOLLOW-SEED-2",
      "A-HOLLOW-SEED-3",
      "A-HOLLOW-SEED-1-REPLAY",
      "A-TIMELINE",
      "A-BRANCH-DENDRITE",
      "A-BRANCH-COMPARATOR",
    ]);
    expect(manifest.runs.map((run) => run.stop.cap)).toEqual([
      12_000, 12_000, 12_000, 12_000, 12_000,
      12_000, 12_000, 12_000, 12_000, 12_000,
      10_000, 12_000, 12_000,
    ]);
    expect(manifest.runs.every((run) => run.farFieldCadence === GATE4A_FAR_FIELD_CADENCE))
      .toBe(true);
    expect(manifest.runs.filter((run) => run.noiseEpsilon > 0).map((run) => run.id)).toEqual([
      "A-HOLLOW-SEED-1",
      "A-HOLLOW-SEED-2",
      "A-HOLLOW-SEED-3",
      "A-HOLLOW-SEED-1-REPLAY",
    ]);
    expect(manifest.runs.find((run) => run.id === "A-TIMELINE")?.schedule?.events)
      .toHaveLength(1);
    expect(manifest.runs.slice(-2).map((run) => run.stop)).toEqual([
      { kind: "farField", cap: 12_000 },
      { kind: "farField", cap: 12_000 },
    ]);
    expect(GATE4A_MANIFEST_SHA256)
      .toBe("e5e85c70d377e90dcca2974579122e67417c60fd2c11683276f528615e608644");
  });

  it("derives far-field capture support independently in increasing flat-index order", () => {
    const dims = buildGate4AManifest().runs.at(-1)?.dims as Dims;
    const support = deriveGate4AFarFieldSupport(dims);
    const [ic, jc, kc] = domainCenter(dims);
    const radius = Math.min(ic, dims.nx - 1 - ic, jc, dims.ny - 1 - jc);
    const halfZ = Math.min(kc, dims.nz - 1 - kc);
    expect([...support].every((cell, index) => index === 0 || support[index - 1] < cell)).toBe(true);
    expect([...support].every((cell) => {
      const k = Math.floor(cell / (dims.nx * dims.ny));
      const planeIndex = cell - k * dims.nx * dims.ny;
      const j = Math.floor(planeIndex / dims.nx);
      const i = planeIndex - j * dims.nx;
      const distance = hexDistance(i - ic, j - jc);
      return distance <= radius && Math.abs(k - kc) <= halfZ &&
        (distance === radius || Math.abs(k - kc) === halfZ);
    })).toBe(true);
  });
});

describe("gate4a provenance preflight", () => {
  it("accepts only the exact v2 key set, engine, clean tracked state, 40-hex HEAD, and all four ancestors", () => {
    expect(validateGate4AProvenance(passingProvenance())).toEqual([]);
    const controls: Gate4AProvenance[] = [
      { ...passingProvenance(), node: "v24.13.0" },
      { ...passingProvenance(), v8: "shifted" },
      { ...passingProvenance(), head: "a".repeat(39) },
      { ...passingProvenance(), trackedStatus: " M runner/src/gate4a.ts" },
      { ...passingProvenance(), criteriaFreezeIsAncestor: false },
      { ...passingProvenance(), runnerFreezeIsAncestor: false },
      { ...passingProvenance(), cadenceFreezeIsAncestor: false },
      { ...passingProvenance(), v2CriteriaFreezeIsAncestor: false },
      (() => {
        const value = { ...passingProvenance() } as Record<string, unknown>;
        delete value.v2CriteriaFreezeIsAncestor;
        return value as unknown as Gate4AProvenance;
      })(),
      { ...passingProvenance(), unexpected: true } as Gate4AProvenance,
    ];
    for (const control of controls) expect(validateGate4AProvenance(control)).not.toEqual([]);
  });
});

describe("gate4a CLI is flagless and fail-closed", () => {
  it("rejects every supplied flag with exit 2 before starting evidence work", () => {
    const result = spawnSync(process.execPath, [main, "gate4a", "--anything"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("gate4a takes no flags");
  });
});

describe("gate4a derives all eight execution criteria from raw evidence", () => {
  it("passes the complete synthetic 13-run evidence matrix", () => {
    const records = executionRecords();
    expect(records).toHaveLength(8);
    expect(records.every((record) => record.passed)).toBe(true);
  });

  it("A-EXEC-PROVENANCE trips alone", () => {
    expectOnlyFailure("A-EXEC-PROVENANCE", {
      provenance: { ...passingProvenance(), head: "not-a-commit" },
    });
  });

  it("A-EXEC-CONFIG trips alone", () => {
    const results = replaceResult("A-HABIT-U0", (result) => ({
      ...result,
      registeredConfigSha256: "0".repeat(64),
    }));
    expectOnlyFailure("A-EXEC-CONFIG", {
      results,
      artifacts: buildGate4AArtifacts(passingFixture().manifest, results),
    });
  });

  it("A-EXEC-SYMMETRY trips alone on an internally consistent asymmetric delta", () => {
    const results = replaceResult("A-HABIT-U0", (result) => {
      const finalA = result.finalA.slice();
      const [ic, jc, kc] = domainCenter(result.config.dims);
      finalA[idx(result.config.dims, ic + 7, jc + 7, kc)] = 1;
      return sizeResultWithOccupancy(result, finalA);
    });
    expectOnlyFailure("A-EXEC-SYMMETRY", {
      results,
      artifacts: buildGate4AArtifacts(passingFixture().manifest, results),
    });
  });

  it("A-EXEC-SYMMETRY trips alone on asymmetric boundary/vapor bits with symmetric occupancy", () => {
    const results = replaceResult("A-HABIT-U0", (result) => {
      const finalB = result.finalB.slice();
      const finalD = result.finalD.slice();
      const [ic, jc, kc] = domainCenter(result.config.dims);
      const cell = idx(result.config.dims, ic + 10, jc, kc);
      expect(finalD[cell]).toBeGreaterThan(0);
      finalB[cell] = finalD[cell] / 2;
      finalD[cell] /= 2;
      return rebuildFinalState(result, { finalB, finalD });
    });
    expectOnlyFailure("A-EXEC-SYMMETRY", {
      results,
      artifacts: buildGate4AArtifacts(passingFixture().manifest, results),
    });
  });

  it("A-EXEC-NOISE trips alone", () => {
    const results = replaceResult("A-HOLLOW-SEED-2", (result) => ({
      ...result,
      noiseVerdict: result.noiseVerdict === null
        ? null
        : { ...result.noiseVerdict, passed: false },
    }));
    expectOnlyFailure("A-EXEC-NOISE", {
      results,
      artifacts: buildGate4AArtifacts(passingFixture().manifest, results),
    });
  });

  it.each([
    ["borrowed smaller witness", (config: Gate4ARunConfig) =>
      noiseWitness(config, { dims: { nx: 12, ny: 12, nz: 10 } })],
    ["shifted tick", (config: Gate4ARunConfig) => noiseWitness(config, { tick: 1 })],
    ["shifted phi", (config: Gate4ARunConfig) => noiseWitness(config, { phi: 0.125 })],
    ["shifted positive preD", (config: Gate4ARunConfig) => noiseWitness(config, {
      mutatePreD: (preD, a, wall) => {
        const cell = preD.findIndex((value, index) => value > 0 && a[index] === 0 && wall[index] === 0);
        if (cell < 0) throw new Error("fixture has no positive active vapor cell");
        preD[cell] /= 2;
      },
    })],
    ["shifted wall mask", (config: Gate4ARunConfig) => noiseWitness(config, {
      mutateWall: (wall, preD, a) => {
        const cell = preD.findIndex((value, index) => value > 0 && a[index] === 0 && wall[index] === 0);
        if (cell < 0) throw new Error("fixture has no active cell to mask");
        wall[cell] = 1;
        preD[cell] = 0;
      },
    })],
  ] as const)("A-EXEC-NOISE raw guard rejects run-disconnected evidence: %s", (_name, makeWitness) => {
    const results = replaceResult("A-HOLLOW-SEED-2", (result) => {
      const witness = makeWitness(result.config);
      return {
        ...result,
        noiseWitness: witness,
        noiseVerdict: evaluateGGNoiseWitness(witness),
      };
    });
    const changed = results.find((result) => result.config.id === "A-HOLLOW-SEED-2") as Gate4ARunResult;
    expect(() => buildGate4AArtifacts(passingFixture().manifest, [changed])).not.toThrow();
    expect(gate4ANoiseRunEvidenceValid(changed)).toBe(false);
  });

  it("A-EXEC-NOISE alone owns representative run-disconnected evidence", () => {
    const results = replaceResult("A-HOLLOW-SEED-2", (result) => {
      const witness = noiseWitness(result.config, { dims: { nx: 12, ny: 12, nz: 10 } });
      return {
        ...result,
        noiseWitness: witness,
        noiseVerdict: evaluateGGNoiseWitness(witness),
      };
    });
    expectOnlyFailure("A-EXEC-NOISE", {
      results,
      artifacts: buildGate4AArtifacts(passingFixture().manifest, results),
    });
  });

  it("A-EXEC-MASS trips alone", () => {
    const results = replaceResult("A-DEPLETION", (result) => ({
      ...result,
      rows: result.rows.map((row, index) => index === 0
        ? { ...row, relativeMassDrift: 1e-9 }
        : row),
    }));
    expectOnlyFailure("A-EXEC-MASS", {
      results,
      artifacts: buildGate4AArtifacts(passingFixture().manifest, results),
    });
  });

  it("A-EXEC-DOMAIN trips alone", () => {
    const results = replaceResult("A-DEPLETION", (result) => ({
      ...result,
      rows: result.rows.map((row, index) => index === 0 ? { ...row, domainContact: true } : row),
    }));
    expectOnlyFailure("A-EXEC-DOMAIN", {
      results,
      artifacts: buildGate4AArtifacts(passingFixture().manifest, results),
    });
  });

  it("A-EXEC-DOMAIN trips alone on a reconstructed contacting crystal", () => {
    const results = replaceResult("A-HABIT-U0", (result) =>
      sizeResultWithOccupancy(result, prism(result.config.dims, 21, 1))
    );
    expectOnlyFailure("A-EXEC-DOMAIN", {
      results,
      artifacts: buildGate4AArtifacts(passingFixture().manifest, results),
    });
  });

  it("A-EXEC-TERMINATION trips alone", () => {
    const results = replaceResult("A-HABIT-U0", (result) => ({
      ...result,
      stopReason: "step-cap",
    }));
    expectOnlyFailure("A-EXEC-TERMINATION", {
      results,
      artifacts: buildGate4AArtifacts(passingFixture().manifest, results),
    });
  });

  it.each([
    ["shifted threshold", (result: Gate4ARunResult): Gate4ARunResult => ({
      ...result,
      farFieldCrossing: result.farFieldCrossing === null
        ? null
        : { ...result.farFieldCrossing, threshold: result.farFieldCrossing.threshold + 0.001 },
    })],
    ["shifted cycle-0 mean", (result: Gate4ARunResult): Gate4ARunResult => ({
      ...result,
      farFieldCrossing: result.farFieldCrossing === null
        ? null
        : { ...result.farFieldCrossing, previousMean: result.farFieldCrossing.previousMean + 0.001 },
    })],
    ["far-field run carrying extent witness", (result: Gate4ARunResult): Gate4ARunResult => ({
      ...result,
      extentCrossing: {
        previousCycle: 0,
        crossingCycle: 1,
        previousExtents: latticeExtents(result.initialOccupancy, result.config.dims) as LatticeExtents,
        crossingExtents: latticeExtents(result.finalA, result.config.dims) as LatticeExtents,
      },
      previousOccupancy: result.initialOccupancy.slice(),
    })],
  ] as const)("A-EXEC-TERMINATION trips alone on %s", (_name, mutate) => {
    const results = replaceResult("A-BRANCH-DENDRITE", mutate);
    expectOnlyFailure("A-EXEC-TERMINATION", {
      results,
      artifacts: _name === "far-field run carrying extent witness"
        ? buildGate4AArtifacts(passingFixture().manifest, results)
        : passingFixture().artifacts,
    });
  });

  it("A-EXEC-TERMINATION rejects a size run carrying a far-field witness", () => {
    const results = replaceResult("A-HABIT-U0", (result) => ({
      ...result,
      farFieldCrossing: {
        previousObservedCycle: 0,
        previousMean: result.config.params.rho,
        crossingObservedCycle: result.rows.length,
        crossingMean: result.config.params.rho / 2,
        threshold: (2 / 3) * result.config.params.rho,
      },
    }));
    expectOnlyFailure("A-EXEC-TERMINATION", {
      results,
      artifacts: passingFixture().artifacts,
    });
  });

  it("accepts a registered first timeline crossing at cycle 1 from the raw initial boundary", () => {
    const registered = passingFixture().results.find((result) => result.config.id === "A-TIMELINE") as Gate4ARunResult;
    const changed = timelineCrossingAtCycleOne(registered);
    expect(changed.config).toBe(registered.config);
    expect(changed.registeredConfigSha256).toBe(registered.registeredConfigSha256);
    expect(changed.timeline?.eventLog[0].previousBoundary).toEqual({
      phase: "initial",
      completedCycles: 0,
    });
    expect(() => buildGate4AArtifacts(passingFixture().manifest, [changed])).not.toThrow();
    expect(gate4ATimelineEvidenceValid(changed)).toBe(true);
  });

  it("rejects a cycle-1 event when raw initial occupancy has already reached the trigger", () => {
    const registered = passingFixture().results.find((result) => result.config.id === "A-TIMELINE") as Gate4ARunResult;
    const cycleOne = timelineCrossingAtCycleOne(registered);
    const initialOccupancy = prism(cycleOne.config.dims, 2, 25);
    expect(latticeExtents(initialOccupancy, cycleOne.config.dims)?.zExtent).toBe(25);
    const changed = { ...cycleOne, initialOccupancy };
    expect(() => buildGate4AArtifacts(passingFixture().manifest, [changed])).not.toThrow();
    expect(gate4ATimelineEvidenceValid(changed)).toBe(false);
  });

  it.each([
    ["fabricated event aspect", (result: Gate4ARunResult): Gate4ARunResult => ({
      ...result,
      timeline: result.timeline === null
        ? null
        : { ...result.timeline, eventAspectRatio: result.timeline.eventAspectRatio + 0.125 },
    })],
    ["event boundary detached from its raw row", (result: Gate4ARunResult): Gate4ARunResult => {
      if (result.timeline === null) return result;
      const entry = result.timeline.eventLog[0];
      if (entry.crossingBoundary.phase !== "afterInterfaceStep") return result;
      return {
        ...result,
        timeline: {
          ...result.timeline,
          eventLog: [{
            ...entry,
            crossingBoundary: {
              ...entry.crossingBoundary,
              extents: {
                ...entry.crossingBoundary.extents,
                attachedCount: entry.crossingBoundary.extents.attachedCount + 1,
              },
            },
          }],
        },
      };
    }],
    ["transition report boundary detached from the event", (result: Gate4ARunResult): Gate4ARunResult => {
      if (result.timeline === null) return result;
      const entry = result.timeline.eventLog[0];
      return {
        ...result,
        timeline: {
          ...result.timeline,
          transitionReports: [strictJsonSnapshot({
            operator: "GGThreshold",
            boundary: { phase: "completedCycleBoundary", completedCycles: 3, tick: 3 },
            beforeEnvironment: entry.beforeEnvironment,
            afterEnvironment: entry.afterEnvironment,
          })],
        },
      };
    }],
    ["transition report environment detached from the event", (result: Gate4ARunResult): Gate4ARunResult => {
      if (result.timeline === null) return result;
      const entry = result.timeline.eventLog[0];
      return {
        ...result,
        timeline: {
          ...result.timeline,
          transitionReports: [strictJsonSnapshot({
            operator: "GGThreshold",
            boundary: { phase: "completedCycleBoundary", completedCycles: 2, tick: 2 },
            beforeEnvironment: entry.afterEnvironment,
            afterEnvironment: entry.afterEnvironment,
          })],
        },
      };
    }],
    ["transition report carrying an extra field", (result: Gate4ARunResult): Gate4ARunResult => {
      if (result.timeline === null) return result;
      const entry = result.timeline.eventLog[0];
      return {
        ...result,
        timeline: {
          ...result.timeline,
          transitionReports: [strictJsonSnapshot({
            operator: "GGThreshold",
            boundary: { phase: "completedCycleBoundary", completedCycles: 2, tick: 2 },
            beforeEnvironment: entry.beforeEnvironment,
            afterEnvironment: entry.afterEnvironment,
            extra: true,
          })],
        },
      };
    }],
    ["equal fabricated event masses", (result: Gate4ARunResult): Gate4ARunResult => ({
      ...result,
      timeline: result.timeline === null
        ? null
        : { ...result.timeline, beforeMass: 0, afterMass: 0 },
    })],
  ] as const)("A-EXEC-TERMINATION raw guard binds timeline evidence: %s", (_name, mutate) => {
    const results = replaceResult("A-TIMELINE", mutate);
    const changed = results.find((result) => result.config.id === "A-TIMELINE") as Gate4ARunResult;
    expect(() => buildGate4AArtifacts(passingFixture().manifest, [changed])).not.toThrow();
    expect(gate4ATimelineEvidenceValid(changed)).toBe(false);
  });

  it("A-EXEC-TERMINATION alone owns a forged transition report and equal fabricated masses", () => {
    const results = replaceResult("A-TIMELINE", (result) => {
      if (result.timeline === null) return result;
      const entry = result.timeline.eventLog[0];
      return {
        ...result,
        timeline: {
          ...result.timeline,
          transitionReports: [strictJsonSnapshot({
            operator: "GGThreshold",
            boundary: { phase: "completedCycleBoundary", completedCycles: 2, tick: 2 },
            beforeEnvironment: entry.afterEnvironment,
            afterEnvironment: entry.afterEnvironment,
          })],
          beforeMass: 0,
          afterMass: 0,
        },
      };
    });
    expectOnlyFailure("A-EXEC-TERMINATION", {
      results,
      artifacts: buildGate4AArtifacts(passingFixture().manifest, results),
    });
  });

  it("A-EXEC-NUMERIC trips alone on a reopened artifact byte mismatch", () => {
    const artifacts = passingFixture().artifacts.map((artifact) => artifact.path === "runs/A-DEPLETION/scenario.json"
      ? { ...artifact, bytes: Uint8Array.from([...artifact.bytes.slice(0, -1), 0x20]) }
      : artifact);
    expectOnlyFailure("A-EXEC-NUMERIC", { artifacts });
  });

  it.each([
    ["omitted delta", (result: Gate4ARunResult): Gate4ARunResult => ({
      ...result,
      deltas: [],
    }), /nonempty delta witness is missing/],
    ["duplicate delta index", (result: Gate4ARunResult): Gate4ARunResult => {
      const original = result.deltas[0].indices;
      const indices = [...original, original[0]];
      return {
        ...result,
        deltas: [{ cycle: 1, indices }],
        rows: [{
          ...result.rows[0],
          attachedCount: result.rows[0].attachedCount + 1,
          deltaCount: indices.length,
          deltaSha256: deltaSha256(indices),
        }],
      };
    }, /duplicate or already attached/],
    ["canonical seed already attached", (result: Gate4ARunResult): Gate4ARunResult => {
      const seedIndex = hexSeedSites(
        result.config.dims,
        2,
        1,
        domainCenter(result.config.dims),
      )[0];
      const indices = [...result.deltas[0].indices, seedIndex];
      return {
        ...result,
        deltas: [{ cycle: 1, indices }],
        rows: [{
          ...result.rows[0],
          attachedCount: result.rows[0].attachedCount + 1,
          deltaCount: indices.length,
          deltaSha256: deltaSha256(indices),
        }],
      };
    }, /duplicate or already attached/],
    ["out-of-range delta index", (result: Gate4ARunResult): Gate4ARunResult => {
      const indices = [...result.deltas[0].indices, cellCount(result.config.dims)];
      return {
        ...result,
        deltas: [{ cycle: 1, indices }],
        rows: [{
          ...result.rows[0],
          attachedCount: result.rows[0].attachedCount + 1,
          deltaCount: indices.length,
          deltaSha256: deltaSha256(indices),
        }],
      };
    }, /out of range/],
    ["attached-count mismatch", (result: Gate4ARunResult): Gate4ARunResult => ({
      ...result,
      rows: [{ ...result.rows[0], attachedCount: result.rows[0].attachedCount + 1 }],
    }), /attached count shifted/],
    ["extent mismatch", (result: Gate4ARunResult): Gate4ARunResult => ({
      ...result,
      rows: [{ ...result.rows[0], iExtent: result.rows[0].iExtent - 1 }],
    }), /row extents shifted/],
    ["finalA mismatch", (result: Gate4ARunResult): Gate4ARunResult => {
      const finalA = result.finalA.slice();
      const [ic, jc, kc] = domainCenter(result.config.dims);
      finalA[idx(result.config.dims, ic + 3, jc, kc)] = 0;
      finalA[idx(result.config.dims, ic + 4, jc + 4, kc)] = 1;
      return { ...result, finalA };
    }, /reconstructed occupancy differs from finalA/],
    ["same-extents wrong previous occupancy", (result: Gate4ARunResult): Gate4ARunResult => {
      const previousOccupancy = result.previousOccupancy?.slice() as Uint8Array;
      const [ic, jc, kc] = domainCenter(result.config.dims);
      previousOccupancy[idx(result.config.dims, ic, jc, kc)] = 0;
      previousOccupancy[idx(result.config.dims, ic + 2, jc + 2, kc)] = 1;
      expect(latticeExtents(previousOccupancy, result.config.dims)).toEqual(
        latticeExtents(result.previousOccupancy as Uint8Array, result.config.dims),
      );
      return { ...result, previousOccupancy };
    }, /previous occupancy is not the state before the crossing cycle/],
    ["duplicated delta witness cycle", (result: Gate4ARunResult): Gate4ARunResult => ({
      ...result,
      deltas: [result.deltas[0], result.deltas[0]],
    }), /has duplicate delta cycle 1/],
    ["orphan delta witness beyond the recorded rows", (result: Gate4ARunResult): Gate4ARunResult => ({
      ...result,
      deltas: [...result.deltas, { cycle: result.rows.length + 1, indices: [0] }],
    }), /has orphan delta witness at cycle 2/],
  ] as const)("A-EXEC-NUMERIC reconstruction rejects delta-chain mutation: %s", (_name, mutate, pattern) => {
    const results = replaceResult("A-HABIT-U0", mutate);
    expect(
      () => buildGate4AArtifacts(passingFixture().manifest, results),
      `${_name} must fail the independent reconstruction before artifact bytes exist`,
    ).toThrow(pattern);
  });

  it.each([
    ["orphan witness on an empty-delta row", (result: Gate4ARunResult): Gate4ARunResult => {
      expect(result.rows[2].deltaCount).toBe(0);
      return { ...result, deltas: [...result.deltas, { cycle: 3, indices: [0] }] };
    }, /empty delta has a witness at cycle 3/],
    ["out-of-order witness cycles", (result: Gate4ARunResult): Gate4ARunResult => {
      expect(result.deltas.map((witness) => witness.cycle)).toEqual([1, 2]);
      return { ...result, deltas: [result.deltas[1], result.deltas[0]] };
    }, /delta witnesses are out of order at cycle 1/],
  ] as const)("A-EXEC-NUMERIC reconstruction rejects multi-witness mutation: %s", (_name, mutate, pattern) => {
    const results = replaceResult("A-TIMELINE", mutate);
    expect(
      () => buildGate4AArtifacts(passingFixture().manifest, results),
      `${_name} must fail the independent reconstruction before artifact bytes exist`,
    ).toThrow(pattern);
  });

  it("A-EXEC-NUMERIC alone owns a representative malformed delta chain", () => {
    const results = replaceResult("A-HABIT-U0", (result) => ({
      ...result,
      deltas: [],
    }));
    expectOnlyFailure("A-EXEC-NUMERIC", {
      results,
      artifacts: passingFixture().artifacts,
    });
  });

  it("A-EXEC-NUMERIC owns a checkpoint/scenario metric mismatch", () => {
    const results = replaceResult("A-HABIT-U0", (result) => ({
      ...result,
      finalMetrics: { ...result.finalMetrics, aspectRatio: result.finalMetrics.aspectRatio + 0.125 },
    }));
    expectOnlyFailure("A-EXEC-NUMERIC", {
      results,
      artifacts: buildGate4AArtifacts(passingFixture().manifest, results),
    });
  });
});

describe("gate4a artifact and checkpoint seams", () => {
  it("reopens and cross-links the complete exact payload set", () => {
    const fixture = passingFixture();
    expect(() => validateGate4AArtifacts(fixture.manifest, fixture.results, fixture.artifacts))
      .not.toThrow();
    const scenarioArtifact = fixture.artifacts.find(
      (artifact) => artifact.path === "runs/A-BRANCH-COMPARATOR/scenario.json",
    ) as EvidenceArtifactInput;
    const scenario = JSON.parse(new TextDecoder().decode(scenarioArtifact.bytes)) as {
      version: number;
      farFieldWitness: Record<string, unknown>;
    };
    expect(scenario.version).toBe(2);
    expect(Object.hasOwn(scenario, "resolvedTargetTExtent")).toBe(false);
    expect(Object.keys(scenario.farFieldWitness).sort()).toEqual([
      "version",
      "path",
      "kind",
      "encoding",
      "supportDefinition",
      "supportCount",
      "supportIndicesSha256",
      "sampleCycles",
      "valuesPerSample",
      "byteLength",
      "sha256",
    ].sort());
  });

  it("rejects Pass-A v1 manifest and scenario identities", () => {
    const fixture = passingFixture();
    const manifestArtifacts = fixture.artifacts.map((artifact) => artifact.path === "manifest.json"
      ? { ...artifact, bytes: canonicalJsonBytes({ ...fixture.manifest, version: 1, protocol: "phase4-pass-a-v1" }) }
      : artifact);
    expect(() => validateGate4AArtifacts(fixture.manifest, fixture.results, manifestArtifacts))
      .toThrow(/A-EXEC-CONFIG/);

    const scenarioPath = "runs/A-BRANCH-COMPARATOR/scenario.json";
    const scenarioArtifacts = fixture.artifacts.map((artifact) => {
      if (artifact.path !== scenarioPath) return artifact;
      const scenario = JSON.parse(new TextDecoder().decode(artifact.bytes)) as Record<string, unknown>;
      scenario.version = 1;
      scenario.resolvedTargetTExtent = 21;
      return { ...artifact, bytes: canonicalJsonBytes(scenario) };
    });
    expect(() => validateGate4AArtifacts(fixture.manifest, fixture.results, scenarioArtifacts))
      .toThrow(/scenario artifact shifted/);
  });

  it("rejects missing, duplicate, and unexpected artifact paths", () => {
    const fixture = passingFixture();
    const controls: readonly EvidenceArtifactInput[][] = [
      fixture.artifacts.slice(1),
      [...fixture.artifacts, fixture.artifacts[0]],
      [...fixture.artifacts, {
        path: "runs/unregistered/extra.bin",
        kind: "unexpected",
        bytes: new Uint8Array([1]),
      }],
    ];
    for (const artifacts of controls) {
      expect(() => validateGate4AArtifacts(fixture.manifest, fixture.results, artifacts)).toThrow();
    }
  });

  it("rejects byte mutations in every Pass-A artifact family", () => {
    const fixture = passingFixture();
    const familyPaths = [
      "manifest.json",
      "runs/A-DEPLETION/series.csv",
      "runs/A-DEPLETION/deltas.json",
      "runs/A-DEPLETION/final.ckpt",
      "runs/A-DEPLETION/scenario.json",
      "runs/A-DEPLETION/far-field.f64le",
      "runs/A-HOLLOW-SEED-1/noise-witness.bin",
    ];
    for (const path of familyPaths) {
      const artifacts = fixture.artifacts.map((artifact) => {
        if (artifact.path !== path) return artifact;
        const bytes = artifact.bytes.slice();
        bytes[bytes.length - 1] ^= 1;
        return { ...artifact, bytes };
      });
      expect(
        () => validateGate4AArtifacts(fixture.manifest, fixture.results, artifacts),
        path,
      ).toThrow();
    }
  });

  it.each([
    ["reordered support", (result: Gate4ARunResult): Gate4ARunResult => ({
      ...result,
      farFieldWitness: {
        ...result.farFieldWitness,
        supportIndices: result.farFieldWitness.supportIndices.slice().reverse(),
      },
    })],
    ["missing cadence sample", (result: Gate4ARunResult): Gate4ARunResult => ({
      ...result,
      farFieldWitness: { ...result.farFieldWitness, sampleCycles: [0] },
    })],
    ["duplicated cadence sample", (result: Gate4ARunResult): Gate4ARunResult => ({
      ...result,
      farFieldWitness: { ...result.farFieldWitness, sampleCycles: [0, 25, 25] },
    })],
    ["truncated raw values", (result: Gate4ARunResult): Gate4ARunResult => ({
      ...result,
      farFieldWitness: {
        ...result.farFieldWitness,
        values: result.farFieldWitness.values.slice(0, -1),
      },
    })],
    ["shifted cycle-0 raw value", (result: Gate4ARunResult): Gate4ARunResult => {
      const values = result.farFieldWitness.values.slice();
      values[0] += 0.001;
      return { ...result, farFieldWitness: { ...result.farFieldWitness, values } };
    }],
    ["shifted final raw value", (result: Gate4ARunResult): Gate4ARunResult => {
      const values = result.farFieldWitness.values.slice();
      values[values.length - 1] += 0.001;
      return { ...result, farFieldWitness: { ...result.farFieldWitness, values } };
    }],
  ] as const)("rejects raw far-field witness mutation: %s", (_name, mutate) => {
    const result = passingFixture().results.find(
      (candidate) => candidate.config.id === "A-BRANCH-DENDRITE",
    ) as Gate4ARunResult;
    expect(() => validateGate4AFarFieldWitness(mutate(result))).toThrow(/A-EXEC-TERMINATION/);
  });

  it("rejects a coherent CSV/crossing scalar rewrite when raw values are unchanged", () => {
    const result = passingFixture().results.find(
      (candidate) => candidate.config.id === "A-BRANCH-DENDRITE",
    ) as Gate4ARunResult;
    const shifted = (result.farFieldCrossing as NonNullable<Gate4ARunResult["farFieldCrossing"]>)
      .crossingMean + 0.001;
    const changed: Gate4ARunResult = {
      ...result,
      rows: result.rows.map((row) => row.cycle === result.rows.length
        ? { ...row, farFieldMean: shifted }
        : row),
      farFieldCrossing: {
        ...(result.farFieldCrossing as NonNullable<Gate4ARunResult["farFieldCrossing"]>),
        crossingMean: shifted,
      },
    };
    expect(() => validateGate4AFarFieldWitness(changed)).toThrow(/differs bitwise from CSV/);
  });

  it("recomputes the raw mean after excluding support cells attached by the sampled cycle", () => {
    const result = passingFixture().results.find(
      (candidate) => candidate.config.id === "A-BRANCH-DENDRITE",
    ) as Gate4ARunResult;
    const attachedSupport = result.farFieldWitness.supportIndices[0];
    const finalA = result.finalA.slice();
    finalA[attachedSupport] = 1;
    const finalD = result.finalD.slice();
    finalD[attachedSupport] = 0;
    const values = result.farFieldWitness.values.slice();
    values[result.farFieldWitness.supportIndices.length] = 0;
    const extents = latticeExtents(finalA, result.config.dims) as LatticeExtents;
    const finalCycle = result.rows.length;
    const changed: Gate4ARunResult = {
      ...result,
      finalA,
      finalD,
      deltas: [...result.deltas, { cycle: finalCycle, indices: [attachedSupport] }],
      rows: result.rows.map((row) => row.cycle === finalCycle
        ? {
            ...row,
            ...extents,
            domainContact: true,
            deltaCount: 1,
            deltaSha256: deltaSha256([attachedSupport]),
            deltaSymmetric: false,
          }
        : row),
      farFieldWitness: { ...result.farFieldWitness, values },
    };
    expect(() => validateGate4AFarFieldWitness(changed)).not.toThrow();

    const includedMean = (result.config.params.rho / 2) *
      (result.farFieldWitness.supportIndices.length - 1) /
      result.farFieldWitness.supportIndices.length;
    const forged = {
      ...changed,
      rows: changed.rows.map((row) => row.cycle === finalCycle
        ? { ...row, farFieldMean: includedMean }
        : row),
      farFieldCrossing: {
        ...(changed.farFieldCrossing as NonNullable<Gate4ARunResult["farFieldCrossing"]>),
        crossingMean: includedMean,
      },
    };
    expect(() => validateGate4AFarFieldWitness(forged)).toThrow(/differs bitwise from CSV/);
  });

  it.each(["missing", "extra", "renamed", "mistyped"] as const)(
    "rejects %s scenario farFieldWitness metadata keys or types",
    (mutation) => {
      const fixture = passingFixture();
      const path = "runs/A-BRANCH-DENDRITE/scenario.json";
      const artifacts = fixture.artifacts.map((artifact) => {
        if (artifact.path !== path) return artifact;
        const scenario = JSON.parse(new TextDecoder().decode(artifact.bytes)) as {
          farFieldWitness: Record<string, unknown>;
        };
        if (mutation === "missing") delete scenario.farFieldWitness.supportCount;
        if (mutation === "extra") scenario.farFieldWitness.unexpected = true;
        if (mutation === "renamed") {
          scenario.farFieldWitness.supportHash = scenario.farFieldWitness.supportIndicesSha256;
          delete scenario.farFieldWitness.supportIndicesSha256;
        }
        if (mutation === "mistyped") scenario.farFieldWitness.valuesPerSample = "1";
        return { ...artifact, bytes: canonicalJsonBytes(scenario) };
      });
      expect(() => validateGate4AArtifacts(fixture.manifest, fixture.results, artifacts)).toThrow(
        /scenario artifact shifted/,
      );
    },
  );

  it.each([
    ["invalid UTF-8", (): Uint8Array => Uint8Array.from([0xff, 0xfe, 0x0a]),
      /^A-EXEC-CONFIG: Pass-A manifest is not valid UTF-8$/],
    ["invalid JSON", (): Uint8Array => encoder.encode("{\n"),
      /^A-EXEC-CONFIG: Pass-A manifest is not valid JSON$/],
    ["noncanonical whitespace", (): Uint8Array =>
      encoder.encode(`${canonicalJson(buildGate4AManifest())} \n`),
      /^A-EXEC-CONFIG: Pass-A manifest is not canonical JSON$/],
    ["BOM-prefixed canonical bytes", (): Uint8Array =>
      Uint8Array.from([0xef, 0xbb, 0xbf, ...canonicalJsonBytes(buildGate4AManifest())]),
      /^A-EXEC-CONFIG: Pass-A manifest is not canonical JSON$/],
    ["canonical bytes off the freeze", (): Uint8Array =>
      canonicalJsonBytes({ ...buildGate4AManifest(), canonicalSeedSites: 20 }),
      /^A-EXEC-CONFIG: manifest bytes differ from the freeze$/],
  ] as const)("A-EXEC-CONFIG owns corrupt manifest bytes: %s", (_name, makeBytes, pattern) => {
    const fixture = passingFixture();
    const artifacts = fixture.artifacts.map((artifact) => artifact.path === "manifest.json"
      ? { ...artifact, bytes: makeBytes() }
      : artifact);
    expect(() => validateGate4AArtifacts(fixture.manifest, fixture.results, artifacts))
      .toThrow(pattern);
    expectOnlyFailure("A-EXEC-CONFIG", { artifacts });
  });

  it("rejects a canonically re-encoded noise header mutation with unchanged field bytes", () => {
    const fixture = passingFixture();
    const path = "runs/A-HOLLOW-SEED-1/noise-witness.bin";
    const artifacts = fixture.artifacts.map((artifact) => {
      if (artifact.path !== path) return artifact;
      const bytes = artifact.bytes.slice();
      const headerLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
        .getUint32(8, true);
      const headerText = new TextDecoder().decode(bytes.subarray(12, 12 + headerLength));
      const header = JSON.parse(headerText) as Record<string, unknown>;
      header.tick = 1;
      const shiftedHeader = canonicalJsonBytes(header);
      expect(shiftedHeader.byteLength).toBe(headerLength);
      bytes.set(shiftedHeader, 12);
      return { ...artifact, bytes };
    });
    expectOnlyFailure("A-EXEC-NOISE", { artifacts });
  });

  it("rejects shifted CSV schema, cadence, row identity, and noncanonical numbers", () => {
    const result = passingFixture().results.find(
      (candidate) => candidate.config.id === "A-TIMELINE",
    ) as Gate4ARunResult;
    const csv = gate4ASeriesCsv(result.rows);
    expect(validateGate4ASeriesCsv(csv, result.rows)).toEqual(result.rows);
    const controls = [
      csv.replace("cycle,", "tick,"),
      csv.replace("\n2,", "\n3,"),
      csv.replace("\n1,", "\n01,"),
      csv.slice(0, csv.lastIndexOf("\n", csv.length - 2) + 1),
    ];
    for (const control of controls) expect(() => validateGate4ASeriesCsv(control, result.rows)).toThrow();
  });

  it("rejects shifted checkpoint bytes and expected metadata", () => {
    const result = passingFixture().results[0];
    expect(() => verifyGate4ACheckpoint(result.checkpoint, {
      config: result.config,
      tick: result.rows.length,
      environment: result.config.params,
      a: result.finalA,
      b: result.finalB,
      d: result.finalD,
      metrics: result.finalMetrics,
    })).not.toThrow();
    const bytes = result.checkpoint.slice();
    bytes[bytes.length - 1] ^= 1;
    expect(() => verifyGate4ACheckpoint(bytes, {
      config: result.config,
      tick: result.rows.length,
      environment: result.config.params,
      a: result.finalA,
      b: result.finalB,
      d: result.finalD,
      metrics: result.finalMetrics,
    })).toThrow();
    expect(() => verifyGate4ACheckpoint(result.checkpoint, {
      config: { ...result.config, rngSeed: result.config.rngSeed + 1 },
      tick: result.rows.length,
      environment: result.config.params,
      a: result.finalA,
      b: result.finalB,
      d: result.finalD,
      metrics: result.finalMetrics,
    })).toThrow();
    expect(() => verifyGate4ACheckpoint(result.checkpoint, {
      config: result.config,
      tick: result.rows.length,
      environment: result.config.params,
      a: result.finalA,
      b: result.finalB,
      d: result.finalD,
      metrics: { ...result.finalMetrics, aspectRatio: result.finalMetrics.aspectRatio + 0.125 },
    })).toThrow(/checkpoint metadata shifted/);
  });

  it("requires registered artifact kinds, not only registered paths", () => {
    const fixture = passingFixture();
    const artifacts = fixture.artifacts.map((artifact, index) => index === 0
      ? { ...artifact, kind: "application/octet-stream" }
      : artifact);
    expect(() => validateGate4AArtifacts(fixture.manifest, fixture.results, artifacts)).toThrow();
  });
});

describe("gate4a serial orchestration seams", () => {
  it("fails a rebuilt-manifest digest shift before provenance or any execution", () => {
    let provenanceCollections = 0;
    let executions = 0;
    const shifted = {
      ...buildGate4AManifest(),
      canonicalSeedSites: 20,
    } as unknown as Gate4AManifest;
    expect(() => runGate4A({
      buildManifest: () => shifted,
      collectProvenance: () => {
        provenanceCollections++;
        return passingProvenance();
      },
      executeRun: () => {
        executions++;
        throw new Error("execution must not run");
      },
    })).toThrow(/A-EXEC-CONFIG/);
    expect(provenanceCollections).toBe(0);
    expect(executions).toBe(0);
  });

  it.each([
    ["A-BRANCH-DENDRITE", "stop kind", { stop: { kind: "largestExtent", target: 40, cap: 12_000 } }],
    ["A-BRANCH-COMPARATOR", "cap", { stop: { kind: "farField", cap: 11_999 } }],
    ["A-BRANCH-COMPARATOR", "cadence", { farFieldCadence: 24 }],
  ] as const)("fails a branch %s %s shift at frozen-config preflight", (runId, _name, changes) => {
    const manifest = buildGate4AManifest();
    const shifted = {
      ...manifest,
      runs: manifest.runs.map((run) => run.id === runId ? { ...run, ...changes } : run),
    } as unknown as Gate4AManifest;
    let executions = 0;
    expect(() => runGate4A({
      buildManifest: () => shifted,
      collectProvenance: passingProvenance,
      executeRun: () => {
        executions++;
        throw new Error("execution must not run");
      },
    })).toThrow(/A-EXEC-CONFIG/);
    expect(executions).toBe(0);
  });

  it("rejects a preexisting canonical directory before provenance, source, execution, or publish", () => {
    let provenanceCollections = 0;
    let sourceCollections = 0;
    let executions = 0;
    let publications = 0;
    expect(() => runGate4A({
      repoRoot,
      canonicalDirectory: "runner",
      collectProvenance: () => {
        provenanceCollections++;
        return passingProvenance();
      },
      collectSourceHashes: () => {
        sourceCollections++;
        return { gg: GATE4A_GG_SOURCE_SHA256, lk: GATE4A_LK_SOURCE_SHA256 };
      },
      executeRun: () => {
        executions++;
        throw new Error("execution must not run");
      },
      publish: () => {
        publications++;
        throw new Error("publish must not run");
      },
    })).toThrow(/A-EXEC-NUMERIC: canonical evidence already exists/);
    expect(provenanceCollections).toBe(0);
    expect(sourceCollections).toBe(0);
    expect(executions).toBe(0);
    expect(publications).toBe(0);
  });

  it("assigns every publisher failure to A-EXEC-NUMERIC", () => {
    expect(() => publishGate4ABundle({
      canonicalDirectory: join(repoRoot, "out/phase4/unused-test-publication"),
      reportPath: "gate4a-report.json",
      protocol: GATE4A_PROTOCOL,
      pass: "A",
      operator: "GGThreshold",
      payload: { gatePass: true },
      artifacts: [],
    }, () => {
      throw new Error("injected disk failure");
    })).toThrow(/A-EXEC-NUMERIC: evidence publication failed: injected disk failure/);
  });

  it("fails provenance and solver-source preflight before invoking an execution", () => {
    let executions = 0;
    expect(() => runGate4A({
      collectProvenance: () => ({ ...passingProvenance(), trackedStatus: " M tracked" }),
      collectSourceHashes: () => {
        throw new Error("source collection must not run");
      },
      executeRun: () => {
        executions++;
        throw new Error("execution must not run");
      },
    })).toThrow(/A-EXEC-PROVENANCE/);
    expect(executions).toBe(0);

    expect(() => runGate4A({
      collectProvenance: passingProvenance,
      collectSourceHashes: () => ({ gg: "0".repeat(64), lk: GATE4A_LK_SOURCE_SHA256 }),
      executeRun: () => {
        executions++;
        throw new Error("execution must not run");
      },
    })).toThrow(/A-HOLLOW-STRUCTURAL/);
    expect(executions).toBe(0);
  });

  it("executes the frozen matrix serially without a cross-run resolver", () => {
    const { outcome, calls, publishCalls } = serialOrchestrationFixture();
    expect(calls).toEqual(buildGate4AManifest().runs.map((run) => run.id));
    expect(outcome.verdict.gatePass).toBe(false);
    expect(outcome.publication).toBeNull();
    expect(publishCalls).toBe(0);
  });

  it("formats every required exact terminal fact for a passing outcome", () => {
    const failedOutcome = serialOrchestrationFixture().outcome;
    const publication = syntheticPublication(failedOutcome);
    const outcome: Gate4ARunOutcome = {
      ...failedOutcome,
      verdict: {
        ...failedOutcome.verdict,
        contractFailures: [],
        blockingFailures: [],
        executionValid: true,
        morphologyPass: true,
        gatePass: true,
        exitCode: 0,
      },
      publication,
    };
    const presentation = formatGate4ATerminalPresentation(outcome);
    const fact = (label: string, value: unknown): string =>
      `GATE4A ${label} ${canonicalJson(strictJsonSnapshot(value))}`;
    expect(presentation.exitCode).toBe(0);
    expect(presentation.stderrLines).toEqual([]);
    expect(presentation.stdoutLines).toContain(fact("PROVENANCE", passingProvenance()));
    expect(presentation.stdoutLines).toContain(fact("SURFACE", {
      operator: "GGThreshold",
      protocol: GATE4A_PROTOCOL,
      domain: "hexPrism",
      farField: "reflecting",
    }));
    expect(presentation.stdoutLines).toContain(fact("SOURCE-HASHES", {
      gg: GATE4A_GG_SOURCE_SHA256,
      lk: GATE4A_LK_SOURCE_SHA256,
    }));
    expect(presentation.stdoutLines).toContain(`GATE4A MANIFEST ${canonicalJson(outcome.manifest)}`);
    expect(presentation.stdoutLines.filter((line) => line.startsWith("GATE4A TERMINATION ")))
      .toEqual(outcome.results.map((result) => fact("TERMINATION", {
        runId: result.config.id,
        executionId: result.executionId,
        completedCycles: result.rows.length,
        stopReason: result.stopReason,
        extentCrossing: result.extentCrossing,
        farFieldCrossing: result.farFieldCrossing,
      })));
    const expectedArtifacts = [
      ...outcome.artifacts.map((artifact) => ({
        path: artifact.path,
        kind: artifact.kind,
        byteLength: artifact.bytes.byteLength,
        sha256: sha256Bytes(artifact.bytes),
      })),
      publication.index.report,
    ].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
    expect(presentation.stdoutLines.filter((line) => line.startsWith("GATE4A ARTIFACT ")))
      .toEqual(expectedArtifacts.map((artifact) => fact("ARTIFACT", artifact)));
    expect(presentation.stdoutLines).toContain(fact("PASSED", {
      executions: outcome.results.length,
      payloadArtifacts: outcome.artifacts.length,
      manifestSha256: GATE4A_MANIFEST_SHA256,
      published: publication.directory,
    }));
    expect(presentation.stdoutLines.at(-1)).toBe("GATE4A EXIT STATUS: 0");
  });

  it("refuses to present a passing verdict without a verified publication", () => {
    const failedOutcome = serialOrchestrationFixture().outcome;
    const outcome: Gate4ARunOutcome = {
      ...failedOutcome,
      verdict: {
        ...failedOutcome.verdict,
        contractFailures: [],
        blockingFailures: [],
        executionValid: true,
        morphologyPass: true,
        gatePass: true,
        exitCode: 0,
      },
      publication: null,
    };
    expect(() => formatGate4ATerminalPresentation(outcome))
      .toThrow(/^A-EXEC-NUMERIC: passing verdict requires a verified publication$/);
  });

  it("refuses to present a failed verdict that carries a publication", () => {
    const failedOutcome = serialOrchestrationFixture().outcome;
    expect(failedOutcome.verdict.gatePass).toBe(false);
    const outcome: Gate4ARunOutcome = {
      ...failedOutcome,
      publication: syntheticPublication(failedOutcome),
    };
    expect(() => formatGate4ATerminalPresentation(outcome))
      .toThrow(/^A-EXEC-NUMERIC: failed verdict must not carry a publication$/);
  });

  it("keeps every failed criterion named in terminal failure output", () => {
    const outcome = serialOrchestrationFixture().outcome;
    const presentation = formatGate4ATerminalPresentation(outcome);
    expect(presentation.exitCode).toBe(1);
    expect(presentation.stderrLines.at(0)).toBe("GATE4A FAILED:");
    const stderr = presentation.stderrLines.join("\n");
    for (const failure of outcome.verdict.contractFailures) expect(stderr).toContain(failure);
    for (const criterion of outcome.verdict.blockingFailures) expect(stderr).toContain(criterion);
    expect(presentation.stderrLines.at(-1)).toBe("GATE4A EXIT STATUS: 1");
  });

  it("rejects a config shift before constructing or stepping the registered run", () => {
    const registered = buildGate4AManifest().runs[0];
    expect(() => executeGate4ARun({
      ...registered,
      rngSeed: registered.rngSeed + 1,
    })).toThrow(/A-EXEC-CONFIG/);
  });
});
