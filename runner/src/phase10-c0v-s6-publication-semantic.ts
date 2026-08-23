import { parsePhase10C0VReferenceEnvelope } from "./phase10-c0v-contracts.ts";
import type { Phase10C0VS6PacketProtocol } from "./phase10-c0v-s6-contracts.ts";
import {
  parsePhase10C0VS6AttemptLedgerV2,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6ParsePrettyJson,
  phase10C0VS6SameIdentity,
  phase10C0VS6SameJson,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6AttemptRowV2,
} from "./phase10-c0v-s6-execution-contracts.ts";

export interface Phase10C0VMovingPublicationSemanticArtifact {
  readonly artifactRole: string;
  readonly outputId: string | null;
  readonly identity: Phase10C0VS6ArtifactIdentity;
  readonly bytes: Uint8Array;
}

/**
 * Structural view of a token that the lower raw packet verifier has already derived. This module
 * deliberately does not import that verifier: both the historical-prefix composer and the live
 * publication verifier can therefore rerun the same pure semantics without an import cycle.
 */
export interface Phase10C0VMovingPublicationVerifiedProduce {
  readonly packet: Phase10C0VS6PacketProtocol;
  readonly selectedAttempt: Phase10C0VS6AttemptRowV2 | null;
  readonly attemptLedgerIdentity: Phase10C0VS6ArtifactIdentity | null;
  readonly attemptLedgerBytes: Uint8Array | null;
  readonly reopenedArtifacts: readonly Phase10C0VMovingPublicationSemanticArtifact[];
}

export interface Phase10C0VMovingPublicationSemanticCandidate {
  readonly resultBytes: Uint8Array;
  readonly artifactIndexBytes: Uint8Array;
}

export interface Phase10C0VMovingPublicationSemanticRequest {
  readonly publicationPacket: Phase10C0VS6PacketProtocol;
  readonly verifiedProduce: Phase10C0VMovingPublicationVerifiedProduce;
  readonly candidate: Phase10C0VMovingPublicationSemanticCandidate;
}

export interface Phase10C0VMovingLayerResult {
  readonly schema: "phase10-c0v-moving-result-v1";
  readonly resultId: "c0v-moving-result-v1";
  readonly layerId: "C0V-MOVING-EVENT";
  readonly branch: "independent-reference";
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

export interface Phase10C0VMovingArtifactIndexEntry {
  readonly artifactId: string;
  readonly path: string;
  readonly mediaType: "application/json" | "application/x-ndjson";
  readonly byteLength: number;
  readonly sha256: string;
  readonly role: string;
  readonly producedBy: string;
}

export interface Phase10C0VMovingArtifactIndex {
  readonly schema: "phase10-artifact-index-v1";
  readonly bundleId: "phase10-numerical-verification-v1";
  readonly artifacts: readonly Phase10C0VMovingArtifactIndexEntry[];
}

export interface Phase10C0VMovingPublicationSemanticEvaluation {
  readonly schema: "phase10-c0v-publication-evaluation-v1";
  readonly packetId: "c0v-moving-publish";
  readonly evaluatorCallableId: "phase10-c0v-moving-publication-verifier";
  readonly selectedAttempt: Phase10C0VS6AttemptRowV2;
  readonly result: Phase10C0VMovingLayerResult;
  readonly artifactIndex: Phase10C0VMovingArtifactIndex;
  readonly resultIdentity: Phase10C0VS6ArtifactIdentity;
  readonly artifactIndexIdentity: Phase10C0VS6ArtifactIdentity;
  readonly checkResults: readonly Readonly<{
    readonly checkId:
      | "chk-c0v-moving-artifact-graph"
      | "chk-c0v-moving-terminal-disposition"
      | "chk-c0v-moving-verdict-rederived";
    readonly verdict: "pass";
    readonly reasons: readonly [];
    readonly witnessOutputIds: readonly string[];
  }>[];
  readonly aggregateVerdict: "pass";
}

const RESULT_PATH = "evidence/phase10-numerical-verification-v1/c0v-moving-result.json";
const INDEX_PATH = "evidence/phase10-numerical-verification-v1/c0v-moving-artifact-index.json";
const LEDGER_PATH = "evidence/phase10-numerical-verification-v1/c0v-moving-attempts.jsonl";

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 moving publication semantic reproof refused: ${message}`);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function exactRoster(actual: readonly string[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    fail(`${label} differs`);
  }
}

function onePublishedOutput(
  produce: Phase10C0VMovingPublicationVerifiedProduce,
  outputId: string,
  expected: Phase10C0VS6ArtifactIdentity,
): Readonly<{ readonly identity: Phase10C0VS6ArtifactIdentity; readonly bytes: Uint8Array }> {
  const rows = produce.reopenedArtifacts.filter((entry) =>
    entry.artifactRole === "published-output" && entry.outputId === outputId);
  if (rows.length !== 1) fail(`deep moving-produce token lacks one ${outputId}`);
  phase10C0VS6SameIdentity(rows[0]!.identity, expected, `${outputId} deep output identity`);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(expected.path, rows[0]!.bytes),
    expected,
    `${outputId} deep output bytes`,
  );
  return Object.freeze({ identity: rows[0]!.identity, bytes: rows[0]!.bytes });
}

function artifactEntry(
  artifactId: string,
  identity: Phase10C0VS6ArtifactIdentity,
  role: string,
  producedBy: string,
): Phase10C0VMovingArtifactIndexEntry {
  return Object.freeze({
    artifactId,
    path: identity.path,
    mediaType: identity.path.endsWith(".jsonl") ? "application/x-ndjson" : "application/json",
    byteLength: identity.byteLength,
    sha256: identity.sha256,
    role,
    producedBy,
  });
}

/** Pure moving-publication evaluator over an already raw/deeply verified produce token. */
export function independentlyEvaluatePhase10C0VMovingPublicationSemantic(
  request: Phase10C0VMovingPublicationSemanticRequest,
): Phase10C0VMovingPublicationSemanticEvaluation {
  const { publicationPacket, verifiedProduce: produce } = request;
  if (publicationPacket.packetId !== "c0v-moving-publish" ||
    publicationPacket.executionMode !== "layer-publish" ||
    produce.packet.packetId !== "c0v-moving-produce" ||
    produce.packet.executionMode !== "discrepancy-match-only") {
    fail("packet identities or execution modes differ from the moving publication route");
  }
  if (produce.selectedAttempt === null || produce.attemptLedgerIdentity === null ||
    produce.attemptLedgerBytes === null) {
    fail("deep moving-produce token lacks its selected attempt or ledger");
  }
  const attempt = produce.selectedAttempt;
  const ledgerIdentity = produce.attemptLedgerIdentity;
  if (ledgerIdentity.path !== LEDGER_PATH) fail("moving attempt ledger path differs");
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(LEDGER_PATH, produce.attemptLedgerBytes),
    ledgerIdentity,
    "moving attempt ledger bytes",
  );
  const ledgerRows = parsePhase10C0VS6AttemptLedgerV2(
    produce.attemptLedgerBytes,
    "deep moving attempt ledger",
  );
  if (ledgerRows.length !== 1) fail("moving v1 ledger must contain exactly one selected attempt");
  phase10C0VS6SameJson(ledgerRows[0]!, attempt, "deep moving selected attempt");
  if (attempt.layerId !== "C0V-MOVING-EVENT" || attempt.branch !== "independent-reference" ||
    attempt.dispositionCode !== "reference-discrepancy-refusal" || attempt.terminalStatus !== "refusal" ||
    attempt.classificationValidation?.verdict !== "pass") {
    fail("moving attempt is not the independently classified discrepancy refusal");
  }
  if (publicationPacket.bindings.scienceProtocol === null ||
    publicationPacket.bindings.referenceOrRefusal === null ||
    produce.packet.bindings.scienceProtocol === null || produce.packet.bindings.referenceOrRefusal === null) {
    fail("moving packet science/reference bindings are absent");
  }
  for (const [actual, expected, label] of [
    [attempt.protocol, publicationPacket.bindings.scienceProtocol, "publication science protocol"],
    [attempt.referenceOrRefusal, publicationPacket.bindings.referenceOrRefusal, "publication reference"],
    [attempt.protocol, produce.packet.bindings.scienceProtocol, "produce science protocol"],
    [attempt.referenceOrRefusal, produce.packet.bindings.referenceOrRefusal, "produce reference"],
  ] as const) phase10C0VS6SameIdentity(actual, expected, label);

  const science = onePublishedOutput(produce, "out-c0v-moving-protocol", attempt.protocol);
  const reference = onePublishedOutput(produce, "out-c0v-moving-reference", attempt.referenceOrRefusal);
  onePublishedOutput(produce, "out-c0v-moving-attempt-ledger", ledgerIdentity);
  const referenceEnvelope = parsePhase10C0VReferenceEnvelope(
    phase10C0VS6ParsePrettyJson(reference.bytes, "deep moving reference"),
  );
  if (referenceEnvelope.layerId !== "C0V-MOVING-EVENT" ||
    referenceEnvelope.branch !== "independent-reference" ||
    referenceEnvelope.disposition !== "reference-discrepancy-refusal") {
    fail("deep moving reference does not select the discrepancy refusal");
  }
  phase10C0VS6SameIdentity(referenceEnvelope.protocol, attempt.protocol, "moving reference protocol");

  const expectedResult: Phase10C0VMovingLayerResult = Object.freeze({
    schema: "phase10-c0v-moving-result-v1",
    resultId: "c0v-moving-result-v1",
    layerId: "C0V-MOVING-EVENT",
    branch: "independent-reference",
    protocol: attempt.protocol,
    referenceOrRefusal: attempt.referenceOrRefusal,
    attemptLedger: ledgerIdentity,
    witness: null,
    evaluation: null,
    terminalStatus: "refusal",
    scientificDisposition: "refusal",
    negativeControlDisposition: "not-run-no-credit",
    resourceDisposition: "within-cap",
    claimBoundary: publicationPacket.claimBoundary,
  });
  phase10C0VS6SameJson(
    phase10C0VS6ParsePrettyJson(request.candidate.resultBytes, "moving publication candidate result"),
    expectedResult,
    "moving publication result rederivation",
  );
  exactRoster(expectedResult.claimBoundary.allowed, publicationPacket.claimBoundary.allowed, "allowed claim boundary");
  exactRoster(
    expectedResult.claimBoundary.forbidden,
    publicationPacket.claimBoundary.forbidden,
    "forbidden claim boundary",
  );

  const resultIdentity = phase10C0VS6ArtifactIdentity(RESULT_PATH, request.candidate.resultBytes);
  const expectedIndex: Phase10C0VMovingArtifactIndex = Object.freeze({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-numerical-verification-v1",
    artifacts: Object.freeze([
      artifactEntry(
        "out-c0v-moving-attempt-ledger",
        ledgerIdentity,
        "attempt-ledger",
        "phase10-c0v-moving-attempt-receipt-writer",
      ),
      artifactEntry(
        "out-c0v-moving-protocol",
        science.identity,
        "science-protocol",
        "phase10-c0v-moving-protocol-producer",
      ),
      artifactEntry(
        "out-c0v-moving-reference",
        reference.identity,
        "independent-reference",
        "phase10-c0v-moving-reference-producer",
      ),
      artifactEntry(
        "out-c0v-moving-result",
        resultIdentity,
        "layer-result",
        "phase10-c0v-moving-publish-producer",
      ),
    ].sort((left, right) => compareText(left.artifactId, right.artifactId))),
  });
  phase10C0VS6SameJson(
    phase10C0VS6ParsePrettyJson(request.candidate.artifactIndexBytes, "moving publication candidate index"),
    expectedIndex,
    "moving publication artifact graph rederivation",
  );
  if (publicationPacket.paths.allowedPublicationPaths.filter((path) => path === RESULT_PATH).length !== 1 ||
    publicationPacket.paths.allowedPublicationPaths.filter((path) => path === INDEX_PATH).length !== 1) {
    fail("moving publication output paths are not uniquely registered");
  }
  const checkIds = Object.freeze([
    "chk-c0v-moving-artifact-graph",
    "chk-c0v-moving-terminal-disposition",
    "chk-c0v-moving-verdict-rederived",
  ] as const);
  const checkResults = Object.freeze(checkIds.map((checkId, index) => Object.freeze({
    checkId,
    verdict: "pass" as const,
    reasons: Object.freeze([]) as readonly [],
    witnessOutputIds: Object.freeze(index === 0
      ? ["out-c0v-moving-artifact-index"]
      : ["out-c0v-moving-result"]),
  })));
  return Object.freeze({
    schema: "phase10-c0v-publication-evaluation-v1",
    packetId: "c0v-moving-publish",
    evaluatorCallableId: "phase10-c0v-moving-publication-verifier",
    selectedAttempt: attempt,
    result: expectedResult,
    artifactIndex: expectedIndex,
    resultIdentity,
    artifactIndexIdentity: phase10C0VS6ArtifactIdentity(INDEX_PATH, request.candidate.artifactIndexBytes),
    checkResults,
    aggregateVerdict: "pass",
  });
}
