// A stable compact-tour frustum keeps the authored zoom motion intact while
// allowing the occupied bounding box to rotate without crossing the viewport.
interface FramingPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export function growthTourFramingSpan(
  sourceRadius: number,
  bounds: { readonly min: FramingPoint; readonly max: FramingPoint },
  maximumAuthoredZoom: number,
): number {
  const operands = [sourceRadius, maximumAuthoredZoom,
    bounds.min.x, bounds.max.x, bounds.min.y, bounds.max.y, bounds.min.z, bounds.max.z];
  if (!operands.every(Number.isFinite) || sourceRadius <= 0 || maximumAuthoredZoom <= 0) {
    throw new Error("growth tour framing requires finite bounds and positive radius/zoom");
  }
  if (bounds.min.x > bounds.max.x || bounds.min.y > bounds.max.y || bounds.min.z > bounds.max.z) {
    throw new Error("growth tour framing bounds are inverted");
  }
  const cornerRadius = Math.hypot(
    Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x)),
    Math.max(Math.abs(bounds.min.y), Math.abs(bounds.max.y)),
    Math.max(Math.abs(bounds.min.z), Math.abs(bounds.max.z)),
  );
  return Math.max(sourceRadius, cornerRadius * maximumAuthoredZoom) * 1.12;
}
