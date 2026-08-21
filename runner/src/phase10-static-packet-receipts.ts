import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import {
  canonicalJson,
  canonicalJsonBytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  PHASE10_EXECUTION_RECEIPT_SCHEMA,
  parsePhase10CallableRegistry,
  parsePhase10ExecutionReceipt,
  parsePhase10ObligationMatrix,
  parsePhase10PacketProtocol,
  type Phase10ExecutionReceipt,
  type Phase10TerminalState,
} from "./phase10-contracts.ts";
import {
  phase10ObligationReceiptPreflight,
  phase10ObligationRunPreflight,
  type Phase10ObligationPreflightPass,
} from "./phase10-obligation-preflight.ts";

const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json";
const CATALOGUE_PATH = "research/phase10-execution-v1/packet-catalogue.json";
const EXPECTED_BRANCH = "phase10/evidence-verification";
const AP_CANDIDATE_DIRECTORY = "out/phase10-obligation-preflight-v1-candidate";
const AP_PRODUCE_COMMAND =
  "node runner/src/phase10-ap-publish.ts produce --repository-root . --out out/phase10-obligation-preflight-v1-candidate";
const AP_VERIFY_COMMAND =
  "node runner/src/phase10-ap-independent.ts verify --repository-root . --bundle out/phase10-obligation-preflight-v1-candidate --receipt out/phase10-obligation-preflight-v1-candidate/verification.json";
const AP_VERIFICATION_ID = "phase10-a-p-verification-v1";
const AP_REGISTRY_OUTPUT_ID = "out-ap-self-callable-registry";
const AP_REGISTRY_PATH = "research/phase10-execution-v1/packets/a-p/callable-registry.json";
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
  AP_REGISTRY_OUTPUT_ID,
  "out-ap-self-packet-protocol",
  "out-ap-uncalled-check-receipt",
]);
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
const AP_CONTROL_IDS = Object.freeze([
  "nc-ap-missing-producer",
  "nc-ap-uncalled-check",
]);
const AP_VERIFICATION_LIMITS = Object.freeze([
  "A-P establishes registered-obligation completeness only; it does not establish scientific correctness.",
  "The verification excludes the later A-P terminal receipt by the frozen acyclic output DAG; that receipt binds this verification.",
].sort(lexical));
const AS_PRODUCE_COMMAND =
  "node runner/src/phase10-scope-overlay.ts produce --repository-root . --protocol research/phase10-scope-classification-protocol-v1.json --out out/phase10-scope-intake-v1-candidate";
const AI_PRODUCE_COMMAND =
  "node runner/src/phase10-intake.ts produce --repository-root . --protocol research/phase10-execution-v1/packets/a-i/protocol.json --out out/phase10-scope-intake-v1-a-i-candidate";

interface PacketCatalogueRow {
  readonly packetId: string;
  readonly launchClass: string;
  readonly protocolPath: string;
  readonly callableRegistryPath: string;
  readonly attemptRoot: string;
  readonly preflightReceiptPath: string;
  readonly terminalReceiptPath: string;
  readonly verificationPaths: readonly string[];
}

interface StaticPacketOptions {
  readonly repositoryRoot: string;
  readonly packetId: string;
  readonly attemptId: string;
  readonly candidateDirectory: string;
  readonly command: string;
  readonly repositoryBundleRoot: ".";
}

interface StaticTerminalOptions extends StaticPacketOptions {
  readonly terminalState: Phase10TerminalState;
}

interface ArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface StaticPreflightReceipt {
  readonly schema: "phase10-preflight-receipt-v1";
  readonly receiptId: string;
  readonly matrixId: string;
  readonly protocolId: string;
  readonly registryId: string;
  readonly packetId: string;
  readonly attemptId: string;
  readonly stage: "run";
  readonly observed: StrictJson;
  readonly outputIds: readonly string[];
  readonly checkIds: readonly string[];
  readonly negativeControlIds: readonly string[];
  readonly callableIds: readonly string[];
  readonly selectedBranches: StrictJson;
  readonly verdict: "pass";
  readonly reasons: readonly string[];
}

function fail(message: string): never {
  throw new Error(`Phase 10 static packet refused: ${message}`);
}

function lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(lexical);
  const wanted = [...expected].sort(lexical);
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} keys differ`);
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    fail(`${label} must be a nonempty trimmed string`);
  }
  return value;
}

function exactStaticProduceCommand(packetId: string): string {
  if (packetId === "a-p") return AP_PRODUCE_COMMAND;
  if (packetId === "a-s") return AS_PRODUCE_COMMAND;
  if (packetId === "a-i") return AI_PRODUCE_COMMAND;
  fail(`${packetId} has no exact frozen static produce command`);
}

function validateStaticOptions(options: StaticPacketOptions): void {
  if (options.repositoryBundleRoot !== ".") fail("repository bundle root must be the logical dot root");
  if (options.command !== exactStaticProduceCommand(options.packetId)) {
    fail(`${options.packetId} command differs from the exact frozen static produce command`);
  }
}

function safePath(repositoryRoot: string, path: string, label: string): string {
  if (
    isAbsolute(path) ||
    path.includes("\\") ||
    path.startsWith("/") ||
    path.endsWith("/") ||
    path.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    fail(`${label} is not a safe repository-relative path`);
  }
  const absoluteRoot = resolve(repositoryRoot);
  const absolutePath = resolve(absoluteRoot, path);
  const fromRoot = relative(absoluteRoot, absolutePath);
  if (fromRoot.length === 0 || fromRoot === ".." || fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(fromRoot)) {
    fail(`${label} escapes the repository root`);
  }
  return absolutePath;
}

function readJson(repositoryRoot: string, path: string, label: string): StrictJson {
  const bytes = new Uint8Array(readFileSync(safePath(repositoryRoot, path, label)));
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} is not valid UTF-8`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    fail(`${label} is not valid JSON`);
  }
  const snapshot = strictJsonSnapshot(parsed);
  if (text !== `${JSON.stringify(snapshot, null, 2)}\n`) {
    fail(`${label} is not exact two-space JSON with one terminal LF`);
  }
  return snapshot;
}

function jsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

function parseReceiptBytes(bytes: Uint8Array, label: string): StrictJson {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} is not valid UTF-8`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    fail(`${label} is not valid JSON`);
  }
  const snapshot = strictJsonSnapshot(parsed);
  if (text !== `${JSON.stringify(snapshot, null, 2)}\n`) {
    fail(`${label} is not exact two-space JSON with one terminal LF`);
  }
  return snapshot;
}

function exactArray(actual: unknown, expected: readonly string[], label: string): void {
  if (
    !Array.isArray(actual) ||
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    fail(`${label} differs from the active obligation set`);
  }
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function exactIdentity(actual: unknown, expected: ArtifactIdentity, label: string): void {
  const row = record(actual, label);
  exactKeys(row, ["path", "byteLength", "sha256"], label);
  if (
    row.path !== expected.path ||
    row.byteLength !== expected.byteLength ||
    row.sha256 !== expected.sha256
  ) {
    fail(`${label} differs from the current registered bytes`);
  }
}

function exactObserved(
  actual: unknown,
  repositoryRoot: string,
  row: PacketCatalogueRow,
  options: StaticPacketOptions,
  dependencyPacketIds: readonly string[],
): void {
  const observed = record(actual, "static preflight receipt observed predicates");
  exactKeys(
    observed,
    [
      "launchClass",
      "machineLaunchChecks",
      "branch",
      "head",
      "runtime",
      "command",
      "repositoryBundleRoot",
      "matrix",
      "protocol",
      "callableRegistry",
      "candidateDirectory",
      "registeredAttemptRoot",
      "finalPreflightReceiptPath",
      "finalTerminalReceiptPath",
      "verificationPaths",
      "dependencyPacketIds",
      "dependencyArtifacts",
    ],
    "static preflight receipt observed predicates",
  );
  const branch = git(repositoryRoot, ["branch", "--show-current"]);
  const head = git(repositoryRoot, ["rev-parse", "HEAD"]);
  const expectedScalars: Readonly<Record<string, string>> = Object.freeze({
    launchClass: "static-contract",
    machineLaunchChecks: "not-applicable",
    branch,
    head,
    runtime: process.version,
    command: exactStaticProduceCommand(options.packetId),
    repositoryBundleRoot: ".",
    candidateDirectory: options.candidateDirectory,
    registeredAttemptRoot: row.attemptRoot,
    finalPreflightReceiptPath: row.preflightReceiptPath,
    finalTerminalReceiptPath: row.terminalReceiptPath,
  });
  for (const [field, expected] of Object.entries(expectedScalars)) {
    if (observed[field] !== expected) fail(`static preflight observed ${field} differs`);
  }
  if (branch !== EXPECTED_BRANCH) fail(`branch ${branch} is not ${EXPECTED_BRANCH}`);
  if (!/^[0-9a-f]{40}$/u.test(head)) fail("current Git head is not a lowercase 40-character commit");
  exactIdentity(observed.matrix, identity(repositoryRoot, MATRIX_PATH), "static preflight observed matrix");
  exactIdentity(
    observed.protocol,
    identity(repositoryRoot, row.protocolPath),
    "static preflight observed protocol",
  );
  exactIdentity(
    observed.callableRegistry,
    identity(repositoryRoot, row.callableRegistryPath),
    "static preflight observed callable registry",
  );
  exactArray(observed.verificationPaths, row.verificationPaths, "preflight verification paths");
  exactArray(observed.dependencyPacketIds, dependencyPacketIds, "preflight dependency packet IDs");
  const expectedDependencies = dependencyArtifactBindings(repositoryRoot, dependencyPacketIds);
  if (canonicalJson(observed.dependencyArtifacts) !== canonicalJson(expectedDependencies)) {
    fail("preflight dependency artifact bindings differ from current published dependency bytes");
  }
}

function validateStaticPreflightReceipt(
  value: StrictJson,
  options: StaticPacketOptions,
  preflight: Phase10ObligationPreflightPass,
  repositoryRoot: string,
  row: PacketCatalogueRow,
  dependencyPacketIds: readonly string[],
): void {
  const receipt = record(value, "static preflight receipt");
  exactKeys(
    receipt,
    [
      "schema",
      "receiptId",
      "matrixId",
      "protocolId",
      "registryId",
      "packetId",
      "attemptId",
      "stage",
      "observed",
      "outputIds",
      "checkIds",
      "negativeControlIds",
      "callableIds",
      "selectedBranches",
      "verdict",
      "reasons",
    ],
    "static preflight receipt",
  );
  const expectedScalars: Readonly<Record<string, string>> = Object.freeze({
    schema: "phase10-preflight-receipt-v1",
    receiptId: `phase10-${options.packetId}-${options.attemptId}-preflight-v1`,
    matrixId: preflight.matrixId,
    protocolId: preflight.protocolId,
    registryId: preflight.registryId,
    packetId: options.packetId,
    attemptId: options.attemptId,
    stage: "run",
    verdict: "pass",
  });
  for (const [field, expected] of Object.entries(expectedScalars)) {
    if (receipt[field] !== expected) fail(`static preflight receipt ${field} differs`);
  }
  exactObserved(receipt.observed, repositoryRoot, row, options, dependencyPacketIds);
  exactArray(receipt.outputIds, preflight.outputIds, "preflight output IDs");
  exactArray(receipt.checkIds, preflight.checkIds, "preflight check IDs");
  exactArray(
    receipt.negativeControlIds,
    preflight.negativeControlIds,
    "preflight negative-control IDs",
  );
  exactArray(receipt.callableIds, preflight.callableIds, "preflight callable IDs");
  if (JSON.stringify(receipt.selectedBranches) !== JSON.stringify(preflight.selectedBranches)) {
    fail("preflight selected branches differ from the active protocol");
  }
  exactArray(receipt.reasons, [], "passing preflight reasons");
}

function identity(repositoryRoot: string, path: string): ArtifactIdentity {
  const absolutePath = safePath(repositoryRoot, path, path);
  const stat = lstatSync(absolutePath);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${path} must be a regular non-symlink file`);
  const physicalRoot = realpathSync.native(repositoryRoot);
  const physicalPath = realpathSync.native(absolutePath);
  if (physicalPath !== physicalRoot && !pathIsWithin(physicalRoot, physicalPath)) {
    fail(`${path} resolves outside the repository`);
  }
  const bytes = new Uint8Array(readFileSync(physicalPath));
  return Object.freeze({
    path,
    byteLength: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}

function catalogueRow(repositoryRoot: string, packetId: string): PacketCatalogueRow {
  const catalogue = record(readJson(repositoryRoot, CATALOGUE_PATH, CATALOGUE_PATH), "packet catalogue");
  exactKeys(catalogue, ["schema", "catalogueId", "matrixId", "packets"], "packet catalogue");
  if (catalogue.schema !== "phase10-packet-catalogue-v1" || !Array.isArray(catalogue.packets)) {
    fail("packet catalogue has the wrong schema or packet roster");
  }
  const matches = catalogue.packets.filter((value) => record(value, "packet catalogue row").packetId === packetId);
  if (matches.length !== 1) fail(`packet catalogue has ${matches.length} rows for ${packetId}`);
  const row = record(matches[0], `${packetId} catalogue row`);
  exactKeys(
    row,
    [
      "packetId",
      "launchClass",
      "protocolPath",
      "callableRegistryPath",
      "attemptRoot",
      "preflightReceiptPath",
      "terminalReceiptPath",
      "verificationPaths",
    ],
    `${packetId} catalogue row`,
  );
  if (!Array.isArray(row.verificationPaths) || row.verificationPaths.length === 0) {
    fail(`${packetId} catalogue row has no verification path`);
  }
  const parsed: PacketCatalogueRow = Object.freeze({
    packetId: string(row.packetId, `${packetId}.packetId`),
    launchClass: string(row.launchClass, `${packetId}.launchClass`),
    protocolPath: string(row.protocolPath, `${packetId}.protocolPath`),
    callableRegistryPath: string(row.callableRegistryPath, `${packetId}.callableRegistryPath`),
    attemptRoot: string(row.attemptRoot, `${packetId}.attemptRoot`),
    preflightReceiptPath: string(row.preflightReceiptPath, `${packetId}.preflightReceiptPath`),
    terminalReceiptPath: string(row.terminalReceiptPath, `${packetId}.terminalReceiptPath`),
    verificationPaths: Object.freeze(
      row.verificationPaths.map((value, index) => string(value, `${packetId}.verificationPaths[${index}]`)),
    ),
  });
  for (const [label, path] of Object.entries(parsed).filter(([, value]) => typeof value === "string" && String(value).includes("/"))) {
    safePath(repositoryRoot, path as string, `${packetId}.${label}`);
  }
  for (const [index, path] of parsed.verificationPaths.entries()) {
    safePath(repositoryRoot, path, `${packetId}.verificationPaths[${index}]`);
  }
  if (parsed.packetId !== packetId || parsed.launchClass !== "static-contract") {
    fail(`${packetId} is not the registered static-contract packet`);
  }
  return parsed;
}

function git(repositoryRoot: string, args: readonly string[]): string {
  return execFileSync("git", args, { cwd: resolve(repositoryRoot), encoding: "utf8" }).trim();
}

function sha256Bytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function gitBytes(repositoryRoot: string, args: readonly string[], label: string): Uint8Array {
  try {
    return new Uint8Array(execFileSync("git", args, {
      cwd: resolve(repositoryRoot),
      encoding: null,
      maxBuffer: 32 * 1024 * 1024,
    }));
  } catch {
    fail(`${label} is not present at the retained dependency head`);
  }
}

function assertHistoricalIdentity(
  repositoryRoot: string,
  head: string,
  expected: ArtifactIdentity,
  label: string,
): void {
  const historical = gitBytes(repositoryRoot, ["show", `${head}:${expected.path}`], label);
  if (
    historical.byteLength !== expected.byteLength ||
    sha256Bytes(historical) !== expected.sha256
  ) {
    fail(`${label} bytes at the retained dependency head differ from the bound identity`);
  }
}

function assertHistoricalCommitAncestor(repositoryRoot: string, head: string, label: string): void {
  try {
    git(repositoryRoot, ["cat-file", "-e", `${head}^{commit}`]);
  } catch {
    fail(`${label} does not resolve to a commit in the current repository`);
  }
  try {
    git(repositoryRoot, ["merge-base", "--is-ancestor", head, "HEAD"]);
  } catch {
    fail(`${label} is not an ancestor of the current HEAD`);
  }
}

function assertCleanRepository(repositoryRoot: string, label: string): void {
  const dirty = git(repositoryRoot, ["status", "--porcelain=v1", "--untracked-files=all"]);
  if (dirty.length !== 0) fail(`${label}: tracked or untracked repository changes exist`);
}

function assertOnlyExactPublishedChanges(
  repositoryRoot: string,
  label: string,
  allowedUntrackedPaths: readonly string[],
): void {
  const actual = git(repositoryRoot, ["status", "--porcelain=v1", "--untracked-files=all"])
    .split("\n")
    .filter((line) => line.length > 0)
    .sort(lexical);
  const allowed = new Set(allowedUntrackedPaths.map((path) => `?? ${path}`));
  if (actual.some((line) => !allowed.has(line))) {
    fail(`${label}: repository changes differ from exact byte-validated partial publication files`);
  }
}

function pathIsWithin(parent: string, candidate: string): boolean {
  const displacement = relative(resolve(parent), resolve(candidate));
  return displacement !== "" && displacement !== ".." && !displacement.startsWith(`..${sep}`) && !isAbsolute(displacement);
}

function assertSafeExistingParent(repositoryRoot: string, path: string, label: string): void {
  let current = dirname(path);
  while (!existsSync(current)) {
    const next = dirname(current);
    if (next === current) fail(`${label} has no existing repository parent`);
    current = next;
  }
  const stat = lstatSync(current);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    fail(`${label} existing parent must be a non-symlink directory`);
  }
  const physicalRoot = realpathSync.native(repositoryRoot);
  const physicalParent = realpathSync.native(current);
  if (physicalParent !== physicalRoot && !pathIsWithin(physicalRoot, physicalParent)) {
    fail(`${label} existing parent resolves outside the repository`);
  }
}

function assertSafeExistingDirectory(repositoryRoot: string, path: string, label: string): void {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail(`${label} must be a non-symlink directory`);
  const physicalRoot = realpathSync.native(repositoryRoot);
  const physicalPath = realpathSync.native(path);
  if (physicalPath !== physicalRoot && !pathIsWithin(physicalRoot, physicalPath)) {
    fail(`${label} resolves outside the repository`);
  }
}

function loadPacket(repositoryRoot: string, row: PacketCatalogueRow): {
  readonly matrix: StrictJson;
  readonly protocol: StrictJson;
  readonly registry: StrictJson;
  readonly packetProtocol: ReturnType<typeof parsePhase10PacketProtocol>;
  readonly preflight: Phase10ObligationPreflightPass;
} {
  const matrix = readJson(repositoryRoot, MATRIX_PATH, MATRIX_PATH);
  const protocol = readJson(repositoryRoot, row.protocolPath, row.protocolPath);
  const registry = readJson(repositoryRoot, row.callableRegistryPath, row.callableRegistryPath);
  const packetProtocol = parsePhase10PacketProtocol(protocol);
  return Object.freeze({
    matrix,
    protocol,
    registry,
    packetProtocol,
    preflight: phase10ObligationRunPreflight(matrix, protocol, registry, repositoryRoot),
  });
}

interface DependencyPreflightHistory {
  readonly attemptId: string;
  readonly head: string;
  readonly runtime: string;
}

function validateApDependencyPreflight(
  repositoryRoot: string,
  row: PacketCatalogueRow,
  value: StrictJson,
  preflight: Phase10ObligationPreflightPass,
  protocol: ReturnType<typeof parsePhase10PacketProtocol>,
  matrixIdentity: ArtifactIdentity,
  protocolIdentity: ArtifactIdentity,
  registryIdentity: ArtifactIdentity,
  registryValue: StrictJson,
): DependencyPreflightHistory {
  const receipt = record(value, "a-p dependency preflight receipt");
  exactKeys(
    receipt,
    [
      "schema",
      "receiptId",
      "matrixId",
      "protocolId",
      "registryId",
      "packetId",
      "attemptId",
      "stage",
      "observed",
      "outputIds",
      "checkIds",
      "negativeControlIds",
      "callableIds",
      "selectedBranches",
      "verdict",
      "reasons",
    ],
    "a-p dependency preflight receipt",
  );
  const attemptId = string(receipt.attemptId, "a-p dependency preflight attemptId");
  if (
    receipt.schema !== "phase10-preflight-receipt-v1" ||
    receipt.receiptId !== `phase10-a-p-${attemptId}-preflight-v1` ||
    receipt.matrixId !== preflight.matrixId ||
    receipt.protocolId !== preflight.protocolId ||
    receipt.registryId !== preflight.registryId ||
    receipt.packetId !== "a-p" ||
    receipt.stage !== "run" ||
    receipt.verdict !== "pass"
  ) {
    fail("a-p dependency preflight identity or pass verdict differs");
  }
  exactArray(receipt.outputIds, preflight.outputIds, "a-p dependency preflight output IDs");
  exactArray(receipt.checkIds, preflight.checkIds, "a-p dependency preflight check IDs");
  exactArray(
    receipt.negativeControlIds,
    preflight.negativeControlIds,
    "a-p dependency preflight negative-control IDs",
  );
  exactArray(receipt.callableIds, preflight.callableIds, "a-p dependency preflight callable IDs");
  exactArray(receipt.reasons, [], "a-p dependency preflight reasons");
  if (canonicalJson(receipt.selectedBranches) !== canonicalJson(preflight.selectedBranches)) {
    fail("a-p dependency preflight selected branches differ");
  }

  const observed = record(receipt.observed, "a-p dependency preflight observed predicates");
  exactKeys(
    observed,
    [
      "launchClass",
      "machineLaunchChecks",
      "branch",
      "head",
      "runtime",
      "command",
      "repositoryBundleRoot",
      "candidateDirectory",
      "registeredAttemptRoot",
      "finalPreflightReceiptPath",
      "finalTerminalReceiptPath",
      "verificationPaths",
      "matrix",
      "protocol",
      "callableRegistry",
      "dependencyPacketIds",
      "dependencyArtifacts",
    ],
    "a-p dependency preflight observed predicates",
  );
  const head = string(observed.head, "a-p dependency preflight observed head");
  const runtime = string(observed.runtime, "a-p dependency preflight observed runtime");
  if (
    observed.launchClass !== "static-contract" ||
    observed.machineLaunchChecks !== "not-applicable" ||
    observed.branch !== EXPECTED_BRANCH ||
    !/^[0-9a-f]{40}$/u.test(head) ||
    observed.command !== AP_PRODUCE_COMMAND ||
    observed.repositoryBundleRoot !== "." ||
    observed.candidateDirectory !== AP_CANDIDATE_DIRECTORY ||
    observed.registeredAttemptRoot !== row.attemptRoot ||
    observed.finalPreflightReceiptPath !== row.preflightReceiptPath ||
    observed.finalTerminalReceiptPath !== row.terminalReceiptPath
  ) {
    fail("a-p dependency preflight observed scalar predicates differ from the frozen run");
  }
  exactIdentity(observed.matrix, matrixIdentity, "a-p dependency preflight observed matrix");
  exactIdentity(observed.protocol, protocolIdentity, "a-p dependency preflight observed protocol");
  exactIdentity(
    observed.callableRegistry,
    registryIdentity,
    "a-p dependency preflight observed callable registry",
  );
  exactArray(
    observed.verificationPaths,
    row.verificationPaths,
    "a-p dependency preflight observed verification paths",
  );
  exactArray(
    observed.dependencyPacketIds,
    protocol.boundDependencyPacketIds,
    "a-p dependency preflight observed dependencies",
  );
  if (canonicalJson(observed.dependencyArtifacts) !== canonicalJson([])) {
    fail("a-p dependency preflight observed dependency artifacts must be empty");
  }
  assertHistoricalCommitAncestor(repositoryRoot, head, "a-p dependency preflight observed head");
  assertHistoricalIdentity(repositoryRoot, head, matrixIdentity, "a-p dependency matrix");
  assertHistoricalIdentity(repositoryRoot, head, protocolIdentity, "a-p dependency protocol");
  assertHistoricalIdentity(repositoryRoot, head, registryIdentity, "a-p dependency callable registry");
  const registry = parsePhase10CallableRegistry(registryValue);
  for (const callable of registry.callables.filter((entry) => entry.resolution === "resolved")) {
    if (callable.identity === null) fail(`${callable.callableId} resolved without an identity`);
    assertHistoricalIdentity(
      repositoryRoot,
      head,
      Object.freeze({ path: callable.modulePath, ...callable.identity }),
      `a-p dependency callable ${callable.callableId}`,
    );
  }
  return Object.freeze({ attemptId, head, runtime });
}

function exactJson(actual: unknown, expected: StrictJson, label: string): void {
  if (canonicalJson(actual) !== canonicalJson(expected)) fail(`${label} differs`);
}

function apCallableProjection(registryValue: StrictJson): StrictJson {
  const registry = parsePhase10CallableRegistry(registryValue);
  return strictJsonSnapshot({
    callableIds: registry.callables.map((entry) => entry.callableId).sort(lexical),
    producerBindings: registry.callables
      .filter((entry) => entry.role === "producer")
      .map((entry) => ({ callableId: entry.callableId, producedOutputIds: entry.producedOutputIds }))
      .sort((left, right) => lexical(left.callableId, right.callableId)),
    checkCallerBindings: registry.callables
      .filter((entry) => entry.role === "check-caller")
      .map((entry) => ({ callableId: entry.callableId, invokedCheckIds: entry.invokedCheckIds }))
      .sort((left, right) => lexical(left.callableId, right.callableId)),
  });
}

function apMutationWitness(path: string, bytes: Uint8Array, projection: StrictJson): StrictJson {
  const frozenProjection = strictJsonSnapshot(projection);
  return strictJsonSnapshot({
    artifactId: AP_REGISTRY_OUTPUT_ID,
    path,
    byteLength: bytes.byteLength,
    sha256: sha256Bytes(bytes),
    semanticFingerprint: {
      projection: frozenProjection,
      sha256: sha256Bytes(canonicalJsonBytes(frozenProjection)),
    },
  });
}

function expectedApControlResult(
  repositoryRoot: string,
  controlId: string,
  matrixValue: StrictJson,
  protocolValue: StrictJson,
  registryValue: StrictJson,
): StrictJson {
  const mutable = JSON.parse(JSON.stringify(registryValue)) as Record<string, unknown>;
  const callables = mutable.callables;
  if (!Array.isArray(callables)) fail("a-p dependency registry has no callable array");
  let fixtureId: string;
  let mutation: StrictJson;
  let refusalClass: string;
  let expectedPattern: RegExp;
  if (controlId === "nc-ap-missing-producer") {
    fixtureId = "missing-producer";
    const beforeCount = callables.length;
    mutable.callables = callables.filter((entry) =>
      record(entry, "a-p dependency callable").callableId !== "phase10-a-p-producer");
    if ((mutable.callables as readonly unknown[]).length !== beforeCount - 1) {
      fail("a-p missing-producer mutation did not remove exactly one callable");
    }
    mutation = strictJsonSnapshot({ kind: "remove-callable", callableId: "phase10-a-p-producer" });
    refusalClass = "missing-producer";
    expectedPattern = /callable roster differs|missing producer|has no callable producer/u;
  } else if (controlId === "nc-ap-uncalled-check") {
    fixtureId = "uncalled-check";
    const caller = callables
      .map((entry) => record(entry, "a-p dependency callable"))
      .find((entry) => entry.callableId === "phase10-a-p-check-caller");
    if (caller === undefined || !Array.isArray(caller.invokedCheckIds)) {
      fail("a-p uncalled-check mutation has no check caller roster");
    }
    const beforeInvokedCheckIds = caller.invokedCheckIds;
    const afterInvokedCheckIds = beforeInvokedCheckIds.filter((entry) => entry !== "chk-ap-called-checks");
    caller.invokedCheckIds = afterInvokedCheckIds;
    if (afterInvokedCheckIds.length !== beforeInvokedCheckIds.length - 1) {
      fail("a-p uncalled-check mutation did not remove exactly one check");
    }
    mutation = strictJsonSnapshot({
      kind: "remove-invoked-check",
      callableId: "phase10-a-p-check-caller",
      checkId: "chk-ap-called-checks",
    });
    refusalClass = "uncalled-check";
    expectedPattern = /check-caller obligations differs|uncalled check|is uncalled by/u;
  } else {
    fail(`a-p dependency control ${controlId} is not registered`);
  }
  const mutated = strictJsonSnapshot(mutable);
  let refusalMessage: string | null = null;
  try {
    phase10ObligationRunPreflight(matrixValue, protocolValue, mutated, repositoryRoot);
  } catch (error) {
    refusalMessage = error instanceof Error ? error.message : String(error);
  }
  if (refusalMessage === null || !expectedPattern.test(refusalMessage)) {
    fail(`a-p dependency control ${controlId} did not reproduce its exact refusal class`);
  }
  const registryBytes = new Uint8Array(readFileSync(safePath(repositoryRoot, AP_REGISTRY_PATH, AP_REGISTRY_PATH)));
  const beforeWitness = apMutationWitness(
    AP_REGISTRY_PATH,
    registryBytes,
    apCallableProjection(registryValue),
  );
  const afterBytes = jsonBytes(mutated);
  const afterWitness = apMutationWitness(
    `out/phase10-execution-v1/attempts/a-p/negative-controls/${fixtureId}/callable-registry.json`,
    afterBytes,
    apCallableProjection(mutated),
  );
  const expectedReceipt = strictJsonSnapshot({
    schema: "phase10-ap-negative-control-v1",
    fixtureId,
    mutation,
    beforeWitness,
    afterWitness,
    refused: true,
    error: { refusalClass, message: refusalMessage },
  });
  const matrix = parsePhase10ObligationMatrix(matrixValue);
  const receiptOutputId = controlId === "nc-ap-missing-producer"
    ? "out-ap-missing-producer-receipt"
    : "out-ap-uncalled-check-receipt";
  const receiptOutput = matrix.outputs.find((entry) =>
    entry.packetId === "a-p" && entry.outputId === receiptOutputId);
  if (receiptOutput === undefined || receiptOutput.artifact.field !== null) {
    fail(`a-p dependency ${receiptOutputId} has no file artifact`);
  }
  exactJson(
    readJson(repositoryRoot, receiptOutput.artifact.path, receiptOutputId),
    expectedReceipt,
    `a-p dependency ${fixtureId} receipt`,
  );
  return strictJsonSnapshot({
    negativeControlId: controlId,
    mutationExecuted: true,
    rejected: true,
    beforeWitness,
    afterWitness,
    errors: [],
  });
}

function validateDependencyVerification(
  repositoryRoot: string,
  value: StrictJson,
  dependencyId: string,
  preflight: Phase10ObligationPreflightPass,
  protocol: ReturnType<typeof parsePhase10PacketProtocol>,
  history: DependencyPreflightHistory,
  matrixValue: StrictJson,
  protocolValue: StrictJson,
  registryValue: StrictJson,
): void {
  const verification = record(value, `${dependencyId} dependency verification`);
  exactKeys(
    verification,
    [
      "schema",
      "verificationId",
      "matrixId",
      "protocolId",
      "registryId",
      "packetId",
      "terminalState",
      "verifiedArtifacts",
      "checkResults",
      "executedNegativeControlIds",
      "negativeControlResults",
      "boundDependencyPacketIds",
      "execution",
      "aggregateVerdict",
      "limits",
    ],
    `${dependencyId} dependency verification`,
  );
  if (
    verification.schema !== "phase10-packet-verification-v1" ||
    verification.verificationId !== AP_VERIFICATION_ID ||
    verification.matrixId !== preflight.matrixId ||
    verification.protocolId !== preflight.protocolId ||
    verification.registryId !== preflight.registryId ||
    verification.packetId !== dependencyId ||
    verification.terminalState !== "pass" ||
    verification.aggregateVerdict !== "pass"
  ) {
    fail(`${dependencyId} dependency verification identity, schema, or pass verdict differs`);
  }

  const matrix = parsePhase10ObligationMatrix(matrixValue);
  if (!Array.isArray(verification.verifiedArtifacts)) {
    fail(`${dependencyId} dependency verification verifiedArtifacts must be an array`);
  }
  const verifiedIds = verification.verifiedArtifacts.map((value, index) => {
    const artifact = record(value, `${dependencyId} dependency verifiedArtifacts[${index}]`);
    exactKeys(
      artifact,
      ["outputId", "path", "byteLength", "sha256"],
      `${dependencyId} dependency verifiedArtifacts[${index}]`,
    );
    const outputId = string(
      artifact.outputId,
      `${dependencyId} dependency verifiedArtifacts[${index}].outputId`,
    );
    const output = matrix.outputs.find((entry) =>
      entry.packetId === dependencyId && entry.outputId === outputId);
    if (output === undefined || output.artifact.field !== null) {
      fail(`${dependencyId} dependency verified artifact ${outputId} is not a registered file output`);
    }
    const current = identity(repositoryRoot, output.artifact.path);
    if (
      artifact.path !== current.path ||
      artifact.byteLength !== current.byteLength ||
      artifact.sha256 !== current.sha256
    ) {
      fail(`${dependencyId} dependency verified artifact ${outputId} differs from current bytes`);
    }
    return outputId;
  });
  exactArray(verifiedIds, AP_VERIFIED_OUTPUT_IDS, `${dependencyId} dependency verified artifact IDs`);

  const execution = record(
    verification.execution,
    `${dependencyId} dependency verification execution`,
  );
  exactKeys(
    execution,
    [
      "evaluatorCallableId",
      "modulePath",
      "exportName",
      "byteLength",
      "sha256",
      "runtime",
      "command",
      "gitHead",
      "startedOn",
      "endedOn",
      "processConcurrency",
    ],
    `${dependencyId} dependency verification execution`,
  );
  const evaluatorId = string(
    execution.evaluatorCallableId,
    `${dependencyId} dependency evaluator callable ID`,
  );
  const registry = parsePhase10CallableRegistry(registryValue);
  const evaluator = registry.callables.find((callable) => callable.callableId === evaluatorId);
  if (
    evaluator === undefined ||
    evaluator.role !== "independent-evaluator" ||
    evaluator.resolution !== "resolved" ||
    evaluator.identity === null ||
    execution.modulePath !== evaluator.modulePath ||
    execution.exportName !== evaluator.exportName ||
    execution.byteLength !== evaluator.identity.byteLength ||
    execution.sha256 !== evaluator.identity.sha256
  ) {
    fail(`${dependencyId} dependency verification evaluator differs from the resolved registry`);
  }
  if (
    execution.runtime !== history.runtime ||
    execution.gitHead !== history.head ||
    execution.command !== AP_VERIFY_COMMAND ||
    execution.processConcurrency !== 1
  ) {
    fail(`${dependencyId} dependency verification execution differs from its frozen preflight provenance`);
  }
  const startedOn = string(
    execution.startedOn,
    `${dependencyId} dependency verification execution startedOn`,
  );
  const endedOn = string(
    execution.endedOn,
    `${dependencyId} dependency verification execution endedOn`,
  );
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(startedOn) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(endedOn) ||
    Number.isNaN(Date.parse(startedOn)) ||
    Number.isNaN(Date.parse(endedOn)) ||
    Date.parse(endedOn) < Date.parse(startedOn)
  ) {
    fail(`${dependencyId} dependency verification execution timestamps differ`);
  }

  const checkResults = Array.isArray(verification.checkResults) ? verification.checkResults : [];
  const checkIds = checkResults.map((value, index) => {
    const result = record(value, `${dependencyId} dependency checkResults[${index}]`);
    exactKeys(
      result,
      ["checkId", "verdict", "reasons", "witnessOutputIds"],
      `${dependencyId} dependency checkResults[${index}]`,
    );
    if (
      result.verdict !== "pass" ||
      !Array.isArray(result.reasons) ||
      result.reasons.length !== 0 ||
      !Array.isArray(result.witnessOutputIds) ||
      result.witnessOutputIds.length === 0 ||
      result.witnessOutputIds.some((outputId) =>
        typeof outputId !== "string" ||
        !(AP_VERIFIED_OUTPUT_IDS as readonly string[]).includes(outputId))
    ) {
      fail(`${dependencyId} dependency check ${String(result.checkId)} is not an exact pass`);
    }
    const witnessOutputIds = result.witnessOutputIds.map((outputId, witnessIndex) =>
      string(outputId, `${dependencyId} dependency checkResults[${index}].witnessOutputIds[${witnessIndex}]`));
    exactArray(
      witnessOutputIds,
      [...witnessOutputIds].sort(lexical),
      `${dependencyId} dependency check witness IDs`,
    );
    return string(result.checkId, `${dependencyId} dependency checkResults[${index}].checkId`);
  });
  exactArray(checkIds, AP_CHECK_IDS, `${dependencyId} dependency verification check IDs`);
  exactArray(
    verification.executedNegativeControlIds,
    AP_CONTROL_IDS,
    `${dependencyId} dependency executed negative-control IDs`,
  );
  const controlResults = Array.isArray(verification.negativeControlResults)
    ? verification.negativeControlResults
    : [];
  const controlIds = controlResults.map((value, index) => {
    const result = record(value, `${dependencyId} dependency negativeControlResults[${index}]`);
    exactKeys(
      result,
      ["negativeControlId", "mutationExecuted", "rejected", "beforeWitness", "afterWitness", "errors"],
      `${dependencyId} dependency negativeControlResults[${index}]`,
    );
    const controlId = string(
      result.negativeControlId,
      `${dependencyId} dependency negativeControlResults[${index}].negativeControlId`,
    );
    exactJson(
      result,
      expectedApControlResult(
        repositoryRoot,
        controlId,
        matrixValue,
        protocolValue,
        registryValue,
      ),
      `${dependencyId} dependency negative control ${controlId}`,
    );
    return controlId;
  });
  exactArray(controlIds, AP_CONTROL_IDS, `${dependencyId} dependency control-result IDs`);
  exactArray(
    verification.boundDependencyPacketIds,
    protocol.boundDependencyPacketIds,
    `${dependencyId} dependency verification dependencies`,
  );
  exactArray(verification.limits, AP_VERIFICATION_LIMITS, `${dependencyId} dependency verification limits`);
}

function dependencyArtifactBindings(
  repositoryRoot: string,
  dependencyPacketIds: readonly string[],
): StrictJson {
  const matrixIdentity = identity(repositoryRoot, MATRIX_PATH);
  const bindings = dependencyPacketIds.map((dependencyId) => {
    const row = catalogueRow(repositoryRoot, dependencyId);
    const loaded = loadPacket(repositoryRoot, row);
    if (loaded.preflight.packetId !== dependencyId || loaded.preflight.stage !== "run") {
      fail(`${dependencyId} dependency run preflight returned the wrong packet or stage`);
    }
    if (dependencyId !== "a-p") {
      fail(`${dependencyId} dependency preflight has no registered historical-provenance parser`);
    }
    const protocolIdentity = identity(repositoryRoot, row.protocolPath);
    const registryIdentity = identity(repositoryRoot, row.callableRegistryPath);
    const dependencyPreflightValue = readJson(
      repositoryRoot,
      row.preflightReceiptPath,
      `${dependencyId} dependency preflight receipt`,
    );
    const history = validateApDependencyPreflight(
      repositoryRoot,
      row,
      dependencyPreflightValue,
      loaded.preflight,
      loaded.packetProtocol,
      matrixIdentity,
      protocolIdentity,
      registryIdentity,
      loaded.registry,
    );
    const terminalValue = readJson(
      repositoryRoot,
      row.terminalReceiptPath,
      `${dependencyId} dependency terminal receipt`,
    );
    const terminalReceipt = parsePhase10ExecutionReceipt(terminalValue);
    if (
      terminalReceipt.receiptId !== `phase10-a-p-${history.attemptId}-terminal-v1` ||
      terminalReceipt.terminalState !== "pass"
    ) {
      fail(`${dependencyId} dependency terminal receipt ID or pass state differs from its preflight attempt`);
    }
    phase10ObligationReceiptPreflight(
      loaded.matrix,
      loaded.protocol,
      loaded.registry,
      terminalReceipt,
      repositoryRoot,
    );
    const verificationArtifacts = row.verificationPaths.map((path) => {
      const verification = readJson(repositoryRoot, path, `${dependencyId} dependency verification ${path}`);
      validateDependencyVerification(
        repositoryRoot,
        verification,
        dependencyId,
        loaded.preflight,
        loaded.packetProtocol,
        history,
        loaded.matrix,
        loaded.protocol,
        loaded.registry,
      );
      return identity(repositoryRoot, path);
    });
    return Object.freeze({
      packetId: dependencyId,
      protocol: protocolIdentity,
      callableRegistry: registryIdentity,
      preflightReceipt: identity(repositoryRoot, row.preflightReceiptPath),
      terminalReceipt: identity(repositoryRoot, row.terminalReceiptPath),
      verificationArtifacts: Object.freeze(verificationArtifacts),
    });
  });
  return strictJsonSnapshot(bindings);
}

function exactPartialPublicationState(
  repositoryRoot: string,
  row: PacketCatalogueRow,
  options: StaticPacketOptions,
  candidateDirectory: string,
  loaded: ReturnType<typeof loadPacket>,
  preflightBytes: Uint8Array,
  terminalBytes: Uint8Array,
): { readonly allowedPaths: readonly string[]; readonly receiptsAlreadyPublished: boolean } {
  const allowedPaths: string[] = [];
  const matrix = parsePhase10ObligationMatrix(loaded.matrix);
  for (const output of matrix.outputs.filter((entry) => entry.packetId === options.packetId)) {
    if (output.artifact.field !== null || !output.artifact.path.startsWith("evidence/")) continue;
    const publishedPath = safePath(
      repositoryRoot,
      output.artifact.path,
      `${output.outputId} publication path`,
    );
    if (!existsSync(publishedPath)) continue;
    assertSafeExistingParent(repositoryRoot, publishedPath, `${output.outputId} publication`);
    const candidatePath = resolve(candidateDirectory, basename(output.artifact.path));
    if (!existsSync(candidatePath)) fail(`${output.outputId} published without candidate bytes`);
    const publishedStat = lstatSync(publishedPath);
    const candidateStat = lstatSync(candidatePath);
    if (
      !publishedStat.isFile() ||
      publishedStat.isSymbolicLink() ||
      !candidateStat.isFile() ||
      candidateStat.isSymbolicLink() ||
      !sameBytes(
        new Uint8Array(readFileSync(publishedPath)),
        new Uint8Array(readFileSync(candidatePath)),
      )
    ) {
      fail(`${output.outputId} existing publication differs from exact candidate bytes`);
    }
    allowedPaths.push(output.artifact.path);
  }

  const preflightDestination = safePath(
    repositoryRoot,
    row.preflightReceiptPath,
    "preflight receipt path",
  );
  const terminalDestination = safePath(
    repositoryRoot,
    row.terminalReceiptPath,
    "terminal receipt path",
  );
  if (
    basename(preflightDestination) !== "preflight.json" ||
    basename(terminalDestination) !== "terminal-receipt.json"
  ) {
    fail("static receipt destination filenames differ from the registered receipt kinds");
  }
  const finalDirectory = dirname(preflightDestination);
  if (finalDirectory !== dirname(terminalDestination)) {
    fail("static receipt destinations do not share one packet directory");
  }
  assertSafeExistingParent(repositoryRoot, finalDirectory, "static receipt publication");
  let receiptsAlreadyPublished = false;
  if (existsSync(finalDirectory)) {
    const stat = lstatSync(finalDirectory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      fail("static receipt publication is not a non-symlink directory");
    }
    const names = readdirSync(finalDirectory).sort(lexical);
    if (names.length !== 2 || names[0] !== "preflight.json" || names[1] !== "terminal-receipt.json") {
      fail("existing static receipt publication contains files outside the exact receipt pair");
    }
    if (
      !sameBytes(new Uint8Array(readFileSync(preflightDestination)), preflightBytes) ||
      !sameBytes(new Uint8Array(readFileSync(terminalDestination)), terminalBytes)
    ) {
      fail("existing static receipt publication differs from the candidate receipt bytes");
    }
    allowedPaths.push(row.preflightReceiptPath, row.terminalReceiptPath);
    receiptsAlreadyPublished = true;
  }
  return Object.freeze({
    allowedPaths: Object.freeze([...new Set(allowedPaths)]),
    receiptsAlreadyPublished,
  });
}

/**
 * Retain the run-stage structural A-P observation before a static packet opens its frozen inputs.
 * Static packets deliberately do not inherit C0/C0V machine-launch or resource predicates.
 */
export function writePhase10StaticPreflightReceipt(options: StaticPacketOptions): StaticPreflightReceipt {
  validateStaticOptions(options);
  const repositoryRoot = resolve(options.repositoryRoot);
  const row = catalogueRow(repositoryRoot, options.packetId);
  const candidateDirectory = safePath(repositoryRoot, options.candidateDirectory, "candidate directory");
  assertSafeExistingParent(repositoryRoot, candidateDirectory, "static candidate");
  if (existsSync(candidateDirectory)) fail(`candidate directory already exists: ${options.candidateDirectory}`);
  const branch = git(repositoryRoot, ["branch", "--show-current"]);
  if (branch !== EXPECTED_BRANCH) fail(`branch ${branch} is not ${EXPECTED_BRANCH}`);
  assertCleanRepository(repositoryRoot, "before static preflight");
  const head = git(repositoryRoot, ["rev-parse", "HEAD"]);
  const loaded = loadPacket(repositoryRoot, row);
  if (loaded.preflight.packetId !== options.packetId || loaded.preflight.stage !== "run") {
    fail("obligation run preflight returned the wrong packet or stage");
  }

  const observed = strictJsonSnapshot({
    launchClass: "static-contract",
    machineLaunchChecks: "not-applicable",
    branch,
    head,
    runtime: process.version,
    command: options.command,
    repositoryBundleRoot: options.repositoryBundleRoot,
    matrix: identity(repositoryRoot, MATRIX_PATH),
    protocol: identity(repositoryRoot, row.protocolPath),
    callableRegistry: identity(repositoryRoot, row.callableRegistryPath),
    candidateDirectory: options.candidateDirectory,
    registeredAttemptRoot: row.attemptRoot,
    finalPreflightReceiptPath: row.preflightReceiptPath,
    finalTerminalReceiptPath: row.terminalReceiptPath,
    verificationPaths: row.verificationPaths,
    dependencyPacketIds: loaded.packetProtocol.boundDependencyPacketIds,
    dependencyArtifacts: dependencyArtifactBindings(
      repositoryRoot,
      loaded.packetProtocol.boundDependencyPacketIds,
    ),
  });
  const receipt: StaticPreflightReceipt = Object.freeze({
    schema: "phase10-preflight-receipt-v1",
    receiptId: `phase10-${options.packetId}-${options.attemptId}-preflight-v1`,
    matrixId: loaded.preflight.matrixId,
    protocolId: loaded.preflight.protocolId,
    registryId: loaded.preflight.registryId,
    packetId: options.packetId,
    attemptId: options.attemptId,
    stage: "run",
    observed,
    outputIds: loaded.preflight.outputIds,
    checkIds: loaded.preflight.checkIds,
    negativeControlIds: loaded.preflight.negativeControlIds,
    callableIds: loaded.preflight.callableIds,
    selectedBranches: loaded.preflight.selectedBranches,
    verdict: "pass",
    reasons: Object.freeze([]),
  });
  mkdirSync(candidateDirectory, { recursive: true });
  writeFileSync(resolve(candidateDirectory, "preflight.json"), jsonBytes(receipt), { flag: "wx" });
  return receipt;
}

/** Validate and retain exact terminal obligation-set equality after independent verification. */
export function writePhase10StaticTerminalReceipt(options: StaticTerminalOptions): Phase10ExecutionReceipt {
  validateStaticOptions(options);
  const repositoryRoot = resolve(options.repositoryRoot);
  const row = catalogueRow(repositoryRoot, options.packetId);
  const candidateDirectory = safePath(repositoryRoot, options.candidateDirectory, "candidate directory");
  assertSafeExistingDirectory(repositoryRoot, candidateDirectory, "static candidate");
  const preflightPath = resolve(candidateDirectory, "preflight.json");
  if (!existsSync(preflightPath)) {
    fail("candidate has no retained preflight receipt");
  }
  const terminalPath = resolve(candidateDirectory, "terminal-receipt.json");
  if (!existsSync(terminalPath)) assertCleanRepository(repositoryRoot, "before static terminal receipt");
  const loaded = loadPacket(repositoryRoot, row);
  validateStaticPreflightReceipt(
    parseReceiptBytes(new Uint8Array(readFileSync(preflightPath)), "static preflight receipt"),
    options,
    loaded.preflight,
    repositoryRoot,
    row,
    loaded.packetProtocol.boundDependencyPacketIds,
  );
  for (const verificationPath of row.verificationPaths) {
    const candidateVerificationPath = resolve(candidateDirectory, basename(verificationPath));
    if (!existsSync(candidateVerificationPath)) {
      fail(`candidate has no registered verification artifact ${basename(verificationPath)}`);
    }
    const verification = record(
      parseReceiptBytes(
        new Uint8Array(readFileSync(candidateVerificationPath)),
        `candidate verification ${basename(verificationPath)}`,
      ),
      `candidate verification ${basename(verificationPath)}`,
    );
    if (options.terminalState === "pass" && verification.verdict !== "pass") {
      fail(`candidate verification ${basename(verificationPath)} is not pass`);
    }
  }
  const matrix = parsePhase10ObligationMatrix(loaded.matrix);
  const activeChecks = new Set(loaded.preflight.checkIds);
  const evaluatedCheckIds = matrix.checks
    .filter(
      (check) =>
        activeChecks.has(check.checkId) && check.independentEvaluatorCallableId !== null,
    )
    .map((check) => check.checkId)
    .sort(lexical);
  const receipt: Phase10ExecutionReceipt = Object.freeze({
    schema: PHASE10_EXECUTION_RECEIPT_SCHEMA,
    receiptId: `phase10-${options.packetId}-${options.attemptId}-terminal-v1`,
    matrixId: loaded.preflight.matrixId,
    protocolId: loaded.preflight.protocolId,
    registryId: loaded.preflight.registryId,
    packetId: options.packetId,
    terminalState: options.terminalState,
    producedOutputIds: loaded.preflight.outputIds,
    executedCheckIds: loaded.preflight.checkIds,
    evaluatedCheckIds: Object.freeze(evaluatedCheckIds),
    executedNegativeControlIds: loaded.preflight.negativeControlIds,
    boundDependencyPacketIds: loaded.packetProtocol.boundDependencyPacketIds,
  });
  phase10ObligationReceiptPreflight(
    loaded.matrix,
    loaded.protocol,
    loaded.registry,
    receipt,
    repositoryRoot,
  );
  const receiptBytes = jsonBytes(receipt);
  if (existsSync(terminalPath)) {
    const existing = new Uint8Array(readFileSync(terminalPath));
    if (!sameBytes(existing, receiptBytes)) fail("existing static terminal receipt differs");
  } else {
    writeFileSync(terminalPath, receiptBytes, { flag: "wx" });
  }
  const partial = exactPartialPublicationState(
    repositoryRoot,
    row,
    options,
    candidateDirectory,
    loaded,
    new Uint8Array(readFileSync(preflightPath)),
    receiptBytes,
  );
  assertOnlyExactPublishedChanges(
    repositoryRoot,
    "at static terminal receipt",
    partial.allowedPaths,
  );
  return receipt;
}

interface StaticReceiptPublication {
  readonly preflightBytes: Uint8Array;
  readonly terminalBytes: Uint8Array;
  readonly finalDirectory: string;
  readonly parent: string;
  readonly staging: string;
  readonly alreadyPublished: boolean;
}

function prepareStaticReceiptPublication(options: StaticPacketOptions): StaticReceiptPublication {
  validateStaticOptions(options);
  const repositoryRoot = resolve(options.repositoryRoot);
  const row = catalogueRow(repositoryRoot, options.packetId);
  const candidateDirectory = safePath(repositoryRoot, options.candidateDirectory, "candidate directory");
  assertSafeExistingDirectory(repositoryRoot, candidateDirectory, "static candidate");
  const preflightBytes = new Uint8Array(readFileSync(resolve(candidateDirectory, "preflight.json")));
  const terminalBytes = new Uint8Array(readFileSync(resolve(candidateDirectory, "terminal-receipt.json")));
  const loaded = loadPacket(repositoryRoot, row);
  validateStaticPreflightReceipt(
    parseReceiptBytes(preflightBytes, "static preflight receipt"),
    options,
    loaded.preflight,
    repositoryRoot,
    row,
    loaded.packetProtocol.boundDependencyPacketIds,
  );
  const terminalReceipt = parsePhase10ExecutionReceipt(
    parseReceiptBytes(terminalBytes, "static terminal receipt"),
  );
  if (terminalReceipt.receiptId !== `phase10-${options.packetId}-${options.attemptId}-terminal-v1`) {
    fail("static terminal receipt ID differs from the packet attempt");
  }
  phase10ObligationReceiptPreflight(
    loaded.matrix,
    loaded.protocol,
    loaded.registry,
    terminalReceipt,
    repositoryRoot,
  );

  const preflightDestination = safePath(repositoryRoot, row.preflightReceiptPath, "preflight receipt path");
  const terminalDestination = safePath(repositoryRoot, row.terminalReceiptPath, "terminal receipt path");
  if (basename(preflightDestination) !== "preflight.json" || basename(terminalDestination) !== "terminal-receipt.json") {
    fail("static receipt destination filenames differ from the registered receipt kinds");
  }
  const finalDirectory = dirname(preflightDestination);
  if (finalDirectory !== dirname(terminalDestination)) {
    fail("static receipt destinations do not share one packet directory");
  }
  assertSafeExistingParent(repositoryRoot, finalDirectory, "static receipt publication");
  const parent = dirname(finalDirectory);
  const staging = resolve(parent, `.${options.packetId}.${options.attemptId}.receipt-stage`);
  if (!pathIsWithin(parent, staging)) fail("static receipt staging path leaves its intended parent");
  const partial = exactPartialPublicationState(
    repositoryRoot,
    row,
    options,
    candidateDirectory,
    loaded,
    preflightBytes,
    terminalBytes,
  );
  if (existsSync(staging)) fail(`static receipt staging path already exists: ${staging}`);
  assertOnlyExactPublishedChanges(
    repositoryRoot,
    "before static receipt publication",
    partial.allowedPaths,
  );
  return Object.freeze({
    preflightBytes,
    terminalBytes,
    finalDirectory,
    parent,
    staging,
    alreadyPublished: partial.receiptsAlreadyPublished,
  });
}

/** Refuse a split publication before the scope bundle is installed. */
export function validatePhase10StaticPacketReceiptsForPublication(options: StaticPacketOptions): void {
  prepareStaticReceiptPublication(options);
}

/** Atomically retain the two structural receipts at their packet-catalogue destination. */
export function publishPhase10StaticPacketReceipts(options: StaticPacketOptions): boolean {
  const publication = prepareStaticReceiptPublication(options);
  const { alreadyPublished, finalDirectory, parent, preflightBytes, staging, terminalBytes } = publication;
  if (alreadyPublished) return false;
  mkdirSync(parent, { recursive: true });
  mkdirSync(staging);
  try {
    writeFileSync(resolve(staging, "preflight.json"), preflightBytes, { flag: "wx" });
    writeFileSync(resolve(staging, "terminal-receipt.json"), terminalBytes, { flag: "wx" });
    renameSync(staging, finalDirectory);
  } catch (error) {
    if (existsSync(staging)) rmSync(staging, { recursive: true, force: true });
    throw error;
  }
  return true;
}

/** Remove only the exact just-published receipt pair when the paired scope publication fails. */
export function rollbackPhase10StaticPacketReceipts(options: StaticPacketOptions): void {
  validateStaticOptions(options);
  const repositoryRoot = resolve(options.repositoryRoot);
  const row = catalogueRow(repositoryRoot, options.packetId);
  const candidateDirectory = safePath(repositoryRoot, options.candidateDirectory, "candidate directory");
  assertSafeExistingDirectory(repositoryRoot, candidateDirectory, "static candidate");
  const preflightBytes = new Uint8Array(readFileSync(resolve(candidateDirectory, "preflight.json")));
  const terminalBytes = new Uint8Array(readFileSync(resolve(candidateDirectory, "terminal-receipt.json")));
  const loaded = loadPacket(repositoryRoot, row);
  validateStaticPreflightReceipt(
    parseReceiptBytes(preflightBytes, "static preflight receipt"),
    options,
    loaded.preflight,
    repositoryRoot,
    row,
    loaded.packetProtocol.boundDependencyPacketIds,
  );
  const terminalReceipt = parsePhase10ExecutionReceipt(
    parseReceiptBytes(terminalBytes, "static terminal receipt"),
  );
  phase10ObligationReceiptPreflight(
    loaded.matrix,
    loaded.protocol,
    loaded.registry,
    terminalReceipt,
    repositoryRoot,
  );
  const finalDirectory = dirname(safePath(repositoryRoot, row.preflightReceiptPath, "preflight receipt path"));
  if (finalDirectory !== dirname(safePath(repositoryRoot, row.terminalReceiptPath, "terminal receipt path"))) {
    fail("static receipt destinations do not share one packet directory");
  }
  const stat = lstatSync(finalDirectory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("static receipt rollback target is not a non-symlink directory");
  const names = readdirSync(finalDirectory).sort(lexical);
  if (names.length !== 2 || names[0] !== "preflight.json" || names[1] !== "terminal-receipt.json") {
    fail("static receipt rollback target contains files outside the exact receipt pair");
  }
  const publishedPreflight = new Uint8Array(readFileSync(resolve(finalDirectory, "preflight.json")));
  const publishedTerminal = new Uint8Array(readFileSync(resolve(finalDirectory, "terminal-receipt.json")));
  if (!sameBytes(publishedPreflight, preflightBytes) || !sameBytes(publishedTerminal, terminalBytes)) {
    fail("static receipt rollback target differs from the candidate receipt bytes");
  }
  rmSync(finalDirectory, { recursive: true, force: false });
}
