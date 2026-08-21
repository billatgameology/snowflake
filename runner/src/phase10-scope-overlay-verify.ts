import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { basename, isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  parsePhase10ObligationMatrix,
  type Phase10ObligationMatrix,
} from "./phase10-contracts.ts";
import {
  PHASE10_SCOPE_APPARATUS_COMPATIBILITY,
  PHASE10_SCOPE_ARTIFACT_INDEX_PATH,
  PHASE10_SCOPE_BLOCKER_KINDS,
  PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH,
  PHASE10_SCOPE_CORPORA,
  PHASE10_SCOPE_DECISION_ELIGIBILITY,
  PHASE10_SCOPE_IMMUTABLE_EVIDENCE_ROLES,
  PHASE10_SCOPE_MODEL_CLASS_STATES,
  PHASE10_SCOPE_OVERLAY_ROW_SCHEMA,
  PHASE10_SCOPE_PHASE8A_OVERLAY_PATH,
  PHASE10_SCOPE_PHASE8B_OVERLAY_PATH,
  PHASE10_SCOPE_PHASE_OWNERSHIP,
  PHASE10_SCOPE_PHENOMENON_CLASSES,
  PHASE10_SCOPE_REPORT_PATH,
  PHASE10_SCOPE_VERIFICATION_PATH,
  parsePhase10ScopeClassificationProtocol,
  parsePhase10ScopeOverlayRow,
  parsePhase10ScopeReport,
  type Phase10ScopeArtifactTuple,
  type Phase10ScopeClassification,
  type Phase10ScopeClassificationProtocol,
  type Phase10ScopeCorpus,
  type Phase10ScopeCorpusCounts,
  type Phase10ScopeImmutableEvidenceRole,
  type Phase10ScopeOverlayRow,
  type Phase10ScopeProtocolBinding,
  type Phase10ScopeReport,
} from "./phase10-scope-contracts.ts";
import {
  PHASE10_AS_CHECK_IDS,
  phase10ASCheckCaller,
  type Phase10ASCheckId,
} from "./phase10-scope-checks.ts";
import {
  phase10ASCollapseMultipleBlockers,
  phase10ASDropOneOverlayRow,
  phase10ASRewriteFrozenRole,
  phase10ASUpgradeValidationCredit,
  type Phase10ScopeCandidateBytes,
  type Phase10ScopeMutation,
} from "./phase10-scope-negative-controls.ts";
import { writePhase10ScopeVerificationReceipt } from "./phase10-scope-verification-receipt.ts";

const FOUNDATION_PATH = "research/phase10-foundation-freeze-v1.json";
const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json";
const SCHEMA_REGISTRY_PATH = "research/phase10-artifact-schema-registry-v1.json";
const CONTRACT_PATH = "runner/src/phase10-scope-contracts.ts";
const PHASE8A_FREEZE_PATH = "evidence/phase8-target-book/freeze.json";
const PHASE8A_BOOK_PATH = "research/phase8-target-book.jsonl";
const PHASE8B_BOOK_PATH =
  "evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl";
const CALLABLE_REGISTRY_PATH =
  "research/phase10-execution-v1/packets/a-s/callable-registry.json";
const EVALUATOR_MODULE_PATH = "runner/src/phase10-scope-overlay-verify.ts";
const PRODUCER_ID = "phase10-a-s-producer";
const FROZEN_PRODUCE_COMMAND =
  "node runner/src/phase10-scope-overlay.ts produce --repository-root . --protocol " +
  "research/phase10-scope-classification-protocol-v1.json --out out/phase10-scope-intake-v1-candidate";
const FROZEN_PROTOCOL_IDENTITY = Object.freeze({
  byteLength: 477980,
  sha256: "e5a7196f9a1cefc2bb6548887b76d70d5633d7bb0b43ffd96c94c6ac74a76c39",
});
const FROZEN_CONTRACT_IDENTITY = Object.freeze({
  byteLength: 51753,
  sha256: "599499bdc2794d9ba189879f52c8a21d1fcd93608f971ddb248daa5d2009f69f",
});

const CANDIDATE_FILES = Object.freeze({
  phase8aOverlayBytes: "phase8a-overlay.jsonl",
  phase8bOverlayBytes: "phase8b-overlay.jsonl",
  reportBytes: "scope-report.json",
  artifactIndexBytes: "scope-artifact-index.json",
} satisfies Readonly<Record<keyof Phase10ScopeCandidateBytes, string>>);

const NEGATIVE_CONTROL_OWNER: Readonly<Record<string, Phase10ASCheckId>> = Object.freeze({
  "nc-as-collapse-multiple-blockers": "chk-as-multiblocker-support",
  "nc-as-drop-one-overlay-row": "chk-as-exact-rosters",
  "nc-as-rewrite-frozen-role": "chk-as-immutable-roles",
  "nc-as-upgrade-validation-credit": "chk-as-zero-validation-credit",
} satisfies Readonly<Record<string, Phase10ASCheckId>>);

const NEGATIVE_CONTROL_IDS = Object.freeze(Object.keys(NEGATIVE_CONTROL_OWNER).sort(compareText));

type JsonObject = { readonly [key: string]: StrictJson };

interface SourceRecord {
  readonly id: string;
  readonly row: JsonObject;
  readonly canonicalBytes: Uint8Array;
}

interface ParsedCandidate {
  readonly phase8aRows: readonly Phase10ScopeOverlayRow[];
  readonly phase8bRows: readonly Phase10ScopeOverlayRow[];
  readonly report: Phase10ScopeReport;
  readonly index: JsonObject;
}

interface ScopeVerificationContext {
  readonly repositoryRoot: string;
  readonly protocolPath: string;
  readonly protocolBytes: Uint8Array;
  readonly protocol: Phase10ScopeClassificationProtocol;
  readonly foundationBytes: Uint8Array;
  readonly foundation: JsonObject;
  readonly matrixBytes: Uint8Array;
  readonly matrix: Phase10ObligationMatrix;
  readonly schemaRegistryBytes: Uint8Array;
  readonly phase8aFreezeBytes: Uint8Array;
  readonly phase8aRecords: ReadonlyMap<string, SourceRecord>;
  readonly phase8bRecords: ReadonlyMap<string, SourceRecord>;
  readonly phase8aStatus: SourceRecord;
}

export interface Phase10ScopeEvaluatedArtifact extends Phase10ScopeArtifactTuple {
  readonly outputId: string;
}

export interface Phase10ASCheckDetail {
  readonly errors: readonly string[];
  readonly witnessOutputIds: readonly string[];
}

export interface Phase10ASCheckResult {
  readonly checkId: Phase10ASCheckId;
  readonly verdict: "pass" | "fail";
  readonly detail: Phase10ASCheckDetail;
}

export interface Phase10ScopeSemanticFingerprint {
  readonly projection: StrictJson;
  readonly sha256: string;
}

export interface Phase10ScopeMutationWitness {
  readonly artifactId: string;
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly semanticFingerprint: Phase10ScopeSemanticFingerprint;
}

export interface Phase10ScopeNegativeControlResult {
  readonly negativeControlId: string;
  readonly mutationExecuted: boolean;
  readonly rejected: boolean;
  readonly beforeWitness: Phase10ScopeMutationWitness;
  readonly afterWitness: Phase10ScopeMutationWitness;
  readonly errors: readonly string[];
}

export interface Phase10ScopeVerificationEvaluation {
  readonly verdict: "pass" | "fail";
  readonly obligationMatrix: Phase10ScopeArtifactTuple;
  readonly classificationProtocol: Phase10ScopeArtifactTuple;
  readonly inputArtifacts: readonly Phase10ScopeArtifactTuple[];
  readonly evaluatedArtifacts: readonly Phase10ScopeEvaluatedArtifact[];
  readonly executedCheckIds: readonly Phase10ASCheckId[];
  readonly checkResults: readonly Phase10ASCheckResult[];
  readonly executedNegativeControlIds: readonly string[];
  readonly negativeControlResults: readonly Phase10ScopeNegativeControlResult[];
}

export interface Phase10ScopeVerificationRequest {
  readonly repositoryRoot: string;
  readonly protocolPath: string;
  readonly bundleDirectory: string;
}

interface Phase10ScopeVerificationCliRequest extends Phase10ScopeVerificationRequest {
  readonly receiptPath: string;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function fail(message: string): never {
  throw new Error(`Phase 10 A-S verification refused: ${message}`);
}

function object(value: StrictJson | undefined, label: string): JsonObject {
  if (value === null || value === undefined || Array.isArray(value) || typeof value !== "object") {
    fail(`${label} must be an object`);
  }
  return value as JsonObject;
}

function exactKeys(value: JsonObject, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(compareText);
  const wanted = [...expected].sort(compareText);
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} keys differ`);
  }
}

function sameJson(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function tuple(path: string, bytes: Uint8Array): Phase10ScopeArtifactTuple {
  return Object.freeze({ path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) });
}

function assertFrozenBytes(
  bytes: Uint8Array,
  expected: { readonly byteLength: number; readonly sha256: string },
  label: string,
): void {
  if (bytes.byteLength !== expected.byteLength || sha256Bytes(bytes) !== expected.sha256) {
    fail(`${label} differs from the exact ca40a47 Phase 10 scope freeze bytes`);
  }
}

function assertTuple(
  expected: Phase10ScopeArtifactTuple,
  path: string,
  bytes: Uint8Array,
  label: string,
): void {
  const observed = tuple(path, bytes);
  if (!sameJson(observed, expected)) fail(`${label} byte identity differs`);
}

function safeRepositoryPath(repositoryRoot: string, path: string, label: string): string {
  if (
    isAbsolute(path) ||
    path.includes("\\") ||
    path.startsWith("/") ||
    path.endsWith("/") ||
    path.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    fail(`${label} is not a safe repository-relative path`);
  }
  const root = resolve(repositoryRoot);
  const absolute = resolve(root, path);
  const fromRoot = relative(root, absolute);
  if (
    fromRoot.length === 0 ||
    fromRoot === ".." ||
    fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    isAbsolute(fromRoot)
  ) {
    fail(`${label} escapes the repository root`);
  }
  return absolute;
}

function readRepositoryFile(repositoryRoot: string, path: string, label = path): Uint8Array {
  const absolute = safeRepositoryPath(repositoryRoot, path, label);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} must be a regular non-symlink file`);
  const root = realpathSync(resolve(repositoryRoot));
  const real = realpathSync(absolute);
  const fromRoot = relative(root, real);
  if (
    fromRoot === ".." ||
    fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    isAbsolute(fromRoot)
  ) {
    fail(`${label} resolves outside the repository root`);
  }
  return new Uint8Array(readFileSync(real));
}

function readCandidateFile(bundleDirectory: string, name: string): Uint8Array {
  if (name !== basename(name)) fail(`candidate filename ${name} is unsafe`);
  const root = realpathSync(resolve(bundleDirectory));
  const absolute = resolve(root, name);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`candidate ${name} must be a regular non-symlink file`);
  const real = realpathSync(absolute);
  const fromRoot = relative(root, real);
  if (
    fromRoot === ".." ||
    fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    isAbsolute(fromRoot)
  ) {
    fail(`candidate ${name} resolves outside its bundle`);
  }
  return new Uint8Array(readFileSync(real));
}

function canonicalJsonl(
  bytes: Uint8Array,
  label: string,
): readonly { readonly row: JsonObject; readonly bytes: Uint8Array }[] {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} is not valid UTF-8`);
  }
  if (text.includes("\r") || !text.endsWith("\n") || text === "\n") {
    fail(`${label} must be nonempty LF-terminated JSONL`);
  }
  return text.slice(0, -1).split("\n").map((line, index) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line) as unknown;
    } catch {
      fail(`${label} row ${index + 1} is not JSON`);
    }
    const row = object(strictJsonSnapshot(parsed), `${label} row ${index + 1}`);
    if (canonicalJson(row) !== line) fail(`${label} row ${index + 1} is not canonical JSON`);
    return Object.freeze({ row, bytes: new TextEncoder().encode(`${line}\n`) });
  });
}

function parsePrettyJson(bytes: Uint8Array, label: string): StrictJson {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} is not valid UTF-8`);
  }
  if (text.includes("\r")) fail(`${label} must use LF line endings`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    fail(`${label} is not valid JSON`);
  }
  const snapshot = strictJsonSnapshot(parsed);
  if (text !== `${JSON.stringify(snapshot, null, 2)}\n`) {
    fail(`${label} is not exact two-space JSON with one terminal LF`);
  }
  return snapshot;
}

function parseOverlayRows(bytes: Uint8Array, label: string): readonly Phase10ScopeOverlayRow[] {
  return canonicalJsonl(bytes, label).map(({ row }, index) => {
    try {
      return parsePhase10ScopeOverlayRow(row);
    } catch (error) {
      fail(`${label} row ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}

function parsedCandidate(candidate: Phase10ScopeCandidateBytes): ParsedCandidate {
  const indexValue = parsePrettyJson(candidate.artifactIndexBytes, "scope artifact index");
  return Object.freeze({
    phase8aRows: parseOverlayRows(candidate.phase8aOverlayBytes, "Phase 8A overlay"),
    phase8bRows: parseOverlayRows(candidate.phase8bOverlayBytes, "Phase 8B overlay"),
    report: parsePhase10ScopeReport(parsePrettyJson(candidate.reportBytes, "scope report")),
    index: object(indexValue, "scope artifact index"),
  });
}

function sourceRecords(
  rows: readonly { readonly row: JsonObject; readonly bytes: Uint8Array }[],
  idField: string,
  filter: (row: JsonObject) => boolean,
  label: string,
): ReadonlyMap<string, SourceRecord> {
  const values = new Map<string, SourceRecord>();
  for (const { row, bytes } of rows.filter(({ row }) => filter(row))) {
    const id = row[idField];
    if (typeof id !== "string" || id.length === 0 || values.has(id)) fail(`${label} ID roster differs`);
    values.set(id, Object.freeze({ id, row, canonicalBytes: bytes }));
  }
  return values;
}

function frozenRole(corpus: Phase10ScopeCorpus, row: JsonObject): Phase10ScopeImmutableEvidenceRole {
  if (corpus === "phase8b") {
    if (row.split !== "development" || row.phase9EvidenceRole !== "model-development") {
      fail("Phase 8B source role/split is not development-only");
    }
    return "phase8b-development";
  }
  if (row.role === "input") return "phase8a-historical-input";
  const partition = object(row.partition, "Phase 8A partition");
  if (partition.split === "held-out") return "phase8a-historical-held-out-no-current-gate-effect";
  if (partition.split === "model-development") return "phase8a-historical-model-development";
  if (partition.split === "out-of-model") return "phase8a-historical-out-of-model";
  return "descriptive-only";
}

function sourceJoin(
  classification: Phase10ScopeClassification,
  input: Phase10ScopeArtifactTuple,
  immutableFields: readonly string[],
  source: SourceRecord,
): Phase10ScopeOverlayRow["sourceJoin"] {
  return Object.freeze({
    sourceArtifact: input,
    sourceRecordId: source.id,
    sourceRecordCanonicalSha256: sha256Bytes(source.canonicalBytes),
    frozenRoleFields: Object.freeze([...immutableFields].sort(compareText).map((field) => {
      const value = source.row[field];
      if (value === undefined) fail(`${classification.overlayId} source field ${field} is absent`);
      return Object.freeze({
        field,
        value,
        canonicalSha256: sha256Bytes(canonicalJsonBytes(value)),
      });
    })),
  });
}

function expectedOverlayRow(
  protocol: Phase10ScopeClassificationProtocol,
  binding: Phase10ScopeProtocolBinding,
  classification: Phase10ScopeClassification,
  source: SourceRecord,
): Phase10ScopeOverlayRow {
  const corpus = protocol.inputCorpora.find((row) => row.corpus === classification.corpus);
  if (corpus === undefined) fail(`${classification.overlayId} corpus binding is absent`);
  return Object.freeze({
    schema: PHASE10_SCOPE_OVERLAY_ROW_SCHEMA,
    overlayId: classification.overlayId,
    corpus: classification.corpus,
    sourceJoin: sourceJoin(
      classification,
      corpus.sourceArtifact,
      corpus.immutableSourceFields,
      source,
    ),
    phenomenonClass: classification.phenomenonClass,
    modelClassScope: classification.modelClassScope,
    representabilityBlockers: classification.representabilityBlockers,
    specimenApparatusCompatibility: classification.specimenApparatusCompatibility,
    immutableEvidenceRole: frozenRole(classification.corpus, source.row),
    phaseOwnership: classification.phaseOwnership,
    currentDecisionEligibility: classification.currentDecisionEligibility,
    classificationProtocol: binding,
    classifiedOn: classification.classifiedOn,
  });
}

function sortedStrings(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    fail(`${label} must be a string array`);
  }
  const result = [...value as string[]].sort(compareText);
  if (new Set(result).size !== result.length) fail(`${label} must be unique`);
  return Object.freeze(result);
}

function validateFoundationScope(
  foundation: JsonObject,
  protocol: Phase10ScopeClassificationProtocol,
  phase8aRows: readonly { readonly row: JsonObject; readonly bytes: Uint8Array }[],
  phase8bRows: readonly { readonly row: JsonObject; readonly bytes: Uint8Array }[],
  phase8aRecords: ReadonlyMap<string, SourceRecord>,
  phase8bRecords: ReadonlyMap<string, SourceRecord>,
): SourceRecord {
  const rosters = object(foundation.scopeRosters, "foundation scopeRosters");
  const phase8a = object(rosters.phase8a, "foundation Phase 8A roster");
  const phase8b = object(rosters.phase8b, "foundation Phase 8B roster");
  const statusRule = object(phase8a.bookStatusRow, "foundation Phase 8A status rule");
  const protocol8a = protocol.inputCorpora[0];
  const protocol8b = protocol.inputCorpora[1];
  const expected8aIds = sortedStrings(phase8a.expectedIds, "foundation Phase 8A IDs");
  const expected8bIds = sortedStrings(phase8b.expectedIds, "foundation Phase 8B IDs");
  const observed8aIds = [...phase8aRecords.keys()].sort(compareText);
  const observed8bIds = [...phase8bRecords.keys()].sort(compareText);
  if (!sameJson(observed8aIds, expected8aIds) || !sameJson(observed8bIds, expected8bIds)) {
    fail("frozen source roster differs from the foundation");
  }
  if (
    phase8aRows.length !== 19 ||
    phase8aRecords.size !== 18 ||
    phase8bRows.length !== 51 ||
    phase8bRecords.size !== 51
  ) {
    fail("frozen source corpus cardinality differs");
  }
  const statusRows = phase8aRows
    .map((entry, index) => ({ ...entry, index }))
    .filter(({ row }) => row.recordKind === "book-status");
  if (statusRows.length !== 1 || statusRows[0]?.index !== 18) {
    fail("Phase 8A book-status row is not exactly row 19");
  }
  if (phase8aRows.some(({ row }) => row.recordKind !== "entry" && row.recordKind !== "book-status")) {
    fail("Phase 8A contains an unknown recordKind");
  }
  const statusEntry = statusRows[0] as {
    readonly row: JsonObject;
    readonly bytes: Uint8Array;
    readonly index: number;
  };
  if (
    statusEntry.bytes.byteLength !== statusRule.lfTerminatedByteLength ||
    sha256Bytes(statusEntry.bytes) !== statusRule.lfTerminatedSha256 ||
    statusEntry.row.id !== undefined
  ) {
    fail("Phase 8A book-status row identity differs");
  }
  for (const [binding, roster, ids, rowCount] of [
    [protocol8a, phase8a, observed8aIds, 19],
    [protocol8b, phase8b, observed8bIds, 51],
  ] as const) {
    const foundationImmutableFields = binding.corpus === "phase8a"
      ? sortedStrings(roster.immutableRoleSourceFields, "foundation Phase 8A immutable fields")
      : sortedStrings(
          [
            roster.immutableBindingField,
            ...sortedStrings(
              roster.immutableRoleSourceFields,
              "foundation Phase 8B immutable role fields",
            ),
          ],
          "foundation Phase 8B immutable fields",
        );
    if (
      binding.inputArtifactId !== roster.inputArtifactId ||
      binding.expectedRecordCount !== ids.length ||
      binding.expectedJsonlRowCount !== rowCount ||
      binding.expectedIdsSha256 !== roster.expectedIdsSha256 ||
      binding.expectedIdsSha256 !== sha256Bytes(new TextEncoder().encode(canonicalJson(ids))) ||
      !sameJson(binding.immutableSourceFields, foundationImmutableFields)
    ) {
      fail(`${binding.corpus} protocol/foundation roster binding differs`);
    }
  }
  if (
    protocol8a.terminalStatus.statusRowRequired !== true ||
    protocol8a.terminalStatus.recordKind !== "book-status" ||
    protocol8a.terminalStatus.expectedStatusRowCount !== 1 ||
    protocol8a.terminalStatus.expectedLineNumber !== 19 ||
    protocol8a.terminalStatus.lfTerminatedByteLength !== statusRule.lfTerminatedByteLength ||
    protocol8a.terminalStatus.lfTerminatedSha256 !== statusRule.lfTerminatedSha256 ||
    protocol8a.terminalStatus.overlayRecordFilter !== "recordKind=entry" ||
    protocol8b.terminalStatus.statusRowRequired !== false ||
    protocol8b.terminalStatus.recordKind !== null ||
    protocol8b.terminalStatus.expectedStatusRowCount !== 0 ||
    protocol8b.terminalStatus.expectedLineNumber !== null ||
    protocol8b.terminalStatus.lfTerminatedByteLength !== null ||
    protocol8b.terminalStatus.lfTerminatedSha256 !== null ||
    protocol8b.terminalStatus.overlayRecordFilter !== "all-jsonl-rows"
  ) {
    fail("protocol terminal-status bindings differ from the frozen corpora");
  }
  return Object.freeze({
    id: "phase8a-book-status",
    row: statusEntry.row,
    canonicalBytes: statusEntry.bytes,
  });
}

function captureContext(repositoryRootValue: string, protocolPath: string): ScopeVerificationContext {
  const repositoryRoot = realpathSync(resolve(repositoryRootValue));
  if (protocolPath !== PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH) {
    fail(`protocol path must be ${PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH}`);
  }
  const protocolBytes = readRepositoryFile(repositoryRoot, protocolPath);
  assertFrozenBytes(protocolBytes, FROZEN_PROTOCOL_IDENTITY, "scope classification protocol");
  const protocol = parsePhase10ScopeClassificationProtocol(
    parsePrettyJson(protocolBytes, "scope classification protocol"),
  );
  const contractBytes = readRepositoryFile(repositoryRoot, CONTRACT_PATH, "scope contract implementation");
  assertFrozenBytes(contractBytes, FROZEN_CONTRACT_IDENTITY, "scope contract implementation");
  const foundationBytes = readRepositoryFile(repositoryRoot, FOUNDATION_PATH);
  const foundation = object(
    parsePrettyJson(foundationBytes, "Phase 10 foundation freeze"),
    "Phase 10 foundation freeze",
  );
  const matrixBytes = readRepositoryFile(repositoryRoot, MATRIX_PATH);
  const matrix = parsePhase10ObligationMatrix(
    parsePrettyJson(matrixBytes, "Phase 10 obligation matrix"),
  );
  const schemaRegistryBytes = readRepositoryFile(repositoryRoot, SCHEMA_REGISTRY_PATH);
  parsePrettyJson(schemaRegistryBytes, "Phase 10 artifact-schema registry");
  assertTuple(protocol.foundationFreeze, FOUNDATION_PATH, foundationBytes, "foundation freeze");
  assertTuple(protocol.obligationMatrix, MATRIX_PATH, matrixBytes, "obligation matrix");
  assertTuple(
    protocol.artifactSchemaRegistry,
    SCHEMA_REGISTRY_PATH,
    schemaRegistryBytes,
    "artifact-schema registry",
  );
  assertTuple(
    protocol.rules.contractImplementation,
    CONTRACT_PATH,
    contractBytes,
    "scope contract implementation",
  );
  for (const [label, identity] of [
    ["charter authority", protocol.rules.authority.charterArtifact],
    ["decision authority", protocol.rules.authority.decisionArtifact],
  ] as const) {
    assertTuple(
      identity,
      identity.path,
      readRepositoryFile(repositoryRoot, identity.path, label),
      label,
    );
  }

  const phase8aFreezeBytes = readRepositoryFile(repositoryRoot, PHASE8A_FREEZE_PATH);
  const phase8aBookBytes = readRepositoryFile(repositoryRoot, PHASE8A_BOOK_PATH);
  const phase8bBookBytes = readRepositoryFile(repositoryRoot, PHASE8B_BOOK_PATH);
  assertTuple(protocol.inputCorpora[0].sourceArtifact, PHASE8A_BOOK_PATH, phase8aBookBytes, "Phase 8A book");
  assertTuple(protocol.inputCorpora[1].sourceArtifact, PHASE8B_BOOK_PATH, phase8bBookBytes, "Phase 8B book");
  const phase8aFreeze = object(
    parseCanonicalJson(phase8aFreezeBytes, "Phase 8A freeze"),
    "Phase 8A freeze",
  );
  const frozenTargetBook = object(phase8aFreeze.targetBook, "Phase 8A freeze targetBook");
  if (
    frozenTargetBook.path !== PHASE8A_BOOK_PATH ||
    frozenTargetBook.byteLength !== phase8aBookBytes.byteLength ||
    frozenTargetBook.sha256 !== sha256Bytes(phase8aBookBytes) ||
    frozenTargetBook.entryCount !== 18
  ) {
    fail("Phase 8A freeze does not bind the reopened target book");
  }
  const phase8aJsonl = canonicalJsonl(phase8aBookBytes, "Phase 8A target book");
  const phase8bJsonl = canonicalJsonl(phase8bBookBytes, "Phase 8B successor book");
  const phase8aRecords = sourceRecords(
    phase8aJsonl,
    "id",
    (row) => row.recordKind === "entry",
    "Phase 8A",
  );
  const phase8bRecords = sourceRecords(phase8bJsonl, "selectionId", () => true, "Phase 8B");
  const phase8aStatus = validateFoundationScope(
    foundation,
    protocol,
    phase8aJsonl,
    phase8bJsonl,
    phase8aRecords,
    phase8bRecords,
  );
  const classificationIds = new Map<Phase10ScopeCorpus, string[]>([
    ["phase8a", []],
    ["phase8b", []],
  ]);
  for (const classification of protocol.classifications) {
    classificationIds.get(classification.corpus)?.push(classification.sourceRecordId);
    if (classification.classifiedOn < protocol.createdOn) {
      fail(`${classification.overlayId} predates its classification protocol`);
    }
  }
  if (
    !sameJson(classificationIds.get("phase8a")?.sort(compareText), [...phase8aRecords.keys()].sort(compareText)) ||
    !sameJson(classificationIds.get("phase8b")?.sort(compareText), [...phase8bRecords.keys()].sort(compareText))
  ) {
    fail("classification protocol source roster differs from the frozen books");
  }
  const packet = matrix.packets.find((row) => row.packetId === "a-s");
  if (
    packet === undefined ||
    !sameJson(packet.baseCheckIds, PHASE10_AS_CHECK_IDS) ||
    !sameJson(
      matrix.negativeControls.filter((row) => row.packetId === "a-s").map((row) => row.negativeControlId),
      NEGATIVE_CONTROL_IDS,
    )
  ) {
    fail("A-S matrix check or negative-control roster differs");
  }
  return Object.freeze({
    repositoryRoot,
    protocolPath,
    protocolBytes,
    protocol,
    foundationBytes,
    foundation,
    matrixBytes,
    matrix,
    schemaRegistryBytes,
    phase8aFreezeBytes,
    phase8aRecords,
    phase8bRecords,
    phase8aStatus,
  });
}

function protocolBinding(
  context: ScopeVerificationContext,
  candidate: ParsedCandidate,
): Phase10ScopeProtocolBinding {
  const binding = candidate.report.protocolBinding;
  const expectedTuple = tuple(context.protocolPath, context.protocolBytes);
  if (
    binding.path !== expectedTuple.path ||
    binding.byteLength !== expectedTuple.byteLength ||
    binding.sha256 !== expectedTuple.sha256
  ) {
    fail("scope report protocol binding differs from reopened bytes");
  }
  return binding;
}

function expectedRows(
  context: ScopeVerificationContext,
  binding: Phase10ScopeProtocolBinding,
): ReadonlyMap<string, Phase10ScopeOverlayRow> {
  const result = new Map<string, Phase10ScopeOverlayRow>();
  for (const classification of context.protocol.classifications) {
    const source = (classification.corpus === "phase8a"
      ? context.phase8aRecords
      : context.phase8bRecords).get(classification.sourceRecordId);
    if (source === undefined) fail(`${classification.overlayId} source row is absent`);
    result.set(
      classification.overlayId,
      expectedOverlayRow(context.protocol, binding, classification, source),
    );
  }
  return result;
}

function rowsById(candidate: ParsedCandidate): ReadonlyMap<string, Phase10ScopeOverlayRow> {
  const result = new Map<string, Phase10ScopeOverlayRow>();
  for (const row of [...candidate.phase8aRows, ...candidate.phase8bRows]) {
    if (result.has(row.overlayId)) fail(`duplicate overlay ID ${row.overlayId}`);
    result.set(row.overlayId, row);
  }
  return result;
}

function increment<T extends string>(record: Record<T, number>, key: T): void {
  record[key] += 1;
}

function zeroMap<T extends string>(keys: readonly T[]): Record<T, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;
}

function counts(rows: readonly Phase10ScopeOverlayRow[]): Phase10ScopeCorpusCounts {
  const phenomenonClass = zeroMap(PHASE10_SCOPE_PHENOMENON_CLASSES);
  const modelClassScope = zeroMap(PHASE10_SCOPE_MODEL_CLASS_STATES);
  const representabilityBlockerCardinality = { zero: 0, one: 0, multiple: 0 };
  const representabilityBlockerKindOccurrences = zeroMap(PHASE10_SCOPE_BLOCKER_KINDS);
  const specimenApparatusCompatibility = zeroMap(PHASE10_SCOPE_APPARATUS_COMPATIBILITY);
  const immutableEvidenceRole = zeroMap(PHASE10_SCOPE_IMMUTABLE_EVIDENCE_ROLES);
  const phaseOwnership = zeroMap(PHASE10_SCOPE_PHASE_OWNERSHIP);
  const currentDecisionEligibility = zeroMap(PHASE10_SCOPE_DECISION_ELIGIBILITY);
  for (const row of rows) {
    increment(phenomenonClass, row.phenomenonClass);
    increment(modelClassScope, row.modelClassScope.status);
    increment(
      representabilityBlockerCardinality,
      row.representabilityBlockers.length === 0
        ? "zero"
        : row.representabilityBlockers.length === 1
          ? "one"
          : "multiple",
    );
    for (const blocker of row.representabilityBlockers) {
      increment(representabilityBlockerKindOccurrences, blocker.kind);
    }
    increment(specimenApparatusCompatibility, row.specimenApparatusCompatibility.status);
    increment(immutableEvidenceRole, row.immutableEvidenceRole);
    increment(phaseOwnership, row.phaseOwnership);
    increment(currentDecisionEligibility, row.currentDecisionEligibility.status);
  }
  return Object.freeze({
    totalRows: rows.length,
    phenomenonClass: Object.freeze(phenomenonClass),
    modelClassScope: Object.freeze(modelClassScope),
    representabilityBlockerCardinality: Object.freeze(representabilityBlockerCardinality),
    representabilityBlockerKindOccurrences: Object.freeze(representabilityBlockerKindOccurrences),
    specimenApparatusCompatibility: Object.freeze(specimenApparatusCompatibility),
    immutableEvidenceRole: Object.freeze(immutableEvidenceRole),
    phaseOwnership: Object.freeze(phaseOwnership),
    currentDecisionEligibility: Object.freeze(currentDecisionEligibility),
  });
}

function addError(errors: string[], condition: boolean, message: string): void {
  if (!condition) errors.push(message);
}

function checkResult(
  context: ScopeVerificationContext,
  checkId: Phase10ASCheckId,
  errors: readonly string[],
): Phase10ASCheckResult {
  const matrixCheck = context.matrix.checks.find((entry) => entry.checkId === checkId);
  if (matrixCheck === undefined || matrixCheck.packetId !== "a-s") {
    fail(`${checkId} is absent from the A-S matrix`);
  }
  const normalizedErrors = Object.freeze([...new Set(errors)].sort(compareText));
  const witnessOutputIds = Object.freeze([...matrixCheck.dependsOnOutputIds].sort(compareText));
  return Object.freeze({
    checkId,
    verdict: normalizedErrors.length === 0 ? "pass" : "fail",
    detail: Object.freeze({ errors: normalizedErrors, witnessOutputIds }),
  });
}

function outputBytes(
  candidate: Phase10ScopeCandidateBytes,
): Readonly<Record<string, { readonly fileName: string; readonly bytes: Uint8Array }>> {
  return Object.freeze({
    "out-as-phase8a-overlay": Object.freeze({
      fileName: CANDIDATE_FILES.phase8aOverlayBytes,
      bytes: candidate.phase8aOverlayBytes,
    }),
    "out-as-phase8b-overlay": Object.freeze({
      fileName: CANDIDATE_FILES.phase8bOverlayBytes,
      bytes: candidate.phase8bOverlayBytes,
    }),
    "out-as-report": Object.freeze({
      fileName: CANDIDATE_FILES.reportBytes,
      bytes: candidate.reportBytes,
    }),
  });
}

function artifactIndexErrors(
  parsed: ParsedCandidate,
  candidate: Phase10ScopeCandidateBytes,
): readonly string[] {
  const errors: string[] = [];
  const index = parsed.index;
  const actualKeys = Object.keys(index).sort(compareText);
  addError(
    errors,
    sameJson(actualKeys, ["artifacts", "bundleId", "schema"]),
    "artifact index root fields differ",
  );
  addError(errors, index.schema === "phase10-artifact-index-v1", "artifact index schema differs");
  addError(errors, index.bundleId === "phase10-scope-intake-v1", "artifact index bundle ID differs");
  const artifacts = Array.isArray(index.artifacts) ? index.artifacts : [];
  if (!Array.isArray(index.artifacts)) errors.push("artifact index artifacts is not an array");
  const expected = outputBytes(candidate);
  const expectedIds = Object.keys(expected).sort(compareText);
  const observedIds: string[] = [];
  for (const [entryIndex, value] of artifacts.entries()) {
    if (value === null || Array.isArray(value) || typeof value !== "object") {
      errors.push(`artifact index entry ${entryIndex + 1} is not an object`);
      continue;
    }
    const row = value as JsonObject;
    addError(
      errors,
      sameJson(
        Object.keys(row).sort(compareText),
        ["artifactId", "byteLength", "mediaType", "path", "producedBy", "role", "sha256"],
      ),
      `artifact index entry ${entryIndex + 1} fields differ`,
    );
    const artifactId = typeof row.artifactId === "string" ? row.artifactId : "";
    observedIds.push(artifactId);
    const expectedArtifact = expected[artifactId];
    if (expectedArtifact === undefined) {
      errors.push(`artifact index has unexpected artifact ID ${artifactId || "<non-string>"}`);
      continue;
    }
    const isOverlay = artifactId !== "out-as-report";
    addError(errors, row.path === expectedArtifact.fileName, `${artifactId} bundle-relative path differs`);
    addError(
      errors,
      row.mediaType === (isOverlay ? "application/x-ndjson" : "application/json"),
      `${artifactId} media type differs`,
    );
    addError(
      errors,
      row.role === (isOverlay ? "scope-overlay" : "scope-report"),
      `${artifactId} role differs`,
    );
    addError(errors, row.producedBy === PRODUCER_ID, `${artifactId} producer differs`);
    addError(
      errors,
      row.byteLength === expectedArtifact.bytes.byteLength &&
        row.sha256 === sha256Bytes(expectedArtifact.bytes),
      `${artifactId} byte identity differs`,
    );
  }
  addError(
    errors,
    sameJson(observedIds, expectedIds),
    "artifact index artifact roster is not exact, sorted, and unique",
  );
  return errors;
}

function citedClassificationErrors(
  context: ScopeVerificationContext,
  parsed: ParsedCandidate,
  expected: ReadonlyMap<string, Phase10ScopeOverlayRow>,
): readonly string[] {
  const errors: string[] = [];
  const rows = [...parsed.phase8aRows, ...parsed.phase8bRows];
  const reopened = new Map<string, Phase10ScopeArtifactTuple>();
  const reopenedRecordIds = new Map<string, ReadonlySet<string>>();
  for (const row of rows) {
    const expectedRow = expected.get(row.overlayId);
    if (expectedRow === undefined) continue;
    addError(
      errors,
      row.phenomenonClass === expectedRow.phenomenonClass &&
        sameJson(row.modelClassScope, expectedRow.modelClassScope) &&
        sameJson(row.specimenApparatusCompatibility, expectedRow.specimenApparatusCompatibility),
      `${row.overlayId} cited classification differs from the frozen protocol`,
    );
    const citationGroups = [
      row.modelClassScope.citationRefs,
      row.specimenApparatusCompatibility.citationRefs,
      ...row.representabilityBlockers.map((blocker) => blocker.citationRefs),
    ];
    for (const refs of citationGroups) {
      for (const ref of refs) {
        if (ref.kind === "tracked-record") {
          const source = (row.corpus === "phase8a"
            ? context.phase8aRecords
            : context.phase8bRecords).get(row.sourceJoin.sourceRecordId);
          const directSource =
            ref.recordId === row.sourceJoin.sourceRecordId &&
            ref.artifact !== null &&
            ref.artifact.path === row.sourceJoin.sourceArtifact.path;
          let transitiveMetadata = false;
          if (row.corpus === "phase8b" && source !== undefined) {
            const binding = object(source.row.binding, `${row.overlayId} successor binding`);
            const metadataArtifact = object(
              binding.metadataRecordArtifact,
              `${row.overlayId} metadata artifact binding`,
            );
            transitiveMetadata =
              typeof binding.metadataRecordId === "string" &&
              ref.recordId === binding.metadataRecordId &&
              ref.artifact !== null &&
              ref.artifact.path === metadataArtifact.path &&
              ref.artifact.byteLength === metadataArtifact.byteLength &&
              ref.artifact.sha256 === metadataArtifact.sha256;
          }
          addError(
            errors,
            directSource || transitiveMetadata,
            `${row.overlayId} tracked citation is not directly or transitively bound to its source row`,
          );
        } else if (ref.kind === "charter") {
          addError(
            errors,
            ref.recordId === null && sameJson(ref.artifact, context.protocol.rules.authority.charterArtifact),
            `${row.overlayId} charter citation identity differs`,
          );
        }
        if (ref.artifact !== null && !reopened.has(ref.artifact.path)) {
          try {
            const bytes = readRepositoryFile(
              context.repositoryRoot,
              ref.artifact.path,
              `${row.overlayId} citation ${ref.refId}`,
            );
            const observed = tuple(ref.artifact.path, bytes);
            reopened.set(ref.artifact.path, observed);
            if (ref.kind === "tracked-record" && ref.artifact.path.endsWith(".jsonl")) {
              const recordIds = new Set<string>();
              for (const entry of canonicalJsonl(bytes, `${row.overlayId} citation ${ref.refId}`)) {
                for (const key of ["id", "selectionId"] as const) {
                  const recordId = entry.row[key];
                  if (typeof recordId === "string") recordIds.add(recordId);
                }
              }
              reopenedRecordIds.set(ref.artifact.path, recordIds);
            }
            addError(
              errors,
              sameJson(observed, ref.artifact),
              `${row.overlayId} citation ${ref.refId} byte identity differs`,
            );
          } catch (error) {
            errors.push(
              `${row.overlayId} citation ${ref.refId} cannot be reopened: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        } else if (ref.artifact !== null) {
          addError(
            errors,
            sameJson(reopened.get(ref.artifact.path), ref.artifact),
            `${row.overlayId} citation ${ref.refId} conflicts with another artifact identity`,
          );
        }
        if (ref.kind === "tracked-record" && ref.artifact !== null) {
          addError(
            errors,
            ref.recordId !== null && reopenedRecordIds.get(ref.artifact.path)?.has(ref.recordId) === true,
            `${row.overlayId} citation ${ref.refId} record ID is absent from reopened metadata`,
          );
        }
      }
    }
  }
  return errors;
}

function exactRosterErrors(
  context: ScopeVerificationContext,
  parsed: ParsedCandidate,
): readonly string[] {
  const errors: string[] = [];
  const expectedByCorpus = {
    phase8a: context.protocol.classifications
      .filter((row) => row.corpus === "phase8a")
      .map((row) => Object.freeze({ overlayId: row.overlayId, sourceRecordId: row.sourceRecordId })),
    phase8b: context.protocol.classifications
      .filter((row) => row.corpus === "phase8b")
      .map((row) => Object.freeze({ overlayId: row.overlayId, sourceRecordId: row.sourceRecordId })),
  } as const;
  for (const [corpus, rows, expectedRowsForCorpus, expectedCount] of [
    ["phase8a", parsed.phase8aRows, expectedByCorpus.phase8a, 18],
    ["phase8b", parsed.phase8bRows, expectedByCorpus.phase8b, 51],
  ] as const) {
    const observed = rows.map((row) => ({
      overlayId: row.overlayId,
      sourceRecordId: row.sourceJoin.sourceRecordId,
    }));
    addError(errors, rows.length === expectedCount, `${corpus} overlay count is not ${expectedCount}`);
    addError(errors, rows.every((row) => row.corpus === corpus), `${corpus} overlay contains another corpus`);
    addError(
      errors,
      rows.every((row, index) => index === 0 || rows[index - 1]!.overlayId < row.overlayId),
      `${corpus} overlay IDs are not sorted and unique`,
    );
    addError(errors, sameJson(observed, expectedRowsForCorpus), `${corpus} overlay roster differs`);
  }
  return errors;
}

function frozenJoinErrors(
  parsed: ParsedCandidate,
  expected: ReadonlyMap<string, Phase10ScopeOverlayRow>,
): readonly string[] {
  const errors: string[] = [];
  for (const row of [...parsed.phase8aRows, ...parsed.phase8bRows]) {
    const expectedRow = expected.get(row.overlayId);
    if (expectedRow === undefined) continue;
    addError(
      errors,
      sameJson(row.sourceJoin, expectedRow.sourceJoin),
      `${row.overlayId} frozen source join differs`,
    );
  }
  return errors;
}

function immutableRoleErrors(
  parsed: ParsedCandidate,
  expected: ReadonlyMap<string, Phase10ScopeOverlayRow>,
): readonly string[] {
  const errors: string[] = [];
  const rows = [...parsed.phase8aRows, ...parsed.phase8bRows];
  for (const row of rows) {
    const expectedRole = expected.get(row.overlayId)?.immutableEvidenceRole;
    addError(
      errors,
      expectedRole !== undefined && row.immutableEvidenceRole === expectedRole,
      `${row.overlayId} immutable evidence role differs from frozen source metadata`,
    );
  }
  const heldOutCount = parsed.phase8aRows.filter(
    (row) => row.immutableEvidenceRole === "phase8a-historical-held-out-no-current-gate-effect",
  ).length;
  addError(errors, heldOutCount === 7, "Phase 8A historical held-out role count is not seven");
  addError(
    errors,
    parsed.phase8bRows.every((row) => row.immutableEvidenceRole === "phase8b-development"),
    "Phase 8B does not preserve a zero-held-out development-only roster",
  );
  return errors;
}

function modelClassErrors(
  context: ScopeVerificationContext,
  parsed: ParsedCandidate,
  expected: ReadonlyMap<string, Phase10ScopeOverlayRow>,
): readonly string[] {
  const errors: string[] = [];
  const excluded = new Set<string>(context.protocol.rules.modelClass.excludedPhenomenonClasses);
  const rows = [...parsed.phase8aRows, ...parsed.phase8bRows];
  for (const row of rows) {
    const expectedRow = expected.get(row.overlayId);
    if (expectedRow === undefined) continue;
    addError(
      errors,
      row.phenomenonClass === expectedRow.phenomenonClass &&
        sameJson(row.modelClassScope, expectedRow.modelClassScope) &&
        sameJson(row.currentDecisionEligibility, expectedRow.currentDecisionEligibility),
      `${row.overlayId} model-class classification or decision eligibility differs from the protocol`,
    );
    if (excluded.has(row.phenomenonClass)) {
      addError(errors, row.modelClassScope.status === "out", `${row.overlayId} excluded phenomenon is not out`);
    }
    if (row.phenomenonClass === "mixed-or-uncertain") {
      addError(
        errors,
        row.modelClassScope.status === "mixed" || row.modelClassScope.status === "unresolved",
        `${row.overlayId} mixed/uncertain phenomenon was collapsed to a binary model-class status`,
      );
    }
    if (row.modelClassScope.status === "out") {
      addError(
        errors,
        row.representabilityBlockers.length === 0,
        `${row.overlayId} disguises model-class exclusion as a representation blocker`,
      );
    }
  }
  addError(
    errors,
    rows.some((row) => row.modelClassScope.status === "in" && row.representabilityBlockers.length > 0),
    "no in-scope row preserves a current representation gap",
  );
  addError(
    errors,
    rows.some((row) => row.modelClassScope.status === "mixed") &&
      rows.some((row) => row.modelClassScope.status === "unresolved"),
    "mixed and unresolved model-class states are not both preserved",
  );
  return errors;
}

function multiBlockerErrors(
  parsed: ParsedCandidate,
  expected: ReadonlyMap<string, Phase10ScopeOverlayRow>,
): readonly string[] {
  const errors: string[] = [];
  const rows = [...parsed.phase8aRows, ...parsed.phase8bRows];
  for (const row of rows) {
    const expectedBlockers = expected.get(row.overlayId)?.representabilityBlockers;
    addError(
      errors,
      expectedBlockers !== undefined && sameJson(row.representabilityBlockers, expectedBlockers),
      `${row.overlayId} representability-blocker roster differs`,
    );
    addError(
      errors,
      sameJson(
        row.currentDecisionEligibility.blockingOperandIds,
        row.representabilityBlockers.map((blocker) => blocker.operandId),
      ),
      `${row.overlayId} decision blocker IDs differ from its blocker objects`,
    );
  }
  addError(
    errors,
    rows.some((row) => row.representabilityBlockers.length >= 2),
    "no overlay row preserves multiple simultaneous blockers",
  );
  return errors;
}

function phaseOwnershipErrors(
  parsed: ParsedCandidate,
  expected: ReadonlyMap<string, Phase10ScopeOverlayRow>,
): readonly string[] {
  const errors: string[] = [];
  const rows = [...parsed.phase8aRows, ...parsed.phase8bRows];
  for (const row of rows) {
    addError(
      errors,
      row.phaseOwnership === expected.get(row.overlayId)?.phaseOwnership,
      `${row.overlayId} phase ownership differs from the protocol`,
    );
    if (row.immutableEvidenceRole === "phase8a-historical-held-out-no-current-gate-effect") {
      addError(
        errors,
        row.phaseOwnership === "phase7-held-out-product-gpu-obligation",
        `${row.overlayId} historical held-out row lost Phase 7 ownership`,
      );
    }
  }
  addError(
    errors,
    parsed.phase8aRows.filter(
      (row) => row.phaseOwnership === "phase7-held-out-product-gpu-obligation",
    ).length === 7,
    "Phase 8A does not retain exactly seven Phase 7-owned held-out rows",
  );
  addError(
    errors,
    parsed.phase8bRows.every((row) => row.phaseOwnership === "phase10-development"),
    "Phase 8B development corpus was assigned non-Phase-10 ownership",
  );
  return errors;
}

function gitCommand(repositoryRoot: string, args: readonly string[]): {
  readonly status: number | null;
  readonly stdout: Uint8Array;
  readonly stderr: string;
} {
  const result = spawnSync("git", args, {
    cwd: repositoryRoot,
    encoding: null,
    windowsHide: true,
  });
  return Object.freeze({
    status: result.status,
    stdout: new Uint8Array(result.stdout ?? Buffer.alloc(0)),
    stderr: new TextDecoder().decode(result.stderr ?? Buffer.alloc(0)).trim(),
  });
}

function protocolCommitErrors(
  context: ScopeVerificationContext,
  parsed: ParsedCandidate,
  binding: Phase10ScopeProtocolBinding,
): readonly string[] {
  const errors: string[] = [];
  const rows = [...parsed.phase8aRows, ...parsed.phase8bRows];
  addError(
    errors,
    parsed.report.producer.commit === binding.commit,
    "producer commit differs from report protocol-binding commit",
  );
  addError(errors, parsed.report.producer.producerId === PRODUCER_ID, "producer ID differs");
  addError(
    errors,
    parsed.report.producer.command === FROZEN_PRODUCE_COMMAND,
    "producer command differs from the frozen README produce command",
  );
  addError(
    errors,
    parsed.report.producer.actualConcurrency === 1,
    "producer actual concurrency differs from one",
  );
  for (const row of rows) {
    addError(
      errors,
      sameJson(row.classificationProtocol, binding),
      `${row.overlayId} protocol binding differs from the report`,
    );
    addError(
      errors,
      row.classifiedOn === context.protocol.createdOn,
      `${row.overlayId} classifiedOn differs from protocol creation date`,
    );
  }
  const commitCheck = gitCommand(context.repositoryRoot, ["cat-file", "-e", `${binding.commit}^{commit}`]);
  addError(errors, commitCheck.status === 0, "protocol-binding commit does not resolve as a Git commit");
  if (commitCheck.status === 0) {
    const shown = gitCommand(context.repositoryRoot, ["show", `${binding.commit}:${context.protocolPath}`]);
    addError(
      errors,
      shown.status === 0 && sameBytes(shown.stdout, context.protocolBytes),
      "protocol bytes were not committed at the producer-bound commit",
    );
    const ancestor = gitCommand(context.repositoryRoot, ["merge-base", "--is-ancestor", binding.commit, "HEAD"]);
    addError(errors, ancestor.status === 0, "producer-bound protocol commit is not an ancestor of HEAD");
  }
  return errors;
}

function reportCountErrors(
  context: ScopeVerificationContext,
  parsed: ParsedCandidate,
): readonly string[] {
  const errors: string[] = [];
  addError(errors, sameJson(parsed.report.phase8aCounts, counts(parsed.phase8aRows)), "Phase 8A report counts differ from overlay bytes");
  addError(errors, sameJson(parsed.report.phase8bCounts, counts(parsed.phase8bRows)), "Phase 8B report counts differ from overlay bytes");
  const expectedInputs = [
    tuple(PHASE8A_FREEZE_PATH, context.phase8aFreezeBytes),
    ...context.protocol.inputCorpora.map((corpus) => corpus.sourceArtifact),
  ].sort((left, right) => compareText(left.path, right.path));
  addError(errors, sameJson(parsed.report.inputArtifacts, expectedInputs), "scope report input-artifact roster differs");
  addError(errors, sameJson(parsed.report.foundationFreeze, context.protocol.foundationFreeze), "scope report foundation binding differs");
  addError(errors, parsed.report.producer.producerId === PRODUCER_ID, "scope report producer ID differs");
  return errors;
}

function zeroValidationErrors(
  context: ScopeVerificationContext,
  parsed: ParsedCandidate,
): readonly string[] {
  const errors: string[] = [];
  addError(
    errors,
    sameJson(parsed.report.claimBoundary, context.protocol.rules.claimBoundary),
    "scope report claim boundary differs from the frozen zero-credit contract",
  );
  return errors;
}

function evaluateCheck(
  context: ScopeVerificationContext,
  candidateBytes: Phase10ScopeCandidateBytes,
  parsed: ParsedCandidate,
  expected: ReadonlyMap<string, Phase10ScopeOverlayRow>,
  binding: Phase10ScopeProtocolBinding,
  checkId: Phase10ASCheckId,
): Phase10ASCheckResult {
  let errors: readonly string[];
  switch (checkId) {
    case "chk-as-artifact-index-integrity":
      errors = artifactIndexErrors(parsed, candidateBytes);
      break;
    case "chk-as-cited-classifications":
      errors = citedClassificationErrors(context, parsed, expected);
      break;
    case "chk-as-exact-rosters":
      errors = exactRosterErrors(context, parsed);
      break;
    case "chk-as-frozen-input-joins":
      errors = frozenJoinErrors(parsed, expected);
      break;
    case "chk-as-immutable-roles":
      errors = immutableRoleErrors(parsed, expected);
      break;
    case "chk-as-modelclass-blocker-separation":
      errors = modelClassErrors(context, parsed, expected);
      break;
    case "chk-as-multiblocker-support":
      errors = multiBlockerErrors(parsed, expected);
      break;
    case "chk-as-phase-ownership":
      errors = phaseOwnershipErrors(parsed, expected);
      break;
    case "chk-as-protocol-before-classification":
      errors = protocolCommitErrors(context, parsed, binding);
      break;
    case "chk-as-separate-corpus-totals":
      errors = reportCountErrors(context, parsed);
      break;
    case "chk-as-zero-validation-credit":
      errors = zeroValidationErrors(context, parsed);
      break;
  }
  return checkResult(context, checkId, errors);
}

function evaluateChecks(
  context: ScopeVerificationContext,
  candidateBytes: Phase10ScopeCandidateBytes,
): readonly Phase10ASCheckResult[] {
  const parsed = parsedCandidate(candidateBytes);
  const binding = protocolBinding(context, parsed);
  const expected = expectedRows(context, binding);
  rowsById(parsed);
  return Object.freeze(phase10ASCheckCaller((checkId) =>
    evaluateCheck(context, candidateBytes, parsed, expected, binding, checkId)));
}

function semanticProjection(
  negativeControlId: string,
  candidate: Phase10ScopeCandidateBytes,
): StrictJson {
  if (negativeControlId === "nc-as-upgrade-validation-credit") {
    const report = object(parsePrettyJson(candidate.reportBytes, "scope report control witness"), "scope report control witness");
    const claimBoundary = object(report.claimBoundary, "scope report claim-boundary witness");
    return strictJsonSnapshot({ quantitativeValidationEarned: claimBoundary.quantitativeValidationEarned });
  }
  const rows = [
    ...canonicalJsonl(candidate.phase8aOverlayBytes, "Phase 8A control witness").map((entry) => entry.row),
    ...canonicalJsonl(candidate.phase8bOverlayBytes, "Phase 8B control witness").map((entry) => entry.row),
  ];
  if (negativeControlId === "nc-as-drop-one-overlay-row") {
    return strictJsonSnapshot(rows.map((row) => ({
      overlayId: row.overlayId,
      sourceRecordId: object(row.sourceJoin, "control sourceJoin").sourceRecordId,
    })));
  }
  if (negativeControlId === "nc-as-rewrite-frozen-role") {
    return strictJsonSnapshot(rows.map((row) => ({
      overlayId: row.overlayId,
      immutableEvidenceRole: row.immutableEvidenceRole,
    })));
  }
  if (negativeControlId === "nc-as-collapse-multiple-blockers") {
    return strictJsonSnapshot(rows.map((row) => ({
      overlayId: row.overlayId,
      operandIds: Array.isArray(row.representabilityBlockers)
        ? row.representabilityBlockers.map((entry) => object(entry, "control blocker").operandId)
        : null,
    })));
  }
  fail(`unknown negative control ${negativeControlId}`);
}

function fingerprint(projection: StrictJson): Phase10ScopeSemanticFingerprint {
  return Object.freeze({ projection, sha256: sha256Bytes(canonicalJsonBytes(projection)) });
}

function mutationBytes(
  candidate: Phase10ScopeCandidateBytes,
  artifactId: string,
): { readonly key: keyof Phase10ScopeCandidateBytes; readonly bytes: Uint8Array } {
  switch (artifactId) {
    case "out-as-phase8a-overlay":
      return Object.freeze({ key: "phase8aOverlayBytes", bytes: candidate.phase8aOverlayBytes });
    case "out-as-phase8b-overlay":
      return Object.freeze({ key: "phase8bOverlayBytes", bytes: candidate.phase8bOverlayBytes });
    case "out-as-report":
      return Object.freeze({ key: "reportBytes", bytes: candidate.reportBytes });
    default:
      fail(`negative control names unexpected artifact ${artifactId}`);
  }
}

function mutationWitness(
  artifactId: string,
  path: string,
  bytes: Uint8Array,
  projection: StrictJson,
): Phase10ScopeMutationWitness {
  return Object.freeze({
    artifactId,
    path,
    byteLength: bytes.byteLength,
    sha256: sha256Bytes(bytes),
    semanticFingerprint: fingerprint(projection),
  });
}

function rawZeroValidationOwnerResult(
  context: ScopeVerificationContext,
  candidate: Phase10ScopeCandidateBytes,
): Phase10ASCheckResult {
  const errors: string[] = [];
  try {
    const report = object(parsePrettyJson(candidate.reportBytes, "mutated scope report"), "mutated scope report");
    const claimBoundary = object(report.claimBoundary, "mutated scope report claimBoundary");
    addError(
      errors,
      claimBoundary.quantitativeValidationEarned === false &&
        sameJson(claimBoundary, context.protocol.rules.claimBoundary),
      "scope report claim boundary differs from the frozen zero-credit contract",
    );
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  return checkResult(context, "chk-as-zero-validation-credit", errors);
}

function ownerResultForMutation(
  context: ScopeVerificationContext,
  mutation: Phase10ScopeMutation,
): Phase10ASCheckResult {
  const owner = NEGATIVE_CONTROL_OWNER[mutation.negativeControlId];
  if (owner === undefined) fail(`${mutation.negativeControlId} has no owner check`);
  if (owner === "chk-as-zero-validation-credit") {
    return rawZeroValidationOwnerResult(context, mutation.candidate);
  }
  const results = evaluateChecks(context, mutation.candidate);
  const result = results.find((entry) => entry.checkId === owner);
  if (result === undefined) fail(`${mutation.negativeControlId} owner check was not executed`);
  return result;
}

function executeNegativeControl(
  context: ScopeVerificationContext,
  candidate: Phase10ScopeCandidateBytes,
  negativeControlId: string,
): Phase10ScopeNegativeControlResult {
  const callable = {
    "nc-as-collapse-multiple-blockers": phase10ASCollapseMultipleBlockers,
    "nc-as-drop-one-overlay-row": phase10ASDropOneOverlayRow,
    "nc-as-rewrite-frozen-role": phase10ASRewriteFrozenRole,
    "nc-as-upgrade-validation-credit": phase10ASUpgradeValidationCredit,
  }[negativeControlId];
  if (callable === undefined) fail(`negative control ${negativeControlId} has no callable`);
  const mutation = callable(candidate);
  const errors: string[] = [];
  addError(errors, mutation.negativeControlId === negativeControlId, `${negativeControlId} callable returned another control ID`);
  const targetBefore = mutationBytes(candidate, mutation.artifactId);
  const targetAfter = mutationBytes(mutation.candidate, mutation.artifactId);
  addError(errors, sameBytes(targetAfter.bytes, mutation.mutatedBytes), `${negativeControlId} returned inconsistent mutated bytes`);
  for (const key of Object.keys(candidate) as (keyof Phase10ScopeCandidateBytes)[]) {
    addError(
      errors,
      key === targetBefore.key
        ? !sameBytes(candidate[key], mutation.candidate[key])
        : sameBytes(candidate[key], mutation.candidate[key]),
      `${negativeControlId} did not change exactly its named artifact`,
    );
  }
  const beforeProjection = semanticProjection(negativeControlId, candidate);
  const afterProjection = semanticProjection(negativeControlId, mutation.candidate);
  const beforeWitness = mutationWitness(
    mutation.artifactId,
    mutation.registeredPath,
    targetBefore.bytes,
    beforeProjection,
  );
  const afterWitness = mutationWitness(
    mutation.artifactId,
    `out/phase10-scope-negative-controls/${negativeControlId}/${basename(mutation.registeredPath)}`,
    targetAfter.bytes,
    afterProjection,
  );
  const mutationExecuted =
    errors.length === 0 &&
    beforeWitness.sha256 !== afterWitness.sha256 &&
    beforeWitness.semanticFingerprint.sha256 !== afterWitness.semanticFingerprint.sha256;
  if (!mutationExecuted) errors.push(`${negativeControlId} semantic mutation was not independently observed`);
  let ownerResult: Phase10ASCheckResult | undefined;
  try {
    ownerResult = ownerResultForMutation(context, mutation);
  } catch (error) {
    errors.push(`${negativeControlId} owner-check execution failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  const rejected = ownerResult?.verdict === "fail";
  if (!rejected) errors.push(`${negativeControlId} was not rejected by ${NEGATIVE_CONTROL_OWNER[negativeControlId]}`);
  return Object.freeze({
    negativeControlId,
    mutationExecuted,
    rejected,
    beforeWitness,
    afterWitness,
    errors: Object.freeze([...new Set(errors)].sort(compareText)),
  });
}

function candidateBytes(
  repositoryRootValue: string,
  bundleDirectoryValue: string,
): Phase10ScopeCandidateBytes {
  const repositoryRoot = realpathSync(resolve(repositoryRootValue));
  const bundleDirectory = realpathSync(resolve(bundleDirectoryValue));
  const bundleStat = lstatSync(bundleDirectory);
  const fromRoot = relative(repositoryRoot, bundleDirectory);
  const segments = fromRoot.split(process.platform === "win32" ? "\\" : "/");
  if (
    !bundleStat.isDirectory() ||
    bundleStat.isSymbolicLink() ||
    fromRoot === "" ||
    fromRoot === ".." ||
    fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    isAbsolute(fromRoot) ||
    segments[0] !== "out" ||
    segments.length < 2
  ) {
    fail("candidate bundle must be a non-symlink directory below repository out/");
  }
  return Object.freeze({
    phase8aOverlayBytes: readCandidateFile(bundleDirectory, CANDIDATE_FILES.phase8aOverlayBytes),
    phase8bOverlayBytes: readCandidateFile(bundleDirectory, CANDIDATE_FILES.phase8bOverlayBytes),
    reportBytes: readCandidateFile(bundleDirectory, CANDIDATE_FILES.reportBytes),
    artifactIndexBytes: readCandidateFile(bundleDirectory, CANDIDATE_FILES.artifactIndexBytes),
  });
}

function evaluatedArtifacts(candidate: Phase10ScopeCandidateBytes): readonly Phase10ScopeEvaluatedArtifact[] {
  return Object.freeze([
    Object.freeze({ outputId: "out-as-artifact-index", ...tuple(PHASE10_SCOPE_ARTIFACT_INDEX_PATH, candidate.artifactIndexBytes) }),
    Object.freeze({ outputId: "out-as-phase8a-overlay", ...tuple(PHASE10_SCOPE_PHASE8A_OVERLAY_PATH, candidate.phase8aOverlayBytes) }),
    Object.freeze({ outputId: "out-as-phase8b-overlay", ...tuple(PHASE10_SCOPE_PHASE8B_OVERLAY_PATH, candidate.phase8bOverlayBytes) }),
    Object.freeze({ outputId: "out-as-report", ...tuple(PHASE10_SCOPE_REPORT_PATH, candidate.reportBytes) }),
  ].sort((left, right) => compareText(left.outputId, right.outputId)));
}

/** Re-open frozen inputs and candidate bytes, independently derive all A-S checks and controls. */
export function phase10ScopeOverlayVerify(
  request: Phase10ScopeVerificationRequest,
): Phase10ScopeVerificationEvaluation {
  const context = captureContext(request.repositoryRoot, request.protocolPath);
  const candidate = candidateBytes(context.repositoryRoot, request.bundleDirectory);
  const checkResults = evaluateChecks(context, candidate);
  const negativeControlResults = Object.freeze(NEGATIVE_CONTROL_IDS.map((negativeControlId) =>
    executeNegativeControl(context, candidate, negativeControlId)));
  const verdict = checkResults.every((result) => result.verdict === "pass") &&
    negativeControlResults.every((result) =>
      result.mutationExecuted && result.rejected && result.errors.length === 0)
    ? "pass"
    : "fail";
  return Object.freeze({
    verdict,
    obligationMatrix: tuple(MATRIX_PATH, context.matrixBytes),
    classificationProtocol: tuple(context.protocolPath, context.protocolBytes),
    inputArtifacts: Object.freeze([
      tuple(PHASE8A_FREEZE_PATH, context.phase8aFreezeBytes),
      ...context.protocol.inputCorpora.map((corpus) => corpus.sourceArtifact),
    ].sort((left, right) => compareText(left.path, right.path))),
    evaluatedArtifacts: evaluatedArtifacts(candidate),
    executedCheckIds: PHASE10_AS_CHECK_IDS,
    checkResults,
    executedNegativeControlIds: NEGATIVE_CONTROL_IDS,
    negativeControlResults,
  });
}

function cliArguments(argv: readonly string[]): Phase10ScopeVerificationCliRequest {
  if (argv.length !== 9 || argv[0] !== "verify") {
    fail("usage: verify --repository-root <path> --protocol <path> --bundle <path> --receipt <path>");
  }
  const values = new Map<string, string>();
  for (let index = 1; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === undefined || value === undefined || values.has(flag)) fail("CLI flags are missing or duplicated");
    values.set(flag, value);
  }
  const repositoryRoot = values.get("--repository-root");
  const protocolPath = values.get("--protocol");
  const bundlePath = values.get("--bundle");
  const receiptPath = values.get("--receipt");
  if (
    repositoryRoot === undefined ||
    protocolPath === undefined ||
    bundlePath === undefined ||
    receiptPath === undefined ||
    values.size !== 4
  ) {
    fail("CLI flags differ from --repository-root, --protocol, --bundle, and --receipt");
  }
  if (
    isAbsolute(bundlePath) ||
    bundlePath.includes("\\") ||
    bundlePath.split("/").some((part) => part === "" || part === "." || part === "..") ||
    bundlePath.split("/")[0] !== "out" ||
    bundlePath.split("/").length < 2
  ) {
    fail("bundle must be a safe repository-relative directory below out/");
  }
  if (
    isAbsolute(receiptPath) ||
    receiptPath.includes("\\") ||
    receiptPath.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    fail("receipt must be a safe repository-relative path");
  }
  const bundleDirectory = resolve(repositoryRoot, bundlePath);
  const expectedReceipt = resolve(bundleDirectory, basename(PHASE10_SCOPE_VERIFICATION_PATH));
  if (resolve(repositoryRoot, receiptPath) !== expectedReceipt) {
    fail("receipt must be the registered scope-verification.json inside the candidate bundle");
  }
  return Object.freeze({
    repositoryRoot,
    protocolPath,
    bundleDirectory,
    receiptPath,
  });
}

function runCli(argv: readonly string[]): void {
  const request = cliArguments(argv);
  const startedOn = new Date().toISOString();
  const evaluation = phase10ScopeOverlayVerify(request);
  const endedOn = new Date().toISOString();
  writePhase10ScopeVerificationReceipt({
    repositoryRoot: request.repositoryRoot,
    bundleDirectory: request.bundleDirectory,
    evaluation,
    startedOn,
    endedOn,
  });
  process.stdout.write(canonicalJson({
    packetId: "a-s",
    receiptPath: request.receiptPath,
    verdict: evaluation.verdict,
  }) + "\n");
  if (evaluation.verdict !== "pass") process.exitCode = 1;
}

const executedPath = process.argv[1] === undefined ? null : realpathSync(resolve(process.argv[1]));
if (executedPath !== null && pathToFileURL(executedPath).href === import.meta.url) {
  runCli(process.argv.slice(2));
}
