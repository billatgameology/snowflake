// Fixture: MUST fail the Rule 7 lint. Excluded from the repo scan; the fixture test
// lints it explicitly with --file and asserts a nonzero exit.
export const alpha = 1;
export const beta_01 = 0.5;
export function scale(alphaBasal: number): number {
  return alphaBasal * beta_01;
}
