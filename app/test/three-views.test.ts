import { describe, expect, it } from "vitest";
import { studyFrame, studyPanes } from "../src/three-views.ts";
import type { DendriteData } from "../src/dendrite-data.ts";

describe("two camera presentation", () => {
  it("places disjoint panes inside desktop, mobile, comparison and exported frames", () => {
    for (const [width, height] of [[1280, 690], [808, 552], [1212, 828], [354, 560], [620, 345]]) {
      const panes = studyPanes(width!, height!), entries = Object.values(panes);
      expect(Object.keys(panes)).toEqual(["top", "detail"]);
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
        expect(panes.detail.top).toBe(0); expect(panes.detail.height).toBe(height!);
      } else {
        expect(panes.detail.width).toBe(width!); expect(panes.detail.top).toBeGreaterThan(panes.top.height);
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
