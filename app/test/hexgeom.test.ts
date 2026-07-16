// Prism geometry tests (A2-4): the hexagon's FLATS must face the six T-neighbor directions
// of the cartesian embedding, with across-flats = 1 — pinned to T_NEIGHBOR_OFFSETS and
// cartesian(), not to how a screenshot happens to look.

import { describe, expect, it } from "vitest";
import { T_NEIGHBOR_OFFSETS, cartesian } from "@vcc/core";
import {
  HEX_APOTHEM,
  HEX_CIRCUMRADIUS,
  PRISM_HEIGHT,
  hexCorners,
  hexPrismMeshData,
} from "../src/hexgeom.ts";

/** Unit xy-direction from a cell to its (di, dj) T-neighbor, via the cartesian embedding. */
function neighborDirection(di: number, dj: number): [number, number] {
  const [x, y] = cartesian(di, dj, 0);
  const len = Math.hypot(x, y);
  return [x / len, y / len];
}

describe("hexCorners", () => {
  it("has 6 corners on the circumradius", () => {
    const corners = hexCorners();
    expect(corners).toHaveLength(6);
    for (const [x, y] of corners) {
      expect(Math.hypot(x, y)).toBeCloseTo(HEX_CIRCUMRADIUS, 12);
    }
  });

  it("presents a FLAT (two support corners at distance 1/2) toward every T-neighbor", () => {
    const corners = hexCorners();
    for (const [di, dj] of T_NEIGHBOR_OFFSETS) {
      const [ux, uy] = neighborDirection(di, dj);
      const supports = corners.map(([x, y]) => x * ux + y * uy);
      const max = Math.max(...supports);
      // Support distance = apothem = across-flats / 2: adjacent prisms meet exactly.
      expect(max).toBeCloseTo(HEX_APOTHEM, 12);
      // Exactly TWO corners at the support distance = an edge faces the neighbor. One would
      // mean a vertex faces it (the 30-degree-rotated, star-rendering mistake).
      const atMax = supports.filter((s) => Math.abs(s - max) < 1e-9).length;
      expect(atMax).toBe(2);
    }
  });

  it("across-flats spans exactly one lattice spacing", () => {
    const corners = hexCorners();
    for (const [di, dj] of T_NEIGHBOR_OFFSETS) {
      const [ux, uy] = neighborDirection(di, dj);
      const supports = corners.map(([x, y]) => x * ux + y * uy);
      expect(Math.max(...supports) - Math.min(...supports)).toBeCloseTo(1, 12);
    }
  });
});

describe("hexPrismMeshData", () => {
  const data = hexPrismMeshData();
  const vertexCount = data.positions.length / 3;

  it("has 36 vertices and 20 triangles", () => {
    expect(data.positions.length).toBe(36 * 3);
    expect(data.normals.length).toBe(36 * 3);
    expect(data.indices.length).toBe(20 * 3);
  });

  it("spans z in [-1/2, +1/2] (height = one lattice spacing)", () => {
    let zMin = Infinity;
    let zMax = -Infinity;
    for (let v = 0; v < vertexCount; v++) {
      const z = data.positions[v * 3 + 2];
      zMin = Math.min(zMin, z);
      zMax = Math.max(zMax, z);
    }
    expect(zMin).toBeCloseTo(-PRISM_HEIGHT / 2, 12);
    expect(zMax).toBeCloseTo(PRISM_HEIGHT / 2, 12);
  });

  it("all normals are unit length", () => {
    for (let v = 0; v < vertexCount; v++) {
      const nx = data.normals[v * 3];
      const ny = data.normals[v * 3 + 1];
      const nz = data.normals[v * 3 + 2];
      expect(Math.hypot(nx, ny, nz)).toBeCloseTo(1, 6);
    }
  });

  it("every triangle's geometric normal matches its stored vertex normals (outward winding)", () => {
    for (let t = 0; t < data.indices.length; t += 3) {
      const i0 = data.indices[t];
      const i1 = data.indices[t + 1];
      const i2 = data.indices[t + 2];
      const p = (v: number): [number, number, number] => [
        data.positions[v * 3],
        data.positions[v * 3 + 1],
        data.positions[v * 3 + 2],
      ];
      const [ax, ay, az] = p(i0);
      const [bx, by, bz] = p(i1);
      const [cx, cy, cz] = p(i2);
      const e1 = [bx - ax, by - ay, bz - az];
      const e2 = [cx - ax, cy - ay, cz - az];
      const gx = e1[1] * e2[2] - e1[2] * e2[1];
      const gy = e1[2] * e2[0] - e1[0] * e2[2];
      const gz = e1[0] * e2[1] - e1[1] * e2[0];
      const glen = Math.hypot(gx, gy, gz);
      expect(glen).toBeGreaterThan(0);
      // Stored normal of the first vertex (faces are flat: all three agree).
      const nx = data.normals[i0 * 3];
      const ny = data.normals[i0 * 3 + 1];
      const nz = data.normals[i0 * 3 + 2];
      const dot = (gx * nx + gy * ny + gz * nz) / glen;
      expect(dot).toBeCloseTo(1, 6);
    }
  });

  it("side-face normals point away from the prism axis, toward T-neighbor directions", () => {
    const neighborDirs = T_NEIGHBOR_OFFSETS.map(([di, dj]) => neighborDirection(di, dj));
    const sideNormals = new Set<string>();
    for (let v = 0; v < vertexCount; v++) {
      const nx = data.normals[v * 3];
      const ny = data.normals[v * 3 + 1];
      const nz = data.normals[v * 3 + 2];
      if (Math.abs(nz) > 1e-9) continue; // top/bottom
      sideNormals.add(`${nx.toFixed(6)},${ny.toFixed(6)}`);
      const matches = neighborDirs.some(([ux, uy]) => nx * ux + ny * uy > 1 - 1e-6);
      expect(matches).toBe(true);
    }
    expect(sideNormals.size).toBe(6); // one distinct outward normal per rectangular face
  });
});
