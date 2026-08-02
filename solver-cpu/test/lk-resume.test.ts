import { describe, expect, it } from "vitest";
import {
  decodeLKResumeCheckpointV3,
  encodeLKResumeCheckpointV3,
  type LKResumeByteSink,
  type LKResumeByteSource,
  type LKResumeStateV3,
} from "@vcc/core";
import { LKSolver } from "@vcc/solver-cpu";

const eligibleOptions = {
  surfacePolicy: "aggregate-hv-g1h1-v6",
  dims: { nx: 12, ny: 12, nz: 9 },
  tempC: -5,
  sigmaInfinity: 0.01,
  dxUm: 0.35,
  pressurePa: 101_325,
  paramSet: "CAK",
  cflFill: 0.2,
  relaxTol: 1e9,
  divTol: 1e9,
  relaxMaxSweeps: 1,
  rngSeed: 0x1234_5678,
  noiseEpsilon: 0.25,
  domain: "hexPrism",
  farField: "monopole-matched",
  seedRadius: 2,
  seedThickness: 1,
} as const;

interface ResumeInternals {
  readonly blocked: Uint8Array;
  readonly inBoundary: Uint8Array;
  readonly nTAtt: Uint8Array;
  readonly nZAtt: Uint8Array;
  readonly shellRadiusM: Float64Array;
  readonly volumeRateM3PerS: number;
  readonly iMin: number;
  readonly iMax: number;
  readonly jMin: number;
  readonly jMax: number;
  readonly kMin: number;
  readonly kMax: number;
  readonly dxUmInput: number;
  readonly mutationEpoch: number;
  readonly testHookEverUsed: boolean;
  readonly acceptedEnvironmentEventCount: number;
}

function internals(solver: LKSolver): ResumeInternals {
  return solver as unknown as ResumeInternals;
}

class MemorySink implements LKResumeByteSink {
  readonly chunks: Uint8Array[] = [];

  async write(chunk: Uint8Array): Promise<void> {
    this.chunks.push(chunk.slice());
  }

  bytes(): Uint8Array {
    const byteLength = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return bytes;
  }
}

class MemorySource implements LKResumeByteSource {
  readonly byteLength: number;
  private readonly bytes: Uint8Array;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.byteLength = bytes.length;
  }

  async readExactly(offset: number, target: Uint8Array): Promise<void> {
    if (!Number.isSafeInteger(offset) || offset < 0 || offset + target.length > this.bytes.length) {
      throw new Error("test byte source read exceeds retained bytes");
    }
    target.set(this.bytes.subarray(offset, offset + target.length));
  }
}

async function encodeResume(solver: LKSolver): Promise<Uint8Array> {
  return encodeState(solver.resumeStateV3());
}

async function encodeState(state: LKResumeStateV3): Promise<Uint8Array> {
  const sink = new MemorySink();
  const summary = await encodeLKResumeCheckpointV3(state, sink);
  const bytes = sink.bytes();
  expect(summary.byteLength).toBe(bytes.length);
  return bytes;
}

function rawBytes(view: {
  readonly buffer: ArrayBufferLike;
  readonly byteOffset: number;
  readonly byteLength: number;
}): Uint8Array {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength).slice();
}

function scientificState(solver: LKSolver): unknown {
  const state = solver.resumeStateV3();
  const internal = internals(solver);
  return {
    controls: {
      numericEngine: state.numericEngine,
      resumePhase: state.resumePhase,
      cycleState: state.cycleState,
      timelineMode: state.timelineMode,
      dims: state.dims,
      tick: state.tick,
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
      surfacePolicy: state.surfacePolicy,
      farField: state.farField,
      activeCellCount: state.activeCellCount,
      shellCellCount: state.shellCellCount,
      hexRadius: state.hexRadius,
      zHalfExtent: state.zHalfExtent,
    },
    dynamics: {
      attachedCount: state.attachedCount,
      holeFillCountTotal: state.holeFillCountTotal,
      simTimeSeconds: state.simTimeSeconds,
      volumeRateM3PerS: state.volumeRateM3PerS,
      lastMaxFillVelocityMS: state.lastMaxFillVelocityMS,
      fillLedger: state.fillLedger,
      holeFillDeficit: state.holeFillDeficit,
      saturationClippedFill: state.saturationClippedFill,
      lastRelaxation: state.lastRelaxation,
      acceptedEnvironmentEventCount: state.acceptedEnvironmentEventCount,
      closedPlacedFillVaporUnits: state.closedPlacedFillVaporUnits,
      currentTemperatureSegmentStartFill: state.currentTemperatureSegmentStartFill,
      testHookEverUsed: state.testHookEverUsed,
      ledger: solver.ledger(),
    },
    fields: {
      a: rawBytes(state.a),
      f: rawBytes(state.f),
      sigma: rawBytes(state.sigma),
    },
    topology: {
      boundaryOrder: [...state.boundaryOrder],
      lastAttached: [...state.lastAttached],
      wall: rawBytes(solver.wall),
      blocked: rawBytes(internal.blocked),
      inBoundary: rawBytes(internal.inBoundary),
      nTAtt: rawBytes(internal.nTAtt),
      nZAtt: rawBytes(internal.nZAtt),
      dirichletCells: rawBytes(solver.dirichletCells),
      shellRadiusM: rawBytes(internal.shellRadiusM),
      extents: [
        internal.iMin,
        internal.iMax,
        internal.jMin,
        internal.jMax,
        internal.kMin,
        internal.kMax,
      ],
    },
  };
}

async function roundTrip(solver: LKSolver): Promise<LKSolver> {
  const decoded = await decodeLKResumeCheckpointV3(new MemorySource(await encodeResume(solver)));
  return LKSolver.fromResumeStateV3(decoded);
}

describe("LK v3 resume eligibility witnesses", () => {
  it("owns admitted dimensions and centre instead of retaining caller-mutable objects", () => {
    const dims = { nx: 12, ny: 12, nz: 9 };
    const center: [number, number, number] = [6, 6, 4];
    const solver = new LKSolver({ ...eligibleOptions, dims, center });

    dims.nx = 99;
    dims.ny = 98;
    dims.nz = 97;
    center[0] = 0;
    center[1] = 0;
    center[2] = 0;

    expect(solver.dims).toEqual({ nx: 12, ny: 12, nz: 9 });
    expect(solver.center).toEqual([6, 6, 4]);
    expect(Object.isFrozen(solver.dims)).toBe(true);
    expect(Object.isFrozen(solver.center)).toBe(true);
    expect(solver.step().relaxation.converged).toBe(true);
    expect(solver.resumeStateV3().dims).toEqual({ nx: 12, ny: 12, nz: 9 });
    expect(solver.resumeStateV3().center).toEqual([6, 6, 4]);
  });

  it("retains the exact admitted dxUm bits instead of reconstructing through metres", async () => {
    // This ordinary finite value is an explicit one-ulp witness for
    // `dxUm * 1e-6 / 1e-6 !== dxUm` in binary64.
    const dxUm = 7.757629624791443;
    const solver = new LKSolver({ ...eligibleOptions, dxUm });
    expect(Object.is(solver.dxM / 1e-6, dxUm)).toBe(false);
    expect(Object.is(internals(solver).dxUmInput, dxUm)).toBe(true);
    expect(Object.is(solver.resumeStateV3().dxUm, dxUm)).toBe(true);
    const restored = await roundTrip(solver);
    expect(Object.is(restored.resumeStateV3().dxUm, dxUm)).toBe(true);
    expect(Object.is(restored.dxM, solver.dxM)).toBe(true);
  });

  it("marks either supplied test hook sticky before an empty hook can disappear", () => {
    const unhooked = new LKSolver(eligibleOptions);
    const emptyExtraSites = new LKSolver({
      ...eligibleOptions,
      testMode: true,
      testExtraSeedSites: [],
    });
    const coefficientOverride = new LKSolver({
      ...eligibleOptions,
      testMode: true,
      testAlphaOverride: () => 1,
    });

    expect(internals(unhooked).testHookEverUsed).toBe(false);
    expect(internals(emptyExtraSites).testHookEverUsed).toBe(true);
    expect(internals(coefficientOverride).testHookEverUsed).toBe(true);
    expect(() => unhooked.resumeStateV3()).not.toThrow();
    expect(() => emptyExtraSites.resumeStateV3()).toThrow(/ever used a test hook/);
    expect(() => coefficientOverride.resumeStateV3()).toThrow(/ever used a test hook/);
  });

  it("counts every accepted environment event, including a same-temperature event", () => {
    const solver = new LKSolver(eligibleOptions);
    expect(internals(solver).acceptedEnvironmentEventCount).toBe(0);

    solver.applyTimelineEnvironment({ tempC: -5, sigmaInfinity: 0.02 });
    expect(internals(solver).acceptedEnvironmentEventCount).toBe(1);
    expect(() => solver.resumeStateV3()).toThrow(/constant environment/);

    expect(() =>
      solver.applyTimelineEnvironment({ tempC: Number.NaN, sigmaInfinity: 0.02 }),
    ).toThrow();
    expect(internals(solver).acceptedEnvironmentEventCount).toBe(1);
  });

  it("advances the live epoch before accepted mutations and not for phase-refused calls", () => {
    const solver = new LKSolver(eligibleOptions);
    const initialSnapshot = solver.resumeStateV3();
    expect(internals(solver).mutationEpoch).toBe(0);
    expect(initialSnapshot.mutationEpoch()).toBe(0);

    expect(() => solver.advanceSurface()).toThrow(/state=boundary/);
    expect(internals(solver).mutationEpoch).toBe(0);

    expect(solver.relaxField().converged).toBe(true);
    expect(internals(solver).mutationEpoch).toBe(1);
    expect(() => initialSnapshot.mutationEpoch()).toThrow(/snapshot is stale/);
    expect(() => solver.resumeStateV3()).toThrow(/cycle-boundary state/);
    expect(() => solver.relaxField()).toThrow(/state ready/);
    expect(internals(solver).mutationEpoch).toBe(1);

    solver.advanceSurface();
    expect(internals(solver).mutationEpoch).toBe(2);
    const completedSnapshot = solver.resumeStateV3();
    expect(completedSnapshot.mutationEpoch()).toBe(2);

    // The phase admits this operation, so the epoch moves before validation changes and then
    // rejects the supplied target. That is precisely the transition a pending stream must see.
    expect(() =>
      solver.applyTimelineEnvironment({ tempC: Number.NaN, sigmaInfinity: 0.02 }),
    ).toThrow();
    expect(internals(solver).mutationEpoch).toBe(3);
    expect(() => completedSnapshot.mutationEpoch()).toThrow(/snapshot is stale/);
  });

  it("returns main-field identities without mutating the solver", () => {
    const solver = new LKSolver(eligibleOptions);
    const epochBefore = internals(solver).mutationEpoch;
    const state = solver.resumeStateV3();

    expect(state.a).toBe(solver.a);
    expect(state.f).toBe(solver.f);
    expect(state.sigma).toBe(solver.sigma);
    expect(state.boundaryOrder).toBe(solver.boundaryCells());
    expect(state.lastAttached).toBe(solver.lastAttached);
    expect(internals(solver).mutationEpoch).toBe(epochBefore);
  });

  it("refuses every configuration outside the initial exact production allow-list", () => {
    expect(() => new LKSolver({ ...eligibleOptions, paramSet: "CAK_A1" }).resumeStateV3()).toThrow(
      /paramSet CAK_A1/,
    );
    expect(() =>
      new LKSolver({
        ...eligibleOptions,
        surfacePolicy: "aggregate-hv-g1h1-v5",
      }).resumeStateV3(),
    ).toThrow(/aggregate-hv-g1h1-v6/);
    expect(() =>
      new LKSolver({ ...eligibleOptions, farField: "dirichlet" }).resumeStateV3(),
    ).toThrow(/monopole-matched/);
    expect(() => new LKSolver({ ...eligibleOptions, domain: "box" }).resumeStateV3()).toThrow(
      /hexPrism/,
    );
  });
});

function differentialOptions(paramSet: "CAK" | "M1") {
  return {
    ...eligibleOptions,
    dims: { nx: 16, ny: 16, nz: 11 },
    tempC: -2,
    paramSet,
  } as const;
}

function multiSweepDifferentialOptions(paramSet: "CAK" | "M1") {
  return {
    ...eligibleOptions,
    paramSet,
    relaxTol: 1e-8,
    divTol: 1e-6,
    relaxMaxSweeps: 200_000,
  } as const;
}

describe("LK v3 field-adopting restore", () => {
  for (const paramSet of ["CAK", "M1"] as const) {
    it(`${paramSet}: direct, checkpoint-every-cycle, and multiply resumed evolution are exact`, async () => {
      const direct = new LKSolver(differentialOptions(paramSet));
      let checkpointEveryCycle = await roundTrip(
        new LKSolver(differentialOptions(paramSet)),
      );
      let multiplyResumed = await roundTrip(new LKSolver(differentialOptions(paramSet)));
      expect(scientificState(checkpointEveryCycle)).toEqual(scientificState(direct));
      expect(scientificState(multiplyResumed)).toEqual(scientificState(direct));

      const splitTicks = new Set([1, 5, 12, 23, 30]);
      let attachmentCount = 0;
      let holeFillCount = 0;
      for (let cycle = 1; cycle <= 30; cycle++) {
        const directReport = direct.step();
        const everyReport = checkpointEveryCycle.step();
        const multiplyReport = multiplyResumed.step();
        expect(everyReport, `cycle ${cycle}: every-cycle report`).toEqual(directReport);
        expect(multiplyReport, `cycle ${cycle}: multiply-resumed report`).toEqual(directReport);
        attachmentCount += directReport.surface.attachedNow;
        holeFillCount += directReport.surface.holeFillCount;

        const directCheckpoint = await encodeResume(direct);
        checkpointEveryCycle = await roundTrip(checkpointEveryCycle);
        if (splitTicks.has(cycle)) multiplyResumed = await roundTrip(multiplyResumed);

        const expected = scientificState(direct);
        expect(
          scientificState(checkpointEveryCycle),
          `cycle ${cycle}: every-cycle complete state`,
        ).toEqual(expected);
        expect(
          scientificState(multiplyResumed),
          `cycle ${cycle}: multiply-resumed complete state`,
        ).toEqual(expected);
        expect(
          await encodeResume(checkpointEveryCycle),
          `cycle ${cycle}: every-cycle checkpoint bytes`,
        ).toEqual(directCheckpoint);
        expect(
          await encodeResume(multiplyResumed),
          `cycle ${cycle}: multiply-resumed checkpoint bytes`,
        ).toEqual(directCheckpoint);
      }

      expect(attachmentCount).toBeGreaterThan(0);
      expect(holeFillCount).toBeGreaterThan(0);
      expect(direct.saturationClippedFill).toBeGreaterThan(0);
      expect(internals(direct).volumeRateM3PerS).toBeGreaterThan(0);
    });
  }

  for (const paramSet of ["CAK", "M1"] as const) {
    it(`${paramSet}: converged multi-sweep continuation remains exact after nonlinear events`, async () => {
      const options = multiSweepDifferentialOptions(paramSet);
      const direct = new LKSolver(options);
      let checkpointEveryCycle = await roundTrip(new LKSolver(options));
      let multiplyResumed = await roundTrip(new LKSolver(options));
      const splitTicks = new Set([1, 3, 5, 8]);
      const sweepParities = new Set<number>();
      const sweepSequence: number[] = [];
      const attachmentSequence: number[] = [];
      let minimumSweeps = Infinity;
      let attachmentCount = 0;
      let firstHoleFillCycle: number | null = null;

      for (let cycle = 1; cycle <= 9; cycle++) {
        const directReport = direct.step();
        const everyReport = checkpointEveryCycle.step();
        const multiplyReport = multiplyResumed.step();
        expect(everyReport, `cycle ${cycle}: every-cycle report`).toEqual(directReport);
        expect(multiplyReport, `cycle ${cycle}: multiply-resumed report`).toEqual(directReport);
        sweepSequence.push(directReport.relaxation.sweeps);
        attachmentSequence.push(directReport.surface.attachedNow);
        minimumSweeps = Math.min(minimumSweeps, directReport.relaxation.sweeps);
        sweepParities.add(directReport.relaxation.sweeps % 2);
        attachmentCount += directReport.surface.attachedNow;
        if (firstHoleFillCycle === null && directReport.surface.holeFillCount > 0) {
          firstHoleFillCycle = cycle;
        }

        const beforeExport = scientificState(direct);
        const directCheckpoint = await encodeResume(direct);
        expect(scientificState(direct), `cycle ${cycle}: export is non-mutating`).toEqual(
          beforeExport,
        );
        checkpointEveryCycle = await roundTrip(checkpointEveryCycle);
        if (splitTicks.has(cycle)) multiplyResumed = await roundTrip(multiplyResumed);

        const expected = scientificState(direct);
        expect(
          scientificState(checkpointEveryCycle),
          `cycle ${cycle}: every-cycle complete state`,
        ).toEqual(expected);
        expect(
          scientificState(multiplyResumed),
          `cycle ${cycle}: multiply-resumed complete state`,
        ).toEqual(expected);
        expect(
          await encodeResume(checkpointEveryCycle),
          `cycle ${cycle}: every-cycle checkpoint bytes`,
        ).toEqual(directCheckpoint);
        expect(
          await encodeResume(multiplyResumed),
          `cycle ${cycle}: multiply-resumed checkpoint bytes`,
        ).toEqual(directCheckpoint);
      }

      expect(minimumSweeps).toBeGreaterThan(1);
      expect([...sweepParities].sort()).toEqual([0, 1]);
      expect(sweepSequence).toEqual(
        paramSet === "CAK"
          ? [73, 75, 68, 61, 53, 49, 46, 42, 39]
          : [71, 71, 66, 61, 56, 50, 44, 43, 34],
      );
      expect(attachmentSequence).toEqual(
        paramSet === "CAK"
          ? [0, 0, 0, 0, 0, 24, 12, 9, 5]
          : [0, 0, 0, 0, 0, 29, 11, 9, 1],
      );
      expect(attachmentCount).toBeGreaterThan(0);
      expect(direct.saturationClippedFill).toBeGreaterThan(0);
      expect(internals(direct).volumeRateM3PerS).toBeGreaterThan(0);
      expect(
        Array.from(direct.dirichletCells).every(
          (index) => direct.sigma[index] > 0 && direct.sigma[index] < direct.sigmaInfinity,
        ),
      ).toBe(true);
      if (paramSet === "M1") {
        expect(firstHoleFillCycle).toBe(8);
      }
    });
  }

  it("preserves a reachable unattached boundary f=1 through a stalled cycle, then attaches it", async () => {
    const source = new LKSolver({ ...eligibleOptions, divTol: 1e308 });
    const target = source.boundaryCells().find(
      (index) => source.facetClassOf(index) === "inhibited",
    );
    expect(target).not.toBeUndefined();
    const index = target as number;
    source.sigma.fill(0);
    source.f[index] = 1;

    const restored = await roundTrip(source);
    expect(restored.a[index]).toBe(0);
    expect(Object.is(restored.f[index], 1)).toBe(true);
    const stalled = restored.step();
    expect(stalled.relaxation.converged).toBe(true);
    expect(stalled.surface.stalled).toBe(true);
    expect(restored.a[index]).toBe(0);
    expect(Object.is(restored.f[index], 1)).toBe(true);

    for (let cell = 0; cell < restored.sigma.length; cell++) {
      if (restored.wall[cell] === 0 && restored.a[cell] === 0) {
        restored.sigma[cell] = restored.sigmaInfinity;
      }
    }
    const positiveRate = restored.step();
    expect(positiveRate.surface.stalled).toBe(false);
    expect(restored.a[index]).toBe(1);
    expect(restored.lastAttached).toContain(index);
  });

  it("rejects shallow copies and repeat consumption before solver construction", async () => {
    const bytes = await encodeResume(new LKSolver(eligibleOptions));
    const decoded = await decodeLKResumeCheckpointV3(new MemorySource(bytes));
    const shallowCopy = { ...decoded } as typeof decoded;
    expect(() => LKSolver.fromResumeStateV3(shallowCopy)).toThrow(/not decoder-branded/);

    const restored = LKSolver.fromResumeStateV3(decoded);
    expect(restored.tick).toBe(0);
    expect(() => LKSolver.fromResumeStateV3(decoded)).toThrow(/already consumed/);
  });

  it("does not let a hostile Proxy forge the internal adoption capability", () => {
    let symbolHasCalls = 0;
    let symbolGetCalls = 0;
    const ordinaryTarget = {
      ...eligibleOptions,
      surfacePolicy: "proxy-invalid",
    } as unknown as object;
    const hostileOptions = new Proxy(ordinaryTarget, {
      has(target, key): boolean {
        if (typeof key === "symbol") {
          symbolHasCalls++;
          return true;
        }
        return Reflect.has(target, key);
      },
      get(target, key, receiver): unknown {
        if (typeof key === "symbol") {
          symbolGetCalls++;
          return { paramSet: "CAK" };
        }
        return Reflect.get(target, key, receiver);
      },
    });

    expect(() => Reflect.construct(LKSolver, [hostileOptions])).toThrow(
      /surfacePolicy is invalid: proxy-invalid/,
    );
    expect(symbolHasCalls).toBe(0);
    expect(symbolGetCalls).toBe(0);
  });

  it("keeps the no-dip spelling wire-reserved but solver-ineligible", async () => {
    const solver = new LKSolver({ ...eligibleOptions, paramSet: "M1" });
    const reservedState: LKResumeStateV3 = {
      ...solver.resumeStateV3(),
      paramSet: "M1_NO_DIP_ABLATION",
    };
    const bytes = await encodeState(reservedState);
    const decoded = await decodeLKResumeCheckpointV3(new MemorySource(bytes));
    expect(() => LKSolver.fromResumeStateV3(decoded)).toThrow(/schema-reserved/);
  });

  it("rejects a stale pre-encode snapshot and mutation across an awaited sink write", async () => {
    const staleSolver = new LKSolver(eligibleOptions);
    const stale = staleSolver.resumeStateV3();
    staleSolver.step();
    await expect(encodeLKResumeCheckpointV3(stale, new MemorySink())).rejects.toThrow(
      /snapshot is stale/,
    );

    const liveSolver = new LKSolver(eligibleOptions);
    const liveState = liveSolver.resumeStateV3();
    let writes = 0;
    const mutatingSink: LKResumeByteSink = {
      async write(): Promise<void> {
        writes++;
        if (writes === 1) liveSolver.step();
      },
    };
    await expect(encodeLKResumeCheckpointV3(liveState, mutatingSink)).rejects.toThrow(
      /snapshot is stale/,
    );
    expect(writes).toBe(1);
  });
});
