// Colormap tests (A3-1): perceptual monotonicity survives our interpolation, ranges clamp,
// and no-data is visibly distinct from every ramp color.

import { describe, expect, it } from "vitest";
import {
  NO_DATA_SRGB,
  normalizeToUnit,
  relativeLuminance,
  srgbToLinear,
  viridis,
} from "../src/colormap.ts";

describe("viridis", () => {
  it("clamps t below 0 and above 1 to the endpoints", () => {
    expect(viridis(-5)).toEqual(viridis(0));
    expect(viridis(2)).toEqual(viridis(1));
  });

  it("returns components in [0, 1] across the ramp", () => {
    for (let n = 0; n <= 64; n++) {
      for (const c of viridis(n / 64)) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    }
  });

  it("has strictly increasing relative luminance (perceptually monotone)", () => {
    let previous = -Infinity;
    for (let n = 0; n <= 64; n++) {
      const lum = relativeLuminance(viridis(n / 64));
      expect(lum).toBeGreaterThan(previous);
      previous = lum;
    }
  });

  it("maps NaN to the distinct no-data gray, not a ramp color", () => {
    expect(viridis(Number.NaN)).toEqual([NO_DATA_SRGB[0], NO_DATA_SRGB[1], NO_DATA_SRGB[2]]);
    // The gray must not coincide with any sampled ramp color.
    for (let n = 0; n <= 64; n++) {
      const [r, g, b] = viridis(n / 64);
      const distance = Math.hypot(r - NO_DATA_SRGB[0], g - NO_DATA_SRGB[1], b - NO_DATA_SRGB[2]);
      expect(distance).toBeGreaterThan(0.05);
    }
  });
});

describe("normalizeToUnit", () => {
  it("maps linearly and clamps to [0, 1]", () => {
    expect(normalizeToUnit(0.05, 0, 0.1)).toBeCloseTo(0.5, 12);
    expect(normalizeToUnit(-1, 0, 0.1)).toBe(0);
    expect(normalizeToUnit(99, 0, 0.1)).toBe(1);
  });

  it("returns 0 for degenerate ranges instead of dividing by zero", () => {
    expect(normalizeToUnit(0.5, 1, 1)).toBe(0);
    expect(normalizeToUnit(0.5, 2, 1)).toBe(0);
  });

  it("passes NaN through for the caller's no-data handling", () => {
    expect(normalizeToUnit(Number.NaN, 0, 1)).toBeNaN();
  });
});

describe("srgbToLinear", () => {
  it("fixes the endpoints and stays monotone", () => {
    expect(srgbToLinear(0)).toBe(0);
    expect(srgbToLinear(1)).toBeCloseTo(1, 12);
    let previous = -Infinity;
    for (let n = 0; n <= 32; n++) {
      const lin = srgbToLinear(n / 32);
      expect(lin).toBeGreaterThan(previous);
      previous = lin;
    }
  });
});
