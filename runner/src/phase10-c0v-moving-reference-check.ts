// Separate Phase 10 C0V moving-reference checker.
//
// This checker intentionally does not import the generator. It derives the integer domain with
// a cube-coordinate predicate, solves the scalar equation with safeguarded Newton iteration, and
// checks field/event/ledger equations directly from the candidate bytes' decoded values.

import {
  phase10C0VMovingReferenceInput,
  parsePhase10C0VMovingProtocol,
  type Phase10C0VMovingBoundaryRow,
  type Phase10C0VMovingCriteria,
  type Phase10C0VMovingFieldRow,
  type Phase10C0VMovingFixture,
  type Phase10C0VMovingProtocol,
  type Phase10C0VMovingReferenceCandidate,
  type Phase10C0VMovingReferenceCheck,
  type Phase10C0VMovingReferenceInput,
  type Phase10C0VMovingTopology,
  type Phase10C0VNumericIdentity,
} from "./phase10-c0v-contracts.ts";

type Triple = readonly [number, number, number];

interface CheckGeometry {
  readonly dims: Triple;
  readonly center: Triple;
  readonly count: number;
  readonly active: ReadonlySet<number>;
  readonly shell: ReadonlySet<number>;
  readonly activeIndices: readonly number[];
  readonly neighbors: ReadonlyMap<number, readonly (number | null)[]>;
}

interface PhysicalScales {
  readonly cSat: number;
  readonly vKin: number;
  readonly q: number;
  readonly dxM: number;
}

interface CheckMetrics {
  readonly errors: string[];
  readonly details: string[];
}

const CHECKER_DIRECTION_COMPONENTS = Object.freeze({
  east: Object.freeze([1, 0, 0] as const),
  west: Object.freeze([-1, 0, 0] as const),
  northEast: Object.freeze([0, 1, 0] as const),
  southWest: Object.freeze([0, -1, 0] as const),
  southEast: Object.freeze([1, -1, 0] as const),
  northWest: Object.freeze([-1, 1, 0] as const),
  up: Object.freeze([0, 0, 1] as const),
  down: Object.freeze([0, 0, -1] as const),
});
const CHECKER_DIRECTIONS = Object.freeze([
  CHECKER_DIRECTION_COMPONENTS.east,
  CHECKER_DIRECTION_COMPONENTS.west,
  CHECKER_DIRECTION_COMPONENTS.northEast,
  CHECKER_DIRECTION_COMPONENTS.southWest,
  CHECKER_DIRECTION_COMPONENTS.southEast,
  CHECKER_DIRECTION_COMPONENTS.northWest,
  CHECKER_DIRECTION_COMPONENTS.up,
  CHECKER_DIRECTION_COMPONENTS.down,
]);

function fail(detail: string): never {
  throw new Error(`Phase 10 C0V moving reference check refused: ${detail}`);
}

function encodeHex(value: number): string {
  const normalized = Object.is(value, -0) ? 0 : value;
  const buffer = new ArrayBuffer(8);
  new DataView(buffer).setFloat64(0, normalized, false);
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function identify(value: number): Phase10C0VNumericIdentity {
  const finite = Number.isFinite(value) ? value : Number.MAX_VALUE;
  const normalized = Object.is(finite, -0) ? 0 : finite;
  return Object.freeze({ decimal: normalized.toString(), binary64Hex: encodeHex(normalized) });
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length &&
      left.every((entry, index) => deepEqual(entry, right[index]));
  }
  if (left !== null && right !== null && typeof left === "object" && typeof right === "object") {
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const leftKeys = Object.keys(leftRecord).sort();
    const rightKeys = Object.keys(rightRecord).sort();
    return leftKeys.length === rightKeys.length && leftKeys.every((key, index) =>
      key === rightKeys[index] && deepEqual(leftRecord[key], rightRecord[key]));
  }
  return false;
}

function decode(
  identity: Phase10C0VNumericIdentity,
  label: string,
  errors: string[],
): number {
  if (identity === null || typeof identity !== "object") {
    errors.push(`${label} is not a numeric identity`);
    return Number.NaN;
  }
  const keys = Object.keys(identity).sort();
  if (keys.length !== 2 || keys[0] !== "binary64Hex" || keys[1] !== "decimal") {
    errors.push(`${label} numeric identity fields differ`);
    return Number.NaN;
  }
  if (typeof identity.decimal !== "string" || typeof identity.binary64Hex !== "string") {
    errors.push(`${label} numeric identity fields are not strings`);
    return Number.NaN;
  }
  const result = Number(identity.decimal);
  if (!Number.isFinite(result) || Object.is(result, -0)) {
    errors.push(`${label} decimal is not a finite canonical value`);
    return Number.NaN;
  }
  if (encodeHex(result) !== identity.binary64Hex) {
    errors.push(`${label} decimal and binary64Hex disagree`);
    return Number.NaN;
  }
  return result;
}

function relativeDifference(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.max(Math.abs(expected), 1e-300);
}

function exactArray(actual: readonly number[], expected: readonly number[]): boolean {
  return actual.length === expected.length && actual.every((entry, index) => entry === expected[index]);
}

function flat(dims: Triple, i: number, j: number, k: number): number {
  return i + dims[0] * (j + dims[1] * k);
}

function unflat(dims: Triple, index: number): Triple {
  const plane = dims[0] * dims[1];
  const k = Math.floor(index / plane);
  const remainder = index - plane * k;
  const j = Math.floor(remainder / dims[0]);
  return Object.freeze([remainder - dims[0] * j, j, k]);
}

function cubeRadius(di: number, dj: number): number {
  const third = -di - dj;
  return Math.max(Math.abs(di), Math.abs(dj), Math.abs(third));
}

function checkerGeometry(fixture: Phase10C0VMovingFixture): CheckGeometry {
  const dims = fixture.dimensions;
  const center = fixture.center;
  const count = dims[0] * dims[1] * dims[2];
  const radialLimit = Math.min(center[0], dims[0] - center[0] - 1, center[1], dims[1] - center[1] - 1);
  const axialLimit = Math.min(center[2], dims[2] - center[2] - 1);
  const active = new Set<number>();
  const shell = new Set<number>();
  for (let index = 0; index < count; index++) {
    const [i, j, k] = unflat(dims, index);
    const radial = cubeRadius(i - center[0], j - center[1]);
    const axial = Math.abs(k - center[2]);
    if (radial <= radialLimit && axial <= axialLimit) {
      active.add(index);
      if (radial === radialLimit || axial === axialLimit) shell.add(index);
    }
  }
  const activeIndices = Object.freeze([...active].sort((left, right) => left - right));
  const neighbors = new Map<number, readonly (number | null)[]>();
  for (const index of activeIndices) {
    const [i, j, k] = unflat(dims, index);
    neighbors.set(index, Object.freeze(CHECKER_DIRECTIONS.map(([di, dj, dk]) => {
      const ni = i + di;
      const nj = j + dj;
      const nk = k + dk;
      return ni < 0 || ni >= dims[0] || nj < 0 || nj >= dims[1] || nk < 0 || nk >= dims[2]
        ? null
        : flat(dims, ni, nj, nk);
    })));
  }
  return Object.freeze({ dims, center, count, active, shell, activeIndices, neighbors });
}

function boundarySet(geometry: CheckGeometry, attached: ReadonlySet<number>): readonly number[] {
  return Object.freeze(geometry.activeIndices.filter((index) =>
    !attached.has(index) && geometry.neighbors.get(index)!.some((neighbor) =>
      neighbor !== null && geometry.active.has(neighbor) && attached.has(neighbor))));
}

function counts(
  geometry: CheckGeometry,
  attached: ReadonlySet<number>,
  index: number,
): readonly [number, number] {
  const neighbors = geometry.neighbors.get(index)!;
  let nT = 0;
  let nZ = 0;
  for (let direction = 0; direction < neighbors.length; direction++) {
    const neighbor = neighbors[direction];
    if (neighbor !== null && geometry.active.has(neighbor) && attached.has(neighbor)) {
      if (direction < 6) nT++;
      else nZ++;
    }
  }
  return Object.freeze([nT, nZ]);
}

function scales(fixture: Phase10C0VMovingFixture): PhysicalScales {
  const constants = fixture.physicalConstants;
  const temperatureK = fixture.tempC + constants.celsiusZeroK;
  const saturationPressurePa = constants.saturationPressurePrefactorMbar *
    Math.exp(constants.saturationPressureExponentK / temperatureK) * constants.mbarToPa;
  const cSat = saturationPressurePa / (constants.kBoltzmannJPerK * temperatureK);
  const diffusivity = constants.diffusivityAir1AtmM2S *
    constants.standardAtmospherePa / fixture.pressurePa;
  const thermalSpeed = Math.sqrt(
    constants.kBoltzmannJPerK * temperatureK /
      (2 * Math.PI * constants.waterMoleculeMassKg),
  );
  const vKin = cSat / constants.iceNumberDensityPerM3 * thermalSpeed;
  const x0 = cSat / constants.iceNumberDensityPerM3 * diffusivity / vKin;
  const dxM = fixture.dxUm * 1e-6;
  const q = dxM / x0;
  if (![cSat, vKin, q, dxM].every((value) => Number.isFinite(value) && value > 0)) {
    fail("independently derived moving physical scale is invalid");
  }
  return Object.freeze({ cSat, vKin, q, dxM });
}

function scalarResidual(sigma: number, fixture: Phase10C0VMovingFixture, q: number): number {
  if (sigma === 0) return -fixture.sigmaInfinity;
  const coefficient = fixture.kineticInputs.basalPrefactor *
    Math.exp(-fixture.kineticInputs.basalSigma0 / sigma);
  return sigma * (1 + (98 / 95) * q * coefficient) - fixture.sigmaInfinity;
}

function scalarDerivative(sigma: number, fixture: Phase10C0VMovingFixture, q: number): number {
  if (!(sigma > 0)) return 1;
  const barrierRatio = fixture.kineticInputs.basalSigma0 / sigma;
  const exponential = Math.exp(-barrierRatio);
  return 1 + (98 / 95) * q * fixture.kineticInputs.basalPrefactor *
    exponential * (1 + barrierRatio);
}

function safeguardedNewton(fixture: Phase10C0VMovingFixture, q: number): number {
  let lower = 0;
  let upper = fixture.sigmaInfinity;
  let iterate = fixture.sigmaInfinity / 2;
  for (let iteration = 0; iteration < 128; iteration++) {
    const residual = scalarResidual(iterate, fixture, q);
    if (residual <= 0) lower = iterate;
    else upper = iterate;
    const derivative = scalarDerivative(iterate, fixture, q);
    let proposed = iterate - residual / derivative;
    if (!Number.isFinite(proposed) || !(proposed > lower && proposed < upper)) {
      proposed = lower + (upper - lower) / 2;
    }
    if (proposed === iterate || proposed === lower || proposed === upper) break;
    iterate = proposed;
  }
  const candidates = [lower, iterate, upper];
  candidates.sort((left, right) =>
    Math.abs(scalarResidual(left, fixture, q)) - Math.abs(scalarResidual(right, fixture, q)));
  return candidates[0]!;
}

interface IndependentSweep {
  readonly field: Float64Array;
  readonly opposingIndices: ReadonlyMap<number, readonly number[]>;
  readonly sigmaOpp: ReadonlyMap<number, number>;
  readonly sigmaBoundary: ReadonlyMap<number, number>;
  readonly coefficient: ReadonlyMap<number, number>;
  readonly rate: ReadonlyMap<number, number>;
  readonly residual: number;
  readonly divergence: number;
  readonly shellClamp: number;
  readonly surfaceExchange: number;
  readonly smootherDrift: number;
  readonly smootherDriftLimit: number;
  readonly maxAbsSweepInput: number;
}

function boundaryFacet(nT: number, nZ: number): "basal" | "inhibited" | "prism" | "rough" {
  if (nT === 0 && (nZ === 1 || nZ === 2)) return "basal";
  if (nT === 1 && nZ === 0) return "inhibited";
  if (nT === 2 && nZ === 0) return "prism";
  return "rough";
}

function independentBoundaryValue(
  facet: ReturnType<typeof boundaryFacet>,
  sigmaOpp: number,
  fixture: Phase10C0VMovingFixture,
  q: number,
): readonly [number, number] {
  if (!(sigmaOpp > 0) || facet === "inhibited") return Object.freeze([0, sigmaOpp]);
  if (facet === "rough") return Object.freeze([1, sigmaOpp / (1 + q)]);
  if (facet === "prism") fail("independent moving check encountered an unsupported prism boundary");
  let lower = 0;
  let upper = sigmaOpp;
  let sigma = sigmaOpp / 2;
  for (let iteration = 0; iteration < 128; iteration++) {
    const coefficient = fixture.kineticInputs.basalPrefactor *
      Math.exp(-fixture.kineticInputs.basalSigma0 / sigma);
    const residual = sigma * (1 + q * coefficient) - sigmaOpp;
    if (residual <= 0) lower = sigma;
    else upper = sigma;
    const barrierRatio = fixture.kineticInputs.basalSigma0 / sigma;
    const derivative = 1 + q * coefficient * (1 + barrierRatio);
    let proposed = sigma - residual / derivative;
    if (!Number.isFinite(proposed) || !(proposed > lower && proposed < upper)) {
      proposed = lower + (upper - lower) / 2;
    }
    if (proposed === sigma || proposed === lower || proposed === upper) break;
    sigma = proposed;
  }
  const coefficient = fixture.kineticInputs.basalPrefactor *
    Math.exp(-fixture.kineticInputs.basalSigma0 / sigma);
  return Object.freeze([coefficient, sigma]);
}

function independentSweep(
  geometry: CheckGeometry,
  attached: ReadonlySet<number>,
  boundary: readonly number[],
  source: Float64Array,
  fixture: Phase10C0VMovingFixture,
  physical: PhysicalScales,
): IndependentSweep {
  const planar = new Float64Array(geometry.count);
  const candidate = new Float64Array(geometry.count);
  let maxAbsSweepInput = 0;
  let smootherDrift = 0;
  for (const index of geometry.activeIndices) {
    if (attached.has(index)) continue;
    const own = source[index]!;
    const neighbors = geometry.neighbors.get(index)!;
    const values = neighbors.slice(0, 6).map((neighbor) =>
      neighbor !== null && geometry.active.has(neighbor) && !attached.has(neighbor)
        ? source[neighbor]!
        : own);
    const pairs = [values[0]! + values[1]!, values[2]! + values[3]!, values[4]! + values[5]!]
      .sort((left, right) => left - right);
    planar[index] = (((own + pairs[0]!) + pairs[1]!) + pairs[2]!) / 7;
  }
  for (const index of geometry.activeIndices) {
    if (attached.has(index)) continue;
    const own = planar[index]!;
    const neighbors = geometry.neighbors.get(index)!;
    const upIndex = neighbors[6];
    const downIndex = neighbors[7];
    const up = upIndex !== null && geometry.active.has(upIndex) && !attached.has(upIndex)
      ? planar[upIndex]!
      : own;
    const down = downIndex !== null && geometry.active.has(downIndex) && !attached.has(downIndex)
      ? planar[downIndex]!
      : own;
    candidate[index] = (4 / 7) * own + (3 / 14) * (up + down);
    smootherDrift += candidate[index]! - source[index]!;
    maxAbsSweepInput = Math.max(maxAbsSweepInput, Math.abs(source[index]!));
  }

  const opposingIndices = new Map<number, readonly number[]>();
  const sigmaOpp = new Map<number, number>();
  const sigmaBoundary = new Map<number, number>();
  const coefficient = new Map<number, number>();
  const rate = new Map<number, number>();
  let surfaceExchange = 0;
  for (const index of boundary) {
    const neighbors = geometry.neighbors.get(index)!;
    const operands: { readonly index: number; readonly value: number }[] = [];
    for (const [direction, oppositeDirection] of [[0, 1], [1, 0], [2, 3], [3, 2], [4, 5], [5, 4], [6, 7], [7, 6]] as const) {
      const attachedNeighbor = neighbors[direction];
      const opposite = neighbors[oppositeDirection];
      if (
        attachedNeighbor !== null && geometry.active.has(attachedNeighbor) && attached.has(attachedNeighbor) &&
        opposite !== null && geometry.active.has(opposite) && !attached.has(opposite)
      ) operands.push(Object.freeze({ index: opposite, value: candidate[opposite]! }));
    }
    const sortedValues = operands.map((entry) => entry.value).sort((left, right) => left - right);
    const opposing = sortedValues.length === 0
      ? 0
      : sortedValues.reduce((sum, value) => sum + value, 0) / sortedValues.length;
    const [nT, nZ] = counts(geometry, attached, index);
    const [coefficientValue, boundaryValue] = independentBoundaryValue(
      boundaryFacet(nT, nZ),
      opposing,
      fixture,
      physical.q,
    );
    opposingIndices.set(index, Object.freeze(operands.map((entry) => entry.index)));
    sigmaOpp.set(index, opposing);
    sigmaBoundary.set(index, boundaryValue);
    coefficient.set(index, coefficientValue);
    rate.set(index, coefficientValue * physical.vKin * boundaryValue / physical.dxM);
    surfaceExchange += candidate[index]! - boundaryValue;
    candidate[index] = boundaryValue;
  }
  let shellClamp = 0;
  for (const index of geometry.activeIndices) {
    if (geometry.shell.has(index) && !attached.has(index)) {
      shellClamp += fixture.sigmaInfinity - candidate[index]!;
      candidate[index] = fixture.sigmaInfinity;
    }
  }
  let maxChange = 0;
  for (const index of geometry.activeIndices) {
    if (!attached.has(index)) maxChange = Math.max(maxChange, Math.abs(candidate[index]! - source[index]!));
  }
  const divergence = Math.abs(shellClamp + smootherDrift - surfaceExchange) /
    Math.max(Math.abs(surfaceExchange), 1e-300);
  const driftLimit = maxAbsSweepInput === 0
    ? 0
    : 1024 * geometry.activeIndices.length *
      Math.max(Number.EPSILON * maxAbsSweepInput, Number.MIN_VALUE);
  return Object.freeze({
    field: candidate,
    opposingIndices,
    sigmaOpp,
    sigmaBoundary,
    coefficient,
    rate,
    residual: maxChange / fixture.sigmaInfinity,
    divergence,
    shellClamp,
    surfaceExchange,
    smootherDrift,
    smootherDriftLimit: driftLimit,
    maxAbsSweepInput,
  });
}

function rowMap<T extends { readonly linearIndex: number }>(
  rows: readonly T[],
  expectedCount: number,
  label: string,
  errors: string[],
): ReadonlyMap<number, T> {
  const result = new Map<number, T>();
  for (const row of rows) {
    if (!Number.isSafeInteger(row.linearIndex) || result.has(row.linearIndex)) {
      errors.push(`${label} contains an invalid or duplicate linearIndex`);
      continue;
    }
    result.set(row.linearIndex, row);
  }
  if (rows.length !== expectedCount || result.size !== expectedCount) {
    errors.push(`${label} cardinality differs`);
  }
  return result;
}

function compareTopology(
  geometry: CheckGeometry,
  topology: Phase10C0VMovingTopology,
  candidate: Phase10C0VMovingReferenceCandidate,
): {
  readonly passed: boolean;
  readonly details: readonly string[];
  readonly activeCellsExact: boolean;
  readonly neighborsExact: boolean;
  readonly initialSetsExact: boolean;
  readonly postSetsExact: boolean;
  readonly d6hOrbitExact: boolean;
} {
  const errors: string[] = [];
  const activeRows = rowMap(candidate.activeCells, geometry.activeIndices.length, "activeCells", errors);
  let activeCellsExact = true;
  for (const index of geometry.activeIndices) {
    const row = activeRows.get(index);
    const [i, j, k] = unflat(geometry.dims, index);
    if (
      row === undefined || row.i !== i || row.j !== j || row.k !== k ||
      row.di !== i - geometry.center[0] || row.dj !== j - geometry.center[1] ||
      row.dk !== k - geometry.center[2] || row.shell !== geometry.shell.has(index)
    ) activeCellsExact = false;
  }
  if (!activeCellsExact) errors.push("active cell integer coordinates or shell flags differ");

  const neighborRows = rowMap(candidate.neighborTable, geometry.activeIndices.length, "neighborTable", errors);
  let neighborsExact = topology.linearIndexRule === "i + ni * (j + nj * k)" &&
    topology.neighborOffsets.length === CHECKER_DIRECTIONS.length &&
    topology.neighborOffsets.every((offset, index) => exactArray(offset, CHECKER_DIRECTIONS[index]!));
  for (const index of geometry.activeIndices) {
    const row = neighborRows.get(index);
    const expected = geometry.neighbors.get(index)!;
    if (
      row === undefined || row.neighbors.length !== expected.length ||
      row.neighbors.some((entry, position) => entry !== expected[position])
    ) neighborsExact = false;
  }
  if (!neighborsExact) errors.push("neighbor table differs from independent cube-coordinate enumeration");

  const initialAttached = new Set(topology.initialAttachedIndices);
  const postAttached = new Set(topology.postAttachedIndices);
  const independentlyInitialBoundary = boundarySet(geometry, initialAttached);
  const independentlyPostBoundary = boundarySet(geometry, postAttached);
  const initialSetsExact =
    exactArray(topology.initialBoundaryIndices, independentlyInitialBoundary) &&
    exactArray(candidate.initialState.attachedIndices, topology.initialAttachedIndices) &&
    exactArray(candidate.initialState.boundaryIndices, independentlyInitialBoundary);
  const postSetsExact =
    exactArray(topology.postBoundaryIndices, independentlyPostBoundary) &&
    exactArray(candidate.postState.attachedIndices, topology.postAttachedIndices) &&
    exactArray(candidate.postState.boundaryIndices, independentlyPostBoundary);
  if (!initialSetsExact) errors.push("initial attached/boundary sets differ");
  if (!postSetsExact) errors.push("post-event attached/boundary sets differ");

  let d6hOrbitExact = topology.tiedOrbitIndices.length === 2;
  const tiedCoordinates = topology.tiedOrbitIndices.map((index) => unflat(geometry.dims, index));
  for (const coordinate of tiedCoordinates) {
    const di = coordinate[0] - geometry.center[0];
    const dj = coordinate[1] - geometry.center[1];
    const rotatedI = geometry.center[0] - dj;
    const rotatedJ = geometry.center[1] + di + dj;
    const rotated = flat(geometry.dims, rotatedI, rotatedJ, coordinate[2]);
    const reflected = flat(
      geometry.dims,
      coordinate[0],
      coordinate[1],
      2 * geometry.center[2] - coordinate[2],
    );
    if (!topology.tiedOrbitIndices.includes(rotated) || !topology.tiedOrbitIndices.includes(reflected)) {
      d6hOrbitExact = false;
    }
  }
  if (!d6hOrbitExact) errors.push("tied axial orbit is not closed under rotation and z reflection");
  return Object.freeze({
    passed: errors.length === 0,
    details: Object.freeze(errors.length === 0 ? ["integer topology, neighbors, sets, and D6h orbit re-derived"] : errors),
    activeCellsExact,
    neighborsExact,
    initialSetsExact,
    postSetsExact,
    d6hOrbitExact,
  });
}

function expectedInitialSigma(
  geometry: CheckGeometry,
  topology: Phase10C0VMovingTopology,
  root: number,
  infinity: number,
  index: number,
): number {
  if (!geometry.active.has(index) || topology.initialAttachedIndices.includes(index)) return 0;
  if (topology.tiedOrbitIndices.includes(index)) return root;
  return infinity;
}

function compareFields(
  geometry: CheckGeometry,
  topology: Phase10C0VMovingTopology,
  fixture: Phase10C0VMovingFixture,
  criteria: Phase10C0VMovingCriteria,
  physical: PhysicalScales,
  root: number,
  expectedRate: number,
  candidate: Phase10C0VMovingReferenceCandidate,
  identityErrors: string[],
): {
  readonly passed: boolean;
  readonly details: readonly string[];
  readonly preLInf: Phase10C0VNumericIdentity;
  readonly preWeightedL2: Phase10C0VNumericIdentity;
  readonly preFixedPointResidual: Phase10C0VNumericIdentity;
  readonly postLInf: Phase10C0VNumericIdentity;
  readonly postFixedPointResidual: Phase10C0VNumericIdentity;
  readonly shellExact: boolean;
  readonly zerosExact: boolean;
} {
  const errors: string[] = [];
  const preSource = new Float64Array(geometry.count);
  const postSource = new Float64Array(geometry.count);
  for (let index = 0; index < geometry.count; index++) {
    preSource[index] = expectedInitialSigma(
      geometry,
      topology,
      root,
      fixture.sigmaInfinity,
      index,
    );
    postSource[index] = geometry.active.has(index) && !topology.postAttachedIndices.includes(index)
      ? fixture.sigmaInfinity
      : 0;
  }
  const preSweep = independentSweep(
    geometry,
    new Set(topology.initialAttachedIndices),
    topology.initialBoundaryIndices,
    preSource,
    fixture,
    physical,
  );
  const postSweep = independentSweep(
    geometry,
    new Set(topology.postAttachedIndices),
    topology.postBoundaryIndices,
    postSource,
    fixture,
    physical,
  );
  const preRows = rowMap(candidate.initialState.fieldRows, geometry.count, "initialState.fieldRows", errors);
  let maxPre = 0;
  let sumSquares = 0;
  let compared = 0;
  for (let index = 0; index < geometry.count; index++) {
    const row = preRows.get(index);
    if (row === undefined) continue;
    const sigma = decode(row.sigma, `initialState.fieldRows[${index}].sigma`, identityErrors);
    const fill = decode(row.fill, `initialState.fieldRows[${index}].fill`, identityErrors);
    const expected = expectedInitialSigma(geometry, topology, root, fixture.sigmaInfinity, index);
    const difference = Math.abs(sigma - expected) / fixture.sigmaInfinity;
    maxPre = Math.max(maxPre, difference);
    if (geometry.active.has(index) && !topology.initialAttachedIndices.includes(index)) {
      sumSquares += difference * difference;
      compared++;
    }
    const initiallyAttached = topology.initialAttachedIndices.includes(index);
    if (
      fill !== (initiallyAttached ? 1 : 0) || row.attached !== initiallyAttached ||
      row.wall !== !geometry.active.has(index)
    ) {
      errors.push(`initial field metadata differs at ${index}`);
    }
  }
  const weightedL2 = Math.sqrt(sumSquares / Math.max(compared, 1));
  if (maxPre > criteria.preEventFieldLInf) errors.push("pre-event L-infinity difference exceeds criterion");
  if (weightedL2 > criteria.preEventFieldWeightedL2) errors.push("pre-event weighted L2 difference exceeds criterion");

  const initialBoundary = rowMap(
    candidate.initialState.boundaryRows,
    topology.initialBoundaryIndices.length,
    "initialState.boundaryRows",
    errors,
  );
  const expectedSigmaOpp = (95 * fixture.sigmaInfinity + 3 * root) / 98;
  const expectedCoefficient = fixture.kineticInputs.basalPrefactor *
    Math.exp(-fixture.kineticInputs.basalSigma0 / root);
  for (const index of topology.initialBoundaryIndices) {
    const row = initialBoundary.get(index);
    if (row === undefined) continue;
    const [nT, nZ] = counts(geometry, new Set(topology.initialAttachedIndices), index);
    if (row.nT !== nT || row.nZ !== nZ) errors.push(`initial neighbor counts differ at ${index}`);
    const axial = topology.tiedOrbitIndices.includes(index);
    const sigmaOpp = decode(row.sigmaOpp, `initial boundary ${index} sigmaOpp`, identityErrors);
    const sigmaBoundary = decode(row.sigmaBoundary, `initial boundary ${index} sigmaBoundary`, identityErrors);
    const alphaHK = decode(row.alphaHK, `initial boundary ${index} alphaHK`, identityErrors);
    const rate = decode(row.fillRatePerSecond, `initial boundary ${index} rate`, identityErrors);
    if (axial) {
      if (row.facetClass !== "basal" ||
        !exactArray(row.opposingIndices, preSweep.opposingIndices.get(index) ?? []) ||
        relativeDifference(sigmaOpp, expectedSigmaOpp) > criteria.preEventFieldLInf ||
        relativeDifference(sigmaBoundary, root) > criteria.preEventFieldLInf ||
        relativeDifference(alphaHK, expectedCoefficient) > criteria.axialRateRelative ||
        relativeDifference(rate, expectedRate) > criteria.axialRateRelative) {
        errors.push(`axial boundary equation differs at ${index}`);
      }
    } else if (
      row.facetClass !== "inhibited" || sigmaOpp !== 0 || sigmaBoundary !== 0 ||
      alphaHK !== 0 || rate !== 0 || row.opposingIndices.length !== 0
    ) {
      errors.push(`transverse inhibited boundary equation differs at ${index}`);
    }
  }

  const postRows = rowMap(candidate.postState.fieldRows, geometry.count, "postState.fieldRows", errors);
  let maxPost = 0;
  let shellExact = true;
  let zerosExact = true;
  const infinityHex = encodeHex(fixture.sigmaInfinity);
  for (let index = 0; index < geometry.count; index++) {
    const row = postRows.get(index);
    if (row === undefined) continue;
    const sigma = decode(row.sigma, `postState.fieldRows[${index}].sigma`, identityErrors);
    const fill = decode(row.fill, `postState.fieldRows[${index}].fill`, identityErrors);
    const attached = topology.postAttachedIndices.includes(index);
    const active = geometry.active.has(index);
    const expected = active && !attached ? fixture.sigmaInfinity : 0;
    maxPost = Math.max(maxPost, Math.abs(sigma - expected) / fixture.sigmaInfinity);
    if (active && !attached && (row.sigma.binary64Hex !== infinityHex || !geometry.shell.has(index))) shellExact = false;
    if ((!active || attached) && row.sigma.binary64Hex !== "0000000000000000") zerosExact = false;
    if (fill !== (attached ? 1 : 0) || row.attached !== attached || row.wall !== !active) {
      errors.push(`post field metadata differs at ${index}`);
    }
  }
  if (maxPost > criteria.postFieldFixedPointResidual) errors.push("post-event field differs from exact fixed point");
  if (!shellExact) errors.push("post-event vapor field is not bitwise shell sigmaInfinity");
  if (!zerosExact) errors.push("post-event attached/wall field is not bitwise zero");

  const postBoundary = rowMap(
    candidate.postState.boundaryRows,
    topology.postBoundaryIndices.length,
    "postState.boundaryRows",
    errors,
  );
  for (const index of topology.postBoundaryIndices) {
    const row = postBoundary.get(index);
    if (row === undefined) continue;
    const expectedCounts = counts(geometry, new Set(topology.postAttachedIndices), index);
    const sigmaOpp = decode(row.sigmaOpp, `post boundary ${index} sigmaOpp`, identityErrors);
    const sigmaBoundary = decode(row.sigmaBoundary, `post boundary ${index} sigmaBoundary`, identityErrors);
    const alphaHK = decode(row.alphaHK, `post boundary ${index} alphaHK`, identityErrors);
    const rate = decode(row.fillRatePerSecond, `post boundary ${index} rate`, identityErrors);
    if (
      row.nT !== expectedCounts[0] || row.nZ !== expectedCounts[1] || row.opposingIndices.length !== 0 ||
      sigmaOpp !== 0 || sigmaBoundary !== 0 || alphaHK !== 0 || rate !== 0
    ) errors.push(`post boundary empty-opposing rule differs at ${index}`);
  }

  for (const [label, relaxation, expectedSweep, tolerance] of [
    ["pre", candidate.initialState.relaxation, preSweep, criteria.preEventFieldLInf],
    ["post", candidate.postState.relaxation, postSweep, criteria.postFieldFixedPointResidual],
  ] as const) {
    const residual = decode(relaxation.residual, `${label} relaxation residual`, identityErrors);
    const divergence = decode(relaxation.divergenceResidual, `${label} divergence residual`, identityErrors);
    const shellClamp = decode(relaxation.shellClampDiagnostic, `${label} shell clamp`, identityErrors);
    const surfaceExchange = decode(relaxation.surfaceExchangeDiagnostic, `${label} surface exchange`, identityErrors);
    const drift = decode(relaxation.smootherDriftDiagnostic, `${label} smoother drift`, identityErrors);
    const driftLimit = decode(relaxation.smootherDriftLimit, `${label} smoother drift limit`, identityErrors);
    const maxAbsSweepInput = decode(relaxation.maxAbsSweepInput, `${label} max sweep input`, identityErrors);
    const diagnosticPairs = [
      [residual, expectedSweep.residual],
      [divergence, expectedSweep.divergence],
      [shellClamp, expectedSweep.shellClamp],
      [surfaceExchange, expectedSweep.surfaceExchange],
      [maxAbsSweepInput, expectedSweep.maxAbsSweepInput],
    ] as const;
    const driftLimitExact = relaxation.smootherDriftLimit.binary64Hex ===
      encodeHex(expectedSweep.smootherDriftLimit);
    const driftWithinIndependentBound = Math.abs(drift) <= expectedSweep.smootherDriftLimit;
    const driftAgreementWithinIndependentBound = Math.abs(drift - expectedSweep.smootherDrift) <=
      expectedSweep.smootherDriftLimit;
    const diagnosticsMatch = diagnosticPairs.every(([actual, expected]) =>
      Math.abs(actual - expected) / Math.max(fixture.sigmaInfinity, Math.abs(expected), 1e-300) <= tolerance) &&
      driftLimitExact && driftWithinIndependentBound && driftAgreementWithinIndependentBound;
    const expectedConverged = expectedSweep.residual < criteria.relaxationCriteria.residualStrictlyLessThan &&
      expectedSweep.divergence < criteria.relaxationCriteria.divergenceStrictlyLessThan;
    if (relaxation.sweeps !== 1 || relaxation.converged !== expectedConverged || !relaxation.converged ||
      !(residual < criteria.relaxationCriteria.residualStrictlyLessThan) ||
      !(divergence < criteria.relaxationCriteria.divergenceStrictlyLessThan) ||
      !criteria.relaxationCriteria.smootherDriftWithinRoundoffBound ||
      Math.abs(drift) > driftLimit || !diagnosticsMatch) {
      errors.push(`${label} relaxation criteria do not pass`);
    }
  }
  if (!deepEqual(candidate.convergence.preEvent, candidate.initialState.relaxation) ||
    !deepEqual(candidate.convergence.postEvent, candidate.postState.relaxation)) {
    errors.push("convergence relaxation records differ from state records");
  }
  return Object.freeze({
    passed: errors.length === 0 && identityErrors.length === 0,
    details: Object.freeze(errors.length === 0 ? ["field equations, boundary caches, and relaxation limits pass"] : errors),
    preLInf: identify(maxPre),
    preWeightedL2: identify(weightedL2),
    preFixedPointResidual: identify(preSweep.residual),
    postLInf: identify(maxPost),
    postFixedPointResidual: identify(postSweep.residual),
    shellExact,
    zerosExact,
  });
}

function compareEvent(
  topology: Phase10C0VMovingTopology,
  fixture: Phase10C0VMovingFixture,
  criteria: Phase10C0VMovingCriteria,
  expectedRate: number,
  candidate: Phase10C0VMovingReferenceCandidate,
  identityErrors: string[],
): {
  readonly passed: boolean;
  readonly details: readonly string[];
  readonly ratesTiedPositive: boolean;
  readonly otherRatesZero: boolean;
  readonly attachedNowByStep: readonly number[];
  readonly eventTimeRelativeDifference: Phase10C0VNumericIdentity;
} {
  const errors: string[] = [];
  const boundaryRows = rowMap(
    candidate.initialState.boundaryRows,
    topology.initialBoundaryIndices.length,
    "event initial boundary rows",
    errors,
  );
  const axialRows = topology.tiedOrbitIndices.map((index) => boundaryRows.get(index));
  const axialRates = axialRows.map((row, index) => row === undefined
    ? Number.NaN
    : decode(row.fillRatePerSecond, `axial rate ${topology.tiedOrbitIndices[index]}`, identityErrors));
  const ratesTiedPositive = axialRows.length === 2 && axialRows.every((row) => row !== undefined) &&
    axialRates[0]! > 0 && axialRows[0]!.fillRatePerSecond.binary64Hex ===
      axialRows[1]!.fillRatePerSecond.binary64Hex;
  const otherRatesZero = topology.initialBoundaryIndices
    .filter((index) => !topology.tiedOrbitIndices.includes(index))
    .every((index) => boundaryRows.get(index)?.fillRatePerSecond.binary64Hex === "0000000000000000");
  if (!ratesTiedPositive) errors.push("axial rates are not bit-identical and positive");
  if (!otherRatesZero) errors.push("non-axial initial boundary rate is not bitwise zero");

  const expectedStepCount = Math.ceil(1 / fixture.cflFill);
  if (candidate.cycles.length !== expectedStepCount) errors.push("event cycle count differs");
  const expectedDeltaTime = fixture.cflFill / expectedRate;
  let expectedFill = 0;
  let expectedPlacedTotal = 0;
  let expectedClippedTotal = 0;
  const attachedNowByStep: number[] = [];
  for (let position = 0; position < candidate.cycles.length; position++) {
    const cycle = candidate.cycles[position]!;
    const stepOrdinal = position + 1;
    const before = expectedFill;
    const raw = fixture.cflFill;
    const room = 1 - before;
    const expectedPlacedPerCell = Math.min(raw, room);
    const expectedClippedPerCell = Math.max(0, raw - room);
    expectedFill = Math.min(1, before + raw);
    expectedPlacedTotal += 2 * expectedPlacedPerCell;
    expectedClippedTotal += 2 * expectedClippedPerCell;
    const expectedAttached = stepOrdinal === expectedStepCount ? topology.tiedOrbitIndices : [];
    attachedNowByStep.push(cycle.attachedIndices.length);
    const deltaTime = decode(cycle.deltaTimeSeconds, `cycle ${stepOrdinal} deltaTime`, identityErrors);
    const cumulative = decode(cycle.cumulativeTimeSeconds, `cycle ${stepOrdinal} cumulativeTime`, identityErrors);
    const maxIncrement = decode(cycle.maxKineticFillIncrement, `cycle ${stepOrdinal} max increment`, identityErrors);
    const placed = decode(cycle.placedFillDelta, `cycle ${stepOrdinal} placed`, identityErrors);
    const clipped = decode(cycle.saturationClippedFillDelta, `cycle ${stepOrdinal} clipped`, identityErrors);
    const demand = decode(cycle.kineticDemandDelta, `cycle ${stepOrdinal} demand`, identityErrors);
    if (
      cycle.stepOrdinal !== stepOrdinal || !exactArray(cycle.attachedIndices, expectedAttached) ||
      relativeDifference(deltaTime, expectedDeltaTime) > criteria.eventChainRelative ||
      relativeDifference(cumulative, stepOrdinal * expectedDeltaTime) > criteria.eventChainRelative ||
      Math.abs(maxIncrement - fixture.cflFill) > criteria.maxKineticIncrementAbsolute ||
      Math.abs(placed - 2 * expectedPlacedPerCell) > criteria.placedFillAbsolute ||
      Math.abs(clipped - 2 * expectedClippedPerCell) > criteria.clippingAbsolute ||
      Math.abs(demand - 2 * raw) > criteria.placedFillAbsolute
    ) errors.push(`cycle ${stepOrdinal} event-chain arithmetic differs`);
  }
  if (!exactArray(attachedNowByStep, criteria.attachedNowByStep)) errors.push("attachedNow-by-step roster differs");
  const expectedEventTime = expectedStepCount * expectedDeltaTime;
  const candidateEventTime = decode(candidate.event.eventTimeSeconds, "event time", identityErrors);
  const eventTimeDifference = relativeDifference(candidateEventTime, expectedEventTime);
  const maxRate = decode(candidate.event.maxRatePerSecond, "event max rate", identityErrors);
  const nextRate = decode(candidate.event.nextRatePerSecond, "event next rate", identityErrors);
  const margin = decode(candidate.event.tieMarginPerSecond, "event tie margin", identityErrors);
  if (
    candidate.event.eventOrdinal !== topology.eventOrdinal ||
    candidate.event.eventStepOrdinal !== expectedStepCount ||
    !exactArray(candidate.event.tiedOrbitIndices, topology.tiedOrbitIndices) ||
    !exactArray(candidate.event.attachedIndices, topology.tiedOrbitIndices) ||
    relativeDifference(maxRate, expectedRate) > criteria.axialRateRelative || nextRate !== 0 ||
    relativeDifference(margin, expectedRate) > criteria.axialRateRelative ||
    eventTimeDifference > criteria.eventTimeRelative
  ) errors.push("first-event summary differs");
  const fillRows = rowMap(
    candidate.event.preEventFillRows,
    topology.initialBoundaryIndices.length,
    "event pre-event fill rows",
    errors,
  );
  for (const index of topology.initialBoundaryIndices) {
    const fillRow = fillRows.get(index);
    if (fillRow === undefined) {
      errors.push(`pre-event fill row ${index} is missing`);
      continue;
    }
    const fill = decode(fillRow.fill, `pre-event fill ${index}`, identityErrors);
    const expected = topology.tiedOrbitIndices.includes(index)
      ? (expectedStepCount - 1) * fixture.cflFill
      : 0;
    if (Math.abs(fill - expected) > criteria.maxKineticIncrementAbsolute) {
      errors.push(`pre-event fill differs at ${index}`);
    }
  }
  void expectedPlacedTotal;
  void expectedClippedTotal;
  return Object.freeze({
    passed: errors.length === 0 && identityErrors.length === 0,
    details: Object.freeze(errors.length === 0 ? ["rate tie, four-step event, time chain, and simultaneous orbit pass"] : errors),
    ratesTiedPositive,
    otherRatesZero,
    attachedNowByStep: Object.freeze(attachedNowByStep),
    eventTimeRelativeDifference: identify(eventTimeDifference),
  });
}

function compareLedger(
  geometry: CheckGeometry,
  topology: Phase10C0VMovingTopology,
  fixture: Phase10C0VMovingFixture,
  criteria: Phase10C0VMovingCriteria,
  physical: PhysicalScales,
  candidate: Phase10C0VMovingReferenceCandidate,
  identityErrors: string[],
): {
  readonly passed: boolean;
  readonly details: readonly string[];
  readonly placedAbsDifference: Phase10C0VNumericIdentity;
  readonly clippingAbsDifference: Phase10C0VNumericIdentity;
  readonly demandIdentityAbsResidual: Phase10C0VNumericIdentity;
  readonly vaporRelativeDifference: Phase10C0VNumericIdentity;
  readonly holeFillExact: boolean;
} {
  const errors: string[] = [];
  const eventSteps = Math.ceil(1 / fixture.cflFill);
  const expectedPlaced = 2;
  const expectedDemand = 2 * eventSteps * fixture.cflFill;
  const expectedClipping = expectedDemand - expectedPlaced;
  const expectedVapor = expectedPlaced * fixture.physicalConstants.iceNumberDensityPerM3 / physical.cSat;
  const placed = decode(candidate.ledger.placedFillIceCells, "ledger placed fill", identityErrors);
  const clipping = decode(candidate.ledger.saturationClippedFillIceCells, "ledger clipping", identityErrors);
  const demand = decode(candidate.ledger.kineticDemandIceCells, "ledger demand", identityErrors);
  const holeDeficit = decode(candidate.ledger.holeFillDeficitIceCells, "ledger hole deficit", identityErrors);
  const vapor = decode(candidate.ledger.placedFillVaporUnits, "ledger vapor units", identityErrors);
  const initialAttached = new Set(topology.initialAttachedIndices);
  const independentlyEligibleHoleFills = topology.initialBoundaryIndices.filter((index) => {
    const [nT, nZ] = counts(geometry, initialAttached, index);
    const initialFill = initialAttached.has(index) ? 1 : 0;
    return initialFill < 1 && nT >= 4 && nZ >= 1;
  });
  const independentlyDerivedHoleDeficit = independentlyEligibleHoleFills.reduce(
    (sum, index) => sum + (initialAttached.has(index) ? 0 : 1),
    0,
  );
  const placedDifference = Math.abs(placed - expectedPlaced);
  const clippingDifference = Math.abs(clipping - expectedClipping);
  const demandIdentity = Math.abs(placed + clipping - demand);
  const vaporDifference = relativeDifference(vapor, expectedVapor);
  const holeFillExact =
    criteria.holeFillExact.count === independentlyEligibleHoleFills.length &&
    criteria.holeFillExact.deficit === independentlyDerivedHoleDeficit &&
    candidate.ledger.holeFillCount === independentlyEligibleHoleFills.length &&
    holeDeficit === independentlyDerivedHoleDeficit;
  if (placedDifference > criteria.placedFillAbsolute) errors.push("placed-fill ledger differs");
  if (clippingDifference > criteria.clippingAbsolute) errors.push("clipping ledger differs");
  if (demandIdentity > criteria.placedFillAbsolute || Math.abs(demand - expectedDemand) > criteria.placedFillAbsolute) {
    errors.push("placed plus clipped does not equal expected kinetic demand");
  }
  if (vaporDifference > criteria.vaporLedgerRelative) errors.push("vapor-unit ledger differs");
  if (!holeFillExact) {
    errors.push("hole-fill ledger differs from the independently enumerated start-of-step predicate");
  }
  return Object.freeze({
    passed: errors.length === 0 && identityErrors.length === 0,
    details: Object.freeze(errors.length === 0 ? ["placed, clipped, demand, vapor, and hole ledgers pass"] : errors),
    placedAbsDifference: identify(placedDifference),
    clippingAbsDifference: identify(clippingDifference),
    demandIdentityAbsResidual: identify(demandIdentity),
    vaporRelativeDifference: identify(vaporDifference),
    holeFillExact,
  });
}

/** Independently check every load-bearing moving-reference quantity. */
export function independentlyCheckPhase10C0VMovingReferenceFromInput(
  input: Phase10C0VMovingReferenceInput,
  candidate: Phase10C0VMovingReferenceCandidate,
): Phase10C0VMovingReferenceCheck {
  const identityErrors: string[] = [];
  const errors: string[] = [];
  if (candidate.schema !== "phase10-c0v-moving-reference-candidate-v1") {
    errors.push("candidate schema differs");
  }
  if (candidate.protocolId !== input.protocolId) errors.push("candidate protocolId differs");
  if (candidate.method !== "independent-integer-topology-scalar-bisection") {
    errors.push("candidate method differs");
  }
  const geometry = checkerGeometry(input.fixture);
  const physical = scales(input.fixture);
  const root = safeguardedNewton(input.fixture, physical.q);
  const bracketed = scalarResidual(0, input.fixture, physical.q) < 0 &&
    scalarResidual(input.fixture.sigmaInfinity, input.fixture, physical.q) > 0;
  const derivativePositive = input.fixture.kineticInputs.basalPrefactor >= 0 &&
    input.fixture.kineticInputs.basalSigma0 > 0 &&
    scalarDerivative(0, input.fixture, physical.q) > 0 &&
    scalarDerivative(root, input.fixture, physical.q) > 0 &&
    scalarDerivative(input.fixture.sigmaInfinity, input.fixture, physical.q) > 0;
  const axialRows = input.topology.tiedOrbitIndices.map((index) =>
    candidate.initialState.boundaryRows.find((row) => row.linearIndex === index));
  if (axialRows.some((row) => row === undefined)) errors.push("candidate axial boundary row is missing");
  const candidateRoot = axialRows[0] === undefined
    ? Number.NaN
    : decode(axialRows[0].sigmaBoundary, "candidate axial scalar root", identityErrors);
  const candidateResidual = Math.abs(scalarResidual(candidateRoot, input.fixture, physical.q)) /
    input.fixture.sigmaInfinity;
  const rootDifference = relativeDifference(candidateRoot, root);
  const scalarRecord = candidate.convergence.scalarRoot;
  const candidateLower = decode(scalarRecord.lowerEndpoint, "candidate scalar lower endpoint", identityErrors);
  const candidateUpper = decode(scalarRecord.upperEndpoint, "candidate scalar upper endpoint", identityErrors);
  const selectedRoot = decode(scalarRecord.selectedRoot, "candidate scalar selected root", identityErrors);
  const reportedResidual = decode(scalarRecord.residual, "candidate scalar residual", identityErrors);
  const reportedRelativeResidual = decode(
    scalarRecord.relativeResidual,
    "candidate scalar relative residual",
    identityErrors,
  );
  const selectedResidual = scalarResidual(selectedRoot, input.fixture, physical.q);
  const endpointBracket = candidateLower >= 0 && candidateUpper <= input.fixture.sigmaInfinity &&
    candidateLower <= selectedRoot && selectedRoot <= candidateUpper &&
    scalarResidual(candidateLower, input.fixture, physical.q) <= 0 &&
    scalarResidual(candidateUpper, input.fixture, physical.q) >= 0;
  const midpoint = (candidateLower + candidateUpper) / 2;
  const endpointCollapsed = midpoint === candidateLower || midpoint === candidateUpper;
  const selectedEndpoint = Object.is(selectedRoot, candidateLower) || Object.is(selectedRoot, candidateUpper);
  const selectedSmallestResidual = Math.abs(selectedResidual) <= Math.min(
    Math.abs(scalarResidual(candidateLower, input.fixture, physical.q)),
    Math.abs(scalarResidual(candidateUpper, input.fixture, physical.q)),
  );
  const scalarRecordExact = scalarRecord.iterations > 0 && scalarRecord.iterations <= 256 &&
    endpointBracket && endpointCollapsed && selectedEndpoint && selectedSmallestResidual &&
    scalarRecord.selectedRoot.binary64Hex === axialRows[0]?.sigmaBoundary.binary64Hex &&
    Math.abs(reportedResidual - selectedResidual) / input.fixture.sigmaInfinity <=
      input.criteria.scalarEquationResidualRelative &&
    Math.abs(reportedRelativeResidual - Math.abs(selectedResidual) / input.fixture.sigmaInfinity) <=
      input.criteria.scalarEquationResidualRelative;
  const scalarPassed = bracketed && derivativePositive &&
    candidateResidual <= input.criteria.scalarEquationResidualRelative &&
    rootDifference <= input.criteria.scalarEquationResidualRelative && scalarRecordExact;
  if (!scalarPassed) errors.push("monotonicity/bracket/residual scalar check failed");
  const expectedCoefficient = input.fixture.kineticInputs.basalPrefactor *
    Math.exp(-input.fixture.kineticInputs.basalSigma0 / root);
  const expectedRate = expectedCoefficient * physical.vKin * root / physical.dxM;

  const topologyChecks = compareTopology(geometry, input.topology, candidate);
  const fieldEquationChecks = compareFields(
    geometry,
    input.topology,
    input.fixture,
    input.criteria,
    physical,
    root,
    expectedRate,
    candidate,
    identityErrors,
  );
  const eventChecks = compareEvent(
    input.topology,
    input.fixture,
    input.criteria,
    expectedRate,
    candidate,
    identityErrors,
  );
  const ledgerChecks = compareLedger(
    geometry,
    input.topology,
    input.fixture,
    input.criteria,
    physical,
    candidate,
    identityErrors,
  );
  errors.push(...identityErrors);
  if (!topologyChecks.passed) errors.push(...topologyChecks.details);
  if (!fieldEquationChecks.passed) errors.push(...fieldEquationChecks.details);
  if (!eventChecks.passed) errors.push(...eventChecks.details);
  if (!ledgerChecks.passed) errors.push(...ledgerChecks.details);
  const uniqueErrors = Object.freeze([...new Set(errors)]);
  return Object.freeze({
    schema: "phase10-c0v-moving-reference-check-v1",
    protocolId: input.protocolId,
    method: "independent-cube-topology-safeguarded-newton-and-equation-residuals",
    monotonicityBracketResidual: Object.freeze({
      bracketed,
      derivativePositive,
      candidateResidualRelative: identify(candidateResidual),
      recomputedRoot: identify(root),
      rootRelativeDifference: identify(rootDifference),
      passed: scalarPassed,
    }),
    topologyChecks,
    fieldEquationChecks,
    eventChecks,
    ledgerChecks,
    verdict: uniqueErrors.length === 0 ? "pass" : "fail",
    errors: uniqueErrors,
  });
}

/** Parse and project the frozen protocol before entering the independent arithmetic path. */
export function independentlyCheckPhase10C0VMovingReference(
  protocolValue: Phase10C0VMovingProtocol,
  candidate: Phase10C0VMovingReferenceCandidate,
): Phase10C0VMovingReferenceCheck {
  const protocol = parsePhase10C0VMovingProtocol(protocolValue);
  const input = phase10C0VMovingReferenceInput(protocol);
  return independentlyCheckPhase10C0VMovingReferenceFromInput(input, candidate);
}

/** Stable candidate-oriented alias used by the S5b neutral wrapper. */
export const checkPhase10C0VMovingReferenceCandidate =
  independentlyCheckPhase10C0VMovingReference;
