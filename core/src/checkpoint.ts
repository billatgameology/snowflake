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

import { cellCount, type Dims } from "./lattice.ts";
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
