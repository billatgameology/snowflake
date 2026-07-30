// The SDAK arm's registered expectation, derived BEFORE any 3D run (ADR 0030 item 4).
//
// M1, from 2306.13087v1 p6-7. `A = 1` for EVERY facet, by the paper's own choice:
//   "To keep M1 relatively simple, we chose to set A = 1 in Equation 3 for all growth conditions"
// and sigma_0 in PERCENT, with T the magnitude in degrees Celsius:
//
//   sigma_0,basal(T) = (0.02 T^1.75 + 0.3) * (1 - 0.87 exp(-(log T - log 4.5)^2 / 0.07))
//   sigma_0,prism(T) = (0.015 T^2 + 0.02 T^0.6) * (1 - 0.95 exp(-(log T - log 14.4)^2 / 0.06))
//
// `log` is BASE 10. Established by this project on 2026-07-29: with natural log the dips land at
// 3.08/8.07/24.73 and Math.log gives five M1 crossings; with log10 the dip centres are at 4.5 and
// 14.4 degrees as the paper's own prose describes them.
//
// WHY THIS IS A CLEAN PREDICTION, and why it is exactly the analysis the retraction demands.
//
// This project's refuted claim counted sigma_0 CROSSINGS and treated them as habit transitions.
// That is wrong in general: the habit-relevant quantity is the ordering of
// alphaHK = A exp(-sigma_0/sigma_surf), which carries A. When A_prism != 1 the swap is a zero of
//   ln A_prism(T) - (sigma_0,prism - sigma_0,basal)/sigma_surf
// and therefore depends on sigma_surf. The registered CAK set has A_prism != 1, which is why its
// three-crossing window is narrow and sigma-dependent, and why the "no broad-facet model can do
// three transitions" argument was REFUTED.
//
// M1 is the case where the two coincide, and coincide provably rather than by luck. With
// A_basal = A_prism = 1:
//   alphaHK_basal > alphaHK_prism  <=>  exp(-s0b/ss) > exp(-s0p/ss)  <=>  s0b < s0p     (any ss > 0)
// The exponential is monotonic and sigma_surf > 0, so the ordering is INDEPENDENT of sigma_surf.
// M1's predicted habit sense is a pure function of temperature. That is a far stronger
// pre-registration than the no-SDAK arm could make, and it is falsifiable on a single row.

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
 * Habit sense from the sigma_0 ordering. Smaller sigma_0 => larger alphaHK => that facet grows FASTER.
 * Basal faster => the crystal extends along c => COLUMN. Prism faster => PLATE.
 */
function sense(s0b, s0p) {
  return s0b < s0p ? "column" : s0b > s0p ? "plate" : "tie";
}

const GRID = Array.from({ length: 34 }, (_, i) => -2 - i); // the registered T axis, -2 .. -35

console.log("M1 (SDAK dips, A=1 both facets) — sigma_0 in percent, sense is sigma_surf-INDEPENDENT");
console.log("");
console.log("   T     s0_basal   s0_prism   M1 sense   | broad s0_b  broad s0_p  broad sense");
console.log("  ---------------------------------------+--------------------------------------");
const senses = [];
for (const tempC of GRID) {
  const T = Math.abs(tempC);
  const b = s0Basal(T), p = s0Prism(T);
  const bb = s0BasalBroad(T), pb = s0PrismBroad(T);
  senses.push({ tempC, sense: sense(b, p), broad: sense(bb, pb) });
  console.log(
    `  ${String(tempC).padStart(4)}  ${b.toFixed(4).padStart(9)}  ${p.toFixed(4).padStart(9)}  ` +
      `${sense(b, p).padStart(8)}   | ${bb.toFixed(4).padStart(9)}  ${pb.toFixed(4).padStart(10)}  ${sense(bb, pb).padStart(11)}`,
  );
}

const transitions = (rows, key) => {
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][key] !== rows[i - 1][key]) out.push(`${rows[i - 1].tempC} -> ${rows[i].tempC} (${rows[i - 1][key]} -> ${rows[i][key]})`);
  }
  return out;
};

console.log("");
console.log(`M1 transitions on the registered grid (${transitions(senses, "sense").length}):`);
for (const t of transitions(senses, "sense")) console.log(`  ${t}`);
console.log("");
console.log(`Broad-facet transitions on the same grid (${transitions(senses, "broad").length}):`);
for (const t of transitions(senses, "broad")) console.log(`  ${t}`);

// Nakaya, as ADR 0025 registers the reference regimes.
const NAKAYA = [
  { regime: "plates-warm", colderBoundC: -3.3, warmerBoundC: Infinity, accepts: ["plate"] },
  { regime: "columns", colderBoundC: -9.9, warmerBoundC: -3.3, accepts: ["column"] },
  { regime: "plates-cold", colderBoundC: -21.5, warmerBoundC: -9.9, accepts: ["plate"] },
  { regime: "columns-and-plates", colderBoundC: -Infinity, warmerBoundC: -21.5, accepts: ["plate", "column"] },
];
const regimeOf = (tempC) => NAKAYA.find((r) => tempC > r.colderBoundC && tempC <= r.warmerBoundC);

console.log("");
console.log("Scored against ADR 0025's registered regimes (+/-1.0 C ambiguity band excluded):");
let agree = 0, disagree = 0, band = 0, outOfHeadline = 0;
const wrong = [];
for (const row of senses) {
  const r = regimeOf(row.tempC);
  const inBand = [-3.3, -9.9, -21.5].some((b) => Math.abs(row.tempC - b) <= 1.0);
  if (inBand) { band++; continue; }
  if (r.regime === "columns-and-plates") { outOfHeadline++; continue; }
  if (r.accepts.includes(row.sense)) agree++;
  else { disagree++; wrong.push(`${row.tempC} C: M1 says ${row.sense}, ${r.regime} accepts ${r.accepts.join("/")}`); }
}
console.log(`  headline temperatures: ${agree + disagree}   AGREE ${agree}   DISAGREE ${disagree}`);
console.log(`  ambiguity band: ${band}   below -21.5 (reported, not headline): ${outOfHeadline}`);
for (const w of wrong) console.log(`    - ${w}`);

// ── Why arm 1 measured NEUTRAL rather than the wrong class, and what changes ──────────────────
//
// Arm 1's dominant outcome was not disagreement, it was 168 of 204 points measuring `neutral`. A
// sense prediction says nothing about whether the aspect ratio clears 0.6667 / 1.5. The facet
// CONTRAST is the quantity that should decide that, so it is registered here alongside the sense.
console.log("");
console.log("Facet contrast sigma_0,basal / sigma_0,prism — the quantity that should decide whether");
console.log("a habit is strong enough to clear the AR thresholds rather than measuring neutral:");
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

// ── The only two numeric anchors for the prism dip stated in text, and how far M1 is from them ──
//
// This is the sourcing check the cold-end pre-registration needs. CM8 (2009.08404v2) Figure 18 plots a
// MEASURED sigma_0,prism,SDAK(T) curve over roughly -8 to -30 C, but only two of its points appear as
// numbers in the prose. Everything else about the dip below -15 C is a closed-form extrapolation with
// no printed anchor.
console.log("");
console.log("M1's prism dip against the ONLY two numerically-stated measurements of it:");
for (const [tempC, measured, cite] of [[-10, 0.85, "2009.08404v2 p14"], [-25, 6.6, "2009.08404v2 p13"]]) {
  const m1 = s0Prism(Math.abs(tempC));
  console.log(
    `  ${String(tempC).padStart(4)} C: measured ${measured}%  M1 ${m1.toFixed(4)}%  ` +
      `ratio ${(m1 / measured).toFixed(3)}  (${cite})`,
  );
}
console.log("");
console.log("Prism-dip strength (1 = no dip) across the cold end, where no anchor exists:");
const dipP = (T) => 1 - 0.95 * Math.exp(-((log10(T) - log10(14.4)) ** 2) / 0.06);
const dipB = (T) => 1 - 0.87 * Math.exp(-((log10(T) - log10(4.5)) ** 2) / 0.07);
console.log("   T     basal dip   prism dip");
for (const tempC of [-15, -16, -20, -25, -30, -35]) {
  const T = Math.abs(tempC);
  console.log(`  ${String(tempC).padStart(4)}   ${dipB(T).toFixed(4).padStart(9)}   ${dipP(T).toFixed(4).padStart(9)}`);
}
