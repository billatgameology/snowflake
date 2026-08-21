import { spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  parsePhase10ObligationMatrix,
  parsePhase10PacketProtocol,
} from "./phase10-contracts.ts";
import { phase10ObligationRunPreflight } from "./phase10-obligation-preflight.ts";
import {
  runPhase10MissingProducerControl,
  runPhase10UncalledCheckControl,
} from "./phase10-ap-negative-controls.ts";
import { verifyPhase10ApArtifacts } from "./phase10-ap-verify.ts";
import { writePhase10ExecutionReceipt } from "./phase10-execution-receipt.ts";
import { writePhase10StaticPreflightReceipt } from "./phase10-static-packet-receipts.ts";

const EXPECTED_BRANCH = "phase10/evidence-verification" as const;
const EXPECTED_RUNTIME = "v24.13.1" as const;
const PACKET_ID = "a-p" as const;
const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json" as const;
const PROTOCOL_PATH = "research/phase10-execution-v1/packets/a-p/protocol.json" as const;
const REGISTRY_PATH = "research/phase10-execution-v1/packets/a-p/callable-registry.json" as const;
const CANDIDATE_DEFAULT = "out/phase10-obligation-preflight-v1-candidate" as const;
const PUBLICATION_PATH = "evidence/phase10-obligation-preflight-v1" as const;
const ATTEMPT_ID = "s1-static-20260821-v1" as const;
const PRODUCE_COMMAND =
  "node runner/src/phase10-ap-publish.ts produce --repository-root . --out out/phase10-obligation-preflight-v1-candidate" as const;
const PUBLISH_COMMAND =
  "node runner/src/phase10-ap-publish.ts publish --repository-root . --candidate out/phase10-obligation-preflight-v1-candidate --out evidence/phase10-obligation-preflight-v1" as const;

const PUBLICATION_FILES = Object.freeze([
  Object.freeze({ source: "artifact-index.json", destination: "artifact-index.json" }),
  Object.freeze({ source: "missing-producer.json", destination: "missing-producer.json" }),
  Object.freeze({ source: "uncalled-check.json", destination: "uncalled-check.json" }),
  Object.freeze({ source: "verification.json", destination: "verification.json" }),
  Object.freeze({ source: "preflight.json", destination: "packets/a-p/preflight.json" }),
  Object.freeze({ source: "terminal-receipt.json", destination: "packets/a-p/terminal-receipt.json" }),
]);

export interface Phase10ApProduceRequest {
  readonly repositoryRoot: string;
  readonly candidateDirectory: string;
}

export interface Phase10ApProduceResult {
  readonly candidateDirectory: string;
  readonly producedFiles: readonly string[];
  readonly outputIds: readonly string[];
  readonly checkIds: readonly string[];
  readonly negativeControlIds: readonly string[];
  readonly gitHead: string;
}

export interface Phase10ApPublishRequest {
  readonly repositoryRoot: string;
  readonly candidateDirectory: string;
  readonly outputDirectory: string;
}

function fail(message: string): never {
  throw new Error(`Phase 10 A-P publication refused: ${message}`);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
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

function assertClean(repositoryRoot: string, label: string): void {
  const status = git(repositoryRoot, ["status", "--porcelain=v1", "--untracked-files=all"]);
  if (status.length !== 0) fail(`${label} requires a clean worktree`);
}

function assertCleanOrExactPublication(repositoryRoot: string, label: string): void {
  const status = git(repositoryRoot, ["status", "--porcelain=v1", "--untracked-files=all"])
    .split("\n").filter((line) => line.length > 0).sort(compareText);
  if (status.length === 0) return;
  const expected = PUBLICATION_FILES.map((file) => `?? ${PUBLICATION_PATH}/${file.destination}`).sort(compareText);
  if (status.length !== expected.length || status.some((line, index) => line !== expected[index])) {
    fail(`${label} requires a clean worktree or only the exact prior A-P publication files`);
  }
}

function safeRoot(value: string): string {
  const root = realpathSync(resolve(value));
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("repository root must be a non-symlink directory");
  return root;
}

function safeRelativePath(value: string, label: string): string {
  if (
    isAbsolute(value) || value.includes("\\") || value.startsWith("/") || value.endsWith("/") ||
    value.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    fail(`${label} is not a safe repository-relative path`);
  }
  return value;
}

function pathBelowRoot(root: string, relativePath: string, label: string): string {
  const safe = safeRelativePath(relativePath, label);
  const absolute = resolve(root, safe);
  const fromRoot = relative(root, absolute);
  if (fromRoot === "" || fromRoot === ".." || fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(fromRoot)) {
    fail(`${label} is not below the repository root`);
  }
  return absolute;
}

function safeRepositoryFile(root: string, relativePath: string): Uint8Array {
  const absolute = pathBelowRoot(root, relativePath, relativePath);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${relativePath} must be a regular non-symlink file`);
  const physical = realpathSync(absolute);
  const fromRoot = relative(root, physical).replaceAll("\\", "/");
  if (fromRoot !== relativePath) {
    fail(`${relativePath} resolves outside or aliases within the repository root`);
  }
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
  if (text !== `${JSON.stringify(snapshot, null, 2)}\n`) fail(`${label} is not exact two-space JSON plus LF`);
  return snapshot;
}

function prettyJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

function mediaType(path: string): string {
  return path.endsWith(".md") ? "text/markdown; charset=utf-8" : "application/json";
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((entry, index) => entry === right[index]);
}

function writeExclusive(path: string, bytes: Uint8Array): void {
  mkdirSync(dirname(path), { recursive: true });
  let descriptor: number | undefined;
  try {
    descriptor = openSync(path, "wx");
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    throw error;
  }
  const reopened = new Uint8Array(readFileSync(path));
  if (!sameBytes(reopened, bytes)) fail(`${path} readback differs`);
}

function candidateBytes(candidate: string, relativePath: string): Uint8Array {
  const absolute = resolve(candidate, safeRelativePath(relativePath, "candidate file"));
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${relativePath} must be a regular candidate file`);
  const physical = realpathSync(absolute);
  const fromCandidate = relative(candidate, physical).replaceAll("\\", "/");
  if (fromCandidate !== relativePath) fail(`${relativePath} resolves outside or aliases within the candidate`);
  return new Uint8Array(readFileSync(physical));
}

function buildArtifactIndex(
  root: string,
  matrixValue: StrictJson,
  missingBytes: Uint8Array,
  uncalledBytes: Uint8Array,
): Uint8Array {
  const matrix = parsePhase10ObligationMatrix(matrixValue);
  const excluded = new Set(["out-ap-artifact-index", "out-ap-verification", "out-ap-self-execution-receipt"]);
  const entries = matrix.outputs
    .filter((output) => output.packetId === PACKET_ID && !excluded.has(output.outputId))
    .map((output) => {
      const bytes = output.outputId === "out-ap-missing-producer-receipt"
        ? missingBytes
        : output.outputId === "out-ap-uncalled-check-receipt"
        ? uncalledBytes
        : safeRepositoryFile(root, output.artifact.path);
      return Object.freeze({
        artifactId: output.outputId,
        // The frozen A-P logical bundle root is the repository root because its registered
        // outputs intentionally span research/ and evidence/.
        path: output.artifact.path,
        mediaType: mediaType(output.artifact.path),
        byteLength: bytes.byteLength,
        sha256: sha256Bytes(bytes),
        role: output.outputId.startsWith("out-ap-") ? "obligation-preflight" : "artifact",
        producedBy: output.producerCallableId,
      });
    })
    .sort((left, right) => compareText(left.artifactId, right.artifactId));
  return prettyJsonBytes({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-obligation-preflight-v1",
    artifacts: entries,
  });
}

/** Produce the deterministic pre-verification A-P candidate without publishing evidence. */
export function producePhase10ApArtifacts(request: Phase10ApProduceRequest): Phase10ApProduceResult {
  const root = safeRoot(request.repositoryRoot);
  if (process.version !== EXPECTED_RUNTIME) fail(`runtime ${process.version} differs from ${EXPECTED_RUNTIME}`);
  const branch = git(root, ["branch", "--show-current"]);
  if (branch !== EXPECTED_BRANCH) fail(`branch ${branch} differs from ${EXPECTED_BRANCH}`);
  assertClean(root, "A-P production");
  const head = git(root, ["rev-parse", "HEAD"]);
  if (!/^[0-9a-f]{40}$/u.test(head)) fail("Git head is not a lowercase 40-character hash");
  const candidateRelative = safeRelativePath(request.candidateDirectory, "candidate directory");
  const candidate = pathBelowRoot(root, candidateRelative, "candidate directory");
  if (existsSync(candidate)) fail(`candidate already exists: ${candidateRelative}`);

  // The generic static helper is the sole author of the retained run preflight. A-P's logical
  // bundle root is the repository root because its frozen outputs span research/ and evidence/.
  const retainedPreflight = writePhase10StaticPreflightReceipt({
    repositoryRoot: root,
    packetId: PACKET_ID,
    attemptId: ATTEMPT_ID,
    candidateDirectory: candidateRelative,
    command: PRODUCE_COMMAND,
    repositoryBundleRoot: ".",
  });
  try {
    const matrixBytes = safeRepositoryFile(root, MATRIX_PATH);
    const protocolBytes = safeRepositoryFile(root, PROTOCOL_PATH);
    const registryBytes = safeRepositoryFile(root, REGISTRY_PATH);
    const matrixValue = prettyJson(matrixBytes, "A-P obligation matrix");
    const protocolValue = prettyJson(protocolBytes, "A-P packet protocol");
    const registryValue = prettyJson(registryBytes, "A-P callable registry");
    const preflight = phase10ObligationRunPreflight(matrixValue, protocolValue, registryValue, root);
    if (preflight.packetId !== PACKET_ID || preflight.stage !== "run") fail("A-P run preflight identity differs");
    parsePhase10PacketProtocol(protocolValue);
    if (
      retainedPreflight.matrixId !== preflight.matrixId || retainedPreflight.protocolId !== preflight.protocolId ||
      retainedPreflight.registryId !== preflight.registryId || retainedPreflight.packetId !== PACKET_ID ||
      retainedPreflight.attemptId !== ATTEMPT_ID
    ) {
      fail("generic static preflight identity differs from A-P run preflight");
    }
    const controls = { repositoryRoot: root, matrix: matrixValue, protocol: protocolValue, registryBytes } as const;
    const missingBytes = prettyJsonBytes(runPhase10MissingProducerControl(controls));
    const uncalledBytes = prettyJsonBytes(runPhase10UncalledCheckControl(controls));
    const artifactIndexBytes = buildArtifactIndex(root, matrixValue, missingBytes, uncalledBytes);
    writeExclusive(resolve(candidate, "artifact-index.json"), artifactIndexBytes);
    writeExclusive(resolve(candidate, "missing-producer.json"), missingBytes);
    writeExclusive(resolve(candidate, "uncalled-check.json"), uncalledBytes);
    const called = verifyPhase10ApArtifacts({ repositoryRoot: root, candidateDirectory: candidateRelative });
    if (called.checkResults.some((result) => result.verdict !== "pass")) {
      fail(`check caller reported: ${called.checkResults.filter((entry) => entry.verdict !== "pass").map((entry) => entry.checkId).join(", ")}`);
    }
  } catch (error) {
    rmSync(candidate, { recursive: true, force: false });
    throw error;
  }
  return Object.freeze({
    candidateDirectory: candidateRelative,
    producedFiles: Object.freeze([
      "artifact-index.json",
      "missing-producer.json",
      "preflight.json",
      "uncalled-check.json",
    ]),
    outputIds: retainedPreflight.outputIds,
    checkIds: retainedPreflight.checkIds,
    negativeControlIds: retainedPreflight.negativeControlIds,
    gitHead: head,
  });
}

function assertCandidateComplete(root: string, candidateRelative: string): string {
  const candidate = pathBelowRoot(root, candidateRelative, "candidate directory");
  const stat = lstatSync(candidate);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("candidate must be a non-symlink directory");
  const names = readdirSync(candidate).sort(compareText);
  if (names.join("\n") !== ["artifact-index.json", "missing-producer.json", "preflight.json", "terminal-receipt.json", "uncalled-check.json", "verification.json"].join("\n")) {
    fail("candidate top-level file roster differs");
  }
  return candidate;
}

function validatePreflight(root: string, candidate: string, head: string): void {
  const value = prettyJson(candidateBytes(candidate, "preflight.json"), "A-P preflight receipt");
  if (value === null || Array.isArray(value) || typeof value !== "object") fail("A-P preflight receipt must be an object");
  const receipt = value as { readonly [key: string]: StrictJson };
  if (
    receipt.schema !== "phase10-preflight-receipt-v1" ||
    receipt.receiptId !== `phase10-a-p-${ATTEMPT_ID}-preflight-v1` ||
    receipt.attemptId !== ATTEMPT_ID || receipt.packetId !== PACKET_ID ||
    receipt.stage !== "run" || receipt.verdict !== "pass"
  ) {
    fail("A-P preflight receipt identity/verdict differs");
  }
  const observed = receipt.observed;
  if (observed === null || Array.isArray(observed) || typeof observed !== "object") {
    fail("A-P preflight receipt observed predicates differ");
  }
  const observedHead = (observed as { readonly [key: string]: StrictJson }).head;
  if (
    typeof observedHead !== "string" || !/^[0-9a-f]{40}$/u.test(observedHead) ||
    (observedHead !== head && !gitAncestor(root, observedHead))
  ) {
    fail("A-P preflight receipt head differs");
  }
}

function atomicPublish(root: string, candidate: string, output: string): void {
  const parent = dirname(output);
  const stage = resolve(parent, `.phase10-a-p-stage-${process.pid}`);
  if (existsSync(stage)) fail("A-P publication staging path already exists");
  if (existsSync(output)) {
    const outputStat = lstatSync(output);
    if (
      !outputStat.isDirectory() || outputStat.isSymbolicLink() ||
      realpathSync(output) !== resolve(output)
    ) {
      fail("publication is not an unaliased non-symlink directory");
    }
    const names = readdirSync(output).sort(compareText);
    if (names.join("\n") !== ["artifact-index.json", "missing-producer.json", "packets", "uncalled-check.json", "verification.json"].join("\n")) {
      fail("existing A-P publication top-level roster differs");
    }
    const packetNames = readdirSync(resolve(output, "packets/a-p")).sort(compareText);
    if (packetNames.join("\n") !== ["preflight.json", "terminal-receipt.json"].join("\n")) {
      fail("existing A-P publication packet receipt roster differs");
    }
    for (const directory of ["packets", "packets/a-p"]) {
      const absolute = resolve(output, directory);
      const stat = lstatSync(absolute);
      if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(absolute) !== absolute) {
        fail(`existing publication ${directory} is not an unaliased non-symlink directory`);
      }
    }
    for (const file of PUBLICATION_FILES) {
      const expected = candidateBytes(candidate, file.source);
      const absolute = resolve(output, file.destination);
      const stat = lstatSync(absolute);
      if (!stat.isFile() || stat.isSymbolicLink() || !sameBytes(new Uint8Array(readFileSync(absolute)), expected)) {
        fail(`existing publication differs at ${file.destination}`);
      }
    }
    return;
  }
  if (existsSync(parent)) {
    const parentStat = lstatSync(parent);
    if (!parentStat.isDirectory() || parentStat.isSymbolicLink() || realpathSync(parent) !== resolve(parent)) {
      fail("publication parent is not an unaliased non-symlink directory");
    }
  }
  mkdirSync(parent, { recursive: true });
  mkdirSync(stage);
  try {
    for (const file of PUBLICATION_FILES) {
      writeExclusive(resolve(stage, file.destination), candidateBytes(candidate, file.source));
    }
    renameSync(stage, output);
  } catch (error) {
    if (existsSync(stage)) rmSync(stage, { recursive: true, force: false });
    throw error;
  }
  for (const file of PUBLICATION_FILES) {
    if (!sameBytes(new Uint8Array(readFileSync(resolve(output, file.destination))), candidateBytes(candidate, file.source))) {
      fail(`published readback differs at ${file.destination}`);
    }
  }
}

/** Deeply validate and atomically publish the exact completed A-P candidate bytes. */
export function publishPhase10ApCandidate(request: Phase10ApPublishRequest): void {
  const root = safeRoot(request.repositoryRoot);
  if (process.version !== EXPECTED_RUNTIME) fail(`runtime ${process.version} differs from ${EXPECTED_RUNTIME}`);
  if (git(root, ["branch", "--show-current"]) !== EXPECTED_BRANCH) fail("publication branch differs");
  assertCleanOrExactPublication(root, "A-P publication");
  const head = git(root, ["rev-parse", "HEAD"]);
  if (request.outputDirectory !== PUBLICATION_PATH) fail(`publication path must be ${PUBLICATION_PATH}`);
  const candidateRelative = safeRelativePath(request.candidateDirectory, "candidate directory");
  writePhase10ExecutionReceipt({ repositoryRoot: root, candidateDirectory: candidateRelative });
  const candidate = assertCandidateComplete(root, candidateRelative);
  validatePreflight(root, candidate, head);
  // Re-open the complete candidate once more after the terminal write. The writer independently
  // re-derives every check/control/witness set, so coordinated post-verification mutations cannot
  // cross the publication boundary.
  writePhase10ExecutionReceipt({ repositoryRoot: root, candidateDirectory: candidateRelative });
  const output = pathBelowRoot(root, request.outputDirectory, "publication directory");
  atomicPublish(root, candidate, output);
}

interface CliArguments {
  readonly subcommand: "produce" | "publish";
  readonly repositoryRoot: string;
  readonly candidate: string;
  readonly output: string;
}

function cliArguments(argv: readonly string[]): CliArguments {
  const subcommand = argv[0];
  if (subcommand !== "produce" && subcommand !== "publish") fail("expected produce or publish subcommand");
  const values = new Map<string, string>();
  for (let index = 1; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === undefined || value === undefined || !flag.startsWith("--") || values.has(flag)) fail("CLI flags differ");
    values.set(flag, value);
  }
  if (subcommand === "produce") {
    if (values.size !== 2 || !values.has("--repository-root") || !values.has("--out")) fail("produce flags differ");
    return { subcommand, repositoryRoot: values.get("--repository-root")!, candidate: values.get("--out")!, output: "" };
  }
  if (values.size !== 3 || !values.has("--repository-root") || !values.has("--candidate") || !values.has("--out")) {
    fail("publish flags differ");
  }
  return {
    subcommand,
    repositoryRoot: values.get("--repository-root")!,
    candidate: values.get("--candidate")!,
    output: values.get("--out")!,
  };
}

function main(): void {
  const request = cliArguments(process.argv.slice(2));
  if (request.subcommand === "produce") {
    if (process.argv.slice(2).join(" ") !== `produce --repository-root . --out ${CANDIDATE_DEFAULT}`) fail("produce command differs from frozen command");
    const result = producePhase10ApArtifacts({ repositoryRoot: request.repositoryRoot, candidateDirectory: request.candidate });
    process.stdout.write(`${JSON.stringify({ state: "candidate-awaiting-independent-verification", ...result })}\n`);
    return;
  }
  if (process.argv.slice(2).join(" ") !== `publish --repository-root . --candidate ${CANDIDATE_DEFAULT} --out ${PUBLICATION_PATH}`) {
    fail("publish command differs from frozen command");
  }
  publishPhase10ApCandidate({
    repositoryRoot: request.repositoryRoot,
    candidateDirectory: request.candidate,
    outputDirectory: request.output,
  });
  process.stdout.write(`${JSON.stringify({ state: "published", path: PUBLICATION_PATH, command: PUBLISH_COMMAND })}\n`);
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

export const PHASE10_AP_PRODUCE_COMMAND = PRODUCE_COMMAND;
export const PHASE10_AP_PUBLISH_COMMAND = PUBLISH_COMMAND;
export const PHASE10_AP_CANDIDATE_PATH = CANDIDATE_DEFAULT;
