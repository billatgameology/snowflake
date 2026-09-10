import { findPostPhase10CavityRow } from "./post-phase10-cavity.ts";
import { findPostPhase10FollowupRow } from "./post-phase10-followup.ts";
import { findPostPhase10FacetFactorialLongRow } from "./post-phase10-facet-factorial.ts";
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

/** Only the missing interaction corners; the three other corners are completed inputs. */
export const POST_PHASE10_PRISM_HOLEFILL_ROWS: readonly DiscoveryRow[] = Object.freeze(
  TEMPERATURE_TAGS.map((temperature): DiscoveryRow => {
    const baseline = findPostPhase10FacetFactorialLongRow(`facet-isolation-long-t${temperature}-prism-only`);
    if (baseline === undefined) throw new Error(`missing larger prism-only row at ${temperature}`);
    return Object.freeze({
      ...baseline,
      id: `prism-holefill-off-t${temperature}`,
      experimentalHoleFilling: "disabled",
    });
  }),
);

export const POST_PHASE10_PRISM_HOLEFILL_REUSED_CONTROLS = Object.freeze(
  TEMPERATURE_TAGS.flatMap((temperature) => {
    const neitherOn = `followup-larger-cavity-t${temperature}-f0p075-nodip`;
    const neitherOff = `holefill-off-long-t${temperature}-nodip`;
    const prismOn = `facet-isolation-long-t${temperature}-prism-only`;
    return [
      { rowId: neitherOn,
        directory: `out/post-phase10-followup/campaign-2026-09-03-wave2/rows/${neitherOn}`,
        effectiveFacetDips: "neither", effectiveHoleFilling: "enabled",
        producerGitHead: "dd4ef5245e6b48fff164b888e3b287665ab6c457" },
      { rowId: neitherOff,
        directory: `out/post-phase10-holefill/campaign-long-2026-09-09/rows/${neitherOff}`,
        effectiveFacetDips: "neither", effectiveHoleFilling: "disabled",
        producerGitHead: "4c35764965a3726ec0a405817343f5dec21aa76f" },
      { rowId: prismOn,
        directory: `out/post-phase10-facet-factorial/campaign-long-2026-09-09/rows/${prismOn}`,
        effectiveFacetDips: "prism-only", effectiveHoleFilling: "enabled",
        producerGitHead: "4c35764965a3726ec0a405817343f5dec21aa76f" },
    ].map((control) => Object.freeze(control));
  }),
);

export function findPostPhase10PrismHolefillRow(rowId: string): DiscoveryRow | undefined {
  return POST_PHASE10_PRISM_HOLEFILL_ROWS.find((row) => row.id === rowId);
}
