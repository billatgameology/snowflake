export interface SpikeOrthographicFrame {
  readonly tiltRadians: number;
  readonly span: number;
  readonly worldExtent: number;
}

/** Pure framing calculation shared by the gut-check viewer and its tall-column regression. */
export function spikeOrthographicFrame(
  extent: Readonly<{ x: number; y: number; z: number }>,
  tiltDegrees: number,
  aspect: number,
  zoom: number,
  yawDegrees = 0,
): SpikeOrthographicFrame {
  const tiltRadians = (tiltDegrees * Math.PI) / 180;
  const yawRadians = (yawDegrees * Math.PI) / 180;
  const projectedWidth =
    Math.abs(Math.cos(yawRadians)) * extent.x +
    Math.abs(Math.sin(yawRadians)) * extent.y;
  const projectedHeight =
    Math.abs(Math.cos(tiltRadians) * Math.sin(yawRadians)) * extent.x +
    Math.abs(Math.cos(tiltRadians) * Math.cos(yawRadians)) * extent.y +
    Math.abs(Math.sin(tiltRadians)) * extent.z;
  return {
    tiltRadians,
    span: Math.max(projectedHeight / 2, projectedWidth / (2 * aspect)) * 1.12 * zoom,
    worldExtent: Math.max(extent.x, extent.y, extent.z),
  };
}
