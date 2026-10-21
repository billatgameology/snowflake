import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import { namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry,
  type FirstBatchHost } from "./hil-bld-batch-roster.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

function entry(track: FirstBatchEntry["track"], input: DiscoveryRow): FirstBatchEntry {
  return Object.freeze({ host: "HIL", track, row: Object.freeze(input) });
}
const fine = Object.freeze({ conditional: false, dimsN: 126, dxUm: 0.175,
  seedRadius: 4, pressurePa: 101325, cflFill: 0.025, targetExtent: 57, maxSteps: 100000 });
const warmCrossings = Object.freeze([9, 17, 25, 33, 41, 49]);
const coldCrossings = Object.freeze([9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53]);
const historyCrossings = Object.freeze(Array.from({ length: 26 }, (_, index) => 5 + index * 2));

const warm = [1, 3].flatMap((seedThickness) => (["broad", "early20-w6"] as const).map((arm) =>
  entry("warm-history", { ...fine, id: `gd21-hil-w4-h${seedThickness}-${arm}`,
    lane: "cavity-mechanism", tempC: -4.5, fraction: 0.075,
    sigmaInfinity: phase6SigmaWaterFromTable(-4.5) * 0.075, seedThickness,
    paramSet: arm === "broad" ? "M1_NO_DIP_ABLATION" : "M1", spatialSampleExtents: warmCrossings,
    ...(arm === "broad" ? {} : { experimentalBasalWidthCells: 6,
      experimentalBasalWidthHistory: Object.freeze({ mode: "early-only" as const, cutoffSeconds: 20 }) }),
  })));
const cold = [1, 3].flatMap((seedThickness) =>
  (["neither", "basal-only", "prism-only", "both"] as const).map((experimentalFacetDips) =>
    entry("cold-core-tip", { ...fine, id: `gd21-hil-c1-h${seedThickness}-${experimentalFacetDips}`,
      lane: "cavity-mechanism", tempC: -14.4, fraction: 0.1,
      sigmaInfinity: phase6SigmaWaterFromTable(-14.4) * 0.1, seedThickness,
      paramSet: "M1", experimentalFacetDips, spatialSampleExtents: coldCrossings,
    })));
const history = [50662.5, 101325, 202650].flatMap((pressurePa) =>
  (["switch7", "switch15", "source", "destination"] as const).map((arm) => {
    const tempC = arm === "destination" ? -6 : -14.4;
    return entry("environment-history", {
      id: `gd21-hil-h1-p${String(pressurePa).replace(".", "p")}-${arm}`,
      lane: "followup-history", conditional: false, tempC, fraction: 0.2,
      sigmaInfinity: phase6SigmaWaterFromTable(tempC) * 0.2, pressurePa, paramSet: "M1",
      dimsN: 96, dxUm: 0.35, seedRadius: 2, seedThickness: 1,
      cflFill: 0.025, targetExtent: 57, maxSteps: 100000, spatialSampleExtents: historyCrossings,
      ...(arm === "switch7" || arm === "switch15" ? { timelineEvent: Object.freeze({
        triggerLargestExtent: arm === "switch7" ? 7 : 15, tempC: -6,
        sigmaInfinity: phase6SigmaWaterFromTable(-6) * 0.2,
      }) } : {}),
    });
  }));

/** Longest/unknown fine work starts first; only the last pressure quartet waits initially. */
export const HIL_GROWTH_DYNAMICS_OCT21_ROWS: readonly FirstBatchEntry[] = Object.freeze([
  ...warm, ...cold, ...history,
]);
export const HIL_GROWTH_DYNAMICS_OCT21: DiscoveryBatchDefinition = Object.freeze({
  id: "hil-growth-dynamics-2026-10-21", launchPrefix: "hil-growth-dynamics-oct21",
  rows: HIL_GROWTH_DYNAMICS_OCT21_ROWS, workerCeilings: Object.freeze({ HIL: 20 }),
  representatives: (host: FirstBatchHost) => namedBatchRows(HIL_GROWTH_DYNAMICS_OCT21, host),
});
