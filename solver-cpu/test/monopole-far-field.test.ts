// ADR 0024 — the monopole-matched far field.
//
// The claim being tested is not "it runs" but "it removes the domain dependence that fixed-σ
// Dirichlet has". Growing a crystal is the expensive part, so the four comparison runs are done
// ONCE and every assertion is derived from them.

import { beforeAll, describe, expect, it } from "vitest";
import { aspectRatio, domainCenter, symmetryError, type FarFieldCondition } from "@vcc/core";
import { LKSolver } from "@vcc/solver-cpu";

const base = {
  surfacePolicy: "aggregate-hv-g1h1-v6",
  tempC: -5,
  sigmaInfinity: 0.0075,
  dxUm: 0.35,
  pressurePa: 101325,
  paramSet: "CAK_A1",
  cflFill: 0.1,
  relaxTol: 1e-8,
  divTol: 1e-6,
  relaxMaxSweeps: 200000,
  rngSeed: 1,
  noiseEpsilon: 0,
  domain: "hexPrism",
  seedRadius: 2,
  seedThickness: 1,
} as const;

/** Enough growth for the fixed-σ shell's over-supply to show; below ~50 it has not yet bitten. */
const STEPS = 60;
/** Both comfortably satisfy rho_far >> crystal size — see the validity-limit test below. */
const NEAR = 28;
const FAR = 40;

interface ShellInternals {
  readonly dirichletCells: Int32Array;
  readonly shellRadiusM: Float64Array;
  readonly volumeRateM3PerS: number;
  readonly blocked: Uint8Array;
}

function build(n: number, farField: FarFieldCondition): LKSolver {
  const dims = { nx: n, ny: n, nz: n };
  return new LKSolver({ ...base, dims, center: domainCenter(dims), farField });
}

function grow(n: number, farField: FarFieldCondition, steps = STEPS): LKSolver {
  const solver = build(n, farField);
  for (let t = 1; t <= steps; t++) {
    const { relaxation } = solver.step();
    if (!relaxation.converged) throw new Error(`unconverged at step ${t}`);
  }
  return solver;
}

function shellRange(solver: LKSolver): { low: number; high: number } {
  const internals = solver as unknown as ShellInternals;
  let low = Infinity;
  let high = -Infinity;
  for (const x of internals.dirichletCells) {
    if (internals.blocked[x] === 1) continue;
    low = Math.min(low, solver.sigma[x]);
    high = Math.max(high, solver.sigma[x]);
  }
  return { low, high };
}

const summarize = (solver: LKSolver, n: number): { attached: number; ar: number } => ({
  attached: solver.attachedCount,
  ar: aspectRatio(solver.a, { nx: n, ny: n, nz: n }),
});

describe("monopole-matched far field", () => {
  let dirichletNear: LKSolver;
  let dirichletFar: LKSolver;
  let monopoleNear: LKSolver;
  let monopoleFar: LKSolver;

  beforeAll(() => {
    dirichletNear = grow(NEAR, "dirichlet");
    dirichletFar = grow(FAR, "dirichlet");
    monopoleNear = grow(NEAR, "monopole-matched");
    monopoleFar = grow(FAR, "monopole-matched");
  }, 900_000);

  it("removes the domain dependence that fixed-sigma Dirichlet has", () => {
    const dn = summarize(dirichletNear, NEAR);
    const df = summarize(dirichletFar, FAR);
    const mn = summarize(monopoleNear, NEAR);
    const mf = summarize(monopoleFar, FAR);

    // Fixed-sigma Dirichlet: the same crystal, grown the same way, comes out a different size
    // purely because the boundary moved.
    expect(Math.abs(df.attached - dn.attached) / dn.attached).toBeGreaterThan(0.03);
    // Monopole-matched: it does not.
    expect(mn.attached).toBe(mf.attached);
    expect(mn.ar).toBe(mf.ar);

    // And the correction is not cosmetic — it moves the habit metric, which is why no
    // Dirichlet-measured threshold transfers to a monopole-matched sweep (ADR 0024).
    expect(mn.ar).not.toBe(dn.ar);
  });

  it("depletes the shell below sigma_infinity, more strongly at a closer boundary", () => {
    const near = shellRange(monopoleNear);
    const far = shellRange(monopoleFar);
    // A growing crystal depletes its surroundings, so the true value at a finite radius is
    // BELOW sigma_infinity. Clamping it there is the over-supply this condition removes.
    expect(near.high).toBeLessThan(base.sigmaInfinity);
    expect(far.high).toBeLessThan(base.sigmaInfinity);
    expect(near.low).toBeLessThan(far.low);
    expect((monopoleNear as unknown as ShellInternals).volumeRateM3PerS).toBeGreaterThan(0);
    // Fixed-sigma Dirichlet does not move at all — that is the whole difference.
    const flat = shellRange(dirichletNear);
    expect(flat.low).toBeCloseTo(base.sigmaInfinity, 15);
    expect(flat.high).toBeCloseTo(base.sigmaInfinity, 15);
  });

  it("keeps exact D6h symmetry, because rho_far is itself symmetric", () => {
    const dims = { nx: NEAR, ny: NEAR, nz: NEAR };
    expect(symmetryError(monopoleNear.a, dims, domainCenter(dims))).toBe(0);
  });
});

describe("monopole-matched far field — construction", () => {
  it("is accepted as a condition and reported on the solver", () => {
    expect(build(32, "monopole-matched").farField).toBe("monopole-matched");
    const dims = { nx: 32, ny: 32, nz: 32 };
    expect(
      () =>
        new LKSolver({
          ...base,
          dims,
          center: domainCenter(dims),
          farField: "monopole" as unknown as FarFieldCondition,
        }),
    ).toThrow(/farField is invalid/);
  });

  it("holds the shell at exactly sigma_infinity until growth has been measured", () => {
    // Eq. 5.30's correction is proportional to dV/dt, which is zero before the first interface
    // update. A nonzero correction at that point would be inventing a measurement.
    const solver = build(32, "monopole-matched");
    solver.relaxField();
    const { low, high } = shellRange(solver);
    expect(low).toBeCloseTo(base.sigmaInfinity, 15);
    expect(high).toBeCloseTo(base.sigmaInfinity, 15);
    expect((solver as unknown as ShellInternals).volumeRateM3PerS).toBe(0);
  });

  it("gives every shell cell its own rho_far, and none of them zero", () => {
    const internals = build(32, "monopole-matched") as unknown as ShellInternals;
    expect(internals.shellRadiusM.length).toBe(internals.dirichletCells.length);
    let min = Infinity;
    let max = -Infinity;
    for (const radius of internals.shellRadiusM) {
      expect(radius).toBeGreaterThan(0);
      min = Math.min(min, radius);
      max = Math.max(max, radius);
    }
    // A hexagonal prism's shell is genuinely not equidistant; a flattened rho_far would show up
    // here as min === max and would reintroduce an anisotropic boundary error.
    expect(max).toBeGreaterThan(min * 1.2);
  });

  it("carries no shell radii under the conditions that do not use them", () => {
    for (const farField of ["dirichlet", "reflecting"] as const) {
      expect((build(32, farField) as unknown as ShellInternals).shellRadiusM.length).toBe(0);
    }
  });
});

describe("monopole-matched far field — its validity limit", () => {
  it("stops being domain-independent once the shell is not far from the crystal", () => {
    // Eq. 5.30 treats the crystal as a point source, so it needs rho_far >> crystal size. At
    // 20^3 the nearest shell cell sits ~2.3 crystal radii out and the approximation fails: the
    // answer moves. This is a REGISTERED LIMIT, not a defect — it is why the comparison above
    // uses 28 and 40, and why WP0c has to set the minimum domain from the WP3 ladder rather
    // than assume monopole matching makes domain size irrelevant.
    const tooClose = grow(20, "monopole-matched", 30);
    const adequate = grow(28, "monopole-matched", 30);
    const roomier = grow(32, "monopole-matched", 30);
    expect(adequate.attachedCount).toBe(roomier.attachedCount);
    expect(tooClose.attachedCount).not.toBe(adequate.attachedCount);
  }, 900_000);
});
