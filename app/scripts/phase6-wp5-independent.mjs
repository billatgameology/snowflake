// Phase 6 WP5 — the INDEPENDENT verifier: re-derive report.json from points.json.
//
// Rule 9 requires that a verdict be computed from published artifacts, and that no component
// supply both sides of a check. So this module deliberately imports NOTHING from runner/src:
// not `phase6-sweep.ts`, which produced `report.json`, and not `phase6-protocol.ts`, which holds
// the rules. Importing either would make this a re-run of the thing under test rather than a check
// on it.
//
// Every rule below is transcribed from the ADR that registered it, with the ADR cited, and every
// threshold is written as a literal here so a drift between the protocol and the ADR shows up as a
// disagreement instead of being silently inherited. If this file and the harness ever disagree,
// that IS the finding — do not reconcile by importing.
//
//   node app/scripts/phase6-wp5-independent.mjs [outDir]
//
// Exit 0 if every re-derived quantity matches the published report; exit 1 otherwise.

import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// ── Registered rules, transcribed from the ADRs rather than imported ─────────────────────────
//
// docs/decisions/0025-phase6-agreement-scoring-rule.md:
//   - regimes are half-open (colderBoundC, warmerBoundC], keyed to -3.3, -9.9, -21.5
//   - plates-warm accepts plate; columns accepts column; plates-cold accepts plate;
//     columns-and-plates accepts plate OR column and is NOT in the headline
//   - neutral scores DISAGREE; invalid scores EXCLUDED by name
//   - a point counts toward the headline only if its regime is in headline scope AND it is
//     outside the +/-1.0 C ambiguity band
// runner freeze row `metric-thresholds`: plate AR <= 1/1.5, column AR >= 1.5, else neutral
const PLATE_CEILING = 1 / 1.5;
const COLUMN_FLOOR = 1.5;
const BOUNDARIES_C = [-3.3, -9.9, -21.5];
const AMBIGUITY_HALF_WIDTH_C = 1.0;
const EXTENT_DRIFT_BOUND_AR = 0.135; // freeze row `uncertainty-reporting`
const DOMAIN_CONTACT_FRACTION = 0.65; // PHASE6_DOMAIN_CONTACT_GUARD_FRACTION
const SWEEP_DOMAIN_N = 48; // PHASE6_SWEEP_DOMAIN_N
const REGISTERED_TARGET_EXTENT = 21; // PHASE6_CROSSPLATFORM_FIXTURE.targetExtent
const TEMPERATURE_GRID = Array.from({ length: 34 }, (_, i) => -2 - i); // -2 .. -35
const SIGMA_FRACTIONS = [0.1, 0.15, 0.25, 0.4, 0.6, 0.9];
/** Arm-1 artifact digests — PHASE6_ARM1_ARTIFACT_DIGESTS, transcribed. */
const ARM1_DIGESTS = [
  { path: "points.json", byteLength: 129760, sha256: "0ed613bce61e44829f722e069a818e0da4981ecd34829b0b49eaba15e11cf89a" },
  { path: "report.json", byteLength: 928, sha256: "71ae094c38778b0d2c62f3952e4ca641c0bc8f5d91b350248c5c78800830f2a9" },
  { path: "diagram.svg", byteLength: 31193, sha256: "40458703061af5b54d6629484aa84762fb995a15f5443904c3462d2ff5939234" },
];

const REGIMES = [
  { regime: "plates-warm", warmerBoundC: Infinity, colderBoundC: -3.3, accepts: ["plate"], inHeadline: true },
  { regime: "columns", warmerBoundC: -3.3, colderBoundC: -9.9, accepts: ["column"], inHeadline: true },
  { regime: "plates-cold", warmerBoundC: -9.9, colderBoundC: -21.5, accepts: ["plate"], inHeadline: true },
  { regime: "columns-and-plates", warmerBoundC: -21.5, colderBoundC: -Infinity, accepts: ["plate", "column"], inHeadline: false },
];

function classify(ar) {
  if (!Number.isFinite(ar) || ar <= 0) return "invalid";
  if (ar <= PLATE_CEILING) return "plate";
  if (ar >= COLUMN_FLOOR) return "column";
  return "neutral";
}

/**
 * DIRECTIONAL on purpose, and this verifier got it wrong on the first pass — worth recording,
 * because it is what an independent check is for.
 *
 * The registered rule flags a point only when its AR sits within the drift bound BELOW a class
 * threshold: extent drift RAISES AR, so a point just above a threshold is not at risk from it. My
 * first implementation used a symmetric window |AR - threshold| <= bound, which flagged 59 points
 * against the harness's 16. The disagreement was adjudicated against the registered definition and
 * the HARNESS was correct; this file was the defective side. Nothing was reconciled by importing.
 */
function isExtentFragile(ar) {
  for (const threshold of [PLATE_CEILING, COLUMN_FLOOR]) {
    if (ar < threshold && ar >= threshold - EXTENT_DRIFT_BOUND_AR) return true;
  }
  return false;
}

/** Half-open (colderBoundC, warmerBoundC], so a boundary temperature belongs to its cold side. */
function regimeOf(tempC) {
  for (const r of REGIMES) if (tempC > r.colderBoundC && tempC <= r.warmerBoundC) return r;
  throw new Error(`no regime for T=${tempC}`);
}

function inAmbiguityBand(tempC) {
  return BOUNDARIES_C.some((b) => Math.abs(tempC - b) <= AMBIGUITY_HALF_WIDTH_C);
}

/** ADR 0025: invalid is EXCLUDED BY NAME, neutral DISAGREES, otherwise accepted-class membership. */
function score(tempC, modelClass) {
  if (modelClass === "invalid") return "excluded";
  return regimeOf(tempC).accepts.includes(modelClass) ? "agree" : "disagree";
}

/** A run that did not happen properly is not a statement about the model. Reasons are named. */
function invalidReasons(r) {
  const out = [];
  if (!r.allConverged) out.push("a relaxation did not converge");
  if (!r.deltaSymClean) out.push("a per-tick attachment delta broke D6h invariance");
  if (r.symmetryError !== 0) out.push(`symmetryError = ${r.symmetryError} with noise off`);
  // RECOMPUTED from geometry, never read from the artifact. The pin register set domainContact=true
  // on 87 headline disagreements, turning them into named exclusions so the headline read 3 of 3, and
  // this verifier certified it because it trusted the published boolean. 21/48 = 0.4375 < 0.65.
  const contactByGeometry = r.largestExtent / SWEEP_DOMAIN_N > DOMAIN_CONTACT_FRACTION;
  if (contactByGeometry) out.push("tripped the 65% domain-contact guard");
  if (r.domainContact !== contactByGeometry) {
    out.push(
      `PUBLISHED domainContact=${r.domainContact} disagrees with geometry ` +
        `(${r.largestExtent}/${SWEEP_DOMAIN_N} = ${(r.largestExtent / SWEEP_DOMAIN_N).toFixed(4)} vs ${DOMAIN_CONTACT_FRACTION})`,
    );
  }
  return out;
}

// ── Verify ──────────────────────────────────────────────────────────────────────────────────
const outDir = process.argv[2] ?? join(process.cwd(), "out", "phase6-sweep");
const raw = readFileSync(join(outDir, "points.json"));
const points = JSON.parse(raw.toString("utf8"));
const published = JSON.parse(readFileSync(join(outDir, "report.json"), "utf8"));

const failures = [];
const note = (message) => failures.push(message);

console.log("PHASE 6 WP5 — INDEPENDENT VERIFICATION");
console.log(`artifacts: ${outDir}`);
let digestsRegistered = 0;
for (const name of ["points.json", "report.json", "diagram.svg"]) {
  const bytes = readFileSync(join(outDir, name));
  const size = statSync(join(outDir, name)).size;
  const sha = createHash("sha256").update(bytes).digest("hex");
  const expected = ARM1_DIGESTS.find((d) => d.path === name);
  const match = expected !== undefined && expected.sha256 === sha && expected.byteLength === size;
  if (match) digestsRegistered++;
  console.log(`  ${name.padEnd(13)} ${String(size).padStart(8)} bytes  ${sha}  ${match ? "== registered" : "NOT the registered arm-1 digest"}`);
  if (expected !== undefined && !match) {
    note(
      `${name}: sha256 ${sha} (${size} bytes) does not match the registered arm-1 digest ` +
        `${expected.sha256} (${expected.byteLength} bytes) — this is not the published artifact`,
    );
  }
}
if (digestsRegistered === 0) {
  note(
    "not one artifact matches a registered digest, so this directory cannot be identified as any " +
      "published arm — the superseded CAK_A1 arm has the same shape and would otherwise verify",
  );
}

// 1. Re-derive every per-point verdict from the raw measurement, ignoring the published one.
let reclassified = 0;
let rescored = 0;
const mine = [];
for (const entry of points) {
  const r = entry.result;
  const reasons = invalidReasons(r);
  const modelClass = reasons.length > 0 ? "invalid" : classify(r.aspectRatio);
  const spec = regimeOf(entry.point.tempC);
  const band = inAmbiguityBand(entry.point.tempC);
  const derived = {
    tempC: entry.point.tempC,
    fraction: entry.point.fraction,
    modelClass,
    regime: spec.regime,
    score: score(entry.point.tempC, modelClass),
    inHeadlineScope: spec.inHeadline && !band,
    extentFragile: modelClass !== "invalid" && isExtentFragile(r.aspectRatio),
    exclusionReason: reasons.length > 0 ? reasons.join("; ") : null,
  };
  mine.push(derived);

  if (derived.modelClass !== entry.modelClass) {
    reclassified++;
    note(
      `T=${entry.point.tempC} f=${entry.point.fraction}: published class ${entry.modelClass}, ` +
        `re-derived ${derived.modelClass} from AR=${r.aspectRatio}`,
    );
  }
  if (derived.score !== entry.score) {
    rescored++;
    note(`T=${entry.point.tempC} f=${entry.point.fraction}: published score ${entry.score}, re-derived ${derived.score}`);
  }
  if (derived.regime !== entry.regime) note(`T=${entry.point.tempC}: published regime ${entry.regime}, re-derived ${derived.regime}`);
  if (derived.inHeadlineScope !== entry.inHeadlineScope) {
    note(`T=${entry.point.tempC} f=${entry.point.fraction}: headline scope ${entry.inHeadlineScope} vs re-derived ${derived.inHeadlineScope}`);
  }
  if (derived.extentFragile !== entry.extentFragile) {
    note(`T=${entry.point.tempC} f=${entry.point.fraction}: extentFragile ${entry.extentFragile} vs re-derived ${derived.extentFragile}`);
  }
  // An exclusion must be NAMED, never silent (ADR 0025).
  if ((derived.exclusionReason === null) !== (entry.exclusionReason === null)) {
    note(`T=${entry.point.tempC} f=${entry.point.fraction}: exclusionReason presence disagrees`);
  }
}

// 2. Re-derive the aggregate the report publishes.
const headline = mine.filter((p) => p.inHeadlineScope);
const agree = headline.filter((p) => p.score === "agree").length;
const classes = {};
for (const p of mine) classes[p.modelClass] = (classes[p.modelClass] ?? 0) + 1;

console.log("\nre-derived independently of runner/src:");
console.log(`  points                 ${mine.length}`);
console.log(`  headline scope         ${headline.length}`);
console.log(`  HEADLINE agree         ${agree}`);
console.log(`  classes                ${JSON.stringify(classes)}`);
console.log(`  extent-fragile         ${mine.filter((p) => p.extentFragile).length}`);
console.log(`  excluded (named)       ${mine.filter((p) => p.exclusionReason !== null).length}`);
for (const spec of REGIMES) {
  const g = mine.filter((p) => p.regime === spec.regime);
  const h = g.filter((p) => p.inHeadlineScope);
  console.log(
    `    ${spec.regime.padEnd(20)} n=${String(g.length).padStart(3)}  headline=${String(h.length).padStart(3)}` +
      `  agree=${String(h.filter((p) => p.score === "agree").length).padStart(3)}` +
      `  neutral=${String(g.filter((p) => p.modelClass === "neutral").length).padStart(3)}`,
  );
}

// 3. Compare EVERY field report.json publishes, and the row set itself.
//
// The previous version compared only `headlineAgree` and printed a NOTE when it could not find a
// comparable field — so the pin register set headlineTotal 90->30, neutralCount 168->4,
// extentFragileCount 16->0 and excludedCount 0->99, duplicated a row 30x and deleted 20
// disagreements, and this verifier printed its own correct numbers immediately above "PASS".
const required = (name, derived) => {
  if (!(name in published)) {
    note(`report.json omits ${name}, so it cannot be verified — failing closed rather than skipping`);
    return;
  }
  if (published[name] !== derived) note(`report.json claims ${name} = ${published[name]}, re-derived ${derived}`);
};
required("headlineAgree", agree);
required("headlineTotal", headline.filter((p) => p.score !== "excluded").length);
required("neutralCount", mine.filter((p) => p.modelClass === "neutral").length);
required("excludedCount", mine.filter((p) => p.exclusionReason !== null).length);
required("extentFragileCount", mine.filter((p) => p.extentFragile).length);
required("protocolSha256", published.protocolSha256); // presence only; the value is pinned below
if (!("head" in published)) note("report.json omits head, so the execution commit is unverifiable");
if (!Array.isArray(published.excludedPoints)) note("report.json's excludedPoints is not an array");
else if (published.excludedPoints.length !== mine.filter((p) => p.exclusionReason !== null).length) {
  note(`excludedPoints lists ${published.excludedPoints.length} entries, re-derived ${mine.filter((p) => p.exclusionReason !== null).length}`);
}

// Per-regime block, field by field.
if (!Array.isArray(published.perRegime)) note("report.json's perRegime is not an array");
else {
  for (const spec of REGIMES) {
    const claimed = published.perRegime.find((x) => x.regime === spec.regime);
    if (claimed === undefined) {
      note(`perRegime omits ${spec.regime}`);
      continue;
    }
    // The registered convention (phase6Aggregate): every point in the regime EXCLUDING the
    // ambiguity band — NOT headline scope. My first pass filtered by headline scope and disagreed on
    // six tallies; adjudicated against the code, the harness was right and this file was wrong for
    // the third time. `inAmbiguityBand` is RECOMPUTED from tempC, not read from the artifact, for the
    // same reason `domainContact` now is.
    const g = mine.filter((p) => p.regime === spec.regime && !inAmbiguityBand(p.tempC));
    const checks = {
      agree: g.filter((p) => p.score === "agree").length,
      disagree: g.filter((p) => p.score === "disagree").length,
      excluded: g.filter((p) => p.score === "excluded").length,
      neutralCount: g.filter((p) => p.modelClass === "neutral").length,
      extentFragile: g.filter((p) => p.extentFragile).length,
    };
    for (const [key, derived] of Object.entries(checks)) {
      if (key in claimed && claimed[key] !== derived) {
        note(`perRegime[${spec.regime}].${key} claims ${claimed[key]}, re-derived ${derived}`);
      }
    }
  }
}

// The ROW SET must be exactly the registered grid — no duplicates, no deletions, no extras.
// This is what makes "duplicate an agreeing row 30x" and "delete 20 disagreements" detectable.
const expectedKeys = new Set();
for (const t of TEMPERATURE_GRID) for (const f of SIGMA_FRACTIONS) expectedKeys.add(`${t}|${f}`);
const seen = new Map();
for (const entry of points) {
  const key = `${entry.point.tempC}|${entry.point.fraction}`;
  seen.set(key, (seen.get(key) ?? 0) + 1);
}
if (points.length !== expectedKeys.size) {
  note(`points.json has ${points.length} rows, the registered grid has ${expectedKeys.size}`);
}
for (const [key, count] of seen) {
  if (count > 1) note(`grid point ${key} appears ${count} times — duplicated row`);
  if (!expectedKeys.has(key)) note(`grid point ${key} is not on the registered grid`);
}
for (const key of expectedKeys) if (!seen.has(key)) note(`registered grid point ${key} is MISSING`);

// Measurement size: recorded on every row and, until now, checked by nothing.
//
// `<` rather than `!==`, matching the rule ADR 0035 registered. Extent can rise by two in a step, so
// a legitimate run can end at 22; invalidating that would be a different defect from the one this
// closes. Every arm-1 row is in fact exactly 21, which is reported below rather than assumed.
let atExactSize = 0;
for (const entry of points) {
  if (entry.result.largestExtent === REGISTERED_TARGET_EXTENT) atExactSize += 1;
  if (entry.result.largestExtent < REGISTERED_TARGET_EXTENT && entry.exclusionReason === null) {
    note(
      `T=${entry.point.tempC} f=${entry.point.fraction} was measured at extent ` +
        `${entry.result.largestExtent}, short of the registered ${REGISTERED_TARGET_EXTENT}, yet is ` +
        "scored — habit is size-dependent, so this is not a comparable measurement",
    );
  }
}

// ADR 0035's stop-reason half, and its NAMED limitation. Arm 1 predates per-row `config`, so its
// rows cannot be checked for how they ended. That gap is PRINTED rather than left implicit: a
// verifier that silently skips a check it cannot run is how the step-cap fabrication survived.
const withConfig = points.filter((e) => e.result.config !== null && e.result.config !== undefined);
for (const entry of withConfig) {
  if (entry.result.config.stopReason !== "size-target" && entry.exclusionReason === null) {
    note(
      `T=${entry.point.tempC} f=${entry.point.fraction} ended on stop reason ` +
        `"${entry.result.config.stopReason}", not "size-target", yet is scored`,
    );
  }
}
console.log(
  `measurement size: ${atExactSize}/${points.length} rows at exactly extent ${REGISTERED_TARGET_EXTENT}; ` +
    `${withConfig.length}/${points.length} rows carry a self-reported run config.`,
);
if (withConfig.length === 0) {
  console.log(
    "  LIMITATION, stated not skipped: no row records how its run ended, so the ADR 0035 stop-reason",
  );
  console.log(
    "  check cannot be applied to this artifact. Reaching extent 21 does imply the size-target",
  );
  console.log(
    "  condition fired — the growth loop cannot continue past it — so the extent check above carries",
  );
  console.log("  the claim, and the stop reason is corroboration this arm does not have.");
}

console.log("");
if (failures.length === 0) {
  console.log(`VERIFIED: ${mine.length} points re-derived, every class, regime, score, headline-scope`);
  console.log("flag, extent-fragile flag and exclusion reason matches the published artifact.");
  console.log("PHASE6 WP5 INDEPENDENT VERIFY: PASS");
} else {
  console.log(`DISAGREEMENTS: ${failures.length} (${reclassified} class, ${rescored} score)`);
  for (const f of failures.slice(0, 40)) console.log(`  - ${f}`);
  if (failures.length > 40) console.log(`  ... and ${failures.length - 40} more`);
  console.log("PHASE6 WP5 INDEPENDENT VERIFY: FAIL");
  process.exit(1);
}
