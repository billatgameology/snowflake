import { describe, expect, it } from "vitest";
import { summarizeCavityBoundary } from "../src/post-phase10-cavity-spatial.ts";
import type { DiscoverySpatialSnapshot } from "../src/post-phase10-discovery.ts";

type BoundaryCell = DiscoverySpatialSnapshot["cells"][number];
const DIMS = { nx: 16, ny: 16, nz: 16 };
const CENTER = [8, 8, 8];
const STRIDE = DIMS.nx * DIMS.ny;

function cell(di: number, dj: number, dk = 1, overrides: Partial<BoundaryCell> = {}): BoundaryCell {
  const coords = [CENTER[0] + di, CENTER[1] + dj, CENTER[2] + dk];
  return {
    index: coords[2] * STRIDE + coords[1] * DIMS.nx + coords[0],
    coords,
    neighborCounts: [0, 1],
    facet: "basal",
    fill: 0,
    sigmaOpp: 0.04,
    sigmaBoundary: 0.02,
    alphaHKBoundary: 0.5,
    robinGeometry: 1,
    fillGeometry: 1,
    ...overrides,
  };
}

function snapshot(cells: readonly BoundaryCell[], occupied: ReadonlySet<number>, dxUm = 0.35): DiscoverySpatialSnapshot {
  return {
    schema: "post-phase10-spatial-boundary-v1",
    rowId: "manufactured-cavity",
    timing: "after-converged-relaxation-before-surface-advance",
    record: { path: "manufactured.json", triggerExtent: 9, actualExtent: 9, completedCycles: 20, simTimeSeconds: 1.25 },
    dims: DIMS,
    center: CENTER,
    dxUm,
    tempC: -4.5,
    sigmaInfinity: 0.05,
    seedRadius: 2,
    seedThickness: 1,
    attachedCount: occupied.size,
    cells,
  };
}

function below(cells: readonly BoundaryCell[]): Set<number> {
  return new Set(cells.map((entry) => entry.index - STRIDE));
}

describe("offline cavity boundary spatial profiles", () => {
  it("compares only center and outermost basal ring in a manufactured plane", () => {
    const cells = [
      cell(0, 0, 1, { sigmaBoundary: 0.2, sigmaOpp: 0.3, alphaHKBoundary: 0.8 }),
      cell(1, 0, 1, { sigmaBoundary: 0.6, sigmaOpp: 0.7, alphaHKBoundary: 0.2 }),
      cell(2, 0, 1, { sigmaBoundary: 100, sigmaOpp: 100, alphaHKBoundary: 1 }),
      cell(3, 0, 1, { sigmaBoundary: 0.4, sigmaOpp: 0.5, alphaHKBoundary: 0.5 }),
      cell(0, 3, 1, { sigmaBoundary: 0.8, sigmaOpp: 0.9, alphaHKBoundary: 0.25 }),
      cell(-4, 0, 1, { facet: "prism" }),
      cell(0, -4, 1, { facet: "rough" }),
      cell(-4, 4, 1, { facet: "inhibited" }),
    ];
    const occupied = below(cells);
    const measured = summarizeCavityBoundary(snapshot(cells, occupied), occupied);
    expect(measured.facetCounts).toEqual({ basal: 5, prism: 1, rough: 1, inhibited: 1 });
    expect(measured.planes).toHaveLength(1);
    const plane = measured.planes[0];
    expect(plane).toMatchObject({
      k: 9, offset: 1, zUm: 0.35, orientation: "upward", boundaryCellCount: 5,
      outermostHexRadius: 3, center: { count: 2 }, rim: { count: 2 },
      comparisonUnavailableReason: null,
    });
    expect(plane.center?.meanSigmaBoundary).toBeCloseTo(0.4, 14);
    expect(plane.rim?.meanSigmaBoundary).toBeCloseTo(0.6, 14);
    expect(plane.comparison?.meanSigmaBoundary).toBeCloseTo(0.2, 14);
    expect(plane.comparison?.meanSigmaOpp).toBeCloseTo(0.2, 14);
    expect(plane.comparison?.direction).toBe("rim-minus-center");
    expect(plane.comparison?.meanAlphaHKBoundary).toBeCloseTo(-0.125, 14);
    expect(measured.record.simTimeSeconds).toBe(1.25);
  });

  it("averages cellwise demand factors rather than multiplying facet means", () => {
    const cells = [
      cell(0, 0, 1, { sigmaBoundary: 0.2, alphaHKBoundary: 0.8 }),
      cell(1, 0, 1, { sigmaBoundary: 0.6, alphaHKBoundary: 0.2 }),
      cell(3, 0, 1, { sigmaBoundary: 0.4, alphaHKBoundary: 0.5 }),
      cell(0, 3, 1, { sigmaBoundary: 0.8, alphaHKBoundary: 0.25 }),
    ];
    const occupied = below(cells);
    const plane = summarizeCavityBoundary(snapshot(cells, occupied), occupied).planes[0];
    expect(plane.center?.meanAlphaHKSigmaBoundary).toBeCloseTo((0.2 * 0.8 + 0.6 * 0.2) / 2, 14);
    expect(plane.center?.meanAlphaHKSigmaBoundary).not.toBeCloseTo(0.4 * 0.5, 14);
    expect(plane.rim?.meanAlphaHKSigmaBoundary).toBeCloseTo(0.2, 14);
    expect(plane.comparison?.meanAlphaHKSigmaBoundary).toBeCloseTo(0.06, 14);
  });

  it("separates upward, downward and mixed occupancy on the same axial plane", () => {
    const upward = [cell(0, 0), cell(3, 0)];
    const downward = [cell(1, 0), cell(-3, 0)];
    const mixed = [cell(0, 1), cell(0, -3)];
    const anotherPlane = cell(0, 0, 2);
    const occupied = new Set([
      ...upward.map((entry) => entry.index - STRIDE),
      ...downward.map((entry) => entry.index + STRIDE),
      ...mixed.flatMap((entry) => [entry.index - STRIDE, entry.index + STRIDE]),
    ]);
    const cells = [...upward, ...downward, ...mixed, anotherPlane];
    const measured = summarizeCavityBoundary(snapshot(cells, occupied), occupied);
    expect(measured.planes.map((plane) => [plane.k, plane.orientation, plane.boundaryCellCount])).toEqual([
      [9, "upward", 2], [9, "downward", 2], [9, "mixed", 2], [10, "mixed", 1],
    ]);
    expect(measured.planes.slice(0, 3).every((plane) => plane.center?.count === 1 && plane.rim?.count === 1)).toBe(true);
  });

  it("does not compare overlapping center and rim or invent a missing center", () => {
    const compact = [cell(0, 0), cell(1, 0)];
    const compactOccupied = below(compact);
    const overlapping = summarizeCavityBoundary(snapshot(compact, compactOccupied), compactOccupied).planes[0];
    expect(overlapping.center?.count).toBe(2);
    expect(overlapping.rim).toBeNull();
    expect(overlapping.comparison).toBeNull();
    expect(overlapping.comparisonUnavailableReason).toBe("outermost-ring-within-probe");

    const rimOnly = [cell(3, 0), cell(0, 3)];
    const rimOccupied = below(rimOnly);
    const absent = summarizeCavityBoundary(snapshot(rimOnly, rimOccupied), rimOccupied).planes[0];
    expect(absent.center).toBeNull();
    expect(absent.rim?.count).toBe(2);
    expect(absent.comparison).toBeNull();
    expect(absent.comparisonUnavailableReason).toBe("missing-center");
  });

  it("uses a physical-radius hex probe and remains a labeled descriptive snapshot", () => {
    const cells = [cell(2, 0), cell(3, 0)];
    const occupied = below(cells);
    const measured = summarizeCavityBoundary(snapshot(cells, occupied, 0.175), occupied);
    expect(measured.probe).toEqual({ requestedRadiusUm: 0.35, integerHexRadius: 2, actualRadiusUm: 0.35 });
    expect(measured.planes[0].center?.count).toBe(1);
    expect(measured.planes[0].rim?.count).toBe(1);
    expect(measured.interpretation.join(" ")).toContain("not guaranteed to be one connected facet");
    expect(measured.interpretation.join(" ")).toContain("not deposited growth");
    expect(measured.interpretation.join(" ")).toContain("no facet-width, SDAK, causal, or temporal-precursor claim");
    expect(summarizeCavityBoundary(snapshot([], new Set()), new Set()).planes).toEqual([]);
  });
});
