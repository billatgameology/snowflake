import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  lockedAttemptId: "c0v-moving-produce-20260822-v3",
  lockCallbacks: 0,
  preflightCalls: 0,
  watchdogAssertions: 0,
}));

vi.mock("../src/phase10-c0v-s6-filesystem.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/phase10-c0v-s6-filesystem.ts")>();
  return {
    ...actual,
    async phase10C0VS6WithPackageAndPacketLocks(
      root: unknown,
      packetId: string,
      mode: string,
      action: (...argumentsValue: never[]) => unknown,
    ): Promise<unknown> {
      if (root === null || packetId !== "c0v-moving-produce" || mode !== "run") {
        throw new Error("unexpected synthetic lock-wrapper call");
      }
      harness.lockCallbacks += 1;
      return action(
        Object.freeze({}) as never,
        Object.freeze({
          packet: Object.freeze({
            packetId: "c0v-moving-produce",
            registeredAttemptId: harness.lockedAttemptId,
          }),
        }) as never,
        Object.freeze({
          assertActive(): void {
            harness.watchdogAssertions += 1;
          },
        }) as never,
      );
    },
  };
});

vi.mock("../src/phase10-c0v-s6-preflight-observer.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/phase10-c0v-s6-preflight-observer.ts")>();
  return {
    ...actual,
    phase10C0VS6WriteObservedPreflight(): never {
      harness.preflightCalls += 1;
      throw new Error("synthetic moving preflight boundary reached");
    },
  };
});

vi.mock("../src/phase10-c0v-s6-worker-transport.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/phase10-c0v-s6-worker-transport.ts")>();
  return {
    ...actual,
    phase10C0VS6AssertExactRuntimeLoaderState(): void {},
  };
});

import {
  PHASE10_C0V_S6_CURRENT_MOVING_ATTEMPT_ID,
} from "../src/phase10-c0v-s6-contracts.ts";
import { phase10C0VS6RunExecutor } from "../src/phase10-c0v-s6-executor.ts";
import {
  PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY,
} from "../src/phase10-c0v-s6-worker-transport.ts";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));

function movingRunArguments(): readonly string[] {
  const authority = PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY["c0v-moving-produce"];
  return Object.freeze([
    "run",
    "--packet",
    "c0v-moving-produce",
    "--protocol",
    authority.protocolPath,
    "--attempt",
    authority.attemptId,
  ]);
}

describe("Phase 10 C0V S6 locked moving dispatch authority", () => {
  beforeEach(() => {
    harness.lockedAttemptId = PHASE10_C0V_S6_CURRENT_MOVING_ATTEMPT_ID;
    harness.lockCallbacks = 0;
    harness.preflightCalls = 0;
    harness.watchdogAssertions = 0;
  });

  it("admits only the shared current moving attempt at the locked runner boundary", async () => {
    expect(PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY["c0v-moving-produce"].attemptId)
      .toBe(PHASE10_C0V_S6_CURRENT_MOVING_ATTEMPT_ID);

    await expect(phase10C0VS6RunExecutor(movingRunArguments(), repositoryRoot))
      .rejects.toThrow(/synthetic moving preflight boundary reached/u);
    expect(harness.lockCallbacks).toBe(1);
    expect(harness.watchdogAssertions).toBe(1);
    expect(harness.preflightCalls).toBe(1);

    harness.lockedAttemptId = "c0v-moving-produce-20260822-v2";
    harness.preflightCalls = 0;
    harness.watchdogAssertions = 0;
    harness.lockCallbacks = 0;
    await expect(phase10C0VS6RunExecutor(movingRunArguments(), repositoryRoot))
      .rejects.toThrow(/locked moving runner received different packet authority/u);
    expect(harness.lockCallbacks).toBe(1);
    expect(harness.watchdogAssertions).toBe(0);
    expect(harness.preflightCalls).toBe(0);
  });
});
