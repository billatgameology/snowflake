// Surface-cell extraction: which attached cells does the instanced mesh draw?
//
// A surface cell is an ATTACHED cell (a = 1) with at least one FREE neighbor — free meaning
// in-domain, unattached, and not an inert wall cell. Interior crystal cells are skipped
// (invisible anyway) and so are cells whose only exposure is to walls or the domain edge:
// nothing can ever grow there, and no vapor lives there to read.
//
// Pure over typed arrays (no DOM, no three.js) so it unit-tests under node.

import { T_NEIGHBOR_OFFSETS, type Dims } from "@vcc/core";

/**
 * Flat indices of all surface cells, in ascending index order.
 * `wall` may be null (box domain — no inert cells).
 */
export function surfaceCellIndices(a: Uint8Array, wall: Uint8Array | null, dims: Dims): Uint32Array {
  const { nx, ny, nz } = dims;
  const plane = nx * ny;
  const out: number[] = [];

  const free = (index: number): boolean =>
    a[index] === 0 && (wall === null || wall[index] === 0);

  for (let k = 0; k < nz; k++) {
    const kBase = k * plane;
    for (let j = 0; j < ny; j++) {
      const row = kBase + j * nx;
      for (let i = 0; i < nx; i++) {
        const x = row + i;
        if (a[x] !== 1) continue;
        let exposed = false;
        for (const [di, dj] of T_NEIGHBOR_OFFSETS) {
          const ni = i + di;
          const nj = j + dj;
          if (ni < 0 || ni >= nx || nj < 0 || nj >= ny) continue;
          if (free(kBase + nj * nx + ni)) {
            exposed = true;
            break;
          }
        }
        if (!exposed && k + 1 < nz && free(x + plane)) exposed = true;
        if (!exposed && k - 1 >= 0 && free(x - plane)) exposed = true;
        if (exposed) out.push(x);
      }
    }
  }
  return Uint32Array.from(out);
}
