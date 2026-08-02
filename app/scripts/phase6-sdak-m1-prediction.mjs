// The SDAK arm's equal-local-field coefficient-order diagnostic, derived before any 3D run.
//
// M1, from 2306.13087v1 p6-7. `A = 1` for EVERY facet, by the paper's own choice:
//   "To keep M1 relatively simple, we chose to set A = 1 in Equation 3 for all growth conditions"
// and sigma_0 in PERCENT, with T the magnitude in degrees Celsius:
//
//   sigma_0,basal(T) = (0.02 T^1.75 + 0.3) * (1 - 0.87 exp(-(log T - log 4.5)^2 / 0.07))
//   sigma_0,prism(T) = (0.015 T^2 + 0.02 T^0.6) * (1 - 0.95 exp(-(log T - log 14.4)^2 / 0.06))
//
// `log` is BASE 10. The paper does not state the base. Dip centres cannot select it: both log10 and
// natural log place the factor minima at the printed 4.5 and 14.4 degrees. The base changes dip
// width and therefore the downstream equalities: approximately 3.08/8.07/24.73 are restricted
// equal-shared-positive-field attachment-coefficient equality locations under log10, not dip
// centres or habit transitions. Only agreement with the paper's plotted widths selects log10 here;
// the resulting three coefficient-order swaps are a consequence of that choice, not an independent
// selector.
//
// WHAT THIS ANALYTIC CHECK DOES AND DOES NOT SHOW.
//
// This project's withdrawn claim counted sigma_0 CROSSINGS and treated them as habit transitions.
// Even the following attachment-coefficient comparison is narrower than a habit claim. It compares
// both facets at the SAME positive local supersaturation:
// alphaHK = A exp(-sigma_0/sigma_surf), which carries A. When A_prism != 1 the swap is a zero of
//   ln A_prism(T) - (sigma_0,prism - sigma_0,basal)/sigma_surf
// and therefore depends on sigma_surf. The registered CAK set has A_prism != 1, which is why its
// three-crossing window is narrow and sigma-dependent, and why the "no broad-facet model can do
// three transitions" argument was invalidated; no opposite 3-D habit theorem was established.
//
// M1 is the case where sigma_0 order and equal-field alphaHK order coincide. With
// A_basal = A_prism = 1:
//   alphaHK_basal > alphaHK_prism  <=>  exp(-s0b/ss) > exp(-s0p/ss)  <=>  s0b < s0p     (any ss > 0)
// The exponential is monotonic and sigma_surf > 0, so that equal-field ordering is independent of
// the selected positive value. A coupled forward run generally gives basal and prism facets
// different local fields and geometry. Therefore the swaps printed here are an in-sample function-
// transcription diagnostic, not a prediction of habit, aspect ratio, or morphology.

const log10 = Math.log10;

/** sigma_0,basal in percent. T is the MAGNITUDE in degrees C (positive). */
function s0Basal(T) {
  return (0.02 * T ** 1.75 + 0.3) * (1 - 0.87 * Math.exp(-((log10(T) - log10(4.5)) ** 2) / 0.07));
}
/** sigma_0,prism in percent. */
function s0Prism(T) {
  return (0.015 * T ** 2 + 0.02 * T ** 0.6) * (1 - 0.95 * Math.exp(-((log10(T) - log10(14.4)) ** 2) / 0.06));
}
/** Undipped (broad-facet) branch, for the contrast. */
function s0BasalBroad(T) { return 0.02 * T ** 1.75 + 0.3; }
function s0PrismBroad(T) { return 0.015 * T ** 2 + 0.02 * T ** 0.6; }

/**
 * Equal-field attachment-coefficient order. Smaller sigma_0 gives larger alphaHK only under this
 * same-positive-local-supersaturation comparison.
 */
function coefficientOrder(s0b, s0p) {
  return s0b < s0p ? "basal-higher" : s0b > s0p ? "prism-higher" : "tie";
}

const GRID = Array.from({ length: 34 }, (_, i) => -2 - i); // the registered T axis, -2 .. -35

console.log("M1 (SDAK dips, A=1 both facets) — equal-field coefficient-order diagnostic");
console.log("");
console.log("   T     s0_basal   s0_prism   M1 order       | broad s0_b  broad s0_p  broad order");
console.log("  -------------------------------------------+------------------------------------------");
const orders = [];
for (const tempC of GRID) {
  const T = Math.abs(tempC);
  const b = s0Basal(T), p = s0Prism(T);
  const bb = s0BasalBroad(T), pb = s0PrismBroad(T);
  orders.push({ tempC, order: coefficientOrder(b, p), broad: coefficientOrder(bb, pb) });
  console.log(
    `  ${String(tempC).padStart(4)}  ${b.toFixed(4).padStart(9)}  ${p.toFixed(4).padStart(9)}  ` +
      `${coefficientOrder(b, p).padStart(13)}   | ${bb.toFixed(4).padStart(9)}  ${pb.toFixed(4).padStart(10)}  ${coefficientOrder(bb, pb).padStart(13)}`,
  );
}

const orderSwaps = (rows, key) => {
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][key] !== rows[i - 1][key]) out.push(`${rows[i - 1].tempC} -> ${rows[i].tempC} (${rows[i - 1][key]} -> ${rows[i][key]})`);
  }
  return out;
};

console.log("");
console.log(`M1 equal-field coefficient-order swaps (${orderSwaps(orders, "order").length}):`);
for (const t of orderSwaps(orders, "order")) console.log(`  ${t}`);
console.log("");
console.log(`Broad-branch equal-field swaps (${orderSwaps(orders, "broad").length}):`);
for (const t of orderSwaps(orders, "broad")) console.log(`  ${t}`);
console.log("These swaps are not scored as Nakaya habits; only forward-run artifact bytes are.");

// ── Why arm 1 measured NEUTRAL rather than the wrong class, and what changes ──────────────────
//
// Arm 1's dominant outcome was not disagreement, it was 168 of 204 points measuring `neutral`. A
// coefficient-order diagnostic says nothing about whether aspect ratio clears 0.6667 / 1.5. The
// ratio below is retained as a parameter contrast only; the coupled run must establish morphology.
console.log("");
console.log("Input ratio sigma_0,basal / sigma_0,prism (not a morphology predictor):");
console.log("");
console.log("   T    broad   M1      M1/broad");
for (const tempC of [-2, -5, -8, -10, -14, -15, -20, -25, -30, -35]) {
  const T = Math.abs(tempC);
  const broad = s0BasalBroad(T) / s0PrismBroad(T);
  const m1 = s0Basal(T) / s0Prism(T);
  console.log(
    `  ${String(tempC).padStart(4)}  ${broad.toFixed(3).padStart(6)}  ${m1.toFixed(3).padStart(6)}  ` +
      `${(m1 / broad).toFixed(2).padStart(8)}x`,
  );
}

// ── The two prism-dip anchors stated in CM8 prose, and how far M1 is from them ────────────────
//
// CM8 (2009.08404v2) Figure 18 plots a witness-surface/model-conditioned
// sigma_0,prism,SDAK(T) inversion over roughly -8 to -30 C; two fitted values appear numerically in
// that paper's prose. TAX2 later prints its separate approximate M1 closed form. Neither is an
// independent local-supersaturation measurement.
console.log("");
console.log("M1's prism dip against the two fitted values stated in CM8 prose:");
for (const [tempC, sourceInferred, cite] of [[-10, 0.85, "2009.08404v2 p14"], [-25, 6.6, "2009.08404v2 p13"]]) {
  const m1 = s0Prism(Math.abs(tempC));
  console.log(
    `  ${String(tempC).padStart(4)} C: CM8 fitted ${sourceInferred}%  M1 ${m1.toFixed(4)}%  ` +
      `ratio ${(m1 / sourceInferred).toFixed(3)}  (${cite})`,
  );
}
console.log("");
console.log("Prism-dip factor across the cold end; all rows are inside TAX2 Figure 1's displayed M1 domain,");
console.log("but rows colder than the same-lineage numeric references lack those local source-fit anchors:");
const dipP = (T) => 1 - 0.95 * Math.exp(-((log10(T) - log10(14.4)) ** 2) / 0.06);
const dipB = (T) => 1 - 0.87 * Math.exp(-((log10(T) - log10(4.5)) ** 2) / 0.07);
console.log("   T     basal dip   prism dip");
for (const tempC of [-15, -16, -20, -25, -30, -35]) {
  const T = Math.abs(tempC);
  console.log(`  ${String(tempC).padStart(4)}   ${dipB(T).toFixed(4).padStart(9)}   ${dipP(T).toFixed(4).padStart(9)}`);
}
