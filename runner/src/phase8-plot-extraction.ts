// Phase 8B S4 — registered two-reader plot digitization.
//
// Version 1 fixed source/render identity, axes, series semantics, marker rules and refusal
// thresholds before target point coordinates were supplied. Version 2 is the narrow successor
// that corrects three expected marker counts after both readers independently found the same
// source-count mismatch. The producer keeps raw reads and normalized row bodies on the NAS; Git
// receives only schemas, provenance, counts and hashes.

import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
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
import { currentResearchSharePath } from "./phase9-nas.ts";

export const PHASE8_PLOT_OPERATOR = "phase8b-two-reader-plot-digitization-v2" as const;
export const PHASE8_PLOT_OPERATOR_PATH = "research/phase8b-plot-operator-v2.json" as const;
export const PHASE8_PLOT_SELECTION_PATH =
  "evidence/phase8b-benchmark-selection-v1/selection.jsonl" as const;
export const PHASE8_PLOT_SELECTION_SHA256 =
  "d4d883b321949155e4ca462b594c6a443acd233719bc8f8c5ffc17e694516537" as const;
export const PHASE8_PLOT_METADATA_NAMES = [
  "artifact-index.json",
  "operator.json",
  "records.jsonl",
  "report.json",
] as const;
export const PHASE8_PLOT_IMPLEMENTATION_PATHS = [
  "runner/src/gate4-evidence.ts",
  "runner/src/phase8-plot-extraction.ts",
  "runner/src/phase8-plot-extraction-verify.ts",
  "runner/test/phase8-plot-extraction.test.ts",
  PHASE8_PLOT_OPERATOR_PATH,
] as const;

type JsonObject = { readonly [key: string]: StrictJson };

export interface Phase8PlotPixelAnchor {
  readonly pixel: number;
  readonly value: number;
}

export interface Phase8PlotAxisSpec {
  readonly variable: string;
  readonly unit: string;
  readonly transform: "linear" | "log10";
  readonly fitAnchors: readonly [Phase8PlotPixelAnchor, Phase8PlotPixelAnchor];
  readonly validationAnchors: readonly Phase8PlotPixelAnchor[];
  readonly validationTolerancePixels: number;
}

export interface Phase8PlotPdfSpec {
  readonly sourceId: string;
  readonly fileName: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly pageCount: number;
}

export interface Phase8PlotRenderSpec {
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

export interface Phase8PlotPanelSpec {
  readonly plotId: string;
  readonly renderId: string;
  readonly sourceLocator: string;
  readonly bounds: {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
  };
  readonly xAxis: Phase8PlotAxisSpec;
  readonly yAxis: Phase8PlotAxisSpec;
  readonly markerCenterHalfWidthPixels: number;
  readonly maximumReaderDisagreementPixels: number;
}

export interface Phase8PlotSeriesSpec {
  readonly selectionId: string;
  readonly expectedPointCount: number;
  readonly preReadRefusal: {
    readonly candidateCount: number;
    readonly reason: string;
  };
  readonly plotId: string;
  readonly marker: {
    readonly shape: string;
    readonly fill: string;
  };
  readonly sourceStatus: "direct-observation" | "source-derived-ratio" | "imposed-forcing";
  readonly verticalOrderSpan: "required" | "absent";
  readonly phase9EvidenceRole: "model-development";
  readonly lineageId: string;
  readonly conditions: JsonObject;
  readonly sourceUncertainty: JsonObject;
  readonly exclusions: readonly string[];
}

export interface Phase8PlotRegistration {
  readonly schema: "phase8b-plot-operator-registration-v1";
  readonly operator: typeof PHASE8_PLOT_OPERATOR;
  readonly scope: "registered-successor-20260812" | "test-fixture";
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
  readonly sourcePdfs: readonly Phase8PlotPdfSpec[];
  readonly renders: readonly Phase8PlotRenderSpec[];
  readonly plots: readonly Phase8PlotPanelSpec[];
  readonly series: readonly Phase8PlotSeriesSpec[];
}

export interface Phase8PlotRead {
  readonly schema: "phase8b-plot-read-v1";
  readonly readerId: "read-a" | "read-b";
  readonly seriesId: string;
  readonly pointId: string;
  readonly pixelX: number;
  readonly pixelY: number;
  readonly markerStatus: "clear" | "ambiguous" | "clipped";
  readonly orderSpanTopPixelY?: number;
  readonly orderSpanBottomPixelY?: number;
}

export interface Phase8PlotInputs {
  readonly registrationBytes: Uint8Array;
  readonly selectionBytes: Uint8Array;
  readonly sourcePdfs: ReadonlyMap<string, Uint8Array>;
  readonly renders: ReadonlyMap<string, Uint8Array>;
  readonly readABytes: Uint8Array;
  readonly readBBytes: Uint8Array;
  readonly implementation: ReadonlyMap<string, Uint8Array>;
}

export interface Phase8PlotBundle {
  readonly registration: Phase8PlotRegistration;
  readonly metadataArtifacts: ReadonlyMap<string, Uint8Array>;
  readonly dataArtifacts: ReadonlyMap<string, Uint8Array>;
  readonly counts: {
    readonly seriesCount: number;
    readonly pointCount: number;
    readonly directObservationSeriesCount: number;
    readonly sourceDerivedRatioSeriesCount: number;
    readonly imposedForcingSeriesCount: number;
  };
}

interface AxisMapping {
  readonly pixelToValue: (pixel: number) => number;
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

function positive(value: StrictJson | undefined, label: string): number {
  const result = finite(value, label);
  if (result <= 0) throw new Error(`${label} must be positive`);
  return result;
}

function integer(value: StrictJson | undefined, label: string): number {
  const result = finite(value, label);
  if (!Number.isInteger(result) || result < 0) throw new Error(`${label} must be a nonnegative integer`);
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
    throw new Error(`${label} has unexpected or missing keys`);
  }
}

function parseAnchor(value: StrictJson, label: string): Phase8PlotPixelAnchor {
  const row = object(value, label);
  exactKeys(row, ["pixel", "value"], label);
  return { pixel: finite(row.pixel, `${label}.pixel`), value: finite(row.value, `${label}.value`) };
}

function parseAxis(value: StrictJson, label: string): Phase8PlotAxisSpec {
  const row = object(value, label);
  exactKeys(row, ["variable", "unit", "transform", "fitAnchors", "validationAnchors", "validationTolerancePixels"], label);
  const transform = string(row.transform, `${label}.transform`);
  if (transform !== "linear" && transform !== "log10") throw new Error(`${label}.transform is invalid`);
  const fit = array(row.fitAnchors, `${label}.fitAnchors`);
  if (fit.length !== 2) throw new Error(`${label}.fitAnchors must contain exactly two anchors`);
  const validation = array(row.validationAnchors, `${label}.validationAnchors`);
  if (validation.length === 0) throw new Error(`${label} needs at least one non-fit validation anchor`);
  const result: Phase8PlotAxisSpec = {
    variable: string(row.variable, `${label}.variable`),
    unit: string(row.unit, `${label}.unit`),
    transform,
    fitAnchors: [parseAnchor(fit[0] as StrictJson, `${label}.fitAnchors[0]`), parseAnchor(fit[1] as StrictJson, `${label}.fitAnchors[1]`)],
    validationAnchors: validation.map((anchor, index) => parseAnchor(anchor, `${label}.validationAnchors[${index}]`)),
    validationTolerancePixels: positive(row.validationTolerancePixels, `${label}.validationTolerancePixels`),
  };
  for (const anchor of [...result.fitAnchors, ...result.validationAnchors]) {
    if (result.transform === "log10" && anchor.value <= 0) throw new Error(`${label} log anchors must be positive`);
  }
  if (result.fitAnchors[0].pixel === result.fitAnchors[1].pixel || result.fitAnchors[0].value === result.fitAnchors[1].value) {
    throw new Error(`${label}.fitAnchors must span distinct pixels and values`);
  }
  return result;
}

function parseRegistrationValue(value: StrictJson): Phase8PlotRegistration {
  const root = object(value, "operator registration");
  exactKeys(root, ["schema", "operator", "scope", "selection", "roots", "renderer", "readingProtocol", "sourcePdfs", "renders", "plots", "series"], "operator registration");
  if (root.schema !== "phase8b-plot-operator-registration-v1") throw new Error("operator registration schema mismatch");
  if (root.operator !== PHASE8_PLOT_OPERATOR) throw new Error("operator mismatch");
  const scope = string(root.scope, "scope");
  if (scope !== "registered-successor-20260812" && scope !== "test-fixture") throw new Error("scope is invalid");
  const selection = object(root.selection as StrictJson, "selection");
  exactKeys(selection, ["path", "sha256", "p1SeriesCount"], "selection");
  const roots = object(root.roots as StrictJson, "roots");
  exactKeys(roots, ["physicalStorageRoot", "sourcePdfLogicalRoot", "renderLogicalRoot", "dataLogicalRoot"], "roots");
  const renderer = object(root.renderer as StrictJson, "renderer");
  exactKeys(renderer, ["name", "version", "outputMode"], "renderer");
  const rendererName = string(renderer.name, "renderer.name");
  if (rendererName !== "pdfimages" && rendererName !== "fixture") throw new Error("renderer.name is invalid");
  if (renderer.outputMode !== "png") throw new Error("renderer.outputMode must be png");
  const readingProtocol = object(root.readingProtocol as StrictJson, "readingProtocol");
  exactKeys(readingProtocol, ["readAView", "readBView", "coordinateFrame", "pointOrdering", "independenceBoundary"], "readingProtocol");
  if (readingProtocol.coordinateFrame !== "source-render-pixels") throw new Error("readingProtocol.coordinateFrame is invalid");
  if (readingProtocol.pointOrdering !== "left-to-right-then-top-to-bottom") throw new Error("readingProtocol.pointOrdering is invalid");

  const sourcePdfs = array(root.sourcePdfs, "sourcePdfs").map((value, index): Phase8PlotPdfSpec => {
    const row = object(value, `sourcePdfs[${index}]`);
    exactKeys(row, ["sourceId", "fileName", "byteLength", "sha256", "pageCount"], `sourcePdfs[${index}]`);
    return {
      sourceId: string(row.sourceId, `sourcePdfs[${index}].sourceId`),
      fileName: string(row.fileName, `sourcePdfs[${index}].fileName`),
      byteLength: integer(row.byteLength, `sourcePdfs[${index}].byteLength`),
      sha256: sha256(row.sha256, `sourcePdfs[${index}].sha256`),
      pageCount: integer(row.pageCount, `sourcePdfs[${index}].pageCount`),
    };
  });
  const renders = array(root.renders, "renders").map((value, index): Phase8PlotRenderSpec => {
    const row = object(value, `renders[${index}]`);
    exactKeys(row, ["renderId", "fileName", "sourceId", "pdfPage", "pdfImageIndexOnPage", "byteLength", "sha256", "widthPixels", "heightPixels", "extractionCommand"], `renders[${index}]`);
    return {
      renderId: string(row.renderId, `renders[${index}].renderId`),
      fileName: string(row.fileName, `renders[${index}].fileName`),
      sourceId: string(row.sourceId, `renders[${index}].sourceId`),
      pdfPage: integer(row.pdfPage, `renders[${index}].pdfPage`),
      pdfImageIndexOnPage: integer(row.pdfImageIndexOnPage, `renders[${index}].pdfImageIndexOnPage`),
      byteLength: integer(row.byteLength, `renders[${index}].byteLength`),
      sha256: sha256(row.sha256, `renders[${index}].sha256`),
      widthPixels: positive(row.widthPixels, `renders[${index}].widthPixels`),
      heightPixels: positive(row.heightPixels, `renders[${index}].heightPixels`),
      extractionCommand: string(row.extractionCommand, `renders[${index}].extractionCommand`),
    };
  });
  const plots = array(root.plots, "plots").map((value, index): Phase8PlotPanelSpec => {
    const row = object(value, `plots[${index}]`);
    exactKeys(row, ["plotId", "renderId", "sourceLocator", "bounds", "xAxis", "yAxis", "markerCenterHalfWidthPixels", "maximumReaderDisagreementPixels"], `plots[${index}]`);
    const bounds = object(row.bounds as StrictJson, `plots[${index}].bounds`);
    exactKeys(bounds, ["left", "right", "top", "bottom"], `plots[${index}].bounds`);
    const result: Phase8PlotPanelSpec = {
      plotId: string(row.plotId, `plots[${index}].plotId`),
      renderId: string(row.renderId, `plots[${index}].renderId`),
      sourceLocator: string(row.sourceLocator, `plots[${index}].sourceLocator`),
      bounds: {
        left: finite(bounds.left, `plots[${index}].bounds.left`),
        right: finite(bounds.right, `plots[${index}].bounds.right`),
        top: finite(bounds.top, `plots[${index}].bounds.top`),
        bottom: finite(bounds.bottom, `plots[${index}].bounds.bottom`),
      },
      xAxis: parseAxis(row.xAxis as StrictJson, `plots[${index}].xAxis`),
      yAxis: parseAxis(row.yAxis as StrictJson, `plots[${index}].yAxis`),
      markerCenterHalfWidthPixels: positive(row.markerCenterHalfWidthPixels, `plots[${index}].markerCenterHalfWidthPixels`),
      maximumReaderDisagreementPixels: positive(row.maximumReaderDisagreementPixels, `plots[${index}].maximumReaderDisagreementPixels`),
    };
    if (!(result.bounds.left < result.bounds.right && result.bounds.top < result.bounds.bottom)) {
      throw new Error(`plots[${index}].bounds are invalid`);
    }
    return result;
  });
  const series = array(root.series, "series").map((value, index): Phase8PlotSeriesSpec => {
    const row = object(value, `series[${index}]`);
    exactKeys(row, ["selectionId", "expectedPointCount", "preReadRefusal", "plotId", "marker", "sourceStatus", "verticalOrderSpan", "phase9EvidenceRole", "lineageId", "conditions", "sourceUncertainty", "exclusions"], `series[${index}]`);
    const preReadRefusal = object(row.preReadRefusal as StrictJson, `series[${index}].preReadRefusal`);
    exactKeys(preReadRefusal, ["candidateCount", "reason"], `series[${index}].preReadRefusal`);
    const marker = object(row.marker as StrictJson, `series[${index}].marker`);
    exactKeys(marker, ["shape", "fill"], `series[${index}].marker`);
    const status = string(row.sourceStatus, `series[${index}].sourceStatus`);
    if (status !== "direct-observation" && status !== "source-derived-ratio" && status !== "imposed-forcing") throw new Error(`series[${index}].sourceStatus is invalid`);
    const orderSpan = string(row.verticalOrderSpan, `series[${index}].verticalOrderSpan`);
    if (orderSpan !== "required" && orderSpan !== "absent") throw new Error(`series[${index}].verticalOrderSpan is invalid`);
    if (row.phase9EvidenceRole !== "model-development") throw new Error(`series[${index}] must be model-development evidence`);
    return {
      selectionId: string(row.selectionId, `series[${index}].selectionId`),
      expectedPointCount: positive(row.expectedPointCount, `series[${index}].expectedPointCount`),
      preReadRefusal: {
        candidateCount: integer(preReadRefusal.candidateCount, `series[${index}].preReadRefusal.candidateCount`),
        reason: string(preReadRefusal.reason, `series[${index}].preReadRefusal.reason`),
      },
      plotId: string(row.plotId, `series[${index}].plotId`),
      marker: { shape: string(marker.shape, `series[${index}].marker.shape`), fill: string(marker.fill, `series[${index}].marker.fill`) },
      sourceStatus: status,
      verticalOrderSpan: orderSpan,
      phase9EvidenceRole: "model-development",
      lineageId: string(row.lineageId, `series[${index}].lineageId`),
      conditions: object(row.conditions as StrictJson, `series[${index}].conditions`),
      sourceUncertainty: object(row.sourceUncertainty as StrictJson, `series[${index}].sourceUncertainty`),
      exclusions: array(row.exclusions, `series[${index}].exclusions`).map((item, itemIndex) => string(item, `series[${index}].exclusions[${itemIndex}]`)),
    };
  });
  const result: Phase8PlotRegistration = {
    schema: "phase8b-plot-operator-registration-v1",
    operator: PHASE8_PLOT_OPERATOR,
    scope,
    selection: {
      path: string(selection.path, "selection.path"),
      sha256: sha256(selection.sha256, "selection.sha256"),
      p1SeriesCount: integer(selection.p1SeriesCount, "selection.p1SeriesCount"),
    },
    roots: {
      physicalStorageRoot: string(roots.physicalStorageRoot, "roots.physicalStorageRoot"),
      sourcePdfLogicalRoot: string(roots.sourcePdfLogicalRoot, "roots.sourcePdfLogicalRoot"),
      renderLogicalRoot: string(roots.renderLogicalRoot, "roots.renderLogicalRoot"),
      dataLogicalRoot: string(roots.dataLogicalRoot, "roots.dataLogicalRoot"),
    },
    renderer: { name: rendererName, version: string(renderer.version, "renderer.version"), outputMode: "png" },
    readingProtocol: {
      readAView: string(readingProtocol.readAView, "readingProtocol.readAView"),
      readBView: string(readingProtocol.readBView, "readingProtocol.readBView"),
      coordinateFrame: "source-render-pixels",
      pointOrdering: "left-to-right-then-top-to-bottom",
      independenceBoundary: string(readingProtocol.independenceBoundary, "readingProtocol.independenceBoundary"),
    },
    sourcePdfs,
    renders,
    plots,
    series,
  };
  validateRegistrationGraph(result);
  return result;
}

export function parsePhase8PlotRegistration(bytes: Uint8Array): Phase8PlotRegistration {
  return parseRegistrationValue(parseCanonicalJson(bytes, "plot operator registration"));
}

function unique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} contains duplicates`);
}

function validateRegistrationGraph(registration: Phase8PlotRegistration): void {
  unique(registration.sourcePdfs.map((row) => row.sourceId), "sourcePdfs.sourceId");
  unique(registration.sourcePdfs.map((row) => row.fileName), "sourcePdfs.fileName");
  unique(registration.renders.map((row) => row.renderId), "renders.renderId");
  unique(registration.renders.map((row) => row.fileName), "renders.fileName");
  unique(registration.plots.map((row) => row.plotId), "plots.plotId");
  unique(registration.series.map((row) => row.selectionId), "series.selectionId");
  const sourceIds = new Set(registration.sourcePdfs.map((row) => row.sourceId));
  const sourceById = new Map(registration.sourcePdfs.map((row) => [row.sourceId, row]));
  const renderById = new Map(registration.renders.map((row) => [row.renderId, row]));
  const plotIds = new Set(registration.plots.map((row) => row.plotId));
  for (const render of registration.renders) {
    if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(render.renderId)) throw new Error(`render has an unsafe renderId: ${render.renderId}`);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(render.fileName)) throw new Error(`render ${render.renderId} has an unsafe fileName`);
    if (!sourceIds.has(render.sourceId)) throw new Error(`render ${render.renderId} has an unknown sourceId`);
    if (render.pdfPage < 1 || render.pdfPage > (sourceById.get(render.sourceId) as Phase8PlotPdfSpec).pageCount) {
      throw new Error(`render ${render.renderId} leaves its PDF page range`);
    }
  }
  for (const source of registration.sourcePdfs) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(source.fileName)) throw new Error(`source ${source.sourceId} has an unsafe fileName`);
  }
  for (const plot of registration.plots) {
    if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(plot.plotId)) throw new Error(`plot has an unsafe plotId: ${plot.plotId}`);
    const render = renderById.get(plot.renderId);
    if (render === undefined) throw new Error(`plot ${plot.plotId} has an unknown renderId`);
    if (plot.bounds.left < 0 || plot.bounds.top < 0 || plot.bounds.right > render.widthPixels || plot.bounds.bottom > render.heightPixels) {
      throw new Error(`plot ${plot.plotId} bounds leave its render`);
    }
    for (const [axisName, axis, lower, upper] of [
      ["xAxis", plot.xAxis, plot.bounds.left, plot.bounds.right],
      ["yAxis", plot.yAxis, plot.bounds.top, plot.bounds.bottom],
    ] as const) {
      for (const anchor of [...axis.fitAnchors, ...axis.validationAnchors]) {
        if (anchor.pixel < lower || anchor.pixel > upper) throw new Error(`plot ${plot.plotId} ${axisName} anchor leaves plot bounds`);
      }
      for (const validation of axis.validationAnchors) {
        if (axis.fitAnchors.some((fit) => fit.pixel === validation.pixel || fit.value === validation.value)) {
          throw new Error(`plot ${plot.plotId} ${axisName} reuses a fit anchor as validation`);
        }
      }
      if (new Set(axis.validationAnchors.map((anchor) => anchor.pixel)).size !== axis.validationAnchors.length ||
          new Set(axis.validationAnchors.map((anchor) => anchor.value)).size !== axis.validationAnchors.length) {
        throw new Error(`plot ${plot.plotId} ${axisName} duplicates validation anchors`);
      }
    }
    const xCoordinateA = axisCoordinate(plot.xAxis.fitAnchors[0].value, plot.xAxis.transform);
    const xCoordinateB = axisCoordinate(plot.xAxis.fitAnchors[1].value, plot.xAxis.transform);
    if ((xCoordinateB - xCoordinateA) / (plot.xAxis.fitAnchors[1].pixel - plot.xAxis.fitAnchors[0].pixel) <= 0) {
      throw new Error(`plot ${plot.plotId} xAxis must increase left-to-right`);
    }
    const yCoordinateA = axisCoordinate(plot.yAxis.fitAnchors[0].value, plot.yAxis.transform);
    const yCoordinateB = axisCoordinate(plot.yAxis.fitAnchors[1].value, plot.yAxis.transform);
    if ((yCoordinateB - yCoordinateA) / (plot.yAxis.fitAnchors[1].pixel - plot.yAxis.fitAnchors[0].pixel) >= 0) {
      throw new Error(`plot ${plot.plotId} yAxis must increase bottom-to-top`);
    }
    // Registration parsing itself must exercise the unused-anchor calibration. Otherwise a
    // malformed real operator can pass its static roster test and fail only after readers work.
    axisMapping(plot.xAxis, `${plot.plotId}.xAxis`);
    axisMapping(plot.yAxis, `${plot.plotId}.yAxis`);
  }
  for (const row of registration.series) {
    if (!/^P8B-P1-[A-Z0-9-]+$/.test(row.selectionId)) throw new Error(`series ${row.selectionId} has an unsafe selectionId`);
    if (!Number.isInteger(row.expectedPointCount)) throw new Error(`series ${row.selectionId} expectedPointCount must be an integer`);
    if (!plotIds.has(row.plotId)) throw new Error(`series ${row.selectionId} has an unknown plotId`);
  }
  if (registration.series.length !== registration.selection.p1SeriesCount) throw new Error("registered P1 series count mismatch");
  if (registration.scope === "registered-successor-20260812" && registration.renderer.name !== "pdfimages") {
    throw new Error("registered operator must use pdfimages renders");
  }
  if (!isAbsolute(registration.roots.physicalStorageRoot)) throw new Error("physicalStorageRoot must be absolute");
  for (const [name, logicalRoot] of [
    ["sourcePdfLogicalRoot", registration.roots.sourcePdfLogicalRoot],
    ["renderLogicalRoot", registration.roots.renderLogicalRoot],
    ["dataLogicalRoot", registration.roots.dataLogicalRoot],
  ] as const) {
    const normalized = relative(".", logicalRoot);
    if (logicalRoot === "" || isAbsolute(logicalRoot) || normalized === ".." || normalized.startsWith(`..${sep}`)) {
      throw new Error(`${name} must be a safe relative path`);
    }
  }
  if (registration.scope === "registered-successor-20260812" && registration.roots.physicalStorageRoot !== "/Volumes/snowcrystal") {
    throw new Error("registered operator must bind the snowcrystal NAS mount");
  }
}

function parseSelectionP1Ids(bytes: Uint8Array): readonly string[] {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (!text.endsWith("\n")) throw new Error("selection JSONL must end with a newline");
  const ids: string[] = [];
  for (const [index, line] of text.slice(0, -1).split("\n").entries()) {
    const row = object(parseCanonicalJson(new TextEncoder().encode(`${line}\n`), `selection line ${index + 1}`), `selection line ${index + 1}`);
    if (row.priorityClass === "P1") ids.push(string(row.id, `selection line ${index + 1}.id`));
  }
  unique(ids, "selection P1 IDs");
  return ids.sort();
}

function pngDimensions(bytes: Uint8Array, label: string): { readonly width: number; readonly height: number } {
  if (bytes.byteLength < 24 || Buffer.from(bytes.subarray(0, 8)).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error(`${label} is not a PNG`);
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(12) !== 0x49484452) throw new Error(`${label} has no leading IHDR`);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function axisCoordinate(value: number, transform: Phase8PlotAxisSpec["transform"]): number {
  if (transform === "linear") return value;
  if (value <= 0) throw new Error("log10 axis value must be positive");
  return Math.log10(value);
}

function axisMapping(axis: Phase8PlotAxisSpec, label: string): AxisMapping {
  const [a, b] = axis.fitAnchors;
  const coordinateA = axisCoordinate(a.value, axis.transform);
  const coordinateB = axisCoordinate(b.value, axis.transform);
  const slope = (coordinateB - coordinateA) / (b.pixel - a.pixel);
  const intercept = coordinateA - slope * a.pixel;
  const valueToPixel = (value: number): number => (axisCoordinate(value, axis.transform) - intercept) / slope;
  let maximumValidationResidualPixels = 0;
  for (const anchor of axis.validationAnchors) {
    const residual = Math.abs(valueToPixel(anchor.value) - anchor.pixel);
    maximumValidationResidualPixels = Math.max(maximumValidationResidualPixels, residual);
  }
  if (maximumValidationResidualPixels > axis.validationTolerancePixels) {
    throw new Error(`${label} validation residual ${maximumValidationResidualPixels} exceeds ${axis.validationTolerancePixels} pixels`);
  }
  return {
    pixelToValue: (pixel: number): number => {
      const coordinate = intercept + slope * pixel;
      return axis.transform === "linear" ? coordinate : 10 ** coordinate;
    },
    maximumValidationResidualPixels,
  };
}

function parseReads(bytes: Uint8Array, readerId: "read-a" | "read-b"): readonly Phase8PlotRead[] {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (!text.endsWith("\n")) throw new Error(`${readerId} JSONL must end with a newline`);
  const rows: Phase8PlotRead[] = [];
  if (text === "") return rows;
  for (const [index, line] of text.slice(0, -1).split("\n").entries()) {
    const value = object(parseCanonicalJson(new TextEncoder().encode(`${line}\n`), `${readerId} line ${index + 1}`), `${readerId} line ${index + 1}`);
    const required = ["schema", "readerId", "seriesId", "pointId", "pixelX", "pixelY", "markerStatus"];
    const optional = ["orderSpanTopPixelY", "orderSpanBottomPixelY"];
    const actual = Object.keys(value);
    if (actual.some((key) => !required.includes(key) && !optional.includes(key)) || required.some((key) => !actual.includes(key))) {
      throw new Error(`${readerId} line ${index + 1} has unexpected or missing keys`);
    }
    if (value.schema !== "phase8b-plot-read-v1" || value.readerId !== readerId) throw new Error(`${readerId} line ${index + 1} identity mismatch`);
    const markerStatus = string(value.markerStatus, `${readerId} line ${index + 1}.markerStatus`);
    if (markerStatus !== "clear" && markerStatus !== "ambiguous" && markerStatus !== "clipped") throw new Error(`${readerId} line ${index + 1}.markerStatus is invalid`);
    const row: Phase8PlotRead = {
      schema: "phase8b-plot-read-v1",
      readerId,
      seriesId: string(value.seriesId, `${readerId} line ${index + 1}.seriesId`),
      pointId: string(value.pointId, `${readerId} line ${index + 1}.pointId`),
      pixelX: finite(value.pixelX, `${readerId} line ${index + 1}.pixelX`),
      pixelY: finite(value.pixelY, `${readerId} line ${index + 1}.pixelY`),
      markerStatus,
      ...(value.orderSpanTopPixelY === undefined ? {} : { orderSpanTopPixelY: finite(value.orderSpanTopPixelY, `${readerId} line ${index + 1}.orderSpanTopPixelY`) }),
      ...(value.orderSpanBottomPixelY === undefined ? {} : { orderSpanBottomPixelY: finite(value.orderSpanBottomPixelY, `${readerId} line ${index + 1}.orderSpanBottomPixelY`) }),
    };
    rows.push(row);
  }
  return rows;
}

function readKey(row: Phase8PlotRead): string {
  return `${row.seriesId}\u0000${row.pointId}`;
}

function assertRegisteredPointOrdering(
  rows: readonly Phase8PlotRead[],
  seriesId: string,
  readerId: "read-a" | "read-b",
): void {
  const ordered = rows
    .filter((row) => row.seriesId === seriesId)
    .sort((left, right) => left.pointId < right.pointId ? -1 : left.pointId > right.pointId ? 1 : 0);
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1] as Phase8PlotRead;
    const current = ordered[index] as Phase8PlotRead;
    if (current.pixelX < previous.pixelX ||
        (current.pixelX === previous.pixelX && current.pixelY < previous.pixelY)) {
      throw new Error(`${readerId} point IDs do not follow left-to-right-then-top-to-bottom ordering for ${seriesId}`);
    }
  }
}

function canonicalJsonl(rows: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(rows.map((row) => canonicalJson(row)).join("\n") + "\n");
}

function implementationHashes(implementation: ReadonlyMap<string, Uint8Array>): readonly JsonObject[] {
  const paths = [...implementation.keys()].sort();
  if (paths.length !== PHASE8_PLOT_IMPLEMENTATION_PATHS.length || paths.some((path, index) => path !== [...PHASE8_PLOT_IMPLEMENTATION_PATHS].sort()[index])) {
    throw new Error("implementation path set does not match the registered operator boundary");
  }
  return paths.map((path) => ({ path, bytes: implementation.get(path)?.byteLength ?? 0, sha256: sha256Bytes(implementation.get(path) as Uint8Array) }));
}

function assertExactMapKeys(actual: Iterable<string>, expected: readonly string[], label: string): void {
  const left = [...actual].sort();
  const right = [...expected].sort();
  if (left.length !== right.length || left.some((value, index) => value !== right[index])) {
    throw new Error(`${label} path set differs from registration`);
  }
}

export function derivePhase8PlotBundle(inputs: Phase8PlotInputs): Phase8PlotBundle {
  const registration = parsePhase8PlotRegistration(inputs.registrationBytes);
  if (registration.scope === "registered-successor-20260812") {
    if (registration.selection.path !== PHASE8_PLOT_SELECTION_PATH || registration.selection.sha256 !== PHASE8_PLOT_SELECTION_SHA256) {
      throw new Error("registered operator is not bound to the frozen S2 selection");
    }
  }
  if (sha256Bytes(inputs.selectionBytes) !== registration.selection.sha256) throw new Error("selection hash mismatch");
  const selectedP1 = parseSelectionP1Ids(inputs.selectionBytes);
  const registeredP1 = registration.series.map((row) => row.selectionId).sort();
  if (selectedP1.length !== registeredP1.length || selectedP1.some((id, index) => id !== registeredP1[index])) {
    throw new Error("registered series roster does not equal the frozen P1 roster");
  }
  assertExactMapKeys(inputs.sourcePdfs.keys(), registration.sourcePdfs.map((source) => source.fileName), "source PDF");
  assertExactMapKeys(inputs.renders.keys(), registration.renders.map((render) => render.fileName), "render");
  for (const source of registration.sourcePdfs) {
    const bytes = inputs.sourcePdfs.get(source.fileName);
    if (bytes === undefined || bytes.byteLength !== source.byteLength || sha256Bytes(bytes) !== source.sha256) throw new Error(`source PDF mismatch: ${source.fileName}`);
  }
  for (const render of registration.renders) {
    const bytes = inputs.renders.get(render.fileName);
    if (bytes === undefined || bytes.byteLength !== render.byteLength || sha256Bytes(bytes) !== render.sha256) throw new Error(`render mismatch: ${render.fileName}`);
    const dimensions = pngDimensions(bytes, render.fileName);
    if (dimensions.width !== render.widthPixels || dimensions.height !== render.heightPixels) throw new Error(`render dimensions mismatch: ${render.fileName}`);
  }
  const implementation = implementationHashes(inputs.implementation);
  const plotById = new Map(registration.plots.map((plot) => [plot.plotId, plot]));
  const xMappings = new Map<string, AxisMapping>();
  const yMappings = new Map<string, AxisMapping>();
  for (const plot of registration.plots) {
    xMappings.set(plot.plotId, axisMapping(plot.xAxis, `${plot.plotId}.xAxis`));
    yMappings.set(plot.plotId, axisMapping(plot.yAxis, `${plot.plotId}.yAxis`));
  }
  const readA = parseReads(inputs.readABytes, "read-a");
  const readB = parseReads(inputs.readBBytes, "read-b");
  const mapA = new Map(readA.map((row) => [readKey(row), row]));
  const mapB = new Map(readB.map((row) => [readKey(row), row]));
  if (mapA.size !== readA.length || mapB.size !== readB.length) throw new Error("a reader file contains duplicate seriesId/pointId keys");
  const keysA = [...mapA.keys()].sort();
  const keysB = [...mapB.keys()].sort();
  if (keysA.length !== keysB.length || keysA.some((key, index) => key !== keysB[index])) throw new Error("reader point rosters differ");
  const seriesById = new Map(registration.series.map((row) => [row.selectionId, row]));
  const rowsBySeries = new Map<string, JsonObject[]>();
  for (const series of registration.series) rowsBySeries.set(series.selectionId, []);
  for (const series of registration.series) {
    const expectedPointIds = Array.from({ length: series.expectedPointCount }, (_, index) => `p${String(index + 1).padStart(3, "0")}`);
    for (const [readerId, rows] of [["read-a", readA], ["read-b", readB]] as const) {
      const actualPointIds = rows.filter((row) => row.seriesId === series.selectionId).map((row) => row.pointId).sort();
      if (actualPointIds.length !== expectedPointIds.length || actualPointIds.some((id, index) => id !== expectedPointIds[index])) {
        throw new Error(`${readerId} point roster does not match registered count for ${series.selectionId}`);
      }
      assertRegisteredPointOrdering(rows, series.selectionId, readerId);
    }
  }
  for (const key of keysA) {
    const a = mapA.get(key) as Phase8PlotRead;
    const b = mapB.get(key) as Phase8PlotRead;
    const series = seriesById.get(a.seriesId);
    if (series === undefined) throw new Error(`unregistered read series: ${a.seriesId}`);
    if (a.markerStatus !== "clear" || b.markerStatus !== "clear") throw new Error(`refused non-clear marker: ${a.seriesId}/${a.pointId}`);
    const plot = plotById.get(series.plotId) as Phase8PlotPanelSpec;
    for (const [reader, row] of [["read-a", a], ["read-b", b]] as const) {
      if (row.pixelX < plot.bounds.left || row.pixelX > plot.bounds.right || row.pixelY < plot.bounds.top || row.pixelY > plot.bounds.bottom) {
        throw new Error(`${reader} point leaves plot bounds: ${row.seriesId}/${row.pointId}`);
      }
    }
    const xDifference = Math.abs(a.pixelX - b.pixelX);
    const yDifference = Math.abs(a.pixelY - b.pixelY);
    if (xDifference > plot.maximumReaderDisagreementPixels || yDifference > plot.maximumReaderDisagreementPixels) {
      throw new Error(`reader disagreement exceeds threshold: ${a.seriesId}/${a.pointId}`);
    }
    const requiresSpan = series.verticalOrderSpan === "required";
    for (const row of [a, b]) {
      const hasTop = row.orderSpanTopPixelY !== undefined;
      const hasBottom = row.orderSpanBottomPixelY !== undefined;
      if ((requiresSpan && !(hasTop && hasBottom)) || (!requiresSpan && (hasTop || hasBottom))) throw new Error(`order-span presence mismatch: ${row.seriesId}/${row.pointId}`);
      if (requiresSpan && !((row.orderSpanTopPixelY as number) < row.pixelY && row.pixelY < (row.orderSpanBottomPixelY as number))) {
        throw new Error(`order-span endpoints do not bracket marker: ${row.seriesId}/${row.pointId}`);
      }
      if (requiresSpan && ((row.orderSpanTopPixelY as number) < plot.bounds.top || (row.orderSpanBottomPixelY as number) > plot.bounds.bottom)) {
        throw new Error(`order-span endpoints leave plot bounds: ${row.seriesId}/${row.pointId}`);
      }
    }
    const xMapping = xMappings.get(plot.plotId) as AxisMapping;
    const yMapping = yMappings.get(plot.plotId) as AxisMapping;
    const meanX = (a.pixelX + b.pixelX) / 2;
    const meanY = (a.pixelY + b.pixelY) / 2;
    const xPixelUncertainty = plot.markerCenterHalfWidthPixels + xDifference / 2 + xMapping.maximumValidationResidualPixels;
    const yPixelUncertainty = plot.markerCenterHalfWidthPixels + yDifference / 2 + yMapping.maximumValidationResidualPixels;
    const xBounds = [xMapping.pixelToValue(meanX - xPixelUncertainty), xMapping.pixelToValue(meanX + xPixelUncertainty)].sort((left, right) => left - right);
    const yBounds = [yMapping.pixelToValue(meanY - yPixelUncertainty), yMapping.pixelToValue(meanY + yPixelUncertainty)].sort((left, right) => left - right);
    const topDifference = requiresSpan ? Math.abs((a.orderSpanTopPixelY as number) - (b.orderSpanTopPixelY as number)) : 0;
    const bottomDifference = requiresSpan ? Math.abs((a.orderSpanBottomPixelY as number) - (b.orderSpanBottomPixelY as number)) : 0;
    if (topDifference > plot.maximumReaderDisagreementPixels || bottomDifference > plot.maximumReaderDisagreementPixels) {
      throw new Error(`order-span reader disagreement exceeds threshold: ${a.seriesId}/${a.pointId}`);
    }
    const topMean = requiresSpan ? ((a.orderSpanTopPixelY as number) + (b.orderSpanTopPixelY as number)) / 2 : 0;
    const bottomMean = requiresSpan ? ((a.orderSpanBottomPixelY as number) + (b.orderSpanBottomPixelY as number)) / 2 : 0;
    const topPixelUncertainty = plot.markerCenterHalfWidthPixels + topDifference / 2 + yMapping.maximumValidationResidualPixels;
    const bottomPixelUncertainty = plot.markerCenterHalfWidthPixels + bottomDifference / 2 + yMapping.maximumValidationResidualPixels;
    const highBounds = requiresSpan ? [yMapping.pixelToValue(topMean - topPixelUncertainty), yMapping.pixelToValue(topMean + topPixelUncertainty)].sort((left, right) => left - right) : [0, 0];
    const lowBounds = requiresSpan ? [yMapping.pixelToValue(bottomMean - bottomPixelUncertainty), yMapping.pixelToValue(bottomMean + bottomPixelUncertainty)].sort((left, right) => left - right) : [0, 0];
    const output: JsonObject = {
      schema: "phase8b-plot-point-v1",
      operator: PHASE8_PLOT_OPERATOR,
      selectionId: series.selectionId,
      pointId: a.pointId,
      sourceLocator: plot.sourceLocator,
      phase9EvidenceRole: series.phase9EvidenceRole,
      sourceStatus: series.sourceStatus,
      expectedPointCount: series.expectedPointCount,
      preReadRefusal: series.preReadRefusal,
      x: {
        variable: plot.xAxis.variable,
        unit: plot.xAxis.unit,
        value: xMapping.pixelToValue(meanX),
        digitizationLower: xBounds[0] as number,
        digitizationUpper: xBounds[1] as number,
      },
      y: {
        variable: plot.yAxis.variable,
        unit: plot.yAxis.unit,
        value: yMapping.pixelToValue(meanY),
        digitizationLower: yBounds[0] as number,
        digitizationUpper: yBounds[1] as number,
      },
      readerPixels: {
        readA: { x: a.pixelX, y: a.pixelY },
        readB: { x: b.pixelX, y: b.pixelY },
      },
      digitizationUncertainty: {
        method: "marker-half-width plus half-reader-range plus maximum unused-anchor calibration residual",
        xPixels: xPixelUncertainty,
        yPixels: yPixelUncertainty,
      },
      sourceUncertainty: series.sourceUncertainty,
      ...(requiresSpan ? {
        sourceOrderSpan: {
          semantics: "top is one-quarter and bottom is three-quarters in descending observation order; denominator unstated; not a confidence interval",
          low: { value: yMapping.pixelToValue(bottomMean), digitizationLower: lowBounds[0] as number, digitizationUpper: lowBounds[1] as number },
          high: { value: yMapping.pixelToValue(topMean), digitizationLower: highBounds[0] as number, digitizationUpper: highBounds[1] as number },
        },
      } : {}),
    };
    rowsBySeries.get(series.selectionId)?.push(output);
  }
  for (const [seriesId, rows] of rowsBySeries) {
    if (rows.length === 0) throw new Error(`series has no accepted points: ${seriesId}`);
    rows.sort((left, right) => {
      const leftPoint = left.pointId as string;
      const rightPoint = right.pointId as string;
      return leftPoint < rightPoint ? -1 : leftPoint > rightPoint ? 1 : 0;
    });
  }

  const dataArtifacts = new Map<string, Uint8Array>();
  dataArtifacts.set("reads/read-a.jsonl", canonicalJsonl(readA));
  dataArtifacts.set("reads/read-b.jsonl", canonicalJsonl(readB));
  const records: JsonObject[] = [];
  let pointCount = 0;
  for (const series of [...registration.series].sort((left, right) => left.selectionId < right.selectionId ? -1 : 1)) {
    const rows = rowsBySeries.get(series.selectionId) as JsonObject[];
    pointCount += rows.length;
    const path = `rows/${series.selectionId}.jsonl`;
    const bytes = canonicalJsonl(rows);
    dataArtifacts.set(path, bytes);
    const plot = plotById.get(series.plotId) as Phase8PlotPanelSpec;
    records.push({
      schema: "phase8b-plot-series-record-v1",
      operator: PHASE8_PLOT_OPERATOR,
      selectionId: series.selectionId,
      phase9EvidenceRole: series.phase9EvidenceRole,
      lineageId: series.lineageId,
      sourceStatus: series.sourceStatus,
      expectedPointCount: series.expectedPointCount,
      preReadRefusal: series.preReadRefusal,
      sourceLocator: plot.sourceLocator,
      plotId: series.plotId,
      marker: series.marker as unknown as StrictJson,
      conditions: series.conditions,
      sourceUncertainty: series.sourceUncertainty,
      exclusions: series.exclusions,
      rowArtifact: { path, bytes: bytes.byteLength, sha256: sha256Bytes(bytes), rowCount: rows.length },
    });
  }
  const counts = {
    seriesCount: registration.series.length,
    pointCount,
    preReadRefusedCandidateCount: registration.series.reduce((sum, row) => sum + row.preReadRefusal.candidateCount, 0),
    directObservationSeriesCount: registration.series.filter((row) => row.sourceStatus === "direct-observation").length,
    sourceDerivedRatioSeriesCount: registration.series.filter((row) => row.sourceStatus === "source-derived-ratio").length,
    imposedForcingSeriesCount: registration.series.filter((row) => row.sourceStatus === "imposed-forcing").length,
  };
  const operatorArtifact = parseCanonicalJson(inputs.registrationBytes, "operator registration");
  const recordsBytes = canonicalJsonl(records);
  const report = {
    schema: "phase8b-plot-extraction-report-v1",
    operator: PHASE8_PLOT_OPERATOR,
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
  const reportBytes = canonicalJsonBytes(report);
  const metadataWithoutIndex = new Map<string, Uint8Array>([
    ["operator.json", canonicalJsonBytes(operatorArtifact)],
    ["records.jsonl", recordsBytes],
    ["report.json", reportBytes],
  ]);
  const artifacts = [...metadataWithoutIndex.entries(), ...dataArtifacts.entries()]
    .map(([path, bytes]) => ({ path, bytes: bytes.byteLength, sha256: sha256Bytes(bytes), storage: PHASE8_PLOT_METADATA_NAMES.includes(path as typeof PHASE8_PLOT_METADATA_NAMES[number]) ? "git-and-nas" : "nas-only" }))
    .sort((left, right) => left.path < right.path ? -1 : 1);
  const index = {
    schema: "phase8b-plot-artifact-index-v1",
    operator: PHASE8_PLOT_OPERATOR,
    artifacts,
    counts,
    reportSha256: sha256Bytes(reportBytes),
  };
  const metadataArtifacts = new Map<string, Uint8Array>([["artifact-index.json", canonicalJsonBytes(index)], ...metadataWithoutIndex]);
  return { registration, metadataArtifacts, dataArtifacts, counts };
}

function ensureInside(root: string, candidate: string, label: string): void {
  const relativePath = relative(root, candidate);
  if (relativePath === "" || relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new Error(`${label} must be a descendant of the registered data root`);
  }
}

function expectedPhysicalPath(registration: Phase8PlotRegistration, logicalRoot: string, label: string): string {
  const physicalRoot = realpathSync(registration.roots.physicalStorageRoot);
  const expected = resolve(physicalRoot, currentResearchSharePath(logicalRoot));
  ensureInside(physicalRoot, expected, label);
  return expected;
}

function resolveThroughExistingAncestor(path: string): string {
  let cursor = resolve(path);
  const suffix: string[] = [];
  while (!existsSync(cursor)) {
    const parent = dirname(cursor);
    if (parent === cursor) throw new Error(`cannot resolve an existing ancestor for ${path}`);
    suffix.unshift(basename(cursor));
    cursor = parent;
  }
  return join(realpathSync(cursor), ...suffix);
}

function assertExistingPhysicalPath(
  registration: Phase8PlotRegistration,
  logicalRoot: string,
  suppliedPath: string,
  label: string,
): string {
  const expected = realpathSync(expectedPhysicalPath(registration, logicalRoot, label));
  const actual = realpathSync(suppliedPath);
  if (actual !== expected) throw new Error(`${label} does not match the registered physical NAS path`);
  return actual;
}

export function writePhase8PlotDirectory(directory: string, bundle: Phase8PlotBundle, options: { readonly repositoryRoot?: string } = {}): void {
  if (existsSync(directory)) throw new Error(`refusing to overwrite existing plot bundle: ${directory}`);
  const registeredDirectory = expectedPhysicalPath(bundle.registration, bundle.registration.roots.dataLogicalRoot, "registered data directory");
  if (resolveThroughExistingAncestor(directory) !== resolveThroughExistingAncestor(registeredDirectory)) {
    throw new Error("plot bundle directory does not match the registered physical NAS path");
  }
  const parent = dirname(directory);
  mkdirSync(parent, { recursive: true });
  const realParent = realpathSync(parent);
  const resolvedDirectory = join(realParent, basename(directory));
  ensureInside(realParent, resolvedDirectory, "plot bundle directory");
  const registeredParent = realpathSync(dirname(registeredDirectory));
  const resolvedRegisteredDirectory = join(registeredParent, basename(registeredDirectory));
  ensureInside(realpathSync(bundle.registration.roots.physicalStorageRoot), resolvedRegisteredDirectory, "registered data directory");
  if (resolvedDirectory !== resolvedRegisteredDirectory) {
    throw new Error("plot bundle directory does not match the registered physical NAS path");
  }
  if (options.repositoryRoot !== undefined) {
    const repositoryRoot = realpathSync(options.repositoryRoot);
    const relation = relative(repositoryRoot, resolvedDirectory);
    if (relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation))) {
      throw new Error("registered plot row bodies must not be published inside the repository");
    }
  }
  const staging = join(realParent, `.${basename(directory)}.staging-${randomUUID()}`);
  mkdirSync(staging, { recursive: false });
  try {
    for (const [path, bytes] of [...bundle.metadataArtifacts, ...bundle.dataArtifacts]) {
      const target = join(staging, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, bytes, { flag: "wx", mode: 0o600 });
    }
    renameSync(staging, resolvedDirectory);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

function readFiles(root: string, names: readonly string[]): ReadonlyMap<string, Uint8Array> {
  return new Map(names.map((name) => [name, new Uint8Array(readFileSync(join(root, name)))]));
}

function repositoryImplementation(root: string): ReadonlyMap<string, Uint8Array> {
  return new Map(PHASE8_PLOT_IMPLEMENTATION_PATHS.map((path) => [path, new Uint8Array(readFileSync(join(root, path)))]));
}

function parseArguments(argv: readonly string[]): ReadonlyMap<string, string> {
  const allowed = new Set(["repository-root", "source-root", "render-root", "read-a", "read-b", "bundle"]);
  const result = new Map<string, string>();
  if (argv.length % 2 !== 0) throw new Error("arguments must be --name value pairs");
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === undefined || value === undefined || !key.startsWith("--")) throw new Error("arguments must be --name value pairs");
    const name = key.slice(2);
    if (!allowed.has(name) || result.has(name)) throw new Error(`unexpected or duplicate argument: ${key}`);
    result.set(name, value);
  }
  if (result.size !== allowed.size) throw new Error("missing required CLI argument");
  return result;
}

function requiredArgument(argumentsMap: ReadonlyMap<string, string>, name: string): string {
  const value = argumentsMap.get(name);
  if (value === undefined) throw new Error(`missing --${name}`);
  return value;
}

function main(argv: readonly string[]): void {
  if (argv[0] !== "produce") throw new Error("usage: phase8-plot-extraction.ts produce --repository-root ROOT --source-root ROOT --render-root ROOT --read-a FILE --read-b FILE --bundle DIRECTORY");
  const args = parseArguments(argv.slice(1));
  const repositoryRoot = resolve(requiredArgument(args, "repository-root"));
  const registrationBytes = new Uint8Array(readFileSync(join(repositoryRoot, PHASE8_PLOT_OPERATOR_PATH)));
  const registration = parsePhase8PlotRegistration(registrationBytes);
  const sourceRoot = resolve(requiredArgument(args, "source-root"));
  const renderRoot = resolve(requiredArgument(args, "render-root"));
  assertExistingPhysicalPath(registration, registration.roots.sourcePdfLogicalRoot, sourceRoot, "source root");
  assertExistingPhysicalPath(registration, registration.roots.renderLogicalRoot, renderRoot, "render root");
  const bundle = derivePhase8PlotBundle({
    registrationBytes,
    selectionBytes: new Uint8Array(readFileSync(join(repositoryRoot, registration.selection.path))),
    sourcePdfs: readFiles(sourceRoot, registration.sourcePdfs.map((row) => row.fileName)),
    renders: readFiles(renderRoot, registration.renders.map((row) => row.fileName)),
    readABytes: new Uint8Array(readFileSync(resolve(requiredArgument(args, "read-a")))),
    readBBytes: new Uint8Array(readFileSync(resolve(requiredArgument(args, "read-b")))),
    implementation: repositoryImplementation(repositoryRoot),
  });
  const bundleDirectory = resolve(requiredArgument(args, "bundle"));
  writePhase8PlotDirectory(bundleDirectory, bundle, { repositoryRoot });
  process.stdout.write(`${canonicalJson({ state: "published-plot-extraction-candidate", directory: bundleDirectory, counts: bundle.counts })}\n`);
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
