import { describe, expect, it } from "vitest";
import {
  GG_PRESETS,
  paramSlot,
  paramVector,
  validateParams,
  type GGParams,
} from "@vcc/core";

describe("param vectors", () => {
  it("slot layout is n_T*2 + n_Z with slot 0 unused", () => {
    expect(paramSlot(0, 1)).toBe(1);
    expect(paramSlot(1, 0)).toBe(2);
    expect(paramSlot(3, 1)).toBe(7);
  });

  it("poisons the unused (0,0) slot with NaN", () => {
    const v = GG_PRESETS.plate.ggThreshBeta;
    expect(Number.isNaN(v[0])).toBe(true);
  });

  it("requires all 7 configurations", () => {
    expect(() => paramVector({ "0,1": 1 })).toThrow();
    expect(() => paramVector({ "0,0": 1 } as never)).toThrow();
  });
});

describe("published presets (gg-machinery §8)", () => {
  it("all four pass the hard bounds (Packard, growth stall) with zero errors", () => {
    for (const name of ["plate", "needle", "hollowColumn", "dendrite"] as const) {
      const result = validateParams(GG_PRESETS[name]);
      expect(result.errors, `${name}: ${result.errors.join("; ")}`).toHaveLength(0);
    }
  });

  it("hollowColumn raises exactly two monotonicity warnings, both into slot (3,1)", () => {
    const result = validateParams(GG_PRESETS.hollowColumn);
    expect(result.warnings).toHaveLength(2);
    for (const w of result.warnings) expect(w).toContain("(3,1)");
    expect(result.warnings[0]).toContain("ggThreshBeta");
    expect(result.warnings[1]).toContain("ggThreshBeta");
  });

  it("plate and dendrite raise no warnings; needle raises one at (0,1)->(1,1)", () => {
    // Observed property of the published values, recorded so a silent preset edit is loud:
    // needle has ggThreshBeta(1,1) = 4 > ggThreshBeta(0,1) = 2.
    expect(validateParams(GG_PRESETS.plate).warnings).toHaveLength(0);
    expect(validateParams(GG_PRESETS.dendrite).warnings).toHaveLength(0);
    const needle = validateParams(GG_PRESETS.needle);
    expect(needle.warnings).toHaveLength(1);
    expect(needle.warnings[0]).toContain("(0,1)");
    expect(needle.warnings[0]).toContain("(1,1)");
  });
});

describe("validator hard bounds", () => {
  function withRho(p: GGParams, rho: number): GGParams {
    return { ...p, rho };
  }

  it("flags the Packard regime as an error", () => {
    // (1 - 0.1) * 3 = 2.7 >= ggThreshBeta_01 = 2.5 -> Packard runaway possible
    const result = validateParams(withRho(GG_PRESETS.plate, 3));
    expect(result.errors.some((e) => e.includes("Packard"))).toBe(true);
  });

  it("flags growth stall as an error", () => {
    const p = GG_PRESETS.plate;
    const mu = Float64Array.from(p.mu);
    mu[paramSlot(0, 1)] = 0.99; // drain 0.99*2.5 >> supply 0.09
    const result = validateParams({ ...p, mu });
    expect(result.errors.some((e) => e.includes("growth-stall"))).toBe(true);
  });

  it("flags out-of-range values", () => {
    const p = GG_PRESETS.plate;
    const kappa = Float64Array.from(p.kappa);
    kappa[paramSlot(1, 0)] = 1.5;
    expect(validateParams({ ...p, kappa }).errors.length).toBeGreaterThan(0);
  });
});
