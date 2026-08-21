// Phase 10 A-S -- immutable-input scope-overlay producer and role-separated publisher.
//
// The producer reads only the committed classification protocol and the two frozen Phase 8
// corpora. It derives source joins and historical roles from those corpus bytes; the protocol is
// not allowed to supply either field. The publisher does not classify or evaluate anything. It
// reopens a passing receipt written by the independent verifier, checks that receipt against the
// candidate bytes, and installs only the registered A-S evidence files.

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  canonicalJson,
  canonicalJsonBytes,
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
  PHASE10_SCOPE_BLOCKER_KINDS,
  PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_SCHEMA,
  PHASE10_SCOPE_DECISION_ELIGIBILITY,
  PHASE10_SCOPE_IMMUTABLE_EVIDENCE_ROLES,
  PHASE10_SCOPE_MODEL_CLASS_STATES,
  PHASE10_SCOPE_OVERLAY_ROW_SCHEMA,
  PHASE10_SCOPE_PHASE_OWNERSHIP,
  PHASE10_SCOPE_PHENOMENON_CLASSES,
  PHASE10_SCOPE_REPORT_SCHEMA as PHASE10_SCOPE_REPORT_CONTRACT_SCHEMA,
  parsePhase10ScopeClassificationProtocol as parseScopeProtocolContract,
  parsePhase10ScopeOverlayRow,
  parsePhase10ScopeReport,
  type Phase10ScopeArtifactTuple,
  type Phase10ScopeClassification,
  type Phase10ScopeClassificationProtocol,
  type Phase10ScopeCorpus,
  type Phase10ScopeImmutableEvidenceRole,
  type Phase10ScopeInputCorpusBinding,
  type Phase10ScopeOverlayRow,
} from "./phase10-scope-contracts.ts";
import {
  publishPhase10StaticPacketReceipts,
  rollbackPhase10StaticPacketReceipts,
  validatePhase10StaticPacketReceiptsForPublication,
  writePhase10StaticPreflightReceipt,
  writePhase10StaticTerminalReceipt,
} from "./phase10-static-packet-receipts.ts";

export const PHASE10_SCOPE_PROTOCOL_PATH =
  "research/phase10-scope-classification-protocol-v1.json" as const;
export const PHASE10_SCOPE_FOUNDATION_PATH =
  "research/phase10-foundation-freeze-v1.json" as const;
export const PHASE10_SCOPE_MATRIX_PATH =
  "research/phase10-obligation-matrix-v1.json" as const;
export const PHASE10_SCOPE_SCHEMA_REGISTRY_PATH =
  "research/phase10-artifact-schema-registry-v1.json" as const;
export const PHASE10_SCOPE_PHASE8A_FREEZE_PATH =
  "evidence/phase8-target-book/freeze.json" as const;
export const PHASE10_SCOPE_PHASE8A_PATH = "research/phase8-target-book.jsonl" as const;
export const PHASE10_SCOPE_PHASE8B_PATH =
  "evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl" as const;
export const PHASE10_SCOPE_EVIDENCE_PATH = "evidence/phase10-scope-intake-v1" as const;
export const PHASE10_SCOPE_BUNDLE_ID = "phase10-scope-intake-v1" as const;
export const PHASE10_SCOPE_PRODUCER_ID = "phase10-a-s-producer" as const;
export const PHASE10_SCOPE_PRODUCER_MODULE = "runner/src/phase10-scope-overlay.ts" as const;
export const PHASE10_SCOPE_CONTRACT_MODULE = "runner/src/phase10-scope-contracts.ts" as const;
export const PHASE10_SCOPE_CHARTER_PATH = "project charter.md" as const;
export const PHASE10_SCOPE_DECISION_PATH =
  "docs/decisions/0052-adopt-phase10-evidence-verification.md" as const;
export const PHASE10_SCOPE_STATIC_ATTEMPT_ID = "s2-static-20260821-v1" as const;
export const PHASE10_SCOPE_PRODUCE_COMMAND =
  "node runner/src/phase10-scope-overlay.ts produce --repository-root . --protocol research/phase10-scope-classification-protocol-v1.json --out out/phase10-scope-intake-v1-candidate" as const;
const PHASE10_SCOPE_FROZEN_PROTOCOL_IDENTITY = Object.freeze({
  byteLength: 477980,
  sha256: "e5a7196f9a1cefc2bb6548887b76d70d5633d7bb0b43ffd96c94c6ac74a76c39",
});
const PHASE10_SCOPE_FROZEN_CONTRACT_IDENTITY = Object.freeze({
  byteLength: 51753,
  sha256: "599499bdc2794d9ba189879f52c8a21d1fcd93608f971ddb248daa5d2009f69f",
});

export const PHASE10_SCOPE_PRODUCER_ARTIFACTS = [
  "phase8a-overlay.jsonl",
  "phase8b-overlay.jsonl",
  "scope-report.json",
  "scope-artifact-index.json",
] as const;

export const PHASE10_SCOPE_VERIFICATION_ARTIFACT = "scope-verification.json" as const;

/**
 * Static wrapper metadata may live beside a candidate while generic packet plumbing runs. The
 * producer never creates or indexes either file, and the A-S evidence publisher never installs
 * them into the scope bundle.
 */
export const PHASE10_SCOPE_STRUCTURAL_COMPANIONS = [
  "preflight.json",
  "terminal-receipt.json",
] as const;

export const PHASE10_SCOPE_PUBLISHED_ARTIFACTS = [
  ...PHASE10_SCOPE_PRODUCER_ARTIFACTS,
  PHASE10_SCOPE_VERIFICATION_ARTIFACT,
] as const;

const PHASE10_SCOPE_SCHEMA = PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_SCHEMA;
const PHASE10_SCOPE_OVERLAY_SCHEMA = PHASE10_SCOPE_OVERLAY_ROW_SCHEMA;
const PHASE10_SCOPE_REPORT_SCHEMA = PHASE10_SCOPE_REPORT_CONTRACT_SCHEMA;
const PHASE10_SCOPE_INDEX_SCHEMA = "phase10-artifact-index-v1" as const;
const PHASE10_SCOPE_VERIFICATION_SCHEMA = "phase10-as-verification-v1" as const;
const PHASE10_PACKET_ID = "a-s" as const;

const PHENOMENON_CLASSES = PHASE10_SCOPE_PHENOMENON_CLASSES;
const MODEL_CLASS_SCOPES = PHASE10_SCOPE_MODEL_CLASS_STATES;
const BLOCKER_KINDS = PHASE10_SCOPE_BLOCKER_KINDS;
const APPARATUS_COMPATIBILITIES = PHASE10_SCOPE_APPARATUS_COMPATIBILITY;
const IMMUTABLE_EVIDENCE_ROLES = PHASE10_SCOPE_IMMUTABLE_EVIDENCE_ROLES;
const PHASE_OWNERSHIPS = PHASE10_SCOPE_PHASE_OWNERSHIP;
const DECISION_ELIGIBILITIES = PHASE10_SCOPE_DECISION_ELIGIBILITY;

type JsonObject = { readonly [key: string]: StrictJson };
type Corpus = Phase10ScopeCorpus;
type PhenomenonClass = (typeof PHENOMENON_CLASSES)[number];
type ModelClassScope = (typeof MODEL_CLASS_SCOPES)[number];
type BlockerKind = (typeof BLOCKER_KINDS)[number];
type ApparatusCompatibility = (typeof APPARATUS_COMPATIBILITIES)[number];
type ImmutableEvidenceRole = Phase10ScopeImmutableEvidenceRole;
type PhaseOwnership = (typeof PHASE_OWNERSHIPS)[number];
type DecisionEligibility = (typeof DECISION_ELIGIBILITIES)[number];

type ArtifactTuple = Phase10ScopeArtifactTuple;

interface ProtocolBinding extends ArtifactTuple {
  readonly commit: string;
}

type InputCorpusBinding = Phase10ScopeInputCorpusBinding;
type ScopeClassification = Phase10ScopeClassification;

export interface Phase10ScopeProducerProvenance {
  readonly commit: string;
  readonly command: string;
  readonly startedOn: string;
  readonly endedOn: string;
  readonly actualConcurrency: 1;
}

export interface Phase10ScopeProducerInputs {
  readonly protocolPath: typeof PHASE10_SCOPE_PROTOCOL_PATH;
  readonly protocolBytes: Uint8Array;
  readonly foundationBytes: Uint8Array;
  readonly matrixBytes: Uint8Array;
  readonly schemaRegistryBytes: Uint8Array;
  readonly contractBytes: Uint8Array;
  readonly charterBytes: Uint8Array;
  readonly decisionBytes: Uint8Array;
  readonly phase8aFreezeBytes: Uint8Array;
  readonly phase8aBytes: Uint8Array;
  readonly phase8bBytes: Uint8Array;
  readonly provenance: Phase10ScopeProducerProvenance;
}

export interface Phase10ScopeBundle {
  readonly artifacts: ReadonlyMap<(typeof PHASE10_SCOPE_PRODUCER_ARTIFACTS)[number], Uint8Array>;
  readonly counts: {
    readonly phase8a: 18;
    readonly phase8b: 51;
  };
}

function invalid(label: string, detail: string): never {
  throw new Error(`${label} ${detail}`);
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    invalid(label, "must be an object");
  }
  return value as Record<string, unknown>;
}

function jsonObject(value: unknown, label: string): JsonObject {
  return object(strictJsonSnapshot(value), label) as JsonObject;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(compareText);
  const wanted = [...expected].sort(compareText);
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    invalid(label, `keys differ: got [${actual.join(", ")}], expected [${wanted.join(", ")}]`);
  }
}

function array(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) invalid(label, "must be an array");
  return value;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    invalid(label, "must be a nonempty string without surrounding whitespace");
  }
  return value;
}

function nullableString(value: unknown, label: string): string | null {
  return value === null ? null : string(value, label);
}

function nonnegativeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    invalid(label, "must be a nonnegative safe integer");
  }
  return value;
}

function literal<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  const result = string(value, label);
  if (!(allowed as readonly string[]).includes(result)) {
    invalid(label, `must be one of ${allowed.join(", ")}`);
  }
  return result as T;
}

function sha256(value: unknown, label: string): string {
  const result = string(value, label);
  if (!/^[0-9a-f]{64}$/u.test(result)) invalid(label, "must be a lowercase SHA-256");
  return result;
}

function commit(value: unknown, label: string): string {
  const result = string(value, label);
  if (!/^[0-9a-f]{40}$/u.test(result)) invalid(label, "must be a lowercase 40-character Git commit");
  return result;
}

function isoDate(value: unknown, label: string): string {
  const result = string(value, label);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(result) || Number.isNaN(Date.parse(`${result}T00:00:00.000Z`))) {
    invalid(label, "must be an ISO date");
  }
  return result;
}

function isoTimestamp(value: unknown, label: string): string {
  const result = string(value, label);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(result) || Number.isNaN(Date.parse(result))) {
    invalid(label, "must be an ISO timestamp");
  }
  return result;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sortedUniqueStrings(
  value: unknown,
  label: string,
  options: { readonly allowEmpty?: boolean } = {},
): readonly string[] {
  const values = array(value, label).map((entry, index) => string(entry, `${label}[${index}]`));
  if (!options.allowEmpty && values.length === 0) invalid(label, "must not be empty");
  const sorted = [...values].sort(compareText);
  if (new Set(values).size !== values.length || values.some((entry, index) => entry !== sorted[index])) {
    invalid(label, "must be sorted and unique");
  }
  return Object.freeze(values);
}

function safeRepositoryPath(value: unknown, label: string): string {
  const result = string(value, label);
  if (
    isAbsolute(result) ||
    result.includes("\\") ||
    result.startsWith("/") ||
    result.endsWith("/") ||
    !/^[A-Za-z0-9][A-Za-z0-9._/ -]*$/u.test(result) ||
    result.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    invalid(label, "must be a safe repository-relative POSIX path");
  }
  return result;
}

function artifactTuple(value: unknown, label: string): ArtifactTuple {
  const row = object(value, label);
  exactKeys(row, ["path", "byteLength", "sha256"], label);
  return Object.freeze({
    path: safeRepositoryPath(row.path, `${label}.path`),
    byteLength: nonnegativeInteger(row.byteLength, `${label}.byteLength`),
    sha256: sha256(row.sha256, `${label}.sha256`),
  });
}

function parseJson(bytes: Uint8Array, label: string): unknown {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    invalid(label, "must be UTF-8");
  }
  if (text.includes("\r") || !text.endsWith("\n")) invalid(label, "must use LF line endings and one terminal LF");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    invalid(label, "must be JSON");
  }
}

function prettyJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

function parsePrettyJson(bytes: Uint8Array, label: string): StrictJson {
  const parsed = strictJsonSnapshot(parseJson(bytes, label));
  const expected = prettyJsonBytes(parsed);
  if (bytes.byteLength !== expected.byteLength || !bytes.every((value, index) => value === expected[index])) {
    invalid(label, "must be exact two-space JSON with one terminal LF");
  }
  return parsed;
}

function parseJsonl(bytes: Uint8Array, label: string): readonly JsonObject[] {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    invalid(label, "must be UTF-8");
  }
  if (text.includes("\r") || !text.endsWith("\n")) invalid(label, "must be LF terminated");
  const lines = text.slice(0, -1).split("\n");
  if (lines.length === 0 || lines.some((line) => line.length === 0)) invalid(label, "must not contain an empty row");
  return Object.freeze(lines.map((line, index) => {
    let value: unknown;
    try {
      value = JSON.parse(line) as unknown;
    } catch {
      invalid(`${label} row ${index + 1}`, "must be JSON");
    }
    const row = jsonObject(value, `${label} row ${index + 1}`);
    if (canonicalJson(row) !== line) invalid(`${label} row ${index + 1}`, "must be canonical JSON");
    return row;
  }));
}

function jsonl(rows: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function pin(path: string, bytes: Uint8Array): ArtifactTuple {
  return Object.freeze({ path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) });
}

function assertTuple(actual: ArtifactTuple, expected: ArtifactTuple, label: string): void {
  if (
    actual.path !== expected.path ||
    actual.byteLength !== expected.byteLength ||
    actual.sha256 !== expected.sha256
  ) {
    invalid(label, "byte identity differs");
  }
}

function tupleFromFoundation(value: unknown, artifactId: string): ArtifactTuple {
  const root = object(value, "Phase 10 foundation");
  const rows = array(root.frozenInputs, "Phase 10 foundation.frozenInputs");
  const matches = rows.filter((entry) => object(entry, "foundation frozen input").artifactId === artifactId);
  if (matches.length !== 1) invalid("Phase 10 foundation", `must contain one ${artifactId} input`);
  const row = object(matches[0], `foundation ${artifactId}`);
  return artifactTuple(
    { path: row.path, byteLength: row.byteLength, sha256: row.sha256 },
    `foundation ${artifactId}`,
  );
}

function strictSourceRoster(
  rows: readonly JsonObject[],
  idField: string,
  expectedIds: readonly string[],
  label: string,
): ReadonlyMap<string, JsonObject> {
  const result = new Map<string, JsonObject>();
  for (const [index, row] of rows.entries()) {
    const id = string(row[idField], `${label} row ${index + 1}.${idField}`);
    if (result.has(id)) invalid(label, `duplicates ${id}`);
    result.set(id, row);
  }
  const actual = [...result.keys()].sort(compareText);
  if (canonicalJson(actual) !== canonicalJson(expectedIds)) invalid(label, "ID roster differs");
  return result;
}

function exactExpectedIds(value: unknown, label: string): readonly string[] {
  return sortedUniqueStrings(value, label);
}

function normalizedUniqueStrings(value: unknown, label: string): readonly string[] {
  const values = array(value, label).map((entry, index) => string(entry, `${label}[${index}]`));
  if (values.length === 0 || new Set(values).size !== values.length) {
    invalid(label, "must be a nonempty unique string array");
  }
  return Object.freeze([...values].sort(compareText));
}

function validatePhase8aStatusRow(
  row: JsonObject,
  foundationScope: Record<string, unknown>,
  lineNumber: number,
): void {
  const expected = object(foundationScope.bookStatusRow, "foundation.scopeRosters.phase8a.bookStatusRow");
  const expectedFields = sortedUniqueStrings(expected.exactFields, "foundation Phase 8A status exactFields");
  exactKeys(row, expectedFields, "Phase 8A book-status row");
  for (const field of ["recordKind", "schema", "entryCount", "inputCount", "targetCount"] as const) {
    if (canonicalJson(row[field]) !== canonicalJson(expected[field])) {
      invalid("Phase 8A book-status row", `${field} differs from foundation`);
    }
  }
  if (Object.hasOwn(row, "id") !== expected.idFieldPresent) {
    invalid("Phase 8A book-status row", "id presence differs from foundation");
  }
  if (lineNumber !== expected.expectedLineNumber) invalid("Phase 8A book-status row", "line number differs");
  const bytes = canonicalJsonBytes(row);
  if (
    bytes.byteLength !== expected.lfTerminatedByteLength ||
    sha256Bytes(bytes) !== expected.lfTerminatedSha256
  ) {
    invalid("Phase 8A book-status row", "canonical byte identity differs");
  }
}

function immutableRoleForPhase8a(row: JsonObject, sourceId: string): ImmutableEvidenceRole {
  const role = string(row.role, `Phase 8A ${sourceId}.role`);
  const partition = object(row.partition, `Phase 8A ${sourceId}.partition`);
  const split = string(partition.split, `Phase 8A ${sourceId}.partition.split`);
  if (role === "input") {
    if (split !== "not-applicable") invalid(`Phase 8A ${sourceId}`, "input split differs");
    return "phase8a-historical-input";
  }
  if (role !== "target") invalid(`Phase 8A ${sourceId}.role`, "is neither input nor target");
  if (split === "held-out") return "phase8a-historical-held-out-no-current-gate-effect";
  if (split === "model-development") return "phase8a-historical-model-development";
  if (split === "out-of-model") return "phase8a-historical-out-of-model";
  invalid(`Phase 8A ${sourceId}.partition.split`, "is not a frozen target split");
}

function immutableRoleForPhase8b(row: JsonObject, sourceId: string): ImmutableEvidenceRole {
  if (row.split !== "development" || row.phase9EvidenceRole !== "model-development") {
    invalid(`Phase 8B ${sourceId}`, "does not retain the frozen development role");
  }
  if (!Object.hasOwn(row, "binding")) invalid(`Phase 8B ${sourceId}`, "lacks binding");
  return "phase8b-development";
}

function frozenRoleFields(row: JsonObject, fields: readonly string[], label: string): readonly JsonObject[] {
  return Object.freeze(fields.map((field) => {
    if (!Object.hasOwn(row, field)) invalid(label, `lacks immutable field ${field}`);
    const value = strictJsonSnapshot(row[field]);
    return Object.freeze({
      field,
      value,
      canonicalSha256: sha256Bytes(canonicalJsonBytes(value)),
    });
  }));
}

function sourceJoin(
  sourceArtifact: ArtifactTuple,
  sourceRecordId: string,
  row: JsonObject,
  immutableFields: readonly string[],
): JsonObject {
  return jsonObject(
    {
      sourceArtifact,
      sourceRecordId,
      sourceRecordCanonicalSha256: sha256Bytes(canonicalJsonBytes(row)),
      frozenRoleFields: frozenRoleFields(row, immutableFields, `source ${sourceRecordId}`),
    },
    `source join ${sourceRecordId}`,
  );
}

function emptyCountMap<T extends string>(values: readonly T[]): Record<T, number> {
  return Object.fromEntries(values.map((value) => [value, 0])) as Record<T, number>;
}

function corpusCounts(rows: readonly Phase10ScopeOverlayRow[], expected: 18 | 51): JsonObject {
  if (rows.length !== expected) invalid("scope overlay", `must contain ${expected} rows`);
  const phenomenonClass = emptyCountMap(PHENOMENON_CLASSES);
  const modelClassScope = emptyCountMap(MODEL_CLASS_SCOPES);
  const representabilityBlockerKindOccurrences = emptyCountMap(BLOCKER_KINDS);
  const specimenApparatusCompatibility = emptyCountMap(APPARATUS_COMPATIBILITIES);
  const immutableEvidenceRole = emptyCountMap(IMMUTABLE_EVIDENCE_ROLES);
  const phaseOwnership = emptyCountMap(PHASE_OWNERSHIPS);
  const currentDecisionEligibility = emptyCountMap(DECISION_ELIGIBILITIES);
  const representabilityBlockerCardinality = { zero: 0, one: 0, multiple: 0 };
  for (const [index, row] of rows.entries()) {
    phenomenonClass[row.phenomenonClass]++;
    modelClassScope[row.modelClassScope.status]++;
    const rowBlockers = row.representabilityBlockers;
    representabilityBlockerCardinality[rowBlockers.length === 0 ? "zero" : rowBlockers.length === 1 ? "one" : "multiple"]++;
    for (const parsed of rowBlockers) {
      representabilityBlockerKindOccurrences[parsed.kind]++;
    }
    specimenApparatusCompatibility[row.specimenApparatusCompatibility.status]++;
    immutableEvidenceRole[row.immutableEvidenceRole]++;
    phaseOwnership[row.phaseOwnership]++;
    currentDecisionEligibility[row.currentDecisionEligibility.status]++;
  }
  return Object.freeze({
    totalRows: expected,
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

function parseFoundation(bytes: Uint8Array): Record<string, unknown> {
  const root = object(strictJsonSnapshot(parseJson(bytes, "Phase 10 foundation")), "Phase 10 foundation");
  if (root.schema !== "phase10-foundation-freeze-v1") invalid("Phase 10 foundation", "schema differs");
  return root;
}

function assertFrozenBytes(
  bytes: Uint8Array,
  expected: { readonly byteLength: number; readonly sha256: string },
  label: string,
): void {
  if (bytes.byteLength !== expected.byteLength || sha256Bytes(bytes) !== expected.sha256) {
    invalid(label, "differs from the exact ca40a47 Phase 10 scope freeze bytes");
  }
}

function validateInputs(inputs: Phase10ScopeProducerInputs): {
  readonly protocol: Phase10ScopeClassificationProtocol;
  readonly matrix: Phase10ObligationMatrix;
  readonly foundation: Record<string, unknown>;
  readonly phase8a: ReadonlyMap<string, JsonObject>;
  readonly phase8b: ReadonlyMap<string, JsonObject>;
  readonly inputArtifacts: readonly ArtifactTuple[];
} {
  if (inputs.protocolPath !== PHASE10_SCOPE_PROTOCOL_PATH) invalid("scope protocol path", "differs");
  assertFrozenBytes(inputs.protocolBytes, PHASE10_SCOPE_FROZEN_PROTOCOL_IDENTITY, "scope protocol");
  assertFrozenBytes(
    inputs.contractBytes,
    PHASE10_SCOPE_FROZEN_CONTRACT_IDENTITY,
    "scope contract implementation",
  );
  const protocol = parseScopeProtocolContract(parseJson(inputs.protocolBytes, "scope protocol"));
  const foundation = parseFoundation(inputs.foundationBytes);
  const matrix = parsePhase10ObligationMatrix(parseJson(inputs.matrixBytes, "obligation matrix"));
  const registry = object(parseJson(inputs.schemaRegistryBytes, "artifact-schema registry"), "artifact-schema registry");
  if (registry.schema !== "phase10-artifact-schema-registry-v1") invalid("artifact-schema registry", "schema differs");
  assertTuple(pin(PHASE10_SCOPE_FOUNDATION_PATH, inputs.foundationBytes), protocol.foundationFreeze, "protocol foundation binding");
  assertTuple(pin(PHASE10_SCOPE_MATRIX_PATH, inputs.matrixBytes), protocol.obligationMatrix, "protocol matrix binding");
  assertTuple(
    pin(PHASE10_SCOPE_SCHEMA_REGISTRY_PATH, inputs.schemaRegistryBytes),
    protocol.artifactSchemaRegistry,
    "protocol schema-registry binding",
  );
  assertTuple(
    pin(PHASE10_SCOPE_CONTRACT_MODULE, inputs.contractBytes),
    protocol.rules.contractImplementation,
    "protocol contract-implementation binding",
  );
  assertTuple(
    pin(PHASE10_SCOPE_CHARTER_PATH, inputs.charterBytes),
    protocol.rules.authority.charterArtifact,
    "protocol charter binding",
  );
  assertTuple(
    pin(PHASE10_SCOPE_DECISION_PATH, inputs.decisionBytes),
    protocol.rules.authority.decisionArtifact,
    "protocol decision binding",
  );
  if (matrix.matrixId !== "phase10-selected-package-obligations-v1") invalid("obligation matrix", "matrixId differs");
  const packet = matrix.packets.filter((entry) => entry.packetId === PHASE10_PACKET_ID);
  if (packet.length !== 1 || packet[0]?.launchClass !== "static-contract") {
    invalid("obligation matrix", "must contain one static A-S packet");
  }

  const phase8aFreezePin = tupleFromFoundation(
    foundation,
    "P10-IN-PHASE8A-FREEZE",
  );
  const phase8aPin = tupleFromFoundation(foundation, "P10-IN-PHASE8A-TARGET-BOOK");
  const phase8bPin = tupleFromFoundation(foundation, "P10-IN-PHASE8B-SUCCESSOR");
  assertTuple(pin(PHASE10_SCOPE_PHASE8A_FREEZE_PATH, inputs.phase8aFreezeBytes), phase8aFreezePin, "Phase 8A freeze");
  assertTuple(pin(PHASE10_SCOPE_PHASE8A_PATH, inputs.phase8aBytes), phase8aPin, "Phase 8A target book");
  assertTuple(pin(PHASE10_SCOPE_PHASE8B_PATH, inputs.phase8bBytes), phase8bPin, "Phase 8B successor");

  const freeze = object(parseJson(inputs.phase8aFreezeBytes, "Phase 8A freeze"), "Phase 8A freeze");
  const freezeTarget = object(freeze.targetBook, "Phase 8A freeze.targetBook");
  assertTuple(
    artifactTuple(
      { path: freezeTarget.path, byteLength: freezeTarget.byteLength, sha256: freezeTarget.sha256 },
      "Phase 8A freeze.targetBook",
    ),
    phase8aPin,
    "Phase 8A freeze target-book binding",
  );

  const scopeRosters = object(foundation.scopeRosters, "foundation.scopeRosters");
  const phase8aRoster = object(scopeRosters.phase8a, "foundation.scopeRosters.phase8a");
  const phase8bRoster = object(scopeRosters.phase8b, "foundation.scopeRosters.phase8b");
  const expected8a = exactExpectedIds(phase8aRoster.expectedIds, "foundation Phase 8A expected IDs");
  const expected8b = exactExpectedIds(phase8bRoster.expectedIds, "foundation Phase 8B expected IDs");

  const raw8a = parseJsonl(inputs.phase8aBytes, "Phase 8A target book");
  if (raw8a.length !== phase8aRoster.expectedJsonlRowCount) invalid("Phase 8A target book", "row count differs");
  const entryRows: JsonObject[] = [];
  const statusRows: { readonly row: JsonObject; readonly lineNumber: number }[] = [];
  raw8a.forEach((row, index) => {
    if (row.recordKind === "entry") entryRows.push(row);
    else if (row.recordKind === "book-status") statusRows.push({ row, lineNumber: index + 1 });
    else invalid(`Phase 8A target-book row ${index + 1}`, "has unknown recordKind");
  });
  if (entryRows.length !== 18 || statusRows.length !== 1) invalid("Phase 8A target book", "must have 18 entries and one status row");
  validatePhase8aStatusRow(statusRows[0]!.row, phase8aRoster, statusRows[0]!.lineNumber);
  const phase8a = strictSourceRoster(entryRows, "id", expected8a, "Phase 8A target book");
  const raw8b = parseJsonl(inputs.phase8bBytes, "Phase 8B successor");
  if (raw8b.length !== 51) invalid("Phase 8B successor", "row count differs");
  const phase8b = strictSourceRoster(raw8b, "selectionId", expected8b, "Phase 8B successor");

  for (const [roster, ids, label] of [
    [phase8aRoster, expected8a, "Phase 8A"],
    [phase8bRoster, expected8b, "Phase 8B"],
  ] as const) {
    const digest = sha256Bytes(new TextEncoder().encode(JSON.stringify(ids)));
    if (digest !== roster.expectedIdsSha256) invalid(`${label} roster`, "ID digest differs");
  }

  const [protocol8a, protocol8b] = protocol.inputCorpora;
  if (protocol8a === undefined || protocol8b === undefined) invalid("scope protocol", "input corpora missing");
  const expectedCorpusBindings = [
    {
      protocol: protocol8a,
      artifactId: phase8aRoster.inputArtifactId,
      source: phase8aPin,
      idField: string(phase8aRoster.recordIdField, "foundation Phase 8A recordIdField"),
      count: 18,
      jsonlCount: 19,
      idDigest: phase8aRoster.expectedIdsSha256,
      immutableFields: normalizedUniqueStrings(
        phase8aRoster.immutableRoleSourceFields,
        "foundation Phase 8A immutable fields",
      ),
      status: {
        statusRowRequired: true,
        recordKind: "book-status",
        expectedStatusRowCount: 1,
        expectedLineNumber: nonnegativeInteger(
          object(phase8aRoster.bookStatusRow, "foundation Phase 8A bookStatusRow").expectedLineNumber,
          "foundation Phase 8A status line",
        ),
        lfTerminatedByteLength: nonnegativeInteger(
          object(phase8aRoster.bookStatusRow, "foundation Phase 8A bookStatusRow").lfTerminatedByteLength,
          "foundation Phase 8A status byte length",
        ),
        lfTerminatedSha256: string(
          object(phase8aRoster.bookStatusRow, "foundation Phase 8A bookStatusRow").lfTerminatedSha256,
          "foundation Phase 8A status SHA-256",
        ),
        overlayRecordFilter: "recordKind=entry",
      },
    },
    {
      protocol: protocol8b,
      artifactId: phase8bRoster.inputArtifactId,
      source: phase8bPin,
      idField: string(phase8bRoster.recordIdField, "foundation Phase 8B recordIdField"),
      count: 51,
      jsonlCount: 51,
      idDigest: phase8bRoster.expectedIdsSha256,
      immutableFields: normalizedUniqueStrings(
        [
          ...array(phase8bRoster.immutableRoleSourceFields, "foundation Phase 8B immutable fields"),
          string(phase8bRoster.immutableBindingField, "foundation Phase 8B immutable binding field"),
        ],
        "foundation Phase 8B immutable fields",
      ),
      status: {
        statusRowRequired: false,
        recordKind: null,
        expectedStatusRowCount: 0,
        expectedLineNumber: null,
        lfTerminatedByteLength: null,
        lfTerminatedSha256: null,
        overlayRecordFilter: "all-jsonl-rows",
      },
    },
  ] as const;
  for (const expected of expectedCorpusBindings) {
    const row = expected.protocol;
    if (
      row.inputArtifactId !== expected.artifactId ||
      row.recordIdField !== expected.idField ||
      row.expectedRecordCount !== expected.count ||
      row.expectedJsonlRowCount !== expected.jsonlCount ||
      row.expectedIdsSha256 !== expected.idDigest ||
      canonicalJson(row.immutableSourceFields) !== canonicalJson(expected.immutableFields) ||
      canonicalJson(row.terminalStatus) !== canonicalJson(expected.status)
    ) {
      invalid(`protocol ${row.corpus} corpus binding`, "differs from foundation roster");
    }
    assertTuple(row.sourceArtifact, expected.source, `protocol ${row.corpus} source artifact`);
  }

  const classifications8a = protocol.classifications.filter((entry) => entry.corpus === "phase8a");
  const classifications8b = protocol.classifications.filter((entry) => entry.corpus === "phase8b");
  const joins8a = classifications8a.map((entry) => entry.sourceRecordId).sort(compareText);
  const joins8b = classifications8b.map((entry) => entry.sourceRecordId).sort(compareText);
  if (canonicalJson(joins8a) !== canonicalJson(expected8a) || canonicalJson(joins8b) !== canonicalJson(expected8b)) {
    invalid("protocol classifications", "do not cover the exact separate 18/51 rosters");
  }
  if (protocol.classifications.length !== 69) invalid("protocol classifications", "must contain 69 rows");

  return {
    protocol,
    matrix,
    foundation,
    phase8a,
    phase8b,
    inputArtifacts: Object.freeze([phase8aFreezePin, phase8aPin, phase8bPin].sort((left, right) => compareText(left.path, right.path))),
  };
}

function protocolBinding(inputs: Phase10ScopeProducerInputs): ProtocolBinding {
  return Object.freeze({
    ...pin(inputs.protocolPath, inputs.protocolBytes),
    commit: commit(inputs.provenance.commit, "producer provenance commit"),
  });
}

function artifactIndexEntry(
  artifactId: string,
  path: string,
  mediaType: string,
  bytes: Uint8Array,
  role: string,
): JsonObject {
  return Object.freeze({
    artifactId,
    path,
    mediaType,
    byteLength: bytes.byteLength,
    sha256: sha256Bytes(bytes),
    role,
    producedBy: PHASE10_SCOPE_PRODUCER_ID,
  });
}

/** Derive the four producer-owned bytes. This function performs no filesystem writes. */
export function producePhase10ScopeArtifacts(inputs: Phase10ScopeProducerInputs): Phase10ScopeBundle {
  const validated = validateInputs(inputs);
  const binding = protocolBinding(inputs);
  const provenance = inputs.provenance;
  isoTimestamp(provenance.startedOn, "producer provenance startedOn");
  isoTimestamp(provenance.endedOn, "producer provenance endedOn");
  if (Date.parse(provenance.endedOn) < Date.parse(provenance.startedOn)) {
    invalid("producer provenance", "endedOn precedes startedOn");
  }
  if (provenance.actualConcurrency !== 1) invalid("producer provenance", "actualConcurrency must be one");
  if (string(provenance.command, "producer provenance command") !== PHASE10_SCOPE_PRODUCE_COMMAND) {
    invalid("producer provenance command", "differs from the frozen README produce command");
  }

  const overlays: Record<Corpus, Phase10ScopeOverlayRow[]> = { phase8a: [], phase8b: [] };
  const corpusBindings = new Map(validated.protocol.inputCorpora.map((entry) => [entry.corpus, entry]));
  for (const classificationRow of validated.protocol.classifications) {
    const sourceRows = classificationRow.corpus === "phase8a" ? validated.phase8a : validated.phase8b;
    const source = sourceRows.get(classificationRow.sourceRecordId);
    if (source === undefined) invalid("scope classification", `cannot join ${classificationRow.sourceRecordId}`);
    const corpus = corpusBindings.get(classificationRow.corpus);
    if (corpus === undefined) invalid("scope classification", `lacks ${classificationRow.corpus} binding`);
    const immutableEvidenceRole = classificationRow.corpus === "phase8a"
      ? immutableRoleForPhase8a(source, classificationRow.sourceRecordId)
      : immutableRoleForPhase8b(source, classificationRow.sourceRecordId);
    const row = parsePhase10ScopeOverlayRow({
      schema: PHASE10_SCOPE_OVERLAY_SCHEMA,
      overlayId: classificationRow.overlayId,
      corpus: classificationRow.corpus,
      sourceJoin: sourceJoin(
        corpus.sourceArtifact,
        classificationRow.sourceRecordId,
        source,
        corpus.immutableSourceFields,
      ),
      phenomenonClass: classificationRow.phenomenonClass,
      modelClassScope: classificationRow.modelClassScope,
      representabilityBlockers: classificationRow.representabilityBlockers,
      specimenApparatusCompatibility: classificationRow.specimenApparatusCompatibility,
      immutableEvidenceRole,
      phaseOwnership: classificationRow.phaseOwnership,
      currentDecisionEligibility: classificationRow.currentDecisionEligibility,
      classificationProtocol: binding,
      classifiedOn: classificationRow.classifiedOn,
    });
    overlays[classificationRow.corpus].push(row);
  }
  overlays.phase8a.sort((left, right) => compareText(String(left.overlayId), String(right.overlayId)));
  overlays.phase8b.sort((left, right) => compareText(String(left.overlayId), String(right.overlayId)));
  const phase8aBytes = jsonl(overlays.phase8a);
  const phase8bBytes = jsonl(overlays.phase8b);
  const report = parsePhase10ScopeReport({
    schema: PHASE10_SCOPE_REPORT_SCHEMA,
    bundleId: PHASE10_SCOPE_BUNDLE_ID,
    foundationFreeze: validated.protocol.foundationFreeze,
    protocolBinding: binding,
    inputArtifacts: validated.inputArtifacts,
    phase8aCounts: corpusCounts(overlays.phase8a, 18),
    phase8bCounts: corpusCounts(overlays.phase8b, 51),
    claimBoundary: validated.protocol.rules.claimBoundary,
    producer: {
      producerId: PHASE10_SCOPE_PRODUCER_ID,
      commit: provenance.commit,
      command: provenance.command,
      startedOn: provenance.startedOn,
      endedOn: provenance.endedOn,
      actualConcurrency: 1,
    },
  });
  const reportBytes = prettyJsonBytes(report);
  const indexEntries = [
    artifactIndexEntry(
      "out-as-phase8a-overlay",
      "phase8a-overlay.jsonl",
      "application/x-ndjson",
      phase8aBytes,
      "scope-overlay",
    ),
    artifactIndexEntry(
      "out-as-phase8b-overlay",
      "phase8b-overlay.jsonl",
      "application/x-ndjson",
      phase8bBytes,
      "scope-overlay",
    ),
    artifactIndexEntry(
      "out-as-report",
      "scope-report.json",
      "application/json",
      reportBytes,
      "scope-report",
    ),
  ].sort((left, right) => compareText(String(left.artifactId), String(right.artifactId)));
  const indexBytes = prettyJsonBytes({
    schema: PHASE10_SCOPE_INDEX_SCHEMA,
    bundleId: PHASE10_SCOPE_BUNDLE_ID,
    artifacts: indexEntries,
  });
  const artifacts = new Map<(typeof PHASE10_SCOPE_PRODUCER_ARTIFACTS)[number], Uint8Array>([
      ["phase8a-overlay.jsonl", phase8aBytes],
      ["phase8b-overlay.jsonl", phase8bBytes],
      ["scope-report.json", reportBytes],
      ["scope-artifact-index.json", indexBytes],
    ]);
  return Object.freeze({
    artifacts,
    counts: Object.freeze({ phase8a: 18 as const, phase8b: 51 as const }),
  });
}

function pathIsWithin(parent: string, candidate: string): boolean {
  const displacement = relative(parent, candidate);
  return displacement !== "" && displacement !== ".." && !displacement.startsWith(`..${sep}`) && !isAbsolute(displacement);
}

function resolveInside(repositoryRoot: string, repositoryRelativePath: string, label: string): string {
  const safe = safeRepositoryPath(repositoryRelativePath, label);
  const result = resolve(repositoryRoot, safe);
  if (!pathIsWithin(resolve(repositoryRoot), result)) invalid(label, "leaves the repository");
  return result;
}

function regularBytes(path: string, label: string): Uint8Array {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) invalid(label, "must be a regular non-symlink file");
  return new Uint8Array(readFileSync(path));
}

function exactFileNames(actual: readonly string[], expected: readonly string[], label: string): void {
  const left = [...actual].sort(compareText);
  const right = [...expected].sort(compareText);
  if (canonicalJson(left) !== canonicalJson(right)) invalid(label, "file set differs");
}

function removeStaging(parent: string, staging: string): void {
  const resolvedParent = resolve(parent);
  const resolvedStaging = resolve(staging);
  if (!pathIsWithin(resolvedParent, resolvedStaging) || basename(resolvedStaging).startsWith(".") === false) {
    invalid("staging cleanup", "target is outside the intended parent");
  }
  rmSync(resolvedStaging, { recursive: true, force: true });
}

function assertSafeExistingParent(repositoryRoot: string, path: string, label: string): void {
  let current = dirname(path);
  while (!existsSync(current)) {
    const next = dirname(current);
    if (next === current) invalid(label, "has no existing repository parent");
    current = next;
  }
  const stat = lstatSync(current);
  if (!stat.isDirectory() || stat.isSymbolicLink()) invalid(label, "existing parent must be a non-symlink directory");
  const physicalRoot = realpathSync.native(repositoryRoot);
  const physicalParent = realpathSync.native(current);
  if (physicalParent !== physicalRoot && !pathIsWithin(physicalRoot, physicalParent)) {
    invalid(label, "existing parent resolves outside the repository");
  }
}

/**
 * Write producer artifacts into either a new candidate or a candidate bracketed by preflight.
 * A pre-existing candidate may contain only the generic preflight receipt.
 */
export function writePhase10ScopeCandidate(
  repositoryRoot: string,
  candidateRelativePath: string,
  bundle: Phase10ScopeBundle,
): void {
  if (!candidateRelativePath.startsWith("out/")) invalid("scope candidate path", "must be below out/");
  const root = resolve(repositoryRoot);
  const candidate = resolveInside(root, candidateRelativePath, "scope candidate path");
  assertSafeExistingParent(root, candidate, "scope candidate");
  exactFileNames([...bundle.artifacts.keys()], PHASE10_SCOPE_PRODUCER_ARTIFACTS, "scope producer bundle");
  const bracketed = existsSync(candidate);
  if (bracketed) {
    const stat = lstatSync(candidate);
    if (!stat.isDirectory() || stat.isSymbolicLink()) invalid("scope candidate", "must be a non-symlink directory");
    exactFileNames(readdirSync(candidate), ["preflight.json"], "preflight-bracketed scope candidate");
    regularBytes(join(candidate, "preflight.json"), "scope static preflight receipt");
  }
  const parent = dirname(candidate);
  mkdirSync(parent, { recursive: true });
  const staging = join(parent, `.${basename(candidate)}.staging-${randomUUID()}`);
  if (!pathIsWithin(parent, staging)) invalid("scope candidate staging", "leaves candidate parent");
  mkdirSync(staging);
  try {
    for (const name of PHASE10_SCOPE_PRODUCER_ARTIFACTS) {
      const bytes = bundle.artifacts.get(name);
      if (bytes === undefined) invalid("scope producer bundle", `lacks ${name}`);
      writeFileSync(join(staging, name), bytes, { flag: "wx" });
      const reopened = regularBytes(join(staging, name), `staged ${name}`);
      if (reopened.byteLength !== bytes.byteLength || sha256Bytes(reopened) !== sha256Bytes(bytes)) {
        invalid(`staged ${name}`, "bytes differ after write");
      }
    }
    if (bracketed) {
      for (const name of PHASE10_SCOPE_PRODUCER_ARTIFACTS) {
        renameSync(join(staging, name), join(candidate, name));
      }
      removeStaging(parent, staging);
    } else {
      renameSync(staging, candidate);
    }
  } catch (error) {
    if (existsSync(staging)) removeStaging(parent, staging);
    throw error;
  }
}

function gitText(repositoryRoot: string, args: readonly string[], label: string): string {
  try {
    return execFileSync("git", args, {
      cwd: repositoryRoot,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    }).trim();
  } catch {
    invalid(label, "Git query failed");
  }
}

function assertCommittedFile(repositoryRoot: string, path: string, workingBytes: Uint8Array): void {
  let headBytes: Buffer;
  try {
    headBytes = execFileSync("git", ["show", `HEAD:${path}`], {
      cwd: repositoryRoot,
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch {
    invalid(path, "must exist in HEAD before production");
  }
  if (headBytes.byteLength !== workingBytes.byteLength || sha256Bytes(headBytes) !== sha256Bytes(workingBytes)) {
    invalid(path, "working bytes differ from HEAD");
  }
}

function assertIgnoredCandidate(repositoryRoot: string, candidateRelativePath: string): void {
  try {
    execFileSync("git", ["check-ignore", "-q", "--", candidateRelativePath], {
      cwd: repositoryRoot,
      stdio: "ignore",
    });
  } catch {
    invalid("scope candidate path", "must be ignored by Git");
  }
}

/** Capture registered bytes only after proving that protocol and producer are committed. */
export function capturePhase10ScopeProducerInputs(options: {
  readonly repositoryRoot: string;
  readonly protocolPath: string;
  readonly command: string;
  readonly startedOn: string;
  readonly endedOn: string;
}): Phase10ScopeProducerInputs {
  const root = resolve(options.repositoryRoot);
  const protocolPath = safeRepositoryPath(options.protocolPath, "scope protocol path");
  if (protocolPath !== PHASE10_SCOPE_PROTOCOL_PATH) invalid("scope protocol path", "is not the registered path");
  if (options.command !== PHASE10_SCOPE_PRODUCE_COMMAND) {
    invalid("scope producer command", "differs from the frozen README produce command");
  }
  const protocolBytes = regularBytes(resolveInside(root, protocolPath, "scope protocol path"), "scope protocol");
  assertFrozenBytes(protocolBytes, PHASE10_SCOPE_FROZEN_PROTOCOL_IDENTITY, "scope protocol");
  const contractBytes = regularBytes(
    resolveInside(root, PHASE10_SCOPE_CONTRACT_MODULE, "scope contract-module path"),
    "scope contract module",
  );
  assertFrozenBytes(
    contractBytes,
    PHASE10_SCOPE_FROZEN_CONTRACT_IDENTITY,
    "scope contract implementation",
  );
  const producerBytes = regularBytes(
    resolveInside(root, PHASE10_SCOPE_PRODUCER_MODULE, "scope producer module path"),
    "scope producer module",
  );
  const head = commit(gitText(root, ["rev-parse", "--verify", "HEAD"], "scope producer head"), "scope producer head");
  const branch = gitText(root, ["branch", "--show-current"], "scope producer branch");
  if (branch !== "phase10/evidence-verification") invalid("scope producer branch", "is not phase10/evidence-verification");
  assertCommittedFile(root, protocolPath, protocolBytes);
  assertCommittedFile(root, PHASE10_SCOPE_CONTRACT_MODULE, contractBytes);
  assertCommittedFile(root, PHASE10_SCOPE_PRODUCER_MODULE, producerBytes);
  return Object.freeze({
    protocolPath: PHASE10_SCOPE_PROTOCOL_PATH,
    protocolBytes,
    foundationBytes: regularBytes(resolveInside(root, PHASE10_SCOPE_FOUNDATION_PATH, "foundation path"), "foundation"),
    matrixBytes: regularBytes(resolveInside(root, PHASE10_SCOPE_MATRIX_PATH, "matrix path"), "obligation matrix"),
    schemaRegistryBytes: regularBytes(
      resolveInside(root, PHASE10_SCOPE_SCHEMA_REGISTRY_PATH, "schema-registry path"),
      "artifact-schema registry",
    ),
    contractBytes,
    charterBytes: regularBytes(
      resolveInside(root, PHASE10_SCOPE_CHARTER_PATH, "scope charter path"),
      "project charter",
    ),
    decisionBytes: regularBytes(
      resolveInside(root, PHASE10_SCOPE_DECISION_PATH, "scope decision path"),
      "Phase 10 decision",
    ),
    phase8aFreezeBytes: regularBytes(
      resolveInside(root, PHASE10_SCOPE_PHASE8A_FREEZE_PATH, "Phase 8A freeze path"),
      "Phase 8A freeze",
    ),
    phase8aBytes: regularBytes(resolveInside(root, PHASE10_SCOPE_PHASE8A_PATH, "Phase 8A path"), "Phase 8A target book"),
    phase8bBytes: regularBytes(resolveInside(root, PHASE10_SCOPE_PHASE8B_PATH, "Phase 8B path"), "Phase 8B successor"),
    provenance: Object.freeze({
      commit: head,
      command: options.command,
      startedOn: options.startedOn,
      endedOn: options.endedOn,
      actualConcurrency: 1,
    }),
  });
}

function matrixArtifactMap(matrix: Phase10ObligationMatrix): ReadonlyMap<string, { readonly path: string; readonly fileName: string }> {
  const outputIds = [
    "out-as-phase8a-overlay",
    "out-as-phase8b-overlay",
    "out-as-report",
    "out-as-artifact-index",
  ];
  const result = new Map<string, { readonly path: string; readonly fileName: string }>();
  for (const outputId of outputIds) {
    const matches = matrix.outputs.filter((entry) => entry.outputId === outputId && entry.packetId === PHASE10_PACKET_ID);
    if (matches.length !== 1 || matches[0]?.artifact.field !== null) invalid("obligation matrix", `lacks one file output ${outputId}`);
    const path = matches[0].artifact.path;
    if (!path.startsWith(`${PHASE10_SCOPE_EVIDENCE_PATH}/`)) invalid("obligation matrix", `${outputId} path leaves A-S bundle`);
    result.set(outputId, { path, fileName: basename(path) });
  }
  exactFileNames(
    [...result.values()].map((entry) => entry.fileName),
    PHASE10_SCOPE_PRODUCER_ARTIFACTS,
    "A-S matrix artifact roster",
  );
  return result;
}

function validateProducerIndex(
  bytes: Uint8Array,
  producerBytes: ReadonlyMap<string, Uint8Array>,
): ReturnType<typeof parsePhase10ScopeReport> {
  const index = object(parsePrettyJson(bytes, "scope artifact index"), "scope artifact index");
  exactKeys(index, ["schema", "bundleId", "artifacts"], "scope artifact index");
  if (index.schema !== PHASE10_SCOPE_INDEX_SCHEMA || index.bundleId !== PHASE10_SCOPE_BUNDLE_ID) {
    invalid("scope artifact index", "identity differs");
  }
  const rows = array(index.artifacts, "scope artifact index.artifacts");
  if (rows.length !== 3) invalid("scope artifact index", "must index three producer payloads");
  const expected = new Map<string, { readonly fileName: string; readonly mediaType: string; readonly role: string }>([
    ["out-as-phase8a-overlay", { fileName: "phase8a-overlay.jsonl", mediaType: "application/x-ndjson", role: "scope-overlay" }],
    ["out-as-phase8b-overlay", { fileName: "phase8b-overlay.jsonl", mediaType: "application/x-ndjson", role: "scope-overlay" }],
    ["out-as-report", { fileName: "scope-report.json", mediaType: "application/json", role: "scope-report" }],
  ]);
  const seen = new Set<string>();
  for (const [indexNumber, value] of rows.entries()) {
    const row = object(value, `scope artifact index.artifacts[${indexNumber}]`);
    exactKeys(row, ["artifactId", "path", "mediaType", "byteLength", "sha256", "role", "producedBy"], `scope artifact index.artifacts[${indexNumber}]`);
    const artifactId = string(row.artifactId, `scope artifact index.artifacts[${indexNumber}].artifactId`);
    const binding = expected.get(artifactId);
    if (binding === undefined || seen.has(artifactId)) invalid("scope artifact index", "artifact IDs differ");
    seen.add(artifactId);
    if (
      row.path !== binding.fileName ||
      row.mediaType !== binding.mediaType ||
      row.role !== binding.role ||
      row.producedBy !== PHASE10_SCOPE_PRODUCER_ID
    ) invalid("scope artifact index", `${artifactId} binding differs`);
    const artifactBytes = producerBytes.get(binding.fileName);
    if (artifactBytes === undefined || row.byteLength !== artifactBytes.byteLength || row.sha256 !== sha256Bytes(artifactBytes)) {
      invalid("scope artifact index", `${artifactId} byte identity differs`);
    }
  }
  if (seen.size !== expected.size) invalid("scope artifact index", "artifact roster differs");
  const reportBytes = producerBytes.get("scope-report.json");
  if (reportBytes === undefined) invalid("scope artifact index", "lacks scope report bytes");
  const report = parsePhase10ScopeReport(parsePrettyJson(reportBytes, "scope report"));
  if (
    report.producer.producerId !== PHASE10_SCOPE_PRODUCER_ID ||
    report.producer.command !== PHASE10_SCOPE_PRODUCE_COMMAND ||
    report.producer.actualConcurrency !== 1
  ) {
    invalid("scope report producer provenance", "differs from the frozen producer, command, or concurrency");
  }
  return report;
}

interface VerificationMutationWitness {
  readonly artifactId: string;
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly semanticFingerprint: {
    readonly projection: StrictJson;
    readonly sha256: string;
  };
}

function verificationMutationWitness(value: unknown, label: string): VerificationMutationWitness {
  const witness = object(value, label);
  exactKeys(
    witness,
    ["artifactId", "path", "byteLength", "sha256", "semanticFingerprint"],
    label,
  );
  const fingerprint = object(witness.semanticFingerprint, `${label}.semanticFingerprint`);
  exactKeys(fingerprint, ["projection", "sha256"], `${label}.semanticFingerprint`);
  const projection = strictJsonSnapshot(fingerprint.projection);
  const fingerprintSha256 = sha256(fingerprint.sha256, `${label}.semanticFingerprint.sha256`);
  if (fingerprintSha256 !== sha256Bytes(canonicalJsonBytes(projection))) {
    invalid(label, "semantic-fingerprint digest differs from its projection");
  }
  return Object.freeze({
    artifactId: string(witness.artifactId, `${label}.artifactId`),
    path: safeRepositoryPath(witness.path, `${label}.path`),
    byteLength: nonnegativeInteger(witness.byteLength, `${label}.byteLength`),
    sha256: sha256(witness.sha256, `${label}.sha256`),
    semanticFingerprint: Object.freeze({ projection, sha256: fingerprintSha256 }),
  });
}

function publisherControlProjection(
  negativeControlId: string,
  candidateArtifacts: ReadonlyMap<string, Uint8Array>,
): StrictJson {
  if (negativeControlId === "nc-as-upgrade-validation-credit") {
    const report = object(
      parsePrettyJson(candidateArtifacts.get("scope-report.json")!, "scope report control witness"),
      "scope report control witness",
    );
    const claimBoundary = object(report.claimBoundary, "scope report claim-boundary witness");
    return strictJsonSnapshot({ quantitativeValidationEarned: claimBoundary.quantitativeValidationEarned });
  }
  const rows = [
    ...parseJsonl(candidateArtifacts.get("phase8a-overlay.jsonl")!, "Phase 8A control witness"),
    ...parseJsonl(candidateArtifacts.get("phase8b-overlay.jsonl")!, "Phase 8B control witness"),
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
  invalid("A-S verification receipt", `has unknown negative control ${negativeControlId}`);
}

function expectedControlArtifact(
  negativeControlId: string,
  candidateArtifacts: ReadonlyMap<string, Uint8Array>,
): { readonly artifactId: string; readonly fileName: string; readonly path: string } {
  if (negativeControlId === "nc-as-upgrade-validation-credit") {
    return Object.freeze({
      artifactId: "out-as-report",
      fileName: "scope-report.json",
      path: `${PHASE10_SCOPE_EVIDENCE_PATH}/scope-report.json`,
    });
  }
  if (
    negativeControlId === "nc-as-drop-one-overlay-row" ||
    negativeControlId === "nc-as-rewrite-frozen-role"
  ) {
    return Object.freeze({
      artifactId: "out-as-phase8a-overlay",
      fileName: "phase8a-overlay.jsonl",
      path: `${PHASE10_SCOPE_EVIDENCE_PATH}/phase8a-overlay.jsonl`,
    });
  }
  if (negativeControlId === "nc-as-collapse-multiple-blockers") {
    for (const [artifactId, fileName, path, label] of [
      [
        "out-as-phase8a-overlay",
        "phase8a-overlay.jsonl",
        `${PHASE10_SCOPE_EVIDENCE_PATH}/phase8a-overlay.jsonl`,
        "Phase 8A blocker-control target",
      ],
      [
        "out-as-phase8b-overlay",
        "phase8b-overlay.jsonl",
        `${PHASE10_SCOPE_EVIDENCE_PATH}/phase8b-overlay.jsonl`,
        "Phase 8B blocker-control target",
      ],
    ] as const) {
      const bytes = candidateArtifacts.get(fileName);
      if (bytes === undefined) invalid("A-S verification receipt", `lacks ${fileName}`);
      const rows = parseJsonl(bytes, label);
      if (rows.some((row) =>
        Array.isArray(row.representabilityBlockers) && row.representabilityBlockers.length >= 2)) {
        return Object.freeze({ artifactId, fileName, path });
      }
    }
    invalid("A-S verification receipt", "blocker-collapse control has no frozen multi-blocker target row");
  }
  invalid("A-S verification receipt", `has unknown negative control ${negativeControlId}`);
}

function exactProjectionRow(value: unknown, fields: readonly string[], label: string): Record<string, unknown> {
  const row = object(value, label);
  exactKeys(row, fields, label);
  return row;
}

function validateControlProjectionMutation(
  negativeControlId: string,
  before: StrictJson,
  after: StrictJson,
): void {
  if (negativeControlId === "nc-as-upgrade-validation-credit") {
    const beforeRow = exactProjectionRow(before, ["quantitativeValidationEarned"], "validation-credit before projection");
    const afterRow = exactProjectionRow(after, ["quantitativeValidationEarned"], "validation-credit after projection");
    if (beforeRow.quantitativeValidationEarned !== false || afterRow.quantitativeValidationEarned !== true) {
      invalid("A-S verification receipt", "validation-credit control is not the exact false-to-true mutation");
    }
    return;
  }
  const beforeRows = array(before, `${negativeControlId} before projection`);
  const afterRows = array(after, `${negativeControlId} after projection`);
  if (negativeControlId === "nc-as-drop-one-overlay-row") {
    if (afterRows.length !== beforeRows.length - 1) {
      invalid("A-S verification receipt", "drop-row control did not remove exactly one projected row");
    }
    let beforeIndex = 0;
    let afterIndex = 0;
    let omitted = 0;
    while (beforeIndex < beforeRows.length) {
      const beforeRow = exactProjectionRow(
        beforeRows[beforeIndex],
        ["overlayId", "sourceRecordId"],
        `drop-row before projection[${beforeIndex}]`,
      );
      const afterValue = afterRows[afterIndex];
      if (afterValue !== undefined && canonicalJson(beforeRow) === canonicalJson(afterValue)) {
        exactProjectionRow(afterValue, ["overlayId", "sourceRecordId"], `drop-row after projection[${afterIndex}]`);
        afterIndex += 1;
      } else {
        omitted += 1;
      }
      beforeIndex += 1;
    }
    if (omitted !== 1 || afterIndex !== afterRows.length) {
      invalid("A-S verification receipt", "drop-row projection changes content beyond one exact omission");
    }
    return;
  }
  if (afterRows.length !== beforeRows.length) {
    invalid("A-S verification receipt", `${negativeControlId} projection roster length differs`);
  }
  let changed = 0;
  for (let index = 0; index < beforeRows.length; index += 1) {
    if (negativeControlId === "nc-as-rewrite-frozen-role") {
      const beforeRow = exactProjectionRow(
        beforeRows[index],
        ["overlayId", "immutableEvidenceRole"],
        `role-rewrite before projection[${index}]`,
      );
      const afterRow = exactProjectionRow(
        afterRows[index],
        ["overlayId", "immutableEvidenceRole"],
        `role-rewrite after projection[${index}]`,
      );
      if (beforeRow.overlayId !== afterRow.overlayId) {
        invalid("A-S verification receipt", "role-rewrite control changed the overlay roster");
      }
      if (beforeRow.immutableEvidenceRole !== afterRow.immutableEvidenceRole) {
        const pair = [beforeRow.immutableEvidenceRole, afterRow.immutableEvidenceRole];
        const allowed =
          canonicalJson(pair) === canonicalJson(["descriptive-only", "phase8a-historical-input"]) ||
          canonicalJson(pair) === canonicalJson(["phase8a-historical-input", "descriptive-only"]);
        if (!allowed) invalid("A-S verification receipt", "role-rewrite control used an unregistered role change");
        changed += 1;
      }
      continue;
    }
    const beforeRow = exactProjectionRow(
      beforeRows[index],
      ["overlayId", "operandIds"],
      `blocker-collapse before projection[${index}]`,
    );
    const afterRow = exactProjectionRow(
      afterRows[index],
      ["overlayId", "operandIds"],
      `blocker-collapse after projection[${index}]`,
    );
    if (beforeRow.overlayId !== afterRow.overlayId) {
      invalid("A-S verification receipt", "blocker-collapse control changed the overlay roster");
    }
    if (canonicalJson(beforeRow.operandIds) !== canonicalJson(afterRow.operandIds)) {
      const beforeIds = array(beforeRow.operandIds, `blocker-collapse before operand IDs[${index}]`)
        .map((value, operandIndex) => string(value, `blocker-collapse before operand IDs[${index}][${operandIndex}]`));
      const afterIds = array(afterRow.operandIds, `blocker-collapse after operand IDs[${index}]`)
        .map((value, operandIndex) => string(value, `blocker-collapse after operand IDs[${index}][${operandIndex}]`));
      if (beforeIds.length < 2 || afterIds.length !== 1 || !beforeIds.includes(afterIds[0]!)) {
        invalid("A-S verification receipt", "blocker-collapse control is not a one-element subset mutation");
      }
      changed += 1;
    }
  }
  if (changed !== 1) {
    invalid("A-S verification receipt", `${negativeControlId} did not change exactly one projected row`);
  }
}

function validateVerificationReceipt(
  receiptBytes: Uint8Array,
  protocolBytes: Uint8Array,
  matrixBytes: Uint8Array,
  matrix: Phase10ObligationMatrix,
  candidateArtifacts: ReadonlyMap<string, Uint8Array>,
  repositoryRoot: string,
): void {
  const receipt = object(
    parsePrettyJson(receiptBytes, "A-S verification receipt"),
    "A-S verification receipt",
  );
  exactKeys(
    receipt,
    [
      "schema",
      "verificationId",
      "packetId",
      "obligationMatrix",
      "classificationProtocol",
      "callableRegistry",
      "evaluator",
      "inputArtifacts",
      "evaluatedArtifacts",
      "executedCheckIds",
      "checkResults",
      "executedNegativeControlIds",
      "negativeControlResults",
      "startedOn",
      "endedOn",
      "verdict",
    ],
    "A-S verification receipt",
  );
  if (receipt.schema !== PHASE10_SCOPE_VERIFICATION_SCHEMA || receipt.packetId !== PHASE10_PACKET_ID || receipt.verdict !== "pass") {
    invalid("A-S verification receipt", "does not carry a passing A-S verdict");
  }
  string(receipt.verificationId, "receipt.verificationId");
  const startedOn = isoTimestamp(receipt.startedOn, "receipt.startedOn");
  const endedOn = isoTimestamp(receipt.endedOn, "receipt.endedOn");
  if (Date.parse(endedOn) < Date.parse(startedOn)) invalid("A-S verification receipt", "endedOn precedes startedOn");
  const matrixTuple = artifactTuple(receipt.obligationMatrix, "receipt.obligationMatrix");
  assertTuple(pin(PHASE10_SCOPE_MATRIX_PATH, matrixBytes), matrixTuple, "receipt matrix binding");
  const protocolTuple = artifactTuple(receipt.classificationProtocol, "receipt.classificationProtocol");
  assertTuple(pin(PHASE10_SCOPE_PROTOCOL_PATH, protocolBytes), protocolTuple, "receipt protocol binding");
  const callableRegistry = artifactTuple(receipt.callableRegistry, "receipt.callableRegistry");
  const callableRegistryPath = resolveInside(repositoryRoot, callableRegistry.path, "receipt callable-registry path");
  const callableRegistryBytes = regularBytes(callableRegistryPath, "receipt callable registry");
  assertTuple(pin(callableRegistry.path, callableRegistryBytes), callableRegistry, "receipt callable-registry binding");

  const evaluator = object(receipt.evaluator, "receipt.evaluator");
  exactKeys(
    evaluator,
    ["callableId", "modulePath", "exportName", "byteLength", "sha256"],
    "receipt.evaluator",
  );
  const evaluatorId = string(evaluator.callableId, "receipt.evaluator.callableId");
  const evaluatorModulePath = safeRepositoryPath(evaluator.modulePath, "receipt.evaluator.modulePath");
  const evaluatorRegistry = object(
    strictJsonSnapshot(parseJson(callableRegistryBytes, "receipt callable registry")),
    "receipt callable registry",
  );
  const evaluatorBindings = array(evaluatorRegistry.callables, "receipt callable registry.callables")
    .map((entry, index) => object(entry, `receipt callable registry.callables[${index}]`))
    .filter((entry) => entry.callableId === evaluatorId);
  if (evaluatorBindings.length !== 1) invalid("receipt evaluator", "does not resolve once in callable registry");
  const evaluatorBinding = evaluatorBindings[0]!;
  const evaluatorIdentity = object(evaluatorBinding.identity, "receipt evaluator registry identity");
  if (
    evaluatorBinding.role !== "independent-evaluator" ||
    evaluatorBinding.resolution !== "resolved" ||
    evaluatorBinding.modulePath !== evaluatorModulePath ||
    evaluatorBinding.exportName !== evaluator.exportName ||
    evaluatorIdentity.byteLength !== evaluator.byteLength ||
    evaluatorIdentity.sha256 !== evaluator.sha256 ||
    evaluatorModulePath === PHASE10_SCOPE_PRODUCER_MODULE
  ) {
    invalid("receipt evaluator", "differs from the resolved independent callable");
  }
  const evaluatorBytes = regularBytes(
    resolveInside(repositoryRoot, evaluatorModulePath, "receipt evaluator module path"),
    "receipt evaluator module",
  );
  if (evaluator.byteLength !== evaluatorBytes.byteLength || evaluator.sha256 !== sha256Bytes(evaluatorBytes)) {
    invalid("receipt evaluator", "module byte identity differs");
  }

  const expectedInputPaths = [
    PHASE10_SCOPE_PHASE8A_FREEZE_PATH,
    PHASE10_SCOPE_PHASE8A_PATH,
    PHASE10_SCOPE_PHASE8B_PATH,
  ].sort(compareText);
  const receiptInputs = array(receipt.inputArtifacts, "receipt.inputArtifacts")
    .map((entry, index) => artifactTuple(entry, `receipt.inputArtifacts[${index}]`));
  const receiptInputPaths = receiptInputs.map((entry) => entry.path);
  if (
    new Set(receiptInputPaths).size !== receiptInputPaths.length ||
    canonicalJson(receiptInputPaths) !== canonicalJson(expectedInputPaths)
  ) {
    invalid("A-S verification receipt", "input-artifact roster differs or is not sorted");
  }
  for (const input of receiptInputs) {
    const bytes = regularBytes(
      resolveInside(repositoryRoot, input.path, "receipt input-artifact path"),
      `receipt input ${input.path}`,
    );
    assertTuple(pin(input.path, bytes), input, `receipt input ${input.path}`);
  }

  const expectedChecks = matrix.checks
    .filter((entry) => entry.packetId === PHASE10_PACKET_ID)
    .map((entry) => entry.checkId)
    .sort(compareText);
  const actualChecks = sortedUniqueStrings(receipt.executedCheckIds, "receipt.executedCheckIds");
  if (canonicalJson(actualChecks) !== canonicalJson(expectedChecks)) invalid("A-S verification receipt", "check roster differs");
  const checkResults = array(receipt.checkResults, "receipt.checkResults");
  const resultIds = checkResults.map((entry, index) => {
    const row = object(entry, `receipt.checkResults[${index}]`);
    exactKeys(row, ["checkId", "verdict", "detail"], `receipt.checkResults[${index}]`);
    const id = string(row.checkId, `receipt.checkResults[${index}].checkId`);
    if (row.verdict !== "pass") invalid("A-S verification receipt", `${id} did not pass`);
    const detail = object(row.detail, `receipt.checkResults[${index}].detail`);
    exactKeys(detail, ["errors", "witnessOutputIds"], `receipt.checkResults[${index}].detail`);
    if (array(detail.errors, `receipt.checkResults[${index}].detail.errors`).length !== 0) {
      invalid("A-S verification receipt", `${id} has errors despite pass`);
    }
    sortedUniqueStrings(
      detail.witnessOutputIds,
      `receipt.checkResults[${index}].detail.witnessOutputIds`,
      { allowEmpty: true },
    );
    return id;
  });
  if (new Set(resultIds).size !== resultIds.length || canonicalJson(resultIds) !== canonicalJson(expectedChecks)) {
    invalid("A-S verification receipt", "check-result roster differs");
  }

  const matrixArtifacts = matrixArtifactMap(matrix);
  const expectedControls = matrix.negativeControls
    .filter((entry) => entry.packetId === PHASE10_PACKET_ID)
    .map((entry) => entry.negativeControlId)
    .sort(compareText);
  const actualControls = sortedUniqueStrings(receipt.executedNegativeControlIds, "receipt.executedNegativeControlIds");
  if (canonicalJson(actualControls) !== canonicalJson(expectedControls)) invalid("A-S verification receipt", "negative-control roster differs");
  const controlResults = array(receipt.negativeControlResults, "receipt.negativeControlResults");
  const resultControlIds = controlResults.map((entry, index) => {
    const row = object(entry, `receipt.negativeControlResults[${index}]`);
    exactKeys(
      row,
      ["negativeControlId", "mutationExecuted", "rejected", "beforeWitness", "afterWitness", "errors"],
      `receipt.negativeControlResults[${index}]`,
    );
    const id = string(row.negativeControlId, `receipt.negativeControlResults[${index}].negativeControlId`);
    const beforeWitness = verificationMutationWitness(
      row.beforeWitness,
      `receipt.negativeControlResults[${index}].beforeWitness`,
    );
    const afterWitness = verificationMutationWitness(
      row.afterWitness,
      `receipt.negativeControlResults[${index}].afterWitness`,
    );
    const independentlyDerivedBeforeProjection = publisherControlProjection(id, candidateArtifacts);
    if (
      canonicalJson(beforeWitness.semanticFingerprint.projection) !==
      canonicalJson(independentlyDerivedBeforeProjection)
    ) {
      invalid("A-S verification receipt", `${id} before semantic projection differs from reopened candidate bytes`);
    }
    validateControlProjectionMutation(
      id,
      beforeWitness.semanticFingerprint.projection,
      afterWitness.semanticFingerprint.projection,
    );
    const expectedTarget = expectedControlArtifact(id, candidateArtifacts);
    const expectedArtifact = matrixArtifacts.get(expectedTarget.artifactId);
    const expectedBytes = candidateArtifacts.get(expectedTarget.fileName);
    if (
      expectedArtifact === undefined ||
      expectedBytes === undefined ||
      expectedArtifact.fileName !== expectedTarget.fileName ||
      expectedArtifact.path !== expectedTarget.path ||
      beforeWitness.artifactId !== expectedTarget.artifactId ||
      beforeWitness.path !== expectedArtifact.path ||
      beforeWitness.byteLength !== expectedBytes.byteLength ||
      beforeWitness.sha256 !== sha256Bytes(expectedBytes)
    ) {
      invalid("A-S verification receipt", `${id} before witness does not bind its exact frozen target artifact`);
    }
    if (
      afterWitness.artifactId !== beforeWitness.artifactId ||
      afterWitness.path !== `out/phase10-scope-negative-controls/${id}/${expectedArtifact.fileName}` ||
      afterWitness.sha256 === beforeWitness.sha256 ||
      afterWitness.semanticFingerprint.sha256 === beforeWitness.semanticFingerprint.sha256
    ) {
      invalid("A-S verification receipt", `${id} mutation witness does not prove byte and semantic change`);
    }
    // Mutated raw bytes are deliberately not retained as package outputs. Their SHA-256 and
    // length therefore remain evaluator-bound diagnostics; the publisher independently binds
    // the reopened before bytes and the exact named semantic transformation above.
    if (row.mutationExecuted !== true || row.rejected !== true) {
      invalid("A-S verification receipt", `${id} did not execute and reject its mutation`);
    }
    if (array(row.errors, `receipt.negativeControlResults[${index}].errors`).length !== 0) {
      invalid("A-S verification receipt", `${id} has errors despite pass`);
    }
    return id;
  });
  if (new Set(resultControlIds).size !== resultControlIds.length || canonicalJson(resultControlIds) !== canonicalJson(expectedControls)) {
    invalid("A-S verification receipt", "negative-control result roster differs");
  }

  const evaluated = array(receipt.evaluatedArtifacts, "receipt.evaluatedArtifacts");
  const expectedOutputIds = [...matrixArtifacts.keys()].sort(compareText);
  const evaluatedIds: string[] = [];
  for (const [index, value] of evaluated.entries()) {
    const row = object(value, `receipt.evaluatedArtifacts[${index}]`);
    exactKeys(row, ["outputId", "path", "byteLength", "sha256"], `receipt.evaluatedArtifacts[${index}]`);
    const outputId = string(row.outputId, `receipt.evaluatedArtifacts[${index}].outputId`);
    const expected = matrixArtifacts.get(outputId);
    if (expected === undefined) invalid("A-S verification receipt", `has unexpected evaluated output ${outputId}`);
    const bytes = candidateArtifacts.get(expected.fileName);
    if (
      bytes === undefined ||
      row.path !== expected.path ||
      row.byteLength !== bytes.byteLength ||
      row.sha256 !== sha256Bytes(bytes)
    ) {
      invalid("A-S verification receipt", `${outputId} evaluated identity differs`);
    }
    evaluatedIds.push(outputId);
  }
  if (new Set(evaluatedIds).size !== evaluatedIds.length || canonicalJson(evaluatedIds) !== canonicalJson(expectedOutputIds)) {
    invalid("A-S verification receipt", "evaluated artifact roster differs");
  }
}

interface ValidatedScopePublication {
  readonly root: string;
  readonly candidate: string;
  readonly output: string;
  readonly candidateArtifacts: ReadonlyMap<string, Uint8Array>;
  readonly outputAlreadyPublished: boolean;
}

function existingScopePublicationMatches(
  output: string,
  candidateArtifacts: ReadonlyMap<string, Uint8Array>,
): boolean {
  if (!existsSync(output)) return false;
  const stat = lstatSync(output);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    invalid("scope publication", "existing path must be a non-symlink directory");
  }
  exactFileNames(readdirSync(output), PHASE10_SCOPE_PUBLISHED_ARTIFACTS, "existing A-S publication");
  for (const name of PHASE10_SCOPE_PUBLISHED_ARTIFACTS) {
    const expected = candidateArtifacts.get(name)!;
    const existing = regularBytes(join(output, name), `existing publication ${name}`);
    if (existing.byteLength !== expected.byteLength || sha256Bytes(existing) !== sha256Bytes(expected)) {
      invalid("scope publication", `existing ${name} differs from the exact candidate bytes`);
    }
  }
  return true;
}

function loadValidatedScopePublication(options: {
  readonly repositoryRoot: string;
  readonly candidateRelativePath: string;
  readonly outputRelativePath: string;
}, requireTerminalReceipt: boolean): ValidatedScopePublication {
  const root = resolve(options.repositoryRoot);
  if (!options.candidateRelativePath.startsWith("out/")) invalid("scope candidate path", "must be below out/");
  if (options.outputRelativePath !== PHASE10_SCOPE_EVIDENCE_PATH) invalid("scope publication path", "differs from registered path");
  const candidate = resolveInside(root, options.candidateRelativePath, "scope candidate path");
  const output = resolveInside(root, options.outputRelativePath, "scope publication path");
  const candidateStat = lstatSync(candidate);
  if (!candidateStat.isDirectory() || candidateStat.isSymbolicLink()) invalid("scope candidate", "must be a non-symlink directory");
  assertSafeExistingParent(root, candidate, "scope candidate");
  assertSafeExistingParent(root, output, "scope publication");
  const allowed = [...PHASE10_SCOPE_PUBLISHED_ARTIFACTS, ...PHASE10_SCOPE_STRUCTURAL_COMPANIONS];
  const present = readdirSync(candidate);
  if (present.some((name) => !allowed.includes(name as (typeof allowed)[number]))) {
    invalid("scope candidate", "contains an unregistered file");
  }
  for (const name of PHASE10_SCOPE_PUBLISHED_ARTIFACTS) {
    if (!present.includes(name)) invalid("scope candidate", `lacks ${name}`);
  }
  if (!present.includes("preflight.json")) invalid("scope candidate", "lacks static preflight receipt");
  regularBytes(join(candidate, "preflight.json"), "scope static preflight receipt");
  if (requireTerminalReceipt && !present.includes("terminal-receipt.json")) {
    invalid("scope candidate", "lacks static terminal receipt");
  }
  if (present.includes("terminal-receipt.json")) {
    regularBytes(join(candidate, "terminal-receipt.json"), "scope static terminal receipt");
  }
  const candidateArtifacts = new Map<string, Uint8Array>();
  for (const name of PHASE10_SCOPE_PUBLISHED_ARTIFACTS) {
    candidateArtifacts.set(name, regularBytes(join(candidate, name), `scope candidate ${name}`));
  }
  const protocolBytes = regularBytes(
    resolveInside(root, PHASE10_SCOPE_PROTOCOL_PATH, "scope protocol path"),
    "scope protocol",
  );
  assertFrozenBytes(protocolBytes, PHASE10_SCOPE_FROZEN_PROTOCOL_IDENTITY, "scope protocol");
  assertFrozenBytes(
    regularBytes(
      resolveInside(root, PHASE10_SCOPE_CONTRACT_MODULE, "scope contract-module path"),
      "scope contract module",
    ),
    PHASE10_SCOPE_FROZEN_CONTRACT_IDENTITY,
    "scope contract implementation",
  );
  const matrixBytes = regularBytes(resolveInside(root, PHASE10_SCOPE_MATRIX_PATH, "matrix path"), "obligation matrix");
  const matrix = parsePhase10ObligationMatrix(parseJson(matrixBytes, "obligation matrix"));
  const report = validateProducerIndex(
    candidateArtifacts.get("scope-artifact-index.json")!,
    candidateArtifacts,
  );
  const preflight = object(
    parsePrettyJson(
      regularBytes(join(candidate, "preflight.json"), "scope static preflight receipt"),
      "scope static preflight receipt",
    ),
    "scope static preflight receipt",
  );
  const observed = object(preflight.observed, "scope static preflight observed predicates");
  if (report.producer.commit !== observed.head) {
    invalid("scope report producer provenance", "commit differs from the retained clean preflight head");
  }
  validateVerificationReceipt(
    candidateArtifacts.get(PHASE10_SCOPE_VERIFICATION_ARTIFACT)!,
    protocolBytes,
    matrixBytes,
    matrix,
    candidateArtifacts,
    root,
  );
  const outputAlreadyPublished = existingScopePublicationMatches(output, candidateArtifacts);
  return Object.freeze({ root, candidate, output, candidateArtifacts, outputAlreadyPublished });
}

/** Validate all five scope artifacts without writing a terminal or publication byte. */
export function validatePhase10ScopeCandidateForPublication(options: {
  readonly repositoryRoot: string;
  readonly candidateRelativePath: string;
  readonly outputRelativePath: string;
}): void {
  loadValidatedScopePublication(options, false);
}

/**
 * Reopen a verified, terminally bracketed candidate and atomically install only the five
 * registered A-S bundle files. The classification protocol remains at its committed research
 * path, and the two generic structural receipts publish through their own module.
 */
export function publishPhase10ScopeCandidate(options: {
  readonly repositoryRoot: string;
  readonly candidateRelativePath: string;
  readonly outputRelativePath: string;
}): void {
  const { output, candidateArtifacts, outputAlreadyPublished } = loadValidatedScopePublication(options, true);
  if (outputAlreadyPublished) return;

  const parent = dirname(output);
  mkdirSync(parent, { recursive: true });
  const staging = join(parent, `.${basename(output)}.staging-${randomUUID()}`);
  if (!pathIsWithin(parent, staging)) invalid("scope publication staging", "leaves publication parent");
  mkdirSync(staging);
  try {
    for (const name of PHASE10_SCOPE_PUBLISHED_ARTIFACTS) {
      const bytes = candidateArtifacts.get(name)!;
      writeFileSync(join(staging, name), bytes, { flag: "wx" });
      const reopened = regularBytes(join(staging, name), `staged publication ${name}`);
      if (reopened.byteLength !== bytes.byteLength || sha256Bytes(reopened) !== sha256Bytes(bytes)) {
        invalid(`staged publication ${name}`, "bytes differ after write");
      }
    }
    exactFileNames(readdirSync(staging), PHASE10_SCOPE_PUBLISHED_ARTIFACTS, "staged A-S publication");
    renameSync(staging, output);
  } catch (error) {
    if (existsSync(staging)) removeStaging(parent, staging);
    throw error;
  }
}

function parseOptions(argv: readonly string[], names: readonly string[], label: string): Readonly<Record<string, string>> {
  if (argv.length !== names.length * 2) invalid(label, "has the wrong argument count");
  const allowed = new Set(names);
  const result: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === undefined || value === undefined || !flag.startsWith("--")) invalid(label, "has a malformed option");
    const name = flag.slice(2);
    if (!allowed.has(name) || Object.hasOwn(result, name)) invalid(label, `has unknown or duplicate option ${flag}`);
    result[name] = string(value, `${label} ${flag}`);
  }
  for (const name of names) if (!Object.hasOwn(result, name)) invalid(label, `lacks --${name}`);
  return Object.freeze(result);
}

function commandText(argv: readonly string[]): string {
  if (argv.some((part) => /[\s"']/u.test(part))) invalid("scope producer command", "arguments must not require shell quoting");
  return `node ${PHASE10_SCOPE_PRODUCER_MODULE} ${argv.join(" ")}`;
}

function usage(): never {
  throw new Error(
    "usage: node runner/src/phase10-scope-overlay.ts produce --repository-root ROOT " +
    "--protocol research/phase10-scope-classification-protocol-v1.json --out CANDIDATE | " +
    "publish --repository-root ROOT --candidate CANDIDATE --out evidence/phase10-scope-intake-v1",
  );
}

function main(argv: readonly string[]): void {
  const subcommand = argv[0];
  if (subcommand === "produce") {
    const options = parseOptions(argv.slice(1), ["repository-root", "protocol", "out"], "scope produce command");
    const root = resolve(options["repository-root"]!);
    const candidate = safeRepositoryPath(options.out, "scope candidate path");
    const requestedProtocol = safeRepositoryPath(options.protocol, "scope protocol path");
    if (requestedProtocol !== PHASE10_SCOPE_PROTOCOL_PATH) {
      invalid("scope protocol path", "is not the registered A-S classification protocol");
    }
    assertIgnoredCandidate(root, candidate);
    writePhase10StaticPreflightReceipt({
      repositoryRoot: root,
      packetId: PHASE10_PACKET_ID,
      attemptId: PHASE10_SCOPE_STATIC_ATTEMPT_ID,
      candidateDirectory: candidate,
      command: PHASE10_SCOPE_PRODUCE_COMMAND,
      repositoryBundleRoot: ".",
    });
    const startedOn = new Date().toISOString();
    const captured = capturePhase10ScopeProducerInputs({
      repositoryRoot: root,
      protocolPath: requestedProtocol,
      command: commandText(argv),
      startedOn,
      endedOn: startedOn,
    });
    const inputs: Phase10ScopeProducerInputs = Object.freeze({
      ...captured,
      provenance: Object.freeze({
        ...captured.provenance,
        endedOn: new Date().toISOString(),
      }),
    });
    const bundle = producePhase10ScopeArtifacts(inputs);
    writePhase10ScopeCandidate(root, candidate, bundle);
    process.stdout.write(`${canonicalJson({ state: "candidate-awaiting-independent-verification", counts: bundle.counts })}\n`);
    return;
  }
  if (subcommand === "publish") {
    const options = parseOptions(argv.slice(1), ["repository-root", "candidate", "out"], "scope publish command");
    const root = resolve(options["repository-root"]!);
    const candidate = safeRepositoryPath(options.candidate, "scope candidate path");
    assertIgnoredCandidate(root, candidate);
    const publication = {
      repositoryRoot: root,
      candidateRelativePath: candidate,
      outputRelativePath: safeRepositoryPath(options.out, "scope publication path"),
    } as const;
    validatePhase10ScopeCandidateForPublication(publication);
    writePhase10StaticTerminalReceipt({
      repositoryRoot: root,
      packetId: PHASE10_PACKET_ID,
      attemptId: PHASE10_SCOPE_STATIC_ATTEMPT_ID,
      candidateDirectory: candidate,
      command: PHASE10_SCOPE_PRODUCE_COMMAND,
      repositoryBundleRoot: ".",
      terminalState: "pass",
    });
    const staticReceiptOptions = {
      repositoryRoot: root,
      packetId: PHASE10_PACKET_ID,
      attemptId: PHASE10_SCOPE_STATIC_ATTEMPT_ID,
      candidateDirectory: candidate,
      command: PHASE10_SCOPE_PRODUCE_COMMAND,
      repositoryBundleRoot: ".",
    } as const;
    validatePhase10StaticPacketReceiptsForPublication(staticReceiptOptions);
    let receiptsPublished = false;
    try {
      receiptsPublished = publishPhase10StaticPacketReceipts(staticReceiptOptions);
      publishPhase10ScopeCandidate(publication);
    } catch (error) {
      if (receiptsPublished) {
        try {
          rollbackPhase10StaticPacketReceipts(staticReceiptOptions);
        } catch (rollbackError) {
          throw new AggregateError(
            [error, rollbackError],
            "A-S scope publication failed and exact receipt rollback also failed",
          );
        }
      }
      throw error;
    }
    process.stdout.write(`${canonicalJson({ state: "published", path: PHASE10_SCOPE_EVIDENCE_PATH })}\n`);
    return;
  }
  usage();
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
