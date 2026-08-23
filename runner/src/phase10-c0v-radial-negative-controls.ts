import { createHash } from "node:crypto";
import { sphericalNumeric } from "../../solver-cpu/src/spherical-reference.ts";
import type {
  Phase10C0VRadialProducerSummary,
} from "./phase10-c0v-radial-production.ts";
import type { Phase10C0VS6ArtifactIdentity } from "./phase10-c0v-s6-execution-contracts.ts";

const MAGIC = "C0VRAD01" as const;
const FORMAT_VERSION = 1 as const;
const ENDIAN_MARKER = 0x01020304 as const;
const SCHEMA = "phase10-c0v-radial-witness-v1" as const;
const HEADER_BYTES = 153 as const;
const PAYLOAD_BYTES = 5_738 as const;
const WITNESS_BYTES = 5_891 as const;
const PAYLOAD_SHA_OFFSET = 121 as const;
const GLOBALS_OFFSET = HEADER_BYTES + 8;
const GLOBAL_COUNT = 22 as const;
const CASE_IDS = [
  "radial-dr-0p7um",
  "radial-dr-0p35um",
  "radial-dr-0p175um",
  "radial-dr-0p0875um",
] as const;
const NODE_COUNTS = [21, 40, 80, 159] as const;
const CASE_RECORD_BYTES = [523, 828, 1_469, 2_734] as const;
const SHA256 = /^[0-9a-f]{64}$/u;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

export const PHASE10_C0V_RADIAL_NEGATIVE_CONTROL_IDS = Object.freeze([
  "nc-radial-finite-shell-term",
  "nc-radial-forged-summary",
  "nc-radial-robin-coefficient",
] as const);

export interface Phase10C0VRadialNegativeControlInput {
  /** Exact repository-relative candidate directory derived from the retained raw preflight. */
  readonly candidateDirectory: string;
  readonly cleanWitness: Phase10C0VS6ArtifactIdentity;
  readonly cleanWitnessBytes: Uint8Array;
  readonly reference: Phase10C0VS6ArtifactIdentity;
  readonly scienceProtocol: Phase10C0VS6ArtifactIdentity;
  readonly producerSummary: Phase10C0VRadialProducerSummary;
  readonly producerSummaryBytes: Uint8Array;
  readonly observeInvocationBoundary?: (
    event: Phase10C0VRadialNegativeControlInvocationBoundary,
  ) => void;
}

export interface Phase10C0VRadialNegativeControlInvocationBoundary {
  readonly stage: "start" | "complete";
  readonly boundaryKind: "governed-leaf" | "internal-case";
  readonly negativeControlId:
    | "nc-radial-finite-shell-term"
    | "nc-radial-forged-summary"
    | "nc-radial-robin-coefficient";
  readonly caseIndex: number | null;
  readonly caseId: string | null;
}

export interface Phase10C0VRadialBinaryMutation {
  readonly negativeControlId:
    | "nc-radial-finite-shell-term"
    | "nc-radial-robin-coefficient";
  readonly attackedCheckId: "chk-c0v-radial-numeric";
  readonly operator:
    | "coherent-first-case-missing-shell-constant"
    | "coherent-all-numeric-cases-half-robin-coefficient";
  readonly cleanWitness: Phase10C0VS6ArtifactIdentity;
  readonly mutatedWitness: Phase10C0VS6ArtifactIdentity;
  readonly reference: Phase10C0VS6ArtifactIdentity;
  readonly mutatedWitnessBytes: Uint8Array;
  readonly producerSummaryBytes: Uint8Array;
  readonly mutatedCaseCount: 1 | 4;
}

export interface Phase10C0VRadialForgedSummaryMutation {
  readonly negativeControlId: "nc-radial-forged-summary";
  readonly attackedCheckId: "chk-c0v-radial-numeric";
  readonly operator: "flip-external-summary-disposition-and-set-maximum-one";
  readonly cleanWitness: Phase10C0VS6ArtifactIdentity;
  readonly mutatedWitness: Phase10C0VS6ArtifactIdentity;
  readonly reference: Phase10C0VS6ArtifactIdentity;
  readonly mutatedWitnessBytes: Uint8Array;
  readonly cleanSummary: Phase10C0VS6ArtifactIdentity;
  readonly mutatedSummary: Phase10C0VS6ArtifactIdentity;
  readonly mutatedProducerSummary: Phase10C0VRadialProducerSummary;
  readonly mutatedProducerSummaryBytes: Uint8Array;
}

interface RecordOffsets {
  readonly caseId: string;
  readonly nodeCount: number;
  readonly scalarStart: number;
  readonly numericFieldStart: number;
  readonly uniformFieldStart: number;
}

interface ParsedWitness {
  readonly bytes: Uint8Array;
  readonly view: DataView;
  readonly records: readonly RecordOffsets[];
}

function fail(detail: string): never {
  throw new Error(`Phase 10 C0V radial negative control refused: ${detail}`);
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function sameIdentity(
  left: Phase10C0VS6ArtifactIdentity,
  right: Phase10C0VS6ArtifactIdentity,
): boolean {
  return left.path === right.path &&
    left.byteLength === right.byteLength &&
    left.sha256 === right.sha256;
}

function assertIdentityBytes(
  bytes: Uint8Array,
  identity: Phase10C0VS6ArtifactIdentity,
  label: string,
): void {
  if (
    typeof identity.path !== "string" ||
    identity.path.length === 0 ||
    !Number.isSafeInteger(identity.byteLength) ||
    identity.byteLength <= 0 ||
    !SHA256.test(identity.sha256) ||
    bytes.byteLength !== identity.byteLength ||
    sha256(bytes) !== identity.sha256
  ) fail(`${label} bytes do not match their identity`);
}

function identity(path: string, bytes: Uint8Array): Phase10C0VS6ArtifactIdentity {
  return Object.freeze({ path, byteLength: bytes.byteLength, sha256: sha256(bytes) });
}

function readHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

function u64(view: DataView, offset: number): number {
  const value = view.getBigUint64(offset, true);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) fail("u64 exceeds the safe-integer range");
  return Number(value);
}

function parseWitness(input: Phase10C0VRadialNegativeControlInput): ParsedWitness {
  if (input.cleanWitness.path !== candidatePath(input, "c0v-radial-witness.bin")) {
    fail("clean witness path differs from the retained preflight candidate directory");
  }
  assertIdentityBytes(input.cleanWitnessBytes, input.cleanWitness, "clean witness");
  if (input.cleanWitnessBytes.byteLength !== WITNESS_BYTES) fail("clean witness length differs");
  const bytes = new Uint8Array(input.cleanWitnessBytes);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (textDecoder.decode(bytes.subarray(0, 8)) !== MAGIC) fail("clean witness magic differs");
  if (view.getUint32(8, true) !== FORMAT_VERSION) fail("clean witness version differs");
  if (view.getUint32(12, true) !== ENDIAN_MARKER) fail("clean witness endian marker differs");
  const schemaLength = view.getUint32(16, true);
  if (
    schemaLength !== 29 ||
    textDecoder.decode(bytes.subarray(20, 20 + schemaLength)) !== SCHEMA
  ) fail("clean witness schema differs");
  if (readHex(bytes.subarray(49, 81)) !== input.scienceProtocol.sha256) {
    fail("clean witness science-protocol digest differs");
  }
  if (readHex(bytes.subarray(81, 113)) !== input.reference.sha256) {
    fail("clean witness reference digest differs");
  }
  if (u64(view, 113) !== PAYLOAD_BYTES) fail("clean witness payload length differs");
  if (readHex(bytes.subarray(PAYLOAD_SHA_OFFSET, HEADER_BYTES)) !== sha256(bytes.subarray(HEADER_BYTES))) {
    fail("clean witness payload digest differs");
  }
  if (view.getUint32(HEADER_BYTES, true) !== 4) fail("clean witness case count differs");
  if (view.getUint32(HEADER_BYTES + 4, true) !== GLOBAL_COUNT) {
    fail("clean witness global count differs");
  }

  const records: RecordOffsets[] = [];
  let offset = HEADER_BYTES + 8 + GLOBAL_COUNT * 8;
  for (let index = 0; index < CASE_IDS.length; index++) {
    const recordStart = offset;
    const idLength = view.getUint32(offset, true);
    offset += 4;
    const caseId = textDecoder.decode(bytes.subarray(offset, offset + idLength));
    offset += idLength;
    if (caseId !== CASE_IDS[index]) fail(`case ${index} ID differs`);
    const nodeCount = view.getUint32(offset, true);
    offset += 4;
    if (nodeCount !== NODE_COUNTS[index]) fail(`${caseId} node count differs`);
    if (view.getUint32(offset, true) !== 18) fail(`${caseId} scalar count differs`);
    offset += 4;
    const scalarStart = offset;
    offset += 18 * 8;
    if (u64(view, offset) !== nodeCount) fail(`${caseId} numeric-field count differs`);
    offset += 8;
    const numericFieldStart = offset;
    offset += nodeCount * 8;
    if (u64(view, offset) !== nodeCount) fail(`${caseId} uniform-field count differs`);
    offset += 8;
    const uniformFieldStart = offset;
    offset += nodeCount * 8;
    if (offset - recordStart !== CASE_RECORD_BYTES[index]) {
      fail(`${caseId} record byte length differs`);
    }
    records.push(Object.freeze({
      caseId,
      nodeCount,
      scalarStart,
      numericFieldStart,
      uniformFieldStart,
    }));
  }
  if (offset !== bytes.byteLength) fail("clean witness has padding or trailing bytes");
  return Object.freeze({ bytes, view, records: Object.freeze(records) });
}

function globalValue(parsed: ParsedWitness, index: number): number {
  return parsed.view.getFloat64(GLOBALS_OFFSET + index * 8, true);
}

function scalarValue(parsed: ParsedWitness, record: RecordOffsets, index: number): number {
  return parsed.view.getFloat64(record.scalarStart + index * 8, true);
}

function numericFieldValue(parsed: ParsedWitness, record: RecordOffsets, index: number): number {
  return parsed.view.getFloat64(record.numericFieldStart + index * 8, true);
}

function finiteCanonical(value: number, label: string): number {
  if (!Number.isFinite(value)) fail(`${label} is non-finite`);
  return Object.is(value, -0) || value === 0 ? 0 : value;
}

function writeScalar(parsed: ParsedWitness, record: RecordOffsets, index: number, value: number): void {
  parsed.view.setFloat64(
    record.scalarStart + index * 8,
    finiteCanonical(value, `${record.caseId}.scalar[${index}]`),
    true,
  );
}

function writeNumericField(
  parsed: ParsedWitness,
  record: RecordOffsets,
  index: number,
  value: number,
): void {
  parsed.view.setFloat64(
    record.numericFieldStart + index * 8,
    finiteCanonical(value, `${record.caseId}.numeric[${index}]`),
    true,
  );
}

function fieldGradient(
  parsed: ParsedWitness,
  record: RecordOffsets,
  radiusM: number,
  spacingM: number,
): number {
  const sigma0 = numericFieldValue(parsed, record, 0);
  const sigma1 = numericFieldValue(parsed, record, 1);
  const sigma2 = numericFieldValue(parsed, record, 2);
  const u0 = radiusM * sigma0;
  const u1 = (radiusM + spacingM) * sigma1;
  const u2 = (radiusM + 2 * spacingM) * sigma2;
  const uPrime = (-3 * u0 + 4 * u1 - u2) / (2 * spacingM);
  return finiteCanonical(uPrime / radiusM - u0 / (radiusM * radiusM), "surface gradient");
}

function replaceNumericScalars(
  parsed: ParsedWitness,
  record: RecordOffsets,
  attachmentCoefficient: number,
): void {
  const radiusM = globalValue(parsed, 0);
  const spacingM = scalarValue(parsed, record, 1);
  const sigmaSurface = numericFieldValue(parsed, record, 0);
  const sigmaShell = numericFieldValue(parsed, record, record.nodeCount - 1);
  const saturationNumberDensityPerM3 = globalValue(parsed, 17);
  const diffusivityM2S = globalValue(parsed, 18);
  const kineticVelocityMS = globalValue(parsed, 20);
  const kineticLengthM = globalValue(parsed, 21);
  const iceNumberDensityPerM3 = globalValue(parsed, 9);
  const gradient = fieldGradient(parsed, record, radiusM, spacingM);
  const growthVelocityKineticMS = attachmentCoefficient * kineticVelocityMS * sigmaSurface;
  const growthVelocityFluxMS =
    (saturationNumberDensityPerM3 / iceNumberDensityPerM3) * diffusivityM2S * gradient;
  const robinLeft = kineticLengthM * gradient;
  const robinRight = attachmentCoefficient * sigmaSurface;
  const robinResidual = robinLeft - robinRight;
  for (const [index, value] of [
    sigmaSurface,
    sigmaShell,
    growthVelocityKineticMS,
    growthVelocityFluxMS,
    gradient,
    robinLeft,
    robinRight,
    robinResidual,
  ].entries()) writeScalar(parsed, record, index + 2, value);
}

function reseal(parsed: ParsedWitness): void {
  const digest = createHash("sha256")
    .update(parsed.bytes.subarray(HEADER_BYTES))
    .digest();
  parsed.bytes.set(digest, PAYLOAD_SHA_OFFSET);
}

function assertSummary(input: Phase10C0VRadialNegativeControlInput): void {
  const expected = textEncoder.encode(`${JSON.stringify(input.producerSummary, null, 2)}\n`);
  if (
    input.producerSummary.schema !== "phase10-c0v-radial-producer-summary-v1" ||
    input.producerSummary.authority !== "non-authoritative" ||
    input.producerSummary.caseCount !== 4 ||
    input.producerSummary.totalNumericFieldValues !== 300 ||
    input.producerSummary.totalUniformFieldValues !== 300 ||
    expected.byteLength !== input.producerSummaryBytes.byteLength ||
    !expected.every((value, index) => value === input.producerSummaryBytes[index])
  ) fail("producer summary object and bytes differ");
}

function candidatePath(input: Phase10C0VRadialNegativeControlInput, filename: string): string {
  if (!input.candidateDirectory.endsWith("/candidate") ||
    input.candidateDirectory.includes("\\") || input.candidateDirectory.startsWith("/") ||
    input.candidateDirectory.split("/").some((part) => part.length === 0 || part === "." || part === "..")) {
    fail("candidate directory is not the exact safe repository-relative preflight path");
  }
  return `${input.candidateDirectory}/${filename}`;
}

function observe(
  input: Phase10C0VRadialNegativeControlInput,
  stage: "start" | "complete",
  negativeControlId: Phase10C0VRadialNegativeControlInvocationBoundary["negativeControlId"],
  caseIndex: number,
  caseId: string,
): void {
  input.observeInvocationBoundary?.(Object.freeze({
    stage,
    boundaryKind: "internal-case",
    negativeControlId,
    caseIndex,
    caseId,
  }));
}

export function phase10RadialFiniteShellTerm(
  input: Phase10C0VRadialNegativeControlInput,
): Phase10C0VRadialBinaryMutation {
  assertSummary(input);
  const parsed = parseWitness(input);
  const record = parsed.records[0]!;
  const radiusM = globalValue(parsed, 0);
  const farRadiusM = globalValue(parsed, 1);
  const spacingM = scalarValue(parsed, record, 1);
  const u0 = radiusM * numericFieldValue(parsed, record, 0);
  const u1 = (radiusM + spacingM) * numericFieldValue(parsed, record, 1);
  const harmonicConstant = (u1 - u0) / spacingM;
  const harmonicInverseRadiusCoefficientM = u0 - harmonicConstant * radiusM;
  const mutatedHarmonicConstant =
    harmonicConstant - harmonicInverseRadiusCoefficientM / farRadiusM;
  for (let index = 0; index < record.nodeCount; index++) {
    const radius = radiusM + index * spacingM;
    writeNumericField(
      parsed,
      record,
      index,
      mutatedHarmonicConstant + harmonicInverseRadiusCoefficientM / radius,
    );
  }
  const reconstructedFarRadiusM = radiusM + (record.nodeCount - 1) * spacingM;
  if (!Object.is(reconstructedFarRadiusM, farRadiusM)) {
    fail("finite-shell control roster does not reconstruct the frozen far radius exactly");
  }
  const expectedMutatedShell = finiteCanonical(
    mutatedHarmonicConstant + harmonicInverseRadiusCoefficientM / farRadiusM,
    "finite-shell expected mutated shell",
  );
  if (!Object.is(numericFieldValue(parsed, record, record.nodeCount - 1), expectedMutatedShell)) {
    fail("finite-shell control did not remove the registered shell contribution");
  }
  replaceNumericScalars(parsed, record, globalValue(parsed, 5));
  reseal(parsed);
  const mutatedWitness = identity(
    candidatePath(input, "nc-radial-finite-shell-term-witness.bin"),
    parsed.bytes,
  );
  if (mutatedWitness.sha256 === input.cleanWitness.sha256) fail("finite-shell mutation did not move witness");
  const output: Phase10C0VRadialBinaryMutation = Object.freeze({
    negativeControlId: "nc-radial-finite-shell-term",
    attackedCheckId: "chk-c0v-radial-numeric",
    operator: "coherent-first-case-missing-shell-constant",
    cleanWitness: Object.freeze({ ...input.cleanWitness }),
    mutatedWitness,
    reference: Object.freeze({ ...input.reference }),
    mutatedWitnessBytes: parsed.bytes,
    producerSummaryBytes: new Uint8Array(input.producerSummaryBytes),
    mutatedCaseCount: 1,
  });
  return output;
}

export function phase10RadialRobinCoefficient(
  input: Phase10C0VRadialNegativeControlInput,
): Phase10C0VRadialBinaryMutation {
  assertSummary(input);
  const parsed = parseWitness(input);
  const effectiveCoefficient = globalValue(parsed, 5) / 2;
  const problem = Object.freeze({
    radiusM: globalValue(parsed, 0),
    farRadiusM: globalValue(parsed, 1),
    sigmaInfinity: globalValue(parsed, 2),
    tempC: globalValue(parsed, 3),
    pressurePa: globalValue(parsed, 4),
  });
  for (const [caseIndex, record] of parsed.records.entries()) {
    observe(input, "start", "nc-radial-robin-coefficient", caseIndex, record.caseId);
    const solved = sphericalNumeric(problem, {
      drM: scalarValue(parsed, record, 0),
      attachmentCoefficient: effectiveCoefficient,
    });
    if (
      solved.nodes !== record.nodeCount ||
      !Object.is(solved.drM, scalarValue(parsed, record, 1))
    ) fail(`${record.caseId} half-coefficient solve changed the roster`);
    for (let index = 0; index < record.nodeCount; index++) {
      writeNumericField(parsed, record, index, solved.sigma[index]!);
    }
    replaceNumericScalars(parsed, record, effectiveCoefficient);
    observe(input, "complete", "nc-radial-robin-coefficient", caseIndex, record.caseId);
  }
  reseal(parsed);
  const mutatedWitness = identity(
    candidatePath(input, "nc-radial-robin-coefficient-witness.bin"),
    parsed.bytes,
  );
  if (mutatedWitness.sha256 === input.cleanWitness.sha256) fail("Robin mutation did not move witness");
  const output: Phase10C0VRadialBinaryMutation = Object.freeze({
    negativeControlId: "nc-radial-robin-coefficient",
    attackedCheckId: "chk-c0v-radial-numeric",
    operator: "coherent-all-numeric-cases-half-robin-coefficient",
    cleanWitness: Object.freeze({ ...input.cleanWitness }),
    mutatedWitness,
    reference: Object.freeze({ ...input.reference }),
    mutatedWitnessBytes: parsed.bytes,
    producerSummaryBytes: new Uint8Array(input.producerSummaryBytes),
    mutatedCaseCount: 4,
  });
  return output;
}

export function phase10RadialForgedSummary(
  input: Phase10C0VRadialNegativeControlInput,
): Phase10C0VRadialForgedSummaryMutation {
  assertSummary(input);
  parseWitness(input);
  const mutatedProducerSummary: Phase10C0VRadialProducerSummary = Object.freeze({
    schema: "phase10-c0v-radial-producer-summary-v1",
    authority: "non-authoritative",
    caseCount: 4,
    totalNumericFieldValues: 300,
    totalUniformFieldValues: 300,
    allFinite: input.producerSummary.allFinite,
    reportedDisposition: input.producerSummary.reportedDisposition === "pass" ? "fail" : "pass",
    reportedMaximum: 1,
  });
  const mutatedProducerSummaryBytes = textEncoder.encode(
    `${JSON.stringify(mutatedProducerSummary, null, 2)}\n`,
  );
  const cleanSummary = identity(
    candidatePath(input, "c0v-radial-producer-summary.json"),
    input.producerSummaryBytes,
  );
  const mutatedSummary = identity(
    candidatePath(input, "nc-radial-forged-summary.json"),
    mutatedProducerSummaryBytes,
  );
  if (mutatedSummary.sha256 === cleanSummary.sha256) fail("forged summary bytes did not move");
  const mutatedWitnessBytes = new Uint8Array(input.cleanWitnessBytes);
  const mutatedWitness = Object.freeze({ ...input.cleanWitness });
  assertIdentityBytes(mutatedWitnessBytes, mutatedWitness, "forged-summary witness");
  if (!sameIdentity(mutatedWitness, input.cleanWitness)) fail("forged-summary witness identity moved");
  const output: Phase10C0VRadialForgedSummaryMutation = Object.freeze({
    negativeControlId: "nc-radial-forged-summary",
    attackedCheckId: "chk-c0v-radial-numeric",
    operator: "flip-external-summary-disposition-and-set-maximum-one",
    cleanWitness: Object.freeze({ ...input.cleanWitness }),
    mutatedWitness,
    reference: Object.freeze({ ...input.reference }),
    mutatedWitnessBytes,
    cleanSummary,
    mutatedSummary,
    mutatedProducerSummary,
    mutatedProducerSummaryBytes,
  });
  return output;
}
