import {
  cellCount,
  encodeLKCheckpoint,
  type DecodedLKCheckpoint,
  type Dims,
  type DomainShape,
  type FarFieldCondition,
  type LKRunState,
  type NucleationParamSet,
} from "@vcc/core";

const AGGREGATE_V5 = "aggregate-hv-g1h1-v5";

export interface GpuLkConversionMetadata {
  readonly dims: Dims;
  readonly tick: number;
  readonly simTimeSeconds: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly domain: DomainShape;
  readonly center: readonly [number, number, number];
  readonly tempC: number;
  readonly sigmaInfinity: number;
  readonly dxUm: number;
  readonly pressurePa: number;
  readonly paramSet: NucleationParamSet;
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly divTol: number;
  readonly relaxMaxSweeps: number;
  readonly surfacePolicy: typeof AGGREGATE_V5;
  readonly farField: FarFieldCondition;
}

/**
 * A non-advancing comparison/export artifact. It deliberately omits mutable GPU-only topology,
 * caches, boundary order, cumulative ledgers, readiness, and schedule position; it cannot resume
 * a GpuLkSolver.
 */
export interface GpuLkConversionSnapshot {
  readonly metadata: GpuLkConversionMetadata;
  readonly occupancy: Uint32Array;
  readonly fill: Float32Array;
  readonly sigma: Float32Array;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function copyUint8(values: unknown, length: number, label: string): Uint8Array {
  if (!(values instanceof Uint8Array) || values.length !== length) {
    throw new Error(`${label} must be a Uint8Array of length ${length}`);
  }
  return Uint8Array.from(values);
}

function copyFloat64(values: unknown, length: number, label: string): Float64Array {
  if (!(values instanceof Float64Array) || values.length !== length) {
    throw new Error(`${label} must be a Float64Array of length ${length}`);
  }
  return Float64Array.from(values);
}

function copyUint32(values: unknown, length: number, label: string): Uint32Array {
  if (!(values instanceof Uint32Array) || values.length !== length) {
    throw new Error(`${label} must be a Uint32Array of length ${length}`);
  }
  return Uint32Array.from(values);
}

function copyFloat32(values: unknown, length: number, label: string): Float32Array {
  if (!(values instanceof Float32Array) || values.length !== length) {
    throw new Error(`${label} must be a Float32Array of length ${length}`);
  }
  return Float32Array.from(values);
}

function metadataFromDecoded(
  decoded: DecodedLKCheckpoint,
): GpuLkConversionMetadata {
  const header = requireRecord(decoded.header, "decoded LK header");
  const state = requireRecord(decoded.state, "decoded LK state");
  if (header.version !== 2) {
    throw new Error("GPU LK conversion requires an explicit LK v2 checkpoint");
  }
  if (
    header.surfacePolicy !== AGGREGATE_V5 ||
    state.surfacePolicy !== AGGREGATE_V5
  ) {
    throw new Error("GPU LK conversion supports only aggregate-hv-g1h1-v5; v6 has no WGSL " +
        "implementation of the canonical opposing-operand order (ADR 0023)");
  }
  const keys = [
    "dims",
    "tick",
    "simTimeSeconds",
    "rngSeed",
    "noiseEpsilon",
    "domain",
    "center",
    "tempC",
    "sigmaInfinity",
    "dxUm",
    "pressurePa",
    "paramSet",
    "cflFill",
    "relaxTol",
    "divTol",
    "relaxMaxSweeps",
    "surfacePolicy",
    "farField",
  ] as const;
  for (const key of keys) {
    if (JSON.stringify(header[key]) !== JSON.stringify(state[key])) {
      throw new Error(`decoded LK header/state mismatch for ${key}`);
    }
  }
  const typed = decoded.state;
  return {
    dims: { ...typed.dims },
    tick: typed.tick,
    simTimeSeconds: typed.simTimeSeconds,
    rngSeed: typed.rngSeed,
    noiseEpsilon: typed.noiseEpsilon,
    domain: typed.domain,
    center: [...typed.center] as [number, number, number],
    tempC: typed.tempC,
    sigmaInfinity: typed.sigmaInfinity,
    dxUm: typed.dxUm,
    pressurePa: typed.pressurePa,
    paramSet: typed.paramSet,
    cflFill: typed.cflFill,
    relaxTol: typed.relaxTol,
    divTol: typed.divTol,
    relaxMaxSweeps: typed.relaxMaxSweeps,
    surfacePolicy: AGGREGATE_V5,
    farField: typed.farField,
  };
}

/** Strict CPU-oracle checkpoint state to one-rounding GPU comparison artifact. */
export function gpuLkSnapshotFromDecodedCheckpoint(
  decoded: DecodedLKCheckpoint,
): GpuLkConversionSnapshot {
  if (decoded === null || typeof decoded !== "object") {
    throw new Error("decoded LK checkpoint must be an object");
  }
  const metadata = metadataFromDecoded(decoded);
  const count = cellCount(metadata.dims);
  const occupancySource = copyUint8(decoded.state.a, count, "decoded LK occupancy");
  const fillSource = copyFloat64(decoded.state.f, count, "decoded LK fill");
  const sigmaSource = copyFloat64(decoded.state.sigma, count, "decoded LK sigma");
  const occupancy = new Uint32Array(count);
  const fill = new Float32Array(count);
  const sigma = new Float32Array(count);
  for (let index = 0; index < count; index++) {
    occupancy[index] = occupancySource[index];
    fill[index] = Math.fround(fillSource[index]);
    sigma[index] = Math.fround(sigmaSource[index]);
    if (!Number.isFinite(fill[index]) || !Number.isFinite(sigma[index])) {
      throw new Error(`LK checkpoint field is not representable as f32 at cell ${index}`);
    }
  }
  return { metadata, occupancy, fill, sigma };
}

function metadataToRunState(
  metadata: GpuLkConversionMetadata,
  occupancy: Uint32Array,
  fill: Float32Array,
  sigma: Float32Array,
): LKRunState {
  const count = cellCount(metadata.dims);
  const occupancyCopy = copyUint32(occupancy, count, "GPU LK occupancy");
  const fillCopy = copyFloat32(fill, count, "GPU LK fill");
  const sigmaCopy = copyFloat32(sigma, count, "GPU LK sigma");
  const a = new Uint8Array(count);
  const f = new Float64Array(count);
  const widenedSigma = new Float64Array(count);
  for (let index = 0; index < count; index++) {
    if (occupancyCopy[index] > 1) {
      throw new Error(`GPU LK occupancy must be binary at cell ${index}`);
    }
    if (!Number.isFinite(fillCopy[index]) || !Number.isFinite(sigmaCopy[index])) {
      throw new Error(`GPU LK field must be finite at cell ${index}`);
    }
    a[index] = occupancyCopy[index];
    f[index] = fillCopy[index];
    widenedSigma[index] = sigmaCopy[index];
  }
  return {
    dims: { ...metadata.dims },
    tick: metadata.tick,
    simTimeSeconds: metadata.simTimeSeconds,
    rngSeed: metadata.rngSeed,
    noiseEpsilon: metadata.noiseEpsilon,
    domain: metadata.domain,
    center: [...metadata.center] as [number, number, number],
    tempC: metadata.tempC,
    sigmaInfinity: metadata.sigmaInfinity,
    dxUm: metadata.dxUm,
    pressurePa: metadata.pressurePa,
    paramSet: metadata.paramSet,
    cflFill: metadata.cflFill,
    relaxTol: metadata.relaxTol,
    divTol: metadata.divTol,
    relaxMaxSweeps: metadata.relaxMaxSweeps,
    surfacePolicy: AGGREGATE_V5,
    farField: metadata.farField,
    a,
    f,
    sigma: widenedSigma,
  };
}

/** Exact f32 widening to a state accepted by the unchanged core LK v2 encoder. */
export function gpuLkSnapshotToCpuRunState(
  snapshot: GpuLkConversionSnapshot,
): LKRunState {
  if (snapshot === null || typeof snapshot !== "object") {
    throw new Error("GPU LK conversion snapshot must be an object");
  }
  if (snapshot.metadata.surfacePolicy !== AGGREGATE_V5) {
    throw new Error("GPU LK conversion supports only aggregate-hv-g1h1-v5; v6 has no WGSL " +
        "implementation of the canonical opposing-operand order (ADR 0023)");
  }
  const state = metadataToRunState(
    snapshot.metadata,
    snapshot.occupancy,
    snapshot.fill,
    snapshot.sigma,
  );
  // The encoder is the final authority for metadata, field, mask, and attached-state meanings.
  encodeLKCheckpoint(state);
  return state;
}

/** Convenience export that remains explicitly non-advancing and non-resumable. */
export function encodeGpuLkConversionSnapshot(
  snapshot: GpuLkConversionSnapshot,
): Uint8Array {
  return encodeLKCheckpoint(gpuLkSnapshotToCpuRunState(snapshot));
}
