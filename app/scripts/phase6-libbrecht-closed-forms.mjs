// Phase 6 — the printed Libbrecht closed forms, evaluated against this project's inputs.
//
// Every constant below is TRANSCRIBED FROM A PRINTED EQUATION in a paper indexed by
// research/libbrecht-later-papers.md, with the page cited beside it. Nothing here is digitized
// off a curve. Run it with:  node app/scripts/phase6-libbrecht-closed-forms.mjs
//
// The question it answers: how many habit transitions can each printed parameterization express,
// and how does that compare with the Nakaya diagram's three boundaries?
//
// CORRECTED 2026-07-29. This header previously read: "A habit boundary requires the basal and prism
// alphaHK curves to swap order, i.e. a sigma0 crossing. So the crossing count is a hard structural
// bound ... independent of diffusion, geometry, grid, seed, or far field."
//
// The first clause is right and the "i.e." is WRONG. A habit boundary is an alphaHK order swap, and
//
//       alphaHK = A * exp(-sigma0 / sigma_surf)
//
// so the swap condition is  ln A_prism(t) = (sigma0_prism(t) - sigma0_basal(t)) / sigma_surf,
// which coincides with a sigma0 crossing ONLY when A_prism == 1. For the registered CAK set
// A_prism runs 0.18-0.45 at the warm end, and the swap count is then a function of sigma_surf —
// so there is no sigma_surf-independent bound, and nothing here is independent of diffusion.
// Section 3 prints both counts side by side. See the retraction at the head of
// research/libbrecht-figure-findings.md.

// ---------------------------------------------------------------------------------------------
// The project's own digitized anchors — core/src/libbrecht.ts, A_PRISM_CAK
// ---------------------------------------------------------------------------------------------
const ANCHOR_T = [1, 2, 3, 5, 10, 15, 20, 30, 50]; // (Tm - T) in C
const OURS_A_PRISM = [0.45, 0.28, 0.21, 0.18, 0.83, 1, 1, 1, 1];

// ---------------------------------------------------------------------------------------------
// arXiv:2009.08404v2 "Comprehensive Model 8: Characterizing SDAK near -14 C", page 3, Eqs. (2)-(5)
// Caption of Figure 2, same page: "The present paper focuses on temperatures between -10 C and
// -30 C, where A_basal ~ A_prism ~ 1."
// ---------------------------------------------------------------------------------------------
const sigma0BasalBroad = (t) => 0.02 * t ** 1.75 + 0.3; // Eq. (2), percent
const sigma0PrismBroad08404 = (t) => 0.02 * t ** 1.9 - 0.025 * (t - 0.3); // Eq. (3), percent
const aBasalBroad = () => 1; // Eq. (4)
const aPrismBroad = (t) => {
  const c = 0.04 * Math.abs(t - 4) ** 3; // Eq. (5)
  return (0.4 + c) / (2.2 + c);
};

// ---------------------------------------------------------------------------------------------
// arXiv:2306.13087v1 "Taxonomy 2: Quantifying the Nakaya Diagram", page 6 (M1) and page 7 (M2).
// M1 sets A = 1 on every facet: "To keep M1 relatively simple, we chose to set A = 1 in
// Equation 3 for all growth conditions" (p6).
// ---------------------------------------------------------------------------------------------
const sigma0PrismBroadM2 = (t) => 0.015 * t ** 2 + 0.02 * t ** 0.6; // p7, percent
// CORRECTED 2026-07-29: `log` in the printed dip formulas is BASE 10. Using Math.log (natural)
// gave five sigma0 crossings at 3.70/6.25/8.46/9.93/18.62; log10 gives three at 3.08/8.07/24.73.
// The wrong count was published in research/libbrecht-figure-findings.md and the sweep report.
const basalDip = (t) => 1 - 0.87 * Math.exp(-((Math.log10(t) - Math.log10(4.5)) ** 2) / 0.07); // p6
const prismDip = (t) => 1 - 0.95 * Math.exp(-((Math.log10(t) - Math.log10(14.4)) ** 2) / 0.06); // p6
const sigma0BasalM1 = (t) => sigma0BasalBroad(t) * basalDip(t);
const sigma0PrismM1 = (t) => sigma0PrismBroadM2(t) * prismDip(t);

// ---------------------------------------------------------------------------------------------
// Dedicated measurement papers, quoted verbatim in research/libbrecht-figure-findings.md
// ---------------------------------------------------------------------------------------------
const MEASURED = [
  { t: 2, quantity: "sigma0_prism", value: 0.03, source: "2004.06212v1 p4", note: "percent" },
  { t: 5, quantity: "sigma0_prism", value: 0.2, source: "1912.03230v1", note: "percent" },
  { t: 2, quantity: "A_prism", value: 0.25, source: "2004.06212v1 p4" },
  { t: 5, quantity: "A_prism", value: 0.2, source: "1912.03230v1" },
  { t: 2, quantity: "sigma0_basal", value: 0.4, source: "2004.06212v1", note: "percent" },
  { t: 5, quantity: "sigma0_basal", value: 0.7, source: "1912.03230v1", note: "percent" },
];

// ---------------------------------------------------------------------------------------------
// sigma0 crossing finder. This is NOT the habit criterion and NOT a bound on habit transitions —
// see the corrected header. It is retained only so section 3 can print it beside the alphaHK swap
// count and show that the two differ. Use alphaHKSwaps() for anything about habit.
// ---------------------------------------------------------------------------------------------
function crossings(fBasal, fPrism, lo = 1, hi = 50, step = 0.001) {
  const out = [];
  let prev = fPrism(lo) - fBasal(lo);
  for (let t = lo + step; t <= hi; t += step) {
    const cur = fPrism(t) - fBasal(t);
    if (prev === 0 || prev * cur < 0) out.push(Number((t - step / 2).toFixed(2)));
    prev = cur;
  }
  return out;
}

const fmt = (x, w = 9, d = 4) => x.toFixed(d).padStart(w);

console.log("=".repeat(94));
console.log("1. A_prism: this project's digitized anchors vs printed Eq. (5), 2009.08404v2 p3");
console.log("=".repeat(94));
console.log("(Tm-T)      ours    Eq.(5)     ratio     %diff");
let worst = 0;
for (let i = 0; i < ANCHOR_T.length; i++) {
  const t = ANCHOR_T[i];
  const o = OURS_A_PRISM[i];
  const e = aPrismBroad(t);
  const pct = (100 * (o - e)) / e;
  if (Math.abs(pct) > Math.abs(worst)) worst = pct;
  console.log(
    `${String(t).padStart(6)}  ${fmt(o, 8)}  ${fmt(e, 8)}  ${fmt(o / e, 8)}  ${(pct >= 0 ? "+" : "") + pct.toFixed(2)}%`,
  );
}
console.log(`\nworst deviation ${(worst >= 0 ? "+" : "") + worst.toFixed(2)}% — the digitization`);
console.log("reproduces the printed closed form; A_prism is no longer figure-digitized only.\n");

console.log("=".repeat(94));
console.log("2. sigma0_prism: TWO printed closed forms by the same author, vs measurement");
console.log("=".repeat(94));
console.log("(Tm-T)   08404 Eq.(3)     13087 M2     ratio 3/M2");
for (const t of [1, 2, 3, 5, 8, 10, 14, 15, 20, 25, 30, 40]) {
  const a = sigma0PrismBroad08404(t);
  const b = sigma0PrismBroadM2(t);
  console.log(`${String(t).padStart(6)}  ${fmt(a, 13)}  ${fmt(b, 12)}  ${fmt(a / b, 12, 3)}`);
}
console.log("\nAgainst the dedicated measurement papers:");
for (const m of MEASURED.filter((x) => x.quantity === "sigma0_prism")) {
  const a = sigma0PrismBroad08404(m.t);
  const b = sigma0PrismBroadM2(m.t);
  console.log(
    `  -${m.t} C  measured ${m.value}%  (${m.source})` +
      `   Eq.(3) ${a.toFixed(4)}% [x${(a / m.value).toFixed(2)}]` +
      `   M2 ${b.toFixed(4)}% [x${(b / m.value).toFixed(2)}]`,
  );
}
console.log("\nAlso check A_prism Eq. (5) against the same two measurement papers:");
for (const m of MEASURED.filter((x) => x.quantity === "A_prism")) {
  const e = aPrismBroad(m.t);
  console.log(
    `  -${m.t} C  measured ${m.value}  (${m.source})   Eq.(5) ${e.toFixed(4)} [x${(e / m.value).toFixed(2)}]`,
  );
}
console.log("\nAnd sigma0_basal Eq. (2), which both papers share:");
for (const m of MEASURED.filter((x) => x.quantity === "sigma0_basal")) {
  const e = sigma0BasalBroad(m.t);
  console.log(
    `  -${m.t} C  measured ${m.value}%  (${m.source})   Eq.(2) ${e.toFixed(4)}% [x${(e / m.value).toFixed(2)}]`,
  );
}

// ---------------------------------------------------------------------------------------------
// arXiv:2306.04042v1 "A Comprehensive Model of Snow Crystal Faceting", Table 1, page 9.
// "The parameters used to describe the prism attachment kinetics at different temperature using
// Equation 32."  Caption text on the same page: "Using the sum of two nucleation processes is a
// convenient parameterization to include what we have called the 'SDAK-2' phenomenon at the
// higher temperatures."  sigma0 is a FRACTION here, not percent (3e-2 at -15 C = 3%).
// This is the SDAK-2 two-branch table: alphaHKPrism = A1*exp(-s1/ssurf) + A2*exp(-s2/ssurf).
// ---------------------------------------------------------------------------------------------
const TABLE1 = [
  { T: -1, vkin: 690, A1: 0.3, s1: 3e-5, A2: 0.7, s2: 1e-3 },
  { T: -2, vkin: 635, A1: 0.25, s1: 3e-4, A2: 0.75, s2: 1.5e-3 },
  { T: -3, vkin: 585, A1: 0.2, s1: 1e-3, A2: 0.8, s2: 3e-3 },
  { T: -5, vkin: 496, A1: 0.2, s1: 2e-3, A2: 0.8, s2: 5.5e-3 },
  { T: -7, vkin: 419, A1: 0.5, s1: 8e-3, A2: 0.5, s2: 1e-2 },
  { T: -15, vkin: 208, A1: 1, s1: 3e-2, A2: null, s2: null },
];

console.log("\n" + "=".repeat(94));
console.log("2b. The SDAK-2 two-branch table (2306.04042v1 Table 1, p9) vs the measurement papers");
console.log("=".repeat(94));
console.log("Branch 1 should reproduce the dedicated broad-facet measurements if sigma0 is a fraction.");
console.log("  T     A1     sigma0,1        as %    Eq.(5) A_prism   Eq.(3) sigma0_prism %");
for (const r of TABLE1) {
  const t = Math.abs(r.T);
  console.log(
    `${String(r.T).padStart(4)}  ${r.A1.toFixed(2).padStart(5)}  ${String(r.s1).padStart(8)}  ` +
      `${(r.s1 * 100).toFixed(4).padStart(9)}  ${aPrismBroad(t).toFixed(4).padStart(14)}  ` +
      `${sigma0PrismBroad08404(t).toFixed(4).padStart(20)}`,
  );
}
console.log("\nDirect comparison with the two dedicated measurement papers:");
for (const r of TABLE1.filter((x) => x.T === -2 || x.T === -5)) {
  const m = MEASURED.filter((x) => x.t === Math.abs(r.T));
  const mp = m.find((x) => x.quantity === "sigma0_prism");
  const ma = m.find((x) => x.quantity === "A_prism");
  console.log(
    `  ${r.T} C   Table 1: A1=${r.A1}, sigma0,1=${(r.s1 * 100).toFixed(2)}%` +
      `   |   measured: A_prism=${ma.value}, sigma0_prism=${mp.value}%   (${mp.source})`,
  );
}
console.log("\nThe second branch is the SDAK-2 addition. Note it is ABSENT by -15 C.");
console.log("At -15 C Table 1 gives A1=1, sigma0,1=3e-2=3%; Eq.(3) gives " +
  `${sigma0PrismBroad08404(15).toFixed(4)}% and M2 gives ${sigma0PrismBroadM2(15).toFixed(4)}%.`);

console.log("\n" + "=".repeat(94));
console.log("3. HOW MANY HABIT TRANSITIONS CAN EACH MODEL EXPRESS?");
console.log("=".repeat(94));
console.log(`
  RETRACTION NOTE. This section previously counted crossings of sigma0 alone and concluded that
  every broad-facet parameterization has exactly ONE, giving a hard bound "independent of diffusion,
  grid, seed, far field". Both halves were wrong, and an adversarial audit on 2026-07-29 refuted
  them.

  Habit depends on which facet has the larger ATTACHMENT COEFFICIENT, and

        alphaHK = A * exp(-sigma0 / sigma_surf)

  carries A as well as sigma0. So the habit-relevant order swap is a zero of

        ln(alphaHKPrism / alphaHKBasal) = ln A_prism(t) - (sigma0_prism(t) - sigma0_basal(t)) / sigma_surf

  which (i) is NOT the same as a sigma0 crossing whenever A_prism != 1, and (ii) depends on
  sigma_surf, which diffusion sets. There is therefore no sigma_surf-independent bound at all.
  Both counts are printed below so the difference is visible rather than asserted.
`);

const sigma0Models = [
  ["2009.08404v2 Eq.(2)/(3)  broad facets", sigma0BasalBroad, sigma0PrismBroad08404, aPrismBroad],
  ["2306.13087v1 M2          broad facets", sigma0BasalBroad, sigma0PrismBroadM2, aPrismBroad],
  ["2306.13087v1 M1          A = 1 on every facet", sigma0BasalM1, sigma0PrismM1, () => 1],
];

console.log("  (a) sigma0 crossings — the quantity previously counted. NOT the habit criterion.");
for (const [name, fb, fp] of sigma0Models) {
  const c = crossings(fb, fp);
  console.log(`      ${name.padEnd(46)} ${String(c.length).padStart(2)} at (Tm-T) = ${c.join(", ")}`);
}

// alphaHK order-swap count, as a function of sigma_surf (percent, same units as sigma0 here).
function alphaHKSwaps(fb, fp, fA, sigmaSurf, lo = 1, hi = 50, step = 0.0005) {
  const g = (t) => Math.log(fA(t)) - (fp(t) - fb(t)) / sigmaSurf;
  const out = [];
  let prev = g(lo);
  for (let t = lo + step; t <= hi; t += step) {
    const cur = g(t);
    if (prev === 0 || prev * cur < 0) out.push(Number(t.toFixed(2)));
    prev = cur;
  }
  return out;
}

console.log("\n  (b) alphaHK order swaps — the actual habit criterion — vs sigma_surf (percent):");
for (const [name, fb, fp, fA] of sigma0Models) {
  console.log(`\n      ${name}`);
  for (const ss of [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 1.0, 2.0]) {
    const s = alphaHKSwaps(fb, fp, fA, ss);
    const flag = s.length >= 3 ? "   <-- THREE OR MORE" : "";
    console.log(
      `        sigma_surf = ${ss.toFixed(2)}%   swaps = ${String(s.length).padStart(2)}` +
        `   at (Tm-T) = ${s.join(", ") || "none"}${flag}`,
    );
  }
}

console.log("\n  Nakaya habit boundaries, digitized: (Tm-T) = 3.3, 9.9, 21.5  ->  3 boundaries.");
console.log(`
  READ THE RESULT THIS WAY. The printed broad-facet set reaches THREE alphaHK swaps in a band of
  sigma_surf, with plate/column/plate/column alternation, so a broad-facet model is NOT structurally
  incapable of three habit transitions. What can still be said, and is much weaker than what was
  published, is that at the sigma_surf values the sweep's own points actually reach, the swap count
  is 1 or 0 rather than 3 — so THIS sweep does not reproduce the diagram. That is a statement about
  the runs, not a bound on the model class.
`);
