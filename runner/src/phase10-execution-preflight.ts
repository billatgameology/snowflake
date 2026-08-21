import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statfsSync,
} from "node:fs";
import { dirname, isAbsolute, posix, relative, resolve } from "node:path";
import ts from "typescript";
import { canonicalJson, canonicalJsonBytes, strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  parsePhase10CallableRegistry,
  parsePhase10ExecutionReceipt,
  parsePhase10ObligationMatrix,
  parsePhase10PacketProtocol,
  type Phase10CallableRegistry,
  type Phase10ExecutionReceipt,
  type Phase10PacketProtocol,
} from "./phase10-contracts.ts";
import {
  phase10ObligationReceiptPreflight,
  phase10ObligationRunPreflight,
  type Phase10ObligationPreflightPass,
} from "./phase10-obligation-preflight.ts";
import {
  PHASE10_C0_EXECUTOR_RESOURCES,
  PHASE10_C0_RUNTIME,
  PHASE10_C0_SCIENCE_PROTOCOL_PATH,
  phase10C0ExecutorCommand,
  phase10C0Lexical,
  phase10C0ParseRetainedPreflight,
} from "./phase10-c0-contracts.ts";

export type Phase10ExecutablePacketId = "c0-derive" | "c0-publish";

export const PHASE10_EXECUTION_MATRIX_PATH = "research/phase10-obligation-matrix-v1.json" as const;
export const PHASE10_EXECUTION_CATALOGUE_PATH = "research/phase10-execution-v1/packet-catalogue.json" as const;
export const PHASE10_EXECUTION_SCHEMA_REGISTRY_PATH = "research/phase10-artifact-schema-registry-v1.json" as const;
export const PHASE10_EXECUTION_BRANCH = "phase10/evidence-verification" as const;

const AP_PRODUCE_COMMAND =
  "node runner/src/phase10-ap-publish.ts produce --repository-root . --out out/phase10-obligation-preflight-v1-candidate";
const AP_VERIFY_COMMAND =
  "node runner/src/phase10-ap-independent.ts verify --repository-root . --bundle out/phase10-obligation-preflight-v1-candidate --receipt out/phase10-obligation-preflight-v1-candidate/verification.json";
const AP_CHECK_IDS = Object.freeze([
  "chk-ap-called-checks",
  "chk-ap-command-boundary",
  "chk-ap-conditional-groups",
  "chk-ap-global-coverage",
  "chk-ap-output-producers",
  "chk-ap-packet-catalogue",
  "chk-ap-packet-set-equality",
  "chk-ap-rights-resource-claim-boundary",
  "chk-ap-schema-coverage",
  "chk-ap-schema-promotion",
  "chk-ap-self-freeze",
]);
const AP_CONTROL_IDS = Object.freeze(["nc-ap-missing-producer", "nc-ap-uncalled-check"]);
const AP_VERIFIED_OUTPUT_IDS = Object.freeze([
  "out-ap-artifact-index",
  "out-ap-artifact-schema-registry",
  "out-ap-c0-protocol",
  "out-ap-c0v-foundation",
  "out-ap-execution-readme",
  "out-ap-foundation-freeze",
  "out-ap-matrix",
  "out-ap-missing-producer-receipt",
  "out-ap-packet-catalogue",
  "out-ap-self-callable-registry",
  "out-ap-self-packet-protocol",
  "out-ap-uncalled-check-receipt",
]);
const C0_DERIVE_CHECK_WITNESSES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "chk-c0-all-spacings": Object.freeze(["out-c0-comparisons"]),
  "chk-c0-comparison-roster": Object.freeze(["out-c0-comparisons"]),
  "chk-c0-cost-separation": Object.freeze(["out-c0-analysis"]),
  "chk-c0-field-allowlist": Object.freeze(["out-c0-analysis", "out-c0-gaps"]),
  "chk-c0-independent-rederivation": Object.freeze(["out-c0-analysis", "out-c0-comparisons"]),
  "chk-c0-no-solver": Object.freeze(["out-c0-analysis"]),
  "chk-c0-operand-echo": Object.freeze(["out-c0-comparisons"]),
  "chk-c0-row-roster": Object.freeze(["out-c0-comparisons"]),
});
const C0_PUBLISH_CHECK_WITNESSES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "chk-c0-publish-artifact-graph": Object.freeze(["out-c0-artifact-index"]),
  "chk-c0-publish-breakdown": Object.freeze(["out-c0-analysis", "out-c0-comparisons", "out-c0-report"]),
  "chk-c0-publish-gap-list": Object.freeze(["out-c0-gaps", "out-c0-report"]),
  "chk-c0-publish-historical-limit": Object.freeze(["out-c0-historical-limit", "out-c0-report"]),
  "chk-c0-publish-no-habit-claim": Object.freeze(["out-c0-report"]),
});
const C0_CONTROL_ARTIFACTS: Readonly<Record<string, { readonly artifactId: string; readonly path: string }>> = Object.freeze({
  "nc-c0-coarse-fail-fine-pass": Object.freeze({ artifactId: "out-c0-comparisons", path: "evidence/phase10-numerical-verification-v1/c0-comparisons.jsonl" }),
  "nc-c0-duplicate-or-truncated": Object.freeze({ artifactId: "input-c0-rows", path: "evidence/phase6-wp2-ladder/rows.jsonl" }),
  "nc-c0-fine-fail-coarse-pass": Object.freeze({ artifactId: "out-c0-comparisons", path: "evidence/phase10-numerical-verification-v1/c0-comparisons.jsonl" }),
  "nc-c0-forbidden-field": Object.freeze({ artifactId: "out-c0-analysis", path: "evidence/phase10-numerical-verification-v1/c0-analysis.json" }),
  "nc-c0-forged-producer-verdict": Object.freeze({ artifactId: "out-c0-analysis", path: "evidence/phase10-numerical-verification-v1/c0-analysis.json" }),
  "nc-c0-missing-row": Object.freeze({ artifactId: "input-c0-rows", path: "evidence/phase6-wp2-ladder/rows.jsonl" }),
  "nc-c0-operand-echo": Object.freeze({ artifactId: "out-c0-comparisons", path: "evidence/phase10-numerical-verification-v1/c0-comparisons.jsonl" }),
});

type JsonObject = { readonly [key: string]: StrictJson };

export interface Phase10ArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10PacketCatalogueRow {
  readonly packetId: string;
  readonly launchClass: string;
  readonly protocolPath: string;
  readonly callableRegistryPath: string;
  readonly attemptRoot: string;
  readonly preflightReceiptPath: string;
  readonly terminalReceiptPath: string;
  readonly verificationPaths: readonly string[];
}

export interface Phase10ExecutionPaths {
  readonly attemptDirectory: string;
  readonly candidateDirectory: string;
  readonly retainedPreflight: string;
  readonly retainedTerminal: string;
  readonly stdout: string;
  readonly stderr: string;
  readonly exitStatus: string;
  readonly resourceLedger: string;
  readonly lock: string;
}

export interface Phase10CodeFreeze {
  readonly commit: string;
  readonly artifacts: readonly Phase10ArtifactIdentity[];
}

export interface Phase10DependencyBinding {
  readonly packetId: string;
  readonly protocol: Phase10ArtifactIdentity;
  readonly callableRegistry: Phase10ArtifactIdentity;
  readonly preflightReceipt: Phase10ArtifactIdentity;
  readonly terminalReceipt: Phase10ArtifactIdentity;
  readonly verificationArtifacts: readonly Phase10ArtifactIdentity[];
}

export interface Phase10ExecutionPreflightContext {
  readonly repositoryRoot: string;
  readonly packetId: Phase10ExecutablePacketId;
  readonly attemptId: string;
  readonly command: string;
  readonly row: Phase10PacketCatalogueRow;
  readonly paths: Phase10ExecutionPaths;
  readonly matrixBytes: Uint8Array;
  readonly protocolBytes: Uint8Array;
  readonly registryBytes: Uint8Array;
  readonly matrixValue: StrictJson;
  readonly protocolValue: StrictJson;
  readonly registryValue: StrictJson;
  readonly protocol: Phase10PacketProtocol;
  readonly registry: Phase10CallableRegistry;
  readonly obligation: Phase10ObligationPreflightPass;
  readonly branch: string;
  readonly head: string;
  readonly runtime: string;
  readonly diskFreeBytes: number;
  readonly codeFreeze: Phase10CodeFreeze;
  readonly dependencies: readonly Phase10DependencyBinding[];
}

export interface Phase10ExecutionPreflightRequest {
  readonly repositoryRoot: string;
  readonly packetId: Phase10ExecutablePacketId;
  readonly protocolPath: string;
  readonly attemptId: string;
  readonly allowedStatusPaths?: readonly string[];
}

export interface Phase10ExecutionPredicateObservation {
  readonly runtime: string;
  readonly branch: string;
  readonly head: string;
  readonly dirtyStatusLines: readonly string[];
  readonly diskFreeBytes: number;
}

function fail(message: string): never {
  throw new Error(`Phase 10 execution preflight refused: ${message}`);
}

function object(value: unknown, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as JsonObject;
}

function exactKeys(value: object, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(phase10C0Lexical);
  const wanted = [...expected].sort(phase10C0Lexical);
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} fields differ`);
  }
}

function exactStrings(actual: unknown, expected: readonly string[], label: string): void {
  if (!Array.isArray(actual) || actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    fail(`${label} differs from the exact sorted registration`);
  }
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) fail(`${label} must be a nonempty trimmed string`);
  return value;
}

function safeRelative(path: string, label: string): string {
  if (
    isAbsolute(path) || path.includes("\\") || path.startsWith("/") || path.endsWith("/") ||
    path.split("/").some((part) => part === "" || part === "." || part === "..") ||
    !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u.test(path)
  ) fail(`${label} is not a safe repository-relative path`);
  return path;
}

function safeAbsolute(root: string, path: string, label: string): string {
  const relativePath = safeRelative(path, label);
  const absolute = resolve(root, relativePath);
  const fromRoot = relative(root, absolute);
  if (fromRoot === "" || fromRoot === ".." || fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(fromRoot)) {
    fail(`${label} escapes the repository root`);
  }
  return absolute;
}

function safeRoot(value: string): string {
  const root = realpathSync.native(resolve(value));
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("repository root must be a real non-symlink directory");
  return root;
}

function readFile(root: string, path: string, label: string): Uint8Array {
  const absolute = safeAbsolute(root, path, label);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} must be a regular non-symlink file`);
  const physical = realpathSync.native(absolute);
  const physicalRelative = relative(root, physical).replaceAll("\\", "/");
  if (physicalRelative !== path) fail(`${label} resolves outside or aliases within the repository`);
  return new Uint8Array(readFileSync(physical));
}

function prettyJson(bytes: Uint8Array, label: string): StrictJson {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} is not valid UTF-8`);
  }
  if (text.includes("\r")) fail(`${label} contains CR bytes`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    fail(`${label} is not valid JSON`);
  }
  const snapshot = strictJsonSnapshot(parsed);
  if (text !== `${JSON.stringify(snapshot, null, 2)}\n`) fail(`${label} is not exact two-space JSON plus LF`);
  return snapshot;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function phase10ExecutionIdentity(root: string, path: string): Phase10ArtifactIdentity {
  const bytes = readFile(root, path, path);
  return Object.freeze({ path, byteLength: bytes.byteLength, sha256: sha256(bytes) });
}

function sameIdentity(value: unknown, expected: Phase10ArtifactIdentity, label: string): void {
  const row = object(value, label);
  exactKeys(row, ["path", "byteLength", "sha256"], label);
  if (row.path !== expected.path || row.byteLength !== expected.byteLength || row.sha256 !== expected.sha256) {
    fail(`${label} differs from reopened bytes`);
  }
}

function git(root: string, args: readonly string[], allowStatusOne = false): string {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.error !== undefined || (result.status !== 0 && !(allowStatusOne && result.status === 1))) {
    fail(`git ${args.join(" ")} failed: ${(result.stderr || result.error?.message || "unknown error").trim()}`);
  }
  return result.stdout.trim();
}

function gitBytes(root: string, args: readonly string[], label: string): Uint8Array {
  const result = spawnSync("git", args, { cwd: root, encoding: null, maxBuffer: 32 * 1024 * 1024 });
  if (result.error !== undefined || result.status !== 0 || result.stdout === null) {
    fail(`${label} is absent from the required Git commit`);
  }
  return new Uint8Array(result.stdout);
}

function assertAncestor(root: string, commit: string, label: string): void {
  if (!/^[0-9a-f]{40}$/u.test(commit)) fail(`${label} is not a lowercase Git commit`);
  const result = spawnSync("git", ["merge-base", "--is-ancestor", commit, "HEAD"], { cwd: root, encoding: "utf8" });
  if (result.error !== undefined || result.status !== 0) fail(`${label} is not an ancestor of current HEAD`);
}

function assertHistoricalIdentity(root: string, commit: string, identity: Phase10ArtifactIdentity, label: string): void {
  const bytes = gitBytes(root, ["show", `${commit}:${identity.path}`], label);
  if (bytes.byteLength !== identity.byteLength || sha256(bytes) !== identity.sha256) {
    fail(`${label} differs at commit ${commit}`);
  }
}

function pathRoster(catalogue: JsonObject): readonly Phase10PacketCatalogueRow[] {
  if (catalogue.schema !== "phase10-packet-catalogue-v1" || !Array.isArray(catalogue.packets)) fail("packet catalogue identity/roster differs");
  const rows = catalogue.packets.map((value, index): Phase10PacketCatalogueRow => {
    const row = object(value, `packet catalogue row ${index}`);
    exactKeys(row, ["packetId", "launchClass", "protocolPath", "callableRegistryPath", "attemptRoot", "preflightReceiptPath", "terminalReceiptPath", "verificationPaths"], `packet catalogue row ${index}`);
    if (!Array.isArray(row.verificationPaths) || row.verificationPaths.length === 0) fail(`packet catalogue row ${index} verification paths differ`);
    const parsed = Object.freeze({
      packetId: string(row.packetId, `packet catalogue row ${index} packetId`),
      launchClass: string(row.launchClass, `packet catalogue row ${index} launchClass`),
      protocolPath: safeRelative(string(row.protocolPath, `packet catalogue row ${index} protocolPath`), "catalogue protocol path"),
      callableRegistryPath: safeRelative(string(row.callableRegistryPath, `packet catalogue row ${index} registry path`), "catalogue registry path"),
      attemptRoot: safeRelative(string(row.attemptRoot, `packet catalogue row ${index} attemptRoot`), "catalogue attempt root"),
      preflightReceiptPath: safeRelative(string(row.preflightReceiptPath, `packet catalogue row ${index} preflight path`), "catalogue preflight path"),
      terminalReceiptPath: safeRelative(string(row.terminalReceiptPath, `packet catalogue row ${index} terminal path`), "catalogue terminal path"),
      verificationPaths: Object.freeze(row.verificationPaths.map((path, pathIndex) => safeRelative(string(path, `verification path ${pathIndex}`), "catalogue verification path"))),
    });
    return parsed;
  });
  const allPaths = rows.flatMap((row) => [row.protocolPath, row.callableRegistryPath, row.attemptRoot, row.preflightReceiptPath, row.terminalReceiptPath, ...row.verificationPaths]);
  if (new Set(allPaths).size !== allPaths.length) fail("packet catalogue contains duplicate registered paths");
  return Object.freeze(rows);
}

function catalogueRow(root: string, packetId: string): Phase10PacketCatalogueRow {
  const catalogue = object(prettyJson(readFile(root, PHASE10_EXECUTION_CATALOGUE_PATH, "packet catalogue"), "packet catalogue"), "packet catalogue");
  const rows = pathRoster(catalogue);
  const matches = rows.filter((row) => row.packetId === packetId);
  if (matches.length !== 1) fail(`packet catalogue has ${matches.length} ${packetId} rows`);
  return matches[0]!;
}

export function phase10ValidateExecutionPredicates(observed: Phase10ExecutionPredicateObservation): void {
  if (observed.runtime !== PHASE10_C0_RUNTIME) fail(`runtime ${observed.runtime} differs from ${PHASE10_C0_RUNTIME}`);
  if (observed.branch !== PHASE10_EXECUTION_BRANCH) fail(`branch ${observed.branch} differs from ${PHASE10_EXECUTION_BRANCH}`);
  if (!/^[0-9a-f]{40}$/u.test(observed.head)) fail("current head is not a lowercase 40-character commit");
  if (observed.dirtyStatusLines.length !== 0) fail(`worktree is not clean: ${observed.dirtyStatusLines.join(" | ")}`);
  if (!Number.isSafeInteger(observed.diskFreeBytes) || observed.diskFreeBytes < PHASE10_C0_EXECUTOR_RESOURCES.minimumFreeBytes) {
    fail(`free disk ${observed.diskFreeBytes} is below ${PHASE10_C0_EXECUTOR_RESOURCES.minimumFreeBytes}`);
  }
}

function localImports(path: string, bytes: Uint8Array): readonly string[] {
  const source = ts.createSourceFile(path, new TextDecoder("utf-8", { fatal: true }).decode(bytes), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
  const imports: string[] = [];
  const visit = (node: ts.Node): void => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (specifier.startsWith(".")) imports.push(specifier);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]!)) {
      const specifier = node.arguments[0]!.text;
      if (specifier.startsWith(".")) imports.push(specifier);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return Object.freeze([...new Set(imports)].sort(phase10C0Lexical));
}

function resolveImport(importer: string, specifier: string): string {
  let target = posix.normalize(posix.join(posix.dirname(importer), specifier));
  if (!target.endsWith(".ts")) target = `${target}.ts`;
  if (!target.startsWith("runner/src/") || target.includes("../") || target.includes("\\")) {
    fail(`${importer} has unsafe local import ${specifier}`);
  }
  return safeRelative(target, `${importer} local import`);
}

function localModuleImportClosure(root: string, roots: readonly string[]): readonly string[] {
  const pending = [...roots];
  const visited = new Set<string>();
  while (pending.length > 0) {
    const path = pending.pop()!;
    if (visited.has(path)) continue;
    if (!path.startsWith("runner/src/") || !path.endsWith(".ts")) fail(`${path} is outside the safe callable source boundary`);
    const bytes = readFile(root, path, `callable import closure ${path}`);
    visited.add(path);
    for (const specifier of localImports(path, bytes)) pending.push(resolveImport(path, specifier));
  }
  return Object.freeze([...visited].sort(phase10C0Lexical));
}

function matchingFreezeCommit(root: string, protocolPath: string, registryPath: string): string {
  const protocol = readFile(root, protocolPath, "current packet protocol");
  const registry = readFile(root, registryPath, "current callable registry");
  const candidates = git(root, ["rev-list", "HEAD", "--", protocolPath, registryPath]).split("\n").filter((value) => value.length > 0);
  for (const commit of candidates) {
    try {
      const historicalProtocol = gitBytes(root, ["show", `${commit}:${protocolPath}`], "historical packet protocol");
      const historicalRegistry = gitBytes(root, ["show", `${commit}:${registryPath}`], "historical callable registry");
      if (
        historicalProtocol.byteLength === protocol.byteLength && sha256(historicalProtocol) === sha256(protocol) &&
        historicalRegistry.byteLength === registry.byteLength && sha256(historicalRegistry) === sha256(registry)
      ) return commit;
    } catch {
      // Continue to the next ancestor; only an exact two-file freeze is eligible.
    }
  }
  fail("no ancestor commit contains the exact current packet protocol and callable registry bytes");
}

function codeFreeze(root: string, row: Phase10PacketCatalogueRow, registry: Phase10CallableRegistry): Phase10CodeFreeze {
  const commit = matchingFreezeCommit(root, row.protocolPath, row.callableRegistryPath);
  assertAncestor(root, commit, "packet code-freeze commit");
  const executorRoots = [
    "runner/src/phase10-execution-preflight.ts",
    "runner/src/phase10-executor.ts",
    "runner/src/phase10-executor-worker.ts",
  ];
  const moduleClosure = localModuleImportClosure(root, [
    ...registry.callables.map((callable) => callable.modulePath),
    ...executorRoots,
  ]);
  const paths = new Set<string>([
    PHASE10_EXECUTION_MATRIX_PATH,
    PHASE10_EXECUTION_CATALOGUE_PATH,
    PHASE10_EXECUTION_SCHEMA_REGISTRY_PATH,
    PHASE10_C0_SCIENCE_PROTOCOL_PATH,
    row.protocolPath,
    row.callableRegistryPath,
    ...moduleClosure,
  ]);
  const artifacts = [...paths].sort(phase10C0Lexical).map((path) => phase10ExecutionIdentity(root, path));
  for (const artifact of artifacts) {
    assertHistoricalIdentity(root, commit, artifact, `code-freeze artifact ${artifact.path}`);
    if (artifact.path.startsWith("runner/src/")) {
      const attribute = git(root, ["check-attr", "text", "--", artifact.path]);
      if (!attribute.endsWith(": text: unset")) fail(`${artifact.path} does not have checkout-stable text=unset`);
    }
  }
  return Object.freeze({ commit, artifacts: Object.freeze(artifacts) });
}

function parseTimestamp(value: unknown, label: string): string {
  const result = string(value, label);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(result) || Number.isNaN(Date.parse(result))) {
    fail(`${label} is not an exact UTC ISO timestamp`);
  }
  return result;
}

function validationExecution(
  verification: JsonObject,
  registry: Phase10CallableRegistry,
  expectedHead: string,
  expectedRuntime: string,
  expectedCommand: string | null,
  label: string,
): void {
  const execution = object(verification.execution, `${label} execution`);
  exactKeys(execution, ["evaluatorCallableId", "modulePath", "exportName", "byteLength", "sha256", "runtime", "command", "gitHead", "startedOn", "endedOn", "processConcurrency"], `${label} execution`);
  const evaluatorId = string(execution.evaluatorCallableId, `${label} evaluator ID`);
  const evaluator = registry.callables.find((callable) => callable.callableId === evaluatorId);
  if (
    evaluator === undefined || evaluator.role !== "independent-evaluator" || evaluator.resolution !== "resolved" || evaluator.identity === null ||
    execution.modulePath !== evaluator.modulePath || execution.exportName !== evaluator.exportName ||
    execution.byteLength !== evaluator.identity.byteLength || execution.sha256 !== evaluator.identity.sha256 ||
    execution.runtime !== expectedRuntime || execution.gitHead !== expectedHead || execution.processConcurrency !== 1 ||
    (expectedCommand !== null && execution.command !== expectedCommand)
  ) fail(`${label} evaluator execution differs from its registry/preflight`);
  const started = parseTimestamp(execution.startedOn, `${label} startedOn`);
  const ended = parseTimestamp(execution.endedOn, `${label} endedOn`);
  if (Date.parse(ended) < Date.parse(started)) fail(`${label} evaluation ended before it started`);
}

function validateGenericDependencyPreflight(
  root: string,
  packetId: string,
  row: Phase10PacketCatalogueRow,
  obligation: Phase10ObligationPreflightPass,
  protocol: Phase10PacketProtocol,
  registry: Phase10CallableRegistry,
  value: StrictJson,
): { readonly attemptId: string; readonly head: string; readonly runtime: string; readonly command: string; readonly cwd: string } {
  const receipt = object(value, `${packetId} dependency preflight`);
  exactKeys(receipt, ["schema", "receiptId", "matrixId", "protocolId", "registryId", "packetId", "attemptId", "stage", "observed", "outputIds", "checkIds", "negativeControlIds", "callableIds", "selectedBranches", "verdict", "reasons"], `${packetId} dependency preflight`);
  const attemptId = string(receipt.attemptId, `${packetId} dependency attemptId`);
  if (
    receipt.schema !== "phase10-preflight-receipt-v1" || receipt.receiptId !== `phase10-${packetId}-${attemptId}-preflight-v1` ||
    receipt.matrixId !== obligation.matrixId || receipt.protocolId !== obligation.protocolId || receipt.registryId !== obligation.registryId ||
    receipt.packetId !== packetId || receipt.stage !== "run" || receipt.verdict !== "pass"
  ) fail(`${packetId} dependency preflight identity/verdict differs`);
  exactStrings(receipt.outputIds, obligation.outputIds, `${packetId} dependency preflight outputs`);
  exactStrings(receipt.checkIds, obligation.checkIds, `${packetId} dependency preflight checks`);
  exactStrings(receipt.negativeControlIds, obligation.negativeControlIds, `${packetId} dependency preflight controls`);
  exactStrings(receipt.callableIds, obligation.callableIds, `${packetId} dependency preflight callables`);
  exactStrings(receipt.reasons, [], `${packetId} dependency preflight reasons`);
  if (canonicalJson(receipt.selectedBranches) !== canonicalJson(obligation.selectedBranches)) fail(`${packetId} dependency selected branches differ`);
  const observed = object(receipt.observed, `${packetId} dependency observed`);
  const head = string(observed.head, `${packetId} dependency observed head`);
  const runtime = string(observed.runtime, `${packetId} dependency observed runtime`);
  const command = string(observed.command, `${packetId} dependency observed command`);
  const cwd = typeof observed.cwd === "string" ? observed.cwd : root;
  if (observed.branch !== PHASE10_EXECUTION_BRANCH || runtime !== PHASE10_C0_RUNTIME || !/^[0-9a-f]{40}$/u.test(head)) {
    fail(`${packetId} dependency branch/head/runtime differs`);
  }
  sameIdentity(observed.matrix, phase10ExecutionIdentity(root, PHASE10_EXECUTION_MATRIX_PATH), `${packetId} dependency matrix`);
  sameIdentity(observed.protocol, phase10ExecutionIdentity(root, row.protocolPath), `${packetId} dependency protocol`);
  sameIdentity(observed.callableRegistry, phase10ExecutionIdentity(root, row.callableRegistryPath), `${packetId} dependency registry`);
  exactStrings(observed.verificationPaths, row.verificationPaths, `${packetId} dependency verification paths`);
  exactStrings(observed.dependencyPacketIds, protocol.boundDependencyPacketIds, `${packetId} dependency IDs`);
  if (packetId === "c0-derive" || packetId === "c0-publish") {
    const retained = phase10C0ParseRetainedPreflight(phase10PrettyExecutionJsonBytes(receipt), packetId);
    if (retained.gitHead !== head || retained.command !== command || retained.cwd !== root) fail(`${packetId} dependency retained provenance differs from this repository`);
    exactKeys(observed, [
      "launchClass", "branch", "head", "runtime", "command", "cwd", "repositoryBundleRoot", "matrix", "packetCatalogue",
      "artifactSchemaRegistry", "scienceProtocol", "protocol", "callableRegistry", "codeFreeze", "registeredAttemptRoot",
      "attemptDirectory", "candidateDirectory", "stdoutPath", "stderrPath", "exitStatusPath", "resourceLedgerPath", "lockPath",
      "finalPreflightReceiptPath", "finalTerminalReceiptPath", "verificationPaths", "dependencyPacketIds", "dependencyArtifacts", "resources",
    ], `${packetId} dependency observed`);
    sameIdentity(observed.packetCatalogue, phase10ExecutionIdentity(root, PHASE10_EXECUTION_CATALOGUE_PATH), `${packetId} dependency catalogue`);
    sameIdentity(observed.artifactSchemaRegistry, phase10ExecutionIdentity(root, PHASE10_EXECUTION_SCHEMA_REGISTRY_PATH), `${packetId} dependency schema registry`);
    sameIdentity(observed.scienceProtocol, phase10ExecutionIdentity(root, PHASE10_C0_SCIENCE_PROTOCOL_PATH), `${packetId} dependency science protocol`);
    if (observed.launchClass !== "non-solver" || observed.repositoryBundleRoot !== ".") fail(`${packetId} dependency launch/root differs`);
    const paths = executionPaths(row, attemptId);
    if (
      observed.registeredAttemptRoot !== row.attemptRoot || observed.attemptDirectory !== paths.attemptDirectory ||
      observed.candidateDirectory !== paths.candidateDirectory || observed.stdoutPath !== paths.stdout || observed.stderrPath !== paths.stderr ||
      observed.exitStatusPath !== paths.exitStatus || observed.resourceLedgerPath !== paths.resourceLedger || observed.lockPath !== paths.lock ||
      observed.finalPreflightReceiptPath !== row.preflightReceiptPath || observed.finalTerminalReceiptPath !== row.terminalReceiptPath
    ) fail(`${packetId} dependency retained paths differ`);
    const expectedFreeze = codeFreeze(root, row, registry);
    if (canonicalJson(observed.codeFreeze) !== canonicalJson(expectedFreeze)) fail(`${packetId} dependency transitive code freeze differs`);
    const expectedDependencies = protocol.boundDependencyPacketIds.map((dependencyPacketId) => dependencyBinding(root, dependencyPacketId));
    if (canonicalJson(observed.dependencyArtifacts) !== canonicalJson(expectedDependencies)) fail(`${packetId} dependency artifact bindings differ`);
  }
  assertAncestor(root, head, `${packetId} dependency head`);
  for (const identity of [phase10ExecutionIdentity(root, PHASE10_EXECUTION_MATRIX_PATH), phase10ExecutionIdentity(root, row.protocolPath), phase10ExecutionIdentity(root, row.callableRegistryPath)]) {
    assertHistoricalIdentity(root, head, identity, `${packetId} dependency ${identity.path}`);
  }
  for (const callable of registry.callables) {
    if (callable.resolution !== "resolved" || callable.identity === null) fail(`${packetId} dependency has unresolved callable ${callable.callableId}`);
    assertHistoricalIdentity(root, head, Object.freeze({ path: callable.modulePath, ...callable.identity }), `${packetId} dependency callable ${callable.callableId}`);
  }
  return Object.freeze({ attemptId, head, runtime, command, cwd });
}

function validateC0ControlProjection(
  controlId: string,
  beforeValue: StrictJson,
  afterValue: StrictJson,
): void {
  const before = object(beforeValue, `${controlId} before projection`);
  const after = object(afterValue, `${controlId} after projection`);
  if (controlId === "nc-c0-missing-row" || controlId === "nc-c0-duplicate-or-truncated") {
    for (const [label, projection] of [["before", before], ["after", after]] as const) {
      exactKeys(projection, ["presentExpectedRowCount", "missingRowIds", "duplicateRowIds", "defectCodes"], `${controlId} ${label} projection`);
    }
    exactStrings(before.missingRowIds, [], `${controlId} before missing rows`);
    exactStrings(before.duplicateRowIds, [], `${controlId} before duplicate rows`);
    exactStrings(before.defectCodes, [], `${controlId} before defects`);
    if (before.presentExpectedRowCount !== 80 || after.presentExpectedRowCount !== 79) fail(`${controlId} row-count transition differs`);
    if (!Array.isArray(after.missingRowIds) || after.missingRowIds.length !== 1) fail(`${controlId} missing-row effect differs`);
    if (controlId === "nc-c0-missing-row") {
      exactStrings(after.duplicateRowIds, [], `${controlId} after duplicate rows`);
      exactStrings(after.defectCodes, ["c0-missing-row"], `${controlId} after defects`);
    } else {
      if (!Array.isArray(after.duplicateRowIds) || after.duplicateRowIds.length !== 1 || after.duplicateRowIds[0] !== after.missingRowIds[0]) {
        fail(`${controlId} duplicate/missing row witness differs`);
      }
      exactStrings(after.defectCodes, ["c0-duplicate-row", "c0-missing-row"], `${controlId} after defects`);
    }
    return;
  }
  if (controlId === "nc-c0-forbidden-field" || controlId === "nc-c0-forged-producer-verdict") {
    for (const [label, projection] of [["before", before], ["after", after]] as const) {
      exactKeys(projection, ["fieldNames", "overallVerdict", "overallNoPassClass"], `${controlId} ${label} projection`);
      if (!Array.isArray(projection.fieldNames) || projection.fieldNames.some((field) => typeof field !== "string")) fail(`${controlId} ${label} field roster differs`);
    }
    const beforeFields = before.fieldNames as readonly string[];
    const afterFields = after.fieldNames as readonly string[];
    if (controlId === "nc-c0-forbidden-field") {
      const expectedAfter = [...beforeFields, "occupancyMask"].sort(phase10C0Lexical);
      exactStrings(afterFields, expectedAfter, `${controlId} added field`);
      if (beforeFields.includes("occupancyMask") || before.overallVerdict !== after.overallVerdict || before.overallNoPassClass !== after.overallNoPassClass) {
        fail(`${controlId} changed more than the forbidden field`);
      }
    } else {
      exactStrings(afterFields, beforeFields, `${controlId} field roster`);
      const expectedVerdict = before.overallVerdict === "pass" ? "no-pass" : before.overallVerdict === "no-pass" ? "pass" : null;
      if (
        expectedVerdict === null || after.overallVerdict !== expectedVerdict ||
        after.overallNoPassClass !== (expectedVerdict === "pass" ? null : "criterion")
      ) fail(`${controlId} verdict transition differs`);
    }
    return;
  }
  for (const [label, projection] of [["before", before], ["after", after]] as const) {
    exactKeys(projection, ["spacingVerdicts", "overallVerdict", "firstRowATempC"], `${controlId} ${label} projection`);
  }
  if (controlId === "nc-c0-operand-echo") {
    if (
      typeof before.firstRowATempC !== "number" || after.firstRowATempC !== before.firstRowATempC + 1 ||
      canonicalJson(before.spacingVerdicts) !== canonicalJson(after.spacingVerdicts) || before.overallVerdict !== after.overallVerdict
    ) fail(`${controlId} exact operand transition differs`);
    return;
  }
  const failedSpacing = controlId === "nc-c0-coarse-fail-fine-pass" ? 0.7 : 0.35;
  if (!Array.isArray(after.spacingVerdicts) || after.spacingVerdicts.length !== 2 || after.overallVerdict !== "no-pass") fail(`${controlId} mixed-spacing projection differs`);
  const spacingVerdicts = after.spacingVerdicts as readonly StrictJson[];
  const verdictAt = (dxUm: number): StrictJson | undefined => {
    const match = spacingVerdicts.find((value) => value !== null && typeof value === "object" && !Array.isArray(value) && (value as JsonObject).dxUm === dxUm);
    return match === undefined ? undefined : (match as JsonObject).verdict;
  };
  if (verdictAt(failedSpacing) !== "no-pass" || verdictAt(failedSpacing === 0.7 ? 0.35 : 0.7) !== "pass") fail(`${controlId} attacked the wrong spacing`);
}

function validateVerification(
  root: string,
  packetId: string,
  value: StrictJson,
  obligation: Phase10ObligationPreflightPass,
  protocol: Phase10PacketProtocol,
  registry: Phase10CallableRegistry,
  history: { readonly head: string; readonly runtime: string; readonly command: string; readonly cwd: string },
): void {
  const verification = object(value, `${packetId} dependency verification`);
  const topLevelFields = packetId === "c0-publish"
    ? ["schema", "verificationId", "matrixId", "protocolId", "registryId", "packetId", "terminalState", "verifiedArtifacts", "checkResults", "executedNegativeControlIds", "boundDependencyPacketIds", "execution", "aggregateVerdict", "limits"]
    : ["schema", "verificationId", "matrixId", "protocolId", "registryId", "packetId", "terminalState", "verifiedArtifacts", "checkResults", "executedNegativeControlIds", "negativeControlResults", "boundDependencyPacketIds", "execution", "aggregateVerdict", "limits"];
  exactKeys(verification, topLevelFields, `${packetId} dependency verification`);
  const expectedSchema = packetId === "c0-publish" ? "phase10-independent-verification-v1" : "phase10-packet-verification-v1";
  const expectedVerificationId = packetId === "a-p"
    ? "phase10-a-p-verification-v1"
    : packetId === "c0-derive"
    ? "phase10-c0-derive-verification-v1"
    : "phase10-c0-publication-verification-v1";
  const expectedTerminal = packetId === "a-p" ? "pass" : "complete";
  if (
    verification.schema !== expectedSchema || verification.verificationId !== expectedVerificationId ||
    verification.matrixId !== obligation.matrixId || verification.protocolId !== obligation.protocolId ||
    verification.registryId !== obligation.registryId || verification.packetId !== packetId ||
    verification.terminalState !== expectedTerminal || verification.aggregateVerdict !== "pass"
  ) fail(`${packetId} dependency verification identity/verdict differs`);
  const matrix = parsePhase10ObligationMatrix(prettyJson(readFile(root, PHASE10_EXECUTION_MATRIX_PATH, "matrix"), "matrix"));
  const expectedArtifacts = packetId === "c0-publish"
    ? ["out-c0-analysis", "out-c0-artifact-index", "out-c0-comparisons", "out-c0-gaps", "out-c0-historical-limit", "out-c0-report"]
    : obligation.outputIds.filter((outputId) => !new Set(packetId === "a-p"
      ? ["out-ap-self-execution-receipt", "out-ap-verification"]
      : ["out-c0-derive-verification"]).has(outputId));
  if (!Array.isArray(verification.verifiedArtifacts)) fail(`${packetId} dependency verifiedArtifacts is not an array`);
  const actualArtifactIds = verification.verifiedArtifacts.map((value, index) => {
    const artifact = object(value, `${packetId} verified artifact ${index}`);
    exactKeys(artifact, ["outputId", "path", "byteLength", "sha256"], `${packetId} verified artifact ${index}`);
    const outputId = string(artifact.outputId, `${packetId} verified artifact outputId`);
    const output = matrix.outputs.find((entry) => entry.outputId === outputId && (packetId === "c0-publish" || entry.packetId === packetId));
    if (output === undefined || output.artifact.field !== null) fail(`${packetId} verified artifact ${outputId} is unregistered`);
    const expectedIdentity = phase10ExecutionIdentity(root, output.artifact.path);
    if (
      artifact.path !== expectedIdentity.path || artifact.byteLength !== expectedIdentity.byteLength ||
      artifact.sha256 !== expectedIdentity.sha256
    ) fail(`${packetId} verified artifact ${outputId} differs from reopened bytes`);
    return outputId;
  });
  exactStrings(actualArtifactIds, expectedArtifacts, `${packetId} verified artifact roster`);
  if (!Array.isArray(verification.checkResults)) fail(`${packetId} check results is not an array`);
  const checkIds = verification.checkResults.map((value, index) => {
    const result = object(value, `${packetId} check result ${index}`);
    exactKeys(result, ["checkId", "verdict", "reasons", "witnessOutputIds"], `${packetId} check result ${index}`);
    if (result.verdict !== "pass" || !Array.isArray(result.reasons) || result.reasons.length !== 0 || !Array.isArray(result.witnessOutputIds) || result.witnessOutputIds.length === 0) {
      fail(`${packetId} dependency check ${String(result.checkId)} is not an exact pass`);
    }
    const checkId = string(result.checkId, `${packetId} checkId`);
    const expectedWitnesses = packetId === "c0-derive"
      ? C0_DERIVE_CHECK_WITNESSES[checkId]
      : packetId === "c0-publish"
      ? C0_PUBLISH_CHECK_WITNESSES[checkId]
      : undefined;
    if (expectedWitnesses !== undefined) exactStrings(result.witnessOutputIds, expectedWitnesses, `${packetId} ${checkId} witnesses`);
    return checkId;
  });
  exactStrings(checkIds, obligation.checkIds, `${packetId} dependency check roster`);
  exactStrings(verification.executedNegativeControlIds, obligation.negativeControlIds, `${packetId} executed controls`);
  if (packetId !== "c0-publish") {
    if (!Array.isArray(verification.negativeControlResults)) fail(`${packetId} control results is not an array`);
    const controlIds = verification.negativeControlResults.map((value, index) => {
      const result = object(value, `${packetId} control result ${index}`);
      exactKeys(result, ["negativeControlId", "mutationExecuted", "rejected", "beforeWitness", "afterWitness", "errors"], `${packetId} control result ${index}`);
      if (result.mutationExecuted !== true || result.rejected !== true || !Array.isArray(result.errors) || result.errors.length !== 0) fail(`${packetId} control ${String(result.negativeControlId)} did not pass`);
      const before = object(result.beforeWitness, `${packetId} control before witness`);
      const after = object(result.afterWitness, `${packetId} control after witness`);
      for (const [label, witness] of [["before", before], ["after", after]] as const) {
        exactKeys(witness, ["artifactId", "path", "byteLength", "sha256", "semanticFingerprint"], `${packetId} ${label} witness`);
        const semantic = object(witness.semanticFingerprint, `${packetId} ${label} semantic fingerprint`);
        exactKeys(semantic, ["projection", "sha256"], `${packetId} ${label} semantic fingerprint`);
        const semanticBytes = packetId === "a-p"
          ? canonicalJsonBytes(semantic.projection)
          : new TextEncoder().encode(canonicalJson(semantic.projection));
        if (semantic.sha256 !== sha256(semanticBytes)) fail(`${packetId} ${label} semantic fingerprint differs`);
      }
      if (before.sha256 === after.sha256 || object(before.semanticFingerprint, "before semantic").sha256 === object(after.semanticFingerprint, "after semantic").sha256) {
        fail(`${packetId} control mutation did not change byte and semantic witnesses`);
      }
      const controlId = string(result.negativeControlId, `${packetId} control ID`);
      if (packetId === "c0-derive") {
        const expectedArtifact = C0_CONTROL_ARTIFACTS[controlId];
        if (
          expectedArtifact === undefined || before.artifactId !== expectedArtifact.artifactId || after.artifactId !== expectedArtifact.artifactId ||
          before.path !== expectedArtifact.path || after.path !== expectedArtifact.path
        ) fail(`${controlId} artifact target differs`);
        const beforeIdentity = expectedArtifact.artifactId === "input-c0-rows"
          ? { path: expectedArtifact.path, byteLength: 73_873, sha256: "c4fa70f7d8351f998f4800ff580ddaad0eb09fd2e2f2df7f606ca717e789cd14" }
          : phase10ExecutionIdentity(root, expectedArtifact.path);
        if (before.byteLength !== beforeIdentity.byteLength || before.sha256 !== beforeIdentity.sha256) fail(`${controlId} before witness differs from the registered source bytes`);
        if (!Number.isSafeInteger(after.byteLength) || (after.byteLength as number) < 0 || typeof after.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(after.sha256)) {
          fail(`${controlId} after byte identity differs`);
        }
        validateC0ControlProjection(
          controlId,
          object(before.semanticFingerprint, `${controlId} before semantic`).projection as StrictJson,
          object(after.semanticFingerprint, `${controlId} after semantic`).projection as StrictJson,
        );
      }
      return controlId;
    });
    exactStrings(controlIds, obligation.negativeControlIds, `${packetId} dependency control roster`);
  }
  exactStrings(verification.boundDependencyPacketIds, protocol.boundDependencyPacketIds, `${packetId} dependency verification dependencies`);
  if (packetId === "c0-publish") {
    const execution = object(verification.execution, "c0-publish dependency execution");
    exactKeys(execution, ["runtime", "command", "cwd", "gitHead", "startedIso", "finishedIso", "processConcurrency"], "c0-publish dependency execution");
    if (
      execution.runtime !== history.runtime || execution.command !== history.command || execution.cwd !== history.cwd ||
      execution.gitHead !== history.head || execution.processConcurrency !== 1
    ) fail("c0-publish dependency execution differs from retained preflight");
    const started = parseTimestamp(execution.startedIso, "c0-publish dependency startedIso");
    const finished = parseTimestamp(execution.finishedIso, "c0-publish dependency finishedIso");
    if (Date.parse(finished) < Date.parse(started)) fail("c0-publish dependency execution ended before it started");
  } else {
    validationExecution(
      verification,
      registry,
      history.head,
      history.runtime,
      packetId === "a-p" ? AP_VERIFY_COMMAND : history.command,
      `${packetId} dependency verification`,
    );
  }
}

function validateApPreflight(
  root: string,
  row: Phase10PacketCatalogueRow,
  obligation: Phase10ObligationPreflightPass,
  protocol: Phase10PacketProtocol,
  registry: Phase10CallableRegistry,
  value: StrictJson,
): { readonly attemptId: string; readonly head: string; readonly runtime: string; readonly command: string; readonly cwd: string } {
  const receipt = object(value, "a-p dependency preflight");
  const history = validateGenericDependencyPreflight(root, "a-p", row, obligation, protocol, registry, value);
  const observed = object(receipt.observed, "a-p dependency observed");
  if (
    observed.launchClass !== "static-contract" || observed.machineLaunchChecks !== "not-applicable" ||
    observed.command !== AP_PRODUCE_COMMAND || observed.repositoryBundleRoot !== "." ||
    observed.registeredAttemptRoot !== row.attemptRoot || observed.finalPreflightReceiptPath !== row.preflightReceiptPath ||
    observed.finalTerminalReceiptPath !== row.terminalReceiptPath
  ) fail("a-p dependency frozen static observations differ");
  return history;
}

function dependencyBinding(root: string, packetId: string): Phase10DependencyBinding {
  const row = catalogueRow(root, packetId);
  const matrixValue = prettyJson(readFile(root, PHASE10_EXECUTION_MATRIX_PATH, "dependency matrix"), "dependency matrix");
  const protocolValue = prettyJson(readFile(root, row.protocolPath, `${packetId} dependency protocol`), `${packetId} dependency protocol`);
  const registryValue = prettyJson(readFile(root, row.callableRegistryPath, `${packetId} dependency registry`), `${packetId} dependency registry`);
  const protocol = parsePhase10PacketProtocol(protocolValue);
  const registry = parsePhase10CallableRegistry(registryValue);
  const obligation = phase10ObligationRunPreflight(matrixValue, protocolValue, registryValue, root);
  const preflightValue = prettyJson(readFile(root, row.preflightReceiptPath, `${packetId} dependency preflight`), `${packetId} dependency preflight`);
  const history = packetId === "a-p"
    ? validateApPreflight(root, row, obligation, protocol, registry, preflightValue)
    : validateGenericDependencyPreflight(root, packetId, row, obligation, protocol, registry, preflightValue);
  const terminalValue = prettyJson(readFile(root, row.terminalReceiptPath, `${packetId} dependency terminal`), `${packetId} dependency terminal`);
  const terminal = parsePhase10ExecutionReceipt(terminalValue);
  const expectedTerminal = packetId === "a-p" ? "pass" : "complete";
  if (terminal.receiptId !== `phase10-${packetId}-${history.attemptId}-terminal-v1` || terminal.terminalState !== expectedTerminal) {
    fail(`${packetId} dependency terminal ID/state differs from its retained preflight`);
  }
  phase10ObligationReceiptPreflight(matrixValue, protocolValue, registryValue, terminal, root);
  const verificationArtifacts = row.verificationPaths.map((path) => {
    const value = prettyJson(readFile(root, path, `${packetId} dependency verification`), `${packetId} dependency verification`);
    validateVerification(root, packetId, value, obligation, protocol, registry, history);
    return phase10ExecutionIdentity(root, path);
  });
  return Object.freeze({
    packetId,
    protocol: phase10ExecutionIdentity(root, row.protocolPath),
    callableRegistry: phase10ExecutionIdentity(root, row.callableRegistryPath),
    preflightReceipt: phase10ExecutionIdentity(root, row.preflightReceiptPath),
    terminalReceipt: phase10ExecutionIdentity(root, row.terminalReceiptPath),
    verificationArtifacts: Object.freeze(verificationArtifacts),
  });
}

/** Read-only dependency audit used by downstream executors and synthetic conformance tests. */
export function phase10ValidatePublishedDependency(
  repositoryRoot: string,
  packetId: string,
): Phase10DependencyBinding {
  return dependencyBinding(safeRoot(repositoryRoot), packetId);
}

function executionPaths(row: Phase10PacketCatalogueRow, attemptId: string): Phase10ExecutionPaths {
  const attemptDirectory = `${row.attemptRoot}/${attemptId}`;
  return Object.freeze({
    attemptDirectory,
    candidateDirectory: `${attemptDirectory}/candidate`,
    retainedPreflight: `${attemptDirectory}/preflight.json`,
    retainedTerminal: `${attemptDirectory}/terminal-receipt.json`,
    stdout: `${attemptDirectory}/stdout.log`,
    stderr: `${attemptDirectory}/stderr.log`,
    exitStatus: `${attemptDirectory}/exit-status.json`,
    resourceLedger: `${attemptDirectory}/resource-ledger.json`,
    lock: `${row.attemptRoot}/writer.lock`,
  });
}

export function phase10InspectExecutionPreflight(request: Phase10ExecutionPreflightRequest): Phase10ExecutionPreflightContext {
  const root = safeRoot(request.repositoryRoot);
  if (!/^[a-z0-9][a-z0-9.-]*$/u.test(request.attemptId)) fail("attempt ID is not a safe stable token");
  const row = catalogueRow(root, request.packetId);
  if (row.packetId !== request.packetId || row.launchClass !== "non-solver") fail(`${request.packetId} is not a registered non-solver packet`);
  if (request.protocolPath !== row.protocolPath) fail("protocol argument differs from the exact packet-catalogue path");
  const paths = executionPaths(row, request.attemptId);
  for (const path of Object.values(paths)) safeAbsolute(root, path, `execution path ${path}`);
  const status = git(root, ["status", "--porcelain=v1", "--untracked-files=all"])
    .split("\n").filter((line) => line.length > 0).sort(phase10C0Lexical);
  const allowed = new Set((request.allowedStatusPaths ?? []).map((path) => `?? ${safeRelative(path, "allowed partial publication path")}`));
  const dirty = status.filter((line) => !allowed.has(line));
  const stat = statfsSync(root, { bigint: true });
  const diskFreeBytesBig = stat.bavail * stat.bsize;
  const diskFreeBytes = diskFreeBytesBig > BigInt(Number.MAX_SAFE_INTEGER) ? Number.MAX_SAFE_INTEGER : Number(diskFreeBytesBig);
  const branch = git(root, ["branch", "--show-current"]);
  const head = git(root, ["rev-parse", "HEAD"]);
  phase10ValidateExecutionPredicates({ runtime: process.version, branch, head, dirtyStatusLines: dirty, diskFreeBytes });
  const matrixBytes = readFile(root, PHASE10_EXECUTION_MATRIX_PATH, "obligation matrix");
  const protocolBytes = readFile(root, row.protocolPath, "packet protocol");
  const registryBytes = readFile(root, row.callableRegistryPath, "callable registry");
  const matrixValue = prettyJson(matrixBytes, "obligation matrix");
  const protocolValue = prettyJson(protocolBytes, "packet protocol");
  const registryValue = prettyJson(registryBytes, "callable registry");
  const protocol = parsePhase10PacketProtocol(protocolValue);
  const registry = parsePhase10CallableRegistry(registryValue);
  const obligation = phase10ObligationRunPreflight(matrixValue, protocolValue, registryValue, root);
  if (protocol.packetId !== request.packetId || registry.packetId !== request.packetId || obligation.packetId !== request.packetId) fail("packet identity differs across registration layers");
  const command = phase10C0ExecutorCommand(request.packetId, request.attemptId);
  const freeze = codeFreeze(root, row, registry);
  const dependencies = protocol.boundDependencyPacketIds.map((packetId) => dependencyBinding(root, packetId));
  return Object.freeze({
    repositoryRoot: root,
    packetId: request.packetId,
    attemptId: request.attemptId,
    command,
    row,
    paths,
    matrixBytes,
    protocolBytes,
    registryBytes,
    matrixValue,
    protocolValue,
    registryValue,
    protocol,
    registry,
    obligation,
    branch,
    head,
    runtime: process.version,
    diskFreeBytes,
    codeFreeze: freeze,
    dependencies: Object.freeze(dependencies),
  });
}

export function phase10BuildExecutionPreflightReceipt(context: Phase10ExecutionPreflightContext): StrictJson {
  return strictJsonSnapshot({
    schema: "phase10-preflight-receipt-v1",
    receiptId: `phase10-${context.packetId}-${context.attemptId}-preflight-v1`,
    matrixId: context.obligation.matrixId,
    protocolId: context.obligation.protocolId,
    registryId: context.obligation.registryId,
    packetId: context.packetId,
    attemptId: context.attemptId,
    stage: "run",
    observed: {
      launchClass: "non-solver",
      branch: context.branch,
      head: context.head,
      runtime: context.runtime,
      command: context.command,
      cwd: context.repositoryRoot,
      repositoryBundleRoot: ".",
      matrix: phase10ExecutionIdentity(context.repositoryRoot, PHASE10_EXECUTION_MATRIX_PATH),
      packetCatalogue: phase10ExecutionIdentity(context.repositoryRoot, PHASE10_EXECUTION_CATALOGUE_PATH),
      artifactSchemaRegistry: phase10ExecutionIdentity(context.repositoryRoot, PHASE10_EXECUTION_SCHEMA_REGISTRY_PATH),
      scienceProtocol: phase10ExecutionIdentity(context.repositoryRoot, PHASE10_C0_SCIENCE_PROTOCOL_PATH),
      protocol: phase10ExecutionIdentity(context.repositoryRoot, context.row.protocolPath),
      callableRegistry: phase10ExecutionIdentity(context.repositoryRoot, context.row.callableRegistryPath),
      codeFreeze: context.codeFreeze,
      registeredAttemptRoot: context.row.attemptRoot,
      attemptDirectory: context.paths.attemptDirectory,
      candidateDirectory: context.paths.candidateDirectory,
      stdoutPath: context.paths.stdout,
      stderrPath: context.paths.stderr,
      exitStatusPath: context.paths.exitStatus,
      resourceLedgerPath: context.paths.resourceLedger,
      lockPath: context.paths.lock,
      finalPreflightReceiptPath: context.row.preflightReceiptPath,
      finalTerminalReceiptPath: context.row.terminalReceiptPath,
      verificationPaths: context.row.verificationPaths,
      dependencyPacketIds: context.protocol.boundDependencyPacketIds,
      dependencyArtifacts: context.dependencies,
      resources: {
        ...PHASE10_C0_EXECUTOR_RESOURCES,
        observedFreeBytes: context.diskFreeBytes,
      },
    },
    outputIds: context.obligation.outputIds,
    checkIds: context.obligation.checkIds,
    negativeControlIds: context.obligation.negativeControlIds,
    callableIds: context.obligation.callableIds,
    selectedBranches: context.obligation.selectedBranches,
    verdict: "pass",
    reasons: [],
  });
}

export function phase10PrettyExecutionJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

export function phase10ValidateExecutionTerminal(
  context: Phase10ExecutionPreflightContext,
  value: unknown,
  expectedState: "complete" | "fail" | "refusal",
): Phase10ExecutionReceipt {
  const receipt = parsePhase10ExecutionReceipt(value);
  if (
    receipt.receiptId !== `phase10-${context.packetId}-${context.attemptId}-terminal-v1` ||
    receipt.terminalState !== expectedState
  ) fail("terminal receipt ID/state differs from the retained attempt");
  phase10ObligationReceiptPreflight(context.matrixValue, context.protocolValue, context.registryValue, receipt, context.repositoryRoot);
  return receipt;
}

export function phase10ExpectedTerminalReceipt(
  context: Phase10ExecutionPreflightContext,
  terminalState: "complete" | "fail" | "refusal",
): Phase10ExecutionReceipt {
  return Object.freeze({
    schema: "phase10-execution-receipt-v1",
    receiptId: `phase10-${context.packetId}-${context.attemptId}-terminal-v1`,
    matrixId: context.obligation.matrixId,
    protocolId: context.obligation.protocolId,
    registryId: context.obligation.registryId,
    packetId: context.packetId,
    terminalState,
    producedOutputIds: context.obligation.outputIds,
    executedCheckIds: context.obligation.checkIds,
    evaluatedCheckIds: context.obligation.checkIds,
    executedNegativeControlIds: context.obligation.negativeControlIds,
    boundDependencyPacketIds: context.protocol.boundDependencyPacketIds,
  });
}

export function phase10VerifyPreflightReceipt(context: Phase10ExecutionPreflightContext, value: unknown): void {
  const expected = phase10BuildExecutionPreflightReceipt(context);
  if (canonicalJson(value) !== canonicalJson(expected)) fail("retained preflight differs from current observations and exact stage sets");
}

export function phase10VerificationValue(root: string, path: string): StrictJson {
  return prettyJson(readFile(root, path, path), path);
}

export function phase10PathExists(root: string, path: string): boolean {
  return existsSync(safeAbsolute(root, path, path));
}
