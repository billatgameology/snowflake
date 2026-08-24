import {
  parsePhase10C0VReferenceEnvelope,
  parsePhase10C0VReferenceRefusal,
} from "./phase10-c0v-contracts.ts";
import type { Phase10C0VS6PacketProtocol } from "./phase10-c0v-s6-contracts.ts";
import {
  parsePhase10C0VS6AttemptLedgerV2,
  parsePhase10C0VS6RadialResultV2,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6ParsePrettyJson,
  phase10C0VS6SameIdentity,
  phase10C0VS6SameJson,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6AttemptRowV2,
  type Phase10C0VS6RadialResultV2,
} from "./phase10-c0v-s6-execution-contracts.ts";
import { parsePhase10C0VS6RadialEvaluationBytes } from "./phase10-c0v-s6-receipts.ts";

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

export interface Phase10C0VRadialPublicationSemanticRequest {
  readonly publicationPacket: Phase10C0VS6PacketProtocol;
  readonly verifiedProduce: Phase10C0VMovingPublicationVerifiedProduce;
  readonly candidate: Phase10C0VMovingPublicationSemanticCandidate;
}

export interface Phase10C0VStaticPublicationSemanticRequest {
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

export interface Phase10C0VStaticLayerResult {
  readonly schema: "phase10-c0v-static-result-v1";
  readonly resultId: "c0v-static-result-v1";
  readonly layerId: "C0V-STATIC";
  readonly branch: "reference-refusal";
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
  readonly mediaType: "application/json" | "application/x-ndjson" | "application/octet-stream";
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

export interface Phase10C0VRadialPublicationSemanticEvaluation {
  readonly schema: "phase10-c0v-publication-evaluation-v1";
  readonly packetId: "c0v-radial-publish";
  readonly evaluatorCallableId: "phase10-c0v-radial-publication-verifier";
  readonly selectedAttempt: Phase10C0VS6AttemptRowV2;
  readonly result: Phase10C0VS6RadialResultV2;
  readonly artifactIndex: Phase10C0VMovingArtifactIndex;
  readonly resultIdentity: Phase10C0VS6ArtifactIdentity;
  readonly artifactIndexIdentity: Phase10C0VS6ArtifactIdentity;
  readonly checkResults: readonly Readonly<{
    readonly checkId:
      | "chk-c0v-radial-artifact-graph"
      | "chk-c0v-radial-terminal-disposition"
      | "chk-c0v-radial-verdict-rederived";
    readonly verdict: "pass";
    readonly reasons: readonly [];
    readonly witnessOutputIds: readonly string[];
  }>[];
  readonly aggregateVerdict: "pass";
}

export interface Phase10C0VStaticPublicationSemanticEvaluation {
  readonly schema: "phase10-c0v-publication-evaluation-v1";
  readonly packetId: "c0v-static-publish";
  readonly evaluatorCallableId: "phase10-c0v-static-publication-verifier";
  readonly selectedAttempt: Phase10C0VS6AttemptRowV2;
  readonly result: Phase10C0VStaticLayerResult;
  readonly artifactIndex: Phase10C0VMovingArtifactIndex;
  readonly resultIdentity: Phase10C0VS6ArtifactIdentity;
  readonly artifactIndexIdentity: Phase10C0VS6ArtifactIdentity;
  readonly checkResults: readonly Readonly<{
    readonly checkId:
      | "chk-c0v-static-artifact-graph"
      | "chk-c0v-static-terminal-disposition"
      | "chk-c0v-static-verdict-rederived";
    readonly verdict: "pass";
    readonly reasons: readonly [];
    readonly witnessOutputIds: readonly string[];
  }>[];
  readonly aggregateVerdict: "pass";
}

export type Phase10C0VPublicationSemanticEvaluation =
  | Phase10C0VMovingPublicationSemanticEvaluation
  | Phase10C0VRadialPublicationSemanticEvaluation
  | Phase10C0VStaticPublicationSemanticEvaluation;

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
  expected?: Phase10C0VS6ArtifactIdentity,
): Readonly<{ readonly identity: Phase10C0VS6ArtifactIdentity; readonly bytes: Uint8Array }> {
  const rows = produce.reopenedArtifacts.filter((entry) =>
    entry.artifactRole === "published-output" && entry.outputId === outputId);
  if (rows.length !== 1) fail(`deep produce token lacks one ${outputId}`);
  if (expected !== undefined) {
    phase10C0VS6SameIdentity(rows[0]!.identity, expected, `${outputId} deep output identity`);
  }
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(rows[0]!.identity.path, rows[0]!.bytes),
    rows[0]!.identity,
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
    mediaType: identity.path.endsWith(".jsonl")
      ? "application/x-ndjson"
      : identity.path.endsWith(".bin")
        ? "application/octet-stream"
        : "application/json",
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

/** Pure radial-publication evaluator over an already raw/deeply verified produce token. */
export function independentlyEvaluatePhase10C0VRadialPublicationSemantic(
  request: Phase10C0VRadialPublicationSemanticRequest,
): Phase10C0VRadialPublicationSemanticEvaluation {
  const { publicationPacket, verifiedProduce: produce } = request;
  if (publicationPacket.packetId !== "c0v-radial-publish" ||
    publicationPacket.executionMode !== "layer-publish" ||
    produce.packet.packetId !== "c0v-radial-produce" ||
    produce.packet.executionMode !== "radial-production") {
    fail("packet identities or execution modes differ from the radial publication route");
  }
  if (produce.selectedAttempt === null || produce.attemptLedgerIdentity === null ||
    produce.attemptLedgerBytes === null) {
    fail("deep radial-produce token lacks its selected attempt or ledger");
  }
  const attempt = produce.selectedAttempt;
  const ledgerIdentity = produce.attemptLedgerIdentity;
  const ledgerPath = "evidence/phase10-numerical-verification-v1/c0v-radial-attempts.jsonl";
  const resultPath = "evidence/phase10-numerical-verification-v1/c0v-radial-result.json";
  const indexPath = "evidence/phase10-numerical-verification-v1/c0v-radial-artifact-index.json";
  if (ledgerIdentity.path !== ledgerPath) fail("radial attempt ledger path differs");
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(ledgerPath, produce.attemptLedgerBytes),
    ledgerIdentity,
    "radial attempt ledger bytes",
  );
  const ledgerRows = parsePhase10C0VS6AttemptLedgerV2(
    produce.attemptLedgerBytes,
    "deep radial attempt ledger",
  );
  if (ledgerRows.length !== 1) fail("radial v1 ledger must contain exactly one selected attempt");
  phase10C0VS6SameJson(ledgerRows[0]!, attempt, "deep radial selected attempt");
  if (attempt.layerId !== "C0V-RADIAL" || attempt.branch !== "independent-reference" || ![
    "production-complete",
    "preproduction-artifact-refusal",
    "prelaunch-resource-refusal",
    "registered-cap-resource-refusal",
  ].includes(attempt.dispositionCode) || attempt.classificationValidation?.verdict !== "pass") {
    fail("radial attempt is not an independently classified publishable disposition");
  }
  const productionComplete = attempt.dispositionCode === "production-complete";
  if (productionComplete) {
    if (attempt.terminalStatus !== "pass" && attempt.terminalStatus !== "fail") {
      fail("radial production attempt lacks its numerical terminal disposition");
    }
  } else if (attempt.terminalStatus !== "refusal" ||
    attempt.executionRecord.acceptedValidWitnessCount !== 0 ||
    attempt.executionRecord.acceptedNumericalVerdictCount !== 0) {
    fail("radial refusal attempt retains forbidden witness or numerical credit");
  }
  if (publicationPacket.bindings.scienceProtocol === null ||
    publicationPacket.bindings.referenceOrRefusal === null ||
    produce.packet.bindings.scienceProtocol === null ||
    produce.packet.bindings.referenceOrRefusal === null) {
    fail("radial packet science/reference bindings are absent");
  }
  for (const [actual, expected, label] of [
    [attempt.protocol, publicationPacket.bindings.scienceProtocol, "publication science protocol"],
    [attempt.referenceOrRefusal, publicationPacket.bindings.referenceOrRefusal, "publication reference"],
    [attempt.protocol, produce.packet.bindings.scienceProtocol, "produce science protocol"],
    [attempt.referenceOrRefusal, produce.packet.bindings.referenceOrRefusal, "produce reference"],
  ] as const) phase10C0VS6SameIdentity(actual, expected, label);

  const science = onePublishedOutput(produce, "out-c0v-radial-protocol", attempt.protocol);
  const reference = onePublishedOutput(produce, "out-c0v-radial-reference", attempt.referenceOrRefusal);
  onePublishedOutput(produce, "out-c0v-radial-attempt-ledger", ledgerIdentity);
  const referenceEnvelope = parsePhase10C0VReferenceEnvelope(
    phase10C0VS6ParsePrettyJson(reference.bytes, "deep radial reference"),
  );
  if (referenceEnvelope.layerId !== "C0V-RADIAL" ||
    referenceEnvelope.branch !== "independent-reference" ||
    referenceEnvelope.disposition !== "reference-frozen") {
    fail("deep radial reference does not select the frozen-reference route");
  }
  phase10C0VS6SameIdentity(referenceEnvelope.protocol, attempt.protocol, "radial reference protocol");

  let witness: Readonly<{ readonly identity: Phase10C0VS6ArtifactIdentity; readonly bytes: Uint8Array }> | null = null;
  let evaluation: Readonly<{ readonly identity: Phase10C0VS6ArtifactIdentity; readonly bytes: Uint8Array }> | null = null;
  if (productionComplete) {
    witness = onePublishedOutput(produce, "out-c0v-radial-witness");
    evaluation = onePublishedOutput(produce, "out-c0v-radial-evaluation");
    const parsedEvaluation = parsePhase10C0VS6RadialEvaluationBytes(evaluation.bytes, produce.packet);
    phase10C0VS6SameIdentity(parsedEvaluation.witness, witness.identity, "radial evaluation witness");
    if (parsedEvaluation.artifactDisposition !== "valid" ||
      parsedEvaluation.numericalDisposition !== attempt.terminalStatus) {
      fail("radial evaluation differs from its selected attempt disposition");
    }
  }

  const resultIdentity = phase10C0VS6ArtifactIdentity(resultPath, request.candidate.resultBytes);
  const expectedResult = Object.freeze({
    schema: "phase10-c0v-radial-result-v2" as const,
    resultId: "c0v-radial-result-v2" as const,
    layerId: "C0V-RADIAL" as const,
    branch: "independent-reference" as const,
    protocol: attempt.protocol,
    referenceOrRefusal: attempt.referenceOrRefusal,
    attemptLedger: ledgerIdentity,
    selectedAttemptId: attempt.attemptId,
    attemptDispositionCode: attempt.dispositionCode,
    witness: witness?.identity ?? null,
    evaluation: evaluation?.identity ?? null,
    terminalStatus: attempt.terminalStatus,
    scientificDisposition: attempt.terminalStatus,
    negativeControlDisposition: productionComplete ? "pass" as const : "not-accepted-no-credit" as const,
    resourceDisposition: productionComplete
      ? "within-cap" as const
      : attempt.dispositionCode === "preproduction-artifact-refusal"
        ? "artifact-refusal" as const
        : attempt.dispositionCode as "prelaunch-resource-refusal" | "registered-cap-resource-refusal",
    claimBoundary: publicationPacket.claimBoundary,
  }) as Phase10C0VS6RadialResultV2;
  phase10C0VS6SameJson(
    parsePhase10C0VS6RadialResultV2(
      phase10C0VS6ParsePrettyJson(request.candidate.resultBytes, "radial publication candidate result"),
      "radial publication candidate result",
    ),
    expectedResult,
    "radial publication result rederivation",
  );
  exactRoster(expectedResult.claimBoundary.allowed, publicationPacket.claimBoundary.allowed, "allowed claim boundary");
  exactRoster(expectedResult.claimBoundary.forbidden, publicationPacket.claimBoundary.forbidden, "forbidden claim boundary");

  const entries = [
    artifactEntry(
      "out-c0v-radial-attempt-ledger",
      ledgerIdentity,
      "attempt-ledger",
      "phase10-c0v-radial-attempt-receipt-writer",
    ),
    artifactEntry(
      "out-c0v-radial-protocol",
      science.identity,
      "science-protocol",
      "phase10-c0v-radial-protocol-producer",
    ),
    artifactEntry(
      "out-c0v-radial-reference",
      reference.identity,
      "independent-reference",
      "phase10-c0v-radial-reference-producer",
    ),
    artifactEntry(
      "out-c0v-radial-result",
      resultIdentity,
      "layer-result",
      "phase10-c0v-radial-publish-producer",
    ),
  ];
  if (witness !== null) entries.push(artifactEntry(
    "out-c0v-radial-witness",
    witness.identity,
    "production-witness",
    "phase10-c0v-radial-production-producer",
  ));
  if (evaluation !== null) entries.push(artifactEntry(
    "out-c0v-radial-evaluation",
    evaluation.identity,
    "independent-evaluation",
    "phase10-c0v-radial-evaluation-receipt-writer",
  ));
  const expectedIndex: Phase10C0VMovingArtifactIndex = Object.freeze({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-numerical-verification-v1",
    artifacts: Object.freeze(entries.sort((left, right) => compareText(left.artifactId, right.artifactId))),
  });
  phase10C0VS6SameJson(
    phase10C0VS6ParsePrettyJson(request.candidate.artifactIndexBytes, "radial publication candidate index"),
    expectedIndex,
    "radial publication artifact graph rederivation",
  );
  if (publicationPacket.paths.allowedPublicationPaths.filter((path) => path === resultPath).length !== 1 ||
    publicationPacket.paths.allowedPublicationPaths.filter((path) => path === indexPath).length !== 1) {
    fail("radial publication output paths are not uniquely registered");
  }
  const checkIds = Object.freeze([
    "chk-c0v-radial-artifact-graph",
    "chk-c0v-radial-terminal-disposition",
    "chk-c0v-radial-verdict-rederived",
  ] as const);
  const checkResults = Object.freeze(checkIds.map((checkId, index) => Object.freeze({
    checkId,
    verdict: "pass" as const,
    reasons: Object.freeze([]) as readonly [],
    witnessOutputIds: Object.freeze(index === 0
      ? ["out-c0v-radial-artifact-index"]
      : ["out-c0v-radial-result"]),
  })));
  return Object.freeze({
    schema: "phase10-c0v-publication-evaluation-v1",
    packetId: "c0v-radial-publish",
    evaluatorCallableId: "phase10-c0v-radial-publication-verifier",
    selectedAttempt: attempt,
    result: expectedResult,
    artifactIndex: expectedIndex,
    resultIdentity,
    artifactIndexIdentity: phase10C0VS6ArtifactIdentity(indexPath, request.candidate.artifactIndexBytes),
    checkResults,
    aggregateVerdict: "pass",
  });
}

/** Pure static-publication evaluator over an already raw/deeply verified refusal token. */
export function independentlyEvaluatePhase10C0VStaticPublicationSemantic(
  request: Phase10C0VStaticPublicationSemanticRequest,
): Phase10C0VStaticPublicationSemanticEvaluation {
  const { publicationPacket, verifiedProduce: produce } = request;
  if (publicationPacket.packetId !== "c0v-static-publish" ||
    publicationPacket.executionMode !== "layer-publish" ||
    produce.packet.packetId !== "c0v-static-produce" ||
    produce.packet.executionMode !== "preimplementation-refusal") {
    fail("packet identities or execution modes differ from the static publication route");
  }
  if (produce.selectedAttempt === null || produce.attemptLedgerIdentity === null ||
    produce.attemptLedgerBytes === null) {
    fail("deep static-produce token lacks its selected attempt or ledger");
  }
  const attempt = produce.selectedAttempt;
  const ledgerIdentity = produce.attemptLedgerIdentity;
  const ledgerPath = "evidence/phase10-numerical-verification-v1/c0v-static-attempts.jsonl";
  const resultPath = "evidence/phase10-numerical-verification-v1/c0v-static-result.json";
  const indexPath = "evidence/phase10-numerical-verification-v1/c0v-static-artifact-index.json";
  if (ledgerIdentity.path !== ledgerPath) fail("static attempt ledger path differs");
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(ledgerPath, produce.attemptLedgerBytes),
    ledgerIdentity,
    "static attempt ledger bytes",
  );
  const ledgerRows = parsePhase10C0VS6AttemptLedgerV2(
    produce.attemptLedgerBytes,
    "deep static attempt ledger",
  );
  if (ledgerRows.length !== 1) fail("static v1 ledger must contain exactly one selected attempt");
  phase10C0VS6SameJson(ledgerRows[0]!, attempt, "deep static selected attempt");
  if (attempt.layerId !== "C0V-STATIC" || attempt.branch !== "reference-refusal" ||
    attempt.dispositionCode !== "preimplementation-reference-refusal" ||
    attempt.terminalStatus !== "refusal" || attempt.classificationValidation?.verdict !== "pass" ||
    attempt.executionRecord.acceptedValidWitnessCount !== 0 ||
    attempt.executionRecord.acceptedNumericalVerdictCount !== 0) {
    fail("static attempt is not the independently classified preimplementation refusal");
  }
  if (publicationPacket.bindings.scienceProtocol === null ||
    publicationPacket.bindings.referenceOrRefusal === null ||
    produce.packet.bindings.scienceProtocol === null ||
    produce.packet.bindings.referenceOrRefusal === null) {
    fail("static packet science/refusal bindings are absent");
  }
  for (const [actual, expected, label] of [
    [attempt.protocol, publicationPacket.bindings.scienceProtocol, "publication science protocol"],
    [attempt.referenceOrRefusal, publicationPacket.bindings.referenceOrRefusal, "publication refusal"],
    [attempt.protocol, produce.packet.bindings.scienceProtocol, "produce science protocol"],
    [attempt.referenceOrRefusal, produce.packet.bindings.referenceOrRefusal, "produce refusal"],
  ] as const) phase10C0VS6SameIdentity(actual, expected, label);

  const science = onePublishedOutput(produce, "out-c0v-static-protocol", attempt.protocol);
  const refusal = onePublishedOutput(
    produce,
    "out-c0v-static-reference-refusal",
    attempt.referenceOrRefusal,
  );
  onePublishedOutput(produce, "out-c0v-static-attempt-ledger", ledgerIdentity);
  const refusalEnvelope = parsePhase10C0VReferenceRefusal(
    phase10C0VS6ParsePrettyJson(refusal.bytes, "deep static refusal"),
  );
  if (refusalEnvelope.layerId !== "C0V-STATIC" || refusalEnvelope.branch !== "reference-refusal" ||
    refusalEnvelope.reasonCode !== "current-contract-lacks-independent-static-spatial-reference-v1") {
    fail("deep static refusal does not select the scoped preimplementation route");
  }
  phase10C0VS6SameIdentity(refusalEnvelope.protocol, attempt.protocol, "static refusal protocol");

  const expectedResult: Phase10C0VStaticLayerResult = Object.freeze({
    schema: "phase10-c0v-static-result-v1",
    resultId: "c0v-static-result-v1",
    layerId: "C0V-STATIC",
    branch: "reference-refusal",
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
    phase10C0VS6ParsePrettyJson(request.candidate.resultBytes, "static publication candidate result"),
    expectedResult,
    "static publication result rederivation",
  );
  exactRoster(expectedResult.claimBoundary.allowed, publicationPacket.claimBoundary.allowed, "allowed claim boundary");
  exactRoster(expectedResult.claimBoundary.forbidden, publicationPacket.claimBoundary.forbidden, "forbidden claim boundary");

  const resultIdentity = phase10C0VS6ArtifactIdentity(resultPath, request.candidate.resultBytes);
  const expectedIndex: Phase10C0VMovingArtifactIndex = Object.freeze({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-numerical-verification-v1",
    artifacts: Object.freeze([
      artifactEntry(
        "out-c0v-static-attempt-ledger",
        ledgerIdentity,
        "attempt-ledger",
        "phase10-c0v-static-attempt-receipt-writer",
      ),
      artifactEntry(
        "out-c0v-static-protocol",
        science.identity,
        "science-protocol",
        "phase10-c0v-static-protocol-producer",
      ),
      artifactEntry(
        "out-c0v-static-reference-refusal",
        refusal.identity,
        "reference-refusal",
        "phase10-c0v-static-refusal-receipt-writer",
      ),
      artifactEntry(
        "out-c0v-static-result",
        resultIdentity,
        "layer-result",
        "phase10-c0v-static-publish-producer",
      ),
    ].sort((left, right) => compareText(left.artifactId, right.artifactId))),
  });
  phase10C0VS6SameJson(
    phase10C0VS6ParsePrettyJson(request.candidate.artifactIndexBytes, "static publication candidate index"),
    expectedIndex,
    "static publication artifact graph rederivation",
  );
  if (publicationPacket.paths.allowedPublicationPaths.filter((path) => path === resultPath).length !== 1 ||
    publicationPacket.paths.allowedPublicationPaths.filter((path) => path === indexPath).length !== 1) {
    fail("static publication output paths are not uniquely registered");
  }
  const checkIds = Object.freeze([
    "chk-c0v-static-artifact-graph",
    "chk-c0v-static-terminal-disposition",
    "chk-c0v-static-verdict-rederived",
  ] as const);
  const checkResults = Object.freeze(checkIds.map((checkId, index) => Object.freeze({
    checkId,
    verdict: "pass" as const,
    reasons: Object.freeze([]) as readonly [],
    witnessOutputIds: Object.freeze(index === 0
      ? ["out-c0v-static-artifact-index"]
      : ["out-c0v-static-result"]),
  })));
  return Object.freeze({
    schema: "phase10-c0v-publication-evaluation-v1",
    packetId: "c0v-static-publish",
    evaluatorCallableId: "phase10-c0v-static-publication-verifier",
    selectedAttempt: attempt,
    result: expectedResult,
    artifactIndex: expectedIndex,
    resultIdentity,
    artifactIndexIdentity: phase10C0VS6ArtifactIdentity(indexPath, request.candidate.artifactIndexBytes),
    checkResults,
    aggregateVerdict: "pass",
  });
}
