/** Presentation-only reader for recorded G-G attachment events. */
export interface DendriteData {
  positions: Float32Array;
  ticks: Float32Array;
  finalTick: number;
  radius: number;
  extent: number;
  vertical: boolean;
  eventCount: number;
  sourceSha256: string;
}

export function readDendrite(buffer: ArrayBuffer): DendriteData {
  const view = new DataView(buffer);
  const fail = (message: string): never => { throw new Error(`Dendrite data: ${message}`); };
  if (buffer.byteLength < 4) fail("missing header");
  const length = view.getUint32(0, true);
  if (length < 1 || length > 65536 || length + 4 > buffer.byteLength) fail("invalid header size");
  const h = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 4, length))) as {
    format: string; eventCount: number; finalTick: number; dims: number[];
    center: number[]; sourceSha256: string;
  };
  if (h.format !== "dendrite-presentation-v1") fail("unknown format");
  if (!Number.isSafeInteger(h.eventCount) || h.eventCount < 1 || h.eventCount > 2000000) fail("invalid event count");
  // Float32 attributes retain these integer ticks exactly.
  if (!Number.isSafeInteger(h.finalTick) || h.finalTick < 1 || h.finalTick > 16777215) fail("invalid final tick");
  if (!Array.isArray(h.dims) || h.dims.length !== 3 || h.dims.some(n => !Number.isInteger(n) || n < 1 || n > 4096)) fail("invalid dimensions");
  if (!Array.isArray(h.center) || h.center.length !== 3 || h.center.some((n, i) => !Number.isFinite(n) || n < 0 || n >= h.dims[i]!)) fail("invalid centre");
  if (!/^[a-f0-9]{64}$/u.test(h.sourceSha256)) fail("missing source identity");
  if (buffer.byteLength !== 4 + length + h.eventCount * 8) fail("truncated or trailing events");
  const [nx, ny, nz] = h.dims as [number, number, number];
  const [ci, cj, ck] = h.center as [number, number, number];
  const positions = new Float32Array(h.eventCount * 3);
  const ticks = new Float32Array(h.eventCount);
  const seen = new Set<number>();
  let radius = 0;
  let extent = 0;
  let halfHeight = 0;
  let previous = 0;
  for (let e = 0, offset = 4 + length; e < h.eventCount; e++, offset += 8) {
    const flat = view.getUint32(offset, true);
    const tick = view.getUint32(offset + 4, true);
    if (flat >= nx * ny * nz || seen.has(flat)) fail("invalid or duplicate site");
    if (tick < previous || tick > h.finalTick) fail("unordered or out-of-range tick");
    seen.add(flat);
    previous = tick;
    const k = Math.floor(flat / (nx * ny));
    const j = Math.floor((flat - k * nx * ny) / nx);
    const i = flat % nx;
    const x = i - ci + (j - cj) * 0.5;
    const y = (j - cj) * Math.sqrt(3) * 0.5;
    positions.set([x, y, k - ck], e * 3);
    ticks[e] = tick;
    radius = Math.max(radius, Math.hypot(x, y));
    extent = Math.max(extent, Math.hypot(x, y, k - ck));
    halfHeight = Math.max(halfHeight, Math.abs(k - ck));
  }
  return { positions, ticks, finalTick: h.finalTick, radius, extent: Math.max(1, extent), vertical: halfHeight > radius, eventCount: h.eventCount, sourceSha256: h.sourceSha256 };
}

/** Integer event threshold: the fractional display clock cannot reveal a future site. */
export function visibleEventCount(ticks: Float32Array, playhead: number): number {
  let lo = 0;
  let hi = ticks.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (ticks[mid]! <= playhead) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
