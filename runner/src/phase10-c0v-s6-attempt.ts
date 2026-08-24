import {
  parsePhase10C0VS6ArtifactIdentity,
  parsePhase10C0VS6AttemptRowV2,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6AttemptLedgerBytes,
  phase10C0VS6SameIdentity,
  phase10C0VS6ValidateRegisteredExecutableInvocationRoster,
  phase10C0VS6ValidateRegisteredExecutionRecordTuple,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6AttemptRowV2,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  type Phase10C0VS6PacketProtocol,
} from "./phase10-c0v-s6-contracts.ts";
import {
  parsePhase10C0VMovingProtocol,
  parsePhase10C0VRadialProtocol,
  parsePhase10C0VReferenceEnvelope,
  parsePhase10C0VReferenceRefusal,
  parsePhase10C0VStaticProtocol,
} from "./phase10-c0v-contracts.ts";

export interface Phase10C0VS6ReopenedArtifact<T> {
  readonly identity: Phase10C0VS6ArtifactIdentity;
  readonly value: T;
  readonly bytes: Uint8Array;
}

export interface Phase10C0VS6AttemptReceiptInput {
  readonly packetProtocolBytes: Uint8Array;
  readonly packetProtocolIdentity: Phase10C0VS6ArtifactIdentity;
  readonly attempt: Phase10C0VS6AttemptRowV2;
}

export interface Phase10C0VS6AttemptReceipt {
  readonly attempt: Phase10C0VS6AttemptRowV2;
  readonly bytes: Uint8Array;
  readonly identity: Phase10C0VS6ArtifactIdentity;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 attempt writer refused: ${message}`);
}

function reopenJson<T>(
  bytes: Uint8Array,
  expected: Phase10C0VS6ArtifactIdentity,
  label: string,
  parse: (value: unknown) => T,
): Phase10C0VS6ReopenedArtifact<T> {
  const actual = phase10C0VS6ArtifactIdentity(expected.path, bytes);
  phase10C0VS6SameIdentity(actual, expected, label);
  const value = parse(parsePhase10C0VS6PrettyJsonBytes(bytes, label));
  return Object.freeze({ identity: actual, value, bytes: new Uint8Array(bytes) });
}

function packetAuthority(
  bytes: Uint8Array,
  identity: Phase10C0VS6ArtifactIdentity,
): Phase10C0VS6PacketProtocol {
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(identity.path, bytes),
    identity,
    "packet protocol bytes",
  );
  const packet = parsePhase10C0VS6PacketProtocol(
    parsePhase10C0VS6PrettyJsonBytes(bytes, "attempt packet protocol"),
  );
  if (packet.bindings.callableRegistry.path !==
    `${PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT}/packets/${packet.packetId}/callable-registry.json`) {
    fail("packet registry path is not the exact packet-local authority");
  }
  return packet;
}

function writeAttempt(
  input: Phase10C0VS6AttemptReceiptInput,
  packetId: "c0v-moving-produce" | "c0v-radial-produce" | "c0v-static-produce",
  layerId: "C0V-MOVING-EVENT" | "C0V-RADIAL" | "C0V-STATIC",
): Phase10C0VS6AttemptReceipt {
  const packet = packetAuthority(input.packetProtocolBytes, input.packetProtocolIdentity);
  const attempt = parsePhase10C0VS6AttemptRowV2(input.attempt, `${packetId} attempt candidate`);
  if (packet.packetId !== packetId || attempt.layerId !== layerId ||
    attempt.attemptId !== packet.registeredAttemptId ||
    attempt.command !== packet.commandTemplates.find((entry) =>
      entry.commandId === packet.preflightObservedContract.commandTemplateId)?.command ||
    attempt.preflight.path !== packet.paths.preflightReceiptPath) {
    fail(`${packetId} attempt identity, command, or retained preflight differs from protocol`);
  }
  const tuple = phase10C0VS6ValidateRegisteredExecutionRecordTuple(
    attempt,
    packet.executionRecordTuples,
  );
  phase10C0VS6ValidateRegisteredExecutableInvocationRoster(
    attempt,
    tuple,
    packet.executableInvocationRosters,
  );
  const filenameRoster = packet.candidateFilenameRosters[tuple.tupleId];
  if (filenameRoster === undefined || !filenameRoster.some((entry) => entry.endsWith("-attempts.jsonl"))) {
    fail(`${packetId} tuple has no exact attempt-ledger publication candidate`);
  }
  const bytes = phase10C0VS6AttemptLedgerBytes([attempt]);
  const publicationPath = packet.paths.allowedPublicationPaths.find((path) => path.endsWith("-attempts.jsonl"));
  if (publicationPath === undefined) fail(`${packetId} has no registered attempt-ledger publication path`);
  return Object.freeze({
    attempt,
    bytes,
    identity: phase10C0VS6ArtifactIdentity(publicationPath, bytes),
  });
}

export function reopenPhase10C0VMovingProtocol(
  bytes: Uint8Array,
  expected: Phase10C0VS6ArtifactIdentity,
): Phase10C0VS6ReopenedArtifact<ReturnType<typeof parsePhase10C0VMovingProtocol>> {
  return reopenJson(bytes, expected, "moving science protocol", parsePhase10C0VMovingProtocol);
}

export function reopenPhase10C0VRadialProtocol(
  bytes: Uint8Array,
  expected: Phase10C0VS6ArtifactIdentity,
): Phase10C0VS6ReopenedArtifact<ReturnType<typeof parsePhase10C0VRadialProtocol>> {
  return reopenJson(bytes, expected, "radial science protocol", parsePhase10C0VRadialProtocol);
}

export function reopenPhase10C0VStaticProtocol(
  bytes: Uint8Array,
  expected: Phase10C0VS6ArtifactIdentity,
): Phase10C0VS6ReopenedArtifact<ReturnType<typeof parsePhase10C0VStaticProtocol>> {
  return reopenJson(bytes, expected, "static science protocol", parsePhase10C0VStaticProtocol);
}

export function reopenPhase10C0VMovingReference(
  bytes: Uint8Array,
  expected: Phase10C0VS6ArtifactIdentity,
): Phase10C0VS6ReopenedArtifact<ReturnType<typeof parsePhase10C0VReferenceEnvelope>> {
  return reopenJson(bytes, expected, "moving reference", parsePhase10C0VReferenceEnvelope);
}

export function reopenPhase10C0VRadialReference(
  bytes: Uint8Array,
  expected: Phase10C0VS6ArtifactIdentity,
): Phase10C0VS6ReopenedArtifact<ReturnType<typeof parsePhase10C0VReferenceEnvelope>> {
  return reopenJson(bytes, expected, "radial reference", parsePhase10C0VReferenceEnvelope);
}

export function reopenPhase10C0VStaticReferenceRefusal(
  bytes: Uint8Array,
  expected: Phase10C0VS6ArtifactIdentity,
): Phase10C0VS6ReopenedArtifact<ReturnType<typeof parsePhase10C0VReferenceRefusal>> {
  return reopenJson(bytes, expected, "static reference refusal", parsePhase10C0VReferenceRefusal);
}

export function writePhase10C0VMovingAttemptReceipt(
  input: Phase10C0VS6AttemptReceiptInput,
): Phase10C0VS6AttemptReceipt {
  return writeAttempt(input, "c0v-moving-produce", "C0V-MOVING-EVENT");
}

export function writePhase10C0VRadialAttemptReceipt(
  input: Phase10C0VS6AttemptReceiptInput,
): Phase10C0VS6AttemptReceipt {
  return writeAttempt(input, "c0v-radial-produce", "C0V-RADIAL");
}

export function writePhase10C0VStaticAttemptReceipt(
  input: Phase10C0VS6AttemptReceiptInput,
): Phase10C0VS6AttemptReceipt {
  return writeAttempt(input, "c0v-static-produce", "C0V-STATIC");
}

/** Strict helper used by tests and publication code for an embedded identity value. */
export function parsePhase10C0VS6AttemptArtifactIdentity(value: unknown): Phase10C0VS6ArtifactIdentity {
  return parsePhase10C0VS6ArtifactIdentity(value, "attempt artifact identity");
}
