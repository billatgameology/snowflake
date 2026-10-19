import { namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry,
  type FirstBatchHost } from "./hil-bld-batch-roster.ts";
import { HIL_LARGE_BATCH_OCT11_ROWS } from "./hil-large-batch-oct11-roster.ts";
import { HIL_TWO_DAY_OCT12_ROWS } from "./hil-two-day-oct12-roster.ts";

/** Retain each executed control's operands, changing only its new identity and fill timestep. */
function halfStep(entries: readonly FirstBatchEntry[], controlId: string, id: string): FirstBatchEntry {
  const control = entries.find((entry) => entry.row.id === controlId);
  if (control === undefined) throw new Error(`missing October 19 facet/pressure control: ${controlId}`);
  return Object.freeze({ ...control, row: Object.freeze({ ...control.row, id, cflFill: 0.025 }) });
}

const facet = ["6p5", "9p5"].flatMap((temperature) => ["basal-only", "prism-only"].map((arm) =>
  halfStep(HIL_LARGE_BATCH_OCT11_ROWS,
    `oct11-hil-seed-t${temperature}-f0p15-r3-h1-${arm}`,
    `oct19-hil-facet-step-t${temperature}-f0p15-r3-h1-cfl0p025-${arm}`),
));

const pressure = ["50662p5", "202650"].flatMap((pressureTag) => {
  const controls = [
    ...[7, 15].map((extent) => `oct12-hil-pressure-history-t14p4-to-t6-f0p2-e${extent}-p${pressureTag}-m1`),
    ...["14p4", "6"].map((temperature) => `oct12-hil-pressure-static-t${temperature}-f0p2-p${pressureTag}-m1`),
  ];
  return controls.map((controlId) => halfStep(HIL_TWO_DAY_OCT12_ROWS, controlId,
    controlId.replace("oct12-hil-pressure-", "oct19-hil-pressure-step-") + "-cfl0p025"));
});

export const HIL_FACET_PRESSURE_OCT19_ROWS: readonly FirstBatchEntry[] = Object.freeze([...facet, ...pressure]);
export const HIL_FACET_PRESSURE_OCT19: DiscoveryBatchDefinition = Object.freeze({
  id: "hil-facet-pressure-2026-10-19", launchPrefix: "hil-facet-pressure-oct19",
  rows: HIL_FACET_PRESSURE_OCT19_ROWS, workerCeilings: Object.freeze({ HIL: 12 }),
  representatives: (host: FirstBatchHost) => namedBatchRows(HIL_FACET_PRESSURE_OCT19, host),
});
