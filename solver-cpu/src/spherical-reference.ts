// 1D spherical LibbrechtKinetics reference — Phase 6 WP3b.
//
// Every other numerical control in this project measures the solver against ITSELF: a
// convergence study shows the answer stops moving under refinement, which is consistency, not
// accuracy. The spherical problem is the one case Libbrecht solves exactly (monograph §3.4,
// printed pp. 96 and 100, transcribed in docs/libbrecht-parameters.md §1.1), so a solver of the
// same equations in spherical symmetry can be checked against an analytic solution. That is what
// this file is for: it is an absolute numerical check for this idealized boundary-value problem,
// not an absolute physical-accuracy certificate for faceted 3D growth.
//
// What it isolates, none of which the 3D convergence studies can separate:
//   - Robin-discretization error: how badly the mixed surface condition is represented at a
//     finite grid spacing, measured as a fraction of the exact growth velocity.
//   - Finite-shell bias: how much a Dirichlet shell at finite radius over-supplies vapor
//     relative to true infinity. Eq. 3.36 gives this exactly, so the numerics can be separated
//     from the physics of the boundary placement.
//
// SCOPE. This is a reference for the numerics, not a model of a snow crystal. A sphere has no
// facets, so nothing here speaks to habit. The monograph's analytic solutions assume a CONSTANT
// attachment coefficient on the surface; `solveConstant` matches that assumption exactly and is
// what the analytic comparison uses. `solveNucleationLimited` instead iterates the real
// nucleation-limited coefficient to self-consistency, which is physically closer to the 3D
// solver but has no closed form to be checked against.

import {
  alphaHK,
  kineticLength,
  vKin,
  type FacetClass,
  type NucleationParamSet,
} from "@vcc/core";

/** The exact solution of the same problem, for the constant-coefficient case. */
export interface SphericalAnalytic {
  /** Eq. 3.17 / its finite-shell counterpart: supersaturation at the crystal surface. */
  readonly sigmaSurface: number;
  /** Eq. 3.19 (infinite) or Eq. 3.36 (finite): normal growth velocity, m/s. */
  readonly growthVelocityMS: number;
  /** Eq. 3.18's diffusive coefficient, the ratio X_0/R. Dimensionless. */
  readonly diffusiveCoefficient: number;
  /**
   * Eq. 3.35's ratio, in the CORRECTED form `1 + (X_0/R)/attachment` — see the erratum note on
   * `sphericalAnalytic`. Diverges as the attachment coefficient goes to zero, which is what
   * drives the finite-shell bias to zero for a crystal that is not growing.
   */
  readonly gamma: number;
  /**
   * Eq. 3.36's bracket minus one: the fraction by which a Dirichlet shell at `farRadiusM`
   * over-states the growth velocity relative to true infinity. Exactly 0 when the shell is at
   * infinity. This is a property of the CONTINUUM problem — it is not a discretization error
   * and refining the grid does not reduce it.
   */
  readonly finiteShellBias: number;
}

export interface SphericalProblem {
  /** Crystal radius, metres. */
  readonly radiusM: number;
  /** Dirichlet shell radius, metres. Infinity is allowed and selects Eqs. 3.16–3.19. */
  readonly farRadiusM: number;
  /** Far-field supersaturation held at the shell. */
  readonly sigmaInfinity: number;
  readonly tempC: number;
  readonly pressurePa: number;
}

function requireFinitePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`spherical reference requires a finite positive ${name}, got ${String(value)}`);
  }
}

function validate(problem: SphericalProblem): void {
  requireFinitePositive(problem.radiusM, "crystal radius");
  requireFinitePositive(problem.sigmaInfinity, "far-field supersaturation");
  if (!(problem.farRadiusM > problem.radiusM)) {
    throw new Error(
      `spherical reference requires shell radius > crystal radius, got ` +
        `${String(problem.farRadiusM)} <= ${String(problem.radiusM)}`,
    );
  }
  if (!Number.isFinite(problem.tempC)) {
    throw new Error(`spherical reference requires a finite temperature, got ${String(problem.tempC)}`);
  }
  requireFinitePositive(problem.pressurePa, "pressure");
}

/**
 * Monograph §3.4 in closed form, for a constant surface attachment coefficient.
 *
 * Infinite shell (Eqs. 3.17–3.19):
 *   sigma_surf = [(X_0/R) / (a + X_0/R)] · sigma_inf
 *   v_n        = [a·(X_0/R) / (a + X_0/R)] · v_kin · sigma_inf
 *
 * Finite shell (Eqs. 3.35–3.36) multiplies the velocity by [1 − R/(gamma·R_far)]^(−1). The
 * source states this reduces to the infinite case as R_far → ∞, "as it must";
 * `sphericalReferenceReducesToInfinite` asserts exactly that.
 *
 * ── ERRATUM (found 2026-07-26, Phase 6 WP3b) ──────────────────────────────────────────────
 * Eq. 3.35 is PRINTED as `gamma = (a + X_0/R) / (X_0/R)`. That is inconsistent with the rest of
 * the same section, and this implementation uses the corrected denominator:
 *
 *     gamma = (a + X_0/R) / a  =  1 + (X_0/R)/a
 *
 * Three mutually consistent cross-checks of the same equation, each of which the printed form
 * fails and the corrected form passes (all three are pinned in
 * `solver-cpu/test/spherical-reference.test.ts`):
 *
 *   1. Eq. 3.33 must reduce to Eq. 3.17 as R_far → ∞. Its limit is sigma_surf/sigma_inf =
 *      1 − 1/gamma. The printed gamma yields a/(a + X_0/R) — exactly the COMPLEMENT of Eq.
 *      3.17's (X_0/R)/(a + X_0/R). The corrected gamma reproduces Eq. 3.17 identically.
 *   2. Solving the same boundary-value problem exactly — Robin (Eq. 3.9) at R, Dirichlet at
 *      R_far, sigma = A + B/r — gives an amplification the corrected bracket matches to every
 *      digit carried, while the printed bracket does not.
 *   3. As the attachment coefficient goes to zero the crystal stops growing, so the far
 *      boundary can bias nothing and the amplification must go to 1. It does under the
 *      corrected form; the printed form instead approaches [1 − R/R_far]^(−1), asserting a
 *      finite-shell bias for a crystal that is not growing.
 *
 * Note that "3.36 reduces to 3.19 as R_far → ∞" does NOT discriminate: the bracket tends to 1
 * for any gamma, so the source's own stated check cannot catch this.
 *
 * The consequence is not cosmetic. The printed form makes the bias a few percent and nearly
 * independent of crystal size; the corrected form makes it grow toward [1 − R/R_far]^(−1),
 * which is where the interesting Phase 6 domain effects live.
 */
export function sphericalAnalytic(
  problem: SphericalProblem,
  attachmentCoefficient: number,
): SphericalAnalytic {
  validate(problem);
  if (!Number.isFinite(attachmentCoefficient) || attachmentCoefficient < 0) {
    throw new Error(
      `spherical reference requires a finite non-negative attachment coefficient, got ` +
        `${String(attachmentCoefficient)}`,
    );
  }
  const { radiusM, farRadiusM, sigmaInfinity, tempC, pressurePa } = problem;
  const x0M = kineticLength(tempC, pressurePa);
  const diffusiveCoefficient = x0M / radiusM;
  const total = attachmentCoefficient + diffusiveCoefficient;
  // A zero attachment coefficient is a legitimate physical state (no growth), not an error.
  const sigmaSurface = total === 0 ? sigmaInfinity : (diffusiveCoefficient / total) * sigmaInfinity;
  const infiniteVelocity =
    total === 0
      ? 0
      : ((attachmentCoefficient * diffusiveCoefficient) / total) * vKin(tempC) * sigmaInfinity;
  // Corrected Eq. 3.35 (erratum above): denominator is the attachment coefficient, not X_0/R.
  // A zero coefficient means no growth, so gamma is infinite and the shell biases nothing.
  const gamma = attachmentCoefficient === 0 ? Infinity : total / attachmentCoefficient;
  // Guard the closed form's own domain: the bracket is singular where the shell reaches the
  // crystal's effective screening length, which is outside the regime the formula describes.
  const excess = Number.isFinite(farRadiusM) ? radiusM / (gamma * farRadiusM) : 0;
  if (!(excess < 1)) {
    throw new Error(
      `spherical reference: shell at ${farRadiusM} m is inside the Eq. 3.36 domain of validity ` +
        `(R/(gamma·R_far) = ${excess} must be < 1)`,
    );
  }
  const amplification = 1 / (1 - excess);
  return {
    sigmaSurface: sigmaSurface * amplification,
    growthVelocityMS: infiniteVelocity * amplification,
    diffusiveCoefficient,
    gamma,
    finiteShellBias: amplification - 1,
  };
}

export interface SphericalNumeric {
  readonly sigmaSurface: number;
  readonly growthVelocityMS: number;
  /** Radial node spacing actually used, metres. */
  readonly drM: number;
  readonly nodes: number;
  /** The discrete field, `nodes` samples from the crystal surface out to the shell. */
  readonly sigma: Float64Array;
}

export interface SphericalNumericOptions {
  /** Radial node spacing, metres. Use the 3D solver's own dx to measure ITS discretization. */
  readonly drM: number;
  /** Constant surface attachment coefficient, matching the analytic assumption. */
  readonly attachmentCoefficient: number;
}

/**
 * Steady radial diffusion with the Eq. 3.9 Robin surface condition and a Dirichlet shell,
 * solved directly. This exists to confirm the closed form through an INDEPENDENT code path —
 * it is not a discretization-error probe, and saying so matters, because a reference that
 * shares a derivation with the thing it checks is not a check.
 *
 * Substituting u = r·sigma turns the spherical operator into u'' = 0, so u is exactly linear:
 * the three-point interior stencil and the one-sided second-order surface derivative are both
 * exact on linear data, and the result is the continuum answer to roundoff at ANY spacing.
 * That is the property the tests assert, and it is why `drM` changes nothing.
 *
 * A direct solve also keeps convergence-tolerance bias out of the comparison, so a later
 * measurement of the 3D solver against this reference is measuring the 3D solver.
 */
export function sphericalNumeric(
  problem: SphericalProblem,
  options: SphericalNumericOptions,
): SphericalNumeric {
  validate(problem);
  requireFinitePositive(options.drM, "radial spacing");
  if (!Number.isFinite(problem.farRadiusM)) {
    throw new Error("spherical reference: the numerical solve needs a finite shell radius");
  }
  const { radiusM, farRadiusM, sigmaInfinity, tempC, pressurePa } = problem;
  const span = farRadiusM - radiusM;
  const nodes = Math.max(3, Math.round(span / options.drM) + 1);
  const drM = span / (nodes - 1);
  const x0M = kineticLength(tempC, pressurePa);

  // Solved in u = r·sigma, where the interior equation is exactly u'' = 0.
  const lower = new Float64Array(nodes);
  const diagonal = new Float64Array(nodes);
  const upper = new Float64Array(nodes);
  const rhs = new Float64Array(nodes);
  const radiusAt = (i: number): number => radiusM + i * drM;
  const coefficient = options.attachmentCoefficient;

  // Eq. 3.9 in u: sigma = u/r and dsigma/dr = u'/r − u/r², so X_0·(dsigma/dr) = a·sigma at R
  // becomes X_0·u' = (a + X_0/R)·u. With the one-sided second-order derivative
  // (−3u_0 + 4u_1 − u_2)/(2·dr) that is a three-term row; row 1 is (1, −2, 1), so subtracting
  // (−X_0)·row 1 clears column 2 exactly and leaves a genuinely tridiagonal system. Both rows
  // carry the same units, so unlike a flux-form elimination this loses no conditioning.
  const robinScale = coefficient + x0M / radiusM;
  diagonal[0] = -2 * x0M - 2 * drM * robinScale;
  upper[0] = 2 * x0M;
  rhs[0] = 0;

  for (let i = 1; i < nodes - 1; i++) {
    lower[i] = 1;
    diagonal[i] = -2;
    upper[i] = 1;
    rhs[i] = 0;
  }
  diagonal[nodes - 1] = 1;
  lower[nodes - 1] = 0;
  rhs[nodes - 1] = farRadiusM * sigmaInfinity;

  const cPrime = new Float64Array(nodes);
  const dPrime = new Float64Array(nodes);
  if (diagonal[0] === 0) throw new Error("spherical reference: singular surface row");
  cPrime[0] = upper[0] / diagonal[0];
  dPrime[0] = rhs[0] / diagonal[0];
  for (let i = 1; i < nodes; i++) {
    const denominator = diagonal[i] - lower[i] * cPrime[i - 1];
    if (denominator === 0) throw new Error(`spherical reference: singular row ${i}`);
    cPrime[i] = upper[i] / denominator;
    dPrime[i] = (rhs[i] - lower[i] * dPrime[i - 1]) / denominator;
  }
  const u = new Float64Array(nodes);
  u[nodes - 1] = dPrime[nodes - 1];
  for (let i = nodes - 2; i >= 0; i--) u[i] = dPrime[i] - cPrime[i] * u[i + 1];

  const sigma = new Float64Array(nodes);
  for (let i = 0; i < nodes; i++) sigma[i] = u[i] / radiusAt(i);
  const sigmaSurface = sigma[0];
  return {
    sigmaSurface,
    growthVelocityMS: coefficient * vKin(tempC) * sigmaSurface,
    drM,
    nodes,
    sigma,
  };
}

/**
 * The nucleation-limited case: the attachment coefficient depends on the surface value it helps
 * determine, so the pair is solved self-consistently by damped iteration — the same fixed point
 * the 3D aggregate boundary operator solves per cell. There is NO closed form for this case, so
 * it is a physical reference, never an accuracy check.
 */
export function solveNucleationLimited(
  problem: SphericalProblem,
  facet: FacetClass,
  paramSet: NucleationParamSet,
): { sigmaSurface: number; attachmentCoefficient: number; growthVelocityMS: number } {
  validate(problem);
  let sigmaSurface = problem.sigmaInfinity;
  let coefficient = 0;
  for (let iteration = 0; iteration < 200; iteration++) {
    coefficient = alphaHK(facet, problem.tempC, sigmaSurface, paramSet);
    const next = sphericalAnalytic(problem, coefficient).sigmaSurface;
    if (Math.abs(next - sigmaSurface) <= 1e-14 * problem.sigmaInfinity) {
      sigmaSurface = next;
      break;
    }
    sigmaSurface = 0.5 * (sigmaSurface + next);
  }
  coefficient = alphaHK(facet, problem.tempC, sigmaSurface, paramSet);
  const solved = sphericalAnalytic(problem, coefficient).sigmaSurface;
  if (Math.abs(solved - sigmaSurface) > 1e-9 * problem.sigmaInfinity) {
    throw new Error(
      `spherical nucleation-limited solve did not converge: ${solved} vs iterate ${sigmaSurface}`,
    );
  }
  return {
    sigmaSurface: solved,
    attachmentCoefficient: coefficient,
    growthVelocityMS: coefficient * vKin(problem.tempC) * solved,
  };
}

/**
 * The source's own consistency claim, as an executable check: Eq. 3.36 reduces to Eq. 3.19 as
 * the shell goes to infinity. Returns the relative difference at the given shell radius, which
 * must fall as 1/R_far.
 */
export function sphericalReferenceReducesToInfinite(
  problem: SphericalProblem,
  attachmentCoefficient: number,
): number {
  const finite = sphericalAnalytic(problem, attachmentCoefficient);
  const infinite = sphericalAnalytic({ ...problem, farRadiusM: Infinity }, attachmentCoefficient);
  if (infinite.growthVelocityMS === 0) return 0;
  return Math.abs(finite.growthVelocityMS - infinite.growthVelocityMS) / infinite.growthVelocityMS;
}
