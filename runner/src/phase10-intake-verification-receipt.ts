import { closeSync, existsSync, fsyncSync, openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  assertBranchAndClean,
  assertOnlyFrozenInputsChangedSinceFreeze,
  git,
  identityOf,
  loadIntakeAuthority,
  parseStrictJsonFile,
  readRegularFile,
  safeRepositoryPath,
} from "./phase10-intake-authority.ts";
import {
  PHASE10_AI_CHECK_IDS,
  PHASE10_AI_CHECK_WITNESSES,
  PHASE10_AI_OUTPUTS,
  PHASE10_AI_PRODUCE_COMMAND,
  PHASE10_AI_STATIC_ATTEMPT_ID,
  PHASE10_AI_VERIFY_COMMAND,
  PHASE10_AI_VERIFICATION_LIMITS,
  artifactTuple,
  lexical,
  parsePrettyJsonBytes,
  prettyJsonBytes,
  sha256Bytes,
  type ArtifactTuple,
} from "./phase10-intake-contracts.ts";
import type { Phase10AICheckResult, Phase10AIIndependentEvaluation, Phase10AIValidatedArtifact } from "./phase10-intake-verify.ts";
import { parsePhase10CallableRegistry, parsePhase10ObligationMatrix, parsePhase10PacketProtocol } from "./phase10-contracts.ts";
import { phase10ObligationRunPreflight } from "./phase10-obligation-preflight.ts";

const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json" as const;
const AI_INTAKE_PROTOCOL_IDENTITY = Object.freeze({ path: "research/phase10-execution-v1/packets/a-i/intake-protocol.json", byteLength: 26443, sha256: "6adffffdbd02b7e023072f2e096909f43ee557b1fcd45e7a0d7f52107f36fe78" });
const PROTOCOL_PATH = "research/phase10-execution-v1/packets/a-i/protocol.json" as const;
const REGISTRY_PATH = "research/phase10-execution-v1/packets/a-i/callable-registry.json" as const;
const EVALUATOR_ID = "phase10-ai-verifier" as const;
const EVALUATOR_MODULE = "runner/src/phase10-intake-verify.ts" as const;
const EVALUATOR_EXPORT = "phase10IntakeVerify" as const;
const WRITER_ID = "phase10-a-i-verification-receipt-writer" as const;
const WRITER_MODULE = "runner/src/phase10-intake-verification-receipt.ts" as const;
const WRITER_EXPORT = "writePhase10IntakeVerificationReceipt" as const;

export interface Phase10IntakeVerificationReceipt {
  readonly schema: "phase10-packet-verification-v1";
  readonly verificationId: "phase10-a-i-verification-v1";
  readonly matrixId: string;
  readonly protocolId: string;
  readonly registryId: string;
  readonly packetId: "a-i";
  readonly terminalState: "complete";
  readonly verifiedArtifacts: readonly Phase10AIValidatedArtifact[];
  readonly checkResults: readonly Phase10AICheckResult[];
  readonly executedNegativeControlIds: readonly string[];
  readonly negativeControlResults: readonly StrictJson[];
  readonly boundDependencyPacketIds: readonly string[];
  readonly execution: {
    readonly evaluatorCallableId: typeof EVALUATOR_ID;
    readonly modulePath: typeof EVALUATOR_MODULE;
    readonly exportName: typeof EVALUATOR_EXPORT;
    readonly byteLength: number;
    readonly sha256: string;
    readonly runtime: string;
    readonly command: typeof PHASE10_AI_VERIFY_COMMAND;
    readonly gitHead: string;
    readonly startedOn: string;
    readonly endedOn: string;
    readonly processConcurrency: 1;
  };
  readonly aggregateVerdict: "pass";
  readonly limits: readonly string[];
}

export interface Phase10IntakeVerificationWriteRequest {
  readonly repositoryRoot: string;
  readonly candidateDirectory: string;
  readonly evaluation: Phase10AIIndependentEvaluation;
  readonly command: string;
  readonly gitHead: string;
  readonly startedOn: string;
  readonly endedOn: string;
  readonly allowPublishedOutputs?: boolean;
}

function fail(message: string): never {
  throw new Error(`Phase 10 A-I verification receipt refused: ${message}`);
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(lexical);
  const wanted = [...expected].sort(lexical);
  if (actual.length !== wanted.length || actual.some((entry, index) => entry !== wanted[index])) fail(`${label} keys differ`);
}

function exactStrings(actual: readonly unknown[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) fail(`${label} differs`);
}

function timestamp(value: string, label: string): void {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) || Number.isNaN(Date.parse(value))) fail(`${label} must be an exact UTC timestamp`);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((entry, index) => entry === right[index]);
}

function sameTuple(actual: ArtifactTuple, expected: ArtifactTuple, label: string): void {
  if (actual.path !== expected.path || actual.byteLength !== expected.byteLength || actual.sha256 !== expected.sha256) fail(`${label} differs`);
}

function validateEvaluation(evaluation: Phase10AIIndependentEvaluation, root: string, candidateDirectory: string): void {
  if (evaluation.verdict !== "pass") fail("independent evaluation is not pass");
  exactStrings(evaluation.verifiedArtifacts.map((entry) => entry.outputId), PHASE10_AI_OUTPUTS.filter((entry) => entry.outputId !== "out-ai-verification").map((entry) => entry.outputId), "verified artifact IDs");
  for (const artifact of evaluation.verifiedArtifacts) {
    exactKeys(artifact as unknown as Record<string, unknown>, ["outputId", "path", "byteLength", "sha256"], `${artifact.outputId} verified artifact`);
    const registered = PHASE10_AI_OUTPUTS.find((entry) => entry.outputId === artifact.outputId);
    if (registered === undefined || registered.outputId === "out-ai-verification" || artifact.path !== registered.path) fail(`${artifact.outputId} is not a registered producer artifact`);
    const bytes = readRegularFile(root, `${candidateDirectory}/${registered.candidateName}`, `candidate ${registered.candidateName}`);
    sameTuple(Object.freeze({ path: artifact.path, byteLength: artifact.byteLength, sha256: artifact.sha256 }), Object.freeze({ path: registered.path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) }), `${artifact.outputId} reopened identity`);
  }
  exactStrings(evaluation.checkResults.map((entry) => entry.checkId), PHASE10_AI_CHECK_IDS, "check-result IDs");
  for (const result of evaluation.checkResults) {
    exactKeys(result as unknown as Record<string, unknown>, ["checkId", "verdict", "reasons", "witnessOutputIds"], `${result.checkId} check result`);
    if (result.verdict !== "pass" || result.reasons.length !== 0) fail(`${result.checkId} is not pass`);
    exactStrings(result.witnessOutputIds, PHASE10_AI_CHECK_WITNESSES[result.checkId], `${result.checkId} witness outputs`);
  }
  if (evaluation.executedNegativeControlIds.length !== 0 || evaluation.negativeControlResults.length !== 0) fail("A-I evaluation invents negative controls");
}

function validateRetainedPreflight(root: string, candidateDirectory: string, preflight: ReturnType<typeof phase10ObligationRunPreflight>): void {
  const bytes = readRegularFile(root, `${candidateDirectory}/preflight.json`, "A-I retained preflight");
  const row = object(parseStrictJsonFile(bytes, "A-I retained preflight"), "A-I retained preflight");
  exactKeys(row, ["schema", "receiptId", "matrixId", "protocolId", "registryId", "packetId", "attemptId", "stage", "observed", "outputIds", "checkIds", "negativeControlIds", "callableIds", "selectedBranches", "verdict", "reasons"], "A-I retained preflight");
  if (row.schema !== "phase10-preflight-receipt-v1" || row.receiptId !== `phase10-a-i-${PHASE10_AI_STATIC_ATTEMPT_ID}-preflight-v1` || row.packetId !== "a-i" || row.attemptId !== PHASE10_AI_STATIC_ATTEMPT_ID || row.stage !== "run" || row.verdict !== "pass" || row.matrixId !== preflight.matrixId || row.protocolId !== preflight.protocolId || row.registryId !== preflight.registryId) fail("retained preflight IDs or verdict differ");
  exactStrings(Array.isArray(row.outputIds) ? row.outputIds : [], preflight.outputIds, "retained preflight outputs");
  exactStrings(Array.isArray(row.checkIds) ? row.checkIds : [], preflight.checkIds, "retained preflight checks");
  exactStrings(Array.isArray(row.negativeControlIds) ? row.negativeControlIds : [], [], "retained preflight controls");
  exactStrings(Array.isArray(row.callableIds) ? row.callableIds : [], preflight.callableIds, "retained preflight callables");
  if (!Array.isArray(row.reasons) || row.reasons.length !== 0) fail("retained preflight has reasons");
  const observed = object(row.observed, "A-I retained preflight observed");
  exactKeys(observed, ["launchClass", "machineLaunchChecks", "branch", "head", "runtime", "command", "repositoryBundleRoot", "matrix", "protocol", "callableRegistry", "candidateDirectory", "registeredAttemptRoot", "finalPreflightReceiptPath", "finalTerminalReceiptPath", "verificationPaths", "dependencyPacketIds", "dependencyArtifacts"], "A-I retained preflight observed");
  if (observed.launchClass !== "static-contract" || observed.machineLaunchChecks !== "not-applicable" || observed.branch !== "phase10/evidence-verification" || observed.head !== git(root, ["rev-parse", "HEAD"]) || observed.runtime !== process.version || observed.command !== PHASE10_AI_PRODUCE_COMMAND || observed.repositoryBundleRoot !== "." || observed.candidateDirectory !== candidateDirectory || observed.registeredAttemptRoot !== "out/phase10-execution-v1/attempts/a-i" || observed.finalPreflightReceiptPath !== "evidence/phase10-obligation-preflight-v1/packets/a-i/preflight.json" || observed.finalTerminalReceiptPath !== "evidence/phase10-obligation-preflight-v1/packets/a-i/terminal-receipt.json") fail("retained preflight observed provenance differs");
  exactStrings(Array.isArray(observed.verificationPaths) ? observed.verificationPaths : [], ["evidence/phase10-scope-intake-v1/intake-verification.json"], "retained preflight verification paths");
  exactStrings(Array.isArray(observed.dependencyPacketIds) ? observed.dependencyPacketIds : [], ["a-p"], "retained preflight dependencies");
  if (!Array.isArray(observed.dependencyArtifacts) || observed.dependencyArtifacts.length !== 1) fail("retained preflight dependency artifact binding differs");
  sameTuple(artifactTuple(observed.matrix, "retained preflight matrix"), identityOf(root, MATRIX_PATH, "matrix"), "retained preflight matrix");
  sameTuple(artifactTuple(observed.protocol, "retained preflight protocol"), identityOf(root, PROTOCOL_PATH, "packet protocol"), "retained preflight protocol");
  sameTuple(artifactTuple(observed.callableRegistry, "retained preflight registry"), identityOf(root, REGISTRY_PATH, "callable registry"), "retained preflight registry");
}

function existingTimes(path: string): { readonly startedOn: string; readonly endedOn: string } | null {
  if (!existsSync(path)) return null;
  const value = object(parsePrettyJsonBytes(new Uint8Array(readFileSync(path)), "existing A-I verification receipt"), "existing A-I verification receipt");
  const execution = object(value.execution, "existing A-I verification execution");
  const startedOn = String(execution.startedOn);
  const endedOn = String(execution.endedOn);
  timestamp(startedOn, "existing verification startedOn");
  timestamp(endedOn, "existing verification endedOn");
  return Object.freeze({ startedOn, endedOn });
}

/** Write or exactly resume the generic A-I packet-verification receipt. */
export function writePhase10IntakeVerificationReceipt(request: Phase10IntakeVerificationWriteRequest): Phase10IntakeVerificationReceipt {
  if (request.candidateDirectory !== "out/phase10-scope-intake-v1-a-i-candidate" || request.command !== PHASE10_AI_VERIFY_COMMAND) fail("verification command or candidate differs");
  timestamp(request.startedOn, "startedOn");
  timestamp(request.endedOn, "endedOn");
  if (request.endedOn < request.startedOn) fail("endedOn precedes startedOn");
  const root = resolve(request.repositoryRoot);
  assertBranchAndClean(root, request.allowPublishedOutputs === true ? [
    ...PHASE10_AI_OUTPUTS.map((entry) => entry.path),
    "evidence/phase10-obligation-preflight-v1/packets/a-i/preflight.json",
    "evidence/phase10-obligation-preflight-v1/packets/a-i/terminal-receipt.json",
  ] : []);
  const authority = loadIntakeAuthority(root, AI_INTAKE_PROTOCOL_IDENTITY);
  assertOnlyFrozenInputsChangedSinceFreeze(authority);
  if (request.gitHead !== authority.head || request.gitHead !== git(root, ["rev-parse", "HEAD"])) fail("verification gitHead differs from current committed input checkpoint");
  const matrixValue = parseStrictJsonFile(readRegularFile(root, MATRIX_PATH, "A-I matrix"), "A-I matrix");
  const protocolValue = parseStrictJsonFile(readRegularFile(root, PROTOCOL_PATH, "A-I packet protocol"), "A-I packet protocol");
  const registryValue = parseStrictJsonFile(readRegularFile(root, REGISTRY_PATH, "A-I callable registry"), "A-I callable registry");
  const matrix = parsePhase10ObligationMatrix(matrixValue);
  const protocol = parsePhase10PacketProtocol(protocolValue);
  const registry = parsePhase10CallableRegistry(registryValue);
  const preflight = phase10ObligationRunPreflight(matrixValue, protocolValue, registryValue, root);
  validateRetainedPreflight(root, request.candidateDirectory, preflight);
  validateEvaluation(request.evaluation, root, request.candidateDirectory);
  const evaluator = registry.callables.find((entry) => entry.callableId === EVALUATOR_ID);
  if (evaluator === undefined || evaluator.role !== "independent-evaluator" || evaluator.resolution !== "resolved" || evaluator.identity === null || evaluator.modulePath !== EVALUATOR_MODULE || evaluator.exportName !== EVALUATOR_EXPORT) fail("registered independent evaluator differs");
  const evaluatorIdentity = identityOf(root, EVALUATOR_MODULE, "A-I evaluator module");
  if (evaluator.identity.byteLength !== evaluatorIdentity.byteLength || evaluator.identity.sha256 !== evaluatorIdentity.sha256) fail("evaluator bytes differ from registry");
  const writer = registry.callables.find((entry) => entry.callableId === WRITER_ID);
  if (writer === undefined || writer.role !== "producer" || writer.resolution !== "resolved" || writer.identity === null || writer.modulePath !== WRITER_MODULE || writer.exportName !== WRITER_EXPORT || writer.producedOutputIds.length !== 1 || writer.producedOutputIds[0] !== "out-ai-verification") fail("registered verification receipt writer differs");
  const target = safeRepositoryPath(root, `${request.candidateDirectory}/intake-verification.json`, "A-I verification receipt");
  const retainedTimes = existingTimes(target);
  const startedOn = retainedTimes?.startedOn ?? request.startedOn;
  const endedOn = retainedTimes?.endedOn ?? request.endedOn;
  const receipt = Object.freeze({
    schema: "phase10-packet-verification-v1" as const,
    verificationId: "phase10-a-i-verification-v1" as const,
    matrixId: matrix.matrixId,
    protocolId: protocol.protocolId,
    registryId: registry.registryId,
    packetId: "a-i" as const,
    terminalState: "complete" as const,
    verifiedArtifacts: request.evaluation.verifiedArtifacts,
    checkResults: request.evaluation.checkResults,
    executedNegativeControlIds: request.evaluation.executedNegativeControlIds,
    negativeControlResults: request.evaluation.negativeControlResults,
    boundDependencyPacketIds: protocol.boundDependencyPacketIds,
    execution: Object.freeze({ evaluatorCallableId: EVALUATOR_ID, modulePath: EVALUATOR_MODULE, exportName: EVALUATOR_EXPORT, byteLength: evaluatorIdentity.byteLength, sha256: evaluatorIdentity.sha256, runtime: process.version, command: PHASE10_AI_VERIFY_COMMAND, gitHead: authority.head, startedOn, endedOn, processConcurrency: 1 as const }),
    aggregateVerdict: "pass" as const,
    limits: PHASE10_AI_VERIFICATION_LIMITS,
  }) satisfies Phase10IntakeVerificationReceipt;
  const bytes = prettyJsonBytes(receipt);
  if (existsSync(target)) {
    if (!sameBytes(new Uint8Array(readFileSync(target)), bytes)) fail("existing verification receipt differs from exact idempotent result");
    return receipt;
  }
  let descriptor: number | undefined;
  let created = false;
  try {
    descriptor = openSync(target, "wx");
    created = true;
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    if (!sameBytes(new Uint8Array(readFileSync(target)), bytes)) fail("verification receipt readback differs");
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    if (created) unlinkSync(target);
    throw error;
  }
  return receipt;
}
