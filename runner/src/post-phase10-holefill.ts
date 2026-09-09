import { findPostPhase10CavityRow } from "./post-phase10-cavity.ts";
import { findPostPhase10FollowupRow } from "./post-phase10-followup.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

const TEMPERATURE_TAGS = ["4p5", "5"] as const;
const KINETIC_ARMS = ["m1", "nodip"] as const;
const CONTROL_ROOT = "out/post-phase10-cavity/campaign-2026-09-08/rows";

export const POST_PHASE10_HOLEFILL_ROWS: readonly DiscoveryRow[] = Object.freeze(
  TEMPERATURE_TAGS.flatMap((temperature) => KINETIC_ARMS.map((arm): DiscoveryRow => {
    const baseline = findPostPhase10CavityRow(`cavity-baseline-t${temperature}-${arm}`);
    if (baseline === undefined) throw new Error(`missing cavity baseline at ${temperature}/${arm}`);
    return Object.freeze({
      ...baseline,
      id: `holefill-off-t${temperature}-${arm}`,
      experimentalHoleFilling: "disabled",
    });
  })),
);

/** Ordinary, geometrically enabled controls are comparison inputs, not launch rows. */
export const POST_PHASE10_HOLEFILL_REUSED_CONTROLS = Object.freeze(
  TEMPERATURE_TAGS.flatMap((temperature) => KINETIC_ARMS.map((arm) => {
    const rowId = `cavity-baseline-t${temperature}-${arm}`;
    return Object.freeze({
      rowId,
      directory: `${CONTROL_ROOT}/${rowId}`,
      effectiveHoleFilling: "enabled" as const,
      producerGitHead: "eb7b5c4f932939e3b40d686a996796fdaceb1894",
    });
  })),
);

export function findPostPhase10HolefillRow(rowId: string): DiscoveryRow | undefined {
  return POST_PHASE10_HOLEFILL_ROWS.find((row) => row.id === rowId);
}

export const POST_PHASE10_HOLEFILL_LONG_ROWS: readonly DiscoveryRow[] = Object.freeze(
  TEMPERATURE_TAGS.flatMap((temperature) => KINETIC_ARMS.map((arm): DiscoveryRow => {
    const baseline = findPostPhase10FollowupRow(`followup-larger-cavity-t${temperature}-f0p075-${arm}`);
    if (baseline === undefined) throw new Error(`missing larger cavity baseline at ${temperature}/${arm}`);
    return Object.freeze({
      ...baseline,
      id: `holefill-off-long-t${temperature}-${arm}`,
      experimentalHoleFilling: "disabled",
    });
  })),
);

export const POST_PHASE10_HOLEFILL_LONG_REUSED_CONTROLS = Object.freeze(
  TEMPERATURE_TAGS.flatMap((temperature) => KINETIC_ARMS.map((arm) => {
    const rowId = `followup-larger-cavity-t${temperature}-f0p075-${arm}`;
    return Object.freeze({
      rowId,
      directory: `out/post-phase10-followup/campaign-2026-09-03-wave2/rows/${rowId}`,
      effectiveHoleFilling: "enabled" as const,
      producerGitHead: "dd4ef5245e6b48fff164b888e3b287665ab6c457",
    });
  })),
);

export function findPostPhase10HolefillLongRow(rowId: string): DiscoveryRow | undefined {
  return POST_PHASE10_HOLEFILL_LONG_ROWS.find((row) => row.id === rowId);
}
