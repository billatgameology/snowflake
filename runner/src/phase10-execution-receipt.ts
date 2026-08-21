import { spawnSync } from "node:child_process";
import {
  closeSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { sha256Bytes, strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  PHASE10_EXECUTION_RECEIPT_SCHEMA,
  parsePhase10CallableRegistry,
  parsePhase10ExecutionReceipt,
  type Phase10ExecutionReceipt,
} from "./phase10-contracts.ts";
import {
  phase10ObligationReceiptPreflight,
  phase10ObligationRunPreflight,
} from "./phase10-obligation-preflight.ts";
import { independentlyVerifyPhase10ApArtifacts } from "./phase10-ap-independent.ts";

const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json" as const;
const PROTOCOL_PATH = "research/phase10-execution-v1/packets/a-p/protocol.json" as const;
const REGISTRY_PATH = "research/phase10-execution-v1/packets/a-p/callable-registry.json" as const;
const VERIFICATION_FILE = "verification.json" as const;
const PREFLIGHT_FILE = "preflight.json" as const;
const TERMINAL_RELATIVE_PATH = "terminal-receipt.json" as const;
const ATTEMPT_ID = "s1-static-20260821-v1" as const;
const EXPECTED_BRANCH = "phase10/evidence-verification" as const;
const EXPECTED_RUNTIME = "v24.13.1" as const;
const PRODUCE_COMMAND =
  "node runner/src/phase10-ap-publish.ts produce --repository-root . --out out/phase10-obligation-preflight-v1-candidate" as const;
const VERIFY_COMMAND =
  "node runner/src/phase10-ap-independent.ts verify --repository-root . --bundle out/phase10-obligation-preflight-v1-candidate --receipt out/phase10-obligation-preflight-v1-candidate/verification.json" as const;
const EXPECTED_VERIFICATION_ID = "phase10-a-p-verification-v1" as const;
const EXPECTED_VERIFICATION_LIMITS = Object.freeze([
  "A-P establishes registered-obligation completeness only; it does not establish scientific correctness.",
  "The verification excludes the later A-P terminal receipt by the frozen acyclic output DAG; that receipt binds this verification.",
]);
const ALLOWED_PUBLISHED_PATHS = Object.freeze([
  "evidence/phase10-obligation-preflight-v1/artifact-index.json",
  "evidence/phase10-obligation-preflight-v1/missing-producer.json",
  "evidence/phase10-obligation-preflight-v1/packets/a-p/preflight.json",
  "evidence/phase10-obligation-preflight-v1/packets/a-p/terminal-receipt.json",
  "evidence/phase10-obligation-preflight-v1/uncalled-check.json",
  "evidence/phase10-obligation-preflight-v1/verification.json",
]);

type JsonObject = { readonly [key: string]: StrictJson };

export interface Phase10ExecutionReceiptWriteRequest {
  readonly repositoryRoot: string;
  readonly candidateDirectory: string;
}

function fail(message: string): never {
  throw new Error(`Phase 10 execution receipt refused: ${message}`);
}

function object(value: StrictJson, label: string): JsonObject {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    fail(`${label} must be an object`);
  }
  return value as JsonObject;
}

function safeRepositoryFile(repositoryRootValue: string, path: string): Uint8Array {
  if (
    isAbsolute(path) || path.includes("\\") || path.startsWith("/") || path.endsWith("/") ||
    path.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    fail(`${path} is not a safe repository-relative file path`);
  }
  const root = realpathSync(resolve(repositoryRootValue));
  const absolute = resolve(root, path);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${path} must be a regular non-symlink file`);
  const physical = realpathSync(absolute);
  const fromRoot = relative(root, physical).replaceAll("\\", "/");
  if (fromRoot !== path) {
    fail(`${path} resolves outside or aliases within the repository`);
  }
  return new Uint8Array(readFileSync(physical));
}

function candidateDirectory(repositoryRootValue: string, candidateValue: string): string {
  const root = realpathSync(resolve(repositoryRootValue));
  const candidate = realpathSync(resolve(root, candidateValue));
  const stat = lstatSync(candidate);
  const fromRoot = relative(root, candidate);
  if (
    !stat.isDirectory() || stat.isSymbolicLink() || fromRoot === "" || fromRoot === ".." ||
    fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(fromRoot)
  ) {
    fail("candidate directory must be a non-symlink directory below the repository root");
  }
  return candidate;
}

function safeCandidateFile(candidate: string, path: string, label: string): Uint8Array {
  const absolute = resolve(candidate, path);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} must be a regular non-symlink candidate file`);
  const physical = realpathSync(absolute);
  const fromCandidate = relative(candidate, physical).replaceAll("\\", "/");
  if (fromCandidate !== path) fail(`${label} resolves outside or aliases within the candidate`);
  return new Uint8Array(readFileSync(physical));
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

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(strictJsonSnapshot(left)) === JSON.stringify(strictJsonSnapshot(right));
}

function git(repositoryRoot: string, args: readonly string[]): string {
  const result = spawnSync("git", args, { cwd: repositoryRoot, encoding: "utf8" });
  if (result.error !== undefined || result.status !== 0) {
    fail(`git ${args.join(" ")} failed: ${(result.stderr || result.error?.message || "unknown error").trim()}`);
  }
  return result.stdout.trim();
}

function gitAncestor(repositoryRoot: string, ancestor: string): boolean {
  const result = spawnSync("git", ["merge-base", "--is-ancestor", ancestor, "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  if (result.error !== undefined || (result.status !== 0 && result.status !== 1)) {
    fail(`git merge-base ancestry check failed: ${(result.stderr || result.error?.message || "unknown error").trim()}`);
  }
  return result.status === 0;
}

function timestamp(value: StrictJson | undefined, label: string): string {
  if (
    typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    fail(`${label} is not an exact UTC ISO timestamp`);
  }
  return value;
}

function exactIdentity(value: StrictJson | undefined, path: string, bytes: Uint8Array, label: string): void {
  const identity = object(value as StrictJson, label);
  exactKeys(identity, ["path", "byteLength", "sha256"], label);
  if (identity.path !== path || identity.byteLength !== bytes.byteLength || identity.sha256 !== sha256Bytes(bytes)) {
    fail(`${label} differs from reopened bytes`);
  }
}

function stringField(record: JsonObject, field: string, expected: string): void {
  if (record[field] !== expected) fail(`verification ${field} differs from ${expected}`);
}

/** Write and re-open the A-P terminal receipt after its independent verification has passed. */
export function writePhase10ExecutionReceipt(
  request: Phase10ExecutionReceiptWriteRequest,
): Phase10ExecutionReceipt {
  const root = realpathSync(resolve(request.repositoryRoot));
  const candidate = candidateDirectory(root, request.candidateDirectory);
  const destination = resolve(candidate, TERMINAL_RELATIVE_PATH);
  const terminalAlreadyExists = lstatExistingFile(destination);
  const matrixBytes = safeRepositoryFile(root, MATRIX_PATH);
  const protocolBytes = safeRepositoryFile(root, PROTOCOL_PATH);
  const registryBytes = safeRepositoryFile(root, REGISTRY_PATH);
  const matrix = prettyJson(matrixBytes, "A-P obligation matrix");
  const protocol = prettyJson(protocolBytes, "A-P packet protocol");
  const registry = prettyJson(registryBytes, "A-P callable registry");
  const preflight = phase10ObligationRunPreflight(matrix, protocol, registry, root);
  if (process.version !== EXPECTED_RUNTIME) fail(`runtime ${process.version} differs from ${EXPECTED_RUNTIME}`);
  if (git(root, ["branch", "--show-current"]) !== EXPECTED_BRANCH) fail("terminal receipt branch differs");
  const status = git(root, ["status", "--porcelain=v1", "--untracked-files=all"])
    .split("\n").filter((line) => line.length > 0).sort(compareText);
  const allowedStatus = ALLOWED_PUBLISHED_PATHS.map((path) => `?? ${path}`).sort(compareText);
  if (
    status.length !== 0 &&
    (status.length !== allowedStatus.length || status.some((line, index) => line !== allowedStatus[index]))
  ) {
    fail("terminal receipt requires a clean worktree or only the exact prior A-P publication paths");
  }
  const head = git(root, ["rev-parse", "HEAD"]);
  const retainedPreflight = object(
    prettyJson(safeCandidateFile(candidate, PREFLIGHT_FILE, "A-P retained preflight"), "A-P retained preflight"),
    "A-P retained preflight",
  );
  exactKeys(
    retainedPreflight,
    [
      "schema", "receiptId", "matrixId", "protocolId", "registryId", "packetId", "attemptId",
      "stage", "observed", "outputIds", "checkIds", "negativeControlIds", "callableIds",
      "selectedBranches", "verdict", "reasons",
    ],
    "A-P retained preflight",
  );
  if (
    retainedPreflight.schema !== "phase10-preflight-receipt-v1" ||
    retainedPreflight.receiptId !== `phase10-a-p-${ATTEMPT_ID}-preflight-v1` ||
    retainedPreflight.attemptId !== ATTEMPT_ID || retainedPreflight.matrixId !== preflight.matrixId ||
    retainedPreflight.protocolId !== preflight.protocolId || retainedPreflight.registryId !== preflight.registryId ||
    retainedPreflight.packetId !== "a-p" || retainedPreflight.stage !== "run" ||
    retainedPreflight.verdict !== "pass" || !sameJson(retainedPreflight.reasons, []) ||
    !sameJson(retainedPreflight.outputIds, preflight.outputIds) ||
    !sameJson(retainedPreflight.checkIds, preflight.checkIds) ||
    !sameJson(retainedPreflight.negativeControlIds, preflight.negativeControlIds) ||
    !sameJson(retainedPreflight.callableIds, preflight.callableIds) ||
    !sameJson(retainedPreflight.selectedBranches, preflight.selectedBranches)
  ) {
    fail("retained preflight differs from the independently re-derived run preflight");
  }
  const observed = object(retainedPreflight.observed as StrictJson, "A-P retained preflight observed");
  exactKeys(
    observed,
    [
      "launchClass", "machineLaunchChecks", "branch", "head", "runtime", "command",
      "repositoryBundleRoot", "matrix", "protocol", "callableRegistry", "candidateDirectory",
      "registeredAttemptRoot", "finalPreflightReceiptPath", "finalTerminalReceiptPath",
      "verificationPaths", "dependencyPacketIds", "dependencyArtifacts",
    ],
    "A-P retained preflight observed",
  );
  if (
    observed.launchClass !== "static-contract" || observed.machineLaunchChecks !== "not-applicable" ||
    observed.branch !== EXPECTED_BRANCH || typeof observed.head !== "string" ||
    !/^[0-9a-f]{40}$/u.test(observed.head) ||
    (!terminalAlreadyExists && observed.head !== head) ||
    (terminalAlreadyExists && !gitAncestor(root, observed.head)) || observed.runtime !== process.version ||
    observed.command !== PRODUCE_COMMAND || observed.repositoryBundleRoot !== "." ||
    observed.candidateDirectory !== request.candidateDirectory
  ) {
    fail("retained preflight provenance differs from the current committed run");
  }
  if (
    observed.registeredAttemptRoot !== "out/phase10-execution-v1/attempts/a-p" ||
    observed.finalPreflightReceiptPath !== "evidence/phase10-obligation-preflight-v1/packets/a-p/preflight.json" ||
    observed.finalTerminalReceiptPath !== "evidence/phase10-obligation-preflight-v1/packets/a-p/terminal-receipt.json" ||
    !sameJson(observed.verificationPaths, ["evidence/phase10-obligation-preflight-v1/verification.json"]) ||
    !sameJson(observed.dependencyPacketIds, []) || !sameJson(observed.dependencyArtifacts, [])
  ) {
    fail("retained preflight registered paths or dependency observations differ");
  }
  exactIdentity(observed.matrix, MATRIX_PATH, matrixBytes, "retained preflight matrix identity");
  exactIdentity(observed.protocol, PROTOCOL_PATH, protocolBytes, "retained preflight protocol identity");
  exactIdentity(observed.callableRegistry, REGISTRY_PATH, registryBytes, "retained preflight registry identity");

  const verification = object(
    prettyJson(safeCandidateFile(candidate, VERIFICATION_FILE, "A-P packet verification"), "A-P packet verification"),
    "A-P packet verification",
  );
  exactKeys(
    verification,
    [
      "schema", "verificationId", "matrixId", "protocolId", "registryId", "packetId",
      "terminalState", "verifiedArtifacts", "checkResults", "executedNegativeControlIds",
      "negativeControlResults", "boundDependencyPacketIds", "execution", "aggregateVerdict", "limits",
    ],
    "A-P packet verification",
  );
  stringField(verification, "schema", "phase10-packet-verification-v1");
  stringField(verification, "verificationId", EXPECTED_VERIFICATION_ID);
  stringField(verification, "matrixId", preflight.matrixId);
  stringField(verification, "protocolId", preflight.protocolId);
  stringField(verification, "registryId", preflight.registryId);
  stringField(verification, "packetId", "a-p");
  stringField(verification, "terminalState", "pass");
  stringField(verification, "aggregateVerdict", "pass");
  if (!sameJson(verification.boundDependencyPacketIds, [])) {
    fail("verification dependency roster differs from A-P's empty roster");
  }
  const independentlyDerived = independentlyVerifyPhase10ApArtifacts({
    repositoryRoot: root,
    candidateDirectory: request.candidateDirectory,
  });
  if (
    independentlyDerived.verdict !== "pass" ||
    !sameJson(verification.verifiedArtifacts, independentlyDerived.verifiedArtifacts) ||
    !sameJson(verification.checkResults, independentlyDerived.checkResults) ||
    !sameJson(verification.executedNegativeControlIds, independentlyDerived.executedNegativeControlIds) ||
    !sameJson(verification.negativeControlResults, independentlyDerived.negativeControlResults)
  ) {
    fail("verification result/witness sets differ from independent byte re-execution");
  }
  const execution = object(verification.execution as StrictJson, "A-P verification execution");
  exactKeys(
    execution,
    [
      "evaluatorCallableId", "modulePath", "exportName", "byteLength", "sha256", "runtime",
      "command", "gitHead", "startedOn", "endedOn", "processConcurrency",
    ],
    "A-P verification execution",
  );
  const callableRegistry = parsePhase10CallableRegistry(registry);
  const evaluator = callableRegistry.callables.find((entry) => entry.callableId === "phase10-ap-evaluator");
  if (evaluator === undefined || evaluator.identity === null || evaluator.role !== "independent-evaluator") {
    fail("A-P evaluator is not resolved in the callable registry");
  }
  const evaluatorBytes = safeRepositoryFile(root, evaluator.modulePath);
  if (
    execution.evaluatorCallableId !== evaluator.callableId || execution.modulePath !== evaluator.modulePath ||
    execution.exportName !== evaluator.exportName || execution.byteLength !== evaluatorBytes.byteLength ||
    execution.sha256 !== sha256Bytes(evaluatorBytes) || execution.runtime !== observed.runtime ||
    execution.command !== VERIFY_COMMAND || execution.gitHead !== observed.head || execution.processConcurrency !== 1
  ) {
    fail("verification execution provenance differs from preflight, registry, or reopened evaluator bytes");
  }
  const startedOn = timestamp(execution.startedOn, "verification startedOn");
  const endedOn = timestamp(execution.endedOn, "verification endedOn");
  if (Date.parse(endedOn) < Date.parse(startedOn)) fail("verification endedOn precedes startedOn");
  if (!sameJson(verification.limits, EXPECTED_VERIFICATION_LIMITS)) {
    fail("verification limits differ from the frozen claim boundary");
  }

  const receipt = Object.freeze({
    schema: PHASE10_EXECUTION_RECEIPT_SCHEMA,
    receiptId: `phase10-a-p-${ATTEMPT_ID}-terminal-v1`,
    matrixId: preflight.matrixId,
    protocolId: preflight.protocolId,
    registryId: preflight.registryId,
    packetId: "a-p",
    terminalState: "pass" as const,
    producedOutputIds: preflight.outputIds,
    executedCheckIds: preflight.checkIds,
    evaluatedCheckIds: preflight.checkIds,
    executedNegativeControlIds: preflight.negativeControlIds,
    boundDependencyPacketIds: Object.freeze([]),
  }) satisfies Phase10ExecutionReceipt;
  phase10ObligationReceiptPreflight(matrix, protocol, registry, receipt, root);
  const bytes = prettyJsonBytes(receipt);
  mkdirSync(dirname(destination), { recursive: true });
  if (terminalAlreadyExists) {
    const existing = new Uint8Array(readFileSync(destination));
    if (!sameBytes(existing, bytes)) fail("existing terminal receipt differs");
    parsePhase10ExecutionReceipt(prettyJson(existing, "existing A-P terminal receipt"));
    return receipt;
  }
  let descriptor: number | undefined;
  let created = false;
  try {
    descriptor = openSync(destination, "wx");
    created = true;
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    const reopened = new Uint8Array(readFileSync(destination));
    if (!sameBytes(reopened, bytes)) fail("terminal receipt readback differs");
    parsePhase10ExecutionReceipt(prettyJson(reopened, "A-P terminal receipt readback"));
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    if (created) unlinkSync(destination);
    throw error;
  }
  return receipt;
}

function lstatExistingFile(path: string): boolean {
  try {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink()) fail("terminal receipt path is not a regular file");
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}
