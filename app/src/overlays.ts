// Surface-overlay quantities (A3-1): what each instanced prism is colored by.
//
// Pure over snapshot typed arrays (no DOM, no three.js) so every quantity unit-tests in node.
// All values are COMPUTED STATE of the GGThreshold model in model units, Evidence =
// unvalidated (charter §1.5); growth propensity is additionally phenomenological — it is
// progress toward G-G's attachment threshold, not a physical rate.

import { T_NEIGHBOR_OFFSETS, paramSlot, type Dims } from "@vcc/core";

export type OverlayName =
  | "none"
  | "vaporAvailability"
  | "growthPropensity"
  | "boundaryMass"
  | "growthRecency";

export const OVERLAY_NAMES: readonly OverlayName[] = [
  "none",
  "vaporAvailability",
  "growthPropensity",
  "boundaryMass",
  "growthRecency",
];

/** Everything overlay evaluation needs from the latest snapshot + run config. */
export interface OverlayContext {
  readonly dims: Dims;
  readonly a: Uint8Array;
  readonly wall: Uint8Array | null;
  readonly b: Float32Array;
  readonly d: Float32Array;
  readonly attachTick: Uint32Array;
  readonly tick: number;
  /** ggThreshBeta vector of the ACTIVE preset (slot-indexed, @vcc/core paramSlot). */
  readonly ggThreshBeta: Float64Array;
  /** Recency window W in model ticks (growthRecency overlay). */
  readonly recencyWindowTicks: number;
}

/** §1.5-honest display strings, shown in the legend and the picking readout. */
export const OVERLAY_LABELS: Readonly<
  Record<OverlayName, { readonly title: string; readonly definition: string }>
> = {
  none: {
    title: "no overlay",
    definition: "uniform material color; no field shown",
  },
  vaporAvailability: {
    title: "vapor availability",
    definition:
      "mean vapor d over the cell's free neighbors (computed state, model units, unvalidated)",
  },
  growthPropensity: {
    title: "growth propensity",
    definition:
      "max over adjacent boundary sites of b / ggThreshBeta(nT,nZ) — progress toward the G-G " +
      "attachment threshold (phenomenological, unitless fraction of the threshold, unvalidated)",
  },
  boundaryMass: {
    title: "boundary mass b",
    definition: "frozen boundary mass b of this cell (computed state, model units, unvalidated)",
  },
  growthRecency: {
    title: "recent growth",
    definition:
      "1 − (ticks since attachment)/W, clamped to [0,1]; seed cells read 0 " +
      "(derived metric: unitless, over a window of W model ticks; unvalidated)",
  },
};

function inDomain(dims: Dims, i: number, j: number, k: number): boolean {
  return i >= 0 && i < dims.nx && j >= 0 && j < dims.ny && k >= 0 && k < dims.nz;
}

/**
 * UNCAPPED attached-neighbor counts [nT, nZ] of cell (i, j, k), derived from the snapshot's
 * a field — the same quantities GGSolver maintains incrementally, recomputed independently.
 */
export function attachedNeighborCountsUncapped(
  a: Uint8Array,
  dims: Dims,
  i: number,
  j: number,
  k: number,
): [number, number] {
  const { nx, ny } = dims;
  const plane = nx * ny;
  const base = k * plane + j * nx + i;
  let nT = 0;
  for (const [di, dj] of T_NEIGHBOR_OFFSETS) {
    const ni = i + di;
    const nj = j + dj;
    if (inDomain(dims, ni, nj, k) && a[base + dj * nx + di] === 1) nT++;
  }
  let nZ = 0;
  if (k + 1 < dims.nz && a[base + plane] === 1) nZ++;
  if (k - 1 >= 0 && a[base - plane] === 1) nZ++;
  return [nT, nZ];
}

/** Cap counts exactly as GGSolver does for parameter lookup: nT <= 3, nZ <= 1. */
export function capForParamSlot(nT: number, nZ: number): [number, number] {
  return [nT < 3 ? nT : 3, nZ > 0 ? 1 : 0];
}

function isFreeCell(ctx: OverlayContext, index: number): boolean {
  return ctx.a[index] === 0 && (ctx.wall === null || ctx.wall[index] === 0);
}

/**
 * Overlay value for one cell (normally a surface cell). NaN = undefined for this cell
 * (e.g. no free neighbors); the renderer shows NaN as the distinct no-data gray.
 */
export function overlayValueAt(
  name: OverlayName,
  ctx: OverlayContext,
  i: number,
  j: number,
  k: number,
): number {
  const { nx, ny, nz } = ctx.dims;
  const plane = nx * ny;
  const base = k * plane + j * nx + i;

  switch (name) {
    case "none":
      return Number.NaN;

    case "vaporAvailability": {
      let sum = 0;
      let count = 0;
      for (const [di, dj] of T_NEIGHBOR_OFFSETS) {
        const ni = i + di;
        const nj = j + dj;
        if (!inDomain(ctx.dims, ni, nj, k)) continue;
        const y = base + dj * nx + di;
        if (isFreeCell(ctx, y)) {
          sum += ctx.d[y];
          count++;
        }
      }
      if (k + 1 < nz && isFreeCell(ctx, base + plane)) {
        sum += ctx.d[base + plane];
        count++;
      }
      if (k - 1 >= 0 && isFreeCell(ctx, base - plane)) {
        sum += ctx.d[base - plane];
        count++;
      }
      return count === 0 ? Number.NaN : sum / count;
    }

    case "growthPropensity": {
      // Adjacent boundary sites: free non-wall neighbors of this attached cell (they border
      // the crystal through this cell by construction). For each, progress toward G-G's
      // threshold with the CAPPED counts GGSolver uses for its parameter lookup.
      let best = Number.NaN;
      const consider = (ni: number, nj: number, nk: number): void => {
        if (!inDomain(ctx.dims, ni, nj, nk)) return;
        const y = nk * plane + nj * nx + ni;
        if (!isFreeCell(ctx, y)) return;
        const [rawNT, rawNZ] = attachedNeighborCountsUncapped(ctx.a, ctx.dims, ni, nj, nk);
        const [nT, nZ] = capForParamSlot(rawNT, rawNZ);
        const threshold = ctx.ggThreshBeta[paramSlot(nT, nZ)];
        const progress = ctx.b[y] / threshold;
        if (Number.isNaN(best) || progress > best) best = progress;
      };
      for (const [di, dj] of T_NEIGHBOR_OFFSETS) consider(i + di, j + dj, k);
      consider(i, j, k + 1);
      consider(i, j, k - 1);
      return best;
    }

    case "boundaryMass":
      return ctx.b[base];

    case "growthRecency": {
      const attachedAt = ctx.attachTick[base];
      if (attachedAt === 0) return 0; // seed (or never-attached; surface cells are attached)
      const age = ctx.tick - attachedAt;
      const w = ctx.recencyWindowTicks;
      const recency = 1 - age / (w > 0 ? w : 1);
      return recency < 0 ? 0 : recency > 1 ? 1 : recency;
    }
  }
}

/** Overlay values for a list of flat cell indices (the instanced surface cells). */
export function overlayValuesFor(
  name: OverlayName,
  ctx: OverlayContext,
  cellIndices: Uint32Array,
): Float32Array {
  const { nx, ny } = ctx.dims;
  const plane = nx * ny;
  const out = new Float32Array(cellIndices.length);
  for (let n = 0; n < cellIndices.length; n++) {
    const x = cellIndices[n];
    const k = Math.floor(x / plane);
    const r = x - k * plane;
    const j = Math.floor(r / nx);
    const i = r - j * nx;
    out[n] = overlayValueAt(name, ctx, i, j, k);
  }
  return out;
}
