import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { canonicalJson, strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  PHASE10_C0_DERIVE_PACKET_PROTOCOL_PATH,
  PHASE10_C0_EXECUTOR_RESOURCES,
  PHASE10_C0_PUBLISH_PACKET_PROTOCOL_PATH,
  PHASE10_C0_SCIENCE_PROTOCOL_PATH,
  parsePhase10C0Protocol,
  phase10C0ParsePrettyJson,
  phase10C0ParseRetainedPreflight,
  type Phase10C0ExecutionProvenance,
} from "./phase10-c0-contracts.ts";
import type { Phase10C0EvaluatorExecution } from "./phase10-c0-independent.ts";
import {
  phase10BuildExecutionPreflightReceipt,
  phase10ExpectedTerminalReceipt,
  phase10InspectExecutionPreflight,
  phase10PrettyExecutionJsonBytes,
  phase10ValidateExecutionTerminal,
  type Phase10ExecutablePacketId,
  type Phase10ExecutionPreflightContext,
} from "./phase10-execution-preflight.ts";
import { publishPhase10C0PacketCandidate, PHASE10_C0_PUBLICATION_PATH } from "./phase10-c0-publish.ts";

const DERIVE_FILES = Object.freeze([
  "c0-analysis.json",
  "c0-comparisons.jsonl",
  "c0-derive-verification.json",
  "c0-historical-verifier-limit.json",
  "c0-target-field-gaps.json",
].sort());
const PUBLISH_FILES = Object.freeze(["c0-artifact-index.json", "c0-report.json", "c0-verification.json"].sort());

export interface Phase10ExecutorArguments {
  readonly mode: "run" | "check";
  readonly packetId: Phase10ExecutablePacketId;
  readonly protocolPath: string;
  readonly attemptId: string;
}

function fail(message: string): never {
  throw new Error(`Phase 10 executor refused: ${message}`);
}

export function phase10ParseExecutorArguments(argv: readonly string[]): Phase10ExecutorArguments {
  if (argv.length !== 7 || (argv[0] !== "run" && argv[0] !== "check") || argv[1] !== "--packet" || argv[3] !== "--protocol" || argv[5] !== "--attempt") {
    fail("usage: node runner/src/phase10-executor.ts run|check --packet c0-derive|c0-publish --protocol <registered-path> --attempt <safe-id>");
  }
  const packetId = argv[2];
  if (packetId !== "c0-derive" && packetId !== "c0-publish") fail(`unknown packet ID ${String(packetId)}`);
  const expectedProtocol = packetId === "c0-derive" ? PHASE10_C0_DERIVE_PACKET_PROTOCOL_PATH : PHASE10_C0_PUBLISH_PACKET_PROTOCOL_PATH;
  if (argv[4] !== expectedProtocol) fail("protocol argument differs from the registered packet path");
  const attemptId = argv[6]!;
  if (!/^[a-z0-9][a-z0-9.-]*$/u.test(attemptId)) fail("attempt ID is not a safe stable token");
  return Object.freeze({ mode: argv[0], packetId, protocolPath: expectedProtocol, attemptId });
}

function safeRoot(value: string): string {
  const root = realpathSync(resolve(value));
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("repository root must be a physical directory");
  return root;
}

function safePath(root: string, path: string, label: string): string {
  if (isAbsolute(path) || path.includes("\\") || path.startsWith("/") || path.endsWith("/") || path.split("/").some((part) => part === "" || part === "." || part === "..")) {
    fail(`${label} is not a safe repository-relative path`);
  }
  const absolute = resolve(root, path);
  const displacement = relative(root, absolute);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) || isAbsolute(displacement)) fail(`${label} escapes repository root`);
  return absolute;
}

function read(root: string, path: string, label = path): Uint8Array {
  const absolute = safePath(root, path, label);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} is not a regular file`);
  return new Uint8Array(readFileSync(absolute));
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function writeExclusive(root: string, path: string, bytes: Uint8Array): void {
  const absolute = safePath(root, path, path);
  mkdirSync(dirname(absolute), { recursive: true });
  let descriptor: number | undefined;
  try {
    descriptor = openSync(absolute, "wx");
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    throw error;
  }
  if (!sameBytes(read(root, path), bytes)) fail(`${path} readback differs`);
}

function writeOrMatch(root: string, path: string, bytes: Uint8Array): boolean {
  const absolute = safePath(root, path, path);
  if (existsSync(absolute)) {
    if (!sameBytes(read(root, path), bytes)) fail(`existing ${path} differs`);
    return false;
  }
  writeExclusive(root, path, bytes);
  return true;
}

export function phase10AcquireWriterLock(rootValue: string, lockPath: string, attemptId: string): () => void {
  const root = safeRoot(rootValue);
  const absolute = safePath(root, lockPath, "writer lock");
  mkdirSync(dirname(absolute), { recursive: true });
  const bytes = phase10PrettyExecutionJsonBytes({ schema: "phase10-writer-lock-v1", attemptId, pid: process.pid, createdIso: new Date().toISOString() });
  let descriptor: number | undefined;
  try {
    descriptor = openSync(absolute, "wx");
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    fail(`writer lock exists or cannot be acquired; stale locks are never auto-removed (${error instanceof Error ? error.message : "lock error"})`);
  }
  return (): void => {
    if (!existsSync(absolute) || !sameBytes(new Uint8Array(readFileSync(absolute)), bytes)) fail("writer lock changed while held");
    unlinkSync(absolute);
  };
}

function packetFiles(packetId: Phase10ExecutablePacketId): readonly string[] {
  return packetId === "c0-derive" ? DERIVE_FILES : PUBLISH_FILES;
}

function allowedRecoveryPaths(packetId: Phase10ExecutablePacketId): readonly string[] {
  return Object.freeze([
    ...packetFiles(packetId).map((name) => `${PHASE10_C0_PUBLICATION_PATH}/${name}`),
    `evidence/phase10-obligation-preflight-v1/packets/${packetId}/preflight.json`,
    `evidence/phase10-obligation-preflight-v1/packets/${packetId}/terminal-receipt.json`,
  ]);
}

function parseObject(bytes: Uint8Array, label: string): { readonly [key: string]: StrictJson } {
  const value = phase10C0ParsePrettyJson(bytes, label);
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as { readonly [key: string]: StrictJson };
}

function exactKeys(value: object, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} fields differ: expected ${wanted.join(",")}; got ${actual.join(",")}`);
  }
}

/**
 * Bind the generic packet terminal to the independently written candidate verification. A clean
 * worker exit is transport status only; it cannot turn an evaluator failure into completion.
 */
export function phase10CandidateVerificationTerminalState(
  packetId: Phase10ExecutablePacketId,
  value: unknown,
): "complete" | "fail" {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail("candidate verification must be an object");
  const verification = value as { readonly [key: string]: StrictJson };
  const commonFields = [
    "schema", "verificationId", "matrixId", "protocolId", "registryId", "packetId", "terminalState",
    "verifiedArtifacts", "checkResults", "executedNegativeControlIds", "boundDependencyPacketIds",
    "execution", "aggregateVerdict", "limits",
  ];
  exactKeys(
    verification,
    packetId === "c0-derive" ? [...commonFields, "negativeControlResults"] : commonFields,
    "candidate verification",
  );
  if (packetId === "c0-derive") {
    if (
      verification.schema !== "phase10-packet-verification-v1" ||
      verification.verificationId !== "phase10-c0-derive-verification-v1" ||
      verification.packetId !== packetId ||
      (verification.terminalState !== "complete" && verification.terminalState !== "fail") ||
      verification.aggregateVerdict !== (verification.terminalState === "complete" ? "pass" : "fail")
    ) fail("derive candidate verification identity/state differs");
    return verification.terminalState;
  }
  if (
    verification.schema !== "phase10-independent-verification-v1" ||
    verification.verificationId !== "phase10-c0-publication-verification-v1" ||
    verification.packetId !== packetId || verification.terminalState !== "complete" ||
    verification.aggregateVerdict !== "pass"
  ) fail("publish candidate verification identity/state differs");
  return "complete";
}

function retainedPreflightMatches(context: Phase10ExecutionPreflightContext, bytes: Uint8Array): void {
  const retained = phase10C0ParseRetainedPreflight(bytes, context.packetId);
  if (
    retained.attemptId !== context.attemptId || retained.command !== context.command || retained.cwd !== context.repositoryRoot ||
    retained.runtime !== context.runtime || retained.gitHead !== context.head
  ) fail("retained preflight provenance differs from the current authorized attempt");
  const actual = parseObject(bytes, "retained preflight comparison");
  const expected = phase10BuildExecutionPreflightReceipt(context) as { readonly [key: string]: StrictJson };
  const actualObserved = actual.observed as { readonly [key: string]: StrictJson };
  const expectedObserved = expected.observed as { readonly [key: string]: StrictJson };
  const actualResources = actualObserved.resources as { readonly [key: string]: StrictJson };
  const normalizedExpected = strictJsonSnapshot({
    ...expected,
    observed: { ...expectedObserved, resources: { ...(expectedObserved.resources as { readonly [key: string]: StrictJson }), observedFreeBytes: actualResources.observedFreeBytes } },
  });
  if (canonicalJson(actual) !== canonicalJson(normalizedExpected)) fail("retained preflight differs from current registrations/code freeze/dependencies");
}

function candidateComplete(context: Phase10ExecutionPreflightContext): void {
  const directory = safePath(context.repositoryRoot, context.paths.candidateDirectory, "candidate directory");
  const stat = lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(directory) !== directory) fail("candidate directory is aliased or not a directory");
  const names = readdirSync(directory).sort();
  const expected = packetFiles(context.packetId);
  if (names.length !== expected.length || names.some((name, index) => name !== expected[index])) fail("candidate file roster is incomplete or contains extras");
}

function candidateVerificationTerminalState(context: Phase10ExecutionPreflightContext): "complete" | "fail" {
  candidateComplete(context);
  const verificationName = context.packetId === "c0-derive" ? "c0-derive-verification.json" : "c0-verification.json";
  return phase10CandidateVerificationTerminalState(
    context.packetId,
    phase10C0ParsePrettyJson(
      read(context.repositoryRoot, `${context.paths.candidateDirectory}/${verificationName}`),
      "candidate verification terminal binding",
    ),
  );
}

export function phase10C0RegisteredScienceInputPaths(scienceProtocolBytes: Uint8Array): {
  readonly rowsArtifactPath: string;
  readonly historicalReportArtifactPath: string;
} {
  const science = parsePhase10C0Protocol(scienceProtocolBytes);
  return Object.freeze({
    rowsArtifactPath: science.rowsArtifact.path,
    historicalReportArtifactPath: science.historicalReportArtifact.path,
  });
}

function verificationContext(context: Phase10ExecutionPreflightContext, preflightReceiptBytes: Uint8Array) {
  const verificationName = context.packetId === "c0-derive" ? "c0-derive-verification.json" : "c0-verification.json";
  const verification = parseObject(read(context.repositoryRoot, `${context.paths.candidateDirectory}/${verificationName}`), "candidate verification");
  if (context.packetId === "c0-derive") {
    const scienceProtocolBytes = read(context.repositoryRoot, PHASE10_C0_SCIENCE_PROTOCOL_PATH);
    const scienceInputPaths = phase10C0RegisteredScienceInputPaths(scienceProtocolBytes);
    return Object.freeze({
      packetId: "c0-derive" as const,
      scienceProtocolBytes,
      packetProtocolBytes: context.protocolBytes,
      callableRegistryBytes: context.registryBytes,
      preflightReceiptBytes,
      rowsBytes: read(context.repositoryRoot, scienceInputPaths.rowsArtifactPath),
      historicalReportBytes: read(context.repositoryRoot, scienceInputPaths.historicalReportArtifactPath),
      evaluatorExecution: verification.execution as unknown as Phase10C0EvaluatorExecution,
      evaluatorCwd: context.repositoryRoot,
    });
  }
  return Object.freeze({
    packetId: "c0-publish" as const,
    scienceProtocolBytes: read(context.repositoryRoot, PHASE10_C0_SCIENCE_PROTOCOL_PATH),
    packetProtocolBytes: context.protocolBytes,
    callableRegistryBytes: context.registryBytes,
    preflightReceiptBytes,
    evaluatorModuleBytes: read(context.repositoryRoot, "runner/src/phase10-c0-publication-verifier.ts"),
    execution: verification.execution as unknown as Phase10C0ExecutionProvenance,
  });
}

function validateResume(context: Phase10ExecutionPreflightContext): Uint8Array {
  for (const path of [context.paths.retainedPreflight, context.paths.retainedTerminal, context.paths.stdout, context.paths.stderr, context.paths.exitStatus, context.paths.resourceLedger]) {
    if (!existsSync(safePath(context.repositoryRoot, path, path))) fail("same-attempt resume requires a fully terminal retained attempt");
  }
  const preflightBytes = read(context.repositoryRoot, context.paths.retainedPreflight);
  retainedPreflightMatches(context, preflightBytes);
  const terminalBytes = read(context.repositoryRoot, context.paths.retainedTerminal);
  const verificationState = candidateVerificationTerminalState(context);
  phase10ValidateExecutionTerminal(context, phase10C0ParsePrettyJson(terminalBytes, "retained terminal"), verificationState);
  if (verificationState !== "complete") fail("same-attempt resume cannot publish an evaluator-fail candidate");
  const exit = parseObject(read(context.repositoryRoot, context.paths.exitStatus), "retained exit status");
  if (exit.schema !== "phase10-exit-status-v1" || exit.packetId !== context.packetId || exit.attemptId !== context.attemptId || exit.exitCode !== 0 || exit.timedOut !== false) {
    fail("same-attempt resume requires exact successful exit status");
  }
  return preflightBytes;
}

function publishStructuralPair(context: Phase10ExecutionPreflightContext, preflightBytes: Uint8Array, terminalBytes: Uint8Array): boolean {
  const target = dirname(context.row.preflightReceiptPath);
  const absoluteTarget = safePath(context.repositoryRoot, target, "structural receipt directory");
  const expectedNames = [basename(context.row.preflightReceiptPath), basename(context.row.terminalReceiptPath)].sort();
  if (!existsSync(absoluteTarget)) {
    mkdirSync(dirname(absoluteTarget), { recursive: true });
    const stageRelative = `${dirname(target)}/.${basename(target)}-${context.attemptId}-${process.pid}.stage`;
    const absoluteStage = safePath(context.repositoryRoot, stageRelative, "structural receipt stage");
    if (existsSync(absoluteStage)) fail("structural receipt stage already exists");
    mkdirSync(absoluteStage);
    try {
      writeExclusive(context.repositoryRoot, `${stageRelative}/${expectedNames[0]!}`, expectedNames[0] === "preflight.json" ? preflightBytes : terminalBytes);
      writeExclusive(context.repositoryRoot, `${stageRelative}/${expectedNames[1]!}`, expectedNames[1] === "preflight.json" ? preflightBytes : terminalBytes);
      renameSync(absoluteStage, absoluteTarget);
      return true;
    } finally {
      if (existsSync(absoluteStage)) rmSync(absoluteStage, { recursive: true, force: false });
    }
  }
  const stat = lstatSync(absoluteTarget);
  if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(absoluteTarget) !== absoluteTarget) fail("structural receipt directory is aliased or not a directory");
  const names = readdirSync(absoluteTarget).sort();
  if (names.some((name) => !expectedNames.includes(name))) fail("structural receipt directory has an unregistered file");
  const first = writeOrMatch(context.repositoryRoot, context.row.preflightReceiptPath, preflightBytes);
  const second = writeOrMatch(context.repositoryRoot, context.row.terminalReceiptPath, terminalBytes);
  return first || second;
}

function publishCompleted(context: Phase10ExecutionPreflightContext, preflightBytes: Uint8Array): boolean {
  candidateComplete(context);
  const terminalBytes = read(context.repositoryRoot, context.paths.retainedTerminal);
  phase10ValidateExecutionTerminal(context, phase10C0ParsePrettyJson(terminalBytes, "retained terminal"), "complete");
  const contentChanged = publishPhase10C0PacketCandidate({
    repositoryRoot: context.repositoryRoot,
    packetId: context.packetId,
    candidateDirectory: context.paths.candidateDirectory,
    outputDirectory: PHASE10_C0_PUBLICATION_PATH,
    verificationContext: verificationContext(context, preflightBytes),
  });
  const receiptChanged = publishStructuralPair(context, preflightBytes, terminalBytes);
  return contentChanged || receiptChanged;
}

function workerResult(
  context: Phase10ExecutionPreflightContext,
): SpawnSyncReturns<Buffer> {
  const workerPath = resolve(context.repositoryRoot, "runner/src/phase10-executor-worker.ts");
  return spawnSync(process.execPath, [
    workerPath,
    "--repository-root", context.repositoryRoot,
    "--packet", context.packetId,
    "--attempt", context.attemptId,
  ], {
    cwd: context.repositoryRoot,
    encoding: "buffer",
    timeout: PHASE10_C0_EXECUTOR_RESOURCES.maxWallSeconds * 1000,
    killSignal: "SIGKILL",
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
}

export function phase10ClassifyWorkerOutcome(result: Pick<SpawnSyncReturns<Buffer>, "status" | "signal" | "error">): {
  readonly success: boolean;
  readonly timedOut: boolean;
} {
  const timedOut = result.error !== undefined && "code" in result.error && result.error.code === "ETIMEDOUT";
  return Object.freeze({ success: result.status === 0 && result.signal === null && result.error === undefined, timedOut });
}

function retainProcessRecords(
  context: Phase10ExecutionPreflightContext,
  result: SpawnSyncReturns<Buffer>,
  startedIso: string,
  endedIso: string,
): { readonly success: boolean; readonly timedOut: boolean } {
  const outcome = phase10ClassifyWorkerOutcome(result);
  writeExclusive(context.repositoryRoot, context.paths.stdout, new Uint8Array(result.stdout ?? Buffer.alloc(0)));
  writeExclusive(context.repositoryRoot, context.paths.stderr, new Uint8Array(result.stderr ?? Buffer.alloc(0)));
  writeExclusive(context.repositoryRoot, context.paths.exitStatus, phase10PrettyExecutionJsonBytes({
    schema: "phase10-exit-status-v1",
    packetId: context.packetId,
    attemptId: context.attemptId,
    exitCode: result.status,
    signal: result.signal,
    timedOut: outcome.timedOut,
    errorCode: result.error !== undefined && "code" in result.error ? String(result.error.code) : null,
  }));
  let observedFinalRssBytes: number | null = null;
  try {
    const line = new TextDecoder("utf-8", { fatal: true }).decode(result.stdout ?? Buffer.alloc(0)).trim();
    const parsed = JSON.parse(line) as { observedFinalRssBytes?: unknown };
    if (Number.isSafeInteger(parsed.observedFinalRssBytes) && (parsed.observedFinalRssBytes as number) >= 0) {
      observedFinalRssBytes = parsed.observedFinalRssBytes as number;
    }
  } catch {
    // A failed worker may not emit a summary; stderr/exit status remain the evidence.
  }
  writeExclusive(context.repositoryRoot, context.paths.resourceLedger, phase10PrettyExecutionJsonBytes({
    schema: "phase10-resource-ledger-v1",
    packetId: context.packetId,
    attemptId: context.attemptId,
    startedIso,
    endedIso,
    wallSeconds: (Date.parse(endedIso) - Date.parse(startedIso)) / 1000,
    processConcurrency: 1,
    observedFinalRssBytes,
    solverExecutionAuthorized: false,
    scientificProcessHours: 0,
    nasUsed: false,
    maxWallSeconds: PHASE10_C0_EXECUTOR_RESOURCES.maxWallSeconds,
  }));
  return outcome;
}

export function phase10RunExecutor(args: Phase10ExecutorArguments, repositoryRoot = "."): StrictJson {
  const root = safeRoot(repositoryRoot);
  const attemptDirectory = `out/phase10-execution-v1/attempts/${args.packetId}/${args.attemptId}`;
  const lockPath = `out/phase10-execution-v1/attempts/${args.packetId}/writer.lock`;
  if (args.mode === "check") {
    const existingAttempt = existsSync(safePath(root, attemptDirectory, "attempt directory"));
    const context = phase10InspectExecutionPreflight({
      repositoryRoot: root,
      packetId: args.packetId,
      protocolPath: args.protocolPath,
      attemptId: args.attemptId,
      allowedStatusPaths: existingAttempt ? allowedRecoveryPaths(args.packetId) : [],
    });
    return phase10BuildExecutionPreflightReceipt(context);
  }
  // The run-mode lock precedes every authorizing observation. A concurrent invocation cannot
  // preflight a clean state, wait for an earlier publication, and then execute without rechecking.
  const release = phase10AcquireWriterLock(root, lockPath, args.attemptId);
  try {
    const existingAttempt = existsSync(safePath(root, attemptDirectory, "attempt directory"));
    const context = phase10InspectExecutionPreflight({
      repositoryRoot: root,
      packetId: args.packetId,
      protocolPath: args.protocolPath,
      attemptId: args.attemptId,
      allowedStatusPaths: [lockPath, ...(existingAttempt ? allowedRecoveryPaths(args.packetId) : [])],
    });
    if (context.paths.lock !== lockPath) fail("registered writer lock path differs from the acquired lock");
    if (existingAttempt) {
      const preflightBytes = validateResume(context);
      return strictJsonSnapshot({ packetId: context.packetId, attemptId: context.attemptId, resumed: true, publicationChanged: publishCompleted(context, preflightBytes) });
    }
    mkdirSync(safePath(root, context.paths.candidateDirectory, "candidate directory"), { recursive: true });
    const preflightBytes = phase10PrettyExecutionJsonBytes(phase10BuildExecutionPreflightReceipt(context));
    writeExclusive(root, context.paths.retainedPreflight, preflightBytes);
    const startedIso = new Date().toISOString();
    const result = workerResult(context);
    const endedIso = new Date().toISOString();
    const outcome = retainProcessRecords(context, result, startedIso, endedIso);
    if (!outcome.success) fail(outcome.timedOut ? "hard 300-second worker timeout" : "hard-coded worker failed; see retained stderr/exit status");
    const terminalState = candidateVerificationTerminalState(context);
    const terminal = phase10ExpectedTerminalReceipt(context, terminalState);
    const terminalBytes = phase10PrettyExecutionJsonBytes(terminal);
    writeExclusive(root, context.paths.retainedTerminal, terminalBytes);
    phase10ValidateExecutionTerminal(context, terminal, terminalState);
    if (terminalState !== "complete") fail("independent evaluator returned fail; retained attempt is terminal but publication is refused");
    return strictJsonSnapshot({ packetId: context.packetId, attemptId: context.attemptId, resumed: false, publicationChanged: publishCompleted(context, preflightBytes) });
  } finally {
    release();
  }
}

function main(): void {
  try {
    const result = phase10RunExecutor(phase10ParseExecutorArguments(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "Phase 10 executor failed"}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
