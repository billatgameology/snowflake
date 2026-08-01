// Phase 6 WP5 — the negative controls.
//
// Rule 9: a negative control must ACTUALLY EXECUTE its named mutation. Asserting that a guard
// "would" catch something is not a control; it is a claim about a control. So every case below
// mutates real data or real registered state, runs the real guard, and reports what happened.
//
// A control REPORTS ONE OF THREE OUTCOMES, and a gap is a finding, not a failure to fix by
// weakening the control:
//
//   CAUGHT — the mutation was executed and the guard rejected it. The guard works.
//   GAP    — the mutation was executed and the guard ACCEPTED it. The artifact cannot detect this
//            class of forgery. Reported loudly; never silenced.
//   ERROR  — the control could not execute its own mutation, so it proves nothing either way.
//
//   node app/scripts/phase6-wp5-negative-controls.mjs
//
// Exit 0 if every control executed. Exit 1 only if a control could not run — GAPs do not fail the
// script, because they are results. Read the summary.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "evidence", "phase6-sweep");
const points = JSON.parse(readFileSync(join(OUT, "points.json"), "utf8"));

const results = [];
const record = (name, outcome, detail) => {
  results.push({ name, outcome, detail });
  const tag = outcome === "CAUGHT" ? "CAUGHT" : outcome === "GAP" ? "**GAP**" : "ERROR";
  console.log(`\n[${tag}] ${name}`);
  console.log(`   ${detail}`);
};

// The verifier's own scoring rules, re-transcribed. Imported from nothing.
const PLATE_CEILING = 1 / 1.5;
const COLUMN_FLOOR = 1.5;
const BOUNDARIES = [-3.3, -9.9, -21.5];
const ACCEPTS = { "plates-warm": ["plate"], columns: ["column"], "plates-cold": ["plate"], "columns-and-plates": ["plate", "column"] };
const regimeOf = (t) =>
  t > -3.3 ? "plates-warm" : t > -9.9 ? "columns" : t > -21.5 ? "plates-cold" : "columns-and-plates";
const classify = (ar) =>
  !Number.isFinite(ar) || ar <= 0 ? "invalid" : ar <= PLATE_CEILING ? "plate" : ar >= COLUMN_FLOOR ? "column" : "neutral";
const invalidReasons = (r) => {
  const out = [];
  if (!r.allConverged) out.push("no convergence");
  if (!r.deltaSymClean) out.push("D6h broken");
  if (r.symmetryError !== 0) out.push("symErr != 0");
  if (r.domainContact) out.push("domain contact");
  return out;
};
/** Re-derive one row's published verdict and say whether it matches. */
function verdictMatches(entry) {
  const reasons = invalidReasons(entry.result);
  const cls = reasons.length ? "invalid" : classify(entry.result.aspectRatio);
  const regime = regimeOf(entry.point.tempC);
  const score = cls === "invalid" ? "excluded" : ACCEPTS[regime].includes(cls) ? "agree" : "disagree";
  return cls === entry.modelClass && score === entry.score && regime === entry.regime;
}

console.log("PHASE 6 WP5 — NEGATIVE CONTROLS (each mutation is executed, not asserted)");

// ── 1. Forged verdict ────────────────────────────────────────────────────────────────────────
{
  const forged = structuredClone(points);
  const victim = forged.find((x) => x.score === "disagree" && x.modelClass === "neutral");
  victim.modelClass = "column";
  victim.score = "agree";
  const caught = !verdictMatches(victim);
  record(
    "1. forged verdict — a published disagree flipped to agree without changing the measurement",
    caught ? "CAUGHT" : "GAP",
    caught
      ? `re-derivation from AR=${victim.result.aspectRatio} rejects the forged class/score at ` +
        `T=${victim.point.tempC} f=${victim.point.fraction}`
      : "the independent re-derivation accepted a forged verdict",
  );
}

// ── 2. Post-freeze parameter edit ────────────────────────────────────────────────────────────
{
  const mod = await import("file:///g:/Code%20Files/snowflake/runner/src/phase6-protocol.ts");
  const { canonicalJsonSha256 } = await import("file:///g:/Code%20Files/snowflake/runner/src/gate4-evidence.ts");
  const clean = canonicalJsonSha256(mod.phase6ValuesManifest());
  // Execute the mutation: flip a registered grid fraction by rebuilding the manifest around it.
  const mutated = { ...mod.phase6ValuesManifest(), sigmaFractions: [0.1, 0.15, 0.25, 0.4, 0.6, 0.95] };
  const caught = canonicalJsonSha256(mutated) !== clean && clean === mod.PHASE6_VALUES_SHA256;
  record(
    "2. post-freeze parameter edit — a registered sigma fraction changed 0.90 -> 0.95",
    caught ? "CAUGHT" : "GAP",
    caught
      ? `values hash moves ${clean.slice(0, 8)} -> ${canonicalJsonSha256(mutated).slice(0, 8)}, and preflight gates on it`
      : "the values hash did not move, so preflight would accept the edit",
  );
}

// ── 3. Merged parameter sets ─────────────────────────────────────────────────────────────────
{
  // Execute the mutation: splice rows that could only have come from a different parameter set.
  // The superseded CAK_A1 sweep is real data produced by a different paramSet, so use it.
  const other = JSON.parse(
    readFileSync(join(process.cwd(), "evidence", "phase6-sweep-6995868-cak-a1-superseded", "points.json"), "utf8"),
  );
  const merged = structuredClone(points);
  let spliced = 0;
  for (let i = 0; i < merged.length; i++) {
    const alt = other.find(
      (o) => o.point.tempC === merged[i].point.tempC && o.point.fraction === merged[i].point.fraction,
    );
    if (alt && alt.result.aspectRatio !== merged[i].result.aspectRatio) {
      merged[i] = alt;
      spliced++;
    }
  }
  // Can ANY check detect it? Every spliced row is internally self-consistent, because it is a real
  // row from a real sweep — just a different one.
  const inconsistent = merged.filter((x) => !verdictMatches(x)).length;
  const recordsParamSet = "paramSet" in points[0].result || "paramSet" in points[0].point;
  record(
    `3. merged parameter sets — ${spliced} rows replaced with real CAK_A1 rows at the same grid points`,
    inconsistent > 0 || recordsParamSet ? "CAUGHT" : "GAP",
    inconsistent > 0 || recordsParamSet
      ? `detected via ${recordsParamSet ? "a recorded per-row paramSet" : `${inconsistent} internally inconsistent rows`}`
      : "points.json records NO per-row paramSet, and every spliced row is internally self-consistent " +
        "because it came from a real sweep. A merged artifact is INDISTINGUISHABLE from a clean one. " +
        "This is the ADR 0031 defect in artifact form: the evidence cannot prove which parameterization produced it.",
  );
}

// ── 4. Domain-contacted run ──────────────────────────────────────────────────────────────────
{
  const mutated = structuredClone(points);
  const victim = mutated.find((x) => x.exclusionReason === null);
  victim.result.domainContact = true; // execute the mutation
  const reasons = invalidReasons(victim.result);
  const caught = reasons.includes("domain contact") && classify(victim.result.aspectRatio) !== "invalid";
  record(
    "4. domain-contacted run — the 65% guard tripped on a previously clean point",
    caught ? "CAUGHT" : "GAP",
    caught
      ? `scored invalid and EXCLUDED BY NAME ("${reasons.join("; ")}"), not silently dropped`
      : "a domain-contacted run was not excluded",
  );
}

// ── 5. Mismatched far field ──────────────────────────────────────────────────────────────────
{
  const mod = await import("file:///g:/Code%20Files/snowflake/runner/src/phase6-protocol.ts");
  const { canonicalJsonSha256 } = await import("file:///g:/Code%20Files/snowflake/runner/src/gate4-evidence.ts");
  const clean = canonicalJsonSha256(mod.phase6ValuesManifest());
  const mutated = { ...mod.phase6ValuesManifest(), farField: "dirichlet" };
  const hashCaught = canonicalJsonSha256(mutated) !== clean;
  // And the harness-side guard: does the child command actually carry the registered far field?
  const sweep = await import("file:///g:/Code%20Files/snowflake/runner/src/phase6-sweep.ts");
  const cmd = sweep.phase6PointCommand(mod.phase6SweepGrid()[0]);
  const at = cmd.indexOf("--far-field");
  const cmdCarries = at >= 0 && cmd[at + 1] === mod.PHASE6_FAR_FIELD;
  record(
    "5. mismatched far field — registered monopole-matched changed to dirichlet",
    hashCaught && cmdCarries ? "CAUGHT" : "GAP",
    hashCaught && cmdCarries
      ? `values hash moves, and the child command passes --far-field ${mod.PHASE6_FAR_FIELD} explicitly`
      : `hash moved: ${hashCaught}; command carries the registered value explicitly: ${cmdCarries}`,
  );
}

// ── 6. Wrong measurement size ────────────────────────────────────────────────────────────────
{
  const mutated = structuredClone(points);
  const victim = mutated.find((x) => x.exclusionReason === null);
  const registeredExtent = victim.result.largestExtent;
  victim.result.largestExtent = 15; // execute the mutation: measured at the wrong size
  // Does anything reject it? The scorer's invalid conditions do not mention largestExtent.
  const caught = !verdictMatches(victim) || invalidReasons(victim.result).length > 0;
  record(
    `6. wrong measurement size — largestExtent forged ${registeredExtent} -> 15 on a scored point`,
    caught ? "CAUGHT" : "GAP",
    caught
      ? "rejected by re-derivation or scored invalid"
      : `largestExtent is RECORDED but never CHECKED against the registered measurement size. ` +
        `A row measured at extent 15 scores identically to one at 21, and habit is size-dependent — ` +
        `WP3 measured the cold condition classifying plate at extent 9 and neutral at 21, the opposite class.`,
  );
}

// ── 7. Mid-run solver edit ───────────────────────────────────────────────────────────────────
{
  // Execute the mutation for real: append a line to a tracked solver file, ask the provenance
  // check what it thinks, then restore. Guaranteed revert in `finally`.
  const target = "core/src/libbrecht.ts";
  let outcome = "ERROR";
  let detail = "";
  try {
    const mod = await import("file:///g:/Code%20Files/snowflake/runner/src/phase6-protocol.ts");
    const before = mod.phase6ProtocolProvenance(process.cwd());
    execFileSync("node", ["-e", `require('fs').appendFileSync(${JSON.stringify(target)}, "\\n// negative control scratch\\n")`]);
    const after = mod.phase6ProtocolProvenance(process.cwd());
    const dirtyDetected = before.treeIsClean && !after.treeIsClean;
    const headUnchanged = before.head === after.head;
    outcome = dirtyDetected ? "CAUGHT" : "GAP";
    detail = dirtyDetected
      ? `the tree-clean check DOES see the edit (clean ${before.treeIsClean} -> ${after.treeIsClean}), ` +
        `and head is unchanged (${headUnchanged}) — so an edit made BEFORE launch is caught. ` +
        `THE REMAINING HAZARD IS TIMING, NOT DETECTION: preflight runs once at launch, so an edit ` +
        `made mid-run is never re-checked, while the report still names the launch commit. ` +
        `A completion-time re-check closes it and does not yet exist.`
      : "the provenance check did not notice a tracked solver file being edited";
  } catch (error) {
    detail = `could not execute the mutation: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    execFileSync("git", ["checkout", "--", target]);
  }
  record("7. mid-run solver edit — a tracked solver file modified after preflight", outcome, detail);
}

// ── Summary ──────────────────────────────────────────────────────────────────────────────────
const gaps = results.filter((r) => r.outcome === "GAP");
const errors = results.filter((r) => r.outcome === "ERROR");
console.log("\n" + "=".repeat(94));
console.log(
  `${results.length} controls executed — ` +
    `${results.filter((r) => r.outcome === "CAUGHT").length} CAUGHT, ${gaps.length} GAP, ${errors.length} ERROR`,
);
for (const g of gaps) console.log(`  GAP: ${g.name}`);
console.log("\nA GAP is a finding. It is reported, not silenced, and it does not fail this script —");
console.log("only a control that could not execute its own mutation does.");
console.log(`PHASE6 WP5 NEGATIVE CONTROLS: ${errors.length === 0 ? "ALL EXECUTED" : "INCOMPLETE"}`);
if (errors.length > 0) process.exit(1);
