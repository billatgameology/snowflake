const CHECK_IDS = Object.freeze([
  "chk-b-acquisition-nas-receipt-or-na",
  "chk-b-acquisition-six-targets",
] as const);

/** The packet wrapper calls this finite roster; the independent evaluator derives each result. */
export function phase10BAcquisitionCheckCaller(): readonly string[] {
  return CHECK_IDS;
}
