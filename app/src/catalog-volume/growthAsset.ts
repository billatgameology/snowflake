/**
 * `gutcheck-growth-v1` — the measured attachment history this site replays.
 *
 * The file is one JSON header followed by a flat event table: for every lattice
 * site that ever froze, the tick it froze on. Nothing is interpolated into it and
 * nothing is smoothed — the smoothing happens later, in the shader, and is a
 * presentation choice rather than part of the record.
 *
 * The decoder is strict on purpose. A malformed field throws here rather than
 * producing a crystal that looks plausible and is wrong, which for this project
 * is the worst available outcome. Ported from the source repository's baker so
 * both sides read the same bytes the same way.
 */

export const GROWTH_FORMAT = 'gutcheck-growth-v1' as const
/** Sentinel arrival tick. A site carrying it never attached. */
export const NEVER_TICK = 0xffff_ffff
const EVENT_BYTES = 8
const MAX_HEADER_BYTES = 1024 * 1024
const MAX_EVENTS = 8 * 1024 * 1024
const MAX_VOLUME_CELLS = 128 * 1024 * 1024

export type Vec3 = readonly [number, number, number]

export type GrowthDims = { readonly nx: number; readonly ny: number; readonly nz: number }

export type GrowthCrop = {
  readonly iMin: number
  readonly iMax: number
  readonly jMin: number
  readonly jMax: number
  readonly kMin: number
  readonly kMax: number
  readonly padding: number
}

/** The subset of the header this renderer reads. Unknown keys are carried, not rejected. */
export type GrowthHeader = {
  readonly format: typeof GROWTH_FORMAT
  readonly eventCount: number
  readonly attachedCount: number
  readonly seedCount: number
  readonly finalTick: number
  readonly terminationReason: string
  readonly crop: GrowthCrop
  readonly config: {
    readonly preset: string
    readonly dims: GrowthDims
    readonly center: Vec3
    readonly domain: string
    readonly tickCap: number
    readonly rngSeed: number
    readonly noiseEpsilon: number
    readonly seedRadius: number
    readonly seedThickness: number
  }
  readonly source: { readonly label: string; readonly [key: string]: unknown }
}

export type DecodedGrowth = {
  readonly header: GrowthHeader
  readonly flatIndices: Uint32Array
  readonly attachTicks: Uint32Array
}

/** Arrival ticks laid out over the crop box, i fastest. `NEVER_TICK` means empty. */
export type GrowthVolume = {
  readonly data: Uint32Array
  readonly size: Vec3
  readonly finalTick: number
  /** Lattice samples collapsed into each volume cell along i and j. 1 = full detail. */
  readonly decimation: number
}

function fail(message: string): never {
  throw new Error(`growth asset: ${message}`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) fail(`${label} must be an object`)
  return value
}

function int(value: unknown, min: number, max: number, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) {
    fail(`${label} must be an integer in [${min}, ${max}]`)
  }
  return value as number
}

function str(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') fail(`${label} must be a non-empty string`)
  return value
}

function num(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(`${label} must be finite`)
  return value
}

function decodeCrop(value: unknown, dims: GrowthDims): GrowthCrop {
  const raw = record(value, 'crop')
  const crop: GrowthCrop = {
    iMin: int(raw.iMin, 0, dims.nx - 1, 'crop.iMin'),
    iMax: int(raw.iMax, 0, dims.nx - 1, 'crop.iMax'),
    jMin: int(raw.jMin, 0, dims.ny - 1, 'crop.jMin'),
    jMax: int(raw.jMax, 0, dims.ny - 1, 'crop.jMax'),
    kMin: int(raw.kMin, 0, dims.nz - 1, 'crop.kMin'),
    kMax: int(raw.kMax, 0, dims.nz - 1, 'crop.kMax'),
    padding: int(raw.padding, 0, Number.MAX_SAFE_INTEGER, 'crop.padding'),
  }
  if (crop.iMax < crop.iMin || crop.jMax < crop.jMin || crop.kMax < crop.kMin) {
    fail('crop bounds are inverted')
  }
  return crop
}

function decodeHeader(value: unknown): GrowthHeader {
  const raw = record(value, 'header')
  if (raw.format !== GROWTH_FORMAT) fail(`format must be ${GROWTH_FORMAT}`)

  const config = record(raw.config, 'config')
  const rawDims = record(config.dims, 'config.dims')
  const dims: GrowthDims = {
    nx: int(rawDims.nx, 1, 0xffff_ffff, 'config.dims.nx'),
    ny: int(rawDims.ny, 1, 0xffff_ffff, 'config.dims.ny'),
    nz: int(rawDims.nz, 1, 0xffff_ffff, 'config.dims.nz'),
  }
  if (!Number.isSafeInteger(dims.nx * dims.ny * dims.nz)) fail('lattice cell count is unsafe')

  const source = record(raw.source, 'source')
  const rawCenter = config.center
  if (!Array.isArray(rawCenter) || rawCenter.length !== 3) fail('config.center must have three values')

  return {
    format: GROWTH_FORMAT,
    eventCount: int(raw.eventCount, 0, MAX_EVENTS, 'eventCount'),
    attachedCount: int(raw.attachedCount, 0, MAX_EVENTS, 'attachedCount'),
    seedCount: int(raw.seedCount, 0, MAX_EVENTS, 'seedCount'),
    finalTick: int(raw.finalTick, 0, NEVER_TICK - 1, 'finalTick'),
    terminationReason: str(raw.terminationReason, 'terminationReason'),
    crop: decodeCrop(raw.crop, dims),
    config: {
      preset: str(config.preset, 'config.preset'),
      dims,
      center: [
        int(rawCenter[0], 0, dims.nx - 1, 'config.center[0]'),
        int(rawCenter[1], 0, dims.ny - 1, 'config.center[1]'),
        int(rawCenter[2], 0, dims.nz - 1, 'config.center[2]'),
      ],
      domain: str(config.domain, 'config.domain'),
      tickCap: int(config.tickCap, 0, NEVER_TICK - 1, 'config.tickCap'),
      rngSeed: int(config.rngSeed, 0, Number.MAX_SAFE_INTEGER, 'config.rngSeed'),
      noiseEpsilon: num(config.noiseEpsilon, 'config.noiseEpsilon'),
      seedRadius: int(config.seedRadius, 0, Number.MAX_SAFE_INTEGER, 'config.seedRadius'),
      seedThickness: int(config.seedThickness, 0, Number.MAX_SAFE_INTEGER, 'config.seedThickness'),
    },
    source: { ...source, label: str(source.label, 'source.label') },
  }
}

/** Header length prefix, UTF-8 JSON header, then `eventCount` × (u32 index, u32 tick). */
export function decodeGrowthAsset(input: ArrayBuffer): DecodedGrowth {
  const bytes = new Uint8Array(input)
  if (bytes.byteLength < 4) fail('file is shorter than its length prefix')

  const view = new DataView(input)
  const headerBytes = view.getUint32(0, true)
  if (headerBytes === 0 || headerBytes > MAX_HEADER_BYTES) fail('header length is out of range')
  if (bytes.byteLength < 4 + headerBytes) fail('file is shorter than its declared header')

  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes.subarray(4, 4 + headerBytes)))
  } catch {
    fail('header is not valid JSON')
  }
  const header = decodeHeader(parsed)

  const payload = bytes.byteLength - 4 - headerBytes
  if (payload !== header.eventCount * EVENT_BYTES) {
    fail(`payload is ${payload} bytes, expected ${header.eventCount * EVENT_BYTES}`)
  }
  if (header.eventCount !== header.attachedCount) {
    fail('eventCount and attachedCount disagree')
  }

  // The columns are interleaved in the file. Split them so the volume build is
  // two linear reads rather than a strided one.
  const flatIndices = new Uint32Array(header.eventCount)
  const attachTicks = new Uint32Array(header.eventCount)
  let offset = 4 + headerBytes
  for (let event = 0; event < header.eventCount; event++) {
    flatIndices[event] = view.getUint32(offset, true)
    attachTicks[event] = view.getUint32(offset + 4, true)
    offset += EVENT_BYTES
  }

  return { header, flatIndices, attachTicks }
}

export function cropSize(crop: GrowthCrop): Vec3 {
  return [crop.iMax - crop.iMin + 1, crop.jMax - crop.jMin + 1, crop.kMax - crop.kMin + 1]
}

/**
 * Scatter the sparse events into a dense arrival-tick box.
 *
 * `decimation` collapses `d × d` lattice columns into one cell by keeping the
 * *earliest* arrival in the block. Keeping the earliest rather than averaging is
 * what makes a decimated volume still grow in the right order — a mean would
 * invent a tick no site ever attached on, and the reveal would ripple wrongly.
 */
export function buildGrowthVolume(asset: DecodedGrowth, decimation = 1): GrowthVolume {
  if (!Number.isSafeInteger(decimation) || decimation < 1) fail('decimation must be a positive integer')

  const { crop, config } = asset.header
  const [fullI, fullJ, fullK] = cropSize(crop)
  const size: Vec3 = [Math.ceil(fullI / decimation), Math.ceil(fullJ / decimation), fullK]
  const cells = size[0] * size[1] * size[2]
  if (!Number.isSafeInteger(cells) || cells > MAX_VOLUME_CELLS) fail('volume cell count is too large')

  const data = new Uint32Array(cells)
  data.fill(NEVER_TICK)

  const plane = config.dims.nx * config.dims.ny
  const strideJ = size[0]
  const strideK = size[0] * size[1]

  for (let event = 0; event < asset.flatIndices.length; event++) {
    const flat = asset.flatIndices[event]
    const k = (flat / plane) | 0
    const withinPlane = flat - k * plane
    const j = (withinPlane / config.dims.nx) | 0
    const i = withinPlane - j * config.dims.nx

    if (i < crop.iMin || i > crop.iMax) fail(`event ${event} lies outside the crop on i`)
    if (j < crop.jMin || j > crop.jMax) fail(`event ${event} lies outside the crop on j`)
    if (k < crop.kMin || k > crop.kMax) fail(`event ${event} lies outside the crop on k`)

    const ci = ((i - crop.iMin) / decimation) | 0
    const cj = ((j - crop.jMin) / decimation) | 0
    const offset = (k - crop.kMin) * strideK + cj * strideJ + ci

    const tick = asset.attachTicks[event]
    if (tick < data[offset]) data[offset] = tick
  }

  return { data, size, finalTick: asset.header.finalTick, decimation }
}

/**
 * Triangular lattice → cartesian. `i` runs along +x, `j` along the 60° axis, `k`
 * is the crystal's c-axis. This is why the shader interpolates over triangles
 * rather than squares: the sample grid is sheared, not rectangular.
 */
export function latticeToWorld(point: Vec3): Vec3 {
  return [point[0] + point[1] / 2, (Math.sqrt(3) * point[1]) / 2, point[2]]
}

/**
 * How big the crystal is at every captured frame, measured rather than modelled.
 *
 * The authored tour was cut for a video that framed the *finished* crystal at a
 * fixed extent, so its first two seconds are a nineteen-cell seed alone in an
 * empty frame. Reading the real in-plane radius out of the attachment history
 * lets the camera hold the crystal at a constant size while it grows, which is
 * the shot the piece actually wants — a macro that pulls back — without touching
 * a single attachment event.
 *
 * Returned in world units, one entry per `ticksPerFrame`, and monotonic: a site
 * never un-freezes, so the radius can only ever climb.
 */
export function buildRadiusTrack(asset: DecodedGrowth, ticksPerFrame: number): Float32Array {
  if (!Number.isSafeInteger(ticksPerFrame) || ticksPerFrame < 1) {
    fail('ticksPerFrame must be a positive integer')
  }

  const { crop, config, finalTick } = asset.header
  const frames = Math.floor(finalTick / ticksPerFrame) + 1
  const track = new Float32Array(frames)

  // The crop is centred on the seed, so the crop centre is the crystal's centre.
  const ci = (crop.iMin + crop.iMax) / 2
  const cj = (crop.jMin + crop.jMax) / 2
  const plane = config.dims.nx * config.dims.ny

  for (let event = 0; event < asset.flatIndices.length; event++) {
    const flat = asset.flatIndices[event]
    const k = (flat / plane) | 0
    const withinPlane = flat - k * plane
    const j = (withinPlane / config.dims.nx) | 0
    const i = withinPlane - j * config.dims.nx

    const dj = j - cj
    const x = i - ci + dj / 2
    const y = (Math.sqrt(3) * dj) / 2
    const radius = Math.hypot(x, y)

    const frame = Math.min(Math.floor(asset.attachTicks[event] / ticksPerFrame), frames - 1)
    if (radius > track[frame]) track[frame] = radius
  }

  // A wide branch can be laid down at a tick when nothing further out froze, so
  // the per-frame maxima are not themselves monotonic. Running the maximum
  // forward is what makes this a size *envelope* rather than a noisy signal the
  // camera would breathe against.
  for (let frame = 1; frame < frames; frame++) {
    if (track[frame] < track[frame - 1]) track[frame] = track[frame - 1]
  }

  return track
}

/** Sample the radius envelope at a fractional frame. */
export function radiusAt(track: Float32Array, frameCoordinate: number): number {
  if (track.length === 0) return 0
  const clamped = Math.min(Math.max(frameCoordinate, 0), track.length - 1)
  const low = Math.floor(clamped)
  const high = Math.min(low + 1, track.length - 1)
  return track[low] + (track[high] - track[low]) * (clamped - low)
}
