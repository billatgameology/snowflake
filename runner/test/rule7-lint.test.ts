// The Rule 7 lint's fixture test (plan, Scaffold step 2): a fixture containing
// `const alpha = 1` must FAIL the check; // rule7-waive: the test has to name its fixture's contents.
// a provenance-carrying fixture must pass.
// The repo-wide scan runs as the first step of `npm test` (package.json), not here —
// asserting it in a unit test would couple this suite to concurrent work in spike/.

import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const lint = join(repoRoot, "scripts", "lint-rule7.mjs");
const fixtures = join(repoRoot, "scripts", "lint-rule7-fixtures");

function runLint(...files: string[]): { status: number | null; output: string } {
  const result = spawnSync("node", [lint, "--file", ...files], { encoding: "utf8" });
  return { status: result.status, output: result.stdout + result.stderr };
}

describe("Rule 7 lint", () => {
  it("fails on a fixture with bare and provenance-free identifiers", () => {
    const { status, output } = runLint(join(fixtures, "bad.ts"));
    expect(status).toBe(1);
    expect(output).toContain("bad.ts:3");
  });

  it("markdown: fenced blocks and implementation-shaped inline spans fail; single-symbol spans and waived spans pass", () => {
    const { status, output } = runLint(join(fixtures, "bad.md"));
    expect(status).toBe(1);
    expect(output).toContain("bad.md:2"); // implementation-shaped inline span
    expect(output).toContain("bad.md:6"); // fenced block
    expect(output).not.toContain("bad.md:1"); // single-symbol span mention passes
    expect(output).not.toContain("bad.md:3"); // waived span passes
  });

  it("passes allowlisted identifiers, natural words, and waived mentions", () => {
    const { status } = runLint(join(fixtures, "good.ts"));
    expect(status).toBe(0);
  });
});
