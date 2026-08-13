// Phase 9 S4: pure planar broad-facet and two-branch-prism evaluators.
//
// This module deliberately has no file I/O and never treats the plotted Sei-Gonda
// supersaturation as a measured surface value. The frozen protocol owns source identities,
// mapping status, and the finite roster. These functions own only deterministic arithmetic,
// fail-closed domain checks, and score aggregation over caller-supplied observations.

import {
  alphaHK,
  nucleationAPrism,
  sigma0Basal,
  sigma0Prism,
  vKin,
  type FacetClass,
} from "../../core/src/libbrecht.ts";

export type Phase9MfMk2Facet = "basal" | "prism";

export const PHASE9_MF_MK2_CLAIM_BOUNDARY = Object.freeze({
  developmentEvidenceOnly: true,
  grantsValidationClaim: false,
  absoluteSurfaceKineticsScoreAvailable: false,
  morphologyPromotionAvailable: false,
  sourceDispersionReported: false,
  modelUncertaintyComplete: false,
});

export interface Phase9MfMk2SeriesRegistration {
  readonly selectionId: string;
  readonly temperatureC: -7 | -15 | -30;
  readonly facet: Phase9MfMk2Facet;
  readonly rowCount: 13 | 17 | 19;
  readonly rowSha256: string;
  readonly metadataRecordSha256: string;
  readonly pressurePa: 40;
  readonly lineageId: "sei-gonda-1989-low-pressure-campaign";
}

const METADATA_RECORD_SHA256 =
  "3b22753b246e1ddd026daa8fe8eaab170971c71ef7d9fb63e0d25c8ad91547c8";

export const PHASE9_MF_MK2_SERIES = Object.freeze([
  Object.freeze({
    selectionId: "P8B-P1-S89-F3-BASAL",
    temperatureC: -7,
    facet: "basal",
    rowCount: 17,
    rowSha256: "92dc2a29c92e9e5f8ffde2848c2caca20df0598c876c22b8d2421aaf98d3a975",
    metadataRecordSha256: METADATA_RECORD_SHA256,
    pressurePa: 40,
    lineageId: "sei-gonda-1989-low-pressure-campaign",
  }),
  Object.freeze({
    selectionId: "P8B-P1-S89-F3-PRISM",
    temperatureC: -7,
    facet: "prism",
    rowCount: 17,
    rowSha256: "d8f2d875f7cd24e0af428019085f8c7910a3fcd4851d7e819ef6ea2a92dd0bd4",
    metadataRecordSha256: METADATA_RECORD_SHA256,
    pressurePa: 40,
    lineageId: "sei-gonda-1989-low-pressure-campaign",
  }),
  Object.freeze({
    selectionId: "P8B-P1-S89-F4-BASAL",
    temperatureC: -15,
    facet: "basal",
    rowCount: 19,
    rowSha256: "8dff5fc6062dc6256f7af552d7b64d0fd88c61f9e146b081409cc3dfed0f6307",
    metadataRecordSha256: METADATA_RECORD_SHA256,
    pressurePa: 40,
    lineageId: "sei-gonda-1989-low-pressure-campaign",
  }),
  Object.freeze({
    selectionId: "P8B-P1-S89-F4-PRISM",
    temperatureC: -15,
    facet: "prism",
    rowCount: 13,
    rowSha256: "dbca0de2a05e3cc1abf5a53794369a9ae7e56f2737eac6eb07c9793c2e88da14",
    metadataRecordSha256: METADATA_RECORD_SHA256,
    pressurePa: 40,
    lineageId: "sei-gonda-1989-low-pressure-campaign",
  }),
  Object.freeze({
    selectionId: "P8B-P1-S89-F5-BASAL",
    temperatureC: -30,
    facet: "basal",
    rowCount: 17,
    rowSha256: "b26d4d426f984a24d6fad9fdf8650547ee7ade14acdcc792eff38e7ca608a34d",
    metadataRecordSha256: METADATA_RECORD_SHA256,
    pressurePa: 40,
    lineageId: "sei-gonda-1989-low-pressure-campaign",
  }),
  Object.freeze({
    selectionId: "P8B-P1-S89-F5-PRISM",
    temperatureC: -30,
    facet: "prism",
    rowCount: 13,
    rowSha256: "c956a03816ffc465de6492fda7489111a0482ef51160bfb88d16c8d6c57eada1",
    metadataRecordSha256: METADATA_RECORD_SHA256,
    pressurePa: 40,
    lineageId: "sei-gonda-1989-low-pressure-campaign",
  }),
] as const satisfies readonly Phase9MfMk2SeriesRegistration[]);

export type Phase9MfMk2SeriesId = (typeof PHASE9_MF_MK2_SERIES)[number]["selectionId"];

export type Phase9MfMk2MappingId =
  | "diagnostic-proportional-q0.125"
  | "diagnostic-proportional-q0.25"
  | "diagnostic-proportional-q0.5"
  | "diagnostic-proportional-q0.75"
  | "diagnostic-identity-q1"
  | "source-identified-surface-map"
  | "invented-diffusion-correction";

export interface Phase9MfMk2MappingRegistration {
  readonly id: Phase9MfMk2MappingId;
  readonly status: "diagnostic-only" | "source-blocked" | "refused";
  readonly surfaceToPlottedRatio: 0.125 | 0.25 | 0.5 | 0.75 | 1 | null;
  readonly reason: string;
}

export const PHASE9_MF_MK2_MAPPING_FAMILY = Object.freeze([
  Object.freeze({
    id: "diagnostic-proportional-q0.125",
    status: "diagnostic-only",
    surfaceToPlottedRatio: 0.125,
    reason: "pre-score parameter-space point; not a source-derived transport correction",
  }),
  Object.freeze({
    id: "diagnostic-proportional-q0.25",
    status: "diagnostic-only",
    surfaceToPlottedRatio: 0.25,
    reason: "pre-score parameter-space point; not a source-derived transport correction",
  }),
  Object.freeze({
    id: "diagnostic-proportional-q0.5",
    status: "diagnostic-only",
    surfaceToPlottedRatio: 0.5,
    reason: "pre-score parameter-space point; not a source-derived transport correction",
  }),
  Object.freeze({
    id: "diagnostic-proportional-q0.75",
    status: "diagnostic-only",
    surfaceToPlottedRatio: 0.75,
    reason: "pre-score parameter-space point; not a source-derived transport correction",
  }),
  Object.freeze({
    id: "diagnostic-identity-q1",
    status: "diagnostic-only",
    surfaceToPlottedRatio: 1,
    reason: "identity endpoint diagnostic only; it does not relabel the plotted apparatus value",
  }),
  Object.freeze({
    id: "source-identified-surface-map",
    status: "source-blocked",
    surfaceToPlottedRatio: null,
    reason: "no source-identified apparatus-to-surface mapping is frozen",
  }),
  Object.freeze({
    id: "invented-diffusion-correction",
    status: "refused",
    surfaceToPlottedRatio: null,
    reason: "the source lacks the geometry and transport closure needed for such a correction",
  }),
] as const satisfies readonly Phase9MfMk2MappingRegistration[]);

export const PHASE9_MF_MK2_DIAGNOSTIC_MAPPING_IDS = Object.freeze(
  PHASE9_MF_MK2_MAPPING_FAMILY
    .filter((entry) => entry.status === "diagnostic-only")
    .map((entry) => entry.id),
);

export interface Phase9MfMk2AnnexBranch {
  readonly prefactor: number;
  readonly sigma0Fraction: number;
}

export const PHASE9_MK2_PRISM_ANNEX = Object.freeze({
  [-7]: Object.freeze([
    Object.freeze({ prefactor: 0.5, sigma0Fraction: 0.008 }),
    Object.freeze({ prefactor: 0.5, sigma0Fraction: 0.01 }),
  ]),
  [-15]: Object.freeze([
    Object.freeze({ prefactor: 1, sigma0Fraction: 0.03 }),
  ]),
} as const satisfies Readonly<Record<-7 | -15, readonly Phase9MfMk2AnnexBranch[]>>);

export interface Phase9MfMk2Interval {
  readonly lower: number;
  readonly value: number;
  readonly upper: number;
}

export interface Phase9MfMk2Observation {
  readonly selectionId: Phase9MfMk2SeriesId;
  readonly pointId: string;
  /** The source plot's apparatus coordinate; the paper does not identify it as facet-local. */
  readonly plottedApparatusSupersaturationPercent: Phase9MfMk2Interval;
  readonly normalGrowthRateUmPerS: Phase9MfMk2Interval;
}

export type Phase9MfMk2Model =
  | "mf-inherited-cak-control"
  | "mk2-prism-annex"
  | "zero-growth-control";

export type Phase9MfMk2Prediction =
  | {
      readonly status: "predicted";
      readonly rateUmPerS: number;
      readonly model: Phase9MfMk2Model;
      readonly operator:
        | "mf-inherited-cak-control"
        | "mk2-prism"
        | "mf-basal-unchanged"
        | "zero-growth";
    }
  | {
      readonly status: "ineligible";
      readonly model: Phase9MfMk2Model;
      readonly reasonCode: "MK2_NO_MINUS_30_ROW" | "MK2_OUTSIDE_PRINTED_DOMAIN";
    };

type Phase9MfMk2IneligiblePrediction = Extract<
  Phase9MfMk2Prediction,
  { readonly status: "ineligible" }
>;

export interface Phase9MfMk2PointScore {
  readonly pointId: string;
  readonly plottedApparatusSupersaturationPercent: Phase9MfMk2Interval;
  readonly mappedSurfaceSupersaturationFraction: Phase9MfMk2Interval;
  readonly observedRateUmPerS: Phase9MfMk2Interval;
  readonly predictedRateUmPerS: Phase9MfMk2Interval;
  readonly centralSquaredResidual: number;
  readonly intervalGapSquared: number;
  readonly predictionIntervalCoverage: "plotted-coordinate-digitization-only";
}

export type Phase9MfMk2SeriesScore =
  | {
      readonly status: "scored-diagnostic";
      readonly selectionId: Phase9MfMk2SeriesId;
      readonly model: Phase9MfMk2Model;
      readonly mappingId: Phase9MfMk2MappingId;
      readonly sampleCount: number;
      readonly centralMse: number;
      readonly intervalGapMse: number;
      readonly pointScores: readonly Phase9MfMk2PointScore[];
      readonly sourceDispersion: "not-reported";
      readonly modelUncertainty: "incomplete";
    }
  | {
      readonly status: "ineligible";
      readonly selectionId: Phase9MfMk2SeriesId;
      readonly model: Phase9MfMk2Model;
      readonly mappingId: Phase9MfMk2MappingId;
      readonly reasonCode:
        | "MAPPING_SOURCE_BLOCKED"
        | "MAPPING_REFUSED"
        | "MK2_NO_MINUS_30_ROW"
        | "MK2_OUTSIDE_PRINTED_DOMAIN";
    };

export interface Phase9MfMk2EqualSeriesScore {
  readonly family: Phase9MfMk2ScoreFamily;
  readonly model: Phase9MfMk2Model;
  readonly mappingId: Phase9MfMk2MappingId;
  readonly seriesIds: readonly Phase9MfMk2SeriesId[];
  readonly equalSeriesCentralMse: number;
  readonly equalSeriesIntervalGapMse: number;
  readonly pooledPointScoreForbidden: true;
}

export type Phase9MfMk2ScoreFamily =
  | "mf-six-series"
  | "mk2-four-series-domain"
  | "matched-prism-two-series"
  | "zero-control-six-series";

export interface Phase9MfMk2MatchedPrismDecision {
  readonly mappingId: Phase9MfMk2MappingId;
  readonly matchedSeriesIds: readonly ["P8B-P1-S89-F3-PRISM", "P8B-P1-S89-F4-PRISM"];
  readonly strictSeriesWins: number;
  readonly familyCentralMseLower: boolean;
  readonly familyIntervalGapNoWorse: boolean;
  readonly meetsPrecommittedDiagnosticEffect: boolean;
  readonly physicalPass: false;
  readonly promotionAvailable: false;
}

export interface Phase9MfMk2ParameterSpaceDecision {
  readonly mappingIds: readonly Phase9MfMk2MappingId[];
  readonly mappingsMeetingDiagnosticEffect: number;
  readonly label: "diagnostic-all-no-pass" | "diagnostic-mapping-dependent" | "diagnostic-robust-over-grid";
  readonly physicalPass: false;
  readonly promotionAvailable: false;
  readonly stopMorphologyInterpretation: true;
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value) || Object.is(value, -0)) {
    throw new Error(`${label} must be finite and must not be negative zero`);
  }
  return value;
}

function validateInterval(interval: Phase9MfMk2Interval, label: string): void {
  finite(interval.lower, `${label}.lower`);
  finite(interval.value, `${label}.value`);
  finite(interval.upper, `${label}.upper`);
  if (!(interval.lower <= interval.value && interval.value <= interval.upper)) {
    throw new Error(`${label} must satisfy lower <= value <= upper`);
  }
}

function registration(selectionId: Phase9MfMk2SeriesId): Phase9MfMk2SeriesRegistration {
  const found = PHASE9_MF_MK2_SERIES.find((entry) => entry.selectionId === selectionId);
  if (found === undefined) throw new Error(`unregistered Phase 9 planar series: ${selectionId}`);
  return found;
}

function mappingRegistration(mappingId: Phase9MfMk2MappingId): Phase9MfMk2MappingRegistration {
  const found = PHASE9_MF_MK2_MAPPING_FAMILY.find((entry) => entry.id === mappingId);
  if (found === undefined) throw new Error(`unregistered Phase 9 planar mapping: ${mappingId}`);
  return found;
}

function assertRegisteredModel(model: Phase9MfMk2Model): void {
  if (
    model !== "mf-inherited-cak-control" &&
    model !== "mk2-prism-annex" &&
    model !== "zero-growth-control"
  ) {
    throw new Error(`unregistered Phase 9 planar model: ${String(model)}`);
  }
}

export function phase9MfMk2PreflightRoster(
  roster: readonly Phase9MfMk2SeriesRegistration[],
): true {
  if (roster.length !== PHASE9_MF_MK2_SERIES.length) {
    throw new Error("Phase 9 planar roster must contain exactly six registered series");
  }
  for (let index = 0; index < PHASE9_MF_MK2_SERIES.length; index++) {
    const expected = PHASE9_MF_MK2_SERIES[index];
    const actual = roster[index];
    if (actual === undefined || expected === undefined) throw new Error("Phase 9 planar roster differs");
    for (const key of [
      "selectionId",
      "temperatureC",
      "facet",
      "rowCount",
      "rowSha256",
      "metadataRecordSha256",
      "pressurePa",
      "lineageId",
    ] as const) {
      if (actual[key] !== expected[key]) throw new Error(`Phase 9 planar roster differs at ${index}.${key}`);
    }
  }
  return true;
}

export function phase9MfMk2MapPlottedSupersaturation(
  plottedPercent: Phase9MfMk2Interval,
  mappingId: Phase9MfMk2MappingId,
): Phase9MfMk2Interval {
  validateInterval(plottedPercent, "plotted apparatus supersaturation");
  if (plottedPercent.value < 0) throw new Error("central plotted supersaturation must be nonnegative");
  const mapping = mappingRegistration(mappingId);
  if (mapping.status === "source-blocked") throw new Error(`MAPPING_SOURCE_BLOCKED: ${mapping.reason}`);
  if (mapping.status === "refused") throw new Error(`MAPPING_REFUSED: ${mapping.reason}`);
  const ratio = mapping.surfaceToPlottedRatio;
  if (ratio === null) throw new Error("diagnostic mapping ratio is absent");
  return Object.freeze({
    lower: (plottedPercent.lower / 100) * ratio,
    value: (plottedPercent.value / 100) * ratio,
    upper: (plottedPercent.upper / 100) * ratio,
  });
}

export function phase9MfAttachmentCoefficient(
  facet: Phase9MfMk2Facet,
  temperatureC: number,
  surfaceSupersaturationFraction: number,
): number {
  if (facet !== "basal" && facet !== "prism") {
    throw new Error(`unregistered Phase 9 planar facet: ${String(facet)}`);
  }
  finite(surfaceSupersaturationFraction, "surface supersaturation");
  return alphaHK(facet as FacetClass, temperatureC, surfaceSupersaturationFraction, "CAK");
}

export function phase9MfRateUmPerS(
  facet: Phase9MfMk2Facet,
  temperatureC: number,
  surfaceSupersaturationFraction: number,
): number {
  const coefficient = phase9MfAttachmentCoefficient(
    facet,
    temperatureC,
    surfaceSupersaturationFraction,
  );
  if (surfaceSupersaturationFraction <= 0) return 0;
  return coefficient *
    vKin(temperatureC) * surfaceSupersaturationFraction * 1e6;
}

export function phase9Mk2PrismAttachmentCoefficient(
  temperatureC: number,
  surfaceSupersaturationFraction: number,
): number {
  finite(surfaceSupersaturationFraction, "surface supersaturation");
  if (temperatureC === -30) throw new Error("MK2_NO_MINUS_30_ROW");
  if (temperatureC !== -7 && temperatureC !== -15) throw new Error("MK2_OUTSIDE_PRINTED_DOMAIN");
  if (surfaceSupersaturationFraction <= 0) return 0;
  const branches = PHASE9_MK2_PRISM_ANNEX[temperatureC];
  return branches.reduce(
    (sum, branch) => sum + branch.prefactor * Math.exp(-branch.sigma0Fraction / surfaceSupersaturationFraction),
    0,
  );
}

export function phase9MfMk2PredictRateUmPerS(
  model: Phase9MfMk2Model,
  selectionId: Phase9MfMk2SeriesId,
  surfaceSupersaturationFraction: number,
): Phase9MfMk2Prediction {
  assertRegisteredModel(model);
  const series = registration(selectionId);
  finite(surfaceSupersaturationFraction, "surface supersaturation");
  if (model === "zero-growth-control") {
    return Object.freeze({ status: "predicted", rateUmPerS: 0, model, operator: "zero-growth" });
  }
  if (model === "mf-inherited-cak-control") {
    return Object.freeze({
      status: "predicted",
      rateUmPerS: phase9MfRateUmPerS(series.facet, series.temperatureC, surfaceSupersaturationFraction),
      model,
      operator: "mf-inherited-cak-control",
    });
  }
  if (series.temperatureC === -30) {
    return Object.freeze({ status: "ineligible", model, reasonCode: "MK2_NO_MINUS_30_ROW" });
  }
  if (series.temperatureC !== -7 && series.temperatureC !== -15) {
    return Object.freeze({ status: "ineligible", model, reasonCode: "MK2_OUTSIDE_PRINTED_DOMAIN" });
  }
  if (series.facet === "basal") {
    return Object.freeze({
      status: "predicted",
      rateUmPerS: phase9MfRateUmPerS("basal", series.temperatureC, surfaceSupersaturationFraction),
      model,
      operator: "mf-basal-unchanged",
    });
  }
  const coefficient = phase9Mk2PrismAttachmentCoefficient(
    series.temperatureC,
    surfaceSupersaturationFraction,
  );
  return Object.freeze({
    status: "predicted",
    rateUmPerS: surfaceSupersaturationFraction <= 0
      ? 0
      : coefficient * vKin(series.temperatureC) * surfaceSupersaturationFraction * 1e6,
    model,
    operator: "mk2-prism",
  });
}

function predictionInterval(
  model: Phase9MfMk2Model,
  selectionId: Phase9MfMk2SeriesId,
  mapped: Phase9MfMk2Interval,
): Phase9MfMk2Interval | Phase9MfMk2IneligiblePrediction {
  const lower = phase9MfMk2PredictRateUmPerS(model, selectionId, mapped.lower);
  const value = phase9MfMk2PredictRateUmPerS(model, selectionId, mapped.value);
  const upper = phase9MfMk2PredictRateUmPerS(model, selectionId, mapped.upper);
  if (lower.status === "ineligible") return lower;
  if (value.status === "ineligible") return value;
  if (upper.status === "ineligible") return upper;
  const lowerRate = lower.rateUmPerS;
  const centralRate = value.rateUmPerS;
  const upperRate = upper.rateUmPerS;
  return Object.freeze({
    lower: Math.min(lowerRate, centralRate, upperRate),
    value: centralRate,
    upper: Math.max(lowerRate, centralRate, upperRate),
  });
}

function intervalGap(left: Phase9MfMk2Interval, right: Phase9MfMk2Interval): number {
  if (left.upper < right.lower) return right.lower - left.upper;
  if (right.upper < left.lower) return left.lower - right.upper;
  return 0;
}

export function phase9MfMk2ScoreSeries(
  model: Phase9MfMk2Model,
  mappingId: Phase9MfMk2MappingId,
  observations: readonly Phase9MfMk2Observation[],
): Phase9MfMk2SeriesScore {
  assertRegisteredModel(model);
  if (observations.length === 0) throw new Error("a planar series must contain observations");
  const selectionId = observations[0]?.selectionId as Phase9MfMk2SeriesId;
  const series = registration(selectionId);
  if (observations.length !== series.rowCount) throw new Error(`row count differs for ${selectionId}`);
  const pointIds = new Set<string>();
  const mapping = mappingRegistration(mappingId);
  if (mapping.status !== "diagnostic-only") {
    return Object.freeze({
      status: "ineligible",
      selectionId,
      model,
      mappingId,
      reasonCode: mapping.status === "source-blocked" ? "MAPPING_SOURCE_BLOCKED" : "MAPPING_REFUSED",
    });
  }
  const pointScores: Phase9MfMk2PointScore[] = [];
  for (const observation of observations) {
    if (observation.selectionId !== selectionId) throw new Error("series contains a foreign selectionId");
    if (observation.pointId.length === 0 || pointIds.has(observation.pointId)) {
      throw new Error("pointId must be nonempty and unique within a series");
    }
    pointIds.add(observation.pointId);
    validateInterval(
      observation.plottedApparatusSupersaturationPercent,
      "plotted apparatus supersaturation",
    );
    validateInterval(observation.normalGrowthRateUmPerS, "normal growth rate");
    if (observation.plottedApparatusSupersaturationPercent.value < 0) {
      throw new Error("central plotted supersaturation must be nonnegative");
    }
    if (observation.normalGrowthRateUmPerS.value < 0) {
      throw new Error("central normal growth rate must be nonnegative");
    }
    const mapped = phase9MfMk2MapPlottedSupersaturation(
      observation.plottedApparatusSupersaturationPercent,
      mappingId,
    );
    const predicted = predictionInterval(model, selectionId, mapped);
    if ("reasonCode" in predicted) {
      return Object.freeze({
        status: "ineligible",
        selectionId,
        model,
        mappingId,
        reasonCode: predicted.reasonCode,
      });
    }
    const residual = predicted.value - observation.normalGrowthRateUmPerS.value;
    const gap = intervalGap(predicted, observation.normalGrowthRateUmPerS);
    pointScores.push(Object.freeze({
      pointId: observation.pointId,
      plottedApparatusSupersaturationPercent: Object.freeze({
        ...observation.plottedApparatusSupersaturationPercent,
      }),
      mappedSurfaceSupersaturationFraction: mapped,
      observedRateUmPerS: Object.freeze({ ...observation.normalGrowthRateUmPerS }),
      predictedRateUmPerS: predicted,
      centralSquaredResidual: residual * residual,
      intervalGapSquared: gap * gap,
      predictionIntervalCoverage: "plotted-coordinate-digitization-only",
    }));
  }
  const divisor = pointScores.length;
  return Object.freeze({
    status: "scored-diagnostic",
    selectionId,
    model,
    mappingId,
    sampleCount: divisor,
    centralMse: pointScores.reduce((sum, point) => sum + point.centralSquaredResidual, 0) / divisor,
    intervalGapMse: pointScores.reduce((sum, point) => sum + point.intervalGapSquared, 0) / divisor,
    pointScores: Object.freeze(pointScores),
    sourceDispersion: "not-reported",
    modelUncertainty: "incomplete",
  });
}

export function phase9MfMk2EqualSeriesScore(
  scores: readonly Phase9MfMk2SeriesScore[],
  family: Phase9MfMk2ScoreFamily,
): Phase9MfMk2EqualSeriesScore {
  const expectedSeriesIds = PHASE9_MF_MK2_FAMILY_ROSTERS[family];
  if (scores.length !== expectedSeriesIds.length || scores.length === 0) {
    throw new Error("equal-series score must contain the exact registered series roster");
  }
  const byId = new Map(scores.map((score) => [score.selectionId, score]));
  if (byId.size !== scores.length) throw new Error("equal-series score contains a duplicate series");
  const ordered = expectedSeriesIds.map((id) => {
    const score = byId.get(id);
    if (score === undefined) throw new Error(`equal-series score is missing ${id}`);
    if (score.status !== "scored-diagnostic") throw new Error(`equal-series score contains ineligible ${id}`);
    return score;
  });
  const model = ordered[0]?.model;
  const mappingId = ordered[0]?.mappingId;
  if (
    model === undefined ||
    mappingId === undefined ||
    ordered.some((score) => score.model !== model || score.mappingId !== mappingId)
  ) {
    throw new Error("equal-series score mixes models or diagnostic mappings");
  }
  if (
    (family === "mf-six-series" && model !== "mf-inherited-cak-control") ||
    (family === "mk2-four-series-domain" && model !== "mk2-prism-annex") ||
    (family === "matched-prism-two-series" &&
      model !== "mf-inherited-cak-control" &&
      model !== "mk2-prism-annex") ||
    (family === "zero-control-six-series" && model !== "zero-growth-control")
  ) {
    throw new Error(`equal-series score uses the wrong model for ${family}`);
  }
  return Object.freeze({
    family,
    model,
    mappingId,
    seriesIds: Object.freeze([...expectedSeriesIds]),
    equalSeriesCentralMse: ordered.reduce((sum, score) => sum + score.centralMse, 0) / ordered.length,
    equalSeriesIntervalGapMse: ordered.reduce((sum, score) => sum + score.intervalGapMse, 0) / ordered.length,
    pooledPointScoreForbidden: true,
  });
}

const MATCHED_PRISM_IDS = Object.freeze([
  "P8B-P1-S89-F3-PRISM",
  "P8B-P1-S89-F4-PRISM",
] as const);

export const PHASE9_MF_MK2_FAMILY_ROSTERS = Object.freeze({
  "mf-six-series": Object.freeze(PHASE9_MF_MK2_SERIES.map((entry) => entry.selectionId)),
  "mk2-four-series-domain": Object.freeze([
    "P8B-P1-S89-F3-BASAL",
    "P8B-P1-S89-F3-PRISM",
    "P8B-P1-S89-F4-BASAL",
    "P8B-P1-S89-F4-PRISM",
  ] as const),
  "matched-prism-two-series": MATCHED_PRISM_IDS,
  "zero-control-six-series": Object.freeze(PHASE9_MF_MK2_SERIES.map((entry) => entry.selectionId)),
} as const satisfies Readonly<Record<Phase9MfMk2ScoreFamily, readonly Phase9MfMk2SeriesId[]>>);

function canonicalIds(ids: readonly string[]): string {
  return JSON.stringify(ids);
}

export function phase9MfMk2DecideMatchedPrism(
  mappingId: Phase9MfMk2MappingId,
  mfScores: readonly Phase9MfMk2SeriesScore[],
  mk2Scores: readonly Phase9MfMk2SeriesScore[],
): Phase9MfMk2MatchedPrismDecision {
  const baseline = phase9MfMk2EqualSeriesScore(mfScores, "matched-prism-two-series");
  const intervention = phase9MfMk2EqualSeriesScore(mk2Scores, "matched-prism-two-series");
  const mfById = new Map(mfScores.map((score) => [score.selectionId, score]));
  const mk2ById = new Map(mk2Scores.map((score) => [score.selectionId, score]));
  let strictSeriesWins = 0;
  for (const id of MATCHED_PRISM_IDS) {
    const mf = mfById.get(id);
    const mk2 = mk2ById.get(id);
    if (mf?.status !== "scored-diagnostic" || mk2?.status !== "scored-diagnostic") {
      throw new Error(`matched prism score is unavailable for ${id}`);
    }
    if (mf.mappingId !== mappingId || mk2.mappingId !== mappingId) {
      throw new Error("matched prism scores use a different mapping");
    }
    if (mf.model !== "mf-inherited-cak-control" || mk2.model !== "mk2-prism-annex") {
      throw new Error("matched prism scores use the wrong baseline or intervention");
    }
    if (mk2.centralMse < mf.centralMse) strictSeriesWins++;
  }
  const familyCentralMseLower = intervention.equalSeriesCentralMse < baseline.equalSeriesCentralMse;
  const familyIntervalGapNoWorse =
    intervention.equalSeriesIntervalGapMse <= baseline.equalSeriesIntervalGapMse;
  return Object.freeze({
    mappingId,
    matchedSeriesIds: MATCHED_PRISM_IDS,
    strictSeriesWins,
    familyCentralMseLower,
    familyIntervalGapNoWorse,
    meetsPrecommittedDiagnosticEffect:
      strictSeriesWins === MATCHED_PRISM_IDS.length && familyCentralMseLower && familyIntervalGapNoWorse,
    physicalPass: false,
    promotionAvailable: false,
  });
}

export function phase9MfMk2DecideParameterSpace(
  decisions: readonly Phase9MfMk2MatchedPrismDecision[],
): Phase9MfMk2ParameterSpaceDecision {
  if (decisions.length !== PHASE9_MF_MK2_DIAGNOSTIC_MAPPING_IDS.length) {
    throw new Error("parameter-space decision must contain every registered diagnostic mapping");
  }
  const byMapping = new Map(decisions.map((decision) => [decision.mappingId, decision]));
  if (byMapping.size !== decisions.length) throw new Error("parameter-space decision contains duplicate mappings");
  for (const mappingId of PHASE9_MF_MK2_DIAGNOSTIC_MAPPING_IDS) {
    if (!byMapping.has(mappingId)) throw new Error(`parameter-space decision is missing ${mappingId}`);
  }
  const mappingsMeetingDiagnosticEffect = decisions.filter(
    (decision) => {
      const derived =
        decision.strictSeriesWins === MATCHED_PRISM_IDS.length &&
        decision.familyCentralMseLower &&
        decision.familyIntervalGapNoWorse;
      if (
        decision.meetsPrecommittedDiagnosticEffect !== derived ||
        decision.physicalPass !== false ||
        decision.promotionAvailable !== false ||
        canonicalIds(decision.matchedSeriesIds) !== canonicalIds(MATCHED_PRISM_IDS)
      ) {
        throw new Error(`parameter-space decision ${decision.mappingId} is internally inconsistent`);
      }
      return derived;
    },
  ).length;
  const label = mappingsMeetingDiagnosticEffect === 0
    ? "diagnostic-all-no-pass"
    : mappingsMeetingDiagnosticEffect === decisions.length
      ? "diagnostic-robust-over-grid"
      : "diagnostic-mapping-dependent";
  return Object.freeze({
    mappingIds: Object.freeze([...PHASE9_MF_MK2_DIAGNOSTIC_MAPPING_IDS]),
    mappingsMeetingDiagnosticEffect,
    label,
    physicalPass: false,
    promotionAvailable: false,
    stopMorphologyInterpretation: true,
  });
}

/** Independent analytic central-value check for the unchanged basal comparator. */
export function phase9MfExpectedCentralInputs(
  facet: Phase9MfMk2Facet,
  temperatureC: -7 | -15 | -30,
): { readonly prefactor: number; readonly sigma0Fraction: number } {
  if (facet !== "basal" && facet !== "prism") {
    throw new Error(`unregistered Phase 9 planar facet: ${String(facet)}`);
  }
  return Object.freeze({
    prefactor: facet === "basal" ? 1 : nucleationAPrism(temperatureC, "CAK"),
    sigma0Fraction: facet === "basal" ? sigma0Basal(temperatureC) : sigma0Prism(temperatureC),
  });
}
