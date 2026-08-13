// Phase 9 D-BT source-data publication candidate.
//
// The command-line path is intentionally explicit and standalone. It resolves the six registered
// NAS rows through the portable share resolver, validates them through S1 and the pure D-BT
// preflight, then writes only derived diagnostics and scores. Raw normalized histories remain on
// the NAS under their existing rights boundary. A candidate is not accepted evidence until the
// sibling verifier reconstructs every published byte and executes the registered mutations.

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
import { basename, dirname, join, resolve, sep } from "node:path";
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
  type Phase9AdaptedObservation,
} from "./phase9-measurement-adapters.ts";
import { phase8bReadZipInventory } from "./phase8-corpus-local.ts";
import {
  phase9DbtDecisionEnvelope,
  phase9DbtEqualHistoryMse,
  phase9DbtFitPrimaryLeaveOneHistoryOut,
  phase9DbtFivePercentSensitivity,
  phase9DbtIntegrateMassRatios,
  phase9DbtPrepareObservations,
  phase9DbtSummarizeResiduals,
  type Phase9DbtCondition,
  type Phase9DbtHistory,
  type Phase9DbtResidualSummary,
  type Phase9DbtSensitivityComparison,
  type Phase9DbtSourceRow,
} from "./phase9-dbt-model.ts";
import {
  PHASE9_DBT_PREFLIGHT_MUTATIONS,
  phase9DbtRunLaunchPreflight,
  type Phase9DbtAdapterMappingPin,
  type Phase9DbtArtifactIdentity,
  type Phase9DbtLaunchManifest,
  type Phase9DbtPreflightProtocol,
  type Phase9DbtRosterPin,
} from "./phase9-dbt-preflight.ts";
import {
  detectPhase9NasRoot,
  resolvePhase9NasFile,
} from "./phase9-nas.ts";

const PROTOCOL_PATH = "research/phase9-dbt-protocol-v1.json";
const MODEL_PATH = "runner/src/phase9-dbt-model.ts";
const MODEL_TEST_PATH = "runner/test/phase9-dbt-model.test.ts";
const PREFLIGHT_PATH = "runner/src/phase9-dbt-preflight.ts";
const PREFLIGHT_TEST_PATH = "runner/test/phase9-dbt-preflight.test.ts";
const PRODUCER_PATH = "runner/src/phase9-dbt-publication.ts";
const VERIFIER_PATH = "runner/src/phase9-dbt-publication-verify.ts";
const PUBLICATION_TEST_PATH = "runner/test/phase9-dbt-publication.test.ts";
const ADAPTER_REGISTRY_PATH = "research/phase9-adapter-registry-v1.jsonl";
const SUCCESSOR_BOOK_PATH = "evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl";
const NATIVE_RECORDS_PATH = "evidence/phase8b-native-histories-v1/records.jsonl";
const FROZEN_PROTOCOL_IDENTITY = Object.freeze({
  path: PROTOCOL_PATH,
  byteLength: 37_190,
  sha256: "43cb25b802d7f088fc3e4259e7d5455ca2172d439f84bf8040631de5c23c9943",
});

export const PHASE9_DBT_PUBLICATION_FILES = Object.freeze([
  "artifact-index.json",
  "launch-manifest.json",
  "report.json",
  "scores.jsonl",
  "source-diagnostics.jsonl",
] as const);

export const PHASE9_DBT_REGISTERED_CONTROL_IDS = Object.freeze([
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
] as const);

type PublicationScope = "registered-source-score" | "synthetic-fixture";

interface DbtProtocol extends Phase9DbtPreflightProtocol {
  readonly protocolId: string;
  readonly state: {
    readonly phase9Role: string;
    readonly grantsValidationClaim: false;
  };
  readonly claimBoundary: {
    readonly allowed: readonly string[];
    readonly forbidden: readonly string[];
    readonly apparatusLimit: string;
  };
  readonly sourceBytes: {
    readonly lambPaper: SourceBytePin;
    readonly iceNodeArchive: Phase9DbtIceNodeArchivePin;
    readonly nelsonBakerPrimary: {
      readonly logicalPath: string;
      readonly sha256: string;
    };
  };
  readonly lineage: {
    readonly status: string;
    readonly whyNotDefinitive: readonly string[];
  };
  readonly preRunControls: readonly { readonly id: string }[];
  readonly launchPreflight: Phase9DbtPreflightProtocol["launchPreflight"] & {
    readonly status: string;
    readonly publisherContract: {
      readonly name: string;
      readonly state: string;
      readonly mustDo: string;
    };
    readonly verifierContract: {
      readonly name: string;
      readonly state: string;
      readonly mustDo: string;
    };
  };
}

interface SourceBytePin {
  readonly logicalPath: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase9DbtIceNodeArchivePin extends SourceBytePin {
  readonly archiveCommit: string;
  readonly loadBearingMembers: readonly {
    readonly path: string;
    readonly sha256: string;
  }[];
}

const FROZEN_PRE_OUTPUT_STATE = Object.freeze({
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

const FROZEN_PUBLICATION_CONTRACT = Object.freeze({
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

/** The protocol stays explicitly blocked until a separate final-byte authorization is supplied. */
export function validatePhase9DbtFrozenPreOutputState(protocolValue: unknown): void {
  const protocol = strictObject(protocolValue, "D-BT protocol");
  if (canonicalJson(protocol.state) !== canonicalJson(FROZEN_PRE_OUTPUT_STATE)) {
    throw new Error("D-BT frozen pre-output state differs");
  }
  const launch = strictObject(protocol.launchPreflight, "D-BT launch preflight");
  const actualContract = {
    status: launch.status,
    publisherContract: launch.publisherContract,
    verifierContract: launch.verifierContract,
  };
  if (canonicalJson(actualContract) !== canonicalJson(FROZEN_PUBLICATION_CONTRACT)) {
    throw new Error("D-BT frozen publisher/verifier blocker contract differs");
  }
}

export interface Phase9DbtBoundHistory {
  readonly pin: Phase9DbtRosterPin;
  readonly condition: Phase9DbtCondition;
  readonly sourceRows: readonly Phase9DbtSourceRow[];
  readonly sourceBytes: Uint8Array;
  readonly adapterStatus: "eligible-with-limitation";
  readonly adapterReasons: readonly string[];
}

export interface Phase9DbtRunMaterial {
  readonly scope: PublicationScope;
  readonly protocolId: string;
  readonly launchManifest: StrictJson;
  readonly launchAuthorization: Phase9DbtLaunchAuthorizationRecord;
  readonly sourceIdentities: readonly Phase9DbtArtifactIdentity[];
  readonly histories: readonly Phase9DbtBoundHistory[];
  readonly registeredControlIds: readonly string[];
  readonly claimBoundary: {
    readonly developmentEvidenceOnly: true;
    readonly grantsValidationClaim: false;
    readonly unqualifiedFreeParticleTransfer: false;
    readonly facetHabitOrMorphologyPrediction: false;
    readonly lineageStatus: string;
    readonly apparatusLimit: string;
  };
}

export interface Phase9DbtLaunchAuthorizationRecord {
  readonly identity: Phase9DbtArtifactIdentity;
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
}

interface Phase9DbtLaunchAuthorization {
  readonly schema: "phase9-dbt-launch-v1";
  readonly protocolId: string;
  readonly scoreMayRun: true;
  readonly registeredControlIds: readonly string[];
  readonly syntheticChecks: Phase9DbtLaunchAuthorizationRecord["syntheticChecks"];
  readonly independentReview: Phase9DbtLaunchAuthorizationRecord["independentReview"];
  readonly identities: {
    readonly protocol: Phase9DbtArtifactIdentity;
    readonly modelImplementation: Phase9DbtArtifactIdentity;
    readonly modelTest: Phase9DbtArtifactIdentity;
    readonly preflightImplementation: Phase9DbtArtifactIdentity;
    readonly preflightTest: Phase9DbtArtifactIdentity;
    readonly producerImplementation: Phase9DbtArtifactIdentity;
    readonly independentVerifierImplementation: Phase9DbtArtifactIdentity;
    readonly publicationTest: Phase9DbtArtifactIdentity;
    readonly sourceOverlayShelfFreeze: Phase9DbtArtifactIdentity;
    readonly adapterRegistry: Phase9DbtArtifactIdentity;
  };
}

export interface Phase9DbtPublicationBundle {
  readonly scope: PublicationScope;
  readonly artifacts: ReadonlyMap<string, Uint8Array>;
  readonly centralDecision: {
    readonly survives: boolean;
    readonly label: string;
  };
}

interface ScoreRecord {
  readonly schema: "phase9-dbt-history-score-v1";
  readonly selectionId: string;
  readonly runId: string;
  readonly central: {
    readonly continuum: Phase9DbtResidualSummary;
    readonly projectAmbientExcessHybrid: Phase9DbtResidualSummary;
    readonly lamb: Phase9DbtResidualSummary;
    readonly leaveOneHistoryOutContinuumRescale: Phase9DbtResidualSummary;
  };
  readonly leaveOneHistoryOutFit: {
    readonly multiplier: number;
    readonly equalHistoryMse: number;
    readonly boundary: "minimum" | "interior" | "maximum";
    readonly trainingHistoryIds: readonly string[];
  };
  readonly initialRadiusHeldoutOnly: {
    readonly lower: NamedPair;
    readonly upper: NamedPair;
  };
  readonly massRatioFivePercentHeldoutOnly: {
    readonly lamb: ReturnType<typeof phase9DbtFivePercentSensitivity>;
    readonly leaveOneHistoryOutContinuumRescale: ReturnType<typeof phase9DbtFivePercentSensitivity>;
  };
}

interface NamedPair {
  readonly initialRadiusUm: number;
  readonly lambMse: number;
  readonly leaveOneHistoryOutContinuumRescaleMse: number;
}

function strictObject(value: unknown, label: string): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function exactSet(actual: Iterable<string>, expected: readonly string[], label: string): void {
  if (canonicalJson([...actual].sort()) !== canonicalJson([...expected].sort())) {
    throw new Error(`${label} differs`);
  }
}

function identity(path: string, bytes: Uint8Array): Phase9DbtArtifactIdentity {
  return { path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function authorizationIdentityEntries(
  repositoryBytes: ReadonlyMap<string, Uint8Array>,
  shelfPath: string,
): Phase9DbtLaunchAuthorization["identities"] {
  const bound = (path: string): Phase9DbtArtifactIdentity => {
    const bytes = repositoryBytes.get(path);
    if (bytes === undefined) throw new Error(`launch authorization input is absent: ${path}`);
    return identity(path, bytes);
  };
  return {
    protocol: bound(PROTOCOL_PATH),
    modelImplementation: bound(MODEL_PATH),
    modelTest: bound(MODEL_TEST_PATH),
    preflightImplementation: bound(PREFLIGHT_PATH),
    preflightTest: bound(PREFLIGHT_TEST_PATH),
    producerImplementation: bound(PRODUCER_PATH),
    independentVerifierImplementation: bound(VERIFIER_PATH),
    publicationTest: bound(PUBLICATION_TEST_PATH),
    sourceOverlayShelfFreeze: bound(shelfPath),
    adapterRegistry: bound(ADAPTER_REGISTRY_PATH),
  };
}

/** Validate the separate, post-review release record. The frozen protocol itself stays unchanged. */
export function validatePhase9DbtLaunchAuthorization(
  bytes: Uint8Array,
  expected: {
    readonly path: string;
    readonly protocolId: string;
    readonly identities: Phase9DbtLaunchAuthorization["identities"];
  },
): Phase9DbtLaunchAuthorizationRecord {
  const parsed = parseCanonicalJson(bytes, "Phase 9 D-BT launch authorization") as unknown as
    Phase9DbtLaunchAuthorization;
  if (
    parsed.schema !== "phase9-dbt-launch-v1" ||
    parsed.protocolId !== expected.protocolId ||
    parsed.scoreMayRun !== true ||
    canonicalJson(parsed.registeredControlIds) !== canonicalJson(PHASE9_DBT_REGISTERED_CONTROL_IDS) ||
    canonicalJson(parsed.identities) !== canonicalJson(expected.identities)
  ) {
    throw new Error("D-BT launch authorization is absent, false, or differs from final bytes");
  }
  if (
    parsed.syntheticChecks.status !== "passed" ||
    parsed.syntheticChecks.command.trim().length === 0 ||
    parsed.independentReview.status !== "accepted" ||
    parsed.independentReview.reviewerModel.trim().length === 0 ||
    parsed.independentReview.independentlyReexecuted.length === 0 ||
    parsed.independentReview.notChecked.length === 0 ||
    parsed.independentReview.independentlyReexecuted.some((entry) => entry.trim().length === 0) ||
    parsed.independentReview.notChecked.some((entry) => entry.trim().length === 0)
  ) {
    throw new Error("D-BT launch authorization lacks the required synthetic-check or review record");
  }
  return {
    identity: identity(expected.path, bytes),
    syntheticChecks: parsed.syntheticChecks,
    independentReview: parsed.independentReview,
  };
}

function readRegular(repositoryRoot: string, relativePath: string): Uint8Array {
  if (
    relativePath.startsWith("/") ||
    relativePath.includes("\\") ||
    relativePath.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(`repository path is unsafe: ${relativePath}`);
  }
  const root = resolve(repositoryRoot);
  const path = resolve(root, relativePath);
  if (path !== root && !path.startsWith(`${root}${sep}`)) {
    throw new Error(`repository path leaves the root: ${relativePath}`);
  }
  const status = lstatSync(path);
  if (!status.isFile() || status.isSymbolicLink()) {
    throw new Error(`repository input is not a regular non-symlink file: ${relativePath}`);
  }
  return new Uint8Array(readFileSync(path));
}

function parseJson<T>(bytes: Uint8Array, label: string): T {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} is not UTF-8`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`${label} is not JSON`);
  }
}

function adapterMappings(
  registryBytes: Uint8Array,
  roster: readonly Phase9DbtRosterPin[],
): readonly Phase9DbtAdapterMappingPin[] {
  const rows = new TextDecoder().decode(registryBytes).trim().split("\n").map((line) =>
    JSON.parse(line) as {
      readonly selectionId: string;
      readonly adapterKind: string;
      readonly bindingKind: string;
      readonly requestedUses: readonly { readonly purpose: string; readonly status: string }[];
    }
  );
  return roster.map((entry) => {
    const row = rows.find((candidate) => candidate.selectionId === entry.selectionId);
    if (row === undefined) throw new Error(`S1 registry lacks ${entry.selectionId}`);
    return {
      selectionId: row.selectionId,
      adapterKind: row.adapterKind,
      bindingKind: row.bindingKind,
      scalarMassHistoryDevelopmentStatus: row.requestedUses.find(
        (use) => use.purpose === "scalar-mass-history-development",
      )?.status,
      unqualifiedFreeParticleTransferStatus: row.requestedUses.find(
        (use) => use.purpose === "unqualified-free-particle-transfer",
      )?.status,
    } as Phase9DbtAdapterMappingPin;
  });
}

function shelfPin(protocol: DbtProtocol, shelfBytes: Uint8Array): Phase9DbtLaunchManifest["sourceOverlayShelf"] {
  const parsed = parseJson<{ readonly schema: string; readonly shelf: readonly Record<string, unknown>[] }>(
    shelfBytes,
    "S0B shelf freeze",
  );
  const row = parsed.shelf.find((candidate) => candidate.item === "D-BT");
  if (row === undefined) throw new Error("S0B shelf freeze lacks D-BT");
  if (parsed.schema !== protocol.upstreamBindings.sourceOverlay.shelfFreezeSchema) {
    throw new Error("S0B shelf-freeze schema differs from the D-BT protocol");
  }
  return { schema: parsed.schema, row } as unknown as
    Phase9DbtLaunchManifest["sourceOverlayShelf"];
}

interface LaunchBytes {
  readonly protocol: Uint8Array;
  readonly implementation: Uint8Array;
  readonly test: Uint8Array;
  readonly preflightImplementation: Uint8Array;
  readonly preflightTest: Uint8Array;
  readonly sourceOverlayShelfFreeze: Uint8Array;
  readonly adapterRegistry: Uint8Array;
}

function launchManifest(protocol: DbtProtocol, bytes: LaunchBytes): Phase9DbtLaunchManifest {
  return {
    schema: "phase9-dbt-launch-manifest-v1",
    identities: {
      protocol: identity(PROTOCOL_PATH, bytes.protocol),
      implementation: identity(MODEL_PATH, bytes.implementation),
      test: identity(MODEL_TEST_PATH, bytes.test),
      preflightImplementation: identity(PREFLIGHT_PATH, bytes.preflightImplementation),
      preflightTest: identity(PREFLIGHT_TEST_PATH, bytes.preflightTest),
      sourceOverlayShelfFreeze: identity(
        protocol.upstreamBindings.sourceOverlay.shelfFreezePath,
        bytes.sourceOverlayShelfFreeze,
      ),
      adapterRegistry: identity(ADAPTER_REGISTRY_PATH, bytes.adapterRegistry),
    },
    sourceOverlayShelf: shelfPin(protocol, bytes.sourceOverlayShelfFreeze),
    adapterMappings: adapterMappings(bytes.adapterRegistry, protocol.primaryRoster),
    primaryRoster: protocol.primaryRoster,
    operatorPins: protocol.launchPreflight.requiredOperatorPins,
  };
}

function readLaunchBytes(repositoryRoot: string, protocol: DbtProtocol): LaunchBytes {
  return {
    protocol: readRegular(repositoryRoot, PROTOCOL_PATH),
    implementation: readRegular(repositoryRoot, MODEL_PATH),
    test: readRegular(repositoryRoot, MODEL_TEST_PATH),
    preflightImplementation: readRegular(repositoryRoot, PREFLIGHT_PATH),
    preflightTest: readRegular(repositoryRoot, PREFLIGHT_TEST_PATH),
    sourceOverlayShelfFreeze: readRegular(
      repositoryRoot,
      protocol.upstreamBindings.sourceOverlay.shelfFreezePath,
    ),
    adapterRegistry: readRegular(repositoryRoot, ADAPTER_REGISTRY_PATH),
  };
}

function readNasBytes(relativePath: string, nasRoot: string): Uint8Array {
  const resolution = resolvePhase9NasFile(relativePath, nasRoot);
  if (resolution.kind !== "ok") {
    throw new Error(`D-BT NAS input ${relativePath} refused: ${resolution.reason}`);
  }
  const bytes = new Uint8Array(readFileSync(resolution.path));
  if (bytes.byteLength !== resolution.byteLength) {
    throw new Error(`D-BT NAS input changed while being read: ${relativePath}`);
  }
  return bytes;
}

function lexicalNumber(observation: Phase9AdaptedObservation, key: string): number {
  const value = strictObject(observation.values[key], `adapted ${key}`);
  if (typeof value.value !== "number" || !Number.isFinite(value.value)) {
    throw new Error(`adapted ${key} value is not finite`);
  }
  return value.value;
}

function conditionFromPin(pin: Phase9DbtRosterPin): Phase9DbtCondition {
  return {
    tempK: pin.conditions.tempC + 273.15,
    pressurePa: pin.conditions.pressurePa,
    excessIceSupersaturationFraction: pin.conditions.sigmaIcePercent / 100,
    initialRadiusUm: pin.conditions.initialRadiusUm,
  };
}

function requireAdaptedHistory(
  result: Phase9AdapterResult,
  pin: Phase9DbtRosterPin,
  rowBytes: Uint8Array,
): Phase9DbtBoundHistory {
  if (
    result.selectionId !== pin.selectionId ||
    result.metadataRecordId !== pin.metadataRecordId ||
    result.sourceUnitId !== pin.sourceUnitId ||
    result.adapterKind !== "free-particle-mass" ||
    result.bindingKind !== "native-history" ||
    result.status !== "eligible-with-limitation" ||
    result.requestedUse?.purpose !== "scalar-mass-history-development"
  ) {
    throw new Error(`${pin.runId} did not pass the exact S1 scalar-mass adapter`);
  }
  if (
    rowBytes.byteLength !== pin.rowArtifact.byteLength ||
    sha256Bytes(rowBytes) !== pin.rowArtifact.sha256 ||
    result.observations.length !== pin.rowArtifact.rowCount
  ) {
    throw new Error(`${pin.runId} source rows differ from their frozen identity`);
  }
  const sourceRows = result.observations.map((observation) => ({
    timeS: lexicalNumber(observation, "timeSeconds"),
    massRatio: lexicalNumber(observation, "massRatio"),
  }));
  const lastTime = sourceRows.at(-1)?.timeS;
  if (lastTime !== pin.rowArtifact.lastTimeS) {
    throw new Error(`${pin.runId} last source time differs from its frozen pin`);
  }
  return {
    pin,
    condition: conditionFromPin(pin),
    sourceRows,
    sourceBytes: rowBytes,
    adapterStatus: result.status,
    adapterReasons: result.reasons,
  };
}

function assertSourcePin(pin: SourceBytePin, bytes: Uint8Array, label: string): void {
  if (bytes.byteLength !== pin.byteLength || sha256Bytes(bytes) !== pin.sha256) {
    throw new Error(`${label} differs from its protocol identity`);
  }
}

/** Enumerate the complete ZIP and bind the exact uncompressed members named by the protocol. */
export function bindPhase9DbtIceNodeArchiveMembers(
  pin: Phase9DbtIceNodeArchivePin,
  bytes: Uint8Array,
): readonly Phase9DbtArtifactIdentity[] {
  assertSourcePin(pin, bytes, "IceNODE archive");
  if (!/^[0-9a-f]{40}$/.test(pin.archiveCommit)) {
    throw new Error("IceNODE archive commit is malformed");
  }
  if (pin.loadBearingMembers.length !== 6) {
    throw new Error("IceNODE load-bearing member roster must contain exactly six entries");
  }
  const relativePaths = pin.loadBearingMembers.map((member) => member.path);
  if (
    new Set(relativePaths).size !== relativePaths.length ||
    relativePaths.some((path) =>
      path.startsWith("/") || path.includes("\\") ||
      path.split("/").some((part) => part === "" || part === "." || part === "..")
    )
  ) {
    throw new Error("IceNODE load-bearing member roster contains an unsafe or duplicate path");
  }
  const root = `IceNODE-${pin.archiveCommit}/`;
  const inventory = phase8bReadZipInventory(bytes);
  const byPath = new Map(inventory.regularMembers.map((member) => [member.path, member]));
  if (byPath.size !== inventory.regularMembers.length) {
    throw new Error("IceNODE ZIP enumeration contains duplicate regular members");
  }
  if (!inventory.regularMembers.some((member) => member.path.startsWith(root))) {
    throw new Error("IceNODE ZIP commit root differs from its protocol pin");
  }
  if (inventory.regularMembers.some((member) => !member.path.startsWith(root))) {
    throw new Error("IceNODE ZIP contains a regular member outside its exact commit root");
  }
  return pin.loadBearingMembers.map((expected) => {
    if (!/^[0-9a-f]{64}$/.test(expected.sha256)) {
      throw new Error(`IceNODE member ${expected.path} has a malformed SHA-256 pin`);
    }
    const fullPath = `${root}${expected.path}`;
    const member = byPath.get(fullPath);
    if (member === undefined) throw new Error(`IceNODE load-bearing member is absent: ${expected.path}`);
    if (member.sha256 !== expected.sha256) {
      throw new Error(`IceNODE load-bearing member hash differs: ${expected.path}`);
    }
    return {
      path: `zip-member:${pin.logicalPath}#${fullPath}`,
      byteLength: member.byteLength,
      sha256: member.sha256,
    };
  });
}

const registeredMaterialFingerprints = new WeakMap<object, string>();
const registeredBundleFingerprints = new WeakMap<object, string>();

function materialFingerprint(material: Phase9DbtRunMaterial): string {
  return sha256Bytes(canonicalJsonBytes(strictJsonSnapshot({
    scope: material.scope,
    protocolId: material.protocolId,
    launchManifest: material.launchManifest,
    launchAuthorization: material.launchAuthorization,
    sourceIdentities: material.sourceIdentities,
    histories: material.histories.map((history) => ({
      pin: history.pin,
      condition: history.condition,
      sourceRows: history.sourceRows,
      sourceIdentity: identity(phase9RowArtifactKey(history.pin.rowArtifact), history.sourceBytes),
      adapterStatus: history.adapterStatus,
      adapterReasons: history.adapterReasons,
    })),
    registeredControlIds: material.registeredControlIds,
    claimBoundary: material.claimBoundary,
  })));
}

function bundleFingerprint(bundle: Phase9DbtPublicationBundle): string {
  return sha256Bytes(canonicalJsonBytes(strictJsonSnapshot({
    scope: bundle.scope,
    centralDecision: bundle.centralDecision,
    artifacts: [...bundle.artifacts.entries()].sort(([left], [right]) => left.localeCompare(right))
      .map(([path, bytes]) => identity(path, bytes)),
  })));
}

/**
 * Capture the real registered inputs. Merely importing this module never reads the NAS or scores a
 * history; the explicit CLI command is the only production entry point.
 */
export function captureRegisteredPhase9DbtRunMaterial(options: {
  readonly repositoryRoot: string;
  readonly nasRoot?: string;
  readonly launchManifestPath: string;
}): Phase9DbtRunMaterial {
  const repositoryRoot = resolve(options.repositoryRoot);
  const firstProtocolBytes = readRegular(repositoryRoot, PROTOCOL_PATH);
  if (canonicalJson(identity(PROTOCOL_PATH, firstProtocolBytes)) !== canonicalJson(FROZEN_PROTOCOL_IDENTITY)) {
    throw new Error("D-BT frozen protocol bytes differ");
  }
  const protocol = parseJson<DbtProtocol>(firstProtocolBytes, "D-BT protocol");
  if (protocol.schema !== "phase9-dbt-protocol-v1" || protocol.primaryRoster.length !== 6) {
    throw new Error("D-BT protocol schema or roster differs");
  }
  validatePhase9DbtFrozenPreOutputState(protocol);
  if (canonicalJson(protocol.preRunControls.map((entry) => entry.id)) !== canonicalJson(PHASE9_DBT_REGISTERED_CONTROL_IDS)) {
    throw new Error("D-BT registered control roster differs");
  }

  // Authorization is deliberately checked before any registered NAS observation byte is opened.
  // The launch file therefore guards the act of scoring, not merely publication afterward.
  const registrationBytes = readLaunchBytes(repositoryRoot, protocol);
  if (sha256Bytes(registrationBytes.protocol) !== sha256Bytes(firstProtocolBytes)) {
    throw new Error("D-BT protocol changed during launch capture");
  }
  const registration = launchManifest(protocol, registrationBytes);
  const observedBytes = readLaunchBytes(repositoryRoot, protocol);
  const observed = launchManifest(protocol, observedBytes);
  phase9DbtRunLaunchPreflight(protocol, registration, observed);

  const launchManifestBytes = readRegular(repositoryRoot, options.launchManifestPath);
  const authorizationBytes = new Map<string, Uint8Array>([
    [PROTOCOL_PATH, registrationBytes.protocol],
    [MODEL_PATH, registrationBytes.implementation],
    [MODEL_TEST_PATH, registrationBytes.test],
    [PREFLIGHT_PATH, registrationBytes.preflightImplementation],
    [PREFLIGHT_TEST_PATH, registrationBytes.preflightTest],
    [PRODUCER_PATH, readRegular(repositoryRoot, PRODUCER_PATH)],
    [VERIFIER_PATH, readRegular(repositoryRoot, VERIFIER_PATH)],
    [PUBLICATION_TEST_PATH, readRegular(repositoryRoot, PUBLICATION_TEST_PATH)],
    [protocol.upstreamBindings.sourceOverlay.shelfFreezePath, registrationBytes.sourceOverlayShelfFreeze],
    [ADAPTER_REGISTRY_PATH, registrationBytes.adapterRegistry],
  ]);
  const launchAuthorization = validatePhase9DbtLaunchAuthorization(launchManifestBytes, {
    path: options.launchManifestPath,
    protocolId: protocol.protocolId,
    identities: authorizationIdentityEntries(
      authorizationBytes,
      protocol.upstreamBindings.sourceOverlay.shelfFreezePath,
    ),
  });

  const nasRoot = options.nasRoot ?? detectPhase9NasRoot();
  if (nasRoot === null) throw new Error("the snowcrystal NAS share is not mounted");

  // Source formula bytes and every hash-pinned IceNODE member are checked before any registered
  // observation TSV is opened. The static preflight and separate authorization therefore guard
  // the first observation read, not merely the later write.
  const lambPaperBytes = readNasBytes(protocol.sourceBytes.lambPaper.logicalPath, nasRoot);
  const iceNodeBytes = readNasBytes(protocol.sourceBytes.iceNodeArchive.logicalPath, nasRoot);
  const nelsonBytes = readNasBytes(protocol.sourceBytes.nelsonBakerPrimary.logicalPath, nasRoot);
  assertSourcePin(protocol.sourceBytes.lambPaper, lambPaperBytes, "Lamb paper");
  const iceNodeMemberIdentities = bindPhase9DbtIceNodeArchiveMembers(
    protocol.sourceBytes.iceNodeArchive,
    iceNodeBytes,
  );
  if (sha256Bytes(nelsonBytes) !== protocol.sourceBytes.nelsonBakerPrimary.sha256) {
    throw new Error("Nelson-Baker primary bytes differ from the protocol");
  }

  const successorBookBytes = readRegular(repositoryRoot, SUCCESSOR_BOOK_PATH);
  const nativeRecordsBytes = readRegular(repositoryRoot, NATIVE_RECORDS_PATH);
  const rowArtifacts = new Map<string, Uint8Array>();
  for (const pin of protocol.primaryRoster) {
    const key = phase9RowArtifactKey(pin.rowArtifact);
    const bytes = readNasBytes(key, nasRoot);
    if (bytes.byteLength !== pin.rowArtifact.byteLength || sha256Bytes(bytes) !== pin.rowArtifact.sha256) {
      throw new Error(`${pin.runId} NAS bytes differ from the protocol`);
    }
    rowArtifacts.set(key, bytes);
  }
  const metadataArtifacts = new Map([[NATIVE_RECORDS_PATH, nativeRecordsBytes]]);
  const requestedPurposes = new Map(
    protocol.primaryRoster.map((pin) => [pin.selectionId, "scalar-mass-history-development"]),
  );
  const adapted = adaptPhase9MeasurementCorpus({
    registryBytes: registrationBytes.adapterRegistry,
    successorTargetBookBytes: successorBookBytes,
    metadataArtifacts,
    rowArtifacts,
    requestedPurposes,
  });
  const bySelectionId = new Map(adapted.map((result) => [result.selectionId, result]));
  const histories = protocol.primaryRoster.map((pin) => {
    const result = bySelectionId.get(pin.selectionId);
    if (result === undefined) throw new Error(`S1 output lacks ${pin.selectionId}`);
    return requireAdaptedHistory(
      result,
      pin,
      rowArtifacts.get(phase9RowArtifactKey(pin.rowArtifact)) as Uint8Array,
    );
  });

  const sourceIdentities = [
    identity(PROTOCOL_PATH, registrationBytes.protocol),
    identity(MODEL_PATH, registrationBytes.implementation),
    identity(MODEL_TEST_PATH, registrationBytes.test),
    identity(PREFLIGHT_PATH, registrationBytes.preflightImplementation),
    identity(PREFLIGHT_TEST_PATH, registrationBytes.preflightTest),
    identity(protocol.upstreamBindings.sourceOverlay.shelfFreezePath, registrationBytes.sourceOverlayShelfFreeze),
    identity(ADAPTER_REGISTRY_PATH, registrationBytes.adapterRegistry),
    identity(SUCCESSOR_BOOK_PATH, successorBookBytes),
    identity(NATIVE_RECORDS_PATH, nativeRecordsBytes),
    identity(protocol.sourceBytes.lambPaper.logicalPath, lambPaperBytes),
    identity(protocol.sourceBytes.iceNodeArchive.logicalPath, iceNodeBytes),
    ...iceNodeMemberIdentities,
    identity(protocol.sourceBytes.nelsonBakerPrimary.logicalPath, nelsonBytes),
    launchAuthorization.identity,
    ...histories.map((history) => identity(
      phase9RowArtifactKey(history.pin.rowArtifact),
      history.sourceBytes,
    )),
  ];
  if (new Set(sourceIdentities.map((entry) => entry.path)).size !== sourceIdentities.length) {
    throw new Error("D-BT source identity graph contains duplicate paths");
  }
  const material: Phase9DbtRunMaterial = {
    scope: "registered-source-score",
    protocolId: protocol.protocolId,
    launchManifest: registration as unknown as StrictJson,
    launchAuthorization,
    sourceIdentities,
    histories,
    registeredControlIds: protocol.preRunControls.map((entry) => entry.id),
    claimBoundary: {
      developmentEvidenceOnly: true,
      grantsValidationClaim: false,
      unqualifiedFreeParticleTransfer: false,
      facetHabitOrMorphologyPrediction: false,
      lineageStatus: protocol.lineage.status,
      apparatusLimit: protocol.claimBoundary.apparatusLimit,
    },
  };
  registeredMaterialFingerprints.set(material, materialFingerprint(material));
  return material;
}

function jsonl(rows: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

// Two independent IEEE-754 implementations may legitimately differ by a few ulps because their
// algebraic evaluation order is not shared. Publication retains seven significant decimal digits,
// far tighter than the source uncertainty, so byte equality does not require copying code order.
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

function adjacentDecreaseCount(rows: readonly Phase9DbtSourceRow[]): number {
  let count = 0;
  for (let index = 1; index < rows.length; index++) {
    if (rows[index].massRatio < rows[index - 1].massRatio) count++;
  }
  return count;
}

function deriveScoreRecords(histories: readonly Phase9DbtHistory[], material: Phase9DbtRunMaterial): {
  readonly records: readonly ScoreRecord[];
  readonly reportFacts: StrictJson;
} {
  if (histories.length !== 6 || material.histories.length !== 6) {
    throw new Error("D-BT publication requires exactly six histories");
  }
  const folds = phase9DbtFitPrimaryLeaveOneHistoryOut(histories);
  const comparisons: Phase9DbtSensitivityComparison[] = [];
  const records = histories.map((history, index): ScoreRecord => {
    const bound = material.histories[index];
    if (history.id !== bound.pin.runId) throw new Error("prepared and frozen history orders differ");
    const fold = folds[index];
    if (fold.heldOutHistoryId !== history.id) throw new Error("leave-one-history-out fold order differs");
    const continuum = phase9DbtIntegrateMassRatios(history.condition, { kind: "continuum" }, history.timesS);
    const hybrid = phase9DbtIntegrateMassRatios(
      history.condition,
      { kind: "project-ambient-excess-hybrid" },
      history.timesS,
    );
    const lamb = phase9DbtIntegrateMassRatios(history.condition, { kind: "lamb" }, history.timesS);
    const rescale = phase9DbtIntegrateMassRatios(
      history.condition,
      { kind: "continuum-rescale", multiplier: fold.multiplier },
      history.timesS,
    );
    const central = {
      continuum: phase9DbtSummarizeResiduals(history.observedMassRatios, continuum),
      projectAmbientExcessHybrid: phase9DbtSummarizeResiduals(history.observedMassRatios, hybrid),
      lamb: phase9DbtSummarizeResiduals(history.observedMassRatios, lamb),
      leaveOneHistoryOutContinuumRescale: phase9DbtSummarizeResiduals(
        history.observedMassRatios,
        rescale,
      ),
    };
    const range = bound.pin.conditions.initialRadiusRangeUm;
    const radiusPair = (direction: "lower" | "upper"): NamedPair => {
      const initialRadiusUm = history.condition.initialRadiusUm + (direction === "lower" ? -range : range);
      if (!(initialRadiusUm > 0)) throw new Error(`${history.id} lower radius is not positive`);
      const condition = { ...history.condition, initialRadiusUm };
      const lambSensitivity = phase9DbtSummarizeResiduals(
        history.observedMassRatios,
        phase9DbtIntegrateMassRatios(condition, { kind: "lamb" }, history.timesS),
      );
      const rescaleSensitivity = phase9DbtSummarizeResiduals(
        history.observedMassRatios,
        phase9DbtIntegrateMassRatios(
          condition,
          { kind: "continuum-rescale", multiplier: fold.multiplier },
          history.timesS,
        ),
      );
      comparisons.push({
        name: `initial-radius-${direction}-heldout-only`,
        historyId: history.id,
        lambMse: lambSensitivity.mse,
        leaveOneHistoryOutRescaleMse: rescaleSensitivity.mse,
      });
      return {
        initialRadiusUm,
        lambMse: lambSensitivity.mse,
        leaveOneHistoryOutContinuumRescaleMse: rescaleSensitivity.mse,
      };
    };
    const lower = radiusPair("lower");
    const upper = radiusPair("upper");
    const lambFivePercent = phase9DbtFivePercentSensitivity(history.observedMassRatios, lamb);
    const rescaleFivePercent = phase9DbtFivePercentSensitivity(history.observedMassRatios, rescale);
    comparisons.push(
      {
        name: "mass-ratio-minus-five-percent-heldout-only",
        historyId: history.id,
        lambMse: lambFivePercent.coherentLowerObservationMse,
        leaveOneHistoryOutRescaleMse: rescaleFivePercent.coherentLowerObservationMse,
      },
      {
        name: "mass-ratio-plus-five-percent-heldout-only",
        historyId: history.id,
        lambMse: lambFivePercent.coherentUpperObservationMse,
        leaveOneHistoryOutRescaleMse: rescaleFivePercent.coherentUpperObservationMse,
      },
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
        lamb: lambFivePercent,
        leaveOneHistoryOutContinuumRescale: rescaleFivePercent,
      },
    };
  });

  // phase9DbtDecisionEnvelope expects sensitivity groups in name-major, roster-minor order.
  const names: readonly Phase9DbtSensitivityComparison["name"][] = [
    "initial-radius-lower-heldout-only",
    "initial-radius-upper-heldout-only",
    "mass-ratio-minus-five-percent-heldout-only",
    "mass-ratio-plus-five-percent-heldout-only",
  ];
  const orderedComparisons = names.flatMap((name) => histories.map((history) => {
    const match = comparisons.find((entry) => entry.name === name && entry.historyId === history.id);
    if (match === undefined) throw new Error(`missing D-BT sensitivity ${name}/${history.id}`);
    return match;
  }));
  const envelope = phase9DbtDecisionEnvelope(
    {
      historyIds: histories.map((history) => history.id),
      lambMse: records.map((record) => record.central.lamb.mse),
      leaveOneHistoryOutRescaleMse: records.map(
        (record) => record.central.leaveOneHistoryOutContinuumRescale.mse,
      ),
    },
    orderedComparisons,
  );
  const comparatorFamilyMse = {
    continuum: phase9DbtEqualHistoryMse(records.map((record) => record.central.continuum)),
    projectAmbientExcessHybrid: phase9DbtEqualHistoryMse(
      records.map((record) => record.central.projectAmbientExcessHybrid),
    ),
    lamb: phase9DbtEqualHistoryMse(records.map((record) => record.central.lamb)),
    leaveOneHistoryOutContinuumRescale: phase9DbtEqualHistoryMse(
      records.map((record) => record.central.leaveOneHistoryOutContinuumRescale),
    ),
  };
  return {
    records,
    reportFacts: strictJsonSnapshot({
      comparatorFamilyMse,
      decisionEnvelope: envelope,
      refusals: {
        temperatureOneFactor: "not-implemented-promotion-unavailable",
        supersaturationOneFactor: "not-implemented-promotion-unavailable",
        unqualifiedFreeParticleTransfer: "ineligible-electric-field-and-apparatus-confound",
        facetHabitMorphology: "ineligible-unobserved",
        t500: "refused-strict-source-domain-t-less-than-500-seconds",
        hotOrLaterRows: "extrapolation-only-not-scored",
        validationCredit: "forbidden-development-evidence-only",
      },
    }),
  };
}

/** Derive canonical candidate bytes from already bound material. */
export function derivePhase9DbtPublication(material: Phase9DbtRunMaterial): Phase9DbtPublicationBundle {
  if (material.scope === "registered-source-score") {
    const capturedFingerprint = registeredMaterialFingerprints.get(material);
    if (capturedFingerprint === undefined || capturedFingerprint !== materialFingerprint(material)) {
      throw new Error("registered D-BT material was not captured intact by this producer instance");
    }
  }
  if (
    material.histories.length !== 6 ||
    new Set(material.histories.map((history) => history.pin.runId)).size !== 6 ||
    canonicalJson(material.registeredControlIds) !== canonicalJson(PHASE9_DBT_REGISTERED_CONTROL_IDS)
  ) {
    throw new Error("D-BT material roster or registered controls differ");
  }
  const sourceDiagnostics = material.histories.map((bound) => {
    if (
      bound.sourceBytes.byteLength !== bound.pin.rowArtifact.byteLength ||
      sha256Bytes(bound.sourceBytes) !== bound.pin.rowArtifact.sha256
    ) {
      throw new Error(`${bound.pin.runId} source bytes differ before derivation`);
    }
    const prepared = phase9DbtPrepareObservations(bound.sourceRows);
    if (
      prepared.timesS[0] !== bound.pin.scoreGrid.firstSecond ||
      prepared.timesS.at(-1) !== bound.pin.scoreGrid.lastSecond ||
      prepared.timesS.length !== bound.pin.scoreGrid.sampleCount
    ) {
      throw new Error(`${bound.pin.runId} prepared grid differs from the protocol`);
    }
    return {
      schema: "phase9-dbt-source-diagnostic-v1",
      selectionId: bound.pin.selectionId,
      runId: bound.pin.runId,
      sourceIdentity: identity(phase9RowArtifactKey(bound.pin.rowArtifact), bound.sourceBytes),
      sourceRowCount: bound.sourceRows.length,
      adjacentMassDecreaseCount: adjacentDecreaseCount(bound.sourceRows),
      exactDuplicateExtraRowCount: prepared.duplicateRowCount,
      timeZeroAnchorInserted: prepared.timeZeroAnchorInserted,
      preparedSampleCount: prepared.timesS.length,
      preparedGrid: {
        firstSecond: prepared.timesS[0],
        lastSecond: prepared.timesS.at(-1),
      },
      preparedObservationSha256: sha256Bytes(canonicalJsonBytes({
        timesS: prepared.timesS,
        massRatios: prepared.massRatios,
      })),
      adapter: { status: bound.adapterStatus, reasons: bound.adapterReasons },
    };
  });
  const histories: Phase9DbtHistory[] = material.histories.map((bound, index) => {
    const diagnostic = sourceDiagnostics[index];
    const prepared = phase9DbtPrepareObservations(bound.sourceRows);
    if (diagnostic.preparedObservationSha256 !== sha256Bytes(canonicalJsonBytes({
      timesS: prepared.timesS,
      massRatios: prepared.massRatios,
    }))) {
      throw new Error(`${bound.pin.runId} prepared observation identity changed`);
    }
    return {
      id: bound.pin.runId,
      condition: bound.condition,
      timesS: prepared.timesS,
      observedMassRatios: prepared.massRatios,
    };
  });
  const scored = deriveScoreRecords(histories, material);
  const publishedScoreRecords = publishedNumericSnapshot(scored.records) as readonly StrictJson[];
  const publishedReportFacts = publishedNumericSnapshot(scored.reportFacts);
  const launch = {
    schema: "phase9-dbt-publication-launch-v1",
    scope: material.scope,
    protocolId: material.protocolId,
    launchManifest: material.launchManifest,
    launchAuthorization: material.launchAuthorization,
    sourceIdentities: material.sourceIdentities,
    registeredControlIds: material.registeredControlIds,
    preflightMutationRoster: PHASE9_DBT_PREFLIGHT_MUTATIONS,
  };
  const launchBytes = canonicalJsonBytes(launch);
  const sourceBytes = jsonl(sourceDiagnostics);
  const scoreBytes = jsonl(publishedScoreRecords);
  const report = {
    schema: "phase9-dbt-report-v1",
    state: "candidate-awaiting-independent-byte-verification",
    scope: material.scope,
    protocolId: material.protocolId,
    historyCount: 6,
    claimBoundary: material.claimBoundary,
    registeredControlIds: material.registeredControlIds,
    numericRepresentation: {
      significantDecimalDigits: 7,
      reason: "independent IEEE-754 evaluation orders can differ by a few ulps",
    },
    result: publishedReportFacts,
    artifacts: {
      launchManifest: artifact("launch-manifest.json", launchBytes, "canonical-json"),
      scores: artifact("scores.jsonl", scoreBytes, "canonical-jsonl"),
      sourceDiagnostics: artifact("source-diagnostics.jsonl", sourceBytes, "canonical-jsonl"),
    },
    independentVerification: {
      producerSuppliesPass: false,
      status: "required-before-acceptance",
    },
  };
  const reportBytes = canonicalJsonBytes(report);
  const index = {
    schema: "phase9-dbt-artifact-index-v1",
    publication: "candidate",
    artifacts: [
      artifact("launch-manifest.json", launchBytes, "canonical-json"),
      artifact("report.json", reportBytes, "canonical-json"),
      artifact("scores.jsonl", scoreBytes, "canonical-jsonl"),
      artifact("source-diagnostics.jsonl", sourceBytes, "canonical-jsonl"),
    ],
  };
  const artifacts = new Map<string, Uint8Array>([
    ["artifact-index.json", canonicalJsonBytes(index)],
    ["launch-manifest.json", launchBytes],
    ["report.json", reportBytes],
    ["scores.jsonl", scoreBytes],
    ["source-diagnostics.jsonl", sourceBytes],
  ]);
  exactSet(artifacts.keys(), PHASE9_DBT_PUBLICATION_FILES, "D-BT publication file set");
  const reportFacts = scored.reportFacts as {
    readonly decisionEnvelope: { readonly central: { readonly survives: boolean }; readonly label: string };
  };
  const bundle: Phase9DbtPublicationBundle = {
    scope: material.scope,
    artifacts,
    centralDecision: {
      survives: reportFacts.decisionEnvelope.central.survives,
      label: reportFacts.decisionEnvelope.label,
    },
  };
  if (bundle.scope === "registered-source-score") {
    registeredBundleFingerprints.set(bundle, bundleFingerprint(bundle));
  }
  return bundle;
}

/** Atomically write a production candidate. Fixture bundles are never writable evidence. */
export function writePhase9DbtPublicationDirectory(
  directory: string,
  bundle: Phase9DbtPublicationBundle,
): void {
  if (bundle.scope !== "registered-source-score") {
    throw new Error("refusing to publish a synthetic D-BT fixture as evidence");
  }
  const derivedFingerprint = registeredBundleFingerprints.get(bundle);
  if (derivedFingerprint === undefined || derivedFingerprint !== bundleFingerprint(bundle)) {
    throw new Error("refusing an unsealed or changed registered D-BT publication bundle");
  }
  exactSet(bundle.artifacts.keys(), PHASE9_DBT_PUBLICATION_FILES, "D-BT publication file set");
  const target = resolve(directory);
  if (existsSync(target)) throw new Error(`refusing to overwrite D-BT publication: ${target}`);
  const parent = dirname(target);
  mkdirSync(parent, { recursive: true });
  const staging = join(parent, `.${basename(target)}.staging-${randomUUID()}`);
  mkdirSync(staging);
  try {
    for (const name of PHASE9_DBT_PUBLICATION_FILES) {
      writeFileSync(join(staging, name), bundle.artifacts.get(name) as Uint8Array, { flag: "wx" });
    }
    exactSet(readdirSync(staging), PHASE9_DBT_PUBLICATION_FILES, "staged D-BT publication");
    renameSync(staging, target);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

function usage(): never {
  throw new Error(
    "usage: node runner/src/phase9-dbt-publication.ts produce " +
    "--repository-root ROOT --launch-manifest REPOSITORY_RELATIVE_PATH " +
    "--bundle DIRECTORY [--nas-root SHARE_ROOT]",
  );
}

function argument(argv: readonly string[], name: string, required: boolean): string | undefined {
  const index = argv.indexOf(name);
  if (index === -1) {
    if (required) usage();
    return undefined;
  }
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) usage();
  return value;
}

function main(argv: readonly string[]): void {
  if (argv[0] !== "produce") usage();
  const known = new Set([
    "produce", "--repository-root", "--launch-manifest", "--bundle", "--nas-root",
  ]);
  for (let index = 0; index < argv.length; index++) {
    if (argv[index].startsWith("--") && !known.has(argv[index])) usage();
    if (argv[index].startsWith("--")) index++;
  }
  const repositoryRoot = argument(argv, "--repository-root", true) as string;
  const launchManifestPath = argument(argv, "--launch-manifest", true) as string;
  const bundleDirectory = argument(argv, "--bundle", true) as string;
  const nasRoot = argument(argv, "--nas-root", false);
  const material = captureRegisteredPhase9DbtRunMaterial({
    repositoryRoot,
    nasRoot,
    launchManifestPath,
  });
  const bundle = derivePhase9DbtPublication(material);
  writePhase9DbtPublicationDirectory(bundleDirectory, bundle);
  process.stdout.write(`${canonicalJson({
    state: "candidate-awaiting-independent-byte-verification",
    directory: resolve(bundleDirectory),
    historyCount: 6,
  })}\n`);
}

const invokedPath = process.argv[1] === undefined ? null : pathToFileURL(resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) main(process.argv.slice(2));
