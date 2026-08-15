// Phase 8B S4 — adjudicated plot publication.
//
// The frozen v2 registration defines the sources, renders, axes, series semantics and expected
// marker counts. V3 consumes a separately reviewed reconciliation of the two raw reads. It refuses
// publication unless every registered observation has one accepted coordinate and one unique
// physical-marker identity. Numeric row bodies stay on the NAS; Git receives metadata and hashes.

import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  parsePhase8PlotRegistration,
  type Phase8PlotAxisSpec,
  type Phase8PlotRead,
  type Phase8PlotRegistration,
} from "./phase8-plot-extraction.ts";

export const PHASE8_PLOT_V3_OPERATOR = "phase8b-adjudicated-plot-digitization-v3" as const;
export const PHASE8_PLOT_V3_REGISTRATION_PATH =
  "research/phase8b-plot-publication-v3.json" as const;
export const PHASE8_PLOT_V3_METADATA_NAMES = [
  "artifact-index.json",
  "operator.json",
  "records.jsonl",
  "report.json",
] as const;

type JsonObject = { readonly [key: string]: StrictJson };

interface PinnedInput {
  readonly path: string;
  readonly sha256: string;
  readonly rowCount?: number;
}

export interface Phase8PlotV3Registration {
  readonly schema: "phase8b-adjudicated-plot-publication-registration-v1";
  readonly operator: typeof PHASE8_PLOT_V3_OPERATOR;
  readonly scope: "registered-adjudicated-20260812" | "test-fixture";
  readonly baseOperator: PinnedInput;
  readonly selection: PinnedInput & { readonly seriesCount: number };
  readonly inputs: {
    readonly readA: PinnedInput & { readonly rowCount: number };
    readonly readB: PinnedInput & { readonly rowCount: number };
    readonly adjudication: PinnedInput & { readonly rowCount: number };
    readonly adjudicationReport: PinnedInput;
  };
  readonly output: {
    readonly physicalStorageRoot: string;
    readonly dataLogicalRoot: string;
    readonly expectedSeriesCount: number;
    readonly expectedPointCount: number;
  };
  readonly policy: {
    readonly acceptedCoordinate: "adjudication.accepted";
    readonly pointIdentity: "seriesId-plus-physicalPointId";
    readonly rosterRule: "one-accepted-unique-physical-target-per-registered-point";
    readonly pixelUncertainty: "marker-half-width-plus-full-reader-threshold-plus-unused-anchor-residual";
  };
}

interface AcceptedPixels {
  readonly pixelX: number;
  readonly pixelY: number;
  readonly orderSpanTopPixelY?: number;
  readonly orderSpanBottomPixelY?: number;
}

interface ReadReference {
  readonly seriesId: string;
  readonly pointId: string;
}

interface ThirdReview {
  readonly reviewerId: string;
  readonly method: string;
  readonly pixels: AcceptedPixels;
}

export interface Phase8PlotAdjudicationRow {
  readonly schema: "phase8b-plot-physical-target-map-v1";
  readonly seriesId: string;
  readonly physicalPointId: string;
  readonly plotId: string;
  readonly thresholdPixels: number;
  readonly readARef?: ReadReference;
  readonly readBRef?: ReadReference;
  readonly accepted: AcceptedPixels;
  readonly acceptedFrom: "read-a" | "read-b" | "reader-mean" | "third-review";
  readonly status: string;
  readonly reason: string;
  readonly thirdReview?: ThirdReview;
}

export interface Phase8PlotV3Inputs {
  readonly publicationRegistrationBytes: Uint8Array;
  readonly baseOperatorBytes: Uint8Array;
  readonly selectionBytes: Uint8Array;
  readonly readABytes: Uint8Array;
  readonly readBBytes: Uint8Array;
  readonly adjudicationBytes: Uint8Array;
  readonly adjudicationReportBytes: Uint8Array;
}

export interface Phase8PlotV3Bundle {
  readonly registration: Phase8PlotV3Registration;
  readonly metadataArtifacts: ReadonlyMap<string, Uint8Array>;
  readonly dataArtifacts: ReadonlyMap<string, Uint8Array>;
  readonly counts: {
    readonly seriesCount: number;
    readonly pointCount: number;
    readonly preReadRefusedCandidateCount: number;
    readonly directObservationSeriesCount: number;
    readonly sourceDerivedRatioSeriesCount: number;
    readonly imposedForcingSeriesCount: number;
  };
  readonly targetRosterSha256: string;
}

interface AxisMapping {
  readonly pixelToValue: (pixel: number) => number;
  readonly valueToPixel: (value: number) => number;
  readonly maximumValidationResidualPixels: number;
}

function object(value: StrictJson, label: string): JsonObject {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${label} must be an object`);
  }
  return value as JsonObject;
}

function array(value: StrictJson | undefined, label: string): readonly StrictJson[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function string(value: StrictJson | undefined, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a string`);
  return value;
}

function finite(value: StrictJson | undefined, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function positiveInteger(value: StrictJson | undefined, label: string): number {
  const result = finite(value, label);
  if (!Number.isSafeInteger(result) || result <= 0) throw new Error(`${label} must be a positive integer`);
  return result;
}

function sha256(value: StrictJson | undefined, label: string): string {
  const result = string(value, label);
  if (!/^[0-9a-f]{64}$/.test(result)) throw new Error(`${label} must be a lowercase SHA-256`);
  return result;
}

function exactKeys(value: JsonObject, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`${label} keys differ`);
  }
}

function safeLogicalPath(value: string, label: string): string {
  if (isAbsolute(value) || value === "" || value === "." || value === ".." || value.split(/[\\/]/u).includes("..")) {
    throw new Error(`${label} must be a safe relative path`);
  }
  return value;
}

function parsePin(value: StrictJson | undefined, label: string, withRows: boolean): PinnedInput {
  const row = object(value as StrictJson, label);
  exactKeys(row, withRows ? ["path", "sha256", "rowCount"] : ["path", "sha256"], label);
  return {
    path: safeLogicalPath(string(row.path, `${label}.path`), `${label}.path`),
    sha256: sha256(row.sha256, `${label}.sha256`),
    ...(withRows ? { rowCount: positiveInteger(row.rowCount, `${label}.rowCount`) } : {}),
  };
}

export function parsePhase8PlotV3Registration(bytes: Uint8Array): Phase8PlotV3Registration {
  const root = object(parseCanonicalJson(bytes, "v3 plot registration"), "v3 plot registration");
  exactKeys(root, ["schema", "operator", "scope", "baseOperator", "selection", "inputs", "output", "policy"], "v3 plot registration");
  if (root.schema !== "phase8b-adjudicated-plot-publication-registration-v1" ||
      root.operator !== PHASE8_PLOT_V3_OPERATOR ||
      (root.scope !== "registered-adjudicated-20260812" && root.scope !== "test-fixture")) {
    throw new Error("v3 plot registration identity differs");
  }
  const selection = object(root.selection as StrictJson, "selection");
  exactKeys(selection, ["path", "sha256", "seriesCount"], "selection");
  const inputs = object(root.inputs as StrictJson, "inputs");
  exactKeys(inputs, ["readA", "readB", "adjudication", "adjudicationReport"], "inputs");
  const output = object(root.output as StrictJson, "output");
  exactKeys(output, ["physicalStorageRoot", "dataLogicalRoot", "expectedSeriesCount", "expectedPointCount"], "output");
  const policy = object(root.policy as StrictJson, "policy");
  exactKeys(policy, ["acceptedCoordinate", "pointIdentity", "rosterRule", "pixelUncertainty"], "policy");
  if (policy.acceptedCoordinate !== "adjudication.accepted" ||
      policy.pointIdentity !== "seriesId-plus-physicalPointId" ||
      policy.rosterRule !== "one-accepted-unique-physical-target-per-registered-point" ||
      policy.pixelUncertainty !== "marker-half-width-plus-full-reader-threshold-plus-unused-anchor-residual") {
    throw new Error("v3 plot policy differs");
  }
  const physicalStorageRoot = string(output.physicalStorageRoot, "output.physicalStorageRoot");
  if (!isAbsolute(physicalStorageRoot)) throw new Error("output.physicalStorageRoot must be absolute");
  return {
    schema: "phase8b-adjudicated-plot-publication-registration-v1",
    operator: PHASE8_PLOT_V3_OPERATOR,
    scope: root.scope as Phase8PlotV3Registration["scope"],
    baseOperator: parsePin(root.baseOperator, "baseOperator", false),
    selection: {
      path: safeLogicalPath(string(selection.path, "selection.path"), "selection.path"),
      sha256: sha256(selection.sha256, "selection.sha256"),
      seriesCount: positiveInteger(selection.seriesCount, "selection.seriesCount"),
    },
    inputs: {
      readA: parsePin(inputs.readA, "inputs.readA", true) as PinnedInput & { readonly rowCount: number },
      readB: parsePin(inputs.readB, "inputs.readB", true) as PinnedInput & { readonly rowCount: number },
      adjudication: parsePin(inputs.adjudication, "inputs.adjudication", true) as PinnedInput & { readonly rowCount: number },
      adjudicationReport: parsePin(inputs.adjudicationReport, "inputs.adjudicationReport", false),
    },
    output: {
      physicalStorageRoot,
      dataLogicalRoot: safeLogicalPath(string(output.dataLogicalRoot, "output.dataLogicalRoot"), "output.dataLogicalRoot"),
      expectedSeriesCount: positiveInteger(output.expectedSeriesCount, "output.expectedSeriesCount"),
      expectedPointCount: positiveInteger(output.expectedPointCount, "output.expectedPointCount"),
    },
    policy: {
      acceptedCoordinate: "adjudication.accepted",
      pointIdentity: "seriesId-plus-physicalPointId",
      rosterRule: "one-accepted-unique-physical-target-per-registered-point",
      pixelUncertainty: "marker-half-width-plus-full-reader-threshold-plus-unused-anchor-residual",
    },
  };
}

function parseRead(value: StrictJson | undefined, readerId: "read-a" | "read-b", label: string): Phase8PlotRead {
  const row = object(value as StrictJson, label);
  const allowed = ["schema", "readerId", "seriesId", "pointId", "pixelX", "pixelY", "markerStatus", "orderSpanTopPixelY", "orderSpanBottomPixelY"];
  const keys = Object.keys(row);
  if (keys.some((key) => !allowed.includes(key))) throw new Error(`${label} has an unexpected key`);
  if (row.schema !== "phase8b-plot-read-v1" || row.readerId !== readerId) throw new Error(`${label} identity differs`);
  const markerStatus = string(row.markerStatus, `${label}.markerStatus`);
  if (markerStatus !== "clear" && markerStatus !== "ambiguous" && markerStatus !== "clipped") throw new Error(`${label}.markerStatus differs`);
  const top = row.orderSpanTopPixelY === undefined ? undefined : finite(row.orderSpanTopPixelY, `${label}.orderSpanTopPixelY`);
  const bottom = row.orderSpanBottomPixelY === undefined ? undefined : finite(row.orderSpanBottomPixelY, `${label}.orderSpanBottomPixelY`);
  if ((top === undefined) !== (bottom === undefined)) throw new Error(`${label} span is partial`);
  return {
    schema: "phase8b-plot-read-v1",
    readerId,
    seriesId: string(row.seriesId, `${label}.seriesId`),
    pointId: string(row.pointId, `${label}.pointId`),
    pixelX: finite(row.pixelX, `${label}.pixelX`),
    pixelY: finite(row.pixelY, `${label}.pixelY`),
    markerStatus,
    ...(top === undefined ? {} : { orderSpanTopPixelY: top, orderSpanBottomPixelY: bottom as number }),
  };
}

function parseAccepted(value: StrictJson | undefined, label: string): AcceptedPixels {
  const row = object(value as StrictJson, label);
  const keys = Object.keys(row).sort();
  const basic = ["pixelX", "pixelY"].sort();
  const span = ["pixelX", "pixelY", "orderSpanTopPixelY", "orderSpanBottomPixelY"].sort();
  if (!((keys.length === basic.length && keys.every((key, index) => key === basic[index])) ||
      (keys.length === span.length && keys.every((key, index) => key === span[index])))) {
    throw new Error(`${label} keys differ`);
  }
  const top = row.orderSpanTopPixelY === undefined ? undefined : finite(row.orderSpanTopPixelY, `${label}.orderSpanTopPixelY`);
  const bottom = row.orderSpanBottomPixelY === undefined ? undefined : finite(row.orderSpanBottomPixelY, `${label}.orderSpanBottomPixelY`);
  return {
    pixelX: finite(row.pixelX, `${label}.pixelX`),
    pixelY: finite(row.pixelY, `${label}.pixelY`),
    ...(top === undefined ? {} : { orderSpanTopPixelY: top, orderSpanBottomPixelY: bottom as number }),
  };
}

function parseReadReference(value: StrictJson | undefined, label: string): ReadReference | undefined {
  if (value === null || value === undefined) return undefined;
  const row = object(value, label);
  exactKeys(row, ["seriesId", "pointId"], label);
  return { seriesId: string(row.seriesId, `${label}.seriesId`), pointId: string(row.pointId, `${label}.pointId`) };
}

function parseThirdReview(value: StrictJson | undefined, label: string): ThirdReview | undefined {
  if (value === null || value === undefined) return undefined;
  const row = object(value, label);
  exactKeys(row, ["reviewerId", "method", "pixels"], label);
  return {
    reviewerId: string(row.reviewerId, `${label}.reviewerId`),
    method: string(row.method, `${label}.method`),
    pixels: parseAccepted(row.pixels, `${label}.pixels`),
  };
}

function parseJsonl(bytes: Uint8Array, label: string): readonly StrictJson[] {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (!text.endsWith("\n")) throw new Error(`${label} lacks terminal newline`);
  return text.slice(0, -1).split("\n").map((line, index) => parseCanonicalJson(new TextEncoder().encode(`${line}\n`), `${label} line ${index + 1}`));
}

function canonicalJsonl(rows: readonly StrictJson[]): Uint8Array {
  return new TextEncoder().encode(rows.map((row) => canonicalJson(row)).join("\n") + "\n");
}

export function parsePhase8PlotAdjudication(bytes: Uint8Array): readonly Phase8PlotAdjudicationRow[] {
  return parseJsonl(bytes, "plot adjudication").map((value, index) => {
    const label = `plot adjudication line ${index + 1}`;
    const row = object(value, label);
    exactKeys(row, ["schema", "seriesId", "physicalPointId", "plotId", "thresholdPixels", "readARef", "readBRef", "accepted", "acceptedFrom", "status", "reason", "thirdReview"], label);
    if (row.schema !== "phase8b-plot-physical-target-map-v1") throw new Error(`${label} schema differs`);
    const acceptedFrom = string(row.acceptedFrom, `${label}.acceptedFrom`);
    if (acceptedFrom !== "read-a" && acceptedFrom !== "read-b" && acceptedFrom !== "reader-mean" && acceptedFrom !== "third-review") {
      throw new Error(`${label}.acceptedFrom differs`);
    }
    return {
      schema: "phase8b-plot-physical-target-map-v1",
      seriesId: string(row.seriesId, `${label}.seriesId`),
      physicalPointId: string(row.physicalPointId, `${label}.physicalPointId`),
      plotId: string(row.plotId, `${label}.plotId`),
      thresholdPixels: finite(row.thresholdPixels, `${label}.thresholdPixels`),
      ...(parseReadReference(row.readARef, `${label}.readARef`) === undefined ? {} : { readARef: parseReadReference(row.readARef, `${label}.readARef`) as ReadReference }),
      ...(parseReadReference(row.readBRef, `${label}.readBRef`) === undefined ? {} : { readBRef: parseReadReference(row.readBRef, `${label}.readBRef`) as ReadReference }),
      accepted: parseAccepted(row.accepted, `${label}.accepted`),
      acceptedFrom,
      status: string(row.status, `${label}.status`),
      reason: string(row.reason, `${label}.reason`),
      ...(parseThirdReview(row.thirdReview, `${label}.thirdReview`) === undefined ? {} : { thirdReview: parseThirdReview(row.thirdReview, `${label}.thirdReview`) as ThirdReview }),
    };
  });
}

function readKey(row: Pick<Phase8PlotRead, "seriesId" | "pointId">): string {
  return `${row.seriesId}\u0000${row.pointId}`;
}

function parseRawReads(bytes: Uint8Array, readerId: "read-a" | "read-b"): readonly Phase8PlotRead[] {
  return parseJsonl(bytes, readerId).map((value, index) => parseRead(value, readerId, `${readerId} line ${index + 1}`));
}

export function validatePhase8PlotAdjudicationRoster(
  series: readonly { readonly selectionId: string; readonly expectedPointCount: number }[],
  adjudication: readonly Phase8PlotAdjudicationRow[],
): string {
  const expectedBySeries = new Map(series.map((row) => [row.selectionId, row.expectedPointCount]));
  if (expectedBySeries.size !== series.length) throw new Error("registered series roster duplicates selection IDs");
  const acceptedBySeries = new Map<string, Phase8PlotAdjudicationRow[]>(series.map((row) => [row.selectionId, []]));
  const physicalKeys = new Set<string>();
  for (const row of adjudication) {
    if (!expectedBySeries.has(row.seriesId)) throw new Error(`adjudication contains unregistered series ${row.seriesId}`);
    if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(row.physicalPointId)) throw new Error(`unsafe physicalPointId: ${row.seriesId}/${row.physicalPointId}`);
    const key = `${row.seriesId}\u0000${row.physicalPointId}`;
    if (physicalKeys.has(key)) throw new Error(`duplicate adjudicated physical target: ${row.seriesId}/${row.physicalPointId}`);
    physicalKeys.add(key);
    acceptedBySeries.get(row.seriesId)?.push(row);
  }
  for (const [seriesId, expected] of expectedBySeries) {
    const actual = acceptedBySeries.get(seriesId)?.length ?? 0;
    if (actual !== expected) throw new Error(`adjudicated physical-target count differs for ${seriesId}: expected ${expected}, got ${actual}`);
  }
  const roster = [...physicalKeys].sort().map((key) => ({ seriesId: key.split("\u0000")[0] as string, physicalPointId: key.split("\u0000")[1] as string }));
  return sha256Bytes(canonicalJsonl(roster));
}

export function validatePhase8PlotAdjudicationReferences(
  adjudication: readonly Phase8PlotAdjudicationRow[],
  readsA: readonly Phase8PlotRead[],
  readsB: readonly Phase8PlotRead[],
): { readonly referencedA: ReadonlySet<string>; readonly referencedB: ReadonlySet<string> } {
  const mapA = new Map(readsA.map((row) => [readKey(row), row]));
  const mapB = new Map(readsB.map((row) => [readKey(row), row]));
  if (mapA.size !== readsA.length || mapB.size !== readsB.length) throw new Error("a raw read duplicates a read key");
  const referencedA = new Set<string>();
  const referencedB = new Set<string>();
  for (const row of adjudication) {
    let rawA: Phase8PlotRead | undefined;
    let rawB: Phase8PlotRead | undefined;
    for (const [reader, reference, source, seen] of [
      ["read A", row.readARef, mapA, referencedA],
      ["read B", row.readBRef, mapB, referencedB],
    ] as const) {
      if (reference === undefined) continue;
      if (reference.seriesId !== row.seriesId) throw new Error(`${reader} reference crosses series for ${row.seriesId}/${row.physicalPointId}`);
      const key = `${reference.seriesId}\u0000${reference.pointId}`;
      const raw = source.get(key);
      if (raw === undefined) throw new Error(`${reader} reference is absent from the pinned raw read: ${reference.seriesId}/${reference.pointId}`);
      if (raw.markerStatus !== "clear") throw new Error(`${reader} reference is not a clear raw reading: ${reference.seriesId}/${reference.pointId}`);
      if (seen.has(key)) throw new Error(`${reader} raw reading is referenced by more than one physical target: ${reference.seriesId}/${reference.pointId}`);
      seen.add(key);
      if (reader === "read A") rawA = raw;
      else rawB = raw;
    }
    const rawPixels = (raw: Phase8PlotRead): AcceptedPixels => ({
      pixelX: raw.pixelX,
      pixelY: raw.pixelY,
      ...(raw.orderSpanTopPixelY === undefined ? {} : {
        orderSpanTopPixelY: raw.orderSpanTopPixelY,
        orderSpanBottomPixelY: raw.orderSpanBottomPixelY as number,
      }),
    });
    let expected: AcceptedPixels;
    if (row.acceptedFrom === "read-a") {
      if (rawA === undefined) throw new Error(`read-a accepted target lacks read A reference: ${row.seriesId}/${row.physicalPointId}`);
      expected = rawPixels(rawA);
    } else if (row.acceptedFrom === "read-b") {
      if (rawB === undefined) throw new Error(`read-b accepted target lacks read B reference: ${row.seriesId}/${row.physicalPointId}`);
      expected = rawPixels(rawB);
    } else if (row.acceptedFrom === "reader-mean") {
      if (rawA === undefined || rawB === undefined) throw new Error(`reader-mean target lacks both raw references: ${row.seriesId}/${row.physicalPointId}`);
      const a = rawPixels(rawA);
      const b = rawPixels(rawB);
      if ((a.orderSpanTopPixelY === undefined) !== (b.orderSpanTopPixelY === undefined)) throw new Error(`reader-mean span presence differs: ${row.seriesId}/${row.physicalPointId}`);
      const differences = [Math.abs(a.pixelX - b.pixelX), Math.abs(a.pixelY - b.pixelY)];
      if (a.orderSpanTopPixelY !== undefined) {
        differences.push(
          Math.abs((a.orderSpanTopPixelY as number) - (b.orderSpanTopPixelY as number)),
          Math.abs((a.orderSpanBottomPixelY as number) - (b.orderSpanBottomPixelY as number)),
        );
      }
      if (Math.max(...differences) > row.thresholdPixels) throw new Error(`reader-mean source exceeds registered threshold: ${row.seriesId}/${row.physicalPointId}`);
      expected = {
        pixelX: (a.pixelX + b.pixelX) / 2,
        pixelY: (a.pixelY + b.pixelY) / 2,
        ...(a.orderSpanTopPixelY === undefined ? {} : {
          orderSpanTopPixelY: ((a.orderSpanTopPixelY as number) + (b.orderSpanTopPixelY as number)) / 2,
          orderSpanBottomPixelY: ((a.orderSpanBottomPixelY as number) + (b.orderSpanBottomPixelY as number)) / 2,
        }),
      };
    } else {
      if (row.thirdReview === undefined) throw new Error(`third-review target lacks review pixels: ${row.seriesId}/${row.physicalPointId}`);
      expected = row.thirdReview.pixels;
    }
    if (canonicalJson(row.accepted) !== canonicalJson(expected)) throw new Error(`accepted pixels do not equal acceptedFrom source: ${row.seriesId}/${row.physicalPointId}`);
    if (row.acceptedFrom !== "third-review" && row.thirdReview !== undefined) throw new Error(`non-third-review target carries third-review provenance: ${row.seriesId}/${row.physicalPointId}`);
  }
  return { referencedA, referencedB };
}

function axisCoordinate(value: number, transform: Phase8PlotAxisSpec["transform"]): number {
  if (transform === "linear") return value;
  if (!(value > 0)) throw new Error("log10 axis contains a nonpositive value");
  return Math.log10(value);
}

function axisMapping(axis: Phase8PlotAxisSpec, label: string): AxisMapping {
  const [a, b] = axis.fitAnchors;
  const coordinateA = axisCoordinate(a.value, axis.transform);
  const coordinateB = axisCoordinate(b.value, axis.transform);
  const slope = (coordinateB - coordinateA) / (b.pixel - a.pixel);
  if (!Number.isFinite(slope) || slope === 0) throw new Error(`${label} has an invalid fit`);
  const intercept = coordinateA - slope * a.pixel;
  const pixelToValue = (pixel: number): number => {
    const coordinate = slope * pixel + intercept;
    return axis.transform === "linear" ? coordinate : 10 ** coordinate;
  };
  const valueToPixel = (value: number): number => (axisCoordinate(value, axis.transform) - intercept) / slope;
  const maximumValidationResidualPixels = Math.max(...axis.validationAnchors.map((anchor) => Math.abs(valueToPixel(anchor.value) - anchor.pixel)));
  if (!Number.isFinite(maximumValidationResidualPixels) || maximumValidationResidualPixels > axis.validationTolerancePixels) {
    throw new Error(`${label} validation residual exceeds tolerance`);
  }
  return { pixelToValue, valueToPixel, maximumValidationResidualPixels };
}

function pin(bytes: Uint8Array, expected: PinnedInput, label: string): void {
  if (sha256Bytes(bytes) !== expected.sha256) throw new Error(`${label} hash differs`);
}

function pointRow(
  series: Phase8PlotRegistration["series"][number],
  plot: Phase8PlotRegistration["plots"][number],
  row: Phase8PlotAdjudicationRow,
  xMap: AxisMapping,
  yMap: AxisMapping,
): JsonObject {
  const accepted = row.accepted;
  if (accepted.pixelX < plot.bounds.left || accepted.pixelX > plot.bounds.right || accepted.pixelY < plot.bounds.top || accepted.pixelY > plot.bounds.bottom) {
    throw new Error(`accepted point leaves plot bounds: ${row.seriesId}/${row.physicalPointId}`);
  }
  if (row.thresholdPixels !== plot.maximumReaderDisagreementPixels) throw new Error(`adjudication threshold differs for ${row.seriesId}/${row.physicalPointId}`);
  const requiresSpan = series.verticalOrderSpan === "required";
  const hasSpan = accepted.orderSpanTopPixelY !== undefined && accepted.orderSpanBottomPixelY !== undefined;
  if (requiresSpan !== hasSpan) throw new Error(`accepted span presence differs for ${row.seriesId}/${row.physicalPointId}`);
  if (requiresSpan && !(plot.bounds.top <= (accepted.orderSpanTopPixelY as number) &&
      (accepted.orderSpanTopPixelY as number) < accepted.pixelY &&
      accepted.pixelY < (accepted.orderSpanBottomPixelY as number) &&
      (accepted.orderSpanBottomPixelY as number) <= plot.bounds.bottom)) {
    throw new Error(`accepted span does not bracket its marker: ${row.seriesId}/${row.physicalPointId}`);
  }
  const xPixels = plot.markerCenterHalfWidthPixels + plot.maximumReaderDisagreementPixels + xMap.maximumValidationResidualPixels;
  const yPixels = plot.markerCenterHalfWidthPixels + plot.maximumReaderDisagreementPixels + yMap.maximumValidationResidualPixels;
  const xBounds = [xMap.pixelToValue(accepted.pixelX - xPixels), xMap.pixelToValue(accepted.pixelX + xPixels)].sort((left, right) => left - right);
  const yBounds = [yMap.pixelToValue(accepted.pixelY - yPixels), yMap.pixelToValue(accepted.pixelY + yPixels)].sort((left, right) => left - right);
  const result: Record<string, StrictJson> = {
    schema: "phase8b-plot-point-v1",
    operator: PHASE8_PLOT_V3_OPERATOR,
    selectionId: series.selectionId,
    pointId: row.physicalPointId as string,
    adjudicationStatus: row.status,
    sourceLocator: plot.sourceLocator,
    phase9EvidenceRole: series.phase9EvidenceRole,
    sourceStatus: series.sourceStatus,
    expectedPointCount: series.expectedPointCount,
    preReadRefusal: series.preReadRefusal as unknown as StrictJson,
    x: {
      variable: plot.xAxis.variable,
      unit: plot.xAxis.unit,
      value: xMap.pixelToValue(accepted.pixelX),
      digitizationLower: xBounds[0] as number,
      digitizationUpper: xBounds[1] as number,
    },
    y: {
      variable: plot.yAxis.variable,
      unit: plot.yAxis.unit,
      value: yMap.pixelToValue(accepted.pixelY),
      digitizationLower: yBounds[0] as number,
      digitizationUpper: yBounds[1] as number,
    },
    adjudication: {
      acceptedFrom: row.acceptedFrom,
      status: row.status,
      reason: row.reason,
      acceptedPixels: accepted as unknown as StrictJson,
      thresholdPixels: row.thresholdPixels,
      readARef: (row.readARef ?? null) as unknown as StrictJson,
      readBRef: (row.readBRef ?? null) as unknown as StrictJson,
      thirdReview: (row.thirdReview ?? null) as unknown as StrictJson,
    },
    digitizationUncertainty: {
      method: "marker half-width plus full registered reader-disagreement threshold plus maximum unused-anchor calibration residual",
      rationale: "the full threshold is retained for every point so single-valid-reader and third-review adjudications are not assigned a narrower interval than ordinary paired reads",
      xPixels,
      yPixels,
    },
    sourceUncertainty: series.sourceUncertainty,
  };
  if (requiresSpan) {
    const top = accepted.orderSpanTopPixelY as number;
    const bottom = accepted.orderSpanBottomPixelY as number;
    const highBounds = [yMap.pixelToValue(top - yPixels), yMap.pixelToValue(top + yPixels)].sort((left, right) => left - right);
    const lowBounds = [yMap.pixelToValue(bottom - yPixels), yMap.pixelToValue(bottom + yPixels)].sort((left, right) => left - right);
    result.sourceOrderSpan = {
      semantics: "top is one-quarter and bottom is three-quarters in descending observation order; denominator unstated; not a confidence interval",
      low: { value: yMap.pixelToValue(bottom), digitizationLower: lowBounds[0] as number, digitizationUpper: lowBounds[1] as number },
      high: { value: yMap.pixelToValue(top), digitizationLower: highBounds[0] as number, digitizationUpper: highBounds[1] as number },
    };
  }
  return result;
}

export function derivePhase8PlotV3Bundle(inputs: Phase8PlotV3Inputs): Phase8PlotV3Bundle {
  const publication = parsePhase8PlotV3Registration(inputs.publicationRegistrationBytes);
  pin(inputs.baseOperatorBytes, publication.baseOperator, "base operator");
  pin(inputs.selectionBytes, publication.selection, "selection");
  pin(inputs.readABytes, publication.inputs.readA, "read A");
  pin(inputs.readBBytes, publication.inputs.readB, "read B");
  pin(inputs.adjudicationBytes, publication.inputs.adjudication, "adjudication");
  pin(inputs.adjudicationReportBytes, publication.inputs.adjudicationReport, "adjudication report");
  const base = parsePhase8PlotRegistration(inputs.baseOperatorBytes);
  if (base.series.length !== publication.selection.seriesCount || base.series.length !== publication.output.expectedSeriesCount ||
      publication.selection.path !== base.selection.path || publication.selection.sha256 !== base.selection.sha256) {
    throw new Error("v3 registration does not preserve the frozen v2 series/selection boundary");
  }
  const readsA = parseRawReads(inputs.readABytes, "read-a");
  const readsB = parseRawReads(inputs.readBBytes, "read-b");
  const adjudication = parsePhase8PlotAdjudication(inputs.adjudicationBytes);
  for (const [rows, expected, label] of [
    [readsA, publication.inputs.readA.rowCount, "read A"],
    [readsB, publication.inputs.readB.rowCount, "read B"],
    [adjudication, publication.inputs.adjudication.rowCount, "adjudication"],
  ] as const) if (rows.length !== expected) throw new Error(`${label} row count differs`);
  if (readsA.length !== publication.output.expectedPointCount || readsB.length !== publication.output.expectedPointCount || adjudication.length !== publication.output.expectedPointCount) {
    throw new Error("v3 input row totals do not equal the registered point total");
  }
  const mapA = new Map(readsA.map((row) => [readKey(row), row]));
  const mapB = new Map(readsB.map((row) => [readKey(row), row]));
  const resolvedReferences = validatePhase8PlotAdjudicationReferences(adjudication, readsA, readsB);
  const targetRosterSha256 = validatePhase8PlotAdjudicationRoster(base.series, adjudication);
  const report = object(parseCanonicalJson(inputs.adjudicationReportBytes, "adjudication report"), "adjudication report");
  const reportCounts = object(report.counts as StrictJson, "adjudication report.counts");
  if (report.state !== "complete" || finite(reportCounts.targetRows, "adjudication report targetRows") !== adjudication.length ||
      finite(reportCounts.uniquePhysicalTargets, "adjudication report uniquePhysicalTargets") !== adjudication.length ||
      finite(reportCounts.unresolved, "adjudication report unresolved") !== 0) {
    throw new Error("adjudication report does not state complete unique zero-unresolved target coverage");
  }
  const reportA = object(reportCounts.readA as StrictJson, "adjudication report.counts.readA");
  const reportB = object(reportCounts.readB as StrictJson, "adjudication report.counts.readB");
  const orphanRawClicks = object(report.orphanRawClicks as StrictJson, "adjudication report.orphanRawClicks");
  for (const [reader, summary, referenced, total] of [
    ["readA", reportA, resolvedReferences.referencedA, readsA.length],
    ["readB", reportB, resolvedReferences.referencedB, readsB.length],
  ] as const) {
    const orphanKeys = array(orphanRawClicks[reader], `adjudication report orphanRawClicks.${reader}`).map((value, index) => {
      const row = object(value, `${reader} orphan[${index}]`);
      const reason = string(row.terminalReason, `${reader} orphan[${index}].terminalReason`);
      if (reason.length === 0) throw new Error(`${reader} orphan lacks terminal reason`);
      return `${string(row.seriesId, `${reader} orphan seriesId`)}\u0000${string(row.pointId, `${reader} orphan pointId`)}`;
    });
    const expectedOrphans = [...(reader === "readA" ? mapA.keys() : mapB.keys())].filter((key) => !referenced.has(key)).sort();
    if (finite(summary.validReferenced, `${reader}.validReferenced`) !== referenced.size ||
        finite(summary.orphanRejected, `${reader}.orphanRejected`) !== expectedOrphans.length ||
        referenced.size + expectedOrphans.length !== total ||
        canonicalJson([...orphanKeys].sort()) !== canonicalJson(expectedOrphans)) {
      throw new Error(`adjudication report ${reader} raw-reference accounting differs`);
    }
  }
  const plotById = new Map(base.plots.map((plot) => [plot.plotId, plot]));
  const xMaps = new Map(base.plots.map((plot) => [plot.plotId, axisMapping(plot.xAxis, `${plot.plotId}.xAxis`)]));
  const yMaps = new Map(base.plots.map((plot) => [plot.plotId, axisMapping(plot.yAxis, `${plot.plotId}.yAxis`)]));
  const bySeries = new Map<string, JsonObject[]>(base.series.map((series) => [series.selectionId, []]));
  const seriesById = new Map(base.series.map((series) => [series.selectionId, series]));
  for (const adjudicated of adjudication) {
    const series = seriesById.get(adjudicated.seriesId) as Phase8PlotRegistration["series"][number];
    if (adjudicated.plotId !== series.plotId) throw new Error(`adjudication plot differs for ${adjudicated.seriesId}/${adjudicated.physicalPointId}`);
    const plot = plotById.get(series.plotId) as Phase8PlotRegistration["plots"][number];
    bySeries.get(series.selectionId)?.push(pointRow(series, plot, adjudicated, xMaps.get(plot.plotId) as AxisMapping, yMaps.get(plot.plotId) as AxisMapping));
  }
  const dataArtifacts = new Map<string, Uint8Array>();
  const records: StrictJson[] = [];
  let pointCount = 0;
  for (const series of [...base.series].sort((left, right) => left.selectionId.localeCompare(right.selectionId))) {
    const rows = bySeries.get(series.selectionId) as JsonObject[];
    rows.sort((left, right) => String(left.pointId).localeCompare(String(right.pointId)));
    const path = `rows/${series.selectionId}.jsonl`;
    const bytes = canonicalJsonl(rows);
    dataArtifacts.set(path, bytes);
    pointCount += rows.length;
    const plot = plotById.get(series.plotId) as Phase8PlotRegistration["plots"][number];
    records.push({
      schema: "phase8b-plot-series-record-v1",
      operator: PHASE8_PLOT_V3_OPERATOR,
      selectionId: series.selectionId,
      phase9EvidenceRole: series.phase9EvidenceRole,
      lineageId: series.lineageId,
      sourceStatus: series.sourceStatus,
      expectedPointCount: series.expectedPointCount,
      preReadRefusal: series.preReadRefusal as unknown as StrictJson,
      sourceLocator: plot.sourceLocator,
      plotId: series.plotId,
      marker: series.marker as unknown as StrictJson,
      conditions: series.conditions,
      sourceUncertainty: series.sourceUncertainty,
      exclusions: series.exclusions,
      rowArtifact: { path, bytes: bytes.byteLength, sha256: sha256Bytes(bytes), rowCount: rows.length },
    });
  }
  if (pointCount !== publication.output.expectedPointCount) throw new Error("published point total differs");
  const counts = {
    seriesCount: base.series.length,
    pointCount,
    preReadRefusedCandidateCount: base.series.reduce((sum, row) => sum + row.preReadRefusal.candidateCount, 0),
    directObservationSeriesCount: base.series.filter((row) => row.sourceStatus === "direct-observation").length,
    sourceDerivedRatioSeriesCount: base.series.filter((row) => row.sourceStatus === "source-derived-ratio").length,
    imposedForcingSeriesCount: base.series.filter((row) => row.sourceStatus === "imposed-forcing").length,
  };
  const reportBytes = canonicalJsonBytes({
    schema: "phase8b-plot-extraction-report-v1",
    operator: PHASE8_PLOT_V3_OPERATOR,
    scope: publication.scope,
    status: "candidate-awaiting-independent-verification",
    phase9EvidenceRole: "model-development",
    counts,
    selection: base.selection as unknown as StrictJson,
    physicalStorageRoot: publication.output.physicalStorageRoot,
    dataLogicalRoot: publication.output.dataLogicalRoot,
    targetRosterSha256,
    adjudication: {
      path: publication.inputs.adjudication.path,
      sha256: publication.inputs.adjudication.sha256,
      reportPath: publication.inputs.adjudicationReport.path,
      reportSha256: publication.inputs.adjudicationReport.sha256,
    },
    rightsBoundary: "source renders, raw reader coordinates, adjudication coordinates and normalized row bodies remain NAS-only; Git receives metadata, counts and hashes",
    renderProvenanceLimit: "the v2 registration binds source and render bytes; adjudication binds the inspected render hashes; this publication does not rerun pdfimages",
    uncertaintyMethod: "marker half-width plus the full registered reader-disagreement threshold plus unused-anchor calibration residual; this deliberately covers paired, single-valid-reader and third-review adjudications uniformly; source uncertainty remains separate",
  });
  const metadataWithoutIndex = new Map<string, Uint8Array>([
    ["operator.json", canonicalJsonBytes(parseCanonicalJson(inputs.publicationRegistrationBytes, "v3 publication registration"))],
    ["records.jsonl", canonicalJsonl(records)],
    ["report.json", reportBytes],
  ]);
  const artifacts = [...metadataWithoutIndex.entries(), ...dataArtifacts.entries()]
    .map(([path, bytes]) => ({ path, bytes: bytes.byteLength, sha256: sha256Bytes(bytes), storage: path.startsWith("rows/") ? "nas-only" : "git-metadata" }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const indexBytes = canonicalJsonBytes({
    schema: "phase8b-plot-artifact-index-v1",
    operator: PHASE8_PLOT_V3_OPERATOR,
    artifacts,
    counts,
    reportSha256: sha256Bytes(reportBytes),
  });
  return {
    registration: publication,
    metadataArtifacts: new Map([["artifact-index.json", indexBytes], ...metadataWithoutIndex]),
    dataArtifacts,
    counts,
    targetRosterSha256,
  };
}

function ensureDescendant(root: string, candidate: string, label: string): void {
  const displacement = relative(resolve(root), resolve(candidate));
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) || isAbsolute(displacement)) {
    throw new Error(`${label} must be a descendant of its root`);
  }
}

function writeAtomicDirectory(directory: string, artifacts: ReadonlyMap<string, Uint8Array>, root: string): void {
  if (existsSync(directory)) throw new Error(`refusing to overwrite existing publication directory: ${directory}`);
  ensureDescendant(root, directory, "publication directory");
  mkdirSync(dirname(directory), { recursive: true });
  const staging = join(dirname(directory), `.${basename(directory)}.staging-${randomUUID()}`);
  mkdirSync(staging, { recursive: false });
  try {
    for (const [path, bytes] of artifacts) {
      safeLogicalPath(path, "artifact path");
      const target = join(staging, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, bytes, { flag: "wx", mode: 0o600 });
    }
    renameSync(staging, directory);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

function readRegisteredNasFile(registration: Phase8PlotV3Registration, pinValue: PinnedInput): Uint8Array {
  const path = resolve(registration.output.physicalStorageRoot, pinValue.path);
  ensureDescendant(registration.output.physicalStorageRoot, path, pinValue.path);
  return new Uint8Array(readFileSync(path));
}

function main(argv: readonly string[]): void {
  if (argv[0] !== "produce" || argv.length !== 5 || argv[1] !== "--repository-root" || argv[3] !== "--metadata-root") {
    throw new Error("usage: phase8-plot-extraction-v3.ts produce --repository-root ROOT --metadata-root REPOSITORY_RELATIVE_PATH");
  }
  const repositoryRoot = resolve(argv[2] as string);
  const metadataLogicalRoot = safeLogicalPath(argv[4] as string, "metadata root");
  const registrationBytes = new Uint8Array(readFileSync(join(repositoryRoot, PHASE8_PLOT_V3_REGISTRATION_PATH)));
  const registration = parsePhase8PlotV3Registration(registrationBytes);
  const bundle = derivePhase8PlotV3Bundle({
    publicationRegistrationBytes: registrationBytes,
    baseOperatorBytes: new Uint8Array(readFileSync(join(repositoryRoot, registration.baseOperator.path))),
    selectionBytes: new Uint8Array(readFileSync(join(repositoryRoot, registration.selection.path))),
    readABytes: readRegisteredNasFile(registration, registration.inputs.readA),
    readBBytes: readRegisteredNasFile(registration, registration.inputs.readB),
    adjudicationBytes: readRegisteredNasFile(registration, registration.inputs.adjudication),
    adjudicationReportBytes: readRegisteredNasFile(registration, registration.inputs.adjudicationReport),
  });
  const dataDirectory = resolve(registration.output.physicalStorageRoot, registration.output.dataLogicalRoot);
  const metadataDirectory = resolve(repositoryRoot, metadataLogicalRoot);
  writeAtomicDirectory(dataDirectory, bundle.dataArtifacts, registration.output.physicalStorageRoot);
  try {
    writeAtomicDirectory(metadataDirectory, bundle.metadataArtifacts, repositoryRoot);
  } catch (error) {
    rmSync(dataDirectory, { recursive: true, force: true });
    throw error;
  }
  process.stdout.write(`${canonicalJson({ state: "published-plot-extraction-candidate", dataDirectory, metadataDirectory, counts: bundle.counts, targetRosterSha256: bundle.targetRosterSha256 })}\n`);
}

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
