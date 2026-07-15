// The runner as an ENFORCING gate (maker audit 2026-07-15): before --enforce-gate, a
// known-asymmetric box run printed deltaCheckCleanAllTicks=false and exited 0 — gate metrics
// nobody has to read are not a gate. These tests pin the enforcement itself, by running the
// real CLI and asserting on exit codes, the same way the Rule 7 fixtures pin the lint.

import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const main = join(repoRoot, "runner", "src", "main.ts");

function runGrow(...args: string[]): { status: number | null; output: string } {
  const result = spawnSync("node", [main, "grow", ...args], {
    encoding: "utf8",
    cwd: repoRoot,
  });
  return { status: result.status, output: result.stdout + result.stderr };
}

describe("runner --enforce-gate", () => {
  it("FAILS (exit 1) on the known-asymmetric box run, naming the tick-270 delta break", () => {
    const { status, output } = runGrow(
      "--preset", "plate", "--dims", "32,32,16", "--domain", "box",
      "--ticks", "300", "--metrics-every", "0", "--enforce-gate",
    );
    expect(status).toBe(1);
    expect(output).toContain("GATE FAILED");
    expect(output).toContain("broke at tick 270");
    // The end-state full metric reads 0 here (the transient heal) — enforcement must key on
    // the per-tick delta, and this asserts it does.
    expect(output).toContain("maxFullSymErr=0");
  });

  it("PASSES (exit 0) a small hexPrism plate run ending by the far-field rule", () => {
    const { status, output } = runGrow(
      "--preset", "plate", "--dims", "24,24,12",
      "--ticks", "4000", "--metrics-every", "0", "--enforce-gate",
    );
    expect(status).toBe(0);
    expect(output).toContain("GATE PASSED");
    expect(output).toContain("stop reason=far-field");
    expect(output).toContain("deltaCheckCleanAllTicks=true");
  });

  it("FAILS (exit 1) with noise on — the symmetry gate is defined noise-off", () => {
    const { status, output } = runGrow(
      "--preset", "plate", "--dims", "24,24,12",
      "--ticks", "4000", "--metrics-every", "0", "--noise", "1e-5", "--enforce-gate",
    );
    expect(status).toBe(1);
    expect(output).toContain("GATE FAILED");
    expect(output).toContain("noise is ON");
  });
});
