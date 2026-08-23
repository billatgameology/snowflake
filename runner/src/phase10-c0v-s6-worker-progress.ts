import type { Phase10C0VS6WorkerProgressContract } from "./phase10-c0v-s6-contracts.ts";
import {
  parsePhase10C0VS6WorkerProgress,
  parsePhase10C0VS6WorkerProgressRecord,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6WorkerProgressBytes,
  phase10C0VS6SameIdentity,
  phase10C0VS6SameJson,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6AttemptRowV2,
  type Phase10C0VS6ExecutableInvocationRecord,
  type Phase10C0VS6PartialExecution,
  type Phase10C0VS6RegisteredExecutableInvocationRoster,
  type Phase10C0VS6WorkerProgress,
  type Phase10C0VS6WorkerProgressRecord,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6CreateExclusiveAppendFile,
  phase10C0VS6ReadUniquePhysicalFile,
  type Phase10C0VS6PhysicalRoot,
} from "./phase10-c0v-s6-filesystem.ts";

export interface Phase10C0VS6RegisteredCapProgressContext {
  readonly capId: string;
  readonly retainedCandidateBytes: number;
}

export interface Phase10C0VS6WorkerTimingAuthority {
  readonly workerStartedAt: string;
  readonly workerStoppedAt: string;
  readonly workerElapsedNanoseconds: number;
  readonly invocationRecords: readonly Phase10C0VS6ExecutableInvocationRecord[];
}

export interface Phase10C0VS6WorkerProgressEvaluation {
  readonly workerStartedAt: string;
  readonly workerStoppedAt: string;
  readonly workerWallSeconds: number;
  readonly invocationRecords: readonly Phase10C0VS6ExecutableInvocationRecord[];
  readonly startedCaseIds: readonly string[];
  readonly completedCaseIds: readonly string[];
  readonly activeCaseId: string | null;
  readonly completedNumericFieldValueCount: number;
  readonly completedUniformFieldValueCount: number;
  readonly candidateByteLength: number;
  readonly candidateSha256: string | null;
  readonly terminalState: "complete" | "registered-cap" | "infrastructure-failure";
  readonly partialExecution: Phase10C0VS6PartialExecution | null;
}

export interface Phase10C0VS6ClosedWorkerProgressEventLog {
  readonly progress: Phase10C0VS6WorkerProgress;
  readonly records: readonly Phase10C0VS6WorkerProgressRecord[];
  readonly bytes: Uint8Array;
  readonly identity: Phase10C0VS6ArtifactIdentity;
}

export interface Phase10C0VS6WorkerProgressEventLogWriter {
  readonly path: string;
  append(
    record: Phase10C0VS6WorkerProgressRecord,
    retainedCandidate?: Phase10C0VS6ArtifactIdentity,
  ): void;
  closeAndReopen(): Phase10C0VS6ClosedWorkerProgressEventLog;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 worker progress refused: ${message}`);
}

function exactRoster(actual: readonly string[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    fail(`${label} differs from protocol order`);
  }
}

function isPrefix(prefix: readonly string[], roster: readonly string[]): boolean {
  return prefix.length <= roster.length && prefix.every((entry, index) => entry === roster[index]);
}

function safeSum(values: readonly number[], label: string): number {
  const sum = values.reduce((total, value) => total + value, 0);
  if (!Number.isSafeInteger(sum)) fail(`${label} is not a safe integer`);
  return sum;
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function progressLineBytes(record: Phase10C0VS6WorkerProgressRecord, label: string): Uint8Array {
  const parsed = parsePhase10C0VS6WorkerProgressRecord(record, label);
  return phase10C0VS6WorkerProgressBytes(Object.freeze([parsed]));
}

function assertZeroWorkerStart(record: Phase10C0VS6WorkerProgressRecord): void {
  if (record.sequence !== 0 || record.event !== "worker-started" || record.invocationId !== null ||
    record.caseId !== null || record.startedCaseIds.length !== 0 || record.completedCaseIds.length !== 0 ||
    record.activeCaseId !== null || record.completedNumericFieldValueCount !== 0 ||
    record.completedUniformFieldValueCount !== 0 || record.candidateByteLength !== 0 ||
    record.candidateSha256 !== null || record.terminalState !== "running") {
    fail("worker progress append stream does not begin with the exact zero worker-started row");
  }
}

function activeInvocationId(
  records: readonly Phase10C0VS6WorkerProgressRecord[],
): string | null {
  let active: string | null = null;
  for (const record of records) {
    if (record.event === "invocation-started") active = record.invocationId;
    if (record.event === "invocation-finished") active = null;
  }
  return active;
}

function finalInvocationState(
  records: readonly Phase10C0VS6WorkerProgressRecord[],
): Phase10C0VS6ExecutableInvocationRecord["terminalState"] | "infrastructure-failure" | null {
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    if (record?.event === "invocation-finished") {
      return record.terminalState as Phase10C0VS6ExecutableInvocationRecord["terminalState"] | "infrastructure-failure";
    }
  }
  return null;
}

function assertProgressAppendTransition(
  records: readonly Phase10C0VS6WorkerProgressRecord[],
  record: Phase10C0VS6WorkerProgressRecord,
  retainedCandidate: Phase10C0VS6ArtifactIdentity | undefined,
  root: Phase10C0VS6PhysicalRoot,
): void {
  if (record.sequence !== records.length) {
    fail(`worker progress append sequence differs from contiguous index ${records.length}`);
  }
  const prior = records.at(-1);
  if (prior === undefined) {
    assertZeroWorkerStart(record);
    if (retainedCandidate !== undefined) fail("worker-started cannot retain a candidate");
    return;
  }
  if (prior.event === "worker-stopped") fail("worker progress append follows worker-stopped");
  if (record.event === "worker-started") fail("worker progress append repeats worker-started");
  if (Date.parse(record.observedAt) < Date.parse(prior.observedAt)) {
    fail("worker progress append UTC provenance moved backwards");
  }
  const active = activeInvocationId(records);
  if (record.event === "invocation-started") {
    if (active !== null) fail("worker progress append starts an invocation while another is open");
  } else if (record.event === "invocation-finished") {
    if (active === null || record.invocationId !== active) {
      fail("worker progress append does not exactly finish the active invocation");
    }
  } else if (record.event === "case-started" || record.event === "case-completed") {
    if (active === null || record.invocationId !== active) {
      fail("worker progress append case event lies outside its active invocation");
    }
  } else if (record.event === "worker-stopped") {
    const finishedState = finalInvocationState(records);
    if (active !== null || finishedState === null ||
      (record.terminalState !== finishedState && record.terminalState !== "infrastructure-failure")) {
      fail("worker progress append stop does not follow a closed invocation state");
    }
  }

  if (prior.candidateByteLength > 0 &&
    (record.candidateByteLength !== prior.candidateByteLength || record.candidateSha256 !== prior.candidateSha256)) {
    fail("worker progress append mutates or removes an already retained exact candidate");
  }
  const candidateBecameRetained = prior.candidateByteLength === 0 && record.candidateByteLength > 0;
  if (candidateBecameRetained) {
    if (record.event !== "invocation-finished" || retainedCandidate === undefined) {
      fail("worker progress candidate may become retained only on an invocation finish with a reopened identity");
    }
    const liveBytes = phase10C0VS6ReadUniquePhysicalFile(root, retainedCandidate.path);
    phase10C0VS6SameIdentity(
      phase10C0VS6ArtifactIdentity(retainedCandidate.path, liveBytes),
      retainedCandidate,
      "worker progress newly retained candidate",
    );
    if (record.candidateByteLength !== retainedCandidate.byteLength ||
      record.candidateSha256 !== retainedCandidate.sha256) {
      fail("worker progress candidate marker differs from its reopened retained identity");
    }
  } else if (retainedCandidate !== undefined) {
    fail("worker progress retained-candidate identity was supplied outside its sole zero-to-present transition");
  }

  if (record.event === "case-started") {
    if (record.startedCaseIds.length !== prior.startedCaseIds.length + 1 ||
      !isPrefix(prior.startedCaseIds, record.startedCaseIds) ||
      record.completedCaseIds.length !== prior.completedCaseIds.length ||
      !isPrefix(prior.completedCaseIds, record.completedCaseIds) ||
      record.caseId !== record.activeCaseId || record.caseId !== record.startedCaseIds.at(-1) ||
      record.completedNumericFieldValueCount !== prior.completedNumericFieldValueCount) {
      fail("worker progress append case-start transition differs");
    }
  } else if (record.event === "case-completed") {
    if (record.startedCaseIds.length !== prior.startedCaseIds.length ||
      !isPrefix(prior.startedCaseIds, record.startedCaseIds) ||
      record.completedCaseIds.length !== prior.completedCaseIds.length + 1 ||
      !isPrefix(prior.completedCaseIds, record.completedCaseIds) ||
      prior.activeCaseId !== record.caseId || record.caseId !== record.completedCaseIds.at(-1) ||
      record.activeCaseId !== null) {
      fail("worker progress append case-complete transition differs");
    }
  } else if (record.startedCaseIds.length !== prior.startedCaseIds.length ||
    !isPrefix(prior.startedCaseIds, record.startedCaseIds) ||
    record.completedCaseIds.length !== prior.completedCaseIds.length ||
    !isPrefix(prior.completedCaseIds, record.completedCaseIds) || record.activeCaseId !== prior.activeCaseId ||
    record.completedNumericFieldValueCount !== prior.completedNumericFieldValueCount ||
    record.completedUniformFieldValueCount !== prior.completedUniformFieldValueCount) {
    fail("worker progress append changes case progress outside a case transition");
  }
}

/**
 * Opens an absent parent-owned progress JSONL and fsyncs every structured boundary. The optional
 * retained-candidate operand is accepted only on the sole zero-to-present marker transition and
 * is physically reopened before that row is appended.
 */
export function phase10C0VS6CreateWorkerProgressEventLog(
  root: Phase10C0VS6PhysicalRoot,
  path: string,
  workerStarted: Phase10C0VS6WorkerProgressRecord,
): Phase10C0VS6WorkerProgressEventLogWriter {
  const first = parsePhase10C0VS6WorkerProgressRecord(workerStarted, "worker progress append event[0]");
  assertProgressAppendTransition(Object.freeze([]), first, undefined, root);
  const records: Phase10C0VS6WorkerProgressRecord[] = [first];
  const file = phase10C0VS6CreateExclusiveAppendFile(
    root,
    path,
    progressLineBytes(first, "worker progress append event[0]"),
  );
  let closed = false;

  const append = (
    supplied: Phase10C0VS6WorkerProgressRecord,
    retainedCandidate?: Phase10C0VS6ArtifactIdentity,
  ): void => {
    if (closed) fail("worker progress event log is closed");
    const parsed = parsePhase10C0VS6WorkerProgressRecord(
      supplied,
      `worker progress append event[${records.length}]`,
    );
    assertProgressAppendTransition(records, parsed, retainedCandidate, root);
    file.append(progressLineBytes(parsed, `worker progress append event[${records.length}]`));
    records.push(parsed);
  };

  const closeAndReopen = (): Phase10C0VS6ClosedWorkerProgressEventLog => {
    if (closed) fail("worker progress event log is already closed");
    const closedFile = file.closeAndReopen();
    closed = true;
    const progress = parsePhase10C0VS6WorkerProgress(Object.freeze({
      artifact: closedFile.identity,
      records: Object.freeze(records),
    }), "closed worker progress event log");
    const expectedBytes = phase10C0VS6WorkerProgressBytes(progress.records);
    if (!sameBytes(closedFile.bytes, expectedBytes)) {
      fail("closed worker progress event log differs from appended structured rows");
    }
    return Object.freeze({
      progress,
      records: progress.records,
      bytes: new Uint8Array(closedFile.bytes),
      identity: closedFile.identity,
    });
  };

  return Object.freeze({ path: file.path, append, closeAndReopen });
}

/** Strict immutable reopen used after the parent-owned progress stream has been sealed. */
export function phase10C0VS6ReopenWorkerProgressEventLog(
  root: Phase10C0VS6PhysicalRoot,
  expected: Phase10C0VS6ArtifactIdentity,
): Phase10C0VS6ClosedWorkerProgressEventLog {
  const bytes = phase10C0VS6ReadUniquePhysicalFile(root, expected.path);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(expected.path, bytes),
    expected,
    "immutable worker progress event log",
  );
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("immutable worker progress event log is not UTF-8");
  }
  if (text.length === 0 || !text.endsWith("\n") || text.includes("\r") || text.endsWith("\n\n")) {
    fail("immutable worker progress event log is not compact LF JSONL");
  }
  const records = text.slice(0, -1).split("\n").map((line, index) => {
    let value: unknown;
    try {
      value = JSON.parse(line) as unknown;
    } catch {
      fail(`immutable worker progress event log row ${index} is not JSON`);
    }
    return parsePhase10C0VS6WorkerProgressRecord(value, `immutable worker progress event log row[${index}]`);
  });
  const progress = parsePhase10C0VS6WorkerProgress(Object.freeze({ artifact: expected, records }),
    "immutable worker progress event log");
  return Object.freeze({ progress, records: progress.records, bytes: new Uint8Array(bytes), identity: expected });
}

function invocationPairs(
  records: readonly Phase10C0VS6WorkerProgressRecord[],
): readonly { readonly started: Phase10C0VS6WorkerProgressRecord; readonly finished: Phase10C0VS6WorkerProgressRecord }[] {
  const pairs: Array<{ readonly started: Phase10C0VS6WorkerProgressRecord; readonly finished: Phase10C0VS6WorkerProgressRecord }> = [];
  let started: Phase10C0VS6WorkerProgressRecord | null = null;
  for (const record of records) {
    if (record.event === "invocation-started") started = record;
    if (record.event === "invocation-finished") {
      if (started === null || started.invocationId !== record.invocationId) {
        fail("invocation finish does not match its start");
      }
      pairs.push(Object.freeze({ started, finished: record }));
      started = null;
    }
  }
  if (started !== null) fail("worker progress ends with an open invocation");
  return Object.freeze(pairs);
}

export function phase10C0VS6VerifyRawWorkerProgress(
  rawBytes: Uint8Array,
  progress: Phase10C0VS6WorkerProgress,
): void {
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(progress.artifact.path, rawBytes),
    progress.artifact,
    "raw worker progress",
  );
}

export function independentlyEvaluatePhase10C0VS6WorkerProgress(
  attempt: Phase10C0VS6AttemptRowV2,
  contract: Phase10C0VS6WorkerProgressContract,
  invocationRoster: Phase10C0VS6RegisteredExecutableInvocationRoster,
  workerTiming: Phase10C0VS6WorkerTimingAuthority,
  capContext: Phase10C0VS6RegisteredCapProgressContext | null,
): Phase10C0VS6WorkerProgressEvaluation {
  const progress = attempt.workerProgress;
  if (progress === null) fail("solver attempt lacks embedded worker progress");
  if (!progress.artifact.path.endsWith(`/${contract.filename}`)) {
    fail("worker progress artifact path differs from protocol filename");
  }
  const records = progress.records;
  for (const record of records) {
    if (!isPrefix(record.startedCaseIds, contract.caseOrder) ||
      !isPrefix(record.completedCaseIds, record.startedCaseIds)) {
      fail(`worker progress row ${record.sequence} has a non-prefix case roster`);
    }
    const completedCount = record.completedCaseIds.length;
    const expectedFieldCount = safeSum(
      contract.completedFieldValueCounts.slice(0, completedCount),
      `worker progress row ${record.sequence} field count`,
    );
    if (record.completedNumericFieldValueCount !== expectedFieldCount ||
      record.completedUniformFieldValueCount !== expectedFieldCount) {
      fail(`worker progress row ${record.sequence} field counts differ from completed cases`);
    }
    if ((record.event === "case-started" || record.event === "case-completed") &&
      record.invocationId !== invocationRoster.invocations.find(
        (invocation) => invocation.invocationClass === "solver-production",
      )?.invocationId) {
      fail(`worker progress row ${record.sequence} case event is outside solver production`);
    }
  }
  const pairs = invocationPairs(records);
  if (pairs.length !== attempt.executableInvocationRecords.length ||
    pairs.length !== invocationRoster.invocations.length) {
    fail("worker progress invocation pairs differ from attempt/protocol roster length");
  }
  for (const [index, pair] of pairs.entries()) {
    const actual = attempt.executableInvocationRecords[index];
    const authority = invocationRoster.invocations[index];
    if (actual === undefined || authority === undefined ||
      pair.started.invocationId !== authority.invocationId ||
      pair.finished.invocationId !== authority.invocationId ||
      actual.invocationId !== authority.invocationId ||
      actual.startedAt !== pair.started.observedAt || actual.finishedAt !== pair.finished.observedAt ||
      actual.terminalState !== pair.finished.terminalState) {
      fail(`worker progress invocation pair ${index} differs from attempt/protocol records`);
    }
  }
  const workerStarted = records[0] as Phase10C0VS6WorkerProgressRecord;
  const workerStopped = records.at(-1) as Phase10C0VS6WorkerProgressRecord;
  if (workerStarted.observedAt !== workerTiming.workerStartedAt ||
    workerStopped.observedAt !== workerTiming.workerStoppedAt) {
    fail("worker progress UTC provenance differs from the raw worker invocation boundaries");
  }
  phase10C0VS6SameJson(
    attempt.executableInvocationRecords,
    workerTiming.invocationRecords,
    "worker progress versus raw parent-owned invocation timing",
  );
  const governedInvocationElapsedNanoseconds = safeSum(
    attempt.executableInvocationRecords.map((invocation) => invocation.elapsedNanoseconds),
    "governed invocation elapsed nanoseconds",
  );
  if (governedInvocationElapsedNanoseconds > workerTiming.workerElapsedNanoseconds ||
    attempt.executableInvocationRecords.some((invocation) =>
      Date.parse(invocation.startedAt) < Date.parse(workerStarted.observedAt) ||
      Date.parse(invocation.finishedAt) > Date.parse(workerStopped.observedAt))) {
    fail("governed invocation timing lies outside the enclosing worker progress interval");
  }
  const workerWallSeconds = workerTiming.workerElapsedNanoseconds / 1_000_000_000;
  const final = workerStopped;
  if (final.terminalState === "infrastructure-failure") {
    fail("claim-bearing worker progress ends in infrastructure failure");
  }
  const capInvocations = attempt.executableInvocationRecords.filter(
    (invocation) => invocation.terminalState === "registered-cap",
  );
  let partialExecution: Phase10C0VS6PartialExecution | null = null;
  if (attempt.dispositionCode === "registered-cap-resource-refusal") {
    if (capContext === null || capInvocations.length !== 1 || final.terminalState !== "registered-cap") {
      fail("registered-cap progress lacks its exact cap context/invocation/terminal state");
    }
    const capped = capInvocations[0] as Phase10C0VS6ExecutableInvocationRecord;
    if (capped.invocationClass === "route-cause-evaluator") {
      fail("registered-cap progress cannot identify a route-cause evaluator as the capped worker leaf");
    }
    partialExecution = Object.freeze({
      capId: capContext.capId,
      registeredLimit: capped.registeredWallSecondsMaximum,
      observedValue: capped.wallSeconds,
      unit: "seconds",
      cappedInvocationId: capped.invocationId,
      cappedInvocationClass: capped.invocationClass,
      invocationStartedAt: capped.startedAt,
      invocationStoppedAt: capped.finishedAt,
      invocationElapsedNanoseconds: capped.elapsedNanoseconds,
      rosterCaseIds: Object.freeze([...contract.caseOrder]),
      startedCaseIds: final.startedCaseIds,
      completedCaseIds: final.completedCaseIds,
      activeCaseId: final.activeCaseId,
      completedNumericFieldValueCount: final.completedNumericFieldValueCount,
      completedUniformFieldValueCount: final.completedUniformFieldValueCount,
      retainedCandidateBytes: capContext.retainedCandidateBytes,
      acceptedValidWitnessProduced: false,
    });
  } else if (capContext !== null || capInvocations.length !== 0 || final.terminalState === "registered-cap") {
    fail("non-cap progress contains cap context, invocation, or terminal state");
  }
  return Object.freeze({
    workerStartedAt: workerStarted.observedAt,
    workerStoppedAt: workerStopped.observedAt,
    workerWallSeconds,
    invocationRecords: attempt.executableInvocationRecords,
    startedCaseIds: final.startedCaseIds,
    completedCaseIds: final.completedCaseIds,
    activeCaseId: final.activeCaseId,
    completedNumericFieldValueCount: final.completedNumericFieldValueCount,
    completedUniformFieldValueCount: final.completedUniformFieldValueCount,
    candidateByteLength: final.candidateByteLength,
    candidateSha256: final.candidateSha256,
    terminalState: final.terminalState as "complete" | "registered-cap" | "infrastructure-failure",
    partialExecution,
  });
}
