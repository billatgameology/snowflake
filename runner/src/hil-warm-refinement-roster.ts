import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import { namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry, type FirstBatchHost } from "./hil-bld-batch-roster.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

const configurations = [
  { tag: "coarse", dimsN: 64, dxUm: 0.35, seedRadius: 2, seedThickness: 1,
    width: 3, targetExtent: 29, spatialSampleExtents: Object.freeze([5, 9, 13, 17, 21, 25]) },
  { tag: "fine-thin", dimsN: 126, dxUm: 0.175, seedRadius: 4, seedThickness: 1,
    width: 6, targetExtent: 57, spatialSampleExtents: Object.freeze([9, 17, 25, 33, 41, 49]) },
  { tag: "fine-thick", dimsN: 126, dxUm: 0.175, seedRadius: 4, seedThickness: 3,
    width: 6, targetExtent: 57, spatialSampleExtents: Object.freeze([9, 17, 25, 33, 41, 49]) },
] as const;

export const HIL_WARM_REFINEMENT_ROWS: readonly FirstBatchEntry[] = Object.freeze(
  configurations.flatMap(({ tag, width, ...configuration }) =>
    (["broad", "early"] as const).map((arm): FirstBatchEntry => {
      const row: DiscoveryRow = Object.freeze({
        id: `warm-refine-${tag}-t4p5-${arm}`, lane: "cavity-mechanism", conditional: false,
        tempC: -4.5, fraction: 0.075, sigmaInfinity: phase6SigmaWaterFromTable(-4.5) * 0.075,
        pressurePa: 101_325, cflFill: 0.05, maxSteps: 100_000, ...configuration,
        paramSet: arm === "broad" ? "M1_NO_DIP_ABLATION" : "M1",
        ...(arm === "early" ? { experimentalBasalWidthCells: width,
          experimentalBasalWidthHistory: Object.freeze({ mode: "early-only" as const, cutoffSeconds: 20 }) } : {}),
      });
      return Object.freeze({ host: "HIL", track: "warm-history", row });
    })),
);

export const HIL_WARM_REFINEMENT: DiscoveryBatchDefinition = Object.freeze({
  id: "hil-warm-refinement-2026-10-08", launchPrefix: "warm-refinement",
  rows: HIL_WARM_REFINEMENT_ROWS, workerCeilings: Object.freeze({ HIL: 6 }), probeWallSeconds: 1800,
  representatives: (host: FirstBatchHost) => namedBatchRows(HIL_WARM_REFINEMENT, host),
});
