import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import { namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry,
  type FirstBatchHost } from "./hil-bld-batch-roster.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";
import type { DiscoveryRetainedObservations } from "./discovery-retained-observations.ts";

const tag = (value: number) => String(Math.abs(value)).replace(".", "p");
const common = Object.freeze({ conditional: false, lane: "cavity-mechanism" as const,
  paramSet: "M1" as const, dimsN: 64, dxUm: .35, cflFill: .0125,
  seedRadius: 2, seedThickness: 1, targetExtent: 29, maxSteps: 100000,
  experimentalBasalWidthCells: 3, spatialSampleExtents: Object.freeze([5, 9, 13, 17, 21, 25]) });
function entry(block: "a" | "b", tempC: number, fraction: number, cutoffSeconds: number,
  pressurePa: number, pressureTag?: "half" | "double"): FirstBatchEntry {
  return Object.freeze({ host: "HIL", track: "warm-history", row: Object.freeze({
    ...common,
    id: `op16-hil-${block}-t${tag(tempC)}-f${tag(fraction)}-s${tag(cutoffSeconds)}${pressureTag === undefined ? "" : `-p${pressureTag}`}`,
    tempC, fraction, pressurePa, sigmaInfinity: phase6SigmaWaterFromTable(tempC) * fraction,
    experimentalBasalWidthHistory: Object.freeze({ mode: "early-only" as const, cutoffSeconds }),
  }) });
}

/** Finite registered order: onset interval refinements, then pressure transfer. */
export const HIL_ONSET_PRESSURE_NOV16_ROWS: readonly FirstBatchEntry[] = Object.freeze([
  ...[-4.5, -5].flatMap((tempC) => [{ fraction: .05, cutoff: 7 }, { fraction: .05, cutoff: 7.5 },
    { fraction: .10, cutoff: 2.625 }, { fraction: .10, cutoff: 2.75 }]
    .map(({ fraction, cutoff }) => entry("a", tempC, fraction, cutoff, 101325))),
  ...[-4.5, -5].flatMap((tempC) => [{ fraction: .05, cutoff: 8 }, { fraction: .10, cutoff: 3 }]
    .flatMap(({ fraction, cutoff }) => [
      { pressurePa: 50662.5, pressureTag: "half" as const },
      { pressurePa: 202650, pressureTag: "double" as const },
    ].map(({ pressurePa, pressureTag }) => entry("b", tempC, fraction, cutoff, pressurePa, pressureTag)))),
]);
export const HIL_ONSET_PRESSURE_NOV16: DiscoveryBatchDefinition = Object.freeze({
  id: "hil-onset-pressure-2026-11-16", launchPrefix: "hil-onset-pressure-nov16",
  rows: HIL_ONSET_PRESSURE_NOV16_ROWS, workerCeilings: Object.freeze({ HIL: 16 }),
  representatives: (host: FirstBatchHost) => namedBatchRows(HIL_ONSET_PRESSURE_NOV16, host),
});

/** Existing observation settings only; no growth decision depends on these samples. */
export function onsetPressureObservations(row: DiscoveryRow): DiscoveryRetainedObservations {
  return Object.freeze({ ageSeconds: Object.freeze([1, 2, 2.5, 2.625, 2.75, 3, 4, 5, 6.5, 7, 7.5, 8, 10, 20]),
    widthHistorySwitch: row.experimentalBasalWidthHistory?.mode === "early-only",
    centralAttachments: Object.freeze({ maxHexRadiusCells: 1,
      absoluteZOffsets: Object.freeze([Math.floor(row.seedThickness / 2) + 1]) }),
  });
}
