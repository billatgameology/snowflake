import { describe, expect, it } from "vitest";
import {
  phase5LkDivergenceFloat32,
  reducePhase5LkFloat32,
  runPhase5LkReductionShadow,
  runPhase5LkZeroExchangeProbe,
} from "../src/phase5-lk-reduction-shadow.ts";
import {
  PHASE5_FIXTURES,
  float32SmootherDriftAbsLimit,
  type Phase5LKFixture,
} from "../src/phase5-protocol.ts";

describe("Phase 5 LK f32 reduction shadow", () => {
  it("pins the deterministic 256-lane recursive reduction composition", () => {
    const values = Float32Array.from(
      { length: 513 },
      (_, index) => Math.fround((index % 11) * 1e-4 - 3e-4),
    );
    const first = reducePhase5LkFloat32(values, "sum");
    const second = reducePhase5LkFloat32(values, "sum");
    expect(Object.is(first, second)).toBe(true);
    expect(first).toBe(0.101_199_999_451_637_27);
    expect(reducePhase5LkFloat32(values, "max")).toBe(Math.max(...values));
    expect(reducePhase5LkFloat32(values, "min")).toBe(Math.min(...values));
    expect(() => reducePhase5LkFloat32([], "sum")).toThrow(/nonempty/);
  });

  it("pins the representable zero-exchange divergence branch", () => {
    expect(phase5LkDivergenceFloat32(0, 0, 0)).toBe(0);
    expect(phase5LkDivergenceFloat32(1e-8, 0, 0)).toBe(Infinity);
    expect(phase5LkDivergenceFloat32(0.25, 0.5, 0.75)).toBe(0);
    expect(() => phase5LkDivergenceFloat32(Number.NaN, 0, 1)).toThrow(/finite/);
    expect(() =>
      phase5LkDivergenceFloat32(1, 0, 2 ** -149),
    ).toThrow(/overflowed/);
    const integrated = runPhase5LkZeroExchangeProbe();
    expect(integrated.shellInjection).toBeGreaterThan(0);
    expect(integrated.surfaceExchange).toBe(0);
    expect(integrated.divergenceResidual).toBe(Infinity);
    expect(integrated.residual).toBeGreaterThan(0);
    expect(integrated.converged).toBe(false);
  });

  it("measures every frozen blocking LK topology before production WGSL exists", () => {
    const report = runPhase5LkReductionShadow();
    expect(report.schema).toBe("phase5-lk-f32-reduction-shadow-v1");
    expect(report.reductionWidth).toBe(256);
    expect(report.fixedPointIterations).toBe(60);
    expect(report.samples).toHaveLength(9);
    expect(
      report.samples.map(({ fixtureId, completedStep }) => ({
        fixtureId,
        completedStep,
      })),
    ).toEqual([
      { fixtureId: "lk-warm-dirichlet-24x24x18", completedStep: 0 },
      { fixtureId: "lk-warm-dirichlet-24x24x18", completedStep: 1 },
      { fixtureId: "lk-warm-dirichlet-24x24x18", completedStep: 2 },
      { fixtureId: "lk-warm-dirichlet-24x24x18", completedStep: 3 },
      { fixtureId: "lk-cold-dirichlet-noise-timeline-18x18x30", completedStep: 0 },
      { fixtureId: "lk-cold-dirichlet-noise-timeline-18x18x30", completedStep: 1 },
      { fixtureId: "lk-cold-dirichlet-noise-timeline-18x18x30", completedStep: 2 },
      { fixtureId: "lk-cold-dirichlet-noise-timeline-18x18x30", completedStep: 3 },
      { fixtureId: "lk-reflecting-diagnostic-17x19x15", completedStep: 0 },
    ]);
    const fixtures = new Map(
      PHASE5_FIXTURES.filter(
        (fixture): fixture is Phase5LKFixture => fixture.kind === "lk",
      ).map((fixture) => [fixture.id, fixture]),
    );
    const independentlyPassing = report.samples.every((sample) => {
      const fixture = fixtures.get(sample.fixtureId);
      if (fixture === undefined) throw new Error(`missing fixture ${sample.fixtureId}`);
      const driftLimit = float32SmootherDriftAbsLimit(
        sample.activeCellCount,
        sample.maxAbsSweepInput,
      );
      const driftPass =
        sample.smootherDriftLimit === driftLimit &&
        Math.abs(sample.smootherDrift) <= driftLimit;
      const convergencePass =
        sample.residual < fixture.relaxTol &&
        (fixture.farField === "reflecting" ||
          (sample.divergenceResidual !== null &&
            sample.divergenceResidual < fixture.divTol));
      const positivePass =
        fixture.farField === "reflecting" ||
        (sample.shellInjection > 0 && sample.surfaceExchange > 0);
      expect(sample.passesDriftBound).toBe(driftPass);
      expect(sample.passesDualConvergence).toBe(convergencePass);
      expect(sample.passesPositiveSourceExchange).toBe(
        fixture.farField === "reflecting" ? null : positivePass,
      );
      return driftPass && convergencePass && positivePass;
    });
    expect(independentlyPassing).toBe(true);
    expect(report.allSamplesPass).toBe(independentlyPassing);
    expect(Math.min(...report.samples.map((sample) => sample.sweeps))).toBe(22);
    expect(Math.max(...report.samples.map((sample) => sample.sweeps))).toBe(141);
    expect(
      Math.min(
        ...report.samples
          .filter((sample) => sample.divergenceResidual !== null)
          .map((sample) => sample.shellInjection),
      ),
    ).toBe(1.704_320_311_546_325_7e-7);
    expect(
      Math.min(
        ...report.samples
          .filter((sample) => sample.divergenceResidual !== null)
          .map((sample) => sample.surfaceExchange),
      ),
    ).toBe(3.753_229_975_700_378_4e-7);
    expect(
      Math.max(...report.samples.map((sample) => Math.abs(sample.smootherDrift))),
    ).toBe(3.823_079_168_796_539_3e-7);
    expect(
      Math.min(...report.samples.map((sample) => sample.smootherDriftLimit)),
    ).toBe(0.000_049_667_320_283_219_85);
  });
});
