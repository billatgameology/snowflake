import { readFileSync, writeFileSync, openSync, closeSync, fsyncSync, mkdirSync, lstatSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import {
  parsePhase10C0Protocol,
  phase10C0ExecutorCommand,
  phase10C0ParseRetainedPreflight,
  phase10C0Sha256,
  type Phase10C0ExecutionProvenance,
} from "./phase10-c0-contracts.ts";
import { producePhase10C0DeriveArtifacts } from "./phase10-c0-derive.ts";
import { independentlyEvaluatePhase10C0Derive, type Phase10C0EvaluatorExecution } from "./phase10-c0-independent.ts";
import { writePhase10C0DeriveVerificationReceipt } from "./phase10-c0-derive-verification-receipt.ts";
import { producePhase10C0PublishArtifacts } from "./phase10-c0-publish.ts";
import { phase10C0PublicationVerifier } from "./phase10-c0-publication-verifier.ts";
import { writePhase10C0PublishVerificationReceipt } from "./phase10-c0-publish-verification-receipt.ts";

type PacketId = "c0-derive" | "c0-publish";

function fail(message: string): never {
  throw new Error(`Phase 10 executor worker refused: ${message}`);
}

function safeRoot(value: string): string {
  const root = realpathSync(resolve(value));
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("repository root must be a physical directory");
  return root;
}

function safePath(root: string, path: string): string {
  if (isAbsolute(path) || path.includes("\\") || path.split("/").some((part) => part === "" || part === "." || part === "..")) fail(`unsafe path ${path}`);
  const absolute = resolve(root, path);
  const displacement = relative(root, absolute);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) || isAbsolute(displacement)) fail(`path escapes root: ${path}`);
  return absolute;
}

function read(root: string, path: string): Uint8Array {
  const absolute = safePath(root, path);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${path} is not a regular file`);
  return new Uint8Array(readFileSync(absolute));
}

function writeExclusive(root: string, path: string, bytes: Uint8Array): void {
  const absolute = safePath(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  const descriptor = openSync(absolute, "wx");
  try {
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function parseArguments(argv: readonly string[]): { readonly root: string; readonly packetId: PacketId; readonly attemptId: string } {
  if (argv.length !== 6 || argv[0] !== "--repository-root" || argv[2] !== "--packet" || argv[4] !== "--attempt") fail("internal worker arguments differ");
  const packetId = argv[3];
  if (packetId !== "c0-derive" && packetId !== "c0-publish") fail("unknown packet ID");
  const attemptId = argv[5]!;
  if (!/^[a-z0-9][a-z0-9.-]*$/u.test(attemptId)) fail("unsafe attempt ID");
  return Object.freeze({ root: safeRoot(argv[1]!), packetId, attemptId });
}

function execution(root: string, packetId: PacketId, attemptId: string, head: string): Phase10C0ExecutionProvenance {
  const instant = new Date().toISOString();
  return Object.freeze({
    runtime: process.version,
    command: phase10C0ExecutorCommand(packetId, attemptId),
    cwd: root,
    gitHead: head,
    startedIso: instant,
    finishedIso: instant,
    processConcurrency: 1,
  });
}

function evaluatorExecution(
  root: string,
  packetId: PacketId,
  attemptId: string,
  head: string,
  registryBytes: Uint8Array,
): Phase10C0EvaluatorExecution {
  const registry = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(registryBytes)) as {
    callables?: { callableId?: unknown; modulePath?: unknown; exportName?: unknown; identity?: { byteLength?: unknown; sha256?: unknown } | null }[];
  };
  const row = registry.callables?.find((entry) => entry.callableId === "phase10-c0-evaluator");
  if (
    row?.modulePath !== "runner/src/phase10-c0-independent.ts" || row.exportName !== "independentlyEvaluatePhase10C0Derive" ||
    row.identity === null || !Number.isSafeInteger(row.identity?.byteLength) || typeof row.identity?.sha256 !== "string"
  ) fail("derive evaluator is not exactly resolved");
  const moduleBytes = read(root, row.modulePath);
  if (moduleBytes.byteLength !== row.identity.byteLength || phase10C0Sha256(moduleBytes) !== row.identity.sha256) fail("derive evaluator bytes differ from registry");
  const instant = new Date().toISOString();
  return Object.freeze({
    evaluatorCallableId: "phase10-c0-evaluator",
    modulePath: "runner/src/phase10-c0-independent.ts",
    exportName: "independentlyEvaluatePhase10C0Derive",
    byteLength: moduleBytes.byteLength,
    sha256: phase10C0Sha256(moduleBytes),
    runtime: process.version,
    command: phase10C0ExecutorCommand(packetId, attemptId),
    gitHead: head,
    startedOn: instant,
    endedOn: instant,
    processConcurrency: 1,
  });
}

function runDerive(root: string, attemptId: string, preflightBytes: Uint8Array, head: string): void {
  // This is the first point in the lifecycle that opens the frozen scientific input artifacts.
  const scienceProtocolBytes = read(root, "research/phase10-c0-protocol-v1.json");
  const science = parsePhase10C0Protocol(scienceProtocolBytes);
  const rowsBytes = read(root, science.rowsArtifact.path);
  const historicalReportBytes = read(root, science.historicalReportArtifact.path);
  const packetProtocolBytes = read(root, "research/phase10-execution-v1/packets/c0-derive/protocol.json");
  const callableRegistryBytes = read(root, "research/phase10-execution-v1/packets/c0-derive/callable-registry.json");
  const productionExecution = execution(root, "c0-derive", attemptId, head);
  const produced = producePhase10C0DeriveArtifacts({
    scienceProtocolBytes,
    preflightReceiptBytes: preflightBytes,
    rowsBytes,
    historicalReportBytes,
    execution: productionExecution,
  });
  const evaluator = evaluatorExecution(root, "c0-derive", attemptId, head, callableRegistryBytes);
  const candidate = { rowsBytes, ...produced };
  const evaluation = independentlyEvaluatePhase10C0Derive({
    scienceProtocolBytes,
    preflightReceiptBytes: preflightBytes,
    historicalReportBytes,
    candidate,
    evaluatorExecution: evaluator,
    evaluatorCwd: root,
  });
  const verificationBytes = writePhase10C0DeriveVerificationReceipt({
    packetProtocolBytes,
    callableRegistryBytes,
    preflightReceiptBytes: preflightBytes,
    evaluation,
    execution: evaluator,
    evaluatorCwd: root,
  });
  const base = `out/phase10-execution-v1/attempts/c0-derive/${attemptId}/candidate`;
  writeExclusive(root, `${base}/c0-analysis.json`, produced.analysisBytes);
  writeExclusive(root, `${base}/c0-comparisons.jsonl`, produced.comparisonsBytes);
  writeExclusive(root, `${base}/c0-target-field-gaps.json`, produced.gapsBytes);
  writeExclusive(root, `${base}/c0-historical-verifier-limit.json`, produced.historicalLimitBytes);
  writeExclusive(root, `${base}/c0-derive-verification.json`, verificationBytes);
}

function runPublish(root: string, attemptId: string, preflightBytes: Uint8Array, head: string): void {
  const scienceProtocolBytes = read(root, "research/phase10-c0-protocol-v1.json");
  const packetProtocolBytes = read(root, "research/phase10-execution-v1/packets/c0-publish/protocol.json");
  const callableRegistryBytes = read(root, "research/phase10-execution-v1/packets/c0-publish/callable-registry.json");
  const source = "evidence/phase10-numerical-verification-v1";
  const analysisBytes = read(root, `${source}/c0-analysis.json`);
  const comparisonsBytes = read(root, `${source}/c0-comparisons.jsonl`);
  const gapsBytes = read(root, `${source}/c0-target-field-gaps.json`);
  const historicalLimitBytes = read(root, `${source}/c0-historical-verifier-limit.json`);
  const runExecution = execution(root, "c0-publish", attemptId, head);
  const produced = producePhase10C0PublishArtifacts({
    preflightReceiptBytes: preflightBytes,
    execution: runExecution,
    analysisBytes,
    comparisonsBytes,
    gapsBytes,
    historicalLimitBytes,
    publishedIso: new Date().toISOString(),
  });
  const candidate = { analysisBytes, comparisonsBytes, gapsBytes, historicalLimitBytes, ...produced };
  const evaluation = phase10C0PublicationVerifier({
    scienceProtocolBytes,
    preflightReceiptBytes: preflightBytes,
    candidate,
    execution: runExecution,
  });
  const evaluatorModuleBytes = read(root, "runner/src/phase10-c0-publication-verifier.ts");
  const verificationBytes = writePhase10C0PublishVerificationReceipt({
    packetProtocolBytes,
    callableRegistryBytes,
    evaluatorModuleBytes,
    preflightReceiptBytes: preflightBytes,
    evaluation,
    execution: runExecution,
  });
  const base = `out/phase10-execution-v1/attempts/c0-publish/${attemptId}/candidate`;
  writeExclusive(root, `${base}/c0-report.json`, produced.reportBytes);
  writeExclusive(root, `${base}/c0-artifact-index.json`, produced.artifactIndexBytes);
  writeExclusive(root, `${base}/c0-verification.json`, verificationBytes);
}

export function phase10ExecutorWorker(argv: readonly string[]): void {
  const { root, packetId, attemptId } = parseArguments(argv);
  const preflightPath = `out/phase10-execution-v1/attempts/${packetId}/${attemptId}/preflight.json`;
  const preflightBytes = read(root, preflightPath);
  const preflight = phase10C0ParseRetainedPreflight(preflightBytes, packetId);
  if (preflight.cwd !== root || preflight.attemptId !== attemptId) fail("retained preflight does not authorize this worker");
  if (packetId === "c0-derive") runDerive(root, attemptId, preflightBytes, preflight.gitHead);
  else runPublish(root, attemptId, preflightBytes, preflight.gitHead);
  process.stdout.write(`${JSON.stringify({ packetId, attemptId, observedFinalRssBytes: process.memoryUsage().rss })}\n`);
}

phase10ExecutorWorker(process.argv.slice(2));
