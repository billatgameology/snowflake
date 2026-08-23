import {
  independentlyVerifyPhase10C0VAggregate,
  type Phase10C0VAggregateCheckId,
  type Phase10C0VAggregateIndependentEvaluation,
  type Phase10C0VAggregateVerificationRequest,
} from "./phase10-c0v-s6-aggregate-verifier.ts";

const CHECK_IDS = Object.freeze([
  "chk-c0v-all-three-terminal",
  "chk-c0v-any-layer-nonpass",
  "chk-c0v-resource-ledger",
  "chk-c0v-verdict-rederived",
] as const satisfies readonly Phase10C0VAggregateCheckId[]);

export interface Phase10C0VAggregateCheckCallerResult {
  readonly schema: "phase10-c0v-aggregate-check-caller-result-v1";
  readonly packetId: "c0v-aggregate";
  readonly callerCallableId: "phase10-c0v-aggregate-check-caller";
  readonly evaluatorCallableId: "phase10-c0v-aggregate-evaluator";
  readonly evaluation: Phase10C0VAggregateIndependentEvaluation;
  readonly executedCheckIds: typeof CHECK_IDS;
  readonly evaluatedCheckIds: typeof CHECK_IDS;
  readonly executedNegativeControlIds: readonly ["nc-c0v-any-layer-nonpass"];
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V aggregate check caller refused: ${message}`);
}

export function phase10C0VAggregateCheckCaller(
  request: Phase10C0VAggregateVerificationRequest,
): Phase10C0VAggregateCheckCallerResult {
  const evaluation = independentlyVerifyPhase10C0VAggregate(request);
  const evaluated = evaluation.checkResults.map((entry) => entry.checkId);
  if (evaluation.aggregateVerdict !== "pass" || evaluated.length !== CHECK_IDS.length ||
    evaluated.some((entry, index) => entry !== CHECK_IDS[index]) ||
    evaluation.checkResults.some((entry) => entry.verdict !== "pass" || entry.reasons.length !== 0) ||
    evaluation.negativeControlReproof.verdict !== "pass" || !evaluation.negativeControlReproof.result.pass) {
    fail("independent evaluator output differs from the registered check/control roster");
  }
  return Object.freeze({
    schema: "phase10-c0v-aggregate-check-caller-result-v1",
    packetId: "c0v-aggregate",
    callerCallableId: "phase10-c0v-aggregate-check-caller",
    evaluatorCallableId: "phase10-c0v-aggregate-evaluator",
    evaluation,
    executedCheckIds: CHECK_IDS,
    evaluatedCheckIds: CHECK_IDS,
    executedNegativeControlIds: Object.freeze(["nc-c0v-any-layer-nonpass"] as const),
  });
}
