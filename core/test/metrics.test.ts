import { describe, expect, it } from "vitest";
import {
  aspectRatio,
  branchCount,
  cellCount,
  centerRimDepletion,
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

describe("center-vs-rim depletion (Phase 3 WP1; plan phase-3-dev-visualization)", () => {
  const dims: Dims = { nx: 9, ny: 9, nz: 7 };
  const [ic, jc, kc] = domainCenter(dims); // (4, 4, 3)

  function fill(a: Uint8Array, sites: number[]): void {
    for (const s of sites) a[s] = 1;
  }

  /** Deterministic, all-distinct hand values so a wrong sample cannot alias a right one. */
  function gradientField(d: Dims): Float64Array {
    const field = new Float64Array(cellCount(d));
    for (let index = 0; index < field.length; index++) {
      const [i, j, k] = coordsOf(d, index);
      field[index] = 0.1 + 0.001 * i + 0.002 * j + 0.003 * k;
    }
    return field;
  }

  /**
   * INDEPENDENT brute-force recomputation straight from the plan's definition: own triple
   * loops, own indexing arithmetic, own hardcoded T-neighbor offsets — nothing shared with
   * the library path except the input arrays. Iterates in the same ascending (j, i) order so
   * the rim mean is bit-identical, making exact equality a fair requirement.
   */
  function bruteForceDepletion(
    a: Uint8Array,
    field: Float64Array,
    d: Dims,
    icc: number,
    jcc: number,
    wall?: Uint8Array,
  ): { center: number; rim: number; ratio: number; rimCount: number } {
    const at = (i: number, j: number, k: number): number => k * d.nx * d.ny + j * d.nx + i;
    const isFree = (i: number, j: number, k: number): boolean =>
      a[at(i, j, k)] === 0 && (wall === undefined || wall[at(i, j, k)] === 0);
    let kTop = -1;
    for (let k = 0; k < d.nz; k++) {
      for (let j = 0; j < d.ny; j++) {
        for (let i = 0; i < d.nx; i++) {
          if (a[at(i, j, k)] === 1 && k > kTop) kTop = k;
        }
      }
    }
    if (kTop === -1) return { center: Number.NaN, rim: Number.NaN, ratio: Number.NaN, rimCount: 0 };
    let center = Number.NaN;
    if (kTop + 1 < d.nz && isFree(icc, jcc, kTop + 1)) center = field[at(icc, jcc, kTop + 1)];
    const offsets: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
    let sum = 0;
    let count = 0;
    let rimCount = 0;
    for (let j = 0; j < d.ny; j++) {
      for (let i = 0; i < d.nx; i++) {
        if (a[at(i, j, kTop)] !== 1) continue;
        let hasFreeNeighbor = false;
        for (const [di, dj] of offsets) {
          const ni = i + di;
          const nj = j + dj;
          if (ni < 0 || ni >= d.nx || nj < 0 || nj >= d.ny) continue;
          if (isFree(ni, nj, kTop)) hasFreeNeighbor = true;
        }
        if (!hasFreeNeighbor) continue;
        rimCount++;
        if (kTop + 1 < d.nz && isFree(i, j, kTop + 1)) {
          sum += field[at(i, j, kTop + 1)];
          count++;
        }
      }
    }
    const rim = count === 0 ? Number.NaN : sum / count;
    return { center, rim, ratio: center / rim, rimCount };
  }

  it("matches an independent brute-force recomputation exactly on a hand-built plate", () => {
    const a = emptyA(dims);
    fill(a, hexSeedSites(dims, 2, 1)); // 19-site plate at k = 3
    const field = gradientField(dims);
    const got = centerRimDepletion(a, field, dims, [ic, jc, kc]);
    const want = bruteForceDepletion(a, field, dims, ic, jc);
    // A radius-2 hex plate's edge ring is its 12 hexDist-2 cells; interior cells have no
    // free in-plane neighbor. Non-vacuity: the brute path saw a real ring.
    expect(want.rimCount).toBe(12);
    expect(got.depletionCenter).toBe(field[idx(dims, ic, jc, 4)]);
    expect(got.depletionCenter).toBe(want.center);
    expect(got.depletionRim).toBe(want.rim);
    expect(got.depletionRatio).toBe(want.ratio);
    expect(Number.isFinite(got.depletionRatio)).toBe(true);
  });

  it("matches brute force under a hexPrism-style wall mask, where the mask matters", () => {
    // A radius-4 plate fills the entire active cross-section of a hexRadius-4 prism: every
    // in-plane neighbor of the facet's edge is a wall, so the rim set is EMPTY under the
    // mask — while without the mask the same `a` has a 24-cell ring (the corner cells of the
    // 9x9 box are free there). The mask must change the answer, or it is decorative.
    const a = emptyA(dims);
    fill(a, hexSeedSites(dims, 4, 1));
    const wall = new Uint8Array(cellCount(dims));
    for (let index = 0; index < wall.length; index++) {
      const [i, j] = coordsOf(dims, index);
      if (hexDistance(i - ic, j - jc) > 4) wall[index] = 1;
    }
    const field = gradientField(dims);

    const masked = centerRimDepletion(a, field, dims, [ic, jc, kc], wall);
    const wantMasked = bruteForceDepletion(a, field, dims, ic, jc, wall);
    expect(wantMasked.rimCount).toBe(0);
    expect(masked.depletionCenter).toBe(wantMasked.center);
    expect(Number.isFinite(masked.depletionCenter)).toBe(true);
    expect(masked.depletionRim).toBe(Number.NaN);
    expect(masked.depletionRatio).toBe(Number.NaN);

    const unmasked = centerRimDepletion(a, field, dims, [ic, jc, kc]);
    const wantUnmasked = bruteForceDepletion(a, field, dims, ic, jc);
    expect(wantUnmasked.rimCount).toBeGreaterThan(0);
    expect(unmasked.depletionRim).toBe(wantUnmasked.rim);
    expect(Number.isFinite(unmasked.depletionRim)).toBe(true);
    expect(unmasked.depletionRatio).toBe(wantUnmasked.ratio);
  });

  it("a uniform field over a plate gives ratio exactly 1", () => {
    // 0.75 is dyadic: 12 additions and one division stay exact, so `toBe(1)` is legitimate.
    const a = emptyA(dims);
    fill(a, hexSeedSites(dims, 2, 1));
    const field = new Float64Array(cellCount(dims)).fill(0.75);
    const got = centerRimDepletion(a, field, dims, [ic, jc, kc]);
    expect(got.depletionCenter).toBe(0.75);
    expect(got.depletionRim).toBe(0.75);
    expect(got.depletionRatio).toBe(1);
  });

  it("an inverted field (rim depleted below center) gives ratio > 1", () => {
    const a = emptyA(dims);
    fill(a, hexSeedSites(dims, 2, 1));
    const field = new Float64Array(cellCount(dims)).fill(0.5);
    // Deplete the vapor above the edge ring only (hexDist exactly 2, layer kTop + 1).
    for (let j = 0; j < dims.ny; j++) {
      for (let i = 0; i < dims.nx; i++) {
        if (hexDistance(i - ic, j - jc) === 2) field[idx(dims, i, j, kc + 1)] = 0.25;
      }
    }
    const got = centerRimDepletion(a, field, dims, [ic, jc, kc]);
    expect(got.depletionCenter).toBe(0.5);
    expect(got.depletionRim).toBe(0.25);
    expect(got.depletionRatio).toBe(2);
    expect(got.depletionRatio).toBeGreaterThan(1);
  });

  it("no crystal at all: all three NaN", () => {
    const got = centerRimDepletion(emptyA(dims), gradientField(dims), dims, [ic, jc, kc]);
    expect(got.depletionCenter).toBe(Number.NaN);
    expect(got.depletionRim).toBe(Number.NaN);
    expect(got.depletionRatio).toBe(Number.NaN);
  });

  it("crystal touching the domain top: kTop + 1 is out of domain, all three NaN", () => {
    const a = emptyA(dims);
    fill(a, hexSeedSites(dims, 2, 1, [ic, jc, dims.nz - 1]));
    const got = centerRimDepletion(a, gradientField(dims), dims, [ic, jc, kc]);
    expect(got.depletionCenter).toBe(Number.NaN);
    expect(got.depletionRim).toBe(Number.NaN);
    expect(got.depletionRatio).toBe(Number.NaN);
  });

  it("wall directly above the facet center: center NaN, rim still finite, ratio NaN", () => {
    const a = emptyA(dims);
    fill(a, hexSeedSites(dims, 2, 1));
    const wall = new Uint8Array(cellCount(dims));
    wall[idx(dims, ic, jc, kc + 1)] = 1;
    const field = new Float64Array(cellCount(dims)).fill(0.5);
    const got = centerRimDepletion(a, field, dims, [ic, jc, kc], wall);
    expect(got.depletionCenter).toBe(Number.NaN);
    expect(got.depletionRim).toBe(0.5);
    expect(got.depletionRatio).toBe(Number.NaN);
  });

  it("a wall above a rim cell is excluded from the rim mean", () => {
    const a = emptyA(dims);
    fill(a, hexSeedSites(dims, 2, 1));
    const field = new Float64Array(cellCount(dims)).fill(0.5);
    // Poison the sample above one edge-ring cell; a leak into the mean cannot hide.
    field[idx(dims, ic + 2, jc, kc + 1)] = 999;
    // Without the wall the poison IS counted — the exclusion case genuinely matters.
    const leaky = centerRimDepletion(a, field, dims, [ic, jc, kc]);
    expect(leaky.depletionRim).toBeGreaterThan(0.5);
    const wall = new Uint8Array(cellCount(dims));
    wall[idx(dims, ic + 2, jc, kc + 1)] = 1;
    const got = centerRimDepletion(a, field, dims, [ic, jc, kc], wall);
    expect(got.depletionRim).toBe(0.5); // 11 x 0.5, exact
    expect(got.depletionRatio).toBe(1);
  });

  it("wall T-neighbors do not count as free: a wall-enclosed edge cell leaves the rim set", () => {
    const a = emptyA(dims);
    fill(a, hexSeedSites(dims, 2, 1));
    const field = new Float64Array(cellCount(dims)).fill(0.5);
    field[idx(dims, ic + 2, jc, kc + 1)] = 999; // poison above the cell that must drop out
    // Wall off all three unattached in-plane neighbors of ring cell (ic+2, jc, kc): with
    // walls-as-free it would stay in the rim set and the poison would leak into the mean.
    const wall = new Uint8Array(cellCount(dims));
    wall[idx(dims, ic + 3, jc, kc)] = 1;
    wall[idx(dims, ic + 3, jc - 1, kc)] = 1;
    wall[idx(dims, ic + 2, jc + 1, kc)] = 1;
    const got = centerRimDepletion(a, field, dims, [ic, jc, kc], wall);
    const want = bruteForceDepletion(a, field, dims, ic, jc, wall);
    expect(want.rimCount).toBe(11);
    expect(got.depletionRim).toBe(0.5); // the other 11 ring cells, exact
    expect(got.depletionRim).toBe(want.rim);
    expect(got.depletionRatio).toBe(1);
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
