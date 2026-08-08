// Phase 6 ARM 3 — the INDEPENDENT verifier: re-derive arm 3's report.json from its points.json.
//
// Same discipline as the arm-1 and arm-2 verifiers and for the same reason (Rule 9): this imports
// NOTHING from `runner/src`. Not `phase6-sweep.ts`, which produced the report; not
// `phase6-arm3-protocol.ts`, which holds arm 3's registration; not `phase6-arm2-protocol.ts`,
// whose scoring functions arm 3 adopts by reference. Importing any of them would make this a
// re-run of the thing under test.
//
// Every rule below is transcribed from the registration that fixed it, cited inline, and every
// threshold is a literal here. If this file and the harness disagree, THAT IS THE FINDING — three
// times on arm 1 the disagreement was adjudicated against the registered definition and the
// harness was right and this file was wrong, and each of those was only visible because two
// implementations existed. Do not reconcile by importing.
//
//   node app/scripts/phase6-arm3-independent.mjs [outDir]
//
// Exit 0 if every re-derived quantity matches the published report; exit 1 otherwise.

import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// ── Registered rules, transcribed ────────────────────────────────────────────────────────────
//
// Shared with arms 1 and 2 (ADR 0025; `runner/src/phase6-protocol.ts`) — deliberately identical,
// because everything the arms share is what makes their comparison controlled:
const PLATE_CEILING = 1 / 1.5; // habit-classes freeze row: plate AR <= 1/1.5
const COLUMN_FLOOR = 1.5; // habit-classes freeze row: column AR >= 1.5
const BOUNDARIES_C = [-3.3, -9.9, -21.5]; // PHASE6_NAKAYA_BOUNDARIES_C
const AMBIGUITY_HALF_WIDTH_C = 1.0; // PHASE6_AMBIGUITY_HALF_WIDTH_C
const EXTENT_DRIFT_BOUND_AR = 0.135; // PHASE6_EXTENT_DRIFT_BOUND_AR (WP3 section 3)
const DOMAIN_CONTACT_FRACTION = 0.65; // PHASE6_DOMAIN_CONTACT_GUARD_FRACTION
const SWEEP_DOMAIN_N = 48; // PHASE6_SWEEP_DOMAIN_N; echoed per row as config.dimsN
const REGISTERED_TARGET_EXTENT = 21; // habit-measurement-size freeze row (ADR 0035)
const TEMPERATURE_GRID = Array.from({ length: 34 }, (_, i) => -2 - i); // -2 .. -35
const SIGMA_FRACTIONS = [0.1, 0.15, 0.25, 0.4, 0.6, 0.9]; // PHASE6_SIGMA_FRACTIONS
const REGIMES = [
  { regime: "plates-warm", warmerBoundC: Infinity, colderBoundC: -3.3, accepts: ["plate"], inHeadline: true },
  { regime: "columns", warmerBoundC: -3.3, colderBoundC: -9.9, accepts: ["column"], inHeadline: true },
  { regime: "plates-cold", warmerBoundC: -9.9, colderBoundC: -21.5, accepts: ["plate"], inHeadline: true },
  { regime: "columns-and-plates", warmerBoundC: -21.5, colderBoundC: -Infinity, accepts: ["plate", "column"], inHeadline: false },
];

// The registered supersaturation ladder: printed Table 2.1 water-saturation anchors, linear
// interpolation, sigmaInf = fraction of water saturation (PHASE6_SIGMA_WATER_ANCHORS and
// phase6SigmaInf in `runner/src/phase6-protocol.ts`). Transcribed so the grid's sigma axis is
// re-derived, not trusted; the expression order matches the registered one so IEEE doubles agree
// exactly.
const SIGMA_WATER_ANCHORS = [
  { tempC: 0, sigmaWater: 0.0 },
  { tempC: -1, sigmaWater: 0.01 },
  { tempC: -2, sigmaWater: 0.02 },
  { tempC: -5, sigmaWater: 0.05 },
  { tempC: -10, sigmaWater: 0.102 },
  { tempC: -15, sigmaWater: 0.157 },
  { tempC: -20, sigmaWater: 0.215 },
  { tempC: -30, sigmaWater: 0.34 },
  { tempC: -40, sigmaWater: 0.474 },
];
function sigmaWaterFromTable(tempC) {
  for (let i = 0; i < SIGMA_WATER_ANCHORS.length - 1; i++) {
    const left = SIGMA_WATER_ANCHORS[i];
    const right = SIGMA_WATER_ANCHORS[i + 1];
    if (tempC <= left.tempC && tempC >= right.tempC) {
      const t = (tempC - left.tempC) / (right.tempC - left.tempC);
      return left.sigmaWater + t * (right.sigmaWater - left.sigmaWater);
    }
  }
  return NaN; // off the anchors — extrapolation is banned, and the grid never leaves them
}
const sigmaInfOf = (tempC, fraction) => sigmaWaterFromTable(tempC) * fraction;

// The registered run configuration every row must echo (freeze rows in
// `runner/src/phase6-protocol.ts`, shared by arm 3 BY REFERENCE per decision 0045 item 4):
const REGISTERED_CONFIG = {
  surfacePolicy: "aggregate-hv-g1h1-v6", // PHASE6_SURFACE_POLICY
  farField: "monopole-matched", // PHASE6_FAR_FIELD
  dimsN: 48, // PHASE6_SWEEP_DOMAIN_N (freeze row `grid`)
  dxUm: 0.35, // freeze row `dx`: "0.35 micrometres"
  cfl: 0.1, // freeze row `fill-cfl`
  targetExtent: 21, // freeze row `habit-measurement-size` (ADR 0035)
};
const REQUIRED_STOP_REASON = "size-target"; // ADR 0035

// ARM 3's OWN registered values (decision 0045 item 4; `runner/src/phase6-arm3-protocol.ts`,
// stage 2 of the two-commit landing):
const ARM_ID = "arm3-no-dip-ablation"; // PHASE6_ARM3_ID
const PARAM_SET = "M1_NO_DIP_ABLATION"; // PHASE6_ARM3_PARAM_SET
const BISTABLE_C = [-4, -5, -6]; // freeze row `bistable-band`, adopted unchanged from arm 2 (ADR 0036 pre-registration 2)
const VALUES_SHA256 = "297927daeb2ef5a864162191444666c7fda5ced70e78312abbe28af1622db92e"; // PHASE6_ARM3_VALUES_SHA256
const JUSTIFICATION_SHA256 = "7d01d251c98d7663b215daeb47bb39baec1f070e4c7edd7eac86f4f9d63803a2"; // PHASE6_ARM3_JUSTIFICATION_SHA256
const PROTOCOL_SHA256 = "79c71a54911360a799f2b85d64fd9ec9fb89e9c5f0f013e7a1aec12ded7cd231"; // PHASE6_ARM3_PROTOCOL_SHA256
const EXECUTION_HEAD = "6340429f750f2f619383233d063e36998440e209"; // the commit the sweep executed at, named in report.json
const FREEZE_COMMIT = "6d140bf7de3d3aba69631a407b6c064073e650b9"; // PHASE6_ARM3_FREEZE_COMMIT (stage-1 registration commit)

// NO PRE-REGISTERED FORECAST, on purpose. Decision 0045 item 4 registers no expectation for
// arm 3, and `phase6-arm3-protocol.ts` deliberately does not mirror arm 2's
// `registered-expectation` row — inventing a prediction here would be a new pre-registration,
// not a mirror. The sibling arms' MEASURED results are quoted in the summary as context only:
// arm 1 measured 3/90 and arm 2 measured 54/90 on the common denominator (their published
// report.json files, verified by their own sibling scripts).

const outDir = process.argv[2] ?? join(process.cwd(), "evidence", "phase6-sweep-arm3");
const failures = [];
const note = (m) => failures.push(m);

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

// ── 0. The artifact set, and WHICH ARM it claims to be ───────────────────────────────────────
console.log(`artifacts: ${outDir}`);
console.log(
  "RESULT LABEL: MEASURED-ONLY AGREEMENT — this is not ADR 0026's registered " +
    "three-grid conservative-intersection headline.",
);
for (const name of ["points.json", "report.json", "diagram.svg"]) {
  const p = join(outDir, name);
  try {
    console.log(`  ${name.padEnd(14)} ${String(statSync(p).size).padStart(7)} bytes  ${sha256(p)}`);
  } catch {
    note(`${name} is missing from ${outDir} — an incomplete artifact set is not evidence`);
  }
}
if (failures.length > 0) {
  for (const f of failures) console.log(`  - ${f}`);
  console.log("PHASE6 ARM3 INDEPENDENT VERIFY: FAIL");
  process.exit(1);
}

const points = JSON.parse(readFileSync(join(outDir, "points.json"), "utf8"));
const published = JSON.parse(readFileSync(join(outDir, "report.json"), "utf8"));

// The arm-identity fields exist BECAUSE a report without them is indistinguishable from another
// arm's except by directory name. Check them before anything else: if this is arm 1's or arm 2's
// artifact in arm 3's directory, nothing below means what it says. All three hashes and the
// execution head are checked — the justification hash and head are report fields too, and a field
// this file does not compare is a field a forgery does not have to get right.
if (published.arm !== ARM_ID) note(`report.json claims arm "${published.arm}", not "${ARM_ID}"`);
if (published.paramSet !== PARAM_SET) note(`report.json claims paramSet "${published.paramSet}", not "${PARAM_SET}"`);
if (published.valuesSha256 !== VALUES_SHA256) {
  note(`report.json's gated values hash is ${published.valuesSha256}, not the registered ${VALUES_SHA256}`);
}
if (published.justificationSha256 !== JUSTIFICATION_SHA256) {
  note(`report.json's justification hash is ${published.justificationSha256}, not the registered ${JUSTIFICATION_SHA256}`);
}
if (published.protocolSha256 !== PROTOCOL_SHA256) {
  note(`report.json's protocol hash is ${published.protocolSha256}, not arm 3's ${PROTOCOL_SHA256}`);
}
if (published.head !== EXECUTION_HEAD) {
  note(`report.json's execution head is ${published.head}, not ${EXECUTION_HEAD}`);
}
const svg = readFileSync(join(outDir, "diagram.svg"), "utf8");
if (!svg.includes("no-dip ablation")) note("diagram.svg is not titled as the no-dip ablation arm");
if (!svg.includes(ARM_ID)) note(`diagram.svg does not carry the arm id ${ARM_ID}`);
if (!svg.includes(VALUES_SHA256.slice(0, 12))) note("diagram.svg does not carry arm 3's values-hash prefix");
if (!svg.includes(EXECUTION_HEAD.slice(0, 12))) note("diagram.svg does not carry arm 3's execution-head prefix");
if (svg.includes("SDAK (M1)")) note("diagram.svg is titled as the SDAK arm (arm 2)");
if (svg.includes("no-SDAK habit")) note("diagram.svg is titled as the NO-SDAK arm (arm 1)");

// ── 1. Every row ran under arm 3's parameter set AND the shared frozen configuration ─────────
//
// The per-row `config` is the child's self-reported header. It is what makes a spliced row from
// another arm detectable: arm 1's rows say paramSet=CAK, arm 2's say M1.
//
// EVERY row must carry one, and that requirement is not pedantry — it is arm 2's negative
// controls C7 and C8 (`app/scripts/phase6-arm2-negative-controls.mjs`): a check that only
// inspects rows that HAVE the field is disarmed by removing the field. Missing config is a
// FAILURE.
//
// Beyond paramSet, the shared registered configuration is checked field by field against the
// literals above — decision 0045 item 4 registers arm 3 as identical to the executed arm-2
// configuration in every registered respect except `paramSet`, and "identical" is checkable,
// not a vibe: surfacePolicy, farField, dimsN, dxUm, cfl and targetExtent must all echo the
// frozen values on every row.
let withConfig = 0;
const noConfig = [];
for (const e of points) {
  const c = e.result?.config;
  if (c === null || c === undefined) {
    noConfig.push(`T=${e.point.tempC} f=${e.point.fraction}`);
    continue;
  }
  withConfig += 1;
  if (c.paramSet !== PARAM_SET) {
    note(`T=${e.point.tempC} f=${e.point.fraction} ran under paramSet "${c.paramSet}", not ${PARAM_SET}`);
  }
  for (const [key, want] of Object.entries(REGISTERED_CONFIG)) {
    if (c[key] !== want) {
      note(`T=${e.point.tempC} f=${e.point.fraction} config.${key} is ${c[key]}, not the registered ${want}`);
    }
  }
  if (c.stopReason !== REQUIRED_STOP_REASON) {
    if (e.exclusionReason === null) {
      note(`T=${e.point.tempC} f=${e.point.fraction} ended on "${c.stopReason}" yet is scored`);
    }
  }
  if (c.tempC !== e.point.tempC) note(`T=${e.point.tempC} row reports a run at ${c.tempC} C`);
  // The registered argument vector emits `--sigma-inf point.sigmaInf.toFixed(6)`
  // (`runner/src/phase6-sweep.ts`), so the child can only ever echo the 6-decimal rounding of the
  // grid value — THAT is the identity a genuine row must satisfy, not bitwise equality.
  if (c.sigmaInf !== Number(e.point.sigmaInf.toFixed(6))) {
    note(`T=${e.point.tempC} f=${e.point.fraction} row reports a run at sigmaInf ${c.sigmaInf}, not the point's 6-decimal ${Number(e.point.sigmaInf.toFixed(6))}`);
  }
}
if (noConfig.length > 0) {
  note(
    `${noConfig.length} of ${points.length} rows carry NO per-row config, so they cannot say which ` +
      `parameter set produced them (first: ${noConfig.slice(0, 3).join(", ")}) — negative controls C7/C8`,
  );
}
// WHAT THIS STILL CANNOT DO, stated rather than implied. The per-row config is SELF-REPORTED. A
// spliced foreign row whose config was also forged to say M1_NO_DIP_ABLATION is indistinguishable
// from a genuine one by any inspection of the artifact alone. Detecting that needs the
// source-graph digest and the execution-time provenance record, not this file.

// ── 2. The row set is exactly the registered grid, with its registered sigma axis ────────────
const expected = new Set();
for (const t of TEMPERATURE_GRID) for (const f of SIGMA_FRACTIONS) expected.add(`${t}|${f}`);
const seen = new Map();
for (const e of points) {
  const k = `${e.point.tempC}|${e.point.fraction}`;
  seen.set(k, (seen.get(k) ?? 0) + 1);
}
if (points.length !== expected.size) note(`points.json has ${points.length} rows, the grid has ${expected.size}`);
for (const [k, n] of seen) {
  if (n > 1) note(`grid point ${k} appears ${n} times — duplicated row`);
  if (!expected.has(k)) note(`grid point ${k} is not on the registered grid`);
}
for (const k of expected) if (!seen.has(k)) note(`registered grid point ${k} is MISSING`);
// The sigma axis and the band geometry are re-derived from the registered ladder and boundaries,
// never trusted from the row. Doubles compare exactly: the expression order above is the
// registered one.
for (const e of points) {
  const t = e.point.tempC;
  const wantSigma = sigmaInfOf(t, e.point.fraction);
  if (e.point.sigmaInf !== wantSigma) {
    note(`T=${t} f=${e.point.fraction}: sigmaInf ${e.point.sigmaInf} vs re-derived ${wantSigma}`);
  }
  if (e.result.tempC !== t) note(`T=${t} f=${e.point.fraction}: result.tempC ${e.result.tempC} does not match its grid point`);
  if (e.result.fraction !== e.point.fraction) note(`T=${t} f=${e.point.fraction}: result.fraction ${e.result.fraction} does not match its grid point`);
  if (e.result.sigmaInf !== e.point.sigmaInf) note(`T=${t} f=${e.point.fraction}: result.sigmaInf ${e.result.sigmaInf} does not match its grid point`);
}

// ── 3. Re-derive every class, score and scope ────────────────────────────────────────────────
const classify = (ar) => (!Number.isFinite(ar) || ar <= 0 ? "invalid" : ar <= PLATE_CEILING ? "plate" : ar >= COLUMN_FLOOR ? "column" : "neutral");
const regimeOf = (t) => REGIMES.find((r) => t > r.colderBoundC && t <= r.warmerBoundC);
const distToBoundary = (t) => Math.min(...BOUNDARIES_C.map((b) => Math.abs(t - b)));
const inBand = (t) => distToBoundary(t) <= AMBIGUITY_HALF_WIDTH_C;
const isBistable = (t) => BISTABLE_C.includes(t);
/**
 * Arm 3 scores under ARM 2'S rule BY CONSTRUCTION (decision 0045 item 4; `phase6Arm3ScoreHabit`
 * IS `phase6Arm2ScoreHabit`, the same function object): the bistable band accepts BOTH pure
 * classes; neutral still fails (ADR 0036 pre-registration 2).
 */
const scoreArm3 = (t, cls) => {
  if (cls === "invalid") return "excluded";
  if (isBistable(t)) return cls === "neutral" ? "disagree" : "agree";
  return regimeOf(t).accepts.includes(cls) ? "agree" : "disagree";
};
const scoreArm1 = (t, cls) => (cls === "invalid" ? "excluded" : regimeOf(t).accepts.includes(cls) ? "agree" : "disagree");
const inHeadlineArm3 = (t) => regimeOf(t).inHeadline && !inBand(t) && !isBistable(t);
const inHeadlineArm1 = (t) => regimeOf(t).inHeadline && !inBand(t);
/** Directional, per the registered rule — extent drift RAISES AR, so only the below side is at risk. */
const extentFragile = (ar) => [PLATE_CEILING, COLUMN_FLOOR].some((th) => ar < th && ar >= th - EXTENT_DRIFT_BOUND_AR);

const mine = [];
let reclassified = 0;
let rescored = 0;
for (const e of points) {
  const r = e.result;
  const invalid = [];
  if (!r.allConverged) invalid.push("converge");
  if (!r.deltaSymClean) invalid.push("d6h");
  if (r.symmetryError !== 0) invalid.push("symErr");
  // Recomputed from geometry, never read from the published boolean.
  if (r.largestExtent / SWEEP_DOMAIN_N > DOMAIN_CONTACT_FRACTION) invalid.push("domain-contact");
  if (!(r.largestExtent >= REGISTERED_TARGET_EXTENT)) invalid.push("short-extent"); // ADR 0035
  if (r.config && r.config.stopReason !== REQUIRED_STOP_REASON) invalid.push("stop-reason"); // ADR 0035

  const cls = invalid.length > 0 ? "invalid" : classify(r.aspectRatio);
  const score = scoreArm3(e.point.tempC, cls);
  const head = inHeadlineArm3(e.point.tempC);
  if (cls !== e.modelClass) { reclassified += 1; note(`T=${e.point.tempC} f=${e.point.fraction}: class ${cls} vs published ${e.modelClass}`); }
  if (score !== e.score) { rescored += 1; note(`T=${e.point.tempC} f=${e.point.fraction}: score ${score} vs published ${e.score}`); }
  if (head !== e.inHeadlineScope) note(`T=${e.point.tempC} f=${e.point.fraction}: headline ${head} vs published ${e.inHeadlineScope}`);
  const frag = cls !== "invalid" && extentFragile(r.aspectRatio);
  if (frag !== e.extentFragile) note(`T=${e.point.tempC} f=${e.point.fraction}: extentFragile ${frag} vs published ${e.extentFragile}`);
  // Row-level scope fields, re-derived from the registered boundaries rather than read back.
  if (regimeOf(e.point.tempC).regime !== e.regime) {
    note(`T=${e.point.tempC} f=${e.point.fraction}: regime ${regimeOf(e.point.tempC).regime} vs published ${e.regime}`);
  }
  if (inBand(e.point.tempC) !== e.inAmbiguityBand) {
    note(`T=${e.point.tempC} f=${e.point.fraction}: ambiguity band ${inBand(e.point.tempC)} vs published ${e.inAmbiguityBand}`);
  }
  if (inBand(e.point.tempC) !== e.point.inAmbiguityBand) {
    note(`T=${e.point.tempC} f=${e.point.fraction}: point.inAmbiguityBand ${e.point.inAmbiguityBand} disagrees with the registered band`);
  }
  if (distToBoundary(e.point.tempC) !== e.point.distanceToBoundaryC) {
    note(`T=${e.point.tempC} f=${e.point.fraction}: distanceToBoundaryC ${e.point.distanceToBoundaryC} vs re-derived ${distToBoundary(e.point.tempC)}`);
  }
  mine.push({ ...e, cls, score, head });
}

// ── 4. Re-derive the report, INCLUDING the invariant the arm-2 freeze review added ───────────
const headline = mine.filter((s) => s.head);
const headlineAgree = headline.filter((s) => s.score === "agree").length;
const headlineTotal = headline.filter((s) => s.score !== "excluded").length;
const common = mine.filter((s) => inHeadlineArm1(s.point.tempC));
const commonAgree = common.filter((s) => scoreArm1(s.point.tempC, s.cls) === "agree").length;
const commonTotal = common.filter((s) => scoreArm1(s.point.tempC, s.cls) !== "excluded").length;

const perRegime = REGIMES.map((spec) => {
  const rows = mine.filter((s) => regimeOf(s.point.tempC).regime === spec.regime && !inBand(s.point.tempC) && (!spec.inHeadline || s.head));
  return {
    regime: spec.regime,
    inHeadline: spec.inHeadline,
    agree: rows.filter((s) => s.score === "agree").length,
    disagree: rows.filter((s) => s.score === "disagree").length,
    excluded: rows.filter((s) => s.score === "excluded").length,
    neutralCount: rows.filter((s) => s.cls === "neutral").length,
    extentFragile: rows.filter((s) => s.cls !== "invalid" && extentFragile(s.result.aspectRatio)).length,
  };
});

const compare = (name, got, want) => {
  if (want === undefined) note(`report.json has no ${name} — a field that is absent cannot be checked`);
  else if (got !== want) note(`${name}: re-derived ${got}, published ${want}`);
};
compare("headlineAgree", headlineAgree, published.headlineAgree);
compare("headlineTotal", headlineTotal, published.headlineTotal);
compare("headlineAgreeCommonDenominator", commonAgree, published.headlineAgreeCommonDenominator);
compare("headlineTotalCommonDenominator", commonTotal, published.headlineTotalCommonDenominator);
compare("neutralCount", mine.filter((s) => s.cls === "neutral").length, published.neutralCount);
compare("excludedCount", mine.filter((s) => s.score === "excluded").length, published.excludedCount);
compare("extentFragileCount", mine.filter((s) => s.cls !== "invalid" && extentFragile(s.result.aspectRatio)).length, published.extentFragileCount);
for (const t of perRegime) {
  const p = (published.perRegime ?? []).find((x) => x.regime === t.regime);
  if (p === undefined) { note(`report.json has no perRegime row for ${t.regime}`); continue; }
  for (const k of ["inHeadline", "agree", "disagree", "excluded", "neutralCount", "extentFragile"]) {
    compare(`perRegime[${t.regime}].${k}`, t[k], p[k]);
  }
}
// The invariant the arm-2 freeze review's blocker 1 was found by: a per-regime table scoped by a
// different rule than its headline is not a breakdown of that headline.
const rowSumAgree = perRegime.filter((t) => t.inHeadline).reduce((n, t) => n + t.agree, 0);
const rowSumTotal = perRegime.filter((t) => t.inHeadline).reduce((n, t) => n + t.agree + t.disagree, 0);
if (rowSumAgree !== headlineAgree || rowSumTotal !== headlineTotal) {
  note(`perRegime does not sum to the headline: ${rowSumAgree}/${rowSumTotal} vs ${headlineAgree}/${headlineTotal}`);
}
// The bistable band's own count — a REGISTERED obligation (freeze row `bistable-band`, adopted
// from ADR 0036 pre-registration 2), so a missing field is a failure. The band's TEMPERATURES are
// compared too: a band counted over the wrong temperatures matching by coincidence is not the
// registered band.
const bist = mine.filter((s) => isBistable(s.point.tempC));
compare("bistable.points", bist.length, published.bistable?.points);
compare("bistable.agree", bist.filter((s) => s.score === "agree").length, published.bistable?.agree);
compare("bistable.neutralCount", bist.filter((s) => s.cls === "neutral").length, published.bistable?.neutralCount);
const publishedBand = published.bistable?.temperaturesC;
if (publishedBand === undefined) {
  note("report.json has no bistable.temperaturesC — a field that is absent cannot be checked");
} else if (publishedBand.length !== BISTABLE_C.length || BISTABLE_C.some((t, i) => publishedBand[i] !== t)) {
  note(`bistable.temperaturesC: published [${publishedBand}], registered [${BISTABLE_C}]`);
}
// excludedPoints, re-derived in both directions: every row this file finds invalid must be named
// there, and every named row must be one this file finds invalid. (Arm 3 published zero; the
// comparison is structural, not vacuous by fiat.)
const myExcluded = new Set(mine.filter((s) => s.score === "excluded").map((s) => `${s.point.tempC}|${s.point.fraction}`));
const publishedExcluded = published.excludedPoints;
if (publishedExcluded === undefined) {
  note("report.json has no excludedPoints — a field that is absent cannot be checked");
} else {
  const namedSet = new Set(publishedExcluded.map((x) => `${x.tempC}|${x.fraction}`));
  compare("excludedPoints.length", myExcluded.size, publishedExcluded.length);
  for (const k of myExcluded) if (!namedSet.has(k)) note(`row ${k} is excluded by re-derivation but not named in excludedPoints`);
  for (const k of namedSet) if (!myExcluded.has(k)) note(`excludedPoints names ${k}, which re-derivation does not exclude`);
}

// ── 5. Report. NO registered forecast exists for this arm — sibling results are context only ─
console.log("");
console.log("re-derived independently of runner/src:");
console.log(`  arm                    ${published.arm} (paramSet ${published.paramSet})`);
console.log(`  freeze commit          ${FREEZE_COMMIT}`);
console.log(`  execution head         ${published.head}`);
console.log(`  points                 ${mine.length}   config-carrying ${withConfig}`);
console.log(`  MEASURED-ONLY AGREEMENT (arm scope)   ${headlineAgree}/${headlineTotal}   (decision 0045 registered no forecast for this arm)`);
console.log(`  MEASURED-ONLY AGREEMENT (common scope) ${commonAgree}/${commonTotal}   (context: arm 1 measured 3/90, arm 2 measured 54/90)`);
const classes = {};
for (const s of mine) classes[s.cls] = (classes[s.cls] ?? 0) + 1;
console.log(`  classes                ${JSON.stringify(classes)}`);
console.log(`  historical extent-fragile (artifact flag) ${mine.filter((s) => s.cls !== "invalid" && extentFragile(s.result.aspectRatio)).length}`);
console.log(`  excluded (named)       ${mine.filter((s) => s.score === "excluded").length}`);
console.log(`  bistable band          ${bist.length} points, ${bist.filter((s) => s.score === "agree").length} agree, ${bist.filter((s) => s.cls === "neutral").length} neutral`);
for (const t of perRegime) {
  console.log(`    ${t.regime.padEnd(20)} n=${String(t.agree + t.disagree + t.excluded).padStart(3)}  agree=${String(t.agree).padStart(3)}  neutral=${String(t.neutralCount).padStart(3)}`);
}

console.log("");
if (failures.length === 0) {
  console.log(`VERIFIED: ${mine.length} points re-derived; every class, score, historical`);
  console.log("inHeadlineScope artifact flag, historical extent-fragile artifact flag, per-regime tally, bistable count,");
  console.log("per-row registered-config echo, grid sigma axis, excludedPoints and arm-identity field matches.");
  console.log(
    `MEASURED-ONLY AGREEMENT: ${headlineAgree}/${headlineTotal} in arm scope; ` +
      `${commonAgree}/${commonTotal} in the arm-1 common scope ` +
      "(not the registered ADR 0026 conservative-intersection headline)",
  );
  console.log("PHASE6 ARM3 INDEPENDENT VERIFY: PASS");
} else {
  console.log(`DISAGREEMENTS: ${failures.length} (${reclassified} class, ${rescored} score)`);
  for (const f of failures.slice(0, 40)) console.log(`  - ${f}`);
  if (failures.length > 40) console.log(`  ... and ${failures.length - 40} more`);
  console.log("PHASE6 ARM3 INDEPENDENT VERIFY: FAIL");
  process.exit(1);
}
