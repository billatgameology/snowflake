import { coordsOf, domainCenter, type Dims } from "@vcc/core";

export interface CavityAxisSpan {
  readonly min: number;
  readonly max: number;
  readonly centerSpanCells: number;
  readonly centerSpanUm: number;
  readonly inclusiveCells: number;
  readonly inclusiveSpanUm: number;
}

export interface CavityLayerProfile {
  readonly k: number;
  readonly offset: number;
  readonly zUm: number;
  readonly attachedCount: number;
  readonly integerHexRadius: number | null;
  readonly integerHexRadiusUm: number | null;
  readonly centerOccupied: boolean;
  readonly probeOccupiedCount: number;
  readonly probeState: "empty" | "partial" | "full";
  readonly lateralVoid: "center-occupied" | "enclosed" | "open";
  readonly enclosedVoidSiteCount: number | null;
  readonly enclosedVoidAreaUm2: number | null;
  /** A straight empty-axis route is sufficient for opening; false does not mean closed in 3D. */
  readonly directAxialOpening: { readonly lower: boolean | null; readonly upper: boolean | null };
}

export interface CavityGeometry {
  readonly center: readonly [number, number, number];
  readonly dxUm: number;
  readonly attachedCount: number;
  readonly hexCellAreaUm2: number;
  /** Attached-cell volume only: excludes partial fill and is not total accreted ice mass. */
  readonly occupiedCellVolumeUm3: number;
  /** i/j are axial lattice coordinates, not Cartesian x/y bounding-box projections. */
  readonly spans: { readonly i: CavityAxisSpan; readonly j: CavityAxisSpan; readonly k: CavityAxisSpan } | null;
  readonly integerHexRadius: number | null;
  readonly integerHexRadiusUm: number | null;
  /** A hex graph ball, not a Euclidean disk; actual radius is floor(requested/dx)*dx. */
  readonly probe: {
    readonly requestedRadiusUm: number;
    readonly integerHexRadius: number;
    readonly actualRadiusUm: number;
    readonly siteCount: number;
  };
  /** Every slice in the occupied axial bounding interval, including empty intervening slices. */
  readonly layers: readonly CavityLayerProfile[];
  /** Contiguous probe-full slices containing the domain-center plane; empty means zero thickness. */
  readonly waist: {
    readonly probeFullLayerCount: number;
    readonly lowerOffset: number | null;
    readonly upperOffset: number | null;
    readonly centerSpanUm: number;
    readonly inclusiveThicknessUm: number;
  };
}

const planarNeighbors: readonly (readonly [number, number])[] = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1],
];
const hexRadius = (i: number, j: number): number => Math.max(Math.abs(i), Math.abs(j), Math.abs(i + j));
const planarKey = (i: number, j: number): string => `${i},${j}`;

/** Empty-center component in the infinite plane; beyond every occupied radius is exterior. */
function enclosedCenterSites(cells: ReadonlySet<string>, occupiedRadius: number): number | null {
  const queue: [number, number][] = [[0, 0]];
  const visited = new Set(["0,0"]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const [i, j] = queue[cursor];
    for (const [di, dj] of planarNeighbors) {
      const ni = i + di;
      const nj = j + dj;
      if (hexRadius(ni, nj) > occupiedRadius) return null;
      const key = planarKey(ni, nj);
      if (cells.has(key) || visited.has(key)) continue;
      visited.add(key);
      queue.push([ni, nj]);
    }
  }
  return visited.size;
}

export function measureCavityGeometry(
  occupied: ReadonlySet<number>,
  dims: Dims,
  dxUm: number,
  probeRadiusUm = 0.35,
): CavityGeometry {
  if (![dims.nx, dims.ny, dims.nz].every((n) => Number.isSafeInteger(n) && n > 0)) {
    throw new Error("cavity geometry needs positive integer dimensions");
  }
  if (!Number.isFinite(dxUm) || dxUm <= 0 || !Number.isFinite(probeRadiusUm) || probeRadiusUm < 0) {
    throw new Error("cavity geometry needs positive spacing and nonnegative finite probe radius");
  }
  const center = domainCenter(dims);
  const probeRadius = Math.floor(probeRadiusUm / dxUm);
  const probe = {
    requestedRadiusUm: probeRadiusUm,
    integerHexRadius: probeRadius,
    actualRadiusUm: probeRadius * dxUm,
    siteCount: 1 + 3 * probeRadius * (probeRadius + 1),
  };
  const hexCellAreaUm2 = Math.sqrt(3) / 2 * dxUm ** 2;
  const byLayer = new Map<number, { cells: Set<string>; radius: number; probeCount: number }>();
  const minima = [Infinity, Infinity, Infinity];
  const maxima = [-Infinity, -Infinity, -Infinity];
  const axisOccupied: number[] = [];
  let maximumRadius = 0;
  for (const index of occupied) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= dims.nx * dims.ny * dims.nz) {
      throw new Error(`cavity occupancy index out of bounds: ${index}`);
    }
    const coordinates = coordsOf(dims, index);
    for (let axis = 0; axis < 3; axis++) {
      minima[axis] = Math.min(minima[axis], coordinates[axis]);
      maxima[axis] = Math.max(maxima[axis], coordinates[axis]);
    }
    const [i, j, k] = coordinates;
    const di = i - center[0];
    const dj = j - center[1];
    const radius = hexRadius(di, dj);
    const layer = byLayer.get(k) ?? { cells: new Set<string>(), radius: 0, probeCount: 0 };
    layer.cells.add(planarKey(di, dj));
    layer.radius = Math.max(layer.radius, radius);
    if (radius <= probeRadius) layer.probeCount++;
    byLayer.set(k, layer);
    maximumRadius = Math.max(maximumRadius, radius);
    if (di === 0 && dj === 0) axisOccupied.push(k);
  }
  const layers: CavityLayerProfile[] = [];
  for (let k = minima[2]; k <= maxima[2]; k++) {
    const layer = byLayer.get(k);
    const centerOccupied = layer?.cells.has("0,0") ?? false;
    const enclosed = centerOccupied || layer === undefined ? null : enclosedCenterSites(layer.cells, layer.radius);
    const probeCount = layer?.probeCount ?? 0;
    layers.push({
      k,
      offset: k - center[2],
      zUm: (k - center[2]) * dxUm,
      attachedCount: layer?.cells.size ?? 0,
      integerHexRadius: layer?.radius ?? null,
      integerHexRadiusUm: layer === undefined ? null : layer.radius * dxUm,
      centerOccupied,
      probeOccupiedCount: probeCount,
      probeState: probeCount === 0 ? "empty" : probeCount === probe.siteCount ? "full" : "partial",
      lateralVoid: centerOccupied ? "center-occupied" : enclosed === null ? "open" : "enclosed",
      enclosedVoidSiteCount: enclosed,
      enclosedVoidAreaUm2: enclosed === null ? null : enclosed * hexCellAreaUm2,
      directAxialOpening: {
        lower: centerOccupied ? null : !axisOccupied.some((other) => other < k),
        upper: centerOccupied ? null : !axisOccupied.some((other) => other > k),
      },
    });
  }
  const fullProbeOffsets = new Set(layers.filter((layer) => layer.probeState === "full").map((layer) => layer.offset));
  let lowerOffset: number | null = null;
  let upperOffset: number | null = null;
  if (fullProbeOffsets.has(0)) {
    lowerOffset = 0;
    upperOffset = 0;
    while (fullProbeOffsets.has(lowerOffset - 1)) lowerOffset--;
    while (fullProbeOffsets.has(upperOffset + 1)) upperOffset++;
  }
  const waistCount = lowerOffset === null || upperOffset === null ? 0 : upperOffset - lowerOffset + 1;
  const span = (axis: number): CavityAxisSpan => ({
    min: minima[axis],
    max: maxima[axis],
    centerSpanCells: maxima[axis] - minima[axis],
    centerSpanUm: (maxima[axis] - minima[axis]) * dxUm,
    inclusiveCells: maxima[axis] - minima[axis] + 1,
    inclusiveSpanUm: (maxima[axis] - minima[axis] + 1) * dxUm,
  });
  return {
    center,
    dxUm,
    attachedCount: occupied.size,
    hexCellAreaUm2,
    occupiedCellVolumeUm3: occupied.size * hexCellAreaUm2 * dxUm,
    spans: occupied.size === 0 ? null : { i: span(0), j: span(1), k: span(2) },
    integerHexRadius: occupied.size === 0 ? null : maximumRadius,
    integerHexRadiusUm: occupied.size === 0 ? null : maximumRadius * dxUm,
    probe,
    layers,
    waist: {
      probeFullLayerCount: waistCount,
      lowerOffset,
      upperOffset,
      centerSpanUm: Math.max(0, waistCount - 1) * dxUm,
      inclusiveThicknessUm: waistCount * dxUm,
    },
  };
}
