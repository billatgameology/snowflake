// Surface-cell extraction tests (A2-4): hand-built lattice fixtures, wall exclusion, and an
// independent brute-force recomputation against core's canonical seed.

import { describe, expect, it } from "vitest";
import { cellCount, hexSeedSites, idx, neighborIndices, type Dims } from "@vcc/core";
import { surfaceCellIndices } from "../src/surface.ts";

describe("surfaceCellIndices", () => {
  it("returns nothing for a crystal-free lattice", () => {
    const dims: Dims = { nx: 4, ny: 4, nz: 4 };
    const a = new Uint8Array(cellCount(dims));
    expect(surfaceCellIndices(a, null, dims)).toHaveLength(0);
  });

  it("a lone attached cell is a surface cell", () => {
    const dims: Dims = { nx: 3, ny: 3, nz: 3 };
    const a = new Uint8Array(cellCount(dims));
    const centerIndex = idx(dims, 1, 1, 1);
    a[centerIndex] = 1;
    expect(Array.from(surfaceCellIndices(a, null, dims))).toEqual([centerIndex]);
  });

  it("excludes a fully enclosed interior cell", () => {
    const dims: Dims = { nx: 3, ny: 3, nz: 3 };
    const a = new Uint8Array(cellCount(dims));
    const centerIndex = idx(dims, 1, 1, 1);
    a[centerIndex] = 1;
    // Attach all 8 lattice neighbors (6 T + 2 Z) — the center becomes interior.
    for (const n of neighborIndices(dims, 1, 1, 1)) {
      expect(n).toBeGreaterThanOrEqual(0);
      a[n] = 1;
    }
    const surface = Array.from(surfaceCellIndices(a, null, dims));
    expect(surface).not.toContain(centerIndex);
    // Every neighbor still touches a free cell, so all 8 are surface cells.
    for (const n of neighborIndices(dims, 1, 1, 1)) {
      expect(surface).toContain(n);
    }
    expect(surface).toHaveLength(8);
  });

  it("wall cells are not free: a cell exposed only to walls is not a surface cell", () => {
    // nz = 1, so the attached center has no Z-neighbors; every T-neighbor is a wall.
    const dims: Dims = { nx: 3, ny: 3, nz: 1 };
    const n = cellCount(dims);
    const a = new Uint8Array(n);
    const wall = new Uint8Array(n).fill(1);
    const centerIndex = idx(dims, 1, 1, 0);
    a[centerIndex] = 1;
    wall[centerIndex] = 0;
    expect(surfaceCellIndices(a, wall, dims)).toHaveLength(0);
    // The identical lattice without the wall mask keeps the cell exposed.
    expect(Array.from(surfaceCellIndices(a, null, dims))).toEqual([centerIndex]);
  });

  it("one free wall-free neighbor is enough", () => {
    const dims: Dims = { nx: 3, ny: 3, nz: 1 };
    const n = cellCount(dims);
    const a = new Uint8Array(n);
    const wall = new Uint8Array(n).fill(1);
    const centerIndex = idx(dims, 1, 1, 0);
    a[centerIndex] = 1;
    wall[centerIndex] = 0;
    wall[idx(dims, 2, 1, 0)] = 0; // exactly one free, non-wall T-neighbor
    expect(Array.from(surfaceCellIndices(a, wall, dims))).toEqual([centerIndex]);
  });

  it("matches a brute-force recomputation on the canonical thickness-3 seed", () => {
    // radius-2, thickness-3 hex seed: 3 layers x 19 = 57 attached cells. The middle layer's
    // 7 cells at hex distance <= 1 have all 6 T-neighbors and both Z-neighbors attached, so
    // exactly 57 - 7 = 50 are surface cells.
    const dims: Dims = { nx: 9, ny: 9, nz: 5 };
    const a = new Uint8Array(cellCount(dims));
    for (const site of hexSeedSites(dims, 2, 3)) a[site] = 1;

    const result = Array.from(surfaceCellIndices(a, null, dims));
    expect(result).toHaveLength(50);

    // Independent brute force straight off neighborIndices.
    const expected: number[] = [];
    for (let k = 0; k < dims.nz; k++) {
      for (let j = 0; j < dims.ny; j++) {
        for (let i = 0; i < dims.nx; i++) {
          const x = idx(dims, i, j, k);
          if (a[x] !== 1) continue;
          const hasFree = Array.from(neighborIndices(dims, i, j, k)).some(
            (neighbor) => neighbor >= 0 && a[neighbor] === 0,
          );
          if (hasFree) expected.push(x);
        }
      }
    }
    expect(result).toEqual(expected);
  });
});
