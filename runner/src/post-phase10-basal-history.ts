import { findPostPhase10FollowupRow } from "./post-phase10-followup.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

export const POST_PHASE10_BASAL_HISTORY_CUTOFF_SECONDS = 20;
export const POST_PHASE10_BASAL_HISTORY_DIMS_N = 112;
export const POST_PHASE10_BASAL_HISTORY_TARGET_EXTENT = 53;

/** Same-seed early/late factorial plus the global-basal benchmark, in a larger matched domain. */
export const POST_PHASE10_BASAL_HISTORY_ROWS: readonly DiscoveryRow[] = Object.freeze(
  (["4p5", "5"] as const).flatMap((temperature) => {
    const baseline = findPostPhase10FollowupRow(`followup-larger-cavity-t${temperature}-f0p075-nodip`);
    if (baseline === undefined) throw new Error(`missing larger no-dip row at ${temperature}`);
    return (["broad", "global-basal", "full", "early", "late"] as const).map((arm): DiscoveryRow => {
      const common = { ...baseline, id: `basal-history-t${temperature}-${arm}`,
        dimsN: POST_PHASE10_BASAL_HISTORY_DIMS_N, targetExtent: POST_PHASE10_BASAL_HISTORY_TARGET_EXTENT };
      if (arm === "broad") return Object.freeze(common);
      if (arm === "global-basal") return Object.freeze({ ...common, paramSet: "M1", experimentalFacetDips: "basal-only" });
      return Object.freeze({ ...common, paramSet: "M1", experimentalBasalWidthCells: 3,
        ...(arm === "full" ? {} : { experimentalBasalWidthHistory: Object.freeze({
          mode: arm === "early" ? "early-only" as const : "late-only" as const,
          cutoffSeconds: POST_PHASE10_BASAL_HISTORY_CUTOFF_SECONDS,
        }) }) });
    });
  }),
);

export function findPostPhase10BasalHistoryRow(rowId: string): DiscoveryRow | undefined {
  return POST_PHASE10_BASAL_HISTORY_ROWS.find((row) => row.id === rowId);
}
