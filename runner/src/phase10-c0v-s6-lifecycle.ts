import {
  parsePhase10C0VS6Matrix,
  parsePhase10C0VS6PrettyJsonBytes,
  type Phase10C0VS6CallerResultSourceAuthority,
  type Phase10C0VS6PacketProtocol,
  type Phase10C0VS6RetainedPreflight,
} from "./phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6SameIdentity,
  phase10C0VS6SameJson,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6ExecutableInvocationRecord,
} from "./phase10-c0v-s6-execution-contracts.ts";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  phase10C0VS6PhysicalRepositoryRoot,
  phase10C0VS6ReadUniquePhysicalFile,
} from "./phase10-c0v-s6-filesystem.ts";
import {
  parsePhase10C0VS6CauseEvaluationBytes,
  parsePhase10C0VS6ExitStatusBytes,
  parsePhase10C0VS6FreezeEvaluationBytes,
  parsePhase10C0VS6RadialEvaluationBytes,
  parsePhase10C0VS6TerminalCandidateBytes,
  writePhase10C0VS6TerminalCandidate,
  type Phase10C0VS6CauseEvaluationReceipt,
  type Phase10C0VS6CallerInvocationResult,
  type Phase10C0VS6ExitStatusReceipt,
  type Phase10C0VS6FreezeEvaluationReceipt,
  type Phase10C0VS6PacketInvocationRecord,
  type Phase10C0VS6ParsedRadialEvaluationReceipt,
  type Phase10C0VS6TerminalCandidate,
  type Phase10C0VS6TerminalCandidateAuthority,
  type Phase10C0VS6TerminalReceiptV2,
  type Phase10C0VS6TerminalRegisteredCap,
} from "./phase10-c0v-s6-receipts.ts";
import {
  derivePhase10C0VS6RetainedRuntimeAuthority,
  type Phase10C0VS6RawRuntimeAuthorityInput,
} from "./phase10-c0v-s6-runtime-authority.ts";
import {
  independentlyEvaluatePhase10C0VS6RefusalCause,
  phase10C0VS6RefusalCheckCaller,
  type Phase10C0VS6RawRefusalCauseEvaluation,
  type Phase10C0VS6RawRefusalCheckCallerResult,
} from "./phase10-c0v-s6-refusal.ts";
import {
  independentlyEvaluatePhase10C0VS6PacketWorkerInvocations,
  independentlyEvaluatePhase10C0VS6WorkerInvocations,
} from "./phase10-c0v-s6-worker-invocation.ts";
import {
  phase10C0VS6FreezeAncestryCheckCaller,
  independentlyEvaluatePhase10C0VS6RetainedFreeze,
  independentlyReopenPhase10C0VS6HistoricalFreeze,
  type Phase10C0VS6FreezeAncestryCheckCallerResult,
  type Phase10C0VS6HistoricalFreezeProjection,
} from "./phase10-c0v-s6-freeze.ts";
import {
  independentlyVerifyPhase10C0VS6ApArtifacts,
  type Phase10C0VS6ApIndependentEvaluation,
} from "./phase10-c0v-s6-ap-independent.ts";
import {
  type Phase10C0VS6ApCheckCallerResult,
} from "./phase10-c0v-s6-ap.ts";
import {
  independentlyReprovePhase10C0VRadialRawArtifacts,
  type Phase10C0VRadialRawArtifactReproof,
} from "./phase10-c0v-radial-reproof.ts";

export interface Phase10C0VS6ApRawCompletionProof {
  readonly kind: "a-p-independent-reproof";
  readonly callerReproof: Phase10C0VS6ApCheckCallerResult;
  readonly evaluation: Phase10C0VS6ApIndependentEvaluation;
  readonly artifactIndex: Phase10C0VS6ArtifactIdentity;
  readonly negativeControlReceipts: readonly [
    Phase10C0VS6ArtifactIdentity,
    Phase10C0VS6ArtifactIdentity,
  ];
}

export interface Phase10C0VS6RawLifecycleRouteProjection {
  readonly packet: Phase10C0VS6PacketProtocol;
  readonly preflight: Phase10C0VS6RetainedPreflight;
  readonly selectedSubrouteId: string;
  readonly dispositionCode: Phase10C0VS6PacketProtocol["terminalSubroutes"][number]["dispositionCode"];
  readonly terminalState: Phase10C0VS6TerminalReceiptV2["terminalState"];
  readonly preflightIdentity: Phase10C0VS6ArtifactIdentity;
  readonly exitStatus: Phase10C0VS6ExitStatusReceipt;
  readonly exitStatusIdentity: Phase10C0VS6ArtifactIdentity;
  readonly causeEvaluation: Phase10C0VS6RawRefusalCauseEvaluation | null;
  readonly causeCallerResult: Phase10C0VS6RawRefusalCheckCallerResult | null;
  readonly radialEvaluation: Phase10C0VS6ParsedRadialEvaluationReceipt | null;
  readonly radialEvaluationIdentity: Phase10C0VS6ArtifactIdentity | null;
  readonly radialReproof: Phase10C0VRadialRawArtifactReproof | null;
  readonly produceInvocationRecords: readonly Phase10C0VS6ExecutableInvocationRecord[];
  readonly packetInvocationRecords: readonly Phase10C0VS6PacketInvocationRecord[];
  readonly registeredCap: Phase10C0VS6TerminalRegisteredCap | null;
  readonly completionProof: Phase10C0VS6ApRawCompletionProof | null;
}

export interface Phase10C0VS6RawTerminalCandidateProjection {
  readonly lifecycle: Phase10C0VS6RawLifecycleRouteProjection;
  readonly freezeEvaluation: Phase10C0VS6FreezeEvaluationReceipt;
  readonly freezeEvaluationIdentity: Phase10C0VS6ArtifactIdentity;
  readonly causeEvaluation: Phase10C0VS6CauseEvaluationReceipt | null;
  readonly causeEvaluationIdentity: Phase10C0VS6ArtifactIdentity | null;
  readonly candidatePath: string;
  readonly candidate: Phase10C0VS6TerminalCandidate;
  readonly candidateBytes: Uint8Array;
  readonly candidateIdentity: Phase10C0VS6ArtifactIdentity;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 raw lifecycle refused: ${message}`);
}

function isProducePacket(packetId: Phase10C0VS6PacketProtocol["packetId"]): boolean {
  return packetId === "c0v-moving-produce" || packetId === "c0v-radial-produce" ||
    packetId === "c0v-static-produce";
}

function uniqueSubroute(
  packet: Phase10C0VS6PacketProtocol,
  subrouteId: string,
): Phase10C0VS6PacketProtocol["terminalSubroutes"][number] {
  const matches = packet.terminalSubroutes.filter((entry) => entry.subrouteId === subrouteId);
  if (matches.length !== 1) fail(`${subrouteId} does not resolve one exact terminal subroute`);
  return matches[0]!;
}

function exactRoster(actual: readonly string[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    fail(`${label} differs from actual registered caller execution`);
  }
}

function candidatePath(
  packet: Phase10C0VS6PacketProtocol,
  preflight: Phase10C0VS6RetainedPreflight,
  subrouteIds: readonly string[],
  suffix: string,
): string {
  const filenames = [...new Set(subrouteIds.flatMap((subrouteId) =>
    packet.candidateFilenameRosters[subrouteId] ?? []).filter((filename) => filename.endsWith(suffix)))];
  if (filenames.length !== 1) fail(`${suffix} does not resolve one exact candidate filename`);
  return `${preflight.observed.candidateDirectory}/${filenames[0]}`;
}

function exactCompleteExit(exit: Phase10C0VS6ExitStatusReceipt): void {
  if (exit.workerProcessInvocationCount !== 1 || exit.workerStarted !== true || exit.exitCode !== 0 ||
    exit.signal !== null || exit.classification !== "complete") {
    fail("claim-bearing complete route lacks exact code-zero parent exit facts");
  }
}

function capFromCause(
  packet: Phase10C0VS6PacketProtocol,
  cause: Phase10C0VS6RawRefusalCauseEvaluation,
): Phase10C0VS6TerminalRegisteredCap | null {
  if (cause.dispositionCode !== "registered-cap-resource-refusal") return null;
  const subroute = uniqueSubroute(packet, cause.selectedSubrouteId);
  const capped = cause.workerInvocationRecords.filter((entry) => entry.terminalState === "registered-cap");
  if (capped.length !== 1) fail("registered-cap route lacks one exact capped raw invocation");
  const invocation = capped[0]!;
  const bindings = isProducePacket(packet.packetId)
    ? packet.registeredCapBindings.filter((entry) =>
      entry.tupleId === cause.selectedSubrouteId && entry.invocationId === invocation.invocationId &&
      subroute.classificationConditionIds.includes(entry.conditionId))
    : packet.verificationRegisteredCapBindings.filter((entry) =>
      entry.invocationId === invocation.invocationId &&
      subroute.classificationConditionIds.includes(entry.conditionId));
  if (bindings.length !== 1 || invocation.wallSeconds <= invocation.registeredWallSecondsMaximum) {
    fail("registered-cap route does not resolve one strict raw timing binding");
  }
  return Object.freeze({
    conditionId: bindings[0]!.conditionId,
    invocationId: invocation.invocationId,
    observedWallSeconds: invocation.wallSeconds,
    registeredWallSecondsMaximum: invocation.registeredWallSecondsMaximum,
    unit: "seconds",
    makerReturnRequired: packet.packetId !== "c0v-radial-produce",
  });
}

function refusalProjection(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
  packet: Phase10C0VS6PacketProtocol,
  preflight: Phase10C0VS6RetainedPreflight,
  preflightIdentity: Phase10C0VS6ArtifactIdentity,
  exitStatus: Phase10C0VS6ExitStatusReceipt,
  exitStatusIdentity: Phase10C0VS6ArtifactIdentity,
): Phase10C0VS6RawLifecycleRouteProjection {
  // Preflight and cap routes enter their registered structural refusal caller exactly once.
  // Moving/static semantic refusal already ran its governed route-specific caller in the worker;
  // here we invoke only the independent raw projector and compare its result during candidate
  // materialization, never a second route-specific caller campaign.
  const causeCallerResult = preflight.refusalCandidate !== null || exitStatus.classification === "registered-cap"
    ? phase10C0VS6RefusalCheckCaller(input)
    : null;
  const causeEvaluation = causeCallerResult?.evaluation ??
    independentlyEvaluatePhase10C0VS6RefusalCause(input);
  const subroute = uniqueSubroute(packet, causeEvaluation.selectedSubrouteId);
  const registeredCap = capFromCause(packet, causeEvaluation);
  const produceInvocationRecords = isProducePacket(packet.packetId)
    ? causeEvaluation.workerInvocationRecords as readonly Phase10C0VS6ExecutableInvocationRecord[]
    : Object.freeze([]);
  const packetInvocationRecords = isProducePacket(packet.packetId)
    ? Object.freeze([])
    : causeEvaluation.workerInvocationRecords as readonly Phase10C0VS6PacketInvocationRecord[];
  return Object.freeze({
    packet,
    preflight,
    selectedSubrouteId: subroute.subrouteId,
    dispositionCode: subroute.dispositionCode,
    terminalState: registeredCap === null ? "scientific-refusal" : "registered-cap-resource-refusal",
    preflightIdentity,
    exitStatus,
    exitStatusIdentity,
    causeEvaluation,
    causeCallerResult,
    radialEvaluation: null,
    radialEvaluationIdentity: null,
    radialReproof: null,
    produceInvocationRecords,
    packetInvocationRecords,
    registeredCap,
    completionProof: null,
  });
}

/**
 * Selects the current-v1 claim-bearing route solely from retained preflight, raw parent exit,
 * raw monotonic worker timing, and (for radial completion) strict evaluation/witness bytes.
 * Attempt rows, terminal candidates, verification receipts, and terminal receipts are never
 * inputs, so they cannot choose their own tuple, subroute, or terminal state.
 */
export function independentlyProjectPhase10C0VS6RawLifecycleRoute(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VS6RawLifecycleRouteProjection {
  const { packet, preflight } = derivePhase10C0VS6RetainedRuntimeAuthority(input);
  const root = phase10C0VS6PhysicalRepositoryRoot(input.repositoryRoot);
  const preflightIdentity = phase10C0VS6ArtifactIdentity(packet.paths.preflightReceiptPath, input.preflightBytes);
  const exitStatusBytes = phase10C0VS6ReadUniquePhysicalFile(root, preflight.observed.exitStatusPath);
  const exitStatusIdentity = phase10C0VS6ArtifactIdentity(preflight.observed.exitStatusPath, exitStatusBytes);
  const exitStatus = parsePhase10C0VS6ExitStatusBytes(exitStatusBytes, packet);

  if (preflight.refusalCandidate !== null) {
    if (exitStatus.classification !== "no-worker") {
      fail("retained preflight refusal has worker exit facts");
    }
    return refusalProjection(input, packet, preflight, preflightIdentity, exitStatus, exitStatusIdentity);
  }
  if (exitStatus.classification === "registered-cap") {
    return refusalProjection(input, packet, preflight, preflightIdentity, exitStatus, exitStatusIdentity);
  }
  if (exitStatus.classification !== "complete") {
    fail("unclassified infrastructure/no-worker state cannot materialize a lifecycle route");
  }
  exactCompleteExit(exitStatus);

  if (packet.packetId === "c0v-moving-produce" || packet.packetId === "c0v-static-produce") {
    return refusalProjection(input, packet, preflight, preflightIdentity, exitStatus, exitStatusIdentity);
  }
  const workerPath = `${preflight.observed.attemptDirectory}/${packet.workerInvocationContract.filename}`;
  const workerBytes = phase10C0VS6ReadUniquePhysicalFile(root, workerPath);

  if (packet.packetId === "c0v-radial-produce") {
    const completeSubroutes = packet.terminalSubroutes.filter(
      (entry) => entry.dispositionCode === "production-complete",
    );
    if (completeSubroutes.length !== 2) fail("radial completion does not expose exact pass/fail subroutes");
    const evaluationPath = candidatePath(
      packet,
      preflight,
      completeSubroutes.map((entry) => entry.subrouteId),
      "c0v-radial-evaluation.json",
    );
    const evaluationBytes = phase10C0VS6ReadUniquePhysicalFile(root, evaluationPath);
    const radialEvaluation = parsePhase10C0VS6RadialEvaluationBytes(evaluationBytes, packet);
    if (radialEvaluation.artifactDisposition !== "valid" ||
      radialEvaluation.negativeControls.length !== 3 ||
      radialEvaluation.negativeControls.some((entry) => !entry.pass)) {
      fail("invalid radial negative-control campaign cannot materialize a claim-bearing route");
    }
    const witnessPath = candidatePath(
      packet,
      preflight,
      completeSubroutes.map((entry) => entry.subrouteId),
      "c0v-radial-witness.bin",
    );
    const witnessBytes = phase10C0VS6ReadUniquePhysicalFile(root, witnessPath);
    phase10C0VS6SameIdentity(
      radialEvaluation.witness,
      phase10C0VS6ArtifactIdentity(witnessPath, witnessBytes),
      "raw lifecycle radial witness",
    );
    const summaryPath = `${preflight.observed.candidateDirectory}/c0v-radial-producer-summary.json`;
    const finiteShellPath = `${preflight.observed.candidateDirectory}/nc-radial-finite-shell-term-witness.bin`;
    const forgedSummaryPath = `${preflight.observed.candidateDirectory}/nc-radial-forged-summary.json`;
    const robinPath = `${preflight.observed.candidateDirectory}/nc-radial-robin-coefficient-witness.bin`;
    if (packet.bindings.scienceProtocol === null || packet.bindings.referenceOrRefusal === null) {
      fail("radial raw reproof lacks science/reference packet bindings");
    }
    const radialReproof = independentlyReprovePhase10C0VRadialRawArtifacts({
      packetProtocol: input.packetProtocolIdentity,
      packetProtocolBytes: input.packetProtocolBytes,
      preflightBytes: input.preflightBytes,
      scienceProtocolBytes: phase10C0VS6ReadUniquePhysicalFile(root, packet.bindings.scienceProtocol.path),
      referenceBytes: phase10C0VS6ReadUniquePhysicalFile(root, packet.bindings.referenceOrRefusal.path),
      evaluationBytes,
      cleanWitnessBytes: witnessBytes,
      cleanProducerSummaryBytes: phase10C0VS6ReadUniquePhysicalFile(root, summaryPath),
      finiteShellWitnessBytes: phase10C0VS6ReadUniquePhysicalFile(root, finiteShellPath),
      forgedSummaryBytes: phase10C0VS6ReadUniquePhysicalFile(root, forgedSummaryPath),
      robinCoefficientWitnessBytes: phase10C0VS6ReadUniquePhysicalFile(root, robinPath),
    });
    if (radialReproof.numericalDisposition !== radialEvaluation.numericalDisposition ||
      radialReproof.artifactDisposition !== radialEvaluation.artifactDisposition ||
      radialReproof.verdict !== "pass") {
      fail("radial pure raw reproof differs from retained evaluation disposition");
    }
    const tuples = packet.executionRecordTuples.filter((entry) =>
      entry.dispositionCode === "production-complete" &&
      entry.terminalStatus === radialEvaluation.numericalDisposition);
    if (tuples.length !== 1) fail("radial numerical disposition does not select one exact tuple");
    const subroute = uniqueSubroute(packet, tuples[0]!.tupleId);
    const worker = independentlyEvaluatePhase10C0VS6WorkerInvocations(
      workerBytes,
      packet,
      subroute.subrouteId,
      Date.now(),
    );
    return Object.freeze({
      packet,
      preflight,
      selectedSubrouteId: subroute.subrouteId,
      dispositionCode: subroute.dispositionCode,
      terminalState: radialEvaluation.numericalDisposition === "pass" ? "scientific-pass" : "scientific-fail",
      preflightIdentity,
      exitStatus,
      exitStatusIdentity,
      causeEvaluation: null,
      causeCallerResult: null,
      radialEvaluation,
      radialEvaluationIdentity: phase10C0VS6ArtifactIdentity(evaluationPath, evaluationBytes),
      radialReproof,
      produceInvocationRecords: worker.invocationRecords,
      packetInvocationRecords: Object.freeze([]),
      registeredCap: null,
      completionProof: null,
    });
  }

  const completeSubroutes = packet.terminalSubroutes.filter((entry) => entry.dispositionCode === null);
  if (completeSubroutes.length !== 1) fail("nonproduce completion does not resolve one exact subroute");
  const subroute = completeSubroutes[0]!;
  const worker = independentlyEvaluatePhase10C0VS6PacketWorkerInvocations(
    workerBytes,
    packet,
    subroute.subrouteId,
    Date.now(),
  );
  if (packet.packetId !== "a-p-c0v-s6") {
    return Object.freeze({
      packet,
      preflight,
      selectedSubrouteId: subroute.subrouteId,
      dispositionCode: null,
      terminalState: "complete",
      preflightIdentity,
      exitStatus,
      exitStatusIdentity,
      causeEvaluation: null,
      causeCallerResult: null,
      radialEvaluation: null,
      radialEvaluationIdentity: null,
      radialReproof: null,
      produceInvocationRecords: Object.freeze([]),
      packetInvocationRecords: worker.invocationRecords,
      registeredCap: null,
      completionProof: null,
    });
  }
  const missingProducerPath = candidatePath(packet, preflight, [subroute.subrouteId], "missing-producer.json");
  const uncalledCheckPath = candidatePath(packet, preflight, [subroute.subrouteId], "uncalled-check.json");
  const artifactIndexPath = candidatePath(packet, preflight, [subroute.subrouteId], "artifact-index.json");
  const missingProducerBytes = phase10C0VS6ReadUniquePhysicalFile(root, missingProducerPath);
  const uncalledCheckBytes = phase10C0VS6ReadUniquePhysicalFile(root, uncalledCheckPath);
  const artifactIndexBytes = phase10C0VS6ReadUniquePhysicalFile(root, artifactIndexPath);
  const negativeControlReceiptBytes = Object.freeze({
    missingProducer: missingProducerBytes,
    uncalledCheck: uncalledCheckBytes,
  });
  const evaluation = independentlyVerifyPhase10C0VS6ApArtifacts({
    repositoryRoot: input.repositoryRoot,
    negativeControlReceiptBytes,
  });
  if (evaluation.aggregateVerdict !== "pass" || evaluation.errors.length !== 0 ||
    evaluation.negativeControlReproofs.length !== 2 ||
    evaluation.negativeControlReproofs.some((entry) => entry.verdict !== "pass")) {
    fail("A-P completion lacks passing graph evaluation and two independent negative-control reproofs");
  }
  const executedCheckIds = Object.freeze(evaluation.checkResults.map((entry) => entry.checkId));
  const executedNegativeControlIds = Object.freeze(evaluation.negativeControlReproofs.map(
    (entry) => entry.negativeControlId,
  ));
  const callerReproof: Phase10C0VS6ApCheckCallerResult = Object.freeze({
    schema: "phase10-c0v-s6-ap-check-caller-result-v1",
    packetId: "a-p-c0v-s6",
    callerCallableId: "phase10-a-p-c0v-s6-check-caller",
    evaluatorCallableId: "phase10-a-p-c0v-s6-evaluator",
    evaluation,
    executedCheckIds,
    evaluatedCheckIds: executedCheckIds,
    executedNegativeControlIds: executedNegativeControlIds as Phase10C0VS6ApCheckCallerResult["executedNegativeControlIds"],
  });
  const completionProof: Phase10C0VS6ApRawCompletionProof = Object.freeze({
    kind: "a-p-independent-reproof",
    callerReproof,
    evaluation,
    artifactIndex: phase10C0VS6ArtifactIdentity(artifactIndexPath, artifactIndexBytes),
    negativeControlReceipts: Object.freeze([
      phase10C0VS6ArtifactIdentity(missingProducerPath, missingProducerBytes),
      phase10C0VS6ArtifactIdentity(uncalledCheckPath, uncalledCheckBytes),
    ] as const),
  });
  return Object.freeze({
    packet,
    preflight,
    selectedSubrouteId: subroute.subrouteId,
    dispositionCode: null,
    terminalState: "complete",
    preflightIdentity,
    exitStatus,
    exitStatusIdentity,
    causeEvaluation: null,
    causeCallerResult: null,
    radialEvaluation: null,
    radialEvaluationIdentity: null,
    radialReproof: null,
    produceInvocationRecords: Object.freeze([]),
    packetInvocationRecords: worker.invocationRecords,
    registeredCap: null,
    completionProof,
  });
}

interface RawTerminalCandidateContext extends Phase10C0VS6RawTerminalCandidateProjection {
  readonly candidateAuthority: Phase10C0VS6TerminalCandidateAuthority;
}

function exactCapturedCallerResult(actual: unknown, expected: unknown, label: string): void {
  if (actual === null || actual === undefined) fail(`${label} was not captured from the governed caller leaf`);
  const projection = (value: unknown, projectionLabel: string): StrictJson => {
    const row = strictJsonSnapshot(value);
    if (row === null || Array.isArray(row) || typeof row !== "object") {
      fail(`${projectionLabel} is not a caller-result object`);
    }
    const record = row as Readonly<Record<string, StrictJson>>;
    if (!("evaluation" in record) || !Array.isArray(record.executedCheckIds) ||
      !Array.isArray(record.evaluatedCheckIds) || !Array.isArray(record.executedNegativeControlIds)) {
      fail(`${projectionLabel} lacks the exact evaluator/check/control projection`);
    }
    return strictJsonSnapshot({
      evaluation: record.evaluation,
      executedCheckIds: record.executedCheckIds,
      evaluatedCheckIds: record.evaluatedCheckIds,
      executedNegativeControlIds: record.executedNegativeControlIds,
    });
  };
  phase10C0VS6SameJson(
    projection(actual, `${label} capture`),
    projection(expected, `${label} reproof`),
    `${label} versus independent structural reproof`,
  );
}

function registeredCallerSourceIdentity(
  root: ReturnType<typeof phase10C0VS6PhysicalRepositoryRoot>,
  lifecycle: Phase10C0VS6RawLifecycleRouteProjection,
  freezeEvaluationIdentity: Phase10C0VS6ArtifactIdentity,
  causeEvaluationIdentity: Phase10C0VS6ArtifactIdentity | null,
  source: Phase10C0VS6CallerResultSourceAuthority,
): Phase10C0VS6ArtifactIdentity {
  if (source.sourceKind === "attempt-internal") {
    if (source.artifactRelativePath === null || source.outputId !== null) {
      fail(`${source.artifactRole} has incoherent attempt-internal source authority`);
    }
    const path = `${lifecycle.preflight.observed.attemptDirectory}/${source.artifactRelativePath}`;
    if (path === freezeEvaluationIdentity.path) return freezeEvaluationIdentity;
    if (causeEvaluationIdentity !== null && path === causeEvaluationIdentity.path) return causeEvaluationIdentity;
    return phase10C0VS6ArtifactIdentity(path, phase10C0VS6ReadUniquePhysicalFile(root, path));
  }
  if (source.outputId === null || source.artifactRelativePath !== null) {
    fail(`${source.artifactRole} has incoherent registered-output source authority`);
  }
  if (source.outputId.endsWith("-preflight")) return lifecycle.preflightIdentity;
  const matrixBytes = phase10C0VS6ReadUniquePhysicalFile(root, lifecycle.packet.bindings.matrix.path);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(lifecycle.packet.bindings.matrix.path, matrixBytes),
    lifecycle.packet.bindings.matrix,
    "caller source live matrix",
  );
  const matrix = parsePhase10C0VS6Matrix(
    parsePhase10C0VS6PrettyJsonBytes(matrixBytes, "caller source matrix"),
  );
  const outputRows = matrix.outputs.filter((entry) =>
    entry.packetId === lifecycle.packet.packetId && entry.outputId === source.outputId &&
    entry.artifact.field === null);
  if (outputRows.length !== 1 ||
    !lifecycle.packet.paths.allowedPublicationPaths.includes(outputRows[0]!.artifact.path)) {
    fail(`${source.outputId} does not resolve one registered whole-file publication path`);
  }
  const publishedIdentity = (candidateIdentity: Phase10C0VS6ArtifactIdentity): Phase10C0VS6ArtifactIdentity =>
    Object.freeze({
      path: outputRows[0]!.artifact.path,
      byteLength: candidateIdentity.byteLength,
      sha256: candidateIdentity.sha256,
    });
  const completion = lifecycle.completionProof;
  if (completion !== null) {
    if (source.outputId === "out-ap-c0v-s6-artifact-index") {
      return publishedIdentity(completion.artifactIndex);
    }
    if (source.outputId === "out-ap-c0v-s6-missing-producer") {
      return publishedIdentity(completion.negativeControlReceipts[0]);
    }
    if (source.outputId === "out-ap-c0v-s6-uncalled-check") {
      return publishedIdentity(completion.negativeControlReceipts[1]);
    }
  }
  if (lifecycle.packet.packetId === "c0v-radial-produce") {
    if (source.outputId === "out-c0v-radial-protocol" &&
      lifecycle.packet.bindings.scienceProtocol !== null) {
      return lifecycle.packet.bindings.scienceProtocol;
    }
    if (source.outputId === "out-c0v-radial-reference" &&
      lifecycle.packet.bindings.referenceOrRefusal !== null) {
      return lifecycle.packet.bindings.referenceOrRefusal;
    }
    if (source.outputId === "out-c0v-radial-evaluation" &&
      lifecycle.radialEvaluationIdentity !== null) {
      return publishedIdentity(lifecycle.radialEvaluationIdentity);
    }
    if (source.outputId === "out-c0v-radial-witness" && lifecycle.radialReproof !== null) {
      return publishedIdentity(lifecycle.radialReproof.cleanWitness);
    }
  }
  // Publication/aggregate producers materialize their result/index bytes in the immutable
  // candidate directory before the governed check-caller runs.  The caller source authority is
  // nevertheless the registered final output identity.  Derive that future identity only by
  // path relocation of the exact candidate bytes; the historical packet verifier must later
  // reopen and byte-join the final publication copy.
  const candidateFilenames = lifecycle.packet.candidateFilenameRosters[lifecycle.selectedSubrouteId];
  if (candidateFilenames !== undefined) {
    const filename = outputRows[0]!.artifact.path.split("/").at(-1)!;
    const matches = candidateFilenames.filter((entry) => entry === filename);
    if (matches.length === 1) {
      const path = `${lifecycle.preflight.observed.candidateDirectory}/${filename}`;
      return publishedIdentity(phase10C0VS6ArtifactIdentity(
        path,
        phase10C0VS6ReadUniquePhysicalFile(root, path),
      ));
    }
  }
  fail(`${source.artifactRole} has no raw-derived live output identity`);
}

function preCandidateCallerInvocationResults(
  root: ReturnType<typeof phase10C0VS6PhysicalRepositoryRoot>,
  lifecycle: Phase10C0VS6RawLifecycleRouteProjection,
  freezeCallerResult: Phase10C0VS6FreezeAncestryCheckCallerResult | null,
  freezeEvaluationIdentity: Phase10C0VS6ArtifactIdentity,
  causeEvaluationIdentity: Phase10C0VS6ArtifactIdentity | null,
  capturedGovernedCallerResult: unknown | null,
): readonly Phase10C0VS6CallerInvocationResult[] {
  const rosters = lifecycle.packet.terminalReceiptContract.callerInvocationResultRosters.filter(
    (entry) => entry.subrouteId === lifecycle.selectedSubrouteId,
  );
  if (rosters.length !== 1) fail("raw route has no exact caller-result roster");
  const expectedRows = rosters[0]!.callerInvocationResults.filter((entry) => entry.stage === "pre-candidate");
  let governedCaptureUsed = false;
  const results = expectedRows.map((expected): Phase10C0VS6CallerInvocationResult => {
    let evaluatorResult: StrictJson = null;
    if (expected.terminalState === "complete") {
      let callerResult: unknown;
      if (expected.callerCallableId === "phase10-c0v-s6-freeze-check-caller") {
        if (freezeCallerResult === null) fail("freeze caller result is absent from a produce candidate");
        callerResult = freezeCallerResult;
        evaluatorResult = strictJsonSnapshot(freezeCallerResult.evaluation);
      } else if (expected.callerCallableId === "phase10-c0v-s6-refusal-check-caller") {
        if (lifecycle.causeCallerResult === null) fail("generic refusal caller did not execute exactly once");
        callerResult = lifecycle.causeCallerResult;
        evaluatorResult = strictJsonSnapshot(lifecycle.causeCallerResult.evaluation);
      } else if (expected.callerCallableId === "phase10-a-p-c0v-s6-check-caller") {
        if (lifecycle.completionProof === null) fail("A-P completion lacks its independent caller reproof");
        callerResult = lifecycle.completionProof.callerReproof;
        exactCapturedCallerResult(
          capturedGovernedCallerResult,
          callerResult,
          "A-P governed check-caller result",
        );
        governedCaptureUsed = true;
        evaluatorResult = strictJsonSnapshot(lifecycle.completionProof.evaluation);
      } else if (expected.callerCallableId === "phase10-c0v-moving-produce-check-caller" ||
        expected.callerCallableId === "phase10-c0v-static-produce-check-caller") {
        const semantic = lifecycle.causeEvaluation?.semanticEvaluation;
        if (semantic === null || semantic === undefined) {
          fail("moving/static governed caller lacks its pure semantic reproof");
        }
        callerResult = Object.freeze({
          evaluation: semantic,
          terminalStatus: "refusal" as const,
          executedCheckIds: expected.executedCheckIds,
          evaluatedCheckIds: expected.evaluatedCheckIds,
          executedNegativeControlIds: expected.executedNegativeControlIds,
        });
        exactCapturedCallerResult(
          capturedGovernedCallerResult,
          callerResult,
          "moving/static governed check-caller result",
        );
        governedCaptureUsed = true;
        evaluatorResult = strictJsonSnapshot(semantic);
      } else if (expected.callerCallableId === "phase10-c0v-radial-produce-check-caller") {
        if (lifecycle.radialEvaluation === null || lifecycle.radialReproof === null ||
          lifecycle.radialReproof.verdict !== "pass") {
          fail("radial governed caller lacks its pure raw artifact reproof");
        }
        callerResult = Object.freeze({
          evaluation: lifecycle.radialEvaluation,
          executedCheckIds: expected.executedCheckIds,
          evaluatedCheckIds: expected.evaluatedCheckIds,
          executedNegativeControlIds: expected.executedNegativeControlIds,
        });
        exactCapturedCallerResult(
          capturedGovernedCallerResult,
          callerResult,
          "radial governed check-caller result",
        );
        governedCaptureUsed = true;
        evaluatorResult = strictJsonSnapshot(lifecycle.radialEvaluation);
      } else if (expected.callerCallableId === "phase10-c0v-moving-publish-check-caller" ||
        expected.callerCallableId === "phase10-c0v-radial-publish-check-caller" ||
        expected.callerCallableId === "phase10-c0v-static-publish-check-caller" ||
        expected.callerCallableId === "phase10-c0v-aggregate-check-caller") {
        if (capturedGovernedCallerResult === null) {
          fail(`${expected.callerCallableId} governed result was not captured before candidate construction`);
        }
        const captured = strictJsonSnapshot(capturedGovernedCallerResult);
        if (captured === null || Array.isArray(captured) || typeof captured !== "object") {
          fail(`${expected.callerCallableId} governed result is not an object`);
        }
        const row = captured as Readonly<Record<string, StrictJson>>;
        if (!("evaluation" in row) || !Array.isArray(row.executedCheckIds) ||
          !Array.isArray(row.evaluatedCheckIds) || !Array.isArray(row.executedNegativeControlIds)) {
          fail(`${expected.callerCallableId} governed result lacks evaluator/check/control fields`);
        }
        exactRoster(row.executedCheckIds as string[], expected.executedCheckIds,
          `${expected.callerCallableId} executed checks`);
        exactRoster(row.evaluatedCheckIds as string[], expected.evaluatedCheckIds,
          `${expected.callerCallableId} evaluated checks`);
        exactRoster(row.executedNegativeControlIds as string[], expected.executedNegativeControlIds,
          `${expected.callerCallableId} executed controls`);
        callerResult = capturedGovernedCallerResult;
        governedCaptureUsed = true;
        evaluatorResult = row.evaluation!;
      } else {
        fail(`${expected.callerCallableId} has no current raw pre-candidate reproof implementation`);
      }
      const callerRow = strictJsonSnapshot(callerResult) as StrictJson;
      if (callerRow === null) fail(`${expected.callerCallableId} returned a null caller result`);
    }
    const sourceArtifactIdentities = Object.freeze(expected.sourceArtifactAuthorities.map((source) =>
      Object.freeze({
        artifactRole: source.artifactRole,
        artifact: registeredCallerSourceIdentity(
          root,
          lifecycle,
          freezeEvaluationIdentity,
          causeEvaluationIdentity,
          source,
        ),
      })));
    return Object.freeze({
      callerInvocationId: expected.callerInvocationId,
      stage: expected.stage,
      callerCallableId: expected.callerCallableId,
      evaluatorCallableId: expected.evaluatorCallableId,
      terminalState: expected.terminalState,
      executedCheckIds: expected.executedCheckIds,
      evaluatedCheckIds: expected.evaluatedCheckIds,
      executedNegativeControlIds: expected.executedNegativeControlIds,
      evaluatorResult,
      sourceArtifactIdentities,
    });
  });
  if ((capturedGovernedCallerResult !== null) !== governedCaptureUsed) {
    fail("governed caller capture presence differs from the selected pre-candidate caller roster");
  }
  return Object.freeze(results);
}

function projectRawTerminalCandidateContext(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
  capturedGovernedCallerResult: unknown | null,
  lifecycleOverride: Phase10C0VS6RawLifecycleRouteProjection | null = null,
  historicalFreeze: Phase10C0VS6HistoricalFreezeProjection | null = null,
): RawTerminalCandidateContext {
  const lifecycle = lifecycleOverride ?? independentlyProjectPhase10C0VS6RawLifecycleRoute(input);
  const { packet, preflight } = lifecycle;
  const root = phase10C0VS6PhysicalRepositoryRoot(input.repositoryRoot);
  const attemptDirectory = preflight.observed.attemptDirectory;
  const decisionRosters = packet.terminalCandidateContract.decisionRosters.filter(
    (entry) => entry.subrouteId === lifecycle.selectedSubrouteId,
  );
  if (decisionRosters.length !== 1) fail("raw lifecycle route lacks one exact terminal-candidate roster");
  const decisionRoster = decisionRosters[0]!;

  const freezeCallerResult: Phase10C0VS6FreezeAncestryCheckCallerResult | null = historicalFreeze === null
    ? (isProducePacket(packet.packetId) ? phase10C0VS6FreezeAncestryCheckCaller(input) : null)
    : historicalFreeze.ancestryCallerResult;
  const freezeAuthority = historicalFreeze?.retained ?? freezeCallerResult?.evaluation ??
    independentlyEvaluatePhase10C0VS6RetainedFreeze(input);
  if (freezeAuthority.packetId !== packet.packetId) fail("fresh freeze authority differs from raw lifecycle packet");
  const freezePath = `${attemptDirectory}/${packet.freezeEvaluationContract.filename}`;
  const freezeBytes = historicalFreeze === null
    ? phase10C0VS6ReadUniquePhysicalFile(root, freezePath)
    : phase10C0VS6ReadUniquePhysicalFile(root, historicalFreeze.receiptIdentity.path);
  const freezeEvaluationIdentity = phase10C0VS6ArtifactIdentity(freezePath, freezeBytes);
  const freezeEvaluation = historicalFreeze === null
    ? parsePhase10C0VS6FreezeEvaluationBytes(freezeBytes, packet, {
      protocol: input.packetProtocolIdentity,
      preflight: lifecycle.preflightIdentity,
      implementationFreezeCommit: freezeAuthority.implementationFreezeCommit,
      launchHead: freezeAuthority.launchHead,
      launchBranch: freezeAuthority.launchBranch,
      anchorPaths: freezeAuthority.anchorPaths,
      artifacts: freezeAuthority.artifacts,
      parserRuntimeArtifacts: freezeAuthority.parserRuntimeArtifacts,
      artifactFailure: freezeAuthority.artifactFailure,
    })
    : historicalFreeze.receipt;
  if (historicalFreeze !== null) {
    phase10C0VS6SameIdentity(
      freezeEvaluationIdentity,
      historicalFreeze.receiptIdentity,
      "historical freeze receipt path/bytes",
    );
  }

  let causeEvaluation: Phase10C0VS6CauseEvaluationReceipt | null = null;
  let causeEvaluationIdentity: Phase10C0VS6ArtifactIdentity | null = null;
  if (lifecycle.causeEvaluation !== null) {
    const causePath = `${attemptDirectory}/${packet.causeEvaluationContract.filename}`;
    const causeBytes = phase10C0VS6ReadUniquePhysicalFile(root, causePath);
    causeEvaluationIdentity = phase10C0VS6ArtifactIdentity(causePath, causeBytes);
    causeEvaluation = parsePhase10C0VS6CauseEvaluationBytes(
      causeBytes,
      packet,
      lifecycle.causeEvaluation,
    );
  }

  const decisionResults = decisionRoster.decisions.map((decision) => {
    if (decision.decisionRole === "freeze") {
      return Object.freeze({
        decisionRole: "freeze" as const,
        evidence: freezeEvaluationIdentity,
        verdict: freezeEvaluation.verdict,
        reasons: freezeEvaluation.reasons,
      });
    }
    if (causeEvaluation === null || causeEvaluationIdentity === null) {
      fail("selected terminal-candidate route lacks its raw-derived cause evaluation");
    }
    return Object.freeze({
      decisionRole: "cause" as const,
      evidence: causeEvaluationIdentity,
      verdict: causeEvaluation.verdict,
      reasons: causeEvaluation.reasons,
    });
  });
  if ((lifecycle.causeEvaluation === null) !== !decisionRoster.decisions.some(
    (entry) => entry.decisionRole === "cause",
  )) {
    fail("raw lifecycle cause nullability differs from terminal-candidate decision roster");
  }
  const callerInvocationResults = preCandidateCallerInvocationResults(
    root,
    lifecycle,
    freezeCallerResult,
    freezeEvaluationIdentity,
    causeEvaluationIdentity,
    capturedGovernedCallerResult,
  );
  const actualCallerCheckIds = callerInvocationResults.flatMap((entry) => [...entry.executedCheckIds]).sort();
  const actualEvaluatedCheckIds = callerInvocationResults.flatMap((entry) => [...entry.evaluatedCheckIds]).sort();
  const actualCallerNegativeControlIds = callerInvocationResults
    .flatMap((entry) => [...entry.executedNegativeControlIds]).sort();
  exactRoster(actualCallerCheckIds, decisionRoster.candidateExecutedCheckIds, "candidate executed-check roster");
  exactRoster(actualEvaluatedCheckIds, decisionRoster.candidateExecutedCheckIds, "candidate evaluated-check roster");
  exactRoster(
    actualCallerNegativeControlIds,
    decisionRoster.candidateExecutedNegativeControlIds,
    "candidate negative-control roster",
  );
  const candidateAuthority: Phase10C0VS6TerminalCandidateAuthority = Object.freeze({
    selectedSubrouteId: lifecycle.selectedSubrouteId,
    attemptDirectory,
    preflight: lifecycle.preflightIdentity,
    exitStatus: lifecycle.exitStatusIdentity,
    decisionResults: Object.freeze(decisionResults),
    callerInvocationResults,
  });
  const decisions = new Map(decisionRoster.decisions.map((decision, index) => {
    const result = decisionResults[index]!;
    return [decision.fieldName, Object.freeze({
      decisionId: decision.decisionId,
      evaluatorCallableId: decision.evaluatorCallableId,
      invokedCheckIds: decision.invokedCheckIds,
      verdict: result.verdict,
      reasons: result.reasons,
      evidence: Object.freeze(decision.evidence.map((entry) => Object.freeze({
        evidenceRole: entry.evidenceRole,
        artifact: result.evidence,
      }))),
    })] as const;
  }));
  const candidateValue = {
    schema: packet.terminalCandidateContract.rowSchema,
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    selectedSubrouteId: lifecycle.selectedSubrouteId,
    dispositionCode: lifecycle.dispositionCode,
    preflight: lifecycle.preflightIdentity,
    exitStatus: lifecycle.exitStatusIdentity,
    producedOutputIds: decisionRoster.candidateProducedOutputIds,
    executedCheckIds: decisionRoster.candidateExecutedCheckIds,
    executedNegativeControlIds: decisionRoster.candidateExecutedNegativeControlIds,
    callerInvocationResults,
    freezeDecision: decisions.get("freezeDecision") ?? null,
    causeDecision: decisions.get("causeDecision") ?? null,
    verdict: decisionRoster.candidateVerdict,
    reasons: decisionRoster.candidateReasonCodes,
  };
  const candidateBytes = writePhase10C0VS6TerminalCandidate(candidateValue, packet, candidateAuthority);
  const candidate = parsePhase10C0VS6TerminalCandidateBytes(candidateBytes, packet, candidateAuthority);
  const candidatePath = `${attemptDirectory}/${decisionRoster.candidateFilename}`;
  const candidateIdentity = phase10C0VS6ArtifactIdentity(candidatePath, candidateBytes);
  return Object.freeze({
    lifecycle,
    freezeEvaluation,
    freezeEvaluationIdentity,
    causeEvaluation,
    causeEvaluationIdentity,
    candidatePath,
    candidate,
    candidateBytes,
    candidateIdentity,
    candidateAuthority,
  });
}

/**
 * Canonically constructs the immutable in-memory pre-census/pre-resource terminal-candidate
 * projection from live raw lifecycle and freshly rederived freeze/cause authority. No candidate,
 * attempt row, or final receipt is accepted as an input, and this function performs no write.
 */
export function independentlyMaterializePhase10C0VS6TerminalCandidate(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
  capturedGovernedCallerResult: unknown | null = null,
): Phase10C0VS6RawTerminalCandidateProjection {
  const projected = projectRawTerminalCandidateContext(input, capturedGovernedCallerResult);
  return Object.freeze({
    lifecycle: projected.lifecycle,
    freezeEvaluation: projected.freezeEvaluation,
    freezeEvaluationIdentity: projected.freezeEvaluationIdentity,
    causeEvaluation: projected.causeEvaluation,
    causeEvaluationIdentity: projected.causeEvaluationIdentity,
    candidatePath: projected.candidatePath,
    candidate: projected.candidate,
    candidateBytes: projected.candidateBytes,
    candidateIdentity: projected.candidateIdentity,
  });
}

function reopenPhase10C0VS6TerminalCandidate(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
  capturedGovernedCallerResult?: unknown,
  historical = false,
): Phase10C0VS6RawTerminalCandidateProjection {
  const root = phase10C0VS6PhysicalRepositoryRoot(input.repositoryRoot);
  const lifecycle = independentlyProjectPhase10C0VS6RawLifecycleRoute(input);
  const decisionRosters = lifecycle.packet.terminalCandidateContract.decisionRosters.filter(
    (entry) => entry.subrouteId === lifecycle.selectedSubrouteId,
  );
  if (decisionRosters.length !== 1) fail("raw lifecycle route lacks one exact terminal-candidate roster");
  const candidatePath = `${lifecycle.preflight.observed.attemptDirectory}/${decisionRosters[0]!.candidateFilename}`;
  const candidateBytes = phase10C0VS6ReadUniquePhysicalFile(root, candidatePath);
  let capture = capturedGovernedCallerResult ?? null;
  if (capturedGovernedCallerResult === undefined) {
    const raw = strictJsonSnapshot(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(candidateBytes)) as unknown);
    if (raw === null || Array.isArray(raw) || typeof raw !== "object") fail("live terminal candidate is not an object");
    const candidateRow = raw as Readonly<Record<string, StrictJson>>;
    if (!Array.isArray(candidateRow.callerInvocationResults)) {
      fail("live terminal candidate lacks callerInvocationResults");
    }
    const expectedGoverned = lifecycle.packet.terminalReceiptContract.callerInvocationResultRosters
      .filter((entry) => entry.subrouteId === lifecycle.selectedSubrouteId)
      .flatMap((entry) => entry.callerInvocationResults)
      .filter((entry) => entry.stage === "pre-candidate" && entry.terminalState === "complete" &&
        entry.callerCallableId !== "phase10-c0v-s6-freeze-check-caller" &&
        entry.callerCallableId !== "phase10-c0v-s6-refusal-check-caller");
    if (expectedGoverned.length > 1) fail("selected route has more than one governed caller capture");
    if (expectedGoverned.length === 1) {
      const matches = candidateRow.callerInvocationResults.filter((entry) => {
        if (entry === null || Array.isArray(entry) || typeof entry !== "object") return false;
        const row = entry as Readonly<Record<string, StrictJson>>;
        return row.callerInvocationId === expectedGoverned[0]!.callerInvocationId;
      });
      if (matches.length !== 1) fail("live terminal candidate lacks its exact governed caller capture");
      const row = matches[0] as Readonly<Record<string, StrictJson>>;
      capture = {
        evaluation: row.evaluatorResult,
        executedCheckIds: row.executedCheckIds,
        evaluatedCheckIds: row.evaluatedCheckIds,
        executedNegativeControlIds: row.executedNegativeControlIds,
      };
    }
  }
  const historicalFreeze = historical
    ? independentlyReopenPhase10C0VS6HistoricalFreeze(input)
    : null;
  const projected = projectRawTerminalCandidateContext(input, capture, lifecycle, historicalFreeze);
  const liveBytes = phase10C0VS6ReadUniquePhysicalFile(root, projected.candidatePath);
  const liveIdentity = phase10C0VS6ArtifactIdentity(projected.candidatePath, liveBytes);
  phase10C0VS6SameIdentity(liveIdentity, projected.candidateIdentity, "live terminal candidate");
  const candidate = parsePhase10C0VS6TerminalCandidateBytes(
    liveBytes,
    projected.lifecycle.packet,
    projected.candidateAuthority,
  );
  return Object.freeze({
    lifecycle: projected.lifecycle,
    freezeEvaluation: projected.freezeEvaluation,
    freezeEvaluationIdentity: projected.freezeEvaluationIdentity,
    causeEvaluation: projected.causeEvaluation,
    causeEvaluationIdentity: projected.causeEvaluationIdentity,
    candidatePath: projected.candidatePath,
    candidate,
    candidateBytes: liveBytes,
    candidateIdentity: liveIdentity,
  });
}

/** Reopens the exact immutable candidate and compares it with a fresh current-launch materialization. */
export function independentlyReopenPhase10C0VS6TerminalCandidate(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
  capturedGovernedCallerResult?: unknown,
): Phase10C0VS6RawTerminalCandidateProjection {
  return reopenPhase10C0VS6TerminalCandidate(input, capturedGovernedCallerResult, false);
}

/**
 * Read-only reopener for a committed prior packet.  It reprojects lifecycle/cause/science facts
 * from the retained raw bytes while validating freeze authority against the recorded historical
 * launch commit rather than incorrectly requiring that commit to remain current HEAD.
 */
export function independentlyReopenPhase10C0VS6HistoricalTerminalCandidate(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
  capturedGovernedCallerResult?: unknown,
): Phase10C0VS6RawTerminalCandidateProjection {
  return reopenPhase10C0VS6TerminalCandidate(input, capturedGovernedCallerResult, true);
}
