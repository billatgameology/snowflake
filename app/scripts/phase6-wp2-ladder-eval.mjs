// Phase 6 WP2 numerical-control ladder — the evaluator.
//
// Implements the plan's frozen deterministic selection function from rows.jsonl ALONE
// (docs/plans/phase-6-wp2-ladder.md, FROZEN 2026-08-08): a spacing PASSES iff, at all four
// points and both arms, both successive domain increments satisfy the registered criterion
// (identical habit class AND attached counts within 0.5%) AND every auxiliary control at the
// base rung satisfies the same comparison. Anything else — any failed comparison, capped row,
// dropped/missing row, or unconverged run — is no-pass for that spacing.
//
// Rule 9: this file is deliberately IMPORT-FREE from runner/src and the workspace packages, so
// it can serve as the artifact-derived recomputation. The registered values it needs are
// TRANSCRIBED below with their sources; runner/test/phase6-wp2-ladder-eval.test.ts cross-checks
// the enumeration against the dispatcher's.
//
// Output: the full comparison table as JSON on stdout, a human summary on stderr. Exit 0 always
// (the verdict is data, not an error); exit 1 is reserved for usage errors.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const DEFAULT_ROWS_PATH = join(REPO_ROOT, "out", "phase6-wp2-ladder", "rows.jsonl");

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

// ── The frozen enumeration, transcribed from the plan (NOT imported from the dispatcher —
//    the producer must not supply both sides of the comparison it participates in) ───────────
const CHECK_POINTS = [
  { tempC: -31, fraction: 0.6 },
  { tempC: -13, fraction: 0.15 },
  { tempC: -6, fraction: 0.15 },
  { tempC: -27, fraction: 0.15 },
];
const ARMS = ["M1", "CAK"];
const SPACINGS = [
  { dxUm: 0.7, domainNs: [48, 64, 80] },
  { dxUm: 0.35, domainNs: [96, 112, 128] },
];
// The 0.35 um base rung the auxiliary controls compare against.
const AUX_BASE_DX_UM = 0.35;
const AUX_BASE_DOMAIN_N = 96;
const AUX_CONTROL_NAMES = ["cfl0.05", "relaxTol1e-10", "seed16", "seed18"];

const domainRowId = (dxUm, domainN, point, arm) =>
  `dom-${dxUm}-n${domainN}@${point.tempC}C-f${point.fraction}-${arm}`;
const auxRowId = (name, point, arm) => `aux-${name}@${point.tempC}C-f${point.fraction}-${arm}`;

function expectedRowIds() {
  const ids = [];
  for (const spacing of SPACINGS) {
    for (const domainN of spacing.domainNs) {
      for (const point of CHECK_POINTS) {
        for (const arm of ARMS) ids.push(domainRowId(spacing.dxUm, domainN, point, arm));
      }
    }
  }
  for (const name of AUX_CONTROL_NAMES) {
    for (const point of CHECK_POINTS) {
      for (const arm of ARMS) ids.push(auxRowId(name, point, arm));
    }
  }
  return ids;
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
const artifactDefects = [];
const rowsById = new Map();
const duplicateIds = new Set();
if (!existsSync(rowsPath)) {
  artifactDefects.push(`rows file does not exist: ${rowsPath}`);
} else {
  const lines = readFileSync(rowsPath, "utf8").split("\n");
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

const expected = expectedRowIds();
const expectedSet = new Set(expected);
const missingRowIds = expected.filter((id) => !rowsById.has(id));
const unexpectedRowIds = [...rowsById.keys()].filter((id) => !expectedSet.has(id));

// Transcribed classifier (see the source comments above).
function classifyHabit(aspectRatioValue) {
  if (typeof aspectRatioValue !== "number" || !Number.isFinite(aspectRatioValue)) return "invalid";
  if (aspectRatioValue <= 0) return "invalid";
  if (aspectRatioValue <= PLATE_AR_CEILING) return "plate";
  if (aspectRatioValue >= COLUMN_AR_FLOOR) return "column";
  return "neutral";
}

/** Why a row cannot enter a registered comparison, or null if it can. */
function notComparableReason(rowId) {
  if (duplicateIds.has(rowId)) return `row ${rowId} is duplicated in the artifact`;
  const row = rowsById.get(rowId);
  if (row === undefined) {
    return `row ${rowId} is missing from the artifact (a dropped or missing row forces no-pass)`;
  }
  if (row.stopReason !== COMPARABLE_STOP_REASON) {
    return (
      `row ${rowId} is not comparable: stopReason "${String(row.stopReason)}" ` +
      `(only "${COMPARABLE_STOP_REASON}" rows are comparable; capped, unconverged, ` +
      "contact-stopped or errored rows can only produce no-pass)"
    );
  }
  if (!Number.isSafeInteger(row.attachedCount) || row.attachedCount <= 0) {
    return `row ${rowId} has an invalid attachedCount: ${String(row.attachedCount)}`;
  }
  return null;
}

/** One registered comparison between two rows: identical class AND counts within 0.5%. */
function compareRows(kind, label, point, arm, rowIdA, rowIdB) {
  const rowA = rowsById.get(rowIdA);
  const rowB = rowsById.get(rowIdB);
  const classA = rowA === undefined ? null : classifyHabit(rowA.aspectRatio);
  const classB = rowB === undefined ? null : classifyHabit(rowB.aspectRatio);
  const attachedA = rowA === undefined ? null : rowA.attachedCount;
  const attachedB = rowB === undefined ? null : rowB.attachedCount;
  const failures = [];
  const gateA = notComparableReason(rowIdA);
  const gateB = notComparableReason(rowIdB);
  if (gateA !== null) failures.push(gateA);
  if (gateB !== null) failures.push(gateB);
  let relDiff = null;
  if (failures.length === 0) {
    if (classA === "invalid" || classB === "invalid") {
      failures.push(
        `aspect ratio is not classifiable (${rowIdA}: ${String(rowA.aspectRatio)}, ` +
          `${rowIdB}: ${String(rowB.aspectRatio)})`,
      );
    } else if (classA !== classB) {
      failures.push(
        `habit class differs: ${classA} (${rowIdA}, AR=${rowA.aspectRatio}) vs ` +
          `${classB} (${rowIdB}, AR=${rowB.aspectRatio})`,
      );
    }
    relDiff = Math.abs(attachedA - attachedB) / attachedA;
    if (relDiff > ATTACHED_COUNT_TOLERANCE) {
      failures.push(
        `attached counts differ by ${(relDiff * 100).toFixed(3)}% ` +
          `(${attachedA} vs ${attachedB}), over the registered 0.5%`,
      );
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
    reason:
      failures.length === 0
        ? "identical habit class and attached counts within the registered 0.5%"
        : failures.join("; "),
  };
}

// ── Build every registered comparison ───────────────────────────────────────────────────────
// Auxiliary controls, compared against their matching base-rung row (same point + arm, at the
// dx = 0.35 um, N = 96 base configuration).
const auxiliaryComparisons = [];
for (const name of AUX_CONTROL_NAMES) {
  for (const point of CHECK_POINTS) {
    for (const arm of ARMS) {
      auxiliaryComparisons.push(
        compareRows(
          "auxiliary",
          `aux-${name}-vs-n${AUX_BASE_DOMAIN_N}-base`,
          point,
          arm,
          domainRowId(AUX_BASE_DX_UM, AUX_BASE_DOMAIN_N, point, arm),
          auxRowId(name, point, arm),
        ),
      );
    }
  }
}
const auxiliaryPass = auxiliaryComparisons.every((c) => c.verdict === "pass");

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
  const reasons = [
    ...domainComparisons.filter((c) => c.verdict !== "pass").map((c) =>
      `${c.comparison} @ ${c.tempC}C f${c.fraction} ${c.arm}: ${c.reason}`,
    ),
    ...(domainPass && auxiliaryPass
      ? []
      : auxiliaryComparisons.filter((c) => c.verdict !== "pass").map((c) =>
          `${c.comparison} @ ${c.tempC}C f${c.fraction} ${c.arm}: ${c.reason}`,
        )),
  ];
  return {
    dxUm: spacing.dxUm,
    domainNs: spacing.domainNs,
    domainComparisons,
    domainPass,
    auxiliaryPass,
    // Plan, "The deterministic selection function": a spacing passes iff BOTH successive
    // increments pass at every point and arm AND every auxiliary control at the base rung
    // passes the same comparison. The auxiliary conjunct therefore gates BOTH spacings.
    verdict: domainPass && auxiliaryPass ? "pass" : "no-pass",
    reasons,
  };
});

const report = {
  ladder: "phase6-wp2-numerical-control-ladder",
  plan: "docs/plans/phase-6-wp2-ladder.md (FROZEN 2026-08-08)",
  rowsPath,
  selectionFunctionNote:
    "a spacing PASSES iff, at all four points and both arms, both successive domain " +
    "increments satisfy the registered criterion (identical habit class AND attached counts " +
    "within 0.5%) AND every auxiliary control at the base rung satisfies the same comparison; " +
    "any failed comparison, capped row, dropped/missing row, or unconverged run is no-pass",
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
  auxiliaryComparisons,
  spacings,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

// ── Human summary (stderr, so stdout stays machine-parseable) ───────────────────────────────
const summary = [];
summary.push("Phase 6 WP2 ladder — deterministic selection function (frozen plan)");
summary.push(
  `rows: ${report.presentExpectedRowCount}/${report.expectedRowCount} expected present, ` +
    `${missingRowIds.length} missing, ${unexpectedRowIds.length} unexpected, ` +
    `${artifactDefects.length} artifact defect(s)`,
);
for (const spacing of spacings) {
  const failing = spacing.domainComparisons.filter((c) => c.verdict !== "pass").length;
  summary.push(
    `spacing ${spacing.dxUm} um: ${spacing.verdict.toUpperCase()} ` +
      `(domain ${spacing.domainComparisons.length - failing}/${spacing.domainComparisons.length}, ` +
      `auxiliary ${auxiliaryComparisons.filter((c) => c.verdict === "pass").length}/` +
      `${auxiliaryComparisons.length})`,
  );
  for (const reason of spacing.reasons.slice(0, 8)) summary.push(`  - ${reason}`);
  if (spacing.reasons.length > 8) {
    summary.push(`  - (${spacing.reasons.length - 8} more in the JSON table)`);
  }
}
console.error(summary.join("\n"));
