// Slice extraction and placement tests (A3-2). The fixtures are deliberately ASYMMETRIC
// (nx != ny != nz, i != j != k) so any transposed axis mapping — the classic silent slice
// bug — produces a mismatch, and the world matrix is checked against cartesian() itself.

import { describe, expect, it } from "vitest";
import { cartesian, cellCount, domainCenter, idx, type Dims } from "@vcc/core";
import {
  clampSliceIndex,
  extractSlice,
  sliceIndexCount,
  sliceTextureSize,
  sliceWorldMatrix,
  texelCenterLocal,
} from "../src/slice.ts";

const dims: Dims = { nx: 4, ny: 3, nz: 2 };

/** Field with a unique value per cell: any transposition or wrong index misreads it. */
function uniqueField(): Float32Array {
  const field = new Float32Array(cellCount(dims));
  for (let n = 0; n < field.length; n++) field[n] = n;
  return field;
}

/** Apply a row-major 4x4 to a point (w = 1). */
function apply(m: number[], x: number, y: number, z: number): [number, number, number] {
  return [
    m[0] * x + m[1] * y + m[2] * z + m[3],
    m[4] * x + m[5] * y + m[6] * z + m[7],
    m[8] * x + m[9] * y + m[10] * z + m[11],
  ];
}

describe("sliceTextureSize / sliceIndexCount", () => {
  it("vertical spans i,k and indexes along j; horizontal spans i,j and indexes along k", () => {
    expect(sliceTextureSize("vertical", dims)).toEqual({ width: 4, height: 2 });
    expect(sliceTextureSize("horizontal", dims)).toEqual({ width: 4, height: 3 });
    expect(sliceIndexCount("vertical", dims)).toBe(3);
    expect(sliceIndexCount("horizontal", dims)).toBe(2);
  });
});

describe("clampSliceIndex (R3 finding 1: single source for legend AND render)", () => {
  // Non-default dims: smaller ny/nz than the 128x128x64 defaults.
  const smallDims: Dims = { nx: 128, ny: 64, nz: 32 };

  it("clamps an out-of-range request to the index actually rendered", () => {
    // A stale slider allowing j = 100 on ny = 64 must show — and CLAIM — j = 63.
    expect(clampSliceIndex("vertical", 100, smallDims)).toBe(63);
    expect(clampSliceIndex("horizontal", 100, smallDims)).toBe(31);
    expect(clampSliceIndex("vertical", -5, smallDims)).toBe(0);
  });

  it("passes in-range indices through unchanged and rounds fractional slider values", () => {
    expect(clampSliceIndex("vertical", 32, smallDims)).toBe(32);
    expect(clampSliceIndex("horizontal", 15, smallDims)).toBe(15);
    expect(clampSliceIndex("vertical", 31.6, smallDims)).toBe(32);
  });

  it("maps ALL non-finite input to 0 instead of NaN-poisoning the texture lookup", () => {
    expect(clampSliceIndex("vertical", Number.NaN, smallDims)).toBe(0);
    expect(clampSliceIndex("horizontal", Number.POSITIVE_INFINITY, smallDims)).toBe(0);
    expect(clampSliceIndex("horizontal", Number.NEGATIVE_INFINITY, smallDims)).toBe(0);
  });

  it("reset-time re-centering: the domain center is always within the new bounds", () => {
    // The ready handler re-centers the slice on the solver's center; that center must be a
    // fixed point of the clamp (legend == request == render) for any dims.
    for (const d of [smallDims, { nx: 9, ny: 7, nz: 5 }, { nx: 128, ny: 128, nz: 64 }]) {
      const [, jc, kc] = domainCenter(d);
      expect(clampSliceIndex("vertical", jc, d)).toBe(jc);
      expect(clampSliceIndex("horizontal", kc, d)).toBe(kc);
    }
  });
});

describe("extractSlice", () => {
  it("vertical (fixed j): tex[k * nx + i] = field[idx(i, j, k)]", () => {
    const field = uniqueField();
    const tex = extractSlice("vertical", field, dims, 1);
    expect(tex).toHaveLength(4 * 2);
    for (let k = 0; k < dims.nz; k++) {
      for (let i = 0; i < dims.nx; i++) {
        expect(tex[k * dims.nx + i]).toBe(field[idx(dims, i, 1, k)]);
      }
    }
  });

  it("horizontal (fixed k): tex[j * nx + i] = field[idx(i, j, k)]", () => {
    const field = uniqueField();
    const tex = extractSlice("horizontal", field, dims, 1);
    expect(tex).toHaveLength(4 * 3);
    for (let j = 0; j < dims.ny; j++) {
      for (let i = 0; i < dims.nx; i++) {
        expect(tex[j * dims.nx + i]).toBe(field[idx(dims, i, j, 1)]);
      }
    }
  });

  it("different slice indices read different data (nothing hardcoded to the center)", () => {
    const field = uniqueField();
    expect(extractSlice("vertical", field, dims, 0)).not.toEqual(
      extractSlice("vertical", field, dims, 2),
    );
  });
});

describe("sliceWorldMatrix", () => {
  const offset: readonly [number, number, number] = [0.3, -0.2, 0.7];

  it("vertical: every texel center lands on cartesian(i, j, k) - offset", () => {
    const j = 1;
    const m = sliceWorldMatrix("vertical", j, dims, offset);
    const { width, height } = sliceTextureSize("vertical", dims);
    for (let k = 0; k < dims.nz; k++) {
      for (let i = 0; i < dims.nx; i++) {
        const [lx, ly] = texelCenterLocal(i, k, width, height);
        const world = apply(m, lx, ly, 0);
        const expected = cartesian(i, j, k);
        expect(world[0]).toBeCloseTo(expected[0] - offset[0], 10);
        expect(world[1]).toBeCloseTo(expected[1] - offset[1], 10);
        expect(world[2]).toBeCloseTo(expected[2] - offset[2], 10);
      }
    }
  });

  it("horizontal: the j/2 row shear of the embedding is carried by the matrix", () => {
    const k = 1;
    const m = sliceWorldMatrix("horizontal", k, dims, offset);
    const { width, height } = sliceTextureSize("horizontal", dims);
    for (let j = 0; j < dims.ny; j++) {
      for (let i = 0; i < dims.nx; i++) {
        const [lx, ly] = texelCenterLocal(i, j, width, height);
        const world = apply(m, lx, ly, 0);
        const expected = cartesian(i, j, k);
        expect(world[0]).toBeCloseTo(expected[0] - offset[0], 10);
        expect(world[1]).toBeCloseTo(expected[1] - offset[1], 10);
        expect(world[2]).toBeCloseTo(expected[2] - offset[2], 10);
      }
    }
  });

  it("the two orientations at asymmetric indices do not coincide", () => {
    expect(sliceWorldMatrix("vertical", 1, dims, offset)).not.toEqual(
      sliceWorldMatrix("horizontal", 1, dims, offset),
    );
  });
});
