import { createHash } from "node:crypto";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  phase10C0VRadialReferenceInput,
  parsePhase10C0VRadialProtocol,
  parsePhase10C0VReferenceEnvelope,
  type Phase10C0VRadialReferenceInput,
} from "./phase10-c0v-contracts.ts";
import type {
  Phase10C0VS6ArtifactIdentity,
  Phase10C0VS6LifecycleCheckContext,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  derivePhase10C0VS6RadialLifecycleAuthority,
  type Phase10C0VS6RadialBinaryLayoutAuthority,
  type Phase10C0VS6RadialPacketAuthority,
  type Phase10C0VS6RetainedPreflight,
} from "./phase10-c0v-s6-contracts.ts";

const MAGIC = "C0VRAD01" as const;
const SCHEMA_ID = "phase10-c0v-radial-witness-v1" as const;
const FORMAT_VERSION = 1 as const;
const ENDIAN_MARKER = 0x01020304 as const;
const HEADER_BYTES = 153 as const;
const PAYLOAD_BYTES = 5_738 as const;
const WITNESS_BYTES = 5_891 as const;
const GLOBAL_FLOAT_ORDER = [
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
const CASE_SCALAR_ORDER = [
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
const CASE_IDS = [
  "radial-dr-0p7um",
  "radial-dr-0p35um",
  "radial-dr-0p175um",
  "radial-dr-0p0875um",
] as const;
const NODE_COUNTS = [21, 40, 80, 159] as const;
const CASE_RECORD_BYTES = [523, 828, 1_469, 2_734] as const;
const METRIC_IDS = [
  "surfaceRelative",
  "velocityRelative",
  "fieldRelativeLInf",
  "fieldWeightedRelativeL2",
  "shellNormalized",
  "uniformNormalizedLInf",
  "robinResidualNormalized",
  "generatorCheckerAgreement",
] as const;
const SHA256 = /^[0-9a-f]{64}$/u;
const textDecoder = new TextDecoder("utf-8", { fatal: true });

export interface Phase10C0VRadialEvaluationInput {
  readonly evaluationId: string;
  readonly packetProtocol: Phase10C0VS6ArtifactIdentity;
  readonly packetProtocolBytes: Uint8Array;
  readonly scienceProtocol: Phase10C0VS6ArtifactIdentity;
  readonly scienceProtocolBytes: Uint8Array;
  readonly referenceOrRefusal: Phase10C0VS6ArtifactIdentity;
  readonly referenceBytes: Uint8Array;
  readonly preflightBytes: Uint8Array;
  readonly witness: Phase10C0VS6ArtifactIdentity;
  readonly witnessBytes: Uint8Array;
  readonly producerSummary: Phase10C0VS6ArtifactIdentity;
  readonly producerSummaryBytes: Uint8Array;
  readonly lifecycle: Phase10C0VS6LifecycleCheckContext;
}

export interface Phase10C0VRadialMetricResult {
  readonly value: number;
  readonly tolerance: number;
  readonly pass: boolean;
}

export interface Phase10C0VRadialCheckResult {
  readonly checkId: string;
  readonly pass: boolean;
  readonly reasonCodes: readonly string[];
  readonly witnesses: readonly StrictJson[];
}

export interface Phase10C0VRadialCaseEvaluation {
  readonly caseId: string;
  readonly exactRoster: boolean;
  readonly scalarRecordCoherent: boolean;
  readonly uniformControlCoherent: boolean;
  readonly uniformKineticTermsExactZero: boolean;
  readonly metrics: Readonly<Record<(typeof METRIC_IDS)[number], Phase10C0VRadialMetricResult>>;
  readonly pass: boolean;
}

export interface Phase10C0VRadialCleanEvaluation {
  readonly evaluationId: string;
  readonly packetProtocol: Phase10C0VS6ArtifactIdentity;
  readonly scienceProtocol: Phase10C0VS6ArtifactIdentity;
  readonly reference: Phase10C0VS6ArtifactIdentity;
  readonly witness: Phase10C0VS6ArtifactIdentity;
  readonly cases: readonly Phase10C0VRadialCaseEvaluation[];
  readonly maxima: Readonly<Record<(typeof METRIC_IDS)[number], Phase10C0VRadialMetricResult>>;
  readonly numericalCheck: Phase10C0VRadialCheckResult;
  readonly referenceIndependenceCheck: Phase10C0VRadialCheckResult;
  readonly preflightAncestryConsistency: Phase10C0VRadialCheckResult;
  readonly preflightResourceConsistency: Phase10C0VRadialCheckResult;
  readonly claimBoundary: {
    readonly allowed: readonly string[];
    readonly forbidden: readonly string[];
  };
  readonly numericalDisposition: "pass" | "fail";
  readonly artifactDisposition: "valid";
}

interface DecodedCase {
  readonly caseId: string;
  readonly nodeCount: number;
  readonly scalars: Readonly<Record<(typeof CASE_SCALAR_ORDER)[number], number>>;
  readonly numericField: readonly number[];
  readonly uniformField: readonly number[];
}

interface DecodedWitness {
  readonly globals: Readonly<Record<(typeof GLOBAL_FLOAT_ORDER)[number], number>>;
  readonly cases: readonly DecodedCase[];
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

type FieldReference = Pick<ReferenceCase, "caseId" | "nodeCount" | "samples">;

interface GeneratorCase {
  readonly caseId: string;
  readonly requestedSpacingM: NumericIdentity;
  readonly actualSpacingM: NumericIdentity;
  readonly nodeCount: number;
  readonly sigmaSurface: NumericIdentity;
  readonly sigmaShell: NumericIdentity;
  readonly surfaceGradientPerM: NumericIdentity;
  readonly growthVelocityFluxMS: NumericIdentity;
  readonly growthVelocityKineticMS: NumericIdentity;
  readonly robinResidual: NumericIdentity;
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
    readonly uniformFieldControl: { readonly cases: readonly (Omit<ReferenceCase, "growthVelocityMS"> & {
      readonly growthVelocityFluxMS: NumericIdentity;
      readonly growthVelocityKineticMS: NumericIdentity;
      readonly robinResidual: NumericIdentity;
    })[] };
  };
  readonly independentCheck: {
    readonly cases: readonly ReferenceCheckCase[];
    readonly maxima: Readonly<Record<(typeof METRIC_IDS)[number], RawMetric>>;
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

function fail(detail: string): never {
  throw new Error(`Phase 10 C0V radial evaluator refused: ${detail}`);
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function sameIdentity(
  actual: Phase10C0VS6ArtifactIdentity,
  expected: Phase10C0VS6ArtifactIdentity,
): boolean {
  return actual.path === expected.path &&
    actual.byteLength === expected.byteLength &&
    actual.sha256 === expected.sha256;
}

function assertBytesIdentity(
  bytes: Uint8Array,
  identity: Phase10C0VS6ArtifactIdentity,
  label: string,
): void {
  if (
    bytes.byteLength !== identity.byteLength ||
    !SHA256.test(identity.sha256) ||
    sha256(bytes) !== identity.sha256
  ) {
    fail(`${label} bytes differ from their identity`);
  }
}

function sameArray(
  actual: readonly (string | number)[],
  expected: readonly (string | number)[],
): boolean {
  return actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
}

function assertLayout(layout: Phase10C0VS6RadialBinaryLayoutAuthority): void {
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
    layout.magic !== MAGIC ||
    layout.formatVersion !== FORMAT_VERSION ||
    layout.endiannessMarker !== ENDIAN_MARKER ||
    layout.schemaId !== SCHEMA_ID ||
    layout.schemaByteLength !== 29 ||
    layout.headerByteLength !== HEADER_BYTES ||
    layout.payloadByteLength !== PAYLOAD_BYTES ||
    layout.fileByteLength !== WITNESS_BYTES ||
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
    !sameArray(layout.globalFloatNames, GLOBAL_FLOAT_ORDER) ||
    !sameArray(layout.caseScalarNames, CASE_SCALAR_ORDER) ||
    !sameArray(layout.caseOrder, CASE_IDS) ||
    !sameArray(layout.caseNodeCounts, NODE_COUNTS) ||
    !sameArray(layout.caseRecordByteLengths, CASE_RECORD_BYTES)
  ) {
    fail("layout differs from the independently spelled 5,891-byte decoder contract");
  }
}

function bytesHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

class BinaryReader {
  readonly bytes: Uint8Array;
  readonly view: DataView;
  offset = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  private requireAvailableBytes(length: number): void {
    if (!Number.isSafeInteger(length) || length < 0 || this.offset + length > this.bytes.byteLength) {
      fail("binary witness is truncated");
    }
  }

  readBytes(length: number): Uint8Array {
    this.requireAvailableBytes(length);
    const result = this.bytes.slice(this.offset, this.offset + length);
    this.offset += length;
    return result;
  }

  readU32(): number {
    this.requireAvailableBytes(4);
    const result = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return result;
  }

  readU64(): number {
    this.requireAvailableBytes(8);
    const raw = this.view.getBigUint64(this.offset, true);
    this.offset += 8;
    if (raw > BigInt(Number.MAX_SAFE_INTEGER)) fail("binary u64 exceeds the safe-integer range");
    return Number(raw);
  }

  readF64(label: string): number {
    this.requireAvailableBytes(8);
    const result = this.view.getFloat64(this.offset, true);
    this.offset += 8;
    if (!Number.isFinite(result) || Object.is(result, -0)) {
      fail(`${label} is non-finite or negative zero`);
    }
    return result === 0 ? 0 : result;
  }
}

function decodeWitness(
  input: Phase10C0VRadialEvaluationInput,
  layout: Phase10C0VS6RadialBinaryLayoutAuthority,
): DecodedWitness {
  assertLayout(layout);
  assertBytesIdentity(input.witnessBytes, input.witness, "witness");
  if (input.witnessBytes.byteLength !== WITNESS_BYTES) fail("witness byte length is not 5,891");
  const reader = new BinaryReader(input.witnessBytes);
  if (textDecoder.decode(reader.readBytes(8)) !== MAGIC) fail("witness magic differs");
  if (reader.readU32() !== FORMAT_VERSION) fail("witness format version differs");
  if (reader.readU32() !== ENDIAN_MARKER) fail("witness endian marker differs");
  const schemaLength = reader.readU32();
  if (schemaLength !== 29 || textDecoder.decode(reader.readBytes(schemaLength)) !== SCHEMA_ID) {
    fail("witness schema identity differs");
  }
  if (bytesHex(reader.readBytes(32)) !== input.scienceProtocol.sha256) {
    fail("witness science-protocol digest differs");
  }
  if (bytesHex(reader.readBytes(32)) !== input.referenceOrRefusal.sha256) {
    fail("witness reference digest differs");
  }
  const payloadLength = reader.readU64();
  if (payloadLength !== PAYLOAD_BYTES) fail("witness payload byte length differs");
  const expectedPayloadSha = bytesHex(reader.readBytes(32));
  if (reader.offset !== HEADER_BYTES) fail("witness header length differs");
  const payload = reader.readBytes(payloadLength);
  if (sha256(payload) !== expectedPayloadSha) fail("witness payload digest differs");
  if (Number(reader.offset) !== input.witnessBytes.byteLength) fail("witness has trailing bytes");

  const payloadReader = new BinaryReader(payload);
  if (payloadReader.readU32() !== 4) fail("payload case count differs");
  if (payloadReader.readU32() !== GLOBAL_FLOAT_ORDER.length) fail("payload global-float count differs");
  const globalEntries = GLOBAL_FLOAT_ORDER.map((name) => [name, payloadReader.readF64(`global.${name}`)] as const);
  const globals = Object.freeze(Object.fromEntries(globalEntries)) as DecodedWitness["globals"];
  const cases: DecodedCase[] = [];
  for (let caseIndex = 0; caseIndex < 4; caseIndex++) {
    const recordStart = payloadReader.offset;
    const idLength = payloadReader.readU32();
    const caseId = textDecoder.decode(payloadReader.readBytes(idLength));
    if (caseId !== CASE_IDS[caseIndex]) fail(`case ${caseIndex} ID differs`);
    const nodeCount = payloadReader.readU32();
    if (nodeCount !== NODE_COUNTS[caseIndex]) fail(`${caseId} node count differs`);
    if (payloadReader.readU32() !== CASE_SCALAR_ORDER.length) fail(`${caseId} scalar count differs`);
    const scalarEntries = CASE_SCALAR_ORDER.map((name) =>
      [name, payloadReader.readF64(`${caseId}.${name}`)] as const);
    const scalars = Object.freeze(Object.fromEntries(scalarEntries)) as DecodedCase["scalars"];
    const numericCount = payloadReader.readU64();
    if (numericCount !== nodeCount) fail(`${caseId} numeric field count differs`);
    const numericField = Object.freeze(Array.from({ length: numericCount }, (_, index) =>
      payloadReader.readF64(`${caseId}.numericField[${index}]`)));
    const uniformCount = payloadReader.readU64();
    if (uniformCount !== nodeCount) fail(`${caseId} uniform field count differs`);
    const uniformField = Object.freeze(Array.from({ length: uniformCount }, (_, index) =>
      payloadReader.readF64(`${caseId}.uniformField[${index}]`)));
    if (payloadReader.offset - recordStart !== CASE_RECORD_BYTES[caseIndex]) {
      fail(`${caseId} record byte length differs`);
    }
    cases.push(Object.freeze({ caseId, nodeCount, scalars, numericField, uniformField }));
  }
  if (payloadReader.offset !== payload.byteLength) fail("payload has padding or trailing bytes");
  return Object.freeze({ globals, cases: Object.freeze(cases) });
}

function parsePrettyJson(bytes: Uint8Array, label: string): StrictJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(textDecoder.decode(bytes)) as unknown;
  } catch (error) {
    fail(`${label} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  const snapshot = strictJsonSnapshot(parsed);
  const canonical = new TextEncoder().encode(`${JSON.stringify(snapshot, null, 2)}\n`);
  if (
    canonical.byteLength !== bytes.byteLength ||
    canonical.some((value, index) => value !== bytes[index])
  ) {
    fail(`${label} is not exact pretty-2 JSON plus LF`);
  }
  return snapshot;
}

function inventoryProducerSummary(bytes: Uint8Array): void {
  const parsed = parsePrettyJson(bytes, "producer summary inventory");
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    fail("producer summary inventory is not an object");
  }
  const row = parsed as { readonly [key: string]: StrictJson };
  const expectedKeys = [
    "schema",
    "authority",
    "caseCount",
    "totalNumericFieldValues",
    "totalUniformFieldValues",
    "allFinite",
    "reportedDisposition",
    "reportedMaximum",
  ] as const;
  const actualKeys = Object.keys(row);
  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some((key, index) => key !== expectedKeys[index])
  ) fail("producer summary inventory fields/order differ");
  if (
    row.schema !== "phase10-c0v-radial-producer-summary-v1" ||
    row.authority !== "non-authoritative" ||
    row.caseCount !== 4 ||
    row.totalNumericFieldValues !== 300 ||
    row.totalUniformFieldValues !== 300 ||
    typeof row.allFinite !== "boolean" ||
    (row.reportedDisposition !== "pass" && row.reportedDisposition !== "fail") ||
    typeof row.reportedMaximum !== "number" ||
    !Number.isFinite(row.reportedMaximum) ||
    row.reportedMaximum < 0 ||
    Object.is(row.reportedMaximum, -0)
  ) fail("producer summary inventory shape differs");
}

function parseReference(input: Phase10C0VRadialEvaluationInput): ParsedRadialReference {
  assertBytesIdentity(input.referenceBytes, input.referenceOrRefusal, "reference");
  const parsed = parsePhase10C0VReferenceEnvelope(
    parsePrettyJson(input.referenceBytes, "radial reference"),
  );
  if (
    parsed.layerId !== "C0V-RADIAL" ||
    parsed.schema !== "phase10-c0v-radial-reference-v1" ||
    parsed.branch !== "independent-reference"
  ) {
    fail("reference is not the radial independent-reference artifact");
  }
  return parsed as unknown as ParsedRadialReference;
}

function numericIdentity(value: NumericIdentity, label: string): number {
  if (!/^[0-9a-f]{16}$/u.test(value.binary64Hex)) fail(`${label} binary64 identity differs`);
  const bytes = Uint8Array.from(Buffer.from(value.binary64Hex, "hex"));
  const decoded = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getFloat64(0, false);
  const decimal = Number(value.decimal);
  if (
    !Number.isFinite(decoded) ||
    !Number.isFinite(decimal) ||
    Object.is(decoded, -0) ||
    !Object.is(decoded, decimal)
  ) {
    fail(`${label} decimal/binary64 identity differs`);
  }
  return decoded === 0 ? 0 : decoded;
}

function relativeDifference(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.max(Math.abs(expected), Number.MIN_VALUE);
}

function metric(value: number, tolerance: number): Phase10C0VRadialMetricResult {
  const normalized = value === 0 ? 0 : value;
  if (!Number.isFinite(normalized) || normalized < 0 || !Number.isFinite(tolerance) || tolerance < 0) {
    fail("metric or tolerance is invalid");
  }
  return Object.freeze({ value: normalized, tolerance, pass: normalized <= tolerance });
}

function expectedGlobals(science: Phase10C0VRadialReferenceInput): readonly number[] {
  const operands = science.operands;
  const constants = operands.physicalConstants;
  const temperatureK = operands.tempC + constants.celsiusZeroK;
  const saturationPressurePa = constants.saturationPressurePrefactorMbar *
    Math.exp(constants.saturationPressureExponentK / temperatureK) *
    constants.mbarToPa;
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
    operands.radiusM,
    operands.farRadiusM,
    operands.sigmaInfinity,
    operands.tempC,
    operands.pressurePa,
    operands.alphaHKConst,
    constants.kBoltzmannJPerK,
    constants.celsiusZeroK,
    constants.waterMoleculeMassKg,
    constants.iceNumberDensityPerM3,
    constants.diffusivityAir1AtmM2S,
    constants.standardAtmospherePa,
    constants.saturationPressurePrefactorMbar,
    constants.saturationPressureExponentK,
    constants.mbarToPa,
    temperatureK,
    saturationPressurePa,
    saturationNumberDensityPerM3,
    diffusivityM2S,
    thermalSpeedMS,
    kineticVelocityMS,
    kineticLengthM,
  ]);
}

function referenceFieldMetrics(
  observed: readonly number[],
  reference: FieldReference,
  actualSpacingM: number,
): { readonly lInf: number; readonly weightedL2: number; readonly radiiExact: boolean } {
  if (observed.length !== reference.samples.length || observed.length !== reference.nodeCount) {
    return Object.freeze({ lInf: Infinity, weightedL2: Infinity, radiiExact: false });
  }
  let maxError = 0;
  let maxReference = 0;
  let weightedErrorSquared = 0;
  let weightedReferenceSquared = 0;
  let radiiExact = true;
  for (const [index, sample] of reference.samples.entries()) {
    if (sample.nodeIndex !== index) radiiExact = false;
    const radiusM = numericIdentity(sample.radiusM, `${reference.caseId}.reference.radius[${index}]`);
    const expectedRadiusM = numericIdentity(reference.samples[0]!.radiusM, `${reference.caseId}.reference.radius[0]`) +
      index * actualSpacingM;
    radiiExact &&= Object.is(radiusM, expectedRadiusM);
    const expectedSigma = numericIdentity(sample.sigma, `${reference.caseId}.reference.sigma[${index}]`);
    const error = observed[index]! - expectedSigma;
    const endpointFactor = index === 0 || index === observed.length - 1 ? 0.5 : 1;
    const weight = endpointFactor * radiusM * radiusM * actualSpacingM;
    maxError = Math.max(maxError, Math.abs(error));
    maxReference = Math.max(maxReference, Math.abs(expectedSigma));
    weightedErrorSquared += weight * error * error;
    weightedReferenceSquared += weight * expectedSigma * expectedSigma;
  }
  return Object.freeze({
    lInf: maxError / Math.max(maxReference, Number.MIN_VALUE),
    weightedL2: Math.sqrt(weightedErrorSquared / Math.max(weightedReferenceSquared, Number.MIN_VALUE)),
    radiiExact,
  });
}

function fieldGradient(field: readonly number[], radiusM: number, spacingM: number): number {
  if (field.length < 3) fail("field has fewer than three nodes");
  const u0 = radiusM * field[0]!;
  const u1 = (radiusM + spacingM) * field[1]!;
  const u2 = (radiusM + 2 * spacingM) * field[2]!;
  const uPrime = (-3 * u0 + 4 * u1 - u2) / (2 * spacingM);
  return uPrime / radiusM - u0 / (radiusM * radiusM);
}

function evaluateCase(
  science: Phase10C0VRadialReferenceInput,
  decoded: DecodedCase,
  reference: ReferenceCheckCase,
  caseIndex: number,
): Phase10C0VRadialCaseEvaluation {
  const roster = science.roster[caseIndex]!;
  const scalars = decoded.scalars;
  const independent = reference.independent;
  const independentUniform = reference.independentUniformFieldControl;
  const exactRoster = decoded.caseId === roster.caseId &&
    decoded.nodeCount === roster.expectedNodeCount &&
    Object.is(scalars.requestedSpacingM, roster.requestedSpacingM) &&
    Object.is(scalars.actualSpacingM, roster.expectedActualSpacingM) &&
    Object.is(scalars.requestedSpacingM, numericIdentity(independent.requestedSpacingM, `${decoded.caseId}.reference requested spacing`)) &&
    Object.is(scalars.actualSpacingM, numericIdentity(independent.actualSpacingM, `${decoded.caseId}.reference actual spacing`));

  const referenceSurface = numericIdentity(independent.sigmaSurface, `${decoded.caseId}.reference surface`);
  const referenceVelocity = numericIdentity(independent.growthVelocityMS, `${decoded.caseId}.reference velocity`);
  const numericFields = referenceFieldMetrics(decoded.numericField, independent, scalars.actualSpacingM);
  const uniformFields = referenceFieldMetrics(
    decoded.uniformField,
    independentUniform,
    scalars.actualSpacingM,
  );
  const gradient = fieldGradient(decoded.numericField, science.operands.radiusM, scalars.actualSpacingM);
  const uniformGradient = fieldGradient(
    decoded.uniformField,
    science.operands.radiusM,
    scalars.actualSpacingM,
  );
  const derived = expectedGlobals(science);
  const saturationNumberDensityPerM3 = derived[17]!;
  const diffusivityM2S = derived[18]!;
  const kineticVelocityMS = derived[20]!;
  const kineticLengthM = derived[21]!;
  const expectedFlux =
    (saturationNumberDensityPerM3 / science.operands.physicalConstants.iceNumberDensityPerM3) *
    diffusivityM2S * gradient;
  const expectedKinetic = science.operands.alphaHKConst * kineticVelocityMS * scalars.sigmaSurface;
  const expectedRobinLeft = kineticLengthM * gradient;
  const expectedRobinRight = science.operands.alphaHKConst * scalars.sigmaSurface;
  const expectedRobinResidual = expectedRobinLeft - expectedRobinRight;
  const expectedUniformKinetic = 0 * kineticVelocityMS * scalars.uniformSigmaSurface;
  const expectedUniformFlux =
    (saturationNumberDensityPerM3 / science.operands.physicalConstants.iceNumberDensityPerM3) *
    diffusivityM2S * uniformGradient;
  const expectedUniformRobinLeft = kineticLengthM * uniformGradient;
  const expectedUniformRobinRight = 0 * scalars.uniformSigmaSurface;
  const expectedUniformRobinResidual = expectedUniformRobinLeft - expectedUniformRobinRight;
  const coherenceTolerance = science.tolerances.generatorCheckerAgreement;
  const scalarRecordCoherent =
    Object.is(scalars.sigmaSurface, decoded.numericField[0]) &&
    Object.is(scalars.sigmaShell, decoded.numericField.at(-1)) &&
    Object.is(scalars.uniformSigmaSurface, decoded.uniformField[0]) &&
    Object.is(scalars.uniformSigmaShell, decoded.uniformField.at(-1)) &&
    relativeDifference(scalars.surfaceGradientPerM, gradient) <= coherenceTolerance &&
    relativeDifference(scalars.growthVelocityFluxMS, expectedFlux) <= coherenceTolerance &&
    relativeDifference(scalars.growthVelocityKineticMS, expectedKinetic) <= coherenceTolerance &&
    relativeDifference(scalars.robinLeft, expectedRobinLeft) <= coherenceTolerance &&
    relativeDifference(scalars.robinRight, expectedRobinRight) <= coherenceTolerance &&
    Math.abs(scalars.robinResidual - expectedRobinResidual) /
      Math.max(Math.abs(expectedRobinLeft), Math.abs(expectedRobinRight), Number.MIN_VALUE) <= coherenceTolerance;
  const uniformControlCoherent =
    relativeDifference(scalars.uniformSurfaceGradientPerM, uniformGradient) <= coherenceTolerance &&
    relativeDifference(scalars.uniformGrowthVelocityKineticMS, expectedUniformKinetic) <= coherenceTolerance &&
    relativeDifference(scalars.uniformGrowthVelocityFluxMS, expectedUniformFlux) <= coherenceTolerance &&
    relativeDifference(scalars.uniformRobinLeft, expectedUniformRobinLeft) <= coherenceTolerance &&
    Object.is(scalars.uniformRobinRight, expectedUniformRobinRight) &&
    Math.abs(scalars.uniformRobinResidual - expectedUniformRobinResidual) /
      Math.max(
        Math.abs(expectedUniformRobinLeft),
        Math.abs(expectedUniformRobinRight),
        Number.MIN_VALUE,
      ) <= coherenceTolerance;
  const uniformKineticTermsExactZero =
    Object.is(scalars.uniformGrowthVelocityKineticMS, 0) &&
    Object.is(scalars.uniformRobinRight, 0);

  const surfaceRelative = relativeDifference(scalars.sigmaSurface, referenceSurface);
  const velocityRelative = Math.max(
    relativeDifference(scalars.growthVelocityKineticMS, referenceVelocity),
    relativeDifference(scalars.growthVelocityFluxMS, referenceVelocity),
  );
  const shellNormalized = Math.abs(scalars.sigmaShell - science.operands.sigmaInfinity) /
    Math.max(Math.abs(science.operands.sigmaInfinity), Number.MIN_VALUE);
  const uniformNormalizedLInf = Math.max(...decoded.uniformField.map((value) =>
    Math.abs(value - science.operands.sigmaInfinity))) /
    Math.max(Math.abs(science.operands.sigmaInfinity), Number.MIN_VALUE);
  const robinResidualNormalized = Math.abs(scalars.robinResidual) /
    Math.max(Math.abs(scalars.robinLeft), Math.abs(scalars.robinRight), Number.MIN_VALUE);
  const generatorCheckerAgreement = Math.max(
    surfaceRelative,
    velocityRelative,
    numericFields.lInf,
    numericFields.weightedL2,
  );
  const metrics = Object.freeze({
    surfaceRelative: metric(surfaceRelative, science.tolerances.surfaceRelative),
    velocityRelative: metric(velocityRelative, science.tolerances.velocityRelative),
    fieldRelativeLInf: metric(numericFields.lInf, science.tolerances.fieldRelativeLInf),
    fieldWeightedRelativeL2: metric(
      numericFields.weightedL2,
      science.tolerances.fieldWeightedRelativeL2,
    ),
    shellNormalized: metric(shellNormalized, science.tolerances.shellNormalized),
    uniformNormalizedLInf: metric(
      uniformNormalizedLInf,
      science.tolerances.uniformNormalizedLInf,
    ),
    robinResidualNormalized: metric(
      robinResidualNormalized,
      science.tolerances.robinResidualNormalized,
    ),
    generatorCheckerAgreement: metric(
      generatorCheckerAgreement,
      science.tolerances.generatorCheckerAgreement,
    ),
  });
  const pass = exactRoster &&
    scalarRecordCoherent &&
    uniformControlCoherent &&
    uniformKineticTermsExactZero &&
    numericFields.radiiExact &&
    uniformFields.radiiExact &&
    METRIC_IDS.every((metricId) => metrics[metricId].pass);
  return Object.freeze({
    caseId: decoded.caseId,
    exactRoster,
    scalarRecordCoherent,
    uniformControlCoherent,
    uniformKineticTermsExactZero,
    metrics,
    pass,
  });
}

function maxima(
  science: Phase10C0VRadialReferenceInput,
  cases: readonly Phase10C0VRadialCaseEvaluation[],
): Phase10C0VRadialCleanEvaluation["maxima"] {
  const toleranceByMetric: Readonly<Record<(typeof METRIC_IDS)[number], number>> = Object.freeze({
    surfaceRelative: science.tolerances.surfaceRelative,
    velocityRelative: science.tolerances.velocityRelative,
    fieldRelativeLInf: science.tolerances.fieldRelativeLInf,
    fieldWeightedRelativeL2: science.tolerances.fieldWeightedRelativeL2,
    shellNormalized: science.tolerances.shellNormalized,
    uniformNormalizedLInf: science.tolerances.uniformNormalizedLInf,
    robinResidualNormalized: science.tolerances.robinResidualNormalized,
    generatorCheckerAgreement: science.tolerances.generatorCheckerAgreement,
  });
  return Object.freeze(Object.fromEntries(METRIC_IDS.map((metricId) => [
    metricId,
    metric(Math.max(...cases.map((entry) => entry.metrics[metricId].value)), toleranceByMetric[metricId]),
  ]))) as Phase10C0VRadialCleanEvaluation["maxima"];
}

function independentlyAuditReference(
  science: Phase10C0VRadialReferenceInput,
  parsed: ParsedRadialReference,
  scienceProtocol: Phase10C0VS6ArtifactIdentity,
): { readonly pass: boolean; readonly maximumAgreement: number; readonly reasonCodes: readonly string[] } {
  const reasons: string[] = [];
  if (parsed.disposition !== "reference-frozen") reasons.push("reference-disposition-not-frozen");
  if (
    parsed.comparison.expectedOutcome !== "pass" ||
    parsed.comparison.observedOutcome !== "pass" ||
    parsed.comparison.errors.length !== 0
  ) reasons.push("reference-comparison-not-pass");
  if (!sameIdentity(parsed.protocol, scienceProtocol)) reasons.push("reference-protocol-identity-differs");
  if (!sameIdentity(parsed.codeAndImportReceipt.freezePreflight.protocol, scienceProtocol)) {
    reasons.push("reference-freeze-protocol-identity-differs");
  }
  if (
    parsed.codeAndImportReceipt.pass !== true ||
    parsed.codeAndImportReceipt.forbiddenImportsObserved.length !== 0 ||
    parsed.codeAndImportReceipt.generatorCheckerScientificImportOverlap.length !== 0
  ) reasons.push("reference-code-import-receipt-not-pass");
  if (!parsed.independentCheck.pass || !parsed.independentCheck.allFinite || parsed.independentCheck.errors.length !== 0) {
    reasons.push("reference-independent-check-not-pass");
  }
  if (
    parsed.generatorOutput.cases.length !== 4 ||
    parsed.generatorOutput.uniformFieldControl.cases.length !== 4 ||
    parsed.independentCheck.cases.length !== 4
  ) reasons.push("reference-case-roster-differs");

  let maximumAgreement = 0;
  for (let index = 0; index < Math.min(4, parsed.independentCheck.cases.length); index++) {
    const checked = parsed.independentCheck.cases[index]!;
    const generated = parsed.generatorOutput.cases[index]!;
    const generatedUniform = parsed.generatorOutput.uniformFieldControl.cases[index]!;
    if (
      checked.caseId !== science.roster[index]!.caseId ||
      generated.caseId !== checked.caseId ||
      generatedUniform.caseId !== checked.caseId ||
      !checked.exactRoster ||
      !checked.exactUniformZeroRates ||
      !checked.pass ||
      checked.errors.length !== 0
    ) reasons.push(`reference-case-${index}-status-differs`);
    const reference = checked.independent;
    const surface = relativeDifference(
      numericIdentity(generated.sigmaSurface, `reference.generator.case${index}.surface`),
      numericIdentity(reference.sigmaSurface, `reference.checker.case${index}.surface`),
    );
    const referenceVelocity = numericIdentity(
      reference.growthVelocityMS,
      `reference.checker.case${index}.velocity`,
    );
    const velocity = Math.max(
      relativeDifference(
        numericIdentity(generated.growthVelocityFluxMS, `reference.generator.case${index}.flux`),
        referenceVelocity,
      ),
      relativeDifference(
        numericIdentity(generated.growthVelocityKineticMS, `reference.generator.case${index}.kinetic`),
        referenceVelocity,
      ),
    );
    const generatedField = generated.samples.map((sample) =>
      numericIdentity(sample.sigma, `reference.generator.case${index}.field`));
    const fields = referenceFieldMetrics(
      generatedField,
      reference,
      numericIdentity(reference.actualSpacingM, `reference.checker.case${index}.spacing`),
    );
    const agreement = Math.max(surface, velocity, fields.lInf, fields.weightedL2);
    maximumAgreement = Math.max(maximumAgreement, agreement);
    const recordedAgreement = numericIdentity(
      checked.metrics.generatorCheckerAgreement.value,
      `reference.checker.case${index}.recordedAgreement`,
    );
    if (
      recordedAgreement > science.tolerances.generatorCheckerAgreement ||
      checked.metrics.generatorCheckerAgreement.pass !==
        (recordedAgreement <= science.tolerances.generatorCheckerAgreement)
    ) {
      reasons.push(`reference-case-${index}-recorded-agreement-fails`);
    }
    for (const metricId of METRIC_IDS) {
      const recordedTolerance = numericIdentity(
        checked.metrics[metricId].tolerance,
        `reference.checker.case${index}.${metricId}.tolerance`,
      );
      const expectedTolerance = metricId === "generatorCheckerAgreement"
        ? science.tolerances.generatorCheckerAgreement
        : science.tolerances[metricId];
      if (!Object.is(recordedTolerance, expectedTolerance)) {
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

function checkResult(
  checkId: string,
  pass: boolean,
  reasonCodes: readonly string[],
  witnesses: readonly StrictJson[],
): Phase10C0VRadialCheckResult {
  return Object.freeze({
    checkId,
    pass,
    reasonCodes: Object.freeze([...new Set(reasonCodes)].sort()),
    witnesses: Object.freeze(witnesses.map((value) => strictJsonSnapshot(value))),
  });
}

function sameStringArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function deriveArtifactAuthority(input: Phase10C0VRadialEvaluationInput): Readonly<{
  packet: Phase10C0VS6RadialPacketAuthority;
  preflight: Phase10C0VS6RetainedPreflight;
}> {
  const derived = derivePhase10C0VS6RadialLifecycleAuthority(
    input.packetProtocol,
    input.packetProtocolBytes,
    input.preflightBytes,
  );
  if (derived.preflight.verdict !== "pass" || derived.preflight.refusalCandidate !== null) {
    fail("radial science evaluation requires the exact passing retained preflight");
  }
  const scienceProtocol = derived.packet.bindings.scienceProtocol;
  const referenceOrRefusal = derived.packet.bindings.referenceOrRefusal;
  if (scienceProtocol === null || referenceOrRefusal === null) {
    fail("radial packet lacks its science-protocol or reference binding");
  }
  if (!sameIdentity(scienceProtocol, input.scienceProtocol)) {
    fail("supplied science-protocol identity differs from raw packet authority");
  }
  if (!sameIdentity(referenceOrRefusal, input.referenceOrRefusal)) {
    fail("supplied reference identity differs from raw packet authority");
  }
  const requiredScienceChecks = [
    "chk-c0v-radial-numeric",
    "chk-c0v-radial-reference-independence",
  ] as const;
  if (requiredScienceChecks.some((checkId) =>
    derived.packet.registeredCheckIds.filter((candidate) => candidate === checkId).length !== 1)) {
    fail("raw packet does not register each radial science-owned check exactly once");
  }
  if (derived.packet.claimBoundary.forbidden.length === 0 ||
    new Set(derived.packet.claimBoundary.forbidden).size !== derived.packet.claimBoundary.forbidden.length) {
    fail("raw packet claim boundary lacks nonempty unique forbidden claims");
  }
  assertLayout(derived.packet.radialBinaryLayout);
  return derived;
}

function evaluatePreflightAncestryConsistency(
  input: Phase10C0VRadialEvaluationInput,
  packet: Phase10C0VS6RadialPacketAuthority,
  preflight: Phase10C0VS6RetainedPreflight,
): Phase10C0VRadialCheckResult {
  const context = input.lifecycle;
  const observed = preflight.observed;
  const reasons: string[] = [];
  if (context.packetId !== packet.packetId || context.packetId !== preflight.packetId) {
    reasons.push("packet-id-differs");
  }
  if (context.attemptId !== preflight.attemptId) reasons.push("attempt-id-differs");
  if (context.executionMode !== packet.executionMode || context.executionMode !== observed.executionMode) {
    reasons.push("execution-mode-differs");
  }
  if (context.selectedRoute !== packet.selectedRouteId || context.selectedRoute !== observed.selectedRouteId) {
    reasons.push("selected-route-differs");
  }
  if (context.runtime !== packet.resources.requiredRuntime || context.runtime !== observed.runtime) {
    reasons.push("runtime-differs");
  }
  if (context.command !== observed.command) reasons.push("command-differs");
  if (context.gitHead !== observed.head) {
    reasons.push("git-head-differs");
  }
  if (!sameIdentity(context.packetProtocol, input.packetProtocol) ||
    !sameIdentity(context.packetProtocol, observed.packetProtocol)) {
    reasons.push("lifecycle-packet-protocol-identity-differs");
  }
  if (!sameIdentity(context.scienceProtocol, input.scienceProtocol) ||
    observed.scienceProtocol === null || !sameIdentity(context.scienceProtocol, observed.scienceProtocol)) {
    reasons.push("lifecycle-science-protocol-identity-differs");
  }
  if (!sameIdentity(context.referenceOrRefusal, input.referenceOrRefusal) ||
    observed.referenceOrRefusal === null ||
    !sameIdentity(context.referenceOrRefusal, observed.referenceOrRefusal)) {
    reasons.push("lifecycle-reference-identity-differs");
  }
  if (!sameIdentity(context.preflight, {
    path: context.preflight.path,
    byteLength: input.preflightBytes.byteLength,
    sha256: sha256(input.preflightBytes),
  })) {
    reasons.push("lifecycle-preflight-identity-differs");
  }
  if (context.preflight.path !== packet.paths.preflightReceiptPath ||
    context.preflight.path !== observed.finalPreflightReceiptPath) {
    reasons.push("lifecycle-preflight-path-differs");
  }
  if (!sameStringArray(context.boundDependencyPacketIds, packet.boundDependencyPacketIds) ||
    !sameStringArray(context.boundDependencyPacketIds, observed.dependencyPacketIds)) {
    reasons.push("bound-dependency-packets-differ");
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(context.attemptId)) reasons.push("attempt-id-unsafe");
  if (!/^[0-9a-f]{40}$/u.test(context.gitHead)) reasons.push("git-head-malformed");
  if (context.command.length === 0) reasons.push("command-empty");
  return checkResult(
    "internal-c0v-radial-preflight-ancestry-consistency",
    reasons.length === 0,
    reasons,
    [{
      packetId: context.packetId,
      executionMode: context.executionMode,
      selectedRoute: context.selectedRoute,
      runtime: context.runtime,
      packetProtocol: context.packetProtocol,
      scienceProtocol: context.scienceProtocol,
      reference: input.referenceOrRefusal,
      preflight: context.preflight,
      boundDependencyPacketIds: context.boundDependencyPacketIds,
      observedAncestry: observed.ancestry,
      codeFreeze: observed.codeFreeze,
      packetAncestryAuthority: packet.ancestryAuthority,
    } as unknown as StrictJson],
  );
}

function evaluatePreflightResourceConsistency(
  input: Phase10C0VRadialEvaluationInput,
  packet: Phase10C0VS6RadialPacketAuthority,
  preflight: Phase10C0VS6RetainedPreflight,
): Phase10C0VRadialCheckResult {
  const observed = input.lifecycle.resource;
  const registered = packet.resources;
  const retainedPreflight = preflight.observed.resources;
  const reasons: string[] = [];
  if (observed.maxWallSeconds !== registered.solverWorkerTimeoutSeconds) reasons.push("wall-cap-differs");
  if (observed.processConcurrency !== registered.processConcurrency ||
    observed.processConcurrency !== registered.solverProcessConcurrency) {
    reasons.push("process-concurrency-differs");
  }
  if (observed.projectedScratchBytes !== registered.projectedScratchBytes) {
    reasons.push("projected-scratch-cap-differs");
  }
  if (observed.projectedPublicationBytes !== registered.projectedPublicationBytes) {
    reasons.push("projected-publication-cap-differs");
  }
  if (observed.minimumFreeBytes !== registered.minimumFreeBytes) {
    reasons.push("minimum-free-bytes-differs");
  }
  if (observed.observedFreeBytes !== retainedPreflight.observedFreeBytes) {
    reasons.push("observed-free-bytes-differ");
  }
  if (observed.observedFreeBytes < registered.minimumFreeBytes) {
    reasons.push("observed-free-bytes-below-minimum");
  }
  if (registered.automaticRetry !== false || registered.automaticRefinementOrFanOut !== false) {
    reasons.push("automatic-refinement-or-fan-out-enabled");
  }
  if (input.witnessBytes.byteLength > registered.projectedScratchBytes) {
    reasons.push("witness-exceeds-projected-scratch");
  }
  if (input.witnessBytes.byteLength > registered.projectedPublicationBytes) {
    reasons.push("witness-exceeds-projected-publication");
  }
  return checkResult(
    "internal-c0v-radial-preflight-resource-consistency",
    reasons.length === 0,
    reasons,
    [{
      registered,
      observed,
      retainedPreflight,
      witnessByteLength: input.witnessBytes.byteLength,
    } as unknown as StrictJson],
  );
}

function evaluatePhase10C0VRadialWithScience(
  input: Phase10C0VRadialEvaluationInput,
  science: Phase10C0VRadialReferenceInput,
): Phase10C0VRadialCleanEvaluation {
  if (!/^[a-z0-9][a-z0-9.-]*$/u.test(input.evaluationId)) fail("evaluation ID is unsafe");
  const authority = deriveArtifactAuthority(input);
  assertBytesIdentity(input.packetProtocolBytes, input.packetProtocol, "packet protocol");
  assertBytesIdentity(input.scienceProtocolBytes, input.scienceProtocol, "science protocol");
  assertBytesIdentity(input.referenceBytes, input.referenceOrRefusal, "reference");
  assertBytesIdentity(input.preflightBytes, input.lifecycle.preflight, "preflight");
  assertBytesIdentity(input.producerSummaryBytes, input.producerSummary, "producer summary inventory");
  inventoryProducerSummary(input.producerSummaryBytes);
  const decoded = decodeWitness(input, authority.packet.radialBinaryLayout);
  const parsedReference = parseReference(input);
  const expected = expectedGlobals(science);
  const exactGlobalEcho = GLOBAL_FLOAT_ORDER.every((name, index) =>
    Object.is(decoded.globals[name], expected[index]));
  const referenceAudit = independentlyAuditReference(
    science,
    parsedReference,
    input.scienceProtocol,
  );
  const caseEvaluations = Object.freeze(decoded.cases.map((entry, index) =>
    evaluateCase(science, entry, parsedReference.independentCheck.cases[index]!, index)));
  const maximumMetrics = maxima(science, caseEvaluations);
  const numericalPass = exactGlobalEcho &&
    referenceAudit.pass &&
    caseEvaluations.every((entry) => entry.pass) &&
    METRIC_IDS.every((metricId) => maximumMetrics[metricId].pass);
  const numericalReasons = [
    ...(exactGlobalEcho ? [] : ["witness-global-operand-or-derived-scale-differs"]),
    ...(referenceAudit.pass ? [] : ["reference-independence-audit-fails"]),
    ...caseEvaluations.filter((entry) => !entry.pass).map((entry) => `${entry.caseId}-fails`),
  ].sort();
  const numericalCheck = checkResult(
    "chk-c0v-radial-numeric",
    numericalPass,
    numericalReasons,
    [{
      exactGlobalEcho,
      cases: caseEvaluations,
      maxima: maximumMetrics,
    } as unknown as StrictJson],
  );
  const referenceIndependenceCheck = checkResult(
    "chk-c0v-radial-reference-independence",
    referenceAudit.pass,
    referenceAudit.reasonCodes,
    [{
      referenceDisposition: parsedReference.disposition,
      observedOutcome: parsedReference.comparison.observedOutcome,
      maximumGeneratorCheckerAgreement: referenceAudit.maximumAgreement,
      tolerance: science.tolerances.generatorCheckerAgreement,
      codeAndImportReceiptPass: parsedReference.codeAndImportReceipt.pass,
    } as unknown as StrictJson],
  );
  const preflightAncestryConsistency = evaluatePreflightAncestryConsistency(
    input,
    authority.packet,
    authority.preflight,
  );
  const preflightResourceConsistency = evaluatePreflightResourceConsistency(
    input,
    authority.packet,
    authority.preflight,
  );
  return Object.freeze({
    evaluationId: input.evaluationId,
    packetProtocol: Object.freeze({ ...input.packetProtocol }),
    scienceProtocol: Object.freeze({ ...input.scienceProtocol }),
    reference: Object.freeze({ ...input.referenceOrRefusal }),
    witness: Object.freeze({ ...input.witness }),
    cases: caseEvaluations,
    maxima: maximumMetrics,
    numericalCheck,
    referenceIndependenceCheck,
    preflightAncestryConsistency,
    preflightResourceConsistency,
    claimBoundary: Object.freeze({
      allowed: Object.freeze([...authority.packet.claimBoundary.allowed]),
      forbidden: Object.freeze([...authority.packet.claimBoundary.forbidden]),
    }),
    numericalDisposition: numericalPass ? "pass" : "fail",
    artifactDisposition: "valid",
  });
}

export function independentlyEvaluatePhase10C0VRadial(
  input: Phase10C0VRadialEvaluationInput,
): Phase10C0VRadialCleanEvaluation {
  const science = phase10C0VRadialReferenceInput(parsePhase10C0VRadialProtocol(
    parsePrettyJson(input.scienceProtocolBytes, "radial science protocol"),
  ));
  return evaluatePhase10C0VRadialWithScience(input, science);
}

export function independentlyEvaluatePhase10C0VRadialSyntheticFixture(
  input: Phase10C0VRadialEvaluationInput,
  syntheticScience: Phase10C0VRadialReferenceInput,
): Phase10C0VRadialCleanEvaluation {
  if (
    !input.evaluationId.startsWith("synthetic-") ||
    syntheticScience.protocolId.length === 0 ||
    !syntheticScience.protocolId.includes("synthetic")
  ) fail("synthetic evaluator is restricted to explicitly named synthetic fixture identities");
  return evaluatePhase10C0VRadialWithScience(input, syntheticScience);
}
