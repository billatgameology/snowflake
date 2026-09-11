import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { alphaHK, vKin } from "@vcc/core";
import { afterEach, describe, expect, it } from "vitest";
import { findPostPhase10FollowupRow } from "../src/post-phase10-followup.ts";
import {
  POST_PHASE10_BASAL_WIDTH_ROWS,
  POST_PHASE10_BASAL_WIDTH_REUSED_CONTROLS,
  findPostPhase10BasalWidthRow,
} from "../src/post-phase10-basal-width.ts";
import {
  DISCOVERY_BASAL_WIDTH_EXPERIMENT_ID,
  POST_PHASE10_SMOKE_ROWS,
  discoveryExperimentIdentity,
  runPostPhase10DiscoveryRow,
  type DiscoverySpatialSnapshot,
} from "../src/post-phase10-discovery.ts";

const temporaryDirectories: string[] = [];
function scratch(): string {
  const directory = mkdtempSync(join(tmpdir(), "vcc-basal-width-"));
  temporaryDirectories.push(directory);
  return directory;
}
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("bounded local basal-width experiment", () => {
  it("registers four interventions with the existing larger controls, not new control runs", () => {
    expect(POST_PHASE10_BASAL_WIDTH_ROWS.map(row => row.id)).toEqual(
      ["4p5", "5"].flatMap(tag => [2, 3].map(width => `basal-width-t${tag}-le${width}`)),
    );
    for (const row of POST_PHASE10_BASAL_WIDTH_ROWS) {
      const tag = row.tempC === -4.5 ? "4p5" : "5";
      const baseline = findPostPhase10FollowupRow(`followup-larger-cavity-t${tag}-f0p075-nodip`)!;
      const { experimentalBasalWidthCells, ...otherSettings } = row;
      expect([2, 3]).toContain(experimentalBasalWidthCells);
      expect({ ...otherSettings, id: baseline.id, paramSet: baseline.paramSet }).toEqual(baseline);
      expect(row.paramSet).toBe("M1");
      expect(findPostPhase10BasalWidthRow(row.id)).toBe(row);
      expect(row).not.toHaveProperty("experimentalFacetDips");
      expect(row).not.toHaveProperty("experimentalHoleFilling");
      expect(row).not.toHaveProperty("spatialSampleExtents");
    }
    expect(POST_PHASE10_BASAL_WIDTH_REUSED_CONTROLS).toHaveLength(4);
    expect(POST_PHASE10_BASAL_WIDTH_REUSED_CONTROLS.map(row => row.rowId)).toEqual(
      ["4p5", "5"].flatMap(tag => [`followup-larger-cavity-t${tag}-f0p075-nodip`,
        `facet-isolation-long-t${tag}-basal-only`]),
    );
    const listed = execFileSync(process.execPath,
      ["runner/src/post-phase10-discovery-main.ts", "list-basal-width"], { encoding: "utf8", windowsHide: true });
    expect(JSON.parse(listed)).toEqual(POST_PHASE10_BASAL_WIDTH_ROWS);
  });

  it.each([2, 3])("records width-%i selection and independently reconstructed basal demand", threshold => {
    const directory = scratch();
    const row = { ...POST_PHASE10_SMOKE_ROWS[0], id: `basal-width-smoke-${threshold}`,
      seedRadius: 2, targetExtent: 5, experimentalBasalWidthCells: threshold, spatialSampleExtents: [5] };
    const messages: string[] = [];
    const result = runPostPhase10DiscoveryRow(row, directory, { heartbeat: message => messages.push(message) });
    expect(result.admissible, JSON.stringify(result)).toBe(true);
    expect(result.cycles).toBe(1);
    const identity = { experimentId: DISCOVERY_BASAL_WIDTH_EXPERIMENT_ID, experimentalBasalWidthCells: threshold };
    const event = JSON.parse(readFileSync(join(directory, "events.jsonl"), "utf8").trim()) as {
      basalWidthObservation: { widthHistogram: Record<string, number>; selectedBasalCells: number;
        unselectedBasalCells: number; selectedKineticDemandFill: number; unselectedKineticDemandFill: number };
      surface: { deltaTimeSeconds: number };
    };
    const snapshot = JSON.parse(readFileSync(join(directory, result.spatialSnapshots![0].path), "utf8")) as DiscoverySpatialSnapshot;
    expect(event.basalWidthObservation).toMatchObject({
      timing: "after-converged-relaxation-before-surface-advance", thresholdCells: threshold,
      completedCyclesBeforeUpdate: 0, simTimeSecondsBeforeUpdate: 0,
      widthHistogram: { "3": 24, "4": 12, "5": 2 },
      selectedBasalCells: threshold === 2 ? 0 : 24, unselectedBasalCells: threshold === 2 ? 38 : 14,
    });
    let selectedDemand = 0, unselectedDemand = 0;
    for (const cell of snapshot.cells) {
      if (cell.facet !== "basal") {
        expect(cell).not.toHaveProperty("basalWidthCells");
        continue;
      }
      const di = cell.coords[0] - snapshot.center[0], dj = cell.coords[1] - snapshot.center[1];
      const width = 5 - Math.max(Math.abs(di), Math.abs(dj), Math.abs(di + dj));
      expect(cell.basalWidthCells).toBe(width);
      expect(cell.basalWidthSelected).toBe(width <= threshold);
      const coefficient = alphaHK("basal", row.tempC, cell.sigmaBoundary,
        width <= threshold ? "M1" : "M1_NO_DIP_ABLATION");
      // The cached coefficient precedes the final Robin substitution; recomputing at its
      // returned sigma differs at the last fixed-point rounding, not in the selected law.
      expect(cell.alphaHKBoundary).toBeCloseTo(coefficient, 12);
      const demand = coefficient * vKin(row.tempC) * cell.sigmaBoundary /
        (cell.fillGeometry * row.dxUm * 1e-6) * event.surface.deltaTimeSeconds;
      if (width <= threshold) selectedDemand += demand;
      else unselectedDemand += demand;
    }
    expect(event.basalWidthObservation.selectedKineticDemandFill).toBeCloseTo(selectedDemand, 12);
    expect(event.basalWidthObservation.unselectedKineticDemandFill).toBeCloseTo(unselectedDemand, 12);
    expect(unselectedDemand).toBeGreaterThan(0);
    if (threshold === 3) expect(selectedDemand).toBeGreaterThan(0);
    for (const record of [result, event, snapshot, ...["spec.json", "host.json", "status.json", "result.json"]
      .map(leaf => JSON.parse(readFileSync(join(directory, leaf), "utf8")) as Record<string, unknown>)]) {
      expect(record).toMatchObject(identity);
      expect(record).not.toHaveProperty("experimentalFacetDips");
      expect(record).not.toHaveProperty("experimentalHoleFilling");
    }
    expect(messages.every(message => message.includes(`experimentId=${identity.experimentId}`) &&
      message.includes(`experimentalBasalWidthCells=${threshold}`))).toBe(true);
  });

  it("keeps ordinary identities absent and rejects mixed or mislabeled width experiments", () => {
    expect(discoveryExperimentIdentity({})).toEqual({});
    expect(() => discoveryExperimentIdentity({ experimentalBasalWidthCells: 2, experimentalFacetDips: "basal-only" }))
      .toThrow("cannot combine");
    expect(() => discoveryExperimentIdentity({ experimentalBasalWidthCells: 2, experimentalHoleFilling: "disabled" }))
      .toThrow("cannot combine");
    expect(() => discoveryExperimentIdentity({ experimentalBasalWidthCells: 2.5 })).toThrow("positive integer");
    expect(() => runPostPhase10DiscoveryRow({ ...POST_PHASE10_SMOKE_ROWS[1], experimentalBasalWidthCells: 2 }, scratch()))
      .toThrow("M1 base and a constant environment");
  });
});
