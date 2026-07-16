// LibbrechtKinetics operator tests — the commitments of attachment-kinetics §4.4 component 6
// (tests 2-7; test 1, GGThreshold bit-identity, lives in the existing 2a suites, which run
// through the refactored step()). Dev-grid scale; the habit gate itself runs via the runner.

import { describe, expect, it } from "vitest";
import {
  alphaHK,
  cellCount,
  classifyFacet,
  hexDistance,
  isD6hInvariantSet,
  randomBit,
  randomUnit,
  symmetryError,
  GG_PRESETS,
  STREAM_NOISE_ALPHA_HK,
} from "@vcc/core";
import { GGSolver, LKSolver } from "@vcc/solver-cpu";

const devOptions = {
  surfacePolicy: "aggregate-hv-g1h1-v4",
  dims: { nx: 24, ny: 24, nz: 14 },
  tempC: -5,
  sigmaInfinity: 0.01,
  dxUm: 0.35,
  rngSeed: 1,
  relaxTol: 1e-8,
} as const;

const neighborDirections = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [1, -1, 0],
  [-1, 1, 0],
  [0, 0, 1],
  [0, 0, -1],
] as const;

function coords(index: number, dims: { nx: number; ny: number; nz: number }): [number, number, number] {
  const plane = dims.nx * dims.ny;
  const i = index % dims.nx;
  const inPlane = index % plane;
  return [i, (inPlane - i) / dims.nx, (index - inPlane) / plane];
}

function indexOf(i: number, j: number, k: number, dims: { nx: number; ny: number; nz: number }): number {
  return k * dims.nx * dims.ny + j * dims.nx + i;
}

function independentCounts(
  crystal: Uint8Array,
  index: number,
  dims: { nx: number; ny: number; nz: number },
): [number, number] {
  const [i, j, k] = coords(index, dims);
  let nT = 0;
  let nZ = 0;
  for (const [di, dj, dk] of neighborDirections) {
    const ni = i + di;
    const nj = j + dj;
    const nk = k + dk;
    if (ni < 0 || ni >= dims.nx || nj < 0 || nj >= dims.ny || nk < 0 || nk >= dims.nz) continue;
    if (crystal[indexOf(ni, nj, nk, dims)] === 1) {
      if (dk === 0) nT++;
      else nZ++;
    }
  }
  return [nT, nZ];
}

function independentOpposingCells(
  solver: LKSolver,
  index: number,
): number[] {
  const [i, j, k] = coords(index, solver.dims);
  const opposing: number[] = [];
  for (const [di, dj, dk] of neighborDirections) {
    const attachedI = i + di;
    const attachedJ = j + dj;
    const attachedK = k + dk;
    const oppositeI = i - di;
    const oppositeJ = j - dj;
    const oppositeK = k - dk;
    if (
      attachedI < 0 ||
      attachedI >= solver.dims.nx ||
      attachedJ < 0 ||
      attachedJ >= solver.dims.ny ||
      attachedK < 0 ||
      attachedK >= solver.dims.nz ||
      oppositeI < 0 ||
      oppositeI >= solver.dims.nx ||
      oppositeJ < 0 ||
      oppositeJ >= solver.dims.ny ||
      oppositeK < 0 ||
      oppositeK >= solver.dims.nz
    ) continue;
    const attached = indexOf(attachedI, attachedJ, attachedK, solver.dims);
    const opposite = indexOf(oppositeI, oppositeJ, oppositeK, solver.dims);
    if (solver.a[attached] === 1 && solver.a[opposite] === 0 && solver.wall[opposite] === 0) {
      opposing.push(opposite);
    }
  }
  return opposing;
}

/** Independently reproduce only the certified Phase 2a reflecting smoother candidate. */
function independentReflectingCandidate(
  solver: LKSolver,
  source: Float64Array,
): Float64Array {
  const { nx, ny, nz } = solver.dims;
  const plane = nx * ny;
  const inPlane = new Float64Array(source.length);
  const candidate = new Float64Array(source.length);
  const blocked = (index: number): boolean => solver.a[index] === 1 || solver.wall[index] === 1;
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const index = indexOf(i, j, k, solver.dims);
        if (blocked(index)) continue;
        const own = source[index];
        const reflected = (ni: number, nj: number): number => {
          if (ni < 0 || ni >= nx || nj < 0 || nj >= ny) return own;
          const neighbor = indexOf(ni, nj, k, solver.dims);
          return blocked(neighbor) ? own : source[neighbor];
        };
        const pairs = [
          reflected(i + 1, j) + reflected(i - 1, j),
          reflected(i, j + 1) + reflected(i, j - 1),
          reflected(i + 1, j - 1) + reflected(i - 1, j + 1),
        ].sort((left, right) => left - right);
        inPlane[index] = (((own + pairs[0]) + pairs[1]) + pairs[2]) / 7;
      }
    }
  }
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const index = indexOf(i, j, k, solver.dims);
        if (blocked(index)) continue;
        const own = inPlane[index];
        const upIndex = k + 1 < nz ? index + plane : index;
        const downIndex = k > 0 ? index - plane : index;
        const up = k + 1 < nz && !blocked(upIndex) ? inPlane[upIndex] : own;
        const down = k > 0 && !blocked(downIndex) ? inPlane[downIndex] : own;
        candidate[index] = (4 / 7) * own + (3 / 14) * (up + down);
      }
    }
  }
  return candidate;
}

describe("LKSolver — aggregate-hv-g1h1-v4 topology and boundary law (ADR 0009)", () => {
  it("independently derives the canonical seed's exact [01]/[20]/[10] boundary histogram", () => {
    const solver = new LKSolver(devOptions);
    const independentBoundary: number[] = [];
    const histogram = new Map<string, number>();
    for (let index = 0; index < solver.a.length; index++) {
      if (solver.a[index] === 1 || solver.wall[index] === 1) continue;
      const [nT, nZ] = independentCounts(solver.a, index, solver.dims);
      if (nT + nZ === 0) continue;
      independentBoundary.push(index);
      const key = `${nT}${nZ}`;
      histogram.set(key, (histogram.get(key) ?? 0) + 1);
    }
    expect(solver.attachedCount).toBe(19);
    expect(independentBoundary).toHaveLength(56);
    expect(histogram).toEqual(new Map([["01", 38], ["20", 12], ["10", 6]]));
    expect([...solver.boundaryCells()].sort((a, b) => a - b)).toEqual(independentBoundary);
  });

  it("routes exactly the 12 [20] cells through prism kinetics in boundary solve and fill", () => {
    const solver = new LKSolver({
      ...devOptions,
      testAlphaOverride: (facet) => (facet === "prism" ? 1 : 0),
    });
    const boundaryAtStart = [...solver.boundaryCells()];
    const prismCells = boundaryAtStart.filter(
      (index) => independentCounts(solver.a, index, solver.dims).join("") === "20",
    );
    expect(prismCells).toHaveLength(12);
    const relaxation = solver.relaxField();
    expect(relaxation.converged).toBe(true);
    expect(relaxation.surfaceExchangeDiagnostic).toBeGreaterThan(0);
    for (const index of boundaryAtStart) {
      const [nT, nZ] = independentCounts(solver.a, index, solver.dims);
      const state = solver.boundaryState(index);
      if (nT === 2 && nZ === 0) {
        expect(state.alphaHKBoundary).toBe(1);
        expect(state.sigmaBoundary).toBeLessThan(state.sigmaOpp);
      } else {
        expect(state.alphaHKBoundary).toBe(0);
      }
    }
    solver.advanceSurface();
    const filled = boundaryAtStart.filter((index) => solver.f[index] > 0);
    expect(filled.sort((a, b) => a - b)).toEqual(prismCells.sort((a, b) => a - b));
  });

  it("uses the same self-consistent G_b=H_b=1 law on [01] and [20]", () => {
    const coefficient = 0.25;
    const solver = new LKSolver({ ...devOptions, relaxTol: 1e-10, testAlphaOverride: () => coefficient });
    expect(solver.relaxField().converged).toBe(true);
    const ratio = solver.dxM / solver.x0M;
    for (const configuration of [[0, 1], [2, 0]] as const) {
      const index = solver.boundaryCells().find((cell) => {
        const counts = independentCounts(solver.a, cell, solver.dims);
        return counts[0] === configuration[0] && counts[1] === configuration[1];
      });
      expect(index).not.toBeUndefined();
      const cell = index as number;
      const state = solver.boundaryState(cell);
      expect(state.robinGeometry).toBe(1);
      expect(state.fillGeometry).toBe(1);
      expect(state.fillGeometry).not.toBe(configuration[0] === 2 ? 4 / 3 : -1);
      expect(state.sigmaOpp).toBeGreaterThan(0);
      expect(state.sigmaBoundary).toBeCloseTo(
        state.sigmaOpp / (1 + coefficient * ratio),
        12,
      );
      expect(solver.sigma[cell]).toBeCloseTo(state.sigmaBoundary, 12);
    }
  });

  it("averages unequal post-smoother [20] opposing pixels and reaches the zero-coefficient limit", () => {
    const solver = new LKSolver({
      ...devOptions,
      farField: "reflecting",
      relaxTol: 1e9,
      relaxMaxSweeps: 1,
      testAlphaOverride: () => 0,
    });
    const target = solver.boundaryCells().find((cell) => {
      const [nT, nZ] = independentCounts(solver.a, cell, solver.dims);
      return nT === 2 && nZ === 0;
    }) as number;
    const opposing = independentOpposingCells(solver, target);
    expect(opposing).toHaveLength(2);
    for (let index = 0; index < solver.sigma.length; index++) {
      if (solver.a[index] === 0 && solver.wall[index] === 0) solver.sigma[index] = 0.001;
    }
    solver.sigma[opposing[0]] = 0.1;
    solver.sigma[opposing[1]] = 0.04;
    const [targetI, targetJ, targetK] = coords(target, solver.dims);
    const [oppositeI, oppositeJ, oppositeK] = coords(opposing[0], solver.dims);
    const outward = indexOf(
      2 * oppositeI - targetI,
      2 * oppositeJ - targetJ,
      2 * oppositeK - targetK,
      solver.dims,
    );
    expect(solver.a[outward]).toBe(0);
    expect(solver.wall[outward]).toBe(0);
    solver.sigma[outward] = 0.2;
    const source = solver.sigma.slice();
    const candidate = independentReflectingCandidate(solver, source);
    expect(candidate[opposing[0]]).not.toBe(candidate[opposing[1]]);
    expect(candidate[opposing[0]]).not.toBe(source[opposing[0]]);
    expect(candidate[opposing[1]]).not.toBe(source[opposing[1]]);
    expect(solver.relaxField().converged).toBe(true);
    const state = solver.boundaryState(target);
    const expectedMean = (candidate[opposing[0]] + candidate[opposing[1]]) / 2;
    expect(state.sigmaOpp).toBeCloseTo(expectedMean, 14);
    expect(state.alphaHKBoundary).toBe(0);
    expect(state.sigmaBoundary).toBeCloseTo(expectedMean, 14);
    expect(solver.sigma[target]).toBe(state.sigmaBoundary);
  });

  it("keeps signed negative local relaxation exchange separate from nonnegative demand", () => {
    const makeProbe = (farField: "reflecting" | "dirichlet", sweeps: number): LKSolver => {
      const solver = new LKSolver({
        ...devOptions,
        farField,
        relaxTol: 1e9,
        divTol: 1e-12,
        relaxMaxSweeps: sweeps,
        testAlphaOverride: () => 0.05,
      });
      const target = solver.boundaryCells().find((cell) => {
        const [nT, nZ] = independentCounts(solver.a, cell, solver.dims);
        return nT === 2 && nZ === 0;
      }) as number;
      const [centerI, centerJ] = solver.center;
      for (let index = 0; index < solver.sigma.length; index++) {
        if (solver.a[index] === 0 && solver.wall[index] === 0) {
          const [i, j] = coords(index, solver.dims);
          solver.sigma[index] =
            0.001 * (1 + hexDistance(i - centerI, j - centerJ));
        }
      }
      expect(independentOpposingCells(solver, target)).toHaveLength(2);
      return solver;
    };

    const reflecting = makeProbe("reflecting", 1);
    const source = reflecting.sigma.slice();
    const candidate = independentReflectingCandidate(reflecting, source);
    const boundary = [...reflecting.boundaryCells()];
    const report = reflecting.relaxField();
    expect(report.converged).toBe(true);
    let independentExchange = 0;
    let independentMinimum = Infinity;
    const ratio = reflecting.dxM / reflecting.x0M;
    for (const cell of boundary) {
      const opposing = independentOpposingCells(reflecting, cell);
      const sigmaOpp =
        opposing.length === 0
          ? 0
          : opposing.reduce((sum, opposite) => sum + candidate[opposite], 0) / opposing.length;
      const expectedBoundary = sigmaOpp / (1 + 0.05 * ratio);
      expect(reflecting.boundaryState(cell).sigmaOpp).toBeCloseTo(sigmaOpp, 14);
      expect(reflecting.boundaryState(cell).sigmaBoundary).toBeCloseTo(expectedBoundary, 14);
      expect(reflecting.sigma[cell]).toBeCloseTo(expectedBoundary, 14);
      const local = candidate[cell] - expectedBoundary;
      independentExchange += local;
      if (local < independentMinimum) independentMinimum = local;
    }
    expect(independentMinimum).toBeLessThan(0);
    expect(report.surfaceExchangeDiagnostic).toBeCloseTo(independentExchange, 14);
    expect(report.minLocalSurfaceExchangeDiagnostic).toBeCloseTo(independentMinimum, 14);
    const positiveDemand = [...reflecting.boundaryCells()].reduce((sum, cell) => {
      const state = reflecting.boundaryState(cell);
      return sum + state.alphaHKBoundary * reflecting.vKinMS * state.sigmaBoundary / reflecting.dxM;
    }, 0);
    expect(positiveDemand).toBeGreaterThan(0);
    expect(report.divergenceResidual).toBeNull();

    const dirichlet = makeProbe("dirichlet", 1);
    const failed = dirichlet.relaxField();
    expect(failed.residual).toBeLessThan(1e9);
    expect(failed.divergenceResidual).toBeGreaterThan(dirichlet.divTol);
    expect(failed.converged).toBe(false);
  });

  it("reports signed numerical exchange separately from aggregate kinetic demand", () => {
    const solver = new LKSolver(devOptions);
    const report = solver.relaxField();
    expect(report.converged).toBe(true);
    let kineticDemandInSweepUnits = 0;
    for (const cell of solver.boundaryCells()) {
      const state = solver.boundaryState(cell);
      kineticDemandInSweepUnits +=
        state.alphaHKBoundary * (solver.dxM / solver.x0M) * state.sigmaBoundary;
    }
    expect(kineticDemandInSweepUnits).toBeGreaterThan(0);
    const diagnosticRatio =
      (report.surfaceExchangeDiagnostic as number) / kineticDemandInSweepUnits;
    // Pinned dev-grid diagnostic, not an identity or a physical-uptake ratio. Its distance
    // from one is why the ledger is defined by kinetic demand rather than numerical exchange.
    expect(diagnosticRatio).toBeCloseTo(0.38580300568049064, 10);
  });

  it("never revives inhibited [10] kinetics with production noise", () => {
    const solver = new LKSolver({ ...devOptions, noiseEpsilon: 1 });
    expect(solver.relaxField().converged).toBe(true);
    const tips = solver.boundaryCells().filter((cell) => {
      const [nT, nZ] = independentCounts(solver.a, cell, solver.dims);
      return nT === 1 && nZ === 0;
    });
    expect(tips).toHaveLength(6);
    for (const tip of tips) expect(solver.boundaryState(tip).alphaHKBoundary).toBe(0);
  });

  it("applies the same nonzero noise multiplier in Eq. 5.34 and the fill increment", () => {
    const noiseEpsilon = 0.4;
    const nominal = 0.5;
    const solver = new LKSolver({
      ...devOptions,
      noiseEpsilon,
      testAlphaOverride: () => nominal,
    });
    const target = solver.boundaryCells().find((cell) => {
      const [nT, nZ] = independentCounts(solver.a, cell, solver.dims);
      return (
        nT === 2 &&
        nZ === 0 &&
        randomBit(solver.rngSeed, cell, solver.tick, STREAM_NOISE_ALPHA_HK) === 1
      );
    }) as number;
    expect(target).not.toBeUndefined();
    expect(solver.relaxField().converged).toBe(true);
    const state = solver.boundaryState(target);
    const expectedCoefficient = nominal * (1 - noiseEpsilon);
    expect(state.alphaHKBoundary).toBeCloseTo(expectedCoefficient, 15);
    expect(state.sigmaBoundary).toBeCloseTo(
      state.sigmaOpp / (1 + expectedCoefficient * solver.dxM / solver.x0M),
      14,
    );
    const expectedRate =
      expectedCoefficient * solver.vKinMS * state.sigmaBoundary / solver.dxM;
    const surface = solver.advanceSurface();
    expect(surface.deltaTimeSeconds).toBeGreaterThan(0);
    expect(solver.f[target]).toBeCloseTo(
      expectedRate * (surface.deltaTimeSeconds as number),
      14,
    );
  });
});

describe("LKSolver — Robin limits (§4.4 test 2)", () => {
  it("alphaHK ≡ 0 recovers GG's reflecting pass bitwise on a nonuniform field", () => {
    // Same mask and 19-site seed => identical blocked geometry. A deterministic nonuniform
    // field makes this non-vacuous: deleting either smoother would fail. The deliberately
    // loose residual threshold stops LK after exactly one reflecting sweep.
    const gg = new GGSolver({
      dims: devOptions.dims,
      params: GG_PRESETS.plate,
      rngSeed: devOptions.rngSeed,
      domain: "hexPrism",
      farField: "reflecting",
    });
    const solver = new LKSolver({
      ...devOptions,
      surfacePolicy: "legacy-v3",
      farField: "reflecting",
      relaxTol: 1e9,
      testAlphaOverride: () => 0,
    });
    const n = cellCount(solver.dims);
    for (let x = 0; x < n; x++) {
      if (gg.a[x] === 1 || solver.wall[x] === 1) continue;
      const value = 0.05 + 0.05 * randomUnit(7, x, 0, 99);
      gg.d[x] = value;
      solver.sigma[x] = value;
    }
    gg.relaxField();
    const progress: Array<{
      sweeps: number;
      residual: number;
      divergenceResidual: number | null;
    }> = [];
    const report = solver.relaxField((sample) => progress.push(sample));
    expect(report.converged).toBe(true);
    expect(report.sweeps).toBe(1);
    expect(report.surfaceExchangeDiagnostic).toBe(0);
    expect(report.divergenceResidual).toBeNull();
    expect(progress).toHaveLength(1);
    expect(progress[0].sweeps).toBe(1);
    expect(progress[0].divergenceResidual).toBeNull();
    for (let x = 0; x < n; x++) {
      expect(solver.sigma[x], `cell ${x}`).toBe(gg.d[x]);
    }
    // And no growth machinery fires after that valid reflecting relaxation.
    const surface = solver.advanceSurface();
    expect(surface.stalled).toBe(true);
    expect(solver.attachedCount).toBe(19);
    expect(solver.fillLedger).toBe(0);
  });

  it("alphaHK ≡ 1 with dx >> X_0 drives sigma_b far below sigma_infinity", () => {
    const solver = new LKSolver({
      ...devOptions,
      dxUm: 3.5, // dx/X0 ~ 24: Eq. 5.34 strongly suppresses sigma_b
      testAlphaOverride: () => 1,
    });
    const report = solver.relaxField();
    expect(report.converged).toBe(true);
    let maxBoundarySigma = 0;
    for (const x of solver.boundaryCells()) {
      if (solver.sigma[x] > maxBoundarySigma) maxBoundarySigma = solver.sigma[x];
    }
    // The aggregate pixel stores sigma_b itself. Eq. 5.34 with G_b=1 requires a large
    // dx/X0 and strong coefficient to drive it far below sigma_opp and the far field.
    expect(maxBoundarySigma).toBeLessThan(0.6 * devOptions.sigmaInfinity);
    // A weaker attachment boundary leaves sigma_b higher.
    const weak = new LKSolver({ ...devOptions, dxUm: 3.5, testAlphaOverride: () => 0.05 });
    weak.relaxField();
    let weakMax = 0;
    for (const x of weak.boundaryCells()) {
      if (weak.sigma[x] > weakMax) weakMax = weak.sigma[x];
    }
    expect(weakMax).toBeGreaterThan(maxBoundarySigma);
  });
});

describe("LKSolver — divergence identity (§4.4 test 3)", () => {
  it("at convergence, Dirichlet injection equals signed net boundary exchange", () => {
    // The identity is exact at the true fixed point; at a field converged to relaxTol it
    // holds to ~1e3 x relaxTol (the per-sweep-change criterion under-reports distance to
    // the fixed point by the slow-mode factor). divTol is therefore an independent,
    // load-bearing stop condition: assert it directly and prove below that residual-only
    // stopping would finish earlier with an unacceptable divergence residual.
    const solver = new LKSolver(devOptions);
    const report = solver.relaxField();
    expect(report.converged).toBe(true);
    expect(report.surfaceExchangeDiagnostic).toBeGreaterThan(0);
    expect(report.divergenceResidual).toBeLessThan(solver.divTol);
    // Negative control: make the divergence guard deliberately loose. The residual criterion
    // becomes true earlier while the registered divTol would still fail, proving the test
    // distinguishes dual convergence from the round-3 residual-only defect.
    const looseDivergence = new LKSolver({ ...devOptions, divTol: 1 });
    const looseReport = looseDivergence.relaxField();
    expect(looseReport.converged).toBe(true);
    expect(looseReport.residual).toBeLessThan(devOptions.relaxTol);
    expect(looseReport.divergenceResidual).toBeGreaterThan(solver.divTol);
    expect(looseReport.sweeps).toBeLessThan(report.sweeps);
    // And it keeps holding as the crystal grows.
    for (let t = 0; t < 30; t++) solver.step();
    const later = solver.relaxField();
    expect(later.converged).toBe(true);
    expect(later.divergenceResidual).toBeLessThan(solver.divTol);
    // Tightening the tolerance tightens the identity (the scaling claim, tested).
    const tight = new LKSolver({ ...devOptions, relaxTol: 1e-10 });
    const tightReport = tight.relaxField();
    expect(tightReport.divergenceResidual).toBeLessThan(tight.divTol);
    expect(tightReport.divergenceResidual).toBeLessThan(report.divergenceResidual as number);
  });
});

describe("LKSolver — ledger identity (§4.4 test 4)", () => {
  it("fill ledger + hole-fill deficit account for every attached cell and every partial fill", () => {
    const solver = new LKSolver(devOptions);
    const seedCells = solver.attachedCount;
    for (let t = 0; t < 120; t++) solver.step();
    let partialFill = 0;
    const n = cellCount(solver.dims);
    for (let x = 0; x < n; x++) {
      if (solver.a[x] === 0) partialFill += solver.f[x];
    }
    const grownCells = solver.attachedCount - seedCells;
    // Every non-seed attached cell reached f = 1 through ledgered fill or hole-fill deficit;
    // partially filled boundary cells hold the rest. Exact bookkeeping up to float summation.
    expect(solver.fillLedger + solver.holeFillDeficit).toBeCloseTo(grownCells + partialFill, 6);
    expect(solver.fillLedger).toBeGreaterThan(0);
  });

  it("with alphaHK ≡ 0 there is no second uptake channel: nothing moves, ever", () => {
    const solver = new LKSolver({ ...devOptions, testAlphaOverride: () => 0 });
    for (let t = 0; t < 25; t++) solver.step();
    expect(solver.attachedCount).toBe(19);
    expect(solver.fillLedger).toBe(0);
    expect(solver.holeFillDeficit).toBe(0);
  });

  it("NON-TAUTOLOGICAL: the ledger delta equals independently recomputed kinetic demand", () => {
    // Independently recompute the aggregate-v4 H_b=1 demand from the public converged
    // boundary field, raw counts, and core kinetics. Neither solver rate cache nor ledger
    // internals enter the expected value. Saturating steps exercise recorded clipping.
    const solver = new LKSolver(devOptions);
    const dxM = devOptions.dxUm * 1e-6;
    const cellRate = (x: number): number => {
      const [nT, nZ] = solver.neighborCounts(x);
      const facet = classifyFacet(nT, nZ, "aggregate-hv-g1h1-v4");
      const sigmaBoundary = Math.max(solver.sigma[x], 0);
      const velocity =
        alphaHK(facet, devOptions.tempC, sigmaBoundary, "CAK_A1") *
        solver.vKinMS *
        sigmaBoundary;
      return velocity / dxM;
    };
    let sawSaturation = false;
    for (let t = 0; t < 60; t++) {
      const relax = solver.relaxField();
      expect(relax.converged).toBe(true);
      const rates = Array.from(solver.boundaryCells()).map(cellRate);
      const maxRate = Math.max(...rates);
      if (maxRate <= 0) break;
      const deltaT = 0.1 / maxRate; // cflFill default 0.1
      const expectedDemand = rates.reduce((sum, r) => sum + r * deltaT, 0);
      const ledgerBefore = solver.fillLedger;
      const clippedBefore = solver.saturationClippedFill;
      solver.advanceSurface();
      const accounted =
        solver.fillLedger - ledgerBefore + (solver.saturationClippedFill - clippedBefore);
      expect(accounted / expectedDemand, `step ${t}`).toBeCloseTo(1, 8);
      if (solver.saturationClippedFill > clippedBefore) sawSaturation = true;
      solver.tick++; // manual stepping: keep the tick advancing as step() would
    }
    // The identity must exercise a SATURATING step. In the historical round-3 audit probe,
    // recomputed demand exceeded the ledger by 35% when clipping was silent; its ad-hoc
    // script/config was not retained, so ADR 0006 labels that number non-reproducible history.
    expect(sawSaturation).toBe(true);
  });
});

describe("LKSolver — legacy-v3 sink-vs-demand regression", () => {
  it("COMPUTED: legacy Robin absorption vs converged-field per-sweep demand", () => {
    // Round-4 maker review, should-fix: §4.4 cited a sink-vs-demand band as a "reported
    // diagnostic" while nothing in the repo computed it. This test IS the diagnostic now.
    // Pinned reproduction: devOptions (hexPrism 24,24,14, T=-5C, sigma_inf=0.01,
    // dx=0.35um, CAK_A1, seed 1, relaxTol 1e-8), 80 growth steps, command `npm test`.
    //
    // NUMERATOR: surfaceExchangeDiagnostic — under legacy-v3, the final sweep's Robin absorption
    // at Robin faces. Its in-plane pass reads the pre-sweep field; its vertical pass reads
    // the in-plane pass's INTERMEDIATE output (the first-order-consistent discretization,
    // §4.4 component 3).
    // DENOMINATOR: the same per-sweep kinetic demand recomputed OUTSIDE the solver from the
    // CONVERGED public field: sum over boundary cells of [nT/7 + (3/14)·nZ] · s · sigma_face,
    // with (alphaHK, sigma_face) from core's alphaHK and an external damped fixed point.
    // The stencil weights are exactly proportional to the hexagonal-prism face factors
    // ((3/14)/(1/7) = 3/2 = basal/prism face-area ratio), so the denominator IS the
    // per-face kinetic-demand form advanceSurface computes, expressed in per-sweep units.
    //
    // SCOPE (round-5 review — the previous comment here overstated this as a "ledger-growth
    // comparison"): the ratio observes the SINK side only. Neither numerator nor
    // denominator reads the ledger or advanceSurface, so ledger defects — e.g. silently
    // dropped saturation clipping, the historical round-3 case above — would NOT move it; the
    // NON-TAUTOLOGICAL demand-bookkeeping test above is their regression. What this diagnostic
    // detects is a sweep whose actual Robin absorption disagrees with the converged field's
    // implied kinetic demand (wrong direction weights, wrong s_eff, intermediate-field effects).
    // Its deviation from 1 is the intermediate-field discretization effect: measured here,
    // never assumed.
    const solver = new LKSolver({ ...devOptions, surfacePolicy: "legacy-v3" });
    const dxM = devOptions.dxUm * 1e-6;
    const ratio = dxM / solver.x0M;
    const faceOf = (x: number): { s: number; sigmaFace: number } => {
      const [nT, nZ] = solver.neighborCounts(x);
      const facet = classifyFacet(nT, nZ, "legacy-v3");
      const sc = Math.max(solver.sigma[x], 0);
      let sf = sc;
      if (sc > 0) {
        for (let it = 0; it < 60; it++) {
          const a = alphaHK(facet, devOptions.tempC, sf, "CAK_A1");
          const next = sc / (1 + a * ratio);
          if (Math.abs(next - sf) <= 1e-13 * sc) {
            sf = next;
            break;
          }
          sf = 0.5 * (sf + next);
        }
      }
      const s = alphaHK(facet, devOptions.tempC, sf, "CAK_A1") * ratio;
      return { s, sigmaFace: sc / (1 + s) };
    };
    let minRatio = Infinity;
    let maxRatio = -Infinity;
    let measured = 0;
    for (let t = 0; t < 80; t++) {
      const relax = solver.relaxField();
      expect(relax.converged).toBe(true);
      let perSweepDemand = 0;
      for (const x of solver.boundaryCells()) {
        const [nT, nZ] = solver.neighborCounts(x);
        const { s, sigmaFace } = faceOf(x);
        perSweepDemand += (nT / 7 + (3 / 14) * nZ) * s * sigmaFace;
      }
      if (perSweepDemand > 0) {
        const r = (relax.surfaceExchangeDiagnostic as number) / perSweepDemand;
        if (r < minRatio) minRatio = r;
        if (r > maxRatio) maxRatio = r;
        measured++;
      }
      const surface = solver.advanceSurface();
      solver.tick++; // manual stepping, as in the demand-bookkeeping test above
      if (surface.stalled) break;
    }
    expect(measured).toBeGreaterThan(50); // the band must come from a real growth history
    // Hard physical band: a first-order-consistent sweep stays within a few percent of the
    // converged-field kinetic demand at this resolution. A broken Robin substitution (wrong
    // direction weights, wrong s_eff — the defect class this ratio CAN see) lands far
    // outside. Round-5 correction: the round-2 sigma split and round-3 silent clipping lived
    // on the demand-bookkeeping/ledger side, which this ratio does NOT observe —
    // the demand-bookkeeping test above catches those.
    expect(minRatio).toBeGreaterThan(0.9);
    expect(maxRatio).toBeLessThan(1.1);
    // The MEASURED band at this pinned config (deterministic run — seed 1, noise off):
    // 0.98922-1.01290 over 80 steps. The round-3/4 audits measured 0.95879-1.01266 for the
    // same effect at the gate resolution (96^3). Pinned so silent drift becomes a failure:
    expect(minRatio).toBeCloseTo(0.98922, 3);
    expect(maxRatio).toBeCloseTo(1.0129, 3);
  });
});

describe("LKSolver — §4.4 contract closures (round-2 review)", () => {
  it("reflecting diagnostic mode: no clamp, no divergence claim, uniform bitwise fixed point", () => {
    const solver = new LKSolver({
      ...devOptions,
      farField: "reflecting",
      testAlphaOverride: () => 0,
    });
    const report = solver.relaxField();
    expect(report.converged).toBe(true);
    expect(report.divergenceResidual).toBeNull();
    expect(report.shellClampDiagnostic).toBeNull();
    const n = cellCount(solver.dims);
    for (let x = 0; x < n; x++) {
      if (solver.wall[x] === 0 && solver.a[x] === 0) {
        expect(solver.sigma[x]).toBe(devOptions.sigmaInfinity);
      }
    }
  });

  it("an unconverged relaxation NEVER advances the surface — including via the public interface", () => {
    const solver = new LKSolver({ ...devOptions, relaxTol: 1e-30, relaxMaxSweeps: 2 });
    const before = solver.attachedCount;
    const tickBefore = solver.tick;
    const { relaxation, surface } = solver.step();
    expect(relaxation.converged).toBe(false);
    expect(surface.skippedUnconverged).toBe(true);
    expect(surface.attachedNow).toBe(0);
    expect(solver.attachedCount).toBe(before);
    expect(solver.tick).toBe(tickBefore);
    expect(solver.fillLedger).toBe(0);
    // Round-3 review: the guard must bind the PUBLIC method too, not just step().
    expect(() => solver.advanceSurface()).toThrow(/unconverged field/);
    expect(solver.fillLedger).toBe(0);
  });

  it("a second advanceSurface without a fresh relaxField also throws (one advance per relax)", () => {
    const solver = new LKSolver(devOptions);
    solver.relaxField();
    solver.advanceSurface();
    expect(() => solver.advanceSurface()).toThrow(/unconverged field|converged relaxField/);
  });

  it("invalid programmatic options and drift are rejected at runtime, not just by types", () => {
    expect(
      () => new LKSolver({ ...devOptions, surfacePolicy: "bogus" } as never),
    ).toThrow(/surfacePolicy/);
    const missingPolicy = { ...devOptions } as Record<string, unknown>;
    delete missingPolicy.surfacePolicy;
    expect(() => new LKSolver(missingPolicy as never)).toThrow(/surfacePolicy/);
    expect(
      () => new LKSolver({ ...devOptions, ...({ phi: 0.01 } as object) } as never),
    ).toThrow(/phi is unsupported/);
    expect(() => new LKSolver({ ...devOptions, cflFill: 1 })).toThrow(/cflFill/);
    expect(() => new LKSolver({ ...devOptions, noiseEpsilon: 1.1 })).toThrow(/noiseEpsilon/);
    expect(
      () => new LKSolver({ ...devOptions, paramSet: "bogus" } as never),
    ).toThrow(/paramSet/);
    expect(() =>
      new LKSolver({ ...devOptions, dims: { ...devOptions.dims, nx: 1.5 } }),
    ).toThrow(/dims\.nx/);
    expect(() =>
      new LKSolver({ ...devOptions, dims: { nx: Number.MAX_SAFE_INTEGER, ny: 2, nz: 1 } }),
    ).toThrow(/cell count/);
    expect(() => new LKSolver({ ...devOptions, relaxMaxSweeps: 1.5 })).toThrow(/relaxMaxSweeps/);
    expect(() => new LKSolver({ ...devOptions, center: [-1, 1, 1] })).toThrow(/center/);
    expect(() => new LKSolver({ ...devOptions, testExtraSeedSites: [-1] })).toThrow(/extra seed/);
    // Positive finite raw inputs can still collapse derived SI scales. Before this guard,
    // the first case accepted dxM === 0 and a step wrote NaN fill/ledger values; the second
    // accepted X_0 === Infinity and a false zero-absorption growth path.
    expect(() => new LKSolver({ ...devOptions, dxUm: Number.MIN_VALUE })).toThrow(/derived dxM/);
    expect(() => new LKSolver({ ...devOptions, pressurePa: Number.MIN_VALUE })).toThrow(
      /derived X_0/,
    );
    expect(() => new LKSolver({ ...devOptions, dxUm: Number.MAX_VALUE })).toThrow(
      /derived dxM\/X_0|fill-rate scale/,
    );
    const invalidCoefficient = new LKSolver({ ...devOptions, testAlphaOverride: () => Number.NaN });
    expect(() => invalidCoefficient.relaxField()).toThrow(/alphaHK/);
  });
});

describe("LKSolver — fill-CFL (§4.4 test 5, kinetic-only per the round-2 correction)", () => {
  it("no growth step's KINETIC fill ever exceeds the bound", () => {
    const solver = new LKSolver({ ...devOptions, cflFill: 0.1 });
    for (let t = 0; t < 100; t++) {
      const { surface } = solver.step();
      expect(surface.maxKineticFillIncrement).toBeLessThanOrEqual(0.1 + 1e-12);
    }
  });

  it("hole-fill jumps are NOT hidden inside the CFL claim: counted and deficit-ledgered", () => {
    // Round-2 maker review, blocker 6 — the maker's exact probe, made deterministic: a
    // boundary cell with raw n_T >= 4 and n_Z >= 1 hole-fills f: ~0 -> 1 in one step. The
    // kinetic CFL report must NOT absorb that jump; it is counted and deficit-ledgered
    // separately, and the gate reads both numbers.
    const dims = { nx: 20, ny: 20, nz: 12 };
    const ic = 10, jc = 10, kc = 6;
    const idx = (i: number, j: number, k: number): number => k * 400 + j * 20 + i;
    // Ring of 6 cells at kc+1 around the (empty) gap cell directly above the seed center:
    // the gap gets n_T = 6 (raw) from the ring and n_Z = 1 from the seed below.
    const ring = [
      idx(ic + 1, jc, kc + 1),
      idx(ic - 1, jc, kc + 1),
      idx(ic, jc + 1, kc + 1),
      idx(ic, jc - 1, kc + 1),
      idx(ic + 1, jc - 1, kc + 1),
      idx(ic - 1, jc + 1, kc + 1),
    ];
    const solver = new LKSolver({
      ...devOptions,
      dims,
      cflFill: 0.1,
      testExtraSeedSites: ring,
    });
    const gap = idx(ic, jc, kc + 1);
    expect(solver.neighborCounts(gap)).toEqual([6, 1]);
    const { surface } = solver.step();
    expect(surface.holeFillCount).toBeGreaterThanOrEqual(1);
    expect(solver.a[gap]).toBe(1);
    // The 0 -> 1 jump is visible in the deficit, NOT censored into the kinetic CFL number.
    expect(surface.maxKineticFillIncrement).toBeLessThanOrEqual(0.1 + 1e-12);
    expect(solver.holeFillDeficit).toBeGreaterThan(0.8);
    expect(solver.holeFillCountTotal).toBeGreaterThanOrEqual(1);
    expect(solver.ledger().holeFillDeficit).toBe(solver.holeFillDeficit);
  });
});

describe("LKSolver — growth, determinism, symmetry", () => {
  it("a crystal grows at all (plan, Stage 2b check)", () => {
    const solver = new LKSolver(devOptions);
    for (let t = 0; t < 150; t++) solver.step();
    expect(solver.attachedCount).toBeGreaterThan(19);
  });

  it("two runs with the same options are bit-identical (pinned-oracle scope)", () => {
    const s1 = new LKSolver({ ...devOptions, noiseEpsilon: 1e-5 });
    const s2 = new LKSolver({ ...devOptions, noiseEpsilon: 1e-5 });
    for (let t = 0; t < 60; t++) {
      s1.step();
      s2.step();
    }
    expect(Array.from(s1.a)).toEqual(Array.from(s2.a));
    expect(Array.from(s1.f)).toEqual(Array.from(s2.f));
    expect(Array.from(s1.sigma)).toEqual(Array.from(s2.sigma));
  });

  it("noise off, hexPrism: every attachment delta is D6h-invariant and the full metric reads 0", () => {
    const solver = new LKSolver(devOptions);
    for (let t = 0; t < 150; t++) {
      solver.step();
      if (solver.lastAttached.length > 0) {
        expect(isD6hInvariantSet(solver.lastAttached, solver.dims, solver.center)).toBe(true);
      }
    }
    expect(symmetryError(solver.a, solver.dims, solver.center)).toBe(0);
    expect(solver.attachedCount).toBeGreaterThan(19);
  });

});
