import { describe, expect, it } from "vitest";
import {
  decodeDiscoveryResumeCheckpoint,
  encodeDiscoveryResumeCheckpoint,
  type DiscoveryResumeState,
} from "@vcc/core";
import { LKSolver, type LKSolverOptions } from "@vcc/solver-cpu";

const options = {
  surfacePolicy: "aggregate-hv-g1h1-v6", dims: { nx: 12, ny: 12, nz: 9 },
  tempC: -5, sigmaInfinity: 0.01, dxUm: 0.35, pressurePa: 101_325, paramSet: "M1",
  cflFill: 0.2, relaxTol: 1e9, divTol: 1e9, relaxMaxSweeps: 1,
  rngSeed: 1, noiseEpsilon: 0, domain: "hexPrism", farField: "monopole-matched",
  seedRadius: 2, seedThickness: 1,
} as const;

function bytes(solver: LKSolver): Uint8Array {
  return encodeDiscoveryResumeCheckpoint(solver.exportDiscoveryResumeState());
}
function roundTrip(solver: LKSolver): LKSolver {
  return LKSolver.restoreDiscovery(decodeDiscoveryResumeCheckpoint(bytes(solver)));
}
function expectSame(actual: LKSolver, expected: LKSolver): void {
  expect(bytes(actual)).toEqual(bytes(expected));
  expect(actual.ledger()).toEqual(expected.ledger());
  expect(actual.boundaryCells()).toEqual(expected.boundaryCells());
  expect(actual.wall).toEqual(expected.wall);
  expect(actual.dirichletCells).toEqual(expected.dirichletCells);
}

describe("separate discovery continuation", () => {
  it("round-trips the registered N126 early-width state and continues its complete fields", () => {
    const direct = new LKSolver({ ...options, dims: { nx: 126, ny: 126, nz: 126 },
      dxUm: 0.175, seedRadius: 4, seedThickness: 3, experimentalBasalWidthCells: 6,
      experimentalBasalWidthHistory: { mode: "early-only", cutoffSeconds: 20 } });
    // Loose one-sweep controls isolate size/codec behavior; the real campaign-control
    // interruption differential is a separate executed N126 qualification witness.
    direct.step();
    expect(direct.fillLedger).toBeGreaterThan(0);
    expect(direct.boundaryCells().length).toBeGreaterThan(0);
    const encoded = bytes(direct);
    expect(encoded.length).toBeGreaterThan(17 * 126 ** 3);
    expect(encoded.length).toBeLessThanOrEqual(50_074_948);
    const restored = LKSolver.restoreDiscovery(decodeDiscoveryResumeCheckpoint(encoded));
    expect(Buffer.from(bytes(restored)).equals(Buffer.from(encoded))).toBe(true);
    expect(restored.step()).toEqual(direct.step());
    expect(Buffer.from(bytes(restored)).equals(Buffer.from(bytes(direct)))).toBe(true);
    expect(restored.ledger()).toEqual(direct.ledger());
  });
  const preparations: readonly (readonly [string, Partial<LKSolverOptions>])[] = [
    ["ordinary M1", {}], ["ordinary no-dip", { paramSet: "M1_NO_DIP_ABLATION" }],
    ...(["both", "neither", "basal-only", "prism-only"] as const)
      .map((experimentalFacetDips) => [experimentalFacetDips, { experimentalFacetDips }] as const),
    ["full width", { experimentalBasalWidthCells: 3 }],
  ];
  for (const [label, preparation] of preparations) {
    it(`${label}: repeated resumes preserve fields, order, diagnostics and evolution`, () => {
      const direct = new LKSolver({ ...options, ...preparation });
      let resumed = roundTrip(new LKSolver({ ...options, ...preparation }));
      expectSame(resumed, direct);
      for (let cycle = 1; cycle <= 20; cycle++) {
        expect(resumed.step()).toEqual(direct.step());
        if (cycle % 3 === 0) resumed = roundTrip(resumed);
        expectSame(resumed, direct);
      }
      expect(direct.tick).toBe(20);
      expect(direct.attachedCount).toBeGreaterThan(19);
      expect(direct.fillLedger).toBeGreaterThan(0);
      expect(direct.saturationClippedFill).toBeGreaterThan(0);
      expect(direct.exportDiscoveryResumeState().volumeRateM3PerS).toBeGreaterThan(0);
    });
  }

  for (const mode of ["early-only", "late-only"] as const) {
    it(`${mode}: resumes on both sides of the physical-time cutoff retain the switch`, () => {
      const calibration = new LKSolver({ ...options, experimentalBasalWidthCells: 3 });
      calibration.step();
      const cutoffSeconds = calibration.simTimeSeconds * 1.5;
      const configured = { ...options, experimentalBasalWidthCells: 3,
        experimentalBasalWidthHistory: { mode, cutoffSeconds } };
      const direct = new LKSolver(configured);
      let resumed = roundTrip(new LKSolver(configured));
      const seen = new Set<boolean>();
      for (let cycle = 1; cycle <= 20; cycle++) {
        seen.add(direct.basalWidthHistoryActive());
        expect(resumed.basalWidthHistoryActive()).toBe(direct.basalWidthHistoryActive());
        expect(resumed.step()).toEqual(direct.step());
        resumed = roundTrip(resumed);
        expectSame(resumed, direct);
      }
      expect(seen).toEqual(new Set([false, true]));
    });
  }

  for (const [from, to] of [[-6, -14.4], [-14.4, -6]] as const) {
    for (const paramSet of ["M1", "M1_NO_DIP_ABLATION"] as const) {
      it(`${paramSet} ${from} to ${to}: restores immediately before and after environment change`, () => {
        const direct = new LKSolver({ ...options, tempC: from, paramSet });
        let resumed = new LKSolver({ ...options, tempC: from, paramSet });
        for (let cycle = 1; cycle <= 12; cycle++) {
          expect(resumed.step()).toEqual(direct.step());
          if (cycle === 3) {
            resumed = roundTrip(resumed);
            const environment = { tempC: to, sigmaInfinity: 0.02 };
            expect(resumed.applyTimelineEnvironment(environment)).toEqual(direct.applyTimelineEnvironment(environment));
            const state = direct.exportDiscoveryResumeState();
            expect(state.lastRelaxation).toBeNull();
            expect(state.tick).toBeGreaterThan(0);
            expect(state.acceptedEnvironmentEventCount).toBe(1);
            expect(state.volumeRateM3PerS).toBe(0);
            if (to === -6) expect(Math.min(...state.sigma)).toBeLessThan(0);
            resumed = roundTrip(resumed);
          }
          if (cycle === 7) resumed = roundTrip(resumed);
          expectSame(resumed, direct);
        }
      });
    }
  }

  it("retains signed zero in active vapor and exact admitted dx bits", () => {
    const solver = new LKSolver({ ...options, dxUm: 7.757629624791443 });
    const index = solver.boundaryCells()[0];
    solver.sigma[index] = -0;
    const restored = roundTrip(solver);
    expect(Object.is(restored.sigma[index], -0)).toBe(true);
    expect(Object.is(restored.exportDiscoveryResumeState().dxUm, 7.757629624791443)).toBe(true);
    expectSame(restored, solver);
  });

  it("adopts decoded arrays once and owns input bytes independently", () => {
    const original = new LKSolver(options);
    const encoded = bytes(original);
    const decoded = decodeDiscoveryResumeCheckpoint(encoded);
    encoded.fill(0);
    const restored = LKSolver.restoreDiscovery(decoded);
    expectSame(restored, original);
    expect(() => LKSolver.restoreDiscovery(decoded)).toThrow(/already consumed/);
    expect(() => LKSolver.restoreDiscovery({ ...decoded })).toThrow(/owned decoder envelope/);
  });

  it("keeps old v3 refusals for experiments, no-dip and histories", () => {
    expect(() => new LKSolver({ ...options, experimentalFacetDips: "both" }).resumeStateV3()).toThrow(/experimental/);
    expect(() => new LKSolver({ ...options, experimentalBasalWidthCells: 3 }).resumeStateV3()).toThrow(/experimental/);
    expect(() => new LKSolver({ ...options, paramSet: "M1_NO_DIP_ABLATION" }).resumeStateV3()).toThrow(/paramSet/);
    const history = new LKSolver(options);
    history.step(); history.applyTimelineEnvironment({ tempC: -14.4, sigmaInfinity: 0.02 });
    expect(() => history.resumeStateV3()).toThrow(/constant environment/);
  });

  it("refuses incomplete cycles, test hooks, hole-fill flags and stale snapshots", () => {
    const solver = new LKSolver(options);
    const initial = solver.exportDiscoveryResumeState();
    solver.relaxField();
    expect(() => solver.exportDiscoveryResumeState()).toThrow(/cycle-boundary/);
    expect(() => encodeDiscoveryResumeCheckpoint(initial)).toThrow(/stale/);
    expect(() => new LKSolver({ ...options, testMode: true, testExtraSeedSites: [] }).exportDiscoveryResumeState()).toThrow(/test hook/);
    expect(() => new LKSolver({ ...options, experimentalHoleFilling: "disabled" }).exportDiscoveryResumeState()).toThrow(/hole-filling/);
  });

  it("executes converged multiple-sweep facet and width continuations", () => {
    for (const experimental of [{ experimentalFacetDips: "prism-only" as const }, { experimentalBasalWidthCells: 3 }]) {
      const configured = { ...options, ...experimental, relaxTol: 1e-8, divTol: 1e-6, relaxMaxSweeps: 200_000 };
      const direct = new LKSolver(configured);
      let resumed = new LKSolver(configured);
      let sweeps = 0;
      for (let cycle = 0; cycle < 3; cycle++) {
        const directReport = direct.step();
        expect(directReport.relaxation.converged).toBe(true);
        expect(resumed.step()).toEqual(directReport);
        sweeps += directReport.relaxation.sweeps;
        resumed = roundTrip(resumed);
        expectSame(resumed, direct);
      }
      expect(sweeps).toBeGreaterThan(3);
    }
  });
});

function rewriteHeader(input: Uint8Array, mutate: (header: Record<string, unknown>) => void): Uint8Array {
  const oldLength = new DataView(input.buffer, input.byteOffset, input.byteLength).getUint32(8, true);
  const header = JSON.parse(new TextDecoder().decode(input.subarray(12, 12 + oldLength))) as Record<string, unknown>;
  mutate(header);
  const text = new TextEncoder().encode(JSON.stringify(header));
  const output = new Uint8Array(input.length - oldLength + text.length);
  output.set(input.subarray(0, 8));
  new DataView(output.buffer).setUint32(8, text.length, true);
  output.set(text, 12);
  output.set(input.subarray(12 + oldLength), 12 + text.length);
  return output;
}

describe("discovery codec rejects accidental state loss", () => {
  it("rejects just-over-N126 dimensions and retains the independent 64 MiB bound", () => {
    const state = new LKSolver(options).exportDiscoveryResumeState();
    const dims = { nx: 126, ny: 126, nz: 127 };
    expect(() => encodeDiscoveryResumeCheckpoint({ ...state, dims })).toThrow(/bounded N126 capacity/);
    const encoded = bytes(new LKSolver(options));
    const scalar = (value: number) => {
      const bits = Buffer.alloc(8); bits.writeDoubleBE(value); return { $f64: bits.toString("hex") };
    };
    const oversized = rewriteHeader(encoded, (header) => {
      (header.state as Record<string, unknown>).dims = { nx: scalar(126), ny: scalar(126), nz: scalar(127) };
    });
    expect(() => decodeDiscoveryResumeCheckpoint(oversized)).toThrow(/bounded N126 capacity/);
    expect(() => decodeDiscoveryResumeCheckpoint(new Uint8Array(64 * 1024 * 1024 + 1))).toThrow(/invalid byte length/);
  });
  it("rejects truncated payload, wrong format, and missing/extra metadata", () => {
    const encoded = bytes(new LKSolver(options));
    expect(() => decodeDiscoveryResumeCheckpoint(encoded.subarray(0, encoded.length - 1))).toThrow(/payload length/);
    const wrongMagic = encoded.slice(); wrongMagic[0] = 0;
    expect(() => decodeDiscoveryResumeCheckpoint(wrongMagic)).toThrow(/wrong magic/);
    for (const change of [
      (state: Record<string, unknown>) => { delete state.experimentalFacetDips; },
      (state: Record<string, unknown>) => { state.forgottenDiagnostic = true; },
    ]) {
      const corrupt = rewriteHeader(encoded, (header) => change(header.state as Record<string, unknown>));
      expect(() => decodeDiscoveryResumeCheckpoint(corrupt)).toThrow(/missing or unknown/);
    }
  });

  it("recomputes topology and validates ledger/report witnesses", () => {
    const solver = new LKSolver(options);
    solver.step();
    const state = solver.exportDiscoveryResumeState();
    const mutations: Partial<DiscoveryResumeState>[] = [
      { boundaryOrder: state.boundaryOrder.slice(1) },
      { attachedCount: state.attachedCount + 1 },
      { closedPlacedFillVaporUnits: 1 },
      { lastRelaxation: null },
      { lastRelaxation: { ...state.lastRelaxation!, divergenceResidual: state.lastRelaxation!.divergenceResidual + 0.5 } },
      { experimentalFacetDips: "neither", experimentalBasalWidthCells: 3 },
    ];
    for (const mutation of mutations) expect(() => encodeDiscoveryResumeCheckpoint({ ...state, ...mutation })).toThrow();
    const encoded = bytes(solver);
    const headerLength = new DataView(encoded.buffer).getUint32(8, true);
    encoded[12 + headerLength] = 1;
    expect(() => decodeDiscoveryResumeCheckpoint(encoded)).toThrow(/masked wall/);
  });
});
