// Phase 6 ARM 2 — the negative controls for `app/scripts/phase6-arm2-independent.mjs`.
//
// WHY THIS EXISTS. Arm 2's verifier printed PASS. A verifier that has only ever printed PASS is
// indistinguishable from a verifier that always prints PASS. Rule 9's requirement is that the check
// be shown to DISCRIMINATE, and the only way to show that is to hand it artifacts that ought to
// fail and record what it actually does.
//
// WHAT MAKES THESE CONTROLS RATHER THAN CLAIMS ABOUT CONTROLS:
//
//   - Every mutation is EXECUTED against real data. Nothing here asserts that a guard "would" fire.
//   - Every mutant is then handed to the REAL verifier as a subprocess — the same file, unmodified,
//     that certified the published artifact. The arm-1 WP5 controls re-implemented the rules inline
//     and so tested a transcription of the verifier; this tests the verifier.
//   - Where a forger would plausibly re-aggregate to stay self-consistent, THIS SCRIPT RE-AGGREGATES
//     TOO, using the harness's own `phase6Aggregate`. A forgery that any competent forger would
//     repair is not a control, it is a straw man.
//   - C0 is a POSITIVE control: the unmutated artifact, copied the same way, must PASS. Without it
//     every CAUGHT below could be the copy failing rather than the mutation being detected.
//
// OUTCOMES, and a GAP is a finding rather than a bug to fix by weakening the control:
//
//   CAUGHT     — mutation executed; verifier exited non-zero AND named the expected reason.
//   INCIDENTAL — mutation executed; verifier exited non-zero for some OTHER reason. The named guard
//                did not fire. Reported separately because a check that only catches things by
//                accident will stop catching them the moment the forgery is tidied up.
//   GAP        — mutation executed; verifier PASSED. This class of forgery is undetectable.
//   ERROR      — the control could not execute its own mutation, so it proves nothing.
//
// WHAT THESE FOUND, in the order it happened. On their first execution C7 and C8 were **GAPs**: the
// verifier counted how many rows carried a per-row `config` and PRINTED the number, but never
// required it to equal the row count. So an artifact with six real arm-1 rows spliced in, and an
// artifact with every `config` deleted, both verified clean. A check that an absent field cannot
// fail is not a check. The verifier was then amended to fail on missing config, and they now read
// CAUGHT. The gap was real, is closed, and the sequence is recorded here rather than hidden by the
// controls having only ever been run against the fixed version.
//
// C9b remains a GAP and is not going to be closed by editing this file: see its own note.
//
//   node app/scripts/phase6-arm2-negative-controls.mjs
//
// Exit 0 if every control executed. Exit 1 only on ERROR — GAPs are results.

import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { phase6Aggregate, PHASE6_ARM2 } from "../../runner/src/phase6-sweep.ts";

const REPO = process.cwd();
const ARM2 = join(REPO, "out", "phase6-sweep-arm2");
const ARM1 = join(REPO, "out", "phase6-sweep");
const VERIFIER = join(REPO, "app", "scripts", "phase6-arm2-independent.mjs");
const EXECUTION_HEAD = "8c781b1"; // arm 2's execution commit, per regeneration.json

const workRoot = mkdtempSync(join(tmpdir(), "phase6-arm2-nc-"));
const arm2Points = JSON.parse(readFileSync(join(ARM2, "points.json"), "utf8"));
const arm1Points = JSON.parse(readFileSync(join(ARM1, "points.json"), "utf8"));
const arm2Report = JSON.parse(readFileSync(join(ARM2, "report.json"), "utf8"));

const results = [];
function record(name, outcome, detail) {
  results.push({ name, outcome, detail });
  const tag = outcome === "CAUGHT" ? "CAUGHT" : outcome === "GAP" ? "**GAP**" : outcome;
  console.log(`\n[${tag}] ${name}`);
  for (const line of detail.split("\n")) console.log(`   ${line}`);
}

/** Materialize a mutant artifact directory. `points`/`report` default to arm 2's real ones. */
function materialize(id, { points = arm2Points, report = arm2Report, svgFrom = ARM2 } = {}) {
  const dir = join(workRoot, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "points.json"), JSON.stringify(points, null, 1));
  writeFileSync(join(dir, "report.json"), JSON.stringify(report, null, 1));
  cpSync(join(svgFrom, "diagram.svg"), join(dir, "diagram.svg"));
  return dir;
}

/** Run the REAL verifier against a directory. Returns {exit, out}. */
function verify(dir) {
  try {
    const out = execFileSync("node", [VERIFIER, dir], { cwd: REPO, encoding: "utf8" });
    return { exit: 0, out };
  } catch (error) {
    return { exit: error.status ?? -1, out: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

/** The reasons the verifier gave, minus the summary chrome. */
function reasons(out) {
  return out
    .split("\n")
    .filter((l) => l.trimStart().startsWith("- "))
    .map((l) => l.trim().slice(2));
}

/**
 * Judge one control. `expect` is a substring the failure output must contain for the NAMED guard to
 * count as having fired.
 */
function judge(name, dir, expect, gapDetail) {
  const { exit, out } = verify(dir);
  const hit = reasons(out).filter((r) => r.includes(expect));
  if (exit === 0) {
    record(name, "GAP", gapDetail);
    return;
  }
  if (hit.length > 0) {
    const others = reasons(out).length - hit.length;
    record(
      name,
      "CAUGHT",
      `verifier exited ${exit} naming it: "${hit[0].slice(0, 150)}"` +
        (hit.length > 1 ? `\n(+${hit.length - 1} more of the same kind)` : "") +
        (others > 0 ? `\n(+${others} other disagreements)` : ""),
    );
    return;
  }
  record(
    name,
    "INCIDENTAL",
    `verifier exited ${exit}, but NOT for the named reason (no message contained "${expect}").\n` +
      `What it said instead: ${reasons(out).slice(0, 2).join(" | ").slice(0, 260) || "(no itemized reasons)"}`,
  );
}

/** Re-aggregate a mutated row set with the harness's own aggregator — the forger tidying up. */
const reaggregate = (points) => phase6Aggregate(points, PHASE6_ARM2.protocolSha256(), EXECUTION_HEAD, PHASE6_ARM2);

console.log("PHASE 6 ARM 2 — NEGATIVE CONTROLS (every mutation executed; the real verifier judges)");
console.log(`work dir: ${workRoot}`);

// ── C0. POSITIVE CONTROL — the unmutated artifact, copied the same way, must PASS ─────────────
{
  const dir = materialize("c0-clean");
  const { exit, out } = verify(dir);
  record(
    "C0. POSITIVE CONTROL — unmutated arm-2 artifact, copied and re-serialized",
    exit === 0 ? "CAUGHT" : "ERROR",
    exit === 0
      ? "PASS, as it must be. Every CAUGHT below is therefore attributable to the mutation and not\n" +
        "to the copy, the re-serialization, or the verifier being broken."
      : `the CLEAN artifact FAILED (exit ${exit}). Every result below is uninterpretable.\n${out.slice(-400)}`,
  );
}

// ── C1. Arm 1's artifact substituted wholesale ────────────────────────────────────────────────
{
  const dir = join(workRoot, "c1-arm1-wholesale");
  mkdirSync(dir, { recursive: true });
  for (const f of ["points.json", "report.json", "diagram.svg"]) cpSync(join(ARM1, f), join(dir, f));
  judge(
    "C1. arm 1's entire artifact placed where arm 2's belongs",
    dir,
    'claims arm "',
    "the verifier accepted arm 1's no-SDAK artifact as arm 2's SDAK result — the two arms' evidence\n" +
      "would be interchangeable and the whole controlled comparison is void",
  );
}

// ── C2. Arm 1's MEASUREMENTS, re-aggregated under arm 2's identity ────────────────────────────
//
// The sophisticated substitution: a forger who ran only one arm and needs two reports. Every
// identity field is correct because the REAL aggregator wrote them; only the physics is arm 1's.
{
  const dir = materialize("c2-arm1-points-arm2-identity", {
    points: arm1Points,
    report: reaggregate(arm1Points),
  });
  judge(
    "C2. arm 1's 204 measurements re-aggregated under arm 2's identity by the real aggregator",
    dir,
    "headline",
    "arm 1's measurements published as arm 2's, with every identity field correct because the real\n" +
      "aggregator wrote them. The verifier could not tell which physics produced the numbers.",
  );
}

// ── C3. Forged arm id ─────────────────────────────────────────────────────────────────────────
{
  const dir = materialize("c3-forged-arm-id", { report: { ...arm2Report, arm: "arm1-cak-nosdak" } });
  judge(
    "C3. report.json's arm id forged to arm 1's",
    dir,
    'claims arm "arm1-cak-nosdak"',
    "the arm-identity field can say anything without consequence",
  );
}

// ── C4. Forged gated values hash ──────────────────────────────────────────────────────────────
{
  const dir = materialize("c4-forged-values-hash", {
    report: { ...arm2Report, valuesSha256: "0".repeat(64) },
  });
  judge(
    "C4. the GATED values hash forged in the published report",
    dir,
    "gated values hash",
    "the report can claim any values hash, so the freeze it names is decorative",
  );
}

// ── C5. A spliced foreign row — the row's OWN header says CAK ─────────────────────────────────
{
  const points = structuredClone(arm2Points);
  const victim = points.find((e) => e.result?.config?.paramSet === "M1");
  victim.result.config.paramSet = "CAK";
  const dir = materialize("c5-spliced-cak-row", { points });
  judge(
    `C5. one row's self-reported paramSet set to CAK (T=${victim.point.tempC} f=${victim.point.fraction})`,
    dir,
    'ran under paramSet "CAK"',
    "a row from the other arm is invisible even when it says so itself",
  );
}

// ── C6. The same splice, with the report re-aggregated to stay consistent ─────────────────────
{
  const points = structuredClone(arm2Points);
  const victim = points.find((e) => e.result?.config?.paramSet === "M1");
  victim.result.config.paramSet = "CAK";
  const dir = materialize("c6-spliced-cak-row-reaggregated", { points, report: reaggregate(points) });
  judge(
    "C6. the same CAK row, with the report re-aggregated so every tally still agrees",
    dir,
    'ran under paramSet "CAK"',
    "a tidied-up splice survives: the tallies are self-consistent and nothing reads the row's own header",
  );
}

// ── C7. A real arm-1 row spliced in at the same grid point ────────────────────────────────────
//
// Real data from a real sweep, so it is internally self-consistent in every way a schema check can
// see. It carries no `config` at all, because arm 1 predates per-row config (erratum E3).
{
  const points = structuredClone(arm2Points);
  let spliced = 0;
  for (let i = 0; i < points.length && spliced < 6; i++) {
    const alt = arm1Points.find(
      (o) => o.point.tempC === points[i].point.tempC && o.point.fraction === points[i].point.fraction,
    );
    if (alt && alt.result.aspectRatio !== points[i].result.aspectRatio) {
      points[i] = structuredClone(alt);
      spliced += 1;
    }
  }
  const dir = materialize("c7-real-arm1-rows", { points, report: reaggregate(points) });
  judge(
    `C7. ${spliced} real arm-1 rows spliced in at their own grid points, report re-aggregated`,
    dir,
    "carry NO per-row config",
    "real rows from the other arm, carrying NO per-row config because arm 1 predates it, are\n" +
      "accepted silently. The verifier PRINTS `config-carrying N` but never requires N to equal the\n" +
      "row count, so a mixed artifact passes.",
  );
}

// ── C8. Every per-row config stripped ─────────────────────────────────────────────────────────
//
// Isolates the same suspected weakness from C7 with nothing else changed: arm 2's own numbers,
// arm 2's own tallies, only the evidence of WHICH PARAMETER SET RAN removed.
{
  const points = structuredClone(arm2Points);
  for (const e of points) delete e.result.config;
  const dir = materialize("c8-config-stripped", { points, report: reaggregate(points) });
  judge(
    "C8. every row's `config` deleted — the artifact can no longer say which parameter set ran",
    dir,
    "carry NO per-row config",
    "an artifact that has been stripped of all evidence of which parameter set produced it passes\n" +
      "verification unchanged. The per-row paramSet check is vacuous against deletion: it only\n" +
      "inspects rows that HAVE a config, so removing the field removes the check.",
  );
}

// ── C9. The step-cap fabrication, forged COMPLETELY (ADR 0035) ────────────────────────────────
//
// The historical failure this rule exists for: a step-capped run reports the 19-site seed's shape,
// AR = 0.2 regardless of temperature, and the harness once scored that `plate / AGREE / headline`.
// Applied to the whole grid it reads 66 of 90. Forged completely here — measurement AND verdict —
// because a forgery that leaves the verdicts disagreeing with the measurements is not the threat.
// Executed against arm 2, which unlike arm 1 records a stop reason on every row (erratum E3).
{
  const points = structuredClone(arm2Points);
  for (const e of points) {
    e.result.aspectRatio = 0.2;
    e.result.largestExtent = 5;
    e.result.config.stopReason = "step-cap";
    e.result.config.finalExtent = 5;
    e.modelClass = "plate";
    e.score = e.regime === "columns" ? "disagree" : "agree";
    e.exclusionReason = null;
  }
  const report = reaggregate(points);
  const dir = materialize("c9-step-cap-fabrication", { points, report });
  console.log(
    `\n   (the fabrication as published would read ${report.headlineAgree}/${report.headlineTotal} ` +
      `headline, ${report.excludedCount} excluded)`,
  );
  judge(
    "C9. the step-cap fabrication — all 204 rows report the seed shape, verdicts forged to match",
    dir,
    'ended on "step-cap"',
    "seed-shaped step-capped runs published as plates and counted as agreements",
  );
}

// ── C9b. Does the SCORER re-derive, or trust what it is handed? ───────────────────────────────
//
// `phase6Aggregate` is what both the sweep and the regeneration tool call. C9 revealed something
// worth isolating: it TALLIES the per-row verdicts it receives, it does not recompute them from the
// measurements. So flip one verdict, leave the measurement untouched, and the published report moves.
{
  const points = structuredClone(arm2Points);
  const victim = points.find((e) => e.score === "disagree" && e.inHeadlineScope);
  const truth = { cls: victim.modelClass, score: victim.score, ar: victim.result.aspectRatio };
  victim.modelClass = "plate";
  victim.score = "agree";
  const report = reaggregate(points);
  const moved = report.headlineAgree !== arm2Report.headlineAgree;
  const { exit } = verify(materialize("c9b-forged-verdict", { points, report }));
  record(
    "C9b. one row's VERDICT flipped disagree -> agree, measurement untouched, then re-aggregated",
    moved ? "GAP" : "CAUGHT",
    moved
      ? `the aggregator moved the headline ${arm2Report.headlineAgree} -> ${report.headlineAgree} on a row whose\n` +
        `AR is still ${truth.ar} (a ${truth.cls}, scored ${truth.score}). \`phase6Aggregate\` TALLIES the verdicts it\n` +
        "is handed; it does not re-derive them from the measurements. So the sweep and the regeneration\n" +
        "tool would both faithfully republish a forged per-row verdict.\n" +
        `THE INDEPENDENT VERIFIER IS THE ONLY THING THAT CATCHES THIS, and it does (exit ${exit}).\n` +
        "That is Rule 9 working as designed — no component supplies both sides of the check — but it\n" +
        "means the artifact is trustworthy only in company with the verifier, never on its own."
      : "the aggregator re-derived the verdict from the measurement and ignored the forged one",
  );
}

// ── C10. Wrong measurement size on a single scored row ────────────────────────────────────────
{
  const points = structuredClone(arm2Points);
  const victim = points.find((e) => e.exclusionReason === null && e.result.largestExtent === 21);
  victim.result.largestExtent = 15;
  victim.result.config.finalExtent = 15;
  const dir = materialize("c10-wrong-extent", { points, report: reaggregate(points) });
  judge(
    `C10. one scored row's largestExtent forged 21 -> 15 (T=${victim.point.tempC} f=${victim.point.fraction})`,
    dir,
    "class",
    "a row measured at the wrong size scores identically to one measured at the registered size,\n" +
      "and habit is size-dependent — WP3 measured one condition as plate at extent 9 and neutral at 21",
  );
}

// ── C11. Forged bistable count ────────────────────────────────────────────────────────────────
//
// ADR 0036 registered the bistable band as a reported obligation. Forging it to 18/18 would turn
// the one pre-registration the arm FAILED into one it passed.
{
  const dir = materialize("c11-forged-bistable", {
    report: { ...arm2Report, bistable: { ...arm2Report.bistable, agree: 18, neutralCount: 0 } },
  });
  judge(
    "C11. the bistable band forged from 0/18 agree to 18/18",
    dir,
    "bistable.agree",
    "the registered bistable obligation can be reported as passed when it failed",
  );
}

// ── C12. Forged per-regime row, headline untouched ────────────────────────────────────────────
{
  const perRegime = arm2Report.perRegime.map((r) =>
    r.regime === "columns" ? { ...r, agree: 12, disagree: 0 } : r,
  );
  const dir = materialize("c12-forged-perregime", { report: { ...arm2Report, perRegime } });
  judge(
    "C12. the columns regime forged from 0/12 to 12/12, headline left alone",
    dir,
    "perRegime[columns].agree",
    "the per-regime breakdown can contradict the measurements it summarizes",
  );
}

// ── C13. Forged headline AND per-regime together, so the sum invariant still holds ────────────
//
// C12 is catchable by arithmetic alone. This one is not: the forger moves the columns row and the
// headline by the same 12, so `sum(perRegime) === headline` remains true. Only re-derivation from
// the measurements can reject it.
{
  const perRegime = arm2Report.perRegime.map((r) =>
    r.regime === "columns" ? { ...r, agree: 12, disagree: 0 } : r,
  );
  const dir = materialize("c13-forged-consistently", {
    report: {
      ...arm2Report,
      perRegime,
      headlineAgree: arm2Report.headlineAgree + 12,
      headlineAgreeCommonDenominator: arm2Report.headlineAgreeCommonDenominator + 12,
    },
  });
  judge(
    "C13. columns 0->12 AND the headline moved to match, so sum(perRegime) === headline still holds",
    dir,
    "headlineAgree",
    "an internally consistent forgery of the headline survives, and the sum invariant gives it cover",
  );
}

// ── C14. Arm 1's diagram in arm 2's artifact ──────────────────────────────────────────────────
//
// The figure is what gets pasted into a report. A correct report.json beside a mislabeled figure is
// how a wrong caption enters the record.
{
  const dir = materialize("c14-arm1-diagram", { svgFrom: ARM1 });
  judge(
    "C14. arm 1's diagram.svg placed beside arm 2's correct report.json",
    dir,
    "diagram.svg",
    "the published FIGURE — the thing that actually gets shown — can be the other arm's",
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────────────────────
const by = (o) => results.filter((r) => r.outcome === o);
console.log("\n" + "=".repeat(96));
console.log(
  `${results.length} controls executed — ${by("CAUGHT").length} CAUGHT, ` +
    `${by("INCIDENTAL").length} INCIDENTAL, ${by("GAP").length} GAP, ${by("ERROR").length} ERROR`,
);
for (const r of [...by("GAP"), ...by("INCIDENTAL")]) console.log(`  ${r.outcome}: ${r.name}`);
console.log("\nA GAP is a finding: it is reported, never silenced, and it does not fail this script.");
console.log("Only a control that could not execute its own mutation does.");
rmSync(workRoot, { recursive: true, force: true });
console.log(`PHASE6 ARM2 NEGATIVE CONTROLS: ${by("ERROR").length === 0 ? "ALL EXECUTED" : "INCOMPLETE"}`);
if (by("ERROR").length > 0) process.exit(1);
