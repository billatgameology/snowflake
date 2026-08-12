// Phase 8B S7 — independent verifier for the metadata-only benchmark assembly.
//
// This module intentionally does not import the final producer. It reconstructs the complete
// pointer book, report and index from their source artifacts, byte-compares the publication, and
// then invokes the existing native-history and plot-extraction verifiers on source/NAS bytes.

import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { isAbsolute, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  captureRegisteredPhase8NativeVerifyInputs,
  verifyPhase8NativePublication,
} from "./phase8-native-history-verify.ts";

const OPERATOR = "phase8b-benchmark-final-v1";
const FINAL_NAMES = ["artifact-index.json", "report.json", "successor-target-book.jsonl"] as const;
const NATIVE_NAMES = ["artifact-index.json", "operator.json", "records.jsonl", "report.json"] as const;
const PLOT_NAMES = ["artifact-index.json", "operator.json", "records.jsonl", "report.json"] as const;
const BACON_NAMES = ["artifact-index.json", "records.jsonl", "report.json"] as const;
const P2_NAMES = ["artifact-index.json", "records.jsonl", "report.json"] as const;
const PATHS = {
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
const SELECTION_SHA256 = "d4d883b321949155e4ca462b594c6a443acd233719bc8f8c5ffc17e694516537";
const AUDIT_REGISTRATION_SHA256 = "0235f013dcf91d6c0d05cc115ad00ba68ba967c8725f4cfb9b7b9ff392c39220";
const HP25_ID = "P8B-P2-HP25-SOURCE-SEMANTICS";
const HP25_ALLOWED = "dimension-versus-time and source-labelled change-point development analysis";
const HP25_FORBIDDEN =
  "conversion of 48 or 20 percent to solver sigmaInfinity, inferred supersaturation uncertainty, or absolute forcing-response score";
const HP25_UPGRADE = "acquire and inspect the first-report Methods before lifting this restriction";
const BACON_MISSED_CONTAINER_ID = "P8B-CONT-755B3746D3762F0BD610671A";
const AUDIT_REPLACEMENT_CONTAINER_ID = "P8B-CONT-0F75A9EA97A42AE73A947340";

type JsonObject = { readonly [key: string]: StrictJson };

export interface Phase8BenchmarkFinalVerifyInputs {
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
  readonly published: ReadonlyMap<string, Uint8Array>;
}

export interface Phase8BenchmarkUnderlyingVerifiers {
  readonly verifyNative: () => {
    readonly ok: true;
    readonly historyCount: number;
    readonly rowCount: number;
  };
  readonly verifyPlot: () => {
    readonly ok: true;
    readonly counts: {
      readonly seriesCount: number;
      readonly pointCount: number;
    };
  };
}

export interface Phase8BenchmarkFinalVerification {
  readonly ok: true;
  readonly selectedRecords: 51;
  readonly developmentRecords: 51;
  readonly heldOutRecords: 0;
  readonly nativeRowsReverified: number;
  readonly plotPointsReverified: number;
  readonly p2CoordinateRows: 0;
}

interface Selection {
  readonly id: string;
  readonly priority: "P0" | "P1" | "P2";
  readonly sourceUnitId?: string;
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") throw new Error(`${label} must be an object`);
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

function integer(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) throw new Error(`${label} must be a nonnegative integer`);
  return value;
}

function hash(value: unknown, label: string): string {
  const result = string(value, label);
  if (!/^[0-9a-f]{64}$/.test(result)) throw new Error(`${label} must be a lowercase SHA-256`);
  return result;
}

function text(bytes: Uint8Array, label: string): string {
  let result: string;
  try {
    result = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} is not UTF-8`);
  }
  if (result.includes("\r") || !result.endsWith("\n")) throw new Error(`${label} must be LF-terminated text`);
  return result;
}

function jsonl(bytes: Uint8Array, label: string): readonly Record<string, unknown>[] {
  const lines = text(bytes, label).slice(0, -1).split("\n");
  if (lines.length === 0 || lines.some((line) => line.length === 0)) throw new Error(`${label} contains an empty row`);
  return lines.map((line, index) => {
    let value: unknown;
    try {
      value = JSON.parse(line) as unknown;
    } catch {
      throw new Error(`${label} row ${index + 1} is not JSON`);
    }
    const row = object(value, `${label} row ${index + 1}`);
    if (canonicalJson(row) !== line) throw new Error(`${label} row ${index + 1} is not canonical JSON`);
    return row;
  });
}

function jsonlBytes(rows: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((byte, index) => byte === right[index]);
}

function exactSet(actual: Iterable<string>, expected: Iterable<string>, label: string): void {
  if (canonicalJson([...actual].sort()) !== canonicalJson([...expected].sort())) throw new Error(`${label} differs`);
}

function safeLogicalRoot(value: string, label: string): void {
  if (value.length === 0 || isAbsolute(value) || value.includes("\\") ||
      value.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new Error(`${label} must be a safe repository-relative POSIX path`);
  }
}

function artifact(path: string, bytes: Uint8Array, format: string): JsonObject {
  return { path, format, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function descriptor(value: unknown, label: string): { readonly path: string; readonly byteLength: number; readonly sha256: string } {
  const row = object(value, label);
  return {
    path: string(row.path, `${label}.path`),
    byteLength: row.byteLength === undefined ? integer(row.bytes, `${label}.bytes`) : integer(row.byteLength, `${label}.byteLength`),
    sha256: hash(row.sha256, `${label}.sha256`),
  };
}

function checkDescriptor(value: unknown, expected: { readonly path: string; readonly byteLength: number; readonly sha256: string }, label: string): void {
  const actual = descriptor(value, label);
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(`${label} differs`);
}

function selectionRows(inputs: Phase8BenchmarkFinalVerifyInputs): readonly Selection[] {
  const rows = jsonl(inputs.selectionBytes, "selection.jsonl");
  const result = rows.map((row): Selection => {
    const id = string(row.id, "selection id");
    if (row.schema !== "phase8b-benchmark-selection-v1") throw new Error(`selection ${id} row schema differs`);
    const priority = string(row.priorityClass, `selection ${id}.priorityClass`);
    if (priority !== "P0" && priority !== "P1" && priority !== "P2") throw new Error(`selection ${id} priority differs`);
    if (row.phase9EvidenceRole !== "model-development" || row.numericTargetCoordinatesExtractedBeforeSelection !== false ||
        row.outcomeValueUsedAsSelectionCriterion !== false) throw new Error(`selection ${id} role or outcome-neutral state differs`);
    if (priority !== "P0") return { id, priority };
    const sourceUnitId = string(object(row.source, `selection ${id}.source`).sourceUnitId, `selection ${id}.sourceUnitId`);
    if (id !== `P8B-P0-${sourceUnitId.replace(/^P8B-UNIT-/, "")}`) throw new Error(`selection ${id} source-unit binding differs`);
    return { id, priority, sourceUnitId };
  });
  const ids = result.map((row) => row.id);
  if (ids.length !== 51 || new Set(ids).size !== 51 || canonicalJson(ids) !== canonicalJson([...ids].sort())) throw new Error("selection IDs differ or duplicate");
  for (const [priority, expected] of [["P0", 18], ["P1", 28], ["P2", 5]] as const) {
    if (result.filter((row) => row.priority === priority).length !== expected) throw new Error(`${priority} selection count differs`);
  }
  return result;
}

function verifySelectionLineage(inputs: Phase8BenchmarkFinalVerifyInputs, current: readonly Selection[]): void {
  if (inputs.scope === "registered-20260812" && sha256Bytes(inputs.historicalSelectionBytes) !== SELECTION_SHA256) {
    throw new Error("historical selection-v1 hash differs");
  }
  const historical = jsonl(inputs.historicalSelectionBytes, "historical selection-v1");
  if (historical.length !== 49) throw new Error("historical selection-v1 count differs");
  const currentById = new Map(current.map((row) => [row.id, row]));
  for (const row of historical) {
    const id = string(row.id, "historical selection ID");
    if (row.schema !== "phase8b-benchmark-selection-v1") throw new Error(`historical selection ${id} schema differs`);
    const present = currentById.get(id);
    if (present === undefined || present.priority !== row.priorityClass || row.phase9EvidenceRole !== "model-development") {
      throw new Error(`selection-v2 does not preserve ${id}`);
    }
  }
  const backlog = object(parseCanonicalJson(inputs.backlogBytes, "backlog"), "backlog");
  if (backlog.schema !== "phase8b-benchmark-backlog-v2" || backlog.operator !== "phase8b-priority-selection-v2") {
    throw new Error("selection-v2 backlog identity differs");
  }
  const report = object(parseCanonicalJson(inputs.selectionReportBytes, "selection-v2 report"), "selection-v2 report");
  const counts = object(report.counts, "selection-v2 counts");
  if (report.schema !== "phase8b-benchmark-selection-report-v2" || report.operator !== "phase8b-priority-selection-v2" ||
      integer(counts.p0, "selection-v2 p0") !== 18 || integer(counts.p1, "selection-v2 p1") !== 28 ||
      integer(counts.p2, "selection-v2 p2") !== 5) throw new Error("selection-v2 report identity or counts differ");
  const descriptors = array(report.artifacts, "selection-v2 report artifacts");
  for (const [path, bytes] of [["selection.jsonl", inputs.selectionBytes], ["backlog.json", inputs.backlogBytes]] as const) {
    const matches = descriptors.filter((value) => object(value, "selection-v2 descriptor").path === path);
    if (matches.length !== 1) throw new Error(`selection-v2 descriptor count differs for ${path}`);
    checkDescriptor(matches[0], { path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) }, `selection-v2 ${path}`);
  }
}

function graph(
  metadata: ReadonlyMap<string, Uint8Array>,
  names: readonly string[],
  descriptors: readonly unknown[],
  label: string,
): void {
  exactSet(metadata.keys(), names, `${label} file set`);
  for (const name of names.filter((name) => name !== "artifact-index.json")) {
    const candidates = descriptors.filter((value) => object(value, `${label} descriptor`).path === name);
    if (candidates.length !== 1) throw new Error(`${label} descriptor count differs for ${name}`);
    const bytes = metadata.get(name) as Uint8Array;
    checkDescriptor(candidates[0], { path: name, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) }, `${label} ${name}`);
  }
}

function reconstructNative(inputs: Phase8BenchmarkFinalVerifyInputs, selected: readonly Selection[]): {
  readonly rows: readonly JsonObject[];
  readonly total: number;
} {
  exactSet(inputs.nativeMetadata.keys(), NATIVE_NAMES, "native metadata file set");
  const index = object(parseCanonicalJson(inputs.nativeMetadata.get("artifact-index.json") as Uint8Array, "native index"), "native index");
  if (index.schema !== "phase8b-native-history-index-v1" || index.operator !== "phase8b-native-full-history-v1") throw new Error("native index identity differs");
  graph(inputs.nativeMetadata, NATIVE_NAMES, array(index.metadataArtifacts, "native metadata descriptors"), "native metadata");
  const dataDescriptors = array(index.nasDataArtifacts, "native NAS descriptors");
  const recordsBytes = inputs.nativeMetadata.get("records.jsonl") as Uint8Array;
  const records = jsonl(recordsBytes, "native records");
  if (records.length !== 18) throw new Error("native record count differs");
  const byUnit = new Map<string, Record<string, unknown>>();
  let total = 0;
  for (const row of records) {
    const unit = string(row.sourceUnitId, "native source unit");
    if (byUnit.has(unit) || row.schema !== "phase8b-native-history-v1" || row.priorityClass !== "P0" ||
        row.developmentRole !== "model-development" || row.disposition !== "included-native-history") {
      throw new Error(`native record ${unit} identity, uniqueness, or role differs`);
    }
    const normalized = object(row.normalized, `native ${unit}.normalized`);
    const expected = {
      path: string(normalized.path, `native ${unit}.path`),
      byteLength: integer(normalized.byteLength, `native ${unit}.byteLength`),
      sha256: hash(normalized.sha256, `native ${unit}.sha256`),
    };
    const matches = dataDescriptors.filter((value) => object(value, "native data descriptor").path === expected.path);
    if (matches.length !== 1) throw new Error(`native data binding count differs for ${unit}`);
    checkDescriptor(matches[0], expected, `native data binding ${unit}`);
    const count = integer(row.sourceRows, `native ${unit}.sourceRows`);
    if (count === 0) throw new Error(`native ${unit} has zero rows`);
    total += count;
    byUnit.set(unit, row);
  }
  const p0 = selected.filter((row) => row.priority === "P0");
  exactSet(byUnit.keys(), p0.map((row) => row.sourceUnitId as string), "P0 source-unit coverage");
  const report = object(parseCanonicalJson(inputs.nativeMetadata.get("report.json") as Uint8Array, "native report"), "native report");
  const counts = object(report.counts, "native counts");
  if (report.schema !== "phase8b-native-history-report-v1" || report.operator !== "phase8b-native-full-history-v1" ||
      report.grantsValidationClaim !== false || report.permitsPhase9Execution !== false ||
      integer(counts.historyCount, "native historyCount") !== 18 || integer(counts.rowCount, "native rowCount") !== total) {
    throw new Error("native report claim boundary or counts differ");
  }
  if (inputs.scope === "registered-20260812" && total !== 252_134) throw new Error("registered native row count differs");
  const metadataRecordArtifact = artifact(`${PATHS.native}/records.jsonl`, recordsBytes, "canonical-jsonl");
  return {
    total,
    rows: p0.map((item) => {
      const row = byUnit.get(item.sourceUnitId as string) as Record<string, unknown>;
      const normalized = object(row.normalized, `native ${item.id}.normalized`);
      return {
        schema: "phase8b-successor-target-record-v1",
        selectionId: item.id,
        priorityClass: "P0",
        phase9EvidenceRole: "model-development",
        split: "development",
        binding: {
          kind: "native-history",
          metadataRecordId: string(row.id, `native ${item.id}.id`),
          sourceUnitId: item.sourceUnitId as string,
          metadataRecordArtifact,
          rowArtifact: {
            logicalRoot: string(normalized.logicalRoot, `native ${item.id}.logicalRoot`),
            path: string(normalized.path, `native ${item.id}.path`),
            byteLength: integer(normalized.byteLength, `native ${item.id}.byteLength`),
            sha256: hash(normalized.sha256, `native ${item.id}.sha256`),
            rowCount: integer(row.sourceRows, `native ${item.id}.rowCount`),
          },
        },
      };
    }),
  };
}

function reconstructPlot(inputs: Phase8BenchmarkFinalVerifyInputs, selected: readonly Selection[]): {
  readonly rows: readonly JsonObject[];
  readonly total: number;
  readonly ids: ReadonlySet<string>;
} {
  exactSet(inputs.plotMetadata.keys(), PLOT_NAMES, "plot metadata file set");
  const index = object(parseCanonicalJson(inputs.plotMetadata.get("artifact-index.json") as Uint8Array, "plot index"), "plot index");
  const operator = string(index.operator, "plot index operator");
  if (index.schema !== "phase8b-plot-artifact-index-v1" || !operator.includes("plot") || !operator.includes("digitization")) throw new Error("plot index identity differs");
  const descriptors = array(index.artifacts, "plot descriptors");
  graph(inputs.plotMetadata, PLOT_NAMES, descriptors, "plot metadata");
  const recordsBytes = inputs.plotMetadata.get("records.jsonl") as Uint8Array;
  const records = jsonl(recordsBytes, "plot records");
  if (records.length !== 26) throw new Error("plot series count differs");
  const bySelection = new Map<string, Record<string, unknown>>();
  let total = 0;
  for (const row of records) {
    const id = string(row.selectionId, "plot selection ID");
    if (bySelection.has(id) || row.schema !== "phase8b-plot-series-record-v1" ||
        row.operator !== operator || row.phase9EvidenceRole !== "model-development") {
      throw new Error(`plot ${id} identity, uniqueness, or role differs`);
    }
    const body = object(row.rowArtifact, `plot ${id}.rowArtifact`);
    const expected = {
      path: string(body.path, `plot ${id}.path`),
      byteLength: integer(body.bytes, `plot ${id}.bytes`),
      sha256: hash(body.sha256, `plot ${id}.sha256`),
    };
    const count = integer(body.rowCount, `plot ${id}.rowCount`);
    if (count === 0 || count !== integer(row.expectedPointCount, `plot ${id}.expectedPointCount`)) throw new Error(`plot ${id} row count differs`);
    const matches = descriptors.filter((value) => object(value, "plot data descriptor").path === expected.path);
    if (matches.length !== 1) throw new Error(`plot data binding count differs for ${id}`);
    checkDescriptor(matches[0], expected, `plot data binding ${id}`);
    total += count;
    bySelection.set(id, row);
  }
  const p1 = selected.filter((row) => row.priority === "P1" && bySelection.has(row.id));
  exactSet(bySelection.keys(), p1.map((row) => row.id), "original P1 selection coverage");
  const report = object(parseCanonicalJson(inputs.plotMetadata.get("report.json") as Uint8Array, "plot report"), "plot report");
  const counts = object(report.counts, "plot counts");
  if (report.schema !== "phase8b-plot-extraction-report-v1" || report.status !== "candidate-awaiting-independent-verification" ||
      report.phase9EvidenceRole !== "model-development" ||
      integer(counts.seriesCount, "plot seriesCount") !== 26 || integer(counts.pointCount, "plot pointCount") !== total) {
    throw new Error("plot report state, role, or counts differ");
  }
  if (inputs.scope === "registered-20260812" && total !== 431) throw new Error("registered plot point count differs");
  const logicalRoot = string(report.dataLogicalRoot, "plot dataLogicalRoot");
  if (report.operator !== operator) throw new Error("plot report operator differs");
  const metadataRecordArtifact = artifact(`${inputs.plotMetadataLogicalRoot}/records.jsonl`, recordsBytes, "canonical-jsonl");
  return {
    total,
    ids: new Set(bySelection.keys()),
    rows: p1.map((item) => {
      const row = bySelection.get(item.id) as Record<string, unknown>;
      const body = object(row.rowArtifact, `plot ${item.id}.rowArtifact`);
      return {
        schema: "phase8b-successor-target-record-v1",
        selectionId: item.id,
        priorityClass: "P1",
        phase9EvidenceRole: "model-development",
        split: "development",
        binding: {
          kind: "digitized-plot-series",
          metadataRecordId: item.id,
          metadataRecordArtifact,
          rowArtifact: {
            logicalRoot,
            path: string(body.path, `plot ${item.id}.path`),
            byteLength: integer(body.bytes, `plot ${item.id}.bytes`),
            sha256: hash(body.sha256, `plot ${item.id}.sha256`),
            rowCount: integer(body.rowCount, `plot ${item.id}.rowCount`),
          },
        },
      };
    }),
  };
}

function reconstructP2(inputs: Phase8BenchmarkFinalVerifyInputs, selected: readonly Selection[]): readonly JsonObject[] {
  exactSet(inputs.p2Metadata.keys(), P2_NAMES, "P2 metadata file set");
  const index = object(parseCanonicalJson(inputs.p2Metadata.get("artifact-index.json") as Uint8Array, "P2 index"), "P2 index");
  if (index.schema !== "phase8b-p2-terminal-index-v1") throw new Error("P2 index identity differs");
  graph(inputs.p2Metadata, P2_NAMES, array(index.artifacts, "P2 descriptors"), "P2 metadata");
  const recordsBytes = inputs.p2Metadata.get("records.jsonl") as Uint8Array;
  const records = jsonl(recordsBytes, "P2 records");
  if (records.length !== 5) throw new Error("P2 record count differs");
  const byId = new Map<string, Record<string, unknown>>();
  for (const row of records) {
    const id = string(row.id, "P2 ID");
    const numeric = object(row.numericExtraction, `P2 ${id}.numericExtraction`);
    if (byId.has(id) || row.schema !== "phase8b-p2-terminal-v1" || row.recordKind !== "phase8b-p2-terminal-record" ||
        row.status !== "TERMINAL" || row.evidenceRole !== "model-development" || numeric.coordinatesExtracted !== false ||
        integer(numeric.targetCoordinateRowCount, `P2 ${id}.coordinate rows`) !== 0) {
      throw new Error(`P2 ${id} identity, uniqueness, terminal state, or coordinate state differs`);
    }
    byId.set(id, row);
  }
  const p2 = selected.filter((row) => row.priority === "P2");
  exactSet(byId.keys(), p2.map((row) => row.id), "P2 coverage");
  const hp = byId.get(HP25_ID);
  if (hp === undefined || hp.disposition !== "terminal-source-limited-use-restriction" ||
      hp.loadBearingStatus !== "not-load-bearing-under-terminal-use-restriction") throw new Error("HP25 terminal status differs");
  const restriction = object(hp.phase9UseRestriction, "HP25 restriction");
  if (restriction.allowed !== HP25_ALLOWED || restriction.forbidden !== HP25_FORBIDDEN || restriction.upgrade !== HP25_UPGRADE) {
    throw new Error("HP25 use restriction differs");
  }
  const report = object(parseCanonicalJson(inputs.p2Metadata.get("report.json") as Uint8Array, "P2 report"), "P2 report");
  const counts = object(report.counts, "P2 counts");
  if (report.schema !== "phase8b-p2-terminal-report-v1" ||
      integer(counts.p2Records, "P2 record count") !== 5 || integer(counts.terminal, "P2 terminal count") !== 5 ||
      integer(counts.numericCoordinateRows, "P2 coordinate count") !== 0 || integer(counts.sourceLimitedTerminal, "P2 source-limited count") !== 1) {
    throw new Error("P2 report counts differ");
  }
  const metadataRecordArtifact = artifact(`${PATHS.p2}/records.jsonl`, recordsBytes, "canonical-jsonl");
  return p2.map((item) => {
    const row = byId.get(item.id) as Record<string, unknown>;
    return {
      schema: "phase8b-successor-target-record-v1",
      selectionId: item.id,
      priorityClass: "P2",
      phase9EvidenceRole: "model-development",
      split: "development",
      binding: {
        kind: "terminal-interpretive-dependency",
        metadataRecordId: item.id,
        metadataRecordArtifact,
        disposition: string(row.disposition, `P2 ${item.id}.disposition`),
        status: "TERMINAL",
        coordinateRowCount: 0,
        ...(item.id === HP25_ID ? {
          phase9UseRestriction: { allowed: HP25_ALLOWED, forbidden: HP25_FORBIDDEN, upgrade: HP25_UPGRADE },
        } : {}),
      },
    };
  });
}

function reconstructBacon(
  inputs: Phase8BenchmarkFinalVerifyInputs,
  selected: readonly Selection[],
  existingP1Ids: ReadonlySet<string>,
): readonly JsonObject[] {
  exactSet(inputs.baconMetadata.keys(), BACON_NAMES, "Bacon metadata file set");
  const index = object(parseCanonicalJson(inputs.baconMetadata.get("artifact-index.json") as Uint8Array, "Bacon index"), "Bacon index");
  if (!string(index.schema, "Bacon index schema").toLowerCase().includes("bacon")) throw new Error("Bacon index identity differs");
  graph(inputs.baconMetadata, BACON_NAMES, array(index.artifacts, "Bacon descriptors"), "Bacon metadata");
  const recordsBytes = inputs.baconMetadata.get("records.jsonl") as Uint8Array;
  const records = jsonl(recordsBytes, "Bacon records");
  if (records.length !== 2) throw new Error("Bacon supplement record count differs");
  const byId = new Map<string, Record<string, unknown>>();
  for (const row of records) {
    const id = string(row.selectionId, "Bacon supplement selection ID");
    const numeric = object(row.numericExtraction, `Bacon ${id}.numericExtraction`);
    if (byId.has(id) || row.schema !== "phase8b-bacon-aggregate-record-v1" ||
        row.recordKind !== "phase8b-bacon-aggregate-measurement-set" || row.priorityClass !== "P1" ||
        row.phase9EvidenceRole !== "model-development" ||
        row.disposition !== "terminal-direct-reported-aggregate-development" ||
        numeric.coordinatesExtracted !== false || numeric.plotDigitizationPerformed !== false ||
        numeric.printedAggregateValuesTranscribed !== true || integer(numeric.targetCoordinateRowCount, `Bacon ${id}.coordinate rows`) !== 0) {
      throw new Error(`Bacon ${id} identity, uniqueness, or role differs`);
    }
    if (row.status !== "TERMINAL") throw new Error(`Bacon ${id} terminal state differs`);
    byId.set(id, row);
  }
  const added = selected.filter((item) => item.priority === "P1" && !existingP1Ids.has(item.id));
  exactSet(byId.keys(), added.map((row) => row.id), "Bacon P1 selection coverage");
  const report = object(parseCanonicalJson(inputs.baconMetadata.get("report.json") as Uint8Array, "Bacon report"), "Bacon report");
  const counts = object(report.counts, "Bacon report counts");
  if (integer(counts.records, "Bacon record count") !== 2 ||
      integer(counts.directMeasurementSets, "Bacon direct measurement sets") !== 2 ||
      integer(counts.reportedNumericAggregates, "Bacon numeric aggregates") !== 4 ||
      integer(counts.contextualQualitativeFindings, "Bacon qualitative findings") !== 2 ||
      integer(counts.numericCoordinateRows, "Bacon coordinate rows") !== 0 ||
      integer(counts.derivativeClassificationRows, "Bacon derivative rows") !== 93 ||
      integer(counts.derivativeSolidRows, "Bacon derivative solid rows") !== 71 ||
      integer(counts.derivativeFloridRows, "Bacon derivative florid rows") !== 22) {
    throw new Error("Bacon report counts differ");
  }
  const metadataRecordArtifact = artifact(`${PATHS.bacon}/records.jsonl`, recordsBytes, "canonical-jsonl");
  return added.map((item) => {
    const row = byId.get(item.id) as Record<string, unknown>;
    return {
      schema: "phase8b-successor-target-record-v1",
      selectionId: item.id,
      priorityClass: "P1",
      phase9EvidenceRole: "model-development",
      split: "development",
      binding: {
        kind: "direct-bacon-reported-aggregate",
        metadataRecordId: item.id,
        metadataRecordArtifact,
        disposition: string(row.disposition, `Bacon ${item.id}.disposition`),
      },
    };
  });
}

function verifyTexts(inputs: Phase8BenchmarkFinalVerifyInputs): void {
  const targeted = text(inputs.targetedGapCurrencyBytes, "targeted gap/currency record");
  for (const phrase of [
    "**Outcome:** terminal for Phase 8B; bounded, not a claim of global literature saturation",
    "No included P0/P1 numeric source remains unlocated or unverified.",
    "ready for Phase 9 **development experiments**, not held-out",
    "Do not convert `48%` or `20%` to solver `sigmaInfinity`",
  ]) if (!targeted.includes(phrase)) throw new Error(`targeted gap/currency boundary differs: ${phrase}`);
  if (inputs.scope === "registered-20260812" && sha256Bytes(inputs.residualAuditRegistrationBytes) !== AUDIT_REGISTRATION_SHA256) {
    throw new Error("residual-audit registration hash differs");
  }
  const registration = text(inputs.residualAuditRegistrationBytes, "residual-audit registration");
  const ids = registration.split("\n").flatMap((line) => {
    const match = /^\| (?:local-container|acquired-context-exclude|captured-clear-exclude) \| `([^`]+)`/.exec(line);
    return match === null ? [] : [match[1] as string];
  });
  if (ids.length !== 9 || new Set(ids).size !== 9) throw new Error("residual-audit registered sample differs");
  const result = text(inputs.residualAuditResultBytes, "residual-audit result");
  for (const id of ids) if (!result.includes(id)) throw new Error(`residual-audit result omits ${id}`);
  if (!result.includes(BACON_MISSED_CONTAINER_ID) || !/\bBacon\b/iu.test(result) ||
      !/(?:\bmiss(?:es)?\s*:\s*1\b|\bone (?:benchmark )?miss\b)/iu.test(result)) {
    throw new Error("residual-audit result does not preserve the one Bacon benchmark miss");
  }
  const correction = text(inputs.residualAuditCorrectionRegistrationBytes, "residual-audit correction registration");
  if (!correction.includes(BACON_MISSED_CONTAINER_ID) || !correction.includes(AUDIT_REPLACEMENT_CONTAINER_ID) ||
      !correction.includes("1211.5555v1.pdf") || !correction.includes("all eight still-residual records")) {
    throw new Error("residual-audit correction registration identity or corrected-sample rule differs");
  }
  if (!result.includes(AUDIT_REPLACEMENT_CONTAINER_ID) ||
      !/(?:corrected|replacement)[\s\S]{0,300}\bzero misses\b/iu.test(result)) {
    throw new Error("residual-audit result lacks the registered replacement and corrected zero-miss result");
  }
  const plan = text(inputs.phase9PlanBytes, "Phase 9 plan");
  for (const phrase of [
    "not chartered and not authorized for execution",
    "All 51 selected P0/P1/P2 records are model development",
    "no held-out",
    "may not be converted to solver",
  ]) if (!plan.includes(phrase)) throw new Error(`Phase 9 plan boundary differs: ${phrase}`);
}

function sourceArtifacts(inputs: Phase8BenchmarkFinalVerifyInputs): readonly JsonObject[] {
  const values: JsonObject[] = [
    artifact(PATHS.historicalSelection, inputs.historicalSelectionBytes, "canonical-jsonl"),
    artifact(PATHS.selection, inputs.selectionBytes, "canonical-jsonl"),
    artifact(PATHS.backlog, inputs.backlogBytes, "canonical-json"),
    artifact(PATHS.selectionReport, inputs.selectionReportBytes, "canonical-json"),
    artifact(PATHS.targeted, inputs.targetedGapCurrencyBytes, "markdown"),
    artifact(PATHS.auditRegistration, inputs.residualAuditRegistrationBytes, "markdown"),
    artifact(PATHS.auditCorrectionRegistration, inputs.residualAuditCorrectionRegistrationBytes, "markdown"),
    artifact(PATHS.auditResult, inputs.residualAuditResultBytes, "markdown"),
    artifact(PATHS.phase9Plan, inputs.phase9PlanBytes, "markdown"),
  ];
  for (const [root, metadata] of [
    [PATHS.native, inputs.nativeMetadata], [inputs.plotMetadataLogicalRoot, inputs.plotMetadata],
    [PATHS.bacon, inputs.baconMetadata], [PATHS.p2, inputs.p2Metadata],
  ] as const) {
    for (const [name, bytes] of metadata) values.push(artifact(`${root}/${name}`, bytes, name.endsWith(".jsonl") ? "canonical-jsonl" : "canonical-json"));
  }
  return values.sort((left, right) => String(left.path) < String(right.path) ? -1 : 1);
}

function expectedPublication(inputs: Phase8BenchmarkFinalVerifyInputs): {
  readonly artifacts: ReadonlyMap<string, Uint8Array>;
  readonly nativeRows: number;
  readonly plotPoints: number;
} {
  safeLogicalRoot(inputs.plotMetadataLogicalRoot, "plot metadata logical root");
  const selected = selectionRows(inputs);
  verifySelectionLineage(inputs, selected);
  const native = reconstructNative(inputs, selected);
  const plot = reconstructPlot(inputs, selected);
  const p2 = reconstructP2(inputs, selected);
  const bacon = reconstructBacon(inputs, selected, plot.ids);
  verifyTexts(inputs);
  const rows = [...native.rows, ...plot.rows, ...bacon, ...p2].sort((left, right) => String(left.selectionId) < String(right.selectionId) ? -1 : 1);
  if (rows.length !== 51 || new Set(rows.map((row) => String(row.selectionId))).size !== 51) throw new Error("reconstructed pointer coverage differs");
  const targetBytes = jsonlBytes(rows);
  const counts = {
    selectedRecords: 51,
    p0: 18,
    p1: 28,
    p2: 5,
    development: 51,
    heldOut: 0,
    nativeRows: native.total,
    plotPoints: plot.total,
    p2CoordinateRows: 0,
  };
  const report: JsonObject = {
    schema: "phase8b-benchmark-final-report-v1",
    operator: OPERATOR,
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
      successorSelectionIds: bacon.map((row) => String(row.selectionId)),
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
    sourceArtifacts: sourceArtifacts(inputs),
    successorTargetBook: artifact("successor-target-book.jsonl", targetBytes, "canonical-jsonl"),
  };
  const reportBytes = canonicalJsonBytes(report);
  const index = {
    schema: "phase8b-benchmark-final-index-v1",
    operator: OPERATOR,
    artifacts: [artifact("report.json", reportBytes, "canonical-json"), artifact("successor-target-book.jsonl", targetBytes, "canonical-jsonl")],
  };
  return {
    artifacts: new Map([
      ["artifact-index.json", canonicalJsonBytes(index)],
      ["report.json", reportBytes],
      ["successor-target-book.jsonl", targetBytes],
    ]),
    nativeRows: native.total,
    plotPoints: plot.total,
  };
}

/** Verify exact final bytes, then independently re-run both row-level source verifiers. */
export function verifyPhase8BenchmarkFinalPublication(
  inputs: Phase8BenchmarkFinalVerifyInputs,
  underlying: Phase8BenchmarkUnderlyingVerifiers,
): Phase8BenchmarkFinalVerification {
  const expected = expectedPublication(inputs);
  exactSet(inputs.published.keys(), FINAL_NAMES, "published final file set");
  for (const name of FINAL_NAMES) {
    if (!sameBytes(inputs.published.get(name) as Uint8Array, expected.artifacts.get(name) as Uint8Array)) {
      throw new Error(`published final artifact differs from independent reconstruction: ${name}`);
    }
  }
  const native = underlying.verifyNative();
  if (native.ok !== true || native.historyCount !== 18 || native.rowCount !== expected.nativeRows) {
    throw new Error("independent native verifier result does not match final bindings");
  }
  const plot = underlying.verifyPlot();
  if (plot.ok !== true || plot.counts.seriesCount !== 26 || plot.counts.pointCount !== expected.plotPoints) {
    throw new Error("independent plot verifier result does not match final bindings");
  }
  return {
    ok: true,
    selectedRecords: 51,
    developmentRecords: 51,
    heldOutRecords: 0,
    nativeRowsReverified: native.rowCount,
    plotPointsReverified: plot.counts.pointCount,
    p2CoordinateRows: 0,
  };
}

function regular(path: string, label: string): Uint8Array {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} is not a regular non-symlink file`);
  return new Uint8Array(readFileSync(path));
}

function metadata(root: string, names: readonly string[], label: string): ReadonlyMap<string, Uint8Array> {
  exactSet(readdirSync(root), names, `${label} file set`);
  return new Map(names.map((name) => [name, regular(join(root, name), `${label}/${name}`)]));
}

export function capturePhase8BenchmarkFinalVerifyInputs(
  repositoryRoot: string,
  plotMetadataLogicalRoot: string,
  bundleDirectory: string,
  scope: Phase8BenchmarkFinalVerifyInputs["scope"] = "registered-20260812",
): Phase8BenchmarkFinalVerifyInputs {
  const root = resolve(repositoryRoot);
  safeLogicalRoot(plotMetadataLogicalRoot, "plot metadata root");
  const plotRoot = resolve(root, plotMetadataLogicalRoot);
  if (!plotRoot.slice(root.length).startsWith(sep)) throw new Error("plot metadata root leaves the repository");
  return {
    scope,
    historicalSelectionBytes: regular(join(root, PATHS.historicalSelection), "historical selection-v1"),
    selectionBytes: regular(join(root, PATHS.selection), "selection"),
    backlogBytes: regular(join(root, PATHS.backlog), "backlog"),
    selectionReportBytes: regular(join(root, PATHS.selectionReport), "selection-v2 report"),
    nativeMetadata: metadata(join(root, PATHS.native), NATIVE_NAMES, "native metadata"),
    plotMetadataLogicalRoot,
    plotMetadata: metadata(plotRoot, PLOT_NAMES, "plot metadata"),
    baconMetadata: metadata(join(root, PATHS.bacon), BACON_NAMES, "Bacon metadata"),
    p2Metadata: metadata(join(root, PATHS.p2), P2_NAMES, "P2 metadata"),
    targetedGapCurrencyBytes: regular(join(root, PATHS.targeted), "targeted gap/currency record"),
    residualAuditRegistrationBytes: regular(join(root, PATHS.auditRegistration), "residual-audit registration"),
    residualAuditCorrectionRegistrationBytes: regular(
      join(root, PATHS.auditCorrectionRegistration),
      "residual-audit correction registration",
    ),
    residualAuditResultBytes: regular(join(root, PATHS.auditResult), "residual-audit result"),
    phase9PlanBytes: regular(join(root, PATHS.phase9Plan), "Phase 9 plan"),
    published: metadata(resolve(bundleDirectory), FINAL_NAMES, "published final bundle"),
  };
}

function usage(): never {
  throw new Error(
    "usage: node runner/src/phase8-benchmark-final-verify.ts verify " +
    "--repository-root ROOT --bundle FINAL --content-root CONTENT --native-bundle NATIVE " +
    "--plot-metadata-root REPOSITORY_RELATIVE_PATH --plot-verifier REPOSITORY_RELATIVE_SCRIPT " +
    "--plot-source-root SOURCES --plot-render-root RENDERS --plot-bundle PLOT",
  );
}

function externalPlotVerification(options: {
  readonly repositoryRoot: string;
  readonly verifierPath: string;
  readonly sourceRoot: string;
  readonly renderRoot: string;
  readonly bundleDirectory: string;
}): { readonly ok: true; readonly counts: { readonly seriesCount: number; readonly pointCount: number } } {
  safeLogicalRoot(options.verifierPath, "plot verifier");
  const verifier = resolve(options.repositoryRoot, options.verifierPath);
  const output = execFileSync(process.execPath, [
    verifier, "verify",
    "--repository-root", options.repositoryRoot,
    "--source-root", options.sourceRoot,
    "--render-root", options.renderRoot,
    "--bundle", options.bundleDirectory,
  ], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024, timeout: 60 * 60 * 1000 });
  let parsed: unknown;
  try {
    parsed = JSON.parse(output) as unknown;
  } catch {
    throw new Error("independent plot verifier did not emit JSON");
  }
  const result = object(parsed, "independent plot verifier result");
  const counts = object(result.counts, "independent plot verifier counts");
  if (result.ok !== true) throw new Error("independent plot verifier did not return ok=true");
  return {
    ok: true,
    counts: {
      seriesCount: integer(counts.seriesCount, "independent plot seriesCount"),
      pointCount: integer(counts.pointCount, "independent plot pointCount"),
    },
  };
}

function main(argv: readonly string[]): void {
  if (argv[0] !== "verify") usage();
  const allowed = new Set([
    "--repository-root", "--bundle", "--content-root", "--native-bundle",
    "--plot-metadata-root", "--plot-verifier", "--plot-source-root", "--plot-render-root", "--plot-bundle",
  ]);
  const values = new Map<string, string>();
  for (let index = 1; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === undefined || value === undefined || !allowed.has(key) || values.has(key)) usage();
    values.set(key, value);
  }
  exactSet(values.keys(), allowed, "CLI argument set");
  const repositoryRoot = resolve(values.get("--repository-root") as string);
  const plotMetadataRoot = values.get("--plot-metadata-root") as string;
  const result = verifyPhase8BenchmarkFinalPublication(
    capturePhase8BenchmarkFinalVerifyInputs(repositoryRoot, plotMetadataRoot, resolve(values.get("--bundle") as string)),
    {
      verifyNative: () => verifyPhase8NativePublication(captureRegisteredPhase8NativeVerifyInputs({
        repositoryRoot,
        contentRoot: resolve(values.get("--content-root") as string),
        bundleDirectory: resolve(values.get("--native-bundle") as string),
      })),
      verifyPlot: () => externalPlotVerification({
        repositoryRoot,
        verifierPath: values.get("--plot-verifier") as string,
        sourceRoot: resolve(values.get("--plot-source-root") as string),
        renderRoot: resolve(values.get("--plot-render-root") as string),
        bundleDirectory: resolve(values.get("--plot-bundle") as string),
      }),
    },
  );
  process.stdout.write(`${canonicalJson(result)}\n`);
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
