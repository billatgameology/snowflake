// Public read-only LK accessors added so a cross-implementation evidence probe can pair this
// operator's own interface-cycle phase and its own ledger segment origin against another
// implementation's, instead of publishing one lane's value as both operands.

import { describe, expect, it } from "vitest";
import { LKSolver, type LKCycleState } from "@vcc/solver-cpu";

const convergentOptions = {
  surfacePolicy: "aggregate-hv-g1h1-v5",
  dims: { nx: 12, ny: 12, nz: 9 },
  tempC: -5,
  sigmaInfinity: 0.01,
  dxUm: 0.35,
  rngSeed: 0x1234,
  noiseEpsilon: 0.25,
  relaxTol: 1e9,
  relaxMaxSweeps: 1,
  farField: "reflecting",
  testAlphaOverride: () => 1,
} as const;

const stallingOptions = {
  ...convergentOptions,
  relaxTol: 1e-12,
} as const;

/** The private field the cycle guards actually branch on. */
function guardPhase(solver: LKSolver): string {
  return (solver as unknown as { readonly cycleState: string }).cycleState;
}

function segmentOrigin(solver: LKSolver): number {
  return (solver as unknown as { readonly currentTemperatureSegmentStartFill: number })
    .currentTemperatureSegmentStartFill;
}

describe("LK public interface-cycle phase", () => {
  it("reports the live phase the cycle guards branch on, not a constant", () => {
    const solver = new LKSolver(convergentOptions);
    const observed: LKCycleState[] = [];
    expect(solver.cyclePhase()).toBe("boundary");
    expect(solver.cyclePhase()).toBe(guardPhase(solver));

    const relaxation = solver.relaxField(() => {
      observed.push(solver.cyclePhase());
      expect(solver.cyclePhase()).toBe(guardPhase(solver));
    });
    expect(relaxation.converged).toBe(true);
    // The mid-relaxation callback must see the in-flight phase, which is unreachable from
    // outside the operator and therefore cannot be a cached or hard-coded value.
    expect(observed.length).toBeGreaterThan(0);
    expect(new Set(observed)).toEqual(new Set<LKCycleState>(["relaxing"]));

    expect(solver.cyclePhase()).toBe("ready");
    expect(solver.cyclePhase()).toBe(guardPhase(solver));

    solver.advanceSurface();
    expect(solver.tick).toBe(1);
    expect(solver.cyclePhase()).toBe("boundary");
    expect(solver.cyclePhase()).toBe(guardPhase(solver));
  });

  it("names the phase that each rejected cycle call reports", () => {
    const solver = new LKSolver(convergentOptions);
    expect(solver.cyclePhase()).toBe("boundary");
    expect(() => solver.advanceSurface()).toThrow(
      new RegExp(`state=${solver.cyclePhase()}\\b`),
    );

    solver.relaxField();
    expect(solver.cyclePhase()).toBe("ready");
    expect(() => solver.relaxField()).toThrow(
      new RegExp(`not allowed in state ${solver.cyclePhase()}\\b`),
    );
    expect(() => solver.applyTimelineEnvironment({ tempC: -6, sigmaInfinity: 0.01 })).toThrow(
      new RegExp(`state=${solver.cyclePhase()}\\b`),
    );
    // A rejected event leaves the phase it named, and the accessor still agrees with it.
    expect(solver.cyclePhase()).toBe("ready");
    expect(solver.cyclePhase()).toBe(guardPhase(solver));
  });

  it("reports an unconverged relaxation as incomplete and keeps the surface shut", () => {
    const solver = new LKSolver(stallingOptions);
    const relaxation = solver.relaxField();
    expect(relaxation.converged).toBe(false);
    expect(solver.cyclePhase()).toBe("incomplete");
    expect(solver.cyclePhase()).toBe(guardPhase(solver));
    expect(() => solver.advanceSurface()).toThrow(/state=incomplete/);
    expect(solver.tick).toBe(0);
  });

  it("returns to the boundary phase after an accepted timeline event", () => {
    const solver = new LKSolver(convergentOptions);
    solver.step();
    expect(solver.cyclePhase()).toBe("boundary");
    solver.applyTimelineEnvironment({ tempC: -6, sigmaInfinity: 0.01 });
    expect(solver.cyclePhase()).toBe("boundary");
    expect(solver.cyclePhase()).toBe(guardPhase(solver));
  });
});

describe("LK public temperature-segment ledger origin", () => {
  it("holds the ledger's own segment origin, not a re-derivation", () => {
    const solver = new LKSolver(convergentOptions);
    expect(solver.currentTemperatureSegmentStartFillIceCells()).toBe(0);
    expect(solver.currentTemperatureSegmentStartFillIceCells()).toBe(
      segmentOrigin(solver),
    );

    for (let step = 0; step < 3; step++) solver.step();
    const grownFill = solver.fillLedger;
    expect(grownFill).toBeGreaterThan(0);
    // No temperature event has closed a segment, so the origin is still the run origin even
    // though the ledger has moved. A value that merely echoed the ledger would fail here.
    expect(solver.currentTemperatureSegmentStartFillIceCells()).toBe(0);
    expect(solver.currentTemperatureSegmentStartFillIceCells()).toBe(
      segmentOrigin(solver),
    );

    solver.applyTimelineEnvironment({
      tempC: convergentOptions.tempC,
      sigmaInfinity: 0.02,
    });
    // A far-field-only event changes no temperature, so it opens no new segment.
    expect(solver.currentTemperatureSegmentStartFillIceCells()).toBe(0);

    solver.applyTimelineEnvironment({ tempC: -6, sigmaInfinity: 0.02 });
    expect(solver.currentTemperatureSegmentStartFillIceCells()).toBe(grownFill);
    expect(solver.currentTemperatureSegmentStartFillIceCells()).toBe(
      segmentOrigin(solver),
    );

    for (let step = 0; step < 2; step++) solver.step();
    expect(solver.fillLedger).toBeGreaterThan(grownFill);
    expect(solver.currentTemperatureSegmentStartFillIceCells()).toBe(grownFill);
  });
});
