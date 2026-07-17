// Independent Pass-A witnesses for G-G diffusion noise.
//
// This is intentionally not a second GGSolver. It implements only the published masked
// diffusion/refusal equation from docs/gg-machinery.md §4(i), §6 over raw arrays, and has no
// freezing, attachment, melting, boundary list, or solver state. Gate4a snapshots the raw
// pre-relaxation state and demands bit identity with this reference.

import { randomBit, STREAM_NOISE_XI, type Dims } from "@vcc/core";
import {
  canonicalJsonBytes,
  parseCanonicalJson,
  rawTypedArraySha256,
  type StrictJson,
} from "./gate4-evidence.ts";

export interface GGDiffusionReferenceInput {
  readonly dims: Dims;
  readonly a: Uint8Array;
  readonly wall: Uint8Array;
  readonly d: Float64Array;
  readonly phi: number;
  readonly noiseEpsilon: number;
  readonly rngSeed: number;
  readonly tick: number;
  readonly streamId: number;
}

export interface GGDiffusionReferenceResult {
  readonly d: Float64Array;
  readonly positiveInputZeroOutcomes: number;
  readonly positiveInputOneOutcomes: number;
}

function requireReferenceInput(input: GGDiffusionReferenceInput): number {
  const { nx, ny, nz } = input.dims;
  if (![nx, ny, nz].every((value) => Number.isSafeInteger(value) && value > 0)) {
    throw new Error("reference dimensions must be positive safe integers");
  }
  const n = nx * ny * nz;
  if (!Number.isSafeInteger(n) || n <= 0) throw new Error("reference cell count is invalid");
  if (
    !(input.a instanceof Uint8Array) ||
    !(input.wall instanceof Uint8Array) ||
    !(input.d instanceof Float64Array) ||
    input.a.length !== n ||
    input.wall.length !== n ||
    input.d.length !== n
  ) {
    throw new Error("reference field lengths or types are invalid");
  }
  if (!Number.isFinite(input.phi) || input.phi < 0 || input.phi > 1) {
    throw new Error("reference phi must be finite in [0,1]");
  }
  if (!Number.isFinite(input.noiseEpsilon) || input.noiseEpsilon < 0 || input.noiseEpsilon > 1) {
    throw new Error("reference noise amplitude must be finite in [0,1]");
  }
  if (
    !Number.isSafeInteger(input.rngSeed) ||
    input.rngSeed < 0 ||
    input.rngSeed > 0xffff_ffff ||
    !Number.isSafeInteger(input.tick) ||
    input.tick < 0 ||
    !Number.isSafeInteger(input.streamId) ||
    input.streamId < 0
  ) {
    throw new Error("reference PRNG coordinates are invalid");
  }
  for (let index = 0; index < n; index++) {
    if ((input.a[index] !== 0 && input.a[index] !== 1) ||
        (input.wall[index] !== 0 && input.wall[index] !== 1)) {
      throw new Error(`reference mask is nonbinary at ${index}`);
    }
    if (!Number.isFinite(input.d[index]) || input.d[index] < 0) {
      throw new Error(`reference vapor is invalid at ${index}`);
    }
    if ((input.a[index] === 1 || input.wall[index] === 1) && input.d[index] !== 0) {
      throw new Error(`reference blocked vapor must be zero at ${index}`);
    }
  }
  return n;
}

function sortedPairSum(own: number, p1: number, p2: number, p3: number): number {
  let lo: number;
  let mid: number;
  let hi: number;
  if (p1 <= p2) {
    if (p2 <= p3) {
      lo = p1; mid = p2; hi = p3;
    } else if (p1 <= p3) {
      lo = p1; mid = p3; hi = p2;
    } else {
      lo = p3; mid = p1; hi = p2;
    }
  } else if (p1 <= p3) {
    lo = p2; mid = p1; hi = p3;
  } else if (p2 <= p3) {
    lo = p2; mid = p3; hi = p1;
  } else {
    lo = p3; mid = p2; hi = p1;
  }
  return (((own + lo) + mid) + hi) / 7;
}

/** Independent raw diffusion/refusal computation, including canonical D6h summation order. */
export function independentGGDiffusion(
  input: GGDiffusionReferenceInput,
): GGDiffusionReferenceResult {
  const n = requireReferenceInput(input);
  const { nx, ny, nz } = input.dims;
  const plane = nx * ny;
  const blocked = new Uint8Array(n);
  const xi = new Float64Array(n);
  const noised = new Float64Array(n);
  let positiveInputZeroOutcomes = 0;
  let positiveInputOneOutcomes = 0;
  for (let index = 0; index < n; index++) {
    blocked[index] = input.a[index] | input.wall[index];
    const bit = randomBit(input.rngSeed, index, input.tick, input.streamId);
    xi[index] = input.noiseEpsilon * bit;
    noised[index] = (1 - xi[index]) * input.d[index];
    if (blocked[index] === 0 && input.d[index] > 0) {
      if (bit === 0) positiveInputZeroOutcomes++;
      else positiveInputOneOutcomes++;
    }
  }
  const source = input.noiseEpsilon > 0 ? noised : input.d;
  const planar = new Float64Array(n);
  const vertical = new Float64Array(n);

  for (let k = 0; k < nz; k++) {
    const kBase = k * plane;
    for (let j = 0; j < ny; j++) {
      const row = kBase + j * nx;
      const interiorJ = j >= 1 && j <= ny - 2;
      for (let i = 0; i < nx; i++) {
        const index = row + i;
        if (blocked[index] === 1) continue;
        const own = source[index];
        let east: number;
        let west: number;
        let ne: number;
        let sw: number;
        let se: number;
        let nw: number;
        if (interiorJ && i >= 1 && i <= nx - 2) {
          east = blocked[index + 1] === 1 ? own : source[index + 1];
          west = blocked[index - 1] === 1 ? own : source[index - 1];
          ne = blocked[index + nx] === 1 ? own : source[index + nx];
          sw = blocked[index - nx] === 1 ? own : source[index - nx];
          se = blocked[index + 1 - nx] === 1 ? own : source[index + 1 - nx];
          nw = blocked[index - 1 + nx] === 1 ? own : source[index - 1 + nx];
        } else {
          east = i + 1 < nx && blocked[index + 1] === 0 ? source[index + 1] : own;
          west = i > 0 && blocked[index - 1] === 0 ? source[index - 1] : own;
          ne = j + 1 < ny && blocked[index + nx] === 0 ? source[index + nx] : own;
          sw = j > 0 && blocked[index - nx] === 0 ? source[index - nx] : own;
          se = i + 1 < nx && j > 0 && blocked[index + 1 - nx] === 0
            ? source[index + 1 - nx]
            : own;
          nw = i > 0 && j + 1 < ny && blocked[index - 1 + nx] === 0
            ? source[index - 1 + nx]
            : own;
        }
        planar[index] = sortedPairSum(
          own,
          east + west,
          ne + sw,
          se + nw,
        );
      }
    }
  }

  for (let k = 0; k < nz; k++) {
    const kBase = k * plane;
    for (let p = 0; p < plane; p++) {
      const index = kBase + p;
      if (blocked[index] === 1) continue;
      const own = planar[index];
      const up = k + 1 < nz && blocked[index + plane] === 0 ? planar[index + plane] : own;
      const down = k > 0 && blocked[index - plane] === 0 ? planar[index - plane] : own;
      vertical[index] = (4 / 7) * own + (3 / 14) * (up + down);
    }
  }

  let result = vertical;
  if (input.phi > 0) {
    const drifted = new Float64Array(n);
    for (let k = 0; k < nz; k++) {
      const kBase = k * plane;
      for (let p = 0; p < plane; p++) {
        const index = kBase + p;
        if (blocked[index] === 1) continue;
        const freeBelow = k > 0 && blocked[index - plane] === 0 ? 1 : 0;
        const freeAbove = k + 1 < nz && blocked[index + plane] === 0 ? 1 : 0;
        const inflow = freeAbove === 1 ? input.phi * vertical[index + plane] : 0;
        drifted[index] = (1 - input.phi * freeBelow) * vertical[index] + inflow;
      }
    }
    result = drifted;
  }

  const output = new Float64Array(n);
  for (let index = 0; index < n; index++) {
    output[index] = blocked[index] === 1
      ? 0
      : result[index] + (input.noiseEpsilon > 0 ? xi[index] * input.d[index] : 0);
  }
  return { d: output, positiveInputZeroOutcomes, positiveInputOneOutcomes };
}

export interface GGNoiseWitness {
  readonly version: 1;
  readonly dims: Dims;
  readonly tick: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly streamId: number;
  readonly phi: number;
  readonly a: Uint8Array;
  readonly wall: Uint8Array;
  readonly preD: Float64Array;
  readonly postD: Float64Array;
}

export interface GGNoiseWitnessVerdict {
  readonly passed: boolean;
  readonly actualMatchesNoisedReference: boolean;
  readonly differsFromZeroNoiseCounterfactual: boolean;
  readonly positiveInputZeroOutcomes: number;
  readonly positiveInputOneOutcomes: number;
  readonly streamMatches: boolean;
  readonly hashes: {
    readonly a: string;
    readonly wall: string;
    readonly preD: string;
    readonly postD: string;
    readonly referenceD: string;
    readonly zeroNoiseD: string;
  };
}

function equalFloatBits(left: Float64Array, right: Float64Array): boolean {
  if (left.length !== right.length) return false;
  return rawTypedArraySha256(left) === rawTypedArraySha256(right);
}

function requireNoiseWitness(witness: GGNoiseWitness): void {
  if (witness.version !== 1) throw new Error("noise witness version must be 1");
  requireReferenceInput({ ...witness, d: witness.preD });
  if (!(witness.postD instanceof Float64Array) || witness.postD.length !== witness.preD.length) {
    throw new Error("noise witness postD has the wrong type or length");
  }
  for (let index = 0; index < witness.postD.length; index++) {
    if (!Number.isFinite(witness.postD[index]) || witness.postD[index] < 0) {
      throw new Error(`noise witness postD is invalid at ${index}`);
    }
  }
}

export function evaluateGGNoiseWitness(
  witness: GGNoiseWitness,
  expectedStreamId = STREAM_NOISE_XI,
): GGNoiseWitnessVerdict {
  requireNoiseWitness(witness);
  const reference = independentGGDiffusion({
    ...witness,
    d: witness.preD,
  });
  const zeroNoise = independentGGDiffusion({
    ...witness,
    d: witness.preD,
    noiseEpsilon: 0,
  });
  const actualMatchesNoisedReference = equalFloatBits(witness.postD, reference.d);
  const differsFromZeroNoiseCounterfactual = !equalFloatBits(witness.postD, zeroNoise.d);
  const streamMatches = witness.streamId === expectedStreamId;
  const positiveInputZeroOutcomes = reference.positiveInputZeroOutcomes;
  const positiveInputOneOutcomes = reference.positiveInputOneOutcomes;
  return {
    passed:
      streamMatches &&
      witness.noiseEpsilon > 0 &&
      actualMatchesNoisedReference &&
      differsFromZeroNoiseCounterfactual &&
      positiveInputZeroOutcomes > 0 &&
      positiveInputOneOutcomes > 0,
    actualMatchesNoisedReference,
    differsFromZeroNoiseCounterfactual,
    positiveInputZeroOutcomes,
    positiveInputOneOutcomes,
    streamMatches,
    hashes: {
      a: rawTypedArraySha256(witness.a),
      wall: rawTypedArraySha256(witness.wall),
      preD: rawTypedArraySha256(witness.preD),
      postD: rawTypedArraySha256(witness.postD),
      referenceD: rawTypedArraySha256(reference.d),
      zeroNoiseD: rawTypedArraySha256(zeroNoise.d),
    },
  };
}

const NOISE_WITNESS_MAGIC = "VCCG4N01";
const encoder = new TextEncoder();

function writeF64(target: Uint8Array, offset: number, values: Float64Array): number {
  const view = new DataView(target.buffer, target.byteOffset, target.byteLength);
  for (let index = 0; index < values.length; index++) {
    view.setFloat64(offset + index * 8, values[index], true);
  }
  return offset + values.length * 8;
}

function readF64(source: Uint8Array, offset: number, length: number): Float64Array {
  const view = new DataView(source.buffer, source.byteOffset, source.byteLength);
  const values = new Float64Array(length);
  for (let index = 0; index < length; index++) values[index] = view.getFloat64(offset + index * 8, true);
  return values;
}

/** Strict binary witness: canonical header, then a/wall/preD/postD raw fields. */
export function encodeGGNoiseWitness(witness: GGNoiseWitness): Uint8Array {
  requireNoiseWitness(witness);
  const n = witness.preD.length;
  const header = {
    version: 1,
    dims: witness.dims,
    tick: witness.tick,
    rngSeed: witness.rngSeed,
    noiseEpsilon: witness.noiseEpsilon,
    streamId: witness.streamId,
    phi: witness.phi,
    fields: [
      { name: "a", dtype: "u8", length: n },
      { name: "wall", dtype: "u8", length: n },
      { name: "preD", dtype: "f64", length: n },
      { name: "postD", dtype: "f64", length: n },
    ],
  };
  const headerBytes = canonicalJsonBytes(header);
  const output = new Uint8Array(12 + headerBytes.length + 2 * n + 16 * n);
  output.set(encoder.encode(NOISE_WITNESS_MAGIC), 0);
  new DataView(output.buffer).setUint32(8, headerBytes.length, true);
  output.set(headerBytes, 12);
  let offset = 12 + headerBytes.length;
  output.set(witness.a, offset);
  offset += n;
  output.set(witness.wall, offset);
  offset += n;
  offset = writeF64(output, offset, witness.preD);
  writeF64(output, offset, witness.postD);
  return output;
}

function objectJson(value: StrictJson, label: string): { readonly [key: string]: StrictJson } {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as { readonly [key: string]: StrictJson };
}

function integerField(record: { readonly [key: string]: StrictJson }, name: string, minimum = 0): number {
  const value = record[name];
  if (!Number.isSafeInteger(value) || (value as number) < minimum) {
    throw new Error(`noise witness ${name} is invalid`);
  }
  return value as number;
}

export function decodeGGNoiseWitness(bytes: Uint8Array): GGNoiseWitness {
  if (!(bytes instanceof Uint8Array) || bytes.length < 12) throw new Error("noise witness is truncated");
  if (new TextDecoder().decode(bytes.subarray(0, 8)) !== NOISE_WITNESS_MAGIC) {
    throw new Error("noise witness magic is invalid");
  }
  const headerLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(8, true);
  if (headerLength <= 0 || 12 + headerLength > bytes.length) throw new Error("noise witness header length is invalid");
  const header = objectJson(
    parseCanonicalJson(bytes.subarray(12, 12 + headerLength), "noise witness header"),
    "noise witness header",
  );
  const keys = Object.keys(header).sort();
  const expectedKeys = ["dims", "fields", "noiseEpsilon", "phi", "rngSeed", "streamId", "tick", "version"].sort();
  if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])) {
    throw new Error("noise witness header keys are invalid");
  }
  if (header.version !== 1) throw new Error("noise witness version is invalid");
  const dimsRecord = objectJson(header.dims, "noise witness dims");
  if (Object.keys(dimsRecord).sort().join(",") !== "nx,ny,nz") throw new Error("noise witness dims keys are invalid");
  const dims: Dims = {
    nx: integerField(dimsRecord, "nx", 1),
    ny: integerField(dimsRecord, "ny", 1),
    nz: integerField(dimsRecord, "nz", 1),
  };
  const n = dims.nx * dims.ny * dims.nz;
  const expectedFields = [
    { dtype: "u8", length: n, name: "a" },
    { dtype: "u8", length: n, name: "wall" },
    { dtype: "f64", length: n, name: "preD" },
    { dtype: "f64", length: n, name: "postD" },
  ];
  if (JSON.stringify(header.fields) !== JSON.stringify(expectedFields)) {
    throw new Error("noise witness field table is invalid");
  }
  const expectedLength = 12 + headerLength + 2 * n + 16 * n;
  if (bytes.length !== expectedLength) throw new Error("noise witness payload length is invalid");
  let offset = 12 + headerLength;
  const a = bytes.slice(offset, offset + n);
  offset += n;
  const wall = bytes.slice(offset, offset + n);
  offset += n;
  const preD = readF64(bytes, offset, n);
  offset += 8 * n;
  const postD = readF64(bytes, offset, n);
  const noiseEpsilon = header.noiseEpsilon;
  const phi = header.phi;
  if (typeof noiseEpsilon !== "number" || typeof phi !== "number") {
    throw new Error("noise witness floating controls are invalid");
  }
  const witness: GGNoiseWitness = {
    version: 1,
    dims,
    tick: integerField(header, "tick"),
    rngSeed: integerField(header, "rngSeed"),
    noiseEpsilon,
    streamId: integerField(header, "streamId"),
    phi,
    a,
    wall,
    preD,
    postD,
  };
  requireReferenceInput({ ...witness, d: witness.preD });
  for (let index = 0; index < postD.length; index++) {
    if (!Number.isFinite(postD[index]) || postD[index] < 0) {
      throw new Error(`noise witness postD is invalid at ${index}`);
    }
  }
  return witness;
}
