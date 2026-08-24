import { existsSync, lstatSync, readdirSync, realpathSync } from "node:fs";
import { basename, isAbsolute, relative, resolve, sep } from "node:path";
import { canonicalJsonSha256, strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  PHASE10_C0V_S6_PACKET_IDS,
  parsePhase10C0VS6CallableRegistry,
  parsePhase10C0VS6Matrix,
  parsePhase10C0VS6PacketCatalogue,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  parsePhase10C0VS6RetainedPreflight,
  validatePhase10C0VS6RetainedPreflightDependencies,
  type Phase10C0VS6CallableRegistry,
  type Phase10C0VS6DependencyDispositionSelection,
  type Phase10C0VS6ObligationMatrix,
  type Phase10C0VS6PacketCatalogue,
  type Phase10C0VS6PacketId,
  type Phase10C0VS6PacketProtocol,
  type Phase10C0VS6RetainedPreflight,
} from "./phase10-c0v-s6-contracts.ts";
import {
  parsePhase10C0VS6ArtifactIdentity,
  parsePhase10C0VS6AttemptLedgerV2,
  parsePhase10C0VS6AttemptRowV2,
  parsePhase10C0VS6WorkerProgress,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6PrettyJsonBytes,
  phase10C0VS6SameIdentity,
  phase10C0VS6SameJson,
  phase10C0VS6ValidateRegisteredExecutionRecordTuple,
  phase10C0VS6ValidateRegisteredExecutableInvocationRoster,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6AttemptRowV2,
  type Phase10C0VS6ClassificationValidation,
  type Phase10C0VS6PartialExecution,
  type Phase10C0VS6ResourceRecord,
  type Phase10C0VS6WorkerProgress,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6AssertActiveLockedPacketAuthority,
  phase10C0VS6AssertActiveLockedPacketWatchdog,
  phase10C0VS6AssertExactPhysicalRootCensus,
  phase10C0VS6CensusUniquePhysicalDirectory,
  phase10C0VS6PhysicalRepositoryRoot,
  phase10C0VS6PublishCrashSafeExclusive,
  phase10C0VS6ReadUniquePhysicalFile,
  phase10C0VS6WriteExclusiveOrExact,
  type Phase10C0VS6PhysicalRoot,
  type Phase10C0VS6LockedPacketAuthority,
  type Phase10C0VS6PackageAndPacketLockContext,
} from "./phase10-c0v-s6-filesystem.ts";
import {
  phase10C0VS6AttemptCensusCheckCaller,
  type Phase10C0VS6AttemptCensusCheckCallerResult,
} from "./phase10-c0v-s6-attempt-census.ts";
import {
  phase10C0VS6ResourceBoundaryCheckCaller,
  type Phase10C0VS6ResourceBoundaryCheckCallerResult,
} from "./phase10-c0v-s6-resource.ts";
import {
  independentlyMaterializePhase10C0VS6TerminalCandidate,
  independentlyReopenPhase10C0VS6HistoricalTerminalCandidate,
  independentlyReopenPhase10C0VS6TerminalCandidate,
  type Phase10C0VS6RawTerminalCandidateProjection,
} from "./phase10-c0v-s6-lifecycle.ts";
import {
  parsePhase10C0VS6ApNegativeControlReceiptBytes,
} from "./phase10-c0v-s6-ap-independent.ts";
import {
  parsePhase10C0VAggregateArtifactIndexBytes,
  parsePhase10C0VAggregateResultBytes,
  parsePhase10C0VAnyLayerNonpassControlReceiptBytes,
  parsePhase10C0VResourceLedgerBytes,
  parsePhase10C0VTerminalTableBytes,
} from "./phase10-c0v-s6-aggregate-contracts.ts";
import {
  parsePhase10C0VS6ContextualVerificationExecution,
  parsePhase10C0VS6PacketVerificationV2Bytes,
  phase10C0VS6VerificationExecutionIsNull,
  parsePhase10C0VS6TerminalReceiptV2Bytes,
  writePhase10C0VS6ApVerificationReceipt,
  writePhase10C0VMovingPublishVerificationReceipt,
  writePhase10C0VRadialPublishVerificationReceipt,
  writePhase10C0VStaticPublishVerificationReceipt,
  writePhase10C0VAggregateVerificationReceipt,
  writePhase10C0VS6PacketVerificationReceipt,
  writePhase10C0VS6TerminalReceipt,
  type Phase10C0VS6CallerInvocationResult,
  type Phase10C0VS6EvaluatorExecutionProvenance,
  type Phase10C0VS6NegativeControlResult,
  type Phase10C0VS6PacketCheckResult,
  type Phase10C0VS6PacketGovernedTiming,
  type Phase10C0VS6PacketResourceAccounting,
  type Phase10C0VS6PacketVerificationV2,
  type Phase10C0VS6PacketVerificationV2Authority,
  type Phase10C0VS6PackageProcessAccounting,
  type Phase10C0VS6PackageResourceAccounting,
  type Phase10C0VS6TerminalReceiptV2,
  type Phase10C0VS6TerminalReceiptAuthority,
  type Phase10C0VS6VerifiedArtifact,
} from "./phase10-c0v-s6-receipts.ts";
import {
  writePhase10C0VRadialAttemptReceipt,
  writePhase10C0VMovingAttemptReceipt,
  writePhase10C0VStaticAttemptReceipt,
} from "./phase10-c0v-s6-attempt.ts";
import {
  independentlyEvaluatePhase10C0VS6WorkerInvocations,
  type Phase10C0VS6WorkerInvocationEvaluation,
} from "./phase10-c0v-s6-worker-invocation.ts";
import {
  independentlyEvaluatePhase10C0VS6WorkerProgress,
} from "./phase10-c0v-s6-worker-progress.ts";
import {
  derivePhase10C0VS6RetainedRuntimeAuthority,
  type Phase10C0VS6RawRuntimeAuthorityInput,
} from "./phase10-c0v-s6-runtime-authority.ts";
import {
  phase10C0VS6ReopenPublishedDependencies,
  phase10C0VS6ReopenHistoricalPublishedDependenciesFromRetainedAuthority,
  phase10C0VS6ReopenPublishedDependenciesFromRetainedAuthority,
  phase10C0VS6HistoricalHeadManifest,
  phase10C0VS6ValidateHeadBoundPreflightManifest,
  type Phase10C0VS6ReopenedDependencyArtifact,
  type Phase10C0VS6ReopenedDependencySet,
} from "./phase10-c0v-s6-dependencies.ts";
import { phase10C0VS6AssertCallableRegistration } from "./phase10-c0v-s6-import-audit.ts";
import type { Phase10C0VS6ParentWatchdogContext } from "./phase10-c0v-s6-watchdog.ts";
import {
  independentlyEvaluatePhase10C0VMovingPublicationSemantic,
  independentlyEvaluatePhase10C0VRadialPublicationSemantic,
  independentlyEvaluatePhase10C0VStaticPublicationSemantic,
  type Phase10C0VPublicationSemanticEvaluation,
} from "./phase10-c0v-s6-publication-semantic.ts";

export type Phase10C0VS6DeeplyVerifiedPacketId =
  | "a-p-c0v-s6"
  | "c0v-moving-produce"
  | "c0v-moving-publish"
  | "c0v-radial-produce"
  | "c0v-radial-publish"
  | "c0v-static-produce"
  | "c0v-static-publish";

const PACKAGE_PUBLICATION_ROOTS = Object.freeze([
  "evidence/phase10-numerical-verification-v1",
  "evidence/phase10-obligation-preflight-v2",
  "evidence/phase10-obligation-preflight-v3",
] as const);
const PACKAGE_BASELINE_ATTEMPT_ROOT = "out/phase10-c0v-reference-v1" as const;
const PACKAGE_ATTEMPT_ROOT = "out/phase10-execution-v2/recovery-v2/attempts" as const;

export interface Phase10C0VS6ReopenedPublishedArtifact {
  readonly artifactRole:
    | "packet-protocol" | "attempt-root" | "published-output" | "packet-verification" |
    "terminal-receipt";
  readonly outputId: string | null;
  readonly identity: Phase10C0VS6ArtifactIdentity;
  readonly bytes: Uint8Array;
}

export interface Phase10C0VS6VerifiedPublishedPacket {
  readonly packet: Phase10C0VS6PacketProtocol;
  readonly preflight: Phase10C0VS6RetainedPreflight;
  readonly selectedSubrouteId: string;
  readonly dispositionCode: Phase10C0VS6TerminalReceiptV2["dispositionCode"];
  readonly terminalCandidate: Phase10C0VS6RawTerminalCandidateProjection;
  readonly selectedAttempt: Phase10C0VS6AttemptRowV2 | null;
  readonly attemptLedgerIdentity: Phase10C0VS6ArtifactIdentity | null;
  readonly attemptLedgerBytes: Uint8Array | null;
  readonly verification: Phase10C0VS6PacketVerificationV2;
  readonly verificationIdentity: Phase10C0VS6ArtifactIdentity;
  readonly verificationBytes: Uint8Array;
  readonly terminalReceipt: Phase10C0VS6TerminalReceiptV2;
  readonly terminalReceiptIdentity: Phase10C0VS6ArtifactIdentity;
  readonly terminalReceiptBytes: Uint8Array;
  readonly governedElapsedNanoseconds: number;
  readonly finalizedPacketRetainedBytes: number;
  readonly retainedPhysicalPaths: readonly string[];
  readonly reopenedArtifacts: readonly Phase10C0VS6ReopenedPublishedArtifact[];
}

export interface Phase10C0VS6VerifiedCoreDependencySet {
  readonly currentPacket: Phase10C0VS6PacketProtocol;
  readonly currentPreflight: Phase10C0VS6RetainedPreflight;
  readonly selectedPackets: readonly Phase10C0VS6VerifiedPublishedPacket[];
  readonly byPacketId: ReadonlyMap<Phase10C0VS6DeeplyVerifiedPacketId, Phase10C0VS6VerifiedPublishedPacket>;
}

/**
 * Packet-specific semantic result independently rederived outside this low-level receipt module.
 * The high-level prefix composer supplies it for publication packets so this module never imports
 * their verifier (and therefore never creates a dependency/publication module cycle).
 */
interface Phase10C0VS6PacketSemanticReproof {
  readonly packetId: "c0v-moving-publish" | "c0v-radial-publish" | "c0v-static-publish";
  readonly callerCallableId: string;
  readonly evaluatorCallableId: string;
  readonly evaluatorResult: StrictJson;
  readonly executedCheckIds: readonly string[];
  readonly evaluatedCheckIds: readonly string[];
  readonly executedNegativeControlIds: readonly string[];
  readonly candidatePublishedOutputs: readonly Readonly<{
    readonly outputId: string;
    readonly identity: Phase10C0VS6ArtifactIdentity;
  }>[];
}

export interface Phase10C0VS6HistoricalPacketSemanticReproof
  extends Phase10C0VS6PacketSemanticReproof {
  readonly packetId: "c0v-moving-publish" | "c0v-radial-publish" | "c0v-static-publish";
}

/**
 * Raw canonical authority for dependency verification before the current preflight has been
 * installed at its final path. The packet protocol is still live-reopened; only the current
 * preflight is intentionally supplied as not-yet-published canonical bytes.
 */
export interface Phase10C0VS6ObservedPreflightDependencyInput
  extends Phase10C0VS6RawRuntimeAuthorityInput {}

export interface Phase10C0VS6LockedRawFinalizationInput extends Phase10C0VS6RawRuntimeAuthorityInput {
  /** Exact live objects issued by the active package-and-packet lock callback. */
  readonly locks: Phase10C0VS6PackageAndPacketLockContext;
  readonly lockedAuthority: Phase10C0VS6LockedPacketAuthority;
  /** Exact authenticated parent-owned outer watchdog covering this locked packet action. */
  readonly watchdog: Phase10C0VS6ParentWatchdogContext;
  /** Exact JSON-only result captured from the selected route's governed check-caller; null on refusal/cap. */
  readonly capturedGovernedCallerResult: unknown | null;
}

export interface Phase10C0VS6ApRawFinalizationInput extends Phase10C0VS6LockedRawFinalizationInput {}

export interface Phase10C0VS6MovingRawFinalizationInput extends Phase10C0VS6LockedRawFinalizationInput {}

export interface Phase10C0VS6StaticRawFinalizationInput extends Phase10C0VS6LockedRawFinalizationInput {}

export interface Phase10C0VS6RadialRawFinalizationInput extends Phase10C0VS6LockedRawFinalizationInput {}

export interface Phase10C0VS6MovingPublishRawFinalizationInput
  extends Phase10C0VS6LockedRawFinalizationInput {}

export interface Phase10C0VS6RadialPublishRawFinalizationInput
  extends Phase10C0VS6LockedRawFinalizationInput {}

export interface Phase10C0VS6StaticPublishRawFinalizationInput
  extends Phase10C0VS6LockedRawFinalizationInput {}

export interface Phase10C0VS6AggregateRawFinalizationInput
  extends Phase10C0VS6LockedRawFinalizationInput {}

export interface Phase10C0VS6FinalizedApPacket {
  readonly terminalCandidate: Phase10C0VS6RawTerminalCandidateProjection;
  readonly publishedArtifacts: readonly Phase10C0VS6ReopenedPublishedArtifact[];
  readonly verification: Phase10C0VS6PacketVerificationV2 | null;
  readonly verificationIdentity: Phase10C0VS6ArtifactIdentity | null;
  readonly verificationBytes: Uint8Array | null;
  readonly terminalReceipt: Phase10C0VS6TerminalReceiptV2;
  readonly terminalReceiptIdentity: Phase10C0VS6ArtifactIdentity;
  readonly terminalReceiptBytes: Uint8Array;
}

export interface Phase10C0VS6FinalizedMovingProducePacket {
  readonly terminalCandidate: Phase10C0VS6RawTerminalCandidateProjection;
  readonly attempt: Phase10C0VS6AttemptRowV2;
  readonly attemptLedgerIdentity: Phase10C0VS6ArtifactIdentity;
  readonly attemptLedgerBytes: Uint8Array;
  readonly verification: Phase10C0VS6PacketVerificationV2 | null;
  readonly verificationIdentity: Phase10C0VS6ArtifactIdentity | null;
  readonly verificationBytes: Uint8Array | null;
  readonly terminalReceipt: Phase10C0VS6TerminalReceiptV2;
  readonly terminalReceiptIdentity: Phase10C0VS6ArtifactIdentity;
  readonly terminalReceiptBytes: Uint8Array;
}

export interface Phase10C0VS6FinalizedStaticProducePacket
  extends Phase10C0VS6FinalizedMovingProducePacket {}

export interface Phase10C0VS6FinalizedRadialProducePacket {
  readonly terminalCandidate: Phase10C0VS6RawTerminalCandidateProjection;
  readonly attempt: Phase10C0VS6AttemptRowV2;
  readonly attemptLedgerIdentity: Phase10C0VS6ArtifactIdentity;
  readonly attemptLedgerBytes: Uint8Array;
  readonly publishedArtifacts: readonly Phase10C0VS6ReopenedPublishedArtifact[];
  readonly verification: Phase10C0VS6PacketVerificationV2;
  readonly verificationIdentity: Phase10C0VS6ArtifactIdentity;
  readonly verificationBytes: Uint8Array;
  readonly terminalReceipt: Phase10C0VS6TerminalReceiptV2;
  readonly terminalReceiptIdentity: Phase10C0VS6ArtifactIdentity;
  readonly terminalReceiptBytes: Uint8Array;
}

export interface Phase10C0VS6FinalizedMovingPublishPacket {
  readonly terminalCandidate: Phase10C0VS6RawTerminalCandidateProjection;
  readonly publishedArtifacts: readonly Phase10C0VS6ReopenedPublishedArtifact[];
  readonly verification: Phase10C0VS6PacketVerificationV2 | null;
  readonly verificationIdentity: Phase10C0VS6ArtifactIdentity | null;
  readonly verificationBytes: Uint8Array | null;
  readonly terminalReceipt: Phase10C0VS6TerminalReceiptV2;
  readonly terminalReceiptIdentity: Phase10C0VS6ArtifactIdentity;
  readonly terminalReceiptBytes: Uint8Array;
}

export interface Phase10C0VS6FinalizedRadialPublishPacket
  extends Phase10C0VS6FinalizedMovingPublishPacket {}

export interface Phase10C0VS6FinalizedStaticPublishPacket
  extends Phase10C0VS6FinalizedMovingPublishPacket {}

export interface Phase10C0VS6FinalizedAggregatePacket
  extends Phase10C0VS6FinalizedMovingPublishPacket {}

interface ReopenedAuthority {
  readonly root: Phase10C0VS6PhysicalRoot;
  readonly catalogue: Phase10C0VS6PacketCatalogue;
  readonly matrix: Phase10C0VS6ObligationMatrix;
  readonly manifest: ReadonlyMap<string, Phase10C0VS6ArtifactIdentity>;
  readonly dependencyArtifacts: readonly Phase10C0VS6ReopenedDependencyArtifact[];
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 published packet refused: ${message}`);
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

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((entry, index) => entry === right[index]);
}

function object(value: StrictJson, label: string): Readonly<Record<string, StrictJson>> {
  if (value === null || Array.isArray(value) || typeof value !== "object") fail(`${label} must be an object`);
  return value as Readonly<Record<string, StrictJson>>;
}

function safeIntegerSum(values: readonly number[], label: string): number {
  const sum = values.reduce((total, value) => total + value, 0);
  if (!Number.isSafeInteger(sum) || sum < 0) fail(`${label} is not a nonnegative safe-integer sum`);
  return sum;
}

function exactRoster(actual: readonly string[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    fail(`${label} differs from exact authority`);
  }
}

function chronologicalPriorPacketIds(
  catalogue: Phase10C0VS6PacketCatalogue,
  packetId: Phase10C0VS6PacketId,
): readonly Phase10C0VS6PacketId[] {
  const index = catalogue.packets.findIndex((entry) => entry.packetId === packetId);
  if (index < 0) fail(`${packetId} is absent from the packet catalogue`);
  return Object.freeze(catalogue.packets.slice(0, index).map((entry) => entry.packetId));
}

function readArtifact(
  root: Phase10C0VS6PhysicalRoot,
  path: string,
  expected: Phase10C0VS6ArtifactIdentity | null,
  label: string,
): Readonly<{ readonly identity: Phase10C0VS6ArtifactIdentity; readonly bytes: Uint8Array }> {
  const bytes = phase10C0VS6ReadUniquePhysicalFile(root, path);
  const identity = phase10C0VS6ArtifactIdentity(path, bytes);
  if (expected !== null) phase10C0VS6SameIdentity(identity, expected, label);
  return Object.freeze({ identity, bytes });
}

function scanAttemptRoot(
  root: Phase10C0VS6PhysicalRoot,
  attemptDirectory: string,
): readonly Phase10C0VS6ReopenedPublishedArtifact[] {
  const absoluteRoot = resolve(root.path, attemptDirectory);
  const displacement = relative(root.path, absoluteRoot);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
    isAbsolute(displacement)) fail("attempt root escapes the physical repository");
  const rootParts = displacement.split(sep).filter((entry) => entry.length > 0);
  let current = root.path;
  for (const part of rootParts) {
    current = resolve(current, part);
    const stat = lstatSync(current);
    const physical = realpathSync.native(current);
    if (!stat.isDirectory() || stat.isSymbolicLink() ||
      relative(current, physical) !== "" || relative(physical, current) !== "") {
      fail(`${relative(root.path, current).replaceAll("\\", "/")} is an aliased attempt parent`);
    }
  }
  const paths: string[] = [];
  const visit = (directory: string): void => {
    const stat = lstatSync(directory);
    const physical = realpathSync.native(directory);
    const physicalDisplacement = relative(root.path, physical);
    if (!stat.isDirectory() || stat.isSymbolicLink() || relative(directory, physical) !== "" ||
      relative(physical, directory) !== "" || physicalDisplacement === "" ||
      physicalDisplacement === ".." || physicalDisplacement.startsWith(`..${sep}`) ||
      isAbsolute(physicalDisplacement)) {
      fail(`${relative(root.path, directory).replaceAll("\\", "/")} is an aliased attempt directory`);
    }
    for (const entry of readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => codePointCompare(left.name, right.name))) {
      const absolute = resolve(directory, entry.name);
      const path = relative(root.path, absolute).replaceAll("\\", "/");
      if (entry.isSymbolicLink()) fail(`${path} is a forbidden symlink or junction`);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) paths.push(path);
      else fail(`${path} is not a regular file or directory`);
    }
  };
  visit(absoluteRoot);
  return Object.freeze(paths.sort(codePointCompare).map((path) => {
    const reopened = readArtifact(root, path, null, `${path} attempt artifact`);
    return Object.freeze({
      artifactRole: "attempt-root" as const,
      outputId: null,
      identity: reopened.identity,
      bytes: reopened.bytes,
    });
  }));
}

function assertNoPublicationStages(packet: Phase10C0VS6PacketProtocol, root: Phase10C0VS6PhysicalRoot): void {
  for (const transition of packet.paths.publicationStagingPaths) {
    const absolute = resolve(root.path, transition.stagingPath);
    const displacement = relative(root.path, absolute);
    if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
      isAbsolute(displacement)) fail(`${transition.stagingPath} escapes the repository`);
    if (existsSync(absolute)) fail(`${transition.stagingPath} is a stranded publication stage`);
  }
}

function rawInputForPacket(
  authority: ReopenedAuthority,
  packetId: Phase10C0VS6DeeplyVerifiedPacketId,
): Phase10C0VS6RawRuntimeAuthorityInput {
  const catalogueRows = authority.catalogue.packets.filter((entry) => entry.packetId === packetId);
  if (catalogueRows.length !== 1) fail(`${packetId} does not resolve one catalogue row`);
  const catalogueRow = catalogueRows[0]!;
  const protocolArtifact = readArtifact(authority.root, catalogueRow.protocolPath, null, `${packetId} protocol`);
  const packet = parsePhase10C0VS6PacketProtocol(
    parsePhase10C0VS6PrettyJsonBytes(protocolArtifact.bytes, `${packetId} protocol`),
  );
  if (packet.packetId !== packetId || packet.paths.preflightReceiptPath !== catalogueRow.preflightReceiptPath ||
    packet.paths.terminalReceiptPath !== catalogueRow.terminalReceiptPath) {
    fail(`${packetId} live protocol differs from catalogue paths`);
  }
  const preflightArtifact = authority.dependencyArtifacts.filter((entry) =>
    entry.packetId === packetId && entry.schemaId === "phase10-c0v-s6-preflight-receipt-v2");
  if (preflightArtifact.length !== 1) fail(`${packetId} dependency roster lacks one retained preflight`);
  const livePreflight = readArtifact(
    authority.root,
    catalogueRow.preflightReceiptPath,
    preflightArtifact[0]!.identity,
    `${packetId} retained preflight`,
  );
  return Object.freeze({
    repositoryRoot: authority.root.path,
    packetProtocolIdentity: protocolArtifact.identity,
    packetProtocolBytes: protocolArtifact.bytes,
    preflightBytes: livePreflight.bytes,
  });
}

function selectedDependencyArtifact(
  authority: ReopenedAuthority,
  packetId: Phase10C0VS6DeeplyVerifiedPacketId,
  schemaId: string,
  label: string,
): Phase10C0VS6ReopenedDependencyArtifact {
  const rows = authority.dependencyArtifacts.filter((entry) =>
    entry.packetId === packetId && entry.schemaId === schemaId);
  if (rows.length !== 1) fail(`${packetId} dependency roster lacks one ${label}`);
  return rows[0]!;
}

function exactExpectedAttemptPaths(
  packet: Phase10C0VS6PacketProtocol,
  preflight: Phase10C0VS6RetainedPreflight,
  selectedSubrouteId: string,
): readonly string[] {
  const internal = packet.internalArtifactRosters.filter((entry) => entry.rosterId === selectedSubrouteId);
  if (internal.length !== 1) fail(`${selectedSubrouteId} lacks one internal artifact roster`);
  const candidates = packet.candidateFilenameRosters[selectedSubrouteId];
  if (candidates === undefined) fail(`${selectedSubrouteId} lacks a candidate filename roster`);
  return Object.freeze([
    ...internal[0]!.relativePaths.map((path) => `${preflight.observed.attemptDirectory}/${path}`),
    ...candidates.map((path) => `${preflight.observed.candidateDirectory}/${path}`),
  ].sort(codePointCompare));
}

function outputDefinition(
  matrix: Phase10C0VS6ObligationMatrix,
  packetId: Phase10C0VS6PacketId,
  outputId: string,
): Phase10C0VS6ObligationMatrix["outputs"][number] {
  const rows = matrix.outputs.filter((entry) => entry.packetId === packetId && entry.outputId === outputId);
  if (rows.length !== 1 || rows[0]!.artifact.field !== null) {
    fail(`${outputId} does not resolve one whole-file output definition`);
  }
  return rows[0]!;
}

function expectedOutputIdentity(
  authority: ReopenedAuthority,
  packet: Phase10C0VS6PacketProtocol,
  preflightIdentity: Phase10C0VS6ArtifactIdentity,
  outputPath: string,
): Phase10C0VS6ArtifactIdentity {
  const dependency = authority.dependencyArtifacts.filter((entry) => entry.identity.path === outputPath);
  if (dependency.length === 1) return dependency[0]!.identity;
  if (dependency.length > 1) fail(`${outputPath} repeats in the current dependency roster`);
  if (outputPath === preflightIdentity.path) return preflightIdentity;
  for (const binding of [packet.bindings.scienceProtocol, packet.bindings.referenceOrRefusal]) {
    if (binding?.path === outputPath) return binding;
  }
  const pinned = authority.manifest.get(outputPath);
  if (pinned !== undefined) return pinned;
  fail(`${outputPath} has no manifest, dependency, or immutable packet binding`);
}

function deriveVerifiedArtifacts(
  authority: ReopenedAuthority,
  packet: Phase10C0VS6PacketProtocol,
  lifecycle: Phase10C0VS6RawTerminalCandidateProjection,
): readonly Phase10C0VS6VerifiedArtifact[] {
  const subroute = packet.terminalSubroutes.find((entry) =>
    entry.subrouteId === lifecycle.lifecycle.selectedSubrouteId);
  if (subroute === undefined) fail("selected lifecycle subroute disappeared from packet authority");
  const outputIds = subroute.requiredOutputIds.filter((entry) =>
    !entry.endsWith("-verification") && !entry.endsWith("-terminal-receipt"));
  const rows = outputIds.map((outputId): Phase10C0VS6VerifiedArtifact => {
    const definition = outputDefinition(authority.matrix, packet.packetId, outputId);
    const expected = expectedOutputIdentity(
      authority,
      packet,
      lifecycle.lifecycle.preflightIdentity,
      definition.artifact.path,
    );
    const reopened = readArtifact(authority.root, definition.artifact.path, expected, `${outputId} live output`);
    return Object.freeze({ outputId, ...reopened.identity });
  }).sort((left, right) => codePointCompare(left.outputId, right.outputId));
  exactRoster(rows.map((entry) => entry.outputId), outputIds, "verified output ID roster");
  return Object.freeze(rows);
}

function deriveCheckResults(
  matrix: Phase10C0VS6ObligationMatrix,
  packet: Phase10C0VS6PacketProtocol,
  selectedSubrouteId: string,
  callerRows: readonly Phase10C0VS6CallerInvocationResult[],
): readonly Phase10C0VS6PacketCheckResult[] {
  const subroute = packet.terminalSubroutes.find((entry) => entry.subrouteId === selectedSubrouteId);
  if (subroute === undefined) fail(`${selectedSubrouteId} is absent from the packet`);
  return Object.freeze(subroute.requiredCheckIds.map((checkId): Phase10C0VS6PacketCheckResult => {
    const checks = matrix.checks.filter((entry) => entry.packetId === packet.packetId && entry.checkId === checkId);
    const callers = callerRows.filter((entry) => entry.executedCheckIds.includes(checkId) &&
      entry.evaluatedCheckIds.includes(checkId) && entry.terminalState === "complete");
    if (checks.length !== 1 || callers.length !== 1) {
      fail(`${checkId} does not resolve one independently rerun complete caller result`);
    }
    const evaluator = object(callers[0]!.evaluatorResult, `${checkId} evaluator result`);
    let verdict: "pass" | "fail" | "refusal";
    let reasons: readonly string[];
    if (Array.isArray(evaluator.checkResults)) {
      const results = evaluator.checkResults.map((entry, index) =>
        object(entry, `${checkId} evaluator checkResults[${index}]`));
      const matching = results.filter((entry) => entry.checkId === checkId);
      if (matching.length !== 1) fail(`${checkId} is absent or duplicated in evaluator checkResults`);
      const row = matching[0]!;
      if (row.verdict === "pass" || row.verdict === "fail" || row.verdict === "refusal") {
        verdict = row.verdict;
      } else if (row.pass === true || row.pass === false) {
        verdict = row.pass ? "pass" : "fail";
      } else fail(`${checkId} evaluator result has no exact verdict`);
      const rawReasons = Array.isArray(row.reasonCodes) ? row.reasonCodes : row.errors;
      if (!Array.isArray(rawReasons) || rawReasons.some((entry) => typeof entry !== "string")) {
        fail(`${checkId} evaluator reasons are malformed`);
      }
      reasons = Object.freeze((rawReasons as string[]).slice().sort(codePointCompare));
    } else {
      if (evaluator.verdict !== "pass" && evaluator.verdict !== "fail" &&
        evaluator.verdict !== "refusal") fail(`${checkId} evaluator result has no exact verdict`);
      verdict = evaluator.verdict;
      if (!Array.isArray(evaluator.errors) || evaluator.errors.some((entry) => typeof entry !== "string")) {
        fail(`${checkId} evaluator errors are malformed`);
      }
      reasons = Object.freeze((evaluator.errors as string[]).slice().sort(codePointCompare));
    }
    if ((verdict === "pass") !== (reasons.length === 0)) {
      fail(`${checkId} verdict/reasons are incoherent`);
    }
    return Object.freeze({
      checkId,
      verdict,
      reasons,
      witnessOutputIds: Object.freeze([...checks[0]!.dependsOnOutputIds].sort(codePointCompare)),
    });
  }).sort((left, right) => codePointCompare(left.checkId, right.checkId)));
}

function deriveApNegativeControlResults(
  lifecycle: Phase10C0VS6RawTerminalCandidateProjection,
  root: Phase10C0VS6PhysicalRoot,
): readonly Phase10C0VS6NegativeControlResult[] {
  const completion = lifecycle.lifecycle.completionProof;
  if (completion === null) fail("A-P completion proof is absent");
  const rows = completion.negativeControlReceipts.map((identity) => {
    const receipt = parsePhase10C0VS6ApNegativeControlReceiptBytes(
      readArtifact(root, identity.path, identity, `${identity.path} A-P control`).bytes,
      `${identity.path} A-P control`,
    );
    return Object.freeze({
      negativeControlId: receipt.fixtureId === "missing-producer"
        ? "nc-ap-c0v-s6-missing-producer"
        : "nc-ap-c0v-s6-uncalled-check",
      mutationExecuted: true,
      rejected: true,
      beforeWitness: receipt.beforeWitness,
      afterWitness: receipt.afterWitness,
      errors: Object.freeze([]),
    });
  }).sort((left, right) => codePointCompare(left.negativeControlId, right.negativeControlId));
  return Object.freeze(rows);
}

function mutationWitness(
  artifactId: string,
  identity: Phase10C0VS6ArtifactIdentity,
  projection: StrictJson,
): Phase10C0VS6NegativeControlResult["beforeWitness"] {
  return Object.freeze({
    artifactId,
    ...identity,
    semanticFingerprint: Object.freeze({
      projection,
      sha256: canonicalJsonSha256(projection),
    }),
  });
}

function deriveRadialNegativeControlResults(
  lifecycle: Phase10C0VS6RawTerminalCandidateProjection,
): readonly Phase10C0VS6NegativeControlResult[] {
  const reproof = lifecycle.lifecycle.radialReproof;
  if (reproof === null || reproof.verdict !== "pass" ||
    reproof.negativeControlArtifacts.length !== 3 || reproof.mutationReproofs.length !== 3) {
    fail("radial completion lacks its exact independent raw mutation reproof tuple");
  }
  const controls = [
    Object.freeze({
      negativeControlId: "nc-radial-finite-shell-term",
      artifactId: "radial-witness",
      before: reproof.cleanWitness,
      after: reproof.negativeControlArtifacts[0],
      mutation: reproof.mutationReproofs[0],
      mutationKind: "finite-shell-term",
    }),
    Object.freeze({
      negativeControlId: "nc-radial-forged-summary",
      artifactId: "radial-producer-summary",
      before: reproof.cleanProducerSummary,
      after: reproof.negativeControlArtifacts[1],
      mutation: reproof.mutationReproofs[1],
      mutationKind: "forged-summary-disposition-maximum",
    }),
    Object.freeze({
      negativeControlId: "nc-radial-robin-coefficient",
      artifactId: "radial-witness",
      before: reproof.cleanWitness,
      after: reproof.negativeControlArtifacts[2],
      mutation: reproof.mutationReproofs[2],
      mutationKind: "robin-coefficient",
    }),
  ] as const;
  return Object.freeze(controls.map((control, index): Phase10C0VS6NegativeControlResult => {
    if (!control.mutation.pass || control.mutation.reasonCodes.length !== 0 ||
      reproof.negativeControlResults[index]?.negativeControlId !== control.negativeControlId ||
      reproof.negativeControlResults[index]?.mutationExecuted !== true ||
      reproof.negativeControlResults[index]?.pass !== true) {
      fail(`${control.negativeControlId} raw mutation reproof/result differs from exact authority`);
    }
    const beforeProjection = strictJsonSnapshot({
      artifactKind: control.artifactId,
      authority: "clean-retained-capture",
      identity: control.before,
    });
    const afterProjection = strictJsonSnapshot({
      artifactKind: control.artifactId,
      authority: "independently-rejected-mutation",
      mutationKind: control.mutationKind,
      identity: control.after,
      reproof: control.mutation,
    });
    return Object.freeze({
      negativeControlId: control.negativeControlId,
      mutationExecuted: true,
      // Forged-summary intentionally leaves the attacked science evaluation unchanged; it is
      // nevertheless rejected by the separate raw summary mutation proof.  Never derive this
      // generic verification verdict from attackedCheckFailed alone.
      rejected: true,
      beforeWitness: mutationWitness(control.artifactId, control.before, beforeProjection),
      afterWitness: mutationWitness(control.artifactId, control.after, afterProjection),
      errors: Object.freeze([]),
    });
  }));
}

function deriveAggregateNegativeControlResults(
  root: Phase10C0VS6PhysicalRoot,
  preflight: Phase10C0VS6RetainedPreflight,
  evaluatorResult: StrictJson,
): readonly Phase10C0VS6NegativeControlResult[] {
  const evaluation = object(evaluatorResult, "aggregate evaluator result");
  const reproof = object(evaluation.negativeControlReproof!, "aggregate negative-control reproof");
  const receiptIdentity = parsePhase10C0VS6ArtifactIdentity(
    reproof.receipt,
    "aggregate negative-control receipt identity",
  );
  const expectedPath = `${preflight.observed.attemptDirectory}/any-layer-nonpass-control.json`;
  if (receiptIdentity.path !== expectedPath || reproof.negativeControlId !== "nc-c0v-any-layer-nonpass" ||
    reproof.verdict !== "pass") {
    fail("aggregate negative-control reproof scope differs from its retained attempt artifact");
  }
  const receiptBytes = readArtifact(
    root,
    receiptIdentity.path,
    receiptIdentity,
    "aggregate negative-control receipt",
  ).bytes;
  const receipt = parsePhase10C0VAnyLayerNonpassControlReceiptBytes(receiptBytes);
  if (!receipt.result.mutationExecuted || !receipt.result.witnessMoved ||
    !receipt.result.cleanCapturePreserved || !receipt.result.attackedCheckFailed || !receipt.result.pass) {
    fail("aggregate negative-control receipt did not retain its exact passing mutation result");
  }
  phase10C0VS6SameJson(
    strictJsonSnapshot(reproof.result),
    strictJsonSnapshot(receipt.result),
    "aggregate negative-control reproof/result join",
  );
  const beforeProjection = strictJsonSnapshot({
    artifactKind: "c0v-terminal-table",
    authority: "synthetic-clean-capture",
    terminalTable: receipt.cleanTable,
    outcome: receipt.cleanOutcome,
  });
  const afterProjection = strictJsonSnapshot({
    artifactKind: "c0v-terminal-table",
    authority: "independently-rejected-mutation",
    terminalTable: receipt.mutatedTable,
    mutation: receipt.mutation,
    outcome: receipt.attackedOutcome,
  });
  return Object.freeze([Object.freeze({
    negativeControlId: "nc-c0v-any-layer-nonpass",
    mutationExecuted: true,
    rejected: true,
    beforeWitness: mutationWitness("c0v-terminal-table", receiptIdentity, beforeProjection),
    afterWitness: mutationWitness("c0v-terminal-table", receiptIdentity, afterProjection),
    errors: Object.freeze([]),
  })]);
}

function independentlyDeriveApArtifactIndexBytes(
  authority: ReopenedAuthority,
  missingProducerBytes: Uint8Array,
  uncalledCheckBytes: Uint8Array,
): Uint8Array {
  const bindings = object(authority.matrix.bindings, "A-P matrix bindings");
  const sources = new Map<string, Readonly<{ readonly artifactId: string; readonly bytes: Uint8Array }>>();
  const register = (artifactId: string, path: string, suppliedBytes?: Uint8Array): void => {
    if (sources.has(path)) fail(`${path} repeats in the independently derived A-P index sources`);
    const bytes = suppliedBytes ?? readArtifact(authority.root, path, null, `${path} A-P index source`).bytes;
    sources.set(path, Object.freeze({ artifactId, bytes }));
  };
  for (const name of [
    "originalMatrix", "c0vFoundation", "predecessorSchemaRegistry", "predecessorSchemaContracts",
    "successorSchemaRegistry", "successorSchemaContracts",
  ]) {
    const binding = object(bindings[name]!, `A-P matrix bindings.${name}`);
    if (typeof binding.path !== "string") fail(`A-P matrix bindings.${name}.path is not a string`);
    register(`authority-${name}`, binding.path);
  }
  if (!Array.isArray(bindings.originalApEvidence)) fail("A-P original evidence binding is not an array");
  for (const [index, value] of bindings.originalApEvidence.entries()) {
    const binding = object(value, `A-P original evidence[${index}]`);
    if (typeof binding.path !== "string") fail(`A-P original evidence[${index}].path is not a string`);
    register(`authority-original-a-p-${index}`, binding.path);
  }
  register("authority-execution-v2-readme", "research/phase10-execution-v2/README.md");
  register(
    "authority-execution-v2-recovery-v2",
    "research/phase10-execution-v2/recovery-v2/recovery-authority.json",
  );
  register(
    "authority-packet-catalogue",
    "research/phase10-execution-v2/recovery-v2/packet-catalogue.json",
  );
  for (const packet of authority.catalogue.packets) {
    register(`authority-${packet.packetId}-protocol`, packet.protocolPath);
    register(`authority-${packet.packetId}-callable-registry`, packet.callableRegistryPath);
  }
  register(
    "out-ap-c0v-s6-missing-producer",
    "evidence/phase10-obligation-preflight-v3/missing-producer.json",
    missingProducerBytes,
  );
  register(
    "out-ap-c0v-s6-uncalled-check",
    "evidence/phase10-obligation-preflight-v3/uncalled-check.json",
    uncalledCheckBytes,
  );
  const artifacts = [...sources.entries()].map(([path, source]) => Object.freeze({
    artifactId: source.artifactId,
    path,
    mediaType: path.endsWith(".md")
      ? "text/markdown; charset=utf-8" as const
      : "application/json" as const,
    byteLength: source.bytes.byteLength,
    sha256: phase10C0VS6ArtifactIdentity(path, source.bytes).sha256,
    role: "obligation-preflight" as const,
    producedBy: "phase10-a-p-c0v-s6-producer" as const,
  })).sort((left, right) => codePointCompare(left.artifactId, right.artifactId));
  if (new Set(artifacts.map((entry) => entry.artifactId)).size !== artifacts.length) {
    fail("independently derived A-P index repeats an artifact ID");
  }
  return phase10C0VS6PrettyJsonBytes(Object.freeze({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-obligation-preflight-v3",
    artifacts: Object.freeze(artifacts),
  }));
}

function apCandidateOutputMappings(
  lifecycle: Phase10C0VS6RawTerminalCandidateProjection,
): readonly Readonly<{
  readonly outputId: string;
  readonly candidate: Phase10C0VS6ArtifactIdentity;
}>[] {
  const completion = lifecycle.lifecycle.completionProof;
  if (completion === null) fail("A-P candidate lacks its independent completion proof");
  return Object.freeze([
    Object.freeze({
      outputId: "out-ap-c0v-s6-artifact-index",
      candidate: completion.artifactIndex,
    }),
    Object.freeze({
      outputId: "out-ap-c0v-s6-missing-producer",
      candidate: completion.negativeControlReceipts[0],
    }),
    Object.freeze({
      outputId: "out-ap-c0v-s6-uncalled-check",
      candidate: completion.negativeControlReceipts[1],
    }),
  ]);
}

function assertApCandidatePublicationJoin(
  authority: ReopenedAuthority,
  lifecycle: Phase10C0VS6RawTerminalCandidateProjection,
  publicationArtifacts: readonly Phase10C0VS6ReopenedPublishedArtifact[],
): void {
  const mappings = apCandidateOutputMappings(lifecycle);
  const joined = new Map<string, Uint8Array>();
  for (const mapping of mappings) {
    const published = publicationArtifacts.filter((entry) => entry.outputId === mapping.outputId);
    if (published.length !== 1) fail(`${mapping.outputId} lacks one live published A-P copy`);
    const candidate = readArtifact(
      authority.root,
      mapping.candidate.path,
      mapping.candidate,
      `${mapping.outputId} candidate bytes`,
    );
    if (!sameBytes(candidate.bytes, published[0]!.bytes) ||
      published[0]!.identity.byteLength !== mapping.candidate.byteLength ||
      published[0]!.identity.sha256 !== mapping.candidate.sha256) {
      fail(`${mapping.outputId} published bytes differ from the independently proved candidate`);
    }
    joined.set(mapping.outputId, published[0]!.bytes);
  }
  const missingBytes = joined.get("out-ap-c0v-s6-missing-producer")!;
  const uncalledBytes = joined.get("out-ap-c0v-s6-uncalled-check")!;
  const missing = parsePhase10C0VS6ApNegativeControlReceiptBytes(missingBytes, "published missing-producer");
  const uncalled = parsePhase10C0VS6ApNegativeControlReceiptBytes(uncalledBytes, "published uncalled-check");
  if (missing.fixtureId !== "missing-producer" || uncalled.fixtureId !== "uncalled-check") {
    fail("published A-P negative-control roles are swapped");
  }
  const expectedIndexBytes = independentlyDeriveApArtifactIndexBytes(authority, missingBytes, uncalledBytes);
  const publishedIndexBytes = joined.get("out-ap-c0v-s6-artifact-index")!;
  if (!sameBytes(publishedIndexBytes, expectedIndexBytes)) {
    fail("published A-P artifact index differs from independent live source derivation");
  }
}

function assertRadialCandidatePublicationJoin(
  authority: ReopenedAuthority,
  lifecycle: Phase10C0VS6RawTerminalCandidateProjection,
  publicationArtifacts: readonly Phase10C0VS6ReopenedPublishedArtifact[],
): void {
  const reproof = lifecycle.lifecycle.radialReproof;
  if (reproof === null) fail("radial complete publication lacks its pure raw artifact reproof");
  for (const mapping of [
    Object.freeze({ outputId: "out-c0v-radial-evaluation", candidate: reproof.evaluation }),
    Object.freeze({ outputId: "out-c0v-radial-witness", candidate: reproof.cleanWitness }),
  ]) {
    const published = publicationArtifacts.filter((entry) => entry.outputId === mapping.outputId);
    if (published.length !== 1) fail(`${mapping.outputId} lacks one live published radial copy`);
    const candidate = readArtifact(
      authority.root,
      mapping.candidate.path,
      mapping.candidate,
      `${mapping.outputId} radial candidate bytes`,
    );
    if (!sameBytes(candidate.bytes, published[0]!.bytes) ||
      candidate.identity.byteLength !== published[0]!.identity.byteLength ||
      candidate.identity.sha256 !== published[0]!.identity.sha256) {
      fail(`${mapping.outputId} published bytes differ from the independently reproved candidate`);
    }
  }
}

function assertRadialReproofAttemptCensus(
  lifecycle: Phase10C0VS6RawTerminalCandidateProjection,
  scanned: readonly Phase10C0VS6ReopenedPublishedArtifact[],
): void {
  const reproof = lifecycle.lifecycle.radialReproof;
  if (reproof === null) return;
  for (const expected of [
    reproof.evaluation,
    reproof.cleanWitness,
    reproof.cleanProducerSummary,
    ...reproof.negativeControlArtifacts,
  ]) {
    const matches = scanned.filter((entry) => entry.identity.path === expected.path);
    if (matches.length !== 1) fail(`${expected.path} is absent or duplicated in the radial attempt census`);
    phase10C0VS6SameIdentity(matches[0]!.identity, expected, `${expected.path} radial raw reproof census`);
  }
}

function assertSemanticCandidatePublicationJoin(
  authority: ReopenedAuthority,
  lifecycle: Phase10C0VS6RawTerminalCandidateProjection,
  publicationArtifacts: readonly Phase10C0VS6ReopenedPublishedArtifact[],
  reproof: Phase10C0VS6PacketSemanticReproof,
): void {
  if (lifecycle.lifecycle.packet.packetId !== reproof.packetId) {
    fail("packet-specific semantic reproof names another packet");
  }
  const filenames = lifecycle.lifecycle.packet.candidateFilenameRosters[
    lifecycle.lifecycle.selectedSubrouteId
  ];
  if (filenames === undefined) fail("semantic reproof route lacks a candidate filename roster");
  const expectedOutputIds = [...reproof.candidatePublishedOutputs]
    .map((entry) => entry.outputId)
    .sort(codePointCompare);
  if (new Set(expectedOutputIds).size !== expectedOutputIds.length) {
    fail("semantic reproof repeats a candidate output ID");
  }
  for (const mapping of reproof.candidatePublishedOutputs) {
    const definition = outputDefinition(
      authority.matrix,
      lifecycle.lifecycle.packet.packetId,
      mapping.outputId,
    );
    phase10C0VS6SameIdentity(
      mapping.identity,
      Object.freeze({ ...mapping.identity, path: definition.artifact.path }),
      `${mapping.outputId} semantic reproof final path`,
    );
    const filename = basename(definition.artifact.path);
    if (filenames.filter((entry) => entry === filename).length !== 1) {
      fail(`${mapping.outputId} does not resolve one selected candidate filename`);
    }
    const candidatePath = `${lifecycle.lifecycle.preflight.observed.candidateDirectory}/${filename}`;
    const candidate = readArtifact(authority.root, candidatePath, null, `${mapping.outputId} candidate bytes`);
    const relocatedCandidate = Object.freeze({
      path: definition.artifact.path,
      byteLength: candidate.identity.byteLength,
      sha256: candidate.identity.sha256,
    });
    phase10C0VS6SameIdentity(
      relocatedCandidate,
      mapping.identity,
      `${mapping.outputId} independent semantic candidate identity`,
    );
    const published = publicationArtifacts.filter((entry) => entry.outputId === mapping.outputId);
    if (published.length !== 1 || !sameBytes(candidate.bytes, published[0]!.bytes)) {
      fail(`${mapping.outputId} final publication differs from its exact candidate bytes`);
    }
    phase10C0VS6SameIdentity(
      published[0]!.identity,
      mapping.identity,
      `${mapping.outputId} final publication identity`,
    );
  }
  const callerRows = lifecycle.candidate.callerInvocationResults.filter((entry) =>
    entry.callerCallableId === reproof.callerCallableId &&
    entry.evaluatorCallableId === reproof.evaluatorCallableId && entry.terminalState === "complete");
  if (callerRows.length !== 1) {
    fail(`${reproof.evaluatorCallableId} does not resolve one completed governed caller row`);
  }
  phase10C0VS6SameJson(
    callerRows[0]!.evaluatorResult,
    reproof.evaluatorResult,
    `${reproof.evaluatorCallableId} captured result versus independent semantic rerun`,
  );
  exactRoster(callerRows[0]!.executedCheckIds, reproof.executedCheckIds,
    `${reproof.callerCallableId} independently rerun executed checks`);
  exactRoster(callerRows[0]!.evaluatedCheckIds, reproof.evaluatedCheckIds,
    `${reproof.callerCallableId} independently rerun evaluated checks`);
  exactRoster(callerRows[0]!.executedNegativeControlIds, reproof.executedNegativeControlIds,
    `${reproof.callerCallableId} independently rerun executed controls`);
  for (const mapping of reproof.candidatePublishedOutputs) {
    const sources = callerRows[0]!.sourceArtifactIdentities.filter((entry) =>
      entry.artifact.path === mapping.identity.path);
    if (sources.length !== 1) {
      fail(`${mapping.outputId} does not resolve one governed caller source identity`);
    }
    phase10C0VS6SameIdentity(
      sources[0]!.artifact,
      mapping.identity,
      `${mapping.outputId} governed caller source identity`,
    );
  }
}

function postCandidateCallerResults(
  rawInput: Phase10C0VS6RawRuntimeAuthorityInput,
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
  ledgerIdentity: Phase10C0VS6ArtifactIdentity,
  ledgerBytes: Uint8Array,
): readonly Phase10C0VS6CallerInvocationResult[] {
  const packet = candidate.lifecycle.packet;
  const rosters = packet.terminalReceiptContract.callerInvocationResultRosters.filter((entry) =>
    entry.subrouteId === candidate.lifecycle.selectedSubrouteId);
  if (rosters.length !== 1) fail("selected produce subroute lacks one caller-result roster");
  const expectedPost = rosters[0]!.callerInvocationResults.filter((entry) => entry.stage === "post-candidate");
  let census: Phase10C0VS6AttemptCensusCheckCallerResult | null = null;
  let resource: Phase10C0VS6ResourceBoundaryCheckCallerResult | null = null;
  const input = Object.freeze({
    ...rawInput,
    candidateOrFinalLedgerBytes: ledgerBytes,
    projectedTerminalCandidateBytes: candidate.candidateBytes,
  });
  return Object.freeze(expectedPost.map((expected): Phase10C0VS6CallerInvocationResult => {
    let result: Phase10C0VS6AttemptCensusCheckCallerResult | Phase10C0VS6ResourceBoundaryCheckCallerResult;
    if (expected.callerCallableId === "phase10-c0v-s6-attempt-census-check-caller") {
      census ??= phase10C0VS6AttemptCensusCheckCaller(input);
      result = census;
    } else if (expected.callerCallableId === "phase10-c0v-s6-resource-check-caller") {
      resource ??= phase10C0VS6ResourceBoundaryCheckCaller(input);
      result = resource;
    } else fail(`${expected.callerCallableId} is not a registered post-candidate produce caller`);
    exactRoster(result.executedCheckIds, expected.executedCheckIds, `${expected.callerCallableId} checks`);
    exactRoster(result.evaluatedCheckIds, expected.evaluatedCheckIds, `${expected.callerCallableId} evaluations`);
    exactRoster(
      result.executedNegativeControlIds,
      expected.executedNegativeControlIds,
      `${expected.callerCallableId} controls`,
    );
    const sources = expected.sourceArtifactAuthorities.map((source) => {
      let artifact: Phase10C0VS6ArtifactIdentity;
      if (source.sourceKind === "attempt-internal" &&
        source.artifactRelativePath === packet.terminalCandidateContract.successFilename &&
        source.outputId === null) artifact = candidate.candidateIdentity;
      else if (source.sourceKind === "registered-output" && source.artifactRelativePath === null &&
        source.outputId?.endsWith("-preflight")) artifact = candidate.lifecycle.preflightIdentity;
      else if (source.sourceKind === "registered-output" && source.artifactRelativePath === null &&
        source.outputId?.endsWith("-attempt-ledger")) artifact = ledgerIdentity;
      else fail(`${source.artifactRole} has no raw post-candidate source projection`);
      return Object.freeze({ artifactRole: source.artifactRole, artifact });
    });
    return Object.freeze({
      callerInvocationId: expected.callerInvocationId,
      stage: expected.stage,
      callerCallableId: expected.callerCallableId,
      evaluatorCallableId: expected.evaluatorCallableId,
      terminalState: expected.terminalState,
      executedCheckIds: expected.executedCheckIds,
      evaluatedCheckIds: expected.evaluatedCheckIds,
      executedNegativeControlIds: expected.executedNegativeControlIds,
      evaluatorResult: strictJsonSnapshot(result.evaluation),
      sourceArtifactIdentities: Object.freeze(sources),
    });
  }));
}

function deriveExecution(
  rawValue: Readonly<Record<string, StrictJson>>,
  packet: Phase10C0VS6PacketProtocol,
  selectedSubrouteId: string,
  preflight: Phase10C0VS6RetainedPreflight,
  callerRows: readonly Phase10C0VS6CallerInvocationResult[],
  timing: Phase10C0VS6PacketGovernedTiming,
  root: Phase10C0VS6PhysicalRoot,
): Phase10C0VS6EvaluatorExecutionProvenance | null {
  const execution = parsePhase10C0VS6ContextualVerificationExecution(
    rawValue.execution,
    packet,
    selectedSubrouteId,
    `${packet.packetId} verification execution`,
  );
  if (execution === null) return null;
  const registryBytes = phase10C0VS6ReadUniquePhysicalFile(root, packet.bindings.callableRegistry.path);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(packet.bindings.callableRegistry.path, registryBytes),
    packet.bindings.callableRegistry,
    `${packet.packetId} live callable registry`,
  );
  const registry: Phase10C0VS6CallableRegistry = parsePhase10C0VS6CallableRegistry(
    parsePhase10C0VS6PrettyJsonBytes(registryBytes, `${packet.packetId} callable registry`),
  );
  const bindings = registry.callables.filter((entry) => entry.callableId === execution.evaluatorCallableId &&
    entry.role === "independent-evaluator");
  const callerMatches = callerRows.filter((entry) => entry.evaluatorCallableId === execution.evaluatorCallableId &&
    entry.terminalState === "complete");
  if (bindings.length !== 1 || callerMatches.length !== 1) {
    fail(`${execution.evaluatorCallableId} is not the sole complete registered evaluator provenance`);
  }
  const binding = bindings[0]!;
  if (execution.modulePath !== binding.modulePath || execution.exportName !== binding.exportName) {
    fail("verification evaluator module/export differs from callable registry");
  }
  const implementation = readArtifact(root, binding.modulePath, null, "verification evaluator implementation");
  if (execution.byteLength !== implementation.identity.byteLength ||
    execution.sha256 !== implementation.identity.sha256 ||
    (binding.identity !== null && (binding.identity.byteLength !== execution.byteLength ||
      binding.identity.sha256 !== execution.sha256))) {
    fail("verification evaluator identity differs from live/registered implementation bytes");
  }
  phase10C0VS6AssertCallableRegistration(root.path, {
    callableId: binding.callableId,
    modulePath: binding.modulePath,
    exportName: binding.exportName,
    identity: implementation.identity,
  });
  const run = packet.commandTemplates.filter((entry) => entry.commandId === "run");
  if (run.length !== 1 || execution.runtime !== preflight.observed.runtime ||
    execution.command !== run[0]!.command || execution.gitHead !== preflight.observed.head ||
    execution.processConcurrency !== packet.resources.processConcurrency) {
    fail("verification execution runtime/command/HEAD/concurrency differs from retained launch authority");
  }
  const caller = callerMatches[0]!;
  const timed = timing.invocationRecords.filter((entry) =>
    entry.callableId === caller.callerCallableId || entry.callableId === caller.evaluatorCallableId);
  if (timed.length !== 1 || execution.startedOn !== timed[0]!.startedAt ||
    execution.endedOn !== timed[0]!.finishedAt) {
    fail("verification execution interval differs from the parent-owned governed caller interval");
  }
  return execution;
}

function independentlyConstructApExecution(
  packet: Phase10C0VS6PacketProtocol,
  selectedSubrouteId: string,
  preflight: Phase10C0VS6RetainedPreflight,
  callerRows: readonly Phase10C0VS6CallerInvocationResult[],
  timing: Phase10C0VS6PacketGovernedTiming,
  root: Phase10C0VS6PhysicalRoot,
): Phase10C0VS6EvaluatorExecutionProvenance {
  if (packet.packetId !== "a-p-c0v-s6") fail("A-P execution constructor received another packet");
  const callers = callerRows.filter((entry) =>
    entry.callerCallableId === "phase10-a-p-c0v-s6-check-caller" &&
    entry.evaluatorCallableId === "phase10-a-p-c0v-s6-evaluator" &&
    entry.terminalState === "complete");
  if (callers.length !== 1) fail("A-P completion lacks one exact governed caller/evaluator result");
  const registryBytes = phase10C0VS6ReadUniquePhysicalFile(root, packet.bindings.callableRegistry.path);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(packet.bindings.callableRegistry.path, registryBytes),
    packet.bindings.callableRegistry,
    "A-P finalizer callable registry",
  );
  const registry = parsePhase10C0VS6CallableRegistry(
    parsePhase10C0VS6PrettyJsonBytes(registryBytes, "A-P finalizer callable registry"),
  );
  const bindings = registry.callables.filter((entry) =>
    entry.callableId === callers[0]!.evaluatorCallableId && entry.role === "independent-evaluator");
  if (bindings.length !== 1) fail("A-P evaluator does not resolve one exact registry binding");
  const binding = bindings[0]!;
  const implementation = readArtifact(root, binding.modulePath, null, "A-P evaluator implementation");
  if (binding.identity !== null && (binding.identity.byteLength !== implementation.identity.byteLength ||
    binding.identity.sha256 !== implementation.identity.sha256)) {
    fail("A-P registered evaluator identity differs from live implementation bytes");
  }
  phase10C0VS6AssertCallableRegistration(root.path, {
    callableId: binding.callableId,
    modulePath: binding.modulePath,
    exportName: binding.exportName,
    identity: implementation.identity,
  });
  const timed = timing.invocationRecords.filter((entry) =>
    entry.callableId === callers[0]!.callerCallableId || entry.callableId === callers[0]!.evaluatorCallableId);
  if (timed.length !== 1) fail("A-P governed caller does not resolve one parent-owned timing interval");
  const run = packet.commandTemplates.filter((entry) => entry.commandId === "run");
  if (run.length !== 1) fail("A-P packet lacks one exact run command");
  const value = Object.freeze({
    evaluatorCallableId: binding.callableId,
    modulePath: binding.modulePath,
    exportName: binding.exportName,
    byteLength: implementation.identity.byteLength,
    sha256: implementation.identity.sha256,
    runtime: preflight.observed.runtime,
    command: run[0]!.command,
    gitHead: preflight.observed.head,
    startedOn: timed[0]!.startedAt,
    endedOn: timed[0]!.finishedAt,
    processConcurrency: packet.resources.processConcurrency,
  });
  const execution = deriveExecution(
    Object.freeze({ execution: strictJsonSnapshot(value) }),
    packet,
    selectedSubrouteId,
    preflight,
    callerRows,
    timing,
    root,
  );
  if (execution === null) fail("A-P normal verification route lacks evaluator execution provenance");
  return execution;
}

function packetGovernedTiming(
  packet: Phase10C0VS6PacketProtocol,
  lifecycle: Phase10C0VS6RawTerminalCandidateProjection,
  ledgerIdentity: Phase10C0VS6ArtifactIdentity | null,
  selectedAttempt: Phase10C0VS6AttemptRowV2 | null,
): Phase10C0VS6PacketGovernedTiming {
  const records = selectedAttempt === null
    ? lifecycle.lifecycle.packetInvocationRecords
    : selectedAttempt.executableInvocationRecords;
  const elapsed = safeIntegerSum(records.map((entry) => entry.elapsedNanoseconds), "governed elapsed nanoseconds");
  if (selectedAttempt !== null && selectedAttempt.executionRecord.governedInvocationElapsedNanoseconds !== elapsed) {
    fail("attempt execution record differs from its exact integer invocation sum");
  }
  return Object.freeze({
    source: selectedAttempt === null ? "packet-verification-worker" : "selected-attempt-row",
    selectedAttemptId: selectedAttempt?.attemptId ?? null,
    attemptLedger: ledgerIdentity,
    invocationRecords: records,
    governedInvocationElapsedNanoseconds: elapsed,
    governedInvocationWallSeconds: elapsed / 1_000_000_000,
    processHours: elapsed / 3_600_000_000_000,
  });
}

function materializedPublicationArtifacts(
  authority: ReopenedAuthority,
  packet: Phase10C0VS6PacketProtocol,
  lifecycle: Phase10C0VS6RawTerminalCandidateProjection,
): readonly Phase10C0VS6ReopenedPublishedArtifact[] {
  const subroute = packet.terminalSubroutes.find((entry) => entry.subrouteId === lifecycle.lifecycle.selectedSubrouteId);
  if (subroute === undefined) fail("selected subroute is absent while deriving publication accounting");
  const finalizationPaths = new Set(packet.resources.publicationFinalizationProjections.map((entry) => entry.path));
  const allowedPaths = new Set(subroute.requiredOutputIds.map((outputId) =>
    outputDefinition(authority.matrix, packet.packetId, outputId)).map((entry) => entry.artifact.path));
  const transitions = packet.paths.publicationStagingPaths.filter((entry) =>
    allowedPaths.has(entry.finalPath) && !finalizationPaths.has(entry.finalPath));
  return Object.freeze(transitions.map((transition) => {
    const outputs = subroute.requiredOutputIds.filter((outputId) =>
      outputDefinition(authority.matrix, packet.packetId, outputId).artifact.path === transition.finalPath);
    if (outputs.length !== 1) fail(`${transition.finalPath} does not resolve one selected output ID`);
    const expected = expectedOutputIdentity(
      authority,
      packet,
      lifecycle.lifecycle.preflightIdentity,
      transition.finalPath,
    );
    const reopened = readArtifact(authority.root, transition.finalPath, expected, `${outputs[0]} publication`);
    return Object.freeze({
      artifactRole: "published-output" as const,
      outputId: outputs[0]!,
      identity: reopened.identity,
      bytes: reopened.bytes,
    });
  }).sort((left, right) => codePointCompare(left.identity.path, right.identity.path)));
}

function packetResourceAccounting(
  packet: Phase10C0VS6PacketProtocol,
  lifecycle: Phase10C0VS6RawTerminalCandidateProjection,
  selectedAttempt: Phase10C0VS6AttemptRowV2 | null,
  ledgerIdentity: Phase10C0VS6ArtifactIdentity | null,
  attemptArtifacts: readonly Phase10C0VS6ReopenedPublishedArtifact[],
  publicationArtifacts: readonly Phase10C0VS6ReopenedPublishedArtifact[],
): Phase10C0VS6PacketResourceAccounting {
  const terminalBytes = safeIntegerSum(
    attemptArtifacts.map((entry) => entry.identity.byteLength),
    "attempt terminal retained bytes",
  );
  const maximum = selectedAttempt?.resourceRecord.maximumObservedConcurrentBytes ?? terminalBytes;
  if (selectedAttempt !== null) {
    const terminal = selectedAttempt.resourceRecord.observations.at(-1);
    if (terminal === undefined) fail("selected attempt lacks a terminal resource observation");
    phase10C0VS6SameJson(
      terminal.artifacts,
      attemptArtifacts.map((entry) => entry.identity),
      "selected attempt terminal artifacts versus live attempt census",
    );
    if (selectedAttempt.resourceRecord.terminalRetainedBytes !== terminalBytes) {
      fail("selected attempt terminal retained bytes differ from live artifact sum");
    }
  }
  const publicationBytes = safeIntegerSum(
    publicationArtifacts.map((entry) => entry.identity.byteLength),
    "materialized publication bytes",
  );
  const finalizations = packet.resources.publicationFinalizationProjections;
  const projectedFinalizationBytes = safeIntegerSum(
    finalizations.map((entry) => entry.maximumByteLength * 2),
    "projected finalization bytes",
  );
  const projectedPacketRetainedBytes = safeIntegerSum(
    [terminalBytes, publicationBytes, projectedFinalizationBytes],
    "projected packet retained bytes",
  );
  const allPaths = [
    ...attemptArtifacts.map((entry) => entry.identity.path),
    ...publicationArtifacts.map((entry) => entry.identity.path),
    ...finalizations.flatMap((entry) => [entry.path, entry.stagingPath]),
  ];
  if (new Set(allPaths).size !== allPaths.length) fail("packet accounting repeats a physical path");
  return Object.freeze({
    source: selectedAttempt === null ? "append-only-attempt-root" : "selected-attempt-resource-record",
    attemptId: packet.registeredAttemptId,
    attemptLedger: ledgerIdentity,
    attemptRoot: packet.paths.attemptRoot,
    attemptRootArtifacts: Object.freeze(attemptArtifacts.map((entry) => entry.identity)),
    attemptMaximumObservedConcurrentBytes: maximum,
    attemptTerminalRetainedBytes: terminalBytes,
    materializedPublicationArtifacts: Object.freeze(publicationArtifacts.map((entry) => entry.identity)),
    materializedPublicationBytes: publicationBytes,
    publicationFinalizationProjections: finalizations,
    projectedFinalizationBytes,
    projectedPacketRetainedBytes,
    physicalPathUniquenessVerdict: "pass",
    appendOnlyVerdict: "pass",
  });
}

function packageProcessAccounting(
  catalogue: Phase10C0VS6PacketCatalogue,
  packet: Phase10C0VS6PacketProtocol,
  timing: Phase10C0VS6PacketGovernedTiming,
  prior: readonly Phase10C0VS6VerifiedPublishedPacket[],
): Phase10C0VS6PackageProcessAccounting {
  const currentIndex = catalogue.packets.findIndex((entry) => entry.packetId === packet.packetId);
  if (currentIndex < 0) fail(`${packet.packetId} is absent from the packet catalogue`);
  const selectedPacketIds = Object.freeze(catalogue.packets.slice(0, currentIndex + 1).map((entry) => entry.packetId));
  exactRoster(prior.map((entry) => entry.packet.packetId), selectedPacketIds.slice(0, -1), "prior selected packet prefix");
  const priorRows = Object.freeze(prior.map((entry) => Object.freeze({
    packetId: entry.packet.packetId,
    verification: entry.verificationIdentity,
    governedInvocationElapsedNanoseconds: entry.governedElapsedNanoseconds,
    processHours: entry.governedElapsedNanoseconds / 3_600_000_000_000,
  })));
  const priorNs = safeIntegerSum(priorRows.map((entry) => entry.governedInvocationElapsedNanoseconds), "prior packet elapsed");
  const currentNs = timing.governedInvocationElapsedNanoseconds;
  const totalNs = safeIntegerSum([priorNs, currentNs], "package elapsed");
  if (totalNs > 86_400_000_000_000) fail("package governed elapsed nanoseconds exceed the exact 24-hour cap");
  return Object.freeze({
    selectedPacketIds,
    priorPacketVerifications: priorRows,
    unselectedAttemptRows: Object.freeze([]),
    priorSelectedPacketElapsedNanoseconds: priorNs,
    unselectedAttemptElapsedNanoseconds: 0,
    currentPacketElapsedNanoseconds: currentNs,
    totalElapsedNanoseconds: totalNs,
    maximumElapsedNanoseconds: 86_400_000_000_000,
    priorSelectedPacketProcessHours: priorNs / 3_600_000_000_000,
    unselectedAttemptProcessHours: 0,
    currentPacketProcessHours: currentNs / 3_600_000_000_000,
    totalProcessHours: totalNs / 3_600_000_000_000,
    maximumProcessHours: 24,
    duplicateAccountingVerdict: "pass",
    omissionAccountingVerdict: "pass",
  });
}

function packageResourceAccounting(
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
  processAccounting: Phase10C0VS6PackageProcessAccounting,
  current: Phase10C0VS6PacketResourceAccounting,
  prior: readonly Phase10C0VS6VerifiedPublishedPacket[],
): Phase10C0VS6PackageResourceAccounting {
  for (const baseline of packet.resources.packageStorageBaselineArtifacts) {
    readArtifact(root, baseline.path, baseline, `${baseline.path} package baseline`);
  }
  const priorRows = Object.freeze(prior.map((entry) => Object.freeze({
    packetId: entry.packet.packetId,
    verification: entry.verificationIdentity,
    terminalReceipt: entry.terminalReceiptIdentity,
    attemptMaximumObservedConcurrentBytes:
      entry.verification.packetResourceAccounting.attemptMaximumObservedConcurrentBytes,
    finalizedPacketRetainedBytes: entry.finalizedPacketRetainedBytes,
  })));
  const priorBytes = safeIntegerSum(priorRows.map((entry) => entry.finalizedPacketRetainedBytes), "prior packet bytes");
  const total = safeIntegerSum([
    packet.resources.packageStorageBaselineBytes,
    priorBytes,
    current.projectedPacketRetainedBytes,
  ], "package retained bytes");
  if (total > 68_719_476_736) fail("package retained bytes exceed the exact 64-GiB cap");
  const allPaths = [
    ...packet.resources.packageStorageBaselineArtifacts.map((entry) => entry.path),
    ...prior.flatMap((entry) => entry.retainedPhysicalPaths),
    ...current.attemptRootArtifacts.map((entry) => entry.path),
    ...current.materializedPublicationArtifacts.map((entry) => entry.path),
    ...current.publicationFinalizationProjections.flatMap((entry) => [entry.path, entry.stagingPath]),
  ];
  if (new Set(allPaths).size !== allPaths.length) fail("package physical path union contains a duplicate");
  return Object.freeze({
    selectedPacketIds: processAccounting.selectedPacketIds,
    priorPacketResources: priorRows,
    packageStorageBaselineArtifacts: packet.resources.packageStorageBaselineArtifacts,
    packageStorageBaselineBytes: 1_629_577,
    priorFinalizedPacketRetainedBytes: priorBytes,
    currentProjectedPacketRetainedBytes: current.projectedPacketRetainedBytes,
    totalPackageRetainedBytes: total,
    maximumPackageRetainedBytes: 68_719_476_736,
    physicalPathDuplicateVerdict: "pass",
    omissionAccountingVerdict: "pass",
    storageLimitVerdict: "pass",
  });
}

function pathBelongsToRoot(path: string, root: string): boolean {
  return path.startsWith(`${root}/`);
}

function addExactIdentity(
  identities: Map<string, Phase10C0VS6ArtifactIdentity>,
  identity: Phase10C0VS6ArtifactIdentity,
  label: string,
): void {
  const prior = identities.get(identity.path);
  if (prior !== undefined) phase10C0VS6SameIdentity(identity, prior, label);
  else identities.set(identity.path, identity);
}

/**
 * Reconciles the selected prefix with a recursive physical census. Files owned by the current
 * in-flight packet are permitted only at its exact registered publication paths or beneath its
 * exact attempt root; they are deliberately excluded from prior-prefix accounting and will be
 * joined by that packet's later lifecycle/resource verifier. Every other physical file below a
 * package-owned publication, baseline, or attempt root must be present in the exact baseline or
 * deeply verified selected prefix.
 */
function assertSelectedPrefixClosedWorld(
  authority: ReopenedAuthority,
  currentPacket: Phase10C0VS6PacketProtocol,
  selected: readonly Phase10C0VS6VerifiedPublishedPacket[],
  currentAllowedPublicationPaths: readonly string[] = currentPacket.paths.allowedPublicationPaths,
): void {
  const protocols = authority.catalogue.packets.map((entry) => {
    if (entry.packetId === currentPacket.packetId) return currentPacket;
    const bytes = readArtifact(authority.root, entry.protocolPath, null, `${entry.packetId} census protocol`).bytes;
    const packet = parsePhase10C0VS6PacketProtocol(
      parsePhase10C0VS6PrettyJsonBytes(bytes, `${entry.packetId} census protocol`),
    );
    if (packet.packetId !== entry.packetId || packet.paths.attemptRoot !== entry.attemptRoot) {
      fail(`${entry.packetId} census protocol differs from the catalogue`);
    }
    return packet;
  });
  const allRegisteredPublicationPaths = protocols.flatMap((entry) => entry.paths.allowedPublicationPaths);
  if (new Set(allRegisteredPublicationPaths).size !== allRegisteredPublicationPaths.length) {
    fail("package protocols repeat a registered publication path");
  }
  const baseline = currentPacket.resources.packageStorageBaselineArtifacts;
  const baselinePaths = new Set(baseline.map((entry) => entry.path));
  const registeredPaths = new Set(allRegisteredPublicationPaths);
  const expectedPublication = new Map<string, Phase10C0VS6ArtifactIdentity>();
  for (const identity of authority.manifest.values()) {
    if (PACKAGE_PUBLICATION_ROOTS.some((root) => pathBelongsToRoot(identity.path, root)) &&
      !registeredPaths.has(identity.path) && !baselinePaths.has(identity.path)) {
      addExactIdentity(expectedPublication, identity, `${identity.path} unowned manifest publication`);
    }
  }
  for (const identity of baseline) {
    if (PACKAGE_PUBLICATION_ROOTS.some((root) => pathBelongsToRoot(identity.path, root))) {
      addExactIdentity(expectedPublication, identity, `${identity.path} publication baseline`);
    }
  }
  for (const packet of selected) {
    for (const artifact of packet.reopenedArtifacts) {
      if (PACKAGE_PUBLICATION_ROOTS.some((root) => pathBelongsToRoot(artifact.identity.path, root))) {
        addExactIdentity(
          expectedPublication,
          artifact.identity,
          `${artifact.identity.path} selected-prefix publication`,
        );
      }
    }
  }
  for (const path of currentAllowedPublicationPaths) {
    const absolute = resolve(authority.root.path, path);
    if (existsSync(absolute)) {
      const current = readArtifact(authority.root, path, null, `${path} current-packet publication`);
      addExactIdentity(expectedPublication, current.identity, `${path} current-packet publication`);
    }
  }
  phase10C0VS6AssertExactPhysicalRootCensus(
    authority.root,
    PACKAGE_PUBLICATION_ROOTS,
    Object.freeze([...expectedPublication.values()]),
  );

  const expectedBaselineAttempts = baseline.filter((entry) =>
    pathBelongsToRoot(entry.path, PACKAGE_BASELINE_ATTEMPT_ROOT));
  phase10C0VS6AssertExactPhysicalRootCensus(
    authority.root,
    [PACKAGE_BASELINE_ATTEMPT_ROOT],
    expectedBaselineAttempts,
  );

  const expectedAttempts = new Map<string, Phase10C0VS6ArtifactIdentity>();
  for (const packet of selected) {
    for (const artifact of packet.reopenedArtifacts) {
      if (pathBelongsToRoot(artifact.identity.path, PACKAGE_ATTEMPT_ROOT)) {
        addExactIdentity(expectedAttempts, artifact.identity, `${artifact.identity.path} selected-prefix attempt`);
      }
    }
  }
  const currentAttemptAbsolute = resolve(authority.root.path, currentPacket.paths.attemptRoot);
  if (existsSync(currentAttemptAbsolute)) {
    for (const identity of phase10C0VS6CensusUniquePhysicalDirectory(
      authority.root,
      currentPacket.paths.attemptRoot,
    )) {
      addExactIdentity(expectedAttempts, identity, `${identity.path} current-packet attempt`);
    }
  }
  phase10C0VS6AssertExactPhysicalRootCensus(
    authority.root,
    [PACKAGE_ATTEMPT_ROOT],
    Object.freeze([...expectedAttempts.values()]),
  );
}

function reopenCurrentPacketAuthority(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
  packet: Phase10C0VS6PacketProtocol,
  preflight: Phase10C0VS6RetainedPreflight,
): ReopenedAuthority {
  const root = phase10C0VS6PhysicalRepositoryRoot(input.repositoryRoot);
  const catalogueBytes = phase10C0VS6ReadUniquePhysicalFile(root, packet.bindings.packetCatalogue.path);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(packet.bindings.packetCatalogue.path, catalogueBytes),
    packet.bindings.packetCatalogue,
    "current finalizer packet catalogue",
  );
  const catalogue = parsePhase10C0VS6PacketCatalogue(
    parsePhase10C0VS6PrettyJsonBytes(catalogueBytes, "current finalizer packet catalogue"),
  );
  exactRoster(catalogue.packets.map((entry) => entry.packetId), PHASE10_C0V_S6_PACKET_IDS,
    "current finalizer catalogue order");
  const matrixBytes = phase10C0VS6ReadUniquePhysicalFile(root, packet.bindings.matrix.path);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(packet.bindings.matrix.path, matrixBytes),
    packet.bindings.matrix,
    "current finalizer S6 matrix",
  );
  const matrix = parsePhase10C0VS6Matrix(
    parsePhase10C0VS6PrettyJsonBytes(matrixBytes, "current finalizer S6 matrix"),
  );
  const manifest = phase10C0VS6ValidateHeadBoundPreflightManifest(root.path, preflight);
  return Object.freeze({ root, catalogue, matrix, manifest, dependencyArtifacts: Object.freeze([]) });
}

function exactPublicationTransition(
  packet: Phase10C0VS6PacketProtocol,
  finalPath: string,
): Phase10C0VS6PacketProtocol["paths"]["publicationStagingPaths"][number] {
  const rows = packet.paths.publicationStagingPaths.filter((entry) => entry.finalPath === finalPath);
  if (rows.length !== 1) fail(`${finalPath} does not resolve one registered publication transition`);
  return rows[0]!;
}

function assertFreshPublicationBytes(
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
  finalPath: string,
  bytes: Uint8Array,
  maximumByteLength: number | null,
): Phase10C0VS6ArtifactIdentity {
  const transition = exactPublicationTransition(packet, finalPath);
  if (maximumByteLength !== null && bytes.byteLength > maximumByteLength) {
    fail(`${finalPath} exceeds its registered maximum byte length`);
  }
  if (existsSync(resolve(root.path, transition.finalPath)) || existsSync(resolve(root.path, transition.stagingPath))) {
    fail(`${finalPath} or its registered stage existed before current finalization`);
  }
  return phase10C0VS6ArtifactIdentity(finalPath, bytes);
}

function publishFreshBytes(
  input: Phase10C0VS6LockedRawFinalizationInput,
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
  finalPath: string,
  bytes: Uint8Array,
  maximumByteLength: number | null,
): Phase10C0VS6ArtifactIdentity {
  assertActiveFinalizationAuthority(input, root);
  const expected = assertFreshPublicationBytes(root, packet, finalPath, bytes, maximumByteLength);
  const transition = exactPublicationTransition(packet, finalPath);
  const result = phase10C0VS6PublishCrashSafeExclusive(
    root,
    transition.finalPath,
    transition.stagingPath,
    bytes,
  );
  assertActiveFinalizationAuthority(input, root);
  if (result.disposition !== "created") fail(`${finalPath} was not freshly materialized`);
  phase10C0VS6SameIdentity(result.identity, expected, `${finalPath} freshly published bytes`);
  return result.identity;
}

function assertActiveFinalizationAuthority(
  input: Phase10C0VS6LockedRawFinalizationInput,
  root: Phase10C0VS6PhysicalRoot,
): void {
  phase10C0VS6AssertActiveLockedPacketWatchdog(
    root,
    input.locks,
    input.lockedAuthority,
    input.watchdog,
    "run",
  );
}

function projectTerminalCandidateIntoAttemptScan(
  scanned: readonly Phase10C0VS6ReopenedPublishedArtifact[],
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
): readonly Phase10C0VS6ReopenedPublishedArtifact[] {
  if (scanned.some((entry) => entry.identity.path === candidate.candidatePath)) {
    fail("terminal candidate became physical before pre-publication validation completed");
  }
  return Object.freeze([
    ...scanned,
    Object.freeze({
      artifactRole: "attempt-root" as const,
      outputId: null,
      identity: candidate.candidateIdentity,
      bytes: new Uint8Array(candidate.candidateBytes),
    }),
  ].sort((left, right) => codePointCompare(left.identity.path, right.identity.path)));
}

function publishProjectedTerminalCandidate(
  input: Phase10C0VS6LockedRawFinalizationInput,
  root: Phase10C0VS6PhysicalRoot,
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
): Phase10C0VS6RawTerminalCandidateProjection {
  assertActiveFinalizationAuthority(input, root);
  const written = phase10C0VS6WriteExclusiveOrExact(
    root,
    candidate.candidatePath,
    candidate.candidateBytes,
  );
  assertActiveFinalizationAuthority(input, root);
  if (written.disposition !== "created") fail("terminal candidate was not freshly created");
  phase10C0VS6SameIdentity(written.identity, candidate.candidateIdentity,
    "freshly published terminal candidate");
  const reopened = independentlyReopenPhase10C0VS6TerminalCandidate(
    input,
    input.capturedGovernedCallerResult,
  );
  phase10C0VS6SameIdentity(
    reopened.candidateIdentity,
    candidate.candidateIdentity,
    "freshly reopened terminal candidate",
  );
  return reopened;
}

function deriveCurrentVerifiedArtifacts(
  authority: ReopenedAuthority,
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
  publicationArtifacts: readonly Phase10C0VS6ReopenedPublishedArtifact[],
): readonly Phase10C0VS6VerifiedArtifact[] {
  const packet = candidate.lifecycle.packet;
  const subroute = packet.terminalSubroutes.find((entry) =>
    entry.subrouteId === candidate.lifecycle.selectedSubrouteId);
  if (subroute === undefined) fail("current finalizer subroute is absent from packet authority");
  const outputIds = subroute.requiredOutputIds.filter((entry) =>
    !entry.endsWith("-verification") && !entry.endsWith("-terminal-receipt"));
  const rows = outputIds.map((outputId): Phase10C0VS6VerifiedArtifact => {
    const definition = outputDefinition(authority.matrix, packet.packetId, outputId);
    let identity: Phase10C0VS6ArtifactIdentity;
    if (definition.artifact.path === candidate.lifecycle.preflightIdentity.path) {
      identity = candidate.lifecycle.preflightIdentity;
      readArtifact(authority.root, identity.path, identity, `${outputId} current preflight`);
    } else if (packet.bindings.scienceProtocol?.path === definition.artifact.path) {
      identity = packet.bindings.scienceProtocol;
      readArtifact(authority.root, identity.path, identity, `${outputId} current science protocol`);
    } else if (packet.bindings.referenceOrRefusal?.path === definition.artifact.path) {
      identity = packet.bindings.referenceOrRefusal;
      readArtifact(authority.root, identity.path, identity, `${outputId} current reference/refusal`);
    } else {
      const published = publicationArtifacts.filter((entry) =>
        entry.outputId === outputId && entry.identity.path === definition.artifact.path);
      if (published.length !== 1) fail(`${outputId} lacks one raw-published current artifact`);
      identity = published[0]!.identity;
      phase10C0VS6SameIdentity(
        phase10C0VS6ArtifactIdentity(identity.path, published[0]!.bytes),
        identity,
        `${outputId} current publication bytes`,
      );
      if (existsSync(resolve(authority.root.path, identity.path))) {
        readArtifact(authority.root, identity.path, identity, `${outputId} current publication`);
      }
    }
    return Object.freeze({ outputId, ...identity });
  }).sort((left, right) => codePointCompare(left.outputId, right.outputId));
  exactRoster(rows.map((entry) => entry.outputId), outputIds, "current verified output roster");
  return Object.freeze(rows);
}

function finalizationProjection(
  packet: Phase10C0VS6PacketProtocol,
  role: "packet-verification" | "terminal-receipt",
): Phase10C0VS6PacketProtocol["resources"]["publicationFinalizationProjections"][number] {
  const rows = packet.resources.publicationFinalizationProjections.filter((entry) => entry.artifactRole === role);
  if (rows.length !== 1) fail(`${packet.packetId} lacks one ${role} finalization projection`);
  return rows[0]!;
}

function terminalReasonCodes(
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
  acceptedPacketCredit: boolean,
): readonly string[] {
  if (acceptedPacketCredit) return Object.freeze([]);
  const capConditionId = candidate.lifecycle.registeredCap?.conditionId ?? null;
  const preflightConditionId = candidate.lifecycle.preflight.refusalCandidate?.observation.conditionId ?? null;
  if ((capConditionId === null) === (preflightConditionId === null)) {
    fail("A-P maker-return terminal does not derive exactly one raw classification condition");
  }
  return Object.freeze([capConditionId ?? preflightConditionId!]);
}

/**
 * Raw one-way A-P finalizer.  It is the only current-v1 public API that may turn the governed A-P
 * worker artifacts into claim-bearing verification/terminal bytes.  The caller supplies no
 * candidate, route, accounting, verification, or terminal authority; all of those are freshly
 * projected from the live retained preflight, parent event stream, raw control receipts, and the
 * exact captured governed caller result.  Maker-return refusal/cap routes publish no verification.
 */
export function independentlyFinalizePhase10C0VS6ApPacket(
  input: Phase10C0VS6ApRawFinalizationInput,
): Phase10C0VS6FinalizedApPacket {
  const activeRoot = phase10C0VS6PhysicalRepositoryRoot(input.repositoryRoot);
  assertActiveFinalizationAuthority(input, activeRoot);
  phase10C0VS6SameIdentity(
    input.lockedAuthority.packetProtocolIdentity,
    input.packetProtocolIdentity,
    "A-P finalizer locked packet protocol",
  );
  if (!sameBytes(input.lockedAuthority.packetProtocolBytes, input.packetProtocolBytes)) {
    fail("A-P finalizer packet bytes differ from the active locked authority");
  }
  const retained = derivePhase10C0VS6RetainedRuntimeAuthority(input);
  const packet = retained.packet;
  if (packet.packetId !== "a-p-c0v-s6") fail("A-P raw finalizer received another packet");
  if (input.lockedAuthority.packet.packetId !== packet.packetId ||
    input.lockedAuthority.packet.protocolId !== packet.protocolId ||
    input.lockedAuthority.packet.registeredAttemptId !== packet.registeredAttemptId) {
    fail("A-P finalizer packet differs from the active locked packet authority");
  }
  const authority = reopenCurrentPacketAuthority(input, packet, retained.preflight);

  const materialized = independentlyMaterializePhase10C0VS6TerminalCandidate(
    input,
    input.capturedGovernedCallerResult,
  );
  if (existsSync(resolve(authority.root.path, materialized.candidatePath))) {
    fail("A-P terminal candidate existed before current raw finalization");
  }
  const candidate = materialized;
  const scanned = projectTerminalCandidateIntoAttemptScan(
    scanAttemptRoot(authority.root, retained.preflight.observed.attemptDirectory),
    candidate,
  );
  assertAttemptRootByteLimits(authority.catalogue, candidate, scanned);
  const expectedAttemptPaths = exactExpectedAttemptPaths(
    packet,
    retained.preflight,
    candidate.lifecycle.selectedSubrouteId,
  );
  exactRoster(scanned.map((entry) => entry.identity.path), expectedAttemptPaths, "A-P finalized attempt-root census");
  const subroutes = packet.terminalSubroutes.filter((entry) =>
    entry.subrouteId === candidate.lifecycle.selectedSubrouteId);
  if (subroutes.length !== 1) fail("A-P raw candidate does not select one terminal subroute");
  const subroute = subroutes[0]!;
  const acceptedPacketCredit = subroute.dispositionCode === null;

  let publicationArtifacts: readonly Phase10C0VS6ReopenedPublishedArtifact[];
  let verification: Phase10C0VS6PacketVerificationV2 | null = null;
  let verificationIdentity: Phase10C0VS6ArtifactIdentity | null = null;
  let verificationBytes: Uint8Array | null = null;
  let verificationAuthority: Phase10C0VS6PacketVerificationV2Authority | null = null;
  if (acceptedPacketCredit) {
    publicationArtifacts = currentCandidatePublicationArtifacts(authority, candidate);
    assertApCandidatePublicationJoin(authority, candidate, publicationArtifacts);
    const timing = packetGovernedTiming(packet, candidate, null, null);
    const packetResources = packetResourceAccounting(
      packet,
      candidate,
      null,
      null,
      scanned,
      publicationArtifacts,
    );
    const processAccounting = packageProcessAccounting(authority.catalogue, packet, timing, Object.freeze([]));
    const packageResources = packageResourceAccounting(
      authority.root,
      packet,
      processAccounting,
      packetResources,
      Object.freeze([]),
    );
    const callerRows = candidate.candidate.callerInvocationResults;
    const verifiedArtifacts = deriveCurrentVerifiedArtifacts(authority, candidate, publicationArtifacts);
    const checkResults = deriveCheckResults(
      authority.matrix,
      packet,
      candidate.lifecycle.selectedSubrouteId,
      callerRows,
    );
    const negativeControlResults = deriveApNegativeControlResults(candidate, authority.root);
    const executedNegativeControlIds = Object.freeze(
      [...new Set(callerRows.flatMap((entry) => [...entry.executedNegativeControlIds]))]
        .sort(codePointCompare),
    );
    exactRoster(
      negativeControlResults.map((entry) => entry.negativeControlId),
      executedNegativeControlIds,
      "A-P finalizer negative-control roster",
    );
    const execution = independentlyConstructApExecution(
      packet,
      candidate.lifecycle.selectedSubrouteId,
      retained.preflight,
      callerRows,
      timing,
      authority.root,
    );
    verificationAuthority = Object.freeze({
      selectedSubrouteId: candidate.lifecycle.selectedSubrouteId,
      verifiedArtifacts,
      checkResults,
      executedNegativeControlIds,
      negativeControlResults,
      execution,
      callerInvocationResults: callerRows,
      governedTiming: timing,
      packageProcessAccounting: processAccounting,
      packetResourceAccounting: packetResources,
      packageResourceAccounting: packageResources,
    });
    const verificationValue = Object.freeze({
      schema: "phase10-packet-verification-v2" as const,
      verificationId: `phase10-${packet.packetId}-${packet.registeredAttemptId}-verification-v2`,
      matrixId: authority.matrix.matrixId,
      protocolId: packet.protocolId,
      registryId: packet.registryId,
      packetId: packet.packetId,
      terminalState: "complete" as const,
      verifiedArtifacts,
      checkResults,
      executedNegativeControlIds,
      negativeControlResults,
      boundDependencyPacketIds: packet.boundDependencyPacketIds,
      execution,
      callerInvocationResults: callerRows,
      governedTiming: timing,
      packageProcessAccounting: processAccounting,
      packetResourceAccounting: packetResources,
      packageResourceAccounting: packageResources,
      aggregateVerdict: "pass" as const,
      limits: packet.claimBoundary.forbidden,
    });
    verificationBytes = writePhase10C0VS6ApVerificationReceipt(
      verificationValue,
      packet,
      verificationAuthority,
    );
    const verificationProjection = finalizationProjection(packet, "packet-verification");
    verificationIdentity = assertFreshPublicationBytes(
      authority.root,
      packet,
      verificationProjection.path,
      verificationBytes,
      verificationProjection.maximumByteLength,
    );
    verification = parsePhase10C0VS6PacketVerificationV2Bytes(
      verificationBytes,
      packet,
      verificationAuthority,
    );
  } else {
    publicationArtifacts = currentCandidatePublicationArtifacts(authority, candidate);
  }

  const reasons = terminalReasonCodes(candidate, acceptedPacketCredit);
  const invocationRecords = candidate.lifecycle.registeredCap === null
    ? Object.freeze([])
    : candidate.lifecycle.packetInvocationRecords;
  const terminalAuthority: Phase10C0VS6TerminalReceiptAuthority = Object.freeze({
    selectedSubrouteId: candidate.lifecycle.selectedSubrouteId,
    terminalState: candidate.lifecycle.terminalState,
    preflight: candidate.lifecycle.preflightIdentity,
    terminalCandidate: candidate.candidateIdentity,
    attemptLedger: null,
    packetVerification: verificationIdentity,
    invocationRecords,
    callerInvocationResults: candidate.candidate.callerInvocationResults,
    registeredCap: candidate.lifecycle.registeredCap,
    reasons,
  });
  const terminalValue = Object.freeze({
    schema: packet.terminalReceiptContract.receiptSchema,
    receiptId: `phase10-${packet.packetId}-${packet.registeredAttemptId}-terminal-v2`,
    matrixId: authority.matrix.matrixId,
    protocolId: packet.protocolId,
    registryId: packet.registryId,
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    terminalState: candidate.lifecycle.terminalState,
    dispositionCode: candidate.lifecycle.dispositionCode,
    preflight: candidate.lifecycle.preflightIdentity,
    terminalCandidate: candidate.candidateIdentity,
    attemptLedger: null,
    packetVerification: verificationIdentity,
    producedOutputIds: subroute.requiredOutputIds,
    executedCheckIds: subroute.requiredCheckIds,
    executedNegativeControlIds: subroute.requiredNegativeControlIds,
    invocationRecords,
    callerInvocationResults: candidate.candidate.callerInvocationResults,
    registeredCap: candidate.lifecycle.registeredCap,
    acceptedPacketCredit,
    dependencyValid: acceptedPacketCredit,
    verdict: acceptedPacketCredit ? "complete" as const : "refusal" as const,
    reasons,
  });
  const terminalBytes = writePhase10C0VS6TerminalReceipt(terminalValue, packet, terminalAuthority);
  const terminalProjection = finalizationProjection(packet, "terminal-receipt");
  if (terminalProjection.path !== packet.paths.terminalReceiptPath) {
    fail("A-P terminal finalization path differs from packet terminal path");
  }
  const terminalIdentity = assertFreshPublicationBytes(
    authority.root,
    packet,
    terminalProjection.path,
    terminalBytes,
    terminalProjection.maximumByteLength,
  );
  const terminal = parsePhase10C0VS6TerminalReceiptV2Bytes(
    terminalBytes,
    packet,
    terminalAuthority,
  );
  for (const artifact of publicationArtifacts) {
    if (artifact.identity.path !== candidate.lifecycle.preflightIdentity.path) {
      assertFreshPublicationBytes(authority.root, packet, artifact.identity.path, artifact.bytes, null);
    }
  }
  assertNoPublicationStages(packet, authority.root);
  const selectedPublicationPaths = subroute.requiredOutputIds.map((outputId) =>
    outputDefinition(authority.matrix, packet.packetId, outputId).artifact.path);
  assertSelectedPrefixClosedWorld(
    authority,
    packet,
    Object.freeze([]),
    Object.freeze(selectedPublicationPaths),
  );
  assertActiveFinalizationAuthority(input, authority.root);
  const publishedCandidate = publishProjectedTerminalCandidate(input, authority.root, candidate);
  const publishedArtifacts = publishCandidatePublicationArtifacts(
    input,
    authority,
    candidate,
    publicationArtifacts,
  );
  if (verificationIdentity !== null && verificationBytes !== null && verificationAuthority !== null) {
    const verificationProjection = finalizationProjection(packet, "packet-verification");
    const publishedVerification = publishFreshBytes(
      input,
      authority.root,
      packet,
      verificationProjection.path,
      verificationBytes,
      verificationProjection.maximumByteLength,
    );
    phase10C0VS6SameIdentity(
      publishedVerification,
      verificationIdentity,
      "A-P published packet verification",
    );
    verification = parsePhase10C0VS6PacketVerificationV2Bytes(
      phase10C0VS6ReadUniquePhysicalFile(authority.root, verificationIdentity.path),
      packet,
      verificationAuthority,
    );
  } else if (verificationIdentity !== null || verificationBytes !== null || verificationAuthority !== null) {
    fail("A-P verification projection is only partially materialized");
  }
  const publishedTerminal = publishFreshBytes(
    input,
    authority.root,
    packet,
    terminalProjection.path,
    terminalBytes,
    terminalProjection.maximumByteLength,
  );
  phase10C0VS6SameIdentity(publishedTerminal, terminalIdentity, "A-P published terminal receipt");
  const reopenedTerminal = parsePhase10C0VS6TerminalReceiptV2Bytes(
    phase10C0VS6ReadUniquePhysicalFile(authority.root, terminalIdentity.path),
    packet,
    terminalAuthority,
  );
  assertNoPublicationStages(packet, authority.root);
  assertSelectedPrefixClosedWorld(
    authority,
    packet,
    Object.freeze([]),
    Object.freeze(selectedPublicationPaths),
  );
  assertActiveFinalizationAuthority(input, authority.root);
  return Object.freeze({
    terminalCandidate: publishedCandidate,
    publishedArtifacts,
    verification,
    verificationIdentity,
    verificationBytes: verificationBytes === null ? null : new Uint8Array(verificationBytes),
    terminalReceipt: reopenedTerminal,
    terminalReceiptIdentity: terminalIdentity,
    terminalReceiptBytes: new Uint8Array(terminalBytes),
  });
}

function produceLedgerFilename(
  packet: Phase10C0VS6PacketProtocol,
  selectedSubrouteId: string,
): string {
  const filenames = packet.candidateFilenameRosters[selectedSubrouteId];
  const matches = filenames?.filter((entry) => entry.endsWith("-attempts.jsonl")) ?? [];
  if (matches.length !== 1) fail("selected produce subroute lacks one exact attempt-ledger filename");
  return matches[0]!;
}

function produceAttemptScope(packetId: Phase10C0VS6PacketProtocol["packetId"]): Readonly<{
  layerId: Phase10C0VS6AttemptRowV2["layerId"];
  branch: Phase10C0VS6AttemptRowV2["branch"];
}> {
  switch (packetId) {
    case "c0v-moving-produce": return Object.freeze({
      layerId: "C0V-MOVING-EVENT" as const,
      branch: "independent-reference" as const,
    });
    case "c0v-static-produce": return Object.freeze({
      layerId: "C0V-STATIC" as const,
      branch: "reference-refusal" as const,
    });
    case "c0v-radial-produce": return Object.freeze({
      layerId: "C0V-RADIAL" as const,
      branch: "independent-reference" as const,
    });
    default: fail(`${packetId} is not a layer-produce packet`);
  }
}

function artifactFromAttemptScan(
  scanned: readonly Phase10C0VS6ReopenedPublishedArtifact[],
  path: string,
  label: string,
): Phase10C0VS6ArtifactIdentity {
  const rows = scanned.filter((entry) => entry.identity.path === path);
  if (rows.length !== 1) fail(`${label} does not resolve one exact attempt artifact`);
  return rows[0]!.identity;
}

export function phase10C0VS6ValidateAttemptRootByteCeilings(
  catalogue: Phase10C0VS6PacketCatalogue,
  packet: Phase10C0VS6PacketProtocol,
  stdoutPath: string,
  stderrPath: string,
  artifacts: readonly Phase10C0VS6ArtifactIdentity[],
): void {
  const rows = catalogue.packets.filter((entry) => entry.packetId === packet.packetId);
  if (rows.length !== 1) fail(`${packet.packetId} lacks one catalogue scratch-budget row`);
  const limits = rows[0]!;
  if (new Set(artifacts.map((entry) => entry.path)).size !== artifacts.length) {
    fail(`${packet.packetId} scratch-budget artifact roster repeats a path`);
  }
  const stdoutRows = artifacts.filter((entry) => entry.path === stdoutPath);
  const stderrRows = artifacts.filter((entry) => entry.path === stderrPath);
  if (stdoutRows.length !== 1 || stderrRows.length !== 1 || stdoutPath === stderrPath) {
    fail(`${packet.packetId} scratch-budget roster lacks distinct stdout/stderr artifacts`);
  }
  const stdout = stdoutRows[0]!;
  const stderr = stderrRows[0]!;
  const logPaths = new Set([stdout.path, stderr.path]);
  const otherBytes = safeIntegerSum(
    artifacts.filter((entry) => !logPaths.has(entry.path)).map((entry) => entry.byteLength),
    `${packet.packetId} other attempt-root bytes`,
  );
  if (stdout.byteLength > limits.maximumStdoutBytes) {
    fail(`${packet.packetId} retained stdout exceeds its exact catalogue ceiling`);
  }
  if (stderr.byteLength > catalogue.workerTransportContract.maximumStderrBytes) {
    fail(`${packet.packetId} retained stderr exceeds its exact transport ceiling`);
  }
  if (otherBytes > limits.maximumOtherAttemptRootBytes) {
    fail(`${packet.packetId} other attempt-root bytes exceed their exact catalogue ceiling`);
  }
  const registeredScratch = safeIntegerSum([
    limits.maximumStdoutBytes,
    catalogue.workerTransportContract.maximumStderrBytes,
    limits.maximumOtherAttemptRootBytes,
  ], `${packet.packetId} registered scratch ceiling`);
  if (packet.resources.projectedScratchBytes !== registeredScratch) {
    fail(`${packet.packetId} projected scratch differs from its exact catalogue ceilings`);
  }
}

function assertAttemptRootByteLimits(
  catalogue: Phase10C0VS6PacketCatalogue,
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
  scanned: readonly Phase10C0VS6ReopenedPublishedArtifact[],
): void {
  phase10C0VS6ValidateAttemptRootByteCeilings(
    catalogue,
    candidate.lifecycle.packet,
    candidate.lifecycle.preflight.observed.stdoutPath,
    candidate.lifecycle.preflight.observed.stderrPath,
    scanned.map((entry) => entry.identity),
  );
}

function produceWorkerTiming(
  root: Phase10C0VS6PhysicalRoot,
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
): Phase10C0VS6WorkerInvocationEvaluation | null {
  const packet = candidate.lifecycle.packet;
  const records = candidate.lifecycle.produceInvocationRecords;
  if (records.length === 0) return null;
  const path = `${candidate.lifecycle.preflight.observed.attemptDirectory}/${packet.workerInvocationContract.filename}`;
  return independentlyEvaluatePhase10C0VS6WorkerInvocations(
    phase10C0VS6ReadUniquePhysicalFile(root, path),
    packet,
    candidate.lifecycle.selectedSubrouteId,
    Date.now(),
  );
}

function reopenRadialWorkerProgress(
  root: Phase10C0VS6PhysicalRoot,
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
): Readonly<{ readonly progress: Phase10C0VS6WorkerProgress; readonly bytes: Uint8Array }> | null {
  const packet = candidate.lifecycle.packet;
  if (candidate.lifecycle.produceInvocationRecords.length === 0) return null;
  if (packet.packetId !== "c0v-radial-produce" || packet.workerProgressContract === null) {
    fail("solver-worker route lacks the radial worker-progress contract");
  }
  const path = `${candidate.lifecycle.preflight.observed.attemptDirectory}/${
    packet.workerProgressContract.filename}`;
  const bytes = phase10C0VS6ReadUniquePhysicalFile(root, path);
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("radial worker-progress bytes are not valid UTF-8");
  }
  if (text.length === 0 || !text.endsWith("\n") || text.includes("\r") || text.endsWith("\n\n")) {
    fail("radial worker-progress bytes must be nonempty compact JSONL with one terminal LF");
  }
  const records = text.slice(0, -1).split("\n").map((line, index): unknown => {
    try {
      return JSON.parse(line) as unknown;
    } catch {
      fail(`radial worker-progress line ${index} is not JSON`);
    }
  });
  const progress = parsePhase10C0VS6WorkerProgress(Object.freeze({
    artifact: phase10C0VS6ArtifactIdentity(path, bytes),
    records: Object.freeze(records),
  }), "raw radial worker progress");
  return Object.freeze({ progress, bytes: new Uint8Array(bytes) });
}

function movingPartialExecution(
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
  scanned: readonly Phase10C0VS6ReopenedPublishedArtifact[],
  ledgerCandidatePath: string,
): Phase10C0VS6PartialExecution | null {
  if (candidate.lifecycle.dispositionCode !== "registered-cap-resource-refusal") return null;
  const packet = candidate.lifecycle.packet;
  if (packet.workerProgressContract !== null) {
    fail("moving/static route-cause cap unexpectedly carries solver worker-progress authority");
  }
  const capped = candidate.lifecycle.produceInvocationRecords.filter((entry) =>
    entry.terminalState === "registered-cap");
  if (capped.length !== 1 || capped[0]!.invocationClass !== "route-cause-evaluator" ||
    candidate.lifecycle.registeredCap === null ||
    candidate.lifecycle.registeredCap.invocationId !== capped[0]!.invocationId ||
    candidate.lifecycle.registeredCap.observedWallSeconds !== capped[0]!.wallSeconds ||
    candidate.lifecycle.registeredCap.registeredWallSecondsMaximum !==
      capped[0]!.registeredWallSecondsMaximum) {
    fail("moving/static registered cap differs from raw route-cause invocation authority");
  }
  const retainedCandidateBytes = safeIntegerSum(scanned
    .filter((entry) => entry.identity.path.startsWith(
      `${candidate.lifecycle.preflight.observed.candidateDirectory}/`,
    ) && entry.identity.path !== ledgerCandidatePath)
    .map((entry) => entry.identity.byteLength), "moving/static retained candidate bytes");
  const invocation = capped[0]!;
  return Object.freeze({
    capId: candidate.lifecycle.registeredCap.conditionId,
    registeredLimit: invocation.registeredWallSecondsMaximum,
    observedValue: invocation.wallSeconds,
    unit: "seconds",
    cappedInvocationId: invocation.invocationId,
    cappedInvocationClass: "route-cause-evaluator",
    invocationStartedAt: invocation.startedAt,
    invocationStoppedAt: invocation.finishedAt,
    invocationElapsedNanoseconds: invocation.elapsedNanoseconds,
    rosterCaseIds: Object.freeze([]),
    startedCaseIds: Object.freeze([]),
    completedCaseIds: Object.freeze([]),
    activeCaseId: null,
    completedNumericFieldValueCount: 0,
    completedUniformFieldValueCount: 0,
    retainedCandidateBytes,
    acceptedValidWitnessProduced: false,
  });
}

function radialPartialExecution(
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
  scanned: readonly Phase10C0VS6ReopenedPublishedArtifact[],
  ledgerCandidatePath: string,
  progress: Phase10C0VS6WorkerProgress | null,
): Phase10C0VS6PartialExecution | null {
  if (candidate.lifecycle.dispositionCode !== "registered-cap-resource-refusal") return null;
  const packet = candidate.lifecycle.packet;
  if (packet.packetId !== "c0v-radial-produce" || packet.workerProgressContract === null ||
    progress === null || candidate.lifecycle.registeredCap === null) {
    fail("radial registered cap lacks progress/cap authority");
  }
  const capped = candidate.lifecycle.produceInvocationRecords.filter((entry) =>
    entry.terminalState === "registered-cap");
  if (capped.length !== 1 || capped[0]!.invocationClass === "route-cause-evaluator" ||
    candidate.lifecycle.registeredCap.invocationId !== capped[0]!.invocationId ||
    candidate.lifecycle.registeredCap.observedWallSeconds !== capped[0]!.wallSeconds ||
    candidate.lifecycle.registeredCap.registeredWallSecondsMaximum !==
      capped[0]!.registeredWallSecondsMaximum) {
    fail("radial registered cap differs from raw governed invocation authority");
  }
  const final = progress.records.at(-1);
  if (final === undefined || final.event !== "worker-stopped" || final.terminalState !== "registered-cap") {
    fail("radial registered cap lacks its exact terminal worker-progress row");
  }
  const retainedCandidateBytes = safeIntegerSum(scanned
    .filter((entry) => entry.identity.path.startsWith(
      `${candidate.lifecycle.preflight.observed.candidateDirectory}/`,
    ) && entry.identity.path !== ledgerCandidatePath)
    .map((entry) => entry.identity.byteLength), "radial retained candidate bytes");
  const invocation = capped[0]!;
  return Object.freeze({
    capId: candidate.lifecycle.registeredCap.conditionId,
    registeredLimit: invocation.registeredWallSecondsMaximum,
    observedValue: invocation.wallSeconds,
    unit: "seconds",
    cappedInvocationId: invocation.invocationId,
    cappedInvocationClass: invocation.invocationClass,
    invocationStartedAt: invocation.startedAt,
    invocationStoppedAt: invocation.finishedAt,
    invocationElapsedNanoseconds: invocation.elapsedNanoseconds,
    rosterCaseIds: packet.workerProgressContract.caseOrder,
    startedCaseIds: final.startedCaseIds,
    completedCaseIds: final.completedCaseIds,
    activeCaseId: final.activeCaseId,
    completedNumericFieldValueCount: final.completedNumericFieldValueCount,
    completedUniformFieldValueCount: final.completedUniformFieldValueCount,
    retainedCandidateBytes,
    acceptedValidWitnessProduced: false,
  });
}

function assertRadialProgressCandidate(
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
  scanned: readonly Phase10C0VS6ReopenedPublishedArtifact[],
  progress: Phase10C0VS6WorkerProgress | null,
): void {
  if (progress === null) return;
  const final = progress.records.at(-1);
  if (final === undefined) fail("radial worker progress lacks its final row");
  const witnessPath = `${candidate.lifecycle.preflight.observed.candidateDirectory}/c0v-radial-witness.bin`;
  const witnesses = scanned.filter((entry) => entry.identity.path === witnessPath);
  if (witnesses.length > 1) fail("radial candidate witness repeats in the attempt census");
  if (witnesses.length === 0) {
    if (final.candidateByteLength !== 0 || final.candidateSha256 !== null) {
      fail("radial progress claims a candidate witness absent from the attempt census");
    }
    return;
  }
  if (final.candidateByteLength !== witnesses[0]!.identity.byteLength ||
    final.candidateSha256 !== witnesses[0]!.identity.sha256) {
    fail("radial progress candidate identity differs from the retained witness bytes");
  }
}

function produceClassificationValidation(
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
  tuple: Phase10C0VS6PacketProtocol["executionRecordTuples"][number],
  partialExecution: Phase10C0VS6PartialExecution | null,
): Phase10C0VS6ClassificationValidation | null {
  if (candidate.lifecycle.dispositionCode === "production-complete") return null;
  const cause = candidate.lifecycle.causeEvaluation;
  if (cause === null) fail("non-production produce route lacks its raw-derived cause projection");
  const projections = candidate.lifecycle.packet.classificationProjectionRosters.filter((entry) =>
    entry.subrouteId === candidate.lifecycle.selectedSubrouteId);
  if (projections.length !== 1) fail("selected produce route lacks one classification projection roster");
  const projection = projections[0]!;
  if (projection.componentEvaluatorCallableIds[0] !== cause.evaluatorCallableId ||
    cause.selectedSubrouteId !== candidate.lifecycle.selectedSubrouteId ||
    cause.dispositionCode !== candidate.lifecycle.dispositionCode) {
    fail("raw cause differs from selected produce classification projection");
  }
  const numericalLeaves = candidate.lifecycle.produceInvocationRecords.filter((entry) =>
    entry.invocationClass === "solver-production" || entry.invocationClass === "numerical-evaluator" ||
    entry.invocationClass === "numerical-negative-control");
  const zeroScientificExecution = numericalLeaves.length === 0;
  const expectedZeroScientificExecution = candidate.lifecycle.dispositionCode ===
    "registered-cap-resource-refusal"
    ? candidate.lifecycle.produceInvocationRecords.some((entry) =>
      entry.terminalState === "registered-cap" && entry.invocationClass === "route-cause-evaluator")
    : true;
  if (zeroScientificExecution !== expectedZeroScientificExecution ||
    (partialExecution !== null) !== (candidate.lifecycle.dispositionCode === "registered-cap-resource-refusal")) {
    fail("produce classification zero-science/partial state differs from raw invocation authority");
  }
  return Object.freeze({
    validationId: projection.validationId,
    assemblerCallableId: projection.assemblerCallableId,
    componentEvaluatorCallableIds: projection.componentEvaluatorCallableIds,
    method: projection.method,
    validatedDispositionCode: candidate.lifecycle.dispositionCode,
    observations: Object.freeze(cause.observations.map((entry) => Object.freeze({
      conditionId: entry.conditionId,
      kind: entry.kind,
      comparator: entry.comparator,
      registeredValue: entry.registeredValue,
      observedValue: entry.observedValue,
      unit: entry.unit,
      conditionPassed: entry.routeConditionMatched,
      evidenceIds: entry.evidenceIds,
    }))),
    evidence: cause.evidence,
    zeroScientificExecution,
    partialExecutionMatched: true,
    acceptedValidWitnessAbsent: tuple.record.acceptedValidWitnessCount === 0,
    acceptedNumericalVerdictAbsent: tuple.record.acceptedNumericalVerdictCount === 0,
    // This constructor is reachable only for a non-production disposition. A radial cap in the
    // third control may retain all three attempted invocation records, but the capped campaign did
    // not complete and earns no numerical-negative-control campaign credit.
    completedNumericalNegativeControlCampaignCreditAbsent: true,
    verdict: "pass",
    errors: Object.freeze([]),
  });
}

function constructMatchOnlyAttempt(
  root: Phase10C0VS6PhysicalRoot,
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
  scanned: readonly Phase10C0VS6ReopenedPublishedArtifact[],
): Phase10C0VS6AttemptRowV2 {
  const packet = candidate.lifecycle.packet;
  if (packet.packetId !== "c0v-moving-produce" && packet.packetId !== "c0v-static-produce") {
    fail("match-only attempt constructor received another packet");
  }
  const label = packet.packetId === "c0v-moving-produce" ? "moving" : "static";
  const preflight = candidate.lifecycle.preflight;
  const scope = produceAttemptScope(packet.packetId);
  if (packet.bindings.scienceProtocol === null || packet.bindings.referenceOrRefusal === null) {
    fail(`${label} packet lacks its exact science/reference bindings`);
  }
  const tuples = packet.executionRecordTuples.filter((entry) =>
    entry.tupleId === candidate.lifecycle.selectedSubrouteId &&
    entry.dispositionCode === candidate.lifecycle.dispositionCode);
  if (tuples.length !== 1) fail(`${label} lifecycle route lacks one exact execution tuple`);
  const tuple = tuples[0]!;
  const ledgerFilename = produceLedgerFilename(packet, candidate.lifecycle.selectedSubrouteId);
  const ledgerCandidatePath = `${preflight.observed.candidateDirectory}/${ledgerFilename}`;
  const expectedAttemptPaths = exactExpectedAttemptPaths(
    packet,
    preflight,
    candidate.lifecycle.selectedSubrouteId,
  ).filter((path) => path !== ledgerCandidatePath);
  exactRoster(scanned.map((entry) => entry.identity.path), expectedAttemptPaths,
    `${label} pre-ledger attempt-root census`);
  const resourceRosters = packet.resourceObservationPointRosters.filter((entry) =>
    entry.tupleId === tuple.tupleId);
  if (resourceRosters.length !== 1 || resourceRosters[0]!.observationPointIds.length !== 1) {
    fail(`${label} tuple lacks the sole terminal-retention observation point`);
  }
  const workerTiming = produceWorkerTiming(
    root,
    candidate,
  );
  phase10C0VS6SameJson(
    workerTiming?.invocationRecords ?? Object.freeze([]),
    candidate.lifecycle.produceInvocationRecords,
    `${label} raw worker timing versus lifecycle invocation records`,
  );
  const noWorkerInstant = new Date().toISOString();
  const startedAt = workerTiming?.workerStartedAt ?? noWorkerInstant;
  const finishedAt = workerTiming?.workerStoppedAt ?? noWorkerInstant;
  const artifacts = Object.freeze(scanned.map((entry) => entry.identity));
  const concurrentBytes = safeIntegerSum(artifacts.map((entry) => entry.byteLength),
    `${label} terminal retained bytes`);
  const resourceRecord: Phase10C0VS6ResourceRecord = Object.freeze({
    schema: "phase10-c0v-resource-record-v1",
    registeredObservationPointIds: resourceRosters[0]!.observationPointIds,
    observations: Object.freeze([Object.freeze({
      observationId: resourceRosters[0]!.observationPointIds[0]!,
      observedAt: finishedAt,
      artifacts,
      concurrentBytes,
    })]),
    maximumObservedConcurrentBytes: concurrentBytes,
    maximumObservationId: resourceRosters[0]!.observationPointIds[0]!,
    terminalRetainedBytes: concurrentBytes,
    excludedLedgerPath: ledgerCandidatePath,
  });
  const partialExecution = movingPartialExecution(candidate, scanned, ledgerCandidatePath);
  const elapsed = safeIntegerSum(candidate.lifecycle.produceInvocationRecords.map((entry) =>
    entry.elapsedNanoseconds), `${label} governed invocation elapsed nanoseconds`);
  const classificationValidation = produceClassificationValidation(candidate, tuple, partialExecution);
  const run = packet.commandTemplates.filter((entry) => entry.commandId === "run");
  if (run.length !== 1) fail(`${label} packet lacks one exact run command`);
  const attempt = parsePhase10C0VS6AttemptRowV2(Object.freeze({
    schema: "phase10-c0v-attempt-row-v2" as const,
    attemptId: packet.registeredAttemptId,
    layerId: scope.layerId,
    branch: scope.branch,
    protocol: packet.bindings.scienceProtocol,
    referenceOrRefusal: packet.bindings.referenceOrRefusal,
    runtime: preflight.observed.runtime,
    command: run[0]!.command,
    gitHead: preflight.observed.head,
    startedAt,
    finishedAt,
    wallSeconds: (Date.parse(finishedAt) - Date.parse(startedAt)) / 1_000,
    processHours: elapsed / 3_600_000_000_000,
    processConcurrency: 1 as const,
    scratchBytes: concurrentBytes,
    retainedBytes: concurrentBytes,
    terminalStatus: "refusal" as const,
    dispositionCode: candidate.lifecycle.dispositionCode,
    exitCode: candidate.lifecycle.exitStatus.exitCode,
    preflight: candidate.lifecycle.preflightIdentity,
    stdout: artifactFromAttemptScan(scanned, preflight.observed.stdoutPath, `${label} stdout`),
    stderr: artifactFromAttemptScan(scanned, preflight.observed.stderrPath, `${label} stderr`),
    terminalCandidate: candidate.candidateIdentity,
    executableInvocationRecords: candidate.lifecycle.produceInvocationRecords,
    workerProgress: null,
    resourceRecord,
    executionRecord: Object.freeze({
      ...tuple.record,
      governedInvocationElapsedNanoseconds: elapsed,
      governedInvocationWallSeconds: elapsed / 1_000_000_000,
    }),
    partialExecution,
    classificationValidation,
  }), `raw-derived ${label} attempt`);
  phase10C0VS6ValidateRegisteredExecutionRecordTuple(attempt, packet.executionRecordTuples);
  return attempt;
}

function constructRadialAttempt(
  root: Phase10C0VS6PhysicalRoot,
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
  scanned: readonly Phase10C0VS6ReopenedPublishedArtifact[],
): Phase10C0VS6AttemptRowV2 {
  const packet = candidate.lifecycle.packet;
  if (packet.packetId !== "c0v-radial-produce") fail("radial attempt constructor received another packet");
  const preflight = candidate.lifecycle.preflight;
  const scope = produceAttemptScope(packet.packetId);
  if (packet.bindings.scienceProtocol === null || packet.bindings.referenceOrRefusal === null) {
    fail("radial packet lacks its exact science/reference bindings");
  }
  const tuples = packet.executionRecordTuples.filter((entry) =>
    entry.tupleId === candidate.lifecycle.selectedSubrouteId &&
    entry.dispositionCode === candidate.lifecycle.dispositionCode);
  if (tuples.length !== 1) fail("radial lifecycle route lacks one exact execution tuple");
  const tuple = tuples[0]!;
  const ledgerFilename = produceLedgerFilename(packet, candidate.lifecycle.selectedSubrouteId);
  const ledgerCandidatePath = `${preflight.observed.candidateDirectory}/${ledgerFilename}`;
  const expectedAttemptPaths = exactExpectedAttemptPaths(
    packet,
    preflight,
    candidate.lifecycle.selectedSubrouteId,
  ).filter((path) => path !== ledgerCandidatePath);
  exactRoster(
    scanned.map((entry) => entry.identity.path),
    expectedAttemptPaths,
    "radial pre-ledger attempt-root census",
  );
  assertRadialReproofAttemptCensus(candidate, scanned);
  const resourceRosters = packet.resourceObservationPointRosters.filter((entry) =>
    entry.tupleId === tuple.tupleId);
  if (resourceRosters.length !== 1 || resourceRosters[0]!.observationPointIds.length !== 1) {
    fail("radial tuple lacks the sole terminal-retention observation point");
  }
  const workerTiming = produceWorkerTiming(root, candidate);
  const rawProgress = reopenRadialWorkerProgress(root, candidate);
  if ((workerTiming === null) !== (rawProgress === null) ||
    (workerTiming === null) !== (candidate.lifecycle.produceInvocationRecords.length === 0)) {
    fail("radial worker timing/progress nullability differs from the raw invocation roster");
  }
  phase10C0VS6SameJson(
    workerTiming?.invocationRecords ?? Object.freeze([]),
    candidate.lifecycle.produceInvocationRecords,
    "radial raw worker timing versus lifecycle invocation records",
  );
  assertRadialProgressCandidate(candidate, scanned, rawProgress?.progress ?? null);
  const noWorkerInstant = new Date().toISOString();
  const startedAt = workerTiming?.workerStartedAt ?? noWorkerInstant;
  const finishedAt = workerTiming?.workerStoppedAt ?? noWorkerInstant;
  const artifacts = Object.freeze(scanned.map((entry) => entry.identity));
  const concurrentBytes = safeIntegerSum(
    artifacts.map((entry) => entry.byteLength),
    "radial terminal retained bytes",
  );
  const resourceRecord: Phase10C0VS6ResourceRecord = Object.freeze({
    schema: "phase10-c0v-resource-record-v1",
    registeredObservationPointIds: resourceRosters[0]!.observationPointIds,
    observations: Object.freeze([Object.freeze({
      observationId: resourceRosters[0]!.observationPointIds[0]!,
      observedAt: finishedAt,
      artifacts,
      concurrentBytes,
    })]),
    maximumObservedConcurrentBytes: concurrentBytes,
    maximumObservationId: resourceRosters[0]!.observationPointIds[0]!,
    terminalRetainedBytes: concurrentBytes,
    excludedLedgerPath: ledgerCandidatePath,
  });
  const partialExecution = radialPartialExecution(
    candidate,
    scanned,
    ledgerCandidatePath,
    rawProgress?.progress ?? null,
  );
  const elapsed = safeIntegerSum(
    candidate.lifecycle.produceInvocationRecords.map((entry) => entry.elapsedNanoseconds),
    "radial governed invocation elapsed nanoseconds",
  );
  const classificationValidation = produceClassificationValidation(candidate, tuple, partialExecution);
  const run = packet.commandTemplates.filter((entry) => entry.commandId === "run");
  if (run.length !== 1) fail("radial packet lacks one exact run command");
  const terminalStatus = candidate.lifecycle.terminalState === "scientific-pass"
    ? "pass" as const
    : candidate.lifecycle.terminalState === "scientific-fail"
      ? "fail" as const
      : "refusal" as const;
  const attempt = parsePhase10C0VS6AttemptRowV2(Object.freeze({
    schema: "phase10-c0v-attempt-row-v2" as const,
    attemptId: packet.registeredAttemptId,
    layerId: scope.layerId,
    branch: scope.branch,
    protocol: packet.bindings.scienceProtocol,
    referenceOrRefusal: packet.bindings.referenceOrRefusal,
    runtime: preflight.observed.runtime,
    command: run[0]!.command,
    gitHead: preflight.observed.head,
    startedAt,
    finishedAt,
    wallSeconds: (Date.parse(finishedAt) - Date.parse(startedAt)) / 1_000,
    processHours: elapsed / 3_600_000_000_000,
    processConcurrency: 1 as const,
    scratchBytes: concurrentBytes,
    retainedBytes: concurrentBytes,
    terminalStatus,
    dispositionCode: candidate.lifecycle.dispositionCode,
    exitCode: candidate.lifecycle.exitStatus.exitCode,
    preflight: candidate.lifecycle.preflightIdentity,
    stdout: artifactFromAttemptScan(scanned, preflight.observed.stdoutPath, "radial stdout"),
    stderr: artifactFromAttemptScan(scanned, preflight.observed.stderrPath, "radial stderr"),
    terminalCandidate: candidate.candidateIdentity,
    executableInvocationRecords: candidate.lifecycle.produceInvocationRecords,
    workerProgress: rawProgress?.progress ?? null,
    resourceRecord,
    executionRecord: Object.freeze({
      ...tuple.record,
      governedInvocationElapsedNanoseconds: elapsed,
      governedInvocationWallSeconds: elapsed / 1_000_000_000,
    }),
    partialExecution,
    classificationValidation,
  }), "raw-derived radial attempt");
  const selectedTuple = phase10C0VS6ValidateRegisteredExecutionRecordTuple(
    attempt,
    packet.executionRecordTuples,
  );
  const invocationRoster = phase10C0VS6ValidateRegisteredExecutableInvocationRoster(
    attempt,
    selectedTuple,
    packet.executableInvocationRosters,
  );
  if (workerTiming !== null && rawProgress !== null && packet.workerProgressContract !== null) {
    const evaluatedProgress = independentlyEvaluatePhase10C0VS6WorkerProgress(
      attempt,
      packet.workerProgressContract,
      invocationRoster,
      workerTiming,
      partialExecution === null
        ? null
        : Object.freeze({
            capId: partialExecution.capId,
            retainedCandidateBytes: partialExecution.retainedCandidateBytes,
          }),
    );
    phase10C0VS6SameJson(
      evaluatedProgress.partialExecution,
      partialExecution,
      "radial independently rederived partial execution",
    );
    if (evaluatedProgress.terminalState !== (partialExecution === null ? "complete" : "registered-cap")) {
      fail("radial worker-progress terminal state differs from selected attempt route");
    }
  }
  return attempt;
}

function independentlyConstructProduceExecution(
  packet: Phase10C0VS6PacketProtocol,
  selectedSubrouteId: string,
  preflight: Phase10C0VS6RetainedPreflight,
  callerRows: readonly Phase10C0VS6CallerInvocationResult[],
  timing: Phase10C0VS6PacketGovernedTiming,
  root: Phase10C0VS6PhysicalRoot,
): Phase10C0VS6EvaluatorExecutionProvenance | null {
  if (phase10C0VS6VerificationExecutionIsNull(
    packet,
    selectedSubrouteId,
    `${packet.packetId} constructed verification execution`,
  )) return null;
  const callers = callerRows.filter((entry) => entry.terminalState === "complete" &&
    timing.invocationRecords.some((invocation) =>
      invocation.callableId === entry.callerCallableId || invocation.callableId === entry.evaluatorCallableId));
  if (callers.length !== 1) fail("produce verification lacks one exact governed caller/evaluator result");
  const registryBytes = phase10C0VS6ReadUniquePhysicalFile(root, packet.bindings.callableRegistry.path);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(packet.bindings.callableRegistry.path, registryBytes),
    packet.bindings.callableRegistry,
    "produce finalizer callable registry",
  );
  const registry = parsePhase10C0VS6CallableRegistry(
    parsePhase10C0VS6PrettyJsonBytes(registryBytes, "produce finalizer callable registry"),
  );
  const bindings = registry.callables.filter((entry) =>
    entry.callableId === callers[0]!.evaluatorCallableId && entry.role === "independent-evaluator");
  if (bindings.length !== 1) fail("produce evaluator does not resolve one exact registry binding");
  const binding = bindings[0]!;
  const implementation = readArtifact(root, binding.modulePath, null, "produce evaluator implementation");
  if (binding.identity !== null && (binding.identity.byteLength !== implementation.identity.byteLength ||
    binding.identity.sha256 !== implementation.identity.sha256)) {
    fail("produce registered evaluator identity differs from live implementation bytes");
  }
  phase10C0VS6AssertCallableRegistration(root.path, {
    callableId: binding.callableId,
    modulePath: binding.modulePath,
    exportName: binding.exportName,
    identity: implementation.identity,
  });
  const timed = timing.invocationRecords.filter((entry) =>
    entry.callableId === callers[0]!.callerCallableId || entry.callableId === callers[0]!.evaluatorCallableId);
  if (timed.length !== 1) fail("produce governed caller does not resolve one parent-owned timing interval");
  const run = packet.commandTemplates.filter((entry) => entry.commandId === "run");
  if (run.length !== 1) fail("produce packet lacks one exact run command");
  return deriveExecution(Object.freeze({ execution: strictJsonSnapshot(Object.freeze({
    evaluatorCallableId: binding.callableId,
    modulePath: binding.modulePath,
    exportName: binding.exportName,
    byteLength: implementation.identity.byteLength,
    sha256: implementation.identity.sha256,
    runtime: preflight.observed.runtime,
    command: run[0]!.command,
    gitHead: preflight.observed.head,
    startedOn: timed[0]!.startedAt,
    endedOn: timed[0]!.finishedAt,
    processConcurrency: packet.resources.processConcurrency,
  })) }), packet, selectedSubrouteId, preflight, callerRows, timing, root);
}

function currentProducePublicationArtifacts(
  authority: ReopenedAuthority,
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
  ledgerIdentity: Phase10C0VS6ArtifactIdentity,
  ledgerBytes: Uint8Array,
): readonly Phase10C0VS6ReopenedPublishedArtifact[] {
  const packet = candidate.lifecycle.packet;
  const rows: Phase10C0VS6ReopenedPublishedArtifact[] = [];
  for (const identity of [candidate.lifecycle.preflightIdentity, ledgerIdentity]) {
    const outputs = packet.terminalSubroutes
      .find((entry) => entry.subrouteId === candidate.lifecycle.selectedSubrouteId)!
      .requiredOutputIds.filter((outputId) =>
        outputDefinition(authority.matrix, packet.packetId, outputId).artifact.path === identity.path);
    if (outputs.length !== 1) fail(`${identity.path} does not resolve one current produce output`);
    const bytes = identity.path === ledgerIdentity.path
      ? new Uint8Array(ledgerBytes)
      : readArtifact(authority.root, identity.path, identity, `${outputs[0]} current publication`).bytes;
    phase10C0VS6SameIdentity(
      phase10C0VS6ArtifactIdentity(identity.path, bytes),
      identity,
      `${outputs[0]} in-memory current publication`,
    );
    rows.push(Object.freeze({
      artifactRole: "published-output",
      outputId: outputs[0]!,
      identity,
      bytes,
    }));
  }
  return Object.freeze(rows.sort((left, right) => codePointCompare(left.identity.path, right.identity.path)));
}

function currentCandidatePublicationArtifacts(
  authority: ReopenedAuthority,
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
): readonly Phase10C0VS6ReopenedPublishedArtifact[] {
  const packet = candidate.lifecycle.packet;
  const subroute = packet.terminalSubroutes.find((entry) =>
    entry.subrouteId === candidate.lifecycle.selectedSubrouteId);
  const decision = packet.terminalCandidateContract.decisionRosters.find((entry) =>
    entry.subrouteId === candidate.lifecycle.selectedSubrouteId);
  if (subroute === undefined || decision === undefined) {
    fail("moving publication route lacks its exact output/candidate authority");
  }
  const rows: Phase10C0VS6ReopenedPublishedArtifact[] = [];
  const filenames = packet.candidateFilenameRosters[candidate.lifecycle.selectedSubrouteId];
  if (filenames === undefined) fail("selected route lacks a candidate filename roster");
  for (const outputId of decision.candidateProducedOutputIds) {
    const definition = outputDefinition(authority.matrix, packet.packetId, outputId);
    let bytes: Uint8Array;
    if (definition.artifact.path === candidate.lifecycle.preflightIdentity.path) {
      bytes = readArtifact(
        authority.root,
        definition.artifact.path,
        candidate.lifecycle.preflightIdentity,
        `${packet.packetId} retained preflight publication`,
      ).bytes;
    } else {
      const filename = basename(definition.artifact.path);
      const matches = filenames.filter((entry) => entry === filename);
      // Science/reference bindings are already tracked immutable inputs and do not create a new
      // physical publication copy. They remain verified outputs, but are outside current packet
      // materialized-publication byte accounting.
      if (matches.length === 0) continue;
      if (matches.length !== 1) fail(`${outputId} repeats its selected candidate filename`);
      bytes = readArtifact(
        authority.root,
        `${candidate.lifecycle.preflight.observed.candidateDirectory}/${filename}`,
        null,
        `${outputId} current candidate publication`,
      ).bytes;
    }
    rows.push(Object.freeze({
      artifactRole: "published-output",
      outputId,
      identity: phase10C0VS6ArtifactIdentity(definition.artifact.path, bytes),
      bytes: new Uint8Array(bytes),
    }));
  }
  const ordered = Object.freeze(rows.sort((left, right) => codePointCompare(left.identity.path, right.identity.path)));
  exactRoster(
    ordered.map((entry) => entry.outputId!).sort(codePointCompare),
    decision.candidateProducedOutputIds.filter((outputId) => {
      const path = outputDefinition(authority.matrix, packet.packetId, outputId).artifact.path;
      return path === candidate.lifecycle.preflightIdentity.path || filenames.includes(basename(path));
    }).sort(codePointCompare),
    `${packet.packetId} in-memory candidate publication roster`,
  );
  for (const row of ordered) {
    if (!subroute.requiredOutputIds.includes(row.outputId!)) {
      fail(`${row.outputId} is not required by the selected moving publication route`);
    }
  }
  return ordered;
}

function mergeCurrentPublicationArtifacts(
  ...groups: readonly (readonly Phase10C0VS6ReopenedPublishedArtifact[])[]
): readonly Phase10C0VS6ReopenedPublishedArtifact[] {
  const rows = new Map<string, Phase10C0VS6ReopenedPublishedArtifact>();
  for (const entry of groups.flat()) {
    const prior = rows.get(entry.identity.path);
    if (prior === undefined) {
      rows.set(entry.identity.path, entry);
      continue;
    }
    if (prior.outputId !== entry.outputId || prior.artifactRole !== entry.artifactRole ||
      !sameBytes(prior.bytes, entry.bytes)) {
      fail(`${entry.identity.path} has conflicting current publication projections`);
    }
    phase10C0VS6SameIdentity(
      entry.identity,
      prior.identity,
      `${entry.identity.path} repeated current publication projection`,
    );
  }
  return Object.freeze([...rows.values()].sort((left, right) =>
    codePointCompare(left.identity.path, right.identity.path)));
}

function publishCandidatePublicationArtifacts(
  input: Phase10C0VS6LockedRawFinalizationInput,
  authority: ReopenedAuthority,
  candidate: Phase10C0VS6RawTerminalCandidateProjection,
  projected: readonly Phase10C0VS6ReopenedPublishedArtifact[],
): readonly Phase10C0VS6ReopenedPublishedArtifact[] {
  const packet = candidate.lifecycle.packet;
  return Object.freeze(projected.map((entry) => {
    if (entry.identity.path === candidate.lifecycle.preflightIdentity.path) return entry;
    const identity = publishFreshBytes(
      input,
      authority.root,
      packet,
      entry.identity.path,
      entry.bytes,
      null,
    );
    phase10C0VS6SameIdentity(identity, entry.identity, `${entry.outputId} candidate publication output`);
    const reopened = readArtifact(
      authority.root,
      identity.path,
      identity,
      `${entry.outputId} freshly published candidate output`,
    );
    return Object.freeze({ ...entry, identity: reopened.identity, bytes: reopened.bytes });
  }));
}

interface Phase10C0VS6MatchOnlyFinalizationConfig {
  readonly packetId: "c0v-moving-produce" | "c0v-static-produce";
  readonly label: "moving" | "static";
  readonly writeAttempt: typeof writePhase10C0VMovingAttemptReceipt;
}

const MOVING_FINALIZATION_CONFIG: Phase10C0VS6MatchOnlyFinalizationConfig = Object.freeze({
  packetId: "c0v-moving-produce",
  label: "moving",
  writeAttempt: writePhase10C0VMovingAttemptReceipt,
});

const STATIC_FINALIZATION_CONFIG: Phase10C0VS6MatchOnlyFinalizationConfig = Object.freeze({
  packetId: "c0v-static-produce",
  label: "static",
  writeAttempt: writePhase10C0VStaticAttemptReceipt,
});

/**
 * Raw one-way match-only finalizer. The caller supplies only active lock/watchdog authority and
 * the exact JSON-only result captured from the governed layer check-caller leaf. Route, attempt,
 * resources, classification, post-candidate callers, verification, accounting, and terminal state
 * are derived from reopened bytes. The ledger remains in memory until census/resource pass.
 */
function independentlyFinalizePhase10C0VS6MatchOnlyProducePacket(
  input: Phase10C0VS6LockedRawFinalizationInput,
  config: Phase10C0VS6MatchOnlyFinalizationConfig,
): Phase10C0VS6FinalizedMovingProducePacket {
  const root = phase10C0VS6PhysicalRepositoryRoot(input.repositoryRoot);
  assertActiveFinalizationAuthority(input, root);
  phase10C0VS6SameIdentity(
    input.lockedAuthority.packetProtocolIdentity,
    input.packetProtocolIdentity,
    `${config.label} finalizer locked packet protocol`,
  );
  if (!sameBytes(input.lockedAuthority.packetProtocolBytes, input.packetProtocolBytes)) {
    fail(`${config.label} finalizer packet bytes differ from active locked authority`);
  }
  const retained = derivePhase10C0VS6RetainedRuntimeAuthority(input);
  const packet = retained.packet;
  if (packet.packetId !== config.packetId || input.lockedAuthority.packet.packetId !== packet.packetId ||
    input.lockedAuthority.packet.protocolId !== packet.protocolId ||
    input.lockedAuthority.packet.registeredAttemptId !== packet.registeredAttemptId) {
    fail(`${config.label} finalizer received a different packet/locked authority`);
  }
  const priorPrefix = independentlyReopenPhase10C0VS6VerifiedProduceDependencies(input);
  exactRoster(priorPrefix.selectedPackets.map((entry) => entry.packet.packetId),
    chronologicalPriorPacketIds(input.lockedAuthority.catalogue, packet.packetId),
    `${config.label} finalizer deeply verified dependency prefix`);
  const authority = reopenCurrentPacketAuthority(input, packet, retained.preflight);
  const materialized = independentlyMaterializePhase10C0VS6TerminalCandidate(
    input,
    input.capturedGovernedCallerResult,
  );
  if (existsSync(resolve(root.path, materialized.candidatePath))) {
    fail(`${config.label} terminal candidate existed before current raw finalization`);
  }
  const candidate = materialized;
  const scanned = projectTerminalCandidateIntoAttemptScan(
    scanAttemptRoot(root, retained.preflight.observed.attemptDirectory),
    candidate,
  );
  assertAttemptRootByteLimits(authority.catalogue, candidate, scanned);
  const attempt = constructMatchOnlyAttempt(root, candidate, scanned);
  const attemptReceipt = config.writeAttempt({
    packetProtocolBytes: input.packetProtocolBytes,
    packetProtocolIdentity: input.packetProtocolIdentity,
    attempt,
  });
  const postCandidate = postCandidateCallerResults(
    input,
    candidate,
    attemptReceipt.identity,
    attemptReceipt.bytes,
  );
  const callerRows = Object.freeze([
    ...candidate.candidate.callerInvocationResults,
    ...postCandidate,
  ]);
  const callerRosters = packet.terminalReceiptContract.callerInvocationResultRosters.filter((entry) =>
    entry.subrouteId === candidate.lifecycle.selectedSubrouteId);
  if (callerRosters.length !== 1) fail(`${config.label} selected route lacks one full caller roster`);
  exactRoster(callerRows.map((entry) => entry.callerInvocationId),
    callerRosters[0]!.callerInvocationResults.map((entry) => entry.callerInvocationId),
    `${config.label} full caller invocation roster`);

  const ledgerPath = attemptReceipt.identity.path;
  const ledgerIdentity = assertFreshPublicationBytes(
    root,
    packet,
    ledgerPath,
    attemptReceipt.bytes,
    null,
  );
  phase10C0VS6SameIdentity(ledgerIdentity, attemptReceipt.identity, `${config.label} projected attempt ledger`);
  const inMemoryRows = parsePhase10C0VS6AttemptLedgerV2(
    attemptReceipt.bytes,
    `${config.label} in-memory attempt ledger`,
  );
  if (inMemoryRows.length !== 1) fail(`${config.label} in-memory ledger does not contain its sole attempt`);
  phase10C0VS6SameJson(inMemoryRows[0]!, attempt, `${config.label} in-memory ledger attempt row`);
  const publicationArtifacts = currentProducePublicationArtifacts(
    authority,
    candidate,
    ledgerIdentity,
    attemptReceipt.bytes,
  );
  const subroutes = packet.terminalSubroutes.filter((entry) =>
    entry.subrouteId === candidate.lifecycle.selectedSubrouteId);
  if (subroutes.length !== 1) fail(`${config.label} selected lifecycle route disappeared from packet authority`);
  const subroute = subroutes[0]!;
  const acceptedPacketCredit = subroute.requiredOutputIds.some((entry) => entry.endsWith("-verification"));

  let verification: Phase10C0VS6PacketVerificationV2 | null = null;
  let verificationIdentity: Phase10C0VS6ArtifactIdentity | null = null;
  let verificationBytes: Uint8Array | null = null;
  let verificationAuthority: Phase10C0VS6PacketVerificationV2Authority | null = null;
  if (acceptedPacketCredit) {
    const timing = packetGovernedTiming(packet, candidate, ledgerIdentity, attempt);
    const packetResources = packetResourceAccounting(
      packet,
      candidate,
      attempt,
      ledgerIdentity,
      scanned,
      publicationArtifacts,
    );
    const processAccounting = packageProcessAccounting(
      authority.catalogue,
      packet,
      timing,
      priorPrefix.selectedPackets,
    );
    const packageResources = packageResourceAccounting(
      root,
      packet,
      processAccounting,
      packetResources,
      priorPrefix.selectedPackets,
    );
    const verifiedArtifacts = deriveCurrentVerifiedArtifacts(authority, candidate, publicationArtifacts);
    const checkResults = deriveCheckResults(authority.matrix, packet, candidate.lifecycle.selectedSubrouteId, callerRows);
    const execution = independentlyConstructProduceExecution(
      packet,
      candidate.lifecycle.selectedSubrouteId,
      retained.preflight,
      callerRows,
      timing,
      root,
    );
    verificationAuthority = Object.freeze({
      selectedSubrouteId: candidate.lifecycle.selectedSubrouteId,
      verifiedArtifacts,
      checkResults,
      executedNegativeControlIds: Object.freeze([]),
      negativeControlResults: Object.freeze([]),
      execution,
      callerInvocationResults: callerRows,
      governedTiming: timing,
      packageProcessAccounting: processAccounting,
      packetResourceAccounting: packetResources,
      packageResourceAccounting: packageResources,
    });
    const value = Object.freeze({
      schema: "phase10-packet-verification-v2" as const,
      verificationId: `phase10-${packet.packetId}-${packet.registeredAttemptId}-verification-v2`,
      matrixId: authority.matrix.matrixId,
      protocolId: packet.protocolId,
      registryId: packet.registryId,
      packetId: packet.packetId,
      terminalState: "complete" as const,
      verifiedArtifacts,
      checkResults,
      executedNegativeControlIds: Object.freeze([]),
      negativeControlResults: Object.freeze([]),
      boundDependencyPacketIds: packet.boundDependencyPacketIds,
      execution,
      callerInvocationResults: callerRows,
      governedTiming: timing,
      packageProcessAccounting: processAccounting,
      packetResourceAccounting: packetResources,
      packageResourceAccounting: packageResources,
      aggregateVerdict: "pass" as const,
      limits: packet.claimBoundary.forbidden,
    });
    verificationBytes = writePhase10C0VS6PacketVerificationReceipt(value, packet, verificationAuthority);
    const projection = finalizationProjection(packet, "packet-verification");
    verificationIdentity = assertFreshPublicationBytes(
      root,
      packet,
      projection.path,
      verificationBytes,
      projection.maximumByteLength,
    );
    verification = parsePhase10C0VS6PacketVerificationV2Bytes(
      verificationBytes,
      packet,
      verificationAuthority,
    );
  }

  const reasons = terminalReasonCodes(candidate, acceptedPacketCredit);
  const terminalAuthority: Phase10C0VS6TerminalReceiptAuthority = Object.freeze({
    selectedSubrouteId: candidate.lifecycle.selectedSubrouteId,
    terminalState: candidate.lifecycle.terminalState,
    preflight: candidate.lifecycle.preflightIdentity,
    terminalCandidate: candidate.candidateIdentity,
    attemptLedger: ledgerIdentity,
    packetVerification: verificationIdentity,
    invocationRecords: Object.freeze([]),
    callerInvocationResults: callerRows,
    registeredCap: candidate.lifecycle.registeredCap,
    reasons,
  });
  const terminalValue = Object.freeze({
    schema: packet.terminalReceiptContract.receiptSchema,
    receiptId: `phase10-${packet.packetId}-${packet.registeredAttemptId}-terminal-v2`,
    matrixId: authority.matrix.matrixId,
    protocolId: packet.protocolId,
    registryId: packet.registryId,
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    terminalState: candidate.lifecycle.terminalState,
    dispositionCode: candidate.lifecycle.dispositionCode,
    preflight: candidate.lifecycle.preflightIdentity,
    terminalCandidate: candidate.candidateIdentity,
    attemptLedger: ledgerIdentity,
    packetVerification: verificationIdentity,
    producedOutputIds: subroute.requiredOutputIds,
    executedCheckIds: subroute.requiredCheckIds,
    executedNegativeControlIds: subroute.requiredNegativeControlIds,
    invocationRecords: Object.freeze([]),
    callerInvocationResults: callerRows,
    registeredCap: candidate.lifecycle.registeredCap,
    acceptedPacketCredit,
    dependencyValid: acceptedPacketCredit,
    verdict: acceptedPacketCredit ? "complete" as const : "refusal" as const,
    reasons,
  });
  const terminalBytes = writePhase10C0VS6TerminalReceipt(terminalValue, packet, terminalAuthority);
  const terminalProjection = finalizationProjection(packet, "terminal-receipt");
  if (terminalProjection.path !== packet.paths.terminalReceiptPath) {
    fail(`${config.label} terminal finalization path differs from packet terminal path`);
  }
  const terminalIdentity = assertFreshPublicationBytes(
    root,
    packet,
    terminalProjection.path,
    terminalBytes,
    terminalProjection.maximumByteLength,
  );
  let terminal = parsePhase10C0VS6TerminalReceiptV2Bytes(
    terminalBytes,
    packet,
    terminalAuthority,
  );

  // No claim-bearing row is written until every downstream structure has independently parsed
  // and the closed-world packet census is still exact. A structural refusal therefore retains
  // only raw ignored attempt artifacts and stale locks, never a terminal candidate or ledger.
  const selectedPublicationPaths = subroute.requiredOutputIds.map((outputId) =>
    outputDefinition(authority.matrix, packet.packetId, outputId).artifact.path);
  assertNoPublicationStages(packet, root);
  assertSelectedPrefixClosedWorld(
    authority,
    packet,
    priorPrefix.selectedPackets,
    Object.freeze(selectedPublicationPaths),
  );
  assertActiveFinalizationAuthority(input, root);

  const publishedCandidate = publishProjectedTerminalCandidate(input, root, candidate);

  const publishedLedgerIdentity = publishFreshBytes(
    input,
    root,
    packet,
    ledgerPath,
    attemptReceipt.bytes,
    null,
  );
  phase10C0VS6SameIdentity(
    publishedLedgerIdentity,
    ledgerIdentity,
    `${config.label} published attempt ledger`,
  );
  const reopenedLedgerBytes = phase10C0VS6ReadUniquePhysicalFile(root, ledgerIdentity.path);
  const reopenedRows = parsePhase10C0VS6AttemptLedgerV2(
    reopenedLedgerBytes,
    `${config.label} published attempt ledger`,
  );
  if (reopenedRows.length !== 1) fail(`${config.label} published ledger does not contain its sole attempt`);
  phase10C0VS6SameJson(reopenedRows[0]!, attempt, `${config.label} published ledger attempt row`);

  if (verificationIdentity !== null && verificationBytes !== null && verificationAuthority !== null) {
    const projection = finalizationProjection(packet, "packet-verification");
    const publishedVerificationIdentity = publishFreshBytes(
      input,
      root,
      packet,
      projection.path,
      verificationBytes,
      projection.maximumByteLength,
    );
    phase10C0VS6SameIdentity(
      publishedVerificationIdentity,
      verificationIdentity,
      `${config.label} published packet verification`,
    );
    verification = parsePhase10C0VS6PacketVerificationV2Bytes(
      phase10C0VS6ReadUniquePhysicalFile(root, verificationIdentity.path),
      packet,
      verificationAuthority,
    );
  } else if (verificationIdentity !== null || verificationBytes !== null || verificationAuthority !== null) {
    fail(`${config.label} verification projection is only partially materialized`);
  }

  const publishedTerminalIdentity = publishFreshBytes(
    input,
    root,
    packet,
    terminalProjection.path,
    terminalBytes,
    terminalProjection.maximumByteLength,
  );
  phase10C0VS6SameIdentity(
    publishedTerminalIdentity,
    terminalIdentity,
    `${config.label} published terminal receipt`,
  );
  terminal = parsePhase10C0VS6TerminalReceiptV2Bytes(
    phase10C0VS6ReadUniquePhysicalFile(root, terminalIdentity.path),
    packet,
    terminalAuthority,
  );
  assertNoPublicationStages(packet, root);
  assertSelectedPrefixClosedWorld(
    authority,
    packet,
    priorPrefix.selectedPackets,
    Object.freeze(selectedPublicationPaths),
  );
  assertActiveFinalizationAuthority(input, root);
  return Object.freeze({
    terminalCandidate: publishedCandidate,
    attempt,
    attemptLedgerIdentity: ledgerIdentity,
    attemptLedgerBytes: new Uint8Array(attemptReceipt.bytes),
    verification,
    verificationIdentity,
    verificationBytes: verificationBytes === null ? null : new Uint8Array(verificationBytes),
    terminalReceipt: terminal,
    terminalReceiptIdentity: terminalIdentity,
    terminalReceiptBytes: new Uint8Array(terminalBytes),
  });
}

export function independentlyFinalizePhase10C0VS6MovingProducePacket(
  input: Phase10C0VS6MovingRawFinalizationInput,
): Phase10C0VS6FinalizedMovingProducePacket {
  return independentlyFinalizePhase10C0VS6MatchOnlyProducePacket(input, MOVING_FINALIZATION_CONFIG);
}

export function independentlyFinalizePhase10C0VS6StaticProducePacket(
  input: Phase10C0VS6StaticRawFinalizationInput,
): Phase10C0VS6FinalizedStaticProducePacket {
  return independentlyFinalizePhase10C0VS6MatchOnlyProducePacket(input, STATIC_FINALIZATION_CONFIG);
}

/**
 * Raw one-way radial-produce finalizer for both normal pass/fail and all seven validated-refusal
 * routes.  It reopens the complete A-P/moving-produce/moving-publish prefix, constructs the sole
 * attempt row from parent-owned invocation/progress/exit bytes, and keeps every claim-bearing
 * output in memory until census, resource, semantic, accounting, closed-world, and watchdog
 * checks have passed.  Radial validated refusals retain structural verification with a null
 * evaluator-execution row; normal pass/fail retains the exact completed numerical evaluator.
 */
export function independentlyFinalizePhase10C0VS6RadialProducePacket(
  input: Phase10C0VS6RadialRawFinalizationInput,
): Phase10C0VS6FinalizedRadialProducePacket {
  const root = phase10C0VS6PhysicalRepositoryRoot(input.repositoryRoot);
  assertActiveFinalizationAuthority(input, root);
  phase10C0VS6SameIdentity(
    input.lockedAuthority.packetProtocolIdentity,
    input.packetProtocolIdentity,
    "radial finalizer locked packet protocol",
  );
  if (!sameBytes(input.lockedAuthority.packetProtocolBytes, input.packetProtocolBytes)) {
    fail("radial finalizer packet bytes differ from active locked authority");
  }
  const retained = derivePhase10C0VS6RetainedRuntimeAuthority(input);
  const packet = retained.packet;
  if (packet.packetId !== "c0v-radial-produce" ||
    input.lockedAuthority.packet.packetId !== packet.packetId ||
    input.lockedAuthority.packet.protocolId !== packet.protocolId ||
    input.lockedAuthority.packet.registeredAttemptId !== packet.registeredAttemptId) {
    fail("radial finalizer received a different packet/locked authority");
  }
  const priorPrefix = independentlyReopenPhase10C0VS6VerifiedPublishedDependencies(input);
  exactRoster(
    priorPrefix.selectedPackets.map((entry) => entry.packet.packetId),
    chronologicalPriorPacketIds(input.lockedAuthority.catalogue, packet.packetId),
    "radial finalizer deeply verified dependency prefix",
  );
  const authority = reopenCurrentPacketAuthority(input, packet, retained.preflight);
  const materialized = independentlyMaterializePhase10C0VS6TerminalCandidate(
    input,
    input.capturedGovernedCallerResult,
  );
  if (existsSync(resolve(root.path, materialized.candidatePath))) {
    fail("radial terminal candidate existed before current raw finalization");
  }
  const candidate = materialized;
  const scanned = projectTerminalCandidateIntoAttemptScan(
    scanAttemptRoot(root, retained.preflight.observed.attemptDirectory),
    candidate,
  );
  assertAttemptRootByteLimits(authority.catalogue, candidate, scanned);
  const attempt = constructRadialAttempt(root, candidate, scanned);
  const attemptReceipt = writePhase10C0VRadialAttemptReceipt({
    packetProtocolBytes: input.packetProtocolBytes,
    packetProtocolIdentity: input.packetProtocolIdentity,
    attempt,
  });
  const postCandidate = postCandidateCallerResults(
    input,
    candidate,
    attemptReceipt.identity,
    attemptReceipt.bytes,
  );
  const callerRows = Object.freeze([
    ...candidate.candidate.callerInvocationResults,
    ...postCandidate,
  ]);
  const callerRosters = packet.terminalReceiptContract.callerInvocationResultRosters.filter((entry) =>
    entry.subrouteId === candidate.lifecycle.selectedSubrouteId);
  if (callerRosters.length !== 1) fail("radial selected route lacks one full caller roster");
  exactRoster(
    callerRows.map((entry) => entry.callerInvocationId),
    callerRosters[0]!.callerInvocationResults.map((entry) => entry.callerInvocationId),
    "radial full caller invocation roster",
  );

  const ledgerPath = attemptReceipt.identity.path;
  const ledgerIdentity = assertFreshPublicationBytes(
    root,
    packet,
    ledgerPath,
    attemptReceipt.bytes,
    null,
  );
  phase10C0VS6SameIdentity(ledgerIdentity, attemptReceipt.identity, "radial projected attempt ledger");
  const inMemoryRows = parsePhase10C0VS6AttemptLedgerV2(
    attemptReceipt.bytes,
    "radial in-memory attempt ledger",
  );
  if (inMemoryRows.length !== 1) fail("radial in-memory ledger does not contain its sole attempt");
  phase10C0VS6SameJson(inMemoryRows[0]!, attempt, "radial in-memory ledger attempt row");
  const producePublicationArtifacts = currentProducePublicationArtifacts(
    authority,
    candidate,
    ledgerIdentity,
    attemptReceipt.bytes,
  );
  const candidatePublicationArtifacts = currentCandidatePublicationArtifacts(authority, candidate);
  const publicationArtifacts = mergeCurrentPublicationArtifacts(
    producePublicationArtifacts,
    candidatePublicationArtifacts,
  );
  if (candidate.lifecycle.radialReproof !== null) {
    assertRadialCandidatePublicationJoin(authority, candidate, publicationArtifacts);
  }
  for (const artifact of candidatePublicationArtifacts) {
    if (artifact.identity.path !== candidate.lifecycle.preflightIdentity.path) {
      assertFreshPublicationBytes(root, packet, artifact.identity.path, artifact.bytes, null);
    }
  }
  const subroutes = packet.terminalSubroutes.filter((entry) =>
    entry.subrouteId === candidate.lifecycle.selectedSubrouteId);
  if (subroutes.length !== 1) fail("radial selected lifecycle route disappeared from packet authority");
  const subroute = subroutes[0]!;
  if (!subroute.requiredOutputIds.some((entry) => entry.endsWith("-verification"))) {
    fail("radial validated route lacks its required structural packet verification");
  }

  const timing = packetGovernedTiming(packet, candidate, ledgerIdentity, attempt);
  const packetResources = packetResourceAccounting(
    packet,
    candidate,
    attempt,
    ledgerIdentity,
    scanned,
    publicationArtifacts,
  );
  const processAccounting = packageProcessAccounting(
    authority.catalogue,
    packet,
    timing,
    priorPrefix.selectedPackets,
  );
  const packageResources = packageResourceAccounting(
    root,
    packet,
    processAccounting,
    packetResources,
    priorPrefix.selectedPackets,
  );
  const verifiedArtifacts = deriveCurrentVerifiedArtifacts(authority, candidate, publicationArtifacts);
  const checkResults = deriveCheckResults(
    authority.matrix,
    packet,
    candidate.lifecycle.selectedSubrouteId,
    callerRows,
  );
  const negativeControlResults = candidate.lifecycle.radialReproof === null
    ? Object.freeze([])
    : deriveRadialNegativeControlResults(candidate);
  const executedNegativeControlIds = Object.freeze(
    [...new Set(callerRows.flatMap((entry) => [...entry.executedNegativeControlIds]))]
      .sort(codePointCompare),
  );
  exactRoster(
    negativeControlResults.map((entry) => entry.negativeControlId),
    executedNegativeControlIds,
    "radial negative-control result roster",
  );
  const execution = independentlyConstructProduceExecution(
    packet,
    candidate.lifecycle.selectedSubrouteId,
    retained.preflight,
    callerRows,
    timing,
    root,
  );
  const verificationAuthority: Phase10C0VS6PacketVerificationV2Authority = Object.freeze({
    selectedSubrouteId: candidate.lifecycle.selectedSubrouteId,
    verifiedArtifacts,
    checkResults,
    executedNegativeControlIds,
    negativeControlResults,
    execution,
    callerInvocationResults: callerRows,
    governedTiming: timing,
    packageProcessAccounting: processAccounting,
    packetResourceAccounting: packetResources,
    packageResourceAccounting: packageResources,
  });
  const verificationValue = Object.freeze({
    schema: "phase10-packet-verification-v2" as const,
    verificationId: `phase10-${packet.packetId}-${packet.registeredAttemptId}-verification-v2`,
    matrixId: authority.matrix.matrixId,
    protocolId: packet.protocolId,
    registryId: packet.registryId,
    packetId: packet.packetId,
    terminalState: "complete" as const,
    verifiedArtifacts,
    checkResults,
    executedNegativeControlIds,
    negativeControlResults,
    boundDependencyPacketIds: packet.boundDependencyPacketIds,
    execution,
    callerInvocationResults: callerRows,
    governedTiming: timing,
    packageProcessAccounting: processAccounting,
    packetResourceAccounting: packetResources,
    packageResourceAccounting: packageResources,
    aggregateVerdict: "pass" as const,
    limits: packet.claimBoundary.forbidden,
  });
  const verificationBytes = writePhase10C0VS6PacketVerificationReceipt(
    verificationValue,
    packet,
    verificationAuthority,
  );
  const verificationProjection = finalizationProjection(packet, "packet-verification");
  const verificationIdentity = assertFreshPublicationBytes(
    root,
    packet,
    verificationProjection.path,
    verificationBytes,
    verificationProjection.maximumByteLength,
  );
  let verification = parsePhase10C0VS6PacketVerificationV2Bytes(
    verificationBytes,
    packet,
    verificationAuthority,
  );

  const reasons = terminalReasonCodes(candidate, true);
  const terminalAuthority: Phase10C0VS6TerminalReceiptAuthority = Object.freeze({
    selectedSubrouteId: candidate.lifecycle.selectedSubrouteId,
    terminalState: candidate.lifecycle.terminalState,
    preflight: candidate.lifecycle.preflightIdentity,
    terminalCandidate: candidate.candidateIdentity,
    attemptLedger: ledgerIdentity,
    packetVerification: verificationIdentity,
    invocationRecords: Object.freeze([]),
    callerInvocationResults: callerRows,
    registeredCap: candidate.lifecycle.registeredCap,
    reasons,
  });
  const terminalValue = Object.freeze({
    schema: packet.terminalReceiptContract.receiptSchema,
    receiptId: `phase10-${packet.packetId}-${packet.registeredAttemptId}-terminal-v2`,
    matrixId: authority.matrix.matrixId,
    protocolId: packet.protocolId,
    registryId: packet.registryId,
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    terminalState: candidate.lifecycle.terminalState,
    dispositionCode: candidate.lifecycle.dispositionCode,
    preflight: candidate.lifecycle.preflightIdentity,
    terminalCandidate: candidate.candidateIdentity,
    attemptLedger: ledgerIdentity,
    packetVerification: verificationIdentity,
    producedOutputIds: subroute.requiredOutputIds,
    executedCheckIds: subroute.requiredCheckIds,
    executedNegativeControlIds: subroute.requiredNegativeControlIds,
    invocationRecords: Object.freeze([]),
    callerInvocationResults: callerRows,
    registeredCap: candidate.lifecycle.registeredCap,
    acceptedPacketCredit: true,
    dependencyValid: true,
    verdict: "complete" as const,
    reasons,
  });
  const terminalBytes = writePhase10C0VS6TerminalReceipt(
    terminalValue,
    packet,
    terminalAuthority,
  );
  const terminalProjection = finalizationProjection(packet, "terminal-receipt");
  if (terminalProjection.path !== packet.paths.terminalReceiptPath) {
    fail("radial terminal finalization path differs from packet terminal path");
  }
  const terminalIdentity = assertFreshPublicationBytes(
    root,
    packet,
    terminalProjection.path,
    terminalBytes,
    terminalProjection.maximumByteLength,
  );
  let terminal = parsePhase10C0VS6TerminalReceiptV2Bytes(
    terminalBytes,
    packet,
    terminalAuthority,
  );

  const selectedPublicationPaths = subroute.requiredOutputIds.map((outputId) =>
    outputDefinition(authority.matrix, packet.packetId, outputId).artifact.path);
  assertNoPublicationStages(packet, root);
  assertSelectedPrefixClosedWorld(
    authority,
    packet,
    priorPrefix.selectedPackets,
    Object.freeze(selectedPublicationPaths),
  );
  assertActiveFinalizationAuthority(input, root);

  const publishedCandidate = publishProjectedTerminalCandidate(input, root, candidate);
  const publishedCandidateArtifacts = publishCandidatePublicationArtifacts(
    input,
    authority,
    candidate,
    candidatePublicationArtifacts,
  );
  const publishedLedgerIdentity = publishFreshBytes(
    input,
    root,
    packet,
    ledgerPath,
    attemptReceipt.bytes,
    null,
  );
  phase10C0VS6SameIdentity(
    publishedLedgerIdentity,
    ledgerIdentity,
    "radial published attempt ledger",
  );
  const reopenedLedgerBytes = phase10C0VS6ReadUniquePhysicalFile(root, ledgerIdentity.path);
  const reopenedRows = parsePhase10C0VS6AttemptLedgerV2(
    reopenedLedgerBytes,
    "radial published attempt ledger",
  );
  if (reopenedRows.length !== 1) fail("radial published ledger does not contain its sole attempt");
  phase10C0VS6SameJson(reopenedRows[0]!, attempt, "radial published ledger attempt row");
  const publishedArtifacts = mergeCurrentPublicationArtifacts(
    producePublicationArtifacts,
    publishedCandidateArtifacts,
  );
  if (candidate.lifecycle.radialReproof !== null) {
    assertRadialCandidatePublicationJoin(authority, publishedCandidate, publishedArtifacts);
  }

  const publishedVerificationIdentity = publishFreshBytes(
    input,
    root,
    packet,
    verificationProjection.path,
    verificationBytes,
    verificationProjection.maximumByteLength,
  );
  phase10C0VS6SameIdentity(
    publishedVerificationIdentity,
    verificationIdentity,
    "radial published packet verification",
  );
  verification = parsePhase10C0VS6PacketVerificationV2Bytes(
    phase10C0VS6ReadUniquePhysicalFile(root, verificationIdentity.path),
    packet,
    verificationAuthority,
  );
  const publishedTerminalIdentity = publishFreshBytes(
    input,
    root,
    packet,
    terminalProjection.path,
    terminalBytes,
    terminalProjection.maximumByteLength,
  );
  phase10C0VS6SameIdentity(
    publishedTerminalIdentity,
    terminalIdentity,
    "radial published terminal receipt",
  );
  terminal = parsePhase10C0VS6TerminalReceiptV2Bytes(
    phase10C0VS6ReadUniquePhysicalFile(root, terminalIdentity.path),
    packet,
    terminalAuthority,
  );
  assertNoPublicationStages(packet, root);
  assertSelectedPrefixClosedWorld(
    authority,
    packet,
    priorPrefix.selectedPackets,
    Object.freeze(selectedPublicationPaths),
  );
  assertActiveFinalizationAuthority(input, root);
  return Object.freeze({
    terminalCandidate: publishedCandidate,
    attempt,
    attemptLedgerIdentity: ledgerIdentity,
    attemptLedgerBytes: new Uint8Array(attemptReceipt.bytes),
    publishedArtifacts,
    verification,
    verificationIdentity,
    verificationBytes: new Uint8Array(verificationBytes),
    terminalReceipt: terminal,
    terminalReceiptIdentity: terminalIdentity,
    terminalReceiptBytes: new Uint8Array(terminalBytes),
  });
}

type Phase10C0VS6PublishCandidate = Readonly<{
  readonly resultBytes: Uint8Array;
  readonly artifactIndexBytes: Uint8Array;
}>;

interface Phase10C0VS6PublishFinalizationConfig {
  readonly packetId: "c0v-moving-publish" | "c0v-radial-publish" | "c0v-static-publish";
  readonly producePacketId: "c0v-moving-produce" | "c0v-radial-produce" | "c0v-static-produce";
  readonly label: "moving-publish" | "radial-publish" | "static-publish";
  readonly resultOutputId: "out-c0v-moving-result" | "out-c0v-radial-result" | "out-c0v-static-result";
  readonly artifactIndexOutputId:
    | "out-c0v-moving-artifact-index"
    | "out-c0v-radial-artifact-index"
    | "out-c0v-static-artifact-index";
  readonly callerCallableId:
    | "phase10-c0v-moving-publish-check-caller"
    | "phase10-c0v-radial-publish-check-caller"
    | "phase10-c0v-static-publish-check-caller";
  readonly evaluate: (
    input: Phase10C0VS6LockedRawFinalizationInput,
    packet: Phase10C0VS6PacketProtocol,
    verifiedProduce: Phase10C0VS6VerifiedPublishedPacket,
    candidate: Phase10C0VS6PublishCandidate,
  ) => Phase10C0VPublicationSemanticEvaluation;
  readonly writeVerification: (
    value: unknown,
    packet: Phase10C0VS6PacketProtocol,
    authority: Phase10C0VS6PacketVerificationV2Authority,
  ) => Uint8Array;
}

const MOVING_PUBLISH_FINALIZATION_CONFIG: Phase10C0VS6PublishFinalizationConfig = Object.freeze({
  packetId: "c0v-moving-publish",
  producePacketId: "c0v-moving-produce",
  label: "moving-publish",
  resultOutputId: "out-c0v-moving-result",
  artifactIndexOutputId: "out-c0v-moving-artifact-index",
  callerCallableId: "phase10-c0v-moving-publish-check-caller",
  evaluate: (
    _input: Phase10C0VS6LockedRawFinalizationInput,
    packet: Phase10C0VS6PacketProtocol,
    verifiedProduce: Phase10C0VS6VerifiedPublishedPacket,
    candidate: Phase10C0VS6PublishCandidate,
  ) =>
    independentlyEvaluatePhase10C0VMovingPublicationSemantic(Object.freeze({
      publicationPacket: packet,
      verifiedProduce,
      candidate,
    })),
  writeVerification: writePhase10C0VMovingPublishVerificationReceipt,
});

const RADIAL_PUBLISH_FINALIZATION_CONFIG: Phase10C0VS6PublishFinalizationConfig = Object.freeze({
  packetId: "c0v-radial-publish",
  producePacketId: "c0v-radial-produce",
  label: "radial-publish",
  resultOutputId: "out-c0v-radial-result",
  artifactIndexOutputId: "out-c0v-radial-artifact-index",
  callerCallableId: "phase10-c0v-radial-publish-check-caller",
  evaluate: (
    _input: Phase10C0VS6LockedRawFinalizationInput,
    packet: Phase10C0VS6PacketProtocol,
    verifiedProduce: Phase10C0VS6VerifiedPublishedPacket,
    candidate: Phase10C0VS6PublishCandidate,
  ) =>
    independentlyEvaluatePhase10C0VRadialPublicationSemantic(Object.freeze({
      publicationPacket: packet,
      verifiedProduce,
      candidate,
    })),
  writeVerification: writePhase10C0VRadialPublishVerificationReceipt,
});

const STATIC_PUBLISH_FINALIZATION_CONFIG: Phase10C0VS6PublishFinalizationConfig = Object.freeze({
  packetId: "c0v-static-publish",
  producePacketId: "c0v-static-produce",
  label: "static-publish",
  resultOutputId: "out-c0v-static-result",
  artifactIndexOutputId: "out-c0v-static-artifact-index",
  callerCallableId: "phase10-c0v-static-publish-check-caller",
  evaluate: (
    _input: Phase10C0VS6LockedRawFinalizationInput,
    packet: Phase10C0VS6PacketProtocol,
    verifiedProduce: Phase10C0VS6VerifiedPublishedPacket,
    candidate: Phase10C0VS6PublishCandidate,
  ) =>
    independentlyEvaluatePhase10C0VStaticPublicationSemantic(Object.freeze({
      publicationPacket: packet,
      verifiedProduce,
      candidate,
    })),
  writeVerification: writePhase10C0VStaticPublishVerificationReceipt,
});

/**
 * Raw one-way layer-publication finalizer. The structural producer may only leave its result and
 * artifact-index bytes in the registered candidate directory. This function independently
 * reopens the complete A-P/produce prefix, rederives the publication semantics, binds the
 * governed caller result, and parses verification-v2/terminal-v2 in memory before publishing any
 * claim-bearing output.
 */
function independentlyFinalizePhase10C0VS6LayerPublishPacket(
  input: Phase10C0VS6LockedRawFinalizationInput,
  config: Phase10C0VS6PublishFinalizationConfig,
): Phase10C0VS6FinalizedMovingPublishPacket {
  const root = phase10C0VS6PhysicalRepositoryRoot(input.repositoryRoot);
  assertActiveFinalizationAuthority(input, root);
  phase10C0VS6SameIdentity(
    input.lockedAuthority.packetProtocolIdentity,
    input.packetProtocolIdentity,
    `${config.label} finalizer locked packet protocol`,
  );
  if (!sameBytes(input.lockedAuthority.packetProtocolBytes, input.packetProtocolBytes)) {
    fail(`${config.label} finalizer packet bytes differ from active locked authority`);
  }
  const retained = derivePhase10C0VS6RetainedRuntimeAuthority(input);
  const packet = retained.packet;
  if (packet.packetId !== config.packetId || input.lockedAuthority.packet.packetId !== packet.packetId ||
    input.lockedAuthority.packet.protocolId !== packet.protocolId ||
    input.lockedAuthority.packet.registeredAttemptId !== packet.registeredAttemptId) {
    fail(`${config.label} finalizer received a different packet/locked authority`);
  }
  const priorPrefix = independentlyReopenPhase10C0VS6VerifiedProduceDependencies(input);
  exactRoster(
    priorPrefix.selectedPackets.map((entry) => entry.packet.packetId),
    chronologicalPriorPacketIds(input.lockedAuthority.catalogue, packet.packetId),
    `${config.label} deeply verified dependency prefix`,
  );
  const verifiedProduce = priorPrefix.byPacketId.get(config.producePacketId);
  if (verifiedProduce === undefined || verifiedProduce.selectedAttempt === null ||
    verifiedProduce.attemptLedgerIdentity === null || verifiedProduce.attemptLedgerBytes === null) {
    fail(`${config.label} dependency prefix lacks its verified produce attempt/ledger`);
  }
  const authority = reopenCurrentPacketAuthority(input, packet, retained.preflight);
  const materialized = independentlyMaterializePhase10C0VS6TerminalCandidate(
    input,
    input.capturedGovernedCallerResult,
  );
  if (existsSync(resolve(root.path, materialized.candidatePath))) {
    fail(`${config.label} terminal candidate existed before current raw finalization`);
  }
  const candidate = materialized;
  const scanned = projectTerminalCandidateIntoAttemptScan(
    scanAttemptRoot(root, retained.preflight.observed.attemptDirectory),
    candidate,
  );
  assertAttemptRootByteLimits(authority.catalogue, candidate, scanned);
  exactRoster(
    scanned.map((entry) => entry.identity.path),
    exactExpectedAttemptPaths(packet, retained.preflight, candidate.lifecycle.selectedSubrouteId),
    `${config.label} finalized attempt-root census`,
  );
  const subroutes = packet.terminalSubroutes.filter((entry) =>
    entry.subrouteId === candidate.lifecycle.selectedSubrouteId);
  if (subroutes.length !== 1) fail(`${config.label} lifecycle route disappeared from packet authority`);
  const subroute = subroutes[0]!;
  const acceptedPacketCredit = subroute.dispositionCode === null &&
    subroute.requiredOutputIds.some((entry) => entry.endsWith("-verification"));
  const callerRows = candidate.candidate.callerInvocationResults;
  const callerRosters = packet.terminalReceiptContract.callerInvocationResultRosters.filter((entry) =>
    entry.subrouteId === candidate.lifecycle.selectedSubrouteId);
  if (callerRosters.length !== 1) fail(`${config.label} route lacks one caller-result roster`);
  exactRoster(
    callerRows.map((entry) => entry.callerInvocationId),
    callerRosters[0]!.callerInvocationResults.map((entry) => entry.callerInvocationId),
    `${config.label} full caller invocation roster`,
  );
  const publicationArtifacts = currentCandidatePublicationArtifacts(authority, candidate);

  let verification: Phase10C0VS6PacketVerificationV2 | null = null;
  let verificationIdentity: Phase10C0VS6ArtifactIdentity | null = null;
  let verificationBytes: Uint8Array | null = null;
  let verificationAuthority: Phase10C0VS6PacketVerificationV2Authority | null = null;
  if (acceptedPacketCredit) {
    const resultRows = publicationArtifacts.filter((entry) => entry.outputId === config.resultOutputId);
    const indexRows = publicationArtifacts.filter((entry) =>
      entry.outputId === config.artifactIndexOutputId);
    if (resultRows.length !== 1 || indexRows.length !== 1) {
      fail(`${config.label} completion lacks one in-memory result and artifact index`);
    }
    const evaluation = config.evaluate(input, packet, verifiedProduce, Object.freeze({
      resultBytes: resultRows[0]!.bytes,
      artifactIndexBytes: indexRows[0]!.bytes,
    }));
    if (evaluation.aggregateVerdict !== "pass" || evaluation.packetId !== packet.packetId ||
      evaluation.checkResults.some((entry) => entry.verdict !== "pass" || entry.reasons.length !== 0)) {
      fail(`${config.label} independent semantic reproof did not pass cleanly`);
    }
    phase10C0VS6SameIdentity(
      evaluation.resultIdentity,
      resultRows[0]!.identity,
      `${config.label} semantic result identity`,
    );
    phase10C0VS6SameIdentity(
      evaluation.artifactIndexIdentity,
      indexRows[0]!.identity,
      `${config.label} semantic artifact-index identity`,
    );
    const checkIds = Object.freeze(evaluation.checkResults.map((entry) => entry.checkId));
    const semanticReproof: Phase10C0VS6PacketSemanticReproof = Object.freeze({
      packetId: config.packetId,
      callerCallableId: config.callerCallableId,
      evaluatorCallableId: evaluation.evaluatorCallableId,
      evaluatorResult: strictJsonSnapshot(evaluation),
      executedCheckIds: checkIds,
      evaluatedCheckIds: checkIds,
      executedNegativeControlIds: Object.freeze([]),
      candidatePublishedOutputs: Object.freeze([
        Object.freeze({ outputId: config.artifactIndexOutputId, identity: evaluation.artifactIndexIdentity }),
        Object.freeze({ outputId: config.resultOutputId, identity: evaluation.resultIdentity }),
      ]),
    });
    assertSemanticCandidatePublicationJoin(authority, candidate, publicationArtifacts, semanticReproof);

    const timing = packetGovernedTiming(packet, candidate, null, null);
    const packetResources = packetResourceAccounting(
      packet,
      candidate,
      null,
      null,
      scanned,
      publicationArtifacts,
    );
    const processAccounting = packageProcessAccounting(
      authority.catalogue,
      packet,
      timing,
      priorPrefix.selectedPackets,
    );
    const packageResources = packageResourceAccounting(
      root,
      packet,
      processAccounting,
      packetResources,
      priorPrefix.selectedPackets,
    );
    const verifiedArtifacts = deriveCurrentVerifiedArtifacts(authority, candidate, publicationArtifacts);
    const checkResults = deriveCheckResults(
      authority.matrix,
      packet,
      candidate.lifecycle.selectedSubrouteId,
      callerRows,
    );
    phase10C0VS6SameJson(checkResults, evaluation.checkResults,
      `${config.label} verification checks versus semantic reproof`);
    const execution = independentlyConstructProduceExecution(
      packet,
      candidate.lifecycle.selectedSubrouteId,
      retained.preflight,
      callerRows,
      timing,
      root,
    );
    verificationAuthority = Object.freeze({
      selectedSubrouteId: candidate.lifecycle.selectedSubrouteId,
      verifiedArtifacts,
      checkResults,
      executedNegativeControlIds: Object.freeze([]),
      negativeControlResults: Object.freeze([]),
      execution,
      callerInvocationResults: callerRows,
      governedTiming: timing,
      packageProcessAccounting: processAccounting,
      packetResourceAccounting: packetResources,
      packageResourceAccounting: packageResources,
    });
    const value = Object.freeze({
      schema: "phase10-packet-verification-v2" as const,
      verificationId: `phase10-${packet.packetId}-${packet.registeredAttemptId}-verification-v2`,
      matrixId: authority.matrix.matrixId,
      protocolId: packet.protocolId,
      registryId: packet.registryId,
      packetId: packet.packetId,
      terminalState: "complete" as const,
      verifiedArtifacts,
      checkResults,
      executedNegativeControlIds: Object.freeze([]),
      negativeControlResults: Object.freeze([]),
      boundDependencyPacketIds: packet.boundDependencyPacketIds,
      execution,
      callerInvocationResults: callerRows,
      governedTiming: timing,
      packageProcessAccounting: processAccounting,
      packetResourceAccounting: packetResources,
      packageResourceAccounting: packageResources,
      aggregateVerdict: "pass" as const,
      limits: packet.claimBoundary.forbidden,
    });
    verificationBytes = config.writeVerification(
      value,
      packet,
      verificationAuthority,
    );
    const projection = finalizationProjection(packet, "packet-verification");
    verificationIdentity = assertFreshPublicationBytes(
      root,
      packet,
      projection.path,
      verificationBytes,
      projection.maximumByteLength,
    );
    verification = parsePhase10C0VS6PacketVerificationV2Bytes(
      verificationBytes,
      packet,
      verificationAuthority,
    );
  } else if (publicationArtifacts.some((entry) =>
    entry.identity.path !== candidate.lifecycle.preflightIdentity.path)) {
    fail(`${config.label} maker-return route retained a forbidden result/index candidate`);
  }

  for (const artifact of publicationArtifacts) {
    if (artifact.identity.path !== candidate.lifecycle.preflightIdentity.path) {
      assertFreshPublicationBytes(root, packet, artifact.identity.path, artifact.bytes, null);
    }
  }
  const reasons = terminalReasonCodes(candidate, acceptedPacketCredit);
  const invocationRecords = candidate.lifecycle.registeredCap === null
    ? Object.freeze([])
    : candidate.lifecycle.packetInvocationRecords;
  const terminalAuthority: Phase10C0VS6TerminalReceiptAuthority = Object.freeze({
    selectedSubrouteId: candidate.lifecycle.selectedSubrouteId,
    terminalState: candidate.lifecycle.terminalState,
    preflight: candidate.lifecycle.preflightIdentity,
    terminalCandidate: candidate.candidateIdentity,
    attemptLedger: null,
    packetVerification: verificationIdentity,
    invocationRecords,
    callerInvocationResults: callerRows,
    registeredCap: candidate.lifecycle.registeredCap,
    reasons,
  });
  const terminalValue = Object.freeze({
    schema: packet.terminalReceiptContract.receiptSchema,
    receiptId: `phase10-${packet.packetId}-${packet.registeredAttemptId}-terminal-v2`,
    matrixId: authority.matrix.matrixId,
    protocolId: packet.protocolId,
    registryId: packet.registryId,
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    terminalState: candidate.lifecycle.terminalState,
    dispositionCode: candidate.lifecycle.dispositionCode,
    preflight: candidate.lifecycle.preflightIdentity,
    terminalCandidate: candidate.candidateIdentity,
    attemptLedger: null,
    packetVerification: verificationIdentity,
    producedOutputIds: subroute.requiredOutputIds,
    executedCheckIds: subroute.requiredCheckIds,
    executedNegativeControlIds: subroute.requiredNegativeControlIds,
    invocationRecords,
    callerInvocationResults: callerRows,
    registeredCap: candidate.lifecycle.registeredCap,
    acceptedPacketCredit,
    dependencyValid: acceptedPacketCredit,
    verdict: acceptedPacketCredit ? "complete" as const : "refusal" as const,
    reasons,
  });
  const terminalBytes = writePhase10C0VS6TerminalReceipt(terminalValue, packet, terminalAuthority);
  const terminalProjection = finalizationProjection(packet, "terminal-receipt");
  if (terminalProjection.path !== packet.paths.terminalReceiptPath) {
    fail(`${config.label} terminal finalization path differs from packet terminal path`);
  }
  const terminalIdentity = assertFreshPublicationBytes(
    root,
    packet,
    terminalProjection.path,
    terminalBytes,
    terminalProjection.maximumByteLength,
  );
  let terminal = parsePhase10C0VS6TerminalReceiptV2Bytes(terminalBytes, packet, terminalAuthority);

  const selectedPublicationPaths = subroute.requiredOutputIds.map((outputId) =>
    outputDefinition(authority.matrix, packet.packetId, outputId).artifact.path);
  assertNoPublicationStages(packet, root);
  assertSelectedPrefixClosedWorld(
    authority,
    packet,
    priorPrefix.selectedPackets,
    Object.freeze(selectedPublicationPaths),
  );
  assertActiveFinalizationAuthority(input, root);

  const publishedCandidate = publishProjectedTerminalCandidate(input, root, candidate);
  const publishedArtifacts = publishCandidatePublicationArtifacts(
    input,
    authority,
    candidate,
    publicationArtifacts,
  );
  if (verificationIdentity !== null && verificationBytes !== null && verificationAuthority !== null) {
    const projection = finalizationProjection(packet, "packet-verification");
    const publishedVerification = publishFreshBytes(
      input,
      root,
      packet,
      projection.path,
      verificationBytes,
      projection.maximumByteLength,
    );
    phase10C0VS6SameIdentity(
      publishedVerification,
      verificationIdentity,
      `${config.label} published packet verification`,
    );
    verification = parsePhase10C0VS6PacketVerificationV2Bytes(
      phase10C0VS6ReadUniquePhysicalFile(root, verificationIdentity.path),
      packet,
      verificationAuthority,
    );
  } else if (verificationIdentity !== null || verificationBytes !== null || verificationAuthority !== null) {
    fail(`${config.label} verification projection is only partially materialized`);
  }
  const publishedTerminal = publishFreshBytes(
    input,
    root,
    packet,
    terminalProjection.path,
    terminalBytes,
    terminalProjection.maximumByteLength,
  );
  phase10C0VS6SameIdentity(publishedTerminal, terminalIdentity, `${config.label} published terminal receipt`);
  terminal = parsePhase10C0VS6TerminalReceiptV2Bytes(
    phase10C0VS6ReadUniquePhysicalFile(root, terminalIdentity.path),
    packet,
    terminalAuthority,
  );
  assertNoPublicationStages(packet, root);
  assertSelectedPrefixClosedWorld(
    authority,
    packet,
    priorPrefix.selectedPackets,
    Object.freeze(selectedPublicationPaths),
  );
  assertActiveFinalizationAuthority(input, root);
  return Object.freeze({
    terminalCandidate: publishedCandidate,
    publishedArtifacts,
    verification,
    verificationIdentity,
    verificationBytes: verificationBytes === null ? null : new Uint8Array(verificationBytes),
    terminalReceipt: terminal,
    terminalReceiptIdentity: terminalIdentity,
    terminalReceiptBytes: new Uint8Array(terminalBytes),
  });
}

export function independentlyFinalizePhase10C0VS6MovingPublishPacket(
  input: Phase10C0VS6MovingPublishRawFinalizationInput,
): Phase10C0VS6FinalizedMovingPublishPacket {
  return independentlyFinalizePhase10C0VS6LayerPublishPacket(input, MOVING_PUBLISH_FINALIZATION_CONFIG);
}

export function independentlyFinalizePhase10C0VS6RadialPublishPacket(
  input: Phase10C0VS6RadialPublishRawFinalizationInput,
): Phase10C0VS6FinalizedRadialPublishPacket {
  return independentlyFinalizePhase10C0VS6LayerPublishPacket(input, RADIAL_PUBLISH_FINALIZATION_CONFIG);
}

export function independentlyFinalizePhase10C0VS6StaticPublishPacket(
  input: Phase10C0VS6StaticPublishRawFinalizationInput,
): Phase10C0VS6FinalizedStaticPublishPacket {
  return independentlyFinalizePhase10C0VS6LayerPublishPacket(input, STATIC_PUBLISH_FINALIZATION_CONFIG);
}

/** Raw one-way finalizer for the four-output aggregate structural packet. */
export function independentlyFinalizePhase10C0VS6AggregatePacket(
  input: Phase10C0VS6AggregateRawFinalizationInput,
): Phase10C0VS6FinalizedAggregatePacket {
  const root = phase10C0VS6PhysicalRepositoryRoot(input.repositoryRoot);
  assertActiveFinalizationAuthority(input, root);
  phase10C0VS6SameIdentity(
    input.lockedAuthority.packetProtocolIdentity,
    input.packetProtocolIdentity,
    "aggregate finalizer locked packet protocol",
  );
  if (!sameBytes(input.lockedAuthority.packetProtocolBytes, input.packetProtocolBytes)) {
    fail("aggregate finalizer packet bytes differ from active locked authority");
  }
  const retained = derivePhase10C0VS6RetainedRuntimeAuthority(input);
  const packet = retained.packet;
  if (packet.packetId !== "c0v-aggregate" || input.lockedAuthority.packet.packetId !== packet.packetId ||
    input.lockedAuthority.packet.protocolId !== packet.protocolId ||
    input.lockedAuthority.packet.registeredAttemptId !== packet.registeredAttemptId) {
    fail("aggregate finalizer received a different packet/locked authority");
  }
  const priorPrefix = independentlyReopenPhase10C0VS6VerifiedPublishedDependencies(input);
  exactRoster(
    priorPrefix.selectedPackets.map((entry) => entry.packet.packetId),
    chronologicalPriorPacketIds(input.lockedAuthority.catalogue, packet.packetId),
    "aggregate deeply verified chronological prefix",
  );
  const authority = reopenCurrentPacketAuthority(input, packet, retained.preflight);
  const materialized = independentlyMaterializePhase10C0VS6TerminalCandidate(
    input,
    input.capturedGovernedCallerResult,
  );
  if (existsSync(resolve(root.path, materialized.candidatePath))) {
    fail("aggregate terminal candidate existed before current raw finalization");
  }
  const candidate = materialized;
  const scanned = projectTerminalCandidateIntoAttemptScan(
    scanAttemptRoot(root, retained.preflight.observed.attemptDirectory),
    candidate,
  );
  assertAttemptRootByteLimits(authority.catalogue, candidate, scanned);
  exactRoster(
    scanned.map((entry) => entry.identity.path),
    exactExpectedAttemptPaths(packet, retained.preflight, candidate.lifecycle.selectedSubrouteId),
    "aggregate finalized attempt-root census",
  );
  const subroutes = packet.terminalSubroutes.filter((entry) =>
    entry.subrouteId === candidate.lifecycle.selectedSubrouteId);
  if (subroutes.length !== 1) fail("aggregate lifecycle route disappeared from packet authority");
  const subroute = subroutes[0]!;
  const acceptedPacketCredit = subroute.dispositionCode === null &&
    subroute.requiredOutputIds.some((entry) => entry.endsWith("-verification"));
  const callerRows = candidate.candidate.callerInvocationResults;
  const callerRosters = packet.terminalReceiptContract.callerInvocationResultRosters.filter((entry) =>
    entry.subrouteId === candidate.lifecycle.selectedSubrouteId);
  if (callerRosters.length !== 1) fail("aggregate route lacks one caller-result roster");
  exactRoster(
    callerRows.map((entry) => entry.callerInvocationId),
    callerRosters[0]!.callerInvocationResults.map((entry) => entry.callerInvocationId),
    "aggregate full caller invocation roster",
  );
  const publicationArtifacts = currentCandidatePublicationArtifacts(authority, candidate);

  let verification: Phase10C0VS6PacketVerificationV2 | null = null;
  let verificationIdentity: Phase10C0VS6ArtifactIdentity | null = null;
  let verificationBytes: Uint8Array | null = null;
  let verificationAuthority: Phase10C0VS6PacketVerificationV2Authority | null = null;
  if (acceptedPacketCredit) {
    const output = (outputId: string): Phase10C0VS6ReopenedPublishedArtifact => {
      const rows = publicationArtifacts.filter((entry) => entry.outputId === outputId);
      if (rows.length !== 1) fail(`aggregate completion lacks one ${outputId} candidate`);
      return rows[0]!;
    };
    const tableArtifact = output("out-c0v-terminal-table");
    const resourceArtifact = output("out-c0v-resource-ledger");
    const aggregateArtifact = output("out-c0v-aggregate");
    const indexArtifact = output("out-c0v-artifact-index");
    const terminalTable = parsePhase10C0VTerminalTableBytes(tableArtifact.bytes);
    const resourceLedger = parsePhase10C0VResourceLedgerBytes(resourceArtifact.bytes);
    const aggregate = parsePhase10C0VAggregateResultBytes(aggregateArtifact.bytes);
    const artifactIndex = parsePhase10C0VAggregateArtifactIndexBytes(indexArtifact.bytes);
    if (callerRows.length !== 1 || callerRows[0]!.evaluatorResult === null ||
      callerRows[0]!.callerCallableId !== "phase10-c0v-aggregate-check-caller" ||
      callerRows[0]!.evaluatorCallableId !== "phase10-c0v-aggregate-evaluator") {
      fail("aggregate completion lacks its exact governed evaluator result");
    }
    const evaluatorResult = strictJsonSnapshot(callerRows[0]!.evaluatorResult);
    const evaluation = object(evaluatorResult, "aggregate governed evaluator result");
    if (evaluation.schema !== "phase10-c0v-aggregate-independent-evaluation-v1" ||
      evaluation.packetId !== "c0v-aggregate" ||
      evaluation.evaluatorCallableId !== "phase10-c0v-aggregate-evaluator" ||
      evaluation.aggregateVerdict !== "pass") {
      fail("aggregate governed evaluator scope/verdict differs");
    }
    for (const [field, parsed] of [
      ["terminalTable", terminalTable],
      ["resourceLedger", resourceLedger],
      ["aggregate", aggregate],
      ["artifactIndex", artifactIndex],
    ] as const) {
      phase10C0VS6SameJson(
        strictJsonSnapshot(evaluation[field]),
        strictJsonSnapshot(parsed),
        `aggregate governed evaluator ${field}`,
      );
    }
    if (!Array.isArray(evaluation.outputIdentities) || evaluation.outputIdentities.length !== 4) {
      fail("aggregate governed evaluator output identity roster differs");
    }
    const expectedOutputIdentities = [
      tableArtifact.identity,
      resourceArtifact.identity,
      aggregateArtifact.identity,
      indexArtifact.identity,
    ] as const;
    for (let index = 0; index < expectedOutputIdentities.length; index += 1) {
      phase10C0VS6SameIdentity(
        parsePhase10C0VS6ArtifactIdentity(
          evaluation.outputIdentities[index],
          `aggregate evaluator output identity[${index}]`,
        ),
        expectedOutputIdentities[index]!,
        `aggregate evaluator output identity[${index}]`,
      );
    }
    const timing = packetGovernedTiming(packet, candidate, null, null);
    const packetResources = packetResourceAccounting(
      packet,
      candidate,
      null,
      null,
      scanned,
      publicationArtifacts,
    );
    const processAccounting = packageProcessAccounting(
      authority.catalogue,
      packet,
      timing,
      priorPrefix.selectedPackets,
    );
    const packageResources = packageResourceAccounting(
      root,
      packet,
      processAccounting,
      packetResources,
      priorPrefix.selectedPackets,
    );
    const verifiedArtifacts = deriveCurrentVerifiedArtifacts(authority, candidate, publicationArtifacts);
    const checkResults = deriveCheckResults(
      authority.matrix,
      packet,
      candidate.lifecycle.selectedSubrouteId,
      callerRows,
    );
    phase10C0VS6SameJson(
      strictJsonSnapshot(checkResults),
      strictJsonSnapshot(evaluation.checkResults),
      "aggregate verification checks versus governed evaluator",
    );
    const executedNegativeControlIds = Object.freeze(
      [...new Set(callerRows.flatMap((entry) => [...entry.executedNegativeControlIds]))]
        .sort(codePointCompare),
    );
    exactRoster(executedNegativeControlIds, subroute.requiredNegativeControlIds,
      "aggregate executed negative-control roster");
    const negativeControlResults = deriveAggregateNegativeControlResults(
      root,
      retained.preflight,
      evaluatorResult,
    );
    exactRoster(
      negativeControlResults.map((entry) => entry.negativeControlId),
      executedNegativeControlIds,
      "aggregate negative-control result roster",
    );
    const execution = independentlyConstructProduceExecution(
      packet,
      candidate.lifecycle.selectedSubrouteId,
      retained.preflight,
      callerRows,
      timing,
      root,
    );
    verificationAuthority = Object.freeze({
      selectedSubrouteId: candidate.lifecycle.selectedSubrouteId,
      verifiedArtifacts,
      checkResults,
      executedNegativeControlIds,
      negativeControlResults,
      execution,
      callerInvocationResults: callerRows,
      governedTiming: timing,
      packageProcessAccounting: processAccounting,
      packetResourceAccounting: packetResources,
      packageResourceAccounting: packageResources,
    });
    const value = Object.freeze({
      schema: "phase10-packet-verification-v2" as const,
      verificationId: `phase10-${packet.packetId}-${packet.registeredAttemptId}-verification-v2`,
      matrixId: authority.matrix.matrixId,
      protocolId: packet.protocolId,
      registryId: packet.registryId,
      packetId: packet.packetId,
      terminalState: "complete" as const,
      verifiedArtifacts,
      checkResults,
      executedNegativeControlIds,
      negativeControlResults,
      boundDependencyPacketIds: packet.boundDependencyPacketIds,
      execution,
      callerInvocationResults: callerRows,
      governedTiming: timing,
      packageProcessAccounting: processAccounting,
      packetResourceAccounting: packetResources,
      packageResourceAccounting: packageResources,
      aggregateVerdict: "pass" as const,
      limits: packet.claimBoundary.forbidden,
    });
    verificationBytes = writePhase10C0VAggregateVerificationReceipt(
      value,
      packet,
      verificationAuthority,
    );
    const projection = finalizationProjection(packet, "packet-verification");
    verificationIdentity = assertFreshPublicationBytes(
      root,
      packet,
      projection.path,
      verificationBytes,
      projection.maximumByteLength,
    );
    verification = parsePhase10C0VS6PacketVerificationV2Bytes(
      verificationBytes,
      packet,
      verificationAuthority,
    );
  } else if (publicationArtifacts.some((entry) =>
    entry.identity.path !== candidate.lifecycle.preflightIdentity.path)) {
    fail("aggregate maker-return route retained forbidden structural candidates");
  }

  for (const artifact of publicationArtifacts) {
    if (artifact.identity.path !== candidate.lifecycle.preflightIdentity.path) {
      assertFreshPublicationBytes(root, packet, artifact.identity.path, artifact.bytes, null);
    }
  }
  const reasons = terminalReasonCodes(candidate, acceptedPacketCredit);
  const invocationRecords = candidate.lifecycle.registeredCap === null
    ? Object.freeze([])
    : candidate.lifecycle.packetInvocationRecords;
  const terminalAuthority: Phase10C0VS6TerminalReceiptAuthority = Object.freeze({
    selectedSubrouteId: candidate.lifecycle.selectedSubrouteId,
    terminalState: candidate.lifecycle.terminalState,
    preflight: candidate.lifecycle.preflightIdentity,
    terminalCandidate: candidate.candidateIdentity,
    attemptLedger: null,
    packetVerification: verificationIdentity,
    invocationRecords,
    callerInvocationResults: callerRows,
    registeredCap: candidate.lifecycle.registeredCap,
    reasons,
  });
  const terminalValue = Object.freeze({
    schema: packet.terminalReceiptContract.receiptSchema,
    receiptId: `phase10-${packet.packetId}-${packet.registeredAttemptId}-terminal-v2`,
    matrixId: authority.matrix.matrixId,
    protocolId: packet.protocolId,
    registryId: packet.registryId,
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    terminalState: candidate.lifecycle.terminalState,
    dispositionCode: candidate.lifecycle.dispositionCode,
    preflight: candidate.lifecycle.preflightIdentity,
    terminalCandidate: candidate.candidateIdentity,
    attemptLedger: null,
    packetVerification: verificationIdentity,
    producedOutputIds: subroute.requiredOutputIds,
    executedCheckIds: subroute.requiredCheckIds,
    executedNegativeControlIds: subroute.requiredNegativeControlIds,
    invocationRecords,
    callerInvocationResults: callerRows,
    registeredCap: candidate.lifecycle.registeredCap,
    acceptedPacketCredit,
    dependencyValid: acceptedPacketCredit,
    verdict: acceptedPacketCredit ? "complete" as const : "refusal" as const,
    reasons,
  });
  const terminalBytes = writePhase10C0VS6TerminalReceipt(terminalValue, packet, terminalAuthority);
  const terminalProjection = finalizationProjection(packet, "terminal-receipt");
  if (terminalProjection.path !== packet.paths.terminalReceiptPath) {
    fail("aggregate terminal finalization path differs from packet terminal path");
  }
  const terminalIdentity = assertFreshPublicationBytes(
    root,
    packet,
    terminalProjection.path,
    terminalBytes,
    terminalProjection.maximumByteLength,
  );
  let terminal = parsePhase10C0VS6TerminalReceiptV2Bytes(terminalBytes, packet, terminalAuthority);
  const selectedPublicationPaths = subroute.requiredOutputIds.map((outputId) =>
    outputDefinition(authority.matrix, packet.packetId, outputId).artifact.path);
  assertNoPublicationStages(packet, root);
  assertSelectedPrefixClosedWorld(
    authority,
    packet,
    priorPrefix.selectedPackets,
    Object.freeze(selectedPublicationPaths),
  );
  assertActiveFinalizationAuthority(input, root);

  const publishedCandidate = publishProjectedTerminalCandidate(input, root, candidate);
  const publishedArtifacts = publishCandidatePublicationArtifacts(
    input,
    authority,
    candidate,
    publicationArtifacts,
  );
  if (verificationIdentity !== null && verificationBytes !== null && verificationAuthority !== null) {
    const projection = finalizationProjection(packet, "packet-verification");
    const publishedVerification = publishFreshBytes(
      input,
      root,
      packet,
      projection.path,
      verificationBytes,
      projection.maximumByteLength,
    );
    phase10C0VS6SameIdentity(publishedVerification, verificationIdentity,
      "aggregate published packet verification");
    verification = parsePhase10C0VS6PacketVerificationV2Bytes(
      phase10C0VS6ReadUniquePhysicalFile(root, verificationIdentity.path),
      packet,
      verificationAuthority,
    );
  } else if (verificationIdentity !== null || verificationBytes !== null || verificationAuthority !== null) {
    fail("aggregate verification projection is only partially materialized");
  }
  const publishedTerminal = publishFreshBytes(
    input,
    root,
    packet,
    terminalProjection.path,
    terminalBytes,
    terminalProjection.maximumByteLength,
  );
  phase10C0VS6SameIdentity(publishedTerminal, terminalIdentity, "aggregate published terminal receipt");
  terminal = parsePhase10C0VS6TerminalReceiptV2Bytes(
    phase10C0VS6ReadUniquePhysicalFile(root, terminalIdentity.path),
    packet,
    terminalAuthority,
  );
  assertNoPublicationStages(packet, root);
  assertSelectedPrefixClosedWorld(
    authority,
    packet,
    priorPrefix.selectedPackets,
    Object.freeze(selectedPublicationPaths),
  );
  assertActiveFinalizationAuthority(input, root);
  return Object.freeze({
    terminalCandidate: publishedCandidate,
    publishedArtifacts,
    verification,
    verificationIdentity,
    verificationBytes: verificationBytes === null ? null : new Uint8Array(verificationBytes),
    terminalReceipt: terminal,
    terminalReceiptIdentity: terminalIdentity,
    terminalReceiptBytes: new Uint8Array(terminalBytes),
  });
}

function verifyCorePacket(
  authority: ReopenedAuthority,
  packetId: Phase10C0VS6DeeplyVerifiedPacketId,
  prior: readonly Phase10C0VS6VerifiedPublishedPacket[],
  semanticReproof: Phase10C0VS6HistoricalPacketSemanticReproof | null = null,
): Phase10C0VS6VerifiedPublishedPacket {
  const rawInput = rawInputForPacket(authority, packetId);
  const retained = derivePhase10C0VS6RetainedRuntimeAuthority(rawInput);
  const packet = retained.packet;
  const candidate = independentlyReopenPhase10C0VS6HistoricalTerminalCandidate(rawInput);
  if (candidate.lifecycle.selectedSubrouteId !== candidate.candidate.selectedSubrouteId ||
    candidate.lifecycle.dispositionCode !== candidate.candidate.dispositionCode) {
    fail(`${packetId} candidate selected its own lifecycle route`);
  }
  let selectedAttempt: Phase10C0VS6AttemptRowV2 | null = null;
  let ledgerIdentity: Phase10C0VS6ArtifactIdentity | null = null;
  let ledgerBytes: Uint8Array | null = null;
  let callerRows = candidate.candidate.callerInvocationResults;
  if (packetId === "c0v-moving-produce" || packetId === "c0v-radial-produce" ||
    packetId === "c0v-static-produce") {
    const ledger = selectedDependencyArtifact(
      authority,
      packetId,
      "phase10-c0v-attempt-ledger-v2",
      "attempt ledger",
    );
    ledgerIdentity = ledger.identity;
    ledgerBytes = ledger.bytes;
    const rows = parsePhase10C0VS6AttemptLedgerV2(ledgerBytes, `${packetId} final attempt ledger`);
    if (rows.length !== 1) fail(`${packetId} final ledger does not contain its sole attempt`);
    selectedAttempt = rows[0]!;
    phase10C0VS6SameIdentity(
      selectedAttempt.terminalCandidate,
      candidate.candidateIdentity,
      `${packetId} attempt terminal candidate`,
    );
    callerRows = Object.freeze([
      ...callerRows,
      ...postCandidateCallerResults(rawInput, candidate, ledgerIdentity, ledgerBytes),
    ]);
  }
  const expectedCallerRoster = packet.terminalReceiptContract.callerInvocationResultRosters.filter((entry) =>
    entry.subrouteId === candidate.lifecycle.selectedSubrouteId);
  if (expectedCallerRoster.length !== 1) fail(`${packetId} lacks one full caller-result roster`);
  exactRoster(
    callerRows.map((entry) => entry.callerInvocationId),
    expectedCallerRoster[0]!.callerInvocationResults.map((entry) => entry.callerInvocationId),
    `${packetId} full caller invocation roster`,
  );

  const scanned = scanAttemptRoot(authority.root, retained.preflight.observed.attemptDirectory);
  assertAttemptRootByteLimits(authority.catalogue, candidate, scanned);
  const expectedAttemptPaths = exactExpectedAttemptPaths(
    packet,
    retained.preflight,
    candidate.lifecycle.selectedSubrouteId,
  ).filter((path) => path !== `${retained.preflight.observed.candidateDirectory}/${basename(ledgerIdentity?.path ?? "")}`);
  exactRoster(scanned.map((entry) => entry.identity.path), expectedAttemptPaths, `${packetId} attempt-root census`);
  if (packetId === "c0v-radial-produce") assertRadialReproofAttemptCensus(candidate, scanned);
  const publicationArtifacts = materializedPublicationArtifacts(authority, packet, candidate);
  if (packetId === "a-p-c0v-s6") {
    assertApCandidatePublicationJoin(authority, candidate, publicationArtifacts);
    if (semanticReproof !== null) fail("A-P packet received an unrelated semantic reproof");
  } else if (packetId === "c0v-moving-publish" || packetId === "c0v-radial-publish" ||
    packetId === "c0v-static-publish") {
    if (semanticReproof === null) fail(`${packetId} lacks its independent semantic reproof`);
    assertSemanticCandidatePublicationJoin(authority, candidate, publicationArtifacts, semanticReproof);
  } else if (semanticReproof !== null) {
    fail(`${packetId} received an unrelated semantic reproof`);
  }
  if (packetId === "c0v-radial-produce" && candidate.lifecycle.radialReproof !== null) {
    assertRadialCandidatePublicationJoin(authority, candidate, publicationArtifacts);
  }
  assertNoPublicationStages(packet, authority.root);
  const packetResources = packetResourceAccounting(
    packet,
    candidate,
    selectedAttempt,
    ledgerIdentity,
    scanned,
    publicationArtifacts,
  );
  const timing = packetGovernedTiming(packet, candidate, ledgerIdentity, selectedAttempt);
  const processAccounting = packageProcessAccounting(authority.catalogue, packet, timing, prior);
  const resources = packageResourceAccounting(
    authority.root,
    packet,
    processAccounting,
    packetResources,
    prior,
  );
  const verifiedArtifacts = deriveVerifiedArtifacts(authority, packet, candidate);
  const checkResults = deriveCheckResults(
    authority.matrix,
    packet,
    candidate.lifecycle.selectedSubrouteId,
    callerRows,
  );
  const negativeControlResults = packetId === "a-p-c0v-s6"
    ? deriveApNegativeControlResults(candidate, authority.root)
    : packetId === "c0v-radial-produce" && candidate.lifecycle.radialReproof !== null
      ? deriveRadialNegativeControlResults(candidate)
      : Object.freeze([]);
  const executedNegativeControlIds = Object.freeze(
    [...new Set(callerRows.flatMap((entry) => [...entry.executedNegativeControlIds]))]
      .sort(codePointCompare),
  );
  exactRoster(
    negativeControlResults.map((entry) => entry.negativeControlId),
    executedNegativeControlIds,
    `${packetId} negative-control result roster`,
  );

  const verificationDependency = selectedDependencyArtifact(
    authority,
    packetId,
    "phase10-packet-verification-v2",
    "packet verification-v2",
  );
  const verificationRaw = object(
    parsePhase10C0VS6PrettyJsonBytes(verificationDependency.bytes, `${packetId} verification-v2`),
    `${packetId} verification-v2`,
  );
  const execution = deriveExecution(
    verificationRaw,
    packet,
    candidate.lifecycle.selectedSubrouteId,
    retained.preflight,
    callerRows,
    timing,
    authority.root,
  );
  const verificationAuthority: Phase10C0VS6PacketVerificationV2Authority = Object.freeze({
    selectedSubrouteId: candidate.lifecycle.selectedSubrouteId,
    verifiedArtifacts,
    checkResults,
    executedNegativeControlIds,
    negativeControlResults,
    execution,
    callerInvocationResults: callerRows,
    governedTiming: timing,
    packageProcessAccounting: processAccounting,
    packetResourceAccounting: packetResources,
    packageResourceAccounting: resources,
  });
  const verification = parsePhase10C0VS6PacketVerificationV2Bytes(
    verificationDependency.bytes,
    packet,
    verificationAuthority,
  );
  const verificationIdentity = phase10C0VS6ArtifactIdentity(
    verificationDependency.identity.path,
    verificationDependency.bytes,
  );
  phase10C0VS6SameIdentity(
    verificationIdentity,
    verificationDependency.identity,
    `${packetId} verification dependency identity`,
  );

  const terminalDependency = selectedDependencyArtifact(
    authority,
    packetId,
    "phase10-c0v-s6-terminal-receipt-v2",
    "terminal-v2 receipt",
  );
  const terminal = parsePhase10C0VS6TerminalReceiptV2Bytes(terminalDependency.bytes, packet, {
    selectedSubrouteId: candidate.lifecycle.selectedSubrouteId,
    terminalState: candidate.lifecycle.terminalState,
    preflight: candidate.lifecycle.preflightIdentity,
    terminalCandidate: candidate.candidateIdentity,
    attemptLedger: ledgerIdentity,
    packetVerification: verificationIdentity,
    invocationRecords: Object.freeze([]),
    callerInvocationResults: callerRows,
    registeredCap: candidate.lifecycle.registeredCap,
    reasons: Object.freeze([]),
  });
  const terminalIdentity = phase10C0VS6ArtifactIdentity(terminalDependency.identity.path, terminalDependency.bytes);
  phase10C0VS6SameIdentity(terminalIdentity, terminalDependency.identity, `${packetId} terminal dependency identity`);
  if (!terminal.acceptedPacketCredit || !terminal.dependencyValid || terminal.verdict !== "complete") {
    fail(`${packetId} terminal receipt does not grant independently verified dependency credit`);
  }

  const protocolArtifact = readArtifact(authority.root, rawInput.packetProtocolIdentity.path,
    rawInput.packetProtocolIdentity, `${packetId} protocol result artifact`);
  const finalArtifacts: readonly Phase10C0VS6ReopenedPublishedArtifact[] = Object.freeze([
    Object.freeze({
      artifactRole: "packet-protocol" as const,
      outputId: null,
      identity: protocolArtifact.identity,
      bytes: protocolArtifact.bytes,
    }),
    ...scanned,
    ...publicationArtifacts,
    Object.freeze({
      artifactRole: "packet-verification" as const,
      outputId: null,
      identity: verificationIdentity,
      bytes: verificationDependency.bytes,
    }),
    Object.freeze({
      artifactRole: "terminal-receipt" as const,
      outputId: null,
      identity: terminalIdentity,
      bytes: terminalDependency.bytes,
    }),
  ]);
  const retainedPhysicalPaths = Object.freeze([
    ...scanned.map((entry) => entry.identity.path),
    ...publicationArtifacts.map((entry) => entry.identity.path),
    verificationIdentity.path,
    terminalIdentity.path,
  ].sort(codePointCompare));
  if (new Set(retainedPhysicalPaths).size !== retainedPhysicalPaths.length) {
    fail(`${packetId} finalized retained path census contains a duplicate`);
  }
  const finalizedPacketRetainedBytes = safeIntegerSum([
    packetResources.attemptTerminalRetainedBytes,
    packetResources.materializedPublicationBytes,
    verificationIdentity.byteLength,
    terminalIdentity.byteLength,
  ], `${packetId} finalized retained bytes`);
  return Object.freeze({
    packet,
    preflight: retained.preflight,
    selectedSubrouteId: candidate.lifecycle.selectedSubrouteId,
    dispositionCode: candidate.lifecycle.dispositionCode,
    terminalCandidate: candidate,
    selectedAttempt,
    attemptLedgerIdentity: ledgerIdentity,
    attemptLedgerBytes: ledgerBytes,
    verification,
    verificationIdentity,
    verificationBytes: verificationDependency.bytes,
    terminalReceipt: terminal,
    terminalReceiptIdentity: terminalIdentity,
    terminalReceiptBytes: terminalDependency.bytes,
    governedElapsedNanoseconds: timing.governedInvocationElapsedNanoseconds,
    finalizedPacketRetainedBytes,
    retainedPhysicalPaths,
    reopenedArtifacts: finalArtifacts,
  });
}

function selectedPrefixDependencyArtifact(
  artifacts: readonly Phase10C0VS6ReopenedDependencyArtifact[],
  packetId: string,
  schemaId: string,
  label: string,
): Phase10C0VS6ReopenedDependencyArtifact {
  const rows = artifacts.filter((entry) => entry.packetId === packetId && entry.schemaId === schemaId);
  if (rows.length !== 1) fail(`${packetId} dependency roster lacks one ${label}`);
  return rows[0]!;
}

function exactCandidateFilename(filenames: readonly string[], suffix: string): string {
  const rows = filenames.filter((entry) => entry.endsWith(suffix));
  if (rows.length !== 1) fail(`${suffix} does not resolve one historical candidate filename`);
  return rows[0]!;
}

interface Phase10C0VS6HistoricalPublicationConfig {
  readonly packetId: "c0v-moving-publish" | "c0v-radial-publish" | "c0v-static-publish";
  readonly producePacketId: "c0v-moving-produce" | "c0v-radial-produce" | "c0v-static-produce";
  readonly resultFilename: "c0v-moving-result.json" | "c0v-radial-result.json" | "c0v-static-result.json";
  readonly artifactIndexFilename:
    | "c0v-moving-artifact-index.json"
    | "c0v-radial-artifact-index.json"
    | "c0v-static-artifact-index.json";
  readonly resultOutputId: "out-c0v-moving-result" | "out-c0v-radial-result" | "out-c0v-static-result";
  readonly artifactIndexOutputId:
    | "out-c0v-moving-artifact-index"
    | "out-c0v-radial-artifact-index"
    | "out-c0v-static-artifact-index";
  readonly callerCallableId:
    | "phase10-c0v-moving-publish-check-caller"
    | "phase10-c0v-radial-publish-check-caller"
    | "phase10-c0v-static-publish-check-caller";
  readonly evaluate: (
    packet: Phase10C0VS6PacketProtocol,
    verifiedProduce: Phase10C0VS6VerifiedPublishedPacket,
    candidate: Phase10C0VS6PublishCandidate,
  ) => Phase10C0VPublicationSemanticEvaluation;
}

const HISTORICAL_PUBLICATION_CONFIGS = Object.freeze({
  "c0v-moving-publish": Object.freeze({
    packetId: "c0v-moving-publish",
    producePacketId: "c0v-moving-produce",
    resultFilename: "c0v-moving-result.json",
    artifactIndexFilename: "c0v-moving-artifact-index.json",
    resultOutputId: "out-c0v-moving-result",
    artifactIndexOutputId: "out-c0v-moving-artifact-index",
    callerCallableId: "phase10-c0v-moving-publish-check-caller",
    evaluate: (
      packet: Phase10C0VS6PacketProtocol,
      verifiedProduce: Phase10C0VS6VerifiedPublishedPacket,
      candidate: Phase10C0VS6PublishCandidate,
    ) => independentlyEvaluatePhase10C0VMovingPublicationSemantic(Object.freeze({
      publicationPacket: packet,
      verifiedProduce,
      candidate,
    })),
  }),
  "c0v-radial-publish": Object.freeze({
    packetId: "c0v-radial-publish",
    producePacketId: "c0v-radial-produce",
    resultFilename: "c0v-radial-result.json",
    artifactIndexFilename: "c0v-radial-artifact-index.json",
    resultOutputId: "out-c0v-radial-result",
    artifactIndexOutputId: "out-c0v-radial-artifact-index",
    callerCallableId: "phase10-c0v-radial-publish-check-caller",
    evaluate: (
      packet: Phase10C0VS6PacketProtocol,
      verifiedProduce: Phase10C0VS6VerifiedPublishedPacket,
      candidate: Phase10C0VS6PublishCandidate,
    ) => independentlyEvaluatePhase10C0VRadialPublicationSemantic(Object.freeze({
      publicationPacket: packet,
      verifiedProduce,
      candidate,
    })),
  }),
  "c0v-static-publish": Object.freeze({
    packetId: "c0v-static-publish",
    producePacketId: "c0v-static-produce",
    resultFilename: "c0v-static-result.json",
    artifactIndexFilename: "c0v-static-artifact-index.json",
    resultOutputId: "out-c0v-static-result",
    artifactIndexOutputId: "out-c0v-static-artifact-index",
    callerCallableId: "phase10-c0v-static-publish-check-caller",
    evaluate: (
      packet: Phase10C0VS6PacketProtocol,
      verifiedProduce: Phase10C0VS6VerifiedPublishedPacket,
      candidate: Phase10C0VS6PublishCandidate,
    ) => independentlyEvaluatePhase10C0VStaticPublicationSemantic(Object.freeze({
      publicationPacket: packet,
      verifiedProduce,
      candidate,
    })),
  }),
} as const satisfies Readonly<Record<
  "c0v-moving-publish" | "c0v-radial-publish" | "c0v-static-publish",
  Phase10C0VS6HistoricalPublicationConfig
>>);

function publicationConfig(
  packetId: Phase10C0VS6DeeplyVerifiedPacketId,
): Phase10C0VS6HistoricalPublicationConfig | null {
  return packetId === "c0v-moving-publish" || packetId === "c0v-radial-publish" ||
    packetId === "c0v-static-publish"
    ? HISTORICAL_PUBLICATION_CONFIGS[packetId]
    : null;
}

function isDeeplyVerifiedPacketId(packetId: string): packetId is Phase10C0VS6DeeplyVerifiedPacketId {
  return packetId === "a-p-c0v-s6" || packetId === "c0v-moving-produce" ||
    packetId === "c0v-moving-publish" || packetId === "c0v-radial-produce" ||
    packetId === "c0v-radial-publish" || packetId === "c0v-static-produce" ||
    packetId === "c0v-static-publish";
}

/** Raw publication reproof derived from the already-verified chronological produce prefix. */
function independentlyReprovePublicationPacket(
  authority: ReopenedAuthority,
  config: Phase10C0VS6HistoricalPublicationConfig,
  prior: readonly Phase10C0VS6VerifiedPublishedPacket[],
): Phase10C0VS6HistoricalPacketSemanticReproof {
  const rawInput = rawInputForPacket(authority, config.packetId);
  const packet = derivePhase10C0VS6RetainedRuntimeAuthority(rawInput).packet;
  const candidate = independentlyReopenPhase10C0VS6HistoricalTerminalCandidate(rawInput);
  if (candidate.lifecycle.selectedSubrouteId !== `${config.packetId}-structural-complete` ||
    candidate.lifecycle.dispositionCode !== null || candidate.lifecycle.terminalState !== "complete") {
    fail(`${config.packetId} dependency did not select its exact structural-complete route`);
  }
  const filenames = packet.candidateFilenameRosters[candidate.lifecycle.selectedSubrouteId];
  if (filenames === undefined) fail(`${config.packetId} completion lacks a candidate filename roster`);
  const resultBytes = phase10C0VS6ReadUniquePhysicalFile(
    authority.root,
    `${candidate.lifecycle.preflight.observed.candidateDirectory}/${
      exactCandidateFilename(filenames, config.resultFilename)}`,
  );
  const artifactIndexBytes = phase10C0VS6ReadUniquePhysicalFile(
    authority.root,
    `${candidate.lifecycle.preflight.observed.candidateDirectory}/${
      exactCandidateFilename(filenames, config.artifactIndexFilename)}`,
  );
  const produceRows = prior.filter((entry) => entry.packet.packetId === config.producePacketId);
  if (produceRows.length !== 1) {
    fail(`${config.packetId} semantic reproof lacks its exact deeply verified produce packet`);
  }
  const evaluation = config.evaluate(packet, produceRows[0]!, Object.freeze({ resultBytes, artifactIndexBytes }));
  if (evaluation.packetId !== config.packetId || evaluation.aggregateVerdict !== "pass") {
    fail(`${config.packetId} independent semantic reproof did not return its exact passing evaluation`);
  }
  const checkIds = Object.freeze(evaluation.checkResults.map((entry) => entry.checkId));
  if (evaluation.checkResults.some((entry) => entry.verdict !== "pass" || entry.reasons.length !== 0) ||
    checkIds.length !== 3 || new Set(checkIds).size !== checkIds.length) {
    fail(`${config.packetId} independent semantic check roster differs`);
  }
  return Object.freeze({
    packetId: config.packetId,
    callerCallableId: config.callerCallableId,
    evaluatorCallableId: evaluation.evaluatorCallableId,
    evaluatorResult: strictJsonSnapshot(evaluation),
    executedCheckIds: checkIds,
    evaluatedCheckIds: checkIds,
    executedNegativeControlIds: Object.freeze([]),
    candidatePublishedOutputs: Object.freeze([
      Object.freeze({ outputId: config.artifactIndexOutputId, identity: evaluation.artifactIndexIdentity }),
      Object.freeze({ outputId: config.resultOutputId, identity: evaluation.resultIdentity }),
    ]),
  });
}

/**
 * Deeply verifies the currently usable selected dependency prefix.  The caller passes only the
 * current packet's raw retained authority; dependency paths, route selection, attempt semantics,
 * receipt identities, accounting totals, and packet-specific evaluator results are all reopened
 * and independently derived here.
 */
function verifyProduceDependencyPrefix(
  repositoryRoot: string,
  current: Readonly<{
    readonly packet: Phase10C0VS6PacketProtocol;
    readonly preflight: Phase10C0VS6RetainedPreflight;
    readonly packetProtocolIdentity: Phase10C0VS6ArtifactIdentity;
  }>,
  shallow: Phase10C0VS6ReopenedDependencySet,
  semanticReproofs: readonly Phase10C0VS6HistoricalPacketSemanticReproof[] = Object.freeze([]),
  historicalCurrent = false,
): Phase10C0VS6VerifiedCoreDependencySet {
  phase10C0VS6SameJson(shallow.packet, current.packet, "shallow/deep current packet authority");
  phase10C0VS6SameJson(shallow.preflight, current.preflight, "shallow/deep current preflight authority");
  const root = phase10C0VS6PhysicalRepositoryRoot(repositoryRoot);
  const manifest = historicalCurrent
    ? (() => {
        const historical = phase10C0VS6HistoricalHeadManifest(root.path, current.preflight.observed.head);
        phase10C0VS6SameIdentity(
          current.preflight.observed.evidenceManifest,
          historical.identity,
          "historical current-packet evidence manifest",
        );
        return historical.entries;
      })()
    : phase10C0VS6ValidateHeadBoundPreflightManifest(root.path, current.preflight);
  const catalogueBytes = phase10C0VS6ReadUniquePhysicalFile(root, current.packet.bindings.packetCatalogue.path);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(current.packet.bindings.packetCatalogue.path, catalogueBytes),
    current.packet.bindings.packetCatalogue,
    "current packet catalogue",
  );
  const catalogue = parsePhase10C0VS6PacketCatalogue(
    parsePhase10C0VS6PrettyJsonBytes(catalogueBytes, "current packet catalogue"),
  );
  exactRoster(catalogue.packets.map((entry) => entry.packetId), PHASE10_C0V_S6_PACKET_IDS, "catalogue packet order");
  const currentCatalogueRows = catalogue.packets.filter((entry) => entry.packetId === current.packet.packetId);
  if (currentCatalogueRows.length !== 1 ||
    currentCatalogueRows[0]!.protocolPath !== current.packetProtocolIdentity.path ||
    currentCatalogueRows[0]!.preflightReceiptPath !== current.packet.paths.preflightReceiptPath ||
    currentCatalogueRows[0]!.terminalReceiptPath !== current.packet.paths.terminalReceiptPath) {
    fail("current packet/preflight paths differ from the exact catalogue row");
  }
  const matrixBytes = phase10C0VS6ReadUniquePhysicalFile(root, current.packet.bindings.matrix.path);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(current.packet.bindings.matrix.path, matrixBytes),
    current.packet.bindings.matrix,
    "current S6 matrix",
  );
  const matrix = parsePhase10C0VS6Matrix(
    parsePhase10C0VS6PrettyJsonBytes(matrixBytes, "current S6 matrix"),
  );
  const baseAuthority: ReopenedAuthority = Object.freeze({
    root,
    catalogue,
    matrix,
    manifest,
    dependencyArtifacts: shallow.artifacts,
  });
  const reproofPacketIds = semanticReproofs.map((entry) => entry.packetId);
  if (new Set(reproofPacketIds).size !== reproofPacketIds.length) {
    fail("packet-specific semantic reproof roster repeats a packet");
  }
  const currentIndex = catalogue.packets.findIndex((entry) => entry.packetId === current.packet.packetId);
  if (currentIndex < 0) fail("current packet is absent from the exact catalogue order");
  const priorCatalogueIds = catalogue.packets.slice(0, currentIndex).map((entry) => entry.packetId);
  if (priorCatalogueIds.some((packetId) => !isDeeplyVerifiedPacketId(packetId))) {
    fail("aggregate cannot appear inside its own dependency prefix");
  }
  const requiredCoreIds = Object.freeze(priorCatalogueIds.filter(isDeeplyVerifiedPacketId));

  const artifactKey = (entry: Phase10C0VS6ReopenedDependencyArtifact): string =>
    `${entry.packetId}\u0000${entry.schemaId}\u0000${entry.identity.path}`;
  const expandedArtifacts = new Map<string, Phase10C0VS6ReopenedDependencyArtifact>();
  const addArtifact = (entry: Phase10C0VS6ReopenedDependencyArtifact): void => {
    const key = artifactKey(entry);
    const prior = expandedArtifacts.get(key);
    if (prior !== undefined) {
      phase10C0VS6SameIdentity(prior.identity, entry.identity, `${entry.identity.path} repeated dependency`);
      if (!sameBytes(prior.bytes, entry.bytes)) fail(`${entry.identity.path} repeated dependency bytes differ`);
    } else {
      expandedArtifacts.set(key, entry);
    }
  };
  for (const entry of shallow.artifacts) addArtifact(entry);

  // Logical dependencies govern the current packet's selected contracts. Chronological package
  // accounting is broader: every earlier S6 packet must be reopened even when it is a sibling,
  // such as moving-publish before radial-produce. Seed those committed outputs from the exact
  // launch-HEAD manifest and matrix; the later direct-contract join remains shallow-only below.
  for (const packetId of requiredCoreIds) {
    const outputRows = matrix.outputs.filter((entry) => entry.packetId === packetId);
    if (outputRows.length === 0) fail(`${packetId} has no registered S6 outputs`);
    for (const output of outputRows) {
      const expected = manifest.get(output.artifact.path);
      if (expected === undefined) continue;
      const artifact = readArtifact(
        root,
        output.artifact.path,
        expected,
        `${packetId} chronological output ${output.outputId}`,
      );
      addArtifact(Object.freeze({
        packetId,
        schemaId: output.artifact.schemaId,
        identity: artifact.identity,
        bytes: artifact.bytes,
      }));
    }
  }

  const pending = [...requiredCoreIds];
  const visited = new Set<Phase10C0VS6DeeplyVerifiedPacketId>();
  while (pending.length > 0) {
    const packetId = pending.shift()!;
    if (visited.has(packetId)) continue;
    const closureAuthority: ReopenedAuthority = Object.freeze({
      ...baseAuthority,
      dependencyArtifacts: Object.freeze([...expandedArtifacts.values()]),
    });
    const rawInput = rawInputForPacket(closureAuthority, packetId);
    const dependency = derivePhase10C0VS6RetainedRuntimeAuthority(rawInput);
    const dependencyIndex = catalogue.packets.findIndex((entry) => entry.packetId === packetId);
    if (dependencyIndex < 0 || dependencyIndex >= currentIndex) {
      fail(`${packetId} is not an earlier packet in the current dependency closure`);
    }
    const nested = phase10C0VS6ReopenHistoricalPublishedDependenciesFromRetainedAuthority({
      repositoryRoot: root.path,
      packet: dependency.packet,
      preflight: dependency.preflight,
    });
    for (const entry of nested.artifacts) addArtifact(entry);
    for (const nestedPacketId of dependency.packet.boundDependencyPacketIds) {
      if (nestedPacketId === "a-p" && packetId === "a-p-c0v-s6") continue;
      if (!isDeeplyVerifiedPacketId(nestedPacketId)) {
        fail(`${packetId} contains an unregistered external dependency`);
      }
      const nestedIndex = catalogue.packets.findIndex((entry) => entry.packetId === nestedPacketId);
      if (nestedIndex < 0 || nestedIndex >= dependencyIndex) {
        fail(`${packetId} dependency closure is not strictly earlier in catalogue order`);
      }
      pending.push(nestedPacketId);
    }
    visited.add(packetId);
  }
  exactRoster(
    requiredCoreIds,
    [...visited].sort((left, right) =>
      catalogue.packets.findIndex((entry) => entry.packetId === left) -
      catalogue.packets.findIndex((entry) => entry.packetId === right)),
    `${current.packet.packetId} transitive dependency closure`,
  );
  const authority: ReopenedAuthority = Object.freeze({
    ...baseAuthority,
    dependencyArtifacts: Object.freeze([...expandedArtifacts.values()]),
  });

  const selected: Phase10C0VS6VerifiedPublishedPacket[] = [];
  for (const packetId of requiredCoreIds) {
    const config = publicationConfig(packetId);
    const derivedReproof = config === null
      ? null
      : independentlyReprovePublicationPacket(authority, config, Object.freeze([...selected]));
    const supplied = semanticReproofs.filter((entry) => entry.packetId === packetId);
    if (supplied.length > 1 || (supplied.length === 1 && derivedReproof === null)) {
      fail(`${packetId} supplied semantic reproof differs from its packet class`);
    }
    if (supplied.length === 1 && derivedReproof !== null) {
      phase10C0VS6SameJson(
        strictJsonSnapshot(supplied[0]),
        strictJsonSnapshot(derivedReproof),
        `${packetId} supplied versus independently derived semantic reproof`,
      );
    }
    selected.push(verifyCorePacket(
      authority,
      packetId,
      Object.freeze([...selected]),
      derivedReproof,
    ));
  }
  if (semanticReproofs.some((entry) => !requiredCoreIds.includes(entry.packetId))) {
    fail("supplied semantic reproof is outside the current chronological prefix");
  }
  const selectedById = new Map<Phase10C0VS6DeeplyVerifiedPacketId, Phase10C0VS6VerifiedPublishedPacket>();
  for (const entry of selected) {
    if (!isDeeplyVerifiedPacketId(entry.packet.packetId)) fail("verified prefix returned aggregate as a dependency");
    selectedById.set(entry.packet.packetId, entry);
  }
  const directSelected = current.packet.boundDependencyPacketIds.map((packetId) => {
    if (!isDeeplyVerifiedPacketId(packetId)) fail("aggregate cannot be a direct dependency");
    const entry = selectedById.get(packetId);
    if (entry === undefined) fail(`${packetId} direct dependency is absent from the verified closure`);
    return entry;
  });
  const selections: readonly Phase10C0VS6DependencyDispositionSelection[] = Object.freeze(
    directSelected.map((entry) => Object.freeze({
      packetId: entry.packet.packetId,
      dispositionCode: entry.dispositionCode,
    })),
  );
  const selectedContracts = validatePhase10C0VS6RetainedPreflightDependencies(
    current.preflight,
    current.packet,
    selections,
    shallow.artifacts.map((entry) => entry.identity),
  );
  phase10C0VS6SameJson(
    selectedContracts,
    shallow.selectedContracts,
    "deep terminal-disposition-selected dependency contracts",
  );
  if (!historicalCurrent) assertSelectedPrefixClosedWorld(authority, current.packet, selected);
  const byPacketId = new Map<Phase10C0VS6DeeplyVerifiedPacketId, Phase10C0VS6VerifiedPublishedPacket>();
  for (const packet of selected) {
    if (packet.packet.packetId !== "a-p-c0v-s6" && packet.packet.packetId !== "c0v-moving-produce" &&
      packet.packet.packetId !== "c0v-moving-publish" && packet.packet.packetId !== "c0v-radial-produce" &&
      packet.packet.packetId !== "c0v-radial-publish" && packet.packet.packetId !== "c0v-static-produce" &&
      packet.packet.packetId !== "c0v-static-publish") {
      fail("core verifier returned an out-of-scope packet");
    }
    byPacketId.set(packet.packet.packetId, packet);
  }
  return Object.freeze({
    currentPacket: current.packet,
    currentPreflight: current.preflight,
    selectedPackets: Object.freeze(selected),
    byPacketId,
  });
}

/**
 * Deeply verifies the usable A-P / moving-produce dependency prefix from a live retained current
 * preflight. This is the normal publication/evaluator entry point.
 */
export function independentlyReopenPhase10C0VS6VerifiedProduceDependencies(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VS6VerifiedCoreDependencySet {
  const current = derivePhase10C0VS6RetainedRuntimeAuthority(input);
  const shallow = phase10C0VS6ReopenPublishedDependencies(input);
  return verifyProduceDependencyPrefix(input.repositoryRoot, Object.freeze({
    ...current,
    packetProtocolIdentity: input.packetProtocolIdentity,
  }), shallow);
}

/**
 * Live-current-preflight verifier for the complete chronological packet prefix. Publication
 * semantics are rederived here from their verified produce packets and cycle-free semantic leaves.
 */
export function independentlyReopenPhase10C0VS6VerifiedPublishedDependencies(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VS6VerifiedCoreDependencySet {
  const current = derivePhase10C0VS6RetainedRuntimeAuthority(input);
  const shallow = phase10C0VS6ReopenPublishedDependencies(input);
  return verifyProduceDependencyPrefix(input.repositoryRoot, Object.freeze({
    ...current,
    packetProtocolIdentity: input.packetProtocolIdentity,
  }), shallow);
}

/**
 * Deep produce-prefix verification for a retained historical packet after later evidence commits.
 * Every old dependency remains checked against the manifest blob at that packet's launch HEAD,
 * while the later live MANIFEST is allowed to contain the subsequently selected packet suffix.
 */
export function independentlyReopenPhase10C0VS6HistoricalVerifiedProduceDependencies(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VS6VerifiedCoreDependencySet {
  const current = derivePhase10C0VS6RetainedRuntimeAuthority(input);
  const shallow = phase10C0VS6ReopenHistoricalPublishedDependenciesFromRetainedAuthority({
    repositoryRoot: input.repositoryRoot,
    packet: current.packet,
    preflight: current.preflight,
  });
  return verifyProduceDependencyPrefix(input.repositoryRoot, Object.freeze({
    ...current,
    packetProtocolIdentity: input.packetProtocolIdentity,
  }), shallow, Object.freeze([]), true);
}

/**
 * Deeply verifies the same prior dependency prefix while the current canonical preflight exists
 * only in memory. The current protocol is independently reopened and raw-compared; the supplied
 * preflight bytes are strict-parsed and every dependency byte is still reopened from its exact
 * launch-HEAD-manifest identity. This function performs no writes and is intended to run under
 * the already-held package and packet locks immediately before preflight publication.
 */
export function independentlyVerifyPhase10C0VS6ObservedProduceDependencyPrefix(
  input: Phase10C0VS6ObservedPreflightDependencyInput,
): Phase10C0VS6VerifiedCoreDependencySet {
  const root = phase10C0VS6PhysicalRepositoryRoot(input.repositoryRoot);
  const suppliedProtocolIdentity = phase10C0VS6ArtifactIdentity(
    input.packetProtocolIdentity.path,
    input.packetProtocolBytes,
  );
  phase10C0VS6SameIdentity(
    suppliedProtocolIdentity,
    input.packetProtocolIdentity,
    "observed current packet protocol bytes",
  );
  const liveProtocol = readArtifact(
    root,
    input.packetProtocolIdentity.path,
    input.packetProtocolIdentity,
    "observed current packet protocol live bytes",
  );
  if (!sameBytes(liveProtocol.bytes, input.packetProtocolBytes)) {
    fail("observed current packet protocol bytes differ from the live unique physical file");
  }
  const packet = parsePhase10C0VS6PacketProtocol(
    parsePhase10C0VS6PrettyJsonBytes(input.packetProtocolBytes, "observed current packet protocol"),
  );
  const preflight = parsePhase10C0VS6RetainedPreflight(
    parsePhase10C0VS6PrettyJsonBytes(input.preflightBytes, "observed in-memory preflight"),
    packet,
    input.packetProtocolIdentity,
  );
  const current = Object.freeze({
    packet,
    preflight,
    packetProtocolIdentity: input.packetProtocolIdentity,
  });
  const shallow = phase10C0VS6ReopenPublishedDependenciesFromRetainedAuthority({
    repositoryRoot: root.path,
    packet,
    preflight,
  });
  return verifyProduceDependencyPrefix(root.path, current, shallow);
}

/**
 * Pre-write equivalent of the fully raw-derived selected prefix verifier.  This retains the
 * current preflight only in memory while independently rederiving every publication semantic.
 */
export function independentlyVerifyPhase10C0VS6ObservedPublishedDependencyPrefix(
  input: Phase10C0VS6ObservedPreflightDependencyInput,
): Phase10C0VS6VerifiedCoreDependencySet {
  const root = phase10C0VS6PhysicalRepositoryRoot(input.repositoryRoot);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(input.packetProtocolIdentity.path, input.packetProtocolBytes),
    input.packetProtocolIdentity,
    "published-prefix observed current protocol bytes",
  );
  const liveProtocol = readArtifact(
    root,
    input.packetProtocolIdentity.path,
    input.packetProtocolIdentity,
    "published-prefix observed current protocol live bytes",
  );
  if (!sameBytes(liveProtocol.bytes, input.packetProtocolBytes)) {
    fail("published-prefix observed current protocol differs from its live unique physical bytes");
  }
  const packet = parsePhase10C0VS6PacketProtocol(
    parsePhase10C0VS6PrettyJsonBytes(input.packetProtocolBytes, "published-prefix observed protocol"),
  );
  const preflight = parsePhase10C0VS6RetainedPreflight(
    parsePhase10C0VS6PrettyJsonBytes(input.preflightBytes, "published-prefix observed preflight"),
    packet,
    input.packetProtocolIdentity,
  );
  const current = Object.freeze({
    packet,
    preflight,
    packetProtocolIdentity: input.packetProtocolIdentity,
  });
  const shallow = phase10C0VS6ReopenPublishedDependenciesFromRetainedAuthority({
    repositoryRoot: root.path,
    packet,
    preflight,
  });
  return verifyProduceDependencyPrefix(root.path, current, shallow);
}

/**
 * Low-level acyclic composition seam used only by the high-level published-prefix module.
 * Publication semantics arrive as independently rerun packet-specific reproofs; this function
 * then performs the common historical candidate, verification-v2, terminal-v2, accounting, and
 * closed-world joins without importing any publication evaluator.
 */
export function independentlyVerifyPhase10C0VS6ObservedDependencyPrefixWithSemanticReproofs(
  input: Phase10C0VS6ObservedPreflightDependencyInput,
  semanticReproofs: readonly Phase10C0VS6HistoricalPacketSemanticReproof[],
): Phase10C0VS6VerifiedCoreDependencySet {
  const root = phase10C0VS6PhysicalRepositoryRoot(input.repositoryRoot);
  const suppliedProtocolIdentity = phase10C0VS6ArtifactIdentity(
    input.packetProtocolIdentity.path,
    input.packetProtocolBytes,
  );
  phase10C0VS6SameIdentity(
    suppliedProtocolIdentity,
    input.packetProtocolIdentity,
    "semantic-prefix current packet protocol bytes",
  );
  const liveProtocol = readArtifact(
    root,
    input.packetProtocolIdentity.path,
    input.packetProtocolIdentity,
    "semantic-prefix current packet protocol live bytes",
  );
  if (!sameBytes(liveProtocol.bytes, input.packetProtocolBytes)) {
    fail("semantic-prefix current packet protocol bytes differ from the live unique physical file");
  }
  const packet = parsePhase10C0VS6PacketProtocol(
    parsePhase10C0VS6PrettyJsonBytes(input.packetProtocolBytes, "semantic-prefix current packet protocol"),
  );
  const preflight = parsePhase10C0VS6RetainedPreflight(
    parsePhase10C0VS6PrettyJsonBytes(input.preflightBytes, "semantic-prefix in-memory preflight"),
    packet,
    input.packetProtocolIdentity,
  );
  const current = Object.freeze({
    packet,
    preflight,
    packetProtocolIdentity: input.packetProtocolIdentity,
  });
  const shallow = phase10C0VS6ReopenPublishedDependenciesFromRetainedAuthority({
    repositoryRoot: root.path,
    packet,
    preflight,
  });
  return verifyProduceDependencyPrefix(root.path, current, shallow, semanticReproofs);
}
