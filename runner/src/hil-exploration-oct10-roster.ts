import { FIRST_BATCH_ROWS, namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry,
  type FirstBatchHost } from "./hil-bld-batch-roster.ts";

const historySuffixes = [
  "history-t6-to-t14p4-e7-nodip", "history-t6-to-t14p4-e15-nodip",
  "history-t14p4-to-t6-e7-nodip", "history-t14p4-to-t6-e15-nodip",
] as const;
const coldSuffixes = ["both", "neither", "basal-only", "prism-only"]
  .map((arm) => `cold-t14p4-f0p1-${arm}`);
const staticSuffixes = ["history-static-t6-m1", "history-static-t6-nodip"] as const;
const historySamples = Object.freeze([5, 9, 13, 17, 21, 25]);
const coldSamples = Object.freeze([5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27]);

function longer(suffix: string, cold: boolean): FirstBatchEntry {
  const controlId = `batch1-${cold ? "bld" : "hil"}-${suffix}`;
  const control = FIRST_BATCH_ROWS.find(({ row }) => row.id === controlId);
  if (control === undefined) throw new Error(`missing October 10 control: ${controlId}`);
  return Object.freeze({ ...control, host: "HIL", row: Object.freeze({
    ...control.row, id: `oct10-hil-${suffix}`, targetExtent: 29,
    spatialSampleExtents: cold ? coldSamples : historySamples,
  }) });
}

export const HIL_EXPLORATION_OCT10_ROWS: readonly FirstBatchEntry[] = Object.freeze([
  ...historySuffixes.map((suffix) => longer(suffix, false)),
  ...coldSuffixes.map((suffix) => longer(suffix, true)),
  ...staticSuffixes.map((suffix) => longer(suffix, false)),
]);

export const HIL_EXPLORATION_OCT10: DiscoveryBatchDefinition = Object.freeze({
  id: "hil-history-cold-exploration-2026-10-10", launchPrefix: "hil-exploration-oct10",
  rows: HIL_EXPLORATION_OCT10_ROWS, workerCeilings: Object.freeze({ HIL: 10 }),
  representatives: (host: FirstBatchHost) => namedBatchRows(HIL_EXPLORATION_OCT10, host),
});
