// spike/js/sim.mjs — Reiter 2D hex-CA core for the Phase 1 UX spike.
//
// DOM-free on purpose: spike/check.mjs exercises this file under plain `node`.
// The update rule is specified in docs/plans/phase-1-ux-spike.md (Approach)
// and followed verbatim here. The one mistake that quietly kills the model is
// diffusing only non-receptive cells — so, per the plan: diffusion runs on
// EVERY cell, including receptive ones. Receptive cells enter the diffusion
// step with u = 0 (they are sinks, which starves their surroundings and makes
// branching possible) and they receive their u share like any other cell.
//
// Rule 7 (AGENTS.md): Reiter's three parameters are named reiterAlpha
// (diffusion), reiterBeta (background vapor), reiterGamma (vapor addition) —
// never the bare single-word forms, which are banned repo-wide.
//
// Determinism: no randomness anywhere in this file. Same grid size, same
// background value, same per-tick parameters => bit-identical grids.

// Axial neighbor offsets (dq, dr) for a pointy-top hex grid.
const AXIAL_NEIGHBORS = [
  [1, 0], [-1, 0], [0, -1], [1, -1], [-1, 1], [0, 1],
];

/**
 * Create a simulation on a size x size hex grid (axial coordinates,
 * pointy-top). Row r stores columns c in [0, size) with q = c - (r >> 1),
 * so the stored region renders as a near-rectangle.
 *
 * `backgroundVapor` is the initial field value everywhere except the single
 * center seed cell (s = 1); the grid rim is clamped to the *current*
 * reiterBeta every tick (plan, update-rule step 5).
 */
export function createSim(gridSize, backgroundVapor) {
  const size = gridSize | 0;
  if (!(size >= 16 && size <= 512)) {
    throw new Error(`gridSize out of range [16, 512]: ${gridSize}`);
  }
  if (!(backgroundVapor >= 0 && backgroundVapor < 1)) {
    throw new Error(`backgroundVapor out of range [0, 1): ${backgroundVapor}`);
  }
  const n = size * size;
  const qMin = (r) => -(r >> 1);

  // Precomputed neighbor table: 6 slots per cell, -1 = outside the grid.
  const nbr = new Int32Array(n * 6).fill(-1);
  // rim[i] = 1 when the cell has any out-of-grid neighbor; those cells are
  // the clamped boundary.
  const rim = new Uint8Array(n);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const i = r * size + c;
      const q = c + qMin(r);
      for (let k = 0; k < 6; k++) {
        const q2 = q + AXIAL_NEIGHBORS[k][0];
        const r2 = r + AXIAL_NEIGHBORS[k][1];
        if (r2 < 0 || r2 >= size) { rim[i] = 1; continue; }
        const c2 = q2 - qMin(r2);
        if (c2 < 0 || c2 >= size) { rim[i] = 1; continue; }
        nbr[i * 6 + k] = r2 * size + c2;
      }
    }
  }

  // Field + scratch buffers.
  const s = new Float64Array(n);
  const u = new Float64Array(n);
  const v = new Float64Array(n);
  const uNext = new Float64Array(n);
  const ice = new Uint8Array(n);
  const receptive = new Uint8Array(n);

  let tickCount = 0;

  function reset(nextBackgroundVapor) {
    const bg = nextBackgroundVapor;
    if (!(bg >= 0 && bg < 1)) {
      throw new Error(`backgroundVapor out of range [0, 1): ${bg}`);
    }
    s.fill(bg);
    const rc = size >> 1;
    s[rc * size + rc] = 1; // the single center seed cell
    tickCount = 0;
  }

  reset(backgroundVapor);

  /**
   * One tick of the Reiter update rule (plan steps 1-5).
   * params: { reiterAlpha, reiterBeta, reiterGamma }
   */
  function tick(params) {
    const { reiterAlpha, reiterBeta, reiterGamma } = params;

    // Receptive = ice (s >= 1) or any of its six neighbors is ice.
    for (let i = 0; i < n; i++) ice[i] = s[i] >= 1 ? 1 : 0;
    for (let i = 0; i < n; i++) {
      let rec = ice[i];
      if (!rec) {
        const b6 = i * 6;
        for (let k = 0; k < 6; k++) {
          const j = nbr[b6 + k];
          if (j >= 0 && ice[j] === 1) { rec = 1; break; }
        }
      }
      receptive[i] = rec;
    }

    // Step 1 (split) + step 2 (constant addition on receptive cells only).
    for (let i = 0; i < n; i++) {
      if (receptive[i] === 1) {
        u[i] = 0;
        v[i] = s[i] + reiterGamma;
      } else {
        u[i] = s[i];
        v[i] = 0;
      }
    }

    // Step 3 — diffusion on EVERY cell, receptive ones included (they enter
    // with u = 0 and receive their share). Out-of-grid neighbors read as the
    // background value; the rim itself is clamped in step 5 regardless.
    const half = reiterAlpha / 2;
    for (let i = 0; i < n; i++) {
      const b6 = i * 6;
      let sum = 0;
      for (let k = 0; k < 6; k++) {
        const j = nbr[b6 + k];
        sum += j >= 0 ? u[j] : reiterBeta;
      }
      uNext[i] = u[i] + half * (sum / 6 - u[i]);
    }

    // Step 4 (recombine) + step 5 (clamp the rim to background vapor).
    for (let i = 0; i < n; i++) {
      s[i] = rim[i] === 1 ? reiterBeta : uNext[i] + v[i];
    }

    tickCount++;
  }

  /** Number of ice cells (s >= 1). */
  function iceCount() {
    let count = 0;
    for (let i = 0; i < n; i++) if (s[i] >= 1) count++;
    return count;
  }

  /**
   * Minimum distance (in storage rows/columns) from any ice cell to the grid
   * rim. Used by the UI edge guard: growth into the clamped rim is not
   * meaningful, so runs auto-pause when this gets small. Returns +Infinity
   * when there is no ice.
   */
  function iceEdgeMargin() {
    let margin = Infinity;
    for (let r = 0; r < size; r++) {
      const rowMargin = Math.min(r, size - 1 - r);
      for (let c = 0; c < size; c++) {
        if (s[r * size + c] >= 1) {
          const m = Math.min(rowMargin, c, size - 1 - c);
          if (m < margin) margin = m;
        }
      }
    }
    return margin;
  }

  /** Copy of the field, for comparisons. */
  function snapshot() {
    return s.slice();
  }

  return {
    size,
    n,
    s,
    tick,
    reset,
    iceCount,
    iceEdgeMargin,
    snapshot,
    get tickCount() { return tickCount; },
  };
}

/** Bit-exact equality of two Float64Array fields (byte comparison). */
export function fieldsEqual(fieldA, fieldB) {
  if (fieldA.length !== fieldB.length) return false;
  const bytesA = new Uint8Array(fieldA.buffer, fieldA.byteOffset, fieldA.byteLength);
  const bytesB = new Uint8Array(fieldB.buffer, fieldB.byteOffset, fieldB.byteLength);
  for (let i = 0; i < bytesA.length; i++) {
    if (bytesA[i] !== bytesB[i]) return false;
  }
  return true;
}
