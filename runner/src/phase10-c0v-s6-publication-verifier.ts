import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  parsePhase10C0VReferenceEnvelope,
  parsePhase10C0VReferenceRefusal,
} from "./phase10-c0v-contracts.ts";
import {
  type Phase10C0VS6PacketProtocol,
} from "./phase10-c0v-s6-contracts.ts";
import {
  parsePhase10C0VS6ArtifactIdentity,
  parsePhase10C0VS6RadialResultV2,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6ExactOrderedKeys,
  phase10C0VS6Object,
  phase10C0VS6ParsePrettyJson,
  phase10C0VS6PrettyJsonBytes,
  phase10C0VS6SafeToken,
  phase10C0VS6SameIdentity,
  phase10C0VS6SameJson,
  phase10C0VS6SortedUniqueStrings,
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
  parsePhase10C0VS6RadialEvaluationBytes,
  type Phase10C0VS6ParsedRadialEvaluationReceipt,
} from "./phase10-c0v-s6-receipts.ts";
import {
  type Phase10C0VS6RawRuntimeAuthorityInput,
} from "./phase10-c0v-s6-runtime-authority.ts";
import {
  independentlyReopenPhase10C0VS6VerifiedPublishedDependencies,
} from "./phase10-c0v-s6-published-prefix.ts";
import {
  independentlyEvaluatePhase10C0VMovingPublicationSemantic,
} from "./phase10-c0v-s6-publication-semantic.ts";

export type Phase10C0VPublishPacketId =
  | "c0v-moving-publish"
  | "c0v-radial-publish"
  | "c0v-static-publish";

export type Phase10C0VPublishCheckId =
  | "chk-c0v-moving-artifact-graph"
  | "chk-c0v-moving-terminal-disposition"
  | "chk-c0v-moving-verdict-rederived"
  | "chk-c0v-radial-artifact-graph"
  | "chk-c0v-radial-terminal-disposition"
  | "chk-c0v-radial-verdict-rederived"
  | "chk-c0v-static-artifact-graph"
  | "chk-c0v-static-terminal-disposition"
  | "chk-c0v-static-verdict-rederived";

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

export interface Phase10C0VPublicationCandidateBytes {
  readonly resultBytes: Uint8Array;
  readonly artifactIndexBytes: Uint8Array;
}

export interface Phase10C0VPublicationVerificationRequest extends Phase10C0VS6RawRuntimeAuthorityInput {
  readonly candidate: Phase10C0VPublicationCandidateBytes;
}

export interface Phase10C0VPublicationCheckResult {
  readonly checkId: Phase10C0VPublishCheckId;
  readonly verdict: "pass";
  readonly reasons: readonly [];
  readonly witnessOutputIds: readonly string[];
}

export interface Phase10C0VPublicationEvaluation {
  readonly schema: "phase10-c0v-publication-evaluation-v1";
  readonly packetId: Phase10C0VPublishPacketId;
  readonly evaluatorCallableId:
    | "phase10-c0v-moving-publication-verifier"
    | "phase10-c0v-radial-publication-verifier"
    | "phase10-c0v-static-publication-verifier";
  readonly selectedAttempt: Phase10C0VS6AttemptRowV2;
  readonly result: Phase10C0VPublishedLayerResult;
  readonly artifactIndex: Phase10C0VLayerArtifactIndex;
  readonly resultIdentity: Phase10C0VS6ArtifactIdentity;
  readonly artifactIndexIdentity: Phase10C0VS6ArtifactIdentity;
  readonly checkResults: readonly Phase10C0VPublicationCheckResult[];
  readonly aggregateVerdict: "pass";
}

interface LayerConfiguration {
  readonly packetId: Phase10C0VPublishPacketId;
  readonly producePacketId: "c0v-moving-produce" | "c0v-radial-produce" | "c0v-static-produce";
  readonly layerId: "C0V-MOVING-EVENT" | "C0V-RADIAL" | "C0V-STATIC";
  readonly ledgerPath: string;
  readonly resultPath: string;
  readonly artifactIndexPath: string;
  readonly resultOutputId: string;
  readonly artifactIndexOutputId: string;
  readonly scienceProtocolOutputId: string;
  readonly scienceProtocolProducedBy: string;
  readonly referenceOutputId: string;
  readonly attemptLedgerOutputId: string;
  readonly producerCallableId: string;
  readonly evaluatorCallableId: Phase10C0VPublicationEvaluation["evaluatorCallableId"];
  readonly checkIds: readonly Phase10C0VPublishCheckId[];
}

interface PublicationSource {
  readonly artifactId: string;
  readonly path: string;
  readonly bytes: Uint8Array;
  readonly role: string;
  readonly producedBy: string;
}

interface DerivedPublicationInputs {
  readonly root: Phase10C0VS6PhysicalRoot;
  readonly packet: Phase10C0VS6PacketProtocol;
  readonly producePacket: Phase10C0VS6PacketProtocol;
  readonly config: LayerConfiguration;
  readonly ledgerBytes: Uint8Array;
  readonly ledgerIdentity: Phase10C0VS6ArtifactIdentity;
  readonly attempt: Phase10C0VS6AttemptRowV2;
  readonly scienceProtocolBytes: Uint8Array;
  readonly referenceBytes: Uint8Array;
  readonly witnessBytes: Uint8Array | null;
  readonly evaluationBytes: Uint8Array | null;
  readonly radialEvaluation: Phase10C0VS6ParsedRadialEvaluationReceipt | null;
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
    artifactIndexOutputId: "out-c0v-moving-artifact-index",
    scienceProtocolOutputId: "out-c0v-moving-protocol",
    scienceProtocolProducedBy: "phase10-c0v-moving-protocol-producer",
    referenceOutputId: "out-c0v-moving-reference",
    attemptLedgerOutputId: "out-c0v-moving-attempt-ledger",
    producerCallableId: "phase10-c0v-moving-publish-producer",
    evaluatorCallableId: "phase10-c0v-moving-publication-verifier",
    checkIds: Object.freeze([
      "chk-c0v-moving-artifact-graph",
      "chk-c0v-moving-terminal-disposition",
      "chk-c0v-moving-verdict-rederived",
    ] as const),
  }),
  "c0v-radial-publish": Object.freeze({
    packetId: "c0v-radial-publish",
    producePacketId: "c0v-radial-produce",
    layerId: "C0V-RADIAL",
    ledgerPath: "evidence/phase10-numerical-verification-v1/c0v-radial-attempts.jsonl",
    resultPath: "evidence/phase10-numerical-verification-v1/c0v-radial-result.json",
    artifactIndexPath: "evidence/phase10-numerical-verification-v1/c0v-radial-artifact-index.json",
    resultOutputId: "out-c0v-radial-result",
    artifactIndexOutputId: "out-c0v-radial-artifact-index",
    scienceProtocolOutputId: "out-c0v-radial-protocol",
    scienceProtocolProducedBy: "phase10-c0v-radial-protocol-producer",
    referenceOutputId: "out-c0v-radial-reference",
    attemptLedgerOutputId: "out-c0v-radial-attempt-ledger",
    producerCallableId: "phase10-c0v-radial-publish-producer",
    evaluatorCallableId: "phase10-c0v-radial-publication-verifier",
    checkIds: Object.freeze([
      "chk-c0v-radial-artifact-graph",
      "chk-c0v-radial-terminal-disposition",
      "chk-c0v-radial-verdict-rederived",
    ] as const),
  }),
  "c0v-static-publish": Object.freeze({
    packetId: "c0v-static-publish",
    producePacketId: "c0v-static-produce",
    layerId: "C0V-STATIC",
    ledgerPath: "evidence/phase10-numerical-verification-v1/c0v-static-attempts.jsonl",
    resultPath: "evidence/phase10-numerical-verification-v1/c0v-static-result.json",
    artifactIndexPath: "evidence/phase10-numerical-verification-v1/c0v-static-artifact-index.json",
    resultOutputId: "out-c0v-static-result",
    artifactIndexOutputId: "out-c0v-static-artifact-index",
    scienceProtocolOutputId: "out-c0v-static-protocol",
    scienceProtocolProducedBy: "phase10-c0v-static-protocol-producer",
    referenceOutputId: "out-c0v-static-reference-refusal",
    attemptLedgerOutputId: "out-c0v-static-attempt-ledger",
    producerCallableId: "phase10-c0v-static-publish-producer",
    evaluatorCallableId: "phase10-c0v-static-publication-verifier",
    checkIds: Object.freeze([
      "chk-c0v-static-artifact-graph",
      "chk-c0v-static-terminal-disposition",
      "chk-c0v-static-verdict-rederived",
    ] as const),
  }),
});

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 publication verification refused: ${message}`);
}

function requireSupportedDeepProduceDependency(packetId: Phase10C0VPublishPacketId): void {
  if (packetId !== "c0v-moving-publish" && packetId !== "c0v-radial-publish") {
    fail(`${packetId} deep produce terminal-v2 and verification-v2 semantic rederivation is not integrated yet`);
  }
}

function oneVerifiedOutput(
  packet: ReturnType<typeof independentlyReopenPhase10C0VS6VerifiedPublishedDependencies>["selectedPackets"][number],
  outputId: string,
): { readonly identity: Phase10C0VS6ArtifactIdentity; readonly bytes: Uint8Array } {
  const rows = packet.reopenedArtifacts.filter((entry) =>
    entry.artifactRole === "published-output" && entry.outputId === outputId);
  if (rows.length !== 1) fail(`${packet.packet.packetId} lacks one deeply verified ${outputId}`);
  return Object.freeze({ identity: rows[0]!.identity, bytes: rows[0]!.bytes });
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function mediaType(path: string): Phase10C0VLayerArtifactIndexEntry["mediaType"] {
  return path.endsWith(".jsonl")
    ? "application/x-ndjson"
    : path.endsWith(".bin")
      ? "application/octet-stream"
      : "application/json";
}

function exactStringRoster(actual: readonly string[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    fail(`${label} differs`);
  }
}

function readBoundIdentity(
  root: Phase10C0VS6PhysicalRoot,
  identity: Phase10C0VS6ArtifactIdentity,
  label: string,
): Uint8Array {
  const bytes = phase10C0VS6ReadUniquePhysicalFile(root, identity.path);
  phase10C0VS6SameIdentity(phase10C0VS6ArtifactIdentity(identity.path, bytes), identity, label);
  return bytes;
}

function deriveInputs(
  expectedPacketId: Phase10C0VPublishPacketId,
  request: Phase10C0VPublicationVerificationRequest,
): DerivedPublicationInputs {
  requireSupportedDeepProduceDependency(expectedPacketId);
  const reopenedDependencies = independentlyReopenPhase10C0VS6VerifiedPublishedDependencies(request);
  const retained = Object.freeze({
    packet: reopenedDependencies.currentPacket,
    preflight: reopenedDependencies.currentPreflight,
  });
  if (retained.packet.packetId !== expectedPacketId || retained.packet.executionMode !== "layer-publish") {
    fail(`raw packet is not ${expectedPacketId}`);
  }
  if (retained.preflight.verdict !== "pass" || retained.preflight.refusalCandidate !== null) {
    fail("layer publication requires a passing retained preflight");
  }
  const config = CONFIGS[expectedPacketId];
  const producePacketId = expectedPacketId === "c0v-moving-publish"
    ? "c0v-moving-produce" as const
    : "c0v-radial-produce" as const;
  if (config.producePacketId !== producePacketId) {
    fail(`${expectedPacketId} produce dependency differs from compiled publication authority`);
  }
  const root = phase10C0VS6PhysicalRepositoryRoot(request.repositoryRoot);
  const verifiedProduce = reopenedDependencies.byPacketId.get(producePacketId);
  if (verifiedProduce === undefined || verifiedProduce.packet.packetId !== config.producePacketId ||
    verifiedProduce.selectedAttempt === null || verifiedProduce.attemptLedgerIdentity === null ||
    verifiedProduce.attemptLedgerBytes === null) {
    fail(`${config.producePacketId} does not have one deeply verified selected attempt and ledger`);
  }
  const producePacket = verifiedProduce.packet;
  const ledgerBytes = verifiedProduce.attemptLedgerBytes;
  const ledgerIdentity = verifiedProduce.attemptLedgerIdentity;
  const attempt = verifiedProduce.selectedAttempt;
  if (ledgerIdentity.path !== config.ledgerPath) {
    fail(`${config.layerId} deeply verified attempt ledger path differs from publication authority`);
  }
  if (attempt.layerId !== config.layerId) fail(`${config.layerId} attempt row layer differs`);
  if (retained.packet.bindings.scienceProtocol === null || retained.packet.bindings.referenceOrRefusal === null) {
    fail(`${expectedPacketId} lacks science/reference bindings`);
  }
  phase10C0VS6SameIdentity(attempt.protocol, retained.packet.bindings.scienceProtocol, "attempt science protocol");
  phase10C0VS6SameIdentity(attempt.referenceOrRefusal, retained.packet.bindings.referenceOrRefusal, "attempt reference/refusal");
  if (producePacket.bindings.scienceProtocol === null || producePacket.bindings.referenceOrRefusal === null) {
    fail(`${config.producePacketId} lacks science/reference bindings`);
  }
  phase10C0VS6SameIdentity(attempt.protocol, producePacket.bindings.scienceProtocol, "produce packet science protocol");
  phase10C0VS6SameIdentity(attempt.referenceOrRefusal, producePacket.bindings.referenceOrRefusal, "produce packet reference/refusal");
  const scienceProtocolBytes = readBoundIdentity(root, attempt.protocol, "live science protocol");
  const referenceBytes = readBoundIdentity(root, attempt.referenceOrRefusal, "live reference/refusal");

  let witnessBytes: Uint8Array | null = null;
  let evaluationBytes: Uint8Array | null = null;
  let radialEvaluation: Phase10C0VS6ParsedRadialEvaluationReceipt | null = null;
  if (expectedPacketId === "c0v-moving-publish") {
    const reference = parsePhase10C0VReferenceEnvelope(phase10C0VS6ParsePrettyJson(referenceBytes, "moving reference"));
    if (reference.layerId !== "C0V-MOVING-EVENT" || reference.branch !== "independent-reference" ||
      reference.disposition !== "reference-discrepancy-refusal" ||
      attempt.branch !== "independent-reference" || attempt.dispositionCode !== "reference-discrepancy-refusal" ||
      attempt.terminalStatus !== "refusal") {
      fail("moving publication is not the exact independently checked discrepancy refusal");
    }
    phase10C0VS6SameIdentity(reference.protocol, attempt.protocol, "moving reference science protocol");
  } else if (expectedPacketId === "c0v-static-publish") {
    const refusal = parsePhase10C0VReferenceRefusal(phase10C0VS6ParsePrettyJson(referenceBytes, "static refusal"));
    if (refusal.layerId !== "C0V-STATIC" || refusal.branch !== "reference-refusal" ||
      attempt.branch !== "reference-refusal" || attempt.dispositionCode !== "preimplementation-reference-refusal" ||
      attempt.terminalStatus !== "refusal") {
      fail("static publication is not the exact preimplementation reference refusal");
    }
    phase10C0VS6SameIdentity(refusal.protocol, attempt.protocol, "static refusal science protocol");
  } else {
    if (attempt.branch !== "independent-reference" || ![
      "production-complete", "preproduction-artifact-refusal", "prelaunch-resource-refusal",
      "registered-cap-resource-refusal",
    ].includes(attempt.dispositionCode)) fail("radial attempt disposition is not publishable");
    if (attempt.dispositionCode === "production-complete") {
      const witness = oneVerifiedOutput(verifiedProduce, "out-c0v-radial-witness");
      const evaluation = oneVerifiedOutput(verifiedProduce, "out-c0v-radial-evaluation");
      witnessBytes = witness.bytes;
      evaluationBytes = evaluation.bytes;
      radialEvaluation = parsePhase10C0VS6RadialEvaluationBytes(evaluationBytes, producePacket);
      phase10C0VS6SameIdentity(
        radialEvaluation.witness,
        witness.identity,
        "deeply verified radial evaluation witness",
      );
      if (radialEvaluation.artifactDisposition !== "valid" ||
        radialEvaluation.numericalDisposition !== attempt.terminalStatus ||
        attempt.classificationValidation?.verdict !== "pass") {
        fail("radial production evaluation differs from its deeply rederived selected attempt");
      }
    } else if (attempt.terminalStatus !== "refusal" || attempt.classificationValidation?.verdict !== "pass" ||
      attempt.executionRecord.acceptedValidWitnessCount !== 0 ||
      attempt.executionRecord.acceptedNumericalVerdictCount !== 0) {
      fail("radial refusal attempt lacks an independently passed classification");
    }
  }
  return Object.freeze({
    root,
    packet: retained.packet,
    producePacket,
    config,
    ledgerBytes,
    ledgerIdentity,
    attempt,
    scienceProtocolBytes,
    referenceBytes,
    witnessBytes,
    evaluationBytes,
    radialEvaluation,
  });
}

function parseClaimBoundary(value: unknown, label: string): { readonly allowed: readonly string[]; readonly forbidden: readonly string[] } {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, ["allowed", "forbidden"], label);
  return Object.freeze({
    allowed: phase10C0VS6SortedUniqueStrings(row.allowed, `${label}.allowed`),
    forbidden: phase10C0VS6SortedUniqueStrings(row.forbidden, `${label}.forbidden`),
  });
}

export function parsePhase10C0VLayerResultV1(
  value: unknown,
  packetId: "c0v-moving-publish" | "c0v-static-publish",
  label = "layer result",
): Phase10C0VLayerResultV1 {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "schema", "resultId", "layerId", "branch", "protocol", "referenceOrRefusal",
    "attemptLedger", "witness", "evaluation", "terminalStatus", "scientificDisposition",
    "negativeControlDisposition", "resourceDisposition", "claimBoundary",
  ], label);
  const moving = packetId === "c0v-moving-publish";
  const schema = moving ? "phase10-c0v-moving-result-v1" : "phase10-c0v-static-result-v1";
  const resultId = moving ? "c0v-moving-result-v1" : "c0v-static-result-v1";
  const layerId = moving ? "C0V-MOVING-EVENT" : "C0V-STATIC";
  const branch = moving ? "independent-reference" : "reference-refusal";
  if (row.schema !== schema || row.resultId !== resultId || row.layerId !== layerId || row.branch !== branch ||
    row.witness !== null || row.evaluation !== null || row.terminalStatus !== "refusal" ||
    row.scientificDisposition !== "refusal" || row.negativeControlDisposition !== "not-run-no-credit" ||
    row.resourceDisposition !== "within-cap") {
    fail(`${label} exact refusal projection differs`);
  }
  return Object.freeze({
    schema,
    resultId,
    layerId,
    branch,
    protocol: parsePhase10C0VS6ArtifactIdentity(row.protocol, `${label}.protocol`),
    referenceOrRefusal: parsePhase10C0VS6ArtifactIdentity(row.referenceOrRefusal, `${label}.referenceOrRefusal`),
    attemptLedger: parsePhase10C0VS6ArtifactIdentity(row.attemptLedger, `${label}.attemptLedger`),
    witness: null,
    evaluation: null,
    terminalStatus: "refusal",
    scientificDisposition: "refusal",
    negativeControlDisposition: "not-run-no-credit",
    resourceDisposition: "within-cap",
    claimBoundary: parseClaimBoundary(row.claimBoundary, `${label}.claimBoundary`),
  } as Phase10C0VLayerResultV1);
}

export function parsePhase10C0VPublishedLayerResultBytes(
  bytes: Uint8Array,
  packetId: Phase10C0VPublishPacketId,
): Phase10C0VPublishedLayerResult {
  const value = phase10C0VS6ParsePrettyJson(bytes, `${packetId} result bytes`);
  return packetId === "c0v-radial-publish"
    ? parsePhase10C0VS6RadialResultV2(value, "radial publication result")
    : parsePhase10C0VLayerResultV1(value, packetId, `${packetId} result`);
}

export function parsePhase10C0VLayerArtifactIndex(
  value: unknown,
  label = "layer artifact index",
): Phase10C0VLayerArtifactIndex {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, ["schema", "bundleId", "artifacts"], label);
  if (row.schema !== "phase10-artifact-index-v1" || row.bundleId !== "phase10-numerical-verification-v1" ||
    !Array.isArray(row.artifacts) || row.artifacts.length === 0) fail(`${label} identity/roster differs`);
  const artifacts = row.artifacts.map((entry, index) => {
    const entryLabel = `${label}.artifacts[${index}]`;
    const item = phase10C0VS6Object(entry, entryLabel);
    phase10C0VS6ExactOrderedKeys(item, [
      "artifactId", "path", "mediaType", "byteLength", "sha256", "role", "producedBy",
    ], entryLabel);
    const identity = parsePhase10C0VS6ArtifactIdentity({
      path: item.path,
      byteLength: item.byteLength,
      sha256: item.sha256,
    }, `${entryLabel}.identity`);
    const parsedMediaType = item.mediaType;
    if (parsedMediaType !== mediaType(identity.path)) fail(`${entryLabel}.mediaType differs from path`);
    return Object.freeze({
      artifactId: phase10C0VS6SafeToken(item.artifactId, `${entryLabel}.artifactId`),
      ...identity,
      mediaType: parsedMediaType,
      role: phase10C0VS6SafeToken(item.role, `${entryLabel}.role`),
      producedBy: phase10C0VS6SafeToken(item.producedBy, `${entryLabel}.producedBy`),
    }) as Phase10C0VLayerArtifactIndexEntry;
  });
  const ids = artifacts.map((entry) => entry.artifactId);
  const sorted = [...ids].sort(compareText);
  if (new Set(ids).size !== ids.length || ids.some((entry, index) => entry !== sorted[index])) {
    fail(`${label}.artifacts must be artifact-ID sorted and unique`);
  }
  if (new Set(artifacts.map((entry) => entry.path)).size !== artifacts.length) {
    fail(`${label}.artifacts repeat a path`);
  }
  return Object.freeze({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-numerical-verification-v1",
    artifacts: Object.freeze(artifacts),
  });
}

export function parsePhase10C0VLayerArtifactIndexBytes(
  bytes: Uint8Array,
  label = "layer artifact index bytes",
): Phase10C0VLayerArtifactIndex {
  return parsePhase10C0VLayerArtifactIndex(phase10C0VS6ParsePrettyJson(bytes, label), label);
}

function expectedResult(inputs: DerivedPublicationInputs): Phase10C0VPublishedLayerResult {
  const { attempt, packet, ledgerIdentity } = inputs;
  if (packet.packetId === "c0v-moving-publish" || packet.packetId === "c0v-static-publish") {
    return Object.freeze({
      schema: packet.packetId === "c0v-moving-publish"
        ? "phase10-c0v-moving-result-v1"
        : "phase10-c0v-static-result-v1",
      resultId: packet.packetId === "c0v-moving-publish" ? "c0v-moving-result-v1" : "c0v-static-result-v1",
      layerId: attempt.layerId as "C0V-MOVING-EVENT" | "C0V-STATIC",
      branch: attempt.branch,
      protocol: attempt.protocol,
      referenceOrRefusal: attempt.referenceOrRefusal,
      attemptLedger: ledgerIdentity,
      witness: null,
      evaluation: null,
      terminalStatus: "refusal",
      scientificDisposition: "refusal",
      negativeControlDisposition: "not-run-no-credit",
      resourceDisposition: "within-cap",
      claimBoundary: packet.claimBoundary,
    } as Phase10C0VLayerResultV1);
  }
  const productionComplete = attempt.dispositionCode === "production-complete";
  const witness = productionComplete && inputs.witnessBytes !== null
    ? phase10C0VS6ArtifactIdentity(
      "evidence/phase10-numerical-verification-v1/c0v-radial-witness.bin",
      inputs.witnessBytes,
    )
    : null;
  const evaluation = productionComplete && inputs.evaluationBytes !== null
    ? phase10C0VS6ArtifactIdentity(
      "evidence/phase10-numerical-verification-v1/c0v-radial-evaluation.json",
      inputs.evaluationBytes,
    )
    : null;
  const resourceDisposition = productionComplete
    ? "within-cap"
    : attempt.dispositionCode === "preproduction-artifact-refusal"
      ? "artifact-refusal"
      : attempt.dispositionCode as "prelaunch-resource-refusal" | "registered-cap-resource-refusal";
  return Object.freeze({
    schema: "phase10-c0v-radial-result-v2",
    resultId: "c0v-radial-result-v2",
    layerId: "C0V-RADIAL",
    branch: "independent-reference",
    protocol: attempt.protocol,
    referenceOrRefusal: attempt.referenceOrRefusal,
    attemptLedger: ledgerIdentity,
    selectedAttemptId: attempt.attemptId,
    attemptDispositionCode: attempt.dispositionCode,
    witness,
    evaluation,
    terminalStatus: attempt.terminalStatus,
    scientificDisposition: attempt.terminalStatus,
    negativeControlDisposition: productionComplete ? "pass" : "not-accepted-no-credit",
    resourceDisposition,
    claimBoundary: packet.claimBoundary,
  } as Phase10C0VS6RadialResultV2);
}

function entry(source: PublicationSource): Phase10C0VLayerArtifactIndexEntry {
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

function expectedArtifactIndex(
  inputs: DerivedPublicationInputs,
  resultBytes: Uint8Array,
): Phase10C0VLayerArtifactIndex {
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
      producedBy: inputs.config.layerId === "C0V-STATIC"
        ? "phase10-c0v-static-refusal-receipt-writer"
        : inputs.config.layerId === "C0V-RADIAL"
          ? "phase10-c0v-radial-reference-producer"
          : "phase10-c0v-moving-reference-producer",
    },
    {
      artifactId: inputs.config.attemptLedgerOutputId,
      path: inputs.config.ledgerPath,
      bytes: inputs.ledgerBytes,
      role: "attempt-ledger",
      producedBy: inputs.config.layerId === "C0V-RADIAL"
        ? "phase10-c0v-radial-attempt-receipt-writer"
        : inputs.config.layerId === "C0V-MOVING-EVENT"
          ? "phase10-c0v-moving-attempt-receipt-writer"
          : "phase10-c0v-static-attempt-receipt-writer",
    },
    {
      artifactId: inputs.config.resultOutputId,
      path: inputs.config.resultPath,
      bytes: resultBytes,
      role: "layer-result",
      producedBy: inputs.config.producerCallableId,
    },
  ];
  if (inputs.witnessBytes !== null) {
    sources.push({
      artifactId: "out-c0v-radial-witness",
      path: "evidence/phase10-numerical-verification-v1/c0v-radial-witness.bin",
      bytes: inputs.witnessBytes,
      role: "production-witness",
      producedBy: "phase10-c0v-radial-production-producer",
    });
  }
  if (inputs.evaluationBytes !== null) {
    sources.push({
      artifactId: "out-c0v-radial-evaluation",
      path: "evidence/phase10-numerical-verification-v1/c0v-radial-evaluation.json",
      bytes: inputs.evaluationBytes,
      role: "independent-evaluation",
      producedBy: "phase10-c0v-radial-evaluation-receipt-writer",
    });
  }
  const artifacts = Object.freeze(sources.map(entry).sort((left, right) =>
    compareText(left.artifactId, right.artifactId)));
  return Object.freeze({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-numerical-verification-v1",
    artifacts,
  });
}

function verifyPublication(
  packetId: Phase10C0VPublishPacketId,
  request: Phase10C0VPublicationVerificationRequest,
): Phase10C0VPublicationEvaluation {
  const inputs = deriveInputs(packetId, request);
  const parsedResult = parsePhase10C0VPublishedLayerResultBytes(request.candidate.resultBytes, packetId);
  const expected = expectedResult(inputs);
  phase10C0VS6SameJson(parsedResult, expected, `${packetId} result rederivation`);
  phase10C0VS6SameIdentity(parsedResult.protocol, inputs.attempt.protocol, `${packetId} result protocol`);
  phase10C0VS6SameIdentity(parsedResult.referenceOrRefusal, inputs.attempt.referenceOrRefusal, `${packetId} result reference`);
  phase10C0VS6SameIdentity(parsedResult.attemptLedger, inputs.ledgerIdentity, `${packetId} result raw ledger`);
  exactStringRoster(parsedResult.claimBoundary.allowed, inputs.packet.claimBoundary.allowed, `${packetId} allowed claim boundary`);
  exactStringRoster(parsedResult.claimBoundary.forbidden, inputs.packet.claimBoundary.forbidden, `${packetId} forbidden claim boundary`);

  const parsedIndex = parsePhase10C0VLayerArtifactIndexBytes(
    request.candidate.artifactIndexBytes,
    `${packetId} artifact index bytes`,
  );
  const expectedIndex = expectedArtifactIndex(inputs, request.candidate.resultBytes);
  phase10C0VS6SameJson(parsedIndex, expectedIndex, `${packetId} artifact graph rederivation`);

  const expectedResultPath = inputs.packet.paths.allowedPublicationPaths.filter((path) => path === inputs.config.resultPath);
  const expectedIndexPath = inputs.packet.paths.allowedPublicationPaths.filter((path) => path === inputs.config.artifactIndexPath);
  if (expectedResultPath.length !== 1 || expectedIndexPath.length !== 1) {
    fail(`${packetId} output paths are not uniquely registered`);
  }
  const checkResults = Object.freeze(inputs.config.checkIds.map((checkId, index) => Object.freeze({
    checkId,
    verdict: "pass" as const,
    reasons: Object.freeze([]) as readonly [],
    witnessOutputIds: Object.freeze(index === 0
      ? [inputs.config.artifactIndexOutputId]
      : [inputs.config.resultOutputId]),
  })));
  return Object.freeze({
    schema: "phase10-c0v-publication-evaluation-v1",
    packetId,
    evaluatorCallableId: inputs.config.evaluatorCallableId,
    selectedAttempt: inputs.attempt,
    result: parsedResult,
    artifactIndex: parsedIndex,
    resultIdentity: phase10C0VS6ArtifactIdentity(inputs.config.resultPath, request.candidate.resultBytes),
    artifactIndexIdentity: phase10C0VS6ArtifactIdentity(
      inputs.config.artifactIndexPath,
      request.candidate.artifactIndexBytes,
    ),
    checkResults,
    aggregateVerdict: "pass",
  });
}

export function independentlyVerifyPhase10C0VMovingPublication(
  request: Phase10C0VPublicationVerificationRequest,
): Phase10C0VPublicationEvaluation {
  const dependencies = independentlyReopenPhase10C0VS6VerifiedPublishedDependencies(request);
  if (dependencies.currentPacket.packetId !== "c0v-moving-publish" ||
    dependencies.currentPacket.executionMode !== "layer-publish" ||
    dependencies.currentPreflight.verdict !== "pass" ||
    dependencies.currentPreflight.refusalCandidate !== null) {
    fail("moving publication requires its exact passing retained packet/preflight authority");
  }
  const produce = dependencies.byPacketId.get("c0v-moving-produce");
  if (produce === undefined) fail("moving publication lacks its deeply verified produce dependency");
  return independentlyEvaluatePhase10C0VMovingPublicationSemantic(Object.freeze({
    publicationPacket: dependencies.currentPacket,
    verifiedProduce: produce,
    candidate: request.candidate,
  }));
}

export function independentlyVerifyPhase10C0VRadialPublication(
  request: Phase10C0VPublicationVerificationRequest,
): Phase10C0VPublicationEvaluation {
  return verifyPublication("c0v-radial-publish", request);
}

export function independentlyVerifyPhase10C0VStaticPublication(
  request: Phase10C0VPublicationVerificationRequest,
): Phase10C0VPublicationEvaluation {
  return verifyPublication("c0v-static-publish", request);
}

export function phase10C0VLayerResultBytes(result: Phase10C0VPublishedLayerResult): Uint8Array {
  return phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(result));
}

export function phase10C0VLayerArtifactIndexBytes(index: Phase10C0VLayerArtifactIndex): Uint8Array {
  return phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(index));
}
