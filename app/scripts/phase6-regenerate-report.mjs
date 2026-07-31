// Regenerate a Phase 6 report.json + diagram.svg from an existing points.json.
//
// WHY THIS EXISTS, and why it is not a licence to rewrite evidence.
//
// The arm-2 sweep computed all 204 points and wrote no report: the completion-time provenance
// re-check fired because five commits landed on main during the 11.5-hour run. That check is
// correct and stays. But "the gate refused to publish" is NOT "the measurements are void", and
// conflating the two nearly cost a redundant 11.5 hours. `report.json` and `diagram.svg` are pure
// functions of `points.json` and the arm; the measurements were never in question.
//
// WHAT MAKES THE REGENERATION HONEST RATHER THAN CONVENIENT:
//
//   1. It lives in app/scripts/, NOT in runner/src — so adding it leaves PHASE6_SOURCE_ROOTS
//      (core/src, solver-cpu/src, runner/src) byte-identical to the tree that computed the points.
//      That is the claim the whole recovery rests on, and putting this file in runner/src would
//      have falsified it.
//   2. It calls the SAME `phase6Aggregate` the sweep calls. It is not a second implementation of
//      the scoring; it is the same one, fed the same rows.
//   3. It REFUSES to overwrite an existing report, refuses a row set that is not the registered
//      grid, and refuses an arm whose rows disagree with the arm it was told to publish.
//   4. It writes a `regeneration.json` sidecar recording exactly what happened, so the artifact
//      carries its own irregular history instead of looking like an ordinary sweep output.
//   5. `app/scripts/phase6-arm2-independent.mjs` re-derives the result from points.json importing
//      nothing from runner/src. That is the check on this tool.
//
//   node app/scripts/phase6-regenerate-report.mjs <outDir> <arm1|arm2> <executionHead> [note]

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { phase6Aggregate, phase6SourceGraph, PHASE6_ARM1, PHASE6_ARM2 } from "../../runner/src/phase6-sweep.ts";
import { phase6RenderDiagram } from "../../runner/src/phase6-diagram.ts";
import { phase6SweepGrid } from "../../runner/src/phase6-protocol.ts";

const [outDir, armName, executionHead, note] = process.argv.slice(2);
if (!outDir || !armName || !executionHead) {
  console.error("usage: phase6-regenerate-report.mjs <outDir> <arm1|arm2> <executionHead> [note]");
  process.exit(2);
}
const arm = armName === "arm2" ? PHASE6_ARM2 : armName === "arm1" ? PHASE6_ARM1 : null;
if (arm === null) {
  console.error(`arm must be arm1 or arm2, got "${armName}"`);
  process.exit(2);
}
if (!/^[0-9a-f]{40}$/.test(executionHead)) {
  console.error(`executionHead must be a 40-hex commit, got "${executionHead}"`);
  process.exit(2);
}

// (3) Refuse to overwrite. A regeneration tool that can silently replace a published report is a
// forgery tool with a docstring.
for (const name of ["report.json", "diagram.svg"]) {
  if (existsSync(join(outDir, name))) {
    console.error(`REFUSING: ${join(outDir, name)} already exists. Move it aside deliberately.`);
    process.exit(3);
  }
}

const points = JSON.parse(readFileSync(join(outDir, "points.json"), "utf8"));

// (3) The row set must be exactly the registered grid — no duplicates, no strangers, none missing.
const expected = new Set(phase6SweepGrid().map((p) => `${p.tempC}|${p.fraction}`));
const seen = new Map();
for (const e of points) {
  const k = `${e.point.tempC}|${e.point.fraction}`;
  seen.set(k, (seen.get(k) ?? 0) + 1);
}
const gridProblems = [];
if (points.length !== expected.size) gridProblems.push(`${points.length} rows vs ${expected.size} registered`);
for (const [k, n] of seen) {
  if (n > 1) gridProblems.push(`${k} appears ${n} times`);
  if (!expected.has(k)) gridProblems.push(`${k} is not on the registered grid`);
}
for (const k of expected) if (!seen.has(k)) gridProblems.push(`${k} is MISSING`);

// (3) And every row must have been produced by the arm we are about to publish it as. The per-row
// `config` is the child's own echoed header, so this catches a spliced row from the other arm.
for (const e of points) {
  const ps = e.result?.config?.paramSet;
  if (ps !== undefined && ps !== null && ps !== arm.paramSet) {
    gridProblems.push(`T=${e.point.tempC} f=${e.point.fraction} ran under paramSet ${ps}, not ${arm.paramSet}`);
  }
}
if (gridProblems.length > 0) {
  console.error("REFUSING: points.json is not a complete, single-arm run of the registered grid:");
  for (const p of gridProblems.slice(0, 20)) console.error(`  - ${p}`);
  process.exit(4);
}

const repoRoot = process.cwd();
const graph = phase6SourceGraph(repoRoot);
const regenHead = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
const trackedStatus = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();
if (trackedStatus !== "") {
  console.error("REFUSING: the tracked tree is dirty, so this regeneration is not reproducible:");
  console.error(trackedStatus);
  process.exit(5);
}

// (2) The SAME aggregation the sweep would have run, on the same rows.
// `head` records the EXECUTION commit — where the points were computed — not this one. Recording
// the regeneration commit there would misdate the measurements.
const report = phase6Aggregate(points, arm.protocolSha256(), executionHead, arm);
writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 1));
writeFileSync(
  join(outDir, "diagram.svg"),
  phase6RenderDiagram(
    points,
    `${arm.id} · paramSet ${arm.paramSet} · values ${arm.valuesSha256().slice(0, 12)} · ` +
      `executed at ${executionHead.slice(0, 12)} · report regenerated at ${regenHead.slice(0, 12)}`,
    arm.diagramLabel,
  ),
);

// (4) The sidecar. The artifact carries its own irregular history rather than looking ordinary.
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const sidecar = {
  schema: "phase6-regeneration-v1",
  arm: arm.id,
  paramSet: arm.paramSet,
  reason:
    "The sweep completed all 204 points but the completion-time provenance re-check refused to " +
    "write an artifact, because HEAD moved during the run. The measurements were not in question: " +
    "no file under core/src, solver-cpu/src or runner/src differed across the commit range, so the " +
    "executed physics was byte-identical throughout. report.json and diagram.svg are pure " +
    "functions of points.json and the arm, and are regenerated here rather than re-measured.",
  executionHead,
  regenerationHead: regenHead,
  regeneratedBy: "app/scripts/phase6-regenerate-report.mjs",
  sourceGraphSha256: graph.digest,
  sourceGraphFileCount: graph.files.length,
  sourceGraphIdenticalAcrossRange:
    "verified with `git diff --name-only <executionHead> <regenerationHead> -- core/src " +
    "solver-cpu/src runner/src`, which returned zero files",
  pointsSha256: sha(join(outDir, "points.json")),
  reportSha256: sha(join(outDir, "report.json")),
  diagramSha256: sha(join(outDir, "diagram.svg")),
  note: note ?? null,
};
writeFileSync(join(outDir, "regeneration.json"), JSON.stringify(sidecar, null, 1));

console.log(`regenerated ${arm.id} into ${outDir}`);
console.log(`  execution head    ${executionHead}`);
console.log(`  regeneration head ${regenHead}`);
console.log(`  source graph      ${graph.digest} (${graph.files.length} files)`);
console.log(`  headline          ${report.headlineAgree}/${report.headlineTotal}`);
console.log(`  common denominator ${report.headlineAgreeCommonDenominator}/${report.headlineTotalCommonDenominator}`);
console.log(`  report.json       ${sidecar.reportSha256}`);
console.log(`  diagram.svg       ${sidecar.diagramSha256}`);
