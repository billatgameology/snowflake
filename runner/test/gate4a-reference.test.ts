import { describe, expect, it } from "vitest";
import { GG_PRESETS, STREAM_NOISE_XI, randomBit, type Dims } from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";
import {
  decodeGGNoiseWitness,
  encodeGGNoiseWitness,
  evaluateGGNoiseWitness,
  independentGGDiffusion,
  type GGNoiseWitness,
} from "../src/gate4a-reference.ts";
import { rawTypedArraySha256 } from "../src/gate4-evidence.ts";

function solverWitness(): { readonly solver: GGSolver; readonly witness: GGNoiseWitness } {
  const solver = new GGSolver({
    dims: { nx: 12, ny: 12, nz: 10 },
    params: GG_PRESETS.hollowColumn,
    rngSeed: 1,
    noiseEpsilon: 0.001,
    domain: "hexPrism",
    farField: "reflecting",
    seedRadius: 2,
    seedThickness: 1,
  });
  const witness: GGNoiseWitness = {
    version: 1,
    dims: solver.dims,
    tick: solver.tick,
    rngSeed: solver.rngSeed,
    noiseEpsilon: solver.noiseEpsilon,
    streamId: STREAM_NOISE_XI,
    phi: solver.params.phi,
    a: solver.a.slice(),
    wall: solver.wall.slice(),
    preD: solver.d.slice(),
    postD: new Float64Array(solver.d.length),
  };
  solver.relaxField();
  witness.postD.set(solver.d);
  return { solver, witness };
}

describe("independent G-G diffusion/refusal witness", () => {
  it("reproduces the real noise-on post-relaxation field bit for bit", () => {
    const { witness } = solverWitness();
    const reference = independentGGDiffusion({ ...witness, d: witness.preD });
    expect(rawTypedArraySha256(reference.d)).toBe(rawTypedArraySha256(witness.postD));
    const verdict = evaluateGGNoiseWitness(witness);
    expect(verdict.passed).toBe(true);
    expect(verdict.positiveInputZeroOutcomes).toBeGreaterThan(0);
    expect(verdict.positiveInputOneOutcomes).toBeGreaterThan(0);
    expect(verdict.hashes.referenceD).toBe(verdict.hashes.postD);
    expect(verdict.hashes.zeroNoiseD).not.toBe(verdict.hashes.postD);
  });

  it("strict binary encode/decode preserves every raw witness field", () => {
    const { witness } = solverWitness();
    const bytes = encodeGGNoiseWitness(witness);
    const decoded = decodeGGNoiseWitness(bytes);
    expect(decoded).toMatchObject({
      version: 1,
      dims: witness.dims,
      tick: witness.tick,
      rngSeed: witness.rngSeed,
      noiseEpsilon: witness.noiseEpsilon,
      streamId: STREAM_NOISE_XI,
      phi: witness.phi,
    });
    for (const field of ["a", "wall", "preD", "postD"] as const) {
      expect(rawTypedArraySha256(decoded[field])).toBe(rawTypedArraySha256(witness[field]));
    }
    expect(encodeGGNoiseWitness(decoded)).toEqual(bytes);
    expect(evaluateGGNoiseWitness(decoded).passed).toBe(true);
  });

  it("rejects an in-memory witness version shift instead of normalizing it to v1", () => {
    const { witness } = solverWitness();
    const shifted = { ...witness, version: 2 } as unknown as GGNoiseWitness;
    expect(() => encodeGGNoiseWitness(shifted)).toThrow(/version must be 1/);
    expect(() => evaluateGGNoiseWitness(shifted)).toThrow(/version must be 1/);
  });

  it("rejects wrong stream provenance and a zero-noise counterfactual output", () => {
    const { witness } = solverWitness();
    expect(evaluateGGNoiseWitness({ ...witness, streamId: STREAM_NOISE_XI + 1 }).passed).toBe(false);
    const zeroNoise = independentGGDiffusion({
      ...witness,
      d: witness.preD,
      noiseEpsilon: 0,
    });
    const counterfeited = { ...witness, postD: zeroNoise.d };
    const verdict = evaluateGGNoiseWitness(counterfeited);
    expect(verdict.passed).toBe(false);
    expect(verdict.differsFromZeroNoiseCounterfactual).toBe(false);
  });

  it("rejects a positive-input fixture with only one PRNG outcome", () => {
    const dims: Dims = { nx: 4, ny: 4, nz: 4 };
    const n = dims.nx * dims.ny * dims.nz;
    const preD = new Float64Array(n);
    const index = Array.from({ length: n }, (_, candidate) => candidate).find(
      (candidate) => randomBit(1, candidate, 0, STREAM_NOISE_XI) === 0,
    );
    if (index === undefined) throw new Error("fixture could not find a zero outcome");
    preD[index] = 0.1;
    const base = {
      version: 1 as const,
      dims,
      tick: 0,
      rngSeed: 1,
      noiseEpsilon: 0.001,
      streamId: STREAM_NOISE_XI,
      phi: 0,
      a: new Uint8Array(n),
      wall: new Uint8Array(n),
      preD,
    };
    const postD = independentGGDiffusion({ ...base, d: preD }).d;
    const verdict = evaluateGGNoiseWitness({ ...base, postD });
    expect(verdict.positiveInputZeroOutcomes).toBe(1);
    expect(verdict.positiveInputOneOutcomes).toBe(0);
    expect(verdict.passed).toBe(false);
  });

  it("rejects payload bit corruption and shifted header bytes", () => {
    const { witness } = solverWitness();
    const payloadCorrupt = encodeGGNoiseWitness(witness).slice();
    payloadCorrupt[payloadCorrupt.length - 1] ^= 1;
    const decoded = decodeGGNoiseWitness(payloadCorrupt);
    expect(evaluateGGNoiseWitness(decoded).passed).toBe(false);

    const headerCorrupt = encodeGGNoiseWitness(witness).slice();
    headerCorrupt[0] ^= 1;
    expect(() => decodeGGNoiseWitness(headerCorrupt)).toThrow(/magic/);
  });
});
