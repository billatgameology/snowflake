import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { alphaHK, vKin } from "@vcc/core";
import { afterEach, describe, expect, it } from "vitest";
import {
  POST_PHASE10_BASAL_HISTORY_CUTOFF_SECONDS,
  POST_PHASE10_BASAL_HISTORY_DIMS_N,
  POST_PHASE10_BASAL_HISTORY_TARGET_EXTENT,
  POST_PHASE10_BASAL_HISTORY_ROWS,
  findPostPhase10BasalHistoryRow,
} from "../src/post-phase10-basal-history.ts";
import { POST_PHASE10_BASAL_WIDTH_ROWS } from "../src/post-phase10-basal-width.ts";
import { findPostPhase10FollowupRow } from "../src/post-phase10-followup.ts";
import {
  DISCOVERY_BASAL_WIDTH_HISTORY_EXPERIMENT_ID,
  discoveryExperimentIdentity,
  runPostPhase10DiscoveryRow,
  type DiscoveryExperimentIdentity,
  type DiscoverySpatialSnapshot,
} from "../src/post-phase10-discovery.ts";

const temporaryDirectories: string[] = [];
function scratch(): string {
  const directory = mkdtempSync(join(tmpdir(), "vcc-basal-history-"));
  temporaryDirectories.push(directory);
  return directory;
}
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

interface HistoryCycle extends DiscoveryExperimentIdentity {
  readonly cycle: number;
  readonly simTimeSeconds: number;
  readonly attachedCount: number;
  readonly attached: readonly unknown[];
  readonly basalWidthObservation: {
    readonly timing: string;
    readonly thresholdCells: number;
    readonly historyActive: boolean;
    readonly completedCyclesBeforeUpdate: number;
    readonly simTimeSecondsBeforeUpdate: number;
    readonly widthHistogram: Readonly<Record<string, number>>;
    readonly selectedBasalCells: number;
    readonly unselectedBasalCells: number;
    readonly selectedKineticDemandFill: number;
    readonly unselectedKineticDemandFill: number;
  };
  readonly boundary: { readonly facets: { readonly basal: {
    readonly count: number; readonly fill: { readonly mean: number };
  } } };
  readonly surface: { readonly deltaTimeSeconds: number; readonly attachedNow: number };
  readonly ledgers: {
    readonly fillLedger: number;
    readonly fillIncrement: number;
    readonly saturationClippedFill: number;
    readonly saturationClippedIncrement: number;
    readonly holeFillDeficit: number;
  };
}

describe("bounded early/late basal-width runner", () => {
  it("registers ten matched longer rows while retaining each control's kinetics and numerical settings", () => {
    const arms = ["broad", "global-basal", "full", "early", "late"] as const;
    expect(POST_PHASE10_BASAL_HISTORY_CUTOFF_SECONDS).toBe(20);
    expect(POST_PHASE10_BASAL_HISTORY_DIMS_N).toBe(112);
    expect(POST_PHASE10_BASAL_HISTORY_TARGET_EXTENT).toBe(53);
    expect(POST_PHASE10_BASAL_HISTORY_ROWS.map(row => row.id)).toEqual(
      ["4p5", "5"].flatMap(tag => arms.map(arm => `basal-history-t${tag}-${arm}`)),
    );
    for (const tag of ["4p5", "5"]) {
      const baseline = findPostPhase10FollowupRow(`followup-larger-cavity-t${tag}-f0p075-nodip`)!;
      const { id: baselineId, paramSet: baselineSet, ...baselineSettings } = baseline;
      expect(baselineId).toBe(`followup-larger-cavity-t${tag}-f0p075-nodip`);
      expect(baselineSet).toBe("M1_NO_DIP_ABLATION");
      for (const arm of arms) {
        const row = findPostPhase10BasalHistoryRow(`basal-history-t${tag}-${arm}`)!;
        expect(POST_PHASE10_BASAL_HISTORY_ROWS).toContain(row);
        const { id, paramSet, experimentalFacetDips, experimentalBasalWidthCells,
          experimentalBasalWidthHistory, ...settings } = row;
        expect(id).toBe(`basal-history-t${tag}-${arm}`);
        expect(settings).toEqual({ ...baselineSettings, dimsN: 112, targetExtent: 53 });
        expect(settings).toMatchObject({ seedRadius: 2, seedThickness: 1, dxUm: 0.35,
          cflFill: 0.05, maxSteps: 100000 });
        expect(row.pressurePa ?? 101325).toBe(101325);
        expect(row.tempC).toBe(tag === "4p5" ? -4.5 : -5);
        expect(row.sigmaInfinity).toBe(tag === "4p5" ? 0.003375 : 0.00375);
        expect(paramSet).toBe(arm === "broad" ? "M1_NO_DIP_ABLATION" : "M1");
        expect(experimentalFacetDips).toBe(arm === "global-basal" ? "basal-only" : undefined);
        expect(experimentalBasalWidthCells).toBe(["full", "early", "late"].includes(arm) ? 3 : undefined);
        expect(experimentalBasalWidthHistory).toEqual(arm === "early" || arm === "late"
          ? { mode: `${arm}-only`, cutoffSeconds: 20 } : undefined);
        for (const field of ["experimentalHoleFilling", "timelineEvent", "spatialSampleExtents"]) {
          expect(row).not.toHaveProperty(field);
        }
      }
    }
    expect(findPostPhase10BasalHistoryRow("not-a-basal-history-row")).toBeUndefined();
    const listed = execFileSync(process.execPath,
      ["runner/src/post-phase10-discovery-main.ts", "list-basal-history"], { encoding: "utf8", windowsHide: true });
    expect(JSON.parse(listed)).toEqual(POST_PHASE10_BASAL_HISTORY_ROWS);
  });

  it("uses the temporal identity only for history rows and leaves older identities unchanged", () => {
    expect(DISCOVERY_BASAL_WIDTH_HISTORY_EXPERIMENT_ID).toBe("post-phase10-basal-width-history-v1");
    expect(discoveryExperimentIdentity({})).toEqual({});
    expect(discoveryExperimentIdentity({ experimentalFacetDips: "basal-only" })).toEqual({
      experimentId: "post-phase10-facet-isolation-v1", experimentalFacetDips: "basal-only",
    });
    expect(discoveryExperimentIdentity({ experimentalHoleFilling: "disabled" })).toEqual({
      experimentId: "post-phase10-holefill-isolation-v1", experimentalHoleFilling: "disabled",
    });
    expect(discoveryExperimentIdentity({ experimentalFacetDips: "prism-only", experimentalHoleFilling: "disabled" })).toEqual({
      experimentId: "post-phase10-prism-holefill-interaction-v1", experimentalFacetDips: "prism-only", experimentalHoleFilling: "disabled",
    });
    for (const row of POST_PHASE10_BASAL_WIDTH_ROWS) expect(discoveryExperimentIdentity(row)).toEqual({
      experimentId: "post-phase10-local-basal-width-v1", experimentalBasalWidthCells: row.experimentalBasalWidthCells,
    });
    for (const row of POST_PHASE10_BASAL_HISTORY_ROWS) {
      const identity = discoveryExperimentIdentity(row);
      if (row.experimentalBasalWidthHistory !== undefined) expect(identity).toEqual({
        experimentId: "post-phase10-basal-width-history-v1", experimentalBasalWidthCells: 3,
        experimentalBasalWidthHistory: row.experimentalBasalWidthHistory,
      });
      else {
        expect(identity).not.toHaveProperty("experimentalBasalWidthHistory");
        expect(identity.experimentId).toBe(row.experimentalFacetDips !== undefined
          ? "post-phase10-facet-isolation-v1" : row.experimentalBasalWidthCells !== undefined
            ? "post-phase10-local-basal-width-v1" : undefined);
      }
    }
    expect(() => discoveryExperimentIdentity({ experimentalBasalWidthHistory: { mode: "early-only", cutoffSeconds: 20 } }))
      .toThrow("requires experimentalBasalWidthCells");
  });

  it.each(["early", "late"] as const)("records the %s switch from pre-update time and retains fill across it", arm => {
    const directory = scratch();
    const row = { ...findPostPhase10BasalHistoryRow(`basal-history-t5-${arm}`)!,
      id: `basal-history-smoke-${arm}`, dimsN: 16, targetExtent: 9, maxSteps: 3,
      experimentalBasalWidthHistory: { mode: arm === "early" ? "early-only" as const : "late-only" as const,
        cutoffSeconds: 1e-12 }, spatialSampleExtents: [5] };
    const messages: string[] = [];
    const result = runPostPhase10DiscoveryRow(row, directory, { heartbeat: message => messages.push(message) });
    // This deliberately short run is a step-cap diagnostic, not an admissible morphology result.
    expect(result).toMatchObject({ stopReason: "step-cap", admissible: false, cycles: 3,
      attachedCount: 19, seedSites: 19, extent: 5, allRelaxationsConverged: true,
      allAttachmentEventsD6h: true, symmetryError: 0, integrityErrors: [] });
    const events = readFileSync(join(directory, "events.jsonl"), "utf8").trim().split("\n")
      .map(line => JSON.parse(line) as HistoryCycle);
    expect(events).toHaveLength(3);
    expect(events.map(event => event.basalWidthObservation.historyActive)).toEqual(
      arm === "early" ? [true, false, false] : [false, true, true]);
    for (const [index, event] of events.entries()) {
      const observation = event.basalWidthObservation, active = arm === "early" ? index === 0 : index > 0;
      const previous = events[index - 1];
      expect(observation).toMatchObject({ timing: "after-converged-relaxation-before-surface-advance",
        thresholdCells: 3, completedCyclesBeforeUpdate: index,
        simTimeSecondsBeforeUpdate: previous?.simTimeSeconds ?? 0,
        widthHistogram: { "3": 24, "4": 12, "5": 2 },
        selectedBasalCells: active ? 24 : 0, unselectedBasalCells: active ? 14 : 38 });
      expect(event.cycle).toBe(index + 1);
      expect(event.surface.deltaTimeSeconds).toBeGreaterThan(1e-12);
      expect(event.simTimeSeconds).toBe(observation.simTimeSecondsBeforeUpdate + event.surface.deltaTimeSeconds);
      expect(event.attached).toEqual([]);
      expect(event.surface.attachedNow).toBe(0);
      expect(event.attachedCount).toBe(19);
      expect(event.boundary.facets.basal.count).toBe(38);
      if (active) expect(observation.selectedKineticDemandFill).toBeGreaterThan(0);
      else expect(observation.selectedKineticDemandFill).toBe(0);
      expect(observation.unselectedKineticDemandFill).toBeGreaterThan(0);
      expect(event.ledgers.saturationClippedFill).toBe(0);
      expect(event.ledgers.holeFillDeficit).toBe(0);
      const basalDemand = observation.selectedKineticDemandFill + observation.unselectedKineticDemandFill;
      expect(event.ledgers.fillIncrement).toBeGreaterThanOrEqual(basalDemand - 1e-12);
      expect(event.ledgers.fillLedger).toBeCloseTo((previous?.ledgers.fillLedger ?? 0) + event.ledgers.fillIncrement, 12);
      if (previous === undefined) expect(event.boundary.facets.basal.fill.mean).toBe(0);
      else {
        const previousBasalDemand = previous.basalWidthObservation.selectedKineticDemandFill +
          previous.basalWidthObservation.unselectedKineticDemandFill;
        // No sites attach or clip: actual next-step partial fill must retain the previous demand.
        expect(event.boundary.facets.basal.fill.mean).toBeCloseTo(
          previous.boundary.facets.basal.fill.mean + previousBasalDemand / 38, 12);
        expect(event.boundary.facets.basal.fill.mean).toBeGreaterThan(previous.boundary.facets.basal.fill.mean);
      }
    }
    expect(events[0].basalWidthObservation.simTimeSecondsBeforeUpdate).toBeLessThan(1e-12);
    expect(events[1].basalWidthObservation.simTimeSecondsBeforeUpdate).toBeGreaterThan(1e-12);
    expect(result.simTimeSeconds).toBe(events[2].simTimeSeconds);
    expect(result.fillLedger).toBe(events[2].ledgers.fillLedger);

    const snapshot = JSON.parse(readFileSync(join(directory, result.spatialSnapshots![0].path), "utf8")) as DiscoverySpatialSnapshot;
    expect(snapshot.record).toMatchObject({ completedCycles: 0, simTimeSeconds: 0, actualExtent: 5 });
    let selectedDemand = 0, unselectedDemand = 0;
    for (const cell of snapshot.cells) {
      if (cell.facet !== "basal") continue;
      const di = cell.coords[0] - snapshot.center[0], dj = cell.coords[1] - snapshot.center[1];
      const width = 5 - Math.max(Math.abs(di), Math.abs(dj), Math.abs(di + dj));
      const selected = arm === "early" && width <= 3;
      expect(cell.basalWidthCells).toBe(width);
      expect(cell.basalWidthSelected).toBe(selected);
      const coefficient = alphaHK("basal", row.tempC, cell.sigmaBoundary, selected ? "M1" : "M1_NO_DIP_ABLATION");
      expect(cell.alphaHKBoundary).toBeCloseTo(coefficient, 12);
      const demand = coefficient * vKin(row.tempC) * cell.sigmaBoundary /
        (cell.fillGeometry * row.dxUm * 1e-6) * events[0].surface.deltaTimeSeconds;
      if (selected) selectedDemand += demand; else unselectedDemand += demand;
    }
    expect(events[0].basalWidthObservation.selectedKineticDemandFill).toBeCloseTo(selectedDemand, 12);
    expect(events[0].basalWidthObservation.unselectedKineticDemandFill).toBeCloseTo(unselectedDemand, 12);
    const identity = { experimentId: "post-phase10-basal-width-history-v1", experimentalBasalWidthCells: 3,
      experimentalBasalWidthHistory: row.experimentalBasalWidthHistory };
    for (const record of [result, ...events, snapshot, ...["spec.json", "host.json", "status.json", "result.json"]
      .map(leaf => JSON.parse(readFileSync(join(directory, leaf), "utf8")) as Record<string, unknown>)]) {
      expect(record).toMatchObject(identity);
      expect(record).not.toHaveProperty("experimentalFacetDips");
      expect(record).not.toHaveProperty("experimentalHoleFilling");
      expect(record).not.toHaveProperty("timelineEvent");
    }
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.every(message => message.includes(`experimentId=${identity.experimentId}`) &&
      message.includes(`experimentalBasalWidthHistory=${row.experimentalBasalWidthHistory.mode}`) &&
      message.includes("cutoffSeconds=1e-12"))).toBe(true);
  });
});
