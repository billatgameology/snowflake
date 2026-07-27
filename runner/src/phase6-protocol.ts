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

import { sigma0Basal, sigma0Prism } from "../../core/src/index.ts";

/** Status of one freeze-list item. A protocol freezes only when nothing is `pending`. */
export type Phase6FreezeStatus = "registered" | "pending";

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
  /** What the charter/ADR requires, in its own terms. */
  readonly requirement: string;
  /** The registered value, or null while pending. */
  readonly value: string | null;
  /** Where the value comes from, or what must produce it. */
  readonly source: string;
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
// that certificate here would extend a measurement past where it was made. The sweep therefore
// runs on the GPU (which is what makes hundreds of runs affordable at all) and carries its own
// differential control: registered grid points re-run on the CPU oracle and must agree on the
// habit classification, which is the only quantity the comparison actually consumes.
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

// ── The freeze list ─────────────────────────────────────────────────────────────────────────

export const PHASE6_FREEZE_LIST: readonly Phase6FreezeItem[] = [
  {
    id: "t-sigma-grid",
    group: "comparison-design",
    status: "pending",
    requirement: "the T/σ grid",
    value: null,
    source:
      "WP0 calibration probes; constrained by the interpolation domain (T ∈ [−50, −1] °C, " +
      "extrapolation banned) and by open question 6 (σ∞ regime placement)",
  },
  {
    id: "habit-measurement-size",
    group: "comparison-design",
    status: "pending",
    requirement:
      "the crystal size at which habit is measured — habit is size-dependent, so a stated " +
      "maximum dimension is what keeps comparisons apples-to-apples",
    value: null,
    source: "WP0 calibration probes",
  },
  {
    id: "metric-thresholds",
    group: "comparison-design",
    status: "pending",
    requirement: "metric thresholds",
    value: null,
    source:
      "WP0; the Phase 2b/4 habit criterion (plate ≤ 1/1.5, column ≥ 1.5, else neutral) is the " +
      "candidate and is registered explicitly rather than inherited silently",
  },
  {
    id: "uncertainty-reporting",
    group: "comparison-design",
    status: "pending",
    requirement: "the uncertainty-reporting scheme",
    value: null,
    source: "WP0; must cover the ±25% digitization band and the interpolation error above",
  },
  {
    id: "boundary-ambiguity-band",
    group: "comparison-design",
    status: "pending",
    requirement: "the half-width of the near-boundary band, inside which habit disagreement is not counted",
    value: null,
    source:
      "WP0c, by the formula PHASE6_AMBIGUITY_HALF_WIDTH_C once the T grid is frozen. The Nakaya " +
      "figure is a redrawn schematic whose boundaries carry ±0.5 C (WP1), so the model cannot be " +
      "asked to place a flip more precisely than the reference locates it. MUST be fixed before " +
      "any sweep runs: applied afterwards the same rule is post-hoc rationalisation",
  },
  {
    id: "parameter-table",
    group: "physics-inputs",
    status: "pending",
    requirement: "docs/libbrecht-parameters.md frozen in full",
    value: null,
    source: "WP0 freezes the file; pre-freeze source corrections landed 2026-07-26",
  },
  {
    id: "parameter-interpolation",
    group: "physics-inputs",
    status: "registered",
    requirement: "the parameter interpolation scheme",
    value:
      "sigma_0: piecewise log-log linear between digitized anchors; A_prism: piecewise linear " +
      "in (Tm−T); A_basal ≡ 1; extrapolation banned outside T ∈ [−50, −1] °C",
    source:
      "core/src/libbrecht.ts (the scheme every run has used); justification measured, not " +
      "asserted — leave-one-out worst error 10.7% basal / 9.0% prism against a ±25% band",
  },
  {
    id: "latent-heating",
    group: "physics-inputs",
    status: "registered",
    requirement:
      "whether the latent-heating correction is applied or carried (charter item 1 covers the " +
      "parameter table; ADR 0005 D4 requires the treatment be fixed before the sweep)",
    value: "carried as a stated systematic; not applied",
    source: "PHASE6_LATENT_HEATING; docs/libbrecht-parameters.md §7",
  },
  { id: "pressure", group: "physics-inputs", status: "pending", requirement: "pressure", value: null, source: "WP0" },
  {
    id: "physical-seed-size",
    group: "physics-inputs",
    status: "pending",
    requirement: "physical seed size",
    value: null,
    source: "WP0; the canonical 19-site seed is pinned, and a seed class change is ADR-level",
  },
  {
    id: "noise-amplitude",
    group: "physics-inputs",
    status: "pending",
    requirement: "noise amplitude",
    value: null,
    source: "WP0",
  },
  {
    id: "far-field",
    group: "boundary-and-domain",
    status: "registered",
    requirement: "the far-field boundary condition (monopole-matched, per §2.4 and ADR 0024)",
    value: PHASE6_FAR_FIELD,
    source: "charter §2.4 — required for every Phase 6 validation run",
  },
  {
    id: "domain-budgets",
    group: "boundary-and-domain",
    status: "pending",
    requirement: "domain budgets",
    value: null,
    source:
      "WP0; sweeps cross habit flips by design, so domains may not be pre-shaped to an unknown " +
      "morphology (ADR 0001)",
  },
  { id: "dx", group: "boundary-and-domain", status: "pending", requirement: "Δx", value: null, source: "WP0" },
  {
    id: "surface-policy",
    group: "surface-operator",
    status: "registered",
    requirement: "the named surface policy",
    value: PHASE6_SURFACE_POLICY,
    source: "ADR 0009, amended by ADR 0023 (D6h-equivariant opposing-vapor mean)",
  },
  { id: "fill-cfl", group: "numerics", status: "pending", requirement: "the fill-CFL bound", value: null, source: "WP0" },
  {
    id: "residual-tolerance",
    group: "numerics",
    status: "pending",
    requirement: "the diffusion residual tolerance and its norm",
    value: null,
    source: "WP0",
  },
  {
    id: "div-tol",
    group: "numerics",
    status: "pending",
    requirement: "the divergence-identity tolerance",
    value: null,
    source: "ADR 0006 — dual convergence",
  },
  {
    id: "relax-max-sweeps",
    group: "numerics",
    status: "pending",
    requirement: "the relaxation-sweep cap",
    value: null,
    source: "ADR 0006",
  },
  {
    id: "float-precision",
    group: "numerics",
    status: "registered",
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
  {
    id: "seed-ensemble-size",
    group: "statistics",
    status: "pending",
    requirement: "seed-ensemble size",
    value: null,
    source: "WP0",
  },
  {
    id: "code-version",
    group: "provenance",
    status: "pending",
    requirement: "the model/code version (commit hash)",
    value: null,
    source: "the freeze commit itself; recorded when the protocol freezes",
  },
];

/** Every freeze-list item that still has no registered value. */
export function phase6PendingFreezeItems(): readonly Phase6FreezeItem[] {
  return PHASE6_FREEZE_LIST.filter((item) => item.status === "pending");
}

/** True only when every charter-required item carries a registered value. */
export function phase6FreezeComplete(): boolean {
  return phase6PendingFreezeItems().length === 0;
}

/**
 * The frozen protocol manifest. Refuses to exist while any required item is pending, so a
 * sweep cannot quote a protocol hash the freeze has not actually earned.
 */
export function phase6ProtocolManifest(): Record<string, unknown> {
  const pending = phase6PendingFreezeItems();
  if (pending.length > 0) {
    throw new Error(
      `Phase 6 protocol is not frozen: ${pending.length} freeze-list item(s) pending — ` +
        `${pending.map((item) => item.id).join(", ")}`,
    );
  }
  return {
    interpolation: PHASE6_INTERPOLATION,
    latentHeating: PHASE6_LATENT_HEATING,
    farField: PHASE6_FAR_FIELD,
    surfacePolicy: PHASE6_SURFACE_POLICY,
    freezeList: PHASE6_FREEZE_LIST,
  };
}

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
