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
import {
  parsePhase10C0VAggregateArtifactIndexBytes,
  parsePhase10C0VAggregateResultBytes,
  parsePhase10C0VAnyLayerNonpassControlReceiptBytes,
  parsePhase10C0VResourceLedgerBytes,
  parsePhase10C0VTerminalTableBytes,
} from "./phase10-c0v-s6-aggregate-contracts.ts";
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
  parsePhase10C0VS6ArtifactIdentity,
  phase10C0VS6PrettyJsonBytes,
  phase10C0VS6SameIdentity,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6WorkerProgressRecord,
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
  independentlyFinalizePhase10C0VS6AggregatePacket,
  independentlyFinalizePhase10C0VS6MovingProducePacket,
  independentlyFinalizePhase10C0VS6MovingPublishPacket,
  independentlyFinalizePhase10C0VS6RadialProducePacket,
  independentlyFinalizePhase10C0VS6RadialPublishPacket,
  independentlyFinalizePhase10C0VS6StaticProducePacket,
  independentlyFinalizePhase10C0VS6StaticPublishPacket,
} from "./phase10-c0v-s6-published-packet.ts";
import {
  parsePhase10C0VS6RadialEvaluationBytes,
  writePhase10C0VS6CauseEvaluationReceipt,
  writePhase10C0VS6ExitStatusReceipt,
  writePhase10C0VS6FreezeEvaluationReceipt,
} from "./phase10-c0v-s6-receipts.ts";
import { phase10C0VS6RefusalCheckCaller } from "./phase10-c0v-s6-refusal.ts";
import {
  phase10C0VS6CaptureGovernedLeafArrivalTransition,
  phase10C0VS6ClassifyGovernedElapsedNanoseconds,
  phase10C0VS6RunGovernedLeafFromArrivalWithWatchdog,
  phase10C0VS6RunGovernedLeafFromDeferredArrivalWithWatchdog,
  phase10C0VS6RunGovernedLeafWithWatchdog,
  type Phase10C0VS6GovernedLeafCompletion,
  type Phase10C0VS6GovernedLeafArrivalTransition,
  type Phase10C0VS6ParentWatchdogContext,
} from "./phase10-c0v-s6-watchdog.ts";
import {
  phase10C0VS6CreateWorkerInvocationEventLog,
  type Phase10C0VS6WorkerInvocationEventLogWriter,
  type Phase10C0VS6WorkerInvocationEventRecord,
} from "./phase10-c0v-s6-worker-invocation.ts";
import {
  phase10C0VS6CreateWorkerProgressEventLog,
  type Phase10C0VS6WorkerProgressEventLogWriter,
} from "./phase10-c0v-s6-worker-progress.ts";
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

const PACKET_CATALOGUE_PATH =
  "research/phase10-execution-v2/recovery-v3/packet-catalogue.json" as const;
const CHECK_LIMITS = Object.freeze([
  "no-lock-or-authorizing-preflight-observation",
  "no-resource-or-mutable-dependency-observation",
  "no-worker-or-attempt-or-publication-write",
  "no-claim-credit-or-run-or-resume-authority",
] as const);
const AP_RUN_IMPLEMENTATION_FREEZE_READY = true;
const MOVING_RUN_IMPLEMENTATION_FREEZE_READY = true;
const MOVING_PUBLISH_RUN_IMPLEMENTATION_FREEZE_READY = true;
const RADIAL_RUN_IMPLEMENTATION_FREEZE_READY = true;
const RADIAL_PUBLISH_RUN_IMPLEMENTATION_FREEZE_READY = true;
const STATIC_RUN_IMPLEMENTATION_FREEZE_READY = true;
const STATIC_PUBLISH_RUN_IMPLEMENTATION_FREEZE_READY = true;
const AGGREGATE_RUN_IMPLEMENTATION_FREEZE_READY = true;
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
const STATIC_INVOCATION_AUTHORITY = Object.freeze([
  Object.freeze({
    invocationId: "inv-c0v-static-cause",
    callableId: "phase10-c0v-static-produce-check-caller",
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
const RADIAL_PUBLISH_INVOCATION_AUTHORITY = Object.freeze([
  Object.freeze({
    invocationId: "inv-c0v-radial-publish-producer",
    callableId: "phase10-c0v-radial-publish-producer",
    negativeControlId: null,
    invocationClass: "packet-producer",
    registeredWallSecondsMaximum: 14400,
  }),
  Object.freeze({
    invocationId: "inv-c0v-radial-publish-check-caller",
    callableId: "phase10-c0v-radial-publish-check-caller",
    negativeControlId: null,
    invocationClass: "packet-evaluator",
    registeredWallSecondsMaximum: 14400,
  }),
] as const);
const STATIC_PUBLISH_INVOCATION_AUTHORITY = Object.freeze([
  Object.freeze({
    invocationId: "inv-c0v-static-publish-producer",
    callableId: "phase10-c0v-static-publish-producer",
    negativeControlId: null,
    invocationClass: "packet-producer",
    registeredWallSecondsMaximum: 14400,
  }),
  Object.freeze({
    invocationId: "inv-c0v-static-publish-check-caller",
    callableId: "phase10-c0v-static-publish-check-caller",
    negativeControlId: null,
    invocationClass: "packet-evaluator",
    registeredWallSecondsMaximum: 14400,
  }),
] as const);
const RADIAL_INVOCATION_AUTHORITY = Object.freeze([
  Object.freeze({
    invocationId: "inv-c0v-radial-production",
    callableId: "phase10-c0v-radial-production-producer",
    negativeControlId: null,
    invocationClass: "solver-production",
    registeredWallSecondsMaximum: 300,
  }),
  Object.freeze({
    invocationId: "inv-c0v-radial-evaluator",
    callableId: "phase10-c0v-radial-evaluator",
    negativeControlId: null,
    invocationClass: "numerical-evaluator",
    registeredWallSecondsMaximum: 14400,
  }),
  Object.freeze({
    invocationId: "inv-c0v-radial-nc-finite-shell-term",
    callableId: "phase10-nc-radial-finite-shell-term",
    negativeControlId: "nc-radial-finite-shell-term",
    invocationClass: "numerical-negative-control",
    registeredWallSecondsMaximum: 14400,
  }),
  Object.freeze({
    invocationId: "inv-c0v-radial-nc-forged-summary",
    callableId: "phase10-nc-radial-forged-summary",
    negativeControlId: "nc-radial-forged-summary",
    invocationClass: "numerical-negative-control",
    registeredWallSecondsMaximum: 14400,
  }),
  Object.freeze({
    invocationId: "inv-c0v-radial-nc-robin-coefficient",
    callableId: "phase10-nc-radial-robin-coefficient",
    negativeControlId: "nc-radial-robin-coefficient",
    invocationClass: "numerical-negative-control",
    registeredWallSecondsMaximum: 14400,
  }),
] as const);
const AGGREGATE_INVOCATION_AUTHORITY = Object.freeze([
  Object.freeze({
    invocationId: "inv-c0v-aggregate-nc-any-layer-nonpass",
    callableId: "phase10-nc-c0v-any-layer-nonpass",
    negativeControlId: "nc-c0v-any-layer-nonpass",
    invocationClass: "packet-negative-control",
    registeredWallSecondsMaximum: 14400,
  }),
  Object.freeze({
    invocationId: "inv-c0v-aggregate-producer",
    callableId: "phase10-c0v-aggregate-producer",
    negativeControlId: null,
    invocationClass: "packet-producer",
    registeredWallSecondsMaximum: 14400,
  }),
  Object.freeze({
    invocationId: "inv-c0v-aggregate-check-caller",
    callableId: "phase10-c0v-aggregate-check-caller",
    negativeControlId: null,
    invocationClass: "packet-evaluator",
    registeredWallSecondsMaximum: 14400,
  }),
] as const);

interface Phase10C0VS6MatchOnlyParentConfig {
  readonly packetId: "c0v-moving-produce" | "c0v-static-produce";
  readonly registeredAttemptId:
    | "c0v-moving-produce-20260822-v1"
    | "c0v-static-produce-20260822-v1";
  readonly label: "moving" | "static";
  readonly invocationAuthority: readonly Phase10C0VS6GovernedInvocationAuthority[];
  readonly invocationId: "inv-c0v-moving-cause" | "inv-c0v-static-cause";
  readonly layerId: "C0V-MOVING-EVENT" | "C0V-STATIC";
  readonly dispositionCode: "reference-discrepancy-refusal" | "preimplementation-reference-refusal";
  readonly checkId: "chk-c0v-moving-discrepancy-validity" | "chk-c0v-static-refusal-validity";
}

const MOVING_PARENT_CONFIG: Phase10C0VS6MatchOnlyParentConfig = Object.freeze({
  packetId: "c0v-moving-produce",
  registeredAttemptId: "c0v-moving-produce-20260822-v1",
  label: "moving",
  invocationAuthority: MOVING_INVOCATION_AUTHORITY,
  invocationId: "inv-c0v-moving-cause",
  layerId: "C0V-MOVING-EVENT",
  dispositionCode: "reference-discrepancy-refusal",
  checkId: "chk-c0v-moving-discrepancy-validity",
});

const STATIC_PARENT_CONFIG: Phase10C0VS6MatchOnlyParentConfig = Object.freeze({
  packetId: "c0v-static-produce",
  registeredAttemptId: "c0v-static-produce-20260822-v1",
  label: "static",
  invocationAuthority: STATIC_INVOCATION_AUTHORITY,
  invocationId: "inv-c0v-static-cause",
  layerId: "C0V-STATIC",
  dispositionCode: "preimplementation-reference-refusal",
  checkId: "chk-c0v-static-refusal-validity",
});

interface Phase10C0VS6LayerPublishParentConfig {
  readonly packetId: "c0v-moving-publish" | "c0v-radial-publish" | "c0v-static-publish";
  readonly registeredAttemptId:
    | "c0v-moving-publish-20260822-v1"
    | "c0v-radial-publish-20260822-v1"
    | "c0v-static-publish-20260822-v1";
  readonly label: "moving-publish" | "radial-publish" | "static-publish";
  readonly invocationAuthority: readonly Phase10C0VS6GovernedInvocationAuthority[];
  readonly producerInvocationId:
    | "inv-c0v-moving-publish-producer"
    | "inv-c0v-radial-publish-producer"
    | "inv-c0v-static-publish-producer";
  readonly checkCallerInvocationId:
    | "inv-c0v-moving-publish-check-caller"
    | "inv-c0v-radial-publish-check-caller"
    | "inv-c0v-static-publish-check-caller";
  readonly resultFilename: "c0v-moving-result.json" | "c0v-radial-result.json" | "c0v-static-result.json";
  readonly artifactIndexFilename:
    | "c0v-moving-artifact-index.json"
    | "c0v-radial-artifact-index.json"
    | "c0v-static-artifact-index.json";
  readonly resultSchema:
    | "phase10-c0v-moving-result-v1"
    | "phase10-c0v-radial-result-v2"
    | "phase10-c0v-static-result-v1";
  readonly resultId: "c0v-moving-result-v1" | "c0v-radial-result-v2" | "c0v-static-result-v1";
  readonly layerId: "C0V-MOVING-EVENT" | "C0V-RADIAL" | "C0V-STATIC";
  readonly branch: "independent-reference" | "reference-refusal";
  readonly callerCallableId:
    | "phase10-c0v-moving-publish-check-caller"
    | "phase10-c0v-radial-publish-check-caller"
    | "phase10-c0v-static-publish-check-caller";
  readonly evaluatorCallableId:
    | "phase10-c0v-moving-publication-verifier"
    | "phase10-c0v-radial-publication-verifier"
    | "phase10-c0v-static-publication-verifier";
  readonly refusalOnlyResult: boolean;
}

const MOVING_PUBLISH_PARENT_CONFIG: Phase10C0VS6LayerPublishParentConfig = Object.freeze({
  packetId: "c0v-moving-publish",
  registeredAttemptId: "c0v-moving-publish-20260822-v1",
  label: "moving-publish",
  invocationAuthority: MOVING_PUBLISH_INVOCATION_AUTHORITY,
  producerInvocationId: "inv-c0v-moving-publish-producer",
  checkCallerInvocationId: "inv-c0v-moving-publish-check-caller",
  resultFilename: "c0v-moving-result.json",
  artifactIndexFilename: "c0v-moving-artifact-index.json",
  resultSchema: "phase10-c0v-moving-result-v1",
  resultId: "c0v-moving-result-v1",
  layerId: "C0V-MOVING-EVENT",
  branch: "independent-reference",
  callerCallableId: "phase10-c0v-moving-publish-check-caller",
  evaluatorCallableId: "phase10-c0v-moving-publication-verifier",
  refusalOnlyResult: true,
});

const RADIAL_PUBLISH_PARENT_CONFIG: Phase10C0VS6LayerPublishParentConfig = Object.freeze({
  packetId: "c0v-radial-publish",
  registeredAttemptId: "c0v-radial-publish-20260822-v1",
  label: "radial-publish",
  invocationAuthority: RADIAL_PUBLISH_INVOCATION_AUTHORITY,
  producerInvocationId: "inv-c0v-radial-publish-producer",
  checkCallerInvocationId: "inv-c0v-radial-publish-check-caller",
  resultFilename: "c0v-radial-result.json",
  artifactIndexFilename: "c0v-radial-artifact-index.json",
  resultSchema: "phase10-c0v-radial-result-v2",
  resultId: "c0v-radial-result-v2",
  layerId: "C0V-RADIAL",
  branch: "independent-reference",
  callerCallableId: "phase10-c0v-radial-publish-check-caller",
  evaluatorCallableId: "phase10-c0v-radial-publication-verifier",
  refusalOnlyResult: false,
});

const STATIC_PUBLISH_PARENT_CONFIG: Phase10C0VS6LayerPublishParentConfig = Object.freeze({
  packetId: "c0v-static-publish",
  registeredAttemptId: "c0v-static-publish-20260822-v1",
  label: "static-publish",
  invocationAuthority: STATIC_PUBLISH_INVOCATION_AUTHORITY,
  producerInvocationId: "inv-c0v-static-publish-producer",
  checkCallerInvocationId: "inv-c0v-static-publish-check-caller",
  resultFilename: "c0v-static-result.json",
  artifactIndexFilename: "c0v-static-artifact-index.json",
  resultSchema: "phase10-c0v-static-result-v1",
  resultId: "c0v-static-result-v1",
  layerId: "C0V-STATIC",
  branch: "reference-refusal",
  callerCallableId: "phase10-c0v-static-publish-check-caller",
  evaluatorCallableId: "phase10-c0v-static-publication-verifier",
  refusalOnlyResult: true,
});

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
  readonly packetId:
    | "a-p-c0v-s6"
    | "c0v-moving-produce"
    | "c0v-moving-publish"
    | "c0v-radial-produce"
    | "c0v-radial-publish"
    | "c0v-static-produce"
    | "c0v-static-publish"
    | "c0v-aggregate";
  readonly registeredAttemptId:
    | "a-p-c0v-s6-20260822-v4"
    | "c0v-moving-produce-20260822-v1"
    | "c0v-moving-publish-20260822-v1"
    | "c0v-radial-produce-20260822-v1"
    | "c0v-radial-publish-20260822-v1"
    | "c0v-static-produce-20260822-v1"
    | "c0v-static-publish-20260822-v1"
    | "c0v-aggregate-20260822-v1";
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

interface Phase10C0VS6RadialProgressState {
  readonly startedCaseIds: string[];
  readonly completedCaseIds: string[];
  activeCaseId: string | null;
  completedFieldValueCount: number;
  candidate: Phase10C0VS6ArtifactIdentity | null;
}

function radialProgressEvent(
  sequence: number,
  point: Phase10C0VS6MonotonicEventPoint,
  state: Phase10C0VS6RadialProgressState,
  event: Phase10C0VS6WorkerProgressRecord["event"],
  invocationId: string | null,
  caseId: string | null,
  terminalState: Phase10C0VS6WorkerProgressRecord["terminalState"],
): Phase10C0VS6WorkerProgressRecord {
  return Object.freeze({
    schema: "phase10-c0v-worker-progress-row-v1",
    sequence,
    observedAt: point.observedAt,
    event,
    invocationId,
    caseId,
    startedCaseIds: Object.freeze([...state.startedCaseIds]),
    completedCaseIds: Object.freeze([...state.completedCaseIds]),
    activeCaseId: state.activeCaseId,
    completedNumericFieldValueCount: state.completedFieldValueCount,
    completedUniformFieldValueCount: state.completedFieldValueCount,
    candidateByteLength: state.candidate?.byteLength ?? 0,
    candidateSha256: state.candidate?.sha256 ?? null,
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
      authority.catalogue.runtimeLoaderContract.exactWorkerEnvironment,
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
  const keys = Object.keys(value).sort();
  const expectedKeys = [...expected].sort();
  if (keys.length !== expectedKeys.length || keys.some((entry, index) => entry !== expectedKeys[index])) {
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

function matchOnlyInvocationRoster(
  packet: Phase10C0VS6PacketProtocol,
  config: Phase10C0VS6MatchOnlyParentConfig,
): readonly Phase10C0VS6GovernedInvocationAuthority[] {
  const completeRows = packet.executableInvocationRosters
    .flatMap((entry) => entry.invocations)
    .filter((entry) => entry.terminalState === "complete")
    .filter((entry, index, rows) =>
      rows.findIndex((other) => other.invocationId === entry.invocationId) === index);
  if (packet.packetId !== config.packetId ||
    completeRows.length !== config.invocationAuthority.length ||
    completeRows.some((entry, index) => {
      const expected = config.invocationAuthority[index]!;
      return entry.invocationId !== expected.invocationId || entry.callableId !== expected.callableId ||
        entry.negativeControlId !== expected.negativeControlId ||
        entry.invocationClass !== expected.invocationClass ||
        entry.registeredWallSecondsMaximum !== expected.registeredWallSecondsMaximum;
    })) {
    fail(`${config.label} worker invocation roster differs from hard-coded parent authority`);
  }
  return Object.freeze(completeRows.map((entry) => Object.freeze({
    invocationId: entry.invocationId,
    callableId: entry.callableId,
    negativeControlId: entry.negativeControlId,
    invocationClass: entry.invocationClass,
    registeredWallSecondsMaximum: entry.registeredWallSecondsMaximum,
  })));
}

function layerPublishInvocationRoster(
  packet: Phase10C0VS6PacketProtocol,
  config: Phase10C0VS6LayerPublishParentConfig,
): readonly Phase10C0VS6GovernedInvocationAuthority[] {
  const roster = packet.verificationInvocationRoster;
  if (packet.packetId !== config.packetId ||
    roster.length !== config.invocationAuthority.length ||
    roster.some((entry, index) => {
      const expected = config.invocationAuthority[index]!;
      return entry.invocationId !== expected.invocationId || entry.callableId !== expected.callableId ||
        entry.negativeControlId !== expected.negativeControlId ||
        entry.invocationClass !== expected.invocationClass ||
        entry.registeredWallSecondsMaximum !== expected.registeredWallSecondsMaximum;
    })) {
    fail(`${config.label} worker invocation roster differs from hard-coded parent authority`);
  }
  return roster;
}

function aggregateInvocationRoster(
  packet: Phase10C0VS6PacketProtocol,
): readonly Phase10C0VS6GovernedInvocationAuthority[] {
  const roster = packet.verificationInvocationRoster;
  if (packet.packetId !== "c0v-aggregate" || roster.length !== AGGREGATE_INVOCATION_AUTHORITY.length ||
    roster.some((entry, index) => {
      const expected = AGGREGATE_INVOCATION_AUTHORITY[index]!;
      return entry.invocationId !== expected.invocationId || entry.callableId !== expected.callableId ||
        entry.negativeControlId !== expected.negativeControlId ||
        entry.invocationClass !== expected.invocationClass ||
        entry.registeredWallSecondsMaximum !== expected.registeredWallSecondsMaximum;
    })) {
    fail("aggregate worker invocation roster differs from hard-coded parent authority");
  }
  return roster;
}

function radialInvocationRoster(
  packet: Phase10C0VS6PacketProtocol,
): readonly Phase10C0VS6GovernedInvocationAuthority[] {
  const completeRows = packet.executableInvocationRosters
    .filter((entry) => entry.completionRule === "complete-roster")
    .flatMap((entry) => entry.invocations)
    .filter((entry) => entry.terminalState === "complete")
    .filter((entry, index, rows) =>
      rows.findIndex((other) => other.invocationId === entry.invocationId) === index);
  if (packet.packetId !== "c0v-radial-produce" || packet.workerProgressContract === null ||
    completeRows.length !== RADIAL_INVOCATION_AUTHORITY.length ||
    completeRows.some((entry, index) => {
      const expected = RADIAL_INVOCATION_AUTHORITY[index]!;
      return entry.invocationId !== expected.invocationId || entry.callableId !== expected.callableId ||
        entry.negativeControlId !== expected.negativeControlId ||
        entry.invocationClass !== expected.invocationClass ||
        entry.registeredWallSecondsMaximum !== expected.registeredWallSecondsMaximum;
    })) {
    fail("radial worker invocation roster differs from hard-coded parent authority");
  }
  return Object.freeze(completeRows.map((entry) => Object.freeze({
    invocationId: entry.invocationId,
    callableId: entry.callableId,
    negativeControlId: entry.negativeControlId,
    invocationClass: entry.invocationClass,
    registeredWallSecondsMaximum: entry.registeredWallSecondsMaximum,
  })));
}

function validateMatchOnlyInvocationResult(
  packet: Phase10C0VS6PacketProtocol,
  invocationId: string,
  value: unknown,
  config: Phase10C0VS6MatchOnlyParentConfig,
): StrictJson {
  if (packet.packetId !== config.packetId || invocationId !== config.invocationId) {
    return fail(`worker returned unsupported ${config.label} invocation ${invocationId}`);
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
  if (row.terminalStatus !== "refusal" || evaluation.layerId !== config.layerId ||
    evaluation.dispositionCode !== config.dispositionCode || evaluation.verdict !== "pass" ||
    !Array.isArray(evaluation.errors) || evaluation.errors.length !== 0) {
    fail(`${config.label} governed caller result identity/disposition differs`);
  }
  const executed = wireStringRoster(row.executedCheckIds, `${config.label} executed checks`);
  const evaluated = wireStringRoster(row.evaluatedCheckIds, `${config.label} evaluated checks`);
  const controls = wireStringRoster(row.executedNegativeControlIds, `${config.label} executed controls`);
  const expected = Object.freeze([config.checkId]);
  if (JSON.stringify(executed) !== JSON.stringify(expected) ||
    JSON.stringify(evaluated) !== JSON.stringify(expected) || controls.length !== 0) {
    fail(`${config.label} governed caller check/control roster differs`);
  }
  const routeRows = packet.terminalSubroutes.filter((entry) =>
    entry.dispositionCode === config.dispositionCode);
  if (routeRows.length !== 1 || !routeRows[0]!.requiredCheckIds.includes(expected[0]!)) {
    fail(`${config.label} governed caller check is absent from the registered refusal route`);
  }
  return strictJsonSnapshot(row);
}

export function phase10C0VS6ValidateStaticProduceInvocationResult(
  packet: Phase10C0VS6PacketProtocol,
  invocationId: string,
  value: unknown,
): StrictJson {
  return validateMatchOnlyInvocationResult(packet, invocationId, value, STATIC_PARENT_CONFIG);
}

interface Phase10C0VS6LayerPublishProducerCapture {
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

function validateLayerPublishInvocationResult(
  packet: Phase10C0VS6PacketProtocol,
  preflight: Phase10C0VS6RetainedPreflight,
  invocationId: string,
  value: unknown,
  priorResults: ReadonlyMap<string, unknown>,
  config: Phase10C0VS6LayerPublishParentConfig,
): Phase10C0VS6LayerPublishProducerCapture | StrictJson {
  if (packet.packetId !== config.packetId) fail(`${config.label} validator received another packet`);
  const row = wireObject(value, `${invocationId} result`);
  if (invocationId === config.producerInvocationId) {
    exactWireKeys(row, ["packetId", "result", "artifactIndex", "bytes"], `${invocationId} result`);
    if (row.packetId !== packet.packetId) fail(`${config.label} producer returned another packet ID`);
    const bytesRow = wireObject(row.bytes, `${invocationId}.bytes`);
    exactWireKeys(bytesRow, ["result", "artifactIndex"], `${invocationId}.bytes`);
    const resultBytes = wireBytes(bytesRow.result, `${invocationId}.bytes.result`);
    const artifactIndexBytes = wireBytes(bytesRow.artifactIndex, `${invocationId}.bytes.artifactIndex`);
    const resultPath = `${preflight.observed.candidateDirectory}/${config.resultFilename}`;
    const artifactIndexPath = `${preflight.observed.candidateDirectory}/${config.artifactIndexFilename}`;
    const result = sameWireJsonAndBytes(row.result, resultBytes, resultPath, `${config.label} result`);
    const artifactIndex = sameWireJsonAndBytes(
      row.artifactIndex,
      artifactIndexBytes,
      artifactIndexPath,
      `${config.label} artifact index`,
    );
    const resultRow = wireObject(result, `${config.label} parsed result`);
    const indexRow = wireObject(artifactIndex, `${config.label} parsed artifact index`);
    const terminalStatusMatches = config.refusalOnlyResult
      ? resultRow.terminalStatus === "refusal" && resultRow.scientificDisposition === "refusal"
      : (resultRow.terminalStatus === "pass" || resultRow.terminalStatus === "fail" ||
          resultRow.terminalStatus === "refusal") &&
        resultRow.scientificDisposition === resultRow.terminalStatus;
    if (resultRow.schema !== config.resultSchema || resultRow.resultId !== config.resultId ||
      resultRow.layerId !== config.layerId || resultRow.branch !== config.branch ||
      !terminalStatusMatches ||
      indexRow.schema !== "phase10-artifact-index-v1" ||
      indexRow.bundleId !== "phase10-numerical-verification-v1") {
      fail(`${config.label} producer returned a different structural result/index scope`);
    }
    return Object.freeze({ resultBytes, artifactIndexBytes });
  }
  if (invocationId === config.checkCallerInvocationId) {
    exactWireKeys(row, [
      "schema", "packetId", "callerCallableId", "evaluatorCallableId", "evaluation",
      "executedCheckIds", "evaluatedCheckIds", "executedNegativeControlIds",
    ], `${invocationId} result`);
    if (row.schema !== "phase10-c0v-publication-check-caller-result-v1" ||
      row.packetId !== packet.packetId ||
      row.callerCallableId !== config.callerCallableId ||
      row.evaluatorCallableId !== config.evaluatorCallableId) {
      fail(`${config.label} governed caller result identity differs`);
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
      fail(`${config.label} governed evaluator result identity/verdict differs`);
    }
    const completeSubroutes = packet.terminalSubroutes.filter((entry) => entry.dispositionCode === null);
    if (completeSubroutes.length !== 1) fail(`${config.label} packet lacks one structural-complete subroute`);
    const complete = completeSubroutes[0]!;
    const executed = wireStringRoster(row.executedCheckIds, `${config.label} executed checks`);
    const evaluated = wireStringRoster(row.evaluatedCheckIds, `${config.label} evaluated checks`);
    const controls = wireStringRoster(row.executedNegativeControlIds, `${config.label} executed controls`);
    if (JSON.stringify(executed) !== JSON.stringify(complete.requiredCheckIds) ||
      JSON.stringify(evaluated) !== JSON.stringify(complete.requiredCheckIds) ||
      JSON.stringify(controls) !== JSON.stringify(complete.requiredNegativeControlIds)) {
      fail(`${config.label} governed caller check/control roster differs`);
    }
    const producer = priorResults.get(config.producerInvocationId);
    if (producer === undefined ||
      !((producer as Partial<Phase10C0VS6LayerPublishProducerCapture>).resultBytes instanceof Uint8Array) ||
      !((producer as Partial<Phase10C0VS6LayerPublishProducerCapture>).artifactIndexBytes instanceof Uint8Array)) {
      fail(`${config.label} check caller returned before its exact producer capture`);
    }
    const captured = producer as Phase10C0VS6LayerPublishProducerCapture;
    sameWireJsonAndBytes(
      evaluation.result,
      captured.resultBytes,
      `${preflight.observed.candidateDirectory}/${config.resultFilename}`,
      `${config.label} caller result`,
    );
    sameWireJsonAndBytes(
      evaluation.artifactIndex,
      captured.artifactIndexBytes,
      `${preflight.observed.candidateDirectory}/${config.artifactIndexFilename}`,
      `${config.label} caller artifact index`,
    );
    return strictJsonSnapshot(row);
  }
  return fail(`worker returned unsupported ${config.label} invocation ${invocationId}`);
}

export function phase10C0VS6ValidateRadialPublishInvocationResult(
  packet: Phase10C0VS6PacketProtocol,
  preflight: Phase10C0VS6RetainedPreflight,
  invocationId: string,
  value: unknown,
  priorResults: ReadonlyMap<string, unknown>,
): Phase10C0VS6LayerPublishProducerCapture | StrictJson {
  return validateLayerPublishInvocationResult(
    packet,
    preflight,
    invocationId,
    value,
    priorResults,
    RADIAL_PUBLISH_PARENT_CONFIG,
  );
}

export function phase10C0VS6ValidateStaticPublishInvocationResult(
  packet: Phase10C0VS6PacketProtocol,
  preflight: Phase10C0VS6RetainedPreflight,
  invocationId: string,
  value: unknown,
  priorResults: ReadonlyMap<string, unknown>,
): Phase10C0VS6LayerPublishProducerCapture | StrictJson {
  return validateLayerPublishInvocationResult(
    packet,
    preflight,
    invocationId,
    value,
    priorResults,
    STATIC_PUBLISH_PARENT_CONFIG,
  );
}

function persistLayerPublishCandidateArtifacts(
  root: Phase10C0VS6PhysicalRoot,
  preflight: Phase10C0VS6RetainedPreflight,
  results: ReadonlyMap<string, unknown>,
  watchdog: Phase10C0VS6ParentWatchdogContext,
  config: Phase10C0VS6LayerPublishParentConfig,
): StrictJson {
  const producer = results.get(config.producerInvocationId) as
    | Phase10C0VS6LayerPublishProducerCapture
    | undefined;
  const caller = results.get(config.checkCallerInvocationId);
  if (producer === undefined || caller === undefined) {
    fail(`${config.label} complete worker lacks producer/caller captures`);
  }
  for (const [filename, bytes] of [
    [config.resultFilename, producer.resultBytes],
    [config.artifactIndexFilename, producer.artifactIndexBytes],
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

interface Phase10C0VS6AggregateControlCapture {
  readonly bytes: Uint8Array;
}

interface Phase10C0VS6AggregateProducerCapture {
  readonly terminalTableBytes: Uint8Array;
  readonly resourceLedgerBytes: Uint8Array;
  readonly aggregateBytes: Uint8Array;
  readonly artifactIndexBytes: Uint8Array;
}

type Phase10C0VS6AggregateInvocationCapture =
  | Phase10C0VS6AggregateControlCapture
  | Phase10C0VS6AggregateProducerCapture
  | StrictJson;

export function phase10C0VS6ValidateAggregateInvocationResult(
  packet: Phase10C0VS6PacketProtocol,
  preflight: Phase10C0VS6RetainedPreflight,
  invocationId: string,
  value: unknown,
  priorResults: ReadonlyMap<string, unknown>,
): Phase10C0VS6AggregateInvocationCapture {
  if (packet.packetId !== "c0v-aggregate") fail("aggregate validator received another packet");
  const row = wireObject(value, `${invocationId} result`);
  if (invocationId === "inv-c0v-aggregate-nc-any-layer-nonpass") {
    exactWireKeys(row, ["receipt", "bytes"], `${invocationId} result`);
    const controlBytes = wireBytes(row.bytes, `${invocationId}.bytes`);
    const receipt = sameWireJsonAndBytes(
      row.receipt,
      controlBytes,
      attemptPath(preflight, "any-layer-nonpass-control.json"),
      "aggregate any-layer-nonpass receipt",
    );
    const parsed = parsePhase10C0VAnyLayerNonpassControlReceiptBytes(controlBytes);
    if (parsed.negativeControlId !== "nc-c0v-any-layer-nonpass" || !parsed.result.pass) {
      fail("aggregate negative-control result did not pass its exact receipt contract");
    }
    if (wireObject(receipt, "aggregate control receipt").negativeControlId !== parsed.negativeControlId) {
      fail("aggregate control wire/contract projection differs");
    }
    return Object.freeze({ bytes: controlBytes });
  }
  if (invocationId === "inv-c0v-aggregate-producer") {
    exactWireKeys(
      row,
      ["terminalTable", "resourceLedger", "aggregate", "artifactIndex", "bytes"],
      `${invocationId} result`,
    );
    const bytesRow = wireObject(row.bytes, `${invocationId}.bytes`);
    exactWireKeys(
      bytesRow,
      ["terminalTable", "resourceLedger", "aggregate", "artifactIndex"],
      `${invocationId}.bytes`,
    );
    const terminalTableBytes = wireBytes(bytesRow.terminalTable, `${invocationId}.bytes.terminalTable`);
    const resourceLedgerBytes = wireBytes(bytesRow.resourceLedger, `${invocationId}.bytes.resourceLedger`);
    const aggregateBytes = wireBytes(bytesRow.aggregate, `${invocationId}.bytes.aggregate`);
    const artifactIndexBytes = wireBytes(bytesRow.artifactIndex, `${invocationId}.bytes.artifactIndex`);
    sameWireJsonAndBytes(
      row.terminalTable,
      terminalTableBytes,
      `${preflight.observed.candidateDirectory}/c0v-terminal-table.json`,
      "aggregate terminal table",
    );
    sameWireJsonAndBytes(
      row.resourceLedger,
      resourceLedgerBytes,
      `${preflight.observed.candidateDirectory}/c0v-resource-ledger.json`,
      "aggregate resource ledger",
    );
    sameWireJsonAndBytes(
      row.aggregate,
      aggregateBytes,
      `${preflight.observed.candidateDirectory}/c0v-aggregate.json`,
      "aggregate result",
    );
    sameWireJsonAndBytes(
      row.artifactIndex,
      artifactIndexBytes,
      `${preflight.observed.candidateDirectory}/c0v-artifact-index.json`,
      "aggregate artifact index",
    );
    parsePhase10C0VTerminalTableBytes(terminalTableBytes);
    parsePhase10C0VResourceLedgerBytes(resourceLedgerBytes);
    parsePhase10C0VAggregateResultBytes(aggregateBytes);
    parsePhase10C0VAggregateArtifactIndexBytes(artifactIndexBytes);
    const control = priorResults.get("inv-c0v-aggregate-nc-any-layer-nonpass") as
      | Phase10C0VS6AggregateControlCapture
      | undefined;
    if (control === undefined || !(control.bytes instanceof Uint8Array)) {
      fail("aggregate producer returned before its exact negative-control capture");
    }
    return Object.freeze({ terminalTableBytes, resourceLedgerBytes, aggregateBytes, artifactIndexBytes });
  }
  if (invocationId === "inv-c0v-aggregate-check-caller") {
    exactWireKeys(row, [
      "schema", "packetId", "callerCallableId", "evaluatorCallableId", "evaluation",
      "executedCheckIds", "evaluatedCheckIds", "executedNegativeControlIds",
    ], `${invocationId} result`);
    if (row.schema !== "phase10-c0v-aggregate-check-caller-result-v1" ||
      row.packetId !== "c0v-aggregate" ||
      row.callerCallableId !== "phase10-c0v-aggregate-check-caller" ||
      row.evaluatorCallableId !== "phase10-c0v-aggregate-evaluator") {
      fail("aggregate governed caller result identity differs");
    }
    const evaluation = wireObject(row.evaluation, `${invocationId}.evaluation`);
    exactWireKeys(evaluation, [
      "schema", "packetId", "evaluatorCallableId", "terminalTable", "resourceLedger",
      "aggregate", "artifactIndex", "outputIdentities", "negativeControlReproof",
      "checkResults", "aggregateVerdict",
    ], `${invocationId}.evaluation`);
    if (evaluation.schema !== "phase10-c0v-aggregate-independent-evaluation-v1" ||
      evaluation.packetId !== "c0v-aggregate" ||
      evaluation.evaluatorCallableId !== "phase10-c0v-aggregate-evaluator" ||
      evaluation.aggregateVerdict !== "pass") {
      fail("aggregate governed evaluator result identity/verdict differs");
    }
    const completeRows = packet.terminalSubroutes.filter((entry) => entry.dispositionCode === null);
    if (completeRows.length !== 1) fail("aggregate packet lacks one structural-complete subroute");
    const complete = completeRows[0]!;
    const executed = wireStringRoster(row.executedCheckIds, "aggregate executed checks");
    const evaluated = wireStringRoster(row.evaluatedCheckIds, "aggregate evaluated checks");
    const controls = wireStringRoster(row.executedNegativeControlIds, "aggregate executed controls");
    if (JSON.stringify(executed) !== JSON.stringify(complete.requiredCheckIds) ||
      JSON.stringify(evaluated) !== JSON.stringify(complete.requiredCheckIds) ||
      JSON.stringify(controls) !== JSON.stringify(complete.requiredNegativeControlIds)) {
      fail("aggregate governed caller check/control roster differs");
    }
    const producer = priorResults.get("inv-c0v-aggregate-producer") as
      | Phase10C0VS6AggregateProducerCapture
      | undefined;
    if (producer === undefined || !(producer.terminalTableBytes instanceof Uint8Array) ||
      !(producer.resourceLedgerBytes instanceof Uint8Array) || !(producer.aggregateBytes instanceof Uint8Array) ||
      !(producer.artifactIndexBytes instanceof Uint8Array)) {
      fail("aggregate check caller returned before its exact producer capture");
    }
    for (const [field, bytes, filename] of [
      ["terminalTable", producer.terminalTableBytes, "c0v-terminal-table.json"],
      ["resourceLedger", producer.resourceLedgerBytes, "c0v-resource-ledger.json"],
      ["aggregate", producer.aggregateBytes, "c0v-aggregate.json"],
      ["artifactIndex", producer.artifactIndexBytes, "c0v-artifact-index.json"],
    ] as const) {
      sameWireJsonAndBytes(
        evaluation[field],
        bytes,
        `${preflight.observed.candidateDirectory}/${filename}`,
        `aggregate caller ${field}`,
      );
    }
    const controlReproof = wireObject(evaluation.negativeControlReproof, "aggregate negative-control reproof");
    const controlResult = wireObject(controlReproof.result, "aggregate negative-control reproof result");
    if (controlReproof.negativeControlId !== "nc-c0v-any-layer-nonpass" ||
      controlReproof.verdict !== "pass" || controlResult.pass !== true) {
      fail("aggregate governed caller did not retain a passing negative-control reproof");
    }
    return strictJsonSnapshot(row);
  }
  return fail(`worker returned unsupported aggregate invocation ${invocationId}`);
}

function persistAggregateControl(
  root: Phase10C0VS6PhysicalRoot,
  preflight: Phase10C0VS6RetainedPreflight,
  capture: unknown,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): void {
  if (capture === null || typeof capture !== "object" ||
    !("bytes" in capture) || !(capture.bytes instanceof Uint8Array)) {
    fail("aggregate control capture is not exact retained bytes");
  }
  watchdog.assertActive();
  phase10C0VS6WriteExclusiveOrExact(
    root,
    attemptPath(preflight, "any-layer-nonpass-control.json"),
    capture.bytes,
  );
  watchdog.assertActive();
}

function persistAggregateCandidateArtifacts(
  root: Phase10C0VS6PhysicalRoot,
  preflight: Phase10C0VS6RetainedPreflight,
  results: ReadonlyMap<string, unknown>,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): StrictJson {
  const producer = results.get("inv-c0v-aggregate-producer") as
    | Phase10C0VS6AggregateProducerCapture
    | undefined;
  const caller = results.get("inv-c0v-aggregate-check-caller");
  if (producer === undefined || caller === undefined) {
    fail("aggregate complete worker lacks producer/caller captures");
  }
  for (const [filename, bytes] of [
    ["c0v-terminal-table.json", producer.terminalTableBytes],
    ["c0v-resource-ledger.json", producer.resourceLedgerBytes],
    ["c0v-aggregate.json", producer.aggregateBytes],
    ["c0v-artifact-index.json", producer.artifactIndexBytes],
  ] as const) {
    watchdog.assertActive();
    phase10C0VS6WriteExclusiveOrExact(root, `${preflight.observed.candidateDirectory}/${filename}`, bytes);
    watchdog.assertActive();
  }
  return strictJsonSnapshot(caller);
}

type Phase10C0VS6RadialControlId =
  | "nc-radial-finite-shell-term"
  | "nc-radial-forged-summary"
  | "nc-radial-robin-coefficient";

interface Phase10C0VS6RadialProducerCapture {
  readonly witnessBytes: Uint8Array;
  readonly producerSummary: StrictJson;
  readonly producerSummaryBytes: Uint8Array;
  readonly witnessIdentity: Phase10C0VS6ArtifactIdentity;
  readonly producerSummaryIdentity: Phase10C0VS6ArtifactIdentity;
}

interface Phase10C0VS6RadialControlArtifactCapture {
  readonly negativeControlId: Phase10C0VS6RadialControlId;
  readonly artifactKind: "mutated-witness" | "mutated-summary";
  readonly identity: Phase10C0VS6ArtifactIdentity;
  readonly bytes: Uint8Array;
}

interface Phase10C0VS6RadialEvaluatorCapture {
  readonly evaluationBytes: Uint8Array;
  readonly callerResult: StrictJson;
}

const RADIAL_CONTROL_ARTIFACT_AUTHORITY = Object.freeze([
  Object.freeze({
    invocationId: "inv-c0v-radial-nc-finite-shell-term",
    negativeControlId: "nc-radial-finite-shell-term",
    artifactKind: "mutated-witness",
    filename: "nc-radial-finite-shell-term-witness.bin",
    internalCaseBoundaries: false,
  }),
  Object.freeze({
    invocationId: "inv-c0v-radial-nc-forged-summary",
    negativeControlId: "nc-radial-forged-summary",
    artifactKind: "mutated-summary",
    filename: "nc-radial-forged-summary.json",
    internalCaseBoundaries: false,
  }),
  Object.freeze({
    invocationId: "inv-c0v-radial-nc-robin-coefficient",
    negativeControlId: "nc-radial-robin-coefficient",
    artifactKind: "mutated-witness",
    filename: "nc-radial-robin-coefficient-witness.bin",
    internalCaseBoundaries: true,
  }),
] as const);

function radialProducerCapture(
  packet: Phase10C0VS6PacketProtocol,
  preflight: Phase10C0VS6RetainedPreflight,
  value: unknown,
): Phase10C0VS6RadialProducerCapture {
  if (packet.packetId !== "c0v-radial-produce" || packet.radialBinaryLayout === null ||
    packet.radialProducerSummary === null) {
    fail("radial producer validator received different packet authority");
  }
  const row = wireObject(value, "radial producer result");
  exactWireKeys(
    row,
    ["witnessBytes", "producerSummary", "producerSummaryBytes"],
    "radial producer result",
  );
  const witnessBytes = wireBytes(row.witnessBytes, "radial producer witness bytes");
  const producerSummaryBytes = wireBytes(
    row.producerSummaryBytes,
    "radial producer summary bytes",
  );
  if (witnessBytes.byteLength !== packet.radialBinaryLayout.fileByteLength) {
    fail("radial producer witness length differs from frozen binary layout");
  }
  const witnessPath = `${preflight.observed.candidateDirectory}/c0v-radial-witness.bin`;
  const producerSummaryPath =
    `${preflight.observed.candidateDirectory}/c0v-radial-producer-summary.json`;
  const producerSummary = sameWireJsonAndBytes(
    row.producerSummary,
    producerSummaryBytes,
    producerSummaryPath,
    "radial producer summary",
  );
  const summary = wireObject(producerSummary, "parsed radial producer summary");
  exactWireKeys(summary, [
    "schema", "authority", "caseCount", "totalNumericFieldValues",
    "totalUniformFieldValues", "allFinite", "reportedDisposition", "reportedMaximum",
  ], "parsed radial producer summary");
  if (summary.schema !== packet.radialProducerSummary.schema ||
    summary.authority !== packet.radialProducerSummary.authority ||
    summary.caseCount !== packet.radialProducerSummary.caseCount ||
    summary.totalNumericFieldValues !== packet.radialProducerSummary.totalNumericFieldValues ||
    summary.totalUniformFieldValues !== packet.radialProducerSummary.totalUniformFieldValues ||
    typeof summary.allFinite !== "boolean" ||
    (summary.reportedDisposition !== "pass" && summary.reportedDisposition !== "fail") ||
    typeof summary.reportedMaximum !== "number" || !Number.isFinite(summary.reportedMaximum)) {
    fail("radial producer summary differs from its frozen structural authority");
  }
  return Object.freeze({
    witnessBytes,
    producerSummary,
    producerSummaryBytes,
    witnessIdentity: phase10C0VS6ArtifactIdentity(witnessPath, witnessBytes),
    producerSummaryIdentity: phase10C0VS6ArtifactIdentity(
      producerSummaryPath,
      producerSummaryBytes,
    ),
  });
}

/** Strict production-boundary parser used by the live radial parent and synthetic transport tests. */
export function phase10C0VS6ValidateRadialProductionBoundary(
  packet: Phase10C0VS6PacketProtocol,
  boundaryIndex: number,
  value: unknown,
): Readonly<{
  readonly stage: "start" | "complete";
  readonly caseIndex: number;
  readonly caseId: string;
  readonly expectedNodeCount: number;
}> {
  const contract = packet.workerProgressContract;
  if (packet.packetId !== "c0v-radial-produce" || contract === null ||
    !Number.isSafeInteger(boundaryIndex) || boundaryIndex < 0 ||
    boundaryIndex >= contract.caseOrder.length * 2) {
    fail("radial production boundary index/authority differs");
  }
  const row = wireObject(value, `radial production boundary[${boundaryIndex}]`);
  exactWireKeys(
    row,
    ["stage", "caseIndex", "caseId", "expectedNodeCount"],
    `radial production boundary[${boundaryIndex}]`,
  );
  const caseIndex = Math.floor(boundaryIndex / 2);
  const stage = boundaryIndex % 2 === 0 ? "start" : "complete";
  if (row.stage !== stage || row.caseIndex !== caseIndex ||
    row.caseId !== contract.caseOrder[caseIndex] ||
    row.expectedNodeCount !== contract.completedFieldValueCounts[caseIndex]) {
    fail(`radial production boundary[${boundaryIndex}] differs from protocol order`);
  }
  return Object.freeze({
    stage,
    caseIndex,
    caseId: row.caseId as string,
    expectedNodeCount: row.expectedNodeCount as number,
  });
}

function validateRadialControlBoundary(
  controlIndex: number,
  value: unknown,
  expected: Readonly<{
    readonly stage: "start" | "complete";
    readonly boundaryKind: "governed-leaf" | "internal-case";
    readonly caseIndex: number | null;
    readonly caseId: string | null;
  }>,
): void {
  const authority = RADIAL_CONTROL_ARTIFACT_AUTHORITY[controlIndex];
  if (authority === undefined) fail("radial control boundary names an unsupported control index");
  const row = wireObject(value, `${authority.invocationId} boundary`);
  exactWireKeys(
    row,
    ["stage", "boundaryKind", "negativeControlId", "caseIndex", "caseId"],
    `${authority.invocationId} boundary`,
  );
  if (row.stage !== expected.stage || row.boundaryKind !== expected.boundaryKind ||
    row.negativeControlId !== authority.negativeControlId || row.caseIndex !== expected.caseIndex ||
    row.caseId !== expected.caseId) {
    fail(`${authority.invocationId} boundary differs from the exact nested control stream`);
  }
}

function validateRadialControlProgress(
  controlIndex: number,
  progressIndex: number,
  value: unknown,
): void {
  const authority = RADIAL_CONTROL_ARTIFACT_AUTHORITY[controlIndex];
  if (authority === undefined || (progressIndex !== 0 && progressIndex !== 1)) {
    fail("radial control progress names an unsupported stream position");
  }
  const row = wireObject(value, `${authority.invocationId} progress[${progressIndex}]`);
  exactWireKeys(row, ["stage", "negativeControlId"], `${authority.invocationId} progress`);
  const expectedStage = progressIndex === 0
    ? "attacked-evaluation-complete"
    : "independent-proof-complete";
  if (row.stage !== expectedStage || row.negativeControlId !== authority.negativeControlId) {
    fail(`${authority.invocationId} progress differs from the exact control stream`);
  }
}

/** Strict artifact parser used before the parent persists and acknowledges a radial control. */
export function phase10C0VS6ValidateRadialControlArtifact(
  preflight: Phase10C0VS6RetainedPreflight,
  controlIndex: number,
  value: unknown,
): Phase10C0VS6RadialControlArtifactCapture {
  const authority = RADIAL_CONTROL_ARTIFACT_AUTHORITY[controlIndex];
  if (authority === undefined) fail("radial artifact names an unsupported control index");
  const row = wireObject(value, `${authority.invocationId} artifact`);
  exactWireKeys(
    row,
    ["negativeControlId", "artifactKind", "identity", "bytes"],
    `${authority.invocationId} artifact`,
  );
  const identity = parsePhase10C0VS6ArtifactIdentity(
    row.identity,
    `${authority.invocationId} artifact identity`,
  );
  const bytes = wireBytes(row.bytes, `${authority.invocationId} artifact bytes`);
  const expectedPath = `${preflight.observed.candidateDirectory}/${authority.filename}`;
  if (row.negativeControlId !== authority.negativeControlId ||
    row.artifactKind !== authority.artifactKind || identity.path !== expectedPath) {
    fail(`${authority.invocationId} artifact authority differs`);
  }
  phase10C0VS6SameIdentity(
    identity,
    phase10C0VS6ArtifactIdentity(expectedPath, bytes),
    `${authority.invocationId} artifact bytes`,
  );
  return Object.freeze({
    negativeControlId: authority.negativeControlId,
    artifactKind: authority.artifactKind,
    identity,
    bytes,
  });
}

function radialEvaluatorCapture(
  packet: Phase10C0VS6PacketProtocol,
  preflight: Phase10C0VS6RetainedPreflight,
  producer: Phase10C0VS6RadialProducerCapture,
  retainedControls: readonly Phase10C0VS6RadialControlArtifactCapture[],
  value: unknown,
): Phase10C0VS6RadialEvaluatorCapture {
  if (packet.packetId !== "c0v-radial-produce") {
    fail("radial evaluator validator received different packet authority");
  }
  const row = wireObject(value, "radial evaluator result");
  exactWireKeys(row, [
    "evaluation", "evaluationBytes", "acceptedEvaluationBytes", "campaignDisposition",
    "campaignInvalidReasonCodes", "terminalStatus", "executedCheckIds", "evaluatedCheckIds",
    "executedNegativeControlIds", "negativeControlArtifacts",
  ], "radial evaluator result");
  const evaluationPath = `${preflight.observed.candidateDirectory}/c0v-radial-evaluation.json`;
  const evaluationBytes = wireBytes(row.evaluationBytes, "radial evaluator evaluation bytes");
  const acceptedEvaluationBytes = wireBytes(
    row.acceptedEvaluationBytes,
    "radial evaluator accepted evaluation bytes",
  );
  sameBytesAtPath(
    evaluationPath,
    evaluationBytes,
    acceptedEvaluationBytes,
    "radial accepted evaluation",
  );
  const evaluation = sameWireJsonAndBytes(
    row.evaluation,
    evaluationBytes,
    evaluationPath,
    "radial evaluation",
  );
  const parsedEvaluation = parsePhase10C0VS6RadialEvaluationBytes(evaluationBytes, packet);
  if (parsedEvaluation.evaluationId !==
      `phase10-${packet.packetId}-${packet.registeredAttemptId}-evaluation-v1` ||
    parsedEvaluation.artifactDisposition !== "valid" ||
    parsedEvaluation.negativeControls.some((entry) => !entry.pass) ||
    row.campaignDisposition !== "valid" ||
    !Array.isArray(row.campaignInvalidReasonCodes) || row.campaignInvalidReasonCodes.length !== 0 ||
    row.terminalStatus !== parsedEvaluation.numericalDisposition) {
    fail("radial evaluator result cannot select a registered completed campaign");
  }
  phase10C0VS6SameIdentity(
    parsedEvaluation.witness,
    producer.witnessIdentity,
    "radial evaluator clean witness",
  );
  const expectedChecks = Object.freeze([
    "chk-c0v-radial-numeric",
    "chk-c0v-radial-reference-independence",
  ]);
  const expectedControls = RADIAL_CONTROL_ARTIFACT_AUTHORITY.map((entry) => entry.negativeControlId);
  const executed = wireStringRoster(row.executedCheckIds, "radial executed checks");
  const evaluated = wireStringRoster(row.evaluatedCheckIds, "radial evaluated checks");
  const controls = wireStringRoster(row.executedNegativeControlIds, "radial executed controls");
  if (JSON.stringify(executed) !== JSON.stringify(expectedChecks) ||
    JSON.stringify(evaluated) !== JSON.stringify(expectedChecks) ||
    JSON.stringify(controls) !== JSON.stringify(expectedControls)) {
    fail("radial evaluator check/control roster differs");
  }
  if (!Array.isArray(row.negativeControlArtifacts) ||
    row.negativeControlArtifacts.length !== RADIAL_CONTROL_ARTIFACT_AUTHORITY.length ||
    retainedControls.length !== RADIAL_CONTROL_ARTIFACT_AUTHORITY.length) {
    fail("radial evaluator artifact roster length differs");
  }
  row.negativeControlArtifacts.forEach((artifact, index) => {
    const repeated = phase10C0VS6ValidateRadialControlArtifact(preflight, index, artifact);
    const retained = retainedControls[index]!;
    phase10C0VS6SameIdentity(
      repeated.identity,
      retained.identity,
      `${repeated.negativeControlId} evaluator/retained artifact`,
    );
    sameBytesAtPath(
      retained.identity.path,
      repeated.bytes,
      retained.bytes,
      `${repeated.negativeControlId} evaluator/retained bytes`,
    );
  });
  return Object.freeze({
    evaluationBytes,
    callerResult: strictJsonSnapshot(Object.freeze({
      evaluation,
      executedCheckIds: executed,
      evaluatedCheckIds: evaluated,
      executedNegativeControlIds: controls,
    })),
  });
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

async function runMatchOnlyWorker(
  root: Phase10C0VS6PhysicalRoot,
  authority: Phase10C0VS6LockedPacketAuthority,
  preflight: Phase10C0VS6RetainedPreflight,
  watchdog: Phase10C0VS6ParentWatchdogContext,
  config: Phase10C0VS6MatchOnlyParentConfig,
): Promise<Phase10C0VS6GovernedWorkerOutcome> {
  const packet = authority.packet;
  const roster = matchOnlyInvocationRoster(packet, config);
  watchdog.assertActive();
  const transport = workerTransportBudget(authority, Object.freeze({
    lifecycle: 2,
    boundaryOrProgress: 0,
    artifact: 0,
    result: 1,
  }));
  if (transport.maximumMessages !== roster.length + 2) {
    fail(`${config.label} worker message budget differs from ready/result/stopped roster`);
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
      fail(`${config.label} governed leaf lacks its exact parent-issued start boundary`);
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
      fail(`${config.label} governed leaf watchdog and retained raw timing boundary differ`);
    }
    let capturedGovernedCallerResult: StrictJson | null = null;
    if (governed.terminalState === "complete") {
      const message = parseWorkerMessage(session, governed.value!);
      assertWorkerMessage(message, "result", invocation.invocationId);
      capturedGovernedCallerResult = validateMatchOnlyInvocationResult(
        packet,
        invocation.invocationId,
        phase10C0VS6DecodeWorkerPayload(message.payload!),
        config,
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
    if (capturedGovernedCallerResult === null) {
      fail(`${config.label} complete worker lacks its governed caller result`);
    }
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

interface Phase10C0VS6LinearWorkerConfig {
  readonly label: string;
  readonly roster: (packet: Phase10C0VS6PacketProtocol) => readonly Phase10C0VS6GovernedInvocationAuthority[];
  readonly validate: (
    packet: Phase10C0VS6PacketProtocol,
    preflight: Phase10C0VS6RetainedPreflight,
    invocationId: string,
    value: unknown,
    priorResults: ReadonlyMap<string, unknown>,
  ) => unknown;
  readonly afterResult: (
    root: Phase10C0VS6PhysicalRoot,
    preflight: Phase10C0VS6RetainedPreflight,
    invocationId: string,
    capture: unknown,
    watchdog: Phase10C0VS6ParentWatchdogContext,
  ) => void;
  readonly persist: (
    root: Phase10C0VS6PhysicalRoot,
    preflight: Phase10C0VS6RetainedPreflight,
    results: ReadonlyMap<string, unknown>,
    watchdog: Phase10C0VS6ParentWatchdogContext,
  ) => StrictJson;
}

async function runLinearPacketWorker(
  root: Phase10C0VS6PhysicalRoot,
  authority: Phase10C0VS6LockedPacketAuthority,
  preflight: Phase10C0VS6RetainedPreflight,
  watchdog: Phase10C0VS6ParentWatchdogContext,
  config: Phase10C0VS6LinearWorkerConfig,
): Promise<Phase10C0VS6GovernedWorkerOutcome> {
  const packet = authority.packet;
  const roster = config.roster(packet);
  watchdog.assertActive();
  const transport = workerTransportBudget(authority, Object.freeze({
    lifecycle: 2,
    boundaryOrProgress: 0,
    artifact: 0,
    result: roster.length,
  }));
  if (transport.maximumMessages !== roster.length + 2) {
    fail(`${config.label} worker message budget differs from ready/results/stopped roster`);
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
            fail(`${config.label} governed leaf start boundary was issued more than once`);
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
        fail(`${config.label} governed leaf lacks its exact parent-issued start boundary`);
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
        fail(`${config.label} governed leaf watchdog and retained raw timing boundary differ`);
      }
      let validatedResult: unknown = null;
      if (governed.terminalState === "complete") {
        const message = parseWorkerMessage(session, governed.value!);
        assertWorkerMessage(message, "result", invocation.invocationId);
        validatedResult = config.validate(
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
      config.afterResult(root, preflight, invocation.invocationId, validatedResult, watchdog);
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
    const capturedGovernedCallerResult = config.persist(
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

async function runLayerPublishWorker(
  root: Phase10C0VS6PhysicalRoot,
  authority: Phase10C0VS6LockedPacketAuthority,
  preflight: Phase10C0VS6RetainedPreflight,
  watchdog: Phase10C0VS6ParentWatchdogContext,
  config: Phase10C0VS6LayerPublishParentConfig,
): Promise<Phase10C0VS6GovernedWorkerOutcome> {
  const linearConfig = Object.freeze<Phase10C0VS6LinearWorkerConfig>({
    label: config.label,
    roster: (packet) => layerPublishInvocationRoster(packet, config),
    validate: (packet, retainedPreflight, invocationId, value, priorResults) =>
      validateLayerPublishInvocationResult(packet, retainedPreflight, invocationId, value, priorResults, config),
    afterResult: () => {},
    persist: (physicalRoot, retainedPreflight, results, parentWatchdog) =>
      persistLayerPublishCandidateArtifacts(physicalRoot, retainedPreflight, results, parentWatchdog, config),
  });
  return runLinearPacketWorker(root, authority, preflight, watchdog, linearConfig);
}

async function runAggregateWorker(
  root: Phase10C0VS6PhysicalRoot,
  authority: Phase10C0VS6LockedPacketAuthority,
  preflight: Phase10C0VS6RetainedPreflight,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): Promise<Phase10C0VS6GovernedWorkerOutcome> {
  const linearConfig = Object.freeze<Phase10C0VS6LinearWorkerConfig>({
    label: "aggregate",
    roster: aggregateInvocationRoster,
    validate: phase10C0VS6ValidateAggregateInvocationResult,
    afterResult: (physicalRoot, retainedPreflight, invocationId, capture, parentWatchdog) => {
      if (invocationId === "inv-c0v-aggregate-nc-any-layer-nonpass") {
        persistAggregateControl(
          physicalRoot,
          retainedPreflight,
          capture,
          parentWatchdog,
        );
      }
    },
    persist: persistAggregateCandidateArtifacts,
  });
  return runLinearPacketWorker(root, authority, preflight, watchdog, linearConfig);
}

async function runRadialWorker(
  root: Phase10C0VS6PhysicalRoot,
  authority: Phase10C0VS6LockedPacketAuthority,
  preflight: Phase10C0VS6RetainedPreflight,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): Promise<Phase10C0VS6GovernedWorkerOutcome> {
  const packet = authority.packet;
  const roster = radialInvocationRoster(packet);
  const progressContract = packet.workerProgressContract;
  if (progressContract === null) fail("radial worker lacks its progress contract");
  watchdog.assertActive();
  const transport = workerTransportBudget(authority, Object.freeze({
    lifecycle: 2,
    boundaryOrProgress: 28,
    artifact: 3,
    result: 2,
  }));
  if (transport.maximumMessages !== 35) {
    fail("radial worker message budget differs from its exact nested stream");
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
  let progressLog: Phase10C0VS6WorkerProgressEventLogWriter | null = null;
  let eventLogClosed = false;
  let progressLogClosed = false;
  let eventSequence = 0;
  let progressSequence = 0;
  let clock: Phase10C0VS6MonotonicEventClock | null = null;
  let openInvocation: Phase10C0VS6GovernedInvocationAuthority | null = null;
  const progressState: Phase10C0VS6RadialProgressState = {
    startedCaseIds: [],
    completedCaseIds: [],
    activeCaseId: null,
    completedFieldValueCount: 0,
    candidate: null,
  };
  const retainedControls: Phase10C0VS6RadialControlArtifactCapture[] = [];

  const appendInvocationStarted = (
    invocation: Phase10C0VS6GovernedInvocationAuthority,
    point: Phase10C0VS6MonotonicEventPoint,
  ): void => {
    if (openInvocation !== null) fail("radial parent started an invocation while another is open");
    openInvocation = invocation;
    eventLog!.append(workerEvent(
      eventSequence++,
      point,
      "invocation-started",
      "running",
      invocation,
    ));
    progressLog!.append(radialProgressEvent(
      progressSequence++,
      point,
      progressState,
      "invocation-started",
      invocation.invocationId,
      null,
      "running",
    ));
  };
  const appendInvocationFinished = (
    invocation: Phase10C0VS6GovernedInvocationAuthority,
    point: Phase10C0VS6MonotonicEventPoint,
    terminalState: "complete" | "registered-cap" | "infrastructure-failure",
    retainedCandidate?: Phase10C0VS6ArtifactIdentity,
  ): void => {
    if (openInvocation?.invocationId !== invocation.invocationId) {
      fail("radial parent finished a different open invocation");
    }
    eventLog!.append(workerEvent(
      eventSequence++,
      point,
      "invocation-finished",
      terminalState,
      invocation,
    ));
    progressLog!.append(radialProgressEvent(
      progressSequence++,
      point,
      progressState,
      "invocation-finished",
      invocation.invocationId,
      null,
      terminalState,
    ), retainedCandidate);
    openInvocation = null;
  };
  const governedFinishPoint = (
    label: string,
    started: Phase10C0VS6MonotonicEventPoint,
    startedAtMonotonicNanoseconds: bigint,
    governed: Readonly<{
      readonly terminalState: "complete" | "registered-cap";
      readonly startedAtMonotonicNanoseconds: bigint;
      readonly finishedAtMonotonicNanoseconds: bigint;
      readonly elapsedNanoseconds: number;
    }>,
    invocation: Phase10C0VS6GovernedInvocationAuthority,
  ): Phase10C0VS6MonotonicEventPoint => {
    if (governed.startedAtMonotonicNanoseconds !== startedAtMonotonicNanoseconds ||
      governed.finishedAtMonotonicNanoseconds !==
        startedAtMonotonicNanoseconds + BigInt(governed.elapsedNanoseconds)) {
      fail(`${label} result does not retain its exact watchdog start/finish boundaries`);
    }
    const finished = clock!.captureAt(governed.finishedAtMonotonicNanoseconds);
    const rawElapsed = finished.monotonicOffsetNanoseconds - started.monotonicOffsetNanoseconds;
    if (!Number.isSafeInteger(rawElapsed) || rawElapsed < 0 ||
      rawElapsed !== governed.elapsedNanoseconds ||
      phase10C0VS6ClassifyGovernedElapsedNanoseconds(
        rawElapsed,
        invocation.registeredWallSecondsMaximum,
      ) !== governed.terminalState) {
      fail(`${label} watchdog and retained raw timing boundary differ`);
    }
    return finished;
  };
  const appendWorkerStopped = (
    terminalState: "complete" | "registered-cap" | "infrastructure-failure",
  ): void => {
    const point = clock!.capture();
    eventLog!.append(workerEvent(
      eventSequence++,
      point,
      "worker-stopped",
      terminalState,
      null,
    ));
    progressLog!.append(radialProgressEvent(
      progressSequence++,
      point,
      progressState,
      "worker-stopped",
      null,
      null,
      terminalState,
    ));
  };
  const closeRawLogs = (): void => {
    eventLog!.closeAndReopen();
    eventLogClosed = true;
    progressLog!.closeAndReopen();
    progressLogClosed = true;
  };
  const finishRegisteredCap = async (): Promise<Phase10C0VS6GovernedWorkerOutcome> => {
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
    appendWorkerStopped("registered-cap");
    closeRawLogs();
    writeWorkerDiagnostics(root, packet, preflight, session);
    return Object.freeze({
      registeredCap: true,
      capturedGovernedCallerResult: null,
      workerExit: exit,
    });
  };

  try {
    await session.spawned;
    clock = new Phase10C0VS6MonotonicEventClock();
    const workerStarted = clock.first();
    eventLog = phase10C0VS6CreateWorkerInvocationEventLog(
      root,
      attemptPath(preflight, packet.workerInvocationContract.filename),
      packet.workerInvocationContract,
      workerEvent(eventSequence++, workerStarted, "worker-started", "running", null),
    );
    progressLog = phase10C0VS6CreateWorkerProgressEventLog(
      root,
      attemptPath(preflight, progressContract.filename),
      radialProgressEvent(
        progressSequence++,
        workerStarted,
        progressState,
        "worker-started",
        null,
        null,
        "running",
      ),
    );
    const ready = await nextWorkerMessage(session);
    assertWorkerMessage(ready, "ready", null);

    const production = roster[0]!;
    const productionBoundary: {
      started: Phase10C0VS6MonotonicEventPoint | null;
      startedAtMonotonicNanoseconds: bigint | null;
    } = { started: null, startedAtMonotonicNanoseconds: null };
    releaseWorkerOuterTarget(session);
    const produced = await phase10C0VS6RunGovernedLeafWithWatchdog<Uint8Array>(
      watchdog,
      production.registeredWallSecondsMaximum,
      (reason) => terminateWorker(session, reason),
      async (_signal, assertActive, complete, issuedStartedAtMonotonicNanoseconds) => {
        productionBoundary.startedAtMonotonicNanoseconds = issuedStartedAtMonotonicNanoseconds;
        productionBoundary.started = clock!.captureAt(issuedStartedAtMonotonicNanoseconds);
        appendInvocationStarted(production, productionBoundary.started);
        assertActive();
        const boundaryLines = Array.from(
          { length: progressContract.caseOrder.length * 2 },
          () => nextWorkerLine(session),
        );
        const resultLine = nextWorkerLineAtAuthenticatedBoundary(session, complete);
        await writeWorkerCommand(session, "invoke", production.invocationId);
        for (const [boundaryIndex, boundaryLine] of boundaryLines.entries()) {
          const message = parseWorkerMessage(session, await boundaryLine);
          assertWorkerMessage(message, "boundary", production.invocationId);
          const boundary = phase10C0VS6ValidateRadialProductionBoundary(
            packet,
            boundaryIndex,
            phase10C0VS6DecodeWorkerPayload(message.payload!),
          );
          if (boundary.stage === "start") {
            progressState.startedCaseIds.push(boundary.caseId);
            progressState.activeCaseId = boundary.caseId;
          } else {
            progressState.completedCaseIds.push(boundary.caseId);
            progressState.activeCaseId = null;
            progressState.completedFieldValueCount += boundary.expectedNodeCount;
          }
          progressLog!.append(radialProgressEvent(
            progressSequence++,
            clock!.capture(),
            progressState,
            boundary.stage === "start" ? "case-started" : "case-completed",
            production.invocationId,
            boundary.caseId,
            "running",
          ));
          assertActive();
          await writeWorkerCommand(
            session,
            "acknowledge",
            production.invocationId,
            message.sequence,
          );
        }
        return resultLine;
      },
    );
    if (productionBoundary.started === null ||
      productionBoundary.startedAtMonotonicNanoseconds === null) {
      productionBoundary.startedAtMonotonicNanoseconds = produced.startedAtMonotonicNanoseconds;
      productionBoundary.started = clock.captureAt(produced.startedAtMonotonicNanoseconds);
      appendInvocationStarted(production, productionBoundary.started);
    }
    const productionFinished = governedFinishPoint(
      "radial production",
      productionBoundary.started,
      productionBoundary.startedAtMonotonicNanoseconds,
      produced,
      production,
    );
    if (produced.terminalState === "registered-cap") {
      appendInvocationFinished(production, productionFinished, "registered-cap");
      return finishRegisteredCap();
    }
    registerWorkerForOuterWatchdog(session, watchdog);
    const producerMessage = parseWorkerMessage(session, produced.value!);
    assertWorkerMessage(producerMessage, "result", production.invocationId);
    const producerCapture = radialProducerCapture(
      packet,
      preflight,
      phase10C0VS6DecodeWorkerPayload(producerMessage.payload!),
    );
    watchdog.assertActive();
    const writtenWitness = phase10C0VS6WriteExclusiveOrExact(
      root,
      producerCapture.witnessIdentity.path,
      producerCapture.witnessBytes,
    );
    phase10C0VS6SameIdentity(
      writtenWitness.identity,
      producerCapture.witnessIdentity,
      "retained radial producer witness",
    );
    const writtenSummary = phase10C0VS6WriteExclusiveOrExact(
      root,
      producerCapture.producerSummaryIdentity.path,
      producerCapture.producerSummaryBytes,
    );
    phase10C0VS6SameIdentity(
      writtenSummary.identity,
      producerCapture.producerSummaryIdentity,
      "retained radial producer summary",
    );
    watchdog.assertActive();
    progressState.candidate = producerCapture.witnessIdentity;
    appendInvocationFinished(
      production,
      productionFinished,
      "complete",
      producerCapture.witnessIdentity,
    );

    const evaluator = roster[1]!;
    const evaluatorBoundary: {
      started: Phase10C0VS6MonotonicEventPoint | null;
      startedAtMonotonicNanoseconds: bigint | null;
      firstControlTransition: Phase10C0VS6GovernedLeafArrivalTransition | null;
    } = {
      started: null,
      startedAtMonotonicNanoseconds: null,
      firstControlTransition: null,
    };
    releaseWorkerOuterTarget(session);
    const evaluatedToFirstControl = await phase10C0VS6RunGovernedLeafWithWatchdog<Uint8Array>(
      watchdog,
      evaluator.registeredWallSecondsMaximum,
      (reason) => terminateWorker(session, reason),
      async (_signal, assertActive, complete, issuedStartedAtMonotonicNanoseconds) => {
        evaluatorBoundary.startedAtMonotonicNanoseconds = issuedStartedAtMonotonicNanoseconds;
        evaluatorBoundary.started = clock!.captureAt(issuedStartedAtMonotonicNanoseconds);
        appendInvocationStarted(evaluator, evaluatorBoundary.started);
        assertActive();
        const firstControlLine = nextWorkerLineAtAuthenticatedBoundary(session, (line) => {
          const transition = phase10C0VS6CaptureGovernedLeafArrivalTransition(watchdog);
          evaluatorBoundary.firstControlTransition = transition;
          return complete(line, transition);
        });
        await writeWorkerCommand(session, "invoke", evaluator.invocationId);
        return firstControlLine;
      },
    );
    if (evaluatorBoundary.started === null ||
      evaluatorBoundary.startedAtMonotonicNanoseconds === null) {
      evaluatorBoundary.startedAtMonotonicNanoseconds =
        evaluatedToFirstControl.startedAtMonotonicNanoseconds;
      evaluatorBoundary.started = clock.captureAt(
        evaluatedToFirstControl.startedAtMonotonicNanoseconds,
      );
      appendInvocationStarted(evaluator, evaluatorBoundary.started);
    }
    const evaluatorFinished = governedFinishPoint(
      "radial evaluator",
      evaluatorBoundary.started,
      evaluatorBoundary.startedAtMonotonicNanoseconds,
      evaluatedToFirstControl,
      evaluator,
    );
    if (evaluatedToFirstControl.terminalState === "registered-cap") {
      appendInvocationFinished(evaluator, evaluatorFinished, "registered-cap");
      return finishRegisteredCap();
    }
    registerWorkerForOuterWatchdog(session, watchdog);
    const firstControlStart = parseWorkerMessage(session, evaluatedToFirstControl.value!);
    assertWorkerMessage(firstControlStart, "boundary", roster[2]!.invocationId);
    validateRadialControlBoundary(
      0,
      phase10C0VS6DecodeWorkerPayload(firstControlStart.payload!),
      Object.freeze({
        stage: "start",
        boundaryKind: "governed-leaf",
        caseIndex: null,
        caseId: null,
      }),
    );
    appendInvocationFinished(evaluator, evaluatorFinished, "complete");

    let priorArtifactMessage: Phase10C0VS6WorkerMessage | null = null;
    for (let controlIndex = 0; controlIndex < RADIAL_CONTROL_ARTIFACT_AUTHORITY.length;
      controlIndex += 1) {
      const control = roster[controlIndex + 2]!;
      const streamAuthority = RADIAL_CONTROL_ARTIFACT_AUTHORITY[controlIndex]!;
      let startMessage: Phase10C0VS6WorkerMessage | null = controlIndex === 0
        ? firstControlStart
        : null;
      let startedPoint: Phase10C0VS6MonotonicEventPoint | null = null;
      let startedAtMonotonicNanoseconds: bigint | null = null;
      const controlAction = async (
        _signal: AbortSignal,
        assertActive: () => void,
        complete: (
          value: Uint8Array,
          transition?: Phase10C0VS6GovernedLeafArrivalTransition,
        ) => Phase10C0VS6GovernedLeafCompletion<Uint8Array>,
        issuedStartedAtMonotonicNanoseconds: bigint,
      ): Promise<Phase10C0VS6GovernedLeafCompletion<Uint8Array>> => {
        if (startMessage === null) fail(`${control.invocationId} lacks its authenticated start message`);
        startedAtMonotonicNanoseconds = issuedStartedAtMonotonicNanoseconds;
        startedPoint = clock!.captureAt(issuedStartedAtMonotonicNanoseconds);
        appendInvocationStarted(control, startedPoint);
        assertActive();
        const intermediateCount = (streamAuthority.internalCaseBoundaries
          ? progressContract.caseOrder.length * 2
          : 0) + 2;
        const intermediateLines = Array.from(
          { length: intermediateCount },
          () => nextWorkerLine(session),
        );
        const completionLine = nextWorkerLineAtAuthenticatedBoundary(session, complete);
        await writeWorkerCommand(
          session,
          "acknowledge",
          control.invocationId,
          startMessage.sequence,
        );
        let intermediateIndex = 0;
        if (streamAuthority.internalCaseBoundaries) {
          for (const [caseIndex, caseId] of progressContract.caseOrder.entries()) {
            for (const stage of ["start", "complete"] as const) {
              const message = parseWorkerMessage(
                session,
                await intermediateLines[intermediateIndex++]!,
              );
              assertWorkerMessage(message, "boundary", control.invocationId);
              validateRadialControlBoundary(
                controlIndex,
                phase10C0VS6DecodeWorkerPayload(message.payload!),
                Object.freeze({
                  stage,
                  boundaryKind: "internal-case",
                  caseIndex,
                  caseId,
                }),
              );
              assertActive();
              await writeWorkerCommand(
                session,
                "acknowledge",
                control.invocationId,
                message.sequence,
              );
            }
          }
        }
        for (let progressIndex = 0; progressIndex < 2; progressIndex += 1) {
          const message = parseWorkerMessage(
            session,
            await intermediateLines[intermediateIndex++]!,
          );
          assertWorkerMessage(message, "progress", control.invocationId);
          validateRadialControlProgress(
            controlIndex,
            progressIndex,
            phase10C0VS6DecodeWorkerPayload(message.payload!),
          );
          assertActive();
        }
        if (intermediateIndex !== intermediateLines.length) {
          fail(`${control.invocationId} did not consume its exact intermediate stream`);
        }
        return completionLine;
      };

      releaseWorkerOuterTarget(session);
      const governed = controlIndex === 0
        ? await phase10C0VS6RunGovernedLeafFromArrivalWithWatchdog(
          watchdog,
          evaluatorBoundary.firstControlTransition!,
          control.registeredWallSecondsMaximum,
          (reason) => terminateWorker(session, reason),
          controlAction,
        )
        : await phase10C0VS6RunGovernedLeafFromDeferredArrivalWithWatchdog(
          watchdog,
          control.registeredWallSecondsMaximum,
          (reason) => terminateWorker(session, reason),
          async (_signal, captureArrival) => {
            if (priorArtifactMessage === null) {
              fail(`${control.invocationId} lacks the prior retained artifact acknowledgement`);
            }
            const arrivalPromise = session.output.nextLineAtAuthenticatedStartArrival(captureArrival);
            await writeWorkerCommand(
              session,
              "acknowledge",
              priorArtifactMessage.invocationId,
              priorArtifactMessage.sequence,
            );
            const arrival = await arrivalPromise;
            startMessage = parseWorkerMessage(session, arrival.line);
            assertWorkerMessage(startMessage, "boundary", control.invocationId);
            validateRadialControlBoundary(
              controlIndex,
              phase10C0VS6DecodeWorkerPayload(startMessage.payload!),
              Object.freeze({
                stage: "start",
                boundaryKind: "governed-leaf",
                caseIndex: null,
                caseId: null,
              }),
            );
            return arrival.transition;
          },
          controlAction,
        );
      if (startedPoint === null || startedAtMonotonicNanoseconds === null) {
        startedAtMonotonicNanoseconds = governed.startedAtMonotonicNanoseconds;
        startedPoint = clock.captureAt(governed.startedAtMonotonicNanoseconds);
        appendInvocationStarted(control, startedPoint);
      }
      const controlFinished = governedFinishPoint(
        control.invocationId,
        startedPoint,
        startedAtMonotonicNanoseconds,
        governed,
        control,
      );
      if (governed.terminalState === "registered-cap") {
        appendInvocationFinished(control, controlFinished, "registered-cap");
        return finishRegisteredCap();
      }
      registerWorkerForOuterWatchdog(session, watchdog);
      const completeMessage = parseWorkerMessage(session, governed.value!);
      assertWorkerMessage(completeMessage, "boundary", control.invocationId);
      validateRadialControlBoundary(
        controlIndex,
        phase10C0VS6DecodeWorkerPayload(completeMessage.payload!),
        Object.freeze({
          stage: "complete",
          boundaryKind: "governed-leaf",
          caseIndex: null,
          caseId: null,
        }),
      );
      appendInvocationFinished(control, controlFinished, "complete");
      const artifactLine = nextWorkerLine(session);
      await writeWorkerCommand(
        session,
        "acknowledge",
        control.invocationId,
        completeMessage.sequence,
      );
      const artifactMessage = parseWorkerMessage(session, await artifactLine);
      assertWorkerMessage(artifactMessage, "artifact", control.invocationId);
      const artifact = phase10C0VS6ValidateRadialControlArtifact(
        preflight,
        controlIndex,
        phase10C0VS6DecodeWorkerPayload(artifactMessage.payload!),
      );
      watchdog.assertActive();
      const written = phase10C0VS6WriteExclusiveOrExact(root, artifact.identity.path, artifact.bytes);
      phase10C0VS6SameIdentity(
        written.identity,
        artifact.identity,
        `${artifact.negativeControlId} retained artifact`,
      );
      watchdog.assertActive();
      retainedControls.push(artifact);
      priorArtifactMessage = artifactMessage;
    }

    if (priorArtifactMessage === null) fail("radial campaign retained no final control artifact");
    const evaluatorResultLine = nextWorkerLine(session);
    await writeWorkerCommand(
      session,
      "acknowledge",
      priorArtifactMessage.invocationId,
      priorArtifactMessage.sequence,
    );
    const evaluatorMessage = parseWorkerMessage(session, await evaluatorResultLine);
    assertWorkerMessage(evaluatorMessage, "result", evaluator.invocationId);
    const evaluatorCapture = radialEvaluatorCapture(
      packet,
      preflight,
      producerCapture,
      retainedControls,
      phase10C0VS6DecodeWorkerPayload(evaluatorMessage.payload!),
    );
    watchdog.assertActive();
    phase10C0VS6WriteExclusiveOrExact(
      root,
      `${preflight.observed.candidateDirectory}/c0v-radial-evaluation.json`,
      evaluatorCapture.evaluationBytes,
    );
    watchdog.assertActive();

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
    appendWorkerStopped("complete");
    closeRawLogs();
    releaseWorkerOuterTarget(session);
    writeWorkerDiagnostics(root, packet, preflight, session);
    return Object.freeze({
      registeredCap: false,
      capturedGovernedCallerResult: evaluatorCapture.callerResult,
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
      // Active stale locks preserve the incomplete radial attempt for successor inspection.
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
        // A prior raw exit or failed write leaves the ignored root successor-only.
      }
    }
    if (clock !== null && eventLog !== null && !eventLogClosed) {
      try {
        if (openInvocation !== null) {
          eventLog.append(workerEvent(
            eventSequence++,
            clock.capture(),
            "invocation-finished",
            "infrastructure-failure",
            openInvocation,
          ));
        }
        eventLog.append(workerEvent(
          eventSequence++,
          clock.capture(),
          "worker-stopped",
          "infrastructure-failure",
          null,
        ));
        eventLog.closeAndReopen();
        eventLogClosed = true;
      } catch {
        // The incomplete append-only invocation stream remains beneath stale locks.
      }
    }
    if (clock !== null && progressLog !== null && !progressLogClosed) {
      try {
        const progressOpenInvocation = openInvocation as
          | Phase10C0VS6GovernedInvocationAuthority
          | null;
        if (progressOpenInvocation !== null) {
          progressLog.append(radialProgressEvent(
            progressSequence++,
            clock.capture(),
            progressState,
            "invocation-finished",
            progressOpenInvocation.invocationId,
            null,
            "infrastructure-failure",
          ));
          openInvocation = null;
        }
        progressLog.append(radialProgressEvent(
          progressSequence++,
          clock.capture(),
          progressState,
          "worker-stopped",
          null,
          null,
          "infrastructure-failure",
        ));
        progressLog.closeAndReopen();
        progressLogClosed = true;
      } catch {
        // The incomplete append-only progress stream remains beneath stale locks.
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
    packet.registeredAttemptId !== "a-p-c0v-s6-20260822-v4") {
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
    registeredAttemptId: "a-p-c0v-s6-20260822-v4",
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
    const worker = await runMatchOnlyWorker(root, authority, preflight, watchdog, MOVING_PARENT_CONFIG);
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

async function runLockedStaticPacket(
  root: Phase10C0VS6PhysicalRoot,
  locks: Phase10C0VS6PackageAndPacketLockContext,
  authority: Phase10C0VS6LockedPacketAuthority,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): Promise<Phase10C0VS6RunResult> {
  const packet = authority.packet;
  const config = STATIC_PARENT_CONFIG;
  if (packet.packetId !== config.packetId ||
    packet.registeredAttemptId !== config.registeredAttemptId) {
    fail("locked static runner received different packet authority");
  }
  watchdog.assertActive();
  const writtenPreflight = phase10C0VS6WriteObservedPreflight({ root, locks, authority, watchdog });
  watchdog.assertActive();
  const preflight = writtenPreflight.receipt;
  phase10C0VS6EnsurePhysicalDirectory(root, preflight.observed.attemptDirectory);
  writeRetainedFreeze(root, authority, preflight, writtenPreflight.bytes, watchdog);

  let capturedGovernedCallerResult: StrictJson | null = null;
  if (preflight.verdict === "refusal") {
    if (preflight.refusalCandidate === null) fail("static refusal preflight lacks its exact candidate");
    writeExitStatus(root, packet, preflight, {
      workerProcessInvocationCount: 0,
      workerStarted: false,
      exitCode: null,
      signal: null,
      classification: "no-worker",
    });
    writeWorkerDiagnostics(root, packet, preflight, null);
  } else {
    if (preflight.refusalCandidate !== null) fail("passing static preflight retains a refusal candidate");
    const worker = await runMatchOnlyWorker(root, authority, preflight, watchdog, config);
    capturedGovernedCallerResult = worker.capturedGovernedCallerResult;
  }
  writeRawCause(root, authority, preflight, writtenPreflight.bytes, watchdog);
  watchdog.assertActive();
  const finalized = independentlyFinalizePhase10C0VS6StaticProducePacket(Object.freeze({
    ...rawRuntimeInput(root, authority, writtenPreflight.bytes),
    locks,
    lockedAuthority: authority,
    watchdog,
    capturedGovernedCallerResult,
  }));
  return Object.freeze({
    mode: "run",
    packetId: config.packetId,
    registeredAttemptId: config.registeredAttemptId,
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
    const worker = await runLayerPublishWorker(
      root,
      authority,
      preflight,
      watchdog,
      MOVING_PUBLISH_PARENT_CONFIG,
    );
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

async function runLockedRadialPublishPacket(
  root: Phase10C0VS6PhysicalRoot,
  locks: Phase10C0VS6PackageAndPacketLockContext,
  authority: Phase10C0VS6LockedPacketAuthority,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): Promise<Phase10C0VS6RunResult> {
  const packet = authority.packet;
  const config = RADIAL_PUBLISH_PARENT_CONFIG;
  if (packet.packetId !== config.packetId ||
    packet.registeredAttemptId !== config.registeredAttemptId) {
    fail("locked radial-publish runner received different packet authority");
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
      fail("radial-publish refusal preflight lacks its exact candidate");
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
      fail("passing radial-publish preflight retains a refusal candidate");
    }
    const worker = await runLayerPublishWorker(root, authority, preflight, watchdog, config);
    capturedGovernedCallerResult = worker.capturedGovernedCallerResult;
    if (worker.registeredCap) {
      writeRawCause(root, authority, preflight, writtenPreflight.bytes, watchdog);
    }
  }

  watchdog.assertActive();
  const finalized = independentlyFinalizePhase10C0VS6RadialPublishPacket(Object.freeze({
    ...rawRuntimeInput(root, authority, writtenPreflight.bytes),
    locks,
    lockedAuthority: authority,
    watchdog,
    capturedGovernedCallerResult,
  }));
  return Object.freeze({
    mode: "run",
    packetId: config.packetId,
    registeredAttemptId: config.registeredAttemptId,
    selectedSubrouteId: finalized.terminalCandidate.lifecycle.selectedSubrouteId,
    terminalState: finalized.terminalCandidate.lifecycle.terminalState,
    terminalReceiptIdentity: finalized.terminalReceiptIdentity,
    verificationIdentity: finalized.verificationIdentity,
  });
}

async function runLockedStaticPublishPacket(
  root: Phase10C0VS6PhysicalRoot,
  locks: Phase10C0VS6PackageAndPacketLockContext,
  authority: Phase10C0VS6LockedPacketAuthority,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): Promise<Phase10C0VS6RunResult> {
  const packet = authority.packet;
  const config = STATIC_PUBLISH_PARENT_CONFIG;
  if (packet.packetId !== config.packetId ||
    packet.registeredAttemptId !== config.registeredAttemptId) {
    fail("locked static-publish runner received different packet authority");
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
      fail("static-publish refusal preflight lacks its exact candidate");
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
      fail("passing static-publish preflight retains a refusal candidate");
    }
    const worker = await runLayerPublishWorker(root, authority, preflight, watchdog, config);
    capturedGovernedCallerResult = worker.capturedGovernedCallerResult;
    if (worker.registeredCap) {
      writeRawCause(root, authority, preflight, writtenPreflight.bytes, watchdog);
    }
  }

  watchdog.assertActive();
  const finalized = independentlyFinalizePhase10C0VS6StaticPublishPacket(Object.freeze({
    ...rawRuntimeInput(root, authority, writtenPreflight.bytes),
    locks,
    lockedAuthority: authority,
    watchdog,
    capturedGovernedCallerResult,
  }));
  return Object.freeze({
    mode: "run",
    packetId: config.packetId,
    registeredAttemptId: config.registeredAttemptId,
    selectedSubrouteId: finalized.terminalCandidate.lifecycle.selectedSubrouteId,
    terminalState: finalized.terminalCandidate.lifecycle.terminalState,
    terminalReceiptIdentity: finalized.terminalReceiptIdentity,
    verificationIdentity: finalized.verificationIdentity,
  });
}

async function runLockedAggregatePacket(
  root: Phase10C0VS6PhysicalRoot,
  locks: Phase10C0VS6PackageAndPacketLockContext,
  authority: Phase10C0VS6LockedPacketAuthority,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): Promise<Phase10C0VS6RunResult> {
  const packet = authority.packet;
  if (packet.packetId !== "c0v-aggregate" ||
    packet.registeredAttemptId !== "c0v-aggregate-20260822-v1") {
    fail("locked aggregate runner received different packet authority");
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
      fail("aggregate refusal preflight lacks its exact candidate");
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
      fail("passing aggregate preflight retains a refusal candidate");
    }
    const worker = await runAggregateWorker(root, authority, preflight, watchdog);
    capturedGovernedCallerResult = worker.capturedGovernedCallerResult;
    if (worker.registeredCap) {
      writeRawCause(root, authority, preflight, writtenPreflight.bytes, watchdog);
    }
  }

  watchdog.assertActive();
  const finalized = independentlyFinalizePhase10C0VS6AggregatePacket(Object.freeze({
    ...rawRuntimeInput(root, authority, writtenPreflight.bytes),
    locks,
    lockedAuthority: authority,
    watchdog,
    capturedGovernedCallerResult,
  }));
  return Object.freeze({
    mode: "run",
    packetId: "c0v-aggregate",
    registeredAttemptId: "c0v-aggregate-20260822-v1",
    selectedSubrouteId: finalized.terminalCandidate.lifecycle.selectedSubrouteId,
    terminalState: finalized.terminalCandidate.lifecycle.terminalState,
    terminalReceiptIdentity: finalized.terminalReceiptIdentity,
    verificationIdentity: finalized.verificationIdentity,
  });
}

async function runLockedRadialPacket(
  root: Phase10C0VS6PhysicalRoot,
  locks: Phase10C0VS6PackageAndPacketLockContext,
  authority: Phase10C0VS6LockedPacketAuthority,
  watchdog: Phase10C0VS6ParentWatchdogContext,
): Promise<Phase10C0VS6RunResult> {
  const packet = authority.packet;
  if (packet.packetId !== "c0v-radial-produce" ||
    packet.registeredAttemptId !== "c0v-radial-produce-20260822-v1") {
    fail("locked radial runner received different packet authority");
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
      fail("radial refusal preflight lacks its exact candidate");
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
      fail("passing radial preflight retains a refusal candidate");
    }
    const worker = await runRadialWorker(root, authority, preflight, watchdog);
    capturedGovernedCallerResult = worker.capturedGovernedCallerResult;
    if (worker.registeredCap) {
      writeRawCause(root, authority, preflight, writtenPreflight.bytes, watchdog);
    }
  }

  watchdog.assertActive();
  const finalized = independentlyFinalizePhase10C0VS6RadialProducePacket(Object.freeze({
    ...rawRuntimeInput(root, authority, writtenPreflight.bytes),
    locks,
    lockedAuthority: authority,
    watchdog,
    capturedGovernedCallerResult,
  }));
  return Object.freeze({
    mode: "run",
    packetId: "c0v-radial-produce",
    registeredAttemptId: "c0v-radial-produce-20260822-v1",
    selectedSubrouteId: finalized.terminalCandidate.lifecycle.selectedSubrouteId,
    terminalState: finalized.terminalCandidate.lifecycle.terminalState,
    terminalReceiptIdentity: finalized.terminalReceiptIdentity,
    verificationIdentity: finalized.verificationIdentity,
  });
}

function packetRunImplementationFreezeReady(packetId: Phase10C0VS6PacketId): boolean {
  switch (packetId) {
    case "a-p-c0v-s6": return AP_RUN_IMPLEMENTATION_FREEZE_READY;
    case "c0v-moving-produce": return MOVING_RUN_IMPLEMENTATION_FREEZE_READY;
    case "c0v-moving-publish": return MOVING_PUBLISH_RUN_IMPLEMENTATION_FREEZE_READY;
    case "c0v-radial-produce": return RADIAL_RUN_IMPLEMENTATION_FREEZE_READY;
    case "c0v-radial-publish": return RADIAL_PUBLISH_RUN_IMPLEMENTATION_FREEZE_READY;
    case "c0v-static-produce": return STATIC_RUN_IMPLEMENTATION_FREEZE_READY;
    case "c0v-static-publish": return STATIC_PUBLISH_RUN_IMPLEMENTATION_FREEZE_READY;
    case "c0v-aggregate": return AGGREGATE_RUN_IMPLEMENTATION_FREEZE_READY;
  }
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
  const executableNow = packetRunImplementationFreezeReady(argumentsValue.packetId) && allCallablesResolved;
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
  // Unsupported packets and not-yet-frozen runtime paths fail before repository or lock
  // observation, so they cannot consume a one-shot attempt.
  const ready = packetRunImplementationFreezeReady(parsed.packetId);
  if (!ready) {
    fail(`${parsed.packetId} run is fail-closed until its raw finalizer is implementation-freeze ready`);
  }
  const root = phase10C0VS6PhysicalRepositoryRoot(repositoryRoot);
  return phase10C0VS6WithPackageAndPacketLocks(
    root,
    parsed.packetId,
    "run",
    (locks, authority, watchdog) => {
      switch (parsed.packetId) {
        case "a-p-c0v-s6": return runLockedApPacket(root, locks, authority, watchdog);
        case "c0v-moving-produce": return runLockedMovingPacket(root, locks, authority, watchdog);
        case "c0v-moving-publish": return runLockedMovingPublishPacket(root, locks, authority, watchdog);
        case "c0v-radial-produce": return runLockedRadialPacket(root, locks, authority, watchdog);
        case "c0v-radial-publish": return runLockedRadialPublishPacket(root, locks, authority, watchdog);
        case "c0v-static-produce": return runLockedStaticPacket(root, locks, authority, watchdog);
        case "c0v-static-publish": return runLockedStaticPublishPacket(root, locks, authority, watchdog);
        case "c0v-aggregate": return runLockedAggregatePacket(root, locks, authority, watchdog);
      }
    },
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
