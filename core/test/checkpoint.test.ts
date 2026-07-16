import { describe, expect, it } from "vitest";
import {
  cellCount,
  computeMetrics,
  decodeCheckpoint,
  decodeLKCheckpoint,
  domainCenter,
  encodeCheckpoint,
  encodeLKCheckpoint,
  hashCounter,
  hexDistance,
  CHECKPOINT_MAGIC,
  GG_PRESETS,
  type Dims,
  type LKRunState,
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

// ── LibbrechtKinetics checkpoints (round-5 maker review: no LK tests existed, and mutation
// probes showed the decoder accepting version 2, missing relaxTol, malformed controls, and a
// short f descriptor — the last returning a silently SHIFTED state). Round 6 also pins that a
// valid reflecting diagnostic round-trips while gate acceptance remains Dirichlet-only. ─────

function syntheticLKState(): LKRunState {
  const dims: Dims = { nx: 5, ny: 4, nz: 3 };
  const n = cellCount(dims);
  const a = new Uint8Array(n);
  const f = new Float64Array(n);
  const sigma = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const k = Math.floor(i / (dims.nx * dims.ny));
    const inPlane = i - k * dims.nx * dims.ny;
    const j = Math.floor(inPlane / dims.nx);
    const x = inPlane - j * dims.nx;
    const [ic, jc, kc] = domainCenter(dims);
    const radius = Math.min(ic, dims.nx - 1 - ic, jc, dims.ny - 1 - jc);
    const halfZ = Math.min(kc, dims.nz - 1 - kc);
    if (hexDistance(x - ic, j - jc) > radius || Math.abs(k - kc) > halfZ) continue;
    a[i] = hashCounter(2, i, 0, 20) & 1;
    f[i] = a[i] === 1 ? 1 : hashCounter(2, i, 0, 21) / 2 ** 32;
    sigma[i] = a[i] === 1 ? 0 : hashCounter(2, i, 0, 22) / 2 ** 33;
  }
  return {
    dims,
    tick: 77,
    simTimeSeconds: 1.25,
    rngSeed: 9,
    noiseEpsilon: 0,
    domain: "hexPrism",
    center: domainCenter(dims),
    tempC: -15,
    sigmaInfinity: 0.002,
    dxUm: 0.35,
    pressurePa: 101325,
    paramSet: "CAK_A1",
    cflFill: 0.1,
    relaxTol: 1e-9,
    divTol: 1e-7,
    relaxMaxSweeps: 200_000,
    farField: "dirichlet",
    a,
    f,
    sigma,
  };
}

/** Re-encode the same payload under a mutated header — the round-5 probe, as a fixture. */
function mutateLKHeader(
  bytes: Uint8Array,
  mutate: (header: Record<string, unknown>) => void,
): Uint8Array {
  const headerLength = new DataView(bytes.buffer, bytes.byteOffset).getUint32(8, true);
  const header = JSON.parse(
    new TextDecoder().decode(bytes.subarray(12, 12 + headerLength)),
  ) as Record<string, unknown>;
  mutate(header);
  const newHeader = new TextEncoder().encode(JSON.stringify(header));
  const out = new Uint8Array(12 + newHeader.length + (bytes.length - 12 - headerLength));
  out.set(bytes.subarray(0, 8), 0);
  new DataView(out.buffer).setUint32(8, newHeader.length, true);
  out.set(newHeader, 12);
  out.set(bytes.subarray(12 + headerLength), 12 + newHeader.length);
  return out;
}

describe("LK checkpoint round-trip and evidence-strict decode (round-5 review)", () => {
  it("preserves every field bit-exactly and every header CONTROL", () => {
    const state = syntheticLKState();
    const bytes = encodeLKCheckpoint(state);
    const decoded = decodeLKCheckpoint(bytes);
    expect(decoded.header.version).toBe(1);
    expect(decoded.header.rule).toBe("LibbrechtKinetics");
    expect(decoded.header.endianness).toBe("LE");
    expect(decoded.header.dims).toEqual(state.dims);
    expect(decoded.header.tick).toBe(77);
    expect(decoded.header.simTimeSeconds).toBe(1.25);
    expect(decoded.header.rngSeed).toBe(9);
    expect(decoded.header.noiseEpsilon).toBe(0);
    expect(decoded.header.domain).toBe("hexPrism");
    expect(decoded.header.center).toEqual(state.center);
    expect(decoded.header.tempC).toBe(-15);
    expect(decoded.header.sigmaInfinity).toBe(0.002);
    expect(decoded.header.dxUm).toBe(0.35);
    expect(decoded.header.pressurePa).toBe(101325);
    expect(decoded.header.paramSet).toBe("CAK_A1");
    expect(decoded.header.cflFill).toBe(0.1);
    // The dual-criterion controls — the round-4/5 provenance requirement:
    expect(decoded.header.relaxTol).toBe(1e-9);
    expect(decoded.header.divTol).toBe(1e-7);
    expect(decoded.header.relaxMaxSweeps).toBe(200_000);
    expect(decoded.header.farField).toBe("dirichlet");
    expect(decoded.header.fields).toEqual([
      { name: "a", dtype: "u8", length: cellCount(state.dims) },
      { name: "f", dtype: "f64", length: cellCount(state.dims) },
      { name: "sigma", dtype: "f64", length: cellCount(state.dims) },
    ]);
    expect(decoded.state.simTimeSeconds).toBe(1.25);
    expect(decoded.state.farField).toBe("dirichlet");
    expect(Array.from(decoded.state.a)).toEqual(Array.from(state.a));
    expect(Array.from(decoded.state.f)).toEqual(Array.from(state.f));
    expect(Array.from(decoded.state.sigma)).toEqual(Array.from(state.sigma));
  });

  it("rejects malformed header mutations instead of decoding them", () => {
    const bytes = encodeLKCheckpoint(syntheticLKState());
    const n = cellCount(syntheticLKState().dims);
    const cases: Array<[string, (h: Record<string, unknown>) => void, RegExp]> = [
      ["version 2", (h) => (h.version = 2), /version/],
      ["missing relaxTol", (h) => delete h.relaxTol, /relaxTol/],
      ["missing divTol", (h) => delete h.divTol, /divTol/],
      ["missing relaxMaxSweeps", (h) => delete h.relaxMaxSweeps, /relaxMaxSweeps/],
      ["invalid far field", (h) => (h.farField = "bogus"), /farField/],
      ["nonpositive divTol", (h) => (h.divTol = 0), /divTol/],
      ["negative relaxTol", (h) => (h.relaxTol = -1e-9), /relaxTol/],
      ["zero sweep cap", (h) => (h.relaxMaxSweeps = 0), /relaxMaxSweeps/],
      ["fractional sweep cap", (h) => (h.relaxMaxSweeps = 1.5), /relaxMaxSweeps/],
      ["string dimension", (h) => ((h.dims as Record<string, unknown>).nx = "5"), /dims\.nx/],
      ["zero dimension", (h) => ((h.dims as Record<string, unknown>).nz = 0), /dims\.nz/],
      ["negative tick", (h) => (h.tick = -1), /tick/],
      ["negative simulation time", (h) => (h.simTimeSeconds = -1), /simTimeSeconds/],
      ["fractional seed", (h) => (h.rngSeed = 1.5), /rngSeed/],
      ["negative noise", (h) => (h.noiseEpsilon = -1), /noiseEpsilon/],
      ["noise above one", (h) => (h.noiseEpsilon = 1.1), /noiseEpsilon/],
      ["invalid domain", (h) => (h.domain = "bogus"), /domain/],
      ["out-of-domain center", (h) => (h.center = [99, 2, 1]), /center/],
      ["temperature outside digitization", (h) => (h.tempC = -51), /tempC/],
      ["zero supersaturation", (h) => (h.sigmaInfinity = 0), /sigmaInfinity/],
      ["zero lattice spacing", (h) => (h.dxUm = 0), /dxUm/],
      ["zero pressure", (h) => (h.pressurePa = 0), /pressurePa/],
      ["SI-underflow lattice spacing", (h) => (h.dxUm = Number.MIN_VALUE), /derived dxM/],
      ["overflowed kinetic length", (h) => (h.pressurePa = Number.MIN_VALUE), /derived X_0/],
      [
        "overflowed stiffness",
        (h) => (h.dxUm = Number.MAX_VALUE),
        /derived dxM\/X_0|fill-rate scale/,
      ],
      ["invalid parameter set", (h) => (h.paramSet = "bogus"), /paramSet/],
      ["CFL at one", (h) => (h.cflFill = 1), /cflFill/],
      ["CFL above one", (h) => (h.cflFill = 2), /cflFill/],
      ["missing field table", (h) => delete h.fields, /fields/],
      [
        "short f descriptor (the silently-shifted-state probe)",
        (h) => {
          (h.fields as Array<{ length: number }>)[1].length = n - 1;
        },
        /field table|payload/,
      ],
    ];
    for (const [label, mutate, pattern] of cases) {
      expect(() => decodeLKCheckpoint(mutateLKHeader(bytes, mutate)), label).toThrow(pattern);
    }
  });

  it("rejects a truncated payload", () => {
    const bytes = encodeLKCheckpoint(syntheticLKState());
    expect(() => decodeLKCheckpoint(bytes.subarray(0, bytes.length - 8))).toThrow(/payload/);
    const extended = new Uint8Array(bytes.length + 1);
    extended.set(bytes);
    expect(() => decodeLKCheckpoint(extended)).toThrow(/payload/);
  });

  it("rejects malformed runtime state before the writer can shift field payloads", () => {
    const state = syntheticLKState();
    const n = cellCount(state.dims);
    expect(() => encodeLKCheckpoint({ ...state, f: new Float64Array(n - 1) })).toThrow(/f.*length/);
    const invalidFill = state.f.slice();
    invalidFill[0] = Number.NaN;
    expect(() => encodeLKCheckpoint({ ...state, f: invalidFill })).toThrow(/f\[0\]/);
    expect(() =>
      encodeLKCheckpoint({ ...state, domain: "bogus" } as unknown as LKRunState),
    ).toThrow(/domain/);
    expect(() => encodeLKCheckpoint({ ...state, dxUm: Number.MIN_VALUE })).toThrow(/derived dxM/);
    expect(() => encodeLKCheckpoint({ ...state, pressurePa: Number.MIN_VALUE })).toThrow(
      /derived X_0/,
    );
    const reflecting = decodeLKCheckpoint(
      encodeLKCheckpoint({ ...state, farField: "reflecting" }),
    );
    expect(reflecting.header.farField).toBe("reflecting");
    expect(reflecting.state.farField).toBe("reflecting");
    const impossibleAttached = state.f.slice();
    impossibleAttached[state.a.indexOf(1)] = 0.5;
    expect(() => encodeLKCheckpoint({ ...state, f: impossibleAttached })).toThrow(/attached cell/);
    const outsideCrystal = state.a.slice();
    const outsideFill = state.f.slice();
    outsideCrystal[0] = 1;
    outsideFill[0] = 1;
    expect(() =>
      encodeLKCheckpoint({ ...state, a: outsideCrystal, f: outsideFill }),
    ).toThrow(/masked wall cell/);
  });
});
