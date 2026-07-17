// LK overlay quantities and per-operator overlay honesty (V4-3).
//
// The LK boundary-growth propensity definition under test (lkoverlays.ts): for a surface
// cell, max over adjacent boundary pixels of (inhibited under the policy ? 0 : f). These
// tests recompute it independently — hand-derived neighbor sets, core classifyFacet, and a
// brute-force sweep — and pin the policy dependence ([10] is inhibited under v4 but prism
// under legacy-v3, so the SAME state reads differently under the two policies).

import { describe, expect, it } from "vitest";
import { T_NEIGHBOR_OFFSETS, classifyFacet, idx, type Dims } from "@vcc/core";
import {
  LK_OVERLAY_LABELS,
  LK_OVERLAY_NAMES,
  assertOverlayHonest,
  lkOverlayValueAt,
  lkOverlayValuesFor,
  type LKOverlayContext,
} from "../src/lkoverlays.ts";
import { attachedNeighborCountsUncapped } from "../src/overlays.ts";
import { buildLKPickInfo, formatLKReadout } from "../src/lkreadout.ts";

const DIMS: Dims = { nx: 7, ny: 7, nz: 5 };

function emptyContext(policy: "aggregate-hv-g1h1-v4" | "legacy-v3" = "aggregate-hv-g1h1-v4"): {
  ctx: LKOverlayContext;
  a: Uint8Array;
  f: Float32Array;
  sigma: Float32Array;
} {
  const n = DIMS.nx * DIMS.ny * DIMS.nz;
  const a = new Uint8Array(n);
  const f = new Float32Array(n);
  const sigma = new Float32Array(n);
  const ctx: LKOverlayContext = { dims: DIMS, a, wall: null, f, sigma, surfacePolicy: policy };
  return { ctx, a, f, sigma };
}

describe("lkGrowthPropensity — exact definition", () => {
  it("an inhibited [10] pixel contributes 0 under v4 even with stored fill 0.9", () => {
    const { ctx, a, f } = emptyContext();
    // Lone attached cell at the center: every free T-neighbor sees rawNT=1, rawNZ=0 -> [10]
    // = inhibited under aggregate-hv-g1h1-v4; the z-neighbors see [01] = basal with f = 0.
    const center = idx(DIMS, 3, 3, 2);
    a[center] = 1;
    const pixel = idx(DIMS, 4, 3, 2);
    f[pixel] = 0.9;
    expect(classifyFacet(1, 0, "aggregate-hv-g1h1-v4")).toBe("inhibited"); // premise
    expect(lkOverlayValueAt("lkGrowthPropensity", ctx, 3, 3, 2)).toBe(0);
    // The raw stored fill is still shown honestly by the separate boundary-fill overlay.
    expect(lkOverlayValueAt("lkBoundaryFill", ctx, 3, 3, 2)).toBeCloseTo(0.9, 6);
  });

  it("the SAME state reads 0.9 under legacy-v3, where [10] is prism (policy dependence)", () => {
    const { ctx, a, f } = emptyContext("legacy-v3");
    a[idx(DIMS, 3, 3, 2)] = 1;
    f[idx(DIMS, 4, 3, 2)] = 0.9;
    expect(classifyFacet(1, 0, "legacy-v3")).toBe("prism"); // premise
    expect(lkOverlayValueAt("lkGrowthPropensity", ctx, 3, 3, 2)).toBeCloseTo(0.9, 6);
  });

  it("a basal [01] pixel contributes its fill f", () => {
    const { ctx, a, f } = emptyContext();
    a[idx(DIMS, 3, 3, 2)] = 1;
    f[idx(DIMS, 3, 3, 3)] = 0.6; // the pixel above: rawNT=0, rawNZ=1 -> basal
    expect(lkOverlayValueAt("lkGrowthPropensity", ctx, 3, 3, 2)).toBeCloseTo(0.6, 6);
  });

  it("is NaN for a cell with no adjacent boundary pixel", () => {
    const { ctx, a } = emptyContext();
    // 3x3 block x 3 layers around the center: the center cell has no free neighbor.
    for (let dk = -1; dk <= 1; dk++) {
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          a[idx(DIMS, 3 + di, 3 + dj, 2 + dk)] = 1;
        }
      }
    }
    expect(lkOverlayValueAt("lkGrowthPropensity", ctx, 3, 3, 2)).toBeNaN();
    expect(lkOverlayValueAt("lkBoundaryFill", ctx, 3, 3, 2)).toBeNaN();
  });

  it("matches an independent brute-force recomputation on an asymmetric multi-cell fixture", () => {
    const { ctx, a, f, sigma } = emptyContext();
    // Asymmetric cluster: three attached cells; varied fills and supersaturations.
    const attached: Array<[number, number, number]> = [
      [3, 3, 2],
      [4, 3, 2],
      [3, 3, 3],
    ];
    for (const [i, j, k] of attached) a[idx(DIMS, i, j, k)] = 1;
    let seedValue = 1;
    for (let x = 0; x < f.length; x++) {
      if (a[x] === 0) {
        seedValue = (seedValue * 48271) % 2147483647;
        f[x] = (seedValue % 1000) / 1000;
        sigma[x] = ((seedValue >> 3) % 1000) / 250000;
      }
    }
    const inDomain = (i: number, j: number, k: number): boolean =>
      i >= 0 && i < DIMS.nx && j >= 0 && j < DIMS.ny && k >= 0 && k < DIMS.nz;
    const neighborsOf = (i: number, j: number, k: number): Array<[number, number, number]> => {
      const list: Array<[number, number, number]> = [];
      for (const [di, dj] of T_NEIGHBOR_OFFSETS) list.push([i + di, j + dj, k]);
      list.push([i, j, k + 1], [i, j, k - 1]);
      return list.filter(([ni, nj, nk]) => inDomain(ni, nj, nk));
    };
    for (const [i, j, k] of attached) {
      let expectedPropensity = Number.NaN;
      let expectedFill = Number.NaN;
      let sigmaSum = 0;
      let sigmaCount = 0;
      for (const [ni, nj, nk] of neighborsOf(i, j, k)) {
        const y = idx(DIMS, ni, nj, nk);
        if (a[y] === 1) continue;
        const [rawNT, rawNZ] = attachedNeighborCountsUncapped(a, DIMS, ni, nj, nk);
        const facet = classifyFacet(rawNT, rawNZ, "aggregate-hv-g1h1-v4");
        const contribution = facet === "inhibited" ? 0 : f[y];
        if (Number.isNaN(expectedPropensity) || contribution > expectedPropensity) {
          expectedPropensity = contribution;
        }
        if (Number.isNaN(expectedFill) || f[y] > expectedFill) expectedFill = f[y];
        sigmaSum += sigma[y];
        sigmaCount++;
      }
      expect(lkOverlayValueAt("lkGrowthPropensity", ctx, i, j, k)).toBe(expectedPropensity);
      expect(lkOverlayValueAt("lkBoundaryFill", ctx, i, j, k)).toBe(expectedFill);
      expect(lkOverlayValueAt("lkSigmaAvailability", ctx, i, j, k)).toBeCloseTo(
        sigmaSum / sigmaCount,
        12,
      );
    }
  });

  it("respects the wall mask (wall neighbors are never boundary pixels)", () => {
    const { ctx: base, a, f } = emptyContext();
    a[idx(DIMS, 3, 3, 2)] = 1;
    f[idx(DIMS, 4, 3, 2)] = 0.7;
    const wall = new Uint8Array(a.length);
    wall[idx(DIMS, 4, 3, 2)] = 1; // the only filled pixel is a wall -> invisible
    const ctx: LKOverlayContext = { ...base, wall };
    expect(lkOverlayValueAt("lkBoundaryFill", ctx, 3, 3, 2)).toBe(0);
  });

  it("lkOverlayValuesFor maps flat indices exactly like the scalar form", () => {
    const { ctx, a, f } = emptyContext();
    a[idx(DIMS, 3, 3, 2)] = 1;
    f[idx(DIMS, 3, 3, 3)] = 0.4;
    const cells = Uint32Array.from([idx(DIMS, 3, 3, 2)]);
    const values = lkOverlayValuesFor("lkGrowthPropensity", ctx, cells);
    expect(values.length).toBe(1);
    expect(values[0]).toBeCloseTo(0.4, 6);
  });
});

describe("assertOverlayHonest (V4-3 cross-operator refusals)", () => {
  it("refuses every GG quantity on LibbrechtKinetics state, by name", () => {
    for (const name of ["vaporAvailability", "growthPropensity", "boundaryMass", "growthRecency"]) {
      expect(() => assertOverlayHonest("LibbrechtKinetics", name)).toThrow(
        /GGThreshold quantity/,
      );
    }
  });

  it("refuses every LK quantity on GGThreshold state, by name", () => {
    for (const name of ["lkSigmaAvailability", "lkBoundaryFill", "lkGrowthPropensity"]) {
      expect(() => assertOverlayHonest("GGThreshold", name)).toThrow(/LibbrechtKinetics quantity/);
    }
  });

  it("accepts matching operator/quantity pairs and the neutral none", () => {
    expect(() => assertOverlayHonest("GGThreshold", "growthPropensity")).not.toThrow();
    expect(() => assertOverlayHonest("LibbrechtKinetics", "lkGrowthPropensity")).not.toThrow();
    expect(() => assertOverlayHonest("GGThreshold", "none")).not.toThrow();
    expect(() => assertOverlayHonest("LibbrechtKinetics", "none")).not.toThrow();
  });

  it("rejects unknown quantities outright", () => {
    expect(() => assertOverlayHonest("GGThreshold", "temperature")).toThrow(/unknown overlay/);
  });

  it("every LK overlay label carries §1.5 phrasing and no G-G vocabulary", () => {
    for (const name of LK_OVERLAY_NAMES) {
      if (name === "none") continue;
      const label = LK_OVERLAY_LABELS[name];
      expect(label.definition).toContain("unvalidated");
      expect(label.definition).not.toContain("boundary mass");
      expect(label.definition).not.toContain("ggThresh");
    }
  });
});

describe("LK picking readout (V4-3)", () => {
  it("reads the actual f/sigma with honest labels and the policy facet class", () => {
    const { ctx, a, f, sigma } = emptyContext();
    a[idx(DIMS, 3, 3, 2)] = 1;
    const pixel = idx(DIMS, 4, 3, 2);
    f[pixel] = 0.25;
    sigma[pixel] = 0.0015;
    const info = buildLKPickInfo(ctx, 4, 3, 2, "none");
    expect(info.attached).toBe(false);
    expect(info.f).toBeCloseTo(0.25, 6);
    expect(info.sigma).toBeCloseTo(0.0015, 6);
    expect(info.rawNT).toBe(1);
    expect(info.rawNZ).toBe(0);
    expect(info.facet).toBe("inhibited");
    const lines = formatLKReadout(info).join("\n");
    expect(lines).toContain("boundary fill");
    expect(lines).toContain("supersaturation");
    expect(lines).toContain("dimensionless");
    expect(lines).toContain("inhibited");
    expect(lines).toContain("unvalidated");
    // No G-G vocabulary on an LK readout — that would be the label crime V4-3 bans.
    expect(lines).not.toContain("boundary mass");
    expect(lines).not.toContain("vapor mass");
  });

  it("reports [00] honestly as not-a-boundary-configuration instead of classifying it", () => {
    const { ctx } = emptyContext();
    const info = buildLKPickInfo(ctx, 1, 1, 1, "none");
    expect(info.facet).toBeNull();
    expect(formatLKReadout(info).join("\n")).toContain("[00] is not a boundary configuration");
  });
});
