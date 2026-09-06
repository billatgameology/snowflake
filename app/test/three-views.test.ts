import { describe, expect, it } from "vitest";
import { Euler, Vector3 } from "three";
import { studyFrame, studyPanes, profileHalfHeight } from "../src/three-views.ts";
import type { DendriteData } from "../src/dendrite-data.ts";

describe("three camera presentation", () => {
  it("places disjoint panes inside desktop, mobile, comparison and exported frames", () => {
    for (const [width, height] of [[1280, 690], [808, 552], [1212, 828], [354, 560], [620, 345]]) {
      const panes = studyPanes(width!, height!), entries = Object.values(panes);
      for (const box of entries) {
        expect(box.left).toBeGreaterThanOrEqual(0); expect(box.top).toBeGreaterThanOrEqual(0);
        expect(box.left + box.width).toBeLessThanOrEqual(width!); expect(box.top + box.height).toBeLessThanOrEqual(height!);
        expect(box.width).toBeGreaterThan(0); expect(box.height).toBeGreaterThan(0);
      }
      for (let i = 0; i < entries.length; i++) for (const b of entries.slice(i + 1)) {
        const a = entries[i]!;
        expect(a.left + a.width <= b.left || b.left + b.width <= a.left || a.top + a.height <= b.top || b.top + b.height <= a.top).toBe(true);
      }
      if (width! > 480) {
        expect(panes.detail.left).toBeGreaterThan(panes.top.left);
        expect(panes.detail.top).toBeGreaterThan(panes.profile.top);
      }
    }
  });
  it("keeps every rotated box corner inside the low-angle camera across aspect ratios", () => {
    for (const size of [[150, 130, 4], [8, 8, 200], [150, 150, 150]]) {
      for (const tilt of [0, .95, 1.15, 2.35]) for (const yaw of [-2, .5, 3]) for (const aspect of [.6, 1.3, 2.5]) {
        const halfHeight = profileHalfHeight(size, tilt, yaw, aspect);
        for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
          const p = new Vector3(x * size[0]!, y * size[1]!, z * size[2]!).applyEuler(new Euler(tilt, 0, yaw));
          expect(Math.abs(p.x)).toBeLessThan(halfHeight * aspect); expect(Math.abs(p.y)).toBeLessThan(halfHeight);
        }
      }
    }
  });
  it("anchors detail to an actual recorded site and leaves the coordinates untouched", () => {
    const positions = new Float32Array([-10, -10, -2, 10, 10, 2, 5, 0, 1, 0, 0, -1]);
    const original = positions.slice();
    const data = { positions, vertical: false } as DendriteData;
    const frame = studyFrame(data);
    expect(frame.center).toEqual([0, 0, 0]); expect(frame.detail).toEqual([5, 0, 1]);
    expect(positions).toEqual(original); expect(studyFrame(data)).toEqual(frame);
  });
});
