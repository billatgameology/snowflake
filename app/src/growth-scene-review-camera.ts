export interface GrowthSceneReviewCamera {
  readonly tiltDegrees: number;
  readonly yawDegrees: number;
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
