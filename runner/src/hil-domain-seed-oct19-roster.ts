import { FIRST_BATCH_ROWS, namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry,
  type FirstBatchHost } from "./hil-bld-batch-roster.ts";
import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

const samples = Object.freeze([5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27]);
const tag = (value: number): string => String(Math.abs(value)).replace(".", "p");

/** Change only the domain or timestep operands registered in the October 19 protocol. */
function registered(templateId: string, suffix: string, changes: Partial<DiscoveryRow>): FirstBatchEntry {
  const template = FIRST_BATCH_ROWS.find(({ row }) => row.id === templateId);
  if (template === undefined) throw new Error(`missing October 19 template: ${templateId}`);
  const changed = { ...template.row, ...changes };
  return Object.freeze({ ...template, host: "HIL", row: Object.freeze({
    ...changed, id: `oct19-hil-${suffix}`, targetExtent: 29, spatialSampleExtents: samples,
    sigmaInfinity: phase6SigmaWaterFromTable(changed.tempC) * changed.fraction,
  }) });
}

const cold = ["both", "neither", "basal-only", "prism-only"].map((arm) => registered(
  `batch1-bld-cold-t14p4-f0p1-${arm}`, `cold-domain-t14p4-f0p1-n96-${arm}`, { dimsN: 96 },
));
const seed = [-6.5, -9.5].flatMap((tempC) =>
  [{ seedRadius: 3, seedThickness: 1 }, { seedRadius: 1, seedThickness: 5 }].flatMap((shape) =>
    ["both", "neither"].map((arm) => registered(
      `batch1-hil-seed-t7-f0p15-r${shape.seedRadius}t${shape.seedThickness}-${arm}`,
      `seed-step-t${tag(tempC)}-f0p15-r${shape.seedRadius}-h${shape.seedThickness}-cfl0p025-${arm}`,
      { tempC, cflFill: 0.025 },
    )),
  ),
);

export const HIL_DOMAIN_SEED_OCT19_ROWS: readonly FirstBatchEntry[] = Object.freeze([...cold, ...seed]);
export const HIL_DOMAIN_SEED_OCT19: DiscoveryBatchDefinition = Object.freeze({
  id: "hil-domain-seed-2026-10-19", launchPrefix: "hil-domain-seed-oct19",
  rows: HIL_DOMAIN_SEED_OCT19_ROWS, workerCeilings: Object.freeze({ HIL: 12 }),
  representatives: (host: FirstBatchHost) => namedBatchRows(HIL_DOMAIN_SEED_OCT19, host),
});
