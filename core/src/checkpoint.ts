// Checkpoint format (charter §3.1; plan, Stage 2a "core/checkpoint").
//
// Layout, all multi-byte values LITTLE-ENDIAN by mandate (checkpoints cross the Mac/Windows
// boundary by design, ADR 0002):
//
//   bytes 0..7   magic "VCCCKPT1" (ASCII)
//   bytes 8..11  u32 LE: byte length H of the JSON header
//   bytes 12..   UTF-8 JSON header (see CheckpointHeader)
//   then         raw field bytes, in the header's field order, each dtype as declared
//
// The header records dims, tick, params, the PRNG seed, noise epsilon, the far-field
// boundary condition (charter §2.4 — results are never compared across conditions silently),
// per-field dtype (u8 | f64 | f32 — f32 arrives with the GPU solver), endianness, and the
// last computed metrics. Oracle-vs-GPU comparisons, the regression suite and the sweep
// harness all speak through this format.

import { cellCount, hexDistance, type Dims } from "./lattice.ts";
import {
  isLKSurfacePolicy,
  isNucleationParamSet,
  kineticLength,
  mIce,
  vKin,
  type LKSurfacePolicy,
  type NucleationParamSet,
} from "./libbrecht.ts";
import { totalMass } from "./metrics.ts";
import { validateParams, type GGParams } from "./params.ts";
import type { DomainShape, FarFieldCondition, SolverState } from "./state.ts";

export const CHECKPOINT_MAGIC = "VCCCKPT1";

export type FieldDtype = "u8" | "f64" | "f32";

export interface FieldDescriptor {
  readonly name: string;
  readonly dtype: FieldDtype;
  readonly length: number;
}

export interface CheckpointHeader {
  readonly version: 1;
  readonly endianness: "LE";
  readonly dims: Dims;
  readonly tick: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly farField: FarFieldCondition;
  readonly domain: DomainShape;
  readonly center: readonly [number, number, number];
  /** Length-8 vectors serialized as arrays; NaN (the poisoned slot 0) becomes null. */
  readonly params: {
    readonly rho: number;
    readonly phi: number;
    readonly kappa: (number | null)[];
    readonly mu: (number | null)[];
    readonly ggThreshBeta: (number | null)[];
  };
  readonly metrics: CheckpointMetrics | null;
  readonly fields: FieldDescriptor[];
}

/**
 * The v1 header metric block: EXACTLY these eleven keys, in exactly this property order —
 * the wire contract is FROZEN (Phase 2a evidence hardening: "Keep the v1 GG wire layout and
 * property order unchanged"). The in-memory `Metrics` bundle is a superset (Phase 3 added
 * depletionCenter/Rim/Ratio, whose evidentiary home is gate3's CSV and the runner's printed
 * lines, not the checkpoint); encodeCheckpoint PICKS these eleven, and the decoder REJECTS
 * any other key by name. Measured consequence of not picking (R1 review, 2026-07-15): the
 * three extra keys grew a reproduced 2a canonical header by 111 bytes and broke the recorded
 * byte-identity claim while all field payload bytes were identical.
 */
export interface CheckpointMetrics {
  readonly tick: number;
  readonly attachedCount: number;
  readonly totalMass: number;
  readonly symmetryError: number;
  readonly aspectRatio: number;
  readonly crossSectionHollowness: number;
  readonly sealedVoidFraction: number;
  readonly branchCount: number;
  readonly boundingRadius: number;
  readonly domainContact: boolean;
  readonly farFieldVapor: number;
}

const GG_METRIC_KEYS = [
  "tick",
  "attachedCount",
  "totalMass",
  "symmetryError",
  "aspectRatio",
  "crossSectionHollowness",
  "sealedVoidFraction",
  "branchCount",
  "boundingRadius",
  "domainContact",
  "farFieldVapor",
] as const;

/**
 * Explicit pick of the eleven v1 keys in v1 property order. Encode-side only: the in-memory
 * bundle legitimately carries extra (non-checkpoint) metrics, which are dropped here by
 * design; decode-side input is never picked — it is validated strictly instead.
 */
function pickGGMetrics(metrics: CheckpointMetrics | null): CheckpointMetrics | null {
  if (metrics === null) return null;
  return {
    tick: metrics.tick,
    attachedCount: metrics.attachedCount,
    totalMass: metrics.totalMass,
    symmetryError: metrics.symmetryError,
    aspectRatio: metrics.aspectRatio,
    crossSectionHollowness: metrics.crossSectionHollowness,
    sealedVoidFraction: metrics.sealedVoidFraction,
    branchCount: metrics.branchCount,
    boundingRadius: metrics.boundingRadius,
    domainContact: metrics.domainContact,
    farFieldVapor: metrics.farFieldVapor,
  };
}

const LITTLE_ENDIAN_PLATFORM = new Uint8Array(new Uint16Array([0x0102]).buffer)[0] === 0x02;

function vectorToJson(v: Float64Array): (number | null)[] {
  return Array.from(v, (x) => (Number.isNaN(x) ? null : x));
}

function writeF64(target: Uint8Array, offset: number, source: Float64Array): number {
  if (LITTLE_ENDIAN_PLATFORM) {
    target.set(new Uint8Array(source.buffer, source.byteOffset, source.byteLength), offset);
  } else {
    const view = new DataView(target.buffer, target.byteOffset + offset);
    for (let i = 0; i < source.length; i++) view.setFloat64(i * 8, source[i], true);
  }
  return offset + source.byteLength;
}

function readF64(source: Uint8Array, offset: number, length: number): Float64Array {
  const bytes = source.subarray(offset, offset + length * 8);
  if (LITTLE_ENDIAN_PLATFORM) {
    // Copy so the result owns aligned memory independent of the checkpoint buffer.
    const aligned = new Uint8Array(bytes.length);
    aligned.set(bytes);
    return new Float64Array(aligned.buffer);
  }
  const view = new DataView(source.buffer, source.byteOffset + offset);
  const out = new Float64Array(length);
  for (let i = 0; i < length; i++) out[i] = view.getFloat64(i * 8, true);
  return out;
}

function requireGGRecord(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`GG checkpoint ${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireGGFinite(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`GG checkpoint ${name} must be finite`);
  }
  return value;
}

function readGGParamVector(value: unknown, name: string): Float64Array {
  if (value instanceof Float64Array) {
    if (value.length !== 8) throw new Error(`GG checkpoint ${name} must have length 8`);
    if (!Number.isNaN(value[0])) throw new Error(`GG checkpoint ${name}[0] must be NaN`);
    return value;
  }
  if (!Array.isArray(value) || value.length !== 8) {
    throw new Error(`GG checkpoint ${name} must be an array of length 8`);
  }
  if (value[0] !== null) throw new Error(`GG checkpoint ${name}[0] must be null`);
  const vector = new Float64Array(8).fill(Number.NaN);
  for (let slot = 1; slot < 8; slot++) {
    vector[slot] = requireGGFinite(value[slot], `${name}[${slot}]`);
  }
  return vector;
}

function readGGParams(value: unknown): GGParams {
  const params = requireGGRecord(value, "params");
  const result: GGParams = {
    rho: requireGGFinite(params.rho, "params.rho"),
    phi: requireGGFinite(params.phi, "params.phi"),
    kappa: readGGParamVector(params.kappa, "params.kappa"),
    mu: readGGParamVector(params.mu, "params.mu"),
    ggThreshBeta: readGGParamVector(params.ggThreshBeta, "params.ggThreshBeta"),
  };
  const validation = validateParams(result);
  if (validation.errors.length > 0) {
    throw new Error(`GG checkpoint parameters are invalid: ${validation.errors.join("; ")}`);
  }
  return result;
}

/** Runtime schema shared by GG encode and decode; TypeScript types do not validate JS or JSON. */
function validateGGMetadata(value: unknown): { readonly n: number; readonly params: GGParams } {
  const metadata = requireGGRecord(value, "metadata");
  const dimsValue = requireGGRecord(metadata.dims, "dims");
  const dimension = (name: "nx" | "ny" | "nz"): number => {
    const size = dimsValue[name];
    if (!Number.isSafeInteger(size) || (size as number) <= 0) {
      throw new Error(`GG checkpoint dims.${name} must be a positive safe integer`);
    }
    return size as number;
  };
  const dims: Dims = { nx: dimension("nx"), ny: dimension("ny"), nz: dimension("nz") };
  const n = cellCount(dims);
  if (!Number.isSafeInteger(n) || n <= 0) {
    throw new Error("GG checkpoint cell count must be a positive safe integer");
  }
  if (!Number.isSafeInteger(metadata.tick) || (metadata.tick as number) < 0) {
    throw new Error("GG checkpoint tick must be a nonnegative safe integer");
  }
  if (
    !Number.isSafeInteger(metadata.rngSeed) ||
    (metadata.rngSeed as number) < 0 ||
    (metadata.rngSeed as number) > 0xffff_ffff
  ) {
    throw new Error("GG checkpoint rngSeed must be a uint32 integer");
  }
  const noise = requireGGFinite(metadata.noiseEpsilon, "noiseEpsilon");
  if (noise < 0 || noise > 1) {
    throw new Error("GG checkpoint noiseEpsilon must be in [0, 1]");
  }
  if (metadata.farField !== "reflecting" && metadata.farField !== "dirichlet") {
    throw new Error(`GG checkpoint farField is invalid: ${String(metadata.farField)}`);
  }
  if (metadata.domain !== "box" && metadata.domain !== "hexPrism") {
    throw new Error(`GG checkpoint domain is invalid: ${String(metadata.domain)}`);
  }
  if (!Array.isArray(metadata.center) || metadata.center.length !== 3) {
    throw new Error("GG checkpoint center must contain exactly three coordinates");
  }
  for (let axis = 0; axis < 3; axis++) {
    const coordinate = metadata.center[axis];
    const limit = axis === 0 ? dims.nx : axis === 1 ? dims.ny : dims.nz;
    if (
      !Number.isSafeInteger(coordinate) ||
      (coordinate as number) < 0 ||
      (coordinate as number) >= limit
    ) {
      throw new Error(`GG checkpoint center[${axis}] must be an in-domain integer`);
    }
  }
  return { n, params: readGGParams(metadata.params) };
}

function validateGGMetrics(value: unknown, n: number, tick: number): CheckpointMetrics | null {
  if (value === null) return null;
  const metrics = requireGGRecord(value, "metrics");
  // Exact key set, unknown keys rejected BY NAME (R1 review 2026-07-15: smuggled keys and
  // garbage values in non-contract fields decoded successfully, contradicting the round-5/6
  // "validated, not trusted" posture). Every accepted evidence artifact carries exactly the
  // eleven v1 keys, so exact-set validation rejects nothing that matters.
  for (const key of Object.keys(metrics)) {
    if (!(GG_METRIC_KEYS as readonly string[]).includes(key)) {
      throw new Error(
        `GG checkpoint metrics has unknown key "${key}" (the v1 header carries exactly the ` +
          `eleven registered metric keys)`,
      );
    }
  }
  if (!Number.isSafeInteger(metrics.tick) || metrics.tick !== tick) {
    throw new Error("GG checkpoint metrics.tick must equal the checkpoint tick");
  }
  for (const name of ["attachedCount", "branchCount"] as const) {
    if (!Number.isSafeInteger(metrics[name]) || (metrics[name] as number) < 0) {
      throw new Error(`GG checkpoint metrics.${name} must be a nonnegative safe integer`);
    }
  }
  if ((metrics.attachedCount as number) > n) {
    throw new Error("GG checkpoint metrics.attachedCount exceeds the cell count");
  }
  for (const name of [
    "totalMass",
    "symmetryError",
    "aspectRatio",
    "crossSectionHollowness",
    "sealedVoidFraction",
    "boundingRadius",
    "farFieldVapor",
  ] as const) {
    requireGGFinite(metrics[name], `metrics.${name}`);
  }
  if ((metrics.totalMass as number) < 0) throw new Error("GG checkpoint metrics.totalMass must be nonnegative");
  if ((metrics.symmetryError as number) < 0 || (metrics.symmetryError as number) > 2) {
    throw new Error("GG checkpoint metrics.symmetryError must be in [0, 2]");
  }
  if ((metrics.attachedCount as number) === 0 || (metrics.aspectRatio as number) <= 0) {
    throw new Error("GG checkpoint finite metrics require an attached crystal and positive aspectRatio");
  }
  for (const name of ["crossSectionHollowness", "sealedVoidFraction"] as const) {
    const fraction = metrics[name] as number;
    if (fraction < 0 || fraction > 1) {
      throw new Error(`GG checkpoint metrics.${name} must be in [0, 1]`);
    }
  }
  if ((metrics.boundingRadius as number) < 0 || (metrics.farFieldVapor as number) < 0) {
    throw new Error("GG checkpoint metric radii and vapor must be nonnegative");
  }
  if (typeof metrics.domainContact !== "boolean") {
    throw new Error("GG checkpoint metrics.domainContact must be boolean");
  }
  // The cast is now earned: every one of the eleven keys was checked above, and no other
  // key survived the exact-set scan.
  return metrics as unknown as CheckpointMetrics;
}

function validateGGStateArrays(
  state: SolverState,
  n: number,
  metrics: CheckpointMetrics | null,
): void {
  if (!(state.a instanceof Uint8Array) || state.a.length !== n) {
    throw new Error(`GG checkpoint a must be a Uint8Array of length ${n}`);
  }
  if (!(state.b instanceof Float64Array) || state.b.length !== n) {
    throw new Error(`GG checkpoint b must be a Float64Array of length ${n}`);
  }
  if (!(state.d instanceof Float64Array) || state.d.length !== n) {
    throw new Error(`GG checkpoint d must be a Float64Array of length ${n}`);
  }
  const [ic, jc, kc] = state.center;
  const radius = Math.min(ic, state.dims.nx - 1 - ic, jc, state.dims.ny - 1 - jc);
  const halfZ = Math.min(kc, state.dims.nz - 1 - kc);
  const plane = state.dims.nx * state.dims.ny;
  let attachedCount = 0;
  for (let index = 0; index < n; index++) {
    if (state.a[index] !== 0 && state.a[index] !== 1) {
      throw new Error(`GG checkpoint a[${index}] must be 0 or 1`);
    }
    if (!Number.isFinite(state.b[index]) || state.b[index] < 0) {
      throw new Error(`GG checkpoint b[${index}] must be finite and nonnegative`);
    }
    if (!Number.isFinite(state.d[index]) || state.d[index] < 0) {
      throw new Error(`GG checkpoint d[${index}] must be finite and nonnegative`);
    }
    if (state.a[index] === 1) {
      attachedCount++;
      if (state.d[index] !== 0) {
        throw new Error(`GG checkpoint attached cell ${index} must have d=0`);
      }
    }
    if (state.domain === "hexPrism") {
      const k = Math.floor(index / plane);
      const inPlane = index - k * plane;
      const j = Math.floor(inPlane / state.dims.nx);
      const i = inPlane - j * state.dims.nx;
      const active = hexDistance(i - ic, j - jc) <= radius && Math.abs(k - kc) <= halfZ;
      if (!active && (state.a[index] !== 0 || state.b[index] !== 0 || state.d[index] !== 0)) {
        throw new Error(`GG checkpoint masked wall cell ${index} must have a=b=d=0`);
      }
    }
  }
  if (metrics !== null) {
    if (metrics.attachedCount !== attachedCount) {
      throw new Error("GG checkpoint metrics.attachedCount does not match field a");
    }
    if (metrics.totalMass !== totalMass(state.b, state.d)) {
      throw new Error("GG checkpoint metrics.totalMass does not match fields b and d");
    }
  }
}

export function encodeCheckpoint(
  state: SolverState,
  metrics: CheckpointMetrics | null,
): Uint8Array {
  const { n } = validateGGMetadata(state);
  // Pick the frozen v1 key set FIRST (in-memory Metrics is a superset by design), then
  // validate the picked block — so the header serializes exactly the eleven keys in v1
  // property order, and a decoded header re-encodes byte-identically.
  const checkedMetrics = validateGGMetrics(pickGGMetrics(metrics), n, state.tick);
  validateGGStateArrays(state, n, checkedMetrics);
  const header: CheckpointHeader = {
    version: 1,
    endianness: "LE",
    dims: state.dims,
    tick: state.tick,
    rngSeed: state.rngSeed,
    noiseEpsilon: state.noiseEpsilon,
    farField: state.farField,
    domain: state.domain,
    center: state.center,
    params: {
      rho: state.params.rho,
      phi: state.params.phi,
      kappa: vectorToJson(state.params.kappa),
      mu: vectorToJson(state.params.mu),
      ggThreshBeta: vectorToJson(state.params.ggThreshBeta),
    },
    metrics: checkedMetrics,
    fields: [
      { name: "a", dtype: "u8", length: n },
      { name: "b", dtype: "f64", length: n },
      { name: "d", dtype: "f64", length: n },
    ],
  };
  const headerBytes = new TextEncoder().encode(JSON.stringify(header));
  const total = 8 + 4 + headerBytes.length + n + 8 * n + 8 * n;
  const out = new Uint8Array(total);
  for (let i = 0; i < 8; i++) out[i] = CHECKPOINT_MAGIC.charCodeAt(i);
  new DataView(out.buffer).setUint32(8, headerBytes.length, true);
  out.set(headerBytes, 12);
  let offset = 12 + headerBytes.length;
  out.set(state.a, offset);
  offset += n;
  offset = writeF64(out, offset, state.b);
  offset = writeF64(out, offset, state.d);
  return out;
}

export interface DecodedCheckpoint {
  readonly header: CheckpointHeader;
  readonly state: SolverState;
}

// ── LibbrechtKinetics checkpoints (Phase 2b; attachment-kinetics §4.4 component 4) ──────────
// Additive: same magic and layout discipline, its own header shape (rule-tagged), its own
// field list (a, f, sigma — the separate fill field, and the sigma field that IS d under this
// rule). GGThreshold checkpoints are untouched, bit for bit.

interface LKCheckpointHeaderBase {
  readonly rule: "LibbrechtKinetics";
  readonly endianness: "LE";
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
  /** Divergence-identity tolerance — the OTHER half of fixed-sigma Dirichlet convergence.
      Reflecting diagnostic runs record it but do not apply it. Added 2026-07-15 (round-4 maker
      review: without it a checkpoint cannot independently establish the registered controls).
      REQUIRED — decode rejects headers missing it. No accepted LK checkpoint predates it. */
  readonly divTol: number;
  /** Sweep cap of the relaxation loop — same round-4 provenance requirement. */
  readonly relaxMaxSweeps: number;
  readonly farField: FarFieldCondition;
  readonly fields: FieldDescriptor[];
}

/** Executed protocol-v3 wire header. The coupled policy was implicit and must stay absent. */
export interface LKCheckpointHeaderV1 extends LKCheckpointHeaderBase {
  readonly version: 1;
  readonly surfacePolicy?: never;
}

/** Forward wire header. The coupled classifier/Robin/fill policy is evidence provenance. */
export interface LKCheckpointHeaderV2 extends LKCheckpointHeaderBase {
  readonly version: 2;
  readonly surfacePolicy: LKSurfacePolicy;
}

export type LKCheckpointHeader = LKCheckpointHeaderV1 | LKCheckpointHeaderV2;

export interface LKRunState {
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
  /** Coupled classification, Robin geometry, and fill geometry used by this state. */
  readonly surfacePolicy: LKSurfacePolicy;
  /** Actual condition used. Reflecting LK is diagnostic-only, but its data remains serializable. */
  readonly farField: FarFieldCondition;
  readonly a: Uint8Array;
  readonly f: Float64Array;
  readonly sigma: Float64Array;
}

function requireRecord(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`LK checkpoint ${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireFinite(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`LK checkpoint ${name} must be finite`);
  }
  return value;
}

function requirePositive(value: unknown, name: string): number {
  const number = requireFinite(value, name);
  if (number <= 0) throw new Error(`LK checkpoint ${name} must be positive`);
  return number;
}

function requireLKSurfacePolicy(value: unknown): LKSurfacePolicy {
  if (!isLKSurfacePolicy(value)) {
    throw new Error(`LK checkpoint surfacePolicy is invalid: ${String(value)}`);
  }
  return value;
}

/** Runtime schema shared by encode and decode: TypeScript types do not validate external JS/JSON. */
function validateLKMetadata(value: unknown): number {
  const metadata = requireRecord(value, "metadata");
  const dimsValue = requireRecord(metadata.dims, "dims");
  const dimension = (name: "nx" | "ny" | "nz"): number => {
    const n = dimsValue[name];
    if (!Number.isSafeInteger(n) || (n as number) <= 0) {
      throw new Error(`LK checkpoint dims.${name} must be a positive safe integer`);
    }
    return n as number;
  };
  const dims: Dims = { nx: dimension("nx"), ny: dimension("ny"), nz: dimension("nz") };
  const n = cellCount(dims);
  if (!Number.isSafeInteger(n) || n <= 0) {
    throw new Error("LK checkpoint cell count must be a positive safe integer");
  }

  if (!Number.isSafeInteger(metadata.tick) || (metadata.tick as number) < 0) {
    throw new Error("LK checkpoint tick must be a nonnegative safe integer");
  }
  const simTime = requireFinite(metadata.simTimeSeconds, "simTimeSeconds");
  if (simTime < 0) throw new Error("LK checkpoint simTimeSeconds must be nonnegative");
  if (
    !Number.isSafeInteger(metadata.rngSeed) ||
    (metadata.rngSeed as number) < 0 ||
    (metadata.rngSeed as number) > 0xffff_ffff
  ) {
    throw new Error("LK checkpoint rngSeed must be a uint32 integer");
  }
  const noise = requireFinite(metadata.noiseEpsilon, "noiseEpsilon");
  if (noise < 0 || noise > 1) {
    throw new Error("LK checkpoint noiseEpsilon must be in [0, 1]");
  }
  if (metadata.domain !== "box" && metadata.domain !== "hexPrism") {
    throw new Error(`LK checkpoint domain is invalid: ${String(metadata.domain)}`);
  }
  if (!Array.isArray(metadata.center) || metadata.center.length !== 3) {
    throw new Error("LK checkpoint center must contain exactly three coordinates");
  }
  for (let axis = 0; axis < 3; axis++) {
    const coordinate = metadata.center[axis];
    const limit = axis === 0 ? dims.nx : axis === 1 ? dims.ny : dims.nz;
    if (!Number.isSafeInteger(coordinate) || (coordinate as number) < 0 || (coordinate as number) >= limit) {
      throw new Error(`LK checkpoint center[${axis}] must be an in-domain integer`);
    }
  }
  const tempC = requireFinite(metadata.tempC, "tempC");
  if (tempC < -50 || tempC > -1) {
    throw new Error("LK checkpoint tempC must stay in the digitized domain [-50, -1]");
  }
  const sigmaInfinity = requirePositive(metadata.sigmaInfinity, "sigmaInfinity");
  const dxUm = requirePositive(metadata.dxUm, "dxUm");
  const pressurePa = requirePositive(metadata.pressurePa, "pressurePa");
  // Keep evidence acceptance symmetric with LKSolver's numerical-representability checks.
  // Raw finite positive controls can still underflow/overflow after SI conversion or in the
  // source equations, yielding a checkpoint for a run the solver cannot compute honestly.
  const dxM = dxUm * 1e-6;
  const vKinMS = vKin(tempC);
  const x0M = kineticLength(tempC, pressurePa);
  const mIceLedger = mIce(tempC);
  for (const [name, derived] of [
    ["derived dxM", dxM],
    ["derived vKinMS", vKinMS],
    ["derived X_0", x0M],
    ["derived M_ice", mIceLedger],
    ["derived dxM/X_0", dxM / x0M],
    ["derived maximum kinetic fill-rate scale", (6 * vKinMS * sigmaInfinity) / dxM],
  ] as const) {
    if (!Number.isFinite(derived) || derived <= 0) {
      throw new Error(`LK checkpoint ${name} must be finite and positive`);
    }
  }
  if (!isNucleationParamSet(metadata.paramSet)) {
    throw new Error(`LK checkpoint paramSet is invalid: ${String(metadata.paramSet)}`);
  }
  const cfl = requireFinite(metadata.cflFill, "cflFill");
  if (!(cfl > 0 && cfl < 1)) {
    throw new Error("LK checkpoint cflFill must be in (0, 1)");
  }
  requirePositive(metadata.relaxTol, "relaxTol");
  requirePositive(metadata.divTol, "divTol");
  if (!Number.isSafeInteger(metadata.relaxMaxSweeps) || (metadata.relaxMaxSweeps as number) <= 0) {
    throw new Error("LK checkpoint relaxMaxSweeps must be a positive safe integer");
  }
  if (
    metadata.farField !== "dirichlet" &&
    metadata.farField !== "reflecting" &&
    metadata.farField !== "monopole-matched"
  ) {
    throw new Error(`LK checkpoint farField is invalid: ${String(metadata.farField)}`);
  }
  return n;
}

function validateLKStateArrays(state: LKRunState, n: number): void {
  if (!(state.a instanceof Uint8Array) || state.a.length !== n) {
    throw new Error(`LK checkpoint a must be a Uint8Array of length ${n}`);
  }
  if (!(state.f instanceof Float64Array) || state.f.length !== n) {
    throw new Error(`LK checkpoint f must be a Float64Array of length ${n}`);
  }
  if (!(state.sigma instanceof Float64Array) || state.sigma.length !== n) {
    throw new Error(`LK checkpoint sigma must be a Float64Array of length ${n}`);
  }
  const [ic, jc, kc] = state.center;
  const radius = Math.min(ic, state.dims.nx - 1 - ic, jc, state.dims.ny - 1 - jc);
  const halfZ = Math.min(kc, state.dims.nz - 1 - kc);
  const plane = state.dims.nx * state.dims.ny;
  for (let i = 0; i < n; i++) {
    if (state.a[i] !== 0 && state.a[i] !== 1) {
      throw new Error(`LK checkpoint a[${i}] must be 0 or 1`);
    }
    if (!Number.isFinite(state.f[i]) || state.f[i] < 0 || state.f[i] > 1) {
      throw new Error(`LK checkpoint f[${i}] must be finite and in [0, 1]`);
    }
    // ADR 0011 temperature events may truthfully produce subsaturation. sigma = -1 is zero
    // absolute vapor density; anything below it would imply a negative density and is invalid.
    if (!Number.isFinite(state.sigma[i]) || state.sigma[i] < -1) {
      throw new Error(`LK checkpoint sigma[${i}] must be finite and >= -1`);
    }
    if (state.a[i] === 1 && (state.f[i] !== 1 || state.sigma[i] !== 0)) {
      throw new Error(`LK checkpoint attached cell ${i} must have f=1 and sigma=0`);
    }
    // Do not require the converse. In advanceSurface's unsaturated branch, floating-point
    // addition can round f + raw to exactly 1 even though raw < 1 - f; that valid cell attaches
    // on the following step.
    if (state.domain === "hexPrism") {
      const k = Math.floor(i / plane);
      const inPlane = i - k * plane;
      const j = Math.floor(inPlane / state.dims.nx);
      const x = inPlane - j * state.dims.nx;
      const active = hexDistance(x - ic, j - jc) <= radius && Math.abs(k - kc) <= halfZ;
      if (!active && (state.a[i] !== 0 || state.f[i] !== 0 || state.sigma[i] !== 0)) {
        throw new Error(`LK checkpoint masked wall cell ${i} must have a=f=sigma=0`);
      }
    }
  }
}

export function encodeLKCheckpoint(state: LKRunState): Uint8Array {
  const n = validateLKMetadata(state);
  const surfacePolicy = requireLKSurfacePolicy(
    (state as LKRunState & { readonly surfacePolicy?: unknown }).surfacePolicy,
  );
  validateLKStateArrays(state, n);
  const header: LKCheckpointHeaderV2 = {
    version: 2,
    rule: "LibbrechtKinetics",
    surfacePolicy,
    endianness: "LE",
    dims: state.dims,
    tick: state.tick,
    simTimeSeconds: state.simTimeSeconds,
    rngSeed: state.rngSeed,
    noiseEpsilon: state.noiseEpsilon,
    domain: state.domain,
    center: state.center,
    tempC: state.tempC,
    sigmaInfinity: state.sigmaInfinity,
    dxUm: state.dxUm,
    pressurePa: state.pressurePa,
    paramSet: state.paramSet,
    cflFill: state.cflFill,
    relaxTol: state.relaxTol,
    divTol: state.divTol,
    relaxMaxSweeps: state.relaxMaxSweeps,
    farField: state.farField,
    fields: [
      { name: "a", dtype: "u8", length: n },
      { name: "f", dtype: "f64", length: n },
      { name: "sigma", dtype: "f64", length: n },
    ],
  };
  const headerBytes = new TextEncoder().encode(JSON.stringify(header));
  const total = 8 + 4 + headerBytes.length + n + 8 * n + 8 * n;
  const out = new Uint8Array(total);
  for (let i = 0; i < 8; i++) out[i] = CHECKPOINT_MAGIC.charCodeAt(i);
  new DataView(out.buffer).setUint32(8, headerBytes.length, true);
  out.set(headerBytes, 12);
  let offset = 12 + headerBytes.length;
  out.set(state.a, offset);
  offset += n;
  offset = writeF64(out, offset, state.f);
  writeF64(out, offset, state.sigma);
  return out;
}

export interface DecodedLKCheckpoint {
  readonly header: LKCheckpointHeader;
  readonly state: LKRunState;
}

export function decodeLKCheckpoint(bytes: Uint8Array): DecodedLKCheckpoint {
  if (bytes.length < 12) throw new Error("LK checkpoint is shorter than its fixed header");
  let magic = "";
  for (let i = 0; i < 8; i++) magic += String.fromCharCode(bytes[i]);
  if (magic !== CHECKPOINT_MAGIC) {
    throw new Error(`bad checkpoint magic: ${JSON.stringify(magic)}`);
  }
  const headerLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(8, true);
  if (headerLength > bytes.length - 12) {
    throw new Error("LK checkpoint header length exceeds the available bytes");
  }
  const parsedHeader = JSON.parse(
    new TextDecoder().decode(bytes.subarray(12, 12 + headerLength)),
  ) as unknown;
  const headerRecord = requireRecord(parsedHeader, "header");
  const version = headerRecord.version;
  let surfacePolicy: LKSurfacePolicy;
  if (version === 1) {
    if (Object.prototype.hasOwnProperty.call(headerRecord, "surfacePolicy")) {
      throw new Error("LK checkpoint version 1 must not declare surfacePolicy");
    }
    surfacePolicy = "legacy-v3";
  } else if (version === 2) {
    surfacePolicy = requireLKSurfacePolicy(headerRecord.surfacePolicy);
  } else {
    throw new Error(`unsupported LK checkpoint version ${String(version)}`);
  }
  const header = headerRecord as unknown as LKCheckpointHeader;
  if (header.rule !== "LibbrechtKinetics") {
    throw new Error(`not a LibbrechtKinetics checkpoint (rule=${(header as { rule?: string }).rule})`);
  }
  if (header.endianness !== "LE") throw new Error("checkpoint must declare LE endianness");
  // Round-4/5 maker reviews: every wire-format and runtime control is validated, not trusted.
  // Round-5 probes showed version 2, missing relaxTol, invalid tolerances/sweep caps, and a
  // short f descriptor all decoding "successfully" (the last silently SHIFTED state). Round 6
  // corrected one overreach: reflecting LK checkpoints are valid diagnostic data; gate
  // acceptance, not the codec, enforces Dirichlet physics runs.
  const n = validateLKMetadata(header);
  if (!Array.isArray(header.fields)) {
    throw new Error("LK checkpoint fields must be an array");
  }
  const expectedFields: ReadonlyArray<readonly [string, string, number]> = [
    ["a", "u8", n],
    ["f", "f64", n],
    ["sigma", "f64", n],
  ];
  if (
    header.fields.length !== expectedFields.length ||
    header.fields.some(
      (field, i) =>
        field.name !== expectedFields[i][0] ||
        field.dtype !== expectedFields[i][1] ||
        field.length !== expectedFields[i][2],
    )
  ) {
    throw new Error(
      "LK checkpoint field table must be exactly a:u8, f:f64, sigma:f64 at the full cell count",
    );
  }
  if (bytes.length !== 12 + headerLength + n + 16 * n) {
    throw new Error("LK checkpoint payload length does not match its header");
  }
  let offset = 12 + headerLength;
  let a: Uint8Array | null = null;
  let f: Float64Array | null = null;
  let sigma: Float64Array | null = null;
  for (const field of header.fields) {
    if (field.dtype === "u8") {
      const copy = new Uint8Array(field.length);
      copy.set(bytes.subarray(offset, offset + field.length));
      if (field.name === "a") a = copy;
      offset += field.length;
    } else if (field.dtype === "f64") {
      const values = readF64(bytes, offset, field.length);
      if (field.name === "f") f = values;
      if (field.name === "sigma") sigma = values;
      offset += field.length * 8;
    } else {
      throw new Error(`dtype ${field.dtype} not readable by the CPU oracle yet`);
    }
  }
  if (
    a === null ||
    f === null ||
    sigma === null ||
    a.length !== n ||
    f.length !== n ||
    sigma.length !== n
  ) {
    throw new Error("LK checkpoint is missing one of the fields a, f, sigma");
  }
  const state: LKRunState = {
    dims: header.dims,
    tick: header.tick,
    simTimeSeconds: header.simTimeSeconds,
    rngSeed: header.rngSeed,
    noiseEpsilon: header.noiseEpsilon,
    domain: header.domain,
    center: header.center,
    tempC: header.tempC,
    sigmaInfinity: header.sigmaInfinity,
    dxUm: header.dxUm,
    pressurePa: header.pressurePa,
    paramSet: header.paramSet,
    cflFill: header.cflFill,
    relaxTol: header.relaxTol,
    divTol: header.divTol,
    relaxMaxSweeps: header.relaxMaxSweeps,
    surfacePolicy,
    farField: header.farField,
    a,
    f,
    sigma,
  };
  validateLKStateArrays(state, n);
  return { header, state };
}

export function decodeCheckpoint(bytes: Uint8Array): DecodedCheckpoint {
  if (bytes.length < 12) throw new Error("GG checkpoint is shorter than its fixed header");
  let magic = "";
  for (let i = 0; i < 8; i++) magic += String.fromCharCode(bytes[i]);
  if (magic !== CHECKPOINT_MAGIC) {
    throw new Error(`bad checkpoint magic: ${JSON.stringify(magic)}`);
  }
  const headerLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(8, true);
  if (headerLength > bytes.length - 12) {
    throw new Error("GG checkpoint header length exceeds the available bytes");
  }
  const parsedHeader = JSON.parse(
    new TextDecoder().decode(bytes.subarray(12, 12 + headerLength)),
  ) as unknown;
  requireGGRecord(parsedHeader, "header");
  const header = parsedHeader as CheckpointHeader;
  if (header.version !== 1) throw new Error(`unsupported checkpoint version ${header.version}`);
  if (header.endianness !== "LE") throw new Error("checkpoint must declare LE endianness");

  const { n, params } = validateGGMetadata(header);
  const metrics = validateGGMetrics(header.metrics, n, header.tick);
  if (!Array.isArray(header.fields)) {
    throw new Error("GG checkpoint fields must be an array");
  }
  const expectedFields: ReadonlyArray<readonly [string, string, number]> = [
    ["a", "u8", n],
    ["b", "f64", n],
    ["d", "f64", n],
  ];
  if (
    header.fields.length !== expectedFields.length ||
    header.fields.some((field, i) => {
      const descriptor = requireGGRecord(field, `fields[${i}]`);
      return (
        descriptor.name !== expectedFields[i][0] ||
        descriptor.dtype !== expectedFields[i][1] ||
        descriptor.length !== expectedFields[i][2]
      );
    })
  ) {
    throw new Error(
      "GG checkpoint field table must be exactly a:u8, b:f64, d:f64 at the full cell count",
    );
  }
  if (bytes.length !== 12 + headerLength + n + 16 * n) {
    throw new Error("GG checkpoint payload length does not match its header");
  }
  let offset = 12 + headerLength;
  const a = new Uint8Array(n);
  a.set(bytes.subarray(offset, offset + n));
  offset += n;
  const b = readF64(bytes, offset, n);
  offset += 8 * n;
  const d = readF64(bytes, offset, n);
  const state: SolverState = {
    dims: header.dims,
    tick: header.tick,
    rngSeed: header.rngSeed,
    noiseEpsilon: header.noiseEpsilon,
    farField: header.farField,
    domain: header.domain,
    params,
    a,
    b,
    d,
    center: header.center,
  };
  validateGGStateArrays(state, n, metrics);
  return { header, state };
}
