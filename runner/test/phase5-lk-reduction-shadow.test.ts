import { describe, expect, it } from "vitest";
import {
  phase5LkDivergenceFloat32,
  reducePhase5LkFloat32,
  runPhase5LkReductionShadow,
} from "../src/phase5-lk-reduction-shadow.ts";

describe("Phase 5 LK f32 reduction shadow", () => {
  it("pins the deterministic 256-lane recursive reduction composition", () => {
    const values = Float32Array.from(
      { length: 513 },
      (_, index) => Math.fround((index % 11) * 1e-4 - 3e-4),
    );
    const first = reducePhase5LkFloat32(values, "sum");
    const second = reducePhase5LkFloat32(values, "sum");
    expect(Object.is(first, second)).toBe(true);
    expect(first).toBe(0.101_199_999_451_637_27);
    expect(reducePhase5LkFloat32(values, "max")).toBe(Math.max(...values));
    expect(reducePhase5LkFloat32(values, "min")).toBe(Math.min(...values));
    expect(() => reducePhase5LkFloat32([], "sum")).toThrow(/nonempty/);
  });

  it("pins the representable zero-exchange divergence branch", () => {
    expect(phase5LkDivergenceFloat32(0, 0, 0)).toBe(0);
    expect(phase5LkDivergenceFloat32(1e-8, 0, 0)).toBe(Infinity);
    expect(phase5LkDivergenceFloat32(0.25, 0.5, 0.75)).toBe(0);
    expect(() => phase5LkDivergenceFloat32(Number.NaN, 0, 1)).toThrow(/finite/);
  });

  it("measures every frozen blocking LK topology before production WGSL exists", () => {
    const report = runPhase5LkReductionShadow();
    expect(report.schema).toBe("phase5-lk-f32-reduction-shadow-v1");
    expect(report.reductionWidth).toBe(256);
    expect(report.fixedPointIterations).toBe(60);
    expect(report.samples).toHaveLength(9);
    expect(report.samples.map((sample) => sample.fixtureId)).toEqual(
      expect.arrayContaining([
        "lk-warm-dirichlet-24x24x18",
        "lk-cold-dirichlet-noise-timeline-18x18x30",
        "lk-reflecting-diagnostic-17x19x15",
      ]),
    );
    expect(report.allSamplesPass).toBe(true);
  });
});
