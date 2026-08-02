// M1 — the printed SDAK-dipped algebra plus the registered P4 log-base resolution. Arm 2 inputs.
//
// Source: arXiv:2306.13087v1 p6-7 (Libbrecht, "A Taxonomy of Snow Crystal Growth Behaviors:
// 2. Quantifying the Nakaya Diagram"). The numeric
// constants are transcribed from printed closed forms; the unstated logarithm base is this project's
// registered P4 transcription choice rather than a source-printed constant.
// The source's M1 prescription is P3 — the dip CENTRES were chosen by the author to impose agreement
// with the Nakaya diagram (charter §2.5), so agreement obtained with it is in-sample consistency and
// never validation (ADR 0005). The source leaves the logarithm base unspecified; resolving it from
// Figure 1 as base 10 is this project's separate P4 transcription choice.
//
// `log` is interpreted as BASE 10. Established 2026-07-29 and worth restating because the papers do
// not state the base.
// Changing the base rescales each dip's width and changes the registered-grid coefficient-order
// swap count; it cannot move a dip centre. For `1 - q * exp(-(log T - log c)^2 / w)`, every
// logarithm base gives
// the dip factor its minimum at T = c; the exponential term itself has its maximum there. The
// previously quoted approximate 3.08 and 8.07 values are equal-shared-field attachment-coefficient equality
// locations, not centres or habit transitions.
// Agreement with the paper's plotted Figure 1 widths supports log10 here. The resulting in-sample
// coefficient-order swap count is not an independent selector of the source convention.
//
// **A = 1 for every facet**, by the paper's own choice: "To keep M1 relatively simple, we chose to
// set A = 1 in Equation 3 for all growth conditions". That makes the *equal-local-field attachment-
// coefficient ordering* algebraically independent of the chosen positive local supersaturation.
// It does not predict the coupled crystal habit; see `phase6M1AnalyticCoefficientOrder`.
//
// These live in runner/src, hashed by the completion-time source-graph digest, and are re-derived
// independently in app/scripts/phase6-sdak-m1-prediction.mjs. The two are deliberately separate
// copies: a verifier that imports what it verifies is checking nothing.

import {
  M1_BASAL_DIP_CENTRE_C,
  M1_PRISM_DIP_CENTRE_C,
  sigma0BasalM1,
  sigma0BasalM2Broad,
  sigma0PrismM1,
  sigma0PrismM2Broad,
} from "@vcc/core";

// The closed forms themselves live in `core/src/libbrecht.ts` alongside every other kinetics
// function, reachable as the "M1" NucleationParamSet. This module holds only what is specific to
// ARM 2's registration — the coefficient-order diagnostic and sourcing anchors — and re-expresses
// the forms in PERCENT, the unit the paper prints, so a reader comparing against the paper does not
// have to undo a factor of 100 in their head.

/** Dip centres, in degrees Celsius of magnitude. Printed values, not fitted here. */
export const PHASE6_M1_BASAL_DIP_CENTRE_C = M1_BASAL_DIP_CENTRE_C;
export const PHASE6_M1_PRISM_DIP_CENTRE_C = M1_PRISM_DIP_CENTRE_C;

/**
 * sigma_0,basal as M1 PRINTS it, in percent, with `magnitudeC` the magnitude in degrees C.
 *
 * `(0.02 T^1.75 + 0.3) * (1 - 0.87 exp(-(log T - log 4.5)^2 / 0.07))`
 *
 * The closing parenthesis is missing as printed in one transcription of this equation; the grouping
 * used here is the only one that is dimensionally coherent and the only one whose dip minimum lands
 * on the centre the prose states — asserted in phase6-sdak.test.ts rather than argued here.
 */
export function phase6M1Sigma0BasalPercent(magnitudeC: number): number {
  return sigma0BasalM1(magnitudeC) * 100;
}

/**
 * sigma_0,prism as M1 prints it, in percent.
 *
 * `(0.015 T^2 + 0.02 T^0.6) * (1 - 0.95 exp(-(log T - log 14.4)^2 / 0.06))`
 */
export function phase6M1Sigma0PrismPercent(magnitudeC: number): number {
  return sigma0PrismM1(magnitudeC) * 100;
}

/**
 * The same forms with the dips removed — M2's broad-facet branch, used for contrast and intended
 * for the future matched `M1_NO_DIP_ABLATION` arm. Its production use still requires the replacement
 * protocol freeze; this helper does not implement M2's facet-width feedback.
 */
export function phase6BroadSigma0BasalPercent(magnitudeC: number): number {
  return sigma0BasalM2Broad(magnitudeC) * 100;
}
export function phase6BroadSigma0PrismPercent(magnitudeC: number): number {
  return sigma0PrismM2Broad(magnitudeC) * 100;
}

export type Phase6M1CoefficientOrder = "basal-higher" | "prism-higher" | "tie";

/**
 * Which M1 attachment coefficient is larger when both facets are evaluated at the same positive
 * local supersaturation.
 *
 * With `A_basal = A_prism = 1`:
 *
 *     alphaHK_basal > alphaHK_prism  <=>  exp(−σ₀b/σs) > exp(−σ₀p/σs)  ⟺  σ₀b < σ₀p     for every σs > 0
 *
 * because the exponential is monotonic and σ_surf is positive. This equal-field coefficient
 * ordering is **independent of σ_surf**. A coupled run generally gives the two facets different
 * local fields and geometry, so this identity is not a habit or morphology theorem.
 *
 * This project previously counted σ₀ crossings as habit transitions for the **CAK** set, where
 * `A_prism ≠ 1` and the swap is instead a zero of `ln A_prism(T) − (σ₀,prism − σ₀,basal)/σ_surf` —
 * σ-dependent, which invalidates the shortcut previously claimed for CAK. M1 permits only the
 * narrower equal-field coefficient shortcut, and `phase6-sdak.test.ts` asserts that identity rather
 * than trusting this comment.
 *
 * Smaller sigma_0 => larger alphaHK under the stated equal-field comparison.
 */
export function phase6M1AnalyticCoefficientOrder(tempC: number): Phase6M1CoefficientOrder {
  const T = Math.abs(tempC);
  const basal = phase6M1Sigma0BasalPercent(T);
  const prism = phase6M1Sigma0PrismPercent(T);
  return basal < prism ? "basal-higher" : basal > prism ? "prism-higher" : "tie";
}

/**
 * The registered M1 equal-field coefficient-order swaps on the temperature grid.
 *
 * These three swaps are an in-sample transcription diagnostic, not a morphology expectation or
 * evidence. The dip functions were chosen using the Nakaya diagram, and the coupled operator may
 * give the facets different local fields. This catches a later transcription change only.
 */
export const PHASE6_M1_EXPECTED_ORDER_SWAPS = [
  { warmerC: -3, colderC: -4, from: "prism-higher", to: "basal-higher" },
  { warmerC: -8, colderC: -9, from: "basal-higher", to: "prism-higher" },
  { warmerC: -24, colderC: -25, from: "prism-higher", to: "basal-higher" },
] as const;

/**
 * The two absolute sigma0Prism,SDAK values inferred by the source and stated in prose in the
 * audited CM8/CM10 source set, and what M1 gives at the same temperatures (ADR 0036
 * pre-registration 3).
 *
 * `2009.08404v2` Figure 18 labels a σ₀,prism,SDAK(T) curve inferred from growth measurements over
 * roughly −8 to −30 °C, but only these two points appear as numbers in prose. They are
 * model-dependent inversions of growth-rate observations, not direct measurements of a surface
 * barrier. The closed form runs LOW against both. Registered so the arm's weakest inputs are named
 * before it runs rather than after it disappoints.
 */
export const PHASE6_M1_PRISM_DIP_SOURCE_INFERRED_ANCHORS = [
  { tempC: -10, sourceInferredPercent: 0.85, source: "2009.08404v2 p14 (CM8)" },
  { tempC: -25, sourceInferredPercent: 6.6, source: "2009.08404v2 p13 (CM8)" },
] as const;
