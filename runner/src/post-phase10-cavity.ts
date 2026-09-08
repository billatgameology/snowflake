import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

const ARMS = ["M1", "M1_NO_DIP_ABLATION"] as const;
const TEMPERATURES_C = [-4.5, -5] as const;
const COARSE_SAMPLE_EXTENTS = Object.freeze([5, 9, 13, 17, 21, 25]);
const FINE_SAMPLE_EXTENTS = Object.freeze([9, 17, 25, 33, 41, 49]);
const CONFIGURATIONS = [
  { tag: "baseline", dimsN: 64, dxUm: 0.35, seedRadius: 2, seedThickness: 1,
    targetExtent: 29, spatialSampleExtents: COARSE_SAMPLE_EXTENTS },
  { tag: "seed-thick", dimsN: 64, dxUm: 0.35, seedRadius: 2, seedThickness: 5,
    targetExtent: 29, spatialSampleExtents: COARSE_SAMPLE_EXTENTS },
  { tag: "seed-wide", dimsN: 64, dxUm: 0.35, seedRadius: 3, seedThickness: 1,
    targetExtent: 29, spatialSampleExtents: COARSE_SAMPLE_EXTENTS },
  { tag: "fine-thin", dimsN: 126, dxUm: 0.175, seedRadius: 4, seedThickness: 1,
    targetExtent: 57, spatialSampleExtents: FINE_SAMPLE_EXTENTS },
  { tag: "fine-thick", dimsN: 126, dxUm: 0.175, seedRadius: 4, seedThickness: 3,
    targetExtent: 57, spatialSampleExtents: FINE_SAMPLE_EXTENTS },
] as const;

export const POST_PHASE10_CAVITY_ROW_COUNT = 20;

export const POST_PHASE10_CAVITY_ROWS: readonly DiscoveryRow[] = Object.freeze(
  CONFIGURATIONS.flatMap(({ tag, ...configuration }) =>
    TEMPERATURES_C.flatMap((tempC) =>
      ARMS.map((paramSet): DiscoveryRow => Object.freeze({
        id: `cavity-${tag}-t${String(Math.abs(tempC)).replace(".", "p")}-` +
          (paramSet === "M1" ? "m1" : "nodip"),
        lane: "cavity-mechanism",
        conditional: false,
        tempC,
        fraction: 0.075,
        sigmaInfinity: phase6SigmaWaterFromTable(tempC) * 0.075,
        pressurePa: 101_325,
        paramSet,
        ...configuration,
        cflFill: 0.05,
        maxSteps: 100_000,
      })),
    ),
  ),
);

if (POST_PHASE10_CAVITY_ROWS.length !== POST_PHASE10_CAVITY_ROW_COUNT) {
  throw new Error(
    `post-Phase-10 cavity roster has ${POST_PHASE10_CAVITY_ROWS.length} rows, ` +
      `expected ${POST_PHASE10_CAVITY_ROW_COUNT}`,
  );
}

const cavityRowIndex = new Map(POST_PHASE10_CAVITY_ROWS.map((row) => [row.id, row]));
if (cavityRowIndex.size !== POST_PHASE10_CAVITY_ROWS.length) {
  throw new Error("post-Phase-10 cavity roster contains duplicate row ids");
}

export function findPostPhase10CavityRow(rowId: string): DiscoveryRow | undefined {
  return cavityRowIndex.get(rowId);
}
