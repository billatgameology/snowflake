// Pin-register recommendation 3, the half that does not need CI.
//
// R21: `vitest.config.ts` has a five-glob `include` list, and deleting one line silently removes an
// entire workspace's tests from every run. R32: this repository has no CI — `.github/workflows/`
// contained one workflow and it deploys `docs/education` to Pages — so every pin in the register is
// human-triggered, and "the suite is green" has always meant "green on whatever the operator ran".
//
// Two failures this catches that nothing else does:
//   - a deleted or narrowed `include` glob, which reduces coverage without failing anything
//   - a deleted test FILE, which reduces coverage while the remaining tests still pass
//
// The second is why a floor count exists. A count is a weak invariant — it cannot tell a renamed file
// from a deleted one — but the failure mode it guards is coverage silently shrinking, and for that a
// floor is exactly the right shape. It is deliberately NOT a magic total: `toBe(69)` would fail on
// every new test file added, which trains an operator to edit the number without reading it. Two
// magic-total guards in this repo have already gone stale that way.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import config from "../../vitest.config.ts";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** The workspaces whose tests must be in every run, with the floor each held when this was written. */
const REGISTERED_SUITES = [
  { dir: "core/test", glob: "core/test/**/*.test.ts", floor: 7 },
  { dir: "solver-cpu/test", glob: "solver-cpu/test/**/*.test.ts", floor: 10 },
  { dir: "solver-gpu/test", glob: "solver-gpu/test/**/*.test.ts", floor: 9 },
  // Raised 23 → 25 (suite-integrity, phase6-provenance) → 26 (phase6-sdak). Raising the floor on
  // add is the point: a floor left behind protects only the files that predate it.
  { dir: "runner/test", glob: "runner/test/**/*.test.ts", floor: 26 },
  { dir: "app/test", glob: "app/test/**/*.test.ts", floor: 20 },
] as const;

function countTestFiles(dir: string): number {
  const full = join(REPO_ROOT, dir);
  if (!existsSync(full)) return 0;
  let n = 0;
  for (const entry of readdirSync(full, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && entry.name.endsWith(".test.ts")) n += 1;
  }
  return n;
}

describe("the test suite's own integrity", () => {
  it("vitest.config.ts still includes every registered workspace", () => {
    const include = config.test?.include ?? [];
    for (const suite of REGISTERED_SUITES) {
      expect(include, `${suite.glob} is no longer in vitest.config.ts's include list`).toContain(suite.glob);
    }
    // No EXTRA globs either: a sixth entry means a workspace's tests are running unregistered here,
    // which is benign but means this list stopped describing the suite.
    expect([...include].sort()).toEqual(REGISTERED_SUITES.map((s) => s.glob).sort());
  });

  it("no workspace has lost test files", () => {
    for (const suite of REGISTERED_SUITES) {
      const found = countTestFiles(suite.dir);
      expect(found, `${suite.dir} has ${found} test files, below its floor of ${suite.floor}`)
        .toBeGreaterThanOrEqual(suite.floor);
    }
  });

  it("names the exact command that counts as the suite being green", () => {
    // Rule 6, as a check rather than a habit. `npx vitest run` — what a "1227/1227 green" claim was
    // once based on — skips the Rule 7 scan and BOTH typechecks. Only exact `npm test` runs all
    // three, so `test` must keep composing them.
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.test).toContain("lint:rule7");
    expect(pkg.scripts.test).toContain("typecheck");
    expect(pkg.scripts.test).toContain("vitest run");
    expect(pkg.scripts.typecheck).toBe("tsc --noEmit && tsc -p app --noEmit");
  });

  // Evidence pin register R26. `LKSolver` now throws when a TEST-ONLY hook is set without
  // `testMode: true`, but that guard is only worth anything while the evidence path has no way to
  // SATISFY it. The runner is the only route from a command line to a scored crystal, so the claim
  // "no evidence run can reach these hooks" is exactly the claim that these three identifiers never
  // appear in it. A future `--test-mode` flag would silently re-open the path; this fails first.
  it("the runner offers no route to the TEST-ONLY solver hooks", () => {
    const main = readFileSync(join(REPO_ROOT, "runner", "src", "main.ts"), "utf8");
    for (const identifier of ["testAlphaOverride", "testExtraSeedSites", "testMode"]) {
      expect(
        main.includes(identifier),
        `runner/src/main.ts mentions ${identifier}. The hook guard is only meaningful while the ` +
          "evidence path cannot satisfy it — R26's executed mutation scored plate/AGREE with every " +
          "hash unmoved.",
      ).toBe(false);
    }
  });
});
