// Cell-picking readout (A3-3): everything shown about a hovered cell, with §1.5 Type ×
// Evidence labels on every quantity. Pure (no DOM) so the labels and numbers unit-test in
// node. No physical units, no percentages — the model has neither to offer.

import { OVERLAY_LABELS, attachedNeighborCountsUncapped, capForParamSlot, overlayValueAt, type OverlayContext, type OverlayName } from "./overlays.ts";

export interface PickInfo {
  readonly i: number;
  readonly j: number;
  readonly k: number;
  readonly attached: boolean;
  readonly wall: boolean;
  readonly b: number;
  readonly d: number;
  readonly nTUncapped: number;
  readonly nZUncapped: number;
  readonly nTCapped: number;
  readonly nZCapped: number;
  readonly overlayName: OverlayName;
  readonly overlayValue: number;
}

export function buildPickInfo(
  ctx: OverlayContext,
  i: number,
  j: number,
  k: number,
  overlayName: OverlayName,
): PickInfo {
  const { nx, ny } = ctx.dims;
  const index = k * (nx * ny) + j * nx + i;
  const [nTUncapped, nZUncapped] = attachedNeighborCountsUncapped(ctx.a, ctx.dims, i, j, k);
  const [nTCapped, nZCapped] = capForParamSlot(nTUncapped, nZUncapped);
  return {
    i,
    j,
    k,
    attached: ctx.a[index] === 1,
    wall: ctx.wall !== null && ctx.wall[index] === 1,
    b: ctx.b[index],
    d: ctx.d[index],
    nTUncapped,
    nZUncapped,
    nTCapped,
    nZCapped,
    overlayName,
    overlayValue: overlayValueAt(overlayName, ctx, i, j, k),
  };
}

function num(value: number): string {
  return Number.isFinite(value) ? value.toFixed(4) : "undefined (NaN)";
}

/** Readout lines for the hover panel. Every quantity carries Type and Evidence phrasing. */
export function formatReadout(info: PickInfo): string[] {
  const lines: string[] = [];
  lines.push(`cell (${info.i}, ${info.j}, ${info.k}) — lattice site (model coordinates)`);
  lines.push(
    `a = ${info.attached ? 1 : 0} — ${info.attached ? "attached (crystal)" : info.wall ? "inert wall" : "free (vapor)"} (computed state, unvalidated)`,
  );
  lines.push(`b = ${num(info.b)} — boundary mass (computed state, model units, unvalidated)`);
  lines.push(`d = ${num(info.d)} — vapor mass (computed state, model units, unvalidated)`);
  lines.push(
    `attached neighbors: nT ${info.nTUncapped}, nZ ${info.nZUncapped} (uncapped) — ` +
      `param slot uses nT ${info.nTCapped}, nZ ${info.nZCapped} (capped, as GGSolver does) ` +
      `(computed state, counts, unvalidated)`,
  );
  if (info.overlayName !== "none") {
    const label = OVERLAY_LABELS[info.overlayName];
    lines.push(`overlay ${label.title} = ${num(info.overlayValue)} — ${label.definition}`);
  }
  return lines;
}
