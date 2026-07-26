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

/** Charter §2.4: required for every Phase 6 validation run. */
export const PHASE6_FAR_FIELD = "fixed-sigma-dirichlet";
/** ADR 0009: the coupled policy the forward LK operator runs. */
export const PHASE6_SURFACE_POLICY = "aggregate-hv-g1h1-v4";

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
    requirement: "the far-field boundary condition (fixed-σ Dirichlet, per §2.4)",
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
    source: "ADR 0009",
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
    status: "pending",
    requirement: "float precision",
    value: null,
    source:
      "WP0; the float64 CPU oracle and the Phase 5 float32 GPU port are both available, and " +
      "which one produces sweep evidence is a registered choice, not an implementation detail",
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
