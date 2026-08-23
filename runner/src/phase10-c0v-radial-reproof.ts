import { createHash } from "node:crypto";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  phase10C0VRadialReferenceInput,
  parsePhase10C0VRadialProtocol,
  parsePhase10C0VReferenceEnvelope,
  type Phase10C0VRadialReferenceInput,
} from "./phase10-c0v-contracts.ts";
import {
  derivePhase10C0VS6RadialLifecycleAuthority,
  type Phase10C0VS6RadialProducerSummaryAuthority,
} from "./phase10-c0v-s6-contracts.ts";
import {
  parsePhase10C0VS6ArtifactIdentity,
  phase10C0VS6Boolean,
  phase10C0VS6ExactOrderedKeys,
  phase10C0VS6Object,
  phase10C0VS6ParsePrettyJson,
  phase10C0VS6SameIdentity,
  phase10C0VS6SameJson,
  type Phase10C0VS6ArtifactIdentity,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  parsePhase10C0VS6RadialEvaluationBytes,
  type Phase10C0VS6ParsedRadialEvaluationReceipt,
  type Phase10C0VS6ParsedRadialNegativeControl,
} from "./phase10-c0v-s6-receipts.ts";

const HEADER_BYTES = 153 as const;
const GLOBAL_FLOAT_BYTES = 22 * 8;
const CASE_IDS = Object.freeze([
  "radial-dr-0p7um",
  "radial-dr-0p35um",
  "radial-dr-0p175um",
  "radial-dr-0p0875um",
] as const);
const NODE_COUNTS = Object.freeze([21, 40, 80, 159] as const);
const CASE_RECORD_BYTES = Object.freeze([523, 828, 1_469, 2_734] as const);
const GLOBAL_FLOAT_NAMES = Object.freeze([
  "radiusM", "farRadiusM", "sigmaInfinity", "tempC", "pressurePa", "alphaHKConst",
  "kBoltzmannJPerK", "celsiusZeroK", "waterMoleculeMassKg", "iceNumberDensityPerM3",
  "diffusivityAir1AtmM2S", "standardAtmospherePa", "saturationPressurePrefactorMbar",
  "saturationPressureExponentK", "mbarToPa", "temperatureK", "saturationPressurePa",
  "saturationNumberDensityPerM3", "diffusivityM2S", "thermalSpeedMS", "kineticVelocityMS",
  "kineticLengthM",
] as const);
const CASE_SCALAR_NAMES = Object.freeze([
  "requestedSpacingM", "actualSpacingM", "sigmaSurface", "sigmaShell",
  "growthVelocityKineticMS", "growthVelocityFluxMS", "surfaceGradientPerM", "robinLeft",
  "robinRight", "robinResidual", "uniformSigmaSurface", "uniformSigmaShell",
  "uniformGrowthVelocityKineticMS", "uniformGrowthVelocityFluxMS", "uniformSurfaceGradientPerM",
  "uniformRobinLeft", "uniformRobinRight", "uniformRobinResidual",
] as const);
const METRIC_IDS = Object.freeze([
  "surfaceRelative", "velocityRelative", "fieldRelativeLInf", "fieldWeightedRelativeL2",
  "shellNormalized", "uniformNormalizedLInf", "robinResidualNormalized",
  "generatorCheckerAgreement",
] as const);
const CONTROL_IDS = Object.freeze([
  "nc-radial-finite-shell-term",
  "nc-radial-forged-summary",
  "nc-radial-robin-coefficient",
] as const);
const textDecoder = new TextDecoder("utf-8", { fatal: true });

interface ControlRecord {
  readonly caseId: string;
  readonly nodeCount: number;
  readonly recordStart: number;
  readonly recordEnd: number;
  readonly scalarStart: number;
  readonly numericFieldStart: number;
  readonly uniformFieldStart: number;
}

interface DecodedControlWitness {
  readonly bytes: Uint8Array;
  readonly view: DataView;
  readonly records: readonly ControlRecord[];
}

interface ScienceCase {
  readonly caseId: string;
  readonly nodeCount: number;
  readonly scalars: Readonly<Record<(typeof CASE_SCALAR_NAMES)[number], number>>;
  readonly numericField: readonly number[];
  readonly uniformField: readonly number[];
}

interface ScienceWitness {
  readonly globals: Readonly<Record<(typeof GLOBAL_FLOAT_NAMES)[number], number>>;
  readonly cases: readonly ScienceCase[];
}

interface NumericIdentity {
  readonly decimal: string;
  readonly binary64Hex: string;
}

interface ReferenceSample {
  readonly nodeIndex: number;
  readonly radiusM: NumericIdentity;
  readonly sigma: NumericIdentity;
}

interface ReferenceCase {
  readonly caseId: string;
  readonly requestedSpacingM: NumericIdentity;
  readonly actualSpacingM: NumericIdentity;
  readonly nodeCount: number;
  readonly sigmaSurface: NumericIdentity;
  readonly sigmaShell: NumericIdentity;
  readonly surfaceGradientPerM: NumericIdentity;
  readonly growthVelocityMS: NumericIdentity;
  readonly samples: readonly ReferenceSample[];
}

interface GeneratorCase {
  readonly caseId: string;
  readonly sigmaSurface: NumericIdentity;
  readonly growthVelocityFluxMS: NumericIdentity;
  readonly growthVelocityKineticMS: NumericIdentity;
  readonly samples: readonly ReferenceSample[];
}

interface RawMetric {
  readonly value: NumericIdentity;
  readonly tolerance: NumericIdentity;
  readonly pass: boolean;
}

interface ReferenceCheckCase {
  readonly caseId: string;
  readonly exactRoster: boolean;
  readonly independent: ReferenceCase;
  readonly independentUniformFieldControl: Omit<ReferenceCase, "growthVelocityMS"> & {
    readonly growthVelocityFluxMS: NumericIdentity;
    readonly growthVelocityKineticMS: NumericIdentity;
    readonly robinResidual: NumericIdentity;
  };
  readonly metrics: Readonly<Record<(typeof METRIC_IDS)[number], RawMetric>>;
  readonly exactUniformZeroRates: boolean;
  readonly errors: readonly string[];
  readonly pass: boolean;
}

interface ParsedRadialReference {
  readonly generatorOutput: {
    readonly cases: readonly GeneratorCase[];
    readonly uniformFieldControl: { readonly cases: readonly { readonly caseId: string }[] };
  };
  readonly independentCheck: {
    readonly cases: readonly ReferenceCheckCase[];
    readonly allFinite: boolean;
    readonly errors: readonly string[];
    readonly pass: boolean;
  };
  readonly disposition: "reference-frozen" | "reference-discrepancy-refusal";
  readonly comparison: {
    readonly expectedOutcome: "pass" | "refusal";
    readonly observedOutcome: "pass" | "fail" | "refusal";
    readonly errors: readonly string[];
  };
  readonly protocol: Phase10C0VS6ArtifactIdentity;
  readonly codeAndImportReceipt: {
    readonly freezePreflight: { readonly protocol: Phase10C0VS6ArtifactIdentity };
    readonly forbiddenImportsObserved: readonly [];
    readonly generatorCheckerScientificImportOverlap: readonly [];
    readonly pass: true;
  };
}

interface ReprovedMetric {
  readonly value: number;
  readonly tolerance: number;
  readonly pass: boolean;
}

interface ReprovedCase {
  readonly caseId: string;
  readonly exactRoster: boolean;
  readonly scalarRecordCoherent: boolean;
  readonly uniformControlCoherent: boolean;
  readonly uniformKineticTermsExactZero: boolean;
  readonly metrics: Readonly<Record<(typeof METRIC_IDS)[number], ReprovedMetric>>;
  readonly pass: boolean;
}

export interface Phase10C0VRadialCleanScienceReproof {
  readonly checkResults: readonly [
    Phase10C0VS6ParsedRadialEvaluationReceipt["checkResults"][number],
    Phase10C0VS6ParsedRadialEvaluationReceipt["checkResults"][number],
  ];
  readonly numericalDisposition: "pass" | "fail";
}

interface ParsedProducerSummary {
  readonly schema: "phase10-c0v-radial-producer-summary-v1";
  readonly authority: "non-authoritative";
  readonly caseCount: 4;
  readonly totalNumericFieldValues: 300;
  readonly totalUniformFieldValues: 300;
  readonly allFinite: boolean;
  readonly reportedDisposition: "pass" | "fail";
  readonly reportedMaximum: number;
}

export interface Phase10C0VRadialMutationWitness {
  readonly pass: boolean;
  readonly reasonCodes: readonly string[];
  readonly fieldMovedCaseIds: readonly string[];
}

export interface Phase10C0VRadialForgedSummaryWitness {
  readonly pass: boolean;
  readonly reasonCodes: readonly string[];
}

export type Phase10C0VRadialFiniteShellArtifact = Readonly<{
    negativeControlId: "nc-radial-finite-shell-term";
    artifactKind: "mutated-witness";
    identity: Phase10C0VS6ArtifactIdentity;
    bytes: Uint8Array;
  }>;

export type Phase10C0VRadialForgedSummaryArtifact = Readonly<{
    negativeControlId: "nc-radial-forged-summary";
    artifactKind: "mutated-summary";
    identity: Phase10C0VS6ArtifactIdentity;
    bytes: Uint8Array;
  }>;

export type Phase10C0VRadialRobinCoefficientArtifact = Readonly<{
    negativeControlId: "nc-radial-robin-coefficient";
    artifactKind: "mutated-witness";
    identity: Phase10C0VS6ArtifactIdentity;
    bytes: Uint8Array;
  }>;

export type Phase10C0VRadialNegativeControlArtifact =
  | Phase10C0VRadialFiniteShellArtifact
  | Phase10C0VRadialForgedSummaryArtifact
  | Phase10C0VRadialRobinCoefficientArtifact;

export type Phase10C0VRadialNegativeControlArtifactTuple = readonly [
  Phase10C0VRadialFiniteShellArtifact,
  Phase10C0VRadialForgedSummaryArtifact,
  Phase10C0VRadialRobinCoefficientArtifact,
];

export interface Phase10C0VRadialRawArtifactReproofInput {
  readonly packetProtocol: Phase10C0VS6ArtifactIdentity;
  readonly packetProtocolBytes: Uint8Array;
  readonly preflightBytes: Uint8Array;
  readonly scienceProtocolBytes: Uint8Array;
  readonly referenceBytes: Uint8Array;
  readonly evaluationBytes: Uint8Array;
  readonly cleanWitnessBytes: Uint8Array;
  readonly cleanProducerSummaryBytes: Uint8Array;
  readonly finiteShellWitnessBytes: Uint8Array;
  readonly forgedSummaryBytes: Uint8Array;
  readonly robinCoefficientWitnessBytes: Uint8Array;
}

export interface Phase10C0VRadialRawArtifactReproof {
  readonly schema: "phase10-c0v-radial-raw-artifact-reproof-v1";
  readonly packetId: "c0v-radial-produce";
  readonly evaluation: Phase10C0VS6ArtifactIdentity;
  readonly cleanWitness: Phase10C0VS6ArtifactIdentity;
  readonly cleanProducerSummary: Phase10C0VS6ArtifactIdentity;
  readonly negativeControlArtifacts: readonly [
    Phase10C0VS6ArtifactIdentity,
    Phase10C0VS6ArtifactIdentity,
    Phase10C0VS6ArtifactIdentity,
  ];
  readonly mutationReproofs: readonly [
    Phase10C0VRadialMutationWitness,
    Phase10C0VRadialForgedSummaryWitness,
    Phase10C0VRadialMutationWitness,
  ];
  readonly cleanScienceReproof: Phase10C0VRadialCleanScienceReproof;
  readonly negativeControlResults: readonly Phase10C0VS6ParsedRadialNegativeControl[];
  readonly numericalDisposition: "pass" | "fail";
  readonly artifactDisposition: "valid";
  readonly verdict: "pass";
}

function fail(detail: string): never {
  throw new Error(`Phase 10 C0V radial raw-artifact reproof refused: ${detail}`);
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function identity(path: string, bytes: Uint8Array): Phase10C0VS6ArtifactIdentity {
  return Object.freeze({ path, byteLength: bytes.byteLength, sha256: sha256(bytes) });
}

function sameArtifactIdentity(
  left: Phase10C0VS6ArtifactIdentity,
  right: Phase10C0VS6ArtifactIdentity,
): boolean {
  return left.path === right.path && left.byteLength === right.byteLength && left.sha256 === right.sha256;
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function sliceEqual(left: Uint8Array, right: Uint8Array, start: number, end: number): boolean {
  return sameBytes(left.subarray(start, end), right.subarray(start, end));
}

function sameStringArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function canonicalFloat(value: number, label: string): number {
  if (!Number.isFinite(value) || Object.is(value, -0)) fail(`${label} is non-finite or negative zero`);
  return value;
}

function decodeControlWitness(
  bytesInput: Uint8Array,
  scienceProtocolSha256: string,
  referenceSha256: string,
): DecodedControlWitness {
  const bytes = new Uint8Array(bytesInput);
  if (bytes.byteLength !== 5_891) fail("control witness length differs");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (textDecoder.decode(bytes.subarray(0, 8)) !== "C0VRAD01") fail("control witness magic differs");
  if (view.getUint32(8, true) !== 1) fail("control witness version differs");
  if (view.getUint32(12, true) !== 0x01020304) fail("control witness endian marker differs");
  const schemaLength = view.getUint32(16, true);
  if (schemaLength !== 29 || textDecoder.decode(bytes.subarray(20, 20 + schemaLength)) !==
    "phase10-c0v-radial-witness-v1") fail("control witness schema differs");
  if (Buffer.from(bytes.subarray(49, 81)).toString("hex") !== scienceProtocolSha256) {
    fail("control witness science-protocol digest differs");
  }
  if (Buffer.from(bytes.subarray(81, 113)).toString("hex") !== referenceSha256) {
    fail("control witness reference digest differs");
  }
  if (Number(view.getBigUint64(113, true)) !== 5_738) fail("control payload length differs");
  if (Buffer.from(bytes.subarray(121, 153)).toString("hex") !== sha256(bytes.subarray(153))) {
    fail("control payload digest differs");
  }
  if (view.getUint32(153, true) !== 4 || view.getUint32(157, true) !== 22) {
    fail("control payload roster prefix differs");
  }
  for (let index = 0; index < 22; index++) {
    canonicalFloat(view.getFloat64(161 + index * 8, true), `global[${index}]`);
  }
  let offset = HEADER_BYTES + 8 + GLOBAL_FLOAT_BYTES;
  const records: ControlRecord[] = [];
  for (let index = 0; index < CASE_IDS.length; index++) {
    const recordStart = offset;
    const idLength = view.getUint32(offset, true);
    offset += 4;
    const caseId = textDecoder.decode(bytes.subarray(offset, offset + idLength));
    offset += idLength;
    if (caseId !== CASE_IDS[index]) fail(`control case ${index} ID differs`);
    const nodeCount = view.getUint32(offset, true);
    offset += 4;
    if (nodeCount !== NODE_COUNTS[index]) fail(`${caseId} control node count differs`);
    if (view.getUint32(offset, true) !== 18) fail(`${caseId} control scalar count differs`);
    offset += 4;
    const scalarStart = offset;
    for (let scalarIndex = 0; scalarIndex < 18; scalarIndex++) {
      canonicalFloat(view.getFloat64(offset, true), `${caseId}.scalar[${scalarIndex}]`);
      offset += 8;
    }
    if (Number(view.getBigUint64(offset, true)) !== nodeCount) {
      fail(`${caseId} control numeric-field count differs`);
    }
    offset += 8;
    const numericFieldStart = offset;
    for (let fieldIndex = 0; fieldIndex < nodeCount; fieldIndex++) {
      canonicalFloat(view.getFloat64(offset, true), `${caseId}.numeric[${fieldIndex}]`);
      offset += 8;
    }
    if (Number(view.getBigUint64(offset, true)) !== nodeCount) {
      fail(`${caseId} control uniform-field count differs`);
    }
    offset += 8;
    const uniformFieldStart = offset;
    for (let fieldIndex = 0; fieldIndex < nodeCount; fieldIndex++) {
      canonicalFloat(view.getFloat64(offset, true), `${caseId}.uniform[${fieldIndex}]`);
      offset += 8;
    }
    if (offset - recordStart !== CASE_RECORD_BYTES[index]) fail(`${caseId} control record length differs`);
    records.push(Object.freeze({
      caseId, nodeCount, recordStart, recordEnd: offset, scalarStart, numericFieldStart, uniformFieldStart,
    }));
  }
  if (offset !== bytes.byteLength) fail("control witness has trailing bytes");
  return Object.freeze({ bytes, view, records: Object.freeze(records) });
}

function assertIdentityBytes(
  bytes: Uint8Array,
  expected: Phase10C0VS6ArtifactIdentity,
  label: string,
): void {
  if (bytes.byteLength !== expected.byteLength || sha256(bytes) !== expected.sha256) {
    fail(`${label} bytes differ from packet-bound identity`);
  }
}

function scienceWitness(decoded: DecodedControlWitness): ScienceWitness {
  const globals = Object.freeze(Object.fromEntries(GLOBAL_FLOAT_NAMES.map((name, index) => [
    name,
    decoded.view.getFloat64(161 + index * 8, true),
  ]))) as ScienceWitness["globals"];
  const cases = decoded.records.map((record) => {
    const scalars = Object.freeze(Object.fromEntries(CASE_SCALAR_NAMES.map((name, index) => [
      name,
      scalar(decoded, record, index),
    ]))) as ScienceCase["scalars"];
    return Object.freeze({
      caseId: record.caseId,
      nodeCount: record.nodeCount,
      scalars,
      numericField: Object.freeze(Array.from(
        { length: record.nodeCount },
        (_unused, index) => field(decoded, record, index),
      )),
      uniformField: Object.freeze(Array.from(
        { length: record.nodeCount },
        (_unused, index) => decoded.view.getFloat64(record.uniformFieldStart + index * 8, true),
      )),
    });
  });
  return Object.freeze({ globals, cases: Object.freeze(cases) });
}

function numericIdentity(value: NumericIdentity, label: string): number {
  if (!/^[0-9a-f]{16}$/u.test(value.binary64Hex)) fail(`${label} binary64 identity differs`);
  const bytes = Uint8Array.from(Buffer.from(value.binary64Hex, "hex"));
  const decoded = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getFloat64(0, false);
  const decimal = Number(value.decimal);
  if (!Number.isFinite(decoded) || !Number.isFinite(decimal) || Object.is(decoded, -0) ||
    !Object.is(decoded, decimal)) fail(`${label} decimal/binary64 identity differs`);
  return decoded === 0 ? 0 : decoded;
}

function relativeDifference(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.max(Math.abs(expected), Number.MIN_VALUE);
}

function reprovedMetric(value: number, tolerance: number): ReprovedMetric {
  const normalized = value === 0 ? 0 : value;
  if (!Number.isFinite(normalized) || normalized < 0 || !Number.isFinite(tolerance) || tolerance < 0) {
    fail("clean-science metric or tolerance is invalid");
  }
  return Object.freeze({ value: normalized, tolerance, pass: normalized <= tolerance });
}

function expectedGlobalValues(science: Phase10C0VRadialReferenceInput): readonly number[] {
  const operands = science.operands;
  const constants = operands.physicalConstants;
  const temperatureK = operands.tempC + constants.celsiusZeroK;
  const saturationPressurePa = constants.saturationPressurePrefactorMbar *
    Math.exp(constants.saturationPressureExponentK / temperatureK) * constants.mbarToPa;
  const saturationNumberDensityPerM3 = saturationPressurePa /
    (constants.kBoltzmannJPerK * temperatureK);
  const diffusivityM2S = constants.diffusivityAir1AtmM2S *
    (constants.standardAtmospherePa / operands.pressurePa);
  const thermalSpeedMS = Math.sqrt(
    (constants.kBoltzmannJPerK * temperatureK) /
    (2 * Math.PI * constants.waterMoleculeMassKg),
  );
  const kineticVelocityMS =
    (saturationNumberDensityPerM3 / constants.iceNumberDensityPerM3) * thermalSpeedMS;
  const kineticLengthM =
    (saturationNumberDensityPerM3 / constants.iceNumberDensityPerM3) *
    (diffusivityM2S / kineticVelocityMS);
  return Object.freeze([
    operands.radiusM, operands.farRadiusM, operands.sigmaInfinity, operands.tempC,
    operands.pressurePa, operands.alphaHKConst, constants.kBoltzmannJPerK,
    constants.celsiusZeroK, constants.waterMoleculeMassKg, constants.iceNumberDensityPerM3,
    constants.diffusivityAir1AtmM2S, constants.standardAtmospherePa,
    constants.saturationPressurePrefactorMbar, constants.saturationPressureExponentK,
    constants.mbarToPa, temperatureK, saturationPressurePa, saturationNumberDensityPerM3,
    diffusivityM2S, thermalSpeedMS, kineticVelocityMS, kineticLengthM,
  ]);
}

function referenceFieldError(
  observed: readonly number[],
  reference: Pick<ReferenceCase, "caseId" | "nodeCount" | "samples">,
  actualSpacingM: number,
): Readonly<{ lInf: number; weightedL2: number; radiiExact: boolean }> {
  if (observed.length !== reference.samples.length || observed.length !== reference.nodeCount) {
    return Object.freeze({ lInf: Infinity, weightedL2: Infinity, radiiExact: false });
  }
  let maxError = 0;
  let maxReference = 0;
  let weightedErrorSquared = 0;
  let weightedReferenceSquared = 0;
  let radiiExact = true;
  const firstRadius = numericIdentity(reference.samples[0]!.radiusM, `${reference.caseId}.radius[0]`);
  for (const [index, sample] of reference.samples.entries()) {
    if (sample.nodeIndex !== index) radiiExact = false;
    const radiusM = numericIdentity(sample.radiusM, `${reference.caseId}.radius[${index}]`);
    radiiExact &&= Object.is(radiusM, firstRadius + index * actualSpacingM);
    const expectedSigma = numericIdentity(sample.sigma, `${reference.caseId}.sigma[${index}]`);
    const error = observed[index]! - expectedSigma;
    const weight = (index === 0 || index === observed.length - 1 ? 0.5 : 1) *
      radiusM * radiusM * actualSpacingM;
    maxError = Math.max(maxError, Math.abs(error));
    maxReference = Math.max(maxReference, Math.abs(expectedSigma));
    weightedErrorSquared += weight * error * error;
    weightedReferenceSquared += weight * expectedSigma * expectedSigma;
  }
  return Object.freeze({
    lInf: maxError / Math.max(maxReference, Number.MIN_VALUE),
    weightedL2: Math.sqrt(weightedErrorSquared /
      Math.max(weightedReferenceSquared, Number.MIN_VALUE)),
    radiiExact,
  });
}

function surfaceGradient(fieldValues: readonly number[], radiusM: number, spacingM: number): number {
  if (fieldValues.length < 3) fail("clean witness field has fewer than three nodes");
  const u0 = radiusM * fieldValues[0]!;
  const u1 = (radiusM + spacingM) * fieldValues[1]!;
  const u2 = (radiusM + 2 * spacingM) * fieldValues[2]!;
  const uPrime = (-3 * u0 + 4 * u1 - u2) / (2 * spacingM);
  return uPrime / radiusM - u0 / (radiusM * radiusM);
}

function reproveCase(
  science: Phase10C0VRadialReferenceInput,
  observed: ScienceCase,
  reference: ReferenceCheckCase,
  caseIndex: number,
): ReprovedCase {
  const roster = science.roster[caseIndex]!;
  const scalarRow = observed.scalars;
  const independent = reference.independent;
  const uniformReference = reference.independentUniformFieldControl;
  const exactRoster = observed.caseId === roster.caseId &&
    observed.nodeCount === roster.expectedNodeCount &&
    Object.is(scalarRow.requestedSpacingM, roster.requestedSpacingM) &&
    Object.is(scalarRow.actualSpacingM, roster.expectedActualSpacingM) &&
    Object.is(scalarRow.requestedSpacingM, numericIdentity(
      independent.requestedSpacingM,
      `${observed.caseId}.reference requested spacing`,
    )) &&
    Object.is(scalarRow.actualSpacingM, numericIdentity(
      independent.actualSpacingM,
      `${observed.caseId}.reference actual spacing`,
    ));
  const referenceSurface = numericIdentity(independent.sigmaSurface, `${observed.caseId}.surface`);
  const referenceVelocity = numericIdentity(independent.growthVelocityMS, `${observed.caseId}.velocity`);
  const numericErrors = referenceFieldError(
    observed.numericField,
    independent,
    scalarRow.actualSpacingM,
  );
  const uniformErrors = referenceFieldError(
    observed.uniformField,
    uniformReference,
    scalarRow.actualSpacingM,
  );
  const gradient = surfaceGradient(observed.numericField, science.operands.radiusM, scalarRow.actualSpacingM);
  const uniformGradient = surfaceGradient(
    observed.uniformField,
    science.operands.radiusM,
    scalarRow.actualSpacingM,
  );
  const globals = expectedGlobalValues(science);
  const saturationDensity = globals[17]!;
  const diffusivity = globals[18]!;
  const kineticVelocity = globals[20]!;
  const kineticLength = globals[21]!;
  const densityRatio = saturationDensity /
    science.operands.physicalConstants.iceNumberDensityPerM3;
  const expectedFlux = densityRatio * diffusivity * gradient;
  const expectedKinetic = science.operands.alphaHKConst * kineticVelocity * scalarRow.sigmaSurface;
  const expectedRobinLeft = kineticLength * gradient;
  const expectedRobinRight = science.operands.alphaHKConst * scalarRow.sigmaSurface;
  const expectedRobinResidual = expectedRobinLeft - expectedRobinRight;
  const expectedUniformKinetic = 0 * kineticVelocity * scalarRow.uniformSigmaSurface;
  const expectedUniformFlux = densityRatio * diffusivity * uniformGradient;
  const expectedUniformRobinLeft = kineticLength * uniformGradient;
  const expectedUniformRobinRight = 0 * scalarRow.uniformSigmaSurface;
  const expectedUniformRobinResidual = expectedUniformRobinLeft - expectedUniformRobinRight;
  const coherenceTolerance = science.tolerances.generatorCheckerAgreement;
  const scalarRecordCoherent =
    Object.is(scalarRow.sigmaSurface, observed.numericField[0]) &&
    Object.is(scalarRow.sigmaShell, observed.numericField.at(-1)) &&
    Object.is(scalarRow.uniformSigmaSurface, observed.uniformField[0]) &&
    Object.is(scalarRow.uniformSigmaShell, observed.uniformField.at(-1)) &&
    relativeDifference(scalarRow.surfaceGradientPerM, gradient) <= coherenceTolerance &&
    relativeDifference(scalarRow.growthVelocityFluxMS, expectedFlux) <= coherenceTolerance &&
    relativeDifference(scalarRow.growthVelocityKineticMS, expectedKinetic) <= coherenceTolerance &&
    relativeDifference(scalarRow.robinLeft, expectedRobinLeft) <= coherenceTolerance &&
    relativeDifference(scalarRow.robinRight, expectedRobinRight) <= coherenceTolerance &&
    Math.abs(scalarRow.robinResidual - expectedRobinResidual) /
      Math.max(Math.abs(expectedRobinLeft), Math.abs(expectedRobinRight), Number.MIN_VALUE) <=
      coherenceTolerance;
  const uniformControlCoherent =
    relativeDifference(scalarRow.uniformSurfaceGradientPerM, uniformGradient) <= coherenceTolerance &&
    relativeDifference(scalarRow.uniformGrowthVelocityKineticMS, expectedUniformKinetic) <=
      coherenceTolerance &&
    relativeDifference(scalarRow.uniformGrowthVelocityFluxMS, expectedUniformFlux) <= coherenceTolerance &&
    relativeDifference(scalarRow.uniformRobinLeft, expectedUniformRobinLeft) <= coherenceTolerance &&
    Object.is(scalarRow.uniformRobinRight, expectedUniformRobinRight) &&
    Math.abs(scalarRow.uniformRobinResidual - expectedUniformRobinResidual) /
      Math.max(Math.abs(expectedUniformRobinLeft), Math.abs(expectedUniformRobinRight), Number.MIN_VALUE) <=
      coherenceTolerance;
  const uniformKineticTermsExactZero =
    Object.is(scalarRow.uniformGrowthVelocityKineticMS, 0) &&
    Object.is(scalarRow.uniformRobinRight, 0);
  const surfaceRelative = relativeDifference(scalarRow.sigmaSurface, referenceSurface);
  const velocityRelative = Math.max(
    relativeDifference(scalarRow.growthVelocityKineticMS, referenceVelocity),
    relativeDifference(scalarRow.growthVelocityFluxMS, referenceVelocity),
  );
  const shellNormalized = Math.abs(scalarRow.sigmaShell - science.operands.sigmaInfinity) /
    Math.max(Math.abs(science.operands.sigmaInfinity), Number.MIN_VALUE);
  const uniformNormalizedLInf = Math.max(...observed.uniformField.map((value) =>
    Math.abs(value - science.operands.sigmaInfinity))) /
    Math.max(Math.abs(science.operands.sigmaInfinity), Number.MIN_VALUE);
  const robinResidualNormalized = Math.abs(scalarRow.robinResidual) /
    Math.max(Math.abs(scalarRow.robinLeft), Math.abs(scalarRow.robinRight), Number.MIN_VALUE);
  const generatorCheckerAgreement = Math.max(
    surfaceRelative,
    velocityRelative,
    numericErrors.lInf,
    numericErrors.weightedL2,
  );
  const metrics = Object.freeze({
    surfaceRelative: reprovedMetric(surfaceRelative, science.tolerances.surfaceRelative),
    velocityRelative: reprovedMetric(velocityRelative, science.tolerances.velocityRelative),
    fieldRelativeLInf: reprovedMetric(numericErrors.lInf, science.tolerances.fieldRelativeLInf),
    fieldWeightedRelativeL2: reprovedMetric(
      numericErrors.weightedL2,
      science.tolerances.fieldWeightedRelativeL2,
    ),
    shellNormalized: reprovedMetric(shellNormalized, science.tolerances.shellNormalized),
    uniformNormalizedLInf: reprovedMetric(
      uniformNormalizedLInf,
      science.tolerances.uniformNormalizedLInf,
    ),
    robinResidualNormalized: reprovedMetric(
      robinResidualNormalized,
      science.tolerances.robinResidualNormalized,
    ),
    generatorCheckerAgreement: reprovedMetric(
      generatorCheckerAgreement,
      science.tolerances.generatorCheckerAgreement,
    ),
  });
  const pass = exactRoster && scalarRecordCoherent && uniformControlCoherent &&
    uniformKineticTermsExactZero && numericErrors.radiiExact && uniformErrors.radiiExact &&
    METRIC_IDS.every((metricId) => metrics[metricId].pass);
  return Object.freeze({
    caseId: observed.caseId,
    exactRoster,
    scalarRecordCoherent,
    uniformControlCoherent,
    uniformKineticTermsExactZero,
    metrics,
    pass,
  });
}

function reproveMaxima(
  science: Phase10C0VRadialReferenceInput,
  cases: readonly ReprovedCase[],
): Readonly<Record<(typeof METRIC_IDS)[number], ReprovedMetric>> {
  return Object.freeze(Object.fromEntries(METRIC_IDS.map((metricId) => [
    metricId,
    reprovedMetric(
      Math.max(...cases.map((entry) => entry.metrics[metricId].value)),
      science.tolerances[metricId],
    ),
  ]))) as Readonly<Record<(typeof METRIC_IDS)[number], ReprovedMetric>>;
}

function reproveReferenceIndependence(
  science: Phase10C0VRadialReferenceInput,
  reference: ParsedRadialReference,
  scienceProtocol: Phase10C0VS6ArtifactIdentity,
): Readonly<{ pass: boolean; maximumAgreement: number; reasonCodes: readonly string[] }> {
  const reasons: string[] = [];
  if (reference.disposition !== "reference-frozen") reasons.push("reference-disposition-not-frozen");
  if (reference.comparison.expectedOutcome !== "pass" ||
    reference.comparison.observedOutcome !== "pass" || reference.comparison.errors.length !== 0) {
    reasons.push("reference-comparison-not-pass");
  }
  if (!sameArtifactIdentity(reference.protocol, scienceProtocol)) {
    reasons.push("reference-protocol-identity-differs");
  }
  if (!sameArtifactIdentity(reference.codeAndImportReceipt.freezePreflight.protocol, scienceProtocol)) {
    reasons.push("reference-freeze-protocol-identity-differs");
  }
  if (reference.codeAndImportReceipt.pass !== true ||
    reference.codeAndImportReceipt.forbiddenImportsObserved.length !== 0 ||
    reference.codeAndImportReceipt.generatorCheckerScientificImportOverlap.length !== 0) {
    reasons.push("reference-code-import-receipt-not-pass");
  }
  if (!reference.independentCheck.pass || !reference.independentCheck.allFinite ||
    reference.independentCheck.errors.length !== 0) reasons.push("reference-independent-check-not-pass");
  if (reference.generatorOutput.cases.length !== 4 ||
    reference.generatorOutput.uniformFieldControl.cases.length !== 4 ||
    reference.independentCheck.cases.length !== 4) reasons.push("reference-case-roster-differs");

  let maximumAgreement = 0;
  for (let index = 0; index < Math.min(4, reference.independentCheck.cases.length); index++) {
    const checked = reference.independentCheck.cases[index]!;
    const generated = reference.generatorOutput.cases[index]!;
    const generatedUniform = reference.generatorOutput.uniformFieldControl.cases[index]!;
    if (checked.caseId !== science.roster[index]!.caseId || generated.caseId !== checked.caseId ||
      generatedUniform.caseId !== checked.caseId || !checked.exactRoster ||
      !checked.exactUniformZeroRates || !checked.pass || checked.errors.length !== 0) {
      reasons.push(`reference-case-${index}-status-differs`);
    }
    const independent = checked.independent;
    const surface = relativeDifference(
      numericIdentity(generated.sigmaSurface, `reference.generator.case${index}.surface`),
      numericIdentity(independent.sigmaSurface, `reference.checker.case${index}.surface`),
    );
    const independentVelocity = numericIdentity(
      independent.growthVelocityMS,
      `reference.checker.case${index}.velocity`,
    );
    const velocity = Math.max(
      relativeDifference(
        numericIdentity(generated.growthVelocityFluxMS, `reference.generator.case${index}.flux`),
        independentVelocity,
      ),
      relativeDifference(
        numericIdentity(generated.growthVelocityKineticMS, `reference.generator.case${index}.kinetic`),
        independentVelocity,
      ),
    );
    const generatedField = generated.samples.map((sample) =>
      numericIdentity(sample.sigma, `reference.generator.case${index}.field`));
    const fieldErrors = referenceFieldError(
      generatedField,
      independent,
      numericIdentity(independent.actualSpacingM, `reference.checker.case${index}.spacing`),
    );
    maximumAgreement = Math.max(
      maximumAgreement,
      surface,
      velocity,
      fieldErrors.lInf,
      fieldErrors.weightedL2,
    );
    const recordedAgreement = numericIdentity(
      checked.metrics.generatorCheckerAgreement.value,
      `reference.checker.case${index}.recordedAgreement`,
    );
    if (recordedAgreement > science.tolerances.generatorCheckerAgreement ||
      checked.metrics.generatorCheckerAgreement.pass !==
        (recordedAgreement <= science.tolerances.generatorCheckerAgreement)) {
      reasons.push(`reference-case-${index}-recorded-agreement-fails`);
    }
    for (const metricId of METRIC_IDS) {
      const recordedTolerance = numericIdentity(
        checked.metrics[metricId].tolerance,
        `reference.checker.case${index}.${metricId}.tolerance`,
      );
      if (!Object.is(recordedTolerance, science.tolerances[metricId])) {
        reasons.push(`reference-case-${index}-${metricId}-tolerance-differs`);
      }
    }
  }
  if (maximumAgreement > science.tolerances.generatorCheckerAgreement) {
    reasons.push("reference-generator-checker-agreement-fails");
  }
  return Object.freeze({
    pass: reasons.length === 0,
    maximumAgreement,
    reasonCodes: Object.freeze([...new Set(reasons)].sort()),
  });
}

function cleanCheckResult(
  checkId: "chk-c0v-radial-numeric" | "chk-c0v-radial-reference-independence",
  pass: boolean,
  reasonCodes: readonly string[],
  witnesses: readonly StrictJson[],
): Phase10C0VS6ParsedRadialEvaluationReceipt["checkResults"][number] {
  return Object.freeze({
    checkId,
    pass,
    reasonCodes: Object.freeze([...new Set(reasonCodes)].sort()),
    witnesses: Object.freeze(witnesses.map((entry) => strictJsonSnapshot(entry))),
  });
}

function rederiveCleanScienceChecks(
  science: Phase10C0VRadialReferenceInput,
  reference: ParsedRadialReference,
  witness: ScienceWitness,
  scienceProtocol: Phase10C0VS6ArtifactIdentity,
): Readonly<{
  numericalCheck: Phase10C0VS6ParsedRadialEvaluationReceipt["checkResults"][number];
  referenceCheck: Phase10C0VS6ParsedRadialEvaluationReceipt["checkResults"][number];
}> {
  const expectedGlobals = expectedGlobalValues(science);
  const exactGlobalEcho = GLOBAL_FLOAT_NAMES.every((name, index) =>
    Object.is(witness.globals[name], expectedGlobals[index]));
  const referenceAudit = reproveReferenceIndependence(science, reference, scienceProtocol);
  const cases = Object.freeze(witness.cases.map((entry, index) =>
    reproveCase(science, entry, reference.independentCheck.cases[index]!, index)));
  const maxima = reproveMaxima(science, cases);
  const numericalPass = exactGlobalEcho && referenceAudit.pass &&
    cases.every((entry) => entry.pass) && METRIC_IDS.every((metricId) => maxima[metricId].pass);
  const numericalReasons = [
    ...(exactGlobalEcho ? [] : ["witness-global-operand-or-derived-scale-differs"]),
    ...(referenceAudit.pass ? [] : ["reference-independence-audit-fails"]),
    ...cases.filter((entry) => !entry.pass).map((entry) => `${entry.caseId}-fails`),
  ].sort();
  return Object.freeze({
    numericalCheck: cleanCheckResult(
      "chk-c0v-radial-numeric",
      numericalPass,
      numericalReasons,
      [{ exactGlobalEcho, cases, maxima } as unknown as StrictJson],
    ),
    referenceCheck: cleanCheckResult(
      "chk-c0v-radial-reference-independence",
      referenceAudit.pass,
      referenceAudit.reasonCodes,
      [{
        referenceDisposition: reference.disposition,
        observedOutcome: reference.comparison.observedOutcome,
        maximumGeneratorCheckerAgreement: referenceAudit.maximumAgreement,
        tolerance: science.tolerances.generatorCheckerAgreement,
        codeAndImportReceiptPass: reference.codeAndImportReceipt.pass,
      } as unknown as StrictJson],
    ),
  });
}

function scalar(decoded: DecodedControlWitness, record: ControlRecord, index: number): number {
  return decoded.view.getFloat64(record.scalarStart + index * 8, true);
}

function field(decoded: DecodedControlWitness, record: ControlRecord, index: number): number {
  return decoded.view.getFloat64(record.numericFieldStart + index * 8, true);
}

function expectedNumericScalars(
  decoded: DecodedControlWitness,
  record: ControlRecord,
  attachmentCoefficient: number,
): readonly number[] {
  const radiusM = decoded.view.getFloat64(161, true);
  const spacingM = scalar(decoded, record, 1);
  const sigmaSurface = field(decoded, record, 0);
  const sigmaShell = field(decoded, record, record.nodeCount - 1);
  const u0 = radiusM * sigmaSurface;
  const u1 = (radiusM + spacingM) * field(decoded, record, 1);
  const u2 = (radiusM + 2 * spacingM) * field(decoded, record, 2);
  const uPrime = (-3 * u0 + 4 * u1 - u2) / (2 * spacingM);
  const gradient = uPrime / radiusM - u0 / (radiusM * radiusM);
  const saturationNumberDensityPerM3 = decoded.view.getFloat64(161 + 17 * 8, true);
  const diffusivityM2S = decoded.view.getFloat64(161 + 18 * 8, true);
  const kineticVelocityMS = decoded.view.getFloat64(161 + 20 * 8, true);
  const kineticLengthM = decoded.view.getFloat64(161 + 21 * 8, true);
  const iceNumberDensityPerM3 = decoded.view.getFloat64(161 + 9 * 8, true);
  const growthVelocityKineticMS = attachmentCoefficient * kineticVelocityMS * sigmaSurface;
  const growthVelocityFluxMS =
    (saturationNumberDensityPerM3 / iceNumberDensityPerM3) * diffusivityM2S * gradient;
  const robinLeft = kineticLengthM * gradient;
  const robinRight = attachmentCoefficient * sigmaSurface;
  return Object.freeze([
    sigmaSurface,
    sigmaShell,
    growthVelocityKineticMS,
    growthVelocityFluxMS,
    gradient,
    robinLeft,
    robinRight,
    robinLeft - robinRight,
  ]);
}

function independentlySolveHalfCoefficientField(
  clean: DecodedControlWitness,
  record: ControlRecord,
): Float64Array {
  const radiusM = clean.view.getFloat64(161, true);
  const farRadiusM = clean.view.getFloat64(161 + 8, true);
  const sigmaInfinity = clean.view.getFloat64(161 + 2 * 8, true);
  const kineticLengthM = clean.view.getFloat64(161 + 21 * 8, true);
  const effectiveCoefficient = clean.view.getFloat64(161 + 5 * 8, true) / 2;
  const nodes = record.nodeCount;
  const spacingM = scalar(clean, record, 1);
  const lower = new Float64Array(nodes);
  const diagonal = new Float64Array(nodes);
  const upper = new Float64Array(nodes);
  const rightHandSide = new Float64Array(nodes);
  const surfaceScale = effectiveCoefficient + kineticLengthM / radiusM;
  diagonal[0] = -2 * kineticLengthM - 2 * spacingM * surfaceScale;
  upper[0] = 2 * kineticLengthM;
  for (let index = 1; index < nodes - 1; index++) {
    lower[index] = 1;
    diagonal[index] = -2;
    upper[index] = 1;
  }
  diagonal[nodes - 1] = 1;
  rightHandSide[nodes - 1] = farRadiusM * sigmaInfinity;
  const upperReduced = new Float64Array(nodes);
  const rightReduced = new Float64Array(nodes);
  upperReduced[0] = upper[0] / diagonal[0];
  rightReduced[0] = rightHandSide[0] / diagonal[0];
  for (let index = 1; index < nodes; index++) {
    const pivot = diagonal[index]! - lower[index]! * upperReduced[index - 1]!;
    upperReduced[index] = upper[index]! / pivot;
    rightReduced[index] = (rightHandSide[index]! - lower[index]! * rightReduced[index - 1]!) / pivot;
  }
  const radialProduct = new Float64Array(nodes);
  radialProduct[nodes - 1] = rightReduced[nodes - 1]!;
  for (let index = nodes - 2; index >= 0; index--) {
    radialProduct[index] = rightReduced[index]! - upperReduced[index]! * radialProduct[index + 1]!;
  }
  const result = new Float64Array(nodes);
  for (let index = 0; index < nodes; index++) {
    result[index] = radialProduct[index]! / (radiusM + index * spacingM);
  }
  return result;
}

function movedFields(clean: DecodedControlWitness, mutated: DecodedControlWitness): readonly string[] {
  return Object.freeze(clean.records.filter((record, recordIndex) => {
    const changed = mutated.records[recordIndex]!;
    return Array.from({ length: record.nodeCount }, (_unused, index) => index)
      .some((index) => !Object.is(field(clean, record, index), field(mutated, changed, index)));
  }).map((record) => record.caseId));
}

/** Pure proof of the finite-shell mutation; it never calls the mutation author or evaluator. */
export function independentlyReprovePhase10RadialFiniteShellMutation(
  cleanBytes: Uint8Array,
  mutatedBytes: Uint8Array,
  scienceProtocolSha256: string,
  referenceSha256: string,
): Phase10C0VRadialMutationWitness {
  const clean = decodeControlWitness(cleanBytes, scienceProtocolSha256, referenceSha256);
  const mutated = decodeControlWitness(mutatedBytes, scienceProtocolSha256, referenceSha256);
  const reasons: string[] = [];
  if (!sliceEqual(clean.bytes, mutated.bytes, 0, 121)) reasons.push("header-ancestry-moved");
  if (!sliceEqual(clean.bytes, mutated.bytes, 153, 153 + 8 + GLOBAL_FLOAT_BYTES)) {
    reasons.push("global-operands-moved");
  }
  const cleanFirst = clean.records[0]!;
  const mutatedFirst = mutated.records[0]!;
  if (!sliceEqual(clean.bytes, mutated.bytes, cleanFirst.recordStart, cleanFirst.scalarStart + 2 * 8)) {
    reasons.push("first-case-roster-or-spacing-moved");
  }
  if (!sliceEqual(clean.bytes, mutated.bytes, cleanFirst.scalarStart + 10 * 8, cleanFirst.numericFieldStart)) {
    reasons.push("first-case-uniform-scalars-or-numeric-count-moved");
  }
  const cleanUniformCountStart = cleanFirst.numericFieldStart + cleanFirst.nodeCount * 8;
  const mutatedUniformCountStart = mutatedFirst.numericFieldStart + mutatedFirst.nodeCount * 8;
  if (!sameBytes(
    clean.bytes.subarray(cleanUniformCountStart, cleanFirst.recordEnd),
    mutated.bytes.subarray(mutatedUniformCountStart, mutatedFirst.recordEnd),
  )) reasons.push("first-case-uniform-field-moved");
  for (let index = 1; index < clean.records.length; index++) {
    const cleanRecord = clean.records[index]!;
    const mutatedRecord = mutated.records[index]!;
    if (!sameBytes(
      clean.bytes.subarray(cleanRecord.recordStart, cleanRecord.recordEnd),
      mutated.bytes.subarray(mutatedRecord.recordStart, mutatedRecord.recordEnd),
    )) reasons.push(`${cleanRecord.caseId}-record-moved`);
  }
  const radiusM = clean.view.getFloat64(161, true);
  const farRadiusM = clean.view.getFloat64(161 + 8, true);
  const spacingM = scalar(clean, cleanFirst, 1);
  const u0 = radiusM * field(clean, cleanFirst, 0);
  const u1 = (radiusM + spacingM) * field(clean, cleanFirst, 1);
  const harmonicConstant = (u1 - u0) / spacingM;
  const inverseCoefficientM = u0 - harmonicConstant * radiusM;
  const mutatedConstant = harmonicConstant - inverseCoefficientM / farRadiusM;
  for (let index = 0; index < cleanFirst.nodeCount; index++) {
    const radius = radiusM + index * spacingM;
    if (!Object.is(field(mutated, mutatedFirst, index), mutatedConstant + inverseCoefficientM / radius)) {
      reasons.push("finite-shell-field-formula-differs");
      break;
    }
  }
  const dependentScalars = expectedNumericScalars(
    mutated,
    mutatedFirst,
    clean.view.getFloat64(161 + 5 * 8, true),
  );
  if (dependentScalars.some((value, index) => !Object.is(scalar(mutated, mutatedFirst, index + 2), value))) {
    reasons.push("finite-shell-dependent-scalars-differ");
  }
  const fieldMovedCaseIds = movedFields(clean, mutated);
  if (!sameStringArray(fieldMovedCaseIds, [CASE_IDS[0]])) reasons.push("finite-shell-field-roster-differs");
  return Object.freeze({
    pass: reasons.length === 0,
    reasonCodes: Object.freeze([...new Set(reasons)].sort()),
    fieldMovedCaseIds,
  });
}

/** Pure proof of the half-coefficient mutation; it never calls the mutation author or evaluator. */
export function independentlyReprovePhase10RadialRobinMutation(
  cleanBytes: Uint8Array,
  mutatedBytes: Uint8Array,
  scienceProtocolSha256: string,
  referenceSha256: string,
): Phase10C0VRadialMutationWitness {
  const clean = decodeControlWitness(cleanBytes, scienceProtocolSha256, referenceSha256);
  const mutated = decodeControlWitness(mutatedBytes, scienceProtocolSha256, referenceSha256);
  const reasons: string[] = [];
  if (!sliceEqual(clean.bytes, mutated.bytes, 0, 121)) reasons.push("header-ancestry-moved");
  if (!sliceEqual(clean.bytes, mutated.bytes, 153, 153 + 8 + GLOBAL_FLOAT_BYTES)) {
    reasons.push("global-operands-moved");
  }
  const effectiveCoefficient = clean.view.getFloat64(161 + 5 * 8, true) / 2;
  for (let index = 0; index < clean.records.length; index++) {
    const cleanRecord = clean.records[index]!;
    const mutatedRecord = mutated.records[index]!;
    if (!sliceEqual(clean.bytes, mutated.bytes, cleanRecord.recordStart, cleanRecord.scalarStart + 2 * 8)) {
      reasons.push(`${cleanRecord.caseId}-roster-or-spacing-moved`);
    }
    if (!sliceEqual(clean.bytes, mutated.bytes, cleanRecord.scalarStart + 10 * 8, cleanRecord.numericFieldStart)) {
      reasons.push(`${cleanRecord.caseId}-uniform-scalars-or-numeric-count-moved`);
    }
    const cleanUniformCountStart = cleanRecord.numericFieldStart + cleanRecord.nodeCount * 8;
    const mutatedUniformCountStart = mutatedRecord.numericFieldStart + mutatedRecord.nodeCount * 8;
    if (!sameBytes(
      clean.bytes.subarray(cleanUniformCountStart, cleanRecord.recordEnd),
      mutated.bytes.subarray(mutatedUniformCountStart, mutatedRecord.recordEnd),
    )) reasons.push(`${cleanRecord.caseId}-uniform-field-moved`);
    const independentlySolved = independentlySolveHalfCoefficientField(clean, cleanRecord);
    if (Array.from(independentlySolved).some((value, fieldIndex) =>
      !Object.is(field(mutated, mutatedRecord, fieldIndex), value))) {
      reasons.push(`${cleanRecord.caseId}-half-coefficient-field-solution-differs`);
    }
    const dependentScalars = expectedNumericScalars(mutated, mutatedRecord, effectiveCoefficient);
    if (dependentScalars.some((value, scalarIndex) =>
      !Object.is(scalar(mutated, mutatedRecord, scalarIndex + 2), value))) {
      reasons.push(`${cleanRecord.caseId}-half-coefficient-dependent-scalars-differ`);
    }
  }
  const fieldMovedCaseIds = movedFields(clean, mutated);
  if (!sameStringArray(fieldMovedCaseIds, CASE_IDS)) reasons.push("Robin-field-roster-differs");
  return Object.freeze({
    pass: reasons.length === 0,
    reasonCodes: Object.freeze([...new Set(reasons)].sort()),
    fieldMovedCaseIds,
  });
}

function parseProducerSummary(
  bytes: Uint8Array,
  authority: Phase10C0VS6RadialProducerSummaryAuthority,
  label: string,
): ParsedProducerSummary {
  const row = phase10C0VS6Object(phase10C0VS6ParsePrettyJson(bytes, label), label);
  phase10C0VS6ExactOrderedKeys(row, authority.exactFields, label);
  if (row.schema !== authority.schema || row.authority !== authority.authority ||
    row.caseCount !== authority.caseCount ||
    row.totalNumericFieldValues !== authority.totalNumericFieldValues ||
    row.totalUniformFieldValues !== authority.totalUniformFieldValues ||
    (row.reportedDisposition !== "pass" && row.reportedDisposition !== "fail") ||
    typeof row.reportedMaximum !== "number" || !Number.isFinite(row.reportedMaximum) ||
    row.reportedMaximum < 0 || Object.is(row.reportedMaximum, -0)) {
    fail(`${label} differs from frozen summary authority`);
  }
  return Object.freeze({
    schema: authority.schema,
    authority: authority.authority,
    caseCount: 4,
    totalNumericFieldValues: 300,
    totalUniformFieldValues: 300,
    allFinite: phase10C0VS6Boolean(row.allFinite, `${label}.allFinite`),
    reportedDisposition: row.reportedDisposition,
    reportedMaximum: row.reportedMaximum,
  });
}

/** Pure proof that only the non-authoritative summary disposition/maximum were forged. */
export function independentlyReprovePhase10RadialForgedSummaryMutation(
  cleanBytes: Uint8Array,
  mutatedBytes: Uint8Array,
  authority: Phase10C0VS6RadialProducerSummaryAuthority,
): Phase10C0VRadialForgedSummaryWitness {
  const clean = parseProducerSummary(cleanBytes, authority, "clean radial producer summary");
  const mutated = parseProducerSummary(mutatedBytes, authority, "forged radial producer summary");
  const reasons: string[] = [];
  if (mutated.schema !== clean.schema || mutated.authority !== clean.authority ||
    mutated.caseCount !== clean.caseCount ||
    mutated.totalNumericFieldValues !== clean.totalNumericFieldValues ||
    mutated.totalUniformFieldValues !== clean.totalUniformFieldValues ||
    mutated.allFinite !== clean.allFinite) {
    reasons.push("forged-summary-nontarget-fields-moved");
  }
  if (mutated.reportedDisposition === clean.reportedDisposition) {
    reasons.push("forged-summary-disposition-did-not-flip");
  }
  if (!Object.is(mutated.reportedMaximum, 1)) reasons.push("forged-summary-maximum-is-not-one");
  if (sameBytes(cleanBytes, mutatedBytes)) reasons.push("forged-summary-bytes-did-not-move");
  return Object.freeze({ pass: reasons.length === 0, reasonCodes: Object.freeze(reasons.sort()) });
}

function exactAudit(
  evaluation: Phase10C0VS6ParsedRadialEvaluationReceipt,
  expected: readonly StrictJson[],
): void {
  const witness = evaluation.checkResults[0]!.witnesses.at(-1);
  const envelope = phase10C0VS6Object(witness, "radial numerical negative-control audit envelope");
  phase10C0VS6ExactOrderedKeys(envelope, ["negativeControlAudit"], "radial numerical negative-control audit envelope");
  if (!Array.isArray(envelope.negativeControlAudit) || envelope.negativeControlAudit.length !== CONTROL_IDS.length) {
    fail("evaluation negative-control audit roster differs");
  }
  for (const [index, raw] of envelope.negativeControlAudit.entries()) {
    const label = `evaluation negative-control audit[${index}]`;
    const row = phase10C0VS6Object(raw, label);
    phase10C0VS6ExactOrderedKeys(row, [
      "negativeControlId", "cleanWitness", "mutatedWitness", "reference", "fieldMovedCaseIds",
      "attackedCheckPass", "cleanEvaluationIdentical", "cleanSummary", "mutatedSummary",
    ], label);
    // Parse every identity before exact comparison so malformed nested values cannot hide in JSON equality.
    parsePhase10C0VS6ArtifactIdentity(row.cleanWitness, `${label}.cleanWitness`);
    parsePhase10C0VS6ArtifactIdentity(row.mutatedWitness, `${label}.mutatedWitness`);
    parsePhase10C0VS6ArtifactIdentity(row.reference, `${label}.reference`);
    if (row.cleanSummary !== null) parsePhase10C0VS6ArtifactIdentity(row.cleanSummary, `${label}.cleanSummary`);
    if (row.mutatedSummary !== null) parsePhase10C0VS6ArtifactIdentity(row.mutatedSummary, `${label}.mutatedSummary`);
    phase10C0VS6SameJson(strictJsonSnapshot(row), expected[index]!, label);
  }
}

/**
 * Reopens no files, calls no producer/evaluator/mutator, and launches no solver. The caller supplies
 * only raw retained bytes. This pure final-verifier path independently decodes the clean witness,
 * recomputes both science checks, proves all three mutations, and exact-compares evaluation-v1.
 */
function reprovePhase10C0VRadialRawArtifactsWithScience(
  input: Phase10C0VRadialRawArtifactReproofInput,
  suppliedSyntheticScience: Phase10C0VRadialReferenceInput | null,
): Phase10C0VRadialRawArtifactReproof {
  const authority = derivePhase10C0VS6RadialLifecycleAuthority(
    input.packetProtocol,
    input.packetProtocolBytes,
    input.preflightBytes,
  );
  if (authority.preflight.verdict !== "pass" || authority.preflight.refusalCandidate !== null) {
    fail("radial reproof requires the exact passing retained preflight");
  }
  const scienceProtocol = authority.packet.bindings.scienceProtocol;
  const reference = authority.packet.bindings.referenceOrRefusal;
  if (scienceProtocol === null || reference === null) fail("radial packet lacks science/reference bindings");
  assertIdentityBytes(input.scienceProtocolBytes, scienceProtocol, "science protocol");
  assertIdentityBytes(input.referenceBytes, reference, "reference");
  const science = suppliedSyntheticScience ?? phase10C0VRadialReferenceInput(
    parsePhase10C0VRadialProtocol(
      phase10C0VS6ParsePrettyJson(input.scienceProtocolBytes, "radial reproof science protocol"),
    ),
  );
  const parsedReference = parsePhase10C0VReferenceEnvelope(
    phase10C0VS6ParsePrettyJson(input.referenceBytes, "radial reproof reference"),
  ) as unknown as ParsedRadialReference;
  const candidateDirectory = authority.preflight.observed.candidateDirectory;
  const evaluationIdentity = identity(`${candidateDirectory}/c0v-radial-evaluation.json`, input.evaluationBytes);
  const cleanWitness = identity(`${candidateDirectory}/c0v-radial-witness.bin`, input.cleanWitnessBytes);
  const cleanProducerSummary = identity(
    `${candidateDirectory}/c0v-radial-producer-summary.json`,
    input.cleanProducerSummaryBytes,
  );
  parseProducerSummary(
    input.cleanProducerSummaryBytes,
    authority.packet.radialProducerSummary,
    "clean radial producer summary",
  );
  const artifacts: Phase10C0VRadialNegativeControlArtifactTuple = Object.freeze([
    Object.freeze({
      negativeControlId: "nc-radial-finite-shell-term",
      artifactKind: "mutated-witness",
      identity: identity(
        `${candidateDirectory}/nc-radial-finite-shell-term-witness.bin`,
        input.finiteShellWitnessBytes,
      ),
      bytes: new Uint8Array(input.finiteShellWitnessBytes),
    }),
    Object.freeze({
      negativeControlId: "nc-radial-forged-summary",
      artifactKind: "mutated-summary",
      identity: identity(`${candidateDirectory}/nc-radial-forged-summary.json`, input.forgedSummaryBytes),
      bytes: new Uint8Array(input.forgedSummaryBytes),
    }),
    Object.freeze({
      negativeControlId: "nc-radial-robin-coefficient",
      artifactKind: "mutated-witness",
      identity: identity(
        `${candidateDirectory}/nc-radial-robin-coefficient-witness.bin`,
        input.robinCoefficientWitnessBytes,
      ),
      bytes: new Uint8Array(input.robinCoefficientWitnessBytes),
    }),
  ]);
  const finite = independentlyReprovePhase10RadialFiniteShellMutation(
    input.cleanWitnessBytes,
    input.finiteShellWitnessBytes,
    scienceProtocol.sha256,
    reference.sha256,
  );
  const forged = independentlyReprovePhase10RadialForgedSummaryMutation(
    input.cleanProducerSummaryBytes,
    input.forgedSummaryBytes,
    authority.packet.radialProducerSummary,
  );
  const robin = independentlyReprovePhase10RadialRobinMutation(
    input.cleanWitnessBytes,
    input.robinCoefficientWitnessBytes,
    scienceProtocol.sha256,
    reference.sha256,
  );
  if (!finite.pass || !forged.pass || !robin.pass) {
    fail(`raw mutation proof failed: ${[
      ...finite.reasonCodes, ...forged.reasonCodes, ...robin.reasonCodes,
    ].join(",")}`);
  }
  const decodedClean = decodeControlWitness(
    input.cleanWitnessBytes,
    scienceProtocol.sha256,
    reference.sha256,
  );
  const cleanChecks = rederiveCleanScienceChecks(
    science,
    parsedReference,
    scienceWitness(decodedClean),
    scienceProtocol,
  );
  const evaluation = parsePhase10C0VS6RadialEvaluationBytes(input.evaluationBytes, authority.packet);
  phase10C0VS6SameIdentity(evaluation.witness, cleanWitness, "radial evaluation clean witness");
  if (evaluation.artifactDisposition !== "valid" || evaluation.negativeControls.some((entry) => !entry.pass)) {
    fail("evaluation does not retain a valid all-controls-passing campaign");
  }
  const expectedControls = Object.freeze([
    Object.freeze({
      negativeControlId: "nc-radial-finite-shell-term",
      mutationExecuted: true,
      witnessMoved: true,
      cleanCapturePreserved: true,
      attackedCheckFailed: true,
      pass: true,
    }),
    Object.freeze({
      negativeControlId: "nc-radial-forged-summary",
      mutationExecuted: true,
      witnessMoved: false,
      cleanCapturePreserved: true,
      attackedCheckFailed: false,
      pass: true,
    }),
    Object.freeze({
      negativeControlId: "nc-radial-robin-coefficient",
      mutationExecuted: true,
      witnessMoved: true,
      cleanCapturePreserved: true,
      attackedCheckFailed: true,
      pass: true,
    }),
  ] as const);
  phase10C0VS6SameJson(evaluation.negativeControls, expectedControls, "radial evaluation control results");
  const expectedAudit = Object.freeze([
    strictJsonSnapshot({
      negativeControlId: "nc-radial-finite-shell-term",
      cleanWitness,
      mutatedWitness: artifacts[0].identity,
      reference,
      fieldMovedCaseIds: finite.fieldMovedCaseIds,
      attackedCheckPass: false,
      cleanEvaluationIdentical: false,
      cleanSummary: null,
      mutatedSummary: null,
    }),
    strictJsonSnapshot({
      negativeControlId: "nc-radial-forged-summary",
      cleanWitness,
      mutatedWitness: cleanWitness,
      reference,
      fieldMovedCaseIds: [],
      attackedCheckPass: true,
      cleanEvaluationIdentical: true,
      cleanSummary: cleanProducerSummary,
      mutatedSummary: artifacts[1].identity,
    }),
    strictJsonSnapshot({
      negativeControlId: "nc-radial-robin-coefficient",
      cleanWitness,
      mutatedWitness: artifacts[2].identity,
      reference,
      fieldMovedCaseIds: robin.fieldMovedCaseIds,
      attackedCheckPass: false,
      cleanEvaluationIdentical: false,
      cleanSummary: null,
      mutatedSummary: null,
    }),
  ] as const);
  exactAudit(evaluation, expectedAudit);
  const expectedNumericalCheck = Object.freeze({
    ...cleanChecks.numericalCheck,
    witnesses: Object.freeze([
      ...cleanChecks.numericalCheck.witnesses,
      strictJsonSnapshot({ negativeControlAudit: expectedAudit }),
    ]),
  });
  const expectedCheckResults = Object.freeze([
    expectedNumericalCheck,
    cleanChecks.referenceCheck,
  ] as const);
  phase10C0VS6SameJson(
    evaluation.checkResults,
    expectedCheckResults,
    "radial clean science check results",
  );
  const expectedNumericalDisposition = expectedCheckResults.every((entry) => entry.pass)
    ? "pass"
    : "fail";
  if (evaluation.numericalDisposition !== expectedNumericalDisposition) {
    fail("radial numerical disposition differs from pure clean-science rederivation");
  }
  const cleanScienceReproof: Phase10C0VRadialCleanScienceReproof = Object.freeze({
    checkResults: expectedCheckResults,
    numericalDisposition: expectedNumericalDisposition,
  });
  return Object.freeze({
    schema: "phase10-c0v-radial-raw-artifact-reproof-v1",
    packetId: "c0v-radial-produce",
    evaluation: evaluationIdentity,
    cleanWitness,
    cleanProducerSummary,
    negativeControlArtifacts: Object.freeze(artifacts.map((entry) => entry.identity)) as readonly [
      Phase10C0VS6ArtifactIdentity,
      Phase10C0VS6ArtifactIdentity,
      Phase10C0VS6ArtifactIdentity,
    ],
    mutationReproofs: Object.freeze([finite, forged, robin] as const),
    cleanScienceReproof,
    negativeControlResults: evaluation.negativeControls,
    numericalDisposition: evaluation.numericalDisposition,
    artifactDisposition: "valid",
    verdict: "pass",
  });
}

export function independentlyReprovePhase10C0VRadialRawArtifacts(
  input: Phase10C0VRadialRawArtifactReproofInput,
): Phase10C0VRadialRawArtifactReproof {
  return reprovePhase10C0VRadialRawArtifactsWithScience(input, null);
}

/** Test-only pure arithmetic surface for a fully in-memory, explicitly synthetic science envelope. */
export function independentlyReprovePhase10C0VRadialRawArtifactsSyntheticFixture(
  input: Phase10C0VRadialRawArtifactReproofInput,
  syntheticScience: Phase10C0VRadialReferenceInput,
): Phase10C0VRadialRawArtifactReproof {
  if (!syntheticScience.protocolId.includes("synthetic") ||
    !input.packetProtocol.path.includes("c0v-radial-produce")) {
    fail("synthetic raw-artifact reproof requires explicit synthetic radial fixture authority");
  }
  return reprovePhase10C0VRadialRawArtifactsWithScience(input, syntheticScience);
}
