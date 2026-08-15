// Independent sibling verifier for the Phase 9 S4 diagnostic publication.
//
// This module intentionally does not import the producer or the M-F/M-K2 evaluator. It reparses
// the six source JSONL bodies, restates the frozen scalar equations, recomputes every per-series
// loss and equal-series decision, and derives the candidate verdict from those bytes. The named
// mutations are re-indexed after mutation so semantic checks—not merely a stale digest—reject them.

import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import { detectPhase9NasRoot, resolvePhase9NasFile } from "./phase9-nas.ts";

const FILES = Object.freeze([
  "artifact-index.json",
  "launch-manifest.json",
  "mapping-decisions.jsonl",
  "report.json",
  "series-scores.jsonl",
] as const);
const PAYLOAD_FILES = Object.freeze(FILES.filter((path) => path !== "artifact-index.json"));
const PROTOCOL_PATH = "research/phase9-mf-mk2-protocol-v1.json";
const SCORE_LAUNCH_PATH = "research/phase9-mf-mk2-launch-v1.json";
const ADAPTER_REGISTRY_PATH = "research/phase9-adapter-registry-v1.jsonl";
const SUCCESSOR_BOOK_PATH = "evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl";
const PLOT_METADATA_PATH = "evidence/phase8b-plot-digitization-v3/records.jsonl";
const PLOT_METADATA_IDENTITY = Object.freeze({
  byteLength: 32617,
  format: "canonical-jsonl",
  path: PLOT_METADATA_PATH,
  sha256: "3b22753b246e1ddd026daa8fe8eaab170971c71ef7d9fb63e0d25c8ad91547c8",
});
const ADAPTER_RESTRICTIONS = Object.freeze([
  "development evidence only",
  "freeze far-field-to-surface mapping before a score",
  "do not invent series denominators or dispersion",
] as const);
const ADAPTER_REASONS = Object.freeze([
  "coordinates are plot digitizations with retained extraction intervals, not exact source-reported values",
  "the crystals were substrate-supported at low pressure",
  "the per-series denominator and point dispersion were not reported",
  "SURFACE_FORCING_MAPPING_UNRESOLVED",
  ...ADAPTER_RESTRICTIONS,
] as const);
const LAUNCH_REQUIRED_PATHS = Object.freeze([
  PROTOCOL_PATH,
  "runner/src/phase9-mf-mk2-model.ts",
  "runner/test/phase9-mf-mk2-model.test.ts",
  "runner/src/phase9-mf-mk2-publication.ts",
  "runner/src/phase9-mf-mk2-publication-verify.ts",
  "runner/test/phase9-mf-mk2-publication.test.ts",
  "evidence/phase9-source-overlay-v1/artifact-index.json",
  "evidence/phase9-source-overlay-v1/blockers.jsonl",
  "evidence/phase9-source-overlay-v1/report.json",
  "evidence/phase9-source-overlay-v1/shelf-freeze.json",
  "evidence/phase9-source-overlay-v1/source-audits.jsonl",
  "evidence/phase9-source-overlay-v1/source-overlay.jsonl",
  ADAPTER_REGISTRY_PATH,
  "runner/src/phase9-measurement-adapters.ts",
  "runner/test/phase9-measurement-adapters.test.ts",
] as const);

const CONTROL_IDS = Object.freeze([
  "drop-one-registered-series",
  "duplicate-one-series",
  "fabricate-minus-fifteen-second-branch",
  "attempt-minus-thirty-score",
  "change-mk2-basal-away-from-control",
  "admit-source-blocked-physical-map",
  "pool-points-instead-of-equal-series",
  "forge-adapter-eligibility",
  "erase-limitation",
] as const);

export type Phase9MfMk2PublicationMutationId = (typeof CONTROL_IDS)[number];

const SERIES = Object.freeze([
  {
    selectionId: "P8B-P1-S89-F3-BASAL",
    temperatureC: -7,
    facet: "basal",
    rowCount: 17,
    logicalRoot: "research-cache/phase8b-derived/plot-extraction-20260812-v3",
    path: "rows/P8B-P1-S89-F3-BASAL.jsonl",
    byteLength: 31924,
    sha256: "92dc2a29c92e9e5f8ffde2848c2caca20df0598c876c22b8d2421aaf98d3a975",
  },
  {
    selectionId: "P8B-P1-S89-F3-PRISM",
    temperatureC: -7,
    facet: "prism",
    rowCount: 17,
    logicalRoot: "research-cache/phase8b-derived/plot-extraction-20260812-v3",
    path: "rows/P8B-P1-S89-F3-PRISM.jsonl",
    byteLength: 31055,
    sha256: "d8f2d875f7cd24e0af428019085f8c7910a3fcd4851d7e819ef6ea2a92dd0bd4",
  },
  {
    selectionId: "P8B-P1-S89-F4-BASAL",
    temperatureC: -15,
    facet: "basal",
    rowCount: 19,
    logicalRoot: "research-cache/phase8b-derived/plot-extraction-20260812-v3",
    path: "rows/P8B-P1-S89-F4-BASAL.jsonl",
    byteLength: 35303,
    sha256: "8dff5fc6062dc6256f7af552d7b64d0fd88c61f9e146b081409cc3dfed0f6307",
  },
  {
    selectionId: "P8B-P1-S89-F4-PRISM",
    temperatureC: -15,
    facet: "prism",
    rowCount: 13,
    logicalRoot: "research-cache/phase8b-derived/plot-extraction-20260812-v3",
    path: "rows/P8B-P1-S89-F4-PRISM.jsonl",
    byteLength: 24568,
    sha256: "dbca0de2a05e3cc1abf5a53794369a9ae7e56f2737eac6eb07c9793c2e88da14",
  },
  {
    selectionId: "P8B-P1-S89-F5-BASAL",
    temperatureC: -30,
    facet: "basal",
    rowCount: 17,
    logicalRoot: "research-cache/phase8b-derived/plot-extraction-20260812-v3",
    path: "rows/P8B-P1-S89-F5-BASAL.jsonl",
    byteLength: 30994,
    sha256: "b26d4d426f984a24d6fad9fdf8650547ee7ade14acdcc792eff38e7ca608a34d",
  },
  {
    selectionId: "P8B-P1-S89-F5-PRISM",
    temperatureC: -30,
    facet: "prism",
    rowCount: 13,
    logicalRoot: "research-cache/phase8b-derived/plot-extraction-20260812-v3",
    path: "rows/P8B-P1-S89-F5-PRISM.jsonl",
    byteLength: 24344,
    sha256: "c956a03816ffc465de6492fda7489111a0482ef51160bfb88d16c8d6c57eada1",
  },
] as const);

type SeriesId = (typeof SERIES)[number]["selectionId"];
type Model = "mf-inherited-cak-control" | "mk2-prism-annex" | "zero-growth-control";
type MappingId =
  | "diagnostic-proportional-q0.125"
  | "diagnostic-proportional-q0.25"
  | "diagnostic-proportional-q0.5"
  | "diagnostic-proportional-q0.75"
  | "diagnostic-identity-q1";

const MAPPINGS = Object.freeze([
  { id: "diagnostic-proportional-q0.125", ratio: 0.125 },
  { id: "diagnostic-proportional-q0.25", ratio: 0.25 },
  { id: "diagnostic-proportional-q0.5", ratio: 0.5 },
  { id: "diagnostic-proportional-q0.75", ratio: 0.75 },
  { id: "diagnostic-identity-q1", ratio: 1 },
] as const);

const MF_IDS = Object.freeze(SERIES.map((row) => row.selectionId));
const MK2_DOMAIN_IDS = Object.freeze([
  "P8B-P1-S89-F3-BASAL",
  "P8B-P1-S89-F3-PRISM",
  "P8B-P1-S89-F4-BASAL",
  "P8B-P1-S89-F4-PRISM",
] as const);
const MATCHED_PRISM_IDS = Object.freeze([
  "P8B-P1-S89-F3-PRISM",
  "P8B-P1-S89-F4-PRISM",
] as const);
const BASAL_IDS = Object.freeze([
  "P8B-P1-S89-F3-BASAL",
  "P8B-P1-S89-F4-BASAL",
] as const);

interface Interval {
  readonly lower: number;
  readonly value: number;
  readonly upper: number;
}

interface Observation {
  readonly selectionId: SeriesId;
  readonly pointId: string;
  readonly x: Interval;
  readonly y: Interval;
}

interface Score {
  readonly mappingId: MappingId;
  readonly model: Model;
  readonly selectionId: SeriesId;
  readonly status: "scored-diagnostic" | "ineligible";
  readonly sampleCount?: number;
  readonly centralMse?: number;
  readonly intervalGapMse?: number;
  readonly predictions?: readonly Interval[];
  readonly reasonCode?: "MK2_NO_MINUS_30_ROW";
}

interface ArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase9MfMk2VerificationInputs {
  readonly artifacts: ReadonlyMap<string, Uint8Array>;
  readonly protocolBytes: Uint8Array;
  readonly scoreLaunchBytes: Uint8Array;
  /** Keyed by selectionId. */
  readonly sourceRows: ReadonlyMap<string, Uint8Array>;
  /** Registered verification additionally rehashes every protocol entry artifact. */
  readonly repositoryInputs?: ReadonlyMap<string, Uint8Array>;
}

export interface Phase9MfMk2VerificationResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
  readonly checkedFiles: readonly string[];
  readonly scope: string | null;
  readonly diagnosticLabel: string | null;
}

export interface Phase9MfMk2NegativeControlResult {
  readonly id: Phase9MfMk2PublicationMutationId;
  readonly mutationExecuted: true;
  readonly rejected: true;
  readonly error: string;
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
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be nonempty`);
  return value;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || Object.is(value, -0)) {
    throw new Error(`${label} must be finite and must not be negative zero`);
  }
  return value;
}

function interval(value: unknown, label: string): Interval {
  const row = object(value, label);
  const lower = finite(row.digitizationLower, `${label}.digitizationLower`);
  const central = finite(row.value, `${label}.value`);
  const upper = finite(row.digitizationUpper, `${label}.digitizationUpper`);
  if (!(lower <= central && central <= upper)) throw new Error(`${label} interval differs`);
  return { lower, value: central, upper };
}

function parseJsonl(bytes: Uint8Array, label: string): readonly unknown[] {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} is not UTF-8`);
  }
  if (!text.endsWith("\n") || text.includes("\r")) throw new Error(`${label} is not canonical LF JSONL`);
  const lines = text.slice(0, -1).split("\n");
  if (lines.length === 1 && lines[0] === "") return [];
  return lines.map((line, index) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line) as unknown;
    } catch {
      throw new Error(`${label} line ${index + 1} is not JSON`);
    }
    if (canonicalJson(parsed) !== line) throw new Error(`${label} line ${index + 1} is not canonical JSON`);
    return parsed;
  });
}

function parseSourceRows(series: (typeof SERIES)[number], bytes: Uint8Array): readonly Observation[] {
  const rows = parseJsonl(bytes, `${series.selectionId} source rows`);
  if (rows.length !== series.rowCount) throw new Error(`${series.selectionId} source row count differs`);
  const pointIds = new Set<string>();
  return rows.map((value, index) => {
    const row = object(value, `${series.selectionId} row ${index + 1}`);
    if (
      row.schema !== "phase8b-plot-point-v1" || row.selectionId !== series.selectionId ||
      row.phase9EvidenceRole !== "model-development"
    ) throw new Error(`${series.selectionId} source identity differs`);
    const pointId = string(row.pointId, `${series.selectionId}.pointId`);
    if (pointIds.has(pointId)) throw new Error(`${series.selectionId} source duplicates ${pointId}`);
    pointIds.add(pointId);
    const xObject = object(row.x, `${series.selectionId}.${pointId}.x`);
    const yObject = object(row.y, `${series.selectionId}.${pointId}.y`);
    if (xObject.variable !== "supersaturation" || xObject.unit !== "percent") {
      throw new Error(`${series.selectionId}.${pointId} x semantics differ`);
    }
    if (yObject.variable !== "normal_growth_rate" || yObject.unit !== "um s^-1") {
      throw new Error(`${series.selectionId}.${pointId} y semantics differ`);
    }
    return { selectionId: series.selectionId, pointId, x: interval(xObject, "x"), y: interval(yObject, "y") };
  });
}

const X_ANCHORS = [1, 2, 3, 5, 10, 15, 20, 30, 50] as const;
const BASAL_BARRIERS = [0.003, 0.0035, 0.0045, 0.007, 0.014, 0.024, 0.038, 0.07, 0.16] as const;
const PRISM_BARRIERS = [0.00006, 0.00028, 0.0007, 0.0027, 0.014, 0.032, 0.06, 0.13, 0.32] as const;
const PRISM_PREFACTORS = [0.45, 0.28, 0.21, 0.18, 0.83, 1, 1, 1, 1] as const;

function interpolationIndex(x: number): number {
  let index = 0;
  while (index < X_ANCHORS.length - 2 && (X_ANCHORS[index + 1] as number) < x) index++;
  return index;
}

function logInterpolate(x: number, values: readonly number[]): number {
  const index = interpolationIndex(x);
  const x0 = X_ANCHORS[index] as number;
  const x1 = X_ANCHORS[index + 1] as number;
  const y0 = values[index] as number;
  const y1 = values[index + 1] as number;
  const weight = (Math.log(x) - Math.log(x0)) / (Math.log(x1) - Math.log(x0));
  return Math.exp(Math.log(y0) + weight * (Math.log(y1) - Math.log(y0)));
}

function linearInterpolate(x: number, values: readonly number[]): number {
  const index = interpolationIndex(x);
  const x0 = X_ANCHORS[index] as number;
  const x1 = X_ANCHORS[index + 1] as number;
  const y0 = values[index] as number;
  const y1 = values[index + 1] as number;
  const weight = (x - x0) / (x1 - x0);
  return y0 + weight * (y1 - y0);
}

function kineticVelocity(tempC: number): number {
  const kelvin = tempC + 273.15;
  const saturationPressurePa = 3.7e10 * Math.exp(-6150 / kelvin) * 100;
  const saturationNumberDensity = saturationPressurePa / (1.380649e-23 * kelvin);
  return (saturationNumberDensity / 3.1e28) *
    Math.sqrt((1.380649e-23 * kelvin) / (2 * Math.PI * 3e-26));
}

function mfRate(series: (typeof SERIES)[number], drive: number): number {
  if (drive <= 0) return 0;
  const magnitude = Math.abs(series.temperatureC);
  const barrier = logInterpolate(
    magnitude,
    series.facet === "basal" ? BASAL_BARRIERS : PRISM_BARRIERS,
  );
  const prefactor = series.facet === "basal" ? 1 : linearInterpolate(magnitude, PRISM_PREFACTORS);
  const coefficient = prefactor * Math.exp(-barrier / drive);
  return coefficient * kineticVelocity(series.temperatureC) * drive * 1e6;
}

function mk2Rate(series: (typeof SERIES)[number], drive: number): number | null {
  if (series.temperatureC === -30) return null;
  if (series.facet === "basal") return mfRate(series, drive);
  if (drive <= 0) return 0;
  const coefficient = series.temperatureC === -7
    ? 0.5 * Math.exp(-0.008 / drive) + 0.5 * Math.exp(-0.01 / drive)
    : Math.exp(-0.03 / drive);
  return coefficient * kineticVelocity(series.temperatureC) * drive * 1e6;
}

function mapped(input: Interval, ratio: number): Interval {
  return {
    lower: (input.lower / 100) * ratio,
    value: (input.value / 100) * ratio,
    upper: (input.upper / 100) * ratio,
  };
}

function prediction(model: Model, series: (typeof SERIES)[number], drive: Interval): Interval | null {
  const evaluate = (value: number): number | null => {
    if (model === "zero-growth-control") return 0;
    return model === "mf-inherited-cak-control" ? mfRate(series, value) : mk2Rate(series, value);
  };
  const lower = evaluate(drive.lower);
  const central = evaluate(drive.value);
  const upper = evaluate(drive.upper);
  if (lower === null || central === null || upper === null) return null;
  return { lower: Math.min(lower, central, upper), value: central, upper: Math.max(lower, central, upper) };
}

function intervalGap(left: Interval, right: Interval): number {
  if (left.upper < right.lower) return right.lower - left.upper;
  if (right.upper < left.lower) return left.lower - right.upper;
  return 0;
}

function scoreSeries(
  model: Model,
  mappingId: MappingId,
  ratio: number,
  series: (typeof SERIES)[number],
  rows: readonly Observation[],
): Score {
  if (model === "mk2-prism-annex" && series.temperatureC === -30) {
    return { mappingId, model, selectionId: series.selectionId, status: "ineligible", reasonCode: "MK2_NO_MINUS_30_ROW" };
  }
  let central = 0;
  let gaps = 0;
  const predictions: Interval[] = [];
  for (const row of rows) {
    const predicted = prediction(model, series, mapped(row.x, ratio));
    if (predicted === null) throw new Error(`unexpected ineligible prediction for ${series.selectionId}`);
    const residual = predicted.value - row.y.value;
    const gap = intervalGap(predicted, row.y);
    central += residual * residual;
    gaps += gap * gap;
    predictions.push(predicted);
  }
  return {
    mappingId,
    model,
    selectionId: series.selectionId,
    status: "scored-diagnostic",
    sampleCount: rows.length,
    centralMse: central / rows.length,
    intervalGapMse: gaps / rows.length,
    predictions,
  };
}

function scoreJson(score: Score): StrictJson {
  if (score.status === "ineligible") return strictJsonSnapshot({
    schema: "phase9-mf-mk2-series-score-v1",
    mappingId: score.mappingId,
    model: score.model,
    selectionId: score.selectionId,
    status: "ineligible",
    reasonCode: score.reasonCode,
  });
  return strictJsonSnapshot({
    schema: "phase9-mf-mk2-series-score-v1",
    mappingId: score.mappingId,
    model: score.model,
    selectionId: score.selectionId,
    status: "scored-diagnostic",
    sampleCount: score.sampleCount,
    centralMse: score.centralMse,
    intervalGapMse: score.intervalGapMse,
    sourceDispersion: "not-reported",
    modelUncertainty: "incomplete",
  });
}

function family(
  familyName: string,
  model: Model,
  mappingId: MappingId,
  ids: readonly SeriesId[],
  scores: readonly Score[],
): StrictJson {
  const ordered = ids.map((id) => {
    const score = scores.find((candidate) => candidate.selectionId === id);
    if (score?.status !== "scored-diagnostic") throw new Error(`${familyName} lacks ${id}`);
    return score;
  });
  return strictJsonSnapshot({
    family: familyName,
    model,
    mappingId,
    seriesIds: ids,
    equalSeriesCentralMse: ordered.reduce((sum, score) => sum + (score.centralMse as number), 0) / ordered.length,
    equalSeriesIntervalGapMse: ordered.reduce((sum, score) => sum + (score.intervalGapMse as number), 0) / ordered.length,
    weighting: "equal-series",
    pooledPointScoreForbidden: true,
  });
}

function numericField(value: StrictJson, key: string): number {
  return finite(object(value, "family")[key], `family.${key}`);
}

function deriveExpected(rowsById: ReadonlyMap<SeriesId, readonly Observation[]>): {
  readonly scoreRows: readonly StrictJson[];
  readonly mappingRows: readonly StrictJson[];
  readonly report: StrictJson;
  readonly label: string;
} {
  const scoreRows: StrictJson[] = [];
  const mappingRows: StrictJson[] = [];
  const matchedDecisions: Array<{
    mappingId: MappingId;
    strictSeriesWins: number;
    familyCentralMseLower: boolean;
    familyIntervalGapNoWorse: boolean;
    meetsPrecommittedDiagnosticEffect: boolean;
  }> = [];
  for (const mapping of MAPPINGS) {
    const all = (model: Model): Score[] => SERIES.map((series) => scoreSeries(
      model,
      mapping.id,
      mapping.ratio,
      series,
      rowsById.get(series.selectionId) as readonly Observation[],
    ));
    const mf = all("mf-inherited-cak-control");
    const mk2 = all("mk2-prism-annex");
    const zero = all("zero-growth-control");
    scoreRows.push(...mf.map(scoreJson), ...mk2.map(scoreJson), ...zero.map(scoreJson));
    const mfFamily = family("mf-six-series", "mf-inherited-cak-control", mapping.id, MF_IDS, mf);
    const mk2Family = family("mk2-four-series-domain", "mk2-prism-annex", mapping.id, MK2_DOMAIN_IDS, mk2);
    const zeroFamily = family("zero-control-six-series", "zero-growth-control", mapping.id, MF_IDS, zero);
    const mfMatched = family("matched-prism-two-series", "mf-inherited-cak-control", mapping.id, MATCHED_PRISM_IDS, mf);
    const mk2Matched = family("matched-prism-two-series", "mk2-prism-annex", mapping.id, MATCHED_PRISM_IDS, mk2);
    let strictSeriesWins = 0;
    for (const id of MATCHED_PRISM_IDS) {
      const left = mf.find((score) => score.selectionId === id) as Score;
      const right = mk2.find((score) => score.selectionId === id) as Score;
      if ((right.centralMse as number) < (left.centralMse as number)) strictSeriesWins++;
    }
    const familyCentralMseLower = numericField(mk2Matched, "equalSeriesCentralMse") < numericField(mfMatched, "equalSeriesCentralMse");
    const familyIntervalGapNoWorse = numericField(mk2Matched, "equalSeriesIntervalGapMse") <= numericField(mfMatched, "equalSeriesIntervalGapMse");
    const meets = strictSeriesWins === 2 && familyCentralMseLower && familyIntervalGapNoWorse;
    matchedDecisions.push({
      mappingId: mapping.id,
      strictSeriesWins,
      familyCentralMseLower,
      familyIntervalGapNoWorse,
      meetsPrecommittedDiagnosticEffect: meets,
    });
    let basalPoints = 0;
    for (const id of BASAL_IDS) {
      const left = mf.find((score) => score.selectionId === id) as Score;
      const right = mk2.find((score) => score.selectionId === id) as Score;
      if (canonicalJson(left.predictions) !== canonicalJson(right.predictions)) throw new Error(`basal identity failed for ${id}`);
      basalPoints += (left.predictions as readonly Interval[]).length;
    }
    mappingRows.push(strictJsonSnapshot({
      schema: "phase9-mf-mk2-mapping-decision-v1",
      mappingId: mapping.id,
      mappingStatus: "diagnostic-only",
      mfSixSeries: mfFamily,
      mk2FourSeriesDomain: mk2Family,
      zeroControlSixSeries: zeroFamily,
      matchedPrismBaseline: mfMatched,
      matchedPrismIntervention: mk2Matched,
      matchedPrismDecision: {
        mappingId: mapping.id,
        matchedSeriesIds: MATCHED_PRISM_IDS,
        strictSeriesWins,
        familyCentralMseLower,
        familyIntervalGapNoWorse,
        meetsPrecommittedDiagnosticEffect: meets,
        physicalPass: false,
        promotionAvailable: false,
      },
      basalIdentity: { seriesIds: BASAL_IDS, evaluatedPointCount: basalPoints, bitIdentical: true },
      minusThirtyRefusals: [
        { selectionId: "P8B-P1-S89-F5-BASAL", reasonCode: "MK2_NO_MINUS_30_ROW" },
        { selectionId: "P8B-P1-S89-F5-PRISM", reasonCode: "MK2_NO_MINUS_30_ROW" },
      ],
      physicalScore: {
        status: "unavailable",
        sourceMappingStatus: "source-blocked",
        grantsValidationClaim: false,
        promotionAvailable: false,
      },
    }));
  }
  const mappingsMeeting = matchedDecisions.filter((row) => row.meetsPrecommittedDiagnosticEffect).length;
  const label = mappingsMeeting === 0
    ? "diagnostic-all-no-pass"
    : mappingsMeeting === MAPPINGS.length
      ? "diagnostic-robust-over-grid"
      : "diagnostic-mapping-dependent";
  const parameterSpaceDecision = {
    mappingIds: MAPPINGS.map((row) => row.id),
    mappingsMeetingDiagnosticEffect: mappingsMeeting,
    label,
    physicalPass: false,
    promotionAvailable: false,
    stopMorphologyInterpretation: true,
  };
  const report = strictJsonSnapshot({
    schema: "phase9-mf-mk2-publication-report-v1",
    scope: null,
    status: "candidate-awaiting-independent-verification",
    phase9EvidenceRole: "model-development",
    counts: {
      sourceSeries: 6,
      sourcePoints: 96,
      diagnosticMappings: 5,
      seriesScoreRecords: 90,
      scoredDiagnosticRecords: 80,
      explicitMinusThirtyRefusals: 10,
    },
    parameterSpaceDecision,
    physicalScore: {
      status: "unavailable",
      reasonCodes: [
        "APPARATUS_TO_SURFACE_MAPPING_SOURCE_BLOCKED",
        "MODEL_UNCERTAINTY_INCOMPLETE",
        "INHERITED_CAK_MONOGRAPH_GAP_RETAINED",
      ],
      grantsValidationClaim: false,
      promotionAvailable: false,
    },
    uncertaintyLimitations: {
      observation: "plot-coordinate digitization intervals only; per-series denominator and specimen dispersion are not reported",
      prediction: "coordinate digitization is propagated; inherited CAK and printed M-K2 input uncertainty is not a complete prediction interval",
      overlap: "zero interval-gap loss means interval overlap, not statistical agreement",
    },
    claimBoundary: {
      morphologyInterpretationStopped: true,
      heldoutEvidence: false,
      quantitativeValidation: false,
      pooledPointScoreForbidden: true,
    },
  });
  return { scoreRows, mappingRows, report, label };
}

function jsonl(rows: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function identity(path: string, bytes: Uint8Array): ArtifactIdentity {
  return { path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function expectedIndex(artifacts: ReadonlyMap<string, Uint8Array>): Uint8Array {
  const entries = PAYLOAD_FILES
    .map((path) => {
      const bytes = artifacts.get(path);
      if (bytes === undefined) throw new Error(`candidate lacks ${path}`);
      return identity(path, bytes);
    })
    .sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  return canonicalJsonBytes({
    schema: "phase9-mf-mk2-artifact-index-v1",
    scope: "development-only-diagnostic-planar-facet",
    artifactCount: entries.length,
    artifacts: entries,
  });
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && sha256Bytes(left) === sha256Bytes(right);
}

function parseProtocol(bytes: Uint8Array): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new Error("protocol is not UTF-8 JSON");
  }
  const protocol = object(parsed, "protocol");
  if (protocol.schema !== "phase9-mf-mk2-protocol-v1") throw new Error("protocol schema differs");
  return protocol;
}

function rowsBySelectionId(
  bytes: Uint8Array,
  label: string,
): ReadonlyMap<SeriesId, Record<string, unknown>> {
  const rows = parseJsonl(bytes, label).map((value, index) => object(value, `${label} row ${index + 1}`));
  const result = new Map<SeriesId, Record<string, unknown>>();
  for (const expected of SERIES) {
    const matches = rows.filter((row) => row.selectionId === expected.selectionId);
    if (matches.length !== 1) throw new Error(`${label} does not contain exactly one ${expected.selectionId}`);
    result.set(expected.selectionId, matches[0] as Record<string, unknown>);
  }
  return result;
}

function expectedRegistryRow(series: (typeof SERIES)[number]): StrictJson {
  return strictJsonSnapshot({
    adapterKind: "planar-facet",
    bindingKind: "digitized-plot-series",
    knowledgeHypothesisIds: series.facet === "prism"
      ? ["P9H-BROAD-FACET", "P9H-QLL-MOLECULAR", "P9H-TWO-BRANCH"]
      : ["P9H-BROAD-FACET", "P9H-QLL-MOLECULAR"],
    requestedUses: [
      {
        purpose: "planar-facet-rate-source-replay",
        reasonCode: "SURFACE_FORCING_MAPPING_UNRESOLVED",
        status: "eligible-with-limitation",
      },
      {
        purpose: "absolute-surface-kinetics-score",
        reasonCode: "SURFACE_SUPERSATURATION_MAPPING_REQUIRED",
        status: "source-blocked",
      },
    ],
    restrictions: ADAPTER_RESTRICTIONS,
    schema: "phase9-adapter-registry-v1",
    selectionId: series.selectionId,
    sourceConditionFields: [
      "conditions.airPressurePa",
      "conditions.crystalSelection",
      "conditions.facet",
      "conditions.growthGeometry",
      "conditions.temperatureC",
    ],
    uncertaintyFields: [
      "sourceUncertainty.perSeriesDenominator",
      "sourceUncertainty.pointDispersion",
      "sourceUncertainty.supersaturationAccuracyPercentAbsolute",
      "sourceUncertainty.temperatureAccuracyC",
    ],
  });
}

function expectedSuccessorRow(series: (typeof SERIES)[number]): StrictJson {
  return strictJsonSnapshot({
    binding: {
      kind: "digitized-plot-series",
      metadataRecordArtifact: PLOT_METADATA_IDENTITY,
      metadataRecordId: series.selectionId,
      rowArtifact: {
        byteLength: series.byteLength,
        logicalRoot: series.logicalRoot,
        path: series.path,
        rowCount: series.rowCount,
        sha256: series.sha256,
      },
    },
    phase9EvidenceRole: "model-development",
    priorityClass: "P1",
    schema: "phase8b-successor-target-record-v1",
    selectionId: series.selectionId,
    split: "development",
  });
}

function verifyPlotMetadataRow(
  series: (typeof SERIES)[number],
  row: Record<string, unknown>,
): void {
  if (
    row.schema !== "phase8b-plot-series-record-v1" ||
    row.selectionId !== series.selectionId ||
    row.operator !== "phase8b-adjudicated-plot-digitization-v3" ||
    row.phase9EvidenceRole !== "model-development" ||
    row.sourceStatus !== "direct-observation" ||
    row.lineageId !== "sei-gonda-1989-low-pressure-campaign" ||
    row.expectedPointCount !== series.rowCount
  ) throw new Error(`${series.selectionId} plot metadata identity differs`);
  const expectedFacet = series.facet === "basal" ? "{0001} basal" : "{10-10} prism";
  const expectedConditions = {
    airPressurePa: 40,
    crystalSelection: "only one crystal in microscope field; crystal below 300 um; c-to-a ratio 0.6 to 3.0",
    facet: expectedFacet,
    growthGeometry: "polyhedral crystal on substrate in stagnant low-pressure air",
    temperatureC: series.temperatureC,
  };
  if (canonicalJson(row.conditions) !== canonicalJson(expectedConditions)) {
    throw new Error(`${series.selectionId} plot metadata conditions differ`);
  }
  const expectedRowArtifact = {
    bytes: series.byteLength,
    path: series.path,
    rowCount: series.rowCount,
    sha256: series.sha256,
  };
  if (canonicalJson(row.rowArtifact) !== canonicalJson(expectedRowArtifact)) {
    throw new Error(`${series.selectionId} plot metadata row artifact differs`);
  }
  const expectedUncertainty = {
    perSeriesDenominator: "not reported",
    pointDispersion: "not reported",
    supersaturationAccuracyPercentAbsolute: 0.1,
    temperatureAccuracyC: 0.01,
  };
  if (canonicalJson(row.sourceUncertainty) !== canonicalJson(expectedUncertainty)) {
    throw new Error(`${series.selectionId} plot metadata uncertainty differs`);
  }
}

function verifyS1SourceContracts(
  repositoryInputs: ReadonlyMap<string, Uint8Array>,
): ReadonlyMap<SeriesId, { readonly adapterStatus: "eligible-with-limitation"; readonly adapterReasons: readonly string[] }> {
  const registryBytes = repositoryInputs.get(ADAPTER_REGISTRY_PATH);
  const successorBytes = repositoryInputs.get(SUCCESSOR_BOOK_PATH);
  const metadataBytes = repositoryInputs.get(PLOT_METADATA_PATH);
  if (registryBytes === undefined || successorBytes === undefined || metadataBytes === undefined) {
    throw new Error("verification lacks the bound S1 registry, successor book, or plot metadata");
  }
  const registry = rowsBySelectionId(registryBytes, "S1 adapter registry");
  const successor = rowsBySelectionId(successorBytes, "successor target book");
  const metadata = rowsBySelectionId(metadataBytes, "plot metadata");
  const result = new Map<SeriesId, {
    readonly adapterStatus: "eligible-with-limitation";
    readonly adapterReasons: readonly string[];
  }>();
  for (const series of SERIES) {
    if (canonicalJson(registry.get(series.selectionId)) !== canonicalJson(expectedRegistryRow(series))) {
      throw new Error(`${series.selectionId} S1 planar-facet eligibility contract differs`);
    }
    if (canonicalJson(successor.get(series.selectionId)) !== canonicalJson(expectedSuccessorRow(series))) {
      throw new Error(`${series.selectionId} successor binding differs`);
    }
    verifyPlotMetadataRow(series, metadata.get(series.selectionId) as Record<string, unknown>);
    result.set(series.selectionId, {
      adapterStatus: "eligible-with-limitation",
      adapterReasons: ADAPTER_REASONS,
    });
  }
  return result;
}

function verifyLaunch(
  launch: Record<string, unknown>,
  protocol: Record<string, unknown>,
  inputs: Phase9MfMk2VerificationInputs,
): { readonly scope: string; readonly rowsById: ReadonlyMap<SeriesId, readonly Observation[]> } {
  if (launch.schema !== "phase9-mf-mk2-publication-launch-v1") throw new Error("launch schema differs");
  const scope = string(launch.scope, "launch.scope");
  if (scope !== "registered-source-score" && scope !== "synthetic-fixture") throw new Error("launch scope differs");
  if (launch.protocolId !== protocol.protocolId) throw new Error("launch protocolId differs");
  const protocolIdentity = object(launch.protocolIdentity, "launch.protocolIdentity");
  if (
    protocolIdentity.path !== PROTOCOL_PATH ||
    protocolIdentity.byteLength !== inputs.protocolBytes.byteLength ||
    protocolIdentity.sha256 !== sha256Bytes(inputs.protocolBytes)
  ) throw new Error("launch protocol identity differs");
  const scoreLaunchIdentity = object(launch.scoreLaunchIdentity, "launch.scoreLaunchIdentity");
  if (
    scoreLaunchIdentity.path !== SCORE_LAUNCH_PATH ||
    scoreLaunchIdentity.byteLength !== inputs.scoreLaunchBytes.byteLength ||
    scoreLaunchIdentity.sha256 !== sha256Bytes(inputs.scoreLaunchBytes)
  ) throw new Error("launch score-authorization identity differs");
  const scoreLaunch = object(
    parseCanonicalJson(inputs.scoreLaunchBytes, "M-F/M-K2 score launch"),
    "M-F/M-K2 score launch",
  );
  if (
    scoreLaunch.schema !== "phase9-mf-mk2-launch-v1" ||
    scoreLaunch.scope !== scope ||
    scoreLaunch.protocolId !== protocol.protocolId ||
    scoreLaunch.scoreMayRun !== true
  ) throw new Error("M-F/M-K2 score launch does not authorize this protocol");
  const foundation = object(scoreLaunch.sourceFoundation, "score launch sourceFoundation");
  const assurance = object(scoreLaunch.assurance, "score launch assurance");
  if (
    foundation.s0b !== "frozen-independent-verifier-pass" ||
    foundation.s1 !== "complete-fail-closed-adapters" ||
    assurance.syntheticPublicationChecks !== "passed" ||
    assurance.independentReview !== "accepted"
  ) throw new Error("M-F/M-K2 score launch readiness state differs");
  const scoreBindings = array(scoreLaunch.bindings, "score launch bindings").map((value) =>
    object(value, "score launch binding")
  );
  const scoreBindingByPath = new Map(scoreBindings.map((entry) => [string(entry.path, "score launch binding path"), entry]));
  if (
    scoreBindingByPath.size !== scoreBindings.length ||
    canonicalJson([...scoreBindingByPath.keys()].sort()) !== canonicalJson([...LAUNCH_REQUIRED_PATHS].sort())
  ) throw new Error("M-F/M-K2 score launch binding roster differs");
  if (inputs.repositoryInputs === undefined) throw new Error("verification lacks score-launch repository inputs");
  for (const path of LAUNCH_REQUIRED_PATHS) {
    const bytes = inputs.repositoryInputs.get(path);
    const expected = scoreBindingByPath.get(path);
    if (
      bytes === undefined || expected === undefined ||
      expected.byteLength !== bytes.byteLength || expected.sha256 !== sha256Bytes(bytes)
    ) throw new Error(`M-F/M-K2 score launch binding differs: ${path}`);
  }
  if (canonicalJson(launch.controlIds) !== canonicalJson(CONTROL_IDS)) throw new Error("launch control roster differs");
  if (launch.aggregation !== "equal-series") throw new Error("launch aggregation is not equal-series");
  if (launch.processConcurrency !== 1) throw new Error("launch process concurrency differs");
  const command = array(launch.command, "launch.command");
  if (command.length === 0 || command.some((part) => typeof part !== "string" || part.length === 0)) {
    throw new Error("launch command differs");
  }
  if (canonicalJson(launch.mappingFamily) !== canonicalJson(MAPPINGS.map((row) => ({
    id: row.id,
    surfaceToPlottedRatio: row.ratio,
  })))) throw new Error("launch mapping family differs");
  const modelContract = object(launch.modelContract, "launch.modelContract");
  const annex = object(modelContract.mk2PrismAnnex, "launch.modelContract.mk2PrismAnnex");
  if (canonicalJson(annex.minusSeven) !== canonicalJson([
    { prefactor: 0.5, barrierFraction: 0.008 },
    { prefactor: 0.5, barrierFraction: 0.01 },
  ]) || canonicalJson(annex.minusFifteen) !== canonicalJson([
    { prefactor: 1, barrierFraction: 0.03 },
  ]) || annex.minusThirty !== "refused" || annex.basalAtMinusSevenAndMinusFifteen !== "unchanged inherited CAK control") {
    throw new Error("launch M-K2 annex contract differs");
  }
  if (modelContract.zeroGrowthControl !== "exact six-series type-appropriate control") {
    throw new Error("launch zero control differs");
  }

  const s1Contracts = verifyS1SourceContracts(inputs.repositoryInputs);

  const protocolRoster = array(protocol.seriesRoster, "protocol.seriesRoster");
  const launchSources = array(launch.sourceArtifacts, "launch.sourceArtifacts");
  if (protocolRoster.length !== SERIES.length || launchSources.length !== SERIES.length) throw new Error("six-series roster differs");
  const rowsById = new Map<SeriesId, readonly Observation[]>();
  for (let index = 0; index < SERIES.length; index++) {
    const expected = SERIES[index] as (typeof SERIES)[number];
    const frozen = object(protocolRoster[index], `protocol.seriesRoster[${index}]`);
    const frozenArtifact = object(frozen.rowArtifact, `protocol.seriesRoster[${index}].rowArtifact`);
    if (
      frozen.selectionId !== expected.selectionId || frozen.temperatureC !== expected.temperatureC ||
      frozen.facet !== expected.facet || frozen.rowCount !== expected.rowCount ||
      frozenArtifact.logicalRoot !== expected.logicalRoot || frozenArtifact.path !== expected.path ||
      frozenArtifact.byteLength !== expected.byteLength || frozenArtifact.sha256 !== expected.sha256
    ) throw new Error(`protocol roster differs for ${expected.selectionId}`);
    const published = object(launchSources[index], `launch.sourceArtifacts[${index}]`);
    if (
      published.selectionId !== expected.selectionId || published.temperatureC !== expected.temperatureC ||
      published.facet !== expected.facet || published.rowCount !== expected.rowCount ||
      published.logicalRoot !== expected.logicalRoot || published.path !== expected.path
    ) throw new Error(`launch source roster differs for ${expected.selectionId}`);
    const s1Contract = s1Contracts.get(expected.selectionId) as {
      readonly adapterStatus: "eligible-with-limitation";
      readonly adapterReasons: readonly string[];
    };
    if (
      published.adapterStatus !== s1Contract.adapterStatus ||
      canonicalJson(array(published.adapterReasons, `${expected.selectionId} published adapter reasons`)) !==
        canonicalJson(s1Contract.adapterReasons)
    ) throw new Error(`published S1 adapter disposition differs for ${expected.selectionId}`);
    const bytes = inputs.sourceRows.get(expected.selectionId);
    if (bytes === undefined) throw new Error(`source rows absent for ${expected.selectionId}`);
    if (published.byteLength !== bytes.byteLength || published.sha256 !== sha256Bytes(bytes)) {
      throw new Error(`source identity differs for ${expected.selectionId}`);
    }
    if (scope === "registered-source-score" && (bytes.byteLength !== expected.byteLength || sha256Bytes(bytes) !== expected.sha256)) {
      throw new Error(`registered source bytes differ for ${expected.selectionId}`);
    }
    rowsById.set(expected.selectionId, parseSourceRows(expected, bytes));
  }

  const protocolEntries = array(protocol.entryArtifacts, "protocol.entryArtifacts").map((value) => object(value, "entry artifact"));
  if (canonicalJson(launch.evaluatorIdentities) !== canonicalJson(protocolEntries)) {
    throw new Error("launch evaluator identities differ from the frozen protocol");
  }
  if (scope === "registered-source-score") {
    for (const entry of protocolEntries) {
      const path = string(entry.path, "entry.path");
      const bytes = inputs.repositoryInputs.get(path);
      if (bytes === undefined || bytes.byteLength !== entry.byteLength || sha256Bytes(bytes) !== entry.sha256) {
        throw new Error(`repository entry artifact differs: ${path}`);
      }
    }
  }
  return { scope, rowsById };
}

export function verifyPhase9MfMk2Publication(
  inputs: Phase9MfMk2VerificationInputs,
): Phase9MfMk2VerificationResult {
  const errors: string[] = [];
  let scope: string | null = null;
  let diagnosticLabel: string | null = null;
  try {
    const names = [...inputs.artifacts.keys()].sort();
    if (canonicalJson(names) !== canonicalJson([...FILES].sort())) throw new Error("candidate file roster differs");
    const indexBytes = inputs.artifacts.get("artifact-index.json") as Uint8Array;
    parseCanonicalJson(indexBytes, "artifact index");
    if (!bytesEqual(indexBytes, expectedIndex(inputs.artifacts))) throw new Error("artifact index differs from payload bytes");
    const launchBytes = inputs.artifacts.get("launch-manifest.json") as Uint8Array;
    const launch = object(parseCanonicalJson(launchBytes, "launch manifest"), "launch manifest");
    const protocol = parseProtocol(inputs.protocolBytes);
    const verified = verifyLaunch(launch, protocol, inputs);
    scope = verified.scope;
    const expected = deriveExpected(verified.rowsById);
    diagnosticLabel = expected.label;
    const scoreBytes = inputs.artifacts.get("series-scores.jsonl") as Uint8Array;
    parseJsonl(scoreBytes, "series scores");
    if (!bytesEqual(scoreBytes, jsonl(expected.scoreRows))) throw new Error("series scores differ from source-derived arithmetic");
    const mappingBytes = inputs.artifacts.get("mapping-decisions.jsonl") as Uint8Array;
    parseJsonl(mappingBytes, "mapping decisions");
    if (!bytesEqual(mappingBytes, jsonl(expected.mappingRows))) throw new Error("mapping decisions differ from equal-series rederivation");
    const reportBytes = inputs.artifacts.get("report.json") as Uint8Array;
    const actualReport = object(parseCanonicalJson(reportBytes, "report"), "report");
    const expectedReport = object(expected.report, "expected report");
    expectedReport.scope = scope;
    if (canonicalJson(actualReport) !== canonicalJson(expectedReport)) throw new Error("report differs from artifact-derived verdict");
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    checkedFiles: Object.freeze([...inputs.artifacts.keys()].sort()),
    scope,
    diagnosticLabel,
  });
}

function cloneArtifacts(artifacts: ReadonlyMap<string, Uint8Array>): Map<string, Uint8Array> {
  return new Map([...artifacts.entries()].map(([path, bytes]) => [path, new Uint8Array(bytes)]));
}

function replaceJson(artifacts: Map<string, Uint8Array>, path: string, mutate: (row: Record<string, unknown>) => void): void {
  const row = object(parseCanonicalJson(artifacts.get(path) as Uint8Array, path), path);
  mutate(row);
  artifacts.set(path, canonicalJsonBytes(row));
}

function replaceJsonl(
  artifacts: Map<string, Uint8Array>,
  path: string,
  mutate: (rows: Record<string, unknown>[]) => void,
): void {
  const rows = parseJsonl(artifacts.get(path) as Uint8Array, path).map((value) => object(value, path));
  mutate(rows);
  artifacts.set(path, jsonl(rows));
}

function refreshIndex(artifacts: Map<string, Uint8Array>): void {
  artifacts.set("artifact-index.json", expectedIndex(artifacts));
}

export function mutatePhase9MfMk2Publication(
  original: ReadonlyMap<string, Uint8Array>,
  id: Phase9MfMk2PublicationMutationId,
): ReadonlyMap<string, Uint8Array> {
  const artifacts = cloneArtifacts(original);
  if (id === "drop-one-registered-series") {
    replaceJsonl(artifacts, "series-scores.jsonl", (rows) => {
      const index = rows.findIndex((row) =>
        row.mappingId === "diagnostic-proportional-q0.125" &&
        row.model === "mf-inherited-cak-control" &&
        row.selectionId === "P8B-P1-S89-F5-PRISM"
      );
      if (index < 0) throw new Error("drop mutation target absent");
      rows.splice(index, 1);
    });
  } else if (id === "duplicate-one-series") {
    replaceJsonl(artifacts, "series-scores.jsonl", (rows) => {
      const row = rows.find((candidate) =>
        candidate.mappingId === "diagnostic-proportional-q0.125" &&
        candidate.model === "mf-inherited-cak-control" &&
        candidate.selectionId === "P8B-P1-S89-F3-BASAL"
      );
      if (row === undefined) throw new Error("duplicate mutation target absent");
      rows.push(JSON.parse(canonicalJson(row)) as Record<string, unknown>);
    });
  } else if (id === "fabricate-minus-fifteen-second-branch") {
    replaceJson(artifacts, "launch-manifest.json", (launch) => {
      const contract = object(launch.modelContract, "modelContract");
      const annex = object(contract.mk2PrismAnnex, "mk2PrismAnnex");
      const branches = array(annex.minusFifteen, "minusFifteen") as Record<string, unknown>[];
      branches.push({ prefactor: 0.1, barrierFraction: 0.04 });
    });
  } else if (id === "attempt-minus-thirty-score") {
    replaceJsonl(artifacts, "series-scores.jsonl", (rows) => {
      const row = rows.find((candidate) =>
        candidate.mappingId === "diagnostic-proportional-q0.125" &&
        candidate.model === "mk2-prism-annex" &&
        candidate.selectionId === "P8B-P1-S89-F5-BASAL"
      );
      if (row === undefined) throw new Error("minus-thirty mutation target absent");
      delete row.reasonCode;
      Object.assign(row, {
        status: "scored-diagnostic",
        sampleCount: 17,
        centralMse: 0,
        intervalGapMse: 0,
        sourceDispersion: "not-reported",
        modelUncertainty: "incomplete",
      });
    });
  } else if (id === "change-mk2-basal-away-from-control") {
    replaceJsonl(artifacts, "mapping-decisions.jsonl", (rows) => {
      const basal = object(rows[0]?.basalIdentity, "basalIdentity");
      basal.bitIdentical = false;
    });
  } else if (id === "admit-source-blocked-physical-map") {
    replaceJson(artifacts, "report.json", (report) => {
      const physical = object(report.physicalScore, "physicalScore");
      physical.status = "available";
      physical.promotionAvailable = true;
    });
  } else if (id === "pool-points-instead-of-equal-series") {
    replaceJsonl(artifacts, "mapping-decisions.jsonl", (rows) => {
      const familyRow = object(rows[0]?.mfSixSeries, "mfSixSeries");
      familyRow.weighting = "pooled-points";
      familyRow.pooledPointScoreForbidden = false;
    });
  } else if (id === "forge-adapter-eligibility") {
    replaceJson(artifacts, "launch-manifest.json", (launch) => {
      const sources = array(launch.sourceArtifacts, "sourceArtifacts");
      const source = object(sources[0], "sourceArtifacts[0]");
      source.adapterStatus = "eligible";
    });
  } else if (id === "erase-limitation") {
    replaceJson(artifacts, "launch-manifest.json", (launch) => {
      const sources = array(launch.sourceArtifacts, "sourceArtifacts");
      const source = object(sources[0], "sourceArtifacts[0]");
      const reasons = array(source.adapterReasons, "sourceArtifacts[0].adapterReasons") as string[];
      const index = reasons.indexOf("SURFACE_FORCING_MAPPING_UNRESOLVED");
      if (index < 0) throw new Error("adapter limitation mutation target absent");
      reasons.splice(index, 1);
    });
  } else {
    throw new Error(`unregistered M-F/M-K2 publication mutation: ${String(id)}`);
  }
  refreshIndex(artifacts);
  return artifacts;
}

export function executePhase9MfMk2PublicationNegativeControls(
  inputs: Phase9MfMk2VerificationInputs,
): readonly Phase9MfMk2NegativeControlResult[] {
  const clean = verifyPhase9MfMk2Publication(inputs);
  if (!clean.ok) throw new Error(`negative controls require a clean candidate: ${clean.errors.join("; ")}`);
  return Object.freeze(CONTROL_IDS.map((id) => {
    const mutated = mutatePhase9MfMk2Publication(inputs.artifacts, id);
    const changedPayloads = PAYLOAD_FILES.filter((path) =>
      sha256Bytes(mutated.get(path) as Uint8Array) !== sha256Bytes(inputs.artifacts.get(path) as Uint8Array)
    );
    if (changedPayloads.length === 0) throw new Error(`${id} did not execute its named mutation`);
    const result = verifyPhase9MfMk2Publication({ ...inputs, artifacts: mutated });
    if (result.ok) throw new Error(`${id} mutation was accepted`);
    return Object.freeze({
      id,
      mutationExecuted: true,
      rejected: true,
      error: result.errors[0] as string,
    });
  }));
}

function readRegular(root: string, relativePath: string): Uint8Array {
  if (relativePath.startsWith("/") || relativePath.includes("\\") || relativePath.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new Error(`unsafe repository path: ${relativePath}`);
  }
  const base = resolve(root);
  const path = resolve(base, relativePath);
  if (path !== base && !path.startsWith(`${base}${sep}`)) throw new Error(`repository path escapes: ${relativePath}`);
  const status = lstatSync(path);
  if (!status.isFile() || status.isSymbolicLink()) throw new Error(`repository input is not a regular file: ${relativePath}`);
  return new Uint8Array(readFileSync(path));
}

export function loadPhase9MfMk2VerificationInputs(
  repositoryRoot: string,
  publicationDirectory: string,
  environment: Readonly<Record<string, string | undefined>> = process.env,
  nasCandidates?: readonly string[],
): Phase9MfMk2VerificationInputs {
  const artifacts = new Map<string, Uint8Array>();
  const names = readdirSync(publicationDirectory).sort();
  if (canonicalJson(names) !== canonicalJson([...FILES].sort())) throw new Error("publication directory file roster differs");
  for (const path of FILES) artifacts.set(path, new Uint8Array(readFileSync(join(publicationDirectory, path))));
  const protocolBytes = readRegular(repositoryRoot, PROTOCOL_PATH);
  const scoreLaunchBytes = readRegular(repositoryRoot, SCORE_LAUNCH_PATH);
  const protocol = parseProtocol(protocolBytes);
  const repositoryInputs = new Map<string, Uint8Array>();
  for (const value of array(protocol.entryArtifacts, "protocol.entryArtifacts")) {
    const entry = object(value, "protocol entry artifact");
    const path = string(entry.path, "protocol entry path");
    repositoryInputs.set(path, readRegular(repositoryRoot, path));
  }
  for (const path of LAUNCH_REQUIRED_PATHS) {
    if (!repositoryInputs.has(path)) repositoryInputs.set(path, readRegular(repositoryRoot, path));
  }
  const nasRoot = detectPhase9NasRoot(environment, nasCandidates);
  if (nasRoot === null) throw new Error("snowcrystal NAS share is not mounted");
  const sourceRows = new Map<string, Uint8Array>();
  for (const series of SERIES) {
    const resolved = resolvePhase9NasFile(`${series.logicalRoot}/${series.path}`, nasRoot);
    if (resolved.kind !== "ok") throw new Error(`${series.selectionId} source resolution failed: ${resolved.reason}`);
    sourceRows.set(series.selectionId, new Uint8Array(readFileSync(resolved.path)));
  }
  return { artifacts, protocolBytes, scoreLaunchBytes, sourceRows, repositoryInputs };
}

function runCli(arguments_: readonly string[]): void {
  let repositoryRoot = process.cwd();
  let input: string | undefined;
  for (let index = 0; index < arguments_.length; index += 2) {
    const flag = arguments_[index];
    const value = arguments_[index + 1];
    if (value === undefined) throw new Error("verify requires flag/value pairs");
    if (flag === "--repo-root") repositoryRoot = value;
    else if (flag === "--input") input = value;
    else throw new Error(`unknown verifier flag: ${flag}`);
  }
  if (input === undefined) throw new Error("usage: node runner/src/phase9-mf-mk2-publication-verify.ts --input <directory> [--repo-root <path>]");
  const inputs = loadPhase9MfMk2VerificationInputs(repositoryRoot, input);
  const result = verifyPhase9MfMk2Publication(inputs);
  if (!result.ok) throw new Error(result.errors.join("; "));
  const controls = executePhase9MfMk2PublicationNegativeControls(inputs);
  process.stdout.write(`${canonicalJson({ ...result, negativeControls: controls })}\n`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
