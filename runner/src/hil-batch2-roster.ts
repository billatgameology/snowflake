import type { LKFacetDipArm } from "@vcc/solver-cpu";
import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import { namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry, type FirstBatchHost } from "./hil-bld-batch-roster.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

const arms: readonly LKFacetDipArm[] = ["both", "neither", "basal-only", "prism-only"];
const samples = Object.freeze([5, 9, 13, 17]);
function entry(track: "seed" | "pressure", input: Pick<DiscoveryRow, "id" | "tempC" | "fraction" | "seedRadius" | "seedThickness" | "experimentalFacetDips">): FirstBatchEntry {
  const row: DiscoveryRow = Object.freeze({
    conditional: false, lane: track === "seed" ? "adaptive-seed" : "adaptive-pressure",
    paramSet: "M1", pressurePa: 101_325, dimsN: 64, dxUm: 0.35, cflFill: 0.05,
    targetExtent: 21, maxSteps: 20_000, spatialSampleExtents: samples,
    ...input, sigmaInfinity: phase6SigmaWaterFromTable(input.tempC) * input.fraction,
  });
  return Object.freeze({ host: "HIL", track, row });
}

const seed = [{ seedRadius: 3, seedThickness: 1 }, { seedRadius: 1, seedThickness: 5 }].map((shape) =>
  arms.map((experimentalFacetDips) => entry("seed", {
    id: `batch2-hil-seed-t8-f0p15-r${shape.seedRadius}t${shape.seedThickness}-${experimentalFacetDips}`,
    tempC: -8, fraction: 0.15, ...shape, experimentalFacetDips,
  })));
const pressure = [0.1, 0.2].map((fraction) => arms.map((experimentalFacetDips) => entry("pressure", {
  id: `batch2-hil-pressure-t6-f${String(fraction).replace(".", "p")}-p101325-${experimentalFacetDips}`,
  tempC: -6, fraction, seedRadius: 2, seedThickness: 1, experimentalFacetDips,
})));

export const HIL_BATCH2_ROWS: readonly FirstBatchEntry[] = Object.freeze([
  ...seed[0], ...pressure[0], ...seed[1], ...pressure[1],
]);

export const HIL_BATCH2: DiscoveryBatchDefinition = Object.freeze({
  id: "hil-exploration-batch2-2026-10-08", launchPrefix: "batch2",
  rows: HIL_BATCH2_ROWS, workerCeilings: Object.freeze({ HIL: 16 }),
  representatives: (host: FirstBatchHost) => {
    const rows = namedBatchRows(HIL_BATCH2, host);
    return [
      "batch2-hil-seed-t8-f0p15-r3t1-basal-only",
      "batch2-hil-seed-t8-f0p15-r1t5-prism-only",
      "batch2-hil-pressure-t6-f0p1-p101325-neither",
      "batch2-hil-pressure-t6-f0p2-p101325-both",
    ].map((id) => rows.find(({ row }) => row.id === id)!);
  },
});
