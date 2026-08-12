import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalJson, canonicalJsonBytes, sha256Bytes, type StrictJson } from "../src/gate4-evidence.ts";
import { parsePhase8PlotRegistration } from "../src/phase8-plot-extraction.ts";
import {
  derivePhase8PlotV3Bundle,
  parsePhase8PlotAdjudication,
  validatePhase8PlotAdjudicationRoster,
  validatePhase8PlotAdjudicationReferences,
  type Phase8PlotAdjudicationRow,
} from "../src/phase8-plot-extraction-v3.ts";

function jsonl(rows: readonly StrictJson[]): Uint8Array {
  return new TextEncoder().encode(rows.map((row) => canonicalJson(row)).join("\n") + "\n");
}

function accepted(seriesId: string, pointId: string): Phase8PlotAdjudicationRow {
  return {
    schema: "phase8b-plot-physical-target-map-v1",
    seriesId,
    physicalPointId: pointId,
    plotId: "fixture-plot",
    thresholdPixels: 5,
    readARef: { seriesId, pointId },
    readBRef: { seriesId, pointId },
    accepted: { pixelX: 10, pixelY: 20 },
    acceptedFrom: "reader-mean",
    status: "accepted-reader-mean-same-index",
    reason: "fixture agreement",
  };
}

describe("Phase 8B adjudicated plot publication", () => {
  it("accepts one unique physical target per registered point", () => {
    const rows = [accepted("series-a", "p001"), accepted("series-a", "p002"), accepted("series-b", "p001")];
    expect(validatePhase8PlotAdjudicationRoster([
      { selectionId: "series-a", expectedPointCount: 2 },
      { selectionId: "series-b", expectedPointCount: 1 },
    ], rows)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects a duplicated physical target", () => {
    const first = accepted("series-a", "p001");
    const second = { ...accepted("series-a", "p002"), physicalPointId: "p001" };
    expect(() => validatePhase8PlotAdjudicationRoster([{ selectionId: "series-a", expectedPointCount: 2 }], [first, second]))
      .toThrow(/duplicate adjudicated physical target/);
  });

  it("rejects a null accepted coordinate", () => {
    const row = accepted("series-a", "p001") as unknown as Record<string, StrictJson>;
    row.accepted = null;
    row.thirdReview = null;
    expect(() => parsePhase8PlotAdjudication(jsonl([row]))).toThrow(/accepted must be an object/);
  });

  it("rejects a per-series accepted-target count mismatch", () => {
    expect(() => validatePhase8PlotAdjudicationRoster([{ selectionId: "series-a", expectedPointCount: 2 }], [accepted("series-a", "p001")]))
      .toThrow(/physical-target count differs/);
  });

  it("rejects accepted pixels that do not equal their declared coordinate source", () => {
    const row = { ...accepted("series-a", "p001"), accepted: { pixelX: 11, pixelY: 20 } };
    const raw = (readerId: "read-a" | "read-b") => ({
      schema: "phase8b-plot-read-v1" as const,
      readerId,
      seriesId: "series-a",
      pointId: "p001",
      pixelX: 10,
      pixelY: 20,
      markerStatus: "clear" as const,
    });
    expect(() => validatePhase8PlotAdjudicationReferences([row], [raw("read-a")], [raw("read-b")]))
      .toThrow(/accepted pixels do not equal acceptedFrom source/);
  });

  it("builds all 431 registered rows from a complete adjudicated fixture", () => {
    const baseOperatorBytes = new Uint8Array(readFileSync("research/phase8b-plot-operator-v2.json"));
    const selectionBytes = new Uint8Array(readFileSync("evidence/phase8b-benchmark-selection-v1/selection.jsonl"));
    const base = parsePhase8PlotRegistration(baseOperatorBytes);
    const plotById = new Map(base.plots.map((plot) => [plot.plotId, plot]));
    const readA: StrictJson[] = [];
    const readB: StrictJson[] = [];
    const adjudication: StrictJson[] = [];
    for (const series of base.series) {
      const plot = plotById.get(series.plotId)!;
      for (let index = 0; index < series.expectedPointCount; index += 1) {
        const pointId = `p${String(index + 1).padStart(3, "0")}`;
        const pixelX = plot.bounds.left + 1 + index * ((plot.bounds.right - plot.bounds.left - 2) / Math.max(1, series.expectedPointCount - 1));
        const pixelY = (plot.bounds.top + plot.bounds.bottom) / 2;
        const a: Record<string, StrictJson> = { schema: "phase8b-plot-read-v1", readerId: "read-a", seriesId: series.selectionId, pointId, pixelX, pixelY, markerStatus: "clear" };
        const b: Record<string, StrictJson> = { ...a, readerId: "read-b" };
        const acceptedPixels: Record<string, StrictJson> = { pixelX, pixelY };
        if (series.verticalOrderSpan === "required") {
          a.orderSpanTopPixelY = pixelY - 2;
          a.orderSpanBottomPixelY = pixelY + 2;
          b.orderSpanTopPixelY = pixelY - 2;
          b.orderSpanBottomPixelY = pixelY + 2;
          acceptedPixels.orderSpanTopPixelY = pixelY - 2;
          acceptedPixels.orderSpanBottomPixelY = pixelY + 2;
        }
        readA.push(a);
        readB.push(b);
        adjudication.push({
          schema: "phase8b-plot-physical-target-map-v1",
          seriesId: series.selectionId,
          physicalPointId: pointId,
          plotId: series.plotId,
          thresholdPixels: plot.maximumReaderDisagreementPixels,
          readARef: { seriesId: series.selectionId, pointId },
          readBRef: { seriesId: series.selectionId, pointId },
          accepted: acceptedPixels,
          acceptedFrom: "reader-mean",
          status: "accepted-reader-mean-same-index",
          reason: "complete synthetic fixture",
          thirdReview: null,
        });
      }
    }
    const readABytes = jsonl(readA);
    const readBBytes = jsonl(readB);
    const adjudicationBytes = jsonl(adjudication);
    const adjudicationReportBytes = canonicalJsonBytes({
      state: "complete",
      counts: {
        targetRows: 431,
        uniquePhysicalTargets: 431,
        unresolved: 0,
        readA: { validReferenced: 431, orphanRejected: 0, orphanRejectedKeys: [] },
        readB: { validReferenced: 431, orphanRejected: 0, orphanRejectedKeys: [] },
      },
      orphanRawClicks: { readA: [], readB: [] },
    });
    const registrationBytes = canonicalJsonBytes({
      schema: "phase8b-adjudicated-plot-publication-registration-v1",
      operator: "phase8b-adjudicated-plot-digitization-v3",
      scope: "test-fixture",
      baseOperator: { path: "research/phase8b-plot-operator-v2.json", sha256: sha256Bytes(baseOperatorBytes) },
      selection: { path: base.selection.path, sha256: sha256Bytes(selectionBytes), seriesCount: 26 },
      inputs: {
        readA: { path: "fixture/read-a.jsonl", sha256: sha256Bytes(readABytes), rowCount: 431 },
        readB: { path: "fixture/read-b.jsonl", sha256: sha256Bytes(readBBytes), rowCount: 431 },
        adjudication: { path: "fixture/adjudication.jsonl", sha256: sha256Bytes(adjudicationBytes), rowCount: 431 },
        adjudicationReport: { path: "fixture/adjudication-report.json", sha256: sha256Bytes(adjudicationReportBytes) },
      },
      output: {
        physicalStorageRoot: "/fixture",
        dataLogicalRoot: "plot-v3",
        expectedSeriesCount: 26,
        expectedPointCount: 431,
      },
      policy: {
        acceptedCoordinate: "adjudication.accepted",
        pointIdentity: "seriesId-plus-physicalPointId",
        rosterRule: "one-accepted-unique-physical-target-per-registered-point",
        pixelUncertainty: "marker-half-width-plus-full-reader-threshold-plus-unused-anchor-residual",
      },
    });
    const bundle = derivePhase8PlotV3Bundle({
      publicationRegistrationBytes: registrationBytes,
      baseOperatorBytes,
      selectionBytes,
      readABytes,
      readBBytes,
      adjudicationBytes,
      adjudicationReportBytes,
    });
    expect(bundle.counts).toMatchObject({ seriesCount: 26, pointCount: 431 });
    expect(bundle.dataArtifacts).toHaveLength(26);
    expect(bundle.metadataArtifacts).toHaveLength(4);
  });
});
