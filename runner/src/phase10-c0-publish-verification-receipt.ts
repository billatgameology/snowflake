import {
  parsePhase10CallableRegistry,
  parsePhase10PacketProtocol,
} from "./phase10-contracts.ts";
import {
  PHASE10_C0_MATRIX_ID,
  PHASE10_C0_DERIVE_OUTPUTS,
  PHASE10_C0_PUBLISH_OUTPUTS,
  PHASE10_C0_PUBLISH_CHECK_IDS,
  phase10C0AssertBoundExecution,
  phase10C0Lexical,
  phase10C0ParsePrettyJson,
  phase10C0PrettyJsonBytes,
  phase10C0Sha256,
  type Phase10C0ExecutionProvenance,
} from "./phase10-c0-contracts.ts";
import type { Phase10C0PublicationEvaluation } from "./phase10-c0-publication-verifier.ts";

export const PHASE10_C0_PUBLISH_VERIFICATION_ID =
  "phase10-c0-publication-verification-v1";
export const PHASE10_C0_PUBLISH_VERIFICATION_LIMITS = Object.freeze([
  "The publication verifier checked only the six C0 content/index artifacts and their registered graph.",
  "No solver execution, absolute-accuracy reference, target score, robust habit claim, or quantitative validation was checked.",
  "The receipt excludes its own byte identity and relies on the later terminal receipt and repository evidence manifest for closure.",
].sort(phase10C0Lexical));

export interface Phase10C0PublishVerificationReceiptRequest {
  readonly packetProtocolBytes: Uint8Array;
  readonly callableRegistryBytes: Uint8Array;
  readonly evaluatorModuleBytes: Uint8Array;
  readonly preflightReceiptBytes: Uint8Array;
  readonly evaluation: Phase10C0PublicationEvaluation;
  readonly execution: Phase10C0ExecutionProvenance;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0 publication verification receipt refused: ${message}`);
}

function exact(actual: readonly string[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    fail(`${label} differs from the exact sorted registration`);
  }
}

const VERIFIED_ARTIFACTS = Object.freeze({
  "out-c0-analysis": PHASE10_C0_DERIVE_OUTPUTS["out-c0-analysis"].path,
  "out-c0-artifact-index": PHASE10_C0_PUBLISH_OUTPUTS["out-c0-artifact-index"].path,
  "out-c0-comparisons": PHASE10_C0_DERIVE_OUTPUTS["out-c0-comparisons"].path,
  "out-c0-gaps": PHASE10_C0_DERIVE_OUTPUTS["out-c0-gaps"].path,
  "out-c0-historical-limit": PHASE10_C0_DERIVE_OUTPUTS["out-c0-historical-limit"].path,
  "out-c0-report": PHASE10_C0_PUBLISH_OUTPUTS["out-c0-report"].path,
});

const CHECK_WITNESSES = Object.freeze({
  "chk-c0-publish-artifact-graph": Object.freeze(["out-c0-artifact-index"]),
  "chk-c0-publish-breakdown": Object.freeze(["out-c0-analysis", "out-c0-comparisons", "out-c0-report"]),
  "chk-c0-publish-gap-list": Object.freeze(["out-c0-gaps", "out-c0-report"]),
  "chk-c0-publish-historical-limit": Object.freeze(["out-c0-historical-limit", "out-c0-report"]),
  "chk-c0-publish-no-habit-claim": Object.freeze(["out-c0-report"]),
});

function exactFields(value: object, expected: readonly string[], label: string): void {
  exact(Object.keys(value).sort(phase10C0Lexical), [...expected].sort(phase10C0Lexical), `${label} fields`);
}

/** Build the externally defined C0 independent-verification receipt for executor persistence. */
export function writePhase10C0PublishVerificationReceipt(
  request: Phase10C0PublishVerificationReceiptRequest,
): Uint8Array {
  phase10C0AssertBoundExecution(request.execution, request.preflightReceiptBytes, "c0-publish");
  const packetProtocol = parsePhase10PacketProtocol(
    phase10C0ParsePrettyJson(request.packetProtocolBytes, "C0 publish packet protocol"),
  );
  const registry = parsePhase10CallableRegistry(
    phase10C0ParsePrettyJson(request.callableRegistryBytes, "C0 publish callable registry"),
  );
  if (
    packetProtocol.packetId !== "c0-publish" || registry.packetId !== "c0-publish" ||
    packetProtocol.matrixId !== PHASE10_C0_MATRIX_ID || registry.matrixId !== PHASE10_C0_MATRIX_ID ||
    packetProtocol.protocolId !== registry.protocolId
  ) fail("packet protocol and callable registry identities differ");
  exact(packetProtocol.registeredCheckIds, PHASE10_C0_PUBLISH_CHECK_IDS, "publication checks");
  exact(packetProtocol.registeredNegativeControlIds, [], "publication controls");
  exact(packetProtocol.boundDependencyPacketIds, ["a-p", "c0-derive"], "publication dependencies");
  const evaluator = registry.callables.filter((callable) => callable.callableId === "phase10-c0-publication-verifier");
  if (evaluator.length !== 1) fail("callable registry does not resolve exactly one publication verifier");
  const binding = evaluator[0]!;
  if (
    binding.resolution !== "resolved" || binding.identity === null ||
    binding.role !== "independent-evaluator" ||
    binding.modulePath !== "runner/src/phase10-c0-publication-verifier.ts" ||
    binding.exportName !== "phase10C0PublicationVerifier" ||
    binding.identity.byteLength !== request.evaluatorModuleBytes.byteLength ||
    binding.identity.sha256 !== phase10C0Sha256(request.evaluatorModuleBytes) ||
    binding.evaluatedCheckIds.length !== PHASE10_C0_PUBLISH_CHECK_IDS.length ||
    binding.evaluatedCheckIds.some((checkId, index) => checkId !== PHASE10_C0_PUBLISH_CHECK_IDS[index])
  ) fail("publication verifier module differs from the resolved callable registry");
  exact(request.evaluation.checkResults.map((result) => result.checkId), PHASE10_C0_PUBLISH_CHECK_IDS, "publication check results");
  exact(request.evaluation.executedNegativeControlIds, [], "publication executed controls");
  exact(request.evaluation.boundDependencyPacketIds, ["a-p", "c0-derive"], "publication evaluation dependencies");
  const expectedOutputIds = Object.keys(VERIFIED_ARTIFACTS).sort(phase10C0Lexical);
  exact(request.evaluation.verifiedArtifacts.map((artifact) => artifact.outputId), expectedOutputIds, "publication verified artifacts");
  for (const artifact of request.evaluation.verifiedArtifacts) {
    exactFields(artifact, ["outputId", "path", "byteLength", "sha256"], `${artifact.outputId} verified artifact`);
    const expectedPath = VERIFIED_ARTIFACTS[artifact.outputId as keyof typeof VERIFIED_ARTIFACTS];
    if (
      expectedPath === undefined || artifact.path !== expectedPath ||
      !Number.isSafeInteger(artifact.byteLength) || artifact.byteLength < 0 ||
      !/^[0-9a-f]{64}$/u.test(artifact.sha256)
    ) fail(`${artifact.outputId} verified artifact tuple differs from registration`);
  }
  for (const result of request.evaluation.checkResults) {
    exactFields(result, ["checkId", "verdict", "reasons", "witnessOutputIds"], `${result.checkId} check result`);
    const expectedWitnesses = CHECK_WITNESSES[result.checkId];
    if (
      result.reasons.some((reason, index) => typeof reason !== "string" || (index > 0 && result.reasons[index - 1]! >= reason)) ||
      expectedWitnesses === undefined || result.witnessOutputIds.length !== expectedWitnesses.length ||
      result.witnessOutputIds.some((outputId, index) => outputId !== expectedWitnesses[index])
    ) fail(`${result.checkId} result/witness contract differs`);
  }
  if (
    request.evaluation.aggregateVerdict !== "pass" ||
    request.evaluation.checkResults.some((result) => result.verdict !== "pass" || result.reasons.length !== 0)
  ) fail("a non-passing publication evaluation cannot produce the complete receipt");
  return phase10C0PrettyJsonBytes({
    schema: "phase10-independent-verification-v1",
    verificationId: PHASE10_C0_PUBLISH_VERIFICATION_ID,
    matrixId: PHASE10_C0_MATRIX_ID,
    protocolId: packetProtocol.protocolId,
    registryId: registry.registryId,
    packetId: "c0-publish",
    terminalState: "complete",
    verifiedArtifacts: request.evaluation.verifiedArtifacts,
    checkResults: request.evaluation.checkResults,
    executedNegativeControlIds: [],
    boundDependencyPacketIds: ["a-p", "c0-derive"],
    execution: request.execution,
    aggregateVerdict: "pass",
    limits: PHASE10_C0_PUBLISH_VERIFICATION_LIMITS,
  });
}
