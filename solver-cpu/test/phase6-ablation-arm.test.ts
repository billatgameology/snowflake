// WP2 sub-unit A — the three Phase 6 arms are distinct solvers at one registered point.
//
// Not a numerical-adequacy or habit claim: a small fixed configuration, run identically under
// CAK, M1, and M1_NO_DIP_ABLATION, must produce finite, relaxation-converged, and pairwise
// distinct states. This is the smallest non-vacuous proof that the matched no-dip arm is
// actually wired through the solver rather than merely present in the parameter table.

import { describe, expect, it } from "vitest";
import { LKSolver } from "@vcc/solver-cpu";

const ARMS = ["CAK", "M1", "M1_NO_DIP_ABLATION"] as const;

function runArm(paramSet: (typeof ARMS)[number]): {
  readonly attached: number;
  readonly fillSum: number;
} {
  const solver = new LKSolver({
    surfacePolicy: "aggregate-hv-g1h1-v6",
    dims: { nx: 16, ny: 16, nz: 12 },
    // -15 C sits on the registered 204-point temperature axis, inside every arm's domain, and
    // at the prism dip's flank, where M1 and the no-dip arm genuinely separate.
    tempC: -15,
    sigmaInfinity: 0.05,
    dxUm: 0.35,
    pressurePa: 101_325,
    paramSet,
    cflFill: 0.1,
    relaxTol: 1e-9,
    divTol: 1e-7,
    relaxMaxSweeps: 50_000,
    rngSeed: 0x1234_5678,
    noiseEpsilon: 0,
    domain: "hexPrism",
    farField: "dirichlet",
    seedRadius: 2,
    seedThickness: 1,
  });
  for (let cycle = 0; cycle < 25; cycle++) {
    const relaxation = solver.relaxField();
    // Strictly fewer sweeps than the cap means the tolerance stopped the sweep, not the cap.
    expect(relaxation.sweeps, `${paramSet} cycle ${cycle} convergence`).toBeLessThan(50_000);
    solver.advanceSurface();
  }
  let attached = 0;
  for (const value of solver.a) attached += value;
  let fillSum = 0;
  for (const value of solver.f) fillSum += value;
  expect(Number.isFinite(fillSum), `${paramSet} finite fill`).toBe(true);
  expect(attached, `${paramSet} grew beyond the 19-site seed`).toBeGreaterThan(19);
  return { attached, fillSum };
}

describe("phase6 three-arm growth differential (WP2 sub-unit A)", () => {
  it("CAK, M1, and M1_NO_DIP_ABLATION produce finite, converged, pairwise distinct states", () => {
    const results = ARMS.map((arm) => ({ arm, ...runArm(arm) }));
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const a = results[i];
        const b = results[j];
        expect(
          a.attached !== b.attached || a.fillSum !== b.fillSum,
          `${a.arm} and ${b.arm} must differ in attached count or total fill`,
        ).toBe(true);
      }
    }
  });
});
