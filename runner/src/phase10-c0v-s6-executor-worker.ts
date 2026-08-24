import { Buffer } from "node:buffer";
import { readSync, writeSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { argv as processArguments, exit as exitProcess } from "node:process";
import { pathToFileURL } from "node:url";
import { strictJsonSnapshot } from "./gate4-evidence.ts";
import {
  parsePhase10C0VRadialProtocol,
  phase10C0VRadialReferenceInput,
} from "./phase10-c0v-contracts.ts";
import {
  runPhase10C0VS6MissingProducerControl,
  runPhase10C0VS6UncalledCheckControl,
  type Phase10C0VS6ApNegativeControlReceipt,
} from "./phase10-c0v-s6-ap-negative-controls.ts";
import {
  producePhase10C0VS6ApArtifacts,
  verifyPhase10C0VS6ApArtifacts,
  type Phase10C0VS6ApProduceResult,
} from "./phase10-c0v-s6-ap.ts";
import {
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  type Phase10C0VS6PacketId,
  type Phase10C0VS6PacketProtocol,
  type Phase10C0VS6RetainedPreflight,
} from "./phase10-c0v-s6-contracts.ts";
import {
  phase10C0VRadialProduceCheckCaller,
  type Phase10C0VRadialCheckCallerResult,
} from "./phase10-c0v-radial-checks.ts";
import {
  producePhase10C0VRadialWitness,
  type Phase10C0VRadialProductionOutput,
} from "./phase10-c0v-radial-production.ts";
import {
  producePhase10C0VAggregate,
  phase10C0VAnyLayerNonpass,
  type Phase10C0VAggregateProduceResult,
  type Phase10C0VAnyLayerNonpassResult,
} from "./phase10-c0v-s6-aggregate.ts";
import { phase10C0VAggregateCheckCaller } from "./phase10-c0v-s6-aggregate-checks.ts";
import {
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6PrettyJsonBytes,
  phase10C0VS6SameIdentity,
  type Phase10C0VS6LifecycleCheckContext,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6PhysicalRepositoryRoot,
  phase10C0VS6ReadUniquePhysicalFile,
  type Phase10C0VS6PhysicalRoot,
} from "./phase10-c0v-s6-filesystem.ts";
import {
  producePhase10C0VMovingPublication,
  producePhase10C0VRadialPublication,
  producePhase10C0VStaticPublication,
  type Phase10C0VPublicationProduceResult,
} from "./phase10-c0v-s6-publication.ts";
import {
  phase10C0VMovingPublishCheckCaller,
  phase10C0VRadialPublishCheckCaller,
  phase10C0VStaticPublishCheckCaller,
} from "./phase10-c0v-s6-publication-checks.ts";
import {
  phase10C0VMovingProduceCheckCaller,
  phase10C0VStaticProduceCheckCaller,
} from "./phase10-c0v-s6-refusal.ts";
import {
  derivePhase10C0VS6RetainedRuntimeAuthority,
  type Phase10C0VS6RawRuntimeAuthorityInput,
} from "./phase10-c0v-s6-runtime-authority.ts";
import {
  PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY,
  PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES,
  phase10C0VS6AssertExactRuntimeLoaderState,
  phase10C0VS6AssertExactWorkerEnvironment,
  phase10C0VS6ParseWorkerCommandLine,
  phase10C0VS6WorkerMessageLine,
  type Phase10C0VS6WorkerCommand,
  type Phase10C0VS6WorkerMessageInput,
  type Phase10C0VS6WorkerMessageKind,
} from "./phase10-c0v-s6-worker-transport.ts";

export interface Phase10C0VS6WorkerArguments {
  readonly repositoryRoot: string;
  readonly packetId: Phase10C0VS6PacketId;
  readonly protocolPath: string;
  readonly attemptId: string;
}

export interface Phase10C0VS6HardCodedWorkerInvocation {
  readonly invocationId: string;
  readonly callableId: string;
  readonly negativeControlId: string | null;
  readonly invocationClass:
    | "solver-production"
    | "numerical-evaluator"
    | "numerical-negative-control"
    | "route-cause-evaluator"
    | "packet-producer"
    | "packet-evaluator"
    | "packet-negative-control";
  readonly registeredWallSecondsMaximum: 300 | 14400;
}

const HARD_CODED_INVOCATIONS = Object.freeze({
  "a-p-c0v-s6": Object.freeze([
    Object.freeze({ invocationId: "inv-a-p-c0v-s6-nc-missing-producer", callableId: "phase10-nc-a-p-c0v-s6-missing-producer", negativeControlId: "nc-ap-c0v-s6-missing-producer", invocationClass: "packet-negative-control", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-a-p-c0v-s6-nc-uncalled-check", callableId: "phase10-nc-a-p-c0v-s6-uncalled-check", negativeControlId: "nc-ap-c0v-s6-uncalled-check", invocationClass: "packet-negative-control", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-a-p-c0v-s6-producer", callableId: "phase10-a-p-c0v-s6-producer", negativeControlId: null, invocationClass: "packet-producer", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-a-p-c0v-s6-check-caller", callableId: "phase10-a-p-c0v-s6-check-caller", negativeControlId: null, invocationClass: "packet-evaluator", registeredWallSecondsMaximum: 14400 }),
  ]),
  "c0v-moving-produce": Object.freeze([
    Object.freeze({ invocationId: "inv-c0v-moving-cause", callableId: "phase10-c0v-moving-produce-check-caller", negativeControlId: null, invocationClass: "route-cause-evaluator", registeredWallSecondsMaximum: 14400 }),
  ]),
  "c0v-moving-publish": Object.freeze([
    Object.freeze({ invocationId: "inv-c0v-moving-publish-producer", callableId: "phase10-c0v-moving-publish-producer", negativeControlId: null, invocationClass: "packet-producer", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-c0v-moving-publish-check-caller", callableId: "phase10-c0v-moving-publish-check-caller", negativeControlId: null, invocationClass: "packet-evaluator", registeredWallSecondsMaximum: 14400 }),
  ]),
  "c0v-radial-produce": Object.freeze([
    Object.freeze({ invocationId: "inv-c0v-radial-production", callableId: "phase10-c0v-radial-production-producer", negativeControlId: null, invocationClass: "solver-production", registeredWallSecondsMaximum: 300 }),
    Object.freeze({ invocationId: "inv-c0v-radial-evaluator", callableId: "phase10-c0v-radial-evaluator", negativeControlId: null, invocationClass: "numerical-evaluator", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-c0v-radial-nc-finite-shell-term", callableId: "phase10-nc-radial-finite-shell-term", negativeControlId: "nc-radial-finite-shell-term", invocationClass: "numerical-negative-control", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-c0v-radial-nc-forged-summary", callableId: "phase10-nc-radial-forged-summary", negativeControlId: "nc-radial-forged-summary", invocationClass: "numerical-negative-control", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-c0v-radial-nc-robin-coefficient", callableId: "phase10-nc-radial-robin-coefficient", negativeControlId: "nc-radial-robin-coefficient", invocationClass: "numerical-negative-control", registeredWallSecondsMaximum: 14400 }),
  ]),
  "c0v-radial-publish": Object.freeze([
    Object.freeze({ invocationId: "inv-c0v-radial-publish-producer", callableId: "phase10-c0v-radial-publish-producer", negativeControlId: null, invocationClass: "packet-producer", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-c0v-radial-publish-check-caller", callableId: "phase10-c0v-radial-publish-check-caller", negativeControlId: null, invocationClass: "packet-evaluator", registeredWallSecondsMaximum: 14400 }),
  ]),
  "c0v-static-produce": Object.freeze([
    Object.freeze({ invocationId: "inv-c0v-static-cause", callableId: "phase10-c0v-static-produce-check-caller", negativeControlId: null, invocationClass: "route-cause-evaluator", registeredWallSecondsMaximum: 14400 }),
  ]),
  "c0v-static-publish": Object.freeze([
    Object.freeze({ invocationId: "inv-c0v-static-publish-producer", callableId: "phase10-c0v-static-publish-producer", negativeControlId: null, invocationClass: "packet-producer", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-c0v-static-publish-check-caller", callableId: "phase10-c0v-static-publish-check-caller", negativeControlId: null, invocationClass: "packet-evaluator", registeredWallSecondsMaximum: 14400 }),
  ]),
  "c0v-aggregate": Object.freeze([
    Object.freeze({ invocationId: "inv-c0v-aggregate-nc-any-layer-nonpass", callableId: "phase10-nc-c0v-any-layer-nonpass", negativeControlId: "nc-c0v-any-layer-nonpass", invocationClass: "packet-negative-control", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-c0v-aggregate-producer", callableId: "phase10-c0v-aggregate-producer", negativeControlId: null, invocationClass: "packet-producer", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-c0v-aggregate-check-caller", callableId: "phase10-c0v-aggregate-check-caller", negativeControlId: null, invocationClass: "packet-evaluator", registeredWallSecondsMaximum: 14400 }),
  ]),
} satisfies Readonly<Record<Phase10C0VS6PacketId, readonly Phase10C0VS6HardCodedWorkerInvocation[]>>);

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 executor worker refused: ${message}`);
}

function packetIdValue(value: unknown, label: string): Phase10C0VS6PacketId {
  if (typeof value !== "string" || !(value in PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY)) {
    fail(`${label} is not a compiled packet ID`);
  }
  return value as Phase10C0VS6PacketId;
}

function safeStableToken(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^[a-z0-9][a-z0-9.-]*$/u.test(value)) {
    fail(`${label} is not a safe stable token`);
  }
  return value;
}

function safeRepositoryRelativePath(value: unknown, label: string): string {
  if (typeof value !== "string" || isAbsolute(value) || value.includes("\\") || value.startsWith("/") ||
    value.endsWith("/") || value.split("/").some((entry) => entry === "" || entry === "." || entry === "..")) {
    fail(`${label} is not a safe repository-relative path`);
  }
  return value;
}

export function phase10C0VS6ParseWorkerArguments(argv: readonly string[]): Phase10C0VS6WorkerArguments {
  if (argv.length !== 8 || argv[0] !== "--repository-root" || argv[2] !== "--packet" ||
    argv[4] !== "--protocol" || argv[6] !== "--attempt") {
    fail("internal worker arguments differ from the exact compiled shape");
  }
  const root = phase10C0VS6PhysicalRepositoryRoot(argv[1]!).path;
  const packetId = packetIdValue(argv[3], "worker packet ID");
  const protocolPath = safeRepositoryRelativePath(argv[5], "worker protocol path");
  const attemptId = safeStableToken(argv[7], "worker attempt ID");
  const registered = PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY[packetId];
  if (protocolPath !== registered.protocolPath || attemptId !== registered.attemptId) {
    fail("worker protocol/attempt arguments differ from compiled packet authority");
  }
  return Object.freeze({ repositoryRoot: root, packetId, protocolPath, attemptId });
}

class SynchronousLineReader {
  private buffered = Buffer.alloc(0);

  read(): Uint8Array {
    while (true) {
      const newline = this.buffered.indexOf(0x0a);
      if (newline >= 0) {
        const line = new Uint8Array(this.buffered.subarray(0, newline + 1));
        this.buffered = this.buffered.subarray(newline + 1);
        if (line.byteLength > PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES) {
          fail("worker command line exceeds the bounded wire size");
        }
        return line;
      }
      if (this.buffered.byteLength >= PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES) {
        fail("worker command line exceeds the bounded wire size");
      }
      const buffer = Buffer.allocUnsafe(8192);
      const count = readSync(0, buffer, 0, buffer.byteLength, null);
      if (count === 0) fail("parent command stream ended before exact worker stop");
      this.buffered = Buffer.concat([this.buffered, buffer.subarray(0, count)]);
    }
  }
}

interface WorkerSession {
  readonly args: Phase10C0VS6WorkerArguments;
  readonly root: Phase10C0VS6PhysicalRoot;
  readonly packet: Phase10C0VS6PacketProtocol;
  readonly preflight: Phase10C0VS6RetainedPreflight;
  readonly rawInput: Phase10C0VS6RawRuntimeAuthorityInput;
  readonly roster: readonly Phase10C0VS6HardCodedWorkerInvocation[];
  readonly reader: SynchronousLineReader;
  inputSequence: number;
  outputSequence: number;
  invocationIndex: number;
  missingProducer: Phase10C0VS6ApNegativeControlReceipt | null;
  missingProducerBytes: Uint8Array | null;
  uncalledCheck: Phase10C0VS6ApNegativeControlReceipt | null;
  uncalledCheckBytes: Uint8Array | null;
  apProduction: Phase10C0VS6ApProduceResult | null;
  radialProduction: Phase10C0VRadialProductionOutput | null;
  radialEvaluation: Phase10C0VRadialCheckCallerResult | null;
  publicationProduction: Phase10C0VPublicationProduceResult | null;
  aggregateControl: Phase10C0VAnyLayerNonpassResult | null;
  aggregateProduction: Phase10C0VAggregateProduceResult | null;
}

function readCommand(session: WorkerSession): Phase10C0VS6WorkerCommand {
  const command = phase10C0VS6ParseWorkerCommandLine(
    session.reader.read(),
    session.inputSequence,
    session.args,
  );
  session.inputSequence += 1;
  return command;
}

function emitMessage(
  session: WorkerSession,
  kind: Phase10C0VS6WorkerMessageKind,
  invocationId: string | null,
  payloadValue: unknown = null,
): number {
  const sequence = session.outputSequence;
  const message: Phase10C0VS6WorkerMessageInput = Object.freeze({
    schema: "phase10-c0v-s6-worker-message-v1",
    sequence,
    packetId: session.args.packetId,
    attemptId: session.args.attemptId,
    kind,
    invocationId,
    payload: payloadValue,
  });
  const bytes = phase10C0VS6WorkerMessageLine(message, session.args);
  let offset = 0;
  while (offset < bytes.byteLength) {
    const written = writeSync(1, bytes, offset, bytes.byteLength - offset);
    if (written <= 0) fail("worker message write made no progress");
    offset += written;
  }
  session.outputSequence += 1;
  return sequence;
}

function awaitAcknowledgement(session: WorkerSession, invocationId: string, workerSequence: number): void {
  const command = readCommand(session);
  if (command.kind !== "acknowledge" || command.invocationId !== invocationId ||
    command.acknowledgedWorkerSequence !== workerSequence) {
    fail("parent acknowledgement differs from the exact emitted worker boundary");
  }
}

export function phase10C0VS6CompiledWorkerInvocationRoster(
  packet: Phase10C0VS6PacketProtocol,
): readonly Phase10C0VS6HardCodedWorkerInvocation[] {
  const expected = HARD_CODED_INVOCATIONS[packet.packetId];
  const actual = packet.executionMode === "radial-production" ||
    packet.executionMode === "discrepancy-match-only" || packet.executionMode === "preimplementation-refusal"
    ? packet.executableInvocationRosters
      .flatMap((entry) => entry.invocations)
      .filter((entry) => entry.terminalState === "complete")
      .filter((entry, index, rows) => rows.findIndex((other) => other.invocationId === entry.invocationId) === index)
    : packet.verificationInvocationRoster;
  if (actual.length !== expected.length || actual.some((entry, index) => {
    const row = expected[index]!;
    return entry.invocationId !== row.invocationId || entry.callableId !== row.callableId ||
      entry.negativeControlId !== row.negativeControlId || entry.invocationClass !== row.invocationClass ||
      entry.registeredWallSecondsMaximum !== row.registeredWallSecondsMaximum;
  })) {
    fail("live protocol invocation roster differs from compiled worker dispatch");
  }
  return expected;
}

function lifecycleContext(session: WorkerSession): Phase10C0VS6LifecycleCheckContext {
  const { packet, preflight, rawInput } = session;
  if (packet.packetId !== "c0v-radial-produce" || packet.selectedRouteId === null ||
    packet.bindings.scienceProtocol === null || packet.bindings.referenceOrRefusal === null) {
    fail("radial lifecycle context requires exact radial packet authority");
  }
  return Object.freeze({
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    executionMode: packet.executionMode,
    selectedRoute: packet.selectedRouteId,
    runtime: packet.resources.requiredRuntime,
    command: preflight.observed.command,
    gitHead: preflight.observed.head,
    packetProtocol: rawInput.packetProtocolIdentity,
    scienceProtocol: packet.bindings.scienceProtocol,
    preflight: phase10C0VS6ArtifactIdentity(packet.paths.preflightReceiptPath, rawInput.preflightBytes),
    referenceOrRefusal: packet.bindings.referenceOrRefusal,
    resource: Object.freeze({
      maxWallSeconds: packet.resources.solverWorkerTimeoutSeconds,
      processConcurrency: packet.resources.processConcurrency,
      projectedScratchBytes: packet.resources.projectedScratchBytes,
      projectedPublicationBytes: packet.resources.projectedPublicationBytes,
      minimumFreeBytes: packet.resources.minimumFreeBytes,
      observedFreeBytes: preflight.observed.resources.observedFreeBytes,
    }),
    boundDependencyPacketIds: Object.freeze([...packet.boundDependencyPacketIds]),
  });
}

function refusalInput(session: WorkerSession) {
  const science = session.packet.bindings.scienceProtocol;
  const reference = session.packet.bindings.referenceOrRefusal;
  if (science === null || reference === null) fail("refusal packet lacks science/reference bindings");
  return Object.freeze({
    ...session.rawInput,
    scienceProtocolBytes: phase10C0VS6ReadUniquePhysicalFile(session.root, science.path),
    scienceProtocolIdentity: science,
    referenceOrRefusalBytes: phase10C0VS6ReadUniquePhysicalFile(session.root, reference.path),
    referenceOrRefusalIdentity: reference,
  });
}

function radialControlInvocationId(negativeControlId: string): string {
  switch (negativeControlId) {
    case "nc-radial-finite-shell-term": return "inv-c0v-radial-nc-finite-shell-term";
    case "nc-radial-forged-summary": return "inv-c0v-radial-nc-forged-summary";
    case "nc-radial-robin-coefficient": return "inv-c0v-radial-nc-robin-coefficient";
    default: return fail("radial callback names an unregistered negative control");
  }
}

function invokeRadialCampaign(session: WorkerSession, invocationId: string): Phase10C0VRadialCheckCallerResult {
  const production = session.radialProduction;
  const scienceIdentity = session.packet.bindings.scienceProtocol;
  const referenceIdentity = session.packet.bindings.referenceOrRefusal;
  if (production === null || scienceIdentity === null || referenceIdentity === null ||
    session.packet.radialBinaryLayout === null) {
    fail("radial evaluator requires the completed producer and exact packet bindings");
  }
  const scienceBytes = phase10C0VS6ReadUniquePhysicalFile(session.root, scienceIdentity.path);
  const referenceBytes = phase10C0VS6ReadUniquePhysicalFile(session.root, referenceIdentity.path);
  const witnessPath = `${session.preflight.observed.candidateDirectory}/c0v-radial-witness.bin`;
  const summaryPath = `${session.preflight.observed.candidateDirectory}/c0v-radial-producer-summary.json`;
  const witnessBytes = phase10C0VS6ReadUniquePhysicalFile(session.root, witnessPath);
  const producerSummaryBytes = phase10C0VS6ReadUniquePhysicalFile(session.root, summaryPath);
  const witness = phase10C0VS6ArtifactIdentity(witnessPath, witnessBytes);
  phase10C0VS6SameIdentity(
    witness,
    phase10C0VS6ArtifactIdentity(witnessPath, production.witnessBytes),
    "radial worker reopened production witness",
  );
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(summaryPath, producerSummaryBytes),
    phase10C0VS6ArtifactIdentity(summaryPath, production.producerSummaryBytes),
    "radial worker reopened producer summary",
  );
  return phase10C0VRadialProduceCheckCaller({
    evaluationId: `phase10-${session.packet.packetId}-${session.packet.registeredAttemptId}-evaluation-v1`,
    packetProtocol: session.rawInput.packetProtocolIdentity,
    packetProtocolBytes: session.rawInput.packetProtocolBytes,
    scienceProtocol: scienceIdentity,
    scienceProtocolBytes: scienceBytes,
    referenceOrRefusal: referenceIdentity,
    referenceBytes,
    preflightBytes: session.rawInput.preflightBytes,
    witness,
    witnessBytes,
    producerSummary: production.producerSummary,
    producerSummaryBytes,
    lifecycle: lifecycleContext(session),
    observeNegativeControlBoundary(event): void {
      const childInvocationId = radialControlInvocationId(event.negativeControlId);
      const sequence = emitMessage(session, "boundary", childInvocationId, event);
      awaitAcknowledgement(session, childInvocationId, sequence);
    },
    observeNegativeControlProgress(event): void {
      emitMessage(session, "progress", radialControlInvocationId(event.negativeControlId), event);
    },
    observeNegativeControlArtifact(artifact): void {
      const childInvocationId = radialControlInvocationId(artifact.negativeControlId);
      const sequence = emitMessage(session, "artifact", childInvocationId, artifact);
      awaitAcknowledgement(session, childInvocationId, sequence);
    },
  });
}

function executeInvocation(
  session: WorkerSession,
  invocation: Phase10C0VS6HardCodedWorkerInvocation,
): unknown {
  const root = session.root.path;
  switch (invocation.invocationId) {
    case "inv-a-p-c0v-s6-nc-missing-producer": {
      const receipt = runPhase10C0VS6MissingProducerControl({ repositoryRoot: root });
      const bytes = phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(receipt));
      session.missingProducer = receipt;
      session.missingProducerBytes = bytes;
      return Object.freeze({ receipt, bytes });
    }
    case "inv-a-p-c0v-s6-nc-uncalled-check": {
      const receipt = runPhase10C0VS6UncalledCheckControl({ repositoryRoot: root });
      const bytes = phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(receipt));
      session.uncalledCheck = receipt;
      session.uncalledCheckBytes = bytes;
      return Object.freeze({ receipt, bytes });
    }
    case "inv-a-p-c0v-s6-producer": {
      if (session.missingProducerBytes === null || session.uncalledCheckBytes === null) {
        fail("A-P producer was invoked before both exact negative-control receipts");
      }
      const produced = producePhase10C0VS6ApArtifacts({
        repositoryRoot: root,
        negativeControlReceiptBytes: {
          missingProducer: session.missingProducerBytes,
          uncalledCheck: session.uncalledCheckBytes,
        },
      });
      session.apProduction = produced;
      return produced;
    }
    case "inv-a-p-c0v-s6-check-caller": {
      if (session.apProduction === null) fail("A-P check caller was invoked before its producer");
      return verifyPhase10C0VS6ApArtifacts({
        repositoryRoot: root,
        requireResolvedCallables: true,
        negativeControlReceiptBytes: {
          missingProducer: session.apProduction.bytes.missingProducer,
          uncalledCheck: session.apProduction.bytes.uncalledCheck,
        },
      });
    }
    case "inv-c0v-moving-cause":
      return phase10C0VMovingProduceCheckCaller(refusalInput(session));
    case "inv-c0v-static-cause":
      return phase10C0VStaticProduceCheckCaller(refusalInput(session));
    case "inv-c0v-radial-production": {
      const scienceIdentity = session.packet.bindings.scienceProtocol;
      const referenceIdentity = session.packet.bindings.referenceOrRefusal;
      if (scienceIdentity === null || referenceIdentity === null || session.packet.radialBinaryLayout === null) {
        fail("radial producer packet bindings are absent");
      }
      const scienceBytes = phase10C0VS6ReadUniquePhysicalFile(session.root, scienceIdentity.path);
      const science = phase10C0VRadialReferenceInput(parsePhase10C0VRadialProtocol(
        parsePhase10C0VS6PrettyJsonBytes(scienceBytes, "radial worker science protocol"),
      ));
      const produced = producePhase10C0VRadialWitness({
        layout: session.packet.radialBinaryLayout,
        science,
        packetProtocol: session.rawInput.packetProtocolIdentity,
        scienceProtocol: scienceIdentity,
        referenceOrRefusal: referenceIdentity,
        observeCaseBoundary(event): void {
          const sequence = emitMessage(session, "boundary", invocation.invocationId, event);
          awaitAcknowledgement(session, invocation.invocationId, sequence);
        },
      });
      session.radialProduction = produced;
      return produced;
    }
    case "inv-c0v-radial-evaluator": {
      const result = invokeRadialCampaign(session, invocation.invocationId);
      session.radialEvaluation = result;
      return result;
    }
    case "inv-c0v-radial-nc-finite-shell-term":
    case "inv-c0v-radial-nc-forged-summary":
    case "inv-c0v-radial-nc-robin-coefficient":
      fail("radial negative-control leaf is advanced only by the acknowledged evaluator campaign");
    case "inv-c0v-moving-publish-producer":
    case "inv-c0v-radial-publish-producer":
    case "inv-c0v-static-publish-producer": {
      const produced = invocation.invocationId === "inv-c0v-moving-publish-producer"
        ? producePhase10C0VMovingPublication(session.rawInput)
        : invocation.invocationId === "inv-c0v-radial-publish-producer"
          ? producePhase10C0VRadialPublication(session.rawInput)
          : producePhase10C0VStaticPublication(session.rawInput);
      session.publicationProduction = produced;
      return produced;
    }
    case "inv-c0v-moving-publish-check-caller":
    case "inv-c0v-radial-publish-check-caller":
    case "inv-c0v-static-publish-check-caller": {
      const produced = session.publicationProduction;
      if (produced === null) fail("publication check caller was invoked before its producer");
      const request = Object.freeze({
        ...session.rawInput,
        candidate: Object.freeze({
          resultBytes: produced.bytes.result,
          artifactIndexBytes: produced.bytes.artifactIndex,
        }),
      });
      return invocation.invocationId === "inv-c0v-moving-publish-check-caller"
        ? phase10C0VMovingPublishCheckCaller(request)
        : invocation.invocationId === "inv-c0v-radial-publish-check-caller"
          ? phase10C0VRadialPublishCheckCaller(request)
          : phase10C0VStaticPublishCheckCaller(request);
    }
    case "inv-c0v-aggregate-nc-any-layer-nonpass": {
      const control = phase10C0VAnyLayerNonpass(session.rawInput);
      session.aggregateControl = control;
      return control;
    }
    case "inv-c0v-aggregate-producer": {
      if (session.aggregateControl === null) fail("aggregate producer was invoked before its control");
      const produced = producePhase10C0VAggregate(session.rawInput);
      session.aggregateProduction = produced;
      return produced;
    }
    case "inv-c0v-aggregate-check-caller": {
      const produced = session.aggregateProduction;
      if (produced === null) fail("aggregate check caller was invoked before its producer");
      return phase10C0VAggregateCheckCaller(Object.freeze({
        ...session.rawInput,
        candidate: produced.bytes,
      }));
    }
  }
}

function openSession(args: Phase10C0VS6WorkerArguments): WorkerSession {
  const root = phase10C0VS6PhysicalRepositoryRoot(args.repositoryRoot);
  const packetProtocolBytes = phase10C0VS6ReadUniquePhysicalFile(root, args.protocolPath);
  const packetProtocolIdentity = phase10C0VS6ArtifactIdentity(args.protocolPath, packetProtocolBytes);
  const packet = parsePhase10C0VS6PacketProtocol(
    parsePhase10C0VS6PrettyJsonBytes(packetProtocolBytes, "worker packet protocol"),
  );
  if (packet.packetId !== args.packetId || packet.registeredAttemptId !== args.attemptId) {
    fail("worker live packet protocol differs from exact internal arguments");
  }
  const preflightBytes = phase10C0VS6ReadUniquePhysicalFile(root, packet.paths.preflightReceiptPath);
  const rawInput: Phase10C0VS6RawRuntimeAuthorityInput = Object.freeze({
    repositoryRoot: root.path,
    packetProtocolIdentity,
    packetProtocolBytes,
    preflightBytes,
  });
  const authority = derivePhase10C0VS6RetainedRuntimeAuthority(rawInput);
  if (authority.preflight.verdict !== "pass" || authority.preflight.refusalCandidate !== null) {
    fail("worker may start only after an exact passing preflight");
  }
  return {
    args,
    root,
    packet,
    preflight: authority.preflight,
    rawInput,
    roster: phase10C0VS6CompiledWorkerInvocationRoster(packet),
    reader: new SynchronousLineReader(),
    inputSequence: 0,
    outputSequence: 0,
    invocationIndex: 0,
    missingProducer: null,
    missingProducerBytes: null,
    uncalledCheck: null,
    uncalledCheckBytes: null,
    apProduction: null,
    radialProduction: null,
    radialEvaluation: null,
    publicationProduction: null,
    aggregateControl: null,
    aggregateProduction: null,
  };
}

/**
 * Hard-coded one-child dispatcher. JSON supplies no command, module, export, or callable path:
 * each exact invocation ID reaches one statically imported function through the switch above.
 * The worker never writes repository artifacts; it emits bounded structured values for the parent
 * to time, validate, and persist under the registered append-only policy.
 */
export function phase10C0VS6ExecutorWorker(argv: readonly string[]): void {
  phase10C0VS6AssertExactRuntimeLoaderState();
  phase10C0VS6AssertExactWorkerEnvironment();
  const args = phase10C0VS6ParseWorkerArguments(argv);
  const session = openSession(args);
  emitMessage(session, "ready", null);
  try {
    while (true) {
      const command = readCommand(session);
      if (command.kind === "stop") {
        if (session.invocationIndex !== session.roster.length) {
          fail("parent stopped the worker before the exact full invocation roster completed");
        }
        emitMessage(session, "stopped", null);
        return;
      }
      if (command.kind !== "invoke") fail("acknowledgement is valid only at a requested worker boundary");
      const invocation = session.roster[session.invocationIndex];
      if (invocation === undefined || command.invocationId !== invocation.invocationId) {
        fail("parent invocation differs from the exact next compiled worker leaf");
      }
      const value = executeInvocation(session, invocation);
      // The radial evaluator executes the three acknowledged child leaves inside its one wrapper.
      // Advance across those exact child IDs after the wrapper returns; the parent has already
      // timed and acknowledged every boundary individually.
      session.invocationIndex += invocation.invocationId === "inv-c0v-radial-evaluator" ? 4 : 1;
      emitMessage(session, "result", invocation.invocationId, value);
    }
  } catch (error) {
    emitMessage(
      session,
      "error",
      session.roster[session.invocationIndex]?.invocationId ?? null,
      Object.freeze({ message: error instanceof Error ? error.message : String(error) }),
    );
    throw error;
  }
}

function main(): void {
  try {
    phase10C0VS6ExecutorWorker(processArguments.slice(2));
  } catch (error) {
    const message = `${error instanceof Error ? error.message : "Phase 10 C0V S6 executor worker failed"}\n`;
    const bytes = new TextEncoder().encode(message);
    writeSync(2, bytes, 0, bytes.byteLength);
    exitProcess(1);
  }
}

if (processArguments[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(processArguments[1])).href) main();
