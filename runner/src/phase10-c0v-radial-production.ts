import { createHash } from "node:crypto";
import {
  C_ICE,
  CELSIUS_ZERO_K,
  D_AIR_1ATM,
  K_BOLTZMANN,
  M_MOL,
  P_ATM,
  cSat,
  diffusivity,
  kineticLength,
  pSatIce,
  vKin,
} from "@vcc/core";
import {
  sphericalNumeric,
  type SphericalNumeric,
} from "../../solver-cpu/src/spherical-reference.ts";
import type { Phase10C0VRadialReferenceInput } from "./phase10-c0v-contracts.ts";
import type { Phase10C0VS6RadialBinaryLayoutAuthority } from "./phase10-c0v-s6-contracts.ts";
import type { Phase10C0VS6ArtifactIdentity } from "./phase10-c0v-s6-execution-contracts.ts";

export const PHASE10_C0V_RADIAL_WITNESS_MAGIC = "C0VRAD01" as const;
export const PHASE10_C0V_RADIAL_WITNESS_SCHEMA =
  "phase10-c0v-radial-witness-v1" as const;
export const PHASE10_C0V_RADIAL_WITNESS_VERSION = 1 as const;
export const PHASE10_C0V_RADIAL_ENDIAN_MARKER = 0x01020304 as const;
export const PHASE10_C0V_RADIAL_HEADER_BYTES = 153 as const;
export const PHASE10_C0V_RADIAL_PAYLOAD_BYTES = 5_738 as const;
export const PHASE10_C0V_RADIAL_WITNESS_BYTES = 5_891 as const;

export const PHASE10_C0V_RADIAL_GLOBAL_FLOAT_ORDER = [
  "radiusM",
  "farRadiusM",
  "sigmaInfinity",
  "tempC",
  "pressurePa",
  "alphaHKConst",
  "kBoltzmannJPerK",
  "celsiusZeroK",
  "waterMoleculeMassKg",
  "iceNumberDensityPerM3",
  "diffusivityAir1AtmM2S",
  "standardAtmospherePa",
  "saturationPressurePrefactorMbar",
  "saturationPressureExponentK",
  "mbarToPa",
  "temperatureK",
  "saturationPressurePa",
  "saturationNumberDensityPerM3",
  "diffusivityM2S",
  "thermalSpeedMS",
  "kineticVelocityMS",
  "kineticLengthM",
] as const;

export const PHASE10_C0V_RADIAL_CASE_SCALAR_ORDER = [
  "requestedSpacingM",
  "actualSpacingM",
  "sigmaSurface",
  "sigmaShell",
  "growthVelocityKineticMS",
  "growthVelocityFluxMS",
  "surfaceGradientPerM",
  "robinLeft",
  "robinRight",
  "robinResidual",
  "uniformSigmaSurface",
  "uniformSigmaShell",
  "uniformGrowthVelocityKineticMS",
  "uniformGrowthVelocityFluxMS",
  "uniformSurfaceGradientPerM",
  "uniformRobinLeft",
  "uniformRobinRight",
  "uniformRobinResidual",
] as const;

const FROZEN_CASE_IDS = [
  "radial-dr-0p7um",
  "radial-dr-0p35um",
  "radial-dr-0p175um",
  "radial-dr-0p0875um",
] as const;
const FROZEN_NODE_COUNTS = [21, 40, 80, 159] as const;
const FROZEN_CASE_RECORD_BYTES = [523, 828, 1_469, 2_734] as const;
const SHA256 = /^[0-9a-f]{64}$/u;
const textEncoder = new TextEncoder();

export type Phase10C0VRadialWitnessLayout = Phase10C0VS6RadialBinaryLayoutAuthority;

export interface Phase10C0VRadialProducerSummary {
  readonly schema: "phase10-c0v-radial-producer-summary-v1";
  readonly authority: "non-authoritative";
  readonly caseCount: 4;
  readonly totalNumericFieldValues: 300;
  readonly totalUniformFieldValues: 300;
  readonly allFinite: boolean;
  readonly reportedDisposition: "pass" | "fail";
  readonly reportedMaximum: number;
}

export interface Phase10C0VRadialProductionInput {
  readonly layout: Phase10C0VRadialWitnessLayout;
  readonly science: Phase10C0VRadialReferenceInput;
  readonly packetProtocol: Phase10C0VS6ArtifactIdentity;
  readonly scienceProtocol: Phase10C0VS6ArtifactIdentity;
  readonly referenceOrRefusal: Phase10C0VS6ArtifactIdentity;
  readonly observeCaseBoundary?: (event: Phase10C0VRadialProductionCaseBoundary) => void;
}

export interface Phase10C0VRadialProductionCaseBoundary {
  readonly stage: "start" | "complete";
  readonly caseIndex: number;
  readonly caseId: string;
  readonly expectedNodeCount: number;
}

export interface Phase10C0VRadialProductionOutput {
  readonly witnessBytes: Uint8Array;
  readonly producerSummary: Phase10C0VRadialProducerSummary;
  readonly producerSummaryBytes: Uint8Array;
}

interface DerivedPhysics {
  readonly temperatureK: number;
  readonly saturationPressurePa: number;
  readonly saturationNumberDensityPerM3: number;
  readonly diffusivityM2S: number;
  readonly thermalSpeedMS: number;
  readonly kineticVelocityMS: number;
  readonly kineticLengthM: number;
}

interface CaseRecord {
  readonly caseId: string;
  readonly nodeCount: number;
  readonly scalars: readonly number[];
  readonly numericField: Float64Array;
  readonly uniformField: Float64Array;
}

function fail(detail: string): never {
  throw new Error(`Phase 10 C0V radial production refused: ${detail}`);
}

function sameArray(
  actual: readonly (string | number)[],
  expected: readonly (string | number)[],
): boolean {
  return actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
}

function assertLayout(layout: Phase10C0VRadialWitnessLayout): void {
  const headerOffsets = Object.freeze({
    magic: [0, 8],
    formatVersion: [8, 12],
    endiannessMarker: [12, 16],
    schemaByteLength: [16, 20],
    schema: [20, 49],
    protocolSha256: [49, 81],
    referenceSha256: [81, 113],
    payloadByteLength: [113, 121],
    payloadSha256: [121, 153],
    payload: [153, 5_891],
  } as const);
  const offsetKeys = Object.keys(headerOffsets);
  if (
    layout.magic !== PHASE10_C0V_RADIAL_WITNESS_MAGIC ||
    layout.formatVersion !== PHASE10_C0V_RADIAL_WITNESS_VERSION ||
    layout.endiannessMarker !== PHASE10_C0V_RADIAL_ENDIAN_MARKER ||
    layout.schemaId !== PHASE10_C0V_RADIAL_WITNESS_SCHEMA ||
    layout.schemaByteLength !== 29 ||
    layout.headerByteLength !== PHASE10_C0V_RADIAL_HEADER_BYTES ||
    layout.payloadByteLength !== PHASE10_C0V_RADIAL_PAYLOAD_BYTES ||
    layout.fileByteLength !== PHASE10_C0V_RADIAL_WITNESS_BYTES ||
    layout.protocolDigestSource !== "s5-science-protocol" ||
    layout.referenceDigestSource !== "s5-reference" ||
    layout.payloadPrefixByteLength !== 184 ||
    layout.recordByteLengthPrefixPresent !== false ||
    layout.numericEncoding !== "float64-le-finite-no-negative-zero" ||
    layout.exactZeroEncoding !== "positive-zero" ||
    layout.trailingBytesAllowed !== false ||
    !sameArray(Object.keys(layout.headerOffsets), offsetKeys) ||
    offsetKeys.some((key) => !sameArray(
      layout.headerOffsets[key] ?? [],
      headerOffsets[key as keyof typeof headerOffsets],
    )) ||
    !sameArray(layout.globalFloatNames, PHASE10_C0V_RADIAL_GLOBAL_FLOAT_ORDER) ||
    !sameArray(layout.caseScalarNames, PHASE10_C0V_RADIAL_CASE_SCALAR_ORDER) ||
    !sameArray(layout.caseOrder, FROZEN_CASE_IDS) ||
    !sameArray(layout.caseNodeCounts, FROZEN_NODE_COUNTS) ||
    !sameArray(layout.caseRecordByteLengths, FROZEN_CASE_RECORD_BYTES)
  ) {
    fail("witness layout differs from the frozen 5,891-byte contract");
  }
}

function assertIdentity(identity: Phase10C0VS6ArtifactIdentity, label: string): void {
  if (
    typeof identity.path !== "string" ||
    identity.path.length === 0 ||
    !Number.isSafeInteger(identity.byteLength) ||
    identity.byteLength <= 0 ||
    !SHA256.test(identity.sha256)
  ) {
    fail(`${label} identity is malformed`);
  }
}

function assertExactNumber(actual: number, expected: number, label: string): void {
  if (!Object.is(actual, expected)) {
    fail(`${label} differs from the production implementation operand`);
  }
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value) || Object.is(value, -0)) {
    fail(`${label} must be finite and may not be negative zero`);
  }
  return value === 0 ? 0 : value;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function digestBytes(hex: string): Uint8Array {
  if (!SHA256.test(hex)) fail("digest is not lowercase SHA-256");
  return Uint8Array.from(Buffer.from(hex, "hex"));
}

function derivedPhysics(science: Phase10C0VRadialReferenceInput): DerivedPhysics {
  const constants = science.operands.physicalConstants;
  assertExactNumber(constants.kBoltzmannJPerK, K_BOLTZMANN, "Boltzmann constant");
  assertExactNumber(constants.celsiusZeroK, CELSIUS_ZERO_K, "Celsius offset");
  assertExactNumber(constants.waterMoleculeMassKg, M_MOL, "water molecule mass");
  assertExactNumber(constants.iceNumberDensityPerM3, C_ICE, "ice number density");
  assertExactNumber(constants.diffusivityAir1AtmM2S, D_AIR_1ATM, "air diffusivity");
  assertExactNumber(constants.standardAtmospherePa, P_ATM, "standard atmosphere");
  assertExactNumber(constants.saturationPressurePrefactorMbar, 3.7e10, "saturation-pressure prefactor");
  assertExactNumber(constants.saturationPressureExponentK, -6150, "saturation-pressure exponent");
  assertExactNumber(constants.mbarToPa, 100, "mbar conversion");

  const temperatureK = science.operands.tempC + CELSIUS_ZERO_K;
  const saturationPressurePa = pSatIce(science.operands.tempC);
  const saturationNumberDensityPerM3 = cSat(science.operands.tempC);
  const diffusivityM2S = diffusivity(science.operands.pressurePa);
  const thermalSpeedMS = Math.sqrt(
    (K_BOLTZMANN * temperatureK) / (2 * Math.PI * M_MOL),
  );
  const kineticVelocityMS = vKin(science.operands.tempC);
  const kineticLengthM = kineticLength(
    science.operands.tempC,
    science.operands.pressurePa,
  );
  return Object.freeze({
    temperatureK: finite(temperatureK, "temperatureK"),
    saturationPressurePa: finite(saturationPressurePa, "saturationPressurePa"),
    saturationNumberDensityPerM3: finite(
      saturationNumberDensityPerM3,
      "saturationNumberDensityPerM3",
    ),
    diffusivityM2S: finite(diffusivityM2S, "diffusivityM2S"),
    thermalSpeedMS: finite(thermalSpeedMS, "thermalSpeedMS"),
    kineticVelocityMS: finite(kineticVelocityMS, "kineticVelocityMS"),
    kineticLengthM: finite(kineticLengthM, "kineticLengthM"),
  });
}

function surfaceGradient(
  solved: SphericalNumeric,
  radiusM: number,
): number {
  if (solved.nodes < 3) fail("a case has fewer than three nodes");
  const sigma0 = solved.sigma[0]!;
  const sigma1 = solved.sigma[1]!;
  const sigma2 = solved.sigma[2]!;
  const u0 = radiusM * sigma0;
  const u1 = (radiusM + solved.drM) * sigma1;
  const u2 = (radiusM + 2 * solved.drM) * sigma2;
  const uPrime = (-3 * u0 + 4 * u1 - u2) / (2 * solved.drM);
  return finite(uPrime / radiusM - u0 / (radiusM * radiusM), "surface gradient");
}

function solveCases(
  science: Phase10C0VRadialReferenceInput,
  physics: DerivedPhysics,
  observeCaseBoundary?: (event: Phase10C0VRadialProductionCaseBoundary) => void,
): readonly CaseRecord[] {
  if (science.roster.length !== 4) fail("science roster must contain exactly four cases");
  const problem = Object.freeze({
    radiusM: science.operands.radiusM,
    farRadiusM: science.operands.farRadiusM,
    sigmaInfinity: science.operands.sigmaInfinity,
    tempC: science.operands.tempC,
    pressurePa: science.operands.pressurePa,
  });
  const records: CaseRecord[] = [];
  for (const [index, roster] of science.roster.entries()) {
    if (
      roster.caseId !== FROZEN_CASE_IDS[index] ||
      roster.expectedNodeCount !== FROZEN_NODE_COUNTS[index] ||
      roster.expectedIntervalCount !== roster.expectedNodeCount - 1
    ) {
      fail(`case ${index} differs from the frozen ID/node roster`);
    }
    observeCaseBoundary?.(Object.freeze({
      stage: "start",
      caseIndex: index,
      caseId: roster.caseId,
      expectedNodeCount: roster.expectedNodeCount,
    }));
    const numeric = sphericalNumeric(problem, {
      drM: roster.requestedSpacingM,
      attachmentCoefficient: science.operands.alphaHKConst,
    });
    const uniform = sphericalNumeric(problem, {
      drM: roster.requestedSpacingM,
      attachmentCoefficient: 0,
    });
    if (
      numeric.nodes !== roster.expectedNodeCount ||
      uniform.nodes !== roster.expectedNodeCount ||
      !Object.is(numeric.drM, roster.expectedActualSpacingM) ||
      !Object.is(uniform.drM, roster.expectedActualSpacingM)
    ) {
      fail(`${roster.caseId} solver node roster or actual spacing differs`);
    }

    const gradient = surfaceGradient(numeric, science.operands.radiusM);
    const growthVelocityFluxMS =
      (physics.saturationNumberDensityPerM3 / science.operands.physicalConstants.iceNumberDensityPerM3) *
      physics.diffusivityM2S *
      gradient;
    const robinLeft = physics.kineticLengthM * gradient;
    const robinRight = science.operands.alphaHKConst * numeric.sigmaSurface;
    const robinResidual = robinLeft - robinRight;
    const uniformGradient = surfaceGradient(uniform, science.operands.radiusM);
    const uniformGrowthVelocityFluxMS =
      (physics.saturationNumberDensityPerM3 / science.operands.physicalConstants.iceNumberDensityPerM3) *
      physics.diffusivityM2S *
      uniformGradient;
    const uniformRobinLeft = physics.kineticLengthM * uniformGradient;
    const uniformRobinRight = 0 * uniform.sigmaSurface;
    const uniformRobinResidual = uniformRobinLeft - uniformRobinRight;
    const scalarValues = [
      roster.requestedSpacingM,
      numeric.drM,
      numeric.sigmaSurface,
      numeric.sigma[numeric.nodes - 1]!,
      numeric.growthVelocityMS,
      growthVelocityFluxMS,
      gradient,
      robinLeft,
      robinRight,
      robinResidual,
      uniform.sigmaSurface,
      uniform.sigma[uniform.nodes - 1]!,
      uniform.growthVelocityMS,
      uniformGrowthVelocityFluxMS,
      uniformGradient,
      uniformRobinLeft,
      uniformRobinRight,
      uniformRobinResidual,
    ].map((value, scalarIndex) =>
      finite(value, `${roster.caseId}.${PHASE10_C0V_RADIAL_CASE_SCALAR_ORDER[scalarIndex]}`));
    for (const [fieldIndex, value] of numeric.sigma.entries()) {
      finite(value, `${roster.caseId}.numericField[${fieldIndex}]`);
    }
    for (const [fieldIndex, value] of uniform.sigma.entries()) {
      finite(value, `${roster.caseId}.uniformField[${fieldIndex}]`);
    }
    records.push(Object.freeze({
      caseId: roster.caseId,
      nodeCount: numeric.nodes,
      scalars: Object.freeze(scalarValues),
      numericField: new Float64Array(numeric.sigma),
      uniformField: new Float64Array(uniform.sigma),
    }));
    observeCaseBoundary?.(Object.freeze({
      stage: "complete",
      caseIndex: index,
      caseId: roster.caseId,
      expectedNodeCount: roster.expectedNodeCount,
    }));
  }
  return Object.freeze(records);
}

class BinaryWriter {
  readonly bytes: Uint8Array;
  readonly view: DataView;
  offset = 0;

  constructor(length: number) {
    this.bytes = new Uint8Array(length);
    this.view = new DataView(this.bytes.buffer);
  }

  writeBytes(value: Uint8Array): void {
    if (this.offset + value.byteLength > this.bytes.byteLength) fail("binary writer overflow");
    this.bytes.set(value, this.offset);
    this.offset += value.byteLength;
  }

  writeU32(value: number): void {
    if (!Number.isSafeInteger(value) || value < 0 || value > 0xffff_ffff) {
      fail("u32 value is out of range");
    }
    this.view.setUint32(this.offset, value, true);
    this.offset += 4;
  }

  writeU64(value: number): void {
    if (!Number.isSafeInteger(value) || value < 0) fail("u64 value is not a safe integer");
    this.view.setBigUint64(this.offset, BigInt(value), true);
    this.offset += 8;
  }

  writeF64(value: number): void {
    this.view.setFloat64(this.offset, finite(value, "binary float"), true);
    this.offset += 8;
  }
}

function globalValues(
  science: Phase10C0VRadialReferenceInput,
  physics: DerivedPhysics,
): readonly number[] {
  const constants = science.operands.physicalConstants;
  return Object.freeze([
    science.operands.radiusM,
    science.operands.farRadiusM,
    science.operands.sigmaInfinity,
    science.operands.tempC,
    science.operands.pressurePa,
    science.operands.alphaHKConst,
    constants.kBoltzmannJPerK,
    constants.celsiusZeroK,
    constants.waterMoleculeMassKg,
    constants.iceNumberDensityPerM3,
    constants.diffusivityAir1AtmM2S,
    constants.standardAtmospherePa,
    constants.saturationPressurePrefactorMbar,
    constants.saturationPressureExponentK,
    constants.mbarToPa,
    physics.temperatureK,
    physics.saturationPressurePa,
    physics.saturationNumberDensityPerM3,
    physics.diffusivityM2S,
    physics.thermalSpeedMS,
    physics.kineticVelocityMS,
    physics.kineticLengthM,
  ].map((value, index) => finite(value, PHASE10_C0V_RADIAL_GLOBAL_FLOAT_ORDER[index]!)));
}

function encodePayload(
  science: Phase10C0VRadialReferenceInput,
  physics: DerivedPhysics,
  records: readonly CaseRecord[],
): Uint8Array {
  const writer = new BinaryWriter(PHASE10_C0V_RADIAL_PAYLOAD_BYTES);
  writer.writeU32(records.length);
  const globals = globalValues(science, physics);
  writer.writeU32(globals.length);
  for (const value of globals) writer.writeF64(value);
  for (const [index, record] of records.entries()) {
    const encodedId = textEncoder.encode(record.caseId);
    writer.writeU32(encodedId.byteLength);
    writer.writeBytes(encodedId);
    writer.writeU32(record.nodeCount);
    writer.writeU32(record.scalars.length);
    for (const value of record.scalars) writer.writeF64(value);
    writer.writeU64(record.numericField.length);
    for (const value of record.numericField) writer.writeF64(value);
    writer.writeU64(record.uniformField.length);
    for (const value of record.uniformField) writer.writeF64(value);
    const expectedEnd = 184 + FROZEN_CASE_RECORD_BYTES
      .slice(0, index + 1)
      .reduce((sum, value) => sum + value, 0);
    if (writer.offset !== expectedEnd) {
      fail(`${record.caseId} encoded record length differs`);
    }
  }
  if (writer.offset !== writer.bytes.byteLength) fail("payload length differs after encoding");
  return writer.bytes;
}

function encodeWitness(
  payload: Uint8Array,
  scienceProtocolSha256: string,
  referenceSha256: string,
): Uint8Array {
  // Witness-v1's protocol field retains its frozen S5 science-protocol meaning.
  // The execution-v2 packet protocol is bound separately by the lifecycle receipts.
  if (payload.byteLength !== PHASE10_C0V_RADIAL_PAYLOAD_BYTES) fail("payload byte length differs");
  const writer = new BinaryWriter(PHASE10_C0V_RADIAL_WITNESS_BYTES);
  const magic = textEncoder.encode(PHASE10_C0V_RADIAL_WITNESS_MAGIC);
  const schema = textEncoder.encode(PHASE10_C0V_RADIAL_WITNESS_SCHEMA);
  if (magic.byteLength !== 8 || schema.byteLength !== 29) fail("fixed ASCII header lengths differ");
  writer.writeBytes(magic);
  writer.writeU32(PHASE10_C0V_RADIAL_WITNESS_VERSION);
  writer.writeU32(PHASE10_C0V_RADIAL_ENDIAN_MARKER);
  writer.writeU32(schema.byteLength);
  writer.writeBytes(schema);
  writer.writeBytes(digestBytes(scienceProtocolSha256));
  writer.writeBytes(digestBytes(referenceSha256));
  writer.writeU64(payload.byteLength);
  writer.writeBytes(digestBytes(sha256(payload)));
  if (writer.offset !== PHASE10_C0V_RADIAL_HEADER_BYTES) fail("header byte length differs");
  writer.writeBytes(payload);
  if (writer.offset !== writer.bytes.byteLength) fail("witness byte length differs after encoding");
  return writer.bytes;
}

function summary(records: readonly CaseRecord[]): Phase10C0VRadialProducerSummary {
  let reportedMaximum = 0;
  let allFinite = records.length === 4;
  for (const record of records) {
    const residual = record.scalars[9]!;
    reportedMaximum = Math.max(reportedMaximum, Math.abs(residual));
    allFinite &&= record.scalars.every((value) => Number.isFinite(value) && !Object.is(value, -0));
    allFinite &&= [...record.numericField, ...record.uniformField]
      .every((value) => Number.isFinite(value) && !Object.is(value, -0));
  }
  return Object.freeze({
    schema: "phase10-c0v-radial-producer-summary-v1",
    authority: "non-authoritative",
    caseCount: 4,
    totalNumericFieldValues: 300,
    totalUniformFieldValues: 300,
    allFinite,
    reportedDisposition: allFinite ? "pass" : "fail",
    reportedMaximum: finite(reportedMaximum, "producer reported maximum"),
  });
}

export function producePhase10C0VRadialWitness(
  input: Phase10C0VRadialProductionInput,
): Phase10C0VRadialProductionOutput {
  assertLayout(input.layout);
  assertIdentity(input.packetProtocol, "packet protocol");
  assertIdentity(input.scienceProtocol, "science protocol");
  assertIdentity(input.referenceOrRefusal, "reference");
  const physics = derivedPhysics(input.science);
  const records = solveCases(input.science, physics, input.observeCaseBoundary);
  const payload = encodePayload(input.science, physics, records);
  const witnessBytes = encodeWitness(
    payload,
    input.scienceProtocol.sha256,
    input.referenceOrRefusal.sha256,
  );
  const producerSummary = summary(records);
  const producerSummaryBytes = textEncoder.encode(
    `${JSON.stringify(producerSummary, null, 2)}\n`,
  );
  return Object.freeze({ witnessBytes, producerSummary, producerSummaryBytes });
}
