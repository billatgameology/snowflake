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
import { join } from "node:path";

const COLUMN_FLOOR = 1.5;
const LADDER = join(process.cwd(), "evidence", "phase6-columns-ladder", "ladder.json");

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

const rows = JSON.parse(readFileSync(LADDER, "utf8")).filter((r) => r.error === null && Number.isFinite(r.aspectRatio));
const byPoint = new Map();
for (const r of rows) {
  if (!byPoint.has(r.pointId)) byPoint.set(r.pointId, []);
  byPoint.get(r.pointId).push(r);
}

console.log("Columns ladder — read against docs/phase6-columns-refinement-prereg.md");
console.log(`${rows.length} of 12 rungs measured\n`);

const verdicts = [];
for (const [pointId, list] of [...byPoint].sort()) {
  list.sort((a, b) => a.rungId.localeCompare(b.rungId));
  const a = list.find((r) => r.rungId === "A");
  const meta = list[0];
  console.log(
    `${pointId}  ${meta.arm} ${meta.paramSet}  T=${meta.tempC} f=${meta.fraction}` +
      (list.length < 3 ? `   (${list.length}/3 rungs)` : ""),
  );
  for (const r of list) {
    const toFloor = COLUMN_FLOOR - r.aspectRatio;
    console.log(
      `   rung ${r.rungId}  N=${String(r.dimsN).padStart(2)}  extent ${String(r.extent).padStart(2)}  ` +
        `AR ${r.aspectRatio.toFixed(5)}   ${toFloor > 0 ? `${toFloor.toFixed(4)} below the 1.5 floor` : "AT OR ABOVE THE FLOOR"}` +
        (r.aspectRatio >= COLUMN_FLOOR ? "   <-- COLUMN" : ""),
    );
  }
  if (a !== undefined) {
    for (const r of list.filter((x) => x.rungId !== "A")) {
      const delta = r.aspectRatio - a.aspectRatio;
      // The only MEASURED step scale available, imported from extent 21. Flagged as such.
      const imported = realizedStepNear(a.aspectRatio);
      console.log(
        `   A -> ${r.rungId}: ΔAR ${delta >= 0 ? "+" : ""}${delta.toFixed(5)}   ` +
          `(extent-21 realized step near ${a.aspectRatio.toFixed(3)} is ${imported.toFixed(4)}; ` +
          `${Math.abs(delta) <= imported ? "within it" : "LARGER than it"} — threshold imported from a ` +
          "different measurement size, see the header)",
      );
      verdicts.push({ pointId, rung: r.rungId, delta, imported, reachedColumn: r.aspectRatio >= COLUMN_FLOOR });
    }
  }
  console.log("");
}

console.log("=".repeat(90));
const reached = verdicts.filter((v) => v.reachedColumn);
const rose = verdicts.filter((v) => v.delta > 0);
const fell = verdicts.filter((v) => v.delta < 0);
console.log(`rungs beyond A measured: ${verdicts.length}`);
console.log(`  reached AR >= 1.5: ${reached.length}${reached.length ? " — " + reached.map((v) => v.pointId + "-" + v.rung).join(", ") : ""}`);
console.log(`  moved upward (toward column): ${rose.length} of ${verdicts.length}`);
console.log(`  moved downward: ${fell.length} of ${verdicts.length}`);
console.log(`  largest |ΔAR| so far: ${verdicts.length ? Math.max(...verdicts.map((v) => Math.abs(v.delta))).toFixed(5) : "n/a"}`);
console.log(`  realized extent-21 step near the floor, for scale: 0.0875–0.1000`);
console.log("");
console.log("PRE-REGISTERED READING — do not choose it now, apply it:");
console.log("  1 AR rises monotonically and reaches >= 1.5  -> the columns verdict is a");
console.log("    MEASUREMENT-SIZE ARTIFACT; withdraw 'neither arm produces a column in the columns");
console.log("    regime' and replace with 'neither does AT THE REGISTERED MEASUREMENT SIZE'.");
console.log("  2 flat within one representable step         -> size-converged; the columns failure");
console.log("    is a property of the model at these settings.");
console.log("  3 AR falls                                    -> the published measurement was optimistic.");
console.log("  4 non-monotone                                -> reported as non-monotone; no rung is picked.");
console.log("");
console.log(verdicts.length < 8 ? "INCOMPLETE — the ladder is still executing; no outcome is declared yet." : "Ladder complete.");
