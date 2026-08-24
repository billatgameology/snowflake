import { lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import type { Phase10C0VS6PacketProtocol } from "./phase10-c0v-s6-contracts.ts";
import {
  parsePhase10C0VS6AttemptLedgerV2,
  phase10C0VS6AssertNoFutureAttemptTimestamps,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6SafeRelativePath,
  phase10C0VS6SameIdentity,
  phase10C0VS6ValidateRegisteredExecutableInvocationRoster,
  phase10C0VS6ValidateRegisteredExecutionRecordTuple,
  type Phase10C0VS6AttemptRowV2,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6PartialExecution,
  type Phase10C0VS6ResourceObservation,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  derivePhase10C0VS6RetainedRuntimeAuthority,
  type Phase10C0VS6RawRuntimeAuthorityInput,
} from "./phase10-c0v-s6-runtime-authority.ts";
import {
  independentlyEvaluatePhase10C0VS6WorkerProgress,
  phase10C0VS6VerifyRawWorkerProgress,
} from "./phase10-c0v-s6-worker-progress.ts";
import {
  independentlyEvaluatePhase10C0VS6WorkerInvocations,
} from "./phase10-c0v-s6-worker-invocation.ts";

export type Phase10C0VS6ResourceCheckId =
  | "chk-c0v-radial-resource-boundary"
  | "chk-c0v-moving-resource-boundary"
  | "chk-c0v-static-resource-boundary";

export interface Phase10C0VS6ResourceBoundaryInput extends Phase10C0VS6RawRuntimeAuthorityInput {
  readonly repositoryRoot: string;
  readonly candidateOrFinalLedgerBytes: Uint8Array;
  /** Current-run candidate bytes kept virtual until all pre-publication validation succeeds. */
  readonly projectedTerminalCandidateBytes?: Uint8Array;
}

export interface Phase10C0VS6ResourceBoundaryEvaluation {
  readonly checkId: Phase10C0VS6ResourceCheckId;
  readonly packetId: "c0v-radial-produce" | "c0v-moving-produce" | "c0v-static-produce";
  readonly attemptId: string;
  readonly tupleId: string;
  readonly verifiedObservationCount: number;
  readonly verifiedUniqueArtifactCount: number;
  readonly maximumObservedConcurrentBytes: number;
  readonly terminalRetainedBytes: number;
  readonly attemptProcessHours: number;
  readonly partialExecution: Phase10C0VS6PartialExecution | null;
  readonly verdict: "pass";
  readonly errors: readonly string[];
}

export interface Phase10C0VS6ResourceBoundaryCheckCallerResult {
  readonly evaluation: Phase10C0VS6ResourceBoundaryEvaluation;
  readonly executedCheckIds: readonly [Phase10C0VS6ResourceCheckId];
  readonly evaluatedCheckIds: readonly [Phase10C0VS6ResourceCheckId];
  readonly executedNegativeControlIds: readonly string[];
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 resource evaluator refused: ${message}`);
}

function codePointCompare(left: string, right: string): number {
  const leftPoints = Array.from(left, (entry) => entry.codePointAt(0) as number);
  const rightPoints = Array.from(right, (entry) => entry.codePointAt(0) as number);
  for (let index = 0; index < Math.min(leftPoints.length, rightPoints.length); index += 1) {
    const difference = (leftPoints[index] as number) - (rightPoints[index] as number);
    if (difference !== 0) return difference;
  }
  return leftPoints.length - rightPoints.length;
}

function safeRoot(value: string): string {
  const requested = resolve(value);
  const root = realpathSync(requested);
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink() ||
    relative(requested, root) !== "" || relative(root, requested) !== "") {
    fail("repository root must be a physical directory without an alias or junction");
  }
  return root;
}

function safeAbsolute(root: string, pathValue: string, label: string): string {
  const path = phase10C0VS6SafeRelativePath(pathValue, label);
  const absolute = resolve(root, path);
  const displacement = relative(root, absolute);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
    isAbsolute(displacement)) fail(`${label} escapes repository root`);
  return absolute;
}

function readPhysical(root: string, path: string): Uint8Array {
  const absolute = safeAbsolute(root, path, "resource artifact path");
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
    fail(`${path} is not a unique regular physical file`);
  }
  const physical = realpathSync(absolute);
  if (relative(absolute, physical) !== "" || relative(physical, absolute) !== "") {
    fail(`${path} resolves through an alias or junction`);
  }
  return new Uint8Array(readFileSync(physical));
}

function scanFiles(root: string, directoryPath: string): readonly string[] {
  const directory = safeAbsolute(root, directoryPath, "attempt directory");
  const rootParts = relative(root, directory).split(sep).filter((entry) => entry.length > 0);
  let current = root;
  for (const part of rootParts) {
    current = resolve(current, part);
    const stat = lstatSync(current);
    const physical = realpathSync.native(current);
    if (!stat.isDirectory() || stat.isSymbolicLink() ||
      relative(current, physical) !== "" || relative(physical, current) !== "") {
      fail(`${relative(root, current).replaceAll("\\", "/")} is an aliased attempt parent`);
    }
  }
  const files: string[] = [];
  const visit = (absoluteDirectory: string): void => {
    const directoryStat = lstatSync(absoluteDirectory);
    const physicalDirectory = realpathSync.native(absoluteDirectory);
    const physicalDisplacement = relative(root, physicalDirectory);
    if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink() ||
      relative(absoluteDirectory, physicalDirectory) !== "" ||
      relative(physicalDirectory, absoluteDirectory) !== "" ||
      physicalDisplacement === "" || physicalDisplacement === ".." ||
      physicalDisplacement.startsWith(`..${sep}`) || isAbsolute(physicalDisplacement)) {
      fail(`${relative(root, absoluteDirectory).replaceAll("\\", "/")} is an aliased scan directory`);
    }
    const entries = readdirSync(absoluteDirectory, { withFileTypes: true })
      .sort((left, right) => codePointCompare(left.name, right.name));
    for (const entry of entries) {
      const absolute = resolve(absoluteDirectory, entry.name);
      const path = relative(root, absolute).replaceAll("\\", "/");
      if (entry.isSymbolicLink()) fail(`${path} is a forbidden symlink or junction`);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) {
        const fileStat = lstatSync(absolute);
        if (!fileStat.isFile() || fileStat.isSymbolicLink() || fileStat.nlink !== 1) {
          fail(`${path} is not a unique regular file`);
        }
        files.push(path);
      }
      else fail(`${path} is not a regular file or directory`);
    }
  };
  visit(directory);
  return Object.freeze(files.sort(codePointCompare));
}

function exactRoster(actual: readonly string[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    fail(`${label} differs from the registered roster`);
  }
}

/**
 * Re-derives append-only history from terminal live bytes. Only the exact registered growing
 * streams may change identity between observations; every earlier identity must equal a byte
 * prefix of the terminal file. All other artifacts are immutable from first observation.
 */
export function phase10C0VS6VerifyAppendOnlyResourceHistory(
  observations: readonly Phase10C0VS6ResourceObservation[],
  growingPaths: ReadonlySet<string>,
  readTerminalBytes: (path: string) => Uint8Array,
): ReadonlyMap<string, Phase10C0VS6ArtifactIdentity> {
  if (observations.length === 0) fail("resource history must not be empty");
  let previous = new Map<string, Phase10C0VS6ArtifactIdentity>();
  const histories = new Map<string, Phase10C0VS6ArtifactIdentity[]>();
  for (const observation of observations) {
    const current = new Map(observation.artifacts.map((artifact) => [artifact.path, artifact]));
    if (current.size !== observation.artifacts.length) fail("resource observation repeats an artifact path");
    for (const [path, prior] of previous) {
      const retained = current.get(path);
      if (retained === undefined) fail(`${path} disappeared from the append-only resource census`);
      if (growingPaths.has(path)) {
        if (retained.byteLength < prior.byteLength) fail(`${path} was truncated between resource observations`);
      } else {
        phase10C0VS6SameIdentity(retained, prior, `${path} changed after its first resource observation`);
      }
    }
    for (const artifact of observation.artifacts) {
      const history = histories.get(artifact.path) ?? [];
      history.push(artifact);
      histories.set(artifact.path, history);
    }
    previous = current;
  }
  const terminal = previous;
  for (const [path, history] of histories) {
    const finalIdentity = terminal.get(path);
    if (finalIdentity === undefined) fail(`${path} is absent from the terminal resource observation`);
    const liveBytes = readTerminalBytes(path);
    phase10C0VS6SameIdentity(
      phase10C0VS6ArtifactIdentity(path, liveBytes),
      finalIdentity,
      `${path} terminal live bytes`,
    );
    if (growingPaths.has(path)) {
      for (const [index, observed] of history.entries()) {
        if (observed.byteLength > liveBytes.byteLength) fail(`${path} observation[${index}] exceeds terminal bytes`);
        phase10C0VS6SameIdentity(
          phase10C0VS6ArtifactIdentity(path, liveBytes.slice(0, observed.byteLength)),
          observed,
          `${path} observation[${index}] is not an exact terminal-byte prefix`,
        );
      }
    }
  }
  return terminal;
}

function packetScope(packet: Phase10C0VS6PacketProtocol): Readonly<{
  packetId: Phase10C0VS6ResourceBoundaryEvaluation["packetId"];
  layerId: Phase10C0VS6AttemptRowV2["layerId"];
  branch: Phase10C0VS6AttemptRowV2["branch"];
  checkId: Phase10C0VS6ResourceCheckId;
}> {
  switch (packet.packetId) {
    case "c0v-radial-produce": return Object.freeze({
      packetId: packet.packetId, layerId: "C0V-RADIAL", branch: "independent-reference",
      checkId: "chk-c0v-radial-resource-boundary",
    });
    case "c0v-moving-produce": return Object.freeze({
      packetId: packet.packetId, layerId: "C0V-MOVING-EVENT", branch: "independent-reference",
      checkId: "chk-c0v-moving-resource-boundary",
    });
    case "c0v-static-produce": return Object.freeze({
      packetId: packet.packetId, layerId: "C0V-STATIC", branch: "reference-refusal",
      checkId: "chk-c0v-static-resource-boundary",
    });
    default: fail(`${packet.packetId} is not a layer-produce resource packet`);
  }
}

function exactAttemptAuthority(
  attempt: Phase10C0VS6AttemptRowV2,
  packet: Phase10C0VS6PacketProtocol,
  preflightIdentity: Phase10C0VS6ArtifactIdentity,
  head: string,
): void {
  const scope = packetScope(packet);
  const runCommands = packet.commandTemplates.filter((entry) => entry.commandId === "run");
  if (runCommands.length !== 1 || attempt.attemptId !== packet.registeredAttemptId ||
    attempt.layerId !== scope.layerId || attempt.branch !== scope.branch ||
    attempt.command !== runCommands[0]!.command || attempt.gitHead !== head ||
    packet.bindings.scienceProtocol === null || packet.bindings.referenceOrRefusal === null) {
    fail("attempt identity/layer/branch/command/head differs from raw packet/preflight authority");
  }
  phase10C0VS6SameIdentity(attempt.protocol, packet.bindings.scienceProtocol, "attempt science protocol");
  phase10C0VS6SameIdentity(attempt.referenceOrRefusal, packet.bindings.referenceOrRefusal, "attempt reference/refusal");
  phase10C0VS6SameIdentity(attempt.preflight, preflightIdentity, "attempt retained preflight");
}

function ledgerFilename(packet: Phase10C0VS6PacketProtocol, tupleId: string): string {
  const roster = packet.candidateFilenameRosters[tupleId];
  if (roster === undefined) fail("selected tuple lacks a candidate filename roster");
  const matches = roster.filter((filename) => filename.endsWith("-attempts.jsonl"));
  if (matches.length !== 1) fail("selected tuple must register exactly one attempt-ledger filename");
  return matches[0] as string;
}

function samePartial(left: Phase10C0VS6PartialExecution | null, right: Phase10C0VS6PartialExecution | null): boolean {
  if (left === null || right === null) return left === right;
  return JSON.stringify(left) === JSON.stringify(right);
}

export function independentlyEvaluatePhase10C0VS6ResourceBoundary(
  input: Phase10C0VS6ResourceBoundaryInput,
): Phase10C0VS6ResourceBoundaryEvaluation {
  const root = safeRoot(input.repositoryRoot);
  const { packet, preflight } = derivePhase10C0VS6RetainedRuntimeAuthority(input);
  const scope = packetScope(packet);
  if (preflight.verdict !== "pass" || preflight.refusalCandidate !== null) {
    fail("post-attempt resource-boundary evaluation requires the exact retained PASS preflight");
  }
  if (!packet.registeredCheckIds.includes(scope.checkId)) fail("resource check is absent from packet authority");
  const attempts = parsePhase10C0VS6AttemptLedgerV2(
    input.candidateOrFinalLedgerBytes,
    "candidate/final attempt ledger",
  );
  if (attempts.length !== 1 || attempts[0]?.attemptId !== packet.registeredAttemptId) {
    fail("attempt ledger must contain exactly the one protocol-registered attempt ID");
  }
  const attempt = attempts[0] as Phase10C0VS6AttemptRowV2;
  phase10C0VS6AssertNoFutureAttemptTimestamps(attempt, Date.now());
  const preflightIdentity = phase10C0VS6ArtifactIdentity(
    packet.paths.preflightReceiptPath,
    input.preflightBytes,
  );
  exactAttemptAuthority(attempt, packet, preflightIdentity, preflight.observed.head);
  if (preflight.observed.attemptDirectory !== `${packet.paths.attemptRoot}/${packet.registeredAttemptId}`) {
    fail("preflight attempt directory differs from packet/attempt identity");
  }
  const tuple = phase10C0VS6ValidateRegisteredExecutionRecordTuple(attempt, packet.executionRecordTuples);
  const terminalSubroute = packet.terminalSubroutes.find((entry) => entry.subrouteId === tuple.tupleId);
  if (terminalSubroute === undefined || !terminalSubroute.requiredCheckIds.includes(scope.checkId)) {
    fail("selected terminal subroute does not authorize the packet resource-boundary check");
  }
  const invocationRoster = phase10C0VS6ValidateRegisteredExecutableInvocationRoster(
    attempt,
    tuple,
    packet.executableInvocationRosters,
  );
  const observationRosters = packet.resourceObservationPointRosters.filter(
    (entry) => entry.tupleId === tuple.tupleId,
  );
  if (observationRosters.length !== 1) fail("selected tuple does not resolve one resource observation roster");
  exactRoster(
    attempt.resourceRecord.registeredObservationPointIds,
    observationRosters[0]!.observationPointIds,
    "resource observation-point roster",
  );
  const excludedLedgerPath = `${preflight.observed.candidateDirectory}/${ledgerFilename(packet, tuple.tupleId)}`;
  if (attempt.resourceRecord.excludedLedgerPath !== excludedLedgerPath) {
    fail("resource record excludes a different candidate ledger path");
  }
  if (attempt.scratchBytes > packet.resources.projectedScratchBytes ||
    attempt.retainedBytes > packet.resources.projectedScratchBytes ||
    preflight.observed.resources.packageRetainedBytesBeforeAttempt + attempt.scratchBytes +
      packet.resources.projectedPublicationBytes > packet.resources.retainedStorageBytesMaximum) {
    fail("attempt/package scratch or retained resource boundary exceeded");
  }
  const attemptProcessHours = attempt.processHours;
  if (!Number.isFinite(attemptProcessHours) || attemptProcessHours > packet.resources.packageProcessHoursMaximum) {
    fail("single-attempt process-hour value exceeds the package ceiling");
  }
  const attemptPrefix = `${preflight.observed.attemptDirectory}/`;
  for (const observation of attempt.resourceRecord.observations) {
    for (const artifact of observation.artifacts) {
      if (!artifact.path.startsWith(attemptPrefix)) fail(`${artifact.path} lies outside the exact attempt directory`);
    }
  }
  const growingPaths = new Set([
    preflight.observed.stdoutPath,
    preflight.observed.stderrPath,
    `${preflight.observed.attemptDirectory}/${packet.workerInvocationContract.filename}`,
    ...(packet.workerProgressContract === null
      ? []
      : [`${preflight.observed.attemptDirectory}/${packet.workerProgressContract.filename}`]),
  ]);
  const projectedCandidateBytes = input.projectedTerminalCandidateBytes;
  if (projectedCandidateBytes !== undefined) {
    phase10C0VS6SameIdentity(
      phase10C0VS6ArtifactIdentity(attempt.terminalCandidate.path, projectedCandidateBytes),
      attempt.terminalCandidate,
      "in-memory terminal candidate projection",
    );
  }
  const uniqueArtifacts = phase10C0VS6VerifyAppendOnlyResourceHistory(
    attempt.resourceRecord.observations,
    growingPaths,
    (path) => path === attempt.terminalCandidate.path && projectedCandidateBytes !== undefined
      ? new Uint8Array(projectedCandidateBytes)
      : readPhysical(root, path),
  );
  const terminalPaths = attempt.resourceRecord.observations.at(-1)!.artifacts.map((artifact) => artifact.path);
  if (
    terminalPaths.length !== uniqueArtifacts.size ||
    terminalPaths.some((path) => !uniqueArtifacts.has(path)) ||
    attempt.resourceRecord.maximumObservedConcurrentBytes !== attempt.resourceRecord.terminalRetainedBytes ||
    attempt.scratchBytes !== attempt.retainedBytes
  ) {
    fail("append-only attempt must retain every governed byte and attain its maximum at terminal census");
  }
  const physicalScannedPaths = scanFiles(root, preflight.observed.attemptDirectory);
  if (projectedCandidateBytes !== undefined && physicalScannedPaths.includes(attempt.terminalCandidate.path)) {
    fail("projected terminal candidate is already physically present");
  }
  const scannedPaths = Object.freeze([
    ...physicalScannedPaths,
    ...(projectedCandidateBytes === undefined ? [] : [attempt.terminalCandidate.path]),
  ].sort(codePointCompare));
  if (scannedPaths.includes(excludedLedgerPath)) {
    fail("self-excluded candidate ledger is physically present and unaccounted; ledger must remain in memory until evaluation passes");
  }
  exactRoster(
    scannedPaths,
    terminalPaths,
    "terminal retained file roster",
  );

  let derivedPartial: Phase10C0VS6PartialExecution | null = null;
  const capBindings = packet.registeredCapBindings.filter((entry) => entry.tupleId === tuple.tupleId);
  if (capBindings.length > 1) fail("selected tuple resolves more than one registered cap binding");
  const retainedCandidateBytes = terminalPaths.reduce((total, path) => {
    const artifact = uniqueArtifacts.get(path);
    return total + (path.startsWith(`${preflight.observed.candidateDirectory}/`) && path !== excludedLedgerPath
      ? artifact?.byteLength ?? 0
      : 0);
  }, 0);
  if (attempt.workerProgress !== null) {
    if (packet.workerProgressContract === null) fail("worker progress exists without packet authority");
    const workerInvocationPath =
      `${preflight.observed.attemptDirectory}/${packet.workerInvocationContract.filename}`;
    const workerTiming = independentlyEvaluatePhase10C0VS6WorkerInvocations(
      readPhysical(root, workerInvocationPath),
      packet,
      tuple.tupleId,
      Date.now(),
    );
    phase10C0VS6VerifyRawWorkerProgress(
      readPhysical(root, attempt.workerProgress.artifact.path),
      attempt.workerProgress,
    );
    const capContext = capBindings.length === 0 ? null : Object.freeze({
      capId: capBindings[0]!.conditionId,
      retainedCandidateBytes,
    });
    const progress = independentlyEvaluatePhase10C0VS6WorkerProgress(
      attempt,
      packet.workerProgressContract,
      invocationRoster,
      workerTiming,
      capContext,
    );
    derivedPartial = progress.partialExecution;
    if (progress.candidateByteLength > 0) {
      const candidateMatches = [...uniqueArtifacts.values()].filter((artifact) =>
        artifact.path.startsWith(`${preflight.observed.candidateDirectory}/`) &&
        artifact.byteLength === progress.candidateByteLength && artifact.sha256 === progress.candidateSha256);
      if (candidateMatches.length !== 1) fail("worker progress retained candidate does not resolve one resource artifact");
    }
  } else if (capBindings.length === 1) {
    const binding = capBindings[0]!;
    const capped = attempt.executableInvocationRecords.filter(
      (invocation) => invocation.terminalState === "registered-cap",
    );
    if (packet.workerProgressContract !== null || capped.length !== 1 ||
      capped[0]!.invocationId !== binding.invocationId ||
      capped[0]!.invocationClass !== "route-cause-evaluator") {
      fail("progress-free registered cap is not the exact non-solver route-cause cap");
    }
    const invocation = capped[0]!;
    derivedPartial = Object.freeze({
      capId: binding.conditionId,
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
  if (!samePartial(derivedPartial, attempt.partialExecution)) {
    fail("attempt partialExecution differs from embedded worker-progress/resource derivation");
  }
  return Object.freeze({
    checkId: scope.checkId,
    packetId: scope.packetId,
    attemptId: attempt.attemptId,
    tupleId: tuple.tupleId,
    verifiedObservationCount: attempt.resourceRecord.observations.length,
    verifiedUniqueArtifactCount: uniqueArtifacts.size,
    maximumObservedConcurrentBytes: attempt.resourceRecord.maximumObservedConcurrentBytes,
    terminalRetainedBytes: attempt.resourceRecord.terminalRetainedBytes,
    attemptProcessHours,
    partialExecution: derivedPartial,
    verdict: "pass",
    errors: Object.freeze([]),
  });
}

export function phase10C0VS6ResourceBoundaryCheckCaller(
  input: Phase10C0VS6ResourceBoundaryInput,
): Phase10C0VS6ResourceBoundaryCheckCallerResult {
  const evaluation = independentlyEvaluatePhase10C0VS6ResourceBoundary(input);
  return Object.freeze({
    evaluation,
    executedCheckIds: Object.freeze([evaluation.checkId] as const),
    evaluatedCheckIds: Object.freeze([evaluation.checkId] as const),
    executedNegativeControlIds: Object.freeze([]),
  });
}
