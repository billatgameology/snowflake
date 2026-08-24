import { createHash } from "node:crypto";
import { canonicalJson, strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";

export const PHASE10_C0V_S6_RUNTIME = "Node v24.13.1" as const;

export type Phase10C0VS6PacketId =
  | "a-p-c0v-s6"
  | "c0v-radial-produce"
  | "c0v-radial-publish"
  | "c0v-moving-produce"
  | "c0v-moving-publish"
  | "c0v-static-produce"
  | "c0v-static-publish"
  | "c0v-aggregate";

export type Phase10C0VS6LayerId = "C0V-RADIAL" | "C0V-STATIC" | "C0V-MOVING-EVENT";
export type Phase10C0VS6ScienceBranch = "independent-reference" | "reference-refusal";
export type Phase10C0VS6TerminalStatus = "pass" | "fail" | "refusal";
export type Phase10C0VS6PacketTerminalState = "complete";
export type Phase10C0VS6DispositionCode =
  | "production-complete"
  | "preproduction-artifact-refusal"
  | "prelaunch-resource-refusal"
  | "registered-cap-resource-refusal"
  | "reference-discrepancy-refusal"
  | "preimplementation-reference-refusal";
export type Phase10C0VS6ExecutionMode =
  | "supplemental-ap"
  | "radial-production"
  | "discrepancy-match-only"
  | "preimplementation-refusal"
  | "layer-publish"
  | "aggregate";

export interface Phase10C0VS6ArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10C0VS6LifecycleCheckContext {
  readonly packetId: Phase10C0VS6PacketId;
  readonly attemptId: string;
  readonly executionMode: Phase10C0VS6ExecutionMode;
  readonly selectedRoute: string;
  readonly runtime: typeof PHASE10_C0V_S6_RUNTIME;
  readonly command: string;
  readonly gitHead: string;
  readonly packetProtocol: Phase10C0VS6ArtifactIdentity;
  readonly scienceProtocol: Phase10C0VS6ArtifactIdentity;
  readonly preflight: Phase10C0VS6ArtifactIdentity;
  readonly referenceOrRefusal: Phase10C0VS6ArtifactIdentity;
  readonly resource: {
    readonly maxWallSeconds: number | null;
    readonly processConcurrency: 1;
    readonly projectedScratchBytes: number;
    readonly projectedPublicationBytes: number;
    readonly minimumFreeBytes: number;
    readonly observedFreeBytes: number;
  };
  readonly boundDependencyPacketIds: readonly string[];
}

export interface Phase10C0VS6CheckCallerResult<T> {
  readonly evaluation: T;
  readonly evaluationBytes: Uint8Array;
  readonly terminalStatus: "pass" | "fail";
  readonly executedCheckIds: readonly string[];
  readonly evaluatedCheckIds: readonly string[];
  readonly executedNegativeControlIds: readonly string[];
}

export interface Phase10C0VS6ExecutionRecord {
  readonly protocolReopenCount: number;
  readonly referenceOrRefusalReopenCount: number;
  readonly workerProcessInvocationCount: number;
  readonly solverWorkerInvocationCount: number;
  readonly productionInvocationCount: number;
  readonly discrepancyOrRefusalEvaluatorInvocationCount: number;
  readonly freezeEvaluatorInvocationCount: number;
  readonly resourceEvaluatorInvocationCount: number;
  readonly attemptCensusEvaluatorInvocationCount: number;
  readonly checkCallerInvocationCount: number;
  readonly numericalEvaluatorInvocationCount: number;
  readonly numericalNegativeControlInvocationCount: number;
  readonly acceptedValidWitnessCount: number;
  readonly acceptedNumericalVerdictCount: number;
  readonly governedInvocationElapsedNanoseconds: number;
  readonly governedInvocationWallSeconds: number;
}

export type Phase10C0VS6ExecutionCountTuple = readonly [
  protocolReopenCount: number,
  referenceOrRefusalReopenCount: number,
  workerProcessInvocationCount: number,
  solverWorkerInvocationCount: number,
  productionInvocationCount: number,
  discrepancyOrRefusalEvaluatorInvocationCount: number,
  freezeEvaluatorInvocationCount: number,
  resourceEvaluatorInvocationCount: number,
  attemptCensusEvaluatorInvocationCount: number,
  checkCallerInvocationCount: number,
  numericalEvaluatorInvocationCount: number,
  numericalNegativeControlInvocationCount: number,
  acceptedValidWitnessCount: number,
  acceptedNumericalVerdictCount: number,
];

export interface Phase10C0VS6RegisteredExecutionRecordTuple {
  readonly tupleId: string;
  readonly dispositionCode: Phase10C0VS6DispositionCode;
  readonly terminalStatus: Phase10C0VS6TerminalStatus;
  readonly lifecycleStage: string;
  readonly record: Omit<
    Phase10C0VS6ExecutionRecord,
    "governedInvocationElapsedNanoseconds" | "governedInvocationWallSeconds"
  >;
  readonly governedInvocationElapsedNanosecondsRule: "exact-zero" | "measured-sum";
  readonly partialExecutionRule: "must-be-null" | "must-be-present";
}

export interface Phase10C0VS6ResourceObservation {
  readonly observationId: string;
  readonly observedAt: string;
  readonly artifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly concurrentBytes: number;
}

export interface Phase10C0VS6ResourceRecord {
  readonly schema: "phase10-c0v-resource-record-v1";
  readonly registeredObservationPointIds: readonly string[];
  readonly observations: readonly Phase10C0VS6ResourceObservation[];
  readonly maximumObservedConcurrentBytes: number;
  readonly maximumObservationId: string;
  readonly terminalRetainedBytes: number;
  readonly excludedLedgerPath: string;
}

export type Phase10C0VS6ExecutableInvocationClass =
  | "solver-production"
  | "numerical-evaluator"
  | "numerical-negative-control"
  | "route-cause-evaluator";

export type Phase10C0VS6ExecutableInvocationTerminalState =
  | "complete"
  | "registered-cap"
  | "infrastructure-failure";

export interface Phase10C0VS6ExecutableInvocationRecord {
  readonly invocationId: string;
  readonly callableId: string;
  readonly negativeControlId: string | null;
  readonly invocationClass: Phase10C0VS6ExecutableInvocationClass;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly elapsedNanoseconds: number;
  readonly wallSeconds: number;
  readonly registeredWallSecondsMaximum: 300 | 14400;
  readonly terminalState: Phase10C0VS6ExecutableInvocationTerminalState;
}

export interface Phase10C0VS6RegisteredExecutableInvocation {
  readonly invocationId: string;
  readonly callableId: string;
  readonly negativeControlId: string | null;
  readonly invocationClass: Phase10C0VS6ExecutableInvocationClass;
  readonly registeredWallSecondsMaximum: 300 | 14400;
  readonly terminalState: Phase10C0VS6ExecutableInvocationTerminalState;
}

export interface Phase10C0VS6RegisteredExecutableInvocationRoster {
  readonly tupleId: string;
  readonly completionRule: "complete-roster" | "registered-cap-prefix";
  readonly prefixOfTupleId: string | null;
  readonly invocations: readonly Phase10C0VS6RegisteredExecutableInvocation[];
}

export type Phase10C0VS6WorkerProgressEvent =
  | "worker-started"
  | "invocation-started"
  | "case-started"
  | "case-completed"
  | "invocation-finished"
  | "worker-stopped";

export interface Phase10C0VS6WorkerProgressRecord {
  readonly schema: "phase10-c0v-worker-progress-row-v1";
  readonly sequence: number;
  readonly observedAt: string;
  readonly event: Phase10C0VS6WorkerProgressEvent;
  readonly invocationId: string | null;
  readonly caseId: string | null;
  readonly startedCaseIds: readonly string[];
  readonly completedCaseIds: readonly string[];
  readonly activeCaseId: string | null;
  readonly completedNumericFieldValueCount: number;
  readonly completedUniformFieldValueCount: number;
  readonly candidateByteLength: number;
  readonly candidateSha256: string | null;
  readonly terminalState: "running" | Phase10C0VS6ExecutableInvocationTerminalState;
}

export interface Phase10C0VS6WorkerProgress {
  readonly artifact: Phase10C0VS6ArtifactIdentity;
  readonly records: readonly Phase10C0VS6WorkerProgressRecord[];
}

export interface Phase10C0VS6PartialExecution {
  readonly capId: string;
  readonly registeredLimit: number;
  readonly observedValue: number;
  readonly unit: string;
  readonly cappedInvocationId: string;
  readonly cappedInvocationClass: Phase10C0VS6ExecutableInvocationClass;
  readonly invocationStartedAt: string;
  readonly invocationStoppedAt: string;
  readonly invocationElapsedNanoseconds: number;
  readonly rosterCaseIds: readonly string[];
  readonly startedCaseIds: readonly string[];
  readonly completedCaseIds: readonly string[];
  readonly activeCaseId: string | null;
  readonly completedNumericFieldValueCount: number;
  readonly completedUniformFieldValueCount: number;
  readonly retainedCandidateBytes: number;
  readonly acceptedValidWitnessProduced: false;
}

export interface Phase10C0VS6ClassificationEvidence {
  readonly evidenceId: string;
  readonly evidenceRole:
    | "packet-protocol" | "science-protocol" | "reference-or-refusal" | "preflight-receipt"
    | "terminal-receipt" | "stdout-log" | "stderr-log" | "exit-record" | "resource-record"
    | "classification-input";
  readonly retentionClass:
    | "tracked-authority" | "tracked-evidence" | "embedded-preflight-observation"
    | "embedded-attempt-record" | "embedded-terminal-record" | "ignored-staging-corroboration";
  readonly artifact: Phase10C0VS6ArtifactIdentity | null;
  readonly inlineObservationPath: string | null;
}

export interface Phase10C0VS6ClassificationObservation {
  readonly conditionId: string;
  readonly kind:
    | "artifact-identity" | "artifact-filesystem-policy" | "artifact-presence" | "available-bytes" | "retained-bytes"
    | "scratch-bytes" | "wall-seconds" | "process-hours" | "process-exit"
    | "reference-disposition" | "reference-check-outcome" | "refusal-ground"
    | "lifecycle-classification" | "negative-control-outcome";
  readonly comparator:
    | "equal" | "not-equal" | "less-than" | "less-than-or-equal" | "greater-than"
    | "greater-than-or-equal" | "identity-equal" | "present" | "classified-as";
  readonly registeredValue: string | boolean | number | null;
  readonly observedValue: string | boolean | number | null;
  readonly unit:
    | "bytes" | "seconds" | "hours" | "count" | "artifact-identity" | "disposition"
    | "outcome" | "reason-code" | "exit-code" | "classification" | null;
  readonly conditionPassed: boolean;
  readonly evidenceIds: readonly string[];
}

export interface Phase10C0VS6ClassificationValidation {
  readonly validationId: string;
  /** Canonical assembler only; this writer does not grant any independent verdict. */
  readonly assemblerCallableId: string;
  /** Exact ordered route-cause/freeze/census/resource evaluator provenance. */
  readonly componentEvaluatorCallableIds: readonly string[];
  readonly method:
    | "independent-artifact-precondition-classification"
    | "independent-prelaunch-resource-classification"
    | "independent-registered-cap-classification"
    | "independent-reference-discrepancy-classification"
    | "independent-preimplementation-refusal-classification";
  readonly validatedDispositionCode: Exclude<Phase10C0VS6DispositionCode, "production-complete">;
  readonly observations: readonly Phase10C0VS6ClassificationObservation[];
  readonly evidence: readonly Phase10C0VS6ClassificationEvidence[];
  readonly zeroScientificExecution: boolean;
  readonly partialExecutionMatched: boolean;
  readonly acceptedValidWitnessAbsent: boolean;
  readonly acceptedNumericalVerdictAbsent: boolean;
  readonly completedNumericalNegativeControlCampaignCreditAbsent: boolean;
  readonly verdict: "pass" | "fail";
  readonly errors: readonly string[];
}

export interface Phase10C0VS6AttemptRowV2 {
  readonly schema: "phase10-c0v-attempt-row-v2";
  readonly attemptId: string;
  readonly layerId: Phase10C0VS6LayerId;
  readonly branch: Phase10C0VS6ScienceBranch;
  readonly protocol: Phase10C0VS6ArtifactIdentity;
  readonly referenceOrRefusal: Phase10C0VS6ArtifactIdentity;
  readonly runtime: "Node v24.13.1";
  readonly command: string;
  readonly gitHead: string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly wallSeconds: number;
  readonly processHours: number;
  readonly processConcurrency: 1;
  readonly scratchBytes: number;
  readonly retainedBytes: number;
  readonly terminalStatus: Phase10C0VS6TerminalStatus;
  readonly dispositionCode: Phase10C0VS6DispositionCode;
  readonly exitCode: number | null;
  readonly preflight: Phase10C0VS6ArtifactIdentity;
  readonly stdout: Phase10C0VS6ArtifactIdentity;
  readonly stderr: Phase10C0VS6ArtifactIdentity;
  readonly terminalCandidate: Phase10C0VS6ArtifactIdentity;
  readonly executableInvocationRecords: readonly Phase10C0VS6ExecutableInvocationRecord[];
  readonly workerProgress: Phase10C0VS6WorkerProgress | null;
  readonly resourceRecord: Phase10C0VS6ResourceRecord;
  readonly executionRecord: Phase10C0VS6ExecutionRecord;
  readonly partialExecution: Phase10C0VS6PartialExecution | null;
  readonly classificationValidation: Phase10C0VS6ClassificationValidation | null;
}

export interface Phase10C0VS6RadialResultV2 {
  readonly schema: "phase10-c0v-radial-result-v2";
  readonly resultId: string;
  readonly layerId: "C0V-RADIAL";
  readonly branch: "independent-reference";
  readonly protocol: Phase10C0VS6ArtifactIdentity;
  readonly referenceOrRefusal: Phase10C0VS6ArtifactIdentity;
  readonly attemptLedger: Phase10C0VS6ArtifactIdentity;
  readonly selectedAttemptId: string;
  readonly attemptDispositionCode:
    | "production-complete"
    | "preproduction-artifact-refusal"
    | "prelaunch-resource-refusal"
    | "registered-cap-resource-refusal";
  readonly witness: Phase10C0VS6ArtifactIdentity | null;
  readonly evaluation: Phase10C0VS6ArtifactIdentity | null;
  readonly terminalStatus: "pass" | "fail" | "refusal";
  readonly scientificDisposition: "pass" | "fail" | "refusal";
  readonly negativeControlDisposition: "pass" | "not-accepted-no-credit";
  readonly resourceDisposition:
    | "within-cap"
    | "artifact-refusal"
    | "prelaunch-resource-refusal"
    | "registered-cap-resource-refusal";
  readonly claimBoundary: {
    readonly allowed: readonly string[];
    readonly forbidden: readonly string[];
  };
}

const HEX_64 = /^[0-9a-f]{64}$/u;
const SAFE_TOKEN = /^[a-z0-9][a-z0-9.-]*$/u;

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 execution contract refused: ${message}`);
}

export function phase10C0VS6Sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function phase10C0VS6SafeToken(value: unknown, label: string): string {
  if (typeof value !== "string" || !SAFE_TOKEN.test(value)) fail(`${label} is not a safe token`);
  return value;
}

export function phase10C0VS6SafeRelativePath(value: unknown, label: string): string {
  const segments = typeof value === "string" ? value.split("/") : [];
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.startsWith("/") ||
    value.endsWith("/") ||
    value.includes("\\") ||
    /^[A-Za-z]:/u.test(value) ||
    segments.some((part) => {
      const deviceStem = part.split(".", 1)[0]?.toLowerCase() ?? "";
      return part === "" || part === "." || part === ".." ||
        part.startsWith(" ") || part.endsWith(" ") || part.endsWith(".") ||
        /[\u0000-\u001f<>:"|?*]/u.test(part) ||
        /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/u.test(deviceStem);
    })
  ) fail(`${label} is not a safe repository-relative path`);
  return value;
}

export function phase10C0VS6ExactKeys(
  value: object,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} fields differ: expected ${wanted.join(",")}; got ${actual.join(",")}`);
  }
}

export function phase10C0VS6ExactOrderedKeys(
  value: object,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value);
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    fail(`${label} ordered fields differ: expected ${expected.join(",")}; got ${actual.join(",")}`);
  }
}

export function phase10C0VS6Object(
  value: unknown,
  label: string,
): { readonly [key: string]: StrictJson } {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as { readonly [key: string]: StrictJson };
}

export function phase10C0VS6String(value: unknown, label: string): string {
  if (typeof value !== "string") fail(`${label} must be a string`);
  return value;
}

export function phase10C0VS6Boolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") fail(`${label} must be a boolean`);
  return value;
}

export function phase10C0VS6NonnegativeNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || Object.is(value, -0)) {
    fail(`${label} must be a finite nonnegative number`);
  }
  return value;
}

export function phase10C0VS6NonnegativeSafeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || Object.is(value, -0)) {
    fail(`${label} must be a nonnegative safe integer without negative zero`);
  }
  return value as number;
}

export function phase10C0VS6SortedUniqueStrings(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    fail(`${label} must be an array of strings`);
  }
  const result = [...value] as string[];
  const sorted = [...result].sort(compareUnicodeCodePoints);
  if (result.some((entry, index) => entry !== sorted[index]) || new Set(result).size !== result.length) {
    fail(`${label} must be sorted and unique`);
  }
  return Object.freeze(result);
}

function compareUnicodeCodePoints(left: string, right: string): number {
  const leftPoints = Array.from(left, (character) => character.codePointAt(0) as number);
  const rightPoints = Array.from(right, (character) => character.codePointAt(0) as number);
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (leftPoints[index] as number) - (rightPoints[index] as number);
    if (difference !== 0) return difference;
  }
  return leftPoints.length - rightPoints.length;
}

export function phase10C0VS6IsoInstant(value: unknown, label: string): string {
  const instant = phase10C0VS6String(value, label);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(instant) || new Date(instant).toISOString() !== instant) {
    fail(`${label} must be a canonical ISO instant`);
  }
  return instant;
}

export function phase10C0VS6ArtifactIdentity(
  path: string,
  bytes: Uint8Array,
): Phase10C0VS6ArtifactIdentity {
  return Object.freeze({
    path: phase10C0VS6SafeRelativePath(path, "artifact identity path"),
    byteLength: bytes.byteLength,
    sha256: phase10C0VS6Sha256(bytes),
  });
}

export function parsePhase10C0VS6ArtifactIdentity(
  value: unknown,
  label: string,
): Phase10C0VS6ArtifactIdentity {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactKeys(row, ["path", "byteLength", "sha256"], label);
  const sha256 = phase10C0VS6String(row.sha256, `${label}.sha256`);
  if (!HEX_64.test(sha256)) fail(`${label}.sha256 must be lowercase SHA-256`);
  return Object.freeze({
    path: phase10C0VS6SafeRelativePath(row.path, `${label}.path`),
    byteLength: phase10C0VS6NonnegativeSafeInteger(row.byteLength, `${label}.byteLength`),
    sha256,
  });
}

export function phase10C0VS6SameIdentity(
  actual: Phase10C0VS6ArtifactIdentity,
  expected: Phase10C0VS6ArtifactIdentity,
  label: string,
): void {
  if (
    actual.path !== expected.path ||
    actual.byteLength !== expected.byteLength ||
    actual.sha256 !== expected.sha256
  ) fail(`${label} identity differs`);
}

export function phase10C0VS6PrettyJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

export function phase10C0VS6ParsePrettyJson(bytes: Uint8Array, label: string): StrictJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch (error) {
    fail(`${label} is not valid UTF-8 JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  const strict = strictJsonSnapshot(parsed);
  const canonicalBytes = phase10C0VS6PrettyJsonBytes(strict);
  if (
    canonicalBytes.byteLength !== bytes.byteLength ||
    canonicalBytes.some((byte, index) => byte !== bytes[index])
  ) fail(`${label} is not exact pretty-2 JSON plus LF`);
  return strict;
}

export function phase10C0VS6SameJson(actual: unknown, expected: unknown, label: string): void {
  if (canonicalJson(strictJsonSnapshot(actual)) !== canonicalJson(strictJsonSnapshot(expected))) {
    fail(`${label} differs`);
  }
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  const parsed = phase10C0VS6String(value, label);
  if (!allowed.includes(parsed as T)) fail(`${label} is outside the registered enum`);
  return parsed as T;
}

function nullableExitCode(value: unknown, label: string): number | null {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || Object.is(value, -0)) fail(`${label} must be an integer or null`);
  return value as number;
}

function stringRoster(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    fail(`${label} must be a string array`);
  }
  if (new Set(value).size !== value.length) fail(`${label} must contain unique values`);
  return Object.freeze([...value] as string[]);
}

function isPrefix(prefix: readonly string[], roster: readonly string[]): boolean {
  return prefix.length <= roster.length && prefix.every((entry, index) => entry === roster[index]);
}

function parseResourceObservation(
  value: unknown,
  label: string,
): Phase10C0VS6ResourceObservation {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "observationId", "observedAt", "artifacts", "concurrentBytes",
  ], label);
  if (!Array.isArray(row.artifacts)) fail(`${label}.artifacts must be an array`);
  const artifacts = row.artifacts.map((entry, index) =>
    parsePhase10C0VS6ArtifactIdentity(entry, `${label}.artifacts[${index}]`));
  const paths = artifacts.map((artifact) => artifact.path);
  const sortedPaths = [...paths].sort(compareUnicodeCodePoints);
  if (
    new Set(paths).size !== paths.length ||
    paths.some((path, index) => path !== sortedPaths[index])
  ) fail(`${label}.artifacts must be path-sorted and unique`);
  const derivedBytes = artifacts.reduce((total, artifact) => total + artifact.byteLength, 0);
  if (!Number.isSafeInteger(derivedBytes)) fail(`${label}.artifacts byte sum is not a safe integer`);
  const concurrentBytes = phase10C0VS6NonnegativeSafeInteger(
    row.concurrentBytes,
    `${label}.concurrentBytes`,
  );
  if (concurrentBytes !== derivedBytes) fail(`${label}.concurrentBytes differs from its artifact sum`);
  return Object.freeze({
    observationId: phase10C0VS6SafeToken(row.observationId, `${label}.observationId`),
    observedAt: phase10C0VS6IsoInstant(row.observedAt, `${label}.observedAt`),
    artifacts: Object.freeze(artifacts),
    concurrentBytes,
  });
}

export function parsePhase10C0VS6ResourceRecord(
  value: unknown,
  label = "resourceRecord",
): Phase10C0VS6ResourceRecord {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "schema", "registeredObservationPointIds", "observations", "maximumObservedConcurrentBytes",
    "maximumObservationId", "terminalRetainedBytes", "excludedLedgerPath",
  ], label);
  if (row.schema !== "phase10-c0v-resource-record-v1") fail(`${label}.schema differs`);
  const registeredObservationPointIds = stringRoster(
    row.registeredObservationPointIds,
    `${label}.registeredObservationPointIds`,
  );
  if (registeredObservationPointIds.length === 0) {
    fail(`${label}.registeredObservationPointIds must not be empty`);
  }
  if (!Array.isArray(row.observations) || row.observations.length === 0) {
    fail(`${label}.observations must not be empty`);
  }
  const observations = row.observations.map((entry, index) =>
    parseResourceObservation(entry, `${label}.observations[${index}]`));
  if (
    observations.length !== registeredObservationPointIds.length ||
    observations.some((observation, index) =>
      observation.observationId !== registeredObservationPointIds[index])
  ) fail(`${label}.observations do not exactly cover the registered point roster in order`);
  for (let index = 1; index < observations.length; index += 1) {
    if (Date.parse((observations[index] as Phase10C0VS6ResourceObservation).observedAt) <
      Date.parse((observations[index - 1] as Phase10C0VS6ResourceObservation).observedAt)) {
      fail(`${label}.observations are not time ordered`);
    }
  }
  const maximumObservedConcurrentBytes = Math.max(...observations.map((entry) => entry.concurrentBytes));
  const maximumObservation = observations.find(
    (entry) => entry.concurrentBytes === maximumObservedConcurrentBytes,
  ) as Phase10C0VS6ResourceObservation;
  const recordedMaximum = phase10C0VS6NonnegativeSafeInteger(
    row.maximumObservedConcurrentBytes,
    `${label}.maximumObservedConcurrentBytes`,
  );
  const maximumObservationId = phase10C0VS6SafeToken(
    row.maximumObservationId,
    `${label}.maximumObservationId`,
  );
  if (
    recordedMaximum !== maximumObservedConcurrentBytes ||
    maximumObservationId !== maximumObservation.observationId
  ) fail(`${label} maximum bytes/first maximum ID were not rederived`);
  const terminalRetainedBytes = phase10C0VS6NonnegativeSafeInteger(
    row.terminalRetainedBytes,
    `${label}.terminalRetainedBytes`,
  );
  if (terminalRetainedBytes !== (observations.at(-1) as Phase10C0VS6ResourceObservation).concurrentBytes) {
    fail(`${label}.terminalRetainedBytes differs from the terminal observation`);
  }
  const excludedLedgerPath = phase10C0VS6SafeRelativePath(
    row.excludedLedgerPath,
    `${label}.excludedLedgerPath`,
  );
  if (observations.some((observation) =>
    observation.artifacts.some((artifact) => artifact.path === excludedLedgerPath))) {
    fail(`${label}.excludedLedgerPath appears in an observation`);
  }
  return Object.freeze({
    schema: "phase10-c0v-resource-record-v1",
    registeredObservationPointIds,
    observations: Object.freeze(observations),
    maximumObservedConcurrentBytes,
    maximumObservationId,
    terminalRetainedBytes,
    excludedLedgerPath,
  });
}

function parseExecutableInvocationAuthority(
  value: unknown,
  label: string,
): Phase10C0VS6RegisteredExecutableInvocation {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "invocationId", "callableId", "negativeControlId", "invocationClass",
    "registeredWallSecondsMaximum", "terminalState",
  ], label);
  const invocationClass = enumValue(row.invocationClass, [
    "solver-production", "numerical-evaluator", "numerical-negative-control",
    "route-cause-evaluator",
  ] as const, `${label}.invocationClass`);
  const negativeControlId = row.negativeControlId === null
    ? null
    : phase10C0VS6SafeToken(row.negativeControlId, `${label}.negativeControlId`);
  if ((invocationClass === "numerical-negative-control") !== (negativeControlId !== null)) {
    fail(`${label}.negativeControlId must be non-null exactly for a numerical negative control`);
  }
  const registeredWallSecondsMaximum = phase10C0VS6NonnegativeSafeInteger(
    row.registeredWallSecondsMaximum,
    `${label}.registeredWallSecondsMaximum`,
  );
  const expectedMaximum = invocationClass === "solver-production" ? 300 : 14_400;
  if (registeredWallSecondsMaximum !== expectedMaximum) {
    fail(`${label}.registeredWallSecondsMaximum differs from invocation-class authority`);
  }
  return Object.freeze({
    invocationId: phase10C0VS6SafeToken(row.invocationId, `${label}.invocationId`),
    callableId: phase10C0VS6SafeToken(row.callableId, `${label}.callableId`),
    negativeControlId,
    invocationClass,
    registeredWallSecondsMaximum: registeredWallSecondsMaximum as 300 | 14400,
    terminalState: enumValue(row.terminalState, [
      "complete", "registered-cap", "infrastructure-failure",
    ] as const, `${label}.terminalState`),
  });
}

export function parsePhase10C0VS6ExecutableInvocationRecords(
  value: unknown,
  label = "executableInvocationRecords",
): readonly Phase10C0VS6ExecutableInvocationRecord[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  const invocationIds = new Set<string>();
  const records = value.map((entry, index) => {
    const recordLabel = `${label}[${index}]`;
    const row = phase10C0VS6Object(entry, recordLabel);
    phase10C0VS6ExactOrderedKeys(row, [
      "invocationId", "callableId", "negativeControlId", "invocationClass", "startedAt",
      "finishedAt", "elapsedNanoseconds", "wallSeconds", "registeredWallSecondsMaximum", "terminalState",
    ], recordLabel);
    const authority = parseExecutableInvocationAuthority({
      invocationId: row.invocationId,
      callableId: row.callableId,
      negativeControlId: row.negativeControlId,
      invocationClass: row.invocationClass,
      registeredWallSecondsMaximum: row.registeredWallSecondsMaximum,
      terminalState: row.terminalState,
    }, recordLabel);
    if (invocationIds.has(authority.invocationId)) fail(`${label} repeats ${authority.invocationId}`);
    invocationIds.add(authority.invocationId);
    const startedAt = phase10C0VS6IsoInstant(row.startedAt, `${recordLabel}.startedAt`);
    const finishedAt = phase10C0VS6IsoInstant(row.finishedAt, `${recordLabel}.finishedAt`);
    if (Date.parse(finishedAt) < Date.parse(startedAt)) {
      fail(`${recordLabel} UTC provenance timestamps are reversed`);
    }
    const elapsedNanoseconds = phase10C0VS6NonnegativeSafeInteger(
      row.elapsedNanoseconds,
      `${recordLabel}.elapsedNanoseconds`,
    );
    const derivedWallSeconds = elapsedNanoseconds / 1_000_000_000;
    const wallSeconds = phase10C0VS6NonnegativeNumber(row.wallSeconds, `${recordLabel}.wallSeconds`);
    if (wallSeconds !== derivedWallSeconds) {
      fail(`${recordLabel}.wallSeconds differs from parent-owned monotonic elapsed nanoseconds`);
    }
    const registeredMaximumNanoseconds = authority.registeredWallSecondsMaximum * 1_000_000_000;
    if (
      (authority.terminalState === "registered-cap" &&
        elapsedNanoseconds <= registeredMaximumNanoseconds) ||
      (authority.terminalState === "infrastructure-failure" &&
        elapsedNanoseconds > registeredMaximumNanoseconds) ||
      (authority.terminalState === "complete" &&
        elapsedNanoseconds > registeredMaximumNanoseconds)
    ) fail(`${recordLabel}.wallSeconds differs from its terminal-state cap classification`);
    return Object.freeze({
      invocationId: authority.invocationId,
      callableId: authority.callableId,
      negativeControlId: authority.negativeControlId,
      invocationClass: authority.invocationClass,
      startedAt,
      finishedAt,
      elapsedNanoseconds,
      wallSeconds,
      registeredWallSecondsMaximum: authority.registeredWallSecondsMaximum,
      terminalState: authority.terminalState,
    });
  });
  for (let index = 1; index < records.length; index += 1) {
    if (Date.parse((records[index] as Phase10C0VS6ExecutableInvocationRecord).startedAt) <
      Date.parse((records[index - 1] as Phase10C0VS6ExecutableInvocationRecord).finishedAt)) {
      fail(`${label} worker-leaf intervals overlap or are out of route order`);
    }
  }
  return Object.freeze(records);
}

export function parsePhase10C0VS6RegisteredExecutableInvocationRosters(
  value: unknown,
  label = "executableInvocationRosters",
): readonly Phase10C0VS6RegisteredExecutableInvocationRoster[] {
  if (!Array.isArray(value) || value.length === 0) fail(`${label} must be a nonempty array`);
  const tupleIds = new Set<string>();
  const rosters = value.map((entry, index) => {
    const rosterLabel = `${label}[${index}]`;
    const row = phase10C0VS6Object(entry, rosterLabel);
    phase10C0VS6ExactOrderedKeys(row, [
      "tupleId", "completionRule", "prefixOfTupleId", "invocations",
    ], rosterLabel);
    const tupleId = phase10C0VS6SafeToken(row.tupleId, `${rosterLabel}.tupleId`);
    if (tupleIds.has(tupleId)) fail(`${label} repeats ${tupleId}`);
    tupleIds.add(tupleId);
    const completionRule = enumValue(row.completionRule, [
      "complete-roster", "registered-cap-prefix",
    ] as const, `${rosterLabel}.completionRule`);
    const prefixOfTupleId = row.prefixOfTupleId === null
      ? null
      : phase10C0VS6SafeToken(row.prefixOfTupleId, `${rosterLabel}.prefixOfTupleId`);
    if ((completionRule === "complete-roster") !== (prefixOfTupleId === null)) {
      fail(`${rosterLabel}.prefixOfTupleId differs from completion rule`);
    }
    if (!Array.isArray(row.invocations)) fail(`${rosterLabel}.invocations must be an array`);
    const invocations = row.invocations.map((invocation, invocationIndex) =>
      parseExecutableInvocationAuthority(invocation, `${rosterLabel}.invocations[${invocationIndex}]`));
    if (invocations.some((invocation) => invocation.terminalState === "infrastructure-failure")) {
      fail(`${rosterLabel}.invocations may not register a claim-bearing infrastructure failure`);
    }
    if (new Set(invocations.map((invocation) => invocation.invocationId)).size !== invocations.length) {
      fail(`${rosterLabel}.invocations repeats an invocation ID`);
    }
    return Object.freeze({ tupleId, completionRule, prefixOfTupleId, invocations: Object.freeze(invocations) });
  });
  for (const roster of rosters) {
    if (roster.completionRule === "complete-roster") continue;
    const full = rosters.find((candidate) => candidate.tupleId === roster.prefixOfTupleId);
    if (full === undefined || full.completionRule !== "complete-roster" ||
      roster.invocations.length > full.invocations.length ||
      roster.invocations.some((invocation, index) => {
        const expected = full.invocations[index];
        return expected === undefined ||
          invocation.invocationId !== expected.invocationId ||
          invocation.callableId !== expected.callableId ||
          invocation.negativeControlId !== expected.negativeControlId ||
          invocation.invocationClass !== expected.invocationClass ||
          invocation.registeredWallSecondsMaximum !== expected.registeredWallSecondsMaximum ||
          (index < roster.invocations.length - 1 && invocation.terminalState !== expected.terminalState) ||
          (index === roster.invocations.length - 1 && invocation.terminalState !== "registered-cap");
      })) fail(`${roster.tupleId} is not an exact registered cap prefix`);
  }
  return Object.freeze(rosters);
}

export function parsePhase10C0VS6WorkerProgressRecord(
  value: unknown,
  label: string,
): Phase10C0VS6WorkerProgressRecord {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "schema", "sequence", "observedAt", "event", "invocationId", "caseId",
    "startedCaseIds", "completedCaseIds", "activeCaseId",
    "completedNumericFieldValueCount", "completedUniformFieldValueCount",
    "candidateByteLength", "candidateSha256", "terminalState",
  ], label);
  if (row.schema !== "phase10-c0v-worker-progress-row-v1") fail(`${label}.schema differs`);
  const event = enumValue(row.event, [
    "worker-started", "invocation-started", "case-started", "case-completed",
    "invocation-finished", "worker-stopped",
  ] as const, `${label}.event`);
  const invocationId = row.invocationId === null
    ? null
    : phase10C0VS6SafeToken(row.invocationId, `${label}.invocationId`);
  const caseId = row.caseId === null ? null : phase10C0VS6SafeToken(row.caseId, `${label}.caseId`);
  const startedCaseIds = stringRoster(row.startedCaseIds, `${label}.startedCaseIds`).map(
    (entry, index) => phase10C0VS6SafeToken(entry, `${label}.startedCaseIds[${index}]`),
  );
  const completedCaseIds = stringRoster(row.completedCaseIds, `${label}.completedCaseIds`).map(
    (entry, index) => phase10C0VS6SafeToken(entry, `${label}.completedCaseIds[${index}]`),
  );
  if (!isPrefix(completedCaseIds, startedCaseIds) || startedCaseIds.length - completedCaseIds.length > 1) {
    fail(`${label} case progress is not an exact single-active prefix`);
  }
  const activeCaseId = row.activeCaseId === null
    ? null
    : phase10C0VS6SafeToken(row.activeCaseId, `${label}.activeCaseId`);
  const expectedActive = startedCaseIds.length === completedCaseIds.length
    ? null
    : startedCaseIds.at(-1) as string;
  if (activeCaseId !== expectedActive) fail(`${label}.activeCaseId differs from case prefixes`);
  const completedNumericFieldValueCount = phase10C0VS6NonnegativeSafeInteger(
    row.completedNumericFieldValueCount,
    `${label}.completedNumericFieldValueCount`,
  );
  const completedUniformFieldValueCount = phase10C0VS6NonnegativeSafeInteger(
    row.completedUniformFieldValueCount,
    `${label}.completedUniformFieldValueCount`,
  );
  if (completedNumericFieldValueCount !== completedUniformFieldValueCount) {
    fail(`${label} numeric/uniform completed counts differ`);
  }
  const candidateByteLength = phase10C0VS6NonnegativeSafeInteger(
    row.candidateByteLength,
    `${label}.candidateByteLength`,
  );
  const candidateSha256 = row.candidateSha256 === null
    ? null
    : phase10C0VS6String(row.candidateSha256, `${label}.candidateSha256`);
  if ((candidateByteLength === 0) !== (candidateSha256 === null) ||
    (candidateSha256 !== null && !HEX_64.test(candidateSha256))) {
    fail(`${label} candidate byte length/SHA null rule differs`);
  }
  const terminalState = enumValue(row.terminalState, [
    "running", "complete", "registered-cap", "infrastructure-failure",
  ] as const, `${label}.terminalState`);
  const boundaryEvent = event === "worker-started" || event === "worker-stopped";
  const caseEvent = event === "case-started" || event === "case-completed";
  const finishEvent = event === "invocation-finished" || event === "worker-stopped";
  if (boundaryEvent !== (invocationId === null) || caseEvent !== (caseId !== null) ||
    finishEvent !== (terminalState !== "running")) {
    fail(`${label} event null/terminal-state rules differ`);
  }
  return Object.freeze({
    schema: "phase10-c0v-worker-progress-row-v1",
    sequence: phase10C0VS6NonnegativeSafeInteger(row.sequence, `${label}.sequence`),
    observedAt: phase10C0VS6IsoInstant(row.observedAt, `${label}.observedAt`),
    event,
    invocationId,
    caseId,
    startedCaseIds: Object.freeze(startedCaseIds),
    completedCaseIds: Object.freeze(completedCaseIds),
    activeCaseId,
    completedNumericFieldValueCount,
    completedUniformFieldValueCount,
    candidateByteLength,
    candidateSha256,
    terminalState,
  });
}

export function phase10C0VS6WorkerProgressBytes(
  records: readonly Phase10C0VS6WorkerProgressRecord[],
): Uint8Array {
  if (records.length === 0) fail("worker progress records must not be empty");
  const lines = records.map((record, index) =>
    JSON.stringify(strictJsonSnapshot(parsePhase10C0VS6WorkerProgressRecord(
      record,
      `worker progress record[${index}]`,
    ))));
  return new TextEncoder().encode(`${lines.join("\n")}\n`);
}

export function parsePhase10C0VS6WorkerProgress(
  value: unknown,
  label = "workerProgress",
): Phase10C0VS6WorkerProgress {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, ["artifact", "records"], label);
  const artifact = parsePhase10C0VS6ArtifactIdentity(row.artifact, `${label}.artifact`);
  if (!artifact.path.endsWith("/worker-progress.jsonl")) {
    fail(`${label}.artifact path must end in worker-progress.jsonl`);
  }
  if (!Array.isArray(row.records) || row.records.length === 0) fail(`${label}.records must not be empty`);
  const records = row.records.map((entry, index) =>
    parsePhase10C0VS6WorkerProgressRecord(entry, `${label}.records[${index}]`));
  if (records[0]?.event !== "worker-started" || records.at(-1)?.event !== "worker-stopped") {
    fail(`${label}.records must start/stop the worker exactly once at the boundaries`);
  }
  const first = records[0] as Phase10C0VS6WorkerProgressRecord;
  if (first.startedCaseIds.length !== 0 || first.completedCaseIds.length !== 0 ||
    first.completedNumericFieldValueCount !== 0 || first.completedUniformFieldValueCount !== 0 ||
    first.candidateByteLength !== 0 || first.candidateSha256 !== null || first.terminalState !== "running") {
    fail(`${label}.records worker-started row is not the exact zero state`);
  }
  let openInvocationId: string | null = null;
  let lastFinishedState: Phase10C0VS6ExecutableInvocationTerminalState | null = null;
  for (const [index, record] of records.entries()) {
    if (record.sequence !== index) fail(`${label}.records sequence is not zero-based contiguous`);
    if ((record.event === "worker-started") !== (index === 0) ||
      (record.event === "worker-stopped") !== (index === records.length - 1)) {
      fail(`${label}.records worker boundary event is not at its exact sole position`);
    }
    if (index > 0 && Date.parse(record.observedAt) < Date.parse((records[index - 1] as Phase10C0VS6WorkerProgressRecord).observedAt)) {
      fail(`${label}.records timestamps are not nondecreasing`);
    }
    const prior = index === 0 ? null : records[index - 1] as Phase10C0VS6WorkerProgressRecord;
    if (record.event === "invocation-started") {
      if (openInvocationId !== null) fail(`${label}.records starts an invocation while another is open`);
      openInvocationId = record.invocationId;
    } else if (record.event === "invocation-finished") {
      if (openInvocationId === null || record.invocationId !== openInvocationId) {
        fail(`${label}.records finishes a different or absent invocation`);
      }
      lastFinishedState = record.terminalState as Phase10C0VS6ExecutableInvocationTerminalState;
      openInvocationId = null;
    } else if (record.event === "case-started" || record.event === "case-completed") {
      if (openInvocationId === null || record.invocationId !== openInvocationId) {
        fail(`${label}.records case event lies outside its invocation`);
      }
    } else if ((record.event === "worker-started" || record.event === "worker-stopped") && openInvocationId !== null) {
      fail(`${label}.records worker boundary has an open invocation`);
    }
    if (prior !== null) {
      if (prior.candidateByteLength > 0 &&
        (record.candidateByteLength !== prior.candidateByteLength || record.candidateSha256 !== prior.candidateSha256)) {
        fail(`${label}.records mutates or removes an already retained exact candidate`);
      }
      if (record.event === "case-started") {
        if (record.startedCaseIds.length !== prior.startedCaseIds.length + 1 ||
          !isPrefix(prior.startedCaseIds, record.startedCaseIds) ||
          record.completedCaseIds.length !== prior.completedCaseIds.length ||
          !isPrefix(prior.completedCaseIds, record.completedCaseIds) || record.caseId !== record.activeCaseId ||
          record.caseId !== record.startedCaseIds.at(-1) ||
          record.completedNumericFieldValueCount !== prior.completedNumericFieldValueCount) {
          fail(`${label}.records case-start transition differs`);
        }
      } else if (record.event === "case-completed") {
        if (record.startedCaseIds.length !== prior.startedCaseIds.length ||
          !isPrefix(prior.startedCaseIds, record.startedCaseIds) ||
          record.completedCaseIds.length !== prior.completedCaseIds.length + 1 ||
          !isPrefix(prior.completedCaseIds, record.completedCaseIds) || prior.activeCaseId !== record.caseId ||
          record.caseId !== record.completedCaseIds.at(-1) || record.activeCaseId !== null) {
          fail(`${label}.records case-complete transition differs`);
        }
      } else if (
        record.startedCaseIds.length !== prior.startedCaseIds.length ||
        !isPrefix(prior.startedCaseIds, record.startedCaseIds) ||
        record.completedCaseIds.length !== prior.completedCaseIds.length ||
        !isPrefix(prior.completedCaseIds, record.completedCaseIds) ||
        record.activeCaseId !== prior.activeCaseId ||
        record.completedNumericFieldValueCount !== prior.completedNumericFieldValueCount ||
        record.completedUniformFieldValueCount !== prior.completedUniformFieldValueCount
      ) fail(`${label}.records changes case progress outside a case transition`);
    }
  }
  const stopped = records.at(-1) as Phase10C0VS6WorkerProgressRecord;
  if (lastFinishedState === null ||
    (stopped.terminalState !== lastFinishedState && stopped.terminalState !== "infrastructure-failure")) {
    fail(`${label}.records worker-stopped state differs from the final invocation`);
  }
  const bytes = phase10C0VS6WorkerProgressBytes(records);
  phase10C0VS6SameIdentity(
    phase10C0VS6ArtifactIdentity(artifact.path, bytes),
    artifact,
    `${label}.artifact embedded-record reserialization`,
  );
  return Object.freeze({ artifact, records: Object.freeze(records) });
}

export function parsePhase10C0VS6ExecutionRecord(
  value: unknown,
  label = "executionRecord",
): Phase10C0VS6ExecutionRecord {
  const row = phase10C0VS6Object(value, label);
  const keys = [
    "protocolReopenCount",
    "referenceOrRefusalReopenCount",
    "workerProcessInvocationCount",
    "solverWorkerInvocationCount",
    "productionInvocationCount",
    "discrepancyOrRefusalEvaluatorInvocationCount",
    "freezeEvaluatorInvocationCount",
    "resourceEvaluatorInvocationCount",
    "attemptCensusEvaluatorInvocationCount",
    "checkCallerInvocationCount",
    "numericalEvaluatorInvocationCount",
    "numericalNegativeControlInvocationCount",
    "acceptedValidWitnessCount",
    "acceptedNumericalVerdictCount",
    "governedInvocationElapsedNanoseconds",
    "governedInvocationWallSeconds",
  ] as const;
  phase10C0VS6ExactOrderedKeys(row, keys, label);
  return Object.freeze({
    protocolReopenCount: phase10C0VS6NonnegativeSafeInteger(row.protocolReopenCount, `${label}.protocolReopenCount`),
    referenceOrRefusalReopenCount: phase10C0VS6NonnegativeSafeInteger(row.referenceOrRefusalReopenCount, `${label}.referenceOrRefusalReopenCount`),
    workerProcessInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.workerProcessInvocationCount, `${label}.workerProcessInvocationCount`),
    solverWorkerInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.solverWorkerInvocationCount, `${label}.solverWorkerInvocationCount`),
    productionInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.productionInvocationCount, `${label}.productionInvocationCount`),
    discrepancyOrRefusalEvaluatorInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.discrepancyOrRefusalEvaluatorInvocationCount, `${label}.discrepancyOrRefusalEvaluatorInvocationCount`),
    freezeEvaluatorInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.freezeEvaluatorInvocationCount, `${label}.freezeEvaluatorInvocationCount`),
    resourceEvaluatorInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.resourceEvaluatorInvocationCount, `${label}.resourceEvaluatorInvocationCount`),
    attemptCensusEvaluatorInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.attemptCensusEvaluatorInvocationCount, `${label}.attemptCensusEvaluatorInvocationCount`),
    checkCallerInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.checkCallerInvocationCount, `${label}.checkCallerInvocationCount`),
    numericalEvaluatorInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.numericalEvaluatorInvocationCount, `${label}.numericalEvaluatorInvocationCount`),
    numericalNegativeControlInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.numericalNegativeControlInvocationCount, `${label}.numericalNegativeControlInvocationCount`),
    acceptedValidWitnessCount: phase10C0VS6NonnegativeSafeInteger(row.acceptedValidWitnessCount, `${label}.acceptedValidWitnessCount`),
    acceptedNumericalVerdictCount: phase10C0VS6NonnegativeSafeInteger(row.acceptedNumericalVerdictCount, `${label}.acceptedNumericalVerdictCount`),
    governedInvocationElapsedNanoseconds: phase10C0VS6NonnegativeSafeInteger(
      row.governedInvocationElapsedNanoseconds,
      `${label}.governedInvocationElapsedNanoseconds`,
    ),
    governedInvocationWallSeconds: phase10C0VS6NonnegativeNumber(
      row.governedInvocationWallSeconds,
      `${label}.governedInvocationWallSeconds`,
    ),
  });
}

export function parsePhase10C0VS6PartialExecution(
  value: unknown,
  label = "partialExecution",
): Phase10C0VS6PartialExecution {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "capId", "registeredLimit", "observedValue", "unit", "cappedInvocationId",
    "cappedInvocationClass", "invocationStartedAt", "invocationStoppedAt", "invocationElapsedNanoseconds",
    "rosterCaseIds", "startedCaseIds", "completedCaseIds", "activeCaseId",
    "completedNumericFieldValueCount", "completedUniformFieldValueCount", "retainedCandidateBytes",
    "acceptedValidWitnessProduced",
  ], label);
  const rosterCaseIds = stringRoster(row.rosterCaseIds, `${label}.rosterCaseIds`);
  const startedCaseIds = stringRoster(row.startedCaseIds, `${label}.startedCaseIds`);
  const completedCaseIds = stringRoster(row.completedCaseIds, `${label}.completedCaseIds`);
  const cappedInvocationClass = enumValue(row.cappedInvocationClass, [
    "solver-production", "numerical-evaluator", "numerical-negative-control", "route-cause-evaluator",
  ] as const, `${label}.cappedInvocationClass`);
  const activeCaseId = row.activeCaseId === null
    ? null
    : phase10C0VS6String(row.activeCaseId, `${label}.activeCaseId`);
  const completedNumericFieldValueCount = phase10C0VS6NonnegativeSafeInteger(
    row.completedNumericFieldValueCount,
    `${label}.completedNumericFieldValueCount`,
  );
  const completedUniformFieldValueCount = phase10C0VS6NonnegativeSafeInteger(
    row.completedUniformFieldValueCount,
    `${label}.completedUniformFieldValueCount`,
  );
  if (cappedInvocationClass === "route-cause-evaluator") {
    if (rosterCaseIds.length !== 0 || startedCaseIds.length !== 0 || completedCaseIds.length !== 0 ||
      activeCaseId !== null || completedNumericFieldValueCount !== 0 ||
      completedUniformFieldValueCount !== 0) {
      fail(`${label} route-cause cap must carry exact empty solver-case progress`);
    }
  } else {
    if (rosterCaseIds.length === 0) fail(`${label}.rosterCaseIds must not be empty for a radial pipeline cap`);
    if (
      !isPrefix(startedCaseIds, rosterCaseIds) ||
      !isPrefix(completedCaseIds, startedCaseIds) ||
      startedCaseIds.length - completedCaseIds.length > 1
    ) {
      fail(`${label} progress must be protocol-order prefixes`);
    }
    if (
      activeCaseId !== null &&
      (startedCaseIds.length === completedCaseIds.length || startedCaseIds[startedCaseIds.length - 1] !== activeCaseId)
    ) fail(`${label}.activeCaseId must be the one started but incomplete case`);
    if (activeCaseId === null && startedCaseIds.length !== completedCaseIds.length) {
      fail(`${label}.activeCaseId is required when one started case is incomplete`);
    }
  }
  if (row.acceptedValidWitnessProduced !== false) fail(`${label}.acceptedValidWitnessProduced must be false`);
  const invocationStartedAt = phase10C0VS6IsoInstant(row.invocationStartedAt, `${label}.invocationStartedAt`);
  const invocationStoppedAt = phase10C0VS6IsoInstant(row.invocationStoppedAt, `${label}.invocationStoppedAt`);
  if (Date.parse(invocationStoppedAt) < Date.parse(invocationStartedAt)) fail(`${label} invocation timestamps are reversed`);
  const invocationElapsedNanoseconds = phase10C0VS6NonnegativeSafeInteger(
    row.invocationElapsedNanoseconds,
    `${label}.invocationElapsedNanoseconds`,
  );
  const registeredLimit = phase10C0VS6NonnegativeNumber(row.registeredLimit, `${label}.registeredLimit`);
  if (registeredLimit === 0) fail(`${label}.registeredLimit must be positive`);
  const observedValue = phase10C0VS6NonnegativeNumber(row.observedValue, `${label}.observedValue`);
  const unit = enumValue(row.unit, ["seconds", "hours", "bytes"] as const, `${label}.unit`);
  if (unit === "seconds" && observedValue !== invocationElapsedNanoseconds / 1_000_000_000) {
    fail(`${label}.observedValue differs from parent-owned invocation elapsed nanoseconds`);
  }
  return Object.freeze({
    capId: phase10C0VS6SafeToken(row.capId, `${label}.capId`),
    registeredLimit,
    observedValue,
    unit,
    cappedInvocationId: phase10C0VS6SafeToken(row.cappedInvocationId, `${label}.cappedInvocationId`),
    cappedInvocationClass,
    invocationStartedAt,
    invocationStoppedAt,
    invocationElapsedNanoseconds,
    rosterCaseIds,
    startedCaseIds,
    completedCaseIds,
    activeCaseId,
    completedNumericFieldValueCount,
    completedUniformFieldValueCount,
    retainedCandidateBytes: phase10C0VS6NonnegativeSafeInteger(row.retainedCandidateBytes, `${label}.retainedCandidateBytes`),
    acceptedValidWitnessProduced: false,
  });
}

function sameScalarType(
  left: string | boolean | number | null,
  right: string | boolean | number | null,
): boolean {
  return left === null ? right === null : right !== null && typeof left === typeof right;
}

function independentlyCompareObservation(
  comparator: Phase10C0VS6ClassificationObservation["comparator"],
  registeredValue: string | boolean | number | null,
  observedValue: string | boolean | number | null,
  label: string,
): boolean {
  switch (comparator) {
    case "equal":
    case "identity-equal":
    case "classified-as":
      if (!sameScalarType(registeredValue, observedValue)) {
        fail(`${label} comparator operands must have the same primitive type`);
      }
      if (
        (comparator === "identity-equal" || comparator === "classified-as") &&
        (typeof registeredValue !== "string" || typeof observedValue !== "string")
      ) fail(`${label} ${comparator} requires string operands`);
      return Object.is(observedValue, registeredValue);
    case "not-equal":
      if (!sameScalarType(registeredValue, observedValue)) {
        fail(`${label} comparator operands must have the same primitive type`);
      }
      return !Object.is(observedValue, registeredValue);
    case "less-than":
    case "less-than-or-equal":
    case "greater-than":
    case "greater-than-or-equal": {
      if (typeof registeredValue !== "number" || typeof observedValue !== "number") {
        fail(`${label} ordered comparator requires numeric operands`);
      }
      if (comparator === "less-than") return observedValue < registeredValue;
      if (comparator === "less-than-or-equal") return observedValue <= registeredValue;
      if (comparator === "greater-than") return observedValue > registeredValue;
      return observedValue >= registeredValue;
    }
    case "present":
      if (registeredValue !== true || typeof observedValue !== "boolean") {
        fail(`${label} present comparator requires registered true and observed boolean`);
      }
      return observedValue;
  }
}

function parseClassificationEvidence(value: unknown, label: string): Phase10C0VS6ClassificationEvidence {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(
    row,
    ["evidenceId", "evidenceRole", "retentionClass", "artifact", "inlineObservationPath"],
    label,
  );
  const retentionClass = enumValue(row.retentionClass, [
    "tracked-authority", "tracked-evidence", "embedded-preflight-observation",
    "embedded-attempt-record", "embedded-terminal-record", "ignored-staging-corroboration",
  ] as const, `${label}.retentionClass`);
  const artifact = row.artifact === null
    ? null
    : parsePhase10C0VS6ArtifactIdentity(row.artifact, `${label}.artifact`);
  const inlineObservationPath = row.inlineObservationPath === null
    ? null
    : phase10C0VS6String(row.inlineObservationPath, `${label}.inlineObservationPath`);
  const embedded = retentionClass === "embedded-preflight-observation" ||
    retentionClass === "embedded-attempt-record" || retentionClass === "embedded-terminal-record";
  if (embedded !== (artifact === null) || embedded !== (inlineObservationPath !== null)) {
    fail(`${label} artifact/inline-observation nullability differs from retention class`);
  }
  return Object.freeze({
    evidenceId: phase10C0VS6SafeToken(row.evidenceId, `${label}.evidenceId`),
    evidenceRole: enumValue(row.evidenceRole, [
      "packet-protocol", "science-protocol", "reference-or-refusal", "preflight-receipt",
      "terminal-receipt", "stdout-log", "stderr-log", "exit-record", "resource-record",
      "classification-input",
    ] as const, `${label}.evidenceRole`),
    retentionClass,
    artifact,
    inlineObservationPath,
  });
}

function parseClassificationObservation(value: unknown, label: string): Phase10C0VS6ClassificationObservation {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "conditionId", "kind", "comparator", "registeredValue", "observedValue", "unit",
    "conditionPassed", "evidenceIds",
  ], label);
  const scalar = (raw: StrictJson, scalarLabel: string): string | boolean | number | null => {
    if (raw === null || typeof raw === "string" || typeof raw === "boolean") return raw;
    if (typeof raw === "number" && Number.isFinite(raw) && !Object.is(raw, -0)) return raw;
    fail(`${scalarLabel} must be a finite JSON scalar without negative zero`);
  };
  const comparator = enumValue(row.comparator, [
    "equal", "not-equal", "less-than", "less-than-or-equal", "greater-than",
    "greater-than-or-equal", "identity-equal", "present", "classified-as",
  ] as const, `${label}.comparator`);
  const registeredValue = scalar(row.registeredValue, `${label}.registeredValue`);
  const observedValue = scalar(row.observedValue, `${label}.observedValue`);
  const conditionPassed = phase10C0VS6Boolean(row.conditionPassed, `${label}.conditionPassed`);
  if (conditionPassed !== independentlyCompareObservation(
    comparator,
    registeredValue,
    observedValue,
    label,
  )) fail(`${label}.conditionPassed was not independently rederived`);
  const unit = row.unit === null ? null : enumValue(row.unit, [
    "bytes", "seconds", "hours", "count", "artifact-identity", "disposition", "outcome",
    "reason-code", "exit-code", "classification",
  ] as const, `${label}.unit`);
  return Object.freeze({
    conditionId: phase10C0VS6SafeToken(row.conditionId, `${label}.conditionId`),
    kind: enumValue(row.kind, [
      "artifact-identity", "artifact-filesystem-policy", "artifact-presence", "available-bytes", "retained-bytes",
      "scratch-bytes", "wall-seconds", "process-hours", "process-exit", "reference-disposition",
      "reference-check-outcome", "refusal-ground", "lifecycle-classification",
      "negative-control-outcome",
    ] as const, `${label}.kind`),
    comparator,
    registeredValue,
    observedValue,
    unit,
    conditionPassed,
    evidenceIds: phase10C0VS6SortedUniqueStrings(row.evidenceIds, `${label}.evidenceIds`),
  });
}

export function parsePhase10C0VS6ClassificationValidation(
  value: unknown,
  label = "classificationValidation",
): Phase10C0VS6ClassificationValidation {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "validationId", "assemblerCallableId", "componentEvaluatorCallableIds", "method",
    "validatedDispositionCode", "observations", "evidence", "zeroScientificExecution",
    "partialExecutionMatched", "acceptedValidWitnessAbsent",
    "acceptedNumericalVerdictAbsent", "completedNumericalNegativeControlCampaignCreditAbsent", "verdict", "errors",
  ], label);
  if (!Array.isArray(row.observations) || row.observations.length === 0) fail(`${label}.observations must not be empty`);
  if (!Array.isArray(row.evidence) || row.evidence.length === 0) fail(`${label}.evidence must not be empty`);
  const observations = row.observations.map((entry, index) =>
    parseClassificationObservation(entry, `${label}.observations[${index}]`));
  const evidence = row.evidence.map((entry, index) =>
    parseClassificationEvidence(entry, `${label}.evidence[${index}]`));
  const conditionIds = observations.map((entry) => entry.conditionId);
  if (new Set(conditionIds).size !== conditionIds.length) fail(`${label}.condition IDs must be unique`);
  const evidenceIds = evidence.map((entry) => entry.evidenceId);
  if (new Set(evidenceIds).size !== evidenceIds.length) fail(`${label}.evidence IDs must be unique`);
  const sortedEvidenceIds = [...evidenceIds].sort(compareUnicodeCodePoints);
  if (evidenceIds.some((id, index) => id !== sortedEvidenceIds[index])) {
    fail(`${label}.evidence must be sorted by evidenceId`);
  }
  const evidenceIdSet = new Set(evidenceIds);
  for (const observation of observations) {
    if (observation.evidenceIds.length === 0 || observation.evidenceIds.some((id) => !evidenceIdSet.has(id))) {
      fail(`${label} observation evidence references differ`);
    }
  }
  const errors = phase10C0VS6SortedUniqueStrings(row.errors, `${label}.errors`);
  const verdict = enumValue(row.verdict, ["pass", "fail"] as const, `${label}.verdict`);
  if ((verdict === "pass") !== (errors.length === 0)) fail(`${label} verdict/errors disagree`);
  if (!Array.isArray(row.componentEvaluatorCallableIds) || row.componentEvaluatorCallableIds.length === 0) {
    fail(`${label}.componentEvaluatorCallableIds must be a nonempty ordered evaluator roster`);
  }
  const componentEvaluatorCallableIds = row.componentEvaluatorCallableIds.map((entry, index) =>
    phase10C0VS6SafeToken(entry, `${label}.componentEvaluatorCallableIds[${index}]`));
  if (new Set(componentEvaluatorCallableIds).size !== componentEvaluatorCallableIds.length) {
    fail(`${label}.componentEvaluatorCallableIds must be unique without collapsing evaluator roles`);
  }
  return Object.freeze({
    validationId: phase10C0VS6SafeToken(row.validationId, `${label}.validationId`),
    assemblerCallableId: phase10C0VS6SafeToken(row.assemblerCallableId, `${label}.assemblerCallableId`),
    componentEvaluatorCallableIds: Object.freeze(componentEvaluatorCallableIds),
    method: enumValue(row.method, [
      "independent-artifact-precondition-classification",
      "independent-prelaunch-resource-classification",
      "independent-registered-cap-classification",
      "independent-reference-discrepancy-classification",
      "independent-preimplementation-refusal-classification",
    ] as const, `${label}.method`),
    validatedDispositionCode: enumValue(row.validatedDispositionCode, [
      "preproduction-artifact-refusal", "prelaunch-resource-refusal", "registered-cap-resource-refusal",
      "reference-discrepancy-refusal", "preimplementation-reference-refusal",
    ] as const, `${label}.validatedDispositionCode`),
    observations: Object.freeze(observations),
    evidence: Object.freeze(evidence),
    zeroScientificExecution: phase10C0VS6Boolean(row.zeroScientificExecution, `${label}.zeroScientificExecution`),
    partialExecutionMatched: phase10C0VS6Boolean(row.partialExecutionMatched, `${label}.partialExecutionMatched`),
    acceptedValidWitnessAbsent: phase10C0VS6Boolean(row.acceptedValidWitnessAbsent, `${label}.acceptedValidWitnessAbsent`),
    acceptedNumericalVerdictAbsent: phase10C0VS6Boolean(row.acceptedNumericalVerdictAbsent, `${label}.acceptedNumericalVerdictAbsent`),
    completedNumericalNegativeControlCampaignCreditAbsent: phase10C0VS6Boolean(row.completedNumericalNegativeControlCampaignCreditAbsent, `${label}.completedNumericalNegativeControlCampaignCreditAbsent`),
    verdict,
    errors,
  });
}

function expectedTerminalStatus(disposition: Phase10C0VS6DispositionCode, terminalStatus: Phase10C0VS6TerminalStatus): void {
  if (disposition === "production-complete" && terminalStatus !== "pass" && terminalStatus !== "fail") {
    fail("production-complete requires pass or fail from the numerical evaluator");
  }
  if (
    disposition !== "production-complete" && terminalStatus !== "refusal"
  ) fail(`${disposition} requires refusal terminal status`);
}

function expectedExecutionCounts(
  row: Phase10C0VS6AttemptRowV2,
): Phase10C0VS6ExecutionCountTuple {
  const record = row.executionRecord;
  return Object.freeze([
    record.protocolReopenCount,
    record.referenceOrRefusalReopenCount,
    record.workerProcessInvocationCount,
    record.solverWorkerInvocationCount,
    record.productionInvocationCount,
    record.discrepancyOrRefusalEvaluatorInvocationCount,
    record.freezeEvaluatorInvocationCount,
    record.resourceEvaluatorInvocationCount,
    record.attemptCensusEvaluatorInvocationCount,
    record.checkCallerInvocationCount,
    record.numericalEvaluatorInvocationCount,
    record.numericalNegativeControlInvocationCount,
    record.acceptedValidWitnessCount,
    record.acceptedNumericalVerdictCount,
  ]);
}

function assertCountTuple(row: Phase10C0VS6AttemptRowV2): void {
  const expected: Phase10C0VS6ExecutionCountTuple | null = row.dispositionCode === "production-complete"
    ? [1, 1, 1, 1, 1, 0, 1, 1, 1, 4, 1, 3, 1, 1]
    : row.dispositionCode === "reference-discrepancy-refusal" || row.dispositionCode === "preimplementation-reference-refusal"
      ? [1, 1, 1, 0, 0, 1, 1, 1, 1, 4, 0, 0, 0, 0]
      : null;
  const actual = expectedExecutionCounts(row);
  if (expected !== null && actual.some((value, index) => value !== expected[index])) {
    fail(`attempt execution count tuple differs for ${row.dispositionCode}`);
  }
  if (
    row.dispositionCode === "registered-cap-resource-refusal" &&
    (row.executionRecord.acceptedValidWitnessCount !== 0 || row.executionRecord.acceptedNumericalVerdictCount !== 0)
  ) fail("registered-cap execution count tuple grants accepted science credit");
}

export function phase10C0VS6ValidateRegisteredExecutionCountTuple(
  row: Phase10C0VS6AttemptRowV2,
  registeredTuples: readonly Phase10C0VS6ExecutionCountTuple[],
  label = "registered execution count tuple",
): void {
  if (registeredTuples.length === 0) fail(`${label} roster must not be empty`);
  const canonical = registeredTuples.map((tuple, tupleIndex) => {
    if (tuple.length !== 14) fail(`${label}[${tupleIndex}] must contain exactly fourteen counts`);
    const parsed = tuple.map((count, countIndex) =>
      phase10C0VS6NonnegativeSafeInteger(count, `${label}[${tupleIndex}][${countIndex}]`));
    return parsed.join(",");
  });
  if (new Set(canonical).size !== canonical.length) fail(`${label} roster repeats a tuple`);
  const actual = expectedExecutionCounts(row).join(",");
  if (!canonical.includes(actual)) fail(`${label} does not admit the attempt execution record`);
}

function parseRegisteredCountRecord(
  value: unknown,
  label: string,
): Omit<
  Phase10C0VS6ExecutionRecord,
  "governedInvocationElapsedNanoseconds" | "governedInvocationWallSeconds"
> {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "protocolReopenCount", "referenceOrRefusalReopenCount", "workerProcessInvocationCount",
    "solverWorkerInvocationCount", "productionInvocationCount",
    "discrepancyOrRefusalEvaluatorInvocationCount", "freezeEvaluatorInvocationCount",
    "resourceEvaluatorInvocationCount", "attemptCensusEvaluatorInvocationCount",
    "checkCallerInvocationCount",
    "numericalEvaluatorInvocationCount", "numericalNegativeControlInvocationCount",
    "acceptedValidWitnessCount", "acceptedNumericalVerdictCount",
  ], label);
  return Object.freeze({
    protocolReopenCount: phase10C0VS6NonnegativeSafeInteger(row.protocolReopenCount, `${label}.protocolReopenCount`),
    referenceOrRefusalReopenCount: phase10C0VS6NonnegativeSafeInteger(row.referenceOrRefusalReopenCount, `${label}.referenceOrRefusalReopenCount`),
    workerProcessInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.workerProcessInvocationCount, `${label}.workerProcessInvocationCount`),
    solverWorkerInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.solverWorkerInvocationCount, `${label}.solverWorkerInvocationCount`),
    productionInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.productionInvocationCount, `${label}.productionInvocationCount`),
    discrepancyOrRefusalEvaluatorInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.discrepancyOrRefusalEvaluatorInvocationCount, `${label}.discrepancyOrRefusalEvaluatorInvocationCount`),
    freezeEvaluatorInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.freezeEvaluatorInvocationCount, `${label}.freezeEvaluatorInvocationCount`),
    resourceEvaluatorInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.resourceEvaluatorInvocationCount, `${label}.resourceEvaluatorInvocationCount`),
    attemptCensusEvaluatorInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.attemptCensusEvaluatorInvocationCount, `${label}.attemptCensusEvaluatorInvocationCount`),
    checkCallerInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.checkCallerInvocationCount, `${label}.checkCallerInvocationCount`),
    numericalEvaluatorInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.numericalEvaluatorInvocationCount, `${label}.numericalEvaluatorInvocationCount`),
    numericalNegativeControlInvocationCount: phase10C0VS6NonnegativeSafeInteger(row.numericalNegativeControlInvocationCount, `${label}.numericalNegativeControlInvocationCount`),
    acceptedValidWitnessCount: phase10C0VS6NonnegativeSafeInteger(row.acceptedValidWitnessCount, `${label}.acceptedValidWitnessCount`),
    acceptedNumericalVerdictCount: phase10C0VS6NonnegativeSafeInteger(row.acceptedNumericalVerdictCount, `${label}.acceptedNumericalVerdictCount`),
  });
}

export function parsePhase10C0VS6RegisteredExecutionRecordTuples(
  value: unknown,
  label = "executionRecordTuples",
): readonly Phase10C0VS6RegisteredExecutionRecordTuple[] {
  if (!Array.isArray(value) || value.length === 0) fail(`${label} must be a nonempty array`);
  const tupleIds = new Set<string>();
  const semanticKeys = new Set<string>();
  const tuples = value.map((entry, index) => {
    const tupleLabel = `${label}[${index}]`;
    const row = phase10C0VS6Object(entry, tupleLabel);
    phase10C0VS6ExactOrderedKeys(row, [
      "tupleId", "dispositionCode", "terminalStatus", "lifecycleStage", "record",
      "governedInvocationElapsedNanosecondsRule", "partialExecutionRule",
    ], tupleLabel);
    const dispositionCode = enumValue(row.dispositionCode, [
      "production-complete", "preproduction-artifact-refusal", "prelaunch-resource-refusal",
      "registered-cap-resource-refusal", "reference-discrepancy-refusal",
      "preimplementation-reference-refusal",
    ] as const, `${tupleLabel}.dispositionCode`);
    const terminalStatus = enumValue(row.terminalStatus, [
      "pass", "fail", "refusal",
    ] as const, `${tupleLabel}.terminalStatus`);
    expectedTerminalStatus(dispositionCode, terminalStatus);
    const tupleId = phase10C0VS6SafeToken(row.tupleId, `${tupleLabel}.tupleId`);
    if (tupleIds.has(tupleId)) fail(`${label} repeats tupleId ${tupleId}`);
    tupleIds.add(tupleId);
    const record = parseRegisteredCountRecord(row.record, `${tupleLabel}.record`);
    const governedInvocationElapsedNanosecondsRule = enumValue(row.governedInvocationElapsedNanosecondsRule, [
      "exact-zero", "measured-sum",
    ] as const, `${tupleLabel}.governedInvocationElapsedNanosecondsRule`);
    const partialExecutionRule = enumValue(row.partialExecutionRule, [
      "must-be-null", "must-be-present",
    ] as const, `${tupleLabel}.partialExecutionRule`);
    if ((dispositionCode === "registered-cap-resource-refusal") !== (partialExecutionRule === "must-be-present")) {
      fail(`${tupleLabel}.partialExecutionRule differs from disposition`);
    }
    const semanticKey = [
      dispositionCode,
      terminalStatus,
      ...Object.values(record),
      governedInvocationElapsedNanosecondsRule,
      partialExecutionRule,
    ].join("|");
    if (semanticKeys.has(semanticKey)) fail(`${label} contains duplicate stage tuples with no durable distinction`);
    semanticKeys.add(semanticKey);
    return Object.freeze({
      tupleId,
      dispositionCode,
      terminalStatus,
      lifecycleStage: phase10C0VS6SafeToken(row.lifecycleStage, `${tupleLabel}.lifecycleStage`),
      record,
      governedInvocationElapsedNanosecondsRule,
      partialExecutionRule,
    });
  });
  return Object.freeze(tuples);
}

export function phase10C0VS6ValidateRegisteredExecutionRecordTuple(
  row: Phase10C0VS6AttemptRowV2,
  registeredTuples: readonly Phase10C0VS6RegisteredExecutionRecordTuple[],
): Phase10C0VS6RegisteredExecutionRecordTuple {
  const actualCounts = expectedExecutionCounts(row).join(",");
  const matches = registeredTuples.filter((tuple) => {
    const registeredCounts: Phase10C0VS6ExecutionCountTuple = [
      tuple.record.protocolReopenCount,
      tuple.record.referenceOrRefusalReopenCount,
      tuple.record.workerProcessInvocationCount,
      tuple.record.solverWorkerInvocationCount,
      tuple.record.productionInvocationCount,
      tuple.record.discrepancyOrRefusalEvaluatorInvocationCount,
      tuple.record.freezeEvaluatorInvocationCount,
      tuple.record.resourceEvaluatorInvocationCount,
      tuple.record.attemptCensusEvaluatorInvocationCount,
      tuple.record.checkCallerInvocationCount,
      tuple.record.numericalEvaluatorInvocationCount,
      tuple.record.numericalNegativeControlInvocationCount,
      tuple.record.acceptedValidWitnessCount,
      tuple.record.acceptedNumericalVerdictCount,
    ];
    return tuple.dispositionCode === row.dispositionCode && tuple.terminalStatus === row.terminalStatus &&
      registeredCounts.join(",") === actualCounts &&
      (tuple.governedInvocationElapsedNanosecondsRule === "exact-zero"
        ? row.executionRecord.governedInvocationElapsedNanoseconds === 0
        : true) &&
      (tuple.partialExecutionRule === "must-be-present") === (row.partialExecution !== null);
  });
  if (matches.length !== 1) fail("attempt does not resolve exactly one registered execution stage tuple");
  return matches[0] as Phase10C0VS6RegisteredExecutionRecordTuple;
}

export function phase10C0VS6ValidateRegisteredExecutableInvocationRoster(
  row: Phase10C0VS6AttemptRowV2,
  selectedTuple: Phase10C0VS6RegisteredExecutionRecordTuple,
  registeredRosters: readonly Phase10C0VS6RegisteredExecutableInvocationRoster[],
): Phase10C0VS6RegisteredExecutableInvocationRoster {
  const matches = registeredRosters.filter((roster) => roster.tupleId === selectedTuple.tupleId);
  if (matches.length !== 1) fail("selected execution tuple does not resolve exactly one invocation roster");
  const roster = matches[0] as Phase10C0VS6RegisteredExecutableInvocationRoster;
  if ((roster.invocations.length === 0) !==
    (selectedTuple.governedInvocationElapsedNanosecondsRule === "exact-zero")) {
    fail("governed invocation elapsed-nanoseconds rule differs from the exact registered worker-leaf roster");
  }
  const expectedRuleClass = row.dispositionCode === "registered-cap-resource-refusal"
    ? "registered-cap-prefix"
    : "complete-roster";
  if (
    (expectedRuleClass === "registered-cap-prefix" && roster.completionRule !== "registered-cap-prefix") ||
    (expectedRuleClass === "complete-roster" && roster.completionRule !== "complete-roster")
  ) fail("invocation-roster completion rule differs from attempt disposition");
  if (row.executableInvocationRecords.length !== roster.invocations.length) {
    fail("attempt worker-leaf invocation count differs from the exact registered roster");
  }
  for (const [index, actual] of row.executableInvocationRecords.entries()) {
    const expected = roster.invocations[index];
    if (
      expected === undefined || actual.invocationId !== expected.invocationId ||
      actual.callableId !== expected.callableId || actual.negativeControlId !== expected.negativeControlId ||
      actual.invocationClass !== expected.invocationClass ||
      actual.registeredWallSecondsMaximum !== expected.registeredWallSecondsMaximum ||
      actual.terminalState !== expected.terminalState
    ) fail(`attempt worker-leaf invocation[${index}] differs from its registered tuple row`);
  }
  return roster;
}

function expectedClassificationMethod(
  disposition: Exclude<Phase10C0VS6DispositionCode, "production-complete">,
): Phase10C0VS6ClassificationValidation["method"] {
  switch (disposition) {
    case "preproduction-artifact-refusal": return "independent-artifact-precondition-classification";
    case "prelaunch-resource-refusal": return "independent-prelaunch-resource-classification";
    case "registered-cap-resource-refusal": return "independent-registered-cap-classification";
    case "reference-discrepancy-refusal": return "independent-reference-discrepancy-classification";
    case "preimplementation-reference-refusal": return "independent-preimplementation-refusal-classification";
  }
}

export function parsePhase10C0VS6AttemptRowV2(
  value: unknown,
  label = "attempt row",
): Phase10C0VS6AttemptRowV2 {
  const source = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(source, [
    "schema", "attemptId", "layerId", "branch", "protocol", "referenceOrRefusal", "runtime",
    "command", "gitHead", "startedAt", "finishedAt", "wallSeconds", "processHours",
    "processConcurrency", "scratchBytes", "retainedBytes", "terminalStatus", "dispositionCode",
    "exitCode", "preflight", "stdout", "stderr", "terminalCandidate", "executableInvocationRecords", "workerProgress", "resourceRecord",
    "executionRecord", "partialExecution", "classificationValidation",
  ], label);
  if (source.schema !== "phase10-c0v-attempt-row-v2") fail(`${label}.schema differs`);
  const startedAt = phase10C0VS6IsoInstant(source.startedAt, `${label}.startedAt`);
  const finishedAt = phase10C0VS6IsoInstant(source.finishedAt, `${label}.finishedAt`);
  if (Date.parse(finishedAt) < Date.parse(startedAt)) fail(`${label} timestamps are reversed`);
  const dispositionCode = enumValue(source.dispositionCode, [
    "production-complete", "preproduction-artifact-refusal", "prelaunch-resource-refusal",
    "registered-cap-resource-refusal", "reference-discrepancy-refusal",
    "preimplementation-reference-refusal",
  ] as const, `${label}.dispositionCode`);
  const terminalStatus = enumValue(source.terminalStatus, [
    "pass", "fail", "refusal",
  ] as const, `${label}.terminalStatus`);
  expectedTerminalStatus(dispositionCode, terminalStatus);
  const partialExecution = source.partialExecution === null
    ? null
    : parsePhase10C0VS6PartialExecution(source.partialExecution, `${label}.partialExecution`);
  if ((dispositionCode === "registered-cap-resource-refusal") !== (partialExecution !== null)) {
    fail(`${label}.partialExecution is present exactly for registered-cap-resource-refusal`);
  }
  const classificationValidation = source.classificationValidation === null
    ? null
    : parsePhase10C0VS6ClassificationValidation(source.classificationValidation, `${label}.classificationValidation`);
  if ((dispositionCode === "production-complete") !== (classificationValidation === null)) {
    fail(`${label}.classificationValidation is null exactly for production-complete`);
  }
  if (
    classificationValidation !== null &&
    (classificationValidation.validatedDispositionCode !== dispositionCode || classificationValidation.verdict !== "pass")
  ) fail(`${label}.classificationValidation does not pass the selected disposition`);
  if (
    classificationValidation !== null &&
    classificationValidation.method !== expectedClassificationMethod(dispositionCode as Exclude<Phase10C0VS6DispositionCode, "production-complete">)
  ) fail(`${label}.classificationValidation method differs from the selected disposition`);
  if (
    classificationValidation !== null &&
    (!classificationValidation.partialExecutionMatched || !classificationValidation.acceptedValidWitnessAbsent ||
      !classificationValidation.acceptedNumericalVerdictAbsent ||
      !classificationValidation.completedNumericalNegativeControlCampaignCreditAbsent)
  ) {
    fail(`${label}.classificationValidation absence or partial-state validation flags differ`);
  }
  const row: Phase10C0VS6AttemptRowV2 = Object.freeze({
    schema: "phase10-c0v-attempt-row-v2",
    attemptId: phase10C0VS6SafeToken(source.attemptId, `${label}.attemptId`),
    layerId: enumValue(source.layerId, ["C0V-RADIAL", "C0V-STATIC", "C0V-MOVING-EVENT"] as const, `${label}.layerId`),
    branch: enumValue(source.branch, ["independent-reference", "reference-refusal"] as const, `${label}.branch`),
    protocol: parsePhase10C0VS6ArtifactIdentity(source.protocol, `${label}.protocol`),
    referenceOrRefusal: parsePhase10C0VS6ArtifactIdentity(source.referenceOrRefusal, `${label}.referenceOrRefusal`),
    runtime: enumValue(source.runtime, ["Node v24.13.1"] as const, `${label}.runtime`),
    command: phase10C0VS6String(source.command, `${label}.command`),
    gitHead: phase10C0VS6String(source.gitHead, `${label}.gitHead`),
    startedAt,
    finishedAt,
    wallSeconds: phase10C0VS6NonnegativeNumber(source.wallSeconds, `${label}.wallSeconds`),
    processHours: phase10C0VS6NonnegativeNumber(source.processHours, `${label}.processHours`),
    processConcurrency: phase10C0VS6NonnegativeSafeInteger(source.processConcurrency, `${label}.processConcurrency`) as 1,
    scratchBytes: phase10C0VS6NonnegativeSafeInteger(source.scratchBytes, `${label}.scratchBytes`),
    retainedBytes: phase10C0VS6NonnegativeSafeInteger(source.retainedBytes, `${label}.retainedBytes`),
    terminalStatus,
    dispositionCode,
    exitCode: nullableExitCode(source.exitCode, `${label}.exitCode`),
    preflight: parsePhase10C0VS6ArtifactIdentity(source.preflight, `${label}.preflight`),
    stdout: parsePhase10C0VS6ArtifactIdentity(source.stdout, `${label}.stdout`),
    stderr: parsePhase10C0VS6ArtifactIdentity(source.stderr, `${label}.stderr`),
    terminalCandidate: parsePhase10C0VS6ArtifactIdentity(source.terminalCandidate, `${label}.terminalCandidate`),
    executableInvocationRecords: parsePhase10C0VS6ExecutableInvocationRecords(
      source.executableInvocationRecords,
      `${label}.executableInvocationRecords`,
    ),
    workerProgress: source.workerProgress === null
      ? null
      : parsePhase10C0VS6WorkerProgress(source.workerProgress, `${label}.workerProgress`),
    resourceRecord: parsePhase10C0VS6ResourceRecord(source.resourceRecord, `${label}.resourceRecord`),
    executionRecord: parsePhase10C0VS6ExecutionRecord(source.executionRecord, `${label}.executionRecord`),
    partialExecution,
    classificationValidation,
  });
  if (row.processConcurrency !== 1) fail(`${label}.processConcurrency must equal one`);
  const stdoutSuffix = "/stdout.log";
  if (!row.stdout.path.endsWith(stdoutSuffix)) fail(`${label}.stdout path differs from the exact attempt log path`);
  const attemptDirectory = row.stdout.path.slice(0, -stdoutSuffix.length);
  if (attemptDirectory.length === 0 || row.stderr.path !== `${attemptDirectory}/stderr.log`) {
    fail(`${label}.stdout/stderr paths do not share the exact attempt directory`);
  }
  const expectedTerminalCandidateFilename = "terminal-success-candidate.json";
  if (row.terminalCandidate.path !== `${attemptDirectory}/${expectedTerminalCandidateFilename}`) {
    fail(`${label}.terminalCandidate path differs from the one-way lifecycle branch`);
  }
  const terminalArtifacts = row.resourceRecord.observations.at(-1)?.artifacts ?? [];
  for (const [identity, identityLabel] of [
    [row.stdout, "stdout"],
    [row.stderr, "stderr"],
    [row.terminalCandidate, "terminalCandidate"],
  ] as const) {
    const retained = terminalArtifacts.filter((artifact) => artifact.path === identity.path);
    if (retained.length !== 1) fail(`${label}.${identityLabel} does not resolve exactly once in terminal resources`);
    phase10C0VS6SameIdentity(identity, retained[0]!, `${label}.${identityLabel} terminal resource`);
  }
  const derivedAttemptWallSeconds = (Date.parse(row.finishedAt) - Date.parse(row.startedAt)) / 1000;
  if (row.wallSeconds !== derivedAttemptWallSeconds) {
    fail(`${label}.wallSeconds differs from canonical millisecond attempt timestamps`);
  }
  if (
    row.scratchBytes !== row.resourceRecord.maximumObservedConcurrentBytes ||
    row.retainedBytes !== row.resourceRecord.terminalRetainedBytes
  ) fail(`${label} top-level resource counts differ from the independently rederived record`);
  if (row.resourceRecord.observations.some((observation) =>
    Date.parse(observation.observedAt) < Date.parse(row.startedAt) ||
    Date.parse(observation.observedAt) > Date.parse(row.finishedAt))) {
    fail(`${label}.resourceRecord observation lies outside attempt bounds`);
  }
  if (row.executableInvocationRecords.some((invocation) =>
    Date.parse(invocation.startedAt) < Date.parse(row.startedAt) ||
    Date.parse(invocation.finishedAt) > Date.parse(row.finishedAt))) {
    fail(`${label}.executableInvocationRecords lies outside attempt bounds`);
  }
  if (!/^[0-9a-f]{40}$/u.test(row.gitHead)) fail(`${label}.gitHead must be lowercase 40-hex`);
  // A parent-terminated child reports a null Node exit code together with a non-null raw
  // signal in the separately retained exit-status receipt.  The attempt row deliberately
  // carries only the raw numeric code, so null cannot imply that no worker ran.  A numeric
  // code still proves that a worker did run; census binds the null-worker case and every
  // signalled-worker case to the strict exit-status bytes.
  if (row.executionRecord.workerProcessInvocationCount === 0 && row.exitCode !== null) {
    fail(`${label}.exitCode may be non-null only when a worker process ran`);
  }
  if ((row.workerProgress === null) !== (row.executionRecord.solverWorkerInvocationCount === 0)) {
    fail(`${label}.workerProgress must be non-null exactly when a solver worker ran`);
  }
  if (row.executableInvocationRecords.some((invocation) => invocation.terminalState === "infrastructure-failure")) {
    fail(`${label} claim-bearing attempt rows may not retain an infrastructure-failure invocation`);
  }
  if (row.workerProgress?.records.some((record) =>
    Date.parse(record.observedAt) < Date.parse(row.startedAt) ||
    Date.parse(record.observedAt) > Date.parse(row.finishedAt))) {
    fail(`${label}.workerProgress record lies outside attempt bounds`);
  }
  if (
    row.executionRecord.workerProcessInvocationCount > 1 ||
    row.executionRecord.solverWorkerInvocationCount > row.executionRecord.workerProcessInvocationCount ||
    row.executionRecord.productionInvocationCount > row.executionRecord.solverWorkerInvocationCount
  ) fail(`${label} worker/solver/production invocation counts are incoherent`);
  const governedInvocationElapsedNanoseconds = row.executableInvocationRecords.reduce(
    (total, invocation) => total + invocation.elapsedNanoseconds,
    0,
  );
  if (!Number.isSafeInteger(governedInvocationElapsedNanoseconds) ||
    row.executionRecord.governedInvocationElapsedNanoseconds !== governedInvocationElapsedNanoseconds) {
    fail(`${label}.governedInvocationElapsedNanoseconds differs from the exact governed leaf sum`);
  }
  if (row.executionRecord.governedInvocationWallSeconds !== governedInvocationElapsedNanoseconds / 1_000_000_000) {
    fail(`${label}.governedInvocationWallSeconds differs from integer governed elapsed nanoseconds`);
  }
  if (row.processHours !== governedInvocationElapsedNanoseconds / 3_600_000_000_000) {
    fail(`${label}.processHours differs from integer governed invocation elapsed nanoseconds`);
  }
  const invocationClassCounts = new Map<Phase10C0VS6ExecutableInvocationClass, number>();
  for (const invocation of row.executableInvocationRecords) {
    invocationClassCounts.set(
      invocation.invocationClass,
      (invocationClassCounts.get(invocation.invocationClass) ?? 0) + 1,
    );
  }
  if (
    (invocationClassCounts.get("solver-production") ?? 0) !== row.executionRecord.productionInvocationCount ||
    (invocationClassCounts.get("route-cause-evaluator") ?? 0) > row.executionRecord.discrepancyOrRefusalEvaluatorInvocationCount ||
    (invocationClassCounts.get("numerical-evaluator") ?? 0) !== row.executionRecord.numericalEvaluatorInvocationCount ||
    (invocationClassCounts.get("numerical-negative-control") ?? 0) !== row.executionRecord.numericalNegativeControlInvocationCount
  ) fail(`${label}.executableInvocationRecords differs from execution-record leaf counts`);
  const registeredCapInvocationCount = row.executableInvocationRecords.filter(
    (invocation) => invocation.terminalState === "registered-cap",
  ).length;
  if ((row.dispositionCode === "registered-cap-resource-refusal") !== (registeredCapInvocationCount === 1)) {
    fail(`${label} must contain exactly one registered-cap leaf exactly on registered-cap refusal`);
  }
  if (row.branch !== "independent-reference" && row.dispositionCode === "reference-discrepancy-refusal") {
    fail(`${label} discrepancy route must preserve the independent-reference science branch`);
  }
  if (row.layerId === "C0V-STATIC" && row.branch !== "reference-refusal") {
    fail(`${label} static branch must remain reference-refusal`);
  }
  if (row.layerId === "C0V-RADIAL" && row.branch !== "independent-reference") {
    fail(`${label} radial branch must remain independent-reference`);
  }
  if (row.layerId === "C0V-MOVING-EVENT" && row.branch !== "independent-reference") {
    fail(`${label} moving branch must remain independent-reference`);
  }
  if (row.dispositionCode === "reference-discrepancy-refusal" && row.layerId !== "C0V-MOVING-EVENT") {
    fail(`${label} reference discrepancy is selected only by the moving layer on frozen bytes`);
  }
  if (row.dispositionCode === "preimplementation-reference-refusal" && row.layerId !== "C0V-STATIC") {
    fail(`${label} preimplementation refusal is selected only by the static layer on frozen bytes`);
  }
  if (
    row.layerId !== "C0V-RADIAL" &&
    (row.dispositionCode === "production-complete" || row.dispositionCode === "preproduction-artifact-refusal")
  ) fail(`${label} current non-radial frozen route cannot select radial production/artifact outcomes`);
  if (row.dispositionCode === "production-complete") {
    if (row.exitCode !== 0) {
      fail(`${label} production exit/process-hour accounting differs`);
    }
  }
  if (
    row.dispositionCode === "reference-discrepancy-refusal" ||
    row.dispositionCode === "preimplementation-reference-refusal" ||
    row.dispositionCode === "preproduction-artifact-refusal" ||
    row.dispositionCode === "prelaunch-resource-refusal"
  ) {
    const hasScientificInvocation = row.executableInvocationRecords.some((invocation) =>
      invocation.invocationClass === "solver-production" ||
      invocation.invocationClass === "numerical-evaluator" ||
      invocation.invocationClass === "numerical-negative-control"
    );
    if (
      hasScientificInvocation ||
      row.executionRecord.solverWorkerInvocationCount !== 0 ||
      row.executionRecord.productionInvocationCount !== 0 ||
      row.executionRecord.numericalEvaluatorInvocationCount !== 0 ||
      row.executionRecord.numericalNegativeControlInvocationCount !== 0 ||
      row.executionRecord.acceptedValidWitnessCount !== 0 ||
      row.executionRecord.acceptedNumericalVerdictCount !== 0 ||
      !row.classificationValidation?.zeroScientificExecution
    ) fail(`${label} pre-scientific refusal must record zero scientific execution and credit`);
  }
  if (row.dispositionCode === "registered-cap-resource-refusal") {
    const cappedInvocation = row.executableInvocationRecords.find(
      (invocation) => invocation.terminalState === "registered-cap",
    );
    const expectedZeroScientificExecution = cappedInvocation?.invocationClass === "route-cause-evaluator";
    if (row.classificationValidation?.zeroScientificExecution !== expectedZeroScientificExecution) {
      fail(`${label} registered-cap refusal zero-science classification differs from its capped leaf`);
    }
  }
  if (row.classificationValidation !== null) {
    const evidenceById = new Map(row.classificationValidation.evidence.map((entry) => [entry.evidenceId, entry]));
    for (const observation of row.classificationValidation.observations) {
      if (!observation.evidenceIds.some((id) =>
        evidenceById.get(id)?.retentionClass !== "ignored-staging-corroboration")) {
        fail(`${label} scientific refusal observation is supported only by ignored staging`);
      }
    }
    if (row.classificationValidation.observations.every((entry) => entry.kind === "process-exit")) {
      fail(`${label} scientific route cannot be selected from exit status alone`);
    }
  }
  assertCountTuple(row);
  return row;
}

export function phase10C0VS6AssertNoFutureAttemptTimestamps(
  row: Phase10C0VS6AttemptRowV2,
  verifierNowMilliseconds: number,
  allowedClockSkewMilliseconds = 1_000,
): void {
  if (!Number.isSafeInteger(verifierNowMilliseconds) || verifierNowMilliseconds < 0 ||
    !Number.isSafeInteger(allowedClockSkewMilliseconds) || allowedClockSkewMilliseconds < 0) {
    fail("attempt timestamp verifier clock/skew is invalid");
  }
  const maximum = verifierNowMilliseconds + allowedClockSkewMilliseconds;
  const instants = [
    row.startedAt,
    row.finishedAt,
    ...row.executableInvocationRecords.flatMap((entry) => [entry.startedAt, entry.finishedAt]),
    ...row.resourceRecord.observations.map((entry) => entry.observedAt),
    ...(row.workerProgress?.records.map((entry) => entry.observedAt) ?? []),
  ];
  if (instants.some((instant) => Date.parse(instant) > maximum)) {
    fail("attempt retains a timestamp later than the verifier clock allowance");
  }
}

export function phase10C0VS6AttemptLedgerBytes(rows: readonly Phase10C0VS6AttemptRowV2[]): Uint8Array {
  if (rows.length !== 1) fail("execution-v2 v1 attempt ledger must contain exactly one registered attempt row");
  const seen = new Set<string>();
  const lines = rows.map((row, index) => {
    const parsed = parsePhase10C0VS6AttemptRowV2(row, `attempt ledger row[${index}]`);
    if (seen.has(parsed.attemptId)) fail(`attempt ledger repeats ${parsed.attemptId}`);
    seen.add(parsed.attemptId);
    return JSON.stringify(strictJsonSnapshot(parsed));
  });
  return new TextEncoder().encode(`${lines.join("\n")}\n`);
}

export function parsePhase10C0VS6AttemptLedgerV2(
  bytes: Uint8Array,
  label = "attempt ledger",
): readonly Phase10C0VS6AttemptRowV2[] {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    fail(`${label} is not valid UTF-8: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!text.endsWith("\n") || text.includes("\r")) fail(`${label} must be LF-terminated JSONL`);
  const lines = text.slice(0, -1).split("\n");
  if (lines.length !== 1 || lines.some((line) => line.length === 0)) {
    fail(`${label} must contain exactly one registered attempt row`);
  }
  const seen = new Set<string>();
  const rows = lines.map((line, index) => {
    let value: unknown;
    try {
      value = JSON.parse(line) as unknown;
    } catch (error) {
      fail(`${label}[${index}] is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
    const strict = strictJsonSnapshot(value);
    if (JSON.stringify(strict) !== line) fail(`${label}[${index}] is not canonical compact JSON`);
    const row = parsePhase10C0VS6AttemptRowV2(strict, `${label}[${index}]`);
    if (seen.has(row.attemptId)) fail(`${label} repeats attempt ${row.attemptId}`);
    seen.add(row.attemptId);
    return row;
  });
  return Object.freeze(rows);
}

export function parsePhase10C0VS6RadialResultV2(
  value: unknown,
  label = "radial result",
): Phase10C0VS6RadialResultV2 {
  const row = phase10C0VS6Object(value, label);
  phase10C0VS6ExactOrderedKeys(row, [
    "schema", "resultId", "layerId", "branch", "protocol", "referenceOrRefusal",
    "attemptLedger", "selectedAttemptId", "attemptDispositionCode", "witness", "evaluation",
    "terminalStatus", "scientificDisposition", "negativeControlDisposition", "resourceDisposition",
    "claimBoundary",
  ], label);
  if (row.schema !== "phase10-c0v-radial-result-v2" || row.layerId !== "C0V-RADIAL" || row.branch !== "independent-reference") {
    fail(`${label} identity/branch differs`);
  }
  const attemptDispositionCode = enumValue(row.attemptDispositionCode, [
    "production-complete", "preproduction-artifact-refusal", "prelaunch-resource-refusal",
    "registered-cap-resource-refusal",
  ] as const, `${label}.attemptDispositionCode`);
  const terminalStatus = enumValue(row.terminalStatus, ["pass", "fail", "refusal"] as const, `${label}.terminalStatus`);
  if (attemptDispositionCode === "production-complete") {
    if (terminalStatus !== "pass" && terminalStatus !== "fail") fail(`${label} production result must pass or fail`);
    if (row.witness === null || row.evaluation === null) fail(`${label} production result requires witness and evaluation`);
  } else {
    if (terminalStatus !== "refusal" || row.witness !== null || row.evaluation !== null) {
      fail(`${label} validated artifact/resource refusal requires null witness/evaluation and refusal status`);
    }
  }
  const boundary = phase10C0VS6Object(row.claimBoundary, `${label}.claimBoundary`);
  phase10C0VS6ExactOrderedKeys(boundary, ["allowed", "forbidden"], `${label}.claimBoundary`);
  const scientificDisposition = enumValue(
    row.scientificDisposition,
    ["pass", "fail", "refusal"] as const,
    `${label}.scientificDisposition`,
  );
  const negativeControlDisposition = enumValue(
    row.negativeControlDisposition,
    ["pass", "not-accepted-no-credit"] as const,
    `${label}.negativeControlDisposition`,
  );
  const resourceDisposition = enumValue(
    row.resourceDisposition,
    ["within-cap", "artifact-refusal", "prelaunch-resource-refusal", "registered-cap-resource-refusal"] as const,
    `${label}.resourceDisposition`,
  );
  const expectedResourceDisposition = attemptDispositionCode === "production-complete"
    ? "within-cap"
    : attemptDispositionCode === "preproduction-artifact-refusal"
      ? "artifact-refusal"
      : attemptDispositionCode;
  if (scientificDisposition !== terminalStatus || resourceDisposition !== expectedResourceDisposition) {
    fail(`${label} scientific/resource disposition differs from its terminal attempt disposition`);
  }
  if (
    (attemptDispositionCode === "production-complete" && negativeControlDisposition !== "pass") ||
    (attemptDispositionCode !== "production-complete" && negativeControlDisposition !== "not-accepted-no-credit")
  ) fail(`${label}.negativeControlDisposition differs from whether numerical controls ran for credit`);
  return Object.freeze({
    schema: "phase10-c0v-radial-result-v2",
    resultId: phase10C0VS6SafeToken(row.resultId, `${label}.resultId`),
    layerId: "C0V-RADIAL",
    branch: "independent-reference",
    protocol: parsePhase10C0VS6ArtifactIdentity(row.protocol, `${label}.protocol`),
    referenceOrRefusal: parsePhase10C0VS6ArtifactIdentity(row.referenceOrRefusal, `${label}.referenceOrRefusal`),
    attemptLedger: parsePhase10C0VS6ArtifactIdentity(row.attemptLedger, `${label}.attemptLedger`),
    selectedAttemptId: phase10C0VS6SafeToken(row.selectedAttemptId, `${label}.selectedAttemptId`),
    attemptDispositionCode,
    witness: row.witness === null ? null : parsePhase10C0VS6ArtifactIdentity(row.witness, `${label}.witness`),
    evaluation: row.evaluation === null ? null : parsePhase10C0VS6ArtifactIdentity(row.evaluation, `${label}.evaluation`),
    terminalStatus,
    scientificDisposition,
    negativeControlDisposition,
    resourceDisposition,
    claimBoundary: Object.freeze({
      allowed: phase10C0VS6SortedUniqueStrings(boundary.allowed, `${label}.claimBoundary.allowed`),
      forbidden: phase10C0VS6SortedUniqueStrings(boundary.forbidden, `${label}.claimBoundary.forbidden`),
    }),
  });
}

export interface Phase10C0VS6RadialPublicationEvaluation {
  readonly identity: Phase10C0VS6ArtifactIdentity;
  readonly scienceProtocol: Phase10C0VS6ArtifactIdentity;
  readonly reference: Phase10C0VS6ArtifactIdentity;
  readonly witness: Phase10C0VS6ArtifactIdentity;
  readonly numericalDisposition: "pass" | "fail";
  readonly negativeControlDisposition: "pass" | "fail";
}

export function phase10C0VS6ValidateRadialResultPublication(
  result: Phase10C0VS6RadialResultV2,
  attempts: readonly Phase10C0VS6AttemptRowV2[],
  expectedClaimBoundary: Readonly<{ readonly allowed: readonly string[]; readonly forbidden: readonly string[] }>,
  evaluation: Phase10C0VS6RadialPublicationEvaluation | null,
): Phase10C0VS6AttemptRowV2 {
  const selected = phase10C0VS6SelectedRadialAttempt(result, attempts);
  const exactBoundary = (actual: readonly string[], expected: readonly string[], label: string): void => {
    if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
      fail(`radial result ${label} differs from the publish protocol`);
    }
  };
  exactBoundary(result.claimBoundary.allowed, expectedClaimBoundary.allowed, "allowed claim boundary");
  exactBoundary(result.claimBoundary.forbidden, expectedClaimBoundary.forbidden, "forbidden claim boundary");
  if (result.attemptDispositionCode === "production-complete") {
    if (evaluation === null || result.evaluation === null || result.witness === null) {
      fail("production radial result lacks an independently parsed evaluation or witness");
    }
    phase10C0VS6SameIdentity(result.evaluation, evaluation.identity, "radial result evaluation");
    phase10C0VS6SameIdentity(result.witness, evaluation.witness, "radial result witness");
    phase10C0VS6SameIdentity(result.protocol, evaluation.scienceProtocol, "radial evaluation science protocol");
    phase10C0VS6SameIdentity(result.referenceOrRefusal, evaluation.reference, "radial evaluation reference");
    if (
      result.terminalStatus !== evaluation.numericalDisposition ||
      result.scientificDisposition !== evaluation.numericalDisposition ||
      evaluation.negativeControlDisposition !== "pass" ||
      result.negativeControlDisposition !== "pass" ||
      selected.executionRecord.acceptedValidWitnessCount !== 1 ||
      selected.executionRecord.acceptedNumericalVerdictCount !== 1 ||
      selected.executionRecord.numericalNegativeControlInvocationCount !== 3
    ) fail("radial result dispositions or accepted credit differ from evaluation/attempt bytes");
  } else if (
    evaluation !== null || selected.classificationValidation?.verdict !== "pass" ||
    selected.executionRecord.acceptedValidWitnessCount !== 0 ||
    selected.executionRecord.acceptedNumericalVerdictCount !== 0 ||
    result.scientificDisposition !== "refusal" ||
    result.negativeControlDisposition !== "not-accepted-no-credit"
  ) fail("radial refusal result differs from its independently validated selected attempt");
  return selected;
}

export function phase10C0VS6SelectedRadialAttempt(
  result: Phase10C0VS6RadialResultV2,
  attempts: readonly Phase10C0VS6AttemptRowV2[],
): Phase10C0VS6AttemptRowV2 {
  const matches = attempts.filter((row) => row.attemptId === result.selectedAttemptId);
  if (matches.length !== 1) fail("radial result must select exactly one durable attempt row");
  const selected = matches[0] as Phase10C0VS6AttemptRowV2;
  if (
    selected.layerId !== "C0V-RADIAL" ||
    selected.dispositionCode !== result.attemptDispositionCode ||
    selected.terminalStatus !== result.terminalStatus
  ) fail("radial result selected attempt/disposition differs");
  phase10C0VS6SameIdentity(result.protocol, selected.protocol, "radial result selected protocol");
  phase10C0VS6SameIdentity(result.referenceOrRefusal, selected.referenceOrRefusal, "radial result selected reference");
  return selected;
}
