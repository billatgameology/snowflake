import { describe, expect, it } from "vitest";
import { GG_PRESETS } from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";
import { encodePGM, occupancyTopDownPGM, propensitySlicePGM, vaporSlicePGM } from "../src/pgm.ts";

describe("PGM encoding", () => {
  it("writes a valid P5 header and clamps values", () => {
    const bytes = encodePGM(3, 2, new Float64Array([0, 0.5, 1, -1, 2, 0.25]), 0, 1, "test");
    const text = new TextDecoder().decode(bytes);
    expect(text.startsWith("P5\n# test\n3 2\n255\n")).toBe(true);
    const headerLength = "P5\n# test\n3 2\n255\n".length;
    expect(bytes.length).toBe(headerLength + 6);
    expect(bytes[headerLength + 0]).toBe(0);
    expect(bytes[headerLength + 1]).toBe(128);
    expect(bytes[headerLength + 2]).toBe(255);
    expect(bytes[headerLength + 3]).toBe(0); // clamped
    expect(bytes[headerLength + 4]).toBe(255); // clamped
  });

  it("field dumps have the right dimensions on a live solver", () => {
    const solver = new GGSolver({
      dims: { nx: 20, ny: 18, nz: 10 },
      params: GG_PRESETS.plate,
      rngSeed: 1,
    });
    for (let t = 0; t < 50; t++) solver.step();
    const kc = solver.center[2];
    for (const image of [
      vaporSlicePGM(solver, kc),
      propensitySlicePGM(solver, kc),
      occupancyTopDownPGM(solver),
    ]) {
      const text = new TextDecoder().decode(image.subarray(0, 200));
      expect(text.startsWith("P5\n")).toBe(true);
      expect(text).toContain("20 18");
    }
  });
});
