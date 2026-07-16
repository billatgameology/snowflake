// Overlay quantity tests (A3-1): hand-built lattice fixtures with exact expected values,
// including capped-vs-uncapped neighbor counts and wall exclusion.

import { describe, expect, it } from "vitest";
import { GG_PRESETS, cellCount, idx, paramSlot, type Dims } from "@vcc/core";
import {
  OVERLAY_LABELS,
  attachedNeighborCountsUncapped,
  capForParamSlot,
  overlayValueAt,
  overlayValuesFor,
  type OverlayContext,
} from "../src/overlays.ts";

function makeContext(dims: Dims, recencyWindowTicks = 500): {
  ctx: OverlayContext;
  a: Uint8Array;
  wall: Uint8Array;
  b: Float32Array;
  d: Float32Array;
  attachTick: Uint32Array;
} {
  const n = cellCount(dims);
  const a = new Uint8Array(n);
  const wall = new Uint8Array(n);
  const b = new Float32Array(n);
  const d = new Float32Array(n);
  const attachTick = new Uint32Array(n);
  const ctx: OverlayContext = {
    dims,
    a,
    wall,
    b,
    d,
    attachTick,
    tick: 1000,
    ggThreshBeta: GG_PRESETS.plate.ggThreshBeta,
    recencyWindowTicks,
  };
  return { ctx, a, wall, b, d, attachTick };
}

describe("attachedNeighborCountsUncapped", () => {
  it("counts all T and Z attached neighbors WITHOUT capping", () => {
    const dims: Dims = { nx: 5, ny: 5, nz: 3 };
    const { ctx, a } = makeContext(dims);
    // 4 T-neighbors and both Z-neighbors of (2,2,1) attached.
    a[idx(dims, 3, 2, 1)] = 1;
    a[idx(dims, 1, 2, 1)] = 1;
    a[idx(dims, 2, 3, 1)] = 1;
    a[idx(dims, 2, 1, 1)] = 1;
    a[idx(dims, 2, 2, 0)] = 1;
    a[idx(dims, 2, 2, 2)] = 1;
    expect(attachedNeighborCountsUncapped(ctx.a, dims, 2, 2, 1)).toEqual([4, 2]);
  });

  it("respects domain bounds (corner cell)", () => {
    const dims: Dims = { nx: 3, ny: 3, nz: 2 };
    const { ctx, a } = makeContext(dims);
    a[idx(dims, 1, 0, 0)] = 1; // east of corner (0,0,0)
    a[idx(dims, 0, 0, 1)] = 1; // above it
    expect(attachedNeighborCountsUncapped(ctx.a, dims, 0, 0, 0)).toEqual([1, 1]);
  });
});

describe("capForParamSlot", () => {
  it("caps exactly as GGSolver does: nT <= 3, nZ <= 1", () => {
    expect(capForParamSlot(0, 0)).toEqual([0, 0]);
    expect(capForParamSlot(4, 2)).toEqual([3, 1]);
    expect(capForParamSlot(6, 1)).toEqual([3, 1]);
    expect(capForParamSlot(2, 0)).toEqual([2, 0]);
  });
});

describe("overlayValueAt — vaporAvailability", () => {
  it("means d over free neighbors, excluding attached and wall cells", () => {
    const dims: Dims = { nx: 5, ny: 5, nz: 3 };
    const { ctx, a, wall, d } = makeContext(dims);
    a[idx(dims, 2, 2, 1)] = 1; // the surface cell itself
    // One wall neighbor with a poisoned value that must NOT be counted.
    wall[idx(dims, 2, 3, 1)] = 1;
    d[idx(dims, 2, 3, 1)] = 0.99;
    // The 7 remaining free neighbors (5 in-plane + 2 vertical).
    d[idx(dims, 3, 2, 1)] = 0.06;
    d[idx(dims, 1, 2, 1)] = 0.02;
    d[idx(dims, 2, 1, 1)] = 0.04;
    d[idx(dims, 3, 1, 1)] = 0.08;
    d[idx(dims, 1, 3, 1)] = 0;
    d[idx(dims, 2, 2, 0)] = 0.1;
    d[idx(dims, 2, 2, 2)] = 0.12;
    const mean = (0.06 + 0.02 + 0.04 + 0.08 + 0 + 0.1 + 0.12) / 7;
    expect(overlayValueAt("vaporAvailability", ctx, 2, 2, 1)).toBeCloseTo(mean, 6);
  });

  it("is NaN when every neighbor is attached or wall", () => {
    const dims: Dims = { nx: 3, ny: 3, nz: 1 };
    const { ctx, a, wall } = makeContext(dims);
    a[idx(dims, 1, 1, 0)] = 1;
    wall.fill(1);
    wall[idx(dims, 1, 1, 0)] = 0;
    expect(overlayValueAt("vaporAvailability", ctx, 1, 1, 0)).toBeNaN();
  });
});

describe("overlayValueAt — growthPropensity", () => {
  it("takes the max b/ggThreshBeta over adjacent boundary sites (plate preset)", () => {
    const dims: Dims = { nx: 5, ny: 5, nz: 3 };
    const { ctx, a, b } = makeContext(dims);
    a[idx(dims, 2, 2, 1)] = 1; // the attached surface cell
    // Free neighbor east: only attached neighbor is our cell -> (nT,nZ)=(1,0), thresh 2.
    b[idx(dims, 3, 2, 1)] = 1.0; // progress 0.5
    // Free neighbor south-ish (2,1): make it (2,0) via a second attached cell.
    a[idx(dims, 1, 1, 1)] = 1;
    b[idx(dims, 2, 1, 1)] = 0.3; // (nT,nZ)=(2,0), thresh 2 -> 0.15
    const expectedEast = 1.0 / GG_PRESETS.plate.ggThreshBeta[paramSlot(1, 0)];
    expect(overlayValueAt("growthPropensity", ctx, 2, 2, 1)).toBeCloseTo(expectedEast, 6);
  });

  it("caps nZ at 1: a site between two attached layers uses slot (0,1)", () => {
    const dims: Dims = { nx: 5, ny: 5, nz: 5 };
    const { ctx, a, b } = makeContext(dims);
    a[idx(dims, 2, 2, 1)] = 1;
    a[idx(dims, 2, 2, 3)] = 1;
    // The sandwiched free cell has nZ = 2 uncapped -> capped (0,1), plate thresh 2.5.
    b[idx(dims, 2, 2, 2)] = 2.5;
    // Evaluated at the attached cell below; its only free neighbor with b > 0 is (2,2,2).
    // An uncapped slot lookup would hit paramSlot(0,2) = slot 2 = (1,0) with thresh 2
    // (progress 1.25) — the exact conflation this test exists to catch.
    expect(overlayValueAt("growthPropensity", ctx, 2, 2, 1)).toBeCloseTo(1.0, 6);
  });

  it("caps nT at 3: a site with 4 attached in-plane neighbors uses slot (3, nZ)", () => {
    const dims: Dims = { nx: 5, ny: 5, nz: 3 };
    const { ctx, a, b } = makeContext(dims);
    // Free cell (2,2,1) surrounded by 4 attached T-neighbors.
    a[idx(dims, 3, 2, 1)] = 1;
    a[idx(dims, 1, 2, 1)] = 1;
    a[idx(dims, 2, 3, 1)] = 1;
    a[idx(dims, 2, 1, 1)] = 1;
    b[idx(dims, 2, 2, 1)] = 0.5; // capped slot (3,0), plate thresh 1 -> progress 0.5
    const value = overlayValueAt("growthPropensity", ctx, 3, 2, 1);
    expect(value).toBeCloseTo(0.5, 6);
  });

  it("ignores wall neighbors entirely", () => {
    const dims: Dims = { nx: 5, ny: 5, nz: 3 };
    const { ctx, a, wall, b } = makeContext(dims);
    a[idx(dims, 2, 2, 1)] = 1;
    wall[idx(dims, 3, 2, 1)] = 1;
    b[idx(dims, 3, 2, 1)] = 99; // poisoned wall value
    b[idx(dims, 1, 2, 1)] = 0.4; // (1,0), thresh 2 -> 0.2
    expect(overlayValueAt("growthPropensity", ctx, 2, 2, 1)).toBeCloseTo(0.2, 6);
  });
});

describe("overlayValueAt — boundaryMass and growthRecency", () => {
  it("boundaryMass reads the cell's own b", () => {
    const dims: Dims = { nx: 3, ny: 3, nz: 1 };
    const { ctx, a, b } = makeContext(dims);
    a[idx(dims, 1, 1, 0)] = 1;
    b[idx(dims, 1, 1, 0)] = 1.75;
    expect(overlayValueAt("boundaryMass", ctx, 1, 1, 0)).toBeCloseTo(1.75, 6);
  });

  it("growthRecency: 1 at attach tick, linear to 0 across the window, seed reads 0", () => {
    const dims: Dims = { nx: 3, ny: 3, nz: 1 };
    const { ctx, attachTick } = makeContext(dims, 500); // ctx.tick = 1000
    const x = idx(dims, 1, 1, 0);
    attachTick[x] = 1000;
    expect(overlayValueAt("growthRecency", ctx, 1, 1, 0)).toBeCloseTo(1, 6);
    attachTick[x] = 750;
    expect(overlayValueAt("growthRecency", ctx, 1, 1, 0)).toBeCloseTo(0.5, 6);
    attachTick[x] = 400; // age 600 > window 500
    expect(overlayValueAt("growthRecency", ctx, 1, 1, 0)).toBe(0);
    attachTick[x] = 0; // seed
    expect(overlayValueAt("growthRecency", ctx, 1, 1, 0)).toBe(0);
  });
});

describe("OVERLAY_LABELS — §1.5 Type and unit accuracy (external review should-fix)", () => {
  it("claims 'model units' only for quantities that carry them (d and b)", () => {
    expect(OVERLAY_LABELS.vaporAvailability.definition).toContain("model units");
    expect(OVERLAY_LABELS.boundaryMass.definition).toContain("model units");
    // Propensity is a unitless fraction of the threshold; recency is unitless over a
    // model-tick window — neither may claim bare "model units".
    expect(OVERLAY_LABELS.growthPropensity.definition).toContain("unitless fraction");
    expect(OVERLAY_LABELS.growthPropensity.definition).toContain("phenomenological");
    expect(OVERLAY_LABELS.growthPropensity.definition).not.toContain("model units");
    expect(OVERLAY_LABELS.growthRecency.definition).toContain("unitless");
    expect(OVERLAY_LABELS.growthRecency.definition).toContain("model ticks");
    expect(OVERLAY_LABELS.growthRecency.definition).toContain("derived metric");
  });

  it("every quantity label carries Evidence = unvalidated and no percentages", () => {
    for (const name of ["vaporAvailability", "growthPropensity", "boundaryMass", "growthRecency"] as const) {
      expect(OVERLAY_LABELS[name].definition).toContain("unvalidated");
      expect(OVERLAY_LABELS[name].definition).not.toContain("%");
    }
  });
});

describe("overlayValuesFor", () => {
  it("matches overlayValueAt for every listed cell", () => {
    const dims: Dims = { nx: 5, ny: 5, nz: 3 };
    const { ctx, a, b, d } = makeContext(dims);
    a[idx(dims, 2, 2, 1)] = 1;
    a[idx(dims, 3, 2, 1)] = 1;
    b[idx(dims, 2, 1, 1)] = 0.8;
    d[idx(dims, 1, 2, 1)] = 0.07;
    const cells = Uint32Array.from([idx(dims, 2, 2, 1), idx(dims, 3, 2, 1)]);
    for (const name of ["vaporAvailability", "growthPropensity", "boundaryMass"] as const) {
      const values = overlayValuesFor(name, ctx, cells);
      expect(values[0]).toBeCloseTo(overlayValueAt(name, ctx, 2, 2, 1), 6);
      expect(values[1]).toBeCloseTo(overlayValueAt(name, ctx, 3, 2, 1), 6);
    }
  });
});
