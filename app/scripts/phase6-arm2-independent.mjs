// Phase 6 ARM 2 — the INDEPENDENT verifier: re-derive arm 2's report.json from its points.json.
//
// Same discipline as the arm-1 verifier and for the same reason (Rule 9): this imports NOTHING from
// `runner/src`. Not `phase6-sweep.ts`, which produced the report; not `phase6-arm2-protocol.ts`,
// which holds arm 2's rules. Importing either would make this a re-run of the thing under test.
//
// Every rule below is transcribed from the ADR that registered it, cited inline, and every threshold
// is a literal here. If this file and the harness disagree, THAT IS THE FINDING — three times on
// arm 1 the disagreement was adjudicated against the registered definition and the harness was
// right and this file was wrong, and each of those was only visible because two implementations
// existed. Do not reconcile by importing.
//
//   node app/scripts/phase6-arm2-independent.mjs [outDir]
//
// Exit 0 if every re-derived quantity matches the published report; exit 1 otherwise.

import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// ── Registered rules, transcribed ────────────────────────────────────────────────────────────
//
// Shared with arm 1 (ADR 0025) — deliberately identical, because everything the arms share is what
// makes their comparison controlled:
const PLATE_CEILING = 1 / 1.5;
const COLUMN_FLOOR = 1.5;
const BOUNDARIES_C = [-3.3, -9.9, -21.5];
const AMBIGUITY_HALF_WIDTH_C = 1.0;
const EXTENT_DRIFT_BOUND_AR = 0.135;
const DOMAIN_CONTACT_FRACTION = 0.65;
const SWEEP_DOMAIN_N = 48;
const REGISTERED_TARGET_EXTENT = 21;
const TEMPERATURE_GRID = Array.from({ length: 34 }, (_, i) => -2 - i); // -2 .. -35
const SIGMA_FRACTIONS = [0.1, 0.15, 0.25, 0.4, 0.6, 0.9];
const REGIMES = [
  { regime: "plates-warm", warmerBoundC: Infinity, colderBoundC: -3.3, accepts: ["plate"], inHeadline: true },
  { regime: "columns", warmerBoundC: -3.3, colderBoundC: -9.9, accepts: ["column"], inHeadline: true },
  { regime: "plates-cold", warmerBoundC: -9.9, colderBoundC: -21.5, accepts: ["plate"], inHeadline: true },
  { regime: "columns-and-plates", warmerBoundC: -21.5, colderBoundC: -Infinity, accepts: ["plate", "column"], inHeadline: false },
];

// ARM 2's OWN registered values (ADR 0036, and the arm-2 freeze at 483f7ee):
const ARM_ID = "arm2-sdak-m1";
const PARAM_SET = "M1";
const BISTABLE_C = [-4, -5, -6]; // freeze row `bistable-band`
const VALUES_SHA256 = "13e678d5eec467a391958a18c71c8d170900d6efd0d5c23bb4362d863b9acd76";
const PROTOCOL_SHA256 = "b09a932ec7345eddf838ee2de1c0ef4731212c625a1069e62193c06ae950fdec";
const FREEZE_COMMIT = "483f7ee56cbbcd5017658aa4879a3a9b87c56809";

// The REGISTERED EXPECTATION, transcribed from ADR 0036 Part 2 so this verifier can state whether
// the arm hit its own pre-registration. Reporting the prediction beside the result is the whole
// point of having registered one.
const PREDICTED = {
  commonDenominator: { agree: 42, total: 90 },
  armDenominator: { agree: 42, total: 78 },
  perRegime: { "plates-warm": { agree: 4, n: 6 }, columns: { agree: 0, n: 12 }, "plates-cold": { agree: 38, n: 60 } },
  rangeAcrossFitForms: [42, 66],
};

const outDir = process.argv[2] ?? join(process.cwd(), "out", "phase6-sweep-arm2");
const failures = [];
const note = (m) => failures.push(m);

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

// ── 0. The artifact set, and WHICH ARM it claims to be ───────────────────────────────────────
console.log(`artifacts: ${outDir}`);
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
  console.log("PHASE6 ARM2 INDEPENDENT VERIFY: FAIL");
  process.exit(1);
}

const points = JSON.parse(readFileSync(join(outDir, "points.json"), "utf8"));
const published = JSON.parse(readFileSync(join(outDir, "report.json"), "utf8"));

// The arm-identity fields exist BECAUSE a report without them is indistinguishable from the other
// arm's except by directory name. Check them before anything else: if this is arm 1's artifact in
// arm 2's directory, nothing below means what it says.
if (published.arm !== ARM_ID) note(`report.json claims arm "${published.arm}", not "${ARM_ID}"`);
if (published.paramSet !== PARAM_SET) note(`report.json claims paramSet "${published.paramSet}", not "${PARAM_SET}"`);
if (published.valuesSha256 !== VALUES_SHA256) {
  note(`report.json's gated values hash is ${published.valuesSha256}, not the registered ${VALUES_SHA256}`);
}
if (published.protocolSha256 !== PROTOCOL_SHA256) {
  note(`report.json's protocol hash is ${published.protocolSha256}, not arm 2's ${PROTOCOL_SHA256}`);
}
const svg = readFileSync(join(outDir, "diagram.svg"), "utf8");
if (!svg.includes("SDAK (M1)")) note("diagram.svg is not titled as the SDAK arm");
if (svg.includes("no-SDAK habit")) note("diagram.svg is titled as the NO-SDAK arm");

// ── 1. Every row ran under arm 2's parameter set, by its OWN report ──────────────────────────
//
// The per-row `config` is the child's self-reported header. It is what makes a spliced row from the
// other arm detectable: arm 1's rows say paramSet=CAK.
//
// EVERY row must carry one, and that requirement is not pedantry — it is negative controls C7 and
// C8 (`app/scripts/phase6-arm2-negative-controls.mjs`). This loop originally skipped rows with no
// config and merely PRINTED how many had one. Both forgeries passed verification unchanged:
//
//   C7 — six real arm-1 rows spliced in at their own grid points. Arm 1 predates per-row config
//        (erratum E3), so the spliced rows carried none and the check simply did not look at them.
//   C8 — `config` deleted from all 204 rows. An artifact stripped of every trace of which parameter
//        set produced it verified clean, because a check that only inspects rows that HAVE the field
//        is disarmed by removing the field.
//
// A check that an absent field cannot fail is not a check. Missing config is now a FAILURE.
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
  if (c.stopReason !== "size-target") {
    if (e.exclusionReason === null) {
      note(`T=${e.point.tempC} f=${e.point.fraction} ended on "${c.stopReason}" yet is scored`);
    }
  }
  if (c.tempC !== e.point.tempC) note(`T=${e.point.tempC} row reports a run at ${c.tempC} C`);
}
if (noConfig.length > 0) {
  note(
    `${noConfig.length} of ${points.length} rows carry NO per-row config, so they cannot say which ` +
      `parameter set produced them (first: ${noConfig.slice(0, 3).join(", ")}) — negative controls C7/C8`,
  );
}
// WHAT THIS STILL CANNOT DO, stated rather than implied. The per-row config is SELF-REPORTED. A
// spliced foreign row whose config was also forged to say M1 is indistinguishable from a genuine
// one by any inspection of the artifact alone. Detecting that needs the source-graph digest and the
// execution-time provenance record, not this file.

// ── 2. The row set is exactly the registered grid ────────────────────────────────────────────
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

// ── 3. Re-derive every class, score and scope ────────────────────────────────────────────────
const classify = (ar) => (!Number.isFinite(ar) || ar <= 0 ? "invalid" : ar <= PLATE_CEILING ? "plate" : ar >= COLUMN_FLOOR ? "column" : "neutral");
const regimeOf = (t) => REGIMES.find((r) => t > r.colderBoundC && t <= r.warmerBoundC);
const distToBoundary = (t) => Math.min(...BOUNDARIES_C.map((b) => Math.abs(t - b)));
const inBand = (t) => distToBoundary(t) <= AMBIGUITY_HALF_WIDTH_C;
const isBistable = (t) => BISTABLE_C.includes(t);
/** ADR 0036 pre-registration 2: the bistable band accepts BOTH pure classes; neutral still fails. */
const scoreArm2 = (t, cls) => {
  if (cls === "invalid") return "excluded";
  if (isBistable(t)) return cls === "neutral" ? "disagree" : "agree";
  return regimeOf(t).accepts.includes(cls) ? "agree" : "disagree";
};
const scoreArm1 = (t, cls) => (cls === "invalid" ? "excluded" : regimeOf(t).accepts.includes(cls) ? "agree" : "disagree");
const inHeadlineArm2 = (t) => regimeOf(t).inHeadline && !inBand(t) && !isBistable(t);
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
  if (r.config && r.config.stopReason !== "size-target") invalid.push("stop-reason"); // ADR 0035

  const cls = invalid.length > 0 ? "invalid" : classify(r.aspectRatio);
  const score = scoreArm2(e.point.tempC, cls);
  const head = inHeadlineArm2(e.point.tempC);
  if (cls !== e.modelClass) { reclassified += 1; note(`T=${e.point.tempC} f=${e.point.fraction}: class ${cls} vs published ${e.modelClass}`); }
  if (score !== e.score) { rescored += 1; note(`T=${e.point.tempC} f=${e.point.fraction}: score ${score} vs published ${e.score}`); }
  if (head !== e.inHeadlineScope) note(`T=${e.point.tempC} f=${e.point.fraction}: headline ${head} vs published ${e.inHeadlineScope}`);
  const frag = cls !== "invalid" && extentFragile(r.aspectRatio);
  if (frag !== e.extentFragile) note(`T=${e.point.tempC} f=${e.point.fraction}: extentFragile ${frag} vs published ${e.extentFragile}`);
  mine.push({ ...e, cls, score, head });
}

// ── 4. Re-derive the report, INCLUDING the invariant the freeze review added ─────────────────
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
// The invariant the freeze review's blocker 1 was found by: a per-regime table scoped by a different
// rule than its headline is not a breakdown of that headline.
const rowSumAgree = perRegime.filter((t) => t.inHeadline).reduce((n, t) => n + t.agree, 0);
const rowSumTotal = perRegime.filter((t) => t.inHeadline).reduce((n, t) => n + t.agree + t.disagree, 0);
if (rowSumAgree !== headlineAgree || rowSumTotal !== headlineTotal) {
  note(`perRegime does not sum to the headline: ${rowSumAgree}/${rowSumTotal} vs ${headlineAgree}/${headlineTotal}`);
}
// The bistable band's own count — a REGISTERED obligation, so a missing field is a failure.
const bist = mine.filter((s) => isBistable(s.point.tempC));
compare("bistable.points", bist.length, published.bistable?.points);
compare("bistable.agree", bist.filter((s) => s.score === "agree").length, published.bistable?.agree);
compare("bistable.neutralCount", bist.filter((s) => s.cls === "neutral").length, published.bistable?.neutralCount);

// ── 5. Report, with the PRE-REGISTERED prediction beside the result ──────────────────────────
console.log("");
console.log("re-derived independently of runner/src:");
console.log(`  arm                    ${published.arm} (paramSet ${published.paramSet})`);
console.log(`  freeze commit          ${FREEZE_COMMIT}`);
console.log(`  points                 ${mine.length}   config-carrying ${withConfig}`);
console.log(`  HEADLINE               ${headlineAgree}/${headlineTotal}   (predicted ${PREDICTED.armDenominator.agree}/${PREDICTED.armDenominator.total})`);
console.log(`  common denominator     ${commonAgree}/${commonTotal}   (predicted ${PREDICTED.commonDenominator.agree}/${PREDICTED.commonDenominator.total}, arm 1 measured 3/90)`);
const classes = {};
for (const s of mine) classes[s.cls] = (classes[s.cls] ?? 0) + 1;
console.log(`  classes                ${JSON.stringify(classes)}`);
console.log(`  extent-fragile         ${mine.filter((s) => s.cls !== "invalid" && extentFragile(s.result.aspectRatio)).length}`);
console.log(`  excluded (named)       ${mine.filter((s) => s.score === "excluded").length}`);
console.log(`  bistable band          ${bist.length} points, ${bist.filter((s) => s.score === "agree").length} agree, ${bist.filter((s) => s.cls === "neutral").length} neutral`);
for (const t of perRegime) {
  const pred = PREDICTED.perRegime[t.regime];
  const predText = pred ? `  (predicted ${pred.agree}/${pred.n})` : "";
  console.log(`    ${t.regime.padEnd(20)} n=${String(t.agree + t.disagree + t.excluded).padStart(3)}  agree=${String(t.agree).padStart(3)}  neutral=${String(t.neutralCount).padStart(3)}${predText}`);
}

console.log("");
if (failures.length === 0) {
  console.log(`VERIFIED: ${mine.length} points re-derived; every class, score, headline flag,`);
  console.log("extent-fragile flag, per-regime tally, bistable count and arm-identity field matches.");
  console.log("PHASE6 ARM2 INDEPENDENT VERIFY: PASS");
} else {
  console.log(`DISAGREEMENTS: ${failures.length} (${reclassified} class, ${rescored} score)`);
  for (const f of failures.slice(0, 40)) console.log(`  - ${f}`);
  if (failures.length > 40) console.log(`  ... and ${failures.length - 40} more`);
  console.log("PHASE6 ARM2 INDEPENDENT VERIFY: FAIL");
  process.exit(1);
}
