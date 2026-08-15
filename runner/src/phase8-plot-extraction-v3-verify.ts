// Phase 8B S4 — independent verifier for the adjudicated v3 plot publication.
//
// This verifier reconstructs every normalized row from the pinned v2 axes and the pinned
// adjudication bytes. It does not call the v3 producer or accept a producer-supplied verdict.

import { execFileSync } from "node:child_process";
import {
  lstatSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
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

const OPERATOR = "phase8b-adjudicated-plot-digitization-v3";
const REGISTRATION_PATH = "research/phase8b-plot-publication-v3.json";
const DEFAULT_METADATA_LOGICAL_ROOT = "evidence/phase8b-plot-digitization-v3";
const METADATA_NAMES = ["artifact-index.json", "operator.json", "records.jsonl", "report.json"] as const;

type JsonObject = { readonly [key: string]: StrictJson };

interface Pin {
  readonly path: string;
  readonly sha256: string;
  readonly rowCount?: number;
}

interface PublicationRegistration {
  readonly scope: string;
  readonly baseOperator: Pin;
  readonly selection: Pin & { readonly seriesCount: number };
  readonly readA: Pin & { readonly rowCount: number };
  readonly readB: Pin & { readonly rowCount: number };
  readonly adjudication: Pin & { readonly rowCount: number };
  readonly adjudicationReport: Pin;
  readonly physicalStorageRoot: string;
  readonly dataLogicalRoot: string;
  readonly expectedSeriesCount: number;
  readonly expectedPointCount: number;
}

interface AdjudicationRow {
  readonly seriesId: string;
  readonly physicalPointId: string;
  readonly plotId: string;
  readonly thresholdPixels: number;
  readonly readARef?: { readonly seriesId: string; readonly pointId: string };
  readonly readBRef?: { readonly seriesId: string; readonly pointId: string };
  readonly accepted: JsonObject;
  readonly acceptedFrom: "read-a" | "read-b" | "reader-mean" | "third-review";
  readonly status: string;
  readonly reason: string;
  readonly thirdReview?: { readonly reviewerId: string; readonly method: string; readonly pixels: JsonObject };
}

interface AxisMap {
  readonly pixelToValue: (pixel: number) => number;
  readonly maximumValidationResidualPixels: number;
}

function object(value: StrictJson, label: string): JsonObject {
  if (value === null || Array.isArray(value) || typeof value !== "object") throw new Error(`${label} must be an object`);
  return value as JsonObject;
}

function string(value: StrictJson | undefined, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a string`);
  return value;
}

function number(value: StrictJson | undefined, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function positiveInteger(value: StrictJson | undefined, label: string): number {
  const result = number(value, label);
  if (!Number.isSafeInteger(result) || result <= 0) throw new Error(`${label} must be a positive integer`);
  return result;
}

function sha256(value: StrictJson | undefined, label: string): string {
  const result = string(value, label);
  if (!/^[0-9a-f]{64}$/.test(result)) throw new Error(`${label} is not a lowercase SHA-256`);
  return result;
}

function parsePin(value: StrictJson | undefined, label: string, rows: boolean): Pin {
  const pin = object(value as StrictJson, label);
  return {
    path: string(pin.path, `${label}.path`),
    sha256: sha256(pin.sha256, `${label}.sha256`),
    ...(rows ? { rowCount: positiveInteger(pin.rowCount, `${label}.rowCount`) } : {}),
  };
}

function parseRegistration(bytes: Uint8Array): PublicationRegistration {
  const root = object(parseCanonicalJson(bytes, "v3 repository registration"), "v3 repository registration");
  if (root.schema !== "phase8b-adjudicated-plot-publication-registration-v1" || root.operator !== OPERATOR ||
      (root.scope !== "registered-adjudicated-20260812" && root.scope !== "test-fixture")) {
    throw new Error("v3 registration identity differs");
  }
  const selection = object(root.selection as StrictJson, "selection");
  const inputs = object(root.inputs as StrictJson, "inputs");
  const output = object(root.output as StrictJson, "output");
  const policy = object(root.policy as StrictJson, "policy");
  if (policy.acceptedCoordinate !== "adjudication.accepted" || policy.pointIdentity !== "seriesId-plus-physicalPointId" ||
      policy.rosterRule !== "one-accepted-unique-physical-target-per-registered-point" ||
      policy.pixelUncertainty !== "marker-half-width-plus-full-reader-threshold-plus-unused-anchor-residual") {
    throw new Error("v3 registration policy differs");
  }
  const physicalStorageRoot = string(output.physicalStorageRoot, "output.physicalStorageRoot");
  if (!isAbsolute(physicalStorageRoot)) throw new Error("output.physicalStorageRoot must be absolute");
  return {
    scope: string(root.scope, "scope"),
    baseOperator: parsePin(root.baseOperator, "baseOperator", false),
    selection: { ...parsePin(selection as unknown as StrictJson, "selection", false), seriesCount: positiveInteger(selection.seriesCount, "selection.seriesCount") },
    readA: parsePin(inputs.readA, "inputs.readA", true) as Pin & { readonly rowCount: number },
    readB: parsePin(inputs.readB, "inputs.readB", true) as Pin & { readonly rowCount: number },
    adjudication: parsePin(inputs.adjudication, "inputs.adjudication", true) as Pin & { readonly rowCount: number },
    adjudicationReport: parsePin(inputs.adjudicationReport, "inputs.adjudicationReport", false),
    physicalStorageRoot,
    dataLogicalRoot: string(output.dataLogicalRoot, "output.dataLogicalRoot"),
    expectedSeriesCount: positiveInteger(output.expectedSeriesCount, "output.expectedSeriesCount"),
    expectedPointCount: positiveInteger(output.expectedPointCount, "output.expectedPointCount"),
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

function readRegular(path: string, label: string): Uint8Array {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} is not a regular non-symlink file`);
  return new Uint8Array(readFileSync(path));
}

function descendant(root: string, logicalPath: string, label: string): string {
  if (isAbsolute(logicalPath) || logicalPath.split(/[\\/]/u).includes("..")) throw new Error(`${label} is not a safe relative path`);
  const candidate = resolve(root, logicalPath);
  const displacement = relative(resolve(root), candidate);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) || isAbsolute(displacement)) throw new Error(`${label} leaves its root`);
  return candidate;
}

function pinnedNas(registration: PublicationRegistration, pin: Pin, label: string): Uint8Array {
  const bytes = readRegular(descendant(registration.physicalStorageRoot, pin.path, label), label);
  if (sha256Bytes(bytes) !== pin.sha256) throw new Error(`${label} hash differs`);
  return bytes;
}

function compareJson(actual: StrictJson, expected: StrictJson, label: string): void {
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(`${label} differs`);
}

function exactSet(actual: Iterable<string>, expected: Iterable<string>, label: string): void {
  const a = [...actual].sort();
  const b = [...expected].sort();
  if (a.length !== b.length || a.some((value, index) => value !== b[index])) throw new Error(`${label} differs`);
}

function axisCoordinate(value: number, transform: Phase8PlotAxisSpec["transform"]): number {
  if (transform === "linear") return value;
  if (!(value > 0)) throw new Error("log10 axis contains nonpositive value");
  return Math.log10(value);
}

function axisMap(axis: Phase8PlotAxisSpec, label: string): AxisMap {
  const [a, b] = axis.fitAnchors;
  const transformedA = axisCoordinate(a.value, axis.transform);
  const transformedB = axisCoordinate(b.value, axis.transform);
  const slope = (transformedB - transformedA) / (b.pixel - a.pixel);
  if (!Number.isFinite(slope) || slope === 0) throw new Error(`${label} fit differs`);
  const intercept = transformedA - slope * a.pixel;
  const pixelToValue = (pixel: number): number => {
    const transformed = slope * pixel + intercept;
    return axis.transform === "linear" ? transformed : 10 ** transformed;
  };
  const valueToPixel = (value: number): number => (axisCoordinate(value, axis.transform) - intercept) / slope;
  const maximumValidationResidualPixels = Math.max(...axis.validationAnchors.map((anchor) => Math.abs(valueToPixel(anchor.value) - anchor.pixel)));
  if (!Number.isFinite(maximumValidationResidualPixels) || maximumValidationResidualPixels > axis.validationTolerancePixels) throw new Error(`${label} validation differs`);
  return { pixelToValue, maximumValidationResidualPixels };
}

function parseReadRows(bytes: Uint8Array, readerId: "read-a" | "read-b"): readonly JsonObject[] {
  return parseJsonl(bytes, readerId).map((value, index) => {
    const row = object(value, `${readerId} line ${index + 1}`);
    if (row.schema !== "phase8b-plot-read-v1" || row.readerId !== readerId) throw new Error(`${readerId} row identity differs`);
    return row;
  });
}

function readKey(row: JsonObject): string {
  return `${string(row.seriesId, "read seriesId")}\u0000${string(row.pointId, "read pointId")}`;
}

function parseAdjudication(bytes: Uint8Array): readonly AdjudicationRow[] {
  return parseJsonl(bytes, "adjudication").map((value, index) => {
    const row = object(value, `adjudication line ${index + 1}`);
    if (row.schema !== "phase8b-plot-physical-target-map-v1") throw new Error("adjudication schema differs");
    const accepted = object(row.accepted as StrictJson, "adjudication.accepted");
    const acceptedFrom = string(row.acceptedFrom, "adjudication.acceptedFrom");
    if (acceptedFrom !== "read-a" && acceptedFrom !== "read-b" && acceptedFrom !== "reader-mean" && acceptedFrom !== "third-review") throw new Error("adjudication acceptedFrom differs");
    const physicalPointId = string(row.physicalPointId, "adjudication.physicalPointId");
    if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(physicalPointId)) throw new Error("adjudication physicalPointId is unsafe");
    const reference = (value: StrictJson | undefined, label: string): { readonly seriesId: string; readonly pointId: string } | undefined => {
      if (value === null || value === undefined) return undefined;
      const ref = object(value, label);
      return { seriesId: string(ref.seriesId, `${label}.seriesId`), pointId: string(ref.pointId, `${label}.pointId`) };
    };
    const thirdReview = row.thirdReview === null || row.thirdReview === undefined ? undefined : object(row.thirdReview, "adjudication.thirdReview");
    return {
      seriesId: string(row.seriesId, "adjudication.seriesId"),
      physicalPointId,
      plotId: string(row.plotId, "adjudication.plotId"),
      thresholdPixels: number(row.thresholdPixels, "adjudication.thresholdPixels"),
      ...(reference(row.readARef, "adjudication.readARef") === undefined ? {} : { readARef: reference(row.readARef, "adjudication.readARef") }),
      ...(reference(row.readBRef, "adjudication.readBRef") === undefined ? {} : { readBRef: reference(row.readBRef, "adjudication.readBRef") }),
      accepted,
      acceptedFrom,
      status: string(row.status, "adjudication.status"),
      reason: string(row.reason, "adjudication.reason"),
      ...(thirdReview === undefined ? {} : { thirdReview: {
        reviewerId: string(thirdReview.reviewerId, "thirdReview.reviewerId"),
        method: string(thirdReview.method, "thirdReview.method"),
        pixels: object(thirdReview.pixels as StrictJson, "thirdReview.pixels"),
      } }),
    };
  });
}

function expectedRow(
  series: Phase8PlotRegistration["series"][number],
  plot: Phase8PlotRegistration["plots"][number],
  adjudication: AdjudicationRow,
  xMap: AxisMap,
  yMap: AxisMap,
): JsonObject {
  const accepted = adjudication.accepted;
  const pixelX = number(accepted.pixelX, "accepted.pixelX");
  const pixelY = number(accepted.pixelY, "accepted.pixelY");
  if (pixelX < plot.bounds.left || pixelX > plot.bounds.right || pixelY < plot.bounds.top || pixelY > plot.bounds.bottom) throw new Error("accepted marker leaves plot");
  if (adjudication.thresholdPixels !== plot.maximumReaderDisagreementPixels) throw new Error("adjudication threshold differs");
  const hasTop = accepted.orderSpanTopPixelY !== undefined;
  const hasBottom = accepted.orderSpanBottomPixelY !== undefined;
  if (hasTop !== hasBottom || (series.verticalOrderSpan === "required") !== hasTop) throw new Error("accepted span presence differs");
  const xPixels = plot.markerCenterHalfWidthPixels + plot.maximumReaderDisagreementPixels + xMap.maximumValidationResidualPixels;
  const yPixels = plot.markerCenterHalfWidthPixels + plot.maximumReaderDisagreementPixels + yMap.maximumValidationResidualPixels;
  const xBounds = [xMap.pixelToValue(pixelX - xPixels), xMap.pixelToValue(pixelX + xPixels)].sort((left, right) => left - right);
  const yBounds = [yMap.pixelToValue(pixelY - yPixels), yMap.pixelToValue(pixelY + yPixels)].sort((left, right) => left - right);
  const result: Record<string, StrictJson> = {
    schema: "phase8b-plot-point-v1",
    operator: OPERATOR,
    selectionId: series.selectionId,
    pointId: adjudication.physicalPointId,
    adjudicationStatus: adjudication.status,
    sourceLocator: plot.sourceLocator,
    phase9EvidenceRole: series.phase9EvidenceRole,
    sourceStatus: series.sourceStatus,
    expectedPointCount: series.expectedPointCount,
    preReadRefusal: series.preReadRefusal as unknown as StrictJson,
    x: { variable: plot.xAxis.variable, unit: plot.xAxis.unit, value: xMap.pixelToValue(pixelX), digitizationLower: xBounds[0] as number, digitizationUpper: xBounds[1] as number },
    y: { variable: plot.yAxis.variable, unit: plot.yAxis.unit, value: yMap.pixelToValue(pixelY), digitizationLower: yBounds[0] as number, digitizationUpper: yBounds[1] as number },
    adjudication: {
      acceptedFrom: adjudication.acceptedFrom,
      status: adjudication.status,
      reason: adjudication.reason,
      acceptedPixels: accepted,
      thresholdPixels: adjudication.thresholdPixels,
      readARef: (adjudication.readARef ?? null) as unknown as StrictJson,
      readBRef: (adjudication.readBRef ?? null) as unknown as StrictJson,
      thirdReview: (adjudication.thirdReview ?? null) as unknown as StrictJson,
    },
    digitizationUncertainty: {
      method: "marker half-width plus full registered reader-disagreement threshold plus maximum unused-anchor calibration residual",
      rationale: "the full threshold is retained for every point so single-valid-reader and third-review adjudications are not assigned a narrower interval than ordinary paired reads",
      xPixels,
      yPixels,
    },
    sourceUncertainty: series.sourceUncertainty,
  };
  if (series.verticalOrderSpan === "required") {
    const top = number(accepted.orderSpanTopPixelY, "accepted.orderSpanTopPixelY");
    const bottom = number(accepted.orderSpanBottomPixelY, "accepted.orderSpanBottomPixelY");
    if (!(plot.bounds.top <= top && top < pixelY && pixelY < bottom && bottom <= plot.bounds.bottom)) throw new Error("accepted span does not bracket marker");
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

function pngDimensions(bytes: Uint8Array, label: string): { readonly width: number; readonly height: number } {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || signature.some((value, index) => bytes[index] !== value)) throw new Error(`${label} is not PNG`);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function verifySourceAndRenderPins(base: Phase8PlotRegistration): void {
  const sourceRoot = descendant(base.roots.physicalStorageRoot, base.roots.sourcePdfLogicalRoot, "source root");
  const renderRoot = descendant(base.roots.physicalStorageRoot, base.roots.renderLogicalRoot, "render root");
  for (const source of base.sourcePdfs) {
    const path = descendant(sourceRoot, source.fileName, source.fileName);
    const bytes = readRegular(path, source.fileName);
    if (bytes.byteLength !== source.byteLength || sha256Bytes(bytes) !== source.sha256) throw new Error(`source PDF pin differs: ${source.fileName}`);
    const output = execFileSync("pdfinfo", [path], { encoding: "utf8", timeout: 30_000, maxBuffer: 1024 * 1024 });
    const match = /^Pages:\s+(\d+)\s*$/mu.exec(output);
    if (match === null || Number(match[1]) !== source.pageCount) throw new Error(`source PDF page count differs: ${source.fileName}`);
  }
  for (const render of base.renders) {
    const bytes = readRegular(descendant(renderRoot, render.fileName, render.fileName), render.fileName);
    if (bytes.byteLength !== render.byteLength || sha256Bytes(bytes) !== render.sha256) throw new Error(`render pin differs: ${render.fileName}`);
    const dimensions = pngDimensions(bytes, render.fileName);
    if (dimensions.width !== render.widthPixels || dimensions.height !== render.heightPixels) throw new Error(`render dimensions differ: ${render.fileName}`);
  }
}

export function verifyPhase8PlotV3Publication(repositoryRootInput: string, metadataLogicalRoot: string): StrictJson {
  const repositoryRoot = resolve(repositoryRootInput);
  const registrationBytes = readRegular(descendant(repositoryRoot, REGISTRATION_PATH, "v3 registration"), "v3 registration");
  const publication = parseRegistration(registrationBytes);
  const metadataRoot = descendant(repositoryRoot, metadataLogicalRoot, "metadata root");
  const metadataEntries = readdirSync(metadataRoot, { withFileTypes: true });
  exactSet(metadataEntries.map((entry) => entry.name), METADATA_NAMES, "metadata filenames");
  const metadata = new Map(METADATA_NAMES.map((name) => [name, readRegular(join(metadataRoot, name), name)]));
  const operatorBytes = metadata.get("operator.json") as Uint8Array;
  if (sha256Bytes(operatorBytes) !== sha256Bytes(registrationBytes)) throw new Error("published/repository v3 registration bytes differ");
  const baseBytes = readRegular(descendant(repositoryRoot, publication.baseOperator.path, "base operator"), "base operator");
  if (sha256Bytes(baseBytes) !== publication.baseOperator.sha256) throw new Error("base operator hash differs");
  const base = parsePhase8PlotRegistration(baseBytes);
  verifySourceAndRenderPins(base);
  const selectionBytes = readRegular(descendant(repositoryRoot, publication.selection.path, "selection"), "selection");
  if (sha256Bytes(selectionBytes) !== publication.selection.sha256 || publication.selection.path !== base.selection.path || publication.selection.sha256 !== base.selection.sha256) throw new Error("selection binding differs");
  const readABytes = pinnedNas(publication, publication.readA, "read A");
  const readBBytes = pinnedNas(publication, publication.readB, "read B");
  const adjudicationBytes = pinnedNas(publication, publication.adjudication, "adjudication");
  const adjudicationReportBytes = pinnedNas(publication, publication.adjudicationReport, "adjudication report");
  const readsA = parseReadRows(readABytes, "read-a");
  const readsB = parseReadRows(readBBytes, "read-b");
  const adjudication = parseAdjudication(adjudicationBytes);
  if (readsA.length !== publication.readA.rowCount || readsB.length !== publication.readB.rowCount || adjudication.length !== publication.adjudication.rowCount ||
      readsA.length !== publication.expectedPointCount || readsB.length !== publication.expectedPointCount || adjudication.length !== publication.expectedPointCount) {
    throw new Error("registered input row totals differ");
  }
  const mapA = new Map(readsA.map((row) => [readKey(row), row]));
  const mapB = new Map(readsB.map((row) => [readKey(row), row]));
  if (mapA.size !== readsA.length || mapB.size !== readsB.length) throw new Error("input read-key duplicates");
  exactSet(mapA.keys(), mapB.keys(), "raw reader rosters");
  const physicalKeys = new Set<string>();
  const referencedA = new Set<string>();
  const referencedB = new Set<string>();
  const countsBySeries = new Map(base.series.map((series) => [series.selectionId, 0]));
  for (const row of adjudication) {
    const physicalKey = `${row.seriesId}\u0000${row.physicalPointId}`;
    if (physicalKeys.has(physicalKey)) throw new Error(`duplicate physical target ${physicalKey}`);
    physicalKeys.add(physicalKey);
    if (!countsBySeries.has(row.seriesId)) throw new Error(`unregistered adjudication series ${row.seriesId}`);
    countsBySeries.set(row.seriesId, (countsBySeries.get(row.seriesId) as number) + 1);
    let rawA: JsonObject | undefined;
    let rawB: JsonObject | undefined;
    for (const [label, reference, source, seen] of [
      ["read A", row.readARef, mapA, referencedA],
      ["read B", row.readBRef, mapB, referencedB],
    ] as const) {
      if (reference === undefined) continue;
      if (reference.seriesId !== row.seriesId) throw new Error(`${label} reference crosses series`);
      const key = `${reference.seriesId}\u0000${reference.pointId}`;
      const raw = source.get(key);
      if (raw === undefined || raw.markerStatus !== "clear") throw new Error(`${label} reference is not a pinned clear reading: ${key}`);
      if (seen.has(key)) throw new Error(`${label} raw reading is reused: ${key}`);
      seen.add(key);
      if (label === "read A") rawA = raw;
      else rawB = raw;
    }
    const rawPixels = (raw: JsonObject): JsonObject => ({
      pixelX: number(raw.pixelX, "raw pixelX"),
      pixelY: number(raw.pixelY, "raw pixelY"),
      ...(raw.orderSpanTopPixelY === undefined ? {} : {
        orderSpanTopPixelY: number(raw.orderSpanTopPixelY, "raw span top"),
        orderSpanBottomPixelY: number(raw.orderSpanBottomPixelY, "raw span bottom"),
      }),
    });
    let expectedAccepted: JsonObject;
    if (row.acceptedFrom === "read-a") {
      if (rawA === undefined) throw new Error(`read-a accepted target lacks raw A ${physicalKey}`);
      expectedAccepted = rawPixels(rawA);
    } else if (row.acceptedFrom === "read-b") {
      if (rawB === undefined) throw new Error(`read-b accepted target lacks raw B ${physicalKey}`);
      expectedAccepted = rawPixels(rawB);
    } else if (row.acceptedFrom === "reader-mean") {
      if (rawA === undefined || rawB === undefined) throw new Error(`reader-mean target lacks both raw reads ${physicalKey}`);
      const a = rawPixels(rawA);
      const b = rawPixels(rawB);
      if ((a.orderSpanTopPixelY === undefined) !== (b.orderSpanTopPixelY === undefined)) throw new Error(`reader-mean span presence differs ${physicalKey}`);
      const differences = [
        Math.abs(number(a.pixelX, "A x") - number(b.pixelX, "B x")),
        Math.abs(number(a.pixelY, "A y") - number(b.pixelY, "B y")),
      ];
      if (a.orderSpanTopPixelY !== undefined) {
        differences.push(
          Math.abs(number(a.orderSpanTopPixelY, "A top") - number(b.orderSpanTopPixelY, "B top")),
          Math.abs(number(a.orderSpanBottomPixelY, "A bottom") - number(b.orderSpanBottomPixelY, "B bottom")),
        );
      }
      if (Math.max(...differences) > row.thresholdPixels) throw new Error(`reader-mean source exceeds registered threshold ${physicalKey}`);
      expectedAccepted = {
        pixelX: (number(a.pixelX, "A x") + number(b.pixelX, "B x")) / 2,
        pixelY: (number(a.pixelY, "A y") + number(b.pixelY, "B y")) / 2,
        ...(a.orderSpanTopPixelY === undefined ? {} : {
          orderSpanTopPixelY: (number(a.orderSpanTopPixelY, "A top") + number(b.orderSpanTopPixelY, "B top")) / 2,
          orderSpanBottomPixelY: (number(a.orderSpanBottomPixelY, "A bottom") + number(b.orderSpanBottomPixelY, "B bottom")) / 2,
        }),
      };
    } else {
      if (row.thirdReview === undefined) throw new Error(`third-review target lacks review pixels ${physicalKey}`);
      expectedAccepted = row.thirdReview.pixels;
    }
    compareJson(row.accepted, expectedAccepted, `acceptedFrom coordinate source ${physicalKey}`);
    if (row.acceptedFrom !== "third-review" && row.thirdReview !== undefined) throw new Error(`non-third-review target carries review pixels ${physicalKey}`);
  }
  for (const series of base.series) if (countsBySeries.get(series.selectionId) !== series.expectedPointCount) throw new Error(`physical target count differs for ${series.selectionId}`);
  if (base.series.length !== publication.expectedSeriesCount || base.series.length !== publication.selection.seriesCount || physicalKeys.size !== publication.expectedPointCount) throw new Error("registered series/physical target totals differ");
  const roster = [...physicalKeys].sort().map((key) => ({ seriesId: key.split("\u0000")[0] as string, physicalPointId: key.split("\u0000")[1] as string }));
  const targetRosterSha256 = sha256Bytes(canonicalJsonl(roster));
  const adjudicationReport = object(parseCanonicalJson(adjudicationReportBytes, "adjudication report"), "adjudication report");
  const adjudicationCounts = object(adjudicationReport.counts as StrictJson, "adjudication report counts");
  if (adjudicationReport.state !== "complete" || number(adjudicationCounts.targetRows, "adjudication targetRows") !== adjudication.length ||
      number(adjudicationCounts.uniquePhysicalTargets, "adjudication uniquePhysicalTargets") !== physicalKeys.size ||
      number(adjudicationCounts.unresolved, "adjudication unresolved") !== 0) throw new Error("adjudication report closure differs");
  const orphanRawClicks = object(adjudicationReport.orphanRawClicks as StrictJson, "adjudication report orphanRawClicks");
  for (const [reader, summaryValue, source, referenced] of [
    ["readA", adjudicationCounts.readA, mapA, referencedA],
    ["readB", adjudicationCounts.readB, mapB, referencedB],
  ] as const) {
    const summary = object(summaryValue as StrictJson, `${reader} summary`);
    const orphanValues = orphanRawClicks[reader];
    if (!Array.isArray(orphanValues)) throw new Error(`${reader} orphan list differs`);
    const reportedOrphans = orphanValues.map((value) => {
      const orphan = object(value, `${reader} orphan`);
      string(orphan.terminalReason, `${reader} orphan terminalReason`);
      return `${string(orphan.seriesId, `${reader} orphan seriesId`)}\u0000${string(orphan.pointId, `${reader} orphan pointId`)}`;
    }).sort();
    const expectedOrphans = [...source.keys()].filter((key) => !referenced.has(key)).sort();
    if (number(summary.validReferenced, `${reader}.validReferenced`) !== referenced.size ||
        number(summary.orphanRejected, `${reader}.orphanRejected`) !== expectedOrphans.length ||
        canonicalJson(reportedOrphans) !== canonicalJson(expectedOrphans)) throw new Error(`${reader} orphan accounting differs`);
  }
  const plotById = new Map(base.plots.map((plot) => [plot.plotId, plot]));
  const seriesById = new Map(base.series.map((series) => [series.selectionId, series]));
  const xMaps = new Map(base.plots.map((plot) => [plot.plotId, axisMap(plot.xAxis, `${plot.plotId}.xAxis`)]));
  const yMaps = new Map(base.plots.map((plot) => [plot.plotId, axisMap(plot.yAxis, `${plot.plotId}.yAxis`)]));
  const expectedBySeries = new Map<string, JsonObject[]>(base.series.map((series) => [series.selectionId, []]));
  for (const row of adjudication) {
    const series = seriesById.get(row.seriesId) as Phase8PlotRegistration["series"][number];
    if (row.plotId !== series.plotId) throw new Error("adjudication plot identity differs");
    const plot = plotById.get(series.plotId) as Phase8PlotRegistration["plots"][number];
    expectedBySeries.get(series.selectionId)?.push(expectedRow(series, plot, row, xMaps.get(plot.plotId) as AxisMap, yMaps.get(plot.plotId) as AxisMap));
  }
  const dataRoot = descendant(publication.physicalStorageRoot, publication.dataLogicalRoot, "data root");
  const dataEntries = readdirSync(dataRoot, { withFileTypes: true });
  exactSet(dataEntries.map((entry) => entry.name), ["rows"], "data root entries");
  const rowRoot = join(dataRoot, "rows");
  const rowEntries = readdirSync(rowRoot, { withFileTypes: true });
  exactSet(rowEntries.map((entry) => entry.name), base.series.map((series) => `${series.selectionId}.jsonl`), "row filenames");
  const records: StrictJson[] = [];
  const rowDescriptors: { readonly path: string; readonly bytes: number; readonly sha256: string; readonly storage: string }[] = [];
  let pointCount = 0;
  for (const series of [...base.series].sort((left, right) => left.selectionId.localeCompare(right.selectionId))) {
    const expectedRows = expectedBySeries.get(series.selectionId) as JsonObject[];
    expectedRows.sort((left, right) => String(left.pointId).localeCompare(String(right.pointId)));
    const path = `rows/${series.selectionId}.jsonl`;
    const bytes = readRegular(join(dataRoot, path), path);
    const actualRows = parseJsonl(bytes, path);
    compareJson(actualRows as unknown as StrictJson, expectedRows as unknown as StrictJson, `${path} reconstructed rows`);
    if (sha256Bytes(bytes) !== sha256Bytes(canonicalJsonl(expectedRows))) throw new Error(`${path} canonical bytes differ`);
    pointCount += expectedRows.length;
    const plot = plotById.get(series.plotId) as Phase8PlotRegistration["plots"][number];
    records.push({
      schema: "phase8b-plot-series-record-v1",
      operator: OPERATOR,
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
      rowArtifact: { path, bytes: bytes.byteLength, sha256: sha256Bytes(bytes), rowCount: expectedRows.length },
    });
    rowDescriptors.push({ path, bytes: bytes.byteLength, sha256: sha256Bytes(bytes), storage: "nas-only" });
  }
  const counts = {
    seriesCount: base.series.length,
    pointCount,
    preReadRefusedCandidateCount: base.series.reduce((sum, row) => sum + row.preReadRefusal.candidateCount, 0),
    directObservationSeriesCount: base.series.filter((row) => row.sourceStatus === "direct-observation").length,
    sourceDerivedRatioSeriesCount: base.series.filter((row) => row.sourceStatus === "source-derived-ratio").length,
    imposedForcingSeriesCount: base.series.filter((row) => row.sourceStatus === "imposed-forcing").length,
  };
  const recordsBytes = metadata.get("records.jsonl") as Uint8Array;
  compareJson(parseJsonl(recordsBytes, "records.jsonl") as unknown as StrictJson, records as unknown as StrictJson, "records.jsonl");
  if (sha256Bytes(recordsBytes) !== sha256Bytes(canonicalJsonl(records))) throw new Error("records canonical bytes differ");
  const expectedReport = {
    schema: "phase8b-plot-extraction-report-v1",
    operator: OPERATOR,
    scope: publication.scope,
    status: "candidate-awaiting-independent-verification",
    phase9EvidenceRole: "model-development",
    counts,
    selection: base.selection as unknown as StrictJson,
    physicalStorageRoot: publication.physicalStorageRoot,
    dataLogicalRoot: publication.dataLogicalRoot,
    targetRosterSha256,
    adjudication: { path: publication.adjudication.path, sha256: publication.adjudication.sha256, reportPath: publication.adjudicationReport.path, reportSha256: publication.adjudicationReport.sha256 },
    rightsBoundary: "source renders, raw reader coordinates, adjudication coordinates and normalized row bodies remain NAS-only; Git receives metadata, counts and hashes",
    renderProvenanceLimit: "the v2 registration binds source and render bytes; adjudication binds the inspected render hashes; this publication does not rerun pdfimages",
    uncertaintyMethod: "marker half-width plus the full registered reader-disagreement threshold plus unused-anchor calibration residual; this deliberately covers paired, single-valid-reader and third-review adjudications uniformly; source uncertainty remains separate",
  };
  const reportBytes = metadata.get("report.json") as Uint8Array;
  compareJson(parseCanonicalJson(reportBytes, "report.json"), expectedReport, "report.json");
  const metadataDescriptors = [
    ["operator.json", operatorBytes],
    ["records.jsonl", recordsBytes],
    ["report.json", reportBytes],
  ].map(([path, bytes]) => ({ path: path as string, bytes: (bytes as Uint8Array).byteLength, sha256: sha256Bytes(bytes as Uint8Array), storage: "git-metadata" }));
  const expectedIndex = {
    schema: "phase8b-plot-artifact-index-v1",
    operator: OPERATOR,
    artifacts: [...metadataDescriptors, ...rowDescriptors].sort((left, right) => String(left.path).localeCompare(String(right.path))),
    counts,
    reportSha256: sha256Bytes(reportBytes),
  };
  compareJson(parseCanonicalJson(metadata.get("artifact-index.json") as Uint8Array, "artifact-index.json"), expectedIndex, "artifact-index.json");
  return {
    ok: true,
    counts,
    targetRosterSha256,
    sourcePdfCount: base.sourcePdfs.length,
    renderCount: base.renders.length,
    adjudicationRows: adjudication.length,
  };
}

function main(argv: readonly string[]): void {
  if (argv[0] !== "verify") {
    throw new Error("usage: phase8-plot-extraction-v3-verify.ts verify --repository-root ROOT --source-root SOURCES --render-root RENDERS --bundle DATA --metadata-root REPOSITORY_RELATIVE_PATH");
  }
  const required = new Set(["--repository-root", "--source-root", "--render-root", "--bundle"]);
  const allowed = new Set([...required, "--metadata-root"]);
  const values = new Map<string, string>();
  for (let index = 1; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === undefined || value === undefined || !allowed.has(key) || values.has(key)) throw new Error("invalid v3 verifier arguments");
    values.set(key, value);
  }
  if ([...required].some((key) => !values.has(key))) throw new Error("missing v3 verifier argument");
  const repositoryRoot = resolve(values.get("--repository-root") as string);
  const registration = parseRegistration(readRegular(descendant(repositoryRoot, REGISTRATION_PATH, "v3 registration"), "v3 registration"));
  const base = parsePhase8PlotRegistration(readRegular(descendant(repositoryRoot, registration.baseOperator.path, "base operator"), "base operator"));
  const expectedSourceRoot = descendant(base.roots.physicalStorageRoot, base.roots.sourcePdfLogicalRoot, "expected source root");
  const expectedRenderRoot = descendant(base.roots.physicalStorageRoot, base.roots.renderLogicalRoot, "expected render root");
  const expectedBundle = descendant(registration.physicalStorageRoot, registration.dataLogicalRoot, "expected plot bundle");
  if (resolve(values.get("--source-root") as string) !== resolve(expectedSourceRoot) ||
      resolve(values.get("--render-root") as string) !== resolve(expectedRenderRoot) ||
      resolve(values.get("--bundle") as string) !== resolve(expectedBundle)) {
    throw new Error("supplied v3 source, render, or bundle path differs from registration");
  }
  process.stdout.write(`${canonicalJson(verifyPhase8PlotV3Publication(
    repositoryRoot,
    values.get("--metadata-root") ?? DEFAULT_METADATA_LOGICAL_ROOT,
  ))}\n`);
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
