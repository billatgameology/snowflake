// Worker timeline wiring (V4-2): the app consumes the SAME @vcc/core schedule evaluator as
// the runner, applies events atomically via GGSolver.applyTimelineEnvironment (a/b/d
// bit-unchanged, decision 0011), retains no-event cursors, and rejects ambiguity before any
// mutation. The stop rule's rho getter is honored on the very next tick after an event.

import { describe, expect, it } from "vitest";
import {
  GG_PRESETS,
  ggTimelineEnvironmentFromParams,
  latticeExtents,
  type GGTimelineEnvironment,
  type GGTimelineSchedule,
  type LatticeExtents,
} from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";
import {
  completedCycleBoundary,
  createScheduleRuntime,
  evaluateScheduleBoundary,
  initialBoundary,
  timelineSummaryOf,
} from "../src/ggtimeline.ts";
import { advanceUntilStop, type SteppableSolver } from "../src/stoprule.ts";

const PLATE_ENV = ggTimelineEnvironmentFromParams(GG_PRESETS.plate);

function envWithMu(base: GGTimelineEnvironment, mu: number): GGTimelineEnvironment {
  return {
    ...base,
    mu: [mu, mu, mu, mu, mu, mu, mu] as unknown as GGTimelineEnvironment["mu"],
  };
}

function scheduleWith(events: GGTimelineSchedule["events"]): GGTimelineSchedule {
  return {
    version: 1,
    mode: "abrupt",
    operator: "GGThreshold",
    initialEnvironment: PLATE_ENV,
    events,
  };
}

function smallSolver(): GGSolver {
  return new GGSolver({
    dims: { nx: 16, ny: 16, nz: 16 },
    params: GG_PRESETS.plate,
    rngSeed: 1,
    domain: "hexPrism",
  });
}

function extentsFixture(zExtent: number, attachedCount: number): LatticeExtents {
  return {
    iExtent: 5,
    jExtent: 5,
    zExtent,
    tExtent: 5,
    largestExtent: Math.max(5, zExtent),
    attachedCount,
  };
}

describe("evaluateScheduleBoundary (core evaluator wiring)", () => {
  it("fires a tick-0 event at the initial boundary, before any solver cycle", () => {
    const target = envWithMu(PLATE_ENV, 0.002);
    const schedule = scheduleWith([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "tick", value: 0 },
        environment: target,
      },
    ]);
    const solver = smallSolver();
    const runtime = createScheduleRuntime(schedule);
    const aBefore = solver.a.slice();
    const bBefore = solver.b.slice();
    const dBefore = solver.d.slice();
    const applied = evaluateScheduleBoundary(runtime, initialBoundary(), (env) => {
      solver.applyTimelineEnvironment(env);
    });
    expect(applied).not.toBeNull();
    expect(applied!.event.trigger).toEqual({ kind: "tick", value: 0 });
    // Atomic parameter replacement, decision 0011: controls change, state bits do not.
    expect(solver.timelineEnvironment()).toEqual(target);
    expect(Array.from(solver.a)).toEqual(Array.from(aBefore));
    expect(Array.from(solver.b)).toEqual(Array.from(bBefore));
    expect(Array.from(solver.d)).toEqual(Array.from(dBefore));
    expect(solver.tick).toBe(0);
    expect(timelineSummaryOf(runtime)).toEqual({
      appliedEvents: 1,
      totalEvents: 1,
      lastEventCycle: 0,
    });
  });

  it("fires a zExtent event exactly once, at its first crossing boundary", () => {
    const target = envWithMu(PLATE_ENV, 0.003);
    const schedule = scheduleWith([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "zExtent", value: 2 },
        environment: target,
      },
    ]);
    const runtime = createScheduleRuntime(schedule);
    const applications: GGTimelineEnvironment[] = [];
    const apply = (env: GGTimelineEnvironment): void => {
      applications.push(env);
    };
    // Initial boundary: extent triggers are unobservable, nothing fires — but the cursor
    // MUST be retained (first-crossing provenance).
    expect(evaluateScheduleBoundary(runtime, initialBoundary(), apply)).toBeNull();
    expect(runtime.cursor.lastBoundary).toEqual({ phase: "initial", completedCycles: 0 });
    // Cycle 1: still below the trigger.
    expect(
      evaluateScheduleBoundary(runtime, completedCycleBoundary(1, extentsFixture(1, 19)), apply),
    ).toBeNull();
    // Cycle 2: first crossing -> the one and only application.
    const applied = evaluateScheduleBoundary(
      runtime,
      completedCycleBoundary(2, extentsFixture(2, 25)),
      apply,
    );
    expect(applied).not.toBeNull();
    expect(applied!.logEntry.crossingBoundary.completedCycles).toBe(2);
    expect(applied!.logEntry.previousBoundary).toEqual({
      phase: "afterInterfaceStep",
      completedCycles: 1,
      extents: extentsFixture(1, 19),
    });
    // Cycle 3: nothing left to fire.
    expect(
      evaluateScheduleBoundary(runtime, completedCycleBoundary(3, extentsFixture(3, 30)), apply),
    ).toBeNull();
    expect(applications).toEqual([target]);
    expect(timelineSummaryOf(runtime)).toEqual({
      appliedEvents: 1,
      totalEvents: 1,
      lastEventCycle: 2,
    });
  });

  it("rejects simultaneously eligible events BEFORE applying anything", () => {
    const schedule = scheduleWith([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "zExtent", value: 2 },
        environment: envWithMu(PLATE_ENV, 0.002),
      },
      {
        index: 1,
        operator: "GGThreshold",
        trigger: { kind: "tExtent", value: 6 },
        environment: envWithMu(PLATE_ENV, 0.003),
      },
    ]);
    const runtime = createScheduleRuntime(schedule);
    let applyCalls = 0;
    const apply = (): void => {
      applyCalls++;
    };
    evaluateScheduleBoundary(runtime, initialBoundary(), apply);
    evaluateScheduleBoundary(runtime, completedCycleBoundary(1, extentsFixture(1, 19)), apply);
    // One attachment batch crosses BOTH thresholds at cycle 2 -> ambiguous, reject.
    const crossing: LatticeExtents = {
      iExtent: 6,
      jExtent: 6,
      zExtent: 2,
      tExtent: 6,
      largestExtent: 6,
      attachedCount: 40,
    };
    expect(() =>
      evaluateScheduleBoundary(runtime, completedCycleBoundary(2, crossing), apply),
    ).toThrow(/ambiguous/);
    expect(applyCalls).toBe(0);
  });

  it("does not commit the cursor when the applier throws", () => {
    const schedule = scheduleWith([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "tick", value: 0 },
        environment: envWithMu(PLATE_ENV, 0.004),
      },
    ]);
    const runtime = createScheduleRuntime(schedule);
    expect(() =>
      evaluateScheduleBoundary(runtime, initialBoundary(), () => {
        throw new Error("solver refused");
      }),
    ).toThrow(/solver refused/);
    // The event is NOT recorded as fired.
    expect(runtime.cursor.nextEventIndex).toBe(0);
    expect(runtime.cursor.eventLog).toHaveLength(0);
  });

  it("drives a REAL growing solver: extents from latticeExtents, event applied mid-run", () => {
    // hollowColumn grows z quickly at small dims; trigger on zExtent 3 from the thickness-1
    // seed. The point is end-to-end wiring over real state, not morphology.
    const hollowEnv = ggTimelineEnvironmentFromParams(GG_PRESETS.hollowColumn);
    const target = envWithMu(hollowEnv, 0.02);
    const schedule: GGTimelineSchedule = {
      version: 1,
      mode: "abrupt",
      operator: "GGThreshold",
      initialEnvironment: hollowEnv,
      events: [
        {
          index: 0,
          operator: "GGThreshold",
          trigger: { kind: "zExtent", value: 3 },
          environment: target,
        },
      ],
    };
    const solver = new GGSolver({
      dims: { nx: 16, ny: 16, nz: 16 },
      params: GG_PRESETS.hollowColumn,
      rngSeed: 1,
      domain: "hexPrism",
    });
    const runtime = createScheduleRuntime(schedule);
    evaluateScheduleBoundary(runtime, initialBoundary(), (env) => {
      solver.applyTimelineEnvironment(env);
    });
    let fired = 0;
    for (let cycle = 0; cycle < 200 && fired === 0; cycle++) {
      solver.step();
      const extents = latticeExtents(solver.a, solver.dims);
      expect(extents).not.toBeNull();
      const applied = evaluateScheduleBoundary(
        runtime,
        completedCycleBoundary(solver.tick, extents as LatticeExtents),
        (env) => {
          solver.applyTimelineEnvironment(env);
        },
      );
      if (applied !== null) {
        fired++;
        expect((extents as LatticeExtents).zExtent).toBeGreaterThanOrEqual(3);
        expect(applied.logEntry.previousBoundary).not.toBeNull();
      }
    }
    expect(fired).toBe(1);
    expect(solver.timelineEnvironment()).toEqual(target);
  });
});

describe("advanceUntilStop rho getter (environment events change the stop threshold)", () => {
  interface FakeSolver extends SteppableSolver {
    tick: number;
  }

  function fakeSolver(farField: number): FakeSolver {
    return {
      tick: 0,
      step(): void {
        this.tick++;
      },
      domainContact: () => false,
      farFieldMean: () => farField,
    };
  }

  it("uses the rho value CURRENT at each tick's stop evaluation", () => {
    // farFieldMean 0.05: below (2/3)*0.1 = 0.0667 but above (2/3)*0.06 = 0.04. With rho
    // 0.06 the run would never stop; an event at tick 2 raises rho to 0.1, so the stop must
    // trip exactly at tick 2 — a batch-frozen rho would run to the cap instead.
    const solver = fakeSolver(0.05);
    let rho = 0.06;
    const result = advanceUntilStop(
      solver,
      () => rho,
      10,
      (s) => {
        if (s.tick === 2) rho = 0.1; // the timeline event lands after tick 2 completes
      },
    );
    expect(result.stopReason).toBe("far-field-stop");
    expect(result.ticksRun).toBe(2);
    expect(solver.tick).toBe(2);
  });

  it("still accepts a plain number (existing callers unchanged)", () => {
    const solver = fakeSolver(0.05);
    const result = advanceUntilStop(solver, 0.1, 10);
    expect(result.stopReason).toBe("far-field-stop");
    expect(result.ticksRun).toBe(1);
  });
});
