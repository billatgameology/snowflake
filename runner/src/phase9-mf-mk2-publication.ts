// Phase 9 S4 M-F/M-K2 diagnostic publication candidate.
//
// The registered command resolves the six exact Phase 8 row artifacts through the portable NAS
// resolver and re-runs the S1 planar-facet adapter before evaluating anything. The output is a
// development-only diagnostic over five pre-frozen construction points. It never promotes an
// apparatus supersaturation to a measured surface value and never emits a physical pass.

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
import { dirname, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  adaptPhase9MeasurementCorpus,
  phase9RowArtifactKey,
  type Phase9AdapterResult,
} from "./phase9-measurement-adapters.ts";
import {
  PHASE9_MF_MK2_DIAGNOSTIC_MAPPING_IDS,
  PHASE9_MF_MK2_FAMILY_ROSTERS,
  PHASE9_MF_MK2_SERIES,
  phase9MfMk2DecideMatchedPrism,
  phase9MfMk2DecideParameterSpace,
  phase9MfMk2EqualSeriesScore,
  phase9MfMk2ScoreSeries,
  type Phase9MfMk2EqualSeriesScore,
  type Phase9MfMk2Interval,
  type Phase9MfMk2MatchedPrismDecision,
  type Phase9MfMk2Model,
  type Phase9MfMk2Observation,
  type Phase9MfMk2SeriesId,
  type Phase9MfMk2SeriesRegistration,
  type Phase9MfMk2SeriesScore,
} from "./phase9-mf-mk2-model.ts";
import { detectPhase9NasRoot, resolvePhase9NasFile } from "./phase9-nas.ts";

const PROTOCOL_PATH = "research/phase9-mf-mk2-protocol-v1.json";
const MODEL_PATH = "runner/src/phase9-mf-mk2-model.ts";
const MODEL_TEST_PATH = "runner/test/phase9-mf-mk2-model.test.ts";
const ADAPTER_REGISTRY_PATH = "research/phase9-adapter-registry-v1.jsonl";
const SUCCESSOR_BOOK_PATH = "evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl";
const PLOT_METADATA_PATH = "evidence/phase8b-plot-digitization-v3/records.jsonl";
const SCORE_LAUNCH_PATH = "research/phase9-mf-mk2-launch-v1.json";

export const PHASE9_MF_MK2_LAUNCH_REQUIRED_PATHS = Object.freeze([
  PROTOCOL_PATH,
  MODEL_PATH,
  MODEL_TEST_PATH,
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

export const PHASE9_MF_MK2_PUBLICATION_FILES = Object.freeze([
  "artifact-index.json",
  "launch-manifest.json",
  "mapping-decisions.jsonl",
  "report.json",
  "series-scores.jsonl",
] as const);

export const PHASE9_MF_MK2_PUBLICATION_CONTROL_IDS = Object.freeze([
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

export type Phase9MfMk2PublicationScope = "registered-source-score" | "synthetic-fixture";

interface ArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface RowArtifactPin {
  readonly logicalRoot: string;
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface ProtocolSeries {
  readonly selectionId: Phase9MfMk2SeriesId;
  readonly temperatureC: number;
  readonly facet: string;
  readonly rowCount: number;
  readonly rowArtifact: RowArtifactPin;
}

interface PublicationProtocol {
  readonly schema: "phase9-mf-mk2-protocol-v1";
  readonly protocolId: string;
  readonly entryArtifacts: readonly ArtifactIdentity[];
  readonly seriesRoster: readonly ProtocolSeries[];
  readonly mappingFamily: readonly {
    readonly id: string;
    readonly status: string;
    readonly surfaceToPlottedRatio: number | null;
  }[];
  readonly score: {
    readonly physicalDecision: string;
  };
  readonly state: {
    readonly grantsValidationClaim: false;
    readonly morphologyPromotionAvailable: false;
  };
}

export interface Phase9MfMk2BoundSeries {
  readonly registration: Phase9MfMk2SeriesRegistration;
  readonly sourceArtifact: RowArtifactPin;
  readonly sourceBytes: Uint8Array;
  readonly adapterStatus: "eligible-with-limitation" | "synthetic-fixture";
  readonly adapterReasons: readonly string[];
}

export interface Phase9MfMk2RunMaterial {
  readonly scope: Phase9MfMk2PublicationScope;
  readonly protocolId: string;
  readonly protocolIdentity: ArtifactIdentity;
  readonly scoreLaunchIdentity: ArtifactIdentity;
  readonly evaluatorIdentities: readonly ArtifactIdentity[];
  readonly series: readonly Phase9MfMk2BoundSeries[];
  readonly runtime: {
    readonly node: string;
    readonly platform: string;
    readonly architecture: string;
  };
  readonly command: readonly string[];
}

interface ScoreLaunchManifest {
  readonly schema: "phase9-mf-mk2-launch-v1";
  readonly scope: Phase9MfMk2PublicationScope;
  readonly protocolId: string;
  readonly scoreMayRun: boolean;
  readonly sourceFoundation: {
    readonly s0b: string;
    readonly s1: string;
  };
  readonly assurance: {
    readonly syntheticPublicationChecks: string;
    readonly independentReview: string;
  };
  readonly bindings: readonly ArtifactIdentity[];
}

export interface Phase9MfMk2PublicationBundle {
  readonly scope: Phase9MfMk2PublicationScope;
  readonly artifacts: ReadonlyMap<string, Uint8Array>;
  readonly parameterSpaceDecision: {
    readonly mappingsMeetingDiagnosticEffect: number;
    readonly label: string;
  };
}

interface SeriesScoreRecord {
  readonly schema: "phase9-mf-mk2-series-score-v1";
  readonly mappingId: string;
  readonly model: Phase9MfMk2Model;
  readonly selectionId: Phase9MfMk2SeriesId;
  readonly status: "scored-diagnostic" | "ineligible";
  readonly sampleCount?: number;
  readonly centralMse?: number;
  readonly intervalGapMse?: number;
  readonly reasonCode?: string;
  readonly sourceDispersion?: "not-reported";
  readonly modelUncertainty?: "incomplete";
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
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

function interval(value: unknown, label: string): Phase9MfMk2Interval {
  const coordinate = object(value, label);
  const lower = finite(coordinate.digitizationLower, `${label}.digitizationLower`);
  const central = finite(coordinate.value, `${label}.value`);
  const upper = finite(coordinate.digitizationUpper, `${label}.digitizationUpper`);
  if (!(lower <= central && central <= upper)) throw new Error(`${label} interval excludes its value`);
  return { lower, value: central, upper };
}

function identity(path: string, bytes: Uint8Array): ArtifactIdentity {
  return { path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function readRegular(repositoryRoot: string, relativePath: string): Uint8Array {
  if (
    relativePath.startsWith("/") ||
    relativePath.includes("\\") ||
    relativePath.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(`unsafe repository path: ${relativePath}`);
  }
  const root = resolve(repositoryRoot);
  const path = resolve(root, relativePath);
  if (path !== root && !path.startsWith(`${root}${sep}`)) throw new Error(`repository path escapes: ${relativePath}`);
  const status = lstatSync(path);
  if (!status.isFile() || status.isSymbolicLink()) throw new Error(`repository input is not a regular file: ${relativePath}`);
  return new Uint8Array(readFileSync(path));
}

function parseProtocol(bytes: Uint8Array): PublicationProtocol {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new Error("M-F/M-K2 protocol is not valid UTF-8 JSON");
  }
  const protocol = parsed as PublicationProtocol;
  if (protocol.schema !== "phase9-mf-mk2-protocol-v1") throw new Error("M-F/M-K2 protocol schema differs");
  if (protocol.state.grantsValidationClaim !== false || protocol.state.morphologyPromotionAvailable !== false) {
    throw new Error("M-F/M-K2 protocol claim boundary differs");
  }
  return protocol;
}

/**
 * Validate the separate post-review launch authorization. The real scoring loader calls this
 * before resolving any NAS row, so absent, false, stale, or incomplete bytes fail pre-source.
 */
export function validatePhase9MfMk2ScoreLaunch(
  bytes: Uint8Array,
  repositoryRoot: string,
  protocolId: string,
  expectedScope: Phase9MfMk2PublicationScope = "registered-source-score",
): ArtifactIdentity {
  const launch = object(parseCanonicalJson(bytes, "M-F/M-K2 score launch"), "M-F/M-K2 score launch") as unknown as ScoreLaunchManifest;
  if (
    launch.schema !== "phase9-mf-mk2-launch-v1" ||
    launch.scope !== expectedScope ||
    launch.protocolId !== protocolId
  ) {
    throw new Error("M-F/M-K2 score launch identity differs");
  }
  if (launch.scoreMayRun !== true) throw new Error("M-F/M-K2 score launch does not authorize a score");
  if (
    launch.sourceFoundation?.s0b !== "frozen-independent-verifier-pass" ||
    launch.sourceFoundation?.s1 !== "complete-fail-closed-adapters"
  ) {
    throw new Error("M-F/M-K2 score launch source-foundation state differs");
  }
  if (
    launch.assurance?.syntheticPublicationChecks !== "passed" ||
    launch.assurance?.independentReview !== "accepted"
  ) {
    throw new Error("M-F/M-K2 score launch assurance state differs");
  }
  if (!Array.isArray(launch.bindings) || launch.bindings.length !== PHASE9_MF_MK2_LAUNCH_REQUIRED_PATHS.length) {
    throw new Error("M-F/M-K2 score launch binding count differs");
  }
  const byPath = new Map(launch.bindings.map((entry) => [entry.path, entry]));
  if (byPath.size !== launch.bindings.length) throw new Error("M-F/M-K2 score launch duplicates a binding");
  if (canonicalJson([...byPath.keys()].sort()) !== canonicalJson([...PHASE9_MF_MK2_LAUNCH_REQUIRED_PATHS].sort())) {
    throw new Error("M-F/M-K2 score launch path roster differs");
  }
  for (const path of PHASE9_MF_MK2_LAUNCH_REQUIRED_PATHS) {
    const expected = byPath.get(path) as ArtifactIdentity;
    const actual = identity(path, readRegular(repositoryRoot, path));
    if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(`M-F/M-K2 score launch binding differs: ${path}`);
  }
  return identity(SCORE_LAUNCH_PATH, bytes);
}

function exactRegistration(protocolRow: ProtocolSeries, expected: Phase9MfMk2SeriesRegistration): void {
  if (
    protocolRow.selectionId !== expected.selectionId ||
    protocolRow.temperatureC !== expected.temperatureC ||
    protocolRow.facet !== expected.facet ||
    protocolRow.rowCount !== expected.rowCount ||
    protocolRow.rowArtifact.sha256 !== expected.rowSha256
  ) {
    throw new Error(`protocol series differs for ${expected.selectionId}`);
  }
}

/** Parse the row body that both the producer and the later independent verifier receive. */
export function parsePhase9MfMk2SourceRows(
  registration: Phase9MfMk2SeriesRegistration,
  bytes: Uint8Array,
): readonly Phase9MfMk2Observation[] {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${registration.selectionId} source rows are not UTF-8`);
  }
  if (!text.endsWith("\n") || text.includes("\r")) throw new Error(`${registration.selectionId} source rows are not LF-terminated`);
  const lines = text.slice(0, -1).split("\n");
  if (lines.length !== registration.rowCount || lines.some((line) => line.length === 0)) {
    throw new Error(`${registration.selectionId} source row count differs`);
  }
  const pointIds = new Set<string>();
  return Object.freeze(lines.map((line, index) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line) as unknown;
    } catch {
      throw new Error(`${registration.selectionId} row ${index + 1} is not JSON`);
    }
    if (canonicalJson(parsed) !== line) throw new Error(`${registration.selectionId} row ${index + 1} is not canonical JSON`);
    const row = object(parsed, `${registration.selectionId} row ${index + 1}`);
    if (
      row.schema !== "phase8b-plot-point-v1" ||
      row.selectionId !== registration.selectionId ||
      row.phase9EvidenceRole !== "model-development"
    ) {
      throw new Error(`${registration.selectionId} row ${index + 1} identity differs`);
    }
    const pointId = string(row.pointId, `${registration.selectionId} row ${index + 1}.pointId`);
    if (pointIds.has(pointId)) throw new Error(`${registration.selectionId} duplicates ${pointId}`);
    pointIds.add(pointId);
    const x = object(row.x, `${registration.selectionId} ${pointId}.x`);
    const y = object(row.y, `${registration.selectionId} ${pointId}.y`);
    if (x.variable !== "supersaturation" || x.unit !== "percent") {
      throw new Error(`${registration.selectionId} ${pointId} supersaturation semantics differ`);
    }
    if (y.variable !== "normal_growth_rate" || y.unit !== "um s^-1") {
      throw new Error(`${registration.selectionId} ${pointId} rate semantics differ`);
    }
    return Object.freeze({
      selectionId: registration.selectionId as Phase9MfMk2SeriesId,
      pointId,
      plottedApparatusSupersaturationPercent: interval(x, `${registration.selectionId} ${pointId}.x`),
      normalGrowthRateUmPerS: interval(y, `${registration.selectionId} ${pointId}.y`),
    });
  }));
}

function scoreRecord(score: Phase9MfMk2SeriesScore): SeriesScoreRecord {
  if (score.status === "ineligible") {
    return {
      schema: "phase9-mf-mk2-series-score-v1",
      mappingId: score.mappingId,
      model: score.model,
      selectionId: score.selectionId,
      status: "ineligible",
      reasonCode: score.reasonCode,
    };
  }
  return {
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
  };
}

function jsonl(rows: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function basalIdentity(
  mfScores: readonly Phase9MfMk2SeriesScore[],
  mk2Scores: readonly Phase9MfMk2SeriesScore[],
): { readonly seriesIds: readonly Phase9MfMk2SeriesId[]; readonly evaluatedPointCount: number; readonly bitIdentical: true } {
  const basalIds = ["P8B-P1-S89-F3-BASAL", "P8B-P1-S89-F4-BASAL"] as const;
  let evaluatedPointCount = 0;
  for (const selectionId of basalIds) {
    const baseline = mfScores.find((score) => score.selectionId === selectionId);
    const intervention = mk2Scores.find((score) => score.selectionId === selectionId);
    if (baseline?.status !== "scored-diagnostic" || intervention?.status !== "scored-diagnostic") {
      throw new Error(`basal identity score unavailable for ${selectionId}`);
    }
    if (baseline.pointScores.length !== intervention.pointScores.length) throw new Error("basal identity point count differs");
    for (let index = 0; index < baseline.pointScores.length; index++) {
      const left = baseline.pointScores[index]?.predictedRateUmPerS;
      const right = intervention.pointScores[index]?.predictedRateUmPerS;
      if (
        left === undefined || right === undefined ||
        !Object.is(left.lower, right.lower) ||
        !Object.is(left.value, right.value) ||
        !Object.is(left.upper, right.upper)
      ) {
        throw new Error(`M-K2 changed the basal comparator at ${selectionId}/${index}`);
      }
      evaluatedPointCount++;
    }
  }
  return { seriesIds: basalIds, evaluatedPointCount, bitIdentical: true };
}

function familyJson(score: Phase9MfMk2EqualSeriesScore): StrictJson {
  return strictJsonSnapshot({
    family: score.family,
    model: score.model,
    mappingId: score.mappingId,
    seriesIds: score.seriesIds,
    equalSeriesCentralMse: score.equalSeriesCentralMse,
    equalSeriesIntervalGapMse: score.equalSeriesIntervalGapMse,
    weighting: "equal-series",
    pooledPointScoreForbidden: true,
  });
}

function indexedArtifacts(payloads: ReadonlyMap<string, Uint8Array>): Uint8Array {
  const entries = [...payloads.entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([path, bytes]) => identity(path, bytes));
  return canonicalJsonBytes({
    schema: "phase9-mf-mk2-artifact-index-v1",
    scope: "development-only-diagnostic-planar-facet",
    artifactCount: entries.length,
    artifacts: entries,
  });
}

export function derivePhase9MfMk2Publication(
  material: Phase9MfMk2RunMaterial,
): Phase9MfMk2PublicationBundle {
  if (material.command.length === 0 || material.command.some((part) => part.length === 0)) {
    throw new Error("publication command must preserve every nonempty invocation argument");
  }
  if (material.series.length !== PHASE9_MF_MK2_SERIES.length) throw new Error("publication requires exactly six series");
  const byId = new Map(material.series.map((series) => [series.registration.selectionId, series]));
  if (byId.size !== material.series.length) throw new Error("publication contains duplicate series");
  const observations = new Map<Phase9MfMk2SeriesId, readonly Phase9MfMk2Observation[]>();
  for (const expected of PHASE9_MF_MK2_SERIES) {
    const series = byId.get(expected.selectionId);
    if (series === undefined) throw new Error(`publication is missing ${expected.selectionId}`);
    for (const key of ["selectionId", "temperatureC", "facet", "rowCount", "pressurePa", "lineageId"] as const) {
      if (series.registration[key] !== expected[key]) throw new Error(`publication registration differs at ${expected.selectionId}.${key}`);
    }
    const actualIdentity = identity(`${series.sourceArtifact.logicalRoot}/${series.sourceArtifact.path}`, series.sourceBytes);
    if (
      actualIdentity.byteLength !== series.sourceArtifact.byteLength ||
      actualIdentity.sha256 !== series.sourceArtifact.sha256
    ) {
      throw new Error(`publication source identity differs for ${expected.selectionId}`);
    }
    if (material.scope === "registered-source-score" && actualIdentity.sha256 !== expected.rowSha256) {
      throw new Error(`registered publication source hash differs for ${expected.selectionId}`);
    }
    observations.set(expected.selectionId, parsePhase9MfMk2SourceRows(expected, series.sourceBytes));
  }

  const seriesRecords: SeriesScoreRecord[] = [];
  const mappingRecords: StrictJson[] = [];
  const mappingDecisions: Phase9MfMk2MatchedPrismDecision[] = [];
  for (const mappingId of PHASE9_MF_MK2_DIAGNOSTIC_MAPPING_IDS) {
    const scoresFor = (model: Phase9MfMk2Model): Phase9MfMk2SeriesScore[] =>
      PHASE9_MF_MK2_SERIES.map(({ selectionId }) => phase9MfMk2ScoreSeries(
        model,
        mappingId,
        observations.get(selectionId) as readonly Phase9MfMk2Observation[],
      ));
    const mfScores = scoresFor("mf-inherited-cak-control");
    const mk2Scores = scoresFor("mk2-prism-annex");
    const zeroScores = scoresFor("zero-growth-control");
    for (const scores of [mfScores, mk2Scores, zeroScores]) {
      seriesRecords.push(...scores.map(scoreRecord));
    }
    const mk2DomainIds = new Set<Phase9MfMk2SeriesId>(PHASE9_MF_MK2_FAMILY_ROSTERS["mk2-four-series-domain"]);
    const matchedIds = new Set<Phase9MfMk2SeriesId>(PHASE9_MF_MK2_FAMILY_ROSTERS["matched-prism-two-series"]);
    const mfMatched = mfScores.filter((score) => matchedIds.has(score.selectionId));
    const mk2Matched = mk2Scores.filter((score) => matchedIds.has(score.selectionId));
    const decision = phase9MfMk2DecideMatchedPrism(mappingId, mfMatched, mk2Matched);
    mappingDecisions.push(decision);
    const refusals = mk2Scores
      .filter((score) => score.status === "ineligible")
      .map((score) => ({ selectionId: score.selectionId, reasonCode: score.reasonCode }));
    if (
      refusals.length !== 2 ||
      refusals.some((row) => row.reasonCode !== "MK2_NO_MINUS_30_ROW")
    ) {
      throw new Error(`M-K2 minus-thirty refusal roster differs at ${mappingId}`);
    }
    mappingRecords.push(strictJsonSnapshot({
      schema: "phase9-mf-mk2-mapping-decision-v1",
      mappingId,
      mappingStatus: "diagnostic-only",
      mfSixSeries: familyJson(phase9MfMk2EqualSeriesScore(mfScores, "mf-six-series")),
      mk2FourSeriesDomain: familyJson(phase9MfMk2EqualSeriesScore(
        mk2Scores.filter((score) => mk2DomainIds.has(score.selectionId)),
        "mk2-four-series-domain",
      )),
      zeroControlSixSeries: familyJson(phase9MfMk2EqualSeriesScore(zeroScores, "zero-control-six-series")),
      matchedPrismBaseline: familyJson(phase9MfMk2EqualSeriesScore(mfMatched, "matched-prism-two-series")),
      matchedPrismIntervention: familyJson(phase9MfMk2EqualSeriesScore(mk2Matched, "matched-prism-two-series")),
      matchedPrismDecision: decision,
      basalIdentity: basalIdentity(mfScores, mk2Scores),
      minusThirtyRefusals: refusals,
      physicalScore: {
        status: "unavailable",
        sourceMappingStatus: "source-blocked",
        grantsValidationClaim: false,
        promotionAvailable: false,
      },
    }));
  }
  const parameterSpaceDecision = phase9MfMk2DecideParameterSpace(mappingDecisions);
  const sourceArtifacts = PHASE9_MF_MK2_SERIES.map((registration) => {
    const series = byId.get(registration.selectionId) as Phase9MfMk2BoundSeries;
    return {
      selectionId: registration.selectionId,
      temperatureC: registration.temperatureC,
      facet: registration.facet,
      rowCount: registration.rowCount,
      logicalRoot: series.sourceArtifact.logicalRoot,
      path: series.sourceArtifact.path,
      byteLength: series.sourceArtifact.byteLength,
      sha256: series.sourceArtifact.sha256,
      adapterStatus: series.adapterStatus,
      adapterReasons: series.adapterReasons,
    };
  });
  const launchManifest = canonicalJsonBytes({
    schema: "phase9-mf-mk2-publication-launch-v1",
    scope: material.scope,
    protocolId: material.protocolId,
    protocolIdentity: material.protocolIdentity,
    scoreLaunchIdentity: material.scoreLaunchIdentity,
    evaluatorIdentities: material.evaluatorIdentities,
    sourceArtifacts,
    mappingFamily: [
      { id: "diagnostic-proportional-q0.125", surfaceToPlottedRatio: 0.125 },
      { id: "diagnostic-proportional-q0.25", surfaceToPlottedRatio: 0.25 },
      { id: "diagnostic-proportional-q0.5", surfaceToPlottedRatio: 0.5 },
      { id: "diagnostic-proportional-q0.75", surfaceToPlottedRatio: 0.75 },
      { id: "diagnostic-identity-q1", surfaceToPlottedRatio: 1 },
    ],
    modelContract: {
      mf: "inherited permanent CAK control; diagnostic replay only",
      mk2PrismAnnex: {
        minusSeven: [
          { prefactor: 0.5, barrierFraction: 0.008 },
          { prefactor: 0.5, barrierFraction: 0.01 },
        ],
        minusFifteen: [{ prefactor: 1, barrierFraction: 0.03 }],
        minusThirty: "refused",
        basalAtMinusSevenAndMinusFifteen: "unchanged inherited CAK control",
      },
      zeroGrowthControl: "exact six-series type-appropriate control",
    },
    aggregation: "equal-series",
    controlIds: PHASE9_MF_MK2_PUBLICATION_CONTROL_IDS,
    runtime: material.runtime,
    processConcurrency: 1,
    command: material.command,
  });
  const scoresBytes = jsonl(seriesRecords);
  const mappingsBytes = jsonl(mappingRecords);
  const reportBytes = canonicalJsonBytes({
    schema: "phase9-mf-mk2-publication-report-v1",
    scope: material.scope,
    status: "candidate-awaiting-independent-verification",
    phase9EvidenceRole: "model-development",
    counts: {
      sourceSeries: 6,
      sourcePoints: PHASE9_MF_MK2_SERIES.reduce((sum, row) => sum + row.rowCount, 0),
      diagnosticMappings: 5,
      seriesScoreRecords: seriesRecords.length,
      scoredDiagnosticRecords: seriesRecords.filter((row) => row.status === "scored-diagnostic").length,
      explicitMinusThirtyRefusals: seriesRecords.filter(
        (row) => row.status === "ineligible" && row.reasonCode === "MK2_NO_MINUS_30_ROW",
      ).length,
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
  const payloads = new Map<string, Uint8Array>([
    ["launch-manifest.json", launchManifest],
    ["mapping-decisions.jsonl", mappingsBytes],
    ["report.json", reportBytes],
    ["series-scores.jsonl", scoresBytes],
  ]);
  const artifacts = new Map(payloads);
  artifacts.set("artifact-index.json", indexedArtifacts(payloads));
  return Object.freeze({
    scope: material.scope,
    artifacts,
    parameterSpaceDecision: {
      mappingsMeetingDiagnosticEffect: parameterSpaceDecision.mappingsMeetingDiagnosticEffect,
      label: parameterSpaceDecision.label,
    },
  });
}

function adapterObservation(result: Phase9AdapterResult): readonly Phase9MfMk2Observation[] {
  return result.observations.map((row) => {
    const x = object(row.values.x, `${result.selectionId} adapted x`);
    const y = object(row.values.y, `${result.selectionId} adapted y`);
    return {
      selectionId: result.selectionId as Phase9MfMk2SeriesId,
      pointId: string(row.values.pointId, `${result.selectionId} adapted pointId`),
      plottedApparatusSupersaturationPercent: interval(x, `${result.selectionId} adapted x`),
      normalGrowthRateUmPerS: interval(y, `${result.selectionId} adapted y`),
    };
  });
}

/** Load the real registered candidate. Calling this function reads all six source row bodies. */
export function loadPhase9MfMk2RegisteredRunMaterial(
  repositoryRoot: string,
  environment: Readonly<Record<string, string | undefined>> = process.env,
  nasCandidates?: readonly string[],
  command: readonly string[] = process.argv,
): Phase9MfMk2RunMaterial {
  const protocolBytes = readRegular(repositoryRoot, PROTOCOL_PATH);
  const protocol = parseProtocol(protocolBytes);
  const scoreLaunchBytes = readRegular(repositoryRoot, SCORE_LAUNCH_PATH);
  const scoreLaunchIdentity = validatePhase9MfMk2ScoreLaunch(
    scoreLaunchBytes,
    repositoryRoot,
    protocol.protocolId,
  );
  if (protocol.seriesRoster.length !== PHASE9_MF_MK2_SERIES.length) throw new Error("protocol does not contain six series");
  for (let index = 0; index < PHASE9_MF_MK2_SERIES.length; index++) {
    exactRegistration(protocol.seriesRoster[index] as ProtocolSeries, PHASE9_MF_MK2_SERIES[index] as Phase9MfMk2SeriesRegistration);
  }
  if (canonicalJson(protocol.mappingFamily.slice(0, 5).map(({ id, surfaceToPlottedRatio }) => ({ id, surfaceToPlottedRatio }))) !== canonicalJson([
    { id: "diagnostic-proportional-q0.125", surfaceToPlottedRatio: 0.125 },
    { id: "diagnostic-proportional-q0.25", surfaceToPlottedRatio: 0.25 },
    { id: "diagnostic-proportional-q0.5", surfaceToPlottedRatio: 0.5 },
    { id: "diagnostic-proportional-q0.75", surfaceToPlottedRatio: 0.75 },
    { id: "diagnostic-identity-q1", surfaceToPlottedRatio: 1 },
  ])) throw new Error("protocol diagnostic mapping family differs");

  const evaluatorIdentities = protocol.entryArtifacts.map((expected) => {
    const bytes = readRegular(repositoryRoot, expected.path);
    const actual = identity(expected.path, bytes);
    if (actual.byteLength !== expected.byteLength || actual.sha256 !== expected.sha256) {
      throw new Error(`protocol entry artifact differs: ${expected.path}`);
    }
    return actual;
  });
  // The reviewed protocol binds its scientific inputs and evaluator. The separate launch
  // authorization binds the final test and publication bytes after their hashes are stable.
  const requiredEvaluatorPaths = [MODEL_PATH, ADAPTER_REGISTRY_PATH, SUCCESSOR_BOOK_PATH];
  for (const path of requiredEvaluatorPaths) {
    if (!evaluatorIdentities.some((entry) => entry.path === path)) throw new Error(`protocol does not bind ${path}`);
  }

  const nasRoot = detectPhase9NasRoot(environment, nasCandidates);
  if (nasRoot === null) throw new Error("snowcrystal NAS share is not mounted");
  const series = protocol.seriesRoster.map((protocolRow, index): Phase9MfMk2BoundSeries => {
    const registration = PHASE9_MF_MK2_SERIES[index] as Phase9MfMk2SeriesRegistration;
    const logicalPath = `${protocolRow.rowArtifact.logicalRoot}/${protocolRow.rowArtifact.path}`;
    const resolved = resolvePhase9NasFile(logicalPath, nasRoot);
    if (resolved.kind !== "ok") throw new Error(`${registration.selectionId} source resolution failed: ${resolved.reason}`);
    const bytes = new Uint8Array(readFileSync(resolved.path));
    const actual = identity(logicalPath, bytes);
    if (actual.byteLength !== protocolRow.rowArtifact.byteLength || actual.sha256 !== protocolRow.rowArtifact.sha256) {
      throw new Error(`${registration.selectionId} source bytes differ`);
    }
    return {
      registration,
      sourceArtifact: protocolRow.rowArtifact,
      sourceBytes: bytes,
      adapterStatus: "eligible-with-limitation",
      adapterReasons: [],
    };
  });

  const registryBytes = readRegular(repositoryRoot, ADAPTER_REGISTRY_PATH);
  const successorBytes = readRegular(repositoryRoot, SUCCESSOR_BOOK_PATH);
  const metadataBytes = readRegular(repositoryRoot, PLOT_METADATA_PATH);
  const rowArtifacts = new Map<string, Uint8Array>();
  for (const item of series) rowArtifacts.set(phase9RowArtifactKey(item.sourceArtifact), item.sourceBytes);
  const requestedPurposes = new Map(PHASE9_MF_MK2_SERIES.map((row) => [
    row.selectionId,
    "planar-facet-rate-source-replay",
  ]));
  const adapted = adaptPhase9MeasurementCorpus({
    registryBytes,
    successorTargetBookBytes: successorBytes,
    metadataArtifacts: new Map([[PLOT_METADATA_PATH, metadataBytes]]),
    rowArtifacts,
    requestedPurposes,
  });
  for (const item of series) {
    const result = adapted.find((row) => row.selectionId === item.registration.selectionId);
    if (
      result === undefined ||
      result.status !== "eligible-with-limitation" ||
      result.adapterKind !== "planar-facet" ||
      result.bindingKind !== "digitized-plot-series"
    ) {
      throw new Error(`${item.registration.selectionId} S1 adapter is not eligible with limitation`);
    }
    const parsed = parsePhase9MfMk2SourceRows(item.registration, item.sourceBytes);
    if (canonicalJson(adapterObservation(result)) !== canonicalJson(parsed)) {
      throw new Error(`${item.registration.selectionId} S1 and publication parsing differ`);
    }
    (item as { adapterReasons: readonly string[] }).adapterReasons = Object.freeze([...result.reasons]);
  }
  return Object.freeze({
    scope: "registered-source-score",
    protocolId: protocol.protocolId,
    protocolIdentity: identity(PROTOCOL_PATH, protocolBytes),
    scoreLaunchIdentity,
    evaluatorIdentities: Object.freeze(evaluatorIdentities),
    series: Object.freeze(series),
    runtime: Object.freeze({ node: process.version, platform: process.platform, architecture: process.arch }),
    command: Object.freeze([...command]),
  });
}

export function writePhase9MfMk2Publication(
  bundle: Phase9MfMk2PublicationBundle,
  outputDirectory: string,
): void {
  if (bundle.scope !== "registered-source-score") throw new Error("synthetic fixtures cannot be published");
  const target = resolve(outputDirectory);
  if (existsSync(target)) throw new Error(`publication target already exists: ${target}`);
  const parent = dirname(target);
  mkdirSync(parent, { recursive: true });
  const staging = `${target}.staging-${randomUUID()}`;
  mkdirSync(staging);
  try {
    for (const path of PHASE9_MF_MK2_PUBLICATION_FILES) {
      const bytes = bundle.artifacts.get(path);
      if (bytes === undefined) throw new Error(`publication bundle lacks ${path}`);
      writeFileSync(join(staging, path), bytes, { flag: "wx" });
    }
    const names = readdirSync(staging).sort();
    if (canonicalJson(names) !== canonicalJson([...PHASE9_MF_MK2_PUBLICATION_FILES].sort())) {
      throw new Error("staged publication file roster differs");
    }
    for (const path of names) {
      const expected = bundle.artifacts.get(path) as Uint8Array;
      const actual = new Uint8Array(readFileSync(join(staging, path)));
      if (sha256Bytes(actual) !== sha256Bytes(expected)) throw new Error(`staged ${path} changed`);
    }
    renameSync(staging, target);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

function usage(): never {
  throw new Error(
    "usage: node runner/src/phase9-mf-mk2-publication.ts produce --out <new-directory> [--repo-root <path>]",
  );
}

function runCli(arguments_: readonly string[]): void {
  if (arguments_[0] !== "produce") usage();
  let output: string | undefined;
  let repositoryRoot = process.cwd();
  for (let index = 1; index < arguments_.length; index += 2) {
    const flag = arguments_[index];
    const value = arguments_[index + 1];
    if (value === undefined) usage();
    if (flag === "--out") output = value;
    else if (flag === "--repo-root") repositoryRoot = value;
    else usage();
  }
  if (output === undefined) usage();
  const material = loadPhase9MfMk2RegisteredRunMaterial(repositoryRoot);
  const bundle = derivePhase9MfMk2Publication(material);
  writePhase9MfMk2Publication(bundle, output);
  process.stdout.write(`${canonicalJson({ output: resolve(output), status: "candidate-awaiting-independent-verification" })}\n`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
