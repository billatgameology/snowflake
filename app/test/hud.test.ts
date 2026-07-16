// Depletion HUD pure-part tests (A3-4): series maintenance and sparkline mapping.

import { describe, expect, it } from "vitest";
import { polylinePoints, pushSample, referenceLineY, type RatioSample } from "../src/hud.ts";

describe("pushSample", () => {
  it("appends tick-monotone samples and skips repeated ticks (forced snapshots)", () => {
    const series: RatioSample[] = [];
    pushSample(series, 100, 0.8, 10);
    pushSample(series, 100, 0.7, 10); // same tick: skipped
    pushSample(series, 90, 0.6, 10); // older tick: skipped
    pushSample(series, 200, 0.6, 10);
    expect(series).toEqual([
      { tick: 100, ratio: 0.8 },
      { tick: 200, ratio: 0.6 },
    ]);
  });

  it("records non-finite ratios as NaN gaps rather than dropping the sample", () => {
    const series: RatioSample[] = [];
    pushSample(series, 1, Number.POSITIVE_INFINITY, 10);
    pushSample(series, 2, Number.NaN, 10);
    expect(series).toHaveLength(2);
    expect(series[0].ratio).toBeNaN();
    expect(series[1].ratio).toBeNaN();
  });

  it("bounds the series length, dropping the oldest samples", () => {
    const series: RatioSample[] = [];
    for (let t = 1; t <= 8; t++) pushSample(series, t, t / 10, 5);
    expect(series).toHaveLength(5);
    expect(series[0].tick).toBe(4);
    expect(series[4].tick).toBe(8);
  });
});

describe("polylinePoints", () => {
  it("returns [] for an empty series", () => {
    expect(polylinePoints([], 100, 50, 1.5)).toEqual([]);
  });

  it("maps the tick range across the width and the ratio range across the height", () => {
    const series: RatioSample[] = [
      { tick: 100, ratio: 0 },
      { tick: 200, ratio: 1.5 },
    ];
    const points = polylinePoints(series, 100, 50, 1.5);
    expect(points[0]).toEqual([0, 50]); // ratio 0 at the bottom
    expect(points[1]).toEqual([100, 0]); // ratio yMax at the top
  });

  it("clamps ratios above yMax (layer-nucleation spikes peg at the top)", () => {
    const series: RatioSample[] = [
      { tick: 0, ratio: 13.5 },
      { tick: 10, ratio: 0.75 },
    ];
    const points = polylinePoints(series, 100, 60, 1.5);
    expect(points[0]).toEqual([0, 0]);
    expect(points[1]?.[1]).toBeCloseTo(60 * (1 - 0.75 / 1.5), 10);
  });

  it("emits null for NaN samples so the sparkline shows honest gaps", () => {
    const series: RatioSample[] = [
      { tick: 0, ratio: 0.5 },
      { tick: 10, ratio: Number.NaN },
      { tick: 20, ratio: 0.4 },
    ];
    const points = polylinePoints(series, 100, 60, 1.5);
    expect(points[1]).toBeNull();
    expect(points[0]).not.toBeNull();
    expect(points[2]).not.toBeNull();
  });
});

describe("referenceLineY", () => {
  it("places ratio = 1 under the same mapping as the series", () => {
    expect(referenceLineY(60, 1.5, 1)).toBeCloseTo(60 * (1 - 1 / 1.5), 10);
    expect(referenceLineY(60, 1.5, 0)).toBe(60);
    expect(referenceLineY(60, 1.5, 99)).toBe(0);
  });
});
