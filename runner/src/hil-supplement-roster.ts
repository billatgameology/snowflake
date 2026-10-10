import { FIRST_BATCH_ROWS, namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry,
  type FirstBatchHost } from "./hil-bld-batch-roster.ts";

const historySuffixes = [
  "history-t6-to-t14p4-e7-m1", "history-t6-to-t14p4-e15-m1",
  "history-t14p4-to-t6-e7-m1", "history-t14p4-to-t6-e15-m1",
] as const;
const pressureSuffixes = [
  "pressure-t6-f0p1-p50662p5-both", "pressure-t6-f0p1-p202650-both",
  "pressure-t6-f0p2-p50662p5-both", "pressure-t6-f0p2-p202650-both",
] as const;

function supplement(suffix: string, history: boolean): FirstBatchEntry {
  const control = FIRST_BATCH_ROWS.find(({ row }) => row.id === `batch1-hil-${suffix}`);
  if (control === undefined || control.host !== "HIL") throw new Error(`missing supplement control: ${suffix}`);
  return Object.freeze({ ...control, row: Object.freeze({
    ...control.row, id: `supplement-hil-${suffix}`,
    ...(history ? { targetExtent: 29, spatialSampleExtents: Object.freeze([5, 9, 13, 17, 21, 25]) }
      : { cflFill: 0.025 }),
  }) });
}

/** Only the registered target/observation or timestep differs from each retained control. */
export const HIL_SUPPLEMENT_ROWS: readonly FirstBatchEntry[] = Object.freeze([
  ...historySuffixes.map((suffix) => supplement(suffix, true)),
  ...pressureSuffixes.map((suffix) => supplement(suffix, false)),
]);

export const HIL_SUPPLEMENT: DiscoveryBatchDefinition = Object.freeze({
  id: "hil-history-pressure-supplement-2026-10-09", launchPrefix: "hil-supplement",
  rows: HIL_SUPPLEMENT_ROWS, workerCeilings: Object.freeze({ HIL: 8 }),
  representatives: (host: FirstBatchHost) => namedBatchRows(HIL_SUPPLEMENT, host),
});
