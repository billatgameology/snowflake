import { describe, expect, it } from "vitest";
import {
  cellCount,
  computeMetrics,
  decodeCheckpoint,
  domainCenter,
  encodeCheckpoint,
  hashCounter,
  CHECKPOINT_MAGIC,
  GG_PRESETS,
  type Dims,
  type SolverState,
} from "@vcc/core";

function syntheticState(): SolverState {
  const dims: Dims = { nx: 7, ny: 6, nz: 5 };
  const n = cellCount(dims);
  const a = new Uint8Array(n);
  const b = new Float64Array(n);
  const d = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    a[i] = hashCounter(1, i, 0, 10) & 1;
    b[i] = hashCounter(1, i, 0, 11) / 2 ** 32;
    d[i] = hashCounter(1, i, 0, 12) / 2 ** 32;
  }
  return {
    dims,
    tick: 1234,
    rngSeed: 42,
    noiseEpsilon: 1e-5,
    farField: "reflecting",
    domain: "hexPrism",
    params: GG_PRESETS.hollowColumn,
    a,
    b,
    d,
    center: domainCenter(dims),
  };
}

describe("checkpoint round-trip (synthetic state; re-verified on a grown crystal by runner)", () => {
  it("preserves every field bit-exactly and every header value", () => {
    const state = syntheticState();
    const metrics = computeMetrics(
      state.a,
      state.b,
      state.d,
      state.dims,
      state.center,
      state.tick,
    );
    const bytes = encodeCheckpoint(state, metrics);

    // Magic + declared endianness
    expect(new TextDecoder().decode(bytes.subarray(0, 8))).toBe(CHECKPOINT_MAGIC);

    const decoded = decodeCheckpoint(bytes);
    expect(decoded.header.endianness).toBe("LE");
    expect(decoded.header.dims).toEqual(state.dims);
    expect(decoded.header.tick).toBe(1234);
    expect(decoded.header.rngSeed).toBe(42);
    expect(decoded.header.noiseEpsilon).toBe(1e-5);
    expect(decoded.header.farField).toBe("reflecting");
    expect(decoded.header.domain).toBe("hexPrism");
    expect(decoded.header.fields.map((f) => f.dtype)).toEqual(["u8", "f64", "f64"]);
    expect(decoded.header.metrics?.totalMass).toBe(metrics.totalMass);

    expect(Array.from(decoded.state.a)).toEqual(Array.from(state.a));
    expect(Array.from(decoded.state.b)).toEqual(Array.from(state.b));
    expect(Array.from(decoded.state.d)).toEqual(Array.from(state.d));

    // Params survive, including the NaN-poisoned slot 0 (JSON null <-> NaN mapping).
    expect(Number.isNaN(decoded.state.params.ggThreshBeta[0])).toBe(true);
    expect(Array.from(decoded.state.params.ggThreshBeta.subarray(1))).toEqual(
      Array.from(state.params.ggThreshBeta.subarray(1)),
    );
    expect(Array.from(decoded.state.params.kappa.subarray(1))).toEqual(
      Array.from(state.params.kappa.subarray(1)),
    );
    expect(decoded.state.params.rho).toBe(state.params.rho);
  });

  it("rejects corrupted magic", () => {
    const bytes = encodeCheckpoint(syntheticState(), null);
    bytes[0] = 88;
    expect(() => decodeCheckpoint(bytes)).toThrow(/magic/);
  });
});
