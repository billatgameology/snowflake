import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LKSolver } from "@vcc/solver-cpu";
import {
  POST_PHASE10_SMOKE_ROWS,
  runPostPhase10DiscoveryRow,
  type DiscoveryRow,
} from "../src/post-phase10-discovery.ts";

const temporaryDirectories: string[] = [];
function directory(): string {
  const path = mkdtempSync(join(tmpdir(), "vcc-discovery-budget-"));
  temporaryDirectories.push(path);
  return path;
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const path of temporaryDirectories.splice(0)) rmSync(path, { recursive: true, force: true });
});

const prefixRow: DiscoveryRow = {
  ...POST_PHASE10_SMOKE_ROWS[0],
  id: "budget-prefix",
  targetExtent: 9,
  maxSteps: 3,
  experimentalFacetDips: "basal-only",
};

function events(path: string): Record<string, unknown>[] {
  const text = readFileSync(join(path, "events.jsonl"), "utf8").trim();
  return text === "" ? [] : text.split(/\r?\n/u).map((line) => JSON.parse(line) as Record<string, unknown>);
}

function scientificEvents(path: string): Record<string, unknown>[] {
  return events(path).map(({ rssBytes: _rssBytes, ...event }) => event);
}

describe("bounded discovery observation stages", () => {
  it.each([0, -1, Infinity, NaN])("rejects invalid wall budget %s before publishing output", (value) => {
    const path = directory();
    expect(() => runPostPhase10DiscoveryRow(prefixRow, path, { maxWallSeconds: value }))
      .toThrow("maxWallSeconds must be finite and positive");
    expect(existsSync(join(path, "spec.json"))).toBe(false);
  });

  it("can terminate before the first relaxation with an explicit empty completed prefix", () => {
    const path = directory();
    let clock = 0;
    const relax = vi.spyOn(LKSolver.prototype, "relaxField");
    const result = runPostPhase10DiscoveryRow(prefixRow, path, {
      maxWallSeconds: 1,
      budgetClockMilliseconds: () => clock,
      heartbeat: (message) => { if (message.startsWith("start row=")) clock = 1000; },
    });
    expect(relax).not.toHaveBeenCalled();
    expect(events(path)).toEqual([]);
    expect(result).toMatchObject({ stopReason: "wall-budget", cycles: 0, totalSweeps: 0,
      simTimeSeconds: 0, admissible: false, integrityErrors: [],
      executionBudget: { maxWallSeconds: 1, stoppedAt: "cycle-boundary", completedCycles: 0,
        interruptedRelaxation: null, timelineEventReached: null } });
    expect(result.attachedCount).toBe(result.seedSites);
    expect(JSON.parse(readFileSync(join(path, "result.json"), "utf8"))).toEqual(result);
  });

  it("retains one real experimental update byte-for-byte scientifically before a boundary cap", () => {
    const directPath = directory();
    const direct = runPostPhase10DiscoveryRow({ ...prefixRow, maxSteps: 1 }, directPath);
    const path = directory();
    let clock = 0;
    const capped = runPostPhase10DiscoveryRow(prefixRow, path, {
      maxWallSeconds: 1,
      budgetClockMilliseconds: () => clock,
      heartbeat: (message) => { if (message.startsWith("cycle row=")) clock = 1000; },
    });
    expect(capped.stopReason).toBe("wall-budget");
    expect(capped.executionBudget).toMatchObject({ stoppedAt: "cycle-boundary", completedCycles: 1,
      interruptedRelaxation: null });
    expect(capped.admissible).toBe(false);
    expect(scientificEvents(path)).toEqual(scientificEvents(directPath));
    expect(capped.totalSweeps).toBeGreaterThan(0);
    expect(capped.fillLedger).toBeGreaterThan(0);
    expect(capped.simTimeSeconds).toBe(direct.simTimeSeconds);
    expect(capped.fillLedger).toBe(direct.fillLedger);
    expect(capped.totalSweeps).toBe(direct.totalSweeps);
  });

  it("excludes interrupted second relaxation from the complete scientific prefix", () => {
    const directPath = directory();
    const direct = runPostPhase10DiscoveryRow({ ...prefixRow, maxSteps: 1 }, directPath);
    const originalRelax = LKSolver.prototype.relaxField;
    let relaxations = 0;
    vi.spyOn(LKSolver.prototype, "relaxField").mockImplementation(function (this: LKSolver, progress) {
      relaxations++;
      return originalRelax.call(this, progress);
    });
    const path = directory();
    const capped = runPostPhase10DiscoveryRow(prefixRow, path, {
      maxWallSeconds: 1,
      budgetClockMilliseconds: () => relaxations >= 2 ? 1000 : 0,
    });
    expect(capped).toMatchObject({ stopReason: "wall-budget", cycles: 1, admissible: false,
      integrityErrors: [], executionBudget: { stoppedAt: "relaxation", completedCycles: 1,
        interruptedRelaxation: { cycle: 2, sweeps: 1 } } });
    expect(scientificEvents(path)).toEqual(scientificEvents(directPath));
    expect(capped.totalSweeps).toBe(direct.totalSweeps);
    expect(capped.fillLedger).toBe(direct.fillLedger);
    expect(capped.simTimeSeconds).toBe(direct.simTimeSeconds);
    expect(capped.attachedCount).toBe(direct.attachedCount);
  });

  it("records a first-relaxation stop without claiming any completed update", () => {
    const originalRelax = LKSolver.prototype.relaxField;
    let relaxing = false;
    vi.spyOn(LKSolver.prototype, "relaxField").mockImplementation(function (this: LKSolver, progress) {
      relaxing = true;
      return originalRelax.call(this, progress);
    });
    const path = directory();
    const result = runPostPhase10DiscoveryRow(prefixRow, path, {
      maxWallSeconds: 1,
      budgetClockMilliseconds: () => relaxing ? 1000 : 0,
    });
    expect(events(path)).toEqual([]);
    expect(result).toMatchObject({ stopReason: "wall-budget", cycles: 0, totalSweeps: 0,
      fillLedger: 0, simTimeSeconds: 0, admissible: false,
      executionBudget: { stoppedAt: "relaxation", interruptedRelaxation: { cycle: 1, sweeps: 1 } } });
  });

  it("retains ordinary endpoint admissibility and omits budget metadata without opt-in", () => {
    const path = directory();
    const result = runPostPhase10DiscoveryRow(POST_PHASE10_SMOKE_ROWS[0], path);
    expect(result.stopReason).toBe("size-target");
    expect(result.admissible).toBe(true);
    expect(result).not.toHaveProperty("executionBudget");
    expect(JSON.parse(readFileSync(join(path, "spec.json"), "utf8")))
      .not.toHaveProperty("executionBudget");
  });

  it("keeps a reached valid endpoint ahead of a simultaneous wall cap", () => {
    let clock = 0;
    const result = runPostPhase10DiscoveryRow(POST_PHASE10_SMOKE_ROWS[0], directory(), {
      maxWallSeconds: 1,
      budgetClockMilliseconds: () => clock,
      heartbeat: (message) => { if (message.startsWith("cycle row=")) clock = 1000; },
    });
    expect(result).toMatchObject({ stopReason: "size-target", admissible: true, cycles: 1,
      executionBudget: { stoppedAt: null, completedCycles: 1, interruptedRelaxation: null } });
  });

  it("treats a missed timeline event in a budgeted step prefix as unresolved coverage", () => {
    const timelineRow: DiscoveryRow = { ...POST_PHASE10_SMOKE_ROWS[0], targetExtent: 9,
      timelineEvent: { triggerLargestExtent: 7, tempC: -14.4, sigmaInfinity: 0.01 } };
    const result = runPostPhase10DiscoveryRow(timelineRow, directory(), {
      maxWallSeconds: 1, budgetClockMilliseconds: () => 0,
    });
    expect(result).toMatchObject({ stopReason: "step-cap", admissible: false, integrityErrors: [],
      executionBudget: { timelineEventReached: false, stoppedAt: null } });
    const legacy = runPostPhase10DiscoveryRow(timelineRow, directory());
    expect(legacy.integrityErrors).toEqual([`row ${timelineRow.id} did not reach its registered timeline event`]);
  });
});
