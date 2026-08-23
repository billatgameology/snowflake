import { createHash } from "node:crypto";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  independentlyEvaluatePhase10C0VRadial,
  independentlyEvaluatePhase10C0VRadialSyntheticFixture,
  type Phase10C0VRadialCheckResult,
  type Phase10C0VRadialCleanEvaluation,
  type Phase10C0VRadialEvaluationInput,
} from "./phase10-c0v-radial-evaluator.ts";
import {
  phase10RadialFiniteShellTerm,
  phase10RadialForgedSummary,
  phase10RadialRobinCoefficient,
  type Phase10C0VRadialNegativeControlInvocationBoundary,
  type Phase10C0VRadialNegativeControlInput,
} from "./phase10-c0v-radial-negative-controls.ts";
import type {
  Phase10C0VRadialProducerSummary,
} from "./phase10-c0v-radial-production.ts";
import {
  independentlyReprovePhase10RadialForgedSummaryMutation,
  type Phase10C0VRadialNegativeControlArtifact,
  type Phase10C0VRadialNegativeControlArtifactTuple,
} from "./phase10-c0v-radial-reproof.ts";
import { derivePhase10C0VS6RadialLifecycleAuthority } from "./phase10-c0v-s6-contracts.ts";
import type {
  Phase10C0VS6ArtifactIdentity,
  Phase10C0VS6CheckCallerResult,
  Phase10C0VS6LifecycleCheckContext,
} from "./phase10-c0v-s6-execution-contracts.ts";
import type { Phase10C0VRadialReferenceInput } from "./phase10-c0v-contracts.ts";

const HEADER_BYTES = 153 as const;
const GLOBAL_FLOAT_BYTES = 22 * 8;
const CASE_IDS = [
  "radial-dr-0p7um",
  "radial-dr-0p35um",
  "radial-dr-0p175um",
  "radial-dr-0p0875um",
] as const;
const NODE_COUNTS = [21, 40, 80, 159] as const;
const CASE_RECORD_BYTES = [523, 828, 1_469, 2_734] as const;
const CHECK_IDS = [
  "chk-c0v-radial-numeric",
  "chk-c0v-radial-reference-independence",
] as const;
const CONTROL_IDS = [
  "nc-radial-finite-shell-term",
  "nc-radial-forged-summary",
  "nc-radial-robin-coefficient",
] as const;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

export interface Phase10C0VRadialProduceCheckCallerInput {
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
  readonly producerSummary: Phase10C0VRadialProducerSummary;
  readonly producerSummaryBytes: Uint8Array;
  readonly lifecycle: Phase10C0VS6LifecycleCheckContext;
  readonly observeNegativeControlBoundary?: (
    event: Phase10C0VRadialNegativeControlInvocationBoundary,
  ) => void;
  readonly observeNegativeControlProgress?: (
    event: Phase10C0VRadialNegativeControlProgress,
  ) => void;
  /** Called once after the governed leaf completes, and before the next control can start. */
  readonly observeNegativeControlArtifact?: (
    artifact: Phase10C0VRadialNegativeControlArtifact,
  ) => void;
}

export interface Phase10C0VRadialNegativeControlProgress {
  readonly stage: "attacked-evaluation-complete" | "independent-proof-complete";
  readonly negativeControlId: (typeof CONTROL_IDS)[number];
}

export interface Phase10C0VRadialSyntheticFixtureCheckCallerInput
  extends Phase10C0VRadialProduceCheckCallerInput {
  readonly syntheticScience: Phase10C0VRadialReferenceInput;
}

export interface Phase10C0VRadialNegativeControlResult {
  readonly negativeControlId: (typeof CONTROL_IDS)[number];
  readonly mutationExecuted: boolean;
  readonly witnessMoved: boolean;
  readonly cleanCapturePreserved: boolean;
  readonly attackedCheckFailed: boolean;
  readonly pass: boolean;
}

export interface Phase10C0VRadialEvaluationReceipt {
  readonly schema: "phase10-c0v-radial-evaluation-v1";
  readonly evaluationId: string;
  readonly protocol: Phase10C0VS6ArtifactIdentity;
  readonly reference: Phase10C0VS6ArtifactIdentity;
  readonly witness: Phase10C0VS6ArtifactIdentity;
  readonly checkResults: readonly Phase10C0VRadialCheckResult[];
  readonly negativeControls: readonly Phase10C0VRadialNegativeControlResult[];
  readonly numericalDisposition: "pass" | "fail";
  readonly artifactDisposition: "valid" | "refusal";
  readonly limits: readonly string[];
}

export interface Phase10C0VRadialCampaignClassification {
  readonly numericalDisposition: "pass" | "fail";
  readonly artifactDisposition: "valid" | "refusal";
  readonly campaignDisposition: "valid" | "invalid-successor-required";
  readonly acceptedEvaluation: boolean;
  readonly campaignInvalidReasonCodes: readonly string[];
}

export interface Phase10C0VRadialCheckCallerResult
  extends Phase10C0VS6CheckCallerResult<Phase10C0VRadialEvaluationReceipt> {
  /**
   * The immutable evaluator output is always retained above as diagnostics. It is
   * publishable/credit-bearing only when every independently witnessed control passes.
   */
  readonly acceptedEvaluationBytes: Uint8Array | null;
  readonly campaignDisposition: Phase10C0VRadialCampaignClassification["campaignDisposition"];
  readonly campaignInvalidReasonCodes: readonly string[];
  readonly negativeControlArtifacts: Phase10C0VRadialNegativeControlArtifactTuple;
}

export interface Phase10C0VRadialCampaignMaterialization {
  readonly evaluationBytes: Uint8Array;
  readonly acceptedEvaluationBytes: Uint8Array | null;
  readonly campaignDisposition: Phase10C0VRadialCampaignClassification["campaignDisposition"];
  readonly campaignInvalidReasonCodes: readonly string[];
  readonly terminalStatus: "pass" | "fail";
}

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

export interface Phase10C0VRadialMutationWitness {
  readonly pass: boolean;
  readonly reasonCodes: readonly string[];
  readonly fieldMovedCaseIds: readonly string[];
}

interface ControlAudit {
  readonly negativeControlId: (typeof CONTROL_IDS)[number];
  readonly cleanWitness: Phase10C0VS6ArtifactIdentity;
  readonly mutatedWitness: Phase10C0VS6ArtifactIdentity;
  readonly reference: Phase10C0VS6ArtifactIdentity;
  readonly fieldMovedCaseIds: readonly string[];
  readonly attackedCheckPass: boolean;
  readonly cleanEvaluationIdentical: boolean;
  readonly cleanSummary: Phase10C0VS6ArtifactIdentity | null;
  readonly mutatedSummary: Phase10C0VS6ArtifactIdentity | null;
}

function fail(detail: string): never {
  throw new Error(`Phase 10 C0V radial check caller refused: ${detail}`);
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function identity(path: string, bytes: Uint8Array): Phase10C0VS6ArtifactIdentity {
  return Object.freeze({ path, byteLength: bytes.byteLength, sha256: sha256(bytes) });
}

function sameIdentity(
  left: Phase10C0VS6ArtifactIdentity,
  right: Phase10C0VS6ArtifactIdentity,
): boolean {
  return left.path === right.path &&
    left.byteLength === right.byteLength &&
    left.sha256 === right.sha256;
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function sliceEqual(
  left: Uint8Array,
  right: Uint8Array,
  start: number,
  end: number,
): boolean {
  return sameBytes(left.subarray(start, end), right.subarray(start, end));
}

function decodeControlWitness(
  bytes: Uint8Array,
  scienceProtocolSha256: string,
  referenceSha256: string,
): DecodedControlWitness {
  if (bytes.byteLength !== 5_891) fail("control witness length differs");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (textDecoder.decode(bytes.subarray(0, 8)) !== "C0VRAD01") fail("control witness magic differs");
  if (view.getUint32(8, true) !== 1) fail("control witness version differs");
  if (view.getUint32(12, true) !== 0x01020304) fail("control witness endian marker differs");
  const schemaLength = view.getUint32(16, true);
  if (
    schemaLength !== 29 ||
    textDecoder.decode(bytes.subarray(20, 20 + schemaLength)) !==
      "phase10-c0v-radial-witness-v1"
  ) fail("control witness schema differs");
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
    offset += 18 * 8;
    if (Number(view.getBigUint64(offset, true)) !== nodeCount) {
      fail(`${caseId} control numeric-field count differs`);
    }
    offset += 8;
    const numericFieldStart = offset;
    offset += nodeCount * 8;
    if (Number(view.getBigUint64(offset, true)) !== nodeCount) {
      fail(`${caseId} control uniform-field count differs`);
    }
    offset += 8;
    const uniformFieldStart = offset;
    offset += nodeCount * 8;
    if (offset - recordStart !== CASE_RECORD_BYTES[index]) {
      fail(`${caseId} control record length differs`);
    }
    records.push(Object.freeze({
      caseId,
      nodeCount,
      recordStart,
      recordEnd: offset,
      scalarStart,
      numericFieldStart,
      uniformFieldStart,
    }));
  }
  if (offset !== bytes.byteLength) fail("control witness has trailing bytes");
  return Object.freeze({ bytes, view, records: Object.freeze(records) });
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
  const radiusM = decoded.view.getFloat64(153 + 8, true);
  const spacingM = scalar(decoded, record, 1);
  const sigmaSurface = field(decoded, record, 0);
  const sigmaShell = field(decoded, record, record.nodeCount - 1);
  const u0 = radiusM * sigmaSurface;
  const u1 = (radiusM + spacingM) * field(decoded, record, 1);
  const u2 = (radiusM + 2 * spacingM) * field(decoded, record, 2);
  const uPrime = (-3 * u0 + 4 * u1 - u2) / (2 * spacingM);
  const gradient = uPrime / radiusM - u0 / (radiusM * radiusM);
  const saturationNumberDensityPerM3 = decoded.view.getFloat64(153 + 8 + 17 * 8, true);
  const diffusivityM2S = decoded.view.getFloat64(153 + 8 + 18 * 8, true);
  const kineticVelocityMS = decoded.view.getFloat64(153 + 8 + 20 * 8, true);
  const kineticLengthM = decoded.view.getFloat64(153 + 8 + 21 * 8, true);
  const iceNumberDensityPerM3 = decoded.view.getFloat64(153 + 8 + 9 * 8, true);
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
  const radiusM = clean.view.getFloat64(153 + 8, true);
  const farRadiusM = clean.view.getFloat64(153 + 8 + 8, true);
  const sigmaInfinity = clean.view.getFloat64(153 + 8 + 2 * 8, true);
  const kineticLengthM = clean.view.getFloat64(153 + 8 + 21 * 8, true);
  const effectiveCoefficient = clean.view.getFloat64(153 + 8 + 5 * 8, true) / 2;
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
    rightReduced[index] =
      (rightHandSide[index]! - lower[index]! * rightReduced[index - 1]!) / pivot;
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

function movedFields(
  clean: DecodedControlWitness,
  mutated: DecodedControlWitness,
): readonly string[] {
  return Object.freeze(clean.records.filter((record, recordIndex) => {
    const changed = mutated.records[recordIndex]!;
    return Array.from({ length: record.nodeCount }, (_, index) => index)
      .some((index) => !Object.is(field(clean, record, index), field(mutated, changed, index)));
  }).map((record) => record.caseId));
}

export function independentlyWitnessPhase10RadialFiniteShellMutation(
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
  if (!sliceEqual(
    clean.bytes,
    mutated.bytes,
    cleanFirst.recordStart,
    cleanFirst.scalarStart + 2 * 8,
  )) reasons.push("first-case-roster-or-spacing-moved");
  if (!sliceEqual(
    clean.bytes,
    mutated.bytes,
    cleanFirst.scalarStart + 10 * 8,
    cleanFirst.numericFieldStart,
  )) reasons.push("first-case-uniform-scalars-or-numeric-count-moved");
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
  const radiusM = clean.view.getFloat64(153 + 8, true);
  const farRadiusM = clean.view.getFloat64(153 + 16, true);
  const spacingM = scalar(clean, cleanFirst, 1);
  const u0 = radiusM * field(clean, cleanFirst, 0);
  const u1 = (radiusM + spacingM) * field(clean, cleanFirst, 1);
  const harmonicConstant = (u1 - u0) / spacingM;
  const inverseCoefficientM = u0 - harmonicConstant * radiusM;
  const mutatedConstant = harmonicConstant - inverseCoefficientM / farRadiusM;
  for (let index = 0; index < cleanFirst.nodeCount; index++) {
    const radius = radiusM + index * spacingM;
    const expected = mutatedConstant + inverseCoefficientM / radius;
    if (!Object.is(field(mutated, mutatedFirst, index), expected)) {
      reasons.push("finite-shell-field-formula-differs");
      break;
    }
  }
  const finiteScalars = expectedNumericScalars(
    mutated,
    mutatedFirst,
    clean.view.getFloat64(153 + 8 + 5 * 8, true),
  );
  if (finiteScalars.some((value, index) => !Object.is(
    scalar(mutated, mutatedFirst, index + 2),
    value,
  ))) reasons.push("finite-shell-dependent-scalars-differ");
  const fieldMovedCaseIds = movedFields(clean, mutated);
  if (!sameStringArray(fieldMovedCaseIds, [CASE_IDS[0]])) reasons.push("finite-shell-field-roster-differs");
  return Object.freeze({
    pass: reasons.length === 0,
    reasonCodes: Object.freeze([...new Set(reasons)].sort()),
    fieldMovedCaseIds,
  });
}

export function independentlyWitnessPhase10RadialRobinMutation(
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
  const frozenCoefficient = clean.view.getFloat64(153 + 8 + 5 * 8, true);
  const effectiveCoefficient = frozenCoefficient / 2;
  for (let index = 0; index < clean.records.length; index++) {
    const cleanRecord = clean.records[index]!;
    const mutatedRecord = mutated.records[index]!;
    if (!sliceEqual(
      clean.bytes,
      mutated.bytes,
      cleanRecord.recordStart,
      cleanRecord.scalarStart + 2 * 8,
    )) reasons.push(`${cleanRecord.caseId}-roster-or-spacing-moved`);
    if (!sliceEqual(
      clean.bytes,
      mutated.bytes,
      cleanRecord.scalarStart + 10 * 8,
      cleanRecord.numericFieldStart,
    )) reasons.push(`${cleanRecord.caseId}-uniform-scalars-or-numeric-count-moved`);
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
    const dependentScalars = expectedNumericScalars(
      mutated,
      mutatedRecord,
      effectiveCoefficient,
    );
    if (dependentScalars.some((value, scalarIndex) => !Object.is(
      scalar(mutated, mutatedRecord, scalarIndex + 2),
      value,
    ))) reasons.push(`${cleanRecord.caseId}-half-coefficient-dependent-scalars-differ`);
  }
  const fieldMovedCaseIds = movedFields(clean, mutated);
  if (!sameStringArray(fieldMovedCaseIds, CASE_IDS)) reasons.push("Robin-field-roster-differs");
  return Object.freeze({
    pass: reasons.length === 0,
    reasonCodes: Object.freeze([...new Set(reasons)].sort()),
    fieldMovedCaseIds,
  });
}

function sameStringArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function jsonEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(strictJsonSnapshot(left)) === JSON.stringify(strictJsonSnapshot(right));
}

function evaluationInput(
  input: Phase10C0VRadialProduceCheckCallerInput,
  witness: Phase10C0VS6ArtifactIdentity,
  witnessBytes: Uint8Array,
  producerSummary: Phase10C0VS6ArtifactIdentity,
  producerSummaryBytes: Uint8Array,
) {
  return Object.freeze({
    evaluationId: input.evaluationId,
    packetProtocol: input.packetProtocol,
    packetProtocolBytes: input.packetProtocolBytes,
    scienceProtocol: input.scienceProtocol,
    scienceProtocolBytes: input.scienceProtocolBytes,
    referenceOrRefusal: input.referenceOrRefusal,
    referenceBytes: input.referenceBytes,
    preflightBytes: input.preflightBytes,
    witness,
    witnessBytes,
    producerSummary,
    producerSummaryBytes,
    lifecycle: input.lifecycle,
  });
}

function negativeControlInput(
  input: Phase10C0VRadialProduceCheckCallerInput,
  candidateDirectory: string,
): Phase10C0VRadialNegativeControlInput {
  return Object.freeze({
    candidateDirectory,
    cleanWitness: input.witness,
    cleanWitnessBytes: input.witnessBytes,
    reference: input.referenceOrRefusal,
    scienceProtocol: input.scienceProtocol,
    producerSummary: input.producerSummary,
    producerSummaryBytes: input.producerSummaryBytes,
    observeInvocationBoundary: input.observeNegativeControlBoundary,
  });
}

function observeGovernedNegativeControlBoundary(
  input: Phase10C0VRadialProduceCheckCallerInput,
  stage: "start" | "complete",
  negativeControlId: (typeof CONTROL_IDS)[number],
): void {
  input.observeNegativeControlBoundary?.(Object.freeze({
    stage,
    boundaryKind: "governed-leaf",
    negativeControlId,
    caseIndex: null,
    caseId: null,
  }));
}

function observeNegativeControlProgress(
  input: Phase10C0VRadialProduceCheckCallerInput,
  stage: Phase10C0VRadialNegativeControlProgress["stage"],
  negativeControlId: (typeof CONTROL_IDS)[number],
): void {
  input.observeNegativeControlProgress?.(Object.freeze({ stage, negativeControlId }));
}

function result(
  negativeControlId: (typeof CONTROL_IDS)[number],
  mutationExecuted: boolean,
  witnessMoved: boolean,
  cleanCapturePreserved: boolean,
  attackedCheckFailed: boolean,
  pass: boolean,
): Phase10C0VRadialNegativeControlResult {
  return Object.freeze({
    negativeControlId,
    mutationExecuted,
    witnessMoved,
    cleanCapturePreserved,
    attackedCheckFailed,
    pass,
  });
}

export function classifyPhase10C0VRadialCampaign(
  checkResults: readonly Pick<Phase10C0VRadialCheckResult, "checkId" | "pass">[],
  controls: readonly Pick<Phase10C0VRadialNegativeControlResult, "negativeControlId" | "pass">[],
): Phase10C0VRadialCampaignClassification {
  if (!sameStringArray(checkResults.map((entry) => entry.checkId), CHECK_IDS)) {
    fail("campaign science-check roster differs from the registered order");
  }
  if (!sameStringArray(controls.map((entry) => entry.negativeControlId), CONTROL_IDS)) {
    fail("campaign negative-control roster differs from the registered order");
  }
  const numericalDisposition = checkResults.every((entry) => entry.pass) ? "pass" : "fail";
  const failedControlIds = controls
    .filter((entry) => !entry.pass)
    .map((entry) => entry.negativeControlId);
  const artifactDisposition = failedControlIds.length === 0 ? "valid" : "refusal";
  return Object.freeze({
    numericalDisposition,
    artifactDisposition,
    campaignDisposition: artifactDisposition === "valid" ? "valid" : "invalid-successor-required",
    acceptedEvaluation: artifactDisposition === "valid",
    campaignInvalidReasonCodes: Object.freeze(
      failedControlIds.map((negativeControlId) => `negative-control-failed:${negativeControlId}`),
    ),
  });
}

export function materializePhase10C0VRadialCampaign(
  evaluation: Phase10C0VRadialEvaluationReceipt,
): Phase10C0VRadialCampaignMaterialization {
  const campaign = classifyPhase10C0VRadialCampaign(
    evaluation.checkResults,
    evaluation.negativeControls,
  );
  if (evaluation.numericalDisposition !== campaign.numericalDisposition ||
    evaluation.artifactDisposition !== campaign.artifactDisposition) {
    fail("evaluation dispositions differ from independently rederived campaign state");
  }
  const evaluationBytes = textEncoder.encode(
    `${JSON.stringify(strictJsonSnapshot(evaluation), null, 2)}\n`,
  );
  return Object.freeze({
    evaluationBytes,
    acceptedEvaluationBytes: campaign.acceptedEvaluation ? evaluationBytes : null,
    campaignDisposition: campaign.campaignDisposition,
    campaignInvalidReasonCodes: campaign.campaignInvalidReasonCodes,
    terminalStatus: campaign.numericalDisposition,
  });
}

function withControlAudit(
  clean: Phase10C0VRadialCleanEvaluation,
  audit: readonly ControlAudit[],
): Phase10C0VRadialCheckResult {
  return Object.freeze({
    ...clean.numericalCheck,
    witnesses: Object.freeze([
      ...clean.numericalCheck.witnesses,
      strictJsonSnapshot({ negativeControlAudit: audit }),
    ]),
  });
}

function radialProduceCheckCaller(
  input: Phase10C0VRadialProduceCheckCallerInput,
  evaluate: (evaluation: Phase10C0VRadialEvaluationInput) => Phase10C0VRadialCleanEvaluation,
): Phase10C0VRadialCheckCallerResult {
  const authority = derivePhase10C0VS6RadialLifecycleAuthority(
    input.packetProtocol,
    input.packetProtocolBytes,
    input.preflightBytes,
  );
  if (authority.preflight.verdict !== "pass" || authority.preflight.refusalCandidate !== null) {
    fail("radial check caller requires the exact passing retained preflight");
  }
  const candidateDirectory = authority.preflight.observed.candidateDirectory;
  const expectedWitnessPath = `${candidateDirectory}/c0v-radial-witness.bin`;
  const expectedSummaryPath = `${candidateDirectory}/c0v-radial-producer-summary.json`;
  if (input.witness.path !== expectedWitnessPath) {
    fail("clean witness path differs from the preflight-derived candidate path");
  }
  const cleanSummary = identity(
    expectedSummaryPath,
    input.producerSummaryBytes,
  );
  const clean = evaluate(
    evaluationInput(
      input,
      input.witness,
      input.witnessBytes,
      cleanSummary,
      input.producerSummaryBytes,
    ),
  );
  if (!clean.preflightAncestryConsistency.pass || !clean.preflightResourceConsistency.pass) {
    const reasons = [
      ...clean.preflightAncestryConsistency.reasonCodes,
      ...clean.preflightResourceConsistency.reasonCodes,
    ];
    fail(`artifact-derived preflight consistency failed: ${[...new Set(reasons)].sort().join(",")}`);
  }
  const controlInput = negativeControlInput(input, candidateDirectory);

  observeGovernedNegativeControlBoundary(input, "start", "nc-radial-finite-shell-term");
  const finiteShell = phase10RadialFiniteShellTerm(controlInput);
  const finiteShellEvaluation = evaluate(
    evaluationInput(
      input,
      finiteShell.mutatedWitness,
      finiteShell.mutatedWitnessBytes,
      cleanSummary,
      finiteShell.producerSummaryBytes,
    ),
  );
  observeNegativeControlProgress(
    input,
    "attacked-evaluation-complete",
    "nc-radial-finite-shell-term",
  );
  const finiteProof = independentlyWitnessPhase10RadialFiniteShellMutation(
    input.witnessBytes,
    finiteShell.mutatedWitnessBytes,
    input.scienceProtocol.sha256,
    input.referenceOrRefusal.sha256,
  );
  const finiteFieldCases = finiteProof.fieldMovedCaseIds;
  const finiteMutationExecuted = finiteProof.pass;
  const finiteWitnessMoved = finiteShell.mutatedWitness.sha256 !== input.witness.sha256;
  const finiteCleanPreserved = sha256(input.witnessBytes) === input.witness.sha256 &&
    sameIdentity(finiteShell.cleanWitness, input.witness) &&
    sameIdentity(finiteShell.reference, input.referenceOrRefusal) &&
    sameBytes(finiteShell.producerSummaryBytes, input.producerSummaryBytes);
  const finiteAttacked = !finiteShellEvaluation.numericalCheck.pass;
  const finitePass = finiteMutationExecuted && finiteWitnessMoved && finiteCleanPreserved &&
    finiteAttacked && finiteShellEvaluation.referenceIndependenceCheck.pass &&
    finiteShellEvaluation.preflightAncestryConsistency.pass &&
    finiteShellEvaluation.preflightResourceConsistency.pass;
  observeNegativeControlProgress(input, "independent-proof-complete", "nc-radial-finite-shell-term");
  const finiteArtifact = Object.freeze({
    negativeControlId: "nc-radial-finite-shell-term" as const,
    artifactKind: "mutated-witness" as const,
    identity: finiteShell.mutatedWitness,
    bytes: new Uint8Array(finiteShell.mutatedWitnessBytes),
  });
  observeGovernedNegativeControlBoundary(input, "complete", "nc-radial-finite-shell-term");
  input.observeNegativeControlArtifact?.(finiteArtifact);

  observeGovernedNegativeControlBoundary(input, "start", "nc-radial-forged-summary");
  const forged = phase10RadialForgedSummary(controlInput);
  const forgedEvaluation = evaluate(
    evaluationInput(
      input,
      forged.mutatedWitness,
      forged.mutatedWitnessBytes,
      forged.mutatedSummary,
      forged.mutatedProducerSummaryBytes,
    ),
  );
  observeNegativeControlProgress(
    input,
    "attacked-evaluation-complete",
    "nc-radial-forged-summary",
  );
  const forgedEvaluationIdentical = jsonEqual(clean, forgedEvaluation);
  const forgedProof = independentlyReprovePhase10RadialForgedSummaryMutation(
    input.producerSummaryBytes,
    forged.mutatedProducerSummaryBytes,
    authority.packet.radialProducerSummary,
  );
  const forgedMutationExecuted = forged.operator ===
      "flip-external-summary-disposition-and-set-maximum-one" && forgedProof.pass;
  const forgedWitnessMoved = forged.mutatedWitness.sha256 !== input.witness.sha256;
  const forgedCleanPreserved = sameIdentity(forged.cleanWitness, input.witness) &&
    sameIdentity(forged.mutatedWitness, input.witness) &&
    sameIdentity(forged.reference, input.referenceOrRefusal) &&
    sameBytes(forged.mutatedWitnessBytes, input.witnessBytes) &&
    sha256(input.witnessBytes) === input.witness.sha256;
  const forgedAttacked = !forgedEvaluation.numericalCheck.pass;
  const forgedPass = forgedMutationExecuted && !forgedWitnessMoved && forgedCleanPreserved &&
    !forgedAttacked && forgedEvaluationIdentical;
  observeNegativeControlProgress(input, "independent-proof-complete", "nc-radial-forged-summary");
  const forgedArtifact = Object.freeze({
    negativeControlId: "nc-radial-forged-summary" as const,
    artifactKind: "mutated-summary" as const,
    identity: forged.mutatedSummary,
    bytes: new Uint8Array(forged.mutatedProducerSummaryBytes),
  });
  observeGovernedNegativeControlBoundary(input, "complete", "nc-radial-forged-summary");
  input.observeNegativeControlArtifact?.(forgedArtifact);

  observeGovernedNegativeControlBoundary(input, "start", "nc-radial-robin-coefficient");
  const robin = phase10RadialRobinCoefficient(controlInput);
  const robinEvaluation = evaluate(
    evaluationInput(
      input,
      robin.mutatedWitness,
      robin.mutatedWitnessBytes,
      cleanSummary,
      robin.producerSummaryBytes,
    ),
  );
  observeNegativeControlProgress(
    input,
    "attacked-evaluation-complete",
    "nc-radial-robin-coefficient",
  );
  const robinProof = independentlyWitnessPhase10RadialRobinMutation(
    input.witnessBytes,
    robin.mutatedWitnessBytes,
    input.scienceProtocol.sha256,
    input.referenceOrRefusal.sha256,
  );
  const robinFieldCases = robinProof.fieldMovedCaseIds;
  const robinMutationExecuted = robinProof.pass;
  const robinWitnessMoved = robin.mutatedWitness.sha256 !== input.witness.sha256;
  const robinCleanPreserved = sha256(input.witnessBytes) === input.witness.sha256 &&
    sameIdentity(robin.cleanWitness, input.witness) &&
    sameIdentity(robin.reference, input.referenceOrRefusal) &&
    sameBytes(robin.producerSummaryBytes, input.producerSummaryBytes);
  const robinAttacked = !robinEvaluation.numericalCheck.pass;
  const robinPass = robinMutationExecuted && robinWitnessMoved && robinCleanPreserved &&
    robinAttacked && robinEvaluation.referenceIndependenceCheck.pass &&
    robinEvaluation.preflightAncestryConsistency.pass &&
    robinEvaluation.preflightResourceConsistency.pass;
  observeNegativeControlProgress(input, "independent-proof-complete", "nc-radial-robin-coefficient");
  const robinArtifact = Object.freeze({
    negativeControlId: "nc-radial-robin-coefficient" as const,
    artifactKind: "mutated-witness" as const,
    identity: robin.mutatedWitness,
    bytes: new Uint8Array(robin.mutatedWitnessBytes),
  });
  observeGovernedNegativeControlBoundary(input, "complete", "nc-radial-robin-coefficient");
  input.observeNegativeControlArtifact?.(robinArtifact);

  const controls = Object.freeze([
    result(
      "nc-radial-finite-shell-term",
      finiteMutationExecuted,
      finiteWitnessMoved,
      finiteCleanPreserved,
      finiteAttacked,
      finitePass,
    ),
    result(
      "nc-radial-forged-summary",
      forgedMutationExecuted,
      forgedWitnessMoved,
      forgedCleanPreserved,
      forgedAttacked,
      forgedPass,
    ),
    result(
      "nc-radial-robin-coefficient",
      robinMutationExecuted,
      robinWitnessMoved,
      robinCleanPreserved,
      robinAttacked,
      robinPass,
    ),
  ]);
  const audit = Object.freeze<ControlAudit[]>([
    Object.freeze({
      negativeControlId: "nc-radial-finite-shell-term",
      cleanWitness: finiteShell.cleanWitness,
      mutatedWitness: finiteShell.mutatedWitness,
      reference: finiteShell.reference,
      fieldMovedCaseIds: finiteFieldCases,
      attackedCheckPass: finiteShellEvaluation.numericalCheck.pass,
      cleanEvaluationIdentical: false,
      cleanSummary: null,
      mutatedSummary: null,
    }),
    Object.freeze({
      negativeControlId: "nc-radial-forged-summary",
      cleanWitness: forged.cleanWitness,
      mutatedWitness: forged.mutatedWitness,
      reference: forged.reference,
      fieldMovedCaseIds: Object.freeze([]),
      attackedCheckPass: forgedEvaluation.numericalCheck.pass,
      cleanEvaluationIdentical: forgedEvaluationIdentical,
      cleanSummary: forged.cleanSummary,
      mutatedSummary: forged.mutatedSummary,
    }),
    Object.freeze({
      negativeControlId: "nc-radial-robin-coefficient",
      cleanWitness: robin.cleanWitness,
      mutatedWitness: robin.mutatedWitness,
      reference: robin.reference,
      fieldMovedCaseIds: robinFieldCases,
      attackedCheckPass: robinEvaluation.numericalCheck.pass,
      cleanEvaluationIdentical: false,
      cleanSummary: null,
      mutatedSummary: null,
    }),
  ]);
  const numericalCheck = withControlAudit(clean, audit);
  const checkResults = Object.freeze([
    numericalCheck,
    clean.referenceIndependenceCheck,
  ]);
  if (!sameStringArray(checkResults.map((entry) => entry.checkId), CHECK_IDS)) {
    fail("executed check roster differs from the registered order");
  }
  const campaign = classifyPhase10C0VRadialCampaign(checkResults, controls);
  const evaluation: Phase10C0VRadialEvaluationReceipt = Object.freeze({
    schema: "phase10-c0v-radial-evaluation-v1",
    evaluationId: input.evaluationId,
    // Evaluation-v1 shares the witness-v1 legacy meaning: this is the exact S5
    // science protocol. Packet-protocol ancestry stays in lifecycle evidence.
    protocol: Object.freeze({ ...input.scienceProtocol }),
    reference: Object.freeze({ ...input.referenceOrRefusal }),
    witness: Object.freeze({ ...input.witness }),
    checkResults,
    negativeControls: controls,
    numericalDisposition: campaign.numericalDisposition,
    artifactDisposition: campaign.artifactDisposition,
    limits: Object.freeze([...clean.claimBoundary.forbidden]),
  });
  const materialized = materializePhase10C0VRadialCampaign(evaluation);
  const negativeControlArtifacts = Object.freeze([
    finiteArtifact,
    forgedArtifact,
    robinArtifact,
  ] as const);
  return Object.freeze({
    evaluation,
    ...materialized,
    executedCheckIds: Object.freeze([...CHECK_IDS]),
    evaluatedCheckIds: Object.freeze([...CHECK_IDS]),
    executedNegativeControlIds: Object.freeze([...CONTROL_IDS]),
    negativeControlArtifacts,
  });
}

export function phase10C0VRadialProduceCheckCaller(
  input: Phase10C0VRadialProduceCheckCallerInput,
): Phase10C0VRadialCheckCallerResult {
  return radialProduceCheckCaller(input, independentlyEvaluatePhase10C0VRadial);
}

export function phase10C0VRadialSyntheticFixtureCheckCaller(
  input: Phase10C0VRadialSyntheticFixtureCheckCallerInput,
): Phase10C0VRadialCheckCallerResult {
  return radialProduceCheckCaller(input, (evaluation) =>
    independentlyEvaluatePhase10C0VRadialSyntheticFixture(evaluation, input.syntheticScience));
}
