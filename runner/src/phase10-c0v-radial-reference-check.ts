// Independent Phase 10 C0V radial reference check.
//
// This module deliberately does not import the 2x2 generator. It uses the closed-form
// dimensionless Robin strength (Lambda), surface value, radial depletion profile, and
// Hertz-Knudsen velocity. Keeping the arithmetic in this file independent is the load-bearing
// distinction between a reference check and the reference merely checking itself.

import type {
  Phase10C0VNumericIdentity,
  Phase10C0VPhysicalConstants as SharedPhysicalConstants,
  Phase10C0VRadialReferenceInput as SharedRadialReferenceInput,
} from "./phase10-c0v-contracts.ts";

export type Phase10C0VRadialCheckBinary64Identity = Phase10C0VNumericIdentity;
export type Phase10C0VRadialCheckPhysicalConstants = SharedPhysicalConstants;
export type Phase10C0VRadialCheckToleranceSet = SharedRadialReferenceInput["tolerances"];
export type Phase10C0VRadialCheckInput = SharedRadialReferenceInput;

export interface Phase10C0VRadialCheckCandidateSample {
  readonly nodeIndex: number;
  readonly radiusM: Phase10C0VRadialCheckBinary64Identity;
  readonly sigma: Phase10C0VRadialCheckBinary64Identity;
}

export interface Phase10C0VRadialCheckCandidateCase {
  readonly caseId: string;
  readonly requestedSpacingM: Phase10C0VRadialCheckBinary64Identity;
  readonly actualSpacingM: Phase10C0VRadialCheckBinary64Identity;
  readonly nodeCount: number;
  readonly harmonicConstant: Phase10C0VRadialCheckBinary64Identity;
  readonly harmonicInverseRadiusCoefficientM: Phase10C0VRadialCheckBinary64Identity;
  readonly sigmaSurface: Phase10C0VRadialCheckBinary64Identity;
  readonly sigmaShell: Phase10C0VRadialCheckBinary64Identity;
  readonly surfaceGradientPerM: Phase10C0VRadialCheckBinary64Identity;
  readonly growthVelocityFluxMS: Phase10C0VRadialCheckBinary64Identity;
  readonly growthVelocityKineticMS: Phase10C0VRadialCheckBinary64Identity;
  readonly robinResidual: Phase10C0VRadialCheckBinary64Identity;
  readonly samples: readonly Phase10C0VRadialCheckCandidateSample[];
}

export interface Phase10C0VRadialCheckCandidate {
  readonly schema: "phase10-c0v-radial-reference-candidate-v1";
  readonly protocolId: string;
  readonly method: "independent-2x2-harmonic-coefficients";
  readonly operands: {
    readonly radiusM: Phase10C0VRadialCheckBinary64Identity;
    readonly farRadiusM: Phase10C0VRadialCheckBinary64Identity;
    readonly sigmaInfinity: Phase10C0VRadialCheckBinary64Identity;
    readonly tempC: Phase10C0VRadialCheckBinary64Identity;
    readonly pressurePa: Phase10C0VRadialCheckBinary64Identity;
    readonly alphaHKConst: Phase10C0VRadialCheckBinary64Identity;
    readonly physicalConstants: {
      readonly kBoltzmannJPerK: Phase10C0VRadialCheckBinary64Identity;
      readonly celsiusZeroK: Phase10C0VRadialCheckBinary64Identity;
      readonly waterMoleculeMassKg: Phase10C0VRadialCheckBinary64Identity;
      readonly iceNumberDensityPerM3: Phase10C0VRadialCheckBinary64Identity;
      readonly diffusivityAir1AtmM2S: Phase10C0VRadialCheckBinary64Identity;
      readonly standardAtmospherePa: Phase10C0VRadialCheckBinary64Identity;
      readonly saturationPressurePrefactorMbar: Phase10C0VRadialCheckBinary64Identity;
      readonly saturationPressureExponentK: Phase10C0VRadialCheckBinary64Identity;
      readonly mbarToPa: Phase10C0VRadialCheckBinary64Identity;
    };
  };
  readonly requestedRoster: readonly {
    readonly caseId: string;
    readonly requestedSpacingM: Phase10C0VRadialCheckBinary64Identity;
  }[];
  readonly derivedPhysics: {
    readonly temperatureK: Phase10C0VRadialCheckBinary64Identity;
    readonly saturationPressurePa: Phase10C0VRadialCheckBinary64Identity;
    readonly saturationNumberDensityPerM3: Phase10C0VRadialCheckBinary64Identity;
    readonly diffusivityM2S: Phase10C0VRadialCheckBinary64Identity;
    readonly thermalSpeedMS: Phase10C0VRadialCheckBinary64Identity;
    readonly kineticVelocityMS: Phase10C0VRadialCheckBinary64Identity;
    readonly kineticLengthM: Phase10C0VRadialCheckBinary64Identity;
  };
  readonly cases: readonly Phase10C0VRadialCheckCandidateCase[];
  readonly uniformFieldControl: {
    readonly alphaHKConst: Phase10C0VRadialCheckBinary64Identity;
    readonly cases: readonly {
      readonly caseId: string;
      readonly requestedSpacingM: Phase10C0VRadialCheckBinary64Identity;
      readonly actualSpacingM: Phase10C0VRadialCheckBinary64Identity;
      readonly nodeCount: number;
      readonly sigmaSurface: Phase10C0VRadialCheckBinary64Identity;
      readonly sigmaShell: Phase10C0VRadialCheckBinary64Identity;
      readonly surfaceGradientPerM: Phase10C0VRadialCheckBinary64Identity;
      readonly growthVelocityFluxMS: Phase10C0VRadialCheckBinary64Identity;
      readonly growthVelocityKineticMS: Phase10C0VRadialCheckBinary64Identity;
      readonly robinResidual: Phase10C0VRadialCheckBinary64Identity;
      readonly samples: readonly Phase10C0VRadialCheckCandidateSample[];
    }[];
  };
  readonly scope: {
    readonly control: "finite-shell-constant-coefficient-spherical-robin";
    readonly orderDisposition: "not-applicable-exact-u-roundoff-control";
    readonly physicalValidationClaim: false;
    readonly habitClaim: false;
    readonly solverExecuted: false;
  };
}

export interface Phase10C0VRadialCheckMetric {
  readonly value: Phase10C0VRadialCheckBinary64Identity;
  readonly tolerance: Phase10C0VRadialCheckBinary64Identity;
  readonly pass: boolean;
}

export interface Phase10C0VRadialIndependentSample {
  readonly nodeIndex: number;
  readonly radiusM: Phase10C0VRadialCheckBinary64Identity;
  readonly sigma: Phase10C0VRadialCheckBinary64Identity;
}

export interface Phase10C0VRadialIndependentCase {
  readonly caseId: string;
  readonly requestedSpacingM: Phase10C0VRadialCheckBinary64Identity;
  readonly actualSpacingM: Phase10C0VRadialCheckBinary64Identity;
  readonly nodeCount: number;
  readonly robinLambda: Phase10C0VRadialCheckBinary64Identity;
  readonly harmonicConstant: Phase10C0VRadialCheckBinary64Identity;
  readonly harmonicInverseRadiusCoefficientM: Phase10C0VRadialCheckBinary64Identity;
  readonly sigmaSurface: Phase10C0VRadialCheckBinary64Identity;
  readonly sigmaShell: Phase10C0VRadialCheckBinary64Identity;
  readonly surfaceGradientPerM: Phase10C0VRadialCheckBinary64Identity;
  readonly growthVelocityMS: Phase10C0VRadialCheckBinary64Identity;
  readonly samples: readonly Phase10C0VRadialIndependentSample[];
}

export interface Phase10C0VRadialIndependentUniformCase {
  readonly caseId: string;
  readonly requestedSpacingM: Phase10C0VRadialCheckBinary64Identity;
  readonly actualSpacingM: Phase10C0VRadialCheckBinary64Identity;
  readonly nodeCount: number;
  readonly sigmaSurface: Phase10C0VRadialCheckBinary64Identity;
  readonly sigmaShell: Phase10C0VRadialCheckBinary64Identity;
  readonly surfaceGradientPerM: Phase10C0VRadialCheckBinary64Identity;
  readonly growthVelocityFluxMS: Phase10C0VRadialCheckBinary64Identity;
  readonly growthVelocityKineticMS: Phase10C0VRadialCheckBinary64Identity;
  readonly robinResidual: Phase10C0VRadialCheckBinary64Identity;
  readonly samples: readonly Phase10C0VRadialIndependentSample[];
}

export interface Phase10C0VRadialCaseCheck {
  readonly caseId: string;
  readonly exactRoster: boolean;
  readonly independent: Phase10C0VRadialIndependentCase;
  readonly independentUniformFieldControl: Phase10C0VRadialIndependentUniformCase;
  readonly metrics: {
    readonly surfaceRelative: Phase10C0VRadialCheckMetric;
    readonly velocityRelative: Phase10C0VRadialCheckMetric;
    readonly fieldRelativeLInf: Phase10C0VRadialCheckMetric;
    readonly fieldWeightedRelativeL2: Phase10C0VRadialCheckMetric;
    readonly shellNormalized: Phase10C0VRadialCheckMetric;
    readonly uniformNormalizedLInf: Phase10C0VRadialCheckMetric;
    readonly robinResidualNormalized: Phase10C0VRadialCheckMetric;
    readonly generatorCheckerAgreement: Phase10C0VRadialCheckMetric;
  };
  readonly exactUniformZeroRates: boolean;
  readonly errors: readonly string[];
  readonly pass: boolean;
}

export interface Phase10C0VRadialReferenceCheck {
  readonly schema: "phase10-c0v-radial-reference-check-v1";
  readonly protocolId: string;
  readonly method: "independent-closed-form-lambda";
  readonly independentDerivedPhysics: {
    readonly temperatureK: Phase10C0VRadialCheckBinary64Identity;
    readonly saturationPressurePa: Phase10C0VRadialCheckBinary64Identity;
    readonly saturationNumberDensityPerM3: Phase10C0VRadialCheckBinary64Identity;
    readonly diffusivityM2S: Phase10C0VRadialCheckBinary64Identity;
    readonly thermalSpeedMS: Phase10C0VRadialCheckBinary64Identity;
    readonly kineticVelocityMS: Phase10C0VRadialCheckBinary64Identity;
    readonly kineticLengthM: Phase10C0VRadialCheckBinary64Identity;
  };
  readonly exactOperandEcho: boolean;
  readonly exactRoster: boolean;
  readonly cases: readonly Phase10C0VRadialCaseCheck[];
  readonly maxima: {
    readonly surfaceRelative: Phase10C0VRadialCheckMetric;
    readonly velocityRelative: Phase10C0VRadialCheckMetric;
    readonly fieldRelativeLInf: Phase10C0VRadialCheckMetric;
    readonly fieldWeightedRelativeL2: Phase10C0VRadialCheckMetric;
    readonly shellNormalized: Phase10C0VRadialCheckMetric;
    readonly uniformNormalizedLInf: Phase10C0VRadialCheckMetric;
    readonly robinResidualNormalized: Phase10C0VRadialCheckMetric;
    readonly generatorCheckerAgreement: Phase10C0VRadialCheckMetric;
  };
  readonly allFinite: boolean;
  readonly errors: readonly string[];
  readonly pass: boolean;
}

type MetricName = keyof Phase10C0VRadialCheckToleranceSet;

function fail(detail: string): never {
  throw new Error(`Phase 10 C0V independent radial reference check refused: ${detail}`);
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) fail(`${label} must be finite`);
  return value;
}

function positive(value: number, label: string): number {
  finite(value, label);
  if (!(value > 0)) fail(`${label} must be positive`);
  return value;
}

function binary64Hex(value: number): string {
  finite(value, "identified value");
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  let result = "";
  for (let offset = 0; offset < 8; offset++) result += view.getUint8(offset).toString(16).padStart(2, "0");
  return result;
}

function decimal(value: number): string {
  finite(value, "identified value");
  return Object.is(value, -0) ? "-0" : `${value}`;
}

function identify(value: number): Phase10C0VRadialCheckBinary64Identity {
  const normalized = Object.is(value, -0) ? 0 : value;
  return Object.freeze({ decimal: decimal(normalized), binary64Hex: binary64Hex(normalized) });
}

function identityValue(identity: Phase10C0VRadialCheckBinary64Identity, label: string): number {
  if (
    identity === null || typeof identity !== "object" || Array.isArray(identity) ||
    Object.keys(identity).length !== 2 || !("decimal" in identity) || !("binary64Hex" in identity)
  ) fail(`${label} is not an exact binary64 identity object`);
  if (
    typeof identity.decimal !== "string" ||
    !/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/u.test(identity.decimal)
  ) fail(`${label}.decimal is not a finite JSON-number spelling`);
  if (typeof identity.binary64Hex !== "string" || !/^[0-9a-f]{16}$/u.test(identity.binary64Hex)) {
    fail(`${label}.binary64Hex must be 16 lowercase big-endian hexadecimal digits`);
  }
  const value = Number(identity.decimal);
  finite(value, `${label}.decimal`);
  if (Object.is(value, -0)) fail(`${label}.decimal must not encode negative zero`);
  if (binary64Hex(value) !== identity.binary64Hex) fail(`${label} decimal/binary64 identity differs`);
  return value;
}

function identitiesEqual(identity: Phase10C0VRadialCheckBinary64Identity, value: number): boolean {
  const expected = identify(value);
  return identity.decimal === expected.decimal && identity.binary64Hex === expected.binary64Hex;
}

function validateInput(input: Phase10C0VRadialCheckInput): void {
  if (typeof input.protocolId !== "string" || input.protocolId.length === 0 || input.protocolId !== input.protocolId.trim()) {
    fail("protocolId must be a non-empty trimmed string");
  }
  const { operands } = input;
  positive(operands.radiusM, "radiusM");
  positive(operands.farRadiusM, "farRadiusM");
  if (!(operands.farRadiusM > operands.radiusM)) fail("farRadiusM must exceed radiusM");
  positive(operands.sigmaInfinity, "sigmaInfinity");
  finite(operands.tempC, "tempC");
  positive(operands.pressurePa, "pressurePa");
  finite(operands.alphaHKConst, "alphaHKConst");
  if (operands.alphaHKConst < 0) fail("alphaHKConst must be non-negative");
  for (const [name, value] of Object.entries(operands.physicalConstants)) {
    if (name === "saturationPressureExponentK") {
      finite(value, `physicalConstants.${name}`);
      if (!(value < 0)) fail(`physicalConstants.${name} must be the signed negative exponent`);
    } else {
      positive(value, `physicalConstants.${name}`);
    }
  }
  positive(operands.tempC + operands.physicalConstants.celsiusZeroK, "temperatureK");
  if (!Array.isArray(input.roster) || input.roster.length === 0) fail("roster must be non-empty");
  const ids = new Set<string>();
  const spacings = new Set<number>();
  for (const [index, item] of input.roster.entries()) {
    if (typeof item.caseId !== "string" || item.caseId.length === 0 || item.caseId !== item.caseId.trim()) {
      fail(`roster[${index}].caseId must be a non-empty trimmed string`);
    }
    if (ids.has(item.caseId)) fail(`duplicate caseId ${item.caseId}`);
    positive(item.requestedSpacingM, `roster[${index}].requestedSpacingM`);
    if (!Number.isSafeInteger(item.expectedIntervalCount) || item.expectedIntervalCount < 2) {
      fail(`roster[${index}].expectedIntervalCount must be a safe integer >= 2`);
    }
    if (item.expectedNodeCount !== item.expectedIntervalCount + 1) {
      fail(`roster[${index}] expected node and interval counts disagree`);
    }
    positive(item.expectedActualSpacingM, `roster[${index}].expectedActualSpacingM`);
    if (
      !Number.isSafeInteger(item.actualSpacingUmNumerator) || item.actualSpacingUmNumerator <= 0 ||
      !Number.isSafeInteger(item.actualSpacingUmDenominator) || item.actualSpacingUmDenominator <= 0
    ) fail(`roster[${index}] actual-spacing rational must use positive safe integers`);
    const computedNodeCount = expectedNodeCount(
      operands.radiusM,
      operands.farRadiusM,
      item.requestedSpacingM,
    );
    const computedActualSpacingM =
      (operands.farRadiusM - operands.radiusM) / item.expectedIntervalCount;
    if (
      computedNodeCount !== item.expectedNodeCount ||
      !Object.is(computedActualSpacingM, item.expectedActualSpacingM)
    ) fail(`roster[${index}] frozen node count or actual spacing differs from the node rule`);
    const rationalSpacingUm = item.actualSpacingUmNumerator / item.actualSpacingUmDenominator;
    const observedSpacingUm = item.expectedActualSpacingM * 1e6;
    if (
      Math.abs(observedSpacingUm - rationalSpacingUm) >
      4 * Number.EPSILON * Math.max(Math.abs(observedSpacingUm), Math.abs(rationalSpacingUm))
    ) fail(`roster[${index}] exact micrometre rational differs from expectedActualSpacingM`);
    if (spacings.has(item.requestedSpacingM)) fail(`duplicate requested spacing at roster[${index}]`);
    ids.add(item.caseId);
    spacings.add(item.requestedSpacingM);
  }
  for (const [name, tolerance] of Object.entries(input.tolerances)) {
    finite(tolerance, `tolerances.${name}`);
    if (tolerance < 0) fail(`tolerances.${name} must be non-negative`);
  }
}

function relativeToReference(observed: number, expected: number): number {
  finite(observed, "observed comparison value");
  finite(expected, "expected comparison value");
  const scale = Math.max(Math.abs(expected), Number.MIN_VALUE);
  return Math.abs(observed - expected) / scale;
}

function expectedNodeCount(radiusM: number, farRadiusM: number, requestedSpacingM: number): number {
  return Math.max(3, Math.round((farRadiusM - radiusM) / requestedSpacingM) + 1);
}

function expectedRadius(radiusM: number, farRadiusM: number, spacingM: number, nodeIndex: number, nodeCount: number): number {
  if (nodeIndex === 0) return radiusM;
  if (nodeIndex === nodeCount - 1) return farRadiusM;
  return radiusM + spacingM * nodeIndex;
}

function metric(value: number, tolerance: number): Phase10C0VRadialCheckMetric {
  finite(value, "metric value");
  return Object.freeze({ value: identify(value), tolerance: identify(tolerance), pass: value <= tolerance });
}

function maxOf(values: readonly number[]): number {
  if (values.length === 0) fail("cannot reduce an empty metric roster");
  return Math.max(...values.map((value, index) => finite(value, `metric[${index}]`)));
}

function weightedRelativeL2(
  radii: readonly number[],
  observed: readonly number[],
  expected: readonly number[],
  spacingM: number,
): number {
  if (radii.length !== observed.length || radii.length !== expected.length || radii.length < 2) {
    fail("weighted L2 operands have different or insufficient lengths");
  }
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < radii.length; index++) {
    // Frozen spherical trapezoid rule: each endpoint has factor 1/2, every interior node has
    // factor 1, and the radial volume weight is factor * r_i^2 * actualSpacingM. The common
    // angular factor cancels from the relative norm and is deliberately omitted.
    const endpointFactor = index === 0 || index === radii.length - 1 ? 0.5 : 1;
    const weight = endpointFactor * radii[index]! * radii[index]! * spacingM;
    const error = observed[index]! - expected[index]!;
    numerator += weight * error * error;
    denominator += weight * expected[index]! * expected[index]!;
  }
  if (!(denominator > 0) || !Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    fail("weighted L2 denominator or numerator is invalid");
  }
  return Math.sqrt(numerator / denominator);
}

function exactOperandEcho(input: Phase10C0VRadialCheckInput, candidate: Phase10C0VRadialCheckCandidate): boolean {
  const { operands } = input;
  const candidateConstants = candidate.operands.physicalConstants;
  const scalarPairs: readonly [Phase10C0VRadialCheckBinary64Identity, number, string][] = [
    [candidate.operands.radiusM, operands.radiusM, "radiusM"],
    [candidate.operands.farRadiusM, operands.farRadiusM, "farRadiusM"],
    [candidate.operands.sigmaInfinity, operands.sigmaInfinity, "sigmaInfinity"],
    [candidate.operands.tempC, operands.tempC, "tempC"],
    [candidate.operands.pressurePa, operands.pressurePa, "pressurePa"],
    [candidate.operands.alphaHKConst, operands.alphaHKConst, "alphaHKConst"],
    [candidateConstants.kBoltzmannJPerK, operands.physicalConstants.kBoltzmannJPerK, "kBoltzmannJPerK"],
    [candidateConstants.celsiusZeroK, operands.physicalConstants.celsiusZeroK, "celsiusZeroK"],
    [candidateConstants.waterMoleculeMassKg, operands.physicalConstants.waterMoleculeMassKg, "waterMoleculeMassKg"],
    [candidateConstants.iceNumberDensityPerM3, operands.physicalConstants.iceNumberDensityPerM3, "iceNumberDensityPerM3"],
    [candidateConstants.diffusivityAir1AtmM2S, operands.physicalConstants.diffusivityAir1AtmM2S, "diffusivityAir1AtmM2S"],
    [candidateConstants.standardAtmospherePa, operands.physicalConstants.standardAtmospherePa, "standardAtmospherePa"],
    [candidateConstants.saturationPressurePrefactorMbar, operands.physicalConstants.saturationPressurePrefactorMbar, "saturationPressurePrefactorMbar"],
    [candidateConstants.saturationPressureExponentK, operands.physicalConstants.saturationPressureExponentK, "saturationPressureExponentK"],
    [candidateConstants.mbarToPa, operands.physicalConstants.mbarToPa, "mbarToPa"],
  ];
  return scalarPairs.every(([identity, value, label]) => {
    identityValue(identity, `candidate operand ${label}`);
    return identitiesEqual(identity, value);
  });
}

function independentPhysics(input: Phase10C0VRadialCheckInput): {
  readonly temperatureK: number;
  readonly saturationPressurePa: number;
  readonly saturationNumberDensityPerM3: number;
  readonly diffusivityM2S: number;
  readonly thermalSpeedMS: number;
  readonly kineticVelocityMS: number;
  readonly kineticLengthM: number;
} {
  const { operands } = input;
  const constants = operands.physicalConstants;
  const temperatureK = constants.celsiusZeroK + operands.tempC;
  const thermalSpeedMS = Math.sqrt(
    constants.kBoltzmannJPerK * temperatureK /
    (constants.waterMoleculeMassKg * (2 * Math.PI)),
  );
  const diffusivityM2S =
    (constants.diffusivityAir1AtmM2S * constants.standardAtmospherePa) / operands.pressurePa;
  // Algebraic cancellation of c_sat/c_ice in X_0 = (c_sat/c_ice)D/v_kin is intentional:
  // the generator evaluates the unsimplified expression, while this checker obtains X_0
  // directly from D and the molecular thermal speed.
  const kineticLengthM = diffusivityM2S / thermalSpeedMS;
  const saturationPressurePa = constants.mbarToPa * constants.saturationPressurePrefactorMbar *
    Math.exp(constants.saturationPressureExponentK / temperatureK);
  const saturationNumberDensityPerM3 = saturationPressurePa / temperatureK / constants.kBoltzmannJPerK;
  const kineticVelocityMS = thermalSpeedMS * saturationNumberDensityPerM3 / constants.iceNumberDensityPerM3;
  for (const [name, value] of Object.entries({
    temperatureK,
    saturationPressurePa,
    saturationNumberDensityPerM3,
    diffusivityM2S,
    thermalSpeedMS,
    kineticVelocityMS,
    kineticLengthM,
  })) positive(value, `independent ${name}`);
  return Object.freeze({
    temperatureK,
    saturationPressurePa,
    saturationNumberDensityPerM3,
    diffusivityM2S,
    thermalSpeedMS,
    kineticVelocityMS,
    kineticLengthM,
  });
}

function expectedCase(
  input: Phase10C0VRadialCheckInput,
  rosterItem: Phase10C0VRadialCheckInput["roster"][number],
  physics: ReturnType<typeof independentPhysics>,
): { readonly value: Phase10C0VRadialIndependentCase; readonly numericSamples: readonly number[]; readonly radii: readonly number[] } {
  const { radiusM, farRadiusM, sigmaInfinity, alphaHKConst } = input.operands;
  const { caseId, requestedSpacingM, expectedNodeCount: nodeCount, expectedActualSpacingM: actualSpacingM } = rosterItem;
  const robinLambda = (alphaHKConst * radiusM / physics.kineticLengthM) * (1 - radiusM / farRadiusM);
  const sigmaSurface = sigmaInfinity / (1 + robinLambda);
  const depletionCoefficientM = alphaHKConst * sigmaSurface * radiusM * radiusM / physics.kineticLengthM;
  const harmonicInverseRadiusCoefficientM = -depletionCoefficientM;
  const harmonicConstant = sigmaInfinity + depletionCoefficientM / farRadiusM;
  const sigmaShell = sigmaInfinity;
  const surfaceGradientPerM = alphaHKConst * sigmaSurface / physics.kineticLengthM;
  const growthVelocityMS = alphaHKConst * physics.kineticVelocityMS * sigmaSurface;
  const samples: Phase10C0VRadialIndependentSample[] = [];
  const numericSamples: number[] = [];
  const radii: number[] = [];
  const inverseSpan = 1 / radiusM - 1 / farRadiusM;
  const surfaceDrop = sigmaInfinity - sigmaSurface;
  for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex++) {
    const radiusAtNodeM = expectedRadius(radiusM, farRadiusM, actualSpacingM, nodeIndex, nodeCount);
    const radialFraction = (1 / radiusAtNodeM - 1 / farRadiusM) / inverseSpan;
    const sigma = sigmaInfinity - surfaceDrop * radialFraction;
    radii.push(radiusAtNodeM);
    numericSamples.push(sigma);
    samples.push(Object.freeze({ nodeIndex, radiusM: identify(radiusAtNodeM), sigma: identify(sigma) }));
  }
  return Object.freeze({
    value: Object.freeze({
      caseId,
      requestedSpacingM: identify(requestedSpacingM),
      actualSpacingM: identify(actualSpacingM),
      nodeCount,
      robinLambda: identify(robinLambda),
      harmonicConstant: identify(harmonicConstant),
      harmonicInverseRadiusCoefficientM: identify(harmonicInverseRadiusCoefficientM),
      sigmaSurface: identify(sigmaSurface),
      sigmaShell: identify(sigmaShell),
      surfaceGradientPerM: identify(surfaceGradientPerM),
      growthVelocityMS: identify(growthVelocityMS),
      samples: Object.freeze(samples),
    }),
    numericSamples: Object.freeze(numericSamples),
    radii: Object.freeze(radii),
  });
}

function candidateSampleValues(
  candidateCase: Phase10C0VRadialCheckCandidateCase,
  expected: Phase10C0VRadialIndependentCase,
  errors: string[],
): { readonly radii: readonly number[]; readonly sigmas: readonly number[]; readonly exactRoster: boolean } {
  let exactRoster =
    candidateCase.caseId === expected.caseId &&
    candidateCase.nodeCount === expected.nodeCount &&
    identitiesEqual(candidateCase.requestedSpacingM, identityValue(expected.requestedSpacingM, "expected requested spacing")) &&
    identitiesEqual(candidateCase.actualSpacingM, identityValue(expected.actualSpacingM, "expected actual spacing")) &&
    candidateCase.samples.length === expected.nodeCount;
  const radii: number[] = [];
  const sigmas: number[] = [];
  const count = Math.min(candidateCase.samples.length, expected.nodeCount);
  for (let nodeIndex = 0; nodeIndex < count; nodeIndex++) {
    const sample = candidateCase.samples[nodeIndex]!;
    const expectedSample = expected.samples[nodeIndex]!;
    const radius = identityValue(sample.radiusM, `${candidateCase.caseId} sample ${nodeIndex} radius`);
    const sigma = identityValue(sample.sigma, `${candidateCase.caseId} sample ${nodeIndex} sigma`);
    const expectedRadiusValue = identityValue(expectedSample.radiusM, `${candidateCase.caseId} expected radius ${nodeIndex}`);
    if (sample.nodeIndex !== nodeIndex || !identitiesEqual(sample.radiusM, expectedRadiusValue)) exactRoster = false;
    radii.push(radius);
    sigmas.push(sigma);
  }
  if (!exactRoster) errors.push(`${expected.caseId}: candidate node/requested/actual-spacing roster differs`);
  if (count !== expected.nodeCount) {
    // Fill only to keep later calculations well-defined; exactRoster already makes the case fail.
    for (let nodeIndex = count; nodeIndex < expected.nodeCount; nodeIndex++) {
      radii.push(identityValue(expected.samples[nodeIndex]!.radiusM, `${expected.caseId} fallback radius ${nodeIndex}`));
      sigmas.push(Number.NaN);
    }
  }
  return Object.freeze({ radii: Object.freeze(radii), sigmas: Object.freeze(sigmas), exactRoster });
}

function metricValues(caseCheck: Phase10C0VRadialCaseCheck): Readonly<Record<MetricName, number>> {
  return Object.freeze({
    surfaceRelative: identityValue(caseCheck.metrics.surfaceRelative.value, `${caseCheck.caseId} surface metric`),
    velocityRelative: identityValue(caseCheck.metrics.velocityRelative.value, `${caseCheck.caseId} velocity metric`),
    fieldRelativeLInf: identityValue(caseCheck.metrics.fieldRelativeLInf.value, `${caseCheck.caseId} field Linf metric`),
    fieldWeightedRelativeL2: identityValue(caseCheck.metrics.fieldWeightedRelativeL2.value, `${caseCheck.caseId} field L2 metric`),
    shellNormalized: identityValue(caseCheck.metrics.shellNormalized.value, `${caseCheck.caseId} shell metric`),
    uniformNormalizedLInf: identityValue(caseCheck.metrics.uniformNormalizedLInf.value, `${caseCheck.caseId} uniform metric`),
    robinResidualNormalized: identityValue(caseCheck.metrics.robinResidualNormalized.value, `${caseCheck.caseId} Robin metric`),
    generatorCheckerAgreement: identityValue(caseCheck.metrics.generatorCheckerAgreement.value, `${caseCheck.caseId} agreement metric`),
  });
}

/**
 * Independently check the generator candidate using the finite-shell closed form.
 * The function returns a complete second derivation plus metrics; it never trusts a producer
 * verdict and throws on malformed binary64 identities.
 */
export function independentlyCheckPhase10C0VRadialReference(
  input: Phase10C0VRadialCheckInput,
  candidate: Phase10C0VRadialCheckCandidate,
): Phase10C0VRadialReferenceCheck {
  validateInput(input);
  const errors: string[] = [];
  if (
    candidate.schema !== "phase10-c0v-radial-reference-candidate-v1" ||
    candidate.protocolId !== input.protocolId ||
    candidate.method !== "independent-2x2-harmonic-coefficients"
  ) errors.push("candidate schema, protocol, or method differs");
  if (
    candidate.scope.control !== "finite-shell-constant-coefficient-spherical-robin" ||
    candidate.scope.orderDisposition !== "not-applicable-exact-u-roundoff-control" ||
    candidate.scope.physicalValidationClaim !== false || candidate.scope.habitClaim !== false ||
    candidate.scope.solverExecuted !== false
  ) errors.push("candidate scope boundary differs");
  const operandsMatch = exactOperandEcho(input, candidate);
  if (!operandsMatch) errors.push("candidate exact operand echo differs");
  const requestedRosterMatches =
    candidate.requestedRoster.length === input.roster.length &&
    candidate.cases.length === input.roster.length &&
    candidate.uniformFieldControl.cases.length === input.roster.length &&
    input.roster.every((item, index) => {
      const echoed = candidate.requestedRoster[index];
      return echoed?.caseId === item.caseId && identitiesEqual(echoed.requestedSpacingM, item.requestedSpacingM);
    });
  if (!requestedRosterMatches) errors.push("candidate requested case roster differs");
  const physics = independentPhysics(input);
  const independentDerivedPhysics = Object.freeze({
    temperatureK: identify(physics.temperatureK),
    saturationPressurePa: identify(physics.saturationPressurePa),
    saturationNumberDensityPerM3: identify(physics.saturationNumberDensityPerM3),
    diffusivityM2S: identify(physics.diffusivityM2S),
    thermalSpeedMS: identify(physics.thermalSpeedMS),
    kineticVelocityMS: identify(physics.kineticVelocityMS),
    kineticLengthM: identify(physics.kineticLengthM),
  });
  const physicalAgreementValues = [
    relativeToReference(identityValue(candidate.derivedPhysics.temperatureK, "candidate temperatureK"), physics.temperatureK),
    relativeToReference(identityValue(candidate.derivedPhysics.saturationPressurePa, "candidate saturationPressurePa"), physics.saturationPressurePa),
    relativeToReference(identityValue(candidate.derivedPhysics.saturationNumberDensityPerM3, "candidate saturationNumberDensityPerM3"), physics.saturationNumberDensityPerM3),
    relativeToReference(identityValue(candidate.derivedPhysics.diffusivityM2S, "candidate diffusivityM2S"), physics.diffusivityM2S),
    relativeToReference(identityValue(candidate.derivedPhysics.thermalSpeedMS, "candidate thermalSpeedMS"), physics.thermalSpeedMS),
    relativeToReference(identityValue(candidate.derivedPhysics.kineticVelocityMS, "candidate kineticVelocityMS"), physics.kineticVelocityMS),
    relativeToReference(identityValue(candidate.derivedPhysics.kineticLengthM, "candidate kineticLengthM"), physics.kineticLengthM),
  ];
  const caseChecks: Phase10C0VRadialCaseCheck[] = [];
  for (const [index, rosterItem] of input.roster.entries()) {
    const candidateCase = candidate.cases[index];
    const uniformCase = candidate.uniformFieldControl.cases[index];
    const caseErrors: string[] = [];
    const expected = expectedCase(input, rosterItem, physics);
    if (candidateCase === undefined || uniformCase === undefined) {
      fail(`${rosterItem.caseId} candidate or uniform case is missing`);
    }
    const candidateValues = candidateSampleValues(candidateCase, expected.value, caseErrors);
    const independentUniformFieldControl: Phase10C0VRadialIndependentUniformCase = Object.freeze({
      caseId: expected.value.caseId,
      requestedSpacingM: expected.value.requestedSpacingM,
      actualSpacingM: expected.value.actualSpacingM,
      nodeCount: expected.value.nodeCount,
      sigmaSurface: identify(input.operands.sigmaInfinity),
      sigmaShell: identify(input.operands.sigmaInfinity),
      surfaceGradientPerM: identify(0),
      growthVelocityFluxMS: identify(0),
      growthVelocityKineticMS: identify(0),
      robinResidual: identify(0),
      samples: Object.freeze(expected.value.samples.map((sample) => Object.freeze({
        nodeIndex: sample.nodeIndex,
        radiusM: sample.radiusM,
        sigma: identify(input.operands.sigmaInfinity),
      }))),
    });
    const observedSurface = identityValue(candidateCase.sigmaSurface, `${rosterItem.caseId} sigmaSurface`);
    const observedShell = identityValue(candidateCase.sigmaShell, `${rosterItem.caseId} sigmaShell`);
    const observedGradient = identityValue(candidateCase.surfaceGradientPerM, `${rosterItem.caseId} surfaceGradientPerM`);
    const observedFluxVelocity = identityValue(candidateCase.growthVelocityFluxMS, `${rosterItem.caseId} growthVelocityFluxMS`);
    const observedKineticVelocity = identityValue(candidateCase.growthVelocityKineticMS, `${rosterItem.caseId} growthVelocityKineticMS`);
    const storedRobinResidual = identityValue(candidateCase.robinResidual, `${rosterItem.caseId} robinResidual`);
    const expectedSurface = identityValue(expected.value.sigmaSurface, `${rosterItem.caseId} expected sigmaSurface`);
    const expectedShell = input.operands.sigmaInfinity;
    const expectedGradient = identityValue(expected.value.surfaceGradientPerM, `${rosterItem.caseId} expected surfaceGradientPerM`);
    const expectedVelocity = identityValue(expected.value.growthVelocityMS, `${rosterItem.caseId} expected growthVelocityMS`);
    const surfaceRelative = relativeToReference(observedSurface, expectedSurface);
    const velocityRelative = Math.max(
      relativeToReference(observedFluxVelocity, expectedVelocity),
      relativeToReference(observedKineticVelocity, expectedVelocity),
    );
    const absoluteFieldErrors = candidateValues.sigmas.map((sigma, sampleIndex) =>
      Math.abs(sigma - expected.numericSamples[sampleIndex]!));
    const fieldReferenceLInf = maxOf(expected.numericSamples.map((sigma) => Math.abs(sigma)));
    const fieldRelativeLInf = maxOf(absoluteFieldErrors) /
      Math.max(fieldReferenceLInf, Number.MIN_VALUE);
    const fieldWeightedRelativeL2 = weightedRelativeL2(
      expected.radii,
      candidateValues.sigmas,
      expected.numericSamples,
      identityValue(expected.value.actualSpacingM, `${rosterItem.caseId} expected spacing`),
    );
    const shellNormalized = Math.abs(observedShell - expectedShell) /
      Math.max(Math.abs(expectedShell), Number.MIN_VALUE);
    let uniformRosterExact =
      uniformCase.caseId === expected.value.caseId &&
      uniformCase.nodeCount === expected.value.nodeCount &&
      uniformCase.samples.length === expected.value.nodeCount &&
      identitiesEqual(uniformCase.requestedSpacingM, rosterItem.requestedSpacingM) &&
      identitiesEqual(
        uniformCase.actualSpacingM,
        identityValue(expected.value.actualSpacingM, `${rosterItem.caseId} expected uniform spacing`),
      );
    const uniformSigmas = uniformCase.samples.map((sample, sampleIndex) => {
      const expectedSample = expected.value.samples[sampleIndex];
      if (
        expectedSample === undefined || sample.nodeIndex !== sampleIndex ||
        !identitiesEqual(
          sample.radiusM,
          expectedSample === undefined
            ? Number.NaN
            : identityValue(expectedSample.radiusM, `${rosterItem.caseId} expected uniform radius ${sampleIndex}`),
        )
      ) uniformRosterExact = false;
      return identityValue(sample.sigma, `${rosterItem.caseId} uniform sigma ${sampleIndex}`);
    });
    if (!uniformRosterExact) caseErrors.push(`${rosterItem.caseId}: uniform node/requested/actual-spacing roster differs`);
    const uniformSurface = identityValue(uniformCase.sigmaSurface, `${rosterItem.caseId} uniform surface`);
    const uniformShell = identityValue(uniformCase.sigmaShell, `${rosterItem.caseId} uniform shell`);
    const uniformNormalizedLInf = maxOf([
      ...uniformSigmas.map((sigma) => Math.abs(sigma - input.operands.sigmaInfinity)),
      Math.abs(uniformSurface - input.operands.sigmaInfinity),
      Math.abs(uniformShell - input.operands.sigmaInfinity),
    ]) / Math.max(Math.abs(input.operands.sigmaInfinity), Number.MIN_VALUE);
    const observedRobinResidual = physics.kineticLengthM * observedGradient -
      input.operands.alphaHKConst * observedSurface;
    const robinScale = Math.max(
      Math.abs(physics.kineticLengthM * observedGradient),
      Math.abs(input.operands.alphaHKConst * observedSurface),
      Number.MIN_VALUE,
    );
    const robinResidualNormalized = Math.max(
      Math.abs(observedRobinResidual) / robinScale,
      Math.abs(storedRobinResidual - observedRobinResidual) / robinScale,
    );
    const expectedHarmonicConstant = identityValue(expected.value.harmonicConstant, `${rosterItem.caseId} expected harmonic constant`);
    const expectedHarmonicInverse = identityValue(
      expected.value.harmonicInverseRadiusCoefficientM,
      `${rosterItem.caseId} expected inverse-radius coefficient`,
    );
    const generatorCheckerAgreement = maxOf([
      ...physicalAgreementValues,
      relativeToReference(identityValue(candidateCase.harmonicConstant, `${rosterItem.caseId} harmonicConstant`), expectedHarmonicConstant),
      relativeToReference(identityValue(candidateCase.harmonicInverseRadiusCoefficientM, `${rosterItem.caseId} inverse-radius coefficient`), expectedHarmonicInverse),
      relativeToReference(observedSurface, expectedSurface),
      relativeToReference(observedShell, expectedShell),
      relativeToReference(observedGradient, expectedGradient),
      relativeToReference(observedFluxVelocity, expectedVelocity),
      relativeToReference(observedKineticVelocity, expectedVelocity),
      ...candidateValues.sigmas.map((sigma, sampleIndex) =>
        relativeToReference(sigma, expected.numericSamples[sampleIndex]!)),
    ]);
    const uniformRateValues = [
      identityValue(uniformCase.surfaceGradientPerM, `${rosterItem.caseId} uniform gradient`),
      identityValue(uniformCase.growthVelocityFluxMS, `${rosterItem.caseId} uniform flux velocity`),
      identityValue(uniformCase.growthVelocityKineticMS, `${rosterItem.caseId} uniform kinetic velocity`),
      identityValue(uniformCase.robinResidual, `${rosterItem.caseId} uniform Robin residual`),
    ];
    const exactUniformZeroRates = uniformRateValues.every((value) => Object.is(value, 0));
    if (!exactUniformZeroRates) caseErrors.push(`${rosterItem.caseId}: uniform zero-attachment rates are not exact zero`);
    if (!identitiesEqual(candidate.uniformFieldControl.alphaHKConst, 0)) {
      caseErrors.push(`${rosterItem.caseId}: uniform control coefficient is not exact zero`);
    }
    const metrics = Object.freeze({
      surfaceRelative: metric(surfaceRelative, input.tolerances.surfaceRelative),
      velocityRelative: metric(velocityRelative, input.tolerances.velocityRelative),
      fieldRelativeLInf: metric(fieldRelativeLInf, input.tolerances.fieldRelativeLInf),
      fieldWeightedRelativeL2: metric(fieldWeightedRelativeL2, input.tolerances.fieldWeightedRelativeL2),
      shellNormalized: metric(shellNormalized, input.tolerances.shellNormalized),
      uniformNormalizedLInf: metric(uniformNormalizedLInf, input.tolerances.uniformNormalizedLInf),
      robinResidualNormalized: metric(robinResidualNormalized, input.tolerances.robinResidualNormalized),
      generatorCheckerAgreement: metric(generatorCheckerAgreement, input.tolerances.generatorCheckerAgreement),
    });
    const allMetricsPass = Object.values(metrics).every((entry) => entry.pass);
    const caseRosterExact = candidateValues.exactRoster && uniformRosterExact;
    const casePass = caseRosterExact && exactUniformZeroRates && caseErrors.length === 0 && allMetricsPass;
    caseChecks.push(Object.freeze({
      caseId: rosterItem.caseId,
      exactRoster: caseRosterExact,
      independent: expected.value,
      independentUniformFieldControl,
      metrics,
      exactUniformZeroRates,
      errors: Object.freeze(caseErrors),
      pass: casePass,
    }));
  }
  const maximaValues = Object.fromEntries(
    (Object.keys(input.tolerances) as MetricName[]).map((name) => [
      name,
      maxOf(caseChecks.map((caseCheck) => metricValues(caseCheck)[name])),
    ]),
  ) as Record<MetricName, number>;
  const maxima = Object.freeze({
    surfaceRelative: metric(maximaValues.surfaceRelative, input.tolerances.surfaceRelative),
    velocityRelative: metric(maximaValues.velocityRelative, input.tolerances.velocityRelative),
    fieldRelativeLInf: metric(maximaValues.fieldRelativeLInf, input.tolerances.fieldRelativeLInf),
    fieldWeightedRelativeL2: metric(maximaValues.fieldWeightedRelativeL2, input.tolerances.fieldWeightedRelativeL2),
    shellNormalized: metric(maximaValues.shellNormalized, input.tolerances.shellNormalized),
    uniformNormalizedLInf: metric(maximaValues.uniformNormalizedLInf, input.tolerances.uniformNormalizedLInf),
    robinResidualNormalized: metric(maximaValues.robinResidualNormalized, input.tolerances.robinResidualNormalized),
    generatorCheckerAgreement: metric(maximaValues.generatorCheckerAgreement, input.tolerances.generatorCheckerAgreement),
  });
  const allFinite = Object.values(maximaValues).every(Number.isFinite);
  const exactRoster = requestedRosterMatches && caseChecks.every((caseCheck) => caseCheck.exactRoster);
  if (!exactRoster && requestedRosterMatches) errors.push("candidate exact node or actual-spacing roster differs");
  const pass =
    operandsMatch && exactRoster && allFinite && errors.length === 0 &&
    caseChecks.every((caseCheck) => caseCheck.pass) && Object.values(maxima).every((entry) => entry.pass);
  return Object.freeze({
    schema: "phase10-c0v-radial-reference-check-v1",
    protocolId: input.protocolId,
    method: "independent-closed-form-lambda",
    independentDerivedPhysics,
    exactOperandEcho: operandsMatch,
    exactRoster,
    cases: Object.freeze(caseChecks),
    maxima,
    allFinite,
    errors: Object.freeze(errors),
    pass,
  });
}
