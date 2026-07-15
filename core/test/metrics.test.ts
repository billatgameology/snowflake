import { describe, expect, it } from "vitest";
import {
  aspectRatio,
  branchCount,
  cellCount,
  coordsOf,
  crossSectionHollowness,
  domainCenter,
  domainContact,
  hexDistance,
  hexSeedSites,
  idx,
  sealedVoidFraction,
  symmetryError,
  totalMass,
  type Dims,
} from "@vcc/core";

function emptyA(dims: Dims): Uint8Array {
  return new Uint8Array(cellCount(dims));
}

describe("totalMass (pairwise/Kahan-compensated)", () => {
  it("sums b + d", () => {
    const b = new Float64Array([1, 2, 3]);
    const d = new Float64Array([0.5, 0.25, 0]);
    expect(totalMass(b, d)).toBeCloseTo(6.75, 15);
  });

  it("keeps compensation under ill-conditioned input", () => {
    // 1e16 + many small values that naive summation drops entirely.
    const n = 1_000_001;
    const b = new Float64Array(n);
    const d = new Float64Array(n);
    b[0] = 1e16;
    for (let i = 1; i < n; i++) b[i] = 0.001;
    const exact = 1e16 + (n - 1) * 0.001;
    expect(Math.abs(totalMass(b, d) - exact) / exact).toBeLessThan(1e-15);
  });
});

describe("D6h symmetry error", () => {
  const dims: Dims = { nx: 24, ny: 24, nz: 12 };

  it("a hexagonal prism scores exactly 0", () => {
    const a = emptyA(dims);
    for (const s of hexSeedSites(dims, 5, 3)) a[s] = 1;
    expect(symmetryError(a, dims, domainCenter(dims))).toBe(0);
  });

  it("rejects the 20-site seed variant (the paper's miscount cannot be C6-symmetric)", () => {
    const a = emptyA(dims);
    const sites = hexSeedSites(dims, 2, 1);
    for (const s of sites) a[s] = 1;
    // Add one more site adjacent to the hexagon: 20 sites, 20 mod 6 = 2 — symmetry must break.
    const [ic, jc, kc] = domainCenter(dims);
    a[idx(dims, ic + 3, jc, kc)] = 1;
    expect(symmetryError(a, dims, domainCenter(dims))).toBeGreaterThan(0);
  });
});

describe("aspect ratio", () => {
  const dims: Dims = { nx: 24, ny: 24, nz: 16 };

  it("is < 1 for a plate and > 1 for a column", () => {
    const plate = emptyA(dims);
    for (const s of hexSeedSites(dims, 6, 1)) plate[s] = 1;
    expect(aspectRatio(plate, dims)).toBeLessThan(1);

    const column = emptyA(dims);
    for (const s of hexSeedSites(dims, 1, 11)) column[s] = 1;
    expect(aspectRatio(column, dims)).toBeGreaterThan(1);
  });
});

describe("hollowness (cross-section + sealed void)", () => {
  const dims: Dims = { nx: 24, ny: 24, nz: 12 };
  const [ic, jc] = domainCenter(dims);

  it("a solid hex prism scores 0 on both", () => {
    const a = emptyA(dims);
    for (const s of hexSeedSites(dims, 5, 3)) a[s] = 1;
    expect(crossSectionHollowness(a, dims)).toBe(0);
    expect(sealedVoidFraction(a, dims)).toBe(0);
  });

  it("an open-ended tube scores cross-section hollowness > 0 and sealed-void 0", () => {
    // Hex ring wall (3 <= hexDist <= 5) through the whole z-range: open at both z-faces.
    const a = emptyA(dims);
    for (let k = 0; k < dims.nz; k++) {
      for (let j = 0; j < dims.ny; j++) {
        for (let i = 0; i < dims.nx; i++) {
          const dist = hexDistance(i - ic, j - jc);
          if (dist >= 3 && dist <= 5) a[idx(dims, i, j, k)] = 1;
        }
      }
    }
    expect(crossSectionHollowness(a, dims)).toBeGreaterThan(0);
    expect(sealedVoidFraction(a, dims)).toBe(0);
  });

  it("a closed shell scores sealed-void > 0", () => {
    // Solid hex prism minus its strict interior: a sealed cavity.
    const a = emptyA(dims);
    const kc = domainCenter(dims)[2];
    for (const s of hexSeedSites(dims, 5, 5)) a[s] = 1;
    for (let k = 0; k < dims.nz; k++) {
      for (let j = 0; j < dims.ny; j++) {
        for (let i = 0; i < dims.nx; i++) {
          if (hexDistance(i - ic, j - jc) <= 3 && Math.abs(k - kc) <= 1) {
            a[idx(dims, i, j, k)] = 0;
          }
        }
      }
    }
    expect(sealedVoidFraction(a, dims)).toBeGreaterThan(0);
    expect(crossSectionHollowness(a, dims)).toBeGreaterThan(0);
  });
});

describe("branch count", () => {
  const dims: Dims = { nx: 40, ny: 40, nz: 8 };
  const [ic, jc, kc] = domainCenter(dims);

  it("a plain hexagon scores 0 (documented convention: depth 1 - cos30° ≈ 0.134 <= 0.2)", () => {
    const a = emptyA(dims);
    for (const s of hexSeedSites(dims, 8, 1)) a[s] = 1;
    expect(branchCount(a, dims, domainCenter(dims))).toBe(0);
  });

  it("a six-armed star scores 6", () => {
    const a = emptyA(dims);
    for (const s of hexSeedSites(dims, 2, 1)) a[s] = 1;
    const directions: Array<[number, number]> = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, -1],
      [-1, 1],
    ];
    for (const [di, dj] of directions) {
      for (let t = 1; t <= 14; t++) {
        a[idx(dims, ic + di * t, jc + dj * t, kc)] = 1;
      }
    }
    expect(branchCount(a, dims, domainCenter(dims))).toBe(6);
  });
});

describe("domain-contact guard (charter §3.1: 65% of any extent)", () => {
  const dims: Dims = { nx: 40, ny: 40, nz: 20 };

  it("trips at 70% of one axis and not at 50%", () => {
    const seventy = emptyA(dims);
    for (let i = 2; i <= 29; i++) seventy[idx(dims, i, 20, 10)] = 1; // 28 cells > 26
    expect(domainContact(seventy, dims)).toBe(true);

    const fifty = emptyA(dims);
    for (let i = 2; i <= 21; i++) fifty[idx(dims, i, 20, 10)] = 1; // 20 cells <= 26
    expect(domainContact(fifty, dims)).toBe(false);
  });
});

describe("coordsOf sanity for metrics", () => {
  it("round-trips indices", () => {
    const dims: Dims = { nx: 7, ny: 5, nz: 3 };
    for (let index = 0; index < cellCount(dims); index++) {
      const [i, j, k] = coordsOf(dims, index);
      expect(idx(dims, i, j, k)).toBe(index);
    }
  });
});
