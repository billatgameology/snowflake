// Phase 4 Pass B runner acceptance tests. Criterion and artifact validators are exercised on
// independently constructed synthetic raw evidence at the registered 48^3 scale; real LK
// solver integration runs use tiny dims only. The hours-scale gate4b run is never launched.

import { spawnSync } from "node:child_process";
import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  STREAM_NOISE_ALPHA_HK,
  alphaHK,
  cellCount,
  classifyFacet,
  createTimelineCursor,
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
  randomBit,
  validateTimelineSchedule,
  type Dims,
  type LKTimelineEnvironment,
  type LKTimelineSchedule,
  type LatticeExtents,
} from "@vcc/core";
import {
  canonicalJson,
  canonicalJsonBytes,
  canonicalJsonSha256,
  sha256Bytes,
  strictJsonSnapshot,
  verifyEvidenceBundle,
  type EvidenceArtifactInput,
} from "../src/gate4-evidence.ts";
import {
  GATE4B_CFL_FILL,
  GATE4B_CRITERIA_FREEZE,
  GATE4B_DEPLETION_TARGETS,
  GATE4B_DIMS,
  GATE4B_MANIFEST_SHA256,
  GATE4B_NODE,
  GATE4B_PROTOCOL,
  GATE4B_SIGMA_INFINITY,
  GATE4B_STEP_CAP,
  GATE4B_SURFACE_POLICY,
  GATE4B_TARGET_LARGEST_EXTENT,
  GATE4B_V8,
  buildGate4BArtifacts,
  buildGate4BManifest,
  collectGate4BProvenance,
  deriveGate4BExecutionRecords,
  deriveGate4BMorphologyRecords,
  executeGate4BRun,
  executeGate4BScenario,
  formatGate4BTerminalPresentation,
  gate4BRegisteredPecletBound,
  gate4BScenarioPayload,
  gate4BSeriesCsv,
  gate4BTimelineEvidenceValid,
  gate4BTimelineTransitionExpectation,
  runGate4B,
  validateGate4BArtifacts,
  validateGate4BDeltaChain,
  validateGate4BNoiseWitness,
  validateGate4BProvenance,
  validateGate4BSeriesCsv,
  verifyGate4BCheckpoint,
  type Gate4BManifest,
  type Gate4BNoiseWitness,
  type Gate4BProvenance,
  type Gate4BRunConfig,
  type Gate4BRunOutcome,
  type Gate4BRunResult,
  type Gate4BStepRow,
} from "../src/gate4b.ts";
import { evaluateGate4B, type BExecutionCriterion } from "../src/gate4-protocol.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const main = join(repoRoot, "runner", "src", "main.ts");

// This suite is minutes of back-to-back synchronous CPU work, which starves the vitest
// worker RPC channel until its 60s call timeout reports a spurious unhandled error.
// Yield one macrotask per test so queued channel responses are delivered.
beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
});

const temporaryDirectories: string[] = [];
afterAll(() => {
  while (temporaryDirectories.length > 0) {
    rmSync(temporaryDirectories.pop() as string, { recursive: true, force: true });
  }
});

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "vcc-gate4b-"));
  temporaryDirectories.push(directory);
  return directory;
}

const encoder = new TextEncoder();
const EMPTY_DELTA_SHA256 = sha256Bytes(new Uint8Array(0));
const DIMS: Dims = GATE4B_DIMS;
const CENTER = domainCenter(DIMS);

function passingProvenance(): Gate4BProvenance {
  return {
    node: GATE4B_NODE,
    v8: GATE4B_V8,
    head: "a".repeat(40),
    trackedStatus: "",
    criteriaFreezeIsAncestor: true,
    runnerFreezeIsAncestor: true,
    cadenceFreezeIsAncestor: true,
  };
}

// ── Synthetic occupancy builders ───────────────────────────────────────────────────────────

function initialSeed(): Uint8Array {
  const occupancy = new Uint8Array(cellCount(DIMS));
  for (const site of hexSeedSites(DIMS, 2, 1, CENTER)) occupancy[site] = 1;
  return occupancy;
}

/** Centered hex prism of the given radius over `thickness` z-layers (odd thickness). */
function disc(radius: number, thickness: number): Uint8Array {
  const occupancy = new Uint8Array(cellCount(DIMS));
  const [ic, jc, kc] = CENTER;
  const half = (thickness - 1) / 2;
  for (let k = kc - half; k <= kc + half; k++) {
    for (let dj = -radius; dj <= radius; dj++) {
      for (let di = -radius; di <= radius; di++) {
        if (hexDistance(di, dj) <= radius) occupancy[idx(DIMS, ic + di, jc + dj, k)] = 1;
      }
    }
  }
  return occupancy;
}

/** Open hollow tube: a solid seed layer at kc, annulus 3..outer elsewhere over 25 layers. */
function hollowTube(outer: number): Uint8Array {
  const occupancy = new Uint8Array(cellCount(DIMS));
  const [ic, jc, kc] = CENTER;
  for (let k = kc - 12; k <= kc + 12; k++) {
    for (let dj = -outer; dj <= outer; dj++) {
      for (let di = -outer; di <= outer; di++) {
        const distance = hexDistance(di, dj);
        if (distance > outer) continue;
        if (k !== kc && distance <= 2) continue;
        occupancy[idx(DIMS, ic + di, jc + dj, k)] = 1;
      }
    }
  }
  return occupancy;
}

/** Capped column: trunk radius over 25 layers with wider caps in the outer 3 layers. */
function cappedColumn(trunkRadius: number, capRadius: number): Uint8Array {
  const occupancy = new Uint8Array(cellCount(DIMS));
  const [ic, jc, kc] = CENTER;
  for (let k = kc - 12; k <= kc + 12; k++) {
    const layerRadius = Math.abs(k - kc) >= 10 ? capRadius : trunkRadius;
    for (let dj = -layerRadius; dj <= layerRadius; dj++) {
      for (let di = -layerRadius; di <= layerRadius; di++) {
        if (hexDistance(di, dj) <= layerRadius) occupancy[idx(DIMS, ic + di, jc + dj, k)] = 1;
      }
    }
  }
  return occupancy;
}

/** Six thin D6h arms plus the canonical seed in the kc layer. */
function sixArmStar(armLength: number): Uint8Array {
  const occupancy = initialSeed();
  const [ic, jc, kc] = CENTER;
  for (let length = 1; length <= armLength; length++) {
    const arms: readonly (readonly [number, number])[] = [
      [length, 0], [0, length], [-length, length], [-length, 0], [0, -length], [length, -length],
    ];
    for (const [di, dj] of arms) occupancy[idx(DIMS, ic + di, jc + dj, kc)] = 1;
  }
  return occupancy;
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
  for (let index = 0; index < indices.length; index++) {
    view.setUint32(index * 4, indices[index], true);
  }
  return sha256Bytes(bytes);
}

function testWallMask(): Uint8Array {
  const wall = new Uint8Array(cellCount(DIMS));
  const [ic, jc, kc] = CENTER;
  const radius = Math.min(ic, DIMS.nx - 1 - ic, jc, DIMS.ny - 1 - jc);
  const halfZ = Math.min(kc, DIMS.nz - 1 - kc);
  for (let k = 0; k < DIMS.nz; k++) {
    for (let j = 0; j < DIMS.ny; j++) {
      for (let i = 0; i < DIMS.nx; i++) {
        if (hexDistance(i - ic, j - jc) > radius || Math.abs(k - kc) > halfZ) {
          wall[idx(DIMS, i, j, k)] = 1;
        }
      }
    }
  }
  return wall;
}

// ── Synthetic run-result builder ───────────────────────────────────────────────────────────

const ROW_SHELL = 1e-3;
const ROW_EXCHANGE = 1e-3 * (1 + 5e-9);
const ROW_DIVERGENCE = Math.abs(ROW_SHELL - ROW_EXCHANGE) / Math.max(Math.abs(ROW_EXCHANGE), 1e-300);
const ROW_PLACED = 0.25;

function occupanciesFor(config: Gate4BRunConfig): Uint8Array[] {
  switch (config.id) {
    case "B-HABIT-TM5": return [disc(12, 1)];
    case "B-HABIT-TM7P5": return [disc(12, 3)];
    case "B-HABIT-TM10": return [disc(12, 9)];
    case "B-HABIT-TM12P5": return [disc(12, 25)];
    case "B-HABIT-TM15": return [
      disc(2, 9), disc(2, 11), disc(3, 13), disc(3, 15), disc(4, 17),
      disc(4, 19), disc(5, 21), disc(5, 23), disc(6, 25),
    ];
    case "B-HOLLOW-SEED-1": return [hollowTube(5)];
    case "B-HOLLOW-SEED-2": return [hollowTube(6)];
    case "B-HOLLOW-SEED-3": return [hollowTube(7)];
    case "B-HOLLOW-SEED-1-REPLAY": return [hollowTube(5)];
    case "B-TIMELINE": return [disc(2, 9), disc(2, 17), disc(3, 21), cappedColumn(3, 5)];
    case "B-BRANCH": return [sixArmStar(12)];
    default: throw new Error(`no synthetic occupancies for ${config.id}`);
  }
}

/** Independent test-side neighbor counts (6 T-contacts, 2 Z-contacts). */
function testNeighborCounts(occupancy: Uint8Array): { nT: Uint8Array; nZ: Uint8Array } {
  const n = cellCount(DIMS);
  const nT = new Uint8Array(n);
  const nZ = new Uint8Array(n);
  const plane = DIMS.nx * DIMS.ny;
  for (let index = 0; index < n; index++) {
    if (occupancy[index] !== 1) continue;
    const k = Math.floor(index / plane);
    const inPlane = index - k * plane;
    const j = Math.floor(inPlane / DIMS.nx);
    const i = inPlane - j * DIMS.nx;
    if (i + 1 < DIMS.nx) nT[index + 1]++;
    if (i - 1 >= 0) nT[index - 1]++;
    if (j + 1 < DIMS.ny) nT[index + DIMS.nx]++;
    if (j - 1 >= 0) nT[index - DIMS.nx]++;
    if (i + 1 < DIMS.nx && j - 1 >= 0) nT[index + 1 - DIMS.nx]++;
    if (i - 1 >= 0 && j + 1 < DIMS.ny) nT[index - 1 + DIMS.nx]++;
    if (k + 1 < DIMS.nz) nZ[index + plane]++;
    if (k - 1 >= 0) nZ[index - plane]++;
  }
  return { nT, nZ };
}

/** Independently constructed seed-boundary noise witness for a registered noise-on run. */
function seedNoiseWitness(config: Gate4BRunConfig): Gate4BNoiseWitness {
  const seed = initialSeed();
  const wall = testWallMask();
  const counts = testNeighborCounts(seed);
  const ratio = (config.dxUm * 1e-6) / kineticLength(config.tempC, config.pressurePa);
  const cells = [];
  let zeroOutcomes = 0;
  let oneOutcomes = 0;
  for (let index = 0; index < seed.length; index++) {
    if (seed[index] === 1 || wall[index] === 1) continue;
    const nT = counts.nT[index];
    const nZ = counts.nZ[index];
    if (nT === 0 && nZ === 0) continue;
    const facet = classifyFacet(nT, nZ, config.surfacePolicy);
    const bit = randomBit(config.rngSeed, index, 0, STREAM_NOISE_ALPHA_HK);
    const sigmaOpp = 0.0019;
    let iterate = sigmaOpp;
    for (let iteration = 0; iteration < 100; iteration++) {
      const coefficient = alphaHK(facet, config.tempC, iterate, config.paramSet) *
        (1 - config.noiseEpsilon * bit);
      iterate = sigmaOpp / (1 + coefficient * ratio);
    }
    const cachedAlphaHK = alphaHK(facet, config.tempC, iterate, config.paramSet) *
      (1 - config.noiseEpsilon * bit);
    const sigmaBoundary = sigmaOpp / (1 + cachedAlphaHK * ratio);
    cells.push({ index, nT, nZ, sigmaOpp, sigmaBoundary, cachedAlphaHK });
    if (cachedAlphaHK > 0 && sigmaBoundary > 0) {
      if (bit === 0) zeroOutcomes++;
      else oneOutcomes++;
    }
  }
  if (zeroOutcomes === 0 || oneOutcomes === 0) {
    throw new Error("synthetic noise witness fixture is outcome-vacuous");
  }
  return {
    version: 1,
    runId: config.id,
    tick: 0,
    rngSeed: config.rngSeed,
    noiseEpsilon: config.noiseEpsilon,
    streamId: STREAM_NOISE_ALPHA_HK,
    tempC: config.tempC,
    sigmaInfinity: config.sigmaInfinity,
    dxUm: config.dxUm,
    pressurePa: config.pressurePa,
    paramSet: config.paramSet,
    surfacePolicy: config.surfacePolicy,
    cells,
  };
}

function makeRunResult(
  config: Gate4BRunConfig,
  occupanciesOverride?: Uint8Array[],
): Gate4BRunResult {
  const occupancies = occupanciesOverride ?? occupanciesFor(config);
  const seed = initialSeed();
  const eventStep = config.schedule === null ? null : 2;
  const eventEnvironment = config.schedule?.events[0].environment ?? null;
  const rows: Gate4BStepRow[] = [];
  const deltas: { step: number; indices: number[] }[] = [];
  const depletionSamples = [];
  let nextDepletion = 0;
  let previous = seed;
  let previousExtents = latticeExtents(seed, DIMS) as LatticeExtents;
  let vaporUnits = 0;
  for (let step = 1; step <= occupancies.length; step++) {
    const occupancy = occupancies[step - 1];
    const delta = difference(occupancy, previous);
    const extents = latticeExtents(occupancy, DIMS) as LatticeExtents;
    const environment: LKTimelineEnvironment =
      eventStep !== null && eventEnvironment !== null && step > eventStep
        ? eventEnvironment
        : { tempC: config.tempC, sigmaInfinity: config.sigmaInfinity };
    rows.push({
      step,
      attachedCount: extents.attachedCount,
      iExtent: extents.iExtent,
      jExtent: extents.jExtent,
      tExtent: extents.tExtent,
      zExtent: extents.zExtent,
      largestExtent: extents.largestExtent,
      deltaCount: delta.length,
      deltaSha256: delta.length === 0 ? EMPTY_DELTA_SHA256 : deltaSha256(delta),
      deltaSymmetric: config.noiseEpsilon > 0
        ? null
        : delta.length === 0 || isD6hInvariantSet(delta, DIMS, CENTER),
      sweeps: 12,
      residual: 5e-10,
      shellInjection: ROW_SHELL,
      surfaceExchange: ROW_EXCHANGE,
      divergenceResidual: ROW_DIVERGENCE,
      deltaTimeSeconds: 1,
      simTimeSeconds: step,
      maxKineticFillIncrement: 0.05,
      holeFillCount: 0,
      deltaPlacedFill: ROW_PLACED,
      deltaSaturationClippedFill: 0,
      deltaHoleFillDeficit: 0,
      independentDemand: ROW_PLACED,
      tempC: environment.tempC,
      sigmaInfinity: environment.sigmaInfinity,
    });
    if (delta.length > 0) deltas.push({ step, indices: delta });
    vaporUnits += ROW_PLACED * mIce(environment.tempC);
    while (
      nextDepletion < config.depletionTargets.length &&
      extents.largestExtent >= config.depletionTargets[nextDepletion]
    ) {
      depletionSamples.push({
        targetExtent: config.depletionTargets[nextDepletion],
        tExtent: extents.tExtent,
        depletionRatio: 0.8,
        previousCycle: step - 1,
        crossingCycle: step,
        previousLargestExtent: previousExtents.largestExtent,
        crossingLargestExtent: extents.largestExtent,
      });
      nextDepletion++;
    }
    previous = occupancy;
    previousExtents = extents;
  }
  const finalA = occupancies[occupancies.length - 1];
  const previousOccupancy = occupancies.length >= 2
    ? occupancies[occupancies.length - 2].slice()
    : seed.slice();
  const crossingExtents = latticeExtents(finalA, DIMS) as LatticeExtents;
  const crossingPreviousExtents = latticeExtents(previousOccupancy, DIMS) as LatticeExtents;
  const wall = testWallMask();
  const finalF = new Float64Array(finalA.length);
  const finalSigma = new Float64Array(finalA.length);
  for (let index = 0; index < finalA.length; index++) {
    if (finalA[index] === 1) finalF[index] = 1;
    else if (wall[index] === 0) finalSigma[index] = GATE4B_SIGMA_INFINITY;
  }
  const finalEnvironment: LKTimelineEnvironment =
    eventEnvironment ?? { tempC: config.tempC, sigmaInfinity: config.sigmaInfinity };

  let timeline: Gate4BRunResult["timeline"] = null;
  if (config.schedule !== null && eventStep !== null && eventEnvironment !== null) {
    const occupancyAtEvent = occupancies[eventStep - 1];
    const sigmaBefore = new Float64Array(finalA.length);
    for (let index = 0; index < finalA.length; index++) {
      if (occupancyAtEvent[index] === 0 && wall[index] === 0) {
        sigmaBefore[index] = config.sigmaInfinity;
      }
    }
    const beforeEnvironment: LKTimelineEnvironment = {
      tempC: config.tempC,
      sigmaInfinity: config.sigmaInfinity,
    };
    const expectation = gate4BTimelineTransitionExpectation(
      config,
      occupancyAtEvent,
      sigmaBefore,
      beforeEnvironment,
      eventEnvironment,
      eventStep,
      rows[eventStep - 1].simTimeSeconds,
    );
    const fAtEvent = new Float64Array(finalA.length);
    for (let index = 0; index < finalA.length; index++) {
      if (occupancyAtEvent[index] === 1) fAtEvent[index] = 1;
    }
    const fHash = sha256Bytes(new Uint8Array(fAtEvent.buffer, 0, fAtEvent.byteLength));
    const rowExtentsAt = (step: number): LatticeExtents => ({
      iExtent: rows[step - 1].iExtent,
      jExtent: rows[step - 1].jExtent,
      tExtent: rows[step - 1].tExtent,
      zExtent: rows[step - 1].zExtent,
      largestExtent: rows[step - 1].largestExtent,
      attachedCount: rows[step - 1].attachedCount,
    });
    timeline = {
      schedule: config.schedule,
      eventLog: [{
        eventIndex: 0,
        operator: "LibbrechtKinetics",
        trigger: config.schedule.events[0].trigger,
        previousBoundary: {
          phase: "afterInterfaceStep",
          completedCycles: eventStep - 1,
          extents: rowExtentsAt(eventStep - 1),
        },
        crossingBoundary: {
          phase: "afterInterfaceStep",
          completedCycles: eventStep,
          extents: rowExtentsAt(eventStep),
        },
        beforeEnvironment,
        afterEnvironment: eventEnvironment,
      }],
      transitionReport: expectation.report,
      eventStep,
      sigmaBefore,
      sigmaAfter: expectation.sigmaAfter,
      aHashAtEvent: sha256Bytes(occupancyAtEvent),
      fHashBefore: fHash,
      fHashAfter: fHash,
    };
  }

  const result: Gate4BRunResult = {
    config,
    registeredConfigSha256: canonicalJsonSha256(config),
    executionId: sha256Bytes(encoder.encode(`${config.id}:synthetic-execution`)),
    initialOccupancy: seed,
    seedSymmetric: true,
    rows,
    deltas,
    depletionSamples,
    stopReason: "size-target",
    extentCrossing: {
      previousStep: occupancies.length - 1,
      crossingStep: occupancies.length,
      previousExtents: crossingPreviousExtents,
      crossingExtents,
    },
    previousOccupancy,
    finalA,
    finalF,
    finalSigma,
    finalFillLedger: ROW_PLACED * rows.length,
    finalSaturationClippedFill: 0,
    finalHoleFillDeficit: 0,
    finalVaporUnits: vaporUnits,
    finalHoleFillCountTotal: 0,
    pecletBound: gate4BRegisteredPecletBound(config),
    checkpoint: new Uint8Array(0),
    noiseWitness: config.noiseEpsilon > 0 ? seedNoiseWitness(config) : null,
    timeline,
  };
  const checkpoint = encodeLKCheckpoint({
    surfacePolicy: config.surfacePolicy,
    dims: config.dims,
    tick: rows.length,
    simTimeSeconds: rows[rows.length - 1].simTimeSeconds,
    rngSeed: config.rngSeed,
    noiseEpsilon: config.noiseEpsilon,
    domain: config.domain,
    center: CENTER,
    tempC: finalEnvironment.tempC,
    sigmaInfinity: finalEnvironment.sigmaInfinity,
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
  return { ...result, checkpoint };
}

/** Rebuild a result's checkpoint after a mutation so only the intended seam is broken. */
function rebuildCheckpoint(result: Gate4BRunResult): Gate4BRunResult {
  const environment = result.timeline === null
    ? { tempC: result.config.tempC, sigmaInfinity: result.config.sigmaInfinity }
    : (result.config.schedule?.events[0].environment as LKTimelineEnvironment);
  const checkpoint = encodeLKCheckpoint({
    surfacePolicy: result.config.surfacePolicy,
    dims: result.config.dims,
    tick: result.rows.length,
    simTimeSeconds: result.rows[result.rows.length - 1]?.simTimeSeconds ?? 0,
    rngSeed: result.config.rngSeed,
    noiseEpsilon: result.config.noiseEpsilon,
    domain: result.config.domain,
    center: CENTER,
    tempC: environment.tempC,
    sigmaInfinity: environment.sigmaInfinity,
    dxUm: result.config.dxUm,
    pressurePa: result.config.pressurePa,
    paramSet: result.config.paramSet,
    cflFill: result.config.cflFill,
    relaxTol: result.config.relaxTol,
    divTol: result.config.divTol,
    relaxMaxSweeps: result.config.relaxMaxSweeps,
    farField: result.config.farField,
    a: result.finalA,
    f: result.finalF,
    sigma: result.finalSigma,
  });
  return { ...result, checkpoint };
}

interface PassingFixture {
  readonly manifest: Gate4BManifest;
  readonly results: readonly Gate4BRunResult[];
  readonly artifacts: readonly EvidenceArtifactInput[];
}

let cachedFixture: PassingFixture | undefined;

function passingFixture(): PassingFixture {
  if (cachedFixture !== undefined) return cachedFixture;
  const manifest = buildGate4BManifest();
  const results = manifest.runs.map((run) => makeRunResult(run));
  const artifacts = buildGate4BArtifacts(manifest, results);
  cachedFixture = { manifest, results, artifacts };
  return cachedFixture;
}

function executionRecords(
  changes: Partial<PassingFixture> & { readonly provenance?: Gate4BProvenance } = {},
) {
  const fixture = passingFixture();
  return deriveGate4BExecutionRecords({
    manifest: changes.manifest ?? fixture.manifest,
    results: changes.results ?? fixture.results,
    artifacts: changes.artifacts ?? fixture.artifacts,
    provenance: changes.provenance ?? passingProvenance(),
  });
}

function replaceResult(
  id: string,
  replace: (result: Gate4BRunResult) => Gate4BRunResult,
): readonly Gate4BRunResult[] {
  return passingFixture().results.map((result) =>
    result.config.id === id ? replace(result) : result
  );
}

function expectOnlyFailure(
  criterion: BExecutionCriterion,
  changes: Partial<PassingFixture> & { readonly provenance?: Gate4BProvenance },
): void {
  expect(
    executionRecords(changes).filter((record) => !record.passed).map((record) => record.criterion),
  ).toEqual([criterion]);
}

function expectNamedFailure(
  criterion: BExecutionCriterion,
  changes: Partial<PassingFixture> & { readonly provenance?: Gate4BProvenance },
): void {
  expect(
    executionRecords(changes).filter((record) => !record.passed).map((record) => record.criterion),
  ).toContain(criterion);
}

// ── Frozen registration ────────────────────────────────────────────────────────────────────

describe("gate4b frozen registration", () => {
  it("registers the exact 11-run Pass-B matrix and constants", () => {
    const manifest = buildGate4BManifest();
    expect(manifest.runs).toHaveLength(11);
    expect(manifest.runs.map((run) => run.id)).toEqual([
      "B-HABIT-TM5",
      "B-HABIT-TM7P5",
      "B-HABIT-TM10",
      "B-HABIT-TM12P5",
      "B-HABIT-TM15",
      "B-HOLLOW-SEED-1",
      "B-HOLLOW-SEED-2",
      "B-HOLLOW-SEED-3",
      "B-HOLLOW-SEED-1-REPLAY",
      "B-TIMELINE",
      "B-BRANCH",
    ]);
    expect(manifest.surfacePolicy).toBe("aggregate-hv-g1h1-v4");
    expect(manifest.criteriaFreeze).toBe(GATE4B_CRITERIA_FREEZE);
    expect(manifest.runs.map((run) => run.tempC).slice(0, 5)).toEqual([-5, -7.5, -10, -12.5, -15]);
    for (const run of manifest.runs) {
      expect(run.dims).toEqual({ nx: 48, ny: 48, nz: 48 });
      expect(run.domain).toBe("hexPrism");
      expect(run.farField).toBe("dirichlet");
      expect(run.surfacePolicy).toBe(GATE4B_SURFACE_POLICY);
      expect(run.paramSet).toBe("CAK_A1");
      expect(run.targetLargestExtent).toBe(24);
      expect(run.stepCap).toBe(50_000);
      expect(run.dxUm).toBe(0.35);
      expect(run.pressurePa).toBe(101_325);
      expect(run.cflFill).toBe(0.1);
      expect(run.relaxTol).toBe(1e-9);
      expect(run.divTol).toBe(1e-7);
      expect(run.relaxMaxSweeps).toBe(200_000);
      expect(run.sigmaInfinity).toBe(run.id === "B-BRANCH" ? 0.01 : 0.002);
    }
    expect(manifest.runs.filter((run) => run.noiseEpsilon > 0).map((run) => run.id)).toEqual([
      "B-HOLLOW-SEED-1",
      "B-HOLLOW-SEED-2",
      "B-HOLLOW-SEED-3",
      "B-HOLLOW-SEED-1-REPLAY",
    ]);
    const depletion = manifest.runs.find((run) => run.id === "B-HABIT-TM15");
    expect(depletion?.depletionTargets).toEqual([...GATE4B_DEPLETION_TARGETS]);
    const timeline = manifest.runs.find((run) => run.id === "B-TIMELINE");
    expect(timeline?.schedule?.events).toEqual([{
      index: 0,
      operator: "LibbrechtKinetics",
      trigger: { kind: "zExtent", value: 16 },
      environment: { tempC: -5, sigmaInfinity: 0.002 },
    }]);
    expect(timeline?.tempC).toBe(-15);
    expect(canonicalJsonSha256(manifest)).toBe(GATE4B_MANIFEST_SHA256);
    expect(GATE4B_MANIFEST_SHA256)
      .toBe("c0ceed5b0ebb68defee85b1d78d52c9563f5edd35ed415b8cfdad57dd7c3e812");
  });

  it("keeps Pass-B provenance at the exact owned seven-key v1 shape", () => {
    expect(validateGate4BProvenance(passingProvenance())).toEqual([]);
    expect(validateGate4BProvenance({
      ...passingProvenance(),
      v2CriteriaFreezeIsAncestor: true,
    } as unknown as Gate4BProvenance)).toContain(
      "provenance keys differ from the exact Pass-B v1 shape",
    );
  });

  it("projects the shared git probe into a fresh Pass-B-owned object", () => {
    const head = "b".repeat(40);
    const fakeExec = ((_file: string, args: readonly string[]) => {
      if (args[0] === "rev-parse") return `${head}\n`;
      if (args[0] === "status") return "";
      if (args[0] === "merge-base") return "";
      throw new Error(`unexpected git probe ${args.join(" ")}`);
    }) as never;
    const provenance = collectGate4BProvenance(repoRoot, fakeExec);
    expect(Object.keys(provenance).sort()).toEqual([
      "node", "v8", "head", "trackedStatus", "criteriaFreezeIsAncestor",
      "runnerFreezeIsAncestor", "cadenceFreezeIsAncestor",
    ].sort());
    expect(provenance.head).toBe(head);
    expect(Object.hasOwn(provenance, "v2CriteriaFreezeIsAncestor")).toBe(false);
  });
});

describe("gate4b CLI is flagless and fail-closed", () => {
  it("rejects every supplied flag with exit 2 before starting evidence work", () => {
    const result = spawnSync(process.execPath, [main, "gate4b", "--anything"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("gate4b takes no flags");
  });
});

// ── Execution criteria from raw evidence ───────────────────────────────────────────────────

describe("gate4b derives all twelve execution criteria from raw evidence", () => {
  it("passes the complete synthetic 11-run evidence matrix", () => {
    const records = executionRecords();
    expect(records).toHaveLength(12);
    expect(records.filter((record) => !record.passed).map((record) => record.criterion))
      .toEqual([]);
  });

  it("records all eight diagnostic morphology verdicts on the same matrix", () => {
    const fixture = passingFixture();
    const records = deriveGate4BMorphologyRecords(fixture.manifest, fixture.results);
    expect(records.map((record) => record.criterion)).toEqual([
      "B-HABIT-ENDPOINTS",
      "B-HABIT-SOLID",
      "B-HABIT-MONOTONE",
      "B-DEPLETION",
      "B-DEPLETION-WIDENING",
      "B-HOLLOW",
      "B-TIMELINE",
      "B-BRANCH",
    ]);
    expect(records.filter((record) => !record.passed).map((record) => record.criterion))
      .toEqual([]);
  });

  it("B-EXEC-PROVENANCE trips alone", () => {
    expectOnlyFailure("B-EXEC-PROVENANCE", {
      provenance: { ...passingProvenance(), head: "not-a-commit" },
    });
  });

  it("B-EXEC-CONFIG trips alone", () => {
    const results = replaceResult("B-HABIT-TM5", (result) => ({
      ...result,
      registeredConfigSha256: "0".repeat(64),
    }));
    expectOnlyFailure("B-EXEC-CONFIG", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("B-EXEC-TERMINATION trips alone", () => {
    const results = replaceResult("B-HABIT-TM5", (result) => ({
      ...result,
      stopReason: "step-cap",
    }));
    expectOnlyFailure("B-EXEC-TERMINATION", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("B-EXEC-SYMMETRY trips alone on an internally consistent asymmetric delta", () => {
    const results = replaceResult("B-HABIT-TM5", (result) => {
      const occupancy = disc(12, 1);
      occupancy[idx(DIMS, CENTER[0] + 13, CENTER[1], CENTER[2])] = 1;
      return makeRunResult(result.config, [occupancy]);
    });
    expectOnlyFailure("B-EXEC-SYMMETRY", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("B-EXEC-NOISE trips alone on a shifted witness stream", () => {
    const results = replaceResult("B-HOLLOW-SEED-2", (result) => ({
      ...result,
      noiseWitness: { ...(result.noiseWitness as Gate4BNoiseWitness), streamId: 1 },
    }));
    expectOnlyFailure("B-EXEC-NOISE", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("B-EXEC-CONVERGENCE trips alone", () => {
    const results = replaceResult("B-HABIT-TM5", (result) => ({
      ...result,
      rows: result.rows.map((row, index) => index === 0
        ? { ...row, divergenceResidual: 2e-7 }
        : row),
    }));
    expectOnlyFailure("B-EXEC-CONVERGENCE", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("B-EXEC-SURFACE trips alone", () => {
    const results = replaceResult("B-HABIT-TM5", (result) => ({
      ...result,
      rows: result.rows.map((row, index) => index === 0
        ? { ...row, maxKineticFillIncrement: GATE4B_CFL_FILL * 2 }
        : row),
    }));
    expectOnlyFailure("B-EXEC-SURFACE", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("B-EXEC-LEDGER trips alone", () => {
    const results = replaceResult("B-HABIT-TM5", (result) => ({
      ...result,
      rows: result.rows.map((row, index) => index === 0
        ? { ...row, independentDemand: row.independentDemand + 0.1 }
        : row),
    }));
    expectOnlyFailure("B-EXEC-LEDGER", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("B-EXEC-PECLET trips alone", () => {
    const results = replaceResult("B-HABIT-TM5", (result) => ({
      ...result,
      pecletBound: result.pecletBound * 2,
    }));
    expectOnlyFailure("B-EXEC-PECLET", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("B-EXEC-CHECKPOINT trips alone", () => {
    const results = replaceResult("B-HABIT-TM5", (result) => {
      const checkpoint = result.checkpoint.slice();
      checkpoint[checkpoint.length - 1] ^= 1;
      return { ...result, checkpoint };
    });
    expectOnlyFailure("B-EXEC-CHECKPOINT", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("B-EXEC-NUMERIC trips alone on a reopened artifact byte mismatch", () => {
    const artifacts = passingFixture().artifacts.map((artifact) =>
      artifact.path === "runs/B-HABIT-TM5/scenario.json"
        ? { ...artifact, bytes: Uint8Array.from([...artifact.bytes.slice(0, -1), 0x20]) }
        : artifact
    );
    expectOnlyFailure("B-EXEC-NUMERIC", { artifacts });
  });

  it("B-EXEC-COMPLETE trips alone on a missing registered sweep point", () => {
    const results = passingFixture().results.filter(
      (result) => result.config.id !== "B-HABIT-TM10",
    );
    const records = executionRecords({
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
    expect(records.filter((record) => !record.passed).map((record) => record.criterion))
      .toEqual(["B-EXEC-COMPLETE"]);
    const complete = records.find((record) => record.criterion === "B-EXEC-COMPLETE");
    expect(complete?.summary).toContain("B-HABIT-TM10 is missing");
    expect(complete?.summary).toContain("temperature sweep is incomplete");
  });

  it("B-EXEC-COMPLETE trips alone on a duplicated registered record", () => {
    const fixture = passingFixture();
    const duplicate = fixture.results.find((result) => result.config.id === "B-HABIT-TM10");
    const results = [...fixture.results, duplicate as Gate4BRunResult];
    const records = executionRecords({ results });
    expect(records.filter((record) => !record.passed).map((record) => record.criterion))
      .toEqual(["B-EXEC-COMPLETE"]);
    expect(records.find((record) => record.criterion === "B-EXEC-COMPLETE")?.summary)
      .toContain("appears 2 times");
  });
});

// ── The registered LK negative list ────────────────────────────────────────────────────────

describe("gate4b rejects the registered LK negative list by name", () => {
  it("wrong surface policy fails B-EXEC-CONFIG", () => {
    const results = replaceResult("B-HABIT-TM5", (result) => ({
      ...result,
      config: { ...result.config, surfacePolicy: "legacy-v3" as never },
    }));
    expectNamedFailure("B-EXEC-CONFIG", { results });
  });

  it("reflecting far field fails B-EXEC-CONFIG", () => {
    const results = replaceResult("B-HABIT-TM5", (result) => ({
      ...result,
      config: { ...result.config, farField: "reflecting" as never },
    }));
    expectNamedFailure("B-EXEC-CONFIG", { results });
  });

  it("a legacy-v3 checkpoint artifact fails B-EXEC-CHECKPOINT", () => {
    const result = passingFixture().results[0];
    // Rebuild the artifact as an implicit-legacy v1 wire header: version 1, no surfacePolicy.
    const bytes = result.checkpoint;
    const headerLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
      .getUint32(8, true);
    const header = JSON.parse(
      new TextDecoder().decode(bytes.subarray(12, 12 + headerLength)),
    ) as Record<string, unknown>;
    header.version = 1;
    delete header.surfacePolicy;
    const headerBytes = encoder.encode(JSON.stringify(header));
    const payload = bytes.subarray(12 + headerLength);
    const v1 = new Uint8Array(12 + headerBytes.length + payload.length);
    v1.set(bytes.subarray(0, 8), 0);
    new DataView(v1.buffer).setUint32(8, headerBytes.length, true);
    v1.set(headerBytes, 12);
    v1.set(payload, 12 + headerBytes.length);
    expect(() => verifyGate4BCheckpoint(v1, result)).toThrow(/^B-EXEC-CHECKPOINT:/);
    const results = replaceResult(result.config.id, (candidate) => ({
      ...candidate,
      checkpoint: v1,
    }));
    expectNamedFailure("B-EXEC-CHECKPOINT", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("a checkpoint policy shift fails B-EXEC-CHECKPOINT", () => {
    const results = replaceResult("B-HABIT-TM5", (result) => {
      const checkpoint = encodeLKCheckpoint({
        surfacePolicy: "legacy-v3",
        dims: result.config.dims,
        tick: result.rows.length,
        simTimeSeconds: result.rows[result.rows.length - 1].simTimeSeconds,
        rngSeed: result.config.rngSeed,
        noiseEpsilon: result.config.noiseEpsilon,
        domain: result.config.domain,
        center: CENTER,
        tempC: result.config.tempC,
        sigmaInfinity: result.config.sigmaInfinity,
        dxUm: result.config.dxUm,
        pressurePa: result.config.pressurePa,
        paramSet: result.config.paramSet,
        cflFill: result.config.cflFill,
        relaxTol: result.config.relaxTol,
        divTol: result.config.divTol,
        relaxMaxSweeps: result.config.relaxMaxSweeps,
        farField: result.config.farField,
        a: result.finalA,
        f: result.finalF,
        sigma: result.finalSigma,
      });
      return { ...result, checkpoint };
    });
    expectNamedFailure("B-EXEC-CHECKPOINT", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("residual-only convergence claims fail B-EXEC-CONVERGENCE", () => {
    // A converged claim whose divergence identity fails: the recomputed identity is 1.
    const results = replaceResult("B-HABIT-TM5", (result) => ({
      ...result,
      rows: result.rows.map((row) => ({
        ...row,
        shellInjection: 1,
        surfaceExchange: 0.5,
        divergenceResidual: Math.abs(1 - 0.5) / Math.max(Math.abs(0.5), 1e-300),
      })),
    }));
    expectNamedFailure("B-EXEC-CONVERGENCE", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("a forged divergence report that disagrees with shell/exchange fails B-EXEC-CONVERGENCE", () => {
    const results = replaceResult("B-HABIT-TM5", (result) => ({
      ...result,
      rows: result.rows.map((row) => ({
        ...row,
        shellInjection: 1,
        surfaceExchange: 0.5,
        divergenceResidual: 1e-9,
      })),
    }));
    expectNamedFailure("B-EXEC-CONVERGENCE", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("clipped-demand omission fails B-EXEC-LEDGER", () => {
    const results = replaceResult("B-HABIT-TM5", (result) => ({
      ...result,
      rows: result.rows.map((row) => ({
        ...row,
        independentDemand: row.deltaPlacedFill + 0.05,
        deltaSaturationClippedFill: 0,
      })),
    }));
    expectNamedFailure("B-EXEC-LEDGER", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("an incomplete temperature sweep fails B-EXEC-COMPLETE", () => {
    const results = passingFixture().results.filter(
      (result) => result.config.id !== "B-HABIT-TM12P5",
    );
    expectNamedFailure("B-EXEC-COMPLETE", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });
});

// ── Noise negatives ────────────────────────────────────────────────────────────────────────

describe("gate4b noise witnesses are independently recomputed", () => {
  function witnessOf(id: string): Gate4BNoiseWitness {
    const result = passingFixture().results.find((candidate) => candidate.config.id === id);
    return (result as Gate4BRunResult).noiseWitness as Gate4BNoiseWitness;
  }

  it("accepts the independently constructed dual-outcome witness", () => {
    const result = passingFixture().results.find(
      (candidate) => candidate.config.id === "B-HOLLOW-SEED-1",
    ) as Gate4BRunResult;
    expect(validateGate4BNoiseWitness(
      result.noiseWitness as Gate4BNoiseWitness,
      result.config,
    )).toEqual([]);
  });

  it("rejects wrong PRNG provenance by stream, seed, and tick", () => {
    const result = passingFixture().results.find(
      (candidate) => candidate.config.id === "B-HOLLOW-SEED-1",
    ) as Gate4BRunResult;
    const witness = witnessOf("B-HOLLOW-SEED-1");
    expect(validateGate4BNoiseWitness({ ...witness, streamId: 1 }, result.config))
      .not.toEqual([]);
    expect(validateGate4BNoiseWitness({ ...witness, rngSeed: witness.rngSeed + 1 }, result.config))
      .not.toEqual([]);
    const shiftedTick = validateGate4BNoiseWitness({ ...witness, tick: 3 }, result.config);
    expect(shiftedTick.join("; ")).toMatch(/expected applied value|both PRNG outcomes/);
  });

  it("rejects a single-outcome positive-input witness by name", () => {
    const result = passingFixture().results.find(
      (candidate) => candidate.config.id === "B-HOLLOW-SEED-1",
    ) as Gate4BRunResult;
    const witness = witnessOf("B-HOLLOW-SEED-1");
    const cells = witness.cells.map((cell) => {
      const bit = randomBit(witness.rngSeed, cell.index, witness.tick, witness.streamId);
      // Remove every bit-1 cell from the positive-demand set with a consistent
      // zero-coefficient subsaturated record; the Robin closure still holds exactly.
      return bit === 1
        ? { ...cell, sigmaOpp: -0.001, sigmaBoundary: -0.001, cachedAlphaHK: 0 }
        : cell;
    });
    const failures = validateGate4BNoiseWitness({ ...witness, cells }, result.config);
    expect(failures.join("; ")).toContain("lacks both PRNG outcomes on positive-demand");
  });

  it("rejects a cached coefficient that ignores the noise multiplier", () => {
    const result = passingFixture().results.find(
      (candidate) => candidate.config.id === "B-HOLLOW-SEED-1",
    ) as Gate4BRunResult;
    const witness = witnessOf("B-HOLLOW-SEED-1");
    const cells = witness.cells.map((cell) => {
      const bit = randomBit(witness.rngSeed, cell.index, witness.tick, witness.streamId);
      if (bit !== 1 || !(cell.cachedAlphaHK > 0)) return cell;
      const facet = classifyFacet(cell.nT, cell.nZ, witness.surfacePolicy);
      return { ...cell, cachedAlphaHK: alphaHK(facet, witness.tempC, cell.sigmaBoundary, witness.paramSet) };
    });
    const failures = validateGate4BNoiseWitness({ ...witness, cells }, result.config);
    expect(failures.join("; ")).toContain("does not match the expected applied value");
  });

  it("rejects a boundary value solved without the noise multiplier", () => {
    const result = passingFixture().results.find(
      (candidate) => candidate.config.id === "B-HOLLOW-SEED-1",
    ) as Gate4BRunResult;
    const witness = witnessOf("B-HOLLOW-SEED-1");
    const ratio = (witness.dxUm * 1e-6) / kineticLength(witness.tempC, witness.pressurePa);
    let mutated = 0;
    const cells = witness.cells.map((cell) => {
      const bit = randomBit(witness.rngSeed, cell.index, witness.tick, witness.streamId);
      if (bit !== 1 || !(cell.cachedAlphaHK > 0)) return cell;
      const facet = classifyFacet(cell.nT, cell.nZ, witness.surfacePolicy);
      let iterate = cell.sigmaOpp;
      for (let iteration = 0; iteration < 100; iteration++) {
        const unnoised = alphaHK(facet, witness.tempC, iterate, witness.paramSet);
        iterate = cell.sigmaOpp / (1 + unnoised * ratio);
      }
      const sigmaBoundary = cell.sigmaOpp /
        (1 + alphaHK(facet, witness.tempC, iterate, witness.paramSet) * ratio);
      const cachedAlphaHK = alphaHK(facet, witness.tempC, sigmaBoundary, witness.paramSet) *
        (1 - witness.noiseEpsilon * bit);
      mutated++;
      return { ...cell, sigmaBoundary, cachedAlphaHK };
    });
    expect(mutated).toBeGreaterThan(0);
    const failures = validateGate4BNoiseWitness({ ...witness, cells }, result.config);
    expect(failures.join("; ")).toContain("does not close the aggregate Robin equation");
  });

  it("a divergent same-seed replay fails B-EXEC-NOISE alone", () => {
    const results = replaceResult("B-HOLLOW-SEED-1-REPLAY", (result) => {
      const finalSigma = result.finalSigma.slice();
      const cell = finalSigma.findIndex((value) => value > 0);
      finalSigma[cell] = finalSigma[cell] * (1 + 1e-12);
      return rebuildCheckpoint({ ...result, finalSigma });
    });
    expectOnlyFailure("B-EXEC-NOISE", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("a witness cell set detached from the reconstructed boundary fails B-EXEC-NOISE", () => {
    const results = replaceResult("B-HOLLOW-SEED-2", (result) => {
      const witness = result.noiseWitness as Gate4BNoiseWitness;
      return { ...result, noiseWitness: { ...witness, cells: witness.cells.slice(1) } };
    });
    expectOnlyFailure("B-EXEC-NOISE", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it("epsilon/seed round-trip through the frozen LK v2 checkpoint is enforced", () => {
    const results = replaceResult("B-HOLLOW-SEED-3", (result) => {
      const checkpoint = encodeLKCheckpoint({
        surfacePolicy: result.config.surfacePolicy,
        dims: result.config.dims,
        tick: result.rows.length,
        simTimeSeconds: result.rows[result.rows.length - 1].simTimeSeconds,
        rngSeed: result.config.rngSeed,
        noiseEpsilon: 0,
        domain: result.config.domain,
        center: CENTER,
        tempC: result.config.tempC,
        sigmaInfinity: result.config.sigmaInfinity,
        dxUm: result.config.dxUm,
        pressurePa: result.config.pressurePa,
        paramSet: result.config.paramSet,
        cflFill: result.config.cflFill,
        relaxTol: result.config.relaxTol,
        divTol: result.config.divTol,
        relaxMaxSweeps: result.config.relaxMaxSweeps,
        farField: result.config.farField,
        a: result.finalA,
        f: result.finalF,
        sigma: result.finalSigma,
      });
      return { ...result, checkpoint };
    });
    const failed = executionRecords({
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    }).filter((record) => !record.passed).map((record) => record.criterion);
    expect(failed).toContain("B-EXEC-NOISE");
    expect(failed).toContain("B-EXEC-CHECKPOINT");
  });
});

// ── Timeline negatives ─────────────────────────────────────────────────────────────────────

describe("gate4b timeline evidence is independently recomputed", () => {
  function timelineResult(): Gate4BRunResult {
    return passingFixture().results.find(
      (candidate) => candidate.config.id === "B-TIMELINE",
    ) as Gate4BRunResult;
  }

  it("the registered cold-to-warm event produces preserved negative supersaturation", () => {
    const result = timelineResult();
    const timeline = result.timeline as NonNullable<Gate4BRunResult["timeline"]>;
    let negatives = 0;
    for (const value of timeline.sigmaAfter) if (value < 0) negatives++;
    expect(negatives).toBeGreaterThan(0);
    expect(gate4BTimelineEvidenceValid(result)).toBe(true);
  });

  it("clamping the transformed negatives to zero fails the bitwise density transform", () => {
    const results = replaceResult("B-TIMELINE", (result) => {
      const timeline = result.timeline as NonNullable<Gate4BRunResult["timeline"]>;
      const sigmaAfter = timeline.sigmaAfter.slice();
      for (let index = 0; index < sigmaAfter.length; index++) {
        if (sigmaAfter[index] < 0) sigmaAfter[index] = 0;
      }
      return { ...result, timeline: { ...timeline, sigmaAfter } };
    });
    const changed = results.find((result) => result.config.id === "B-TIMELINE") as Gate4BRunResult;
    expect(gate4BTimelineEvidenceValid(changed)).toBe(false);
    expectOnlyFailure("B-EXEC-TERMINATION", {
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
  });

  it.each([
    ["forged density-transform sums", (result: Gate4BRunResult): Gate4BRunResult => {
      const timeline = result.timeline as NonNullable<Gate4BRunResult["timeline"]>;
      const report = JSON.parse(JSON.stringify(timeline.transitionReport)) as {
        densityTransform: { absoluteNumberDensitySumAfter: number };
      };
      report.densityTransform.absoluteNumberDensitySumAfter *= 2;
      return { ...result, timeline: { ...timeline, transitionReport: strictJsonSnapshot(report) } };
    }],
    ["event boundary detached from its raw row", (result: Gate4BRunResult): Gate4BRunResult => {
      const timeline = result.timeline as NonNullable<Gate4BRunResult["timeline"]>;
      const entry = timeline.eventLog[0];
      if (entry.crossingBoundary.phase !== "afterInterfaceStep") return result;
      return {
        ...result,
        timeline: {
          ...timeline,
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
    ["a backdated crossing that never straddles the trigger", (result: Gate4BRunResult): Gate4BRunResult => {
      const timeline = result.timeline as NonNullable<Gate4BRunResult["timeline"]>;
      const entry = timeline.eventLog[0];
      const rows = result.rows;
      const late = rows.length;
      if (entry.crossingBoundary.phase !== "afterInterfaceStep") return result;
      const extentsAt = (step: number) => ({
        iExtent: rows[step - 1].iExtent,
        jExtent: rows[step - 1].jExtent,
        tExtent: rows[step - 1].tExtent,
        zExtent: rows[step - 1].zExtent,
        largestExtent: rows[step - 1].largestExtent,
        attachedCount: rows[step - 1].attachedCount,
      });
      return {
        ...result,
        timeline: {
          ...timeline,
          eventStep: late,
          eventLog: [{
            ...entry,
            previousBoundary: {
              phase: "afterInterfaceStep",
              completedCycles: late - 1,
              extents: extentsAt(late - 1),
            },
            crossingBoundary: {
              phase: "afterInterfaceStep",
              completedCycles: late,
              extents: extentsAt(late),
            },
          }],
        },
      };
    }],
    ["a shifted f-field hash across the event", (result: Gate4BRunResult): Gate4BRunResult => {
      const timeline = result.timeline as NonNullable<Gate4BRunResult["timeline"]>;
      return { ...result, timeline: { ...timeline, fHashAfter: "0".repeat(64) } };
    }],
  ] as const)("timeline raw guard rejects %s", (_name, mutate) => {
    const changed = mutate(timelineResult());
    expect(gate4BTimelineEvidenceValid(changed)).toBe(false);
  });

  it("the cross-temperature vapor ledger catches final-temperature multiplication by name", () => {
    const results = replaceResult("B-TIMELINE", (result) => {
      const placedTotal = result.rows.reduce((sum, row) => sum + row.deltaPlacedFill, 0);
      const finalTempC = (result.config.schedule as LKTimelineSchedule).events[0].environment.tempC;
      return { ...result, finalVaporUnits: placedTotal * mIce(finalTempC) };
    });
    const records = executionRecords({
      results,
      artifacts: buildGate4BArtifacts(passingFixture().manifest, results),
    });
    const ledger = records.find((record) => record.criterion === "B-EXEC-LEDGER");
    expect(ledger?.passed).toBe(false);
    expect(ledger?.summary).toContain("final-temperature M_ice multiplication is a named failure");
  });

  it("duplicate timeline trigger declarations reject before any solver work", () => {
    const registered = buildGate4BManifest().runs.find(
      (run) => run.id === "B-TIMELINE",
    ) as Gate4BRunConfig;
    const schedule = registered.schedule as LKTimelineSchedule;
    const duplicated: LKTimelineSchedule = {
      ...schedule,
      events: [
        schedule.events[0],
        { ...schedule.events[0], index: 1, environment: { tempC: -7.5, sigmaInfinity: 0.002 } },
      ],
    };
    expect(() => validateTimelineSchedule(duplicated)).toThrow(/duplicate timeline trigger/);
    expect(() => executeGate4BScenario({ ...registered, schedule: duplicated }))
      .toThrow(/duplicate timeline trigger/);
  });

  it("coincident newly eligible events reject as ambiguous before mutation", () => {
    const schedule: LKTimelineSchedule = {
      version: 1,
      mode: "abrupt",
      operator: "LibbrechtKinetics",
      initialEnvironment: { tempC: -15, sigmaInfinity: 0.002 },
      events: [
        {
          index: 0,
          operator: "LibbrechtKinetics",
          trigger: { kind: "zExtent", value: 6 },
          environment: { tempC: -10, sigmaInfinity: 0.002 },
        },
        {
          index: 1,
          operator: "LibbrechtKinetics",
          trigger: { kind: "tExtent", value: 6 },
          environment: { tempC: -5, sigmaInfinity: 0.002 },
        },
      ],
    };
    let cursor = createTimelineCursor(schedule);
    cursor = evaluateTimelineBoundary(schedule, cursor, { phase: "initial", completedCycles: 0 }).cursor;
    expect(() => evaluateTimelineBoundary(schedule, cursor, {
      phase: "afterInterfaceStep",
      completedCycles: 1,
      extents: {
        iExtent: 6, jExtent: 6, tExtent: 6, zExtent: 6, largestExtent: 6, attachedCount: 40,
      },
    })).toThrow(/ambiguous timeline boundary/);
  });
});

// ── Artifact seams ─────────────────────────────────────────────────────────────────────────

describe("gate4b artifact and checkpoint seams", () => {
  it("reopens and cross-links the complete exact payload set", () => {
    const fixture = passingFixture();
    expect(() => validateGate4BArtifacts(fixture.manifest, fixture.results, fixture.artifacts))
      .not.toThrow();
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
      expect(() => validateGate4BArtifacts(fixture.manifest, fixture.results, artifacts)).toThrow();
    }
  });

  it("rejects byte mutations in every Pass-B artifact family", () => {
    const fixture = passingFixture();
    const familyPaths = [
      "manifest.json",
      "runs/B-HABIT-TM15/series.csv",
      "runs/B-HABIT-TM15/deltas.json",
      "runs/B-HABIT-TM15/final.ckpt",
      "runs/B-HABIT-TM15/scenario.json",
      "runs/B-HOLLOW-SEED-1/noise-witness.json",
      "runs/B-TIMELINE/timeline-witness.bin",
    ];
    for (const path of familyPaths) {
      const artifacts = fixture.artifacts.map((artifact) => {
        if (artifact.path !== path) return artifact;
        const bytes = artifact.bytes.slice();
        bytes[bytes.length - 1] ^= 1;
        return { ...artifact, bytes };
      });
      expect(
        () => validateGate4BArtifacts(fixture.manifest, fixture.results, artifacts),
        path,
      ).toThrow();
    }
  });

  it.each([
    ["invalid UTF-8", (): Uint8Array => Uint8Array.from([0xff, 0xfe, 0x0a]),
      /^B-EXEC-CONFIG: Pass-B manifest is not valid UTF-8$/],
    ["invalid JSON", (): Uint8Array => encoder.encode("{\n"),
      /^B-EXEC-CONFIG: Pass-B manifest is not valid JSON$/],
    ["noncanonical whitespace", (): Uint8Array =>
      encoder.encode(`${canonicalJson(buildGate4BManifest())} \n`),
      /^B-EXEC-CONFIG: Pass-B manifest is not canonical JSON$/],
    ["BOM-prefixed canonical bytes", (): Uint8Array =>
      Uint8Array.from([0xef, 0xbb, 0xbf, ...canonicalJsonBytes(buildGate4BManifest())]),
      /^B-EXEC-CONFIG: Pass-B manifest is not canonical JSON$/],
    ["canonical bytes off the freeze", (): Uint8Array =>
      canonicalJsonBytes({ ...buildGate4BManifest(), canonicalSeedSites: 20 }),
      /^B-EXEC-CONFIG: manifest bytes differ from the freeze$/],
  ] as const)("B-EXEC-CONFIG owns corrupt manifest bytes: %s", (_name, makeBytes, pattern) => {
    const fixture = passingFixture();
    const artifacts = fixture.artifacts.map((artifact) => artifact.path === "manifest.json"
      ? { ...artifact, bytes: makeBytes() }
      : artifact);
    expect(() => validateGate4BArtifacts(fixture.manifest, fixture.results, artifacts))
      .toThrow(pattern);
    expectOnlyFailure("B-EXEC-CONFIG", { artifacts });
  });

  it("requires registered artifact kinds, not only registered paths", () => {
    const fixture = passingFixture();
    const artifacts = fixture.artifacts.map((artifact, index) => index === 0
      ? { ...artifact, kind: "application/octet-stream" }
      : artifact);
    expect(() => validateGate4BArtifacts(fixture.manifest, fixture.results, artifacts)).toThrow();
  });

  it.each([
    ["omitted delta", (result: Gate4BRunResult): Gate4BRunResult => ({
      ...result,
      deltas: [],
    }), /nonempty delta witness is missing/],
    ["duplicate delta index", (result: Gate4BRunResult): Gate4BRunResult => {
      const original = result.deltas[0].indices;
      const indices = [...original, original[0]];
      return {
        ...result,
        deltas: [{ step: 1, indices }],
        rows: [{
          ...result.rows[0],
          attachedCount: result.rows[0].attachedCount + 1,
          deltaCount: indices.length,
          deltaSha256: deltaSha256(indices),
        }],
      };
    }, /duplicate or already attached/],
    ["canonical seed already attached", (result: Gate4BRunResult): Gate4BRunResult => {
      const seedIndex = hexSeedSites(DIMS, 2, 1, CENTER)[0];
      const indices = [...result.deltas[0].indices, seedIndex];
      return {
        ...result,
        deltas: [{ step: 1, indices }],
        rows: [{
          ...result.rows[0],
          attachedCount: result.rows[0].attachedCount + 1,
          deltaCount: indices.length,
          deltaSha256: deltaSha256(indices),
        }],
      };
    }, /duplicate or already attached/],
    ["out-of-range delta index", (result: Gate4BRunResult): Gate4BRunResult => {
      const indices = [...result.deltas[0].indices, cellCount(DIMS)];
      return {
        ...result,
        deltas: [{ step: 1, indices }],
        rows: [{
          ...result.rows[0],
          attachedCount: result.rows[0].attachedCount + 1,
          deltaCount: indices.length,
          deltaSha256: deltaSha256(indices),
        }],
      };
    }, /out of range/],
    ["extent mismatch", (result: Gate4BRunResult): Gate4BRunResult => ({
      ...result,
      rows: [{ ...result.rows[0], iExtent: result.rows[0].iExtent - 1 }],
    }), /row extents shifted/],
    ["finalA mismatch", (result: Gate4BRunResult): Gate4BRunResult => {
      const finalA = result.finalA.slice();
      finalA[idx(DIMS, CENTER[0] + 3, CENTER[1], CENTER[2])] = 0;
      finalA[idx(DIMS, CENTER[0] + 4, CENTER[1] + 4, CENTER[2])] = 1;
      return { ...result, finalA };
    }, /reconstructed occupancy differs from finalA/],
    ["same-extents wrong previous occupancy", (result: Gate4BRunResult): Gate4BRunResult => {
      const previousOccupancy = result.previousOccupancy?.slice() as Uint8Array;
      previousOccupancy[idx(DIMS, CENTER[0], CENTER[1], CENTER[2])] = 0;
      previousOccupancy[idx(DIMS, CENTER[0] + 2, CENTER[1] + 2, CENTER[2])] = 1;
      expect(latticeExtents(previousOccupancy, DIMS)).toEqual(
        latticeExtents(result.previousOccupancy as Uint8Array, DIMS),
      );
      return { ...result, previousOccupancy };
    }, /previous occupancy is not the state before the crossing step/],
    ["duplicated delta witness step", (result: Gate4BRunResult): Gate4BRunResult => ({
      ...result,
      deltas: [result.deltas[0], result.deltas[0]],
    }), /has duplicate delta step 1/],
    ["orphan delta witness beyond the recorded rows", (result: Gate4BRunResult): Gate4BRunResult => ({
      ...result,
      deltas: [...result.deltas, { step: result.rows.length + 1, indices: [0] }],
    }), /orphan delta witness/],
  ] as const)("delta-chain reconstruction rejects mutation: %s", (_name, mutate, pattern) => {
    const result = passingFixture().results.find(
      (candidate) => candidate.config.id === "B-HABIT-TM5",
    ) as Gate4BRunResult;
    expect(() => validateGate4BDeltaChain(mutate(result))).toThrow(pattern);
  });

  it("rejects shifted CSV schema, row identity, and noncanonical numbers", () => {
    const result = passingFixture().results.find(
      (candidate) => candidate.config.id === "B-HABIT-TM15",
    ) as Gate4BRunResult;
    const csv = gate4BSeriesCsv(result.rows);
    expect(validateGate4BSeriesCsv(csv, result.rows)).toEqual(result.rows);
    const controls = [
      csv.replace("step,", "tick,"),
      csv.replace("\n2,", "\n3,"),
      csv.replace("\n1,", "\n01,"),
      csv.slice(0, csv.lastIndexOf("\n", csv.length - 2) + 1),
    ];
    for (const control of controls) {
      expect(() => validateGate4BSeriesCsv(control, result.rows)).toThrow();
    }
  });

  it("scenario payloads record null for a non-finite diagnostic depletion ratio", () => {
    const result = passingFixture().results.find(
      (candidate) => candidate.config.id === "B-HABIT-TM15",
    ) as Gate4BRunResult;
    const changed = {
      ...result,
      depletionSamples: result.depletionSamples.map((sample, index) => index === 0
        ? { ...sample, depletionRatio: Number.NaN }
        : sample),
    };
    const payload = gate4BScenarioPayload(changed) as { depletionSamples: { depletionRatio: unknown }[] };
    expect(payload.depletionSamples[0].depletionRatio).toBeNull();
  });
});

// ── Orchestration, publication, and terminal guards ────────────────────────────────────────

describe("gate4b serial orchestration seams", () => {
  function byIdExecutor(results: readonly Gate4BRunResult[]) {
    const byId = new Map(results.map((result) => [result.config.id, result]));
    return (config: Gate4BRunConfig) => byId.get(config.id) as Gate4BRunResult;
  }

  it("fails a rebuilt-manifest digest shift before provenance or any execution", () => {
    let provenanceCollections = 0;
    let executions = 0;
    const shifted = {
      ...buildGate4BManifest(),
      canonicalSeedSites: 20,
    } as unknown as Gate4BManifest;
    expect(() => runGate4B({
      buildManifest: () => shifted,
      collectProvenance: () => {
        provenanceCollections++;
        return passingProvenance();
      },
      executeRun: () => {
        executions++;
        throw new Error("execution must not run");
      },
    })).toThrow(/B-EXEC-CONFIG: rebuilt Pass-B manifest differs from the reviewed freeze/);
    expect(provenanceCollections).toBe(0);
    expect(executions).toBe(0);
  });

  it("rejects a preexisting canonical directory before provenance, execution, or publish", () => {
    let provenanceCollections = 0;
    let executions = 0;
    let publications = 0;
    expect(() => runGate4B({
      repoRoot,
      canonicalDirectory: "runner",
      collectProvenance: () => {
        provenanceCollections++;
        return passingProvenance();
      },
      executeRun: () => {
        executions++;
        throw new Error("execution must not run");
      },
      publish: () => {
        publications++;
        throw new Error("publish must not run");
      },
    })).toThrow(/B-EXEC-NUMERIC: canonical evidence already exists/);
    expect(provenanceCollections).toBe(0);
    expect(executions).toBe(0);
    expect(publications).toBe(0);
  });

  it("fails provenance preflight before invoking an execution", () => {
    let executions = 0;
    expect(() => runGate4B({
      collectProvenance: () => ({ ...passingProvenance(), trackedStatus: " M tracked" }),
      executeRun: () => {
        executions++;
        throw new Error("execution must not run");
      },
    })).toThrow(/B-EXEC-PROVENANCE/);
    expect(executions).toBe(0);
  });

  it("executes the frozen matrix serially and publishes a verifiable bundle on validity", () => {
    const fixture = passingFixture();
    const canonicalDirectory = join(temporaryDirectory(), "pass-b");
    const calls: string[] = [];
    const byId = byIdExecutor(fixture.results);
    const outcome = runGate4B({
      repoRoot,
      canonicalDirectory,
      collectProvenance: passingProvenance,
      executeRun: (config) => {
        calls.push(config.id);
        return byId(config);
      },
    });
    expect(calls).toEqual(fixture.manifest.runs.map((run) => run.id));
    expect(outcome.verdict.executionValid).toBe(true);
    expect(outcome.verdict.exitCode).toBe(0);
    expect(outcome.publication?.directory).toBe(canonicalDirectory);
    expect(() => verifyEvidenceBundle(canonicalDirectory)).not.toThrow();
    const presentation = formatGate4BTerminalPresentation(outcome);
    expect(presentation.exitCode).toBe(0);
    expect(presentation.stderrLines).toEqual([]);
    expect(presentation.stdoutLines.filter((line) => line.startsWith("GATE4B DIAGNOSTIC ")))
      .toHaveLength(8);
    expect(presentation.stdoutLines.filter((line) => line.startsWith("GATE4B TERMINATION ")))
      .toHaveLength(11);
    expect(presentation.stdoutLines).toContain(
      `GATE4B MANIFEST ${canonicalJson(outcome.manifest)}`,
    );
    expect(presentation.stdoutLines.at(-1)).toBe("GATE4B EXIT STATUS: 0");
  });

  it("records diagnostic morphology misses without blocking exit 0 or publication", () => {
    const fixture = passingFixture();
    const registeredSolid = fixture.manifest.runs.find(
      (run) => run.id === "B-HOLLOW-SEED-3",
    ) as Gate4BRunConfig;
    const solidHollowRun = makeRunResult(registeredSolid, [disc(7, 25)]);
    const results = fixture.results.map((result) =>
      result.config.id === "B-HOLLOW-SEED-3" ? solidHollowRun : result
    );
    const canonicalDirectory = join(temporaryDirectory(), "pass-b-diagnostic-miss");
    const byId = byIdExecutor(results);
    const outcome = runGate4B({
      repoRoot,
      canonicalDirectory,
      collectProvenance: passingProvenance,
      executeRun: (config) => byId(config),
    });
    expect(outcome.verdict.executionValid).toBe(true);
    expect(outcome.verdict.diagnosticPass).toBe(false);
    expect(outcome.verdict.diagnosticFailures).toContain("B-HOLLOW");
    expect(outcome.verdict.exitCode).toBe(0);
    expect(outcome.publication).not.toBeNull();
    const presentation = formatGate4BTerminalPresentation(outcome);
    expect(presentation.exitCode).toBe(0);
    const passedLine = presentation.stdoutLines.find((line) => line.startsWith("GATE4B PASSED "));
    expect(passedLine).toContain('"diagnosticPass":false');
    expect(passedLine).toContain("B-HOLLOW");
  });

  it("an execution-integrity failure publishes nothing and exits 1 by name", () => {
    const fixture = passingFixture();
    const results = replaceResult("B-HABIT-TM5", (result) => ({
      ...result,
      stopReason: "step-cap",
    }));
    const canonicalDirectory = join(temporaryDirectory(), "pass-b-invalid");
    const byId = new Map(results.map((result) => [result.config.id, result]));
    let publications = 0;
    const outcome = runGate4B({
      repoRoot,
      canonicalDirectory,
      collectProvenance: passingProvenance,
      executeRun: (config) => byId.get(config.id) as Gate4BRunResult,
      publish: () => {
        publications++;
        throw new Error("an execution-invalid outcome must not publish");
      },
    });
    expect(publications).toBe(0);
    expect(outcome.verdict.executionValid).toBe(false);
    expect(outcome.publication).toBeNull();
    expect(existsSync(canonicalDirectory)).toBe(false);
    const presentation = formatGate4BTerminalPresentation(outcome);
    expect(presentation.exitCode).toBe(1);
    expect(presentation.stderrLines.join("\n")).toContain("B-EXEC-TERMINATION");
    expect(presentation.stderrLines.at(-1)).toBe("GATE4B EXIT STATUS: 1");
    expect(fixture.results.length).toBe(11);
  });

  function assembledOutcome(
    results: readonly Gate4BRunResult[],
    publication: Gate4BRunOutcome["publication"],
  ): Gate4BRunOutcome {
    const fixture = passingFixture();
    const artifacts = results === fixture.results
      ? fixture.artifacts
      : buildGate4BArtifacts(fixture.manifest, results);
    const records = [
      ...deriveGate4BExecutionRecords({
        provenance: passingProvenance(),
        manifest: fixture.manifest,
        results,
        artifacts,
      }),
      ...deriveGate4BMorphologyRecords(fixture.manifest, results),
    ];
    return {
      manifest: fixture.manifest,
      provenance: passingProvenance(),
      results,
      records,
      verdict: evaluateGate4B(records),
      artifacts,
      publication,
    };
  }

  function syntheticPublication(outcome: Omit<Gate4BRunOutcome, "publication">): NonNullable<Gate4BRunOutcome["publication"]> {
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
      protocol: GATE4B_PROTOCOL,
      pass: "B",
      operator: "LibbrechtKinetics",
      artifacts: payloadDescriptors,
      payload: strictJsonSnapshot({ synthetic: true }),
    };
    const reportBytes = canonicalJsonBytes(report);
    const reportDescriptor = {
      path: "gate4b-report.json",
      kind: "phase4-evidence-report+json",
      byteLength: reportBytes.byteLength,
      sha256: sha256Bytes(reportBytes),
    };
    return {
      directory: "/synthetic/pass-b",
      report,
      index: {
        version: 1,
        publication: "complete",
        report: reportDescriptor,
        artifacts: [reportDescriptor, ...payloadDescriptors],
      },
    };
  }

  it("refuses to present an execution-valid verdict without a verified publication", () => {
    const outcome = assembledOutcome(passingFixture().results, null);
    expect(outcome.verdict.executionValid).toBe(true);
    expect(() => formatGate4BTerminalPresentation(outcome))
      .toThrow(/^B-EXEC-NUMERIC: execution-valid verdict requires a verified publication$/);
  });

  it("refuses to present an execution-invalid verdict that carries a publication", () => {
    const results = replaceResult("B-HABIT-TM5", (result) => ({
      ...result,
      stopReason: "step-cap",
    }));
    const withoutPublication = assembledOutcome(results, null);
    expect(withoutPublication.verdict.executionValid).toBe(false);
    const outcome: Gate4BRunOutcome = {
      ...withoutPublication,
      publication: syntheticPublication(withoutPublication),
    };
    expect(() => formatGate4BTerminalPresentation(outcome))
      .toThrow(/^B-EXEC-NUMERIC: execution-invalid verdict must not carry a publication$/);
  });
});

// ── Real LK integration at tiny dims ───────────────────────────────────────────────────────

describe("gate4b real solver integration (tiny dims)", () => {
  function tinyConfig(overrides: Partial<Gate4BRunConfig> & { id: string }): Gate4BRunConfig {
    const base = buildGate4BManifest().runs[0];
    return {
      ...base,
      dims: { nx: 14, ny: 14, nz: 14 },
      tempC: -5,
      sigmaInfinity: 0.01,
      targetLargestExtent: 8,
      stepCap: 500,
      depletionTargets: [],
      schedule: null,
      replayOf: null,
      noiseEpsilon: 0,
      noiseStreamId: null,
      scenario: "habit",
      ...overrides,
    } as Gate4BRunConfig;
  }

  it("executes a real run with per-step witnesses, chain, CSV, and checkpoint intact", () => {
    const result = executeGate4BScenario(tinyConfig({ id: "TINY-PLAIN" }));
    expect(result.stopReason).toBe("size-target");
    expect(result.rows.length).toBeGreaterThan(3);
    expect(result.extentCrossing?.crossingStep).toBe(result.rows.length);
    for (const row of result.rows) {
      const error = Math.abs(
        row.deltaPlacedFill + row.deltaSaturationClippedFill - row.independentDemand,
      );
      expect(error).toBeLessThanOrEqual(1e-12 * Math.max(1, Math.abs(row.independentDemand)));
      const recomputedDivergence = Math.abs(row.shellInjection - row.surfaceExchange) /
        Math.max(Math.abs(row.surfaceExchange), 1e-300);
      expect(recomputedDivergence).toBeLessThan(1e-7);
      expect(row.deltaSymmetric).not.toBe(false);
    }
    expect(() => validateGate4BDeltaChain(result)).not.toThrow();
    expect(validateGate4BSeriesCsv(gate4BSeriesCsv(result.rows), result.rows)).toEqual(result.rows);
    expect(() => verifyGate4BCheckpoint(result.checkpoint, result)).not.toThrow();
    const depletion = tinyConfig({ id: "TINY-DEPLETION", depletionTargets: [6, 7, 8] });
    const sampled = executeGate4BScenario(depletion);
    expect(sampled.depletionSamples.map((sample) => sample.targetExtent)).toEqual([6, 7, 8]);
  });

  it("captures a validated dual-outcome noise witness and replays bit-identically", () => {
    const config = tinyConfig({
      id: "TINY-NOISE",
      tempC: -15,
      sigmaInfinity: 0.002,
      stepCap: 25,
      noiseEpsilon: 0.001,
      noiseStreamId: STREAM_NOISE_ALPHA_HK,
    });
    const first = executeGate4BScenario(config);
    const witness = first.noiseWitness as Gate4BNoiseWitness;
    expect(witness.tick).toBe(0);
    expect(witness.streamId).toBe(STREAM_NOISE_ALPHA_HK);
    expect(validateGate4BNoiseWitness(witness, config)).toEqual([]);
    expect(validateGate4BNoiseWitness({ ...witness, streamId: 1 }, config)).not.toEqual([]);
    const replay = executeGate4BScenario(config);
    expect(replay.finalA).toEqual(first.finalA);
    expect([...replay.finalF]).toEqual([...first.finalF]);
    expect([...replay.finalSigma]).toEqual([...first.finalSigma]);
    expect(canonicalJson(replay.rows)).toBe(canonicalJson(first.rows));
  });

  it("fires a real timeline event exactly once with a bitwise-verified density transform", () => {
    const schedule: LKTimelineSchedule = {
      version: 1,
      mode: "abrupt",
      operator: "LibbrechtKinetics",
      initialEnvironment: { tempC: -5, sigmaInfinity: 0.01 },
      events: [{
        index: 0,
        operator: "LibbrechtKinetics",
        trigger: { kind: "largestExtent", value: 7 },
        environment: { tempC: -10, sigmaInfinity: 0.01 },
      }],
    };
    const config = tinyConfig({ id: "TINY-TIMELINE", scenario: "timeline", schedule });
    const result = executeGate4BScenario(config);
    const timeline = result.timeline as NonNullable<Gate4BRunResult["timeline"]>;
    expect(timeline.eventLog).toHaveLength(1);
    const entry = timeline.eventLog[0];
    expect(entry.crossingBoundary.completedCycles).toBe(timeline.eventStep);
    if (
      entry.previousBoundary?.phase === "afterInterfaceStep" &&
      entry.crossingBoundary.phase === "afterInterfaceStep"
    ) {
      expect(entry.previousBoundary.extents.largestExtent).toBeLessThan(7);
      expect(entry.crossingBoundary.extents.largestExtent).toBeGreaterThanOrEqual(7);
    } else {
      throw new Error("timeline boundaries must be raw extent boundaries");
    }
    for (const row of result.rows) {
      expect(row.tempC).toBe(row.step > timeline.eventStep ? -10 : -5);
    }
    // The executor already required a bit-identical independent transform; recompute once
    // more from the retained raw witness to prove the retained artifact stands alone.
    const chain = validateGate4BDeltaChain(result);
    const expectation = gate4BTimelineTransitionExpectation(
      config,
      chain.occupancyAtEventStep as Uint8Array,
      timeline.sigmaBefore,
      schedule.initialEnvironment,
      schedule.events[0].environment,
      timeline.eventStep,
      result.rows[timeline.eventStep - 1].simTimeSeconds,
    );
    expect(canonicalJson(timeline.transitionReport)).toBe(canonicalJson(expectation.report));
    expect([...timeline.sigmaAfter]).toEqual([...expectation.sigmaAfter]);
  });

  it("a warm-to-cold-to-warm density transform preserves negative supersaturation in a real run", () => {
    const schedule: LKTimelineSchedule = {
      version: 1,
      mode: "abrupt",
      operator: "LibbrechtKinetics",
      initialEnvironment: { tempC: -10, sigmaInfinity: 0.01 },
      events: [{
        index: 0,
        operator: "LibbrechtKinetics",
        trigger: { kind: "largestExtent", value: 7 },
        environment: { tempC: -5, sigmaInfinity: 0.01 },
      }],
    };
    const config = tinyConfig({
      id: "TINY-TIMELINE-NEGATIVE",
      scenario: "timeline",
      tempC: -10,
      schedule,
    });
    const result = executeGate4BScenario(config);
    const timeline = result.timeline as NonNullable<Gate4BRunResult["timeline"]>;
    let negatives = 0;
    for (const value of timeline.sigmaAfter) if (value < 0) negatives++;
    expect(negatives).toBeGreaterThan(0);
    for (const value of timeline.sigmaAfter) expect(value).toBeGreaterThanOrEqual(-1);
  });

  it("rejects a config shift before constructing or stepping the registered run", () => {
    const registered = buildGate4BManifest().runs[0];
    expect(() => executeGate4BRun({
      ...registered,
      rngSeed: registered.rngSeed + 1,
    })).toThrow(/B-EXEC-CONFIG/);
  });

  it("keeps the registered targets and caps out of reach of the scenario seam in the CLI path", () => {
    // executeGate4BRun only accepts byte-exact frozen configurations; the scenario seam used
    // by tiny tests is not reachable from the flagless CLI.
    const registered = buildGate4BManifest().runs[0];
    expect(() => executeGate4BRun({
      ...registered,
      stepCap: 10,
    })).toThrow(/B-EXEC-CONFIG: .* differs from the frozen manifest/);
    expect(GATE4B_TARGET_LARGEST_EXTENT).toBe(24);
    expect(GATE4B_STEP_CAP).toBe(50_000);
  });
});
