import { describe, expect, it } from "vitest";
import { recentEventRange } from "../src/growth-sculpture.ts";

describe("recent attachment display window", () => {
  const data = { ticks: new Float64Array([0, 0, 20, 40, 40, 60, 80, 100]), finalTick: 100 };
  it("keeps a narrow moving interval, complete same-time groups and no future sites", () => {
    const range = recentEventRange(data, 0.625, 0.25);
    expect([...data.ticks.slice(range.start, range.start + range.count)]).toEqual([40, 40, 60]);
    expect(range.start).toBe(3);
    expect(recentEventRange(data, 0.4, 0.2)).toEqual({ start: 3, count: 2 });
    const later = recentEventRange(data, 0.8, 0.2);
    expect([...data.ticks.slice(later.start, later.start + later.count)]).toEqual([80]);
  });
  it("retains seed/early growth and recomputes cleanly when seeking backwards", () => {
    expect(recentEventRange(data, 0, 0.08)).toEqual({ start: 0, count: 2 });
    expect(recentEventRange(data, 0.08, 0.08)).toEqual({ start: 0, count: 2 });
    expect(recentEventRange(data, 1, 0.24)).toEqual({ start: 6, count: 2 });
    expect(recentEventRange(data, 0.2, 0.08)).toEqual({ start: 2, count: 1 });
  });
});
