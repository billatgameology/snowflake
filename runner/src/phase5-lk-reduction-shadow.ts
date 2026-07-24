// Phase 5 WP4 pre-shader numerical probe.
//
// This is deliberately not a GPU implementation. It operation-rounds the aggregate-v5
// split smoother, nonlinear boundary solve, and the exact deterministic 256-lane reduction
// composition proposed for WGSL. Its narrow purpose is to establish whether the frozen
// binary32 drift bound and 1e-7 divergence criterion have a representable fixed point before
// production LK shaders are written.

import { pathToFileURL } from "node:url";
import {
  kineticLength,
  nucleationABasal,
  nucleationAPrism,
  randomBit,
  sigma0Basal,
  sigma0Prism,
  STREAM_NOISE_ALPHA_HK,
  type FacetClass,
} from "@vcc/core";
import { LKSolver } from "@vcc/solver-cpu";
import {
  FLOAT32_EPSILON,
  FLOAT32_SMOOTHER_DRIFT_BOUND_FACTOR,
  PHASE5_FIXTURES,
  type Phase5LKFixture,
} from "./phase5-protocol.ts";

const REDUCTION_WIDTH = 256;
const MAX_FIXED_POINT_ITERATIONS = 60;

type ReductionMode = "sum" | "max" | "min";

function fadd(left: number, right: number): number {
  return Math.fround(Math.fround(left) + Math.fround(right));
}

function fsub(left: number, right: number): number {
  return Math.fround(Math.fround(left) - Math.fround(right));
}

function fmul(left: number, right: number): number {
  return Math.fround(Math.fround(left) * Math.fround(right));
}

function fdiv(left: number, right: number): number {
  return Math.fround(Math.fround(left) / Math.fround(right));
}

function reductionIdentity(mode: ReductionMode): number {
  if (mode === "max") return -Infinity;
  if (mode === "min") return Infinity;
  return 0;
}

function combineReduction(left: number, right: number, mode: ReductionMode): number {
  if (mode === "max") return Math.max(left, right);
  if (mode === "min") return Math.min(left, right);
  return fadd(left, right);
}

/** Exact proposed WGSL composition: 256-lane trees recursively reduced in index order. */
export function reducePhase5LkFloat32(
  input: ArrayLike<number>,
  mode: ReductionMode,
): number {
  if (input.length <= 0) throw new Error("LK reduction input must be nonempty");
  let current = Float32Array.from(input, Math.fround);
  while (current.length > 1) {
    const groupCount = Math.ceil(current.length / REDUCTION_WIDTH);
    const next = new Float32Array(groupCount);
    for (let group = 0; group < groupCount; group++) {
      const local = new Float32Array(REDUCTION_WIDTH);
      if (mode !== "sum") local.fill(reductionIdentity(mode));
      const base = group * REDUCTION_WIDTH;
      const count = Math.min(REDUCTION_WIDTH, current.length - base);
      for (let lane = 0; lane < count; lane++) local[lane] = current[base + lane];
      for (let stride = REDUCTION_WIDTH / 2; stride >= 1; stride /= 2) {
        for (let lane = 0; lane < stride; lane++) {
          local[lane] = combineReduction(local[lane], local[lane + stride], mode);
        }
      }
      next[group] = local[0];
    }
    current = next;
  }
  return current[0];
}

export function phase5LkDivergenceFloat32(
  shellInjection: number,
  smootherDrift: number,
  surfaceExchange: number,
): number {
  for (const [name, value] of [
    ["shellInjection", shellInjection],
    ["smootherDrift", smootherDrift],
    ["surfaceExchange", surfaceExchange],
  ] as const) {
    if (!Number.isFinite(value)) {
      throw new Error(`LK f32 divergence ${name} must be finite`);
    }
  }
  const exchange = Math.fround(surfaceExchange);
  const corrected = fsub(fadd(shellInjection, smootherDrift), exchange);
  if (exchange === 0) return corrected === 0 ? 0 : Infinity;
  return fdiv(Math.abs(corrected), Math.abs(exchange));
}

function classifyAggregateFacet(rawNT: number, rawNZ: number): FacetClass {
  if (rawNT === 0 && rawNZ > 0) return "basal";
  if (rawNT === 1 && rawNZ === 0) return "inhibited";
  if (rawNT === 2 && rawNZ === 0) return "prism";
  return "rough";
}

interface FrozenKinetics {
  readonly sigma0Basal: number;
  readonly sigma0Prism: number;
  readonly nucleationABasal: number;
  readonly nucleationAPrism: number;
  readonly dxOverX0: number;
}

function frozenKinetics(solver: LKSolver): FrozenKinetics {
  return {
    sigma0Basal: Math.fround(sigma0Basal(solver.tempC)),
    sigma0Prism: Math.fround(sigma0Prism(solver.tempC)),
    nucleationABasal: Math.fround(nucleationABasal(solver.tempC, solver.paramSet)),
    nucleationAPrism: Math.fround(nucleationAPrism(solver.tempC, solver.paramSet)),
    dxOverX0: Math.fround(
      solver.dxM / kineticLength(solver.tempC, solver.pressurePa),
    ),
  };
}

function attachmentCoefficient(
  solver: LKSolver,
  kinetics: FrozenKinetics,
  index: number,
  facet: FacetClass,
  sigmaSurface: number,
): number {
  if (facet === "inhibited" || sigmaSurface <= 0) return 0;
  let coefficient: number;
  if (facet === "rough") {
    coefficient = 1;
  } else {
    const sigma0 =
      facet === "basal" ? kinetics.sigma0Basal : kinetics.sigma0Prism;
    const prefactor =
      facet === "basal"
        ? kinetics.nucleationABasal
        : kinetics.nucleationAPrism;
    const exponent = -fdiv(sigma0, sigmaSurface);
    coefficient = fmul(prefactor, Math.fround(Math.exp(exponent)));
  }
  if (solver.noiseEpsilon > 0) {
    const bit = randomBit(
      solver.rngSeed,
      index,
      solver.tick,
      STREAM_NOISE_ALPHA_HK,
    );
    coefficient = fmul(
      coefficient,
      fsub(1, fmul(solver.noiseEpsilon, bit)),
    );
  }
  return coefficient;
}

function neighborCounts(solver: LKSolver, index: number): readonly [number, number] {
  return solver.neighborCounts(index);
}

function opposingSigma(
  solver: LKSolver,
  input: Float32Array,
  index: number,
): number {
  const { nx, ny, nz } = solver.dims;
  const plane = nx * ny;
  const k = Math.floor(index / plane);
  const inPlane = index - k * plane;
  const j = Math.floor(inPlane / nx);
  const i = inPlane - j * nx;
  let sum = 0;
  let count = 0;
  const include = (attached: number, opposite: number): void => {
    if (solver.a[attached] === 1 && solver.a[opposite] === 0 && solver.wall[opposite] === 0) {
      sum = fadd(sum, input[opposite]);
      count++;
    }
  };
  if (i + 1 < nx && i > 0) include(index + 1, index - 1);
  if (i > 0 && i + 1 < nx) include(index - 1, index + 1);
  if (j + 1 < ny && j > 0) include(index + nx, index - nx);
  if (j > 0 && j + 1 < ny) include(index - nx, index + nx);
  if (i + 1 < nx && j > 0 && i > 0 && j + 1 < ny) {
    include(index + 1 - nx, index - 1 + nx);
  }
  if (i > 0 && j + 1 < ny && i + 1 < nx && j > 0) {
    include(index - 1 + nx, index + 1 - nx);
  }
  if (k + 1 < nz && k > 0) include(index + plane, index - plane);
  if (k > 0 && k + 1 < nz) include(index - plane, index + plane);
  return count === 0 ? 0 : fdiv(sum, count);
}

function solveBoundary(
  solver: LKSolver,
  kinetics: FrozenKinetics,
  input: Float32Array,
  index: number,
): { readonly sigmaBoundary: number; readonly coefficient: number } {
  const sigmaOpp = opposingSigma(solver, input, index);
  if (sigmaOpp <= 0) return { sigmaBoundary: sigmaOpp, coefficient: 0 };
  const [rawNT, rawNZ] = neighborCounts(solver, index);
  const facet = classifyAggregateFacet(rawNT, rawNZ);
  let iterate = sigmaOpp;
  for (let iteration = 0; iteration < MAX_FIXED_POINT_ITERATIONS; iteration++) {
    const coefficient = attachmentCoefficient(
      solver,
      kinetics,
      index,
      facet,
      iterate,
    );
    const next = fdiv(sigmaOpp, fadd(1, fmul(coefficient, kinetics.dxOverX0)));
    iterate = fmul(0.5, fadd(iterate, next));
  }
  const coefficient = attachmentCoefficient(
    solver,
    kinetics,
    index,
    facet,
    iterate,
  );
  const solved = fdiv(
    sigmaOpp,
    fadd(1, fmul(coefficient, kinetics.dxOverX0)),
  );
  const fixedPointError = Math.abs(fsub(solved, iterate));
  const fixedPointLimit = 8 * FLOAT32_EPSILON * Math.max(Math.abs(sigmaOpp), 2 ** -126);
  if (!Number.isFinite(solved) || !Number.isFinite(coefficient)) {
    throw new Error(`non-finite f32 boundary solution at ${index}`);
  }
  if (fixedPointError > fixedPointLimit) {
    throw new Error(
      `f32 boundary fixed point failed at ${index}: ${fixedPointError} > ${fixedPointLimit}`,
    );
  }
  return { sigmaBoundary: solved, coefficient };
}

interface SweepResult {
  readonly sigma: Float32Array;
  readonly residual: number;
  readonly shellInjection: number;
  readonly surfaceExchange: number;
  readonly smootherDrift: number;
  readonly smootherDriftLimit: number;
  readonly divergenceResidual: number | null;
  readonly minLocalSurfaceExchange: number;
}

function f32Sweep(solver: LKSolver, src: Float32Array): SweepResult {
  const { nx, ny, nz } = solver.dims;
  const plane = nx * ny;
  const count = src.length;
  const inPlane = new Float32Array(count);
  const dst = new Float32Array(count);
  const driftTerms = new Float32Array(count);
  const maxInputTerms = new Float32Array(count);
  const exchangeTerms = new Float32Array(count);
  exchangeTerms.fill(Infinity);
  const shellTerms = new Float32Array(count);
  const residualTerms = new Float32Array(count);

  for (let k = 0; k < nz; k++) {
    const kBase = k * plane;
    for (let j = 0; j < ny; j++) {
      const row = kBase + j * nx;
      for (let i = 0; i < nx; i++) {
        const index = row + i;
        if (solver.a[index] === 1 || solver.wall[index] === 1) continue;
        const own = src[index];
        const sample = (candidate: number, valid: boolean): number =>
          valid && solver.a[candidate] === 0 && solver.wall[candidate] === 0
            ? src[candidate]
            : own;
        const east = sample(index + 1, i + 1 < nx);
        const west = sample(index - 1, i > 0);
        const ne = sample(index + nx, j + 1 < ny);
        const sw = sample(index - nx, j > 0);
        const se = sample(index + 1 - nx, i + 1 < nx && j > 0);
        const nw = sample(index - 1 + nx, i > 0 && j + 1 < ny);
        const pairs = [fadd(east, west), fadd(ne, sw), fadd(se, nw)].sort(
          (left, right) => left - right,
        );
        inPlane[index] = fdiv(fadd(fadd(fadd(own, pairs[0]), pairs[1]), pairs[2]), 7);
      }
    }
  }

  for (let k = 0; k < nz; k++) {
    const kBase = k * plane;
    for (let offset = 0; offset < plane; offset++) {
      const index = kBase + offset;
      if (solver.a[index] === 1 || solver.wall[index] === 1) continue;
      const own = inPlane[index];
      const up =
        k + 1 < nz &&
        solver.a[index + plane] === 0 &&
        solver.wall[index + plane] === 0
          ? inPlane[index + plane]
          : own;
      const down =
        k > 0 &&
        solver.a[index - plane] === 0 &&
        solver.wall[index - plane] === 0
          ? inPlane[index - plane]
          : own;
      const candidate = fadd(fmul(4 / 7, own), fmul(3 / 14, fadd(up, down)));
      dst[index] = candidate;
      driftTerms[index] = fsub(candidate, src[index]);
      maxInputTerms[index] = Math.abs(src[index]);
    }
  }

  const kinetics = frozenKinetics(solver);
  for (const index of solver.boundaryCells()) {
    const boundary = solveBoundary(solver, kinetics, dst, index);
    exchangeTerms[index] = fsub(dst[index], boundary.sigmaBoundary);
  }
  const surfaceExchange = reducePhase5LkFloat32(
    Array.from(exchangeTerms, (value) => (value === Infinity ? 0 : value)),
    "sum",
  );
  const minLocalSurfaceExchange = reducePhase5LkFloat32(exchangeTerms, "min");
  for (const index of solver.boundaryCells()) {
    dst[index] = solveBoundary(solver, kinetics, dst, index).sigmaBoundary;
  }

  if (solver.farField === "dirichlet") {
    const target = Math.fround(solver.sigmaInfinity);
    for (const index of solver.dirichletCells) {
      if (solver.a[index] === 1 || solver.wall[index] === 1) continue;
      shellTerms[index] = fsub(target, dst[index]);
      dst[index] = target;
    }
  }
  for (let index = 0; index < count; index++) {
    if (solver.a[index] === 0 && solver.wall[index] === 0) {
      residualTerms[index] = Math.abs(fsub(dst[index], src[index]));
    }
  }

  const shellInjection = reducePhase5LkFloat32(shellTerms, "sum");
  const smootherDrift = reducePhase5LkFloat32(driftTerms, "sum");
  const maxAbsSweepInput = reducePhase5LkFloat32(maxInputTerms, "max");
  const smootherDriftLimit =
    maxAbsSweepInput === 0
      ? 0
      : FLOAT32_SMOOTHER_DRIFT_BOUND_FACTOR *
        solver.activeCellCount *
        FLOAT32_EPSILON *
        maxAbsSweepInput;
  const residual = fdiv(
    reducePhase5LkFloat32(residualTerms, "max"),
    solver.sigmaInfinity,
  );
  const divergenceResidual =
    solver.farField === "dirichlet"
      ? phase5LkDivergenceFloat32(
          shellInjection,
          smootherDrift,
          surfaceExchange,
        )
      : null;
  for (const [name, value] of [
    ["residual", residual],
    ["shellInjection", shellInjection],
    ["surfaceExchange", surfaceExchange],
    ["smootherDrift", smootherDrift],
    ["smootherDriftLimit", smootherDriftLimit],
    ["minimum local exchange", minLocalSurfaceExchange],
  ] as const) {
    if (!Number.isFinite(value)) throw new Error(`non-finite f32 ${name}`);
  }
  if (divergenceResidual !== null && !Number.isFinite(divergenceResidual)) {
    throw new Error("non-finite f32 divergence residual");
  }
  return {
    sigma: dst,
    residual,
    shellInjection,
    surfaceExchange,
    smootherDrift,
    smootherDriftLimit,
    divergenceResidual,
    minLocalSurfaceExchange,
  };
}

export interface Phase5LkReductionSample {
  readonly fixtureId: string;
  readonly completedStep: number;
  readonly sweeps: number;
  readonly residual: number;
  readonly divergenceResidual: number | null;
  readonly shellInjection: number;
  readonly surfaceExchange: number;
  readonly smootherDrift: number;
  readonly smootherDriftLimit: number;
  readonly passesDriftBound: boolean;
  readonly passesDualConvergence: boolean;
  readonly passesPositiveSourceExchange: boolean | null;
}

export interface Phase5LkReductionShadowReport {
  readonly schema: "phase5-lk-f32-reduction-shadow-v1";
  readonly reductionWidth: 256;
  readonly fixedPointIterations: 60;
  readonly arithmetic: "Math.fround-after-each-shaped-operation";
  readonly divergenceComposition:
    "f32(f32(shellInjection+smootherDrift)-surfaceExchange)";
  readonly zeroExchangeRule: "zero-numerator-passes-nonzero-numerator-fails";
  readonly samples: readonly Phase5LkReductionSample[];
  readonly allSamplesPass: boolean;
}

function runFixture(fixture: Phase5LKFixture): Phase5LkReductionSample[] {
  const solver = new LKSolver({
    surfacePolicy: fixture.surfacePolicy,
    dims: fixture.dims,
    tempC: fixture.tempC,
    sigmaInfinity: fixture.sigmaInfinity,
    dxUm: fixture.dxUm,
    pressurePa: fixture.pressurePa,
    paramSet: fixture.paramSet,
    cflFill: fixture.cflFill,
    relaxTol: fixture.relaxTol,
    divTol: fixture.divTol,
    relaxMaxSweeps: fixture.relaxMaxSweeps,
    rngSeed: fixture.rngSeed,
    noiseEpsilon: fixture.noiseEpsilon,
    domain: fixture.domain,
    farField: fixture.farField,
    seedRadius: fixture.seedRadius,
    seedThickness: fixture.seedThickness,
  });
  const samples: Phase5LkReductionSample[] = [];
  const stepCap = Number(fixture.stop.value);
  for (let completedStep = 0; completedStep < stepCap; completedStep++) {
    if (
      fixture.timeline !== null &&
      completedStep === fixture.timeline.completedStep
    ) {
      solver.applyTimelineEnvironment({
        tempC: fixture.timeline.tempC,
        sigmaInfinity: fixture.timeline.sigmaInfinity,
      });
    }
    const cpuRelaxation = solver.relaxField();
    if (!cpuRelaxation.converged) {
      throw new Error(`${fixture.id} CPU oracle did not converge at step ${completedStep}`);
    }
    let sigma: Float32Array<ArrayBufferLike> = Float32Array.from(
      solver.sigma,
      Math.fround,
    );
    let last: SweepResult | null = null;
    let sweeps = 0;
    while (sweeps < fixture.relaxMaxSweeps) {
      last = f32Sweep(solver, sigma);
      sigma = last.sigma;
      sweeps++;
      const divergenceSatisfied =
        last.divergenceResidual === null ||
        last.divergenceResidual < fixture.divTol;
      if (last.residual < fixture.relaxTol && divergenceSatisfied) break;
    }
    if (last === null) throw new Error("f32 shadow executed no sweeps");
    const passesDriftBound =
      Math.abs(last.smootherDrift) <= last.smootherDriftLimit;
    const passesDualConvergence =
      last.residual < fixture.relaxTol &&
      (last.divergenceResidual === null ||
        last.divergenceResidual < fixture.divTol);
    const passesPositiveSourceExchange =
      fixture.farField === "dirichlet"
        ? last.shellInjection > 0 && last.surfaceExchange > 0
        : null;
    samples.push({
      fixtureId: fixture.id,
      completedStep,
      sweeps,
      residual: last.residual,
      divergenceResidual: last.divergenceResidual,
      shellInjection: last.shellInjection,
      surfaceExchange: last.surfaceExchange,
      smootherDrift: last.smootherDrift,
      smootherDriftLimit: last.smootherDriftLimit,
      passesDriftBound,
      passesDualConvergence,
      passesPositiveSourceExchange,
    });
    if (!passesDriftBound || !passesDualConvergence) break;
    solver.advanceSurface();
  }
  return samples;
}

export function runPhase5LkReductionShadow(): Phase5LkReductionShadowReport {
  const fixtures = PHASE5_FIXTURES.filter(
    (fixture): fixture is Phase5LKFixture => fixture.kind === "lk" && fixture.blocking,
  );
  const samples = fixtures.flatMap(runFixture);
  return {
    schema: "phase5-lk-f32-reduction-shadow-v1",
    reductionWidth: REDUCTION_WIDTH,
    fixedPointIterations: MAX_FIXED_POINT_ITERATIONS,
    arithmetic: "Math.fround-after-each-shaped-operation",
    divergenceComposition:
      "f32(f32(shellInjection+smootherDrift)-surfaceExchange)",
    zeroExchangeRule: "zero-numerator-passes-nonzero-numerator-fails",
    samples,
    allSamplesPass: samples.every(
      (sample) =>
        sample.passesDriftBound &&
        sample.passesDualConvergence &&
        sample.passesPositiveSourceExchange !== false,
    ),
  };
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(runPhase5LkReductionShadow(), null, 2));
}
