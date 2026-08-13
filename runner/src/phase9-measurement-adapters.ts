// Phase 9 S1 — source-preserving, protocol-aware measurement adapters.
//
// This module is deliberately pure: callers supply the exact successor book, registry, metadata,
// and NAS row bytes. It validates every available byte binding before interpreting a row. Missing
// source bytes produce a tagged source block; malformed or hash-shifted bytes throw.

import {
  canonicalJson,
  sha256Bytes,
  type StrictJson,
} from "./gate4-evidence.ts";

export const PHASE9_ADAPTER_REGISTRY_SCHEMA = "phase9-adapter-registry-v1" as const;
export const PHASE9_ADAPTER_RESULT_SCHEMA = "phase9-adapter-result-v1" as const;
const PHASE9_SUCCESSOR_TARGET_BOOK_SHA256 =
  "c54b89683eea1f064bd8e81d6e9e06b3b9bbc6c022168b981cbfa71e5fc3cdd3" as const;
const PHASE9_SUCCESSOR_TARGET_BOOK_BYTES = 36_094 as const;
const PHASE9_ADAPTER_REGISTRY_SHA256 =
  "498e85471766294d812b3ef9d747381e92eb476e8a9b40a3f34f855b53e46337" as const;
const PHASE9_ADAPTER_REGISTRY_BYTES = 48_946 as const;

export type Phase9AdapterKind =
  | "planar-facet"
  | "supported-dimension-rim"
  | "free-particle-mass"
  | "free-fall-ensemble"
  | "initiation-aggregate"
  | "categorical-intervention"
  | "categorical-atlas"
  | "gas-pressure-intervention"
  | "spatial-roughness"
  | "sublimation"
  | "interpretive-constraint";

export type Phase9BindingKind =
  | "native-history"
  | "digitized-plot-series"
  | "direct-bacon-reported-aggregate"
  | "terminal-interpretive-dependency"
  | "post-phase8-source";

export type Phase9Eligibility =
  | "eligible"
  | "eligible-with-limitation"
  | "ineligible"
  | "source-blocked";

export type Phase9JsonObject = { readonly [key: string]: StrictJson };
type JsonObject = Phase9JsonObject;

export interface Phase9AdapterRegistryRecord {
  readonly schema: typeof PHASE9_ADAPTER_REGISTRY_SCHEMA;
  readonly selectionId: string;
  readonly bindingKind: Exclude<Phase9BindingKind, "post-phase8-source">;
  readonly adapterKind: Phase9AdapterKind;
  readonly requestedUses: readonly Phase9RequestedUse[];
  readonly sourceConditionFields: readonly string[];
  readonly uncertaintyFields: readonly string[];
  readonly restrictions: readonly string[];
  readonly knowledgeHypothesisIds: readonly string[];
}

export interface Phase9RequestedUse {
  readonly purpose: string;
  readonly status: Phase9Eligibility;
  readonly reasonCode: string;
}

export interface Phase9AdapterIdentity {
  readonly selectionId: string;
  readonly metadataRecordId: string;
  readonly sourceUnitId: string | null;
}

export interface Phase9LexicalScalar {
  readonly sourceLexeme: string;
  readonly value: number;
}

export interface Phase9AdaptedObservation {
  /** One-based byte-stream order. Adapters never sort, coalesce, or deduplicate observations. */
  readonly sourceOrdinal: number;
  readonly sourceRowIndexLexeme: string | null;
  /** Exact LF-delimited source row, retained so numeric lexemes remain recoverable. */
  readonly sourceLine: string;
  readonly values: JsonObject;
  readonly uncertainty: JsonObject;
  readonly sourceOrderSpan: StrictJson;
}

export interface Phase9AdapterResult extends Phase9AdapterIdentity {
  readonly schema: typeof PHASE9_ADAPTER_RESULT_SCHEMA;
  readonly adapterKind: Phase9AdapterKind;
  readonly bindingKind: Phase9BindingKind;
  readonly status: Phase9Eligibility;
  readonly reasons: readonly string[];
  readonly requestedUse: Phase9RequestedUse | null;
  readonly restrictions: readonly string[];
  readonly knowledgeHypothesisIds: readonly string[];
  readonly conditions: JsonObject;
  readonly uncertainty: JsonObject;
  /** The exact parsed metadata record; lineage, rights, and restrictions are not discarded. */
  readonly sourceMetadata: JsonObject;
  readonly observations: readonly Phase9AdaptedObservation[];
}

export interface Phase9MeasurementCorpusInputs {
  readonly registryBytes: Uint8Array;
  readonly successorTargetBookBytes: Uint8Array;
  /** Keyed by the repository-relative metadata path in binding.metadataRecordArtifact.path. */
  readonly metadataArtifacts: ReadonlyMap<string, Uint8Array>;
  /** Keyed by `${logicalRoot}/${path}` from binding.rowArtifact. */
  readonly rowArtifacts: ReadonlyMap<string, Uint8Array>;
  /** Optional per-selection purpose; absent means the first registry use, which is the primary use. */
  readonly requestedPurposes?: ReadonlyMap<string, string>;
}

interface SuccessorRecord {
  readonly raw: JsonObject;
  readonly selectionId: string;
  readonly binding: JsonObject;
  readonly bindingKind: Exclude<Phase9BindingKind, "post-phase8-source">;
  readonly metadataRecordId: string;
  readonly sourceUnitId: string | null;
}

const ADAPTER_KINDS = new Set<Phase9AdapterKind>([
  "planar-facet",
  "supported-dimension-rim",
  "free-particle-mass",
  "free-fall-ensemble",
  "initiation-aggregate",
  "categorical-intervention",
  "categorical-atlas",
  "gas-pressure-intervention",
  "spatial-roughness",
  "sublimation",
  "interpretive-constraint",
]);

const SUCCESSOR_BINDING_KINDS = new Set<Exclude<Phase9BindingKind, "post-phase8-source">>([
  "native-history",
  "digitized-plot-series",
  "direct-bacon-reported-aggregate",
  "terminal-interpretive-dependency",
]);

const NUMBER_TOKEN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function jsonObject(value: unknown, label: string): JsonObject {
  return object(value, label) as JsonObject;
}

function array(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a nonempty string`);
  return value;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function nonnegativeInteger(value: unknown, label: string): number {
  const result = finite(value, label);
  if (!Number.isInteger(result) || result < 0) throw new Error(`${label} must be a nonnegative integer`);
  return result;
}

function sha256(value: unknown, label: string): string {
  const result = string(value, label);
  if (!/^[0-9a-f]{64}$/.test(result)) throw new Error(`${label} must be a lowercase SHA-256`);
  return result;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  if (canonicalJson(Object.keys(value).sort()) !== canonicalJson([...expected].sort())) {
    throw new Error(`${label} keys differ`);
  }
}

function decodeLf(bytes: Uint8Array, label: string): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} is not UTF-8`);
  }
  if (text.includes("\r") || !text.endsWith("\n")) throw new Error(`${label} must be LF-terminated text`);
  return text;
}

function parseCanonicalJsonl(bytes: Uint8Array, label: string): readonly JsonObject[] {
  const text = decodeLf(bytes, label);
  const lines = text.slice(0, -1).split("\n");
  if (lines.length === 0 || lines.some((line) => line.length === 0)) throw new Error(`${label} contains an empty row`);
  return lines.map((line, index) => {
    let value: unknown;
    try {
      value = JSON.parse(line) as unknown;
    } catch {
      throw new Error(`${label} row ${index + 1} is not JSON`);
    }
    const row = jsonObject(value, `${label} row ${index + 1}`);
    if (canonicalJson(row) !== line) throw new Error(`${label} row ${index + 1} is not canonical JSON`);
    return row;
  });
}

function parseNumberToken(token: string, label: string): Phase9LexicalScalar {
  if (!NUMBER_TOKEN.test(token)) throw new Error(`${label} is not a decimal source token`);
  const value = Number(token);
  if (!Number.isFinite(value)) throw new Error(`${label} is not finite`);
  return { sourceLexeme: token, value };
}

function lexicalJson(value: Phase9LexicalScalar): JsonObject {
  return { sourceLexeme: value.sourceLexeme, value: value.value };
}

function descriptor(value: unknown, label: string): {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly logicalRoot: string | null;
  readonly rowCount: number | null;
} {
  const row = object(value, label);
  const byteLength = row.byteLength === undefined
    ? nonnegativeInteger(row.bytes, `${label}.bytes`)
    : nonnegativeInteger(row.byteLength, `${label}.byteLength`);
  return {
    path: string(row.path, `${label}.path`),
    byteLength,
    sha256: sha256(row.sha256, `${label}.sha256`),
    logicalRoot: row.logicalRoot === undefined ? null : string(row.logicalRoot, `${label}.logicalRoot`),
    rowCount: row.rowCount === undefined ? null : nonnegativeInteger(row.rowCount, `${label}.rowCount`),
  };
}

function assertBytes(bytes: Uint8Array, expected: { readonly byteLength: number; readonly sha256: string }, label: string): void {
  if (bytes.byteLength !== expected.byteLength || sha256Bytes(bytes) !== expected.sha256) {
    throw new Error(`${label} byte/hash pin differs`);
  }
}

function exactStringSet(actual: readonly string[], expected: readonly string[], label: string): void {
  const left = [...actual].sort();
  const right = [...expected].sort();
  if (canonicalJson(left) !== canonicalJson(right)) throw new Error(`${label} differs`);
}

function adapterKind(value: unknown, label: string): Phase9AdapterKind {
  const result = string(value, label) as Phase9AdapterKind;
  if (!ADAPTER_KINDS.has(result)) throw new Error(`${label} is not recognized`);
  return result;
}

function successorBindingKind(value: unknown, label: string): Exclude<Phase9BindingKind, "post-phase8-source"> {
  const result = string(value, label) as Exclude<Phase9BindingKind, "post-phase8-source">;
  if (!SUCCESSOR_BINDING_KINDS.has(result)) throw new Error(`${label} is not recognized`);
  return result;
}

function eligibility(value: unknown, label: string): Phase9Eligibility {
  const result = string(value, label);
  if (result !== "eligible" && result !== "eligible-with-limitation" && result !== "ineligible" && result !== "source-blocked") {
    throw new Error(`${label} is not a recognized eligibility status`);
  }
  return result;
}

function stringArray(value: unknown, label: string, allowEmpty = false): readonly string[] {
  const result = array(value, label).map((entry, index) => string(entry, `${label}[${index}]`));
  if (!allowEmpty && result.length === 0) throw new Error(`${label} must not be empty`);
  if (new Set(result).size !== result.length) throw new Error(`${label} contains duplicates`);
  return result;
}

function decodeRegistry(bytes: Uint8Array): readonly Phase9AdapterRegistryRecord[] {
  if (bytes.byteLength !== PHASE9_ADAPTER_REGISTRY_BYTES || sha256Bytes(bytes) !== PHASE9_ADAPTER_REGISTRY_SHA256) {
    throw new Error("registered Phase 9 adapter registry byte/hash pin differs");
  }
  const rows = parseCanonicalJsonl(bytes, "Phase 9 adapter registry");
  const result = rows.map((row, index): Phase9AdapterRegistryRecord => {
    exactKeys(row, [
      "schema", "selectionId", "bindingKind", "adapterKind", "requestedUses",
      "sourceConditionFields", "uncertaintyFields", "restrictions", "knowledgeHypothesisIds",
    ], `registry row ${index + 1}`);
    if (row.schema !== PHASE9_ADAPTER_REGISTRY_SCHEMA) throw new Error(`registry row ${index + 1} schema differs`);
    const requestedUses = array(row.requestedUses, `registry row ${index + 1}.requestedUses`).map((value, useIndex): Phase9RequestedUse => {
      const use = object(value, `registry row ${index + 1}.requestedUses[${useIndex}]`);
      exactKeys(use, ["purpose", "status", "reasonCode"], `registry row ${index + 1}.requestedUses[${useIndex}]`);
      return {
        purpose: string(use.purpose, `registry row ${index + 1}.requestedUses[${useIndex}].purpose`),
        status: eligibility(use.status, `registry row ${index + 1}.requestedUses[${useIndex}].status`),
        reasonCode: string(use.reasonCode, `registry row ${index + 1}.requestedUses[${useIndex}].reasonCode`),
      };
    });
    if (requestedUses.length === 0 || new Set(requestedUses.map((use) => use.purpose)).size !== requestedUses.length) {
      throw new Error(`registry row ${index + 1} requested uses are empty or duplicated`);
    }
    const knowledgeHypothesisIds = stringArray(row.knowledgeHypothesisIds, `registry row ${index + 1}.knowledgeHypothesisIds`);
    if (knowledgeHypothesisIds.some((id) => !/^P9H-[A-Z0-9-]+$/.test(id))) {
      throw new Error(`registry row ${index + 1} has an invalid knowledge hypothesis ID`);
    }
    return {
      schema: PHASE9_ADAPTER_REGISTRY_SCHEMA,
      selectionId: string(row.selectionId, `registry row ${index + 1}.selectionId`),
      bindingKind: successorBindingKind(row.bindingKind, `registry row ${index + 1}.bindingKind`),
      adapterKind: adapterKind(row.adapterKind, `registry row ${index + 1}.adapterKind`),
      requestedUses,
      sourceConditionFields: stringArray(row.sourceConditionFields, `registry row ${index + 1}.sourceConditionFields`),
      uncertaintyFields: stringArray(row.uncertaintyFields, `registry row ${index + 1}.uncertaintyFields`),
      restrictions: stringArray(row.restrictions, `registry row ${index + 1}.restrictions`),
      knowledgeHypothesisIds,
    };
  });
  const ids = result.map((row) => row.selectionId);
  if (result.length !== 51 || new Set(ids).size !== 51) throw new Error("adapter registry must contain exactly 51 unique rows");
  if (canonicalJson(ids) !== canonicalJson([...ids].sort())) throw new Error("adapter registry is not lexically ordered");
  return result;
}

function decodeSuccessorBook(bytes: Uint8Array): readonly SuccessorRecord[] {
  if (bytes.byteLength !== PHASE9_SUCCESSOR_TARGET_BOOK_BYTES || sha256Bytes(bytes) !== PHASE9_SUCCESSOR_TARGET_BOOK_SHA256) {
    throw new Error("registered successor target book byte/hash pin differs");
  }
  const rows = parseCanonicalJsonl(bytes, "successor target book");
  const result = rows.map((row, index): SuccessorRecord => {
    exactKeys(row, ["schema", "selectionId", "priorityClass", "phase9EvidenceRole", "split", "binding"], `successor row ${index + 1}`);
    if (row.schema !== "phase8b-successor-target-record-v1" || row.phase9EvidenceRole !== "model-development" || row.split !== "development") {
      throw new Error(`successor row ${index + 1} development identity differs`);
    }
    const selectionId = string(row.selectionId, `successor row ${index + 1}.selectionId`);
    const binding = jsonObject(row.binding, `successor ${selectionId}.binding`);
    const bindingKind = successorBindingKind(binding.kind, `successor ${selectionId}.binding.kind`);
    const metadataRecordId = string(binding.metadataRecordId, `successor ${selectionId}.binding.metadataRecordId`);
    const sourceUnitId = binding.sourceUnitId === undefined
      ? null
      : string(binding.sourceUnitId, `successor ${selectionId}.binding.sourceUnitId`);
    return { raw: row, selectionId, binding, bindingKind, metadataRecordId, sourceUnitId };
  });
  const ids = result.map((row) => row.selectionId);
  if (result.length !== 51 || new Set(ids).size !== 51) throw new Error("successor target book must contain exactly 51 unique rows");
  if (canonicalJson(ids) !== canonicalJson([...ids].sort())) throw new Error("successor target book is not lexically ordered");
  return result;
}

export function validatePhase9AdapterRegistry(
  registryBytes: Uint8Array,
  successorTargetBookBytes: Uint8Array,
): readonly Phase9AdapterRegistryRecord[] {
  const registry = decodeRegistry(registryBytes);
  const successor = decodeSuccessorBook(successorTargetBookBytes);
  exactStringSet(registry.map((row) => row.selectionId), successor.map((row) => row.selectionId), "registry/successor selection coverage");
  const successorById = new Map(successor.map((row) => [row.selectionId, row]));
  for (const row of registry) {
    const pointer = successorById.get(row.selectionId) as SuccessorRecord;
    if (row.bindingKind !== pointer.bindingKind) throw new Error(`registry binding kind differs for ${row.selectionId}`);
    const validPairs: Readonly<Record<Exclude<Phase9BindingKind, "post-phase8-source">, readonly Phase9AdapterKind[]>> = {
      "native-history": ["free-particle-mass", "supported-dimension-rim"],
      "digitized-plot-series": ["gas-pressure-intervention", "planar-facet", "supported-dimension-rim"],
      "direct-bacon-reported-aggregate": ["initiation-aggregate"],
      "terminal-interpretive-dependency": ["interpretive-constraint"],
    };
    if (!validPairs[row.bindingKind].includes(row.adapterKind)) {
      throw new Error(`registry adapter/binding pairing differs for ${row.selectionId}`);
    }
  }
  return registry;
}

function result(
  identity: Phase9AdapterIdentity,
  adapter: Phase9AdapterRegistryRecord | { readonly adapterKind: Phase9AdapterKind; readonly bindingKind: Phase9BindingKind },
  status: Phase9Eligibility,
  reasons: readonly string[],
  conditions: JsonObject,
  uncertainty: JsonObject,
  sourceMetadata: JsonObject,
  observations: readonly Phase9AdaptedObservation[],
): Phase9AdapterResult {
  if (reasons.length === 0 && status !== "eligible") throw new Error("a non-eligible adapter result requires a reason");
  return {
    schema: PHASE9_ADAPTER_RESULT_SCHEMA,
    adapterKind: adapter.adapterKind,
    bindingKind: adapter.bindingKind,
    ...identity,
    status,
    reasons,
    requestedUse: null,
    restrictions: [],
    knowledgeHypothesisIds: [],
    conditions,
    uncertainty,
    sourceMetadata,
    observations,
  };
}

function metadataConditions(metadata: JsonObject): JsonObject {
  return metadata.conditions === undefined ? {} : jsonObject(metadata.conditions, "metadata conditions");
}

function metadataUncertainty(metadata: JsonObject): JsonObject {
  return metadata.uncertainty === undefined
    ? metadata.sourceUncertainty === undefined ? {} : jsonObject(metadata.sourceUncertainty, "metadata source uncertainty")
    : jsonObject(metadata.uncertainty, "metadata uncertainty");
}

function missingSourceResult(
  identity: Phase9AdapterIdentity,
  adapter: Phase9AdapterRegistryRecord,
  reason: string,
  metadata: JsonObject = {},
): Phase9AdapterResult {
  return result(identity, adapter, "source-blocked", [reason], metadataConditions(metadata), metadataUncertainty(metadata), metadata, []);
}

function pathValue(root: JsonObject, path: string): unknown {
  let current: unknown = root;
  for (const part of path.split(".")) {
    if (part.length === 0) return undefined;
    const record = current === null || Array.isArray(current) || typeof current !== "object"
      ? null
      : current as Record<string, unknown>;
    if (record === null || !Object.hasOwn(record, part)) return undefined;
    current = record[part];
  }
  return current;
}

function assertRegisteredMetadataFields(metadata: JsonObject, adapter: Phase9AdapterRegistryRecord): void {
  for (const path of [...adapter.sourceConditionFields, ...adapter.uncertaintyFields]) {
    if (pathValue(metadata, path) === undefined) {
      throw new Error(`${adapter.selectionId} registered metadata field is absent: ${path}`);
    }
  }
}

function applyRegisteredPolicy(
  base: Phase9AdapterResult,
  adapter: Phase9AdapterRegistryRecord,
  requestedPurpose: string | undefined,
): Phase9AdapterResult {
  const requestedUse = requestedPurpose === undefined
    ? adapter.requestedUses[0] as Phase9RequestedUse
    : adapter.requestedUses.find((use) => use.purpose === requestedPurpose);
  if (requestedUse === undefined) {
    return {
      ...base,
      status: "ineligible",
      reasons: [...new Set([...base.reasons, `requested purpose is not registered: ${requestedPurpose}`])],
      requestedUse: null,
      restrictions: adapter.restrictions,
      knowledgeHypothesisIds: adapter.knowledgeHypothesisIds,
    };
  }
  let status: Phase9Eligibility;
  if (base.status === "source-blocked" || base.status === "ineligible") status = base.status;
  else if (requestedUse.status === "source-blocked" || requestedUse.status === "ineligible") status = requestedUse.status;
  else if (base.status === "eligible-with-limitation" || requestedUse.status === "eligible-with-limitation") status = "eligible-with-limitation";
  else status = "eligible";
  return {
    ...base,
    status,
    reasons: [...new Set([...base.reasons, requestedUse.reasonCode, ...adapter.restrictions])],
    requestedUse,
    restrictions: adapter.restrictions,
    knowledgeHypothesisIds: adapter.knowledgeHypothesisIds,
  };
}

function findMetadataRecord(bytes: Uint8Array, pointer: SuccessorRecord): JsonObject {
  const artifact = descriptor(pointer.binding.metadataRecordArtifact, `${pointer.selectionId} metadata descriptor`);
  assertBytes(bytes, artifact, `${pointer.selectionId} metadata artifact`);
  const rows = parseCanonicalJsonl(bytes, `${pointer.selectionId} metadata artifact`);
  const identityField = pointer.bindingKind === "native-history" || pointer.bindingKind === "terminal-interpretive-dependency"
    ? "id"
    : "selectionId";
  const matches = rows.filter((row) => row[identityField] === pointer.metadataRecordId);
  if (matches.length !== 1) throw new Error(`${pointer.selectionId} metadata record identity is missing or duplicated`);
  const metadata = matches[0] as JsonObject;
  const expectedSchema = pointer.bindingKind === "native-history"
    ? "phase8b-native-history-v1"
    : pointer.bindingKind === "digitized-plot-series"
      ? "phase8b-plot-series-record-v1"
      : pointer.bindingKind === "direct-bacon-reported-aggregate"
        ? "phase8b-bacon-aggregate-record-v1"
        : "phase8b-p2-terminal-v1";
  if (metadata.schema !== expectedSchema) throw new Error(`${pointer.selectionId} metadata schema differs`);
  return metadata;
}

function rowArtifact(pointer: SuccessorRecord): ReturnType<typeof descriptor> | null {
  if (pointer.binding.rowArtifact === undefined) return null;
  const value = descriptor(pointer.binding.rowArtifact, `${pointer.selectionId} row descriptor`);
  if (value.logicalRoot === null || value.rowCount === null) throw new Error(`${pointer.selectionId} row descriptor is incomplete`);
  return value;
}

export function phase9RowArtifactKey(
  value: { readonly logicalRoot: string | null; readonly path: string },
): string {
  if (value.logicalRoot === null) throw new Error("row artifact has no logical root");
  if (value.logicalRoot.startsWith("/") || value.path.startsWith("/") || value.logicalRoot.includes("\\") || value.path.includes("\\") ||
      [...value.logicalRoot.split("/"), ...value.path.split("/")].some((part) => part === "" || part === "." || part === "..")) {
    throw new Error("row artifact path is not a safe share-relative POSIX path");
  }
  return `${value.logicalRoot}/${value.path}`;
}

function verifyRowMetadata(pointer: SuccessorRecord, metadata: JsonObject, expected: ReturnType<typeof descriptor>): void {
  const metadataValue = pointer.bindingKind === "native-history" ? metadata.normalized : metadata.rowArtifact;
  const actual = descriptor(metadataValue, `${pointer.selectionId} metadata row descriptor`);
  if (actual.path !== expected.path || actual.byteLength !== expected.byteLength || actual.sha256 !== expected.sha256 ||
      (actual.rowCount !== null && actual.rowCount !== expected.rowCount)) {
    throw new Error(`${pointer.selectionId} metadata and successor row descriptors differ`);
  }
  if (pointer.bindingKind === "native-history") {
    if (metadata.id !== pointer.metadataRecordId || metadata.sourceUnitId !== pointer.sourceUnitId ||
        nonnegativeInteger(metadata.sourceRows, `${pointer.selectionId}.sourceRows`) !== expected.rowCount) {
      throw new Error(`${pointer.selectionId} native metadata identity differs`);
    }
  } else if (metadata.selectionId !== pointer.selectionId || metadata.selectionId !== pointer.metadataRecordId ||
      nonnegativeInteger(metadata.expectedPointCount, `${pointer.selectionId}.expectedPointCount`) !== expected.rowCount) {
    throw new Error(`${pointer.selectionId} plot metadata identity differs`);
  }
}

function parseNativeMass(
  pointer: SuccessorRecord,
  adapter: Phase9AdapterRegistryRecord,
  metadata: JsonObject,
  bytes: Uint8Array,
): Phase9AdapterResult {
  if (metadata.historyKind !== "mass-ratio" || metadata.developmentRole !== "model-development" ||
      metadata.disposition !== "included-native-history") {
    throw new Error(`${pointer.selectionId} native mass metadata contract differs`);
  }
  const normalized = object(metadata.normalized, `${pointer.selectionId}.normalized`);
  const header = string(normalized.header, `${pointer.selectionId}.normalized.header`);
  if (header !== "sourceRowIndex\ttime_s\tmass_ratio" || normalized.sourceLexemesPreserved !== true) {
    throw new Error(`${pointer.selectionId} native mass normalization contract differs`);
  }
  const lines = decodeLf(bytes, `${pointer.selectionId} row body`).slice(0, -1).split("\n");
  if (lines.shift() !== header || lines.length === 0) throw new Error(`${pointer.selectionId} native mass header/body differs`);
  const observations: Phase9AdaptedObservation[] = [];
  let previousTime = -Infinity;
  for (const [index, line] of lines.entries()) {
    const fields = line.split("\t");
    if (fields.length !== 3) throw new Error(`${pointer.selectionId} native mass row ${index + 1} shape differs`);
    const sourceIndex = parseNumberToken(fields[0] as string, `${pointer.selectionId} row ${index + 1} source index`);
    const time = parseNumberToken(fields[1] as string, `${pointer.selectionId} row ${index + 1} time`);
    const massRatio = parseNumberToken(fields[2] as string, `${pointer.selectionId} row ${index + 1} mass ratio`);
    if (sourceIndex.value !== index + 1 || !Number.isInteger(sourceIndex.value) || time.value < 0 || time.value < previousTime || massRatio.value <= 0) {
      throw new Error(`${pointer.selectionId} native mass row ${index + 1} domain differs`);
    }
    observations.push({
      sourceOrdinal: index + 1,
      sourceRowIndexLexeme: sourceIndex.sourceLexeme,
      sourceLine: line,
      values: {
        sourceRowIndex: lexicalJson(sourceIndex),
        timeSeconds: lexicalJson(time),
        massRatio: lexicalJson(massRatio),
      },
      uncertainty: metadataUncertainty(metadata),
      sourceOrderSpan: null,
    });
    previousTime = time.value;
  }
  return result(
    { selectionId: pointer.selectionId, metadataRecordId: pointer.metadataRecordId, sourceUnitId: pointer.sourceUnitId },
    adapter,
    "eligible-with-limitation",
    [
      "the levitated-particle apparatus is not an unqualified free-particle transfer",
      "crystallography and habit were not observed",
      "the source-stated five-percent mass-ratio error is not a probability interval",
    ],
    metadataConditions(metadata),
    metadataUncertainty(metadata),
    metadata,
    observations,
  );
}

const DIMENSION_COLUMNS = [
  "sourceRowIndex",
  "timeSeconds",
  "aUm",
  "cUm",
  "aErrorMinUm",
  "cErrorMinUm",
  "aErrorMaxUm",
  "cErrorMaxUm",
  "rimWidthUm",
  "rimErrorMinUm",
  "rimErrorMaxUm",
] as const;

function parseNativeDimensions(
  pointer: SuccessorRecord,
  adapter: Phase9AdapterRegistryRecord,
  metadata: JsonObject,
  bytes: Uint8Array,
): Phase9AdapterResult {
  if (metadata.historyKind !== "dimensions" || metadata.developmentRole !== "model-development" ||
      metadata.disposition !== "included-native-history") {
    throw new Error(`${pointer.selectionId} native dimension metadata contract differs`);
  }
  const normalized = object(metadata.normalized, `${pointer.selectionId}.normalized`);
  const header = string(normalized.header, `${pointer.selectionId}.normalized.header`);
  const expectedHeader = "sourceRowIndex\ttime_s\ta_um\tc_um\ta_error_min_um\tc_error_min_um\ta_error_max_um\tc_error_max_um\trim_width_um\trim_error_min_um\trim_error_max_um";
  if (header !== expectedHeader || normalized.sourceLexemesPreserved !== true) {
    throw new Error(`${pointer.selectionId} native dimension normalization contract differs`);
  }
  const lines = decodeLf(bytes, `${pointer.selectionId} row body`).slice(0, -1).split("\n");
  if (lines.shift() !== header || lines.length === 0) throw new Error(`${pointer.selectionId} native dimension header/body differs`);
  const observations: Phase9AdaptedObservation[] = [];
  let previousTime = -Infinity;
  for (const [index, line] of lines.entries()) {
    const fields = line.split("\t");
    if (fields.length !== DIMENSION_COLUMNS.length) throw new Error(`${pointer.selectionId} native dimension row ${index + 1} shape differs`);
    const values = fields.map((field, column) => parseNumberToken(field, `${pointer.selectionId} row ${index + 1} column ${column + 1}`));
    if ((values[0] as Phase9LexicalScalar).value !== index + 1 || !Number.isInteger((values[0] as Phase9LexicalScalar).value) ||
        (values[1] as Phase9LexicalScalar).value < previousTime || values.slice(1).some((value) => value.value < 0)) {
      throw new Error(`${pointer.selectionId} native dimension row ${index + 1} domain differs`);
    }
    const adaptedValues: Record<string, StrictJson> = {};
    for (const [column, name] of DIMENSION_COLUMNS.entries()) adaptedValues[name] = lexicalJson(values[column] as Phase9LexicalScalar);
    observations.push({
      sourceOrdinal: index + 1,
      sourceRowIndexLexeme: (values[0] as Phase9LexicalScalar).sourceLexeme,
      sourceLine: line,
      values: adaptedValues,
      uncertainty: metadataUncertainty(metadata),
      sourceOrderSpan: null,
    });
    previousTime = (values[1] as Phase9LexicalScalar).value;
  }
  return result(
    { selectionId: pointer.selectionId, metadataRecordId: pointer.metadataRecordId, sourceUnitId: pointer.sourceUnitId },
    adapter,
    "eligible-with-limitation",
    [
      "the crystal is substrate-supported",
      "the source-reported supersaturation basis is unresolved and is not a solver input",
      "dimension and rim error constructions are not probability intervals and covariance is unreported",
    ],
    metadataConditions(metadata),
    metadataUncertainty(metadata),
    metadata,
    observations,
  );
}

function parsePlotPointRows(pointer: SuccessorRecord, metadata: JsonObject, bytes: Uint8Array): readonly Phase9AdaptedObservation[] {
  if (metadata.phase9EvidenceRole !== "model-development" || metadata.operator !== "phase8b-adjudicated-plot-digitization-v3") {
    throw new Error(`${pointer.selectionId} plot metadata contract differs`);
  }
  const text = decodeLf(bytes, `${pointer.selectionId} plot rows`);
  const lines = text.slice(0, -1).split("\n");
  if (lines.length === 0 || lines.some((line) => line.length === 0)) throw new Error(`${pointer.selectionId} plot body is empty`);
  const observations: Phase9AdaptedObservation[] = [];
  const pointIds = new Set<string>();
  const physicalTargets = new Set<string>();
  for (const [index, line] of lines.entries()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line) as unknown;
    } catch {
      throw new Error(`${pointer.selectionId} plot row ${index + 1} is not JSON`);
    }
    const row = jsonObject(parsed, `${pointer.selectionId} plot row ${index + 1}`);
    if (canonicalJson(row) !== line || row.schema !== "phase8b-plot-point-v1" ||
        row.selectionId !== pointer.selectionId || row.phase9EvidenceRole !== "model-development") {
      throw new Error(`${pointer.selectionId} plot row ${index + 1} identity differs`);
    }
    const pointId = string(row.pointId, `${pointer.selectionId} plot row ${index + 1}.pointId`);
    if (pointIds.has(pointId)) throw new Error(`${pointer.selectionId} duplicates plot point ${pointId}`);
    pointIds.add(pointId);
    const adjudication = jsonObject(row.adjudication, `${pointer.selectionId} ${pointId}.adjudication`);
    const acceptedPixels = jsonObject(adjudication.acceptedPixels, `${pointer.selectionId} ${pointId}.adjudication.acceptedPixels`);
    const physicalTarget = canonicalJson(acceptedPixels);
    if (physicalTargets.has(physicalTarget)) {
      throw new Error(`${pointer.selectionId} duplicates a physical plot target at ${physicalTarget}`);
    }
    physicalTargets.add(physicalTarget);
    const x = jsonObject(row.x, `${pointer.selectionId} ${pointId}.x`);
    const y = jsonObject(row.y, `${pointer.selectionId} ${pointId}.y`);
    for (const [axis, coordinate] of [["x", x], ["y", y]] as const) {
      const value = finite(coordinate.value, `${pointer.selectionId} ${pointId}.${axis}.value`);
      const lower = finite(coordinate.digitizationLower, `${pointer.selectionId} ${pointId}.${axis}.digitizationLower`);
      const upper = finite(coordinate.digitizationUpper, `${pointer.selectionId} ${pointId}.${axis}.digitizationUpper`);
      string(coordinate.variable, `${pointer.selectionId} ${pointId}.${axis}.variable`);
      string(coordinate.unit, `${pointer.selectionId} ${pointId}.${axis}.unit`);
      if (lower > value || value > upper) throw new Error(`${pointer.selectionId} ${pointId}.${axis} interval excludes its value`);
    }
    observations.push({
      sourceOrdinal: index + 1,
      sourceRowIndexLexeme: pointId,
      sourceLine: line,
      values: {
        pointId,
        x,
        y,
        adjudicationStatus: string(row.adjudicationStatus, `${pointer.selectionId} ${pointId}.adjudicationStatus`),
        sourceStatus: string(row.sourceStatus, `${pointer.selectionId} ${pointId}.sourceStatus`),
      },
      uncertainty: {
        digitization: jsonObject(row.digitizationUncertainty, `${pointer.selectionId} ${pointId}.digitizationUncertainty`),
        source: jsonObject(row.sourceUncertainty, `${pointer.selectionId} ${pointId}.sourceUncertainty`),
      },
      sourceOrderSpan: row.sourceOrderSpan === undefined ? null : row.sourceOrderSpan,
    });
  }
  return observations;
}

function plotCoordinateVariables(observations: readonly Phase9AdaptedObservation[]): readonly { readonly x: string; readonly y: string }[] {
  return observations.map((observation) => {
    const x = object(observation.values.x, "adapted plot x");
    const y = object(observation.values.y, "adapted plot y");
    return { x: string(x.variable, "adapted plot x variable"), y: string(y.variable, "adapted plot y variable") };
  });
}

function parsePlotSeries(
  pointer: SuccessorRecord,
  adapter: Phase9AdapterRegistryRecord,
  metadata: JsonObject,
  bytes: Uint8Array,
): Phase9AdapterResult {
  const observations = parsePlotPointRows(pointer, metadata, bytes);
  const variables = plotCoordinateVariables(observations);
  const conditions = metadataConditions(metadata);
  const reasons: string[] = [
    "coordinates are plot digitizations with retained extraction intervals, not exact source-reported values",
  ];
  let compatible = true;

  if (adapter.adapterKind === "planar-facet") {
    compatible = conditions.facet !== undefined && variables.every((pair) => pair.x === "supersaturation" && pair.y === "normal_growth_rate");
    reasons.push(
      "the crystals were substrate-supported at low pressure",
      "the per-series denominator and point dispersion were not reported",
    );
  } else if (adapter.adapterKind === "supported-dimension-rim") {
    const allowedY = new Set([
      "crystal_size",
      "imposed_far_field_supersaturation",
      "plotted_dimension",
      "plotted_height_with_arbitrary_offset",
      "needle_tip_radius",
    ]);
    compatible = variables.every((pair) => (pair.x === "time" || pair.x === "growth_time") && allowedY.has(pair.y));
    reasons.push("the specimen is substrate-supported and cannot be treated as an unsupported crystal");
    if (variables.some((pair) => pair.y === "plotted_height_with_arbitrary_offset")) {
      reasons.push("the plotted height contains a source-declared arbitrary offset and supports changes, not an absolute height origin");
    }
  } else if (adapter.adapterKind === "gas-pressure-intervention") {
    const allowedX = new Set(["carrier_gas_thermal_conductivity", "reported_vapor_diffusivity"]);
    const allowedY = new Set(["mean_a_axis_length", "mean_c_axis_length", "mean_c_to_a_ratio"]);
    compatible = conditions.growthMode === "gravity fall" && typeof conditions.carrierGas === "string" &&
      variables.every((pair) => allowedX.has(pair.x) && allowedY.has(pair.y));
    reasons.push(
      "the free-fall ensemble denominator is not reported",
      "the retained vertical spans are source order statistics, not confidence intervals",
      "gas species, pressure, diffusivity, conductivity, geometry, and history remain separate conditions",
    );
    if (conditions.airPressurePa === undefined && conditions.airPressureBar === undefined) {
      reasons.push("an explicit numeric pressure is absent from this selected series metadata");
    }
  } else {
    throw new Error(`${pointer.selectionId} plot series has unsupported registered adapter ${adapter.adapterKind}`);
  }

  return result(
    { selectionId: pointer.selectionId, metadataRecordId: pointer.metadataRecordId, sourceUnitId: pointer.sourceUnitId },
    adapter,
    compatible ? "eligible-with-limitation" : "ineligible",
    compatible ? reasons : [...reasons, "the selected coordinate variables do not satisfy the registered adapter contract"],
    conditions,
    jsonObject(metadata.sourceUncertainty, `${pointer.selectionId}.sourceUncertainty`),
    metadata,
    observations,
  );
}

function parseInitiationAggregate(
  pointer: SuccessorRecord,
  adapter: Phase9AdapterRegistryRecord,
  metadata: JsonObject,
): Phase9AdapterResult {
  if (metadata.status !== "TERMINAL" || metadata.phase9EvidenceRole !== "model-development" ||
      metadata.disposition !== "terminal-direct-reported-aggregate-development") {
    throw new Error(`${pointer.selectionId} initiation aggregate metadata contract differs`);
  }
  const values = array(metadata.reportedValues, `${pointer.selectionId}.reportedValues`);
  if (values.length === 0) throw new Error(`${pointer.selectionId} has no reported aggregate values`);
  const observations = values.map((value, index): Phase9AdaptedObservation => {
    const row = jsonObject(value, `${pointer.selectionId}.reportedValues[${index}]`);
    return {
      sourceOrdinal: index + 1,
      sourceRowIndexLexeme: null,
      sourceLine: canonicalJson(row),
      values: { reportedValue: row },
      uncertainty: jsonObject(metadata.measurementContext, `${pointer.selectionId}.measurementContext`),
      sourceOrderSpan: null,
    };
  });
  return result(
    { selectionId: pointer.selectionId, metadataRecordId: pointer.metadataRecordId, sourceUnitId: pointer.sourceUnitId },
    adapter,
    "eligible-with-limitation",
    [
      "the ensemble denominator is not reported",
      "the aggregate supports a categorical initiation/history confrontation but not a fitted event frequency",
      "initial size and mass-growth history are not matched well enough to attribute the contrast to initiation alone",
    ],
    jsonObject(metadata.measurementContext, `${pointer.selectionId}.measurementContext`),
    jsonObject(metadata.measurementContext, `${pointer.selectionId}.measurementContext`),
    metadata,
    observations,
  );
}

function parseInterpretiveConstraint(
  pointer: SuccessorRecord,
  adapter: Phase9AdapterRegistryRecord,
  metadata: JsonObject,
): Phase9AdapterResult {
  if (metadata.status !== "TERMINAL" || metadata.evidenceRole !== "model-development") {
    throw new Error(`${pointer.selectionId} interpretive constraint metadata contract differs`);
  }
  const disposition = string(metadata.disposition, `${pointer.selectionId}.disposition`);
  const reasons = [
    string(metadata.unresolvedLimit, `${pointer.selectionId}.unresolvedLimit`),
    disposition === "terminal-source-limited-use-restriction" || disposition === "terminal-standing-source-discrepancy-no-row-level-use"
      ? "the record is usable as its named source limitation, not as the blocked quantitative measurement"
      : "this terminal record is a lineage, supersession, or required-absence control rather than a coordinate measurement",
  ];
  return result(
    { selectionId: pointer.selectionId, metadataRecordId: pointer.metadataRecordId, sourceUnitId: pointer.sourceUnitId },
    adapter,
    "eligible-with-limitation",
    reasons,
    metadata.phase9UseRestriction === undefined ? {} : jsonObject(metadata.phase9UseRestriction, `${pointer.selectionId}.phase9UseRestriction`),
    {},
    metadata,
    [],
  );
}

function adaptBoundSelection(
  pointer: SuccessorRecord,
  adapter: Phase9AdapterRegistryRecord,
  metadataArtifacts: ReadonlyMap<string, Uint8Array>,
  rowArtifacts: ReadonlyMap<string, Uint8Array>,
  requestedPurpose: string | undefined,
): Phase9AdapterResult {
  const identity = {
    selectionId: pointer.selectionId,
    metadataRecordId: pointer.metadataRecordId,
    sourceUnitId: pointer.sourceUnitId,
  };
  const metadataDescriptor = descriptor(pointer.binding.metadataRecordArtifact, `${pointer.selectionId} metadata descriptor`);
  const metadataBytes = metadataArtifacts.get(metadataDescriptor.path);
  if (metadataBytes === undefined) {
    return applyRegisteredPolicy(missingSourceResult(identity, adapter, `metadata artifact is unavailable: ${metadataDescriptor.path}`), adapter, requestedPurpose);
  }
  const metadata = findMetadataRecord(metadataBytes, pointer);
  assertRegisteredMetadataFields(metadata, adapter);
  const finish = (base: Phase9AdapterResult): Phase9AdapterResult => applyRegisteredPolicy(base, adapter, requestedPurpose);

  if (pointer.bindingKind === "direct-bacon-reported-aggregate") return finish(parseInitiationAggregate(pointer, adapter, metadata));
  if (pointer.bindingKind === "terminal-interpretive-dependency") return finish(parseInterpretiveConstraint(pointer, adapter, metadata));

  const rowDescriptor = rowArtifact(pointer);
  if (rowDescriptor === null) throw new Error(`${pointer.selectionId} row-bearing binding has no row descriptor`);
  verifyRowMetadata(pointer, metadata, rowDescriptor);
  const key = phase9RowArtifactKey(rowDescriptor);
  const rowBytes = rowArtifacts.get(key);
  if (rowBytes === undefined) return finish(missingSourceResult(identity, adapter, `row artifact is unavailable: ${key}`, metadata));
  assertBytes(rowBytes, rowDescriptor, `${pointer.selectionId} row artifact`);
  const actualRows = decodeLf(rowBytes, `${pointer.selectionId} row artifact`).slice(0, -1).split("\n").length -
    (pointer.bindingKind === "native-history" ? 1 : 0);
  if (actualRows !== rowDescriptor.rowCount) throw new Error(`${pointer.selectionId} row count differs from its byte binding`);

  if (pointer.bindingKind === "native-history") {
    if (adapter.adapterKind === "free-particle-mass") return finish(parseNativeMass(pointer, adapter, metadata, rowBytes));
    if (adapter.adapterKind === "supported-dimension-rim") return finish(parseNativeDimensions(pointer, adapter, metadata, rowBytes));
    throw new Error(`${pointer.selectionId} native adapter kind differs`);
  }
  return finish(parsePlotSeries(pointer, adapter, metadata, rowBytes));
}

export function adaptPhase9MeasurementCorpus(inputs: Phase9MeasurementCorpusInputs): readonly Phase9AdapterResult[] {
  const registry = validatePhase9AdapterRegistry(
    inputs.registryBytes,
    inputs.successorTargetBookBytes,
  );
  const pointers = decodeSuccessorBook(inputs.successorTargetBookBytes);
  const registrationById = new Map(registry.map((row) => [row.selectionId, row]));
  if (inputs.requestedPurposes !== undefined) {
    exactStringSet(
      [...inputs.requestedPurposes.keys()].filter((id) => registrationById.has(id)),
      [...inputs.requestedPurposes.keys()],
      "requested-purpose selection IDs",
    );
  }
  return pointers.map((pointer) => adaptBoundSelection(
    pointer,
    registrationById.get(pointer.selectionId) as Phase9AdapterRegistryRecord,
    inputs.metadataArtifacts,
    inputs.rowArtifacts,
    inputs.requestedPurposes?.get(pointer.selectionId),
  ));
}

// Post-Phase8 schemas parse structured values from hash-bound canonical JSONL. No post-Phase8
// policy registry is frozen in v1, so a semantically usable row remains source-blocked. A future
// v2 registry may promote a use by pinning both its source bytes and claim-specific policy; callers
// cannot self-authorize that promotion through this API.

export interface Phase9PostPhase8SourceInput {
  readonly binding: Phase9AdapterIdentity & {
    readonly descriptor: {
      readonly byteLength: number;
      readonly format: "canonical-jsonl";
      readonly path: string;
      readonly sha256: string;
    };
  };
  readonly sourceBytes?: Uint8Array;
}

interface ParsedPostSource {
  readonly identity: Phase9AdapterIdentity;
  readonly rows: readonly JsonObject[] | null;
  readonly sourceMetadata: JsonObject;
}

const POST_SOURCE_POLICY_BLOCK =
  "no digest-pinned Phase 9 post-Phase8 adapter policy is frozen; source parsing does not authorize a quantitative use";

function parsePostSource(
  input: Phase9PostPhase8SourceInput,
  expectedSchema: string,
  extraKeys: readonly string[],
): ParsedPostSource {
  const identity: Phase9AdapterIdentity = {
    selectionId: string(input.binding.selectionId, "post-Phase8 selectionId"),
    metadataRecordId: string(input.binding.metadataRecordId, "post-Phase8 metadataRecordId"),
    sourceUnitId: input.binding.sourceUnitId === null
      ? null
      : string(input.binding.sourceUnitId, "post-Phase8 sourceUnitId"),
  };
  const bound = input.binding.descriptor;
  const sourceDescriptor = {
    byteLength: nonnegativeInteger(bound.byteLength, "post-Phase8 descriptor byteLength"),
    format: bound.format,
    path: string(bound.path, "post-Phase8 descriptor path"),
    sha256: sha256(bound.sha256, "post-Phase8 descriptor sha256"),
  } as const;
  if (sourceDescriptor.format !== "canonical-jsonl") throw new Error("post-Phase8 source format differs");
  const sourceMetadata: JsonObject = {
    policyStatus: "unregistered-post-phase8",
    sourceDescriptor,
  };
  if (input.sourceBytes === undefined) return { identity, rows: null, sourceMetadata };
  assertBytes(input.sourceBytes, sourceDescriptor, "post-Phase8 source artifact");
  const rows = parseCanonicalJsonl(input.sourceBytes, "post-Phase8 source artifact");
  const expectedKeys = [
    "conditions", "metadataRecordId", "schema", "selectionId", "sourceOrdinal",
    "sourceRowId", "sourceUnitId", "uncertainty", ...extraKeys,
  ];
  const sourceRowIds = new Set<string>();
  for (const [index, row] of rows.entries()) {
    exactKeys(row, expectedKeys, `post-Phase8 row ${index + 1}`);
    if (row.schema !== expectedSchema || row.selectionId !== identity.selectionId ||
        row.metadataRecordId !== identity.metadataRecordId || row.sourceUnitId !== identity.sourceUnitId) {
      throw new Error(`post-Phase8 row ${index + 1} identity differs`);
    }
    if (nonnegativeInteger(row.sourceOrdinal, `post-Phase8 row ${index + 1}.sourceOrdinal`) !== index + 1) {
      throw new Error(`post-Phase8 row ${index + 1} source order differs`);
    }
    const sourceRowId = string(row.sourceRowId, `post-Phase8 row ${index + 1}.sourceRowId`);
    if (sourceRowIds.has(sourceRowId)) throw new Error(`post-Phase8 source duplicates row ID ${sourceRowId}`);
    sourceRowIds.add(sourceRowId);
    jsonObject(row.conditions, `post-Phase8 row ${index + 1}.conditions`);
    jsonObject(row.uncertainty, `post-Phase8 row ${index + 1}.uncertainty`);
  }
  return { identity, rows, sourceMetadata };
}

function postSourceResult(
  parsed: ParsedPostSource,
  adapterKind: Phase9AdapterKind,
  status: Phase9Eligibility,
  reasons: readonly string[],
  observations: readonly Phase9AdaptedObservation[],
): Phase9AdapterResult {
  const rowConditions = parsed.rows === null ? [] : parsed.rows.map((row) => row.conditions as StrictJson);
  const rowUncertainty = parsed.rows === null ? [] : parsed.rows.map((row) => row.uncertainty as StrictJson);
  return result(
    parsed.identity,
    { adapterKind, bindingKind: "post-phase8-source" },
    status,
    reasons,
    { rowConditions },
    { rowUncertainty },
    parsed.sourceMetadata,
    observations,
  );
}

function missingPostSource(parsed: ParsedPostSource, adapterKind: Phase9AdapterKind): Phase9AdapterResult {
  return postSourceResult(parsed, adapterKind, "source-blocked", [
    "the registered post-Phase8 source artifact bytes are unavailable",
    POST_SOURCE_POLICY_BLOCK,
  ], []);
}

function postObservation(row: JsonObject, values: JsonObject, sourceOrderSpan: StrictJson = null): Phase9AdaptedObservation {
  return {
    sourceOrdinal: row.sourceOrdinal as number,
    sourceRowIndexLexeme: row.sourceRowId as string,
    sourceLine: canonicalJson(row),
    values,
    uncertainty: row.uncertainty as JsonObject,
    sourceOrderSpan,
  };
}

function boundScalar(row: JsonObject, stem: string, label: string): Phase9LexicalScalar {
  const lexeme = string(row[`${stem}Lexeme`], `${label}.${stem}Lexeme`);
  const claimedValue = finite(row[`${stem}Value`], `${label}.${stem}Value`);
  const parsed = parseNumberToken(lexeme, `${label}.${stem}Lexeme`);
  if (!Object.is(parsed.value, claimedValue)) throw new Error(`${label}.${stem} lexeme/value differ`);
  return parsed;
}

function physicalDuplicate(seen: Set<string>, key: StrictJson, label: string): void {
  const encoded = canonicalJson(key);
  if (seen.has(encoded)) throw new Error(`${label} duplicates a physical target`);
  seen.add(encoded);
}

export function adaptPhase9CategoricalIntervention(input: Phase9PostPhase8SourceInput): Phase9AdapterResult {
  const parsed = parsePostSource(input, "phase9-categorical-intervention-row-v1", [
    "denominator", "groupLabel", "intervention", "outcomeCount",
  ]);
  if (parsed.rows === null) return missingPostSource(parsed, "categorical-intervention");
  const physical = new Set<string>();
  let denominatorMissing = false;
  const observations = parsed.rows.map((row, index) => {
    const intervention = string(row.intervention, `categorical row ${index + 1}.intervention`);
    const groupLabel = string(row.groupLabel, `categorical row ${index + 1}.groupLabel`);
    const denominator = row.denominator === null ? null : nonnegativeInteger(row.denominator, `categorical row ${index + 1}.denominator`);
    const outcomeCount = row.outcomeCount === null ? null : nonnegativeInteger(row.outcomeCount, `categorical row ${index + 1}.outcomeCount`);
    if ((denominator === null) !== (outcomeCount === null)) throw new Error(`categorical row ${index + 1} count pair differs`);
    if (denominator === null) denominatorMissing = true;
    else if (denominator === 0 || (outcomeCount as number) > denominator) throw new Error(`categorical row ${index + 1} count domain differs`);
    physicalDuplicate(physical, { groupLabel, intervention }, `categorical row ${index + 1}`);
    return postObservation(row, { denominator, groupLabel, intervention, outcomeCount });
  });
  if (physical.size < 2) {
    return postSourceResult(parsed, "categorical-intervention", "ineligible", [
      "fewer than two distinct categorical groups are present, so no intervention contrast exists",
    ], observations);
  }
  return postSourceResult(parsed, "categorical-intervention", "source-blocked", [
    ...(denominatorMissing ? ["at least one categorical group lacks its quantitative denominator"] : []),
    POST_SOURCE_POLICY_BLOCK,
  ], observations);
}

export function adaptPhase9CategoricalAtlas(input: Phase9PostPhase8SourceInput): Phase9AdapterResult {
  const parsed = parsePostSource(input, "phase9-categorical-atlas-row-v1", ["atlasId", "category", "codebook", "panelId"]);
  if (parsed.rows === null) return missingPostSource(parsed, "categorical-atlas");
  const physical = new Set<string>();
  let canonicalCodebook: string | null = null;
  let codebookMissing = false;
  let unknownCategory = false;
  const observations = parsed.rows.map((row, index) => {
    const atlasId = string(row.atlasId, `atlas row ${index + 1}.atlasId`);
    const panelId = string(row.panelId, `atlas row ${index + 1}.panelId`);
    const category = string(row.category, `atlas row ${index + 1}.category`);
    const codebook = row.codebook === null ? null : stringArray(row.codebook, `atlas row ${index + 1}.codebook`);
    if (codebook === null) codebookMissing = true;
    else {
      const encoded = canonicalJson(codebook);
      canonicalCodebook ??= encoded;
      if (encoded !== canonicalCodebook) throw new Error("categorical atlas rows disagree on the frozen codebook");
      if (!codebook.includes(category)) unknownCategory = true;
    }
    physicalDuplicate(physical, { atlasId, panelId }, `atlas row ${index + 1}`);
    return postObservation(row, { atlasId, category, codebook, panelId });
  });
  const status: Phase9Eligibility = unknownCategory ? "ineligible" : "source-blocked";
  return postSourceResult(parsed, "categorical-atlas", status, [
    ...(codebookMissing ? ["at least one atlas row lacks the frozen morphology codebook"] : []),
    ...(unknownCategory ? ["an atlas category is absent from the frozen codebook"] : [POST_SOURCE_POLICY_BLOCK]),
  ], observations);
}

export function adaptPhase9GasPressureIntervention(input: Phase9PostPhase8SourceInput): Phase9AdapterResult {
  const parsed = parsePostSource(input, "phase9-gas-pressure-row-v1", [
    "gas", "outcomeLexeme", "outcomeUnit", "outcomeValue", "outcomeVariable",
    "pressurePa", "sourceOrderSpan", "transportKind", "transportLexeme", "transportUnit",
    "transportValue",
  ]);
  if (parsed.rows === null) return missingPostSource(parsed, "gas-pressure-intervention");
  const physical = new Set<string>();
  let pressureMissing = false;
  const observations = parsed.rows.map((row, index) => {
    const gas = string(row.gas, `gas/pressure row ${index + 1}.gas`);
    const pressurePa = row.pressurePa === null ? null : finite(row.pressurePa, `gas/pressure row ${index + 1}.pressurePa`);
    if (pressurePa === null) pressureMissing = true;
    else if (!(pressurePa > 0)) throw new Error(`gas/pressure row ${index + 1} pressure domain differs`);
    const transportKind = string(row.transportKind, `gas/pressure row ${index + 1}.transportKind`);
    if (transportKind !== "vapor-diffusivity" && transportKind !== "thermal-conductivity") {
      throw new Error(`gas/pressure row ${index + 1} transport kind differs`);
    }
    const transportUnit = string(row.transportUnit, `gas/pressure row ${index + 1}.transportUnit`);
    const expectedTransportUnit = transportKind === "vapor-diffusivity" ? "m2/s" : "W/(m K)";
    if (transportUnit !== expectedTransportUnit) {
      throw new Error(`gas/pressure row ${index + 1} transport unit differs`);
    }
    const outcomeVariable = string(row.outcomeVariable, `gas/pressure row ${index + 1}.outcomeVariable`);
    const outcomeUnit = string(row.outcomeUnit, `gas/pressure row ${index + 1}.outcomeUnit`);
    const transport = boundScalar(row, "transport", `gas/pressure row ${index + 1}`);
    const outcome = boundScalar(row, "outcome", `gas/pressure row ${index + 1}`);
    if (!(transport.value > 0)) throw new Error(`gas/pressure row ${index + 1} transport domain differs`);
    physicalDuplicate(physical, {
      conditions: row.conditions, gas, outcomeUnit, outcomeVariable, pressurePa,
      transport: transport.value, transportKind, transportUnit,
    }, `gas/pressure row ${index + 1}`);
    return postObservation(row, {
      gas, outcome: lexicalJson(outcome), outcomeUnit, outcomeVariable, pressurePa,
      transport: lexicalJson(transport), transportKind, transportUnit,
    }, row.sourceOrderSpan as StrictJson);
  });
  if (physical.size < 2) {
    return postSourceResult(parsed, "gas-pressure-intervention", "ineligible", ["fewer than two distinct intervention conditions are present"], observations);
  }
  return postSourceResult(parsed, "gas-pressure-intervention", "source-blocked", [
    ...(pressureMissing ? ["at least one intervention row lacks an explicit numeric pressure"] : []),
    POST_SOURCE_POLICY_BLOCK,
  ], observations);
}

export function adaptPhase9FreeFallEnsemble(input: Phase9PostPhase8SourceInput): Phase9AdapterResult {
  const parsed = parsePostSource(input, "phase9-free-fall-ensemble-row-v1", [
    "airSpeedMps", "carrierGas", "ensembleDenominator", "orientation", "outcomeLexeme",
    "outcomeUnit", "outcomeValue", "outcomeVariable", "pressurePa", "reynoldsNumber", "sourceOrderSpan",
  ]);
  if (parsed.rows === null) return missingPostSource(parsed, "free-fall-ensemble");
  const physical = new Set<string>();
  let ventilationMissing = false;
  let denominatorMissing = false;
  const observations = parsed.rows.map((row, index) => {
    const carrierGas = string(row.carrierGas, `free-fall row ${index + 1}.carrierGas`);
    const pressurePa = row.pressurePa === null ? null : finite(row.pressurePa, `free-fall row ${index + 1}.pressurePa`);
    if (pressurePa !== null && !(pressurePa > 0)) throw new Error(`free-fall row ${index + 1} pressure domain differs`);
    const airSpeedMps = row.airSpeedMps === null ? null : finite(row.airSpeedMps, `free-fall row ${index + 1}.airSpeedMps`);
    const reynoldsNumber = row.reynoldsNumber === null ? null : finite(row.reynoldsNumber, `free-fall row ${index + 1}.reynoldsNumber`);
    if ((airSpeedMps !== null && airSpeedMps < 0) || (reynoldsNumber !== null && reynoldsNumber < 0)) {
      throw new Error(`free-fall row ${index + 1} ventilation domain differs`);
    }
    if (airSpeedMps === null && reynoldsNumber === null) ventilationMissing = true;
    const ensembleDenominator = row.ensembleDenominator === null
      ? null
      : nonnegativeInteger(row.ensembleDenominator, `free-fall row ${index + 1}.ensembleDenominator`);
    if (ensembleDenominator === null) denominatorMissing = true;
    else if (ensembleDenominator === 0) throw new Error(`free-fall row ${index + 1} denominator domain differs`);
    const orientation = string(row.orientation, `free-fall row ${index + 1}.orientation`);
    const outcomeVariable = string(row.outcomeVariable, `free-fall row ${index + 1}.outcomeVariable`);
    const outcomeUnit = string(row.outcomeUnit, `free-fall row ${index + 1}.outcomeUnit`);
    const outcome = boundScalar(row, "outcome", `free-fall row ${index + 1}`);
    physicalDuplicate(physical, { airSpeedMps, carrierGas, conditions: row.conditions, orientation, outcomeVariable, pressurePa, reynoldsNumber }, `free-fall row ${index + 1}`);
    return postObservation(row, {
      airSpeedMps, carrierGas, ensembleDenominator, orientation, outcome: lexicalJson(outcome),
      outcomeUnit, outcomeVariable, pressurePa, reynoldsNumber,
    }, row.sourceOrderSpan as StrictJson);
  });
  return postSourceResult(parsed, "free-fall-ensemble", "source-blocked", [
    ...(ventilationMissing ? ["at least one free-fall row lacks air speed and Reynolds number"] : []),
    ...(denominatorMissing ? ["at least one free-fall row lacks its ensemble denominator"] : []),
    POST_SOURCE_POLICY_BLOCK,
  ], observations);
}

export function adaptPhase9SpatialRoughness(input: Phase9PostPhase8SourceInput): Phase9AdapterResult {
  const parsed = parsePostSource(input, "phase9-spatial-roughness-row-v1", [
    "observable", "positionLexeme", "positionUnit", "positionValue", "state",
    "timeLexeme", "timeValue", "valueLexeme", "valueUnit", "valueValue",
  ]);
  if (parsed.rows === null) return missingPostSource(parsed, "spatial-roughness");
  const allowed = new Set(["rim-width", "surface-roughness", "lateral-facet-state"]);
  const physical = new Set<string>();
  let previousTime = -Infinity;
  let unsupported = false;
  const observations = parsed.rows.map((row, index) => {
    const observable = string(row.observable, `spatial row ${index + 1}.observable`);
    if (!allowed.has(observable)) unsupported = true;
    const time = boundScalar(row, "time", `spatial row ${index + 1}`);
    const position = boundScalar(row, "position", `spatial row ${index + 1}`);
    const value = boundScalar(row, "value", `spatial row ${index + 1}`);
    if (time.value < 0 || time.value < previousTime) throw new Error(`spatial row ${index + 1} time domain differs`);
    const state = string(row.state, `spatial row ${index + 1}.state`);
    const positionUnit = string(row.positionUnit, `spatial row ${index + 1}.positionUnit`);
    const valueUnit = string(row.valueUnit, `spatial row ${index + 1}.valueUnit`);
    physicalDuplicate(physical, { observable, position: position.value, state, time: time.value }, `spatial row ${index + 1}`);
    previousTime = time.value;
    return postObservation(row, {
      observable, position: lexicalJson(position), positionUnit, state,
      time: lexicalJson(time), value: lexicalJson(value), valueUnit,
    });
  });
  return postSourceResult(parsed, "spatial-roughness", unsupported ? "ineligible" : "source-blocked", [
    ...(unsupported ? ["an observable is not registered for the spatial/roughness adapter"] : [POST_SOURCE_POLICY_BLOCK]),
  ], observations);
}

type SublimationClaim = "negative-drive-response" | "sublimation-rate" | "growth-sublimation-regrowth";

export function adaptPhase9Sublimation(input: Phase9PostPhase8SourceInput): Phase9AdapterResult {
  const parsed = parsePostSource(input, "phase9-sublimation-row-v1", [
    "claimPurpose", "driveLexeme", "driveValue", "rateLexeme", "rateValue", "timeLexeme", "timeValue",
  ]);
  if (parsed.rows === null) return missingPostSource(parsed, "sublimation");
  const physical = new Set<string>();
  let previousTime = -Infinity;
  let claimPurpose: SublimationClaim | null = null;
  const signs: number[] = [];
  const pairs: { readonly drive: number; readonly rate: number }[] = [];
  const observations = parsed.rows.map((row, index) => {
    const purpose = string(row.claimPurpose, `sublimation row ${index + 1}.claimPurpose`) as SublimationClaim;
    if (purpose !== "negative-drive-response" && purpose !== "sublimation-rate" && purpose !== "growth-sublimation-regrowth") {
      throw new Error(`sublimation row ${index + 1} claim purpose differs`);
    }
    claimPurpose ??= purpose;
    if (purpose !== claimPurpose) throw new Error("sublimation rows mix claim purposes");
    const time = boundScalar(row, "time", `sublimation row ${index + 1}`);
    const drive = boundScalar(row, "drive", `sublimation row ${index + 1}`);
    const rate = boundScalar(row, "rate", `sublimation row ${index + 1}`);
    if (time.value < 0 || time.value < previousTime) throw new Error(`sublimation row ${index + 1} time domain differs`);
    physicalDuplicate(physical, { time: time.value }, `sublimation row ${index + 1}`);
    previousTime = time.value;
    signs.push(Math.sign(rate.value));
    pairs.push({ drive: drive.value, rate: rate.value });
    return postObservation(row, { claimPurpose: purpose, drive: lexicalJson(drive), rate: lexicalJson(rate), time: lexicalJson(time) });
  });
  const resolvedClaim = string(parsed.rows[0]?.claimPurpose, "sublimation claim purpose") as SublimationClaim;
  const hasNegativeDrive = pairs.some((pair) => pair.drive < 0);
  const hasSublimationPair = pairs.some((pair) => pair.drive < 0 && pair.rate < 0);
  const firstGrowth = signs.findIndex((sign) => sign > 0);
  const firstLoss = signs.findIndex((sign, index) => index > firstGrowth && sign < 0);
  const regrowth = signs.findIndex((sign, index) => index > firstLoss && sign > 0);
  const supportsClaim = resolvedClaim === "negative-drive-response"
    ? hasNegativeDrive
    : resolvedClaim === "sublimation-rate"
      ? hasSublimationPair
      : firstGrowth >= 0 && firstLoss > firstGrowth && regrowth > firstLoss;
  const hasSignConflict = resolvedClaim === "sublimation-rate" && pairs.some((pair) => pair.drive >= 0 && pair.rate < 0);
  return postSourceResult(parsed, "sublimation", !supportsClaim || hasSignConflict ? "ineligible" : "source-blocked", [
    ...(!supportsClaim ? [`the source rows do not support the registered ${resolvedClaim} claim semantics`] : []),
    ...(hasSignConflict ? ["a negative rate occurs without negative driving supersaturation in a sublimation-rate claim"] : []),
    ...(supportsClaim && !hasSignConflict ? [POST_SOURCE_POLICY_BLOCK] : []),
  ], observations);
}
