import {
  closeSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import {
  canonicalJsonBytes,
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  parsePhase10CallableRegistry,
  parsePhase10ObligationMatrix,
  parsePhase10PacketProtocol,
} from "./phase10-contracts.ts";
import { phase10ObligationRunPreflight } from "./phase10-obligation-preflight.ts";
import type {
  Phase10ApMutationWitness,
  Phase10ApNegativeControlReceipt,
} from "./phase10-ap-negative-controls.ts";

const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json" as const;
const PROTOCOL_PATH = "research/phase10-execution-v1/packets/a-p/protocol.json" as const;
const REGISTRY_PATH = "research/phase10-execution-v1/packets/a-p/callable-registry.json" as const;
const EVALUATOR_ID = "phase10-ap-evaluator" as const;
const EVALUATOR_MODULE = "runner/src/phase10-ap-independent.ts" as const;
const EVALUATOR_EXPORT = "independentlyVerifyPhase10ApArtifacts" as const;
const RECEIPT_FILE = "verification.json" as const;
const PREFLIGHT_FILE = "preflight.json" as const;
const ATTEMPT_ID = "s1-static-20260821-v1" as const;
const EXPECTED_BRANCH = "phase10/evidence-verification" as const;
const EXPECTED_RUNTIME = "v24.13.1" as const;
const PRODUCE_COMMAND =
  "node runner/src/phase10-ap-publish.ts produce --repository-root . --out out/phase10-obligation-preflight-v1-candidate" as const;
const VERIFY_COMMAND =
  "node runner/src/phase10-ap-independent.ts verify --repository-root . --bundle out/phase10-obligation-preflight-v1-candidate --receipt out/phase10-obligation-preflight-v1-candidate/verification.json" as const;
const CANDIDATE_FILES: Readonly<Record<string, string>> = Object.freeze({
  "out-ap-artifact-index": "artifact-index.json",
  "out-ap-missing-producer-receipt": "missing-producer.json",
  "out-ap-uncalled-check-receipt": "uncalled-check.json",
});

type JsonObject = { readonly [key: string]: StrictJson };

export interface Phase10ApVerifiedArtifact {
  readonly outputId: string;
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10ApCheckResult {
  readonly checkId: string;
  readonly verdict: "pass" | "fail" | "refusal";
  readonly reasons: readonly string[];
  readonly witnessOutputIds: readonly string[];
}

export interface Phase10ApNegativeControlResult {
  readonly negativeControlId: string;
  readonly mutationExecuted: boolean;
  readonly rejected: boolean;
  readonly beforeWitness: Phase10ApMutationWitness;
  readonly afterWitness: Phase10ApMutationWitness;
  readonly errors: readonly string[];
}

export interface Phase10ApIndependentEvaluation {
  readonly verdict: "pass" | "fail" | "refusal";
  readonly verifiedArtifacts: readonly Phase10ApVerifiedArtifact[];
  readonly checkResults: readonly Phase10ApCheckResult[];
  readonly executedNegativeControlIds: readonly string[];
  readonly negativeControlResults: readonly Phase10ApNegativeControlResult[];
}

export interface Phase10PacketVerificationReceipt {
  readonly schema: "phase10-packet-verification-v1";
  readonly verificationId: string;
  readonly matrixId: string;
  readonly protocolId: string;
  readonly registryId: string;
  readonly packetId: string;
  readonly terminalState: "pass" | "fail" | "refusal";
  readonly verifiedArtifacts: readonly Phase10ApVerifiedArtifact[];
  readonly checkResults: readonly Phase10ApCheckResult[];
  readonly executedNegativeControlIds: readonly string[];
  readonly negativeControlResults: readonly Phase10ApNegativeControlResult[];
  readonly boundDependencyPacketIds: readonly string[];
  readonly execution: {
    readonly evaluatorCallableId: string;
    readonly modulePath: string;
    readonly exportName: string;
    readonly byteLength: number;
    readonly sha256: string;
    readonly runtime: string;
    readonly command: string;
    readonly gitHead: string;
    readonly startedOn: string;
    readonly endedOn: string;
    readonly processConcurrency: number;
  };
  readonly aggregateVerdict: "pass" | "fail" | "refusal";
  readonly limits: readonly string[];
}

export interface Phase10PacketVerificationWriteRequest {
  readonly repositoryRoot: string;
  readonly candidateDirectory: string;
  readonly evaluation: Phase10ApIndependentEvaluation;
  readonly command: string;
  readonly gitHead: string;
  readonly startedOn: string;
  readonly endedOn: string;
}

function fail(message: string): never {
  throw new Error(`Phase 10 packet verification receipt refused: ${message}`);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function exactKeys(value: object, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(compareText);
  const wanted = [...expected].sort(compareText);
  if (actual.length !== wanted.length || actual.some((entry, index) => entry !== wanted[index])) {
    fail(`${label} fields differ`);
  }
}

function exactSortedStrings(actual: readonly string[], expected: readonly string[], label: string): void {
  if (
    actual.length !== expected.length ||
    actual.some((entry, index) => entry !== expected[index]) ||
    new Set(actual).size !== actual.length ||
    actual.some((entry, index) => index > 0 && actual[index - 1]! >= entry)
  ) {
    fail(`${label} differs from the exact sorted roster`);
  }
}

function timestamp(value: string, label: string): void {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    fail(`${label} must be an exact UTC ISO timestamp`);
  }
}

function safeRepositoryFile(repositoryRootValue: string, path: string): Uint8Array {
  if (
    isAbsolute(path) || path.includes("\\") || path.startsWith("/") || path.endsWith("/") ||
    path.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    fail(`${path} is not a safe repository-relative file path`);
  }
  const repositoryRoot = realpathSync(resolve(repositoryRootValue));
  const absolute = resolve(repositoryRoot, path);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${path} must be a regular non-symlink file`);
  const physical = realpathSync(absolute);
  const fromRoot = relative(repositoryRoot, physical).replaceAll("\\", "/");
  if (fromRoot !== path) {
    fail(`${path} resolves outside or aliases within the repository`);
  }
  return new Uint8Array(readFileSync(physical));
}

function safeCandidateDirectory(repositoryRootValue: string, candidateValue: string): string {
  const repositoryRoot = realpathSync(resolve(repositoryRootValue));
  const candidate = realpathSync(resolve(repositoryRoot, candidateValue));
  const stat = lstatSync(candidate);
  const fromRoot = relative(repositoryRoot, candidate);
  if (
    !stat.isDirectory() || stat.isSymbolicLink() || fromRoot === "" || fromRoot === ".." ||
    fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(fromRoot)
  ) {
    fail("candidate directory must be a non-symlink directory below the repository root");
  }
  return candidate;
}

function prettyJson(bytes: Uint8Array, label: string): StrictJson {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} is not valid UTF-8`);
  }
  if (text.includes("\r")) fail(`${label} must use LF line endings`);
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    fail(`${label} is not valid JSON`);
  }
  const snapshot = strictJsonSnapshot(value);
  if (text !== `${JSON.stringify(snapshot, null, 2)}\n`) {
    fail(`${label} is not exact two-space JSON with one terminal LF`);
  }
  return snapshot;
}

function prettyJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((entry, index) => entry === right[index]);
}

function git(repositoryRoot: string, args: readonly string[]): string {
  const result = spawnSync("git", args, { cwd: repositoryRoot, encoding: "utf8" });
  if (result.error !== undefined || result.status !== 0) {
    fail(`git ${args.join(" ")} failed: ${(result.stderr || result.error?.message || "unknown error").trim()}`);
  }
  return result.stdout.trim();
}

function safeCandidateFile(candidateDirectory: string, path: string, label: string): Uint8Array {
  const absolute = resolve(candidateDirectory, path);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} must be a regular non-symlink candidate file`);
  const physical = realpathSync(absolute);
  const fromCandidate = relative(candidateDirectory, physical).replaceAll("\\", "/");
  if (fromCandidate !== path) fail(`${label} resolves outside or aliases within the candidate`);
  return new Uint8Array(readFileSync(physical));
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(strictJsonSnapshot(left)) === JSON.stringify(strictJsonSnapshot(right));
}

function exactIdentity(value: StrictJson | undefined, path: string, bytes: Uint8Array, label: string): void {
  if (value === null || Array.isArray(value) || typeof value !== "object") fail(`${label} must be an object`);
  const identity = value as JsonObject;
  exactKeys(identity, ["path", "byteLength", "sha256"], label);
  if (identity.path !== path || identity.byteLength !== bytes.byteLength || identity.sha256 !== sha256Bytes(bytes)) {
    fail(`${label} differs from reopened bytes`);
  }
}

function validateEvaluation(
  evaluation: Phase10ApIndependentEvaluation,
  activeOutputIds: readonly string[],
  activeCheckIds: readonly string[],
  activeControlIds: readonly string[],
  repositoryRoot: string,
  candidateDirectory: string,
  matrixValue: StrictJson,
): void {
  const expectedVerifiedIds = activeOutputIds.filter((outputId) =>
    outputId !== "out-ap-verification" && outputId !== "out-ap-self-execution-receipt");
  exactSortedStrings(
    evaluation.verifiedArtifacts.map((entry) => entry.outputId),
    expectedVerifiedIds,
    "verified artifact IDs",
  );
  const matrix = parsePhase10ObligationMatrix(matrixValue);
  for (const artifact of evaluation.verifiedArtifacts) {
    exactKeys(artifact, ["outputId", "path", "byteLength", "sha256"], `${artifact.outputId} verified artifact`);
    const contract = matrix.outputs.find((entry) => entry.packetId === "a-p" && entry.outputId === artifact.outputId);
    if (contract === undefined || contract.artifact.field !== null || artifact.path !== contract.artifact.path) {
      fail(`${artifact.outputId} verified artifact path differs from the frozen matrix`);
    }
    const candidatePath = CANDIDATE_FILES[artifact.outputId];
    const bytes = candidatePath === undefined
      ? safeRepositoryFile(repositoryRoot, contract.artifact.path)
      : safeCandidateFile(candidateDirectory, candidatePath, artifact.outputId);
    if (artifact.byteLength !== bytes.byteLength || artifact.sha256 !== sha256Bytes(bytes)) {
      fail(`${artifact.outputId} verified identity differs from reopened bytes`);
    }
  }
  exactSortedStrings(
    evaluation.checkResults.map((entry) => entry.checkId),
    activeCheckIds,
    "check-result IDs",
  );
  exactSortedStrings(evaluation.executedNegativeControlIds, activeControlIds, "executed controls");
  exactSortedStrings(
    evaluation.negativeControlResults.map((entry) => entry.negativeControlId),
    activeControlIds,
    "negative-control result IDs",
  );
  const allowedWitnessIds = new Set(expectedVerifiedIds);
  for (const result of evaluation.checkResults) {
    exactKeys(result, ["checkId", "verdict", "reasons", "witnessOutputIds"], `${result.checkId} result`);
    const reasons = [...result.reasons].sort(compareText);
    const witnesses = [...result.witnessOutputIds].sort(compareText);
    exactSortedStrings(result.reasons, reasons, `${result.checkId} reasons`);
    exactSortedStrings(result.witnessOutputIds, witnesses, `${result.checkId} witnesses`);
    if (result.witnessOutputIds.length === 0 || result.witnessOutputIds.some((id) => !allowedWitnessIds.has(id))) {
      fail(`${result.checkId} has an invalid witness-output roster`);
    }
    if ((result.verdict === "pass") !== (result.reasons.length === 0)) {
      fail(`${result.checkId} verdict differs from its reasons`);
    }
  }
  const verifiedById = new Map(evaluation.verifiedArtifacts.map((entry) => [entry.outputId, entry]));
  for (const control of evaluation.negativeControlResults) {
    exactKeys(
      control,
      ["negativeControlId", "mutationExecuted", "rejected", "beforeWitness", "afterWitness", "errors"],
      `${control.negativeControlId} result`,
    );
    const before = control.beforeWitness;
    const after = control.afterWitness;
    const registered = verifiedById.get(before.artifactId);
    if (
      registered === undefined || registered.path !== before.path || registered.byteLength !== before.byteLength ||
      registered.sha256 !== before.sha256 || after.artifactId !== before.artifactId ||
      after.sha256 === before.sha256 ||
      after.semanticFingerprint.sha256 === before.semanticFingerprint.sha256
    ) {
      fail(`${control.negativeControlId} mutation witnesses are not independently bound`);
    }
    for (const witness of [before, after]) {
      if (witness.semanticFingerprint.sha256 !== sha256Bytes(canonicalJsonBytes(witness.semanticFingerprint.projection))) {
        fail(`${control.negativeControlId} semantic fingerprint differs`);
      }
    }
    const errors = [...control.errors].sort(compareText);
    exactSortedStrings(control.errors, errors, `${control.negativeControlId} errors`);
    if ((control.mutationExecuted && control.rejected) !== (control.errors.length === 0)) {
      fail(`${control.negativeControlId} flags differ from its errors`);
    }
  }
  const pass = evaluation.checkResults.every((entry) => entry.verdict === "pass") &&
    evaluation.negativeControlResults.every((entry) =>
      entry.mutationExecuted && entry.rejected && entry.errors.length === 0);
  if ((evaluation.verdict === "pass") !== pass) fail("aggregate evaluation verdict differs");
  strictJsonSnapshot(evaluation);
}

/** Write the generic packet-verification receipt from an independently derived A-P evaluation. */
export function writePhase10PacketVerificationReceipt(
  request: Phase10PacketVerificationWriteRequest,
): Phase10PacketVerificationReceipt {
  timestamp(request.startedOn, "startedOn");
  timestamp(request.endedOn, "endedOn");
  if (Date.parse(request.endedOn) < Date.parse(request.startedOn)) fail("endedOn precedes startedOn");
  if (!/^[0-9a-f]{40}$/u.test(request.gitHead)) fail("gitHead must be a lowercase 40-character hash");
  if (request.command !== VERIFY_COMMAND) fail("command differs from the frozen A-P verify command");

  const repositoryRoot = realpathSync(resolve(request.repositoryRoot));
  const candidateDirectory = safeCandidateDirectory(repositoryRoot, request.candidateDirectory);
  if (process.version !== EXPECTED_RUNTIME) fail(`runtime ${process.version} differs from ${EXPECTED_RUNTIME}`);
  if (git(repositoryRoot, ["branch", "--show-current"]) !== EXPECTED_BRANCH) fail("verification branch differs");
  if (git(repositoryRoot, ["status", "--porcelain=v1", "--untracked-files=all"]).length !== 0) {
    fail("verification receipt requires a clean worktree");
  }
  const currentHead = git(repositoryRoot, ["rev-parse", "HEAD"]);
  if (request.gitHead !== currentHead) fail("verification gitHead is not the current committed head");
  const matrixBytes = safeRepositoryFile(repositoryRoot, MATRIX_PATH);
  const protocolBytes = safeRepositoryFile(repositoryRoot, PROTOCOL_PATH);
  const registryBytes = safeRepositoryFile(repositoryRoot, REGISTRY_PATH);
  const matrixValue = prettyJson(matrixBytes, "A-P obligation matrix");
  const protocolValue = prettyJson(protocolBytes, "A-P packet protocol");
  const registryValue = prettyJson(registryBytes, "A-P callable registry");
  const preflight = phase10ObligationRunPreflight(
    matrixValue,
    protocolValue,
    registryValue,
    repositoryRoot,
  );
  const matrix = parsePhase10ObligationMatrix(matrixValue);
  const protocol = parsePhase10PacketProtocol(protocolValue);
  const registry = parsePhase10CallableRegistry(registryValue);
  validateEvaluation(
    request.evaluation,
    preflight.outputIds,
    preflight.checkIds,
    preflight.negativeControlIds,
    repositoryRoot,
    candidateDirectory,
    matrixValue,
  );

  const retainedPreflight = prettyJson(
    safeCandidateFile(candidateDirectory, PREFLIGHT_FILE, "A-P retained preflight"),
    "A-P retained preflight",
  );
  const preflightRecord = retainedPreflight === null || Array.isArray(retainedPreflight) || typeof retainedPreflight !== "object"
    ? fail("A-P retained preflight must be an object")
    : retainedPreflight as JsonObject;
  exactKeys(
    preflightRecord,
    [
      "schema", "receiptId", "matrixId", "protocolId", "registryId", "packetId", "attemptId",
      "stage", "observed", "outputIds", "checkIds", "negativeControlIds", "callableIds",
      "selectedBranches", "verdict", "reasons",
    ],
    "A-P retained preflight",
  );
  const observed = preflightRecord.observed;
  if (observed === null || Array.isArray(observed) || typeof observed !== "object") {
    fail("A-P retained preflight observed predicates must be an object");
  }
  const observedRecord = observed as JsonObject;
  exactKeys(
    observedRecord,
    [
      "launchClass", "machineLaunchChecks", "branch", "head", "runtime", "command",
      "repositoryBundleRoot", "matrix", "protocol", "callableRegistry", "candidateDirectory",
      "registeredAttemptRoot", "finalPreflightReceiptPath", "finalTerminalReceiptPath",
      "verificationPaths", "dependencyPacketIds", "dependencyArtifacts",
    ],
    "A-P retained preflight observed predicates",
  );
  if (
    preflightRecord.schema !== "phase10-preflight-receipt-v1" || preflightRecord.packetId !== "a-p" ||
    preflightRecord.receiptId !== `phase10-a-p-${ATTEMPT_ID}-preflight-v1` ||
    preflightRecord.attemptId !== ATTEMPT_ID ||
    preflightRecord.stage !== "run" || preflightRecord.verdict !== "pass" ||
    preflightRecord.matrixId !== preflight.matrixId || preflightRecord.protocolId !== preflight.protocolId ||
    preflightRecord.registryId !== preflight.registryId || !sameJson(preflightRecord.outputIds, preflight.outputIds) ||
    !sameJson(preflightRecord.checkIds, preflight.checkIds) ||
    !sameJson(preflightRecord.negativeControlIds, preflight.negativeControlIds) ||
    !sameJson(preflightRecord.callableIds, preflight.callableIds) ||
    !sameJson(preflightRecord.selectedBranches, preflight.selectedBranches) ||
    !sameJson(preflightRecord.reasons, []) ||
    observedRecord.branch !== EXPECTED_BRANCH || observedRecord.head !== currentHead ||
    observedRecord.runtime !== process.version || observedRecord.command !== PRODUCE_COMMAND ||
    observedRecord.repositoryBundleRoot !== "." || observedRecord.candidateDirectory !== request.candidateDirectory
  ) {
    fail("A-P retained preflight differs from the current frozen verification run");
  }
  if (
    observedRecord.launchClass !== "static-contract" || observedRecord.machineLaunchChecks !== "not-applicable" ||
    observedRecord.registeredAttemptRoot !== "out/phase10-execution-v1/attempts/a-p" ||
    observedRecord.finalPreflightReceiptPath !== "evidence/phase10-obligation-preflight-v1/packets/a-p/preflight.json" ||
    observedRecord.finalTerminalReceiptPath !== "evidence/phase10-obligation-preflight-v1/packets/a-p/terminal-receipt.json" ||
    !sameJson(observedRecord.verificationPaths, ["evidence/phase10-obligation-preflight-v1/verification.json"]) ||
    !sameJson(observedRecord.dependencyPacketIds, []) || !sameJson(observedRecord.dependencyArtifacts, [])
  ) {
    fail("A-P retained preflight registered paths or dependency observations differ");
  }
  exactIdentity(observedRecord.matrix, MATRIX_PATH, matrixBytes, "retained preflight matrix identity");
  exactIdentity(observedRecord.protocol, PROTOCOL_PATH, protocolBytes, "retained preflight protocol identity");
  exactIdentity(observedRecord.callableRegistry, REGISTRY_PATH, registryBytes, "retained preflight registry identity");

  const evaluator = registry.callables.find((entry) => entry.callableId === EVALUATOR_ID);
  if (
    evaluator === undefined || evaluator.role !== "independent-evaluator" || evaluator.resolution !== "resolved" ||
    evaluator.identity === null || evaluator.modulePath !== EVALUATOR_MODULE || evaluator.exportName !== EVALUATOR_EXPORT
  ) {
    fail("independent evaluator binding differs from the frozen registry");
  }
  const evaluatorBytes = safeRepositoryFile(repositoryRoot, EVALUATOR_MODULE);
  if (evaluator.identity.byteLength !== evaluatorBytes.byteLength || evaluator.identity.sha256 !== sha256Bytes(evaluatorBytes)) {
    fail("independent evaluator byte identity differs from the registry");
  }
  const writer = registry.callables.find((entry) => entry.callableId === "phase10-a-p-verification-receipt-writer");
  if (
    writer === undefined || writer.role !== "producer" || writer.resolution !== "resolved" || writer.identity === null ||
    writer.modulePath !== "runner/src/phase10-verification-receipt.ts" ||
    writer.exportName !== "writePhase10PacketVerificationReceipt" ||
    writer.producedOutputIds.length !== 1 || writer.producedOutputIds[0] !== "out-ap-verification"
  ) {
    fail("verification receipt writer binding differs from the frozen registry");
  }

  const receipt = Object.freeze({
    schema: "phase10-packet-verification-v1" as const,
    verificationId: "phase10-a-p-verification-v1",
    matrixId: matrix.matrixId,
    protocolId: protocol.protocolId,
    registryId: registry.registryId,
    packetId: "a-p",
    terminalState: request.evaluation.verdict,
    verifiedArtifacts: request.evaluation.verifiedArtifacts,
    checkResults: request.evaluation.checkResults,
    executedNegativeControlIds: request.evaluation.executedNegativeControlIds,
    negativeControlResults: request.evaluation.negativeControlResults,
    boundDependencyPacketIds: protocol.boundDependencyPacketIds,
    execution: Object.freeze({
      evaluatorCallableId: EVALUATOR_ID,
      modulePath: EVALUATOR_MODULE,
      exportName: EVALUATOR_EXPORT,
      byteLength: evaluatorBytes.byteLength,
      sha256: sha256Bytes(evaluatorBytes),
      runtime: process.version,
      command: request.command,
      gitHead: request.gitHead,
      startedOn: request.startedOn,
      endedOn: request.endedOn,
      processConcurrency: 1,
    }),
    aggregateVerdict: request.evaluation.verdict,
    limits: Object.freeze([
      "A-P establishes registered-obligation completeness only; it does not establish scientific correctness.",
      "The verification excludes the later A-P terminal receipt by the frozen acyclic output DAG; that receipt binds this verification.",
    ].sort(compareText)),
  }) satisfies Phase10PacketVerificationReceipt;
  const bytes = prettyJsonBytes(receipt);
  const path = resolve(candidateDirectory, RECEIPT_FILE);
  let descriptor: number | undefined;
  let created = false;
  try {
    descriptor = openSync(path, "wx");
    created = true;
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    const reopened = new Uint8Array(readFileSync(path));
    if (!sameBytes(reopened, bytes)) fail("verification receipt readback differs");
    prettyJson(reopened, "A-P verification receipt readback");
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    if (created) unlinkSync(path);
    throw error;
  }
  return receipt;
}

export type { Phase10ApNegativeControlReceipt };
import { spawnSync } from "node:child_process";
