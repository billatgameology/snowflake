import {
  decodeLKCheckpoint,
  encodeLKCheckpoint,
  type LKRunState,
} from "@vcc/core";
import { describe, expect, it } from "vitest";
import {
  encodeGpuLkConversionSnapshot,
  gpuLkSnapshotFromDecodedCheckpoint,
  gpuLkSnapshotToCpuRunState,
} from "../src/lk-conversion.ts";

function state(): LKRunState {
  return {
    dims: { nx: 3, ny: 3, nz: 3 },
    tick: 7,
    simTimeSeconds: 1.25,
    rngSeed: 42,
    noiseEpsilon: 0.01,
    domain: "box",
    center: [1, 1, 1],
    tempC: -15,
    sigmaInfinity: 0.002,
    dxUm: 0.35,
    pressurePa: 101_325,
    paramSet: "CAK_A1",
    cflFill: 0.1,
    relaxTol: 1e-9,
    divTol: 1e-7,
    relaxMaxSweeps: 1000,
    surfacePolicy: "aggregate-hv-g1h1-v5",
    farField: "dirichlet",
    a: new Uint8Array(27),
    f: new Float64Array(27),
    sigma: new Float64Array(27).fill(0.002),
  };
}

describe("GPU LK checkpoint conversion artifacts", () => {
  it("rounds once to f32, widens exactly, and preserves every f32 bit through v2", () => {
    const input = state();
    input.a[13] = 1;
    input.f[13] = 1;
    input.sigma[13] = 0;
    input.f[12] = 0.123_456_789_123;
    input.sigma[12] = -(2 ** -149);
    const decoded = decodeLKCheckpoint(encodeLKCheckpoint(input));
    const snapshot = gpuLkSnapshotFromDecodedCheckpoint(decoded);
    expect(snapshot.fill[12]).toBe(Math.fround(input.f[12]));
    expect(snapshot.sigma[12]).toBe(-(2 ** -149));
    expect(snapshot.occupancy[13]).toBe(1);

    const widened = gpuLkSnapshotToCpuRunState(snapshot);
    expect(widened.f[12]).toBe(snapshot.fill[12]);
    expect(widened.sigma[12]).toBe(snapshot.sigma[12]);
    const replay = gpuLkSnapshotFromDecodedCheckpoint(
      decodeLKCheckpoint(encodeGpuLkConversionSnapshot(snapshot)),
    );
    expect(new Uint32Array(replay.fill.buffer)).toEqual(
      new Uint32Array(snapshot.fill.buffer),
    );
    expect(new Uint32Array(replay.sigma.buffer)).toEqual(
      new Uint32Array(snapshot.sigma.buffer),
    );
    expect(replay.occupancy).toEqual(snapshot.occupancy);
  });

  it("rejects legacy/v4 policy and header-state disagreement", () => {
    const decoded = decodeLKCheckpoint(encodeLKCheckpoint(state()));
    const legacy = structuredClone(decoded);
    Object.defineProperty(legacy.header, "version", { value: 1 });
    expect(() => gpuLkSnapshotFromDecodedCheckpoint(legacy)).toThrow(/v2/);

    const v4 = structuredClone(decoded);
    Object.defineProperty(v4.header, "surfacePolicy", {
      value: "aggregate-hv-g1h1-v4",
    });
    Object.defineProperty(v4.state, "surfacePolicy", {
      value: "aggregate-hv-g1h1-v4",
    });
    expect(() => gpuLkSnapshotFromDecodedCheckpoint(v4)).toThrow(/only aggregate/);

    const mismatch = structuredClone(decoded);
    Object.defineProperty(mismatch.header, "tick", { value: 8 });
    expect(() => gpuLkSnapshotFromDecodedCheckpoint(mismatch)).toThrow(/mismatch for tick/);
  });

  it("rejects invalid exported field meanings through the core encoder", () => {
    const snapshot = gpuLkSnapshotFromDecodedCheckpoint(
      decodeLKCheckpoint(encodeLKCheckpoint(state())),
    );
    snapshot.occupancy[0] = 2;
    expect(() => gpuLkSnapshotToCpuRunState(snapshot)).toThrow(/binary/);
    snapshot.occupancy[0] = 1;
    expect(() => gpuLkSnapshotToCpuRunState(snapshot)).toThrow(/f=1 and sigma=0/);
  });
});
