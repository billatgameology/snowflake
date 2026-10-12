import { FIRST_BATCH_ROWS, namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry,
  type FirstBatchHost } from "./hil-bld-batch-roster.ts";
import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

const arms = ["both", "neither", "basal-only", "prism-only"] as const;
const preparations = ["m1", "nodip"] as const;
const samples = Object.freeze([5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27]);
const tag = (value: number): string => String(Math.abs(value)).replace(".", "p");

/** Change only the finite operands named in the October 12 protocol. */
function registered(templateId: string, suffix: string, changes: Partial<DiscoveryRow>): FirstBatchEntry {
  const template = FIRST_BATCH_ROWS.find(({ row }) => row.id === templateId);
  if (template === undefined) throw new Error(`missing October 12 template: ${templateId}`);
  const changed = { ...template.row, ...changes };
  return Object.freeze({ ...template, host: "HIL", row: Object.freeze({
    ...changed, id: `oct12-hil-${suffix}`, targetExtent: 29, spatialSampleExtents: samples,
    sigmaInfinity: phase6SigmaWaterFromTable(changed.tempC) * changed.fraction,
  }) });
}

function cold(tempC: number, fraction: number, cflFill: number, prefix: string): FirstBatchEntry[] {
  return arms.map((arm) => registered(`batch1-bld-cold-t14p4-f0p1-${arm}`,
    `${prefix}-${arm}`, { tempC, fraction, cflFill }));
}

function history(tempC: number, fraction: number, triggerLargestExtent: number,
  cflFill: number, pressurePa: number, prefix: string): FirstBatchEntry[] {
  const destination = tempC === -6 ? -14.4 : -6;
  return preparations.map((preparation) => registered(
    `batch1-hil-history-t${tag(tempC)}-to-t${tag(destination)}-e${triggerLargestExtent}-${preparation}`,
    `${prefix}-${preparation}`, { fraction, cflFill, pressurePa,
      timelineEvent: Object.freeze({ triggerLargestExtent, tempC: destination,
        sigmaInfinity: phase6SigmaWaterFromTable(destination) * fraction }),
    }));
}

function staticRows(tempC: number, fraction: number, cflFill: number,
  pressurePa: number, prefix: string): FirstBatchEntry[] {
  return preparations.map((preparation) => registered(`batch1-hil-history-static-t${tag(tempC)}-${preparation}`,
    `${prefix}-${preparation}`, { fraction, cflFill, pressurePa }));
}

const coldTailGroups = [-17.5, -18.5, -19.5, -20.5].flatMap((tempC) =>
  [0.1, 0.15, 0.2].map((fraction) => cold(tempC, fraction, 0.05,
    `cold-tail-t${tag(tempC)}-f${tag(fraction)}`)));

const seedConditions = [-6.5, -9.5].flatMap((tempC) => [0.1, 0.2].map((fraction) => ({ tempC, fraction })))
  .concat([-7.5, -8.5].map((tempC) => ({ tempC, fraction: 0.15 })));
const seedGroups = seedConditions.flatMap(({ tempC, fraction }) =>
  [{ seedRadius: 3, seedThickness: 1 }, { seedRadius: 1, seedThickness: 5 }].map((seed) =>
    arms.map((arm) => registered(
      `batch1-hil-seed-t7-f0p15-r${seed.seedRadius}t${seed.seedThickness}-${arm}`,
      `seed-t${tag(tempC)}-f${tag(fraction)}-r${seed.seedRadius}-h${seed.seedThickness}-${arm}`,
      { tempC, fraction })),
  ));

const historyStepGroups = [-6, -14.4].flatMap((tempC) => [0.1, 0.2].flatMap((fraction) =>
  [7, 11, 15].map((extent) => history(tempC, fraction, extent, 0.025, 101325,
    `history-step-t${tag(tempC)}-to-t${tag(tempC === -6 ? -14.4 : -6)}-f${tag(fraction)}-e${extent}-cfl0p025`))));
const historyStepStaticGroups = [-6, -14.4].flatMap((tempC) => [0.1, 0.2].map((fraction) =>
  staticRows(tempC, fraction, 0.025, 101325, `static-step-t${tag(tempC)}-f${tag(fraction)}-cfl0p025`)));

const pressureHistoryGroups = [-6, -14.4].flatMap((tempC) => [0.1, 0.2].flatMap((fraction) =>
  [7, 15].flatMap((extent) => [50662.5, 202650].map((pressurePa) =>
    history(tempC, fraction, extent, 0.05, pressurePa,
      `pressure-history-t${tag(tempC)}-to-t${tag(tempC === -6 ? -14.4 : -6)}-f${tag(fraction)}-e${extent}-p${tag(pressurePa)}`)))));
const pressureStaticGroups = [-6, -14.4].flatMap((tempC) => [0.1, 0.2].flatMap((fraction) =>
  [50662.5, 202650].map((pressurePa) => staticRows(tempC, fraction, 0.05, pressurePa,
    `pressure-static-t${tag(tempC)}-f${tag(fraction)}-p${tag(pressurePa)}`))));

const coldStepGroups = [cold(-20, 0.125, 0.05, "cold-step-t20-f0p125-cfl0p05"),
  ...[0.1, 0.125, 0.15].map((fraction) => cold(-20, fraction, 0.025,
    `cold-step-t20-f${tag(fraction)}-cfl0p025`))];

const blocks = [coldTailGroups, seedGroups, historyStepGroups, historyStepStaticGroups,
  pressureHistoryGroups, pressureStaticGroups, coldStepGroups];
const interleaved: FirstBatchEntry[] = [];
for (let index = 0; index < Math.max(...blocks.map((block) => block.length)); index++) {
  for (const block of blocks) interleaved.push(...(block[index] ?? []));
}

export const HIL_TWO_DAY_OCT12_ROWS: readonly FirstBatchEntry[] = Object.freeze(interleaved);
export const HIL_TWO_DAY_OCT12: DiscoveryBatchDefinition = Object.freeze({
  id: "hil-two-day-exploration-2026-10-12", launchPrefix: "hil-two-day-oct12",
  rows: HIL_TWO_DAY_OCT12_ROWS, workerCeilings: Object.freeze({ HIL: 12 }),
  representatives: (host: FirstBatchHost) => namedBatchRows(HIL_TWO_DAY_OCT12, host),
});
