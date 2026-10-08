import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LKSolver } from "@vcc/solver-cpu";
import { encodeDiscoveryResumeCheckpoint } from "@vcc/core";
import { DiscoveryCheckpointStore } from "../src/discovery-resume-io.ts";
import { batchGitHead } from "../src/hil-bld-batch-execution.ts";
import { POST_PHASE10_SMOKE_ROWS, runPostPhase10DiscoveryRow } from "../src/post-phase10-discovery.ts";

const injectedRename = vi.hoisted(() => vi.fn());
vi.mock("node:fs", async (original) => {
  const actual = await original<typeof import("node:fs")>();
  return { ...actual, renameSync: (...args: Parameters<typeof actual.renameSync>) => {
    injectedRename(...args);
    return actual.renameSync(...args);
  } };
});
afterEach(() => { injectedRename.mockReset(); vi.restoreAllMocks(); });

function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), "vcc-publication-"));
  const row = { ...POST_PHASE10_SMOKE_ROWS[0], id: "publication-witness", targetExtent: 9,
    maxSteps: 8, cflFill: 0.25, spatialSampleExtents: [] };
  const output = resolve(root, "recoverable");
  const nextOutput = resolve(root, "next");
  expect(runPostPhase10DiscoveryRow(row, output, { checkpoint: "create", pauseAfterCycles: 2 }).stopReason)
    .toBe("checkpoint-pause");
  expect(runPostPhase10DiscoveryRow(row, nextOutput, { checkpoint: "create", pauseAfterCycles: 3 }).stopReason)
    .toBe("checkpoint-pause");
  const store = new DiscoveryCheckpointStore(output, row, batchGitHead());
  const next = new DiscoveryCheckpointStore(nextOutput, row, batchGitHead()).load()!;
  const state = LKSolver.restoreDiscovery(next.decoded).exportDiscoveryResumeState();
  const pointerPath = resolve(output, "resume/latest.json");
  const previousPointer = readFileSync(pointerPath);
  const previous = store.load()!;
  const previousState = encodeDiscoveryResumeCheckpoint(LKSolver.restoreDiscovery(previous.decoded).exportDiscoveryResumeState());
  // A completed third observation precedes its attempted atomic checkpoint publication.
  const eventPath = resolve(output, "events.jsonl");
  const thirdEvent = readFileSync(resolve(nextOutput, "events.jsonl"), "utf8").trim().split("\n").at(-1)!;
  writeFileSync(eventPath, readFileSync(eventPath, "utf8") + thirdEvent + "\n");
  injectedRename.mockClear();
  const wait = vi.spyOn(Atomics, "wait").mockReturnValue("timed-out");
  return { row, output, store, state, runner: next.runner, pointerPath, previousPointer,
    previousRunner: previous.runner, previousState, wait };
}

type Boundary = "generation" | "pointer";
function matches(boundary: Boundary, destination: string): boolean {
  return boundary === "pointer" ? /[/\\]latest\.json$/.test(destination) : /[/\\]generation-3-/.test(destination);
}

describe("bounded checkpoint publication retries", () => {
  for (const boundary of ["generation", "pointer"] as const) {
    it.each(["EPERM", "EACCES", "EBUSY"])(`${boundary}: transient %s publishes the exact new state once`, (code) => {
      const f = fixture();
      let attempts = 0;
      injectedRename.mockImplementation((_source: string, destination: string) => {
        if (matches(boundary, destination) && ++attempts <= 2) throw Object.assign(new Error("busy"), { code });
      });
      f.store.save(f.state, f.runner);
      expect(attempts).toBe(3);
      expect(f.wait.mock.calls.map((call) => call[3])).toEqual([25, 50]);
      expect(readFileSync(f.pointerPath)).not.toEqual(f.previousPointer);
      const loaded = f.store.load()!;
      expect(loaded.decoded.tick).toBe(3);
      expect(loaded.runner).toEqual(f.runner);
      expect(encodeDiscoveryResumeCheckpoint(LKSolver.restoreDiscovery(loaded.decoded).exportDiscoveryResumeState()))
        .toEqual(encodeDiscoveryResumeCheckpoint(f.state));
      expect(readFileSync(resolve(f.output, "events.jsonl"), "utf8").trim().split("\n")).toHaveLength(3);
    });

    it.each(["EPERM", "EIO"])(`${boundary}: persistent %s preserves the prior valid checkpoint`, (code) => {
      const f = fixture();
      const error = Object.assign(new Error("publication failed"), { code });
      let attempts = 0;
      injectedRename.mockImplementation((_source: string, destination: string) => {
        if (matches(boundary, destination)) { attempts++; throw error; }
      });
      expect(() => f.store.save(f.state, f.runner)).toThrow(error);
      expect(attempts).toBe(code === "EPERM" ? 7 : 1);
      expect(f.wait.mock.calls.map((call) => call[3])).toEqual(code === "EPERM" ? [25, 50, 100, 200, 400, 800] : []);
      expect(readFileSync(f.pointerPath)).toEqual(f.previousPointer);
      const loaded = f.store.load()!;
      expect(loaded.decoded.tick).toBe(2);
      expect(loaded.runner).toEqual(f.previousRunner);
      expect(encodeDiscoveryResumeCheckpoint(LKSolver.restoreDiscovery(loaded.decoded).exportDiscoveryResumeState()))
        .toEqual(f.previousState);
      // The unpublished observation tail remains available for the existing recovery path.
      expect(readFileSync(resolve(f.output, "events.jsonl"), "utf8").trim().split("\n")).toHaveLength(3);
    });
  }
});
