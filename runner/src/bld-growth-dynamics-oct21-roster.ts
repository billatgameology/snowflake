import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import { namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry,
  type FirstBatchHost } from "./hil-bld-batch-roster.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

const facetArms = ["neither", "basal-only", "prism-only", "both"] as const;
const warmCrossings = Object.freeze([5, 9, 13, 17, 21, 25]);
const facetCrossings = Object.freeze([5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27]);
const tag = (value: number): string => String(Math.abs(value)).replace(".", "p");

function entry(track: FirstBatchEntry["track"],
  input: Pick<DiscoveryRow, "id" | "lane" | "tempC" | "fraction"> & Partial<DiscoveryRow>): FirstBatchEntry {
  return Object.freeze({ host: "BLD", track, row: Object.freeze({
    conditional: false, dimsN: 64, dxUm: 0.35, seedRadius: 2, seedThickness: 1,
    pressurePa: 101325, paramSet: "M1", cflFill: 0.025, targetExtent: 29, maxSteps: 20000,
    spatialSampleExtents: facetCrossings, ...input,
    sigmaInfinity: phase6SigmaWaterFromTable(input.tempC) * input.fraction,
  }) });
}

function warm(id: string, tempC: number, cflFill: number, arm: "broad" | "full" | "early" | "late",
  width = 3, cutoffSeconds = 20, pressurePa = 101325, fraction = 0.075): FirstBatchEntry {
  return entry("warm-history", { id, lane: "cavity-mechanism", tempC, fraction, pressurePa,
    cflFill, maxSteps: 100000, spatialSampleExtents: warmCrossings,
    paramSet: arm === "broad" ? "M1_NO_DIP_ABLATION" : "M1",
    ...(arm === "broad" ? {} : { experimentalBasalWidthCells: width }),
    ...(arm === "early" || arm === "late" ? { experimentalBasalWidthHistory: Object.freeze({
      mode: arm === "early" ? "early-only" as const : "late-only" as const, cutoffSeconds,
    }) } : {}),
  });
}

const warmArms = [
  { tag: "broad", arm: "broad" }, { tag: "full-w3", arm: "full" },
  { tag: "late20-w3", arm: "late" },
  ...[1, 5, 10, 20, 40].map((cutoffSeconds) => ({ tag: `early${cutoffSeconds}-w3`,
    arm: "early" as const, cutoffSeconds })),
] as const;

function preparation(tempC: number, cflFill: number): FirstBatchEntry[] {
  return warmArms.filter((arm) => !(tempC === -4.5 && cflFill === 0.05 &&
    (arm.tag === "broad" || arm.tag === "early20-w3"))).map((arm) =>
    warm(`gd21-bld-w1-t${tag(tempC)}-c${cflFill === 0.025 ? "025" : "05"}-${arm.tag}`,
      tempC, cflFill, arm.arm, 3, "cutoffSeconds" in arm ? arm.cutoffSeconds : 20));
}

const facetSentinels = (["basal-only", "neither"] as const).map((experimentalFacetDips) =>
  entry("seed", { id: `gd21-bld-f0-${experimentalFacetDips}`, lane: "adaptive-seed",
    tempC: -9.5, fraction: 0.15, seedRadius: 3, cflFill: 0.0125, experimentalFacetDips }));
const coldSentinels = facetArms.map((experimentalFacetDips) =>
  entry("cold-core-tip", { id: `gd21-bld-c0-${experimentalFacetDips}`, lane: "cavity-mechanism",
    tempC: -20, fraction: 0.15, cflFill: 0.0125, experimentalFacetDips }));
const tallFacet = [-6.5, -9.5].flatMap((tempC) => (["basal-only", "prism-only"] as const).map((experimentalFacetDips) =>
  entry("seed", { id: `gd21-bld-f1-t${tag(tempC)}-${experimentalFacetDips}`, lane: "adaptive-seed",
    tempC, fraction: 0.15, seedRadius: 1, seedThickness: 5, experimentalFacetDips })));
const widthSelection = [-4.5, -5].flatMap((tempC) => [2, 4].flatMap((width) =>
  (["full", "early5", "early20"] as const).map((arm) =>
    warm(`gd21-bld-w2-t${tag(tempC)}-w${width}-${arm}`, tempC, 0.025,
      arm === "full" ? "full" : "early", width, arm === "early5" ? 5 : 20))));
const transport = [
  { tag: "pHalf", pressurePa: 50662.5, fraction: 0.075 },
  { tag: "pDouble", pressurePa: 202650, fraction: 0.075 },
  { tag: "fLow", pressurePa: 101325, fraction: 0.05 },
  { tag: "fHigh", pressurePa: 101325, fraction: 0.1 },
].flatMap(({ tag: condition, pressurePa, fraction }) => (["broad", "early20-w3"] as const).map((arm) =>
  warm(`gd21-bld-w3-${condition}-${arm}`, -4.5, 0.025,
    arm === "broad" ? "broad" : "early", 3, 20, pressurePa, fraction)));
const midpointFacet = [-7.5, -8.5].flatMap((tempC) =>
  [{ seedRadius: 3, seedThickness: 1 }, { seedRadius: 1, seedThickness: 5 }].flatMap((seed) =>
    facetArms.map((experimentalFacetDips) => entry("seed", {
      id: `gd21-bld-f2-t${tag(tempC)}-r${seed.seedRadius}-h${seed.seedThickness}-${experimentalFacetDips}`,
      lane: "adaptive-seed", tempC, fraction: 0.15, ...seed, experimentalFacetDips,
    }))));
const forcingFacet = [-6.5, -9.5].flatMap((tempC) => [0.1, 0.2].flatMap((fraction) =>
  facetArms.map((experimentalFacetDips) => entry("seed", {
    id: `gd21-bld-f3-t${tag(tempC)}-f${fraction === 0.1 ? "10" : "20"}-${experimentalFacetDips}`,
    lane: "adaptive-seed", tempC, fraction, seedRadius: 3, experimentalFacetDips,
  }))));

/** The fixed 32-slot initial group precedes the 60 queued rows; reused controls are not rerun. */
export const BLD_GROWTH_DYNAMICS_OCT21_ROWS: readonly FirstBatchEntry[] = Object.freeze([
  ...facetSentinels, ...coldSentinels, ...preparation(-4.5, 0.025), ...preparation(-5, 0.025),
  ...tallFacet, ...preparation(-4.5, 0.05), ...preparation(-5, 0.05),
  ...widthSelection, ...transport, ...midpointFacet, ...forcingFacet,
]);
export const BLD_GROWTH_DYNAMICS_OCT21: DiscoveryBatchDefinition = Object.freeze({
  id: "bld-growth-dynamics-2026-10-21", launchPrefix: "bld-growth-dynamics-oct21",
  rows: BLD_GROWTH_DYNAMICS_OCT21_ROWS, workerCeilings: Object.freeze({ BLD: 32 }),
  representatives: (host: FirstBatchHost) => namedBatchRows(BLD_GROWTH_DYNAMICS_OCT21, host),
});
