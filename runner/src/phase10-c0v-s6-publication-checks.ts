import {
  independentlyVerifyPhase10C0VMovingPublication,
  independentlyVerifyPhase10C0VRadialPublication,
  independentlyVerifyPhase10C0VStaticPublication,
  type Phase10C0VPublicationEvaluation,
  type Phase10C0VPublicationVerificationRequest,
  type Phase10C0VPublishCheckId,
  type Phase10C0VPublishPacketId,
} from "./phase10-c0v-s6-publication-verifier.ts";

export interface Phase10C0VPublicationCheckCallerResult {
  readonly schema: "phase10-c0v-publication-check-caller-result-v1";
  readonly packetId: Phase10C0VPublishPacketId;
  readonly callerCallableId:
    | "phase10-c0v-moving-publish-check-caller"
    | "phase10-c0v-radial-publish-check-caller"
    | "phase10-c0v-static-publish-check-caller";
  readonly evaluatorCallableId: Phase10C0VPublicationEvaluation["evaluatorCallableId"];
  readonly evaluation: Phase10C0VPublicationEvaluation;
  readonly executedCheckIds: readonly Phase10C0VPublishCheckId[];
  readonly evaluatedCheckIds: readonly Phase10C0VPublishCheckId[];
  readonly executedNegativeControlIds: readonly [];
}

const CALLER_IDS = Object.freeze({
  "c0v-moving-publish": "phase10-c0v-moving-publish-check-caller",
  "c0v-radial-publish": "phase10-c0v-radial-publish-check-caller",
  "c0v-static-publish": "phase10-c0v-static-publish-check-caller",
} as const);

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 publication check caller refused: ${message}`);
}

function callChecks(
  packetId: Phase10C0VPublishPacketId,
  request: Phase10C0VPublicationVerificationRequest,
): Phase10C0VPublicationCheckCallerResult {
  const evaluation = packetId === "c0v-moving-publish"
    ? independentlyVerifyPhase10C0VMovingPublication(request)
    : packetId === "c0v-radial-publish"
      ? independentlyVerifyPhase10C0VRadialPublication(request)
      : independentlyVerifyPhase10C0VStaticPublication(request);
  if (evaluation.aggregateVerdict !== "pass") fail(`${packetId} publication evaluator did not pass`);
  const ids = Object.freeze(evaluation.checkResults.map((entry) => entry.checkId));
  if (evaluation.checkResults.some((entry) => entry.verdict !== "pass" || entry.reasons.length !== 0) ||
    ids.length !== 3 || new Set(ids).size !== ids.length) {
    fail(`${packetId} executed/evaluated check roster differs`);
  }
  return Object.freeze({
    schema: "phase10-c0v-publication-check-caller-result-v1",
    packetId,
    callerCallableId: CALLER_IDS[packetId],
    evaluatorCallableId: evaluation.evaluatorCallableId,
    evaluation,
    executedCheckIds: ids,
    evaluatedCheckIds: ids,
    executedNegativeControlIds: Object.freeze([]) as readonly [],
  });
}

export function phase10C0VMovingPublishCheckCaller(
  request: Phase10C0VPublicationVerificationRequest,
): Phase10C0VPublicationCheckCallerResult {
  return callChecks("c0v-moving-publish", request);
}

export function phase10C0VRadialPublishCheckCaller(
  request: Phase10C0VPublicationVerificationRequest,
): Phase10C0VPublicationCheckCallerResult {
  return callChecks("c0v-radial-publish", request);
}

export function phase10C0VStaticPublishCheckCaller(
  request: Phase10C0VPublicationVerificationRequest,
): Phase10C0VPublicationCheckCallerResult {
  return callChecks("c0v-static-publish", request);
}
