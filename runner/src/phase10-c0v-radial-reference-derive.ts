// Phase 10 C0V radial reference derivation.
//
// This module is intentionally self-contained. It solves the finite-shell spherical
// boundary-value problem by treating sigma(r) = A + B/r as a two-unknown linear system.
// It must not import the production spherical implementation, core physical helpers, the
// independent checker, or any later production-comparison code.

import type {
  Phase10C0VNumericIdentity,
  Phase10C0VPhysicalConstants as SharedPhysicalConstants,
  Phase10C0VRadialReferenceInput as SharedRadialReferenceInput,
} from "./phase10-c0v-contracts.ts";

export type Phase10C0VBinary64Identity = Phase10C0VNumericIdentity;
export type Phase10C0VRadialPhysicalConstants = SharedPhysicalConstants;
export type Phase10C0VRadialToleranceSet = SharedRadialReferenceInput["tolerances"];
export type Phase10C0VRadialRosterItem = SharedRadialReferenceInput["roster"][number];
export type Phase10C0VRadialReferenceInput = SharedRadialReferenceInput;

export interface Phase10C0VRadialIdentifiedPhysicalConstants {
  readonly kBoltzmannJPerK: Phase10C0VBinary64Identity;
  readonly celsiusZeroK: Phase10C0VBinary64Identity;
  readonly waterMoleculeMassKg: Phase10C0VBinary64Identity;
  readonly iceNumberDensityPerM3: Phase10C0VBinary64Identity;
  readonly diffusivityAir1AtmM2S: Phase10C0VBinary64Identity;
  readonly standardAtmospherePa: Phase10C0VBinary64Identity;
  readonly saturationPressurePrefactorMbar: Phase10C0VBinary64Identity;
  readonly saturationPressureExponentK: Phase10C0VBinary64Identity;
  readonly mbarToPa: Phase10C0VBinary64Identity;
}

export interface Phase10C0VRadialIdentifiedOperands {
  readonly radiusM: Phase10C0VBinary64Identity;
  readonly farRadiusM: Phase10C0VBinary64Identity;
  readonly sigmaInfinity: Phase10C0VBinary64Identity;
  readonly tempC: Phase10C0VBinary64Identity;
  readonly pressurePa: Phase10C0VBinary64Identity;
  readonly alphaHKConst: Phase10C0VBinary64Identity;
  readonly physicalConstants: Phase10C0VRadialIdentifiedPhysicalConstants;
}

export interface Phase10C0VRadialDerivedPhysics {
  readonly temperatureK: Phase10C0VBinary64Identity;
  readonly saturationPressurePa: Phase10C0VBinary64Identity;
  readonly saturationNumberDensityPerM3: Phase10C0VBinary64Identity;
  readonly diffusivityM2S: Phase10C0VBinary64Identity;
  readonly thermalSpeedMS: Phase10C0VBinary64Identity;
  readonly kineticVelocityMS: Phase10C0VBinary64Identity;
  readonly kineticLengthM: Phase10C0VBinary64Identity;
}

export interface Phase10C0VRadialSample {
  readonly nodeIndex: number;
  readonly radiusM: Phase10C0VBinary64Identity;
  readonly sigma: Phase10C0VBinary64Identity;
}

export interface Phase10C0VRadialReferenceCase {
  readonly caseId: string;
  readonly requestedSpacingM: Phase10C0VBinary64Identity;
  readonly actualSpacingM: Phase10C0VBinary64Identity;
  readonly nodeCount: number;
  readonly harmonicConstant: Phase10C0VBinary64Identity;
  readonly harmonicInverseRadiusCoefficientM: Phase10C0VBinary64Identity;
  readonly sigmaSurface: Phase10C0VBinary64Identity;
  readonly sigmaShell: Phase10C0VBinary64Identity;
  readonly surfaceGradientPerM: Phase10C0VBinary64Identity;
  readonly growthVelocityFluxMS: Phase10C0VBinary64Identity;
  readonly growthVelocityKineticMS: Phase10C0VBinary64Identity;
  readonly robinResidual: Phase10C0VBinary64Identity;
  readonly samples: readonly Phase10C0VRadialSample[];
}

export interface Phase10C0VRadialUniformFieldCase {
  readonly caseId: string;
  readonly requestedSpacingM: Phase10C0VBinary64Identity;
  readonly actualSpacingM: Phase10C0VBinary64Identity;
  readonly nodeCount: number;
  readonly sigmaSurface: Phase10C0VBinary64Identity;
  readonly sigmaShell: Phase10C0VBinary64Identity;
  readonly surfaceGradientPerM: Phase10C0VBinary64Identity;
  readonly growthVelocityFluxMS: Phase10C0VBinary64Identity;
  readonly growthVelocityKineticMS: Phase10C0VBinary64Identity;
  readonly robinResidual: Phase10C0VBinary64Identity;
  readonly samples: readonly Phase10C0VRadialSample[];
}

export interface Phase10C0VRadialReferenceCandidate {
  readonly schema: "phase10-c0v-radial-reference-candidate-v1";
  readonly protocolId: string;
  readonly method: "independent-2x2-harmonic-coefficients";
  readonly operands: Phase10C0VRadialIdentifiedOperands;
  readonly requestedRoster: readonly {
    readonly caseId: string;
    readonly requestedSpacingM: Phase10C0VBinary64Identity;
  }[];
  readonly derivedPhysics: Phase10C0VRadialDerivedPhysics;
  readonly cases: readonly Phase10C0VRadialReferenceCase[];
  readonly uniformFieldControl: {
    readonly alphaHKConst: Phase10C0VBinary64Identity;
    readonly cases: readonly Phase10C0VRadialUniformFieldCase[];
  };
  readonly scope: {
    readonly control: "finite-shell-constant-coefficient-spherical-robin";
    readonly orderDisposition: "not-applicable-exact-u-roundoff-control";
    readonly physicalValidationClaim: false;
    readonly habitClaim: false;
    readonly solverExecuted: false;
  };
}

interface SolvedHarmonic {
  readonly harmonicConstant: number;
  readonly harmonicInverseRadiusCoefficientM: number;
  readonly sigmaSurface: number;
  readonly sigmaShell: number;
  readonly surfaceGradientPerM: number;
  readonly growthVelocityFluxMS: number;
  readonly growthVelocityKineticMS: number;
  readonly robinResidual: number;
}

function fail(detail: string): never {
  throw new Error(`Phase 10 C0V radial reference derivation refused: ${detail}`);
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

function nonNegative(value: number, label: string): number {
  finite(value, label);
  if (value < 0) fail(`${label} must be non-negative`);
  return value;
}

function binary64Hex(value: number): string {
  finite(value, "identified value");
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setFloat64(0, value, false);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function decimal(value: number): string {
  finite(value, "identified value");
  return Object.is(value, -0) ? "-0" : value.toString();
}

function identify(value: number): Phase10C0VBinary64Identity {
  const normalized = Object.is(value, -0) ? 0 : value;
  return Object.freeze({ decimal: decimal(normalized), binary64Hex: binary64Hex(normalized) });
}

function validateInput(input: Phase10C0VRadialReferenceInput): void {
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
  nonNegative(operands.alphaHKConst, "alphaHKConst");
  const constants = operands.physicalConstants;
  positive(constants.kBoltzmannJPerK, "physicalConstants.kBoltzmannJPerK");
  positive(constants.celsiusZeroK, "physicalConstants.celsiusZeroK");
  positive(constants.waterMoleculeMassKg, "physicalConstants.waterMoleculeMassKg");
  positive(constants.iceNumberDensityPerM3, "physicalConstants.iceNumberDensityPerM3");
  positive(constants.diffusivityAir1AtmM2S, "physicalConstants.diffusivityAir1AtmM2S");
  positive(constants.standardAtmospherePa, "physicalConstants.standardAtmospherePa");
  positive(constants.saturationPressurePrefactorMbar, "physicalConstants.saturationPressurePrefactorMbar");
  finite(constants.saturationPressureExponentK, "physicalConstants.saturationPressureExponentK");
  if (!(constants.saturationPressureExponentK < 0)) {
    fail("physicalConstants.saturationPressureExponentK must be the signed negative exponent");
  }
  positive(constants.mbarToPa, "physicalConstants.mbarToPa");
  positive(operands.tempC + constants.celsiusZeroK, "temperatureK");
  if (!Array.isArray(input.roster) || input.roster.length === 0) fail("roster must be non-empty");
  const caseIds = new Set<string>();
  const spacings = new Set<number>();
  for (const [index, item] of input.roster.entries()) {
    if (typeof item.caseId !== "string" || item.caseId.length === 0 || item.caseId !== item.caseId.trim()) {
      fail(`roster[${index}].caseId must be a non-empty trimmed string`);
    }
    if (caseIds.has(item.caseId)) fail(`duplicate caseId ${item.caseId}`);
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
    const computedNodeCount = Math.max(
      3,
      Math.round((operands.farRadiusM - operands.radiusM) / item.requestedSpacingM) + 1,
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
    caseIds.add(item.caseId);
    spacings.add(item.requestedSpacingM);
  }
  for (const [name, value] of Object.entries(input.tolerances)) {
    nonNegative(value, `tolerances.${name}`);
  }
}

function identifiedConstants(
  constants: Phase10C0VRadialPhysicalConstants,
): Phase10C0VRadialIdentifiedPhysicalConstants {
  return Object.freeze({
    kBoltzmannJPerK: identify(constants.kBoltzmannJPerK),
    celsiusZeroK: identify(constants.celsiusZeroK),
    waterMoleculeMassKg: identify(constants.waterMoleculeMassKg),
    iceNumberDensityPerM3: identify(constants.iceNumberDensityPerM3),
    diffusivityAir1AtmM2S: identify(constants.diffusivityAir1AtmM2S),
    standardAtmospherePa: identify(constants.standardAtmospherePa),
    saturationPressurePrefactorMbar: identify(constants.saturationPressurePrefactorMbar),
    saturationPressureExponentK: identify(constants.saturationPressureExponentK),
    mbarToPa: identify(constants.mbarToPa),
  });
}

function sampleRadius(radiusM: number, farRadiusM: number, actualSpacingM: number, nodeIndex: number, nodeCount: number): number {
  if (nodeIndex === 0) return radiusM;
  if (nodeIndex === nodeCount - 1) return farRadiusM;
  return radiusM + nodeIndex * actualSpacingM;
}

function solveHarmonic(
  input: Phase10C0VRadialReferenceInput,
  alphaHKConst: number,
  kineticLengthM: number,
  saturationNumberDensityPerM3: number,
  diffusivityM2S: number,
  kineticVelocityMS: number,
): SolvedHarmonic {
  const { radiusM, farRadiusM, sigmaInfinity } = input.operands;
  // Matrix rows are the Dirichlet shell and the Robin surface condition:
  //   A + B/R_far = sigmaInfinity
  //   alphaHKConst*A + (alphaHKConst/R + X_0/R^2)*B = 0.
  // Cramer's rule is used directly so this derivation is algebraically distinct from the
  // closed-form Lambda calculation in the independent checker.
  const surfaceRowB = alphaHKConst / radiusM + kineticLengthM / (radiusM * radiusM);
  const determinant = surfaceRowB - alphaHKConst / farRadiusM;
  if (!Number.isFinite(determinant) || determinant === 0) fail("harmonic coefficient system is singular");
  const harmonicConstant = sigmaInfinity * surfaceRowB / determinant;
  const harmonicInverseRadiusCoefficientM = alphaHKConst === 0
    ? 0
    : -(alphaHKConst * sigmaInfinity) / determinant;
  const sigmaSurface = harmonicConstant + harmonicInverseRadiusCoefficientM / radiusM;
  const sigmaShell = harmonicConstant + harmonicInverseRadiusCoefficientM / farRadiusM;
  const surfaceGradientPerM = harmonicInverseRadiusCoefficientM === 0
    ? 0
    : -harmonicInverseRadiusCoefficientM / (radiusM * radiusM);
  const growthVelocityFluxMS =
    (saturationNumberDensityPerM3 / input.operands.physicalConstants.iceNumberDensityPerM3) *
    diffusivityM2S * surfaceGradientPerM;
  const growthVelocityKineticMS = alphaHKConst * kineticVelocityMS * sigmaSurface;
  const robinResidual = kineticLengthM * surfaceGradientPerM - alphaHKConst * sigmaSurface;
  for (const [name, value] of Object.entries({
    harmonicConstant,
    harmonicInverseRadiusCoefficientM,
    sigmaSurface,
    sigmaShell,
    surfaceGradientPerM,
    growthVelocityFluxMS,
    growthVelocityKineticMS,
    robinResidual,
  })) finite(value, `solved ${name}`);
  return Object.freeze({
    harmonicConstant,
    harmonicInverseRadiusCoefficientM,
    sigmaSurface,
    sigmaShell,
    surfaceGradientPerM,
    growthVelocityFluxMS,
    growthVelocityKineticMS,
    robinResidual,
  });
}

function samplesFor(
  radiusM: number,
  farRadiusM: number,
  actualSpacingM: number,
  nodeCount: number,
  solved: SolvedHarmonic,
): readonly Phase10C0VRadialSample[] {
  const samples: Phase10C0VRadialSample[] = [];
  for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex++) {
    const sampleRadiusM = sampleRadius(radiusM, farRadiusM, actualSpacingM, nodeIndex, nodeCount);
    const sigma = solved.harmonicConstant + solved.harmonicInverseRadiusCoefficientM / sampleRadiusM;
    samples.push(Object.freeze({ nodeIndex, radiusM: identify(sampleRadiusM), sigma: identify(sigma) }));
  }
  return Object.freeze(samples);
}

/**
 * Derive a raw finite-shell radial reference without importing any production scientific code.
 * The returned value is a candidate only; S5b must pair it with the separate checker result and
 * provenance/import receipts before it can become the frozen reference wrapper.
 */
export function derivePhase10C0VRadialReference(
  input: Phase10C0VRadialReferenceInput,
): Phase10C0VRadialReferenceCandidate {
  validateInput(input);
  const { operands } = input;
  const constants = operands.physicalConstants;
  const temperatureK = operands.tempC + constants.celsiusZeroK;
  const saturationPressurePa =
    constants.saturationPressurePrefactorMbar *
    Math.exp(constants.saturationPressureExponentK / temperatureK) *
    constants.mbarToPa;
  const saturationNumberDensityPerM3 = saturationPressurePa / (constants.kBoltzmannJPerK * temperatureK);
  const diffusivityM2S = constants.diffusivityAir1AtmM2S * (constants.standardAtmospherePa / operands.pressurePa);
  const thermalSpeedMS = Math.sqrt(
    (constants.kBoltzmannJPerK * temperatureK) /
    (2 * Math.PI * constants.waterMoleculeMassKg),
  );
  const kineticVelocityMS =
    (saturationNumberDensityPerM3 / constants.iceNumberDensityPerM3) * thermalSpeedMS;
  const kineticLengthM =
    (saturationNumberDensityPerM3 / constants.iceNumberDensityPerM3) *
    (diffusivityM2S / kineticVelocityMS);
  for (const [name, value] of Object.entries({
    temperatureK,
    saturationPressurePa,
    saturationNumberDensityPerM3,
    diffusivityM2S,
    thermalSpeedMS,
    kineticVelocityMS,
    kineticLengthM,
  })) positive(value, `derived ${name}`);

  const identifiedOperands: Phase10C0VRadialIdentifiedOperands = Object.freeze({
    radiusM: identify(operands.radiusM),
    farRadiusM: identify(operands.farRadiusM),
    sigmaInfinity: identify(operands.sigmaInfinity),
    tempC: identify(operands.tempC),
    pressurePa: identify(operands.pressurePa),
    alphaHKConst: identify(operands.alphaHKConst),
    physicalConstants: identifiedConstants(constants),
  });
  const derivedPhysics: Phase10C0VRadialDerivedPhysics = Object.freeze({
    temperatureK: identify(temperatureK),
    saturationPressurePa: identify(saturationPressurePa),
    saturationNumberDensityPerM3: identify(saturationNumberDensityPerM3),
    diffusivityM2S: identify(diffusivityM2S),
    thermalSpeedMS: identify(thermalSpeedMS),
    kineticVelocityMS: identify(kineticVelocityMS),
    kineticLengthM: identify(kineticLengthM),
  });
  const solved = solveHarmonic(
    input,
    operands.alphaHKConst,
    kineticLengthM,
    saturationNumberDensityPerM3,
    diffusivityM2S,
    kineticVelocityMS,
  );
  const uniformSolved = solveHarmonic(
    input,
    0,
    kineticLengthM,
    saturationNumberDensityPerM3,
    diffusivityM2S,
    kineticVelocityMS,
  );
  const cases: Phase10C0VRadialReferenceCase[] = [];
  const uniformCases: Phase10C0VRadialUniformFieldCase[] = [];
  for (const rosterItem of input.roster) {
    const spanM = operands.farRadiusM - operands.radiusM;
    const nodeCount = Math.max(3, Math.round(spanM / rosterItem.requestedSpacingM) + 1);
    if (nodeCount !== rosterItem.expectedNodeCount) fail(`${rosterItem.caseId} nodeCount differs after validation`);
    const actualSpacingM = spanM / rosterItem.expectedIntervalCount;
    if (!Object.is(actualSpacingM, rosterItem.expectedActualSpacingM)) {
      fail(`${rosterItem.caseId} actualSpacingM differs after validation`);
    }
    const shared = {
      caseId: rosterItem.caseId,
      requestedSpacingM: identify(rosterItem.requestedSpacingM),
      actualSpacingM: identify(actualSpacingM),
      nodeCount,
    } as const;
    cases.push(Object.freeze({
      ...shared,
      harmonicConstant: identify(solved.harmonicConstant),
      harmonicInverseRadiusCoefficientM: identify(solved.harmonicInverseRadiusCoefficientM),
      sigmaSurface: identify(solved.sigmaSurface),
      sigmaShell: identify(solved.sigmaShell),
      surfaceGradientPerM: identify(solved.surfaceGradientPerM),
      growthVelocityFluxMS: identify(solved.growthVelocityFluxMS),
      growthVelocityKineticMS: identify(solved.growthVelocityKineticMS),
      robinResidual: identify(solved.robinResidual),
      samples: samplesFor(operands.radiusM, operands.farRadiusM, actualSpacingM, nodeCount, solved),
    }));
    uniformCases.push(Object.freeze({
      ...shared,
      sigmaSurface: identify(uniformSolved.sigmaSurface),
      sigmaShell: identify(uniformSolved.sigmaShell),
      surfaceGradientPerM: identify(uniformSolved.surfaceGradientPerM),
      growthVelocityFluxMS: identify(uniformSolved.growthVelocityFluxMS),
      growthVelocityKineticMS: identify(uniformSolved.growthVelocityKineticMS),
      robinResidual: identify(uniformSolved.robinResidual),
      samples: samplesFor(operands.radiusM, operands.farRadiusM, actualSpacingM, nodeCount, uniformSolved),
    }));
  }

  return Object.freeze({
    schema: "phase10-c0v-radial-reference-candidate-v1",
    protocolId: input.protocolId,
    method: "independent-2x2-harmonic-coefficients",
    operands: identifiedOperands,
    requestedRoster: Object.freeze(input.roster.map((item) => Object.freeze({
      caseId: item.caseId,
      requestedSpacingM: identify(item.requestedSpacingM),
    }))),
    derivedPhysics,
    cases: Object.freeze(cases),
    uniformFieldControl: Object.freeze({
      alphaHKConst: identify(0),
      cases: Object.freeze(uniformCases),
    }),
    scope: Object.freeze({
      control: "finite-shell-constant-coefficient-spherical-robin",
      orderDisposition: "not-applicable-exact-u-roundoff-control",
      physicalValidationClaim: false,
      habitClaim: false,
      solverExecuted: false,
    }),
  });
}
