export const PHASE10_AS_CHECK_IDS = [
  "chk-as-artifact-index-integrity",
  "chk-as-cited-classifications",
  "chk-as-exact-rosters",
  "chk-as-frozen-input-joins",
  "chk-as-immutable-roles",
  "chk-as-modelclass-blocker-separation",
  "chk-as-multiblocker-support",
  "chk-as-phase-ownership",
  "chk-as-protocol-before-classification",
  "chk-as-separate-corpus-totals",
  "chk-as-zero-validation-credit",
] as const;

export type Phase10ASCheckId = typeof PHASE10_AS_CHECK_IDS[number];

/**
 * The registered A-S check caller. It owns only exact check dispatch; scientific and artifact
 * verdicts remain in the separately registered independent evaluator module.
 */
export function phase10ASCheckCaller<Result>(
  evaluate: (checkId: Phase10ASCheckId) => Result,
): readonly Result[] {
  return PHASE10_AS_CHECK_IDS.map((checkId) => evaluate(checkId));
}
