// Phase 6 WP3b — the 1D spherical reference, and the Eq. 3.35 erratum it exposed.
//
// This is an analytic numerical check for one idealized spherical boundary-value problem, so its
// own correctness has to be established against something other than itself. Every test here
// either checks a source-stated identity or checks the implementation against a separately derived
// exact solution. It does not establish absolute physical accuracy for faceted 3D crystals.

import { describe, expect, it } from "vitest";
import { kineticLength, vKin } from "@vcc/core";
import {
  solveNucleationLimited,
  sphericalAnalytic,
  sphericalNumeric,
  sphericalReferenceReducesToInfinite,
} from "@vcc/solver-cpu";

const problem = {
  radiusM: 3e-6,
  farRadiusM: 16.8e-6,
  sigmaInfinity: 0.0075,
  tempC: -5,
  pressurePa: 101325,
} as const;
const COEFFICIENT = 0.393;

/**
 * Independent exact solution of the same boundary-value problem, derived here rather than
 * transcribed: the steady spherical field is sigma(r) = A + B/r, the shell fixes
 * A + B/R_far = sigma_inf, and Eq. 3.9's Robin condition fixes X_0·sigma'(R) = a·sigma(R).
 * Nothing in this function comes from Eqs. 3.33-3.36, so agreeing with it is real evidence.
 */
function exactSurfaceValue(coefficient: number): number {
  const { radiusM: R, farRadiusM: far, sigmaInfinity, tempC, pressurePa } = problem;
  const x0 = kineticLength(tempC, pressurePa);
  const b = (coefficient * sigmaInfinity) / (-x0 / (R * R) - coefficient / R + coefficient / far);
  return sigmaInfinity - b / far + b / R;
}

describe("spherical reference — the source's own identities", () => {
  it("Eq. 3.36 reduces to Eq. 3.19 as the shell recedes, falling as 1/R_far", () => {
    const at = (farRadiusM: number): number =>
      sphericalReferenceReducesToInfinite({ ...problem, farRadiusM }, COEFFICIENT);
    // The bias is q/(1 − q) with q proportional to 1/R_far, so the per-decade ratio tends to 10
    // only once q is small. Assert the asymptotic behaviour where it actually applies...
    const far = [168e-6, 1680e-6, 16800e-6, 168000e-6].map(at);
    for (let i = 1; i < far.length; i++) {
      expect(far[i - 1] / far[i]).toBeGreaterThan(9.5);
      expect(far[i - 1] / far[i]).toBeLessThan(10.5);
    }
    // At a shell 56,000 crystal radii out the residual bias is ~1.6e-5, i.e. R/(gamma·R_far).
    expect(far[far.length - 1]).toBeLessThan(2e-5);
    // ...and separately record that the near shell is NOT in that regime. This is the number
    // that matters to Phase 6: a shell at 5.6 crystal radii biases growth by ~19%, and the
    // ratio between the first two decades is 11.7 rather than 10 precisely because of it.
    const near = at(16.8e-6);
    expect(near).toBeGreaterThan(0.18);
    expect(near).toBeLessThan(0.20);
    expect(near / far[0]).toBeGreaterThan(11);
  });

  it("the infinite-shell case reproduces Eq. 3.17 and Eq. 3.19 exactly", () => {
    const infinite = sphericalAnalytic({ ...problem, farRadiusM: Infinity }, COEFFICIENT);
    const x0 = kineticLength(problem.tempC, problem.pressurePa);
    const diffusive = x0 / problem.radiusM;
    expect(infinite.diffusiveCoefficient).toBeCloseTo(diffusive, 15); // Eq. 3.18
    expect(infinite.sigmaSurface).toBeCloseTo(
      (diffusive / (COEFFICIENT + diffusive)) * problem.sigmaInfinity, // Eq. 3.17
      15,
    );
    expect(infinite.growthVelocityMS).toBeCloseTo(
      ((COEFFICIENT * diffusive) / (COEFFICIENT + diffusive)) *
        vKin(problem.tempC) *
        problem.sigmaInfinity, // Eq. 3.19
      18,
    );
    expect(infinite.finiteShellBias).toBe(0);
  });

  it("reaches the Eq. 3.21 kinetics-limited and Eq. 3.24 diffusion-limited limits", () => {
    const x0 = kineticLength(problem.tempC, problem.pressurePa);
    const diffusive = x0 / problem.radiusM;
    // Eq. 3.20: attachment << X_0/R gives v = a*v_kin*sigma_inf and sigma_surf = sigma_inf.
    const kinetic = 1e-6 * diffusive;
    // These are LIMITS, so they are approached to the size of the small parameter (1e-6 here);
    // comparing them to absolute decimal places would just be asserting the wrong thing.
    const relative = (got: number, want: number): number => Math.abs(got - want) / want;
    const kineticCase = sphericalAnalytic({ ...problem, farRadiusM: Infinity }, kinetic);
    expect(kineticCase.sigmaSurface / problem.sigmaInfinity).toBeCloseTo(1, 5);
    expect(
      relative(kineticCase.growthVelocityMS, kinetic * vKin(problem.tempC) * problem.sigmaInfinity),
    ).toBeLessThan(1e-5);
    // Eq. 3.23: X_0/R << attachment gives v = (X_0/R)*v_kin*sigma_inf.
    const diffusionCase = sphericalAnalytic({ ...problem, farRadiusM: Infinity }, 1e6 * diffusive);
    expect(
      relative(
        diffusionCase.growthVelocityMS,
        diffusive * vKin(problem.tempC) * problem.sigmaInfinity,
      ),
    ).toBeLessThan(1e-5);
  });
});

describe("spherical reference — the Eq. 3.35 erratum", () => {
  // Eq. 3.35 is PRINTED as gamma = (a + X_0/R)/(X_0/R). Each test below fails under that
  // reading and passes under the corrected denominator, gamma = (a + X_0/R)/a.
  const x0 = kineticLength(problem.tempC, problem.pressurePa);
  const diffusive = x0 / problem.radiusM;
  const printedGamma = (COEFFICIENT + diffusive) / diffusive;
  const correctedGamma = (COEFFICIENT + diffusive) / COEFFICIENT;

  it("check 1: Eq. 3.33's limit reproduces Eq. 3.17, which the printed form inverts", () => {
    // Eq. 3.33 as R_far -> infinity gives sigma_surf/sigma_inf = 1 - 1/gamma.
    const target = diffusive / (COEFFICIENT + diffusive); // Eq. 3.17
    expect(1 - 1 / correctedGamma).toBeCloseTo(target, 15);
    // The printed form yields the complement, not the value.
    expect(1 - 1 / printedGamma).toBeCloseTo(COEFFICIENT / (COEFFICIENT + diffusive), 15);
    expect(1 - 1 / printedGamma).not.toBeCloseTo(target, 6);
    expect(sphericalAnalytic(problem, COEFFICIENT).gamma).toBeCloseTo(correctedGamma, 12);
  });

  it("check 2: matches an independent exact solve of the same boundary-value problem", () => {
    const analytic = sphericalAnalytic(problem, COEFFICIENT);
    expect(analytic.sigmaSurface).toBeCloseTo(exactSurfaceValue(COEFFICIENT), 12);
    // The printed bracket would put the answer ~16% away, far outside any rounding.
    const printedSurface =
      (diffusive / (COEFFICIENT + diffusive)) *
      problem.sigmaInfinity *
      (1 / (1 - problem.radiusM / (printedGamma * problem.farRadiusM)));
    expect(Math.abs(printedSurface - exactSurfaceValue(COEFFICIENT)) / exactSurfaceValue(COEFFICIENT))
      .toBeGreaterThan(0.1);
  });

  it("check 3: a crystal that is not growing carries no finite-shell bias", () => {
    // The physical requirement: no attachment means no flux, so the boundary cannot bias it.
    let previous = Infinity;
    for (const coefficient of [1e-2, 1e-4, 1e-6, 1e-8]) {
      const bias = sphericalAnalytic(problem, coefficient).finiteShellBias;
      expect(bias).toBeGreaterThanOrEqual(0);
      expect(bias).toBeLessThan(previous); // monotonically vanishing
      previous = bias;
    }
    expect(sphericalAnalytic(problem, 1e-8).finiteShellBias).toBeLessThan(1e-6);
    expect(sphericalAnalytic(problem, 0).finiteShellBias).toBe(0);
    // Under the printed form this quantity instead tends to [1 - R/R_far]^-1 - 1, ~22% here.
    const printedZeroLimit = 1 / (1 - problem.radiusM / (1 * problem.farRadiusM)) - 1;
    expect(printedZeroLimit).toBeGreaterThan(0.2);
  });
});

describe("spherical reference — the discretized solve", () => {
  it("agrees with the closed form and is insensitive to radial resolution", () => {
    const exact = sphericalAnalytic(problem, COEFFICIENT);
    for (const drM of [0.7e-6, 0.35e-6, 0.175e-6, 0.0875e-6]) {
      const numeric = sphericalNumeric(problem, { drM, attachmentCoefficient: COEFFICIENT });
      const relative =
        Math.abs(numeric.sigmaSurface - exact.sigmaSurface) / exact.sigmaSurface;
      expect(relative).toBeLessThan(1e-9);
    }
  });

  it("holds the shell value and the no-attachment field exactly", () => {
    const zero = sphericalNumeric(problem, { drM: 0.35e-6, attachmentCoefficient: 0 });
    // No attachment: zero flux, so the field is uniform at the shell value everywhere.
    for (let i = 0; i < zero.nodes; i++) {
      expect(zero.sigma[i]).toBeCloseTo(problem.sigmaInfinity, 15);
    }
    const grown = sphericalNumeric(problem, { drM: 0.35e-6, attachmentCoefficient: COEFFICIENT });
    expect(grown.sigma[grown.nodes - 1]).toBeCloseTo(problem.sigmaInfinity, 15);
    expect(grown.sigma[0]).toBeLessThan(problem.sigmaInfinity); // depleted at the surface
  });

  it("fails closed on an unusable problem rather than returning a plausible number", () => {
    expect(() => sphericalAnalytic({ ...problem, farRadiusM: 1e-6 }, COEFFICIENT)).toThrow(
      /shell radius > crystal radius/,
    );
    expect(() => sphericalAnalytic({ ...problem, radiusM: 0 }, COEFFICIENT)).toThrow(
      /crystal radius/,
    );
    expect(() => sphericalAnalytic(problem, -1)).toThrow(/attachment coefficient/);
    expect(() =>
      sphericalNumeric({ ...problem, farRadiusM: Infinity }, {
        drM: 0.35e-6,
        attachmentCoefficient: COEFFICIENT,
      }),
    ).toThrow(/finite shell radius/);
  });
});

describe("spherical reference — the nucleation-limited case", () => {
  it("solves the coefficient and surface value self-consistently", () => {
    const solved = solveNucleationLimited(problem, "basal", "CAK_A1");
    expect(solved.sigmaSurface).toBeGreaterThan(0);
    expect(solved.sigmaSurface).toBeLessThan(problem.sigmaInfinity);
    expect(solved.attachmentCoefficient).toBeGreaterThan(0);
    expect(solved.attachmentCoefficient).toBeLessThanOrEqual(1);
    // The fixed point must reproduce itself when fed back through the closed form.
    const reconstructed = sphericalAnalytic(problem, solved.attachmentCoefficient);
    expect(reconstructed.sigmaSurface).toBeCloseTo(solved.sigmaSurface, 12);
    expect(solved.growthVelocityMS).toBeCloseTo(
      solved.attachmentCoefficient * vKin(problem.tempC) * solved.sigmaSurface,
      18,
    );
  });
});
