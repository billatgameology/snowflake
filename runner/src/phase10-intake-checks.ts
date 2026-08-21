import { PHASE10_AI_CHECK_IDS, type Phase10AICheckId } from "./phase10-intake-contracts.ts";

/** Registered dispatch boundary; artifact verdicts remain with the independent evaluator. */
export function phase10AICheckCaller<Result>(
  evaluate: (checkId: Phase10AICheckId) => Result,
): readonly Result[] {
  return PHASE10_AI_CHECK_IDS.map((checkId) => evaluate(checkId));
}
