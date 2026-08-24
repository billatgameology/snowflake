import { hrtime } from "node:process";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  phase10C0VS6CaptureGovernedLeafArrivalTransition,
  phase10C0VS6RunGovernedLeafFromDeferredArrivalWithWatchdog,
  phase10C0VS6RunGovernedLeafFromArrivalWithWatchdog,
  phase10C0VS6RunGovernedLeafWithWatchdog,
  phase10C0VS6WithOuterInfrastructureWatchdog,
  type Phase10C0VS6GovernedLeafArrivalTransition,
} from "../src/phase10-c0v-s6-watchdog.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

function requiredTransition(
  value: Phase10C0VS6GovernedLeafArrivalTransition | null,
): Phase10C0VS6GovernedLeafArrivalTransition {
  if (value === null) throw new Error("test did not capture its governed LF-arrival transition");
  return value;
}

describe("Phase 10 C0V S6 governed LF-arrival transitions", () => {
  it("uses one authenticated LF arrival as the prior finish and next exact start", async () => {
    const origin = 50_000_000_000n;
    const leafMaximum = 300_000_000_000n;
    let now = origin;
    vi.spyOn(hrtime, "bigint").mockImplementation(() => now);
    await phase10C0VS6WithOuterInfrastructureWatchdog(
      1_000_000_000_000,
      async (outer) => {
        let transition: Phase10C0VS6GovernedLeafArrivalTransition | null = null;
        const evaluator = await phase10C0VS6RunGovernedLeafWithWatchdog(
          outer,
          300,
          () => {
            throw new Error("timely evaluator must not terminate");
          },
          (_signal, _assertActive, complete, startedAt) => {
            expect(startedAt).toBe(origin);
            now = origin + leafMaximum;
            transition = phase10C0VS6CaptureGovernedLeafArrivalTransition(outer);
            return complete("evaluator-complete", transition);
          },
        );
        expect(evaluator).toEqual({
          terminalState: "complete",
          startedAtMonotonicNanoseconds: origin,
          finishedAtMonotonicNanoseconds: origin + leafMaximum,
          elapsedNanoseconds: Number(leafMaximum),
          value: "evaluator-complete",
        });
        expect(transition).not.toBeNull();

        // Parent parsing/ACK work occurs after the raw LF arrival. It is charged to the next leaf
        // because that leaf's exact start is the already captured transition boundary.
        now += 123_456n;
        const next = await phase10C0VS6RunGovernedLeafFromArrivalWithWatchdog(
          outer,
          requiredTransition(transition),
          300,
          () => {
            throw new Error("timely next leaf must not terminate");
          },
          (_signal, _assertActive, complete, startedAt) => {
            expect(startedAt).toBe(origin + leafMaximum);
            now = startedAt + leafMaximum;
            return complete("finite-complete");
          },
        );
        expect(next).toEqual({
          terminalState: "complete",
          startedAtMonotonicNanoseconds: origin + leafMaximum,
          finishedAtMonotonicNanoseconds: origin + leafMaximum * 2n,
          elapsedNanoseconds: Number(leafMaximum),
          value: "finite-complete",
        });
      },
      "LF-arrival equality chain",
    );
  });

  it("caps before the next action when parent delay puts a captured start at limit plus one ns", async () => {
    const origin = 70_000_000_000n;
    const leafMaximum = 300_000_000_000n;
    let now = origin;
    let nextActionBegan = false;
    let terminationCalled = false;
    vi.spyOn(hrtime, "bigint").mockImplementation(() => now);
    await phase10C0VS6WithOuterInfrastructureWatchdog(
      1_000_000_000_000,
      async (outer) => {
        let transition: Phase10C0VS6GovernedLeafArrivalTransition | null = null;
        await phase10C0VS6RunGovernedLeafWithWatchdog(
          outer,
          300,
          () => {
            throw new Error("short prior leaf must not terminate");
          },
          (_signal, _assertActive, complete) => {
            now = origin + 1n;
            transition = phase10C0VS6CaptureGovernedLeafArrivalTransition(outer);
            return complete("prior", transition);
          },
        );
        now = origin + 1n + leafMaximum + 1n;
        const capped = await phase10C0VS6RunGovernedLeafFromArrivalWithWatchdog(
          outer,
          requiredTransition(transition),
          300,
          () => {
            terminationCalled = true;
          },
          () => {
            nextActionBegan = true;
            throw new Error("late next action must not begin");
          },
        );
        expect(capped).toEqual({
          terminalState: "registered-cap",
          startedAtMonotonicNanoseconds: origin + 1n,
          finishedAtMonotonicNanoseconds: origin + 1n + leafMaximum + 1n,
          elapsedNanoseconds: Number(leafMaximum + 1n),
          value: null,
        });
      },
      "LF-arrival delayed next start",
    );
    expect(nextActionBegan).toBe(false);
    expect(terminationCalled).toBe(true);
  });

  it("starts a post-ACK leaf at its own deferred LF arrival while retaining one termination target", async () => {
    const origin = 80_000_000_000n;
    const persistenceAndAckGap = 90_000_000_000n;
    const childStartWait = 7_000_000_000n;
    const leafMaximum = 300_000_000_000n;
    let now = origin;
    vi.spyOn(hrtime, "bigint").mockImplementation(() => now);
    await phase10C0VS6WithOuterInfrastructureWatchdog(
      1_000_000_000_000,
      async (outer) => {
        const prior = await phase10C0VS6RunGovernedLeafWithWatchdog(
          outer,
          300,
          () => undefined,
          (_signal, _assertActive, complete) => {
            now += 1n;
            return complete("finite-complete");
          },
        );
        expect(prior.elapsedNanoseconds).toBe(1);
        now += persistenceAndAckGap;
        const expectedStart = now + childStartWait;
        const next = await phase10C0VS6RunGovernedLeafFromDeferredArrivalWithWatchdog(
          outer,
          300,
          () => {
            throw new Error("timely deferred leaf must not terminate");
          },
          (_signal, captureArrival) => {
            now += childStartWait;
            return captureArrival();
          },
          (_signal, _assertActive, complete, startedAt) => {
            expect(startedAt).toBe(expectedStart);
            now = startedAt + leafMaximum;
            return complete("forged-complete");
          },
        );
        expect(next).toEqual({
          terminalState: "complete",
          startedAtMonotonicNanoseconds: expectedStart,
          finishedAtMonotonicNanoseconds: expectedStart + leafMaximum,
          elapsedNanoseconds: Number(leafMaximum),
          value: "forged-complete",
        });
      },
      "deferred post-ACK governed start",
    );
  });

  it("caps a deferred start before action when LF processing crosses by one ns", async () => {
    const origin = 85_000_000_000n;
    const leafMaximum = 300_000_000_000n;
    let now = origin;
    let actionBegan = false;
    let terminationCalled = false;
    vi.spyOn(hrtime, "bigint").mockImplementation(() => now);
    await phase10C0VS6WithOuterInfrastructureWatchdog(
      1_000_000_000_000,
      async (outer) => {
        const capped = await phase10C0VS6RunGovernedLeafFromDeferredArrivalWithWatchdog(
          outer,
          300,
          () => {
            terminationCalled = true;
          },
          (_signal, captureArrival) => {
            const transition = captureArrival();
            now += leafMaximum + 1n;
            return transition;
          },
          () => {
            actionBegan = true;
            throw new Error("late deferred action must not begin");
          },
        );
        expect(capped).toEqual({
          terminalState: "registered-cap",
          startedAtMonotonicNanoseconds: origin,
          finishedAtMonotonicNanoseconds: origin + leafMaximum + 1n,
          elapsedNanoseconds: Number(leafMaximum + 1n),
          value: null,
        });
      },
      "deferred governed start overrun",
    );
    expect(actionBegan).toBe(false);
    expect(terminationCalled).toBe(true);
  });

  it("rejects forged and repeated start transitions and quiesces the active child", async () => {
    let forgedTerminationCalled = false;
    await expect(phase10C0VS6WithOuterInfrastructureWatchdog(
      1_000_000_000_000,
      (outer) => phase10C0VS6RunGovernedLeafFromArrivalWithWatchdog(
        outer,
        Object.freeze({ phase10C0VS6GovernedLeafArrivalTransition: true }),
        300,
        () => {
          forgedTerminationCalled = true;
        },
        () => {
          throw new Error("forged transition action must not begin");
        },
      ),
      "forged LF-arrival transition",
    )).rejects.toThrow(/not issued by the parent runtime/u);
    expect(forgedTerminationCalled).toBe(true);

    const origin = 90_000_000_000n;
    let now = origin;
    let repeatedTerminationCalled = false;
    vi.spyOn(hrtime, "bigint").mockImplementation(() => now);
    await expect(phase10C0VS6WithOuterInfrastructureWatchdog(
      1_000_000_000_000,
      async (outer) => {
        let transition: Phase10C0VS6GovernedLeafArrivalTransition | null = null;
        await phase10C0VS6RunGovernedLeafWithWatchdog(
          outer,
          300,
          () => undefined,
          (_signal, _assertActive, complete) => {
            now += 1n;
            transition = phase10C0VS6CaptureGovernedLeafArrivalTransition(outer);
            return complete("prior", transition);
          },
        );
        await phase10C0VS6RunGovernedLeafFromArrivalWithWatchdog(
          outer,
          requiredTransition(transition),
          300,
          () => undefined,
          (_signal, _assertActive, complete) => complete("next"),
        );
        return phase10C0VS6RunGovernedLeafFromArrivalWithWatchdog(
          outer,
          requiredTransition(transition),
          300,
          () => {
            repeatedTerminationCalled = true;
          },
          () => {
            throw new Error("repeated transition action must not begin");
          },
        );
      },
      "repeated LF-arrival transition",
    )).rejects.toThrow(/start boundary was consumed more than once/u);
    expect(repeatedTerminationCalled).toBe(true);
  });
});
