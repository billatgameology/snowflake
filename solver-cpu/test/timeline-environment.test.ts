import { describe, expect, it } from "vitest";
import {
  cSat,
  ggTimelineEnvironmentFromParams,
  kineticLength,
  mIce,
  totalMass,
  vKin,
  GG_PRESETS,
  type GGTimelineEnvironment,
  type LKTimelineEnvironment,
} from "@vcc/core";
import { GGSolver, LKSolver } from "@vcc/solver-cpu";

function bytes(values: Uint8Array | Float64Array): Uint8Array {
  return new Uint8Array(values.buffer, values.byteOffset, values.byteLength).slice();
}

function ggSnapshot(solver: GGSolver): unknown {
  const internal = solver as unknown as { readonly surfaceUpdatePending: boolean };
  return {
    environment: solver.timelineEnvironment(),
    tick: solver.tick,
    dirichletMeter: solver.dirichletMeter,
    attachedCount: solver.attachedCount,
    lastAttached: [...solver.lastAttached],
    surfaceUpdatePending: internal.surfaceUpdatePending,
    a: bytes(solver.a),
    b: bytes(solver.b),
    d: bytes(solver.d),
    mass: totalMass(solver.b, solver.d),
  };
}

interface LKInternalSnapshotView {
  readonly surfaceReady: boolean;
  readonly relaxationStartedForCycle: boolean;
  readonly sEff: Float64Array;
  readonly boundaryAlphaHK: Float64Array;
  readonly boundarySigma: Float64Array;
  readonly boundarySigmaOpp: Float64Array;
  readonly cumulativePlacedFillVaporUnits: number;
}

function lkSnapshot(solver: LKSolver): unknown {
  const internal = solver as unknown as LKInternalSnapshotView;
  return {
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
    cumulativePlacedFillVaporUnits: internal.cumulativePlacedFillVaporUnits,
    lastRelaxation:
      solver.lastRelaxation === null ? null : { ...solver.lastRelaxation },
    surfaceReady: internal.surfaceReady,
    relaxationStartedForCycle: internal.relaxationStartedForCycle,
    a: bytes(solver.a),
    f: bytes(solver.f),
    sigma: bytes(solver.sigma),
    sEff: bytes(internal.sEff),
    boundaryAlphaHK: bytes(internal.boundaryAlphaHK),
    boundarySigma: bytes(internal.boundarySigma),
    boundarySigmaOpp: bytes(internal.boundarySigmaOpp),
  };
}

const ggDims = { nx: 20, ny: 20, nz: 11 } as const;

describe("GGSolver abrupt environment transitions (ADR 0011)", () => {
  it("replaces a complete owned environment without touching state, mass, or tick", () => {
    const source = {
      ...GG_PRESETS.plate,
      kappa: GG_PRESETS.plate.kappa.slice(),
      mu: GG_PRESETS.plate.mu.slice(),
      ggThreshBeta: GG_PRESETS.plate.ggThreshBeta.slice(),
    };
    const solver = new GGSolver({
      dims: ggDims,
      params: source,
      rngSeed: 1,
      domain: "hexPrism",
    });
    source.kappa[1] = 0.75;
    expect(solver.timelineEnvironment()).toEqual(
      ggTimelineEnvironmentFromParams(GG_PRESETS.plate),
    );
    const exposed = solver.params;
    exposed.mu[1] = 0.5;
    expect(solver.timelineEnvironment()).toEqual(
      ggTimelineEnvironmentFromParams(GG_PRESETS.plate),
    );

    for (let cycle = 0; cycle < 3; cycle++) solver.step();
    const before = ggSnapshot(solver) as ReturnType<typeof ggSnapshot>;
    const target = ggTimelineEnvironmentFromParams({
      ...GG_PRESETS.hollowColumn,
      rho: 0.11,
      phi: 0.01,
    });
    const report = solver.applyTimelineEnvironment(target);

    expect(report).toEqual({
      operator: "GGThreshold",
      boundary: { phase: "completedCycleBoundary", completedCycles: 3, tick: 3 },
      beforeEnvironment: ggTimelineEnvironmentFromParams(GG_PRESETS.plate),
      afterEnvironment: target,
    });
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
    const after = ggSnapshot(solver) as Record<string, unknown>;
    const beforeRecord = before as Record<string, unknown>;
    for (const key of [
      "tick",
      "dirichletMeter",
      "attachedCount",
      "lastAttached",
      "surfaceUpdatePending",
      "a",
      "b",
      "d",
      "mass",
    ]) {
      expect(after[key], key).toEqual(beforeRecord[key]);
    }
    expect(solver.timelineEnvironment()).toEqual(target);

    // Both the call input and returned snapshots are detached from the live controls.
    (target.kappa as unknown as number[])[0] = 0.9;
    (report.afterEnvironment.mu as unknown as number[])[0] = 0.9;
    expect(solver.timelineEnvironment()).toEqual(
      ggTimelineEnvironmentFromParams({
        ...GG_PRESETS.hollowColumn,
        rho: 0.11,
        phi: 0.01,
      }),
    );
  });

  it("rejects no-op, malformed, and non-finite targets atomically", () => {
    const solver = new GGSolver({
      dims: ggDims,
      params: GG_PRESETS.plate,
      rngSeed: 1,
      domain: "hexPrism",
    });
    const before = ggSnapshot(solver);
    const noOp = solver.timelineEnvironment();
    const shortVector = {
      ...noOp,
      kappa: noOp.kappa.slice(0, 6),
    } as unknown as GGTimelineEnvironment;
    const nonFinite = {
      ...noOp,
      rho: Number.NaN,
    } as GGTimelineEnvironment;
    const extraKey = {
      ...ggTimelineEnvironmentFromParams(GG_PRESETS.hollowColumn),
      interpolation: "ramp",
    } as unknown as GGTimelineEnvironment;
    for (const [label, target] of [
      ["no-op", noOp],
      ["short vector", shortVector],
      ["non-finite", nonFinite],
      ["extra key", extraKey],
    ] as const) {
      expect(() => solver.applyTimelineEnvironment(target), label).toThrow();
      expect(ggSnapshot(solver), label).toEqual(before);
    }
    solver.applyTimelineEnvironment(
      ggTimelineEnvironmentFromParams(GG_PRESETS.hollowColumn),
    );
  });

  it("rejects a change after relaxation and leaves the complete mid-cycle state untouched", () => {
    const solver = new GGSolver({
      dims: ggDims,
      params: GG_PRESETS.plate,
      rngSeed: 1,
      domain: "hexPrism",
    });
    solver.relaxField();
    const before = ggSnapshot(solver);
    expect(() =>
      solver.applyTimelineEnvironment(ggTimelineEnvironmentFromParams(GG_PRESETS.hollowColumn)),
    ).toThrow(/completed-cycle boundary/);
    expect(ggSnapshot(solver)).toEqual(before);
    solver.advanceSurface();
    expect(() =>
      solver.applyTimelineEnvironment(ggTimelineEnvironmentFromParams(GG_PRESETS.hollowColumn)),
    ).not.toThrow();
  });
});

const lkBase = {
  surfacePolicy: "aggregate-hv-g1h1-v4",
  dims: { nx: 12, ny: 12, nz: 9 },
  tempC: -15,
  sigmaInfinity: 0.002,
  dxUm: 0.35,
  rngSeed: 1,
  relaxTol: 1e9,
  relaxMaxSweeps: 1,
} as const;

function firstActiveUnattached(solver: LKSolver): number {
  const index = solver.a.findIndex(
    (attached, position) => attached === 0 && solver.wall[position] === 0,
  );
  if (index < 0) throw new Error("fixture has no active unattached cell");
  return index;
}

describe("LKSolver abrupt environment transitions (ADR 0011)", () => {
  it("independently conserves nonuniform cellwise vapor density, including negative sigma and shell", () => {
    const solver = new LKSolver({ ...lkBase, farField: "dirichlet" });
    for (let index = 0; index < solver.sigma.length; index++) {
      if (solver.a[index] === 0 && solver.wall[index] === 0) {
        solver.sigma[index] = -0.45 + (index % 13) * 0.065;
      }
    }
    const oldSigma = solver.sigma.slice();
    const oldAttached = bytes(solver.a);
    const oldWall = bytes(solver.wall);
    const oldFill = bytes(solver.f);
    const oldTick = solver.tick;
    const oldTime = solver.simTimeSeconds;
    const oldLedger = solver.ledger();
    const oldCSat = cSat(-15);
    const newCSat = cSat(-5);
    let holdingSigmaFixedWouldFail = false;
    let expectedTransformed = 0;
    let expectedShell = 0;
    const shell = new Set<number>(solver.dirichletCells);
    const expected = oldSigma.slice();
    for (let index = 0; index < oldSigma.length; index++) {
      if (solver.a[index] === 1 || solver.wall[index] === 1) continue;
      expected[index] = (1 + oldSigma[index]) * oldCSat / newCSat - 1;
      expectedTransformed++;
      if (shell.has(index)) expectedShell++;
      if (!Object.is(expected[index], oldSigma[index])) holdingSigmaFixedWouldFail = true;
    }
    expect(holdingSigmaFixedWouldFail).toBe(true);

    const target: LKTimelineEnvironment = { tempC: -5, sigmaInfinity: 0.003 };
    const report = solver.applyTimelineEnvironment(target);
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
    expect(report.densityTransform.transformedCellCount).toBe(expectedTransformed);
    expect(report.densityTransform.transformedDirichletShellCellCount).toBe(expectedShell);
    expect(report.densityTransform.transformedInteriorCellCount + expectedShell).toBe(
      expectedTransformed,
    );
    expect(report.reservoir.shellReclampPending).toBe(true);
    expect(report.derivedAfter).toEqual({
      cSatPerCubicMeter: cSat(-5),
      vKinMS: vKin(-5),
      x0M: kineticLength(-5, solver.pressurePa),
      mIceLedger: mIce(-5),
      maximumKineticVelocityScaleMS: 6 * vKin(-5) * 0.003,
      maximumKineticFillRateScalePerSecond: 6 * vKin(-5) * 0.003 / solver.dxM,
    });
    expect(solver.tempC).toBe(-5);
    expect(solver.sigmaInfinity).toBe(0.003);
    expect(solver.vKinMS).toBe(vKin(-5));
    expect(solver.x0M).toBe(kineticLength(-5, solver.pressurePa));
    expect(solver.mIceLedger).toBe(mIce(-5));

    for (let index = 0; index < expected.length; index++) {
      if (solver.a[index] === 0 && solver.wall[index] === 0) {
        expect(solver.sigma[index], `transformed cell ${index}`).toBe(expected[index]);
        const densityBefore = (1 + oldSigma[index]) * oldCSat;
        const densityAfter = (1 + solver.sigma[index]) * newCSat;
        expect(Math.abs(densityAfter - densityBefore) / Math.max(1, Math.abs(densityBefore))).toBeLessThan(
          8 * Number.EPSILON,
        );
      } else {
        expect(Object.is(solver.sigma[index], oldSigma[index]), `excluded cell ${index}`).toBe(true);
      }
    }
    expect(bytes(solver.a)).toEqual(oldAttached);
    expect(bytes(solver.wall)).toEqual(oldWall);
    expect(bytes(solver.f)).toEqual(oldFill);
    expect(solver.tick).toBe(oldTick);
    expect(solver.simTimeSeconds).toBe(oldTime);
    expect(solver.ledger()).toEqual(oldLedger);

    const transformedShell = [...solver.dirichletCells]
      .filter((index) => solver.a[index] === 0 && solver.wall[index] === 0)
      .map((index) => solver.sigma[index]);
    expect(transformedShell.some((value) => value !== 0.003)).toBe(true);
    solver.relaxField();
    for (const index of solver.dirichletCells) {
      if (solver.a[index] === 0 && solver.wall[index] === 0) {
        expect(solver.sigma[index]).toBe(0.003);
      }
    }
  });

  it("preserves the field bitwise when only the explicit far-field target changes", () => {
    const solver = new LKSolver({ ...lkBase, farField: "dirichlet" });
    for (let index = 0; index < solver.sigma.length; index++) {
      if (solver.a[index] === 0 && solver.wall[index] === 0) {
        solver.sigma[index] = -0.2 + (index % 9) * 0.05;
      }
    }
    const before = bytes(solver.sigma);
    const report = solver.applyTimelineEnvironment({ tempC: -15, sigmaInfinity: 0.004 });
    expect(report.densityTransform.temperatureChanged).toBe(false);
    expect(report.densityTransform.transformedCellCount).toBe(0);
    expect(report.densityTransform.cSatRatioOldToNew).toBe(1);
    expect(bytes(solver.sigma)).toEqual(before);
    expect(solver.maximumKineticVelocityScaleMS).toBe(6 * vKin(-15) * 0.004);
    solver.relaxField();
    for (const index of solver.dirichletCells) {
      if (solver.a[index] === 0 && solver.wall[index] === 0) {
        expect(solver.sigma[index]).toBe(0.004);
      }
    }
  });

  it("invalid, no-op, overflowed, malformed, and impossible-density changes are atomic", () => {
    const solver = new LKSolver({ ...lkBase, farField: "reflecting" });
    const before = lkSnapshot(solver);
    const cases: Array<readonly [string, LKTimelineEnvironment]> = [
      ["no-op", solver.timelineEnvironment()],
      ["bad temperature", { tempC: -51, sigmaInfinity: 0.002 }],
      ["overflowed rate", { tempC: -5, sigmaInfinity: Number.MAX_VALUE }],
      [
        "extra key",
        { tempC: -5, sigmaInfinity: 0.002, ramp: true } as unknown as LKTimelineEnvironment,
      ],
    ];
    for (const [label, target] of cases) {
      expect(() => solver.applyTimelineEnvironment(target), label).toThrow();
      expect(lkSnapshot(solver), label).toEqual(before);
    }

    const active = firstActiveUnattached(solver);
    solver.sigma[active] = -1.000_000_1;
    const impossible = lkSnapshot(solver);
    expect(() =>
      solver.applyTimelineEnvironment({ tempC: -5, sigmaInfinity: 0.002 }),
    ).toThrow(/>= -1/);
    expect(lkSnapshot(solver)).toEqual(impossible);
  });

  it("rejects both accepted and unconverged mid-cycle states without shifting any bit", () => {
    const converged = new LKSolver({ ...lkBase, farField: "reflecting" });
    expect(converged.relaxField().converged).toBe(true);
    const convergedMidCycle = lkSnapshot(converged);
    expect(() =>
      converged.applyTimelineEnvironment({ tempC: -5, sigmaInfinity: 0.002 }),
    ).toThrow(/completed interface-cycle boundary/);
    expect(lkSnapshot(converged)).toEqual(convergedMidCycle);
    converged.advanceSurface();
    expect(() =>
      converged.applyTimelineEnvironment({ tempC: -5, sigmaInfinity: 0.002 }),
    ).not.toThrow();

    const unconverged = new LKSolver({
      ...lkBase,
      farField: "reflecting",
      relaxTol: 1e-30,
      relaxMaxSweeps: 1,
    });
    expect(unconverged.relaxField().converged).toBe(false);
    const unconvergedMidCycle = lkSnapshot(unconverged);
    expect(() =>
      unconverged.applyTimelineEnvironment({ tempC: -5, sigmaInfinity: 0.002 }),
    ).toThrow(/completed interface-cycle boundary/);
    expect(lkSnapshot(unconverged)).toEqual(unconvergedMidCycle);
  });

  it("invalidates accepted kinetics caches while preserving topology, time, and ledgers", () => {
    const solver = new LKSolver({
      ...lkBase,
      tempC: -5,
      sigmaInfinity: 0.01,
      farField: "reflecting",
      testAlphaOverride: () => 1,
    });
    expect(solver.relaxField().converged).toBe(true);
    const internal = solver as unknown as LKInternalSnapshotView;
    expect([...internal.boundaryAlphaHK].some((value) => value > 0)).toBe(true);
    solver.advanceSurface();
    const topology = bytes(solver.a);
    const fill = bytes(solver.f);
    const tick = solver.tick;
    const time = solver.simTimeSeconds;
    const ledger = solver.ledger();
    const report = solver.applyTimelineEnvironment({ tempC: -15, sigmaInfinity: 0.01 });

    expect(report.boundary).toEqual({
      phase: "completedCycleBoundary",
      completedCycles: tick,
      tick,
      simTimeSeconds: time,
    });
    expect([...internal.sEff].every((value) => value === 0)).toBe(true);
    expect([...internal.boundaryAlphaHK].every((value) => value === 0)).toBe(true);
    expect([...internal.boundarySigma].every((value) => value === 0)).toBe(true);
    expect([...internal.boundarySigmaOpp].every((value) => value === 0)).toBe(true);
    expect(solver.lastRelaxation).toBeNull();
    expect(solver.lastMaxFillVelocityMS).toBe(0);
    expect(() => solver.advanceSurface()).toThrow(/converged relaxField/);
    expect(bytes(solver.a)).toEqual(topology);
    expect(bytes(solver.f)).toEqual(fill);
    expect(solver.tick).toBe(tick);
    expect(solver.simTimeSeconds).toBe(time);
    expect(solver.ledger()).toEqual({ ...ledger, lastDivergenceResidual: null });
  });

  it("accumulates placed-fill vapor units at each step's temperature", () => {
    const solver = new LKSolver({
      ...lkBase,
      tempC: -5,
      sigmaInfinity: 0.01,
      farField: "reflecting",
      testAlphaOverride: () => 1,
    });
    expect(solver.relaxField().converged).toBe(true);
    solver.advanceSurface();
    const fillAfterWarm = solver.fillLedger;
    const warmVaporUnits = solver.ledger().fillLedgerVaporUnits as number;
    expect(fillAfterWarm).toBeGreaterThan(0);
    expect(warmVaporUnits).toBe(fillAfterWarm * mIce(-5));

    solver.applyTimelineEnvironment({ tempC: -15, sigmaInfinity: 0.01 });
    expect(solver.relaxField().converged).toBe(true);
    solver.advanceSurface();
    const coldFillDelta = solver.fillLedger - fillAfterWarm;
    expect(coldFillDelta).toBeGreaterThan(0);
    const expectedStepLocal = fillAfterWarm * mIce(-5) + coldFillDelta * mIce(-15);
    const actual = solver.ledger().fillLedgerVaporUnits as number;
    const wrongFinalTemperatureProduct = solver.fillLedger * mIce(-15);
    expect(Math.abs(actual - expectedStepLocal)).toBeLessThanOrEqual(
      8 * Number.EPSILON * Math.max(1, Math.abs(expectedStepLocal)),
    );
    expect(Math.abs(actual - wrongFinalTemperatureProduct)).toBeGreaterThan(
      1e-3 * Math.abs(actual),
    );
  });
});
