// Historical arm-2 proxy forecast, preserved and explicitly withdrawn from gate use (ADR 0040).
//
// Why calibrate rather than assert. Arm 1's dominant outcome was not disagreement — it was 168 of
// 204 points measuring `neutral`. An equal-field coefficient proxy says nothing by itself about
// whether the measured aspect ratio clears 0.6667 / 1.5, and registering "SDAK will fix it" without
// saying how much habit strength is needed is not a prediction, it is a hope.
//
// The historical forecast fit arm 1 AR against a far-field coefficient-ratio proxy and transferred
// that empirical map from CAK to M1. That transfer is confounded: changing kinetics changes local
// depletion and geometry, and neither facet is generally evaluated at sigmaInfinity in the solver.
// The numbers remain reproducible as a historical pre-run proxy calculation, but were not a valid
// pre-run habit prediction and are inadmissible as habit evidence or a causal SDAK prediction.
// The replacement protocol requires a matched M1/no-dip forward
// ablation to isolate the implemented dip factors' effect within the frozen solver; it has not yet
// been frozen or executed and cannot establish physical SDAK causality or necessity in nature.
//
// The predictor is r = alphaHK(basal) / alphaHK(prism) evaluated at sigma_surf = sigma_infinity.
// sigma_surf is NOT sigma_infinity. Diffusion depletes it differently across facets and changing
// the kinetics changes that depletion, so the proxy bias need not have the same sign or magnitude
// in CAK and M1. Nothing below establishes transfer to the coupled M1 run.

import { readFileSync } from "node:fs";
import { alphaHK } from "../../core/src/libbrecht.ts";

const PLATE_CEILING = 1 / 1.5;
const COLUMN_FLOOR = 1.5;
const log10 = Math.log10;

// M1, 2306.13087v1 p6. sigma_0 in PERCENT as printed; converted to a fraction to match the code's
// convention, which is what `sigmaSurf` carries.
const m1Sigma0Basal = (T) =>
  ((0.02 * T ** 1.75 + 0.3) * (1 - 0.87 * Math.exp(-((log10(T) - log10(4.5)) ** 2) / 0.07))) / 100;
const m1Sigma0Prism = (T) =>
  ((0.015 * T ** 2 + 0.02 * T ** 0.6) * (1 - 0.95 * Math.exp(-((log10(T) - log10(14.4)) ** 2) / 0.06))) / 100;
/** M1 sets A = 1 for every facet, by the paper's own choice, so alphaHK is the exponential alone. */
const m1Ratio = (tempC, sigmaSurf) =>
  Math.exp(-m1Sigma0Basal(Math.abs(tempC)) / sigmaSurf) / Math.exp(-m1Sigma0Prism(Math.abs(tempC)) / sigmaSurf);

const rows = JSON.parse(readFileSync(new URL("../../evidence/phase6-sweep/points.json", import.meta.url), "utf8"));
const classify = (ar) => (ar <= PLATE_CEILING ? "plate" : ar >= COLUMN_FLOOR ? "column" : "neutral");

// ── 1. The transfer function arm 1 measured ──────────────────────────────────────────────────
const observed = rows
  .filter((r) => r.exclusionReason === null && Number.isFinite(r.result.aspectRatio))
  .map((r) => ({
    tempC: r.point.tempC,
    fraction: r.point.fraction,
    sigmaInf: r.point.sigmaInf,
    ar: r.result.aspectRatio,
    lnR: Math.log(
      alphaHK("basal", r.point.tempC, r.point.sigmaInf, "CAK") /
        alphaHK("prism", r.point.tempC, r.point.sigmaInf, "CAK"),
    ),
  }))
  .filter((r) => Number.isFinite(r.lnR));

console.log(`arm 1 rows usable for the fit: ${observed.length} of ${rows.length}`);

// Least squares in LOG-LOG. Both sides are ratios, and that is not a cosmetic preference: fitting AR
// directly on ln r gives AR = 0.7151 + 0.6585 ln r, which extrapolates to AR = -0.27 at M1's coldest
// proxy ratio. A negative aspect ratio is not a conservative forecast; it invalidates that fit, and
// the plates-cold regime that drives this whole forecast sits in exactly that extrapolated range.
// ln AR = a + b ln r keeps AR positive by construction and makes both axes log-ratios of the same
// kind. Deliberately one slope and one intercept, no per-regime terms. This historical choice does
// not cure the CAK→M1 transfer problem.
const n = observed.length;
const mx = observed.reduce((s, r) => s + r.lnR, 0) / n;
const my = observed.reduce((s, r) => s + Math.log(r.ar), 0) / n;
let sxy = 0, sxx = 0, syy = 0;
for (const r of observed) {
  sxy += (r.lnR - mx) * (Math.log(r.ar) - my);
  sxx += (r.lnR - mx) ** 2;
  syy += (Math.log(r.ar) - my) ** 2;
}
const slope = sxy / sxx;
const intercept = my - slope * mx;
const r2 = (sxy * sxy) / (sxx * syy);
/** Historical empirical proxy map; not a physical attachment-to-habit transfer function. */
const predictAR = (lnR) => Math.exp(intercept + slope * lnR);
console.log(`fit: ln AR = ${intercept.toFixed(4)} + ${slope.toFixed(4)} * ln(alphaHK_basal/alphaHK_prism)   R^2 = ${r2.toFixed(3)}`);
console.log(`ln r spanned by arm 1: ${Math.min(...observed.map((r) => r.lnR)).toFixed(2)} .. ${Math.max(...observed.map((r) => r.lnR)).toFixed(2)}`);

// Does the fit reproduce arm 1's own class counts? If it cannot, it must not be used on arm 2.
const back = { plate: 0, neutral: 0, column: 0 };
let correct = 0;
for (const r of observed) {
  const predicted = classify(predictAR(r.lnR));
  back[predicted] += 1;
  if (predicted === classify(r.ar)) correct += 1;
}
const actual = { plate: 0, neutral: 0, column: 0 };
for (const r of observed) actual[classify(r.ar)] += 1;
console.log(`back-check on arm 1 — predicted ${JSON.stringify(back)} vs actual ${JSON.stringify(actual)}`);
console.log(`                     per-point class agreement ${correct}/${n} = ${((100 * correct) / n).toFixed(1)}%`);

// ── 2. Apply the same map to M1 at the same 204 points ───────────────────────────────────────
const BOUNDARIES = [-3.3, -9.9, -21.5];
const regimeOf = (t) =>
  t > -3.3 ? "plates-warm" : t > -9.9 ? "columns" : t > -21.5 ? "plates-cold" : "columns-and-plates";
const ACCEPTS = {
  "plates-warm": ["plate"], columns: ["column"], "plates-cold": ["plate"],
  "columns-and-plates": ["plate", "column"],
};
const IN_HEADLINE = { "plates-warm": true, columns: true, "plates-cold": true, "columns-and-plates": false };
/** Pre-registration 2: the source documents both habits under identical conditions here. */
const BISTABLE_C = [-4, -5, -6];

let headline = 0, agree = 0, neutral = 0, bistableExcluded = 0;
const perRegime = {};
const lnRs = [];
for (const row of rows) {
  const { tempC, sigmaInf, fraction } = row.point;
  const lnR = Math.log(m1Ratio(tempC, sigmaInf));
  lnRs.push({ tempC, fraction, lnR, ar: predictAR(lnR) });
  const cls = classify(predictAR(lnR));
  const regime = regimeOf(tempC);
  const inBand = BOUNDARIES.some((b) => Math.abs(tempC - b) <= 1.0);
  const bistable = BISTABLE_C.includes(tempC);
  if (bistable) bistableExcluded += 1;
  if (!IN_HEADLINE[regime] || inBand || bistable) continue;
  headline += 1;
  perRegime[regime] ??= { n: 0, agree: 0, neutral: 0 };
  perRegime[regime].n += 1;
  if (cls === "neutral") { neutral += 1; perRegime[regime].neutral += 1; }
  if (ACCEPTS[regime].includes(cls)) { agree += 1; perRegime[regime].agree += 1; }
}

console.log("");
console.log("── HISTORICAL CONFOUNDED PROXY FORECAST — INADMISSIBLE AS HABIT EVIDENCE ───────");
console.log("sigmaInfinity proxy + CAK→M1 transfer; ADR 0040 requires the matched forward ablation instead");
console.log(`headline scope after excluding the bistable band ${BISTABLE_C.join("/")} C: ${headline} points`);
  console.log(`  historical proxy AGREE    ${agree} / ${headline}   (${((100 * agree) / headline).toFixed(1)}%)`);
  console.log(`  historical proxy neutral  ${neutral}`);
console.log(`  bistable points excluded by name: ${bistableExcluded}`);
for (const [regime, t] of Object.entries(perRegime)) {
  console.log(`    ${regime.padEnd(20)} n=${String(t.n).padStart(3)}  agree=${String(t.agree).padStart(3)}  neutral=${String(t.neutral).padStart(3)}`);
}

// ── 3. Refuse the historical alternative fit that produces impossible geometry ──────────────
//
// The linear form AR = a + b ln r returns negative aspect ratios in the M1 query set. Those values
// cannot be classified as plates or any other habit. The historical 66/78 result and 42–66 range
// scored those impossible values and are therefore withdrawn, not retained as an uncertainty bound.
{
  const myLin = observed.reduce((s, r) => s + r.ar, 0) / n;
  let lxy = 0, lxx = 0;
  for (const r of observed) { lxy += (r.lnR - mx) * (r.ar - myLin); lxx += (r.lnR - mx) ** 2; }
  const bLin = lxy / lxx, aLin = myLin - bLin * mx;
  let invalid = 0, invalidHistoricallyScored = 0, validAgree = 0, tot = 0;
  for (const row of rows) {
    const { tempC, sigmaInf } = row.point;
    const regime = regimeOf(tempC);
    if (!IN_HEADLINE[regime]) continue;
    if (BOUNDARIES.some((b) => Math.abs(tempC - b) <= 1.0)) continue;
    if (BISTABLE_C.includes(tempC)) continue;
    tot += 1;
    const ar = aLin + bLin * Math.log(m1Ratio(tempC, sigmaInf));
    if (!Number.isFinite(ar) || ar <= 0) {
      invalid += 1;
      // The withdrawn calculation passed these impossible values through `classify`, where every
      // negative number became a plate. Count that historical mistake separately from valid rows.
      if (ACCEPTS[regime].includes(classify(ar))) invalidHistoricallyScored += 1;
    } else if (ACCEPTS[regime].includes(classify(ar))) {
      validAgree += 1;
    }
  }
  console.log("");
  console.log(`Linear-fit alternative: REFUSED (${invalid}/${tot} headline rows have nonpositive/nonfinite AR)`);
  console.log(
    `  audit decomposition: ${validAgree} valid positive-AR agreements + ` +
      `${invalidHistoricallyScored} impossible values historically habit-scored = ` +
      `${validAgree + invalidHistoricallyScored}/${tot}`,
  );
  console.log("  historical 66/78 score and 42–66 range are withdrawn; invalid AR is not habit-scored");
}

// ── 3b. The same forecast under arm 1's UNMODIFIED rules ─────────────────────────────────────
//
// The named bistable set contains 18 raw rows, but -4 C was already excluded by the ambiguity band;
// the net headline denominator change is 90 -> 78, or 12 points. Reporting only the number after a
// rule change made between the two arms would be moving the goalposts, whatever the justification.
// So the apples-to-apples figure — arm 2 scored exactly as arm 1 was, over the same 90 points — is
// registered alongside it and will be published alongside it.
{
  let a = 0, t = 0, nt = 0;
  for (const row of rows) {
    const { tempC, sigmaInf } = row.point;
    const regime = regimeOf(tempC);
    if (!IN_HEADLINE[regime]) continue;
    if (BOUNDARIES.some((b) => Math.abs(tempC - b) <= 1.0)) continue;
    t += 1;
    const cls = classify(predictAR(Math.log(m1Ratio(tempC, sigmaInf))));
    if (cls === "neutral") nt += 1;
    if (ACCEPTS[regime].includes(cls)) a += 1;
  }
  console.log("");
  console.log(`Under arm 1's UNMODIFIED 90-point scoring (apples to apples): ${a}/${t}, neutral ${nt}`);
  console.log(`  arm 1 measured 3/90 under those same rules.`);
}

// ── 4. The geometric offset the AR criterion carries ─────────────────────────────────────────
//
// At ln r_proxy = 0 the fitted curve gives AR ≈ 0.77. That is an intercept of this confounded
// regression, not a forward run with isotropic local attachment kinetics and not proof of a lattice
// bias. The numbers are printed solely to reproduce what the historical forecast computed.
console.log("");
console.log(`historical proxy-fit AR at ln r_proxy = 0: ${predictAR(0).toFixed(4)}`);
console.log(`  distance to plate ceiling ${PLATE_CEILING.toFixed(4)}: ${(predictAR(0) - PLATE_CEILING).toFixed(4)}`);
console.log(`  distance to column floor  ${COLUMN_FLOOR.toFixed(4)}: ${(COLUMN_FLOOR - predictAR(0)).toFixed(4)}`);
console.log(`  ln r needed to reach the plate ceiling: ${((Math.log(PLATE_CEILING) - intercept) / slope).toFixed(3)}`);
console.log(`  ln r needed to reach the column floor:  ${((Math.log(COLUMN_FLOOR) - intercept) / slope).toFixed(3)}`);

console.log("");
console.log("Extrapolation check — is M1 being asked about anisotropies arm 1 never measured?");
const armMax = Math.max(...observed.map((r) => r.lnR));
const armMin = Math.min(...observed.map((r) => r.lnR));
const outside = lnRs.filter((r) => r.lnR < armMin || r.lnR > armMax);
console.log(`  M1 ln r span: ${Math.min(...lnRs.map((r) => r.lnR)).toFixed(2)} .. ${Math.max(...lnRs.map((r) => r.lnR)).toFixed(2)}`);
console.log(`  points outside arm 1's fitted range: ${outside.length} of ${lnRs.length}`);
if (outside.length > 0) {
  const byT = {};
  for (const o of outside) byT[o.tempC] = (byT[o.tempC] ?? 0) + 1;
  console.log(`  by temperature: ${Object.entries(byT).map(([t, c]) => `${t}C x${c}`).join(", ")}`);
}
