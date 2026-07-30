// Arm 2's per-point registered expectation, calibrated on arm 1's OWN measured data.
//
// Why calibrate rather than assert. Arm 1's dominant outcome was not disagreement — it was 168 of
// 204 points measuring `neutral`. A sense prediction (which facet grows faster) says nothing about
// whether the measured aspect ratio clears 0.6667 / 1.5, and registering "SDAK will fix it" without
// saying how much habit strength is needed is not a prediction, it is a hope.
//
// Arm 1 supplies the missing map. It ran 204 points and recorded, for each, both the attachment
// anisotropy the kinetics imply and the aspect ratio the 3D solver actually produced. Fitting AR
// against that anisotropy gives an empirical, in-house transfer function; applying it to M1's
// anisotropy at the same 204 (T, sigma) points gives a per-point predicted class BEFORE arm 2 runs.
//
// The predictor is r = alphaHK(basal) / alphaHK(prism) evaluated at sigma_surf = sigma_infinity.
// sigma_surf is NOT sigma_infinity — diffusion depletes it, so this is an upper bound on the driving
// supersaturation and therefore a systematically compressed anisotropy. That is a stated bias, not a
// hidden one: it is the same bias on both sides of the comparison, because arm 1's fit and M1's
// prediction use the identical proxy.

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

const rows = JSON.parse(readFileSync(new URL("../../out/phase6-sweep/points.json", import.meta.url), "utf8"));
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
// anisotropy. A negative aspect ratio is not a conservative prediction, it is an invalid model, and
// the plates-cold regime that drives this whole forecast sits in exactly that extrapolated range.
// ln AR = a + b ln r keeps AR positive by construction and makes both axes log-ratios of the same
// kind. Deliberately one slope and one intercept, no per-regime terms: a richer fit would describe
// arm 1 better and predict arm 2 worse.
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
/** The calibrated transfer function: attachment anisotropy in, aspect ratio out. */
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
console.log("── M1's PREDICTED arm-2 outcome, under the pre-registered scoring ──────────────────");
console.log(`headline scope after excluding the bistable band ${BISTABLE_C.join("/")} C: ${headline} points`);
console.log(`  PREDICTED AGREE    ${agree} / ${headline}   (${((100 * agree) / headline).toFixed(1)}%)`);
console.log(`  PREDICTED neutral  ${neutral}`);
console.log(`  bistable points excluded by name: ${bistableExcluded}`);
for (const [regime, t] of Object.entries(perRegime)) {
  console.log(`    ${regime.padEnd(20)} n=${String(t.n).padStart(3)}  agree=${String(t.agree).padStart(3)}  neutral=${String(t.neutral).padStart(3)}`);
}

// ── 3. The same forecast under the OTHER fit form, so the spread is registered not hidden ────
//
// The linear form AR = a + b ln r is invalid at M1's coldest anisotropies (it returns AR < 0), but it
// is invalid only there — over most of the range it is a perfectly reasonable alternative, and it
// answers 66/78 where log-log answers 42/78. That spread is the honest uncertainty in this forecast
// and it belongs in the registration, not in a footnote discovered afterwards. Registering the
// log-log number alone would be picking the fit whose answer I preferred after seeing both.
{
  const myLin = observed.reduce((s, r) => s + r.ar, 0) / n;
  let lxy = 0, lxx = 0;
  for (const r of observed) { lxy += (r.lnR - mx) * (r.ar - myLin); lxx += (r.lnR - mx) ** 2; }
  const bLin = lxy / lxx, aLin = myLin - bLin * mx;
  let hi = 0, tot = 0;
  for (const row of rows) {
    const { tempC, sigmaInf } = row.point;
    const regime = regimeOf(tempC);
    if (!IN_HEADLINE[regime]) continue;
    if (BOUNDARIES.some((b) => Math.abs(tempC - b) <= 1.0)) continue;
    if (BISTABLE_C.includes(tempC)) continue;
    tot += 1;
    if (ACCEPTS[regime].includes(classify(aLin + bLin * Math.log(m1Ratio(tempC, sigmaInf))))) hi += 1;
  }
  console.log("");
  console.log(`Same forecast under the LINEAR fit (invalid below ln r ≈ -1.09, kept as an upper bound): ${hi}/${tot}`);
  console.log(`  => REGISTERED RANGE for arm 2's headline: ${Math.min(agree, hi)}–${Math.max(agree, hi)} of ${headline}`);
}

// ── 3b. The same forecast under arm 1's UNMODIFIED rules ─────────────────────────────────────
//
// Pre-registration 2 removes 18 points from the headline. Reporting only the number that follows a
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
// At ln r = 0 — perfectly isotropic attachment kinetics — the fitted transfer function does NOT give
// AR = 1. Arm 1's own data says an isotropically-growing crystal on this lattice measures AR ≈ 0.77,
// already within 0.10 of the 0.6667 plate ceiling and 0.73 away from the column floor. The habit
// criterion is therefore not symmetric about isotropy on this lattice: it takes far less anisotropy
// to be called a plate than to be called a column. That is a measurement systematic of tExtent being
// the corner-to-corner diameter, and it is registered here because it biases every regime the same
// way and would otherwise be discovered as a surprise in arm 2's cold-column band.
console.log("");
console.log(`isotropic-kinetics AR (ln r = 0): ${predictAR(0).toFixed(4)}`);
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
