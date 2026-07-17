import { describe, expect, it } from "vitest";
import {
  ggTimelineEnvironmentFromParams,
  mIce,
  GG_PRESETS,
  type GGParams,
  type GGTimelineEnvironment,
  type LKTimelineEnvironment,
} from "@vcc/core";
import { GGSolver, LKSolver } from "@vcc/solver-cpu";

function bytes(values: Uint8Array | Float64Array): Uint8Array {
  return new Uint8Array(values.buffer, values.byteOffset, values.byteLength).slice();
}

function ggState(solver: GGSolver): unknown {
  const internal = solver as unknown as { readonly cycleState: string };
  return {
    cycleState: internal.cycleState,
    tick: solver.tick,
    dirichletMeter: solver.dirichletMeter,
    attachedCount: solver.attachedCount,
    lastAttached: [...solver.lastAttached],
    environment: solver.timelineEnvironment(),
    a: bytes(solver.a),
    b: bytes(solver.b),
    d: bytes(solver.d),
  };
}

interface LKInternals {
  readonly cycleState: string;
  readonly sEff: Float64Array;
  readonly boundaryAlphaHK: Float64Array;
  readonly boundarySigma: Float64Array;
  readonly boundarySigmaOpp: Float64Array;
  readonly closedPlacedFillVaporUnits: number;
  readonly currentTemperatureSegmentStartFill: number;
}

function lkState(solver: LKSolver): unknown {
  const internal = solver as unknown as LKInternals;
  return {
    cycleState: internal.cycleState,
    tick: solver.tick,
    simTimeSeconds: solver.simTimeSeconds,
    attachedCount: solver.attachedCount,
    lastAttached: [...solver.lastAttached],
    environment: solver.timelineEnvironment(),
    lastRelaxation:
      solver.lastRelaxation === null ? null : { ...solver.lastRelaxation },
    lastMaxFillVelocityMS: solver.lastMaxFillVelocityMS,
    fillLedger: solver.fillLedger,
    holeFillDeficit: solver.holeFillDeficit,
    saturationClippedFill: solver.saturationClippedFill,
    closedPlacedFillVaporUnits: internal.closedPlacedFillVaporUnits,
    currentTemperatureSegmentStartFill: internal.currentTemperatureSegmentStartFill,
    a: bytes(solver.a),
    f: bytes(solver.f),
    sigma: bytes(solver.sigma),
    sEff: bytes(internal.sEff),
    boundaryAlphaHK: bytes(internal.boundaryAlphaHK),
    boundarySigma: bytes(internal.boundarySigma),
    boundarySigmaOpp: bytes(internal.boundarySigmaOpp),
  };
}

const ggOptions = {
  dims: { nx: 20, ny: 20, nz: 11 },
  params: GG_PRESETS.plate,
  rngSeed: 0x1234,
  noiseEpsilon: 0.25,
  domain: "hexPrism",
} as const;

const lkOptions = {
  surfacePolicy: "aggregate-hv-g1h1-v4",
  dims: { nx: 12, ny: 12, nz: 9 },
  tempC: -5,
  sigmaInfinity: 0.01,
  dxUm: 0.35,
  rngSeed: 0x1234,
  noiseEpsilon: 0.25,
  relaxTol: 1e9,
  relaxMaxSweeps: 1,
  farField: "reflecting",
  testAlphaOverride: () => 1,
} as const;

describe("SurfaceOperator cycle ownership hardening", () => {
  it("makes a G-G surface completion own exactly one tick and rejects unmatched completions", () => {
    const solver = new GGSolver(ggOptions);
    const initial = ggState(solver);
    expect(() => solver.advanceSurface()).toThrow(/exactly one unmatched relaxation/);
    expect(ggState(solver)).toEqual(initial);

    solver.relaxField();
    solver.advanceSurface();
    expect(solver.tick).toBe(1);
    const completed = ggState(solver);
    expect(() => solver.advanceSurface()).toThrow(/state=boundary/);
    expect(ggState(solver)).toEqual(completed);

    const report = solver.applyTimelineEnvironment(
      ggTimelineEnvironmentFromParams(GG_PRESETS.hollowColumn),
    );
    expect(report.boundary.completedCycles).toBe(1);
    expect(report.boundary.tick).toBe(1);
  });

  it("keeps repeated G-G diffusion diagnostics but poisons surface/event admission", () => {
    const solver = new GGSolver(ggOptions);
    solver.relaxField();
    const once = ggState(solver);
    solver.relaxField();
    expect(ggState(solver)).not.toEqual(once);
    const twice = ggState(solver);

    expect(() => solver.advanceSurface()).toThrow(/diagnosticRelaxed/);
    expect(ggState(solver)).toEqual(twice);
    expect(() =>
      solver.applyTimelineEnvironment(
        ggTimelineEnvironmentFromParams(GG_PRESETS.hollowColumn),
      ),
    ).toThrow(/diagnosticRelaxed/);
    expect(ggState(solver)).toEqual(twice);
  });

  it("makes direct and wrapper G-G cycles bit-identical with noise enabled", () => {
    const direct = new GGSolver(ggOptions);
    const wrapped = new GGSolver(ggOptions);
    for (let cycle = 1; cycle <= 8; cycle++) {
      direct.relaxField();
      direct.advanceSurface();
      wrapped.step();
      expect(direct.tick).toBe(cycle);
      expect(ggState(direct)).toEqual(ggState(wrapped));
    }
  });

  it("makes an LK surface completion own exactly one tick and rejects unmatched completions", () => {
    const direct = new LKSolver(lkOptions);
    const initial = lkState(direct);
    expect(() => direct.advanceSurface()).toThrow(/exactly one accepted converged relaxField/);
    expect(lkState(direct)).toEqual(initial);

    expect(direct.relaxField().converged).toBe(true);
    direct.advanceSurface();
    expect(direct.tick).toBe(1);
    const completed = lkState(direct);
    expect(() => direct.advanceSurface()).toThrow(/state=boundary/);
    expect(lkState(direct)).toEqual(completed);

    const wrapped = new LKSolver(lkOptions);
    expect(wrapped.step().relaxation.converged).toBe(true);
    expect(wrapped.tick).toBe(1);
  });

  it("makes direct and wrapper LK cycles bit-identical with noise enabled", () => {
    const direct = new LKSolver(lkOptions);
    const wrapped = new LKSolver(lkOptions);
    for (let cycle = 1; cycle <= 6; cycle++) {
      expect(direct.relaxField().converged).toBe(true);
      direct.advanceSurface();
      expect(wrapped.step().relaxation.converged).toBe(true);
      expect(direct.tick).toBe(cycle);
      expect(lkState(direct)).toEqual(lkState(wrapped));
    }
  });
});

describe("LK non-reentrant relaxation hardening", () => {
  it("keeps the last completed fill-velocity diagnostic until another surface completes", () => {
    const completed = (): readonly [LKSolver, number] => {
      const solver = new LKSolver(lkOptions);
      expect(solver.step().relaxation.converged).toBe(true);
      const value = solver.lastMaxFillVelocityMS;
      expect(value).toBeGreaterThan(0);
      return [solver, value];
    };

    const [ready, readyValue] = completed();
    expect(ready.relaxField().converged).toBe(true);
    expect(ready.lastMaxFillVelocityMS).toBe(readyValue);

    const [unconverged, unconvergedValue] = completed();
    (unconverged as unknown as { relaxTol: number }).relaxTol = 1e-30;
    expect(unconverged.relaxField().converged).toBe(false);
    expect(unconverged.lastMaxFillVelocityMS).toBe(unconvergedValue);

    const [retry, retryValue] = completed();
    expect(() =>
      retry.relaxField(() => {
        throw new Error("diagnostic-preservation callback failure");
      }),
    ).toThrow(/diagnostic-preservation callback failure/);
    expect(retry.lastMaxFillVelocityMS).toBe(retryValue);
    expect(retry.relaxField().converged).toBe(true);
    expect(retry.lastMaxFillVelocityMS).toBe(retryValue);
    retry.advanceSurface();
    expect(retry.lastMaxFillVelocityMS).toBeGreaterThan(0);
    expect(retry.lastMaxFillVelocityMS).not.toBe(retryValue);

    const [failedAdvance, failedAdvanceValue] = completed();
    expect(failedAdvance.relaxField().converged).toBe(true);
    Object.defineProperty(failedAdvance, "lastAttached", {
      configurable: true,
      get: () => [],
      set: () => {
        throw new Error("late surface completion failure");
      },
    });
    expect(() => failedAdvance.advanceSurface()).toThrow(/late surface completion failure/);
    expect(failedAdvance.lastMaxFillVelocityMS).toBe(failedAdvanceValue);
  });

  it("rejects the stale-readiness second-relaxation exploit before its callback runs", () => {
    const solver = new LKSolver(lkOptions);
    expect(solver.relaxField().converged).toBe(true);
    const accepted = lkState(solver);
    let callbackRan = false;
    expect(() =>
      solver.relaxField(() => {
        callbackRan = true;
        solver.advanceSurface();
      }),
    ).toThrow(/state ready/);
    expect(callbackRan).toBe(false);
    expect(lkState(solver)).toEqual(accepted);

    solver.advanceSurface();
    expect(solver.tick).toBe(1);
  });

  it("rejects recursive relax, advance, transition, and step calls during a callback", () => {
    const solver = new LKSolver(lkOptions);
    const topology = bytes(solver.a);
    const fill = bytes(solver.f);
    const rejected: string[] = [];
    const report = solver.relaxField(() => {
      const attempts: Array<readonly [string, () => unknown]> = [
        ["relax", () => solver.relaxField()],
        ["advance", () => solver.advanceSurface()],
        [
          "transition",
          () => solver.applyTimelineEnvironment({ tempC: -15, sigmaInfinity: 0.01 }),
        ],
        ["step", () => solver.step()],
      ];
      for (const [name, attempt] of attempts) {
        try {
          attempt();
        } catch (error) {
          expect(String(error)).toMatch(/relaxing/);
          rejected.push(name);
        }
      }
    });
    expect(report.converged).toBe(true);
    expect(rejected).toEqual(["relax", "advance", "transition", "step"]);
    expect(bytes(solver.a)).toEqual(topology);
    expect(bytes(solver.f)).toEqual(fill);
    expect(solver.tick).toBe(0);
    solver.advanceSurface();
    expect(solver.tick).toBe(1);
  });

  it("leaves a throwing callback incomplete but recoverable without topology corruption", () => {
    const solver = new LKSolver(lkOptions);
    const topology = bytes(solver.a);
    const fill = bytes(solver.f);
    expect(() =>
      solver.relaxField(() => {
        throw new Error("adversarial callback failure");
      }),
    ).toThrow(/adversarial callback failure/);
    expect(bytes(solver.a)).toEqual(topology);
    expect(bytes(solver.f)).toEqual(fill);
    expect(solver.tick).toBe(0);
    expect(solver.lastRelaxation).toBeNull();
    for (let index = 0; index < solver.a.length; index++) {
      if (solver.a[index] === 1) expect(solver.sigma[index]).toBe(0);
    }
    expect(() => solver.advanceSurface()).toThrow(/state=incomplete/);
    expect(() =>
      solver.applyTimelineEnvironment({ tempC: -15, sigmaInfinity: 0.01 }),
    ).toThrow(/state=incomplete/);

    expect(solver.relaxField().converged).toBe(true);
    solver.advanceSurface();
    expect(solver.tick).toBe(1);
  });
});

class AliasingFloat64Array extends Float64Array<ArrayBuffer> {
  override slice(_start?: number, _end?: number): Float64Array<ArrayBuffer> {
    return this;
  }
}

function aliasingFloat64(values: Float64Array): AliasingFloat64Array {
  const result = new AliasingFloat64Array(
    new ArrayBuffer(values.length * Float64Array.BYTES_PER_ELEMENT),
  );
  for (let index = 0; index < values.length; index++) result[index] = values[index];
  return result;
}

class AliasingArray extends Array<number> {
  override slice(_start?: number, _end?: number): number[] {
    return this;
  }
}

function aliasingVector(values: readonly number[]): AliasingArray {
  const result = new AliasingArray();
  result.push(...values);
  return result;
}

describe("caller-controlled input snapshot hardening", () => {
  it("copies G-G typed-array subclasses into guaranteed base storage", () => {
    const source: GGParams = {
      rho: GG_PRESETS.plate.rho,
      phi: GG_PRESETS.plate.phi,
      kappa: aliasingFloat64(GG_PRESETS.plate.kappa),
      mu: aliasingFloat64(GG_PRESETS.plate.mu),
      ggThreshBeta: aliasingFloat64(GG_PRESETS.plate.ggThreshBeta),
    };
    const expected = ggTimelineEnvironmentFromParams(GG_PRESETS.plate);
    const solver = new GGSolver({ ...ggOptions, params: source });
    source.kappa[1] = 0.99;
    source.mu[1] = 0.99;
    source.ggThreshBeta[1] = 0.99;
    expect(solver.timelineEnvironment()).toEqual(expected);

    const exposed = solver.params;
    expect(Object.getPrototypeOf(exposed.kappa)).toBe(Float64Array.prototype);
    expect(Object.getPrototypeOf(exposed.mu)).toBe(Float64Array.prototype);
    expect(Object.getPrototypeOf(exposed.ggThreshBeta)).toBe(Float64Array.prototype);
    exposed.kappa[1] = 0.88;
    expect(solver.timelineEnvironment()).toEqual(expected);
  });

  it("snapshots changing G-G accessors once and rejects recursive calls while transitioning", () => {
    const solver = new GGSolver(ggOptions);
    const valid = ggTimelineEnvironmentFromParams(GG_PRESETS.hollowColumn);
    const reads: Record<keyof GGTimelineEnvironment, number> = {
      rho: 0,
      phi: 0,
      kappa: 0,
      mu: 0,
      ggThreshBeta: 0,
    };
    const recursiveRejections: string[] = [];
    const target = {} as GGTimelineEnvironment;
    const getter = <K extends keyof GGTimelineEnvironment>(
      key: K,
      first: GGTimelineEnvironment[K],
    ): (() => GGTimelineEnvironment[K]) => () => {
      reads[key]++;
      if (key === "rho" && reads[key] === 1) {
        const attempts: Array<readonly [string, () => unknown]> = [
          ["relax", () => solver.relaxField()],
          ["advance", () => solver.advanceSurface()],
          ["transition", () => solver.applyTimelineEnvironment(valid)],
        ];
        for (const [name, attempt] of attempts) {
          try {
            attempt();
          } catch (error) {
            expect(String(error)).toMatch(/transitioning/);
            recursiveRejections.push(name);
          }
        }
      }
      if (reads[key] > 1) return Number.NaN as GGTimelineEnvironment[K];
      if (Array.isArray(first)) {
        return aliasingVector(first) as unknown as GGTimelineEnvironment[K];
      }
      return first;
    };
    for (const key of ["rho", "phi", "kappa", "mu", "ggThreshBeta"] as const) {
      Object.defineProperty(target, key, { enumerable: true, get: getter(key, valid[key]) });
    }

    const report = solver.applyTimelineEnvironment(target);
    expect(reads).toEqual({ rho: 1, phi: 1, kappa: 1, mu: 1, ggThreshBeta: 1 });
    expect(recursiveRejections).toEqual(["relax", "advance", "transition"]);
    expect(report.afterEnvironment).toEqual(valid);
    expect(solver.timelineEnvironment()).toEqual(valid);
  });

  it("restores the G-G boundary after throwing and uncaught-recursive getters", () => {
    const solver = new GGSolver(ggOptions);
    const before = ggState(solver);
    const throwing = {} as GGTimelineEnvironment;
    Object.defineProperties(throwing, {
      rho: { enumerable: true, get: () => { throw new Error("G-G getter failed"); } },
      phi: { enumerable: true, value: 0 },
      kappa: { enumerable: true, value: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1] },
      mu: { enumerable: true, value: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01] },
      ggThreshBeta: { enumerable: true, value: [1, 1, 1, 1, 1, 1, 1] },
    });
    expect(() => solver.applyTimelineEnvironment(throwing)).toThrow(/G-G getter failed/);
    expect(ggState(solver)).toEqual(before);

    const recursive = {} as GGTimelineEnvironment;
    Object.defineProperties(recursive, {
      rho: {
        enumerable: true,
        get: () => solver.applyTimelineEnvironment(
          ggTimelineEnvironmentFromParams(GG_PRESETS.hollowColumn),
        ) as unknown as number,
      },
      phi: { enumerable: true, value: 0 },
      kappa: { enumerable: true, value: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1] },
      mu: { enumerable: true, value: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01] },
      ggThreshBeta: { enumerable: true, value: [1, 1, 1, 1, 1, 1, 1] },
    });
    expect(() => solver.applyTimelineEnvironment(recursive)).toThrow(/transitioning/);
    expect(ggState(solver)).toEqual(before);
    expect(() => solver.applyTimelineEnvironment(
      ggTimelineEnvironmentFromParams(GG_PRESETS.hollowColumn),
    )).not.toThrow();
  });

  it("snapshots changing LK accessors exactly once", () => {
    const solver = new LKSolver(lkOptions);
    const reads = { tempC: 0, sigmaInfinity: 0 };
    const target = {} as LKTimelineEnvironment;
    Object.defineProperties(target, {
      tempC: {
        enumerable: true,
        get: () => (++reads.tempC === 1 ? -15 : Number.NaN),
      },
      sigmaInfinity: {
        enumerable: true,
        get: () => (++reads.sigmaInfinity === 1 ? 0.02 : Number.NaN),
      },
    });
    const report = solver.applyTimelineEnvironment(target);
    expect(reads).toEqual({ tempC: 1, sigmaInfinity: 1 });
    expect(report.afterEnvironment).toEqual({ tempC: -15, sigmaInfinity: 0.02 });
    expect(solver.timelineEnvironment()).toEqual({ tempC: -15, sigmaInfinity: 0.02 });
  });

  it("restores the LK boundary after a throwing getter", () => {
    const solver = new LKSolver(lkOptions);
    const before = lkState(solver);
    const target = {} as LKTimelineEnvironment;
    Object.defineProperties(target, {
      tempC: { enumerable: true, get: () => { throw new Error("LK getter failed"); } },
      sigmaInfinity: { enumerable: true, value: 0.02 },
    });
    expect(() => solver.applyTimelineEnvironment(target)).toThrow(/LK getter failed/);
    expect(lkState(solver)).toEqual(before);
    expect(() =>
      solver.applyTimelineEnvironment({ tempC: -15, sigmaInfinity: 0.02 }),
    ).not.toThrow();
  });

  it("rejects a recursive LK getter and restores the completed-cycle boundary", () => {
    const solver = new LKSolver(lkOptions);
    const before = lkState(solver);
    const target = {} as LKTimelineEnvironment;
    Object.defineProperties(target, {
      tempC: {
        enumerable: true,
        get: () => {
          const result = solver.applyTimelineEnvironment({
            tempC: -15,
            sigmaInfinity: 0.02,
          });
          return result as unknown as number;
        },
      },
      sigmaInfinity: { enumerable: true, value: 0.02 },
    });
    expect(() => solver.applyTimelineEnvironment(target)).toThrow(/transitioning/);
    expect(lkState(solver)).toEqual(before);
    expect(() =>
      solver.applyTimelineEnvironment({ tempC: -15, sigmaInfinity: 0.02 }),
    ).not.toThrow();
  });
});

describe("LK temperature-segment vapor ledger", () => {
  it("retains exact fixed-temperature multiplication across many interface steps", () => {
    const solver = new LKSolver(lkOptions);
    for (let cycle = 1; cycle <= 8; cycle++) {
      expect(solver.step().relaxation.converged).toBe(true);
      expect(solver.tick).toBe(cycle);
      expect(solver.ledger().fillLedgerVaporUnits).toBe(solver.fillLedger * mIce(-5));
    }
  });

  it("does not split a segment for a same-temperature sigma event", () => {
    const solver = new LKSolver(lkOptions);
    for (let cycle = 0; cycle < 4; cycle++) solver.step();
    const internal = solver as unknown as LKInternals;
    const closedBefore = internal.closedPlacedFillVaporUnits;
    const startBefore = internal.currentTemperatureSegmentStartFill;
    const vaporBefore = solver.ledger().fillLedgerVaporUnits;

    solver.applyTimelineEnvironment({ tempC: -5, sigmaInfinity: 0.02 });
    expect(solver.ledger().fillLedgerVaporUnits).toBe(vaporBefore);
    expect(internal.closedPlacedFillVaporUnits).toBe(closedBefore);
    expect(internal.currentTemperatureSegmentStartFill).toBe(startBefore);
    for (let cycle = 0; cycle < 4; cycle++) {
      solver.step();
      expect(solver.ledger().fillLedgerVaporUnits).toBe(solver.fillLedger * mIce(-5));
    }
  });

  it("closes exact temperature segments while events leave the ledger unchanged", () => {
    const solver = new LKSolver(lkOptions);
    let segmentStartFill = 0;
    let expectedClosed = 0;
    for (let cycle = 0; cycle < 3; cycle++) solver.step();
    expectedClosed = solver.fillLedger * mIce(-5);
    const warmEventLedger = solver.ledger().fillLedgerVaporUnits;
    solver.applyTimelineEnvironment({ tempC: -15, sigmaInfinity: 0.01 });
    expect(solver.ledger().fillLedgerVaporUnits).toBe(warmEventLedger);
    segmentStartFill = solver.fillLedger;

    for (let cycle = 0; cycle < 3; cycle++) solver.step();
    expectedClosed += (solver.fillLedger - segmentStartFill) * mIce(-15);
    expect(solver.ledger().fillLedgerVaporUnits).toBe(expectedClosed);
    const coldEventLedger = solver.ledger().fillLedgerVaporUnits;
    solver.applyTimelineEnvironment({ tempC: -25, sigmaInfinity: 0.01 });
    expect(solver.ledger().fillLedgerVaporUnits).toBe(coldEventLedger);
    segmentStartFill = solver.fillLedger;

    for (let cycle = 0; cycle < 3; cycle++) solver.step();
    const expected = expectedClosed + (solver.fillLedger - segmentStartFill) * mIce(-25);
    const actual = solver.ledger().fillLedgerVaporUnits as number;
    expect(actual).toBe(expected);
    expect(Math.abs(actual - solver.fillLedger * mIce(-25))).toBeGreaterThan(
      1e-3 * Math.abs(actual),
    );
  });
});
