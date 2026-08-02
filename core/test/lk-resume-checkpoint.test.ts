import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import {
  CHECKPOINT_MAGIC,
  decodeCheckpoint,
  decodeLKCheckpoint,
  decodeLKResumeCheckpointV3,
  encodeCheckpoint,
  encodeLKCheckpoint,
  encodeLKResumeCheckpointV3,
  hexDistance,
  LK_RESUME_STREAM_CHUNK_BYTES,
  LK_RESUME_TEST_BUFFER_CAP_BYTES,
  MAX_LK_RESUME_HEADER_BYTES,
  takeDecodedLKResumeCheckpointV3,
  type Dims,
  type GGParams,
  type LKResumeByteSink,
  type LKResumeByteSource,
  type LKResumeStateV3,
  type LKRunState,
  type SolverState,
} from "@vcc/core";

// Frozen before the v3 implementation tests below. These three independently reproduced
// legacy artifacts pin both bytes and hashes; v3 must remain strictly additive.
const GG_V1_BASE64 =
  "VkNDQ0tQVDHKAQAAeyJ2ZXJzaW9uIjoxLCJlbmRpYW5uZXNzIjoiTEUiLCJkaW1zIjp7Im54IjoxLCJueSI6MSwibnoiOjF9LCJ0aWNrIjowLCJybmdTZWVkIjowLCJub2lzZUVwc2lsb24iOjAsImZhckZpZWxkIjoicmVmbGVjdGluZyIsImRvbWFpbiI6ImJveCIsImNlbnRlciI6WzAsMCwwXSwicGFyYW1zIjp7InJobyI6MC4xLCJwaGkiOjAsImthcHBhIjpbbnVsbCwwLjEsMC4xLDAuMSwwLjEsMC4xLDAuMSwwLjFdLCJtdSI6W251bGwsMC4wMDEsMC4wMDEsMC4wMDEsMC4wMDEsMC4wMDEsMC4wMDEsMC4wMDFdLCJnZ1RocmVzaEJldGEiOltudWxsLDIuNSwyLDIsMiwxLDEsMV19LCJtZXRyaWNzIjpudWxsLCJmaWVsZHMiOlt7Im5hbWUiOiJhIiwiZHR5cGUiOiJ1OCIsImxlbmd0aCI6MX0seyJuYW1lIjoiYiIsImR0eXBlIjoiZjY0IiwibGVuZ3RoIjoxfSx7Im5hbWUiOiJkIiwiZHR5cGUiOiJmNjQiLCJsZW5ndGgiOjF9XX0BAAAAAAAA8D8AAAAAAAAAAA==";
const GG_V1_SHA256 = "51a33c19dad6fda68a6a0a86ed5d80604fd229bbf7e21b65d8686480b4e5a32c";
const LK_V1_BASE64 =
  "VkNDQ0tQVDHmAQAAeyJ2ZXJzaW9uIjoxLCJydWxlIjoiTGliYnJlY2h0S2luZXRpY3MiLCJlbmRpYW5uZXNzIjoiTEUiLCJkaW1zIjp7Im54IjoxLCJueSI6MSwibnoiOjF9LCJ0aWNrIjowLCJzaW1UaW1lU2Vjb25kcyI6MCwicm5nU2VlZCI6MCwibm9pc2VFcHNpbG9uIjowLCJkb21haW4iOiJib3giLCJjZW50ZXIiOlswLDAsMF0sInRlbXBDIjotMTUsInNpZ21hSW5maW5pdHkiOjAuMDAyLCJkeFVtIjowLjM1LCJwcmVzc3VyZVBhIjoxMDEzMjUsInBhcmFtU2V0IjoiQ0FLIiwiY2ZsRmlsbCI6MC4xLCJyZWxheFRvbCI6MWUtOSwiZGl2VG9sIjoxZS03LCJyZWxheE1heFN3ZWVwcyI6MjAwMDAwLCJmYXJGaWVsZCI6Im1vbm9wb2xlLW1hdGNoZWQiLCJmaWVsZHMiOlt7Im5hbWUiOiJhIiwiZHR5cGUiOiJ1OCIsImxlbmd0aCI6MX0seyJuYW1lIjoiZiIsImR0eXBlIjoiZjY0IiwibGVuZ3RoIjoxfSx7Im5hbWUiOiJzaWdtYSIsImR0eXBlIjoiZjY0IiwibGVuZ3RoIjoxfV19AAAAAAAAAAAA/Knx0k1iYD8=";
const LK_V1_SHA256 = "aa0993909b74a31d1ff6e99e87c4d082a46254d26ca1ba21b959792e773b33be";
const LK_V2_BASE64 =
  "VkNDQ0tQVDENAgAAeyJ2ZXJzaW9uIjoyLCJydWxlIjoiTGliYnJlY2h0S2luZXRpY3MiLCJzdXJmYWNlUG9saWN5IjoiYWdncmVnYXRlLWh2LWcxaDEtdjYiLCJlbmRpYW5uZXNzIjoiTEUiLCJkaW1zIjp7Im54IjoxLCJueSI6MSwibnoiOjF9LCJ0aWNrIjowLCJzaW1UaW1lU2Vjb25kcyI6MCwicm5nU2VlZCI6MCwibm9pc2VFcHNpbG9uIjowLCJkb21haW4iOiJib3giLCJjZW50ZXIiOlswLDAsMF0sInRlbXBDIjotMTUsInNpZ21hSW5maW5pdHkiOjAuMDAyLCJkeFVtIjowLjM1LCJwcmVzc3VyZVBhIjoxMDEzMjUsInBhcmFtU2V0IjoiQ0FLIiwiY2ZsRmlsbCI6MC4xLCJyZWxheFRvbCI6MWUtOSwiZGl2VG9sIjoxZS03LCJyZWxheE1heFN3ZWVwcyI6MjAwMDAwLCJmYXJGaWVsZCI6Im1vbm9wb2xlLW1hdGNoZWQiLCJmaWVsZHMiOlt7Im5hbWUiOiJhIiwiZHR5cGUiOiJ1OCIsImxlbmd0aCI6MX0seyJuYW1lIjoiZiIsImR0eXBlIjoiZjY0IiwibGVuZ3RoIjoxfSx7Im5hbWUiOiJzaWdtYSIsImR0eXBlIjoiZjY0IiwibGVuZ3RoIjoxfV19AAAAAAAAAAAA/Knx0k1iYD8=";
const LK_V2_SHA256 = "4e3df8019de5f272b5dcb53cb71059ff097f8507b138ffb5debbb7af8997b4bb";

function bytesFromBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64"));
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function legacyGGState(): SolverState {
  const vector = (values: readonly number[]): Float64Array =>
    Float64Array.from([Number.NaN, ...values]);
  const params: GGParams = {
    rho: 0.1,
    phi: 0,
    kappa: vector([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]),
    mu: vector([0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001]),
    ggThreshBeta: vector([2.5, 2, 2, 2, 1, 1, 1]),
  };
  return {
    dims: { nx: 1, ny: 1, nz: 1 },
    tick: 0,
    rngSeed: 0,
    noiseEpsilon: 0,
    farField: "reflecting",
    domain: "box",
    params,
    a: Uint8Array.of(1),
    b: Float64Array.of(1),
    d: Float64Array.of(0),
    center: [0, 0, 0],
  };
}

function legacyLKState(): LKRunState {
  return {
    dims: { nx: 1, ny: 1, nz: 1 },
    tick: 0,
    simTimeSeconds: 0,
    rngSeed: 0,
    noiseEpsilon: 0,
    domain: "box",
    center: [0, 0, 0],
    tempC: -15,
    sigmaInfinity: 0.002,
    dxUm: 0.35,
    pressurePa: 101325,
    paramSet: "CAK",
    cflFill: 0.1,
    relaxTol: 1e-9,
    divTol: 1e-7,
    relaxMaxSweeps: 200_000,
    surfacePolicy: "aggregate-hv-g1h1-v6",
    farField: "monopole-matched",
    a: Uint8Array.of(0),
    f: Float64Array.of(0),
    sigma: Float64Array.of(0.002),
  };
}

describe("frozen checkpoint-family fixtures", () => {
  it("keeps the literal GG v1 bytes and hash frozen", () => {
    const fixture = bytesFromBase64(GG_V1_BASE64);
    expect(fixture).toHaveLength(487);
    expect(sha256(fixture)).toBe(GG_V1_SHA256);
    expect(encodeCheckpoint(legacyGGState(), null)).toEqual(fixture);
    expect(decodeCheckpoint(fixture).header.version).toBe(1);
  });

  it("keeps the literal LK v1 bytes/hash readable only as legacy-v3", () => {
    const fixture = bytesFromBase64(LK_V1_BASE64);
    expect(fixture).toHaveLength(515);
    expect(sha256(fixture)).toBe(LK_V1_SHA256);
    const decoded = decodeLKCheckpoint(fixture);
    expect(decoded.header.version).toBe(1);
    expect(decoded.state.surfacePolicy).toBe("legacy-v3");
  });

  it("keeps the literal LK v2 bytes and hash frozen", () => {
    const fixture = bytesFromBase64(LK_V2_BASE64);
    expect(fixture).toHaveLength(554);
    expect(sha256(fixture)).toBe(LK_V2_SHA256);
    expect(encodeLKCheckpoint(legacyLKState())).toEqual(fixture);
    expect(decodeLKCheckpoint(fixture).header.version).toBe(2);
  });
});

class TestSink implements LKResumeByteSink {
  readonly chunks: Uint8Array[] = [];
  calls = 0;
  total = 0;
  beforeWrite: (() => void) | null = null;

  async write(chunk: Uint8Array): Promise<void> {
    this.calls++;
    this.beforeWrite?.();
    expect(chunk.byteLength).toBeGreaterThan(0);
    expect(chunk.byteLength).toBeLessThanOrEqual(LK_RESUME_STREAM_CHUNK_BYTES);
    this.total += chunk.byteLength;
    if (this.total > LK_RESUME_TEST_BUFFER_CAP_BYTES) {
      throw new Error("test sink cap exceeded before concatenation");
    }
    this.chunks.push(chunk.slice());
  }

  bytes(): Uint8Array {
    if (this.total > LK_RESUME_TEST_BUFFER_CAP_BYTES) {
      throw new Error("test sink cap exceeded before concatenation");
    }
    const result = new Uint8Array(this.total);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
}

class TestSource implements LKResumeByteSource {
  readonly byteLength: number;
  readonly reads: Array<readonly [number, number]> = [];
  private readonly bytes: Uint8Array;
  private readonly oneByteInternalCopies: boolean;

  constructor(bytes: Uint8Array, oneByteInternalCopies = false) {
    if (bytes.length > LK_RESUME_TEST_BUFFER_CAP_BYTES) {
      throw new Error("test source cap exceeded before use");
    }
    this.bytes = bytes;
    this.byteLength = bytes.length;
    this.oneByteInternalCopies = oneByteInternalCopies;
  }

  async readExactly(offset: number, target: Uint8Array): Promise<void> {
    this.reads.push([offset, target.length]);
    expect(target.length).toBeLessThanOrEqual(LK_RESUME_STREAM_CHUNK_BYTES);
    if (offset < 0 || offset + target.length > this.bytes.length) {
      throw new Error("test source read crosses EOF");
    }
    if (this.oneByteInternalCopies) {
      for (let index = 0; index < target.length; index++) target[index] = this.bytes[offset + index];
    } else {
      target.set(this.bytes.subarray(offset, offset + target.length));
    }
  }
}

function indexOf(dims: Dims, i: number, j: number, k: number): number {
  return k * dims.nx * dims.ny + j * dims.nx + i;
}

function resumeState(tick = 0): LKResumeStateV3 {
  const dims: Dims = { nx: 7, ny: 7, nz: 5 };
  const center: readonly [number, number, number] = [3, 3, 2];
  const n = dims.nx * dims.ny * dims.nz;
  const a = new Uint8Array(n);
  const f = new Float64Array(n);
  const sigma = new Float64Array(n);
  const radius = 3;
  const halfZ = 2;
  const sigmaInfinity = 0.002;
  for (let k = 0; k < dims.nz; k++) {
    for (let j = 0; j < dims.ny; j++) {
      for (let i = 0; i < dims.nx; i++) {
        if (hexDistance(i - center[0], j - center[1]) <= radius && Math.abs(k - center[2]) <= halfZ) {
          sigma[indexOf(dims, i, j, k)] = sigmaInfinity;
        }
      }
    }
  }
  const seed = indexOf(dims, center[0], center[1], center[2]);
  a[seed] = 1;
  f[seed] = 1;
  sigma[seed] = 0;
  const boundaryOrder = [
    indexOf(dims, 3, 3, 1),
    indexOf(dims, 3, 3, 3),
    indexOf(dims, 2, 4, 2),
    indexOf(dims, 4, 2, 2),
    indexOf(dims, 3, 4, 2),
    indexOf(dims, 3, 2, 2),
    indexOf(dims, 2, 3, 2),
    indexOf(dims, 4, 3, 2),
  ];
  // Deliberately not lattice scan order: exact historical order must survive.
  const unusualDxUm = 19 / 9973;
  let epoch = 0;
  return {
    numericEngine: "float64-cpu",
    resumePhase: "cycle-boundary",
    cycleState: "boundary",
    timelineMode: "none",
    dims,
    tick,
    rngSeed: 0xdead_beef,
    noiseEpsilon: 1e-5,
    domain: "hexPrism",
    center,
    tempC: -15,
    sigmaInfinity,
    dxUm: unusualDxUm,
    pressurePa: 101325,
    paramSet: "CAK",
    cflFill: 0.1,
    relaxTol: 1e-9,
    divTol: 1e-7,
    relaxMaxSweeps: 200_000,
    surfacePolicy: "aggregate-hv-g1h1-v6",
    farField: "monopole-matched",
    activeCellCount: 185,
    shellCellCount: 128,
    hexRadius: radius,
    zHalfExtent: halfZ,
    attachedCount: 1,
    holeFillCountTotal: 0,
    a,
    f,
    sigma,
    boundaryOrder,
    lastAttached: tick === 0 ? [] : [seed],
    simTimeSeconds: tick === 0 ? 0 : 0.125,
    volumeRateM3PerS: tick === 0 ? 0 : 1e-18,
    lastMaxFillVelocityMS: tick === 0 ? 0 : 1e-8,
    fillLedger: tick === 0 ? 0 : 0.25,
    holeFillDeficit: 0,
    saturationClippedFill: tick === 0 ? 0 : 0.01,
    lastRelaxation:
      tick === 0
        ? null
        : {
            sweeps: 17,
            converged: true,
            residual: 0,
            divergenceResidual: 0,
            shellClampDiagnostic: 2,
            surfaceExchangeDiagnostic: 2,
            smootherDriftDiagnostic: 0,
            minLocalSurfaceExchangeDiagnostic: -0.125,
          },
    acceptedEnvironmentEventCount: 0,
    closedPlacedFillVaporUnits: 0,
    currentTemperatureSegmentStartFill: 0,
    testHookEverUsed: false,
    mutationEpoch(): number {
      return epoch;
    },
  };
}

async function encodeToBytes(state: LKResumeStateV3): Promise<{
  readonly bytes: Uint8Array;
  readonly sink: TestSink;
}> {
  const sink = new TestSink();
  const summary = await encodeLKResumeCheckpointV3(state, sink);
  const bytes = sink.bytes();
  expect(summary.byteLength).toBe(bytes.length);
  expect(summary.payloadLength + summary.headerLength + 12).toBe(bytes.length);
  return { bytes, sink };
}

function headerOf(bytes: Uint8Array): Record<string, unknown> {
  const length = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(8, true);
  return JSON.parse(new TextDecoder().decode(bytes.subarray(12, 12 + length))) as Record<
    string,
    unknown
  >;
}

function replaceHeader(bytes: Uint8Array, header: Record<string, unknown>): Uint8Array {
  const oldLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(8, true);
  const encoded = new TextEncoder().encode(JSON.stringify(header));
  const result = new Uint8Array(12 + encoded.length + bytes.length - 12 - oldLength);
  result.set(bytes.subarray(0, 8), 0);
  new DataView(result.buffer).setUint32(8, encoded.length, true);
  result.set(encoded, 12);
  result.set(bytes.subarray(12 + oldLength), 12 + encoded.length);
  return result;
}

function mutateHeader(
  bytes: Uint8Array,
  mutate: (header: Record<string, unknown>) => void,
): Uint8Array {
  const header = headerOf(bytes);
  mutate(header);
  return replaceHeader(bytes, header);
}

function replaceHeaderText(bytes: Uint8Array, text: string): Uint8Array {
  const oldLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(8, true);
  const encoded = new TextEncoder().encode(text);
  const result = new Uint8Array(12 + encoded.length + bytes.length - 12 - oldLength);
  result.set(bytes.subarray(0, 8), 0);
  new DataView(result.buffer).setUint32(8, encoded.length, true);
  result.set(encoded, 12);
  result.set(bytes.subarray(12 + oldLength), 12 + encoded.length);
  return result;
}

function headerTextOf(bytes: Uint8Array): string {
  const length = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(8, true);
  return new TextDecoder().decode(bytes.subarray(12, 12 + length));
}

function payloadOffsets(bytes: Uint8Array): {
  readonly n: number;
  readonly a: number;
  readonly f: number;
  readonly sigma: number;
  readonly boundary: number;
  readonly last: number;
  readonly scalars: number;
} {
  const header = headerOf(bytes);
  const dims = header.dims as { nx: number; ny: number; nz: number };
  const topology = header.topology as { boundaryCount: number; lastAttachedCount: number };
  const headerLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(8, true);
  const n = dims.nx * dims.ny * dims.nz;
  const a = 12 + headerLength;
  const f = a + n;
  const sigma = f + 8 * n;
  const boundary = sigma + 8 * n;
  const last = boundary + 4 * topology.boundaryCount;
  const scalars = last + 4 * topology.lastAttachedCount;
  return { n, a, f, sigma, boundary, last, scalars };
}

function neighborIndices(dims: Dims, index: number): number[] {
  const plane = dims.nx * dims.ny;
  const k = Math.floor(index / plane);
  const inPlane = index - k * plane;
  const j = Math.floor(inPlane / dims.nx);
  const i = inPlane - j * dims.nx;
  const result: number[] = [];
  if (i + 1 < dims.nx) result.push(index + 1);
  if (i - 1 >= 0) result.push(index - 1);
  if (j + 1 < dims.ny) result.push(index + dims.nx);
  if (j - 1 >= 0) result.push(index - dims.nx);
  if (i + 1 < dims.nx && j - 1 >= 0) result.push(index + 1 - dims.nx);
  if (i - 1 >= 0 && j + 1 < dims.ny) result.push(index - 1 + dims.nx);
  if (k + 1 < dims.nz) result.push(index + plane);
  if (k - 1 >= 0) result.push(index - plane);
  return result;
}

function recomputeBoundaryOrder(state: LKResumeStateV3): number[] {
  const result: number[] = [];
  const [ic, jc, kc] = state.center;
  const plane = state.dims.nx * state.dims.ny;
  for (let index = 0; index < state.a.length; index++) {
    const k = Math.floor(index / plane);
    const inPlane = index - k * plane;
    const j = Math.floor(inPlane / state.dims.nx);
    const i = inPlane - j * state.dims.nx;
    const active =
      hexDistance(i - ic, j - jc) <= state.hexRadius && Math.abs(k - kc) <= state.zHalfExtent;
    if (
      active &&
      state.a[index] === 0 &&
      neighborIndices(state.dims, index).some((neighbor) => state.a[neighbor] === 1)
    ) {
      result.push(index);
    }
  }
  return result;
}

function twoAttachmentState(): LKResumeStateV3 {
  const state = resumeState(1);
  const first = state.a.indexOf(1);
  const second = state.boundaryOrder[0];
  state.a[second] = 1;
  state.f[second] = 1;
  state.sigma[second] = 0;
  const recomputed = recomputeBoundaryOrder(state);
  recomputed.reverse();
  return {
    ...state,
    attachedCount: 2,
    boundaryOrder: recomputed,
    lastAttached: [second, first],
  };
}

function largeChunkBoundaryState(): LKResumeStateV3 {
  const side = 103;
  const dims: Dims = { nx: side, ny: side, nz: side };
  const center: readonly [number, number, number] = [51, 51, 51];
  const radius = 51;
  const halfZ = 51;
  const n = side ** 3;
  const a = new Uint8Array(n);
  const f = new Float64Array(n);
  const sigma = new Float64Array(n);
  for (let k = 0; k < side; k++) {
    for (let j = 0; j < side; j++) {
      for (let i = 0; i < side; i++) {
        if (hexDistance(i - 51, j - 51) <= radius) {
          sigma[indexOf(dims, i, j, k)] = 0.002;
        }
      }
    }
  }
  const seed = indexOf(dims, 51, 51, 51);
  a[seed] = 1;
  f[seed] = 1;
  sigma[seed] = 0;
  const boundaryOrder = neighborIndices(dims, seed).reverse();
  const hexPlane = 3 * radius * (radius + 1) + 1;
  const activeCellCount = hexPlane * (2 * halfZ + 1);
  const interior = (3 * (radius - 1) * radius + 1) * (2 * halfZ - 1);
  return {
    ...resumeState(),
    dims,
    center,
    a,
    f,
    sigma,
    boundaryOrder,
    activeCellCount,
    shellCellCount: activeCellCount - interior,
    hexRadius: radius,
    zHalfExtent: halfZ,
    attachedCount: 1,
  };
}

class SegmentedSink implements LKResumeByteSink {
  readonly chunks: Uint8Array[] = [];
  byteLength = 0;

  async write(chunk: Uint8Array): Promise<void> {
    this.chunks.push(chunk.slice());
    this.byteLength += chunk.length;
  }
}

class SegmentedSource implements LKResumeByteSource {
  readonly byteLength: number;
  readonly reads: Array<readonly [number, number]> = [];
  private readonly chunks: readonly Uint8Array[];

  constructor(chunks: readonly Uint8Array[]) {
    this.chunks = chunks;
    this.byteLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  }

  async readExactly(offset: number, target: Uint8Array): Promise<void> {
    this.reads.push([offset, target.length]);
    let targetOffset = 0;
    let streamOffset = 0;
    for (const chunk of this.chunks) {
      const chunkEnd = streamOffset + chunk.length;
      if (offset + targetOffset < chunkEnd && targetOffset < target.length) {
        const inChunk = Math.max(0, offset + targetOffset - streamOffset);
        const count = Math.min(chunk.length - inChunk, target.length - targetOffset);
        target.set(chunk.subarray(inChunk, inChunk + count), targetOffset);
        targetOffset += count;
      }
      streamOffset = chunkEnd;
      if (targetOffset === target.length) return;
    }
    throw new Error("segmented source could not satisfy exact read");
  }
}

describe("streamed LK resume checkpoint v3", () => {
  it("round-trips exact controls, fields, alternative boundary order, and owned topology", async () => {
    const state = resumeState(1);
    expect((state.dxUm * 1e-6) / 1e-6).not.toBe(state.dxUm);
    state.f[state.boundaryOrder[0]] = 1; // reachable unattached boundary endpoint
    const { bytes, sink } = await encodeToBytes(state);
    expect(new TextDecoder().decode(bytes.subarray(0, 8))).toBe(CHECKPOINT_MAGIC);
    expect(sink.chunks[0]).toHaveLength(12);
    const source = new TestSource(bytes, true);
    const envelope = await decodeLKResumeCheckpointV3(source);
    const adopted = takeDecodedLKResumeCheckpointV3(envelope);
    expect(adopted.dxUm).toBe(state.dxUm);
    expect(adopted.boundaryOrder).toEqual(state.boundaryOrder);
    expect(adopted.lastAttached).toEqual(state.lastAttached);
    expect(adopted.a).toEqual(state.a);
    expect(adopted.f).toEqual(state.f);
    expect(adopted.sigma).toEqual(state.sigma);
    expect(adopted.lastRelaxation).toEqual(state.lastRelaxation);
    expect(adopted.topology.activeCellCount).toBe(185);
    expect(adopted.topology.shellCellCount).toBe(128);
    expect(adopted.topology.inBoundary.reduce((sum, value) => sum + value, 0)).toBe(8);
    expect(adopted.topology.blocked.reduce((sum, value) => sum + value, 0)).toBe(61);
    expect(adopted.topology.dirichletCells).toHaveLength(128);
    expect(adopted.topology.shellRadiusM.every((value) => value > 0)).toBe(true);
    expect(source.reads.every(([, length]) => length <= LK_RESUME_STREAM_CHUNK_BYTES)).toBe(true);
    const header = headerOf(bytes);
    for (const key of [
      "noiseEpsilon",
      "tempC",
      "sigmaInfinity",
      "dxUm",
      "pressurePa",
      "cflFill",
      "relaxTol",
      "divTol",
    ]) {
      expect(header[key]).toMatch(/^[0-9a-f]{16}$/);
    }
  });

  it("uses an opaque WeakMap-backed envelope that can be taken exactly once", async () => {
    const { bytes } = await encodeToBytes(resumeState());
    const envelope = await decodeLKResumeCheckpointV3(new TestSource(bytes));
    expect(() => takeDecodedLKResumeCheckpointV3({ ...envelope })).toThrow(/not decoder-branded/);
    expect(() =>
      takeDecodedLKResumeCheckpointV3({
        version: 3,
        checkpointKind: "lk-resume",
        tick: 0,
        byteLength: bytes.length,
      }),
    ).toThrow(/not decoder-branded/);
    takeDecodedLKResumeCheckpointV3(envelope);
    expect(() => takeDecodedLKResumeCheckpointV3(envelope)).toThrow(/already consumed/);
  });

  it("keeps resume and legacy reader families separate", async () => {
    for (const base64 of [GG_V1_BASE64, LK_V1_BASE64, LK_V2_BASE64]) {
      await expect(decodeLKResumeCheckpointV3(new TestSource(bytesFromBase64(base64)))).rejects.toThrow(
        /rejects legacy.*version/i,
      );
    }
    const { bytes } = await encodeToBytes(resumeState());
    expect(() => decodeLKCheckpoint(bytes)).toThrow(/version 3/);
    expect(() => decodeCheckpoint(bytes)).toThrow(/version 3/);
  });

  it("accepts every exact v3 wire parameter spelling but no shared-enum widening", async () => {
    for (const paramSet of ["CAK", "M1", "M1_NO_DIP_ABLATION"] as const) {
      const { bytes } = await encodeToBytes({ ...resumeState(), paramSet });
      const adopted = takeDecodedLKResumeCheckpointV3(
        await decodeLKResumeCheckpointV3(new TestSource(bytes)),
      );
      expect(adopted.paramSet).toBe(paramSet);
    }
    for (const paramSet of ["CAK_A1", "FUTURE_SHARED_VALUE", "fabricated"]) {
      await expect(
        encodeLKResumeCheckpointV3(
          { ...resumeState(), paramSet } as unknown as LKResumeStateV3,
          new TestSink(),
        ),
      ).rejects.toThrow(/exact v3 allow-list/);
    }
  });

  it("rejects stale snapshots before the first sink call and mutations across awaited writes", async () => {
    let liveEpoch = 1;
    const stale = {
      ...resumeState(),
      mutationEpoch(): number {
        if (liveEpoch !== 0) throw new Error("stale resume snapshot");
        return 0;
      },
    };
    const untouchedSink = new TestSink();
    await expect(encodeLKResumeCheckpointV3(stale, untouchedSink)).rejects.toThrow(/stale/);
    expect(untouchedSink.calls).toBe(0);

    liveEpoch = 0;
    const inFlight = {
      ...resumeState(),
      mutationEpoch(): number {
        return liveEpoch;
      },
    };
    const mutatingSink = new TestSink();
    mutatingSink.beforeWrite = () => {
      liveEpoch++;
      mutatingSink.beforeWrite = null;
    };
    await expect(encodeLKResumeCheckpointV3(inFlight, mutatingSink)).rejects.toThrow(
      /mutated across.*sink write/,
    );
    expect(mutatingSink.calls).toBe(1);
  });

  it("refuses non-boundary, timeline, hook, and lane-ineligible exports", async () => {
    const cases: Array<readonly [Partial<LKResumeStateV3>, RegExp]> = [
      [{ numericEngine: "gpu-f32" as never }, /numericEngine/],
      [{ resumePhase: "relaxing" as never }, /resumePhase/],
      [{ cycleState: "ready" as never }, /cycleState/],
      [{ timelineMode: "schedule" as never }, /timelineMode/],
      [{ domain: "box" as never }, /domain/],
      [{ surfacePolicy: "aggregate-hv-g1h1-v5" as never }, /surfacePolicy/],
      [{ farField: "dirichlet" as never }, /farField/],
      [{ acceptedEnvironmentEventCount: 1 }, /acceptedEnvironmentEventCount/],
      [{ acceptedEnvironmentEventCount: -0 }, /positive-zero/],
      [{ acceptedEnvironmentEventCount: 0.5 }, /positive-zero/],
      [{ closedPlacedFillVaporUnits: -0 }, /positive-zero/],
      [{ currentTemperatureSegmentStartFill: 1 }, /positive-zero/],
      [{ testHookEverUsed: true }, /testHookEverUsed/],
    ];
    for (const [mutation, pattern] of cases) {
      await expect(
        encodeLKResumeCheckpointV3(
          { ...resumeState(), ...mutation } as LKResumeStateV3,
          new TestSink(),
        ),
      ).rejects.toThrow(pattern);
    }
  });

  it("rejects field/topology impossibilities while preserving reachable boundary f=1", async () => {
    const reachable = resumeState();
    reachable.f[reachable.boundaryOrder[0]] = 1;
    await expect(encodeLKResumeCheckpointV3(reachable, new TestSink())).resolves.toMatchObject({
      version: 3,
    });

    const duplicateBase = resumeState();
    const duplicateOrder = [...duplicateBase.boundaryOrder];
    duplicateOrder[1] = duplicateOrder[0];
    const duplicateBoundary = { ...duplicateBase, boundaryOrder: duplicateOrder };
    await expect(encodeLKResumeCheckpointV3(duplicateBoundary, new TestSink())).rejects.toThrow(
      /duplicate/,
    );

    const partialInterior = resumeState();
    const interior = indexOf(partialInterior.dims, 3, 1, 2);
    partialInterior.f[interior] = 0.25;
    await expect(encodeLKResumeCheckpointV3(partialInterior, new TestSink())).rejects.toThrow(
      /non-boundary f/,
    );

    const signedZeroFill = resumeState();
    signedZeroFill.f[interior] = -0;
    await expect(encodeLKResumeCheckpointV3(signedZeroFill, new TestSink())).rejects.toThrow(
      /positive-zero/,
    );

    const wrongCount = { ...resumeState(), activeCellCount: 184 };
    await expect(encodeLKResumeCheckpointV3(wrongCount, new TestSink())).rejects.toThrow(
      /counts or hex extents/,
    );
  });

  it("witnesses every core field range and attached/wall canonical-zero rejection", async () => {
    const cases: Array<readonly [string, (state: LKResumeStateV3) => void, RegExp]> = [
      ["nonbinary a", (state) => (state.a[0] = 2), /must be binary/],
      ["nonfinite f", (state) => (state.f[state.boundaryOrder[0]] = Number.NaN), /f\[.*finite/],
      ["negative f", (state) => (state.f[state.boundaryOrder[0]] = -0.1), /f\[.*\[0, 1\]/],
      ["f above one", (state) => (state.f[state.boundaryOrder[0]] = 1.1), /f\[.*\[0, 1\]/],
      ["nonfinite sigma", (state) => (state.sigma[state.boundaryOrder[0]] = Infinity), /sigma\[.*finite/],
      ["sigma below -1", (state) => (state.sigma[state.boundaryOrder[0]] = -1.000_001), /sigma\[.*>= -1/],
      ["attached f", (state) => (state.f[state.a.indexOf(1)] = 0.5), /attached cell.*f=1/],
      ["attached negative zero sigma", (state) => (state.sigma[state.a.indexOf(1)] = -0), /positive-zero/],
      ["masked wall attached", (state) => (state.a[0] = 1), /masked wall cell/],
      ["wall negative zero f", (state) => (state.f[0] = -0), /positive-zero/],
      ["wall negative zero sigma", (state) => (state.sigma[0] = -0), /positive-zero/],
      ["wall nonzero sigma", (state) => (state.sigma[0] = 0.1), /masked wall sigma/],
    ];
    for (const [label, mutate, pattern] of cases) {
      const state = resumeState();
      mutate(state);
      await expect(encodeLKResumeCheckpointV3(state, new TestSink()), label).rejects.toThrow(
        pattern,
      );
    }
  });

  it("witnesses every stored topology count/extent and exact boundary-set relation", async () => {
    const topologyCases: Array<readonly [string, Partial<LKResumeStateV3>]> = [
      ["active count", { activeCellCount: 184 }],
      ["shell count", { shellCellCount: 127 }],
      ["hex radius", { hexRadius: 2 }],
      ["vertical half extent", { zHalfExtent: 1 }],
      ["attached count", { attachedCount: 2 }],
    ];
    for (const [label, mutation] of topologyCases) {
      await expect(
        encodeLKResumeCheckpointV3(
          { ...resumeState(), ...mutation } as LKResumeStateV3,
          new TestSink(),
        ),
        label,
      ).rejects.toThrow(/topology|counts|extents/);
    }

    const incomplete = resumeState();
    await expect(
      encodeLKResumeCheckpointV3(
        { ...incomplete, boundaryOrder: incomplete.boundaryOrder.slice(1) },
        new TestSink(),
      ),
    ).rejects.toThrow(/exact permutation/);

    const extra = resumeState();
    const nonBoundary = indexOf(extra.dims, 3, 1, 2);
    await expect(
      encodeLKResumeCheckpointV3(
        { ...extra, boundaryOrder: [...extra.boundaryOrder, nonBoundary] },
        new TestSink(),
      ),
    ).rejects.toThrow(/exact permutation/);

    await expect(
      encodeLKResumeCheckpointV3(
        { ...resumeState(), holeFillCountTotal: 2, holeFillDeficit: 0.5 },
        new TestSink(),
      ),
    ).rejects.toThrow(/cannot exceed attachedCount/);
  });

  it("preserves lastAttached order and rejects duplicate, nonattached, and out-of-range entries", async () => {
    const state = twoAttachmentState();
    const { bytes } = await encodeToBytes(state);
    const adopted = takeDecodedLKResumeCheckpointV3(
      await decodeLKResumeCheckpointV3(new TestSource(bytes)),
    );
    expect(adopted.lastAttached).toEqual(state.lastAttached);

    const first = state.lastAttached[0];
    const nonattached = state.boundaryOrder[0];
    for (const [label, lastAttached, pattern] of [
      ["duplicate", [first, first], /duplicate/],
      ["nonattached", [nonattached], /not attached/],
      ["out of range", [state.a.length], /in-range/],
    ] as const) {
      await expect(
        encodeLKResumeCheckpointV3({ ...state, lastAttached }, new TestSink()),
        label,
      ).rejects.toThrow(pattern);
    }
  });

  it("enforces tick/report, ledger, canonical-zero, and exact v6 identity invariants", async () => {
    for (const name of [
      "simTimeSeconds",
      "volumeRateM3PerS",
      "lastMaxFillVelocityMS",
      "fillLedger",
      "holeFillDeficit",
      "saturationClippedFill",
    ] as const) {
      await expect(
        encodeLKResumeCheckpointV3({ ...resumeState(), [name]: -0 }, new TestSink()),
        `negative-zero ${name}`,
      ).rejects.toThrow(/positive-zero/);
    }
    await expect(
      encodeLKResumeCheckpointV3(
        { ...resumeState(), holeFillCountTotal: 1, holeFillDeficit: 0 },
        new TestSink(),
      ),
    ).rejects.toThrow(/positive holeFillCountTotal/);
    await expect(
      encodeLKResumeCheckpointV3({ ...resumeState(), holeFillDeficit: 0.1 }, new TestSink()),
    ).rejects.toThrow(/positive holeFillDeficit/);
    await expect(
      encodeLKResumeCheckpointV3(
        { ...resumeState(), lastRelaxation: resumeState(1).lastRelaxation },
        new TestSink(),
      ),
    ).rejects.toThrow(/absent if and only if/);
    const coherent = resumeState(1);
    const incoherent = {
      ...coherent,
      lastRelaxation: {
        ...coherent.lastRelaxation!,
        divergenceResidual: 1e-12,
      },
    };
    await expect(encodeLKResumeCheckpointV3(incoherent, new TestSink())).rejects.toThrow(
      /exact v6 identity/,
    );
  });

  it("witnesses report presence, sweep, convergence, tolerance, and every signed-zero slot", async () => {
    await expect(
      encodeLKResumeCheckpointV3({ ...resumeState(1), lastRelaxation: null }, new TestSink()),
    ).rejects.toThrow(/absent if and only if/);
    const tickZeroWithAttachment = resumeState();
    await expect(
      encodeLKResumeCheckpointV3(
        { ...tickZeroWithAttachment, lastAttached: [tickZeroWithAttachment.a.indexOf(1)] },
        new TestSink(),
      ),
    ).rejects.toThrow(/tick-zero lastAttached/);

    const reportCases: Array<
      readonly [string, (state: LKResumeStateV3) => LKResumeStateV3, RegExp]
    > = [
      [
        "zero sweeps",
        (state) => ({ ...state, lastRelaxation: { ...state.lastRelaxation!, sweeps: 0 } }),
        /sweeps.*>= 1/,
      ],
      [
        "sweeps above cap",
        (state) => ({
          ...state,
          lastRelaxation: { ...state.lastRelaxation!, sweeps: state.relaxMaxSweeps + 1 },
        }),
        /exceeds relaxMaxSweeps/,
      ],
      [
        "false convergence",
        (state) => ({ ...state, lastRelaxation: { ...state.lastRelaxation!, converged: false } }),
        /converged.*dual criteria/,
      ],
      [
        "residual at tolerance",
        (state) => ({
          ...state,
          lastRelaxation: { ...state.lastRelaxation!, residual: state.relaxTol },
        }),
        /strictly below relaxTol/,
      ],
      [
        "negative residual",
        (state) => ({ ...state, lastRelaxation: { ...state.lastRelaxation!, residual: -1 } }),
        /residual.*nonnegative/,
      ],
      [
        "divergence at failing scale",
        (state) => ({
          ...state,
          lastRelaxation: {
            ...state.lastRelaxation!,
            shellClampDiagnostic: 3,
            divergenceResidual: 0.5,
          },
        }),
        /strictly below divTol/,
      ],
      [
        "nonfinite diagnostic",
        (state) => ({
          ...state,
          lastRelaxation: {
            ...state.lastRelaxation!,
            minLocalSurfaceExchangeDiagnostic: Number.NaN,
          },
        }),
        /must be finite/,
      ],
    ];
    for (const [label, mutate, pattern] of reportCases) {
      await expect(
        encodeLKResumeCheckpointV3(mutate(resumeState(1)), new TestSink()),
        label,
      ).rejects.toThrow(pattern);
    }

    for (const name of [
      "residual",
      "divergenceResidual",
      "shellClampDiagnostic",
      "surfaceExchangeDiagnostic",
      "smootherDriftDiagnostic",
      "minLocalSurfaceExchangeDiagnostic",
    ] as const) {
      const state = resumeState(1);
      const report = { ...state.lastRelaxation!, [name]: -0 };
      await expect(
        encodeLKResumeCheckpointV3({ ...state, lastRelaxation: report }, new TestSink()),
        `negative zero ${name}`,
      ).rejects.toThrow(/positive-zero/);
    }

    const holeFilled = {
      ...resumeState(1),
      holeFillCountTotal: 1,
      holeFillDeficit: 0.25,
    };
    await expect(encodeLKResumeCheckpointV3(holeFilled, new TestSink())).resolves.toMatchObject({
      version: 3,
    });
  });

  it("rejects noncanonical headers, malformed UTF-8, descriptor shifts, and exact-length failures", async () => {
    const { bytes } = await encodeToBytes(resumeState(1));
    const headerCases: Array<readonly [(header: Record<string, unknown>) => void, RegExp]> = [
      [(header) => (header.checkpointKind = "other"), /checkpointKind/],
      [(header) => (header.resumePhase = "ready"), /resumePhase/],
      [
        (header) => (header.noiseEpsilon = String(header.noiseEpsilon).toUpperCase()),
        /lowercase hexadecimal/,
      ],
      [(header) => (header.noiseEpsilon = 0), /16 lowercase/],
      [
        (header) => {
          (header.fields as Array<Record<string, unknown>>)[1].length = 1;
        },
        /fields\[1\]/,
      ],
      [
        (header) => {
          (header.fields as Array<Record<string, unknown>>)[0].name = "other";
        },
        /fields\[0\]/,
      ],
      [
        (header) => {
          (header.fields as Array<Record<string, unknown>>)[3].dtype = "f64";
        },
        /fields\[3\]/,
      ],
      [
        (header) => {
          const fields = header.fields as Array<Record<string, unknown>>;
          [fields[0], fields[1]] = [fields[1], fields[0]];
        },
        /fields\[0\]/,
      ],
      [
        (header) => {
          (header.fields as Array<Record<string, unknown>>)[0].extra = true;
        },
        /fields\[0\].*keys\/order/,
      ],
      [
        (header) => {
          (header.topology as Record<string, unknown>).boundaryCount = 9;
        },
        /fields\[3\]/,
      ],
      [
        (header) => {
          (header.solverCounters as Record<string, unknown>).lastRelaxationSweeps = 0;
        },
        /present relaxation counters/,
      ],
      [
        (header) => {
          (header.solverCounters as Record<string, unknown>).lastRelaxationConverged = false;
        },
        /present relaxation counters/,
      ],
      [
        (header) => {
          (header.solverCounters as Record<string, unknown>).resumeScalarNullMask = 1;
        },
        /present relaxation counters/,
      ],
      [(header) => delete header.farField, /keys\/order/],
      [(header) => (header.extra = 1), /keys\/order/],
    ];
    for (const [mutate, pattern] of headerCases) {
      await expect(decodeLKResumeCheckpointV3(new TestSource(mutateHeader(bytes, mutate)))).rejects.toThrow(
        pattern,
      );
    }

    const reordered = headerOf(bytes);
    const keys = Object.keys(reordered);
    const wrongOrder: Record<string, unknown> = {};
    for (const key of keys.slice().reverse()) wrongOrder[key] = reordered[key];
    await expect(decodeLKResumeCheckpointV3(new TestSource(replaceHeader(bytes, wrongOrder)))).rejects.toThrow(
      /keys\/order/,
    );

    const canonicalText = headerTextOf(bytes);
    const duplicateKeyText = canonicalText.replace(
      '"version":3',
      '"version":3,"version":3',
    );
    await expect(
      decodeLKResumeCheckpointV3(new TestSource(replaceHeaderText(bytes, duplicateKeyText))),
    ).rejects.toThrow(/canonical JSON/);
    await expect(
      decodeLKResumeCheckpointV3(new TestSource(replaceHeaderText(bytes, ` ${canonicalText}`))),
    ).rejects.toThrow(/canonical JSON/);
    await expect(
      decodeLKResumeCheckpointV3(
        new TestSource(
          replaceHeaderText(bytes, canonicalText.replace('"version":3', '"version":3.0')),
        ),
      ),
    ).rejects.toThrow(/canonical JSON/);

    const badUtf8 = bytes.slice();
    badUtf8[12] = 0xff;
    await expect(decodeLKResumeCheckpointV3(new TestSource(badUtf8))).rejects.toThrow(/UTF-8/);
    await expect(decodeLKResumeCheckpointV3(new TestSource(bytes.subarray(0, bytes.length - 1)))).rejects.toThrow(
      /source length/,
    );
    const extended = new Uint8Array(bytes.length + 1);
    extended.set(bytes);
    await expect(decodeLKResumeCheckpointV3(new TestSource(extended))).rejects.toThrow(/source length/);
  });

  it("rejects independently mutated payload semantics and ordered-list membership", async () => {
    const sourceState = resumeState(1);
    const { bytes } = await encodeToBytes(sourceState);
    const offsets = payloadOffsets(bytes);

    const nonbinary = bytes.slice();
    nonbinary[offsets.a] = 2;
    await expect(decodeLKResumeCheckpointV3(new TestSource(nonbinary))).rejects.toThrow(/must be binary/);

    const negativeZeroFill = bytes.slice();
    const interior = indexOf(resumeState().dims, 3, 1, 2);
    new DataView(negativeZeroFill.buffer).setFloat64(offsets.f + 8 * interior, -0, true);
    await expect(decodeLKResumeCheckpointV3(new TestSource(negativeZeroFill))).rejects.toThrow(
      /positive-zero/,
    );

    const seed = sourceState.a.indexOf(1);
    const boundary = sourceState.boundaryOrder[0];
    const floatMutations: Array<readonly [string, "f" | "sigma", number, number, RegExp]> = [
      ["f NaN", "f", boundary, Number.NaN, /f\[.*finite/],
      ["f negative", "f", boundary, -0.1, /f\[.*\[0, 1\]/],
      ["f above one", "f", boundary, 1.1, /f\[.*\[0, 1\]/],
      ["sigma NaN", "sigma", boundary, Number.NaN, /sigma\[.*finite/],
      ["sigma below -1", "sigma", boundary, -1.1, /sigma\[.*>= -1/],
      ["attached f", "f", seed, 0.5, /attached cell.*f=1/],
      ["attached sigma -0", "sigma", seed, -0, /positive-zero/],
      ["wall f -0", "f", 0, -0, /positive-zero/],
      ["wall sigma -0", "sigma", 0, -0, /positive-zero/],
    ];
    for (const [label, field, index, value, pattern] of floatMutations) {
      const mutated = bytes.slice();
      new DataView(mutated.buffer).setFloat64(offsets[field] + 8 * index, value, true);
      await expect(
        decodeLKResumeCheckpointV3(new TestSource(mutated)),
        label,
      ).rejects.toThrow(pattern);
    }

    const duplicateBoundary = bytes.slice();
    const view = new DataView(duplicateBoundary.buffer);
    view.setUint32(offsets.boundary + 4, view.getUint32(offsets.boundary, true), true);
    await expect(decodeLKResumeCheckpointV3(new TestSource(duplicateBoundary))).rejects.toThrow(/duplicate/);

    const outOfRangeBoundary = bytes.slice();
    new DataView(outOfRangeBoundary.buffer).setUint32(offsets.boundary, offsets.n, true);
    await expect(
      decodeLKResumeCheckpointV3(new TestSource(outOfRangeBoundary)),
    ).rejects.toThrow(/boundaryOrder.*in-range/);
    const nonBoundaryIndex = bytes.slice();
    new DataView(nonBoundaryIndex.buffer).setUint32(offsets.boundary, interior, true);
    await expect(decodeLKResumeCheckpointV3(new TestSource(nonBoundaryIndex))).rejects.toThrow(
      /exact permutation/,
    );

    const two = (await encodeToBytes(twoAttachmentState())).bytes;
    const twoOffsets = payloadOffsets(two);
    const duplicateLast = two.slice();
    const duplicateLastView = new DataView(duplicateLast.buffer);
    duplicateLastView.setUint32(
      twoOffsets.last + 4,
      duplicateLastView.getUint32(twoOffsets.last, true),
      true,
    );
    await expect(decodeLKResumeCheckpointV3(new TestSource(duplicateLast))).rejects.toThrow(
      /lastAttached.*duplicate/,
    );
    const nonattachedLast = two.slice();
    new DataView(nonattachedLast.buffer).setUint32(
      twoOffsets.last,
      twoAttachmentState().boundaryOrder[0],
      true,
    );
    await expect(decodeLKResumeCheckpointV3(new TestSource(nonattachedLast))).rejects.toThrow(
      /lastAttached.*not attached/,
    );

    const tickZeroDynamics = (await encodeToBytes(resumeState())).bytes;
    for (let slot = 0; slot < 6; slot++) {
      const base =
        slot === 4
          ? mutateHeader(tickZeroDynamics, (header) => {
              (header.solverCounters as Record<string, unknown>).holeFillCountTotal = 1;
            })
          : tickZeroDynamics;
      const zeroOffsets = payloadOffsets(base);
      const nonzeroDynamic = base.slice();
      new DataView(nonzeroDynamic.buffer).setFloat64(zeroOffsets.scalars + slot * 8, 1, true);
      await expect(
        decodeLKResumeCheckpointV3(new TestSource(nonzeroDynamic)),
        `tick-zero scalar ${slot}`,
      ).rejects.toThrow(/tick-zero/);
    }
    const zeroOffsets = payloadOffsets(tickZeroDynamics);
    for (let slot = 6; slot < 12; slot++) {
      const signedNull = tickZeroDynamics.slice();
      new DataView(signedNull.buffer).setFloat64(zeroOffsets.scalars + slot * 8, -0, true);
      await expect(
        decodeLKResumeCheckpointV3(new TestSource(signedNull)),
        `absent signed-zero scalar ${slot}`,
      ).rejects.toThrow(/positive-zero/);
    }
    for (let slot = 6; slot < 12; slot++) {
      const signedReport = bytes.slice();
      new DataView(signedReport.buffer).setFloat64(offsets.scalars + slot * 8, -0, true);
      await expect(
        decodeLKResumeCheckpointV3(new TestSource(signedReport)),
        `present signed-zero scalar ${slot}`,
      ).rejects.toThrow(/positive-zero/);
    }
  });

  it("accepts a different valid boundary permutation in hash-free core and preserves it exactly", async () => {
    const { bytes } = await encodeToBytes(resumeState());
    const offsets = payloadOffsets(bytes);
    const permuted = bytes.slice();
    const view = new DataView(permuted.buffer);
    const first = view.getUint32(offsets.boundary, true);
    const second = view.getUint32(offsets.boundary + 4, true);
    view.setUint32(offsets.boundary, second, true);
    view.setUint32(offsets.boundary + 4, first, true);
    const adopted = takeDecodedLKResumeCheckpointV3(
      await decodeLKResumeCheckpointV3(new TestSource(permuted)),
    );
    expect(adopted.boundaryOrder.slice(0, 2)).toEqual([second, first]);
  });

  it("splits f64 fields exactly at the fixed chunk boundary without crossing field/alignment seams", async () => {
    const state = largeChunkBoundaryState();
    const sink = new SegmentedSink();
    const summary = await encodeLKResumeCheckpointV3(state, sink);
    expect(summary.byteLength).toBe(sink.byteLength);
    expect(summary.byteLength).toBeGreaterThan(LK_RESUME_TEST_BUFFER_CAP_BYTES);
    const n = state.a.length;
    const f64Remainder = (n - LK_RESUME_STREAM_CHUNK_BYTES / 8) * 8;
    expect(sink.chunks.slice(2).map((chunk) => chunk.length)).toEqual([
      n,
      LK_RESUME_STREAM_CHUNK_BYTES,
      f64Remainder,
      LK_RESUME_STREAM_CHUNK_BYTES,
      f64Remainder,
      state.boundaryOrder.length * 4,
      12 * 8,
    ]);
    expect(f64Remainder % 8).toBe(0);
    expect((state.boundaryOrder.length * 4) % 4).toBe(0);

    const source = new SegmentedSource(sink.chunks);
    const envelope = await decodeLKResumeCheckpointV3(source);
    const adopted = takeDecodedLKResumeCheckpointV3(envelope);
    expect(adopted.a).toEqual(state.a);
    expect(adopted.boundaryOrder).toEqual(state.boundaryOrder);
    expect(source.reads.slice(2).map(([, length]) => length)).toEqual(
      sink.chunks.slice(2).map((chunk) => chunk.length),
    );
    expect(source.reads.every(([, length]) => length <= LK_RESUME_STREAM_CHUNK_BYTES)).toBe(true);
  });

  it("enforces header caps, exact stream caps, safe index ceilings, and >4 GiB layout arithmetic before fields", async () => {
    expect(MAX_LK_RESUME_HEADER_BYTES).toBe(65_536);
    expect(LK_RESUME_STREAM_CHUNK_BYTES).toBe(8_388_608);
    expect(LK_RESUME_TEST_BUFFER_CAP_BYTES).toBe(16_777_216);
    const { bytes } = await encodeToBytes(resumeState());

    for (const headerLength of [0, MAX_LK_RESUME_HEADER_BYTES + 1]) {
      const mutated = bytes.slice();
      new DataView(mutated.buffer).setUint32(8, headerLength, true);
      await expect(decodeLKResumeCheckpointV3(new TestSource(mutated))).rejects.toThrow(/header length/);
    }

    const canonicalText = headerTextOf(bytes);
    const exactCapText = canonicalText.padEnd(MAX_LK_RESUME_HEADER_BYTES, " ");
    expect(new TextEncoder().encode(exactCapText)).toHaveLength(MAX_LK_RESUME_HEADER_BYTES);
    await expect(
      decodeLKResumeCheckpointV3(
        new TestSource(replaceHeaderText(bytes, exactCapText)),
      ),
    ).rejects.toThrow(/canonical JSON/);

    for (const [fieldIndex, countKey] of [
      [3, "boundaryCount"],
      [4, "lastAttachedCount"],
    ] as const) {
      const overCount = headerOf(bytes);
      const dims = overCount.dims as { nx: number; ny: number; nz: number };
      const n = dims.nx * dims.ny * dims.nz;
      (overCount.topology as Record<string, unknown>)[countKey] = n + 1;
      (overCount.fields as Array<Record<string, unknown>>)[fieldIndex].length = n + 1;
      await expect(
        decodeLKResumeCheckpointV3(new TestSource(replaceHeader(bytes, overCount))),
        `${countKey} above n`,
      ).rejects.toThrow(/exceeds the cell count/);
    }

    const hugeHeader = headerOf(bytes);
    (hugeHeader.dims as Record<string, unknown>).nx = 1449;
    (hugeHeader.dims as Record<string, unknown>).ny = 1449;
    (hugeHeader.dims as Record<string, unknown>).nz = 200;
    hugeHeader.center = [724, 724, 100];
    const hugeN = 1449 * 1449 * 200;
    const fields = hugeHeader.fields as Array<Record<string, unknown>>;
    fields[0].length = hugeN;
    fields[1].length = hugeN;
    fields[2].length = hugeN;
    const hugeBytes = replaceHeader(bytes, hugeHeader);
    await expect(decodeLKResumeCheckpointV3(new TestSource(hugeBytes))).rejects.toThrow(
      /exact planned total [4-9][0-9]{9}/,
    );

    const overIndex = headerOf(bytes);
    (overIndex.dims as Record<string, unknown>).nx = 2048;
    (overIndex.dims as Record<string, unknown>).ny = 1024;
    (overIndex.dims as Record<string, unknown>).nz = 1024;
    const overIndexBytes = replaceHeader(bytes, overIndex);
    await expect(decodeLKResumeCheckpointV3(new TestSource(overIndexBytes))).rejects.toThrow(
      /signed-index ceiling/,
    );

    let unsafeRead = false;
    await expect(
      decodeLKResumeCheckpointV3({
        byteLength: Number.MAX_SAFE_INTEGER + 1,
        async readExactly(): Promise<void> {
          unsafeRead = true;
        },
      }),
    ).rejects.toThrow(/source.byteLength.*safe integer/);
    expect(unsafeRead).toBe(false);

    expect(() => new TestSource(new Uint8Array(LK_RESUME_TEST_BUFFER_CAP_BYTES))).not.toThrow();
    expect(() => new TestSource(new Uint8Array(LK_RESUME_TEST_BUFFER_CAP_BYTES + 1))).toThrow(
      /cap exceeded before use/,
    );
    const cappedSink = new TestSink();
    await cappedSink.write(new Uint8Array(LK_RESUME_STREAM_CHUNK_BYTES));
    await cappedSink.write(new Uint8Array(LK_RESUME_STREAM_CHUNK_BYTES));
    expect(cappedSink.total).toBe(LK_RESUME_TEST_BUFFER_CAP_BYTES);
    await expect(cappedSink.write(Uint8Array.of(0))).rejects.toThrow(
      /cap exceeded before concatenation/,
    );
  });
});
