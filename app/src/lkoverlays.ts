// LibbrechtKinetics surface overlays (V4-3) and per-operator overlay honesty.
//
// The G-G threshold-progress overlay ("growthPropensity", b / ggThreshBeta) is UNDEFINED for
// LibbrechtKinetics state: LK has no boundary mass b and no G-G thresholds. When LK state is
// displayed it is REPLACED by the LK boundary-growth propensity defined below, and every G-G
// overlay is rejected by name (assertOverlayHonest). Symmetrically, LK overlays are rejected
// for GGThreshold state.
//
// LK boundary-growth propensity — exact definition (documented per the V4-3 requirement):
//   For a rendered surface cell (attached, a = 1), consider every adjacent boundary pixel:
//   an in-domain, free (a = 0), non-wall neighbor over the 6 in-plane T-directions and the
//   2 z-directions. Each such pixel is adjacent to this attached cell, so it is a boundary
//   pixel by construction. Its contribution is
//       classifyFacet(rawNT, rawNZ, surfacePolicy) === "inhibited"  ->  0
//       otherwise                                                   ->  f[pixel]
//   where rawNT in [0,6] / rawNZ in [0,2] are the pixel's UNCAPPED attached-neighbor counts
//   and f is the LK boundary fill. The overlay value is the MAX contribution over adjacent
//   boundary pixels, NaN when the cell has none.
//
//   Why this is correct under the coupled policy (attachment-kinetics §4.4, ADR 0009): a
//   boundary pixel attaches exactly when its fill f reaches 1, and v4 fill accumulates as
//   alphaHK * vKin * sigmaB * dt / (hB * dx) — so for a kinetically active pixel, f IS the
//   fraction of the attachment threshold already accumulated. An "inhibited" pixel ([10]
//   under aggregate-hv-g1h1-v4) has alphaHK = 0: no kinetic fill accrues, so its stored fill
//   is not a propensity to grow now and it reads 0. The quantity is a unitless fraction of
//   the attachment threshold — deliberately parallel to the G-G overlay's meaning, computed
//   from LK's own state and policy, never from b or ggThreshBeta.
//
// Pure over typed arrays (no DOM, no three.js) so every quantity unit-tests in node.

import { T_NEIGHBOR_OFFSETS, classifyFacet, type Dims, type LKSurfacePolicy } from "@vcc/core";
import { OVERLAY_NAMES, attachedNeighborCountsUncapped } from "./overlays.ts";
import type { OperatorName } from "./display.ts";

export type LKOverlayName =
  | "none"
  | "lkSigmaAvailability"
  | "lkBoundaryFill"
  | "lkGrowthPropensity";

export const LK_OVERLAY_NAMES: readonly LKOverlayName[] = [
  "none",
  "lkSigmaAvailability",
  "lkBoundaryFill",
  "lkGrowthPropensity",
];

/** Everything LK overlay evaluation needs from a loaded LK state. */
export interface LKOverlayContext {
  readonly dims: Dims;
  readonly a: Uint8Array;
  readonly wall: Uint8Array | null;
  /** Boundary fill f, f32 display copy. */
  readonly f: Float32Array;
  /** Dimensionless supersaturation sigma, f32 display copy. */
  readonly sigma: Float32Array;
  readonly surfacePolicy: LKSurfacePolicy;
}

/** §1.5-honest display strings for the LK overlay set. */
export const LK_OVERLAY_LABELS: Readonly<
  Record<LKOverlayName, { readonly title: string; readonly definition: string }>
> = {
  none: {
    title: "no overlay",
    definition: "uniform material color; no field shown",
  },
  lkSigmaAvailability: {
    title: "sigma availability",
    definition:
      "mean supersaturation sigma over the cell's free neighbors (dimensionless, computed " +
      "state, unvalidated)",
  },
  lkBoundaryFill: {
    title: "boundary fill f",
    definition:
      "max stored fill f over adjacent boundary pixels, including kinetically inhibited ones " +
      "(dimensionless fill fraction in [0, 1], computed state, unvalidated)",
  },
  lkGrowthPropensity: {
    title: "LK growth propensity",
    definition:
      "max over adjacent boundary pixels of (inhibited under the surface policy ? 0 : fill f) " +
      "— fraction of the f = 1 attachment threshold already accumulated by a kinetically " +
      "active pixel (unitless fraction, computed state, unvalidated)",
  },
};

function inDomain(dims: Dims, i: number, j: number, k: number): boolean {
  return i >= 0 && i < dims.nx && j >= 0 && j < dims.ny && k >= 0 && k < dims.nz;
}

function isFreeCell(ctx: LKOverlayContext, index: number): boolean {
  return ctx.a[index] === 0 && (ctx.wall === null || ctx.wall[index] === 0);
}

/**
 * LK overlay value for one cell (normally a rendered surface cell). NaN = undefined for this
 * cell (no qualifying neighbors); the renderer shows NaN as the distinct no-data gray.
 */
export function lkOverlayValueAt(
  name: LKOverlayName,
  ctx: LKOverlayContext,
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

    case "lkSigmaAvailability": {
      let sum = 0;
      let count = 0;
      const consider = (ni: number, nj: number, nk: number): void => {
        if (!inDomain(ctx.dims, ni, nj, nk)) return;
        const y = nk * plane + nj * nx + ni;
        if (!isFreeCell(ctx, y)) return;
        sum += ctx.sigma[y];
        count++;
      };
      for (const [di, dj] of T_NEIGHBOR_OFFSETS) consider(i + di, j + dj, k);
      consider(i, j, k + 1);
      consider(i, j, k - 1);
      return count === 0 ? Number.NaN : sum / count;
    }

    case "lkBoundaryFill":
    case "lkGrowthPropensity": {
      let best = Number.NaN;
      const consider = (ni: number, nj: number, nk: number): void => {
        if (!inDomain(ctx.dims, ni, nj, nk)) return;
        const y = nk * plane + nj * nx + ni;
        if (!isFreeCell(ctx, y)) return;
        let value: number;
        if (name === "lkBoundaryFill") {
          value = ctx.f[y];
        } else {
          const [rawNT, rawNZ] = attachedNeighborCountsUncapped(ctx.a, ctx.dims, ni, nj, nk);
          // A free neighbor of an attached cell always has rawNT + rawNZ >= 1; [00] would be
          // a topology error and classifyFacet would rightly throw on it.
          const facet = classifyFacet(rawNT, rawNZ, ctx.surfacePolicy);
          value = facet === "inhibited" ? 0 : ctx.f[y];
        }
        if (Number.isNaN(best) || value > best) best = value;
      };
      for (const [di, dj] of T_NEIGHBOR_OFFSETS) consider(i + di, j + dj, k);
      consider(i, j, k + 1);
      consider(i, j, k - 1);
      return best;
    }
  }
}

/** LK overlay values for a list of flat cell indices (the instanced surface cells). */
export function lkOverlayValuesFor(
  name: LKOverlayName,
  ctx: LKOverlayContext,
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
    out[n] = lkOverlayValueAt(name, ctx, i, j, k);
  }
  return out;
}

/**
 * Per-operator overlay honesty (V4-3): a quantity defined on one operator's state must never
 * be evaluated against the other's. "none" is operator-neutral. Throws by name; callers that
 * want a boolean catch it.
 */
export function assertOverlayHonest(operator: OperatorName, overlay: string): void {
  if (overlay === "none") return;
  const isGGName = (OVERLAY_NAMES as readonly string[]).includes(overlay);
  const isLKName = (LK_OVERLAY_NAMES as readonly string[]).includes(overlay);
  if (!isGGName && !isLKName) {
    throw new Error(`unknown overlay quantity: ${overlay}`);
  }
  if (operator === "GGThreshold" && !isGGName) {
    throw new Error(
      `overlay honesty: "${overlay}" is a LibbrechtKinetics quantity and is undefined on ` +
        `GGThreshold state (no f, no sigma)`,
    );
  }
  if (operator === "LibbrechtKinetics" && !isLKName) {
    throw new Error(
      `overlay honesty: "${overlay}" is a GGThreshold quantity and is undefined on ` +
        `LibbrechtKinetics state (no boundary mass b, no G-G thresholds); use the LK ` +
        `boundary-growth propensity instead`,
    );
  }
}
