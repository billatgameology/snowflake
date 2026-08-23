import { lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import type {
  Phase10C0VS6PacketProtocol,
  Phase10C0VS6RetainedPreflight,
} from "./phase10-c0v-s6-contracts.ts";
import {
  parsePhase10C0VS6AttemptLedgerV2,
  phase10C0VS6AssertNoFutureAttemptTimestamps,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6SafeRelativePath,
  phase10C0VS6SameIdentity,
  phase10C0VS6SameJson,
  phase10C0VS6ValidateRegisteredExecutableInvocationRoster,
  phase10C0VS6ValidateRegisteredExecutionRecordTuple,
  type Phase10C0VS6AttemptRowV2,
  type Phase10C0VS6ClassificationValidation,
  type Phase10C0VS6PartialExecution,
  type Phase10C0VS6RegisteredExecutionRecordTuple,
  type Phase10C0VS6ExecutableInvocationRecord,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  parsePhase10C0VS6ExitStatusBytes,
  parsePhase10C0VS6RadialEvaluationBytes,
} from "./phase10-c0v-s6-receipts.ts";
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
import {
  type Phase10C0VS6RawRefusalCauseEvaluation,
} from "./phase10-c0v-s6-refusal.ts";
import {
  independentlyProjectPhase10C0VS6RawLifecycleRoute,
} from "./phase10-c0v-s6-lifecycle.ts";

export type Phase10C0VS6AttemptCensusCheckId =
  | "chk-c0v-radial-attempt-census"
  | "chk-c0v-moving-attempt-census"
  | "chk-c0v-static-attempt-census";

export interface Phase10C0VS6AttemptCensusInput extends Phase10C0VS6RawRuntimeAuthorityInput {
  readonly repositoryRoot: string;
  readonly candidateOrFinalLedgerBytes: Uint8Array;
  /**
   * Current-run terminal candidate kept in memory until every census/resource/receipt check has
   * passed. Historical/final verification omits this field and reopens the physical candidate.
   */
  readonly projectedTerminalCandidateBytes?: Uint8Array;
}

export interface Phase10C0VS6AttemptCandidatePresence {
  readonly witnessPresent: boolean;
  readonly evaluationPresent: boolean;
  readonly evaluationStrictlyParsed: boolean;
  readonly completedNegativeControlCount: number;
  readonly governedCandidatePaths: readonly string[];
}

export interface Phase10C0VS6AttemptCensusEvaluation {
  readonly checkId: Phase10C0VS6AttemptCensusCheckId;
  readonly attemptId: string;
  readonly tupleId: string;
  readonly exactAttemptFiles: readonly string[];
  readonly candidatePresence: Phase10C0VS6AttemptCandidatePresence;
  readonly zeroScientificExecution: boolean;
  readonly partialExecutionMatched: true;
  readonly acceptedValidWitnessAbsent: boolean;
  readonly acceptedNumericalVerdictAbsent: boolean;
  readonly completedNumericalNegativeControlCampaignCreditAbsent: boolean;
  readonly verdict: "pass";
  readonly errors: readonly string[];
}

export interface Phase10C0VS6AttemptCensusCheckCallerResult {
  readonly evaluation: Phase10C0VS6AttemptCensusEvaluation;
  readonly executedCheckIds: readonly [Phase10C0VS6AttemptCensusCheckId];
  readonly evaluatedCheckIds: readonly [Phase10C0VS6AttemptCensusCheckId];
  readonly executedNegativeControlIds: readonly string[];
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 attempt census refused: ${message}`);
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
  const absolute = safeAbsolute(root, path, "census artifact path");
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

function scanAttempt(root: string, attemptDirectory: string): readonly string[] {
  const absoluteRoot = safeAbsolute(root, attemptDirectory, "attempt directory");
  const rootParts = relative(root, absoluteRoot).split(sep).filter((entry) => entry.length > 0);
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
  const result: string[] = [];
  const visit = (directory: string): void => {
    const stat = lstatSync(directory);
    const physical = realpathSync.native(directory);
    const displacement = relative(root, physical);
    if (!stat.isDirectory() || stat.isSymbolicLink() ||
      relative(directory, physical) !== "" || relative(physical, directory) !== "" ||
      displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
      isAbsolute(displacement)) {
      fail(`${relative(root, directory).replaceAll("\\", "/")} is an aliased scan directory`);
    }
    const entries = readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => codePointCompare(left.name, right.name));
    for (const entry of entries) {
      const absolute = resolve(directory, entry.name);
      const path = relative(root, absolute).replaceAll("\\", "/");
      if (entry.isSymbolicLink()) fail(`${path} is a forbidden symlink or junction`);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) {
        const fileStat = lstatSync(absolute);
        if (!fileStat.isFile() || fileStat.isSymbolicLink() || fileStat.nlink !== 1) {
          fail(`${path} is not a unique regular file`);
        }
        result.push(path);
      }
      else fail(`${path} is not a regular file or directory`);
    }
  };
  visit(absoluteRoot);
  return Object.freeze(result.sort(codePointCompare));
}

function exactRoster(actual: readonly string[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    fail(`${label} differs`);
  }
}

function packetScope(packet: Phase10C0VS6PacketProtocol): Readonly<{
  layerId: Phase10C0VS6AttemptRowV2["layerId"];
  branch: Phase10C0VS6AttemptRowV2["branch"];
  checkId: Phase10C0VS6AttemptCensusCheckId;
}> {
  switch (packet.packetId) {
    case "c0v-radial-produce": return Object.freeze({
      layerId: "C0V-RADIAL", branch: "independent-reference",
      checkId: "chk-c0v-radial-attempt-census",
    });
    case "c0v-moving-produce": return Object.freeze({
      layerId: "C0V-MOVING-EVENT", branch: "independent-reference",
      checkId: "chk-c0v-moving-attempt-census",
    });
    case "c0v-static-produce": return Object.freeze({
      layerId: "C0V-STATIC", branch: "reference-refusal",
      checkId: "chk-c0v-static-attempt-census",
    });
    default: fail(`${packet.packetId} is not a layer-produce census packet`);
  }
}

function candidateLedgerFilename(packet: Phase10C0VS6PacketProtocol, tupleId: string): string {
  const roster = packet.candidateFilenameRosters[tupleId];
  const matches = roster?.filter((entry) => entry.endsWith("-attempts.jsonl")) ?? [];
  if (matches.length !== 1) fail("tuple does not register exactly one attempt-ledger candidate");
  return matches[0] as string;
}

function assertAttemptAuthority(
  attempt: Phase10C0VS6AttemptRowV2,
  packet: Phase10C0VS6PacketProtocol,
  preflightBytes: Uint8Array,
  preflight: Phase10C0VS6RetainedPreflight,
): void {
  const scope = packetScope(packet);
  const run = packet.commandTemplates.filter((entry) => entry.commandId === "run");
  if (attempt.attemptId !== packet.registeredAttemptId || attempt.layerId !== scope.layerId ||
    attempt.branch !== scope.branch || run.length !== 1 || attempt.command !== run[0]!.command ||
    attempt.gitHead !== preflight.observed.head || packet.bindings.scienceProtocol === null ||
    packet.bindings.referenceOrRefusal === null) {
    fail("attempt identity/layer/branch/command/head differs from raw packet/preflight authority");
  }
  phase10C0VS6SameIdentity(attempt.protocol, packet.bindings.scienceProtocol, "attempt science protocol");
  phase10C0VS6SameIdentity(attempt.referenceOrRefusal, packet.bindings.referenceOrRefusal, "attempt reference/refusal");
  phase10C0VS6SameIdentity(
    attempt.preflight,
    phase10C0VS6ArtifactIdentity(packet.paths.preflightReceiptPath, preflightBytes),
    "attempt retained preflight",
  );
  const expectedCandidateFilename = packet.terminalCandidateContract.successFilename;
  if (attempt.stdout.path !== preflight.observed.stdoutPath ||
    attempt.stderr.path !== preflight.observed.stderrPath ||
    attempt.terminalCandidate.path !== `${preflight.observed.attemptDirectory}/${expectedCandidateFilename}`) {
    fail("attempt log/terminal-candidate paths differ from retained preflight and lifecycle branch");
  }
}

function samePartial(left: Phase10C0VS6PartialExecution | null, right: Phase10C0VS6PartialExecution | null): boolean {
  if (left === null || right === null) return left === right;
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertClassificationMatchesCensus(
  classification: Phase10C0VS6ClassificationValidation | null,
  attempt: Phase10C0VS6AttemptRowV2,
  packet: Phase10C0VS6PacketProtocol,
  tuple: Phase10C0VS6RegisteredExecutionRecordTuple,
  census: Pick<
    Phase10C0VS6AttemptCensusEvaluation,
    "zeroScientificExecution" | "partialExecutionMatched" | "acceptedValidWitnessAbsent" |
    "acceptedNumericalVerdictAbsent" | "completedNumericalNegativeControlCampaignCreditAbsent"
  >,
  independentlyDerivedCause: Phase10C0VS6RawRefusalCauseEvaluation | null,
): void {
  const disposition = attempt.dispositionCode;
  if (disposition === "production-complete") {
    if (classification !== null) fail("production-complete carries classification validation");
    return;
  }
  if (classification === null || classification.verdict !== "pass") {
    fail("non-production attempt lacks a passing classification validation candidate");
  }
  if (classification.validatedDispositionCode !== disposition) {
    fail("classificationValidation disposition differs from independently selected lifecycle route");
  }
  if (independentlyDerivedCause === null) {
    fail("non-production attempt lacks a raw-derived cause projection");
  }
  if (independentlyDerivedCause.selectedSubrouteId !== tuple.tupleId ||
    independentlyDerivedCause.dispositionCode !== disposition) {
    fail("raw cause projection differs from the independently selected tuple/disposition");
  }
  const projections = packet.classificationProjectionRosters.filter(
    (entry) => entry.subrouteId === tuple.tupleId,
  );
  if (projections.length !== 1) fail("classification tuple does not resolve one exact raw projection roster");
  const projection = projections[0]!;
  if (classification.validationId !== projection.validationId ||
    classification.assemblerCallableId !== projection.assemblerCallableId ||
    classification.method !== projection.method ||
    projection.componentEvaluatorCallableIds[0] !== independentlyDerivedCause.evaluatorCallableId) {
    fail("classificationValidation identity/method differs from the raw projection authority");
  }
  phase10C0VS6SameJson(
    classification.componentEvaluatorCallableIds,
    projection.componentEvaluatorCallableIds,
    "classificationValidation component evaluator provenance",
  );
  const expectedObservations = independentlyDerivedCause.observations.map((entry) => Object.freeze({
    conditionId: entry.conditionId,
    kind: entry.kind,
    comparator: entry.comparator,
    registeredValue: entry.registeredValue,
    observedValue: entry.observedValue,
    unit: entry.unit,
    conditionPassed: entry.routeConditionMatched,
    evidenceIds: entry.evidenceIds,
  }));
  phase10C0VS6SameJson(
    classification.observations,
    expectedObservations,
    "classificationValidation observations versus canonical raw cause projection",
  );
  phase10C0VS6SameJson(
    classification.evidence,
    independentlyDerivedCause.evidence,
    "classificationValidation evidence versus canonical raw cause projection",
  );
  phase10C0VS6SameJson(
    attempt.executableInvocationRecords,
    independentlyDerivedCause.workerInvocationRecords,
    "attempt finalized invocation records versus raw cause worker records",
  );
  const attemptInvocations = new Map(
    attempt.executableInvocationRecords.map((entry) => [entry.invocationId, entry]),
  );
  const rawInvocations = new Map(
    independentlyDerivedCause.workerInvocationRecords.map((entry) => [entry.invocationId, entry]),
  );
  for (const observationAuthority of projection.observations) {
    if (observationAuthority.finalizedValueBinding === null) continue;
    const finalized = /^attempt\.executableInvocationRecords\.([A-Za-z0-9._-]+)\.wallSeconds$/u.exec(
      observationAuthority.finalizedValueBinding,
    );
    const raw = /^internal\.workerInvocations\.([A-Za-z0-9._-]+)\.elapsedNanoseconds$/u.exec(
      observationAuthority.observedValueSource,
    );
    if (finalized === null || raw === null || finalized[1] !== raw[1]) {
      fail(`${observationAuthority.conditionId} has an unsupported or cross-invocation finalized value binding`);
    }
    const invocationId = finalized[1]!;
    const causeObservation = independentlyDerivedCause.observations.find(
      (entry) => entry.conditionId === observationAuthority.conditionId,
    );
    const attemptInvocation = attemptInvocations.get(invocationId);
    const rawInvocation = rawInvocations.get(invocationId);
    if (attemptInvocation === undefined || rawInvocation === undefined || causeObservation === undefined ||
      causeObservation.observedValue !== attemptInvocation.wallSeconds ||
      causeObservation.observedValue !== rawInvocation.elapsedNanoseconds / 1_000_000_000 ||
      attemptInvocation.elapsedNanoseconds !== rawInvocation.elapsedNanoseconds) {
      fail(`${observationAuthority.conditionId} finalized wall-seconds binding differs from raw and attempt records`);
    }
  }
  for (const field of [
    "zeroScientificExecution", "partialExecutionMatched", "acceptedValidWitnessAbsent",
    "acceptedNumericalVerdictAbsent", "completedNumericalNegativeControlCampaignCreditAbsent",
  ] as const) {
    if (classification[field] !== census[field]) fail(`classificationValidation.${field} differs from census`);
  }
}

export function independentlyCensusPhase10C0VS6Attempt(
  input: Phase10C0VS6AttemptCensusInput,
): Phase10C0VS6AttemptCensusEvaluation {
  const root = safeRoot(input.repositoryRoot);
  const { packet, preflight } = derivePhase10C0VS6RetainedRuntimeAuthority(input);
  const scope = packetScope(packet);
  if (!packet.registeredCheckIds.includes(scope.checkId)) fail("attempt-census check is absent from packet authority");
  const attempts = parsePhase10C0VS6AttemptLedgerV2(
    input.candidateOrFinalLedgerBytes,
    "candidate/final attempt ledger",
  );
  if (attempts.length !== 1 || attempts[0]?.attemptId !== packet.registeredAttemptId) {
    fail("census ledger must contain exactly the one protocol-registered attempt ID");
  }
  const attempt = attempts[0] as Phase10C0VS6AttemptRowV2;
  phase10C0VS6AssertNoFutureAttemptTimestamps(attempt, Date.now());
  assertAttemptAuthority(attempt, packet, input.preflightBytes, preflight);
  const tuple = phase10C0VS6ValidateRegisteredExecutionRecordTuple(attempt, packet.executionRecordTuples);
  const invocationRoster = phase10C0VS6ValidateRegisteredExecutableInvocationRoster(
    attempt,
    tuple,
    packet.executableInvocationRosters,
  );
  const lifecycle = independentlyProjectPhase10C0VS6RawLifecycleRoute(input);
  if (lifecycle.selectedSubrouteId !== tuple.tupleId || lifecycle.dispositionCode !== attempt.dispositionCode) {
    fail("attempt tuple/disposition differs from the independently projected raw lifecycle route");
  }
  const lifecycleAttemptStatus = lifecycle.terminalState === "scientific-pass"
    ? "pass"
    : lifecycle.terminalState === "scientific-fail"
      ? "fail"
      : "refusal";
  if (attempt.terminalStatus !== lifecycleAttemptStatus) {
    fail("attempt terminal status differs from the independently projected raw lifecycle route");
  }
  phase10C0VS6SameJson(
    attempt.executableInvocationRecords,
    lifecycle.produceInvocationRecords,
    "attempt invocation records versus independently projected raw lifecycle route",
  );
  const attemptDirectory = preflight.observed.attemptDirectory;
  const candidateDirectory = preflight.observed.candidateDirectory;
  const ledgerPath = `${candidateDirectory}/${candidateLedgerFilename(packet, tuple.tupleId)}`;
  if (attempt.resourceRecord.excludedLedgerPath !== ledgerPath) fail("attempt census ledger exclusion differs");
  const physicalAttemptFiles = scanAttempt(root, attemptDirectory);
  const projectedCandidateBytes = input.projectedTerminalCandidateBytes;
  if (projectedCandidateBytes !== undefined) {
    if (physicalAttemptFiles.includes(attempt.terminalCandidate.path)) {
      fail("projected terminal candidate is already physically present");
    }
    phase10C0VS6SameIdentity(
      phase10C0VS6ArtifactIdentity(attempt.terminalCandidate.path, projectedCandidateBytes),
      attempt.terminalCandidate,
      "in-memory terminal candidate projection",
    );
  }
  const exactAttemptFiles = Object.freeze([
    ...physicalAttemptFiles,
    ...(projectedCandidateBytes === undefined ? [] : [attempt.terminalCandidate.path]),
  ].sort(codePointCompare));
  const terminalPaths = attempt.resourceRecord.observations.at(-1)!.artifacts.map((entry) => entry.path);
  if (exactAttemptFiles.includes(ledgerPath)) {
    fail("self-excluded candidate ledger must remain in memory until census/resource evaluation passes");
  }
  exactRoster(exactAttemptFiles, terminalPaths, "attempt-root terminal census");
  const selectedCandidateFilenames = packet.candidateFilenameRosters[tuple.tupleId];
  if (selectedCandidateFilenames === undefined) fail("selected tuple lacks an exact candidate filename roster");
  const selectedInternalRosters = packet.internalArtifactRosters.filter(
    (entry) => entry.rosterId === tuple.tupleId,
  );
  if (selectedInternalRosters.length !== 1) {
    fail("selected tuple does not resolve exactly one internal artifact roster");
  }
  const exactRegisteredFiles = [
    ...selectedInternalRosters[0]!.relativePaths.map((path) => `${attemptDirectory}/${path}`),
    ...selectedCandidateFilenames
      .filter((filename) => `${candidateDirectory}/${filename}` !== ledgerPath)
      .map((filename) => `${candidateDirectory}/${filename}`),
  ].sort(codePointCompare);
  exactRoster(exactAttemptFiles, exactRegisteredFiles, "selected tuple attempt/internal candidate roster");

  let workerTiming: Readonly<{
    workerStartedAt: string;
    workerStoppedAt: string;
    workerElapsedNanoseconds: number;
    invocationRecords: readonly Phase10C0VS6ExecutableInvocationRecord[];
  }> | null = null;
  if (attempt.executionRecord.workerProcessInvocationCount === 1) {
    const workerInvocationPath = `${attemptDirectory}/${packet.workerInvocationContract.filename}`;
    const workerInvocationBytes = readPhysical(root, workerInvocationPath);
    const retainedWorkerInvocation = attempt.resourceRecord.observations.at(-1)!.artifacts.filter(
      (entry) => entry.path === workerInvocationPath,
    );
    if (retainedWorkerInvocation.length !== 1) {
      fail("worker invocation bytes do not resolve exactly once in terminal resources");
    }
    phase10C0VS6SameIdentity(
      phase10C0VS6ArtifactIdentity(workerInvocationPath, workerInvocationBytes),
      retainedWorkerInvocation[0]!,
      "worker invocation terminal resource",
    );
    const workerInvocation = independentlyEvaluatePhase10C0VS6WorkerInvocations(
      workerInvocationBytes,
      packet,
      tuple.tupleId,
      Date.now(),
    );
    phase10C0VS6SameJson(
      workerInvocation.invocationRecords,
      attempt.executableInvocationRecords,
      "worker invocation records versus attempt row",
    );
    workerTiming = workerInvocation;
  } else if (attempt.executableInvocationRecords.length !== 0) {
    fail("attempt reports invocation records without a worker process");
  }

  const exitStatusBytes = readPhysical(root, preflight.observed.exitStatusPath);
  const exitStatusIdentity = phase10C0VS6ArtifactIdentity(
    preflight.observed.exitStatusPath,
    exitStatusBytes,
  );
  const retainedExitStatus = attempt.resourceRecord.observations.at(-1)!.artifacts.filter(
    (entry) => entry.path === preflight.observed.exitStatusPath,
  );
  if (retainedExitStatus.length !== 1) fail("exit-status bytes do not resolve exactly once in terminal resources");
  phase10C0VS6SameIdentity(exitStatusIdentity, retainedExitStatus[0]!, "exit-status terminal resource");
  const exitStatus = parsePhase10C0VS6ExitStatusBytes(exitStatusBytes, packet);
  phase10C0VS6SameIdentity(
    exitStatusIdentity,
    lifecycle.exitStatusIdentity,
    "census exit-status versus raw lifecycle projection",
  );
  phase10C0VS6SameJson(exitStatus, lifecycle.exitStatus, "census exit-status raw lifecycle projection");
  const finalInvocationState = attempt.executableInvocationRecords.at(-1)?.terminalState;
  const expectedExitClassification = attempt.executionRecord.workerProcessInvocationCount === 0
    ? "no-worker"
    : finalInvocationState === "registered-cap"
      ? "registered-cap"
      : finalInvocationState === "infrastructure-failure"
        ? "infrastructure-failure"
        : "complete";
  if (exitStatus.workerProcessInvocationCount !== attempt.executionRecord.workerProcessInvocationCount ||
    exitStatus.exitCode !== attempt.exitCode || exitStatus.classification !== expectedExitClassification) {
    fail("exit-status bytes differ from worker/invocation/attempt lifecycle facts");
  }

  const candidatePaths = exactAttemptFiles.filter((path) => path.startsWith(`${candidateDirectory}/`));
  const witnessPaths = candidatePaths.filter((path) => path.endsWith("/c0v-radial-witness.bin"));
  const evaluationPaths = candidatePaths.filter((path) => path.endsWith("/c0v-radial-evaluation.json"));
  if (witnessPaths.length > 1 || evaluationPaths.length > 1) fail("radial witness/evaluation candidate is duplicated");
  const witnessPresent = witnessPaths.length === 1;
  const evaluationPresent = evaluationPaths.length === 1;
  let evaluationStrictlyParsed = false;
  let completedNegativeControlCount = 0;
  let evaluationPass: "pass" | "fail" | null = null;
  let evaluationArtifactDisposition: "valid" | "refusal" | null = null;
  if (evaluationPresent && packet.packetId === "c0v-radial-produce") {
    try {
      const evaluationBytes = readPhysical(root, evaluationPaths[0]!);
      const evaluation = parsePhase10C0VS6RadialEvaluationBytes(evaluationBytes, packet);
      evaluationStrictlyParsed = true;
      evaluationPass = evaluation.numericalDisposition;
      evaluationArtifactDisposition = evaluation.artifactDisposition;
      completedNegativeControlCount = evaluation.negativeControls.filter((entry) => entry.pass).length;
      if (!witnessPresent) fail("strict radial evaluation exists without its witness candidate");
      phase10C0VS6SameIdentity(
        evaluation.witness,
        phase10C0VS6ArtifactIdentity(witnessPaths[0]!, readPhysical(root, witnessPaths[0]!)),
        "radial evaluation witness candidate",
      );
    } catch (error) {
      const numericalEvaluatorRows = attempt.executableInvocationRecords.filter((entry) =>
        entry.invocationClass === "numerical-evaluator");
      const numericalEvaluatorIncomplete = numericalEvaluatorRows.length === 1 &&
        numericalEvaluatorRows[0]!.terminalState !== "complete";
      if (!numericalEvaluatorIncomplete) throw error;
    }
  }
  const protocolAcceptedWitness = tuple.record.acceptedValidWitnessCount === 1;
  const protocolAcceptedVerdict = tuple.record.acceptedNumericalVerdictCount === 1;
  if (tuple.record.acceptedValidWitnessCount > 1 || tuple.record.acceptedNumericalVerdictCount > 1 ||
    (protocolAcceptedWitness && (!witnessPresent || !evaluationStrictlyParsed)) ||
    (protocolAcceptedVerdict && evaluationPass === null)) {
    fail("protocol-granted accepted credit is not backed by exact parsed witness/evaluation candidates");
  }
  if (attempt.dispositionCode === "production-complete" &&
    (!protocolAcceptedWitness || !protocolAcceptedVerdict || evaluationArtifactDisposition !== "valid" ||
      completedNegativeControlCount !== 3)) {
    fail("production-complete lacks a valid three-control campaign and accepted science candidate");
  }
  if (attempt.dispositionCode === "production-complete" && evaluationPass !== attempt.terminalStatus) {
    fail("production-complete terminal status and registered pass/fail tuple differ from the strict evaluation bytes");
  }
  const campaignCredit = protocolAcceptedVerdict && evaluationArtifactDisposition === "valid" &&
    completedNegativeControlCount === 3;

  let derivedPartial: Phase10C0VS6PartialExecution | null = null;
  const capBindings = packet.registeredCapBindings.filter((entry) => entry.tupleId === tuple.tupleId);
  if (capBindings.length > 1) fail("tuple resolves more than one registered cap binding");
  const retainedCandidateBytes = terminalPaths.reduce((total, path) => {
    const artifact = attempt.resourceRecord.observations.at(-1)!.artifacts.find((entry) => entry.path === path);
    return total + (path.startsWith(`${candidateDirectory}/`) && path !== ledgerPath ? artifact?.byteLength ?? 0 : 0);
  }, 0);
  if (attempt.workerProgress !== null) {
    if (packet.workerProgressContract === null || workerTiming === null) {
      fail("embedded worker progress lacks protocol or raw parent-owned timing authority");
    }
    phase10C0VS6VerifyRawWorkerProgress(
      readPhysical(root, attempt.workerProgress.artifact.path),
      attempt.workerProgress,
    );
    derivedPartial = independentlyEvaluatePhase10C0VS6WorkerProgress(
      attempt,
      packet.workerProgressContract,
      invocationRoster,
      workerTiming,
      capBindings.length === 0 ? null : Object.freeze({
        capId: capBindings[0]!.conditionId,
        retainedCandidateBytes,
      }),
    ).partialExecution;
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
  const partialExecutionMatched = samePartial(derivedPartial, attempt.partialExecution);
  if (!partialExecutionMatched) fail("partialExecution differs from embedded worker progress and retained candidates");
  const numericalScienceLeaves = invocationRoster.invocations.filter((entry) =>
    entry.invocationClass === "solver-production" || entry.invocationClass === "numerical-evaluator" ||
    entry.invocationClass === "numerical-negative-control");
  const zeroScientificExecution = numericalScienceLeaves.length === 0 && attempt.workerProgress === null &&
    !witnessPresent && !evaluationPresent;
  const derived = Object.freeze({
    zeroScientificExecution,
    partialExecutionMatched: true as const,
    acceptedValidWitnessAbsent: !protocolAcceptedWitness,
    acceptedNumericalVerdictAbsent: !protocolAcceptedVerdict,
    completedNumericalNegativeControlCampaignCreditAbsent: !campaignCredit,
  });
  const independentlyDerivedDisposition = lifecycle.dispositionCode;
  if (independentlyDerivedDisposition === null) {
    fail("produce attempt census received a nonproduce raw lifecycle route");
  }
  const independentlyDerivedCause = lifecycle.causeEvaluation;
  assertClassificationMatchesCensus(
    attempt.classificationValidation,
    attempt,
    packet,
    tuple,
    derived,
    independentlyDerivedCause,
  );
  return Object.freeze({
    checkId: scope.checkId,
    attemptId: attempt.attemptId,
    tupleId: tuple.tupleId,
    exactAttemptFiles,
    candidatePresence: Object.freeze({
      witnessPresent,
      evaluationPresent,
      evaluationStrictlyParsed,
      completedNegativeControlCount,
      governedCandidatePaths: Object.freeze(candidatePaths),
    }),
    ...derived,
    verdict: "pass",
    errors: Object.freeze([]),
  });
}

export function phase10C0VS6AttemptCensusCheckCaller(
  input: Phase10C0VS6AttemptCensusInput,
): Phase10C0VS6AttemptCensusCheckCallerResult {
  const evaluation = independentlyCensusPhase10C0VS6Attempt(input);
  return Object.freeze({
    evaluation,
    executedCheckIds: Object.freeze([evaluation.checkId] as const),
    evaluatedCheckIds: Object.freeze([evaluation.checkId] as const),
    executedNegativeControlIds: Object.freeze([]),
  });
}
