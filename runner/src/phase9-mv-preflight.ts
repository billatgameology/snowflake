/** Phase 9 M-V byte-bound preflight and closed-registry reconstruction. */

import { createHash } from "node:crypto";

import {
  PHASE9_MV_SOURCE_RELATIVE_REGISTRY,
  PHASE9_MV_VENTILATION_CONFOUND_LABEL,
  type Phase9MvInterventionAxis,
  type Phase9MvSourceRelativeRecord,
} from "./phase9-mv-eligibility.js";

export interface Phase9MvArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase9MvShelfRestriction {
  readonly artifactSha256: string;
  readonly id: string;
  readonly kind: string;
  readonly text: string;
}

export interface Phase9MvShelfDisposition extends Phase9MvShelfRestriction {
  readonly localDisposition: "satisfied-for-conservative-bound" | "retained-as-source-block";
  readonly localHandling: string;
}

export interface Phase9MvShelfRow {
  readonly blockerIdentities: readonly string[];
  readonly completeArtifactCount: number;
  readonly completeArtifactSha256: readonly string[];
  readonly item: "M-V";
  readonly protocolDispositionRequired: true;
  readonly protocolDispositionState: "pending";
  readonly protocolRestrictions: readonly Phase9MvShelfRestriction[];
  readonly sourceBlocked: false;
  readonly sourceBlockerIds: readonly string[];
  readonly sourceBlockerPresent: boolean;
  readonly sourceBlockerStatuses: readonly string[];
}

export interface Phase9MvProtocol {
  readonly schema: "phase9-mv-protocol-v1";
  readonly upstreamBindings: {
    readonly sourceOverlay: {
      readonly shelfFreeze: Phase9MvArtifactIdentity;
      readonly shelfItem: "M-V";
      readonly exactShelf: {
        readonly completeArtifactSha256: readonly string[];
        readonly sourceBlocked: false;
        readonly protocolDispositionRequired: true;
        readonly protocolDispositionState: "pending";
        readonly restrictionDispositions: readonly Phase9MvShelfDisposition[];
      };
      readonly missingSourceAlternative: {
        readonly blockerId: "P9B-MISSING-KH82";
        readonly identity: string;
        readonly status: "arm-freeze-blocked";
        readonly localDisposition: "conservative-bound-only";
        readonly clearedScope: "M-V compatibility design only";
        readonly retainedBlocks: readonly ["M-PT", "M-LH", "quantitative-velocity-response"];
      };
    };
    readonly phase8bSuccessor: Phase9MvArtifactIdentity;
    readonly phase8bPlotMetadata: Phase9MvArtifactIdentity;
  };
  readonly sourceRelativeRegistry: readonly Phase9MvSourceRelativeRecord[];
  readonly absoluteEligibility: {
    readonly state: "blocked-no-byte-bound-consuming-arm-record";
    readonly eligibleCount: 0;
    readonly analyticReynoldsHelperRole: "diagnostic-only";
    readonly missingDimensions: readonly string[];
  };
  readonly sd71AbsoluteCensus: {
    readonly expectedSelectionIds: readonly string[];
    readonly expectedCarrierGasCounts: {
      readonly heliumArgonMixture: 6;
      readonly heliumAtReducedPressure: 4;
      readonly air: 0;
    };
    readonly expectedAbsoluteEligibleCount: 0;
    readonly reason: "all-non-air-no-maximum-Re-and-no-complete-protocol-record";
  };
}

export interface Phase9MvSd71Census {
  readonly selectionCount: 10;
  readonly heliumArgonMixtureCount: number;
  readonly heliumAtReducedPressureCount: number;
  readonly airCount: number;
  readonly maximumReynoldsBoundCount: number;
  readonly absoluteEligibleCount: 0;
  readonly selectionIds: readonly string[];
  readonly sourceRelativeRegistry: readonly Phase9MvSourceRelativeRecord[];
}

export const PHASE9_MV_REQUIRED_MISSING_DIMENSIONS = Object.freeze([
  "P8X-T91-PROT-04: source-scored time must be within 180-1800 s",
  "P8X-T91-PROT-05: temperature uncertainty and interval history",
  "P8X-T91-PROT-08: droplet-size distribution and liquid-water content",
  "P8X-T91-PROT-09: unsupported during growth and oil-held only after collection",
  "P8X-T91-PROT-10: habit-specific measurement and a-axis semantics",
  "P8X-T91-PROT-11: hot-wire/strip-chart speed method and plus-or-minus 0.03 m/s accuracy",
  "P8X-T91-PROT-13: temperature-specific riming-free duration",
  "byte-bound interval-wide air-density upper bound",
  "byte-bound interval-wide dynamic-viscosity lower bound",
  "byte-bound interval-wide fall-speed upper envelope",
  "byte-bound interval-wide a-axis upper envelope",
] as const);

export const PHASE9_MV_PREFLIGHT_MUTATIONS = Object.freeze([
  "shelf-byte-change",
  "shelf-source-blocked-change",
  "shelf-disposition-required-change",
  "shelf-disposition-state-change",
  "shelf-restriction-change",
  "restriction-local-disposition-missing",
  "missing-source-alternative-change",
  "successor-byte-change",
  "plot-metadata-byte-change",
  "SD71-row-missing",
  "SD71-row-added",
  "SD71-carrier-gas-change",
  "SD71-axis-binding-change",
  "SD71-metadata-record-artifact-change",
  "SD71-row-artifact-change",
  "SD71-coherent-row-artifact-forgery",
  "SD71-coherent-row-byte-length-forgery",
  "SD71-row-artifact-extra-key",
  "SD71-maximum-Re-injected",
  "absolute-block-state-change",
] as const);

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function same(left: unknown, right: unknown): boolean {
  if (left === null || typeof left !== "object") return Object.is(left, right);
  if (Array.isArray(left)) return Array.isArray(right) && left.length === right.length && left.every((value, index) => same(value, right[index]));
  if (right === null || Array.isArray(right) || typeof right !== "object") return false;
  const a = left as Record<string, unknown>;
  const b = right as Record<string, unknown>;
  const keys = Object.keys(a).sort();
  return same(keys, Object.keys(b).sort()) && keys.every((key) => same(a[key], b[key]));
}

function fail(message: string): never {
  throw new Error(`M-V preflight refused: ${message}`);
}

function identity(bytes: Uint8Array, pin: Phase9MvArtifactIdentity): void {
  if (bytes.byteLength !== pin.byteLength || sha256(bytes) !== pin.sha256) {
    fail(`${pin.path} byte/hash pin differs`);
  }
}

function json(bytes: Uint8Array, label: string): unknown {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} is not UTF-8`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    fail(`${label} is not JSON`);
  }
}

function jsonl(bytes: Uint8Array, label: string): readonly Record<string, unknown>[] {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} is not UTF-8`);
  }
  if (!text.endsWith("\n") || text.includes("\r")) fail(`${label} must be LF-terminated`);
  return text.slice(0, -1).split("\n").map((line, index) => {
    let value: unknown;
    try {
      value = JSON.parse(line) as unknown;
    } catch {
      fail(`${label} row ${index + 1} is not JSON`);
    }
    if (value === null || Array.isArray(value) || typeof value !== "object") fail(`${label} row ${index + 1} is not an object`);
    return value as Record<string, unknown>;
  });
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") fail(`${label} is not an object`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  if (!same(Object.keys(value).sort(), [...keys].sort())) fail(`${label} keys differ`);
}

function validateShelf(protocol: Phase9MvProtocol, bytes: Uint8Array): void {
  identity(bytes, protocol.upstreamBindings.sourceOverlay.shelfFreeze);
  const published = json(bytes, "S0B shelf freeze") as { schema?: unknown; shelf?: unknown };
  if (published.schema !== "phase9-source-shelf-freeze-v1" || !Array.isArray(published.shelf)) fail("S0B shelf schema differs");
  const row = published.shelf.find((entry) => entry !== null && typeof entry === "object" && (entry as { item?: unknown }).item === "M-V") as Phase9MvShelfRow | undefined;
  if (row === undefined) fail("S0B shelf has no M-V row");
  const expected = protocol.upstreamBindings.sourceOverlay.exactShelf;
  if (
    row.sourceBlocked !== false ||
    row.protocolDispositionRequired !== true ||
    row.protocolDispositionState !== "pending" ||
    expected.sourceBlocked !== false ||
    expected.protocolDispositionRequired !== true ||
    expected.protocolDispositionState !== "pending" ||
    !row.sourceBlockerPresent ||
    !same(row.sourceBlockerIds, ["P9B-MISSING-KH82"]) ||
    !same(row.sourceBlockerStatuses, ["arm-freeze-blocked"])
  ) {
    fail("S0B M-V source-blocker state differs");
  }
  if (!same(row.completeArtifactSha256, expected.completeArtifactSha256) || row.completeArtifactCount !== 9) fail("S0B M-V complete artifact set differs");
  const dispositions = expected.restrictionDispositions;
  if (dispositions.length !== 14 || new Set(dispositions.map((entry) => entry.id)).size !== 14) fail("protocol must disposition 14 unique M-V restrictions");
  for (const entry of dispositions) {
    if (entry.localDisposition !== "satisfied-for-conservative-bound" && entry.localDisposition !== "retained-as-source-block") {
      fail(`${entry.id} has an unrecognized local disposition`);
    }
    if (typeof entry.localHandling !== "string" || entry.localHandling.trim().length === 0) fail(`${entry.id} lacks local handling`);
  }
  const stripped = dispositions.map(({ localDisposition: _localDisposition, localHandling: _localHandling, ...entry }) => entry);
  if (!same(row.protocolRestrictions, stripped)) fail("S0B M-V restrictions differ from local dispositions");
  const blocker = protocol.upstreamBindings.sourceOverlay.missingSourceAlternative;
  if (
    blocker.blockerId !== "P9B-MISSING-KH82" ||
    blocker.identity !== "Keller and Hallett 1982, DOI 10.1016/0022-0248(82)90176-2" ||
    blocker.status !== "arm-freeze-blocked" ||
    blocker.localDisposition !== "conservative-bound-only" ||
    blocker.clearedScope !== "M-V compatibility design only" ||
    !same(blocker.retainedBlocks, ["M-PT", "M-LH", "quantitative-velocity-response"])
  ) fail("missing controlled-velocity source alternative differs");
  if (!same(row.blockerIdentities, [blocker.identity])) fail("S0B M-V blocker identity differs from the local alternative");
}

function deriveAxis(conditions: Record<string, unknown>, selectionId: string): Phase9MvInterventionAxis {
  const thermalAxis = conditions.carrierGas === "helium-argon mixture" &&
    conditions.fixedReportedVaporDiffusivityCm2PerS === 0.77 &&
    !("fixedThermalConductivityReported" in conditions);
  const vaporAxis = conditions.carrierGas === "helium at reduced pressure" &&
    conditions.fixedThermalConductivityReported === 34.4 &&
    conditions.fixedThermalConductivityUnit === "1e-5 cal cm^-1 s^-1 deg^-1" &&
    !("fixedReportedVaporDiffusivityCm2PerS" in conditions);
  if (thermalAxis === vaporAxis) fail(`${selectionId} intervention-axis conditions differ`);
  return thermalAxis ? "carrier-gas-thermal-conductivity" : "reported-vapor-diffusivity";
}

function reconstructRegistry(
  successor: readonly Record<string, unknown>[],
  metadata: readonly Record<string, unknown>[],
  expectedIds: readonly string[],
  metadataIdentity: Phase9MvArtifactIdentity,
): readonly Phase9MvSourceRelativeRecord[] {
  const successorById = new Map(successor.map((row) => [row.selectionId, row]));
  const metadataById = new Map(metadata.map((row) => [row.selectionId, row]));
  return expectedIds.map((selectionId) => {
    const successorRow = successorById.get(selectionId);
    const metadataRow = metadataById.get(selectionId);
    if (successorRow === undefined || metadataRow === undefined) fail(`${selectionId} is absent from successor or metadata`);
    if (
      successorRow.schema !== "phase8b-successor-target-record-v1" ||
      successorRow.phase9EvidenceRole !== "model-development" ||
      successorRow.split !== "development" ||
      metadataRow.schema !== "phase8b-plot-series-record-v1" ||
      metadataRow.phase9EvidenceRole !== "model-development" ||
      metadataRow.lineageId !== "gonda-komabayasi-1971-campaign" ||
      metadataRow.operator !== "phase8b-adjudicated-plot-digitization-v3" ||
      metadataRow.expectedPointCount !== 5
    ) fail(`${selectionId} source identity fields differ`);
    const binding = record(successorRow.binding, `${selectionId} successor binding`);
    const metadataRowArtifact = record(metadataRow.rowArtifact, `${selectionId} metadata row artifact`);
    exactKeys(metadataRowArtifact, ["bytes", "path", "rowCount", "sha256"], `${selectionId} metadata row artifact`);
    const rowArtifactSha256 = metadataRowArtifact.sha256;
    if (
      typeof rowArtifactSha256 !== "string" ||
      !/^[0-9a-f]{64}$/u.test(rowArtifactSha256) ||
      typeof metadataRowArtifact.bytes !== "number" ||
      !Number.isSafeInteger(metadataRowArtifact.bytes) ||
      (metadataRowArtifact.bytes as number) <= 0 ||
      metadataRowArtifact.path !== `rows/${selectionId}.jsonl` ||
      metadataRowArtifact.rowCount !== 5
    ) fail(`${selectionId} metadata row artifact differs`);
    const expectedBinding = {
      kind: "digitized-plot-series",
      metadataRecordArtifact: {
        byteLength: metadataIdentity.byteLength,
        format: "canonical-jsonl",
        path: metadataIdentity.path,
        sha256: metadataIdentity.sha256,
      },
      metadataRecordId: selectionId,
      rowArtifact: {
        byteLength: metadataRowArtifact.bytes,
        logicalRoot: "research-cache/phase8b-derived/plot-extraction-20260812-v3",
        path: metadataRowArtifact.path,
        rowCount: metadataRowArtifact.rowCount,
        sha256: rowArtifactSha256,
      },
    };
    if (!same(binding, expectedBinding)) fail(`${selectionId} successor/metadata artifact binding differs`);
    const conditions = record(metadataRow.conditions, `${selectionId} conditions`);
    if (
      conditions.growthMode !== "gravity fall" ||
      conditions.humidityReference !== "saturation over water during persistent supercooled fog" ||
      conditions.photoTimeAfterSeedingSeconds !== 40 ||
      (conditions.temperatureC !== -15 && conditions.temperatureC !== -7)
    ) fail(`${selectionId} protocol conditions differ`);
    const uncertainty = record(metadataRow.sourceUncertainty, `${selectionId} source uncertainty`);
    if (
      uncertainty.verticalBarSemantics !== "top is one-quarter and bottom is three-quarters in descending observation order; not SE or CI" ||
      uncertainty.sampleDenominator !== "not reported" ||
      uncertainty.formalStatisticalUncertainty !== "not reported"
    ) fail(`${selectionId} order-span semantics differ`);
    return {
      sourceRecordId: selectionId,
      rowArtifactIdentity: {
        bytes: metadataRowArtifact.bytes as number,
        byteLength: metadataRowArtifact.bytes as number,
        path: metadataRowArtifact.path as string,
        rowCount: metadataRowArtifact.rowCount as number,
        sha256: rowArtifactSha256,
      },
      interventionAxis: deriveAxis(conditions, selectionId),
      orderSpanSemantics: "source-order-span-not-confidence-interval",
      ventilationConfoundLabel: PHASE9_MV_VENTILATION_CONFOUND_LABEL,
    };
  });
}

/**
 * Re-derive the exact SD71 census and the only positive source-relative
 * registry from the frozen bytes. Absolute eligibility remains zero.
 */
export function phase9MvPreflight(
  protocol: Phase9MvProtocol,
  shelfFreezeBytes: Uint8Array,
  successorBytes: Uint8Array,
  plotMetadataBytes: Uint8Array,
): Phase9MvSd71Census {
  if (protocol.schema !== "phase9-mv-protocol-v1") fail("protocol schema differs");
  validateShelf(protocol, shelfFreezeBytes);
  identity(successorBytes, protocol.upstreamBindings.phase8bSuccessor);
  identity(plotMetadataBytes, protocol.upstreamBindings.phase8bPlotMetadata);
  if (
    protocol.absoluteEligibility.state !== "blocked-no-byte-bound-consuming-arm-record" ||
    protocol.absoluteEligibility.eligibleCount !== 0 ||
    protocol.absoluteEligibility.analyticReynoldsHelperRole !== "diagnostic-only" ||
    !same(protocol.absoluteEligibility.missingDimensions, PHASE9_MV_REQUIRED_MISSING_DIMENSIONS)
  ) fail("absolute eligibility block differs");

  const successor = jsonl(successorBytes, "Phase 8B successor");
  const metadata = jsonl(plotMetadataBytes, "Phase 8B plot metadata");
  const selectedSuccessor = successor.filter((row) => typeof row.selectionId === "string" && /^P8B-P1-SD71-M/u.test(row.selectionId));
  const selectedMetadata = metadata.filter((row) => typeof row.selectionId === "string" && /^P8B-P1-SD71-M/u.test(row.selectionId));
  const expectedIds = protocol.sd71AbsoluteCensus.expectedSelectionIds;
  const actualIds = selectedMetadata.map((row) => row.selectionId as string);
  if (!same(actualIds, expectedIds) || selectedSuccessor.length !== 10 || selectedMetadata.length !== 10) fail("exact SD71 ten-row roster differs");

  const reconstructed = reconstructRegistry(
    selectedSuccessor,
    selectedMetadata,
    expectedIds,
    protocol.upstreamBindings.phase8bPlotMetadata,
  );
  if (!same(reconstructed, PHASE9_MV_SOURCE_RELATIVE_REGISTRY) || !same(protocol.sourceRelativeRegistry, reconstructed)) {
    fail("SD71 source-relative closed registry differs");
  }

  let heliumArgonMixtureCount = 0;
  let heliumAtReducedPressureCount = 0;
  let airCount = 0;
  let maximumReynoldsBoundCount = 0;
  for (const row of selectedMetadata) {
    const conditions = record(row.conditions, `${row.selectionId as string} conditions`);
    const carrierGas = conditions.carrierGas;
    if (carrierGas === "helium-argon mixture") heliumArgonMixtureCount += 1;
    else if (carrierGas === "helium at reduced pressure") heliumAtReducedPressureCount += 1;
    else if (carrierGas === "air") airCount += 1;
    else fail(`${row.selectionId as string} carrier gas is unrecognized`);
    if (Object.keys(conditions).some((key) => /reynolds|(?:^|[-_])re(?:$|[-_])/iu.test(key))) {
      maximumReynoldsBoundCount += 1;
    }
  }
  const counts = protocol.sd71AbsoluteCensus.expectedCarrierGasCounts;
  if (
    heliumArgonMixtureCount !== counts.heliumArgonMixture ||
    heliumAtReducedPressureCount !== counts.heliumAtReducedPressure ||
    airCount !== counts.air ||
    maximumReynoldsBoundCount !== 0 ||
    protocol.sd71AbsoluteCensus.expectedAbsoluteEligibleCount !== 0 ||
    protocol.sd71AbsoluteCensus.reason !== "all-non-air-no-maximum-Re-and-no-complete-protocol-record"
  ) fail("SD71 M-V absolute-ineligibility census differs");
  return {
    selectionCount: 10,
    heliumArgonMixtureCount,
    heliumAtReducedPressureCount,
    airCount,
    maximumReynoldsBoundCount,
    absoluteEligibleCount: 0,
    selectionIds: actualIds,
    sourceRelativeRegistry: reconstructed,
  };
}
