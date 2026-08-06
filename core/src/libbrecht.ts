// Libbrecht attachment-kinetics parameters (Phase 2b).
//
// Every adopted source quantity and project-derived mapping here is traced in
// docs/libbrecht-parameters.md — this file implements that table and MUST NOT acquire values or
// closures the table does not carry. The solver computes the
// closed forms; the digitized anchors are for interpolation (sigma0/A, figure-only in the
// monograph/1910 source pair audited at extraction; later same-lineage papers print related
// closed forms, as recorded in research/libbrecht-later-papers.md) and for validation tests
// (v_kin/X_0 vs monograph Table 2.1).
//
// Units: SI internally (m, s, kg, Pa, K); temperatures in this API are degrees Celsius
// (the sources' working unit); supersaturations are dimensionless FRACTIONS (the table's
// canonical-units rule — the sources' plots quote percent; conversion happened at extraction).

/** Exact SI defining constant: BIPM SI Brochure, 9th ed. v4.01, §2.2/Table 1.
    The decimal definition is exact; JavaScript stores its nearest binary64 value. */
export const K_BOLTZMANN = 1.380649e-23; // J/K
/** Exact Celsius/kelvin offset: BIPM SI Brochure, 9th ed. v4.01, §2.3.1. */
export const CELSIUS_ZERO_K = 273.15; // K
/** Water molecule mass (monograph Appendix A, printed p. 501 / pdf 502). */
export const M_MOL = 3.0e-26; // kg
/** Ice number density (monograph Appendix A, printed p. 500 / pdf 501). */
export const C_ICE = 3.1e28; // 1/m^3
/** Water-vapor diffusivity in air (monograph Appendix A); D ~ P^-1 (printed p. 65 / pdf 66).
    NO temperature law exists in the source (documented gap) — constant at fixed pressure. */
export const D_AIR_1ATM = 2.0e-5; // m^2/s
/** Exact standard-atmosphere definition: 10th CGPM (1954), Resolution 4.
    Using it as the reference pressure for the source's approximate D_AIR value is the separate
    P2 project-derived closure documented in docs/libbrecht-parameters.md §6. */
export const P_ATM = 101325; // Pa

/** Saturated vapor pressure over ice, Pa. Arrhenius fit, monograph Eq. 2.8 (printed p. 58 /
    pdf 59) — the fit outputs MBAR (unit check in the table): x100 converts to Pa. */
export function pSatIce(tempC: number): number {
  const tK = tempC + CELSIUS_ZERO_K;
  return 3.7e10 * Math.exp(-6150 / tK) * 100;
}

/** Saturated vapor pressure over supercooled water, Pa (monograph Eq. 2.8, same status). */
export function pSatWater(tempC: number): number {
  const tK = tempC + CELSIUS_ZERO_K;
  return (2.8e9 + 1700 * tempC * tempC * tempC) * Math.exp(-5450 / tK) * 100;
}

/** Saturated vapor number density over ice, 1/m^3 (ideal gas). */
export function cSat(tempC: number): number {
  return pSatIce(tempC) / (K_BOLTZMANN * (tempC + CELSIUS_ZERO_K));
}

/** Kinetic velocity, m/s — 1910.09067 Eq. 2, p. 3. Validated against monograph Table 2.1
    anchors to ~1-2% (the Arrhenius fit's accuracy) in core/test/libbrecht.test.ts. */
export function vKin(tempC: number): number {
  const tK = tempC + CELSIUS_ZERO_K;
  return (cSat(tempC) / C_ICE) * Math.sqrt((K_BOLTZMANN * tK) / (2 * Math.PI * M_MOL));
}

/** Supersaturation of supercooled water relative to ice (fraction) — monograph Eq. 2.9.
    KNOWN LIMIT (recorded in the table): computed from the difference of two Arrhenius fits,
    this deviates from Table 2.1's source-tabulated column by up to ~10% at -15 C and crosses zero at
    T = -1.969 C, so it is negative over the whole range warmer than that. It is a source-side
    plausibility reference, NOT an enforced runtime ceiling and never part of the dynamics
    (attachment-kinetics §4.4 component 1). Phase 6's supersaturation ladder therefore uses the
    printed Table 2.1 anchors instead — see runner/src/phase6-protocol.ts. */
export function sigmaWater(tempC: number): number {
  const pi = pSatIce(tempC);
  return (pSatWater(tempC) - pi) / pi;
}

/** Diffusivity at pressure P, m^2/s: source-stated D ~ P^-1, using the documented P2 project
    closure that anchors the source's approximate D_air to the exact standard atmosphere. */
export function diffusivity(pressurePa: number): number {
  return D_AIR_1ATM * (P_ATM / pressurePa);
}

/** Kinetic length X_0(T, P), m — monograph Eq. 3.10 (printed p. 93 / pdf 94).
    Table 2.1 anchor: 0.145 um in air at -15 C. */
export function kineticLength(tempC: number, pressurePa: number): number {
  return (cSat(tempC) / C_ICE) * (diffusivity(pressurePa) / vKin(tempC));
}

/** Ice-cell mass in vapor-ledger units, M_ice = c_ice / c_sat (attachment-kinetics §4.4
    component 4). ~6.7e5 at -15 C. */
export function mIce(tempC: number): number {
  return C_ICE / cSat(tempC);
}

// ── Nucleation parameters sigma_0(T), A(T) — digitized CAK anchors ─────────────────────────
// Source: monograph Figure 4.5 (printed p. 144 / pdf 145), digitized 2026-07-15, class P2,
// +-25% (sigma_0) / +-0.03 (A) — full provenance in docs/libbrecht-parameters.md Branch 1.
// Abscissa x = (Tm - T) in C; sigma_0 stored as FRACTIONS (plot quotes percent).
// Domain of validity: x in [1, 50] — outside it this module THROWS rather than extrapolates
// (the table: "extrapolating a fit outside its range silently manufactures a fake result").

const X_ANCHORS = [1, 2, 3, 5, 10, 15, 20, 30, 50];
const SIGMA0_BASAL = [0.0030, 0.0035, 0.0045, 0.0070, 0.014, 0.024, 0.038, 0.07, 0.16];
const SIGMA0_PRISM = [0.00006, 0.00028, 0.0007, 0.0027, 0.014, 0.032, 0.06, 0.13, 0.32];
// A_prism(x=10) corrected 0.95 -> 0.83 (round-2 maker review: the rendered figure reads
// 0.83-0.84; 0.95 was outside the stated ±0.03 band).
const A_PRISM_CAK = [0.45, 0.28, 0.21, 0.18, 0.83, 1, 1, 1, 1];

/**
 * Which A(T) treatment a run uses. NAMED HONESTLY (round-2 maker review: the former name
 * "A1" falsely claimed to be 1910.09067's model — that paper's A ≡ 1 analysis uses its OWN
 * Fig. 4 sigma_0 fits, which have a different crossing and remain un-digitized; documented
 * gap in libbrecht-parameters.md Branch 1):
 *   "CAK_A1" — the monograph's CAK sigma_0 curves with A ≡ 1 on both facets. A documented
 *              SIMPLIFICATION of the CAK set (the same simplification 1910.09067 applies to
 *              its own analysis, p. 5), NOT the 09067 model itself.
 *   "CAK"    — the monograph's full set: CAK sigma_0 plus A_basal = 1 and the digitized
 *              A_prism dip (Fig. 4.5 lower panel).
 * The choice is recorded per run; the pre-registered 2b habit gate states which it uses.
 *
 *   "M1"     — the SDAK-dipped closed forms printed in arXiv:2306.13087v1 p6-7, with A = 1 on
 *              BOTH facets by that paper's own choice. Phase 6 arm 2's inputs (ADR 0036). Unlike
 *              the two sets above it is not digitized from a figure: every coefficient is
 *              transcribed from a printed equation. Provenance is still P3 — the dip CENTRES were
 *              chosen by the author to impose agreement with the Nakaya diagram (charter §2.5), so
 *              agreement obtained under it is in-sample reproduction, never validation.
 *
 *   "M1_NO_DIP_ABLATION" — M1 with both dip factors replaced by one: the M2 broad-branch
 *              closed forms (`sigma0BasalM2Broad`/`sigma0PrismM2Broad`) with A = 1 on both
 *              facets, under the same registered 1…50 °C domain guard. Phase 6's matched
 *              no-dip arm (active plan WP2 sub-unit A): every other implemented kinetic choice
 *              is identical to M1, so only the matched M1-versus-no-dip pair may support an
 *              implementation-level contrast about the implemented dip factors — never
 *              physical SDAK causality in nature. These are the plan's INTENDED values; the
 *              WP3 protocol freeze binds them with a manifest-level matched-pair proof.
 */
export type NucleationParamSet = "CAK_A1" | "CAK" | "M1" | "M1_NO_DIP_ABLATION";

/**
 * Every parameter set a run may use, and the ONE list that decides it.
 *
 * Four separate hand-written guards used to spell this out — the CPU solver, the checkpoint
 * validator, the GPU solver and the CLI — and adding "M1" to the type plus the CLI left three of
 * them rejecting it. Typecheck passed, 23 unit tests passed, and the first real child died on its
 * first line. A list repeated four times is a list that drifts, so there is now one.
 */
export const NUCLEATION_PARAM_SETS = ["CAK_A1", "CAK", "M1", "M1_NO_DIP_ABLATION"] as const;

export function isNucleationParamSet(value: unknown): value is NucleationParamSet {
  return typeof value === "string" && (NUCLEATION_PARAM_SETS as readonly string[]).includes(value);
}

// ── M1: the SDAK-dipped closed forms ────────────────────────────────────────────────────────
//
// arXiv:2306.13087v1 p6, sigma_0 printed in PERCENT with T the magnitude in degrees Celsius:
//
//   sigma_0,basal(T) = (0.02 T^1.75 + 0.3) * (1 - 0.87 exp(-(log T - log 4.5)^2 / 0.07))
//   sigma_0,prism(T) = (0.015 T^2 + 0.02 T^0.6) * (1 - 0.95 exp(-(log T - log 14.4)^2 / 0.06))
//
// The source leaves `log` unspecified. This project evaluates it as BASE 10 under its registered P4
// transcription choice, supported by the printed Figure 1 dip widths (2026-07-29).
//
// CORRECTED 2026-08-01 (external review). The previous note here said natural log "moves the dip
// centres to 3.08 and 8.07 degrees". THAT IS MATHEMATICALLY IMPOSSIBLE and the numbers were
// misattributed. The full factor is `1 - q * exp(-(log T - log c)^2 / w)`: that factor reaches its
// minimum at `T = c` in ANY base, while the exponential term reaches its maximum there, because
// `log T - log c = 0` exactly when `T = c`. Verified: the centre sits at 4.500 under both
// log10 and ln. **A base change rescales the dip WIDTH, not its centre** — that is the real
// difference, and with `ln` the dips are ~2.3x narrower in log-argument terms.
//
// Approximately 3.08 and 8.07 are restricted equal-shared-positive-field alphaHK equality locations from the
// 2026-07-29 retraction
// (research/phase6-sweep-report.md), not dip centres. The conclusion the old note reached — use
// log10 — is unchanged, but only the printed Figure 1 dip widths discriminate the base. The source
// prose separately confirms the 4.5 and 14.4 centre values; those centres are base-invariant.
// runner/test/phase6-sdak.test.ts asserts the behaviour rather than trusting this note.
//
// Returned as a FRACTION, matching `sigma0Basal`/`sigma0Prism` and the `sigmaSurf` argument of
// `alphaHK` — the printed percentages are divided by 100 here, once, rather than at each call site.

/** M1 dip centres in degrees Celsius of magnitude. Printed values; not fitted by this project. */
export const M1_BASAL_DIP_CENTRE_C = 4.5;
export const M1_PRISM_DIP_CENTRE_C = 14.4;

/**
 * The temperature domain M1 is allowed to be evaluated on, as (Tm − T) in °C.
 *
 * A closed form returns a number for any positive input, so the executable still needs an explicit
 * refusal boundary. TAX2 Figure 1 (2306.13087v1 printed p.6) displays the exact M1 curves over
 * (Tm − T) = 1…50 °C and states that the text defines them. That is the source model's displayed
 * domain—not a claim that direct measurements anchor every temperature in it. Rows colder than the
 * audited numeric/inversion anchors remain P3/model-prescription territory.
 */
export const M1_DOMAIN_MAGNITUDE_C = { min: 1, max: 50 } as const;

function m1Magnitude(tempC: number): number {
  const t = Math.abs(tempC);
  if (!(t >= M1_DOMAIN_MAGNITUDE_C.min && t <= M1_DOMAIN_MAGNITUDE_C.max)) {
    throw new RangeError(
      `(Tm - T) = ${t} C is outside M1's registered domain ` +
        `[${M1_DOMAIN_MAGNITUDE_C.min}, ${M1_DOMAIN_MAGNITUDE_C.max}] — extrapolation is banned`,
    );
  }
  return t;
}

/** sigma_0,basal under M1, as a fraction. `tempC` is signed; only its magnitude is used. */
export function sigma0BasalM1(tempC: number): number {
  const t = m1Magnitude(tempC);
  const dip = 1 - 0.87 * Math.exp(-((Math.log10(t) - Math.log10(M1_BASAL_DIP_CENTRE_C)) ** 2) / 0.07);
  return ((0.02 * t ** 1.75 + 0.3) * dip) / 100;
}

/** sigma_0,prism under M1, as a fraction. */
export function sigma0PrismM1(tempC: number): number {
  const t = m1Magnitude(tempC);
  const dip = 1 - 0.95 * Math.exp(-((Math.log10(t) - Math.log10(M1_PRISM_DIP_CENTRE_C)) ** 2) / 0.06);
  return ((0.015 * t ** 2 + 0.02 * t ** 0.6) * dip) / 100;
}

/**
 * The same forms with the dips removed — M2's BROAD-facet branch.
 *
 * Since 2026-08-06 (WP2 reconnaissance sub-unit A) these are reachable as the standalone
 * `"M1_NO_DIP_ABLATION"` set — the matched no-dip arm, which implements ONLY the broad branch
 * as a matched input and none of M2's width feedback. The caveat is unchanged: M2 proper is
 * width-dependent; the source hypothesizes that Edge-Sharpening Instability can drive some
 * growing facets toward its narrow branch in air, the project has not established that the
 * broad branch is universally deleted, and ADR 0036 defers the full width query/closure.
 *
 * The matched no-dip helper intentionally uses the same source-displayed domain guard as M1, so
 * removing the dip factors does not silently add extrapolated temperature support.
 */
export function sigma0BasalM2Broad(tempC: number): number {
  const t = m1Magnitude(tempC);
  return (0.02 * t ** 1.75 + 0.3) / 100;
}
export function sigma0PrismM2Broad(tempC: number): number {
  const t = m1Magnitude(tempC);
  return (0.015 * t ** 2 + 0.02 * t ** 0.6) / 100;
}

/**
 * sigma_0 for a NAMED parameter set — the dispatch `alphaHK` uses.
 *
 * `sigma0Basal`/`sigma0Prism` are left exactly as they were, returning the digitized CAK anchors
 * with no set argument, because Phase 2b/4/5 evidence paths and the Phase 6 libm fingerprint call
 * them and must stay bit-identical. For "CAK" and "CAK_A1" these dispatchers return precisely those
 * same values, so adding M1 moves no existing number.
 */
export function sigma0BasalFor(tempC: number, set: NucleationParamSet): number {
  if (set === "M1") return sigma0BasalM1(tempC);
  if (set === "M1_NO_DIP_ABLATION") return sigma0BasalM2Broad(tempC);
  return sigma0Basal(tempC);
}
export function sigma0PrismFor(tempC: number, set: NucleationParamSet): number {
  if (set === "M1") return sigma0PrismM1(tempC);
  if (set === "M1_NO_DIP_ABLATION") return sigma0PrismM2Broad(tempC);
  return sigma0Prism(tempC);
}

function interpIndex(x: number): number {
  if (!(x >= X_ANCHORS[0] && x <= X_ANCHORS[X_ANCHORS.length - 1])) {
    throw new Error(
      `(Tm - T) = ${x} C is outside the digitized domain [${X_ANCHORS[0]}, ` +
        `${X_ANCHORS[X_ANCHORS.length - 1]}] — extrapolation is banned (libbrecht-parameters.md)`,
    );
  }
  let i = 0;
  while (i < X_ANCHORS.length - 2 && X_ANCHORS[i + 1] < x) i++;
  return i;
}

/** Log-log linear interpolation between digitized anchors (P4 choice, recorded in the table). */
function interpLogLog(x: number, ys: number[]): number {
  const i = interpIndex(x);
  const t = (Math.log(x) - Math.log(X_ANCHORS[i])) / (Math.log(X_ANCHORS[i + 1]) - Math.log(X_ANCHORS[i]));
  return Math.exp(Math.log(ys[i]) + t * (Math.log(ys[i + 1]) - Math.log(ys[i])));
}

/** Linear-in-x interpolation (for A, which touches 1 and has a dip). */
function interpLinear(x: number, ys: number[]): number {
  const i = interpIndex(x);
  const t = (x - X_ANCHORS[i]) / (X_ANCHORS[i + 1] - X_ANCHORS[i]);
  return ys[i] + t * (ys[i + 1] - ys[i]);
}

export function sigma0Basal(tempC: number): number {
  return interpLogLog(-tempC, SIGMA0_BASAL);
}

export function sigma0Prism(tempC: number): number {
  return interpLogLog(-tempC, SIGMA0_PRISM);
}

export function nucleationABasal(_tempC: number, _set: NucleationParamSet): number {
  return 1; // both published treatments have A_basal = 1 across the range
}

export function nucleationAPrism(tempC: number, set: NucleationParamSet): number {
  // M1 sets A = 1 on every facet by its own paper's choice: "To keep M1 relatively simple, we chose
  // to set A = 1 in Equation 3 for all growth conditions". That makes M1's attachment-coefficient
  // ordering independent of the chosen positive sigma_surf only when both facets are evaluated at
  // that same local field. It does not determine the coupled crystal habit. The 1 is a source-model
  // choice, not a placeholder; see accepted ADR 0040.
  if (set === "CAK_A1" || set === "M1" || set === "M1_NO_DIP_ABLATION") return 1;
  return interpLinear(-tempC, A_PRISM_CAK);
}

/**
 * Upper bound on the quasi-static validity (Péclet) number, v_n·L/D with v_n bounded by
 * alphaHK ≤ 1 (attachment-kinetics §4.3/§4.4 test 6). Must be << 1 for the quasi-static
 * field model to be valid; asserted by the 2b gate for its runs.
 */
export function pecletUpperBound(
  tempC: number,
  sigmaInfinity: number,
  lengthM: number,
  pressurePa: number,
): number {
  return (vKin(tempC) * sigmaInfinity * lengthM) / diffusivity(pressurePa);
}

// ── The attachment coefficient ──────────────────────────────────────────────────────────────

/**
 * The coupled LK surface policy is checkpointed as one value because classification, Robin
 * geometry, and fill geometry must never be mixed across versions (ADR 0009).
 */
export type LKSurfacePolicy =
  | "legacy-v3"
  | "aggregate-hv-g1h1-v4"
  | "aggregate-hv-g1h1-v5"
  | "aggregate-hv-g1h1-v6";

/** Runtime guard for parsed CLI/checkpoint values, where TypeScript's union is not binding. */
export function isLKSurfacePolicy(value: unknown): value is LKSurfacePolicy {
  return (
    value === "legacy-v3" ||
    value === "aggregate-hv-g1h1-v4" ||
    value === "aggregate-hv-g1h1-v5" ||
    value === "aggregate-hv-g1h1-v6"
  );
}

/**
 * V5 and v6 share ADR 0013's float64 smoother-drift term in the divergence identity; v4 does
 * not. Named once so a later policy cannot be added at one branch site and missed at another —
 * the shape of omission ADR 0023 was written about.
 */
export function metersSmootherDrift(policy: LKSurfacePolicy): boolean {
  return policy === "aggregate-hv-g1h1-v5" || policy === "aggregate-hv-g1h1-v6";
}

/**
 * V6 alone sums the Eq. 5.35 opposing-vapor operands in ascending value order (ADR 0023).
 * V4/v5 accumulate them in lattice-direction order, which rot60 and mirror permute
 * non-monotonically, so their boundary value is not D6h-equivariant in floating point.
 */
export function usesCanonicalOpposingOrder(policy: LKSurfacePolicy): boolean {
  return policy === "aggregate-hv-g1h1-v6";
}

export type FacetClass = "basal" | "prism" | "inhibited" | "rough";

/**
 * Classify one raw [HV] boundary configuration under an explicit coupled surface policy.
 * Counts are deliberately uncapped: the hole-fill rule needs the complete nT in [0, 6] and nZ
 * in [0, 2]. [00] is not a boundary configuration and reaching this function with it is a
 * topology error, never a rough-site fallback.
 *
 * `legacy-v3` preserves the executed protocol-v3 classifier. Aggregate v4 and v5 share ADR
 * 0009's source-constrained nearest-neighbor table: [01]/[02] basal, [10] inhibited, [20]
 * prism, and every other valid boundary configuration rough. V5 differs only in its float64
 * divergence identity (ADR 0013). Hole filling remains a separate attachment mode in the
 * solver and does not alter the kinetic class returned here.
 */
export function classifyFacet(
  rawNT: number,
  rawNZ: number,
  policy: LKSurfacePolicy,
): FacetClass {
  if (!isLKSurfacePolicy(policy)) {
    throw new Error(`unknown LK surface policy: ${String(policy)}`);
  }
  if (!Number.isInteger(rawNT) || rawNT < 0 || rawNT > 6) {
    throw new Error(`raw nT must be an integer in [0, 6], got ${String(rawNT)}`);
  }
  if (!Number.isInteger(rawNZ) || rawNZ < 0 || rawNZ > 2) {
    throw new Error(`raw nZ must be an integer in [0, 2], got ${String(rawNZ)}`);
  }
  if (rawNT === 0 && rawNZ === 0) {
    throw new Error("[00] is not a boundary configuration");
  }

  if (policy === "legacy-v3") {
    if (rawNT === 0) return "basal";
    if (rawNT === 1 && rawNZ === 0) return "prism";
    return "rough";
  }

  if (rawNT === 0) return "basal";
  if (rawNT === 1 && rawNZ === 0) return "inhibited";
  if (rawNT === 2 && rawNZ === 0) return "prism";
  return "rough";
}

/** alphaHK — 1910.09067 Eq. 3: A·exp(-sigma_0/sigma_surf); rough sites are barrier-free. */
export function alphaHK(
  facet: FacetClass,
  tempC: number,
  sigmaSurf: number,
  set: NucleationParamSet,
): number {
  if (facet === "inhibited") return 0;
  if (sigmaSurf <= 0) return 0; // no growth from sub/zero saturation (no sublimation modeled)
  if (facet === "rough") return 1;
  // Dispatched by set. For "CAK" and "CAK_A1" the dispatchers return exactly what the bare
  // sigma0Basal/sigma0Prism return, so every executed Phase 2b/4/5 run and the Phase 6 libm
  // fingerprint are bit-unchanged by M1's addition — asserted in core/test/libbrecht.test.ts.
  if (facet === "basal") {
    return nucleationABasal(tempC, set) * Math.exp(-sigma0BasalFor(tempC, set) / sigmaSurf);
  }
  return nucleationAPrism(tempC, set) * Math.exp(-sigma0PrismFor(tempC, set) / sigmaSurf);
}

/**
 * Temperature- and parameter-set-dependent inputs to the Hertz-Knudsen coefficient.
 *
 * A solver evaluates the coefficient many times at different local supersaturations while these
 * four values remain constant. Preparing them once removes repeated interpolation/closed-form
 * work without changing the load-bearing per-call expression. The object is frozen as well as
 * readonly so an untyped caller cannot mutate a live solver's prepared physics.
 */
export interface PreparedAlphaHK {
  readonly basalPrefactor: number;
  readonly basalSigma0: number;
  readonly prismPrefactor: number;
  readonly prismSigma0: number;
}

/** Prepare the constant inputs used by `alphaHKFromPrepared`. */
export function prepareAlphaHK(tempC: number, set: NucleationParamSet): PreparedAlphaHK {
  return Object.freeze({
    basalPrefactor: nucleationABasal(tempC, set),
    basalSigma0: sigma0BasalFor(tempC, set),
    prismPrefactor: nucleationAPrism(tempC, set),
    prismSigma0: sigma0PrismFor(tempC, set),
  });
}

/**
 * The prepared equivalent of `alphaHK`.
 *
 * Keep the multiplication, unary negation, division, and `Math.exp` evaluation written in the
 * same order as `alphaHK`: regrouping this expression would forfeit bit identity. Facet routing
 * and the nonpositive-supersaturation branch are likewise intentionally identical.
 */
export function alphaHKFromPrepared(
  facet: FacetClass,
  sigmaSurf: number,
  prepared: PreparedAlphaHK,
): number {
  if (facet === "inhibited") return 0;
  if (sigmaSurf <= 0) return 0;
  if (facet === "rough") return 1;
  if (facet === "basal") {
    return prepared.basalPrefactor * Math.exp(-prepared.basalSigma0 / sigmaSurf);
  }
  return prepared.prismPrefactor * Math.exp(-prepared.prismSigma0 / sigmaSurf);
}

/** Stream id for the LibbrechtKinetics alphaHK slowdown noise, shared by sink and growth. */
export const STREAM_NOISE_ALPHA_HK = 2;
