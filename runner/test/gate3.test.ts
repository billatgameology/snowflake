// Phase 3 WP1b (plan phase-3-dev-visualization, "Gate protocol"): the gate3 criteria logic,
// exercised as a pure function on synthetic series — no evidence run happens here (gate3
// itself is minutes-scale and is run by the coordinator; the negative-control tests below
// are exactly the plan's committed controls). Every named criterion must trip individually:
// a criterion that cannot fail is dead code, not a gate (2a/2b audit history).

import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  evaluateGate3,
  gate3Csv,
  GATE3_REGISTERED_MAX_MEDIAN,
  GATE3_REGISTERED_MIN_FRACTION_BELOW_1,
  GATE3_REGISTERED_MIN_RADIUS,
  GATE3_WINDOW_SAMPLE_COUNT,
  type Gate3FinalState,
  type Gate3Sample,
} from "../src/gate3.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const main = join(repoRoot, "runner", "src", "main.ts");

function sampleAt(tick: number, ratio: number, attachedCount?: number): Gate3Sample {
  return {
    tick,
    attachedCount: attachedCount ?? 19 + tick, // strictly increasing with tick by default
    boundingRadius: tick / 120,
    aspectRatio: 0.17,
    depletionCenter: ratio * 0.001,
    depletionRim: 0.001,
    depletionRatio: ratio,
  };
}

/**
 * A passing full series: pre-window rows (ticks 100..300), the complete registered window
 * (400..4400, ratios ~0.4, all < 1), and a post-window ring episode with the probe's actual
 * measured finale ratios (13.5, 4.0) — which must be recorded but can never fail the gate,
 * or the windowed re-registration was pointless.
 */
function passingSeries(): Gate3Sample[] {
  const out: Gate3Sample[] = [];
  for (let tick = 100; tick <= 4400; tick += 100) out.push(sampleAt(tick, 0.4 + tick / 100_000));
  out.push(sampleAt(4500, 13.5));
  out.push(sampleAt(4600, 4.0));
  return out;
}

/** The probe's own final state (out/phase3-probe.log): the shape a passing run ends in. */
function passingFinal(): Gate3FinalState {
  return {
    aspectRatio: 0.168831,
    boundingRadius: 38,
    domainContact: false,
    stopReason: "far-field",
    deltaSymmetricAllTicks: true,
    finalSymmetryError: 0,
  };
}

/** Replace the window sample at `tick` (identity for all others). */
function withSample(
  samples: Gate3Sample[],
  tick: number,
  replace: (s: Gate3Sample) => Gate3Sample,
): Gate3Sample[] {
  return samples.map((s) => (s.tick === tick ? replace(s) : s));
}

/** A full series whose 41 window ratios come from `ratioOf(windowIndex)`. */
function seriesWithWindowRatios(ratioOf: (n: number) => number): Gate3Sample[] {
  return passingSeries().map((s) => {
    if (s.tick < 400 || s.tick > 4400) return s;
    const n = (s.tick - 400) / 100;
    const ratio = ratioOf(n);
    return { ...s, depletionCenter: ratio * 0.001, depletionRatio: ratio };
  });
}

describe("evaluateGate3 — the registered windowed criteria (pure, no run)", () => {
  it("a passing synthetic series passes, with the window statistics reported", () => {
    const verdict = evaluateGate3(passingSeries(), passingFinal());
    expect(verdict.failures).toEqual([]);
    expect(verdict.windowComplete).toBe(true);
    // Ratios rise linearly across the window, so the median is the tick-2400 sample.
    expect(verdict.windowMedianRatio).toBe(0.4 + 2400 / 100_000);
    expect(verdict.windowFractionBelowOne).toBe(1);
  });

  it("window extraction is by tick arithmetic: pre/post-window rows do not change the verdict", () => {
    const full = evaluateGate3(passingSeries(), passingFinal());
    const windowOnly = evaluateGate3(
      passingSeries().filter((s) => s.tick >= 400 && s.tick <= 4400),
      passingFinal(),
    );
    expect(full.windowMedianRatio).toBe(windowOnly.windowMedianRatio);
    expect(full.windowFractionBelowOne).toBe(windowOnly.windowFractionBelowOne);
    expect(full.failures).toEqual(windowOnly.failures);
  });

  it("G3-GROWTH trips alone on one flat consecutive pair (attachment stalled)", () => {
    const samples = withSample(passingSeries(), 2000, (s) => ({
      ...s,
      attachedCount: 19 + 1900, // equal to the tick-1900 sample: not strictly increasing
    }));
    const verdict = evaluateGate3(samples, passingFinal());
    expect(verdict.failures).toHaveLength(1);
    expect(verdict.failures[0]).toMatch(/^G3-GROWTH:/);
    expect(verdict.failures[0]).toContain("tick=2000");
  });

  it("G3-GROWTH trips alone when the final radius is below REGISTERED_MIN_RADIUS", () => {
    const verdict = evaluateGate3(passingSeries(), {
      ...passingFinal(),
      boundingRadius: GATE3_REGISTERED_MIN_RADIUS - 1,
    });
    expect(verdict.failures).toHaveLength(1);
    expect(verdict.failures[0]).toMatch(/^G3-GROWTH: final boundingRadius/);
  });

  it("G3-PLATE trips alone when the final aspect ratio is not plate-like", () => {
    const verdict = evaluateGate3(passingSeries(), { ...passingFinal(), aspectRatio: 0.35 });
    expect(verdict.failures).toHaveLength(1);
    expect(verdict.failures[0]).toMatch(/^G3-PLATE:/);
  });

  it("G3-DEPLETION (median clause) trips alone: all ratios 0.9 — below 1 but above the median cap", () => {
    const verdict = evaluateGate3(seriesWithWindowRatios(() => 0.9), passingFinal());
    expect(verdict.failures).toHaveLength(1);
    expect(verdict.failures[0]).toMatch(/^G3-DEPLETION: window median/);
    expect(verdict.windowMedianRatio).toBe(0.9);
    expect(0.9).toBeGreaterThan(GATE3_REGISTERED_MAX_MEDIAN);
    expect(verdict.windowFractionBelowOne).toBe(1); // the fraction clause passes
  });

  it("G3-DEPLETION (fraction clause) trips alone: 21 good samples hold the median but 20 invert", () => {
    const verdict = evaluateGate3(
      seriesWithWindowRatios((n) => (n < 21 ? 0.5 : 1.5)),
      passingFinal(),
    );
    expect(verdict.failures).toHaveLength(1);
    expect(verdict.failures[0]).toMatch(/^G3-DEPLETION: fraction/);
    expect(verdict.windowMedianRatio).toBe(0.5); // 21st of 41 sorted — median clause passes
    expect(verdict.windowFractionBelowOne).toBe(21 / GATE3_WINDOW_SAMPLE_COUNT);
    expect(verdict.windowFractionBelowOne).toBeLessThan(GATE3_REGISTERED_MIN_FRACTION_BELOW_1);
  });

  it("G3-DEFINED trips alone on a single NaN window sample", () => {
    const verdict = evaluateGate3(
      seriesWithWindowRatios((n) => (n === 26 ? Number.NaN : 0.5)), // NaN at tick 3000
      passingFinal(),
    );
    expect(verdict.failures).toHaveLength(1);
    expect(verdict.failures[0]).toMatch(/^G3-DEFINED:/);
    expect(verdict.failures[0]).toContain("tick=3000");
    // NaN sorts last, deterministically: the reported median is still the finite 0.5.
    expect(verdict.windowMedianRatio).toBe(0.5);
  });

  it("G3-WINDOW trips alone on a truncated run (window never closes)", () => {
    const truncated = passingSeries().filter((s) => s.tick <= 3000);
    const verdict = evaluateGate3(truncated, passingFinal());
    expect(verdict.failures).toHaveLength(1);
    expect(verdict.failures[0]).toMatch(/^G3-WINDOW:/);
    expect(verdict.windowComplete).toBe(false);
    // Windowed statistics are undefined on an incomplete window, never rescaled.
    expect(verdict.windowMedianRatio).toBe(Number.NaN);
    expect(verdict.windowFractionBelowOne).toBe(Number.NaN);
  });

  it.each([
    ["domain contact", { domainContact: true }, /^G3-VALID: domain-contact/],
    ["stalled termination", { stopReason: "stalled" }, /^G3-VALID: run ended by stalled/],
    [
      "domain-contact termination",
      { stopReason: "domain-contact" },
      /^G3-VALID: run ended by domain-contact/,
    ],
    [
      "delta-symmetry break",
      { deltaSymmetricAllTicks: false },
      /^G3-VALID: per-tick D6h symmetry/,
    ],
    [
      "nonzero final symmetry error",
      { finalSymmetryError: 0.02 },
      /^G3-VALID: final full symmetry error/,
    ],
  ])("G3-VALID trips alone on %s", (_label, override, pattern) => {
    const verdict = evaluateGate3(passingSeries(), { ...passingFinal(), ...override });
    expect(verdict.failures).toHaveLength(1);
    expect(verdict.failures[0]).toMatch(pattern);
  });

  it("median is exactly the 21st of the 41 sorted values (permuted distinct set)", () => {
    // Values 0.30..0.70 step 0.01, assigned in the permuted order n -> (7n mod 41); 7 is
    // coprime with 41, so every value appears exactly once and none sit in sorted position.
    const verdict = evaluateGate3(
      seriesWithWindowRatios((n) => 0.3 + ((n * 7) % 41) * 0.01),
      passingFinal(),
    );
    expect(verdict.failures).toEqual([]);
    expect(verdict.windowMedianRatio).toBe(0.3 + 20 * 0.01);
  });
});

describe("evaluateGate3 — the plan's negative controls", () => {
  it("crystal-free (all-NaN ratios) fails, naming G3-DEFINED", () => {
    const verdict = evaluateGate3(seriesWithWindowRatios(() => Number.NaN), passingFinal());
    expect(verdict.failures.length).toBeGreaterThan(0);
    expect(verdict.failures.some((f) => f.startsWith("G3-DEFINED:"))).toBe(true);
    // And nothing can rescue it: fraction-below-1 of an all-NaN window is 0.
    expect(verdict.windowFractionBelowOne).toBe(0);
  });

  it("uniform field (every ratio exactly 1) fails G3-DEPLETION on both clauses", () => {
    const verdict = evaluateGate3(seriesWithWindowRatios(() => 1), passingFinal());
    expect(verdict.failures).toHaveLength(2);
    for (const f of verdict.failures) expect(f).toMatch(/^G3-DEPLETION:/);
    expect(verdict.windowMedianRatio).toBe(1);
    expect(verdict.windowFractionBelowOne).toBe(0); // ratio < 1 is strict: 1 does not count
  });

  it("inverted field (every ratio > 1) fails G3-DEPLETION on both clauses", () => {
    const verdict = evaluateGate3(seriesWithWindowRatios(() => 2), passingFinal());
    expect(verdict.failures).toHaveLength(2);
    for (const f of verdict.failures) expect(f).toMatch(/^G3-DEPLETION:/);
  });
});

describe("gate3 evidence serialization and CLI pinning", () => {
  it("gate3Csv writes the header and one full-precision row per sample, NaN spelled out", () => {
    const csv = gate3Csv([sampleAt(100, 0.661291), sampleAt(200, Number.NaN)]);
    const lines = csv.trimEnd().split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(
      "tick,attachedCount,boundingRadius,aspectRatio,depletionCenter,depletionRim,depletionRatio",
    );
    expect(lines[1].startsWith("100,119,")).toBe(true);
    expect(lines[1].endsWith(",0.661291")).toBe(true);
    expect(lines[2].endsWith(",NaN")).toBe(true);
    expect(csv.endsWith("\n")).toBe(true);
  });

  it("the CLI rejects any argument: the protocol is pinned (exit 2, no run starts)", () => {
    const result = spawnSync("node", [main, "gate3", "--anything"], {
      encoding: "utf8",
      cwd: repoRoot,
    });
    expect(result.status).toBe(2);
    expect(result.stdout + result.stderr).toContain("gate3 takes no flags");
    expect(result.stdout + result.stderr).toContain("GATE3 EXIT STATUS: 2");
  });
});
