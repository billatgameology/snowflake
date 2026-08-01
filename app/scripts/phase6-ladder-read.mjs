// Phase 6 — read the columns ladder against its PRE-REGISTERED outcomes.
//
// WRITTEN BEFORE THE DECIDING DATA LANDED. At the time this file was committed the ladder had
// returned P3-B and P4-B and neither P1-B (the 1.4000 candidate, the point the whole diagnostic is
// about) nor any rung C. Defining the ruler after seeing the number is exactly what
// `docs/phase6-columns-refinement-prereg.md` exists to prevent, so the rule is fixed here first.
//
// ── The representable AR ladder, derived rather than assumed ──────────────────────────────────
//
// `AR = zExtent / tExtent` with, from `core/src/lattice.ts`, the Cartesian embedding
// `x = i + j/2`, `y = j·√3/2`, `z = k`, and from `core/src/metrics.ts`
// `tExtent = max(xMax−xMin, yMax−yMin) + 1`, `zExtent = kMax−kMin+1`. With i, j, k integers:
//
//   Δx is a multiple of 1/2      →  tExtent ∈ { 1 + n/2   : n = 0,1,2,… }
//   Δy is a multiple of √3/2     →  tExtent ∈ { 1 + m·√3/2 : m = 0,1,2,… }
//   zExtent is an integer
//
// so the achievable ARs at a given zExtent form a computable discrete set. Checked against measured
// values before being used: 1.40000 = 21/15, 1.26594 = 21/(1+18·√3/2), 1.33122 = 29/(1+24·√3/2),
// 1.31818 = 29/22 — all exact.
//
// ── A LATENT GAP IN MY OWN PRE-REGISTRATION, found by running this ────────────────────────────
//
// The first version of this file computed the step from the lattice arithmetic above and printed
// `step 0.0000`. The derivation is right about what the LATTICE permits and wrong about what the
// INSTRUMENT resolves: the two tExtent families interleave arbitrarily closely — 26·√3/2 = 22.516
// sits 0.016 from 22.5 — so the permitted set is nearly dense and its local gap is not a resolution
// scale at all.
//
// What a grown crystal actually realizes is far coarser, because D6h symmetry couples Δx and Δy
// instead of letting them range independently: **408 measurements produced 36 distinct AR values**,
// and near the column floor at zExtent 21 the realized ladder is 1.3125, 1.4000, 1.5000, 1.6154 —
// steps of 0.0875 and 0.1000.
//
// So the realized step is an EMPIRICAL quantity, and it is only established where many crystals were
// measured. At zExtent 21 there are 408 of them. At the ladder's new sizes there are a handful.
//
// **The pre-registration assumed a representable step would be computable at every rung. It is not.**
// That is a defect in the registration, recorded rather than papered over, and it changes what may
// be concluded:
//
//   OUTCOME 1 (the columns verdict is a measurement-size artifact) requires a rung to reach
//   AR ≥ 1.5. UNAMBIGUOUS — it needs no notion of a step, and it is evaluated normally below.
//
//   OUTCOME 3 (AR falls) and OUTCOME 4 (non-monotone) are directional. UNAMBIGUOUS.
//
//   OUTCOME 2 (flat, therefore size-converged) requires "within one representable step", and the
//   step at the new rungs is NOT ESTABLISHED from two crystals. It is therefore reported with the
//   extent-21 step (0.0875–0.1000 near the floor) as the only measured scale available, and
//   explicitly flagged as resting on a threshold imported from a different measurement size.
//   Declaring "size-converged" is the stronger scientific claim, so it does not get the benefit of
//   an invented threshold.
//
//   node app/scripts/phase6-ladder-read.mjs

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const COLUMN_FLOOR = 1.5;
const DEFAULT_LADDER = join(process.cwd(), "evidence", "phase6-columns-ladder", "ladder.json");

function requestedLadderPath(args) {
  if (args.length === 0) return DEFAULT_LADDER;
  if (args.length === 2 && args[0] === "--ladder" && args[1].length > 0) return resolve(args[1]);
  throw new Error("usage: node app/scripts/phase6-ladder-read.mjs [--ladder PATH]");
}

const LADDER = requestedLadderPath(process.argv.slice(2));

/**
 * The REALIZED step of the instrument near `ar`, measured from the 408 published crystals at the
 * registered measurement size. Empirical, because the lattice-permitted set is nearly dense and
 * bears no relation to what a D6h-symmetric grown crystal can produce.
 */
const REALIZED_AR_AT_EXTENT_21 = (() => {
  const values = new Set();
  for (const dir of ["phase6-sweep", "phase6-sweep-arm2"]) {
    for (const e of JSON.parse(readFileSync(join(process.cwd(), "evidence", dir, "points.json"), "utf8"))) {
      if (Number.isFinite(e.result.aspectRatio) && e.result.aspectRatio > 0) values.add(e.result.aspectRatio);
    }
  }
  return [...values].sort((a, b) => a - b);
})();

/** Local step near `ar` in the realized ladder; NaN if `ar` sits outside the sampled range. */
function realizedStepNear(ar) {
  let below = null;
  let above = null;
  for (const v of REALIZED_AR_AT_EXTENT_21) {
    if (v < ar - 1e-9) below = v;
    if (v > ar + 1e-9) { above = v; break; }
  }
  const gaps = [below === null ? null : ar - below, above === null ? null : above - ar].filter((g) => g !== null);
  return gaps.length === 0 ? Number.NaN : Math.min(...gaps);
}

const EXPECTED_POINTS = Object.freeze({
  P1: Object.freeze({ arm: "arm2", paramSet: "M1", tempC: -5, fraction: 0.1, sigmaInf: "0.005000", publishedAR: 1.4 }),
  P2: Object.freeze({ arm: "arm2", paramSet: "M1", tempC: -4, fraction: 0.1, sigmaInf: "0.004000", publishedAR: 1.23529 }),
  P3: Object.freeze({ arm: "arm2", paramSet: "M1", tempC: -5, fraction: 0.9, sigmaInf: "0.045000", publishedAR: 1.26594 }),
  P4: Object.freeze({ arm: "arm1", paramSet: "CAK", tempC: -5, fraction: 0.9, sigmaInf: "0.045000", publishedAR: 1.3125 }),
});
const EXPECTED_RUNGS = Object.freeze({
  A: Object.freeze({ dimsN: 48, requestedExtent: 21 }),
  B: Object.freeze({ dimsN: 64, requestedExtent: 28 }),
  C: Object.freeze({ dimsN: 80, requestedExtent: 35 }),
});
const EXPECTED_EXTRAS = Object.freeze({
  "P1-B80": Object.freeze({ ...EXPECTED_POINTS.P1, dimsN: 80, requestedExtent: 28 }),
  "P1-C64": Object.freeze({ ...EXPECTED_POINTS.P1, dimsN: 64, requestedExtent: 35 }),
  "P1-D": Object.freeze({ ...EXPECTED_POINTS.P1, dimsN: 64, requestedExtent: 41 }),
  "P1-D80": Object.freeze({ ...EXPECTED_POINTS.P1, dimsN: 80, requestedExtent: 41 }),
  "P4-D": Object.freeze({ ...EXPECTED_POINTS.P4, dimsN: 64, requestedExtent: 41 }),
  "P5-B": Object.freeze({
    arm: "arm1",
    paramSet: "CAK",
    tempC: -5,
    fraction: 0.1,
    sigmaInf: "0.005000",
    publishedAR: 0.789474,
    dimsN: 64,
    requestedExtent: 28,
  }),
});
const POINT_IDS = Object.freeze(Object.keys(EXPECTED_POINTS));
const RUNG_IDS = Object.freeze(Object.keys(EXPECTED_RUNGS));

function assertEvidence(condition, message) {
  if (!condition) throw new Error(`invalid registered ladder evidence: ${message}`);
}

function sameValue(actual, expected, label) {
  assertEvidence(Object.is(actual, expected), `${label}: expected ${String(expected)}, got ${String(actual)}`);
}

function validateExecutionRow(row, label) {
  assertEvidence(row !== null && typeof row === "object", `${label} is not an object`);
  sameValue(row.error, null, `${label}.error`);
  sameValue(row.stopReason, "size-target", `${label}.stopReason`);
  sameValue(row.allConverged, true, `${label}.allConverged`);
  sameValue(row.deltaSymClean, true, `${label}.deltaSymClean`);
  sameValue(row.symmetryError, 0, `${label}.symmetryError`);
  assertEvidence(Number.isInteger(row.dimsN) && row.dimsN > 0, `${label}.dimsN is not a positive integer`);
  assertEvidence(Number.isInteger(row.requestedExtent) && row.requestedExtent > 0, `${label}.requestedExtent is not a positive integer`);
  assertEvidence(Number.isFinite(row.aspectRatio) && row.aspectRatio > 0, `${label}.aspectRatio is not positive and finite`);
  assertEvidence(Number.isInteger(row.extent) && row.extent >= row.requestedExtent, `${label}.extent did not reach the requested extent`);
  assertEvidence(row.extent / row.dimsN <= 0.65, `${label} reaches the domain-contact guard`);
  assertEvidence(Number.isInteger(row.attached) && row.attached > 0, `${label}.attached is not a positive integer`);
  assertEvidence(row.header !== null && typeof row.header === "object", `${label}.header is absent`);
  sameValue(row.header.dimsN, row.dimsN, `${label}.header.dimsN`);
  sameValue(row.header.targetExtent, row.requestedExtent, `${label}.header.targetExtent`);
  sameValue(row.header.paramSet, row.paramSet, `${label}.header.paramSet`);
  sameValue(row.header.seedSites, 19, `${label}.header.seedSites`);
  assertEvidence(typeof row.line === "string", `${label}.line is absent`);
  for (const witness of [
    `stop reason=${row.stopReason}`,
    `attached=${row.attached}`,
    `extent=${row.extent}`,
    `AR=${row.aspectRatio.toFixed(5)}`,
    `symErr=${row.symmetryError}`,
    `deltaSymClean=${row.deltaSymClean}`,
    `allConverged=${row.allConverged}`,
  ]) {
    assertEvidence(row.line.includes(witness), `${label}.line does not corroborate ${witness}`);
  }
}

function validateMetadata(row, expected, label) {
  for (const field of [
    "arm",
    "paramSet",
    "tempC",
    "fraction",
    "sigmaInf",
    "publishedAR",
    "dimsN",
    "requestedExtent",
  ]) {
    sameValue(row[field], expected[field], `${label}.${field}`);
  }
}

function validateRegisteredRow(row, pointId, rungId) {
  const point = EXPECTED_POINTS[pointId];
  const rung = EXPECTED_RUNGS[rungId];
  validateExecutionRow(row, `${pointId}-${rungId}`);
  sameValue(row.pointId, pointId, `${pointId}-${rungId}.pointId`);
  sameValue(row.rungId, rungId, `${pointId}-${rungId}.rungId`);
  validateMetadata(row, { ...point, ...rung }, `${pointId}-${rungId}`);
  if (rungId === "A") sameValue(row.aspectRatio, point.publishedAR, `${pointId}-A reproduction`);
}

function registeredOutcome(rows) {
  const deltas = rows.slice(1).map((row, index) => row.aspectRatio - rows[index].aspectRatio);
  const rose = deltas.some((delta) => delta > 0);
  const fell = deltas.some((delta) => delta < 0);
  if (rose && fell) return { id: 4, label: "non-monotone" };
  if (!fell && rose && rows.slice(1).some((row) => row.aspectRatio >= COLUMN_FLOOR)) {
    return { id: 1, label: "monotone rise reaching the column floor" };
  }
  if (!rose && fell) return { id: 3, label: "falls with size" };

  const importedStep = realizedStepNear(rows[0].aspectRatio);
  const withinImportedStep = Number.isFinite(importedStep) && rows.every(
    (row) => Math.abs(row.aspectRatio - rows[0].aspectRatio) <= importedStep,
  );
  if (withinImportedStep) {
    return { id: null, label: "outcome 2 is not evaluable; apparent flatness uses an extent-21 threshold imported to new sizes" };
  }
  return { id: null, label: "not covered by the pre-registered outcome categories" };
}

function habitClass(aspectRatio) {
  if (aspectRatio <= 2 / 3) return "plate";
  if (aspectRatio >= COLUMN_FLOOR) return "column";
  return "neutral";
}

const parsed = JSON.parse(readFileSync(LADDER, "utf8"));
assertEvidence(Array.isArray(parsed), "top-level JSON value is not an array");
const allRows = parsed;
const registered = new Map();
const diagnostic = new Map();
const extras = [];
for (const row of allRows) {
  validateExecutionRow(row, `${String(row?.pointId)}-${String(row?.rungId)}`);
  const isRegisteredPoint = POINT_IDS.includes(row.pointId);
  const isRegisteredRung = RUNG_IDS.includes(row.rungId);
  if (isRegisteredPoint && isRegisteredRung) {
    const key = `${row.pointId}-${row.rungId}`;
    assertEvidence(!registered.has(key), `duplicate registered key ${key}`);
    registered.set(key, row);
  } else {
    const key = `${String(row.pointId)}-${String(row.rungId)}`;
    const expected = EXPECTED_EXTRAS[key];
    assertEvidence(expected !== undefined, `unexpected diagnostic key ${key}`);
    assertEvidence(!diagnostic.has(key), `duplicate diagnostic key ${key}`);
    validateMetadata(row, expected, key);
    diagnostic.set(key, row);
    extras.push(row);
  }
}

assertEvidence(registered.size === POINT_IDS.length * RUNG_IDS.length, `expected 12 unique registered rows, found ${registered.size}`);
assertEvidence(diagnostic.size === Object.keys(EXPECTED_EXTRAS).length, `expected 6 unique diagnostic rows, found ${diagnostic.size}`);
const rowsByPoint = new Map();
for (const pointId of POINT_IDS) {
  const rows = RUNG_IDS.map((rungId) => {
    const row = registered.get(`${pointId}-${rungId}`);
    assertEvidence(row !== undefined, `missing registered key ${pointId}-${rungId}`);
    validateRegisteredRow(row, pointId, rungId);
    return row;
  });
  assertEvidence(rows[0].requestedExtent < rows[1].requestedExtent && rows[1].requestedExtent < rows[2].requestedExtent, `${pointId} is not ordered by physical extent`);
  rowsByPoint.set(pointId, rows);
}

console.log("SCOPE: historical diagnostic only; not R15 and not Phase 6 gate evidence.");
console.log("Columns ladder — registered A/B/C reader");
console.log(`12 of 12 registered rungs present and valid; ${extras.length} later diagnostic rows kept separate\n`);

for (const pointId of POINT_IDS) {
  const rows = rowsByPoint.get(pointId);
  const meta = rows[0];
  console.log(`${pointId}  ${meta.arm} ${meta.paramSet}  T=${meta.tempC} f=${meta.fraction}`);
  for (const row of rows) {
    console.log(
      `   rung ${row.rungId}  N=${String(row.dimsN).padStart(2)}  requested ${String(row.requestedExtent).padStart(2)}  ` +
        `achieved ${String(row.extent).padStart(2)}  AR ${row.aspectRatio.toFixed(5)}  ${habitClass(row.aspectRatio)}`,
    );
  }
  for (let index = 1; index < rows.length; index += 1) {
    const previous = rows[index - 1];
    const current = rows[index];
    const delta = current.aspectRatio - previous.aspectRatio;
    console.log(`   ${previous.rungId} -> ${current.rungId}: ΔAR ${delta >= 0 ? "+" : ""}${delta.toFixed(5)}`);
  }
  const outcome = registeredOutcome(rows);
  console.log(`   registered reading: ${outcome.id === null ? "UNRESOLVED" : `OUTCOME ${outcome.id}`} — ${outcome.label}\n`);
}

console.log("Later diagnostics (not part of the 12-row registered ladder):");
for (const row of [...extras].sort((left, right) =>
  left.pointId.localeCompare(right.pointId) || left.requestedExtent - right.requestedExtent || left.dimsN - right.dimsN
)) {
  console.log(
    `   ${row.pointId}-${row.rungId}  N=${row.dimsN} requested=${row.requestedExtent} achieved=${row.extent} ` +
      `AR=${Number(row.aspectRatio).toFixed(5)} attached=${row.attached}`,
  );
}

console.log("\nSame-extent domain comparisons among all execution-valid rows:");
const domainGroups = new Map();
for (const row of allRows) {
  const key = `${row.pointId}|${row.requestedExtent}`;
  if (!domainGroups.has(key)) domainGroups.set(key, []);
  domainGroups.get(key).push(row);
}
let domainPairCount = 0;
for (const [key, group] of [...domainGroups].sort()) {
  const byN = [...group].sort((left, right) => left.dimsN - right.dimsN);
  if (new Set(byN.map((row) => row.dimsN)).size < 2) continue;
  domainPairCount += 1;
  const low = byN[0];
  const high = byN[byN.length - 1];
  const attachedRelativeDifference = Math.abs(low.attached - high.attached) / Math.max(low.attached, high.attached);
  const sameClass = habitClass(low.aspectRatio) === habitClass(high.aspectRatio);
  const passesRegisteredCriterion = sameClass && attachedRelativeDifference <= 0.005;
  console.log(
    `   ${key}: N=${low.dimsN}/${high.dimsN}, class=${habitClass(low.aspectRatio)}/${habitClass(high.aspectRatio)}, ` +
      `attached relative difference=${(100 * attachedRelativeDifference).toFixed(3)}% — ${passesRegisteredCriterion ? "PASS" : "FAIL"}`,
  );
}
if (domainPairCount === 0) console.log("   none");

const p1Outcome = registeredOutcome(rowsByPoint.get("P1"));
assertEvidence(p1Outcome.id === 4, `P1 must evaluate to registered outcome 4, got ${p1Outcome.label}`);
console.log("\nDECISIVE REGISTERED RESULT: P1 is OUTCOME 4 (non-monotone): 1.40000 -> 1.52632 -> 1.52174.");
console.log("The later D/D80 value 1.64000 is reported separately and does not erase the B -> C fall.");
console.log("HISTORICAL DIAGNOSTIC RESULT ONLY: it does not establish size convergence or gate standing.");
