import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import { namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry,
  type FirstBatchHost, type FirstBatchTrack } from "./hil-bld-batch-roster.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";
import type { DiscoveryRetainedObservations } from "./discovery-retained-observations.ts";

const tag = (value: number) => String(Math.abs(value)).replace(".", "p");
const facetArms = ["both", "neither", "basal-only", "prism-only"] as const;
const seeds = [{ seedRadius: 2, seedThickness: 3 }, { seedRadius: 3, seedThickness: 1 }] as const;
const common = Object.freeze({ conditional: false, lane: "cavity-mechanism" as const,
  pressurePa: 101325, paramSet: "M1" as const, dimsN: 64, dxUm: .35, cflFill: .025,
  seedRadius: 2, seedThickness: 1, targetExtent: 29, maxSteps: 100000,
  spatialSampleExtents: Object.freeze([5, 9, 13, 17, 21, 25]) });
function entry(track: FirstBatchTrack,
  input: Pick<DiscoveryRow, "id" | "tempC" | "fraction"> & Partial<DiscoveryRow>): FirstBatchEntry {
  return Object.freeze({ host: "HIL", track, row: Object.freeze({ ...common, ...input,
    sigmaInfinity: phase6SigmaWaterFromTable(input.tempC) * input.fraction }) });
}
function earlyWidth(width: number, cutoffSeconds = 5) {
  return { experimentalBasalWidthCells: width,
    experimentalBasalWidthHistory: Object.freeze({ mode: "early-only" as const, cutoffSeconds }) };
}
const onset = [-4.5, -5].flatMap((tempC) => [3, 4].flatMap((width) =>
  [4.5, 4.25, 4.75].map((cutoffSeconds) => entry("warm-history", {
    id: `adv12-hil-onset-t${tag(tempC)}-w${width}-s${tag(cutoffSeconds)}`,
    tempC, fraction: .075, ...earlyWidth(width, cutoffSeconds),
  }))));
const warmSeed = [-4.5, -5].flatMap((tempC) => seeds.flatMap((seed) =>
  ["broad", "early3"].map((arm) => entry("seed", {
    id: `adv12-hil-warm-seed-t${tag(tempC)}-r${seed.seedRadius}-h${seed.seedThickness}-${arm}`,
    tempC, fraction: .075, ...seed,
    ...(arm === "broad" ? { paramSet: "M1_NO_DIP_ABLATION" as const } : earlyWidth(3)),
  }))));
const coldSeed = seeds.flatMap((seed) => facetArms.map((experimentalFacetDips) => entry("cold-core-tip", {
  id: `adv12-hil-cold-seed-t14p4-r${seed.seedRadius}-h${seed.seedThickness}-${experimentalFacetDips}`,
  tempC: -14.4, fraction: .10, ...seed, experimentalFacetDips,
})));
const coldPressure = [50662.5, 202650].flatMap((pressurePa) => facetArms.map((experimentalFacetDips) =>
  entry("pressure", {
    id: `adv12-hil-cold-pressure-t14p4-p${tag(pressurePa)}-${experimentalFacetDips}`,
    tempC: -14.4, fraction: .10, pressurePa, experimentalFacetDips,
  })));
const forcing = [-4.5, -5].flatMap((tempC) => [.05, .10].flatMap((fraction) =>
  ["broad", "early3", "early4"].filter((arm) => !(tempC === -4.5 && arm === "broad"))
    .map((arm) => entry("warm-history", {
      id: `adv12-hil-forcing-t${tag(tempC)}-f${tag(fraction)}-${arm}`,
      tempC, fraction,
      ...(arm === "broad" ? { paramSet: "M1_NO_DIP_ABLATION" as const } : earlyWidth(arm === "early3" ? 3 : 4)),
    }))));

/** Start four questions together, then refill from their finite registered remainders. */
export const HIL_ADVENTURES_NOV12_ROWS: readonly FirstBatchEntry[] = Object.freeze([
  ...onset.slice(0, 4), ...warmSeed.slice(0, 4), ...coldSeed.slice(0, 4), ...coldPressure.slice(0, 4),
  ...onset.slice(4), ...warmSeed.slice(4), ...coldSeed.slice(4), ...coldPressure.slice(4), ...forcing,
]);
export const HIL_ADVENTURES_NOV12: DiscoveryBatchDefinition = Object.freeze({
  id: "hil-adventures-2026-11-12", launchPrefix: "hil-adventures-nov12",
  rows: HIL_ADVENTURES_NOV12_ROWS, workerCeilings: Object.freeze({ HIL: 16 }),
  representatives: (host: FirstBatchHost) => namedBatchRows(HIL_ADVENTURES_NOV12, host),
});

/** All settings are observation-only; exact switch maps apply only to early-width rows. */
export function adventureObservations(row: DiscoveryRow): DiscoveryRetainedObservations {
  return Object.freeze({ ageSeconds: Object.freeze([1, 2, 3, 4, 4.25, 4.5, 4.75, 5, 6, 10, 20]),
    widthHistorySwitch: row.experimentalBasalWidthHistory?.mode === "early-only",
    centralAttachments: Object.freeze({ maxHexRadiusCells: 1,
      absoluteZOffsets: Object.freeze([Math.floor(row.seedThickness / 2) + 1]) }),
  });
}
