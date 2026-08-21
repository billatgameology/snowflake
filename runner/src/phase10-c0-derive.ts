import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  PHASE10_C0_COST_FIELDS,
  PHASE10_C0_ERROR_SOURCE_IDS,
  PHASE10_C0_GAP_IDS,
  PHASE10_C0_NUMERICAL_FIELDS,
  PHASE10_C0_ROW_FIELDS,
  PHASE10_C0_SCIENCE_PROTOCOL_ID,
  parsePhase10C0Protocol,
  parsePhase10C0Rows,
  phase10C0ArtifactIdentity,
  phase10C0AssertBoundExecution,
  phase10C0ClassifyHabit,
  phase10C0EverySpacing,
  phase10C0FoldFailureClasses,
  phase10C0GapItems,
  phase10C0JsonlBytes,
  phase10C0Lexical,
  phase10C0NormalizedAbsoluteDelta,
  phase10C0ParsePrettyJson,
  phase10C0PrettyJsonBytes,
  phase10C0Sha256,
  type Phase10C0ArtifactDefect,
  type Phase10C0ExecutionProvenance,
  type Phase10C0FailureClass,
  type Phase10C0Pairing,
  type Phase10C0ParsedRows,
  type Phase10C0Row,
} from "./phase10-c0-contracts.ts";

const HISTORICAL_SCRIPT_PATH = "app/scripts/phase6-wp2-ladder-independent.mjs";
const HISTORICAL_SCRIPT_BYTES = 8_149;
const HISTORICAL_SCRIPT_SHA256 =
  "7a9371917dbc56005b4e612c0637dce1cdc0156230a6495bd0d4042d3811181a";

type JsonObject = { readonly [key: string]: StrictJson };

interface Diagnostic {
  readonly category: "numerical-observable" | "execution-cost";
  readonly fieldId: string;
  readonly valueA: number | null;
  readonly valueB: number | null;
  readonly normalizedAbsoluteDelta: number | null;
  readonly availability: "defined" | "unavailable";
  readonly unavailableReason: string | null;
}

interface CategoricalDiagnostic {
  readonly fieldId: "stopReason";
  readonly valueA: string | null;
  readonly valueB: string | null;
  readonly disagreement: 0 | 1 | null;
  readonly availability: "defined" | "unavailable";
  readonly unavailableReason: string | null;
}

interface FailureReason {
  readonly code: string;
  readonly failureClass: Phase10C0FailureClass;
  readonly detail: string;
}

interface ComparisonRow {
  readonly schema: "phase10-c0-comparison-row-v1";
  readonly comparisonId: string;
  readonly kind: "domain" | "auxiliary";
  readonly errorSourceId: string;
  readonly domainSpacingDxUm: 0.7 | 0.35 | null;
  readonly rowIdA: string;
  readonly rowIdB: string;
  readonly rowA: Phase10C0Row | null;
  readonly rowB: Phase10C0Row | null;
  readonly habitClassA: string | null;
  readonly habitClassB: string | null;
  readonly attachedCountRelativeDifference: number | null;
  readonly habitCriterionPass: boolean | null;
  readonly attachedCountCriterionPass: boolean | null;
  readonly comparisonVerdict: "pass" | "no-pass";
  readonly failureClass: Phase10C0FailureClass | null;
  readonly failureReasons: readonly FailureReason[];
  readonly normalizedDiagnostics: readonly Diagnostic[];
  readonly categoricalDiagnostics: readonly CategoricalDiagnostic[];
}

interface SpacingResult {
  readonly dxUm: 0.7 | 0.35;
  readonly domainComparisonCount: 16;
  readonly domainPass: boolean;
  readonly auxiliaryComparisonCount: 32;
  readonly auxiliaryPass: boolean;
  readonly verdict: "pass" | "no-pass";
  readonly noPassClass: Phase10C0FailureClass | null;
  readonly reasons: readonly string[];
}

interface RankingEntry {
  readonly rank: number;
  readonly observableId: string;
  readonly errorSourceId: string;
  readonly comparisonCount: number;
  readonly definedCount: number;
  readonly nonZeroComparisonCount: number;
  readonly maxNormalizedAbsoluteDelta: number | null;
  readonly maxWitnessPairId: string | null;
}

export interface Phase10C0DeriveRequest {
  readonly scienceProtocolBytes: Uint8Array;
  readonly preflightReceiptBytes: Uint8Array;
  readonly rowsBytes: Uint8Array;
  readonly historicalReportBytes: Uint8Array;
  readonly execution: Phase10C0ExecutionProvenance;
  /** False is reserved for synthetic fixtures; an executor must omit this field or pass true. */
  readonly enforceFrozenInputIdentities?: boolean;
}

export interface Phase10C0DeriveArtifacts {
  readonly analysisBytes: Uint8Array;
  readonly comparisonsBytes: Uint8Array;
  readonly gapsBytes: Uint8Array;
  readonly historicalLimitBytes: Uint8Array;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0 derive refused: ${message}`);
}

function object(value: StrictJson, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value as JsonObject;
}

function distinctSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort(phase10C0Lexical));
}

function globalDefectReasons(defects: readonly Phase10C0ArtifactDefect[]): readonly FailureReason[] {
  if (defects.length === 0) return Object.freeze([]);
  return Object.freeze([
    Object.freeze({
      code: "c0-artifact-defect",
      failureClass: "infrastructure" as const,
      detail: `${defects.length} artifact defect(s) force every comparison and spacing to no-pass`,
    }),
  ]);
}

function numericalDiagnostic(
  category: Diagnostic["category"],
  fieldId: string,
  rowA: Phase10C0Row | null,
  rowB: Phase10C0Row | null,
): Diagnostic {
  const valueA = rowA === null ? null : rowA[fieldId as keyof Phase10C0Row];
  const valueB = rowB === null ? null : rowB[fieldId as keyof Phase10C0Row];
  if (typeof valueA !== "number" || typeof valueB !== "number") {
    return Object.freeze({
      category,
      fieldId,
      valueA: typeof valueA === "number" && Number.isFinite(valueA) ? valueA : null,
      valueB: typeof valueB === "number" && Number.isFinite(valueB) ? valueB : null,
      normalizedAbsoluteDelta: null,
      availability: "unavailable",
      unavailableReason: "one or both exact persisted operands are unavailable",
    });
  }
  return Object.freeze({
    category,
    fieldId,
    valueA,
    valueB,
    normalizedAbsoluteDelta: phase10C0NormalizedAbsoluteDelta(valueA, valueB),
    availability: "defined",
    unavailableReason: null,
  });
}

function categoricalDiagnostic(
  rowA: Phase10C0Row | null,
  rowB: Phase10C0Row | null,
): CategoricalDiagnostic {
  if (rowA === null || rowB === null) {
    return Object.freeze({
      fieldId: "stopReason",
      valueA: rowA?.stopReason ?? null,
      valueB: rowB?.stopReason ?? null,
      disagreement: null,
      availability: "unavailable",
      unavailableReason: "one or both exact persisted operands are unavailable",
    });
  }
  return Object.freeze({
    fieldId: "stopReason",
    valueA: rowA.stopReason,
    valueB: rowB.stopReason,
    disagreement: rowA.stopReason === rowB.stopReason ? 0 : 1,
    availability: "defined",
    unavailableReason: null,
  });
}

function comparePairing(
  pairing: Phase10C0Pairing,
  parsed: Phase10C0ParsedRows,
  defects: readonly Phase10C0ArtifactDefect[],
): ComparisonRow {
  const rowA = parsed.rowsById.get(pairing.rowIdA) ?? null;
  const rowB = parsed.rowsById.get(pairing.rowIdB) ?? null;
  const reasons: FailureReason[] = [...globalDefectReasons(defects)];
  const comparabilityReasons: FailureReason[] = [];
  for (const [side, rowId, row] of [["A", pairing.rowIdA, rowA], ["B", pairing.rowIdB, rowB]] as const) {
    if (row === null) {
      comparabilityReasons.push({
        code: `c0-row-${side.toLowerCase()}-unavailable`,
        failureClass: "infrastructure",
        detail: `${rowId} is unavailable for the registered ${side} operand`,
      });
    } else if (row.stopReason !== "size-target") {
      comparabilityReasons.push({
        code: `c0-row-${side.toLowerCase()}-stop-reason`,
        failureClass: "infrastructure",
        detail: `${rowId} stopReason is ${row.stopReason}, not size-target`,
      });
    } else if (!Number.isSafeInteger(row.attachedCount) || row.attachedCount <= 0) {
      comparabilityReasons.push({
        code: `c0-row-${side.toLowerCase()}-attached-count`,
        failureClass: "infrastructure",
        detail: `${rowId} attachedCount is not a positive safe integer`,
      });
    }
  }
  reasons.push(...comparabilityReasons);
  const classA = rowA === null ? null : phase10C0ClassifyHabit(rowA.aspectRatio);
  const classB = rowB === null ? null : phase10C0ClassifyHabit(rowB.aspectRatio);
  let relativeDifference: number | null = null;
  let habitPass: boolean | null = null;
  let countPass: boolean | null = null;
  if (comparabilityReasons.length === 0 && rowA !== null && rowB !== null) {
    habitPass = classA !== "invalid" && classB !== "invalid" && classA === classB;
    relativeDifference = Math.abs(rowB.attachedCount - rowA.attachedCount) / rowA.attachedCount;
    countPass = relativeDifference <= 0.005;
    if (!habitPass) {
      reasons.push({
        code: "c0-habit-class-mismatch",
        failureClass: "criterion",
        detail: `${pairing.rowIdA} class ${String(classA)} differs from ${pairing.rowIdB} class ${String(classB)}`,
      });
    }
    if (!countPass) {
      reasons.push({
        code: "c0-attached-count-tolerance",
        failureClass: "criterion",
        detail: `attachedCount relative difference ${relativeDifference} exceeds 0.005`,
      });
    }
  }
  const normalizedDiagnostics = [
    ...PHASE10_C0_NUMERICAL_FIELDS.map((fieldId) =>
      numericalDiagnostic("numerical-observable", fieldId, rowA, rowB)),
    ...PHASE10_C0_COST_FIELDS.map((fieldId) =>
      numericalDiagnostic("execution-cost", fieldId, rowA, rowB)),
  ];
  const failureClass = phase10C0FoldFailureClasses(reasons.map((reason) => reason.failureClass));
  return Object.freeze({
    schema: "phase10-c0-comparison-row-v1",
    comparisonId: pairing.comparisonId,
    kind: pairing.kind,
    errorSourceId: pairing.errorSourceId,
    domainSpacingDxUm: pairing.domainSpacingDxUm,
    rowIdA: pairing.rowIdA,
    rowIdB: pairing.rowIdB,
    rowA,
    rowB,
    habitClassA: classA,
    habitClassB: classB,
    attachedCountRelativeDifference: relativeDifference,
    habitCriterionPass: habitPass,
    attachedCountCriterionPass: countPass,
    comparisonVerdict: failureClass === null ? "pass" : "no-pass",
    failureClass,
    failureReasons: Object.freeze(reasons),
    normalizedDiagnostics: Object.freeze(normalizedDiagnostics),
    categoricalDiagnostics: Object.freeze([categoricalDiagnostic(rowA, rowB)]),
  });
}

function spacingResults(
  comparisons: readonly ComparisonRow[],
  defects: readonly Phase10C0ArtifactDefect[],
): readonly SpacingResult[] {
  const auxiliary = comparisons.filter((comparison) => comparison.kind === "auxiliary");
  if (auxiliary.length !== 32) fail("producer auxiliary comparison roster differs from 32");
  return Object.freeze(([0.7, 0.35] as const).map((dxUm) => {
    const domain = comparisons.filter((comparison) =>
      comparison.kind === "domain" && comparison.domainSpacingDxUm === dxUm);
    if (domain.length !== 16) fail(`producer domain comparison roster differs at ${dxUm}`);
    const domainPass = domain.every((comparison) => comparison.comparisonVerdict === "pass");
    const auxiliaryPass = auxiliary.every((comparison) => comparison.comparisonVerdict === "pass");
    const verdict = domainPass && auxiliaryPass && defects.length === 0 ? "pass" : "no-pass";
    const failing = [...domain, ...auxiliary].filter((comparison) => comparison.comparisonVerdict !== "pass");
    const classes = failing.flatMap((comparison) => comparison.failureClass === null ? [] : [comparison.failureClass]);
    if (defects.length > 0) classes.push("infrastructure");
    const reasons = verdict === "pass" ? [] : distinctSorted([
      ...failing.map((comparison) => `${comparison.comparisonId}: ${comparison.failureReasons.map((reason) => reason.code).join(",")}`),
      ...defects.map((defect) => `${defect.code}: ${defect.detail}`),
    ]);
    return Object.freeze({
      dxUm,
      domainComparisonCount: 16 as const,
      domainPass,
      auxiliaryComparisonCount: 32 as const,
      auxiliaryPass,
      verdict,
      noPassClass: phase10C0FoldFailureClasses(classes),
      reasons,
    });
  }));
}

function rankings(
  comparisons: readonly ComparisonRow[],
  category: Diagnostic["category"],
  observableIds: readonly string[],
): readonly RankingEntry[] {
  const unranked: Omit<RankingEntry, "rank">[] = [];
  for (const observableId of observableIds) {
    for (const errorSourceId of PHASE10_C0_ERROR_SOURCE_IDS) {
      const group = comparisons.filter((comparison) => comparison.errorSourceId === errorSourceId);
      const values = group.map((comparison) => ({
        comparisonId: comparison.comparisonId,
        diagnostic: comparison.normalizedDiagnostics.find((item) =>
          item.category === category && item.fieldId === observableId),
      })).filter((entry): entry is { comparisonId: string; diagnostic: Diagnostic } => entry.diagnostic !== undefined);
      if (values.length !== group.length) fail(`producer omitted ${category} ${observableId}`);
      const defined = values.filter((entry) =>
        entry.diagnostic.availability === "defined" &&
        entry.diagnostic.normalizedAbsoluteDelta !== null);
      let maximum: number | null = null;
      let witness: string | null = null;
      for (const entry of defined) {
        const value = entry.diagnostic.normalizedAbsoluteDelta!;
        if (
          maximum === null || value > maximum ||
          (value === maximum && witness !== null && phase10C0Lexical(entry.comparisonId, witness) < 0)
        ) {
          maximum = value;
          witness = entry.comparisonId;
        }
      }
      unranked.push(Object.freeze({
        observableId,
        errorSourceId,
        comparisonCount: group.length,
        definedCount: defined.length,
        nonZeroComparisonCount: defined.filter((entry) => entry.diagnostic.normalizedAbsoluteDelta! > 0).length,
        maxNormalizedAbsoluteDelta: maximum,
        maxWitnessPairId: witness,
      }));
    }
  }
  unranked.sort((left, right) => {
    if (left.maxNormalizedAbsoluteDelta === null && right.maxNormalizedAbsoluteDelta !== null) return 1;
    if (left.maxNormalizedAbsoluteDelta !== null && right.maxNormalizedAbsoluteDelta === null) return -1;
    if (
      left.maxNormalizedAbsoluteDelta !== null && right.maxNormalizedAbsoluteDelta !== null &&
      left.maxNormalizedAbsoluteDelta !== right.maxNormalizedAbsoluteDelta
    ) return right.maxNormalizedAbsoluteDelta - left.maxNormalizedAbsoluteDelta;
    if (left.nonZeroComparisonCount !== right.nonZeroComparisonCount) {
      return right.nonZeroComparisonCount - left.nonZeroComparisonCount;
    }
    const observableOrder = phase10C0Lexical(left.observableId, right.observableId);
    return observableOrder !== 0 ? observableOrder : phase10C0Lexical(left.errorSourceId, right.errorSourceId);
  });
  return Object.freeze(unranked.map((entry, index) => Object.freeze({ rank: index + 1, ...entry })));
}

function historicalCrossCheck(
  bytes: Uint8Array,
  parsed: Phase10C0ParsedRows,
  spacings: readonly SpacingResult[],
  overallVerdict: "pass" | "no-pass",
  overallNoPassClass: Phase10C0FailureClass | null,
): StrictJson {
  const differences: string[] = [];
  let report: JsonObject;
  try {
    report = object(phase10C0ParsePrettyJson(bytes, "historical Phase 6 report"), "historical Phase 6 report");
  } catch (error) {
    return strictJsonSnapshot({
      status: "unavailable",
      differences: [error instanceof Error ? error.message : "historical report could not be parsed"],
    });
  }
  for (const [field, expected] of [
    ["overallVerdict", overallVerdict],
    ["overallNoPassClass", overallNoPassClass],
    ["expectedRowCount", 80],
    ["presentExpectedRowCount", parsed.rowsById.size],
  ] as const) {
    if (report[field] !== expected) differences.push(`${field} differs`);
  }
  for (const [field, expected] of [
    ["missingRowIds", parsed.missingRowIds],
    ["unexpectedRowIds", parsed.unexpectedRowIds],
  ] as const) {
    if (JSON.stringify(report[field]) !== JSON.stringify(expected)) differences.push(`${field} differs`);
  }
  if (!Array.isArray(report.spacings)) {
    differences.push("spacings is unavailable");
  } else {
    for (const expected of spacings) {
      const matches = report.spacings.filter((value) => {
        if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
        return (value as JsonObject).dxUm === expected.dxUm;
      });
      if (matches.length !== 1) {
        differences.push(`spacing ${expected.dxUm} roster differs`);
        continue;
      }
      const actual = matches[0] as JsonObject;
      for (const field of ["domainPass", "auxiliaryPass", "verdict", "noPassClass"] as const) {
        if (actual[field] !== expected[field]) differences.push(`spacing ${expected.dxUm} ${field} differs`);
      }
    }
  }
  return strictJsonSnapshot({
    status: differences.length === 0 ? "agree" : "disagree",
    differences: distinctSorted(differences),
  });
}

function gapArtifact(rowsIdentity: ReturnType<typeof phase10C0ArtifactIdentity>): StrictJson {
  return strictJsonSnapshot({
    schema: "phase10-c0-gap-report-v1",
    protocolId: PHASE10_C0_SCIENCE_PROTOCOL_ID,
    rowsArtifact: rowsIdentity,
    persistedFieldIds: [...PHASE10_C0_ROW_FIELDS].sort(phase10C0Lexical),
    independentlyDerivableFieldIds: [
      "attachedCountCriterionPass",
      "attachedCountRelativeDifference",
      "comparisonVerdict",
      "failureClass",
      "habitClass",
      "habitCriterionPass",
      "normalizedAbsoluteDelta",
      "stopReasonDisagreement",
    ].sort(phase10C0Lexical),
    gaps: phase10C0GapItems(),
    targetObservationOperatorStatus: "not-defined-in-selected-package",
    claimBoundary: "inventory-only",
  });
}

function historicalLimitArtifact(
  protocol: ReturnType<typeof parsePhase10C0Protocol>,
  historicalIdentity: ReturnType<typeof phase10C0ArtifactIdentity>,
): StrictJson {
  return strictJsonSnapshot({
    schema: "phase10-c0-historical-limit-v1",
    protocolId: PHASE10_C0_SCIENCE_PROTOCOL_ID,
    historicalReportArtifact: historicalIdentity,
    historicalScript: {
      path: HISTORICAL_SCRIPT_PATH,
      gitCommit: protocol.adoptionCommit,
      byteLength: HISTORICAL_SCRIPT_BYTES,
      sha256: HISTORICAL_SCRIPT_SHA256,
    },
    issue: {
      issueId: "c0-historical-any-spacing-aggregation",
      location: `${HISTORICAL_SCRIPT_PATH}:177`,
      observedReduction: "any-spacing-some",
      authoritativeReduction: "all-spacings-every",
      consequence: "The historical sibling verifier could pass when only one spacing passes; both historical spacings failed, so its published verdict did not change.",
    },
    disposition: "excluded-as-authority",
    historicalReportUse: "cross-check-only",
    phase6EvidenceMutationAuthorized: false,
    claimLimits: [
      "The historical script and report do not supply the Phase 10 verdict.",
      "C0 does not establish numerical accuracy, a robust habit, a target score, or quantitative validation.",
      "Phase 6 evidence bytes remain immutable.",
    ],
  });
}

/**
 * Registered C0 derive producer. It consumes only supplied bytes and never imports or invokes a
 * solver. The shared executor is responsible for preflight, clean-head/resource capture, staging,
 * and terminal receipt publication before it calls this function.
 */
export function producePhase10C0DeriveArtifacts(
  request: Phase10C0DeriveRequest,
): Phase10C0DeriveArtifacts {
  phase10C0AssertBoundExecution(request.execution, request.preflightReceiptBytes, "c0-derive");
  const protocol = parsePhase10C0Protocol(request.scienceProtocolBytes);
  const parsed = parsePhase10C0Rows(request.rowsBytes);
  const rowsIdentity = phase10C0ArtifactIdentity(protocol.rowsArtifact.path, request.rowsBytes);
  const historicalIdentity = phase10C0ArtifactIdentity(
    protocol.historicalReportArtifact.path,
    request.historicalReportBytes,
  );
  const defects: Phase10C0ArtifactDefect[] = [...parsed.defects];
  if (request.enforceFrozenInputIdentities !== false) {
    if (
      rowsIdentity.byteLength !== protocol.rowsArtifact.byteLength ||
      rowsIdentity.sha256 !== protocol.rowsArtifact.sha256
    ) {
      defects.push({ code: "c0-rows-byte-identity", scope: "input", rowId: null, lineNumber: null, detail: "rows bytes differ from the frozen input identity" });
    }
    if (
      historicalIdentity.byteLength !== protocol.historicalReportArtifact.byteLength ||
      historicalIdentity.sha256 !== protocol.historicalReportArtifact.sha256
    ) {
      defects.push({ code: "c0-historical-report-byte-identity", scope: "input", rowId: null, lineNumber: null, detail: "historical report bytes differ from the frozen cross-check identity" });
    }
  }
  defects.sort((left, right) => phase10C0Lexical(`${left.code}\u0000${left.rowId ?? ""}`, `${right.code}\u0000${right.rowId ?? ""}`));
  const comparisons = parsed.pairings.map((pairing) => comparePairing(pairing, parsed, defects));
  const comparisonsBytes = phase10C0JsonlBytes(comparisons);
  const spacings = spacingResults(comparisons, defects);
  const overallVerdict = phase10C0EverySpacing(spacings.map((spacing) => spacing.verdict));
  const overallNoPassClass = phase10C0FoldFailureClasses(
    spacings.flatMap((spacing) => spacing.noPassClass === null ? [] : [spacing.noPassClass]),
  );
  const gaps = gapArtifact(rowsIdentity);
  const gapsBytes = phase10C0PrettyJsonBytes(gaps);
  const historicalLimit = historicalLimitArtifact(protocol, historicalIdentity);
  const historicalLimitBytes = phase10C0PrettyJsonBytes(historicalLimit);
  const numericalRanking = rankings(comparisons, "numerical-observable", PHASE10_C0_NUMERICAL_FIELDS);
  const costRanking = rankings(comparisons, "execution-cost", PHASE10_C0_COST_FIELDS);
  const categoricalDefined = comparisons.map((comparison) => ({
    comparisonId: comparison.comparisonId,
    diagnostic: comparison.categoricalDiagnostics[0]!,
  })).filter((entry) => entry.diagnostic.availability === "defined");
  const disagreements = categoricalDefined.filter((entry) => entry.diagnostic.disagreement === 1);
  const analysis = strictJsonSnapshot({
    schema: "phase10-c0-analysis-v1",
    protocolId: PHASE10_C0_SCIENCE_PROTOCOL_ID,
    rowsArtifact: rowsIdentity,
    historicalReportArtifact: historicalIdentity,
    comparisonsArtifact: phase10C0ArtifactIdentity(
      "evidence/phase10-numerical-verification-v1/c0-comparisons.jsonl",
      comparisonsBytes,
    ),
    roster: {
      expectedRowCount: 80,
      presentExpectedRowCount: parsed.rowsById.size,
      missingRowIds: parsed.missingRowIds,
      unexpectedRowIds: parsed.unexpectedRowIds,
      duplicateRowIds: parsed.duplicateRowIds,
      expectedPairingCount: 64,
      emittedPairingCount: comparisons.length,
      rowIdRosterSha256: "560b19895d883e77dee2a3ea889d45684aa9188ba247fc1f2fcbbb8a0c537593",
      pairingRosterSha256: "90016bf4f3d3268f83409a760146ece6110626042c83e4e33a980b44d2a52216",
    },
    artifactDefects: defects,
    spacingResults: spacings,
    overallVerdict,
    overallNoPassClass,
    numericalRanking,
    costRanking,
    categoricalDiagnostics: [{
      fieldId: "stopReason",
      comparisonCount: 64,
      definedCount: categoricalDefined.length,
      disagreementCount: disagreements.length,
      maxDisagreement: categoricalDefined.length === 0 ? null : disagreements.length === 0 ? 0 : 1,
      witnessPairId: disagreements.length === 0
        ? null
        : disagreements.map((entry) => entry.comparisonId).sort(phase10C0Lexical)[0]!,
    }],
    unavailableGapIds: PHASE10_C0_GAP_IDS,
    historicalReportCrossCheck: historicalCrossCheck(
      request.historicalReportBytes,
      parsed,
      spacings,
      overallVerdict,
      overallNoPassClass,
    ),
    solverExecuted: false,
    execution: request.execution,
  });
  const analysisBytes = phase10C0PrettyJsonBytes(analysis);
  // A local self-check catches serializer drift but supplies no independent verdict.
  if (phase10C0Sha256(comparisonsBytes) !== (object(phase10C0ParsePrettyJson(analysisBytes, "C0 analysis"), "C0 analysis").comparisonsArtifact as JsonObject).sha256) {
    fail("analysis comparison identity differs after serialization");
  }
  return Object.freeze({ analysisBytes, comparisonsBytes, gapsBytes, historicalLimitBytes });
}
