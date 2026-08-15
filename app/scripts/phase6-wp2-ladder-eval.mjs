// Phase 6 WP2 numerical-control ladder — the evaluator.
//
// Implements the plan's frozen deterministic selection function from rows.jsonl ALONE
// (docs/plans/phase-6-wp2-ladder.md, FROZEN 2026-08-08): a spacing PASSES iff, at all four
// points and both arms, both successive domain increments satisfy the registered criterion
// (identical habit class AND attached counts within 0.5%) AND every auxiliary control at the
// base rung satisfies the same comparison. Anything else — any failed comparison, capped row,
// dropped/missing row, or unconverged run — is no-pass for that spacing.
//
// Per the unit's pre-execution review the evaluator FAILS CLOSED on the artifact itself, not
// only on the comparisons (B1/B2): a row whose echoed operands (the nine per-row operands, the
// frozen fixed block, and seedThickness = 2*seedRadius + 1) differ from this file's own
// transcription of the enumeration is rejected by name; non-empty artifactDefects
// (unparseable/truncated lines, duplicated rowIds) and unexpectedRowIds force overall AND
// per-spacing no-pass; and more than one distinct gitHead forces no-pass unless every row
// carries acceptedMixedHeads. Every no-pass is classed (review H4) as "criterion" (a
// registered comparison failed), "infrastructure" (cap / child-error / missing / truncated /
// echo mismatch / mixed-heads), or "mixed". The report carries the sha256 of the exact
// rows.jsonl bytes read and a top-level overallVerdict (H12), and the frozen scope statement
// (B4) verbatim.
//
// Rule 9: this file is deliberately IMPORT-FREE from runner/src and the workspace packages, so
// it can serve as the artifact-derived recomputation. The registered values it needs are
// TRANSCRIBED below with their sources; runner/test/phase6-wp2-ladder-eval.test.ts cross-checks
// the enumeration against the dispatcher's.
//
// Output: the full comparison table as JSON on stdout, a human summary on stderr. Exit 0 always
// (the verdict is data, not an error); exit 1 is reserved for usage errors.

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const DEFAULT_ROWS_PATH = join(REPO_ROOT, "out", "phase6-wp2-ladder", "rows.jsonl");

// ── The frozen scope statement (review B4), emitted verbatim in the JSON report and the
//    stderr summary. No verdict from this evaluator means anything outside this scope ────────
const SCOPE_STATEMENT =
  "SCOPE: This verdict covers the floor sizes only (seed 17 cells growing to extent 54 at " +
  "dx 0.35 um; seed 8 to extent 27 at dx 0.7 um) at the four registered check points. The " +
  "S1-ceiling seed, S2-ceiling extent, and the 0.2333 um fine spacing are excluded as " +
  "measured-scaling-infeasible under decision 0045's envelope; the S2-ceiling stratum's " +
  "numerics are UNVERIFIED. A pass authorizes no production campaign (decision 0045). The " +
  "M1_NO_DIP_ABLATION arm inherits M1's rung verdict as an untested transfer assumption, " +
  "not a measurement.";

// ── Registered values, transcribed literally (never imported — see the header) ──────────────
// Habit-class thresholds: runner/src/phase6-protocol.ts freeze item "metric-thresholds"
// ("AR = z-extent / T-extent; plate AR <= 1/1.5 (0.6667), column AR >= 1.5, otherwise
// neutral"), implemented by phase6ClassifyHabit in runner/src/phase6-sweep.ts
// (PLATE_CEILING = 1 / 1.5, COLUMN_FLOOR = 1.5; nonfinite or nonpositive AR = invalid).
const PLATE_AR_CEILING = 1 / 1.5;
const COLUMN_AR_FLOOR = 1.5;
// Attached-count tolerance: runner/src/phase6-protocol.ts
// PHASE6_DOMAIN_SPOT_CHECK.attachedCountTolerance = 0.005 ("attached-cell counts within
// 0.5%"). Denominator convention: the REFERENCE row's count — the coarse rung for a domain
// pair, the base rung for an auxiliary comparison — exactly matching the registered
// phase6DomainSpotCheckPasses(coarse, fine) implementation in runner/src/phase6-sweep.ts,
// which divides by the coarse count. (An earlier draft used max(a, b), which is LENIENT
// whenever the variant grows: corrected 2026-08-08 before any ladder row ran.)
const ATTACHED_COUNT_TOLERANCE = 0.005;
// The only stopReason that yields a comparable row (plan: "Stop mapping, frozen" — rows stop
// on the existing size-target machinery; capped/unconverged/contact/errored rows can only
// produce no-pass).
const COMPARABLE_STOP_REASON = "size-target";
// Review H4 reason classes for a no-pass.
const CLASS_CRITERION = "criterion";
const CLASS_INFRASTRUCTURE = "infrastructure";
const CLASS_MIXED = "mixed";

// ── The frozen enumeration WITH its operands, transcribed from the plan (NOT imported from
//    the dispatcher — the producer must not supply both sides of the comparison it
//    participates in). Review B1: the evaluator checks every row's ECHOED operands against
//    this transcription, so a row that ran the wrong configuration cannot enter a comparison ─
// sigmaInfinity transcribed from the registered phase6SigmaInf at each point, as the EXACT
// binary64 serialization the function returns (review residual 1: the echo is checked against
// these literals, not recomputed here — Rule 9; the -31/0.6 value carries the product's
// last-ULP tail and must not be rounded to 0.21204).
const CHECK_POINTS = [
  { tempC: -31, fraction: 0.6, sigmaInfinity: 0.21204000000000003 },
  { tempC: -13, fraction: 0.15, sigmaInfinity: 0.02025 },
  { tempC: -6, fraction: 0.15, sigmaInfinity: 0.00906 },
  { tempC: -27, fraction: 0.15, sigmaInfinity: 0.045375 },
];
const ARMS = ["M1", "CAK"];
const SPACINGS = [
  { dxUm: 0.7, seedRadius: 8, targetExtent: 27, domainNs: [48, 64, 80] },
  { dxUm: 0.35, seedRadius: 17, targetExtent: 54, domainNs: [96, 112, 128] },
];
const BASE_CFL = 0.1;
const BASE_RELAX_TOL = 1e-9;
// The 0.35 um base rung the auxiliary controls compare against, and the four controls with
// the single operand each varies (plan: "Auxiliary controls at the base rung").
const AUX_BASE = { dxUm: 0.35, seedRadius: 17, targetExtent: 54, domainN: 96 };
const AUX_CONTROLS = [
  { name: "cfl0.05", cflFill: 0.05 },
  { name: "relaxTol1e-10", relaxTol: 1e-10 },
  { name: "seed16", seedRadius: 16 },
  { name: "seed18", seedRadius: 18 },
];
// The frozen fixed block every row must echo (plan: "Fixed run configuration, frozen").
const EXPECTED_FIXED = {
  farField: "monopole-matched",
  surfacePolicy: "aggregate-hv-g1h1-v6",
  pressurePa: 101325,
  noiseEpsilon: 0,
  rngSeed: 1,
  domain: "hexPrism",
  divTol: 1e-7,
  relaxMaxSweeps: 200000,
};
const OPERAND_FIELDS = [
  "tempC",
  "fraction",
  "sigmaInfinity",
  "paramSet",
  "dxUm",
  "seedRadius",
  "targetExtent",
  "domainN",
  "cflFill",
  "relaxTol",
];

const domainRowId = (dxUm, domainN, point, arm) =>
  `dom-${dxUm}-n${domainN}@${point.tempC}C-f${point.fraction}-${arm}`;
const auxRowId = (name, point, arm) => `aux-${name}@${point.tempC}C-f${point.fraction}-${arm}`;

/** rowId → the full expected operand tuple, in the dispatcher's execution order. */
function expectedRowsById() {
  const byId = new Map();
  for (const spacing of SPACINGS) {
    for (const domainN of spacing.domainNs) {
      for (const point of CHECK_POINTS) {
        for (const arm of ARMS) {
          byId.set(domainRowId(spacing.dxUm, domainN, point, arm), {
            tempC: point.tempC,
            fraction: point.fraction,
            sigmaInfinity: point.sigmaInfinity,
            paramSet: arm,
            dxUm: spacing.dxUm,
            seedRadius: spacing.seedRadius,
            targetExtent: spacing.targetExtent,
            domainN,
            cflFill: BASE_CFL,
            relaxTol: BASE_RELAX_TOL,
          });
        }
      }
    }
  }
  for (const control of AUX_CONTROLS) {
    for (const point of CHECK_POINTS) {
      for (const arm of ARMS) {
        byId.set(auxRowId(control.name, point, arm), {
          tempC: point.tempC,
          fraction: point.fraction,
          sigmaInfinity: point.sigmaInfinity,
          paramSet: arm,
          dxUm: AUX_BASE.dxUm,
          seedRadius: control.seedRadius ?? AUX_BASE.seedRadius,
          targetExtent: AUX_BASE.targetExtent,
          domainN: AUX_BASE.domainN,
          cflFill: control.cflFill ?? BASE_CFL,
          relaxTol: control.relaxTol ?? BASE_RELAX_TOL,
        });
      }
    }
  }
  return byId;
}

// ── Argv ────────────────────────────────────────────────────────────────────────────────────
let rowsPath = DEFAULT_ROWS_PATH;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--rows") {
    const raw = argv[++i];
    if (raw === undefined || raw === "") {
      console.error("phase6-wp2-ladder-eval: --rows needs a path");
      process.exit(1);
    }
    rowsPath = raw;
  } else {
    console.error(`phase6-wp2-ladder-eval: unknown flag: ${argv[i]}`);
    process.exit(1);
  }
}

// ── Read the artifact. Every defect is named; nothing is silently dropped ───────────────────
// Review H12: the report carries the sha256 of the EXACT bytes this evaluation read.
const artifactDefects = [];
const rowsById = new Map();
const duplicateIds = new Set();
let rowsSha256 = null;
if (!existsSync(rowsPath)) {
  artifactDefects.push(`rows file does not exist: ${rowsPath}`);
} else {
  const bytes = readFileSync(rowsPath);
  rowsSha256 = createHash("sha256").update(bytes).digest("hex");
  const text = bytes.toString("utf8");
  if (text.length > 0 && !text.endsWith("\n")) {
    // Review B1: a truncated partial append is a named defect, not a warning.
    artifactDefects.push(
      "rows file does not end in a newline — its final line is a truncated partial append",
    );
  }
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      artifactDefects.push(`line ${i + 1} is not parseable JSON`);
      continue;
    }
    if (parsed === null || typeof parsed !== "object" || typeof parsed.rowId !== "string") {
      artifactDefects.push(`line ${i + 1} has no string rowId`);
      continue;
    }
    if (rowsById.has(parsed.rowId)) {
      duplicateIds.add(parsed.rowId);
      artifactDefects.push(
        `rowId ${parsed.rowId} appears more than once — ambiguous artifact, ` +
          "every comparison using it is forced no-pass",
      );
      continue;
    }
    rowsById.set(parsed.rowId, parsed);
  }
}

const expectedById = expectedRowsById();
const expected = [...expectedById.keys()];
const expectedSet = new Set(expected);
const missingRowIds = expected.filter((id) => !rowsById.has(id));
const unexpectedRowIds = [...rowsById.keys()].filter((id) => !expectedSet.has(id));

// ── Provenance across the artifact (review B2): distinct gitHeads, fail-closed on mixture ───
const headOf = (row) =>
  typeof row.gitHead === "string" && row.gitHead.length > 0 ? row.gitHead : "(absent)";
const presentRows = [...rowsById.values()];
// Review residual 2: an ABSENT or MALFORMED gitHead is an artifact defect in its own right —
// the sanctioned dispatcher always stamps a validated 40-hex head, so anything else is a
// hand-assembled or pre-repair artifact and the evaluator fails closed on it.
for (const row of presentRows) {
  if (typeof row.gitHead !== "string" || !/^[0-9a-f]{40}$/.test(row.gitHead)) {
    artifactDefects.push(
      `row ${row.rowId}: gitHead is absent or not 40-hex (${JSON.stringify(row.gitHead ?? null)})`,
    );
  }
}
const distinctGitHeads = [...new Set(presentRows.map(headOf))].sort();
// 2026-08-09 maker-directed amendment (docs/plans/phase-6-wp2-ladder.md, Execution scheduling
// record), pre-declared before any N=112/128 row ran: execution is a sanctioned TWO-PHASE run.
// Rows recorded before the heavy-cap amendment carry the freeze-era head below; all later rows
// carry exactly one other head (the amendment commit, checked against the plan by the unit
// review); and every heavy row (dom-0.35-n112/n128) MUST carry the non-freeze head, because
// none had run before the amendment. Anything outside that shape is an artifact defect.
const LADDER_FREEZE_HEAD = "f59d18702301155c0c2e7eaecc3442e6cf117123";
// 2026-08-11 second amendment: the first-amendment head is also sanctioned literally, and at
// most ONE later head (the second amendment's landing commit, checked by the unit review).
const FIRST_AMENDMENT_HEAD = "aa812952efbf5c4ef7152cc7595342092a51b000";
const HEAVY_ROW_ID_PATTERN = /^dom-0.35-n(112|128)@/;
const nonFreezeHeads = distinctGitHeads.filter(
  (head) => head !== LADDER_FREEZE_HEAD && head !== FIRST_AMENDMENT_HEAD,
);
let mixedHeadsNoPass = false;
if (nonFreezeHeads.length > 1) {
  mixedHeadsNoPass = true;
  artifactDefects.push(
    `more than one non-freeze gitHead present (${nonFreezeHeads.join(", ")}): the sanctioned ` +
      "two-phase execution allows the freeze-era head plus exactly one amendment head",
  );
}
for (const row of presentRows) {
  if (HEAVY_ROW_ID_PATTERN.test(row.rowId) && row.gitHead === LADDER_FREEZE_HEAD) {
    mixedHeadsNoPass = true;
    artifactDefects.push(
      `heavy row ${row.rowId} carries the freeze-era head ${LADDER_FREEZE_HEAD.slice(0, 8)} — ` +
        "no N=112/128 row ran before the 16 h cap amendment, so this row is not sanctioned",
    );
  }
}
const amendmentHead = nonFreezeHeads.length === 1 ? nonFreezeHeads[0] : null;

// Transcribed classifier (see the source comments above).
function classifyHabit(aspectRatioValue) {
  if (typeof aspectRatioValue !== "number" || !Number.isFinite(aspectRatioValue)) return "invalid";
  if (aspectRatioValue <= 0) return "invalid";
  if (aspectRatioValue <= PLATE_AR_CEILING) return "plate";
  if (aspectRatioValue >= COLUMN_AR_FLOOR) return "column";
  return "neutral";
}

/** Review B1: every echoed operand a row must match, against this file's own transcription. */
function echoMismatches(row, expectedRow) {
  const mismatches = [];
  const check = (field, expectedValue) => {
    if (row[field] !== expectedValue) {
      mismatches.push(
        `${field}=${JSON.stringify(row[field])} (expected ${JSON.stringify(expectedValue)})`,
      );
    }
  };
  for (const field of OPERAND_FIELDS) check(field, expectedRow[field]);
  for (const [field, value] of Object.entries(EXPECTED_FIXED)) check(field, value);
  // The isometric seed mapping the strata freeze records.
  check("seedThickness", 2 * expectedRow.seedRadius + 1);
  return mismatches;
}

/** Why a row cannot enter a registered comparison ({ reason, failureClass }), or null. */
function comparabilityGate(rowId) {
  const infra = (reason) => ({ reason, failureClass: CLASS_INFRASTRUCTURE });
  if (duplicateIds.has(rowId)) return infra(`row ${rowId} is duplicated in the artifact`);
  const row = rowsById.get(rowId);
  if (row === undefined) {
    return infra(
      `row ${rowId} is missing from the artifact (a dropped or missing row forces no-pass)`,
    );
  }
  const expectedRow = expectedById.get(rowId);
  const mismatches = expectedRow === undefined ? [] : echoMismatches(row, expectedRow);
  if (mismatches.length > 0) {
    return infra(
      `row ${rowId} echoes operands that differ from the frozen enumeration: ` +
        mismatches.join(", "),
    );
  }
  if (row.stopReason !== COMPARABLE_STOP_REASON) {
    return infra(
      `row ${rowId} is not comparable: stopReason "${String(row.stopReason)}" ` +
        `(only "${COMPARABLE_STOP_REASON}" rows are comparable; capped, unconverged, ` +
        "contact-stopped or errored rows can only produce no-pass)",
    );
  }
  if (!Number.isSafeInteger(row.attachedCount) || row.attachedCount <= 0) {
    return infra(`row ${rowId} has an invalid attachedCount: ${String(row.attachedCount)}`);
  }
  return null;
}

/** Review H4: fold a list of failure classes into one no-pass class (or null when empty). */
function foldClasses(classes) {
  const set = new Set(classes);
  if (set.size === 0) return null;
  if (set.size > 1 || set.has(CLASS_MIXED)) return CLASS_MIXED;
  return [...set][0];
}

/** One registered comparison between two rows: identical class AND counts within 0.5%.
 *  rowIdA is the REFERENCE row (coarse rung / base rung) — the relDiff denominator. */
function compareRows(kind, label, point, arm, rowIdA, rowIdB) {
  const rowA = rowsById.get(rowIdA);
  const rowB = rowsById.get(rowIdB);
  const classA = rowA === undefined ? null : classifyHabit(rowA.aspectRatio);
  const classB = rowB === undefined ? null : classifyHabit(rowB.aspectRatio);
  const attachedA = rowA === undefined ? null : rowA.attachedCount;
  const attachedB = rowB === undefined ? null : rowB.attachedCount;
  const failures = [];
  const gateA = comparabilityGate(rowIdA);
  const gateB = comparabilityGate(rowIdB);
  if (gateA !== null) failures.push(gateA);
  if (gateB !== null) failures.push(gateB);
  let relDiff = null;
  if (failures.length === 0) {
    if (classA === "invalid" || classB === "invalid") {
      failures.push({
        reason:
          `aspect ratio is not classifiable (${rowIdA}: ${String(rowA.aspectRatio)}, ` +
          `${rowIdB}: ${String(rowB.aspectRatio)})`,
        failureClass: CLASS_CRITERION,
      });
    } else if (classA !== classB) {
      failures.push({
        reason:
          `habit class differs: ${classA} (${rowIdA}, AR=${rowA.aspectRatio}) vs ` +
          `${classB} (${rowIdB}, AR=${rowB.aspectRatio})`,
        failureClass: CLASS_CRITERION,
      });
    }
    relDiff = Math.abs(attachedA - attachedB) / attachedA;
    if (relDiff > ATTACHED_COUNT_TOLERANCE) {
      failures.push({
        reason:
          `attached counts differ by ${(relDiff * 100).toFixed(3)}% ` +
          `(${attachedA} vs ${attachedB}), over the registered 0.5%`,
        failureClass: CLASS_CRITERION,
      });
    }
  }
  return {
    kind,
    comparison: label,
    tempC: point.tempC,
    fraction: point.fraction,
    arm,
    rowIdA,
    rowIdB,
    classA,
    classB,
    attachedA,
    attachedB,
    relDiff,
    verdict: failures.length === 0 ? "pass" : "no-pass",
    failureClass: foldClasses(failures.map((failure) => failure.failureClass)),
    reason:
      failures.length === 0
        ? "identical habit class and attached counts within the registered 0.5%"
        : failures.map((failure) => failure.reason).join("; "),
  };
}

// ── Build every registered comparison ───────────────────────────────────────────────────────
// Auxiliary controls, compared against their matching base-rung row (same point + arm, at the
// dx = 0.35 um, N = 96 base configuration).
const auxiliaryComparisons = [];
for (const control of AUX_CONTROLS) {
  for (const point of CHECK_POINTS) {
    for (const arm of ARMS) {
      auxiliaryComparisons.push(
        compareRows(
          "auxiliary",
          `aux-${control.name}-vs-n${AUX_BASE.domainN}-base`,
          point,
          arm,
          domainRowId(AUX_BASE.dxUm, AUX_BASE.domainN, point, arm),
          auxRowId(control.name, point, arm),
        ),
      );
    }
  }
}
const auxiliaryPass = auxiliaryComparisons.every((c) => c.verdict === "pass");

// ── Artifact-level forcings (review B1/B2): these gate EVERY spacing and the overall verdict,
//    so a defective or mis-provenanced artifact can never print a pass ───────────────────────
const globalForcings = [];
if (artifactDefects.length > 0) {
  globalForcings.push({
    reason:
      `artifact defects force no-pass: ${artifactDefects.length} defect(s) — ` +
      artifactDefects.join("; "),
    failureClass: CLASS_INFRASTRUCTURE,
  });
}
if (unexpectedRowIds.length > 0) {
  globalForcings.push({
    reason:
      "unexpected rowIds force no-pass (the artifact holds rows the frozen enumeration " +
      `does not contain): ${unexpectedRowIds.join(", ")}`,
    failureClass: CLASS_INFRASTRUCTURE,
  });
}
if (mixedHeadsNoPass) {
  globalForcings.push({
    reason:
      `gitHead provenance forces no-pass: heads present (${distinctGitHeads.join(", ")}) ` +
      "violate the sanctioned two-phase shape (see artifactDefects)",
    failureClass: CLASS_INFRASTRUCTURE,
  });
}
const globalForcingReasons = globalForcings.map((forcing) => forcing.reason);

const spacings = SPACINGS.map((spacing) => {
  const domainComparisons = [];
  for (let i = 0; i + 1 < spacing.domainNs.length; i++) {
    const coarseN = spacing.domainNs[i];
    const fineN = spacing.domainNs[i + 1];
    for (const point of CHECK_POINTS) {
      for (const arm of ARMS) {
        domainComparisons.push(
          compareRows(
            "domain",
            `n${coarseN}->n${fineN}`,
            point,
            arm,
            domainRowId(spacing.dxUm, coarseN, point, arm),
            domainRowId(spacing.dxUm, fineN, point, arm),
          ),
        );
      }
    }
  }
  const domainPass = domainComparisons.every((c) => c.verdict === "pass");
  const failingDomain = domainComparisons.filter((c) => c.verdict !== "pass");
  const failingAuxiliary = auxiliaryComparisons.filter((c) => c.verdict !== "pass");
  const reasons = [
    ...failingDomain.map(
      (c) => `${c.comparison} @ ${c.tempC}C f${c.fraction} ${c.arm}: ${c.reason}`,
    ),
    ...(auxiliaryPass
      ? []
      : failingAuxiliary.map(
          (c) => `${c.comparison} @ ${c.tempC}C f${c.fraction} ${c.arm}: ${c.reason}`,
        )),
    ...globalForcingReasons,
  ];
  const contributingClasses = [
    ...failingDomain.map((c) => c.failureClass),
    ...(auxiliaryPass ? [] : failingAuxiliary.map((c) => c.failureClass)),
    ...globalForcings.map((forcing) => forcing.failureClass),
  ];
  return {
    dxUm: spacing.dxUm,
    domainNs: spacing.domainNs,
    domainComparisons,
    domainPass,
    auxiliaryPass,
    // Plan, "The deterministic selection function": a spacing passes iff BOTH successive
    // increments pass at every point and arm AND every auxiliary control at the base rung
    // passes the same comparison. The auxiliary conjunct therefore gates BOTH spacings —
    // and (review B1/B2) so does every artifact-level forcing above.
    verdict:
      domainPass && auxiliaryPass && globalForcings.length === 0 ? "pass" : "no-pass",
    noPassClass: foldClasses(contributingClasses),
    reasons,
  };
});

const overallVerdict = spacings.every((spacing) => spacing.verdict === "pass")
  ? "pass"
  : "no-pass";
const overallNoPassClass = foldClasses(
  spacings.flatMap((spacing) => (spacing.noPassClass === null ? [] : [spacing.noPassClass])),
);

const report = {
  ladder: "phase6-wp2-numerical-control-ladder",
  plan: "docs/plans/phase-6-wp2-ladder.md (FROZEN 2026-08-08)",
  scopeStatement: SCOPE_STATEMENT,
  overallVerdict,
  overallNoPassClass,
  rowsPath,
  rowsSha256,
  selectionFunctionNote:
    "a spacing PASSES iff, at all four points and both arms, both successive domain " +
    "increments satisfy the registered criterion (identical habit class AND attached counts " +
    "within 0.5%) AND every auxiliary control at the base rung satisfies the same comparison; " +
    "any failed comparison, capped row, dropped/missing row, or unconverged run is no-pass — " +
    "and artifact defects, unexpected rowIds, echo mismatches against the frozen enumeration, " +
    "and unaccepted mixed gitHeads force no-pass (fail-closed)",
  thresholds: {
    plateARCeiling: PLATE_AR_CEILING,
    columnARFloor: COLUMN_AR_FLOOR,
    attachedCountTolerance: ATTACHED_COUNT_TOLERANCE,
    comparableStopReason: COMPARABLE_STOP_REASON,
  },
  expectedRowCount: expected.length,
  presentExpectedRowCount: expected.length - missingRowIds.length,
  missingRowIds,
  unexpectedRowIds,
  artifactDefects,
  distinctGitHeads,
  ladderFreezeHead: LADDER_FREEZE_HEAD,
  amendmentHead,
  globalForcingReasons,
  auxiliaryComparisons,
  spacings,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

// ── Human summary (stderr, so stdout stays machine-parseable) ───────────────────────────────
const summary = [];
summary.push("Phase 6 WP2 ladder — deterministic selection function (frozen plan)");
summary.push(SCOPE_STATEMENT);
summary.push(
  `overall: ${overallVerdict.toUpperCase()}` +
    (overallNoPassClass === null ? "" : ` (class: ${overallNoPassClass})`) +
    ` — rows.jsonl sha256=${rowsSha256 ?? "(no rows file)"}`,
);
summary.push(
  `rows: ${report.presentExpectedRowCount}/${report.expectedRowCount} expected present, ` +
    `${missingRowIds.length} missing, ${unexpectedRowIds.length} unexpected, ` +
    `${artifactDefects.length} artifact defect(s), ` +
    `${distinctGitHeads.length} distinct gitHead(s)` +
    (distinctGitHeads.length > 1
      ? ` [${distinctGitHeads.join(", ")}] amendmentHead=${amendmentHead ?? "(violated)"}`
      : ""),
);
for (const forcing of globalForcingReasons) summary.push(`  FORCED: ${forcing}`);
for (const spacing of spacings) {
  const failing = spacing.domainComparisons.filter((c) => c.verdict !== "pass").length;
  summary.push(
    `spacing ${spacing.dxUm} um: ${spacing.verdict.toUpperCase()}` +
      (spacing.noPassClass === null ? "" : ` (class: ${spacing.noPassClass})`) +
      ` (domain ${spacing.domainComparisons.length - failing}/${spacing.domainComparisons.length}, ` +
      `auxiliary ${auxiliaryComparisons.filter((c) => c.verdict === "pass").length}/` +
      `${auxiliaryComparisons.length})`,
  );
  for (const reason of spacing.reasons.slice(0, 8)) summary.push(`  - ${reason}`);
  if (spacing.reasons.length > 8) {
    summary.push(`  - (${spacing.reasons.length - 8} more in the JSON table)`);
  }
}
console.error(summary.join("\n"));
