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
    expect(first.logEntry?.previousBoundary).toBeNull();
    expect(first.logEntry?.crossingBoundary).toEqual({ phase: "initial", completedCycles: 0 });

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
    expect(crossed.logEntry?.previousBoundary).toEqual(after(8, extents(9, 8, 15)));
    expect(crossed.logEntry?.crossingBoundary).toEqual(after(9, extents(9, 8, 18)));
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
    ).toThrow(/cannot shrink/);
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
      eventLog: [{ ...left.cursor.eventLog[0], crossingBoundary: after(2) }],
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

  it("keeps the returned log snapshot independent from the retained cursor history", () => {
    const schedule = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "tick", value: 1 },
        environment: changedGG(3),
      },
    ]);
    const decision = evaluateTimelineBoundary(schedule, beginSchedule(schedule), after(1));
    const returned = decision.logEntry as unknown as {
      crossingBoundary: { completedCycles: number };
      afterEnvironment: GGTimelineEnvironment;
    };
    returned.crossingBoundary.completedCycles = 99;
    (returned.afterEnvironment.ggThreshBeta as unknown as number[])[0] = 99;
    expect(decision.cursor.eventLog[0].crossingBoundary.completedCycles).toBe(1);
    expect(
      (decision.cursor.eventLog[0].afterEnvironment as GGTimelineEnvironment).ggThreshBeta[0],
    ).toBe(3);
  });

  it("rejects a cursor whose next extent event was already eligible at its retained boundary", () => {
    const schedule = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "zExtent", value: 16 },
        environment: changedGG(3),
      },
    ]);
    const legitimate = cursorBeforeCycle(schedule, 11, extents(8, 8, 15));
    const forged = {
      ...legitimate,
      lastBoundary: after(10, extents(8, 8, 20)),
    };
    expect(() => evaluateTimelineBoundary(schedule, forged, after(11, extents(8, 8, 20))))
      .toThrow(/already-eligible unfired event/);
  });

  it("rejects forged late, backdated, and non-consecutive crossing histories", () => {
    const schedule = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "zExtent", value: 16 },
        environment: changedGG(3),
      },
    ]);
    const before = cursorBeforeCycle(schedule, 3, extents(8, 8, 15));
    const legitimate = evaluateTimelineBoundary(
      schedule,
      before,
      after(3, extents(8, 8, 18)),
    ).cursor;
    const entry = legitimate.eventLog[0];

    const late = {
      ...legitimate,
      eventLog: [{ ...entry, previousBoundary: after(2, extents(8, 8, 16)) }],
    };
    expect(() => evaluateTimelineBoundary(schedule, late, after(4, extents(8, 8, 18))))
      .toThrow(/first extent crossing/);

    const backdated = {
      ...legitimate,
      eventLog: [
        {
          ...entry,
          previousBoundary: { phase: "initial", completedCycles: 0 } as TimelineBoundary,
          crossingBoundary: after(1, extents(8, 8, 18)),
        },
      ],
    };
    expect(() => evaluateTimelineBoundary(schedule, backdated, after(4, extents(8, 8, 18))))
      .toThrow(/raw extent boundaries/);

    const skipped = {
      ...legitimate,
      eventLog: [
        {
          ...entry,
          previousBoundary: after(1, extents(8, 8, 15)),
          crossingBoundary: after(3, extents(8, 8, 18)),
        },
      ],
    };
    expect(() => evaluateTimelineBoundary(schedule, skipped, after(4, extents(8, 8, 18))))
      .toThrow(/consecutive raw extent boundaries/);
  });

  it("rejects shrinking non-trigger extents throughout retained cursor history", () => {
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
        trigger: { kind: "tick", value: 5 },
        environment: changedGG(4),
      },
    ]);
    let cursor = beginSchedule(schedule);
    cursor = evaluateTimelineBoundary(schedule, cursor, after(1, extents(9, 9, 15, 20))).cursor;
    const firstEvent = evaluateTimelineBoundary(
      schedule,
      cursor,
      after(2, extents(9, 9, 18, 24)),
    );

    const shrinkingInsideEntry = {
      ...firstEvent.cursor,
      lastBoundary: after(2, extents(8, 8, 18, 24)),
      eventLog: [
        {
          ...firstEvent.cursor.eventLog[0],
          crossingBoundary: after(2, extents(8, 8, 18, 24)),
        },
      ],
    };
    expect(() =>
      evaluateTimelineBoundary(
        schedule,
        shrinkingInsideEntry,
        after(3, extents(8, 8, 18, 24)),
      ),
    ).toThrow(/iExtent cannot shrink/);

    cursor = evaluateTimelineBoundary(
      schedule,
      firstEvent.cursor,
      after(3, extents(9, 9, 18, 24)),
    ).cursor;
    const shrinkingAfterLastEvent = {
      ...cursor,
      lastBoundary: after(3, extents(9, 9, 18, 23)),
    };
    expect(() =>
      evaluateTimelineBoundary(
        schedule,
        shrinkingAfterLastEvent,
        after(4, extents(9, 9, 18, 23)),
      ),
    ).toThrow(/attachedCount cannot shrink/);

    cursor = evaluateTimelineBoundary(
      schedule,
      cursor,
      after(4, extents(9, 9, 18, 24)),
    ).cursor;
    const secondEvent = evaluateTimelineBoundary(
      schedule,
      cursor,
      after(5, extents(9, 9, 18, 25)),
    );
    const shrinkingBetweenEntries = {
      ...secondEvent.cursor,
      lastBoundary: after(5, extents(8, 8, 18, 25)),
      eventLog: [
        secondEvent.cursor.eventLog[0],
        {
          ...secondEvent.cursor.eventLog[1],
          previousBoundary: after(4, extents(8, 8, 18, 24)),
          crossingBoundary: after(5, extents(8, 8, 18, 25)),
        },
      ],
    };
    expect(() =>
      evaluateTimelineBoundary(
        schedule,
        shrinkingBetweenEntries,
        after(6, extents(8, 8, 18, 25)),
      ),
    ).toThrow(/iExtent cannot shrink/);
  });

  it("rejects negative zero in schedules, boundaries, cursors, and fingerprint-colliding inputs", () => {
    const positive = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "tick", value: 1 },
        environment: changedGG(3),
      },
    ]);
    const negativePhi = ggSchedule(positive.events, { ...ggInitial, phi: -0 });
    expect(JSON.stringify(negativePhi)).toBe(JSON.stringify(positive));
    expect(() => validateTimelineSchedule(negativePhi)).toThrow(/negative zero/);
    expect(() =>
      evaluateTimelineBoundary(
        negativePhi,
        createTimelineCursor(positive),
        { phase: "initial", completedCycles: 0 },
      ),
    ).toThrow(/negative zero/);

    const negativeVector = ggSchedule([], {
      ...ggInitial,
      kappa: [-0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    });
    expect(() => validateTimelineSchedule(negativeVector)).toThrow(/negative-zero/);

    const negativeTrigger = ggSchedule([
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "tick", value: -0 },
        environment: changedGG(3),
      },
    ]);
    expect(() => validateTimelineSchedule(negativeTrigger)).toThrow(/safe integer/);

    expect(() =>
      evaluateTimelineBoundary(
        positive,
        createTimelineCursor(positive),
        { phase: "initial", completedCycles: -0 },
      ),
    ).toThrow(/exactly zero/);

    const cursor = createTimelineCursor(positive);
    const negativeCursor = { ...cursor, nextEventIndex: -0 };
    expect(() =>
      evaluateTimelineBoundary(
        positive,
        negativeCursor,
        { phase: "initial", completedCycles: 0 },
      ),
    ).toThrow(/nextEventIndex/);
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
