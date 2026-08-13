/** Development-only M-H/M-SR feature foundation. It cannot score or promote a model. */
export const PHASE9_MH_MSR_PROTOCOL_ID = "phase9-mh-msr-prescore-foundation-v1" as const;

export type Phase9PathSemantics =
  | "resolved-physical-forcing"
  | "source-relative-label"
  | "external-condition";

export const PHASE9_MH_REGISTERED_PATHS = Object.freeze({
  "MH-I57-F09-EXTERNAL-GAS-PATH": Object.freeze({
    sourceRecordId: "P8B-S2R0-2E44238CA51A5DEC2FB1D048",
    selectionId: null,
    provenance: "MGP-I57-F09-TIMELINE/directTranscription.panels",
    semantics: "external-condition",
    timeUnit: "min",
    valueUnit: "carrier-gas-identity",
    coordinateStatus: "direct-printed-panel-timeline",
    samples: Object.freeze([
      Object.freeze({ time: 0, value: "air" }),
      Object.freeze({ time: 24, value: "air" }),
      Object.freeze({ time: 54, value: "air" }),
      Object.freeze({ time: 95, value: "air" }),
      Object.freeze({ time: 140, value: "hydrogen" }),
      Object.freeze({ time: 181, value: "hydrogen" }),
      Object.freeze({ time: 184, value: "hydrogen" }),
      Object.freeze({ time: 189, value: "hydrogen" }),
      Object.freeze({ time: 221, value: "hydrogen" }),
      Object.freeze({ time: 224, value: "air" }),
      Object.freeze({ time: 226, value: "air" }),
      Object.freeze({ time: 232, value: "air" }),
      Object.freeze({ time: 245, value: "air" }),
      Object.freeze({ time: 255, value: "hydrogen" }),
      Object.freeze({ time: 261, value: "hydrogen" }),
      Object.freeze({ time: 267, value: "hydrogen" }),
      Object.freeze({ time: 289, value: "hydrogen" }),
      Object.freeze({ time: 295, value: "air" }),
      Object.freeze({ time: 299, value: "air" }),
      Object.freeze({ time: 318, value: "air" }),
    ]),
    endpoint: Object.freeze({ startValue: "air", endValue: "air" }),
  }),
  "MH-I57-F10-EXTERNAL-GAS-PATH": Object.freeze({
    sourceRecordId: "P8B-S2R0-2E44238CA51A5DEC2FB1D048",
    selectionId: null,
    provenance: "MGP-I57-F10-TIMELINE/directTranscription.panels",
    semantics: "external-condition",
    timeUnit: "min",
    valueUnit: "carrier-gas-identity",
    coordinateStatus: "direct-printed-panel-timeline",
    samples: Object.freeze([
      Object.freeze({ time: 0, value: "air" }),
      Object.freeze({ time: 13, value: "air" }),
      Object.freeze({ time: 26, value: "air" }),
      Object.freeze({ time: 28, value: "air" }),
      Object.freeze({ time: 32, value: "air" }),
      Object.freeze({ time: 36, value: "air" }),
      Object.freeze({ time: 38, value: "air" }),
      Object.freeze({ time: 47, value: "air" }),
      Object.freeze({ time: 65, value: "air" }),
      Object.freeze({ time: 75, value: "hydrogen" }),
      Object.freeze({ time: 82, value: "hydrogen" }),
      Object.freeze({ time: 89, value: "hydrogen" }),
      Object.freeze({ time: 93, value: "hydrogen" }),
      Object.freeze({ time: 98, value: "hydrogen" }),
      Object.freeze({ time: 151, value: "hydrogen" }),
      Object.freeze({ time: 214, value: "air" }),
      Object.freeze({ time: 243, value: "air" }),
      Object.freeze({ time: 255, value: "air" }),
    ]),
    endpoint: Object.freeze({ startValue: "air", endValue: "air" }),
  }),
  "MH-HP26-20240814-LABEL-PATH": Object.freeze({
    sourceRecordId: "P9K-HP26",
    selectionId: "P8B-NATIVE-DIMENSIONS-20240814",
    provenance: "P8B-NATIVE-DIMENSIONS-20240814/conditions.forcingEvent",
    semantics: "source-relative-label",
    timeUnit: "s",
    valueUnit: "source-reported-percent-label-unresolved-basis",
    coordinateStatus: "registered-event-boundary-no-observation-at-event",
    samples: Object.freeze([
      Object.freeze({ time: 0, value: 48 }),
      Object.freeze({ time: 13_800, value: 20 }),
    ]),
    endpoint: Object.freeze({ startValue: 48, endValue: 20 }),
  }),
} as const);

export type Phase9RegisteredPathId = keyof typeof PHASE9_MH_REGISTERED_PATHS;

export interface Phase9PathSample {
  readonly time: number;
  readonly value: number | string;
}

export interface Phase9PathInput {
  readonly purpose: "registered-categorical-path-diagnostic";
  readonly registryRecordId: Phase9RegisteredPathId;
  readonly sourceRecordId: string;
  readonly selectionId: string | null;
  readonly provenance: string;
  readonly semantics: Phase9PathSemantics;
  readonly timeUnit: "min" | "s";
  readonly valueUnit: "carrier-gas-identity" | "source-reported-percent-label-unresolved-basis";
  readonly coordinateStatus:
    | "direct-printed-panel-timeline"
    | "registered-event-boundary-no-observation-at-event";
  readonly samples: readonly Phase9PathSample[];
  readonly endpoint: {
    readonly startValue: number | string;
    readonly endValue: number | string;
  };
}

export interface Phase9PathFeatureResult {
  readonly status: "registered-categorical-path-feature-only";
  readonly registryRecordId: Phase9RegisteredPathId;
  readonly sourceRecordId: string;
  readonly selectionId: string | null;
  readonly semantics: "source-relative-label" | "external-condition";
  readonly timeUnit: "min" | "s";
  readonly valueUnit: string;
  readonly coordinateStatus: string;
  readonly changePoints: readonly {
    readonly time: number;
    readonly from: number | string;
    readonly to: number | string;
  }[];
  readonly endpointAgreement: true;
  readonly endpointErasesIntermediatePath: boolean;
  readonly physicalForcingPathResolved: false;
  readonly modelReplayEligible: false;
  readonly sourceDataScoreProduced: false;
  readonly modelScoreProduced: false;
  readonly hiddenMemoryInferred: false;
  readonly causalInferenceAuthorized: false;
  readonly physicalPromotionEligible: false;
  readonly threeDimensionalWorkAuthorized: false;
  readonly grantsValidationClaim: false;
}

function exactKeys(value: unknown, expected: readonly string[], label: string): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const registered = [...expected].sort();
  if (actual.length !== registered.length ||
      actual.some((key, index) => key !== registered[index])) {
    throw new Error(`${label} fields must match the registered schema exactly`);
  }
}

function sameValue(left: number | string, right: number | string): boolean {
  return typeof left === typeof right && Object.is(left, right);
}

function hasOnlyDenseArrayIndices(value: readonly unknown[]): boolean {
  const keys = Object.keys(value);
  if (keys.length !== value.length) return false;
  for (let index = 0; index < value.length; index += 1) {
    if (keys[index] !== String(index) || !Object.hasOwn(value, index)) return false;
  }
  return true;
}

/**
 * Replays only exact registered categorical paths. No byte-bound physical forcing fixture is
 * locally available, so resolved physical forcing is refused rather than caller-attested.
 */
export function phase9MhPathFeatures(input: Phase9PathInput): Phase9PathFeatureResult {
  exactKeys(input, [
    "purpose", "registryRecordId", "sourceRecordId", "selectionId", "provenance",
    "semantics", "timeUnit", "valueUnit", "coordinateStatus", "samples", "endpoint",
  ], "path input");
  if (input.purpose !== "registered-categorical-path-diagnostic") {
    throw new Error("path purpose is not registered");
  }
  if (input.semantics === "resolved-physical-forcing") {
    throw new Error("resolved physical forcing is unavailable without a byte-bound registered fixture");
  }
  if (input.semantics !== "external-condition" && input.semantics !== "source-relative-label") {
    throw new Error("unknown path semantics");
  }
  const fixture = PHASE9_MH_REGISTERED_PATHS[input.registryRecordId];
  if (fixture === undefined) throw new Error("unrecognized registered categorical path");
  if (input.sourceRecordId !== fixture.sourceRecordId ||
      input.selectionId !== fixture.selectionId || input.provenance !== fixture.provenance ||
      input.semantics !== fixture.semantics || input.timeUnit !== fixture.timeUnit ||
      input.valueUnit !== fixture.valueUnit || input.coordinateStatus !== fixture.coordinateStatus) {
    throw new Error("path identity, provenance, semantics, units, or coordinate status changed");
  }
  if (!Array.isArray(input.samples) || !hasOnlyDenseArrayIndices(input.samples) ||
      input.samples.length !== fixture.samples.length) {
    throw new Error("path samples must match the exact registered fixture");
  }
  for (let index = 0; index < input.samples.length; index += 1) {
    const sample = input.samples[index];
    const registered = fixture.samples[index];
    exactKeys(sample, ["time", "value"], `samples[${index}]`);
    if (sample === undefined || registered === undefined ||
        !Number.isFinite(sample.time) || sample.time !== registered.time ||
        !sameValue(sample.value, registered.value)) {
      throw new Error("path samples must match the exact registered fixture");
    }
  }
  exactKeys(input.endpoint, ["startValue", "endValue"], "path endpoint");
  if (!sameValue(input.endpoint.startValue, fixture.endpoint.startValue) ||
      !sameValue(input.endpoint.endValue, fixture.endpoint.endValue)) {
    throw new Error("endpoint representation disagrees with the exact registered path");
  }
  const changePoints: Array<{ time: number; from: number | string; to: number | string }> = [];
  for (let index = 1; index < input.samples.length; index += 1) {
    const previous = input.samples[index - 1];
    const sample = input.samples[index];
    if (previous !== undefined && sample !== undefined && !sameValue(previous.value, sample.value)) {
      changePoints.push({ time: sample.time, from: previous.value, to: sample.value });
    }
  }
  const endpointTransitionCount = sameValue(
    input.endpoint.startValue,
    input.endpoint.endValue,
  ) ? 0 : 1;
  return Object.freeze({
    status: "registered-categorical-path-feature-only",
    registryRecordId: input.registryRecordId,
    sourceRecordId: input.sourceRecordId,
    selectionId: input.selectionId,
    semantics: input.semantics,
    timeUnit: input.timeUnit,
    valueUnit: input.valueUnit,
    coordinateStatus: input.coordinateStatus,
    changePoints: Object.freeze(changePoints.map((point) => Object.freeze(point))),
    endpointAgreement: true,
    endpointErasesIntermediatePath: changePoints.length > endpointTransitionCount,
    physicalForcingPathResolved: false,
    modelReplayEligible: false,
    sourceDataScoreProduced: false,
    modelScoreProduced: false,
    hiddenMemoryInferred: false,
    causalInferenceAuthorized: false,
    physicalPromotionEligible: false,
    threeDimensionalWorkAuthorized: false,
    grantsValidationClaim: false,
  });
}

export const PHASE9_MSR_REGISTERED_CODEBOOKS = Object.freeze({
  "MSR-V18-CYCLE-CATEGORIES": Object.freeze({
    sourceRecordId: "P8B-S2R0-8062802F15B237ED51D0ABD9",
    provenance: "phase9-mh-msr-registry-v1/MSR-V18-CYCLE-CATEGORIES",
    observableCodebook: Object.freeze(["smooth", "rough", "growth", "sublimation", "regrowth"]),
  }),
  "MSR-NS19-LATERAL-CATEGORIES": Object.freeze({
    sourceRecordId: "P8B-S2R0-84BDC4F49DB156160B52C688",
    provenance: "phase9-mh-msr-registry-v1/MSR-NS19-LATERAL-CATEGORIES",
    observableCodebook: Object.freeze([
      "rounded", "faceted", "corner-pocketed", "center-pocketed", "terraced", "regrowth",
    ]),
  }),
  "MSR-M14-SURFACE-CATEGORIES": Object.freeze({
    sourceRecordId: "P8B-S2R0-1A0709A42E70AD507E83239A",
    provenance: "phase9-mh-msr-registry-v1/MSR-M14-SURFACE-CATEGORIES",
    observableCodebook: Object.freeze([
      "rough", "ridged", "scalloped", "stalled", "growth", "equilibrium", "sublimation",
      "regrowth",
    ]),
  }),
} as const);

export type Phase9MsrRegistryRecordId = keyof typeof PHASE9_MSR_REGISTERED_CODEBOOKS;

export interface Phase9ObservableSurfaceInput {
  readonly purpose: "registered-categorical-codebook-diagnostic";
  readonly registryRecordId: Phase9MsrRegistryRecordId;
  readonly sourceRecordId: string;
  readonly provenance: string;
  readonly observableCodebook: readonly string[];
  readonly timeUnit: "unavailable";
  readonly coordinateStatus: "no-registered-numeric-trajectory";
  readonly observations: readonly never[];
}

function sameDenseStrings(actual: readonly string[], expected: readonly string[]): boolean {
  if (actual.length !== expected.length || !hasOnlyDenseArrayIndices(actual)) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (!Object.hasOwn(actual, index) || actual[index] !== expected[index]) return false;
  }
  return true;
}

/** Returns only an exact registered codebook; no caller-produced observation trajectory is accepted. */
export function phase9MsrObservableFeatures(input: Phase9ObservableSurfaceInput) {
  exactKeys(input, [
    "purpose", "registryRecordId", "sourceRecordId", "provenance", "observableCodebook",
    "timeUnit", "coordinateStatus", "observations",
  ], "surface-category input");
  const fixture = PHASE9_MSR_REGISTERED_CODEBOOKS[input.registryRecordId];
  if (fixture === undefined) throw new Error("unrecognized registered surface codebook");
  if (input.purpose !== "registered-categorical-codebook-diagnostic" ||
      input.sourceRecordId !== fixture.sourceRecordId || input.provenance !== fixture.provenance ||
      input.timeUnit !== "unavailable" ||
      input.coordinateStatus !== "no-registered-numeric-trajectory" ||
      !Array.isArray(input.observableCodebook) ||
      !sameDenseStrings(input.observableCodebook, fixture.observableCodebook)) {
    throw new Error("surface source, provenance, codebook, units, or coordinate status changed");
  }
  if (!Array.isArray(input.observations) || !hasOnlyDenseArrayIndices(input.observations) ||
      input.observations.length !== 0) {
    throw new Error("surface transitions require a separately registered numeric trajectory");
  }
  return Object.freeze({
    status: "registered-categorical-codebook-only" as const,
    registryRecordId: input.registryRecordId,
    sourceRecordId: input.sourceRecordId,
    observableCodebook: fixture.observableCodebook,
    timeUnit: "unavailable" as const,
    coordinateStatus: "no-registered-numeric-trajectory" as const,
    changes: Object.freeze([]),
    hiddenState: null,
    relaxationTimescale: null,
    numericRoughnessScore: null,
    sourceDataScoreProduced: false as const,
    modelScoreProduced: false as const,
    hiddenMemoryInferred: false as const,
    causalInferenceAuthorized: false as const,
    physicalPromotionEligible: false as const,
    threeDimensionalWorkAuthorized: false as const,
    grantsValidationClaim: false as const,
  });
}

export interface Phase9MemoryPrerequisites {
  readonly purpose: "memory-identifiability-prerequisite-check";
  readonly exactPhysicalForcingPathResolved: boolean;
  readonly matchedResolvedEndpoint: boolean;
  readonly postEventRelaxationObserved: boolean;
  readonly transportAndGeometryResolved: boolean;
  readonly namedObservableState: string | null;
}

/** Fails closed: even complete prerequisites require a separately registered stateful protocol. */
export function phase9MhMemoryEligibility(input: Phase9MemoryPrerequisites) {
  exactKeys(input, [
    "purpose", "exactPhysicalForcingPathResolved", "matchedResolvedEndpoint",
    "postEventRelaxationObserved", "transportAndGeometryResolved", "namedObservableState",
  ], "memory prerequisite input");
  if (input.purpose !== "memory-identifiability-prerequisite-check") {
    throw new Error("memory prerequisite purpose is not registered");
  }
  for (const [name, value] of [
    ["exactPhysicalForcingPathResolved", input.exactPhysicalForcingPathResolved],
    ["matchedResolvedEndpoint", input.matchedResolvedEndpoint],
    ["postEventRelaxationObserved", input.postEventRelaxationObserved],
    ["transportAndGeometryResolved", input.transportAndGeometryResolved],
  ] as const) {
    if (typeof value !== "boolean") throw new Error(`${name} must be an exact boolean`);
  }
  if (input.namedObservableState !== null &&
      (typeof input.namedObservableState !== "string" || input.namedObservableState.trim().length === 0)) {
    throw new Error("namedObservableState must be null or a nonempty non-whitespace string");
  }
  const missing: string[] = [];
  if (!input.exactPhysicalForcingPathResolved) missing.push("EXACT_PHYSICAL_FORCING_PATH_MISSING");
  if (!input.matchedResolvedEndpoint) missing.push("MATCHED_RESOLVED_ENDPOINT_MISSING");
  if (!input.postEventRelaxationObserved) missing.push("POST_EVENT_RELAXATION_MISSING");
  if (!input.transportAndGeometryResolved) missing.push("TRANSPORT_OR_GEOMETRY_UNRESOLVED");
  if (input.namedObservableState === null) missing.push("NAMED_OBSERVABLE_STATE_MISSING");
  return Object.freeze({
    status: missing.length === 0 ? "future-protocol-required" as const : "non-identifiable" as const,
    reasonCodes: Object.freeze(missing),
    hiddenState: null,
    hiddenMemoryInferred: false as const,
    sourceDataScoreProduced: false as const,
    modelScoreProduced: false as const,
    physicalPromotionEligible: false as const,
    causalInferenceAuthorized: false as const,
    threeDimensionalWorkAuthorized: false as const,
    grantsValidationClaim: false as const,
  });
}
