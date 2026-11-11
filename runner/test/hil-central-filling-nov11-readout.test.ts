import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { decodeDiscoveryResumeCheckpoint, idx } from "@vcc/core";
import { LKSolver } from "@vcc/solver-cpu";
import { readCentralFillingRow, readHilCentralFillingCampaign } from "../src/hil-central-filling-nov11-readout.ts";
import { HIL_CENTRAL_FILLING_NOV11_ROWS } from "../src/hil-central-filling-nov11-roster.ts";
import type { DiscoveryRetainedObservations } from "../src/discovery-retained-observations.ts";
import { POST_PHASE10_SMOKE_ROWS, runPostPhase10DiscoveryRow } from "../src/post-phase10-discovery.ts";

const temporary: string[] = [];
function directory() { const path = mkdtempSync(join(tmpdir(), "vcc-central-readout-")); temporary.push(path); return path; }
const json = (path: string, value: unknown) => writeFileSync(path, JSON.stringify(value));
const config: DiscoveryRetainedObservations = {
  ageSeconds: [.1, .5, 1000], widthHistorySwitch: true,
  centralAttachments: { maxHexRadiusCells: 1, absoluteZOffsets: [1] },
};
function captured() {
  const path = directory();
  const row = { ...POST_PHASE10_SMOKE_ROWS[0], id: "central-readout-witness", targetExtent: 9,
    maxSteps: 8, cflFill: .25, experimentalBasalWidthCells: 3,
    experimentalBasalWidthHistory: { mode: "early-only" as const, cutoffSeconds: .4 } };
  runPostPhase10DiscoveryRow(row, path, { checkpoint: "create", retainedObservations: config });
  json(join(path, "exit.json"), { rowId: row.id, exitCode: 0, signal: null });
  return { path, row };
}
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });

describe("central-filling retained observation readout", () => {
  it("selects all forty registered rows, preserving missing captures and unavailable cohort conclusions", () => {
    const report = readHilCentralFillingCampaign(directory());
    expect(report.rows.map((row) => row.rowId)).toEqual(HIL_CENTRAL_FILLING_NOV11_ROWS.map(({ row }) => row.id));
    expect(report.census).toEqual({ requestedRows: 40, sizeEndpoints: 0, rowsWithCaptures: 0, retainedStates: 0 });
    expect(report.rows[0].retainedObservations.centralRegionSites).toBe(38);
    expect(report.rows[4].retainedObservations.centralRegionSites).toBe(14);
    expect(report.rows.every((row) => row.retainedObservations.missingLabels.includes("width-first-inactive"))).toBe(true);
    expect(report.matchedCohortComparisons.available).toBe(false);
  });

  it("reads real retained solver arrays and accepted maps without advancing them; unachieved ages remain missing", () => {
    const { path, row } = captured();
    const report = readCentralFillingRow(path, row, config), observations = report.retainedObservations;
    expect(observations.missingLabels).toContain("age-1000");
    expect(observations.completeNamedLabels).toBe(false);
    expect(observations.labels.some((label) => label.label === "initial")).toBe(true);
    const inactive = observations.labels.find((label) => label.label === "width-first-inactive");
    expect(inactive?.boundaryReadout?.timing).toBe("after-converged-relaxation-before-surface-advance");
    expect(inactive?.boundaryReadout?.centralCells.some((cell) => cell.values !== null)).toBe(true);
    expect(observations.states.length).toBeGreaterThan(2);
    expect(observations.states.some((state) => state.centralCells.some((cell) => !cell.attached && cell.fill > 0))).toBe(true);
    for (const state of observations.states) {
      const bytes = readFileSync(join(path, state.source.directory, "solver.bin"));
      const solver = LKSolver.restoreDiscovery(decodeDiscoveryResumeCheckpoint(bytes));
      const center = solver.center;
      // Direct axial index calculation is separate from the readout's hex-region enumeration.
      for (const z of [-1, 1]) {
        const index = idx(solver.dims, center[0], center[1], center[2] + z);
        expect(state.centralCells.find((cell) => cell.index === index)).toMatchObject({
          fill: solver.f[index], attached: solver.a[index] === 1,
          latticeCellSigma: solver.a[index] === 1 ? null : solver.sigma[index],
        });
      }
      expect(state.attachedCount).toBe(solver.a.reduce((sum, value) => sum + value, 0));
      expect(state.tick).toBe(solver.tick);
      expect(state.simTimeSeconds).toBe(solver.simTimeSeconds);
      expect(state.source.solver.sha256).toBe(createHash("sha256").update(bytes).digest("hex"));
      expect(readFileSync(join(path, state.source.directory, "solver.bin"))).toEqual(bytes);
    }
  });

  it("rejects mismatched observation specifications and corruption of retained payloads", () => {
    const { path, row } = captured();
    expect(() => readCentralFillingRow(path, row, { ...config, ageSeconds: [.2] })).toThrow("registered observation mismatch");
    const report = readCentralFillingRow(path, row, config);
    const state = report.retainedObservations.states[0];
    const target = join(path, state.source.directory, "solver.bin");
    const bytes = readFileSync(target); bytes[bytes.length - 1] ^= 1; writeFileSync(target, bytes);
    expect(() => readCentralFillingRow(path, row, config)).toThrow("retained digest mismatch");
  });
});
