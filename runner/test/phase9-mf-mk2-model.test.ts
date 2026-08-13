import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { vKin } from "../../core/src/libbrecht.ts";
import {
  PHASE9_MF_MK2_CLAIM_BOUNDARY,
  PHASE9_MF_MK2_DIAGNOSTIC_MAPPING_IDS,
  PHASE9_MF_MK2_MAPPING_FAMILY,
  PHASE9_MF_MK2_SERIES,
  PHASE9_MK2_PRISM_ANNEX,
  phase9MfAttachmentCoefficient,
  phase9MfMk2DecideMatchedPrism,
  phase9MfMk2DecideParameterSpace,
  phase9MfMk2EqualSeriesScore,
  phase9MfMk2MapPlottedSupersaturation,
  phase9MfMk2PredictRateUmPerS,
  phase9MfMk2PreflightRoster,
  phase9MfMk2ScoreSeries,
  phase9MfRateUmPerS,
  phase9Mk2PrismAttachmentCoefficient,
  type Phase9MfMk2Interval,
  type Phase9MfMk2Facet,
  type Phase9MfMk2MatchedPrismDecision,
  type Phase9MfMk2Model,
  type Phase9MfMk2Observation,
  type Phase9MfMk2SeriesId,
  type Phase9MfMk2SeriesRegistration,
} from "../src/phase9-mf-mk2-model.ts";

interface FrozenProtocol {
  readonly schema: string;
  readonly adoptionCommit: string;
  readonly state: {
    readonly protocol: string;
    readonly sourceDataScoreInspected: boolean;
    readonly modelScoreProduced: boolean;
    readonly absoluteSurfaceKineticsScore: string;
    readonly grantsValidationClaim: boolean;
    readonly morphologyPromotionAvailable: boolean;
  };
  readonly entryArtifacts: readonly {
    readonly path: string;
    readonly byteLength: number;
    readonly sha256: string;
  }[];
  readonly expandedSourceCorpus: {
    readonly boundedOverlay: {
      readonly completeArtifacts: number;
      readonly pdfs: number;
      readonly zipArchives: number;
      readonly aliases: number;
      readonly modelScoresProduced: number;
    };
    readonly mfShelfAtFreeze: FrozenShelfDisposition;
    readonly mk2ShelfAtFreeze: FrozenShelfDisposition;
  };
  readonly seriesRoster: readonly {
    readonly selectionId: Phase9MfMk2SeriesId;
    readonly temperatureC: number;
    readonly facet: string;
    readonly rowCount: number;
    readonly rowArtifact: { readonly sha256: string };
  }[];
  readonly mappingFamily: readonly {
    readonly id: string;
    readonly status: string;
    readonly surfaceToPlottedRatio: number | null;
  }[];
  readonly modelOperators: {
    readonly mk2PrismAnnex: {
      readonly basalPolicy: string;
      readonly table: readonly {
        readonly temperatureC: number;
        readonly branches: readonly { readonly prefactor: number; readonly barrierFraction: number }[];
        readonly secondBranch?: string;
      }[];
      readonly minusThirtyPolicy: string;
    };
  };
  readonly score: {
    readonly familyLoss: string;
    readonly mk2MatchedAblationRoster: readonly string[];
    readonly physicalDecision: string;
    readonly stopRule: string;
  };
}

interface FrozenShelfDisposition {
  readonly sourceBlocked: false;
  readonly sourceBlockerPresent: false;
  readonly sourceBlockerIds: readonly [];
  readonly protocolDispositionRequired: true;
  readonly protocolDispositionState: "pending";
  readonly completeArtifactCount: number;
  readonly completeArtifactSha256: readonly string[];
  readonly protocolRestrictions: readonly {
    readonly artifactSha256: string;
    readonly id: string;
    readonly kind: string;
    readonly text: string;
    readonly localDisposition: "satisfied" | "retained-as-block";
    readonly localHandling: string;
  }[];
}

interface MetadataRecord {
  readonly selectionId: string;
  readonly conditions: {
    readonly airPressurePa: number;
    readonly facet: string;
    readonly temperatureC: number;
  };
  readonly lineageId: string;
  readonly expectedPointCount: number;
  readonly rowArtifact: { readonly sha256: string };
  readonly sourceUncertainty: {
    readonly perSeriesDenominator: string;
    readonly pointDispersion: string;
    readonly supersaturationAccuracyPercentAbsolute: number;
    readonly temperatureAccuracyC: number;
  };
}

function parseJsonl<T>(path: string): T[] {
  return readFileSync(resolve(path), "utf8")
    .trimEnd()
    .split("\n")
    .map((line) => JSON.parse(line) as T);
}

function protocol(): FrozenProtocol {
  return JSON.parse(
    readFileSync(resolve("research/phase9-mf-mk2-protocol-v1.json"), "utf8"),
  ) as FrozenProtocol;
}

function fileIdentity(path: string): { readonly byteLength: number; readonly sha256: string } {
  const bytes = readFileSync(resolve(path));
  return {
    byteLength: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

function interval(value: number, halfWidth = 0): Phase9MfMk2Interval {
  return { lower: value - halfWidth, value, upper: value + halfWidth };
}

function syntheticSeries(
  selectionId: Phase9MfMk2SeriesId,
  target: "mf-inherited-cak-control" | "mk2-prism-annex" | "zero-growth-control",
  mappingId = "diagnostic-proportional-q0.5" as const,
): Phase9MfMk2Observation[] {
  const registered = PHASE9_MF_MK2_SERIES.find((entry) => entry.selectionId === selectionId);
  if (registered === undefined) throw new Error("missing synthetic registration");
  return Array.from({ length: registered.rowCount }, (_unused, index) => {
    const plottedPercent = 1 + index * 0.01;
    const mapped = phase9MfMk2MapPlottedSupersaturation(interval(plottedPercent, 0.02), mappingId);
    const prediction = phase9MfMk2PredictRateUmPerS(target, selectionId, mapped.value);
    if (prediction.status !== "predicted") throw new Error("synthetic target is ineligible");
    return {
      selectionId,
      pointId: `synthetic-${String(index + 1).padStart(3, "0")}`,
      plottedApparatusSupersaturationPercent: interval(plottedPercent, 0.02),
      normalGrowthRateUmPerS: interval(prediction.rateUmPerS, 0.001),
    };
  });
}

describe("Phase 9 M-F/M-K2 pre-score protocol", () => {
  it("binds the pre-score state and rehashes every tracked entry artifact", () => {
    const frozen = protocol();
    expect(frozen.schema).toBe("phase9-mf-mk2-protocol-v1");
    expect(frozen.adoptionCommit).toBe("f936920edce283e90a947ee34846776da8b1859a");
    expect(frozen.state).toEqual({
      protocol: "frozen-before-model-output",
      sourceDataScoreInspected: false,
      modelScoreProduced: false,
      absoluteSurfaceKineticsScore: "source-blocked",
      parameterSpaceScore: "not-run-in-this-change",
      phase9Role: "development-only-planar-cheapest-discriminator",
      grantsValidationClaim: false,
      morphologyPromotionAvailable: false,
    });
    for (const artifact of frozen.entryArtifacts) {
      expect(fileIdentity(artifact.path), artifact.path).toEqual({
        byteLength: artifact.byteLength,
        sha256: artifact.sha256,
      });
    }
    expect(frozen.expandedSourceCorpus.boundedOverlay).toMatchObject({
      completeArtifacts: 59,
      pdfs: 55,
      zipArchives: 4,
      aliases: 70,
      modelScoresProduced: 0,
    });
    expect(frozen.expandedSourceCorpus.mfShelfAtFreeze).toMatchObject({
      sourceBlocked: false,
      sourceBlockerPresent: false,
      sourceBlockerIds: [],
      protocolDispositionRequired: true,
      protocolDispositionState: "pending",
      completeArtifactCount: 7,
    });
    expect(frozen.expandedSourceCorpus.mk2ShelfAtFreeze).toMatchObject({
      sourceBlocked: false,
      sourceBlockerPresent: false,
      sourceBlockerIds: [],
      protocolDispositionRequired: true,
      protocolDispositionState: "pending",
      completeArtifactCount: 5,
    });
    for (const shelf of [
      frozen.expandedSourceCorpus.mfShelfAtFreeze,
      frozen.expandedSourceCorpus.mk2ShelfAtFreeze,
    ]) {
      expect(shelf.protocolRestrictions.length).toBeGreaterThan(0);
      expect(new Set(shelf.protocolRestrictions.map((row) => row.id)).size).toBe(
        shelf.protocolRestrictions.length,
      );
      expect(shelf.protocolRestrictions.every((row) => row.localHandling.length > 0)).toBe(true);
      expect(shelf.protocolRestrictions.some((row) => row.localDisposition === "retained-as-block"))
        .toBe(true);
    }
    const sourceShelf = JSON.parse(
      readFileSync("evidence/phase9-source-overlay-v1/shelf-freeze.json", "utf8"),
    ) as { shelf: Array<FrozenShelfDisposition & { readonly item: string }> };
    for (const [item, frozenShelf] of [
      ["M-F", frozen.expandedSourceCorpus.mfShelfAtFreeze],
      ["M-K2", frozen.expandedSourceCorpus.mk2ShelfAtFreeze],
    ] as const) {
      const source = sourceShelf.shelf.find((row) => row.item === item);
      expect(source, item).toBeDefined();
      expect(frozenShelf.protocolRestrictions.map(({
        localDisposition: _disposition,
        localHandling: _handling,
        ...row
      }) => row))
        .toEqual(source?.protocolRestrictions);
    }
  });

  it("pins exactly the six Phase 8 rows and independently joins their metadata", () => {
    const frozen = protocol();
    expect(frozen.seriesRoster.map((entry) => ({
      selectionId: entry.selectionId,
      temperatureC: entry.temperatureC,
      facet: entry.facet,
      rowCount: entry.rowCount,
      rowSha256: entry.rowArtifact.sha256,
      metadataRecordSha256: "3b22753b246e1ddd026daa8fe8eaab170971c71ef7d9fb63e0d25c8ad91547c8",
      pressurePa: 40,
      lineageId: "sei-gonda-1989-low-pressure-campaign",
    }))).toEqual(PHASE9_MF_MK2_SERIES);
    expect(phase9MfMk2PreflightRoster(PHASE9_MF_MK2_SERIES)).toBe(true);

    const metadata = parseJsonl<MetadataRecord>("evidence/phase8b-plot-digitization-v3/records.jsonl");
    const relevant = new Map(
      metadata
        .filter((row) => PHASE9_MF_MK2_SERIES.some((entry) => entry.selectionId === row.selectionId))
        .map((row) => [row.selectionId, row]),
    );
    expect(relevant.size).toBe(6);
    for (const entry of PHASE9_MF_MK2_SERIES) {
      const row = relevant.get(entry.selectionId);
      expect(row, entry.selectionId).toBeDefined();
      expect(row).toMatchObject({
        selectionId: entry.selectionId,
        conditions: {
          airPressurePa: 40,
          temperatureC: entry.temperatureC,
        },
        lineageId: entry.lineageId,
        expectedPointCount: entry.rowCount,
        rowArtifact: { sha256: entry.rowSha256 },
        sourceUncertainty: {
          perSeriesDenominator: "not reported",
          pointDispersion: "not reported",
          supersaturationAccuracyPercentAbsolute: 0.1,
          temperatureAccuracyC: 0.01,
        },
      });
      expect(row?.conditions.facet).toContain(entry.facet === "basal" ? "basal" : "prism");
    }
  });

  it("freezes five diagnostics and refuses both unsupported absolute mappings", () => {
    const frozen = protocol();
    expect(frozen.mappingFamily).toEqual(PHASE9_MF_MK2_MAPPING_FAMILY.map((entry) => ({
      id: entry.id,
      status: entry.status,
      surfaceToPlottedRatio: entry.surfaceToPlottedRatio,
      ...(entry.id === "diagnostic-identity-q1"
        ? { limit: "identity endpoint only; not a physical identification or upper-bound claim" }
        : {}),
      ...(entry.id === "source-identified-surface-map"
        ? { prerequisite: "a source-identified local surface mapping with geometry and transport semantics" }
        : {}),
      ...(entry.id === "invented-diffusion-correction"
        ? { reason: "the required source-specific geometry and transport closure is absent" }
        : {}),
    })));
    expect(PHASE9_MF_MK2_DIAGNOSTIC_MAPPING_IDS).toEqual([
      "diagnostic-proportional-q0.125",
      "diagnostic-proportional-q0.25",
      "diagnostic-proportional-q0.5",
      "diagnostic-proportional-q0.75",
      "diagnostic-identity-q1",
    ]);
    expect(phase9MfMk2MapPlottedSupersaturation(
      { lower: -0.1, value: 2, upper: 2.1 },
      "diagnostic-proportional-q0.5",
    )).toEqual({ lower: -0.0005, value: 0.01, upper: 0.0105 });
    expect(() => phase9MfMk2MapPlottedSupersaturation(
      interval(2),
      "source-identified-surface-map",
    )).toThrow(/MAPPING_SOURCE_BLOCKED/u);
    expect(() => phase9MfMk2MapPlottedSupersaturation(
      interval(2),
      "invented-diffusion-correction",
    )).toThrow(/MAPPING_REFUSED/u);
  });

  it("keeps every physical and morphology claim unavailable", () => {
    expect(PHASE9_MF_MK2_CLAIM_BOUNDARY).toEqual({
      developmentEvidenceOnly: true,
      grantsValidationClaim: false,
      absoluteSurfaceKineticsScoreAvailable: false,
      morphologyPromotionAvailable: false,
      sourceDispersionReported: false,
      modelUncertaintyComplete: false,
    });
    const frozen = protocol();
    expect(frozen.score.physicalDecision).toContain("always unavailable");
    expect(frozen.score.stopRule).toContain("stop morphology interpretation");
    expect(frozen.score.familyLoss).toContain("per-series losses");
  });
});

describe("Phase 9 M-F/M-K2 pure rate operators", () => {
  it("recomputes the inherited CAK control from independent source anchors", () => {
    const logInterpolate = (x: number, x0: number, x1: number, y0: number, y1: number): number => {
      const weight = (Math.log(x) - Math.log(x0)) / (Math.log(x1) - Math.log(x0));
      return Math.exp(Math.log(y0) + weight * (Math.log(y1) - Math.log(y0)));
    };
    const sourceAnchors = {
      [-7]: {
        basal: { prefactor: 1, barrier: logInterpolate(7, 5, 10, 0.007, 0.014) },
        prism: { prefactor: 0.18 + ((7 - 5) / (10 - 5)) * (0.83 - 0.18), barrier: logInterpolate(7, 5, 10, 0.0027, 0.014) },
      },
      [-15]: {
        basal: { prefactor: 1, barrier: 0.024 },
        prism: { prefactor: 1, barrier: 0.032 },
      },
      [-30]: {
        basal: { prefactor: 1, barrier: 0.07 },
        prism: { prefactor: 1, barrier: 0.13 },
      },
    } as const;
    for (const temperatureC of [-7, -15, -30] as const) {
      for (const facet of ["basal", "prism"] as const) {
        const inputs = sourceAnchors[temperatureC][facet];
        for (const sigmaSurface of [0.005, 0.012, 0.04]) {
          const expectedCoefficient = inputs.prefactor * Math.exp(-inputs.barrier / sigmaSurface);
          expect(phase9MfAttachmentCoefficient(facet, temperatureC, sigmaSurface)).toBeCloseTo(
            expectedCoefficient,
            15,
          );
          expect(phase9MfRateUmPerS(facet, temperatureC, sigmaSurface)).toBeCloseTo(
            expectedCoefficient * vKin(temperatureC) * sigmaSurface * 1e6,
            15,
          );
        }
      }
    }
    expect(phase9MfAttachmentCoefficient("basal", -15, 0)).toBe(0);
  });

  it("uses exactly two M-K2 branches at minus seven and one at minus fifteen", () => {
    const frozen = protocol();
    expect(frozen.modelOperators.mk2PrismAnnex.table).toEqual([
      {
        temperatureC: -7,
        branches: [
          { prefactor: 0.5, barrierFraction: 0.008 },
          { prefactor: 0.5, barrierFraction: 0.01 },
        ],
      },
      {
        temperatureC: -15,
        branches: [{ prefactor: 1, barrierFraction: 0.03 }],
        secondBranch: "absent in the printed table",
      },
    ]);
    expect(PHASE9_MK2_PRISM_ANNEX[-7]).toHaveLength(2);
    expect(PHASE9_MK2_PRISM_ANNEX[-15]).toHaveLength(1);
    const sigmaSurface = 0.02;
    expect(phase9Mk2PrismAttachmentCoefficient(-7, sigmaSurface)).toBe(
      0.5 * Math.exp(-0.008 / sigmaSurface) + 0.5 * Math.exp(-0.01 / sigmaSurface),
    );
    expect(phase9Mk2PrismAttachmentCoefficient(-15, sigmaSurface)).toBe(
      Math.exp(-0.03 / sigmaSurface),
    );
    const predicted = phase9MfMk2PredictRateUmPerS(
      "mk2-prism-annex",
      "P8B-P1-S89-F4-PRISM",
      sigmaSurface,
    );
    expect(predicted).toMatchObject({ status: "predicted" });
    if (predicted.status === "predicted") {
      expect(predicted.rateUmPerS).toBe(
        Math.exp(-0.03 / sigmaSurface) * vKin(-15) * sigmaSurface * 1e6,
      );
    }
    expect(phase9Mk2PrismAttachmentCoefficient(-7, 0)).toBe(0);
  });

  it("refuses M-K2 at minus thirty instead of extrapolating", () => {
    expect(() => phase9Mk2PrismAttachmentCoefficient(-30, 0.02)).toThrow(/MK2_NO_MINUS_30_ROW/u);
    expect(() => phase9Mk2PrismAttachmentCoefficient(-30, 0)).toThrow(/MK2_NO_MINUS_30_ROW/u);
    for (const id of ["P8B-P1-S89-F5-BASAL", "P8B-P1-S89-F5-PRISM"] as const) {
      expect(phase9MfMk2PredictRateUmPerS("mk2-prism-annex", id, 0.02)).toEqual({
        status: "ineligible",
        model: "mk2-prism-annex",
        reasonCode: "MK2_NO_MINUS_30_ROW",
      });
    }
    expect(protocol().modelOperators.mk2PrismAnnex.minusThirtyPolicy).toContain("hard refusal");
  });

  it("keeps M-K2 basal bit-identical to M-F in its exact domain", () => {
    expect(protocol().modelOperators.mk2PrismAnnex.basalPolicy).toContain("unchanged");
    for (const [id, temperatureC] of [
      ["P8B-P1-S89-F3-BASAL", -7],
      ["P8B-P1-S89-F4-BASAL", -15],
    ] as const) {
      for (const sigmaSurface of [0, 0.001, 0.01, 0.05]) {
        const baseline = phase9MfMk2PredictRateUmPerS("mf-inherited-cak-control", id, sigmaSurface);
        const annex = phase9MfMk2PredictRateUmPerS("mk2-prism-annex", id, sigmaSurface);
        expect(baseline.status).toBe("predicted");
        expect(annex.status).toBe("predicted");
        if (baseline.status === "predicted" && annex.status === "predicted") {
          expect(annex.rateUmPerS).toBe(baseline.rateUmPerS);
          expect(annex.rateUmPerS).toBe(phase9MfRateUmPerS("basal", temperatureC, sigmaSurface));
        }
      }
    }
  });
});

describe("Phase 9 M-F/M-K2 score contracts", () => {
  it("preserves coordinate and observation intervals without inventing dispersion", () => {
    const observations = syntheticSeries("P8B-P1-S89-F3-BASAL", "mf-inherited-cak-control");
    observations[0] = {
      ...observations[0] as Phase9MfMk2Observation,
      plottedApparatusSupersaturationPercent: { lower: -0.1, value: 1, upper: 1.02 },
    };
    const score = phase9MfMk2ScoreSeries(
      "mf-inherited-cak-control",
      "diagnostic-proportional-q0.5",
      observations,
    );
    expect(score.status).toBe("scored-diagnostic");
    if (score.status === "scored-diagnostic") {
      expect(score.sampleCount).toBe(17);
      expect(score.sourceDispersion).toBe("not-reported");
      expect(score.modelUncertainty).toBe("incomplete");
      expect(score.pointScores[0]).toMatchObject({
        plottedApparatusSupersaturationPercent: { lower: -0.1, value: 1, upper: 1.02 },
        mappedSurfaceSupersaturationFraction: { lower: -0.0005, value: 0.005, upper: 0.0051 },
        predictedRateUmPerS: { lower: 0 },
        predictionIntervalCoverage: "plotted-coordinate-digitization-only",
      });
    }
  });

  it("fails closed on row-count, duplicate, and mapping seams", () => {
    const observations = syntheticSeries("P8B-P1-S89-F3-BASAL", "mf-inherited-cak-control");
    expect(() => phase9MfMk2ScoreSeries(
      "mf-inherited-cak-control",
      "diagnostic-proportional-q0.5",
      observations.slice(1),
    )).toThrow(/row count differs/u);
    const duplicate = observations.map((row, index) => index === 1 ? { ...row, pointId: observations[0]?.pointId as string } : row);
    expect(() => phase9MfMk2ScoreSeries(
      "mf-inherited-cak-control",
      "diagnostic-proportional-q0.5",
      duplicate,
    )).toThrow(/unique/u);
    expect(phase9MfMk2ScoreSeries(
      "mf-inherited-cak-control",
      "source-identified-surface-map",
      observations,
    )).toMatchObject({ status: "ineligible", reasonCode: "MAPPING_SOURCE_BLOCKED" });
    expect(phase9MfMk2ScoreSeries(
      "mf-inherited-cak-control",
      "invented-diffusion-correction",
      observations,
    )).toMatchObject({ status: "ineligible", reasonCode: "MAPPING_REFUSED" });
  });

  it("equal-weights matched series and rejects missing or duplicate series", () => {
    const first = phase9MfMk2ScoreSeries(
      "mf-inherited-cak-control",
      "diagnostic-proportional-q0.5",
      syntheticSeries("P8B-P1-S89-F3-PRISM", "mk2-prism-annex"),
    );
    const second = phase9MfMk2ScoreSeries(
      "mf-inherited-cak-control",
      "diagnostic-proportional-q0.5",
      syntheticSeries("P8B-P1-S89-F4-PRISM", "mk2-prism-annex"),
    );
    const family = phase9MfMk2EqualSeriesScore(
      [first, second],
      "matched-prism-two-series",
    );
    if (first.status !== "scored-diagnostic" || second.status !== "scored-diagnostic") {
      throw new Error("synthetic score unexpectedly ineligible");
    }
    expect(family.equalSeriesCentralMse).toBe((first.centralMse + second.centralMse) / 2);
    expect(family.pooledPointScoreForbidden).toBe(true);
    expect(() => phase9MfMk2EqualSeriesScore(
      [first],
      "matched-prism-two-series",
    )).toThrow(/exact registered series roster/u);
    expect(() => phase9MfMk2EqualSeriesScore(
      [first, first],
      "matched-prism-two-series",
    )).toThrow(/duplicate/u);
    const wrongMapping = {
      ...second,
      mappingId: "diagnostic-proportional-q0.75" as const,
    };
    expect(() => phase9MfMk2EqualSeriesScore(
      [first, wrongMapping],
      "matched-prism-two-series",
    )).toThrow(/mixes models or diagnostic mappings/u);
    expect(() => phase9MfMk2EqualSeriesScore(
      [first, second],
      "mf-six-series",
    )).toThrow(/exact registered series roster/u);
  });

  it("uses the exact matched M-F ablation and never emits a physical pass", () => {
    const mappingId = "diagnostic-proportional-q0.5" as const;
    const ids = ["P8B-P1-S89-F3-PRISM", "P8B-P1-S89-F4-PRISM"] as const;
    const baseline = ids.map((id) => phase9MfMk2ScoreSeries(
      "mf-inherited-cak-control",
      mappingId,
      syntheticSeries(id, "mk2-prism-annex", mappingId),
    ));
    const intervention = ids.map((id) => phase9MfMk2ScoreSeries(
      "mk2-prism-annex",
      mappingId,
      syntheticSeries(id, "mk2-prism-annex", mappingId),
    ));
    const decision = phase9MfMk2DecideMatchedPrism(mappingId, baseline, intervention);
    expect(decision).toMatchObject({
      strictSeriesWins: 2,
      familyCentralMseLower: true,
      familyIntervalGapNoWorse: true,
      meetsPrecommittedDiagnosticEffect: true,
      physicalPass: false,
      promotionAvailable: false,
    });
    expect(decision.matchedSeriesIds).toEqual(protocol().score.mk2MatchedAblationRoster);
  });

  it("classifies all-no-pass, mapping-dependent, and grid-robust diagnostic outcomes", () => {
    const base = PHASE9_MF_MK2_DIAGNOSTIC_MAPPING_IDS.map((mappingId) => ({
      mappingId,
      matchedSeriesIds: ["P8B-P1-S89-F3-PRISM", "P8B-P1-S89-F4-PRISM"],
      strictSeriesWins: 0,
      familyCentralMseLower: false,
      familyIntervalGapNoWorse: true,
      meetsPrecommittedDiagnosticEffect: false,
      physicalPass: false,
      promotionAvailable: false,
    } as const satisfies Phase9MfMk2MatchedPrismDecision));
    expect(phase9MfMk2DecideParameterSpace(base)).toMatchObject({
      mappingsMeetingDiagnosticEffect: 0,
      label: "diagnostic-all-no-pass",
      physicalPass: false,
      promotionAvailable: false,
      stopMorphologyInterpretation: true,
    });
    const one = base.map((entry, index) => index === 0
      ? { ...entry, strictSeriesWins: 2, familyCentralMseLower: true, meetsPrecommittedDiagnosticEffect: true }
      : entry);
    expect(phase9MfMk2DecideParameterSpace(one)).toMatchObject({
      mappingsMeetingDiagnosticEffect: 1,
      label: "diagnostic-mapping-dependent",
    });
    const every = base.map((entry) => ({
      ...entry,
      strictSeriesWins: 2,
      familyCentralMseLower: true,
      meetsPrecommittedDiagnosticEffect: true,
    }));
    expect(phase9MfMk2DecideParameterSpace(every)).toMatchObject({
      mappingsMeetingDiagnosticEffect: 5,
      label: "diagnostic-robust-over-grid",
      physicalPass: false,
      promotionAvailable: false,
    });
    expect(() => phase9MfMk2DecideParameterSpace(base.slice(1))).toThrow(/every registered/u);
    expect(() => phase9MfMk2DecideParameterSpace([base[0] as Phase9MfMk2MatchedPrismDecision, ...base.slice(0, -1)]))
      .toThrow(/duplicate/u);
    const forged = every.map((entry, index) => index === 0
      ? { ...entry, strictSeriesWins: 0 }
      : entry);
    expect(() => phase9MfMk2DecideParameterSpace(forged)).toThrow(/internally inconsistent/u);
  });

  it("keeps the zero-growth control executable and non-vacuous", () => {
    const mappingId = "diagnostic-proportional-q0.5" as const;
    const baseline = PHASE9_MF_MK2_SERIES.map(({ selectionId }) =>
      phase9MfMk2ScoreSeries(
        "mf-inherited-cak-control",
        mappingId,
        syntheticSeries(selectionId, "mf-inherited-cak-control", mappingId),
      )
    );
    const control = PHASE9_MF_MK2_SERIES.map(({ selectionId }) =>
      phase9MfMk2ScoreSeries(
        "zero-growth-control",
        mappingId,
        syntheticSeries(selectionId, "mf-inherited-cak-control", mappingId),
      )
    );
    const baselineFamily = phase9MfMk2EqualSeriesScore(baseline, "mf-six-series");
    const controlFamily = phase9MfMk2EqualSeriesScore(control, "zero-control-six-series");
    expect(baselineFamily.seriesIds).toEqual(PHASE9_MF_MK2_SERIES.map((row) => row.selectionId));
    expect(controlFamily.seriesIds).toEqual(PHASE9_MF_MK2_SERIES.map((row) => row.selectionId));
    expect(baselineFamily.equalSeriesCentralMse).toBeLessThan(controlFamily.equalSeriesCentralMse);
    for (const score of control) {
      expect(score.status).toBe("scored-diagnostic");
      if (score.status === "scored-diagnostic") {
        expect(score.pointScores.every((point) => point.predictedRateUmPerS.value === 0)).toBe(true);
      }
    }
  });

  it("rejects invented runtime model and facet names", () => {
    expect(() => phase9MfMk2PredictRateUmPerS(
      "invented-model" as Phase9MfMk2Model,
      "P8B-P1-S89-F3-PRISM",
      0.01,
    )).toThrow(/unregistered Phase 9 planar model/u);
    expect(() => phase9MfAttachmentCoefficient(
      "invented-facet" as Phase9MfMk2Facet,
      -7,
      0.01,
    )).toThrow(/unregistered Phase 9 planar facet/u);
  });

  it("rejects roster shifts even when the row count remains six", () => {
    const shifted = PHASE9_MF_MK2_SERIES.map((entry) => ({ ...entry })) as Phase9MfMk2SeriesRegistration[];
    shifted[0] = { ...shifted[0] as Phase9MfMk2SeriesRegistration, pressurePa: 41 as 40 };
    expect(() => phase9MfMk2PreflightRoster(shifted)).toThrow(/pressurePa/u);
  });
});
