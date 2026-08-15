import { describe, expect, it, vi } from "vitest";
import { canonicalJson, canonicalJsonBytes, sha256Bytes } from "../src/gate4-evidence.ts";
import {
  derivePhase8BenchmarkFinalBundle,
  type Phase8BenchmarkFinalInputs,
} from "../src/phase8-benchmark-final.ts";
import {
  verifyPhase8BenchmarkFinalPublication,
  type Phase8BenchmarkFinalVerifyInputs,
} from "../src/phase8-benchmark-final-verify.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const HP25_ID = "P8B-P2-HP25-SOURCE-SEMANTICS";
const BACON_IDS = ["P8B-P1-BACON-INITIATION-ASPECT", "P8B-P1-BACON-MASS-GROWTH-CONTRAST"] as const;
const ORIGINAL_P2_IDS = [
  HP25_ID,
  "P8B-P2-INPUT-LINEAGE",
  "P8B-P2-L13-L16-SUPERSESSION",
  "P8B-P2-PK20-HETERO-JOIN",
  "P8B-P2-PK20-HOMO-DENOM",
] as const;
const AUDIT_IDS = [
  "P8B-CONT-755B3746D3762F0BD610671A", "P8B-CONT-B", "P8B-CONT-C",
  "P8B-S2R0-A", "P8B-S2R0-B", "P8B-S2R0-C",
  "https://openalex.org/W1", "https://openalex.org/W2", "https://openalex.org/W3",
] as const;

function jsonl(rows: readonly unknown[]): Uint8Array {
  return encoder.encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function desc(path: string, bytes: Uint8Array, useBytes = false): Record<string, unknown> {
  return { path, [useBytes ? "bytes" : "byteLength"]: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function metadataMap(entries: readonly (readonly [string, Uint8Array])[]): ReadonlyMap<string, Uint8Array> {
  return new Map(entries);
}

interface Fixture {
  readonly inputs: Phase8BenchmarkFinalInputs;
  readonly p0Ids: readonly string[];
  readonly p1Ids: readonly string[];
}

function fixture(): Fixture {
  const p0Units = Array.from({ length: 18 }, (_unused, index) => `P8B-UNIT-${String(index).padStart(3, "0")}`);
  const p0Rows = p0Units.map((unit) => ({
    schema: "phase8b-benchmark-selection-v1",
    id: `P8B-P0-${unit.replace("P8B-UNIT-", "")}`,
    priorityClass: "P0",
    phase9EvidenceRole: "model-development",
    numericTargetCoordinatesExtractedBeforeSelection: false,
    outcomeValueUsedAsSelectionCriterion: false,
    source: { sourceUnitId: unit },
  }));
  const originalP1Rows = Array.from({ length: 26 }, (_unused, index) => ({
    schema: "phase8b-benchmark-selection-v1",
    id: `P8B-P1-${String(index).padStart(3, "0")}`,
    priorityClass: "P1",
    phase9EvidenceRole: "model-development",
    numericTargetCoordinatesExtractedBeforeSelection: false,
    outcomeValueUsedAsSelectionCriterion: false,
  }));
  const baconP1Rows = BACON_IDS.map((id) => ({
    schema: "phase8b-benchmark-selection-v1",
    id,
    priorityClass: "P1",
    phase9EvidenceRole: "model-development",
    numericTargetCoordinatesExtractedBeforeSelection: false,
    outcomeValueUsedAsSelectionCriterion: false,
  }));
  const p1Rows = [...baconP1Rows, ...originalP1Rows];
  const p2Rows = ORIGINAL_P2_IDS.map((id) => ({
    schema: "phase8b-benchmark-selection-v1",
    id,
    priorityClass: "P2",
    phase9EvidenceRole: "model-development",
    numericTargetCoordinatesExtractedBeforeSelection: false,
    outcomeValueUsedAsSelectionCriterion: false,
  }));
  const selectionRows = [...p0Rows, ...p1Rows, ...p2Rows].sort((left, right) => left.id < right.id ? -1 : 1);
  const selectionBytes = jsonl(selectionRows);
  const historicalSelectionBytes = jsonl(selectionRows.filter((row) => !BACON_IDS.includes(row.id as typeof BACON_IDS[number])));
  const backlogBytes = canonicalJsonBytes({ schema: "phase8b-benchmark-backlog-v2", operator: "phase8b-priority-selection-v2" });
  const selectionReportBytes = canonicalJsonBytes({
    schema: "phase8b-benchmark-selection-report-v2",
    operator: "phase8b-priority-selection-v2",
    counts: { p0: 18, p1: 28, p2: 5 },
    artifacts: [desc("backlog.json", backlogBytes), desc("selection.jsonl", selectionBytes)],
  });

  const nativeOperator = canonicalJsonBytes({ fixture: "native operator" });
  const nativeRecords = p0Units.map((unit, index) => {
    const rowBytes = encoder.encode(`native-${index}\n`);
    return {
      schema: "phase8b-native-history-v1",
      id: `NATIVE-${String(index).padStart(3, "0")}`,
      sourceUnitId: unit,
      priorityClass: "P0",
      developmentRole: "model-development",
      disposition: "included-native-history",
      sourceRows: index + 1,
      normalized: {
        logicalRoot: "research-cache/fixture-native",
        path: `data/native-${String(index).padStart(3, "0")}.tsv`,
        byteLength: rowBytes.byteLength,
        sha256: sha256Bytes(rowBytes),
      },
    };
  });
  const nativeRecordsBytes = jsonl(nativeRecords);
  const nativeRowTotal = nativeRecords.reduce((sum, row) => sum + row.sourceRows, 0);
  const nativeReport = canonicalJsonBytes({
    schema: "phase8b-native-history-report-v1",
    operator: "phase8b-native-full-history-v1",
    grantsValidationClaim: false,
    permitsPhase9Execution: false,
    counts: { historyCount: 18, rowCount: nativeRowTotal },
  });
  const nativeIndex = canonicalJsonBytes({
    schema: "phase8b-native-history-index-v1",
    operator: "phase8b-native-full-history-v1",
    metadataArtifacts: [
      desc("operator.json", nativeOperator), desc("records.jsonl", nativeRecordsBytes), desc("report.json", nativeReport),
    ],
    nasDataArtifacts: nativeRecords.map((row) => ({
      path: row.normalized.path,
      byteLength: row.normalized.byteLength,
      sha256: row.normalized.sha256,
    })),
  });
  const nativeMetadata = metadataMap([
    ["artifact-index.json", nativeIndex], ["operator.json", nativeOperator],
    ["records.jsonl", nativeRecordsBytes], ["report.json", nativeReport],
  ]);

  const plotOperator = canonicalJsonBytes({ fixture: "plot operator" });
  const plotRecords = originalP1Rows.map((selection, index) => {
    const body = encoder.encode(`plot-${index}\n`);
    return {
      schema: "phase8b-plot-series-record-v1",
      operator: "phase8b-two-reader-plot-digitization-v2",
      selectionId: selection.id,
      phase9EvidenceRole: "model-development",
      expectedPointCount: index + 1,
      rowArtifact: {
        path: `rows/${selection.id}.jsonl`, bytes: body.byteLength,
        sha256: sha256Bytes(body), rowCount: index + 1,
      },
    };
  });
  const plotRecordsBytes = jsonl(plotRecords);
  const plotPointTotal = plotRecords.reduce((sum, row) => sum + row.expectedPointCount, 0);
  const plotReport = canonicalJsonBytes({
    schema: "phase8b-plot-extraction-report-v1",
    operator: "phase8b-two-reader-plot-digitization-v2",
    status: "candidate-awaiting-independent-verification",
    phase9EvidenceRole: "model-development",
    dataLogicalRoot: "research-cache/fixture-plot",
    counts: { seriesCount: 26, pointCount: plotPointTotal },
  });
  const plotIndex = canonicalJsonBytes({
    schema: "phase8b-plot-artifact-index-v1",
    operator: "phase8b-two-reader-plot-digitization-v2",
    artifacts: [
      desc("operator.json", plotOperator, true), desc("records.jsonl", plotRecordsBytes, true), desc("report.json", plotReport, true),
      ...plotRecords.map((row) => ({ path: row.rowArtifact.path, bytes: row.rowArtifact.bytes, sha256: row.rowArtifact.sha256 })),
    ],
  });
  const plotMetadata = metadataMap([
    ["artifact-index.json", plotIndex], ["operator.json", plotOperator],
    ["records.jsonl", plotRecordsBytes], ["report.json", plotReport],
  ]);

  const p2Records = [...ORIGINAL_P2_IDS].sort().map((id) => ({
    schema: "phase8b-p2-terminal-v1",
    recordKind: "phase8b-p2-terminal-record",
    id,
    status: "TERMINAL",
    evidenceRole: "model-development",
    disposition: id === HP25_ID ? "terminal-source-limited-use-restriction" : "terminal-fixture",
    numericExtraction: { coordinatesExtracted: false, targetCoordinateRowCount: 0 },
    ...(id === HP25_ID ? {
      loadBearingStatus: "not-load-bearing-under-terminal-use-restriction",
      phase9UseRestriction: {
        allowed: "dimension-versus-time and source-labelled change-point development analysis",
        forbidden: "conversion of 48 or 20 percent to solver sigmaInfinity, inferred supersaturation uncertainty, or absolute forcing-response score",
        upgrade: "acquire and inspect the first-report Methods before lifting this restriction",
      },
    } : {}),
  }));
  const p2RecordsBytes = jsonl(p2Records);
  const p2Report = canonicalJsonBytes({
    schema: "phase8b-p2-terminal-report-v1",
    counts: { p2Records: 5, terminal: 5, numericCoordinateRows: 0, sourceLimitedTerminal: 1 },
  });
  const p2Index = canonicalJsonBytes({
    schema: "phase8b-p2-terminal-index-v1",
    artifacts: [desc("records.jsonl", p2RecordsBytes), desc("report.json", p2Report)],
  });
  const p2Metadata = metadataMap([
    ["artifact-index.json", p2Index], ["records.jsonl", p2RecordsBytes], ["report.json", p2Report],
  ]);

  const baconRecordsBytes = jsonl(BACON_IDS.map((id) => ({
    schema: "phase8b-bacon-aggregate-record-v1",
    recordKind: "phase8b-bacon-aggregate-measurement-set",
    selectionId: id,
    priorityClass: "P1",
    status: "TERMINAL",
    phase9EvidenceRole: "model-development",
    disposition: "terminal-direct-reported-aggregate-development",
    reportedValues: { fixture: id },
    numericExtraction: {
      coordinatesExtracted: false,
      targetCoordinateRowCount: 0,
      plotDigitizationPerformed: false,
      printedAggregateValuesTranscribed: true,
    },
  })));
  const baconReport = canonicalJsonBytes({ counts: {
    records: 2,
    directMeasurementSets: 2,
    reportedNumericAggregates: 4,
    contextualQualitativeFindings: 2,
    numericCoordinateRows: 0,
    derivativeClassificationRows: 93,
    derivativeSolidRows: 71,
    derivativeFloridRows: 22,
  } });
  const baconIndex = canonicalJsonBytes({
    schema: "phase8b-bacon-seed-history-index-v1",
    artifacts: [desc("records.jsonl", baconRecordsBytes), desc("report.json", baconReport)],
  });
  const baconMetadata = metadataMap([
    ["artifact-index.json", baconIndex], ["records.jsonl", baconRecordsBytes], ["report.json", baconReport],
  ]);

  const registration = encoder.encode(
    "# Audit registration\n" + AUDIT_IDS.map((id, index) =>
      `| ${index < 3 ? "local-container" : index < 6 ? "acquired-context-exclude" : "captured-clear-exclude"} | \`${id}\`; locator | digest |`).join("\n") + "\n",
  );
  const auditResult = encoder.encode(
    `# Audit result\n\nVerdict: ORIGINAL FAIL\n\nMisses: 1. Bacon is the one benchmark miss.\n\n${AUDIT_IDS.join("\n")}\n\n` +
    "Corrected replacement review: P8B-CONT-0F75A9EA97A42AE73A947340. The corrected sample has zero misses.\n",
  );
  const auditCorrection = encoder.encode(
    "# Correction\n\nP8B-CONT-755B3746D3762F0BD610671A promoted.\n\n" +
    "Replacement P8B-CONT-0F75A9EA97A42AE73A947340 is 1211.5555v1.pdf.\n\n" +
    "Review the replacement and all eight still-residual records.\n",
  );
  const targeted = encoder.encode(
    "# Targeted pass\n\n**Outcome:** terminal for Phase 8B; bounded, not a claim of global literature saturation\n\n" +
    "No included P0/P1 numeric source remains unlocated or unverified.\n\n" +
    "Do not convert `48%` or `20%` to solver `sigmaInfinity`.\n\n" +
    "The benchmark is ready for Phase 9 **development experiments**, not held-out validation.\n",
  );
  const phase9Plan = encoder.encode(
    "# Phase 9 plan\n\nStatus: not chartered and not authorized for execution\n\n" +
    "All 51 selected P0/P1/P2 records are model development and there is no held-out row.\n\n" +
    "The source labels may not be converted to solver inputs.\n",
  );
  return {
    p0Ids: p0Rows.map((row) => row.id),
    p1Ids: p1Rows.map((row) => row.id),
    inputs: {
      scope: "test-fixture",
      historicalSelectionBytes,
      selectionBytes,
      backlogBytes,
      selectionReportBytes,
      nativeMetadata,
      plotMetadataLogicalRoot: "evidence/fixture-plot-publication",
      plotMetadata,
      baconMetadata,
      p2Metadata,
      targetedGapCurrencyBytes: targeted,
      residualAuditRegistrationBytes: registration,
      residualAuditCorrectionRegistrationBytes: auditCorrection,
      residualAuditResultBytes: auditResult,
      phase9PlanBytes: phase9Plan,
    },
  };
}

function verifierInputs(inputs: Phase8BenchmarkFinalInputs, published: ReadonlyMap<string, Uint8Array>): Phase8BenchmarkFinalVerifyInputs {
  return { ...inputs, published };
}

function mutateJsonl(bytes: Uint8Array, mutate: (rows: Record<string, unknown>[]) => void): Uint8Array {
  const rows = decoder.decode(bytes).trimEnd().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
  mutate(rows);
  return jsonl(rows);
}

describe("Phase 8B final benchmark assembly", () => {
  it("emits 51 metadata pointers and requires both independent row verifiers", () => {
    const value = fixture();
    const bundle = derivePhase8BenchmarkFinalBundle(value.inputs);
    const verifyNative = vi.fn(() => ({ ok: true as const, historyCount: 18, rowCount: bundle.counts.nativeRows }));
    const verifyPlot = vi.fn(() => ({ ok: true as const, counts: { seriesCount: 26, pointCount: bundle.counts.plotPoints } }));
    expect(verifyPhase8BenchmarkFinalPublication(verifierInputs(value.inputs, bundle.artifacts), { verifyNative, verifyPlot })).toEqual({
      ok: true,
      selectedRecords: 51,
      developmentRecords: 51,
      heldOutRecords: 0,
      nativeRowsReverified: bundle.counts.nativeRows,
      plotPointsReverified: bundle.counts.plotPoints,
      p2CoordinateRows: 0,
    });
    expect(verifyNative).toHaveBeenCalledOnce();
    expect(verifyPlot).toHaveBeenCalledOnce();
    expect(decoder.decode(bundle.artifacts.get("successor-target-book.jsonl") as Uint8Array).trimEnd().split("\n")).toHaveLength(51);
  });

  it("rejects a dropped current-selection ID", () => {
    const value = fixture();
    const selectionBytes = mutateJsonl(value.inputs.selectionBytes, (rows) => { rows.pop(); });
    expect(() => derivePhase8BenchmarkFinalBundle({ ...value.inputs, selectionBytes })).toThrow(/P0=18 P1=28 P2=5|selection/);
  });

  it("rejects a duplicate current-selection ID", () => {
    const value = fixture();
    const selectionBytes = mutateJsonl(value.inputs.selectionBytes, (rows) => {
      const source = rows.find((row) => row.id === HP25_ID) as Record<string, unknown>;
      const target = rows.findIndex((row) => row.id === BACON_IDS[0]);
      rows[target] = { ...source };
      rows.sort((left, right) => String(left.id) < String(right.id) ? -1 : 1);
    });
    expect(() => derivePhase8BenchmarkFinalBundle({ ...value.inputs, selectionBytes })).toThrow(/duplicate/);
  });

  it("rejects relabeling any selected row as held out", () => {
    const value = fixture();
    const selectionBytes = mutateJsonl(value.inputs.selectionBytes, (rows) => {
      rows[0] = { ...rows[0], phase9EvidenceRole: "held-out" };
    });
    expect(() => derivePhase8BenchmarkFinalBundle({ ...value.inputs, selectionBytes })).toThrow(/not model development/);
  });

  it("rejects a changed P1 row hash or count", () => {
    const value = fixture();
    const plotMetadata = new Map(value.inputs.plotMetadata);
    plotMetadata.set("records.jsonl", mutateJsonl(plotMetadata.get("records.jsonl") as Uint8Array, (rows) => {
      const rowArtifact = rows[0]?.rowArtifact as Record<string, unknown>;
      rows[0] = { ...rows[0], expectedPointCount: Number(rows[0]?.expectedPointCount) + 1,
        rowArtifact: { ...rowArtifact, sha256: "0".repeat(64), rowCount: Number(rowArtifact.rowCount) + 1 } };
    }));
    expect(() => derivePhase8BenchmarkFinalBundle({ ...value.inputs, plotMetadata })).toThrow(/binding|descriptor|differs/);
  });

  it("rejects loss of the HP25 source-limited restriction", () => {
    const value = fixture();
    const p2Metadata = new Map(value.inputs.p2Metadata);
    const changedRecords = mutateJsonl(p2Metadata.get("records.jsonl") as Uint8Array, (rows) => {
      const index = rows.findIndex((row) => row.id === HP25_ID);
      rows[index] = { ...rows[index], phase9UseRestriction: { allowed: "unrestricted", forbidden: "none", upgrade: "none" } };
    });
    p2Metadata.set("records.jsonl", changedRecords);
    const parsedIndex = JSON.parse(decoder.decode(p2Metadata.get("artifact-index.json") as Uint8Array)) as Record<string, unknown>;
    const artifacts = (parsedIndex.artifacts as Record<string, unknown>[]).map((row) =>
      row.path === "records.jsonl" ? desc("records.jsonl", changedRecords) : row);
    p2Metadata.set("artifact-index.json", canonicalJsonBytes({ ...parsedIndex, artifacts }));
    expect(() => derivePhase8BenchmarkFinalBundle({ ...value.inputs, p2Metadata })).toThrow(/HP25/);
  });

  it("rejects a producer-supplied pass even when its self-index is updated", () => {
    const value = fixture();
    const bundle = derivePhase8BenchmarkFinalBundle(value.inputs);
    const published = new Map(bundle.artifacts);
    const report = JSON.parse(decoder.decode(published.get("report.json") as Uint8Array)) as Record<string, unknown>;
    const reportBytes = canonicalJsonBytes({ ...report, independentVerificationPassed: true });
    published.set("report.json", reportBytes);
    const index = JSON.parse(decoder.decode(published.get("artifact-index.json") as Uint8Array)) as Record<string, unknown>;
    const artifacts = (index.artifacts as Record<string, unknown>[]).map((row) =>
      row.path === "report.json" ? { ...row, byteLength: reportBytes.byteLength, sha256: sha256Bytes(reportBytes) } : row);
    published.set("artifact-index.json", canonicalJsonBytes({ ...index, artifacts }));
    const verifyNative = vi.fn(() => ({ ok: true as const, historyCount: 18, rowCount: bundle.counts.nativeRows }));
    const verifyPlot = vi.fn(() => ({ ok: true as const, counts: { seriesCount: 26, pointCount: bundle.counts.plotPoints } }));
    expect(() => verifyPhase8BenchmarkFinalPublication(verifierInputs(value.inputs, published), { verifyNative, verifyPlot }))
      .toThrow(/independent reconstruction/);
    expect(verifyNative).not.toHaveBeenCalled();
    expect(verifyPlot).not.toHaveBeenCalled();
  });
});
