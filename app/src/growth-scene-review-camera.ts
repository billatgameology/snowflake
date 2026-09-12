export interface GrowthSceneReviewCamera {
  readonly tiltDegrees: number;
  readonly yawDegrees: number;
}

export interface GrowthSceneProjectedBounds {
  readonly xMin: number;
  readonly xMax: number;
  readonly yMin: number;
  readonly yMax: number;
}

export const GROWTH_SCENE_REVIEW_NDC_LIMIT = 0.9;

export function growthSceneProjectedBoundsHaveClearance(
  value: unknown,
  limit = GROWTH_SCENE_REVIEW_NDC_LIMIT,
): value is GrowthSceneProjectedBounds {
  if (typeof value !== "object" || value === null || !Number.isFinite(limit) || limit <= 0 || limit > 1) {
    return false;
  }
  const candidate = value as Partial<GrowthSceneProjectedBounds>;
  const coordinates = [candidate.xMin, candidate.xMax, candidate.yMin, candidate.yMax];
  if (!coordinates.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate))) {
    return false;
  }
  return candidate.xMin! >= -limit && candidate.xMax! <= limit &&
    candidate.yMin! >= -limit && candidate.yMax! <= limit &&
    candidate.xMin! < candidate.xMax! && candidate.yMin! < candidate.yMax!;
}

const bounded = (raw: string | null, fallback: number, minimum: number, maximum: number, name: string): number => {
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be finite and within ${minimum}..${maximum} degrees`);
  }
  return value;
};

export function growthSceneReviewCamera(
  query: URLSearchParams,
  committed: GrowthSceneReviewCamera,
): GrowthSceneReviewCamera {
  if (query.get("capture") !== "1") return committed;
  return {
    tiltDegrees: bounded(query.get("reviewTilt"), committed.tiltDegrees, -90, 90, "reviewTilt"),
    yawDegrees: bounded(query.get("reviewYaw"), committed.yawDegrees, -180, 180, "reviewYaw"),
  };
}
