import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { decodeLKCheckpoint, hexDistance } from "@vcc/core";
import { LKSolver } from "@vcc/solver-cpu";

class CompensatedSum {
  private sum = 0;
  private correction = 0;

  add(value: number): void {
    const next = this.sum + value;
    if (Math.abs(this.sum) >= Math.abs(value)) {
      this.correction += this.sum - next + value;
    } else {
      this.correction += value - next + this.sum;
    }
    this.sum = next;
  }

  value(): number {
    return this.sum + this.correction;
  }
}

function exactFloatUnits(value: number): bigint {
  if (!Number.isFinite(value)) throw new Error(`exact sum requires finite input, got ${value}`);
  if (value === 0) return 0n;
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  const high = view.getUint32(0, false);
  const low = view.getUint32(4, false);
  const negative = (high >>> 31) === 1;
  const rawExponent = (high >>> 20) & 0x7ff;
  const fraction = (BigInt(high & 0x000f_ffff) << 32n) | BigInt(low);
  const mantissa = rawExponent === 0 ? fraction : (1n << 52n) | fraction;
  const shift = rawExponent === 0 ? 0n : BigInt(rawExponent - 1);
  const units = mantissa << shift;
  return negative ? -units : units;
}

function scaledUnitsToNumber(units: bigint): number {
  if (units === 0n) return 0;
  const negative = units < 0n;
  const magnitude = negative ? -units : units;
  const bits = magnitude.toString(2).length;
  const shift = Math.max(0, bits - 53);
  const leading = Number(magnitude >> BigInt(shift));
  const value = leading * 2 ** (shift - 1074);
  return negative ? -value : value;
}

function relativeDifference(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(Math.abs(right), 1e-300);
}

const checkpointPath = process.argv[2];
if (checkpointPath === undefined) {
  throw new Error("usage: node scripts/diagnose-gate2b-v4.ts <cold-v4-checkpoint>");
}

const bytes = new Uint8Array(readFileSync(checkpointPath));
const sha256 = createHash("sha256").update(bytes).digest("hex");
const decoded = decodeLKCheckpoint(bytes);
const state = decoded.state;
if (
  decoded.header.version !== 2 ||
  state.surfacePolicy !== "aggregate-hv-g1h1-v4" ||
  state.domain !== "hexPrism" ||
  state.farField !== "dirichlet" ||
  state.tempC !== -15 ||
  state.tick !== 11
) {
  throw new Error("checkpoint does not match the registered v4 cold terminal state");
}

const solver = new LKSolver({
  surfacePolicy: state.surfacePolicy,
  dims: state.dims,
  tempC: state.tempC,
  sigmaInfinity: state.sigmaInfinity,
  dxUm: state.dxUm,
  pressurePa: state.pressurePa,
  paramSet: state.paramSet,
  cflFill: state.cflFill,
  relaxTol: state.relaxTol,
  divTol: state.divTol,
  relaxMaxSweeps: state.relaxMaxSweeps,
  rngSeed: state.rngSeed,
  noiseEpsilon: state.noiseEpsilon,
  domain: state.domain,
  farField: state.farField,
  seedRadius: null,
  center: state.center,
});

type SolverInternals = {
  attachCell(index: number): void;
  rebuildBoundaryList(): void;
  sweepAggregate(
    src: Float64Array,
    dst: Float64Array,
  ): readonly [number, number, number, number];
  scratch2: Float64Array;
};
const internals = solver as unknown as SolverInternals;
for (let index = 0; index < state.a.length; index++) {
  if (state.a[index] === 1) internals.attachCell(index);
}
internals.rebuildBoundaryList();
solver.f.set(state.f);
solver.sigma.set(state.sigma);

for (let index = 0; index < state.a.length; index++) {
  if (solver.a[index] !== state.a[index]) {
    throw new Error(`topology reconstruction differs at cell ${index}`);
  }
}

const [privateMaxAbs, privateInjection, privateExchange] = internals.sweepAggregate(
  solver.sigma,
  internals.scratch2,
);

const { nx, ny, nz } = state.dims;
const plane = nx * ny;
const n = plane * nz;
const [ic, jc, kc] = state.center;
const radius = Math.min(ic, nx - 1 - ic, jc, ny - 1 - jc);
const halfZ = Math.min(kc, nz - 1 - kc);
const blocked = new Uint8Array(n);
const shell: number[] = [];
for (let k = 0; k < nz; k++) {
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const index = k * plane + j * nx + i;
      const distance = hexDistance(i - ic, j - jc);
      const active = distance <= radius && Math.abs(k - kc) <= halfZ;
      if (!active || state.a[index] === 1) blocked[index] = 1;
      if (active && (distance === radius || Math.abs(k - kc) === halfZ)) shell.push(index);
    }
  }
}

const boundary: number[] = [];
const forEachNeighbor = (index: number, fn: (neighbor: number) => void): void => {
  const i = index % nx;
  const inPlane = index % plane;
  const j = (inPlane - i) / nx;
  const k = (index - inPlane) / plane;
  if (i + 1 < nx) fn(index + 1);
  if (i - 1 >= 0) fn(index - 1);
  if (j + 1 < ny) fn(index + nx);
  if (j - 1 >= 0) fn(index - nx);
  if (i + 1 < nx && j - 1 >= 0) fn(index + 1 - nx);
  if (i - 1 >= 0 && j + 1 < ny) fn(index - 1 + nx);
  if (k + 1 < nz) fn(index + plane);
  if (k - 1 >= 0) fn(index - plane);
};
for (let index = 0; index < n; index++) {
  if (blocked[index] === 1) continue;
  let touchesIce = false;
  forEachNeighbor(index, (neighbor) => {
    if (state.a[neighbor] === 1) touchesIce = true;
  });
  if (touchesIce) boundary.push(index);
}

const inPlane = new Float64Array(n);
for (let k = 0; k < nz; k++) {
  const kBase = k * plane;
  for (let j = 0; j < ny; j++) {
    const row = kBase + j * nx;
    for (let i = 0; i < nx; i++) {
      const index = row + i;
      if (blocked[index] === 1) continue;
      const own = state.sigma[index];
      const sample = (neighbor: number | null): number =>
        neighbor === null || blocked[neighbor] === 1 ? own : state.sigma[neighbor];
      const east = sample(i + 1 < nx ? index + 1 : null);
      const west = sample(i - 1 >= 0 ? index - 1 : null);
      const ne = sample(j + 1 < ny ? index + nx : null);
      const sw = sample(j - 1 >= 0 ? index - nx : null);
      const se = sample(i + 1 < nx && j - 1 >= 0 ? index + 1 - nx : null);
      const nw = sample(i - 1 >= 0 && j + 1 < ny ? index - 1 + nx : null);
      const pairs = [east + west, ne + sw, se + nw].sort((left, right) => left - right);
      inPlane[index] = (((own + pairs[0]) + pairs[1]) + pairs[2]) / 7;
    }
  }
}

const smoothed = new Float64Array(n);
for (let k = 0; k < nz; k++) {
  const kBase = k * plane;
  const hasUp = k + 1 < nz;
  const hasDown = k - 1 >= 0;
  for (let p = 0; p < plane; p++) {
    const index = kBase + p;
    if (blocked[index] === 1) continue;
    const own = inPlane[index];
    const up = hasUp && blocked[index + plane] === 0 ? inPlane[index + plane] : own;
    const down = hasDown && blocked[index - plane] === 0 ? inPlane[index - plane] : own;
    smoothed[index] = (4 / 7) * own + (3 / 14) * (up + down);
  }
}

const boundarySet = new Set(boundary);
for (const index of shell) {
  if (boundarySet.has(index)) throw new Error(`Dirichlet shell overlaps crystal boundary at ${index}`);
}

let naiveInjection = 0;
let naiveExchange = 0;
const compensatedInjection = new CompensatedSum();
const compensatedExchange = new CompensatedSum();
let exactInjectionUnits = 0n;
let exactExchangeUnits = 0n;
let exactDifferenceUnits = 0n;
let naiveSmootherDrift = 0;
const compensatedSmootherDrift = new CompensatedSum();
let exactSmootherDriftUnits = 0n;
for (let index = 0; index < n; index++) {
  if (blocked[index] === 1) continue;
  const term = smoothed[index] - state.sigma[index];
  naiveSmootherDrift += term;
  compensatedSmootherDrift.add(term);
  exactSmootherDriftUnits += exactFloatUnits(term);
}
for (const index of shell) {
  const term = state.sigmaInfinity - smoothed[index];
  naiveInjection += term;
  compensatedInjection.add(term);
  const units = exactFloatUnits(term);
  exactInjectionUnits += units;
  exactDifferenceUnits += units;
}
for (const index of boundary) {
  const term = smoothed[index] - state.sigma[index];
  naiveExchange += term;
  compensatedExchange.add(term);
  const units = exactFloatUnits(term);
  exactExchangeUnits += units;
  exactDifferenceUnits -= units;
}

const exactInjection = scaledUnitsToNumber(exactInjectionUnits);
const exactExchange = scaledUnitsToNumber(exactExchangeUnits);
const exactDifference = scaledUnitsToNumber(exactDifferenceUnits);
const exactSmootherDrift = scaledUnitsToNumber(exactSmootherDriftUnits);
const compensatedInjectionValue = compensatedInjection.value();
const compensatedExchangeValue = compensatedExchange.value();
const compensatedSmootherDriftValue = compensatedSmootherDrift.value();

console.log(JSON.stringify({
  checkpoint: {
    path: checkpointPath,
    bytes: bytes.length,
    sha256,
    tick: state.tick,
    attached: state.a.reduce((sum, value) => sum + value, 0),
  },
  rawSets: { active: n - blocked.reduce((sum, value) => sum + value, 0) + state.a.reduce((sum, value) => sum + value, 0), shell: shell.length, boundary: boundary.length },
  solverOneSweep: {
    maxAbs: privateMaxAbs,
    injection: privateInjection,
    exchange: privateExchange,
    divergence: relativeDifference(privateInjection, privateExchange),
  },
  independentNaive: {
    injection: naiveInjection,
    exchange: naiveExchange,
    divergence: relativeDifference(naiveInjection, naiveExchange),
  },
  independentCompensated: {
    injection: compensatedInjectionValue,
    exchange: compensatedExchangeValue,
    divergence: relativeDifference(compensatedInjectionValue, compensatedExchangeValue),
  },
  independentExactTerms: {
    injection: exactInjection,
    exchange: exactExchange,
    difference: exactDifference,
    divergence: Math.abs(exactDifference) / Math.max(Math.abs(exactExchange), 1e-300),
    differenceIsExactlyZero: exactDifferenceUnits === 0n,
  },
  independentlyMeteredSmoother: {
    naiveDrift: naiveSmootherDrift,
    compensatedDrift: compensatedSmootherDriftValue,
    exactDrift: exactSmootherDrift,
    exactClosureDifference: scaledUnitsToNumber(
      exactInjectionUnits + exactSmootherDriftUnits - exactExchangeUnits,
    ),
    correctedNaiveDivergence: Math.abs(
      naiveInjection + naiveSmootherDrift - naiveExchange,
    ) / Math.max(Math.abs(naiveExchange), 1e-300),
    correctedCompensatedDivergence: Math.abs(
      compensatedInjectionValue + compensatedSmootherDriftValue - compensatedExchangeValue,
    ) / Math.max(Math.abs(compensatedExchangeValue), 1e-300),
  },
}, null, 2));
