import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";

export const PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_SCHEMA =
  "phase10-scope-classification-protocol-v1" as const;
export const PHASE10_SCOPE_CLASSIFICATION_SCHEMA =
  "phase10-scope-classification-v1" as const;
export const PHASE10_SCOPE_OVERLAY_ROW_SCHEMA = "phase10-scope-overlay-row-v1" as const;
export const PHASE10_SCOPE_REPORT_SCHEMA = "phase10-scope-report-v1" as const;

export const PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH =
  "research/phase10-scope-classification-protocol-v1.json" as const;
export const PHASE10_SCOPE_PHASE8A_OVERLAY_PATH =
  "evidence/phase10-scope-intake-v1/phase8a-overlay.jsonl" as const;
export const PHASE10_SCOPE_PHASE8B_OVERLAY_PATH =
  "evidence/phase10-scope-intake-v1/phase8b-overlay.jsonl" as const;
export const PHASE10_SCOPE_REPORT_PATH =
  "evidence/phase10-scope-intake-v1/scope-report.json" as const;
export const PHASE10_SCOPE_ARTIFACT_INDEX_PATH =
  "evidence/phase10-scope-intake-v1/scope-artifact-index.json" as const;
export const PHASE10_SCOPE_VERIFICATION_PATH =
  "evidence/phase10-scope-intake-v1/scope-verification.json" as const;

export const PHASE10_SCOPE_CORPORA = ["phase8a", "phase8b"] as const;
export const PHASE10_SCOPE_PHENOMENON_CLASSES = [
  "aggregation",
  "impurity-or-chemistry",
  "mixed-or-uncertain",
  "nucleation",
  "polycrystal-or-twin",
  "riming-or-graupel",
  "single-crystal",
] as const;
export const PHASE10_SCOPE_MODEL_CLASS_STATES = ["in", "mixed", "out", "unresolved"] as const;
export const PHASE10_SCOPE_BLOCKER_KINDS = [
  "missing-forcing-map",
  "missing-observation-operator",
  "missing-physical-operator",
  "numerical-inadequacy",
  "other",
] as const;
export const PHASE10_SCOPE_APPARATUS_COMPATIBILITY = [
  "adapter-required",
  "direct",
  "incompatible",
  "source-blocked",
] as const;
export const PHASE10_SCOPE_PHASE_OWNERSHIP = [
  "outside-phase7-and-phase10",
  "phase10-development",
  "phase7-held-out-product-gpu-obligation",
  "shared-read-only-input",
] as const;
export const PHASE10_SCOPE_DECISION_ELIGIBILITY = [
  "categorical-only",
  "diagnostic-only",
  "quantitative",
  "refused",
] as const;
export const PHASE10_SCOPE_IMMUTABLE_EVIDENCE_ROLES = [
  "descriptive-only",
  "phase8a-historical-held-out-no-current-gate-effect",
  "phase8a-historical-input",
  "phase8a-historical-model-development",
  "phase8a-historical-out-of-model",
  "phase8b-development",
] as const;

export type Phase10ScopeCorpus = (typeof PHASE10_SCOPE_CORPORA)[number];
export type Phase10ScopePhenomenonClass =
  (typeof PHASE10_SCOPE_PHENOMENON_CLASSES)[number];
export type Phase10ScopeModelClassState =
  (typeof PHASE10_SCOPE_MODEL_CLASS_STATES)[number];
export type Phase10ScopeBlockerKind = (typeof PHASE10_SCOPE_BLOCKER_KINDS)[number];
export type Phase10ScopeApparatusCompatibility =
  (typeof PHASE10_SCOPE_APPARATUS_COMPATIBILITY)[number];
export type Phase10ScopePhaseOwnership = (typeof PHASE10_SCOPE_PHASE_OWNERSHIP)[number];
export type Phase10ScopeDecisionEligibilityState =
  (typeof PHASE10_SCOPE_DECISION_ELIGIBILITY)[number];
export type Phase10ScopeImmutableEvidenceRole =
  (typeof PHASE10_SCOPE_IMMUTABLE_EVIDENCE_ROLES)[number];

export interface Phase10ScopeArtifactTuple {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10ScopeProtocolBinding extends Phase10ScopeArtifactTuple {
  readonly commit: string;
}

export interface Phase10ScopeCitationRef {
  readonly refId: string;
  readonly kind: "charter" | "tracked-record" | "nas-private-source" | "external-metadata";
  readonly locator: string;
  readonly artifact: Phase10ScopeArtifactTuple | null;
  readonly recordId: string | null;
}

export interface Phase10ScopeReason {
  readonly status: Phase10ScopeModelClassState;
  readonly reason: string;
  readonly citationRefs: readonly Phase10ScopeCitationRef[];
}

export interface Phase10ScopeRepresentabilityBlocker {
  readonly operandId: string;
  readonly kind: Phase10ScopeBlockerKind;
  readonly detail: string;
  readonly citationRefs: readonly Phase10ScopeCitationRef[];
}

export interface Phase10ScopeApparatusDisposition {
  readonly status: Phase10ScopeApparatusCompatibility;
  readonly reason: string;
  readonly citationRefs: readonly Phase10ScopeCitationRef[];
}

export interface Phase10ScopeDecisionEligibility {
  readonly status: Phase10ScopeDecisionEligibilityState;
  readonly blockingOperandIds: readonly string[];
  readonly reason: string;
}

export interface Phase10ScopeTerminalStatusBinding {
  readonly statusRowRequired: boolean;
  readonly recordKind: "book-status" | null;
  readonly expectedStatusRowCount: 0 | 1;
  readonly expectedLineNumber: number | null;
  readonly lfTerminatedByteLength: number | null;
  readonly lfTerminatedSha256: string | null;
  readonly overlayRecordFilter: "recordKind=entry" | "all-jsonl-rows";
}

export interface Phase10ScopeInputCorpusBinding {
  readonly corpus: Phase10ScopeCorpus;
  readonly inputArtifactId: string;
  readonly sourceArtifact: Phase10ScopeArtifactTuple;
  readonly recordIdField: "id" | "selectionId";
  readonly expectedRecordCount: number;
  readonly expectedJsonlRowCount: number;
  readonly expectedIdsSha256: string;
  readonly immutableSourceFields: readonly string[];
  readonly terminalStatus: Phase10ScopeTerminalStatusBinding;
}

export interface Phase10ScopeClaimBoundary {
  readonly scopeCensusOnlyForAS: true;
  readonly allOpenedSourceValuesArePhase10DevelopmentEvidence: true;
  readonly quantitativeValidationEarned: false;
  readonly phase7CreditEarned: false;
  readonly phase8CreditEarned: false;
  readonly phase9CreditEarned: false;
  readonly heldOutComparisonExecuted: false;
  readonly targetScoreProduced: false;
  readonly solverPhysicsChanged: false;
  readonly c1ThroughC5RowsProduced: false;
  readonly habitRowsProduced: false;
  readonly eObservationOperatorImplemented: false;
  readonly fExternalRequestWrittenOrSent: false;
  readonly hTransportImplemented: false;
  readonly downstreamExecutionAuthorized: false;
  readonly priorPhaseLabelsAndArtifactsPreserved: true;
}

export interface Phase10ScopeProtocolRules {
  readonly contractImplementation: Phase10ScopeArtifactTuple;
  readonly authority: {
    readonly charterVersion: "v1.28";
    readonly charterArtifact: Phase10ScopeArtifactTuple;
    readonly decisionId: "0052";
    readonly decisionArtifact: Phase10ScopeArtifactTuple;
  };
  readonly modelClass: {
    readonly representedSystem: string;
    readonly excludedPhenomenonClasses: readonly [
      "aggregation",
      "impurity-or-chemistry",
      "nucleation",
      "polycrystal-or-twin",
      "riming-or-graupel",
    ];
    readonly singleCrystalWithCurrentGapsRemainsInScope: true;
    readonly mixedAndUnresolvedRemainFirstClass: true;
  };
  readonly representability: {
    readonly multipleBlockersAllowed: true;
    readonly blockerOperandIdsUniquePerRow: true;
    readonly blockersDoNotRewriteModelClassScope: true;
    readonly allowedKinds: readonly Phase10ScopeBlockerKind[];
  };
  readonly immutableRoles: {
    readonly phase8aDerivedFrom: readonly ["partition", "role"];
    readonly phase8bDerivedFrom: readonly ["binding", "phase9EvidenceRole", "split"];
    readonly sourceBytesReadOnly: true;
    readonly phase8bZeroHeldOutPreserved: true;
  };
  readonly phaseOwnership: {
    readonly phase7Families: readonly [
      "growth-rate",
      "growth-history",
      "pressure-dependence",
      "size-dependent-habit",
    ];
    readonly phase10DoesNotWaivePhase7: true;
    readonly phase10ClassificationsAreDevelopmentEvidence: true;
  };
  readonly denominators: {
    readonly phase8a: 18;
    readonly phase8b: 51;
    readonly combinedTotalForbidden: true;
  };
  readonly claimBoundary: Phase10ScopeClaimBoundary;
}

export interface Phase10ScopeClassification {
  readonly schema: typeof PHASE10_SCOPE_CLASSIFICATION_SCHEMA;
  readonly overlayId: string;
  readonly corpus: Phase10ScopeCorpus;
  readonly sourceRecordId: string;
  readonly phenomenonClass: Phase10ScopePhenomenonClass;
  readonly modelClassScope: Phase10ScopeReason;
  readonly representabilityBlockers: readonly Phase10ScopeRepresentabilityBlocker[];
  readonly specimenApparatusCompatibility: Phase10ScopeApparatusDisposition;
  readonly phaseOwnership: Phase10ScopePhaseOwnership;
  readonly currentDecisionEligibility: Phase10ScopeDecisionEligibility;
  readonly classifiedOn: string;
}

export interface Phase10ScopeClassificationProtocol {
  readonly schema: typeof PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_SCHEMA;
  readonly protocolId: string;
  readonly createdOn: string;
  readonly foundationFreeze: Phase10ScopeArtifactTuple;
  readonly obligationMatrix: Phase10ScopeArtifactTuple;
  readonly artifactSchemaRegistry: Phase10ScopeArtifactTuple;
  readonly inputCorpora: readonly [
    Phase10ScopeInputCorpusBinding,
    Phase10ScopeInputCorpusBinding,
  ];
  readonly rules: Phase10ScopeProtocolRules;
  readonly classifications: readonly Phase10ScopeClassification[];
}

export interface Phase10ScopeImmutableSourceField {
  readonly field: string;
  readonly value: StrictJson;
  readonly canonicalSha256: string;
}

export interface Phase10ScopeSourceJoin {
  readonly sourceArtifact: Phase10ScopeArtifactTuple;
  readonly sourceRecordId: string;
  readonly sourceRecordCanonicalSha256: string;
  readonly frozenRoleFields: readonly Phase10ScopeImmutableSourceField[];
}

export interface Phase10ScopeOverlayRow {
  readonly schema: typeof PHASE10_SCOPE_OVERLAY_ROW_SCHEMA;
  readonly overlayId: string;
  readonly corpus: Phase10ScopeCorpus;
  readonly sourceJoin: Phase10ScopeSourceJoin;
  readonly phenomenonClass: Phase10ScopePhenomenonClass;
  readonly modelClassScope: Phase10ScopeReason;
  readonly representabilityBlockers: readonly Phase10ScopeRepresentabilityBlocker[];
  readonly specimenApparatusCompatibility: Phase10ScopeApparatusDisposition;
  readonly immutableEvidenceRole: Phase10ScopeImmutableEvidenceRole;
  readonly phaseOwnership: Phase10ScopePhaseOwnership;
  readonly currentDecisionEligibility: Phase10ScopeDecisionEligibility;
  readonly classificationProtocol: Phase10ScopeProtocolBinding;
  readonly classifiedOn: string;
}

export interface Phase10ScopeCorpusCounts {
  readonly totalRows: number;
  readonly phenomenonClass: Readonly<Record<Phase10ScopePhenomenonClass, number>>;
  readonly modelClassScope: Readonly<Record<Phase10ScopeModelClassState, number>>;
  readonly representabilityBlockerCardinality: Readonly<{
    zero: number;
    one: number;
    multiple: number;
  }>;
  readonly representabilityBlockerKindOccurrences: Readonly<Record<Phase10ScopeBlockerKind, number>>;
  readonly specimenApparatusCompatibility: Readonly<
    Record<Phase10ScopeApparatusCompatibility, number>
  >;
  readonly immutableEvidenceRole: Readonly<Record<Phase10ScopeImmutableEvidenceRole, number>>;
  readonly phaseOwnership: Readonly<Record<Phase10ScopePhaseOwnership, number>>;
  readonly currentDecisionEligibility: Readonly<Record<Phase10ScopeDecisionEligibilityState, number>>;
}

export interface Phase10ScopeProducerProvenance {
  readonly producerId: string;
  readonly commit: string;
  readonly command: string;
  readonly startedOn: string;
  readonly endedOn: string;
  readonly actualConcurrency: number;
}

export interface Phase10ScopeReport {
  readonly schema: typeof PHASE10_SCOPE_REPORT_SCHEMA;
  readonly bundleId: string;
  readonly foundationFreeze: Phase10ScopeArtifactTuple;
  readonly protocolBinding: Phase10ScopeProtocolBinding;
  readonly inputArtifacts: readonly Phase10ScopeArtifactTuple[];
  readonly phase8aCounts: Phase10ScopeCorpusCounts;
  readonly phase8bCounts: Phase10ScopeCorpusCounts;
  readonly claimBoundary: Phase10ScopeClaimBoundary;
  readonly producer: Phase10ScopeProducerProvenance;
}

type JsonObject = { readonly [key: string]: StrictJson };

const SHA256 = /^[0-9a-f]{64}$/u;
const SAFE_PATH = /^[A-Za-z0-9][A-Za-z0-9._ /-]*$/u;
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;
const GIT_COMMIT = /^[0-9a-f]{40}$/u;

function invalid(label: string, detail: string): never {
  throw new Error(`${label} ${detail}`);
}

function root(value: unknown, label: string): JsonObject {
  let snapshot: StrictJson;
  try {
    snapshot = strictJsonSnapshot(value);
  } catch (error) {
    invalid(label, error instanceof Error ? error.message : String(error));
  }
  return object(snapshot, label);
}

function object(value: StrictJson | undefined, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    invalid(label, "must be an object");
  }
  return value as JsonObject;
}

function exactKeys(row: JsonObject, expected: readonly string[], label: string): void {
  const actual = Object.keys(row).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    invalid(label, `keys differ: got [${actual.join(", ")}], expected [${wanted.join(", ")}]`);
  }
}

function array(value: StrictJson | undefined, label: string): readonly StrictJson[] {
  if (!Array.isArray(value)) invalid(label, "must be an array");
  return value;
}

function nonemptyString(value: StrictJson | undefined, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    invalid(label, "must be a nonempty string without surrounding whitespace");
  }
  return value;
}

function literal<T extends string>(
  value: StrictJson | undefined,
  allowed: readonly T[],
  label: string,
): T {
  const result = nonemptyString(value, label);
  if (!(allowed as readonly string[]).includes(result)) {
    invalid(label, `must be one of ${allowed.join(", ")}`);
  }
  return result as T;
}

function booleanLiteral<T extends boolean>(
  value: StrictJson | undefined,
  expected: T,
  label: string,
): T {
  if (value !== expected) invalid(label, `must be ${String(expected)}`);
  return expected;
}

function numberLiteral<T extends number>(
  value: StrictJson | undefined,
  allowed: readonly T[],
  label: string,
): T {
  if (typeof value !== "number" || !allowed.includes(value as T)) {
    invalid(label, `must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}

function safeInteger(value: StrictJson | undefined, label: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) {
    invalid(label, `must be a safe integer >= ${minimum}`);
  }
  return value;
}

function safePath(value: StrictJson | undefined, label: string): string {
  const result = nonemptyString(value, label);
  if (
    !SAFE_PATH.test(result) ||
    result.includes("\\") ||
    result.startsWith("/") ||
    result.endsWith("/") ||
    result.split("/").some(
      (part) => part === "" || part === "." || part === ".." || part !== part.trim(),
    )
  ) {
    invalid(label, "must be a safe repository-relative path");
  }
  return result;
}

function stableId(value: StrictJson | undefined, label: string): string {
  const result = nonemptyString(value, label);
  if (!STABLE_ID.test(result)) invalid(label, "must be a stable identifier");
  return result;
}

function sha256(value: StrictJson | undefined, label: string): string {
  const result = nonemptyString(value, label);
  if (!SHA256.test(result)) invalid(label, "must be a lowercase SHA-256 digest");
  return result;
}

function isoDate(value: StrictJson | undefined, label: string): string {
  const result = nonemptyString(value, label);
  if (!ISO_DATE.test(result) || Number.isNaN(Date.parse(`${result}T00:00:00Z`))) {
    invalid(label, "must be an ISO calendar date");
  }
  return result;
}

function isoTimestamp(value: StrictJson | undefined, label: string): string {
  const result = nonemptyString(value, label);
  if (!/^\d{4}-\d{2}-\d{2}T/u.test(result) || Number.isNaN(Date.parse(result))) {
    invalid(label, "must be an ISO timestamp");
  }
  return result;
}

function commit(value: StrictJson | undefined, label: string): string {
  const result = nonemptyString(value, label);
  if (!GIT_COMMIT.test(result)) invalid(label, "must be a lowercase 40-character Git commit");
  return result;
}

function sortedUniqueStrings(
  value: StrictJson | undefined,
  label: string,
  allowEmpty = true,
): readonly string[] {
  const result = array(value, label).map((entry, index) => stableId(entry, `${label}[${index}]`));
  if (!allowEmpty && result.length === 0) invalid(label, "must be nonempty");
  if (result.some((entry, index) => index > 0 && result[index - 1]! >= entry)) {
    invalid(label, "must be sorted and unique");
  }
  return Object.freeze(result);
}

function exactStringArray<T extends string>(
  value: StrictJson | undefined,
  expected: readonly T[],
  label: string,
): readonly T[] {
  const result = array(value, label).map((entry, index) =>
    literal(entry, expected, `${label}[${index}]`),
  );
  if (
    result.length !== expected.length ||
    result.some((entry, index) => entry !== expected[index])
  ) {
    invalid(label, `must be exactly [${expected.join(", ")}]`);
  }
  return Object.freeze(result);
}

function artifactTuple(value: StrictJson | undefined, label: string): Phase10ScopeArtifactTuple {
  const row = object(value, label);
  exactKeys(row, ["path", "byteLength", "sha256"], label);
  return Object.freeze({
    path: safePath(row.path, `${label}.path`),
    byteLength: safeInteger(row.byteLength, `${label}.byteLength`),
    sha256: sha256(row.sha256, `${label}.sha256`),
  });
}

function protocolBinding(value: StrictJson | undefined, label: string): Phase10ScopeProtocolBinding {
  const row = object(value, label);
  exactKeys(row, ["path", "byteLength", "sha256", "commit"], label);
  return Object.freeze({
    path: safePath(row.path, `${label}.path`),
    byteLength: safeInteger(row.byteLength, `${label}.byteLength`),
    sha256: sha256(row.sha256, `${label}.sha256`),
    commit: commit(row.commit, `${label}.commit`),
  });
}

function citationRef(value: StrictJson, label: string): Phase10ScopeCitationRef {
  const row = object(value, label);
  exactKeys(row, ["refId", "kind", "locator", "artifact", "recordId"], label);
  return Object.freeze({
    refId: stableId(row.refId, `${label}.refId`),
    kind: literal(
      row.kind,
      ["charter", "tracked-record", "nas-private-source", "external-metadata"],
      `${label}.kind`,
    ),
    locator: nonemptyString(row.locator, `${label}.locator`),
    artifact: row.artifact === null ? null : artifactTuple(row.artifact, `${label}.artifact`),
    recordId: row.recordId === null ? null : stableId(row.recordId, `${label}.recordId`),
  });
}

function citationRefs(value: StrictJson | undefined, label: string, allowEmpty: boolean): readonly Phase10ScopeCitationRef[] {
  const result = array(value, label).map((entry, index) => citationRef(entry, `${label}[${index}]`));
  if (!allowEmpty && result.length === 0) invalid(label, "must be nonempty");
  if (result.some((entry, index) => index > 0 && result[index - 1]!.refId >= entry.refId)) {
    invalid(label, "must be sorted and unique by refId");
  }
  return Object.freeze(result);
}

function scopeReason(value: StrictJson | undefined, label: string): Phase10ScopeReason {
  const row = object(value, label);
  exactKeys(row, ["status", "reason", "citationRefs"], label);
  return Object.freeze({
    status: literal(row.status, PHASE10_SCOPE_MODEL_CLASS_STATES, `${label}.status`),
    reason: nonemptyString(row.reason, `${label}.reason`),
    citationRefs: citationRefs(row.citationRefs, `${label}.citationRefs`, false),
  });
}

function blocker(value: StrictJson, label: string): Phase10ScopeRepresentabilityBlocker {
  const row = object(value, label);
  exactKeys(row, ["operandId", "kind", "detail", "citationRefs"], label);
  const kind = literal(row.kind, PHASE10_SCOPE_BLOCKER_KINDS, `${label}.kind`);
  const detail = nonemptyString(row.detail, `${label}.detail`);
  if (kind === "other" && detail.length < 8) invalid(label, "kind other requires a named detail");
  return Object.freeze({
    operandId: stableId(row.operandId, `${label}.operandId`),
    kind,
    detail,
    citationRefs: citationRefs(row.citationRefs, `${label}.citationRefs`, true),
  });
}

function blockers(value: StrictJson | undefined, label: string): readonly Phase10ScopeRepresentabilityBlocker[] {
  const result = array(value, label).map((entry, index) => blocker(entry, `${label}[${index}]`));
  if (result.some((entry, index) => index > 0 && result[index - 1]!.operandId >= entry.operandId)) {
    invalid(label, "must be sorted and unique by operandId");
  }
  return Object.freeze(result);
}

function apparatusDisposition(
  value: StrictJson | undefined,
  label: string,
): Phase10ScopeApparatusDisposition {
  const row = object(value, label);
  exactKeys(row, ["status", "reason", "citationRefs"], label);
  return Object.freeze({
    status: literal(row.status, PHASE10_SCOPE_APPARATUS_COMPATIBILITY, `${label}.status`),
    reason: nonemptyString(row.reason, `${label}.reason`),
    citationRefs: citationRefs(row.citationRefs, `${label}.citationRefs`, false),
  });
}

function decisionEligibility(
  value: StrictJson | undefined,
  label: string,
  expectedBlockingOperandIds: readonly string[],
): Phase10ScopeDecisionEligibility {
  const row = object(value, label);
  exactKeys(row, ["status", "blockingOperandIds", "reason"], label);
  const status = literal(row.status, PHASE10_SCOPE_DECISION_ELIGIBILITY, `${label}.status`);
  const blockingOperandIds = sortedUniqueStrings(
    row.blockingOperandIds,
    `${label}.blockingOperandIds`,
  );
  if (
    blockingOperandIds.length !== expectedBlockingOperandIds.length ||
    blockingOperandIds.some((entry, index) => entry !== expectedBlockingOperandIds[index])
  ) {
    invalid(label, "blockingOperandIds must equal the row's representability blocker operand IDs");
  }
  if (status === "quantitative" && blockingOperandIds.length !== 0) {
    invalid(label, "quantitative eligibility cannot retain a blocking operand");
  }
  if (status === "refused" && blockingOperandIds.length === 0) {
    invalid(label, "refused eligibility requires a blocking operand");
  }
  return Object.freeze({
    status,
    blockingOperandIds,
    reason: nonemptyString(row.reason, `${label}.reason`),
  });
}

function terminalStatus(
  value: StrictJson | undefined,
  label: string,
): Phase10ScopeTerminalStatusBinding {
  const row = object(value, label);
  exactKeys(
    row,
    [
      "statusRowRequired",
      "recordKind",
      "expectedStatusRowCount",
      "expectedLineNumber",
      "lfTerminatedByteLength",
      "lfTerminatedSha256",
      "overlayRecordFilter",
    ],
    label,
  );
  if (typeof row.statusRowRequired !== "boolean") invalid(`${label}.statusRowRequired`, "must be boolean");
  const statusRowRequired = row.statusRowRequired;
  const recordKind = row.recordKind === null
    ? null
    : literal(row.recordKind, ["book-status"], `${label}.recordKind`);
  const expectedStatusRowCount = numberLiteral(
    row.expectedStatusRowCount,
    [0, 1] as const,
    `${label}.expectedStatusRowCount`,
  );
  const expectedLineNumber = row.expectedLineNumber === null
    ? null
    : safeInteger(row.expectedLineNumber, `${label}.expectedLineNumber`, 1);
  const lfTerminatedByteLength = row.lfTerminatedByteLength === null
    ? null
    : safeInteger(row.lfTerminatedByteLength, `${label}.lfTerminatedByteLength`, 1);
  const lfTerminatedSha256 = row.lfTerminatedSha256 === null
    ? null
    : sha256(row.lfTerminatedSha256, `${label}.lfTerminatedSha256`);
  const overlayRecordFilter = literal(
    row.overlayRecordFilter,
    ["recordKind=entry", "all-jsonl-rows"],
    `${label}.overlayRecordFilter`,
  );
  if (
    statusRowRequired !== true ||
    recordKind !== "book-status" ||
    expectedStatusRowCount !== 1 ||
    expectedLineNumber === null ||
    lfTerminatedByteLength === null ||
    lfTerminatedSha256 === null ||
    overlayRecordFilter !== "recordKind=entry"
  ) {
    if (
      statusRowRequired !== false ||
      recordKind !== null ||
      expectedStatusRowCount !== 0 ||
      expectedLineNumber !== null ||
      lfTerminatedByteLength !== null ||
      lfTerminatedSha256 !== null ||
      overlayRecordFilter !== "all-jsonl-rows"
    ) {
      invalid(label, "must be a coherent required-status or no-status binding");
    }
  }
  return Object.freeze({
    statusRowRequired,
    recordKind,
    expectedStatusRowCount,
    expectedLineNumber,
    lfTerminatedByteLength,
    lfTerminatedSha256,
    overlayRecordFilter,
  });
}

function inputCorpus(value: StrictJson, index: number): Phase10ScopeInputCorpusBinding {
  const label = `Phase 10 scope protocol inputCorpora[${index}]`;
  const row = object(value, label);
  exactKeys(
    row,
    [
      "corpus",
      "inputArtifactId",
      "sourceArtifact",
      "recordIdField",
      "expectedRecordCount",
      "expectedJsonlRowCount",
      "expectedIdsSha256",
      "immutableSourceFields",
      "terminalStatus",
    ],
    label,
  );
  const corpus = literal(row.corpus, PHASE10_SCOPE_CORPORA, `${label}.corpus`);
  const expected = corpus === "phase8a"
    ? {
        inputArtifactId: "P10-IN-PHASE8A-TARGET-BOOK" as const,
        recordIdField: "id" as const,
        count: 18,
        rows: 19,
        immutable: ["partition", "role"] as const,
      }
    : {
        inputArtifactId: "P10-IN-PHASE8B-SUCCESSOR" as const,
        recordIdField: "selectionId" as const,
        count: 51,
        rows: 51,
        immutable: ["binding", "phase9EvidenceRole", "split"] as const,
      };
  const recordIdField = literal(
    row.recordIdField,
    ["id", "selectionId"],
    `${label}.recordIdField`,
  );
  if (recordIdField !== expected.recordIdField) invalid(label, "recordIdField does not match corpus");
  const expectedRecordCount = safeInteger(row.expectedRecordCount, `${label}.expectedRecordCount`);
  const expectedJsonlRowCount = safeInteger(
    row.expectedJsonlRowCount,
    `${label}.expectedJsonlRowCount`,
  );
  if (expectedRecordCount !== expected.count || expectedJsonlRowCount !== expected.rows) {
    invalid(label, `must bind ${expected.count} records and ${expected.rows} JSONL rows`);
  }
  const immutableSourceFields = exactStringArray(
    row.immutableSourceFields,
    expected.immutable,
    `${label}.immutableSourceFields`,
  );
  const boundTerminalStatus = terminalStatus(row.terminalStatus, `${label}.terminalStatus`);
  if (corpus === "phase8a" && !boundTerminalStatus.statusRowRequired) {
    invalid(label, "Phase 8A must bind its terminal status row");
  }
  if (
    corpus === "phase8a" &&
    boundTerminalStatus.expectedLineNumber !== expectedJsonlRowCount
  ) {
    invalid(label, "Phase 8A status row must be the final JSONL row");
  }
  if (corpus === "phase8b" && boundTerminalStatus.statusRowRequired) {
    invalid(label, "Phase 8B must not invent a terminal status row");
  }
  const inputArtifactId = stableId(row.inputArtifactId, `${label}.inputArtifactId`);
  if (inputArtifactId !== expected.inputArtifactId) {
    invalid(label, "inputArtifactId does not match the S1 foundation roster");
  }
  return Object.freeze({
    corpus,
    inputArtifactId,
    sourceArtifact: artifactTuple(row.sourceArtifact, `${label}.sourceArtifact`),
    recordIdField,
    expectedRecordCount,
    expectedJsonlRowCount,
    expectedIdsSha256: sha256(row.expectedIdsSha256, `${label}.expectedIdsSha256`),
    immutableSourceFields,
    terminalStatus: boundTerminalStatus,
  });
}

function claimBoundary(value: StrictJson | undefined, label: string): Phase10ScopeClaimBoundary {
  const row = object(value, label);
  const keys = [
    "scopeCensusOnlyForAS",
    "allOpenedSourceValuesArePhase10DevelopmentEvidence",
    "quantitativeValidationEarned",
    "phase7CreditEarned",
    "phase8CreditEarned",
    "phase9CreditEarned",
    "heldOutComparisonExecuted",
    "targetScoreProduced",
    "solverPhysicsChanged",
    "c1ThroughC5RowsProduced",
    "habitRowsProduced",
    "eObservationOperatorImplemented",
    "fExternalRequestWrittenOrSent",
    "hTransportImplemented",
    "downstreamExecutionAuthorized",
    "priorPhaseLabelsAndArtifactsPreserved",
  ] as const;
  exactKeys(row, keys, label);
  return Object.freeze({
    scopeCensusOnlyForAS: booleanLiteral(row.scopeCensusOnlyForAS, true, `${label}.scopeCensusOnlyForAS`),
    allOpenedSourceValuesArePhase10DevelopmentEvidence: booleanLiteral(
      row.allOpenedSourceValuesArePhase10DevelopmentEvidence,
      true,
      `${label}.allOpenedSourceValuesArePhase10DevelopmentEvidence`,
    ),
    quantitativeValidationEarned: booleanLiteral(row.quantitativeValidationEarned, false, `${label}.quantitativeValidationEarned`),
    phase7CreditEarned: booleanLiteral(row.phase7CreditEarned, false, `${label}.phase7CreditEarned`),
    phase8CreditEarned: booleanLiteral(row.phase8CreditEarned, false, `${label}.phase8CreditEarned`),
    phase9CreditEarned: booleanLiteral(row.phase9CreditEarned, false, `${label}.phase9CreditEarned`),
    heldOutComparisonExecuted: booleanLiteral(row.heldOutComparisonExecuted, false, `${label}.heldOutComparisonExecuted`),
    targetScoreProduced: booleanLiteral(row.targetScoreProduced, false, `${label}.targetScoreProduced`),
    solverPhysicsChanged: booleanLiteral(row.solverPhysicsChanged, false, `${label}.solverPhysicsChanged`),
    c1ThroughC5RowsProduced: booleanLiteral(row.c1ThroughC5RowsProduced, false, `${label}.c1ThroughC5RowsProduced`),
    habitRowsProduced: booleanLiteral(row.habitRowsProduced, false, `${label}.habitRowsProduced`),
    eObservationOperatorImplemented: booleanLiteral(row.eObservationOperatorImplemented, false, `${label}.eObservationOperatorImplemented`),
    fExternalRequestWrittenOrSent: booleanLiteral(row.fExternalRequestWrittenOrSent, false, `${label}.fExternalRequestWrittenOrSent`),
    hTransportImplemented: booleanLiteral(row.hTransportImplemented, false, `${label}.hTransportImplemented`),
    downstreamExecutionAuthorized: booleanLiteral(row.downstreamExecutionAuthorized, false, `${label}.downstreamExecutionAuthorized`),
    priorPhaseLabelsAndArtifactsPreserved: booleanLiteral(row.priorPhaseLabelsAndArtifactsPreserved, true, `${label}.priorPhaseLabelsAndArtifactsPreserved`),
  });
}

function protocolRules(value: StrictJson | undefined, label: string): Phase10ScopeProtocolRules {
  const row = object(value, label);
  exactKeys(
    row,
    [
      "contractImplementation",
      "authority",
      "modelClass",
      "representability",
      "immutableRoles",
      "phaseOwnership",
      "denominators",
      "claimBoundary",
    ],
    label,
  );
  const authority = object(row.authority, `${label}.authority`);
  exactKeys(
    authority,
    ["charterVersion", "charterArtifact", "decisionId", "decisionArtifact"],
    `${label}.authority`,
  );
  const modelClass = object(row.modelClass, `${label}.modelClass`);
  exactKeys(
    modelClass,
    [
      "representedSystem",
      "excludedPhenomenonClasses",
      "singleCrystalWithCurrentGapsRemainsInScope",
      "mixedAndUnresolvedRemainFirstClass",
    ],
    `${label}.modelClass`,
  );
  const representability = object(row.representability, `${label}.representability`);
  exactKeys(
    representability,
    [
      "multipleBlockersAllowed",
      "blockerOperandIdsUniquePerRow",
      "blockersDoNotRewriteModelClassScope",
      "allowedKinds",
    ],
    `${label}.representability`,
  );
  const immutableRoles = object(row.immutableRoles, `${label}.immutableRoles`);
  exactKeys(
    immutableRoles,
    [
      "phase8aDerivedFrom",
      "phase8bDerivedFrom",
      "sourceBytesReadOnly",
      "phase8bZeroHeldOutPreserved",
    ],
    `${label}.immutableRoles`,
  );
  const phaseOwnership = object(row.phaseOwnership, `${label}.phaseOwnership`);
  exactKeys(
    phaseOwnership,
    [
      "phase7Families",
      "phase10DoesNotWaivePhase7",
      "phase10ClassificationsAreDevelopmentEvidence",
    ],
    `${label}.phaseOwnership`,
  );
  const denominators = object(row.denominators, `${label}.denominators`);
  exactKeys(denominators, ["phase8a", "phase8b", "combinedTotalForbidden"], `${label}.denominators`);
  const excluded = exactStringArray(
    modelClass.excludedPhenomenonClasses,
    [
      "aggregation",
      "impurity-or-chemistry",
      "nucleation",
      "polycrystal-or-twin",
      "riming-or-graupel",
    ] as const,
    `${label}.modelClass.excludedPhenomenonClasses`,
  );
  const allowedKinds = exactStringArray(
    representability.allowedKinds,
    PHASE10_SCOPE_BLOCKER_KINDS,
    `${label}.representability.allowedKinds`,
  ) as readonly Phase10ScopeBlockerKind[];
  return Object.freeze({
    contractImplementation: artifactTuple(row.contractImplementation, `${label}.contractImplementation`),
    authority: Object.freeze({
      charterVersion: literal(authority.charterVersion, ["v1.28"], `${label}.authority.charterVersion`),
      charterArtifact: artifactTuple(authority.charterArtifact, `${label}.authority.charterArtifact`),
      decisionId: literal(authority.decisionId, ["0052"], `${label}.authority.decisionId`),
      decisionArtifact: artifactTuple(authority.decisionArtifact, `${label}.authority.decisionArtifact`),
    }),
    modelClass: Object.freeze({
      representedSystem: nonemptyString(modelClass.representedSystem, `${label}.modelClass.representedSystem`),
      excludedPhenomenonClasses: excluded as Phase10ScopeProtocolRules["modelClass"]["excludedPhenomenonClasses"],
      singleCrystalWithCurrentGapsRemainsInScope: booleanLiteral(
        modelClass.singleCrystalWithCurrentGapsRemainsInScope,
        true,
        `${label}.modelClass.singleCrystalWithCurrentGapsRemainsInScope`,
      ),
      mixedAndUnresolvedRemainFirstClass: booleanLiteral(
        modelClass.mixedAndUnresolvedRemainFirstClass,
        true,
        `${label}.modelClass.mixedAndUnresolvedRemainFirstClass`,
      ),
    }),
    representability: Object.freeze({
      multipleBlockersAllowed: booleanLiteral(representability.multipleBlockersAllowed, true, `${label}.representability.multipleBlockersAllowed`),
      blockerOperandIdsUniquePerRow: booleanLiteral(representability.blockerOperandIdsUniquePerRow, true, `${label}.representability.blockerOperandIdsUniquePerRow`),
      blockersDoNotRewriteModelClassScope: booleanLiteral(representability.blockersDoNotRewriteModelClassScope, true, `${label}.representability.blockersDoNotRewriteModelClassScope`),
      allowedKinds,
    }),
    immutableRoles: Object.freeze({
      phase8aDerivedFrom: exactStringArray(immutableRoles.phase8aDerivedFrom, ["partition", "role"] as const, `${label}.immutableRoles.phase8aDerivedFrom`) as readonly ["partition", "role"],
      phase8bDerivedFrom: exactStringArray(immutableRoles.phase8bDerivedFrom, ["binding", "phase9EvidenceRole", "split"] as const, `${label}.immutableRoles.phase8bDerivedFrom`) as readonly ["binding", "phase9EvidenceRole", "split"],
      sourceBytesReadOnly: booleanLiteral(immutableRoles.sourceBytesReadOnly, true, `${label}.immutableRoles.sourceBytesReadOnly`),
      phase8bZeroHeldOutPreserved: booleanLiteral(immutableRoles.phase8bZeroHeldOutPreserved, true, `${label}.immutableRoles.phase8bZeroHeldOutPreserved`),
    }),
    phaseOwnership: Object.freeze({
      phase7Families: exactStringArray(
        phaseOwnership.phase7Families,
        ["growth-rate", "growth-history", "pressure-dependence", "size-dependent-habit"] as const,
        `${label}.phaseOwnership.phase7Families`,
      ) as Phase10ScopeProtocolRules["phaseOwnership"]["phase7Families"],
      phase10DoesNotWaivePhase7: booleanLiteral(phaseOwnership.phase10DoesNotWaivePhase7, true, `${label}.phaseOwnership.phase10DoesNotWaivePhase7`),
      phase10ClassificationsAreDevelopmentEvidence: booleanLiteral(phaseOwnership.phase10ClassificationsAreDevelopmentEvidence, true, `${label}.phaseOwnership.phase10ClassificationsAreDevelopmentEvidence`),
    }),
    denominators: Object.freeze({
      phase8a: numberLiteral(denominators.phase8a, [18] as const, `${label}.denominators.phase8a`),
      phase8b: numberLiteral(denominators.phase8b, [51] as const, `${label}.denominators.phase8b`),
      combinedTotalForbidden: booleanLiteral(denominators.combinedTotalForbidden, true, `${label}.denominators.combinedTotalForbidden`),
    }),
    claimBoundary: claimBoundary(row.claimBoundary, `${label}.claimBoundary`),
  });
}

function classification(value: StrictJson, index: number): Phase10ScopeClassification {
  const label = `Phase 10 scope protocol classifications[${index}]`;
  const row = object(value, label);
  exactKeys(
    row,
    [
      "schema",
      "overlayId",
      "corpus",
      "sourceRecordId",
      "phenomenonClass",
      "modelClassScope",
      "representabilityBlockers",
      "specimenApparatusCompatibility",
      "phaseOwnership",
      "currentDecisionEligibility",
      "classifiedOn",
    ],
    label,
  );
  const parsedBlockers = blockers(row.representabilityBlockers, `${label}.representabilityBlockers`);
  const phenomenonClass = literal(
    row.phenomenonClass,
    PHASE10_SCOPE_PHENOMENON_CLASSES,
    `${label}.phenomenonClass`,
  );
  const parsedScopeReason = scopeReason(row.modelClassScope, `${label}.modelClassScope`);
  const excludedPhenomena: readonly Phase10ScopePhenomenonClass[] = [
    "aggregation",
    "impurity-or-chemistry",
    "nucleation",
    "polycrystal-or-twin",
    "riming-or-graupel",
  ];
  if (excludedPhenomena.includes(phenomenonClass) && parsedScopeReason.status !== "out") {
    invalid(label, "a charter-excluded phenomenon class must have out model-class scope");
  }
  if (parsedScopeReason.status === "out" && parsedBlockers.length !== 0) {
    invalid(label, "an out-of-model row must not disguise scope exclusion as a representation blocker");
  }
  return Object.freeze({
    schema: literal(row.schema, [PHASE10_SCOPE_CLASSIFICATION_SCHEMA], `${label}.schema`),
    overlayId: stableId(row.overlayId, `${label}.overlayId`),
    corpus: literal(row.corpus, PHASE10_SCOPE_CORPORA, `${label}.corpus`),
    sourceRecordId: stableId(row.sourceRecordId, `${label}.sourceRecordId`),
    phenomenonClass,
    modelClassScope: parsedScopeReason,
    representabilityBlockers: parsedBlockers,
    specimenApparatusCompatibility: apparatusDisposition(
      row.specimenApparatusCompatibility,
      `${label}.specimenApparatusCompatibility`,
    ),
    phaseOwnership: literal(row.phaseOwnership, PHASE10_SCOPE_PHASE_OWNERSHIP, `${label}.phaseOwnership`),
    currentDecisionEligibility: decisionEligibility(
      row.currentDecisionEligibility,
      `${label}.currentDecisionEligibility`,
      parsedBlockers.map((entry) => entry.operandId),
    ),
    classifiedOn: isoDate(row.classifiedOn, `${label}.classifiedOn`),
  });
}

export function parsePhase10ScopeClassificationProtocol(
  value: unknown,
): Phase10ScopeClassificationProtocol {
  const label = "Phase 10 scope classification protocol";
  const row = root(value, label);
  exactKeys(
    row,
    [
      "schema",
      "protocolId",
      "createdOn",
      "foundationFreeze",
      "obligationMatrix",
      "artifactSchemaRegistry",
      "inputCorpora",
      "rules",
      "classifications",
    ],
    label,
  );
  const inputCorpora = array(row.inputCorpora, `${label}.inputCorpora`).map(inputCorpus);
  if (
    inputCorpora.length !== 2 ||
    inputCorpora[0]?.corpus !== "phase8a" ||
    inputCorpora[1]?.corpus !== "phase8b"
  ) {
    invalid(`${label}.inputCorpora`, "must be exactly phase8a then phase8b");
  }
  const classifications = array(row.classifications, `${label}.classifications`).map(classification);
  if (classifications.length !== 69) invalid(`${label}.classifications`, "must contain exactly 69 rows");
  if (classifications.some((entry, index) => index > 0 && classifications[index - 1]!.overlayId >= entry.overlayId)) {
    invalid(`${label}.classifications`, "must be sorted and unique by overlayId");
  }
  const sourceRoster = classifications.map((entry) => `${entry.corpus}\u0000${entry.sourceRecordId}`);
  if (new Set(sourceRoster).size !== sourceRoster.length) {
    invalid(`${label}.classifications`, "must contain each corpus/sourceRecordId pair exactly once");
  }
  const createdOn = isoDate(row.createdOn, `${label}.createdOn`);
  if (classifications.some((entry) => entry.classifiedOn !== createdOn)) {
    invalid(`${label}.classifications`, "every classifiedOn date must equal createdOn");
  }
  const corpusCounts = new Map<Phase10ScopeCorpus, number>([["phase8a", 0], ["phase8b", 0]]);
  for (const rowClassification of classifications) {
    corpusCounts.set(rowClassification.corpus, corpusCounts.get(rowClassification.corpus)! + 1);
  }
  if (corpusCounts.get("phase8a") !== 18 || corpusCounts.get("phase8b") !== 51) {
    invalid(`${label}.classifications`, "must contain separate 18-row and 51-row corpora");
  }
  return Object.freeze({
    schema: literal(row.schema, [PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_SCHEMA], `${label}.schema`),
    protocolId: stableId(row.protocolId, `${label}.protocolId`),
    createdOn,
    foundationFreeze: artifactTuple(row.foundationFreeze, `${label}.foundationFreeze`),
    obligationMatrix: artifactTuple(row.obligationMatrix, `${label}.obligationMatrix`),
    artifactSchemaRegistry: artifactTuple(row.artifactSchemaRegistry, `${label}.artifactSchemaRegistry`),
    inputCorpora: Object.freeze(inputCorpora) as unknown as Phase10ScopeClassificationProtocol["inputCorpora"],
    rules: protocolRules(row.rules, `${label}.rules`),
    classifications: Object.freeze(classifications),
  });
}

/**
 * Freeze producer for the human-authored A-S decision input. It accepts no derived overlay or
 * report bytes: the only output is an owned, strictly validated immutable protocol snapshot.
 */
export function producePhase10ScopeClassificationProtocol(
  value: unknown,
): Phase10ScopeClassificationProtocol {
  return parsePhase10ScopeClassificationProtocol(value);
}

function immutableSourceField(
  value: StrictJson,
  label: string,
): Phase10ScopeImmutableSourceField {
  const row = object(value, label);
  exactKeys(row, ["field", "value", "canonicalSha256"], label);
  const field = nonemptyString(row.field, `${label}.field`);
  if (field.includes("/") || field.includes(".")) invalid(`${label}.field`, "must be a top-level field name");
  return Object.freeze({
    field,
    value: strictJsonSnapshot(row.value),
    canonicalSha256: sha256(row.canonicalSha256, `${label}.canonicalSha256`),
  });
}

function sourceJoin(value: StrictJson | undefined, label: string): Phase10ScopeSourceJoin {
  const row = object(value, label);
  exactKeys(
    row,
    ["sourceArtifact", "sourceRecordId", "sourceRecordCanonicalSha256", "frozenRoleFields"],
    label,
  );
  const frozenRoleFields = array(row.frozenRoleFields, `${label}.frozenRoleFields`).map((entry, index) =>
    immutableSourceField(entry, `${label}.frozenRoleFields[${index}]`),
  );
  if (
    frozenRoleFields.length === 0 ||
    frozenRoleFields.some((entry, index) => index > 0 && frozenRoleFields[index - 1]!.field >= entry.field)
  ) {
    invalid(`${label}.frozenRoleFields`, "must be nonempty, sorted, and unique by field");
  }
  return Object.freeze({
    sourceArtifact: artifactTuple(row.sourceArtifact, `${label}.sourceArtifact`),
    sourceRecordId: stableId(row.sourceRecordId, `${label}.sourceRecordId`),
    sourceRecordCanonicalSha256: sha256(
      row.sourceRecordCanonicalSha256,
      `${label}.sourceRecordCanonicalSha256`,
    ),
    frozenRoleFields: Object.freeze(frozenRoleFields),
  });
}

export function parsePhase10ScopeOverlayRow(value: unknown): Phase10ScopeOverlayRow {
  const label = "Phase 10 scope overlay row";
  const row = root(value, label);
  exactKeys(
    row,
    [
      "schema",
      "overlayId",
      "corpus",
      "sourceJoin",
      "phenomenonClass",
      "modelClassScope",
      "representabilityBlockers",
      "specimenApparatusCompatibility",
      "immutableEvidenceRole",
      "phaseOwnership",
      "currentDecisionEligibility",
      "classificationProtocol",
      "classifiedOn",
    ],
    label,
  );
  const parsedBlockers = blockers(row.representabilityBlockers, `${label}.representabilityBlockers`);
  const corpus = literal(row.corpus, PHASE10_SCOPE_CORPORA, `${label}.corpus`);
  const join = sourceJoin(row.sourceJoin, `${label}.sourceJoin`);
  const expectedFrozenFields = corpus === "phase8a"
    ? ["partition", "role"]
    : ["binding", "phase9EvidenceRole", "split"];
  if (
    join.frozenRoleFields.length !== expectedFrozenFields.length ||
    join.frozenRoleFields.some((entry, index) => entry.field !== expectedFrozenFields[index])
  ) {
    invalid(`${label}.sourceJoin.frozenRoleFields`, "does not match the corpus's immutable role fields");
  }
  return Object.freeze({
    schema: literal(row.schema, [PHASE10_SCOPE_OVERLAY_ROW_SCHEMA], `${label}.schema`),
    overlayId: stableId(row.overlayId, `${label}.overlayId`),
    corpus,
    sourceJoin: join,
    phenomenonClass: literal(row.phenomenonClass, PHASE10_SCOPE_PHENOMENON_CLASSES, `${label}.phenomenonClass`),
    modelClassScope: scopeReason(row.modelClassScope, `${label}.modelClassScope`),
    representabilityBlockers: parsedBlockers,
    specimenApparatusCompatibility: apparatusDisposition(
      row.specimenApparatusCompatibility,
      `${label}.specimenApparatusCompatibility`,
    ),
    immutableEvidenceRole: literal(
      row.immutableEvidenceRole,
      PHASE10_SCOPE_IMMUTABLE_EVIDENCE_ROLES,
      `${label}.immutableEvidenceRole`,
    ),
    phaseOwnership: literal(row.phaseOwnership, PHASE10_SCOPE_PHASE_OWNERSHIP, `${label}.phaseOwnership`),
    currentDecisionEligibility: decisionEligibility(
      row.currentDecisionEligibility,
      `${label}.currentDecisionEligibility`,
      parsedBlockers.map((entry) => entry.operandId),
    ),
    classificationProtocol: protocolBinding(row.classificationProtocol, `${label}.classificationProtocol`),
    classifiedOn: isoDate(row.classifiedOn, `${label}.classifiedOn`),
  });
}

function countMap<T extends string>(
  value: StrictJson | undefined,
  keys: readonly T[],
  label: string,
): Readonly<Record<T, number>> {
  const row = object(value, label);
  exactKeys(row, keys, label);
  const result = Object.fromEntries(
    keys.map((key) => [key, safeInteger(row[key], `${label}.${key}`)]),
  ) as Record<T, number>;
  return Object.freeze(result);
}

function corpusCounts(
  value: StrictJson | undefined,
  expectedTotal: 18 | 51,
  label: string,
): Phase10ScopeCorpusCounts {
  const row = object(value, label);
  exactKeys(
    row,
    [
      "totalRows",
      "phenomenonClass",
      "modelClassScope",
      "representabilityBlockerCardinality",
      "representabilityBlockerKindOccurrences",
      "specimenApparatusCompatibility",
      "immutableEvidenceRole",
      "phaseOwnership",
      "currentDecisionEligibility",
    ],
    label,
  );
  const totalRows = safeInteger(row.totalRows, `${label}.totalRows`);
  if (totalRows !== expectedTotal) invalid(`${label}.totalRows`, `must equal ${expectedTotal}`);
  const phenomenonClass = countMap(row.phenomenonClass, PHASE10_SCOPE_PHENOMENON_CLASSES, `${label}.phenomenonClass`);
  const modelClassScope = countMap(row.modelClassScope, PHASE10_SCOPE_MODEL_CLASS_STATES, `${label}.modelClassScope`);
  const representabilityBlockerCardinality = countMap(
    row.representabilityBlockerCardinality,
    ["zero", "one", "multiple"] as const,
    `${label}.representabilityBlockerCardinality`,
  );
  const representabilityBlockerKindOccurrences = countMap(
    row.representabilityBlockerKindOccurrences,
    PHASE10_SCOPE_BLOCKER_KINDS,
    `${label}.representabilityBlockerKindOccurrences`,
  );
  const specimenApparatusCompatibility = countMap(
    row.specimenApparatusCompatibility,
    PHASE10_SCOPE_APPARATUS_COMPATIBILITY,
    `${label}.specimenApparatusCompatibility`,
  );
  const immutableEvidenceRole = countMap(
    row.immutableEvidenceRole,
    PHASE10_SCOPE_IMMUTABLE_EVIDENCE_ROLES,
    `${label}.immutableEvidenceRole`,
  );
  const phaseOwnership = countMap(row.phaseOwnership, PHASE10_SCOPE_PHASE_OWNERSHIP, `${label}.phaseOwnership`);
  const currentDecisionEligibility = countMap(
    row.currentDecisionEligibility,
    PHASE10_SCOPE_DECISION_ELIGIBILITY,
    `${label}.currentDecisionEligibility`,
  );
  const categoricalMaps = [
    phenomenonClass,
    modelClassScope,
    representabilityBlockerCardinality,
    specimenApparatusCompatibility,
    immutableEvidenceRole,
    phaseOwnership,
    currentDecisionEligibility,
  ];
  for (const map of categoricalMaps) {
    if (Object.values(map).reduce((sum, count) => sum + count, 0) !== totalRows) {
      invalid(label, "every mutually exclusive categorical count map must sum to totalRows");
    }
  }
  return Object.freeze({
    totalRows,
    phenomenonClass,
    modelClassScope,
    representabilityBlockerCardinality,
    representabilityBlockerKindOccurrences,
    specimenApparatusCompatibility,
    immutableEvidenceRole,
    phaseOwnership,
    currentDecisionEligibility,
  });
}

function producerProvenance(
  value: StrictJson | undefined,
  label: string,
): Phase10ScopeProducerProvenance {
  const row = object(value, label);
  exactKeys(row, ["producerId", "commit", "command", "startedOn", "endedOn", "actualConcurrency"], label);
  const startedOn = isoTimestamp(row.startedOn, `${label}.startedOn`);
  const endedOn = isoTimestamp(row.endedOn, `${label}.endedOn`);
  if (Date.parse(endedOn) < Date.parse(startedOn)) invalid(label, "endedOn must not precede startedOn");
  return Object.freeze({
    producerId: stableId(row.producerId, `${label}.producerId`),
    commit: commit(row.commit, `${label}.commit`),
    command: nonemptyString(row.command, `${label}.command`),
    startedOn,
    endedOn,
    actualConcurrency: safeInteger(row.actualConcurrency, `${label}.actualConcurrency`, 1),
  });
}

export function parsePhase10ScopeReport(value: unknown): Phase10ScopeReport {
  const label = "Phase 10 scope report";
  const row = root(value, label);
  exactKeys(
    row,
    [
      "schema",
      "bundleId",
      "foundationFreeze",
      "protocolBinding",
      "inputArtifacts",
      "phase8aCounts",
      "phase8bCounts",
      "claimBoundary",
      "producer",
    ],
    label,
  );
  const inputArtifacts = array(row.inputArtifacts, `${label}.inputArtifacts`).map((entry, index) =>
    artifactTuple(entry, `${label}.inputArtifacts[${index}]`),
  );
  if (
    inputArtifacts.length === 0 ||
    inputArtifacts.some((entry, index) => index > 0 && inputArtifacts[index - 1]!.path >= entry.path)
  ) {
    invalid(`${label}.inputArtifacts`, "must be nonempty, sorted, and unique by path");
  }
  return Object.freeze({
    schema: literal(row.schema, [PHASE10_SCOPE_REPORT_SCHEMA], `${label}.schema`),
    bundleId: stableId(row.bundleId, `${label}.bundleId`),
    foundationFreeze: artifactTuple(row.foundationFreeze, `${label}.foundationFreeze`),
    protocolBinding: protocolBinding(row.protocolBinding, `${label}.protocolBinding`),
    inputArtifacts: Object.freeze(inputArtifacts),
    phase8aCounts: corpusCounts(row.phase8aCounts, 18, `${label}.phase8aCounts`),
    phase8bCounts: corpusCounts(row.phase8bCounts, 51, `${label}.phase8bCounts`),
    claimBoundary: claimBoundary(row.claimBoundary, `${label}.claimBoundary`),
    producer: producerProvenance(row.producer, `${label}.producer`),
  });
}
