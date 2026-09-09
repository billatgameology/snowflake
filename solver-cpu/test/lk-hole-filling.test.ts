import { describe, expect, it } from "vitest";
import { symmetryError } from "@vcc/core";
import { LKSolver, type LKExperimentalHoleFilling } from "@vcc/solver-cpu";

const options = {
  dims: { nx: 18, ny: 18, nz: 18 },
  surfacePolicy: "aggregate-hv-g1h1-v6", farField: "monopole-matched", domain: "hexPrism",
  tempC: -5, sigmaInfinity: 0.00375, dxUm: 0.35, pressurePa: 101325,
  paramSet: "M1", rngSeed: 1, noiseEpsilon: 0, seedRadius: 2, seedThickness: 1,
  cflFill: 0.05, relaxTol: 1e-9, divTol: 1e-7, relaxMaxSweeps: 200000,
} as const;

function fieldBytes(field: Uint8Array | Float64Array): Uint8Array {
  return new Uint8Array(field.buffer, field.byteOffset, field.byteLength);
}

describe("ADR 0056 geometric completion counterfactual", () => {
  for (const tempC of [-4.5, -5]) for (const paramSet of ["M1", "M1_NO_DIP_ABLATION"] as const) {
    it(`${tempC} ${paramSet}: enabled preserves ordinary evolution including geometric completion`, () => {
      const environment = { ...options, tempC, paramSet, sigmaInfinity: 0.075 * Math.abs(tempC) / 100 };
      const ordinary = new LKSolver(environment);
      const enabled = new LKSolver({ ...environment, experimentalHoleFilling: "enabled" });
      // Retained no-dip baseline histories first complete geometric gaps after
      // cycle 40; let that arm reach the event instead of assuming it already did.
      const cycles = paramSet === "M1" ? 40 : 80;
      for (let cycle = 0; cycle < cycles; cycle++) {
        const expected = ordinary.step();
        expect(expected.relaxation.converged).toBe(true);
        expect(enabled.step()).toEqual(expected);
        for (const field of ["a", "f", "sigma"] as const) {
          expect(fieldBytes(enabled[field])).toEqual(fieldBytes(ordinary[field]));
        }
        expect(enabled.simTimeSeconds).toBe(ordinary.simTimeSeconds);
        expect(enabled.ledger()).toEqual(ordinary.ledger());
      }
      expect(ordinary.attachedCount).toBeGreaterThan(19);
      expect(ordinary.holeFillCountTotal).toBeGreaterThan(0);
      expect(ordinary.holeFillDeficit).toBeGreaterThan(0);
    });
  }

  it("skips only forced completion at a [6,1] gap, preserving the field, demand and timestep", () => {
    const index = (i: number, j: number, k: number) => k * 18 * 18 + j * 18 + i;
    const ring = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]]
      .map(([di,dj]) => index(9+di,9+dj,10));
    const fixture = { ...options, testMode: true, testExtraSeedSites: ring };
    const enabled = new LKSolver({ ...fixture, experimentalHoleFilling: "enabled" });
    const disabled = new LKSolver({ ...fixture, experimentalHoleFilling: "disabled" });
    const gap = index(9,9,10);
    expect(enabled.neighborCounts(gap)).toEqual([6,1]);
    const relaxed = enabled.relaxField();
    expect(relaxed.converged).toBe(true);
    expect(disabled.relaxField()).toEqual(relaxed);
    for (const field of ["a", "f", "sigma"] as const) {
      expect(fieldBytes(enabled[field])).toEqual(fieldBytes(disabled[field]));
    }
    let maxRate = 0;
    let sumRate = 0;
    let gapRate = 0;
    for (const cell of enabled.boundaryCells()) {
      const state = enabled.boundaryState(cell);
      expect(disabled.boundaryState(cell)).toEqual(state);
      const rate = state.alphaHKBoundary * enabled.vKinMS * state.sigmaBoundary / enabled.dxM;
      maxRate = Math.max(maxRate, rate);
      sumRate += rate;
      if (cell === gap) {
        gapRate = rate;
        expect(state.alphaHKBoundary).toBe(1); // the rough-site law is not disabled
      }
    }
    const expectedDt = options.cflFill / maxRate;
    const expectedDemand = sumRate * expectedDt;
    const onStep = enabled.advanceSurface();
    const offStep = disabled.advanceSurface();
    expect(onStep.deltaTimeSeconds).toBe(expectedDt);
    expect(offStep.deltaTimeSeconds).toBe(expectedDt);
    for (const solver of [enabled, disabled]) {
      expect(solver.fillLedger + solver.saturationClippedFill).toBeCloseTo(expectedDemand, 12);
    }
    expect(disabled.fillLedger).toBe(enabled.fillLedger);
    expect(disabled.saturationClippedFill).toBe(enabled.saturationClippedFill);
    expect(disabled.f[gap]).toBeCloseTo(gapRate * expectedDt, 14);
    expect(disabled.f[gap]).toBeGreaterThan(0);
    expect(disabled.f[gap]).toBeLessThan(1);
    expect(disabled.a[gap]).toBe(0);
    expect(enabled.a[gap]).toBe(1);
    expect(onStep.holeFillCount).toBeGreaterThan(0);
    expect(enabled.holeFillDeficit).toBeGreaterThan(0);
    expect(offStep.holeFillCount).toBe(0);
    expect(disabled.holeFillDeficit).toBe(0);
  });

  it.each(["M1", "M1_NO_DIP_ABLATION"] as const)(
    "%s still grows kinetically with exact attached symmetry at fill-CFL 0.2", (paramSet) => {
      const solver = new LKSolver({ ...options, paramSet, cflFill: 0.2, experimentalHoleFilling: "disabled" });
      for (let cycle = 0; cycle < 16; cycle++) {
        const step = solver.step();
        expect(step.relaxation.converged).toBe(true);
        expect(step.surface.holeFillCount).toBe(0);
        expect(symmetryError(solver.a, solver.dims, solver.center)).toBe(0);
      }
      expect(solver.attachedCount).toBeGreaterThan(19);
      expect(solver.fillLedger).toBeGreaterThan(0);
      expect(solver.holeFillCountTotal).toBe(0);
      expect(solver.holeFillDeficit).toBe(0);
    },
  );

  it("keeps the experiment constant, separately identified and outside ordinary checkpoints", () => {
    const solver = new LKSolver({ ...options, experimentalHoleFilling: "disabled" });
    expect(() => solver.resumeStateV3()).toThrow("ordinary LK checkpoints");
    expect(() => solver.applyTimelineEnvironment(solver.timelineEnvironment())).toThrow("constant environment");
    expect(() => new LKSolver({ ...options, experimentalHoleFilling: "disabled", experimentalFacetDips: "both" }))
      .toThrow("tested separately");
    expect(() => new LKSolver({ ...options, paramSet: "CAK", experimentalHoleFilling: "disabled" }))
      .toThrow("ordinary M1/no-dip");
    expect(() => new LKSolver({ ...options, experimentalHoleFilling: "invalid" as LKExperimentalHoleFilling }))
      .toThrow("enabled or disabled");
  });
});
