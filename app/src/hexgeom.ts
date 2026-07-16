// The fundamental-cell prism geometry, as pure math (no three.js) so it unit-tests in node.
//
// gg-machinery §1: the cell is a hexagonal prism with across-flats = 1 and height = 1, in the
// cartesian embedding x = i + j/2, y = j*sqrt(3)/2, z = k. The six in-plane neighbor
// directions therefore sit at angles 0, 60, ..., 300 degrees in the xy-plane, and the prism's
// six FLATS must face them: corners go at 30 + 60n degrees with circumradius 1/sqrt(3)
// (apothem = across-flats / 2 = 1/2). Getting this wrong by 30 degrees renders a
// vertex-to-vertex tiling that reads as a star; the tests pin the orientation to
// T_NEIGHBOR_OFFSETS, not to eyeballs.

/** Apothem: across-flats / 2. The distance from the prism axis to each rectangular face. */
export const HEX_APOTHEM = 0.5;

/** Circumradius of the unit-across-flats hexagon. */
export const HEX_CIRCUMRADIUS = 1 / Math.sqrt(3);

/** Prism height (one lattice spacing in z). */
export const PRISM_HEIGHT = 1;

/** The 6 hexagon corners, CCW, at angles 30 + 60n degrees. */
export function hexCorners(): ReadonlyArray<readonly [number, number]> {
  const corners: Array<readonly [number, number]> = [];
  for (let n = 0; n < 6; n++) {
    const theta = (Math.PI / 180) * (30 + 60 * n);
    corners.push([HEX_CIRCUMRADIUS * Math.cos(theta), HEX_CIRCUMRADIUS * Math.sin(theta)]);
  }
  return corners;
}

export interface PrismMeshData {
  /** xyz triples; the prism is centered on the origin, z in [-1/2, +1/2]. */
  readonly positions: Float32Array;
  /** Flat (per-face) normals, one per vertex. */
  readonly normals: Float32Array;
  readonly indices: Uint16Array;
}

/**
 * Flat-shaded hexagonal prism: 6 side quads + top and bottom hexagons, vertices duplicated
 * per face so every facet keeps its own normal. 36 vertices, 20 triangles.
 */
export function hexPrismMeshData(): PrismMeshData {
  const corners = hexCorners();
  const zTop = PRISM_HEIGHT / 2;
  const zBot = -PRISM_HEIGHT / 2;

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Side quads. The edge from corner n to corner n+1 faces the direction 60*(n+1) degrees —
  // one of the six T-neighbor directions. CCW from outside: bottom n, bottom n+1, top n+1,
  // top n.
  for (let n = 0; n < 6; n++) {
    const c0 = corners[n];
    const c1 = corners[(n + 1) % 6];
    const theta = (Math.PI / 180) * 60 * (n + 1);
    const nxOut = Math.cos(theta);
    const nyOut = Math.sin(theta);
    const base = positions.length / 3;
    positions.push(c0[0], c0[1], zBot, c1[0], c1[1], zBot, c1[0], c1[1], zTop, c0[0], c0[1], zTop);
    for (let v = 0; v < 4; v++) normals.push(nxOut, nyOut, 0);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  // Top hexagon (normal +z), fan; corners are already CCW seen from above.
  {
    const base = positions.length / 3;
    for (const [cx, cy] of corners) {
      positions.push(cx, cy, zTop);
      normals.push(0, 0, 1);
    }
    for (let n = 1; n < 5; n++) indices.push(base, base + n, base + n + 1);
  }

  // Bottom hexagon (normal -z), fan with reversed winding.
  {
    const base = positions.length / 3;
    for (const [cx, cy] of corners) {
      positions.push(cx, cy, zBot);
      normals.push(0, 0, -1);
    }
    for (let n = 1; n < 5; n++) indices.push(base, base + n + 1, base + n);
  }

  return {
    positions: Float32Array.from(positions),
    normals: Float32Array.from(normals),
    indices: Uint16Array.from(indices),
  };
}
