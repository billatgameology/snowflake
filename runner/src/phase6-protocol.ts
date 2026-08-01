// Phase 6 protocol registration — the pre-registration the charter's Phase 6 item 1 requires.
//
// This module is the machine-readable half of the freeze. `docs/plans/phase-6-nakaya-validation.md`
// carries the prose; every item the charter and its amendments name is listed here with a
// status, and the protocol CANNOT be declared frozen while any required item is still pending.
// That is the point: "we froze everything the charter requires" becomes a check rather than a
// promise, and a sweep that runs against an incomplete freeze fails closed.
//
// Freeze list authority: charter §3.2 Phase 6 item 1 (v1.16 line 303), expanded by ADR 0005 D4,
// amended by ADR 0006 (dual convergence adds `divTol` and `relaxMaxSweeps`) and ADR 0009 (the
// coupled surface policy). Any post-freeze edit to a registered value requires a logged ADR and
// invalidates that protocol's prior sweep results — the sweep re-runs in full.

import { execFileSync } from "node:child_process";
import { sigma0Basal, sigma0Prism } from "../../core/src/index.ts";

/** Status of one freeze-list item. A protocol freezes only when nothing is `pending`. */
export type Phase6FreezeStatus = "registered" | "pending";

/**
 * ADR 0033. The prose fields live in a nested `prose` object so the values/justification partition
 * is STRUCTURAL rather than a judgement about what counts as prose: a field is a value if declared
 * outside `prose`, a justification if declared inside. `phase6ValuesManifest()` takes the outer
 * fields, `phase6JustificationManifest()` takes `prose`, and only the first gates a sweep.
 *
 * `id`, `group` and `status` are on the values side because evidence-producing paths read them —
 * `phase6PendingFreezeItems` reads `status`, and preflight reports `id`.
 */
export interface Phase6FreezeItem {
  readonly id: string;
  readonly group:
    | "comparison-design"
    | "physics-inputs"
    | "boundary-and-domain"
    | "surface-operator"
    | "numerics"
    | "statistics"
    | "provenance";
  readonly status: Phase6FreezeStatus;
  readonly prose: {
    /** What the charter/ADR requires, in its own terms. */
    readonly requirement: string;
    /** The registered value, or null while pending. */
    readonly value: string | null;
    /** Where the value comes from, or what must produce it. */
    readonly source: string;
  };
}

// ── Registered: the parameter interpolation scheme (P4) ─────────────────────────────────────
//
// This was already the scheme every run has used (`core/src/libbrecht.ts`); WP0 registers and
// verifies it rather than inventing one. It is **piecewise** log-log linear between adjacent
// digitized anchors — not a global power law. The distinction matters, because the curves are
// not straight in log-log: the local slope runs 0.22→1.62 (basal) and 2.26→1.76 (prism) across
// the digitized range, and a single power law fitted above (Tm−T) ≥ 3 leaves residuals of 21%
// (basal) and 23.8% (prism). `docs/libbrecht-parameters.md` previously justified the scheme by
// calling the curves "near-straight" globally; that justification was wrong and is corrected.
//
// The scheme is defensible on a different ground, measured rather than asserted: it is exact at
// every anchor, monotone between anchors, and its interpolation error is subdominant to the
// digitization uncertainty already carried on the anchors themselves.

/** The digitized abscissae, in `(Tm − T)` °C. Anchors are exact under the scheme. */
export const PHASE6_SIGMA0_ANCHORS_X = [1, 2, 3, 5, 10, 15, 20, 30, 50] as const;

/**
 * Worst leave-one-out relative error of the registered scheme: drop an interior anchor and
 * rebuild it from its two neighbours by the same rule. This spans two intervals where the
 * solver only ever spans one, so it is a conservative upper bound on interpolation error.
 * Recomputed from the live solver in `runner/test/phase6-protocol.test.ts`, so the registered
 * justification cannot drift away from the code.
 */
export const PHASE6_INTERPOLATION_LEAVE_ONE_OUT = {
  basal: 0.107,
  prism: 0.09,
} as const;

/** The digitization band already carried on the anchors (`libbrecht-parameters.md` §3). */
export const PHASE6_SIGMA0_DIGITIZATION_BAND = 0.25;

export const PHASE6_INTERPOLATION = {
  sigma0: "piecewise-log-log-linear",
  aPrism: "piecewise-linear-in-(Tm-T)",
  aBasal: "constant-1",
  /** Extrapolation is banned; the solver throws outside this domain. */
  domainTempC: { warmest: -1, coldest: -50 },
  extrapolation: "banned",
} as const;

/**
 * The registered parameter set (ADR 0031).
 *
 * `PHASE6_INTERPOLATION.aPrism` above registers A_prism as a piecewise-linear interpolation,
 * DISTINCT from `aBasal: "constant-1"` — there is no reading of that row on which A_prism ≡ 1.
 * The 204-point sweep of `6995868` nonetheless ran `CAK_A1`, in which `nucleationAPrism` returns
 * 1 at every temperature, because `runner/src/phase6-sweep.ts` never passed `--param-set` and
 * `runner/src/main.ts` defaults it to `CAK_A1`.
 *
 * So this is NOT a missing freeze row of the kind ADR 0025 corrected — the scheme was registered
 * and the runs violated it, through an unregistered CLI default. Registering the selector itself
 * is what closes that path: a frozen row a default can override is not frozen.
 *
 * The harness MUST pass this explicitly to every child process. `phase6SweepPreflight` asserts it.
 */
export const PHASE6_PARAM_SET = "CAK" as const;

// ── Registered: latent heating is carried, not applied ──────────────────────────────────────
//
// The source prints two anchors and a trend — `chi_0 ≈ 0.8` at −1 °C, `≈ 0.4` at −10 °C,
// "continues falling with colder temperatures" (monograph printed p. 98) — and the first-order
// correction rescales the driving supersaturation, `sigma_inf → sigma_inf/(1 + chi_0)`.
//
// Applying that correction across a Nakaya-range sweep would require inventing `chi_0` below
// −10 °C, which is exactly where the cold half of the reversal test lives, and this project
// does not invent curves for quantities it then reports on. The correction is therefore
// REPORTED as a stated systematic and not applied. The source's own statement bounds what that
// costs: kinetics-limited growth — where the registered low-supersaturation runs sit — is
// essentially unaffected; diffusion-limited points are biased fast by up to ~40–80% on the warm
// side, falling with temperature.
export const PHASE6_LATENT_HEATING = {
  treatment: "stated-systematic",
  applied: false,
  anchors: [
    { tempC: -1, chi0: 0.8 },
    { tempC: -10, chi0: 0.4 },
  ],
  colderThanAnchors: "falls further; no printed values, so none are invented",
  pressureScaling: "chi_0 ~ 1/P",
  correctionIfApplied: "sigma_inf -> sigma_inf / (1 + chi_0)",
  source: "monograph printed p. 98 / pdf 99; anchors in docs/libbrecht-parameters.md §7",
} as const;

// ── Registered: conditions the charter fixes outright ───────────────────────────────────────

/**
 * Charter §2.4 requires every Phase 6 validation run to name its far-field condition. It was
 * registered as fixed-σ Dirichlet until WP3b measured what that shell costs: it holds
 * `sigma_infinity` at a finite radius and so over-supplies vapor by roughly 46% at 48³ and 160%
 * at Phase 2b's own configuration. ADR 0024 adds the monopole-matched shell of monograph
 * Eq. 5.30, which removes the domain dependence outright — a 4.1% swing becomes 0.0% — and
 * Phase 6 runs it.
 *
 * Phase 2b/4/5 evidence keeps the condition that produced it and is never pooled with sweeps.
 */
export const PHASE6_FAR_FIELD = "monopole-matched";
/**
 * The coupled policy the forward LK operator runs. ADR 0009 introduced
 * `aggregate-hv-g1h1-v4`; ADRs 0013/0014 added the metered float64 smoother-drift term to the
 * divergence identity, which is `-v5`, and that was the runner's default. WP0b then found that
 * v4/v5 sum the Eq. 5.35 opposing-vapor operands in lattice-gather order, which rot60 permutes
 * non-monotonically, so their boundary value is not D6h-equivariant in float64 and the
 * noise-off symmetry check cannot be enforced against them. ADR 0023 adds `-v6`, identical to
 * v5 except that those operands are summed in ascending value order.
 *
 * Phase 6 registers v6 and must pass it explicitly: the runner's default stays v5 so Phase 2b's
 * executed evidence keeps replaying under the policy that produced it.
 */
export const PHASE6_SURFACE_POLICY = "aggregate-hv-g1h1-v6";

/**
 * WP1's measured uncertainty on each digitized Nakaya boundary, in °C. The figure is a redrawn
 * schematic — its temperature axis is not uniform and its supersaturation axis fails an
 * independent check — so the boundary temperatures carry this and the σ values are not used as
 * targets at all.
 */
export const PHASE6_REFERENCE_BOUNDARY_UNCERTAINTY_C = 0.5;

/**
 * Half-width of the band around a reference boundary inside which a habit disagreement is
 * reported but NOT counted as evidence about the model. Near a boundary both classes are
 * plausible in the reference itself, so the model cannot be asked to place a flip more
 * precisely than the reference locates it; far from one, a disagreement is a real finding.
 *
 * It cuts both ways deliberately: a model agreeing with the diagram only near boundaries has
 * demonstrated nothing. The claim Phase 6 can earn is agreement in the interiors plus flips in
 * roughly the right places.
 *
 * Registered as a FORMULA before any sweep and as a number in WP0c, because applied after
 * results are seen the same rule becomes "the points that disagreed happened to be near a
 * boundary" — the post-hoc rationalisation the charter §3.2 freeze exists to prevent.
 */
export function phase6AmbiguityHalfWidthC(tGridSpacingC: number): number {
  if (!Number.isFinite(tGridSpacingC) || tGridSpacingC <= 0) {
    throw new Error(
      `Phase 6 ambiguity band needs a positive T-grid spacing, got ${String(tGridSpacingC)}`,
    );
  }
  return PHASE6_REFERENCE_BOUNDARY_UNCERTAINTY_C + tGridSpacingC / 2;
}

// ── Registered: the temperature axis ────────────────────────────────────────────────────────

/**
 * The habit-boundary temperatures WP1 measured off Libbrecht 1211.5555v1 Fig. 1, each ±0.5 °C
 * (`PHASE6_REFERENCE_BOUNDARY_UNCERTAINTY_C`). Bounding the sequence
 * plates -> columns -> plates -> columns-and-plates as temperature falls.
 *
 * These are the ONLY quantities taken from that figure. Its printed supersaturation values are
 * not used as targets at all: WP1's cross-check passes on position (the water-saturation curve
 * peaks at −14.09 °C against our −14.35 °C) and fails on scale (amplitude a flat 0.724 of ours,
 * 30–42% below Murphy-Koop).
 */
export const PHASE6_NAKAYA_BOUNDARIES_C = [-3.3, -9.9, -21.5] as const;

/**
 * The registered temperature axis: uniform 1 °C from −2 to −35 °C, 34 points.
 *
 * **Uniform, not clustered near the boundaries**, which reverses the plan's earlier design note.
 * That note assumed fine spacing had to be bought by coarsening elsewhere. WP0c measured the
 * cost and it does not: at the registered configuration a whole 1 °C row of this range costs a
 * couple of hours across seven cores, so the axis can simply be fine everywhere. A non-uniform
 * axis would also make `phase6AmbiguityHalfWidthC` ill-posed — it takes ONE spacing, and with a
 * mixed grid there is no honest single value to hand it.
 *
 * **Why 1 °C and not finer.** The band half-width is `0.5 + spacing/2`, so halving the spacing
 * moves it only 1.0 → 0.75 °C: the 0.5 °C floor is the reference's own boundary uncertainty and
 * no grid refinement can beat it. Resolving finer than the reference locates its own boundaries
 * would be measuring our axis, not comparing against theirs.
 *
 * **Why it ends at −35.** That is the coldest labelled tick on the digitized figure, and the
 * caption makes a claim below −30 ("predominantly columns") that the range must cover to test.
 * Colder than −35 the reference says nothing, so a model result there could not be scored.
 *
 * **Why it starts at −2.** Warmer than that, `phase6SigmaWaterFromTable` still interpolates, but
 * two things degrade together: the unapplied latent-heating systematic is largest at the warm
 * end (`chi_0 ≈ 0.8` at −1 °C, biasing diffusion-limited growth fast by up to ~40–80%), and the
 * figure's own warmest labelled habit is at −2 °C.
 */
export const PHASE6_T_GRID = {
  warmestC: -2,
  coldestC: -35,
  spacingC: 1,
} as const;

/** The registered temperature axis, warmest first. */
export function phase6TemperatureGrid(): readonly number[] {
  const { warmestC, coldestC, spacingC } = PHASE6_T_GRID;
  const out: number[] = [];
  const count = Math.round((warmestC - coldestC) / spacingC) + 1;
  for (let i = 0; i < count; i++) out.push(warmestC - i * spacingC);
  return out;
}

/** Registered as a number, now that the T grid is fixed: 0.5 + 1/2 = 1.0 °C. */
export const PHASE6_AMBIGUITY_HALF_WIDTH_C = phase6AmbiguityHalfWidthC(PHASE6_T_GRID.spacingC);

// ── Registered: the grid-extrapolation operator (ADR 0026) ──────────────────────────────────
//
// The uncertainty scheme consumes a per-point "grid-extrapolated class". WP0c registered that
// consumption without registering how the extrapolation is COMPUTED — an operator chosen after
// seeing results would be exactly the freedom the freeze exists to remove. The 2026-07-27
// independent review found the gap.
//
// The operator is first-order Richardson on the two finest spacings, ADMITTED ONLY where the
// fitted convergence order is credible. That admission test is the substance: WP3 §4.2 measured
// a fitted order of 1.142 cold (Richardson 1.42-1.46, class stable either way) and 0.207 warm,
// where the extrapolated CLASS changes with the assumed order — neutral at the fitted order,
// plate at first order. An extrapolation that sensitive to a fitted exponent carries no
// information about the class, so warm must be refused rather than reported.

/** Fitted order must lie in this window for an extrapolation to be admitted. */
export const PHASE6_EXTRAPOLATION_ORDER_WINDOW = { lowest: 0.7, highest: 1.5 } as const;

/**
 * Historical measured-only extent-fragility operator.
 *
 * CORRECTION 2026-08-01: the registered one-directional premise was refuted by the P1 ladder,
 * whose AR moved 1.52632 -> 1.52174 from rung B to C. This helper is retained to reproduce and
 * audit the historical artifacts; it is not a valid R15 uncertainty bound and must not be used by
 * the replacement production evaluator.
 *
 * WP3 §3 measured how far `AR` still drifts between the registered extent 21 and the
 * value-converged extent 31: **cold +0.135** (1.1053 → 1.240) and warm about +0.04. The larger is
 * registered as the historical bound. The original registration asserted one-directional drift;
 * that assertion is false and is preserved only in the immutable protocol text/hash.
 *
 * Carried this way because a per-point extent trajectory is unaffordable: it needs a run to
 * extent 39 at every grid point, several times the cost of the sweep itself. What is affordable,
 * and what is registered, is to flag every point sitting within the bound BELOW a threshold as
 * `extent-fragile` — it might cross with further development, and the sweep cannot say whether
 * it does.
 */
export const PHASE6_EXTENT_DRIFT_BOUND_AR = 0.135;

/**
 * Reproduces whether a historical measured `AR` was flagged below a class threshold under the
 * now-refuted directional rule. This is an artifact reader, not a scientific adequacy predicate.
 */
export function phase6IsExtentFragile(aspectRatioValue: number): boolean {
  for (const threshold of [1 / 1.5, 1.5]) {
    if (aspectRatioValue < threshold && aspectRatioValue >= threshold - PHASE6_EXTENT_DRIFT_BOUND_AR) {
      return true;
    }
  }
  return false;
}

/**
 * The domain spot-check the `domain-budgets` row requires at the sweep's fastest-growing point,
 * with a PASS CRITERION rather than an unfalsifiable instruction to "spot-check".
 *
 * Two parts, both required:
 *   - the habit CLASS must be identical at N = 48 and N = 64, and
 *   - the attached count must agree within 0.5%.
 *
 * 0.5% is not arbitrary: it is the residual WP3 §1.2 measured at N = 40 — one full ladder step
 * BELOW the registered domain — at the discriminating condition. A fastest-growing point that
 * exceeds it at N = 48 is behaving worse than the calibration point did a step coarser, which is
 * exactly the signal that the budget does not transfer across growth rate.
 */
export const PHASE6_DOMAIN_SPOT_CHECK = {
  coarseN: 48,
  fineN: 64,
  requireIdenticalClass: true,
  attachedCountTolerance: 0.005,
  /**
   * On failure the domain budget rises to N = 64 for the ENTIRE grid, not just the failing
   * point. A per-point domain would make points incomparable with each other, which is the one
   * thing a morphology diagram cannot survive.
   */
  onFailure: "raise the registered domain to N = 64 for the entire grid and re-run it",
} as const;

export interface Phase6GridExtrapolation {
  readonly fittedOrder: number;
  readonly admitted: boolean;
  /** First-order Richardson limit; null when the fit is refused. */
  readonly extrapolatedAR: number | null;
  readonly reason: string;
}

/**
 * Fit the convergence order from three spacings and, if it is credible, extrapolate.
 *
 * Spacings need not refine by a constant ratio (WP3's are ×0.5 then ×2/3), so the order is
 * FITTED from the ratio of successive differences rather than assumed — assuming first order is
 * what produced the withdrawn warm limit in §4.1.
 *
 * `spacings` and `values` are ordered coarsest to finest.
 */
export function phase6FitGridExtrapolation(
  spacings: readonly [number, number, number],
  values: readonly [number, number, number],
): Phase6GridExtrapolation {
  const [h0, h1, h2] = spacings;
  if (!(h0 > h1 && h1 > h2 && h2 > 0)) {
    throw new Error("grid extrapolation needs three spacings ordered coarsest to finest");
  }
  const d1 = values[1] - values[0];
  const d2 = values[2] - values[1];
  const observed = d2 / d1;
  const ratioOfOrder = (p: number): number =>
    (Math.pow(h1, p) - Math.pow(h2, p)) / (Math.pow(h0, p) - Math.pow(h1, p));
  // Monotone in p over the admissible range, so bisection is exact enough and has no local
  // minima to fall into.
  let low = 0.01;
  let high = 4;
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    if (ratioOfOrder(mid) > observed) low = mid;
    else high = mid;
  }
  const fittedOrder = (low + high) / 2;
  const admitted =
    Number.isFinite(fittedOrder) &&
    fittedOrder >= PHASE6_EXTRAPOLATION_ORDER_WINDOW.lowest &&
    fittedOrder <= PHASE6_EXTRAPOLATION_ORDER_WINDOW.highest;
  if (!admitted) {
    return {
      fittedOrder,
      admitted: false,
      extrapolatedAR: null,
      reason:
        `fitted order ${fittedOrder.toFixed(3)} is outside the admitted window ` +
        `[${PHASE6_EXTRAPOLATION_ORDER_WINDOW.lowest}, ${PHASE6_EXTRAPOLATION_ORDER_WINDOW.highest}] ` +
        "— reported not-extrapolatable, measured class only",
    };
  }
  return {
    fittedOrder,
    admitted: true,
    extrapolatedAR: values[2] + (values[2] - values[1]) / (h1 / h2 - 1),
    reason: "first-order Richardson on the two finest spacings",
  };
}

// ── Registered: how a model habit is scored against the reference (ADR 0025) ────────────────
//
// Registered BEFORE any sweep, because without it the mapping from model class onto reference
// regime is an open degree of freedom that could be settled after seeing results — the exact
// thing the freeze exists to prevent. The 2026-07-27 independent review found this gap.
//
// The reference's own top-row labels are already on the plate/column axis
// ("Plates | Columns | Plates | Columns and Plates"), so collapsing morphology types onto that
// axis is the figure's own framing rather than a reduction we impose: its dendrites and
// sectored plates are plates by aspect ratio, its needles are columns.

export type Phase6ReferenceRegime =
  | "plates-warm"
  | "columns"
  | "plates-cold"
  | "columns-and-plates";

/** What the solver reports at a grid point. `invalid` is a run that did not happen properly. */
export type Phase6ModelClass = "plate" | "column" | "neutral" | "invalid";

/** `excluded` is named and published, never a silent drop. */
export type Phase6Score = "agree" | "disagree" | "excluded";

export interface Phase6RegimeSpec {
  readonly regime: Phase6ReferenceRegime;
  /** Regime holds `tempC <= warmerBoundC` (null = unbounded on the warm side). */
  readonly warmerBoundC: number | null;
  /** Regime holds `tempC > colderBoundC` (null = unbounded on the cold side). */
  readonly colderBoundC: number | null;
  /** Model classes the reference accepts here. */
  readonly accepts: readonly Phase6ModelClass[];
  /** Whether this regime contributes to the headline agreement claim. */
  readonly inHeadline: boolean;
}

/**
 * Half-open intervals `(colderBoundC, warmerBoundC]`, so a temperature exactly ON a digitized
 * boundary belongs to the regime on its COLD side and every temperature lands in exactly one
 * regime. The convention is arbitrary but must be fixed and stated: a boundary temperature is
 * always inside the ambiguity band and so never scores either way, but a total function cannot
 * be left ambiguous about it.
 */
export const PHASE6_REFERENCE_REGIMES: readonly Phase6RegimeSpec[] = [
  { regime: "plates-warm", warmerBoundC: null, colderBoundC: -3.3, accepts: ["plate"], inHeadline: true },
  { regime: "columns", warmerBoundC: -3.3, colderBoundC: -9.9, accepts: ["column"], inHeadline: true },
  { regime: "plates-cold", warmerBoundC: -9.9, colderBoundC: -21.5, accepts: ["plate"], inHeadline: true },
  {
    regime: "columns-and-plates",
    warmerBoundC: -21.5,
    colderBoundC: null,
    // The reference accepts BOTH pure classes here, which is why this regime is excluded from
    // the headline — see PHASE6_HEADLINE_SCOPE_C.
    accepts: ["plate", "column"],
    inHeadline: false,
  },
];

/** The reference regime containing a temperature. */
export function phase6ReferenceRegime(tempC: number): Phase6ReferenceRegime {
  for (const spec of PHASE6_REFERENCE_REGIMES) {
    const warmOk = spec.warmerBoundC === null || tempC <= spec.warmerBoundC;
    const coldOk = spec.colderBoundC === null || tempC > spec.colderBoundC;
    if (warmOk && coldOk) return spec.regime;
  }
  throw new Error(`no reference regime contains T = ${String(tempC)} C`);
}

/**
 * The headline falsification claim is restricted to −2…−21.5 °C, i.e. the three regimes that
 * name a single habit. Two independent reasons, and the first is sufficient on its own:
 *
 * 1. **"Columns and Plates" accepts both pure classes**, so a model producing anything except
 *    neutral scores agreement there almost for free. Those 13 temperatures are 46% of the
 *    counting budget; folding them into one percentage would inflate it with near-free points.
 *    Worse, that regime describes a POPULATION of natural free-falling crystals, while a grid
 *    point here is one deterministic crystal — matching a mixed population with a single run is
 *    ill-posed however the score is defined.
 * 2. The coldest regime is reportedly disputed observationally (Bailey & Hallett 2009, via
 *    `docs/stretch-sharing-and-investigation.md`). That source is SWEEP-REPORTED and NOT yet
 *    verified in-repo, so it is recorded as corroboration only and carries no weight on its own.
 *
 * The cold regime is still swept and still reported — separately, with its own count.
 */
export const PHASE6_HEADLINE_SCOPE_C = { warmestC: -2, coldestC: -21.5 } as const;

/**
 * Score one grid point against the reference.
 *
 * **`neutral` scores DISAGREE, not abstention.** The reference names a habit in every regime;
 * our 0.667–1.5 neutral band spans a factor 2.25 in aspect ratio and is ours, not the
 * reference's. A model that produces neither habit has failed to reproduce the reference, and
 * calling that an abstention would let a model that never commits report perfect agreement on a
 * handful of points. The neutral count is published separately so a reader can always tell
 * "wrong habit" from "no habit" — which is the distinction that matters scientifically.
 *
 * **`invalid` scores EXCLUDED and is named.** A run that tripped the domain-contact guard, broke
 * symmetry, or failed to converge is not a statement about the model at all; it is a run that
 * did not happen. The plan already requires such runs be excluded by name rather than dropped.
 */
export function phase6ScoreHabit(tempC: number, modelClass: Phase6ModelClass): Phase6Score {
  if (modelClass === "invalid") return "excluded";
  const regime = phase6ReferenceRegime(tempC);
  const spec = PHASE6_REFERENCE_REGIMES.find((candidate) => candidate.regime === regime);
  if (spec === undefined) throw new Error(`no spec for regime ${regime}`);
  return spec.accepts.includes(modelClass) ? "agree" : "disagree";
}

export interface Phase6RegimeBudget {
  readonly regime: Phase6ReferenceRegime;
  readonly inHeadline: boolean;
  readonly counting: readonly number[];
  readonly ambiguous: readonly number[];
}

/**
 * The per-regime evidence budget, published pre-sweep alongside the 28/6 split.
 *
 * It exposes a real limitation that must be stated here rather than discovered in the report:
 * **the warmest Plates regime contains exactly ONE counting temperature (−2 °C)**, so that
 * regime can only ever score 0% or 100% and carries essentially no statistical weight. It is not
 * padded by extending the grid warmer: −1 °C is the only candidate, it sits where the unapplied
 * latent-heating systematic is largest (chi_0 ~ 0.8, a ~1.8x correction to the driving
 * supersaturation), and importing the worst systematic to buy one point is a bad trade.
 */
export function phase6RegimeBudget(): readonly Phase6RegimeBudget[] {
  return PHASE6_REFERENCE_REGIMES.map((spec) => {
    const inRegime = phase6TemperatureGrid().filter(
      (tempC) => phase6ReferenceRegime(tempC) === spec.regime,
    );
    return {
      regime: spec.regime,
      inHeadline: spec.inHeadline,
      counting: inRegime.filter((tempC) => !phase6IsInAmbiguityBand(tempC)),
      ambiguous: inRegime.filter((tempC) => phase6IsInAmbiguityBand(tempC)),
    };
  });
}

export interface Phase6Flip {
  /** Warm side of the bracketing interval. */
  readonly warmerC: number;
  /** Cold side of the bracketing interval. */
  readonly colderC: number;
  readonly from: "plate" | "column";
  readonly to: "plate" | "column";
  /** Width of the bracket in °C — the flip's location uncertainty. */
  readonly widthC: number;
}

/**
 * Where the MODEL changes habit, scanning warm to cold.
 *
 * A flip is BRACKETED, never pinpointed: it is reported as the interval between the last
 * temperature of one pure class and the first temperature of the other, and `widthC` is that
 * interval. Neutral and invalid points do not terminate a scan — they widen the bracket, which
 * is the honest representation: a wide neutral span means the flip location is poorly located,
 * and collapsing it to a midpoint would manufacture precision the data does not have.
 *
 * The count of flips is itself a first-class result. The reference has three; a single monotone
 * sigma_0 crossing can produce at most one.
 */
export function phase6DetectFlips(
  observations: readonly { readonly tempC: number; readonly modelClass: Phase6ModelClass }[],
): readonly Phase6Flip[] {
  const ordered = [...observations].sort((left, right) => right.tempC - left.tempC);
  const flips: Phase6Flip[] = [];
  let lastPure: { tempC: number; modelClass: "plate" | "column" } | null = null;
  for (const observation of ordered) {
    if (observation.modelClass !== "plate" && observation.modelClass !== "column") continue;
    const pure = { tempC: observation.tempC, modelClass: observation.modelClass };
    if (lastPure !== null && lastPure.modelClass !== pure.modelClass) {
      flips.push({
        warmerC: lastPure.tempC,
        colderC: pure.tempC,
        from: lastPure.modelClass,
        to: pure.modelClass,
        widthC: Math.abs(lastPure.tempC - pure.tempC),
      });
    }
    lastPure = pure;
  }
  return flips;
}

// ── Registered: the supersaturation axis ────────────────────────────────────────────────────
//
// Water-relative fractions, not absolute sigma values: at -2 C an absolute sigma = 0.05 would be
// 2.5x water saturation while the same number at -15 C sits comfortably below it, so a fixed
// absolute ladder would not mean the same thing at both ends of the T axis.
//
// CORRECTED 2026-07-29 (audit). This comment previously justified the cap by saying "the diagram's
// upper region is bounded by water saturation". That is false about the reference FIGURE — the
// water-saturation line is drawn ON it, with structure above. The cap is defensible on a different
// ground: sustained supersaturation above sigma_water nucleates water droplets, which changes the
// boundary condition around the crystal. 2109.00098v1 p9: "rapid nucleation of water droplets
// whenever the near-surface supersaturation exceeds sigma_water ... making it quite difficult to
// examine ice growth behaviors on substrates with sigma > sigma_water". That is why Libbrecht's own
// high-sigma observations use free-standing needles, and why a cloud-conditions grid stops there.
// See docs/phase6-protocol-errata.md E2.
//
// The usable window is bounded at BOTH ends, and WP0c measured where rather than asserting it.
// Both bounds are properties of alphaHK = A*exp(-sigma_0/sigma_surf) evaluated on the registered
// sigma_0 curves:
//
//   TOO LOW — the dead-facet regime. At f = 0.05 the smaller of the two facet coefficients falls
//   to 2.3e-4 at -35 C against rough-site 1.0, so both facet families are effectively frozen and
//   habit is set by rough-site geometry and hole filling rather than by the CAK crossing under
//   test. That is the regime `monograph-review.md` §2.5 warns about, and it is where Phase 2b's
//   sigma_inf = 0.002 sat. f = 0.10 keeps the smaller coefficient at 1.5e-2 or above everywhere
//   on the registered T axis, which is the low bound registered here.
//
//   TOO HIGH — ~~contrast collapse~~ RETRACTED, see docs/phase6-protocol-errata.md E1. The figures
//   below (0.34–3.76 at f = 0.15 compressing to 0.84–1.25 at f = 0.90) are `CAK_A1` values, and the
//   registered set is `CAK`. Under `CAK` the basal/prism ratio spans 1.20–3.75 at f = 0.15 and
//   1.06–5.05 at f = 0.90 — WIDER at the top, not compressed, so the contrast-collapse argument
//   REVERSES for the registered set. The identical wording appears inside the hashed `t-sigma-grid`
//   freeze row, where it cannot be edited without invalidating the sweep; it is carried as erratum
//   E1 instead. The upper bound stands on the OTHER ground given below (weak facet contrast is not
//   weak habit variation), which does not depend on the compression figure.
//
// The top of the range is kept ANYWAY, and deliberately. Weak facet contrast is not the same as
// weak habit variation — at high supersaturation growth is increasingly diffusion-limited and
// morphology is set by branching instability rather than facet kinetics, which is precisely the
// regime the diagram fills with dendrites and needles. So f = 0.90 is not registered as a
// prediction of "no habit variation"; it is registered as the row where facet kinetics stop
// being the dominant mechanism, and what the model does there is a genuine question rather than
// a foregone one.
export const PHASE6_SIGMA_FRACTIONS = [0.1, 0.15, 0.25, 0.4, 0.6, 0.9] as const;

/** σ∞ at a registered grid point: a fraction of Table 2.1 water saturation. */
export function phase6SigmaInf(tempC: number, fraction: number): number {
  if (!(PHASE6_SIGMA_FRACTIONS as readonly number[]).includes(fraction)) {
    throw new Error(
      `f = ${String(fraction)} is not a registered sigma fraction ` +
        `[${PHASE6_SIGMA_FRACTIONS.join(", ")}]`,
    );
  }
  return phase6SigmaWaterFromTable(tempC) * fraction;
}

export interface Phase6GridPoint {
  readonly tempC: number;
  readonly fraction: number;
  readonly sigmaInf: number;
  readonly inAmbiguityBand: boolean;
  readonly distanceToBoundaryC: number;
}

/** The full registered sweep grid: 34 temperatures x 6 fractions = 204 points. */
export function phase6SweepGrid(): readonly Phase6GridPoint[] {
  const out: Phase6GridPoint[] = [];
  for (const tempC of phase6TemperatureGrid()) {
    for (const fraction of PHASE6_SIGMA_FRACTIONS) {
      out.push({
        tempC,
        fraction,
        sigmaInf: phase6SigmaInf(tempC, fraction),
        inAmbiguityBand: phase6IsInAmbiguityBand(tempC),
        distanceToBoundaryC: phase6DistanceToNearestBoundaryC(tempC),
      });
    }
  }
  return out;
}

/** Distance in °C from a temperature to the nearest digitized Nakaya habit boundary. */
export function phase6DistanceToNearestBoundaryC(tempC: number): number {
  let best = Infinity;
  for (const boundary of PHASE6_NAKAYA_BOUNDARIES_C) {
    const distance = Math.abs(tempC - boundary);
    if (distance < best) best = distance;
  }
  return best;
}

/**
 * True when a habit disagreement at this temperature is REPORTED BUT NOT COUNTED as evidence
 * about the model, because near a boundary both classes are plausible in the reference itself.
 *
 * It cuts both ways deliberately, and that is the point: agreement inside the band earns nothing
 * either. The claim Phase 6 can earn is agreement in the interiors plus flips in roughly the
 * right places.
 */
export function phase6IsInAmbiguityBand(tempC: number): boolean {
  return phase6DistanceToNearestBoundaryC(tempC) <= PHASE6_AMBIGUITY_HALF_WIDTH_C;
}

/**
 * How the registered axis splits before any run happens — published pre-sweep so the evidence
 * budget is known in advance rather than discovered afterwards.
 */
export function phase6EvidencePartition(): {
  counting: readonly number[];
  ambiguous: readonly number[];
} {
  const grid = phase6TemperatureGrid();
  return {
    counting: grid.filter((t) => !phase6IsInAmbiguityBand(t)),
    ambiguous: grid.filter((t) => phase6IsInAmbiguityBand(t)),
  };
}

// ── Registered: how the supersaturation ladder is defined ───────────────────────────────────
//
// The Nakaya diagram's upper region is bounded by the water-saturation curve, so the physically
// meaningful ladder is a fraction of water saturation rather than a set of absolute sigma
// values: at -2 C, sigma = 0.05 would be 2.5x water saturation, which no cloud produces, while
// the same number at -15 C sits comfortably below it. A water-relative ladder also tracks
// sigma_0(T) automatically, which keeps grid points out of the dead-facet regime that the
// plan's open question 6 warns about.
//
// It is NOT computed from `sigmaWater()`. That difference form is a known, pinned limitation
// (`core/test/libbrecht.test.ts`), and WP0c measured how bad it actually is rather than
// repeating the estimate this comment used to carry:
//
//   - it crosses ZERO at T = -1.969 C and is negative warmer than that, where the true value is
//     strictly positive. (An earlier version of this comment said "warmer than about -3 C",
//     which is wrong: it is positive at both -3 C and -2 C.)
//   - its error is not an offset but a strong function of temperature. Against the anchors below
//     it runs 0.015x at -2 C, 0.59x at -5 C, 0.80x at -10 C, 0.87x at -15 C and 0.96x at -30 C.
//
// That second point is the disqualifying one. A ladder built on it would make "f = 0.15" mean
// 0.2% of water saturation at -2 C and 14% at -30 C, so the sweep's temperature axis would be
// confounded with a systematic varying by a factor of ~65 — it would not be a temperature scan
// at all. The ladder therefore uses the monograph's own printed Table 2.1 anchors, which
// Murphy & Koop (2005) independently confirms: recomputing their Eqs. 7 and 10 reproduces every
// anchor below to within 1.8%, worst at the -1 C anchor and within 0.5% from -5 C to -40 C.
// Pinned in runner/test/phase6-protocol.test.ts.
export const PHASE6_SIGMA_WATER_ANCHORS = [
  { tempC: 0, sigmaWater: 0.0 },
  { tempC: -1, sigmaWater: 0.01 },
  { tempC: -2, sigmaWater: 0.02 },
  { tempC: -5, sigmaWater: 0.05 },
  { tempC: -10, sigmaWater: 0.102 },
  { tempC: -15, sigmaWater: 0.157 },
  { tempC: -20, sigmaWater: 0.215 },
  { tempC: -30, sigmaWater: 0.34 },
  { tempC: -40, sigmaWater: 0.474 },
] as const;

/**
 * Water saturation at one temperature, from the printed Table 2.1 anchors by linear
 * interpolation. Linear (not log-log) because the anchors are near-linear in T and the quantity
 * passes through zero at 0 C, where a log scheme is undefined. Extrapolation is banned, exactly
 * as it is for the sigma_0 anchors.
 */
export function phase6SigmaWaterFromTable(tempC: number): number {
  const anchors = PHASE6_SIGMA_WATER_ANCHORS;
  const warmest = anchors[0].tempC;
  const coldest = anchors[anchors.length - 1].tempC;
  if (!(tempC <= warmest && tempC >= coldest)) {
    throw new Error(
      `T = ${tempC} C is outside the Table 2.1 sigma_water anchors [${coldest}, ${warmest}] — ` +
        "extrapolation is banned",
    );
  }
  for (let i = 0; i < anchors.length - 1; i++) {
    const left = anchors[i] as { tempC: number; sigmaWater: number };
    const right = anchors[i + 1] as { tempC: number; sigmaWater: number };
    if (tempC <= left.tempC && tempC >= right.tempC) {
      const t = (tempC - left.tempC) / (right.tempC - left.tempC);
      return left.sigmaWater + t * (right.sigmaWater - left.sigmaWater);
    }
  }
  throw new Error(`no Table 2.1 interval contains T = ${tempC} C`);
}

// ── Registered: which engine produces sweep evidence, and what checks it ────────────────────
//
// Phase 5 certified the float32 GPU port against the float64 CPU oracle under frozen
// tolerances — but it certified it ON THE PHASE 5 FIXTURES, at their exact dims and
// conditions. Phase 6 sweeps different temperatures, supersaturations and domains, so quoting
// that certificate here would extend a measurement past where it was made.
//
// **The sweep runs on the float64 CPU oracle.** An earlier version of this comment said it runs
// on the GPU "which is what makes hundreds of runs affordable at all" — that was written before
// the GPU was measured, contradicted `sweepEngine` three lines below it, and is corrected here.
// Measurement reversed it twice over: the GPU is ~6x SLOWER than the oracle at 28³, and it
// cannot satisfy the frozen relative `divTol` at all in sustained runs because 1e-7 is below one
// float32 epsilon. The GPU is a labelled diagnostic cross-check on registered points only, and
// the quantity compared is the habit classification — the only thing the comparison consumes.
//
// A disagreement at a control point is a finding about float32 at sweep conditions, reported as
// one — not a reason to quietly prefer whichever engine produced the nicer diagram.
export const PHASE6_ENGINE_CONTROL = {
  sweepEngine: "cpu-float64",
  /**
   * The GPU is a labelled diagnostic cross-check, never the primary and never a gate criterion:
   * it cannot satisfy the frozen `divTol` in sustained runs, so any GPU comparison runs at a
   * relaxed, separately-labelled tolerance and is reported as a diagnostic.
   *
   * `divTol` is RELATIVE, not absolute — both engines compute
   * `|injection + drift - exchange| / |exchange|`. WP0c corrected that description, and the
   * correction sharpens the conclusion: the numerator is a difference of float32 accumulations
   * of magnitude ~0.596, whose rounding floor is about one ULP of that magnitude, so the
   * relative floor is about one float32 epsilon (1.19e-7). The frozen 1e-7 sits BELOW a single
   * machine epsilon of the arithmetic asked to meet it, which is why the observed residuals
   * cluster at 1.0-1.6e-7 and why more sweeps provably cannot help.
   *
   * It also runs a DIFFERENT SURFACE OPERATOR. The WGSL boundary kernel was not ported to ADR
   * 0023's canonical opposing-operand order and the GPU LK entry points refuse any policy but
   * v5, so the diagnostic differs from the sweep in arithmetic width, in divergence tolerance,
   * AND in operand order. It can corroborate a trend; it cannot be compared value-for-value.
   */
  diagnosticEngine: "gpu-float32-v5-at-relaxed-divergence-tolerance",
  /** What the cross-check compares. Habit is the comparison's only consumed output. */
  comparedQuantity: "habit-classification-at-the-registered-measurement-size",
  /** Chosen in WP0c alongside the grid: which points get a GPU diagnostic re-run. */
  controlPoints: null as readonly { readonly tempC: number; readonly sigmaInf: number }[] | null,
  onDisagreement: "reported as a float32-at-sweep-conditions finding; neither engine is dropped",
  /**
   * Cross-platform reproducibility control (WP3). `Math.exp`/`log`/`pow` are not specified to
   * be correctly rounded, and this solver depends on them, so results may differ in the last
   * ULP across architectures. A habit classification that differs between arm64 and x64 means
   * that conclusion rested on a coin toss, and is reported as fragile rather than averaged away.
   */
  reproducibilityControl: "same registered fixture on arm64 and x64; compare habit class",
} as const;

// ── Registered: the frozen parameter table ──────────────────────────────────────────────────

/**
 * sha256 of `docs/libbrecht-parameters.md` **with line endings normalized to LF**.
 *
 * Normalized deliberately. This repository converts LF to CRLF on checkout, so a hash of the raw
 * bytes would depend on the checking-out machine's git configuration rather than on the content,
 * and would fail spuriously on exactly the second platform the cross-platform control needs to
 * run on. Normalizing makes the hash a statement about the physics, which is what it is for.
 */
export const PHASE6_PARAMETER_TABLE_SHA256 =
  "276494f69682adb2b071c2e2683a98281aef17b3558b4efa6301ceaf11dfa741";

/**
 * Parameter-table revisions, newest last. Post-freeze edits go through an ADR and, once a sweep
 * has run, cost a full re-sweep — so this list should stay very short.
 *
 * - `e572da78…` — WP0c initial freeze (commit 6d28623).
 * - `276494f6…` — ADR 0028: exponent mismatch in the §1.1 Eq. 3.35 erratum check corrected
 *   ("3.7e−6 at alphaHK = 1e−8" paired the 1e−6 value with the 1e−8 argument). Prose only; no
 *   parameter value changed, and the erratum's argument is unaffected.
 */
export const PHASE6_PARAMETER_TABLE_REVISIONS = [
  { sha256: "e572da78f9fe1b1178ef0fd83cf0d6de3ac698a7413342b1e1bb4e235f0d2ed3", note: "WP0c initial freeze" },
  { sha256: "276494f69682adb2b071c2e2683a98281aef17b3558b4efa6301ceaf11dfa741", note: "ADR 0028 erratum-check exponent fix" },
] as const;

// ── Registered: the freeze commit ───────────────────────────────────────────────────────────

/**
 * The commit in which every substantive Phase 6 protocol value became final.
 *
 * It is named from the commit that immediately follows it. A commit cannot contain its own
 * hash, and the alternative — declaring the freeze in the same commit that records the pointer —
 * would make the recorded hash name a commit whose protocol was still incomplete. The following
 * commit adds no protocol content of its own (this constant, the `code-version` row, and their
 * tests), so the hash below is genuinely the commit the protocol froze in. This is the shape
 * `GATE4A_CRITERIA_FREEZE` already uses.
 *
 * **Every Phase 6 execution commit must have this as an ancestor.** That is what makes "the
 * protocol was frozen before the sweep ran" checkable rather than asserted.
 */
export const PHASE6_PROTOCOL_FREEZE_COMMIT = "e2f1bfcab4cf605f5c9c44ad096d8b1bcc0fe967";

export interface Phase6Provenance {
  readonly node: string;
  readonly v8: string;
  readonly head: string;
  readonly trackedStatus: string;
  readonly freezeIsAncestor: boolean;
  readonly treeIsClean: boolean;
}

/**
 * Exact engine and git facts for a Phase 6 run. Same shape and the same refusal to shell-parse
 * as `collectGate4AProvenance`.
 */
export function phase6ProtocolProvenance(
  repoRoot: string = process.cwd(),
  execFile: typeof execFileSync = execFileSync,
): Phase6Provenance {
  const run = (args: readonly string[]): string =>
    execFile("git", [...args], { cwd: repoRoot, encoding: "utf8" }).trim();
  const head = run(["rev-parse", "HEAD"]);
  let freezeIsAncestor = false;
  try {
    execFile("git", ["merge-base", "--is-ancestor", PHASE6_PROTOCOL_FREEZE_COMMIT, head], {
      cwd: repoRoot,
      stdio: "ignore",
    });
    freezeIsAncestor = true;
  } catch {
    freezeIsAncestor = false;
  }
  const trackedStatus = run(["status", "--porcelain", "--untracked-files=no"]);
  return {
    node: process.version,
    v8: process.versions.v8,
    head,
    trackedStatus,
    freezeIsAncestor,
    treeIsClean: trackedStatus === "",
  };
}

// ── The freeze list ─────────────────────────────────────────────────────────────────────────

export const PHASE6_FREEZE_LIST: readonly Phase6FreezeItem[] = [
  {
    id: "t-sigma-grid",
    group: "comparison-design",
    status: "registered",
    prose: {
      requirement: "the T/σ grid",
      value:
        "34 temperatures x 6 water-relative fractions = 204 points. T: uniform 1 °C from −2 to " +
        "−35 °C. σ: f ∈ {0.10, 0.15, 0.25, 0.40, 0.60, 0.90} of Table 2.1 water saturation, " +
        "σ∞ = f · phase6SigmaWaterFromTable(T)",
      source:
        "WP0c. The T axis is uniform because a cost probe showed fine spacing need not be bought " +
        "by coarsening elsewhere, and because the ambiguity-band formula takes ONE spacing — a " +
        "mixed grid would leave no honest value to hand it. Its range is the digitized figure's " +
        "own labelled span. The σ axis is bounded at both ends by measured facet physics rather " +
        "than by assertion: below f ≈ 0.10 the smaller facet coefficient collapses into the " +
        "dead-facet regime (2.3e-4 at f = 0.05, −35 °C, against rough-site 1.0), and above 1x " +
        "water saturation sustained supersaturation nucleates droplets, which changes the " +
        "boundary condition around the crystal (2109.00098v1 p9). The top row " +
        "is kept deliberately: weak facet contrast is not weak habit variation, because at high " +
        "supersaturation morphology is set by branching instability rather than facet kinetics, " +
        "so what the model does there is a real question. Constrained throughout by the " +
        "interpolation domain (T ∈ [−50, −1] °C, extrapolation banned)",
    },
  },
  {
    id: "habit-measurement-size",
    group: "comparison-design",
    status: "registered",
    prose: {
      requirement:
        "the crystal size at which habit is measured — habit is size-dependent, so a stated " +
        "maximum dimension is what keeps comparisons apples-to-apples",
      value:
        "largest extent 21 lattice cells — 7.35 µm at the registered Δx — where largest extent " +
        "is max(tExtent, zExtent), so the crystal is bounded in EVERY direction at measurement " +
        "regardless of habit",
      source:
        "WP3 §3 (research/phase6-convergence.md). Set by the slowest-developing habit, not the " +
        "fastest: the warm plate classifies correctly from extent 9, but at that size the cold " +
        "condition reads AR = 0.63 and classifies plate — the opposite of its converged class, " +
        "and a silent misclassification of half the diagram. Cold's CLASS settles at extent 11 " +
        "and holds comfortable margin by 15–19; its VALUE settles only near 31. Extent 21 is the " +
        "class-adequate size and is registered for classification. Any quantitative AR quoted at " +
        "this size carries the residual drift toward the extent-31 value, on top of the grid " +
        "systematic, and says so",
    },
  },
  {
    id: "metric-thresholds",
    group: "comparison-design",
    status: "registered",
    prose: {
      requirement: "metric thresholds",
      value:
        "AR = z-extent / T-extent; plate AR ≤ 1/1.5 (0.6667), column AR ≥ 1.5, otherwise neutral",
      source:
        "the Phase 2b/4 habit criterion, registered explicitly here rather than inherited " +
        "silently. Three-way with an explicit neutral class on purpose: at the registered " +
        "conditions the cold point measures AR ≈ 1.11, which a two-way plate/column split would " +
        "force into one class or the other and report as agreement or disagreement when the " +
        "honest answer is that the model produced neither habit",
    },
  },
  {
    id: "grid-extrapolation-operator",
    group: "comparison-design",
    status: "registered",
    prose: {
      requirement:
        "how the grid-extrapolated aspect ratio the uncertainty scheme consumes is computed, and " +
        "when it is refused",
      value:
        "First-order Richardson on the two finest spacings, AR0 = AR(h2) + (AR(h2) − AR(h1)) / " +
        "((h1/h2) − 1), admitted ONLY where the order fitted from three spacings lies in " +
        "[0.7, 1.5]. Outside that window the point is reported not-extrapolatable and carries its " +
        "measured class alone. Measured at the registered conditions: cold p = 1.142 (admitted, " +
        "AR0 = 1.456), warm p = 0.207 (refused)",
      source:
        "ADR 0026, from the grid ladder re-run at the REGISTERED measurement extent " +
        "(research/phase6-convergence.md §4.2). The order is fitted rather than assumed because " +
        "the refinement ratios are non-uniform and because assuming first order is precisely what " +
        "produced §4.1's withdrawn warm limit — a number computed from the cold pair and applied " +
        "to warm, whose own successive differences GREW 26x under refinement. The admission " +
        "window exists because at warm the extrapolated CLASS changes with the assumed order " +
        "(neutral at the fitted order, plate at first order), and an extrapolation that sensitive " +
        "to a fitted exponent carries no information about the class",
    },
  },
  {
    id: "agreement-scoring",
    group: "comparison-design",
    status: "registered",
    prose: {
      requirement:
        "how a model habit class is scored against the reference regimes — the accepted-class " +
        "matrix, the treatment of neutral and invalid, the flip predicate, and the headline scope",
      value:
        "Regimes (colderBound, warmerBound]: plates-warm accepts {plate}; columns accepts " +
        "{column}; plates-cold accepts {plate}; columns-and-plates accepts {plate, column} and is " +
        "EXCLUDED from the headline. neutral = DISAGREE (count published separately); invalid = " +
        "EXCLUDED by name. Headline scope −2…−21.5 °C = 15 counting temperatures; the 13 colder " +
        "counting temperatures are reported separately. Flips are bracketed intervals, never " +
        "midpoints, and the flip COUNT is a first-class result. Per-regime budget 1/4/10/13",
      source:
        "ADR 0025, registered pre-sweep after the 2026-07-27 independent review found this hole " +
        "in the WP0c freeze. Without it the mapping from model class onto reference regime was an " +
        "open degree of freedom that could have been settled after seeing results — neutral in " +
        "particular had no score at all, and WP3's cold discriminating point measures neutral",
    },
  },
  {
    id: "uncertainty-reporting",
    group: "comparison-design",
    status: "registered",
    prose: {
      requirement: "the uncertainty-reporting scheme",
      value:
        "Per point: the measured AR and class; the grid-extrapolated AR and ITS class where the " +
        "registered operator admits one, otherwise the point is marked not-extrapolatable; a " +
        "classSurvivesGridExtrapolation flag; the distance to the nearest reference boundary; and " +
        "ambiguity-band membership. THE HEADLINE IS THE CONSERVATIVE INTERSECTION — points whose " +
        "measured class agrees AND whose admitted extrapolation does not contradict it — over the " +
        "15 headline-scope counting temperatures. The two component counts (measured-only, " +
        "extrapolated-only) and the not-extrapolatable tally are reported BENEATH it, never as " +
        "the top line. Global qualifiers travel with every table: volume-like quantities are not " +
        "converged at the registered fill-CFL (+8.7%) or domain (+0.04%); latent heating is " +
        "carried and not applied; cross-platform reproducibility is unestablished until the arm64 " +
        "control runs. The MEASUREMENT-EXTENT systematic is carried per point as well: any point " +
        "whose measured AR sits within 0.135 BELOW a class threshold is flagged extent-fragile, " +
        "because WP3 §3 measured that much residual upward drift between the registered extent 21 " +
        "and the value-converged extent 31 and the drift is one-directional",
      source:
        "WP0c, from the systematics WP3 actually measured rather than a generic error budget. " +
        "The scheme is about CLASS ROBUSTNESS, not error bars on a ratio, because the class is " +
        "the only quantity the comparison consumes — an interval on AR would imply a precision " +
        "the unconverged grid cannot support, and would invite reading a habit boundary off the " +
        "third decimal of a number whose own convergence study says it still moves 10.6%. " +
        "The conservative intersection is the headline because counting agreement twice and " +
        "quoting the friendlier number is the failure mode a dual report invites; where measured " +
        "and extrapolated class disagree the point is reported grid-fragile, excluded from " +
        "neither count but flagged in both. The ±25% σ_0 digitization band " +
        "and the 10.7%/9.0% interpolation error are NOT folded in here — they move the physics " +
        "inputs rather than the measurement, so they are swept explicitly at their edges by WP4 " +
        "and reported as separate runs, never as a widened bar on a single run",
    },
  },
  {
    id: "boundary-ambiguity-band",
    group: "comparison-design",
    status: "registered",
    prose: {
      requirement: "the half-width of the near-boundary band, inside which habit disagreement is not counted",
      value:
        "±1.0 °C around each of −3.3, −9.9 and −21.5 °C — WP1's measured ±0.5 °C reference " +
        "uncertainty plus half the registered 1 °C T-grid spacing. Of the 34 grid temperatures, " +
        "28 count as evidence and 6 are ambiguous (−3, −4, −9, −10, −21, −22), two flanking each " +
        "boundary",
      source:
        "the pre-registered formula phase6AmbiguityHalfWidthC, evaluated at the now-frozen grid " +
        "spacing. The Nakaya figure is a redrawn schematic whose boundaries carry ±0.5 C (WP1), " +
        "so the model cannot be asked to place a flip more precisely than the reference locates " +
        "it. It cuts BOTH ways: agreement inside the band earns nothing either, because a model " +
        "agreeing with the diagram only near boundaries has demonstrated nothing. The evidence " +
        "budget is published here pre-sweep so that 'the disagreeing points happened to be near a " +
        "boundary' cannot be discovered afterwards",
    },
  },
  {
    id: "parameter-table",
    group: "physics-inputs",
    status: "registered",
    prose: {
      requirement: "docs/libbrecht-parameters.md frozen in full",
      value: `docs/libbrecht-parameters.md at sha256 ${PHASE6_PARAMETER_TABLE_SHA256} (LF-normalized)`,
      source:
        "frozen 2026-07-27 by WP0c and enforced by runner/test/phase6-protocol.test.ts, so an " +
        "edit fails the suite rather than silently changing the physics under a completed sweep. " +
        "The four pre-freeze source corrections landed 2026-07-26 while they were still free to " +
        "make. Post-freeze changes need a logged ADR and invalidate every Phase 6 sweep result " +
        "under this protocol — the sweep re-runs in full, which is the cost that stops a " +
        "parameter being adjusted after a disagreeing result is seen",
    },
  },
  {
    id: "parameter-interpolation",
    group: "physics-inputs",
    status: "registered",
    prose: {
      requirement: "the parameter interpolation scheme",
      value:
        "sigma_0: piecewise log-log linear between digitized anchors; A_prism: piecewise linear " +
        "in (Tm−T); A_basal ≡ 1; extrapolation banned outside T ∈ [−50, −1] °C",
      source:
        "core/src/libbrecht.ts (the scheme every run has used); justification measured, not " +
        "asserted — leave-one-out worst error 10.7% basal / 9.0% prism against a ±25% band",
    },
  },
  {
    id: "param-set",
    group: "physics-inputs",
    status: "registered",
    prose: {
      requirement:
        "the parameter set selecting which A_prism the interpolation scheme above actually applies",
      value: "CAK — A_basal ≡ 1, A_prism interpolated through the digitized A_PRISM_CAK anchors",
      source:
        "ADR 0031. Registered because the sweep of 6995868 ran CAK_A1 (A_prism ≡ 1), violating the " +
        "parameter-interpolation row above, via an unregistered --param-set default in " +
        "runner/src/main.ts. CAK is registered on provenance and on conformance to that row, NOT " +
        "on score: 2009.08404v2 p3 Eq. (5) prints A_prism = (0.4+0.04|T*−4|³)/(2.2+0.04|T*−4|³), " +
        "which the digitized anchors reproduce to 8.4% worst and <2% typically, and 2306.04042v1 " +
        "Table 1 p9 prints A1 = 0.25 at −2 °C and 0.2 at −5 °C, matching the dedicated measurement " +
        "papers exactly. CAK_A1's justification is M1's documented simplification, defensible for " +
        "a starter model and not for a run whose protocol registered the opposite. ADR 0031 " +
        "records IN ADVANCE that this is expected to LOWER the headline from 5/90 to about 2/90",
    },
  },
  {
    id: "latent-heating",
    group: "physics-inputs",
    status: "registered",
    prose: {
      requirement:
        "whether the latent-heating correction is applied or carried (charter item 1 covers the " +
        "parameter table; ADR 0005 D4 requires the treatment be fixed before the sweep)",
      value: "carried as a stated systematic; not applied",
      source: "PHASE6_LATENT_HEATING; docs/libbrecht-parameters.md §7",
    },
  },
  {
    id: "pressure",
    group: "physics-inputs",
    status: "registered",
    prose: {
      requirement: "pressure",
      value: "101325 Pa (1 atm), fixed for every sweep point",
      source:
        "every run in this project to date, registered rather than inherited. It is also the " +
        "reference pressure for D_AIR_1ATM, so the diffusivity P^-1 scaling is exact rather " +
        "than extrapolated at this value. Held FIXED because pressure enters both the kinetic " +
        "length X_0 and the latent-heating chi_0 (~1/P), and the sweep varies temperature and " +
        "supersaturation only — a varying pressure would confound the axis under test",
    },
  },
  {
    id: "physical-seed-size",
    group: "physics-inputs",
    status: "registered",
    prose: {
      requirement: "physical seed size",
      value:
        "the canonical 19-site hexagonal seed: seedRadius 2, seedThickness 1 — 0.7 µm radius at " +
        "the registered Δx",
      source:
        "gg-machinery §5; the same seed every gate in this project has used. A seed CLASS change " +
        "(a column seed, per the plan's open ADR-level question) is not available to this " +
        "protocol and would require an ADR and a full re-sweep",
    },
  },
  {
    id: "noise-amplitude",
    group: "physics-inputs",
    status: "registered",
    prose: {
      requirement: "noise amplitude",
      value: "0 — noise off at every sweep point",
      source:
        "WP0. Noise off is what makes the D6h symmetry check enforceable (symErr must be exactly " +
        "0 and every per-tick delta D6h-invariant), and that check is this project's strongest " +
        "evidence that a run did what the operator specified. It also makes each point a single " +
        "deterministic run rather than an ensemble — see seed-ensemble-size",
    },
  },
  {
    id: "far-field",
    group: "boundary-and-domain",
    status: "registered",
    prose: {
      requirement: "the far-field boundary condition (named per charter §2.4 as amended in v1.17)",
      value: PHASE6_FAR_FIELD,
      source:
        "ADR 0024 on the measurement — a fixed-σ Dirichlet shell over-supplies vapor by an amount " +
        "that GROWS with the crystal (~46% at 48³, ~160% at Phase 2b's own configuration), while " +
        "monopole matching turns a measured 4.1% attached-count swing from domain size into 0.0% " +
        "— and ADR 0027 for the authority, which amended charter §2.4 to v1.17. This row " +
        "previously cited '§2.4 — required for every Phase 6 validation run', which was the clause " +
        "MANDATING fixed-σ Dirichlet: it named the rule that forbade this condition as the " +
        "authority for registering it. §2.4 now fixes the obligation (name it, freeze it, never " +
        "compare across conditions silently) and leaves the choice to the per-sweep protocol",
    },
  },
  {
    id: "domain-budgets",
    group: "boundary-and-domain",
    status: "registered",
    prose: {
      requirement: "domain budgets",
      value: "48 x 48 x 48, hexPrism active domain — a 16.8 µm box at the registered Δx",
      source:
        "WP3 §1.2, measured AT the registered measurement extent rather than at a convenient " +
        "smaller one. Ten points, N = 40…80: warm is bit-identical at all five domains and cold " +
        "converges exactly by N = 64 (5185 -> 5161 -> 5161 -> 5159 -> 5159), so N = 48 carries a " +
        "+0.04% attached-count residual against the asymptote — 200x smaller than the +8.7% " +
        "volume residual already accepted at the registered fill-CFL, and AR is identical at all " +
        "five domains so it cannot move a habit class. N = 64 is the exact answer and costs ~3x " +
        "more per point. It generalises across habits by construction, because the stopping " +
        "criterion bounds the crystal in every direction (see habit-measurement-size). It does " +
        "NOT generalise across growth RATE: Eq. 5.30's correction scales with dV/dt, so the " +
        "sweep's fastest-growing point must be spot-checked against N = 64 rather than assumed " +
        "covered — and that spot-check now has a PASS CRITERION (PHASE6_DOMAIN_SPOT_CHECK): " +
        "identical habit class at N = 48 and N = 64 AND attached counts within 0.5%, that 0.5% " +
        "being the residual measured at N = 40, one ladder step below the registered domain. On " +
        "failure the domain rises to N = 64 for the ENTIRE grid, because a per-point domain would " +
        "make points incomparable. WP3 §1.3 also disproved ADR 0024's ratio-based validity limit, " +
        "so this number may not be extrapolated to any other configuration — it must be " +
        "re-measured if Δx, the measurement extent, or the far field changes",
    },
  },
  {
    id: "dx",
    group: "boundary-and-domain",
    status: "registered",
    prose: {
      requirement: "Δx",
      value: "0.35 µm",
      source:
        "WP0c, by a COST rule fixed in advance: the finest spacing whose full registered grid " +
        "fits an overnight-scale wall-clock budget on the registered host. Deciding it on cost " +
        "rather than on outcome is the point — a spacing chosen because of the habits it " +
        "produced would be tuning, so the choice was made and recorded BEFORE any habit result " +
        "existed at the finer spacing. Measured: at the registered configuration eight " +
        "temperatures cost 748–2424 s each and 40 min wall across seven cores; the same eight at " +
        "Δx = 0.2333 µm (72³, extent 32, identical physical box and measurement size) ran 153 " +
        "minutes without completing even the cheapest point, so the finer grid costs at least 12x " +
        "per point. That puts one 34-temperature row at the finer spacing near 28 h — plus a " +
        "fresh domain ladder, because WP3 §1.3 disproved the rule that would have let the " +
        "existing one transfer — against about 14 h for the entire six-row grid at 0.35 µm. " +
        "This is NOT a converged value and is not registered as one: WP3 §4 found Δx is the one " +
        "axis that does not converge, 0.7 µm flips the cold habit class outright, and 0.35 µm " +
        "still moves AR +10.6% cold and +18% warm going finer. The bias is therefore CARRIED on " +
        "every reported point under the uncertainty-reporting scheme, and points whose class " +
        "would change under extrapolation are flagged individually",
    },
  },
  {
    id: "surface-policy",
    group: "surface-operator",
    status: "registered",
    prose: {
      requirement: "the named surface policy",
      value: PHASE6_SURFACE_POLICY,
      source: "ADR 0009, amended by ADR 0023 (D6h-equivariant opposing-vapor mean)",
    },
  },
  {
    id: "fill-cfl",
    group: "numerics",
    status: "registered",
    prose: {
      requirement: "the fill-CFL bound",
      value: "0.1",
      source:
        "WP3 §2, four timesteps spanning 8x. AR is IDENTICAL at every one of them at both " +
        "temperatures, so the registered habit criterion is insensitive to this choice across " +
        "the whole range tested. The attached count is not: cold runs 1697 -> 1505 -> 1649 -> " +
        "1649, settling only at cfl <= 0.05, so 0.1 sits 8.7% off the converged volume. " +
        "REGISTERED CONSEQUENCE: 0.1 is adequate for a habit-class sweep and is NOT adequate " +
        "for any reported volume-like quantity, which must be labelled not-converged at this " +
        "setting rather than quietly inheriting the number",
    },
  },
  {
    id: "residual-tolerance",
    group: "numerics",
    status: "registered",
    prose: {
      requirement: "the diffusion residual tolerance and its norm",
      value:
        "1e-9, on the RELATIVE MAX-NORM OF THE SUCCESSIVE-ITERATE CHANGE: " +
        "max|sigma_new - sigma_old| over the sweep, divided by sigma_infinity",
      source:
        "the value every LK run in this project has used, with its norm now stated exactly " +
        "because the charter asks for the norm and the distinction is load-bearing. This is an " +
        "iterate-CHANGE criterion, not a PDE residual: on a slowly-converging relaxation the " +
        "change can be small while the true error is not, so alone it would be optimistic. That " +
        "is precisely why ADR 0006 pairs it with the divergence identity below, which is an " +
        "independent global conservation check rather than another look at the same iteration",
    },
  },
  {
    id: "div-tol",
    group: "numerics",
    status: "registered",
    prose: {
      requirement: "the divergence-identity tolerance",
      value:
        "1e-7, RELATIVE: |injection + smoother drift - surface exchange| / |surface exchange|",
      source:
        "ADR 0006 dual convergence, with ADR 0013/0014's metered float64 smoother-drift term in " +
        "the numerator. Relative, not absolute — an earlier description of it as absolute was " +
        "corrected in WP0c. Both engines compute the same form, which is why the float32 " +
        "diagnostic lane cannot satisfy it: 1e-7 is below one float32 epsilon (1.19e-7)",
    },
  },
  {
    id: "relax-max-sweeps",
    group: "numerics",
    status: "registered",
    prose: {
      requirement: "the relaxation-sweep cap",
      value: "200000",
      source:
        "ADR 0006. It is a REFUSAL BOUND, not a convergence setting: a run that reaches it has " +
        "not converged and fails closed rather than publishing a partially-relaxed field. Every " +
        "one of WP3's 38 convergence points and all 8 WP0c cost points converged well inside it",
    },
  },
  {
    id: "float-precision",
    group: "numerics",
    status: "registered",
    prose: {
      requirement: "float precision",
      value:
        "float64 CPU oracle produces the sweep evidence; the float32 GPU port is a labelled " +
        "diagnostic cross-check only, at a relaxed divergence tolerance, never a gate criterion",
      source:
        "operator decision 2026-07-26, revised the same day on measurement. The first decision " +
        "registered the GPU on the premise that it was equal-quality and faster; a calibration " +
        "probe measured neither. Slower: 32.9 s against the oracle's ~5 s at 28^3, because the " +
        "CPU converges warm-started steps in one relaxation sweep while the GPU cannot submit " +
        "fewer than a 16-sweep segment plus a queue sync. Not equal-quality: divTol is RELATIVE " +
        "(|injection + drift - exchange| / |exchange|, both engines), and the frozen 1e-7 sits " +
        "below ONE float32 epsilon (1.19e-7) of the arithmetic asked to meet it, so sustained " +
        "runs refuse at a bit-stationary fixed point (residual exactly 0, both ULP distances 0, " +
        "divergence residual 1.0-1.6e-7 on a ~0.596 operand). Phase 5 certified this path for " +
        "four interface steps at 24x24x18 only. Reinstating the GPU as primary would require an " +
        "ADR replacing it with a bound scaled to the arithmetic's own epsilon (the shape 0014 uses for " +
        "smoother drift). Sweeps also parallelise across 16 CPU cores while the Phase 5 protocol " +
        "permits one process per physical adapter",
    },
  },
  {
    id: "seed-ensemble-size",
    group: "statistics",
    status: "registered",
    prose: {
      requirement: "seed-ensemble size",
      value: "1 — a single deterministic run per grid point",
      source:
        "follows from noise-amplitude = 0. The RNG is consumed only by the alphaHK slowdown " +
        "noise, so with noise off a grid point has no stochasticity to average over and repeated " +
        "runs are bit-identical by construction — which the project already demonstrates, since " +
        "gate2b requires bit-identical checkpoints across separate processes. An ensemble of " +
        "N > 1 here would report a spread of exactly zero and would misrepresent a deterministic " +
        "result as a sampled one. The uncertainty that DOES exist at each point is systematic " +
        "(grid, measurement extent, digitization band) and is carried by the uncertainty-" +
        "reporting scheme instead, which is where it belongs",
    },
  },
  {
    id: "code-version",
    group: "provenance",
    status: "registered",
    prose: {
      requirement: "the model/code version (commit hash)",
      value: PHASE6_PROTOCOL_FREEZE_COMMIT,
      source:
        "the commit in which every substantive protocol value became final. It is named from the " +
        "commit that FOLLOWS it, because a commit cannot contain its own hash; that following " +
        "commit adds no protocol content, so the hash recorded here is genuinely the one the " +
        "protocol froze in. Verified by phase6ProtocolProvenance(): it must be an ancestor of " +
        "every execution commit, and the tree must be tracked-clean when evidence is produced",
    },
  },
];

/** Every freeze-list item that still has no registered value. */
export function phase6PendingFreezeItems(
  items: readonly Phase6FreezeItem[] = PHASE6_FREEZE_LIST,
): readonly Phase6FreezeItem[] {
  return items.filter((item) => item.status === "pending");
}

/** True only when every charter-required item carries a registered value. */
export function phase6FreezeComplete(items: readonly Phase6FreezeItem[] = PHASE6_FREEZE_LIST): boolean {
  return phase6PendingFreezeItems(items).length === 0;
}

/**
 * The frozen protocol manifest. Refuses to exist while any required item is pending, so a
 * sweep cannot quote a protocol hash the freeze has not actually earned.
 */
export function phase6ProtocolManifest(
  items: readonly Phase6FreezeItem[] = PHASE6_FREEZE_LIST,
): Record<string, unknown> {
  const pending = phase6PendingFreezeItems(items);
  if (pending.length > 0) {
    throw new Error(
      `Phase 6 protocol is not frozen: ${pending.length} freeze-list item(s) pending — ` +
        `${pending.map((item) => item.id).join(", ")}`,
    );
  }
  return {
    interpolation: PHASE6_INTERPOLATION,
    // ADR 0031. Hashed for the same reason the scoring rule is: the interpolation row above is
    // inert unless the parameter set that selects it is pinned too, and the sweep of 6995868
    // proved a CLI default can override a registered row without moving any hash.
    paramSet: PHASE6_PARAM_SET,
    latentHeating: PHASE6_LATENT_HEATING,
    farField: PHASE6_FAR_FIELD,
    surfacePolicy: PHASE6_SURFACE_POLICY,
    freezeCommit: PHASE6_PROTOCOL_FREEZE_COMMIT,
    parameterTableSha256: PHASE6_PARAMETER_TABLE_SHA256,
    // The grid axes go in by VALUE, not by point count. A manifest hash that moved only when a
    // count changed would not notice a temperature or a fraction being swapped for another.
    temperatureGrid: phase6TemperatureGrid(),
    sigmaFractions: PHASE6_SIGMA_FRACTIONS,
    sigmaWaterAnchors: PHASE6_SIGMA_WATER_ANCHORS,
    nakayaBoundariesC: PHASE6_NAKAYA_BOUNDARIES_C,
    ambiguityHalfWidthC: PHASE6_AMBIGUITY_HALF_WIDTH_C,
    // ADR 0025. These MUST be hashed: the accepted-class matrix is the scoring rule, and a
    // protocol hash that did not move when it changed would be pinning the grid while leaving
    // the thing that turns runs into a verdict free to be edited.
    referenceRegimes: PHASE6_REFERENCE_REGIMES,
    headlineScopeC: PHASE6_HEADLINE_SCOPE_C,
    extrapolationOrderWindow: PHASE6_EXTRAPOLATION_ORDER_WINDOW,
    extentDriftBoundAR: PHASE6_EXTENT_DRIFT_BOUND_AR,
    domainSpotCheck: PHASE6_DOMAIN_SPOT_CHECK,
    engineControl: PHASE6_ENGINE_CONTROL,
    // ADR 0033: FLATTENED back to the pre-split shape on purpose. out/phase6-sweep/report.json
    // records this hash as the protocol that produced it, so a refactor that changed it would make
    // existing evidence unverifiable — the exact harm ADR 0033 exists to prevent, inflicted by the
    // fix. Pinned to 8aeb2b80… by test.
    freezeList: items.map((item) => ({
      id: item.id,
      group: item.group,
      status: item.status,
      requirement: item.prose.requirement,
      value: item.prose.value,
      source: item.prose.source,
    })),
  };
}

/**
 * ADR 0033 — the VALUES manifest. Everything an evidence-producing path reads: the eighteen typed
 * constants the solver and scorer consume, plus each freeze row's structural fields. This is the
 * hash `phase6SweepPreflight` GATES on, and the one whose edit costs a re-sweep.
 */
export function phase6ValuesManifest(
  items: readonly Phase6FreezeItem[] = PHASE6_FREEZE_LIST,
): Record<string, unknown> {
  const pending = phase6PendingFreezeItems(items);
  if (pending.length > 0) {
    throw new Error(
      `Phase 6 protocol is not frozen: ${pending.length} freeze-list item(s) pending — ` +
        `${pending.map((item) => item.id).join(", ")}`,
    );
  }
  return {
    interpolation: PHASE6_INTERPOLATION,
    paramSet: PHASE6_PARAM_SET,
    latentHeating: PHASE6_LATENT_HEATING,
    farField: PHASE6_FAR_FIELD,
    surfacePolicy: PHASE6_SURFACE_POLICY,
    freezeCommit: PHASE6_PROTOCOL_FREEZE_COMMIT,
    parameterTableSha256: PHASE6_PARAMETER_TABLE_SHA256,
    temperatureGrid: phase6TemperatureGrid(),
    sigmaFractions: PHASE6_SIGMA_FRACTIONS,
    sigmaWaterAnchors: PHASE6_SIGMA_WATER_ANCHORS,
    nakayaBoundariesC: PHASE6_NAKAYA_BOUNDARIES_C,
    ambiguityHalfWidthC: PHASE6_AMBIGUITY_HALF_WIDTH_C,
    referenceRegimes: PHASE6_REFERENCE_REGIMES,
    headlineScopeC: PHASE6_HEADLINE_SCOPE_C,
    extrapolationOrderWindow: PHASE6_EXTRAPOLATION_ORDER_WINDOW,
    extentDriftBoundAR: PHASE6_EXTENT_DRIFT_BOUND_AR,
    domainSpotCheck: PHASE6_DOMAIN_SPOT_CHECK,
    engineControl: PHASE6_ENGINE_CONTROL,
    freezeRows: items.map((item) => ({ id: item.id, group: item.group, status: item.status })),
  };
}

/**
 * ADR 0033 — the JUSTIFICATION manifest. Every freeze row's prose, and nothing else. Preflight
 * REPORTS this hash and does not gate on it: correcting a wrong justification is ADR-logged but
 * costs no re-sweep, because no evidence-producing path reads anything here. That claim is
 * established by the mutation test in runner/test/phase6-protocol.test.ts, not by assertion.
 */
export function phase6JustificationManifest(
  items: readonly Phase6FreezeItem[] = PHASE6_FREEZE_LIST,
): Record<string, unknown> {
  return {
    prose: items.map((item) => ({ id: item.id, ...item.prose })),
  };
}

/**
 * The frozen protocol's content hash — `canonicalJsonSha256(phase6ProtocolManifest())`, the same
 * construction `PHASE5_PROTOCOL_SHA256` uses.
 *
 * Deliberately NOT part of the manifest it describes, which would be self-referential. Pinned in
 * `runner/test/phase6-protocol.test.ts`, so changing any registered value — a temperature, a
 * fraction, a tolerance, a justification string — fails there rather than silently producing
 * sweep evidence under a protocol nobody agreed to.
 */
export const PHASE6_PROTOCOL_SHA256 =
  "2b94aa5fa35b633dfb76275fca411cbbc25191c93ec2921a7506522b0ccf38e5";

/**
 * ADR 0034 — the combined hash AT THE COMMIT THE ARM-1 EVIDENCE CITES.
 *
 * `out/phase6-sweep/report.json` and `research/phase6-sweep-report.md` both record
 * `8aeb2b80…`, and it is reproducible by checking out `390fe35` and computing
 * `canonicalJsonSha256(phase6ProtocolManifest())` there. It is NOT reproducible at HEAD, and
 * cannot be: the combined manifest contains prose by construction, so the first ADR-logged
 * justification correction necessarily moves it.
 *
 * ADR 0033 claimed the legacy hash would be "preserved, not retired". That was over-strong —
 * true only until the first prose fix, which ADR 0034 then made. Corrected here: the combined
 * hash is HISTORICAL, verified against the commit the evidence names rather than against HEAD,
 * and `PHASE6_VALUES_SHA256` is the hash that must hold across prose corrections. It does.
 */
export const PHASE6_PROTOCOL_SHA256_AT_ARM1_EVIDENCE =
  "8aeb2b80a5d85357bca1ddbf7301e63ea7b53e714e4bc5ce290ac22e1b16698e";

/**
 * Protocol revisions, newest last. The freeze is AMENDED through ADRs, never edited in place,
 * and every amendment before the first sweep is free — after it, the same change costs a full
 * re-sweep.
 *
 * - `9e49c2a8…` — WP0c initial freeze at commit e2f1bfc (21 rows).
 * - `0050040e…` — ADR 0025 adds the agreement-scoring rule (23 rows). Registered pre-sweep after
 *   the 2026-07-27 independent review found the class-to-regime mapping unregistered.
 */
/**
 * ADR 0033 — the VALUES hash. This is what `phase6SweepPreflight` GATES on, and the one whose edit
 * invalidates prior sweep results under the amended charter §3.2 Phase 6 item 1.
 */
export const PHASE6_VALUES_SHA256 =
  "879e069f612f1c6b4b40074d5cc890419fc17f09545dc27b2c8823d7667938f6";

/**
 * ADR 0033 — the JUSTIFICATION hash. Reported, never gated. A prose correction moves this and
 * nothing else, so it is ADR-logged but costs no re-sweep.
 */
export const PHASE6_JUSTIFICATION_SHA256 =
  "040b1a44505fdba1767311927be5dad56b622ca9ee2c6bc4e4ab73e77f83c332";

/**
 * The arm-1 published artifacts, by byte length and sha256 (pin-register recommendation 1).
 *
 * These were printed in `research/phase6-sweep-report.md` and by the verifier, and ASSERTED against
 * nothing — which is what let the pin register substitute the superseded CAK_A1 arm for the CAK arm,
 * duplicate rows, delete disagreements and forge report.json's aggregates, all while the verifier
 * printed "VERIFIED ... exit 0". Moving the table out of markdown and into code is the difference
 * between publishing a digest and checking one.
 *
 * These pin the arm-1 artifact specifically. A future sweep produces different bytes (rows now carry
 * `config`), and its digests are registered here alongside rather than replacing these.
 */
export const PHASE6_ARM1_ARTIFACT_DIGESTS = [
  { path: "points.json", byteLength: 129_760, sha256: "0ed613bce61e44829f722e069a818e0da4981ecd34829b0b49eaba15e11cf89a" },
  { path: "report.json", byteLength: 928, sha256: "71ae094c38778b0d2c62f3952e4ca641c0bc8f5d91b350248c5c78800830f2a9" },
  { path: "diagram.svg", byteLength: 31_193, sha256: "40458703061af5b54d6629484aa84762fb995a15f5443904c3462d2ff5939234" },
] as const;

/**
 * The registered domain-contact guard fraction. Previously reachable only through
 * PHASE6_DOMAIN_CONTACT_FRACTION in the sweep module; the verifier trusted the published boolean
 * instead of recomputing it, which let 87 headline disagreements be marked excluded and the headline
 * read 3 of 3.
 */
export const PHASE6_DOMAIN_CONTACT_GUARD_FRACTION = 0.65;

/** The registered sweep domain N, so a verifier can recompute the contact guard from geometry. */
export const PHASE6_SWEEP_DOMAIN_N = 48;

/**
 * Sites in a solid centred hexagonal disc of radius `r`, `thickness` layers deep — the closed form
 * for both the seed and the hexPrism domain: `(3r² + 3r + 1) · layers`.
 *
 * DERIVED, not registered. Nothing here is a new degree of freedom: every input is already a freeze
 * row or a fixture field, and this function only states the arithmetic consequence. That is why
 * ADR 0035 moves no hash — see its "Charter impact".
 */
export function phase6HexPrismSites(r: number, thickness: number): number {
  return (3 * r * r + 3 * r + 1) * thickness;
}

/**
 * What a correctly-configured child must print for `active=` and `seedSites=` — the two tokens that
 * pin the run inputs NO flag and NO hash can otherwise reach (pin-register recommendation 2).
 *
 * `active` pins `domain` and `dims` together: `main.ts` hard-codes `domain: "hexPrism"` at the
 * sweep's own solver construction, so the fixture's `domain` field is never read and mutating that
 * line to `"box"` moved no hash and failed no test. A box at 48³ has 110 592 active cells against
 * this hexPrism's 77 879 — the difference is 29%, printed on every run, and previously read by
 * nothing.
 *
 * `seedSites` pins `seedRadius` and `seedThickness`, neither of which has a CLI flag at all. The
 * pin register measured `seedThickness` 1 → 3 taking seedSites 19 → 57 and the seed's aspect ratio
 * 0.2 → 0.6, with every hash and all 100 tests still green. 19 · 3 = 57 is exactly what the closed
 * form above gives, which is why these are checked arithmetically rather than pinned as literals.
 */
export function phase6ExpectedRunGeometry(dimsN: number, seedRadius: number, seedThickness: number): {
  readonly hexRadius: number;
  readonly zHalfExtent: number;
  readonly activeCells: number;
  readonly seedSites: number;
} {
  // The solver's own convention: a hexPrism inscribed in an N³ box keeps a one-cell margin, so the
  // hex radius and the z half-extent are both (N/2) − 1. Checked against a real child header in
  // runner/test/phase6-sweep.test.ts rather than asserted here.
  const hexRadius = Math.floor(dimsN / 2) - 1;
  const zHalfExtent = hexRadius;
  return {
    hexRadius,
    zHalfExtent,
    activeCells: phase6HexPrismSites(hexRadius, 2 * zHalfExtent + 1),
    seedSites: phase6HexPrismSites(seedRadius, seedThickness),
  };
}

/**
 * The only stop reason under which a run's aspect ratio is a measurement of habit.
 *
 * The pin register's highest-harm finding: at `--steps 5` the child prints
 * `stop reason=step-cap … extent=5 AR=0.200000 symErr=0 deltaSymClean=true allConverged=true`, and
 * the harness scored that plate / **AGREE** / headline at −2 °C. The same point run to completion is
 * neutral / **disagree**. `steps` is registered nowhere, so mutating its default moved no hash and
 * passed every test — a whole fabricated diagram, 204 rows, in about a minute of compute.
 *
 * Reproduced directly on 2026-07-29 at the registered configuration; see ADR 0035.
 */
export const PHASE6_REQUIRED_STOP_REASON = "size-target";

/** Values-hash revisions, newest last. A freeze with a silently-replaced constant is not a freeze. */
export const PHASE6_VALUES_REVISIONS = [
  { sha256: "879e069f612f1c6b4b40074d5cc890419fc17f09545dc27b2c8823d7667938f6", note: "ADR 0033 initial split; values side of the 8aeb2b80 combined manifest, unchanged in content" },
] as const;

/** Justification-hash revisions, newest last. Prose corrections land here and cost no re-sweep. */
export const PHASE6_JUSTIFICATION_REVISIONS = [
  { sha256: "8b73b5f8dc8b7747fc47b3d071c31023bbee30af389ee7bcf67820e3daea93bc", note: "ADR 0033 initial split; carried erratum E1's wrong contrast-collapse justification" },
  { sha256: "040b1a44505fdba1767311927be5dad56b622ca9ee2c6bc4e4ab73e77f83c332", note: "ADR 0034 corrects E1: the compression claim was CAK_A1 and reverses under CAK; replaced with the droplet-nucleation ground" },
] as const;

export const PHASE6_PROTOCOL_REVISIONS = [
  { sha256: "9e49c2a8a811e9d62d383730878d125bad50c5e86b71a95d1aff64277e434547", note: "WP0c initial freeze" },
  { sha256: "0050040e961c0e08cbfb2f7fc035ded860308552630bf51240db2df4222c89ca", note: "ADR 0025 agreement-scoring rule" },
  { sha256: "a9f0ad210e4dc3f700270c7fd840384eb04b9bcc9d76a9907f269dccb06ebb07", note: "ADR 0026 grid-extrapolation operator; conservative-intersection headline" },
  { sha256: "f5350b85feb0ecefd5efc5bbe2cfc3ccaad3059c4c85c97e724adfe987485615", note: "ADR 0027 far-field row cites the amended charter v1.17, not the clause it replaced" },
  { sha256: "df799560df21a12d3ec184942eee65f4b34f50c897f7ad73f259f572ebc8e6f0", note: "ADR 0028 parameter-table erratum; the manifest carries the table hash, so this hash moves with it" },
  { sha256: "9aa2e7c148aad117ba9ab7313bb36c55d4de3fccc3fbda4c2e43cc2af4974983", note: "section-B systematics: extent-drift bound and the domain spot-check pass criterion" },
  // THE FIRST AMENDMENT THAT IS NOT FREE. Every revision above was registered before any sweep
  // ran, so each cost nothing. This one invalidates the 204-point sweep of 6995868 and re-runs it,
  // which is what §3.2 Phase 6 item 1 prices and is the reason the clause exists.
  { sha256: "8aeb2b80a5d85357bca1ddbf7301e63ea7b53e714e4bc5ce290ac22e1b16698e", note: "ADR 0031 registers paramSet = CAK as a freeze row (25 rows); the sweep of 6995868 ran CAK_A1 in violation of the parameter-interpolation row and is invalidated. THE ARM-1 EVIDENCE CITES THIS VALUE — reproducible at commit 390fe35" },
  // ADR 0034. Moved by a JUSTIFICATION correction only: PHASE6_VALUES_SHA256 is unchanged, so
  // under the amended charter §3.2 this invalidates nothing and costs no re-sweep. This is the
  // first entry in this list that did not.
  { sha256: "2b94aa5fa35b633dfb76275fca411cbbc25191c93ec2921a7506522b0ccf38e5", note: "ADR 0034 corrects the t-sigma-grid contrast-collapse justification (erratum E1); values hash unchanged, no re-sweep" },
] as const;

/**
 * Recompute the registered leave-one-out interpolation error from the LIVE solver, so the
 * number registered above cannot drift away from the code it describes. Returns the worst
 * relative error per facet.
 */
export function phase6MeasureInterpolationError(): { basal: number; prism: number } {
  const xs = [...PHASE6_SIGMA0_ANCHORS_X];
  const worst = { basal: 0, prism: 0 };
  for (const [facet, at] of [
    ["basal", sigma0Basal],
    ["prism", sigma0Prism],
  ] as const) {
    for (let i = 1; i < xs.length - 1; i++) {
      const [left, middle, right] = [xs[i - 1] as number, xs[i] as number, xs[i + 1] as number];
      const t =
        (Math.log(middle) - Math.log(left)) / (Math.log(right) - Math.log(left));
      const rebuilt = Math.exp(
        Math.log(at(-left)) + t * (Math.log(at(-right)) - Math.log(at(-left))),
      );
      const relative = Math.abs(rebuilt / at(-middle) - 1);
      if (relative > worst[facet]) worst[facet] = relative;
    }
  }
  return worst;
}
