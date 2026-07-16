// Control-mode-independent stopping (external review blocker): the stop decision must be
// identical regardless of batch size, zero ticks may advance past the tick where a rule
// first trips, and both stop reasons must be exercised — all pinned on real GGSolver runs,
// with the first-trip tick independently recomputed by a per-tick replay.

import { describe, expect, it } from "vitest";
import { GG_PRESETS } from "@vcc/core";
import { FAR_FIELD_STOP_FRACTION, GGSolver } from "@vcc/solver-cpu";
import { advanceUntilStop, evaluateStopRules } from "../src/stoprule.ts";
import type { StopReason } from "../src/protocol.ts";

const RHO = GG_PRESETS.plate.rho;

/** The reviewer's scenario: a plate on a small 16^3 hexPrism domain, app defaults. */
function smallPlateSolver(): GGSolver {
  return new GGSolver({
    dims: { nx: 16, ny: 16, nz: 16 },
    params: GG_PRESETS.plate,
    rngSeed: 1,
    noiseEpsilon: 0,
    domain: "hexPrism",
    farField: "reflecting",
  });
}

/** Drive a solver with a fixed batch size until a rule trips; returns the stop state. */
function runWithBatchSize(
  solver: GGSolver,
  batchTicks: number,
  maxTotalTicks: number,
): { tick: number; stopReason: StopReason } {
  for (let guard = 0; guard < maxTotalTicks; guard += batchTicks) {
    const result = advanceUntilStop(solver, RHO, batchTicks);
    if (result.stopReason !== null) return { tick: solver.tick, stopReason: result.stopReason };
  }
  throw new Error(`no stop rule tripped within ${maxTotalTicks} ticks`);
}

describe("evaluateStopRules (pure decision)", () => {
  it("domain contact wins over the far-field rule", () => {
    expect(evaluateStopRules({ domainContact: true, farFieldMean: 0, rho: RHO })).toBe(
      "domain-contact",
    );
  });

  it("far-field trips strictly below (2/3) * rho and not at the threshold", () => {
    const threshold = FAR_FIELD_STOP_FRACTION * RHO;
    expect(
      evaluateStopRules({ domainContact: false, farFieldMean: threshold - 1e-12, rho: RHO }),
    ).toBe("far-field-stop");
    expect(
      evaluateStopRules({ domainContact: false, farFieldMean: threshold, rho: RHO }),
    ).toBeNull();
  });

  it("a NaN far-field mean never trips (no crystal-free false stops)", () => {
    expect(
      evaluateStopRules({ domainContact: false, farFieldMean: Number.NaN, rho: RHO }),
    ).toBeNull();
  });
});

describe("advanceUntilStop — control-mode independence (review blocker)", () => {
  it("(a) stops at the IDENTICAL tick for batch size 1 (stepped) and 16 (free-running)", () => {
    const stepped = runWithBatchSize(smallPlateSolver(), 1, 10_000);
    const freeRunning = runWithBatchSize(smallPlateSolver(), 16, 10_000);
    expect(stepped.tick).toBe(freeRunning.tick);
    expect(stepped.stopReason).toBe(freeRunning.stopReason);
    // Odd batch sizes cross-check that no batch-boundary alignment is doing the work.
    const batch7 = runWithBatchSize(smallPlateSolver(), 7, 10_000);
    expect(batch7.tick).toBe(stepped.tick);
    expect(batch7.stopReason).toBe(stepped.stopReason);
  });

  it("(b) zero ticks advance past the first tripped tick (independent per-tick replay)", () => {
    // Independent replay: step a fresh solver one tick at a time and evaluate the pure
    // decision to find the FIRST tick at which a rule trips.
    const replay = smallPlateSolver();
    let firstTrip = -1;
    let firstReason: StopReason = null;
    for (let n = 0; n < 10_000 && firstTrip === -1; n++) {
      replay.step();
      const reason = evaluateStopRules({
        domainContact: replay.domainContact(),
        farFieldMean: replay.farFieldMean(),
        rho: RHO,
      });
      if (reason !== null) {
        firstTrip = replay.tick;
        firstReason = reason;
      }
    }
    expect(firstTrip).toBeGreaterThan(0);
    // The rule must also NOT have tripped one tick earlier (this really is the first trip).
    const earlier = smallPlateSolver();
    while (earlier.tick < firstTrip - 1) earlier.step();
    expect(
      evaluateStopRules({
        domainContact: earlier.domainContact(),
        farFieldMean: earlier.farFieldMean(),
        rho: RHO,
      }),
    ).toBeNull();

    // Batched advance must land EXACTLY on the first-trip tick — not one past it.
    const batched = runWithBatchSize(smallPlateSolver(), 16, 10_000);
    expect(batched.tick).toBe(firstTrip);
    expect(batched.stopReason).toBe(firstReason);
  });

  it("(c) covers the far-field reason on the small reflecting domain", () => {
    const { stopReason } = runWithBatchSize(smallPlateSolver(), 16, 10_000);
    expect(stopReason).toBe("far-field-stop");
  });

  it("(c) covers domain contact, stopping mid-batch on the very tick it trips", () => {
    // A seed radius past the 65% guard: contact exists from tick 1 onward, so a 16-tick
    // batch must stop after exactly ONE tick, never 16.
    const solver = new GGSolver({
      dims: { nx: 32, ny: 32, nz: 8 },
      params: GG_PRESETS.plate,
      rngSeed: 1,
      domain: "hexPrism",
      seedRadius: 11, // extent 23 > 0.65 * 32
    });
    const result = advanceUntilStop(solver, RHO, 16);
    expect(result.stopReason).toBe("domain-contact");
    expect(result.ticksRun).toBe(1);
    expect(solver.tick).toBe(1);
  });

  it("runs the afterTick bookkeeping callback exactly once per tick actually run", () => {
    const solver = smallPlateSolver();
    let calls = 0;
    const result = advanceUntilStop(solver, RHO, 5, () => {
      calls++;
    });
    expect(result.stopReason).toBeNull();
    expect(calls).toBe(5);
    expect(solver.tick).toBe(5);
  });
});
