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
    // The behavioral half of the seed criterion, observable: the canonical radius-2 seed
    // initialized as exactly 19 sites (gg-machinery §5 erratum — a future "fix" back to the
    // paper's 20 fails the gate, not just a lattice unit test).
    expect(output).toContain("seedSites=19");
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

  it("FAILS (exit 1) on a non-plate preset — exit 0 must be the whole claim by itself", () => {
    // Round-3 review demo: before this criterion, a dendrite run printed GATE PASSED and
    // the claim was only valid jointly with the command line that nobody re-reads.
    const { status, output } = runGrow(
      "--preset", "dendrite", "--dims", "24,24,12",
      "--ticks", "300", "--metrics-every", "0", "--enforce-gate",
    );
    expect(status).toBe(1);
    expect(output).toContain("GATE FAILED");
    expect(output).toContain("the 2a gate is defined on the plate preset");
  });

  it("FAILS (exit 1) on a box domain even when a short run stays symmetric", () => {
    // Maker's round-5 catch: an 18,18,12 box run grew 19 -> 37, never broke symmetry (the
    // walls hadn't bitten yet), stopped by far-field, and exited 0. The gate's domain is
    // hexPrism (PROGRESS, plan Done when); a lucky-short box run must not pass.
    const { status, output } = runGrow(
      "--preset", "plate", "--dims", "18,18,12", "--domain", "box",
      "--ticks", "4000", "--metrics-every", "0", "--enforce-gate",
    );
    expect(status).toBe(1);
    expect(output).toContain("GATE FAILED");
    expect(output).toContain("requires the hexPrism domain");
  });

  it("FAILS (exit 1) when nothing grew — a seed-only run is not a crystal", () => {
    // Maker's round-5 catch: an 8,8,8 hexPrism run stopped with exactly the 19 seed sites
    // attached (the tiny reservoir hit far-field before any attachment) and exited 0,
    // against charter §3.2's "a crystal grows at all".
    const { status, output } = runGrow(
      "--preset", "plate", "--dims", "8,8,8",
      "--ticks", "4000", "--metrics-every", "0", "--enforce-gate",
    );
    expect(status).toBe(1);
    expect(output).toContain("GATE FAILED");
    expect(output).toContain("no growth");
  });

  it.each([["-0.00001"], ["NaN"], ["-1"], ["1.00001"], ["2"]])(
    "rejects invalid --noise %s at parse time (any run, not only gate runs)",
    (eps) => {
      // Maker's round-5 catch: negative and NaN epsilons ran as silent noise-off while
      // poisoning the recorded metadata. Rejected for every run at the parser.
      const { status, output } = runGrow(
        "--preset", "plate", "--dims", "24,24,12",
        "--ticks", "10", "--noise", eps,
      );
      expect(status).toBe(1);
      expect(output).toContain("--noise wants a finite epsilon in [0, 1]");
    },
  );

  it.each([["NaN"], ["-1"], ["1.5"], ["4294967296"]])(
    "rejects invalid --seed %s before a run can emit dishonest metadata",
    (seed) => {
      const { status, output } = runGrow(
        "--preset", "plate", "--dims", "24,24,12", "--ticks", "10", "--seed", seed,
      );
      expect(status).toBe(1);
      expect(output).toContain("--seed wants a safe integer in 0..4294967295");
    },
  );

  it.each([
    ["--symmetry-every", "NaN"],
    ["--metrics-every", "1.5"],
    ["--stop-check-every", "0"],
  ])("rejects invalid cadence %s %s instead of silently disabling a check", (flag, cadence) => {
    const { status, output } = runGrow(
      "--preset", "plate", "--dims", "24,24,12", "--ticks", "10", flag, cadence,
    );
    expect(status).toBe(1);
    expect(output).toContain(`${flag} wants a safe integer`);
  });

  it.each([["1"], ["3"], ["none"]])(
    "FAILS (exit 1) on a non-canonical seed (--seed-radius %s) — gg-machinery §5 mandates radius 2",
    (radius) => {
      // Maker's round-4 catch: --seed-radius 1 and 3 exited 0 despite the spec mandating the
      // canonical radius-2, 19-site seed, so "exit 0 is the whole claim" was still false.
      const { status, output } = runGrow(
        "--preset", "plate", "--dims", "24,24,12",
        "--ticks", "300", "--metrics-every", "0",
        "--seed-radius", radius, "--enforce-gate",
      );
      expect(status).toBe(1);
      expect(output).toContain("GATE FAILED");
      expect(output).toContain("the 2a gate requires the canonical radius-2 seed");
    },
  );

});
