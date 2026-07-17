// Cell-picking readout for LibbrechtKinetics state (V4-3): reads the ACTUAL loaded field and
// surface state with the correct unit labels. No G-G boundary mass, no G-G thresholds, no
// invented units. Pure (no DOM) so labels and numbers unit-test in node.

import { classifyFacet, type FacetClass } from "@vcc/core";
import { attachedNeighborCountsUncapped } from "./overlays.ts";
import {
  LK_OVERLAY_LABELS,
  lkOverlayValueAt,
  type LKOverlayContext,
  type LKOverlayName,
} from "./lkoverlays.ts";

export interface LKPickInfo {
  readonly i: number;
  readonly j: number;
  readonly k: number;
  readonly attached: boolean;
  readonly wall: boolean;
  /** Boundary fill f (dimensionless fraction). */
  readonly f: number;
  /** Dimensionless supersaturation sigma. */
  readonly sigma: number;
  readonly rawNT: number;
  readonly rawNZ: number;
  /** Facet class of THIS cell's raw configuration under the policy; null when [00]. */
  readonly facet: FacetClass | null;
  readonly overlayName: LKOverlayName;
  readonly overlayValue: number;
}

export function buildLKPickInfo(
  ctx: LKOverlayContext,
  i: number,
  j: number,
  k: number,
  overlayName: LKOverlayName,
): LKPickInfo {
  const { nx, ny } = ctx.dims;
  const index = k * (nx * ny) + j * nx + i;
  const [rawNT, rawNZ] = attachedNeighborCountsUncapped(ctx.a, ctx.dims, i, j, k);
  const facet =
    rawNT === 0 && rawNZ === 0 ? null : classifyFacet(rawNT, rawNZ, ctx.surfacePolicy);
  return {
    i,
    j,
    k,
    attached: ctx.a[index] === 1,
    wall: ctx.wall !== null && ctx.wall[index] === 1,
    f: ctx.f[index],
    sigma: ctx.sigma[index],
    rawNT,
    rawNZ,
    facet,
    overlayName,
    overlayValue: lkOverlayValueAt(overlayName, ctx, i, j, k),
  };
}

function num(value: number): string {
  return Number.isFinite(value) ? value.toFixed(4) : "undefined (NaN)";
}

/** Readout lines for the hover panel. Every quantity carries Type and Evidence phrasing. */
export function formatLKReadout(info: LKPickInfo): string[] {
  const lines: string[] = [];
  lines.push(`cell (${info.i}, ${info.j}, ${info.k}) — lattice site (model coordinates)`);
  lines.push(
    `a = ${info.attached ? 1 : 0} — ${info.attached ? "attached (crystal)" : info.wall ? "inert wall" : "free (vapor)"} (computed state, unvalidated)`,
  );
  lines.push(
    `f = ${num(info.f)} — boundary fill (dimensionless fraction of the f = 1 attachment ` +
      `threshold, computed state, unvalidated)`,
  );
  lines.push(
    `sigma = ${num(info.sigma)} — supersaturation relative to ice (dimensionless, computed ` +
      `state, unvalidated)`,
  );
  lines.push(
    `raw neighbors: nT ${info.rawNT}, nZ ${info.rawNZ} (uncapped [HV] counts) — facet class ` +
      `${info.facet ?? "n/a ([00] is not a boundary configuration)"} under the coupled ` +
      `surface policy (computed state, unvalidated)`,
  );
  if (info.overlayName !== "none") {
    const label = LK_OVERLAY_LABELS[info.overlayName];
    lines.push(`overlay ${label.title} = ${num(info.overlayValue)} — ${label.definition}`);
  }
  return lines;
}
