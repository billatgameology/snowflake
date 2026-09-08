import type { DiscoverySpatialSnapshot } from "./post-phase10-discovery.ts";

export type CavityBasalOrientation = "upward" | "downward" | "mixed";

export interface CavityBoundaryStats {
  readonly count: number;
  readonly meanSigmaBoundary: number;
  readonly meanSigmaOpp: number;
  readonly meanAlphaHKBoundary: number;
  /** Mean of cellwise kinetic demand factors, not the product of separate means. */
  readonly meanAlphaHKSigmaBoundary: number;
}

export interface CavityBoundaryComparison {
  readonly direction: "rim-minus-center";
  readonly meanSigmaBoundary: number;
  readonly meanSigmaOpp: number;
  readonly meanAlphaHKBoundary: number;
  readonly meanAlphaHKSigmaBoundary: number;
}

export interface CavityBasalPlaneProfile {
  readonly k: number;
  readonly offset: number;
  readonly zUm: number;
  readonly orientation: CavityBasalOrientation;
  readonly boundaryCellCount: number;
  readonly outermostHexRadius: number;
  readonly outermostHexRadiusUm: number;
  readonly center: CavityBoundaryStats | null;
  readonly rim: CavityBoundaryStats | null;
  readonly comparison: CavityBoundaryComparison | null;
  readonly comparisonUnavailableReason: "missing-center" | "outermost-ring-within-probe" | null;
}

export interface CavityBoundaryProfile {
  readonly rowId: string;
  readonly record: DiscoverySpatialSnapshot["record"];
  readonly timing: DiscoverySpatialSnapshot["timing"];
  readonly dxUm: number;
  readonly probe: {
    readonly requestedRadiusUm: number;
    readonly integerHexRadius: number;
    readonly actualRadiusUm: number;
  };
  readonly facetCounts: Readonly<Record<"basal" | "prism" | "inhibited" | "rough", number>>;
  readonly planes: readonly CavityBasalPlaneProfile[];
  readonly interpretation: readonly string[];
}

type BoundaryCell = DiscoverySpatialSnapshot["cells"][number];
interface BasalGroup {
  readonly k: number;
  readonly orientation: CavityBasalOrientation;
  readonly cells: { readonly cell: BoundaryCell; readonly radius: number }[];
}

function summarizeCells(cells: readonly BoundaryCell[]): CavityBoundaryStats | null {
  if (cells.length === 0) return null;
  let sigmaBoundary = 0;
  let sigmaOpp = 0;
  let alphaHKBoundary = 0;
  let alphaHKSigmaBoundary = 0;
  for (const cell of cells) {
    sigmaBoundary += cell.sigmaBoundary;
    sigmaOpp += cell.sigmaOpp;
    alphaHKBoundary += cell.alphaHKBoundary;
    alphaHKSigmaBoundary += cell.alphaHKBoundary * cell.sigmaBoundary;
  }
  return {
    count: cells.length,
    meanSigmaBoundary: sigmaBoundary / cells.length,
    meanSigmaOpp: sigmaOpp / cells.length,
    meanAlphaHKBoundary: alphaHKBoundary / cells.length,
    meanAlphaHKSigmaBoundary: alphaHKSigmaBoundary / cells.length,
  };
}

/**
 * Descriptive basal center/rim profiles of an already recorded boundary snapshot.
 * The supplied occupancy must be the same pre-surface-advance state as the snapshot.
 */
export function summarizeCavityBoundary(
  snapshot: DiscoverySpatialSnapshot,
  occupied: ReadonlySet<number>,
  probeRadiusUm = 0.35,
): CavityBoundaryProfile {
  if (!Number.isFinite(snapshot.dxUm) || snapshot.dxUm <= 0 ||
      !Number.isFinite(probeRadiusUm) || probeRadiusUm < 0) {
    throw new Error("cavity boundary profiling needs positive spacing and a nonnegative finite probe radius");
  }
  const probeRadius = Math.floor(probeRadiusUm / snapshot.dxUm);
  const axialStride = snapshot.dims.nx * snapshot.dims.ny;
  const facetCounts = { basal: 0, prism: 0, inhibited: 0, rough: 0 };
  const groups = new Map<string, BasalGroup>();
  for (const cell of snapshot.cells) {
    facetCounts[cell.facet]++;
    if (cell.facet !== "basal") continue;
    const [i, j, k] = cell.coords;
    const attachedBelow = k > 0 && occupied.has(cell.index - axialStride);
    const attachedAbove = k + 1 < snapshot.dims.nz && occupied.has(cell.index + axialStride);
    const orientation: CavityBasalOrientation = attachedBelow && !attachedAbove
      ? "upward"
      : attachedAbove && !attachedBelow ? "downward" : "mixed";
    const key = `${k}/${orientation}`;
    let group = groups.get(key);
    if (group === undefined) {
      group = { k, orientation, cells: [] };
      groups.set(key, group);
    }
    const di = i - snapshot.center[0];
    const dj = j - snapshot.center[1];
    group.cells.push({ cell, radius: Math.max(Math.abs(di), Math.abs(dj), Math.abs(di + dj)) });
  }

  const orientationOrder = { upward: 0, downward: 1, mixed: 2 };
  const planes = [...groups.values()]
    .sort((a, b) => a.k - b.k || orientationOrder[a.orientation] - orientationOrder[b.orientation])
    .map((group): CavityBasalPlaneProfile => {
      const outermostHexRadius = group.cells.reduce((largest, entry) => Math.max(largest, entry.radius), 0);
      const center = summarizeCells(group.cells.filter((entry) => entry.radius <= probeRadius).map((entry) => entry.cell));
      const rim = outermostHexRadius > probeRadius
        ? summarizeCells(group.cells.filter((entry) => entry.radius === outermostHexRadius).map((entry) => entry.cell))
        : null;
      const comparison: CavityBoundaryComparison | null = center === null || rim === null ? null : {
        direction: "rim-minus-center",
        meanSigmaBoundary: rim.meanSigmaBoundary - center.meanSigmaBoundary,
        meanSigmaOpp: rim.meanSigmaOpp - center.meanSigmaOpp,
        meanAlphaHKBoundary: rim.meanAlphaHKBoundary - center.meanAlphaHKBoundary,
        meanAlphaHKSigmaBoundary: rim.meanAlphaHKSigmaBoundary - center.meanAlphaHKSigmaBoundary,
      };
      return {
        k: group.k,
        offset: group.k - snapshot.center[2],
        zUm: (group.k - snapshot.center[2]) * snapshot.dxUm,
        orientation: group.orientation,
        boundaryCellCount: group.cells.length,
        outermostHexRadius,
        outermostHexRadiusUm: outermostHexRadius * snapshot.dxUm,
        center,
        rim,
        comparison,
        comparisonUnavailableReason: center === null
          ? "missing-center"
          : rim === null ? "outermost-ring-within-probe" : null,
      };
    });
  return {
    rowId: snapshot.rowId,
    record: { ...snapshot.record },
    timing: snapshot.timing,
    dxUm: snapshot.dxUm,
    probe: { requestedRadiusUm: probeRadiusUm, integerHexRadius: probeRadius, actualRadiusUm: probeRadius * snapshot.dxUm },
    facetCounts,
    planes,
    interpretation: [
      "Basal cells are grouped by axial plane and exposed axial orientation; a group is not guaranteed to be one connected facet.",
      "Center is a domain-centered hex graph ball, not a Euclidean disk; rim is the group's outermost hex-radius ring and is excluded when it overlaps the center probe.",
      "The dimensionless meanAlphaHKSigmaBoundary is a mean cellwise Hertz-Knudsen demand factor, not deposited growth, total uptake, or a product of means.",
      "This snapshot comparison supplies no facet-width, SDAK, causal, or temporal-precursor claim.",
    ],
  };
}
