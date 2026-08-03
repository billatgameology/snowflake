// Gut-check spike (docs/plans/explore-gg-realism-gutcheck.md): shared level-set mesh
// extraction used by gutcheck-extract-mesh.ts (checkpoint -> mesh file) and
// gutcheck-animate-grow.ts (live solver replay -> frame meshes). Logic is the extraction
// script's original pipeline moved verbatim where possible; one deliberate metadata
// change is recorded in the plan: the mesh header's source block is now caller-supplied
// (the old hardcoded `preset: "dendrite"` was wrong for plate checkpoints).
//
// Level set: attached cells are 1; an unattached boundary cell is graded by its
// attachment progress b / ggThreshBeta[2*min(nT,3) + min(nZ,1)] — the G-G analog of the
// LK fill fraction; everything else is 0. Gaussian splat through the exact embedding
// x = i + j/2, y = j*sqrt(3)/2, z = k; naive surface nets at the iso value; normals from
// the resampled field's gradient (stencil width spacing * normalDelta). REPORTED
// DIAGNOSTIC only; nothing feeds back into any solver.

import type { SolverState } from "@vcc/core";

const SQRT3_2 = Math.sqrt(3) / 2;

export interface ExtractOptions {
  readonly spacing: number;
  readonly sigma: number;
  readonly iso: number;
  readonly margin: number;
  readonly normalDelta: number;
  /** Provenance block embedded in the mesh header, caller-defined. */
  readonly source: Record<string, unknown>;
  readonly log?: (line: string) => void;
}

export interface ExtractedMesh {
  readonly bytes: Uint8Array;
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly indices: Uint32Array;
  readonly bboxCartesian: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    zMin: number;
    zMax: number;
  };
}

const T_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

export function extractMesh(state: SolverState, opts: ExtractOptions): ExtractedMesh {
  const log = opts.log ?? (() => {});
  const t0 = Date.now();
  const { nx, ny, nz } = state.dims;
  const n = nx * ny * nz;
  const { a, b } = state;
  const thresh = state.params.ggThreshBeta;
  const [ic, jc, kc] = state.center;

  const hexRadius = Math.min(ic, nx - 1 - ic, jc, ny - 1 - jc);
  const halfZ = Math.min(kc, nz - 1 - kc);
  const isWall = (i: number, j: number, k: number): boolean => {
    if (state.domain !== "hexPrism") return false;
    const di = i - ic;
    const dj = j - jc;
    const dist = (Math.abs(di) + Math.abs(dj) + Math.abs(di + dj)) / 2;
    return dist > hexRadius || Math.abs(k - kc) > halfZ;
  };

  // ── Lattice level-set field phi in [0, 1] ──────────────────────────────────────────────
  const phi = new Float64Array(n);
  let attachedCount = 0;
  let gradedCount = 0;
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      const rowBase = k * nx * ny + j * nx;
      for (let i = 0; i < nx; i++) {
        const x = rowBase + i;
        if (a[x] === 1) {
          phi[x] = 1;
          attachedCount++;
          continue;
        }
        if (b[x]! <= 0 || isWall(i, j, k)) continue;
        let nT = 0;
        for (const [di, dj] of T_OFFSETS) {
          const ii = i + di;
          const jj = j + dj;
          if (ii < 0 || ii >= nx || jj < 0 || jj >= ny) continue;
          if (a[k * nx * ny + jj * nx + ii] === 1) nT++;
        }
        let nZ = 0;
        if (k > 0 && a[x - nx * ny] === 1) nZ++;
        if (k < nz - 1 && a[x + nx * ny] === 1) nZ++;
        if (nT === 0 && nZ === 0) continue;
        const slot = 2 * Math.min(nT, 3) + Math.min(nZ, 1);
        const t = thresh[slot]!;
        if (!Number.isFinite(t) || t <= 0) continue;
        phi[x] = Math.min(b[x]! / t, 0.999);
        gradedCount++;
      }
    }
  }
  log(`phi field: attached=${attachedCount} gradedBoundary=${gradedCount}`);

  // ── Cartesian bounds of phi > 0, plus margin ───────────────────────────────────────────
  let xMin = Infinity,
    xMax = -Infinity,
    yMin = Infinity,
    yMax = -Infinity,
    zMin = Infinity,
    zMax = -Infinity;
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        if (phi[k * nx * ny + j * nx + i]! <= 0) continue;
        const cx = i + j / 2;
        const cy = j * SQRT3_2;
        if (cx < xMin) xMin = cx;
        if (cx > xMax) xMax = cx;
        if (cy < yMin) yMin = cy;
        if (cy > yMax) yMax = cy;
        if (k < zMin) zMin = k;
        if (k > zMax) zMax = k;
      }
    }
  }
  if (!Number.isFinite(xMin)) throw new Error("no phi > 0 cells; nothing to extract");
  const m = opts.margin;
  const h = opts.spacing;
  const ox = xMin - m;
  const oy = yMin - m;
  const oz = zMin - m;
  const gx = Math.ceil((xMax - xMin + 2 * m) / h) + 1;
  const gy = Math.ceil((yMax - yMin + 2 * m) / h) + 1;
  const gz = Math.ceil((zMax - zMin + 2 * m) / h) + 1;
  log(
    `grid ${gx}x${gy}x${gz} spacing=${h} cartesian bbox x[${xMin.toFixed(1)},${xMax.toFixed(1)}] ` +
      `y[${yMin.toFixed(1)},${yMax.toFixed(1)}] z[${zMin},${zMax}]`,
  );

  // ── Gaussian splat (separable weights) of phi and of unit weight onto the grid ─────────
  const num = new Float32Array(gx * gy * gz);
  const den = new Float32Array(gx * gy * gz);
  const sigma = opts.sigma;
  const support = Math.max(2.5 * sigma, h);
  const reach = Math.ceil(support / h);
  const inv2s2 = 1 / (2 * sigma * sigma);
  let splatted = 0;
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        if (isWall(i, j, k)) continue;
        const cx = i + j / 2;
        const cy = j * SQRT3_2;
        const cz = k;
        if (
          cx < ox - support ||
          cx > ox + (gx - 1) * h + support ||
          cy < oy - support ||
          cy > oy + (gy - 1) * h + support ||
          cz < oz - support ||
          cz > oz + (gz - 1) * h + support
        ) {
          continue;
        }
        const v = phi[k * nx * ny + j * nx + i]!;
        const u0 = Math.round((cx - ox) / h);
        const v0 = Math.round((cy - oy) / h);
        const w0 = Math.round((cz - oz) / h);
        splatted++;
        const axisWeights = (center: number, g0: number, extent: number): Float64Array => {
          const out = new Float64Array(2 * reach + 1);
          for (let d = -reach; d <= reach; d++) {
            const gi = g0 + d;
            if (gi < 0 || gi >= extent) continue;
            const delta = gi * h - center;
            out[d + reach] = Math.exp(-delta * delta * inv2s2);
          }
          return out;
        };
        const wx = axisWeights(cx - ox, u0, gx);
        const wy = axisWeights(cy - oy, v0, gy);
        const wz = axisWeights(cz - oz, w0, gz);
        for (let dw = -reach; dw <= reach; dw++) {
          const gw = w0 + dw;
          if (gw < 0 || gw >= gz) continue;
          const wzv = wz[dw + reach]!;
          if (wzv === 0) continue;
          const planeBase = gw * gx * gy;
          for (let dv = -reach; dv <= reach; dv++) {
            const gv = v0 + dv;
            if (gv < 0 || gv >= gy) continue;
            const wyz = wy[dv + reach]! * wzv;
            if (wyz === 0) continue;
            const rowBase = planeBase + gv * gx;
            for (let du = -reach; du <= reach; du++) {
              const gu = u0 + du;
              if (gu < 0 || gu >= gx) continue;
              const w = wx[du + reach]! * wyz;
              if (w === 0) continue;
              den[rowBase + gu] += w;
              if (v > 0) num[rowBase + gu] += w * v;
            }
          }
        }
      }
    }
  }
  const field = new Float32Array(gx * gy * gz);
  for (let x = 0; x < field.length; x++) {
    field[x] = den[x]! > 1e-9 ? num[x]! / den[x]! : 0;
  }
  log(`splatted sites=${splatted} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);

  // ── Naive surface nets at iso ──────────────────────────────────────────────────────────
  const iso = opts.iso;
  const cellVert = new Int32Array((gx - 1) * (gy - 1) * (gz - 1)).fill(-1);
  const positionList: number[] = [];
  const fIdx = (u: number, v: number, w: number): number => u + gx * (v + gy * w);
  const cIdx = (u: number, v: number, w: number): number => u + (gx - 1) * (v + (gy - 1) * w);
  const CORNERS: ReadonlyArray<readonly [number, number, number]> = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, 1],
  ];
  const EDGES: ReadonlyArray<readonly [number, number]> = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  let vertexCount = 0;
  for (let w = 0; w < gz - 1; w++) {
    for (let v = 0; v < gy - 1; v++) {
      for (let u = 0; u < gx - 1; u++) {
        let mask = 0;
        const fv: number[] = [];
        for (let c = 0; c < 8; c++) {
          const [du, dv, dw] = CORNERS[c]!;
          const f = field[fIdx(u + du, v + dv, w + dw)]!;
          fv.push(f);
          if (f >= iso) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let px = 0,
          py = 0,
          pz = 0,
          crossings = 0;
        for (const [c0, c1] of EDGES) {
          const f0 = fv[c0]!;
          const f1 = fv[c1]!;
          if (f0 >= iso === f1 >= iso) continue;
          const t = (iso - f0) / (f1 - f0);
          const [a0, b0, c0v] = CORNERS[c0]!;
          const [a1, b1, c1v] = CORNERS[c1]!;
          px += a0 + (a1 - a0) * t;
          py += b0 + (b1 - b0) * t;
          pz += c0v + (c1v - c0v) * t;
          crossings++;
        }
        px /= crossings;
        py /= crossings;
        pz /= crossings;
        cellVert[cIdx(u, v, w)] = vertexCount++;
        positionList.push(ox + (u + px) * h, oy + (v + py) * h, oz + (w + pz) * h);
      }
    }
  }

  const indexList: number[] = [];
  const quad = (v00: number, v10: number, v11: number, v01: number, flip: boolean): void => {
    if (v00 < 0 || v10 < 0 || v11 < 0 || v01 < 0) return;
    if (flip) {
      indexList.push(v00, v01, v11, v00, v11, v10);
    } else {
      indexList.push(v00, v10, v11, v00, v11, v01);
    }
  };
  for (let w = 0; w < gz; w++) {
    for (let v = 0; v < gy; v++) {
      for (let u = 0; u < gx; u++) {
        const f0 = field[fIdx(u, v, w)]!;
        if (u < gx - 1 && v > 0 && w > 0) {
          const f1 = field[fIdx(u + 1, v, w)]!;
          if (f0 >= iso !== f1 >= iso && v <= gy - 2 && w <= gz - 2) {
            quad(
              cellVert[cIdx(u, v - 1, w - 1)]!,
              cellVert[cIdx(u, v, w - 1)]!,
              cellVert[cIdx(u, v, w)]!,
              cellVert[cIdx(u, v - 1, w)]!,
              f1 >= iso,
            );
          }
        }
        if (v < gy - 1 && u > 0 && w > 0) {
          const f1 = field[fIdx(u, v + 1, w)]!;
          if (f0 >= iso !== f1 >= iso && u <= gx - 2 && w <= gz - 2) {
            quad(
              cellVert[cIdx(u - 1, v, w - 1)]!,
              cellVert[cIdx(u - 1, v, w)]!,
              cellVert[cIdx(u, v, w)]!,
              cellVert[cIdx(u, v, w - 1)]!,
              f1 >= iso,
            );
          }
        }
        if (w < gz - 1 && u > 0 && v > 0) {
          const f1 = field[fIdx(u, v, w + 1)]!;
          if (f0 >= iso !== f1 >= iso && u <= gx - 2 && v <= gy - 2) {
            quad(
              cellVert[cIdx(u - 1, v - 1, w)]!,
              cellVert[cIdx(u, v - 1, w)]!,
              cellVert[cIdx(u, v, w)]!,
              cellVert[cIdx(u - 1, v, w)]!,
              f1 >= iso,
            );
          }
        }
      }
    }
  }
  log(
    `surface nets: vertices=${vertexCount} triangles=${indexList.length / 3} ` +
      `(${((Date.now() - t0) / 1000).toFixed(1)}s)`,
  );

  // ── Normals from the field gradient (outward = -grad; stencil = spacing*normalDelta) ───
  const sample = (x: number, y: number, z: number): number => {
    const u = (x - ox) / h;
    const v = (y - oy) / h;
    const w = (z - oz) / h;
    const u0 = Math.max(0, Math.min(gx - 2, Math.floor(u)));
    const v0 = Math.max(0, Math.min(gy - 2, Math.floor(v)));
    const w0 = Math.max(0, Math.min(gz - 2, Math.floor(w)));
    const fu = Math.max(0, Math.min(1, u - u0));
    const fvv = Math.max(0, Math.min(1, v - v0));
    const fw = Math.max(0, Math.min(1, w - w0));
    let acc = 0;
    for (let dw = 0; dw <= 1; dw++) {
      for (let dv = 0; dv <= 1; dv++) {
        for (let du = 0; du <= 1; du++) {
          const wgt =
            (du === 1 ? fu : 1 - fu) * (dv === 1 ? fvv : 1 - fvv) * (dw === 1 ? fw : 1 - fw);
          acc += field[fIdx(u0 + du, v0 + dv, w0 + dw)]! * wgt;
        }
      }
    }
    return acc;
  };
  const nd = h * opts.normalDelta;
  const positions = Float32Array.from(positionList);
  const indices = Uint32Array.from(indexList);
  const normals = new Float32Array(vertexCount * 3);
  for (let vi = 0; vi < vertexCount; vi++) {
    const x = positions[vi * 3]!;
    const y = positions[vi * 3 + 1]!;
    const z = positions[vi * 3 + 2]!;
    let nxg = sample(x - nd, y, z) - sample(x + nd, y, z);
    let nyg = sample(x, y - nd, z) - sample(x, y + nd, z);
    let nzg = sample(x, y, z - nd) - sample(x, y, z + nd);
    const len = Math.hypot(nxg, nyg, nzg);
    if (len > 1e-12) {
      nxg /= len;
      nyg /= len;
      nzg /= len;
    } else {
      nzg = 1;
    }
    normals[vi * 3] = nxg;
    normals[vi * 3 + 1] = nyg;
    normals[vi * 3 + 2] = nzg;
  }

  // ── Serialize: u32 headerLen, padded JSON header, f32 positions/normals, u32 indices ───
  const bboxCartesian = { xMin, xMax, yMin, yMax, zMin, zMax };
  const headerJson = JSON.stringify({
    format: "gutcheck-mesh-v1",
    vertexCount,
    triangleCount: indices.length / 3,
    source: opts.source,
    extraction: {
      spacing: h,
      sigma,
      iso,
      margin: m,
      normalDelta: opts.normalDelta,
      levelSet:
        "attached=1; unattached boundary graded by b/ggThreshBeta[2*min(nT,3)+min(nZ,1)]",
    },
    bboxCartesian,
  });
  const rawHeader = new TextEncoder().encode(headerJson);
  const paddedLen = Math.ceil(rawHeader.length / 4) * 4;
  const headerBytes = new Uint8Array(paddedLen).fill(0x20);
  headerBytes.set(rawHeader);
  const total =
    4 + headerBytes.length + positions.byteLength + normals.byteLength + indices.byteLength;
  const bytes = new Uint8Array(total);
  const dv = new DataView(bytes.buffer);
  dv.setUint32(0, headerBytes.length, true);
  bytes.set(headerBytes, 4);
  let off = 4 + headerBytes.length;
  bytes.set(new Uint8Array(positions.buffer), off);
  off += positions.byteLength;
  bytes.set(new Uint8Array(normals.buffer), off);
  off += normals.byteLength;
  bytes.set(new Uint8Array(indices.buffer), off);
  return {
    bytes,
    vertexCount,
    triangleCount: indices.length / 3,
    positions,
    normals,
    indices,
    bboxCartesian,
  };
}
