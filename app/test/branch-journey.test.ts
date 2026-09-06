import { describe, expect, it } from "vitest";
import { buildBranchJourney, journeyPose } from "../src/branch-journey.ts";
import type { DendriteData } from "../src/dendrite-data.ts";

const data: DendriteData = {
  positions: new Float32Array([0, 0, 0, 25, 0, 0, 50, 0, 0, 75, 0, 0, 100, 0, 0, 500, 1000, 0]),
  ticks: new Float64Array([0, 25, 50, 75, 100, 100]), finalTick: 100, eventCount: 6,
  radius: 100, extent: 100, vertical: false, sourceSha256: "a".repeat(64),
};
const frame = { center: [0, 0, 0] as [number, number, number], detail: [56, 0, 0] as [number, number, number], halfSize: [100, 100, 0] as [number, number, number] };

describe("recording-driven branch camera journey", () => {
  it("follows the selected branch and ignores a farther point outside its cone", () => {
    const original = data.positions.slice(), ticks = data.ticks.slice();
    const path = buildBranchJourney(data, frame);
    expect([...path.tips.slice(-3)]).toEqual([100, 0, 0]);
    expect(path.tips[128 * 3]).toBeGreaterThanOrEqual(25); expect(path.tips[128 * 3]).toBeLessThanOrEqual(50);
    expect(data.positions).toEqual(original); expect(data.ticks).toEqual(ticks);
  });
  it("zooms into the center, travels outward and completes one orbit at the tip", () => {
    const path = buildBranchJourney(data, frame);
    expect(journeyPose(path, 0).center).toEqual([0, 0, 0]);
    expect(journeyPose(path, .24).span).toBeLessThan(journeyPose(path, 0).span / 5);
    expect(journeyPose(path, .5).center[0]).toBeGreaterThan(journeyPose(path, .24).center[0]!);
    expect(journeyPose(path, 1).center).toEqual([100, 0, 0]);
    expect(journeyPose(path, 1).yaw - journeyPose(path, .68).yaw).toBeCloseTo(Math.PI * 2, 12);
    expect(journeyPose(path, .1).stage).toBe("ZOOM INTO THE CENTER");
    expect(journeyPose(path, .5).stage).toBe("FOLLOW THE BRANCH");
    expect(journeyPose(path, .9).stage).toBe("CIRCLE THE TIP");
  });
  it("has continuous phase seams and reproduces the same pose after backward seeking", () => {
    const path = buildBranchJourney(data, frame), before = journeyPose(path, .42);
    journeyPose(path, 1); expect(journeyPose(path, .42)).toEqual(before);
    for (const boundary of [.22, .24, .68]) {
      const a = journeyPose(path, boundary - 1e-6), b = journeyPose(path, boundary + 1e-6);
      expect(Math.abs(a.span - b.span)).toBeLessThan(.001);
      expect(Math.abs(a.yaw - b.yaw)).toBeLessThan(.001);
      expect(Math.abs(a.tilt - b.tilt)).toBeLessThan(.001);
      a.center.forEach((value, axis) => expect(Math.abs(value - b.center[axis]!)).toBeLessThan(.001));
    }
  });
});
