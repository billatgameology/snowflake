import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { decodeDiscoveryResumeCheckpoint } from "@vcc/core";
import { LKSolver } from "@vcc/solver-cpu";
import { POST_PHASE10_SMOKE_ROWS, runPostPhase10DiscoveryRow, type DiscoveryRow } from "../src/post-phase10-discovery.ts";
import { type DiscoveryRetainedObservation, type DiscoveryRetainedObservations } from "../src/discovery-retained-observations.ts";

const json = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const directory = () => mkdtempSync(resolve(tmpdir(), "vcc-retained-observations-"));
const row: DiscoveryRow = { ...POST_PHASE10_SMOKE_ROWS[0], id: "retained-switch-witness", targetExtent: 9,
  maxSteps: 8, cflFill: 0.25, spatialSampleExtents: [3, 5, 7], experimentalBasalWidthCells: 4,
  experimentalBasalWidthHistory: { mode: "early-only", cutoffSeconds: 0.4 } };
const config: DiscoveryRetainedObservations = { ageSeconds: [0.2, 0.4], widthHistorySwitch: true,
  centralAttachments: { maxHexRadiusCells: 1, absoluteZOffsets: [1] } };
function events(path: string) {
  return readFileSync(resolve(path, "events.jsonl"), "utf8").trim().split("\n").map((line) => {
    const { rssBytes, ...science } = JSON.parse(line); return science;
  });
}
function label(path: string, name: string): DiscoveryRetainedObservation {
  return json(resolve(path, "captures", "labels", `${name}.json`)) as DiscoveryRetainedObservation;
}
function solver(path: string, state: DiscoveryRetainedObservation["states"][number]) {
  return LKSolver.restoreDiscovery(decodeDiscoveryResumeCheckpoint(readFileSync(resolve(path, state.directory, "solver.bin"))));
}
function resultScience(value: ReturnType<typeof runPostPhase10DiscoveryRow>) {
  const { wallSeconds, peakRssBytes, startedAt, finishedAt, ...science } = value; return science;
}

describe("permanent discovery observations", () => {
  it("retains real switch states and accepted boundaries beyond rotation without changing science", () => {
    const root = directory(), plain = resolve(root, "plain"), observed = resolve(root, "observed");
    const expected = runPostPhase10DiscoveryRow(row, plain, { checkpoint: "create" });
    const actual = runPostPhase10DiscoveryRow(row, observed, { checkpoint: "create", retainedObservations: config });
    expect(actual.integrityErrors).toEqual([]);
    expect(resultScience(actual)).toEqual(resultScience(expected));
    expect(events(observed)).toEqual(events(plain));
    const records = events(observed);
    const inactive = records.find((event) => event.basalWidthObservation.historyActive === false)!;
    expect(inactive).toBeDefined();
    const activeLabel = label(observed, "width-last-active"), inactiveLabel = label(observed, "width-first-inactive");
    expect(activeLabel.states.map((state) => state.tick)).toEqual([inactive.cycle - 2, inactive.cycle - 1]);
    expect(inactiveLabel.states.map((state) => state.tick)).toEqual([inactive.cycle - 1, inactive.cycle]);
    expect(actual.cycles).toBeGreaterThan(inactive.cycle + 1);
    for (const observation of [activeLabel, inactiveLabel]) {
      const boundary = json(resolve(observed, observation.boundary!.path));
      const before = solver(observed, observation.states[0]);
      expect(boundary.completedCycles).toBe(before.tick);
      expect(boundary.simTimeSeconds).toBe(before.simTimeSeconds);
      expect(before.relaxField().converged).toBe(true);
      // Recompute accepted Robin values from the retained preceding full state.
      expect(boundary.cells.length).toBeGreaterThan(0);
      for (const cell of boundary.cells) {
        expect(cell.fill).toBe(before.f[cell.index]);
        expect(cell).toMatchObject(before.boundaryState(cell.index));
      }
    }
    for (const age of config.ageSeconds) {
      const captured = label(observed, `age-${String(age).replaceAll(".", "p")}`);
      expect(captured.states[0].simTimeSeconds).toBeLessThan(age);
      expect(captured.states[1].simTimeSeconds).toBeGreaterThanOrEqual(age);
    }
    expect(label(observed, "initial").states[0].tick).toBe(0);
    expect(label(observed, "terminal").states[0].tick).toBe(actual.cycles);
    expect(readdirSync(resolve(observed, "resume")).filter((name) => name.startsWith("generation-"))).toHaveLength(2);
    const terminal = label(observed, "terminal");
    const latest = json(resolve(plain, "resume/latest.json"));
    expect(readFileSync(resolve(observed, terminal.states[0].directory, "solver.bin")))
      .toEqual(readFileSync(resolve(plain, "resume", latest.current.directory, "solver.bin")));
  });

  it("resumes through switch capture and repairs an interrupted committed copy before rotation", () => {
    const root = directory(), direct = resolve(root, "direct"), split = resolve(root, "split");
    const expected = runPostPhase10DiscoveryRow(row, direct, { checkpoint: "create", retainedObservations: config });
    const switchTick = label(direct, "width-last-active").states[1].tick;
    expect(runPostPhase10DiscoveryRow(row, split, { checkpoint: "create", retainedObservations: config,
      pauseAfterCycles: switchTick }).stopReason).toBe("checkpoint-pause");
    const retained = label(split, "width-last-active");
    // Emulate interruption after restart commit, before this observation's copy/label publication.
    rmSync(resolve(split, "captures/labels/width-last-active.json"));
    rmSync(resolve(split, retained.states[1].directory), { recursive: true });
    const actual = runPostPhase10DiscoveryRow(row, split, { checkpoint: "resume", retainedObservations: config });
    expect(actual.integrityErrors).toEqual([]);
    expect(resultScience(actual)).toEqual(resultScience(expected));
    expect(events(split)).toEqual(events(direct));
    expect(label(split, "width-last-active").states.map((state) => state.tick)).toEqual(retained.states.map((state) => state.tick));
    expect(label(split, "width-first-inactive").states[1].tick).toBe(switchTick + 1);
    for (const name of readdirSync(resolve(direct, "captures/labels"))) {
      const left = json(resolve(direct, "captures/labels", name)) as DiscoveryRetainedObservation;
      const right = json(resolve(split, "captures/labels", name)) as DiscoveryRetainedObservation;
      expect(right.states.map(({ tick, simTimeSeconds, solver }) => ({ tick, simTimeSeconds, solver })))
        .toEqual(left.states.map(({ tick, simTimeSeconds, solver }) => ({ tick, simTimeSeconds, solver })));
    }
  });

  it("captures each intersecting central attachment batch and independently checks its geometry", () => {
    const root = directory();
    const candidate = { ...row, maxSteps: 30, targetExtent: 15 };
    const result = runPostPhase10DiscoveryRow(candidate, root, { checkpoint: "create", retainedObservations: config });
    expect(result.integrityErrors).toEqual([]);
    const initial = solver(root, label(root, "initial").states[0]);
    const intersects = (coords: number[]) => {
      const [q, r, z] = coords.map((value, i) => value - initial.center[i]);
      return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= 1 && Math.abs(z) === 1;
    };
    const required = events(root).filter((event) => event.attached.some((cell: { coords: number[] }) => intersects(cell.coords)));
    expect(required.length).toBeGreaterThan(0);
    const names = readdirSync(resolve(root, "captures/labels")).filter((name) => name.startsWith("central-attachments-"));
    expect(names).toHaveLength(required.length);
    for (const event of required) {
      const capture = label(root, `central-attachments-cycle-${event.cycle}`);
      expect(capture.centralAttachedIndices).toEqual(event.attached.filter((cell: { coords: number[] }) => intersects(cell.coords))
        .map((cell: { index: number }) => cell.index));
      const before = solver(root, capture.states[0]), after = solver(root, capture.states[1]);
      for (const index of capture.centralAttachedIndices!) {
        expect(before.a[index]).toBe(0); expect(after.a[index]).toBe(1);
      }
    }
  });

  it("refuses changed or omitted observation settings before resuming scientific output", () => {
    const root = directory();
    runPostPhase10DiscoveryRow(row, root, { checkpoint: "create", retainedObservations: config, pauseAfterCycles: 2 });
    const before = readFileSync(resolve(root, "events.jsonl"));
    expect(() => runPostPhase10DiscoveryRow(row, root, { checkpoint: "resume", retainedObservations: { ...config, ageSeconds: [0.3] } })).toThrow(/spec mismatch/);
    expect(() => runPostPhase10DiscoveryRow(row, root, { checkpoint: "resume" })).toThrow(/spec mismatch/);
    expect(readFileSync(resolve(root, "events.jsonl"))).toEqual(before);
  });

  it("refuses an accidentally truncated published capture before another update", () => {
    const root = directory();
    runPostPhase10DiscoveryRow(row, root, { checkpoint: "create", retainedObservations: config, pauseAfterCycles: 2 });
    const retained = label(root, "initial");
    writeFileSync(resolve(root, retained.states[0].directory, "solver.bin"), "incomplete copy");
    const before = readFileSync(resolve(root, "events.jsonl"));
    expect(() => runPostPhase10DiscoveryRow(row, root, { checkpoint: "resume", retainedObservations: config })).toThrow(/payload mismatch/);
    expect(readFileSync(resolve(root, "events.jsonl"))).toEqual(before);
  });
});
