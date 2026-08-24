import { strictJsonSnapshot } from "./gate4-evidence.ts";
import type {
  Phase10C0VS6ExecutableInvocationAuthority,
  Phase10C0VS6ExecutableInvocationRoster,
  Phase10C0VS6PacketVerificationInvocationAuthority,
  Phase10C0VS6PacketVerificationInvocationClass,
  Phase10C0VS6PacketProtocol,
  Phase10C0VS6WorkerInvocationContract,
} from "./phase10-c0v-s6-contracts.ts";
import {
  parsePhase10C0VS6ExecutableInvocationRecords,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6ExactOrderedKeys,
  phase10C0VS6IsoInstant,
  phase10C0VS6NonnegativeSafeInteger,
  phase10C0VS6Object,
  phase10C0VS6SafeToken,
  phase10C0VS6SameIdentity,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6ExecutableInvocationClass,
  type Phase10C0VS6ExecutableInvocationRecord,
  type Phase10C0VS6ExecutableInvocationTerminalState,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6CreateExclusiveAppendFile,
  phase10C0VS6ReadUniquePhysicalFile,
  type Phase10C0VS6PhysicalRoot,
} from "./phase10-c0v-s6-filesystem.ts";

export type Phase10C0VS6WorkerInvocationEvent =
  | "worker-started"
  | "invocation-started"
  | "invocation-finished"
  | "worker-stopped";

export interface Phase10C0VS6WorkerInvocationEventRecord {
  readonly schema: "phase10-c0v-worker-invocation-row-v1";
  readonly sequence: number;
  readonly observedAt: string;
  readonly monotonicOffsetNanoseconds: number;
  readonly event: Phase10C0VS6WorkerInvocationEvent;
  readonly invocationId: string | null;
  readonly callableId: string | null;
  readonly negativeControlId: string | null;
  readonly invocationClass:
    | Phase10C0VS6ExecutableInvocationClass
    | Phase10C0VS6PacketVerificationInvocationClass
    | null;
  readonly registeredWallSecondsMaximum: 300 | 14400 | null;
  readonly terminalState: "running" | Phase10C0VS6ExecutableInvocationTerminalState;
}

export interface Phase10C0VS6WorkerInvocationEvaluation {
  readonly workerStartedAt: string;
  readonly workerStoppedAt: string;
  readonly workerElapsedNanoseconds: number;
  readonly workerWallSeconds: number;
  readonly eventRecords: readonly Phase10C0VS6WorkerInvocationEventRecord[];
  readonly invocationRecords: readonly Phase10C0VS6ExecutableInvocationRecord[];
  readonly terminalState: Phase10C0VS6ExecutableInvocationTerminalState;
}

export interface Phase10C0VS6PacketWorkerInvocationRecord {
  readonly invocationId: string;
  readonly callableId: string;
  readonly negativeControlId: string | null;
  readonly invocationClass: Phase10C0VS6PacketVerificationInvocationClass;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly elapsedNanoseconds: number;
  readonly wallSeconds: number;
  readonly registeredWallSecondsMaximum: 14400;
  readonly terminalState: "complete" | "registered-cap";
}

export interface Phase10C0VS6PacketWorkerInvocationEvaluation {
  readonly workerStartedAt: string;
  readonly workerStoppedAt: string;
  readonly workerElapsedNanoseconds: number;
  readonly workerWallSeconds: number;
  readonly eventRecords: readonly Phase10C0VS6WorkerInvocationEventRecord[];
  readonly invocationRecords: readonly Phase10C0VS6PacketWorkerInvocationRecord[];
  readonly terminalState: "complete" | "registered-cap";
}

export interface Phase10C0VS6ClosedWorkerInvocationEventLog {
  readonly records: readonly Phase10C0VS6WorkerInvocationEventRecord[];
  readonly bytes: Uint8Array;
  readonly identity: Phase10C0VS6ArtifactIdentity;
}

export interface Phase10C0VS6WorkerInvocationEventLogWriter {
  readonly path: string;
  append(record: Phase10C0VS6WorkerInvocationEventRecord): void;
  closeAndReopen(): Phase10C0VS6ClosedWorkerInvocationEventLog;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 worker invocation refused: ${message}`);
}

function sameInvocationAuthority(
  record: Phase10C0VS6WorkerInvocationEventRecord,
  expected: Phase10C0VS6ExecutableInvocationAuthority | Phase10C0VS6PacketVerificationInvocationAuthority,
  label: string,
): void {
  if (record.invocationId !== expected.invocationId || record.callableId !== expected.callableId ||
    record.negativeControlId !== expected.negativeControlId ||
    record.invocationClass !== expected.invocationClass ||
    record.registeredWallSecondsMaximum !== expected.registeredWallSecondsMaximum) {
    fail(`${label} differs from the exact protocol invocation`);
  }
}

function parseEventRecord(
  value: unknown,
  contract: Phase10C0VS6WorkerInvocationContract,
  label: string,
): Phase10C0VS6WorkerInvocationEventRecord {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, contract.exactFields, label);
  if (row.schema !== contract.rowSchema) fail(`${label}.schema differs from protocol`);
  const event = row.event === "worker-started" || row.event === "invocation-started" ||
    row.event === "invocation-finished" || row.event === "worker-stopped"
    ? row.event
    : fail(`${label}.event differs from the exact enum`);
  const invocationId = row.invocationId === null
    ? null
    : phase10C0VS6SafeToken(row.invocationId, `${label}.invocationId`);
  const callableId = row.callableId === null
    ? null
    : phase10C0VS6SafeToken(row.callableId, `${label}.callableId`);
  const negativeControlId = row.negativeControlId === null
    ? null
    : phase10C0VS6SafeToken(row.negativeControlId, `${label}.negativeControlId`);
  const invocationClass = row.invocationClass === null
    ? null
    : row.invocationClass === "solver-production" || row.invocationClass === "numerical-evaluator" ||
      row.invocationClass === "numerical-negative-control" || row.invocationClass === "route-cause-evaluator" ||
      row.invocationClass === "packet-producer" || row.invocationClass === "packet-evaluator" ||
      row.invocationClass === "packet-negative-control"
      ? row.invocationClass
      : fail(`${label}.invocationClass differs from the exact enum`);
  const registeredWallSecondsMaximum = row.registeredWallSecondsMaximum === null
    ? null
    : phase10C0VS6NonnegativeSafeInteger(
      row.registeredWallSecondsMaximum,
      `${label}.registeredWallSecondsMaximum`,
    );
  if (registeredWallSecondsMaximum !== null && registeredWallSecondsMaximum !== 300 &&
    registeredWallSecondsMaximum !== 14_400) {
    fail(`${label}.registeredWallSecondsMaximum differs from the exact caps`);
  }
  const terminalState = row.terminalState === "running" || row.terminalState === "complete" ||
    row.terminalState === "registered-cap" || row.terminalState === "infrastructure-failure"
    ? row.terminalState
    : fail(`${label}.terminalState differs from the exact enum`);
  const boundary = event === "worker-started" || event === "worker-stopped";
  if (boundary !== (invocationId === null && callableId === null && negativeControlId === null &&
    invocationClass === null && registeredWallSecondsMaximum === null)) {
    fail(`${label} boundary/invocation null rule differs`);
  }
  if ((event === "worker-started" || event === "invocation-started") !==
    (terminalState === "running")) {
    fail(`${label} event terminal-state rule differs`);
  }
  if (!boundary && (((invocationClass === "numerical-negative-control" ||
    invocationClass === "packet-negative-control")) !==
    (negativeControlId !== null))) {
    fail(`${label}.negativeControlId null rule differs`);
  }
  const monotonicOffsetNanoseconds = phase10C0VS6NonnegativeSafeInteger(
    row.monotonicOffsetNanoseconds,
    `${label}.monotonicOffsetNanoseconds`,
  );
  if (event === "worker-started" && monotonicOffsetNanoseconds !== 0) {
    fail(`${label}.monotonicOffsetNanoseconds must be exact zero at worker start`);
  }
  return Object.freeze({
    schema: "phase10-c0v-worker-invocation-row-v1",
    sequence: phase10C0VS6NonnegativeSafeInteger(row.sequence, `${label}.sequence`),
    observedAt: phase10C0VS6IsoInstant(row.observedAt, `${label}.observedAt`),
    monotonicOffsetNanoseconds,
    event,
    invocationId,
    callableId,
    negativeControlId,
    invocationClass,
    registeredWallSecondsMaximum: registeredWallSecondsMaximum as 300 | 14400 | null,
    terminalState,
  });
}

function eventLineBytes(
  record: Phase10C0VS6WorkerInvocationEventRecord,
  contract: Phase10C0VS6WorkerInvocationContract,
  label: string,
): Uint8Array {
  const parsed = parseEventRecord(record, contract, label);
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(parsed))}\n`);
}

function sameInvocationBoundary(
  started: Phase10C0VS6WorkerInvocationEventRecord,
  finished: Phase10C0VS6WorkerInvocationEventRecord,
): boolean {
  return started.invocationId === finished.invocationId && started.callableId === finished.callableId &&
    started.negativeControlId === finished.negativeControlId &&
    started.invocationClass === finished.invocationClass &&
    started.registeredWallSecondsMaximum === finished.registeredWallSecondsMaximum;
}

function assertAppendTransition(
  records: readonly Phase10C0VS6WorkerInvocationEventRecord[],
  record: Phase10C0VS6WorkerInvocationEventRecord,
): void {
  const index = records.length;
  if (record.sequence !== index) fail(`append event sequence must be exact contiguous index ${index}`);
  if (index === 0) {
    if (record.event !== "worker-started") fail("append event stream must start with worker-started");
    return;
  }
  const previous = records[index - 1]!;
  if (Date.parse(record.observedAt) < Date.parse(previous.observedAt) ||
    record.monotonicOffsetNanoseconds < previous.monotonicOffsetNanoseconds) {
    fail("append event UTC provenance or monotonic offset moved backwards");
  }
  if (previous.event === "worker-stopped") fail("append event follows terminal worker-stopped boundary");
  if (previous.event === "invocation-started") {
    if (record.event !== "invocation-finished" || !sameInvocationBoundary(previous, record)) {
      fail("append event does not exactly finish the active invocation");
    }
    return;
  }
  if (record.event !== "invocation-started" && record.event !== "worker-stopped") {
    fail("append event must start an invocation or stop the worker after a closed boundary");
  }
  if (previous.event === "worker-started" && record.event === "worker-stopped" &&
    record.terminalState !== "infrastructure-failure") {
    fail("worker stopped before its first invocation without infrastructure-failure state");
  }
  if (previous.event === "invocation-finished") {
    if (record.event === "invocation-started" && previous.terminalState !== "complete") {
      fail("append event starts work after a non-complete invocation");
    }
    if (record.event === "worker-stopped" && record.terminalState !== previous.terminalState &&
      record.terminalState !== "infrastructure-failure") {
      fail("worker stop state differs from its final invocation state without an infrastructure failure");
    }
  }
}

function assertAppendValidRecords(
  records: readonly Phase10C0VS6WorkerInvocationEventRecord[],
): void {
  const accepted: Phase10C0VS6WorkerInvocationEventRecord[] = [];
  for (const record of records) {
    assertAppendTransition(accepted, record);
    accepted.push(record);
  }
}

export function phase10C0VS6WorkerInvocationEventBytes(
  records: readonly Phase10C0VS6WorkerInvocationEventRecord[],
  contract: Phase10C0VS6WorkerInvocationContract,
): Uint8Array {
  if (records.length === 0) fail("event roster must not be empty");
  const lines = records.map((record, index) => JSON.stringify(strictJsonSnapshot(
    parseEventRecord(record, contract, `worker invocation event[${index}]`),
  )));
  return new TextEncoder().encode(`${lines.join("\n")}\n`);
}

/**
 * Opens the parent-owned JSONL stream by durably writing its required worker-started row. Each
 * subsequent append validates the exact compact row, contiguous sequence, monotonic order, and
 * invocation boundary transition before the fsynced bytes become visible. Existing files are
 * never resumed by current-v1 execution.
 */
export function phase10C0VS6CreateWorkerInvocationEventLog(
  root: Phase10C0VS6PhysicalRoot,
  path: string,
  contract: Phase10C0VS6WorkerInvocationContract,
  workerStarted: Phase10C0VS6WorkerInvocationEventRecord,
): Phase10C0VS6WorkerInvocationEventLogWriter {
  const first = parseEventRecord(workerStarted, contract, "worker invocation append event[0]");
  assertAppendTransition(Object.freeze([]), first);
  const records: Phase10C0VS6WorkerInvocationEventRecord[] = [first];
  const file = phase10C0VS6CreateExclusiveAppendFile(
    root,
    path,
    eventLineBytes(first, contract, "worker invocation append event[0]"),
  );
  let closed = false;

  const append = (supplied: Phase10C0VS6WorkerInvocationEventRecord): void => {
    if (closed) fail("worker invocation event log is closed");
    const parsed = parseEventRecord(
      supplied,
      contract,
      `worker invocation append event[${records.length}]`,
    );
    assertAppendTransition(records, parsed);
    file.append(eventLineBytes(parsed, contract, `worker invocation append event[${records.length}]`));
    records.push(parsed);
  };

  const closeAndReopen = (): Phase10C0VS6ClosedWorkerInvocationEventLog => {
    if (closed) fail("worker invocation event log is already closed");
    const closedFile = file.closeAndReopen();
    closed = true;
    const reopened = parsePhase10C0VS6WorkerInvocationEventBytes(closedFile.bytes, contract);
    assertAppendValidRecords(reopened);
    if (reopened.length !== records.length || reopened.some((entry, index) =>
      JSON.stringify(entry) !== JSON.stringify(records[index]))) {
      fail("closed worker invocation event log differs from appended structured rows");
    }
    return Object.freeze({
      records: reopened,
      bytes: new Uint8Array(closedFile.bytes),
      identity: closedFile.identity,
    });
  };

  return Object.freeze({ path: file.path, append, closeAndReopen });
}

/** Strict immutable reopen used after the writer has sealed and retained its exact identity. */
export function phase10C0VS6ReopenWorkerInvocationEventLog(
  root: Phase10C0VS6PhysicalRoot,
  expected: Phase10C0VS6ArtifactIdentity,
  contract: Phase10C0VS6WorkerInvocationContract,
): Phase10C0VS6ClosedWorkerInvocationEventLog {
  const bytes = phase10C0VS6ReadUniquePhysicalFile(root, expected.path);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(expected.path, bytes),
    expected,
    "immutable worker invocation event log",
  );
  const records = parsePhase10C0VS6WorkerInvocationEventBytes(bytes, contract);
  assertAppendValidRecords(records);
  return Object.freeze({ records, bytes: new Uint8Array(bytes), identity: expected });
}

export function parsePhase10C0VS6WorkerInvocationEventBytes(
  bytes: Uint8Array,
  contract: Phase10C0VS6WorkerInvocationContract,
): readonly Phase10C0VS6WorkerInvocationEventRecord[] {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("event bytes are not valid UTF-8");
  }
  if (text.length === 0 || !text.endsWith("\n") || text.includes("\r") || text.endsWith("\n\n")) {
    fail("event bytes must be nonempty compact JSONL with one terminal LF");
  }
  const lines = text.slice(0, -1).split("\n");
  const records = lines.map((line, index) => {
    let value: unknown;
    try {
      value = JSON.parse(line) as unknown;
    } catch {
      fail(`event line ${index} is not JSON`);
    }
    const record = parseEventRecord(value, contract, `worker invocation event[${index}]`);
    if (line !== JSON.stringify(strictJsonSnapshot(record))) {
      fail(`event line ${index} is not exact compact JSON`);
    }
    return record;
  });
  return Object.freeze(records);
}

export function independentlyEvaluatePhase10C0VS6WorkerInvocations(
  bytes: Uint8Array,
  packet: Pick<
    Phase10C0VS6PacketProtocol,
    "workerInvocationContract" | "executableInvocationRosters"
  >,
  tupleId: string,
  verifierEpochMs: number,
): Phase10C0VS6WorkerInvocationEvaluation {
  if (!Number.isSafeInteger(verifierEpochMs) || verifierEpochMs < 0) {
    fail("verifier clock must be a nonnegative epoch-millisecond safe integer");
  }
  const rosters = packet.executableInvocationRosters.filter((entry) => entry.tupleId === tupleId);
  if (rosters.length !== 1 || rosters[0]!.invocations.length === 0) {
    fail("tuple must resolve exactly one nonempty worker invocation roster");
  }
  const roster: Phase10C0VS6ExecutableInvocationRoster = rosters[0]!;
  const records = parsePhase10C0VS6WorkerInvocationEventBytes(bytes, packet.workerInvocationContract);
  if (records.length !== 2 + 2 * roster.invocations.length ||
    records[0]?.event !== "worker-started" || records.at(-1)?.event !== "worker-stopped") {
    fail("event sequence does not contain exact worker boundaries and invocation pairs");
  }
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index]!;
    if (record.sequence !== index || (index > 0 &&
      (Date.parse(record.observedAt) < Date.parse(records[index - 1]!.observedAt) ||
        record.monotonicOffsetNanoseconds < records[index - 1]!.monotonicOffsetNanoseconds))) {
      fail("event sequence/UTC-provenance/monotonic order differs");
    }
    if (Date.parse(record.observedAt) > verifierEpochMs) {
      fail("event timestamp lies in the verifier's future");
    }
  }
  const invocationValues = roster.invocations.map((authority, index) => {
    const started = records[1 + 2 * index]!;
    const finished = records[2 + 2 * index]!;
    if (started.event !== "invocation-started" || finished.event !== "invocation-finished") {
      fail(`invocation ${index} is not an exact adjacent start/finish pair`);
    }
    sameInvocationAuthority(started, authority, `invocation ${index} start`);
    sameInvocationAuthority(finished, authority, `invocation ${index} finish`);
    if (finished.terminalState !== authority.terminalState) {
      fail(`invocation ${index} terminal state differs from tuple authority`);
    }
    const elapsedNanoseconds = finished.monotonicOffsetNanoseconds - started.monotonicOffsetNanoseconds;
    if (!Number.isSafeInteger(elapsedNanoseconds) || elapsedNanoseconds < 0) {
      fail(`invocation ${index} monotonic elapsed nanoseconds are invalid`);
    }
    const maximumNanoseconds = authority.registeredWallSecondsMaximum * 1_000_000_000;
    if (authority.terminalState === "registered-cap"
      ? elapsedNanoseconds <= maximumNanoseconds
      : elapsedNanoseconds > maximumNanoseconds) {
      fail(`invocation ${index} monotonic duration disagrees with its strict cap state`);
    }
    return {
      invocationId: authority.invocationId,
      callableId: authority.callableId,
      negativeControlId: authority.negativeControlId,
      invocationClass: authority.invocationClass,
      startedAt: started.observedAt,
      finishedAt: finished.observedAt,
      elapsedNanoseconds,
      wallSeconds: elapsedNanoseconds / 1_000_000_000,
      registeredWallSecondsMaximum: authority.registeredWallSecondsMaximum,
      terminalState: authority.terminalState,
    };
  });
  const invocationRecords = parsePhase10C0VS6ExecutableInvocationRecords(
    invocationValues,
    "worker invocation derived records",
  );
  const workerStartedAt = records[0]!.observedAt;
  const workerStoppedAt = records.at(-1)!.observedAt;
  const workerElapsedNanoseconds = records.at(-1)!.monotonicOffsetNanoseconds -
    records[0]!.monotonicOffsetNanoseconds;
  const terminalState = records.at(-1)!.terminalState;
  if (terminalState === "running" || terminalState !== invocationRecords.at(-1)!.terminalState ||
    Date.parse(invocationRecords[0]!.startedAt) < Date.parse(workerStartedAt) ||
    Date.parse(invocationRecords.at(-1)!.finishedAt) > Date.parse(workerStoppedAt)) {
    fail("worker boundary state/timing differs from its invocation roster");
  }
  return Object.freeze({
    workerStartedAt,
    workerStoppedAt,
    workerElapsedNanoseconds,
    workerWallSeconds: workerElapsedNanoseconds / 1_000_000_000,
    eventRecords: records,
    invocationRecords,
    terminalState,
  });
}

/**
 * Re-derives nonproduce packet timing from the parent-owned JSONL stream. The selected subroute
 * is used only as a lookup into frozen protocol authority: normal completion requires the full
 * verification roster; a registered-cap subroute requires the exact prefix ending at its one
 * bound invocation. No terminal-receipt field participates, preserving the candidate -> terminal
 * one-way construction order.
 */
export function independentlyEvaluatePhase10C0VS6PacketWorkerInvocations(
  bytes: Uint8Array,
  packet: Pick<
    Phase10C0VS6PacketProtocol,
    "workerInvocationContract" | "verificationInvocationRoster" |
    "verificationRegisteredCapBindings" | "terminalSubroutes"
  >,
  selectedSubrouteId: string,
  verifierEpochMs: number,
): Phase10C0VS6PacketWorkerInvocationEvaluation {
  if (!Number.isSafeInteger(verifierEpochMs) || verifierEpochMs < 0) {
    fail("verifier clock must be a nonnegative epoch-millisecond safe integer");
  }
  const subroutes = packet.terminalSubroutes.filter((entry) => entry.subrouteId === selectedSubrouteId);
  if (subroutes.length !== 1) fail("packet subroute does not resolve exactly once");
  const subroute = subroutes[0]!;
  let roster: readonly Phase10C0VS6PacketVerificationInvocationAuthority[];
  let expectedStates: readonly ("complete" | "registered-cap")[];
  if (subroute.dispositionCode === null) {
    roster = packet.verificationInvocationRoster;
    expectedStates = Object.freeze(roster.map(() => "complete" as const));
  } else if (subroute.dispositionCode === "registered-cap-resource-refusal") {
    const bindings = packet.verificationRegisteredCapBindings.filter(
      (entry) => subroute.classificationConditionIds.includes(entry.conditionId),
    );
    if (bindings.length !== 1) fail("packet cap subroute does not resolve one timing binding");
    const cappedIndex = packet.verificationInvocationRoster.findIndex(
      (entry) => entry.invocationId === bindings[0]!.invocationId,
    );
    if (cappedIndex < 0) fail("packet cap binding names an absent invocation");
    roster = Object.freeze(packet.verificationInvocationRoster.slice(0, cappedIndex + 1));
    expectedStates = Object.freeze(roster.map((_entry, index) =>
      index === cappedIndex ? "registered-cap" as const : "complete" as const));
  } else {
    fail("packet worker timing is not authorized for this subroute");
  }
  if (roster.length === 0) fail("packet worker timing roster must not be empty");
  const records = parsePhase10C0VS6WorkerInvocationEventBytes(bytes, packet.workerInvocationContract);
  if (records.length !== 2 + 2 * roster.length || records[0]?.event !== "worker-started" ||
    records.at(-1)?.event !== "worker-stopped") {
    fail("packet event sequence does not contain exact worker boundaries and invocation pairs");
  }
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index]!;
    if (record.sequence !== index || (index > 0 &&
      (Date.parse(record.observedAt) < Date.parse(records[index - 1]!.observedAt) ||
        record.monotonicOffsetNanoseconds < records[index - 1]!.monotonicOffsetNanoseconds)) ||
      Date.parse(record.observedAt) > verifierEpochMs) {
      fail("packet event sequence/timestamp order differs or lies in the verifier future");
    }
  }
  const invocationRecords = roster.map((authority, index): Phase10C0VS6PacketWorkerInvocationRecord => {
    const started = records[1 + 2 * index]!;
    const finished = records[2 + 2 * index]!;
    if (started.event !== "invocation-started" || finished.event !== "invocation-finished") {
      fail(`packet invocation ${index} is not an exact adjacent start/finish pair`);
    }
    sameInvocationAuthority(started, authority, `packet invocation ${index} start`);
    sameInvocationAuthority(finished, authority, `packet invocation ${index} finish`);
    const terminalState = expectedStates[index]!;
    if (finished.terminalState !== terminalState) {
      fail(`packet invocation ${index} terminal state differs from subroute authority`);
    }
    const elapsedNanoseconds = finished.monotonicOffsetNanoseconds - started.monotonicOffsetNanoseconds;
    if (!Number.isSafeInteger(elapsedNanoseconds) || elapsedNanoseconds < 0) {
      fail(`packet invocation ${index} monotonic elapsed nanoseconds are invalid`);
    }
    const wallSeconds = elapsedNanoseconds / 1_000_000_000;
    const maximumNanoseconds = authority.registeredWallSecondsMaximum * 1_000_000_000;
    if (terminalState === "registered-cap" ? elapsedNanoseconds <= maximumNanoseconds :
      elapsedNanoseconds > maximumNanoseconds) {
      fail(`packet invocation ${index} wall duration disagrees with its strict cap state`);
    }
    return Object.freeze({
      invocationId: authority.invocationId,
      callableId: authority.callableId,
      negativeControlId: authority.negativeControlId,
      invocationClass: authority.invocationClass,
      startedAt: started.observedAt,
      finishedAt: finished.observedAt,
      elapsedNanoseconds,
      wallSeconds,
      registeredWallSecondsMaximum: authority.registeredWallSecondsMaximum,
      terminalState,
    });
  });
  const workerStartedAt = records[0]!.observedAt;
  const workerStoppedAt = records.at(-1)!.observedAt;
  const workerElapsedNanoseconds = records.at(-1)!.monotonicOffsetNanoseconds -
    records[0]!.monotonicOffsetNanoseconds;
  const terminalState = expectedStates.at(-1)!;
  if (records.at(-1)!.terminalState !== terminalState ||
    Date.parse(invocationRecords[0]!.startedAt) < Date.parse(workerStartedAt) ||
    Date.parse(invocationRecords.at(-1)!.finishedAt) > Date.parse(workerStoppedAt)) {
    fail("packet worker boundary state/timing differs from its invocation roster");
  }
  return Object.freeze({
    workerStartedAt,
    workerStoppedAt,
    workerElapsedNanoseconds,
    workerWallSeconds: workerElapsedNanoseconds / 1_000_000_000,
    eventRecords: records,
    invocationRecords: Object.freeze(invocationRecords),
    terminalState,
  });
}
