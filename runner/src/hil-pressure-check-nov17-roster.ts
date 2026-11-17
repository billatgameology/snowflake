import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import { namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry,
  type FirstBatchHost } from "./hil-bld-batch-roster.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";
import type { DiscoveryRetainedObservations } from "./discovery-retained-observations.ts";

const tag = (value: number) => String(Math.abs(value)).replace(".", "p");
const common = Object.freeze({ conditional: false, lane: "cavity-mechanism" as const,
  paramSet: "M1" as const, dimsN: 64, dxUm: .35,
  seedRadius: 2, seedThickness: 1, targetExtent: 29, maxSteps: 100000,
  spatialSampleExtents: Object.freeze([5, 9, 13, 17, 21, 25]) });
function entry(block: "a" | "b", width: number, cflFill: number, tempC: number,
  fraction: number, cutoffSeconds: number, pressurePa: number,
  pressureTag: "half" | "double"): FirstBatchEntry {
  return Object.freeze({ host: "HIL", track: "warm-history", row: Object.freeze({
    ...common,
    id: `pc17-hil-${block}-t${tag(tempC)}-f${tag(fraction)}-s${tag(cutoffSeconds)}-p${pressureTag}`,
    tempC, fraction, pressurePa, cflFill, experimentalBasalWidthCells: width,
    sigmaInfinity: phase6SigmaWaterFromTable(tempC) * fraction,
    experimentalBasalWidthHistory: Object.freeze({ mode: "early-only" as const, cutoffSeconds }),
  }) });
}

/** Finite registered order: pressure timestep qualification, then width comparison. */
export const HIL_PRESSURE_CHECK_NOV17_ROWS: readonly FirstBatchEntry[] = Object.freeze([
  { block: "a" as const, width: 3, cflFill: .00625 },
  { block: "b" as const, width: 4, cflFill: .0125 },
].flatMap(({ block, width, cflFill }) => [-4.5, -5].flatMap((tempC) =>
  [{ fraction: .05, cutoff: 8 }, { fraction: .10, cutoff: 3 }]
    .flatMap(({ fraction, cutoff }) => [
      { pressurePa: 50662.5, pressureTag: "half" as const },
      { pressurePa: 202650, pressureTag: "double" as const },
    ].map(({ pressurePa, pressureTag }) =>
      entry(block, width, cflFill, tempC, fraction, cutoff, pressurePa, pressureTag))))));
export const HIL_PRESSURE_CHECK_NOV17: DiscoveryBatchDefinition = Object.freeze({
  id: "hil-pressure-check-2026-11-17", launchPrefix: "hil-pressure-check-nov17",
  rows: HIL_PRESSURE_CHECK_NOV17_ROWS, workerCeilings: Object.freeze({ HIL: 16 }),
  representatives: (host: FirstBatchHost) => namedBatchRows(HIL_PRESSURE_CHECK_NOV17, host),
});

/** Existing observation settings only; no growth decision depends on these samples. */
export function pressureCheckObservations(row: DiscoveryRow): DiscoveryRetainedObservations {
  return Object.freeze({ ageSeconds: Object.freeze([1, 2, 2.5, 3, 4, 5, 6.5, 7, 7.5, 8, 10, 20]),
    widthHistorySwitch: row.experimentalBasalWidthHistory?.mode === "early-only",
    centralAttachments: Object.freeze({ maxHexRadiusCells: 1,
      absoluteZOffsets: Object.freeze([Math.floor(row.seedThickness / 2) + 1]) }),
  });
}
