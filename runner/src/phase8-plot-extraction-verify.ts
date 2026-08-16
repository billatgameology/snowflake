// Phase 8B S4 — independent verifier for two-reader plot digitization.
//
// This module deliberately does not import the producer. It reparses the registered operator,
// frozen selection, source/render bytes, both raw-reader artifacts, normalized rows and Git
// metadata, then independently reconstructs every calibration and output value.

import {
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
  type StrictJson,
} from "./gate4-evidence.ts";
import { currentResearchSharePath } from "./phase9-nas.ts";

const OPERATOR = "phase8b-two-reader-plot-digitization-v2";
const OPERATOR_PATH = "research/phase8b-plot-operator-v2.json";
const SELECTION_PATH = "evidence/phase8b-benchmark-selection-v1/selection.jsonl";
const SELECTION_SHA256 = "d4d883b321949155e4ca462b594c6a443acd233719bc8f8c5ffc17e694516537";
const METADATA_NAMES = ["artifact-index.json", "operator.json", "records.jsonl", "report.json"] as const;
const IMPLEMENTATION_PATHS = [
  "runner/src/gate4-evidence.ts",
  "runner/src/phase8-plot-extraction.ts",
  "runner/src/phase8-plot-extraction-verify.ts",
  "runner/test/phase8-plot-extraction.test.ts",
  OPERATOR_PATH,
] as const;

type JsonObject = { readonly [key: string]: StrictJson };
type Scope = "registered-successor-20260812" | "test-fixture";
type AxisTransform = "linear" | "log10";
type SourceStatus = "direct-observation" | "source-derived-ratio" | "imposed-forcing";
type ReaderId = "read-a" | "read-b";

interface Anchor {
  readonly pixel: number;
  readonly value: number;
}

interface AxisSpec {
  readonly variable: string;
  readonly unit: string;
  readonly transform: AxisTransform;
  readonly fitAnchors: readonly [Anchor, Anchor];
  readonly validationAnchors: readonly Anchor[];
  readonly validationTolerancePixels: number;
}

interface PdfSpec {
  readonly sourceId: string;
  readonly fileName: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly pageCount: number;
}

interface RenderSpec {
  readonly renderId: string;
  readonly fileName: string;
  readonly sourceId: string;
  readonly pdfPage: number;
  readonly pdfImageIndexOnPage: number;
  readonly byteLength: number;
  readonly sha256: string;
  readonly widthPixels: number;
  readonly heightPixels: number;
  readonly extractionCommand: string;
}

interface PlotSpec {
  readonly plotId: string;
  readonly renderId: string;
  readonly sourceLocator: string;
  readonly bounds: {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
  };
  readonly xAxis: AxisSpec;
  readonly yAxis: AxisSpec;
  readonly markerCenterHalfWidthPixels: number;
  readonly maximumReaderDisagreementPixels: number;
}

interface SeriesSpec {
  readonly selectionId: string;
  readonly expectedPointCount: number;
  readonly preReadRefusal: {
    readonly candidateCount: number;
    readonly reason: string;
  };
  readonly plotId: string;
  readonly marker: JsonObject;
  readonly sourceStatus: SourceStatus;
  readonly verticalOrderSpan: "required" | "absent";
  readonly phase9EvidenceRole: "model-development";
  readonly lineageId: string;
  readonly conditions: JsonObject;
  readonly sourceUncertainty: JsonObject;
  readonly exclusions: readonly string[];
}

interface Registration {
  readonly schema: "phase8b-plot-operator-registration-v1";
  readonly operator: typeof OPERATOR;
  readonly scope: Scope;
  readonly selection: {
    readonly path: string;
    readonly sha256: string;
    readonly p1SeriesCount: number;
  };
  readonly roots: {
    readonly physicalStorageRoot: string;
    readonly sourcePdfLogicalRoot: string;
    readonly renderLogicalRoot: string;
    readonly dataLogicalRoot: string;
  };
  readonly renderer: {
    readonly name: "pdfimages" | "fixture";
    readonly version: string;
    readonly outputMode: "png";
  };
  readonly readingProtocol: {
    readonly readAView: string;
    readonly readBView: string;
    readonly coordinateFrame: "source-render-pixels";
    readonly pointOrdering: "left-to-right-then-top-to-bottom";
    readonly independenceBoundary: string;
  };
  readonly sourcePdfs: readonly PdfSpec[];
  readonly renders: readonly RenderSpec[];
  readonly plots: readonly PlotSpec[];
  readonly series: readonly SeriesSpec[];
}

interface SelectionSeries {
  readonly id: string;
  readonly sourceId: string;
  readonly locator: string;
  readonly lineageId: string;
}

interface PlotRead {
  readonly schema: "phase8b-plot-read-v1";
  readonly readerId: ReaderId;
  readonly seriesId: string;
  readonly pointId: string;
  readonly pixelX: number;
  readonly pixelY: number;
  readonly markerStatus: "clear" | "ambiguous" | "clipped";
  readonly orderSpanTopPixelY?: number;
  readonly orderSpanBottomPixelY?: number;
}

interface AxisMap {
  readonly pixelToValue: (pixel: number) => number;
  readonly maximumValidationResidualPixels: number;
  readonly slope: number;
}

export interface Phase8PlotPublishedBytes {
  readonly metadataArtifacts: ReadonlyMap<string, Uint8Array>;
  readonly dataArtifacts: ReadonlyMap<string, Uint8Array>;
}

export interface Phase8PlotVerifyInputs {
  readonly registrationBytes: Uint8Array;
  readonly selectionBytes: Uint8Array;
  readonly sourcePdfs: ReadonlyMap<string, Uint8Array>;
  /** Independently parsed page counts. Required for registered evidence; optional for fixtures. */
  readonly sourcePdfPageCounts?: ReadonlyMap<string, number>;
  readonly renders: ReadonlyMap<string, Uint8Array>;
  readonly implementation: ReadonlyMap<string, Uint8Array>;
  readonly published: Phase8PlotPublishedBytes;
}

export interface Phase8PlotVerification {
  readonly ok: true;
  readonly counts: {
    readonly seriesCount: number;
    readonly pointCount: number;
    readonly directObservationSeriesCount: number;
    readonly sourceDerivedRatioSeriesCount: number;
    readonly imposedForcingSeriesCount: number;
  };
  readonly sourcePdfCount: number;
  readonly renderCount: number;
  readonly readRowsPerReader: number;
  readonly rowArtifactCount: number;
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${label} must be an object`);
  }
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

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function positive(value: unknown, label: string): number {
  const result = finite(value, label);
  if (result <= 0) throw new Error(`${label} must be positive`);
  return result;
}

function nonnegativeInteger(value: unknown, label: string): number {
  const result = finite(value, label);
  if (!Number.isInteger(result) || result < 0) throw new Error(`${label} must be a nonnegative integer`);
  return result;
}

function positiveInteger(value: unknown, label: string): number {
  const result = nonnegativeInteger(value, label);
  if (result === 0) throw new Error(`${label} must be positive`);
  return result;
}

function sha256(value: unknown, label: string): string {
  const result = string(value, label);
  if (!/^[0-9a-f]{64}$/.test(result)) throw new Error(`${label} must be a lowercase SHA-256`);
  return result;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`${label} has unexpected or missing keys`);
  }
}

function exactSet(actual: Iterable<string>, expected: Iterable<string>, label: string): void {
  const left = [...actual].sort();
  const right = [...expected].sort();
  if (canonicalJson(left) !== canonicalJson(right)) throw new Error(`${label} differs`);
}

function unique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} contains duplicates`);
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function asStrict(value: unknown): StrictJson {
  return value as StrictJson;
}

function descriptor(path: string, bytes: Uint8Array, storage?: "git-and-nas" | "nas-only"): JsonObject {
  return {
    path,
    bytes: bytes.byteLength,
    sha256: sha256Bytes(bytes),
    ...(storage === undefined ? {} : { storage }),
  };
}

function safeRelativePath(path: string, label: string): void {
  if (path.length === 0 || isAbsolute(path) || path === "." || path === ".." ||
      path.startsWith(`..${sep}`) || path.includes(`${sep}..${sep}`) || path.endsWith(`${sep}..`) ||
      path.includes("\0")) {
    throw new Error(`${label} is not a safe relative path`);
  }
}

function parseAnchor(value: unknown, label: string): Anchor {
  const row = object(value, label);
  exactKeys(row, ["pixel", "value"], label);
  return { pixel: finite(row.pixel, `${label}.pixel`), value: finite(row.value, `${label}.value`) };
}

function transformed(value: number, transform: AxisTransform, label: string): number {
  if (transform === "linear") return value;
  if (value <= 0) throw new Error(`${label} log10 value must be positive`);
  return Math.log10(value);
}

function parseAxis(value: unknown, label: string): AxisSpec {
  const row = object(value, label);
  exactKeys(row, ["variable", "unit", "transform", "fitAnchors", "validationAnchors", "validationTolerancePixels"], label);
  const transformValue = string(row.transform, `${label}.transform`);
  if (transformValue !== "linear" && transformValue !== "log10") throw new Error(`${label}.transform is invalid`);
  const fitValues = array(row.fitAnchors, `${label}.fitAnchors`);
  if (fitValues.length !== 2) throw new Error(`${label}.fitAnchors must contain exactly two anchors`);
  const validationValues = array(row.validationAnchors, `${label}.validationAnchors`);
  if (validationValues.length === 0) throw new Error(`${label} lacks a non-fit validation anchor`);
  const fit: readonly [Anchor, Anchor] = [
    parseAnchor(fitValues[0], `${label}.fitAnchors[0]`),
    parseAnchor(fitValues[1], `${label}.fitAnchors[1]`),
  ];
  const validation = validationValues.map((anchor, index) => parseAnchor(anchor, `${label}.validationAnchors[${index}]`));
  const result: AxisSpec = {
    variable: string(row.variable, `${label}.variable`),
    unit: string(row.unit, `${label}.unit`),
    transform: transformValue,
    fitAnchors: fit,
    validationAnchors: validation,
    validationTolerancePixels: positive(row.validationTolerancePixels, `${label}.validationTolerancePixels`),
  };
  const transformedFit = fit.map((anchor, index) => transformed(anchor.value, transformValue, `${label}.fitAnchors[${index}]`));
  if (fit[0].pixel === fit[1].pixel || transformedFit[0] === transformedFit[1]) {
    throw new Error(`${label}.fitAnchors do not span distinct coordinates`);
  }
  for (const [index, anchor] of validation.entries()) {
    const coordinate = transformed(anchor.value, transformValue, `${label}.validationAnchors[${index}]`);
    if (fit.some((candidate) => candidate.pixel === anchor.pixel || candidate.value === anchor.value)) {
      throw new Error(`${label}.validationAnchors[${index}] is not independent of the fit anchors`);
    }
    if (!Number.isFinite(coordinate)) throw new Error(`${label}.validationAnchors[${index}] is invalid`);
  }
  const pixelMinimum = Math.min(fit[0].pixel, fit[1].pixel);
  const pixelMaximum = Math.max(fit[0].pixel, fit[1].pixel);
  const coordinateMinimum = Math.min(transformedFit[0] as number, transformedFit[1] as number);
  const coordinateMaximum = Math.max(transformedFit[0] as number, transformedFit[1] as number);
  if (!validation.some((anchor) => {
    const coordinate = transformed(anchor.value, transformValue, label);
    return pixelMinimum < anchor.pixel && anchor.pixel < pixelMaximum &&
      coordinateMinimum < coordinate && coordinate < coordinateMaximum;
  })) {
    throw new Error(`${label} lacks an interior unused validation anchor`);
  }
  return result;
}

function parseRegistration(bytes: Uint8Array, label: string): Registration {
  const root = object(parseCanonicalJson(bytes, label), label);
  exactKeys(root, ["schema", "operator", "scope", "selection", "roots", "renderer", "readingProtocol", "sourcePdfs", "renders", "plots", "series"], label);
  if (root.schema !== "phase8b-plot-operator-registration-v1" || root.operator !== OPERATOR) {
    throw new Error(`${label} identity differs`);
  }
  const scopeValue = string(root.scope, `${label}.scope`);
  if (scopeValue !== "registered-successor-20260812" && scopeValue !== "test-fixture") throw new Error(`${label}.scope is invalid`);
  const selection = object(root.selection, `${label}.selection`);
  exactKeys(selection, ["path", "sha256", "p1SeriesCount"], `${label}.selection`);
  const selectionPath = string(selection.path, `${label}.selection.path`);
  safeRelativePath(selectionPath, `${label}.selection.path`);
  const roots = object(root.roots, `${label}.roots`);
  exactKeys(roots, ["physicalStorageRoot", "sourcePdfLogicalRoot", "renderLogicalRoot", "dataLogicalRoot"], `${label}.roots`);
  const physicalStorageRoot = string(roots.physicalStorageRoot, `${label}.roots.physicalStorageRoot`);
  const sourcePdfLogicalRoot = string(roots.sourcePdfLogicalRoot, `${label}.roots.sourcePdfLogicalRoot`);
  const renderLogicalRoot = string(roots.renderLogicalRoot, `${label}.roots.renderLogicalRoot`);
  const dataLogicalRoot = string(roots.dataLogicalRoot, `${label}.roots.dataLogicalRoot`);
  safeRelativePath(sourcePdfLogicalRoot, `${label}.roots.sourcePdfLogicalRoot`);
  safeRelativePath(renderLogicalRoot, `${label}.roots.renderLogicalRoot`);
  safeRelativePath(dataLogicalRoot, `${label}.roots.dataLogicalRoot`);
  const renderer = object(root.renderer, `${label}.renderer`);
  exactKeys(renderer, ["name", "version", "outputMode"], `${label}.renderer`);
  const rendererName = string(renderer.name, `${label}.renderer.name`);
  if (rendererName !== "pdfimages" && rendererName !== "fixture") throw new Error(`${label}.renderer.name is invalid`);
  if (renderer.outputMode !== "png") throw new Error(`${label}.renderer.outputMode differs`);
  const protocol = object(root.readingProtocol, `${label}.readingProtocol`);
  exactKeys(protocol, ["readAView", "readBView", "coordinateFrame", "pointOrdering", "independenceBoundary"], `${label}.readingProtocol`);
  if (protocol.coordinateFrame !== "source-render-pixels" || protocol.pointOrdering !== "left-to-right-then-top-to-bottom") {
    throw new Error(`${label}.readingProtocol contract differs`);
  }

  const sourcePdfs = array(root.sourcePdfs, `${label}.sourcePdfs`).map((value, index): PdfSpec => {
    const item = object(value, `${label}.sourcePdfs[${index}]`);
    exactKeys(item, ["sourceId", "fileName", "byteLength", "sha256", "pageCount"], `${label}.sourcePdfs[${index}]`);
    const fileName = string(item.fileName, `${label}.sourcePdfs[${index}].fileName`);
    safeRelativePath(fileName, `${label}.sourcePdfs[${index}].fileName`);
    return {
      sourceId: string(item.sourceId, `${label}.sourcePdfs[${index}].sourceId`),
      fileName,
      byteLength: positiveInteger(item.byteLength, `${label}.sourcePdfs[${index}].byteLength`),
      sha256: sha256(item.sha256, `${label}.sourcePdfs[${index}].sha256`),
      pageCount: positiveInteger(item.pageCount, `${label}.sourcePdfs[${index}].pageCount`),
    };
  });
  const renders = array(root.renders, `${label}.renders`).map((value, index): RenderSpec => {
    const item = object(value, `${label}.renders[${index}]`);
    exactKeys(item, ["renderId", "fileName", "sourceId", "pdfPage", "pdfImageIndexOnPage", "byteLength", "sha256", "widthPixels", "heightPixels", "extractionCommand"], `${label}.renders[${index}]`);
    const fileName = string(item.fileName, `${label}.renders[${index}].fileName`);
    safeRelativePath(fileName, `${label}.renders[${index}].fileName`);
    return {
      renderId: string(item.renderId, `${label}.renders[${index}].renderId`),
      fileName,
      sourceId: string(item.sourceId, `${label}.renders[${index}].sourceId`),
      pdfPage: positiveInteger(item.pdfPage, `${label}.renders[${index}].pdfPage`),
      pdfImageIndexOnPage: nonnegativeInteger(item.pdfImageIndexOnPage, `${label}.renders[${index}].pdfImageIndexOnPage`),
      byteLength: positiveInteger(item.byteLength, `${label}.renders[${index}].byteLength`),
      sha256: sha256(item.sha256, `${label}.renders[${index}].sha256`),
      widthPixels: positiveInteger(item.widthPixels, `${label}.renders[${index}].widthPixels`),
      heightPixels: positiveInteger(item.heightPixels, `${label}.renders[${index}].heightPixels`),
      extractionCommand: string(item.extractionCommand, `${label}.renders[${index}].extractionCommand`),
    };
  });
  const plots = array(root.plots, `${label}.plots`).map((value, index): PlotSpec => {
    const item = object(value, `${label}.plots[${index}]`);
    exactKeys(item, ["plotId", "renderId", "sourceLocator", "bounds", "xAxis", "yAxis", "markerCenterHalfWidthPixels", "maximumReaderDisagreementPixels"], `${label}.plots[${index}]`);
    const bounds = object(item.bounds, `${label}.plots[${index}].bounds`);
    exactKeys(bounds, ["left", "right", "top", "bottom"], `${label}.plots[${index}].bounds`);
    const result: PlotSpec = {
      plotId: string(item.plotId, `${label}.plots[${index}].plotId`),
      renderId: string(item.renderId, `${label}.plots[${index}].renderId`),
      sourceLocator: string(item.sourceLocator, `${label}.plots[${index}].sourceLocator`),
      bounds: {
        left: finite(bounds.left, `${label}.plots[${index}].bounds.left`),
        right: finite(bounds.right, `${label}.plots[${index}].bounds.right`),
        top: finite(bounds.top, `${label}.plots[${index}].bounds.top`),
        bottom: finite(bounds.bottom, `${label}.plots[${index}].bounds.bottom`),
      },
      xAxis: parseAxis(item.xAxis, `${label}.plots[${index}].xAxis`),
      yAxis: parseAxis(item.yAxis, `${label}.plots[${index}].yAxis`),
      markerCenterHalfWidthPixels: positive(item.markerCenterHalfWidthPixels, `${label}.plots[${index}].markerCenterHalfWidthPixels`),
      maximumReaderDisagreementPixels: positive(item.maximumReaderDisagreementPixels, `${label}.plots[${index}].maximumReaderDisagreementPixels`),
    };
    if (!(result.bounds.left < result.bounds.right && result.bounds.top < result.bounds.bottom)) {
      throw new Error(`${label}.plots[${index}].bounds are invalid`);
    }
    return result;
  });
  const series = array(root.series, `${label}.series`).map((value, index): SeriesSpec => {
    const item = object(value, `${label}.series[${index}]`);
    exactKeys(item, ["selectionId", "expectedPointCount", "preReadRefusal", "plotId", "marker", "sourceStatus", "verticalOrderSpan", "phase9EvidenceRole", "lineageId", "conditions", "sourceUncertainty", "exclusions"], `${label}.series[${index}]`);
    const preReadRefusal = object(item.preReadRefusal, `${label}.series[${index}].preReadRefusal`);
    exactKeys(preReadRefusal, ["candidateCount", "reason"], `${label}.series[${index}].preReadRefusal`);
    const selectionId = string(item.selectionId, `${label}.series[${index}].selectionId`);
    if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(selectionId)) throw new Error(`${label}.series[${index}].selectionId is unsafe`);
    const marker = object(item.marker, `${label}.series[${index}].marker`);
    exactKeys(marker, ["shape", "fill"], `${label}.series[${index}].marker`);
    const status = string(item.sourceStatus, `${label}.series[${index}].sourceStatus`);
    if (status !== "direct-observation" && status !== "source-derived-ratio" && status !== "imposed-forcing") {
      throw new Error(`${label}.series[${index}].sourceStatus is invalid`);
    }
    const orderSpan = string(item.verticalOrderSpan, `${label}.series[${index}].verticalOrderSpan`);
    if (orderSpan !== "required" && orderSpan !== "absent") throw new Error(`${label}.series[${index}].verticalOrderSpan is invalid`);
    if (item.phase9EvidenceRole !== "model-development") throw new Error(`${label}.series[${index}] is not model-development evidence`);
    return {
      selectionId,
      expectedPointCount: positiveInteger(item.expectedPointCount, `${label}.series[${index}].expectedPointCount`),
      preReadRefusal: {
        candidateCount: nonnegativeInteger(preReadRefusal.candidateCount, `${label}.series[${index}].preReadRefusal.candidateCount`),
        reason: string(preReadRefusal.reason, `${label}.series[${index}].preReadRefusal.reason`),
      },
      plotId: string(item.plotId, `${label}.series[${index}].plotId`),
      marker: {
        shape: string(marker.shape, `${label}.series[${index}].marker.shape`),
        fill: string(marker.fill, `${label}.series[${index}].marker.fill`),
      },
      sourceStatus: status,
      verticalOrderSpan: orderSpan,
      phase9EvidenceRole: "model-development",
      lineageId: string(item.lineageId, `${label}.series[${index}].lineageId`),
      conditions: object(item.conditions, `${label}.series[${index}].conditions`) as JsonObject,
      sourceUncertainty: object(item.sourceUncertainty, `${label}.series[${index}].sourceUncertainty`) as JsonObject,
      exclusions: array(item.exclusions, `${label}.series[${index}].exclusions`).map((entry, entryIndex) =>
        string(entry, `${label}.series[${index}].exclusions[${entryIndex}]`)),
    };
  });

  const result: Registration = {
    schema: "phase8b-plot-operator-registration-v1",
    operator: OPERATOR,
    scope: scopeValue,
    selection: {
      path: selectionPath,
      sha256: sha256(selection.sha256, `${label}.selection.sha256`),
      p1SeriesCount: positiveInteger(selection.p1SeriesCount, `${label}.selection.p1SeriesCount`),
    },
    roots: { physicalStorageRoot, sourcePdfLogicalRoot, renderLogicalRoot, dataLogicalRoot },
    renderer: {
      name: rendererName,
      version: string(renderer.version, `${label}.renderer.version`),
      outputMode: "png",
    },
    readingProtocol: {
      readAView: string(protocol.readAView, `${label}.readingProtocol.readAView`),
      readBView: string(protocol.readBView, `${label}.readingProtocol.readBView`),
      coordinateFrame: "source-render-pixels",
      pointOrdering: "left-to-right-then-top-to-bottom",
      independenceBoundary: string(protocol.independenceBoundary, `${label}.readingProtocol.independenceBoundary`),
    },
    sourcePdfs,
    renders,
    plots,
    series,
  };
  validateRegistrationGraph(result, label);
  return result;
}

function validateRegistrationGraph(registration: Registration, label: string): void {
  unique(registration.sourcePdfs.map((item) => item.sourceId), `${label}.sourcePdfs.sourceId`);
  unique(registration.sourcePdfs.map((item) => item.fileName), `${label}.sourcePdfs.fileName`);
  unique(registration.renders.map((item) => item.renderId), `${label}.renders.renderId`);
  unique(registration.renders.map((item) => item.fileName), `${label}.renders.fileName`);
  unique(registration.plots.map((item) => item.plotId), `${label}.plots.plotId`);
  unique(registration.series.map((item) => item.selectionId), `${label}.series.selectionId`);
  const pdfById = new Map(registration.sourcePdfs.map((item) => [item.sourceId, item]));
  const renderById = new Map(registration.renders.map((item) => [item.renderId, item]));
  const plotById = new Map(registration.plots.map((item) => [item.plotId, item]));
  for (const render of registration.renders) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(render.fileName)) {
      throw new Error(`${label} render ${render.renderId} has unsafe fileName`);
    }
    const pdf = pdfById.get(render.sourceId);
    if (pdf === undefined) throw new Error(`${label} render ${render.renderId} has unknown sourceId`);
    if (render.pdfPage > pdf.pageCount) throw new Error(`${label} render ${render.renderId} leaves its PDF page range`);
  }
  for (const source of registration.sourcePdfs) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(source.fileName)) {
      throw new Error(`${label} source ${source.sourceId} has unsafe fileName`);
    }
  }
  for (const plot of registration.plots) {
    if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(plot.plotId)) throw new Error(`${label} plot ${plot.plotId} has unsafe plotId`);
    const render = renderById.get(plot.renderId);
    if (render === undefined) throw new Error(`${label} plot ${plot.plotId} has unknown renderId`);
    if (plot.bounds.left < 0 || plot.bounds.top < 0 ||
        plot.bounds.right > render.widthPixels || plot.bounds.bottom > render.heightPixels) {
      throw new Error(`${label} plot ${plot.plotId} leaves its render`);
    }
    for (const [axisName, axis, minimum, maximum] of [
      ["xAxis", plot.xAxis, plot.bounds.left, plot.bounds.right],
      ["yAxis", plot.yAxis, plot.bounds.top, plot.bounds.bottom],
    ] as const) {
      for (const anchor of [...axis.fitAnchors, ...axis.validationAnchors]) {
        if (anchor.pixel < minimum || anchor.pixel > maximum) {
          throw new Error(`${label} plot ${plot.plotId}.${axisName} anchor leaves plot bounds`);
        }
      }
    }
    const xMap = axisMap(plot.xAxis, `${label}.${plot.plotId}.xAxis`);
    const yMap = axisMap(plot.yAxis, `${label}.${plot.plotId}.yAxis`);
    if (xMap.slope <= 0) throw new Error(`${label} plot ${plot.plotId} xAxis must increase left-to-right`);
    if (yMap.slope >= 0) throw new Error(`${label} plot ${plot.plotId} yAxis must increase bottom-to-top`);
  }
  for (const series of registration.series) {
    if (!/^P8B-P1-[A-Z0-9-]+$/.test(series.selectionId)) throw new Error(`${label} series ${series.selectionId} has unsafe selectionId`);
    if (!plotById.has(series.plotId)) throw new Error(`${label} series ${series.selectionId} has unknown plotId`);
  }
  if (registration.series.length !== registration.selection.p1SeriesCount) {
    throw new Error(`${label} P1 series count differs from selection declaration`);
  }
  if (registration.scope === "registered-successor-20260812") {
    if (registration.selection.path !== SELECTION_PATH || registration.selection.sha256 !== SELECTION_SHA256 ||
        registration.selection.p1SeriesCount !== 26 || registration.renderer.name !== "pdfimages" ||
        registration.roots.physicalStorageRoot !== "/Volumes/snowcrystal") {
      throw new Error(`${label} registered selection/renderer boundary differs`);
    }
  }
  if (!isAbsolute(registration.roots.physicalStorageRoot)) throw new Error(`${label}.physicalStorageRoot must be absolute`);
  for (const [name, logicalRoot] of [
    ["sourcePdfLogicalRoot", registration.roots.sourcePdfLogicalRoot],
    ["renderLogicalRoot", registration.roots.renderLogicalRoot],
    ["dataLogicalRoot", registration.roots.dataLogicalRoot],
  ] as const) {
    const normalized = relative(".", logicalRoot);
    if (logicalRoot === "" || isAbsolute(logicalRoot) || normalized === ".." || normalized.startsWith(`..${sep}`)) {
      throw new Error(`${label}.${name} must be a safe relative path`);
    }
  }
}

function parseSelection(bytes: Uint8Array, registration: Registration): ReadonlyMap<string, SelectionSeries> {
  if (sha256Bytes(bytes) !== registration.selection.sha256) throw new Error("frozen selection hash differs");
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (!text.endsWith("\n")) throw new Error("selection JSONL is not newline terminated");
  const results = new Map<string, SelectionSeries>();
  for (const [index, line] of text.slice(0, -1).split("\n").entries()) {
    if (line === "") throw new Error("selection JSONL contains a blank line");
    const record = object(parseCanonicalJson(new TextEncoder().encode(`${line}\n`), `selection line ${index + 1}`), `selection line ${index + 1}`);
    if (record.priorityClass !== "P1") continue;
    const id = string(record.id, `selection line ${index + 1}.id`);
    if (results.has(id)) throw new Error(`selection duplicates P1 ID ${id}`);
    if (registration.scope === "registered-successor-20260812") {
      if (record.schema !== "phase8b-benchmark-selection-v1" || record.recordKind !== "benchmark-selection" ||
          record.phase9EvidenceRole !== "model-development" ||
          record.numericTargetCoordinatesExtractedBeforeSelection !== false ||
          record.outcomeValueUsedAsSelectionCriterion !== false) {
        throw new Error(`selection line ${index + 1} P1 semantics differ`);
      }
      const source = object(record.source, `selection line ${index + 1}.source`);
      results.set(id, {
        id,
        sourceId: string(source.sourceId, `selection line ${index + 1}.source.sourceId`),
        locator: string(source.locator, `selection line ${index + 1}.source.locator`),
        lineageId: string(record.lineageId, `selection line ${index + 1}.lineageId`),
      });
    } else {
      // A compact fixture may exercise numeric verification with only the producer's minimum
      // selection ID/priority shape. Registered evidence never takes this relaxed branch.
      results.set(id, { id, sourceId: "fixture", locator: "fixture", lineageId: "fixture" });
    }
  }
  if (results.size !== registration.selection.p1SeriesCount) throw new Error("selection P1 count differs");
  exactSet(results.keys(), registration.series.map((series) => series.selectionId), "selection/registration P1 roster");
  if (registration.scope === "registered-successor-20260812") {
    const plotById = new Map(registration.plots.map((plot) => [plot.plotId, plot]));
    const renderById = new Map(registration.renders.map((render) => [render.renderId, render]));
    for (const series of registration.series) {
      const selected = results.get(series.selectionId) as SelectionSeries;
      const plot = plotById.get(series.plotId) as PlotSpec;
      const render = renderById.get(plot.renderId) as RenderSpec;
      const seriesDelimiter = selected.locator.indexOf(";series:");
      if (seriesDelimiter < 0) throw new Error(`selection locator lacks series identity for ${series.selectionId}`);
      const figureLocator = selected.locator.slice(0, seriesDelimiter);
      const expectedPanelPrefix = `${selected.sourceId};${figureLocator}`;
      if (selected.lineageId !== series.lineageId || selected.sourceId !== render.sourceId ||
          !(plot.sourceLocator === expectedPanelPrefix || plot.sourceLocator.startsWith(`${expectedPanelPrefix};`))) {
        throw new Error(`selection semantic mapping differs for ${series.selectionId}`);
      }
    }
  }
  return results;
}

function assertPin(bytes: Uint8Array, expected: { readonly byteLength: number; readonly sha256: string }, label: string): void {
  if (bytes.byteLength !== expected.byteLength || sha256Bytes(bytes) !== expected.sha256) {
    throw new Error(`${label} byte/hash pin differs`);
  }
}

function assertPdfEnvelope(bytes: Uint8Array, label: string): void {
  const prefix = new TextDecoder("latin1").decode(bytes.subarray(0, Math.min(8, bytes.byteLength)));
  const suffix = new TextDecoder("latin1").decode(bytes.subarray(Math.max(0, bytes.byteLength - 2048)));
  if (!prefix.startsWith("%PDF-") || !suffix.includes("%%EOF")) throw new Error(`${label} is not a complete PDF envelope`);
}

function pngDimensions(bytes: Uint8Array, label: string): { readonly width: number; readonly height: number } {
  if (bytes.byteLength < 24 || Array.from(bytes.subarray(0, 8)).map((value) => value.toString(16).padStart(2, "0")).join("") !== "89504e470d0a1a0a") {
    throw new Error(`${label} is not a PNG`);
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(12) !== 0x49484452) throw new Error(`${label} has no leading IHDR`);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function axisMap(axis: AxisSpec, label: string): AxisMap {
  const [first, second] = axis.fitAnchors;
  const firstCoordinate = transformed(first.value, axis.transform, `${label}.fitAnchors[0]`);
  const secondCoordinate = transformed(second.value, axis.transform, `${label}.fitAnchors[1]`);
  const slope = (secondCoordinate - firstCoordinate) / (second.pixel - first.pixel);
  const intercept = firstCoordinate - slope * first.pixel;
  if (!Number.isFinite(slope) || slope === 0 || !Number.isFinite(intercept)) throw new Error(`${label} calibration is singular`);
  const valueToPixel = (value: number): number => (transformed(value, axis.transform, label) - intercept) / slope;
  let maximumValidationResidualPixels = 0;
  for (const anchor of axis.validationAnchors) {
    const residual = Math.abs(valueToPixel(anchor.value) - anchor.pixel);
    if (!Number.isFinite(residual)) throw new Error(`${label} validation residual is nonfinite`);
    maximumValidationResidualPixels = Math.max(maximumValidationResidualPixels, residual);
  }
  if (maximumValidationResidualPixels > axis.validationTolerancePixels) {
    throw new Error(`${label} unused-anchor validation residual exceeds tolerance`);
  }
  return {
    slope,
    maximumValidationResidualPixels,
    pixelToValue: (pixel: number): number => {
      const coordinate = intercept + slope * pixel;
      const value = axis.transform === "linear" ? coordinate : 10 ** coordinate;
      if (!Number.isFinite(value)) throw new Error(`${label} pixel conversion is nonfinite`);
      return value;
    },
  };
}

function parseReads(bytes: Uint8Array, readerId: ReaderId): readonly PlotRead[] {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (!text.endsWith("\n")) throw new Error(`${readerId} JSONL is not newline terminated`);
  const rows: PlotRead[] = [];
  for (const [index, line] of text.slice(0, -1).split("\n").entries()) {
    if (line === "") throw new Error(`${readerId} JSONL contains a blank line`);
    const record = object(parseCanonicalJson(new TextEncoder().encode(`${line}\n`), `${readerId} line ${index + 1}`), `${readerId} line ${index + 1}`);
    const required = ["schema", "readerId", "seriesId", "pointId", "pixelX", "pixelY", "markerStatus"];
    const optional = ["orderSpanTopPixelY", "orderSpanBottomPixelY"];
    if (Object.keys(record).some((key) => !required.includes(key) && !optional.includes(key)) || required.some((key) => !(key in record))) {
      throw new Error(`${readerId} line ${index + 1} has unexpected or missing keys`);
    }
    if (record.schema !== "phase8b-plot-read-v1" || record.readerId !== readerId) {
      throw new Error(`${readerId} line ${index + 1} identity differs`);
    }
    const markerStatus = string(record.markerStatus, `${readerId} line ${index + 1}.markerStatus`);
    if (markerStatus !== "clear" && markerStatus !== "ambiguous" && markerStatus !== "clipped") {
      throw new Error(`${readerId} line ${index + 1}.markerStatus is invalid`);
    }
    rows.push({
      schema: "phase8b-plot-read-v1",
      readerId,
      seriesId: string(record.seriesId, `${readerId} line ${index + 1}.seriesId`),
      pointId: string(record.pointId, `${readerId} line ${index + 1}.pointId`),
      pixelX: finite(record.pixelX, `${readerId} line ${index + 1}.pixelX`),
      pixelY: finite(record.pixelY, `${readerId} line ${index + 1}.pixelY`),
      markerStatus,
      ...(record.orderSpanTopPixelY === undefined ? {} : {
        orderSpanTopPixelY: finite(record.orderSpanTopPixelY, `${readerId} line ${index + 1}.orderSpanTopPixelY`),
      }),
      ...(record.orderSpanBottomPixelY === undefined ? {} : {
        orderSpanBottomPixelY: finite(record.orderSpanBottomPixelY, `${readerId} line ${index + 1}.orderSpanBottomPixelY`),
      }),
    });
  }
  return rows;
}

function readKey(row: PlotRead): string {
  return `${row.seriesId}\u0000${row.pointId}`;
}

function assertRegisteredPointOrdering(
  rows: readonly PlotRead[],
  seriesId: string,
  readerId: ReaderId,
): void {
  const ordered = rows
    .filter((row) => row.seriesId === seriesId)
    .sort((left, right) => left.pointId < right.pointId ? -1 : left.pointId > right.pointId ? 1 : 0);
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1] as PlotRead;
    const current = ordered[index] as PlotRead;
    if (current.pixelX < previous.pixelX ||
        (current.pixelX === previous.pixelX && current.pixelY < previous.pixelY)) {
      throw new Error(`${readerId} point IDs do not follow left-to-right-then-top-to-bottom ordering for ${seriesId}`);
    }
  }
}

function parseJsonlObjects(bytes: Uint8Array, label: string): readonly JsonObject[] {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (!text.endsWith("\n")) throw new Error(`${label} is not newline terminated`);
  const rows: JsonObject[] = [];
  for (const [index, line] of text.slice(0, -1).split("\n").entries()) {
    if (line === "") throw new Error(`${label} contains a blank line`);
    rows.push(object(parseCanonicalJson(new TextEncoder().encode(`${line}\n`), `${label} line ${index + 1}`), `${label} line ${index + 1}`) as JsonObject);
  }
  return rows;
}

function canonicalJsonl(rows: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function expectedImplementation(implementation: ReadonlyMap<string, Uint8Array>): readonly JsonObject[] {
  exactSet(implementation.keys(), IMPLEMENTATION_PATHS, "implementation path set");
  return [...IMPLEMENTATION_PATHS]
    .sort()
    .map((path) => {
      const bytes = implementation.get(path);
      if (bytes === undefined) throw new Error(`missing implementation bytes: ${path}`);
      return descriptor(path, bytes);
    });
}

function compareJson(actual: unknown, expected: unknown, label: string): void {
  if (canonicalJson(asStrict(actual)) !== canonicalJson(asStrict(expected))) throw new Error(`${label} differs`);
}

function expectedPoint(
  series: SeriesSpec,
  plot: PlotSpec,
  xMap: AxisMap,
  yMap: AxisMap,
  readA: PlotRead,
  readB: PlotRead,
): JsonObject {
  if (readA.markerStatus !== "clear" || readB.markerStatus !== "clear") {
    throw new Error(`refused non-clear marker: ${series.selectionId}/${readA.pointId}`);
  }
  for (const [readerId, row] of [["read-a", readA], ["read-b", readB]] as const) {
    if (row.pixelX < plot.bounds.left || row.pixelX > plot.bounds.right ||
        row.pixelY < plot.bounds.top || row.pixelY > plot.bounds.bottom) {
      throw new Error(`${readerId} point leaves plot bounds: ${series.selectionId}/${row.pointId}`);
    }
  }
  const xDifference = Math.abs(readA.pixelX - readB.pixelX);
  const yDifference = Math.abs(readA.pixelY - readB.pixelY);
  if (xDifference > plot.maximumReaderDisagreementPixels || yDifference > plot.maximumReaderDisagreementPixels) {
    throw new Error(`reader disagreement exceeds threshold: ${series.selectionId}/${readA.pointId}`);
  }
  const requiresSpan = series.verticalOrderSpan === "required";
  for (const row of [readA, readB]) {
    const hasTop = row.orderSpanTopPixelY !== undefined;
    const hasBottom = row.orderSpanBottomPixelY !== undefined;
    if ((requiresSpan && !(hasTop && hasBottom)) || (!requiresSpan && (hasTop || hasBottom))) {
      throw new Error(`order-span presence differs: ${series.selectionId}/${row.pointId}`);
    }
    if (requiresSpan) {
      const top = row.orderSpanTopPixelY as number;
      const bottom = row.orderSpanBottomPixelY as number;
      if (!(plot.bounds.top <= top && top < row.pixelY && row.pixelY < bottom && bottom <= plot.bounds.bottom)) {
        throw new Error(`order-span endpoints do not bracket the in-bounds marker: ${series.selectionId}/${row.pointId}`);
      }
    }
  }
  if (requiresSpan) {
    if (Math.abs((readA.orderSpanTopPixelY as number) - (readB.orderSpanTopPixelY as number)) > plot.maximumReaderDisagreementPixels ||
        Math.abs((readA.orderSpanBottomPixelY as number) - (readB.orderSpanBottomPixelY as number)) > plot.maximumReaderDisagreementPixels) {
      throw new Error(`reader order-span disagreement exceeds threshold: ${series.selectionId}/${readA.pointId}`);
    }
  }
  const meanX = (readA.pixelX + readB.pixelX) / 2;
  const meanY = (readA.pixelY + readB.pixelY) / 2;
  const xPixelUncertainty = plot.markerCenterHalfWidthPixels + xDifference / 2 + xMap.maximumValidationResidualPixels;
  const yPixelUncertainty = plot.markerCenterHalfWidthPixels + yDifference / 2 + yMap.maximumValidationResidualPixels;
  const xBounds = [xMap.pixelToValue(meanX - xPixelUncertainty), xMap.pixelToValue(meanX + xPixelUncertainty)]
    .sort((left, right) => left - right);
  const yBounds = [yMap.pixelToValue(meanY - yPixelUncertainty), yMap.pixelToValue(meanY + yPixelUncertainty)]
    .sort((left, right) => left - right);
  const result: JsonObject = {
    schema: "phase8b-plot-point-v1",
    operator: OPERATOR,
    selectionId: series.selectionId,
    pointId: readA.pointId,
    sourceLocator: plot.sourceLocator,
    phase9EvidenceRole: series.phase9EvidenceRole,
    sourceStatus: series.sourceStatus,
    expectedPointCount: series.expectedPointCount,
    preReadRefusal: series.preReadRefusal,
    x: {
      variable: plot.xAxis.variable,
      unit: plot.xAxis.unit,
      value: xMap.pixelToValue(meanX),
      digitizationLower: xBounds[0] as number,
      digitizationUpper: xBounds[1] as number,
    },
    y: {
      variable: plot.yAxis.variable,
      unit: plot.yAxis.unit,
      value: yMap.pixelToValue(meanY),
      digitizationLower: yBounds[0] as number,
      digitizationUpper: yBounds[1] as number,
    },
    readerPixels: {
      readA: { x: readA.pixelX, y: readA.pixelY },
      readB: { x: readB.pixelX, y: readB.pixelY },
    },
    digitizationUncertainty: {
      method: "marker-half-width plus half-reader-range plus maximum unused-anchor calibration residual",
      xPixels: xPixelUncertainty,
      yPixels: yPixelUncertainty,
    },
    sourceUncertainty: series.sourceUncertainty,
  };
  if (requiresSpan) {
    const topDifference = Math.abs((readA.orderSpanTopPixelY as number) - (readB.orderSpanTopPixelY as number));
    const bottomDifference = Math.abs((readA.orderSpanBottomPixelY as number) - (readB.orderSpanBottomPixelY as number));
    const topMean = ((readA.orderSpanTopPixelY as number) + (readB.orderSpanTopPixelY as number)) / 2;
    const bottomMean = ((readA.orderSpanBottomPixelY as number) + (readB.orderSpanBottomPixelY as number)) / 2;
    const topPixelUncertainty = plot.markerCenterHalfWidthPixels + topDifference / 2 + yMap.maximumValidationResidualPixels;
    const bottomPixelUncertainty = plot.markerCenterHalfWidthPixels + bottomDifference / 2 + yMap.maximumValidationResidualPixels;
    const highBounds = [
      yMap.pixelToValue(topMean - topPixelUncertainty),
      yMap.pixelToValue(topMean + topPixelUncertainty),
    ].sort((left, right) => left - right);
    const lowBounds = [
      yMap.pixelToValue(bottomMean - bottomPixelUncertainty),
      yMap.pixelToValue(bottomMean + bottomPixelUncertainty),
    ].sort((left, right) => left - right);
    const low = yMap.pixelToValue(bottomMean);
    const high = yMap.pixelToValue(topMean);
    if (!(low <= high)) throw new Error(`order-span axis direction differs: ${series.selectionId}/${readA.pointId}`);
    (result as Record<string, StrictJson>).sourceOrderSpan = {
      semantics: "top is one-quarter and bottom is three-quarters in descending observation order; denominator unstated; not a confidence interval",
      low: {
        value: low,
        digitizationLower: lowBounds[0] as number,
        digitizationUpper: lowBounds[1] as number,
      },
      high: {
        value: high,
        digitizationLower: highBounds[0] as number,
        digitizationUpper: highBounds[1] as number,
      },
    };
  }
  return result;
}

/** Verify the complete publication without trusting any producer verdict or status field. */
export function verifyPhase8PlotPublication(inputs: Phase8PlotVerifyInputs): Phase8PlotVerification {
  const registration = parseRegistration(inputs.registrationBytes, "repository operator registration");
  const publishedOperatorBytes = inputs.published.metadataArtifacts.get("operator.json");
  if (publishedOperatorBytes === undefined) throw new Error("published operator.json is missing");
  const publishedRegistration = parseRegistration(publishedOperatorBytes, "published operator.json");
  compareJson(publishedRegistration, registration, "published/repository operator registration");
  if (!bytesEqual(publishedOperatorBytes, canonicalJsonBytes(asStrict(publishedRegistration)))) {
    throw new Error("published operator.json is not the canonical registered operator");
  }
  parseSelection(inputs.selectionBytes, registration);

  exactSet(inputs.sourcePdfs.keys(), registration.sourcePdfs.map((item) => item.fileName), "source PDF input set");
  if (registration.scope === "registered-successor-20260812" && inputs.sourcePdfPageCounts === undefined) {
    throw new Error("registered verification lacks independent PDF page counts");
  }
  if (inputs.sourcePdfPageCounts !== undefined) {
    exactSet(inputs.sourcePdfPageCounts.keys(), registration.sourcePdfs.map((item) => item.fileName), "source PDF page-count set");
  }
  for (const source of registration.sourcePdfs) {
    const bytes = inputs.sourcePdfs.get(source.fileName) as Uint8Array;
    assertPin(bytes, source, `source PDF ${source.fileName}`);
    if (registration.scope === "registered-successor-20260812") assertPdfEnvelope(bytes, `source PDF ${source.fileName}`);
    const independentPageCount = inputs.sourcePdfPageCounts?.get(source.fileName);
    if (independentPageCount !== undefined && independentPageCount !== source.pageCount) {
      throw new Error(`source PDF ${source.fileName} page count differs`);
    }
  }
  exactSet(inputs.renders.keys(), registration.renders.map((item) => item.fileName), "render input set");
  for (const render of registration.renders) {
    const bytes = inputs.renders.get(render.fileName) as Uint8Array;
    assertPin(bytes, render, `render ${render.fileName}`);
    const dimensions = pngDimensions(bytes, `render ${render.fileName}`);
    if (dimensions.width !== render.widthPixels || dimensions.height !== render.heightPixels) {
      throw new Error(`render ${render.fileName} dimensions differ`);
    }
  }
  const implementation = expectedImplementation(inputs.implementation);
  exactSet(inputs.published.metadataArtifacts.keys(), METADATA_NAMES, "published metadata artifact set");
  const expectedDataPaths = [
    "reads/read-a.jsonl",
    "reads/read-b.jsonl",
    ...registration.series.map((series) => `rows/${series.selectionId}.jsonl`),
  ];
  exactSet(inputs.published.dataArtifacts.keys(), expectedDataPaths, "published NAS artifact set");

  const readABytes = inputs.published.dataArtifacts.get("reads/read-a.jsonl") as Uint8Array;
  const readBBytes = inputs.published.dataArtifacts.get("reads/read-b.jsonl") as Uint8Array;
  const readsA = parseReads(readABytes, "read-a");
  const readsB = parseReads(readBBytes, "read-b");
  if (!bytesEqual(readABytes, canonicalJsonl(readsA)) || !bytesEqual(readBBytes, canonicalJsonl(readsB))) {
    throw new Error("published raw-reader artifacts are not canonical parser outputs");
  }
  const mapA = new Map(readsA.map((row) => [readKey(row), row]));
  const mapB = new Map(readsB.map((row) => [readKey(row), row]));
  if (mapA.size !== readsA.length || mapB.size !== readsB.length) throw new Error("a raw-reader artifact duplicates a series/point key");
  exactSet(mapA.keys(), mapB.keys(), "two-reader point roster");

  const plotById = new Map(registration.plots.map((plot) => [plot.plotId, plot]));
  const seriesById = new Map(registration.series.map((series) => [series.selectionId, series]));
  const xMaps = new Map(registration.plots.map((plot) => [plot.plotId, axisMap(plot.xAxis, `${plot.plotId}.xAxis`)]));
  const yMaps = new Map(registration.plots.map((plot) => [plot.plotId, axisMap(plot.yAxis, `${plot.plotId}.yAxis`)]));
  const expectedRows = new Map<string, JsonObject[]>(registration.series.map((series) => [series.selectionId, []]));
  const expectedPointRoster = new Set(registration.series.flatMap((series) =>
    Array.from({ length: series.expectedPointCount }, (_unused, index) =>
      `${series.selectionId}\u0000p${String(index + 1).padStart(3, "0")}`)));
  exactSet(mapA.keys(), expectedPointRoster, "registered exact point roster");
  for (const series of registration.series) {
    assertRegisteredPointOrdering(readsA, series.selectionId, "read-a");
    assertRegisteredPointOrdering(readsB, series.selectionId, "read-b");
  }
  for (const key of [...mapA.keys()].sort()) {
    const readA = mapA.get(key) as PlotRead;
    const readB = mapB.get(key) as PlotRead;
    if (readA.seriesId !== readB.seriesId || readA.pointId !== readB.pointId) throw new Error("reader key collision differs");
    const series = seriesById.get(readA.seriesId);
    if (series === undefined) throw new Error(`raw readers contain unregistered series ${readA.seriesId}`);
    const plot = plotById.get(series.plotId) as PlotSpec;
    expectedRows.get(series.selectionId)?.push(expectedPoint(
      series,
      plot,
      xMaps.get(plot.plotId) as AxisMap,
      yMaps.get(plot.plotId) as AxisMap,
      readA,
      readB,
    ));
  }

  const expectedRecords: JsonObject[] = [];
  let pointCount = 0;
  for (const series of [...registration.series].sort((left, right) => left.selectionId < right.selectionId ? -1 : left.selectionId > right.selectionId ? 1 : 0)) {
    const rows = expectedRows.get(series.selectionId) as JsonObject[];
    if (rows.length !== series.expectedPointCount) throw new Error(`series point count differs: ${series.selectionId}`);
    rows.sort((left, right) => {
      const leftId = String(left.pointId);
      const rightId = String(right.pointId);
      return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
    });
    if (new Set(rows.map((row) => String(row.pointId))).size !== rows.length) throw new Error(`series duplicates point IDs: ${series.selectionId}`);
    const path = `rows/${series.selectionId}.jsonl`;
    const bytes = inputs.published.dataArtifacts.get(path) as Uint8Array;
    const actualRows = parseJsonlObjects(bytes, path);
    if (!bytesEqual(bytes, canonicalJsonl(actualRows))) throw new Error(`${path} is not canonical JSONL`);
    compareJson(actualRows, rows, `${path} independently reconstructed rows`);
    const expectedBytes = canonicalJsonl(rows);
    if (!bytesEqual(bytes, expectedBytes)) throw new Error(`${path} bytes differ from independent reconstruction`);
    pointCount += rows.length;
    const plot = plotById.get(series.plotId) as PlotSpec;
    expectedRecords.push({
      schema: "phase8b-plot-series-record-v1",
      operator: OPERATOR,
      selectionId: series.selectionId,
      phase9EvidenceRole: series.phase9EvidenceRole,
      lineageId: series.lineageId,
      sourceStatus: series.sourceStatus,
      expectedPointCount: series.expectedPointCount,
      preReadRefusal: series.preReadRefusal,
      sourceLocator: plot.sourceLocator,
      plotId: series.plotId,
      marker: series.marker,
      conditions: series.conditions,
      sourceUncertainty: series.sourceUncertainty,
      exclusions: series.exclusions,
      rowArtifact: { path, bytes: bytes.byteLength, sha256: sha256Bytes(bytes), rowCount: rows.length },
    });
  }

  const recordsBytes = inputs.published.metadataArtifacts.get("records.jsonl") as Uint8Array;
  const actualRecords = parseJsonlObjects(recordsBytes, "records.jsonl");
  if (!bytesEqual(recordsBytes, canonicalJsonl(actualRecords))) throw new Error("records.jsonl is not canonical JSONL");
  compareJson(actualRecords, expectedRecords, "series metadata records");
  const counts = {
    seriesCount: registration.series.length,
    pointCount,
    preReadRefusedCandidateCount: registration.series.reduce((sum, series) => sum + series.preReadRefusal.candidateCount, 0),
    directObservationSeriesCount: registration.series.filter((series) => series.sourceStatus === "direct-observation").length,
    sourceDerivedRatioSeriesCount: registration.series.filter((series) => series.sourceStatus === "source-derived-ratio").length,
    imposedForcingSeriesCount: registration.series.filter((series) => series.sourceStatus === "imposed-forcing").length,
  };

  const reportBytes = inputs.published.metadataArtifacts.get("report.json") as Uint8Array;
  const report = object(parseCanonicalJson(reportBytes, "report.json"), "report.json");
  exactKeys(report, ["schema", "operator", "scope", "status", "phase9EvidenceRole", "counts", "selection", "physicalStorageRoot", "dataLogicalRoot", "rightsBoundary", "renderProvenanceLimit", "uncertaintyMethod", "implementation"], "report.json");
  const expectedReport = {
    schema: "phase8b-plot-extraction-report-v1",
    operator: OPERATOR,
    scope: registration.scope,
    status: "candidate-awaiting-independent-verification",
    phase9EvidenceRole: "model-development",
    counts,
    selection: registration.selection,
    physicalStorageRoot: registration.roots.physicalStorageRoot,
    dataLogicalRoot: registration.roots.dataLogicalRoot,
    rightsBoundary: "source renders, raw reader coordinates and normalized row bodies remain NAS-only; Git receives metadata, counts and hashes",
    renderProvenanceLimit: "render byte hashes, dimensions and registered PDF page metadata are verified; the verifier does not rerun pdfimages or prove pixel derivation from the named page",
    uncertaintyMethod: "conservative pixel interval from marker half-width, two-reader half-range and unused-anchor calibration residual; source uncertainty remains separate",
    implementation,
  };
  compareJson(report, expectedReport, "report.json independently derived content");

  const indexBytes = inputs.published.metadataArtifacts.get("artifact-index.json") as Uint8Array;
  const index = object(parseCanonicalJson(indexBytes, "artifact-index.json"), "artifact-index.json");
  exactKeys(index, ["schema", "operator", "artifacts", "counts", "reportSha256"], "artifact-index.json");
  const artifactDescriptors = [
    ...["operator.json", "records.jsonl", "report.json"].map((path) =>
      descriptor(path, inputs.published.metadataArtifacts.get(path) as Uint8Array, "git-and-nas")),
    ...expectedDataPaths.map((path) => descriptor(path, inputs.published.dataArtifacts.get(path) as Uint8Array, "nas-only")),
  ].sort((left, right) => String(left.path) < String(right.path) ? -1 : String(left.path) > String(right.path) ? 1 : 0);
  const expectedIndex = {
    schema: "phase8b-plot-artifact-index-v1",
    operator: OPERATOR,
    artifacts: artifactDescriptors,
    counts,
    reportSha256: sha256Bytes(reportBytes),
  };
  compareJson(index, expectedIndex, "artifact-index.json independently derived graph");

  return {
    ok: true,
    counts,
    sourcePdfCount: registration.sourcePdfs.length,
    renderCount: registration.renders.length,
    readRowsPerReader: readsA.length,
    rowArtifactCount: registration.series.length,
  };
}

function readRegularFile(path: string, label: string): Uint8Array {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} is not a regular non-symlink file`);
  return new Uint8Array(readFileSync(path));
}

function descendant(root: string, path: string, label: string): string {
  safeRelativePath(path, label);
  const candidate = resolve(root, path);
  const displacement = relative(resolve(root), candidate);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) || isAbsolute(displacement)) {
    throw new Error(`${label} leaves its root`);
  }
  return candidate;
}

function expectedPhysicalPath(registration: Registration, logicalRoot: string, label: string): string {
  const physicalRoot = realpathSync(registration.roots.physicalStorageRoot);
  const candidate = resolve(physicalRoot, currentResearchSharePath(logicalRoot));
  const displacement = relative(physicalRoot, candidate);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) || isAbsolute(displacement)) {
    throw new Error(`${label} leaves the registered physical storage root`);
  }
  return candidate;
}

function registeredExistingPath(registration: Registration, logicalRoot: string, suppliedPath: string, label: string): string {
  const expected = realpathSync(expectedPhysicalPath(registration, logicalRoot, label));
  const actual = realpathSync(suppliedPath);
  if (actual !== expected) throw new Error(`${label} does not match the registered physical NAS path`);
  return actual;
}

/** Strictly read a published plot bundle without following artifact symlinks. */
export function readPhase8PlotPublishedDirectory(directory: string): Phase8PlotPublishedBytes {
  const expectedRoot = [...METADATA_NAMES, "reads", "rows"].sort();
  const entries = readdirSync(directory, { withFileTypes: true });
  exactSet(entries.map((entry) => entry.name), expectedRoot, "plot publication root entries");
  const metadataArtifacts = new Map<string, Uint8Array>();
  for (const name of METADATA_NAMES) metadataArtifacts.set(name, readRegularFile(join(directory, name), name));
  for (const subdirectory of ["reads", "rows"] as const) {
    const stat = lstatSync(join(directory, subdirectory));
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`${subdirectory} is not a real directory`);
  }
  const readNames = readdirSync(join(directory, "reads"), { withFileTypes: true });
  exactSet(readNames.map((entry) => entry.name), ["read-a.jsonl", "read-b.jsonl"], "published reader filenames");
  const dataArtifacts = new Map<string, Uint8Array>();
  for (const entry of readNames) {
    dataArtifacts.set(`reads/${entry.name}`, readRegularFile(join(directory, "reads", entry.name), `reads/${entry.name}`));
  }
  const rowEntries = readdirSync(join(directory, "rows"), { withFileTypes: true });
  if (rowEntries.length === 0) throw new Error("published rows directory is empty");
  for (const entry of rowEntries) {
    if (!entry.isFile() || entry.isSymbolicLink() || !/^[A-Za-z0-9][A-Za-z0-9-]*\.jsonl$/.test(entry.name)) {
      throw new Error(`invalid published row artifact: ${entry.name}`);
    }
    dataArtifacts.set(`rows/${entry.name}`, readRegularFile(join(directory, "rows", entry.name), `rows/${entry.name}`));
  }
  return { metadataArtifacts, dataArtifacts };
}

function readRegisteredInputs(root: string, paths: readonly string[], label: string): ReadonlyMap<string, Uint8Array> {
  const result = new Map<string, Uint8Array>();
  for (const path of paths) result.set(path, readRegularFile(descendant(root, path, `${label} ${path}`), `${label} ${path}`));
  return result;
}

function pdfPageCount(path: string, label: string): number {
  const output = execFileSync("pdfinfo", [path], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    timeout: 30_000,
  });
  const match = /^Pages:\s+(\d+)\s*$/mu.exec(output);
  if (match === null) throw new Error(`pdfinfo did not report ${label} page count`);
  return positiveInteger(Number(match[1]), `${label} page count`);
}

export function captureRegisteredPhase8PlotVerifyInputs(options: {
  readonly repositoryRoot: string;
  readonly sourceRoot: string;
  readonly renderRoot: string;
  readonly bundleDirectory: string;
}): Phase8PlotVerifyInputs {
  const repositoryRoot = resolve(options.repositoryRoot);
  const registrationBytes = readRegularFile(descendant(repositoryRoot, OPERATOR_PATH, "operator registration"), "operator registration");
  const registration = parseRegistration(registrationBytes, "repository operator registration");
  const sourceRoot = registeredExistingPath(registration, registration.roots.sourcePdfLogicalRoot, resolve(options.sourceRoot), "source root");
  const renderRoot = registeredExistingPath(registration, registration.roots.renderLogicalRoot, resolve(options.renderRoot), "render root");
  const bundleDirectory = registeredExistingPath(registration, registration.roots.dataLogicalRoot, resolve(options.bundleDirectory), "bundle directory");
  const sourcePdfs = readRegisteredInputs(sourceRoot, registration.sourcePdfs.map((source) => source.fileName), "source PDF");
  const sourcePdfPageCounts = new Map(registration.sourcePdfs.map((source) => [
    source.fileName,
    pdfPageCount(descendant(sourceRoot, source.fileName, `source PDF ${source.fileName}`), `source PDF ${source.fileName}`),
  ]));
  return {
    registrationBytes,
    selectionBytes: readRegularFile(descendant(repositoryRoot, registration.selection.path, "selection"), "selection"),
    sourcePdfs,
    sourcePdfPageCounts,
    renders: readRegisteredInputs(renderRoot, registration.renders.map((render) => render.fileName), "render"),
    implementation: readRegisteredInputs(repositoryRoot, IMPLEMENTATION_PATHS, "implementation"),
    published: readPhase8PlotPublishedDirectory(bundleDirectory),
  };
}

function parseArguments(argv: readonly string[]): ReadonlyMap<string, string> {
  const allowed = new Set(["repository-root", "source-root", "render-root", "bundle"]);
  const result = new Map<string, string>();
  if (argv.length % 2 !== 0) throw new Error("arguments must be --name value pairs");
  for (let index = 0; index < argv.length; index += 2) {
    const token = argv[index];
    const value = argv[index + 1];
    if (token === undefined || value === undefined || !token.startsWith("--")) throw new Error("arguments must be --name value pairs");
    const key = token.slice(2);
    if (!allowed.has(key) || result.has(key)) throw new Error(`unexpected or duplicate argument: ${token}`);
    result.set(key, value);
  }
  exactSet(result.keys(), allowed, "CLI argument set");
  return result;
}

function main(argv: readonly string[]): void {
  if (argv[0] !== "verify") {
    throw new Error("usage: phase8-plot-extraction-verify.ts verify --repository-root ROOT --source-root ROOT --render-root ROOT --bundle DIRECTORY");
  }
  const argumentsMap = parseArguments(argv.slice(1));
  const result = verifyPhase8PlotPublication(captureRegisteredPhase8PlotVerifyInputs({
    repositoryRoot: resolve(argumentsMap.get("repository-root") as string),
    sourceRoot: resolve(argumentsMap.get("source-root") as string),
    renderRoot: resolve(argumentsMap.get("render-root") as string),
    bundleDirectory: resolve(argumentsMap.get("bundle") as string),
  }));
  process.stdout.write(`${canonicalJson(result)}\n`);
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
