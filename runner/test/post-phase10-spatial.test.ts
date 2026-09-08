import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { alphaHK, coordsOf, hexSeedSites, idx, neighborIndices } from "@vcc/core";
import {
  POST_PHASE10_SMOKE_ROWS,
  runPostPhase10DiscoveryRow,
  type DiscoverySpatialSnapshot,
} from "../src/post-phase10-discovery.ts";

const temporaryDirectories: string[] = [];
function scratch(): string {
  const directory = mkdtempSync(join(tmpdir(), "vcc-cavity-spatial-"));
  temporaryDirectories.push(directory);
  return directory;
}
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("optional spatial boundary observations", () => {
  it("records the converged pre-update boundary without changing numerical trajectories", () => {
    const without = scratch();
    const withSnapshots = scratch();
    const row = { ...POST_PHASE10_SMOKE_ROWS[0], dimsN: 20, cflFill: 0.5, targetExtent: 7, maxSteps: 100 };
    const baseline = runPostPhase10DiscoveryRow(row, without);
    const observed = runPostPhase10DiscoveryRow(
      { ...row, spatialSampleExtents: [3, 5, 6] }, withSnapshots,
    );
    expect(baseline.admissible, JSON.stringify(baseline)).toBe(true);
    expect(observed.admissible, JSON.stringify(observed)).toBe(true);
    const events = (directory: string): Record<string, unknown>[] =>
      readFileSync(join(directory, "events.jsonl"), "utf8").trim().split("\n")
        .map((line) => {
          const event = JSON.parse(line) as Record<string, unknown>;
          delete event.rssBytes;
          return event;
        });
    expect(events(withSnapshots)).toEqual(events(without));
    expect(observed.spatialSnapshots?.map((record) => record.triggerExtent)).toEqual([3, 5]);
    expect(baseline.spatialSnapshots).toBeUndefined();
    expect(readdirSync(without).some((name) => name.startsWith("boundary-"))).toBe(false);

    const trajectory = events(withSnapshots);
    for (const record of observed.spatialSnapshots ?? []) {
      const snapshot = JSON.parse(readFileSync(join(withSnapshots, record.path), "utf8")) as
        DiscoverySpatialSnapshot;
      expect(snapshot.timing).toBe("after-converged-relaxation-before-surface-advance");
      expect(snapshot.record).toEqual(record);
      const cycle = record.completedCycles;
      const initial = new Set(hexSeedSites(snapshot.dims, row.seedRadius, row.seedThickness));
      for (const event of trajectory.slice(0, cycle)) {
        for (const attached of event.attached as { index: number }[]) initial.add(attached.index);
      }
      expect(snapshot.attachedCount).toBe(initial.size);
      expect(record.simTimeSeconds).toBe(cycle === 0 ? 0 : trajectory[cycle - 1].simTimeSeconds);
      expect(record.actualExtent).toBe(cycle === 0 ? 3 : trajectory[cycle - 1].extent);
      expect(record.actualExtent).toBeGreaterThanOrEqual(record.triggerExtent);
      expect(snapshot.cells.length).toBeGreaterThan(0);
      expect(snapshot.cells.length).toBe(
        (trajectory[cycle].boundary as { count: number }).count,
      );
      for (const cell of snapshot.cells) {
        expect(cell.coords).toEqual(coordsOf(snapshot.dims, cell.index));
        expect(initial.has(cell.index)).toBe(false);
        const neighbors = neighborIndices(snapshot.dims, cell.coords[0], cell.coords[1], cell.coords[2]);
        expect(neighbors.some((index) => initial.has(index))).toBe(true);
        expect(cell.neighborCounts).toEqual([
          neighbors.slice(0, 6).filter((index) => initial.has(index)).length,
          neighbors.slice(6).filter((index) => initial.has(index)).length,
        ]);
        // The cached pair is accepted by the nonlinear solver's residual tolerance, not bitwise
        // coefficient re-evaluation at the last returned boundary iterate.
        expect(cell.alphaHKBoundary).toBeCloseTo(
          alphaHK(cell.facet, row.tempC, cell.sigmaBoundary, row.paramSet), 11,
        );
        expect(cell.sigmaBoundary).toBeGreaterThanOrEqual(0);
        expect(cell.sigmaBoundary).toBeLessThanOrEqual(cell.sigmaOpp);
        expect(cell.fill).toBeGreaterThanOrEqual(0);
        expect(cell.fill).toBeLessThanOrEqual(1);
        expect(idx(snapshot.dims, cell.coords[0], cell.coords[1], cell.coords[2])).toBe(cell.index);
      }
    }
  });
});
