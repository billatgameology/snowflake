// Picking readout tests (A3-3): correct quantities (uncapped AND capped counts stated),
// §1.5 Type × Evidence phrasing on every line, no percentages, no physical units.

import { describe, expect, it } from "vitest";
import { GG_PRESETS, cellCount, idx, type Dims } from "@vcc/core";
import { buildPickInfo, formatReadout } from "../src/readout.ts";
import type { OverlayContext } from "../src/overlays.ts";

function fixture(): { ctx: OverlayContext; dims: Dims } {
  const dims: Dims = { nx: 5, ny: 5, nz: 3 };
  const n = cellCount(dims);
  const a = new Uint8Array(n);
  const wall = new Uint8Array(n);
  const b = new Float32Array(n);
  const d = new Float32Array(n);
  const attachTick = new Uint32Array(n);
  // Picked cell (2,2,1): attached, with 4 attached T-neighbors and 2 attached Z-neighbors.
  a[idx(dims, 2, 2, 1)] = 1;
  a[idx(dims, 3, 2, 1)] = 1;
  a[idx(dims, 1, 2, 1)] = 1;
  a[idx(dims, 2, 3, 1)] = 1;
  a[idx(dims, 2, 1, 1)] = 1;
  a[idx(dims, 2, 2, 0)] = 1;
  a[idx(dims, 2, 2, 2)] = 1;
  b[idx(dims, 2, 2, 1)] = 1.5;
  d[idx(dims, 2, 2, 1)] = 0; // attached cells hold no vapor
  d[idx(dims, 3, 3, 1)] = 0.08;
  const ctx: OverlayContext = {
    dims,
    a,
    wall,
    b,
    d,
    attachTick,
    tick: 500,
    ggThreshBeta: GG_PRESETS.plate.ggThreshBeta,
    recencyWindowTicks: 500,
  };
  return { ctx, dims };
}

describe("buildPickInfo", () => {
  it("reports position, fields, and both uncapped and capped neighbor counts", () => {
    const { ctx } = fixture();
    const info = buildPickInfo(ctx, 2, 2, 1, "none");
    expect(info.i).toBe(2);
    expect(info.j).toBe(2);
    expect(info.k).toBe(1);
    expect(info.attached).toBe(true);
    expect(info.wall).toBe(false);
    expect(info.b).toBeCloseTo(1.5, 6);
    expect(info.d).toBe(0);
    expect(info.nTUncapped).toBe(4);
    expect(info.nZUncapped).toBe(2);
    expect(info.nTCapped).toBe(3);
    expect(info.nZCapped).toBe(1);
  });

  it("carries the active overlay's value for the picked cell", () => {
    const { ctx } = fixture();
    const info = buildPickInfo(ctx, 2, 2, 1, "boundaryMass");
    expect(info.overlayName).toBe("boundaryMass");
    expect(info.overlayValue).toBeCloseTo(1.5, 6);
  });
});

describe("formatReadout", () => {
  it("states uncapped vs capped counts explicitly", () => {
    const { ctx } = fixture();
    const text = formatReadout(buildPickInfo(ctx, 2, 2, 1, "none")).join("\n");
    expect(text).toContain("nT 4, nZ 2 (uncapped)");
    expect(text).toContain("nT 3, nZ 1 (capped");
  });

  it("labels every quantity with §1.5 phrasing and never invents units", () => {
    const { ctx } = fixture();
    const lines = formatReadout(buildPickInfo(ctx, 2, 2, 1, "vaporAvailability"));
    const text = lines.join("\n");
    // Every quantity line carries Type/Evidence phrasing.
    expect(text).toContain("computed state");
    expect(text.match(/unvalidated/g)?.length).toBeGreaterThanOrEqual(4);
    expect(text).toContain("model units");
    // No percentages, no physical units.
    expect(text).not.toContain("%");
    for (const unit of ["µm", "micron", "second", " K ", "°C", "m/s"]) {
      expect(text).not.toContain(unit);
    }
  });

  it("includes the overlay line only when an overlay is active", () => {
    const { ctx } = fixture();
    const withOverlay = formatReadout(buildPickInfo(ctx, 2, 2, 1, "boundaryMass")).join("\n");
    const without = formatReadout(buildPickInfo(ctx, 2, 2, 1, "none")).join("\n");
    expect(withOverlay).toContain("overlay boundary mass b = 1.5000");
    expect(without).not.toContain("overlay");
  });

  it("prints NaN quantities as explicitly undefined", () => {
    const { ctx } = fixture();
    // vaporAvailability of a fully-enclosed cell is NaN — force it via a lone wall cell.
    const info = buildPickInfo(ctx, 2, 2, 1, "growthPropensity");
    // The picked cell's free neighbors all have b = 0 -> progress 0, still finite; check the
    // formatter's NaN path directly instead.
    const nanInfo = { ...info, overlayValue: Number.NaN };
    const text = formatReadout(nanInfo).join("\n");
    expect(text).toContain("undefined (NaN)");
  });
});
