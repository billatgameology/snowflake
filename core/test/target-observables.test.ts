import { describe, expect, it } from "vitest";
import {
  boundaryTemperatureFromBracket,
  compareScaledMassGrowthTrajectories,
  fitMassLawExponent,
  powerExponentP,
  scaledMassGrowthTrajectory,
} from "@vcc/core";

describe("Phase 8 mass-law exponent", () => {
  it("recovers a registered power law and is invariant to units", () => {
    const samples = [1, 2, 4, 8].map((time) => ({ time, mass: 4 * time ** 1.5 }));
    const fit = fitMassLawExponent(samples);
    expect(fit.exponent).toBeCloseTo(1.5, 14);
    expect(fit.logIntercept).toBeCloseTo(Math.log(4), 14);
    expect(fit.rmseLogMass).toBeLessThan(1e-14);
    expect(fit.sampleCount).toBe(4);

    const changedUnits = fitMassLawExponent(samples.map(({ time, mass }) => ({
      time: time * 60,
      mass: mass * 1e-3,
    })));
    expect(changedUnits.exponent).toBeCloseTo(fit.exponent, 14);
  });

  it("refuses underspecified or invalid samples", () => {
    expect(() => fitMassLawExponent([{ time: 1, mass: 1 }])).toThrow(/at least two/);
    expect(() => fitMassLawExponent([
      { time: 2, mass: 1 },
      { time: 1, mass: 2 },
    ])).toThrow(/strictly increasing/);
    expect(() => fitMassLawExponent([
      { time: 1, mass: 1 },
      { time: 2, mass: 0 },
    ])).toThrow(/greater than zero/);
  });

  it("keeps every reported fit quantity finite across the binary64 positive range", () => {
    const fit = fitMassLawExponent([
      { time: Number.MIN_VALUE, mass: Number.MIN_VALUE },
      { time: 1, mass: 1 },
      { time: Number.MAX_VALUE, mass: Number.MAX_VALUE },
    ]);
    expect(fit.exponent).toBeCloseTo(1, 14);
    expect(Number.isFinite(fit.exponent)).toBe(true);
    expect(Number.isFinite(fit.logIntercept)).toBe(true);
    expect(Number.isFinite(fit.rmseLogMass)).toBe(true);
  });

  it("preserves a power law across adjacent large representable samples", () => {
    const base = 1e300;
    const fit = fitMassLawExponent([
      { time: base, mass: base },
      { time: base * (1 + Number.EPSILON), mass: base * (1 + Number.EPSILON) },
      { time: base * (1 + 2 * Number.EPSILON), mass: base * (1 + 2 * Number.EPSILON) },
    ]);
    expect(fit.exponent).toBeCloseTo(1, 14);
    expect(fit.logIntercept).toBeCloseTo(0, 12);
    expect(fit.rmseLogMass).toBeCloseTo(0, 30);
  });
});

describe("Phase 8 Pokrifka operators", () => {
  it("maps the printed diffusion and kinetics limits to P = 1 and P = 2", () => {
    const massRatio = 8;
    expect(powerExponentP({
      massRatio,
      massRate: massRatio ** (1 / 3),
      initialMassRate: 1,
    })).toBeCloseTo(1, 14);
    expect(powerExponentP({
      massRatio,
      massRate: massRatio ** (2 / 3),
      initialMassRate: 1,
    })).toBeCloseTo(2, 14);
  });

  it("refuses the singular baseline point and nonpositive operands", () => {
    expect(() => powerExponentP({ massRatio: 1, massRate: 2, initialMassRate: 1 }))
      .toThrow(/undefined at mass ratio one/);
    expect(() => powerExponentP({ massRatio: 2, massRate: -1, initialMassRate: 1 }))
      .toThrow(/greater than zero/);
  });

  it("evaluates a finite extreme rate ratio without overflowing the quotient", () => {
    const result = powerExponentP({
      massRatio: 2,
      massRate: Number.MAX_VALUE,
      initialMassRate: Number.MIN_VALUE,
    });
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeCloseTo(
      3 * (Math.log(Number.MAX_VALUE) - Math.log(Number.MIN_VALUE)) / Math.log(2),
      12,
    );
  });

  it("preserves direct-quotient resolution for adjacent large rates", () => {
    const initialMassRate = 1e100;
    const massRate = initialMassRate * (1 + Number.EPSILON);
    expect(powerExponentP({ massRatio: 2, massRate, initialMassRate })).toBe(
      3 * Math.log(massRate / initialMassRate) / Math.log(2),
    );
  });

  it("uses the log-range fallback for a nonzero subnormal rate quotient", () => {
    const result = powerExponentP({
      massRatio: 2,
      massRate: Number.MIN_VALUE,
      initialMassRate: 1.5,
    });
    expect(result).toBe(
      3 * (Math.log(Number.MIN_VALUE) - Math.log(1.5)) / Math.log(2),
    );
  });

  it("normalizes a fixed-cadence scaled-growth trajectory", () => {
    const trajectory = scaledMassGrowthTrajectory([
      { massRatio: 1, massRate: 1 },
      { massRatio: 2, massRate: 2 },
      { massRatio: 4, massRate: 4 },
    ]);
    const rateMean = 7 / 3;
    const ratioPowerMean = (1 + 2 ** (2 / 3) + 4 ** (2 / 3)) / 3;
    expect(trajectory.map((point) => point.massRatio)).toEqual([1, 2, 4]);
    expect(trajectory[1]?.lnScaledMassGrowthRate)
      .toBeCloseTo(Math.log((2 / rateMean) * ratioPowerMean), 14);

    const rescaledRates = scaledMassGrowthTrajectory([
      { massRatio: 1, massRate: 10 },
      { massRatio: 2, massRate: 20 },
      { massRatio: 4, massRate: 40 },
    ]);
    expect(rescaledRates.map((point) => point.massRatio))
      .toEqual(trajectory.map((point) => point.massRatio));
    for (let index = 0; index < trajectory.length; index++) {
      expect(rescaledRates[index]?.lnScaledMassGrowthRate)
        .toBeCloseTo(trajectory[index]?.lnScaledMassGrowthRate ?? Number.NaN, 14);
    }
  });

  it("keeps Eq. 10 finite when ordinary-scale quotients and sums would overflow or underflow", () => {
    const trajectory = scaledMassGrowthTrajectory([
      { massRatio: Number.MIN_VALUE, massRate: Number.MIN_VALUE },
      { massRatio: 1, massRate: Number.MAX_VALUE },
      { massRatio: Number.MAX_VALUE, massRate: Number.MAX_VALUE },
    ]);
    expect(trajectory).toHaveLength(3);
    for (const point of trajectory) {
      expect(Number.isFinite(point.massRatio)).toBe(true);
      expect(Number.isFinite(point.lnScaledMassGrowthRate)).toBe(true);
    }
    expect(
      (trajectory[0]?.lnScaledMassGrowthRate ?? Number.NaN)
        - (trajectory[1]?.lnScaledMassGrowthRate ?? Number.NaN),
    ).toBeCloseTo(Math.log(Number.MIN_VALUE) - Math.log(Number.MAX_VALUE), 12);
  });

  it("preserves adjacent-rate resolution under the common Eq. 10 normalization", () => {
    const base = 1e100;
    const rate = base * (1 + Number.EPSILON);
    const trajectory = scaledMassGrowthTrajectory([
      { massRatio: 1, massRate: base },
      { massRatio: 2, massRate: rate },
    ]);
    const difference = (
      (trajectory[1]?.lnScaledMassGrowthRate ?? Number.NaN)
        - (trajectory[0]?.lnScaledMassGrowthRate ?? Number.NaN)
    );
    const expected = Math.log(rate / base);
    expect(difference).toBeGreaterThan(0);
    expect(Math.abs(difference - expected)).toBeLessThanOrEqual(Number.EPSILON * expected);
  });

  it("uses the range fallback before a nonzero subnormal Eq. 10 quotient loses precision", () => {
    const trajectory = scaledMassGrowthTrajectory([
      { massRatio: 1, massRate: Number.MIN_VALUE },
      { massRatio: 2, massRate: 1.5 },
    ]);
    const difference = (trajectory[1]?.lnScaledMassGrowthRate ?? Number.NaN)
      - (trajectory[0]?.lnScaledMassGrowthRate ?? Number.NaN);
    expect(difference).toBeCloseTo(
      Math.log(1.5) - Math.log(Number.MIN_VALUE),
      12,
    );
  });

  it("compares on the reference grid with registered interpolation and no extrapolation", () => {
    const reference = [
      { massRatio: 2, lnScaledMassGrowthRate: 3 },
      { massRatio: 3, lnScaledMassGrowthRate: 5 },
    ];
    const candidate = [
      { massRatio: 1, lnScaledMassGrowthRate: 1 },
      { massRatio: 3, lnScaledMassGrowthRate: 5 },
      { massRatio: 4, lnScaledMassGrowthRate: 7 },
    ];
    expect(compareScaledMassGrowthTrajectories(reference, candidate)).toEqual({
      comparedPoints: 2,
      rmseLnScaledRate: 0,
      maxAbsLnScaledRate: 0,
      meanSignedLnScaledRate: 0,
    });
    expect(() => compareScaledMassGrowthTrajectories(
      [{ massRatio: 0.5, lnScaledMassGrowthRate: 0 }],
      candidate,
    )).toThrow(/extrapolation is forbidden/);
  });

  it("uses finite interpolation and metric reductions at extreme log ordinates", () => {
    expect(compareScaledMassGrowthTrajectories(
      [{ massRatio: 2, lnScaledMassGrowthRate: 0 }],
      [
        { massRatio: 1, lnScaledMassGrowthRate: -Number.MAX_VALUE },
        { massRatio: 3, lnScaledMassGrowthRate: Number.MAX_VALUE },
      ],
    )).toEqual({
      comparedPoints: 1,
      rmseLnScaledRate: 0,
      maxAbsLnScaledRate: 0,
      meanSignedLnScaledRate: 0,
    });

    const largeFiniteDelta = Number.MAX_VALUE * 0.75;
    const metrics = compareScaledMassGrowthTrajectories(
      [
        { massRatio: 1, lnScaledMassGrowthRate: 0 },
        { massRatio: 2, lnScaledMassGrowthRate: 0 },
      ],
      [
        { massRatio: 1, lnScaledMassGrowthRate: largeFiniteDelta },
        { massRatio: 2, lnScaledMassGrowthRate: largeFiniteDelta },
      ],
    );
    expect(metrics.rmseLnScaledRate).toBe(largeFiniteDelta);
    expect(metrics.maxAbsLnScaledRate).toBe(largeFiniteDelta);
    expect(metrics.meanSignedLnScaledRate).toBe(largeFiniteDelta);
    expect(Object.values(metrics).every(Number.isFinite)).toBe(true);
  });

  it("preserves a constant minimum-subnormal ordinate through interpolation", () => {
    expect(compareScaledMassGrowthTrajectories(
      [{ massRatio: 2, lnScaledMassGrowthRate: 0 }],
      [
        { massRatio: 1, lnScaledMassGrowthRate: Number.MIN_VALUE },
        { massRatio: 3, lnScaledMassGrowthRate: Number.MIN_VALUE },
      ],
    )).toEqual({
      comparedPoints: 1,
      rmseLnScaledRate: Number.MIN_VALUE,
      maxAbsLnScaledRate: Number.MIN_VALUE,
      meanSignedLnScaledRate: Number.MIN_VALUE,
    });
  });

  it("retains a subnormal interpolant when the mass-ratio span reaches the binary64 ceiling", () => {
    expect(compareScaledMassGrowthTrajectories(
      [{ massRatio: 2 * Number.MIN_VALUE, lnScaledMassGrowthRate: 0 }],
      [
        { massRatio: Number.MIN_VALUE, lnScaledMassGrowthRate: 0 },
        { massRatio: Number.MAX_VALUE, lnScaledMassGrowthRate: Number.MAX_VALUE },
      ],
    )).toEqual({
      comparedPoints: 1,
      rmseLnScaledRate: Number.MIN_VALUE,
      maxAbsLnScaledRate: Number.MIN_VALUE,
      meanSignedLnScaledRate: Number.MIN_VALUE,
    });
  });

  it("rounds a cancellation-dominated interpolant once from the exact binary64 operands", () => {
    const expected = 5.562684646268e-309;
    expect(compareScaledMassGrowthTrajectories(
      [{ massRatio: 1, lnScaledMassGrowthRate: 0 }],
      [
        { massRatio: Number.MIN_VALUE, lnScaledMassGrowthRate: -1 },
        { massRatio: Number.MAX_VALUE, lnScaledMassGrowthRate: Number.MAX_VALUE },
      ],
    )).toEqual({
      comparedPoints: 1,
      rmseLnScaledRate: expected,
      maxAbsLnScaledRate: expected,
      meanSignedLnScaledRate: expected,
    });
  });

  it("throws instead of publishing an unrepresentable comparison delta", () => {
    expect(() => compareScaledMassGrowthTrajectories(
      [{ massRatio: 1, lnScaledMassGrowthRate: -Number.MAX_VALUE }],
      [
        { massRatio: 1, lnScaledMassGrowthRate: Number.MAX_VALUE },
        { massRatio: 2, lnScaledMassGrowthRate: Number.MAX_VALUE },
      ],
    )).toThrow(/scaled trajectory delta 0 must be finite/);
  });

  it("preserves a representable signed mean after extreme cancellation", () => {
    const metrics = compareScaledMassGrowthTrajectories(
      [
        { massRatio: 1, lnScaledMassGrowthRate: 0 },
        { massRatio: 2, lnScaledMassGrowthRate: 0 },
        { massRatio: 3, lnScaledMassGrowthRate: 0 },
      ],
      [
        { massRatio: 1, lnScaledMassGrowthRate: Number.MAX_VALUE },
        { massRatio: 2, lnScaledMassGrowthRate: -Number.MAX_VALUE },
        { massRatio: 3, lnScaledMassGrowthRate: 1e-100 },
      ],
    );
    expect(metrics.meanSignedLnScaledRate).toBe(1e-100 / 3);
  });

  it("keeps representable same-sign means finite at the binary64 ceiling", () => {
    for (const sign of [1, -1]) {
      const ordinate = sign * Number.MAX_VALUE;
      const metrics = compareScaledMassGrowthTrajectories(
        [
          { massRatio: 1, lnScaledMassGrowthRate: 0 },
          { massRatio: 2, lnScaledMassGrowthRate: 0 },
          { massRatio: 3, lnScaledMassGrowthRate: 0 },
        ],
        [
          { massRatio: 1, lnScaledMassGrowthRate: ordinate },
          { massRatio: 2, lnScaledMassGrowthRate: ordinate },
          { massRatio: 3, lnScaledMassGrowthRate: ordinate },
        ],
      );
      expect(metrics.meanSignedLnScaledRate).toBe(ordinate);
      expect(Number.isFinite(metrics.meanSignedLnScaledRate)).toBe(true);
    }
  });
});

describe("Phase 8 boundary-temperature extraction", () => {
  it("reports the midpoint and half-spacing of an adjacent unlike-habit bracket", () => {
    expect(boundaryTemperatureFromBracket({
      colderTempC: -9,
      colderHabit: "column",
      warmerTempC: -8,
      warmerHabit: "plate",
    })).toEqual({
      estimateC: -8.5,
      halfWidthC: 0.5,
      intervalC: [-9, -8],
      colderHabit: "column",
      warmerHabit: "plate",
    });
  });

  it("refuses reversed and same-habit brackets", () => {
    expect(() => boundaryTemperatureFromBracket({
      colderTempC: -4,
      colderHabit: "plate",
      warmerTempC: -5,
      warmerHabit: "column",
    })).toThrow(/colder to warmer/);
    expect(() => boundaryTemperatureFromBracket({
      colderTempC: -5,
      colderHabit: "plate",
      warmerTempC: -4,
      warmerHabit: "plate",
    })).toThrow(/different habits/);
    expect(() => boundaryTemperatureFromBracket({
      colderTempC: -5,
      colderHabit: "neutral" as "plate",
      warmerTempC: -4,
      warmerHabit: "plate",
    })).toThrow(/boundary colder habit must be plate or column/);
  });

  it("keeps the midpoint and half-width finite at extreme temperatures", () => {
    expect(boundaryTemperatureFromBracket({
      colderTempC: Number.MAX_VALUE / 2,
      colderHabit: "column",
      warmerTempC: Number.MAX_VALUE,
      warmerHabit: "plate",
    })).toMatchObject({
      estimateC: Number.MAX_VALUE * 0.75,
      halfWidthC: Number.MAX_VALUE * 0.25,
    });

    expect(boundaryTemperatureFromBracket({
      colderTempC: -Number.MAX_VALUE,
      colderHabit: "column",
      warmerTempC: Number.MAX_VALUE,
      warmerHabit: "plate",
    })).toMatchObject({
      estimateC: 0,
      halfWidthC: Number.MAX_VALUE,
    });
  });

  it("uses the printed midpoint and half-width operations for subnormal brackets", () => {
    expect(boundaryTemperatureFromBracket({
      colderTempC: Number.MIN_VALUE,
      colderHabit: "column",
      warmerTempC: 5 * Number.MIN_VALUE,
      warmerHabit: "plate",
    })).toMatchObject({
      estimateC: 3 * Number.MIN_VALUE,
      halfWidthC: 2 * Number.MIN_VALUE,
    });
    expect(boundaryTemperatureFromBracket({
      colderTempC: -5 * Number.MIN_VALUE,
      colderHabit: "column",
      warmerTempC: -Number.MIN_VALUE,
      warmerHabit: "plate",
    })).toMatchObject({
      estimateC: -3 * Number.MIN_VALUE,
      halfWidthC: 2 * Number.MIN_VALUE,
    });
    expect(boundaryTemperatureFromBracket({
      colderTempC: -Number.MIN_VALUE,
      colderHabit: "column",
      warmerTempC: 5 * Number.MIN_VALUE,
      warmerHabit: "plate",
    })).toMatchObject({
      estimateC: 2 * Number.MIN_VALUE,
      halfWidthC: 3 * Number.MIN_VALUE,
    });
  });

  it("throws when a positive half-width is not representable", () => {
    expect(() => boundaryTemperatureFromBracket({
      colderTempC: 0,
      colderHabit: "column",
      warmerTempC: Number.MIN_VALUE,
      warmerHabit: "plate",
    })).toThrow(/boundary half-width must be finite and greater than zero/);
  });
});
