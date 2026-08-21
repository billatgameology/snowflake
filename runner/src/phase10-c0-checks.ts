import {
  PHASE10_C0_DERIVE_CHECK_IDS,
  PHASE10_C0_PUBLISH_CHECK_IDS,
  type Phase10C0DeriveCheckId,
  type Phase10C0PublishCheckId,
} from "./phase10-c0-contracts.ts";

/** Exact dispatch only; verdict logic belongs to the separately registered evaluator. */
export function phase10C0DeriveCheckCaller<Result>(
  evaluate: (checkId: Phase10C0DeriveCheckId) => Result,
): readonly Result[] {
  return PHASE10_C0_DERIVE_CHECK_IDS.map((checkId) => evaluate(checkId));
}

/** Exact publication-check dispatch only; verdict logic belongs to its independent verifier. */
export function phase10C0PublishCheckCaller<Result>(
  evaluate: (checkId: Phase10C0PublishCheckId) => Result,
): readonly Result[] {
  return PHASE10_C0_PUBLISH_CHECK_IDS.map((checkId) => evaluate(checkId));
}
