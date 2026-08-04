// Gut-check spike (docs/plans/explore-gg-realism-gutcheck.md): CELL-TRUE mesh extraction —
// the G-G paper's own display mode (§III: crystals depicted as "the visible boundaries of
// translates of the fundamental prism", MATLAB PATCH faces + LINE-drawn edges). Emits the
// exact hexagonal-prism boundary faces of attached cells (flat-shaded, perfectly straight
// by construction) plus every exposed face's perimeter edges as line segments. Read-only
// diagnostic; separate from the level-set library so recorded smooth-mesh artifacts stay
// byte-reproducible.
//
// Format "gutcheck-cellmesh-v1": u32 headerLen, padded JSON header, f32 positions (3N),
// f32 normals (3N), u32 indices (3T), f32 edgePositions (6E — segment endpoint pairs).

import type { SolverState } from "@vcc/core";

const SQRT3_2 = Math.sqrt(3) / 2;
const CIRCUMRADIUS = 1 / Math.sqrt(3);

// T-neighbor axial offsets and their cartesian direction angles (degrees).
const T_DIRECTIONS: ReadonlyArray<{ di: number; dj: number; angle: number }> = [
  { di: 1, dj: 0, angle: 0 },
  { di: 0, dj: 1, angle: 60 },
  { di: -1, dj: 1, angle: 120 },
  { di: -1, dj: 0, angle: 180 },
  { di: 0, dj: -1, angle: 240 },
  { di: 1, dj: -1, angle: 300 },
];

export interface CellMeshResult {
  readonly bytes: Uint8Array;
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly edgeSegmentCount: number;
}

export function extractCellMesh(
  state: SolverState,
  source: Record<string, unknown>,
): CellMeshResult {
  const { nx, ny, nz } = state.dims;
  const a = state.a;
  const idx = (i: number, j: number, k: number): number => k * nx * ny + j * nx + i;
  const attached = (i: number, j: number, k: number): boolean =>
    i >= 0 && i < nx && j >= 0 && j < ny && k >= 0 && k < nz && a[idx(i, j, k)] === 1;

  // Hexagon corner offsets at angles 30 + 60m degrees, circumradius 1/sqrt(3).
  const corners: Array<readonly [number, number]> = [];
  for (let m = 0; m < 6; m++) {
    const angle = ((30 + 60 * m) * Math.PI) / 180;
    corners.push([CIRCUMRADIUS * Math.cos(angle), CIRCUMRADIUS * Math.sin(angle)]);
  }
  // Side face for direction angle θ spans the two corners at θ∓30 (indices m = θ/60 and
  // θ/60 + 5 mod 6 in the 30+60m sequence... resolved by direct lookup below).
  const sideCorners = (direction: number): readonly [number, number] => {
    // corners[m] sits at angle 30+60m; the face toward angle A=60*direction is bounded by
    // corners at A-30 and A+30, i.e. m = direction-1 mod 6 and m = direction.
    return [(direction + 5) % 6, direction];
  };

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const edges: number[] = [];
  let vertexCount = 0;

  // drawEdge masks: bit e set = emit that perimeter edge. Coplanar continuations
  // (cap beside co-exposed cap at the same height, stacked co-exposed side strips) are
  // suppressed so the drawn lines are structure — silhouettes, steps, 120° prism edges —
  // rather than the cell grid.
  const pushQuad = (
    quad: ReadonlyArray<readonly [number, number, number]>,
    normal: readonly [number, number, number],
    drawEdge: number,
  ): void => {
    for (const p of quad) {
      positions.push(p[0], p[1], p[2]);
      normals.push(normal[0], normal[1], normal[2]);
    }
    indices.push(vertexCount, vertexCount + 1, vertexCount + 2);
    indices.push(vertexCount, vertexCount + 2, vertexCount + 3);
    vertexCount += 4;
    for (let e = 0; e < 4; e++) {
      if ((drawEdge & (1 << e)) === 0) continue;
      const p0 = quad[e]!;
      const p1 = quad[(e + 1) % 4]!;
      edges.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2]);
    }
  };


  // Cap-corner dedup: shared hexagon corners collapse to indexed vertices (normal
  // direction is part of the key so +z and -z caps never share).
  const capIndex = new Map<string, number>();
  const capCorner = (x: number, y: number, z: number, up: boolean): number => {
    const key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(1)},${up ? "t" : "b"}`;
    const existing = capIndex.get(key);
    if (existing !== undefined) return existing;
    positions.push(x, y, z);
    normals.push(0, 0, up ? 1 : -1);
    capIndex.set(key, vertexCount);
    return vertexCount++;
  };

  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        if (a[idx(i, j, k)] !== 1) continue;
        const cx = i + j / 2;
        const cy = j * SQRT3_2;
        const cz = k;
        // Side faces toward unattached T-neighbors, merged over contiguous exposed k-runs
        // (one tall quad per run instead of one per cell). Emit only at run bottoms.
        const sideExposed = (kk: number, d: number): boolean => {
          const dir = T_DIRECTIONS[d]!;
          return (
            attached(i, j, kk) && !attached(i + dir.di, j + dir.dj, kk)
          );
        };
        for (let d = 0; d < 6; d++) {
          const dir = T_DIRECTIONS[d]!;
          if (attached(i + dir.di, j + dir.dj, k)) continue;
          if (sideExposed(k - 1, d)) continue; // interior of a run; emitted at its bottom
          let kTop = k;
          while (sideExposed(kTop + 1, d)) kTop++;
          const [mA, mB] = sideCorners(d);
          const ca = corners[mA]!;
          const cb = corners[mB]!;
          const angle = (dir.angle * Math.PI) / 180;
          pushQuad(
            [
              [cx + ca[0], cy + ca[1], cz - 0.5],
              [cx + cb[0], cy + cb[1], cz - 0.5],
              [cx + cb[0], cy + cb[1], kTop + 0.5],
              [cx + ca[0], cy + ca[1], kTop + 0.5],
            ],
            [Math.cos(angle), Math.sin(angle), 0],
            0b1111,
          );
        }
        // Top / bottom hexagons toward unattached Z-neighbors. Hexagon edge e (corner e
        // to e+1) faces T-direction (e+1) mod 6; suppress it when that neighbor has a
        // co-exposed coplanar cap at the same height.
        const capMask = (kk: number, zNeighbor: number): number => {
          let drawEdge = 0b111111;
          for (let e = 0; e < 6; e++) {
            const dir = T_DIRECTIONS[(e + 1) % 6]!;
            const ni = i + dir.di;
            const nj = j + dir.dj;
            if (attached(ni, nj, kk) && !attached(ni, nj, kk + zNeighbor)) {
              drawEdge &= ~(1 << e);
            }
          }
          return drawEdge;
        };
        if (!attached(i, j, k + 1)) {
          const mask = capMask(k, 1);
          const ring = corners.map((c) =>
            capCorner(cx + c[0], cy + c[1], cz + 0.5, true),
          );
          for (let t = 1; t < 5; t++) indices.push(ring[0]!, ring[t]!, ring[t + 1]!);
          for (let e = 0; e < 6; e++) {
            if ((mask & (1 << e)) === 0) continue;
            const c0 = corners[e]!;
            const c1 = corners[(e + 1) % 6]!;
            edges.push(cx + c0[0], cy + c0[1], cz + 0.5, cx + c1[0], cy + c1[1], cz + 0.5);
          }
        }
        if (!attached(i, j, k - 1)) {
          const mask = capMask(k, -1);
          const ring = corners.map((c) =>
            capCorner(cx + c[0], cy + c[1], cz - 0.5, false),
          );
          for (let t = 1; t < 5; t++) indices.push(ring[0]!, ring[t + 1]!, ring[t]!);
          for (let e = 0; e < 6; e++) {
            if ((mask & (1 << e)) === 0) continue;
            const c0 = corners[e]!;
            const c1 = corners[(e + 1) % 6]!;
            edges.push(cx + c0[0], cy + c0[1], cz - 0.5, cx + c1[0], cy + c1[1], cz - 0.5);
          }
        }
      }
    }
  }

  const posArr = Float32Array.from(positions);
  const normArr = Float32Array.from(normals);
  const idxArr = Uint32Array.from(indices);
  const edgeArr = Float32Array.from(edges);
  const headerJson = JSON.stringify({
    format: "gutcheck-cellmesh-v1",
    vertexCount,
    triangleCount: idxArr.length / 3,
    edgeSegmentCount: edgeArr.length / 6,
    source,
    display:
      "cell-true prism boundary faces + perimeter edge segments (G-G sec. III display mode)",
  });
  const rawHeader = new TextEncoder().encode(headerJson);
  const paddedLen = Math.ceil(rawHeader.length / 4) * 4;
  const headerBytes = new Uint8Array(paddedLen).fill(0x20);
  headerBytes.set(rawHeader);
  const total =
    4 +
    headerBytes.length +
    posArr.byteLength +
    normArr.byteLength +
    idxArr.byteLength +
    edgeArr.byteLength;
  const bytes = new Uint8Array(total);
  new DataView(bytes.buffer).setUint32(0, headerBytes.length, true);
  bytes.set(headerBytes, 4);
  let off = 4 + headerBytes.length;
  bytes.set(new Uint8Array(posArr.buffer), off);
  off += posArr.byteLength;
  bytes.set(new Uint8Array(normArr.buffer), off);
  off += normArr.byteLength;
  bytes.set(new Uint8Array(idxArr.buffer), off);
  off += idxArr.byteLength;
  bytes.set(new Uint8Array(edgeArr.buffer), off);
  return {
    bytes,
    vertexCount,
    triangleCount: idxArr.length / 3,
    edgeSegmentCount: edgeArr.length / 6,
  };
}
