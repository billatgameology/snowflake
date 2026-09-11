import { findPostPhase10FollowupRow } from "./post-phase10-followup.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

const TEMPERATURE_TAGS = ["4p5", "5"] as const;

/** Four new interventions only; the two endpoint controls per temperature already exist. */
export const POST_PHASE10_BASAL_WIDTH_ROWS: readonly DiscoveryRow[] = Object.freeze(
  TEMPERATURE_TAGS.flatMap((temperature) => [2, 3].map((threshold): DiscoveryRow => {
    const baseline = findPostPhase10FollowupRow(`followup-larger-cavity-t${temperature}-f0p075-nodip`);
    if (baseline === undefined) throw new Error(`missing larger no-dip row at ${temperature}`);
    return Object.freeze({ ...baseline, id: `basal-width-t${temperature}-le${threshold}`,
      paramSet: "M1", experimentalBasalWidthCells: threshold });
  })),
);

export const POST_PHASE10_BASAL_WIDTH_REUSED_CONTROLS = Object.freeze(
  TEMPERATURE_TAGS.flatMap((temperature) => {
    const broad = `followup-larger-cavity-t${temperature}-f0p075-nodip`;
    const dipped = `facet-isolation-long-t${temperature}-basal-only`;
    return [
      { rowId: broad,
        directory: `out/post-phase10-followup/campaign-2026-09-03-wave2/rows/${broad}`,
        effectiveBasalKinetics: "broad-everywhere",
        producerGitHead: "dd4ef5245e6b48fff164b888e3b287665ab6c457" },
      { rowId: dipped,
        directory: `out/post-phase10-facet-factorial/campaign-long-2026-09-09/rows/${dipped}`,
        effectiveBasalKinetics: "dipped-everywhere",
        producerGitHead: "4c35764965a3726ec0a405817343f5dec21aa76f" },
    ].map((control) => Object.freeze(control));
  }),
);

export function findPostPhase10BasalWidthRow(rowId: string): DiscoveryRow | undefined {
  return POST_PHASE10_BASAL_WIDTH_ROWS.find((row) => row.id === rowId);
}
