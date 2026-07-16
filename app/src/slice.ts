// Slice plane through the vapor field d (A3-2): texture extraction and world placement.
//
// Pure math (no three.js) so the axis mapping unit-tests in node — a transposed slice is a
// classic silent bug, so extraction and placement are pinned to cartesian() by tests with
// asymmetric fixtures rather than by eyeball.
//
// Conventions, explicit:
// - "vertical" = constant j (the Berg view through the crystal center): texture u <-> i,
//   v <-> k. The plane's world position carries the j/2 shear of the embedding.
// - "horizontal" = constant k: texture u <-> i, v <-> j. The plane is SHEARED in world x by
//   j/2 per row, exactly like the lattice rows themselves, so texels sit over their cells.
// - Texel (u, v) center corresponds to lattice cell exactly; texture row v = plane-local
//   y_l = (v + 0.5)/h - 0.5 (three.js PlaneGeometry UV convention, DataTexture flipY=false).

import { idx, type Dims } from "@vcc/core";

export type SliceOrientation = "vertical" | "horizontal";

export function sliceTextureSize(
  orientation: SliceOrientation,
  dims: Dims,
): { width: number; height: number } {
  return orientation === "vertical"
    ? { width: dims.nx, height: dims.nz }
    : { width: dims.nx, height: dims.ny };
}

/** Number of valid slice indices along the plane's normal. */
export function sliceIndexCount(orientation: SliceOrientation, dims: Dims): number {
  return orientation === "vertical" ? dims.ny : dims.nz;
}

/**
 * The slice index actually rendered for a requested slider value: rounded and clamped into
 * the domain. SINGLE SOURCE OF TRUTH — the render path and the legend must both go through
 * this function, so the label can never claim an index the texture does not show (§1.5:
 * a legend that disagrees with the render is a mislabel, R3 finding 1).
 */
export function clampSliceIndex(
  orientation: SliceOrientation,
  requested: number,
  dims: Dims,
): number {
  if (!Number.isFinite(requested)) return 0;
  const max = sliceIndexCount(orientation, dims) - 1;
  const rounded = Math.round(requested);
  return rounded < 0 ? 0 : rounded > max ? max : rounded;
}

/**
 * Extract the slice's field values, row-major tex[v * width + u].
 * vertical (fixed j = index): tex[k * nx + i] = field[idx(i, index, k)]
 * horizontal (fixed k = index): tex[j * nx + i] = field[idx(i, j, index)]
 */
export function extractSlice(
  orientation: SliceOrientation,
  field: Float32Array,
  dims: Dims,
  index: number,
): Float32Array {
  const { width, height } = sliceTextureSize(orientation, dims);
  const out = new Float32Array(width * height);
  if (orientation === "vertical") {
    for (let v = 0; v < height; v++) {
      for (let u = 0; u < width; u++) {
        out[v * width + u] = field[idx(dims, u, index, v)];
      }
    }
  } else {
    for (let v = 0; v < height; v++) {
      for (let u = 0; u < width; u++) {
        out[v * width + u] = field[idx(dims, u, v, index)];
      }
    }
  }
  return out;
}

/**
 * World transform for a unit PlaneGeometry (local x_l, y_l in [-1/2, 1/2], UV (0,0) at
 * (-1/2, -1/2)) so texel centers land exactly on cartesian(i, j, k) - offset. Returned
 * row-major (16 numbers) for three's Matrix4.set.
 *
 * Derivation (embedding x = i + j/2, y = j*sqrt(3)/2, z = k; cell c at local
 * ((c + 0.5)/n - 0.5)):
 * - vertical, fixed j:   world = (nx*x_l + (nx-1)/2 + j/2 - ox,  z_l + j*sqrt(3)/2 - oy,
 *                                 nz*y_l + (nz-1)/2 - oz)
 * - horizontal, fixed k: world = (nx*x_l + (ny/2)*y_l + (nx-1)/2 + (ny-1)/4 - ox,
 *                                 (ny*sqrt(3)/2)*y_l + ((ny-1)/2)*(sqrt(3)/2) - oy,
 *                                 z_l + k - oz)
 * The local z axis maps to the plane normal (kept unit so the matrix stays invertible).
 */
export function sliceWorldMatrix(
  orientation: SliceOrientation,
  index: number,
  dims: Dims,
  offset: readonly [number, number, number],
): number[] {
  const { nx, ny, nz } = dims;
  const [ox, oy, oz] = offset;
  const s3h = Math.sqrt(3) / 2;
  if (orientation === "vertical") {
    const tx = (nx - 1) / 2 + index / 2 - ox;
    const ty = index * s3h - oy;
    const tz = (nz - 1) / 2 - oz;
    // prettier-ignore
    return [
      nx, 0,  0, tx,
      0,  0,  1, ty,
      0,  nz, 0, tz,
      0,  0,  0, 1,
    ];
  }
  const tx = (nx - 1) / 2 + (ny - 1) / 4 - ox;
  const ty = ((ny - 1) / 2) * s3h - oy;
  const tz = index - oz;
  // prettier-ignore
  return [
    nx, ny / 2,   0, tx,
    0,  ny * s3h, 0, ty,
    0,  0,        1, tz,
    0,  0,        0, 1,
  ];
}

/** Plane-local coordinates of a texel center — the test-side inverse of the matrix above. */
export function texelCenterLocal(
  u: number,
  v: number,
  width: number,
  height: number,
): [number, number] {
  return [(u + 0.5) / width - 0.5, (v + 0.5) / height - 0.5];
}
