import { describe, expect, it } from "vitest";
import {
  alphaHK,
  decodeLKCheckpoint,
  encodeLKCheckpoint,
  NUCLEATION_PARAM_SETS,
  type FacetClass,
  type LKSurfacePolicy,
  type PreparedAlphaHK,
} from "@vcc/core";
import { LKSolver } from "@vcc/solver-cpu";

function bytes(values: Uint8Array | Int32Array | Float64Array): Uint8Array {
  return new Uint8Array(values.buffer, values.byteOffset, values.byteLength).slice();
}

interface LKInternals {
  readonly blocked: Uint8Array;
  readonly scratch1: Float64Array;
  readonly scratch2: Float64Array;
  readonly opposingOperands: Float64Array;
  readonly hasClampedShell: boolean;
  readonly shellRadiusM: Float64Array;
  readonly canonicalOpposingOrder: boolean;
  readonly sEff: Float64Array;
  readonly boundaryAlphaHK: Float64Array;
  readonly boundarySigma: Float64Array;
  readonly boundarySigmaOpp: Float64Array;
  readonly boundaryList: readonly number[];
  readonly inBoundary: Uint8Array;
  readonly nTAtt: Uint8Array;
  readonly nZAtt: Uint8Array;
  readonly cycleState: string;
  readonly preparedAlphaHK: PreparedAlphaHK;
  readonly volumeRateM3PerS: number;
  readonly closedPlacedFillVaporUnits: number;
  readonly currentTemperatureSegmentStartFill: number;
  readonly iMin: number;
  readonly iMax: number;
  readonly jMin: number;
  readonly jMax: number;
  readonly kMin: number;
  readonly kMax: number;
}

function snapshot(solver: LKSolver): unknown {
  const internal = solver as unknown as LKInternals;
  return {
    controls: {
      surfacePolicy: solver.surfacePolicy,
      dims: solver.dims,
      dxM: solver.dxM,
      pressurePa: solver.pressurePa,
      paramSet: solver.paramSet,
      cflFill: solver.cflFill,
      relaxTol: solver.relaxTol,
      divTol: solver.divTol,
      relaxMaxSweeps: solver.relaxMaxSweeps,
      rngSeed: solver.rngSeed,
      noiseEpsilon: solver.noiseEpsilon,
      domain: solver.domain,
      farField: solver.farField,
      center: solver.center,
      activeCellCount: solver.activeCellCount,
      hexRadius: solver.hexRadius,
      zHalfExtent: solver.zHalfExtent,
      hasClampedShell: internal.hasClampedShell,
      canonicalOpposingOrder: internal.canonicalOpposingOrder,
    },
    environment: solver.timelineEnvironment(),
    derived: {
      vKinMS: solver.vKinMS,
      x0M: solver.x0M,
      mIceLedger: solver.mIceLedger,
      maximumKineticVelocityScaleMS: solver.maximumKineticVelocityScaleMS,
      maximumKineticFillRateScalePerSecond: solver.maximumKineticFillRateScalePerSecond,
    },
    tick: solver.tick,
    simTimeSeconds: solver.simTimeSeconds,
    attachedCount: solver.attachedCount,
    lastAttached: [...solver.lastAttached],
    lastMaxFillVelocityMS: solver.lastMaxFillVelocityMS,
    holeFillCountTotal: solver.holeFillCountTotal,
    fillLedger: solver.fillLedger,
    holeFillDeficit: solver.holeFillDeficit,
    saturationClippedFill: solver.saturationClippedFill,
    ledger: solver.ledger(),
    lastRelaxation: solver.lastRelaxation === null ? null : { ...solver.lastRelaxation },
    cycleState: internal.cycleState,
    preparedAlphaHK: internal.preparedAlphaHK,
    volumeRateM3PerS: internal.volumeRateM3PerS,
    closedPlacedFillVaporUnits: internal.closedPlacedFillVaporUnits,
    currentTemperatureSegmentStartFill: internal.currentTemperatureSegmentStartFill,
    bounds: {
      iMin: internal.iMin,
      iMax: internal.iMax,
      jMin: internal.jMin,
      jMax: internal.jMax,
      kMin: internal.kMin,
      kMax: internal.kMax,
    },
    boundaryList: [...internal.boundaryList],
    a: bytes(solver.a),
    f: bytes(solver.f),
    sigma: bytes(solver.sigma),
    wall: bytes(solver.wall),
    blocked: bytes(internal.blocked),
    scratch1: bytes(internal.scratch1),
    scratch2: bytes(internal.scratch2),
    opposingOperands: bytes(internal.opposingOperands),
    shellRadiusM: bytes(internal.shellRadiusM),
    sEff: bytes(internal.sEff),
    boundaryAlphaHK: bytes(internal.boundaryAlphaHK),
    boundarySigma: bytes(internal.boundarySigma),
    boundarySigmaOpp: bytes(internal.boundarySigmaOpp),
    inBoundary: bytes(internal.inBoundary),
    nTAtt: bytes(internal.nTAtt),
    nZAtt: bytes(internal.nZAtt),
    dirichletCells: bytes(solver.dirichletCells),
  };
}

function checkpoint(solver: LKSolver): Uint8Array {
  return encodeLKCheckpoint({
    surfacePolicy: solver.surfacePolicy,
    dims: solver.dims,
    tick: solver.tick,
    simTimeSeconds: solver.simTimeSeconds,
    rngSeed: solver.rngSeed,
    noiseEpsilon: solver.noiseEpsilon,
    domain: solver.domain,
    center: solver.center,
    tempC: solver.tempC,
    sigmaInfinity: solver.sigmaInfinity,
    dxUm: solver.dxM / 1e-6,
    pressurePa: solver.pressurePa,
    paramSet: solver.paramSet,
    cflFill: solver.cflFill,
    relaxTol: solver.relaxTol,
    divTol: solver.divTol,
    relaxMaxSweeps: solver.relaxMaxSweeps,
    farField: solver.farField,
    a: solver.a,
    f: solver.f,
    sigma: solver.sigma,
  });
}

function expectIdentical(prepared: LKSolver, direct: LKSolver, label: string): void {
  expect(snapshot(prepared), `${label}: complete solver state`).toEqual(snapshot(direct));
  const preparedCheckpoint = checkpoint(prepared);
  const directCheckpoint = checkpoint(direct);
  expect(preparedCheckpoint, `${label}: checkpoint bytes`).toEqual(directCheckpoint);
  expect(
    decodeLKCheckpoint(preparedCheckpoint),
    `${label}: decoded checkpoint reconstruction`,
  ).toEqual(decodeLKCheckpoint(directCheckpoint));
}

function completeCycle(prepared: LKSolver, direct: LKSolver, label: string): void {
  const preparedRelaxation = prepared.relaxField();
  const directRelaxation = direct.relaxField();
  expect(preparedRelaxation, `${label}: relaxation report`).toEqual(directRelaxation);
  expect(preparedRelaxation.sweeps, `${label}: sweep count`).toBe(directRelaxation.sweeps);
  const preparedSurface = prepared.advanceSurface();
  const directSurface = direct.advanceSurface();
  expect(preparedSurface, `${label}: surface report`).toEqual(directSurface);
  expectIdentical(prepared, direct, label);
}

const policies: readonly LKSurfacePolicy[] = [
  "legacy-v3",
  "aggregate-hv-g1h1-v4",
  "aggregate-hv-g1h1-v5",
  "aggregate-hv-g1h1-v6",
];

describe("prepared LK kinetics are a bit-identical solver refactor", () => {
  for (const paramSet of NUCLEATION_PARAM_SETS) {
    for (const surfacePolicy of policies) {
      for (const noiseEpsilon of [0, 0.375] as const) {
        it(`${paramSet} ${surfacePolicy} noise=${noiseEpsilon}`, () => {
          const initialTempC = paramSet === "M1" ? -4.5 : -5;
          const targetTempC = paramSet === "M1" ? -14.4 : -15;
          const common = {
            surfacePolicy,
            dims: { nx: 12, ny: 12, nz: 9 },
            tempC: initialTempC,
            sigmaInfinity: 0.01,
            dxUm: 0.35,
            pressurePa: 101_325,
            paramSet,
            cflFill: 0.1,
            relaxTol: 1e9,
            divTol: 1e-7,
            relaxMaxSweeps: 2,
            rngSeed: 0x1234_5678,
            noiseEpsilon,
            domain: "hexPrism",
            farField: "reflecting",
            seedRadius: 2,
            seedThickness: 1,
          } as const;
          const directCalls: Array<readonly [FacetClass, number, number]> = [];
          const prepared = new LKSolver(common);
          const direct = new LKSolver({
            ...common,
            testMode: true,
            testAlphaOverride: (facet, tempC, sigmaSurf) => {
              directCalls.push([facet, tempC, sigmaSurf]);
              return alphaHK(facet, tempC, sigmaSurf, paramSet);
            },
          });

          expectIdentical(prepared, direct, "initial");
          completeCycle(prepared, direct, "cycle 1");
          completeCycle(prepared, direct, "cycle 2");

          const preparedTransition = prepared.applyTimelineEnvironment({
            tempC: targetTempC,
            sigmaInfinity: 0.02,
          });
          const directTransition = direct.applyTimelineEnvironment({
            tempC: targetTempC,
            sigmaInfinity: 0.02,
          });
          expect(preparedTransition, "timeline report").toEqual(directTransition);
          expectIdentical(prepared, direct, "after timeline event");

          completeCycle(prepared, direct, "post-event cycle 1");
          completeCycle(prepared, direct, "post-event cycle 2");

          expect(directCalls.length).toBeGreaterThan(0);
          expect(new Set(directCalls.map((call) => call[0])).has("basal")).toBe(true);
          expect(new Set(directCalls.map((call) => call[0])).has("prism")).toBe(true);
          expect(directCalls.some((call) => Object.is(call[1], initialTempC))).toBe(true);
          expect(directCalls.some((call) => Object.is(call[1], targetTempC))).toBe(true);
        });
      }
    }
  }

  it("keeps the prepared temperature constants across a same-temperature reservoir event", () => {
    const common = {
      surfacePolicy: "aggregate-hv-g1h1-v5",
      dims: { nx: 12, ny: 12, nz: 9 },
      tempC: -4.5,
      sigmaInfinity: 0.01,
      dxUm: 0.35,
      pressurePa: 101_325,
      paramSet: "M1",
      cflFill: 0.1,
      relaxTol: 1e9,
      divTol: 1e-7,
      relaxMaxSweeps: 2,
      rngSeed: 0x1020_3040,
      noiseEpsilon: 0.25,
      domain: "hexPrism",
      farField: "reflecting",
      seedRadius: 2,
      seedThickness: 1,
    } as const;
    const prepared = new LKSolver(common);
    const direct = new LKSolver({
      ...common,
      testMode: true,
      testAlphaOverride: (facet, tempC, sigmaSurf) =>
        alphaHK(facet, tempC, sigmaSurf, common.paramSet),
    });
    const before = (prepared as unknown as LKInternals).preparedAlphaHK;

    completeCycle(prepared, direct, "before same-temperature event");
    const preparedEvent = prepared.applyTimelineEnvironment({
      tempC: common.tempC,
      sigmaInfinity: 0.02,
    });
    const directEvent = direct.applyTimelineEnvironment({
      tempC: common.tempC,
      sigmaInfinity: 0.02,
    });
    expect(preparedEvent).toEqual(directEvent);
    expect((prepared as unknown as LKInternals).preparedAlphaHK).toBe(before);
    expectIdentical(prepared, direct, "after same-temperature event");
    completeCycle(prepared, direct, "after same-temperature event cycle");
  });

  it("leaves arbitrary test overrides ahead of prepared production kinetics", () => {
    const callsA: Array<readonly [FacetClass, number, number]> = [];
    const callsB: Array<readonly [FacetClass, number, number]> = [];
    const options = {
      surfacePolicy: "aggregate-hv-g1h1-v6",
      dims: { nx: 12, ny: 12, nz: 9 },
      tempC: -5,
      sigmaInfinity: 0.01,
      dxUm: 0.35,
      paramSet: "M1",
      cflFill: 0.1,
      relaxTol: 1e9,
      divTol: 1e-7,
      relaxMaxSweeps: 2,
      rngSeed: 7,
      noiseEpsilon: 0.25,
      farField: "reflecting",
      testMode: true,
    } as const;
    const override = (
      calls: Array<readonly [FacetClass, number, number]>,
    ): ((facet: FacetClass, tempC: number, sigmaSurf: number) => number) =>
      (facet, tempC, sigmaSurf) => {
        calls.push([facet, tempC, sigmaSurf]);
        if (facet === "inhibited") return 0;
        if (facet === "rough") return 0.75;
        return tempC < -10 ? 0.25 : 0.5;
      };
    const a = new LKSolver({ ...options, testAlphaOverride: override(callsA) });
    const b = new LKSolver({ ...options, testAlphaOverride: override(callsB) });

    completeCycle(a, b, "override warm cycle");
    a.applyTimelineEnvironment({ tempC: -15, sigmaInfinity: 0.02 });
    b.applyTimelineEnvironment({ tempC: -15, sigmaInfinity: 0.02 });
    completeCycle(a, b, "override cold cycle");

    expect(callsA).toEqual(callsB);
    expect(callsA.some((call) => Object.is(call[1], -5))).toBe(true);
    expect(callsA.some((call) => Object.is(call[1], -15))).toBe(true);
  });

  it("does not publish a prepared temperature when an event rejects after staging it", () => {
    const common = {
      surfacePolicy: "aggregate-hv-g1h1-v6",
      dims: { nx: 12, ny: 12, nz: 9 },
      tempC: -4.5,
      sigmaInfinity: 0.01,
      dxUm: 0.35,
      paramSet: "M1",
      cflFill: 0.1,
      relaxTol: 1e9,
      divTol: 1e-7,
      relaxMaxSweeps: 2,
      rngSeed: 0x8765_4321,
      noiseEpsilon: 0.375,
      farField: "reflecting",
    } as const;
    const prepared = new LKSolver(common);
    const direct = new LKSolver({
      ...common,
      testMode: true,
      testAlphaOverride: (facet, tempC, sigmaSurf) =>
        alphaHK(facet, tempC, sigmaSurf, common.paramSet),
    });
    const active = prepared.sigma.findIndex(
      (_value, index) => prepared.a[index] === 0 && prepared.wall[index] === 0,
    );
    expect(active).toBeGreaterThanOrEqual(0);
    const original = prepared.sigma[active];
    expect(Object.is(direct.sigma[active], original)).toBe(true);
    prepared.sigma[active] = -1.000_000_1;
    direct.sigma[active] = -1.000_000_1;

    expect(() =>
      prepared.applyTimelineEnvironment({ tempC: -14.4, sigmaInfinity: 0.02 }),
    ).toThrow(/>= -1/);
    expect(() =>
      direct.applyTimelineEnvironment({ tempC: -14.4, sigmaInfinity: 0.02 }),
    ).toThrow(/>= -1/);
    prepared.sigma[active] = original;
    direct.sigma[active] = original;

    expectIdentical(prepared, direct, "after rejected temperature event");
    completeCycle(prepared, direct, "cycle after rejected temperature event");
    expect(prepared.tempC).toBe(-4.5);
  });
});
