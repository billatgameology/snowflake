// Node-side tests for the pure parts of the worker message protocol (A2-3).

import { describe, expect, it } from "vitest";
import { GG_PRESETS, type Metrics } from "@vcc/core";
import {
  DEFAULT_INIT,
  PRESET_NAMES,
  buildSnapshot,
  presetRho,
  validateInitConfig,
  type SnapshotSource,
} from "../src/protocol.ts";

describe("validateInitConfig", () => {
  it("accepts the default config unchanged", () => {
    const config = validateInitConfig({ ...DEFAULT_INIT });
    expect(config).toEqual(DEFAULT_INIT);
  });

  it("accepts every preset name", () => {
    for (const preset of PRESET_NAMES) {
      expect(validateInitConfig({ ...DEFAULT_INIT, preset }).preset).toBe(preset);
    }
  });

  it("rejects unknown presets by name", () => {
    expect(() => validateInitConfig({ ...DEFAULT_INIT, preset: "fernlike" })).toThrow(/preset/);
  });

  it("rejects non-object and null input", () => {
    expect(() => validateInitConfig(null)).toThrow(/object/);
    expect(() => validateInitConfig("plate")).toThrow(/object/);
  });

  it("rejects bad dims (zero, negative, fractional, missing)", () => {
    for (const nx of [0, -4, 2.5, Number.NaN, undefined]) {
      expect(() =>
        validateInitConfig({ ...DEFAULT_INIT, dims: { nx, ny: 128, nz: 64 } }),
      ).toThrow(/dims\.nx/);
    }
  });

  it("rejects out-of-range seeds", () => {
    for (const seed of [-1, 1.5, 0x1_0000_0000, Number.NaN]) {
      expect(() => validateInitConfig({ ...DEFAULT_INIT, seed })).toThrow(/seed/);
    }
    expect(validateInitConfig({ ...DEFAULT_INIT, seed: 0xffff_ffff }).seed).toBe(0xffff_ffff);
  });

  it("rejects noiseEpsilon outside [0, 1]", () => {
    for (const noiseEpsilon of [-0.1, 1.1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => validateInitConfig({ ...DEFAULT_INIT, noiseEpsilon })).toThrow(/noiseEpsilon/);
    }
  });

  it("rejects unknown domain and farField values", () => {
    expect(() => validateInitConfig({ ...DEFAULT_INIT, domain: "sphere" })).toThrow(/domain/);
    expect(() => validateInitConfig({ ...DEFAULT_INIT, farField: "open" })).toThrow(/farField/);
  });

  it("returns a plain config, not a reference to the input", () => {
    const raw = { ...DEFAULT_INIT, dims: { nx: 32, ny: 32, nz: 16 } };
    const config = validateInitConfig(raw);
    expect(config.dims).not.toBe(raw.dims);
    expect(config.dims).toEqual(raw.dims);
  });
});

describe("presetRho", () => {
  it("matches the GG_PRESETS table for every preset", () => {
    for (const preset of PRESET_NAMES) {
      expect(presetRho(preset)).toBe(GG_PRESETS[preset].rho);
    }
  });
});

describe("buildSnapshot", () => {
  const metricsFixture: Metrics = {
    tick: 42,
    attachedCount: 19,
    totalMass: 100.5,
    symmetryError: 0,
    aspectRatio: 0.2,
    crossSectionHollowness: 0,
    sealedVoidFraction: 0,
    branchCount: 6,
    boundingRadius: 2,
    domainContact: false,
    farFieldVapor: 0.099,
    depletionCenter: 0.05,
    depletionRim: 0.08,
    depletionRatio: 0.625,
  };

  function source(): SnapshotSource {
    return {
      tick: 42,
      attachedCount: 19,
      boundarySize: 7,
      farFieldMean: 0.099,
      domainContact: false,
      running: true,
      stopReason: null,
      a: Uint8Array.from([0, 1, 0, 1]),
      b: Float64Array.from([0.5, 1.25, 0, 0.1]),
      d: Float64Array.from([0.1, 0, 0.099, 0]),
      attachTick: Uint32Array.from([0, 3, 0, 17]),
      metrics: metricsFixture,
    };
  }

  it("copies every array (fresh buffers, source untouched)", () => {
    const src = source();
    const { message } = buildSnapshot(src);
    expect(message.a).not.toBe(src.a);
    expect(message.attachTick).not.toBe(src.attachTick);
    expect(message.a.buffer).not.toBe(src.a.buffer);
    expect(Array.from(message.a)).toEqual(Array.from(src.a));
    expect(Array.from(message.attachTick)).toEqual(Array.from(src.attachTick));
    // Mutating the message copies must not touch the solver's live fields.
    message.a[0] = 9;
    message.attachTick[0] = 9;
    expect(src.a[0]).toBe(0);
    expect(src.attachTick[0]).toBe(0);
  });

  it("down-converts b and d to f32 display copies", () => {
    const src = source();
    const { message } = buildSnapshot(src);
    expect(message.b).toBeInstanceOf(Float32Array);
    expect(message.d).toBeInstanceOf(Float32Array);
    for (let n = 0; n < src.b.length; n++) {
      expect(message.b[n]).toBe(Math.fround(src.b[n]));
      expect(message.d[n]).toBe(Math.fround(src.d[n]));
    }
  });

  it("lists exactly the four fresh buffers as transferables", () => {
    const src = source();
    const { message, transfers } = buildSnapshot(src);
    expect(transfers).toHaveLength(4);
    expect(transfers).toContain(message.a.buffer);
    expect(transfers).toContain(message.b.buffer);
    expect(transfers).toContain(message.d.buffer);
    expect(transfers).toContain(message.attachTick.buffer);
    // Never the live solver buffers — transferring those would neuter the solver.
    expect(transfers).not.toContain(src.a.buffer);
    expect(transfers).not.toContain(src.b.buffer);
    expect(transfers).not.toContain(src.d.buffer);
    expect(transfers).not.toContain(src.attachTick.buffer);
  });

  it("carries the scalars through unchanged", () => {
    const { message } = buildSnapshot(source());
    expect(message.kind).toBe("snapshot");
    expect(message.tick).toBe(42);
    expect(message.attachedCount).toBe(19);
    expect(message.boundarySize).toBe(7);
    expect(message.farFieldMean).toBe(0.099);
    expect(message.domainContact).toBe(false);
    expect(message.running).toBe(true);
    expect(message.stopReason).toBeNull();
  });

  it("carries the standard core Metrics bundle through unchanged (A2-3)", () => {
    const { message } = buildSnapshot(source());
    expect(message.metrics).toEqual(metricsFixture);
  });
});
