import { canonicalJson, strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import { basename, dirname } from "node:path";
import {
  PHASE10_C0V_S6_MATRIX_ID,
  parsePhase10C0VS6RetainedPreflight,
  type Phase10C0VS6PacketProtocol,
  type Phase10C0VS6RetainedPreflight,
} from "./phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6Boolean,
  phase10C0VS6ExactOrderedKeys,
  phase10C0VS6IsoInstant,
  phase10C0VS6NonnegativeNumber,
  phase10C0VS6Object,
  phase10C0VS6NonnegativeSafeInteger,
  phase10C0VS6ParsePrettyJson,
  phase10C0VS6PrettyJsonBytes,
  phase10C0VS6SafeRelativePath,
  phase10C0VS6SafeToken,
  phase10C0VS6SameIdentity,
  phase10C0VS6SameJson,
  phase10C0VS6Sha256,
  phase10C0VS6SortedUniqueStrings,
  phase10C0VS6String,
  parsePhase10C0VS6ArtifactIdentity,
  parsePhase10C0VS6ExecutableInvocationRecords,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6DispositionCode,
  type Phase10C0VS6ExecutableInvocationRecord,
} from "./phase10-c0v-s6-execution-contracts.ts";
import type { Phase10C0VS6ValidatedArtifactFailure } from "./phase10-c0v-s6-artifact-observation.ts";

const RADIAL_CHECK_IDS = Object.freeze([
  "chk-c0v-radial-numeric",
  "chk-c0v-radial-reference-independence",
] as const);
const RADIAL_CONTROL_IDS = Object.freeze([
  "nc-radial-finite-shell-term",
  "nc-radial-forged-summary",
  "nc-radial-robin-coefficient",
] as const);

export interface Phase10C0VS6ExitStatusReceipt {
  readonly schema: "phase10-c0v-exit-status-v1";
  readonly packetId: Phase10C0VS6PacketProtocol["packetId"];
  readonly attemptId: string;
  readonly workerProcessInvocationCount: 0 | 1;
  readonly workerStarted: boolean;
  readonly exitCode: number | null;
  readonly signal: string | null;
  readonly classification: "no-worker" | "complete" | "registered-cap" | "infrastructure-failure";
}

export function parsePhase10C0VS6ExitStatusReceipt(
  value: unknown,
  packet: Pick<Phase10C0VS6PacketProtocol, "packetId" | "registeredAttemptId" | "exitStatusContract">,
): Phase10C0VS6ExitStatusReceipt {
  const label = `${packet.packetId} exit-status receipt`;
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, packet.exitStatusContract.exactFields, label);
  if (row.schema !== packet.exitStatusContract.rowSchema || row.packetId !== packet.packetId ||
    row.attemptId !== packet.registeredAttemptId) {
    fail(`${label} identity fields differ from packet authority`);
  }
  const workerProcessInvocationCount = phase10C0VS6NonnegativeSafeInteger(
    row.workerProcessInvocationCount,
    `${label}.workerProcessInvocationCount`,
  );
  if (workerProcessInvocationCount !== 0 && workerProcessInvocationCount !== 1) {
    fail(`${label}.workerProcessInvocationCount must be zero or one`);
  }
  const workerStarted = phase10C0VS6Boolean(row.workerStarted, `${label}.workerStarted`);
  const exitCode = row.exitCode === null
    ? null
    : phase10C0VS6NonnegativeSafeInteger(row.exitCode, `${label}.exitCode`);
  const signal = row.signal === null ? null : phase10C0VS6String(row.signal, `${label}.signal`);
  if (signal !== null && !/^SIG[A-Z0-9]+$/u.test(signal)) {
    fail(`${label}.signal is not a canonical platform signal name`);
  }
  const classification = row.classification === "no-worker" || row.classification === "complete" ||
    row.classification === "registered-cap" || row.classification === "infrastructure-failure"
    ? row.classification
    : fail(`${label}.classification differs from the exact enum`);
  const workerStartedCount = workerProcessInvocationCount === 1;
  const rawChildOutcomeCount = Number(exitCode !== null) + Number(signal !== null);
  if (workerStarted !== workerStartedCount ||
    (classification === "no-worker") !== !workerStartedCount ||
    (!workerStartedCount && rawChildOutcomeCount !== 0) ||
    (workerStartedCount && rawChildOutcomeCount !== 1)) {
    fail(`${label} worker/count/exit/signal classification is incoherent`);
  }
  if (classification === "complete" && (exitCode !== 0 || signal !== null)) {
    fail(`${label} complete classification requires raw exit code zero and no signal`);
  }
  if (classification === "infrastructure-failure" && exitCode === 0) {
    fail(`${label} infrastructure failure requires a nonzero raw code or a signal`);
  }
  return Object.freeze({
    schema: "phase10-c0v-exit-status-v1",
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    workerProcessInvocationCount: workerProcessInvocationCount as 0 | 1,
    workerStarted,
    exitCode,
    signal,
    classification,
  });
}

export function parsePhase10C0VS6ExitStatusBytes(
  bytes: Uint8Array,
  packet: Pick<Phase10C0VS6PacketProtocol, "packetId" | "registeredAttemptId" | "exitStatusContract">,
): Phase10C0VS6ExitStatusReceipt {
  return parsePhase10C0VS6ExitStatusReceipt(
    phase10C0VS6ParsePrettyJson(bytes, `${packet.packetId} exit-status bytes`),
    packet,
  );
}

export function writePhase10C0VS6ExitStatusReceipt(
  value: unknown,
  packet: Pick<Phase10C0VS6PacketProtocol, "packetId" | "registeredAttemptId" | "exitStatusContract">,
): Uint8Array {
  return phase10C0VS6PrettyJsonBytes(parsePhase10C0VS6ExitStatusReceipt(value, packet));
}

export function parsePhase10C0VS6PreflightReceiptBytes(
  bytes: Uint8Array,
  packet: Phase10C0VS6PacketProtocol,
  packetProtocolIdentity: Phase10C0VS6ArtifactIdentity,
): Phase10C0VS6RetainedPreflight {
  return parsePhase10C0VS6RetainedPreflight(
    phase10C0VS6ParsePrettyJson(bytes, `${packet.packetId} retained preflight bytes`),
    packet,
    packetProtocolIdentity,
  );
}

/**
 * Canonical preflight-v2 receipt writer. The strict parser re-derives the packet/attempt/path,
 * branch, resource arithmetic, and refusal-shape contract before any bytes are returned.
 */
export function writePhase10C0VS6PreflightReceipt(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
  packetProtocolIdentity: Phase10C0VS6ArtifactIdentity,
): Uint8Array {
  return phase10C0VS6PrettyJsonBytes(
    parsePhase10C0VS6RetainedPreflight(value, packet, packetProtocolIdentity),
  );
}

export interface Phase10C0VS6FreezeEvaluationReceipt {
  readonly schema: "phase10-c0v-s6-freeze-evaluation-v1";
  readonly evaluationId: string;
  readonly packetId: Phase10C0VS6PacketProtocol["packetId"];
  readonly attemptId: string;
  readonly protocol: Phase10C0VS6ArtifactIdentity;
  readonly preflight: Phase10C0VS6ArtifactIdentity;
  readonly implementationFreezeCommit: string;
  readonly launchHead: string;
  readonly launchBranch: "phase10/evidence-verification";
  readonly anchorPaths: readonly string[];
  readonly artifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly parserRuntimeArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly artifactFailure: Phase10C0VS6ValidatedArtifactFailure | null;
  readonly invokedCheckIds: readonly string[];
  readonly verdict: "pass";
  readonly reasons: readonly string[];
}

export interface Phase10C0VS6FreezeEvaluationAuthority {
  readonly protocol: Phase10C0VS6ArtifactIdentity;
  readonly preflight: Phase10C0VS6ArtifactIdentity;
  readonly implementationFreezeCommit: string;
  readonly launchHead: string;
  readonly launchBranch: "phase10/evidence-verification";
  readonly anchorPaths: readonly string[];
  readonly artifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly parserRuntimeArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly artifactFailure: Phase10C0VS6ValidatedArtifactFailure | null;
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

function exactSortedPaths(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.length === 0) fail(`${label} must be a nonempty array`);
  const paths = value.map((entry, index) => phase10C0VS6SafeRelativePath(entry, `${label}[${index}]`));
  const expected = [...new Set(paths)].sort(codePointCompare);
  if (paths.length !== expected.length || paths.some((entry, index) => entry !== expected[index])) {
    fail(`${label} must be exact Unicode-code-point sorted unique paths`);
  }
  return Object.freeze(paths);
}

function exactArtifactRoster(value: unknown, label: string): readonly Phase10C0VS6ArtifactIdentity[] {
  if (!Array.isArray(value) || value.length === 0) fail(`${label} must be a nonempty array`);
  const artifacts = value.map((entry, index) =>
    parsePhase10C0VS6ArtifactIdentity(entry, `${label}[${index}]`));
  const paths = artifacts.map((entry) => entry.path);
  const expectedPaths = [...new Set(paths)].sort(codePointCompare);
  if (paths.length !== expectedPaths.length || paths.some((entry, index) => entry !== expectedPaths[index])) {
    fail(`${label} must be exact Unicode-code-point path-sorted unique identities`);
  }
  return Object.freeze(artifacts);
}

function parseArtifactFailure(
  value: unknown,
  packet: Pick<Phase10C0VS6PacketProtocol, "freezeEvaluationContract">,
  label: string,
): Phase10C0VS6ValidatedArtifactFailure | null {
  if (value === null) return null;
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, packet.freezeEvaluationContract.artifactFailureExactFields, label);
  const artifactRole = row.artifactRole === "science-protocol" || row.artifactRole === "reference-or-refusal"
    ? row.artifactRole
    : fail(`${label}.artifactRole differs from the exact enum`);
  if (row.failureClass !== "filesystem-object-policy-failure") {
    fail(`${label}.failureClass differs from the exact filesystem-policy refusal`);
  }
  const expected = parsePhase10C0VS6ArtifactIdentity(row.expected, `${label}.expected`);
  const observed = parsePhase10C0VS6ArtifactIdentity(row.observed, `${label}.observed`);
  phase10C0VS6SameIdentity(observed, expected, `${label}.observed exact bytes`);
  const filesystem = phase10C0VS6Object(row.filesystemObservation, `${label}.filesystemObservation`);
  phase10C0VS6ExactOrderedKeys(filesystem, [
    "path", "lstatObjectType", "lstatByteLength", "lstatLinkCount", "fileResolvedRelativePath",
    "lexicalParentRelativePath", "resolvedParentRelativePath", "resolvedInsideRepository",
    "parentAliased", "fstatBefore", "fstatAfter", "failureReasons", "readMethod",
  ], `${label}.filesystemObservation`);
  const parseFstat = (value: unknown, fstatLabel: string) => {
    const fstat = phase10C0VS6Object(value, fstatLabel);
    phase10C0VS6ExactOrderedKeys(
      fstat,
      ["deviceIdDecimal", "fileIdDecimal", "byteLength", "linkCount"],
      fstatLabel,
    );
    const decimal = (entry: unknown, entryLabel: string): string => {
      const text = phase10C0VS6String(entry, entryLabel);
      if (!/^(?:0|[1-9][0-9]*)$/u.test(text)) fail(`${entryLabel} is not a canonical nonnegative decimal`);
      return text;
    };
    return Object.freeze({
      deviceIdDecimal: decimal(fstat.deviceIdDecimal, `${fstatLabel}.deviceIdDecimal`),
      fileIdDecimal: decimal(fstat.fileIdDecimal, `${fstatLabel}.fileIdDecimal`),
      byteLength: phase10C0VS6NonnegativeSafeInteger(fstat.byteLength, `${fstatLabel}.byteLength`),
      linkCount: phase10C0VS6NonnegativeSafeInteger(fstat.linkCount, `${fstatLabel}.linkCount`),
    });
  };
  const fstatBefore = parseFstat(filesystem.fstatBefore, `${label}.filesystemObservation.fstatBefore`);
  const fstatAfter = parseFstat(filesystem.fstatAfter, `${label}.filesystemObservation.fstatAfter`);
  phase10C0VS6SameJson(fstatBefore, fstatAfter, `${label}.filesystemObservation descriptor stability`);
  const path = phase10C0VS6SafeRelativePath(filesystem.path, `${label}.filesystemObservation.path`);
  const lexicalParentRelativePath = phase10C0VS6SafeRelativePath(
    filesystem.lexicalParentRelativePath,
    `${label}.filesystemObservation.lexicalParentRelativePath`,
  );
  const resolvedParentRelativePath = phase10C0VS6SafeRelativePath(
    filesystem.resolvedParentRelativePath,
    `${label}.filesystemObservation.resolvedParentRelativePath`,
  );
  const fileResolvedRelativePath = phase10C0VS6SafeRelativePath(
    filesystem.fileResolvedRelativePath,
    `${label}.filesystemObservation.fileResolvedRelativePath`,
  );
  const lstatByteLength = phase10C0VS6NonnegativeSafeInteger(
    filesystem.lstatByteLength,
    `${label}.filesystemObservation.lstatByteLength`,
  );
  const lstatLinkCount = phase10C0VS6NonnegativeSafeInteger(
    filesystem.lstatLinkCount,
    `${label}.filesystemObservation.lstatLinkCount`,
  );
  const parentAliased = phase10C0VS6Boolean(
    filesystem.parentAliased,
    `${label}.filesystemObservation.parentAliased`,
  );
  if (!Array.isArray(filesystem.failureReasons) || filesystem.failureReasons.length === 0) {
    fail(`${label}.filesystemObservation.failureReasons must be nonempty`);
  }
  const failureReasons = filesystem.failureReasons.map((entry, index) =>
    entry === "link-count-not-one" || entry === "parent-path-aliased"
      ? entry
      : fail(`${label}.filesystemObservation.failureReasons[${index}] differs from exact enum`));
  const expectedReasons = [
    ...(lstatLinkCount !== 1 ? ["link-count-not-one" as const] : []),
    ...(parentAliased ? ["parent-path-aliased" as const] : []),
  ];
  if (path !== expected.path || filesystem.lstatObjectType !== "regular-file" ||
    lstatByteLength !== expected.byteLength || lstatLinkCount < 1 ||
    lexicalParentRelativePath !== dirname(expected.path).replaceAll("\\", "/") ||
    fileResolvedRelativePath !== `${resolvedParentRelativePath}/${basename(expected.path)}` ||
    filesystem.resolvedInsideRepository !== true ||
    parentAliased !== (lexicalParentRelativePath !== resolvedParentRelativePath) ||
    fstatBefore.byteLength !== expected.byteLength || fstatBefore.linkCount !== lstatLinkCount ||
    failureReasons.length !== expectedReasons.length ||
    failureReasons.some((entry, index) => entry !== expectedReasons[index]) ||
    filesystem.readMethod !== "descriptor-hash-fstat-before-after") {
    fail(`${label}.filesystemObservation does not prove the exact clean-compatible filesystem-policy failure`);
  }
  const filesystemObservation = Object.freeze({
    path,
    lstatObjectType: "regular-file" as const,
    lstatByteLength,
    lstatLinkCount,
    fileResolvedRelativePath,
    lexicalParentRelativePath,
    resolvedParentRelativePath,
    resolvedInsideRepository: true as const,
    parentAliased,
    fstatBefore,
    fstatAfter,
    failureReasons: Object.freeze(failureReasons),
    readMethod: "descriptor-hash-fstat-before-after" as const,
  });
  return Object.freeze({
    artifactRole,
    expected,
    observed,
    filesystemObservation,
    failureClass: "filesystem-object-policy-failure",
  });
}

function freezeCheckIds(
  packet: Pick<Phase10C0VS6PacketProtocol, "terminalCandidateContract">,
): readonly string[] {
  const checkIds: string[] = [];
  for (const roster of packet.terminalCandidateContract.decisionRosters) {
    for (const decision of roster.decisions) {
      if (decision.decisionRole !== "freeze") continue;
      for (const checkId of decision.invokedCheckIds) {
        if (!checkIds.includes(checkId)) checkIds.push(checkId);
      }
    }
  }
  return Object.freeze(checkIds);
}

/**
 * Strict contextual codec for the clean-launch freeze result.  The receipt is not allowed to
 * supply its own Git or artifact authority: every load-bearing field is compared with the
 * independently derived authority passed by the clean-launch evaluator.
 */
export function parsePhase10C0VS6FreezeEvaluationReceipt(
  value: unknown,
  packet: Pick<
    Phase10C0VS6PacketProtocol,
    "packetId" | "registeredAttemptId" | "freezeEvaluationContract" | "terminalCandidateContract"
  >,
  authority: Phase10C0VS6FreezeEvaluationAuthority,
): Phase10C0VS6FreezeEvaluationReceipt {
  const label = `${packet.packetId} freeze evaluation`;
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, packet.freezeEvaluationContract.exactFields, label);
  const evaluationId = `freeze-${packet.packetId}-${packet.registeredAttemptId}-v1`;
  if (row.schema !== packet.freezeEvaluationContract.rowSchema || row.evaluationId !== evaluationId ||
    row.packetId !== packet.packetId || row.attemptId !== packet.registeredAttemptId) {
    fail(`${label} schema/evaluation/packet/attempt identity differs from authority`);
  }
  const protocol = parsePhase10C0VS6ArtifactIdentity(row.protocol, `${label}.protocol`);
  const preflight = parsePhase10C0VS6ArtifactIdentity(row.preflight, `${label}.preflight`);
  phase10C0VS6SameIdentity(protocol, authority.protocol, `${label}.protocol`);
  phase10C0VS6SameIdentity(preflight, authority.preflight, `${label}.preflight`);
  if (!/^[0-9a-f]{40}$/u.test(String(row.implementationFreezeCommit)) ||
    !/^[0-9a-f]{40}$/u.test(String(row.launchHead)) ||
    row.implementationFreezeCommit !== authority.implementationFreezeCommit ||
    row.launchHead !== authority.launchHead || row.launchBranch !== authority.launchBranch) {
    fail(`${label} Git derivation fields differ from independent authority`);
  }
  const anchorPaths = exactSortedPaths(row.anchorPaths, `${label}.anchorPaths`);
  const artifacts = exactArtifactRoster(row.artifacts, `${label}.artifacts`);
  const parserRuntimeArtifacts = exactArtifactRoster(
    row.parserRuntimeArtifacts,
    `${label}.parserRuntimeArtifacts`,
  );
  phase10C0VS6SameJson(anchorPaths, authority.anchorPaths, `${label}.anchorPaths authority`);
  phase10C0VS6SameJson(artifacts, authority.artifacts, `${label}.artifacts authority`);
  phase10C0VS6SameJson(
    parserRuntimeArtifacts,
    authority.parserRuntimeArtifacts,
    `${label}.parserRuntimeArtifacts authority`,
  );
  const artifactFailure = parseArtifactFailure(row.artifactFailure, packet, `${label}.artifactFailure`);
  phase10C0VS6SameJson(artifactFailure, authority.artifactFailure, `${label}.artifactFailure authority`);
  const invokedCheckIds = phase10C0VS6SortedUniqueStrings(row.invokedCheckIds, `${label}.invokedCheckIds`);
  exactStringRoster(invokedCheckIds, freezeCheckIds(packet), `${label}.invokedCheckIds`);
  const reasons = phase10C0VS6SortedUniqueStrings(row.reasons, `${label}.reasons`);
  if (row.verdict !== "pass" || reasons.length !== 0) fail(`${label} must be a clean passing derivation`);
  return Object.freeze({
    schema: packet.freezeEvaluationContract.rowSchema,
    evaluationId,
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    protocol,
    preflight,
    implementationFreezeCommit: authority.implementationFreezeCommit,
    launchHead: authority.launchHead,
    launchBranch: authority.launchBranch,
    anchorPaths,
    artifacts,
    parserRuntimeArtifacts,
    artifactFailure,
    invokedCheckIds,
    verdict: "pass",
    reasons,
  });
}

export function parsePhase10C0VS6FreezeEvaluationBytes(
  bytes: Uint8Array,
  packet: Pick<
    Phase10C0VS6PacketProtocol,
    "packetId" | "registeredAttemptId" | "freezeEvaluationContract" | "terminalCandidateContract"
  >,
  authority: Phase10C0VS6FreezeEvaluationAuthority,
): Phase10C0VS6FreezeEvaluationReceipt {
  return parsePhase10C0VS6FreezeEvaluationReceipt(
    phase10C0VS6ParsePrettyJson(bytes, `${packet.packetId} freeze evaluation bytes`),
    packet,
    authority,
  );
}

export function writePhase10C0VS6FreezeEvaluationReceipt(
  value: unknown,
  packet: Pick<
    Phase10C0VS6PacketProtocol,
    "packetId" | "registeredAttemptId" | "freezeEvaluationContract" | "terminalCandidateContract"
  >,
  authority: Phase10C0VS6FreezeEvaluationAuthority,
): Uint8Array {
  return phase10C0VS6PrettyJsonBytes(parsePhase10C0VS6FreezeEvaluationReceipt(value, packet, authority));
}

export interface Phase10C0VS6TerminalDecisionEvidence {
  readonly evidenceRole: "freeze-evaluation" | "cause-evaluation";
  readonly artifact: Phase10C0VS6ArtifactIdentity;
}

export interface Phase10C0VS6TerminalDecision {
  readonly decisionId: string;
  readonly evaluatorCallableId: string;
  readonly invokedCheckIds: readonly string[];
  readonly verdict: "pass" | "fail";
  readonly reasons: readonly string[];
  readonly evidence: readonly Phase10C0VS6TerminalDecisionEvidence[];
}

export interface Phase10C0VS6CallerResultSourceIdentity {
  readonly artifactRole: string;
  readonly artifact: Phase10C0VS6ArtifactIdentity;
}

export interface Phase10C0VS6CallerInvocationResult {
  readonly callerInvocationId: string;
  readonly stage: "pre-candidate" | "post-candidate";
  readonly callerCallableId: string;
  readonly evaluatorCallableId: string;
  readonly terminalState: "complete" | "child-registered-cap";
  readonly executedCheckIds: readonly string[];
  readonly evaluatedCheckIds: readonly string[];
  readonly executedNegativeControlIds: readonly string[];
  readonly evaluatorResult: StrictJson;
  readonly sourceArtifactIdentities: readonly Phase10C0VS6CallerResultSourceIdentity[];
}

function parseCallerInvocationResults(
  value: unknown,
  packet: Pick<Phase10C0VS6PacketProtocol, "terminalReceiptContract">,
  selectedSubrouteId: string,
  stage: "pre-candidate" | "all",
  authority: readonly Phase10C0VS6CallerInvocationResult[],
  label: string,
): readonly Phase10C0VS6CallerInvocationResult[] {
  const rosters = packet.terminalReceiptContract.callerInvocationResultRosters.filter(
    (entry) => entry.subrouteId === selectedSubrouteId,
  );
  if (rosters.length !== 1) fail(`${label} selected subroute has no exact caller-result roster`);
  const expected = rosters[0]!.callerInvocationResults.filter(
    (entry) => stage === "all" || entry.stage === "pre-candidate",
  );
  if (!Array.isArray(value) || value.length !== expected.length || authority.length !== expected.length) {
    fail(`${label} caller-result count differs from exact selected-subroute authority`);
  }
  const results = value.map((entry, index): Phase10C0VS6CallerInvocationResult => {
    const resultLabel = `${label}[${index}]`;
    const row = phase10C0VS6Object(entry, resultLabel);
    phase10C0VS6ExactOrderedKeys(
      row,
      packet.terminalReceiptContract.callerInvocationResultExactFields,
      resultLabel,
    );
    const expectedRow = expected[index]!;
    if (row.callerInvocationId !== expectedRow.callerInvocationId || row.stage !== expectedRow.stage ||
      row.callerCallableId !== expectedRow.callerCallableId ||
      row.evaluatorCallableId !== expectedRow.evaluatorCallableId ||
      row.terminalState !== expectedRow.terminalState) {
      fail(`${resultLabel} identity/stage/callable/state differs from protocol authority`);
    }
    const executedCheckIds = phase10C0VS6SortedUniqueStrings(
      row.executedCheckIds,
      `${resultLabel}.executedCheckIds`,
    );
    const evaluatedCheckIds = phase10C0VS6SortedUniqueStrings(
      row.evaluatedCheckIds,
      `${resultLabel}.evaluatedCheckIds`,
    );
    const executedNegativeControlIds = phase10C0VS6SortedUniqueStrings(
      row.executedNegativeControlIds,
      `${resultLabel}.executedNegativeControlIds`,
    );
    exactStringRoster(executedCheckIds, expectedRow.executedCheckIds, `${resultLabel}.executedCheckIds`);
    exactStringRoster(evaluatedCheckIds, expectedRow.evaluatedCheckIds, `${resultLabel}.evaluatedCheckIds`);
    exactStringRoster(
      executedNegativeControlIds,
      expectedRow.executedNegativeControlIds,
      `${resultLabel}.executedNegativeControlIds`,
    );
    const evaluatorResult = strictJsonSnapshot(row.evaluatorResult);
    if ((expectedRow.terminalState === "complete") !== (evaluatorResult !== null) ||
      (expectedRow.evaluatorResultRule === "canonical-rerun-exact") !== (evaluatorResult !== null)) {
      fail(`${resultLabel}.evaluatorResult nullability differs from caller terminal state`);
    }
    if (!Array.isArray(row.sourceArtifactIdentities) ||
      row.sourceArtifactIdentities.length !== expectedRow.sourceArtifactAuthorities.length) {
      fail(`${resultLabel}.sourceArtifactIdentities differs from exact source roster`);
    }
    const sourceArtifactIdentities = row.sourceArtifactIdentities.map((source, sourceIndex) => {
      const sourceLabel = `${resultLabel}.sourceArtifactIdentities[${sourceIndex}]`;
      const sourceRow = phase10C0VS6Object(source, sourceLabel);
      phase10C0VS6ExactOrderedKeys(
        sourceRow,
        packet.terminalReceiptContract.callerResultSourceIdentityExactFields,
        sourceLabel,
      );
      const expectedSource = expectedRow.sourceArtifactAuthorities[sourceIndex]!;
      if (sourceRow.artifactRole !== expectedSource.artifactRole) {
        fail(`${sourceLabel}.artifactRole differs from protocol authority`);
      }
      return Object.freeze({
        artifactRole: expectedSource.artifactRole,
        artifact: parsePhase10C0VS6ArtifactIdentity(sourceRow.artifact, `${sourceLabel}.artifact`),
      });
    });
    const parsed = Object.freeze({
      callerInvocationId: expectedRow.callerInvocationId,
      stage: expectedRow.stage,
      callerCallableId: expectedRow.callerCallableId,
      evaluatorCallableId: expectedRow.evaluatorCallableId,
      terminalState: expectedRow.terminalState,
      executedCheckIds,
      evaluatedCheckIds,
      executedNegativeControlIds,
      evaluatorResult,
      sourceArtifactIdentities: Object.freeze(sourceArtifactIdentities),
    });
    phase10C0VS6SameJson(parsed, authority[index], `${resultLabel} independently rederived authority`);
    return parsed;
  });
  return Object.freeze(results);
}

export interface Phase10C0VS6TerminalCandidate {
  readonly schema: "phase10-c0v-terminal-candidate-v1";
  readonly packetId: Phase10C0VS6PacketProtocol["packetId"];
  readonly attemptId: string;
  readonly selectedSubrouteId: string;
  readonly dispositionCode: Phase10C0VS6DispositionCode | null;
  readonly preflight: Phase10C0VS6ArtifactIdentity;
  readonly exitStatus: Phase10C0VS6ArtifactIdentity;
  readonly producedOutputIds: readonly string[];
  readonly executedCheckIds: readonly string[];
  readonly executedNegativeControlIds: readonly string[];
  readonly callerInvocationResults: readonly Phase10C0VS6CallerInvocationResult[];
  readonly freezeDecision: Phase10C0VS6TerminalDecision | null;
  readonly causeDecision: Phase10C0VS6TerminalDecision | null;
  readonly verdict: "accepted-route-candidate";
  readonly reasons: readonly string[];
}

export interface Phase10C0VS6TerminalDecisionResultAuthority {
  readonly decisionRole: "freeze" | "cause";
  readonly evidence: Phase10C0VS6ArtifactIdentity;
  readonly verdict: "pass" | "fail";
  readonly reasons: readonly string[];
}

export interface Phase10C0VS6TerminalCandidateAuthority {
  readonly selectedSubrouteId: string;
  readonly attemptDirectory: string;
  readonly preflight: Phase10C0VS6ArtifactIdentity;
  readonly exitStatus: Phase10C0VS6ArtifactIdentity;
  readonly decisionResults: readonly Phase10C0VS6TerminalDecisionResultAuthority[];
  readonly callerInvocationResults: readonly Phase10C0VS6CallerInvocationResult[];
}

function parseTerminalDecision(
  value: unknown,
  fieldName: "freezeDecision" | "causeDecision",
  packet: Pick<Phase10C0VS6PacketProtocol, "terminalCandidateContract">,
  expected: Phase10C0VS6PacketProtocol["terminalCandidateContract"]["decisionRosters"][number]["decisions"][number],
  authority: Phase10C0VS6TerminalDecisionResultAuthority,
  attemptDirectory: string,
): Phase10C0VS6TerminalDecision {
  const label = `terminal candidate ${fieldName}`;
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, packet.terminalCandidateContract.decisionExactFields, label);
  if (row.decisionId !== expected.decisionId || row.evaluatorCallableId !== expected.evaluatorCallableId ||
    row.verdict !== expected.expectedVerdict || row.verdict !== authority.verdict) {
    fail(`${label} identity/callable/verdict differs from protocol and evaluator authority`);
  }
  const invokedCheckIds = phase10C0VS6SortedUniqueStrings(row.invokedCheckIds, `${label}.invokedCheckIds`);
  exactStringRoster(invokedCheckIds, expected.invokedCheckIds, `${label}.invokedCheckIds`);
  const reasons = phase10C0VS6SortedUniqueStrings(row.reasons, `${label}.reasons`);
  exactStringRoster(reasons, authority.reasons, `${label}.reasons`);
  if ((authority.verdict === "pass") !== (reasons.length === 0)) {
    fail(`${label} verdict/reasons differ from a canonical evaluator decision`);
  }
  if (!Array.isArray(row.evidence) || row.evidence.length !== expected.evidence.length ||
    expected.evidence.length !== 1) fail(`${label}.evidence differs from exact single-result authority`);
  const evidence = row.evidence.map((entry, index) => {
    const evidenceLabel = `${label}.evidence[${index}]`;
    const evidenceRow = phase10C0VS6Object(entry, evidenceLabel);
    phase10C0VS6ExactOrderedKeys(
      evidenceRow,
      packet.terminalCandidateContract.decisionEvidenceExactFields,
      evidenceLabel,
    );
    const expectedEvidence = expected.evidence[index]!;
    const evidenceRole = evidenceRow.evidenceRole === "freeze-evaluation" ||
      evidenceRow.evidenceRole === "cause-evaluation"
      ? evidenceRow.evidenceRole
      : fail(`${evidenceLabel}.evidenceRole differs from exact enum`);
    if (evidenceRole !== expectedEvidence.evidenceRole || authority.decisionRole !== expected.decisionRole ||
      evidenceRole !== `${authority.decisionRole}-evaluation`) {
      fail(`${evidenceLabel}.evidenceRole differs from decision authority`);
    }
    const artifact = parsePhase10C0VS6ArtifactIdentity(evidenceRow.artifact, `${evidenceLabel}.artifact`);
    if (artifact.path !== `${attemptDirectory}/${expectedEvidence.artifactRelativePath}`) {
      fail(`${evidenceLabel}.artifact path differs from exact attempt-local decision result`);
    }
    phase10C0VS6SameIdentity(artifact, authority.evidence, `${evidenceLabel}.artifact evaluator bytes`);
    return Object.freeze({ evidenceRole, artifact });
  });
  return Object.freeze({
    decisionId: expected.decisionId,
    evaluatorCallableId: expected.evaluatorCallableId,
    invokedCheckIds,
    verdict: authority.verdict,
    reasons,
    evidence: Object.freeze(evidence),
  });
}

/** Strict, acyclic pre-census/pre-resource terminal-candidate codec. */
export function parsePhase10C0VS6TerminalCandidate(
  value: unknown,
  packet: Pick<
    Phase10C0VS6PacketProtocol,
    "packetId" | "registeredAttemptId" | "terminalSubroutes" | "terminalCandidateContract" |
    "terminalReceiptContract"
  >,
  authority: Phase10C0VS6TerminalCandidateAuthority,
): Phase10C0VS6TerminalCandidate {
  const label = `${packet.packetId} terminal candidate`;
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, packet.terminalCandidateContract.exactFields, label);
  if (row.schema !== packet.terminalCandidateContract.rowSchema || row.packetId !== packet.packetId ||
    row.attemptId !== packet.registeredAttemptId || row.selectedSubrouteId !== authority.selectedSubrouteId) {
    fail(`${label} schema/packet/attempt/subroute differs from independently selected authority`);
  }
  const rosters = packet.terminalCandidateContract.decisionRosters.filter(
    (entry) => entry.subrouteId === authority.selectedSubrouteId,
  );
  const subroutes = packet.terminalSubroutes.filter((entry) => entry.subrouteId === authority.selectedSubrouteId);
  if (rosters.length !== 1 || subroutes.length !== 1) fail(`${label} subroute does not resolve exactly once`);
  const roster = rosters[0]!;
  const subroute = subroutes[0]!;
  const dispositionCode = row.dispositionCode === null
    ? null
    : row.dispositionCode === "production-complete" || row.dispositionCode === "preproduction-artifact-refusal" ||
      row.dispositionCode === "prelaunch-resource-refusal" ||
      row.dispositionCode === "registered-cap-resource-refusal" ||
      row.dispositionCode === "reference-discrepancy-refusal" ||
      row.dispositionCode === "preimplementation-reference-refusal"
      ? row.dispositionCode
      : fail(`${label}.dispositionCode differs from exact enum`);
  if (dispositionCode !== subroute.dispositionCode) fail(`${label}.dispositionCode differs from selected subroute`);
  const preflight = parsePhase10C0VS6ArtifactIdentity(row.preflight, `${label}.preflight`);
  const exitStatus = parsePhase10C0VS6ArtifactIdentity(row.exitStatus, `${label}.exitStatus`);
  phase10C0VS6SameIdentity(preflight, authority.preflight, `${label}.preflight`);
  phase10C0VS6SameIdentity(exitStatus, authority.exitStatus, `${label}.exitStatus`);
  const producedOutputIds = phase10C0VS6SortedUniqueStrings(row.producedOutputIds, `${label}.producedOutputIds`);
  const executedCheckIds = phase10C0VS6SortedUniqueStrings(row.executedCheckIds, `${label}.executedCheckIds`);
  const executedNegativeControlIds = phase10C0VS6SortedUniqueStrings(
    row.executedNegativeControlIds,
    `${label}.executedNegativeControlIds`,
  );
  const reasons = phase10C0VS6SortedUniqueStrings(row.reasons, `${label}.reasons`);
  exactStringRoster(producedOutputIds, roster.candidateProducedOutputIds, `${label}.producedOutputIds`);
  exactStringRoster(executedCheckIds, roster.candidateExecutedCheckIds, `${label}.executedCheckIds`);
  exactStringRoster(
    executedNegativeControlIds,
    roster.candidateExecutedNegativeControlIds,
    `${label}.executedNegativeControlIds`,
  );
  const callerInvocationResults = parseCallerInvocationResults(
    row.callerInvocationResults,
    packet,
    authority.selectedSubrouteId,
    "pre-candidate",
    authority.callerInvocationResults,
    `${label}.callerInvocationResults`,
  );
  exactStringRoster(
    callerInvocationResults.map((entry) => entry.callerInvocationId),
    roster.candidateCallerInvocationIds,
    `${label}.callerInvocationResults IDs`,
  );
  exactStringRoster(reasons, roster.candidateReasonCodes, `${label}.reasons`);
  if (row.verdict !== roster.candidateVerdict) fail(`${label}.verdict differs from selected subroute`);
  if (authority.decisionResults.length !== roster.decisions.length ||
    authority.decisionResults.some((entry, index) => entry.decisionRole !== roster.decisions[index]!.decisionRole)) {
    fail(`${label} evaluator-result authority differs from exact decision-role order`);
  }
  const parsedDecisions = new Map<"freeze" | "cause", Phase10C0VS6TerminalDecision>();
  for (const [index, expectedDecision] of roster.decisions.entries()) {
    const fieldName = expectedDecision.fieldName;
    parsedDecisions.set(expectedDecision.decisionRole, parseTerminalDecision(
      row[fieldName],
      fieldName,
      packet,
      expectedDecision,
      authority.decisionResults[index]!,
      authority.attemptDirectory,
    ));
  }
  for (const [fieldName, role] of [
    ["freezeDecision", "freeze"],
    ["causeDecision", "cause"],
  ] as const) {
    if ((row[fieldName] === null) !== !parsedDecisions.has(role)) {
      fail(`${label}.${fieldName} nullability differs from selected subroute authority`);
    }
  }
  return Object.freeze({
    schema: packet.terminalCandidateContract.rowSchema,
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    selectedSubrouteId: authority.selectedSubrouteId,
    dispositionCode,
    preflight,
    exitStatus,
    producedOutputIds,
    executedCheckIds,
    executedNegativeControlIds,
    callerInvocationResults,
    freezeDecision: parsedDecisions.get("freeze") ?? null,
    causeDecision: parsedDecisions.get("cause") ?? null,
    verdict: roster.candidateVerdict,
    reasons,
  });
}

export function parsePhase10C0VS6TerminalCandidateBytes(
  bytes: Uint8Array,
  packet: Pick<
    Phase10C0VS6PacketProtocol,
    "packetId" | "registeredAttemptId" | "terminalSubroutes" | "terminalCandidateContract" |
    "terminalReceiptContract"
  >,
  authority: Phase10C0VS6TerminalCandidateAuthority,
): Phase10C0VS6TerminalCandidate {
  return parsePhase10C0VS6TerminalCandidate(
    phase10C0VS6ParsePrettyJson(bytes, `${packet.packetId} terminal-candidate bytes`),
    packet,
    authority,
  );
}

export function writePhase10C0VS6TerminalCandidate(
  value: unknown,
  packet: Pick<
    Phase10C0VS6PacketProtocol,
    "packetId" | "registeredAttemptId" | "terminalSubroutes" | "terminalCandidateContract" |
    "terminalReceiptContract"
  >,
  authority: Phase10C0VS6TerminalCandidateAuthority,
): Uint8Array {
  return phase10C0VS6PrettyJsonBytes(parsePhase10C0VS6TerminalCandidate(value, packet, authority));
}

export interface Phase10C0VS6CauseObservation {
  readonly conditionId: string;
  readonly kind: Phase10C0VS6PacketProtocol["classificationConditions"][number]["kind"];
  readonly comparator: Phase10C0VS6PacketProtocol["classificationConditions"][number]["comparator"];
  readonly registeredValue: string | boolean | number | null;
  readonly observedValue: string | boolean | number | null;
  readonly unit: Phase10C0VS6PacketProtocol["classificationConditions"][number]["unit"];
  readonly routeConditionMatched: boolean;
  readonly preconditionPassed: boolean;
  readonly evidenceIds: readonly string[];
}

export interface Phase10C0VS6CauseEvidence {
  readonly evidenceId: string;
  readonly evidenceRole: Phase10C0VS6PacketProtocol["classificationProjectionRosters"][number]["evidence"][number]["evidenceRole"];
  readonly retentionClass: Phase10C0VS6PacketProtocol["classificationProjectionRosters"][number]["evidence"][number]["retentionClass"];
  readonly artifact: Phase10C0VS6ArtifactIdentity | null;
  readonly inlineObservationPath: string | null;
}

export interface Phase10C0VS6CauseEvaluationReceipt {
  readonly schema: "phase10-c0v-s6-cause-evaluation-v1";
  readonly evaluationId: string;
  readonly packetId: Phase10C0VS6PacketProtocol["packetId"];
  readonly attemptId: string;
  readonly selectedSubrouteId: string;
  readonly dispositionCode: Phase10C0VS6DispositionCode | null;
  readonly protocol: Phase10C0VS6ArtifactIdentity;
  readonly preflight: Phase10C0VS6ArtifactIdentity;
  readonly exitStatus: Phase10C0VS6ArtifactIdentity;
  readonly workerInvocations: Phase10C0VS6ArtifactIdentity | null;
  readonly classificationConditionIds: readonly string[];
  readonly observations: readonly Phase10C0VS6CauseObservation[];
  readonly evidence: readonly Phase10C0VS6CauseEvidence[];
  readonly evaluatorCallableId: string;
  readonly invokedCheckIds: readonly string[];
  readonly verdict: "pass" | "fail";
  readonly reasons: readonly string[];
}

export interface Phase10C0VS6CauseEvaluationAuthority {
  readonly selectedSubrouteId: string;
  readonly attemptDirectory: string;
  readonly protocol: Phase10C0VS6ArtifactIdentity;
  readonly preflight: Phase10C0VS6ArtifactIdentity;
  readonly exitStatus: Phase10C0VS6ArtifactIdentity;
  readonly workerProcessInvocationCount: 0 | 1;
  readonly workerInvocations: Phase10C0VS6ArtifactIdentity | null;
  readonly observations: readonly Phase10C0VS6CauseObservation[];
  readonly evidence: readonly Phase10C0VS6CauseEvidence[];
  readonly verdict: "pass" | "fail";
  readonly reasons: readonly string[];
}

function causeScalar(value: StrictJson, label: string): string | boolean | number | null {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0)) return value;
  fail(`${label} must be a finite JSON scalar without negative zero`);
}

function orderedSafeTokenRoster(value: unknown, label: string, allowEmpty = true): readonly string[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    fail(`${label} must be ${allowEmpty ? "an" : "a nonempty"} array`);
  }
  const result = value.map((entry, index) => phase10C0VS6SafeToken(entry, `${label}[${index}]`));
  if (new Set(result).size !== result.length) fail(`${label} must not contain duplicates`);
  return Object.freeze(result);
}

function parseCauseObservation(
  value: unknown,
  packet: Pick<Phase10C0VS6PacketProtocol, "classificationConditions" | "causeEvaluationContract">,
  expectedConditionId: string,
  label: string,
): Phase10C0VS6CauseObservation {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, packet.causeEvaluationContract.observationExactFields, label);
  if (row.conditionId !== expectedConditionId) fail(`${label}.conditionId differs from selected subroute order`);
  const conditions = packet.classificationConditions.filter((entry) => entry.conditionId === expectedConditionId);
  if (conditions.length !== 1) fail(`${label}.conditionId does not resolve exact packet authority`);
  const condition = conditions[0]!;
  if (row.kind !== condition.kind || row.comparator !== condition.comparator ||
    row.registeredValue !== condition.registeredValue || row.unit !== condition.unit) {
    fail(`${label} registered operands differ from the exact packet condition`);
  }
  const routeConditionMatched = phase10C0VS6Boolean(
    row.routeConditionMatched,
    `${label}.routeConditionMatched`,
  );
  const preconditionPassed = phase10C0VS6Boolean(row.preconditionPassed, `${label}.preconditionPassed`);
  return Object.freeze({
    conditionId: expectedConditionId,
    kind: condition.kind,
    comparator: condition.comparator,
    registeredValue: causeScalar(row.registeredValue, `${label}.registeredValue`),
    observedValue: causeScalar(row.observedValue, `${label}.observedValue`),
    unit: condition.unit,
    routeConditionMatched,
    preconditionPassed,
    evidenceIds: phase10C0VS6SortedUniqueStrings(row.evidenceIds, `${label}.evidenceIds`),
  });
}

function parseCauseEvidence(
  value: unknown,
  packet: Pick<Phase10C0VS6PacketProtocol, "causeEvaluationContract">,
  causeEvaluationPath: string,
  label: string,
): Phase10C0VS6CauseEvidence {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, packet.causeEvaluationContract.evidenceExactFields, label);
  const retentionClass = row.retentionClass === "tracked-authority" ||
    row.retentionClass === "tracked-evidence" ||
    row.retentionClass === "embedded-preflight-observation" ||
    row.retentionClass === "embedded-attempt-record" ||
    row.retentionClass === "embedded-terminal-record" ||
    row.retentionClass === "ignored-staging-corroboration"
    ? row.retentionClass
    : fail(`${label}.retentionClass differs from exact enum`);
  const evidenceRole = row.evidenceRole === "packet-protocol" || row.evidenceRole === "science-protocol" ||
    row.evidenceRole === "reference-or-refusal" || row.evidenceRole === "preflight-receipt" ||
    row.evidenceRole === "exit-record" || row.evidenceRole === "classification-input"
    ? row.evidenceRole
    : fail(`${label}.evidenceRole differs from exact enum`);
  const artifact = row.artifact === null
    ? null
    : parsePhase10C0VS6ArtifactIdentity(row.artifact, `${label}.artifact`);
  const inlineObservationPath = row.inlineObservationPath === null
    ? null
    : phase10C0VS6String(row.inlineObservationPath, `${label}.inlineObservationPath`);
  const embedded = retentionClass === "embedded-preflight-observation" ||
    retentionClass === "embedded-attempt-record" ||
    retentionClass === "embedded-terminal-record";
  if (embedded !== (artifact === null) || embedded !== (inlineObservationPath !== null)) {
    fail(`${label} artifact/inline nullability differs from retention class`);
  }
  if (artifact?.path === causeEvaluationPath) fail(`${label} may not contain its own unresolved identity`);
  return Object.freeze({
    evidenceId: phase10C0VS6SafeToken(row.evidenceId, `${label}.evidenceId`),
    evidenceRole,
    retentionClass,
    artifact,
    inlineObservationPath,
  });
}

/**
 * Strict cause-evaluation codec. `authority` must be a fresh, independently derived projection
 * from raw preflight/artifact/timing/progress/exit/control bytes; this function refuses any
 * producer-selected route, condition, evidence, or verdict that differs from that projection.
 */
export function parsePhase10C0VS6CauseEvaluationReceipt(
  value: unknown,
  packet: Pick<
    Phase10C0VS6PacketProtocol,
    "packetId" | "registeredAttemptId" | "terminalSubroutes" | "classificationConditions" |
    "causeEvaluationContract" | "terminalCandidateContract" | "workerInvocationContract"
  >,
  authority: Phase10C0VS6CauseEvaluationAuthority,
): Phase10C0VS6CauseEvaluationReceipt {
  const label = `${packet.packetId} cause evaluation`;
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, packet.causeEvaluationContract.exactFields, label);
  const subroutes = packet.terminalSubroutes.filter((entry) => entry.subrouteId === authority.selectedSubrouteId);
  const decisionRosters = packet.terminalCandidateContract.decisionRosters.filter(
    (entry) => entry.subrouteId === authority.selectedSubrouteId,
  );
  if (subroutes.length !== 1 || decisionRosters.length !== 1) fail(`${label} subroute does not resolve exactly once`);
  const subroute = subroutes[0]!;
  const causeDecisions = decisionRosters[0]!.decisions.filter((entry) => entry.decisionRole === "cause");
  if (causeDecisions.length !== 1) fail(`${label} selected subroute has no exact cause evaluator authority`);
  const causeDecision = causeDecisions[0]!;
  const evaluationId = `cause-${packet.packetId}-${packet.registeredAttemptId}-${authority.selectedSubrouteId}-v1`;
  if (row.schema !== packet.causeEvaluationContract.rowSchema || row.evaluationId !== evaluationId ||
    row.packetId !== packet.packetId || row.attemptId !== packet.registeredAttemptId ||
    row.selectedSubrouteId !== authority.selectedSubrouteId || row.dispositionCode !== subroute.dispositionCode) {
    fail(`${label} schema/evaluation/packet/attempt/subroute/disposition differs from authority`);
  }
  const protocol = parsePhase10C0VS6ArtifactIdentity(row.protocol, `${label}.protocol`);
  const preflight = parsePhase10C0VS6ArtifactIdentity(row.preflight, `${label}.preflight`);
  const exitStatus = parsePhase10C0VS6ArtifactIdentity(row.exitStatus, `${label}.exitStatus`);
  const workerInvocations = row.workerInvocations === null
    ? null
    : parsePhase10C0VS6ArtifactIdentity(row.workerInvocations, `${label}.workerInvocations`);
  phase10C0VS6SameIdentity(protocol, authority.protocol, `${label}.protocol`);
  phase10C0VS6SameIdentity(preflight, authority.preflight, `${label}.preflight`);
  phase10C0VS6SameIdentity(exitStatus, authority.exitStatus, `${label}.exitStatus`);
  phase10C0VS6SameJson(workerInvocations, authority.workerInvocations, `${label}.workerInvocations`);
  if ((workerInvocations === null) !== (authority.workerProcessInvocationCount === 0)) {
    fail(`${label}.workerInvocations must be null exactly when raw exit records no worker process`);
  }
  if (workerInvocations !== null &&
    workerInvocations.path !== `${authority.attemptDirectory}/${packet.workerInvocationContract.filename}`) {
    fail(`${label}.workerInvocations path differs from the exact packet worker stream`);
  }
  for (const artifact of [exitStatus, workerInvocations]) {
    if (artifact !== null && !artifact.path.startsWith(`${authority.attemptDirectory}/`)) {
      fail(`${label} runtime evidence lies outside the exact attempt directory`);
    }
  }
  const classificationConditionIds = orderedSafeTokenRoster(
    row.classificationConditionIds,
    `${label}.classificationConditionIds`,
    false,
  );
  exactStringRoster(
    classificationConditionIds,
    subroute.classificationConditionIds,
    `${label}.classificationConditionIds`,
  );
  if (!Array.isArray(row.observations) || row.observations.length !== classificationConditionIds.length) {
    fail(`${label}.observations must cover the selected condition roster exactly`);
  }
  const observations = row.observations.map((entry, index) => parseCauseObservation(
    entry,
    packet,
    classificationConditionIds[index]!,
    `${label}.observations[${index}]`,
  ));
  if (!Array.isArray(row.evidence) || row.evidence.length === 0) fail(`${label}.evidence must not be empty`);
  const causeEvaluationPath = `${authority.attemptDirectory}/${packet.causeEvaluationContract.filename}`;
  const evidence = row.evidence.map((entry, index) =>
    parseCauseEvidence(entry, packet, causeEvaluationPath, `${label}.evidence[${index}]`));
  const evidenceIds = evidence.map((entry) => entry.evidenceId);
  const expectedEvidenceIds = [...new Set(evidenceIds)].sort(codePointCompare);
  if (evidenceIds.length !== expectedEvidenceIds.length ||
    evidenceIds.some((entry, index) => entry !== expectedEvidenceIds[index])) {
    fail(`${label}.evidence must be exact evidenceId code-point order`);
  }
  const evidenceIdSet = new Set(evidenceIds);
  if (observations.some((entry) => entry.evidenceIds.length === 0 ||
    entry.evidenceIds.some((evidenceId) => !evidenceIdSet.has(evidenceId)))) {
    fail(`${label}.observations contain unresolved evidence IDs`);
  }
  phase10C0VS6SameJson(observations, authority.observations, `${label}.observations authority`);
  phase10C0VS6SameJson(evidence, authority.evidence, `${label}.evidence authority`);
  if (row.evaluatorCallableId !== causeDecision.evaluatorCallableId ||
    row.verdict !== causeDecision.expectedVerdict || row.verdict !== authority.verdict) {
    fail(`${label} evaluator/verdict differs from exact subroute and independent authority`);
  }
  const invokedCheckIds = phase10C0VS6SortedUniqueStrings(row.invokedCheckIds, `${label}.invokedCheckIds`);
  exactStringRoster(invokedCheckIds, causeDecision.invokedCheckIds, `${label}.invokedCheckIds`);
  const reasons = phase10C0VS6SortedUniqueStrings(row.reasons, `${label}.reasons`);
  exactStringRoster(reasons, authority.reasons, `${label}.reasons`);
  if ((authority.verdict === "pass") !== (reasons.length === 0)) {
    fail(`${label} verdict/reasons differ from the independent evaluator`);
  }
  return Object.freeze({
    schema: packet.causeEvaluationContract.rowSchema,
    evaluationId,
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    selectedSubrouteId: authority.selectedSubrouteId,
    dispositionCode: subroute.dispositionCode,
    protocol,
    preflight,
    exitStatus,
    workerInvocations,
    classificationConditionIds,
    observations: Object.freeze(observations),
    evidence: Object.freeze(evidence),
    evaluatorCallableId: causeDecision.evaluatorCallableId,
    invokedCheckIds,
    verdict: authority.verdict,
    reasons,
  });
}

export function parsePhase10C0VS6CauseEvaluationBytes(
  bytes: Uint8Array,
  packet: Pick<
    Phase10C0VS6PacketProtocol,
    "packetId" | "registeredAttemptId" | "terminalSubroutes" | "classificationConditions" |
    "causeEvaluationContract" | "terminalCandidateContract" | "workerInvocationContract"
  >,
  authority: Phase10C0VS6CauseEvaluationAuthority,
): Phase10C0VS6CauseEvaluationReceipt {
  return parsePhase10C0VS6CauseEvaluationReceipt(
    phase10C0VS6ParsePrettyJson(bytes, `${packet.packetId} cause-evaluation bytes`),
    packet,
    authority,
  );
}

export function writePhase10C0VS6CauseEvaluationReceipt(
  value: unknown,
  packet: Pick<
    Phase10C0VS6PacketProtocol,
    "packetId" | "registeredAttemptId" | "terminalSubroutes" | "classificationConditions" |
    "causeEvaluationContract" | "terminalCandidateContract" | "workerInvocationContract"
  >,
  authority: Phase10C0VS6CauseEvaluationAuthority,
): Uint8Array {
  return phase10C0VS6PrettyJsonBytes(parsePhase10C0VS6CauseEvaluationReceipt(value, packet, authority));
}

export interface Phase10C0VS6PacketInvocationRecord {
  readonly invocationId: string;
  readonly callableId: string;
  readonly negativeControlId: string | null;
  readonly invocationClass: "packet-producer" | "packet-evaluator" | "packet-negative-control";
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly elapsedNanoseconds: number;
  readonly wallSeconds: number;
  readonly registeredWallSecondsMaximum: 14400;
  readonly terminalState: "complete" | "registered-cap";
}

export interface Phase10C0VS6TerminalRegisteredCap {
  readonly conditionId: string;
  readonly invocationId: string;
  readonly observedWallSeconds: number;
  readonly registeredWallSecondsMaximum: 300 | 14400;
  readonly unit: "seconds";
  readonly makerReturnRequired: boolean;
}

export interface Phase10C0VS6TerminalReceiptV2 {
  readonly schema: "phase10-c0v-s6-terminal-receipt-v2";
  readonly receiptId: string;
  readonly matrixId: typeof PHASE10_C0V_S6_MATRIX_ID;
  readonly protocolId: string;
  readonly registryId: string;
  readonly packetId: Phase10C0VS6PacketProtocol["packetId"];
  readonly attemptId: string;
  readonly terminalState:
    | "complete" | "scientific-pass" | "scientific-fail" | "scientific-refusal"
    | "registered-cap-resource-refusal";
  readonly dispositionCode: Phase10C0VS6DispositionCode | null;
  readonly preflight: Phase10C0VS6ArtifactIdentity;
  readonly terminalCandidate: Phase10C0VS6ArtifactIdentity;
  readonly attemptLedger: Phase10C0VS6ArtifactIdentity | null;
  readonly packetVerification: Phase10C0VS6ArtifactIdentity | null;
  readonly producedOutputIds: readonly string[];
  readonly executedCheckIds: readonly string[];
  readonly executedNegativeControlIds: readonly string[];
  readonly invocationRecords: readonly Phase10C0VS6PacketInvocationRecord[];
  readonly callerInvocationResults: readonly Phase10C0VS6CallerInvocationResult[];
  readonly registeredCap: Phase10C0VS6TerminalRegisteredCap | null;
  readonly acceptedPacketCredit: boolean;
  readonly dependencyValid: boolean;
  readonly verdict: "complete" | "refusal";
  readonly reasons: readonly string[];
}

export interface Phase10C0VS6TerminalReceiptAuthority {
  readonly selectedSubrouteId: string;
  readonly terminalState: Phase10C0VS6TerminalReceiptV2["terminalState"];
  readonly preflight: Phase10C0VS6ArtifactIdentity;
  readonly terminalCandidate: Phase10C0VS6ArtifactIdentity;
  readonly attemptLedger: Phase10C0VS6ArtifactIdentity | null;
  readonly packetVerification: Phase10C0VS6ArtifactIdentity | null;
  readonly invocationRecords: readonly Phase10C0VS6PacketInvocationRecord[];
  readonly callerInvocationResults: readonly Phase10C0VS6CallerInvocationResult[];
  readonly registeredCap: Phase10C0VS6TerminalRegisteredCap | null;
  readonly reasons: readonly string[];
}

function parsePacketInvocationRecord(
  value: unknown,
  label: string,
): Phase10C0VS6PacketInvocationRecord {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "invocationId", "callableId", "negativeControlId", "invocationClass", "startedAt",
    "finishedAt", "elapsedNanoseconds", "wallSeconds", "registeredWallSecondsMaximum", "terminalState",
  ], label);
  const invocationClass = row.invocationClass === "packet-producer" ||
    row.invocationClass === "packet-evaluator" || row.invocationClass === "packet-negative-control"
    ? row.invocationClass
    : fail(`${label}.invocationClass differs from exact enum`);
  const negativeControlId = row.negativeControlId === null
    ? null
    : phase10C0VS6SafeToken(row.negativeControlId, `${label}.negativeControlId`);
  if ((invocationClass === "packet-negative-control") !== (negativeControlId !== null)) {
    fail(`${label}.negativeControlId differs from invocation class`);
  }
  const startedAt = phase10C0VS6IsoInstant(row.startedAt, `${label}.startedAt`);
  const finishedAt = phase10C0VS6IsoInstant(row.finishedAt, `${label}.finishedAt`);
  const elapsedNanoseconds = phase10C0VS6NonnegativeSafeInteger(
    row.elapsedNanoseconds,
    `${label}.elapsedNanoseconds`,
  );
  const wallSeconds = phase10C0VS6NonnegativeNumber(row.wallSeconds, `${label}.wallSeconds`);
  if (Date.parse(finishedAt) < Date.parse(startedAt) ||
    wallSeconds !== elapsedNanoseconds / 1_000_000_000) {
    fail(`${label}.wallSeconds differs from parent-owned monotonic elapsed nanoseconds`);
  }
  if (row.registeredWallSecondsMaximum !== 14400) fail(`${label} has an unregistered wall cap`);
  const terminalState = row.terminalState === "complete" || row.terminalState === "registered-cap"
    ? row.terminalState
    : fail(`${label}.terminalState differs from exact enum`);
  if (terminalState === "registered-cap"
    ? elapsedNanoseconds <= 14_400_000_000_000
    : elapsedNanoseconds > 14_400_000_000_000) {
    fail(`${label}.terminalState disagrees with the strict over-cap boundary`);
  }
  return Object.freeze({
    invocationId: phase10C0VS6SafeToken(row.invocationId, `${label}.invocationId`),
    callableId: phase10C0VS6SafeToken(row.callableId, `${label}.callableId`),
    negativeControlId,
    invocationClass,
    startedAt,
    finishedAt,
    elapsedNanoseconds,
    wallSeconds,
    registeredWallSecondsMaximum: 14400,
    terminalState,
  });
}

function parseTerminalRegisteredCap(value: unknown, label: string): Phase10C0VS6TerminalRegisteredCap | null {
  if (value === null) return null;
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "conditionId", "invocationId", "observedWallSeconds", "registeredWallSecondsMaximum",
    "unit", "makerReturnRequired",
  ], label);
  const registeredWallSecondsMaximum = row.registeredWallSecondsMaximum === 300 ||
    row.registeredWallSecondsMaximum === 14400
    ? row.registeredWallSecondsMaximum
    : fail(`${label}.registeredWallSecondsMaximum differs from exact caps`);
  const observedWallSeconds = phase10C0VS6NonnegativeNumber(
    row.observedWallSeconds,
    `${label}.observedWallSeconds`,
  );
  if (observedWallSeconds <= registeredWallSecondsMaximum || row.unit !== "seconds") {
    fail(`${label} does not establish a strictly over-cap seconds observation`);
  }
  return Object.freeze({
    conditionId: phase10C0VS6SafeToken(row.conditionId, `${label}.conditionId`),
    invocationId: phase10C0VS6SafeToken(row.invocationId, `${label}.invocationId`),
    observedWallSeconds,
    registeredWallSecondsMaximum,
    unit: "seconds",
    makerReturnRequired: phase10C0VS6Boolean(row.makerReturnRequired, `${label}.makerReturnRequired`),
  });
}

function isProducePacket(packetId: Phase10C0VS6PacketProtocol["packetId"]): boolean {
  return packetId === "c0v-radial-produce" || packetId === "c0v-moving-produce" ||
    packetId === "c0v-static-produce";
}

/** Strict inner codec for the final one-way terminal-v2 receipt. */
export function parsePhase10C0VS6TerminalReceiptV2(
  value: unknown,
  packet: Pick<
    Phase10C0VS6PacketProtocol,
    "packetId" | "protocolId" | "registryId" | "registeredAttemptId" | "terminalSubroutes" |
    "terminalReceiptContract" | "verificationInvocationRoster" | "verificationRegisteredCapBindings"
  >,
  authority: Phase10C0VS6TerminalReceiptAuthority,
): Phase10C0VS6TerminalReceiptV2 {
  const label = `${packet.packetId} terminal-v2 receipt`;
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "schema", "receiptId", "matrixId", "protocolId", "registryId", "packetId", "attemptId",
    "terminalState", "dispositionCode", "preflight", "terminalCandidate", "attemptLedger",
    "packetVerification", "producedOutputIds", "executedCheckIds", "executedNegativeControlIds",
    "invocationRecords", "callerInvocationResults", "registeredCap", "acceptedPacketCredit",
    "dependencyValid", "verdict", "reasons",
  ], label);
  const receiptId = `phase10-${packet.packetId}-${packet.registeredAttemptId}-terminal-v2`;
  if (row.schema !== packet.terminalReceiptContract.receiptSchema || row.receiptId !== receiptId ||
    row.matrixId !== PHASE10_C0V_S6_MATRIX_ID || row.protocolId !== packet.protocolId ||
    row.registryId !== packet.registryId || row.packetId !== packet.packetId ||
    row.attemptId !== packet.registeredAttemptId || row.terminalState !== authority.terminalState) {
    fail(`${label} schema/receipt/matrix/protocol/registry/packet/attempt/state differs from authority`);
  }
  const subroutes = packet.terminalSubroutes.filter((entry) => entry.subrouteId === authority.selectedSubrouteId);
  if (subroutes.length !== 1) fail(`${label} selected subroute does not resolve exactly once`);
  const subroute = subroutes[0]!;
  if (row.dispositionCode !== subroute.dispositionCode) fail(`${label}.dispositionCode differs from subroute`);
  const preflight = parsePhase10C0VS6ArtifactIdentity(row.preflight, `${label}.preflight`);
  const terminalCandidate = parsePhase10C0VS6ArtifactIdentity(
    row.terminalCandidate,
    `${label}.terminalCandidate`,
  );
  const attemptLedger = row.attemptLedger === null
    ? null
    : parsePhase10C0VS6ArtifactIdentity(row.attemptLedger, `${label}.attemptLedger`);
  const packetVerification = row.packetVerification === null
    ? null
    : parsePhase10C0VS6ArtifactIdentity(row.packetVerification, `${label}.packetVerification`);
  phase10C0VS6SameIdentity(preflight, authority.preflight, `${label}.preflight`);
  phase10C0VS6SameIdentity(terminalCandidate, authority.terminalCandidate, `${label}.terminalCandidate`);
  phase10C0VS6SameJson(attemptLedger, authority.attemptLedger, `${label}.attemptLedger`);
  phase10C0VS6SameJson(packetVerification, authority.packetVerification, `${label}.packetVerification`);
  if ((attemptLedger !== null) !== isProducePacket(packet.packetId)) {
    fail(`${label}.attemptLedger nullability differs from produce/nonproduce authority`);
  }
  const producedOutputIds = phase10C0VS6SortedUniqueStrings(row.producedOutputIds, `${label}.producedOutputIds`);
  const executedCheckIds = phase10C0VS6SortedUniqueStrings(row.executedCheckIds, `${label}.executedCheckIds`);
  const executedNegativeControlIds = phase10C0VS6SortedUniqueStrings(
    row.executedNegativeControlIds,
    `${label}.executedNegativeControlIds`,
  );
  exactStringRoster(producedOutputIds, subroute.requiredOutputIds, `${label}.producedOutputIds`);
  exactStringRoster(executedCheckIds, subroute.requiredCheckIds, `${label}.executedCheckIds`);
  exactStringRoster(
    executedNegativeControlIds,
    subroute.requiredNegativeControlIds,
    `${label}.executedNegativeControlIds`,
  );
  if (!Array.isArray(row.invocationRecords)) fail(`${label}.invocationRecords must be an array`);
  const invocationRecords = row.invocationRecords.map((entry, index) =>
    parsePacketInvocationRecord(entry, `${label}.invocationRecords[${index}]`));
  phase10C0VS6SameJson(invocationRecords, authority.invocationRecords, `${label}.invocationRecords authority`);
  const callerInvocationResults = parseCallerInvocationResults(
    row.callerInvocationResults,
    packet,
    authority.selectedSubrouteId,
    "all",
    authority.callerInvocationResults,
    `${label}.callerInvocationResults`,
  );
  const registeredCap = parseTerminalRegisteredCap(row.registeredCap, `${label}.registeredCap`);
  phase10C0VS6SameJson(registeredCap, authority.registeredCap, `${label}.registeredCap authority`);
  if ((registeredCap !== null) !== (subroute.dispositionCode === "registered-cap-resource-refusal")) {
    fail(`${label}.registeredCap nullability differs from subroute disposition`);
  }
  if (isProducePacket(packet.packetId)) {
    if (invocationRecords.length !== 0) fail(`${label} produce timing must remain in the attempt ledger`);
  } else if (registeredCap === null) {
    if (invocationRecords.length !== 0) fail(`${label} non-cap terminal receipt may not duplicate verification timing`);
  } else {
    const bindings = packet.verificationRegisteredCapBindings.filter(
      (entry) => entry.conditionId === registeredCap.conditionId && entry.invocationId === registeredCap.invocationId,
    );
    const cappedIndex = packet.verificationInvocationRoster.findIndex(
      (entry) => entry.invocationId === registeredCap.invocationId,
    );
    if (bindings.length !== 1 || cappedIndex < 0 || invocationRecords.length !== cappedIndex + 1) {
      fail(`${label} nonproduce cap does not match one exact registered invocation prefix`);
    }
    for (const [index, actual] of invocationRecords.entries()) {
      const expected = packet.verificationInvocationRoster[index];
      if (expected === undefined || actual.invocationId !== expected.invocationId ||
        actual.callableId !== expected.callableId || actual.negativeControlId !== expected.negativeControlId ||
        actual.invocationClass !== expected.invocationClass ||
        actual.registeredWallSecondsMaximum !== expected.registeredWallSecondsMaximum ||
        actual.terminalState !== (index === cappedIndex ? "registered-cap" : "complete")) {
        fail(`${label}.invocationRecords[${index}] differs from exact registered cap prefix`);
      }
    }
    const capped = invocationRecords[cappedIndex]!;
    if (registeredCap.observedWallSeconds !== capped.wallSeconds ||
      registeredCap.registeredWallSecondsMaximum !== capped.registeredWallSecondsMaximum) {
      fail(`${label}.registeredCap differs from capped invocation timing`);
    }
  }
  const acceptedPacketCredit = phase10C0VS6Boolean(row.acceptedPacketCredit, `${label}.acceptedPacketCredit`);
  const dependencyValid = phase10C0VS6Boolean(row.dependencyValid, `${label}.dependencyValid`);
  if (acceptedPacketCredit !== dependencyValid || acceptedPacketCredit !== (packetVerification !== null)) {
    fail(`${label} packet credit/dependency/verification fields disagree`);
  }
  const requiredVerificationCredit = subroute.requiredOutputIds.some((outputId) => outputId.endsWith("-verification"));
  if (acceptedPacketCredit !== requiredVerificationCredit) {
    fail(`${label} packet credit differs from selected subroute verification authority`);
  }
  if (registeredCap !== null && registeredCap.makerReturnRequired !== (packet.packetId !== "c0v-radial-produce")) {
    fail(`${label}.registeredCap maker-return flag differs from packet/subroute authority`);
  }
  const verdict = row.verdict === "complete" || row.verdict === "refusal"
    ? row.verdict
    : fail(`${label}.verdict differs from exact enum`);
  const expectedVerdict = acceptedPacketCredit ? "complete" : "refusal";
  if (verdict !== expectedVerdict) fail(`${label}.verdict differs from subroute credit state`);
  const reasons = phase10C0VS6SortedUniqueStrings(row.reasons, `${label}.reasons`);
  exactStringRoster(reasons, authority.reasons, `${label}.reasons`);
  if ((verdict === "complete") !== (reasons.length === 0)) {
    fail(`${label} verdict/reasons are not a canonical completion or maker-return`);
  }
  return Object.freeze({
    schema: packet.terminalReceiptContract.receiptSchema,
    receiptId,
    matrixId: PHASE10_C0V_S6_MATRIX_ID,
    protocolId: packet.protocolId,
    registryId: packet.registryId,
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    terminalState: authority.terminalState,
    dispositionCode: subroute.dispositionCode,
    preflight,
    terminalCandidate,
    attemptLedger,
    packetVerification,
    producedOutputIds,
    executedCheckIds,
    executedNegativeControlIds,
    invocationRecords: Object.freeze(invocationRecords),
    callerInvocationResults,
    registeredCap,
    acceptedPacketCredit,
    dependencyValid,
    verdict,
    reasons,
  });
}

export function writePhase10C0VS6TerminalReceipt(
  value: unknown,
  packet: Pick<
    Phase10C0VS6PacketProtocol,
    "packetId" | "protocolId" | "registryId" | "registeredAttemptId" | "terminalSubroutes" |
    "terminalReceiptContract" | "verificationInvocationRoster" | "verificationRegisteredCapBindings"
  >,
  authority: Phase10C0VS6TerminalReceiptAuthority,
): Uint8Array {
  return phase10C0VS6PrettyJsonBytes(parsePhase10C0VS6TerminalReceiptV2(value, packet, authority));
}

export function parsePhase10C0VS6TerminalReceiptV2Bytes(
  bytes: Uint8Array,
  packet: Pick<
    Phase10C0VS6PacketProtocol,
    "packetId" | "protocolId" | "registryId" | "registeredAttemptId" | "terminalSubroutes" |
    "terminalReceiptContract" | "verificationInvocationRoster" | "verificationRegisteredCapBindings"
  >,
  authority: Phase10C0VS6TerminalReceiptAuthority,
): Phase10C0VS6TerminalReceiptV2 {
  return parsePhase10C0VS6TerminalReceiptV2(
    phase10C0VS6ParsePrettyJson(bytes, `${packet.packetId} terminal-v2 receipt bytes`),
    packet,
    authority,
  );
}

export interface Phase10C0VS6VerifiedArtifact {
  readonly outputId: string;
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10C0VS6PacketCheckResult {
  readonly checkId: string;
  readonly verdict: "pass" | "fail" | "refusal";
  readonly reasons: readonly string[];
  readonly witnessOutputIds: readonly string[];
}

export interface Phase10C0VS6MutationWitness {
  readonly artifactId: string;
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly semanticFingerprint: Readonly<{
    readonly projection: StrictJson;
    readonly sha256: string;
  }>;
}

export interface Phase10C0VS6NegativeControlResult {
  readonly negativeControlId: string;
  readonly mutationExecuted: boolean;
  readonly rejected: boolean;
  readonly beforeWitness: Phase10C0VS6MutationWitness;
  readonly afterWitness: Phase10C0VS6MutationWitness;
  readonly errors: readonly string[];
}

export interface Phase10C0VS6EvaluatorExecutionProvenance {
  readonly evaluatorCallableId: string;
  readonly modulePath: string;
  readonly exportName: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly runtime: string;
  readonly command: string;
  readonly gitHead: string;
  readonly startedOn: string;
  readonly endedOn: string;
  readonly processConcurrency: number;
}

export interface Phase10C0VS6PacketGovernedTiming {
  readonly source: "selected-attempt-row" | "packet-verification-worker";
  readonly selectedAttemptId: string | null;
  readonly attemptLedger: Phase10C0VS6ArtifactIdentity | null;
  readonly invocationRecords:
    | readonly Phase10C0VS6ExecutableInvocationRecord[]
    | readonly Phase10C0VS6PacketInvocationRecord[];
  readonly governedInvocationElapsedNanoseconds: number;
  readonly governedInvocationWallSeconds: number;
  readonly processHours: number;
}

export interface Phase10C0VS6PriorPacketVerificationAccounting {
  readonly packetId: string;
  readonly verification: Phase10C0VS6ArtifactIdentity;
  readonly governedInvocationElapsedNanoseconds: number;
  readonly processHours: number;
}

export interface Phase10C0VS6UnselectedAttemptAccounting {
  readonly packetId: string;
  readonly attemptLedger: Phase10C0VS6ArtifactIdentity;
  readonly attemptId: string;
  readonly dispositionCode: Phase10C0VS6DispositionCode;
  readonly governedInvocationElapsedNanoseconds: number;
  readonly processHours: number;
}

export interface Phase10C0VS6PackageProcessAccounting {
  readonly selectedPacketIds: readonly string[];
  readonly priorPacketVerifications: readonly Phase10C0VS6PriorPacketVerificationAccounting[];
  readonly unselectedAttemptRows: readonly Phase10C0VS6UnselectedAttemptAccounting[];
  readonly priorSelectedPacketElapsedNanoseconds: number;
  readonly unselectedAttemptElapsedNanoseconds: number;
  readonly currentPacketElapsedNanoseconds: number;
  readonly totalElapsedNanoseconds: number;
  readonly maximumElapsedNanoseconds: 86400000000000;
  readonly priorSelectedPacketProcessHours: number;
  readonly unselectedAttemptProcessHours: number;
  readonly currentPacketProcessHours: number;
  readonly totalProcessHours: number;
  readonly maximumProcessHours: 24;
  readonly duplicateAccountingVerdict: "pass";
  readonly omissionAccountingVerdict: "pass";
}

export interface Phase10C0VS6PublicationFinalizationProjection {
  readonly artifactRole: "packet-verification" | "terminal-receipt";
  readonly path: string;
  readonly stagingPath: string;
  readonly maximumByteLength: 524288 | 131072;
}

export interface Phase10C0VS6PacketResourceAccounting {
  readonly source: "selected-attempt-resource-record" | "append-only-attempt-root";
  readonly attemptId: string;
  readonly attemptLedger: Phase10C0VS6ArtifactIdentity | null;
  readonly attemptRoot: string;
  readonly attemptRootArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly attemptMaximumObservedConcurrentBytes: number;
  readonly attemptTerminalRetainedBytes: number;
  readonly materializedPublicationArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly materializedPublicationBytes: number;
  readonly publicationFinalizationProjections: readonly Phase10C0VS6PublicationFinalizationProjection[];
  readonly projectedFinalizationBytes: number;
  readonly projectedPacketRetainedBytes: number;
  readonly physicalPathUniquenessVerdict: "pass";
  readonly appendOnlyVerdict: "pass";
}

export interface Phase10C0VS6PriorPacketResourceAccounting {
  readonly packetId: string;
  readonly verification: Phase10C0VS6ArtifactIdentity;
  readonly terminalReceipt: Phase10C0VS6ArtifactIdentity;
  readonly attemptMaximumObservedConcurrentBytes: number;
  readonly finalizedPacketRetainedBytes: number;
}

export interface Phase10C0VS6PackageResourceAccounting {
  readonly selectedPacketIds: readonly string[];
  readonly priorPacketResources: readonly Phase10C0VS6PriorPacketResourceAccounting[];
  readonly packageStorageBaselineArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly packageStorageBaselineBytes: 1629577;
  readonly priorFinalizedPacketRetainedBytes: number;
  readonly currentProjectedPacketRetainedBytes: number;
  readonly totalPackageRetainedBytes: number;
  readonly maximumPackageRetainedBytes: 68719476736;
  readonly physicalPathDuplicateVerdict: "pass";
  readonly omissionAccountingVerdict: "pass";
  readonly storageLimitVerdict: "pass";
}

export interface Phase10C0VS6PacketVerificationV2 {
  readonly schema: "phase10-packet-verification-v2";
  readonly verificationId: string;
  readonly matrixId: typeof PHASE10_C0V_S6_MATRIX_ID;
  readonly protocolId: string;
  readonly registryId: string;
  readonly packetId: Phase10C0VS6PacketProtocol["packetId"];
  readonly terminalState: "complete";
  readonly verifiedArtifacts: readonly Phase10C0VS6VerifiedArtifact[];
  readonly checkResults: readonly Phase10C0VS6PacketCheckResult[];
  readonly executedNegativeControlIds: readonly string[];
  readonly negativeControlResults: readonly Phase10C0VS6NegativeControlResult[];
  readonly boundDependencyPacketIds: readonly string[];
  readonly execution: Phase10C0VS6EvaluatorExecutionProvenance | null;
  readonly callerInvocationResults: readonly Phase10C0VS6CallerInvocationResult[];
  readonly governedTiming: Phase10C0VS6PacketGovernedTiming;
  readonly packageProcessAccounting: Phase10C0VS6PackageProcessAccounting;
  readonly packetResourceAccounting: Phase10C0VS6PacketResourceAccounting;
  readonly packageResourceAccounting: Phase10C0VS6PackageResourceAccounting;
  readonly aggregateVerdict: "pass";
  readonly limits: readonly string[];
}

/**
 * Fully rederived semantic authority for the inner verification codec. Callers must obtain this
 * from the raw lifecycle/dependency verifier; constructing it beside candidate bytes grants no
 * packet or dependency credit.
 */
export interface Phase10C0VS6PacketVerificationV2Authority {
  readonly selectedSubrouteId: string;
  readonly verifiedArtifacts: readonly Phase10C0VS6VerifiedArtifact[];
  readonly checkResults: readonly Phase10C0VS6PacketCheckResult[];
  readonly executedNegativeControlIds: readonly string[];
  readonly negativeControlResults: readonly Phase10C0VS6NegativeControlResult[];
  readonly execution: Phase10C0VS6EvaluatorExecutionProvenance | null;
  readonly callerInvocationResults: readonly Phase10C0VS6CallerInvocationResult[];
  readonly governedTiming: Phase10C0VS6PacketGovernedTiming;
  readonly packageProcessAccounting: Phase10C0VS6PackageProcessAccounting;
  readonly packetResourceAccounting: Phase10C0VS6PacketResourceAccounting;
  readonly packageResourceAccounting: Phase10C0VS6PackageResourceAccounting;
}

const SHA256_LOWER = /^[0-9a-f]{64}$/u;
const GIT_HEAD = /^[0-9a-f]{40}$/u;
const PACKAGE_ELAPSED_NANOSECONDS_MAXIMUM = 86_400_000_000_000;
const PACKAGE_RETAINED_BYTES_MAXIMUM = 68_719_476_736;

function safePositiveInteger(value: unknown, label: string): number {
  const parsed = phase10C0VS6NonnegativeSafeInteger(value, label);
  if (parsed === 0) fail(`${label} must be positive`);
  return parsed;
}

function safeIntegerSum(values: readonly number[], label: string): number {
  const sum = values.reduce((total, value) => total + value, 0);
  if (!Number.isSafeInteger(sum)) fail(`${label} exceeds safe-integer accounting`);
  return sum;
}

function parseIdentityArray(
  value: unknown,
  label: string,
  allowEmpty: boolean,
): readonly Phase10C0VS6ArtifactIdentity[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    fail(`${label} must be ${allowEmpty ? "an" : "a nonempty"} array`);
  }
  const identities = value.map((entry, index) =>
    parsePhase10C0VS6ArtifactIdentity(entry, `${label}[${index}]`));
  const sorted = [...identities].sort((left, right) => codePointCompare(left.path, right.path));
  if (new Set(identities.map((entry) => entry.path)).size !== identities.length ||
    identities.some((entry, index) => entry.path !== sorted[index]!.path)) {
    fail(`${label} must be path-sorted and path-unique`);
  }
  return Object.freeze(identities);
}

function parseVerifiedArtifacts(value: unknown, label: string): readonly Phase10C0VS6VerifiedArtifact[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  const artifacts = value.map((entry, index) => {
    const artifactLabel = `${label}[${index}]`;
    const row = phase10C0VS6Object(entry, artifactLabel);
    phase10C0VS6ExactOrderedKeys(row, ["outputId", "path", "byteLength", "sha256"], artifactLabel);
    const identity = parsePhase10C0VS6ArtifactIdentity({
      path: row.path,
      byteLength: row.byteLength,
      sha256: row.sha256,
    }, artifactLabel);
    return Object.freeze({
      outputId: phase10C0VS6SafeToken(row.outputId, `${artifactLabel}.outputId`),
      ...identity,
    });
  });
  const outputIds = phase10C0VS6SortedUniqueStrings(
    artifacts.map((entry) => entry.outputId),
    `${label} output IDs`,
  );
  if (outputIds.some((entry, index) => entry !== artifacts[index]!.outputId) ||
    new Set(artifacts.map((entry) => entry.path)).size !== artifacts.length) {
    fail(`${label} must be output-ID-sorted with unique paths`);
  }
  return Object.freeze(artifacts);
}

function parsePacketCheckResults(value: unknown, label: string): readonly Phase10C0VS6PacketCheckResult[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  const results = value.map((entry, index) => {
    const resultLabel = `${label}[${index}]`;
    const row = phase10C0VS6Object(entry, resultLabel);
    phase10C0VS6ExactOrderedKeys(row, ["checkId", "verdict", "reasons", "witnessOutputIds"], resultLabel);
    const verdict = row.verdict === "pass" || row.verdict === "fail" || row.verdict === "refusal"
      ? row.verdict
      : fail(`${resultLabel}.verdict differs from exact enum`);
    const reasons = phase10C0VS6SortedUniqueStrings(row.reasons, `${resultLabel}.reasons`);
    if ((verdict === "pass") !== (reasons.length === 0)) {
      fail(`${resultLabel}.verdict must pass exactly when reasons is empty`);
    }
    return Object.freeze({
      checkId: phase10C0VS6SafeToken(row.checkId, `${resultLabel}.checkId`),
      verdict,
      reasons,
      witnessOutputIds: phase10C0VS6SortedUniqueStrings(
        row.witnessOutputIds,
        `${resultLabel}.witnessOutputIds`,
      ),
    });
  });
  const checkIds = phase10C0VS6SortedUniqueStrings(results.map((entry) => entry.checkId), `${label} IDs`);
  if (checkIds.some((entry, index) => entry !== results[index]!.checkId)) {
    fail(`${label} must be check-ID-sorted`);
  }
  return Object.freeze(results);
}

function parseMutationWitness(value: unknown, label: string): Phase10C0VS6MutationWitness {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(
    row,
    ["artifactId", "path", "byteLength", "sha256", "semanticFingerprint"],
    label,
  );
  const identity = parsePhase10C0VS6ArtifactIdentity({
    path: row.path,
    byteLength: row.byteLength,
    sha256: row.sha256,
  }, label);
  const fingerprintLabel = `${label}.semanticFingerprint`;
  const fingerprint = phase10C0VS6Object(row.semanticFingerprint, fingerprintLabel);
  phase10C0VS6ExactOrderedKeys(fingerprint, ["projection", "sha256"], fingerprintLabel);
  const projection = strictJsonSnapshot(fingerprint.projection);
  const sha256 = phase10C0VS6String(fingerprint.sha256, `${fingerprintLabel}.sha256`);
  if (!SHA256_LOWER.test(sha256) ||
    sha256 !== phase10C0VS6Sha256(new TextEncoder().encode(canonicalJson(projection)))) {
    fail(`${fingerprintLabel}.sha256 differs from canonical semantic projection bytes`);
  }
  return Object.freeze({
    artifactId: phase10C0VS6SafeToken(row.artifactId, `${label}.artifactId`),
    ...identity,
    semanticFingerprint: Object.freeze({ projection, sha256 }),
  });
}

function parseNegativeControlResults(
  value: unknown,
  label: string,
): readonly Phase10C0VS6NegativeControlResult[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  const results = value.map((entry, index) => {
    const resultLabel = `${label}[${index}]`;
    const row = phase10C0VS6Object(entry, resultLabel);
    phase10C0VS6ExactOrderedKeys(row, [
      "negativeControlId", "mutationExecuted", "rejected", "beforeWitness", "afterWitness", "errors",
    ], resultLabel);
    const beforeWitness = parseMutationWitness(row.beforeWitness, `${resultLabel}.beforeWitness`);
    const afterWitness = parseMutationWitness(row.afterWitness, `${resultLabel}.afterWitness`);
    const errors = phase10C0VS6SortedUniqueStrings(row.errors, `${resultLabel}.errors`);
    const mutationExecuted = phase10C0VS6Boolean(row.mutationExecuted, `${resultLabel}.mutationExecuted`);
    const rejected = phase10C0VS6Boolean(row.rejected, `${resultLabel}.rejected`);
    if (!mutationExecuted || !rejected || errors.length !== 0 ||
      beforeWitness.artifactId !== afterWitness.artifactId ||
      (beforeWitness.sha256 === afterWitness.sha256 &&
        beforeWitness.semanticFingerprint.sha256 === afterWitness.semanticFingerprint.sha256)) {
      fail(`${resultLabel} does not prove an executed, changed, independently rejected mutation`);
    }
    return Object.freeze({
      negativeControlId: phase10C0VS6SafeToken(
        row.negativeControlId,
        `${resultLabel}.negativeControlId`,
      ),
      mutationExecuted,
      rejected,
      beforeWitness,
      afterWitness,
      errors,
    });
  });
  const controlIds = phase10C0VS6SortedUniqueStrings(
    results.map((entry) => entry.negativeControlId),
    `${label} IDs`,
  );
  if (controlIds.some((entry, index) => entry !== results[index]!.negativeControlId)) {
    fail(`${label} must be negative-control-ID-sorted`);
  }
  return Object.freeze(results);
}

function parseEvaluatorExecution(
  value: unknown,
  label: string,
): Phase10C0VS6EvaluatorExecutionProvenance {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "evaluatorCallableId", "modulePath", "exportName", "byteLength", "sha256", "runtime",
    "command", "gitHead", "startedOn", "endedOn", "processConcurrency",
  ], label);
  const sha256 = phase10C0VS6String(row.sha256, `${label}.sha256`);
  const gitHead = phase10C0VS6String(row.gitHead, `${label}.gitHead`);
  const startedOn = phase10C0VS6IsoInstant(row.startedOn, `${label}.startedOn`);
  const endedOn = phase10C0VS6IsoInstant(row.endedOn, `${label}.endedOn`);
  if (!SHA256_LOWER.test(sha256) || !GIT_HEAD.test(gitHead) || Date.parse(endedOn) < Date.parse(startedOn)) {
    fail(`${label} hash/Git/timestamp provenance is malformed`);
  }
  const exportName = phase10C0VS6String(row.exportName, `${label}.exportName`);
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(exportName)) fail(`${label}.exportName is not a direct export name`);
  return Object.freeze({
    evaluatorCallableId: phase10C0VS6SafeToken(row.evaluatorCallableId, `${label}.evaluatorCallableId`),
    modulePath: phase10C0VS6SafeRelativePath(row.modulePath, `${label}.modulePath`),
    exportName,
    byteLength: safePositiveInteger(row.byteLength, `${label}.byteLength`),
    sha256,
    runtime: phase10C0VS6String(row.runtime, `${label}.runtime`),
    command: phase10C0VS6String(row.command, `${label}.command`),
    gitHead,
    startedOn,
    endedOn,
    processConcurrency: safePositiveInteger(row.processConcurrency, `${label}.processConcurrency`),
  });
}

/**
 * Strict syntax codec for the inherited evaluator-execution provenance row.  This deliberately
 * grants no evaluator credit: a raw packet verifier must still resolve the named callable from
 * the packet registry, reopen its exact implementation bytes, and join the runtime/command/HEAD
 * and interval to retained parent-owned authority.
 */
export function parsePhase10C0VS6EvaluatorExecutionProvenance(
  value: unknown,
  label = "evaluator execution provenance",
): Phase10C0VS6EvaluatorExecutionProvenance {
  return parseEvaluatorExecution(value, label);
}

const RADIAL_NORMAL_VERIFICATION_EXECUTION_SUBROUTES = Object.freeze([
  "radial-complete-fail",
  "radial-complete-pass",
] as const);

const RADIAL_NULL_VERIFICATION_EXECUTION_SUBROUTES = Object.freeze([
  "radial-artifact-refusal",
  "radial-cap-evaluator",
  "radial-cap-nc-finite-shell",
  "radial-cap-nc-forged-summary",
  "radial-cap-nc-robin",
  "radial-cap-production",
  "radial-prelaunch-refusal",
] as const);

/**
 * Resolves the protocol's exact route-aware verification execution nullability.  This predicate
 * validates the subroute and its verification authority rather than accepting a caller boolean.
 */
export function phase10C0VS6VerificationExecutionIsNull(
  packet: Phase10C0VS6PacketProtocol,
  selectedSubrouteId: string,
  label = `${packet.packetId} verification execution rule`,
): boolean {
  if (packet.verification.executionProvenanceRule !==
    "nonnull-completed-main-evaluator-for-normal-credit-route-null-exactly-radial-validated-refusal-no-verification-on-other-maker-return") {
    fail(`${label} protocol execution-provenance rule differs from frozen authority`);
  }
  const subroutes = packet.terminalSubroutes.filter((entry) => entry.subrouteId === selectedSubrouteId);
  if (subroutes.length !== 1) fail(`${label} selected subroute does not resolve exactly once`);
  if (!subroutes[0]!.requiredOutputIds.some((entry) => entry.endsWith("-verification"))) {
    fail(`${label} selected maker-return subroute has no verification authority`);
  }
  if (packet.packetId === "c0v-radial-produce") {
    const normal = RADIAL_NORMAL_VERIFICATION_EXECUTION_SUBROUTES.includes(
      selectedSubrouteId as (typeof RADIAL_NORMAL_VERIFICATION_EXECUTION_SUBROUTES)[number],
    );
    const validatedRefusal = RADIAL_NULL_VERIFICATION_EXECUTION_SUBROUTES.includes(
      selectedSubrouteId as (typeof RADIAL_NULL_VERIFICATION_EXECUTION_SUBROUTES)[number],
    );
    if (normal === validatedRefusal) {
      fail(`${label} radial subroute lacks one exact execution-provenance classification`);
    }
    return validatedRefusal;
  }
  return false;
}

/**
 * Applies the protocol's route-aware verification execution rule before any semantic provenance
 * join.  Radial validated refusals have structural/cap provenance but no truthful completed main
 * evaluator interval, so their exact value is null.  Every normal verification-bearing route
 * retains the inherited completed-evaluator row.
 */
export function parsePhase10C0VS6ContextualVerificationExecution(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
  selectedSubrouteId: string,
  label = `${packet.packetId} verification execution`,
): Phase10C0VS6EvaluatorExecutionProvenance | null {
  if (phase10C0VS6VerificationExecutionIsNull(packet, selectedSubrouteId, label)) {
    if (value !== null) fail(`${label} must be null for a radial validated refusal`);
    return null;
  }
  if (value === null) fail(`${label} must contain completed main-evaluator provenance`);
  return parseEvaluatorExecution(value, label);
}

function parsePacketGovernedTiming(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
  label: string,
): Phase10C0VS6PacketGovernedTiming {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "source", "selectedAttemptId", "attemptLedger", "invocationRecords",
    "governedInvocationElapsedNanoseconds", "governedInvocationWallSeconds", "processHours",
  ], label);
  const source = row.source === "selected-attempt-row" || row.source === "packet-verification-worker"
    ? row.source
    : fail(`${label}.source differs from exact enum`);
  const produce = isProducePacket(packet.packetId);
  if ((source === "selected-attempt-row") !== produce) {
    fail(`${label}.source differs from produce/nonproduce packet authority`);
  }
  const selectedAttemptId = row.selectedAttemptId === null
    ? null
    : phase10C0VS6SafeToken(row.selectedAttemptId, `${label}.selectedAttemptId`);
  const attemptLedger = row.attemptLedger === null
    ? null
    : parsePhase10C0VS6ArtifactIdentity(row.attemptLedger, `${label}.attemptLedger`);
  if (produce) {
    if (selectedAttemptId !== packet.registeredAttemptId || attemptLedger === null) {
      fail(`${label} produce timing must bind the registered attempt and exact ledger`);
    }
  } else if (selectedAttemptId !== null || attemptLedger !== null) {
    fail(`${label} nonproduce timing may not invent an attempt row or ledger`);
  }
  let invocationRecords:
    | readonly Phase10C0VS6ExecutableInvocationRecord[]
    | readonly Phase10C0VS6PacketInvocationRecord[];
  if (produce) {
    invocationRecords = parsePhase10C0VS6ExecutableInvocationRecords(
      row.invocationRecords,
      `${label}.invocationRecords`,
    );
    if (invocationRecords.some((entry) => entry.terminalState === "infrastructure-failure")) {
      fail(`${label} claim-bearing produce timing may not contain infrastructure failure`);
    }
  } else {
    if (!Array.isArray(row.invocationRecords)) fail(`${label}.invocationRecords must be an array`);
    invocationRecords = Object.freeze(row.invocationRecords.map((entry, index) =>
      parsePacketInvocationRecord(entry, `${label}.invocationRecords[${index}]`)));
    if (invocationRecords.length !== packet.verificationInvocationRoster.length ||
      invocationRecords.some((entry, index) => {
        const expected = packet.verificationInvocationRoster[index];
        return expected === undefined || entry.invocationId !== expected.invocationId ||
          entry.callableId !== expected.callableId || entry.negativeControlId !== expected.negativeControlId ||
          entry.invocationClass !== expected.invocationClass ||
          entry.registeredWallSecondsMaximum !== expected.registeredWallSecondsMaximum ||
          entry.terminalState !== "complete";
      })) {
      fail(`${label} nonproduce timing differs from the exact all-complete invocation roster`);
    }
  }
  const elapsedNanoseconds = safeIntegerSum(
    invocationRecords.map((entry) => entry.elapsedNanoseconds),
    `${label}.invocationRecords elapsed sum`,
  );
  const governedInvocationElapsedNanoseconds = phase10C0VS6NonnegativeSafeInteger(
    row.governedInvocationElapsedNanoseconds,
    `${label}.governedInvocationElapsedNanoseconds`,
  );
  const governedInvocationWallSeconds = phase10C0VS6NonnegativeNumber(
    row.governedInvocationWallSeconds,
    `${label}.governedInvocationWallSeconds`,
  );
  const processHours = phase10C0VS6NonnegativeNumber(row.processHours, `${label}.processHours`);
  if (governedInvocationElapsedNanoseconds !== elapsedNanoseconds ||
    governedInvocationWallSeconds !== elapsedNanoseconds / 1_000_000_000 ||
    processHours !== elapsedNanoseconds / 3_600_000_000_000) {
    fail(`${label} duration fields differ from the exact integer invocation sum`);
  }
  return Object.freeze({
    source,
    selectedAttemptId,
    attemptLedger,
    invocationRecords,
    governedInvocationElapsedNanoseconds,
    governedInvocationWallSeconds,
    processHours,
  });
}

function parsePriorPacketVerificationAccounting(
  value: unknown,
  label: string,
): Phase10C0VS6PriorPacketVerificationAccounting {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "packetId", "verification", "governedInvocationElapsedNanoseconds", "processHours",
  ], label);
  const governedInvocationElapsedNanoseconds = phase10C0VS6NonnegativeSafeInteger(
    row.governedInvocationElapsedNanoseconds,
    `${label}.governedInvocationElapsedNanoseconds`,
  );
  const processHours = phase10C0VS6NonnegativeNumber(row.processHours, `${label}.processHours`);
  if (processHours !== governedInvocationElapsedNanoseconds / 3_600_000_000_000) {
    fail(`${label}.processHours differs from integer elapsed nanoseconds`);
  }
  return Object.freeze({
    packetId: phase10C0VS6SafeToken(row.packetId, `${label}.packetId`),
    verification: parsePhase10C0VS6ArtifactIdentity(row.verification, `${label}.verification`),
    governedInvocationElapsedNanoseconds,
    processHours,
  });
}

function parseUnselectedAttemptAccounting(
  value: unknown,
  label: string,
): Phase10C0VS6UnselectedAttemptAccounting {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "packetId", "attemptLedger", "attemptId", "dispositionCode",
    "governedInvocationElapsedNanoseconds", "processHours",
  ], label);
  const dispositionCode = row.dispositionCode === "production-complete" ||
    row.dispositionCode === "preproduction-artifact-refusal" ||
    row.dispositionCode === "prelaunch-resource-refusal" ||
    row.dispositionCode === "registered-cap-resource-refusal" ||
    row.dispositionCode === "reference-discrepancy-refusal" ||
    row.dispositionCode === "preimplementation-reference-refusal"
    ? row.dispositionCode
    : fail(`${label}.dispositionCode differs from the current-v1 exact enum`);
  const governedInvocationElapsedNanoseconds = phase10C0VS6NonnegativeSafeInteger(
    row.governedInvocationElapsedNanoseconds,
    `${label}.governedInvocationElapsedNanoseconds`,
  );
  const processHours = phase10C0VS6NonnegativeNumber(row.processHours, `${label}.processHours`);
  if (processHours !== governedInvocationElapsedNanoseconds / 3_600_000_000_000) {
    fail(`${label}.processHours differs from integer elapsed nanoseconds`);
  }
  const packetId = phase10C0VS6SafeToken(row.packetId, `${label}.packetId`);
  if (packetId !== "c0v-radial-produce" && packetId !== "c0v-moving-produce" &&
    packetId !== "c0v-static-produce") {
    fail(`${label}.packetId is not a produce packet`);
  }
  return Object.freeze({
    packetId,
    attemptLedger: parsePhase10C0VS6ArtifactIdentity(row.attemptLedger, `${label}.attemptLedger`),
    attemptId: phase10C0VS6SafeToken(row.attemptId, `${label}.attemptId`),
    dispositionCode,
    governedInvocationElapsedNanoseconds,
    processHours,
  });
}

function parsePackageProcessAccounting(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
  currentTiming: Phase10C0VS6PacketGovernedTiming,
  label: string,
): Phase10C0VS6PackageProcessAccounting {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "selectedPacketIds", "priorPacketVerifications", "unselectedAttemptRows",
    "priorSelectedPacketElapsedNanoseconds", "unselectedAttemptElapsedNanoseconds",
    "currentPacketElapsedNanoseconds", "totalElapsedNanoseconds", "maximumElapsedNanoseconds",
    "priorSelectedPacketProcessHours", "unselectedAttemptProcessHours", "currentPacketProcessHours",
    "totalProcessHours", "maximumProcessHours", "duplicateAccountingVerdict",
    "omissionAccountingVerdict",
  ], label);
  if (!Array.isArray(row.selectedPacketIds)) fail(`${label}.selectedPacketIds must be an array`);
  const selectedPacketIds = Object.freeze(row.selectedPacketIds.map((entry, index) =>
    phase10C0VS6SafeToken(entry, `${label}.selectedPacketIds[${index}]`)));
  if (selectedPacketIds.length === 0 || selectedPacketIds.at(-1) !== packet.packetId ||
    new Set(selectedPacketIds).size !== selectedPacketIds.length) {
    fail(`${label}.selectedPacketIds is not a unique catalogue prefix ending at the current packet`);
  }
  if (!Array.isArray(row.priorPacketVerifications) ||
    row.priorPacketVerifications.length !== selectedPacketIds.length - 1) {
    fail(`${label}.priorPacketVerifications does not cover the exact prior prefix`);
  }
  const priorPacketVerifications = Object.freeze(row.priorPacketVerifications.map((entry, index) => {
    const parsed = parsePriorPacketVerificationAccounting(
      entry,
      `${label}.priorPacketVerifications[${index}]`,
    );
    if (parsed.packetId !== selectedPacketIds[index]) {
      fail(`${label}.priorPacketVerifications[${index}] differs from selected prefix order`);
    }
    return parsed;
  }));
  if (!Array.isArray(row.unselectedAttemptRows)) fail(`${label}.unselectedAttemptRows must be an array`);
  const unselectedAttemptRows = Object.freeze(row.unselectedAttemptRows.map((entry, index) =>
    parseUnselectedAttemptAccounting(entry, `${label}.unselectedAttemptRows[${index}]`)));
  if (new Set(unselectedAttemptRows.map((entry) => entry.attemptId)).size !== unselectedAttemptRows.length ||
    unselectedAttemptRows.some((entry, index) => index > 0 &&
      codePointCompare(unselectedAttemptRows[index - 1]!.attemptId, entry.attemptId) >= 0)) {
    fail(`${label}.unselectedAttemptRows must be attempt-ID-sorted and unique`);
  }
  const priorSelectedPacketElapsedNanoseconds = safeIntegerSum(
    priorPacketVerifications.map((entry) => entry.governedInvocationElapsedNanoseconds),
    `${label}.priorSelectedPacketElapsedNanoseconds sum`,
  );
  const unselectedAttemptElapsedNanoseconds = safeIntegerSum(
    unselectedAttemptRows.map((entry) => entry.governedInvocationElapsedNanoseconds),
    `${label}.unselectedAttemptElapsedNanoseconds sum`,
  );
  const currentPacketElapsedNanoseconds = currentTiming.governedInvocationElapsedNanoseconds;
  const totalElapsedNanoseconds = safeIntegerSum([
    priorSelectedPacketElapsedNanoseconds,
    unselectedAttemptElapsedNanoseconds,
    currentPacketElapsedNanoseconds,
  ], `${label}.totalElapsedNanoseconds sum`);
  const exactNumbers: readonly [string, number][] = [
    ["priorSelectedPacketElapsedNanoseconds", priorSelectedPacketElapsedNanoseconds],
    ["unselectedAttemptElapsedNanoseconds", unselectedAttemptElapsedNanoseconds],
    ["currentPacketElapsedNanoseconds", currentPacketElapsedNanoseconds],
    ["totalElapsedNanoseconds", totalElapsedNanoseconds],
    ["maximumElapsedNanoseconds", PACKAGE_ELAPSED_NANOSECONDS_MAXIMUM],
    ["priorSelectedPacketProcessHours", priorSelectedPacketElapsedNanoseconds / 3_600_000_000_000],
    ["unselectedAttemptProcessHours", unselectedAttemptElapsedNanoseconds / 3_600_000_000_000],
    ["currentPacketProcessHours", currentPacketElapsedNanoseconds / 3_600_000_000_000],
    ["totalProcessHours", totalElapsedNanoseconds / 3_600_000_000_000],
    ["maximumProcessHours", 24],
  ];
  for (const [field, expected] of exactNumbers) {
    const actual = phase10C0VS6NonnegativeNumber(row[field], `${label}.${field}`);
    if (actual !== expected) fail(`${label}.${field} differs from exact integer accounting`);
  }
  if (totalElapsedNanoseconds > PACKAGE_ELAPSED_NANOSECONDS_MAXIMUM ||
    row.duplicateAccountingVerdict !== "pass" || row.omissionAccountingVerdict !== "pass") {
    fail(`${label} exceeds the package cap or lacks exact duplicate/omission verdicts`);
  }
  const priorVerificationPaths = priorPacketVerifications.map((entry) => entry.verification.path);
  const unselectedAttemptIds = unselectedAttemptRows.map((entry) => entry.attemptId);
  if (new Set(priorVerificationPaths).size !== priorVerificationPaths.length ||
    new Set(unselectedAttemptIds).size !== unselectedAttemptIds.length ||
    (currentTiming.selectedAttemptId !== null && unselectedAttemptIds.includes(currentTiming.selectedAttemptId))) {
    fail(`${label} duplicates a verification path or selected attempt identity`);
  }
  return Object.freeze({
    selectedPacketIds,
    priorPacketVerifications,
    unselectedAttemptRows,
    priorSelectedPacketElapsedNanoseconds,
    unselectedAttemptElapsedNanoseconds,
    currentPacketElapsedNanoseconds,
    totalElapsedNanoseconds,
    maximumElapsedNanoseconds: PACKAGE_ELAPSED_NANOSECONDS_MAXIMUM,
    priorSelectedPacketProcessHours: priorSelectedPacketElapsedNanoseconds / 3_600_000_000_000,
    unselectedAttemptProcessHours: unselectedAttemptElapsedNanoseconds / 3_600_000_000_000,
    currentPacketProcessHours: currentPacketElapsedNanoseconds / 3_600_000_000_000,
    totalProcessHours: totalElapsedNanoseconds / 3_600_000_000_000,
    maximumProcessHours: 24,
    duplicateAccountingVerdict: "pass",
    omissionAccountingVerdict: "pass",
  });
}

function parsePublicationFinalizationProjections(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
  label: string,
): readonly Phase10C0VS6PublicationFinalizationProjection[] {
  if (!Array.isArray(value) || value.length !== packet.resources.publicationFinalizationProjections.length) {
    fail(`${label} differs from exact packet finalization projection count`);
  }
  const projections = value.map((entry, index) => {
    const projectionLabel = `${label}[${index}]`;
    const row = phase10C0VS6Object(entry, projectionLabel);
    phase10C0VS6ExactOrderedKeys(
      row,
      ["artifactRole", "path", "stagingPath", "maximumByteLength"],
      projectionLabel,
    );
    const artifactRole = row.artifactRole === "packet-verification" || row.artifactRole === "terminal-receipt"
      ? row.artifactRole
      : fail(`${projectionLabel}.artifactRole differs from exact enum`);
    const maximumByteLength = row.maximumByteLength === 524288 || row.maximumByteLength === 131072
      ? row.maximumByteLength
      : fail(`${projectionLabel}.maximumByteLength differs from registered bounds`);
    const parsed = Object.freeze({
      artifactRole,
      path: phase10C0VS6SafeRelativePath(row.path, `${projectionLabel}.path`),
      stagingPath: phase10C0VS6SafeRelativePath(row.stagingPath, `${projectionLabel}.stagingPath`),
      maximumByteLength,
    });
    phase10C0VS6SameJson(
      parsed,
      packet.resources.publicationFinalizationProjections[index],
      `${projectionLabel} protocol authority`,
    );
    return parsed;
  });
  if (projections[0]?.artifactRole !== "packet-verification" ||
    projections[1]?.artifactRole !== "terminal-receipt") {
    fail(`${label} must retain packet verification then terminal receipt order`);
  }
  return Object.freeze(projections);
}

function parsePacketResourceAccounting(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
  governedTiming: Phase10C0VS6PacketGovernedTiming,
  label: string,
): Phase10C0VS6PacketResourceAccounting {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "source", "attemptId", "attemptLedger", "attemptRoot", "attemptRootArtifacts",
    "attemptMaximumObservedConcurrentBytes", "attemptTerminalRetainedBytes",
    "materializedPublicationArtifacts", "materializedPublicationBytes",
    "publicationFinalizationProjections", "projectedFinalizationBytes",
    "projectedPacketRetainedBytes", "physicalPathUniquenessVerdict", "appendOnlyVerdict",
  ], label);
  const source = row.source === "selected-attempt-resource-record" ||
    row.source === "append-only-attempt-root"
    ? row.source
    : fail(`${label}.source differs from exact enum`);
  const produce = isProducePacket(packet.packetId);
  if ((source === "selected-attempt-resource-record") !== produce) {
    fail(`${label}.source differs from produce/nonproduce authority`);
  }
  const attemptId = phase10C0VS6SafeToken(row.attemptId, `${label}.attemptId`);
  if (attemptId !== packet.registeredAttemptId) fail(`${label}.attemptId differs from packet authority`);
  const attemptLedger = row.attemptLedger === null
    ? null
    : parsePhase10C0VS6ArtifactIdentity(row.attemptLedger, `${label}.attemptLedger`);
  if ((attemptLedger !== null) !== produce) fail(`${label}.attemptLedger nullability differs from packet kind`);
  if (produce) {
    if (governedTiming.attemptLedger === null || attemptLedger === null) {
      fail(`${label} produce accounting lacks the selected attempt ledger`);
    }
    phase10C0VS6SameIdentity(attemptLedger, governedTiming.attemptLedger, `${label}.attemptLedger timing join`);
  }
  const attemptRoot = phase10C0VS6SafeRelativePath(row.attemptRoot, `${label}.attemptRoot`);
  if (attemptRoot !== packet.paths.attemptRoot) fail(`${label}.attemptRoot differs from packet authority`);
  const attemptRootArtifacts = parseIdentityArray(row.attemptRootArtifacts, `${label}.attemptRootArtifacts`, false);
  if (attemptRootArtifacts.some((entry) =>
    entry.path !== attemptRoot && !entry.path.startsWith(`${attemptRoot}/`))) {
    fail(`${label}.attemptRootArtifacts contains a path outside the exact attempt root`);
  }
  const attemptTerminalRetainedBytes = safeIntegerSum(
    attemptRootArtifacts.map((entry) => entry.byteLength),
    `${label}.attemptTerminalRetainedBytes sum`,
  );
  const attemptMaximumObservedConcurrentBytes = phase10C0VS6NonnegativeSafeInteger(
    row.attemptMaximumObservedConcurrentBytes,
    `${label}.attemptMaximumObservedConcurrentBytes`,
  );
  if (attemptMaximumObservedConcurrentBytes < attemptTerminalRetainedBytes ||
    row.attemptTerminalRetainedBytes !== attemptTerminalRetainedBytes) {
    fail(`${label} attempt high-water/terminal retained bytes are incoherent`);
  }
  const materializedPublicationArtifacts = parseIdentityArray(
    row.materializedPublicationArtifacts,
    `${label}.materializedPublicationArtifacts`,
    true,
  );
  const materializedPublicationBytes = safeIntegerSum(
    materializedPublicationArtifacts.map((entry) => entry.byteLength),
    `${label}.materializedPublicationBytes sum`,
  );
  if (row.materializedPublicationBytes !== materializedPublicationBytes) {
    fail(`${label}.materializedPublicationBytes differs from exact physical-copy sum`);
  }
  const publicationFinalizationProjections = parsePublicationFinalizationProjections(
    row.publicationFinalizationProjections,
    packet,
    `${label}.publicationFinalizationProjections`,
  );
  const projectedFinalizationBytes = safeIntegerSum(
    publicationFinalizationProjections.map((entry) => entry.maximumByteLength * 2),
    `${label}.projectedFinalizationBytes sum`,
  );
  const projectedPacketRetainedBytes = safeIntegerSum([
    attemptTerminalRetainedBytes,
    materializedPublicationBytes,
    projectedFinalizationBytes,
  ], `${label}.projectedPacketRetainedBytes sum`);
  if (row.projectedFinalizationBytes !== projectedFinalizationBytes ||
    row.projectedPacketRetainedBytes !== projectedPacketRetainedBytes) {
    fail(`${label} projected retained bytes differ from exact staging-plus-final accounting`);
  }
  const allPaths = [
    ...attemptRootArtifacts.map((entry) => entry.path),
    ...materializedPublicationArtifacts.map((entry) => entry.path),
    ...publicationFinalizationProjections.flatMap((entry) => [entry.path, entry.stagingPath]),
  ];
  if (new Set(allPaths).size !== allPaths.length || row.physicalPathUniquenessVerdict !== "pass" ||
    row.appendOnlyVerdict !== "pass") {
    fail(`${label} repeats a physical path or lacks exact append-only/uniqueness verdicts`);
  }
  return Object.freeze({
    source,
    attemptId,
    attemptLedger,
    attemptRoot,
    attemptRootArtifacts,
    attemptMaximumObservedConcurrentBytes,
    attemptTerminalRetainedBytes,
    materializedPublicationArtifacts,
    materializedPublicationBytes,
    publicationFinalizationProjections,
    projectedFinalizationBytes,
    projectedPacketRetainedBytes,
    physicalPathUniquenessVerdict: "pass",
    appendOnlyVerdict: "pass",
  });
}

function parsePriorPacketResourceAccounting(
  value: unknown,
  label: string,
): Phase10C0VS6PriorPacketResourceAccounting {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "packetId", "verification", "terminalReceipt", "attemptMaximumObservedConcurrentBytes",
    "finalizedPacketRetainedBytes",
  ], label);
  const verification = parsePhase10C0VS6ArtifactIdentity(row.verification, `${label}.verification`);
  const terminalReceipt = parsePhase10C0VS6ArtifactIdentity(
    row.terminalReceipt,
    `${label}.terminalReceipt`,
  );
  if (verification.path === terminalReceipt.path) fail(`${label} repeats verification as terminal receipt`);
  return Object.freeze({
    packetId: phase10C0VS6SafeToken(row.packetId, `${label}.packetId`),
    verification,
    terminalReceipt,
    attemptMaximumObservedConcurrentBytes: phase10C0VS6NonnegativeSafeInteger(
      row.attemptMaximumObservedConcurrentBytes,
      `${label}.attemptMaximumObservedConcurrentBytes`,
    ),
    finalizedPacketRetainedBytes: phase10C0VS6NonnegativeSafeInteger(
      row.finalizedPacketRetainedBytes,
      `${label}.finalizedPacketRetainedBytes`,
    ),
  });
}

function parsePackageResourceAccounting(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
  processAccounting: Phase10C0VS6PackageProcessAccounting,
  packetAccounting: Phase10C0VS6PacketResourceAccounting,
  label: string,
): Phase10C0VS6PackageResourceAccounting {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "selectedPacketIds", "priorPacketResources", "packageStorageBaselineArtifacts",
    "packageStorageBaselineBytes", "priorFinalizedPacketRetainedBytes",
    "currentProjectedPacketRetainedBytes", "totalPackageRetainedBytes",
    "maximumPackageRetainedBytes", "physicalPathDuplicateVerdict", "omissionAccountingVerdict",
    "storageLimitVerdict",
  ], label);
  if (!Array.isArray(row.selectedPacketIds)) fail(`${label}.selectedPacketIds must be an array`);
  const selectedPacketIds = Object.freeze(row.selectedPacketIds.map((entry, index) =>
    phase10C0VS6SafeToken(entry, `${label}.selectedPacketIds[${index}]`)));
  exactStringRoster(selectedPacketIds, processAccounting.selectedPacketIds, `${label}.selectedPacketIds`);
  if (!Array.isArray(row.priorPacketResources) ||
    row.priorPacketResources.length !== selectedPacketIds.length - 1) {
    fail(`${label}.priorPacketResources does not cover the exact prior packet prefix`);
  }
  const priorPacketResources = Object.freeze(row.priorPacketResources.map((entry, index) => {
    const parsed = parsePriorPacketResourceAccounting(entry, `${label}.priorPacketResources[${index}]`);
    const processRow = processAccounting.priorPacketVerifications[index];
    if (parsed.packetId !== selectedPacketIds[index] || processRow === undefined ||
      parsed.packetId !== processRow.packetId) {
      fail(`${label}.priorPacketResources[${index}] differs from selected prefix order`);
    }
    phase10C0VS6SameIdentity(
      parsed.verification,
      processRow.verification,
      `${label}.priorPacketResources[${index}] verification join`,
    );
    return parsed;
  }));
  const packageStorageBaselineArtifacts = parseIdentityArray(
    row.packageStorageBaselineArtifacts,
    `${label}.packageStorageBaselineArtifacts`,
    false,
  );
  phase10C0VS6SameJson(
    packageStorageBaselineArtifacts,
    packet.resources.packageStorageBaselineArtifacts,
    `${label}.packageStorageBaselineArtifacts protocol authority`,
  );
  const packageStorageBaselineBytes = safeIntegerSum(
    packageStorageBaselineArtifacts.map((entry) => entry.byteLength),
    `${label}.packageStorageBaselineBytes sum`,
  );
  const priorFinalizedPacketRetainedBytes = safeIntegerSum(
    priorPacketResources.map((entry) => entry.finalizedPacketRetainedBytes),
    `${label}.priorFinalizedPacketRetainedBytes sum`,
  );
  const currentProjectedPacketRetainedBytes = packetAccounting.projectedPacketRetainedBytes;
  const totalPackageRetainedBytes = safeIntegerSum([
    packageStorageBaselineBytes,
    priorFinalizedPacketRetainedBytes,
    currentProjectedPacketRetainedBytes,
  ], `${label}.totalPackageRetainedBytes sum`);
  if (packageStorageBaselineBytes !== packet.resources.packageStorageBaselineBytes ||
    row.packageStorageBaselineBytes !== packageStorageBaselineBytes ||
    row.priorFinalizedPacketRetainedBytes !== priorFinalizedPacketRetainedBytes ||
    row.currentProjectedPacketRetainedBytes !== currentProjectedPacketRetainedBytes ||
    row.totalPackageRetainedBytes !== totalPackageRetainedBytes ||
    row.maximumPackageRetainedBytes !== PACKAGE_RETAINED_BYTES_MAXIMUM) {
    fail(`${label} byte totals differ from exact physical-copy accounting`);
  }
  if (totalPackageRetainedBytes > PACKAGE_RETAINED_BYTES_MAXIMUM ||
    row.physicalPathDuplicateVerdict !== "pass" || row.omissionAccountingVerdict !== "pass" ||
    row.storageLimitVerdict !== "pass") {
    fail(`${label} exceeds storage or lacks exact duplicate/omission/storage verdicts`);
  }
  const priorPaths = priorPacketResources.flatMap((entry) => [
    entry.verification.path,
    entry.terminalReceipt.path,
  ]);
  const currentPaths = [
    ...packetAccounting.attemptRootArtifacts.map((entry) => entry.path),
    ...packetAccounting.materializedPublicationArtifacts.map((entry) => entry.path),
    ...packetAccounting.publicationFinalizationProjections.flatMap((entry) => [entry.path, entry.stagingPath]),
  ];
  const allPaths = [
    ...packageStorageBaselineArtifacts.map((entry) => entry.path),
    ...priorPaths,
    ...currentPaths,
  ];
  if (new Set(allPaths).size !== allPaths.length) {
    fail(`${label} contains a duplicated baseline/prior/current physical path`);
  }
  return Object.freeze({
    selectedPacketIds,
    priorPacketResources,
    packageStorageBaselineArtifacts,
    packageStorageBaselineBytes: 1629577,
    priorFinalizedPacketRetainedBytes,
    currentProjectedPacketRetainedBytes,
    totalPackageRetainedBytes,
    maximumPackageRetainedBytes: PACKAGE_RETAINED_BYTES_MAXIMUM,
    physicalPathDuplicateVerdict: "pass",
    omissionAccountingVerdict: "pass",
    storageLimitVerdict: "pass",
  });
}

/** Strict inner codec for phase10-packet-verification-v2. */
export function parsePhase10C0VS6PacketVerificationV2(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
  authority: Phase10C0VS6PacketVerificationV2Authority,
): Phase10C0VS6PacketVerificationV2 {
  const label = `${packet.packetId} packet verification-v2`;
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "schema", "verificationId", "matrixId", "protocolId", "registryId", "packetId",
    "terminalState", "verifiedArtifacts", "checkResults", "executedNegativeControlIds",
    "negativeControlResults", "boundDependencyPacketIds", "execution", "callerInvocationResults",
    "governedTiming", "packageProcessAccounting", "packetResourceAccounting",
    "packageResourceAccounting", "aggregateVerdict", "limits",
  ], label);
  const verificationId = `phase10-${packet.packetId}-${packet.registeredAttemptId}-verification-v2`;
  if (row.schema !== packet.verification.schemaId || row.schema !== "phase10-packet-verification-v2" ||
    row.verificationId !== verificationId || row.matrixId !== PHASE10_C0V_S6_MATRIX_ID ||
    row.protocolId !== packet.protocolId || row.registryId !== packet.registryId ||
    row.packetId !== packet.packetId || row.terminalState !== "complete") {
    fail(`${label} schema/verification/matrix/protocol/registry/packet/state differs from authority`);
  }
  const subroutes = packet.terminalSubroutes.filter(
    (entry) => entry.subrouteId === authority.selectedSubrouteId,
  );
  if (subroutes.length !== 1) fail(`${label} selected subroute does not resolve exactly once`);
  const subroute = subroutes[0]!;
  if (!subroute.requiredOutputIds.some((entry) => entry.endsWith("-verification"))) {
    fail(`${label} selected maker-return subroute has no verification authority`);
  }
  const verifiedArtifacts = parseVerifiedArtifacts(row.verifiedArtifacts, `${label}.verifiedArtifacts`);
  phase10C0VS6SameJson(
    verifiedArtifacts,
    authority.verifiedArtifacts,
    `${label}.verifiedArtifacts independently reopened authority`,
  );
  const expectedVerifiedOutputIds = subroute.requiredOutputIds.filter(
    (entry) => !entry.endsWith("-verification") && !entry.endsWith("-terminal-receipt"),
  );
  exactStringRoster(
    verifiedArtifacts.map((entry) => entry.outputId),
    expectedVerifiedOutputIds,
    `${label}.verifiedArtifacts output IDs`,
  );
  const verificationPaths = packet.paths.allowedPublicationPaths.filter(
    (entry) => basename(entry) === packet.verification.filename,
  );
  if (verificationPaths.length !== 1 || verifiedArtifacts.some((entry) =>
    entry.path === verificationPaths[0] || entry.path === packet.paths.terminalReceiptPath)) {
    fail(`${label}.verifiedArtifacts contains this receipt/later terminal or path authority is ambiguous`);
  }
  const checkResults = parsePacketCheckResults(row.checkResults, `${label}.checkResults`);
  phase10C0VS6SameJson(checkResults, authority.checkResults, `${label}.checkResults independent authority`);
  exactStringRoster(
    checkResults.map((entry) => entry.checkId),
    subroute.requiredCheckIds,
    `${label}.checkResults IDs`,
  );
  const executedNegativeControlIds = phase10C0VS6SortedUniqueStrings(
    row.executedNegativeControlIds,
    `${label}.executedNegativeControlIds`,
  );
  exactStringRoster(
    executedNegativeControlIds,
    subroute.requiredNegativeControlIds,
    `${label}.executedNegativeControlIds`,
  );
  exactStringRoster(
    executedNegativeControlIds,
    authority.executedNegativeControlIds,
    `${label}.executedNegativeControlIds independent authority`,
  );
  const negativeControlResults = parseNegativeControlResults(
    row.negativeControlResults,
    `${label}.negativeControlResults`,
  );
  phase10C0VS6SameJson(
    negativeControlResults,
    authority.negativeControlResults,
    `${label}.negativeControlResults independent raw reproof`,
  );
  exactStringRoster(
    negativeControlResults.map((entry) => entry.negativeControlId),
    executedNegativeControlIds,
    `${label}.negativeControlResults IDs`,
  );
  const boundDependencyPacketIds = phase10C0VS6SortedUniqueStrings(
    row.boundDependencyPacketIds,
    `${label}.boundDependencyPacketIds`,
  );
  exactStringRoster(
    boundDependencyPacketIds,
    packet.boundDependencyPacketIds,
    `${label}.boundDependencyPacketIds`,
  );
  const execution = parsePhase10C0VS6ContextualVerificationExecution(
    row.execution,
    packet,
    authority.selectedSubrouteId,
    `${label}.execution`,
  );
  phase10C0VS6SameJson(execution, authority.execution, `${label}.execution independent authority`);
  if (execution !== null && (execution.runtime !== packet.resources.requiredRuntime ||
    execution.processConcurrency !== packet.resources.processConcurrency)) {
    fail(`${label}.execution runtime/concurrency differs from packet resources`);
  }
  const callerInvocationResults = parseCallerInvocationResults(
    row.callerInvocationResults,
    packet,
    authority.selectedSubrouteId,
    "all",
    authority.callerInvocationResults,
    `${label}.callerInvocationResults`,
  );
  const callerCheckIds = [...new Set(callerInvocationResults.flatMap((entry) => entry.executedCheckIds))]
    .sort(codePointCompare);
  const callerEvaluatedCheckIds = [
    ...new Set(callerInvocationResults.flatMap((entry) => entry.evaluatedCheckIds)),
  ].sort(codePointCompare);
  const callerControlIds = [
    ...new Set(callerInvocationResults.flatMap((entry) => entry.executedNegativeControlIds)),
  ].sort(codePointCompare);
  exactStringRoster(callerCheckIds, subroute.requiredCheckIds, `${label} caller check roster`);
  exactStringRoster(callerEvaluatedCheckIds, subroute.requiredCheckIds, `${label} evaluator check roster`);
  exactStringRoster(callerControlIds, executedNegativeControlIds, `${label} caller control roster`);
  const governedTiming = parsePacketGovernedTiming(row.governedTiming, packet, `${label}.governedTiming`);
  phase10C0VS6SameJson(
    governedTiming,
    authority.governedTiming,
    `${label}.governedTiming independently reopened authority`,
  );
  const packageProcessAccounting = parsePackageProcessAccounting(
    row.packageProcessAccounting,
    packet,
    governedTiming,
    `${label}.packageProcessAccounting`,
  );
  phase10C0VS6SameJson(
    packageProcessAccounting,
    authority.packageProcessAccounting,
    `${label}.packageProcessAccounting independently scanned authority`,
  );
  const packetResourceAccounting = parsePacketResourceAccounting(
    row.packetResourceAccounting,
    packet,
    governedTiming,
    `${label}.packetResourceAccounting`,
  );
  phase10C0VS6SameJson(
    packetResourceAccounting,
    authority.packetResourceAccounting,
    `${label}.packetResourceAccounting independently censused authority`,
  );
  const packageResourceAccounting = parsePackageResourceAccounting(
    row.packageResourceAccounting,
    packet,
    packageProcessAccounting,
    packetResourceAccounting,
    `${label}.packageResourceAccounting`,
  );
  phase10C0VS6SameJson(
    packageResourceAccounting,
    authority.packageResourceAccounting,
    `${label}.packageResourceAccounting independently scanned authority`,
  );
  if (row.aggregateVerdict !== "pass") fail(`${label}.aggregateVerdict must be structural pass`);
  const limits = phase10C0VS6SortedUniqueStrings(row.limits, `${label}.limits`);
  if (limits.length === 0) fail(`${label}.limits must preserve a nonempty claim boundary`);
  exactStringRoster(limits, packet.claimBoundary.forbidden, `${label}.limits`);
  return Object.freeze({
    schema: "phase10-packet-verification-v2",
    verificationId,
    matrixId: PHASE10_C0V_S6_MATRIX_ID,
    protocolId: packet.protocolId,
    registryId: packet.registryId,
    packetId: packet.packetId,
    terminalState: "complete",
    verifiedArtifacts,
    checkResults,
    executedNegativeControlIds,
    negativeControlResults,
    boundDependencyPacketIds,
    execution,
    callerInvocationResults,
    governedTiming,
    packageProcessAccounting,
    packetResourceAccounting,
    packageResourceAccounting,
    aggregateVerdict: "pass",
    limits,
  });
}

export function parsePhase10C0VS6PacketVerificationV2Bytes(
  bytes: Uint8Array,
  packet: Phase10C0VS6PacketProtocol,
  authority: Phase10C0VS6PacketVerificationV2Authority,
): Phase10C0VS6PacketVerificationV2 {
  return parsePhase10C0VS6PacketVerificationV2(
    phase10C0VS6ParsePrettyJson(bytes, `${packet.packetId} packet verification-v2 bytes`),
    packet,
    authority,
  );
}

export function writePhase10C0VS6PacketVerificationReceipt(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
  authority: Phase10C0VS6PacketVerificationV2Authority,
): Uint8Array {
  return phase10C0VS6PrettyJsonBytes(parsePhase10C0VS6PacketVerificationV2(value, packet, authority));
}

function writePacketSpecificVerificationReceipt(
  expectedPacketId: Phase10C0VS6PacketProtocol["packetId"],
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
  authority: Phase10C0VS6PacketVerificationV2Authority,
): Uint8Array {
  if (packet.packetId !== expectedPacketId) {
    fail(`${expectedPacketId} verification writer received ${packet.packetId} authority`);
  }
  return writePhase10C0VS6PacketVerificationReceipt(value, packet, authority);
}

export function writePhase10C0VS6ApVerificationReceipt(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
  authority: Phase10C0VS6PacketVerificationV2Authority,
): Uint8Array {
  return writePacketSpecificVerificationReceipt("a-p-c0v-s6", value, packet, authority);
}

export function writePhase10C0VMovingPublishVerificationReceipt(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
  authority: Phase10C0VS6PacketVerificationV2Authority,
): Uint8Array {
  return writePacketSpecificVerificationReceipt("c0v-moving-publish", value, packet, authority);
}

export function writePhase10C0VRadialPublishVerificationReceipt(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
  authority: Phase10C0VS6PacketVerificationV2Authority,
): Uint8Array {
  return writePacketSpecificVerificationReceipt("c0v-radial-publish", value, packet, authority);
}

export function writePhase10C0VStaticPublishVerificationReceipt(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
  authority: Phase10C0VS6PacketVerificationV2Authority,
): Uint8Array {
  return writePacketSpecificVerificationReceipt("c0v-static-publish", value, packet, authority);
}

export function writePhase10C0VAggregateVerificationReceipt(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
  authority: Phase10C0VS6PacketVerificationV2Authority,
): Uint8Array {
  return writePacketSpecificVerificationReceipt("c0v-aggregate", value, packet, authority);
}

export interface Phase10C0VS6ParsedRadialCheckResult {
  readonly checkId: (typeof RADIAL_CHECK_IDS)[number];
  readonly pass: boolean;
  readonly reasonCodes: readonly string[];
  readonly witnesses: readonly StrictJson[];
}

export interface Phase10C0VS6ParsedRadialNegativeControl {
  readonly negativeControlId: (typeof RADIAL_CONTROL_IDS)[number];
  readonly mutationExecuted: boolean;
  readonly witnessMoved: boolean;
  readonly cleanCapturePreserved: boolean;
  readonly attackedCheckFailed: boolean;
  readonly pass: boolean;
}

export interface Phase10C0VS6ParsedRadialEvaluationReceipt {
  readonly schema: "phase10-c0v-radial-evaluation-v1";
  readonly evaluationId: string;
  readonly protocol: Phase10C0VS6ArtifactIdentity;
  readonly reference: Phase10C0VS6ArtifactIdentity;
  readonly witness: Phase10C0VS6ArtifactIdentity;
  readonly checkResults: readonly Phase10C0VS6ParsedRadialCheckResult[];
  readonly negativeControls: readonly Phase10C0VS6ParsedRadialNegativeControl[];
  readonly numericalDisposition: "pass" | "fail";
  readonly artifactDisposition: "valid" | "refusal";
  readonly limits: readonly string[];
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 receipt refused: ${message}`);
}

function exactStringRoster(actual: readonly string[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    fail(`${label} differs from exact authority order`);
  }
}

function strictWitnesses(value: unknown, label: string): readonly StrictJson[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return Object.freeze(value.map((entry) => strictJsonSnapshot(entry)));
}

export function parsePhase10C0VS6RadialEvaluationReceipt(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
): Phase10C0VS6ParsedRadialEvaluationReceipt {
  if (packet.packetId !== "c0v-radial-produce" || packet.bindings.scienceProtocol === null ||
    packet.bindings.referenceOrRefusal === null) fail("radial evaluation requires radial-produce packet authority");
  const label = "radial evaluation receipt";
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "schema", "evaluationId", "protocol", "reference", "witness", "checkResults",
    "negativeControls", "numericalDisposition", "artifactDisposition", "limits",
  ], label);
  if (row.schema !== "phase10-c0v-radial-evaluation-v1") fail("radial evaluation schema differs");
  if (!Array.isArray(row.checkResults) || row.checkResults.length !== RADIAL_CHECK_IDS.length) {
    fail("radial check result roster length differs");
  }
  const checkResults = row.checkResults.map((entry, index) => {
    const checkLabel = `${label}.checkResults[${index}]`;
    const check = phase10C0VS6Object(entry, checkLabel);
    phase10C0VS6ExactOrderedKeys(check, ["checkId", "pass", "reasonCodes", "witnesses"], checkLabel);
    if (check.checkId !== RADIAL_CHECK_IDS[index]) fail(`${checkLabel}.checkId differs`);
    const pass = phase10C0VS6Boolean(check.pass, `${checkLabel}.pass`);
    const reasonCodes = phase10C0VS6SortedUniqueStrings(check.reasonCodes, `${checkLabel}.reasonCodes`);
    if (pass !== (reasonCodes.length === 0)) {
      fail(`${checkLabel}.pass must be true exactly when reasonCodes is empty`);
    }
    return Object.freeze({
      checkId: RADIAL_CHECK_IDS[index]!,
      pass,
      reasonCodes,
      witnesses: strictWitnesses(check.witnesses, `${checkLabel}.witnesses`),
    });
  });
  if (!Array.isArray(row.negativeControls) || row.negativeControls.length !== RADIAL_CONTROL_IDS.length) {
    fail("radial negative-control roster length differs");
  }
  const negativeControls = row.negativeControls.map((entry, index) => {
    const controlLabel = `${label}.negativeControls[${index}]`;
    const control = phase10C0VS6Object(entry, controlLabel);
    phase10C0VS6ExactOrderedKeys(control, [
      "negativeControlId", "mutationExecuted", "witnessMoved", "cleanCapturePreserved",
      "attackedCheckFailed", "pass",
    ], controlLabel);
    if (control.negativeControlId !== RADIAL_CONTROL_IDS[index]) fail(`${controlLabel}.negativeControlId differs`);
    const mutationExecuted = phase10C0VS6Boolean(control.mutationExecuted, `${controlLabel}.mutationExecuted`);
    const witnessMoved = phase10C0VS6Boolean(control.witnessMoved, `${controlLabel}.witnessMoved`);
    const cleanCapturePreserved = phase10C0VS6Boolean(
      control.cleanCapturePreserved,
      `${controlLabel}.cleanCapturePreserved`,
    );
    const attackedCheckFailed = phase10C0VS6Boolean(
      control.attackedCheckFailed,
      `${controlLabel}.attackedCheckFailed`,
    );
    const pass = phase10C0VS6Boolean(control.pass, `${controlLabel}.pass`);
    const expectedPass = RADIAL_CONTROL_IDS[index] === "nc-radial-forged-summary"
      ? mutationExecuted && !witnessMoved && cleanCapturePreserved && !attackedCheckFailed
      : mutationExecuted && witnessMoved && cleanCapturePreserved && attackedCheckFailed;
    if (pass !== expectedPass) {
      fail(`${controlLabel}.pass was not rederived from its control-ID-specific facts`);
    }
    return Object.freeze({
      negativeControlId: RADIAL_CONTROL_IDS[index]!, mutationExecuted, witnessMoved,
      cleanCapturePreserved, attackedCheckFailed, pass,
    });
  });
  const protocol = parsePhase10C0VS6ArtifactIdentity(row.protocol, `${label}.protocol`);
  const reference = parsePhase10C0VS6ArtifactIdentity(row.reference, `${label}.reference`);
  const witness = parsePhase10C0VS6ArtifactIdentity(row.witness, `${label}.witness`);
  phase10C0VS6SameIdentity(protocol, packet.bindings.scienceProtocol, "radial evaluation science protocol");
  phase10C0VS6SameIdentity(reference, packet.bindings.referenceOrRefusal, "radial evaluation reference");
  const numericalDisposition = row.numericalDisposition === "pass" || row.numericalDisposition === "fail"
    ? row.numericalDisposition
    : fail("radial evaluation numericalDisposition differs");
  const limits = phase10C0VS6SortedUniqueStrings(row.limits, `${label}.limits`);
  exactStringRoster(limits, packet.claimBoundary.forbidden, "radial evaluation limits");
  const artifactDisposition = row.artifactDisposition === "valid" || row.artifactDisposition === "refusal"
    ? row.artifactDisposition
    : fail("radial evaluation artifactDisposition differs");
  if ((numericalDisposition === "pass") !== checkResults.every((entry) => entry.pass)) {
    fail("radial numerical disposition must pass iff both registered science checks pass");
  }
  if ((artifactDisposition === "valid") !== negativeControls.every((entry) => entry.pass)) {
    fail("radial artifact disposition must be valid iff all three registered controls pass");
  }
  return Object.freeze({
    schema: "phase10-c0v-radial-evaluation-v1",
    evaluationId: phase10C0VS6SafeToken(row.evaluationId, `${label}.evaluationId`),
    protocol,
    reference,
    witness,
    checkResults: Object.freeze(checkResults),
    negativeControls: Object.freeze(negativeControls),
    numericalDisposition,
    artifactDisposition,
    limits,
  });
}

export function parsePhase10C0VS6RadialEvaluationBytes(
  bytes: Uint8Array,
  packet: Phase10C0VS6PacketProtocol,
): Phase10C0VS6ParsedRadialEvaluationReceipt {
  return parsePhase10C0VS6RadialEvaluationReceipt(
    phase10C0VS6ParsePrettyJson(bytes, "radial evaluation bytes"),
    packet,
  );
}

export function writePhase10C0VRadialEvaluationReceipt(
  value: unknown,
  packet: Phase10C0VS6PacketProtocol,
): Uint8Array {
  return phase10C0VS6PrettyJsonBytes(parsePhase10C0VS6RadialEvaluationReceipt(value, packet));
}

export function phase10C0VS6RadialEvaluationIdentity(
  path: string,
  bytes: Uint8Array,
  packet: Phase10C0VS6PacketProtocol,
): Readonly<{ readonly identity: Phase10C0VS6ArtifactIdentity; readonly receipt: Phase10C0VS6ParsedRadialEvaluationReceipt }> {
  const receipt = parsePhase10C0VS6RadialEvaluationBytes(bytes, packet);
  return Object.freeze({ identity: phase10C0VS6ArtifactIdentity(path, bytes), receipt });
}
