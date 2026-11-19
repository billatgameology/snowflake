import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import { namedBatchRows, type DiscoveryBatchDefinition, type FirstBatchEntry,
  type FirstBatchHost } from "./hil-bld-batch-roster.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";
import type { DiscoveryRetainedObservations } from "./discovery-retained-observations.ts";

const tag = (value: number) => String(Math.abs(value)).replace(".", "p");
const common = Object.freeze({ conditional: false, lane: "cavity-mechanism" as const,
  paramSet: "M1" as const, dimsN: 64, dxUm: .35, targetExtent: 29, maxSteps: 100000,
  spatialSampleExtents: Object.freeze([5, 9, 13, 17, 21, 25]) });
const supplies = [{ fraction: .05, cutoff: 8 }, { fraction: .10, cutoff: 3 }] as const;
const anchors = [-4.5, -5] as const;
const transferTemperatures = [-3.5, -4, -5.5, -6] as const;
type Block = "a" | "b" | "c" | "d";
function entry(block: Block, tempC: number, fraction: number, cutoffSeconds: number,
  width: number, seedRadius = 2, seedThickness = 1, pressurePa = 101325,
  cflFill = .0125): FirstBatchEntry {
  const pressureTag = pressurePa === 50662.5 ? "half" : pressurePa === 202650 ? "double" : "normal";
  return Object.freeze({ host: "HIL", track: "warm-history", row: Object.freeze({
    ...common,
    id: `ex18-hil-${block}-t${tag(tempC)}-f${tag(fraction)}-p${pressureTag}-r${seedRadius}-h${seedThickness}-w${width}-s${tag(cutoffSeconds)}`,
    tempC, fraction, pressurePa, cflFill, seedRadius, seedThickness,
    experimentalBasalWidthCells: width,
    sigmaInfinity: phase6SigmaWaterFromTable(tempC) * fraction,
    experimentalBasalWidthHistory: Object.freeze({ mode: "early-only" as const, cutoffSeconds }),
  }) });
}

const blocks: Record<Block, FirstBatchEntry[]> = { a: [], b: [], c: [], d: [] };
for (const tempC of anchors) for (const { fraction, cutoff } of supplies)
  for (const pressure of [50662.5, 202650]) for (const width of [3, 4])
    for (const multiplier of [.5, 1.5, 2])
      blocks.a.push(entry("a", tempC, fraction, cutoff * multiplier, width, 2, 1, pressure));
for (const tempC of anchors) for (const { fraction, cutoff } of supplies)
  for (const [radius, thickness] of [[2, 3], [3, 1]]) for (const width of [3, 4])
    for (const multiplier of [1, 1.5, 2])
      blocks.b.push(entry("b", tempC, fraction, cutoff * multiplier, width, radius, thickness));
for (const tempC of anchors) for (const { fraction, cutoff } of supplies)
  for (const width of [3, 4]) for (const multiplier of [1.5, 2])
    blocks.b.push(entry("b", tempC, fraction, cutoff * multiplier, width));
for (const tempC of transferTemperatures) for (const { fraction, cutoff } of supplies)
  for (const width of [3, 4]) for (const multiplier of [.5, 1, 1.5, 2])
    blocks.c.push(entry("c", tempC, fraction, cutoff * multiplier, width));
for (const tempC of transferTemperatures) for (const { fraction, cutoff } of supplies)
  for (const width of [3, 4])
    blocks.d.push(entry("d", tempC, fraction, cutoff, width, 2, 1, 101325, .00625));

// Four-row chunks bring all questions into the first sixteen dispatch slots.
const interleaved: FirstBatchEntry[] = [];
for (let offset = 0; offset < Math.max(...Object.values(blocks).map((rows) => rows.length)); offset += 4)
  for (const block of ["a", "b", "c", "d"] as const)
    interleaved.push(...blocks[block].slice(offset, offset + 4));
export const HIL_EXPLORATION_NOV18_ROWS: readonly FirstBatchEntry[] = Object.freeze(interleaved);
export const HIL_EXPLORATION_NOV18: DiscoveryBatchDefinition = Object.freeze({
  id: "hil-exploration-2026-11-18", launchPrefix: "hil-exploration-nov18",
  rows: HIL_EXPLORATION_NOV18_ROWS, workerCeilings: Object.freeze({ HIL: 16 }),
  representatives: (host: FirstBatchHost) => namedBatchRows(HIL_EXPLORATION_NOV18, host),
});

/** Observation-only settings retain exact switch brackets outside rolling restart generations. */
export function explorationObservations(row: DiscoveryRow): DiscoveryRetainedObservations {
  return Object.freeze({ ageSeconds: Object.freeze([1, 1.5, 2, 2.5, 3, 4, 4.5, 5, 6, 8, 10, 12, 16, 20]),
    widthHistorySwitch: row.experimentalBasalWidthHistory?.mode === "early-only",
    centralAttachments: Object.freeze({ maxHexRadiusCells: 1,
      absoluteZOffsets: Object.freeze([Math.floor(row.seedThickness / 2) + 1]) }),
  });
}
