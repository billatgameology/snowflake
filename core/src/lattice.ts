// The stacked triangular lattice T x Z (gg-machinery §1).
//
// Flat arrays with axial coordinates (i, j, k), idx = k*(nx*ny) + j*nx + i.
// 8 neighbors: 6 in-plane (T) + 2 vertical (Z). The fundamental cell is a hexagonal prism
// with across-flats = 1 and height = 1, so all 8 bonds have unit length.

export interface Dims {
  readonly nx: number;
  readonly ny: number;
  readonly nz: number;
}

export function cellCount(dims: Dims): number {
  return dims.nx * dims.ny * dims.nz;
}

export function idx(dims: Dims, i: number, j: number, k: number): number {
  return k * (dims.nx * dims.ny) + j * dims.nx + i;
}

export function coordsOf(dims: Dims, index: number): [number, number, number] {
  const plane = dims.nx * dims.ny;
  const k = Math.floor(index / plane);
  const r = index - k * plane;
  const j = Math.floor(r / dims.nx);
  const i = r - j * dims.nx;
  return [i, j, k];
}

/** T-neighbor axial offsets, fixed canonical order (gg-machinery §1). */
export const T_NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

/** Flat-array offsets of the 6 T-neighbors — valid in the interior only (i, j not on a face). */
export function tNeighborFlatOffsets(dims: Dims): Int32Array {
  const nx = dims.nx;
  return new Int32Array([1, -1, nx, -nx, 1 - nx, -1 + nx]);
}

/** Flat-array offsets of the 2 Z-neighbors — valid when k not on a face. */
export function zNeighborFlatOffsets(dims: Dims): Int32Array {
  const plane = dims.nx * dims.ny;
  return new Int32Array([plane, -plane]);
}

/**
 * Bounds-checked gather of all 8 neighbors (6 T then 2 Z, canonical order).
 * Out-of-domain neighbors are -1. For the domain shell; use flat offsets in the interior.
 */
export function neighborIndices(
  dims: Dims,
  i: number,
  j: number,
  k: number,
  out?: Int32Array,
): Int32Array {
  const result = out ?? new Int32Array(8);
  for (let n = 0; n < 6; n++) {
    const off = T_NEIGHBOR_OFFSETS[n];
    const ni = i + off[0];
    const nj = j + off[1];
    result[n] =
      ni >= 0 && ni < dims.nx && nj >= 0 && nj < dims.ny ? idx(dims, ni, nj, k) : -1;
  }
  result[6] = k + 1 < dims.nz ? idx(dims, i, j, k + 1) : -1;
  result[7] = k - 1 >= 0 ? idx(dims, i, j, k - 1) : -1;
  return result;
}

/** Cartesian embedding (gg-machinery §1): x = i + j/2, y = j*sqrt(3)/2, z = k. */
export function cartesian(i: number, j: number, k: number): [number, number, number] {
  return [i + j / 2, (j * Math.sqrt(3)) / 2, k];
}

// ── D6h symmetry operators (gg-machinery §1) ────────────────────────────────────────────────
// rot60(i, j) = (-j, i+j); mirror(i, j) = (j, i); zmirror(k) = 2*kc - k.
// All are exact on the integer lattice; applied about a center site (ic, jc, kc).

export function rot60(
  i: number,
  j: number,
  ic: number,
  jc: number,
): [number, number] {
  const di = i - ic;
  const dj = j - jc;
  return [ic - dj, jc + di + dj];
}

export function mirror(
  i: number,
  j: number,
  ic: number,
  jc: number,
): [number, number] {
  const di = i - ic;
  const dj = j - jc;
  return [ic + dj, jc + di];
}

export function zmirror(k: number, kc: number): number {
  return 2 * kc - k;
}

/** Hex (graph) distance on T in axial coordinates. */
export function hexDistance(di: number, dj: number): number {
  return (Math.abs(di) + Math.abs(dj) + Math.abs(di + dj)) / 2;
}

/** Default domain center: the site everything symmetric is centered on. */
export function domainCenter(dims: Dims): [number, number, number] {
  return [Math.floor(dims.nx / 2), Math.floor(dims.ny / 2), Math.floor(dims.nz / 2)];
}

/**
 * Canonical seed (gg-machinery §5): hexagonal plate of the given radius and thickness,
 * centered on `center`. radius=2, thickness=1 gives 19 sites (3r^2+3r+1) — NOT 20; the
 * paper's "20 sites" is a documented erratum (any C6-symmetric set has |S| = 0 or 1 mod 6).
 * Seed size stays a parameter so the 20-site variant can be run deliberately; the symmetry
 * metric rejects it.
 *
 * Thickness must be odd so the seed is zmirror-symmetric about the center plane.
 */
export function hexSeedSites(
  dims: Dims,
  radius: number,
  thickness: number,
  center?: readonly [number, number, number],
): number[] {
  if (!Number.isInteger(thickness) || thickness < 1 || thickness % 2 === 0) {
    throw new Error(`seed thickness must be odd and >= 1, got ${thickness}`);
  }
  if (!Number.isInteger(radius) || radius < 0) {
    throw new Error(`seed radius must be a non-negative integer, got ${radius}`);
  }
  const [ic, jc, kc] = center ?? domainCenter(dims);
  const half = (thickness - 1) / 2;
  const sites: number[] = [];
  for (let k = kc - half; k <= kc + half; k++) {
    if (k < 0 || k >= dims.nz) throw new Error("seed does not fit the domain (z)");
    for (let dj = -radius; dj <= radius; dj++) {
      for (let di = -radius; di <= radius; di++) {
        if (hexDistance(di, dj) > radius) continue;
        const i = ic + di;
        const j = jc + dj;
        if (i < 0 || i >= dims.nx || j < 0 || j >= dims.ny) {
          throw new Error("seed does not fit the domain (xy)");
        }
        sites.push(idx(dims, i, j, k));
      }
    }
  }
  return sites;
}
