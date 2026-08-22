// Independent Phase 10 C0V moving-interface reference derivation.
//
// This module deliberately owns its integer lattice, neighbor enumeration, nonlinear solve,
// smoother, event update, and ledger arithmetic. It must not import core, solver-cpu, LKSolver,
// a production topology helper, a production adapter, or the separate reference checker.

import {
  phase10C0VMovingReferenceInput,
  parsePhase10C0VMovingProtocol,
  type Phase10C0VMovingActiveCellRow,
  type Phase10C0VMovingBoundaryRow,
  type Phase10C0VMovingCycleRecord,
  type Phase10C0VMovingFieldRow,
  type Phase10C0VMovingFixture,
  type Phase10C0VMovingProtocol,
  type Phase10C0VMovingReferenceCandidate,
  type Phase10C0VMovingReferenceInput,
  type Phase10C0VMovingRelaxationRecord,
  type Phase10C0VMovingStateRecord,
  type Phase10C0VMovingTopology,
  type Phase10C0VNumericIdentity,
} from "./phase10-c0v-contracts.ts";

type FacetClass = "basal" | "inhibited" | "prism" | "rough";
type Triple = readonly [number, number, number];

type MovingFixture = Phase10C0VMovingFixture;
type MovingKineticInputs = Phase10C0VMovingFixture["kineticInputs"];
type MovingTopology = Phase10C0VMovingTopology;
type ParsedMovingInput = Phase10C0VMovingReferenceInput;
type Phase10C0VMovingRelaxation = Phase10C0VMovingRelaxationRecord;
type Phase10C0VMovingState = Phase10C0VMovingStateRecord;
type Phase10C0VMovingCycle = Phase10C0VMovingCycleRecord;

interface Geometry {
  readonly dims: Triple;
  readonly center: Triple;
  readonly count: number;
  readonly active: Uint8Array;
  readonly shell: Uint8Array;
  readonly neighbors: readonly (readonly (number | null)[])[];
  readonly activeIndices: readonly number[];
}

interface SweepResult {
  readonly field: Float64Array;
  readonly boundaryRows: readonly Phase10C0VMovingBoundaryRow[];
  readonly relaxation: Phase10C0VMovingRelaxation;
}

const DERIVE_NEIGHBOR_OFFSETS = Object.freeze([
  Object.freeze([1, 0, 0] as const),
  Object.freeze([-1, 0, 0] as const),
  Object.freeze([0, 1, 0] as const),
  Object.freeze([0, -1, 0] as const),
  Object.freeze([1, -1, 0] as const),
  Object.freeze([-1, 1, 0] as const),
  Object.freeze([0, 0, 1] as const),
  Object.freeze([0, 0, -1] as const),
]);

const OPPOSITE_DIRECTION = Object.freeze([1, 0, 3, 2, 5, 4, 7, 6] as const);
const PRE_EVENT_TRANSFORM_NUMERATOR = 98;
const PRE_EVENT_TRANSFORM_DENOMINATOR = 95;
const MAX_BISECTION_ITERATIONS = 256;

function fail(detail: string): never {
  throw new Error(`Phase 10 C0V moving reference derivation refused: ${detail}`);
}

function identify(value: number): Phase10C0VNumericIdentity {
  if (!Number.isFinite(value)) fail("cannot identify a non-finite numerical result");
  const normalized = Object.is(value, -0) ? 0 : value;
  const buffer = new ArrayBuffer(8);
  new DataView(buffer).setFloat64(0, normalized, false);
  const binary64Hex = [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return Object.freeze({ decimal: normalized.toString(), binary64Hex });
}

function sameNumbers(actual: readonly number[], expected: readonly number[], label: string): void {
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    fail(`${label} differs from independent integer-topology enumeration`);
  }
}

function linearIndex(dims: Triple, i: number, j: number, k: number): number {
  return k * dims[0] * dims[1] + j * dims[0] + i;
}

function coordinates(dims: Triple, index: number): Triple {
  const plane = dims[0] * dims[1];
  const k = Math.floor(index / plane);
  const remainder = index - k * plane;
  const j = Math.floor(remainder / dims[0]);
  return Object.freeze([remainder - j * dims[0], j, k]);
}

function deriveHexDistance(di: number, dj: number): number {
  return (Math.abs(di) + Math.abs(dj) + Math.abs(di + dj)) / 2;
}

function buildGeometry(fixture: MovingFixture): Geometry {
  const dims = fixture.dimensions;
  const center = fixture.center;
  const count = dims[0] * dims[1] * dims[2];
  const active = new Uint8Array(count);
  const shell = new Uint8Array(count);
  const activeIndices: number[] = [];
  const radius = Math.min(center[0], dims[0] - 1 - center[0], center[1], dims[1] - 1 - center[1]);
  const halfZ = Math.min(center[2], dims[2] - 1 - center[2]);
  for (let k = 0; k < dims[2]; k++) {
    for (let j = 0; j < dims[1]; j++) {
      for (let i = 0; i < dims[0]; i++) {
        const index = linearIndex(dims, i, j, k);
        const distance = deriveHexDistance(i - center[0], j - center[1]);
        if (distance <= radius && Math.abs(k - center[2]) <= halfZ) {
          active[index] = 1;
          activeIndices.push(index);
          if (distance === radius || Math.abs(k - center[2]) === halfZ) shell[index] = 1;
        }
      }
    }
  }
  const neighbors: (readonly (number | null)[])[] = [];
  for (let index = 0; index < count; index++) {
    const [i, j, k] = coordinates(dims, index);
    neighbors.push(Object.freeze(DERIVE_NEIGHBOR_OFFSETS.map(([di, dj, dk]) => {
      const ni = i + di;
      const nj = j + dj;
      const nk = k + dk;
      return ni >= 0 && ni < dims[0] && nj >= 0 && nj < dims[1] && nk >= 0 && nk < dims[2]
        ? linearIndex(dims, ni, nj, nk)
        : null;
    })));
  }
  return Object.freeze({
    dims,
    center,
    count,
    active,
    shell,
    neighbors: Object.freeze(neighbors),
    activeIndices: Object.freeze(activeIndices),
  });
}

function deriveBoundary(geometry: Geometry, attached: Uint8Array): readonly number[] {
  const result: number[] = [];
  for (const index of geometry.activeIndices) {
    if (attached[index] === 1) continue;
    if (geometry.neighbors[index]!.some((neighbor) =>
      neighbor !== null && geometry.active[neighbor] === 1 && attached[neighbor] === 1)) {
      result.push(index);
    }
  }
  return Object.freeze(result);
}

function neighborCounts(geometry: Geometry, attached: Uint8Array, index: number): readonly [number, number] {
  let nT = 0;
  let nZ = 0;
  for (let direction = 0; direction < 8; direction++) {
    const neighbor = geometry.neighbors[index]![direction];
    if (neighbor !== null && geometry.active[neighbor] === 1 && attached[neighbor] === 1) {
      if (direction < 6) nT++;
      else nZ++;
    }
  }
  return Object.freeze([nT, nZ]);
}

function facetClass(nT: number, nZ: number): FacetClass {
  if (nT === 0 && (nZ === 1 || nZ === 2)) return "basal";
  if (nT === 1 && nZ === 0) return "inhibited";
  if (nT === 2 && nZ === 0) return "prism";
  return "rough";
}

function physicalScales(fixture: MovingFixture): {
  readonly cSat: number;
  readonly vKin: number;
  readonly x0: number;
  readonly q: number;
  readonly dxM: number;
} {
  const constants = fixture.physicalConstants;
  const temperatureK = fixture.tempC + constants.celsiusZeroK;
  if (!(temperatureK > 0)) fail("derived temperature must be positive");
  const saturationPressurePa =
    constants.saturationPressurePrefactorMbar *
    Math.exp(constants.saturationPressureExponentK / temperatureK) *
    constants.mbarToPa;
  const cSat = saturationPressurePa / (constants.kBoltzmannJPerK * temperatureK);
  const diffusivity = constants.diffusivityAir1AtmM2S *
    (constants.standardAtmospherePa / fixture.pressurePa);
  const thermalSpeed = Math.sqrt(
    (constants.kBoltzmannJPerK * temperatureK) /
      (2 * Math.PI * constants.waterMoleculeMassKg),
  );
  const vKin = (cSat / constants.iceNumberDensityPerM3) * thermalSpeed;
  const x0 = (cSat / constants.iceNumberDensityPerM3) * (diffusivity / vKin);
  const dxM = fixture.dxUm * 1e-6;
  const q = dxM / x0;
  for (const [name, value] of Object.entries({ cSat, vKin, x0, q, dxM })) {
    if (!Number.isFinite(value) || !(value > 0)) fail(`derived ${name} must be positive and finite`);
  }
  return Object.freeze({ cSat, vKin, x0, q, dxM });
}

function basalCoefficient(sigma: number, kinetic: MovingKineticInputs): number {
  if (!(sigma > 0)) return 0;
  return kinetic.basalPrefactor * Math.exp(-kinetic.basalSigma0 / sigma);
}

function bisectIncreasing(
  lower: number,
  upper: number,
  evaluate: (value: number) => number,
): { readonly lower: number; readonly upper: number; readonly selected: number; readonly residual: number; readonly iterations: number } {
  let lo = lower;
  let hi = upper;
  let fLo = evaluate(lo);
  let fHi = evaluate(hi);
  if (!(fLo <= 0 && fHi >= 0)) fail("nonlinear boundary root is not bracketed");
  let iterations = 0;
  while (iterations < MAX_BISECTION_ITERATIONS) {
    const midpoint = (lo + hi) / 2;
    if (midpoint === lo || midpoint === hi) break;
    const fMid = evaluate(midpoint);
    if (!Number.isFinite(fMid)) fail("nonlinear boundary residual became non-finite");
    if (fMid <= 0) {
      lo = midpoint;
      fLo = fMid;
    } else {
      hi = midpoint;
      fHi = fMid;
    }
    iterations++;
  }
  const useLower = Math.abs(fLo) <= Math.abs(fHi);
  return Object.freeze({
    lower: lo,
    upper: hi,
    selected: useLower ? lo : hi,
    residual: useLower ? fLo : fHi,
    iterations,
  });
}

function solvePreEventScalar(fixture: MovingFixture, q: number): {
  readonly lower: number;
  readonly upper: number;
  readonly selected: number;
  readonly residual: number;
  readonly iterations: number;
} {
  const infinity = fixture.sigmaInfinity;
  const kinetic = fixture.kineticInputs;
  const evaluate = (sigma: number): number => {
    if (sigma === 0) return -infinity;
    return sigma * (
      1 +
      (PRE_EVENT_TRANSFORM_NUMERATOR / PRE_EVENT_TRANSFORM_DENOMINATOR) *
        q * basalCoefficient(sigma, kinetic)
    ) - infinity;
  };
  return bisectIncreasing(0, infinity, evaluate);
}

function boundaryCoefficient(facet: FacetClass, sigma: number, kinetic: MovingKineticInputs): number {
  if (!(sigma > 0) || facet === "inhibited") return 0;
  if (facet === "basal") return basalCoefficient(sigma, kinetic);
  if (facet === "rough") return 1;
  fail("the frozen moving fixture unexpectedly produced a prism boundary cell");
}

function solveBoundaryValue(
  facet: FacetClass,
  sigmaOpp: number,
  q: number,
  kinetic: MovingKineticInputs,
): readonly [number, number] {
  if (!(sigmaOpp > 0)) return Object.freeze([0, sigmaOpp]);
  if (facet === "inhibited") return Object.freeze([0, sigmaOpp]);
  if (facet === "rough") {
    const sigma = sigmaOpp / (1 + q);
    return Object.freeze([1, sigma]);
  }
  const root = bisectIncreasing(0, sigmaOpp, (sigma) =>
    sigma * (1 + q * boundaryCoefficient(facet, sigma, kinetic)) - sigmaOpp);
  return Object.freeze([boundaryCoefficient(facet, root.selected, kinetic), root.selected]);
}

function kahanSum(values: readonly number[]): number {
  let sum = 0;
  let correction = 0;
  for (const value of values) {
    const adjusted = value - correction;
    const next = sum + adjusted;
    correction = (next - sum) - adjusted;
    sum = next;
  }
  return sum;
}

function sweepFixedState(
  geometry: Geometry,
  attached: Uint8Array,
  boundary: readonly number[],
  source: Float64Array,
  fill: Float64Array,
  fixture: MovingFixture,
  q: number,
  vKin: number,
  dxM: number,
): SweepResult {
  const inPlane = new Float64Array(geometry.count);
  const candidate = new Float64Array(geometry.count);
  const driftTerms: number[] = [];
  let maxAbsSweepInput = 0;
  for (let index = 0; index < geometry.count; index++) {
    if (geometry.active[index] === 0 || attached[index] === 1) continue;
    const own = source[index]!;
    const values: number[] = [];
    for (let direction = 0; direction < 6; direction++) {
      const neighbor = geometry.neighbors[index]![direction];
      values.push(
        neighbor !== null && geometry.active[neighbor] === 1 && attached[neighbor] === 0
          ? source[neighbor]!
          : own,
      );
    }
    const pairSums = [values[0]! + values[1]!, values[2]! + values[3]!, values[4]! + values[5]!]
      .sort((left, right) => left - right);
    inPlane[index] = (((own + pairSums[0]!) + pairSums[1]!) + pairSums[2]!) / 7;
  }
  for (let index = 0; index < geometry.count; index++) {
    if (geometry.active[index] === 0 || attached[index] === 1) continue;
    const own = inPlane[index]!;
    const upIndex = geometry.neighbors[index]![6];
    const downIndex = geometry.neighbors[index]![7];
    const up = upIndex !== null && geometry.active[upIndex] === 1 && attached[upIndex] === 0
      ? inPlane[upIndex]!
      : own;
    const down = downIndex !== null && geometry.active[downIndex] === 1 && attached[downIndex] === 0
      ? inPlane[downIndex]!
      : own;
    candidate[index] = (4 / 7) * own + (3 / 14) * (up + down);
    driftTerms.push(candidate[index]! - source[index]!);
    maxAbsSweepInput = Math.max(maxAbsSweepInput, Math.abs(source[index]!));
  }

  const boundaryRows: Phase10C0VMovingBoundaryRow[] = [];
  let surfaceExchange = 0;
  const replacements = new Map<number, number>();
  for (const index of boundary) {
    const counts = neighborCounts(geometry, attached, index);
    const facet = facetClass(counts[0], counts[1]);
    const opposingIndices: number[] = [];
    const operands: number[] = [];
    for (let direction = 0; direction < 8; direction++) {
      const attachedNeighbor = geometry.neighbors[index]![direction];
      const opposite = geometry.neighbors[index]![OPPOSITE_DIRECTION[direction] as number];
      if (
        attachedNeighbor !== null &&
        geometry.active[attachedNeighbor] === 1 &&
        attached[attachedNeighbor] === 1 &&
        opposite !== null &&
        geometry.active[opposite] === 1 &&
        attached[opposite] === 0
      ) {
        opposingIndices.push(opposite);
        operands.push(candidate[opposite]!);
      }
    }
    const sortedOperands = operands.sort((left, right) => left - right);
    const sigmaOpp = sortedOperands.length === 0 ? 0 : kahanSum(sortedOperands) / sortedOperands.length;
    const [alphaHK, sigmaBoundary] = solveBoundaryValue(facet, sigmaOpp, q, fixture.kineticInputs);
    const fillRate = alphaHK * vKin * sigmaBoundary / dxM;
    surfaceExchange += candidate[index]! - sigmaBoundary;
    replacements.set(index, sigmaBoundary);
    boundaryRows.push(Object.freeze({
      linearIndex: index,
      nT: counts[0],
      nZ: counts[1],
      facetClass: facet,
      opposingIndices: Object.freeze(opposingIndices),
      sigmaOpp: identify(sigmaOpp),
      sigmaBoundary: identify(sigmaBoundary),
      alphaHK: identify(alphaHK),
      fillRatePerSecond: identify(fillRate),
    }));
  }
  for (const [index, replacement] of replacements) candidate[index] = replacement;

  let shellClamp = 0;
  for (const index of geometry.activeIndices) {
    if (geometry.shell[index] === 1 && attached[index] === 0) {
      shellClamp += fixture.sigmaInfinity - candidate[index]!;
      candidate[index] = fixture.sigmaInfinity;
    }
  }
  let maxChange = 0;
  for (const index of geometry.activeIndices) {
    if (attached[index] === 0) maxChange = Math.max(maxChange, Math.abs(candidate[index]! - source[index]!));
  }
  const smootherDrift = kahanSum(driftTerms);
  const divergenceDifference = shellClamp + smootherDrift - surfaceExchange;
  const divergence = Math.abs(divergenceDifference) / Math.max(Math.abs(surfaceExchange), 1e-300);
  const residual = maxChange / fixture.sigmaInfinity;
  const driftLimit = maxAbsSweepInput === 0
    ? 0
    : 1024 * geometry.activeIndices.length * Math.max(Number.EPSILON * maxAbsSweepInput, Number.MIN_VALUE);
  if (Math.abs(smootherDrift) > driftLimit) fail("independent smoother drift exceeds the frozen float64 bound");
  const relaxation: Phase10C0VMovingRelaxation = Object.freeze({
    sweeps: 1,
    residual: identify(residual),
    converged: residual < fixture.relaxTol && divergence < fixture.divTol,
    divergenceResidual: identify(divergence),
    shellClampDiagnostic: identify(shellClamp),
    surfaceExchangeDiagnostic: identify(surfaceExchange),
    smootherDriftDiagnostic: identify(smootherDrift),
    smootherDriftLimit: identify(driftLimit),
    maxAbsSweepInput: identify(maxAbsSweepInput),
  });
  void fill;
  return Object.freeze({
    field: candidate,
    boundaryRows: Object.freeze(boundaryRows),
    relaxation,
  });
}

function fieldRows(
  geometry: Geometry,
  attached: Uint8Array,
  fill: Float64Array,
  field: Float64Array,
): readonly Phase10C0VMovingFieldRow[] {
  const rows: Phase10C0VMovingFieldRow[] = [];
  for (let index = 0; index < geometry.count; index++) {
    rows.push(Object.freeze({
      linearIndex: index,
      attached: attached[index] === 1,
      wall: geometry.active[index] === 0,
      fill: identify(fill[index]!),
      sigma: identify(field[index]!),
    }));
  }
  return Object.freeze(rows);
}

function state(
  geometry: Geometry,
  attached: Uint8Array,
  boundary: readonly number[],
  fill: Float64Array,
  field: Float64Array,
  sweep: SweepResult,
): Phase10C0VMovingState {
  return Object.freeze({
    attachedIndices: Object.freeze(geometry.activeIndices.filter((index) => attached[index] === 1)),
    boundaryIndices: Object.freeze([...boundary]),
    fieldRows: fieldRows(geometry, attached, fill, field),
    boundaryRows: sweep.boundaryRows,
    relaxation: sweep.relaxation,
  });
}

function value(identity: Phase10C0VNumericIdentity): number {
  return Number(identity.decimal);
}

/**
 * Derive the raw moving-interface reference candidate. S5b must still wrap this raw value with
 * the separately coded checker result and the frozen code/import receipt.
 */
export function derivePhase10C0VMovingReferenceFromInput(
  input: Phase10C0VMovingReferenceInput,
): Phase10C0VMovingReferenceCandidate {
  const { fixture, topology } = input;
  if (topology.linearIndexRule !== "i + ni * (j + nj * k)" ||
    topology.neighborOffsets.length !== DERIVE_NEIGHBOR_OFFSETS.length ||
    topology.neighborOffsets.some((offset, index) =>
      offset.length !== 3 || offset.some((value, axis) => value !== DERIVE_NEIGHBOR_OFFSETS[index]![axis]))) {
    fail("topology index rule or ordered neighbor offsets differ");
  }
  const geometry = buildGeometry(fixture);
  const attached = new Uint8Array(geometry.count);
  const centerIndex = linearIndex(geometry.dims, geometry.center[0], geometry.center[1], geometry.center[2]);
  attached[centerIndex] = 1;
  const initialAttached = Object.freeze([centerIndex]);
  const initialBoundary = deriveBoundary(geometry, attached);
  sameNumbers(initialAttached, topology.initialAttachedIndices, "topology.initialAttachedIndices");
  sameNumbers(initialBoundary, topology.initialBoundaryIndices, "topology.initialBoundaryIndices");

  const scales = physicalScales(fixture);
  const scalar = solvePreEventScalar(fixture, scales.q);
  const initialField = new Float64Array(geometry.count);
  const initialFill = new Float64Array(geometry.count);
  // Match the production state invariant: an already attached cell carries a full unit fill.
  // This seed fill is initial state, not kinetic demand placed by the event loop below.
  initialFill[centerIndex] = 1;
  const initialHoleFillIndices = initialBoundary.filter((index) => {
    const [nT, nZ] = neighborCounts(geometry, attached, index);
    return initialFill[index]! < 1 && nT >= 4 && nZ >= 1;
  });
  const initialHoleFillDeficit = initialHoleFillIndices.reduce(
    (sum, index) => sum + (1 - initialFill[index]!),
    0,
  );
  if (
    initialHoleFillIndices.length !== input.criteria.holeFillExact.count ||
    initialHoleFillDeficit !== input.criteria.holeFillExact.deficit
  ) {
    fail("independently enumerated start-of-step hole-fill predicate differs from the frozen criterion");
  }
  for (const index of geometry.activeIndices) initialField[index] = fixture.sigmaInfinity;
  initialField[centerIndex] = 0;
  for (const index of topology.tiedOrbitIndices) {
    if (!initialBoundary.includes(index)) fail("tied orbit contains a non-boundary index");
    initialField[index] = scalar.selected;
  }
  const preSweep = sweepFixedState(
    geometry,
    attached,
    initialBoundary,
    initialField,
    initialFill,
    fixture,
    scales.q,
    scales.vKin,
    scales.dxM,
  );
  if (!preSweep.relaxation.converged) fail("pre-event independent fixed point missed relaxation criteria");
  const preDifference = Math.max(...geometry.activeIndices.map((index) =>
    Math.abs(preSweep.field[index]! - initialField[index]!)));
  if (preDifference / fixture.sigmaInfinity >= fixture.relaxTol) {
    fail("pre-event scalar root does not reproduce the explicit field recurrence");
  }

  const rates = new Map<number, number>();
  for (const row of preSweep.boundaryRows) rates.set(row.linearIndex, value(row.fillRatePerSecond));
  const orderedRates = [...rates.values()].sort((left, right) => right - left);
  const maxRate = orderedRates[0] ?? 0;
  if (!(maxRate > 0)) fail("moving fixture has no positive first-event rate");
  const tiedRateIndices = [...rates.entries()]
    .filter(([, rate]) => Object.is(rate, maxRate))
    .map(([index]) => index)
    .sort((left, right) => left - right);
  sameNumbers(tiedRateIndices, topology.tiedOrbitIndices, "topology.tiedOrbitIndices");
  const nextRate = orderedRates.find((rate) => rate < maxRate) ?? 0;
  const tieMargin = maxRate - nextRate;

  const workingFill = new Float64Array(initialFill);
  const cycles: Phase10C0VMovingCycle[] = [];
  let cumulativeTime = 0;
  let placedFill = 0;
  let clippedFill = 0;
  let kineticDemand = 0;
  let eventAttached: readonly number[] = Object.freeze([]);
  let preEventFill = new Float64Array(workingFill);
  for (let stepOrdinal = 1; stepOrdinal <= fixture.maxSweeps; stepOrdinal++) {
    const deltaTime = fixture.cflFill / maxRate;
    cumulativeTime += deltaTime;
    let placedDelta = 0;
    let clippedDelta = 0;
    let demandDelta = 0;
    let maxIncrement = 0;
    const attaching: number[] = [];
    preEventFill = new Float64Array(workingFill);
    for (const index of initialBoundary) {
      const raw = (rates.get(index) ?? 0) * deltaTime;
      const room = 1 - workingFill[index]!;
      demandDelta += raw;
      maxIncrement = Math.max(maxIncrement, raw);
      if (raw >= room) {
        placedDelta += room;
        clippedDelta += raw - room;
        workingFill[index] = 1;
        attaching.push(index);
      } else {
        placedDelta += raw;
        workingFill[index] += raw;
      }
    }
    placedFill += placedDelta;
    clippedFill += clippedDelta;
    kineticDemand += demandDelta;
    cycles.push(Object.freeze({
      stepOrdinal,
      deltaTimeSeconds: identify(deltaTime),
      cumulativeTimeSeconds: identify(cumulativeTime),
      maxKineticFillIncrement: identify(maxIncrement),
      placedFillDelta: identify(placedDelta),
      saturationClippedFillDelta: identify(clippedDelta),
      kineticDemandDelta: identify(demandDelta),
      attachedIndices: Object.freeze(attaching),
    }));
    if (attaching.length > 0) {
      eventAttached = Object.freeze(attaching);
      break;
    }
  }
  if (eventAttached.length === 0) fail("moving fixture did not reach its first event");
  sameNumbers(eventAttached, topology.tiedOrbitIndices, "first attaching orbit");

  const postAttachedMask = new Uint8Array(attached);
  for (const index of eventAttached) postAttachedMask[index] = 1;
  const postAttached = Object.freeze(geometry.activeIndices.filter((index) => postAttachedMask[index] === 1));
  const postBoundary = deriveBoundary(geometry, postAttachedMask);
  sameNumbers(postAttached, topology.postAttachedIndices, "topology.postAttachedIndices");
  sameNumbers(postBoundary, topology.postBoundaryIndices, "topology.postBoundaryIndices");

  const postField = new Float64Array(geometry.count);
  const postFill = new Float64Array(workingFill);
  for (const index of geometry.activeIndices) {
    if (postAttachedMask[index] === 1) {
      postField[index] = 0;
      postFill[index] = 1;
    } else {
      if (geometry.shell[index] !== 1) fail("post-event fixture left a non-shell vapor cell");
      postField[index] = fixture.sigmaInfinity;
    }
  }
  const postSweep = sweepFixedState(
    geometry,
    postAttachedMask,
    postBoundary,
    postField,
    postFill,
    fixture,
    scales.q,
    scales.vKin,
    scales.dxM,
  );
  if (!postSweep.relaxation.converged) fail("post-event independent fixed point missed relaxation criteria");
  for (let index = 0; index < geometry.count; index++) {
    if (!Object.is(postSweep.field[index], postField[index])) {
      fail("post-event field is not the frozen exact shell/zero fixed point");
    }
  }

  const activeCells = Object.freeze(geometry.activeIndices.map((index) => {
    const [i, j, k] = coordinates(geometry.dims, index);
    return Object.freeze({
      linearIndex: index,
      i,
      j,
      k,
      di: i - geometry.center[0],
      dj: j - geometry.center[1],
      dk: k - geometry.center[2],
      shell: geometry.shell[index] === 1,
    });
  }));
  const neighborTable = Object.freeze(geometry.activeIndices.map((index) => Object.freeze({
    linearIndex: index,
    neighbors: geometry.neighbors[index]!,
  })));
  const initialState = state(
    geometry,
    attached,
    initialBoundary,
    initialFill,
    initialField,
    preSweep,
  );
  const postState = state(
    geometry,
    postAttachedMask,
    postBoundary,
    postFill,
    postField,
    postSweep,
  );
  const placedFillVaporUnits = placedFill * fixture.physicalConstants.iceNumberDensityPerM3 / scales.cSat;
  return Object.freeze({
    schema: "phase10-c0v-moving-reference-candidate-v1",
    protocolId: input.protocolId,
    method: "independent-integer-topology-scalar-bisection",
    activeCells,
    neighborTable,
    initialState,
    cycles: Object.freeze(cycles),
    event: Object.freeze({
      eventOrdinal: topology.eventOrdinal,
      eventStepOrdinal: cycles.length,
      tiedOrbitIndices: topology.tiedOrbitIndices,
      maxRatePerSecond: identify(maxRate),
      nextRatePerSecond: identify(nextRate),
      tieMarginPerSecond: identify(tieMargin),
      eventTimeSeconds: identify(cumulativeTime),
      preEventFillRows: Object.freeze(initialBoundary.map((index) => Object.freeze({
        linearIndex: index,
        fill: identify(preEventFill[index]!),
      }))),
      attachedIndices: eventAttached,
    }),
    postState,
    ledger: Object.freeze({
      placedFillIceCells: identify(placedFill),
      saturationClippedFillIceCells: identify(clippedFill),
      kineticDemandIceCells: identify(kineticDemand),
      holeFillDeficitIceCells: identify(initialHoleFillDeficit),
      holeFillCount: initialHoleFillIndices.length,
      placedFillVaporUnits: identify(placedFillVaporUnits),
    }),
    convergence: Object.freeze({
      scalarRoot: Object.freeze({
        lowerEndpoint: identify(scalar.lower),
        upperEndpoint: identify(scalar.upper),
        selectedRoot: identify(scalar.selected),
        residual: identify(scalar.residual),
        relativeResidual: identify(Math.abs(scalar.residual) / fixture.sigmaInfinity),
        iterations: scalar.iterations,
      }),
      preEvent: preSweep.relaxation,
      postEvent: postSweep.relaxation,
    }),
  });
}

/** Parse and project the frozen protocol before entering the reference-only arithmetic path. */
export function derivePhase10C0VMovingReference(
  protocolValue: Phase10C0VMovingProtocol,
): Phase10C0VMovingReferenceCandidate {
  const protocol = parsePhase10C0VMovingProtocol(protocolValue);
  const input: ParsedMovingInput = phase10C0VMovingReferenceInput(protocol);
  return derivePhase10C0VMovingReferenceFromInput(input);
}

/** Stable candidate-oriented alias used by the S5b neutral wrapper. */
export const derivePhase10C0VMovingReferenceCandidate = derivePhase10C0VMovingReference;
