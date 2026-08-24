import {
  parsePhase10C0VS6ArtifactIdentity,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6ExactOrderedKeys,
  phase10C0VS6IsoInstant,
  phase10C0VS6Object,
  phase10C0VS6ParsePrettyJson,
  phase10C0VS6SameIdentity,
  phase10C0VS6SameJson,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6ClassificationEvidence,
  type Phase10C0VS6ClassificationObservation,
} from "./phase10-c0v-s6-execution-contracts.ts";
import type {
  Phase10C0VS6PacketProtocol,
  Phase10C0VS6RetainedPreflight,
} from "./phase10-c0v-s6-contracts.ts";
import {
  derivePhase10C0VS6RetainedRuntimeAuthority,
  type Phase10C0VS6RawRuntimeAuthorityInput,
} from "./phase10-c0v-s6-runtime-authority.ts";
import {
  phase10C0VS6PhysicalRepositoryRoot,
  phase10C0VS6ReadUniquePhysicalFile,
} from "./phase10-c0v-s6-filesystem.ts";
import {
  parsePhase10C0VS6ExitStatusBytes,
  type Phase10C0VS6CauseEvaluationAuthority,
  type Phase10C0VS6CauseEvidence,
  type Phase10C0VS6CauseObservation,
} from "./phase10-c0v-s6-receipts.ts";
import {
  independentlyEvaluatePhase10C0VS6PacketWorkerInvocations,
  independentlyEvaluatePhase10C0VS6WorkerInvocations,
  type Phase10C0VS6PacketWorkerInvocationRecord,
} from "./phase10-c0v-s6-worker-invocation.ts";
import {
  parsePhase10C0VReferenceEnvelope,
  parsePhase10C0VReferenceRefusal,
} from "./phase10-c0v-contracts.ts";

const S5_SCIENCE_FREEZE_COMMIT = "cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9" as const;

const MOVING_CHECK_IDS = Object.freeze([
  "chk-c0v-moving-discrepancy-validity",
]);
const STATIC_CHECK_IDS = Object.freeze([
  "chk-c0v-static-refusal-validity",
]);

const MOVING_ALLOWED = Object.freeze([
  "artifact-derived generator/checker discrepancy recorded under the exact frozen protocol with no reference or agreement credit",
]);
const MOVING_FORBIDDEN = Object.freeze([
  "apparatus agreement",
  "habit robustness",
  "independent-check agreement",
  "mechanism validation",
  "moving-interface first-event reference generation and independent-check agreement under the exact tiny fixture",
  "physical realism",
  "prior-phase credit",
  "quantitative validation",
  "reference-frozen disposition",
  "topology, field, event-time, convergence, and ledger control under the frozen operands",
]);
const MOVING_PACKET_ALLOWED = Object.freeze([
  "pinned-reference-discrepancy-recording",
  "zero-solver-scientific-credit",
]);
const PACKET_FORBIDDEN = Object.freeze([
  "c1-through-c5-qualification",
  "model-tuning",
  "new-validation-label",
  "target-facing-score",
]);
const STATIC_ALLOWED = Object.freeze([
  "current-contract scoped static reference-independence refusal",
  "public accepted state and final-sweep same-discrete reconstruction are acknowledged while the independent-reference and order gap is named",
  "zero numerical and solver execution under this refusal branch",
]);
const STATIC_FORBIDDEN = Object.freeze([
  "all aggregate-v6 replacement operands are unavailable",
  "apparatus agreement",
  "habit robustness",
  "mechanism validation",
  "physical realism",
  "prior-phase credit",
  "quantitative validation",
  "same-discrete final-sweep reconstruction is unavailable",
  "universal impossibility of a future independent static reference",
]);
const STATIC_PACKET_ALLOWED = Object.freeze([
  "pinned-preimplementation-refusal",
  "zero-solver-scientific-credit",
]);
const STATIC_UNAVAILABLE_OPERANDS = Object.freeze([
  "analyticExpectedFieldOrder",
  "analyticExpectedFluxOrder",
  "independentContinuumBoundaryFluxReference",
  "independentContinuumFieldReference",
  "orderLowerBound",
]);
const STATIC_FORBIDDEN_SUBSTITUTES = Object.freeze([
  "same-discrete-replay-as-spatial-accuracy",
  "self-convergence-as-absolute-accuracy",
]);

export interface Phase10C0VS6RefusalInput extends Phase10C0VS6RawRuntimeAuthorityInput {
  readonly scienceProtocolBytes: Uint8Array;
  readonly scienceProtocolIdentity: Phase10C0VS6ArtifactIdentity;
  readonly referenceOrRefusalBytes: Uint8Array;
  readonly referenceOrRefusalIdentity: Phase10C0VS6ArtifactIdentity;
}

export interface Phase10C0VS6RefusalEvaluation {
  readonly layerId: "C0V-MOVING-EVENT" | "C0V-STATIC";
  readonly dispositionCode: "reference-discrepancy-refusal" | "preimplementation-reference-refusal";
  readonly observations: readonly Phase10C0VS6ClassificationObservation[];
  readonly evidence: readonly Phase10C0VS6ClassificationEvidence[];
  readonly verdict: "pass";
  readonly errors: readonly string[];
}

export interface Phase10C0VS6RefusalCheckCallerResult {
  readonly evaluation: Phase10C0VS6RefusalEvaluation;
  readonly terminalStatus: "refusal";
  readonly executedCheckIds: readonly string[];
  readonly evaluatedCheckIds: readonly string[];
  readonly executedNegativeControlIds: readonly string[];
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 refusal evaluator refused: ${message}`);
}

function exactStringArray(value: unknown, expected: readonly string[], label: string): void {
  if (
    !Array.isArray(value) || value.some((entry) => typeof entry !== "string") ||
    value.length !== expected.length || value.some((entry, index) => entry !== expected[index])
  ) fail(`${label} differs`);
}

function exactIdentityBytes(
  bytes: Uint8Array,
  expected: Phase10C0VS6ArtifactIdentity,
  label: string,
): void {
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(expected.path, bytes),
    expected,
    label,
  );
}

function passedObject(value: unknown, label: string): void {
  const row = phase10C0VS6Object(value, label);
  if (row.passed !== true) fail(`${label}.passed is not true`);
}

function zeroExecution(value: unknown, label: string): void {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "solverInvocations", "referenceInvocations", "productionInvocations", "witnessesProduced",
    "numericalEvaluations", "scientificProcessHours",
  ], label);
  for (const [key, observed] of Object.entries(row)) {
    if (observed !== 0 || Object.is(observed, -0)) fail(`${label}.${key} is not exact zero`);
  }
}

function classificationEvidence(
  input: Phase10C0VS6RefusalInput,
  packet: Phase10C0VS6PacketProtocol,
): readonly Phase10C0VS6ClassificationEvidence[] {
  return Object.freeze([
    Object.freeze({
      evidenceId: "evidence-packet-protocol",
      evidenceRole: "packet-protocol",
      retentionClass: "tracked-authority",
      artifact: input.packetProtocolIdentity,
      inlineObservationPath: null,
    }),
    Object.freeze({
      evidenceId: "evidence-preflight-receipt",
      evidenceRole: "preflight-receipt",
      retentionClass: "tracked-evidence",
      artifact: phase10C0VS6ArtifactIdentity(packet.paths.preflightReceiptPath, input.preflightBytes),
      inlineObservationPath: null,
    }),
    Object.freeze({
      evidenceId: "evidence-reference-or-refusal",
      evidenceRole: "reference-or-refusal",
      retentionClass: "tracked-evidence",
      artifact: input.referenceOrRefusalIdentity,
      inlineObservationPath: null,
    }),
    Object.freeze({
      evidenceId: "evidence-science-protocol",
      evidenceRole: "science-protocol",
      retentionClass: "tracked-authority",
      artifact: input.scienceProtocolIdentity,
      inlineObservationPath: null,
    }),
  ] satisfies readonly Phase10C0VS6ClassificationEvidence[]);
}

function observation(
  conditionId: string,
  kind: Phase10C0VS6ClassificationObservation["kind"],
  registeredValue: string | boolean | number | null,
  observedValue: string | boolean | number | null,
  unit: Phase10C0VS6ClassificationObservation["unit"],
  evidenceIds: readonly string[],
  comparator: Phase10C0VS6ClassificationObservation["comparator"] = "equal",
): Phase10C0VS6ClassificationObservation {
  const conditionPassed = comparator === "present"
    ? registeredValue === true && observedValue === true
    : Object.is(registeredValue, observedValue);
  if (!conditionPassed) fail(`${conditionId} did not establish the registered refusal condition`);
  return Object.freeze({
    conditionId,
    kind,
    comparator,
    registeredValue,
    observedValue,
    unit,
    conditionPassed,
    evidenceIds: Object.freeze([...evidenceIds]),
  });
}

function validateCommonInput(
  input: Phase10C0VS6RefusalInput,
  packetId: "c0v-moving-produce" | "c0v-static-produce",
): Readonly<{ readonly packet: Phase10C0VS6PacketProtocol; readonly preflight: Phase10C0VS6RetainedPreflight }> {
  const authority = derivePhase10C0VS6RetainedRuntimeAuthority(input);
  if (authority.packet.packetId !== packetId || authority.packet.bindings.scienceProtocol === null ||
    authority.packet.bindings.referenceOrRefusal === null) {
    fail("raw packet authority does not select the requested refusal layer");
  }
  if (authority.preflight.verdict !== "pass" || authority.preflight.refusalCandidate !== null) {
    fail("moving/static route-cause evaluation requires the exact retained PASS preflight");
  }
  exactIdentityBytes(input.scienceProtocolBytes, input.scienceProtocolIdentity, "science protocol bytes");
  exactIdentityBytes(input.referenceOrRefusalBytes, input.referenceOrRefusalIdentity, "reference/refusal bytes");
  phase10C0VS6SameIdentity(
    input.scienceProtocolIdentity,
    authority.packet.bindings.scienceProtocol,
    "raw-authority science protocol",
  );
  phase10C0VS6SameIdentity(
    input.referenceOrRefusalIdentity,
    authority.packet.bindings.referenceOrRefusal,
    "raw-authority reference/refusal",
  );
  return authority;
}

function validateScienceProtocol(
  bytes: Uint8Array,
  schema: string,
  protocolId: string,
  layerId: string,
  branch: string,
): void {
  const row = phase10C0VS6Object(phase10C0VS6ParsePrettyJson(bytes, `${layerId} science protocol`), `${layerId} science protocol`);
  if (
    row.schema !== schema || row.protocolId !== protocolId || row.layerId !== layerId || row.branch !== branch
  ) fail(`${layerId} science protocol identity fields differ`);
}

/**
 * Unregistered, parsing-only semantic reproof used after the governed caller has returned. It
 * reopens every raw authority byte and derives the exact semantic evaluation, but is not itself a
 * callable-registry evaluator and therefore cannot consume or earn another governed invocation.
 */
export function independentlyReprovePhase10C0VMovingDiscrepancyArtifacts(
  input: Phase10C0VS6RefusalInput,
): Phase10C0VS6RefusalEvaluation {
  const authority = validateCommonInput(input, "c0v-moving-produce");
  validateScienceProtocol(
    input.scienceProtocolBytes,
    "phase10-c0v-moving-protocol-v1",
    "phase10-c0v-moving-s5a-v1",
    "C0V-MOVING-EVENT",
    "independent-reference",
  );
  const movingJson = phase10C0VS6ParsePrettyJson(
    input.referenceOrRefusalBytes,
    "moving discrepancy artifact",
  );
  const deepMoving = parsePhase10C0VReferenceEnvelope(movingJson);
  if (
    deepMoving.layerId !== "C0V-MOVING-EVENT" ||
    deepMoving.disposition !== "reference-discrepancy-refusal"
  ) fail("deep moving reference codec did not select the discrepancy artifact");
  const row = phase10C0VS6Object(movingJson, "moving discrepancy artifact");
  phase10C0VS6ExactOrderedKeys(row, [
    "schema", "referenceId", "protocolId", "layerId", "branch", "protocol", "freezeCommit",
    "createdAt", "generatorOutput", "independentCheck", "codeAndImportReceipt", "comparison",
    "disposition", "claimBoundary",
  ], "moving discrepancy artifact");
  if (
    row.schema !== "phase10-c0v-moving-reference-v1" ||
    row.referenceId !== "phase10-c0v-moving-reference-v1" ||
    row.protocolId !== "phase10-c0v-moving-s5a-v1" || row.layerId !== "C0V-MOVING-EVENT" ||
    row.branch !== "independent-reference" || row.freezeCommit !== S5_SCIENCE_FREEZE_COMMIT ||
    row.disposition !== "reference-discrepancy-refusal"
  ) fail("moving discrepancy outer identity/disposition differs");
  phase10C0VS6IsoInstant(row.createdAt, "moving discrepancy createdAt");
  phase10C0VS6SameIdentity(
    parsePhase10C0VS6ArtifactIdentity(row.protocol, "moving discrepancy protocol"),
    input.scienceProtocolIdentity,
    "moving discrepancy science protocol",
  );
  const generator = phase10C0VS6Object(row.generatorOutput, "moving generator output");
  if (
    generator.schema !== "phase10-c0v-moving-reference-candidate-v1" ||
    generator.protocolId !== row.protocolId
  ) fail("moving generator output protocol differs");
  const check = phase10C0VS6Object(row.independentCheck, "moving independent check");
  phase10C0VS6ExactOrderedKeys(check, [
    "schema", "protocolId", "method", "monotonicityBracketResidual", "topologyChecks",
    "fieldEquationChecks", "eventChecks", "ledgerChecks", "verdict", "errors",
  ], "moving independent check");
  if (
    check.schema !== "phase10-c0v-moving-reference-check-v1" || check.protocolId !== row.protocolId ||
    check.verdict !== "fail" || !Array.isArray(check.errors) || check.errors.length === 0 ||
    check.errors.some((entry) => typeof entry !== "string")
  ) fail("moving independent check is not the retained nonempty failure");
  const scalarCheck = phase10C0VS6Object(
    check.monotonicityBracketResidual,
    "moving monotonicity/bracket/residual check",
  );
  if (scalarCheck.bracketed !== true || scalarCheck.derivativePositive !== true || scalarCheck.passed !== false) {
    fail("moving discrepancy ground differs");
  }
  passedObject(check.topologyChecks, "moving topology checks");
  passedObject(check.fieldEquationChecks, "moving field-equation checks");
  passedObject(check.eventChecks, "moving event checks");
  passedObject(check.ledgerChecks, "moving ledger checks");
  const comparison = phase10C0VS6Object(row.comparison, "moving comparison");
  phase10C0VS6ExactOrderedKeys(comparison, [
    "method", "expectedOutcome", "observedOutcome", "errors",
  ], "moving comparison");
  if (
    comparison.method !== "independent-reexecution" || comparison.expectedOutcome !== "pass" ||
    comparison.observedOutcome !== "fail"
  ) fail("moving expected/observed outcome comparison differs");
  phase10C0VS6SameJson(comparison.errors, check.errors, "moving comparison/check errors");
  const receipt = phase10C0VS6Object(row.codeAndImportReceipt, "moving code/import receipt");
  if (
    receipt.pass !== true || !Array.isArray(receipt.forbiddenImportsObserved) ||
    receipt.forbiddenImportsObserved.length !== 0 ||
    !Array.isArray(receipt.generatorCheckerScientificImportOverlap) ||
    receipt.generatorCheckerScientificImportOverlap.length !== 0
  ) fail("moving code/import receipt does not preserve separation");
  const boundary = phase10C0VS6Object(row.claimBoundary, "moving claim boundary");
  phase10C0VS6ExactOrderedKeys(boundary, ["allowed", "forbidden"], "moving claim boundary");
  exactStringArray(boundary.allowed, MOVING_ALLOWED, "moving allowed claims");
  exactStringArray(boundary.forbidden, MOVING_FORBIDDEN, "moving forbidden claims");
  exactStringArray(authority.packet.claimBoundary.allowed, MOVING_PACKET_ALLOWED, "moving packet allowed claims");
  exactStringArray(authority.packet.claimBoundary.forbidden, PACKET_FORBIDDEN, "moving packet forbidden claims");
  const evidence = classificationEvidence(input, authority.packet);
  const observations = Object.freeze([
    observation("cond-c0v-moving-science-protocol-identity", "artifact-identity", input.scienceProtocolIdentity.sha256, authority.packet.bindings.scienceProtocol!.sha256, "artifact-identity", ["evidence-science-protocol"], "identity-equal"),
    observation("cond-c0v-moving-reference-identity", "artifact-identity", input.referenceOrRefusalIdentity.sha256, authority.packet.bindings.referenceOrRefusal!.sha256, "artifact-identity", ["evidence-reference-or-refusal"], "identity-equal"),
    observation("cond-c0v-moving-expected-outcome", "reference-check-outcome", "pass", comparison.expectedOutcome as string, "outcome", ["evidence-reference-or-refusal"]),
    observation("cond-c0v-moving-observed-outcome", "reference-check-outcome", "fail", comparison.observedOutcome as string, "outcome", ["evidence-reference-or-refusal"]),
    observation("cond-c0v-moving-disposition", "reference-disposition", "reference-discrepancy-refusal", row.disposition as string, "disposition", ["evidence-reference-or-refusal"], "classified-as"),
    observation("cond-c0v-moving-independent-errors-present", "refusal-ground", true, true, "count", ["evidence-reference-or-refusal"], "present"),
    observation("cond-c0v-moving-code-import-receipt", "refusal-ground", true, receipt.pass as boolean, "outcome", ["evidence-reference-or-refusal"]),
    observation("cond-c0v-moving-claim-boundary", "lifecycle-classification", true, true, "classification", ["evidence-packet-protocol", "evidence-reference-or-refusal"]),
  ] satisfies readonly Phase10C0VS6ClassificationObservation[]);
  return Object.freeze({
    layerId: "C0V-MOVING-EVENT",
    dispositionCode: "reference-discrepancy-refusal",
    observations,
    evidence,
    verdict: "pass",
    errors: Object.freeze([]),
  });
}

/** Registered evaluator entrypoint. The governed worker invokes this wrapper exactly once. */
export function independentlyEvaluatePhase10C0VMovingDiscrepancy(
  input: Phase10C0VS6RefusalInput,
): Phase10C0VS6RefusalEvaluation {
  return independentlyReprovePhase10C0VMovingDiscrepancyArtifacts(input);
}

/** Unregistered, parsing-only semantic reproof for the retained static refusal artifact. */
export function independentlyReprovePhase10C0VStaticRefusalArtifacts(
  input: Phase10C0VS6RefusalInput,
): Phase10C0VS6RefusalEvaluation {
  const authority = validateCommonInput(input, "c0v-static-produce");
  validateScienceProtocol(
    input.scienceProtocolBytes,
    "phase10-c0v-static-protocol-v1",
    "phase10-c0v-static-s5a-v1",
    "C0V-STATIC",
    "reference-refusal",
  );
  const staticJson = phase10C0VS6ParsePrettyJson(
    input.referenceOrRefusalBytes,
    "static refusal artifact",
  );
  const deepStatic = parsePhase10C0VReferenceRefusal(staticJson);
  if (deepStatic.layerId !== "C0V-STATIC") fail("deep static refusal codec selected another layer");
  const row = phase10C0VS6Object(staticJson, "static refusal artifact");
  phase10C0VS6ExactOrderedKeys(row, [
    "schema", "refusalId", "protocolId", "layerId", "branch", "protocol", "freezeCommit",
    "createdAt", "reasonCode", "unavailableOperands", "attemptedRoutes", "forbiddenSubstitutes",
    "contractEvidence", "independentCheck", "executionRecord", "downstreamEffect", "claimBoundary",
  ], "static refusal artifact");
  if (
    row.schema !== "phase10-c0v-reference-refusal-v1" ||
    row.refusalId !== "phase10-c0v-static-reference-refusal-v1" ||
    row.protocolId !== "phase10-c0v-static-s5a-v1" || row.layerId !== "C0V-STATIC" ||
    row.branch !== "reference-refusal" || row.freezeCommit !== S5_SCIENCE_FREEZE_COMMIT ||
    row.reasonCode !== "current-contract-lacks-independent-static-spatial-reference-v1"
  ) fail("static refusal outer identity/ground differs");
  phase10C0VS6IsoInstant(row.createdAt, "static refusal createdAt");
  phase10C0VS6SameIdentity(
    parsePhase10C0VS6ArtifactIdentity(row.protocol, "static refusal protocol"),
    input.scienceProtocolIdentity,
    "static refusal science protocol",
  );
  exactStringArray(row.unavailableOperands, STATIC_UNAVAILABLE_OPERANDS, "static unavailable operands");
  exactStringArray(row.forbiddenSubstitutes, STATIC_FORBIDDEN_SUBSTITUTES, "static forbidden substitutes");
  if (!Array.isArray(row.attemptedRoutes) || row.attemptedRoutes.length !== 2) {
    fail("static attempted routes differ");
  }
  const routeRows = row.attemptedRoutes.map((entry, index) =>
    phase10C0VS6Object(entry, `static attemptedRoutes[${index}]`));
  phase10C0VS6ExactOrderedKeys(routeRows[0] as object, ["routeId", "route", "disposition", "reason"], "static attemptedRoutes[0]");
  phase10C0VS6ExactOrderedKeys(routeRows[1] as object, ["routeId", "route", "disposition", "reason"], "static attemptedRoutes[1]");
  if (
    routeRows[0]?.routeId !== "public-one-sweep-reconstruction-plus-separate-discrete-replay" ||
    routeRows[0]?.disposition !== "available-but-insufficient" ||
    routeRows[1]?.routeId !== "tolerance-scaled-self-convergence" ||
    routeRows[1]?.disposition !== "forbidden-substitute"
  ) fail("static attempted-route classifications differ");
  const contractEvidence = phase10C0VS6Object(row.contractEvidence, "static contract evidence");
  phase10C0VS6ExactOrderedKeys(contractEvidence, ["sourceAudit", "codeAndImportReceipt"], "static contract evidence");
  const sourceAudit = phase10C0VS6Object(contractEvidence.sourceAudit, "static source audit");
  if (sourceAudit.currentContractOnly !== true) fail("static source audit is not current-contract scoped");
  zeroExecution(sourceAudit.executionRecord, "static source-audit execution record");
  const receipt = phase10C0VS6Object(contractEvidence.codeAndImportReceipt, "static code/import receipt");
  if (
    receipt.pass !== true || !Array.isArray(receipt.forbiddenImportsObserved) ||
    receipt.forbiddenImportsObserved.length !== 0 ||
    !Array.isArray(receipt.generatorCheckerScientificImportOverlap) ||
    receipt.generatorCheckerScientificImportOverlap.length !== 0
  ) fail("static code/import receipt does not preserve separation");
  const check = phase10C0VS6Object(row.independentCheck, "static independent check");
  phase10C0VS6ExactOrderedKeys(check, [
    "schema", "protocolId", "method", "groundChecks", "routeChecks", "scopeChecks",
    "zeroExecutionChecks", "verdict", "errors",
  ], "static independent check");
  if (
    check.schema !== "phase10-c0v-static-refusal-check-v1" || check.protocolId !== row.protocolId ||
    check.verdict !== "pass" || !Array.isArray(check.errors) || check.errors.length !== 0
  ) fail("static independent refusal check does not pass cleanly");
  passedObject(check.groundChecks, "static ground checks");
  passedObject(check.routeChecks, "static route checks");
  passedObject(check.scopeChecks, "static scope checks");
  passedObject(check.zeroExecutionChecks, "static zero-execution checks");
  zeroExecution(row.executionRecord, "static outer execution record");
  const boundary = phase10C0VS6Object(row.claimBoundary, "static claim boundary");
  phase10C0VS6ExactOrderedKeys(boundary, ["allowed", "forbidden"], "static claim boundary");
  exactStringArray(boundary.allowed, STATIC_ALLOWED, "static allowed claims");
  exactStringArray(boundary.forbidden, STATIC_FORBIDDEN, "static forbidden claims");
  exactStringArray(authority.packet.claimBoundary.allowed, STATIC_PACKET_ALLOWED, "static packet allowed claims");
  exactStringArray(authority.packet.claimBoundary.forbidden, PACKET_FORBIDDEN, "static packet forbidden claims");
  const evidence = classificationEvidence(input, authority.packet);
  const observations = Object.freeze([
    observation("cond-c0v-static-science-protocol-identity", "artifact-identity", input.scienceProtocolIdentity.sha256, authority.packet.bindings.scienceProtocol!.sha256, "artifact-identity", ["evidence-science-protocol"], "identity-equal"),
    observation("cond-c0v-static-refusal-identity", "artifact-identity", input.referenceOrRefusalIdentity.sha256, authority.packet.bindings.referenceOrRefusal!.sha256, "artifact-identity", ["evidence-reference-or-refusal"], "identity-equal"),
    observation("cond-c0v-static-reason-code", "refusal-ground", "current-contract-lacks-independent-static-spatial-reference-v1", row.reasonCode as string, "reason-code", ["evidence-reference-or-refusal"]),
    observation("cond-c0v-static-attempted-routes", "refusal-ground", true, true, "outcome", ["evidence-reference-or-refusal"]),
    observation("cond-c0v-static-independent-check", "reference-check-outcome", "pass", check.verdict as string, "outcome", ["evidence-reference-or-refusal"]),
    observation("cond-c0v-static-zero-execution", "refusal-ground", true, true, "count", ["evidence-reference-or-refusal"]),
    observation("cond-c0v-static-code-import-receipt", "refusal-ground", true, receipt.pass as boolean, "outcome", ["evidence-reference-or-refusal"]),
    observation("cond-c0v-static-claim-boundary", "lifecycle-classification", true, true, "classification", ["evidence-packet-protocol", "evidence-reference-or-refusal"]),
  ] satisfies readonly Phase10C0VS6ClassificationObservation[]);
  return Object.freeze({
    layerId: "C0V-STATIC",
    dispositionCode: "preimplementation-reference-refusal",
    observations,
    evidence,
    verdict: "pass",
    errors: Object.freeze([]),
  });
}

/** Registered evaluator entrypoint. The governed worker invokes this wrapper exactly once. */
export function independentlyEvaluatePhase10C0VStaticRefusal(
  input: Phase10C0VS6RefusalInput,
): Phase10C0VS6RefusalEvaluation {
  return independentlyReprovePhase10C0VStaticRefusalArtifacts(input);
}

function checkCallerResult(
  evaluation: Phase10C0VS6RefusalEvaluation,
  checkIds: readonly string[],
): Phase10C0VS6RefusalCheckCallerResult {
  return Object.freeze({
    evaluation,
    terminalStatus: "refusal",
    executedCheckIds: checkIds,
    evaluatedCheckIds: checkIds,
    executedNegativeControlIds: Object.freeze([]),
  });
}

export function phase10C0VMovingProduceCheckCaller(
  input: Phase10C0VS6RefusalInput,
): Phase10C0VS6RefusalCheckCallerResult {
  return checkCallerResult(
    independentlyEvaluatePhase10C0VMovingDiscrepancy(input),
    MOVING_CHECK_IDS,
  );
}

export function phase10C0VStaticProduceCheckCaller(
  input: Phase10C0VS6RefusalInput,
): Phase10C0VS6RefusalCheckCallerResult {
  return checkCallerResult(
    independentlyEvaluatePhase10C0VStaticRefusal(input),
    STATIC_CHECK_IDS,
  );
}

export interface Phase10C0VS6RawRefusalCauseEvaluation extends Phase10C0VS6CauseEvaluationAuthority {
  readonly dispositionCode: Exclude<
    Phase10C0VS6PacketProtocol["terminalSubroutes"][number]["dispositionCode"],
    null | "production-complete"
  >;
  readonly evaluatorCallableId: string;
  readonly invokedCheckIds: readonly string[];
  readonly workerInvocationRecords:
    | readonly import("./phase10-c0v-s6-execution-contracts.ts").Phase10C0VS6ExecutableInvocationRecord[]
    | readonly Phase10C0VS6PacketWorkerInvocationRecord[];
  /** Pure route-specific semantic reproof, present only on the moving/static complete refusal. */
  readonly semanticEvaluation: Phase10C0VS6RefusalEvaluation | null;
}

export interface Phase10C0VS6RawRefusalCheckCallerResult {
  readonly evaluation: Phase10C0VS6RawRefusalCauseEvaluation;
  readonly terminalStatus: "refusal";
  readonly executedCheckIds: readonly string[];
  readonly evaluatedCheckIds: readonly string[];
  readonly executedNegativeControlIds: readonly string[];
}

function conditionMatches(
  comparator: Phase10C0VS6CauseObservation["comparator"],
  registeredValue: string | boolean | number | null,
  observedValue: string | boolean | number | null,
): boolean {
  switch (comparator) {
    case "equal":
    case "identity-equal":
    case "classified-as": return Object.is(registeredValue, observedValue);
    case "not-equal": return !Object.is(registeredValue, observedValue);
    case "less-than": return typeof registeredValue === "number" && typeof observedValue === "number" &&
      observedValue < registeredValue;
    case "less-than-or-equal": return typeof registeredValue === "number" && typeof observedValue === "number" &&
      observedValue <= registeredValue;
    case "greater-than": return typeof registeredValue === "number" && typeof observedValue === "number" &&
      observedValue > registeredValue;
    case "greater-than-or-equal": return typeof registeredValue === "number" && typeof observedValue === "number" &&
      observedValue >= registeredValue;
    case "present": return registeredValue === true && observedValue === true;
  }
}

function causeDecision(
  packet: Phase10C0VS6PacketProtocol,
  selectedSubrouteId: string,
) {
  const rosters = packet.terminalCandidateContract.decisionRosters.filter(
    (entry) => entry.subrouteId === selectedSubrouteId,
  );
  if (rosters.length !== 1) fail("selected refusal subroute has no exact terminal-decision roster");
  const decisions = rosters[0]!.decisions.filter((entry) => entry.decisionRole === "cause");
  if (decisions.length !== 1) fail("selected refusal subroute has no exact cause decision");
  return decisions[0]!;
}

/**
 * Canonical raw lifecycle cause projector. Route-specific moving/static evaluators establish only
 * their semantic operands; this function selects the subroute from strict preflight or parent-owned
 * worker/exit bytes and then projects the packet-specific condition/evidence roster. A terminal
 * candidate, attempt row, or terminal-v2 receipt is never an input, so cap classification is acyclic.
 */
export function independentlyEvaluatePhase10C0VS6RefusalCause(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VS6RawRefusalCauseEvaluation {
  const runtime = derivePhase10C0VS6RetainedRuntimeAuthority(input);
  const { packet, preflight } = runtime;
  const root = phase10C0VS6PhysicalRepositoryRoot(input.repositoryRoot);
  const attemptDirectory = preflight.observed.attemptDirectory;
  if (attemptDirectory !== `${packet.paths.attemptRoot}/${packet.registeredAttemptId}`) {
    fail("retained preflight attempt directory differs from raw packet authority");
  }
  const exitBytes = phase10C0VS6ReadUniquePhysicalFile(root, preflight.observed.exitStatusPath);
  const exit = parsePhase10C0VS6ExitStatusBytes(exitBytes, packet);
  const exitStatus = phase10C0VS6ArtifactIdentity(preflight.observed.exitStatusPath, exitBytes);
  let selectedSubrouteId: string;
  let workerInvocations: Phase10C0VS6ArtifactIdentity | null = null;
  let workerInvocationRecords: Phase10C0VS6RawRefusalCauseEvaluation["workerInvocationRecords"] = Object.freeze([]);
  let semanticEvaluation: Phase10C0VS6RefusalEvaluation | null = null;

  if (preflight.verdict === "refusal") {
    if (exit.classification !== "no-worker" || exit.workerProcessInvocationCount !== 0) {
      fail("preflight refusal cannot be followed by a worker launch");
    }
    const matches = packet.terminalSubroutes.filter((entry) =>
      entry.dispositionCode === preflight.refusalCandidate.dispositionCode &&
      entry.classificationConditionIds.includes(preflight.refusalCandidate.observation.conditionId));
    if (matches.length !== 1) fail("retained preflight refusal does not select one exact terminal subroute");
    selectedSubrouteId = matches[0]!.subrouteId;
  } else {
    if (exit.workerProcessInvocationCount !== 1 ||
      (exit.classification !== "complete" && exit.classification !== "registered-cap")) {
      fail("unclassified worker/transport failure has no claim-bearing refusal cause");
    }
    const workerPath = `${attemptDirectory}/${packet.workerInvocationContract.filename}`;
    const workerBytes = phase10C0VS6ReadUniquePhysicalFile(root, workerPath);
    workerInvocations = phase10C0VS6ArtifactIdentity(workerPath, workerBytes);
    const candidates: Array<{
      readonly subrouteId: string;
      readonly records: Phase10C0VS6RawRefusalCauseEvaluation["workerInvocationRecords"];
      readonly terminalState: "complete" | "registered-cap";
    }> = [];
    const produce = packet.packetId === "c0v-moving-produce" || packet.packetId === "c0v-radial-produce" ||
      packet.packetId === "c0v-static-produce";
    const classifiedSubroutes = packet.terminalSubroutes.filter((entry) =>
      entry.dispositionCode !== null && entry.dispositionCode !== "production-complete" &&
      packet.terminalCandidateContract.decisionRosters.some((roster) =>
        roster.subrouteId === entry.subrouteId && roster.decisions.some((decision) => decision.decisionRole === "cause")));
    for (const subroute of classifiedSubroutes) {
      try {
        if (produce) {
          const evaluated = independentlyEvaluatePhase10C0VS6WorkerInvocations(
            workerBytes,
            packet,
            subroute.subrouteId,
            Date.now(),
          );
          candidates.push({
            subrouteId: subroute.subrouteId,
            records: evaluated.invocationRecords,
            terminalState: evaluated.terminalState === "registered-cap" ? "registered-cap" : "complete",
          });
        } else {
          const evaluated = independentlyEvaluatePhase10C0VS6PacketWorkerInvocations(
            workerBytes,
            packet,
            subroute.subrouteId,
            Date.now(),
          );
          candidates.push({
            subrouteId: subroute.subrouteId,
            records: evaluated.invocationRecords,
            terminalState: evaluated.terminalState,
          });
        }
      } catch {
        // Exact-one matching below turns every malformed/ambiguous stream into a refusal.
      }
    }
    const stateMatches = candidates.filter((entry) => entry.terminalState === exit.classification);
    if (stateMatches.length !== 1) {
      fail("raw worker/exit bytes do not select exactly one classified claim-bearing subroute");
    }
    selectedSubrouteId = stateMatches[0]!.subrouteId;
    workerInvocationRecords = stateMatches[0]!.records;
    const selected = packet.terminalSubroutes.find((entry) => entry.subrouteId === selectedSubrouteId)!;
    if (selected.dispositionCode === "reference-discrepancy-refusal" ||
      selected.dispositionCode === "preimplementation-reference-refusal") {
      if (packet.bindings.scienceProtocol === null || packet.bindings.referenceOrRefusal === null) {
        fail("route-specific semantic refusal lacks exact science/reference bindings");
      }
      const semanticInput: Phase10C0VS6RefusalInput = {
        ...input,
        scienceProtocolIdentity: packet.bindings.scienceProtocol,
        scienceProtocolBytes: phase10C0VS6ReadUniquePhysicalFile(root, packet.bindings.scienceProtocol.path),
        referenceOrRefusalIdentity: packet.bindings.referenceOrRefusal,
        referenceOrRefusalBytes: phase10C0VS6ReadUniquePhysicalFile(root, packet.bindings.referenceOrRefusal.path),
      };
      semanticEvaluation = selected.dispositionCode === "reference-discrepancy-refusal"
        ? independentlyReprovePhase10C0VMovingDiscrepancyArtifacts(semanticInput)
        : independentlyReprovePhase10C0VStaticRefusalArtifacts(semanticInput);
      if (semanticEvaluation.dispositionCode !== selected.dispositionCode) {
        fail("route-specific semantic evaluator differs from raw selected subroute");
      }
    }
  }

  const subroute = packet.terminalSubroutes.find((entry) => entry.subrouteId === selectedSubrouteId)!;
  if (subroute.dispositionCode === null || subroute.dispositionCode === "production-complete") {
    fail("generic cause projector cannot grant a non-refusal route");
  }
  const projections = packet.classificationProjectionRosters.filter(
    (entry) => entry.subrouteId === selectedSubrouteId,
  );
  if (projections.length !== 1) fail("selected subroute has no exact classification projection");
  const projection = projections[0]!;
  const invocationById = new Map(workerInvocationRecords.map((entry) => [entry.invocationId, entry]));
  const observedValue = (source: string, conditionId: string): string | boolean | number | null => {
    if (source === "preflight.observed.resources.observedFreeBytes") {
      return preflight.observed.resources.observedFreeBytes;
    }
    if (source === "preflight.observed.resources.projectedPackageProcessHoursAfterAttempt") {
      return preflight.observed.resources.projectedPackageProcessHoursAfterAttempt;
    }
    if (source === "preflight.observed.resources.projectedPackageBytesAfterAttempt") {
      return preflight.observed.resources.projectedPackageBytesAfterAttempt;
    }
    if (source === "preflight.refusalCandidate.failedArtifact.failureClass") {
      return preflight.verdict === "refusal"
        ? preflight.refusalCandidate.failedArtifact?.failureClass ?? null
        : null;
    }
    const invocationMatch = /^internal\.workerInvocations\.([A-Za-z0-9._-]+)\.elapsedNanoseconds$/u.exec(source);
    if (invocationMatch !== null) {
      const invocation = invocationById.get(invocationMatch[1]!);
      if (invocation === undefined) fail(`${conditionId} raw invocation source is absent`);
      return invocation.elapsedNanoseconds / 1_000_000_000;
    }
    if (source === "bindings.scienceProtocol") return packet.bindings.scienceProtocol?.path ?? null;
    if (source.startsWith("bindings.referenceOrRefusal.")) {
      if (semanticEvaluation === null) fail(`${conditionId} lacks its route-specific semantic evaluation`);
      const semantic = semanticEvaluation.observations.find((entry) => entry.conditionId === conditionId);
      if (semantic === undefined || semantic.conditionPassed !== true) {
        fail(`${conditionId} was not established by the route-specific semantic evaluator`);
      }
      // The strict evaluator has already rederived the operand; protocol scalar spelling is the
      // canonical packet-specific projection (not the evaluator's older generic identity spelling).
      return projection.observations.find((entry) => entry.conditionId === conditionId)!.registeredValue;
    }
    fail(`${conditionId} has an unsupported raw observation source ${source}`);
  };
  const observations = projection.observations.map((authority): Phase10C0VS6CauseObservation => {
    if ((authority.observedValueSource.endsWith(".elapsedNanoseconds")) !==
      (authority.observedValueDerivation === "elapsed-nanoseconds-divided-by-1000000000")) {
      fail(`${authority.conditionId} raw source/derivation authority differs`);
    }
    const observed = observedValue(authority.observedValueSource, authority.conditionId);
    const matched = conditionMatches(authority.comparator, authority.registeredValue, observed);
    const isLaunchOrCapFailure = projection.method === "independent-prelaunch-resource-classification" ||
      projection.method === "independent-artifact-precondition-classification" ||
      projection.method === "independent-registered-cap-classification";
    return Object.freeze({
      conditionId: authority.conditionId,
      kind: authority.kind,
      comparator: authority.comparator,
      registeredValue: authority.registeredValue,
      observedValue: observed,
      unit: authority.unit,
      routeConditionMatched: matched,
      preconditionPassed: isLaunchOrCapFailure ? !matched : matched,
      evidenceIds: Object.freeze([...authority.evidenceIds]),
    });
  });
  const matched = observations.filter((entry) => entry.routeConditionMatched);
  if (projection.selectedConditionCardinality === "all" ? matched.length !== observations.length :
    matched.length !== 1) {
    fail("raw observation vector differs from the registered classification cardinality");
  }
  if (preflight.verdict === "refusal" &&
    (matched.length !== 1 || matched[0]!.conditionId !== preflight.refusalCandidate.observation.conditionId)) {
    fail("raw refusal vector differs from the retained preflight selected condition");
  }
  const preflightIdentity = phase10C0VS6ArtifactIdentity(packet.paths.preflightReceiptPath, input.preflightBytes);
  const evidence = projection.evidence.map((authority): Phase10C0VS6CauseEvidence => {
    let artifact: Phase10C0VS6ArtifactIdentity | null;
    switch (authority.artifactSource) {
      case "bindings.packetProtocol": artifact = input.packetProtocolIdentity; break;
      case "bindings.scienceProtocol": artifact = packet.bindings.scienceProtocol; break;
      case "bindings.referenceOrRefusal": artifact = packet.bindings.referenceOrRefusal; break;
      case "retainedPreflight": artifact = preflightIdentity; break;
      case "internal.exitStatus": artifact = exitStatus; break;
      case "internal.workerInvocations": artifact = workerInvocations; break;
      case "internal.workerProgress": {
        if (packet.workerProgressContract === null) fail("classification projection requests absent worker progress");
        const path = `${attemptDirectory}/${packet.workerProgressContract.filename}`;
        const bytes = phase10C0VS6ReadUniquePhysicalFile(root, path);
        artifact = phase10C0VS6ArtifactIdentity(path, bytes);
        break;
      }
      case null: artifact = null; break;
    }
    if ((authority.artifactSource === null) !== (artifact === null)) {
      fail(`${authority.evidenceId} raw evidence source is unavailable`);
    }
    return Object.freeze({
      evidenceId: authority.evidenceId,
      evidenceRole: authority.evidenceRole,
      retentionClass: authority.retentionClass,
      artifact,
      inlineObservationPath: authority.inlineObservationPath,
    });
  });
  const decision = causeDecision(packet, selectedSubrouteId);
  return Object.freeze({
    selectedSubrouteId,
    attemptDirectory,
    protocol: input.packetProtocolIdentity,
    preflight: preflightIdentity,
    exitStatus,
    workerProcessInvocationCount: exit.workerProcessInvocationCount,
    workerInvocations,
    observations: Object.freeze(observations),
    evidence: Object.freeze(evidence),
    verdict: "pass",
    reasons: Object.freeze([]),
    dispositionCode: subroute.dispositionCode,
    evaluatorCallableId: decision.evaluatorCallableId,
    invokedCheckIds: decision.invokedCheckIds,
    workerInvocationRecords,
    semanticEvaluation,
  });
}

export function phase10C0VS6RefusalCheckCaller(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VS6RawRefusalCheckCallerResult {
  const evaluation = independentlyEvaluatePhase10C0VS6RefusalCause(input);
  return Object.freeze({
    evaluation,
    terminalStatus: "refusal",
    executedCheckIds: evaluation.invokedCheckIds,
    evaluatedCheckIds: evaluation.invokedCheckIds,
    executedNegativeControlIds: Object.freeze([]),
  });
}
