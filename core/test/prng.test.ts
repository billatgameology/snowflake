import { describe, expect, it } from "vitest";
import { hashCounter, randomBit, randomUnit } from "@vcc/core";

describe("counter-based PRNG", () => {
  it("is a pure function of the tuple", () => {
    expect(hashCounter(1, 2, 3, 4)).toBe(hashCounter(1, 2, 3, 4));
    expect(randomUnit(7, 100, 5, 1)).toBe(randomUnit(7, 100, 5, 1));
  });

  it("matches golden values (bitwise determinism across engines/processes)", () => {
    // These pin the algorithm. If they change, every recorded noise-on run is invalidated.
    expect(hashCounter(0, 0, 0, 0)).toBe(3644920907);
    expect(hashCounter(42, 123456, 9999, 1)).toBe(3970711487);
    expect(hashCounter(1, 2, 3, 4)).toBe(3568513587);
    expect(hashCounter(42, 0, 0, 0)).not.toBe(hashCounter(43, 0, 0, 0));
  });

  it("does not depend on evaluation order (no hidden stream state)", () => {
    const tuples: Array<[number, number, number, number]> = [];
    for (let c = 0; c < 50; c++) tuples.push([9, c, c * 3, c % 4]);
    const forward = tuples.map((t) => hashCounter(...t));
    const backward = [...tuples].reverse().map((t) => hashCounter(...t));
    backward.reverse();
    expect(backward).toEqual(forward);
  });

  it("separates cells, ticks and streams", () => {
    const base = hashCounter(5, 10, 20, 0);
    expect(hashCounter(5, 11, 20, 0)).not.toBe(base);
    expect(hashCounter(5, 10, 21, 0)).not.toBe(base);
    expect(hashCounter(5, 10, 20, 1)).not.toBe(base);
  });

  it("produces roughly fair bits", () => {
    let ones = 0;
    const n = 100_000;
    for (let c = 0; c < n; c++) ones += randomBit(1234, c, 0, 1);
    expect(ones / n).toBeGreaterThan(0.49);
    expect(ones / n).toBeLessThan(0.51);
  });

  it("randomUnit stays in [0, 1)", () => {
    for (let c = 0; c < 1000; c++) {
      const u = randomUnit(77, c, 3, 2);
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
    }
  });
});
