// PGM (P5, binary, maxval 255) field dumps — the day-one observability the charter demands:
// a malformed crystal can look plausibly organic; a malformed field is obvious immediately.
//
// Images are (nx x ny) over the AXIAL (i, j) plane — the hexagonal lattice drawn on a square
// raster, so the picture is sheared 30° relative to cartesian space. Fine for debugging;
// stated in each file's comment line.

import { paramSlot, type Dims, type GGParams } from "@vcc/core";
import type { GGSolver } from "@vcc/solver-cpu";

export function encodePGM(
  width: number,
  height: number,
  values: Float64Array,
  min: number,
  max: number,
  comment: string,
): Uint8Array {
  const header = `P5\n# ${comment}\n${width} ${height}\n255\n`;
  const headerBytes = new TextEncoder().encode(header);
  const out = new Uint8Array(headerBytes.length + width * height);
  out.set(headerBytes, 0);
  const span = max > min ? max - min : 1;
  for (let p = 0; p < width * height; p++) {
    let v = (values[p] - min) / span;
    if (v < 0) v = 0;
    if (v > 1) v = 1;
    out[headerBytes.length + p] = Math.round(v * 255);
  }
  return out;
}

/** Mid-plane (k = kc) slice of the vapor field d, scaled to [0, rho]. */
export function vaporSlicePGM(solver: GGSolver, kc: number): Uint8Array {
  const { nx, ny } = solver.dims;
  const plane = nx * ny;
  const slice = new Float64Array(plane);
  slice.set(solver.d.subarray(kc * plane, (kc + 1) * plane));
  return encodePGM(
    nx,
    ny,
    slice,
    0,
    solver.params.rho,
    `vapor d, slice k=${kc}, tick ${solver.tick}, axial (i,j) raster; scale [0, rho=${solver.params.rho}]`,
  );
}

/**
 * Surface propensity, mid-plane slice: for boundary cells, b / ggThreshBeta(n_T, n_Z) under
 * GGThreshold — how close each boundary cell is to attaching. 1.0 = at threshold. Scaled to
 * [0, 2]. Non-boundary cells are 0; attached cells are painted at full scale for context.
 */
export function propensitySlicePGM(solver: GGSolver, kc: number): Uint8Array {
  const { nx, ny } = solver.dims;
  const plane = nx * ny;
  const slice = new Float64Array(plane);
  const params: GGParams = solver.params;
  for (const x of solver.boundaryCells()) {
    const k = Math.floor(x / plane);
    if (k !== kc) continue;
    const [rawNT, rawNZ] = solver.neighborCounts(x);
    const nT = rawNT < 3 ? rawNT : 3;
    const nZ = rawNZ > 0 ? 1 : 0;
    slice[x - kc * plane] = solver.b[x] / params.ggThreshBeta[paramSlot(nT, nZ)];
  }
  for (let p = 0; p < plane; p++) {
    if (solver.a[kc * plane + p] === 1) slice[p] = 2;
  }
  return encodePGM(
    nx,
    ny,
    slice,
    0,
    2,
    `surface propensity b/ggThreshBeta, slice k=${kc}, tick ${solver.tick}, axial raster; attached painted 2.0`,
  );
}

/** Top-down occupancy: max of a over k. */
export function occupancyTopDownPGM(solver: GGSolver): Uint8Array {
  const { nx, ny, nz } = solver.dims;
  const plane = nx * ny;
  const image = new Float64Array(plane);
  for (let k = 0; k < nz; k++) {
    const base = k * plane;
    for (let p = 0; p < plane; p++) {
      if (solver.a[base + p] === 1) image[p] = 1;
    }
  }
  return encodePGM(
    nx,
    ny,
    image,
    0,
    1,
    `occupancy max_k(a), tick ${solver.tick}, axial (i,j) raster`,
  );
}

export type { Dims };
