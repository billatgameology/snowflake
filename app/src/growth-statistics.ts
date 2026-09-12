import { visibleEventCount, type DendriteData } from "./dendrite-data.ts";

export type GrowthGraph = "attached" | "activity" | "reach";
export interface GrowthStatistics {
  counts: Uint32Array;
  reach: Float64Array;
  reachEvents: Uint32Array;
  reachValues: Float64Array;
}

/** Derived recording statistics. Counts are sites/instances, distances are lattice units. */
export function buildGrowthStatistics(data: DendriteData): GrowthStatistics {
  const counts = new Uint32Array(101), reach = new Float64Array(101);
  const reachEvents: number[] = [], reachValues: number[] = [];
  let event = 0, outer = 0;
  for (let bin = 0; bin <= 100; bin++) {
    const end = visibleEventCount(data.ticks, bin / 100 * data.finalTick);
    for (; event < end; event++) {
      const at = event * 3;
      const distance = Math.hypot(data.positions[at]!, data.positions[at + 1]!, data.positions[at + 2]!);
      if (distance > outer) { outer = distance; reachEvents.push(event + 1); reachValues.push(outer); }
    }
    counts[bin] = end; reach[bin] = outer;
  }
  return { counts, reach, reachEvents: new Uint32Array(reachEvents), reachValues: new Float64Array(reachValues) };
}

export function recordingStatsAt(data: Pick<DendriteData, "ticks" | "finalTick">, stats: GrowthStatistics, progress: number) {
  const at = Math.max(0, Math.min(1, progress));
  const attached = visibleEventCount(data.ticks, at * data.finalTick);
  // Compare against the same checkpoint fractions used above: multiplying 0.07 by 100
  // rounds above 7 and would incorrectly move an event at that boundary into interval 8.
  let interval = 1, lastInterval = 100;
  while (interval < lastInterval) {
    const mid = (interval + lastInterval) >>> 1;
    if (at <= mid / 100) lastInterval = mid; else interval = mid + 1;
  }
  let lo = 0, hi = stats.reachEvents.length;
  while (lo < hi) { const mid = (lo + hi) >>> 1; if (stats.reachEvents[mid]! <= attached) lo = mid + 1; else hi = mid; }
  return { attached, activity: at === 0 ? 0 : attached - stats.counts[interval - 1]!, reach: lo ? stats.reachValues[lo - 1]! : 0, interval };
}

export function graphSamples(stats: GrowthStatistics, kind: GrowthGraph): number[] {
  if (kind === "reach") return [...stats.reach];
  if (kind === "attached") return [...stats.counts];
  return [...stats.counts].map((count, index) => index === 0 ? 0 : count - stats.counts[index - 1]!);
}
