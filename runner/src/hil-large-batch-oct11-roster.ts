import { FIRST_BATCH_ROWS, namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry,
  type FirstBatchHost } from "./hil-bld-batch-roster.ts";
import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

const facetArms = ["both", "neither", "basal-only", "prism-only"] as const;
const preparations = ["m1", "nodip"] as const;
const spatialSamples = Object.freeze([5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27]);
const tag = (value: number): string => String(Math.abs(value)).replace(".", "p");

/** Preserve the existing row controls except the explicitly registered operands. */
function registered(templateId: string, suffix: string, changes: Partial<DiscoveryRow> = {}): FirstBatchEntry {
  const template = FIRST_BATCH_ROWS.find(({ row }) => row.id === templateId);
  if (template === undefined) throw new Error(`missing October 11 template: ${templateId}`);
  const changed = { ...template.row, ...changes };
  return Object.freeze({ ...template, host: "HIL", row: Object.freeze({
    ...changed, id: `oct11-hil-${suffix}`, targetExtent: 29, spatialSampleExtents: spatialSamples,
    sigmaInfinity: phase6SigmaWaterFromTable(changed.tempC) * changed.fraction,
  }) });
}

const coldGroups = [-11, -13, -16, -20].flatMap((tempC) => [0.1, 0.15, 0.2].map((fraction) =>
  facetArms.map((arm) => registered(`batch1-bld-cold-t14p4-f0p1-${arm}`,
    `cold-t${tag(tempC)}-f${tag(fraction)}-${arm}`, { tempC, fraction })),
));

const seedGroups = [-6.5, -9.5].flatMap((tempC) =>
  [{ seedRadius: 3, seedThickness: 1 }, { seedRadius: 1, seedThickness: 5 }].map((seed) =>
    facetArms.map((arm) => registered(
      `batch1-hil-seed-t7-f0p15-r${seed.seedRadius}t${seed.seedThickness}-${arm}`,
      `seed-t${tag(tempC)}-f0p15-r${seed.seedRadius}-h${seed.seedThickness}-${arm}`, { tempC })),
  ),
);

const historyGroups = [-6, -14.4].flatMap((tempC) => {
  const destination = tempC === -6 ? -14.4 : -6;
  return [0.1, 0.2].flatMap((fraction) => [7, 11, 15].map((triggerLargestExtent) =>
    preparations.map((preparation) => registered(
      `batch1-hil-history-t${tag(tempC)}-to-t${tag(destination)}-e${triggerLargestExtent}-${preparation}`,
      `history-t${tag(tempC)}-to-t${tag(destination)}-f${tag(fraction)}-e${triggerLargestExtent}-${preparation}`,
      { fraction, timelineEvent: Object.freeze({ triggerLargestExtent, tempC: destination,
        sigmaInfinity: phase6SigmaWaterFromTable(destination) * fraction }) },
    )),
  ));
});

const staticGroups = [{ tempC: -6, fraction: 0.1 }, { tempC: -6, fraction: 0.2 },
  { tempC: -14.4, fraction: 0.2 }].map(({ tempC, fraction }) => preparations.map((preparation) =>
  registered(`batch1-hil-history-static-t${tag(tempC)}-${preparation}`,
    `static-t${tag(tempC)}-f${tag(fraction)}-${preparation}`, { fraction }),
));

const timestepGroups = [0.025, 0.0125].map((cflFill) => facetArms.map((arm) =>
  registered(`batch1-bld-cold-t14p4-f0p1-${arm}`, `cold-step-t14p4-f0p1-cfl${tag(cflFill)}-${arm}`, { cflFill }),
));

const blocks = [coldGroups, seedGroups, historyGroups, staticGroups, timestepGroups];
const interleaved: FirstBatchEntry[] = [];
for (let index = 0; index < Math.max(...blocks.map((block) => block.length)); index++) {
  for (const block of blocks) interleaved.push(...(block[index] ?? []));
}

export const HIL_LARGE_BATCH_OCT11_ROWS: readonly FirstBatchEntry[] = Object.freeze(interleaved);

export const HIL_LARGE_BATCH_OCT11: DiscoveryBatchDefinition = Object.freeze({
  id: "hil-queued-exploration-2026-10-11", launchPrefix: "hil-large-batch-oct11",
  rows: HIL_LARGE_BATCH_OCT11_ROWS, workerCeilings: Object.freeze({ HIL: 12 }),
  representatives: (host: FirstBatchHost) => namedBatchRows(HIL_LARGE_BATCH_OCT11, host),
});
