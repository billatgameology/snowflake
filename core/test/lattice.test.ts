import { describe, expect, it } from "vitest";
import {
  cellCount,
  coordsOf,
  domainCenter,
  hexDistance,
  hexSeedSites,
  idx,
  mirror,
  neighborIndices,
  rot60,
  tNeighborFlatOffsets,
  zNeighborFlatOffsets,
  zmirror,
  T_NEIGHBOR_OFFSETS,
  type Dims,
} from "@vcc/core";

const dims: Dims = { nx: 6, ny: 5, nz: 4 };

describe("lattice index math", () => {
  it("idx and coordsOf are inverse", () => {
    for (let index = 0; index < cellCount(dims); index++) {
      const [i, j, k] = coordsOf(dims, index);
      expect(idx(dims, i, j, k)).toBe(index);
    }
  });
});

describe("neighbor gather (gate: neighbor tests pass in all directions)", () => {
  it("neighbor symmetry holds in all 8 directions: y in N(x) iff x in N(y)", () => {
    for (let k = 0; k < dims.nz; k++) {
      for (let j = 0; j < dims.ny; j++) {
        for (let i = 0; i < dims.nx; i++) {
          const x = idx(dims, i, j, k);
          const neighbors = neighborIndices(dims, i, j, k);
          for (const y of neighbors) {
            if (y === -1) continue;
            const [yi, yj, yk] = coordsOf(dims, y);
            const back = neighborIndices(dims, yi, yj, yk);
            expect(Array.from(back)).toContain(x);
          }
        }
      }
    }
  });

  it("an interior cell has all 8 neighbors", () => {
    const neighbors = neighborIndices(dims, 2, 2, 2);
    expect(Array.from(neighbors).filter((n) => n >= 0)).toHaveLength(8);
  });

  it("boundary handling at every face, edge and corner: exactly the out-of-domain slots are -1", () => {
    for (let k = 0; k < dims.nz; k++) {
      for (let j = 0; j < dims.ny; j++) {
        for (let i = 0; i < dims.nx; i++) {
          const neighbors = neighborIndices(dims, i, j, k);
          for (let n = 0; n < 6; n++) {
            const off = T_NEIGHBOR_OFFSETS[n];
            const inDomain =
              i + off[0] >= 0 && i + off[0] < dims.nx && j + off[1] >= 0 && j + off[1] < dims.ny;
            expect(neighbors[n] >= 0).toBe(inDomain);
          }
          expect(neighbors[6] >= 0).toBe(k + 1 < dims.nz);
          expect(neighbors[7] >= 0).toBe(k - 1 >= 0);
        }
      }
    }
  });

  it("corner (0,0,0) has exactly the 3 in-domain neighbors", () => {
    const neighbors = neighborIndices(dims, 0, 0, 0);
    const valid = Array.from(neighbors).filter((n) => n >= 0);
    // (+1,0), (0,+1), (-1,+1) are out for i=0? (-1,+1) needs i-1 >= 0 — out. So T: (+1,0), (0,+1); Z: k+1.
    expect(valid).toHaveLength(3);
  });

  it("flat offsets agree with the bounds-checked gather in the interior", () => {
    const tOff = tNeighborFlatOffsets(dims);
    const zOff = zNeighborFlatOffsets(dims);
    for (let k = 1; k < dims.nz - 1; k++) {
      for (let j = 1; j < dims.ny - 1; j++) {
        for (let i = 1; i < dims.nx - 1; i++) {
          const x = idx(dims, i, j, k);
          const gathered = neighborIndices(dims, i, j, k);
          for (let n = 0; n < 6; n++) expect(x + tOff[n]).toBe(gathered[n]);
          expect(x + zOff[0]).toBe(gathered[6]);
          expect(x + zOff[1]).toBe(gathered[7]);
        }
      }
    }
  });
});

describe("D6h operators", () => {
  const ic = 10;
  const jc = 7;

  it("rot60 has order 6 exactly", () => {
    for (const [pi, pj] of [
      [3, 4],
      [-2, 9],
      [15, 0],
    ]) {
      let i = pi;
      let j = pj;
      for (let n = 0; n < 6; n++) {
        [i, j] = rot60(i, j, ic, jc);
        if (n < 5) expect([i, j]).not.toEqual([pi, pj]);
      }
      expect([i, j]).toEqual([pi, pj]);
    }
  });

  it("mirror and zmirror are involutions", () => {
    const [mi, mj] = mirror(4, 9, ic, jc);
    expect(mirror(mi, mj, ic, jc)).toEqual([4, 9]);
    expect(zmirror(zmirror(5, 8), 8)).toBe(5);
  });

  it("rot60 permutes the T-neighbor directions", () => {
    const dirs = new Set(T_NEIGHBOR_OFFSETS.map(([di, dj]) => `${di},${dj}`));
    for (const [di, dj] of T_NEIGHBOR_OFFSETS) {
      const [ri, rj] = rot60(di, dj, 0, 0);
      expect(dirs.has(`${ri},${rj}`)).toBe(true);
    }
  });
});

describe("hex seed (gg-machinery §5)", () => {
  const seedDims: Dims = { nx: 16, ny: 16, nz: 8 };

  it("radius 2, thickness 1 has 19 sites — NOT the paper's 20 (documented erratum)", () => {
    expect(hexSeedSites(seedDims, 2, 1)).toHaveLength(19);
    expect(hexSeedSites(seedDims, 1, 1)).toHaveLength(7);
    expect(hexSeedSites(seedDims, 0, 1)).toHaveLength(1);
    // 3r^2 + 3r + 1
    expect(hexSeedSites(seedDims, 3, 1)).toHaveLength(37);
  });

  it("is invariant under the full D6h group", () => {
    const [ic, jc, kc] = domainCenter(seedDims);
    const sites = new Set(hexSeedSites(seedDims, 2, 1));
    for (const index of sites) {
      const [i, j, k] = coordsOf(seedDims, index);
      const [ri, rj] = rot60(i, j, ic, jc);
      expect(sites.has(idx(seedDims, ri, rj, k))).toBe(true);
      const [mi, mj] = mirror(i, j, ic, jc);
      expect(sites.has(idx(seedDims, mi, mj, k))).toBe(true);
      expect(sites.has(idx(seedDims, i, j, zmirror(k, kc)))).toBe(true);
    }
  });

  it("rejects even thickness (breaks zmirror symmetry)", () => {
    expect(() => hexSeedSites(seedDims, 2, 2)).toThrow();
  });

  it("hexDistance is a norm on the axial plane", () => {
    expect(hexDistance(0, 0)).toBe(0);
    expect(hexDistance(1, 0)).toBe(1);
    expect(hexDistance(1, -1)).toBe(1);
    expect(hexDistance(2, -1)).toBe(2);
    expect(hexDistance(-2, 2)).toBe(2);
  });
});
