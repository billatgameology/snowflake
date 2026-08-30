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
): SpikeOrthographicFrame {
  const tiltRadians = (tiltDegrees * Math.PI) / 180;
  const projectedHeight =
    Math.abs(Math.cos(tiltRadians)) * extent.y +
    Math.abs(Math.sin(tiltRadians)) * extent.z;
  return {
    tiltRadians,
    span: Math.max(projectedHeight / 2, extent.x / (2 * aspect)) * 1.12 * zoom,
    worldExtent: Math.max(extent.x, extent.y, extent.z),
  };
}
