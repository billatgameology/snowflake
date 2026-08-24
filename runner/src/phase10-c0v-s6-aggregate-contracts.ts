import {
  parsePhase10C0VS6ArtifactIdentity,
  parsePhase10C0VS6RadialResultV2,
  phase10C0VS6Boolean,
  phase10C0VS6ExactOrderedKeys,
  phase10C0VS6NonnegativeNumber,
  phase10C0VS6NonnegativeSafeInteger,
  phase10C0VS6Object,
  phase10C0VS6ParsePrettyJson,
  phase10C0VS6SafeToken,
  phase10C0VS6SortedUniqueStrings,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6RadialResultV2,
} from "./phase10-c0v-s6-execution-contracts.ts";

export type Phase10C0VAggregateLayerId = "C0V-RADIAL" | "C0V-STATIC" | "C0V-MOVING-EVENT";
export type Phase10C0VAggregateStatus = "pass" | "non-pass";

export interface Phase10C0VClaimBoundary {
  readonly allowed: readonly string[];
  readonly forbidden: readonly string[];
}

export interface Phase10C0VAggregateLayerResultV1 {
  readonly schema: "phase10-c0v-moving-result-v1" | "phase10-c0v-static-result-v1";
  readonly resultId: "c0v-moving-result-v1" | "c0v-static-result-v1";
  readonly layerId: "C0V-MOVING-EVENT" | "C0V-STATIC";
  readonly branch: "independent-reference" | "reference-refusal";
  readonly protocol: Phase10C0VS6ArtifactIdentity;
  readonly referenceOrRefusal: Phase10C0VS6ArtifactIdentity;
  readonly attemptLedger: Phase10C0VS6ArtifactIdentity;
  readonly witness: null;
  readonly evaluation: null;
  readonly terminalStatus: "refusal";
  readonly scientificDisposition: "refusal";
  readonly negativeControlDisposition: "not-run-no-credit";
  readonly resourceDisposition: "within-cap";
  readonly claimBoundary: Phase10C0VClaimBoundary;
}

export type Phase10C0VAggregateLayerResult =
  | Phase10C0VAggregateLayerResultV1
  | Phase10C0VS6RadialResultV2;

export interface Phase10C0VTerminalTableRow {
  readonly layerId: Phase10C0VAggregateLayerId;
  readonly branch: "independent-reference" | "reference-refusal";
  readonly terminalStatus: "pass" | "fail" | "refusal";
  readonly result: Phase10C0VS6ArtifactIdentity;
  readonly scientificDisposition: "pass" | "fail" | "refusal";
  readonly negativeControlDisposition: "pass" | "not-run-no-credit" | "not-accepted-no-credit";
  readonly resourceDisposition:
    | "within-cap"
    | "artifact-refusal"
    | "prelaunch-resource-refusal"
    | "registered-cap-resource-refusal";
  readonly claimBoundary: Phase10C0VClaimBoundary;
}

export interface Phase10C0VTerminalTable {
  readonly schema: "phase10-c0v-terminal-table-v1";
  readonly tableId: string;
  readonly rows: readonly [
    Phase10C0VTerminalTableRow,
    Phase10C0VTerminalTableRow,
    Phase10C0VTerminalTableRow,
  ];
  readonly allThreeTerminal: boolean;
  readonly allIndependentReferences: boolean;
  readonly allLayersPass: boolean;
  readonly aggregateStatus: Phase10C0VAggregateStatus;
}

export interface Phase10C0VResourceLedgerAttempt {
  readonly packetId: "c0v-radial-produce" | "c0v-static-produce" | "c0v-moving-produce";
  readonly attemptId: string;
  readonly attemptLedger: Phase10C0VS6ArtifactIdentity;
  readonly terminalStatus: "pass" | "fail" | "refusal";
  readonly dispositionCode: string;
  readonly governedInvocationElapsedNanoseconds: number;
  readonly processHours: number;
  readonly maximumObservedConcurrentBytes: number;
  readonly terminalRetainedBytes: number;
}

export interface Phase10C0VResourceLedgerTotals {
  readonly governedInvocationElapsedNanoseconds: number;
  readonly processHours: number;
  readonly maximumObservedConcurrentBytes: number;
  readonly terminalRetainedBytes: number;
}

export interface Phase10C0VResourceLedger {
  readonly schema: "phase10-c0v-resource-ledger-v1";
  readonly ledgerId: "c0v-resource-ledger-v1";
  readonly requiredRuntime: "Node v24.13.1";
  readonly perInvocationWallHoursMaximum: 4;
  readonly packageProcessHoursMaximum: 24;
  readonly solverControlProcessConcurrency: 1;
  readonly scratchRetainedGiBMaximum: 64;
  readonly attempts: readonly [
    Phase10C0VResourceLedgerAttempt,
    Phase10C0VResourceLedgerAttempt,
    Phase10C0VResourceLedgerAttempt,
  ];
  readonly totals: Phase10C0VResourceLedgerTotals;
  readonly capExceeded: boolean;
  readonly disposition: "within-cap" | "resource-refusal";
}

export interface Phase10C0VNegativeControlResult {
  readonly negativeControlId: "nc-c0v-any-layer-nonpass";
  readonly mutationExecuted: boolean;
  readonly witnessMoved: boolean;
  readonly cleanCapturePreserved: boolean;
  readonly attackedCheckFailed: boolean;
  readonly pass: boolean;
}

export interface Phase10C0VAggregateOutcome {
  readonly aggregateStatus: Phase10C0VAggregateStatus;
  readonly packageCompletionEligible: boolean;
  readonly dependentQualificationBlocked: boolean;
}

export interface Phase10C0VAnyLayerNonpassControlReceipt {
  readonly schema: "phase10-c0v-any-layer-nonpass-control-v1";
  readonly negativeControlId: "nc-c0v-any-layer-nonpass";
  readonly ownerCheckId: "chk-c0v-any-layer-nonpass";
  readonly callableId: "phase10-nc-c0v-any-layer-nonpass";
  readonly cleanTable: Phase10C0VTerminalTable;
  readonly mutatedLayerId: "C0V-RADIAL";
  readonly mutatedTable: Phase10C0VTerminalTable;
  readonly mutation: {
    readonly field: "scientificDisposition";
    readonly before: "pass";
    readonly after: "refusal";
    readonly changedRowCount: 1;
    readonly otherRowsUnchanged: true;
  };
  readonly cleanOutcome: Phase10C0VAggregateOutcome;
  readonly attackedOutcome: Phase10C0VAggregateOutcome;
  readonly result: Phase10C0VNegativeControlResult;
}

export interface Phase10C0VAggregateArtifactIndexEntry {
  readonly artifactId: string;
  readonly path: string;
  readonly mediaType: "application/json" | "application/x-ndjson" | "application/octet-stream";
  readonly byteLength: number;
  readonly sha256: string;
  readonly role: string;
  readonly producedBy: string;
}

export interface Phase10C0VAggregateArtifactIndex {
  readonly schema: "phase10-artifact-index-v1";
  readonly bundleId: "phase10-numerical-verification-v1";
  readonly artifacts: readonly Phase10C0VAggregateArtifactIndexEntry[];
}

export interface Phase10C0VAggregateResult {
  readonly schema: "phase10-c0v-aggregate-v1";
  readonly aggregateId: "c0v-aggregate-v1";
  readonly terminalTable: Phase10C0VS6ArtifactIdentity;
  readonly resourceLedger: Phase10C0VS6ArtifactIdentity;
  readonly layerResults: readonly [
    Phase10C0VS6ArtifactIdentity,
    Phase10C0VS6ArtifactIdentity,
    Phase10C0VS6ArtifactIdentity,
  ];
  readonly allThreeTerminal: boolean;
  readonly allIndependentReferences: boolean;
  readonly allLayersPass: boolean;
  readonly aggregateStatus: Phase10C0VAggregateStatus;
  readonly negativeControl: Phase10C0VNegativeControlResult;
  readonly packageCompletionEligible: boolean;
  readonly dependentQualificationBlocked: boolean;
  readonly claimBoundary: Phase10C0VClaimBoundary;
}

export interface Phase10C0VAggregateCandidateBytes {
  readonly terminalTable: Uint8Array;
  readonly resourceLedger: Uint8Array;
  readonly aggregate: Uint8Array;
  readonly artifactIndex: Uint8Array;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V aggregate contract refused: ${message}`);
}

function literal<T extends string | number | boolean>(value: unknown, expected: T, label: string): T {
  if (value !== expected) fail(`${label} must equal ${String(expected)}`);
  return expected;
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== "string") fail(`${label} must be a string`);
  return value;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) fail(`${label} differs`);
  return value as T;
}

function claimBoundary(value: unknown, label: string): Phase10C0VClaimBoundary {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, ["allowed", "forbidden"], label);
  return Object.freeze({
    allowed: phase10C0VS6SortedUniqueStrings(row.allowed, `${label}.allowed`),
    forbidden: phase10C0VS6SortedUniqueStrings(row.forbidden, `${label}.forbidden`),
  });
}

export function parsePhase10C0VAggregateLayerResultBytes(
  bytes: Uint8Array,
  layerId: Phase10C0VAggregateLayerId,
): Phase10C0VAggregateLayerResult {
  const label = `${layerId} layer result`;
  const value = phase10C0VS6ParsePrettyJson(bytes, label);
  if (layerId === "C0V-RADIAL") return parsePhase10C0VS6RadialResultV2(value, label);
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "schema", "resultId", "layerId", "branch", "protocol", "referenceOrRefusal", "attemptLedger",
    "witness", "evaluation", "terminalStatus", "scientificDisposition", "negativeControlDisposition",
    "resourceDisposition", "claimBoundary",
  ], label);
  const moving = layerId === "C0V-MOVING-EVENT";
  const schema = moving ? "phase10-c0v-moving-result-v1" : "phase10-c0v-static-result-v1";
  const resultId = moving ? "c0v-moving-result-v1" : "c0v-static-result-v1";
  const branch = moving ? "independent-reference" : "reference-refusal";
  literal(row.schema, schema, `${label}.schema`);
  literal(row.resultId, resultId, `${label}.resultId`);
  literal(row.layerId, layerId, `${label}.layerId`);
  literal(row.branch, branch, `${label}.branch`);
  if (row.witness !== null || row.evaluation !== null) fail(`${label} refusal artifacts must be null`);
  literal(row.terminalStatus, "refusal", `${label}.terminalStatus`);
  literal(row.scientificDisposition, "refusal", `${label}.scientificDisposition`);
  literal(row.negativeControlDisposition, "not-run-no-credit", `${label}.negativeControlDisposition`);
  literal(row.resourceDisposition, "within-cap", `${label}.resourceDisposition`);
  return Object.freeze({
    schema,
    resultId,
    layerId,
    branch,
    protocol: parsePhase10C0VS6ArtifactIdentity(row.protocol, `${label}.protocol`),
    referenceOrRefusal: parsePhase10C0VS6ArtifactIdentity(row.referenceOrRefusal, `${label}.referenceOrRefusal`),
    attemptLedger: parsePhase10C0VS6ArtifactIdentity(row.attemptLedger, `${label}.attemptLedger`),
    witness: null,
    evaluation: null,
    terminalStatus: "refusal",
    scientificDisposition: "refusal",
    negativeControlDisposition: "not-run-no-credit",
    resourceDisposition: "within-cap",
    claimBoundary: claimBoundary(row.claimBoundary, `${label}.claimBoundary`),
  });
}

function terminalRow(value: unknown, expectedLayer: Phase10C0VAggregateLayerId, label: string): Phase10C0VTerminalTableRow {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "layerId", "branch", "terminalStatus", "result", "scientificDisposition",
    "negativeControlDisposition", "resourceDisposition", "claimBoundary",
  ], label);
  return Object.freeze({
    layerId: literal(row.layerId, expectedLayer, `${label}.layerId`),
    branch: oneOf(row.branch, ["independent-reference", "reference-refusal"] as const, `${label}.branch`),
    terminalStatus: oneOf(row.terminalStatus, ["pass", "fail", "refusal"] as const, `${label}.terminalStatus`),
    result: parsePhase10C0VS6ArtifactIdentity(row.result, `${label}.result`),
    scientificDisposition: oneOf(
      row.scientificDisposition, ["pass", "fail", "refusal"] as const, `${label}.scientificDisposition`,
    ),
    negativeControlDisposition: oneOf(
      row.negativeControlDisposition,
      ["pass", "not-run-no-credit", "not-accepted-no-credit"] as const,
      `${label}.negativeControlDisposition`,
    ),
    resourceDisposition: oneOf(
      row.resourceDisposition,
      ["within-cap", "artifact-refusal", "prelaunch-resource-refusal", "registered-cap-resource-refusal"] as const,
      `${label}.resourceDisposition`,
    ),
    claimBoundary: claimBoundary(row.claimBoundary, `${label}.claimBoundary`),
  });
}

export function parsePhase10C0VTerminalTable(
  value: unknown,
  label = "terminal table",
  expectedTableId = "c0v-terminal-table-v1",
): Phase10C0VTerminalTable {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "schema", "tableId", "rows", "allThreeTerminal", "allIndependentReferences", "allLayersPass", "aggregateStatus",
  ], label);
  literal(row.schema, "phase10-c0v-terminal-table-v1", `${label}.schema`);
  if (!Array.isArray(row.rows) || row.rows.length !== 3) fail(`${label}.rows must contain exactly three rows`);
  const rows = Object.freeze([
    terminalRow(row.rows[0], "C0V-RADIAL", `${label}.rows[0]`),
    terminalRow(row.rows[1], "C0V-STATIC", `${label}.rows[1]`),
    terminalRow(row.rows[2], "C0V-MOVING-EVENT", `${label}.rows[2]`),
  ] as const);
  return Object.freeze({
    schema: "phase10-c0v-terminal-table-v1",
    tableId: literal(
      phase10C0VS6SafeToken(row.tableId, `${label}.tableId`),
      expectedTableId,
      `${label}.tableId`,
    ),
    rows,
    allThreeTerminal: phase10C0VS6Boolean(row.allThreeTerminal, `${label}.allThreeTerminal`),
    allIndependentReferences: phase10C0VS6Boolean(
      row.allIndependentReferences, `${label}.allIndependentReferences`,
    ),
    allLayersPass: phase10C0VS6Boolean(row.allLayersPass, `${label}.allLayersPass`),
    aggregateStatus: oneOf(row.aggregateStatus, ["pass", "non-pass"] as const, `${label}.aggregateStatus`),
  });
}

export function parsePhase10C0VTerminalTableBytes(bytes: Uint8Array, label = "terminal table bytes"): Phase10C0VTerminalTable {
  return parsePhase10C0VTerminalTable(phase10C0VS6ParsePrettyJson(bytes, label), label);
}

function resourceAttempt(value: unknown, expectedPacketId: Phase10C0VResourceLedgerAttempt["packetId"], label: string): Phase10C0VResourceLedgerAttempt {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "packetId", "attemptId", "attemptLedger", "terminalStatus", "dispositionCode",
    "governedInvocationElapsedNanoseconds", "processHours", "maximumObservedConcurrentBytes", "terminalRetainedBytes",
  ], label);
  const elapsed = phase10C0VS6NonnegativeSafeInteger(
    row.governedInvocationElapsedNanoseconds, `${label}.governedInvocationElapsedNanoseconds`,
  );
  const processHours = phase10C0VS6NonnegativeNumber(row.processHours, `${label}.processHours`);
  if (processHours !== elapsed / 3_600_000_000_000) fail(`${label}.processHours differs from elapsed nanoseconds`);
  return Object.freeze({
    packetId: literal(row.packetId, expectedPacketId, `${label}.packetId`),
    attemptId: phase10C0VS6SafeToken(row.attemptId, `${label}.attemptId`),
    attemptLedger: parsePhase10C0VS6ArtifactIdentity(row.attemptLedger, `${label}.attemptLedger`),
    terminalStatus: oneOf(row.terminalStatus, ["pass", "fail", "refusal"] as const, `${label}.terminalStatus`),
    dispositionCode: phase10C0VS6SafeToken(row.dispositionCode, `${label}.dispositionCode`),
    governedInvocationElapsedNanoseconds: elapsed,
    processHours,
    maximumObservedConcurrentBytes: phase10C0VS6NonnegativeSafeInteger(
      row.maximumObservedConcurrentBytes, `${label}.maximumObservedConcurrentBytes`,
    ),
    terminalRetainedBytes: phase10C0VS6NonnegativeSafeInteger(
      row.terminalRetainedBytes, `${label}.terminalRetainedBytes`,
    ),
  });
}

export function parsePhase10C0VResourceLedger(value: unknown, label = "resource ledger"): Phase10C0VResourceLedger {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "schema", "ledgerId", "requiredRuntime", "perInvocationWallHoursMaximum", "packageProcessHoursMaximum",
    "solverControlProcessConcurrency", "scratchRetainedGiBMaximum", "attempts", "totals", "capExceeded", "disposition",
  ], label);
  if (!Array.isArray(row.attempts) || row.attempts.length !== 3) fail(`${label}.attempts must contain exactly three rows`);
  const attempts = Object.freeze([
    resourceAttempt(row.attempts[0], "c0v-radial-produce", `${label}.attempts[0]`),
    resourceAttempt(row.attempts[1], "c0v-static-produce", `${label}.attempts[1]`),
    resourceAttempt(row.attempts[2], "c0v-moving-produce", `${label}.attempts[2]`),
  ] as const);
  const totalsRow = phase10C0VS6Object(row.totals, `${label}.totals`);
  phase10C0VS6ExactOrderedKeys(totalsRow, [
    "governedInvocationElapsedNanoseconds", "processHours", "maximumObservedConcurrentBytes", "terminalRetainedBytes",
  ], `${label}.totals`);
  const totalElapsed = phase10C0VS6NonnegativeSafeInteger(
    totalsRow.governedInvocationElapsedNanoseconds, `${label}.totals.governedInvocationElapsedNanoseconds`,
  );
  const totals = Object.freeze({
    governedInvocationElapsedNanoseconds: totalElapsed,
    processHours: phase10C0VS6NonnegativeNumber(totalsRow.processHours, `${label}.totals.processHours`),
    maximumObservedConcurrentBytes: phase10C0VS6NonnegativeSafeInteger(
      totalsRow.maximumObservedConcurrentBytes, `${label}.totals.maximumObservedConcurrentBytes`,
    ),
    terminalRetainedBytes: phase10C0VS6NonnegativeSafeInteger(
      totalsRow.terminalRetainedBytes, `${label}.totals.terminalRetainedBytes`,
    ),
  });
  if (totals.processHours !== totalElapsed / 3_600_000_000_000) {
    fail(`${label}.totals.processHours differs from elapsed nanoseconds`);
  }
  const expectedElapsed = attempts.reduce(
    (sum, entry) => sum + entry.governedInvocationElapsedNanoseconds,
    0,
  );
  const expectedRetained = attempts.reduce((sum, entry) => sum + entry.terminalRetainedBytes, 0);
  const expectedMaximum = Math.max(...attempts.map((entry) => entry.maximumObservedConcurrentBytes));
  if (!Number.isSafeInteger(expectedElapsed) || !Number.isSafeInteger(expectedRetained) ||
    totals.governedInvocationElapsedNanoseconds !== expectedElapsed ||
    totals.maximumObservedConcurrentBytes !== expectedMaximum || totals.terminalRetainedBytes !== expectedRetained) {
    fail(`${label}.totals differ from the exact produce-attempt roster`);
  }
  const expectedCapExceeded = attempts.some((entry) =>
    entry.dispositionCode === "prelaunch-resource-refusal" ||
    entry.dispositionCode === "registered-cap-resource-refusal") ||
    expectedElapsed > 86_400_000_000_000 || expectedMaximum > 68_719_476_736 ||
    expectedRetained > 68_719_476_736;
  const capExceeded = phase10C0VS6Boolean(row.capExceeded, `${label}.capExceeded`);
  const disposition = oneOf(row.disposition, ["within-cap", "resource-refusal"] as const, `${label}.disposition`);
  if (capExceeded !== expectedCapExceeded || disposition !== (expectedCapExceeded ? "resource-refusal" : "within-cap")) {
    fail(`${label} cap disposition differs from the produce-attempt subtotal`);
  }
  return Object.freeze({
    schema: literal(row.schema, "phase10-c0v-resource-ledger-v1", `${label}.schema`),
    ledgerId: literal(row.ledgerId, "c0v-resource-ledger-v1", `${label}.ledgerId`),
    requiredRuntime: literal(row.requiredRuntime, "Node v24.13.1", `${label}.requiredRuntime`),
    perInvocationWallHoursMaximum: literal(
      row.perInvocationWallHoursMaximum, 4, `${label}.perInvocationWallHoursMaximum`,
    ),
    packageProcessHoursMaximum: literal(row.packageProcessHoursMaximum, 24, `${label}.packageProcessHoursMaximum`),
    solverControlProcessConcurrency: literal(
      row.solverControlProcessConcurrency, 1, `${label}.solverControlProcessConcurrency`,
    ),
    scratchRetainedGiBMaximum: literal(row.scratchRetainedGiBMaximum, 64, `${label}.scratchRetainedGiBMaximum`),
    attempts,
    totals,
    capExceeded,
    disposition,
  });
}

export function parsePhase10C0VResourceLedgerBytes(bytes: Uint8Array, label = "resource ledger bytes"): Phase10C0VResourceLedger {
  return parsePhase10C0VResourceLedger(phase10C0VS6ParsePrettyJson(bytes, label), label);
}

function outcome(value: unknown, label: string): Phase10C0VAggregateOutcome {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(
    row, ["aggregateStatus", "packageCompletionEligible", "dependentQualificationBlocked"], label,
  );
  return Object.freeze({
    aggregateStatus: oneOf(row.aggregateStatus, ["pass", "non-pass"] as const, `${label}.aggregateStatus`),
    packageCompletionEligible: phase10C0VS6Boolean(
      row.packageCompletionEligible, `${label}.packageCompletionEligible`,
    ),
    dependentQualificationBlocked: phase10C0VS6Boolean(
      row.dependentQualificationBlocked, `${label}.dependentQualificationBlocked`,
    ),
  });
}

function negativeControlResult(value: unknown, label: string): Phase10C0VNegativeControlResult {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "negativeControlId", "mutationExecuted", "witnessMoved", "cleanCapturePreserved", "attackedCheckFailed", "pass",
  ], label);
  return Object.freeze({
    negativeControlId: literal(row.negativeControlId, "nc-c0v-any-layer-nonpass", `${label}.negativeControlId`),
    mutationExecuted: phase10C0VS6Boolean(row.mutationExecuted, `${label}.mutationExecuted`),
    witnessMoved: phase10C0VS6Boolean(row.witnessMoved, `${label}.witnessMoved`),
    cleanCapturePreserved: phase10C0VS6Boolean(row.cleanCapturePreserved, `${label}.cleanCapturePreserved`),
    attackedCheckFailed: phase10C0VS6Boolean(row.attackedCheckFailed, `${label}.attackedCheckFailed`),
    pass: phase10C0VS6Boolean(row.pass, `${label}.pass`),
  });
}

export function parsePhase10C0VAnyLayerNonpassControlReceipt(
  value: unknown,
  label = "any-layer-nonpass control receipt",
): Phase10C0VAnyLayerNonpassControlReceipt {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "schema", "negativeControlId", "ownerCheckId", "callableId", "cleanTable", "mutatedLayerId",
    "mutatedTable", "mutation", "cleanOutcome", "attackedOutcome", "result",
  ], label);
  const mutation = phase10C0VS6Object(row.mutation, `${label}.mutation`);
  phase10C0VS6ExactOrderedKeys(
    mutation, ["field", "before", "after", "changedRowCount", "otherRowsUnchanged"], `${label}.mutation`,
  );
  return Object.freeze({
    schema: literal(row.schema, "phase10-c0v-any-layer-nonpass-control-v1", `${label}.schema`),
    negativeControlId: literal(row.negativeControlId, "nc-c0v-any-layer-nonpass", `${label}.negativeControlId`),
    ownerCheckId: literal(row.ownerCheckId, "chk-c0v-any-layer-nonpass", `${label}.ownerCheckId`),
    callableId: literal(row.callableId, "phase10-nc-c0v-any-layer-nonpass", `${label}.callableId`),
    cleanTable: parsePhase10C0VTerminalTable(
      row.cleanTable,
      `${label}.cleanTable`,
      "c0v-terminal-table-synthetic-all-pass-v1",
    ),
    mutatedLayerId: literal(row.mutatedLayerId, "C0V-RADIAL", `${label}.mutatedLayerId`),
    mutatedTable: parsePhase10C0VTerminalTable(
      row.mutatedTable,
      `${label}.mutatedTable`,
      "c0v-terminal-table-synthetic-radial-refusal-v1",
    ),
    mutation: Object.freeze({
      field: literal(mutation.field, "scientificDisposition", `${label}.mutation.field`),
      before: literal(mutation.before, "pass", `${label}.mutation.before`),
      after: literal(mutation.after, "refusal", `${label}.mutation.after`),
      changedRowCount: literal(mutation.changedRowCount, 1, `${label}.mutation.changedRowCount`),
      otherRowsUnchanged: literal(
        mutation.otherRowsUnchanged, true, `${label}.mutation.otherRowsUnchanged`,
      ),
    }),
    cleanOutcome: outcome(row.cleanOutcome, `${label}.cleanOutcome`),
    attackedOutcome: outcome(row.attackedOutcome, `${label}.attackedOutcome`),
    result: negativeControlResult(row.result, `${label}.result`),
  });
}

export function parsePhase10C0VAnyLayerNonpassControlReceiptBytes(
  bytes: Uint8Array,
  label = "any-layer-nonpass control receipt bytes",
): Phase10C0VAnyLayerNonpassControlReceipt {
  return parsePhase10C0VAnyLayerNonpassControlReceipt(phase10C0VS6ParsePrettyJson(bytes, label), label);
}

export function parsePhase10C0VAggregateResult(value: unknown, label = "aggregate result"): Phase10C0VAggregateResult {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "schema", "aggregateId", "terminalTable", "resourceLedger", "layerResults", "allThreeTerminal",
    "allIndependentReferences", "allLayersPass", "aggregateStatus", "negativeControl",
    "packageCompletionEligible", "dependentQualificationBlocked", "claimBoundary",
  ], label);
  if (!Array.isArray(row.layerResults) || row.layerResults.length !== 3) {
    fail(`${label}.layerResults must contain radial, static, moving identities`);
  }
  return Object.freeze({
    schema: literal(row.schema, "phase10-c0v-aggregate-v1", `${label}.schema`),
    aggregateId: literal(row.aggregateId, "c0v-aggregate-v1", `${label}.aggregateId`),
    terminalTable: parsePhase10C0VS6ArtifactIdentity(row.terminalTable, `${label}.terminalTable`),
    resourceLedger: parsePhase10C0VS6ArtifactIdentity(row.resourceLedger, `${label}.resourceLedger`),
    layerResults: Object.freeze([
      parsePhase10C0VS6ArtifactIdentity(row.layerResults[0], `${label}.layerResults[0]`),
      parsePhase10C0VS6ArtifactIdentity(row.layerResults[1], `${label}.layerResults[1]`),
      parsePhase10C0VS6ArtifactIdentity(row.layerResults[2], `${label}.layerResults[2]`),
    ] as const),
    allThreeTerminal: phase10C0VS6Boolean(row.allThreeTerminal, `${label}.allThreeTerminal`),
    allIndependentReferences: phase10C0VS6Boolean(
      row.allIndependentReferences, `${label}.allIndependentReferences`,
    ),
    allLayersPass: phase10C0VS6Boolean(row.allLayersPass, `${label}.allLayersPass`),
    aggregateStatus: oneOf(row.aggregateStatus, ["pass", "non-pass"] as const, `${label}.aggregateStatus`),
    negativeControl: negativeControlResult(row.negativeControl, `${label}.negativeControl`),
    packageCompletionEligible: phase10C0VS6Boolean(
      row.packageCompletionEligible, `${label}.packageCompletionEligible`,
    ),
    dependentQualificationBlocked: phase10C0VS6Boolean(
      row.dependentQualificationBlocked, `${label}.dependentQualificationBlocked`,
    ),
    claimBoundary: claimBoundary(row.claimBoundary, `${label}.claimBoundary`),
  });
}

export function parsePhase10C0VAggregateResultBytes(bytes: Uint8Array, label = "aggregate result bytes"): Phase10C0VAggregateResult {
  return parsePhase10C0VAggregateResult(phase10C0VS6ParsePrettyJson(bytes, label), label);
}

export function aggregateMediaType(path: string): Phase10C0VAggregateArtifactIndexEntry["mediaType"] {
  return path.endsWith(".jsonl")
    ? "application/x-ndjson"
    : path.endsWith(".bin")
      ? "application/octet-stream"
      : "application/json";
}

export function parsePhase10C0VAggregateArtifactIndex(
  value: unknown,
  label = "aggregate artifact index",
): Phase10C0VAggregateArtifactIndex {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, ["schema", "bundleId", "artifacts"], label);
  literal(row.schema, "phase10-artifact-index-v1", `${label}.schema`);
  literal(row.bundleId, "phase10-numerical-verification-v1", `${label}.bundleId`);
  if (!Array.isArray(row.artifacts) || row.artifacts.length === 0) fail(`${label}.artifacts must be nonempty`);
  const artifacts = row.artifacts.map((valueEntry, index) => {
    const entryLabel = `${label}.artifacts[${index}]`;
    const entry = phase10C0VS6Object(valueEntry, entryLabel);
    phase10C0VS6ExactOrderedKeys(entry, [
      "artifactId", "path", "mediaType", "byteLength", "sha256", "role", "producedBy",
    ], entryLabel);
    const identity = parsePhase10C0VS6ArtifactIdentity({
      path: entry.path,
      byteLength: entry.byteLength,
      sha256: entry.sha256,
    }, `${entryLabel}.identity`);
    const mediaType = oneOf(
      entry.mediaType,
      ["application/json", "application/x-ndjson", "application/octet-stream"] as const,
      `${entryLabel}.mediaType`,
    );
    if (mediaType !== aggregateMediaType(identity.path)) fail(`${entryLabel}.mediaType differs from path`);
    return Object.freeze({
      artifactId: phase10C0VS6SafeToken(entry.artifactId, `${entryLabel}.artifactId`),
      ...identity,
      mediaType,
      role: phase10C0VS6SafeToken(entry.role, `${entryLabel}.role`),
      producedBy: phase10C0VS6SafeToken(entry.producedBy, `${entryLabel}.producedBy`),
    });
  });
  const ids = artifacts.map((entry) => entry.artifactId);
  const sorted = [...ids].sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
  if (new Set(ids).size !== ids.length || ids.some((entry, index) => entry !== sorted[index]) ||
    new Set(artifacts.map((entry) => entry.path)).size !== artifacts.length) {
    fail(`${label}.artifacts must be artifact-ID sorted with unique IDs and paths`);
  }
  return Object.freeze({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-numerical-verification-v1",
    artifacts: Object.freeze(artifacts),
  });
}

export function parsePhase10C0VAggregateArtifactIndexBytes(
  bytes: Uint8Array,
  label = "aggregate artifact index bytes",
): Phase10C0VAggregateArtifactIndex {
  return parsePhase10C0VAggregateArtifactIndex(phase10C0VS6ParsePrettyJson(bytes, label), label);
}
