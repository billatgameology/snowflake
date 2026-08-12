// Phase 8B S6/S7 — lean metadata-only benchmark assembly.
//
// This producer does not copy measurement rows. It validates the frozen selection against the
// independently verifiable P0/P1 publications and the terminal P2 records, then emits one pointer
// record per selected item. Its report is deliberately only a candidate: the separate verifier
// owns the publication verdict and re-runs both row-level verifiers from source/NAS bytes.

import { randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
  type StrictJson,
} from "./gate4-evidence.ts";

export const PHASE8_BENCHMARK_FINAL_OPERATOR = "phase8b-benchmark-final-v1" as const;
export const PHASE8_BENCHMARK_FINAL_ARTIFACTS = [
  "artifact-index.json",
  "report.json",
  "successor-target-book.jsonl",
] as const;

export const PHASE8_BENCHMARK_FINAL_PATHS = {
  historicalSelection: "evidence/phase8b-benchmark-selection-v1/selection.jsonl",
  selection: "evidence/phase8b-benchmark-selection-v2/selection.jsonl",
  backlog: "evidence/phase8b-benchmark-selection-v2/backlog.json",
  selectionReport: "evidence/phase8b-benchmark-selection-v2/report.json",
  native: "evidence/phase8b-native-histories-v1",
  bacon: "evidence/phase8b-bacon-seed-history-v1",
  p2: "evidence/phase8b-p2-terminal-v1",
  targeted: "research/phase8b-targeted-gap-and-currency.md",
  auditRegistration: "research/phase8b-residual-audit-registration.md",
  auditCorrectionRegistration: "research/phase8b-residual-audit-correction-registration.md",
  auditResult: "research/phase8b-residual-audit-result.md",
  phase9Plan: "docs/plans/phase-9-modular-physics-arms.md",
} as const;

const REGISTERED_SELECTION_SHA256 = "d4d883b321949155e4ca462b594c6a443acd233719bc8f8c5ffc17e694516537";
const REGISTERED_AUDIT_REGISTRATION_SHA256 = "0235f013dcf91d6c0d05cc115ad00ba68ba967c8725f4cfb9b7b9ff392c39220";
const NATIVE_NAMES = ["artifact-index.json", "operator.json", "records.jsonl", "report.json"] as const;
const PLOT_NAMES = ["artifact-index.json", "operator.json", "records.jsonl", "report.json"] as const;
const BACON_NAMES = ["artifact-index.json", "records.jsonl", "report.json"] as const;
const P2_NAMES = ["artifact-index.json", "records.jsonl", "report.json"] as const;
const HP25_ID = "P8B-P2-HP25-SOURCE-SEMANTICS";
const HP25_ALLOWED = "dimension-versus-time and source-labelled change-point development analysis";
const HP25_FORBIDDEN =
  "conversion of 48 or 20 percent to solver sigmaInfinity, inferred supersaturation uncertainty, or absolute forcing-response score";
const HP25_UPGRADE = "acquire and inspect the first-report Methods before lifting this restriction";
const BACON_MISSED_CONTAINER_ID = "P8B-CONT-755B3746D3762F0BD610671A";
const AUDIT_REPLACEMENT_CONTAINER_ID = "P8B-CONT-0F75A9EA97A42AE73A947340";

type JsonObject = { readonly [key: string]: StrictJson };

export interface Phase8BenchmarkFinalInputs {
  readonly scope: "registered-20260812" | "test-fixture";
  readonly historicalSelectionBytes: Uint8Array;
  readonly selectionBytes: Uint8Array;
  readonly backlogBytes: Uint8Array;
  readonly selectionReportBytes: Uint8Array;
  readonly nativeMetadata: ReadonlyMap<string, Uint8Array>;
  readonly plotMetadataLogicalRoot: string;
  readonly plotMetadata: ReadonlyMap<string, Uint8Array>;
  readonly baconMetadata: ReadonlyMap<string, Uint8Array>;
  readonly p2Metadata: ReadonlyMap<string, Uint8Array>;
  readonly targetedGapCurrencyBytes: Uint8Array;
  readonly residualAuditRegistrationBytes: Uint8Array;
  readonly residualAuditCorrectionRegistrationBytes: Uint8Array;
  readonly residualAuditResultBytes: Uint8Array;
  readonly phase9PlanBytes: Uint8Array;
}

export interface Phase8BenchmarkFinalBundle {
  readonly artifacts: ReadonlyMap<string, Uint8Array>;
  readonly counts: {
    readonly selectedRecords: 51;
    readonly p0: 18;
    readonly p1: 28;
    readonly p2: 5;
    readonly development: 51;
    readonly heldOut: 0;
    readonly nativeRows: number;
    readonly plotPoints: number;
    readonly p2CoordinateRows: 0;
  };
}

interface SelectionRecord {
  readonly id: string;
  readonly priorityClass: "P0" | "P1" | "P2";
  readonly phase9EvidenceRole: "model-development";
  readonly sourceUnitId?: string;
}

interface PointerRecord extends JsonObject {
  readonly schema: "phase8b-successor-target-record-v1";
  readonly selectionId: string;
  readonly priorityClass: "P0" | "P1" | "P2";
  readonly phase9EvidenceRole: "model-development";
  readonly split: "development";
  readonly binding: JsonObject;
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function array(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a nonempty string`);
  return value;
}

function nonnegativeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative integer`);
  }
  return value;
}

function sha256(value: unknown, label: string): string {
  const result = string(value, label);
  if (!/^[0-9a-f]{64}$/.test(result)) throw new Error(`${label} must be a lowercase SHA-256`);
  return result;
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

function parseJsonl(bytes: Uint8Array, label: string): readonly Record<string, unknown>[] {
  const text = decodeLf(bytes, label);
  const lines = text.slice(0, -1).split("\n");
  if (lines.length === 0 || lines.some((line) => line.length === 0)) throw new Error(`${label} has an empty row`);
  return lines.map((line, index) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line) as unknown;
    } catch {
      throw new Error(`${label} row ${index + 1} is not JSON`);
    }
    const row = object(parsed, `${label} row ${index + 1}`);
    if (canonicalJson(row) !== line) throw new Error(`${label} row ${index + 1} is not canonical JSON`);
    return row;
  });
}

function canonicalJsonl(rows: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function exactNames(actual: Iterable<string>, expected: readonly string[], label: string): void {
  const left = [...actual].sort();
  const right = [...expected].sort();
  if (canonicalJson(left) !== canonicalJson(right)) throw new Error(`${label} file set differs`);
}

function safeLogicalRoot(value: string, label: string): void {
  if (value.length === 0 || isAbsolute(value) || value.includes("\\") ||
      value.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new Error(`${label} must be a safe repository-relative POSIX path`);
  }
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function descriptor(path: string, bytes: Uint8Array, format: string): JsonObject {
  return { path, format, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function descriptorFields(value: unknown, label: string): { readonly path: string; readonly byteLength: number; readonly sha256: string } {
  const row = object(value, label);
  const byteLength = row.byteLength === undefined
    ? nonnegativeInteger(row.bytes, `${label}.bytes`)
    : nonnegativeInteger(row.byteLength, `${label}.byteLength`);
  return { path: string(row.path, `${label}.path`), byteLength, sha256: sha256(row.sha256, `${label}.sha256`) };
}

function assertDescriptor(value: unknown, expected: { readonly path: string; readonly byteLength: number; readonly sha256: string }, label: string): void {
  const actual = descriptorFields(value, label);
  if (actual.path !== expected.path || actual.byteLength !== expected.byteLength || actual.sha256 !== expected.sha256) {
    throw new Error(`${label} differs`);
  }
}

function parseSelection(inputs: Phase8BenchmarkFinalInputs): readonly SelectionRecord[] {
  const rows = parseJsonl(inputs.selectionBytes, "selection.jsonl");
  const result = rows.map((row, index): SelectionRecord => {
    const id = string(row.id, `selection row ${index + 1}.id`);
    if (row.schema !== "phase8b-benchmark-selection-v1") throw new Error(`selection ${id} row schema differs`);
    const priority = string(row.priorityClass, `selection ${id}.priorityClass`);
    if (priority !== "P0" && priority !== "P1" && priority !== "P2") throw new Error(`selection ${id} priority differs`);
    if (row.phase9EvidenceRole !== "model-development") throw new Error(`selection ${id} is not model development`);
    if (row.numericTargetCoordinatesExtractedBeforeSelection !== false || row.outcomeValueUsedAsSelectionCriterion !== false) {
      throw new Error(`selection ${id} violates the outcome-neutral freeze`);
    }
    let sourceUnitId: string | undefined;
    if (priority === "P0") {
      const source = object(row.source, `selection ${id}.source`);
      sourceUnitId = string(source.sourceUnitId, `selection ${id}.source.sourceUnitId`);
      const expectedId = `P8B-P0-${sourceUnitId.replace(/^P8B-UNIT-/, "")}`;
      if (id !== expectedId) throw new Error(`selection ${id} does not bind its source-unit identity`);
    }
    return { id, priorityClass: priority, phase9EvidenceRole: "model-development", ...(sourceUnitId === undefined ? {} : { sourceUnitId }) };
  });
  const ids = result.map((row) => row.id);
  if (new Set(ids).size !== ids.length) throw new Error("selection contains a duplicate ID");
  if (canonicalJson(ids) !== canonicalJson([...ids].sort())) throw new Error("selection IDs are not lexically ordered");
  const count = (priority: string): number => result.filter((row) => row.priorityClass === priority).length;
  if (result.length !== 51 || count("P0") !== 18 || count("P1") !== 28 || count("P2") !== 5) {
    throw new Error("selection coverage must be exactly P0=18 P1=28 P2=5");
  }
  return result;
}

function validateSelectionLineage(inputs: Phase8BenchmarkFinalInputs, current: readonly SelectionRecord[]): void {
  if (inputs.scope === "registered-20260812" && sha256Bytes(inputs.historicalSelectionBytes) !== REGISTERED_SELECTION_SHA256) {
    throw new Error("historical v1 selection hash differs");
  }
  const historicalRows = parseJsonl(inputs.historicalSelectionBytes, "historical selection-v1.jsonl");
  if (historicalRows.length !== 49) throw new Error("historical v1 selection count differs");
  const currentById = new Map(current.map((row) => [row.id, row]));
  for (const row of historicalRows) {
    const id = string(row.id, "historical selection ID");
    if (row.schema !== "phase8b-benchmark-selection-v1") throw new Error(`historical selection ${id} schema differs`);
    const currentRow = currentById.get(id);
    if (currentRow === undefined || currentRow.priorityClass !== row.priorityClass || row.phase9EvidenceRole !== "model-development") {
      throw new Error(`current selection does not preserve historical selection ${id}`);
    }
  }
  const backlog = object(parseCanonicalJson(inputs.backlogBytes, "backlog.json"), "backlog.json");
  if (backlog.schema !== "phase8b-benchmark-backlog-v2" || backlog.operator !== "phase8b-priority-selection-v2") {
    throw new Error("backlog identity differs");
  }
  const report = object(parseCanonicalJson(inputs.selectionReportBytes, "selection-v2 report.json"), "selection-v2 report");
  const counts = object(report.counts, "selection-v2 report counts");
  if (report.schema !== "phase8b-benchmark-selection-report-v2" || report.operator !== "phase8b-priority-selection-v2" ||
      nonnegativeInteger(counts.p0, "selection-v2 p0") !== 18 || nonnegativeInteger(counts.p1, "selection-v2 p1") !== 28 ||
      nonnegativeInteger(counts.p2, "selection-v2 p2") !== 5) {
    throw new Error("selection-v2 report identity or counts differ");
  }
  const descriptors = array(report.artifacts, "selection-v2 report artifacts");
  for (const [path, bytes] of [["selection.jsonl", inputs.selectionBytes], ["backlog.json", inputs.backlogBytes]] as const) {
    const matches = descriptors.filter((value) => object(value, "selection-v2 descriptor").path === path);
    if (matches.length !== 1) throw new Error(`selection-v2 report lacks one ${path} descriptor`);
    assertDescriptor(matches[0], { path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) }, `selection-v2 ${path}`);
  }
}

function validateMetadataGraph(
  metadata: ReadonlyMap<string, Uint8Array>,
  names: readonly string[],
  indexMetadataDescriptors: readonly unknown[],
  label: string,
): void {
  exactNames(metadata.keys(), names, label);
  for (const name of names.filter((name) => name !== "artifact-index.json")) {
    const bytes = metadata.get(name) as Uint8Array;
    const expected = { path: name, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
    const candidates = indexMetadataDescriptors.filter((value) => object(value, `${label} descriptor`).path === name);
    if (candidates.length !== 1) throw new Error(`${label} index lacks one descriptor for ${name}`);
    assertDescriptor(candidates[0], expected, `${label} ${name} descriptor`);
  }
}

function nativePointers(inputs: Phase8BenchmarkFinalInputs, selection: readonly SelectionRecord[]): {
  readonly pointers: readonly PointerRecord[];
  readonly rowCount: number;
} {
  exactNames(inputs.nativeMetadata.keys(), NATIVE_NAMES, "native metadata");
  const index = object(parseCanonicalJson(inputs.nativeMetadata.get("artifact-index.json") as Uint8Array, "native artifact-index.json"), "native index");
  if (index.schema !== "phase8b-native-history-index-v1" || index.operator !== "phase8b-native-full-history-v1") {
    throw new Error("native index identity differs");
  }
  validateMetadataGraph(inputs.nativeMetadata, NATIVE_NAMES, array(index.metadataArtifacts, "native metadataArtifacts"), "native metadata");
  const nasDescriptors = array(index.nasDataArtifacts, "native nasDataArtifacts");
  const recordsBytes = inputs.nativeMetadata.get("records.jsonl") as Uint8Array;
  const records = parseJsonl(recordsBytes, "native records.jsonl");
  if (records.length !== 18) throw new Error("native record count differs");
  const bySourceUnit = new Map<string, Record<string, unknown>>();
  let rowCount = 0;
  for (const record of records) {
    const sourceUnitId = string(record.sourceUnitId, "native sourceUnitId");
    if (bySourceUnit.has(sourceUnitId)) throw new Error(`native duplicate source unit ${sourceUnitId}`);
    if (record.schema !== "phase8b-native-history-v1" || record.priorityClass !== "P0" ||
        record.developmentRole !== "model-development" || record.disposition !== "included-native-history") {
      throw new Error(`native record ${sourceUnitId} identity or development role differs`);
    }
    const sourceRows = nonnegativeInteger(record.sourceRows, `native ${sourceUnitId}.sourceRows`);
    if (sourceRows === 0) throw new Error(`native ${sourceUnitId} has no source rows`);
    const normalized = object(record.normalized, `native ${sourceUnitId}.normalized`);
    const path = string(normalized.path, `native ${sourceUnitId}.normalized.path`);
    const rowArtifact = {
      path,
      byteLength: nonnegativeInteger(normalized.byteLength, `native ${sourceUnitId}.normalized.byteLength`),
      sha256: sha256(normalized.sha256, `native ${sourceUnitId}.normalized.sha256`),
    };
    const matches = nasDescriptors.filter((value) => object(value, "native NAS descriptor").path === path);
    if (matches.length !== 1) throw new Error(`native ${sourceUnitId} lacks one NAS row binding`);
    assertDescriptor(matches[0], rowArtifact, `native ${sourceUnitId} NAS row binding`);
    rowCount += sourceRows;
    bySourceUnit.set(sourceUnitId, record);
  }
  const selected = selection.filter((row) => row.priorityClass === "P0");
  exactNames(bySourceUnit.keys(), selected.map((row) => row.sourceUnitId as string), "P0 source-unit coverage");
  const report = object(parseCanonicalJson(inputs.nativeMetadata.get("report.json") as Uint8Array, "native report.json"), "native report");
  const counts = object(report.counts, "native report counts");
  if (report.schema !== "phase8b-native-history-report-v1" || report.operator !== "phase8b-native-full-history-v1" ||
      report.grantsValidationClaim !== false || report.permitsPhase9Execution !== false ||
      nonnegativeInteger(counts.historyCount, "native historyCount") !== 18 ||
      nonnegativeInteger(counts.rowCount, "native rowCount") !== rowCount) {
    throw new Error("native report identity, claim boundary, or counts differ");
  }
  if (inputs.scope === "registered-20260812" && rowCount !== 252_134) throw new Error("registered native row total differs");
  const recordsArtifact = descriptor(
    `${PHASE8_BENCHMARK_FINAL_PATHS.native}/records.jsonl`,
    recordsBytes,
    "canonical-jsonl",
  );
  const pointers = selected.map((selectedRow): PointerRecord => {
    const record = bySourceUnit.get(selectedRow.sourceUnitId as string) as Record<string, unknown>;
    const normalized = object(record.normalized, `native ${selectedRow.id}.normalized`);
    return {
      schema: "phase8b-successor-target-record-v1",
      selectionId: selectedRow.id,
      priorityClass: "P0",
      phase9EvidenceRole: "model-development",
      split: "development",
      binding: {
        kind: "native-history",
        metadataRecordId: string(record.id, `native ${selectedRow.id}.id`),
        sourceUnitId: selectedRow.sourceUnitId as string,
        metadataRecordArtifact: recordsArtifact,
        rowArtifact: {
          logicalRoot: string(normalized.logicalRoot, `native ${selectedRow.id}.logicalRoot`),
          path: string(normalized.path, `native ${selectedRow.id}.path`),
          byteLength: nonnegativeInteger(normalized.byteLength, `native ${selectedRow.id}.byteLength`),
          sha256: sha256(normalized.sha256, `native ${selectedRow.id}.sha256`),
          rowCount: nonnegativeInteger(record.sourceRows, `native ${selectedRow.id}.sourceRows`),
        },
      },
    };
  });
  return { pointers, rowCount };
}

function plotPointers(inputs: Phase8BenchmarkFinalInputs, selection: readonly SelectionRecord[]): {
  readonly pointers: readonly PointerRecord[];
  readonly pointCount: number;
  readonly selectionIds: ReadonlySet<string>;
} {
  exactNames(inputs.plotMetadata.keys(), PLOT_NAMES, "plot metadata");
  const index = object(parseCanonicalJson(inputs.plotMetadata.get("artifact-index.json") as Uint8Array, "plot artifact-index.json"), "plot index");
  const operator = string(index.operator, "plot index operator");
  if (index.schema !== "phase8b-plot-artifact-index-v1" || !operator.includes("plot") || !operator.includes("digitization")) {
    throw new Error("plot index identity differs");
  }
  const allDescriptors = array(index.artifacts, "plot artifacts");
  validateMetadataGraph(inputs.plotMetadata, PLOT_NAMES, allDescriptors, "plot metadata");
  const recordsBytes = inputs.plotMetadata.get("records.jsonl") as Uint8Array;
  const records = parseJsonl(recordsBytes, "plot records.jsonl");
  if (records.length !== 26) throw new Error("plot series count differs");
  const bySelection = new Map<string, Record<string, unknown>>();
  let pointCount = 0;
  for (const record of records) {
    const selectionId = string(record.selectionId, "plot selectionId");
    if (bySelection.has(selectionId)) throw new Error(`plot duplicate selection ${selectionId}`);
    if (record.schema !== "phase8b-plot-series-record-v1" || record.operator !== operator ||
        record.phase9EvidenceRole !== "model-development") {
      throw new Error(`plot record ${selectionId} identity or development role differs`);
    }
    const rowArtifactObject = object(record.rowArtifact, `plot ${selectionId}.rowArtifact`);
    const rowArtifact = {
      path: string(rowArtifactObject.path, `plot ${selectionId}.rowArtifact.path`),
      byteLength: nonnegativeInteger(rowArtifactObject.bytes, `plot ${selectionId}.rowArtifact.bytes`),
      sha256: sha256(rowArtifactObject.sha256, `plot ${selectionId}.rowArtifact.sha256`),
    };
    const rowCount = nonnegativeInteger(rowArtifactObject.rowCount, `plot ${selectionId}.rowArtifact.rowCount`);
    if (rowCount === 0 || rowCount !== nonnegativeInteger(record.expectedPointCount, `plot ${selectionId}.expectedPointCount`)) {
      throw new Error(`plot ${selectionId} row count differs from the registered count`);
    }
    const matches = allDescriptors.filter((value) => object(value, "plot descriptor").path === rowArtifact.path);
    if (matches.length !== 1) throw new Error(`plot ${selectionId} lacks one NAS row binding`);
    assertDescriptor(matches[0], rowArtifact, `plot ${selectionId} NAS row binding`);
    pointCount += rowCount;
    bySelection.set(selectionId, record);
  }
  const selected = selection.filter((row) => row.priorityClass === "P1" && bySelection.has(row.id));
  exactNames(bySelection.keys(), selected.map((row) => row.id), "original P1 selection coverage");
  const report = object(parseCanonicalJson(inputs.plotMetadata.get("report.json") as Uint8Array, "plot report.json"), "plot report");
  const counts = object(report.counts, "plot report counts");
  if (report.schema !== "phase8b-plot-extraction-report-v1" || report.operator !== operator ||
      report.status !== "candidate-awaiting-independent-verification" || report.phase9EvidenceRole !== "model-development" ||
      nonnegativeInteger(counts.seriesCount, "plot report seriesCount") !== 26 ||
      nonnegativeInteger(counts.pointCount, "plot report pointCount") !== pointCount) {
    throw new Error("plot report identity, candidate state, role, or counts differ");
  }
  if (inputs.scope === "registered-20260812" && pointCount !== 431) throw new Error("registered plot point total differs");
  const dataLogicalRoot = string(report.dataLogicalRoot, "plot report dataLogicalRoot");
  const recordsArtifact = descriptor(
    `${inputs.plotMetadataLogicalRoot}/records.jsonl`,
    recordsBytes,
    "canonical-jsonl",
  );
  const pointers = selected.map((selectedRow): PointerRecord => {
    const record = bySelection.get(selectedRow.id) as Record<string, unknown>;
    const row = object(record.rowArtifact, `plot ${selectedRow.id}.rowArtifact`);
    return {
      schema: "phase8b-successor-target-record-v1",
      selectionId: selectedRow.id,
      priorityClass: "P1",
      phase9EvidenceRole: "model-development",
      split: "development",
      binding: {
        kind: "digitized-plot-series",
        metadataRecordId: selectedRow.id,
        metadataRecordArtifact: recordsArtifact,
        rowArtifact: {
          logicalRoot: dataLogicalRoot,
          path: string(row.path, `plot ${selectedRow.id}.path`),
          byteLength: nonnegativeInteger(row.bytes, `plot ${selectedRow.id}.bytes`),
          sha256: sha256(row.sha256, `plot ${selectedRow.id}.sha256`),
          rowCount: nonnegativeInteger(row.rowCount, `plot ${selectedRow.id}.rowCount`),
        },
      },
    };
  });
  return { pointers, pointCount, selectionIds: new Set(bySelection.keys()) };
}

function baconP1Pointers(
  inputs: Phase8BenchmarkFinalInputs,
  selection: readonly SelectionRecord[],
  existingP1Ids: ReadonlySet<string>,
): readonly PointerRecord[] {
  exactNames(inputs.baconMetadata.keys(), BACON_NAMES, "Bacon metadata");
  const index = object(parseCanonicalJson(inputs.baconMetadata.get("artifact-index.json") as Uint8Array, "Bacon artifact-index.json"), "Bacon index");
  const schema = string(index.schema, "Bacon index schema");
  if (!schema.toLowerCase().includes("bacon")) throw new Error("Bacon index identity differs");
  const descriptors = array(index.artifacts, "Bacon artifacts");
  validateMetadataGraph(inputs.baconMetadata, BACON_NAMES, descriptors, "Bacon metadata");
  const recordsBytes = inputs.baconMetadata.get("records.jsonl") as Uint8Array;
  const records = parseJsonl(recordsBytes, "Bacon records.jsonl");
  if (records.length !== 2) throw new Error("Bacon supplement record count differs");
  const byId = new Map<string, Record<string, unknown>>();
  for (const record of records) {
    const id = string(record.selectionId, "Bacon supplement selection ID");
    const numeric = object(record.numericExtraction, `Bacon ${id}.numericExtraction`);
    if (byId.has(id) || record.schema !== "phase8b-bacon-aggregate-record-v1" ||
        record.recordKind !== "phase8b-bacon-aggregate-measurement-set" || record.priorityClass !== "P1" ||
        record.phase9EvidenceRole !== "model-development" ||
        record.disposition !== "terminal-direct-reported-aggregate-development" ||
        numeric.coordinatesExtracted !== false || numeric.plotDigitizationPerformed !== false ||
        numeric.printedAggregateValuesTranscribed !== true ||
        nonnegativeInteger(numeric.targetCoordinateRowCount, `Bacon ${id}.targetCoordinateRowCount`) !== 0) {
      throw new Error(`Bacon ${id} identity, uniqueness, or role differs`);
    }
    if (record.status !== "TERMINAL") throw new Error(`Bacon ${id} terminal state differs`);
    byId.set(id, record);
  }
  const selected = selection.filter((row) => row.priorityClass === "P1" && !existingP1Ids.has(row.id));
  exactNames(byId.keys(), selected.map((row) => row.id), "Bacon P1 selection coverage");
  const report = object(parseCanonicalJson(inputs.baconMetadata.get("report.json") as Uint8Array, "Bacon report.json"), "Bacon report");
  const counts = object(report.counts, "Bacon report counts");
  if (nonnegativeInteger(counts.records, "Bacon record count") !== 2 ||
      nonnegativeInteger(counts.directMeasurementSets, "Bacon direct measurement sets") !== 2 ||
      nonnegativeInteger(counts.reportedNumericAggregates, "Bacon numeric aggregates") !== 4 ||
      nonnegativeInteger(counts.contextualQualitativeFindings, "Bacon qualitative findings") !== 2 ||
      nonnegativeInteger(counts.numericCoordinateRows, "Bacon coordinate rows") !== 0 ||
      nonnegativeInteger(counts.derivativeClassificationRows, "Bacon derivative rows") !== 93 ||
      nonnegativeInteger(counts.derivativeSolidRows, "Bacon derivative solid rows") !== 71 ||
      nonnegativeInteger(counts.derivativeFloridRows, "Bacon derivative florid rows") !== 22) {
    throw new Error("Bacon report counts differ");
  }
  const metadataRecordArtifact = descriptor(`${PHASE8_BENCHMARK_FINAL_PATHS.bacon}/records.jsonl`, recordsBytes, "canonical-jsonl");
  return selected.map((row): PointerRecord => {
    const record = byId.get(row.id) as Record<string, unknown>;
    return {
      schema: "phase8b-successor-target-record-v1",
      selectionId: row.id,
      priorityClass: "P1",
      phase9EvidenceRole: "model-development",
      split: "development",
      binding: {
        kind: "direct-bacon-reported-aggregate",
        metadataRecordId: row.id,
        metadataRecordArtifact,
        disposition: string(record.disposition, `Bacon ${row.id}.disposition`),
      },
    };
  });
}

function p2Pointers(inputs: Phase8BenchmarkFinalInputs, selection: readonly SelectionRecord[]): {
  readonly pointers: readonly PointerRecord[];
} {
  exactNames(inputs.p2Metadata.keys(), P2_NAMES, "P2 metadata");
  const index = object(parseCanonicalJson(inputs.p2Metadata.get("artifact-index.json") as Uint8Array, "P2 artifact-index.json"), "P2 index");
  if (index.schema !== "phase8b-p2-terminal-index-v1") throw new Error("P2 index identity differs");
  validateMetadataGraph(inputs.p2Metadata, P2_NAMES, array(index.artifacts, "P2 artifacts"), "P2 metadata");
  const recordsBytes = inputs.p2Metadata.get("records.jsonl") as Uint8Array;
  const records = parseJsonl(recordsBytes, "P2 records.jsonl");
  if (records.length !== 5) throw new Error("P2 record count differs");
  const byId = new Map<string, Record<string, unknown>>();
  for (const record of records) {
    const id = string(record.id, "P2 record id");
    if (byId.has(id)) throw new Error(`P2 duplicate ID ${id}`);
    const numeric = object(record.numericExtraction, `P2 ${id}.numericExtraction`);
    if (record.schema !== "phase8b-p2-terminal-v1" || record.recordKind !== "phase8b-p2-terminal-record" ||
        record.status !== "TERMINAL" || record.evidenceRole !== "model-development" ||
        numeric.coordinatesExtracted !== false || nonnegativeInteger(numeric.targetCoordinateRowCount, `P2 ${id}.targetCoordinateRowCount`) !== 0) {
      throw new Error(`P2 ${id} is not terminal model-development metadata with zero coordinates`);
    }
    byId.set(id, record);
  }
  const selected = selection.filter((row) => row.priorityClass === "P2");
  exactNames(byId.keys(), selected.map((row) => row.id), "P2 selection coverage");
  const hp25 = byId.get(HP25_ID);
  if (hp25 === undefined || hp25.disposition !== "terminal-source-limited-use-restriction" ||
      hp25.loadBearingStatus !== "not-load-bearing-under-terminal-use-restriction") {
    throw new Error("HP25 source-limited terminal state differs");
  }
  const restriction = object(hp25.phase9UseRestriction, "HP25 phase9UseRestriction");
  if (restriction.allowed !== HP25_ALLOWED || restriction.forbidden !== HP25_FORBIDDEN || restriction.upgrade !== HP25_UPGRADE) {
    throw new Error("HP25 source-limited restriction differs");
  }
  const report = object(parseCanonicalJson(inputs.p2Metadata.get("report.json") as Uint8Array, "P2 report.json"), "P2 report");
  const counts = object(report.counts, "P2 report counts");
  if (report.schema !== "phase8b-p2-terminal-report-v1" ||
      nonnegativeInteger(counts.p2Records, "P2 report p2Records") !== 5 ||
      nonnegativeInteger(counts.terminal, "P2 report terminal") !== 5 ||
      nonnegativeInteger(counts.numericCoordinateRows, "P2 report numericCoordinateRows") !== 0 ||
      nonnegativeInteger(counts.sourceLimitedTerminal, "P2 report sourceLimitedTerminal") !== 1) {
    throw new Error("P2 report identity or counts differ");
  }
  const recordsArtifact = descriptor(
    `${PHASE8_BENCHMARK_FINAL_PATHS.p2}/records.jsonl`,
    recordsBytes,
    "canonical-jsonl",
  );
  const pointers = selected.map((selectedRow): PointerRecord => {
    const record = byId.get(selectedRow.id) as Record<string, unknown>;
    return {
      schema: "phase8b-successor-target-record-v1",
      selectionId: selectedRow.id,
      priorityClass: "P2",
      phase9EvidenceRole: "model-development",
      split: "development",
      binding: {
        kind: "terminal-interpretive-dependency",
        metadataRecordId: selectedRow.id,
        metadataRecordArtifact: recordsArtifact,
        disposition: string(record.disposition, `P2 ${selectedRow.id}.disposition`),
        status: "TERMINAL",
        coordinateRowCount: 0,
        ...(selectedRow.id === HP25_ID ? {
          phase9UseRestriction: {
            allowed: HP25_ALLOWED,
            forbidden: HP25_FORBIDDEN,
            upgrade: HP25_UPGRADE,
          },
        } : {}),
      },
    };
  });
  return { pointers };
}

function validateTextRecords(inputs: Phase8BenchmarkFinalInputs): void {
  const targeted = decodeLf(inputs.targetedGapCurrencyBytes, "targeted gap/currency record");
  for (const required of [
    "**Outcome:** terminal for Phase 8B; bounded, not a claim of global literature saturation",
    "No included P0/P1 numeric source remains unlocated or unverified.",
    "ready for Phase 9 **development experiments**, not held-out",
    "Do not convert `48%` or `20%` to solver `sigmaInfinity`",
  ]) {
    if (!targeted.includes(required)) throw new Error(`targeted gap/currency record lacks required boundary: ${required}`);
  }
  if (inputs.scope === "registered-20260812" &&
      sha256Bytes(inputs.residualAuditRegistrationBytes) !== REGISTERED_AUDIT_REGISTRATION_SHA256) {
    throw new Error("registered residual-audit registration hash differs");
  }
  const registration = decodeLf(inputs.residualAuditRegistrationBytes, "residual-audit registration");
  const sampleIds = registration.split("\n").flatMap((line) => {
    const match = /^\| (?:local-container|acquired-context-exclude|captured-clear-exclude) \| `([^`]+)`/.exec(line);
    return match === null ? [] : [match[1] as string];
  });
  if (sampleIds.length !== 9 || new Set(sampleIds).size !== 9) throw new Error("residual-audit registration sample differs");
  const result = decodeLf(inputs.residualAuditResultBytes, "residual-audit result");
  for (const id of sampleIds) if (!result.includes(id)) throw new Error(`residual-audit result omits registered sample ${id}`);
  if (!result.includes(BACON_MISSED_CONTAINER_ID) || !/\bBacon\b/iu.test(result) ||
      !/(?:\bmiss(?:es)?\s*:\s*1\b|\bone (?:benchmark )?miss\b)/iu.test(result)) {
    throw new Error("residual-audit result must truthfully report the one Bacon benchmark miss");
  }
  const correction = decodeLf(inputs.residualAuditCorrectionRegistrationBytes, "residual-audit correction registration");
  if (!correction.includes(BACON_MISSED_CONTAINER_ID) || !correction.includes(AUDIT_REPLACEMENT_CONTAINER_ID) ||
      !correction.includes("1211.5555v1.pdf") || !correction.includes("all eight still-residual records")) {
    throw new Error("residual-audit correction registration identity or corrected-sample rule differs");
  }
  if (!result.includes(AUDIT_REPLACEMENT_CONTAINER_ID) ||
      !/(?:corrected|replacement)[\s\S]{0,300}\bzero misses\b/iu.test(result)) {
    throw new Error("residual-audit result lacks the registered replacement review and corrected zero-miss result");
  }
  const plan = decodeLf(inputs.phase9PlanBytes, "Phase 9 plan");
  for (const required of [
    "not chartered and not authorized for execution",
    "All 51 selected P0/P1/P2 records are model development",
    "no held-out",
    "may not be converted to solver",
  ]) {
    if (!plan.includes(required)) throw new Error(`Phase 9 plan lacks required inherited boundary: ${required}`);
  }
}

function sourceArtifactDescriptors(inputs: Phase8BenchmarkFinalInputs): readonly JsonObject[] {
  const result: JsonObject[] = [
    descriptor(PHASE8_BENCHMARK_FINAL_PATHS.historicalSelection, inputs.historicalSelectionBytes, "canonical-jsonl"),
    descriptor(PHASE8_BENCHMARK_FINAL_PATHS.selection, inputs.selectionBytes, "canonical-jsonl"),
    descriptor(PHASE8_BENCHMARK_FINAL_PATHS.backlog, inputs.backlogBytes, "canonical-json"),
    descriptor(PHASE8_BENCHMARK_FINAL_PATHS.selectionReport, inputs.selectionReportBytes, "canonical-json"),
    descriptor(PHASE8_BENCHMARK_FINAL_PATHS.targeted, inputs.targetedGapCurrencyBytes, "markdown"),
    descriptor(PHASE8_BENCHMARK_FINAL_PATHS.auditRegistration, inputs.residualAuditRegistrationBytes, "markdown"),
    descriptor(PHASE8_BENCHMARK_FINAL_PATHS.auditCorrectionRegistration, inputs.residualAuditCorrectionRegistrationBytes, "markdown"),
    descriptor(PHASE8_BENCHMARK_FINAL_PATHS.auditResult, inputs.residualAuditResultBytes, "markdown"),
    descriptor(PHASE8_BENCHMARK_FINAL_PATHS.phase9Plan, inputs.phase9PlanBytes, "markdown"),
  ];
  for (const [root, metadata] of [
    [PHASE8_BENCHMARK_FINAL_PATHS.native, inputs.nativeMetadata],
    [inputs.plotMetadataLogicalRoot, inputs.plotMetadata],
    [PHASE8_BENCHMARK_FINAL_PATHS.bacon, inputs.baconMetadata],
    [PHASE8_BENCHMARK_FINAL_PATHS.p2, inputs.p2Metadata],
  ] as const) {
    for (const [name, bytes] of metadata) result.push(descriptor(`${root}/${name}`, bytes, name.endsWith(".jsonl") ? "canonical-jsonl" : "canonical-json"));
  }
  return result.sort((left, right) => String(left.path) < String(right.path) ? -1 : 1);
}

/** Build the exact metadata-only candidate. No producer field can assert independent success. */
export function derivePhase8BenchmarkFinalBundle(inputs: Phase8BenchmarkFinalInputs): Phase8BenchmarkFinalBundle {
  safeLogicalRoot(inputs.plotMetadataLogicalRoot, "plot metadata logical root");
  const selection = parseSelection(inputs);
  validateSelectionLineage(inputs, selection);
  const native = nativePointers(inputs, selection);
  const plot = plotPointers(inputs, selection);
  const p2 = p2Pointers(inputs, selection);
  const bacon = baconP1Pointers(inputs, selection, plot.selectionIds);
  validateTextRecords(inputs);
  const pointers = [...native.pointers, ...plot.pointers, ...bacon, ...p2.pointers]
    .sort((left, right) => left.selectionId < right.selectionId ? -1 : 1);
  if (pointers.length !== 51 || new Set(pointers.map((row) => row.selectionId)).size !== 51) {
    throw new Error("successor target book does not have one pointer per selection");
  }
  const targetBytes = canonicalJsonl(pointers);
  const counts = {
    selectedRecords: 51 as const,
    p0: 18 as const,
    p1: 28 as const,
    p2: 5 as const,
    development: 51 as const,
    heldOut: 0 as const,
    nativeRows: native.rowCount,
    plotPoints: plot.pointCount,
    p2CoordinateRows: 0 as const,
  };
  const report: JsonObject = {
    schema: "phase8b-benchmark-final-report-v1",
    operator: PHASE8_BENCHMARK_FINAL_OPERATOR,
    scope: inputs.scope,
    state: "candidate-awaiting-independent-verification",
    counts,
    split: {
      developmentRecordCount: 51,
      heldOutRecordCount: 0,
      rule: "every Phase 8B selection shaped the Phase 9 draft and remains model development",
      futureConfirmation: "requires genuinely unused evidence frozen before its values are inspected",
    },
    hp25SourceLimitedRestriction: {
      recordId: HP25_ID,
      allowed: HP25_ALLOWED,
      forbidden: HP25_FORBIDDEN,
      upgrade: HP25_UPGRADE,
      loadBearingStatus: "not-load-bearing-under-terminal-use-restriction",
    },
    residualAuditRemediation: {
      registeredSampleRecords: 9,
      detectedMisses: 1,
      detectedContainerId: BACON_MISSED_CONTAINER_ID,
      successorSelectionIds: bacon.map((row) => row.selectionId),
      remediatedMisses: 1,
      unresolvedMisses: 0,
      correctedSampleRecords: 9,
      correctedSampleMisses: 0,
      replacementContainerId: AUDIT_REPLACEMENT_CONTAINER_ID,
      rule: "preserve the failed audit result; closure comes from Bacon promotion plus the registered replacement review and corrected zero-miss sample",
    },
    claimBoundary: {
      grantsValidationClaim: false,
      claimsGlobalLiteratureClosure: false,
      permitsPhase9Execution: false,
      runsOrScoresModel: false,
      producerSuppliesIndependentPass: false,
    },
    limitations: [
      "this is a metadata-only pointer book; P0 and P1 row bodies remain NAS-local",
      "all 51 records are model development and none is held out",
      "the result is benchmark-ready for development experiments, not quantitative validation",
      "Phase 9 remains unchartered and unauthorized until a maker-approved ADR and charter amendment",
      "independent publication status belongs only to the separate final verifier",
    ],
    sourceArtifacts: sourceArtifactDescriptors(inputs),
    successorTargetBook: descriptor("successor-target-book.jsonl", targetBytes, "canonical-jsonl"),
  };
  const reportBytes = canonicalJsonBytes(report);
  const index: JsonObject = {
    schema: "phase8b-benchmark-final-index-v1",
    operator: PHASE8_BENCHMARK_FINAL_OPERATOR,
    artifacts: [
      descriptor("report.json", reportBytes, "canonical-json"),
      descriptor("successor-target-book.jsonl", targetBytes, "canonical-jsonl"),
    ],
  };
  const artifacts = new Map<string, Uint8Array>([
    ["artifact-index.json", canonicalJsonBytes(index)],
    ["report.json", reportBytes],
    ["successor-target-book.jsonl", targetBytes],
  ]);
  return { artifacts, counts };
}

function readRegular(path: string, label: string): Uint8Array {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} is not a regular non-symlink file`);
  return new Uint8Array(readFileSync(path));
}

function readMetadataDirectory(root: string, names: readonly string[], label: string): ReadonlyMap<string, Uint8Array> {
  exactNames(readdirSync(root), names, label);
  return new Map(names.map((name) => [name, readRegular(join(root, name), `${label}/${name}`)]));
}

export function capturePhase8BenchmarkFinalInputs(
  repositoryRoot: string,
  plotMetadataLogicalRoot: string,
  scope: Phase8BenchmarkFinalInputs["scope"] = "registered-20260812",
): Phase8BenchmarkFinalInputs {
  const root = resolve(repositoryRoot);
  safeLogicalRoot(plotMetadataLogicalRoot, "plot metadata root");
  const plotRoot = resolve(root, plotMetadataLogicalRoot);
  const displacement = plotRoot.slice(root.length);
  if (!displacement.startsWith(sep)) throw new Error("plot metadata root leaves the repository");
  return {
    scope,
    historicalSelectionBytes: readRegular(join(root, PHASE8_BENCHMARK_FINAL_PATHS.historicalSelection), "historical selection-v1"),
    selectionBytes: readRegular(join(root, PHASE8_BENCHMARK_FINAL_PATHS.selection), "selection"),
    backlogBytes: readRegular(join(root, PHASE8_BENCHMARK_FINAL_PATHS.backlog), "backlog"),
    selectionReportBytes: readRegular(join(root, PHASE8_BENCHMARK_FINAL_PATHS.selectionReport), "selection-v2 report"),
    nativeMetadata: readMetadataDirectory(join(root, PHASE8_BENCHMARK_FINAL_PATHS.native), NATIVE_NAMES, "native metadata"),
    plotMetadataLogicalRoot,
    plotMetadata: readMetadataDirectory(plotRoot, PLOT_NAMES, "plot metadata"),
    baconMetadata: readMetadataDirectory(join(root, PHASE8_BENCHMARK_FINAL_PATHS.bacon), BACON_NAMES, "Bacon metadata"),
    p2Metadata: readMetadataDirectory(join(root, PHASE8_BENCHMARK_FINAL_PATHS.p2), P2_NAMES, "P2 metadata"),
    targetedGapCurrencyBytes: readRegular(join(root, PHASE8_BENCHMARK_FINAL_PATHS.targeted), "targeted gap/currency record"),
    residualAuditRegistrationBytes: readRegular(join(root, PHASE8_BENCHMARK_FINAL_PATHS.auditRegistration), "residual-audit registration"),
    residualAuditCorrectionRegistrationBytes: readRegular(
      join(root, PHASE8_BENCHMARK_FINAL_PATHS.auditCorrectionRegistration),
      "residual-audit correction registration",
    ),
    residualAuditResultBytes: readRegular(join(root, PHASE8_BENCHMARK_FINAL_PATHS.auditResult), "residual-audit result"),
    phase9PlanBytes: readRegular(join(root, PHASE8_BENCHMARK_FINAL_PATHS.phase9Plan), "Phase 9 plan"),
  };
}

export function writePhase8BenchmarkFinalDirectory(directory: string, bundle: Phase8BenchmarkFinalBundle): void {
  exactNames(bundle.artifacts.keys(), PHASE8_BENCHMARK_FINAL_ARTIFACTS, "final bundle");
  if (existsSync(directory)) throw new Error(`refusing to overwrite existing final bundle: ${directory}`);
  const parent = dirname(resolve(directory));
  mkdirSync(parent, { recursive: true });
  const staging = join(parent, `.${basename(directory)}.staging-${randomUUID()}`);
  mkdirSync(staging);
  try {
    for (const [name, bytes] of bundle.artifacts) writeFileSync(join(staging, name), bytes, { flag: "wx" });
    renameSync(staging, resolve(directory));
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

function usage(): never {
  throw new Error(
    "usage: node runner/src/phase8-benchmark-final.ts produce --repository-root ROOT " +
    "--plot-metadata-root REPOSITORY_RELATIVE_PATH --bundle DIRECTORY",
  );
}

function main(argv: readonly string[]): void {
  if (argv[0] !== "produce") usage();
  const values = new Map<string, string>();
  const allowed = new Set(["--repository-root", "--plot-metadata-root", "--bundle"]);
  for (let index = 1; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === undefined || value === undefined || !allowed.has(key) || values.has(key)) usage();
    values.set(key, value);
  }
  exactNames(values.keys(), [...allowed], "CLI arguments");
  const repositoryRoot = values.get("--repository-root");
  const bundleDirectory = values.get("--bundle");
  const plotMetadataRoot = values.get("--plot-metadata-root");
  if (repositoryRoot === undefined || bundleDirectory === undefined || plotMetadataRoot === undefined) usage();
  const bundle = derivePhase8BenchmarkFinalBundle(capturePhase8BenchmarkFinalInputs(repositoryRoot, plotMetadataRoot));
  writePhase8BenchmarkFinalDirectory(bundleDirectory, bundle);
  process.stdout.write(`${canonicalJson({ state: "candidate-awaiting-independent-verification", counts: bundle.counts })}\n`);
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
