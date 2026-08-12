import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { canonicalJson, canonicalJsonBytes, sha256Bytes } from "../src/gate4-evidence.ts";
import {
  PHASE8_PLOT_IMPLEMENTATION_PATHS,
  derivePhase8PlotBundle,
  parsePhase8PlotRegistration,
  writePhase8PlotDirectory,
  type Phase8PlotInputs,
  type Phase8PlotRead,
  type Phase8PlotRegistration,
} from "../src/phase8-plot-extraction.ts";
import { verifyPhase8PlotPublication } from "../src/phase8-plot-extraction-verify.ts";

const encoder = new TextEncoder();
const temporaryRoots: string[] = [];

afterEach(() => {
  while (temporaryRoots.length > 0) rmSync(temporaryRoots.pop() as string, { recursive: true, force: true });
});

function png(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52], 8);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

function jsonl(rows: readonly unknown[]): Uint8Array {
  return encoder.encode(rows.map((row) => canonicalJson(row)).join("\n") + "\n");
}

function read(readerId: "read-a" | "read-b", seriesId: string, pointId: string, pixelX: number, pixelY: number, span = false): Phase8PlotRead {
  return {
    schema: "phase8b-plot-read-v1",
    readerId,
    seriesId,
    pointId,
    pixelX,
    pixelY,
    markerStatus: "clear",
    ...(span ? { orderSpanTopPixelY: pixelY - 10, orderSpanBottomPixelY: pixelY + 10 } : {}),
  };
}

interface Fixture {
  readonly inputs: Phase8PlotInputs;
  readonly registration: Phase8PlotRegistration;
  readonly selectionBytes: Uint8Array;
  readonly sourceBytes: Uint8Array;
  readonly renderBytes: Uint8Array;
  readonly readA: readonly Phase8PlotRead[];
  readonly readB: readonly Phase8PlotRead[];
}

function fixture(): Fixture {
  const physicalStorageRoot = mkdtempSync(join(tmpdir(), "phase8-plot-storage-"));
  temporaryRoots.push(physicalStorageRoot);
  const sourceBytes = encoder.encode("fixture PDF bytes\n");
  const renderBytes = png(100, 100);
  const selectionBytes = jsonl([
    { id: "P8B-P1-FIXTURE-DIRECT", priorityClass: "P1" },
    { id: "P8B-P1-FIXTURE-RATIO", priorityClass: "P1" },
    { id: "P8B-P2-FIXTURE", priorityClass: "P2" },
  ]);
  const registration: Phase8PlotRegistration = {
    schema: "phase8b-plot-operator-registration-v1",
    operator: "phase8b-two-reader-plot-digitization-v1",
    scope: "test-fixture",
    selection: { path: "fixture-selection.jsonl", sha256: sha256Bytes(selectionBytes), p1SeriesCount: 2 },
    roots: {
      physicalStorageRoot,
      sourcePdfLogicalRoot: "research-cache/fixture-sources",
      renderLogicalRoot: "research-cache/fixture-renders",
      dataLogicalRoot: "research-cache/fixture-output",
    },
    renderer: { name: "fixture", version: "fixture-1", outputMode: "png" },
    readingProtocol: {
      readAView: "native pixels",
      readBView: "two-times nearest-neighbor display mapped back to source pixels",
      coordinateFrame: "source-render-pixels",
      pointOrdering: "left-to-right-then-top-to-bottom",
      independenceBoundary: "fixture readers do not exchange coordinates before both files are final",
    },
    sourcePdfs: [{ sourceId: "P8B-SOURCE-FIXTURE", fileName: "source.pdf", byteLength: sourceBytes.byteLength, sha256: sha256Bytes(sourceBytes), pageCount: 1 }],
    renders: [{
      renderId: "render-1",
      fileName: "render.png",
      sourceId: "P8B-SOURCE-FIXTURE",
      pdfPage: 1,
      pdfImageIndexOnPage: 0,
      byteLength: renderBytes.byteLength,
      sha256: sha256Bytes(renderBytes),
      widthPixels: 100,
      heightPixels: 100,
      extractionCommand: "fixture render",
    }],
    plots: [{
      plotId: "plot-1",
      renderId: "render-1",
      sourceLocator: "pdf-page:1;Figure fixture",
      bounds: { left: 0, right: 100, top: 0, bottom: 100 },
      xAxis: {
        variable: "time",
        unit: "s",
        transform: "linear",
        fitAnchors: [{ pixel: 0, value: 0 }, { pixel: 100, value: 10 }],
        validationAnchors: [{ pixel: 50, value: 5 }],
        validationTolerancePixels: 1,
      },
      yAxis: {
        variable: "length",
        unit: "um",
        transform: "linear",
        fitAnchors: [{ pixel: 100, value: 0 }, { pixel: 0, value: 10 }],
        validationAnchors: [{ pixel: 50, value: 5 }],
        validationTolerancePixels: 1,
      },
      markerCenterHalfWidthPixels: 1,
      maximumReaderDisagreementPixels: 5,
    }],
    series: [
      {
        selectionId: "P8B-P1-FIXTURE-DIRECT",
        expectedPointCount: 1,
        preReadRefusal: { candidateCount: 0, reason: "all intended fixture markers are visually distinct" },
        plotId: "plot-1",
        marker: { shape: "circle", fill: "filled" },
        sourceStatus: "direct-observation",
        verticalOrderSpan: "absent",
        phase9EvidenceRole: "model-development",
        lineageId: "fixture-campaign",
        conditions: { tempC: -5 },
        sourceUncertainty: { status: "not-reported" },
        exclusions: ["fitted line"],
      },
      {
        selectionId: "P8B-P1-FIXTURE-RATIO",
        expectedPointCount: 1,
        preReadRefusal: { candidateCount: 1, reason: "one deliberately unresolvable fixture candidate is excluded before coordinate reading" },
        plotId: "plot-1",
        marker: { shape: "square", fill: "open" },
        sourceStatus: "source-derived-ratio",
        verticalOrderSpan: "required",
        phase9EvidenceRole: "model-development",
        lineageId: "fixture-campaign",
        conditions: { tempC: -7 },
        sourceUncertainty: { status: "order-span-separate" },
        exclusions: ["eye guide"],
      },
    ],
  };
  const readA = [read("read-a", "P8B-P1-FIXTURE-DIRECT", "p001", 20, 70), read("read-a", "P8B-P1-FIXTURE-RATIO", "p001", 40, 60, true)];
  const readB = [read("read-b", "P8B-P1-FIXTURE-DIRECT", "p001", 22, 68), read("read-b", "P8B-P1-FIXTURE-RATIO", "p001", 42, 58, true)];
  const implementation = new Map(PHASE8_PLOT_IMPLEMENTATION_PATHS.map((path) => [path, encoder.encode(`fixture implementation ${path}\n`)]));
  return {
    inputs: {
      registrationBytes: canonicalJsonBytes(registration),
      selectionBytes,
      sourcePdfs: new Map([["source.pdf", sourceBytes]]),
      renders: new Map([["render.png", renderBytes]]),
      readABytes: jsonl(readA),
      readBBytes: jsonl(readB),
      implementation,
    },
    registration,
    selectionBytes,
    sourceBytes,
    renderBytes,
    readA,
    readB,
  };
}

describe("Phase 8B plot extraction", () => {
  it("parses the frozen 26-series operator before target-coordinate reading", () => {
    const selectionBytes = readFileSync("evidence/phase8b-benchmark-selection-v1/selection.jsonl");
    const registration = parsePhase8PlotRegistration(readFileSync("research/phase8b-plot-operator-v1.json"));
    const selectedP1Ids = selectionBytes.toString("utf8").trimEnd().split("\n")
      .map((line) => JSON.parse(line) as { id: string; priorityClass: string })
      .filter((row) => row.priorityClass === "P1")
      .map((row) => row.id)
      .sort();
    expect(registration.selection.sha256).toBe(sha256Bytes(selectionBytes));
    expect(registration.series.map((series) => series.selectionId).sort()).toEqual(selectedP1Ids);
    expect(registration.series.reduce((sum, series) => sum + series.expectedPointCount, 0)).toBe(419);
    expect(registration.series.reduce((sum, series) => sum + series.preReadRefusal.candidateCount, 0)).toBe(8);
    expect(registration.plots).toHaveLength(18);
    expect(registration.renders).toHaveLength(8);
    expect(registration.sourcePdfs).toHaveLength(4);
  });

  it("derives two-reader values, conservative bounds and a separate order span", () => {
    const value = fixture();
    const bundle = derivePhase8PlotBundle(value.inputs);
    expect(bundle.counts).toEqual({
      seriesCount: 2,
      pointCount: 2,
      preReadRefusedCandidateCount: 1,
      directObservationSeriesCount: 1,
      sourceDerivedRatioSeriesCount: 1,
      imposedForcingSeriesCount: 0,
    });
    const direct = JSON.parse(new TextDecoder().decode(bundle.dataArtifacts.get("rows/P8B-P1-FIXTURE-DIRECT.jsonl"))) as { x: { value: number }; y: { value: number }; sourceOrderSpan?: unknown };
    expect(direct.x.value).toBeCloseTo(2.1, 12);
    expect(direct.y.value).toBeCloseTo(3.1, 12);
    expect(direct.sourceOrderSpan).toBeUndefined();
    const ratio = JSON.parse(new TextDecoder().decode(bundle.dataArtifacts.get("rows/P8B-P1-FIXTURE-RATIO.jsonl"))) as { sourceOrderSpan: { low: { value: number }; high: { value: number } } };
    expect(ratio.sourceOrderSpan.low.value).toBeLessThan(ratio.sourceOrderSpan.high.value);
  });

  it("passes an independent producer-to-verifier reconstruction", () => {
    const value = fixture();
    const bundle = derivePhase8PlotBundle(value.inputs);
    expect(verifyPhase8PlotPublication({
      registrationBytes: value.inputs.registrationBytes,
      selectionBytes: value.inputs.selectionBytes,
      sourcePdfs: value.inputs.sourcePdfs,
      renders: value.inputs.renders,
      implementation: value.inputs.implementation,
      published: { metadataArtifacts: bundle.metadataArtifacts, dataArtifacts: bundle.dataArtifacts },
    })).toEqual({
      counts: bundle.counts,
      ok: true,
      readRowsPerReader: 2,
      renderCount: 1,
      rowArtifactCount: 2,
      sourcePdfCount: 1,
    });
  });

  it("independent verification rejects a normalized value mutation", () => {
    const value = fixture();
    const bundle = derivePhase8PlotBundle(value.inputs);
    const path = "rows/P8B-P1-FIXTURE-DIRECT.jsonl";
    const row = JSON.parse(new TextDecoder().decode(bundle.dataArtifacts.get(path))) as { x: { value: number } };
    row.x.value += 0.01;
    const dataArtifacts = new Map(bundle.dataArtifacts);
    dataArtifacts.set(path, jsonl([row]));
    expect(() => verifyPhase8PlotPublication({
      registrationBytes: value.inputs.registrationBytes,
      selectionBytes: value.inputs.selectionBytes,
      sourcePdfs: value.inputs.sourcePdfs,
      renders: value.inputs.renders,
      implementation: value.inputs.implementation,
      published: { metadataArtifacts: bundle.metadataArtifacts, dataArtifacts },
    })).toThrow(/independently reconstructed rows/);
  });

  it("refuses a selection-byte mutation", () => {
    const value = fixture();
    expect(() => derivePhase8PlotBundle({ ...value.inputs, selectionBytes: encoder.encode(`${new TextDecoder().decode(value.selectionBytes)} `) })).toThrow(/selection hash mismatch/);
  });

  it("refuses a render-byte mutation", () => {
    const value = fixture();
    const changed = value.renderBytes.slice();
    changed[23] = (changed[23] as number) ^ 1;
    expect(() => derivePhase8PlotBundle({ ...value.inputs, renders: new Map([["render.png", changed]]) })).toThrow(/render mismatch/);
  });

  it("refuses a calibration whose unused anchor misses", () => {
    const value = fixture();
    const changed: Phase8PlotRegistration = {
      ...value.registration,
      plots: [{ ...value.registration.plots[0]!, xAxis: { ...value.registration.plots[0]!.xAxis, validationAnchors: [{ pixel: 40, value: 5 }] } }],
    };
    expect(() => derivePhase8PlotBundle({ ...value.inputs, registrationBytes: canonicalJsonBytes(changed) })).toThrow(/validation residual/);
  });

  it("refuses reader roster disagreement", () => {
    const value = fixture();
    expect(() => derivePhase8PlotBundle({ ...value.inputs, readBBytes: jsonl(value.readB.slice(0, 1)) })).toThrow(/reader point rosters differ/);
  });

  it("refuses the same shared omission against the preregistered point count", () => {
    const value = fixture();
    const changed: Phase8PlotRegistration = {
      ...value.registration,
      series: value.registration.series.map((series) => series.selectionId === "P8B-P1-FIXTURE-DIRECT" ? { ...series, expectedPointCount: 2 } : series),
    };
    expect(() => derivePhase8PlotBundle({ ...value.inputs, registrationBytes: canonicalJsonBytes(changed) })).toThrow(/point roster does not match registered count/);
  });

  it("refuses a shared point-ID permutation that violates registered spatial ordering", () => {
    const value = fixture();
    const changedRegistration: Phase8PlotRegistration = {
      ...value.registration,
      series: value.registration.series.map((series) =>
        series.selectionId === "P8B-P1-FIXTURE-DIRECT" ? { ...series, expectedPointCount: 2 } : series),
    };
    const secondA = read("read-a", "P8B-P1-FIXTURE-DIRECT", "p002", 30, 65);
    const secondB = read("read-b", "P8B-P1-FIXTURE-DIRECT", "p002", 32, 63);
    const permutedA = [
      { ...value.readA[0]!, pixelX: secondA.pixelX, pixelY: secondA.pixelY },
      { ...secondA, pixelX: value.readA[0]!.pixelX, pixelY: value.readA[0]!.pixelY },
      value.readA[1]!,
    ];
    const permutedB = [
      { ...value.readB[0]!, pixelX: secondB.pixelX, pixelY: secondB.pixelY },
      { ...secondB, pixelX: value.readB[0]!.pixelX, pixelY: value.readB[0]!.pixelY },
      value.readB[1]!,
    ];
    expect(() => derivePhase8PlotBundle({
      ...value.inputs,
      registrationBytes: canonicalJsonBytes(changedRegistration),
      readABytes: jsonl(permutedA),
      readBBytes: jsonl(permutedB),
    })).toThrow(/left-to-right-then-top-to-bottom/);
  });

  it("independent verification refuses a spatially permuted published reader roster", () => {
    const value = fixture();
    const changedRegistration: Phase8PlotRegistration = {
      ...value.registration,
      series: value.registration.series.map((series) =>
        series.selectionId === "P8B-P1-FIXTURE-DIRECT" ? { ...series, expectedPointCount: 2 } : series),
    };
    const readA = [...value.readA, read("read-a", "P8B-P1-FIXTURE-DIRECT", "p002", 30, 65)];
    const readB = [...value.readB, read("read-b", "P8B-P1-FIXTURE-DIRECT", "p002", 32, 63)];
    const inputs = {
      ...value.inputs,
      registrationBytes: canonicalJsonBytes(changedRegistration),
      readABytes: jsonl(readA),
      readBBytes: jsonl(readB),
    };
    const bundle = derivePhase8PlotBundle(inputs);
    const dataArtifacts = new Map(bundle.dataArtifacts);
    const permuted = readA.map((row) => row.seriesId !== "P8B-P1-FIXTURE-DIRECT" ? row :
      row.pointId === "p001" ? { ...row, pixelX: 30, pixelY: 65 } : { ...row, pixelX: 20, pixelY: 70 });
    dataArtifacts.set("reads/read-a.jsonl", jsonl(permuted));
    expect(() => verifyPhase8PlotPublication({
      registrationBytes: inputs.registrationBytes,
      selectionBytes: inputs.selectionBytes,
      sourcePdfs: inputs.sourcePdfs,
      renders: inputs.renders,
      implementation: inputs.implementation,
      published: { metadataArtifacts: bundle.metadataArtifacts, dataArtifacts },
    })).toThrow(/left-to-right-then-top-to-bottom/);
  });

  it("refuses an ambiguous marker", () => {
    const value = fixture();
    const changed = [{ ...value.readA[0]!, markerStatus: "ambiguous" as const }, value.readA[1]!];
    expect(() => derivePhase8PlotBundle({ ...value.inputs, readABytes: jsonl(changed) })).toThrow(/refused non-clear marker/);
  });

  it("refuses reader disagreement above the frozen threshold", () => {
    const value = fixture();
    const changed = [{ ...value.readB[0]!, pixelX: 30 }, value.readB[1]!];
    expect(() => derivePhase8PlotBundle({ ...value.inputs, readBBytes: jsonl(changed) })).toThrow(/reader disagreement exceeds/);
  });

  it("refuses a missing required empirical order span", () => {
    const value = fixture();
    const changed = [value.readA[0]!, read("read-a", "P8B-P1-FIXTURE-RATIO", "p001", 40, 60, false)];
    expect(() => derivePhase8PlotBundle({ ...value.inputs, readABytes: jsonl(changed) })).toThrow(/order-span presence mismatch/);
  });

  it("refuses a dangling order-span endpoint on a no-span series", () => {
    const value = fixture();
    const changed = [{ ...value.readA[0]!, orderSpanTopPixelY: 60 }, value.readA[1]!];
    expect(() => derivePhase8PlotBundle({ ...value.inputs, readABytes: jsonl(changed) })).toThrow(/order-span presence mismatch/);
  });

  it("refuses to publish NAS row bodies inside the repository", () => {
    const value = fixture();
    const repositoryRoot = mkdtempSync(join(tmpdir(), "phase8-plot-repo-"));
    temporaryRoots.push(repositoryRoot);
    const registration: Phase8PlotRegistration = {
      ...value.registration,
      roots: { ...value.registration.roots, physicalStorageRoot: repositoryRoot, dataLogicalRoot: "evidence/bad-row-publication" },
    };
    const bundle = derivePhase8PlotBundle({ ...value.inputs, registrationBytes: canonicalJsonBytes(registration) });
    const directory = join(repositoryRoot, "evidence", "bad-row-publication");
    expect(() => writePhase8PlotDirectory(directory, bundle, { repositoryRoot })).toThrow(/must not be published inside/);
    expect(() => readFileSync(directory)).toThrow();
  });

  it("refuses row publication at an arbitrary external path instead of its bound storage root", () => {
    const value = fixture();
    const bundle = derivePhase8PlotBundle(value.inputs);
    const arbitraryRoot = mkdtempSync(join(tmpdir(), "phase8-plot-arbitrary-"));
    temporaryRoots.push(arbitraryRoot);
    expect(() => writePhase8PlotDirectory(join(arbitraryRoot, "bundle"), bundle)).toThrow(/registered physical NAS path/);
  });
});
