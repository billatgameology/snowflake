import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import { namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry,
  type FirstBatchHost } from "./hil-bld-batch-roster.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";
import type { DiscoveryRetainedObservations } from "./discovery-retained-observations.ts";

const tag = (value: number) => String(Math.abs(value)).replace(".", "p");
const entry = (row: DiscoveryRow): FirstBatchEntry => Object.freeze({ host: "HIL",
  track: "warm-history", row: Object.freeze(row) });
const common = Object.freeze({ conditional: false, lane: "cavity-mechanism" as const,
  fraction: .075, pressurePa: 101325, paramSet: "M1" as const, maxSteps: 100000 });
const fine = [1, 3].flatMap((seedThickness) => [6, 8].map((width) => entry({
  ...common, id: `cf11-hil-c-h${seedThickness}-w${width}-s5`, tempC: -4.5,
  sigmaInfinity: phase6SigmaWaterFromTable(-4.5) * .075,
  dimsN: 126, dxUm: .175, seedRadius: 4, seedThickness, cflFill: .025, targetExtent: 57,
  spatialSampleExtents: Object.freeze([9, 17, 25, 33, 41, 49]),
  experimentalBasalWidthCells: width,
  experimentalBasalWidthHistory: Object.freeze({ mode: "early-only", cutoffSeconds: 5 }),
})));
function coarse(block: "a" | "b", cutoffs: readonly number[], cflFill: number) {
  return cutoffs.flatMap((cutoffSeconds) => [-4.5, -5].flatMap((tempC) => [3, 4].map((width) => entry({
    ...common, id: `cf11-hil-${block}-t${tag(tempC)}-w${width}-s${tag(cutoffSeconds)}`,
    tempC, sigmaInfinity: phase6SigmaWaterFromTable(tempC) * .075,
    dimsN: 64, dxUm: .35, seedRadius: 2, seedThickness: 1, cflFill, targetExtent: 29,
    spatialSampleExtents: Object.freeze([5, 9, 13, 17, 21, 25]),
    experimentalBasalWidthCells: width,
    experimentalBasalWidthHistory: Object.freeze({ mode: "early-only", cutoffSeconds }),
  }))));
}

export const HIL_CENTRAL_FILLING_NOV11_ROWS: readonly FirstBatchEntry[] = Object.freeze([
  ...fine, ...coarse("a", [2.25, 2.5, 2.75, 3, 2, 4], .025),
  ...coarse("b", [2.25, 2.5, 2.75], .0125),
]);
export const HIL_CENTRAL_FILLING_NOV11: DiscoveryBatchDefinition = Object.freeze({
  id: "hil-central-filling-2026-11-11", launchPrefix: "hil-central-filling-nov11",
  rows: HIL_CENTRAL_FILLING_NOV11_ROWS, workerCeilings: Object.freeze({ HIL: 20 }),
  representatives: (host: FirstBatchHost) => namedBatchRows(HIL_CENTRAL_FILLING_NOV11, host),
});

/** Only observation coordinates differ with the representation; no growth decisions use them. */
export function centralFillingObservations(row: DiscoveryRow): DiscoveryRetainedObservations {
  return Object.freeze({ ageSeconds: Object.freeze([1, 2, 2.25, 2.5, 2.75, 3, 4, 5, 10]),
    widthHistorySwitch: true,
    centralAttachments: Object.freeze({ maxHexRadiusCells: row.dimsN === 126 ? 2 : 1,
      absoluteZOffsets: Object.freeze([Math.floor(row.seedThickness / 2) + 1]) }),
  });
}
