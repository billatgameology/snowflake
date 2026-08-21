import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import { parsePhase10ExecutionReceipt, parsePhase10PacketProtocol } from "./phase10-contracts.ts";
import {
  PHASE10_AI_DECISIONS_PATH,
  PHASE10_AI_INTAKE_PROTOCOL_PATH,
  PHASE10_AI_OBSERVATIONS_PATH,
  PHASE10_AI_SEMANTIC_REVIEW_PATH,
  PHASE10_AI_PACKET_PROTOCOL_PATH,
  artifactTuple,
  parseIntakeProtocol,
  sha256Bytes,
  type ArtifactTuple,
  type IntakeProtocol,
} from "./phase10-intake-contracts.ts";

const EXPECTED_BRANCH = "phase10/evidence-verification";
const AS_PREFLIGHT = "evidence/phase10-obligation-preflight-v1/packets/a-s/preflight.json";
const AS_TERMINAL = "evidence/phase10-obligation-preflight-v1/packets/a-s/terminal-receipt.json";
const AS_VERIFICATION = "evidence/phase10-scope-intake-v1/scope-verification.json";
const AS_OUTPUT_IDS = Object.freeze([
  "out-as-artifact-index",
  "out-as-classification-protocol",
  "out-as-phase8a-overlay",
  "out-as-phase8b-overlay",
  "out-as-report",
  "out-as-verification-receipt",
]);
const AS_CHECK_IDS = Object.freeze([
  "chk-as-artifact-index-integrity",
  "chk-as-cited-classifications",
  "chk-as-exact-rosters",
  "chk-as-frozen-input-joins",
  "chk-as-immutable-roles",
  "chk-as-modelclass-blocker-separation",
  "chk-as-multiblocker-support",
  "chk-as-phase-ownership",
  "chk-as-protocol-before-classification",
  "chk-as-separate-corpus-totals",
  "chk-as-zero-validation-credit",
]);
const AS_CONTROL_IDS = Object.freeze([
  "nc-as-collapse-multiple-blockers",
  "nc-as-drop-one-overlay-row",
  "nc-as-rewrite-frozen-role",
  "nc-as-upgrade-validation-credit",
]);

export interface ScopeDependencyBinding {
  readonly packetId: "a-s";
  readonly preflightReceipt: ArtifactTuple;
  readonly terminalReceipt: ArtifactTuple;
  readonly verification: ArtifactTuple;
  readonly verifiedArtifacts: readonly ArtifactTuple[];
}

export interface IntakeAuthority {
  readonly repositoryRoot: string;
  readonly head: string;
  readonly freezeCommit: string;
  readonly protocolBytes: Uint8Array;
  readonly protocol: IntakeProtocol;
  readonly scopeDependency: ScopeDependencyBinding;
}

function fail(message: string): never {
  throw new Error(`Phase 10 A-I authority refused: ${message}`);
}

function lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
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

function exactStrings(value: unknown, expected: readonly string[], label: string): void {
  if (!Array.isArray(value) || value.length !== expected.length || value.some((entry, index) => entry !== expected[index])) fail(`${label} differs`);
}

function parseJson(bytes: Uint8Array, label: string): StrictJson {
  let source: string;
  try { source = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { fail(`${label} is not UTF-8`); }
  if (source.includes("\r") || !source.endsWith("\n")) fail(`${label} must use LF with a terminal LF`);
  try { return strictJsonSnapshot(JSON.parse(source) as unknown); } catch { fail(`${label} is not strict JSON`); }
}

export function safeRepositoryPath(repositoryRoot: string, relativePath: string, label: string): string {
  if (
    isAbsolute(relativePath) || relativePath.includes("\\") || relativePath.startsWith("/") || relativePath.endsWith("/") ||
    relativePath.split("/").some((part) => part === "" || part === "." || part === "..")
  ) fail(`${label} is not a safe repository-relative POSIX path`);
  const root = resolve(repositoryRoot);
  const target = resolve(root, relativePath);
  const displacement = relative(root, target);
  if (displacement === "" || isAbsolute(displacement) || displacement === ".." || displacement.startsWith(`..${sep}`)) fail(`${label} leaves the repository`);
  return target;
}

function assertPhysicalParent(repositoryRoot: string, target: string, label: string): void {
  let cursor = dirname(target);
  while (!existsSync(cursor)) {
    const parent = dirname(cursor);
    if (parent === cursor) fail(`${label} has no existing parent`);
    cursor = parent;
  }
  const rootReal = realpathSync.native(resolve(repositoryRoot));
  const parentReal = realpathSync.native(cursor);
  const displacement = relative(rootReal, parentReal);
  if (isAbsolute(displacement) || displacement === ".." || displacement.startsWith(`..${sep}`)) fail(`${label} parent resolves outside repository`);
}

export function readRegularFile(repositoryRoot: string, relativePath: string, label: string): Uint8Array {
  const target = safeRepositoryPath(repositoryRoot, relativePath, label);
  assertPhysicalParent(repositoryRoot, target, label);
  if (!existsSync(target)) fail(`${label} is missing`);
  const stat = lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) fail(`${label} must be one regular non-symlink single-link file`);
  return new Uint8Array(readFileSync(target));
}

export function identityOf(repositoryRoot: string, relativePath: string, label: string): ArtifactTuple {
  const bytes = readRegularFile(repositoryRoot, relativePath, label);
  return Object.freeze({ path: relativePath, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) });
}

export function git(repositoryRoot: string, args: readonly string[], allowFailure = false): string {
  try {
    return execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8", stdio: ["ignore", "pipe", allowFailure ? "ignore" : "pipe"] }).trim();
  } catch (error) {
    if (allowFailure) return "";
    fail(`git ${args.join(" ")} failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function assertBranchAndClean(repositoryRoot: string, allowedPaths: readonly string[] = []): string {
  const branch = git(repositoryRoot, ["branch", "--show-current"]);
  if (branch !== EXPECTED_BRANCH) fail(`branch ${branch} is not ${EXPECTED_BRANCH}`);
  const changes = git(repositoryRoot, ["status", "--porcelain=v1", "--untracked-files=all"])
    .split("\n").filter((line) => line.length > 0);
  const allowed = new Set(allowedPaths.flatMap((entry) => [`?? ${entry}`, ` M ${entry}`, `M  ${entry}`, `A  ${entry}`]));
  if (changes.some((line) => !allowed.has(line))) fail(`repository contains changes outside allowed A-I inputs: ${changes.join(" | ")}`);
  return git(repositoryRoot, ["rev-parse", "HEAD"]);
}

function bytesAtCommit(repositoryRoot: string, commit: string, relativePath: string): Uint8Array {
  try {
    return new Uint8Array(execFileSync("git", ["show", `${commit}:${relativePath}`], { cwd: repositoryRoot, encoding: "buffer", stdio: ["ignore", "pipe", "pipe"] }));
  } catch {
    fail(`${relativePath} is absent at required commit ${commit}`);
  }
}

function absentAtCommit(repositoryRoot: string, commit: string, relativePath: string): void {
  try {
    execFileSync("git", ["cat-file", "-e", `${commit}:${relativePath}`], { cwd: repositoryRoot, stdio: "ignore" });
    fail(`${relativePath} existed at semantic protocol freeze ${commit}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Phase 10 A-I authority refused:")) throw error;
  }
}

function assertIdentity(repositoryRoot: string, expected: ArtifactTuple, label: string): Uint8Array {
  const bytes = readRegularFile(repositoryRoot, expected.path, label);
  if (bytes.byteLength !== expected.byteLength || sha256Bytes(bytes) !== expected.sha256) fail(`${label} differs from frozen identity`);
  return bytes;
}

function freezeHistory(repositoryRoot: string, protocolBytes: Uint8Array): { readonly freezeCommit: string; readonly head: string } {
  const freezeCommit = git(repositoryRoot, ["log", "--diff-filter=A", "--format=%H", "-1", "--", PHASE10_AI_INTAKE_PROTOCOL_PATH]);
  if (!/^[0-9a-f]{40}$/u.test(freezeCommit)) fail("semantic protocol has no unique committed introduction");
  const head = git(repositoryRoot, ["rev-parse", "HEAD"]);
  try { execFileSync("git", ["merge-base", "--is-ancestor", freezeCommit, head], { cwd: repositoryRoot, stdio: "ignore" }); } catch { fail("semantic protocol freeze is not an ancestor of current HEAD"); }
  const historical = bytesAtCommit(repositoryRoot, freezeCommit, PHASE10_AI_INTAKE_PROTOCOL_PATH);
  if (historical.byteLength !== protocolBytes.byteLength || sha256Bytes(historical) !== sha256Bytes(protocolBytes)) fail("semantic protocol bytes changed after their freeze commit");
  absentAtCommit(repositoryRoot, freezeCommit, PHASE10_AI_DECISIONS_PATH);
  absentAtCommit(repositoryRoot, freezeCommit, PHASE10_AI_OBSERVATIONS_PATH);
  absentAtCommit(repositoryRoot, freezeCommit, PHASE10_AI_SEMANTIC_REVIEW_PATH);
  return Object.freeze({ freezeCommit, head });
}

function tupleFromUnknown(value: unknown, label: string): ArtifactTuple {
  return artifactTuple(value, label);
}

function validateScopeDependency(repositoryRoot: string): ScopeDependencyBinding {
  const preflightBytes = readRegularFile(repositoryRoot, AS_PREFLIGHT, "A-S preflight");
  const terminalBytes = readRegularFile(repositoryRoot, AS_TERMINAL, "A-S terminal receipt");
  const verificationBytes = readRegularFile(repositoryRoot, AS_VERIFICATION, "A-S verification");
  const preflight = object(parseJson(preflightBytes, "A-S preflight"), "A-S preflight");
  if (preflight.schema !== "phase10-preflight-receipt-v1" || preflight.packetId !== "a-s" || preflight.verdict !== "pass" || typeof preflight.attemptId !== "string") fail("A-S preflight is not a passing A-S run receipt");
  exactStrings(preflight.outputIds, AS_OUTPUT_IDS, "A-S preflight output roster");
  exactStrings(preflight.checkIds, AS_CHECK_IDS, "A-S preflight check roster");
  exactStrings(preflight.negativeControlIds, AS_CONTROL_IDS, "A-S preflight control roster");
  const terminal = parsePhase10ExecutionReceipt(parseJson(terminalBytes, "A-S terminal receipt"));
  if (terminal.packetId !== "a-s" || terminal.terminalState !== "pass" || terminal.receiptId !== `phase10-a-s-${preflight.attemptId}-terminal-v1`) fail("A-S terminal receipt differs from the retained passing attempt");
  exactStrings(terminal.producedOutputIds, AS_OUTPUT_IDS, "A-S terminal output roster");
  exactStrings(terminal.executedCheckIds, AS_CHECK_IDS, "A-S terminal check roster");
  exactStrings(terminal.evaluatedCheckIds, AS_CHECK_IDS, "A-S terminal evaluated roster");
  exactStrings(terminal.executedNegativeControlIds, AS_CONTROL_IDS, "A-S terminal control roster");
  exactStrings(terminal.boundDependencyPacketIds, ["a-p"], "A-S terminal dependency roster");
  const verification = object(parseJson(verificationBytes, "A-S verification"), "A-S verification");
  exactKeys(verification, ["schema", "verificationId", "packetId", "obligationMatrix", "classificationProtocol", "callableRegistry", "evaluator", "inputArtifacts", "evaluatedArtifacts", "executedCheckIds", "checkResults", "executedNegativeControlIds", "negativeControlResults", "startedOn", "endedOn", "verdict"], "A-S verification");
  if (verification.schema !== "phase10-as-verification-v1" || verification.verificationId !== "phase10-as-verification-v1" || verification.packetId !== "a-s" || verification.verdict !== "pass") fail("A-S independent verification is not pass");
  exactStrings(verification.executedCheckIds, AS_CHECK_IDS, "A-S verification check roster");
  exactStrings(verification.executedNegativeControlIds, AS_CONTROL_IDS, "A-S verification control roster");
  const evaluated = verification.evaluatedArtifacts;
  if (!Array.isArray(evaluated) || evaluated.length !== 4) fail("A-S verified artifact roster differs");
  const verifiedArtifacts = evaluated.map((entry, index) => {
    const row = object(entry, `A-S evaluatedArtifacts[${index}]`);
    exactKeys(row, ["outputId", "path", "byteLength", "sha256"], `A-S evaluatedArtifacts[${index}]`);
    const tuple = tupleFromUnknown({ path: row.path, byteLength: row.byteLength, sha256: row.sha256 }, `A-S evaluatedArtifacts[${index}]`);
    assertIdentity(repositoryRoot, tuple, `A-S evaluated artifact ${String(row.outputId)}`);
    return tuple;
  });
  const classificationProtocol = tupleFromUnknown(verification.classificationProtocol, "A-S classification protocol");
  assertIdentity(repositoryRoot, classificationProtocol, "A-S classification protocol");
  return Object.freeze({
    packetId: "a-s",
    preflightReceipt: Object.freeze({ path: AS_PREFLIGHT, byteLength: preflightBytes.byteLength, sha256: sha256Bytes(preflightBytes) }),
    terminalReceipt: Object.freeze({ path: AS_TERMINAL, byteLength: terminalBytes.byteLength, sha256: sha256Bytes(terminalBytes) }),
    verification: Object.freeze({ path: AS_VERIFICATION, byteLength: verificationBytes.byteLength, sha256: sha256Bytes(verificationBytes) }),
    verifiedArtifacts: Object.freeze([classificationProtocol, ...verifiedArtifacts].sort((left, right) => lexical(left.path, right.path))),
  });
}

export function loadIntakeAuthority(repositoryRootInput: string, expectedProtocol: ArtifactTuple): IntakeAuthority {
  const repositoryRoot = resolve(repositoryRootInput);
  if (expectedProtocol.path !== PHASE10_AI_INTAKE_PROTOCOL_PATH) fail("caller semantic protocol path differs");
  const protocolBytes = assertIdentity(repositoryRoot, expectedProtocol, "A-I semantic protocol");
  const protocol = parseIntakeProtocol(parseJson(protocolBytes, "A-I semantic protocol"));
  const packetBytes = readRegularFile(repositoryRoot, PHASE10_AI_PACKET_PROTOCOL_PATH, "A-I packet protocol");
  const packet = parsePhase10PacketProtocol(parseJson(packetBytes, "A-I packet protocol"));
  if (packet.packetId !== "a-i" || packet.protocolId !== "phase10-a-i-intake-v1") fail("A-I packet protocol IDs differ");
  assertIdentity(repositoryRoot, protocol.foundationFreeze, "Phase 10 foundation");
  assertIdentity(repositoryRoot, protocol.obligationMatrix, "Phase 10 obligation matrix");
  assertIdentity(repositoryRoot, protocol.artifactSchemaRegistry, "Phase 10 artifact schema registry");
  assertIdentity(repositoryRoot, protocol.trackedIntake, "tracked post-freeze intake");
  const history = freezeHistory(repositoryRoot, protocolBytes);
  return Object.freeze({ repositoryRoot, head: history.head, freezeCommit: history.freezeCommit, protocolBytes, protocol, scopeDependency: validateScopeDependency(repositoryRoot) });
}

export function assertCommittedInputAtHead(repositoryRoot: string, relativePath: string, label: string): Uint8Array {
  const bytes = readRegularFile(repositoryRoot, relativePath, label);
  const headBytes = bytesAtCommit(repositoryRoot, "HEAD", relativePath);
  if (bytes.byteLength !== headBytes.byteLength || sha256Bytes(bytes) !== sha256Bytes(headBytes)) fail(`${label} working bytes differ from HEAD`);
  return bytes;
}

export function assertObservationFreezeHead(authority: IntakeAuthority): void {
  if (authority.head !== authority.freezeCommit) fail("observation and input-validation commands must execute at the exact semantic-protocol freeze HEAD");
}

export function assertOnlyFrozenInputsChangedSinceFreeze(authority: IntakeAuthority): void {
  const changed = git(authority.repositoryRoot, ["diff", "--name-only", authority.freezeCommit, authority.head, "--"])
    .split("\n").filter((entry) => entry.length > 0).sort(lexical);
  const allowed = [PHASE10_AI_DECISIONS_PATH, PHASE10_AI_OBSERVATIONS_PATH, PHASE10_AI_SEMANTIC_REVIEW_PATH].sort(lexical);
  if (changed.length !== allowed.length || changed.some((entry, index) => entry !== allowed[index])) {
    fail(`post-freeze history must add only the three committed A-I inputs: ${changed.join(", ")}`);
  }
}

export function parseStrictJsonFile(bytes: Uint8Array, label: string): StrictJson {
  return parseJson(bytes, label);
}
