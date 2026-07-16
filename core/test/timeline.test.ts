import { describe, expect, it } from "vitest";
import {
  createTimelineCursor,
  evaluateTimelineBoundary,
  ggParamsFromTimelineEnvironment,
  ggTimelineEnvironmentFromParams,
  GG_PRESETS,
  PARAM_CONFIGS,
  paramSlot,
  validateTimelineSchedule,
  type GGTimelineEnvironment,
  type GGTimelineSchedule,
  type LatticeExtents,
  type LKTimelineEnvironment,
  type LKTimelineSchedule,
  type TimelineBoundary,
  type TimelineCursor,
  type TimelineSchedule,
} from "@vcc/core";

const ggInitial: GGTimelineEnvironment = {
  rho: 0.1,
  phi: 0,
  kappa: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
  mu: [0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001],
  ggThreshBeta: [2.5, 2, 2, 2, 1, 1, 1],
};

function changedGG(ggThreshBeta01: number, rho = 0.1): GGTimelineEnvironment {
  return { ...ggInitial, rho, ggThreshBeta: [ggThreshBeta01, 2, 2, 2, 1, 1, 1] };
}

function extents(i: number, j: number, z: number, attachedCount = 19): LatticeExtents {
  const t = Math.max(i, j);
  return {
    iExtent: i,
    jExtent: j,
    zExtent: z,
    tExtent: t,
    largestExtent: Math.max(t, z),
    attachedCount,
  };
}

function after(completedCycles: number, observed = extents(5, 5, 5)): TimelineBoundary {
  return { phase: "afterInterfaceStep", completedCycles, extents: observed };
}

function beginSchedule(schedule: TimelineSchedule): TimelineCursor {
  return evaluateTimelineBoundary(
    schedule,
    createTimelineCursor(schedule),
    { phase: "initial", completedCycles: 0 },
  ).cursor;
}

function cursorBeforeCycle(
  schedule: TimelineSchedule,
  cycle: number,
  observed = extents(5, 5, 5),
): TimelineCursor {
  let cursor = beginSchedule(schedule);
  for (let completed = 1; completed < cycle; completed++) {
    cursor = evaluateTimelineBoundary(schedule, cursor, after(completed, observed)).cursor;
  }
  return cursor;
}

function ggSchedule(
  events: GGTimelineSchedule["events"],
  initialEnvironment = ggInitial,
): GGTimelineSchedule {
  return {
    version: 1,
    mode: "abrupt",
    operator: "GGThreshold",
    initialEnvironment,
    events,
  };
}

const lkCold: LKTimelineEnvironment = { tempC: -15, sigmaInfinity: 0.002 };

function lkSchedule(events: LKTimelineSchedule["events"]): LKTimelineSchedule {
  return {
    version: 1,
    mode: "abrupt",
    operator: "LibbrechtKinetics",
    initialEnvironment: lkCold,
    events,
  };
}

describe("Phase 4 timeline validation", () => {
  it("accepts JSON-safe complete operator-tagged schedules", () => {
    const schedule = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "zExtent", value: 25 },
        environment: changedGG(5),
      },
    ]);
    expect(() => validateTimelineSchedule(schedule)).not.toThrow();
    expect(JSON.parse(JSON.stringify(schedule))).toEqual(schedule);
  });

  it("round-trips existing G-G solver parameters through the JSON-safe seven-slot environment", () => {
    const environment = ggTimelineEnvironmentFromParams(GG_PRESETS.plate);
    expect(environment).toEqual(ggInitial);
    const roundTrip = ggParamsFromTimelineEnvironment(environment);
    expect(roundTrip.rho).toBe(GG_PRESETS.plate.rho);
    expect(roundTrip.phi).toBe(GG_PRESETS.plate.phi);
    for (const [nT, nZ] of PARAM_CONFIGS) {
      const slot = paramSlot(nT, nZ);
      expect(roundTrip.kappa[slot]).toBe(GG_PRESETS.plate.kappa[slot]);
      expect(roundTrip.mu[slot]).toBe(GG_PRESETS.plate.mu[slot]);
      expect(roundTrip.ggThreshBeta[slot]).toBe(GG_PRESETS.plate.ggThreshBeta[slot]);
    }
  });

  it("rejects ramps, duplicate triggers, non-monotone same-kind triggers, and no-op events", () => {
    const ramp = {
      ...ggSchedule([]),
      mode: "ramp",
    } as unknown as TimelineSchedule;
    expect(() => validateTimelineSchedule(ramp)).toThrow(/abrupt/);

    const duplicate = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "tick", value: 2 },
        environment: changedGG(3),
      },
      {
        index: 1,
        operator: "GGThreshold",
        trigger: { kind: "tick", value: 2 },
        environment: changedGG(4),
      },
    ]);
    expect(() => validateTimelineSchedule(duplicate)).toThrow(/duplicate timeline trigger/);

    const descending = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "zExtent", value: 20 },
        environment: changedGG(3),
      },
      {
        index: 1,
        operator: "GGThreshold",
        trigger: { kind: "zExtent", value: 18 },
        environment: changedGG(4),
      },
    ]);
    expect(() => validateTimelineSchedule(descending)).toThrow(/increase strictly/);

    const noOp = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "tick", value: 0 },
        environment: ggInitial,
      },
    ]);
    expect(() => validateTimelineSchedule(noOp)).toThrow(/no-op/);
  });

  it("rejects an event whose operator/environment disagrees with its schedule", () => {
    const wrong = {
      ...ggSchedule([]),
      events: [
        {
          index: 0,
          operator: "LibbrechtKinetics",
          trigger: { kind: "tick", value: 0 },
          environment: { tempC: -5, sigmaInfinity: 0.002 },
        },
      ],
    } as unknown as TimelineSchedule;
    expect(() => validateTimelineSchedule(wrong)).toThrow(/operator does not match/);

    const forbiddenLKControl = lkSchedule([
      {
        index: 0,
        operator: "LibbrechtKinetics",
        trigger: { kind: "tick", value: 0 },
        environment: {
          tempC: -5,
          sigmaInfinity: 0.002,
          pressurePa: 50_000,
        } as LKTimelineEnvironment,
      },
    ]);
    expect(() => validateTimelineSchedule(forbiddenLKControl)).toThrow(/keys must be exactly/);
  });

  it("rejects invalid finite/range values before a run starts", () => {
    const badLK = lkSchedule([
      {
        index: 0,
        operator: "LibbrechtKinetics",
        trigger: { kind: "tick", value: 0 },
        environment: { tempC: -5, sigmaInfinity: Number.NaN },
      },
    ]);
    expect(() => validateTimelineSchedule(badLK)).toThrow(/sigmaInfinity/);

    const badGG = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "tick", value: 0 },
        environment: changedGG(-1),
      },
    ]);
    expect(() => validateTimelineSchedule(badGG)).toThrow(/valid G-G environment/);
  });
});

describe("Phase 4 timeline boundary semantics", () => {
  it("fires tick 0 before the first solver step and a later tick at its exact completed-cycle boundary", () => {
    const schedule = lkSchedule([
      {
        index: 0,
        operator: "LibbrechtKinetics",
        trigger: { kind: "tick", value: 0 },
        environment: { tempC: -12.5, sigmaInfinity: 0.002 },
      },
      {
        index: 1,
        operator: "LibbrechtKinetics",
        trigger: { kind: "tick", value: 3 },
        environment: { tempC: -5, sigmaInfinity: 0.002 },
      },
    ]);
    const initial = createTimelineCursor(schedule);
    const first = evaluateTimelineBoundary(schedule, initial, { phase: "initial", completedCycles: 0 });
    expect(first.event?.index).toBe(0);
    expect(first.logEntry?.completedCycles).toBe(0);
    expect(first.logEntry?.observedExtents).toBeNull();

    const cycle1 = evaluateTimelineBoundary(schedule, first.cursor, after(1));
    expect(cycle1.event).toBeNull();
    const cycle2 = evaluateTimelineBoundary(schedule, cycle1.cursor, after(2));
    expect(cycle2.event).toBeNull();
    const cycle3 = evaluateTimelineBoundary(schedule, cycle2.cursor, after(3));
    expect(cycle3.event?.index).toBe(1);
    expect(cycle3.logEntry?.beforeEnvironment).toEqual({ tempC: -12.5, sigmaInfinity: 0.002 });
    expect(cycle3.cursor.nextEventIndex).toBe(2);
  });

  it("does not expose extent triggers initially and rejects mid-interface observations", () => {
    const schedule = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "largestExtent", value: 6 },
        environment: changedGG(3),
      },
    ]);
    const cursor = createTimelineCursor(schedule);
    expect(
      evaluateTimelineBoundary(schedule, cursor, { phase: "initial", completedCycles: 0 }).event,
    ).toBeNull();

    const midInterface = {
      phase: "afterRelaxation",
      completedCycles: 1,
      extents: extents(6, 5, 5),
    } as unknown as TimelineBoundary;
    expect(() => evaluateTimelineBoundary(schedule, cursor, midInterface)).toThrow(
      /complete interface step/,
    );
  });

  it("fires an extent event exactly once on the first observed crossing, even when a batch skips the threshold", () => {
    const schedule = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "zExtent", value: 16 },
        environment: changedGG(5),
      },
    ]);
    const initial = cursorBeforeCycle(schedule, 8, extents(9, 8, 15));
    const before = evaluateTimelineBoundary(schedule, initial, after(8, extents(9, 8, 15)));
    expect(before.event).toBeNull();
    const crossed = evaluateTimelineBoundary(schedule, before.cursor, after(9, extents(9, 8, 18)));
    expect(crossed.event?.index).toBe(0);
    expect(crossed.logEntry?.observedExtents?.zExtent).toBe(18);
    const repeated = evaluateTimelineBoundary(schedule, crossed.cursor, after(10, extents(9, 8, 18)));
    expect(repeated.event).toBeNull();
    expect(repeated.cursor.eventLog).toHaveLength(1);
  });

  it("rejects multiple newly eligible events at one batch before emitting either event", () => {
    const schedule = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "zExtent", value: 16 },
        environment: changedGG(3),
      },
      {
        index: 1,
        operator: "GGThreshold",
        trigger: { kind: "tExtent", value: 12 },
        environment: changedGG(4),
      },
    ]);
    const cursor = cursorBeforeCycle(schedule, 20, extents(8, 8, 15));
    expect(() =>
      evaluateTimelineBoundary(schedule, cursor, after(20, extents(13, 12, 18))),
    ).toThrow(/ambiguous timeline boundary.*events 0, 1/);
    expect(cursor.nextEventIndex).toBe(0);
    expect(cursor.eventLog).toEqual([]);
  });

  it("rejects a tick coinciding with a queued extent event and a later event firing out of order", () => {
    const coincident = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "zExtent", value: 16 },
        environment: changedGG(3),
      },
      {
        index: 1,
        operator: "GGThreshold",
        trigger: { kind: "tick", value: 20 },
        environment: changedGG(4),
      },
    ]);
    expect(() =>
      evaluateTimelineBoundary(
        coincident,
        cursorBeforeCycle(coincident, 20, extents(8, 8, 15)),
        after(20, extents(8, 8, 16)),
      ),
    ).toThrow(/ambiguous timeline boundary/);

    const outOfOrder = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "zExtent", value: 20 },
        environment: changedGG(3),
      },
      {
        index: 1,
        operator: "GGThreshold",
        trigger: { kind: "tick", value: 5 },
        environment: changedGG(4),
      },
    ]);
    expect(() =>
      evaluateTimelineBoundary(
        outOfOrder,
        cursorBeforeCycle(outOfOrder, 5, extents(8, 8, 10)),
        after(5, extents(8, 8, 10)),
      ),
    ).toThrow(/became eligible before next event/);
  });

  it("rejects a skipped exact tick boundary instead of firing it late", () => {
    const schedule = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "tick", value: 2 },
        environment: changedGG(3),
      },
    ]);
    expect(() =>
      evaluateTimelineBoundary(schedule, cursorBeforeCycle(schedule, 2), after(3)),
    ).toThrow(/must be sequential/);
  });

  it("advances across no-event boundaries so time reversal, late observation, and shrinking extents fail", () => {
    const schedule = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "zExtent", value: 16 },
        environment: changedGG(3),
      },
    ]);
    const initial = beginSchedule(schedule);
    const cycle1 = evaluateTimelineBoundary(
      schedule,
      initial,
      after(1, extents(8, 8, 15)),
    );
    expect(cycle1.event).toBeNull();
    expect(cycle1.cursor.lastBoundary?.completedCycles).toBe(1);
    expect(() =>
      evaluateTimelineBoundary(schedule, cycle1.cursor, after(1, extents(8, 8, 15))),
    ).toThrow(/must be sequential/);
    expect(() =>
      evaluateTimelineBoundary(schedule, cycle1.cursor, after(3, extents(8, 8, 18))),
    ).toThrow(/must be sequential/);
    expect(() =>
      evaluateTimelineBoundary(schedule, cycle1.cursor, after(2, extents(8, 8, 14))),
    ).toThrow(/cannot decrease/);
  });

  it("is deterministic from the same cursor and rejects a shifted replay cursor", () => {
    const schedule = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "tick", value: 1 },
        environment: changedGG(3),
      },
    ]);
    const cursor = beginSchedule(schedule);
    const left = evaluateTimelineBoundary(schedule, cursor, after(1));
    const right = evaluateTimelineBoundary(schedule, cursor, after(1));
    expect(left).toEqual(right);

    const shifted = {
      ...left.cursor,
      eventLog: [{ ...left.cursor.eventLog[0], afterEnvironment: changedGG(4) }],
    };
    expect(() => evaluateTimelineBoundary(schedule, shifted, after(2))).toThrow(
      /does not replay the schedule/,
    );

    const wrongTick = {
      ...left.cursor,
      eventLog: [{ ...left.cursor.eventLog[0], completedCycles: 2 }],
    };
    expect(() => evaluateTimelineBoundary(schedule, wrongTick, after(2))).toThrow(/wrong tick/);
    expect(() =>
      evaluateTimelineBoundary(
        schedule,
        left.cursor,
        { phase: "initial", completedCycles: 0 },
      ),
    ).toThrow(/must be sequential/);
  });

  it("binds a cursor to the exact schedule and snapshots emitted environments", () => {
    const schedule = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "tick", value: 1 },
        environment: changedGG(3),
      },
    ]);
    const cursor = beginSchedule(schedule);
    const decision = evaluateTimelineBoundary(schedule, cursor, after(1));
    const loggedValue = (decision.logEntry?.afterEnvironment as GGTimelineEnvironment)
      .ggThreshBeta[0];
    (schedule.events[0].environment.ggThreshBeta as unknown as number[])[0] = 4;
    expect(
      (decision.logEntry?.afterEnvironment as GGTimelineEnvironment).ggThreshBeta[0],
    ).toBe(loggedValue);
    expect(() => evaluateTimelineBoundary(schedule, cursor, after(1))).toThrow(
      /schedule fingerprint/,
    );
  });

  it("does not receive or mutate solver arrays while emitting a G-G parameter jump", () => {
    const schedule = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "tick", value: 0 },
        environment: changedGG(5),
      },
    ]);
    const a = new Uint8Array([1, 0, 1]);
    const b = new Float64Array([0.25, 0.5, 0.75]);
    const d = new Float64Array([0.1, 0.2, 0.3]);
    const before = [Array.from(a), Array.from(b), Array.from(d)];
    const decision = evaluateTimelineBoundary(
      schedule,
      createTimelineCursor(schedule),
      { phase: "initial", completedCycles: 0 },
    );
    expect(decision.event?.operator).toBe("GGThreshold");
    expect([Array.from(a), Array.from(b), Array.from(d)]).toEqual(before);
  });
});
