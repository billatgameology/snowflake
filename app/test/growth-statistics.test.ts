import { describe, expect, it } from "vitest";
import type { DendriteData } from "../src/dendrite-data.ts";
import { buildGrowthStatistics, graphSamples, recordingStatsAt } from "../src/growth-statistics.ts";
import { videoFrameProgress } from "../src/growth-video.ts";

const data: DendriteData = { ticks: new Float64Array([0, 0, 10, 25, 50, 50, 99, 100]),
  positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 3, 4, 0, 0, 2, 6, 8, 0, 1, 1, 1, 0, 0, 12, 3, 4, 0]),
  finalTick: 100, radius: 10, extent: 12, vertical: true, eventCount: 8, sourceSha256: "a".repeat(64) };

describe("derived recording graphs", () => {
  it("independently matches prefix counts and maximum distance at every checkpoint", () => {
    const stats = buildGrowthStatistics(data);
    for (let bin = 0; bin <= 100; bin++) {
      const indices = [...data.ticks].flatMap((tick, i) => tick <= bin / 100 * data.finalTick ? [i] : []);
      const distances = indices.map(i => Math.sqrt(data.positions[i * 3]! ** 2 + data.positions[i * 3 + 1]! ** 2 + data.positions[i * 3 + 2]! ** 2));
      expect(stats.counts[bin]).toBe(indices.length);
      expect(stats.reach[bin]).toBeCloseTo(Math.max(0, ...distances), 12);
    }
    expect(graphSamples(stats, "activity").reduce((sum, n) => sum + n, 0)).toBe(data.eventCount - 2);
  });
  it("handles the seed, tied times, current partial intervals, and backward seeks", () => {
    const stats = buildGrowthStatistics(data);
    expect(recordingStatsAt(data, stats, 0)).toEqual({ attached: 2, activity: 0, reach: 1, interval: 1 });
    expect(recordingStatsAt(data, stats, .499)).toEqual({ attached: 4, activity: 0, reach: 5, interval: 50 });
    expect(recordingStatsAt(data, stats, .5)).toEqual({ attached: 6, activity: 2, reach: 10, interval: 50 });
    expect(recordingStatsAt(data, stats, 1)).toEqual({ attached: 8, activity: 1, reach: 12, interval: 100 });
    expect(recordingStatsAt(data, stats, .105)).toEqual({ attached: 3, activity: 0, reach: 5, interval: 11 });
    expect(recordingStatsAt(data, stats, .09).reach).toBe(1);
  });
  it("keeps exact percentage-boundary events in their completed interval", () => {
    const checkpoints = { ...data, finalTick: 1, eventCount: 101,
      ticks: Float64Array.from({ length: 101 }, (_, i) => i / 100), positions: new Float32Array(303) };
    const stats = buildGrowthStatistics(checkpoints);
    for (let bin = 1; bin <= 100; bin++) {
      const now = recordingStatsAt(checkpoints, stats, bin / 100);
      expect(now.interval).toBe(bin); expect(now.activity).toBe(1);
      if (bin < 100) expect(recordingStatsAt(checkpoints, stats, bin / 100 + 1e-10).activity).toBe(0);
    }
  });
  it("uses fractional scene arrivals and transformed positions without deduplicating instances", () => {
    const scene = { ...data, ticks: new Float64Array([0, 12.345, 12.345, 80]), positions: new Float32Array([3, 0, 0, 0, 4, 3, 0, 4, 3, 0, 0, 2]), eventCount: 4 };
    const stats = buildGrowthStatistics(scene);
    expect(recordingStatsAt(scene, stats, .12344).attached).toBe(1);
    expect(recordingStatsAt(scene, stats, .12346)).toEqual({ attached: 3, activity: 2, reach: 5, interval: 13 });
    expect(stats.counts[100]).toBe(4); expect(stats.reach[100]).toBe(5);
  });
});

describe("video frame timeline", () => {
  it("starts at the seed, reaches the complete recording, and holds for the final two seconds", () => {
    for (const seconds of [10, 20, 30]) {
      const frames = Array.from({ length: seconds * 30 }, (_, i) => videoFrameProgress(i, seconds));
      expect(frames[0]).toBe(0); expect(frames.at(-1)).toBe(1);
      expect(frames.filter(value => value === 1)).toHaveLength(60);
      expect(frames[(seconds - 2) * 15]).toBe(.5);
    }
  });
});
