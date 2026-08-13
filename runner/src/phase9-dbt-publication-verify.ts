// Independent Phase 9 D-BT publication verifier.
//
// This file intentionally does not import the D-BT producer, model, or launch-preflight modules.
// It owns a second TSV parser, source-binding checks, interpolation, physical formulas, RK4
// integration, fold fitting, sensitivity arithmetic, verdict derivation, artifact construction,
// and mutation harness. Agreement is obtained only by comparing independently reconstructed bytes.

import {
  lstatSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { inflateRawSync } from "node:zlib";
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  detectPhase9NasRoot,
  resolvePhase9NasFile,
} from "./phase9-nas.ts";

const FILES = [
  "artifact-index.json",
  "launch-manifest.json",
  "report.json",
  "scores.jsonl",
  "source-diagnostics.jsonl",
] as const;

const CONTROL_IDS = [
  "source-overlay-blocked",
  "source-overlay-blocker-present",
  "source-overlay-blocker-id-injected",
  "source-overlay-restriction-change",
  "local-discharge-missing",
  "source-byte-change",
  "roster-shift",
  "heldout-leakage",
  "pooled-point-loss",
  "time-endpoint-shift",
  "drive-semantics-swap",
  "monotonic-observation-filter",
  "coefficient-change",
  "verdict-change",
  "protocol-code-or-test-byte-change",
] as const;

const PREFLIGHT_MUTATIONS = [
  "source-byte-change",
  "roster-shift",
  "condition-shift",
  "grid-shift-or-t500",
  "source-overlay-blocked",
  "source-overlay-blocker-present",
  "source-overlay-blocker-id-injected",
  "source-overlay-restriction-change",
  "local-discharge-missing",
  "adapter-registry-byte-change",
  "adapter-mapping-change",
  "protocol-code-or-test-byte-change",
  "monotonic-observation-filter",
  "coefficient-change",
  "verdict-change",
] as const;

const PATHS = {
  protocol: "research/phase9-dbt-protocol-v1.json",
  model: "runner/src/phase9-dbt-model.ts",
  modelTest: "runner/test/phase9-dbt-model.test.ts",
  preflight: "runner/src/phase9-dbt-preflight.ts",
  preflightTest: "runner/test/phase9-dbt-preflight.test.ts",
  producer: "runner/src/phase9-dbt-publication.ts",
  independentVerifier: "runner/src/phase9-dbt-publication-verify.ts",
  publicationTest: "runner/test/phase9-dbt-publication.test.ts",
  adapterRegistry: "research/phase9-adapter-registry-v1.jsonl",
  successorBook: "evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl",
  nativeRecords: "evidence/phase8b-native-histories-v1/records.jsonl",
} as const;

const FROZEN_PROTOCOL_IDENTITY = Object.freeze({
  path: PATHS.protocol,
  byteLength: 37_190,
  sha256: "43cb25b802d7f088fc3e4259e7d5455ca2172d439f84bf8040631de5c23c9943",
});

const C = Object.freeze({
  celsiusZeroK: 273.15,
  standardPressurePa: 101_325,
  rhoIceKgM3: 910,
  gasConstantJMolK: 8.3144521,
  waterMolarMassKgMol: 18e-3,
  waterVaporGasConstantJKgK: 461.51,
  dryAirGasConstantJKgK: 287.05,
  dryAirSpecificHeatJKgK: 1_005,
  latentHeatSublimationJKg: 2.837e6,
  joulesPerCalorie: 4.187,
  vaporDiffusivityReferenceM2S: 2.11e-5,
  vaporDiffusivityTemperatureExponent: 1.94,
  vaporJumpDistanceM: 1.04e-7,
  thermalJumpDistanceM: 2.16e-7,
  thermalAccommodationCoefficient: 1,
  lambExponent: 1.3153063,
  lambMassScaleCoefficient: 2.6606467,
  lambDenominatorScale: 1.1682062,
  lambAdditiveScaled: 0.1123054,
  hybridCriticalScale: 0.000096066,
  hybridTemperatureExponent: 1.9171,
  rescaleMinimum: 0,
  rescaleMaximum: 2,
  rescaleCoarseIntervals: 256,
  rescaleRefinementIterations: 80,
  requiredStrictPerHistoryWins: 4,
});

const EXPECTED_OPERATOR_PINS = Object.freeze({
  observationDecreasePolicy: "preserve-decreases",
  projectAmbientExcessHybrid: {
    criticalScale: C.hybridCriticalScale,
    temperatureExponent: C.hybridTemperatureExponent,
    drive: "ambient-excess-not-local-surface",
  },
  lamb: {
    exponent: C.lambExponent,
    massScaleCoefficient: C.lambMassScaleCoefficient,
    denominatorScale: C.lambDenominatorScale,
    additiveScaled: C.lambAdditiveScaled,
  },
  rescaleBounds: { minimum: C.rescaleMinimum, maximum: C.rescaleMaximum },
  verdict: {
    family: "strict-lamb-lower",
    requiredStrictPerHistoryWins: C.requiredStrictPerHistoryWins,
    ties: "fail",
  },
} as const);

const EXPECTED_MODEL_CONSTANTS = Object.freeze({
  rhoIceKgM3: C.rhoIceKgM3,
  gasConstantJMolK: C.gasConstantJMolK,
  waterMolarMassKgMol: C.waterMolarMassKgMol,
  latentHeatSublimationJKg: C.latentHeatSublimationJKg,
  joulesPerCalorie: C.joulesPerCalorie,
  standardPressurePa: C.standardPressurePa,
  vaporDiffusivityReferenceM2S: C.vaporDiffusivityReferenceM2S,
  vaporDiffusivityTemperatureExponent: C.vaporDiffusivityTemperatureExponent,
  waterVaporGasConstantJKgK: C.waterVaporGasConstantJKgK,
  dryAirGasConstantJKgK: C.dryAirGasConstantJKgK,
  dryAirSpecificHeatJKgK: C.dryAirSpecificHeatJKgK,
  vaporJumpDistanceM: C.vaporJumpDistanceM,
  thermalJumpDistanceM: C.thermalJumpDistanceM,
  thermalAccommodationCoefficient: C.thermalAccommodationCoefficient,
} as const);

const EXPECTED_FROZEN_STATE = Object.freeze({
  protocol: "frozen-before-model-output",
  modelScoreInspected: false,
  launch: {
    status: "blocked",
    scoreMayRun: false,
    remainingBlockers: [
      "The source-data publisher and sibling byte-derived verifier are not implemented in this protocol-repair unit; they must hash the registered and observed launch manifests independently and execute every named mutation before scoring.",
    ],
    s0bPreflightState: "The final S0B identity is pinned. Its actual D-BT row remains protocolDispositionState=pending by design; launch preflight requires sourceBlocked=false, no blocker presence/IDs/identities, and exact local discharge of all nine structured restrictions.",
  },
  phase9Role: "development-only-cheapest-discriminator",
  grantsValidationClaim: false,
} as const);

const EXPECTED_PUBLICATION_CONTRACT = Object.freeze({
  status: "pure implementation and negative fixtures exist; source-data publisher and sibling verifier remain launch blockers",
  publisherContract: {
    name: "phase9-dbt-source-data-publisher",
    state: "not-implemented",
    mustDo: "Hash actual inputs, execute the frozen arithmetic without alternative inspection, publish derived outputs only, and record every mutation result.",
  },
  verifierContract: {
    name: "phase9-dbt-sibling-byte-verifier",
    state: "not-implemented",
    mustDo: "Independently hash source and code bytes, reparse observations, recompute model output and verdict, and execute the named mutations without inheriting producer verdict fields.",
  },
} as const);

class Phase9DbtVerifierRefusal extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`independent D-BT ${code}: ${message}`);
    this.name = "Phase9DbtVerifierRefusal";
    this.code = code;
  }
}

function refuse(code: string, message: string): never {
  throw new Phase9DbtVerifierRefusal(code, message);
}

type Scope = "registered-source-score" | "synthetic-fixture";

interface Identity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase9DbtIndependentIceNodeArchivePin {
  readonly logicalPath: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly archiveCommit: string;
  readonly loadBearingMembers: readonly {
    readonly path: string;
    readonly sha256: string;
  }[];
}

interface Condition {
  readonly tempK: number;
  readonly pressurePa: number;
  readonly excessIceSupersaturationFraction: number;
  readonly initialRadiusUm: number;
}

interface SourceRow {
  readonly timeS: number;
  readonly massRatio: number;
}

interface RosterPin {
  readonly selectionId: string;
  readonly metadataRecordId: string;
  readonly sourceUnitId: string;
  readonly runId: string;
  readonly conditions: {
    readonly tempC: number;
    readonly tempRangeC: number;
    readonly pressurePa: number;
    readonly pressureUncertainty: string;
    readonly sigmaIcePercent: number;
    readonly sigmaIceRangePercent: number;
    readonly initialRadiusUm: number;
    readonly initialRadiusRangeUm: number;
  };
  readonly rowArtifact: {
    readonly logicalRoot: string;
    readonly path: string;
    readonly byteLength: number;
    readonly rowCount: number;
    readonly sha256: string;
    readonly lastTimeS: number;
  };
  readonly scoreGrid: {
    readonly firstSecond: number;
    readonly lastSecond: number;
    readonly sampleCount: number;
  };
}

export interface Phase9DbtIndependentHistory {
  readonly pin: RosterPin;
  readonly condition: Condition;
  readonly sourceRows: readonly SourceRow[];
  readonly sourceBytes: Uint8Array;
  readonly adapterReasons: readonly string[];
}

export interface Phase9DbtIndependentInputs {
  readonly scope: Scope;
  readonly protocolId: string;
  readonly launchManifest: StrictJson;
  readonly launchAuthorization: {
    readonly identity: Identity;
    readonly syntheticChecks: {
      readonly command: string;
      readonly status: "passed";
    };
    readonly independentReview: {
      readonly status: "accepted";
      readonly reviewerModel: string;
      readonly sharedContextWithDeveloper: boolean;
      readonly independentlyReexecuted: readonly string[];
      readonly notChecked: readonly string[];
    };
  };
  readonly sourceIdentities: readonly Identity[];
  readonly histories: readonly Phase9DbtIndependentHistory[];
  readonly registeredControlIds: readonly string[];
  readonly claimBoundary: {
    readonly developmentEvidenceOnly: true;
    readonly grantsValidationClaim: false;
    readonly unqualifiedFreeParticleTransfer: false;
    readonly facetHabitOrMorphologyPrediction: false;
    readonly lineageStatus: string;
    readonly apparatusLimit: string;
  };
  /** Independently parsed protocol facts used only by the mutation harness. */
  readonly controlContext: {
    readonly sourceOverlayRow: StrictJson;
    readonly restrictionDischarges: StrictJson;
    readonly operatorPins: StrictJson;
    readonly roster: StrictJson;
  };
}

export interface Phase9DbtIndependentVerification {
  readonly ok: true;
  readonly historyCount: 6;
  readonly artifactCount: 5;
  readonly rawRowsReparsed: number;
  readonly controls: readonly {
    readonly id: string;
    readonly mutationObserved: true;
    readonly rejectedOrDistinguished: true;
  }[];
  readonly limitations: readonly string[];
}

/** Test-only comparison aid: independently reconstructed bytes, never a verdict or publication. */
export function reconstructPhase9DbtPublicationForTest(
  inputs: Phase9DbtIndependentInputs,
): ReadonlyMap<string, Uint8Array> {
  if (inputs.scope !== "synthetic-fixture") {
    throw new Error("independent reconstruction test aid accepts synthetic fixtures only");
  }
  return reconstruct(inputs).artifacts;
}

interface Prepared {
  readonly timesS: readonly number[];
  readonly massRatios: readonly number[];
  readonly duplicateRowCount: number;
  readonly timeZeroAnchorInserted: boolean;
}

interface History {
  readonly id: string;
  readonly condition: Condition;
  readonly timesS: readonly number[];
  readonly observed: readonly number[];
}

interface Summary {
  readonly sampleCount: number;
  readonly mse: number;
  readonly meanSignedResidual: number;
  readonly meanResidualSign: "negative" | "zero" | "positive";
  readonly endResidual: number;
  readonly endResidualSign: "negative" | "zero" | "positive";
  readonly residualSignCounts: {
    readonly negative: number;
    readonly zero: number;
    readonly positive: number;
  };
}

interface Fit {
  readonly multiplier: number;
  readonly equalHistoryMse: number;
  readonly boundary: "minimum" | "interior" | "maximum";
  readonly trainingHistoryIds: readonly string[];
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
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a string`);
  return value;
}

function number(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || Object.is(value, -0)) {
    throw new Error(`${label} must be finite and not negative zero`);
  }
  return value;
}

function positive(value: number, label: string): number {
  number(value, label);
  if (!(value > 0)) throw new Error(`${label} must be positive`);
  return value;
}

function nonnegative(value: number, label: string): number {
  number(value, label);
  if (value < 0) throw new Error(`${label} must be nonnegative`);
  return value;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

/** Independently require the exact frozen blocker state before considering a release record. */
export function independentlyValidatePhase9DbtFrozenPreOutputState(protocolValue: unknown): void {
  const protocol = object(protocolValue, "D-BT protocol");
  if (canonicalJson(protocol.state) !== canonicalJson(EXPECTED_FROZEN_STATE)) {
    refuse("frozen-state", "pre-output state differs");
  }
  const launch = object(protocol.launchPreflight, "launch preflight");
  const contract = {
    status: launch.status,
    publisherContract: launch.publisherContract,
    verifierContract: launch.verifierContract,
  };
  if (canonicalJson(contract) !== canonicalJson(EXPECTED_PUBLICATION_CONTRACT)) {
    refuse("publication-contract", "publisher/verifier blocker contract differs");
  }
}

function validateIdentity(value: unknown, expectedPath: string, label: string): Identity {
  const entry = object(value, label);
  if (
    entry.path !== expectedPath ||
    !Number.isSafeInteger(entry.byteLength) ||
    (entry.byteLength as number) <= 0 ||
    typeof entry.sha256 !== "string" ||
    !/^[0-9a-f]{64}$/.test(entry.sha256)
  ) {
    refuse("identity", `${label} differs or is malformed`);
  }
  return entry as unknown as Identity;
}

function validateRosterPins(value: unknown): readonly RosterPin[] {
  const roster = array(value, "primary roster").map((entry) => object(entry, "roster entry") as unknown as RosterPin);
  if (roster.length !== 6) refuse("roster", "primary roster must contain six histories");
  const selectionIds = new Set<string>();
  const metadataIds = new Set<string>();
  const sourceUnitIds = new Set<string>();
  const runIds = new Set<string>();
  for (const pin of roster) {
    if (
      typeof pin.selectionId !== "string" || pin.selectionId.length === 0 || selectionIds.has(pin.selectionId) ||
      typeof pin.metadataRecordId !== "string" || pin.metadataRecordId.length === 0 || metadataIds.has(pin.metadataRecordId) ||
      typeof pin.sourceUnitId !== "string" || pin.sourceUnitId.length === 0 || sourceUnitIds.has(pin.sourceUnitId) ||
      typeof pin.runId !== "string" || pin.runId.length === 0 || runIds.has(pin.runId)
    ) refuse("roster", "history identities must be nonempty and unique");
    selectionIds.add(pin.selectionId);
    metadataIds.add(pin.metadataRecordId);
    sourceUnitIds.add(pin.sourceUnitId);
    runIds.add(pin.runId);
    const conditions = pin.conditions;
    const tempK = conditions.tempC + C.celsiusZeroK;
    if (
      !Number.isFinite(tempK) || tempK < 205 || tempK > 240 ||
      !(conditions.tempRangeC >= 0) || !(conditions.pressurePa > 0) ||
      typeof conditions.pressureUncertainty !== "string" || conditions.pressureUncertainty.length === 0 ||
      !(conditions.sigmaIcePercent >= 0) || !(conditions.sigmaIceRangePercent >= 0) ||
      !(conditions.initialRadiusUm > 0) || !(conditions.initialRadiusRangeUm >= 0)
    ) refuse("roster", `${pin.runId} condition differs or is outside the registered domain`);
    const row = pin.rowArtifact;
    if (
      typeof row.logicalRoot !== "string" || typeof row.path !== "string" ||
      !Number.isSafeInteger(row.byteLength) || row.byteLength <= 0 ||
      !Number.isSafeInteger(row.rowCount) || row.rowCount <= 0 ||
      !/^[0-9a-f]{64}$/.test(row.sha256) || !(row.lastTimeS >= 0)
    ) refuse("roster", `${pin.runId} row identity differs or is malformed`);
    key(pin);
    const lastSecond = Math.min(499, Math.floor(row.lastTimeS));
    if (
      pin.scoreGrid.firstSecond !== 0 || pin.scoreGrid.lastSecond !== lastSecond ||
      pin.scoreGrid.sampleCount !== lastSecond + 1 || pin.scoreGrid.lastSecond >= 500
    ) refuse("grid", `${pin.runId} score grid differs`);
  }
  return roster;
}

function validateVerificationRoster(inputs: Phase9DbtIndependentInputs): void {
  const launch = object(inputs.launchManifest, "launch manifest");
  const launchRoster = validateRosterPins(launch.primaryRoster);
  const contextRoster = validateRosterPins(inputs.controlContext.roster);
  const historyRoster = validateRosterPins(inputs.histories.map((history) => history.pin));
  if (
    canonicalJson(historyRoster) !== canonicalJson(launchRoster) ||
    canonicalJson(contextRoster) !== canonicalJson(launchRoster)
  ) refuse("roster", "captured history roster differs from launch preflight registration");
  for (let index = 0; index < historyRoster.length; index++) {
    const pin = historyRoster[index];
    const expectedCondition = {
      tempK: pin.conditions.tempC + C.celsiusZeroK,
      pressurePa: pin.conditions.pressurePa,
      excessIceSupersaturationFraction: pin.conditions.sigmaIcePercent / 100,
      initialRadiusUm: pin.conditions.initialRadiusUm,
    };
    if (canonicalJson(inputs.histories[index].condition) !== canonicalJson(expectedCondition)) {
      refuse("roster", `${pin.runId} captured model condition differs from its roster pin`);
    }
  }
}

/**
 * Full independent static launch preflight. It consumes no NAS observation bytes and imports no
 * producer, model, or pure-preflight decision implementation.
 */
export function independentlyValidatePhase9DbtLaunchPreflight(
  protocolValue: unknown,
  registrationValue: unknown,
  observedValue: unknown,
): void {
  const protocol = object(protocolValue, "D-BT protocol");
  if (protocol.schema !== "phase9-dbt-protocol-v1" || protocol.protocolId !== "phase9-dbt-six-history-development-v1") {
    refuse("launch-schema", "protocol schema or ID differs");
  }
  independentlyValidatePhase9DbtFrozenPreOutputState(protocol);
  const controls = array(protocol.preRunControls, "pre-run controls")
    .map((entry) => string(object(entry, "pre-run control").id, "pre-run control ID"));
  if (canonicalJson(controls) !== canonicalJson(CONTROL_IDS)) {
    refuse("control-roster", "registered control roster differs");
  }

  const registration = object(registrationValue, "registered launch manifest");
  const observed = object(observedValue, "observed launch manifest");
  if (
    registration.schema !== "phase9-dbt-launch-manifest-v1" ||
    observed.schema !== "phase9-dbt-launch-manifest-v1"
  ) refuse("launch-schema", "launch manifest schema differs");
  if (canonicalJson(registration) !== canonicalJson(observed)) {
    refuse("registered-observed-parity", "registered and independently observed manifests differ");
  }

  const launch = object(protocol.launchPreflight, "launch preflight");
  if (canonicalJson(launch.requiredOperatorPins) !== canonicalJson(EXPECTED_OPERATOR_PINS)) {
    refuse("operator-pins", "registered operator pins differ");
  }
  if (canonicalJson(registration.operatorPins) !== canonicalJson(EXPECTED_OPERATOR_PINS)) {
    refuse("operator-pins", "launch operator pins differ");
  }
  const modelOperator = object(protocol.modelOperator, "model operator");
  if (canonicalJson(modelOperator.constants) !== canonicalJson(EXPECTED_MODEL_CONSTANTS)) {
    refuse("model-constants", "one or more physical/numerical constants differ");
  }
  const comparators = array(modelOperator.comparators, "model comparators").map((entry) => object(entry, "model comparator"));
  if (canonicalJson(comparators.map((entry) => entry.id)) !== canonicalJson([
    "continuum",
    "project-ambient-excess-hybrid",
    "lamb",
    "leave-one-history-out-continuum-rescale",
  ])) refuse("operator-pins", "comparator roster or order differs");
  const search = object(comparators[3].search, "rescale search");
  if (
    search.minimum !== C.rescaleMinimum || search.maximum !== C.rescaleMaximum ||
    search.coarseIntervals !== C.rescaleCoarseIntervals ||
    search.refinement !== "80 fixed golden-section iterations over the two coarse intervals neighboring the best coarse node" ||
    search.endpoints !== "evaluate both endpoints explicitly" ||
    search.ties !== "choose the smaller multiplier" ||
    search.boundaryHandling !== "report a minimum or maximum boundary solution by name; do not silently widen after seeing it"
  ) refuse("rescale-search", "bounded rescale search differs");
  const mapping = object(protocol.conditionMapping, "condition mapping");
  const domain = object(mapping.modelDomain, "model domain");
  if (canonicalJson(domain) !== canonicalJson({
    temperatureK: { minimumInclusive: 205, maximumInclusive: 240 },
    scoreTimeS: { minimumInclusive: 0, maximumExclusive: 500, integerSecondsOnly: true },
  })) refuse("grid", "model domain or strict time endpoint differs");

  const protocolRoster = validateRosterPins(protocol.primaryRoster);
  const registrationRoster = validateRosterPins(registration.primaryRoster);
  if (canonicalJson(registrationRoster) !== canonicalJson(protocolRoster)) {
    refuse("roster", "registered roster differs from the frozen protocol");
  }

  const requiredPaths = object(launch.requiredIdentityPaths, "required identity paths");
  if (canonicalJson(requiredPaths) !== canonicalJson({
    protocol: PATHS.protocol,
    implementation: PATHS.model,
    test: PATHS.modelTest,
    preflightImplementation: PATHS.preflight,
    preflightTest: PATHS.preflightTest,
  })) refuse("identity", "required launch identity paths differ");
  const identities = object(registration.identities, "launch identities");
  validateIdentity(identities.protocol, PATHS.protocol, "protocol identity");
  validateIdentity(identities.implementation, PATHS.model, "model identity");
  validateIdentity(identities.test, PATHS.modelTest, "model test identity");
  validateIdentity(identities.preflightImplementation, PATHS.preflight, "preflight identity");
  validateIdentity(identities.preflightTest, PATHS.preflightTest, "preflight test identity");
  validateIdentity(identities.adapterRegistry, PATHS.adapterRegistry, "adapter registry identity");

  const upstream = object(protocol.upstreamBindings, "upstream bindings");
  const sourceOverlay = object(upstream.sourceOverlay, "source overlay binding");
  const shelfPath = string(sourceOverlay.shelfFreezePath, "shelf freeze path");
  validateIdentity(identities.sourceOverlayShelfFreeze, shelfPath, "source-overlay identity");
  if (
    canonicalJson(identities.sourceOverlayShelfFreeze) !== canonicalJson(sourceOverlay.identity) ||
    sourceOverlay.shelfFreezeSchema !== "phase9-source-shelf-freeze-v1" ||
    sourceOverlay.shelfItem !== "D-BT" || sourceOverlay.requiredSourceBlocked !== false
  ) refuse("source-overlay", "source-overlay identity or binding differs");
  const shelfPin = object(registration.sourceOverlayShelf, "launch source-overlay shelf");
  if (shelfPin.schema !== sourceOverlay.shelfFreezeSchema) {
    refuse("source-overlay", "shelf schema differs");
  }
  validateControlContext({
    sourceOverlayRow: strictJsonSnapshot(shelfPin.row),
    restrictionDischarges: strictJsonSnapshot(sourceOverlay.restrictionDischarges),
    operatorPins: strictJsonSnapshot(launch.requiredOperatorPins),
    roster: strictJsonSnapshot(protocol.primaryRoster),
  });

  const adapterBinding = object(upstream.measurementAdapters, "measurement adapter binding");
  if (canonicalJson(identities.adapterRegistry) !== canonicalJson(adapterBinding.identity)) {
    refuse("adapter-mapping", "adapter-registry identity differs");
  }
  const requiredMappings = array(adapterBinding.requiredMappings, "required adapter mappings");
  const launchMappings = array(registration.adapterMappings, "launch adapter mappings");
  if (canonicalJson(launchMappings) !== canonicalJson(requiredMappings) || launchMappings.length !== 6) {
    refuse("adapter-mapping", "S1 mapping roster differs");
  }
  const mappedIds = new Set<string>();
  for (const raw of launchMappings) {
    const entry = object(raw, "adapter mapping");
    if (
      typeof entry.selectionId !== "string" || mappedIds.has(entry.selectionId) ||
      entry.adapterKind !== "free-particle-mass" || entry.bindingKind !== "native-history" ||
      entry.scalarMassHistoryDevelopmentStatus !== "eligible-with-limitation" ||
      entry.unqualifiedFreeParticleTransferStatus !== "ineligible"
    ) refuse("adapter-mapping", "an exact S1 mapping differs");
    mappedIds.add(entry.selectionId);
  }
  if (protocolRoster.some((pin) => !mappedIds.has(pin.selectionId))) {
    refuse("adapter-mapping", "S1 mappings do not cover the exact roster");
  }
}

function identity(path: string, bytes: Uint8Array): Identity {
  return { path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

const registeredVerificationFingerprints = new WeakMap<object, string>();

function verificationFingerprint(inputs: Phase9DbtIndependentInputs): string {
  return sha256Bytes(canonicalJsonBytes(strictJsonSnapshot({
    scope: inputs.scope,
    protocolId: inputs.protocolId,
    launchManifest: inputs.launchManifest,
    launchAuthorization: inputs.launchAuthorization,
    sourceIdentities: inputs.sourceIdentities,
    histories: inputs.histories.map((history) => ({
      pin: history.pin,
      condition: history.condition,
      sourceRows: history.sourceRows,
      sourceIdentity: identity(key(history.pin), history.sourceBytes),
      adapterReasons: history.adapterReasons,
    })),
    registeredControlIds: inputs.registeredControlIds,
    claimBoundary: inputs.claimBoundary,
    controlContext: inputs.controlContext,
  })));
}

function key(pin: RosterPin): string {
  const parts = [...pin.rowArtifact.logicalRoot.split("/"), ...pin.rowArtifact.path.split("/")];
  if (
    pin.rowArtifact.logicalRoot.startsWith("/") ||
    pin.rowArtifact.path.startsWith("/") ||
    parts.some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error("D-BT row path is unsafe");
  }
  return `${pin.rowArtifact.logicalRoot}/${pin.rowArtifact.path}`;
}

function readRegular(repositoryRoot: string, relativePath: string): Uint8Array {
  const root = resolve(repositoryRoot);
  const path = resolve(root, relativePath);
  if (path !== root && !path.startsWith(`${root}${sep}`)) throw new Error("repository path escapes");
  const status = lstatSync(path);
  if (!status.isFile() || status.isSymbolicLink()) throw new Error(`${relativePath} is not a regular file`);
  return new Uint8Array(readFileSync(path));
}

function readNas(relativePath: string, nasRoot: string): Uint8Array {
  const resolved = resolvePhase9NasFile(relativePath, nasRoot);
  if (resolved.kind !== "ok") throw new Error(`${relativePath} cannot be read: ${resolved.reason}`);
  const bytes = new Uint8Array(readFileSync(resolved.path));
  if (bytes.byteLength !== resolved.byteLength) throw new Error(`${relativePath} changed while read`);
  return bytes;
}

function parseJson<T>(bytes: Uint8Array, label: string): T {
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as T;
  } catch {
    throw new Error(`${label} is not valid UTF-8 JSON`);
  }
}

function zipUInt16(bytes: Uint8Array, offset: number, label: string): number {
  if (offset < 0 || offset + 2 > bytes.length) throw new Error(`${label} is truncated`);
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function zipUInt32(bytes: Uint8Array, offset: number, label: string): number {
  if (offset < 0 || offset + 4 > bytes.length) throw new Error(`${label} is truncated`);
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

function zipCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface IndependentZipMember {
  readonly path: string;
  readonly bytes: Uint8Array;
  readonly sha256: string;
}

/** A verifier-owned stored/deflated, single-disk, non-ZIP64 member enumerator. */
function independentlyEnumerateZip(bytes: Uint8Array): readonly IndependentZipMember[] {
  const label = "independent IceNODE ZIP";
  if (bytes.length < 22) refuse("ice-node-zip", "archive is too short");
  let eocd = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65_557); offset--) {
    if (zipUInt32(bytes, offset, label) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) refuse("ice-node-zip", "end-of-central-directory is absent");
  const disk = zipUInt16(bytes, eocd + 4, label);
  const centralDisk = zipUInt16(bytes, eocd + 6, label);
  const diskEntries = zipUInt16(bytes, eocd + 8, label);
  const count = zipUInt16(bytes, eocd + 10, label);
  const centralSize = zipUInt32(bytes, eocd + 12, label);
  const centralOffset = zipUInt32(bytes, eocd + 16, label);
  const commentLength = zipUInt16(bytes, eocd + 20, label);
  if (disk !== 0 || centralDisk !== 0 || diskEntries !== count) {
    refuse("ice-node-zip", "archive is not single-disk");
  }
  if (count === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) {
    refuse("ice-node-zip", "ZIP64 is unsupported");
  }
  if (eocd + 22 + commentLength !== bytes.length || centralOffset + centralSize !== eocd) {
    refuse("ice-node-zip", "central-directory extent differs");
  }
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const paths = new Set<string>();
  const folded = new Set<string>();
  const members: IndependentZipMember[] = [];
  let cursor = centralOffset;
  for (let index = 0; index < count; index++) {
    if (zipUInt32(bytes, cursor, label) !== 0x02014b50) {
      refuse("ice-node-zip", `central entry ${index} signature differs`);
    }
    const versionMadeBy = zipUInt16(bytes, cursor + 4, label);
    const flags = zipUInt16(bytes, cursor + 8, label);
    const method = zipUInt16(bytes, cursor + 10, label);
    const expectedCrc = zipUInt32(bytes, cursor + 16, label);
    const compressedSize = zipUInt32(bytes, cursor + 20, label);
    const uncompressedSize = zipUInt32(bytes, cursor + 24, label);
    const nameLength = zipUInt16(bytes, cursor + 28, label);
    const extraLength = zipUInt16(bytes, cursor + 30, label);
    const entryCommentLength = zipUInt16(bytes, cursor + 32, label);
    const diskStart = zipUInt16(bytes, cursor + 34, label);
    const externalAttributes = zipUInt32(bytes, cursor + 38, label);
    const localOffset = zipUInt32(bytes, cursor + 42, label);
    const end = cursor + 46 + nameLength + extraLength + entryCommentLength;
    if (end > eocd || diskStart !== 0) refuse("ice-node-zip", `central entry ${index} is invalid`);
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) {
      refuse("ice-node-zip", `member ${index} uses ZIP64 metadata`);
    }
    if ((flags & 1) !== 0 || (flags & 0x0008) !== 0 || (flags & ~0x0806) !== 0) {
      refuse("ice-node-zip", `member ${index} uses unsupported flags`);
    }
    let path: string;
    try {
      path = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    } catch {
      refuse("ice-node-zip", `member ${index} path is not UTF-8`);
    }
    if (
      path !== path.normalize("NFC") || path.includes("\\") || path.includes("\0") ||
      path.startsWith("/") || /^[A-Za-z]:/.test(path) ||
      path.split("/").some((part, partIndex, parts) =>
        part === "." || part === ".." || (part === "" && partIndex < parts.length - 1)
      )
    ) refuse("ice-node-zip", `member path is unsafe: ${path}`);
    const caseFolded = path.toLocaleLowerCase("en-US");
    if (paths.has(path) || folded.has(caseFolded)) refuse("ice-node-zip", `member path collides: ${path}`);
    paths.add(path);
    folded.add(caseFolded);
    const host = versionMadeBy >>> 8;
    const unixType = host === 3 ? ((externalAttributes >>> 16) & 0xf000) : 0;
    const directory = path.endsWith("/") || unixType === 0x4000;
    if (unixType === 0xa000) refuse("ice-node-zip", `symbolic-link member is forbidden: ${path}`);
    if (directory) {
      if (!path.endsWith("/") || uncompressedSize !== 0) refuse("ice-node-zip", `directory member is malformed: ${path}`);
      cursor = end;
      continue;
    }
    if (host === 3 && unixType !== 0 && unixType !== 0x8000) {
      refuse("ice-node-zip", `non-regular member is forbidden: ${path}`);
    }
    if (method !== 0 && method !== 8) refuse("ice-node-zip", `compression method differs: ${path}`);
    if (method === 0 && (flags & 0x0006) !== 0) refuse("ice-node-zip", `stored member flags differ: ${path}`);
    if (zipUInt32(bytes, localOffset, label) !== 0x04034b50) refuse("ice-node-zip", `local header differs: ${path}`);
    const localFlags = zipUInt16(bytes, localOffset + 6, label);
    const localMethod = zipUInt16(bytes, localOffset + 8, label);
    const localCrc = zipUInt32(bytes, localOffset + 14, label);
    const localCompressedSize = zipUInt32(bytes, localOffset + 18, label);
    const localUncompressedSize = zipUInt32(bytes, localOffset + 22, label);
    const localNameLength = zipUInt16(bytes, localOffset + 26, label);
    const localExtraLength = zipUInt16(bytes, localOffset + 28, label);
    if (
      localFlags !== flags || localMethod !== method || localNameLength !== nameLength ||
      localCrc !== expectedCrc || localCompressedSize !== compressedSize ||
      localUncompressedSize !== uncompressedSize
    ) refuse("ice-node-zip", `local/central metadata differ: ${path}`);
    const localName = bytes.subarray(localOffset + 30, localOffset + 30 + localNameLength);
    const centralName = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
    if (!Buffer.from(localName).equals(Buffer.from(centralName))) {
      refuse("ice-node-zip", `local/central names differ: ${path}`);
    }
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressedEnd = dataOffset + compressedSize;
    if (compressedEnd > centralOffset) refuse("ice-node-zip", `member data is truncated: ${path}`);
    const compressed = bytes.subarray(dataOffset, compressedEnd);
    let uncompressed: Uint8Array;
    try {
      uncompressed = method === 0 ? compressed.slice() : new Uint8Array(inflateRawSync(compressed));
    } catch {
      refuse("ice-node-zip", `member decompression failed: ${path}`);
    }
    if (uncompressed.byteLength !== uncompressedSize || zipCrc32(uncompressed) !== expectedCrc) {
      refuse("ice-node-zip", `member length or CRC differs: ${path}`);
    }
    members.push({ path, bytes: uncompressed, sha256: sha256Bytes(uncompressed) });
    cursor = end;
  }
  if (cursor !== eocd) refuse("ice-node-zip", "central-directory count differs");
  return members.sort((left, right) => left.path.localeCompare(right.path));
}

/** Independently bind the six protocol-pinned uncompressed IceNODE members. */
export function independentlyBindPhase9DbtIceNodeArchiveMembers(
  pin: Phase9DbtIndependentIceNodeArchivePin,
  bytes: Uint8Array,
): readonly Identity[] {
  if (
    bytes.byteLength !== pin.byteLength || sha256Bytes(bytes) !== pin.sha256 ||
    !/^[0-9a-f]{40}$/.test(pin.archiveCommit) || pin.loadBearingMembers.length !== 6
  ) refuse("ice-node-identity", "archive identity, commit, or six-member roster differs");
  const expectedPaths = pin.loadBearingMembers.map((member) => member.path);
  if (
    new Set(expectedPaths).size !== expectedPaths.length ||
    expectedPaths.some((path) =>
      path.startsWith("/") || path.includes("\\") ||
      path.split("/").some((part) => part === "" || part === "." || part === "..")
    )
  ) refuse("ice-node-identity", "load-bearing member roster is unsafe or duplicated");
  const root = `IceNODE-${pin.archiveCommit}/`;
  const members = independentlyEnumerateZip(bytes);
  if (!members.some((member) => member.path.startsWith(root)) || members.some((member) => !member.path.startsWith(root))) {
    refuse("ice-node-identity", "archive commit root differs");
  }
  const byPath = new Map(members.map((member) => [member.path, member]));
  return pin.loadBearingMembers.map((expected) => {
    const fullPath = `${root}${expected.path}`;
    const member = byPath.get(fullPath);
    if (member === undefined || !/^[0-9a-f]{64}$/.test(expected.sha256) || member.sha256 !== expected.sha256) {
      refuse("ice-node-member", `load-bearing member differs: ${expected.path}`);
    }
    return {
      path: `zip-member:${pin.logicalPath}#${fullPath}`,
      byteLength: member.bytes.byteLength,
      sha256: member.sha256,
    };
  });
}

function parseCanonicalJsonl(bytes: Uint8Array, label: string): readonly Record<string, unknown>[] {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (text.includes("\r") || !text.endsWith("\n")) throw new Error(`${label} must be LF terminated`);
  const lines = text.slice(0, -1).split("\n");
  if (lines.some((line) => line.length === 0)) throw new Error(`${label} contains an empty line`);
  return lines.map((line, index) => {
    const row = object(JSON.parse(line) as unknown, `${label} row ${index + 1}`);
    if (canonicalJson(row) !== line) throw new Error(`${label} row ${index + 1} is noncanonical`);
    return row;
  });
}

function parseTsv(bytes: Uint8Array, pin: RosterPin): readonly SourceRow[] {
  if (bytes.byteLength !== pin.rowArtifact.byteLength || sha256Bytes(bytes) !== pin.rowArtifact.sha256) {
    refuse("source-identity", `${pin.runId} source byte identity differs`);
  }
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (text.includes("\r") || !text.endsWith("\n")) throw new Error(`${pin.runId} TSV is not LF terminated`);
  const lines = text.slice(0, -1).split("\n");
  if (lines.shift() !== "sourceRowIndex\ttime_s\tmass_ratio") throw new Error(`${pin.runId} TSV header differs`);
  if (lines.length !== pin.rowArtifact.rowCount) throw new Error(`${pin.runId} TSV row count differs`);
  let previousTime = -Infinity;
  const rows = lines.map((line, index): SourceRow => {
    const fields = line.split("\t");
    if (fields.length !== 3) throw new Error(`${pin.runId} row ${index + 1} has the wrong shape`);
    const ordinal = Number(fields[0]);
    const timeS = Number(fields[1]);
    const massRatio = Number(fields[2]);
    if (
      !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(fields[0]) ||
      !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(fields[1]) ||
      !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(fields[2]) ||
      ordinal !== index + 1 ||
      !Number.isInteger(ordinal) ||
      !Number.isFinite(timeS) ||
      timeS < 0 ||
      timeS < previousTime ||
      !(massRatio > 0) ||
      !Number.isFinite(massRatio)
    ) {
      throw new Error(`${pin.runId} row ${index + 1} violates the source contract`);
    }
    previousTime = timeS;
    return { timeS, massRatio };
  });
  if (rows.at(-1)?.timeS !== pin.rowArtifact.lastTimeS) throw new Error(`${pin.runId} last time differs`);
  return rows;
}

function prepare(sourceRows: readonly SourceRow[]): Prepared {
  if (sourceRows.length === 0) throw new Error("source history is empty");
  const coalesced: SourceRow[] = [];
  let duplicateRowCount = 0;
  for (let start = 0; start < sourceRows.length; ) {
    const timeS = nonnegative(sourceRows[start].timeS, `source time ${start}`);
    if (start > 0 && timeS < sourceRows[start - 1].timeS) throw new Error("source time order differs");
    let end = start + 1;
    while (end < sourceRows.length && sourceRows[end].timeS === timeS) end++;
    const values = sourceRows.slice(start, end).map((row) => positive(row.massRatio, "mass ratio"))
      .sort((left, right) => left - right);
    duplicateRowCount += values.length - 1;
    const middle = Math.floor(values.length / 2);
    const massRatio = values.length % 2 === 1
      ? values[middle]
      : (values[middle - 1] + values[middle]) / 2;
    coalesced.push({ timeS, massRatio });
    start = end;
  }
  let timeZeroAnchorInserted = false;
  if (coalesced[0].timeS > 0) {
    if (coalesced[0].massRatio !== 1) throw new Error("late history does not begin at unit ratio");
    coalesced.unshift({ timeS: 0, massRatio: 1 });
    timeZeroAnchorInserted = true;
  }
  const finalSecond = Math.min(499, Math.floor(coalesced.at(-1)?.timeS as number));
  const timesS = Array.from({ length: finalSecond + 1 }, (_unused, index) => index);
  let cursor = 0;
  const massRatios = timesS.map((timeS) => {
    while (cursor < coalesced.length && coalesced[cursor].timeS < timeS) cursor++;
    if (cursor < coalesced.length && coalesced[cursor].timeS === timeS) return coalesced[cursor].massRatio;
    if (cursor === 0 || cursor >= coalesced.length) throw new Error("interpolation target is outside source rows");
    const before = coalesced[cursor - 1];
    const after = coalesced[cursor];
    return before.massRatio +
      ((timeS - before.timeS) / (after.timeS - before.timeS)) * (after.massRatio - before.massRatio);
  });
  return { timesS, massRatios, duplicateRowCount, timeZeroAnchorInserted };
}

function validateGrid(timesS: readonly number[]): void {
  if (timesS.length === 0) refuse("grid", "grid is empty");
  for (let index = 0; index < timesS.length; index++) {
    if (timesS[index] !== index || !Number.isSafeInteger(timesS[index]) || timesS[index] > 499) {
      refuse("grid", "grid must be consecutive integer seconds through 499 at most");
    }
  }
}

function validateCondition(condition: Condition): void {
  if (
    !(condition.tempK >= 205 && condition.tempK <= 240) ||
    !(condition.pressurePa > 0) ||
    !(condition.excessIceSupersaturationFraction >= 0) ||
    !(condition.initialRadiusUm > 0)
  ) {
    throw new Error("condition is outside the registered D-BT domain");
  }
}

function sphereMass(radiusUm: number): number {
  const radiusM = positive(radiusUm, "radius") * 1e-6;
  return (4 / 3) * Math.PI * C.rhoIceKgM3 * radiusM ** 3;
}

function radiusM(massKg: number): number {
  return ((3 * positive(massKg, "mass")) / (4 * Math.PI * C.rhoIceKgM3)) ** (1 / 3);
}

function vaporPressure(tempK: number): number {
  return Math.exp(9.550426 - 5723.265 / tempK + 3.53068 * Math.log(tempK) - 0.00728332 * tempK);
}

function diffusivity(tempK: number, pressurePa: number): number {
  return C.vaporDiffusivityReferenceM2S *
    (tempK / C.celsiusZeroK) ** C.vaporDiffusivityTemperatureExponent *
    (C.standardPressurePa / pressurePa);
}

function conductivity(tempK: number): number {
  return positive((5.69 + 0.017 * (tempK - C.celsiusZeroK)) * 1e-3 * C.joulesPerCalorie, "conductivity");
}

function resistanceTransfer(tempK: number, vaporDiffusivity: number, thermalConductivity: number): number {
  if (vaporDiffusivity === 0) return 0;
  const vaporResistance = (C.gasConstantJMolK * tempK) /
    (vaporPressure(tempK) * positive(vaporDiffusivity, "diffusivity") * C.waterMolarMassKgMol);
  const heatResistance = (C.latentHeatSublimationJKg / (positive(thermalConductivity, "conductivity") * tempK)) *
    ((C.latentHeatSublimationJKg * C.waterMolarMassKgMol) / (C.gasConstantJMolK * tempK) - 1);
  return positive(1 / (vaporResistance + heatResistance), "transfer");
}

function continuum(condition: Condition): number {
  return resistanceTransfer(
    condition.tempK,
    diffusivity(condition.tempK, condition.pressurePa),
    conductivity(condition.tempK),
  );
}

function hybridCoefficient(condition: Condition, saturationRatioSwap = false): number {
  const drive = saturationRatioSwap
    ? 1 + condition.excessIceSupersaturationFraction
    : condition.excessIceSupersaturationFraction;
  if (drive === 0) return 0;
  const critical = C.hybridCriticalScale *
    Math.abs(condition.tempK - C.celsiusZeroK) ** C.hybridTemperatureExponent;
  const ratio = drive / critical;
  return ratio * Math.tanh(1 / ratio);
}

function hybrid(massKg: number, condition: Condition, saturationRatioSwap = false): number {
  const coefficient = hybridCoefficient(condition, saturationRatioSwap);
  if (coefficient === 0) return 0;
  const radius = radiusM(massKg);
  const vaporBase = diffusivity(condition.tempK, condition.pressurePa);
  const waterSpeed = Math.sqrt((8 * C.waterVaporGasConstantJKgK * condition.tempK) / Math.PI);
  const vaporModified = vaporBase /
    (radius / (radius + C.vaporJumpDistanceM) + (4 * vaporBase) / (radius * coefficient * waterSpeed));
  const thermalBase = conductivity(condition.tempK);
  const airDensity = condition.pressurePa / (C.dryAirGasConstantJKgK * condition.tempK);
  const airSpeed = Math.sqrt((8 * C.dryAirGasConstantJKgK * condition.tempK) / Math.PI);
  const thermalModified = thermalBase /
    (radius / (radius + C.thermalJumpDistanceM) +
      (4 * thermalBase) /
        (radius * C.thermalAccommodationCoefficient * C.dryAirSpecificHeatJKgK * airDensity * airSpeed));
  return resistanceTransfer(condition.tempK, vaporModified, thermalModified);
}

type Model =
  | { readonly kind: "continuum" }
  | { readonly kind: "hybrid"; readonly saturationRatioSwap?: boolean }
  | { readonly kind: "lamb"; readonly exponent?: number }
  | { readonly kind: "rescale"; readonly multiplier: number };

function transfer(massKg: number, condition: Condition, model: Model): number {
  if (model.kind === "hybrid") return hybrid(massKg, condition, model.saturationRatioSwap);
  const base = continuum(condition);
  if (model.kind === "continuum") return base;
  if (model.kind === "rescale") return model.multiplier * base;
  const exponent = model.exponent ?? C.lambExponent;
  return 1e-9 *
    ((base * 1e9) ** exponent /
      (1 / C.lambDenominatorScale + C.lambMassScaleCoefficient / (massKg * 1e12)) +
      C.lambAdditiveScaled);
}

function derivative(massKg: number, condition: Condition, model: Model): number {
  if (condition.excessIceSupersaturationFraction === 0) return 0;
  return 4 * Math.PI * radiusM(massKg) * condition.excessIceSupersaturationFraction *
    transfer(massKg, condition, model);
}

function integrate(condition: Condition, model: Model, timesS: readonly number[]): readonly number[] {
  validateCondition(condition);
  validateGrid(timesS);
  const initialMass = sphereMass(condition.initialRadiusUm);
  let mass = initialMass;
  const ratios = [1];
  for (let index = 1; index < timesS.length; index++) {
    const k1 = derivative(mass, condition, model);
    const k2 = derivative(mass + k1 / 2, condition, model);
    const k3 = derivative(mass + k2 / 2, condition, model);
    const k4 = derivative(mass + k3, condition, model);
    mass = positive(mass + (k1 + 2 * k2 + 2 * k3 + k4) / 6, "integrated mass");
    ratios.push(mass / initialMass);
  }
  return ratios;
}

function sign(value: number): "negative" | "zero" | "positive" {
  return value < 0 ? "negative" : value > 0 ? "positive" : "zero";
}

function summary(observed: readonly number[], predicted: readonly number[]): Summary {
  if (observed.length === 0 || observed.length !== predicted.length) throw new Error("history shapes differ");
  const residuals = observed.map((value, index) => positive(predicted[index], "prediction") - positive(value, "observation"));
  const mean = residuals.reduce((sum, value) => sum + value, 0) / residuals.length;
  const end = residuals.at(-1) as number;
  const counts = { negative: 0, zero: 0, positive: 0 };
  for (const value of residuals) counts[sign(value)]++;
  return {
    sampleCount: residuals.length,
    mse: residuals.reduce((sum, value) => sum + value * value, 0) / residuals.length,
    meanSignedResidual: mean,
    meanResidualSign: sign(mean),
    endResidual: end,
    endResidualSign: sign(end),
    residualSignCounts: counts,
  };
}

function equalHistory(values: readonly number[]): number {
  if (values.length === 0) throw new Error("empty family");
  return values.reduce((sum, value) => sum + nonnegative(value, "MSE"), 0) / values.length;
}

function objective(histories: readonly History[], multiplier: number): number {
  return equalHistory(histories.map((history) => summary(
    history.observed,
    integrate(history.condition, { kind: "rescale", multiplier }, history.timesS),
  ).mse));
}

function better(
  left: { readonly multiplier: number; readonly objective: number },
  right: { readonly multiplier: number; readonly objective: number },
) {
  if (right.objective < left.objective) return right;
  if (right.objective === left.objective && right.multiplier < left.multiplier) return right;
  return left;
}

function fit(histories: readonly History[]): Fit {
  const minimum = C.rescaleMinimum;
  const maximum = C.rescaleMaximum;
  const coarseIntervals = C.rescaleCoarseIntervals;
  const step = (maximum - minimum) / coarseIntervals;
  let best: { multiplier: number; objective: number } = {
    multiplier: minimum,
    objective: objective(histories, minimum),
  };
  let bestIndex = 0;
  for (let index = 1; index <= coarseIntervals; index++) {
    const candidate = { multiplier: minimum + index * step, objective: objective(histories, minimum + index * step) };
    const chosen = better(best, candidate);
    if (chosen === candidate) bestIndex = index;
    best = chosen;
  }
  let left = minimum + Math.max(0, bestIndex - 1) * step;
  let right = minimum + Math.min(coarseIntervals, bestIndex + 1) * step;
  const inverseGolden = (Math.sqrt(5) - 1) / 2;
  let innerLeft = right - inverseGolden * (right - left);
  let innerRight = left + inverseGolden * (right - left);
  let leftValue = objective(histories, innerLeft);
  let rightValue = objective(histories, innerRight);
  for (let iteration = 0; iteration < C.rescaleRefinementIterations; iteration++) {
    if (leftValue <= rightValue) {
      right = innerRight;
      innerRight = innerLeft;
      rightValue = leftValue;
      innerLeft = right - inverseGolden * (right - left);
      leftValue = objective(histories, innerLeft);
    } else {
      left = innerLeft;
      innerLeft = innerRight;
      leftValue = rightValue;
      innerRight = left + inverseGolden * (right - left);
      rightValue = objective(histories, innerRight);
    }
  }
  for (const multiplier of [left, innerLeft, innerRight, right, (left + right) / 2]) {
    best = better(best, { multiplier, objective: objective(histories, multiplier) });
  }
  return {
    multiplier: best.multiplier,
    equalHistoryMse: best.objective,
    boundary: best.multiplier === minimum ? "minimum" : best.multiplier === maximum ? "maximum" : "interior",
    trainingHistoryIds: histories.map((history) => history.id),
  };
}

function fivePercent(observed: readonly number[], predicted: readonly number[]) {
  let central = 0;
  let lower = 0;
  let upper = 0;
  let outside = 0;
  const positions = { below: 0, inside: 0, above: 0 };
  for (let index = 0; index < observed.length; index++) {
    const low = 0.95 * observed[index];
    const high = 1.05 * observed[index];
    const prediction = predicted[index];
    central += (prediction - observed[index]) ** 2;
    lower += (prediction - low) ** 2;
    upper += (prediction - high) ** 2;
    if (prediction < low) {
      positions.below++;
      outside += (prediction - low) ** 2;
    } else if (prediction > high) {
      positions.above++;
      outside += (prediction - high) ** 2;
    } else positions.inside++;
  }
  return {
    maximumRelativeErrorFraction: 0.05 as const,
    centralMse: central / observed.length,
    coherentLowerObservationMse: lower / observed.length,
    coherentUpperObservationMse: upper / observed.length,
    outsideBandMse: outside / observed.length,
    predictionPositions: positions,
  };
}

function decision(historyIds: readonly string[], lambMse: readonly number[], rescaleMse: readonly number[]) {
  const lambFamilyMse = equalHistory(lambMse);
  const leaveOneHistoryOutRescaleFamilyMse = equalHistory(rescaleMse);
  let strictPerHistoryWins = 0;
  let perHistoryTies = 0;
  const perHistory = historyIds.map((historyId, index) => {
    const comparison = lambMse[index] < rescaleMse[index]
      ? "lamb-lower" as const
      : lambMse[index] === rescaleMse[index]
        ? "tie" as const
        : "lamb-not-lower" as const;
    if (comparison === "lamb-lower") strictPerHistoryWins++;
    if (comparison === "tie") perHistoryTies++;
    return { historyId, comparison, lambStrictWin: comparison === "lamb-lower" };
  });
  const familyComparison = lambFamilyMse < leaveOneHistoryOutRescaleFamilyMse
    ? "lamb-lower" as const
    : lambFamilyMse === leaveOneHistoryOutRescaleFamilyMse
      ? "tie" as const
      : "lamb-not-lower" as const;
  return {
    survives: familyComparison === "lamb-lower" && strictPerHistoryWins >= C.requiredStrictPerHistoryWins,
    lambFamilyMse,
    leaveOneHistoryOutRescaleFamilyMse,
    strictPerHistoryWins,
    perHistoryTies,
    perHistory,
    requiredStrictPerHistoryWins: C.requiredStrictPerHistoryWins,
    familyComparison,
  };
}

function jsonl(rows: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function publishedNumericSnapshot(value: unknown): StrictJson {
  const round = (entry: unknown): unknown => {
    if (typeof entry === "number") {
      if (!Number.isFinite(entry) || Object.is(entry, -0)) throw new Error("publication number is invalid");
      return Number.isInteger(entry) || entry === 0 ? entry : Number(entry.toPrecision(7));
    }
    if (Array.isArray(entry)) return entry.map(round);
    if (entry !== null && typeof entry === "object") {
      return Object.fromEntries(Object.entries(entry).map(([key, child]) => [key, round(child)]));
    }
    return entry;
  };
  return strictJsonSnapshot(round(value));
}

function artifact(path: string, bytes: Uint8Array, kind: string) {
  return { path, kind, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function decreaseCount(rows: readonly SourceRow[]): number {
  let count = 0;
  for (let index = 1; index < rows.length; index++) if (rows[index].massRatio < rows[index - 1].massRatio) count++;
  return count;
}

function preparedObservationSha256(prepared: Prepared): string {
  return sha256Bytes(canonicalJsonBytes({ timesS: prepared.timesS, massRatios: prepared.massRatios }));
}

interface Reconstructed {
  readonly artifacts: ReadonlyMap<string, Uint8Array>;
  readonly histories: readonly History[];
  readonly fits: readonly Fit[];
  readonly scoreRecords: readonly Record<string, unknown>[];
  readonly centralDecision: ReturnType<typeof decision>;
}

function reconstruct(inputs: Phase9DbtIndependentInputs): Reconstructed {
  validateVerificationRoster(inputs);
  if (
    inputs.histories.length !== 6 ||
    new Set(inputs.histories.map((history) => history.pin.runId)).size !== 6 ||
    canonicalJson(inputs.registeredControlIds) !== canonicalJson(CONTROL_IDS)
  ) {
    throw new Error("independent D-BT roster or control registry differs");
  }
  const diagnostics = inputs.histories.map((bound) => {
    if (bound.sourceBytes.byteLength !== bound.pin.rowArtifact.byteLength || sha256Bytes(bound.sourceBytes) !== bound.pin.rowArtifact.sha256) {
      throw new Error(`${bound.pin.runId} raw identity differs`);
    }
    const prepared = prepare(bound.sourceRows);
    if (
      prepared.timesS[0] !== bound.pin.scoreGrid.firstSecond ||
      prepared.timesS.at(-1) !== bound.pin.scoreGrid.lastSecond ||
      prepared.timesS.length !== bound.pin.scoreGrid.sampleCount
    ) throw new Error(`${bound.pin.runId} prepared grid differs`);
    return {
      schema: "phase9-dbt-source-diagnostic-v1",
      selectionId: bound.pin.selectionId,
      runId: bound.pin.runId,
      sourceIdentity: identity(key(bound.pin), bound.sourceBytes),
      sourceRowCount: bound.sourceRows.length,
      adjacentMassDecreaseCount: decreaseCount(bound.sourceRows),
      exactDuplicateExtraRowCount: prepared.duplicateRowCount,
      timeZeroAnchorInserted: prepared.timeZeroAnchorInserted,
      preparedSampleCount: prepared.timesS.length,
      preparedGrid: { firstSecond: prepared.timesS[0], lastSecond: prepared.timesS.at(-1) },
      preparedObservationSha256: preparedObservationSha256(prepared),
      adapter: { status: "eligible-with-limitation", reasons: bound.adapterReasons },
    };
  });
  const histories = inputs.histories.map((bound): History => {
    const prepared = prepare(bound.sourceRows);
    return { id: bound.pin.runId, condition: bound.condition, timesS: prepared.timesS, observed: prepared.massRatios };
  });
  const fits = histories.map((heldOut) => fit(histories.filter((history) => history.id !== heldOut.id)));
  const sensitivityRows: { name: string; historyId: string; lambMse: number; rescaleMse: number }[] = [];
  const scoreRecords = histories.map((history, index) => {
    const bound = inputs.histories[index];
    const fold = fits[index];
    const continuumPrediction = integrate(history.condition, { kind: "continuum" }, history.timesS);
    const hybridPrediction = integrate(history.condition, { kind: "hybrid" }, history.timesS);
    const lambPrediction = integrate(history.condition, { kind: "lamb" }, history.timesS);
    const rescalePrediction = integrate(history.condition, { kind: "rescale", multiplier: fold.multiplier }, history.timesS);
    const central = {
      continuum: summary(history.observed, continuumPrediction),
      projectAmbientExcessHybrid: summary(history.observed, hybridPrediction),
      lamb: summary(history.observed, lambPrediction),
      leaveOneHistoryOutContinuumRescale: summary(history.observed, rescalePrediction),
    };
    const pair = (direction: "lower" | "upper") => {
      const initialRadiusUm = history.condition.initialRadiusUm +
        (direction === "lower" ? -bound.pin.conditions.initialRadiusRangeUm : bound.pin.conditions.initialRadiusRangeUm);
      const condition = { ...history.condition, initialRadiusUm };
      const lambMse = summary(history.observed, integrate(condition, { kind: "lamb" }, history.timesS)).mse;
      const rescaleMse = summary(
        history.observed,
        integrate(condition, { kind: "rescale", multiplier: fold.multiplier }, history.timesS),
      ).mse;
      sensitivityRows.push({ name: `initial-radius-${direction}-heldout-only`, historyId: history.id, lambMse, rescaleMse });
      return { initialRadiusUm, lambMse, leaveOneHistoryOutContinuumRescaleMse: rescaleMse };
    };
    const lower = pair("lower");
    const upper = pair("upper");
    const lambFive = fivePercent(history.observed, lambPrediction);
    const rescaleFive = fivePercent(history.observed, rescalePrediction);
    sensitivityRows.push(
      { name: "mass-ratio-minus-five-percent-heldout-only", historyId: history.id, lambMse: lambFive.coherentLowerObservationMse, rescaleMse: rescaleFive.coherentLowerObservationMse },
      { name: "mass-ratio-plus-five-percent-heldout-only", historyId: history.id, lambMse: lambFive.coherentUpperObservationMse, rescaleMse: rescaleFive.coherentUpperObservationMse },
    );
    return {
      schema: "phase9-dbt-history-score-v1",
      selectionId: bound.pin.selectionId,
      runId: history.id,
      central,
      leaveOneHistoryOutFit: {
        multiplier: fold.multiplier,
        equalHistoryMse: fold.equalHistoryMse,
        boundary: fold.boundary,
        trainingHistoryIds: fold.trainingHistoryIds,
      },
      initialRadiusHeldoutOnly: { lower, upper },
      massRatioFivePercentHeldoutOnly: {
        lamb: lambFive,
        leaveOneHistoryOutContinuumRescale: rescaleFive,
      },
    };
  });
  const historyIds = histories.map((history) => history.id);
  const lambMse = scoreRecords.map((record) => (record.central as { lamb: Summary }).lamb.mse);
  const rescaleMse = scoreRecords.map((record) =>
    (record.central as { leaveOneHistoryOutContinuumRescale: Summary }).leaveOneHistoryOutContinuumRescale.mse,
  );
  const centralDecision = decision(historyIds, lambMse, rescaleMse);
  const names = [
    "initial-radius-lower-heldout-only",
    "initial-radius-upper-heldout-only",
    "mass-ratio-minus-five-percent-heldout-only",
    "mass-ratio-plus-five-percent-heldout-only",
  ] as const;
  const diagnosticsEnvelope = names.flatMap((name) => historyIds.map((historyId) => {
    const sensitivity = sensitivityRows.find((entry) => entry.name === name && entry.historyId === historyId);
    const central = centralDecision.perHistory.find((entry) => entry.historyId === historyId);
    if (sensitivity === undefined || central === undefined) throw new Error("sensitivity roster differs");
    const sensitivityWin = sensitivity.lambMse < sensitivity.rescaleMse;
    return {
      name,
      historyId,
      centralLambStrictWin: central.lambStrictWin,
      sensitivityLambStrictWin: sensitivityWin,
      winFlipped: sensitivityWin !== central.lambStrictWin,
    };
  }));
  const anyHistoryWinFlip = diagnosticsEnvelope.some((entry) => entry.winFlipped);
  const label = anyHistoryWinFlip
    ? "sensitivity-dependent-promotion-unavailable"
    : !centralDecision.survives
      ? "central-no-effect-or-failure"
      : "central-survives-promotion-unavailable";
  const decisionEnvelope = {
    central: centralDecision,
    heldoutOnlySensitivities: diagnosticsEnvelope,
    anyHistoryWinFlip,
    temperatureOneFactorAvailable: false,
    supersaturationOneFactorAvailable: false,
    promotionAvailable: false,
    label,
  };
  const comparatorFamilyMse = {
    continuum: equalHistory(scoreRecords.map((record) => (record.central as { continuum: Summary }).continuum.mse)),
    projectAmbientExcessHybrid: equalHistory(scoreRecords.map((record) =>
      (record.central as { projectAmbientExcessHybrid: Summary }).projectAmbientExcessHybrid.mse,
    )),
    lamb: equalHistory(lambMse),
    leaveOneHistoryOutContinuumRescale: equalHistory(rescaleMse),
  };
  const publishedScoreRecords = publishedNumericSnapshot(scoreRecords) as readonly StrictJson[];
  const publishedResult = publishedNumericSnapshot({
    comparatorFamilyMse,
    decisionEnvelope,
    refusals: {
      temperatureOneFactor: "not-implemented-promotion-unavailable",
      supersaturationOneFactor: "not-implemented-promotion-unavailable",
      unqualifiedFreeParticleTransfer: "ineligible-electric-field-and-apparatus-confound",
      facetHabitMorphology: "ineligible-unobserved",
      t500: "refused-strict-source-domain-t-less-than-500-seconds",
      hotOrLaterRows: "extrapolation-only-not-scored",
      validationCredit: "forbidden-development-evidence-only",
    },
  });
  const launch = {
    schema: "phase9-dbt-publication-launch-v1",
    scope: inputs.scope,
    protocolId: inputs.protocolId,
    launchManifest: inputs.launchManifest,
    launchAuthorization: inputs.launchAuthorization,
    sourceIdentities: inputs.sourceIdentities,
    registeredControlIds: inputs.registeredControlIds,
    preflightMutationRoster: PREFLIGHT_MUTATIONS,
  };
  const launchBytes = canonicalJsonBytes(launch);
  const diagnosticsBytes = jsonl(diagnostics);
  const scoreBytes = jsonl(publishedScoreRecords);
  const report = {
    schema: "phase9-dbt-report-v1",
    state: "candidate-awaiting-independent-byte-verification",
    scope: inputs.scope,
    protocolId: inputs.protocolId,
    historyCount: 6,
    claimBoundary: inputs.claimBoundary,
    registeredControlIds: inputs.registeredControlIds,
    numericRepresentation: {
      significantDecimalDigits: 7,
      reason: "independent IEEE-754 evaluation orders can differ by a few ulps",
    },
    result: publishedResult,
    artifacts: {
      launchManifest: artifact("launch-manifest.json", launchBytes, "canonical-json"),
      scores: artifact("scores.jsonl", scoreBytes, "canonical-jsonl"),
      sourceDiagnostics: artifact("source-diagnostics.jsonl", diagnosticsBytes, "canonical-jsonl"),
    },
    independentVerification: { producerSuppliesPass: false, status: "required-before-acceptance" },
  };
  const reportBytes = canonicalJsonBytes(report);
  const index = {
    schema: "phase9-dbt-artifact-index-v1",
    publication: "candidate",
    artifacts: [
      artifact("launch-manifest.json", launchBytes, "canonical-json"),
      artifact("report.json", reportBytes, "canonical-json"),
      artifact("scores.jsonl", scoreBytes, "canonical-jsonl"),
      artifact("source-diagnostics.jsonl", diagnosticsBytes, "canonical-jsonl"),
    ],
  };
  return {
    artifacts: new Map([
      ["artifact-index.json", canonicalJsonBytes(index)],
      ["launch-manifest.json", launchBytes],
      ["report.json", reportBytes],
      ["scores.jsonl", scoreBytes],
      ["source-diagnostics.jsonl", diagnosticsBytes],
    ]),
    histories,
    fits,
    scoreRecords,
    centralDecision,
  };
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function validateControlContext(context: Phase9DbtIndependentInputs["controlContext"]): void {
  const row = object(context.sourceOverlayRow, "D-BT shelf row");
  if (
    row.item !== "D-BT" ||
    row.sourceBlocked !== false ||
    row.sourceBlockerPresent !== false ||
    array(row.sourceBlockerIds, "sourceBlockerIds").length !== 0 ||
    array(row.blockerIdentities, "blockerIdentities").length !== 0 ||
    array(row.sourceBlockerStatuses, "sourceBlockerStatuses").length !== 0 ||
    row.protocolDispositionRequired !== true ||
    row.protocolDispositionState !== "pending"
  ) refuse("source-overlay", "D-BT shelf state differs");
  const restrictions = array(row.protocolRestrictions, "protocolRestrictions").map((entry) => object(entry, "restriction"));
  const discharges = object(context.restrictionDischarges, "restrictionDischarges");
  if (
    restrictions.length !== 9 || Object.keys(discharges).length !== 9 ||
    new Set(restrictions.map((entry) => entry.id)).size !== 9
  ) refuse("source-overlay-restrictions", "restriction roster differs");
  const expected = Object.entries(discharges).map(([id, value]) => {
    const discharge = object(value, `discharge ${id}`);
    if (
      discharge.id !== id || discharge.status !== "discharged" ||
      typeof discharge.localDischarge !== "string" || discharge.localDischarge.trim() === ""
    ) {
      refuse("source-overlay-restrictions", `${id} is not locally discharged`);
    }
    return {
      artifactSha256: discharge.artifactSha256,
      id: discharge.id,
      kind: discharge.kind,
      text: discharge.text,
    };
  }).sort((left, right) => String(left.id).localeCompare(String(right.id)));
  const actual = restrictions.map((restriction) => ({
    artifactSha256: restriction.artifactSha256,
    id: restriction.id,
    kind: restriction.kind,
    text: restriction.text,
  })).sort((left, right) => String(left.id).localeCompare(String(right.id)));
  if (canonicalJson(actual) !== canonicalJson(expected)) {
    refuse("source-overlay-restrictions", "restriction/discharge binding differs");
  }
  const complete = array(row.completeArtifactSha256, "completeArtifactSha256")
    .map((entry) => string(entry, "complete artifact SHA-256"));
  const completeSet = new Set(complete);
  if (
    row.completeArtifactCount !== completeSet.size || complete.length !== completeSet.size ||
    actual.some((entry) => !completeSet.has(string(entry.artifactSha256, "restriction artifact SHA-256")))
  ) refuse("source-overlay-restrictions", "restriction artifact lies outside the complete set");
  if (canonicalJson(context.operatorPins) !== canonicalJson(EXPECTED_OPERATOR_PINS)) {
    refuse("operator-pins", "operator pins differ");
  }
  validateRosterPins(context.roster);
}

function mutationRejected(
  id: string,
  expectedCode: string,
  operation: () => void,
): {
  readonly id: string;
  readonly mutationObserved: true;
  readonly rejectedOrDistinguished: true;
} {
  let observed: unknown;
  try {
    operation();
  } catch (error) {
    observed = error;
  }
  if (!(observed instanceof Phase9DbtVerifierRefusal) || observed.code !== expectedCode) {
    throw new Error(
      `independent negative control ${id} did not reach ${expectedCode}; observed ${
        observed instanceof Error ? `${observed.name}: ${observed.message}` : "no typed refusal"
      }`,
    );
  }
  return { id, mutationObserved: true, rejectedOrDistinguished: true };
}

function mutationDistinguished(id: string, predicate: () => boolean): {
  readonly id: string;
  readonly mutationObserved: true;
  readonly rejectedOrDistinguished: true;
} {
  if (!predicate()) throw new Error(`independent negative control did not distinguish: ${id}`);
  return { id, mutationObserved: true, rejectedOrDistinguished: true };
}

function executeControls(
  inputs: Phase9DbtIndependentInputs,
  reconstructed: Reconstructed,
  published: ReadonlyMap<string, Uint8Array>,
): Phase9DbtIndependentVerification["controls"] {
  validateControlContext(inputs.controlContext);
  const results: Phase9DbtIndependentVerification["controls"][number][] = [];
  const contextMutation = (
    id: string,
    expectedCode: string,
    mutate: (context: Phase9DbtIndependentInputs["controlContext"]) => void,
  ) => {
    results.push(mutationRejected(id, expectedCode, () => {
      const changed = clone(inputs.controlContext);
      mutate(changed);
      validateControlContext(changed);
    }));
  };
  contextMutation("source-overlay-blocked", "source-overlay", (context) => {
    (context.sourceOverlayRow as { sourceBlocked: boolean }).sourceBlocked = true;
  });
  contextMutation("source-overlay-blocker-present", "source-overlay", (context) => {
    (context.sourceOverlayRow as { sourceBlockerPresent: boolean }).sourceBlockerPresent = true;
    ((context.sourceOverlayRow as { blockerIdentities: string[] }).blockerIdentities).push("mutated-blocker");
  });
  contextMutation("source-overlay-blocker-id-injected", "source-overlay", (context) => {
    ((context.sourceOverlayRow as { sourceBlockerIds: string[] }).sourceBlockerIds).push("P9B-MUTATED");
  });
  contextMutation("source-overlay-restriction-change", "source-overlay-restrictions", (context) => {
    const first = (context.sourceOverlayRow as { protocolRestrictions: { text: string }[] }).protocolRestrictions[0];
    first.text += " mutation";
  });
  contextMutation("local-discharge-missing", "source-overlay-restrictions", (context) => {
    const first = Object.values(context.restrictionDischarges as Record<string, { localDischarge: string }>)[0];
    first.localDischarge = "";
  });
  results.push(mutationRejected("source-byte-change", "source-identity", () => {
    const changed = new Uint8Array(inputs.histories[0].sourceBytes);
    changed[changed.length - 1] ^= 1;
    parseTsv(changed, inputs.histories[0].pin);
  }));
  results.push(mutationRejected("roster-shift", "roster", () => {
    const changed = clone(inputs.histories);
    (changed[0].pin as { runId: string }).runId = "mutated-run";
    validateVerificationRoster({ ...inputs, histories: changed });
  }));
  results.push(mutationDistinguished("heldout-leakage", () => {
    const heldOutIndex = 0;
    const training = reconstructed.histories.filter((_history, index) => index !== heldOutIndex);
    const baseline = fit(training);
    const changed = clone(reconstructed.histories);
    (changed[heldOutIndex] as unknown as { observed: number[] }).observed =
      changed[heldOutIndex].observed.map((value) => value * 1.2);
    const refit = fit(changed.filter((_history, index) => index !== heldOutIndex));
    return canonicalJson(refit) === canonicalJson(baseline);
  }));
  results.push(mutationDistinguished("pooled-point-loss", () => {
    const lambSummaries = reconstructed.scoreRecords.map((record) => (record.central as { lamb: Summary }).lamb);
    const sampleCounts = new Set(lambSummaries.map((entry) => entry.sampleCount));
    if (sampleCounts.size < 2) {
      throw new Error("pooled-point-loss control requires genuinely unequal history sample counts");
    }
    const equal = equalHistory(lambSummaries.map((entry) => entry.mse));
    const pooled = lambSummaries.reduce((sum, entry) => sum + entry.mse * entry.sampleCount, 0) /
      lambSummaries.reduce((sum, entry) => sum + entry.sampleCount, 0);
    return pooled !== equal;
  }));
  results.push(mutationRejected("time-endpoint-shift", "grid", () => {
    validateGrid([...Array.from({ length: 500 }, (_unused, index) => index), 500]);
  }));
  results.push(mutationDistinguished("drive-semantics-swap", () => {
    const history = reconstructed.histories[0];
    const registered = integrate(history.condition, { kind: "hybrid" }, history.timesS);
    const changed = integrate(history.condition, { kind: "hybrid", saturationRatioSwap: true }, history.timesS);
    return canonicalJson(changed) !== canonicalJson(registered);
  }));
  results.push(mutationDistinguished("monotonic-observation-filter", () => {
    let witness: {
      readonly historyIndex: number;
      readonly rowIndex: number;
      readonly rows: readonly SourceRow[];
      readonly beforePreparedSha256: string;
      readonly afterPreparedSha256: string;
    } | undefined;
    for (let historyIndex = 0; historyIndex < inputs.histories.length && witness === undefined; historyIndex++) {
      const history = inputs.histories[historyIndex];
      const beforePreparedSha256 = preparedObservationSha256(prepare(history.sourceRows));
      for (let rowIndex = 1; rowIndex < history.sourceRows.length; rowIndex++) {
        if (history.sourceRows[rowIndex].massRatio >= history.sourceRows[rowIndex - 1].massRatio) continue;
        const rows = history.sourceRows.map((row) => ({ ...row }));
        rows[rowIndex] = { ...rows[rowIndex], massRatio: rows[rowIndex - 1].massRatio };
        const afterPreparedSha256 = preparedObservationSha256(prepare(rows));
        if (afterPreparedSha256 !== beforePreparedSha256) {
          witness = {
            historyIndex,
            rowIndex,
            rows,
            beforePreparedSha256,
            afterPreparedSha256,
          };
          break;
        }
      }
    }
    if (witness === undefined) {
      throw new Error(
        "monotonic-observation-filter premise failed: no measured decrease changes prepared observations",
      );
    }
    const history = inputs.histories[witness.historyIndex];
    if (
      witness.rows[witness.rowIndex].massRatio !== witness.rows[witness.rowIndex - 1].massRatio ||
      witness.beforePreparedSha256 === witness.afterPreparedSha256
    ) {
      throw new Error("monotonic-observation-filter did not execute its prepare-visible row mutation");
    }
    const filteredInputs: Phase9DbtIndependentInputs = {
      ...inputs,
      histories: inputs.histories.map((entry, index) => index === witness.historyIndex
        ? { ...entry, sourceRows: witness.rows }
        : entry),
    };
    const filteredReconstruction = reconstruct(filteredInputs);
    const preparedIdentity = (artifacts: ReadonlyMap<string, Uint8Array>): string => {
      const diagnostics = parseCanonicalJsonl(
        artifacts.get("source-diagnostics.jsonl") as Uint8Array,
        "monotonic-observation-filter diagnostics",
      );
      const diagnostic = diagnostics.find((entry) => entry.runId === history.pin.runId);
      if (diagnostic === undefined) throw new Error("monotonic-observation-filter target diagnostic is absent");
      return string(diagnostic.preparedObservationSha256, "prepared observation identity");
    };
    if (
      preparedIdentity(reconstructed.artifacts) !== witness.beforePreparedSha256 ||
      preparedIdentity(filteredReconstruction.artifacts) !== witness.afterPreparedSha256 ||
      witness.beforePreparedSha256 === witness.afterPreparedSha256
    ) {
      throw new Error("monotonic-observation-filter did not change the reconstructed prepared observation identity");
    }
    if (sameBytes(
      reconstructed.artifacts.get("scores.jsonl") as Uint8Array,
      filteredReconstruction.artifacts.get("scores.jsonl") as Uint8Array,
    )) {
      throw new Error("monotonic-observation-filter changed diagnostics without changing reconstructed scores");
    }
    return true;
  }));
  results.push(mutationDistinguished("coefficient-change", () => {
    const history = reconstructed.histories[0];
    const registered = integrate(history.condition, { kind: "lamb" }, history.timesS);
    const changed = integrate(history.condition, { kind: "lamb", exponent: 1.3 }, history.timesS);
    return canonicalJson(changed) !== canonicalJson(registered);
  }));
  results.push(mutationDistinguished("verdict-change", () => {
    const report = parseCanonicalJson(published.get("report.json") as Uint8Array, "published report") as Record<string, StrictJson>;
    const changed = clone(report) as unknown as {
      result: { decisionEnvelope: { central: { survives: boolean } } };
    };
    changed.result.decisionEnvelope.central.survives = !changed.result.decisionEnvelope.central.survives;
    return !sameBytes(canonicalJsonBytes(changed), reconstructed.artifacts.get("report.json") as Uint8Array);
  }));
  results.push(mutationDistinguished("protocol-code-or-test-byte-change", () => {
    const launch = parseCanonicalJson(published.get("launch-manifest.json") as Uint8Array, "published launch") as Record<string, StrictJson>;
    const changed = clone(launch) as unknown as {
      sourceIdentities: { path: string; sha256: string }[];
    };
    const source = changed.sourceIdentities.find((entry) => entry.path === PATHS.model);
    if (source === undefined) throw new Error("model identity is absent");
    source.sha256 = "0".repeat(64);
    return !sameBytes(canonicalJsonBytes(changed), reconstructed.artifacts.get("launch-manifest.json") as Uint8Array);
  }));
  if (canonicalJson(results.map((entry) => entry.id)) !== canonicalJson(CONTROL_IDS)) {
    throw new Error("independent mutation execution roster differs");
  }
  return results;
}

/** Reconstruct and byte-compare the complete candidate, then execute every registered mutation. */
export function verifyPhase9DbtPublication(
  inputs: Phase9DbtIndependentInputs,
  published: ReadonlyMap<string, Uint8Array>,
): Phase9DbtIndependentVerification {
  if (inputs.scope === "registered-source-score") {
    const capturedFingerprint = registeredVerificationFingerprints.get(inputs);
    if (capturedFingerprint === undefined || capturedFingerprint !== verificationFingerprint(inputs)) {
      throw new Error("registered D-BT verification inputs were not captured intact by this verifier instance");
    }
  }
  if (canonicalJson([...published.keys()].sort()) !== canonicalJson([...FILES].sort())) {
    throw new Error("published D-BT file set differs");
  }
  const reconstructed = reconstruct(inputs);
  for (const name of FILES) {
    if (!sameBytes(published.get(name) as Uint8Array, reconstructed.artifacts.get(name) as Uint8Array)) {
      throw new Error(`published D-BT artifact differs from independent reconstruction: ${name}`);
    }
  }
  const controls = executeControls(inputs, reconstructed, published);
  return {
    ok: true,
    historyCount: 6,
    artifactCount: 5,
    rawRowsReparsed: inputs.histories.reduce((sum, history) => sum + history.sourceRows.length, 0),
    controls,
    limitations: [
      "development evidence only; this verifier grants no validation label",
      "the verifier does not establish unqualified transfer outside electrodynamic levitation",
      "the public IceNODE snapshot still does not establish a definitive training-history identity join",
    ],
  };
}

function sourceOverlayControlContext(protocol: Record<string, unknown>, shelfBytes: Uint8Array): Phase9DbtIndependentInputs["controlContext"] {
  const upstream = object(protocol.upstreamBindings, "protocol upstream bindings");
  const sourceOverlay = object(upstream.sourceOverlay, "source overlay binding");
  const shelf = parseJson<{ readonly shelf: readonly StrictJson[] }>(shelfBytes, "S0B shelf freeze");
  const row = shelf.shelf.find((entry) => object(entry, "shelf row").item === "D-BT");
  if (row === undefined) throw new Error("S0B shelf lacks D-BT");
  const launchPreflight = object(protocol.launchPreflight, "protocol launch preflight");
  return {
    sourceOverlayRow: row,
    restrictionDischarges: strictJsonSnapshot(sourceOverlay.restrictionDischarges),
    operatorPins: strictJsonSnapshot(launchPreflight.requiredOperatorPins),
    roster: strictJsonSnapshot(protocol.primaryRoster),
  };
}

function independentLaunchManifest(
  protocol: Record<string, unknown>,
  sourceFiles: ReadonlyMap<string, Uint8Array>,
  shelfBytes: Uint8Array,
  adapterRows: readonly Record<string, unknown>[],
): StrictJson {
  const roster = array(protocol.primaryRoster, "protocol roster").map((entry) => object(entry, "roster entry"));
  const upstream = object(protocol.upstreamBindings, "upstream bindings");
  const sourceOverlay = object(upstream.sourceOverlay, "source overlay");
  const shelf = parseJson<{ readonly schema: string; readonly shelf: readonly StrictJson[] }>(shelfBytes, "S0B shelf");
  const shelfRow = shelf.shelf.find((entry) => object(entry, "shelf row").item === "D-BT");
  if (shelfRow === undefined) throw new Error("S0B shelf lacks D-BT");
  const mappings = roster.map((entry) => {
    const selectionId = string(entry.selectionId, "selectionId");
    const adapter = adapterRows.find((row) => row.selectionId === selectionId);
    if (adapter === undefined) throw new Error(`adapter registry lacks ${selectionId}`);
    const uses = array(adapter.requestedUses, "adapter uses").map((use) => object(use, "adapter use"));
    return {
      selectionId,
      adapterKind: adapter.adapterKind,
      bindingKind: adapter.bindingKind,
      scalarMassHistoryDevelopmentStatus: uses.find((use) => use.purpose === "scalar-mass-history-development")?.status,
      unqualifiedFreeParticleTransferStatus: uses.find((use) => use.purpose === "unqualified-free-particle-transfer")?.status,
    };
  });
  const launch = object(protocol.launchPreflight, "launch preflight");
  return strictJsonSnapshot({
    schema: "phase9-dbt-launch-manifest-v1",
    identities: {
      protocol: identity(PATHS.protocol, sourceFiles.get(PATHS.protocol) as Uint8Array),
      implementation: identity(PATHS.model, sourceFiles.get(PATHS.model) as Uint8Array),
      test: identity(PATHS.modelTest, sourceFiles.get(PATHS.modelTest) as Uint8Array),
      preflightImplementation: identity(PATHS.preflight, sourceFiles.get(PATHS.preflight) as Uint8Array),
      preflightTest: identity(PATHS.preflightTest, sourceFiles.get(PATHS.preflightTest) as Uint8Array),
      sourceOverlayShelfFreeze: identity(string(sourceOverlay.shelfFreezePath, "shelf path"), shelfBytes),
      adapterRegistry: identity(PATHS.adapterRegistry, sourceFiles.get(PATHS.adapterRegistry) as Uint8Array),
    },
    sourceOverlayShelf: { schema: shelf.schema, row: shelfRow },
    adapterMappings: mappings,
    primaryRoster: roster,
    operatorPins: launch.requiredOperatorPins,
  });
}

function independentLaunchAuthorization(
  bytes: Uint8Array,
  path: string,
  protocolId: string,
  sourceFiles: ReadonlyMap<string, Uint8Array>,
  shelfPath: string,
): Phase9DbtIndependentInputs["launchAuthorization"] {
  const authorization = object(
    parseCanonicalJson(bytes, "D-BT launch authorization"),
    "D-BT launch authorization",
  );
  const bound = (sourcePath: string) => {
    const source = sourceFiles.get(sourcePath);
    if (source === undefined) throw new Error(`launch authorization source is absent: ${sourcePath}`);
    return identity(sourcePath, source);
  };
  const expectedIdentities = {
    protocol: bound(PATHS.protocol),
    modelImplementation: bound(PATHS.model),
    modelTest: bound(PATHS.modelTest),
    preflightImplementation: bound(PATHS.preflight),
    preflightTest: bound(PATHS.preflightTest),
    producerImplementation: bound(PATHS.producer),
    independentVerifierImplementation: bound(PATHS.independentVerifier),
    publicationTest: bound(PATHS.publicationTest),
    sourceOverlayShelfFreeze: bound(shelfPath),
    adapterRegistry: bound(PATHS.adapterRegistry),
  };
  if (
    authorization.schema !== "phase9-dbt-launch-v1" ||
    authorization.protocolId !== protocolId ||
    authorization.scoreMayRun !== true ||
    canonicalJson(authorization.registeredControlIds) !== canonicalJson(CONTROL_IDS) ||
    canonicalJson(authorization.identities) !== canonicalJson(expectedIdentities)
  ) throw new Error("D-BT launch authorization differs from independently observed final bytes");
  const checks = object(authorization.syntheticChecks, "synthetic checks");
  const review = object(authorization.independentReview, "independent review");
  const independentlyReexecuted = array(review.independentlyReexecuted, "review reexecution")
    .map((entry) => string(entry, "review reexecution entry"));
  const notChecked = array(review.notChecked, "review limits")
    .map((entry) => string(entry, "review limit"));
  if (
    checks.status !== "passed" ||
    string(checks.command, "synthetic check command").trim() === "" ||
    review.status !== "accepted" ||
    string(review.reviewerModel, "reviewer model").trim() === "" ||
    typeof review.sharedContextWithDeveloper !== "boolean" ||
    independentlyReexecuted.length === 0 ||
    notChecked.length === 0
  ) throw new Error("D-BT launch authorization review record is incomplete");
  return {
    identity: identity(path, bytes),
    syntheticChecks: {
      command: string(checks.command, "synthetic check command"),
      status: "passed",
    },
    independentReview: {
      status: "accepted",
      reviewerModel: string(review.reviewerModel, "reviewer model"),
      sharedContextWithDeveloper: review.sharedContextWithDeveloper,
      independentlyReexecuted,
      notChecked,
    },
  };
}

/** Independently capture production inputs without using producer parsing or model code. */
export function captureRegisteredPhase9DbtVerificationInputs(options: {
  readonly repositoryRoot: string;
  readonly nasRoot?: string;
  readonly launchManifestPath: string;
}): Phase9DbtIndependentInputs {
  const repositoryRoot = resolve(options.repositoryRoot);
  const sourceFiles = new Map<string, Uint8Array>();
  for (const path of [
    PATHS.protocol,
    PATHS.model,
    PATHS.modelTest,
    PATHS.preflight,
    PATHS.preflightTest,
    PATHS.producer,
    PATHS.independentVerifier,
    PATHS.publicationTest,
    PATHS.adapterRegistry,
    PATHS.successorBook,
    PATHS.nativeRecords,
  ]) sourceFiles.set(path, readRegular(repositoryRoot, path));
  if (
    canonicalJson(identity(PATHS.protocol, sourceFiles.get(PATHS.protocol) as Uint8Array)) !==
    canonicalJson(FROZEN_PROTOCOL_IDENTITY)
  ) refuse("frozen-protocol", "protocol bytes differ from the exact v1 freeze");
  const protocol = object(parseJson(sourceFiles.get(PATHS.protocol) as Uint8Array, "D-BT protocol"), "D-BT protocol");
  const upstream = object(protocol.upstreamBindings, "upstream bindings");
  const sourceOverlay = object(upstream.sourceOverlay, "source overlay binding");
  const shelfPath = string(sourceOverlay.shelfFreezePath, "shelf path");
  const shelfBytes = readRegular(repositoryRoot, shelfPath);
  sourceFiles.set(shelfPath, shelfBytes);
  const adapterRows = parseCanonicalJsonl(
    sourceFiles.get(PATHS.adapterRegistry) as Uint8Array,
    "adapter registry",
  );
  const registration = independentLaunchManifest(protocol, sourceFiles, shelfBytes, adapterRows);

  // Re-read every repository input involved in release authorization, then run the full static
  // preflight before the authorization file or any NAS observation TSV is consumed.
  const observedFiles = new Map<string, Uint8Array>();
  for (const path of sourceFiles.keys()) observedFiles.set(path, readRegular(repositoryRoot, path));
  const observedShelfBytes = readRegular(repositoryRoot, shelfPath);
  observedFiles.set(shelfPath, observedShelfBytes);
  for (const [path, registeredBytes] of sourceFiles) {
    const observedBytes = observedFiles.get(path) as Uint8Array;
    if (canonicalJson(identity(path, registeredBytes)) !== canonicalJson(identity(path, observedBytes))) {
      refuse("registered-observed-parity", `${path} changed between registration and observation`);
    }
  }
  const observedProtocol = object(
    parseJson(observedFiles.get(PATHS.protocol) as Uint8Array, "observed D-BT protocol"),
    "observed D-BT protocol",
  );
  const observedAdapterRows = parseCanonicalJsonl(
    observedFiles.get(PATHS.adapterRegistry) as Uint8Array,
    "observed adapter registry",
  );
  const observed = independentLaunchManifest(
    observedProtocol,
    observedFiles,
    observedShelfBytes,
    observedAdapterRows,
  );
  independentlyValidatePhase9DbtLaunchPreflight(protocol, registration, observed);

  const controls = array(protocol.preRunControls, "pre-run controls")
    .map((entry) => string(object(entry, "control").id, "control ID"));
  const launchAuthorizationBytes = readRegular(repositoryRoot, options.launchManifestPath);
  const launchAuthorization = independentLaunchAuthorization(
    launchAuthorizationBytes,
    options.launchManifestPath,
    string(protocol.protocolId, "protocol ID"),
    observedFiles,
    shelfPath,
  );
  const successorRows = parseCanonicalJsonl(observedFiles.get(PATHS.successorBook) as Uint8Array, "successor book");
  const metadataRows = parseCanonicalJsonl(observedFiles.get(PATHS.nativeRecords) as Uint8Array, "native records");
  const nasRoot = options.nasRoot ?? detectPhase9NasRoot();
  if (nasRoot === null) throw new Error("the snowcrystal NAS share is not mounted");

  const sourceBytes = object(protocol.sourceBytes, "protocol source bytes");
  const lamb = object(sourceBytes.lambPaper, "Lamb paper pin");
  const archive = object(sourceBytes.iceNodeArchive, "IceNODE pin") as unknown as
    Phase9DbtIndependentIceNodeArchivePin;
  const nelson = object(sourceBytes.nelsonBakerPrimary, "Nelson-Baker pin");
  const lambPath = string(lamb.logicalPath, "Lamb logical path");
  const archivePath = string(archive.logicalPath, "IceNODE logical path");
  const nelsonPath = string(nelson.logicalPath, "Nelson-Baker logical path");
  const lambBytes = readNas(lambPath, nasRoot);
  const archiveBytes = readNas(archivePath, nasRoot);
  const nelsonBytes = readNas(nelsonPath, nasRoot);
  if (
    lambBytes.byteLength !== number(lamb.byteLength, "Lamb bytes") ||
    sha256Bytes(lambBytes) !== string(lamb.sha256, "Lamb SHA-256")
  ) refuse("source-identity", "Lamb source bytes differ");
  const archiveMemberIdentities = independentlyBindPhase9DbtIceNodeArchiveMembers(archive, archiveBytes);
  if (sha256Bytes(nelsonBytes) !== string(nelson.sha256, "Nelson-Baker SHA-256")) {
    refuse("source-identity", "Nelson-Baker source bytes differ");
  }
  const external = [
    identity(lambPath, lambBytes),
    identity(archivePath, archiveBytes),
    ...archiveMemberIdentities,
    identity(nelsonPath, nelsonBytes),
  ];

  const roster = array(protocol.primaryRoster, "protocol roster") as readonly unknown[];
  const histories = roster.map((raw): Phase9DbtIndependentHistory => {
    const pin = object(raw, "roster pin") as unknown as RosterPin;
    const successor = successorRows.find((row) => row.selectionId === pin.selectionId);
    if (successor === undefined) throw new Error(`successor book lacks ${pin.selectionId}`);
    const binding = object(successor.binding, `${pin.selectionId} binding`);
    const bindingRow = object(binding.rowArtifact, `${pin.selectionId} successor row artifact`);
    const expectedBindingRow = {
      logicalRoot: pin.rowArtifact.logicalRoot,
      path: pin.rowArtifact.path,
      byteLength: pin.rowArtifact.byteLength,
      rowCount: pin.rowArtifact.rowCount,
      sha256: pin.rowArtifact.sha256,
    };
    if (
      successor.phase9EvidenceRole !== "model-development" ||
      successor.split !== "development" ||
      binding.kind !== "native-history" ||
      binding.metadataRecordId !== pin.metadataRecordId ||
      binding.sourceUnitId !== pin.sourceUnitId ||
      canonicalJson(bindingRow) !== canonicalJson(expectedBindingRow)
    ) throw new Error(`${pin.runId} successor binding differs`);
    const metadata = metadataRows.find((row) => row.id === pin.metadataRecordId);
    if (
      metadata === undefined ||
      metadata.schema !== "phase8b-native-history-v1" ||
      metadata.sourceUnitId !== pin.sourceUnitId ||
      metadata.runId !== pin.runId ||
      metadata.historyKind !== "mass-ratio" ||
      metadata.developmentRole !== "model-development" ||
      metadata.disposition !== "included-native-history" ||
      metadata.sourceRows !== pin.rowArtifact.rowCount
    ) {
      throw new Error(`${pin.runId} native metadata identity differs`);
    }
    const normalized = object(metadata.normalized, `${pin.runId} normalized descriptor`);
    if (
      normalized.logicalRoot !== pin.rowArtifact.logicalRoot ||
      normalized.path !== pin.rowArtifact.path ||
      normalized.byteLength !== pin.rowArtifact.byteLength ||
      normalized.sha256 !== pin.rowArtifact.sha256 ||
      normalized.header !== "sourceRowIndex\ttime_s\tmass_ratio" ||
      normalized.sourceLexemesPreserved !== true
    ) throw new Error(`${pin.runId} normalized source descriptor differs`);
    const metadataConditions = object(metadata.conditions, `${pin.runId} metadata conditions`);
    for (const [field, expected] of Object.entries(pin.conditions)) {
      if (canonicalJson(metadataConditions[field]) !== canonicalJson(expected)) {
        throw new Error(`${pin.runId} corrected condition differs: ${field}`);
      }
    }
    if (typeof metadataConditions.covariance !== "string") {
      throw new Error(`${pin.runId} covariance limitation is absent`);
    }
    const adapter = observedAdapterRows.find((row) => row.selectionId === pin.selectionId);
    if (adapter === undefined || adapter.adapterKind !== "free-particle-mass" || adapter.bindingKind !== "native-history") {
      throw new Error(`${pin.runId} adapter binding differs`);
    }
    const uses = array(adapter.requestedUses, "adapter uses").map((entry) => object(entry, "adapter use"));
    const requested = uses.find((entry) => entry.purpose === "scalar-mass-history-development");
    if (requested?.status !== "eligible-with-limitation") throw new Error(`${pin.runId} scalar use differs`);
    const bytes = readNas(key(pin), nasRoot);
    const sourceRows = parseTsv(bytes, pin);
    const reasons = [
      "the levitated-particle apparatus is not an unqualified free-particle transfer",
      "crystallography and habit were not observed",
      "the source-stated five-percent mass-ratio error is not a probability interval",
      requested.reasonCode,
      ...array(adapter.restrictions, "adapter restrictions"),
    ].map((entry) => string(entry, "adapter reason"));
    return {
      pin,
      condition: {
        tempK: pin.conditions.tempC + 273.15,
        pressurePa: pin.conditions.pressurePa,
        excessIceSupersaturationFraction: pin.conditions.sigmaIcePercent / 100,
        initialRadiusUm: pin.conditions.initialRadiusUm,
      },
      sourceRows,
      sourceBytes: bytes,
      adapterReasons: [...new Set(reasons)],
    };
  });
  const sourceIdentities = [
    identity(PATHS.protocol, observedFiles.get(PATHS.protocol) as Uint8Array),
    identity(PATHS.model, observedFiles.get(PATHS.model) as Uint8Array),
    identity(PATHS.modelTest, observedFiles.get(PATHS.modelTest) as Uint8Array),
    identity(PATHS.preflight, observedFiles.get(PATHS.preflight) as Uint8Array),
    identity(PATHS.preflightTest, observedFiles.get(PATHS.preflightTest) as Uint8Array),
    identity(shelfPath, observedShelfBytes),
    identity(PATHS.adapterRegistry, observedFiles.get(PATHS.adapterRegistry) as Uint8Array),
    identity(PATHS.successorBook, observedFiles.get(PATHS.successorBook) as Uint8Array),
    identity(PATHS.nativeRecords, observedFiles.get(PATHS.nativeRecords) as Uint8Array),
    ...external,
    launchAuthorization.identity,
    ...histories.map((history) => identity(key(history.pin), history.sourceBytes)),
  ];
  if (new Set(sourceIdentities.map((entry) => entry.path)).size !== sourceIdentities.length) {
    refuse("source-identity", "source identity graph contains duplicate paths");
  }
  const lineage = object(protocol.lineage, "lineage");
  const claim = object(protocol.claimBoundary, "claim boundary");
  const inputs: Phase9DbtIndependentInputs = {
    scope: "registered-source-score",
    protocolId: string(protocol.protocolId, "protocol ID"),
    launchManifest: observed,
    launchAuthorization,
    sourceIdentities,
    histories,
    registeredControlIds: controls,
    claimBoundary: {
      developmentEvidenceOnly: true,
      grantsValidationClaim: false,
      unqualifiedFreeParticleTransfer: false,
      facetHabitOrMorphologyPrediction: false,
      lineageStatus: string(lineage.status, "lineage status"),
      apparatusLimit: string(claim.apparatusLimit, "apparatus limit"),
    },
    controlContext: sourceOverlayControlContext(protocol, observedShelfBytes),
  };
  registeredVerificationFingerprints.set(inputs, verificationFingerprint(inputs));
  return inputs;
}

export function readPhase9DbtPublishedDirectory(directory: string): ReadonlyMap<string, Uint8Array> {
  if (canonicalJson(readdirSync(directory).sort()) !== canonicalJson([...FILES].sort())) {
    throw new Error("published D-BT directory file set differs");
  }
  return new Map(FILES.map((name) => {
    const path = join(directory, name);
    const status = lstatSync(path);
    if (!status.isFile() || status.isSymbolicLink()) throw new Error(`${name} is not a regular file`);
    return [name, new Uint8Array(readFileSync(path))] as const;
  }));
}

function usage(): never {
  throw new Error(
    "usage: node runner/src/phase9-dbt-publication-verify.ts verify " +
    "--repository-root ROOT --launch-manifest REPOSITORY_RELATIVE_PATH " +
    "--bundle DIRECTORY [--nas-root SHARE_ROOT]",
  );
}

function arg(argv: readonly string[], name: string, required: boolean): string | undefined {
  const index = argv.indexOf(name);
  if (index < 0) {
    if (required) usage();
    return undefined;
  }
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) usage();
  return value;
}

function main(argv: readonly string[]): void {
  if (argv[0] !== "verify") usage();
  const repositoryRoot = arg(argv, "--repository-root", true) as string;
  const launchManifestPath = arg(argv, "--launch-manifest", true) as string;
  const directory = arg(argv, "--bundle", true) as string;
  const nasRoot = arg(argv, "--nas-root", false);
  const inputs = captureRegisteredPhase9DbtVerificationInputs({
    repositoryRoot,
    nasRoot,
    launchManifestPath,
  });
  const result = verifyPhase9DbtPublication(inputs, readPhase9DbtPublishedDirectory(directory));
  process.stdout.write(`${canonicalJson(result)}\n`);
}

const invokedPath = process.argv[1] === undefined ? null : pathToFileURL(resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) main(process.argv.slice(2));
