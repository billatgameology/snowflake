import type { LKFacetDipArm } from "@vcc/solver-cpu";
import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

export type FirstBatchHost = "HIL" | "BLD";
export type FirstBatchTrack = "seed" | "pressure" | "environment-history" | "cold-core-tip" | "warm-history";

export interface FirstBatchEntry {
  readonly host: FirstBatchHost;
  readonly track: FirstBatchTrack;
  readonly row: DiscoveryRow;
}

export const FIRST_BATCH_ID = "hil-bld-first-batch-2026-10-07" as const;
export const FIRST_BATCH_WORKER_CEILINGS = Object.freeze({ HIL: 16, BLD: 28 });
export const FIRST_BATCH_WALL_SECONDS = 4 * 60 * 60;
export const FIRST_BATCH_PROBE_WALL_SECONDS = 3 * 60;
export const FIRST_BATCH_PROBE_STEPS = 3;
export const FIRST_BATCH_KILL_GRACE_SECONDS = 60;

const SPATIAL_SAMPLE_EXTENTS = Object.freeze([5, 9, 13, 17]);
const FACET_ARMS: readonly LKFacetDipArm[] = Object.freeze(["both", "neither", "basal-only", "prism-only"]);
const ORDINARY_ARMS = ["M1", "M1_NO_DIP_ABLATION"] as const;

function tag(value: number): string {
  return String(Math.abs(value)).replace(".", "p");
}

function makeEntry(
  host: FirstBatchHost,
  track: FirstBatchTrack,
  input: Pick<DiscoveryRow, "id" | "lane" | "tempC" | "fraction"> & Partial<DiscoveryRow>,
): FirstBatchEntry {
  const row: DiscoveryRow = Object.freeze({
    conditional: false,
    pressurePa: 101_325,
    paramSet: "M1",
    dimsN: 64,
    dxUm: 0.35,
    cflFill: 0.05,
    seedRadius: 2,
    seedThickness: 1,
    targetExtent: 21,
    maxSteps: 20_000,
    spatialSampleExtents: SPATIAL_SAMPLE_EXTENTS,
    ...input,
    sigmaInfinity: phase6SigmaWaterFromTable(input.tempC) * input.fraction,
  });
  return Object.freeze({ host, track, row });
}

const seedBlocks = [-7, -9].flatMap((tempC) =>
  [{ seedRadius: 3, seedThickness: 1 }, { seedRadius: 1, seedThickness: 5 }].map((seed) =>
    FACET_ARMS.map((experimentalFacetDips) => makeEntry("HIL", "seed", {
      id: `batch1-hil-seed-t${tag(tempC)}-f0p15-r${seed.seedRadius}t${seed.seedThickness}-${experimentalFacetDips}`,
      lane: "adaptive-seed", tempC, fraction: 0.15, ...seed, experimentalFacetDips,
    })),
  ),
);

const pressureBlocks = [0.1, 0.15, 0.2].flatMap((fraction) =>
  [50_662.5, 202_650].map((pressurePa) => FACET_ARMS.map((experimentalFacetDips) =>
    makeEntry("HIL", "pressure", {
      id: `batch1-hil-pressure-t6-f${tag(fraction)}-p${tag(pressurePa)}-${experimentalFacetDips}`,
      lane: "adaptive-pressure", tempC: -6, fraction, pressurePa, experimentalFacetDips,
    }),
  )),
);

const historyBlocks = [-6, -14.4].flatMap((tempC) => {
  const destination = tempC === -6 ? -14.4 : -6;
  return [7, 11, 15].map((triggerLargestExtent) => ORDINARY_ARMS.map((paramSet) =>
    makeEntry("HIL", "environment-history", {
      id: `batch1-hil-history-t${tag(tempC)}-to-t${tag(destination)}-e${triggerLargestExtent}-` +
        (paramSet === "M1" ? "m1" : "nodip"),
      lane: "followup-history", tempC, fraction: 0.15, paramSet,
      timelineEvent: Object.freeze({
        triggerLargestExtent, tempC: destination,
        sigmaInfinity: phase6SigmaWaterFromTable(destination) * 0.15,
      }),
    }),
  ));
});
const historyStaticBlocks = [-6, -14.4].map((tempC) => ORDINARY_ARMS.map((paramSet) =>
  makeEntry("HIL", "environment-history", {
    id: `batch1-hil-history-static-t${tag(tempC)}-` + (paramSet === "M1" ? "m1" : "nodip"),
    lane: "followup-history", tempC, fraction: 0.15, paramSet,
  }),
));

const coldBlocks = [-12, -14.4, -18].flatMap((tempC) => [0.1, 0.15, 0.2].map((fraction) =>
  FACET_ARMS.map((experimentalFacetDips) => makeEntry("BLD", "cold-core-tip", {
    id: `batch1-bld-cold-t${tag(tempC)}-f${tag(fraction)}-${experimentalFacetDips}`,
    lane: "cavity-mechanism", tempC, fraction, experimentalFacetDips,
  })),
));

const warmBlocks = [-4.5, -5].map((tempC) => ["broad", "full", "early"].map((arm) =>
  makeEntry("BLD", "warm-history", {
    id: `batch1-bld-warm-t${tag(tempC)}-${arm}`,
    lane: "cavity-mechanism", tempC, fraction: 0.075,
    paramSet: arm === "broad" ? "M1_NO_DIP_ABLATION" : "M1",
    ...(arm === "broad" ? {} : { experimentalBasalWidthCells: 3 }),
    ...(arm !== "early" ? {} : { experimentalBasalWidthHistory: Object.freeze({
      mode: "early-only" as const, cutoffSeconds: 20,
    }) }),
  }),
));

/** Keep matched blocks together while supplying each track early in its host's queue. */
function interleaveBlocks(...tracks: readonly (readonly (readonly FirstBatchEntry[])[])[]): FirstBatchEntry[] {
  const result: FirstBatchEntry[] = [];
  const longest = Math.max(...tracks.map((track) => track.length));
  for (let index = 0; index < longest; index++) {
    for (const track of tracks) result.push(...(track[index] ?? []));
  }
  return result;
}

export const FIRST_BATCH_ROWS: readonly FirstBatchEntry[] = Object.freeze([
  ...interleaveBlocks(seedBlocks, pressureBlocks, [...historyBlocks, ...historyStaticBlocks]),
  ...interleaveBlocks(coldBlocks, warmBlocks),
]);

if (FIRST_BATCH_ROWS.length !== 98 || new Set(FIRST_BATCH_ROWS.map(({ row }) => row.id)).size !== 98) {
  throw new Error("first HIL/BLD batch must contain 98 distinct rows");
}

export function firstBatchRows(host: FirstBatchHost): readonly FirstBatchEntry[] {
  if (host !== "HIL" && host !== "BLD") throw new Error(`unknown first-batch host: ${String(host)}`);
  return Object.freeze(FIRST_BATCH_ROWS.filter((entry) => entry.host === host));
}

const REPRESENTATIVE_IDS = {
  HIL: [
    "batch1-hil-seed-t7-f0p15-r3t1-basal-only",
    "batch1-hil-seed-t9-f0p15-r1t5-prism-only",
    "batch1-hil-pressure-t6-f0p2-p50662p5-both",
    "batch1-hil-pressure-t6-f0p2-p202650-neither",
    "batch1-hil-history-t6-to-t14p4-e15-m1",
    "batch1-hil-history-t14p4-to-t6-e15-nodip",
  ],
  BLD: [
    "batch1-bld-cold-t18-f0p2-both",
    "batch1-bld-cold-t18-f0p2-neither",
    "batch1-bld-cold-t18-f0p2-basal-only",
    "batch1-bld-cold-t18-f0p2-prism-only",
    "batch1-bld-warm-t5-broad",
    "batch1-bld-warm-t5-full",
    "batch1-bld-warm-t5-early",
  ],
} as const;

/**
 * Selected geometry/preparation paths, not a census of scientific settings or mature costs.
 * The caller copies each actual row with maxSteps = FIRST_BATCH_PROBE_STEPS.
 */
export function firstBatchRepresentativeRows(host: FirstBatchHost): readonly FirstBatchEntry[] {
  const rows = firstBatchRows(host);
  return Object.freeze(REPRESENTATIVE_IDS[host].map((id) => {
    const entry = rows.find(({ row }) => row.id === id);
    if (entry === undefined) throw new Error(`first-batch representative is not assigned to ${host}: ${id}`);
    return entry;
  }));
}
