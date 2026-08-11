// Deterministic Phase 8 derived-observable operators.
//
// These functions transform already selected observations. They deliberately do not choose fit
// windows, smoothing widths, comparison grids, habit labels, or acceptance thresholds: those are
// protocol decisions and must be registered by the caller before model output is inspected.

export interface MassLawSample {
  readonly time: number;
  readonly mass: number;
}

export interface MassLawFit {
  /** Exponent q in m = exp(logIntercept) * t^q. */
  readonly exponent: number;
  readonly logIntercept: number;
  /** Unweighted root-mean-square residual in natural-log mass. */
  readonly rmseLogMass: number;
  readonly sampleCount: number;
}

const MIN_NORMAL_BINARY64 = 2 ** -1022;

function requireFinitePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be finite and greater than zero`);
  }
  return value;
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

const BINARY64_FRACTION_BITS = 52n;
const BINARY64_FRACTION_MASK = (1n << BINARY64_FRACTION_BITS) - 1n;
const BINARY64_HIDDEN_BIT = 1n << BINARY64_FRACTION_BITS;
const BINARY64_SIGN_BIT = 1n << 63n;

/** Convert one finite binary64 operand to an exact integer count of minimum-subnormal units. */
function binary64MinimumUnits(value: number, label: string): bigint {
  requireFinite(value, label);
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value, false);
  const bits = view.getBigUint64(0, false);
  const negative = (bits & BINARY64_SIGN_BIT) !== 0n;
  const exponentBits = Number((bits >> BINARY64_FRACTION_BITS) & 0x7ffn);
  const fraction = bits & BINARY64_FRACTION_MASK;
  const magnitude = exponentBits === 0
    ? fraction
    : (BINARY64_HIDDEN_BIT + fraction) << BigInt(exponentBits - 1);
  return negative ? -magnitude : magnitude;
}

function bigintBitLength(value: bigint): number {
  if (value <= 0n) throw new Error("binary64 rational magnitude must be positive");
  return value.toString(2).length;
}

/** Round a positive rational to an integer, using binary64's nearest-even tie rule. */
function roundPositiveRational(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  const doubledRemainder = remainder << 1n;
  return doubledRemainder > denominator
    || (doubledRemainder === denominator && (quotient & 1n) === 1n)
    ? quotient + 1n
    : quotient;
}

/**
 * Convert an exact rational count of minimum-subnormal units to one correctly rounded binary64.
 * The interpolation caller guarantees that its convex result lies between two finite ordinates.
 */
function binary64FromMinimumUnitRatio(
  numerator: bigint,
  denominator: bigint,
  label: string,
): number {
  if (denominator <= 0n) throw new Error(`${label} denominator must be positive`);
  if (numerator === 0n) return 0;
  const negative = numerator < 0n;
  const magnitude = negative ? -numerator : numerator;
  let leadingBit = bigintBitLength(magnitude) - bigintBitLength(denominator);
  const belowLeadingPower = leadingBit >= 0
    ? magnitude < (denominator << BigInt(leadingBit))
    : (magnitude << BigInt(-leadingBit)) < denominator;
  if (belowLeadingPower) leadingBit -= 1;

  let exponentBits: number;
  let fraction: bigint;
  if (leadingBit < Number(BINARY64_FRACTION_BITS)) {
    const roundedUnits = roundPositiveRational(magnitude, denominator);
    if (roundedUnits === 0n) return 0;
    if (roundedUnits < BINARY64_HIDDEN_BIT) {
      exponentBits = 0;
      fraction = roundedUnits;
    } else if (roundedUnits === BINARY64_HIDDEN_BIT) {
      exponentBits = 1;
      fraction = 0n;
    } else {
      throw new Error(`${label} subnormal rounding invariant failed`);
    }
  } else {
    let unitShift = leadingBit - Number(BINARY64_FRACTION_BITS);
    let significand = roundPositiveRational(
      magnitude,
      denominator << BigInt(unitShift),
    );
    if (significand === (BINARY64_HIDDEN_BIT << 1n)) {
      significand >>= 1n;
      unitShift += 1;
    }
    if (significand < BINARY64_HIDDEN_BIT || significand >= (BINARY64_HIDDEN_BIT << 1n)) {
      throw new Error(`${label} normal rounding invariant failed`);
    }
    exponentBits = unitShift + 1;
    if (exponentBits > 2046) throw new Error(`${label} must be finite`);
    fraction = significand - BINARY64_HIDDEN_BIT;
  }

  const bits = (negative ? BINARY64_SIGN_BIT : 0n)
    | (BigInt(exponentBits) << BINARY64_FRACTION_BITS)
    | fraction;
  const view = new DataView(new ArrayBuffer(8));
  view.setBigUint64(0, bits, false);
  return requireFinite(view.getFloat64(0, false), label);
}

/** Neumaier-compensated sum over an ordinary number array. */
function compensatedSum(values: readonly number[], label: string): number {
  let sum = 0;
  let compensation = 0;
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (value === undefined) throw new Error(`${label} term ${index} is missing`);
    requireFinite(value, `${label} term ${index}`);
    const next = requireFinite(sum + value, `${label} running sum`);
    const correction = Math.abs(sum) >= Math.abs(value)
      ? sum - next + value
      : value - next + sum;
    requireFinite(correction, `${label} compensation update`);
    compensation = requireFinite(
      compensation + correction,
      `${label} accumulated compensation`,
    );
    sum = next;
  }
  return requireFinite(sum + compensation, `${label} total`);
}

/** Root-mean-square evaluated without squaring values at their original scale. */
function finiteRootMeanSquare(values: readonly number[], label: string): number {
  if (values.length === 0) throw new Error(`${label} requires at least one value`);
  let scale = 0;
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (value === undefined) throw new Error(`${label} value ${index} is missing`);
    requireFinite(value, `${label} value ${index}`);
    scale = Math.max(scale, Math.abs(value));
  }
  if (scale === 0) return 0;
  const normalizedSquares = values.map((value, index) => {
    const normalized = requireFinite(value / scale, `${label} normalized value ${index}`);
    return requireFinite(normalized * normalized, `${label} normalized square ${index}`);
  });
  const meanNormalizedSquare = requireFinite(
    compensatedSum(normalizedSquares, `${label} normalized squares`) / values.length,
    `${label} normalized mean square`,
  );
  const normalizedRoot = requireFinite(
    Math.sqrt(meanNormalizedSquare),
    `${label} normalized root`,
  );
  return requireFinite(scale * normalizedRoot, label);
}

/** Arithmetic mean evaluated as compensated source-order mean terms to avoid sum overflow. */
function finiteArithmeticMean(values: readonly number[], label: string): number {
  if (values.length === 0) throw new Error(`${label} requires at least one value`);
  let hasPositive = false;
  let hasNegative = false;
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (value === undefined) throw new Error(`${label} value ${index} is missing`);
    requireFinite(value, `${label} value ${index}`);
    hasPositive ||= value > 0;
    hasNegative ||= value < 0;
  }
  if (!hasNegative) return finiteNonnegativeMean(values, label);
  if (!hasPositive) {
    return requireFinite(
      -finiteNonnegativeMean(values.map((value) => -value), `${label} magnitudes`),
      label,
    );
  }
  const meanTerms = values.map((value, index) => {
    return requireFinite(value / values.length, `${label} mean term ${index}`);
  });
  return compensatedSum(meanTerms, `${label} mean terms`);
}

/** Nonnegative arithmetic mean with scale normalization. */
function finiteNonnegativeMean(values: readonly number[], label: string): number {
  if (values.length === 0) throw new Error(`${label} requires at least one value`);
  let scale = 0;
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (value === undefined) throw new Error(`${label} value ${index} is missing`);
    requireFinite(value, `${label} value ${index}`);
    if (value < 0) throw new Error(`${label} value ${index} must not be negative`);
    scale = Math.max(scale, value);
  }
  if (scale === 0) return 0;
  const normalized = values.map((value, index) => {
    const result = requireFinite(value / scale, `${label} normalized value ${index}`);
    if (result < 0) throw new Error(`${label} normalized value ${index} must not be negative`);
    return result;
  });
  const normalizedMean = requireFinitePositive(
    compensatedSum(normalized, `${label} normalized values`) / values.length,
    `${label} normalized mean`,
  );
  return requireFinite(scale * normalizedMean, label);
}

/** Positive arithmetic mean with scale normalization, without taking logs before ratios. */
function finitePositiveMean(values: readonly number[], label: string): number {
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (value === undefined) throw new Error(`${label} value ${index} is missing`);
    requireFinitePositive(value, `${label} value ${index}`);
  }
  return requireFinitePositive(finiteNonnegativeMean(values, label), label);
}

/** Preserve direct-quotient resolution, falling back to log subtraction only outside its range. */
function logPositiveRatio(numerator: number, denominator: number, label: string): number {
  requireFinitePositive(numerator, `${label} numerator`);
  requireFinitePositive(denominator, `${label} denominator`);
  const quotient = numerator / denominator;
  if (Number.isFinite(quotient) && quotient >= MIN_NORMAL_BINARY64) {
    return requireFinite(Math.log(quotient), label);
  }
  return requireFinite(
    Math.log(numerator) - Math.log(denominator),
    `${label} range fallback`,
  );
}

/**
 * Unweighted ordinary-least-squares fit of ln(mass) on ln(time).
 *
 * Samples must be in strictly increasing time order. The caller owns the registered window and
 * any uncertainty weighting; silently selecting either inside this operator would make the
 * derived target depend on an unregistered choice.
 */
export function fitMassLawExponent(samples: readonly MassLawSample[]): MassLawFit {
  if (samples.length < 2) throw new Error("mass-law fit requires at least two samples");
  const reference = samples[0];
  if (reference === undefined) throw new Error("mass-law reference sample is missing");
  requireFinitePositive(reference.time, "mass-law reference time");
  requireFinitePositive(reference.mass, "mass-law reference mass");
  const x: number[] = [];
  const y: number[] = [];
  let previousTime: number | undefined;
  for (let index = 0; index < samples.length; index++) {
    const sample = samples[index];
    if (sample === undefined) throw new Error(`mass-law sample ${index} is missing`);
    requireFinitePositive(sample.time, `mass-law sample ${index} time`);
    requireFinitePositive(sample.mass, `mass-law sample ${index} mass`);
    if (previousTime !== undefined && sample.time <= previousTime) {
      throw new Error("mass-law sample times must be strictly increasing");
    }
    previousTime = sample.time;
    x.push(logPositiveRatio(
      sample.time,
      reference.time,
      `mass-law sample ${index} relative log time`,
    ));
    y.push(logPositiveRatio(
      sample.mass,
      reference.mass,
      `mass-law sample ${index} relative log mass`,
    ));
  }

  const xMean = requireFinite(
    compensatedSum(x, "mass-law log-time values") / x.length,
    "mass-law mean log time",
  );
  const yMean = requireFinite(
    compensatedSum(y, "mass-law log-mass values") / y.length,
    "mass-law mean log mass",
  );
  const covarianceTerms = x.map((value, index) => {
    const yValue = y[index];
    if (yValue === undefined) throw new Error(`mass-law log-mass ${index} is missing`);
    const xDeviation = requireFinite(value - xMean, `mass-law log-time deviation ${index}`);
    const yDeviation = requireFinite(yValue - yMean, `mass-law log-mass deviation ${index}`);
    return requireFinite(
      xDeviation * yDeviation,
      `mass-law covariance term ${index}`,
    );
  });
  const varianceTerms = x.map((value, index) => {
    const deviation = requireFinite(value - xMean, `mass-law variance deviation ${index}`);
    return requireFinite(deviation * deviation, `mass-law variance term ${index}`);
  });
  const variance = compensatedSum(varianceTerms, "mass-law variance terms");
  if (!(variance > 0)) throw new Error("mass-law fit requires distinct positive times");
  const covariance = compensatedSum(covarianceTerms, "mass-law covariance terms");
  const exponent = requireFinite(covariance / variance, "mass-law exponent");
  const exponentAtMean = requireFinite(exponent * xMean, "mass-law exponent at mean relative log time");
  const relativeLogIntercept = requireFinite(
    yMean - exponentAtMean,
    "mass-law relative log intercept",
  );
  const referenceSlopeTerm = requireFinite(
    exponent * Math.log(reference.time),
    "mass-law reference slope term",
  );
  const logIntercept = requireFinite(
    Math.log(reference.mass) + relativeLogIntercept - referenceSlopeTerm,
    "mass-law log intercept",
  );
  const residuals = x.map((value, index) => {
    const yValue = y[index];
    if (yValue === undefined) throw new Error(`mass-law log-mass ${index} is missing`);
    const fittedSlopeTerm = requireFinite(
      exponent * value,
      `mass-law fitted slope term ${index}`,
    );
    const fittedLogMass = requireFinite(
      relativeLogIntercept + fittedSlopeTerm,
      `mass-law fitted relative log mass ${index}`,
    );
    return requireFinite(yValue - fittedLogMass, `mass-law residual ${index}`);
  });
  return {
    exponent,
    logIntercept,
    rmseLogMass: finiteRootMeanSquare(residuals, "mass-law log-mass residual RMS"),
    sampleCount: samples.length,
  };
}

export interface PowerExponentInput {
  /** Directly measured or simulated m / m0. */
  readonly massRatio: number;
  readonly massRate: number;
  /** Registered short-window baseline mass rate. */
  readonly initialMassRate: number;
}

/** Pokrifka et al. (2020) Eq. 14: P = 3 ln(mDot/mDot0) / ln(m/m0). */
export function powerExponentP(input: PowerExponentInput): number {
  requireFinitePositive(input.massRatio, "power-exponent mass ratio");
  requireFinitePositive(input.massRate, "power-exponent mass rate");
  requireFinitePositive(input.initialMassRate, "power-exponent initial mass rate");
  if (input.massRatio === 1) {
    throw new Error("power exponent is undefined at mass ratio one");
  }
  const logMassRatio = requireFinite(Math.log(input.massRatio), "power-exponent log mass ratio");
  const logRateRatio = logPositiveRatio(
    input.massRate,
    input.initialMassRate,
    "power-exponent log rate ratio",
  );
  const numerator = requireFinite(3 * logRateRatio, "power-exponent numerator");
  return requireFinite(numerator / logMassRatio, "power exponent");
}

export interface MassGrowthRateSample {
  readonly massRatio: number;
  readonly massRate: number;
}

export interface ScaledMassGrowthPoint {
  readonly massRatio: number;
  readonly lnScaledMassGrowthRate: number;
}

/**
 * Pokrifka et al. (2020) Eq. 10 on a caller-selected, fixed-cadence series.
 *
 * Gs = (mDot / mean(mDot)) * mean(massRatio^(2/3)). The returned ordinate is ln(Gs), matching
 * the paper's comparison space. Sampling cadence is intentionally not changed here because an
 * unregistered resampling rule would change both means.
 */
export function scaledMassGrowthTrajectory(
  samples: readonly MassGrowthRateSample[],
): readonly ScaledMassGrowthPoint[] {
  if (samples.length < 2) throw new Error("scaled growth trajectory requires at least two samples");
  let previousMassRatio: number | undefined;
  const rates: number[] = [];
  const ratioPowers: number[] = [];
  for (let index = 0; index < samples.length; index++) {
    const sample = samples[index];
    if (sample === undefined) throw new Error(`scaled growth sample ${index} is missing`);
    requireFinitePositive(sample.massRatio, `scaled growth sample ${index} mass ratio`);
    requireFinitePositive(sample.massRate, `scaled growth sample ${index} mass rate`);
    if (previousMassRatio !== undefined && sample.massRatio <= previousMassRatio) {
      throw new Error("scaled growth mass ratios must be strictly increasing");
    }
    previousMassRatio = sample.massRatio;
    rates.push(sample.massRate);
    ratioPowers.push(requireFinitePositive(
      sample.massRatio ** (2 / 3),
      `scaled growth sample ${index} mass-ratio power`,
    ));
  }
  const meanRate = finitePositiveMean(rates, "scaled growth mean mass rate");
  const meanRatioPower = finitePositiveMean(
    ratioPowers,
    "scaled growth mean mass-ratio power",
  );
  const logMeanRatioPower = requireFinite(
    Math.log(meanRatioPower),
    "scaled growth log mean mass-ratio power",
  );
  return samples.map((sample, index) => {
    const normalizedRate = sample.massRate / meanRate;
    const scaledRate = normalizedRate * meanRatioPower;
    const lnScaledMassGrowthRate = Number.isFinite(normalizedRate)
      && normalizedRate >= MIN_NORMAL_BINARY64
      && Number.isFinite(scaledRate)
      && scaledRate >= MIN_NORMAL_BINARY64
      ? requireFinite(Math.log(scaledRate), `scaled growth sample ${index} log scaled rate`)
      : requireFinite(
        logPositiveRatio(
          sample.massRate,
          meanRate,
          `scaled growth sample ${index} log normalized mass rate`,
        ) + logMeanRatioPower,
        `scaled growth sample ${index} log scaled rate range fallback`,
      );
    return {
      massRatio: sample.massRatio,
      lnScaledMassGrowthRate,
    };
  });
}

export interface ScaledTrajectoryComparison {
  readonly comparedPoints: number;
  readonly rmseLnScaledRate: number;
  readonly maxAbsLnScaledRate: number;
  readonly meanSignedLnScaledRate: number;
}

function validateScaledPoints(
  points: readonly ScaledMassGrowthPoint[],
  label: string,
  minimumCount: number,
): void {
  if (points.length < minimumCount) {
    throw new Error(`${label} requires at least ${minimumCount} point${minimumCount === 1 ? "" : "s"}`);
  }
  let previousMassRatio: number | undefined;
  for (let index = 0; index < points.length; index++) {
    const point = points[index];
    if (point === undefined) throw new Error(`${label} point ${index} is missing`);
    requireFinitePositive(point.massRatio, `${label} point ${index} mass ratio`);
    requireFinite(point.lnScaledMassGrowthRate, `${label} point ${index} log scaled rate`);
    if (previousMassRatio !== undefined && point.massRatio <= previousMassRatio) {
      throw new Error(`${label} mass ratios must be strictly increasing`);
    }
    previousMassRatio = point.massRatio;
  }
}

function interpolateLogScaledRate(
  candidate: readonly ScaledMassGrowthPoint[],
  massRatio: number,
): number {
  const first = candidate[0];
  const last = candidate[candidate.length - 1];
  if (first === undefined || last === undefined) throw new Error("candidate trajectory is empty");
  if (massRatio < first.massRatio || massRatio > last.massRatio) {
    throw new Error("reference mass ratio lies outside candidate trajectory; extrapolation is forbidden");
  }
  for (let index = 0; index < candidate.length; index++) {
    const point = candidate[index];
    if (point === undefined) throw new Error(`candidate trajectory point ${index} is missing`);
    if (point.massRatio === massRatio) return point.lnScaledMassGrowthRate;
    if (point.massRatio > massRatio) {
      const lower = candidate[index - 1];
      if (lower === undefined) throw new Error("candidate interpolation bracket is missing");
      const lowerMassUnits = binary64MinimumUnits(
        lower.massRatio,
        "candidate interpolation lower mass ratio",
      );
      const upperMassUnits = binary64MinimumUnits(
        point.massRatio,
        "candidate interpolation upper mass ratio",
      );
      const referenceMassUnits = binary64MinimumUnits(
        massRatio,
        "candidate interpolation reference mass ratio",
      );
      const lowerRateUnits = binary64MinimumUnits(
        lower.lnScaledMassGrowthRate,
        "candidate interpolation lower log scaled rate",
      );
      const upperRateUnits = binary64MinimumUnits(
        point.lnScaledMassGrowthRate,
        "candidate interpolation upper log scaled rate",
      );
      const lowerWeight = upperMassUnits - referenceMassUnits;
      const upperWeight = referenceMassUnits - lowerMassUnits;
      const denominator = upperMassUnits - lowerMassUnits;
      return binary64FromMinimumUnitRatio(
        lowerWeight * lowerRateUnits + upperWeight * upperRateUnits,
        denominator,
        "candidate interpolated log scaled rate",
      );
    }
  }
  return last.lnScaledMassGrowthRate;
}

/**
 * Compare ln(Gs) at the reference trajectory's registered mass-ratio abscissae.
 *
 * Candidate ln(Gs) is linearly interpolated in mass ratio. Extrapolation, auto-cropping, weighting,
 * and thresholding are forbidden; callers must register those scientific choices separately.
 */
export function compareScaledMassGrowthTrajectories(
  reference: readonly ScaledMassGrowthPoint[],
  candidate: readonly ScaledMassGrowthPoint[],
): ScaledTrajectoryComparison {
  validateScaledPoints(reference, "reference scaled trajectory", 1);
  validateScaledPoints(candidate, "candidate scaled trajectory", 2);
  const deltas = reference.map((point, index) => requireFinite(
    interpolateLogScaledRate(candidate, point.massRatio) - point.lnScaledMassGrowthRate,
    `scaled trajectory delta ${index}`,
  ));
  let maxAbsLnScaledRate = 0;
  for (const delta of deltas) maxAbsLnScaledRate = Math.max(maxAbsLnScaledRate, Math.abs(delta));
  return {
    comparedPoints: deltas.length,
    rmseLnScaledRate: finiteRootMeanSquare(deltas, "scaled trajectory delta RMS"),
    maxAbsLnScaledRate: requireFinite(maxAbsLnScaledRate, "scaled trajectory maximum delta"),
    meanSignedLnScaledRate: finiteArithmeticMean(deltas, "scaled trajectory signed mean delta"),
  };
}

export type BoundaryHabit = "plate" | "column";

export interface BoundaryBracket {
  readonly colderTempC: number;
  readonly colderHabit: BoundaryHabit;
  readonly warmerTempC: number;
  readonly warmerHabit: BoundaryHabit;
}

export interface BoundaryTemperature {
  readonly estimateC: number;
  readonly halfWidthC: number;
  readonly intervalC: readonly [number, number];
  readonly colderHabit: BoundaryHabit;
  readonly warmerHabit: BoundaryHabit;
}

function requireBoundaryHabit(value: unknown, label: string): asserts value is BoundaryHabit {
  if (value !== "plate" && value !== "column") {
    throw new Error(`${label} must be plate or column`);
  }
}

/** Midpoint estimate and half-spacing read uncertainty from one adjacent unlike-habit bracket. */
export function boundaryTemperatureFromBracket(bracket: BoundaryBracket): BoundaryTemperature {
  requireFinite(bracket.colderTempC, "boundary colder temperature");
  requireFinite(bracket.warmerTempC, "boundary warmer temperature");
  requireBoundaryHabit(bracket.colderHabit, "boundary colder habit");
  requireBoundaryHabit(bracket.warmerHabit, "boundary warmer habit");
  if (bracket.colderTempC >= bracket.warmerTempC) {
    throw new Error("boundary bracket must run from colder to warmer temperature");
  }
  if (bracket.colderHabit === bracket.warmerHabit) {
    throw new Error("boundary bracket endpoints must have different habits");
  }
  const directSum = bracket.colderTempC + bracket.warmerTempC;
  const estimateC = requireFinite(
    Number.isFinite(directSum)
      ? directSum / 2
      : bracket.colderTempC / 2 + bracket.warmerTempC / 2,
    "boundary midpoint estimate",
  );
  const directWidth = bracket.warmerTempC - bracket.colderTempC;
  const halfWidthC = requireFinitePositive(
    Number.isFinite(directWidth)
      ? directWidth / 2
      : bracket.warmerTempC / 2 - bracket.colderTempC / 2,
    "boundary half-width",
  );
  return {
    estimateC,
    halfWidthC,
    intervalC: [bracket.colderTempC, bracket.warmerTempC],
    colderHabit: bracket.colderHabit,
    warmerHabit: bracket.warmerHabit,
  };
}
