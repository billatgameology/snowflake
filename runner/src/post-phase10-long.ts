import { POST_PHASE10_ADAPTIVE_ROWS } from "./post-phase10-adaptive.ts";
import type { DiscoveryLane, DiscoveryRow } from "./post-phase10-discovery.ts";

export const POST_PHASE10_LONG_DIMS_N = 64;
export const POST_PHASE10_LONG_TARGET_EXTENT = 29;

const LONG_LANES: Readonly<Record<DiscoveryLane, DiscoveryLane | undefined>> = Object.freeze({
  A: undefined,
  B: undefined,
  C: undefined,
  "adaptive-map": "long-map",
  "adaptive-pressure": "long-pressure",
  "adaptive-seed": "long-seed",
  "long-map": undefined,
  "long-pressure": undefined,
  "long-seed": undefined,
  "confirm-seed": undefined,
  "confirm-pressure": undefined,
  "confirm-map": undefined,
  "followup-seed-timestep": undefined,
  "followup-seed-forcing": undefined,
  "followup-seed-localization": undefined,
  "followup-mixed-timestep": undefined,
  "followup-larger": undefined,
  "followup-history": undefined,
});

export const POST_PHASE10_LONG_ROWS: readonly DiscoveryRow[] = Object.freeze(
  POST_PHASE10_ADAPTIVE_ROWS.map((pilotRow) => {
    const lane = LONG_LANES[pilotRow.lane];
    if (lane === undefined) {
      throw new Error(`no long-wave lane for pilot lane ${pilotRow.lane}`);
    }
    return Object.freeze({
      ...pilotRow,
      id: `long-${pilotRow.id}`,
      lane,
      dimsN: POST_PHASE10_LONG_DIMS_N,
      targetExtent: POST_PHASE10_LONG_TARGET_EXTENT,
    });
  }),
);

const longRowIndex = new Map(POST_PHASE10_LONG_ROWS.map((row) => [row.id, row]));
if (longRowIndex.size !== POST_PHASE10_LONG_ROWS.length) {
  throw new Error("post-Phase-10 long-wave roster contains duplicate row ids");
}

export function findPostPhase10LongRow(rowId: string): DiscoveryRow | undefined {
  return longRowIndex.get(rowId);
}
