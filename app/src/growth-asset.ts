export interface GrowthAssetV1 {
  readonly eventCount: number;
  readonly seedCount: number;
  readonly finalTick: number;
  readonly dims: readonly [number, number, number];
  readonly center: readonly [number, number, number];
  readonly flatIndices: Uint32Array;
  readonly attachTicks: Uint32Array;
}

const positiveInteger = (value: unknown, label: string): number => {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new Error(`${label} must be a positive safe integer`);
  }
  return value as number;
};

const nonnegativeInteger = (value: unknown, label: string): number => {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`${label} must be a nonnegative safe integer`);
  }
  return value as number;
};

const triplet = (value: unknown, label: string): readonly [number, number, number] => {
  if (!Array.isArray(value) || value.length !== 3) throw new Error(`${label} must have three values`);
  return [
    nonnegativeInteger(value[0], `${label}[0]`),
    nonnegativeInteger(value[1], `${label}[1]`),
    nonnegativeInteger(value[2], `${label}[2]`),
  ];
};

export function decodeGrowthAssetV1(buffer: ArrayBuffer): GrowthAssetV1 {
  if (buffer.byteLength < 4) throw new Error("growth asset is shorter than its header prefix");
  const view = new DataView(buffer);
  const headerBytes = view.getUint32(0, true);
  if (headerBytes < 1 || headerBytes > 1024 * 1024 || 4 + headerBytes > buffer.byteLength) {
    throw new Error("growth asset header length is invalid");
  }
  let header: Record<string, unknown>;
  try {
    header = JSON.parse(
      new TextDecoder().decode(new Uint8Array(buffer, 4, headerBytes)),
    ) as Record<string, unknown>;
  } catch {
    throw new Error("growth asset header is not valid JSON");
  }
  if (header.format !== "gutcheck-growth-v1") throw new Error("unexpected growth asset format");
  const eventCount = positiveInteger(header.eventCount, "growth.eventCount");
  if (header.attachedCount !== eventCount) throw new Error("growth attachedCount disagrees with eventCount");
  const seedCount = positiveInteger(header.seedCount, "growth.seedCount");
  if (seedCount > eventCount) throw new Error("growth seedCount exceeds eventCount");
  const finalTick = positiveInteger(header.finalTick, "growth.finalTick");
  const config = header.config;
  if (config === null || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("growth.config must be an object");
  }
  const configWire = config as Record<string, unknown>;
  const dimsWire = configWire.dims;
  if (dimsWire === null || typeof dimsWire !== "object" || Array.isArray(dimsWire)) {
    throw new Error("growth.config.dims must be an object");
  }
  const dimsObject = dimsWire as Record<string, unknown>;
  const dims: readonly [number, number, number] = [
    positiveInteger(dimsObject.nx, "growth.config.dims.nx"),
    positiveInteger(dimsObject.ny, "growth.config.dims.ny"),
    positiveInteger(dimsObject.nz, "growth.config.dims.nz"),
  ];
  const center = triplet(configWire.center, "growth.config.center");
  const expectedBytes = 4 + headerBytes + eventCount * 8;
  if (buffer.byteLength !== expectedBytes) {
    throw new Error(`growth asset length ${buffer.byteLength} disagrees with expected ${expectedBytes}`);
  }

  const flatIndices = new Uint32Array(eventCount);
  const attachTicks = new Uint32Array(eventCount);
  const cellCount = dims[0] * dims[1] * dims[2];
  let previousTick = 0;
  for (let event = 0; event < eventCount; event++) {
    const offset = 4 + headerBytes + event * 8;
    const flat = view.getUint32(offset, true);
    const tick = view.getUint32(offset + 4, true);
    if (flat >= cellCount) throw new Error(`growth event ${event} flat index is outside dims`);
    if (tick < previousTick || tick > finalTick) {
      throw new Error(`growth event ${event} attach tick is not chronological`);
    }
    if ((event < seedCount && tick !== 0) || (event >= seedCount && tick === 0)) {
      throw new Error(`growth event ${event} violates the seed/event tick partition`);
    }
    flatIndices[event] = flat;
    attachTicks[event] = tick;
    previousTick = tick;
  }
  return { eventCount, seedCount, finalTick, dims, center, flatIndices, attachTicks };
}

export function visibleGrowthEventCount(asset: GrowthAssetV1, tick: number): number {
  let low = 0;
  let high = asset.eventCount;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (asset.attachTicks[middle]! <= tick) low = middle + 1;
    else high = middle;
  }
  return low;
}
