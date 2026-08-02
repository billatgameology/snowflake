// Gut-check spike (docs/plans/explore-gg-realism-gutcheck.md): GG checkpoint -> smooth
// level-set mesh. Disposable exploration tooling; reads solver output strictly read-only.
//
//   node scripts/gutcheck-extract-mesh.ts <in.ckpt> <out-mesh.bin> [--spacing H] [--sigma S]
//        [--iso V] [--margin M] [--obj path.obj]
//
// Level-set choice (the plan's open question, answered here): attached cells are 1; an
// unattached boundary cell is graded by its attachment progress b / ggThreshBeta[slot], the
// G-G analog of the LK fill fraction (both are "how far toward deterministic attachment");
// everything else is 0. The lattice field is splatted with a narrow Gaussian (default
// sigma 0.6 lattice units — deliberately tight, ADR 0029 warns over-smoothing destroys
// relief) onto a cartesian grid via the exact embedding x = i + j/2, y = j*sqrt(3)/2, z = k,
// then contoured at iso 0.5 with naive surface nets. Everything here is a REPORTED
// DIAGNOSTIC for rendering; nothing feeds back into any solver.

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { decodeCheckpoint } from "@vcc/core";

const SQRT3_2 = Math.sqrt(3) / 2;

interface Cli {
  ckptPath: string;
  outPath: string;
  spacing: number;
  sigma: number;
  iso: number;
  margin: number;
  objPath: string | null;
}

function parseCli(argv: string[]): Cli {
  const positional: string[] = [];
  const cli: Cli = {
    ckptPath: "",
    outPath: "",
    spacing: 0.5,
    sigma: 0.6,
    iso: 0.5,
    margin: 4,
    objPath: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${arg} wants a value`);
      return v;
    };
    switch (arg) {
      case "--spacing":
        cli.spacing = Number(next());
        break;
      case "--sigma":
        cli.sigma = Number(next());
        break;
      case "--iso":
        cli.iso = Number(next());
        break;
      case "--margin":
        cli.margin = Number(next());
        break;
      case "--obj":
        cli.objPath = next();
        break;
      default:
        positional.push(arg);
    }
  }
  if (positional.length !== 2) {
    throw new Error("usage: gutcheck-extract-mesh.ts <in.ckpt> <out-mesh.bin> [options]");
  }
  cli.ckptPath = positional[0]!;
  cli.outPath = positional[1]!;
  for (const [name, v] of [
    ["--spacing", cli.spacing],
    ["--sigma", cli.sigma],
    ["--iso", cli.iso],
    ["--margin", cli.margin],
  ] as const) {
    if (!Number.isFinite(v) || v <= 0) throw new Error(`${name} wants a positive number`);
  }
  return cli;
}

// T-neighbor axial offsets (core/src/lattice.ts order) and the two Z offsets.
const T_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

function main(): void {
  const cli = parseCli(process.argv.slice(2));
  const t0 = Date.now();

  const bytes = new Uint8Array(readFileSync(cli.ckptPath));
  const ckptSha256 = createHash("sha256").update(bytes).digest("hex");
  const { header, state } = decodeCheckpoint(bytes);
  const { nx, ny, nz } = state.dims;
  const n = nx * ny * nz;
  const { a, b } = state;
  const thresh = state.params.ggThreshBeta; // Float64Array(8), slot 0 poisoned NaN
  const [ic, jc, kc] = state.center;
  console.log(
    `checkpoint ${cli.ckptPath} sha256=${ckptSha256} tick=${state.tick} dims=${nx},${ny},${nz} ` +
      `domain=${state.domain} farField=${state.farField} seed=${state.rngSeed} ` +
      `noise=${state.noiseEpsilon}`,
  );

  // hexPrism wall mask (same formula the decoder validates against; wall cells are inert
  // and must be excluded from sampling, not treated as vacuum).
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
        // Attachment progress toward the (nT, nZ)-slotted threshold; slot = 2*nT + nZ
        // (core/src/params.ts). Clamp counts into the table's domain.
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
        if (nT === 0 && nZ === 0) continue; // not a boundary cell; stray quasi-liquid stays 0
        const slot = 2 * Math.min(nT, 3) + Math.min(nZ, 1);
        const t = thresh[slot]!;
        if (!Number.isFinite(t) || t <= 0) continue;
        phi[x] = Math.min(b[x]! / t, 0.999);
        gradedCount++;
      }
    }
  }
  console.log(`phi field: attached=${attachedCount} gradedBoundary=${gradedCount}`);

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
  const m = cli.margin;
  const h = cli.spacing;
  const ox = xMin - m;
  const oy = yMin - m;
  const oz = zMin - m;
  const gx = Math.ceil((xMax - xMin + 2 * m) / h) + 1;
  const gy = Math.ceil((yMax - yMin + 2 * m) / h) + 1;
  const gz = Math.ceil((zMax - zMin + 2 * m) / h) + 1;
  console.log(
    `grid ${gx}x${gy}x${gz} spacing=${h} origin=(${ox.toFixed(2)},${oy.toFixed(2)},${oz.toFixed(2)}) ` +
      `cartesian bbox x[${xMin.toFixed(1)},${xMax.toFixed(1)}] y[${yMin.toFixed(1)},${yMax.toFixed(1)}] ` +
      `z[${zMin},${zMax}]`,
  );

  // ── Gaussian splat (separable weights) of phi and of unit weight onto the grid ─────────
  const num = new Float32Array(gx * gy * gz);
  const den = new Float32Array(gx * gy * gz);
  const sigma = cli.sigma;
  const support = Math.max(2.5 * sigma, h); // cartesian reach of one site
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
        // Per-axis Gaussian weights around the nearest grid point.
        const axisWeights = (
          center: number,
          g0: number,
          extent: number,
        ): Float64Array => {
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
  console.log(`splatted sites=${splatted} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);

  // ── Naive surface nets at iso ──────────────────────────────────────────────────────────
  const iso = cli.iso;
  const cellVert = new Int32Array((gx - 1) * (gy - 1) * (gz - 1)).fill(-1);
  const positions: number[] = [];
  const fIdx = (u: number, v: number, w: number): number => u + gx * (v + gy * w);
  const cIdx = (u: number, v: number, w: number): number =>
    u + (gx - 1) * (v + (gy - 1) * w);
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
  // Cube edges as corner-index pairs into CORNERS.
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
        positions.push(ox + (u + px) * h, oy + (v + py) * h, oz + (w + pz) * h);
      }
    }
  }

  // Faces: for each grid edge with a sign change, join the 4 cells around it.
  const indices: number[] = [];
  const quad = (v00: number, v10: number, v11: number, v01: number, flip: boolean): void => {
    if (v00 < 0 || v10 < 0 || v11 < 0 || v01 < 0) return;
    if (flip) {
      indices.push(v00, v01, v11, v00, v11, v10);
    } else {
      indices.push(v00, v10, v11, v00, v11, v01);
    }
  };
  for (let w = 0; w < gz; w++) {
    for (let v = 0; v < gy; v++) {
      for (let u = 0; u < gx; u++) {
        const f0 = field[fIdx(u, v, w)]!;
        // +x edge
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
        // +y edge
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
        // +z edge
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
  console.log(
    `surface nets: vertices=${vertexCount} triangles=${indices.length / 3} ` +
      `(${((Date.now() - t0) / 1000).toFixed(1)}s)`,
  );

  // ── Normals from the field gradient (outward = -grad, since inside is high) ────────────
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
  const normals = new Float32Array(vertexCount * 3);
  for (let vi = 0; vi < vertexCount; vi++) {
    const x = positions[vi * 3]!;
    const y = positions[vi * 3 + 1]!;
    const z = positions[vi * 3 + 2]!;
    let nxg = sample(x - h, y, z) - sample(x + h, y, z);
    let nyg = sample(x, y - h, z) - sample(x, y + h, z);
    let nzg = sample(x, y, z - h) - sample(x, y, z + h);
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

  // ── Write mesh.bin: u32 headerLen, JSON header, f32 positions, f32 normals, u32 indices ─
  const posArr = Float32Array.from(positions);
  const idxArr = Uint32Array.from(indices);
  const headerJson = JSON.stringify({
    format: "gutcheck-mesh-v1",
    vertexCount,
    triangleCount: idxArr.length / 3,
    source: {
      checkpoint: cli.ckptPath,
      checkpointSha256: ckptSha256,
      tick: state.tick,
      dims: state.dims,
      domain: state.domain,
      seed: state.rngSeed,
      noiseEpsilon: state.noiseEpsilon,
      preset: "dendrite",
    },
    extraction: {
      spacing: h,
      sigma,
      iso,
      margin: m,
      levelSet:
        "attached=1; unattached boundary graded by b/ggThreshBeta[2*min(nT,3)+min(nZ,1)]",
    },
    bboxCartesian: { xMin, xMax, yMin, yMax, zMin, zMax },
  });
  // Pad the header to a 4-byte boundary so the typed-array views decode aligned.
  const rawHeader = new TextEncoder().encode(headerJson);
  const paddedLen = Math.ceil(rawHeader.length / 4) * 4;
  const headerBytes = new Uint8Array(paddedLen).fill(0x20);
  headerBytes.set(rawHeader);
  const total = 4 + headerBytes.length + posArr.byteLength + normals.byteLength + idxArr.byteLength;
  const outBuf = new Uint8Array(total);
  const dv = new DataView(outBuf.buffer);
  dv.setUint32(0, headerBytes.length, true);
  outBuf.set(headerBytes, 4);
  let off = 4 + headerBytes.length;
  outBuf.set(new Uint8Array(posArr.buffer), off);
  off += posArr.byteLength;
  outBuf.set(new Uint8Array(normals.buffer), off);
  off += normals.byteLength;
  outBuf.set(new Uint8Array(idxArr.buffer), off);
  writeFileSync(cli.outPath, outBuf);
  console.log(
    `wrote ${cli.outPath} (${total} bytes) vertices=${vertexCount} triangles=${idxArr.length / 3}`,
  );

  if (cli.objPath !== null) {
    const parts: string[] = [];
    for (let vi = 0; vi < vertexCount; vi++) {
      parts.push(
        `v ${posArr[vi * 3]} ${posArr[vi * 3 + 1]} ${posArr[vi * 3 + 2]}`,
        `vn ${normals[vi * 3]} ${normals[vi * 3 + 1]} ${normals[vi * 3 + 2]}`,
      );
    }
    for (let t = 0; t < idxArr.length; t += 3) {
      const i1 = idxArr[t]! + 1;
      const i2 = idxArr[t + 1]! + 1;
      const i3 = idxArr[t + 2]! + 1;
      parts.push(`f ${i1}//${i1} ${i2}//${i2} ${i3}//${i3}`);
    }
    writeFileSync(cli.objPath, parts.join("\n") + "\n");
    console.log(`wrote ${cli.objPath}`);
  }
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main();
