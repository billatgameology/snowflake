import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import { namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry,
  type FirstBatchHost } from "./hil-bld-batch-roster.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";
import type { DiscoveryRetainedObservations } from "./discovery-retained-observations.ts";

const tag = (value: number) => String(Math.abs(value)).replace(".", "p");
const common = Object.freeze({ conditional: false, lane: "cavity-mechanism" as const,
  pressurePa: 101325, paramSet: "M1" as const, dimsN: 64, dxUm: .35,
  seedRadius: 2, seedThickness: 1, targetExtent: 29, maxSteps: 100000,
  spatialSampleExtents: Object.freeze([5, 9, 13, 17, 21, 25]) });
function entry(block: "a" | "b", tempC: number, fraction: number, width: number,
  cutoffSeconds: number, cflFill: number): FirstBatchEntry {
  return Object.freeze({ host: "HIL", track: "warm-history", row: Object.freeze({
    ...common,
    id: `on13-hil-${block}-t${tag(tempC)}${block === "b" ? `-f${tag(fraction)}` : ""}-w${width}-s${tag(cutoffSeconds)}`,
    tempC, fraction, cflFill, sigmaInfinity: phase6SigmaWaterFromTable(tempC) * fraction,
    experimentalBasalWidthCells: width,
    experimentalBasalWidthHistory: Object.freeze({ mode: "early-only" as const, cutoffSeconds }),
  }) });
}

/** Finite registered order: onset timestep pairs, then supply/duration pairs. */
export const HIL_ONSET_FOLLOWUP_NOV13_ROWS: readonly FirstBatchEntry[] = Object.freeze([
  ...[-4.5, -5].flatMap((tempC) => [3, 4].flatMap((width) =>
    [4.25, 4.5].map((cutoff) => entry("a", tempC, .075, width, cutoff, .0125)))),
  ...[-4.5, -5].flatMap((tempC) => [{ fraction: .05, cutoff: 8 }, { fraction: .10, cutoff: 3 }]
    .flatMap(({ fraction, cutoff }) => [3, 4].map((width) =>
      entry("b", tempC, fraction, width, cutoff, .025)))),
]);
export const HIL_ONSET_FOLLOWUP_NOV13: DiscoveryBatchDefinition = Object.freeze({
  id: "hil-onset-followup-2026-11-13", launchPrefix: "hil-onset-followup-nov13",
  rows: HIL_ONSET_FOLLOWUP_NOV13_ROWS, workerCeilings: Object.freeze({ HIL: 16 }),
  representatives: (host: FirstBatchHost) => namedBatchRows(HIL_ONSET_FOLLOWUP_NOV13, host),
});

/** Existing observation settings only; no growth decision depends on these samples. */
export function onsetFollowupObservations(row: DiscoveryRow): DiscoveryRetainedObservations {
  return Object.freeze({ ageSeconds: Object.freeze([1, 2, 3, 4, 4.25, 4.5, 4.75, 5, 6, 8, 10, 20]),
    widthHistorySwitch: row.experimentalBasalWidthHistory?.mode === "early-only",
    centralAttachments: Object.freeze({ maxHexRadiusCells: 1,
      absoluteZOffsets: Object.freeze([Math.floor(row.seedThickness / 2) + 1]) }),
  });
}
