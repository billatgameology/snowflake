// Libbrecht attachment-kinetics parameters (Phase 2b).
//
// Every number and form here is cited in docs/libbrecht-parameters.md — this file implements
// that table and MUST NOT acquire values the table does not carry. The solver computes the
// closed forms; the digitized anchors are for interpolation (sigma0/A, figure-only in the
// sources) and for validation tests (v_kin/X_0 vs monograph Table 2.1).
//
// Units: SI internally (m, s, kg, Pa, K); temperatures in this API are degrees Celsius
// (the sources' working unit); supersaturations are dimensionless FRACTIONS (the table's
// canonical-units rule — the sources' plots quote percent; conversion happened at extraction).

export const K_BOLTZMANN = 1.380649e-23; // J/K (SI defined)
/** Water molecule mass (monograph Appendix A, printed p. 501 / pdf 502). */
export const M_MOL = 3.0e-26; // kg
/** Ice number density (monograph Appendix A, printed p. 500 / pdf 501). */
export const C_ICE = 3.1e28; // 1/m^3
/** Water-vapor diffusivity in air (monograph Appendix A); D ~ P^-1 (printed p. 65 / pdf 66).
    NO temperature law exists in the source (documented gap) — constant at fixed pressure. */
export const D_AIR_1ATM = 2.0e-5; // m^2/s
export const P_ATM = 101325; // Pa (reference pressure for D_AIR_1ATM; P4 choice)

/** Saturated vapor pressure over ice, Pa. Arrhenius fit, monograph Eq. 2.8 (printed p. 58 /
    pdf 59) — the fit outputs MBAR (unit check in the table): x100 converts to Pa. */
export function pSatIce(tempC: number): number {
  const tK = tempC + 273.15;
  return 3.7e10 * Math.exp(-6150 / tK) * 100;
}

/** Saturated vapor pressure over supercooled water, Pa (monograph Eq. 2.8, same status). */
export function pSatWater(tempC: number): number {
  const tK = tempC + 273.15;
  return (2.8e9 + 1700 * tempC * tempC * tempC) * Math.exp(-5450 / tK) * 100;
}

/** Saturated vapor number density over ice, 1/m^3 (ideal gas). */
export function cSat(tempC: number): number {
  return pSatIce(tempC) / (K_BOLTZMANN * (tempC + 273.15));
}

/** Kinetic velocity, m/s — 1910.09067 Eq. 2, p. 3. Validated against monograph Table 2.1
    anchors to ~1-2% (the Arrhenius fit's accuracy) in core/test/libbrecht.test.ts. */
export function vKin(tempC: number): number {
  const tK = tempC + 273.15;
  return (cSat(tempC) / C_ICE) * Math.sqrt((K_BOLTZMANN * tK) / (2 * Math.PI * M_MOL));
}

/** Supersaturation of supercooled water relative to ice (fraction) — monograph Eq. 2.9.
    KNOWN LIMIT (recorded in the table): computed from the difference of two Arrhenius fits,
    this deviates from Table 2.1's measured column by up to ~10% at -15 C and becomes negative
    near -1 C. It is a source-side plausibility reference, NOT an enforced runtime ceiling and
    never part of the dynamics (attachment-kinetics §4.4 component 1). */
export function sigmaWater(tempC: number): number {
  const pi = pSatIce(tempC);
  return (pSatWater(tempC) - pi) / pi;
}

/** Diffusivity at pressure P, m^2/s: D ~ P^-1 with the cited 1-atm value. */
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
 */
export type NucleationParamSet = "CAK_A1" | "CAK";

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
  return set === "CAK_A1" ? 1 : interpLinear(-tempC, A_PRISM_CAK);
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
export type LKSurfacePolicy = "legacy-v3" | "aggregate-hv-g1h1-v4";

/** Runtime guard for parsed CLI/checkpoint values, where TypeScript's union is not binding. */
export function isLKSurfacePolicy(value: unknown): value is LKSurfacePolicy {
  return value === "legacy-v3" || value === "aggregate-hv-g1h1-v4";
}

export type FacetClass = "basal" | "prism" | "inhibited" | "rough";

/**
 * Classify one raw [HV] boundary configuration under an explicit coupled surface policy.
 * Counts are deliberately uncapped: the hole-fill rule needs the complete nT in [0, 6] and nZ
 * in [0, 2]. [00] is not a boundary configuration and reaching this function with it is a
 * topology error, never a rough-site fallback.
 *
 * `legacy-v3` preserves the executed protocol-v3 classifier. `aggregate-hv-g1h1-v4` is ADR
 * 0009's source-constrained nearest-neighbor table: [01]/[02] basal, [10] inhibited, [20]
 * prism, and every other valid boundary configuration rough. Hole filling remains a separate
 * attachment mode in the solver and does not alter the kinetic class returned here.
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
  if (facet === "basal") {
    return nucleationABasal(tempC, set) * Math.exp(-sigma0Basal(tempC) / sigmaSurf);
  }
  return nucleationAPrism(tempC, set) * Math.exp(-sigma0Prism(tempC) / sigmaSurf);
}

/** Stream id for the LibbrechtKinetics alphaHK slowdown noise, shared by sink and growth. */
export const STREAM_NOISE_ALPHA_HK = 2;
