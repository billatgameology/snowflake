import { Buffer } from "node:buffer";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { writeSync } from "node:fs";
import { resolve } from "node:path";
import {
  argv as processArguments,
  cwd,
  execPath,
  exit as exitProcess,
  hrtime,
} from "node:process";
import { pathToFileURL } from "node:url";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import { parsePhase10C0VS6ApNegativeControlReceiptBytes } from "./phase10-c0v-s6-ap-independent.ts";
import {
  parsePhase10C0VS6CallableRegistry,
  parsePhase10C0VS6PacketCatalogue,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  type Phase10C0VS6PacketId,
  type Phase10C0VS6PacketProtocol,
  type Phase10C0VS6RetainedPreflight,
} from "./phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6PrettyJsonBytes,
  phase10C0VS6SameIdentity,
  type Phase10C0VS6ArtifactIdentity,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6EnsurePhysicalDirectory,
  phase10C0VS6PhysicalRepositoryRoot,
  phase10C0VS6ReadUniquePhysicalFile,
  phase10C0VS6WithPackageAndPacketLocks,
  phase10C0VS6WriteExclusiveOrExact,
  type Phase10C0VS6LockedPacketAuthority,
  type Phase10C0VS6PackageAndPacketLockContext,
  type Phase10C0VS6PhysicalRoot,
} from "./phase10-c0v-s6-filesystem.ts";
import { independentlyEvaluatePhase10C0VS6RetainedFreeze } from "./phase10-c0v-s6-freeze.ts";
import { phase10C0VS6WriteObservedPreflight } from "./phase10-c0v-s6-preflight-observer.ts";
import {
  PHASE10_C0V_S6_MAXIMUM_WORKER_STDERR_BYTES,
  Phase10C0VS6ParentWorkerOutput,
  type Phase10C0VS6ParentWorkerMessageByteBudget,
} from "./phase10-c0v-s6-parent-transport.ts";
import {
  independentlyFinalizePhase10C0VS6ApPacket,
  independentlyFinalizePhase10C0VS6MovingProducePacket,
  independentlyFinalizePhase10C0VS6MovingPublishPacket,
} from "./phase10-c0v-s6-published-packet.ts";
import {
  writePhase10C0VS6CauseEvaluationReceipt,
  writePhase10C0VS6ExitStatusReceipt,
  writePhase10C0VS6FreezeEvaluationReceipt,
} from "./phase10-c0v-s6-receipts.ts";
import { phase10C0VS6RefusalCheckCaller } from "./phase10-c0v-s6-refusal.ts";
import {
  phase10C0VS6ClassifyGovernedElapsedNanoseconds,
  phase10C0VS6RunGovernedLeafWithWatchdog,
  type Phase10C0VS6GovernedLeafCompletion,
  type Phase10C0VS6ParentWatchdogContext,
} from "./phase10-c0v-s6-watchdog.ts";
import {
  phase10C0VS6CreateWorkerInvocationEventLog,
  type Phase10C0VS6WorkerInvocationEventLogWriter,
  type Phase10C0VS6WorkerInvocationEventRecord,
} from "./phase10-c0v-s6-worker-invocation.ts";
import {
  PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY,
  PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES,
  phase10C0VS6AssertExactRuntimeLoaderState,
  phase10C0VS6DecodeWorkerPayload,
  phase10C0VS6ExactWorkerEnvironment,
  phase10C0VS6ParseWorkerMessageLine,
  phase10C0VS6WorkerCommandLine,
  type Phase10C0VS6WorkerCommand,
  type Phase10C0VS6WorkerMessage,
} from "./phase10-c0v-s6-worker-transport.ts";

const PACKET_CATALOGUE_PATH = "research/phase10-execution-v2/packet-catalogue.json" as const;
const CHECK_LIMITS = Object.freeze([
  "no-lock-or-authorizing-preflight-observation",
  "no-resource-or-mutable-dependency-observation",
  "no-worker-or-attempt-or-publication-write",
  "no-claim-credit-or-run-or-resume-authority",
] as const);
const AP_RUN_IMPLEMENTATION_FREEZE_READY = false;
const MOVING_RUN_IMPLEMENTATION_FREEZE_READY = false;
const MOVING_PUBLISH_RUN_IMPLEMENTATION_FREEZE_READY = false;
const EMPTY_BYTES = new Uint8Array(0);
const AP_INVOCATION_AUTHORITY = Object.freeze([
  Object.freeze({
    invocationId: "inv-a-p-c0v-s6-nc-missing-producer",
    callableId: "phase10-nc-a-p-c0v-s6-missing-producer",
    negativeControlId: "nc-ap-c0v-s6-missing-producer",
    invocationClass: "packet-negative-control",
    registeredWallSecondsMaximum: 14400,
  }),
  Object.freeze({
    invocationId: "inv-a-p-c0v-s6-nc-uncalled-check",
    callableId: "phase10-nc-a-p-c0v-s6-uncalled-check",
    negativeControlId: "nc-ap-c0v-s6-uncalled-check",
    invocationClass: "packet-negative-control",
    registeredWallSecondsMaximum: 14400,
  }),
  Object.freeze({
    invocationId: "inv-a-p-c0v-s6-producer",
    callableId: "phase10-a-p-c0v-s6-producer",
    negativeControlId: null,
    invocationClass: "packet-producer",
    registeredWallSecondsMaximum: 14400,
  }),
  Object.freeze({
    invocationId: "inv-a-p-c0v-s6-check-caller",
    callableId: "phase10-a-p-c0v-s6-check-caller",
    negativeControlId: null,
    invocationClass: "packet-evaluator",
    registeredWallSecondsMaximum: 14400,
  }),
] as const);
const MOVING_INVOCATION_AUTHORITY = Object.freeze([
  Object.freeze({
    invocationId: "inv-c0v-moving-cause",
    callableId: "phase10-c0v-moving-produce-check-caller",
    negativeControlId: null,
    invocationClass: "route-cause-evaluator",
    registeredWallSecondsMaximum: 14400,
  }),
] as const);
const MOVING_PUBLISH_INVOCATION_AUTHORITY = Object.freeze([
  Object.freeze({
    invocationId: "inv-c0v-moving-publish-producer",
    callableId: "phase10-c0v-moving-publish-producer",
    negativeControlId: null,
    invocationClass: "packet-producer",
    registeredWallSecondsMaximum: 14400,
  }),
  Object.freeze({
    invocationId: "inv-c0v-moving-publish-check-caller",
    callableId: "phase10-c0v-moving-publish-check-caller",
    negativeControlId: null,
    invocationClass: "packet-evaluator",
    registeredWallSecondsMaximum: 14400,
  }),
] as const);

export type Phase10C0VS6ExecutorMode = "check" | "run";

export interface Phase10C0VS6ExecutorArguments {
  readonly mode: Phase10C0VS6ExecutorMode;
  readonly packetId: Phase10C0VS6PacketId;
  readonly protocolPath: string;
  readonly attemptId: string;
}

export interface Phase10C0VS6CheckResult {
  readonly mode: "check";
  readonly packetId: Phase10C0VS6PacketId;
  readonly registeredAttemptId: string;
  readonly protocolIdentity: Phase10C0VS6ArtifactIdentity;
  readonly registryIdentity: Phase10C0VS6ArtifactIdentity;
  readonly inspection: "configuration-valid-non-authorizing";
  readonly executableNow: boolean;
  readonly preflightObserved: false;
  readonly runAuthorized: false;
  readonly limits: typeof CHECK_LIMITS;
}

export interface Phase10C0VS6RunResult {
  readonly mode: "run";
  readonly packetId: "a-p-c0v-s6" | "c0v-moving-produce" | "c0v-moving-publish";
  readonly registeredAttemptId:
    | "a-p-c0v-s6-20260822-v1"
    | "c0v-moving-produce-20260822-v1"
    | "c0v-moving-publish-20260822-v1";
  readonly selectedSubrouteId: string;
  readonly terminalState: string;
  readonly terminalReceiptIdentity: Phase10C0VS6ArtifactIdentity;
  readonly verificationIdentity: Phase10C0VS6ArtifactIdentity | null;
}

export type Phase10C0VS6ExecutorResult = Phase10C0VS6CheckResult | Phase10C0VS6RunResult;

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 executor refused: ${message}`);
}

function packetIdValue(value: unknown): Phase10C0VS6PacketId {
  if (typeof value !== "string" || !(value in PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY)) {
    fail("packet ID is not one of the eight compiled execution-v2 packets");
  }
  return value as Phase10C0VS6PacketId;
}

/** Exact public CLI parser. No aliases, optional flags, reordered flags, or extra operands exist. */
export function phase10C0VS6ParseExecutorArguments(
  argv: readonly string[],
): Phase10C0VS6ExecutorArguments {
  if (argv.length !== 7 || (argv[0] !== "check" && argv[0] !== "run") ||
    argv[1] !== "--packet" || argv[3] !== "--protocol" || argv[5] !== "--attempt") {
    fail("arguments differ from the exact command shape");
  }
  const mode = argv[0];
  const packetId = packetIdValue(argv[2]);
  const protocolPath = argv[4];
  const attemptId = argv[6];
  const registered = PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY[packetId];
  if (protocolPath !== registered.protocolPath || attemptId !== registered.attemptId) {
    fail("protocol path or attempt ID differs from compiled packet authority");
  }
  return Object.freeze({ mode, packetId, protocolPath, attemptId });
}

function exactCommand(argumentsValue: Phase10C0VS6ExecutorArguments): string {
  return `node runner/src/phase10-c0v-s6-executor.ts ${argumentsValue.mode} ` +
    `--packet ${argumentsValue.packetId} --protocol ${argumentsValue.protocolPath} ` +
    `--attempt ${argumentsValue.attemptId}`;
}

function sameIdentityValue(
  left: Phase10C0VS6ArtifactIdentity,
  right: Phase10C0VS6ArtifactIdentity,
  label: string,
): void {
  phase10C0VS6SameIdentity(left, right, label);
}

export interface Phase10C0VS6WorkerExitOutcome {
  readonly exitCode: number | null;
  readonly signal: string | null;
}

export interface Phase10C0VS6WorkerProcessState {
  spawned: boolean;
  postSpawnError: Error | null;
}

export interface Phase10C0VS6WorkerProcessLifecycle {
  readonly spawned: Promise<void>;
  readonly exit: Promise<Phase10C0VS6WorkerExitOutcome>;
  readonly processState: Phase10C0VS6WorkerProcessState;
}

interface Phase10C0VS6MonotonicEventPoint {
  readonly observedAt: string;
  readonly monotonicOffsetNanoseconds: number;
}

interface Phase10C0VS6GovernedWorkerOutcome {
  readonly registeredCap: boolean;
  readonly capturedGovernedCallerResult: StrictJson | null;
  readonly workerExit: Phase10C0VS6WorkerExitOutcome;
}

interface Phase10C0VS6GovernedInvocationAuthority {
  readonly invocationId: string;
  readonly callableId: string;
  readonly negativeControlId: string | null;
  readonly invocationClass: NonNullable<Phase10C0VS6WorkerInvocationEventRecord["invocationClass"]>;
  readonly registeredWallSecondsMaximum: 300 | 14400;
}

interface Phase10C0VS6ParentWorkerSession {
  readonly child: ChildProcessWithoutNullStreams;
  readonly output: Phase10C0VS6ParentWorkerOutput;
  readonly packet: Phase10C0VS6PacketProtocol;
  readonly spawned: Promise<void>;
  readonly exit: Promise<Phase10C0VS6WorkerExitOutcome>;
  readonly processState: Phase10C0VS6WorkerProcessState;
  inputSequence: number;
  outputSequence: number;
  termination: Promise<void> | null;
  outerTerminationRelease: (() => void) | null;
}

class Phase10C0VS6MonotonicEventClock {
  private readonly startedAt = hrtime.bigint();
  private lastObservedAtMilliseconds = Date.now();

  first(): Phase10C0VS6MonotonicEventPoint {
    return Object.freeze({
      observedAt: new Date(this.lastObservedAtMilliseconds).toISOString(),
      monotonicOffsetNanoseconds: 0,
    });
  }

  capture(): Phase10C0VS6MonotonicEventPoint {
    return this.captureAt(hrtime.bigint());
  }

  captureAt(monotonicNanoseconds: bigint): Phase10C0VS6MonotonicEventPoint {
    const elapsed = monotonicNanoseconds - this.startedAt;
    if (elapsed < 0n || elapsed > BigInt(Number.MAX_SAFE_INTEGER)) {
      fail("worker event monotonic boundary left the clock's safe-integer range");
    }
    this.lastObservedAtMilliseconds = Math.max(this.lastObservedAtMilliseconds, Date.now());
    return Object.freeze({
      observedAt: new Date(this.lastObservedAtMilliseconds).toISOString(),
      monotonicOffsetNanoseconds: Number(elapsed),
    });
  }
}

/**
 * A child `error` is spawn authority only until the exact `spawn` event. After spawn it is an
 * infrastructure diagnostic, while the raw OS code/signal remains authoritative only at `close`.
 */
export function phase10C0VS6ObserveWorkerProcessLifecycle(
  child: Pick<ChildProcessWithoutNullStreams, "once" | "on">,
): Phase10C0VS6WorkerProcessLifecycle {
  const processState: Phase10C0VS6WorkerProcessState = {
    spawned: false,
    postSpawnError: null,
  };
  const spawned = new Promise<void>((resolveSpawn, rejectSpawn) => {
    child.once("spawn", () => {
      processState.spawned = true;
      resolveSpawn();
    });
    child.once("error", (error) => {
      if (!processState.spawned) rejectSpawn(error);
    });
  });
  child.on("error", (error) => {
    if (processState.spawned && processState.postSpawnError === null) {
      processState.postSpawnError = error;
    }
  });
  const exit = new Promise<Phase10C0VS6WorkerExitOutcome>((resolveExit) => {
    child.once("close", (code, signal) => {
      resolveExit(Object.freeze({ exitCode: code, signal: signal === null ? null : String(signal) }));
    });
  });
  return Object.freeze({ spawned, exit, processState });
}

function workerEvent(
  sequence: number,
  point: Phase10C0VS6MonotonicEventPoint,
  event: Phase10C0VS6WorkerInvocationEventRecord["event"],
  terminalState: Phase10C0VS6WorkerInvocationEventRecord["terminalState"],
  invocation: Phase10C0VS6GovernedInvocationAuthority | null,
): Phase10C0VS6WorkerInvocationEventRecord {
  return Object.freeze({
    schema: "phase10-c0v-worker-invocation-row-v1",
    sequence,
    observedAt: point.observedAt,
    monotonicOffsetNanoseconds: point.monotonicOffsetNanoseconds,
    event,
    invocationId: invocation?.invocationId ?? null,
    callableId: invocation?.callableId ?? null,
    negativeControlId: invocation?.negativeControlId ?? null,
    invocationClass: invocation?.invocationClass ?? null,
    registeredWallSecondsMaximum: invocation?.registeredWallSecondsMaximum ?? null,
    terminalState,
  });
}

function startParentWorker(
  root: Phase10C0VS6PhysicalRoot,
  authority: Phase10C0VS6LockedPacketAuthority,
  maximumWorkerMessages: number,
  maximumStdoutBytes: number,
  messageByteBudget: Phase10C0VS6ParentWorkerMessageByteBudget,
): Phase10C0VS6ParentWorkerSession {
  const packet = authority.packet;
  const workerPath = resolve(root.path, "runner/src/phase10-c0v-s6-executor-worker.ts");
  const child = spawn(execPath, [
    workerPath,
    "--repository-root", root.path,
    "--packet", packet.packetId,
    "--protocol", PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY[packet.packetId].protocolPath,
    "--attempt", packet.registeredAttemptId,
  ], {
    cwd: root.path,
    env: phase10C0VS6ExactWorkerEnvironment(
      authority.catalogue.runtimeLauncherContract.cleanEnvironment,
    ),
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  const lifecycle = phase10C0VS6ObserveWorkerProcessLifecycle(child);
  const output = new Phase10C0VS6ParentWorkerOutput(
    child.stdout,
    child.stderr,
    maximumWorkerMessages,
    maximumStdoutBytes,
    messageByteBudget,
    () => {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    },
  );
  const session: Phase10C0VS6ParentWorkerSession = {
    child,
    output,
    packet,
    spawned: lifecycle.spawned,
    exit: lifecycle.exit,
    processState: lifecycle.processState,
    inputSequence: 0,
    outputSequence: 0,
    termination: null,
    outerTerminationRelease: null,
  };
  return session;
}

function workerTransportBudget(
  authority: Phase10C0VS6LockedPacketAuthority,
  expected: Readonly<{
    readonly lifecycle: number;
    readonly boundaryOrProgress: number;
    readonly artifact: number;
    readonly result: number;
  }>,
): Readonly<{
  readonly maximumMessages: number;
  readonly maximumStdoutBytes: number;
  readonly messageByteBudget: Phase10C0VS6ParentWorkerMessageByteBudget;
}> {
  const rows = authority.catalogue.packets.filter((entry) => entry.packetId === authority.packet.packetId);
  if (rows.length !== 1) fail("locked catalogue lacks one selected packet transport budget");
  const row = rows[0]!;
  const budget = row.stdoutMessageByteBudget;
  if (budget.lifecycleLineCountMaximum !== expected.lifecycle ||
    budget.boundaryOrProgressLineCountMaximum !== expected.boundaryOrProgress ||
    budget.artifactLineCountMaximum !== expected.artifact ||
    budget.resultLineCountMaximum !== expected.result ||
    row.maximumStdoutBytes !== 4_194_304 ||
    budget.derivedMaximumBytes > row.maximumStdoutBytes ||
    authority.packet.resources.projectedScratchBytes !== row.maximumStdoutBytes +
      authority.catalogue.workerTransportContract.maximumStderrBytes + row.maximumOtherAttemptRootBytes) {
    fail("locked packet stdout/scratch budget differs from compiled parent transport authority");
  }
  const maximumMessages = expected.lifecycle + expected.boundaryOrProgress + expected.artifact + expected.result;
  if (!Number.isSafeInteger(maximumMessages) || maximumMessages <= 0) {
    fail("locked packet stdout message count is invalid");
  }
  return Object.freeze({
    maximumMessages,
    maximumStdoutBytes: row.maximumStdoutBytes,
    messageByteBudget: budget,
  });
}

async function writeWorkerCommand(
  session: Phase10C0VS6ParentWorkerSession,
  kind: "invoke" | "acknowledge" | "stop",
  invocationId: string | null,
  acknowledgedWorkerSequence: number | null = null,
): Promise<void> {
  const command: Phase10C0VS6WorkerCommand = Object.freeze({
    schema: "phase10-c0v-s6-worker-command-v1",
    sequence: session.inputSequence,
    packetId: session.packet.packetId,
    attemptId: session.packet.registeredAttemptId,
    kind,
    invocationId,
    acknowledgedWorkerSequence,
  });
  const bytes = phase10C0VS6WorkerCommandLine(command, Object.freeze({
    packetId: session.packet.packetId,
    attemptId: session.packet.registeredAttemptId,
  }));
  await new Promise<void>((resolveWrite, rejectWrite) => {
    session.child.stdin.write(Buffer.from(bytes), (error) => {
      if (error === null || error === undefined) resolveWrite();
      else rejectWrite(error);
    });
  });
  session.inputSequence += 1;
}

async function nextWorkerLine(
  session: Phase10C0VS6ParentWorkerSession,
): Promise<Uint8Array> {
  return session.output.nextLine();
}

function nextWorkerLineAtAuthenticatedBoundary(
  session: Phase10C0VS6ParentWorkerSession,
  complete: (line: Uint8Array) => Phase10C0VS6GovernedLeafCompletion<Uint8Array>,
): Promise<Phase10C0VS6GovernedLeafCompletion<Uint8Array>> {
  return session.output.nextLineAtAuthenticatedBoundary(complete);
}

function parseWorkerMessage(
  session: Phase10C0VS6ParentWorkerSession,
  line: Uint8Array,
): Phase10C0VS6WorkerMessage {
  const message = phase10C0VS6ParseWorkerMessageLine(
    line,
    session.outputSequence,
    Object.freeze({
      packetId: session.packet.packetId,
      attemptId: session.packet.registeredAttemptId,
    }),
  );
  session.output.observeParsedMessage(message.kind, line.byteLength);
  session.outputSequence += 1;
  if (message.kind === "error") {
    const payload = phase10C0VS6DecodeWorkerPayload(message.payload!);
    const detail = payload !== null && typeof payload === "object" && !Array.isArray(payload) &&
      typeof (payload as { readonly message?: unknown }).message === "string"
      ? (payload as { readonly message: string }).message
      : "worker emitted an unclassified structured error";
    throw new Error(detail);
  }
  return message;
}

async function nextWorkerMessage(
  session: Phase10C0VS6ParentWorkerSession,
): Promise<Phase10C0VS6WorkerMessage> {
  return parseWorkerMessage(session, await nextWorkerLine(session));
}

async function terminateWorker(
  session: Phase10C0VS6ParentWorkerSession,
  _reason: Error,
): Promise<void> {
  session.termination ??= (async () => {
    if (session.child.exitCode === null && session.child.signalCode === null) {
      session.child.kill("SIGKILL");
    }
    session.child.stdin.destroy();
    await session.exit;
  })();
  return session.termination;
}

function registerWorkerForOuterWatchdog(
  session: Phase10C0VS6ParentWorkerSession,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): void {
  if (session.outerTerminationRelease !== null) fail("worker already has an outer termination target");
  session.outerTerminationRelease = watchdog.registerTerminationTarget(
    (reason) => terminateWorker(session, reason),
  );
}

function releaseWorkerOuterTarget(session: Phase10C0VS6ParentWorkerSession): void {
  if (session.outerTerminationRelease === null) fail("worker lacks its outer termination target");
  session.outerTerminationRelease();
  session.outerTerminationRelease = null;
}

function assertWorkerTransportQuiescent(session: Phase10C0VS6ParentWorkerSession): void {
  if (session.processState.postSpawnError !== null) {
    fail(`worker process emitted an error after spawn: ${session.processState.postSpawnError.message}`);
  }
  session.output.assertQuiescent();
}

function rawRuntimeInput(
  root: Phase10C0VS6PhysicalRoot,
  authority: Phase10C0VS6LockedPacketAuthority,
  preflightBytes: Uint8Array,
) {
  return Object.freeze({
    repositoryRoot: root.path,
    packetProtocolIdentity: authority.packetProtocolIdentity,
    packetProtocolBytes: authority.packetProtocolBytes,
    preflightBytes,
  });
}

function attemptPath(
  preflight: Phase10C0VS6RetainedPreflight,
  filename: string,
): string {
  return `${preflight.observed.attemptDirectory}/${filename}`;
}

function writeRetainedFreeze(
  root: Phase10C0VS6PhysicalRoot,
  authority: Phase10C0VS6LockedPacketAuthority,
  preflight: Phase10C0VS6RetainedPreflight,
  preflightBytes: Uint8Array,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): Phase10C0VS6ArtifactIdentity {
  const packet = authority.packet;
  const input = rawRuntimeInput(root, authority, preflightBytes);
  const evaluation = independentlyEvaluatePhase10C0VS6RetainedFreeze(input);
  const preflightIdentity = phase10C0VS6ArtifactIdentity(packet.paths.preflightReceiptPath, preflightBytes);
  const freezeAuthority = Object.freeze({
    protocol: authority.packetProtocolIdentity,
    preflight: preflightIdentity,
    implementationFreezeCommit: evaluation.implementationFreezeCommit,
    launchHead: evaluation.launchHead,
    launchBranch: evaluation.launchBranch,
    anchorPaths: evaluation.anchorPaths,
    artifacts: evaluation.artifacts,
    parserRuntimeArtifacts: evaluation.parserRuntimeArtifacts,
    artifactFailure: evaluation.artifactFailure,
  });
  const invokedCheckIds = Object.freeze(packet.terminalCandidateContract.decisionRosters
    .flatMap((roster) => roster.decisions)
    .filter((decision) => decision.decisionRole === "freeze")
    .flatMap((decision) => decision.invokedCheckIds)
    .filter((checkId, index, rows) => rows.indexOf(checkId) === index)
    .sort());
  const bytes = writePhase10C0VS6FreezeEvaluationReceipt({
    schema: packet.freezeEvaluationContract.rowSchema,
    evaluationId: `freeze-${packet.packetId}-${packet.registeredAttemptId}-v1`,
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    protocol: authority.packetProtocolIdentity,
    preflight: preflightIdentity,
    implementationFreezeCommit: evaluation.implementationFreezeCommit,
    launchHead: evaluation.launchHead,
    launchBranch: evaluation.launchBranch,
    anchorPaths: evaluation.anchorPaths,
    artifacts: evaluation.artifacts,
    parserRuntimeArtifacts: evaluation.parserRuntimeArtifacts,
    artifactFailure: evaluation.artifactFailure,
    invokedCheckIds,
    verdict: "pass",
    reasons: [],
  }, packet, freezeAuthority);
  watchdog.assertActive();
  const path = attemptPath(preflight, packet.freezeEvaluationContract.filename);
  const write = phase10C0VS6WriteExclusiveOrExact(root, path, bytes);
  watchdog.assertActive();
  return write.identity;
}

function writeExitStatus(
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
  preflight: Phase10C0VS6RetainedPreflight,
  value: Readonly<{
    workerProcessInvocationCount: 0 | 1;
    workerStarted: boolean;
    exitCode: number | null;
    signal: string | null;
    classification: "no-worker" | "complete" | "registered-cap" | "infrastructure-failure";
  }>,
): Phase10C0VS6ArtifactIdentity {
  const bytes = writePhase10C0VS6ExitStatusReceipt({
    schema: packet.exitStatusContract.rowSchema,
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    ...value,
  }, packet);
  return phase10C0VS6WriteExclusiveOrExact(
    root,
    attemptPath(preflight, packet.exitStatusContract.filename),
    bytes,
  ).identity;
}

function writeRawCause(
  root: Phase10C0VS6PhysicalRoot,
  authority: Phase10C0VS6LockedPacketAuthority,
  preflight: Phase10C0VS6RetainedPreflight,
  preflightBytes: Uint8Array,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): Phase10C0VS6ArtifactIdentity {
  const packet = authority.packet;
  const caller = phase10C0VS6RefusalCheckCaller(rawRuntimeInput(root, authority, preflightBytes));
  const evaluation = caller.evaluation;
  const bytes = writePhase10C0VS6CauseEvaluationReceipt({
    schema: packet.causeEvaluationContract.rowSchema,
    evaluationId: `cause-${packet.packetId}-${packet.registeredAttemptId}-${evaluation.selectedSubrouteId}-v1`,
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    selectedSubrouteId: evaluation.selectedSubrouteId,
    dispositionCode: evaluation.dispositionCode,
    protocol: evaluation.protocol,
    preflight: evaluation.preflight,
    exitStatus: evaluation.exitStatus,
    workerInvocations: evaluation.workerInvocations,
    classificationConditionIds: evaluation.observations.map((entry) => entry.conditionId),
    observations: evaluation.observations,
    evidence: evaluation.evidence,
    evaluatorCallableId: evaluation.evaluatorCallableId,
    invokedCheckIds: evaluation.invokedCheckIds,
    verdict: evaluation.verdict,
    reasons: evaluation.reasons,
  }, packet, evaluation);
  watchdog.assertActive();
  const write = phase10C0VS6WriteExclusiveOrExact(
    root,
    attemptPath(preflight, packet.causeEvaluationContract.filename),
    bytes,
  );
  watchdog.assertActive();
  return write.identity;
}

function writeWorkerDiagnostics(
  root: Phase10C0VS6PhysicalRoot,
  packet: Phase10C0VS6PacketProtocol,
  preflight: Phase10C0VS6RetainedPreflight,
  session: Phase10C0VS6ParentWorkerSession | null,
): void {
  if (!packet.paths.internalOnlyFilenames.includes("stdout.log") ||
    !packet.paths.internalOnlyFilenames.includes("stderr.log")) {
    fail("packet does not register both worker diagnostic filenames");
  }
  phase10C0VS6WriteExclusiveOrExact(
    root,
    attemptPath(preflight, "stdout.log"),
    session === null ? EMPTY_BYTES : session.output.retainedStdoutBytes(),
  );
  phase10C0VS6WriteExclusiveOrExact(
    root,
    attemptPath(preflight, "stderr.log"),
    session === null ? EMPTY_BYTES : session.output.retainedStderrBytes(),
  );
}

function wireObject(value: unknown, label: string): Readonly<Record<string, unknown>> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    fail(`${label} is not a decoded strict wire object`);
  }
  return value as Readonly<Record<string, unknown>>;
}

function exactWireKeys(
  value: Readonly<Record<string, unknown>>,
  expected: readonly string[],
  label: string,
): void {
  const keys = Object.keys(value);
  if (keys.length !== expected.length || keys.some((entry, index) => entry !== expected[index])) {
    fail(`${label} fields differ from the exact worker result`);
  }
}

function wireStringRoster(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string") ||
    new Set(value).size !== value.length) {
    fail(`${label} is not an exact unique string roster`);
  }
  return Object.freeze([...(value as string[])]);
}

function wireBytes(value: unknown, label: string): Uint8Array {
  if (!(value instanceof Uint8Array)) fail(`${label} is not a wire byte payload`);
  return new Uint8Array(value);
}

function sameBytesAtPath(
  path: string,
  left: Uint8Array,
  right: Uint8Array,
  label: string,
): void {
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(path, left),
    phase10C0VS6ArtifactIdentity(path, right),
    label,
  );
}

function validateApInvocationResult(
  packet: Phase10C0VS6PacketProtocol,
  preflight: Phase10C0VS6RetainedPreflight,
  invocationId: string,
  value: unknown,
  priorResults: ReadonlyMap<string, unknown>,
): unknown {
  const row = wireObject(value, `${invocationId} result`);
  if (invocationId === "inv-a-p-c0v-s6-nc-missing-producer" ||
    invocationId === "inv-a-p-c0v-s6-nc-uncalled-check") {
    exactWireKeys(row, ["bytes", "receipt"], `${invocationId} result`);
    const bytes = wireBytes(row.bytes, `${invocationId}.bytes`);
    const receipt = parsePhase10C0VS6ApNegativeControlReceiptBytes(bytes, `${invocationId} receipt bytes`);
    const fixtureId = invocationId === "inv-a-p-c0v-s6-nc-missing-producer"
      ? "missing-producer"
      : "uncalled-check";
    if (receipt.fixtureId !== fixtureId) fail(`${invocationId} receipt fixture differs`);
    return Object.freeze({ bytes, receipt });
  }
  if (invocationId === "inv-a-p-c0v-s6-producer") {
    exactWireKeys(
      row,
      ["artifactIndex", "bytes", "missingProducer", "uncalledCheck"],
      `${invocationId} result`,
    );
    const bytesRow = wireObject(row.bytes, `${invocationId}.bytes`);
    exactWireKeys(
      bytesRow,
      ["artifactIndex", "missingProducer", "uncalledCheck"],
      `${invocationId}.bytes`,
    );
    const artifactIndex = wireBytes(bytesRow.artifactIndex, `${invocationId}.bytes.artifactIndex`);
    const missingProducer = wireBytes(bytesRow.missingProducer, `${invocationId}.bytes.missingProducer`);
    const uncalledCheck = wireBytes(bytesRow.uncalledCheck, `${invocationId}.bytes.uncalledCheck`);
    parsePhase10C0VS6PrettyJsonBytes(artifactIndex, `${invocationId} artifact-index bytes`);
    parsePhase10C0VS6ApNegativeControlReceiptBytes(missingProducer, `${invocationId} missing receipt`);
    parsePhase10C0VS6ApNegativeControlReceiptBytes(uncalledCheck, `${invocationId} uncalled receipt`);
    const priorMissing = wireObject(
      priorResults.get("inv-a-p-c0v-s6-nc-missing-producer"),
      "captured missing-producer result",
    );
    const priorUncalled = wireObject(
      priorResults.get("inv-a-p-c0v-s6-nc-uncalled-check"),
      "captured uncalled-check result",
    );
    sameBytesAtPath(
      `${preflight.observed.candidateDirectory}/missing-producer.json`,
      missingProducer,
      wireBytes(priorMissing.bytes, "captured missing-producer bytes"),
      "A-P producer retained missing-producer input",
    );
    sameBytesAtPath(
      `${preflight.observed.candidateDirectory}/uncalled-check.json`,
      uncalledCheck,
      wireBytes(priorUncalled.bytes, "captured uncalled-check bytes"),
      "A-P producer retained uncalled-check input",
    );
    return Object.freeze({ artifactIndex, missingProducer, uncalledCheck });
  }
  if (invocationId === "inv-a-p-c0v-s6-check-caller") {
    exactWireKeys(row, [
      "callerCallableId", "evaluatedCheckIds", "evaluation", "evaluatorCallableId",
      "executedCheckIds", "executedNegativeControlIds", "packetId", "schema",
    ], `${invocationId} result`);
    if (row.schema !== "phase10-c0v-s6-ap-check-caller-result-v1" || row.packetId !== packet.packetId ||
      row.callerCallableId !== "phase10-a-p-c0v-s6-check-caller" ||
      row.evaluatorCallableId !== "phase10-a-p-c0v-s6-evaluator") {
      fail("A-P governed caller result identity fields differ");
    }
    const completeSubroutes = packet.terminalSubroutes.filter((entry) => entry.dispositionCode === null);
    if (completeSubroutes.length !== 1) fail("A-P packet lacks one structural-complete subroute");
    const complete = completeSubroutes[0]!;
    const executed = wireStringRoster(row.executedCheckIds, "A-P executed checks");
    const evaluated = wireStringRoster(row.evaluatedCheckIds, "A-P evaluated checks");
    const controls = wireStringRoster(row.executedNegativeControlIds, "A-P executed controls");
    if (JSON.stringify(executed) !== JSON.stringify(complete.requiredCheckIds) ||
      JSON.stringify(evaluated) !== JSON.stringify(complete.requiredCheckIds) ||
      JSON.stringify(controls) !== JSON.stringify(complete.requiredNegativeControlIds)) {
      fail("A-P governed caller result roster differs from the selected complete subroute");
    }
    return strictJsonSnapshot(row);
  }
  return fail(`worker returned unsupported A-P invocation ${invocationId}`);
}

function persistApCandidateArtifacts(
  root: Phase10C0VS6PhysicalRoot,
  preflight: Phase10C0VS6RetainedPreflight,
  results: ReadonlyMap<string, unknown>,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): StrictJson {
  const produced = wireObject(results.get("inv-a-p-c0v-s6-producer"), "captured A-P producer result");
  const caller = results.get("inv-a-p-c0v-s6-check-caller");
  if (caller === undefined) fail("A-P governed check-caller result is absent");
  for (const [filename, key] of [
    ["artifact-index.json", "artifactIndex"],
    ["missing-producer.json", "missingProducer"],
    ["uncalled-check.json", "uncalledCheck"],
  ] as const) {
    watchdog.assertActive();
    phase10C0VS6WriteExclusiveOrExact(
      root,
      `${preflight.observed.candidateDirectory}/${filename}`,
      wireBytes(produced[key], `captured A-P producer ${key}`),
    );
    watchdog.assertActive();
  }
  return strictJsonSnapshot(caller);
}

function apInvocationRoster(
  packet: Phase10C0VS6PacketProtocol,
): readonly Phase10C0VS6GovernedInvocationAuthority[] {
  const roster = packet.verificationInvocationRoster;
  if (packet.packetId !== "a-p-c0v-s6" || roster.length !== AP_INVOCATION_AUTHORITY.length ||
    roster.some((entry, index) => {
      const expected = AP_INVOCATION_AUTHORITY[index]!;
      return entry.invocationId !== expected.invocationId || entry.callableId !== expected.callableId ||
        entry.negativeControlId !== expected.negativeControlId ||
        entry.invocationClass !== expected.invocationClass ||
        entry.registeredWallSecondsMaximum !== expected.registeredWallSecondsMaximum;
    })) {
    fail("A-P worker invocation roster differs from hard-coded parent authority");
  }
  return roster;
}

function movingInvocationRoster(
  packet: Phase10C0VS6PacketProtocol,
): readonly Phase10C0VS6GovernedInvocationAuthority[] {
  const completeRows = packet.executableInvocationRosters
    .flatMap((entry) => entry.invocations)
    .filter((entry) => entry.terminalState === "complete")
    .filter((entry, index, rows) =>
      rows.findIndex((other) => other.invocationId === entry.invocationId) === index);
  if (packet.packetId !== "c0v-moving-produce" ||
    completeRows.length !== MOVING_INVOCATION_AUTHORITY.length ||
    completeRows.some((entry, index) => {
      const expected = MOVING_INVOCATION_AUTHORITY[index]!;
      return entry.invocationId !== expected.invocationId || entry.callableId !== expected.callableId ||
        entry.negativeControlId !== expected.negativeControlId ||
        entry.invocationClass !== expected.invocationClass ||
        entry.registeredWallSecondsMaximum !== expected.registeredWallSecondsMaximum;
    })) {
    fail("moving worker invocation roster differs from hard-coded parent authority");
  }
  return Object.freeze(completeRows.map((entry) => Object.freeze({
    invocationId: entry.invocationId,
    callableId: entry.callableId,
    negativeControlId: entry.negativeControlId,
    invocationClass: entry.invocationClass,
    registeredWallSecondsMaximum: entry.registeredWallSecondsMaximum,
  })));
}

function movingPublishInvocationRoster(
  packet: Phase10C0VS6PacketProtocol,
): readonly Phase10C0VS6GovernedInvocationAuthority[] {
  const roster = packet.verificationInvocationRoster;
  if (packet.packetId !== "c0v-moving-publish" ||
    roster.length !== MOVING_PUBLISH_INVOCATION_AUTHORITY.length ||
    roster.some((entry, index) => {
      const expected = MOVING_PUBLISH_INVOCATION_AUTHORITY[index]!;
      return entry.invocationId !== expected.invocationId || entry.callableId !== expected.callableId ||
        entry.negativeControlId !== expected.negativeControlId ||
        entry.invocationClass !== expected.invocationClass ||
        entry.registeredWallSecondsMaximum !== expected.registeredWallSecondsMaximum;
    })) {
    fail("moving-publish worker invocation roster differs from hard-coded parent authority");
  }
  return roster;
}

function validateMovingInvocationResult(
  packet: Phase10C0VS6PacketProtocol,
  invocationId: string,
  value: unknown,
): StrictJson {
  if (invocationId !== "inv-c0v-moving-cause") {
    return fail(`worker returned unsupported moving invocation ${invocationId}`);
  }
  const row = wireObject(value, `${invocationId} result`);
  exactWireKeys(row, [
    "evaluation", "terminalStatus", "executedCheckIds", "evaluatedCheckIds",
    "executedNegativeControlIds",
  ], `${invocationId} result`);
  const evaluation = wireObject(row.evaluation, `${invocationId}.evaluation`);
  exactWireKeys(evaluation, [
    "layerId", "dispositionCode", "observations", "evidence", "verdict", "errors",
  ], `${invocationId}.evaluation`);
  if (row.terminalStatus !== "refusal" || evaluation.layerId !== "C0V-MOVING-EVENT" ||
    evaluation.dispositionCode !== "reference-discrepancy-refusal" || evaluation.verdict !== "pass" ||
    !Array.isArray(evaluation.errors) || evaluation.errors.length !== 0) {
    fail("moving governed caller result identity/disposition differs");
  }
  const executed = wireStringRoster(row.executedCheckIds, "moving executed checks");
  const evaluated = wireStringRoster(row.evaluatedCheckIds, "moving evaluated checks");
  const controls = wireStringRoster(row.executedNegativeControlIds, "moving executed controls");
  const expected = Object.freeze(["chk-c0v-moving-discrepancy-validity"]);
  if (JSON.stringify(executed) !== JSON.stringify(expected) ||
    JSON.stringify(evaluated) !== JSON.stringify(expected) || controls.length !== 0) {
    fail("moving governed caller check/control roster differs");
  }
  const routeRows = packet.terminalSubroutes.filter((entry) =>
    entry.dispositionCode === "reference-discrepancy-refusal");
  if (routeRows.length !== 1 || !routeRows[0]!.requiredCheckIds.includes(expected[0]!)) {
    fail("moving governed caller check is absent from the registered discrepancy route");
  }
  return strictJsonSnapshot(row);
}

interface Phase10C0VS6MovingPublishProducerCapture {
  readonly resultBytes: Uint8Array;
  readonly artifactIndexBytes: Uint8Array;
}

function sameWireJsonAndBytes(
  value: unknown,
  bytes: Uint8Array,
  path: string,
  label: string,
): StrictJson {
  const parsed = strictJsonSnapshot(parsePhase10C0VS6PrettyJsonBytes(bytes, `${label} bytes`));
  const wire = strictJsonSnapshot(value);
  sameBytesAtPath(
    path,
    phase10C0VS6PrettyJsonBytes(parsed),
    phase10C0VS6PrettyJsonBytes(wire),
    `${label} wire/bytes projection`,
  );
  return parsed;
}

function validateMovingPublishInvocationResult(
  packet: Phase10C0VS6PacketProtocol,
  preflight: Phase10C0VS6RetainedPreflight,
  invocationId: string,
  value: unknown,
  priorResults: ReadonlyMap<string, unknown>,
): Phase10C0VS6MovingPublishProducerCapture | StrictJson {
  const row = wireObject(value, `${invocationId} result`);
  if (invocationId === "inv-c0v-moving-publish-producer") {
    exactWireKeys(row, ["packetId", "result", "artifactIndex", "bytes"], `${invocationId} result`);
    if (row.packetId !== packet.packetId) fail("moving-publish producer returned another packet ID");
    const bytesRow = wireObject(row.bytes, `${invocationId}.bytes`);
    exactWireKeys(bytesRow, ["result", "artifactIndex"], `${invocationId}.bytes`);
    const resultBytes = wireBytes(bytesRow.result, `${invocationId}.bytes.result`);
    const artifactIndexBytes = wireBytes(bytesRow.artifactIndex, `${invocationId}.bytes.artifactIndex`);
    const resultPath = `${preflight.observed.candidateDirectory}/c0v-moving-result.json`;
    const artifactIndexPath = `${preflight.observed.candidateDirectory}/c0v-moving-artifact-index.json`;
    const result = sameWireJsonAndBytes(row.result, resultBytes, resultPath, "moving-publish result");
    const artifactIndex = sameWireJsonAndBytes(
      row.artifactIndex,
      artifactIndexBytes,
      artifactIndexPath,
      "moving-publish artifact index",
    );
    const resultRow = wireObject(result, "moving-publish parsed result");
    const indexRow = wireObject(artifactIndex, "moving-publish parsed artifact index");
    if (resultRow.schema !== "phase10-c0v-moving-result-v1" ||
      resultRow.layerId !== "C0V-MOVING-EVENT" ||
      resultRow.terminalStatus !== "refusal" || resultRow.scientificDisposition !== "refusal" ||
      indexRow.schema !== "phase10-artifact-index-v1" ||
      indexRow.bundleId !== "phase10-numerical-verification-v1") {
      fail("moving-publish producer returned a different structural result/index scope");
    }
    return Object.freeze({ resultBytes, artifactIndexBytes });
  }
  if (invocationId === "inv-c0v-moving-publish-check-caller") {
    exactWireKeys(row, [
      "schema", "packetId", "callerCallableId", "evaluatorCallableId", "evaluation",
      "executedCheckIds", "evaluatedCheckIds", "executedNegativeControlIds",
    ], `${invocationId} result`);
    if (row.schema !== "phase10-c0v-publication-check-caller-result-v1" ||
      row.packetId !== packet.packetId ||
      row.callerCallableId !== "phase10-c0v-moving-publish-check-caller" ||
      row.evaluatorCallableId !== "phase10-c0v-moving-publication-verifier") {
      fail("moving-publish governed caller result identity differs");
    }
    const evaluation = wireObject(row.evaluation, `${invocationId}.evaluation`);
    exactWireKeys(evaluation, [
      "schema", "packetId", "evaluatorCallableId", "selectedAttempt", "result", "artifactIndex",
      "resultIdentity", "artifactIndexIdentity", "checkResults", "aggregateVerdict",
    ], `${invocationId}.evaluation`);
    if (evaluation.schema !== "phase10-c0v-publication-evaluation-v1" ||
      evaluation.packetId !== packet.packetId ||
      evaluation.evaluatorCallableId !== row.evaluatorCallableId ||
      evaluation.aggregateVerdict !== "pass") {
      fail("moving-publish governed evaluator result identity/verdict differs");
    }
    const completeSubroutes = packet.terminalSubroutes.filter((entry) => entry.dispositionCode === null);
    if (completeSubroutes.length !== 1) fail("moving-publish packet lacks one structural-complete subroute");
    const complete = completeSubroutes[0]!;
    const executed = wireStringRoster(row.executedCheckIds, "moving-publish executed checks");
    const evaluated = wireStringRoster(row.evaluatedCheckIds, "moving-publish evaluated checks");
    const controls = wireStringRoster(row.executedNegativeControlIds, "moving-publish executed controls");
    if (JSON.stringify(executed) !== JSON.stringify(complete.requiredCheckIds) ||
      JSON.stringify(evaluated) !== JSON.stringify(complete.requiredCheckIds) ||
      JSON.stringify(controls) !== JSON.stringify(complete.requiredNegativeControlIds)) {
      fail("moving-publish governed caller check/control roster differs");
    }
    const producer = priorResults.get("inv-c0v-moving-publish-producer");
    if (producer === undefined ||
      !((producer as Partial<Phase10C0VS6MovingPublishProducerCapture>).resultBytes instanceof Uint8Array) ||
      !((producer as Partial<Phase10C0VS6MovingPublishProducerCapture>).artifactIndexBytes instanceof Uint8Array)) {
      fail("moving-publish check caller returned before its exact producer capture");
    }
    const captured = producer as Phase10C0VS6MovingPublishProducerCapture;
    sameWireJsonAndBytes(
      evaluation.result,
      captured.resultBytes,
      `${preflight.observed.candidateDirectory}/c0v-moving-result.json`,
      "moving-publish caller result",
    );
    sameWireJsonAndBytes(
      evaluation.artifactIndex,
      captured.artifactIndexBytes,
      `${preflight.observed.candidateDirectory}/c0v-moving-artifact-index.json`,
      "moving-publish caller artifact index",
    );
    return strictJsonSnapshot(row);
  }
  return fail(`worker returned unsupported moving-publish invocation ${invocationId}`);
}

function persistMovingPublishCandidateArtifacts(
  root: Phase10C0VS6PhysicalRoot,
  preflight: Phase10C0VS6RetainedPreflight,
  results: ReadonlyMap<string, unknown>,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): StrictJson {
  const producer = results.get("inv-c0v-moving-publish-producer") as
    | Phase10C0VS6MovingPublishProducerCapture
    | undefined;
  const caller = results.get("inv-c0v-moving-publish-check-caller");
  if (producer === undefined || caller === undefined) {
    fail("moving-publish complete worker lacks producer/caller captures");
  }
  for (const [filename, bytes] of [
    ["c0v-moving-result.json", producer.resultBytes],
    ["c0v-moving-artifact-index.json", producer.artifactIndexBytes],
  ] as const) {
    watchdog.assertActive();
    phase10C0VS6WriteExclusiveOrExact(
      root,
      `${preflight.observed.candidateDirectory}/${filename}`,
      bytes,
    );
    watchdog.assertActive();
  }
  return strictJsonSnapshot(caller);
}

function assertWorkerMessage(
  message: Phase10C0VS6WorkerMessage,
  kind: Phase10C0VS6WorkerMessage["kind"],
  invocationId: string | null,
): void {
  if (message.kind !== kind || message.invocationId !== invocationId) {
    fail(`worker message differs from expected ${kind}/${invocationId ?? "boundary"}`);
  }
}

function assertRawChildOutcome(
  outcome: Phase10C0VS6WorkerExitOutcome,
  classification: "complete" | "registered-cap" | "infrastructure-failure",
): void {
  if (Number(outcome.exitCode !== null) + Number(outcome.signal !== null) !== 1) {
    fail(`${classification} worker exit lacks exactly one raw code or signal`);
  }
  if (classification === "complete" && (outcome.exitCode !== 0 || outcome.signal !== null)) {
    fail("complete worker did not exit with raw code zero and no signal");
  }
  if (classification === "infrastructure-failure" && outcome.exitCode === 0) {
    fail("infrastructure-failure worker exited with raw code zero");
  }
}

async function runApWorker(
  root: Phase10C0VS6PhysicalRoot,
  authority: Phase10C0VS6LockedPacketAuthority,
  preflight: Phase10C0VS6RetainedPreflight,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): Promise<Phase10C0VS6GovernedWorkerOutcome> {
  const packet = authority.packet;
  const roster = apInvocationRoster(packet);
  watchdog.assertActive();
  const transport = workerTransportBudget(authority, Object.freeze({
    lifecycle: 2,
    boundaryOrProgress: 0,
    artifact: 0,
    result: 4,
  }));
  if (transport.maximumMessages !== roster.length + 2) {
    fail("A-P worker message budget differs from ready/results/stopped roster");
  }
  const session = startParentWorker(
    root,
    authority,
    transport.maximumMessages,
    transport.maximumStdoutBytes,
    transport.messageByteBudget,
  );
  registerWorkerForOuterWatchdog(session, watchdog);
  let eventLog: Phase10C0VS6WorkerInvocationEventLogWriter | null = null;
  let eventLogClosed = false;
  let eventSequence = 0;
  let clock: Phase10C0VS6MonotonicEventClock | null = null;
  let openInvocation: Phase10C0VS6GovernedInvocationAuthority | null = null;
  const results = new Map<string, unknown>();
  try {
    await session.spawned;
    clock = new Phase10C0VS6MonotonicEventClock();
    eventLog = phase10C0VS6CreateWorkerInvocationEventLog(
      root,
      attemptPath(preflight, packet.workerInvocationContract.filename),
      packet.workerInvocationContract,
      workerEvent(eventSequence++, clock.first(), "worker-started", "running", null),
    );
    const ready = await nextWorkerMessage(session);
    assertWorkerMessage(ready, "ready", null);

    for (const invocation of roster) {
      watchdog.assertActive();
      const boundary: {
        started: Phase10C0VS6MonotonicEventPoint | null;
        startedAtMonotonicNanoseconds: bigint | null;
      } = { started: null, startedAtMonotonicNanoseconds: null };
      releaseWorkerOuterTarget(session);
      const governed = await phase10C0VS6RunGovernedLeafWithWatchdog<Uint8Array>(
        watchdog,
        invocation.registeredWallSecondsMaximum,
        (reason) => terminateWorker(session, reason),
        async (_signal, assertActive, complete, issuedStartedAtMonotonicNanoseconds) => {
          if (boundary.started !== null || boundary.startedAtMonotonicNanoseconds !== null) {
            fail("governed leaf start boundary was issued more than once");
          }
          boundary.startedAtMonotonicNanoseconds = issuedStartedAtMonotonicNanoseconds;
          boundary.started = clock!.captureAt(issuedStartedAtMonotonicNanoseconds);
          openInvocation = invocation;
          eventLog!.append(workerEvent(
            eventSequence++,
            boundary.started,
            "invocation-started",
            "running",
            invocation,
          ));
          assertActive();
          const completion = nextWorkerLineAtAuthenticatedBoundary(session, complete);
          const [, observed] = await Promise.all([
            writeWorkerCommand(session, "invoke", invocation.invocationId),
            completion,
          ]);
          // The governed child boundary ends when the complete line arrives. Its envelope and
          // payload are parsed only after the leaf watchdog has stopped, under the outer
          // infrastructure deadline; malformed bytes still cannot earn a completed event.
          return observed;
        },
      );
      if (governed.terminalState === "complete") registerWorkerForOuterWatchdog(session, watchdog);
      if (boundary.started === null || boundary.startedAtMonotonicNanoseconds === null) {
        fail("governed leaf result lacks its exact parent-issued start boundary");
      }
      const finished = clock.captureAt(
        boundary.startedAtMonotonicNanoseconds + BigInt(governed.elapsedNanoseconds),
      );
      const rawElapsed = finished.monotonicOffsetNanoseconds -
        boundary.started.monotonicOffsetNanoseconds;
      if (!Number.isSafeInteger(rawElapsed) || rawElapsed < 0) {
        fail("A-P raw governed leaf elapsed nanoseconds are invalid");
      }
      const rawTerminalState = phase10C0VS6ClassifyGovernedElapsedNanoseconds(
        rawElapsed,
        invocation.registeredWallSecondsMaximum,
      );
      if (rawElapsed !== governed.elapsedNanoseconds || rawTerminalState !== governed.terminalState) {
        fail("governed leaf watchdog and retained raw timing boundary differ");
      }
      const terminalState = governed.terminalState;
      let validatedResult: unknown = null;
      if (terminalState === "complete") {
        const message = parseWorkerMessage(session, governed.value!);
        assertWorkerMessage(message, "result", invocation.invocationId);
        const decoded = phase10C0VS6DecodeWorkerPayload(message.payload!);
        validatedResult = validateApInvocationResult(
          packet,
          preflight,
          invocation.invocationId,
          decoded,
          results,
        );
      }
      eventLog.append(workerEvent(
        eventSequence++,
        finished,
        "invocation-finished",
        terminalState,
        invocation,
      ));
      openInvocation = null;
      if (terminalState === "registered-cap") {
        const exit = await session.exit;
        assertRawChildOutcome(exit, "registered-cap");
        writeExitStatus(root, packet, preflight, {
          workerProcessInvocationCount: 1,
          workerStarted: true,
          exitCode: exit.exitCode,
          signal: exit.signal,
          classification: "registered-cap",
        });
        assertWorkerTransportQuiescent(session);
        eventLog.append(workerEvent(
          eventSequence++,
          clock.capture(),
          "worker-stopped",
          "registered-cap",
          null,
        ));
        eventLog.closeAndReopen();
        eventLogClosed = true;
        writeWorkerDiagnostics(root, packet, preflight, session);
        return Object.freeze({ registeredCap: true, capturedGovernedCallerResult: null, workerExit: exit });
      }
      results.set(invocation.invocationId, validatedResult);
    }

    await writeWorkerCommand(session, "stop", null);
    const stopped = await nextWorkerMessage(session);
    assertWorkerMessage(stopped, "stopped", null);
    session.child.stdin.end();
    const exit = await session.exit;
    assertRawChildOutcome(exit, "complete");
    writeExitStatus(root, packet, preflight, {
      workerProcessInvocationCount: 1,
      workerStarted: true,
      exitCode: exit.exitCode,
      signal: exit.signal,
      classification: "complete",
    });
    assertWorkerTransportQuiescent(session);
    eventLog.append(workerEvent(
      eventSequence++,
      clock.capture(),
      "worker-stopped",
      "complete",
      null,
    ));
    eventLog.closeAndReopen();
    eventLogClosed = true;
    releaseWorkerOuterTarget(session);
    writeWorkerDiagnostics(root, packet, preflight, session);
    const capturedGovernedCallerResult = persistApCandidateArtifacts(root, preflight, results, watchdog);
    return Object.freeze({
      registeredCap: false,
      capturedGovernedCallerResult,
      workerExit: exit,
    });
  } catch (error) {
    const reason = error instanceof Error ? error : new Error(String(error));
    let rawFailureExit: Phase10C0VS6WorkerExitOutcome | null = null;
    try {
      await terminateWorker(session, reason);
      const rawExit = await session.exit;
      const rawClassification = rawExit.exitCode === 0 && rawExit.signal === null
        ? "complete"
        : "infrastructure-failure";
      assertRawChildOutcome(rawExit, rawClassification);
      if (session.processState.spawned) rawFailureExit = rawExit;
    } catch {
      // The active package/packet locks remain stale; cleanup failure cannot grant a claim.
    }
    if (session.outerTerminationRelease !== null) releaseWorkerOuterTarget(session);
    if (rawFailureExit !== null) {
      try {
        writeExitStatus(root, packet, preflight, {
          workerProcessInvocationCount: 1,
          workerStarted: true,
          exitCode: rawFailureExit.exitCode,
          signal: rawFailureExit.signal,
          classification: rawFailureExit.exitCode === 0
            ? "complete"
            : "infrastructure-failure",
        });
      } catch {
        // A prior exact raw exit or a failed write leaves the ignored root successor-only.
      }
    }
    if (eventLog !== null && !eventLogClosed) {
      try {
        if (clock !== null) {
          if (openInvocation !== null) {
            eventLog.append(workerEvent(
              eventSequence++,
              clock.capture(),
              "invocation-finished",
              "infrastructure-failure",
              openInvocation,
            ));
            openInvocation = null;
          }
          eventLog.append(workerEvent(
            eventSequence++,
            clock.capture(),
            "worker-stopped",
            "infrastructure-failure",
            null,
          ));
        }
        eventLog.closeAndReopen();
        eventLogClosed = true;
      } catch {
        // An incomplete ignored raw stream is retained beneath stale locks for successor review.
      }
    }
    try {
      writeWorkerDiagnostics(root, packet, preflight, session);
    } catch {
      // Failure to retain diagnostics also leaves the one-shot attempt fail-stopped.
    }
    throw error;
  }
}

async function runMovingWorker(
  root: Phase10C0VS6PhysicalRoot,
  authority: Phase10C0VS6LockedPacketAuthority,
  preflight: Phase10C0VS6RetainedPreflight,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): Promise<Phase10C0VS6GovernedWorkerOutcome> {
  const packet = authority.packet;
  const roster = movingInvocationRoster(packet);
  watchdog.assertActive();
  const transport = workerTransportBudget(authority, Object.freeze({
    lifecycle: 2,
    boundaryOrProgress: 0,
    artifact: 0,
    result: 1,
  }));
  if (transport.maximumMessages !== roster.length + 2) {
    fail("moving worker message budget differs from ready/result/stopped roster");
  }
  const session = startParentWorker(
    root,
    authority,
    transport.maximumMessages,
    transport.maximumStdoutBytes,
    transport.messageByteBudget,
  );
  registerWorkerForOuterWatchdog(session, watchdog);
  let eventLog: Phase10C0VS6WorkerInvocationEventLogWriter | null = null;
  let eventLogClosed = false;
  let eventSequence = 0;
  let clock: Phase10C0VS6MonotonicEventClock | null = null;
  let openInvocation: Phase10C0VS6GovernedInvocationAuthority | null = null;
  try {
    await session.spawned;
    clock = new Phase10C0VS6MonotonicEventClock();
    eventLog = phase10C0VS6CreateWorkerInvocationEventLog(
      root,
      attemptPath(preflight, packet.workerInvocationContract.filename),
      packet.workerInvocationContract,
      workerEvent(eventSequence++, clock.first(), "worker-started", "running", null),
    );
    const ready = await nextWorkerMessage(session);
    assertWorkerMessage(ready, "ready", null);

    const invocation = roster[0]!;
    watchdog.assertActive();
    const boundary: {
      started: Phase10C0VS6MonotonicEventPoint | null;
      startedAtMonotonicNanoseconds: bigint | null;
    } = { started: null, startedAtMonotonicNanoseconds: null };
    releaseWorkerOuterTarget(session);
    const governed = await phase10C0VS6RunGovernedLeafWithWatchdog<Uint8Array>(
      watchdog,
      invocation.registeredWallSecondsMaximum,
      (reason) => terminateWorker(session, reason),
      async (_signal, assertActive, complete, issuedStartedAtMonotonicNanoseconds) => {
        boundary.startedAtMonotonicNanoseconds = issuedStartedAtMonotonicNanoseconds;
        boundary.started = clock!.captureAt(issuedStartedAtMonotonicNanoseconds);
        openInvocation = invocation;
        eventLog!.append(workerEvent(
          eventSequence++,
          boundary.started,
          "invocation-started",
          "running",
          invocation,
        ));
        assertActive();
        const completion = nextWorkerLineAtAuthenticatedBoundary(session, complete);
        const [, observed] = await Promise.all([
          writeWorkerCommand(session, "invoke", invocation.invocationId),
          completion,
        ]);
        return observed;
      },
    );
    if (governed.terminalState === "complete") registerWorkerForOuterWatchdog(session, watchdog);
    if (boundary.started === null || boundary.startedAtMonotonicNanoseconds === null) {
      fail("moving governed leaf lacks its exact parent-issued start boundary");
    }
    const finished = clock.captureAt(
      boundary.startedAtMonotonicNanoseconds + BigInt(governed.elapsedNanoseconds),
    );
    const rawElapsed = finished.monotonicOffsetNanoseconds - boundary.started.monotonicOffsetNanoseconds;
    const rawTerminalState = phase10C0VS6ClassifyGovernedElapsedNanoseconds(
      rawElapsed,
      invocation.registeredWallSecondsMaximum,
    );
    if (!Number.isSafeInteger(rawElapsed) || rawElapsed < 0 ||
      rawElapsed !== governed.elapsedNanoseconds || rawTerminalState !== governed.terminalState) {
      fail("moving governed leaf watchdog and retained raw timing boundary differ");
    }
    let capturedGovernedCallerResult: StrictJson | null = null;
    if (governed.terminalState === "complete") {
      const message = parseWorkerMessage(session, governed.value!);
      assertWorkerMessage(message, "result", invocation.invocationId);
      capturedGovernedCallerResult = validateMovingInvocationResult(
        packet,
        invocation.invocationId,
        phase10C0VS6DecodeWorkerPayload(message.payload!),
      );
    }
    eventLog.append(workerEvent(
      eventSequence++,
      finished,
      "invocation-finished",
      governed.terminalState,
      invocation,
    ));
    openInvocation = null;
    if (governed.terminalState === "registered-cap") {
      const exit = await session.exit;
      assertRawChildOutcome(exit, "registered-cap");
      writeExitStatus(root, packet, preflight, {
        workerProcessInvocationCount: 1,
        workerStarted: true,
        exitCode: exit.exitCode,
        signal: exit.signal,
        classification: "registered-cap",
      });
      assertWorkerTransportQuiescent(session);
      eventLog.append(workerEvent(
        eventSequence++,
        clock.capture(),
        "worker-stopped",
        "registered-cap",
        null,
      ));
      eventLog.closeAndReopen();
      eventLogClosed = true;
      writeWorkerDiagnostics(root, packet, preflight, session);
      return Object.freeze({ registeredCap: true, capturedGovernedCallerResult: null, workerExit: exit });
    }

    await writeWorkerCommand(session, "stop", null);
    const stopped = await nextWorkerMessage(session);
    assertWorkerMessage(stopped, "stopped", null);
    session.child.stdin.end();
    const exit = await session.exit;
    assertRawChildOutcome(exit, "complete");
    writeExitStatus(root, packet, preflight, {
      workerProcessInvocationCount: 1,
      workerStarted: true,
      exitCode: exit.exitCode,
      signal: exit.signal,
      classification: "complete",
    });
    assertWorkerTransportQuiescent(session);
    eventLog.append(workerEvent(eventSequence++, clock.capture(), "worker-stopped", "complete", null));
    eventLog.closeAndReopen();
    eventLogClosed = true;
    releaseWorkerOuterTarget(session);
    writeWorkerDiagnostics(root, packet, preflight, session);
    if (capturedGovernedCallerResult === null) fail("moving complete worker lacks its governed caller result");
    return Object.freeze({ registeredCap: false, capturedGovernedCallerResult, workerExit: exit });
  } catch (error) {
    const reason = error instanceof Error ? error : new Error(String(error));
    let rawFailureExit: Phase10C0VS6WorkerExitOutcome | null = null;
    try {
      await terminateWorker(session, reason);
      const rawExit = await session.exit;
      const rawClassification = rawExit.exitCode === 0 && rawExit.signal === null
        ? "complete"
        : "infrastructure-failure";
      assertRawChildOutcome(rawExit, rawClassification);
      if (session.processState.spawned) rawFailureExit = rawExit;
    } catch {
      // The active package/packet locks remain stale; cleanup failure cannot grant a claim.
    }
    if (session.outerTerminationRelease !== null) releaseWorkerOuterTarget(session);
    if (rawFailureExit !== null) {
      try {
        writeExitStatus(root, packet, preflight, {
          workerProcessInvocationCount: 1,
          workerStarted: true,
          exitCode: rawFailureExit.exitCode,
          signal: rawFailureExit.signal,
          classification: rawFailureExit.exitCode === 0 ? "complete" : "infrastructure-failure",
        });
      } catch {
        // A prior raw exit or failed write leaves the ignored root successor-only.
      }
    }
    if (eventLog !== null && !eventLogClosed) {
      try {
        if (clock !== null) {
          if (openInvocation !== null) {
            eventLog.append(workerEvent(
              eventSequence++,
              clock.capture(),
              "invocation-finished",
              "infrastructure-failure",
              openInvocation,
            ));
            openInvocation = null;
          }
          eventLog.append(workerEvent(
            eventSequence++,
            clock.capture(),
            "worker-stopped",
            "infrastructure-failure",
            null,
          ));
        }
        eventLog.closeAndReopen();
        eventLogClosed = true;
      } catch {
        // An incomplete ignored raw stream is retained beneath stale locks for successor review.
      }
    }
    try {
      writeWorkerDiagnostics(root, packet, preflight, session);
    } catch {
      // Diagnostic retention failure also leaves the one-shot attempt fail-stopped.
    }
    throw error;
  }
}

async function runMovingPublishWorker(
  root: Phase10C0VS6PhysicalRoot,
  authority: Phase10C0VS6LockedPacketAuthority,
  preflight: Phase10C0VS6RetainedPreflight,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): Promise<Phase10C0VS6GovernedWorkerOutcome> {
  const packet = authority.packet;
  const roster = movingPublishInvocationRoster(packet);
  watchdog.assertActive();
  const transport = workerTransportBudget(authority, Object.freeze({
    lifecycle: 2,
    boundaryOrProgress: 0,
    artifact: 0,
    result: 2,
  }));
  if (transport.maximumMessages !== roster.length + 2) {
    fail("moving-publish worker message budget differs from ready/results/stopped roster");
  }
  const session = startParentWorker(
    root,
    authority,
    transport.maximumMessages,
    transport.maximumStdoutBytes,
    transport.messageByteBudget,
  );
  registerWorkerForOuterWatchdog(session, watchdog);
  let eventLog: Phase10C0VS6WorkerInvocationEventLogWriter | null = null;
  let eventLogClosed = false;
  let eventSequence = 0;
  let clock: Phase10C0VS6MonotonicEventClock | null = null;
  let openInvocation: Phase10C0VS6GovernedInvocationAuthority | null = null;
  const results = new Map<string, unknown>();
  try {
    await session.spawned;
    clock = new Phase10C0VS6MonotonicEventClock();
    eventLog = phase10C0VS6CreateWorkerInvocationEventLog(
      root,
      attemptPath(preflight, packet.workerInvocationContract.filename),
      packet.workerInvocationContract,
      workerEvent(eventSequence++, clock.first(), "worker-started", "running", null),
    );
    const ready = await nextWorkerMessage(session);
    assertWorkerMessage(ready, "ready", null);

    for (const invocation of roster) {
      watchdog.assertActive();
      const boundary: {
        started: Phase10C0VS6MonotonicEventPoint | null;
        startedAtMonotonicNanoseconds: bigint | null;
      } = { started: null, startedAtMonotonicNanoseconds: null };
      releaseWorkerOuterTarget(session);
      const governed = await phase10C0VS6RunGovernedLeafWithWatchdog<Uint8Array>(
        watchdog,
        invocation.registeredWallSecondsMaximum,
        (reason) => terminateWorker(session, reason),
        async (_signal, assertActive, complete, issuedStartedAtMonotonicNanoseconds) => {
          if (boundary.started !== null || boundary.startedAtMonotonicNanoseconds !== null) {
            fail("moving-publish governed leaf start boundary was issued more than once");
          }
          boundary.startedAtMonotonicNanoseconds = issuedStartedAtMonotonicNanoseconds;
          boundary.started = clock!.captureAt(issuedStartedAtMonotonicNanoseconds);
          openInvocation = invocation;
          eventLog!.append(workerEvent(
            eventSequence++,
            boundary.started,
            "invocation-started",
            "running",
            invocation,
          ));
          assertActive();
          const completion = nextWorkerLineAtAuthenticatedBoundary(session, complete);
          const [, observed] = await Promise.all([
            writeWorkerCommand(session, "invoke", invocation.invocationId),
            completion,
          ]);
          return observed;
        },
      );
      if (governed.terminalState === "complete") registerWorkerForOuterWatchdog(session, watchdog);
      if (boundary.started === null || boundary.startedAtMonotonicNanoseconds === null) {
        fail("moving-publish governed leaf lacks its exact parent-issued start boundary");
      }
      const finished = clock.captureAt(
        boundary.startedAtMonotonicNanoseconds + BigInt(governed.elapsedNanoseconds),
      );
      const rawElapsed = finished.monotonicOffsetNanoseconds - boundary.started.monotonicOffsetNanoseconds;
      const rawTerminalState = phase10C0VS6ClassifyGovernedElapsedNanoseconds(
        rawElapsed,
        invocation.registeredWallSecondsMaximum,
      );
      if (!Number.isSafeInteger(rawElapsed) || rawElapsed < 0 ||
        rawElapsed !== governed.elapsedNanoseconds || rawTerminalState !== governed.terminalState) {
        fail("moving-publish governed leaf watchdog and retained raw timing boundary differ");
      }
      let validatedResult: unknown = null;
      if (governed.terminalState === "complete") {
        const message = parseWorkerMessage(session, governed.value!);
        assertWorkerMessage(message, "result", invocation.invocationId);
        validatedResult = validateMovingPublishInvocationResult(
          packet,
          preflight,
          invocation.invocationId,
          phase10C0VS6DecodeWorkerPayload(message.payload!),
          results,
        );
      }
      eventLog.append(workerEvent(
        eventSequence++,
        finished,
        "invocation-finished",
        governed.terminalState,
        invocation,
      ));
      openInvocation = null;
      if (governed.terminalState === "registered-cap") {
        const exit = await session.exit;
        assertRawChildOutcome(exit, "registered-cap");
        writeExitStatus(root, packet, preflight, {
          workerProcessInvocationCount: 1,
          workerStarted: true,
          exitCode: exit.exitCode,
          signal: exit.signal,
          classification: "registered-cap",
        });
        assertWorkerTransportQuiescent(session);
        eventLog.append(workerEvent(
          eventSequence++,
          clock.capture(),
          "worker-stopped",
          "registered-cap",
          null,
        ));
        eventLog.closeAndReopen();
        eventLogClosed = true;
        writeWorkerDiagnostics(root, packet, preflight, session);
        return Object.freeze({ registeredCap: true, capturedGovernedCallerResult: null, workerExit: exit });
      }
      results.set(invocation.invocationId, validatedResult);
    }

    await writeWorkerCommand(session, "stop", null);
    const stopped = await nextWorkerMessage(session);
    assertWorkerMessage(stopped, "stopped", null);
    session.child.stdin.end();
    const exit = await session.exit;
    assertRawChildOutcome(exit, "complete");
    writeExitStatus(root, packet, preflight, {
      workerProcessInvocationCount: 1,
      workerStarted: true,
      exitCode: exit.exitCode,
      signal: exit.signal,
      classification: "complete",
    });
    assertWorkerTransportQuiescent(session);
    eventLog.append(workerEvent(eventSequence++, clock.capture(), "worker-stopped", "complete", null));
    eventLog.closeAndReopen();
    eventLogClosed = true;
    releaseWorkerOuterTarget(session);
    writeWorkerDiagnostics(root, packet, preflight, session);
    const capturedGovernedCallerResult = persistMovingPublishCandidateArtifacts(
      root,
      preflight,
      results,
      watchdog,
    );
    return Object.freeze({ registeredCap: false, capturedGovernedCallerResult, workerExit: exit });
  } catch (error) {
    const reason = error instanceof Error ? error : new Error(String(error));
    let rawFailureExit: Phase10C0VS6WorkerExitOutcome | null = null;
    try {
      await terminateWorker(session, reason);
      const rawExit = await session.exit;
      const rawClassification = rawExit.exitCode === 0 && rawExit.signal === null
        ? "complete"
        : "infrastructure-failure";
      assertRawChildOutcome(rawExit, rawClassification);
      if (session.processState.spawned) rawFailureExit = rawExit;
    } catch {
      // The active package/packet locks remain stale; cleanup failure cannot grant a claim.
    }
    if (session.outerTerminationRelease !== null) releaseWorkerOuterTarget(session);
    if (rawFailureExit !== null) {
      try {
        writeExitStatus(root, packet, preflight, {
          workerProcessInvocationCount: 1,
          workerStarted: true,
          exitCode: rawFailureExit.exitCode,
          signal: rawFailureExit.signal,
          classification: rawFailureExit.exitCode === 0 ? "complete" : "infrastructure-failure",
        });
      } catch {
        // A prior raw exit or failed write leaves the ignored root successor-only.
      }
    }
    if (eventLog !== null && !eventLogClosed) {
      try {
        if (clock !== null) {
          if (openInvocation !== null) {
            eventLog.append(workerEvent(
              eventSequence++,
              clock.capture(),
              "invocation-finished",
              "infrastructure-failure",
              openInvocation,
            ));
            openInvocation = null;
          }
          eventLog.append(workerEvent(
            eventSequence++,
            clock.capture(),
            "worker-stopped",
            "infrastructure-failure",
            null,
          ));
        }
        eventLog.closeAndReopen();
        eventLogClosed = true;
      } catch {
        // An incomplete ignored raw stream is retained beneath stale locks for successor review.
      }
    }
    try {
      writeWorkerDiagnostics(root, packet, preflight, session);
    } catch {
      // Diagnostic retention failure also leaves the one-shot attempt fail-stopped.
    }
    throw error;
  }
}

async function runLockedApPacket(
  root: Phase10C0VS6PhysicalRoot,
  locks: Phase10C0VS6PackageAndPacketLockContext,
  authority: Phase10C0VS6LockedPacketAuthority,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): Promise<Phase10C0VS6RunResult> {
  const packet = authority.packet;
  if (packet.packetId !== "a-p-c0v-s6" ||
    packet.registeredAttemptId !== "a-p-c0v-s6-20260822-v1") {
    fail("locked A-P runner received different packet authority");
  }
  watchdog.assertActive();
  const writtenPreflight = phase10C0VS6WriteObservedPreflight({ root, locks, authority, watchdog });
  watchdog.assertActive();
  const preflight = writtenPreflight.receipt;
  phase10C0VS6EnsurePhysicalDirectory(root, preflight.observed.attemptDirectory);
  writeRetainedFreeze(root, authority, preflight, writtenPreflight.bytes, watchdog);

  let capturedGovernedCallerResult: StrictJson | null = null;
  if (preflight.verdict === "refusal") {
    if (preflight.refusalCandidate === null) fail("refusal preflight lacks its exact candidate");
    writeExitStatus(root, packet, preflight, {
      workerProcessInvocationCount: 0,
      workerStarted: false,
      exitCode: null,
      signal: null,
      classification: "no-worker",
    });
    writeWorkerDiagnostics(root, packet, preflight, null);
    writeRawCause(root, authority, preflight, writtenPreflight.bytes, watchdog);
  } else {
    if (preflight.refusalCandidate !== null) fail("passing preflight retains a refusal candidate");
    const worker = await runApWorker(root, authority, preflight, watchdog);
    capturedGovernedCallerResult = worker.capturedGovernedCallerResult;
    if (worker.registeredCap) {
      writeRawCause(root, authority, preflight, writtenPreflight.bytes, watchdog);
    }
  }

  watchdog.assertActive();
  const finalized = independentlyFinalizePhase10C0VS6ApPacket(Object.freeze({
    ...rawRuntimeInput(root, authority, writtenPreflight.bytes),
    locks,
    lockedAuthority: authority,
    watchdog,
    capturedGovernedCallerResult,
  }));
  return Object.freeze({
    mode: "run",
    packetId: "a-p-c0v-s6",
    registeredAttemptId: "a-p-c0v-s6-20260822-v1",
    selectedSubrouteId: finalized.terminalCandidate.lifecycle.selectedSubrouteId,
    terminalState: finalized.terminalCandidate.lifecycle.terminalState,
    terminalReceiptIdentity: finalized.terminalReceiptIdentity,
    verificationIdentity: finalized.verificationIdentity,
  });
}

async function runLockedMovingPacket(
  root: Phase10C0VS6PhysicalRoot,
  locks: Phase10C0VS6PackageAndPacketLockContext,
  authority: Phase10C0VS6LockedPacketAuthority,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): Promise<Phase10C0VS6RunResult> {
  const packet = authority.packet;
  if (packet.packetId !== "c0v-moving-produce" ||
    packet.registeredAttemptId !== "c0v-moving-produce-20260822-v1") {
    fail("locked moving runner received different packet authority");
  }
  watchdog.assertActive();
  const writtenPreflight = phase10C0VS6WriteObservedPreflight({ root, locks, authority, watchdog });
  watchdog.assertActive();
  const preflight = writtenPreflight.receipt;
  phase10C0VS6EnsurePhysicalDirectory(root, preflight.observed.attemptDirectory);
  writeRetainedFreeze(root, authority, preflight, writtenPreflight.bytes, watchdog);

  let capturedGovernedCallerResult: StrictJson | null = null;
  if (preflight.verdict === "refusal") {
    if (preflight.refusalCandidate === null) fail("moving refusal preflight lacks its exact candidate");
    writeExitStatus(root, packet, preflight, {
      workerProcessInvocationCount: 0,
      workerStarted: false,
      exitCode: null,
      signal: null,
      classification: "no-worker",
    });
    writeWorkerDiagnostics(root, packet, preflight, null);
  } else {
    if (preflight.refusalCandidate !== null) fail("passing moving preflight retains a refusal candidate");
    const worker = await runMovingWorker(root, authority, preflight, watchdog);
    capturedGovernedCallerResult = worker.capturedGovernedCallerResult;
  }
  // Every materializable moving outcome is a raw-derived refusal: preflight, registered cap,
  // or the independently confirmed reference discrepancy.
  writeRawCause(root, authority, preflight, writtenPreflight.bytes, watchdog);
  watchdog.assertActive();
  const finalized = independentlyFinalizePhase10C0VS6MovingProducePacket(Object.freeze({
    ...rawRuntimeInput(root, authority, writtenPreflight.bytes),
    locks,
    lockedAuthority: authority,
    watchdog,
    capturedGovernedCallerResult,
  }));
  return Object.freeze({
    mode: "run",
    packetId: "c0v-moving-produce",
    registeredAttemptId: "c0v-moving-produce-20260822-v1",
    selectedSubrouteId: finalized.terminalCandidate.lifecycle.selectedSubrouteId,
    terminalState: finalized.terminalCandidate.lifecycle.terminalState,
    terminalReceiptIdentity: finalized.terminalReceiptIdentity,
    verificationIdentity: finalized.verificationIdentity,
  });
}

async function runLockedMovingPublishPacket(
  root: Phase10C0VS6PhysicalRoot,
  locks: Phase10C0VS6PackageAndPacketLockContext,
  authority: Phase10C0VS6LockedPacketAuthority,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): Promise<Phase10C0VS6RunResult> {
  const packet = authority.packet;
  if (packet.packetId !== "c0v-moving-publish" ||
    packet.registeredAttemptId !== "c0v-moving-publish-20260822-v1") {
    fail("locked moving-publish runner received different packet authority");
  }
  watchdog.assertActive();
  const writtenPreflight = phase10C0VS6WriteObservedPreflight({ root, locks, authority, watchdog });
  watchdog.assertActive();
  const preflight = writtenPreflight.receipt;
  phase10C0VS6EnsurePhysicalDirectory(root, preflight.observed.attemptDirectory);
  writeRetainedFreeze(root, authority, preflight, writtenPreflight.bytes, watchdog);

  let capturedGovernedCallerResult: StrictJson | null = null;
  if (preflight.verdict === "refusal") {
    if (preflight.refusalCandidate === null) {
      fail("moving-publish refusal preflight lacks its exact candidate");
    }
    writeExitStatus(root, packet, preflight, {
      workerProcessInvocationCount: 0,
      workerStarted: false,
      exitCode: null,
      signal: null,
      classification: "no-worker",
    });
    writeWorkerDiagnostics(root, packet, preflight, null);
    writeRawCause(root, authority, preflight, writtenPreflight.bytes, watchdog);
  } else {
    if (preflight.refusalCandidate !== null) {
      fail("passing moving-publish preflight retains a refusal candidate");
    }
    const worker = await runMovingPublishWorker(root, authority, preflight, watchdog);
    capturedGovernedCallerResult = worker.capturedGovernedCallerResult;
    if (worker.registeredCap) {
      writeRawCause(root, authority, preflight, writtenPreflight.bytes, watchdog);
    }
  }

  watchdog.assertActive();
  const finalized = independentlyFinalizePhase10C0VS6MovingPublishPacket(Object.freeze({
    ...rawRuntimeInput(root, authority, writtenPreflight.bytes),
    locks,
    lockedAuthority: authority,
    watchdog,
    capturedGovernedCallerResult,
  }));
  return Object.freeze({
    mode: "run",
    packetId: "c0v-moving-publish",
    registeredAttemptId: "c0v-moving-publish-20260822-v1",
    selectedSubrouteId: finalized.terminalCandidate.lifecycle.selectedSubrouteId,
    terminalState: finalized.terminalCandidate.lifecycle.terminalState,
    terminalReceiptIdentity: finalized.terminalReceiptIdentity,
    verificationIdentity: finalized.verificationIdentity,
  });
}

/**
 * Lock-free static inspection. It deliberately reads only compiled configuration authority and
 * callable module bytes. It cannot observe or return a preflight/resource/dependency verdict.
 */
export function phase10C0VS6CheckExecutorConfiguration(
  repositoryRoot: string,
  argumentsValue: Phase10C0VS6ExecutorArguments,
): Phase10C0VS6CheckResult {
  if (argumentsValue.mode !== "check") fail("static configuration inspection requires check mode");
  const root = phase10C0VS6PhysicalRepositoryRoot(repositoryRoot);
  const catalogueBytes = phase10C0VS6ReadUniquePhysicalFile(root, PACKET_CATALOGUE_PATH);
  const catalogueIdentity = phase10C0VS6ArtifactIdentity(PACKET_CATALOGUE_PATH, catalogueBytes);
  const catalogue = parsePhase10C0VS6PacketCatalogue(
    parsePhase10C0VS6PrettyJsonBytes(catalogueBytes, "executor packet catalogue"),
  );
  if (catalogue.workerTransportContract.maximumLineBytes !==
    PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES) {
    fail("compiled worker line bound differs from packet-catalogue authority");
  }
  if (catalogue.workerTransportContract.maximumStderrBytes !==
    PHASE10_C0V_S6_MAXIMUM_WORKER_STDERR_BYTES) {
    fail("compiled worker stderr bound differs from packet-catalogue authority");
  }
  const catalogueEntries = catalogue.packets.filter((entry) => entry.packetId === argumentsValue.packetId);
  if (catalogueEntries.length !== 1) fail("selected packet does not occur exactly once in the catalogue");
  const catalogueEntry = catalogueEntries[0]!;
  const compiled = PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY[argumentsValue.packetId];
  if (catalogueEntry.protocolPath !== compiled.protocolPath ||
    catalogueEntry.protocolPath !== argumentsValue.protocolPath) {
    fail("catalogue protocol path differs from compiled CLI authority");
  }

  const protocolBytes = phase10C0VS6ReadUniquePhysicalFile(root, argumentsValue.protocolPath);
  const protocolIdentity = phase10C0VS6ArtifactIdentity(argumentsValue.protocolPath, protocolBytes);
  const packet = parsePhase10C0VS6PacketProtocol(
    parsePhase10C0VS6PrettyJsonBytes(protocolBytes, "executor packet protocol"),
  );
  if (packet.packetId !== argumentsValue.packetId ||
    packet.registeredAttemptId !== argumentsValue.attemptId ||
    packet.paths.attemptRoot !== catalogueEntry.attemptRoot ||
    packet.paths.lockPath !== catalogueEntry.lockPath ||
    packet.paths.preflightReceiptPath !== catalogueEntry.preflightReceiptPath ||
    packet.paths.terminalReceiptPath !== catalogueEntry.terminalReceiptPath ||
    packet.bindings.callableRegistry.path !== catalogueEntry.callableRegistryPath ||
    packet.verification.filename !== catalogueEntry.verificationFilename ||
    packet.verification.schemaId !== catalogueEntry.verificationSchemaId ||
    !packet.paths.allowedPublicationPaths.includes(catalogueEntry.verificationPath)) {
    fail("packet protocol differs from the exact catalogue mapping");
  }
  sameIdentityValue(packet.bindings.packetCatalogue, catalogueIdentity, "packet catalogue binding");
  const commands = packet.commandTemplates.filter((entry) => entry.commandId === argumentsValue.mode);
  if (commands.length !== 1 || commands[0]!.command !== exactCommand(argumentsValue)) {
    fail("selected CLI bytes differ from the packet's exact command template");
  }

  const registryBytes = phase10C0VS6ReadUniquePhysicalFile(root, catalogueEntry.callableRegistryPath);
  const registryIdentity = phase10C0VS6ArtifactIdentity(catalogueEntry.callableRegistryPath, registryBytes);
  sameIdentityValue(packet.bindings.callableRegistry, registryIdentity, "packet callable-registry binding");
  const registry = parsePhase10C0VS6CallableRegistry(
    parsePhase10C0VS6PrettyJsonBytes(registryBytes, "executor callable registry"),
  );
  if (registry.packetId !== packet.packetId || registry.protocolId !== packet.protocolId ||
    registry.registryId !== packet.registryId || registry.matrixId !== packet.matrixId) {
    fail("callable registry identity scope differs from the selected packet protocol");
  }

  let allCallablesResolved = true;
  for (const callable of registry.callables) {
    if (callable.resolution === "planned") {
      allCallablesResolved = false;
      continue;
    }
    if (callable.identity === null) fail(`${callable.callableId} is resolved without an identity`);
    const moduleBytes = phase10C0VS6ReadUniquePhysicalFile(root, callable.modulePath);
    const moduleIdentity = phase10C0VS6ArtifactIdentity(callable.modulePath, moduleBytes);
    if (moduleIdentity.byteLength !== callable.identity.byteLength ||
      moduleIdentity.sha256 !== callable.identity.sha256) {
      fail(`${callable.callableId} live module bytes differ from its resolved registry identity`);
    }
  }

  // Implemented routes remain disabled until every callable and runtime boundary is
  // implementation-freeze resolved. This flag is informational, never launch authority: run
  // performs all mutable observations again beneath both locks.
  const executableNow = (
    (argumentsValue.packetId === "a-p-c0v-s6" && AP_RUN_IMPLEMENTATION_FREEZE_READY) ||
    (argumentsValue.packetId === "c0v-moving-produce" && MOVING_RUN_IMPLEMENTATION_FREEZE_READY) ||
    (argumentsValue.packetId === "c0v-moving-publish" && MOVING_PUBLISH_RUN_IMPLEMENTATION_FREEZE_READY)
  ) && allCallablesResolved;
  return Object.freeze({
    mode: "check",
    packetId: argumentsValue.packetId,
    registeredAttemptId: argumentsValue.attemptId,
    protocolIdentity,
    registryIdentity,
    inspection: "configuration-valid-non-authorizing",
    executableNow,
    preflightObserved: false,
    runAuthorized: false,
    limits: CHECK_LIMITS,
  });
}

/** Shared parent entrypoint frozen by the package catalogue. */
export async function phase10C0VS6RunExecutor(
  argv: readonly string[],
  repositoryRoot = cwd(),
): Promise<Phase10C0VS6ExecutorResult> {
  phase10C0VS6AssertExactRuntimeLoaderState();
  const parsed = phase10C0VS6ParseExecutorArguments(argv);
  if (parsed.mode === "check") return phase10C0VS6CheckExecutorConfiguration(repositoryRoot, parsed);
  // Unsupported packets and a not-yet-frozen A-P runtime fail before repository or lock
  // observation, so they cannot consume a one-shot attempt.
  const ready = parsed.packetId === "a-p-c0v-s6"
    ? AP_RUN_IMPLEMENTATION_FREEZE_READY
    : parsed.packetId === "c0v-moving-produce"
      ? MOVING_RUN_IMPLEMENTATION_FREEZE_READY
      : parsed.packetId === "c0v-moving-publish"
        ? MOVING_PUBLISH_RUN_IMPLEMENTATION_FREEZE_READY
        : false;
  if (!ready) {
    fail(`${parsed.packetId} run is fail-closed until its raw finalizer is implementation-freeze ready`);
  }
  const root = phase10C0VS6PhysicalRepositoryRoot(repositoryRoot);
  return phase10C0VS6WithPackageAndPacketLocks(
    root,
    parsed.packetId,
    "run",
    (locks, authority, watchdog) => parsed.packetId === "a-p-c0v-s6"
      ? runLockedApPacket(root, locks, authority, watchdog)
      : parsed.packetId === "c0v-moving-produce"
        ? runLockedMovingPacket(root, locks, authority, watchdog)
        : runLockedMovingPublishPacket(root, locks, authority, watchdog),
  );
}

async function main(): Promise<void> {
  try {
    const result = await phase10C0VS6RunExecutor(processArguments.slice(2));
    const bytes = phase10C0VS6PrettyJsonBytes(result);
    writeSync(1, bytes, 0, bytes.byteLength);
  } catch (error) {
    const message = `${error instanceof Error ? error.message : "Phase 10 C0V S6 executor failed"}\n`;
    const bytes = new TextEncoder().encode(message);
    writeSync(2, bytes, 0, bytes.byteLength);
    exitProcess(1);
  }
}

if (processArguments[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(processArguments[1])).href) await main();
