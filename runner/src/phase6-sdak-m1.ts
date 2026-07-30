// M1 — the SDAK-dipped attachment kinetics, as printed. Arm 2's registered physics inputs.
//
// Source: arXiv:2306.13087v1 p6-7 (Libbrecht, "A Snow Crystal Growth Model..."). Every number here
// is transcribed from a printed closed form; none is fitted, digitized, or chosen by this project.
// Provenance class P3 throughout — the dip CENTRES were chosen by the author to impose agreement
// with the Nakaya diagram (charter §2.5), so agreement obtained with them is in-sample reproduction
// and never validation (ADR 0005).
//
// `log` is BASE 10. Established 2026-07-29 and worth restating because the papers do not say so:
// with natural log the dip centres land at 3.08 and 8.07 degrees and M1 produces FIVE transitions on
// the registered grid; with log10 they land at 4.5 and 14.4 degrees exactly as the paper's own prose
// describes them, and M1 produces three.
//
// **A = 1 for every facet**, by the paper's own choice: "To keep M1 relatively simple, we chose to
// set A = 1 in Equation 3 for all growth conditions". That single fact is what makes the arm's sense
// prediction provable rather than empirical — see `phase6M1Sense`.
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
// ARM 2's registration — the expected transitions and the sourcing anchors — and re-expresses the
// forms in PERCENT, the unit the paper prints, so a reader comparing against the paper does not
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

/** The same forms with the dips removed — M2's broad-facet branch, kept for contrast only. */
export function phase6BroadSigma0BasalPercent(magnitudeC: number): number {
  return sigma0BasalM2Broad(magnitudeC) * 100;
}
export function phase6BroadSigma0PrismPercent(magnitudeC: number): number {
  return sigma0PrismM2Broad(magnitudeC) * 100;
}

export type Phase6M1Sense = "plate" | "column" | "tie";

/**
 * Which habit M1 implies at a temperature — and it needs no supersaturation argument, which is the
 * whole point.
 *
 * With `A_basal = A_prism = 1`:
 *
 *     alphaHK_basal > alphaHK_prism  <=>  exp(−σ₀b/σs) > exp(−σ₀p/σs)  ⟺  σ₀b < σ₀p     for every σs > 0
 *
 * because the exponential is monotonic and σ_surf is positive. The ordering is **independent of
 * σ_surf**, so M1's habit sense is a pure function of temperature.
 *
 * This project previously counted σ₀ crossings as habit transitions for the **CAK** set, where
 * `A_prism ≠ 1` and the swap is instead a zero of `ln A_prism(T) − (σ₀,prism − σ₀,basal)/σ_surf` —
 * σ-dependent, and the source of a claim that was refuted. M1 earns the shortcut that set did not,
 * by construction rather than by luck, and `phase6-sdak.test.ts` asserts the independence rather
 * than trusting this comment.
 *
 * Smaller sigma_0 => larger alphaHK => that facet grows faster. Basal faster ⇒ the crystal extends along c ⇒
 * COLUMN. Prism faster ⇒ PLATE.
 */
export function phase6M1Sense(tempC: number): Phase6M1Sense {
  const T = Math.abs(tempC);
  const basal = phase6M1Sigma0BasalPercent(T);
  const prism = phase6M1Sigma0PrismPercent(T);
  return basal < prism ? "column" : basal > prism ? "plate" : "tie";
}

/**
 * The registered arm-2 expectation at the temperature level (ADR 0036 Part 1).
 *
 * Three transitions, against Nakaya's three. **This is a transcription check and NOT evidence** —
 * the dip centres were chosen to impose exactly this agreement. It is registered so that a later
 * edit to the forms above cannot silently move the expectation the arm is scored against.
 */
export const PHASE6_M1_EXPECTED_TRANSITIONS = [
  { warmerC: -3, colderC: -4, from: "plate", to: "column" },
  { warmerC: -8, colderC: -9, from: "column", to: "plate" },
  { warmerC: -24, colderC: -25, from: "plate", to: "column" },
] as const;

/**
 * The only two numerically-stated measurements of the prism dip anywhere in the corpus, and what M1
 * gives at the same temperatures (ADR 0036 pre-registration 3).
 *
 * `2009.08404v2` Figure 18 plots a measured σ₀,prism,SDAK(T) curve over roughly −8 to −30 °C, but only
 * these two points appear as numbers in prose. The closed form runs LOW against both. Registered so
 * the arm's weakest inputs are named before it runs rather than after it disappoints.
 */
export const PHASE6_M1_PRISM_DIP_ANCHORS = [
  { tempC: -10, measuredPercent: 0.85, source: "2009.08404v2 p14 (CM8)" },
  { tempC: -25, measuredPercent: 6.6, source: "2009.08404v2 p13 (CM8)" },
] as const;
