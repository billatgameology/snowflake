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
import { kineticLength, mIce, vKin, type NucleationParamSet } from "./libbrecht.ts";
import type { Metrics } from "./metrics.ts";
import type { GGParams } from "./params.ts";
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
  readonly metrics: Metrics | null;
  readonly fields: FieldDescriptor[];
}

const LITTLE_ENDIAN_PLATFORM = new Uint8Array(new Uint16Array([0x0102]).buffer)[0] === 0x02;

function vectorToJson(v: Float64Array): (number | null)[] {
  return Array.from(v, (x) => (Number.isNaN(x) ? null : x));
}

function vectorFromJson(values: (number | null)[]): Float64Array {
  return Float64Array.from(values, (x) => (x === null ? Number.NaN : x));
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

export function encodeCheckpoint(state: SolverState, metrics: Metrics | null): Uint8Array {
  const n = cellCount(state.dims);
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
    metrics,
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

export interface LKCheckpointHeader {
  readonly version: 1;
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
  if (metadata.paramSet !== "CAK_A1" && metadata.paramSet !== "CAK") {
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
  if (metadata.farField !== "dirichlet" && metadata.farField !== "reflecting") {
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
    if (!Number.isFinite(state.sigma[i]) || state.sigma[i] < 0) {
      throw new Error(`LK checkpoint sigma[${i}] must be finite and nonnegative`);
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
  validateLKStateArrays(state, n);
  const header: LKCheckpointHeader = {
    version: 1,
    rule: "LibbrechtKinetics",
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
  requireRecord(parsedHeader, "header");
  const header = parsedHeader as LKCheckpointHeader;
  if (header.rule !== "LibbrechtKinetics") {
    throw new Error(`not a LibbrechtKinetics checkpoint (rule=${(header as { rule?: string }).rule})`);
  }
  if (header.endianness !== "LE") throw new Error("checkpoint must declare LE endianness");
  // Round-4/5 maker reviews: every wire-format and runtime control is validated, not trusted.
  // Round-5 probes showed version 2, missing relaxTol, invalid tolerances/sweep caps, and a
  // short f descriptor all decoding "successfully" (the last silently SHIFTED state). Round 6
  // corrected one overreach: reflecting LK checkpoints are valid diagnostic data; gate
  // acceptance, not the codec, enforces Dirichlet physics runs.
  if (header.version !== 1) {
    throw new Error(`unsupported LK checkpoint version ${header.version}`);
  }
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
    farField: header.farField,
    a,
    f,
    sigma,
  };
  validateLKStateArrays(state, n);
  return { header, state };
}

export function decodeCheckpoint(bytes: Uint8Array): DecodedCheckpoint {
  let magic = "";
  for (let i = 0; i < 8; i++) magic += String.fromCharCode(bytes[i]);
  if (magic !== CHECKPOINT_MAGIC) {
    throw new Error(`bad checkpoint magic: ${JSON.stringify(magic)}`);
  }
  const headerLength = new DataView(bytes.buffer, bytes.byteOffset).getUint32(8, true);
  const headerBytes = bytes.subarray(12, 12 + headerLength);
  const header = JSON.parse(new TextDecoder().decode(headerBytes)) as CheckpointHeader;
  if (header.version !== 1) throw new Error(`unsupported checkpoint version ${header.version}`);
  if (header.endianness !== "LE") throw new Error("checkpoint must declare LE endianness");

  const n = cellCount(header.dims);
  let offset = 12 + headerLength;
  let a: Uint8Array | null = null;
  let b: Float64Array | null = null;
  let d: Float64Array | null = null;
  for (const field of header.fields) {
    if (field.dtype === "u8") {
      const view = bytes.subarray(offset, offset + field.length);
      const copy = new Uint8Array(field.length);
      copy.set(view);
      if (field.name === "a") a = copy;
      offset += field.length;
    } else if (field.dtype === "f64") {
      const values = readF64(bytes, offset, field.length);
      if (field.name === "b") b = values;
      if (field.name === "d") d = values;
      offset += field.length * 8;
    } else {
      throw new Error(`dtype ${field.dtype} not readable by the CPU oracle yet`);
    }
  }
  if (a === null || b === null || d === null) {
    throw new Error("checkpoint is missing one of the fields a, b, d");
  }
  if (a.length !== n || b.length !== n || d.length !== n) {
    throw new Error("checkpoint field lengths do not match dims");
  }

  const params: GGParams = {
    rho: header.params.rho,
    phi: header.params.phi,
    kappa: vectorFromJson(header.params.kappa),
    mu: vectorFromJson(header.params.mu),
    ggThreshBeta: vectorFromJson(header.params.ggThreshBeta),
  };
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
  return { header, state };
}
