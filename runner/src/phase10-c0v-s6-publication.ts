import { strictJsonSnapshot } from "./gate4-evidence.ts";
import {
  parsePhase10C0VReferenceEnvelope,
  parsePhase10C0VReferenceRefusal,
} from "./phase10-c0v-contracts.ts";
import {
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  type Phase10C0VS6PacketProtocol,
} from "./phase10-c0v-s6-contracts.ts";
import {
  parsePhase10C0VS6AttemptLedgerV2,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6ParsePrettyJson,
  phase10C0VS6PrettyJsonBytes,
  phase10C0VS6SameIdentity,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6AttemptRowV2,
  type Phase10C0VS6RadialResultV2,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6PhysicalRepositoryRoot,
  phase10C0VS6ReadUniquePhysicalFile,
  type Phase10C0VS6PhysicalRoot,
} from "./phase10-c0v-s6-filesystem.ts";
import {
  type Phase10C0VS6RawRuntimeAuthorityInput,
} from "./phase10-c0v-s6-runtime-authority.ts";
import { phase10C0VS6ReopenPublishedDependencies } from "./phase10-c0v-s6-dependencies.ts";

export type Phase10C0VPublishPacketId =
  | "c0v-moving-publish"
  | "c0v-radial-publish"
  | "c0v-static-publish";

export interface Phase10C0VLayerArtifactIndexEntry {
  readonly artifactId: string;
  readonly path: string;
  readonly mediaType: "application/json" | "application/x-ndjson" | "application/octet-stream";
  readonly byteLength: number;
  readonly sha256: string;
  readonly role: string;
  readonly producedBy: string;
}

export interface Phase10C0VLayerArtifactIndex {
  readonly schema: "phase10-artifact-index-v1";
  readonly bundleId: "phase10-numerical-verification-v1";
  readonly artifacts: readonly Phase10C0VLayerArtifactIndexEntry[];
}

export interface Phase10C0VLayerResultV1 {
  readonly schema: "phase10-c0v-moving-result-v1" | "phase10-c0v-static-result-v1";
  readonly resultId: "c0v-moving-result-v1" | "c0v-static-result-v1";
  readonly layerId: "C0V-MOVING-EVENT" | "C0V-STATIC";
  readonly branch: "independent-reference" | "reference-refusal";
  readonly protocol: Phase10C0VS6ArtifactIdentity;
  readonly referenceOrRefusal: Phase10C0VS6ArtifactIdentity;
  readonly attemptLedger: Phase10C0VS6ArtifactIdentity;
  readonly witness: null;
  readonly evaluation: null;
  readonly terminalStatus: "refusal";
  readonly scientificDisposition: "refusal";
  readonly negativeControlDisposition: "not-run-no-credit";
  readonly resourceDisposition: "within-cap";
  readonly claimBoundary: {
    readonly allowed: readonly string[];
    readonly forbidden: readonly string[];
  };
}

export type Phase10C0VPublishedLayerResult = Phase10C0VLayerResultV1 | Phase10C0VS6RadialResultV2;

export interface Phase10C0VPublicationProduceResult {
  readonly packetId: Phase10C0VPublishPacketId;
  readonly result: Phase10C0VPublishedLayerResult;
  readonly artifactIndex: Phase10C0VLayerArtifactIndex;
  readonly bytes: {
    readonly result: Uint8Array;
    readonly artifactIndex: Uint8Array;
  };
}

interface LayerConfiguration {
  readonly packetId: Phase10C0VPublishPacketId;
  readonly producePacketId: "c0v-moving-produce" | "c0v-radial-produce" | "c0v-static-produce";
  readonly layerId: "C0V-MOVING-EVENT" | "C0V-RADIAL" | "C0V-STATIC";
  readonly ledgerPath: string;
  readonly resultPath: string;
  readonly artifactIndexPath: string;
  readonly resultOutputId: string;
  readonly scienceProtocolOutputId: string;
  readonly scienceProtocolProducedBy: string;
  readonly referenceOutputId: string;
  readonly referenceProducedBy: string;
  readonly attemptLedgerOutputId: string;
  readonly attemptLedgerProducedBy: string;
  readonly publishProducerCallableId: string;
}

interface PublicationSource {
  readonly artifactId: string;
  readonly path: string;
  readonly bytes: Uint8Array;
  readonly role: string;
  readonly producedBy: string;
}

interface ProducerInputs {
  readonly root: Phase10C0VS6PhysicalRoot;
  readonly packet: Phase10C0VS6PacketProtocol;
  readonly producePacket: Phase10C0VS6PacketProtocol;
  readonly config: LayerConfiguration;
  readonly attempt: Phase10C0VS6AttemptRowV2;
  readonly ledgerBytes: Uint8Array;
  readonly ledgerIdentity: Phase10C0VS6ArtifactIdentity;
  readonly scienceProtocolBytes: Uint8Array;
  readonly referenceBytes: Uint8Array;
  readonly witnessBytes: Uint8Array | null;
  readonly evaluationBytes: Uint8Array | null;
}

const CONFIGS: Readonly<Record<Phase10C0VPublishPacketId, LayerConfiguration>> = Object.freeze({
  "c0v-moving-publish": Object.freeze({
    packetId: "c0v-moving-publish",
    producePacketId: "c0v-moving-produce",
    layerId: "C0V-MOVING-EVENT",
    ledgerPath: "evidence/phase10-numerical-verification-v1/c0v-moving-attempts.jsonl",
    resultPath: "evidence/phase10-numerical-verification-v1/c0v-moving-result.json",
    artifactIndexPath: "evidence/phase10-numerical-verification-v1/c0v-moving-artifact-index.json",
    resultOutputId: "out-c0v-moving-result",
    scienceProtocolOutputId: "out-c0v-moving-protocol",
    scienceProtocolProducedBy: "phase10-c0v-moving-protocol-producer",
    referenceOutputId: "out-c0v-moving-reference",
    referenceProducedBy: "phase10-c0v-moving-reference-producer",
    attemptLedgerOutputId: "out-c0v-moving-attempt-ledger",
    attemptLedgerProducedBy: "phase10-c0v-moving-attempt-receipt-writer",
    publishProducerCallableId: "phase10-c0v-moving-publish-producer",
  }),
  "c0v-radial-publish": Object.freeze({
    packetId: "c0v-radial-publish",
    producePacketId: "c0v-radial-produce",
    layerId: "C0V-RADIAL",
    ledgerPath: "evidence/phase10-numerical-verification-v1/c0v-radial-attempts.jsonl",
    resultPath: "evidence/phase10-numerical-verification-v1/c0v-radial-result.json",
    artifactIndexPath: "evidence/phase10-numerical-verification-v1/c0v-radial-artifact-index.json",
    resultOutputId: "out-c0v-radial-result",
    scienceProtocolOutputId: "out-c0v-radial-protocol",
    scienceProtocolProducedBy: "phase10-c0v-radial-protocol-producer",
    referenceOutputId: "out-c0v-radial-reference",
    referenceProducedBy: "phase10-c0v-radial-reference-producer",
    attemptLedgerOutputId: "out-c0v-radial-attempt-ledger",
    attemptLedgerProducedBy: "phase10-c0v-radial-attempt-receipt-writer",
    publishProducerCallableId: "phase10-c0v-radial-publish-producer",
  }),
  "c0v-static-publish": Object.freeze({
    packetId: "c0v-static-publish",
    producePacketId: "c0v-static-produce",
    layerId: "C0V-STATIC",
    ledgerPath: "evidence/phase10-numerical-verification-v1/c0v-static-attempts.jsonl",
    resultPath: "evidence/phase10-numerical-verification-v1/c0v-static-result.json",
    artifactIndexPath: "evidence/phase10-numerical-verification-v1/c0v-static-artifact-index.json",
    resultOutputId: "out-c0v-static-result",
    scienceProtocolOutputId: "out-c0v-static-protocol",
    scienceProtocolProducedBy: "phase10-c0v-static-protocol-producer",
    referenceOutputId: "out-c0v-static-reference-refusal",
    referenceProducedBy: "phase10-c0v-static-refusal-receipt-writer",
    attemptLedgerOutputId: "out-c0v-static-attempt-ledger",
    attemptLedgerProducedBy: "phase10-c0v-static-attempt-receipt-writer",
    publishProducerCallableId: "phase10-c0v-static-publish-producer",
  }),
});

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 publication producer refused: ${message}`);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function mediaType(path: string): Phase10C0VLayerArtifactIndexEntry["mediaType"] {
  return path.endsWith(".jsonl")
    ? "application/x-ndjson"
    : path.endsWith(".bin")
      ? "application/octet-stream"
      : "application/json";
}

function readBound(
  root: Phase10C0VS6PhysicalRoot,
  identity: Phase10C0VS6ArtifactIdentity,
  label: string,
): Uint8Array {
  const bytes = phase10C0VS6ReadUniquePhysicalFile(root, identity.path);
  phase10C0VS6SameIdentity(phase10C0VS6ArtifactIdentity(identity.path, bytes), identity, label);
  return bytes;
}

function dependencyIdentity(
  packet: Phase10C0VS6PacketProtocol,
  observed: readonly Phase10C0VS6ArtifactIdentity[],
  path: string,
  schemaId: string,
): Phase10C0VS6ArtifactIdentity {
  if (packet.dependencyArtifactContracts.filter((entry) =>
    entry.artifactPath === path && entry.schemaId === schemaId).length !== 1) {
    fail(`${path} lacks one exact dependency contract`);
  }
  const matches = observed.filter((entry) => entry.path === path);
  if (matches.length !== 1) fail(`${path} lacks one retained dependency identity`);
  return matches[0]!;
}

function producerInputs(
  packetId: Phase10C0VPublishPacketId,
  request: Phase10C0VS6RawRuntimeAuthorityInput,
): ProducerInputs {
  // Candidate assembly is intentionally structural. The registered publication check caller
  // independently rederives the produce terminal/verification chain before any packet credit.
  const reopenedDependencies = phase10C0VS6ReopenPublishedDependencies(request);
  const retained = Object.freeze({
    packet: reopenedDependencies.packet,
    preflight: reopenedDependencies.preflight,
  });
  if (retained.packet.packetId !== packetId || retained.packet.executionMode !== "layer-publish" ||
    retained.preflight.verdict !== "pass" || retained.preflight.refusalCandidate !== null) {
    fail(`${packetId} requires its exact passing raw packet/preflight authority`);
  }
  const root = phase10C0VS6PhysicalRepositoryRoot(request.repositoryRoot);
  const config = CONFIGS[packetId];
  const producePath =
    `research/phase10-execution-v2/recovery-v1/packets/${config.producePacketId}/protocol.json`;
  const producePacket = parsePhase10C0VS6PacketProtocol(parsePhase10C0VS6PrettyJsonBytes(
    phase10C0VS6ReadUniquePhysicalFile(root, producePath),
    `${config.producePacketId} protocol`,
  ));
  if (producePacket.packetId !== config.producePacketId) fail("produce packet protocol identity differs");
  const ledgerExpected = dependencyIdentity(
    retained.packet,
    retained.preflight.observed.dependencyArtifacts,
    config.ledgerPath,
    "phase10-c0v-attempt-ledger-v2",
  );
  const ledgerBytes = readBound(root, ledgerExpected, "attempt ledger dependency");
  const attempts = parsePhase10C0VS6AttemptLedgerV2(ledgerBytes, `${config.layerId} attempt ledger`);
  if (attempts.length !== 1) fail(`${config.layerId} v1 execution requires exactly one row`);
  const attempt = attempts[0]!;
  if (attempt.layerId !== config.layerId || retained.packet.bindings.scienceProtocol === null ||
    retained.packet.bindings.referenceOrRefusal === null || producePacket.bindings.scienceProtocol === null ||
    producePacket.bindings.referenceOrRefusal === null) fail("layer or science/reference authority differs");
  for (const [actual, expected, label] of [
    [attempt.protocol, retained.packet.bindings.scienceProtocol, "publish science protocol"],
    [attempt.referenceOrRefusal, retained.packet.bindings.referenceOrRefusal, "publish reference/refusal"],
    [attempt.protocol, producePacket.bindings.scienceProtocol, "produce science protocol"],
    [attempt.referenceOrRefusal, producePacket.bindings.referenceOrRefusal, "produce reference/refusal"],
  ] as const) phase10C0VS6SameIdentity(actual, expected, label);
  const scienceProtocolBytes = readBound(root, attempt.protocol, "live science protocol");
  const referenceBytes = readBound(root, attempt.referenceOrRefusal, "live reference/refusal");
  let witnessBytes: Uint8Array | null = null;
  let evaluationBytes: Uint8Array | null = null;
  if (packetId === "c0v-moving-publish") {
    const reference = parsePhase10C0VReferenceEnvelope(phase10C0VS6ParsePrettyJson(referenceBytes, "moving reference"));
    if (reference.disposition !== "reference-discrepancy-refusal" || attempt.branch !== "independent-reference" ||
      attempt.dispositionCode !== "reference-discrepancy-refusal" || attempt.terminalStatus !== "refusal") {
      fail("moving attempt/reference does not select the frozen discrepancy refusal");
    }
    phase10C0VS6SameIdentity(reference.protocol, attempt.protocol, "moving reference protocol");
  } else if (packetId === "c0v-static-publish") {
    const refusal = parsePhase10C0VReferenceRefusal(phase10C0VS6ParsePrettyJson(referenceBytes, "static refusal"));
    if (attempt.branch !== "reference-refusal" || attempt.dispositionCode !== "preimplementation-reference-refusal" ||
      attempt.terminalStatus !== "refusal") fail("static attempt does not select the frozen reference refusal");
    phase10C0VS6SameIdentity(refusal.protocol, attempt.protocol, "static refusal protocol");
  } else if (attempt.dispositionCode === "production-complete") {
    const witnessExpected = dependencyIdentity(
      retained.packet,
      retained.preflight.observed.dependencyArtifacts,
      "evidence/phase10-numerical-verification-v1/c0v-radial-witness.bin",
      "phase10-c0v-radial-witness-v1",
    );
    const evaluationExpected = dependencyIdentity(
      retained.packet,
      retained.preflight.observed.dependencyArtifacts,
      "evidence/phase10-numerical-verification-v1/c0v-radial-evaluation.json",
      "phase10-c0v-radial-evaluation-v1",
    );
    witnessBytes = readBound(root, witnessExpected, "radial witness dependency");
    evaluationBytes = readBound(root, evaluationExpected, "radial evaluation dependency");
    const terminalArtifacts = attempt.resourceRecord.observations.at(-1)?.artifacts ?? [];
    const attemptWitnesses = terminalArtifacts.filter((entry) =>
      entry.path.endsWith("/candidate/c0v-radial-witness.bin") &&
      entry.byteLength === witnessExpected.byteLength && entry.sha256 === witnessExpected.sha256);
    const attemptEvaluations = terminalArtifacts.filter((entry) =>
      entry.path.endsWith("/candidate/c0v-radial-evaluation.json") &&
      entry.byteLength === evaluationExpected.byteLength && entry.sha256 === evaluationExpected.sha256);
    if (attemptWitnesses.length !== 1 || attemptEvaluations.length !== 1) {
      fail("radial published witness/evaluation bytes differ from the selected attempt content identities");
    }
  } else if (!["preproduction-artifact-refusal", "prelaunch-resource-refusal", "registered-cap-resource-refusal"]
    .includes(attempt.dispositionCode) || attempt.terminalStatus !== "refusal" ||
    attempt.classificationValidation?.verdict !== "pass") {
    fail("radial refusal attempt is not independently classified");
  }
  return Object.freeze({
    root,
    packet: retained.packet,
    producePacket,
    config,
    attempt,
    ledgerBytes,
    ledgerIdentity: phase10C0VS6ArtifactIdentity(config.ledgerPath, ledgerBytes),
    scienceProtocolBytes,
    referenceBytes,
    witnessBytes,
    evaluationBytes,
  });
}

function result(inputs: ProducerInputs): Phase10C0VPublishedLayerResult {
  const { attempt, packet } = inputs;
  if (packet.packetId !== "c0v-radial-publish") {
    return Object.freeze({
      schema: packet.packetId === "c0v-moving-publish"
        ? "phase10-c0v-moving-result-v1"
        : "phase10-c0v-static-result-v1",
      resultId: packet.packetId === "c0v-moving-publish" ? "c0v-moving-result-v1" : "c0v-static-result-v1",
      layerId: attempt.layerId as "C0V-MOVING-EVENT" | "C0V-STATIC",
      branch: attempt.branch,
      protocol: attempt.protocol,
      referenceOrRefusal: attempt.referenceOrRefusal,
      attemptLedger: inputs.ledgerIdentity,
      witness: null,
      evaluation: null,
      terminalStatus: "refusal",
      scientificDisposition: "refusal",
      negativeControlDisposition: "not-run-no-credit",
      resourceDisposition: "within-cap",
      claimBoundary: packet.claimBoundary,
    } as Phase10C0VLayerResultV1);
  }
  const complete = attempt.dispositionCode === "production-complete";
  return Object.freeze({
    schema: "phase10-c0v-radial-result-v2",
    resultId: "c0v-radial-result-v2",
    layerId: "C0V-RADIAL",
    branch: "independent-reference",
    protocol: attempt.protocol,
    referenceOrRefusal: attempt.referenceOrRefusal,
    attemptLedger: inputs.ledgerIdentity,
    selectedAttemptId: attempt.attemptId,
    attemptDispositionCode: attempt.dispositionCode,
    witness: complete && inputs.witnessBytes !== null
      ? phase10C0VS6ArtifactIdentity("evidence/phase10-numerical-verification-v1/c0v-radial-witness.bin", inputs.witnessBytes)
      : null,
    evaluation: complete && inputs.evaluationBytes !== null
      ? phase10C0VS6ArtifactIdentity("evidence/phase10-numerical-verification-v1/c0v-radial-evaluation.json", inputs.evaluationBytes)
      : null,
    terminalStatus: attempt.terminalStatus,
    scientificDisposition: attempt.terminalStatus,
    negativeControlDisposition: complete ? "pass" : "not-accepted-no-credit",
    resourceDisposition: complete
      ? "within-cap"
      : attempt.dispositionCode === "preproduction-artifact-refusal"
        ? "artifact-refusal"
        : attempt.dispositionCode,
    claimBoundary: packet.claimBoundary,
  } as Phase10C0VS6RadialResultV2);
}

function indexEntry(source: PublicationSource): Phase10C0VLayerArtifactIndexEntry {
  const identity = phase10C0VS6ArtifactIdentity(source.path, source.bytes);
  return Object.freeze({
    artifactId: source.artifactId,
    path: identity.path,
    mediaType: mediaType(identity.path),
    byteLength: identity.byteLength,
    sha256: identity.sha256,
    role: source.role,
    producedBy: source.producedBy,
  });
}

function artifactIndex(inputs: ProducerInputs, resultBytes: Uint8Array): Phase10C0VLayerArtifactIndex {
  const sources: PublicationSource[] = [
    {
      artifactId: inputs.config.scienceProtocolOutputId,
      path: inputs.attempt.protocol.path,
      bytes: inputs.scienceProtocolBytes,
      role: "science-protocol",
      producedBy: inputs.config.scienceProtocolProducedBy,
    },
    {
      artifactId: inputs.config.referenceOutputId,
      path: inputs.attempt.referenceOrRefusal.path,
      bytes: inputs.referenceBytes,
      role: inputs.config.layerId === "C0V-STATIC" ? "reference-refusal" : "independent-reference",
      producedBy: inputs.config.referenceProducedBy,
    },
    {
      artifactId: inputs.config.attemptLedgerOutputId,
      path: inputs.config.ledgerPath,
      bytes: inputs.ledgerBytes,
      role: "attempt-ledger",
      producedBy: inputs.config.attemptLedgerProducedBy,
    },
    {
      artifactId: inputs.config.resultOutputId,
      path: inputs.config.resultPath,
      bytes: resultBytes,
      role: "layer-result",
      producedBy: inputs.config.publishProducerCallableId,
    },
  ];
  if (inputs.witnessBytes !== null) sources.push({
    artifactId: "out-c0v-radial-witness",
    path: "evidence/phase10-numerical-verification-v1/c0v-radial-witness.bin",
    bytes: inputs.witnessBytes,
    role: "production-witness",
    producedBy: "phase10-c0v-radial-production-producer",
  });
  if (inputs.evaluationBytes !== null) sources.push({
    artifactId: "out-c0v-radial-evaluation",
    path: "evidence/phase10-numerical-verification-v1/c0v-radial-evaluation.json",
    bytes: inputs.evaluationBytes,
    role: "independent-evaluation",
    producedBy: "phase10-c0v-radial-evaluation-receipt-writer",
  });
  return Object.freeze({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-numerical-verification-v1",
    artifacts: Object.freeze(sources.map(indexEntry).sort((left, right) =>
      compareText(left.artifactId, right.artifactId))),
  });
}

function produce(
  packetId: Phase10C0VPublishPacketId,
  request: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VPublicationProduceResult {
  const inputs = producerInputs(packetId, request);
  const layerResult = result(inputs);
  const resultBytes = phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(layerResult));
  const layerIndex = artifactIndex(inputs, resultBytes);
  const artifactIndexBytes = phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(layerIndex));
  return Object.freeze({
    packetId,
    result: layerResult,
    artifactIndex: layerIndex,
    bytes: Object.freeze({ result: resultBytes, artifactIndex: artifactIndexBytes }),
  });
}

export function producePhase10C0VMovingPublication(
  request: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VPublicationProduceResult {
  return produce("c0v-moving-publish", request);
}

export function producePhase10C0VRadialPublication(
  request: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VPublicationProduceResult {
  return produce("c0v-radial-publish", request);
}

export function producePhase10C0VStaticPublication(
  request: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VPublicationProduceResult {
  return produce("c0v-static-publish", request);
}
