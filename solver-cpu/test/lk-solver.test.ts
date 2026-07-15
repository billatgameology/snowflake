// LibbrechtKinetics operator tests — the commitments of attachment-kinetics §4.4 component 6
// (tests 2-5; test 1, GGThreshold bit-identity, lives in the existing 2a suites, which run
// through the refactored step()). Dev-grid scale; the habit gate itself runs via the runner.

import { describe, expect, it } from "vitest";
import { cellCount, isD6hInvariantSet, symmetryError } from "@vcc/core";
import { LKSolver } from "@vcc/solver-cpu";

const devOptions = {
  dims: { nx: 24, ny: 24, nz: 14 },
  tempC: -5,
  sigmaInfinity: 0.01,
  dxUm: 0.35,
  rngSeed: 1,
  relaxTol: 1e-8,
} as const;

describe("LKSolver — Robin limits (§4.4 test 2)", () => {
  it("alphaHK ≡ 0 recovers the reflecting pass exactly: uniform field is a bitwise fixed point", () => {
    const solver = new LKSolver({ ...devOptions, testAlphaOverride: () => 0 });
    const report = solver.relaxField();
    // Every face reflects, the field starts uniform at sigma_infinity, and the Dirichlet
    // clamp is a no-op on an already-clamped value: one sweep converges bitwise.
    expect(report.converged).toBe(true);
    expect(report.absorptionPerSweep).toBe(0);
    const n = cellCount(solver.dims);
    for (let x = 0; x < n; x++) {
      if (solver.wall[x] === 0 && solver.a[x] === 0) {
        expect(solver.sigma[x]).toBe(devOptions.sigmaInfinity);
      }
    }
    // And no growth machinery fires: the surface is inert under alphaHK = 0.
    const surface = solver.advanceSurface();
    expect(surface.stalled).toBe(true);
    expect(solver.attachedCount).toBe(19);
    expect(solver.fillLedger).toBe(0);
  });

  it("alphaHK ≡ 1 with dx >> X_0 absorbs: boundary sigma relaxes far below sigma_infinity", () => {
    const solver = new LKSolver({
      ...devOptions,
      dxUm: 3.5, // s = dx/X0 ~ 24 => s_eff ~ 0.96, near-perfect sink
      testAlphaOverride: () => 1,
    });
    const report = solver.relaxField();
    expect(report.converged).toBe(true);
    let maxBoundarySigma = 0;
    for (const x of solver.boundaryCells()) {
      if (solver.sigma[x] > maxBoundarySigma) maxBoundarySigma = solver.sigma[x];
    }
    // The floor here is geometry, not sink strength: even a perfect absorber sustains a
    // gradient, and the CELL ADJACENT to the surface sits one lattice step up that gradient
    // (a point sink in this domain leaves sigma(R+1)/sigma_inf well above 0). The limit test
    // is that the absorber pulls the boundary far below the reflecting case's sigma_inf.
    expect(maxBoundarySigma).toBeLessThan(0.6 * devOptions.sigmaInfinity);
    // And the sink is monotone in alphaHK: a weak absorber leaves the boundary higher.
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
  it("at convergence, Dirichlet injection equals Robin absorption per sweep", () => {
    // The identity is exact at the true fixed point; at a field converged to relaxTol it
    // holds to ~1e3 x relaxTol (the per-sweep-change criterion under-reports distance to
    // the fixed point by the slow-mode factor). The bound is stated as that scaling so
    // tightening relaxTol tightens the assertion automatically.
    const solver = new LKSolver(devOptions);
    const report = solver.relaxField();
    expect(report.converged).toBe(true);
    expect(report.absorptionPerSweep).toBeGreaterThan(0);
    expect(report.divergenceResidual).toBeLessThan(1e3 * devOptions.relaxTol);
    // And it keeps holding as the crystal grows.
    for (let t = 0; t < 30; t++) solver.step();
    const later = solver.relaxField();
    expect(later.converged).toBe(true);
    expect(later.divergenceResidual).toBeLessThan(1e3 * devOptions.relaxTol);
    // Tightening the tolerance tightens the identity (the scaling claim, tested).
    const tight = new LKSolver({ ...devOptions, relaxTol: 1e-10 });
    const tightReport = tight.relaxField();
    expect(tightReport.divergenceResidual).toBeLessThan(report.divergenceResidual);
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
});

describe("LKSolver — fill-CFL (§4.4 test 5)", () => {
  it("no growth step ever exceeds the fill-CFL bound", () => {
    const solver = new LKSolver({ ...devOptions, cflFill: 0.1 });
    for (let t = 0; t < 100; t++) {
      const { surface } = solver.step();
      expect(surface.maxFillIncrement).toBeLessThanOrEqual(0.1 + 1e-12);
    }
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

  it("drift is unsupported by design — there is no phi option to set", () => {
    // Compile-time truth stated as a runtime assertion for the reader: LKSolverOptions has
    // no phi. (attachment-kinetics §4.4 component 5: a drift term inside a quasi-static
    // solve is a different physical statement nobody has specified.)
    const solver = new LKSolver(devOptions);
    expect("phi" in solver).toBe(false);
  });
});
