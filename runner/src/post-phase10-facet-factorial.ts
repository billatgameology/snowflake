import { findPostPhase10CavityRow } from "./post-phase10-cavity.ts";
import { findPostPhase10FollowupRow } from "./post-phase10-followup.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

const TEMPERATURE_TAGS = ["4p5", "5"] as const;
const HYBRID_ARMS = ["basal-only", "prism-only"] as const;
const CONTROL_ROOT = "out/post-phase10-cavity/campaign-2026-09-08/rows";

export const POST_PHASE10_FACET_FACTORIAL_ROWS: readonly DiscoveryRow[] = Object.freeze(
  TEMPERATURE_TAGS.flatMap((temperature) => {
    const baseline = findPostPhase10CavityRow(`cavity-baseline-t${temperature}-m1`);
    if (baseline === undefined) throw new Error(`missing cavity baseline at temperature ${temperature}`);
    return HYBRID_ARMS.map((experimentalFacetDips): DiscoveryRow => Object.freeze({
      ...baseline,
      id: `facet-isolation-t${temperature}-${experimentalFacetDips}`,
      experimentalFacetDips,
    }));
  }),
);

/** These existing ordinary rows are read-only comparison inputs, never additional launch rows. */
export const POST_PHASE10_FACET_REUSED_CONTROLS = Object.freeze(
  TEMPERATURE_TAGS.flatMap((temperature) => (["m1", "nodip"] as const).map((arm) => {
    const rowId = `cavity-baseline-t${temperature}-${arm}`;
    return Object.freeze({
      rowId,
      directory: `${CONTROL_ROOT}/${rowId}`,
      effectiveFacetDips: arm === "m1" ? "both" as const : "neither" as const,
      producerGitHead: "eb7b5c4f932939e3b40d686a996796fdaceb1894",
    });
  })),
);

export function findPostPhase10FacetFactorialRow(rowId: string): DiscoveryRow | undefined {
  return POST_PHASE10_FACET_FACTORIAL_ROWS.find((row) => row.id === rowId);
}

export const POST_PHASE10_FACET_FACTORIAL_LONG_ROWS: readonly DiscoveryRow[] = Object.freeze(
  TEMPERATURE_TAGS.flatMap((temperature) => {
    const baseline = findPostPhase10FollowupRow(`followup-larger-cavity-t${temperature}-f0p075-m1`);
    if (baseline === undefined) throw new Error(`missing larger cavity baseline at temperature ${temperature}`);
    return HYBRID_ARMS.map((experimentalFacetDips): DiscoveryRow => Object.freeze({
      ...baseline,
      id: `facet-isolation-long-t${temperature}-${experimentalFacetDips}`,
      experimentalFacetDips,
    }));
  }),
);

export const POST_PHASE10_FACET_LONG_REUSED_CONTROLS = Object.freeze(
  TEMPERATURE_TAGS.flatMap((temperature) => (["m1", "nodip"] as const).map((arm) => {
    const rowId = `followup-larger-cavity-t${temperature}-f0p075-${arm}`;
    return Object.freeze({
      rowId,
      directory: `out/post-phase10-followup/campaign-2026-09-03-wave2/rows/${rowId}`,
      effectiveFacetDips: arm === "m1" ? "both" as const : "neither" as const,
      producerGitHead: "dd4ef5245e6b48fff164b888e3b287665ab6c457",
    });
  })),
);

export function findPostPhase10FacetFactorialLongRow(rowId: string): DiscoveryRow | undefined {
  return POST_PHASE10_FACET_FACTORIAL_LONG_ROWS.find((row) => row.id === rowId);
}
