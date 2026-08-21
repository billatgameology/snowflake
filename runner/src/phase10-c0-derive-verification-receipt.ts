import {
  parsePhase10CallableRegistry,
  parsePhase10PacketProtocol,
} from "./phase10-contracts.ts";
import { canonicalJson, strictJsonSnapshot } from "./gate4-evidence.ts";
import {
  PHASE10_C0_DERIVE_CHECK_IDS,
  PHASE10_C0_DERIVE_OUTPUTS,
  PHASE10_C0_NEGATIVE_CONTROL_IDS,
  PHASE10_C0_MATRIX_ID,
  phase10C0AssertBoundEvaluatorExecution,
  phase10C0Lexical,
  phase10C0ParsePrettyJson,
  phase10C0PrettyJsonBytes,
  phase10C0Sha256,
} from "./phase10-c0-contracts.ts";
import type {
  Phase10C0DeriveEvaluation,
  Phase10C0EvaluatorExecution,
} from "./phase10-c0-independent.ts";

export const PHASE10_C0_DERIVE_VERIFICATION_ID =
  "phase10-c0-derive-verification-v1";
export const PHASE10_C0_DERIVE_VERIFICATION_LIMITS = Object.freeze([
  "C0 re-derives persisted Phase 6 row diagnostics only; it executes no solver.",
  "C0 does not establish absolute solver accuracy, a robust habit observable, a target score, or quantitative validation.",
  "The verification excludes its own byte identity and the later packet terminal receipt to preserve the registered acyclic lifecycle.",
].sort(phase10C0Lexical));

export interface Phase10C0DeriveVerificationReceiptRequest {
  readonly packetProtocolBytes: Uint8Array;
  readonly callableRegistryBytes: Uint8Array;
  readonly preflightReceiptBytes: Uint8Array;
  readonly evaluation: Phase10C0DeriveEvaluation;
  readonly execution: Phase10C0EvaluatorExecution;
  readonly evaluatorCwd: string;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0 derive verification receipt refused: ${message}`);
}

function exact(actual: readonly string[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    fail(`${label} differs from the exact sorted registration`);
  }
}

const CHECK_WITNESSES = Object.freeze({
  "chk-c0-all-spacings": Object.freeze(["out-c0-comparisons"]),
  "chk-c0-comparison-roster": Object.freeze(["out-c0-comparisons"]),
  "chk-c0-cost-separation": Object.freeze(["out-c0-analysis"]),
  "chk-c0-field-allowlist": Object.freeze(["out-c0-analysis", "out-c0-gaps"]),
  "chk-c0-independent-rederivation": Object.freeze(["out-c0-analysis", "out-c0-comparisons"]),
  "chk-c0-no-solver": Object.freeze(["out-c0-analysis"]),
  "chk-c0-operand-echo": Object.freeze(["out-c0-comparisons"]),
  "chk-c0-row-roster": Object.freeze(["out-c0-comparisons"]),
});

const CONTROL_ARTIFACTS = Object.freeze({
  "nc-c0-coarse-fail-fine-pass": Object.freeze({ artifactId: "out-c0-comparisons", path: PHASE10_C0_DERIVE_OUTPUTS["out-c0-comparisons"].path }),
  "nc-c0-duplicate-or-truncated": Object.freeze({ artifactId: "input-c0-rows", path: "evidence/phase6-wp2-ladder/rows.jsonl" }),
  "nc-c0-fine-fail-coarse-pass": Object.freeze({ artifactId: "out-c0-comparisons", path: PHASE10_C0_DERIVE_OUTPUTS["out-c0-comparisons"].path }),
  "nc-c0-forbidden-field": Object.freeze({ artifactId: "out-c0-analysis", path: PHASE10_C0_DERIVE_OUTPUTS["out-c0-analysis"].path }),
  "nc-c0-forged-producer-verdict": Object.freeze({ artifactId: "out-c0-analysis", path: PHASE10_C0_DERIVE_OUTPUTS["out-c0-analysis"].path }),
  "nc-c0-missing-row": Object.freeze({ artifactId: "input-c0-rows", path: "evidence/phase6-wp2-ladder/rows.jsonl" }),
  "nc-c0-operand-echo": Object.freeze({ artifactId: "out-c0-comparisons", path: PHASE10_C0_DERIVE_OUTPUTS["out-c0-comparisons"].path }),
});

function exactFields(value: object, expected: readonly string[], label: string): void {
  exact(Object.keys(value).sort(phase10C0Lexical), [...expected].sort(phase10C0Lexical), `${label} fields`);
}

function assertEvaluatorExecution(request: Phase10C0DeriveVerificationReceiptRequest): void {
  const execution = request.execution;
  exactFields(execution, ["evaluatorCallableId", "modulePath", "exportName", "byteLength", "sha256", "runtime", "command", "gitHead", "startedOn", "endedOn", "processConcurrency"], "evaluator execution");
  if (
    execution.evaluatorCallableId !== "phase10-c0-evaluator" ||
    execution.modulePath !== "runner/src/phase10-c0-independent.ts" ||
    execution.exportName !== "independentlyEvaluatePhase10C0Derive" ||
    !Number.isSafeInteger(execution.byteLength) || execution.byteLength <= 0 ||
    !/^[0-9a-f]{64}$/u.test(execution.sha256)
  ) fail("evaluator execution provenance differs from the frozen C0 dispatch contract");
  phase10C0AssertBoundEvaluatorExecution(execution, request.evaluatorCwd, request.preflightReceiptBytes, "c0-derive");
}

/** Build the generic packet-verification receipt; the shared executor owns its durable write. */
export function writePhase10C0DeriveVerificationReceipt(
  request: Phase10C0DeriveVerificationReceiptRequest,
): Uint8Array {
  assertEvaluatorExecution(request);
  const packetProtocol = parsePhase10PacketProtocol(
    phase10C0ParsePrettyJson(request.packetProtocolBytes, "C0 derive packet protocol"),
  );
  const registry = parsePhase10CallableRegistry(
    phase10C0ParsePrettyJson(request.callableRegistryBytes, "C0 derive callable registry"),
  );
  if (
    packetProtocol.packetId !== "c0-derive" || registry.packetId !== "c0-derive" ||
    packetProtocol.matrixId !== PHASE10_C0_MATRIX_ID || registry.matrixId !== PHASE10_C0_MATRIX_ID ||
    packetProtocol.protocolId !== registry.protocolId
  ) fail("packet protocol and callable registry identities differ");
  exact(packetProtocol.registeredCheckIds, PHASE10_C0_DERIVE_CHECK_IDS, "derive checks");
  exact(packetProtocol.registeredNegativeControlIds, PHASE10_C0_NEGATIVE_CONTROL_IDS, "derive controls");
  exact(packetProtocol.boundDependencyPacketIds, ["a-p"], "derive dependencies");
  const evaluator = registry.callables.filter((callable) => callable.callableId === "phase10-c0-evaluator");
  if (evaluator.length !== 1) fail("callable registry does not resolve exactly one C0 evaluator");
  const binding = evaluator[0]!;
  if (
    binding.resolution !== "resolved" || binding.identity === null ||
    binding.role !== "independent-evaluator" ||
    binding.modulePath !== request.execution.modulePath ||
    binding.exportName !== request.execution.exportName ||
    binding.identity.byteLength !== request.execution.byteLength ||
    binding.identity.sha256 !== request.execution.sha256 ||
    binding.evaluatedCheckIds.length !== PHASE10_C0_DERIVE_CHECK_IDS.length ||
    binding.evaluatedCheckIds.some((checkId, index) => checkId !== PHASE10_C0_DERIVE_CHECK_IDS[index])
  ) fail("evaluator execution identity differs from the resolved callable registry");
  exact(request.evaluation.checkResults.map((result) => result.checkId), PHASE10_C0_DERIVE_CHECK_IDS, "evaluated checks");
  exact(request.evaluation.executedNegativeControlIds, PHASE10_C0_NEGATIVE_CONTROL_IDS, "executed controls");
  exact(request.evaluation.negativeControlResults.map((result) => result.negativeControlId), PHASE10_C0_NEGATIVE_CONTROL_IDS, "control results");
  const pass = request.evaluation.checkResults.every((result) => result.verdict === "pass") &&
    request.evaluation.negativeControlResults.every((result) =>
      result.mutationExecuted && result.rejected && result.errors.length === 0);
  if (
    request.evaluation.aggregateVerdict !== (pass ? "pass" : "fail") ||
    request.evaluation.terminalState !== (pass ? "complete" : "fail")
  ) fail("evaluation aggregate or terminal state is not derived from checks and controls");
  const expectedOutputIds = ["out-c0-analysis", "out-c0-comparisons", "out-c0-gaps", "out-c0-historical-limit"] as const;
  exact(request.evaluation.verifiedArtifacts.map((artifact) => artifact.outputId), expectedOutputIds, "verified artifacts");
  for (const artifact of request.evaluation.verifiedArtifacts) {
    exactFields(artifact, ["outputId", "path", "byteLength", "sha256"], `${artifact.outputId} verified artifact`);
    const registration = PHASE10_C0_DERIVE_OUTPUTS[artifact.outputId as keyof typeof PHASE10_C0_DERIVE_OUTPUTS];
    if (
      registration === undefined || artifact.path !== registration.path ||
      !Number.isSafeInteger(artifact.byteLength) || artifact.byteLength < 0 ||
      !/^[0-9a-f]{64}$/u.test(artifact.sha256)
    ) fail(`${artifact.outputId} verified artifact tuple differs from registration`);
  }
  for (const result of request.evaluation.checkResults) {
    exactFields(result, ["checkId", "verdict", "reasons", "witnessOutputIds"], `${result.checkId} check result`);
    const expectedWitnesses = CHECK_WITNESSES[result.checkId];
    if (
      (pass && (result.verdict !== "pass" || result.reasons.length !== 0)) ||
      result.reasons.some((reason, index) => typeof reason !== "string" || (index > 0 && result.reasons[index - 1]! >= reason)) ||
      expectedWitnesses === undefined ||
      result.witnessOutputIds.length !== expectedWitnesses.length ||
      result.witnessOutputIds.some((outputId, index) => outputId !== expectedWitnesses[index])
    ) fail(`${result.checkId} result/witness contract differs`);
  }
  for (const result of request.evaluation.negativeControlResults) {
    exactFields(result, ["negativeControlId", "mutationExecuted", "rejected", "beforeWitness", "afterWitness", "errors"], `${result.negativeControlId} control result`);
    exactFields(result.beforeWitness, ["artifactId", "path", "byteLength", "sha256", "semanticFingerprint"], `${result.negativeControlId} before witness`);
    exactFields(result.afterWitness, ["artifactId", "path", "byteLength", "sha256", "semanticFingerprint"], `${result.negativeControlId} after witness`);
    exactFields(result.beforeWitness.semanticFingerprint, ["projection", "sha256"], `${result.negativeControlId} before semantic fingerprint`);
    exactFields(result.afterWitness.semanticFingerprint, ["projection", "sha256"], `${result.negativeControlId} after semantic fingerprint`);
    const expectedArtifact = CONTROL_ARTIFACTS[result.negativeControlId];
    const beforeSemanticSha = phase10C0Sha256(new TextEncoder().encode(canonicalJson(strictJsonSnapshot(result.beforeWitness.semanticFingerprint.projection))));
    const afterSemanticSha = phase10C0Sha256(new TextEncoder().encode(canonicalJson(strictJsonSnapshot(result.afterWitness.semanticFingerprint.projection))));
    if (
      (pass && (!result.mutationExecuted || !result.rejected || result.errors.length !== 0)) ||
      result.errors.some((error, index) => typeof error !== "string" || (index > 0 && result.errors[index - 1]! >= error)) ||
      expectedArtifact === undefined ||
      result.beforeWitness.artifactId !== expectedArtifact.artifactId || result.afterWitness.artifactId !== expectedArtifact.artifactId ||
      result.beforeWitness.path !== expectedArtifact.path || result.afterWitness.path !== expectedArtifact.path ||
      !Number.isSafeInteger(result.beforeWitness.byteLength) || result.beforeWitness.byteLength < 0 ||
      !Number.isSafeInteger(result.afterWitness.byteLength) || result.afterWitness.byteLength < 0 ||
      !/^[0-9a-f]{64}$/u.test(result.beforeWitness.sha256) ||
      !/^[0-9a-f]{64}$/u.test(result.afterWitness.sha256) ||
      !/^[0-9a-f]{64}$/u.test(result.beforeWitness.semanticFingerprint.sha256) ||
      !/^[0-9a-f]{64}$/u.test(result.afterWitness.semanticFingerprint.sha256) ||
      result.beforeWitness.semanticFingerprint.sha256 !== beforeSemanticSha ||
      result.afterWitness.semanticFingerprint.sha256 !== afterSemanticSha ||
      (pass && (
        result.beforeWitness.sha256 === result.afterWitness.sha256 ||
        result.beforeWitness.semanticFingerprint.sha256 === result.afterWitness.semanticFingerprint.sha256
      ))
    ) fail(`${result.negativeControlId} mutation witness contract differs`);
  }
  return phase10C0PrettyJsonBytes({
    schema: "phase10-packet-verification-v1",
    verificationId: PHASE10_C0_DERIVE_VERIFICATION_ID,
    matrixId: PHASE10_C0_MATRIX_ID,
    protocolId: packetProtocol.protocolId,
    registryId: registry.registryId,
    packetId: "c0-derive",
    terminalState: request.evaluation.terminalState,
    verifiedArtifacts: request.evaluation.verifiedArtifacts,
    checkResults: request.evaluation.checkResults,
    executedNegativeControlIds: request.evaluation.executedNegativeControlIds,
    negativeControlResults: request.evaluation.negativeControlResults,
    boundDependencyPacketIds: ["a-p"],
    execution: request.execution,
    aggregateVerdict: request.evaluation.aggregateVerdict,
    limits: PHASE10_C0_DERIVE_VERIFICATION_LIMITS,
  });
}
