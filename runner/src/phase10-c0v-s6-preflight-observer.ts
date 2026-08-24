import { statfsSync, lstatSync, readdirSync, realpathSync } from "node:fs";
import { basename, isAbsolute, relative, resolve, sep } from "node:path";
import { cwd, version as runtimeVersion } from "node:process";
import {
  PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT,
  PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_ROOT,
  PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_CARRY_FORWARD_ELAPSED_NANOSECONDS,
  parsePhase10C0VS6CallableRegistry,
  parsePhase10C0VS6Matrix,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  parsePhase10C0VS6RetainedPreflight,
  resolvePhase10C0VS6DependencyArtifactContracts,
  type Phase10C0VS6DependencyDispositionSelection,
  type Phase10C0VS6ObligationMatrix,
  type Phase10C0VS6PacketCatalogue,
  type Phase10C0VS6PacketId,
  type Phase10C0VS6PacketProtocol,
  type Phase10C0VS6PreflightClassificationEvidence,
  type Phase10C0VS6PreflightRefusalCandidate,
  type Phase10C0VS6RetainedPreflight,
} from "./phase10-c0v-s6-contracts.ts";
import {
  PHASE10_C0V_S6_RUNTIME,
  parsePhase10C0VS6ArtifactIdentity,
  parsePhase10C0VS6AttemptLedgerV2,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6ExactOrderedKeys,
  phase10C0VS6Object,
  phase10C0VS6ParsePrettyJson,
  phase10C0VS6PrettyJsonBytes,
  phase10C0VS6SafeRelativePath,
  phase10C0VS6SameIdentity,
  phase10C0VS6SameJson,
  phase10C0VS6ValidateRegisteredExecutableInvocationRoster,
  phase10C0VS6ValidateRegisteredExecutionRecordTuple,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6DispositionCode,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6HeadBoundManifestEntries,
} from "./phase10-c0v-s6-dependencies.ts";
import {
  phase10C0VS6AssertExactPhysicalRootCensus,
  phase10C0VS6AssertActiveLockedPacketWatchdog,
  phase10C0VS6AssertPackageAndPacketLockBytes,
  phase10C0VS6CensusUniquePhysicalDirectory,
  phase10C0VS6PhysicalRepositoryRoot,
  phase10C0VS6PublishCrashSafeExclusive,
  phase10C0VS6ReadUniquePhysicalFile,
  type Phase10C0VS6CrashSafePublicationResult,
  type Phase10C0VS6LockedPacketAuthority,
  type Phase10C0VS6PackageAndPacketLockContext,
  type Phase10C0VS6PhysicalRoot,
} from "./phase10-c0v-s6-filesystem.ts";
import type { Phase10C0VS6ParentWatchdogContext } from "./phase10-c0v-s6-watchdog.ts";
import {
  derivePhase10C0VS6ImplementationFreeze,
  type Phase10C0VS6ImplementationFreezeDerivation,
} from "./phase10-c0v-s6-freeze.ts";
import {
  independentlyEvaluatePhase10C0VS6PacketWorkerInvocations,
  independentlyEvaluatePhase10C0VS6WorkerInvocations,
} from "./phase10-c0v-s6-worker-invocation.ts";
import {
  writePhase10C0VS6PreflightReceipt,
} from "./phase10-c0v-s6-receipts.ts";
import {
  independentlyVerifyPhase10C0VS6ObservedPublishedDependencyPrefix,
} from "./phase10-c0v-s6-published-prefix.ts";
import {
  derivePhase10C0VS6HistoricalRetainedRuntimeAuthority,
} from "./phase10-c0v-s6-runtime-authority.ts";

const EVIDENCE_MANIFEST_PATH = "evidence/MANIFEST.json" as const;
const PACKAGE_ELAPSED_NANOSECONDS_MAXIMUM = 86_400_000_000_000;
const PACKAGE_RETAINED_BYTES_MAXIMUM = 68_719_476_736;
const PACKAGE_PUBLICATION_ROOTS = Object.freeze([
  "evidence/phase10-numerical-verification-v1",
  "evidence/phase10-obligation-preflight-v2",
  "evidence/phase10-obligation-preflight-v3",
  "evidence/phase10-obligation-preflight-v4",
  "evidence/phase10-obligation-preflight-v5",
  "evidence/phase10-obligation-preflight-v6",
] as const);
const PACKAGE_BASELINE_ATTEMPT_ROOT = "out/phase10-c0v-reference-v1" as const;
const PACKAGE_ATTEMPT_ROOTS = Object.freeze([
  PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT,
  PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_ROOT,
] as const);

const TERMINAL_FIELDS = Object.freeze([
  "schema", "receiptId", "matrixId", "protocolId", "registryId", "packetId", "attemptId",
  "terminalState", "dispositionCode", "preflight", "terminalCandidate", "attemptLedger",
  "packetVerification", "producedOutputIds", "executedCheckIds", "executedNegativeControlIds",
  "invocationRecords", "callerInvocationResults", "registeredCap", "acceptedPacketCredit",
  "dependencyValid", "verdict", "reasons",
] as const);

const VERIFICATION_FIELDS = Object.freeze([
  "schema", "verificationId", "matrixId", "protocolId", "registryId", "packetId",
  "terminalState", "verifiedArtifacts", "checkResults", "executedNegativeControlIds",
  "negativeControlResults", "boundDependencyPacketIds", "execution", "callerInvocationResults",
  "governedTiming", "packageProcessAccounting", "packetResourceAccounting",
  "packageResourceAccounting", "aggregateVerdict", "limits",
] as const);

const GOVERNED_TIMING_FIELDS = Object.freeze([
  "source", "selectedAttemptId", "attemptLedger", "invocationRecords",
  "governedInvocationElapsedNanoseconds", "governedInvocationWallSeconds", "processHours",
] as const);

const PACKET_RESOURCE_FIELDS = Object.freeze([
  "source", "attemptId", "attemptLedger", "attemptRoot", "attemptRootArtifacts",
  "attemptMaximumObservedConcurrentBytes", "attemptTerminalRetainedBytes",
  "materializedPublicationArtifacts", "materializedPublicationBytes",
  "publicationFinalizationProjections", "projectedFinalizationBytes",
  "projectedPacketRetainedBytes", "physicalPathUniquenessVerdict", "appendOnlyVerdict",
] as const);

export interface Phase10C0VS6PriorPacketPreflightObservation {
  readonly packetId: Phase10C0VS6PacketId;
  readonly selectedSubrouteId: string;
  readonly dispositionCode: Phase10C0VS6DispositionCode | null;
  readonly terminalIdentity: Phase10C0VS6ArtifactIdentity;
  readonly verificationIdentity: Phase10C0VS6ArtifactIdentity;
  readonly governedElapsedNanoseconds: number;
  readonly finalizedRetainedBytes: number;
  readonly retainedArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly retainedPhysicalPaths: readonly string[];
}

export interface Phase10C0VS6PreflightResourceObservation {
  readonly packageElapsedNanosecondsBeforeAttempt: number;
  readonly projectedPackageElapsedNanosecondsAfterAttempt: number;
  readonly packageRetainedBytesBeforeAttempt: number;
  readonly projectedPackageBytesAfterAttempt: number;
  readonly observedFreeBytes: number;
  readonly failedConditionIds: readonly string[];
}

export interface Phase10C0VS6ObservedPreflight {
  readonly receipt: Phase10C0VS6RetainedPreflight;
  readonly bytes: Uint8Array;
  readonly packetProtocolIdentity: Phase10C0VS6ArtifactIdentity;
  readonly packetProtocolBytes: Uint8Array;
  readonly preflightTargetIdentity: Phase10C0VS6ArtifactIdentity;
  readonly dependencyDispositionSelections: readonly Phase10C0VS6DependencyDispositionSelection[];
  readonly priorPackets: readonly Phase10C0VS6PriorPacketPreflightObservation[];
  readonly packageStorageBaselineArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly packageRetainedArtifactsBeforeAttempt: readonly Phase10C0VS6ArtifactIdentity[];
  readonly deeplyVerifiedPriorPacketIds: readonly Phase10C0VS6PacketId[];
  readonly resourceObservation: Phase10C0VS6PreflightResourceObservation;
  readonly freeze: Phase10C0VS6ImplementationFreezeDerivation;
}

export interface Phase10C0VS6WrittenPreflight extends Phase10C0VS6ObservedPreflight {
  readonly publication: Phase10C0VS6CrashSafePublicationResult;
}

export interface Phase10C0VS6ObservePreflightInput {
  readonly root: Phase10C0VS6PhysicalRoot;
  readonly locks: Phase10C0VS6PackageAndPacketLockContext;
  readonly authority: Phase10C0VS6LockedPacketAuthority;
  readonly watchdog: Phase10C0VS6ParentWatchdogContext;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 preflight observer refused: ${message}`);
}

export function phase10C0VS6ResolveRuntimeLabel(
  rawRuntimeVersion: string,
): typeof PHASE10_C0V_S6_RUNTIME {
  const observedRuntime = `Node ${rawRuntimeVersion}`;
  if (observedRuntime !== PHASE10_C0V_S6_RUNTIME) {
    fail(`live runtime ${observedRuntime} differs from ${PHASE10_C0V_S6_RUNTIME}`);
  }
  return PHASE10_C0V_S6_RUNTIME;
}

function codePointCompare(left: string, right: string): number {
  const leftPoints = Array.from(left, (entry) => entry.codePointAt(0) as number);
  const rightPoints = Array.from(right, (entry) => entry.codePointAt(0) as number);
  for (let index = 0; index < Math.min(leftPoints.length, rightPoints.length); index += 1) {
    const difference = leftPoints[index]! - rightPoints[index]!;
    if (difference !== 0) return difference;
  }
  return leftPoints.length - rightPoints.length;
}

function safeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || Object.is(value, -0)) {
    fail(`${label} is not a nonnegative safe integer`);
  }
  return value;
}

function safeIntegerSum(values: readonly number[], label: string): number {
  const result = values.reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(result)) fail(`${label} exceeds safe-integer accounting`);
  return result;
}

function booleanValue(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") fail(`${label} must be boolean`);
  return value;
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) fail(`${label} must be a nonempty string`);
  return value;
}

function exactStringRoster(value: unknown, expected: readonly string[], label: string): readonly string[] {
  if (!Array.isArray(value) || value.length !== expected.length ||
    value.some((entry, index) => entry !== expected[index])) {
    fail(`${label} differs from exact authority`);
  }
  return Object.freeze(value.map((entry) => stringValue(entry, label)));
}

function identityRoster(value: unknown, label: string): readonly Phase10C0VS6ArtifactIdentity[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  const parsed = value.map((entry, index) =>
    parsePhase10C0VS6ArtifactIdentity(entry, `${label}[${index}]`));
  if (parsed.some((entry, index) => index > 0 &&
    codePointCompare(parsed[index - 1]!.path, entry.path) >= 0)) {
    fail(`${label} must be path-sorted and unique`);
  }
  return Object.freeze(parsed);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function assertRoot(input: Phase10C0VS6PhysicalRoot): Phase10C0VS6PhysicalRoot {
  const independentlyDerived = phase10C0VS6PhysicalRepositoryRoot(input.path);
  if (independentlyDerived.path !== input.path) fail("physical root differs after independent derivation");
  return independentlyDerived;
}

function relativePath(root: Phase10C0VS6PhysicalRoot, absolute: string, label: string): string {
  const displacement = relative(root.path, absolute);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
    isAbsolute(displacement)) fail(`${label} escapes repository root`);
  return phase10C0VS6SafeRelativePath(displacement.replaceAll("\\", "/"), label);
}

function absolutePath(root: Phase10C0VS6PhysicalRoot, pathValue: string, label: string): string {
  const path = phase10C0VS6SafeRelativePath(pathValue, label);
  const absolute = resolve(root.path, path);
  if (relativePath(root, absolute, label) !== path) fail(`${label} is not normalized`);
  return absolute;
}

function physicalObjectExists(
  root: Phase10C0VS6PhysicalRoot,
  pathValue: string,
  label: string,
): boolean {
  const safe = phase10C0VS6SafeRelativePath(pathValue, label);
  const parts = safe.split("/");
  let current = root.path;
  for (let index = 0; index < parts.length; index += 1) {
    current = resolve(current, parts[index]!);
    let stat: ReturnType<typeof lstatSync>;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
      throw error;
    }
    if (index === parts.length - 1) return true;
    if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync.native(current) !== current) {
      fail(`${label} parent is not a physical unaliased directory`);
    }
  }
  return false;
}

function readIdentity(
  root: Phase10C0VS6PhysicalRoot,
  pathValue: string,
): Readonly<{ bytes: Uint8Array; identity: Phase10C0VS6ArtifactIdentity }> {
  const bytes = phase10C0VS6ReadUniquePhysicalFile(root, pathValue);
  return Object.freeze({ bytes, identity: phase10C0VS6ArtifactIdentity(pathValue, bytes) });
}

function requireExpectedIdentity(
  root: Phase10C0VS6PhysicalRoot,
  expected: Phase10C0VS6ArtifactIdentity,
  label: string,
): Readonly<{ bytes: Uint8Array; identity: Phase10C0VS6ArtifactIdentity }> {
  const observed = readIdentity(root, expected.path);
  phase10C0VS6SameIdentity(observed.identity, expected, label);
  return observed;
}

function requireManifestIdentity(
  root: Phase10C0VS6PhysicalRoot,
  pathValue: string,
  manifest: ReadonlyMap<string, Phase10C0VS6ArtifactIdentity>,
  label: string,
): Readonly<{ bytes: Uint8Array; identity: Phase10C0VS6ArtifactIdentity }> {
  const expected = manifest.get(pathValue);
  if (expected === undefined) fail(`${label} is absent from the launch-HEAD evidence manifest`);
  return requireExpectedIdentity(root, expected, label);
}

export function phase10C0VS6AssertObservedLocks(
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
  locks: Phase10C0VS6PackageAndPacketLockContext,
): void {
  phase10C0VS6AssertPackageAndPacketLockBytes(root, packet, locks);
}

function pathBelongsToRoot(path: string, root: string): boolean {
  return path.startsWith(`${root}/`);
}

function assertPackageRetainedRootCensus(
  root: Phase10C0VS6PhysicalRoot,
  catalogue: Phase10C0VS6PacketCatalogue,
  currentPacket: Phase10C0VS6PacketProtocol,
  manifest: ReadonlyMap<string, Phase10C0VS6ArtifactIdentity>,
  baseline: readonly Phase10C0VS6ArtifactIdentity[],
  priorPackets: readonly Phase10C0VS6PriorPacketPreflightObservation[],
): void {
  const currentIndex = catalogue.packets.findIndex((entry) => entry.packetId === currentPacket.packetId);
  const protocols = catalogue.packets.map((entry, index) => entry.packetId === currentPacket.packetId
    ? currentPacket
    : index < currentIndex
      ? readPriorProtocol(root, catalogue, entry.packetId).packet
      : readCurrentProtocol(root, catalogue, entry.packetId).packet);
  const allowedPublicationPaths = protocols.flatMap((entry) => entry.paths.allowedPublicationPaths);
  if (new Set(allowedPublicationPaths).size !== allowedPublicationPaths.length) {
    fail("package protocols repeat an allowed publication path");
  }
  for (const path of [
    ...allowedPublicationPaths,
    ...protocols.flatMap((entry) => entry.paths.publicationStagingPaths.map((mapping) => mapping.stagingPath)),
  ]) {
    if (PACKAGE_PUBLICATION_ROOTS.filter((entry) => pathBelongsToRoot(path, entry)).length !== 1) {
      fail(`${path} does not belong to one exact package publication root`);
    }
  }
  const allowed = new Set(allowedPublicationPaths);
  const baselinePaths = new Set(baseline.map((entry) => entry.path));
  const exactUnownedLaunchArtifacts = [...manifest.values()].filter((entry) =>
    PACKAGE_PUBLICATION_ROOTS.some((rootPath) => pathBelongsToRoot(entry.path, rootPath)) &&
    !allowed.has(entry.path) && !baselinePaths.has(entry.path));
  const acceptedPublicationArtifacts = priorPackets.flatMap((entry) => entry.retainedArtifacts)
    .filter((entry) => PACKAGE_PUBLICATION_ROOTS.some((rootPath) =>
      pathBelongsToRoot(entry.path, rootPath)));
  const expectedPublicationArtifacts = [
    ...exactUnownedLaunchArtifacts,
    ...baseline.filter((entry) => PACKAGE_PUBLICATION_ROOTS.some((rootPath) =>
      pathBelongsToRoot(entry.path, rootPath))),
    ...acceptedPublicationArtifacts,
  ];
  phase10C0VS6AssertExactPhysicalRootCensus(root, PACKAGE_PUBLICATION_ROOTS, expectedPublicationArtifacts);
  const baselineAttemptArtifacts = baseline.filter((entry) =>
    pathBelongsToRoot(entry.path, PACKAGE_BASELINE_ATTEMPT_ROOT));
  phase10C0VS6AssertExactPhysicalRootCensus(
    root,
    [PACKAGE_BASELINE_ATTEMPT_ROOT],
    baselineAttemptArtifacts,
  );
  const acceptedAttemptArtifacts = priorPackets.flatMap((entry) => entry.retainedArtifacts)
    .filter((entry) => PACKAGE_ATTEMPT_ROOTS.some((attemptRoot) =>
      pathBelongsToRoot(entry.path, attemptRoot)));
  phase10C0VS6AssertExactPhysicalRootCensus(root, PACKAGE_ATTEMPT_ROOTS, acceptedAttemptArtifacts);
}

function exactIdentityRoster(
  actual: readonly Phase10C0VS6ArtifactIdentity[],
  expected: readonly Phase10C0VS6ArtifactIdentity[],
  label: string,
): void {
  if (actual.length !== expected.length) fail(`${label} cardinality differs`);
  for (let index = 0; index < actual.length; index += 1) {
    phase10C0VS6SameIdentity(actual[index]!, expected[index]!, `${label}[${index}]`);
  }
}

function exactPathRoster(actual: readonly string[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    fail(`${label} differs from exact route authority`);
  }
}

function supportedDeepPriorPrefix(packetIds: readonly Phase10C0VS6PacketId[]): boolean {
  const order = Object.freeze([
    "a-p-c0v-s6",
    "c0v-moving-produce",
    "c0v-moving-publish",
    "c0v-radial-produce",
    "c0v-radial-publish",
    "c0v-static-produce",
    "c0v-static-publish",
  ] as const satisfies readonly Phase10C0VS6PacketId[]);
  return packetIds.length <= order.length && packetIds.every((entry, index) => entry === order[index]);
}

function assertSupportedDeepPriorProjection(
  input: Phase10C0VS6ObservePreflightInput,
  observed: Readonly<{
    bytes: Uint8Array;
    receipt: Phase10C0VS6RetainedPreflight;
    packetProtocolIdentity: Phase10C0VS6ArtifactIdentity;
    packetProtocolBytes: Uint8Array;
    priorPackets: readonly Phase10C0VS6PriorPacketPreflightObservation[];
  }>,
): readonly Phase10C0VS6PacketId[] {
  const priorPacketIds = observed.priorPackets.map((entry) => entry.packetId);
  if (!supportedDeepPriorPrefix(priorPacketIds)) {
    fail("catalogue prior prefix has no complete deep published-packet projector");
  }
  if (priorPacketIds.length === 0) return Object.freeze([]);
  const deep = independentlyVerifyPhase10C0VS6ObservedPublishedDependencyPrefix({
    repositoryRoot: input.root.path,
    packetProtocolIdentity: observed.packetProtocolIdentity,
    packetProtocolBytes: observed.packetProtocolBytes,
    preflightBytes: observed.bytes,
  });
  phase10C0VS6SameJson(deep.currentPacket, input.authority.packet, "deep current packet authority");
  phase10C0VS6SameJson(deep.currentPreflight, observed.receipt, "deep current preflight authority");
  exactPathRoster(
    deep.selectedPackets.map((entry) => entry.packet.packetId),
    priorPacketIds,
    "deep selected dependency packet order",
  );
  for (const projected of deep.selectedPackets) {
    const matches = observed.priorPackets.filter((entry) => entry.packetId === projected.packet.packetId);
    if (matches.length !== 1) {
      fail(`${projected.packet.packetId} deep projection is absent from the catalogue prefix`);
    }
    const prior = matches[0]!;
    if (prior.selectedSubrouteId !== projected.selectedSubrouteId ||
      prior.dispositionCode !== projected.dispositionCode ||
      prior.governedElapsedNanoseconds !== projected.governedElapsedNanoseconds ||
      prior.finalizedRetainedBytes !== projected.finalizedPacketRetainedBytes) {
      fail(`${projected.packet.packetId} deep route/timing/resource projection differs`);
    }
    phase10C0VS6SameIdentity(
      prior.verificationIdentity,
      projected.verificationIdentity,
      `${projected.packet.packetId} deep verification identity`,
    );
    phase10C0VS6SameIdentity(
      prior.terminalIdentity,
      projected.terminalReceiptIdentity,
      `${projected.packet.packetId} deep terminal identity`,
    );
    exactPathRoster(
      prior.retainedPhysicalPaths,
      projected.retainedPhysicalPaths,
      `${projected.packet.packetId} deep retained physical paths`,
    );
    const projectedRetainedArtifacts = projected.reopenedArtifacts
      .filter((entry) => projected.retainedPhysicalPaths.includes(entry.identity.path))
      .map((entry) => entry.identity)
      .sort((left, right) => codePointCompare(left.path, right.path));
    exactIdentityRoster(
      prior.retainedArtifacts,
      projectedRetainedArtifacts,
      `${projected.packet.packetId} deep retained identities`,
    );
  }
  return Object.freeze(deep.selectedPackets.map((entry) => entry.packet.packetId));
}

function parseDisposition(value: unknown, label: string): Phase10C0VS6DispositionCode | null {
  if (value === null) return null;
  if (value === "production-complete" || value === "preproduction-artifact-refusal" ||
    value === "prelaunch-resource-refusal" || value === "registered-cap-resource-refusal" ||
    value === "reference-discrepancy-refusal" || value === "preimplementation-reference-refusal") {
    return value;
  }
  fail(`${label} differs from the exact disposition enum`);
}

function outputPath(
  matrix: Phase10C0VS6ObligationMatrix,
  packetId: Phase10C0VS6PacketId,
  outputId: string,
): string {
  const matches = matrix.outputs.filter((entry) =>
    entry.packetId === packetId && entry.outputId === outputId && entry.artifact.field === null);
  if (matches.length !== 1) fail(`${packetId} output ${outputId} does not resolve one whole-file path`);
  return matches[0]!.artifact.path;
}

function candidatePublicationPaths(
  packet: Phase10C0VS6PacketProtocol,
  selectedSubrouteId: string,
): readonly string[] {
  const filenames = packet.candidateFilenameRosters[selectedSubrouteId];
  if (filenames === undefined) fail(`${selectedSubrouteId} has no candidate filename roster`);
  const paths = [packet.paths.preflightReceiptPath, ...filenames.map((filename) => {
    const matches = packet.paths.allowedPublicationPaths.filter((path) => basename(path) === filename);
    if (matches.length !== 1) fail(`${filename} does not resolve one allowed publication path`);
    return matches[0]!;
  })].sort(codePointCompare);
  if (new Set(paths).size !== paths.length) fail(`${selectedSubrouteId} repeats a publication path`);
  return Object.freeze(paths);
}

function assertExactAttemptRoot(
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
): void {
  const rootAbsolute = absolutePath(root, packet.paths.attemptRoot, `${packet.packetId} attempt root`);
  const stat = lstatSync(rootAbsolute);
  if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync.native(rootAbsolute) !== rootAbsolute) {
    fail(`${packet.packetId} attempt root is not a physical unaliased directory`);
  }
  const entries = readdirSync(rootAbsolute, { withFileTypes: true });
  if (entries.length !== 1 || entries[0]!.name !== packet.registeredAttemptId ||
    !entries[0]!.isDirectory()) {
    fail(`${packet.packetId} attempt root does not contain exactly its one registered attempt`);
  }
}

function assertPriorPublicationState(
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
  selectedSubrouteId: string,
): void {
  assertExactAttemptRoot(root, packet);
  const verificationPath = exactVerificationPath(packet);
  const expected = new Set([
    ...candidatePublicationPaths(packet, selectedSubrouteId),
    verificationPath,
    packet.paths.terminalReceiptPath,
  ]);
  for (const path of packet.paths.allowedPublicationPaths) {
    const exists = physicalObjectExists(root, path, `${packet.packetId} publication path`);
    if (exists !== expected.has(path)) {
      fail(`${packet.packetId} publication path state differs for selected route: ${path}`);
    }
  }
  for (const mapping of packet.paths.publicationStagingPaths) {
    if (physicalObjectExists(root, mapping.stagingPath, `${packet.packetId} staging path`)) {
      fail(`${packet.packetId} has a stranded publication stage ${mapping.stagingPath}`);
    }
  }
  if (physicalObjectExists(root, packet.paths.lockPath, `${packet.packetId} prior lock path`)) {
    fail(`${packet.packetId} prior packet lock remains stale`);
  }
}

function assertUnmaterializedPacket(
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
): void {
  for (const path of [
    packet.paths.attemptRoot,
    ...packet.paths.allowedPublicationPaths,
    ...packet.paths.publicationStagingPaths.map((entry) => entry.stagingPath),
  ]) {
    if (physicalObjectExists(root, path, `${packet.packetId} unmaterialized path`)) {
      fail(`${packet.packetId} has out-of-order materialized state at ${path}`);
    }
  }
  if (packet.paths.lockPath !== packet.paths.packageLockPath &&
    physicalObjectExists(root, packet.paths.lockPath, `${packet.packetId} unmaterialized lock`)) {
    fail(`${packet.packetId} has an out-of-order or stale packet lock`);
  }
}

function readCurrentProtocol(
  root: Phase10C0VS6PhysicalRoot,
  catalogue: Phase10C0VS6PacketCatalogue,
  packetId: Phase10C0VS6PacketId,
): Readonly<{
  packet: Phase10C0VS6PacketProtocol;
  identity: Phase10C0VS6ArtifactIdentity;
}> {
  const entries = catalogue.packets.filter((entry) => entry.packetId === packetId);
  if (entries.length !== 1) fail(`${packetId} does not resolve one catalogue row`);
  const entry = entries[0]!;
  const reopened = readIdentity(root, entry.protocolPath);
  const packet = parsePhase10C0VS6PacketProtocol(
    parsePhase10C0VS6PrettyJsonBytes(reopened.bytes, `${packetId} current protocol`),
  );
  if (packet.packetId !== packetId || packet.paths.attemptRoot !== entry.attemptRoot ||
    packet.paths.preflightReceiptPath !== entry.preflightReceiptPath ||
    packet.paths.terminalReceiptPath !== entry.terminalReceiptPath) {
    fail(`${packetId} current protocol differs from catalogue`);
  }
  return Object.freeze({ packet, identity: reopened.identity });
}

function readPriorProtocol(
  root: Phase10C0VS6PhysicalRoot,
  catalogue: Phase10C0VS6PacketCatalogue,
  packetId: Phase10C0VS6PacketId,
): Readonly<{
  packet: Phase10C0VS6PacketProtocol;
  identity: Phase10C0VS6ArtifactIdentity;
}> {
  const entries = catalogue.packets.filter((entry) => entry.packetId === packetId);
  if (entries.length !== 1) fail(`${packetId} does not resolve one catalogue row`);
  const entry = entries[0]!;
  const preflightLive = readIdentity(root, entry.preflightReceiptPath);
  const raw = phase10C0VS6Object(
    phase10C0VS6ParsePrettyJson(preflightLive.bytes, `${packetId} retained preflight protocol authority`),
    `${packetId} retained preflight protocol authority`,
  );
  const observed = phase10C0VS6Object(raw.observed, `${packetId} retained preflight observed authority`);
  const identity = parsePhase10C0VS6ArtifactIdentity(
    observed.packetProtocol,
    `${packetId} retained preflight packetProtocol`,
  );
  const protocolBytes = requireExpectedIdentity(root, identity, `${packetId} retained packet protocol`).bytes;
  const retained = derivePhase10C0VS6HistoricalRetainedRuntimeAuthority({
    repositoryRoot: root.path,
    packetProtocolIdentity: identity,
    packetProtocolBytes: protocolBytes,
    preflightBytes: preflightLive.bytes,
  });
  if (retained.packet.packetId !== packetId ||
    retained.packet.paths.preflightReceiptPath !== entry.preflightReceiptPath ||
    retained.packet.paths.terminalReceiptPath !== entry.terminalReceiptPath) {
    fail(`${packetId} retained protocol differs from the current catalogue's immutable publication paths`);
  }
  return Object.freeze({ packet: retained.packet, identity });
}

function selectedSubrouteFromTerminal(
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
  terminal: ReturnType<typeof phase10C0VS6Object>,
  terminalCandidateIdentity: Phase10C0VS6ArtifactIdentity,
): Phase10C0VS6PacketProtocol["terminalSubroutes"][number] {
  const attemptDirectory = `${packet.paths.attemptRoot}/${packet.registeredAttemptId}`;
  const expectedCandidatePath = `${attemptDirectory}/${packet.terminalCandidateContract.successFilename}`;
  if (terminalCandidateIdentity.path !== expectedCandidatePath) {
    fail(`${packet.packetId} terminal candidate path differs from its attempt directory`);
  }
  const candidateBytes = requireExpectedIdentity(
    root,
    terminalCandidateIdentity,
    `${packet.packetId} terminal candidate bytes`,
  ).bytes;
  const candidate = phase10C0VS6Object(
    phase10C0VS6ParsePrettyJson(candidateBytes, `${packet.packetId} terminal candidate`),
    `${packet.packetId} terminal candidate`,
  );
  phase10C0VS6ExactOrderedKeys(
    candidate,
    packet.terminalCandidateContract.exactFields,
    `${packet.packetId} terminal candidate`,
  );
  const selectedSubrouteId = stringValue(
    candidate.selectedSubrouteId,
    `${packet.packetId} terminal candidate selectedSubrouteId`,
  );
  const subroutes = packet.terminalSubroutes.filter((entry) => entry.subrouteId === selectedSubrouteId);
  if (subroutes.length !== 1 || candidate.schema !== packet.terminalCandidateContract.rowSchema ||
    candidate.packetId !== packet.packetId || candidate.attemptId !== packet.registeredAttemptId ||
    parseDisposition(candidate.dispositionCode, "terminal candidate disposition") !== subroutes[0]!.dispositionCode ||
    candidate.verdict !== "accepted-route-candidate") {
    fail(`${packet.packetId} terminal candidate does not select one registered accepted route`);
  }
  const subroute = subroutes[0]!;
  if (parseDisposition(terminal.dispositionCode, "terminal disposition") !== subroute.dispositionCode) {
    fail(`${packet.packetId} terminal and candidate dispositions disagree`);
  }
  return subroute;
}

/** Exact closed-world attempt roster for one selected route, including candidate payloads. */
export function phase10C0VS6AssertSelectedAttemptPathRoster(
  packet: Phase10C0VS6PacketProtocol,
  selectedSubrouteId: string,
  attemptDirectory: string,
  actualPaths: readonly string[],
): void {
  const internalRosters = packet.internalArtifactRosters.filter(
    (entry) => entry.rosterId === selectedSubrouteId,
  );
  if (internalRosters.length !== 1) fail(`${selectedSubrouteId} does not resolve one internal artifact roster`);
  const candidateFilenames = packet.candidateFilenameRosters[selectedSubrouteId];
  if (candidateFilenames === undefined) fail(`${selectedSubrouteId} does not resolve one candidate filename roster`);
  const expectedPaths = [
    ...internalRosters[0]!.relativePaths.map((path) => `${attemptDirectory}/${path}`),
    ...candidateFilenames.map((filename) => `${attemptDirectory}/candidate/${filename}`),
  ].sort(codePointCompare);
  if (new Set(expectedPaths).size !== expectedPaths.length) {
    fail(`${selectedSubrouteId} repeats a selected attempt path`);
  }
  exactPathRoster(actualPaths, expectedPaths, `${selectedSubrouteId} selected attempt paths`);
}

function parsePriorResourceAccounting(
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
  selectedSubrouteId: string,
  rowValue: unknown,
  manifest: ReadonlyMap<string, Phase10C0VS6ArtifactIdentity>,
): Readonly<{
  attemptLedger: Phase10C0VS6ArtifactIdentity | null;
  finalizedRetainedBytes: number;
  retainedArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  retainedPhysicalPaths: readonly string[];
}> {
  const label = `${packet.packetId} packet resource accounting`;
  const row = phase10C0VS6Object(rowValue, label);
  phase10C0VS6ExactOrderedKeys(row, PACKET_RESOURCE_FIELDS, label);
  const produce = packet.packetId === "c0v-moving-produce" || packet.packetId === "c0v-radial-produce" ||
    packet.packetId === "c0v-static-produce";
  const expectedSource = produce ? "selected-attempt-resource-record" : "append-only-attempt-root";
  if (row.source !== expectedSource || row.attemptId !== packet.registeredAttemptId ||
    row.attemptRoot !== packet.paths.attemptRoot || row.physicalPathUniquenessVerdict !== "pass" ||
    row.appendOnlyVerdict !== "pass") {
    fail(`${label} source/attempt/root/verdict differs`);
  }
  const attemptLedger = row.attemptLedger === null
    ? null
    : parsePhase10C0VS6ArtifactIdentity(row.attemptLedger, `${label}.attemptLedger`);
  if ((attemptLedger !== null) !== produce) fail(`${label}.attemptLedger nullability differs`);
  const attemptDirectory = `${packet.paths.attemptRoot}/${packet.registeredAttemptId}`;
  const actualAttemptArtifacts = phase10C0VS6CensusUniquePhysicalDirectory(root, attemptDirectory);
  const recordedAttemptArtifacts = identityRoster(row.attemptRootArtifacts, `${label}.attemptRootArtifacts`);
  exactIdentityRoster(recordedAttemptArtifacts, actualAttemptArtifacts, `${label}.attemptRootArtifacts live census`);
  phase10C0VS6AssertSelectedAttemptPathRoster(
    packet,
    selectedSubrouteId,
    attemptDirectory,
    actualAttemptArtifacts.map((entry) => entry.path),
  );
  const attemptBytes = safeIntegerSum(actualAttemptArtifacts.map((entry) => entry.byteLength), `${label} attempt bytes`);
  if (row.attemptTerminalRetainedBytes !== attemptBytes ||
    row.attemptMaximumObservedConcurrentBytes !== attemptBytes) {
    fail(`${label} violates terminal-equals-maximum append-only accounting`);
  }
  const materialized = identityRoster(
    row.materializedPublicationArtifacts,
    `${label}.materializedPublicationArtifacts`,
  );
  const expectedPublicationPaths = candidatePublicationPaths(packet, selectedSubrouteId);
  exactPathRoster(materialized.map((entry) => entry.path), expectedPublicationPaths, `${label} publication paths`);
  for (const identity of materialized) {
    const live = requireManifestIdentity(root, identity.path, manifest, `${label} ${identity.path}`);
    phase10C0VS6SameIdentity(live.identity, identity, `${label} materialized identity`);
  }
  const materializedBytes = safeIntegerSum(materialized.map((entry) => entry.byteLength), `${label} publication bytes`);
  if (row.materializedPublicationBytes !== materializedBytes) fail(`${label}.materializedPublicationBytes differs`);
  phase10C0VS6SameJson(
    row.publicationFinalizationProjections,
    packet.resources.publicationFinalizationProjections,
    `${label}.publicationFinalizationProjections`,
  );
  const projectedFinalizationBytes = safeIntegerSum(
    packet.resources.publicationFinalizationProjections.map((entry) => entry.maximumByteLength * 2),
    `${label} projected finalization bytes`,
  );
  if (row.projectedFinalizationBytes !== projectedFinalizationBytes ||
    row.projectedPacketRetainedBytes !== attemptBytes + materializedBytes + projectedFinalizationBytes) {
    fail(`${label} projected byte arithmetic differs`);
  }
  const retainedArtifacts = [...actualAttemptArtifacts, ...materialized]
    .sort((left, right) => codePointCompare(left.path, right.path));
  const physicalPaths = retainedArtifacts.map((entry) => entry.path);
  if (new Set(physicalPaths).size !== physicalPaths.length) fail(`${label} repeats a retained physical path`);
  return Object.freeze({
    attemptLedger,
    finalizedRetainedBytes: attemptBytes + materializedBytes,
    retainedArtifacts: Object.freeze(retainedArtifacts),
    retainedPhysicalPaths: Object.freeze(physicalPaths),
  });
}

function derivePriorTiming(
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
  packetProtocolIdentity: Phase10C0VS6ArtifactIdentity,
  preflight: Phase10C0VS6RetainedPreflight,
  subroute: Phase10C0VS6PacketProtocol["terminalSubroutes"][number],
  timingValue: unknown,
  resourceAttemptLedger: Phase10C0VS6ArtifactIdentity | null,
): number {
  const label = `${packet.packetId} governed timing`;
  const timing = phase10C0VS6Object(timingValue, label);
  phase10C0VS6ExactOrderedKeys(timing, GOVERNED_TIMING_FIELDS, label);
  const invocationRecords = timing.invocationRecords;
  if (!Array.isArray(invocationRecords)) fail(`${label}.invocationRecords must be an array`);
  const attemptDirectory = `${packet.paths.attemptRoot}/${packet.registeredAttemptId}`;
  const workerPath = `${attemptDirectory}/${packet.workerInvocationContract.filename}`;
  const produce = packet.packetId === "c0v-moving-produce" || packet.packetId === "c0v-radial-produce" ||
    packet.packetId === "c0v-static-produce";
  let elapsedNanoseconds: number;
  if (produce) {
    if (timing.source !== "selected-attempt-row" || timing.selectedAttemptId !== packet.registeredAttemptId ||
      timing.attemptLedger === null || resourceAttemptLedger === null) {
      fail(`${label} lacks selected produce-attempt authority`);
    }
    const attemptLedger = parsePhase10C0VS6ArtifactIdentity(timing.attemptLedger, `${label}.attemptLedger`);
    phase10C0VS6SameIdentity(attemptLedger, resourceAttemptLedger, `${label} resource join`);
    const ledgerBytes = requireExpectedIdentity(root, attemptLedger, `${label} ledger bytes`).bytes;
    const rows = parsePhase10C0VS6AttemptLedgerV2(ledgerBytes, `${packet.packetId} attempt ledger`);
    if (rows.length !== 1) fail(`${label} ledger does not contain one row`);
    const attempt = rows[0]!;
    if (attempt.attemptId !== packet.registeredAttemptId || attempt.gitHead !== preflight.observed.head) {
      fail(`${label} attempt identity/launch HEAD differs from preflight`);
    }
    phase10C0VS6SameIdentity(attempt.protocol, packetProtocolIdentity, `${label} packet protocol`);
    phase10C0VS6SameIdentity(attempt.preflight, phase10C0VS6ArtifactIdentity(
      packet.paths.preflightReceiptPath,
      phase10C0VS6ReadUniquePhysicalFile(root, packet.paths.preflightReceiptPath),
    ), `${label} preflight`);
    const tuple = phase10C0VS6ValidateRegisteredExecutionRecordTuple(attempt, packet.executionRecordTuples);
    if (tuple.tupleId !== subroute.subrouteId || attempt.dispositionCode !== subroute.dispositionCode) {
      fail(`${label} attempt tuple differs from selected terminal route`);
    }
    const roster = phase10C0VS6ValidateRegisteredExecutableInvocationRoster(
      attempt,
      tuple,
      packet.executableInvocationRosters,
    );
    if (roster.invocations.length === 0) {
      if (physicalObjectExists(root, workerPath, `${label} worker path`)) {
        fail(`${label} zero-worker route retained an unregistered worker stream`);
      }
      elapsedNanoseconds = 0;
    } else {
      const evaluated = independentlyEvaluatePhase10C0VS6WorkerInvocations(
        phase10C0VS6ReadUniquePhysicalFile(root, workerPath),
        packet,
        tuple.tupleId,
        Date.now(),
      );
      phase10C0VS6SameJson(
        evaluated.invocationRecords,
        attempt.executableInvocationRecords,
        `${label} raw worker records`,
      );
      elapsedNanoseconds = safeIntegerSum(
        evaluated.invocationRecords.map((entry) => entry.elapsedNanoseconds),
        `${label} raw elapsed sum`,
      );
    }
    phase10C0VS6SameJson(invocationRecords, attempt.executableInvocationRecords, `${label} verification records`);
    if (attempt.executionRecord.governedInvocationElapsedNanoseconds !== elapsedNanoseconds) {
      fail(`${label} attempt elapsed nanoseconds differ from raw worker events`);
    }
  } else {
    if (timing.source !== "packet-verification-worker" || timing.selectedAttemptId !== null ||
      timing.attemptLedger !== null || resourceAttemptLedger !== null) {
      fail(`${label} nonproduce source/nullability differs`);
    }
    const evaluated = independentlyEvaluatePhase10C0VS6PacketWorkerInvocations(
      phase10C0VS6ReadUniquePhysicalFile(root, workerPath),
      packet,
      subroute.subrouteId,
      Date.now(),
    );
    phase10C0VS6SameJson(invocationRecords, evaluated.invocationRecords, `${label} raw worker records`);
    elapsedNanoseconds = safeIntegerSum(
      evaluated.invocationRecords.map((entry) => entry.elapsedNanoseconds),
      `${label} raw elapsed sum`,
    );
  }
  if (timing.governedInvocationElapsedNanoseconds !== elapsedNanoseconds ||
    timing.governedInvocationWallSeconds !== elapsedNanoseconds / 1_000_000_000 ||
    timing.processHours !== elapsedNanoseconds / 3_600_000_000_000) {
    fail(`${label} derived integer-nanosecond totals differ`);
  }
  return elapsedNanoseconds;
}

function observePriorPacket(
  root: Phase10C0VS6PhysicalRoot,
  catalogue: Phase10C0VS6PacketCatalogue,
  matrix: Phase10C0VS6ObligationMatrix,
  packetId: Phase10C0VS6PacketId,
  manifest: ReadonlyMap<string, Phase10C0VS6ArtifactIdentity>,
): Phase10C0VS6PriorPacketPreflightObservation {
  const catalogueRows = catalogue.packets.filter((entry) => entry.packetId === packetId);
  if (catalogueRows.length !== 1) fail(`${packetId} prior catalogue row is not unique`);
  const catalogueRow = catalogueRows[0]!;
  const protocolAuthority = readPriorProtocol(root, catalogue, packetId);
  const packet = protocolAuthority.packet;
  const preflightLive = requireManifestIdentity(
    root,
    packet.paths.preflightReceiptPath,
    manifest,
    `${packetId} retained preflight`,
  );
  const preflight = parsePhase10C0VS6RetainedPreflight(
    phase10C0VS6ParsePrettyJson(preflightLive.bytes, `${packetId} retained preflight`),
    packet,
    protocolAuthority.identity,
  );
  const terminalLive = requireManifestIdentity(
    root,
    packet.paths.terminalReceiptPath,
    manifest,
    `${packetId} terminal receipt`,
  );
  const terminal = phase10C0VS6Object(
    phase10C0VS6ParsePrettyJson(terminalLive.bytes, `${packetId} terminal receipt`),
    `${packetId} terminal receipt`,
  );
  phase10C0VS6ExactOrderedKeys(terminal, TERMINAL_FIELDS, `${packetId} terminal receipt`);
  if (terminal.schema !== packet.terminalReceiptContract.receiptSchema ||
    terminal.receiptId !== `phase10-${packetId}-${packet.registeredAttemptId}-terminal-v2` ||
    terminal.matrixId !== packet.matrixId || terminal.protocolId !== packet.protocolId ||
    terminal.registryId !== packet.registryId || terminal.packetId !== packetId ||
    terminal.attemptId !== packet.registeredAttemptId ||
    booleanValue(terminal.acceptedPacketCredit, `${packetId} acceptedPacketCredit`) !== true ||
    booleanValue(terminal.dependencyValid, `${packetId} dependencyValid`) !== true ||
    terminal.verdict !== "complete") {
    fail(`${packetId} terminal receipt is not an accepted dependency-valid completion`);
  }
  exactStringRoster(terminal.reasons, [], `${packetId} terminal reasons`);
  const terminalPreflight = parsePhase10C0VS6ArtifactIdentity(terminal.preflight, `${packetId} terminal preflight`);
  phase10C0VS6SameIdentity(terminalPreflight, preflightLive.identity, `${packetId} terminal/preflight join`);
  const terminalCandidate = parsePhase10C0VS6ArtifactIdentity(
    terminal.terminalCandidate,
    `${packetId} terminal candidate`,
  );
  const subroute = selectedSubrouteFromTerminal(root, packet, terminal, terminalCandidate);
  assertPriorPublicationState(root, packet, subroute.subrouteId);
  exactStringRoster(terminal.producedOutputIds, subroute.requiredOutputIds, `${packetId} terminal outputs`);
  exactStringRoster(terminal.executedCheckIds, subroute.requiredCheckIds, `${packetId} terminal checks`);
  exactStringRoster(
    terminal.executedNegativeControlIds,
    subroute.requiredNegativeControlIds,
    `${packetId} terminal negative controls`,
  );
  if (!subroute.requiredOutputIds.some((outputId) => outputId.endsWith("-verification"))) {
    fail(`${packetId} selected route cannot satisfy a prior-prefix dependency`);
  }
  const packetVerification = terminal.packetVerification === null
    ? fail(`${packetId} accepted terminal lacks packet verification identity`)
    : parsePhase10C0VS6ArtifactIdentity(terminal.packetVerification, `${packetId} packet verification`);
  if (packetVerification.path !== catalogueRow.verificationPath) {
    fail(`${packetId} packet verification path differs from catalogue`);
  }
  const verificationLive = requireManifestIdentity(
    root,
    packetVerification.path,
    manifest,
    `${packetId} packet verification`,
  );
  phase10C0VS6SameIdentity(verificationLive.identity, packetVerification, `${packetId} terminal/verification join`);
  const verification = phase10C0VS6Object(
    phase10C0VS6ParsePrettyJson(verificationLive.bytes, `${packetId} packet verification`),
    `${packetId} packet verification`,
  );
  phase10C0VS6ExactOrderedKeys(verification, VERIFICATION_FIELDS, `${packetId} packet verification`);
  if (verification.schema !== packet.verification.schemaId ||
    verification.verificationId !== `phase10-${packetId}-${packet.registeredAttemptId}-verification-v2` ||
    verification.matrixId !== packet.matrixId || verification.protocolId !== packet.protocolId ||
    verification.registryId !== packet.registryId || verification.packetId !== packetId ||
    verification.terminalState !== "complete" || verification.aggregateVerdict !== "pass") {
    fail(`${packetId} packet verification identity/state differs`);
  }
  const resource = parsePriorResourceAccounting(
    root,
    packet,
    subroute.subrouteId,
    verification.packetResourceAccounting,
    manifest,
  );
  const governedElapsedNanoseconds = derivePriorTiming(
    root,
    packet,
    protocolAuthority.identity,
    preflight,
    subroute,
    verification.governedTiming,
    resource.attemptLedger,
  );
  const retainedArtifacts = [
    ...resource.retainedArtifacts,
    verificationLive.identity,
    terminalLive.identity,
  ].sort((left, right) => codePointCompare(left.path, right.path));
  const retainedPaths = retainedArtifacts.map((entry) => entry.path);
  if (new Set(retainedPaths).size !== retainedPaths.length) fail(`${packetId} finalized paths repeat`);
  const finalizedRetainedBytes = safeIntegerSum([
    resource.finalizedRetainedBytes,
    verificationLive.identity.byteLength,
    terminalLive.identity.byteLength,
  ], `${packetId} finalized retained bytes`);
  // The selected route's full output paths must be either pre-existing bound authority or one of
  // the exactly retained current-packet paths; no unregistered physical output can satisfy it.
  const registeredOutputPaths = subroute.requiredOutputIds.map((outputId) =>
    outputPath(matrix, packetId, outputId));
  for (const path of retainedPaths.filter((entry) => !entry.startsWith(`${packet.paths.attemptRoot}/`))) {
    if (!registeredOutputPaths.includes(path)) fail(`${packetId} retained path ${path} is not a route output`);
  }
  return Object.freeze({
    packetId,
    selectedSubrouteId: subroute.subrouteId,
    dispositionCode: subroute.dispositionCode,
    terminalIdentity: terminalLive.identity,
    verificationIdentity: verificationLive.identity,
    governedElapsedNanoseconds,
    finalizedRetainedBytes,
    retainedArtifacts: Object.freeze(retainedArtifacts),
    retainedPhysicalPaths: Object.freeze(retainedPaths),
  });
}

/** Pure exact-boundary classifier used by the live observer and focused mutation tests. */
export function phase10C0VS6ClassifyPreflightResources(
  packet: Pick<Phase10C0VS6PacketProtocol, "packetId" | "resources">,
  values: Readonly<{
    packageElapsedNanosecondsBeforeAttempt: number;
    packageRetainedBytesBeforeAttempt: number;
    observedFreeBytes: number;
  }>,
): Phase10C0VS6PreflightResourceObservation {
  const packageElapsedNanosecondsBeforeAttempt = safeInteger(
    values.packageElapsedNanosecondsBeforeAttempt,
    "package elapsed nanoseconds before attempt",
  );
  const packageRetainedBytesBeforeAttempt = safeInteger(
    values.packageRetainedBytesBeforeAttempt,
    "package retained bytes before attempt",
  );
  const observedFreeBytes = safeInteger(values.observedFreeBytes, "observed free bytes");
  const projectedPackageElapsedNanosecondsAfterAttempt = safeIntegerSum([
    packageElapsedNanosecondsBeforeAttempt,
    packet.resources.currentPacketRegisteredElapsedNanosecondsMaximum,
  ], "projected package elapsed nanoseconds");
  const projectedPacketBytes = safeIntegerSum([
    packet.resources.projectedScratchBytes,
    packet.resources.projectedPublicationBytes,
  ], "projected current packet bytes");
  const projectedPackageBytesAfterAttempt = safeIntegerSum([
    packageRetainedBytesBeforeAttempt,
    projectedPacketBytes,
  ], "projected package bytes");
  const failedConditionIds = Object.freeze([
    ...(observedFreeBytes < packet.resources.minimumFreeBytes || observedFreeBytes < projectedPacketBytes
      ? [`cond-${packet.packetId}-prelaunch-free-space`] : []),
    ...(projectedPackageElapsedNanosecondsAfterAttempt > PACKAGE_ELAPSED_NANOSECONDS_MAXIMUM
      ? [`cond-${packet.packetId}-prelaunch-process-hours`] : []),
    ...(projectedPackageBytesAfterAttempt > PACKAGE_RETAINED_BYTES_MAXIMUM
      ? [`cond-${packet.packetId}-prelaunch-storage`] : []),
  ]);
  return Object.freeze({
    packageElapsedNanosecondsBeforeAttempt,
    projectedPackageElapsedNanosecondsAfterAttempt,
    packageRetainedBytesBeforeAttempt,
    projectedPackageBytesAfterAttempt,
    observedFreeBytes,
    failedConditionIds,
  });
}

function observedFreeBytes(root: Phase10C0VS6PhysicalRoot): number {
  const observation = statfsSync(root.path, { bigint: true });
  const bytes = observation.bavail * observation.bsize;
  if (bytes < 0n || bytes > BigInt(Number.MAX_SAFE_INTEGER)) {
    fail("filesystem free bytes cannot be represented exactly as a safe integer");
  }
  return Number(bytes);
}

function baselineArtifacts(
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
  freeze: Phase10C0VS6ImplementationFreezeDerivation,
): readonly Phase10C0VS6ArtifactIdentity[] {
  const failedPath = freeze.artifactFailure?.expected.path ?? null;
  const paths = packet.resources.packageStorageBaselineArtifacts.map((entry) => entry.path);
  if (new Set(paths).size !== paths.length) fail("package baseline repeats a physical path");
  for (const expected of packet.resources.packageStorageBaselineArtifacts) {
    if (expected.path === failedPath) {
      phase10C0VS6SameIdentity(
        freeze.artifactFailure!.observed,
        expected,
        `${expected.path} safely observed failed baseline artifact`,
      );
    } else {
      requireExpectedIdentity(root, expected, `${expected.path} package baseline`);
    }
  }
  const total = safeIntegerSum(
    packet.resources.packageStorageBaselineArtifacts.map((entry) => entry.byteLength),
    "package storage baseline",
  );
  if (total !== packet.resources.packageStorageBaselineBytes) {
    fail("package storage baseline byte sum differs from protocol");
  }
  return Object.freeze([...packet.resources.packageStorageBaselineArtifacts]);
}

function dependencySelections(
  packet: Phase10C0VS6PacketProtocol,
  priorPackets: readonly Phase10C0VS6PriorPacketPreflightObservation[],
): readonly Phase10C0VS6DependencyDispositionSelection[] {
  return Object.freeze(packet.boundDependencyPacketIds.map((packetId) => {
    if (packetId === "a-p") return Object.freeze({ packetId, dispositionCode: null });
    const matches = priorPackets.filter((entry) => entry.packetId === packetId);
    if (matches.length !== 1) fail(`${packetId} dependency is absent from the accepted prior prefix`);
    return Object.freeze({ packetId, dispositionCode: matches[0]!.dispositionCode });
  }));
}

function dependencyIdentities(
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
  selections: readonly Phase10C0VS6DependencyDispositionSelection[],
  manifest: ReadonlyMap<string, Phase10C0VS6ArtifactIdentity>,
): readonly Phase10C0VS6ArtifactIdentity[] {
  const contracts = resolvePhase10C0VS6DependencyArtifactContracts(packet, selections);
  const paths = contracts.map((entry) => entry.artifactPath).sort(codePointCompare);
  if (new Set(paths).size !== paths.length) fail("outcome-selected dependency roster repeats a path");
  return Object.freeze(paths.map((path) =>
    requireManifestIdentity(root, path, manifest, `${packet.packetId} dependency ${path}`).identity));
}

export function phase10C0VS6SelectPreflightFailure(
  resource: Phase10C0VS6PreflightResourceObservation,
  artifactFailurePresent: boolean,
): string | null {
  if (resource.failedConditionIds.length > 1 ||
    (artifactFailurePresent && resource.failedConditionIds.length !== 0)) {
    fail("preflight has multiple simultaneous failures; no single registered refusal applies");
  }
  if (artifactFailurePresent) return "cond-c0v-radial-artifact-precondition-failed";
  return resource.failedConditionIds[0] ?? null;
}

function refusalCandidate(
  packet: Phase10C0VS6PacketProtocol,
  packetProtocolIdentity: Phase10C0VS6ArtifactIdentity,
  resource: Phase10C0VS6PreflightResourceObservation,
  freeze: Phase10C0VS6ImplementationFreezeDerivation,
): Phase10C0VS6PreflightRefusalCandidate | null {
  const artifactFailure = freeze.artifactFailure;
  const conditionId = phase10C0VS6SelectPreflightFailure(resource, artifactFailure !== null);
  if (conditionId === null) return null;
  const conditions = packet.classificationConditions.filter((entry) =>
    entry.conditionId === conditionId && entry.routeSelecting);
  if (conditions.length !== 1) fail(`${conditionId} does not resolve one route-selecting condition`);
  const condition = conditions[0]!;
  const inlinePath = condition.kind === "available-bytes"
    ? "observed.resources.observedFreeBytes"
    : condition.kind === "process-hours"
      ? "observed.resources.projectedPackageProcessHoursAfterAttempt"
      : condition.kind === "retained-bytes"
        ? "observed.resources.projectedPackageBytesAfterAttempt"
        : "refusalCandidate.failedArtifact.filesystemObservation";
  const observedValue = condition.kind === "available-bytes"
    ? resource.observedFreeBytes
    : condition.kind === "process-hours"
      ? resource.projectedPackageElapsedNanosecondsAfterAttempt / 3_600_000_000_000
      : condition.kind === "retained-bytes"
        ? resource.projectedPackageBytesAfterAttempt
        : "filesystem-object-policy-failure";
  const evidence: readonly Phase10C0VS6PreflightClassificationEvidence[] = artifactFailure === null
    ? Object.freeze([
      Object.freeze({
        evidenceId: `evidence-${conditionId}-inline`,
        evidenceRole: "classification-input" as const,
        retentionClass: "inline-observation" as const,
        artifact: null,
        inlineObservationPath: inlinePath,
      }),
      Object.freeze({
        evidenceId: "evidence-packet-protocol",
        evidenceRole: "packet-protocol" as const,
        retentionClass: "tracked-authority" as const,
        artifact: packetProtocolIdentity,
        inlineObservationPath: null,
      }),
    ])
    : Object.freeze([
      Object.freeze({
        evidenceId: `evidence-${conditionId}-filesystem-inline`,
        evidenceRole: "classification-input" as const,
        retentionClass: "inline-observation" as const,
        artifact: null,
        inlineObservationPath: inlinePath,
      }),
      Object.freeze({
        evidenceId: "evidence-packet-protocol",
        evidenceRole: "packet-protocol" as const,
        retentionClass: "tracked-authority" as const,
        artifact: packetProtocolIdentity,
        inlineObservationPath: null,
      }),
      Object.freeze({
        evidenceId: `evidence-${artifactFailure.artifactRole}-authority`,
        evidenceRole: artifactFailure.artifactRole,
        retentionClass: "tracked-authority" as const,
        artifact: artifactFailure.expected,
        inlineObservationPath: null,
      }),
    ].sort((left, right) => codePointCompare(left.evidenceId, right.evidenceId)));
  const kind = artifactFailure === null
    ? condition.kind as "available-bytes" | "retained-bytes" | "process-hours"
    : "artifact-filesystem-policy" as const;
  const comparator = condition.comparator as "not-equal" | "less-than" | "greater-than";
  const unit = condition.unit as "bytes" | "hours" | "classification" | null;
  return Object.freeze({
    dispositionCode: artifactFailure === null
      ? "prelaunch-resource-refusal"
      : "preproduction-artifact-refusal",
    observation: Object.freeze({
      conditionId,
      kind,
      comparator,
      registeredValue: condition.registeredValue,
      observedValue,
      unit,
      routeConditionMatched: true,
      preconditionPassed: false,
      evidenceIds: Object.freeze(evidence.map((entry) => entry.evidenceId)),
    }),
    failedArtifact: artifactFailure,
    evidence,
    solverLaunched: false,
    verdict: "refusal",
  });
}

function exactVerificationPath(packet: Phase10C0VS6PacketProtocol): string {
  const paths = packet.paths.allowedPublicationPaths.filter((path) =>
    basename(path) === packet.verification.filename);
  if (paths.length !== 1) fail("packet does not expose one exact verification path");
  return paths[0]!;
}

/**
 * Derives a canonical preflight receipt solely from facts reopened while both registered locks
 * are live. The caller supplies no accounting totals, dependency paths, free-space value, route,
 * refusal condition, or attempt directory.
 */
export function phase10C0VS6ObservePreflight(
  input: Phase10C0VS6ObservePreflightInput,
): Phase10C0VS6ObservedPreflight {
  const root = assertRoot(input.root);
  const { packet, catalogue, packetProtocolBytes, packetProtocolIdentity } = input.authority;
  phase10C0VS6AssertActiveLockedPacketWatchdog(
    root,
    input.locks,
    input.authority,
    input.watchdog,
    "run",
  );
  const observedRuntime = phase10C0VS6ResolveRuntimeLabel(runtimeVersion);
  if (observedRuntime !== packet.resources.requiredRuntime ||
    phase10C0VS6PhysicalRepositoryRoot(cwd()).path !== root.path) {
    fail("live runtime or working directory differs from registered launch authority");
  }
  for (const path of [
    packet.paths.attemptRoot,
    ...packet.paths.allowedPublicationPaths,
    ...packet.paths.publicationStagingPaths.map((entry) => entry.stagingPath),
  ]) {
    if (physicalObjectExists(root, path, `${packet.packetId} fresh preflight path`)) {
      fail(`current registered attempt already has materialized state at ${path}`);
    }
  }
  const livePacket = requireExpectedIdentity(root, packetProtocolIdentity, "locked packet protocol");
  if (!sameBytes(livePacket.bytes, packetProtocolBytes)) fail("locked packet protocol bytes changed");
  const liveCatalogue = requireExpectedIdentity(
    root,
    packet.bindings.packetCatalogue,
    "live locked packet catalogue",
  );
  if (!sameBytes(liveCatalogue.bytes, input.authority.catalogueBytes)) {
    fail("locked packet catalogue bytes changed after authority load");
  }
  const liveCatalogueIdentity = liveCatalogue.identity;
  phase10C0VS6SameIdentity(liveCatalogueIdentity, packet.bindings.packetCatalogue, "locked catalogue bytes");
  const freeze = derivePhase10C0VS6ImplementationFreeze({
    repositoryRoot: root.path,
    packetProtocolIdentity,
    packetProtocolBytes,
    preflightBytes: new Uint8Array(),
  });
  const manifest = phase10C0VS6HeadBoundManifestEntries(root.path, freeze.launchHead);
  const manifestIdentity = readIdentity(root, EVIDENCE_MANIFEST_PATH).identity;
  const matrixLive = requireExpectedIdentity(root, packet.bindings.matrix, "live S6 matrix");
  const matrix = parsePhase10C0VS6Matrix(
    parsePhase10C0VS6PrettyJsonBytes(matrixLive.bytes, "live S6 matrix"),
  );
  const currentIndex = catalogue.packets.findIndex((entry) => entry.packetId === packet.packetId);
  if (currentIndex < 0) fail("current packet is absent from catalogue");
  const priorPackets = Object.freeze(catalogue.packets.slice(0, currentIndex).map((entry) =>
    observePriorPacket(root, catalogue, matrix, entry.packetId, manifest)));
  if (!supportedDeepPriorPrefix(priorPackets.map((entry) => entry.packetId))) {
    fail("catalogue prior prefix has no complete deep published-packet projector");
  }
  for (const entry of catalogue.packets.slice(currentIndex + 1)) {
    assertUnmaterializedPacket(root, readCurrentProtocol(root, catalogue, entry.packetId).packet);
  }
  const packageStorageBaselineArtifacts = baselineArtifacts(root, packet, freeze);
  assertPackageRetainedRootCensus(
    root,
    catalogue,
    packet,
    manifest,
    packageStorageBaselineArtifacts,
    priorPackets,
  );
  const packageRetainedArtifactsBeforeAttempt = Object.freeze([
    ...packageStorageBaselineArtifacts,
    ...priorPackets.flatMap((entry) => entry.retainedArtifacts),
  ].sort((left, right) => codePointCompare(left.path, right.path)));
  const allRetainedPaths = packageRetainedArtifactsBeforeAttempt.map((entry) => entry.path);
  if (new Set(allRetainedPaths).size !== allRetainedPaths.length) {
    fail("baseline and accepted prior packet histories repeat a physical retained path");
  }
  const packageElapsedNanosecondsBeforeAttempt = safeIntegerSum(
    [
      PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_CARRY_FORWARD_ELAPSED_NANOSECONDS,
      ...priorPackets.map((entry) => entry.governedElapsedNanoseconds),
    ],
    "prior packet governed elapsed nanoseconds",
  );
  const packageRetainedBytesBeforeAttempt = safeIntegerSum(
    packageRetainedArtifactsBeforeAttempt.map((entry) => entry.byteLength),
    "package retained bytes before attempt",
  );
  const resourceObservation = phase10C0VS6ClassifyPreflightResources(packet, {
    packageElapsedNanosecondsBeforeAttempt,
    packageRetainedBytesBeforeAttempt,
    observedFreeBytes: observedFreeBytes(root),
  });
  const selections = dependencySelections(packet, priorPackets);
  const dependencies = dependencyIdentities(root, packet, selections, manifest);
  const candidate = refusalCandidate(packet, packetProtocolIdentity, resourceObservation, freeze);
  const registryLive = requireExpectedIdentity(root, packet.bindings.callableRegistry, "live callable registry");
  const registry = parsePhase10C0VS6CallableRegistry(
    parsePhase10C0VS6PrettyJsonBytes(registryLive.bytes, "live callable registry"),
  );
  if (registry.packetId !== packet.packetId || registry.protocolId !== packet.protocolId ||
    registry.registryId !== packet.registryId || registry.callables.some((entry) => entry.resolution !== "resolved")) {
    fail("live callable registry is unresolved or differs from packet scope");
  }
  const callableIds = Object.freeze(registry.callables.map((entry) => entry.callableId).sort(codePointCompare));
  const refusalSubroute = candidate === null ? null : packet.terminalSubroutes.filter((entry) =>
    entry.dispositionCode === candidate.dispositionCode);
  if (candidate !== null && refusalSubroute!.length !== 1) {
    fail("preflight refusal does not resolve one packet subroute");
  }
  const subroute = refusalSubroute?.[0] ?? null;
  const commandRows = packet.commandTemplates.filter((entry) =>
    entry.commandId === packet.preflightObservedContract.commandTemplateId);
  if (commandRows.length !== 1) fail("packet does not register one run command");
  const attemptDirectory = `${packet.paths.attemptRoot}/${packet.registeredAttemptId}`;
  const candidateDirectory = `${attemptDirectory}/candidate`;
  const projectedElapsed = resourceObservation.projectedPackageElapsedNanosecondsAfterAttempt;
  const resources = Object.freeze({
    requiredRuntime: packet.resources.requiredRuntime,
    processConcurrency: packet.resources.processConcurrency,
    solverProcessConcurrency: packet.resources.solverProcessConcurrency,
    solverWorkerTimeoutSeconds: packet.resources.solverWorkerTimeoutSeconds,
    perExecutableControlInvocationWallHoursMaximum: packet.resources.perExecutableControlInvocationWallHoursMaximum,
    outerInfrastructureOrchestrationAllowanceSeconds: packet.resources.outerInfrastructureOrchestrationAllowanceSeconds,
    outerInfrastructureSafetyTimeoutSeconds: packet.resources.outerInfrastructureSafetyTimeoutSeconds,
    outerInfrastructureTimingRule: packet.resources.outerInfrastructureTimingRule,
    packageElapsedNanosecondsMaximum: packet.resources.packageElapsedNanosecondsMaximum,
    packageProcessHoursMaximum: packet.resources.packageProcessHoursMaximum,
    currentPacketRegisteredElapsedNanosecondsMaximum: packet.resources.currentPacketRegisteredElapsedNanosecondsMaximum,
    currentPacketRegisteredProcessHoursMaximum: packet.resources.currentPacketRegisteredProcessHoursMaximum,
    attemptRootWritePolicy: packet.resources.attemptRootWritePolicy,
    transientCopyAccounting: packet.resources.transientCopyAccounting,
    filesystemObjectPolicy: packet.resources.filesystemObjectPolicy,
    publicationTransitionPolicy: packet.resources.publicationTransitionPolicy,
    lockLifetimePolicy: packet.resources.lockLifetimePolicy,
    lockAcquisitionPolicy: packet.resources.lockAcquisitionPolicy,
    packageStorageAccountingRule: packet.resources.packageStorageAccountingRule,
    packageStorageBaselineArtifacts: packet.resources.packageStorageBaselineArtifacts,
    packageStorageBaselineBytes: packet.resources.packageStorageBaselineBytes,
    retainedStorageBytesMaximum: packet.resources.retainedStorageBytesMaximum,
    projectedScratchBytes: packet.resources.projectedScratchBytes,
    projectedPublicationBytes: packet.resources.projectedPublicationBytes,
    publicationFinalizationProjections: packet.resources.publicationFinalizationProjections,
    minimumFreeBytes: packet.resources.minimumFreeBytes,
    packageElapsedNanosecondsBeforeAttempt,
    projectedPackageElapsedNanosecondsAfterAttempt: projectedElapsed,
    packageProcessHoursBeforeAttempt: packageElapsedNanosecondsBeforeAttempt / 3_600_000_000_000,
    projectedPackageProcessHoursAfterAttempt: projectedElapsed / 3_600_000_000_000,
    packageRetainedBytesBeforeAttempt,
    projectedPackageBytesAfterAttempt: resourceObservation.projectedPackageBytesAfterAttempt,
    observedFreeBytes: resourceObservation.observedFreeBytes,
    automaticRetry: false,
    automaticRefinementOrFanOut: false,
    nasOrNetworkAccess: false,
  });
  const receiptValue = {
    schema: "phase10-c0v-s6-preflight-receipt-v2",
    receiptId: `phase10-${packet.packetId}-${packet.registeredAttemptId}-preflight-v2`,
    matrixId: packet.matrixId,
    protocolId: packet.protocolId,
    registryId: packet.registryId,
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    stage: "run",
    observed: {
      launchClass: packet.preflightObservedContract.launchClass,
      executionMode: packet.executionMode,
      selectedRouteId: packet.selectedRouteId,
      branch: freeze.launchBranch,
      head: freeze.launchHead,
      runtime: observedRuntime,
      command: commandRows[0]!.command,
      cwd: ".",
      repositoryBundleRoot: ".",
      compositeMatrix: matrixLive.identity,
      packetCatalogue: liveCatalogueIdentity,
      successorSchemaRegistry: requireExpectedIdentity(
        root,
        packet.bindings.successorSchemaRegistry,
        "live successor schema registry",
      ).identity,
      evidenceManifest: manifestIdentity,
      scienceProtocol: freeze.artifactFailure?.artifactRole === "science-protocol"
        ? freeze.artifactFailure.observed
        : packet.bindings.scienceProtocol,
      referenceOrRefusal: freeze.artifactFailure?.artifactRole === "reference-or-refusal"
        ? freeze.artifactFailure.observed
        : packet.bindings.referenceOrRefusal,
      packetProtocol: packetProtocolIdentity,
      callableRegistry: registryLive.identity,
      codeFreeze: {
        commit: freeze.implementationFreezeCommit,
        artifacts: freeze.artifacts,
      },
      registeredAttemptRoot: packet.paths.attemptRoot,
      attemptDirectory,
      candidateDirectory,
      stdoutPath: `${attemptDirectory}/stdout.log`,
      stderrPath: `${attemptDirectory}/stderr.log`,
      exitStatusPath: `${attemptDirectory}/exit-status.json`,
      packageLockPath: packet.paths.packageLockPath,
      lockPath: packet.paths.lockPath,
      finalPreflightReceiptPath: packet.paths.preflightReceiptPath,
      finalTerminalReceiptPath: packet.paths.terminalReceiptPath,
      verificationPaths: [exactVerificationPath(packet)],
      dependencyPacketIds: packet.boundDependencyPacketIds,
      dependencyArtifacts: dependencies,
      resources,
      ancestry: {
        repositoryClean: true,
        headMatchesLaunch: true,
        requiredCommitsAreAncestors: true,
        boundArtifactsMatch: true,
        codeFreezeMatches: true,
        verdict: "pass",
        errors: [],
      },
    },
    outputIds: subroute?.requiredOutputIds ?? packet.registeredOutputIds,
    checkIds: subroute?.requiredCheckIds ?? packet.registeredCheckIds,
    negativeControlIds: subroute?.requiredNegativeControlIds ?? packet.registeredNegativeControlIds,
    callableIds,
    selectedBranches: {
      selectedRouteId: packet.selectedRouteId,
      s5ArtifactDisposition: packet.s5ArtifactDisposition,
    },
    refusalCandidate: candidate,
    verdict: candidate === null ? "pass" : "refusal",
    reasons: candidate === null ? [] : [candidate.observation.conditionId],
  };
  const bytes = writePhase10C0VS6PreflightReceipt(receiptValue, packet, packetProtocolIdentity);
  const receipt = parsePhase10C0VS6RetainedPreflight(
    phase10C0VS6ParsePrettyJson(bytes, `${packet.packetId} observed preflight bytes`),
    packet,
    packetProtocolIdentity,
  );
  const preflightTargetIdentity = phase10C0VS6ArtifactIdentity(packet.paths.preflightReceiptPath, bytes);
  const preliminary = Object.freeze({
    receipt,
    bytes,
    packetProtocolIdentity,
    packetProtocolBytes: new Uint8Array(packetProtocolBytes),
    preflightTargetIdentity,
    dependencyDispositionSelections: selections,
    priorPackets,
    packageStorageBaselineArtifacts,
    packageRetainedArtifactsBeforeAttempt,
    resourceObservation,
    freeze,
  });
  // The earlier scan is only an acyclic input projection for receipt construction. It grants no
  // dependency or byte-category credit: the historical deep projector below independently
  // reopens semantics and enforces stdout/stderr/other-attempt-root limits before this function
  // can return and before the writer can install any current preflight bytes.
  const deeplyVerifiedPriorPacketIds = assertSupportedDeepPriorProjection(input, preliminary);
  phase10C0VS6AssertActiveLockedPacketWatchdog(
    root,
    input.locks,
    input.authority,
    input.watchdog,
    "run",
  );
  return Object.freeze({ ...preliminary, deeplyVerifiedPriorPacketIds });
}

/** Derives, validates, and then crash-safely publishes the registered preflight as the last step. */
export function phase10C0VS6WriteObservedPreflight(
  input: Phase10C0VS6ObservePreflightInput,
): Phase10C0VS6WrittenPreflight {
  const observed = phase10C0VS6ObservePreflight(input);
  const mappings = input.authority.packet.paths.publicationStagingPaths.filter((entry) =>
    entry.finalPath === observed.preflightTargetIdentity.path);
  if (mappings.length !== 1) fail("preflight target does not resolve one registered sibling stage");
  phase10C0VS6AssertActiveLockedPacketWatchdog(
    input.root,
    input.locks,
    input.authority,
    input.watchdog,
    "run",
  );
  const publication = phase10C0VS6PublishCrashSafeExclusive(
    input.root,
    observed.preflightTargetIdentity.path,
    mappings[0]!.stagingPath,
    observed.bytes,
  );
  phase10C0VS6SameIdentity(publication.identity, observed.preflightTargetIdentity, "published preflight bytes");
  phase10C0VS6AssertActiveLockedPacketWatchdog(
    input.root,
    input.locks,
    input.authority,
    input.watchdog,
    "run",
  );
  return Object.freeze({ ...observed, publication });
}
