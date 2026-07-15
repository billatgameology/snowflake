// Morphology metrics (charter §3.1; plan, Stage 2a "core/metrics").
//
// Every scientific milestone is an automated metric, not a screenshot (charter §3.3).
// Conventions are documented at each metric — a metric with an undocumented convention is a
// feeling with digits.

import {
  cartesian,
  cellCount,
  coordsOf,
  idx,
  mirror,
  rot60,
  zmirror,
  type Dims,
} from "./lattice.ts";
import { paramSlot, type GGParams } from "./params.ts";

// ── Summation ───────────────────────────────────────────────────────────────────────────────
// Naive summation over ~1e6 f64 cells has worst-case relative error of order n*eps ≈ 1e-10 —
// at the mass-gate tolerance itself. Kahan-Babuska-Neumaier keeps the measurement well below
// the quantity it measures.

/** Neumaier-compensated sum of (b[i] + d[i]) over all cells. */
export function totalMass(b: Float64Array, d: Float64Array): number {
  let sum = 0;
  let compensation = 0;
  for (let i = 0; i < b.length; i++) {
    const value = b[i] + d[i];
    const t = sum + value;
    if (Math.abs(sum) >= Math.abs(value)) {
      compensation += sum - t + value;
    } else {
      compensation += value - t + sum;
    }
    sum = t;
  }
  return sum + compensation;
}

// ── D6h symmetry error ──────────────────────────────────────────────────────────────────────
// |A Δ g(A)| / |A| for each generator g in {rot60, mirror, zmirror} about the center site;
// reported value is the max over generators. Since g is a bijection of the infinite lattice,
// |A Δ g(A)| = 2*(|A| - |A ∩ g(A)|); an image falling outside the domain counts as "not in
// A". Exactly 0 iff A is invariant under the full group; the smallest nonzero value is 2/|A|,
// so there is no meaningful "small but nonzero" (plan, Done when).

export function symmetryError(
  a: Uint8Array,
  dims: Dims,
  center: readonly [number, number, number],
): number {
  const [ic, jc, kc] = center;
  let attached = 0;
  let inRot = 0;
  let inMirror = 0;
  let inZmirror = 0;
  const n = cellCount(dims);
  for (let index = 0; index < n; index++) {
    if (a[index] === 0) continue;
    attached++;
    const [i, j, k] = coordsOf(dims, index);

    const [ri, rj] = rot60(i, j, ic, jc);
    if (ri >= 0 && ri < dims.nx && rj >= 0 && rj < dims.ny && a[idx(dims, ri, rj, k)] === 1) {
      inRot++;
    }
    const [mi, mj] = mirror(i, j, ic, jc);
    if (mi >= 0 && mi < dims.nx && mj >= 0 && mj < dims.ny && a[idx(dims, mi, mj, k)] === 1) {
      inMirror++;
    }
    const zk = zmirror(k, kc);
    if (zk >= 0 && zk < dims.nz && a[idx(dims, i, j, zk)] === 1) {
      inZmirror++;
    }
  }
  if (attached === 0) return 0;
  const worst = Math.min(inRot, inMirror, inZmirror);
  return (2 * (attached - worst)) / attached;
}

/**
 * Exact incremental form of the symmetry gate: if A_t is D6h-invariant and every tick's set
 * of NEW attachments is D6h-invariant, then A_{t+1} is invariant (attachment is permanent, so
 * A only grows; g(A ∪ Δ) = g(A) ∪ g(Δ)). Checking Δ each tick is O(|Δ|), which makes
 * "symmetry error exactly 0 across the entire run" affordable; the full |A Δ g(A)|/|A| is
 * still computed periodically and at the end as belt and braces.
 */
export function isD6hInvariantSet(
  indices: Iterable<number>,
  dims: Dims,
  center: readonly [number, number, number],
): boolean {
  const set = indices instanceof Set ? (indices as Set<number>) : new Set(indices);
  const [ic, jc, kc] = center;
  for (const index of set) {
    const [i, j, k] = coordsOf(dims, index);
    const [ri, rj] = rot60(i, j, ic, jc);
    if (ri < 0 || ri >= dims.nx || rj < 0 || rj >= dims.ny || !set.has(idx(dims, ri, rj, k))) {
      return false;
    }
    const [mi, mj] = mirror(i, j, ic, jc);
    if (mi < 0 || mi >= dims.nx || mj < 0 || mj >= dims.ny || !set.has(idx(dims, mi, mj, k))) {
      return false;
    }
    const zk = zmirror(k, kc);
    if (zk < 0 || zk >= dims.nz || !set.has(idx(dims, i, j, zk))) return false;
  }
  return true;
}

// ── Extents ─────────────────────────────────────────────────────────────────────────────────

export interface LatticeBBox {
  readonly iMin: number;
  readonly iMax: number;
  readonly jMin: number;
  readonly jMax: number;
  readonly kMin: number;
  readonly kMax: number;
  readonly attachedCount: number;
}

export function latticeBBox(a: Uint8Array, dims: Dims): LatticeBBox | null {
  let iMin = Infinity, iMax = -Infinity, jMin = Infinity, jMax = -Infinity;
  let kMin = Infinity, kMax = -Infinity;
  let attachedCount = 0;
  const n = cellCount(dims);
  for (let index = 0; index < n; index++) {
    if (a[index] === 0) continue;
    attachedCount++;
    const [i, j, k] = coordsOf(dims, index);
    if (i < iMin) iMin = i;
    if (i > iMax) iMax = i;
    if (j < jMin) jMin = j;
    if (j > jMax) jMax = j;
    if (k < kMin) kMin = k;
    if (k > kMax) kMax = k;
  }
  if (attachedCount === 0) return null;
  return { iMin, iMax, jMin, jMax, kMin, kMax, attachedCount };
}

/**
 * Aspect ratio = z-extent / T-extent. Convention: z-extent = (kMax - kMin + 1) lattice
 * layers (cell height 1); T-extent = max of the cartesian x- and y-extents of attached cell
 * centers, + 1 (cell across-flats 1). Plate < 1, column/needle > 1.
 */
export function aspectRatio(a: Uint8Array, dims: Dims): number {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  let kMin = Infinity, kMax = -Infinity;
  let any = false;
  const n = cellCount(dims);
  for (let index = 0; index < n; index++) {
    if (a[index] === 0) continue;
    any = true;
    const [i, j, k] = coordsOf(dims, index);
    const [x, y] = cartesian(i, j, k);
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
    if (k < kMin) kMin = k;
    if (k > kMax) kMax = k;
  }
  if (!any) return Number.NaN;
  const zExtent = kMax - kMin + 1;
  const tExtent = Math.max(xMax - xMin, yMax - yMin) + 1;
  return zExtent / tExtent;
}

// ── Hollowness ──────────────────────────────────────────────────────────────────────────────
// Two numbers, deliberately (plan, Stage 2a):
//   crossSectionHollowness — per-z-slice 2D flood fill from the slice's in-plane border over
//     unattached cells (6-neighbor T-connectivity); unattached cells enclosed IN-PLANE are
//     cavity. Real hollow columns are open-ended tubes and score > 0 here.
//   sealedVoidFraction — 3D flood fill from the domain faces over unattached cells
//     (8-neighbor connectivity); unreached unattached cells are sealed voids. An open tube
//     scores 0 here; a closed shell scores > 0. Stricter, kept as the second number.
// Both are reported as cavity / (attached + cavity).

export function crossSectionHollowness(a: Uint8Array, dims: Dims): number {
  const { nx, ny, nz } = dims;
  const plane = nx * ny;
  const visited = new Uint8Array(plane);
  const stack = new Int32Array(plane);
  let cavity = 0;
  let attached = 0;

  for (let k = 0; k < nz; k++) {
    const base = k * plane;
    let sliceAttached = 0;
    for (let p = 0; p < plane; p++) if (a[base + p] === 1) sliceAttached++;
    attached += sliceAttached;
    if (sliceAttached === 0) continue; // nothing to enclose

    visited.fill(0);
    let top = 0;
    // Seed the fill from every free border cell of the slice.
    for (let i = 0; i < nx; i++) {
      for (const j of [0, ny - 1]) {
        const p = j * nx + i;
        if (a[base + p] === 0 && visited[p] === 0) {
          visited[p] = 1;
          stack[top++] = p;
        }
      }
    }
    for (let j = 0; j < ny; j++) {
      for (const i of [0, nx - 1]) {
        const p = j * nx + i;
        if (a[base + p] === 0 && visited[p] === 0) {
          visited[p] = 1;
          stack[top++] = p;
        }
      }
    }
    while (top > 0) {
      const p = stack[--top];
      const i = p % nx;
      const j = (p - i) / nx;
      // 6 T-neighbors, bounds-checked
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]) {
        const ni = i + di;
        const nj = j + dj;
        if (ni < 0 || ni >= nx || nj < 0 || nj >= ny) continue;
        const np = nj * nx + ni;
        if (visited[np] === 1 || a[base + np] === 1) continue;
        visited[np] = 1;
        stack[top++] = np;
      }
    }
    for (let p = 0; p < plane; p++) {
      if (a[base + p] === 0 && visited[p] === 0) cavity++;
    }
  }
  if (attached + cavity === 0) return 0;
  return cavity / (attached + cavity);
}

export function sealedVoidFraction(a: Uint8Array, dims: Dims): number {
  const { nx, ny, nz } = dims;
  const n = cellCount(dims);
  const visited = new Uint8Array(n);
  const stack: number[] = [];
  let attached = 0;
  for (let index = 0; index < n; index++) if (a[index] === 1) attached++;

  const push = (index: number): void => {
    if (a[index] === 0 && visited[index] === 0) {
      visited[index] = 1;
      stack.push(index);
    }
  };
  // Seed from all six domain faces.
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      push(idx(dims, 0, j, k));
      push(idx(dims, nx - 1, j, k));
    }
    for (let i = 0; i < nx; i++) {
      push(idx(dims, i, 0, k));
      push(idx(dims, i, ny - 1, k));
    }
  }
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      push(idx(dims, i, j, 0));
      push(idx(dims, i, j, nz - 1));
    }
  }
  while (stack.length > 0) {
    const index = stack.pop() as number;
    const [i, j, k] = coordsOf(dims, index);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || ni >= nx || nj < 0 || nj >= ny) continue;
      push(idx(dims, ni, nj, k));
    }
    if (k + 1 < nz) push(idx(dims, i, j, k + 1));
    if (k - 1 >= 0) push(idx(dims, i, j, k - 1));
  }
  let sealed = 0;
  for (let index = 0; index < n; index++) {
    if (a[index] === 0 && visited[index] === 0) sealed++;
  }
  if (attached + sealed === 0) return 0;
  return sealed / (attached + sealed);
}

// ── Branch count ────────────────────────────────────────────────────────────────────────────
// Convention (documented per charter §3.1 / plan): take the mid-plane slice k = kc. Bin the
// attached cells into angular bins about the center (cartesian angles); the bin count adapts
// to the crystal's mid-plane radius so a bin spans ≈2 cells of arc (floor(pi*R), clamped to
// [12, 90]) — fixed fine bins at small radii read lattice discreteness as branches. The
// profile R[bin] is the max cartesian radius in the bin (0 for empty bins). If the profile's
// relative depth (Rmax - Rmin)/Rmax <= BRANCH_DEPTH_THRESHOLD, the crystal is compact:
// branch count 0. A PLAIN HEXAGON SCORES 0 BY CONSTRUCTION — its continuum depth is
// 1 - cos(30°) ≈ 0.134, below the 0.2 threshold. Otherwise the branch count is the number of
// circular runs of bins with R[bin] >= Rmin + (Rmax - Rmin)/2. A six-armed star scores 6.

export const BRANCH_MIN_BINS = 12;
export const BRANCH_MAX_BINS = 90;
export const BRANCH_DEPTH_THRESHOLD = 0.2;

export function branchCount(
  a: Uint8Array,
  dims: Dims,
  center: readonly [number, number, number],
): number {
  const [ic, jc, kc] = center;
  const [xc, yc] = cartesian(ic, jc, kc);
  const plane = dims.nx * dims.ny;
  const base = kc * plane;

  // Pass 1: mid-plane bounding radius sets the bin count.
  let rMax = 0;
  for (let p = 0; p < plane; p++) {
    if (a[base + p] === 0) continue;
    const i = p % dims.nx;
    const j = (p - i) / dims.nx;
    const [x, y] = cartesian(i, j, kc);
    const r = Math.hypot(x - xc, y - yc);
    if (r > rMax) rMax = r;
  }
  if (rMax <= 0) return 0;
  const bins = Math.min(BRANCH_MAX_BINS, Math.max(BRANCH_MIN_BINS, Math.floor(Math.PI * rMax)));

  // Pass 2: max radius per angular bin.
  const radiusByBin = new Float64Array(bins);
  for (let p = 0; p < plane; p++) {
    if (a[base + p] === 0) continue;
    const i = p % dims.nx;
    const j = (p - i) / dims.nx;
    const [x, y] = cartesian(i, j, kc);
    const dx = x - xc;
    const dy = y - yc;
    const r = Math.hypot(dx, dy);
    if (r === 0) continue;
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;
    let bin = Math.floor((angle / (2 * Math.PI)) * bins);
    if (bin >= bins) bin = bins - 1;
    if (r > radiusByBin[bin]) radiusByBin[bin] = r;
  }
  let rMin = Infinity;
  for (let bin = 0; bin < bins; bin++) {
    if (radiusByBin[bin] < rMin) rMin = radiusByBin[bin];
  }
  if ((rMax - rMin) / rMax <= BRANCH_DEPTH_THRESHOLD) return 0;
  const level = rMin + (rMax - rMin) / 2;
  let runs = 0;
  for (let bin = 0; bin < bins; bin++) {
    const here = radiusByBin[bin] >= level;
    const prev = radiusByBin[(bin + bins - 1) % bins] >= level;
    if (here && !prev) runs++;
  }
  if (runs === 0) return 1; // every bin above level yet depth > threshold: one lump
  return runs;
}

// ── Bounding radius, domain-contact guard, far-field vapor ─────────────────────────────────

/** Max cartesian distance of an attached cell from the center. */
export function boundingRadius(
  a: Uint8Array,
  dims: Dims,
  center: readonly [number, number, number],
): number {
  const [ic, jc, kc] = center;
  const [xc, yc, zc] = cartesian(ic, jc, kc);
  let rMax = 0;
  const n = cellCount(dims);
  for (let index = 0; index < n; index++) {
    if (a[index] === 0) continue;
    const [i, j, k] = coordsOf(dims, index);
    const [x, y, z] = cartesian(i, j, k);
    const r = Math.hypot(x - xc, y - yc, z - zc);
    if (r > rMax) rMax = r;
  }
  return rMax;
}

export const DOMAIN_CONTACT_FRACTION = 0.65;

/**
 * Domain-contact guard (charter §3.1, v1.2): true (INVALID) when the crystal's lattice
 * bounding box exceeds 65% of any domain extent. A crystal near the wall interacts with its
 * own mirror image while still looking plausible; flagged runs never enter validation
 * results.
 */
export function domainContact(a: Uint8Array, dims: Dims): boolean {
  const bbox = latticeBBox(a, dims);
  if (bbox === null) return false;
  return (
    bbox.iMax - bbox.iMin + 1 > DOMAIN_CONTACT_FRACTION * dims.nx ||
    bbox.jMax - bbox.jMin + 1 > DOMAIN_CONTACT_FRACTION * dims.ny ||
    bbox.kMax - bbox.kMin + 1 > DOMAIN_CONTACT_FRACTION * dims.nz
  );
}

/**
 * Far-field vapor level: mean of d over FREE cells of the six domain faces. This is the
 * paper's "density at the edge of the lattice" (§III); the §7 stopping rule compares it to
 * a fraction of rho (2rho/3 here).
 */
export function farFieldVapor(a: Uint8Array, d: Float64Array, dims: Dims): number {
  const { nx, ny, nz } = dims;
  let sum = 0;
  let compensation = 0;
  let count = 0;
  const add = (index: number): void => {
    if (a[index] === 1) return;
    const value = d[index];
    const t = sum + value;
    if (Math.abs(sum) >= Math.abs(value)) {
      compensation += sum - t + value;
    } else {
      compensation += value - t + sum;
    }
    sum = t;
    count++;
  };
  const seen = new Set<number>();
  const addOnce = (index: number): void => {
    if (!seen.has(index)) {
      seen.add(index);
      add(index);
    }
  };
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      addOnce(idx(dims, 0, j, k));
      addOnce(idx(dims, nx - 1, j, k));
    }
    for (let i = 0; i < nx; i++) {
      addOnce(idx(dims, i, 0, k));
      addOnce(idx(dims, i, ny - 1, k));
    }
  }
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      addOnce(idx(dims, i, j, 0));
      addOnce(idx(dims, i, j, nz - 1));
    }
  }
  if (count === 0) return Number.NaN;
  return (sum + compensation) / count;
}

// ── The bundle the runner prints and the checkpoint records ────────────────────────────────

export interface Metrics {
  readonly tick: number;
  readonly attachedCount: number;
  readonly totalMass: number;
  readonly symmetryError: number;
  readonly aspectRatio: number;
  readonly crossSectionHollowness: number;
  readonly sealedVoidFraction: number;
  readonly branchCount: number;
  readonly boundingRadius: number;
  readonly domainContact: boolean;
  readonly farFieldVapor: number;
}

export function computeMetrics(
  a: Uint8Array,
  b: Float64Array,
  d: Float64Array,
  dims: Dims,
  center: readonly [number, number, number],
  tick: number,
  /**
   * On masked (hexPrism) domains the box faces are inert walls with d = 0, so the box-face
   * farFieldVapor below would be meaningless; the caller passes the solver's own far-field
   * shell mean instead.
   */
  farFieldOverride?: number,
): Metrics {
  const bbox = latticeBBox(a, dims);
  return {
    tick,
    attachedCount: bbox === null ? 0 : bbox.attachedCount,
    totalMass: totalMass(b, d),
    symmetryError: symmetryError(a, dims, center),
    aspectRatio: aspectRatio(a, dims),
    crossSectionHollowness: crossSectionHollowness(a, dims),
    sealedVoidFraction: sealedVoidFraction(a, dims),
    branchCount: branchCount(a, dims, center),
    boundingRadius: boundingRadius(a, dims, center),
    domainContact: domainContact(a, dims),
    farFieldVapor: farFieldOverride ?? farFieldVapor(a, d, dims),
  };
}
