import { execFileSync } from "node:child_process";
import {
  derivePhase10C0VS6ImplementationFreeze,
  independentlyReopenPhase10C0VS6HistoricalFreeze,
  phase10C0VS6AssertPreexistingScienceClosureUnchanged,
  phase10C0VS6AssertFreezeWorktreeStage,
  phase10C0VS6ReopenFreezeRetainedPreflight,
} from "../src/phase10-c0v-s6-freeze.ts";
import {
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import { hrtime } from "node:process";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parsePhase10C0VS6ExecutableInvocationRecords,
  parsePhase10C0VS6ClassificationValidation,
  parsePhase10C0VS6PartialExecution,
  parsePhase10C0VS6RadialResultV2,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6PrettyJsonBytes,
  phase10C0VS6SafeRelativePath,
} from "../src/phase10-c0v-s6-execution-contracts.ts";
import type {
  Phase10C0VS6ExecutableInvocationAuthority,
  Phase10C0VS6PacketProtocol,
  Phase10C0VS6WorkerInvocationContract,
} from "../src/phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6DependencyArtifactRosterVariants,
  parsePhase10C0VS6CallableRegistry,
  parsePhase10C0VS6PacketCatalogue,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  parsePhase10C0VS6RecoveryV2Authority,
  parsePhase10C0VS6RecoveryV3Authority,
  parsePhase10C0VS6RecoveryV4Authority,
  parsePhase10C0VS6RecoveryV5Authority,
} from "../src/phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6AssertActiveLockedPacketAuthority,
  phase10C0VS6AssertRecoveryPredecessorState,
  phase10C0VS6PhysicalRepositoryRoot,
  phase10C0VS6AssertExactPhysicalRootCensus,
  phase10C0VS6PublishCrashSafeExclusive,
  phase10C0VS6ReadUniquePhysicalFile,
  phase10C0VS6WithExclusiveLock,
  phase10C0VS6WithPackageAndPacketLocks,
  phase10C0VS6WriteExclusiveOrExact,
} from "../src/phase10-c0v-s6-filesystem.ts";
import {
  phase10C0VS6AssertScientificClosureSeparation,
  phase10C0VS6AssertBuiltinAllowlistRegistryCoverage,
  phase10C0VS6AssertCallableRegistration,
  phase10C0VS6GitCanonicalWorktreeIdentity,
  phase10C0VS6ImportClosure,
  type Phase10C0VS6ImportAuditReceipt,
} from "../src/phase10-c0v-s6-import-audit.ts";
import type { Phase10C0VS6ArtifactIdentity } from "../src/phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6CreateWorkerInvocationEventLog,
  independentlyEvaluatePhase10C0VS6PacketWorkerInvocations,
  independentlyEvaluatePhase10C0VS6WorkerInvocations,
  parsePhase10C0VS6WorkerInvocationEventBytes,
  phase10C0VS6ReopenWorkerInvocationEventLog,
  phase10C0VS6WorkerInvocationEventBytes,
  type Phase10C0VS6WorkerInvocationEventRecord,
} from "../src/phase10-c0v-s6-worker-invocation.ts";
import {
  phase10C0VS6VerifyAppendOnlyResourceHistory,
} from "../src/phase10-c0v-s6-resource.ts";
import {
  phase10C0VS6HeadBoundManifestEntries,
  phase10C0VS6HistoricalHeadManifest,
  phase10C0VS6ValidateHeadBoundPreflightManifest,
} from "../src/phase10-c0v-s6-dependencies.ts";
import {
  phase10C0VS6ObserveRadialArtifactFailures,
} from "../src/phase10-c0v-s6-artifact-observation.ts";
import {
  parsePhase10C0VS6ContextualVerificationExecution,
  parsePhase10C0VS6ExitStatusReceipt,
  parsePhase10C0VS6CauseEvaluationReceipt,
  parsePhase10C0VS6FreezeEvaluationReceipt,
  parsePhase10C0VS6TerminalCandidate,
  writePhase10C0VS6FreezeEvaluationReceipt,
  writePhase10C0VS6PreflightReceipt,
} from "../src/phase10-c0v-s6-receipts.ts";
import {
  independentlyEvaluatePhase10C0VMovingDiscrepancy,
  independentlyEvaluatePhase10C0VStaticRefusal,
  independentlyEvaluatePhase10C0VS6RefusalCause,
  independentlyReprovePhase10C0VMovingDiscrepancyArtifacts,
  independentlyReprovePhase10C0VStaticRefusalArtifacts,
  phase10C0VS6RefusalCheckCaller,
} from "../src/phase10-c0v-s6-refusal.ts";
import {
  independentlyProjectPhase10C0VS6RawLifecycleRoute,
} from "../src/phase10-c0v-s6-lifecycle.ts";
import {
  independentlyFinalizePhase10C0VS6ApPacket,
  phase10C0VS6ValidateAttemptRootByteCeilings,
} from "../src/phase10-c0v-s6-published-packet.ts";
import {
  phase10C0VS6ClassifyGovernedElapsedNanoseconds,
  phase10C0VS6RunGovernedLeafWithWatchdog,
  phase10C0VS6WithOuterInfrastructureWatchdog,
  type Phase10C0VS6ParentWatchdogContext,
} from "../src/phase10-c0v-s6-watchdog.ts";

const temporaryRoots: string[] = [];

function codePointCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function temporaryRoot(label: string): string {
  const parent = resolve(process.cwd(), "out", "phase10-c0v-s6-synthetic-tests");
  mkdirSync(parent, { recursive: true });
  const root = join(parent, `${label.slice(0, 24)}-${process.pid}-${temporaryRoots.length}`);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: false });
  temporaryRoots.push(root);
  return root;
}

function write(root: string, path: string, text: string): void {
  const absolute = resolve(root, path);
  mkdirSync(resolve(absolute, ".."), { recursive: true });
  writeFileSync(absolute, text, { flag: "wx" });
}

function writeBytes(root: string, path: string, bytes: Uint8Array): void {
  const absolute = resolve(root, path);
  mkdirSync(resolve(absolute, ".."), { recursive: true });
  writeFileSync(absolute, bytes, { flag: "wx" });
}

function git(root: string, args: readonly string[]): string {
  return execFileSync("git", [...args], { cwd: root, encoding: "utf8", windowsHide: true }).trim();
}

function importAuditWorkspace(moduleSource: string): string {
  const root = temporaryRoot("import-audit");
  write(root, "package.json", `${JSON.stringify({ workspaces: ["pkg"] }, null, 2)}\n`);
  write(root, "package-lock.json", "{}\n");
  write(root, "tsconfig.json", "{}\n");
  write(root, "tsconfig.base.json", "{}\n");
  write(root, "pkg/package.json", `${JSON.stringify({ name: "@synthetic/pkg", exports: { ".": "./src/index.ts" } }, null, 2)}\n`);
  write(root, "pkg/src/index.ts", "export const workspaceValue = 1;\n");
  write(root, "runner/root.ts", moduleSource);
  git(root, ["init"]);
  git(root, ["config", "user.email", "synthetic@example.invalid"]);
  git(root, ["config", "user.name", "Synthetic Test"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "synthetic import authority"]);
  return root;
}

function identity(path: string): Phase10C0VS6ArtifactIdentity {
  return Object.freeze({ path, byteLength: 1, sha256: "0".repeat(64) });
}

function audit(paths: readonly string[]): Phase10C0VS6ImportAuditReceipt {
  const closure = Object.freeze([...paths].sort(codePointCompare).map(identity));
  return Object.freeze({
    rootModule: closure[0]!,
    closure,
    resolutionArtifacts: Object.freeze([]),
    parserRuntimeArtifacts: Object.freeze([]),
    externalPackages: Object.freeze([]),
    builtinModules: Object.freeze([]),
    forbiddenPaths: Object.freeze([]),
    forbiddenIdentifiers: Object.freeze([]),
  });
}

const workerInvocationContract: Phase10C0VS6WorkerInvocationContract = Object.freeze({
  schema: "phase10-c0v-worker-invocation-contract-v1",
  filename: "worker-invocations.jsonl",
  rowSchema: "phase10-c0v-worker-invocation-row-v1",
  exactFields: Object.freeze([
    "schema", "sequence", "observedAt", "monotonicOffsetNanoseconds", "event", "invocationId", "callableId",
    "negativeControlId", "invocationClass", "registeredWallSecondsMaximum", "terminalState",
  ]),
  eventValues: Object.freeze([
    "worker-started", "invocation-started", "invocation-finished", "worker-stopped",
  ]),
  eventStateTransitions: Object.freeze([]),
  writer: "parent-executor-from-structured-child-messages",
  sequenceRule: "zero-based-contiguous",
  timestampRule: "canonical-millisecond-utc-nondecreasing-within-attempt",
  monotonicClockRule: "parent-owned-zero-based-safe-integer-nanoseconds-nondecreasing",
  durationRule: "elapsed-nanoseconds-from-invocation-offset-difference-wall-seconds-derived-only-from-elapsed",
  rosterRule: "exact-protocol-leaf-roster-or-registered-prefix",
  embeddedDerivationRule: "attempt-or-verification-records-derived-from-raw-parent-events",
});

function workerInvocationAuthority(
  terminalState: "complete" | "registered-cap" = "complete",
): Phase10C0VS6ExecutableInvocationAuthority {
  return Object.freeze({
    invocationId: "inv-synthetic-production",
    callableId: "phase10-synthetic-producer",
    negativeControlId: null,
    invocationClass: "solver-production",
    registeredWallSecondsMaximum: 300,
    terminalState,
  });
}

function workerInvocationEvents(
  finishedAt = "2026-08-22T00:04:59.999Z",
  terminalState: "complete" | "registered-cap" | "infrastructure-failure" = "complete",
  monotonicElapsedNanoseconds =
    (Date.parse(finishedAt) - Date.parse("2026-08-22T00:00:00.000Z")) * 1_000_000,
): readonly Phase10C0VS6WorkerInvocationEventRecord[] {
  const invocation = workerInvocationAuthority(
    terminalState === "infrastructure-failure" ? "complete" : terminalState,
  );
  return Object.freeze([
    Object.freeze({
      schema: "phase10-c0v-worker-invocation-row-v1",
      sequence: 0,
      observedAt: "2026-08-22T00:00:00.000Z",
      monotonicOffsetNanoseconds: 0,
      event: "worker-started",
      invocationId: null,
      callableId: null,
      negativeControlId: null,
      invocationClass: null,
      registeredWallSecondsMaximum: null,
      terminalState: "running",
    }),
    Object.freeze({
      schema: "phase10-c0v-worker-invocation-row-v1",
      sequence: 1,
      observedAt: "2026-08-22T00:00:00.000Z",
      monotonicOffsetNanoseconds: 0,
      event: "invocation-started",
      invocationId: invocation.invocationId,
      callableId: invocation.callableId,
      negativeControlId: invocation.negativeControlId,
      invocationClass: invocation.invocationClass,
      registeredWallSecondsMaximum: invocation.registeredWallSecondsMaximum,
      terminalState: "running",
    }),
    Object.freeze({
      schema: "phase10-c0v-worker-invocation-row-v1",
      sequence: 2,
      observedAt: finishedAt,
      monotonicOffsetNanoseconds: monotonicElapsedNanoseconds,
      event: "invocation-finished",
      invocationId: invocation.invocationId,
      callableId: invocation.callableId,
      negativeControlId: invocation.negativeControlId,
      invocationClass: invocation.invocationClass,
      registeredWallSecondsMaximum: invocation.registeredWallSecondsMaximum,
      terminalState,
    }),
    Object.freeze({
      schema: "phase10-c0v-worker-invocation-row-v1",
      sequence: 3,
      observedAt: finishedAt,
      monotonicOffsetNanoseconds: monotonicElapsedNanoseconds,
      event: "worker-stopped",
      invocationId: null,
      callableId: null,
      negativeControlId: null,
      invocationClass: null,
      registeredWallSecondsMaximum: null,
      terminalState,
    }),
  ] satisfies readonly Phase10C0VS6WorkerInvocationEventRecord[]);
}

function workerPacketAuthority(
  terminalState: "complete" | "registered-cap" = "complete",
) {
  return Object.freeze({
    workerInvocationContract,
    executableInvocationRosters: Object.freeze([Object.freeze({
      tupleId: "synthetic-tuple",
      completionRule: terminalState === "registered-cap" ? "registered-cap-prefix" : "complete-roster",
      prefixOfTupleId: terminalState === "registered-cap" ? "synthetic-complete" : null,
      invocations: Object.freeze([workerInvocationAuthority(terminalState)]),
    })]),
  });
}

const exitStatusPacketAuthority = Object.freeze({
  packetId: "c0v-radial-produce" as const,
  registeredAttemptId: "c0v-radial-produce-20260822-v1",
  exitStatusContract: Object.freeze({
    schema: "phase10-c0v-exit-status-contract-v1" as const,
    filename: "exit-status.json" as const,
    rowSchema: "phase10-c0v-exit-status-v1" as const,
    exactFields: Object.freeze([
      "schema", "packetId", "attemptId", "workerProcessInvocationCount", "workerStarted",
      "exitCode", "signal", "classification",
    ]),
    classificationValues: Object.freeze([
      "no-worker", "complete", "registered-cap", "infrastructure-failure",
    ] as const),
    exitCodeRule: "no-worker-both-null-worker-exactly-one-code-or-signal" as const,
    signalRule: "raw-child-signal-never-route-selecting" as const,
    ownership: "parent-executor" as const,
  }),
});

interface RawCauseFixture {
  readonly root: string;
  readonly packet: Phase10C0VS6PacketProtocol;
  readonly packetProtocolIdentity: Phase10C0VS6ArtifactIdentity;
  readonly packetProtocolBytes: Uint8Array;
  readonly preflightBytes: Uint8Array;
  readonly attemptDirectory: string;
}

function copyBoundIdentity(root: string, artifact: Phase10C0VS6ArtifactIdentity | null): void {
  if (artifact === null || existsSync(resolve(root, artifact.path))) return;
  const bytes = new Uint8Array(readFileSync(resolve(process.cwd(), artifact.path)));
  expect(phase10C0VS6ArtifactIdentity(artifact.path, bytes)).toEqual(artifact);
  writeBytes(root, artifact.path, bytes);
}

function copyWorkingPath(
  root: string,
  path: string,
  replaceExisting = false,
): Phase10C0VS6ArtifactIdentity {
  const bytes = new Uint8Array(readFileSync(resolve(process.cwd(), path)));
  const destination = resolve(root, path);
  if (replaceExisting) {
    mkdirSync(resolve(destination, ".."), { recursive: true });
    writeFileSync(destination, bytes);
  } else if (!existsSync(destination)) {
    writeBytes(root, path, bytes);
  }
  return phase10C0VS6ArtifactIdentity(path, bytes);
}

function copyWorkingDirectory(root: string, directory: string, replaceExisting = false): void {
  for (const entry of readdirSync(resolve(process.cwd(), directory), { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) copyWorkingDirectory(root, path, replaceExisting);
    else if (entry.isFile()) copyWorkingPath(root, path, replaceExisting);
  }
}

function copyRecoveryPredecessorState(root: string): void {
  const authorityPath = "research/phase10-execution-v2/recovery-v5/recovery-authority.json";
  const authorityBytes = new Uint8Array(readFileSync(resolve(process.cwd(), authorityPath)));
  if (!existsSync(resolve(root, authorityPath))) writeBytes(root, authorityPath, authorityBytes);
  const authority = parsePhase10C0VS6RecoveryV5Authority(
    parsePhase10C0VS6PrettyJsonBytes(authorityBytes, "synthetic recovery-v5 authority"),
  );
  let predecessorAuthorityBytes: Uint8Array | null = null;
  for (const identity of [
    authority.predecessorRecoveryAuthority,
    authority.predecessorPacketCatalogue,
    authority.predecessorApProtocol,
  ]) {
    const frozenBytes = new Uint8Array(execFileSync(
      "git",
      ["show", `${authority.predecessorImplementationFreezeCommit}:${identity.path}`],
      { cwd: process.cwd(), windowsHide: true },
    ));
    expect(phase10C0VS6ArtifactIdentity(identity.path, frozenBytes)).toEqual(identity);
    if (!existsSync(resolve(root, identity.path))) writeBytes(root, identity.path, frozenBytes);
    if (identity.path === authority.predecessorRecoveryAuthority.path) {
      predecessorAuthorityBytes = frozenBytes;
    }
  }
  if (predecessorAuthorityBytes === null) {
    throw new Error("synthetic recovery-v5 authority lacks its recovery-v4 predecessor bytes");
  }
  const predecessorAuthority = parsePhase10C0VS6RecoveryV4Authority(
    parsePhase10C0VS6PrettyJsonBytes(
      predecessorAuthorityBytes,
      "synthetic recovery-v4 authority",
    ),
  );
  const earlierRecoveryAuthorityIdentity = predecessorAuthority.predecessorRecoveryAuthority;
  const earlierRecoveryAuthorityBytes = new Uint8Array(execFileSync(
    "git",
    ["show", `${predecessorAuthority.predecessorImplementationFreezeCommit}:${earlierRecoveryAuthorityIdentity.path}`],
    { cwd: process.cwd(), windowsHide: true },
  ));
  expect(phase10C0VS6ArtifactIdentity(earlierRecoveryAuthorityIdentity.path, earlierRecoveryAuthorityBytes))
    .toEqual(earlierRecoveryAuthorityIdentity);
  if (!existsSync(resolve(root, earlierRecoveryAuthorityIdentity.path))) {
    writeBytes(root, earlierRecoveryAuthorityIdentity.path, earlierRecoveryAuthorityBytes);
  }
  const earlierRecoveryAuthority = parsePhase10C0VS6RecoveryV3Authority(
    parsePhase10C0VS6PrettyJsonBytes(
      earlierRecoveryAuthorityBytes,
      "synthetic recovery-v3 authority",
    ),
  );
  const secondEarlierAuthorityIdentity = earlierRecoveryAuthority.predecessorRecoveryAuthority;
  const secondEarlierAuthorityBytes = new Uint8Array(execFileSync(
    "git",
    ["show", `${earlierRecoveryAuthority.predecessorImplementationFreezeCommit}:${secondEarlierAuthorityIdentity.path}`],
    { cwd: process.cwd(), windowsHide: true },
  ));
  expect(phase10C0VS6ArtifactIdentity(secondEarlierAuthorityIdentity.path, secondEarlierAuthorityBytes))
    .toEqual(secondEarlierAuthorityIdentity);
  if (!existsSync(resolve(root, secondEarlierAuthorityIdentity.path))) {
    writeBytes(root, secondEarlierAuthorityIdentity.path, secondEarlierAuthorityBytes);
  }
  const secondEarlierAuthority = parsePhase10C0VS6RecoveryV2Authority(
    parsePhase10C0VS6PrettyJsonBytes(
      secondEarlierAuthorityBytes,
      "synthetic recovery-v2 authority",
    ),
  );
  const originalAuthorityIdentity = secondEarlierAuthority.predecessorRecoveryAuthority;
  const originalAuthorityBytes = new Uint8Array(execFileSync(
    "git",
    ["show", `${secondEarlierAuthority.predecessorImplementationFreezeCommit}:${originalAuthorityIdentity.path}`],
    { cwd: process.cwd(), windowsHide: true },
  ));
  expect(phase10C0VS6ArtifactIdentity(originalAuthorityIdentity.path, originalAuthorityBytes))
    .toEqual(originalAuthorityIdentity);
  if (!existsSync(resolve(root, originalAuthorityIdentity.path))) {
    writeBytes(root, originalAuthorityIdentity.path, originalAuthorityBytes);
  }
  for (const lock of authority.predecessorLockArtifacts) {
    const lockBytes = phase10C0VS6PrettyJsonBytes(lock.parsedContent);
    expect(phase10C0VS6ArtifactIdentity(lock.path, lockBytes)).toMatchObject({
      path: lock.path,
      byteLength: lock.byteLength,
      sha256: lock.sha256,
    });
    if (!existsSync(resolve(root, lock.path))) writeBytes(root, lock.path, lockBytes);
  }
  for (const artifact of [
    ...authority.predecessorAttemptArtifacts,
    ...authority.predecessorPublishedArtifacts,
  ]) {
    const artifactBytes = new Uint8Array(readFileSync(resolve(process.cwd(), artifact.path)));
    expect(phase10C0VS6ArtifactIdentity(artifact.path, artifactBytes)).toEqual(artifact);
    if (!existsSync(resolve(root, artifact.path))) writeBytes(root, artifact.path, artifactBytes);
  }
  copyWorkingPath(root, "evidence/MANIFEST.json", true);
}

function resolveSyntheticCallableRegistries(root: string): void {
  const cataloguePath = "research/phase10-execution-v2/recovery-v5/packet-catalogue.json";
  const catalogue = parsePhase10C0VS6PacketCatalogue(
    parsePhase10C0VS6PrettyJsonBytes(
      new Uint8Array(readFileSync(resolve(root, cataloguePath))),
      "synthetic resolved catalogue",
    ),
  );
  for (const entry of catalogue.packets) {
    const registryValue = JSON.parse(readFileSync(resolve(root, entry.callableRegistryPath), "utf8")) as {
      callables: Array<{
        resolution: string;
        modulePath: string;
        identity: { byteLength: number; sha256: string } | null;
      }>;
    };
    for (const callable of registryValue.callables) {
      const moduleBytes = new Uint8Array(readFileSync(resolve(root, callable.modulePath)));
      const moduleIdentity = phase10C0VS6ArtifactIdentity(callable.modulePath, moduleBytes);
      callable.resolution = "resolved";
      callable.identity = Object.freeze({
        byteLength: moduleIdentity.byteLength,
        sha256: moduleIdentity.sha256,
      });
    }
    const registryBytes = phase10C0VS6PrettyJsonBytes(registryValue);
    writeFileSync(resolve(root, entry.callableRegistryPath), registryBytes);
    const registryIdentity = phase10C0VS6ArtifactIdentity(entry.callableRegistryPath, registryBytes);
    const protocolValue = JSON.parse(readFileSync(resolve(root, entry.protocolPath), "utf8")) as {
      bindings: { callableRegistry: Phase10C0VS6ArtifactIdentity };
    };
    protocolValue.bindings.callableRegistry = registryIdentity;
    writeFileSync(resolve(root, entry.protocolPath), phase10C0VS6PrettyJsonBytes(protocolValue));
  }
}

function prepareApPreFreezeAuthority(root: string, resolveRegistries = false): Readonly<{
  readonly head: string;
  readonly evidenceManifest: Phase10C0VS6ArtifactIdentity;
}> {
  const recoveryV5AuthorityPath =
    "research/phase10-execution-v2/recovery-v5/recovery-authority.json";
  const sourceBase = resolveRegistries
    ? git(process.cwd(), [
      "log", "-1", "--format=%H", "--diff-filter=A", "--", recoveryV5AuthorityPath,
    ])
    : "7ff83eaf9312ebc3bf23d6f5ef5a56d6f65a912a";
  git(root, ["init"]);
  git(root, ["config", "user.email", "phase10@example.invalid"]);
  git(root, ["config", "user.name", "Phase 10 Synthetic"]);
  git(root, ["remote", "add", "source-worktree", process.cwd()]);
  git(root, ["fetch", "--no-tags", "source-worktree", sourceBase]);
  git(root, ["checkout", "-b", "phase10/evidence-verification", sourceBase]);
  for (const path of [
    ".gitattributes", ".gitignore", "app/.gitattributes", "core/.gitattributes",
    "core/src/.gitattributes", "research/.gitattributes", "runner/.gitattributes",
    "runner/src/.gitattributes", "solver-cpu/.gitattributes", "solver-cpu/src/.gitattributes",
    "solver-gpu/.gitattributes", "research/phase10-execution-v2/README.md",
    "package.json", "package-lock.json", "tsconfig.json", "tsconfig.base.json",
    "app/package.json", "core/package.json", "runner/package.json", "solver-cpu/package.json",
    "solver-gpu/package.json", "node_modules/typescript/package.json",
    "node_modules/typescript/lib/typescript.js",
  ]) copyWorkingPath(root, path, true);
  for (const directory of ["core/src", "runner/src", "solver-cpu/src", "solver-gpu/src"]) {
    copyWorkingDirectory(root, directory, true);
  }
  copyRecoveryPredecessorState(root);
  const evidenceManifestPath = "evidence/MANIFEST.json";
  if (resolveRegistries) {
    git(root, ["checkout", sourceBase, "--", evidenceManifestPath]);
  }
  const evidenceManifestBytes = new Uint8Array(
    readFileSync(resolve(root, evidenceManifestPath)),
  );
  const evidenceManifest = phase10C0VS6ArtifactIdentity(
    evidenceManifestPath,
    evidenceManifestBytes,
  );
  const cataloguePath = "research/phase10-execution-v2/recovery-v5/packet-catalogue.json";
  const catalogueBytes = new Uint8Array(readFileSync(resolve(process.cwd(), cataloguePath)));
  const catalogue = parsePhase10C0VS6PacketCatalogue(
    parsePhase10C0VS6PrettyJsonBytes(catalogueBytes, "A-P pre-freeze catalogue"),
  );
  for (const entry of catalogue.packets) {
    const protocolBytes = new Uint8Array(readFileSync(resolve(process.cwd(), entry.protocolPath)));
    copyWorkingPath(root, entry.protocolPath);
    copyWorkingPath(root, entry.callableRegistryPath);
    const protocol = parsePhase10C0VS6PacketProtocol(
      parsePhase10C0VS6PrettyJsonBytes(protocolBytes, `${entry.packetId} pre-freeze protocol`),
    );
    for (const artifact of [
      protocol.bindings.matrix,
      protocol.bindings.packetCatalogue,
      protocol.bindings.recoveryAuthority ?? null,
      protocol.bindings.callableRegistry,
      protocol.bindings.predecessorSchemaRegistry,
      protocol.bindings.predecessorSchemaContracts,
      protocol.bindings.successorSchemaRegistry,
      protocol.bindings.successorSchemaContracts,
      protocol.bindings.scienceProtocol,
      protocol.bindings.referenceOrRefusal,
      ...protocol.bindings.originalApEvidence,
    ]) copyBoundIdentity(root, artifact);
  }
  if (resolveRegistries) resolveSyntheticCallableRegistries(root);
  git(root, ["add", "-f", "."]);
  git(root, ["commit", "-m", "synthetic pre-freeze authority"]);
  return Object.freeze({ head: git(root, ["rev-parse", "HEAD"]), evidenceManifest });
}

function rawCauseFixture(
  packetId: "a-p-c0v-s6" | "c0v-moving-produce" | "c0v-radial-produce" | "c0v-static-produce",
  preflightDisposition: "pass" | "prelaunch-resource-refusal" = "pass",
  resolveRegistries = false,
): RawCauseFixture {
  const root = temporaryRoot(`raw-cause-${packetId}-${preflightDisposition}`);
  const earlyApPreFreeze = packetId === "a-p-c0v-s6"
    ? prepareApPreFreezeAuthority(root, resolveRegistries)
    : null;
  const packetPath = `research/phase10-execution-v2/recovery-v5/packets/${packetId}/protocol.json`;
  let packetProtocolBytes = new Uint8Array(readFileSync(resolve(process.cwd(), packetPath)));
  let packetProtocolIdentity = phase10C0VS6ArtifactIdentity(packetPath, packetProtocolBytes);
  let packet = parsePhase10C0VS6PacketProtocol(
    parsePhase10C0VS6PrettyJsonBytes(packetProtocolBytes, `${packetId} raw-cause protocol`),
  );
  if (!existsSync(resolve(root, packetPath))) writeBytes(root, packetPath, packetProtocolBytes);
  for (const artifact of [
    packet.bindings.packetCatalogue,
    packet.bindings.recoveryAuthority ?? null,
    packet.bindings.matrix,
    packet.bindings.callableRegistry,
    packet.bindings.successorSchemaRegistry,
    packet.bindings.successorSchemaContracts,
    packet.bindings.scienceProtocol,
    packet.bindings.referenceOrRefusal,
  ]) copyBoundIdentity(root, artifact);

  const attemptDirectory = `${packet.paths.attemptRoot}/${packet.registeredAttemptId}`;
  const packageElapsedNanosecondsBeforeAttempt = 391_158_252_000;
  const projectedPackageElapsedNanosecondsAfterAttempt =
    packageElapsedNanosecondsBeforeAttempt +
    packet.resources.currentPacketRegisteredElapsedNanosecondsMaximum;
  const packageProcessHoursBeforeAttempt =
    packageElapsedNanosecondsBeforeAttempt / 3_600_000_000_000;
  const projectedPackageProcessHoursAfterAttempt =
    projectedPackageElapsedNanosecondsAfterAttempt / 3_600_000_000_000;
  const packageRetainedBytesBeforeAttempt = packet.resources.packageStorageBaselineBytes;
  const projectedPackageBytesAfterAttempt = packageRetainedBytesBeforeAttempt +
    packet.resources.projectedScratchBytes + packet.resources.projectedPublicationBytes;
  const passingFreeBytes = Math.max(
    packet.resources.minimumFreeBytes,
    packet.resources.projectedScratchBytes + packet.resources.projectedPublicationBytes,
  );
  const observedFreeBytes = preflightDisposition === "prelaunch-resource-refusal"
    ? packet.resources.minimumFreeBytes - 1
    : passingFreeBytes;
  const resourceValues: Readonly<Record<string, unknown>> = Object.freeze({
    ...packet.resources,
    packageElapsedNanosecondsBeforeAttempt,
    projectedPackageElapsedNanosecondsAfterAttempt,
    packageProcessHoursBeforeAttempt,
    projectedPackageProcessHoursAfterAttempt,
    packageRetainedBytesBeforeAttempt,
    projectedPackageBytesAfterAttempt,
    observedFreeBytes,
    nasOrNetworkAccess: false,
  });
  const resources = Object.fromEntries(packet.preflightObservedContract.resourceFieldOrder.map((field) => {
    if (!(field in resourceValues)) throw new Error(`missing synthetic resource field ${field}`);
    return [field, resourceValues[field]];
  }));
  const dependencyVariants = phase10C0VS6DependencyArtifactRosterVariants(packet);
  if (dependencyVariants.length !== 1) {
    throw new Error(`${packetId} synthetic raw-cause fixture needs one dependency roster variant`);
  }
  const dependencyArtifacts = dependencyVariants[0]!
    .map((entry) => identity(entry.artifactPath))
    .sort((left, right) => codePointCompare(left.path, right.path));
  const verificationPaths = packet.paths.allowedPublicationPaths.filter((path) =>
    path.endsWith(`/${packet.verification.filename}`));
  const runCommand = packet.commandTemplates.find((entry) => entry.commandId === "run");
  if (verificationPaths.length !== 1 || runCommand === undefined) {
    throw new Error(`${packetId} lacks exact verification/run authority`);
  }
  const selectedRefusalSubroute = preflightDisposition === "prelaunch-resource-refusal"
    ? packet.terminalSubroutes.find((entry) => entry.dispositionCode === "prelaunch-resource-refusal")
    : undefined;
  if (preflightDisposition === "prelaunch-resource-refusal" && selectedRefusalSubroute === undefined) {
    throw new Error(`${packetId} lacks its prelaunch refusal subroute`);
  }
  const conditionId = `cond-${packet.packetId}-prelaunch-free-space`;
  const condition = packet.classificationConditions.find((entry) => entry.conditionId === conditionId);
  if (preflightDisposition === "prelaunch-resource-refusal" && condition === undefined) {
    throw new Error(`${packetId} lacks its free-space refusal condition`);
  }
  const inlineEvidenceId = `evidence-${conditionId}-inline`;
  const refusalEvidence = preflightDisposition === "prelaunch-resource-refusal"
    ? [{
      evidenceId: inlineEvidenceId,
      evidenceRole: "classification-input",
      retentionClass: "inline-observation",
      artifact: null,
      inlineObservationPath: "observed.resources.observedFreeBytes",
    }, {
      evidenceId: "evidence-packet-protocol",
      evidenceRole: "packet-protocol",
      retentionClass: "tracked-authority",
      artifact: packetProtocolIdentity,
      inlineObservationPath: null,
    }]
    : null;
  const refusalCandidate = preflightDisposition === "prelaunch-resource-refusal"
    ? {
      dispositionCode: "prelaunch-resource-refusal",
      observation: {
        conditionId,
        kind: condition!.kind,
        comparator: condition!.comparator,
        registeredValue: condition!.registeredValue,
        observedValue: observedFreeBytes,
        unit: condition!.unit,
        routeConditionMatched: true,
        preconditionPassed: false,
        evidenceIds: [inlineEvidenceId, "evidence-packet-protocol"],
      },
      failedArtifact: null,
      evidence: refusalEvidence,
      solverLaunched: false,
      verdict: "refusal",
    }
    : null;
  const apPreFreeze = earlyApPreFreeze;
  if (resolveRegistries) {
    packetProtocolBytes = new Uint8Array(readFileSync(resolve(root, packetPath)));
    packetProtocolIdentity = phase10C0VS6ArtifactIdentity(packetPath, packetProtocolBytes);
    packet = parsePhase10C0VS6PacketProtocol(
      parsePhase10C0VS6PrettyJsonBytes(packetProtocolBytes, `${packetId} resolved raw-cause protocol`),
    );
  }
  const observedValues: Readonly<Record<string, unknown>> = Object.freeze({
    launchClass: packet.preflightObservedContract.launchClass,
    executionMode: packet.executionMode,
    selectedRouteId: packet.selectedRouteId,
    branch: packet.ancestryAuthority.launchBranch,
    head: apPreFreeze?.head ?? "2".repeat(40),
    runtime: packet.resources.requiredRuntime,
    command: runCommand.command,
    cwd: ".",
    repositoryBundleRoot: ".",
    compositeMatrix: packet.bindings.matrix,
    packetCatalogue: packet.bindings.packetCatalogue,
    successorSchemaRegistry: packet.bindings.successorSchemaRegistry,
    evidenceManifest: apPreFreeze?.evidenceManifest ?? identity("evidence/MANIFEST.json"),
    scienceProtocol: packet.bindings.scienceProtocol,
    referenceOrRefusal: packet.bindings.referenceOrRefusal,
    packetProtocol: packetProtocolIdentity,
    callableRegistry: packet.bindings.callableRegistry,
    codeFreeze: {
      commit: "1".repeat(40),
      artifacts: [identity("runner/src/synthetic-freeze.ts")],
    },
    registeredAttemptRoot: packet.paths.attemptRoot,
    attemptDirectory,
    candidateDirectory: `${attemptDirectory}/candidate`,
    stdoutPath: `${attemptDirectory}/stdout.log`,
    stderrPath: `${attemptDirectory}/stderr.log`,
    exitStatusPath: `${attemptDirectory}/exit-status.json`,
    packageLockPath: packet.paths.packageLockPath,
    lockPath: packet.paths.lockPath,
    finalPreflightReceiptPath: packet.paths.preflightReceiptPath,
    finalTerminalReceiptPath: packet.paths.terminalReceiptPath,
    verificationPaths,
    dependencyPacketIds: packet.boundDependencyPacketIds,
    dependencyArtifacts,
    resources,
    ancestry: {
      repositoryClean: true,
      headMatchesLaunch: true,
      requiredCommitsAreAncestors: true,
      boundArtifactsMatch: true,
      codeFreezeMatches: true,
      verdict: "pass",
      errors: [],
    },
  });
  const observed = Object.fromEntries(packet.preflightObservedContract.observedFieldOrder.map((field) => {
    if (!(field in observedValues)) throw new Error(`missing synthetic observed field ${field}`);
    return [field, observedValues[field]];
  }));
  const outputIds = selectedRefusalSubroute?.requiredOutputIds ?? packet.registeredOutputIds;
  const checkIds = selectedRefusalSubroute?.requiredCheckIds ?? packet.registeredCheckIds;
  const negativeControlIds = selectedRefusalSubroute?.requiredNegativeControlIds ??
    packet.registeredNegativeControlIds;
  const preflightBytes = phase10C0VS6PrettyJsonBytes({
    schema: "phase10-c0v-s6-preflight-receipt-v2",
    receiptId: `phase10-${packet.packetId}-${packet.registeredAttemptId}-preflight-v2`,
    matrixId: packet.matrixId,
    protocolId: packet.protocolId,
    registryId: packet.registryId,
    packetId: packet.packetId,
    attemptId: packet.registeredAttemptId,
    stage: "run",
    observed,
    outputIds,
    checkIds,
    negativeControlIds,
    callableIds: ["synthetic-callable"],
    selectedBranches: {
      selectedRouteId: packet.selectedRouteId,
      s5ArtifactDisposition: packet.s5ArtifactDisposition,
    },
    refusalCandidate,
    verdict: preflightDisposition === "pass" ? "pass" : "refusal",
    reasons: preflightDisposition === "pass" ? [] : [conditionId],
  });
  writeBytes(root, packet.paths.preflightReceiptPath, preflightBytes);
  return Object.freeze({
    root,
    packet,
    packetProtocolIdentity,
    packetProtocolBytes,
    preflightBytes,
    attemptDirectory,
  });
}

function rawCauseInput(fixture: RawCauseFixture) {
  return Object.freeze({
    repositoryRoot: fixture.root,
    packetProtocolIdentity: fixture.packetProtocolIdentity,
    packetProtocolBytes: fixture.packetProtocolBytes,
    preflightBytes: fixture.preflightBytes,
  });
}

function historicalApFreezeFixture(): Readonly<{
  readonly fixture: RawCauseFixture;
  readonly input: ReturnType<typeof rawCauseInput>;
  readonly launchHead: string;
  readonly currentHead: string;
  readonly freezeReceiptPath: string;
  readonly freezeReceiptBytes: Uint8Array;
  readonly frozenSourcePath: string;
}> {
  const fixture = rawCauseFixture("a-p-c0v-s6", "pass", true);
  const initialInput = rawCauseInput(fixture);
  const derivation = derivePhase10C0VS6ImplementationFreeze(initialInput);
  const registry = parsePhase10C0VS6CallableRegistry(
    parsePhase10C0VS6PrettyJsonBytes(
      new Uint8Array(readFileSync(resolve(fixture.root, fixture.packet.bindings.callableRegistry.path))),
      "historical A-P callable registry",
    ),
  );
  const preflightValue = JSON.parse(new TextDecoder().decode(fixture.preflightBytes)) as {
    observed: { codeFreeze: unknown };
    callableIds: string[];
  };
  preflightValue.observed.codeFreeze = {
    commit: derivation.implementationFreezeCommit,
    artifacts: derivation.artifacts,
  };
  preflightValue.callableIds = registry.callables
    .map((entry) => entry.callableId)
    .sort(codePointCompare);
  const finalPreflightBytes = writePhase10C0VS6PreflightReceipt(
    preflightValue,
    fixture.packet,
    fixture.packetProtocolIdentity,
  );
  writeFileSync(resolve(fixture.root, fixture.packet.paths.preflightReceiptPath), finalPreflightBytes);
  const preflightIdentity = phase10C0VS6ArtifactIdentity(
    fixture.packet.paths.preflightReceiptPath,
    finalPreflightBytes,
  );
  const freezeAuthority = Object.freeze({
    protocol: fixture.packetProtocolIdentity,
    preflight: preflightIdentity,
    implementationFreezeCommit: derivation.implementationFreezeCommit,
    launchHead: derivation.launchHead,
    launchBranch: derivation.launchBranch,
    anchorPaths: derivation.anchorPaths,
    artifacts: derivation.artifacts,
    parserRuntimeArtifacts: derivation.parserRuntimeArtifacts,
    artifactFailure: derivation.artifactFailure,
  });
  const invokedCheckIds: string[] = [];
  for (const roster of fixture.packet.terminalCandidateContract.decisionRosters) {
    for (const decision of roster.decisions) {
      if (decision.decisionRole !== "freeze") continue;
      for (const checkId of decision.invokedCheckIds) {
        if (!invokedCheckIds.includes(checkId)) invokedCheckIds.push(checkId);
      }
    }
  }
  const freezeReceiptBytes = writePhase10C0VS6FreezeEvaluationReceipt({
    schema: fixture.packet.freezeEvaluationContract.rowSchema,
    evaluationId: `freeze-${fixture.packet.packetId}-${fixture.packet.registeredAttemptId}-v1`,
    packetId: fixture.packet.packetId,
    attemptId: fixture.packet.registeredAttemptId,
    protocol: fixture.packetProtocolIdentity,
    preflight: preflightIdentity,
    implementationFreezeCommit: derivation.implementationFreezeCommit,
    launchHead: derivation.launchHead,
    launchBranch: derivation.launchBranch,
    anchorPaths: derivation.anchorPaths,
    artifacts: derivation.artifacts,
    parserRuntimeArtifacts: derivation.parserRuntimeArtifacts,
    artifactFailure: derivation.artifactFailure,
    invokedCheckIds,
    verdict: "pass",
    reasons: [],
  }, fixture.packet, freezeAuthority);
  const freezeReceiptPath = `${fixture.attemptDirectory}/${fixture.packet.freezeEvaluationContract.filename}`;
  writeBytes(fixture.root, freezeReceiptPath, freezeReceiptBytes);
  git(fixture.root, ["add", "-f", fixture.packet.paths.preflightReceiptPath]);
  git(fixture.root, ["commit", "-m", "synthetic later retained preflight"]);
  const currentHead = git(fixture.root, ["rev-parse", "HEAD"]);
  return Object.freeze({
    fixture,
    input: Object.freeze({
      repositoryRoot: fixture.root,
      packetProtocolIdentity: fixture.packetProtocolIdentity,
      packetProtocolBytes: fixture.packetProtocolBytes,
      preflightBytes: finalPreflightBytes,
    }),
    launchHead: derivation.launchHead,
    currentHead,
    freezeReceiptPath,
    freezeReceiptBytes,
    frozenSourcePath: "runner/src/phase10-c0v-s6-ap.ts",
  });
}

function writeRawExit(
  fixture: RawCauseFixture,
  classification: "no-worker" | "complete" | "registered-cap",
): void {
  const worker = classification !== "no-worker";
  writeBytes(fixture.root, `${fixture.attemptDirectory}/exit-status.json`, phase10C0VS6PrettyJsonBytes({
    schema: fixture.packet.exitStatusContract.rowSchema,
    packetId: fixture.packet.packetId,
    attemptId: fixture.packet.registeredAttemptId,
    workerProcessInvocationCount: worker ? 1 : 0,
    workerStarted: worker,
    exitCode: classification === "complete" ? 0 : null,
    signal: classification === "registered-cap" ? "SIGTERM" : null,
    classification,
  }));
}

function workerEventsForSubroute(
  packet: Phase10C0VS6PacketProtocol,
  subrouteId: string,
  capOverrunNanoseconds = 1,
  completeElapsedOverrides: ReadonlyMap<string, number> = new Map(),
): readonly Phase10C0VS6WorkerInvocationEventRecord[] {
  const rosters = packet.executableInvocationRosters.filter((entry) => entry.tupleId === subrouteId);
  if (rosters.length !== 1) throw new Error(`${subrouteId} does not resolve one worker roster`);
  const events: Phase10C0VS6WorkerInvocationEventRecord[] = [];
  let epoch = Date.parse("2020-01-01T00:00:00.000Z");
  let monotonicOffsetNanoseconds = 0;
  const instant = () => new Date(epoch).toISOString();
  events.push({
    schema: "phase10-c0v-worker-invocation-row-v1", sequence: 0, observedAt: instant(),
    monotonicOffsetNanoseconds,
    event: "worker-started", invocationId: null, callableId: null, negativeControlId: null,
    invocationClass: null, registeredWallSecondsMaximum: null, terminalState: "running",
  });
  for (const invocation of rosters[0]!.invocations) {
    events.push({
      schema: "phase10-c0v-worker-invocation-row-v1", sequence: events.length, observedAt: instant(),
      monotonicOffsetNanoseconds,
      event: "invocation-started", ...invocation, terminalState: "running",
    });
    const elapsedNanoseconds = invocation.terminalState === "registered-cap"
      ? invocation.registeredWallSecondsMaximum * 1_000_000_000 + capOverrunNanoseconds
      : completeElapsedOverrides.get(invocation.invocationId) ?? 1_000_000;
    epoch += Math.floor(elapsedNanoseconds / 1_000_000);
    monotonicOffsetNanoseconds += elapsedNanoseconds;
    events.push({
      schema: "phase10-c0v-worker-invocation-row-v1", sequence: events.length, observedAt: instant(),
      monotonicOffsetNanoseconds,
      event: "invocation-finished", ...invocation,
    });
  }
  const terminalState = rosters[0]!.invocations.at(-1)?.terminalState ?? "complete";
  events.push({
    schema: "phase10-c0v-worker-invocation-row-v1", sequence: events.length, observedAt: instant(),
    monotonicOffsetNanoseconds,
    event: "worker-stopped", invocationId: null, callableId: null, negativeControlId: null,
    invocationClass: null, registeredWallSecondsMaximum: null, terminalState,
  });
  return Object.freeze(events.map((entry) => Object.freeze(entry)));
}

function writeRawWorkerStream(
  fixture: RawCauseFixture,
  subrouteId: string,
  capOverrunNanoseconds = 1,
): void {
  writeBytes(
    fixture.root,
    `${fixture.attemptDirectory}/${fixture.packet.workerInvocationContract.filename}`,
    phase10C0VS6WorkerInvocationEventBytes(
      workerEventsForSubroute(fixture.packet, subrouteId, capOverrunNanoseconds),
      fixture.packet.workerInvocationContract,
    ),
  );
  if (fixture.packet.workerProgressContract !== null) {
    write(fixture.root, `${fixture.attemptDirectory}/${fixture.packet.workerProgressContract.filename}`, "{}\n");
  }
}

function causeReceiptValue(
  fixture: RawCauseFixture,
  evaluation: ReturnType<typeof independentlyEvaluatePhase10C0VS6RefusalCause>,
) {
  const subroute = fixture.packet.terminalSubroutes.find((entry) =>
    entry.subrouteId === evaluation.selectedSubrouteId);
  if (subroute === undefined) throw new Error("raw cause selected an absent subroute");
  return {
    schema: fixture.packet.causeEvaluationContract.rowSchema,
    evaluationId: `cause-${fixture.packet.packetId}-${fixture.packet.registeredAttemptId}-${subroute.subrouteId}-v1`,
    packetId: fixture.packet.packetId,
    attemptId: fixture.packet.registeredAttemptId,
    selectedSubrouteId: subroute.subrouteId,
    dispositionCode: subroute.dispositionCode,
    protocol: evaluation.protocol,
    preflight: evaluation.preflight,
    exitStatus: evaluation.exitStatus,
    workerInvocations: evaluation.workerInvocations,
    classificationConditionIds: subroute.classificationConditionIds,
    observations: evaluation.observations,
    evidence: evaluation.evidence,
    evaluatorCallableId: evaluation.evaluatorCallableId,
    invokedCheckIds: evaluation.invokedCheckIds,
    verdict: evaluation.verdict,
    reasons: evaluation.reasons,
  };
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    const parent = resolve(process.cwd(), "out", "phase10-c0v-s6-synthetic-tests");
    const displacement = relative(parent, root);
    if (displacement === "" || displacement.startsWith("..")) {
      throw new Error(`unsafe synthetic cleanup target ${root}`);
    }
    rmSync(root, { recursive: true, force: true });
  }
});

describe("Phase 10 C0V S6 filesystem and closure refusal boundary", () => {
  it("reopens the exact five-generation stop before recovery-v5 lock acquisition", () => {
    const rootPath = temporaryRoot("recovery-predecessor-audit");
    copyRecoveryPredecessorState(rootPath);
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    const state = phase10C0VS6AssertRecoveryPredecessorState(root, "initial-ap");
    expect(state.authority.predecessorImplementationFreezeCommit)
      .toBe("7ff83eaf9312ebc3bf23d6f5ef5a56d6f65a912a");
    expect(state.predecessorLockIdentities).toHaveLength(10);
    expect(state.predecessorAttemptIdentities).toHaveLength(29);
    expect(state.predecessorPublishedIdentities).toHaveLength(4);
    expect(state.checkedAbsentPaths).toHaveLength(57);
    expect(state.checkedAbsentPaths).toEqual(state.authority.predecessorGovernedAbsentPaths);

    mkdirSync(resolve(rootPath, state.authority.predecessorGovernedAbsentPaths[0]!), { recursive: true });
    expect(() => phase10C0VS6AssertRecoveryPredecessorState(root, "initial-ap"))
      .toThrow(/predecessor state unexpectedly materialized/u);
  });

  it("rejects total-preserving attempt-root category shifts across exact scratch ceilings", () => {
    const root = temporaryRoot("projected-candidate-ceiling");
    const cataloguePath = "research/phase10-execution-v2/recovery-v5/packet-catalogue.json";
    const protocolPath = "research/phase10-execution-v2/recovery-v5/packets/c0v-moving-produce/protocol.json";
    const catalogue = parsePhase10C0VS6PacketCatalogue(parsePhase10C0VS6PrettyJsonBytes(
      new Uint8Array(readFileSync(resolve(process.cwd(), cataloguePath))),
      "attempt-root ceiling catalogue",
    ));
    const packet = parsePhase10C0VS6PacketProtocol(parsePhase10C0VS6PrettyJsonBytes(
      new Uint8Array(readFileSync(resolve(process.cwd(), protocolPath))),
      "attempt-root ceiling protocol",
    ));
    const limits = catalogue.packets.find((entry) => entry.packetId === packet.packetId);
    expect(limits).toBeDefined();
    const stdoutPath = "out/synthetic-attempt/stdout.log";
    const stderrPath = "out/synthetic-attempt/stderr.log";
    const otherPath = "out/synthetic-attempt/terminal-success-candidate.json";
    const retained = (
      stdoutBytes: number,
      otherBytes: number,
    ): readonly Phase10C0VS6ArtifactIdentity[] => Object.freeze([
      Object.freeze({ path: stdoutPath, byteLength: stdoutBytes, sha256: "0".repeat(64) }),
      Object.freeze({
        path: stderrPath,
        byteLength: catalogue.workerTransportContract.maximumStderrBytes,
        sha256: "1".repeat(64),
      }),
      Object.freeze({ path: otherPath, byteLength: otherBytes, sha256: "2".repeat(64) }),
    ]);

    expect(() => phase10C0VS6ValidateAttemptRootByteCeilings(
      catalogue,
      packet,
      stdoutPath,
      stderrPath,
      retained(limits!.maximumStdoutBytes, limits!.maximumOtherAttemptRootBytes),
    )).not.toThrow();

    expect(() => phase10C0VS6ValidateAttemptRootByteCeilings(
      catalogue,
      packet,
      stdoutPath,
      stderrPath,
      retained(limits!.maximumStdoutBytes + 1, limits!.maximumOtherAttemptRootBytes - 1),
    )).toThrow(/stdout exceeds/u);

    expect(() => phase10C0VS6ValidateAttemptRootByteCeilings(
      catalogue,
      packet,
      stdoutPath,
      stderrPath,
      retained(limits!.maximumStdoutBytes - 1, limits!.maximumOtherAttemptRootBytes + 1),
    )).toThrow(/other attempt-root bytes exceed/u);
    expect(existsSync(resolve(root, otherPath))).toBe(false);
  });

  it("exports the exact registry-bound generic refusal evaluator and caller", () => {
    expect(typeof independentlyEvaluatePhase10C0VS6RefusalCause).toBe("function");
    expect(typeof phase10C0VS6RefusalCheckCaller).toBe("function");
  });

  it("keeps canonical retained-preflight resource fields idempotent in protocol order", () => {
    const fixture = rawCauseFixture("c0v-moving-produce", "pass");
    const first = writePhase10C0VS6PreflightReceipt(
      JSON.parse(new TextDecoder().decode(fixture.preflightBytes)),
      fixture.packet,
      fixture.packetProtocolIdentity,
    );
    const second = writePhase10C0VS6PreflightReceipt(
      JSON.parse(new TextDecoder().decode(first)),
      fixture.packet,
      fixture.packetProtocolIdentity,
    );
    expect(second).toEqual(first);
  });

  it("reopens a retained freeze after a later evidence commit but rejects frozen-source drift", () => {
    const historical = historicalApFreezeFixture();
    expect(historical.currentHead).not.toBe(historical.launchHead);
    const projection = independentlyReopenPhase10C0VS6HistoricalFreeze(historical.input);
    expect(projection.retained.launchHead).toBe(historical.launchHead);
    expect(projection.receipt.launchHead).toBe(historical.launchHead);
    expect(projection.receiptIdentity).toEqual(phase10C0VS6ArtifactIdentity(
      historical.freezeReceiptPath,
      historical.freezeReceiptBytes,
    ));

    const frozenSource = resolve(historical.fixture.root, historical.frozenSourcePath);
    const original = new Uint8Array(readFileSync(frozenSource));
    const changed = new Uint8Array(original.byteLength + 1);
    changed.set(original);
    changed[changed.byteLength - 1] = 0x0a;
    writeFileSync(frozenSource, changed);
    expect(() => independentlyReopenPhase10C0VS6HistoricalFreeze(historical.input))
      .toThrow(/identity|differs|closure/u);
  }, 600_000);

  it("requires the live run-lock token and stays write-free when retained freeze provenance differs", async () => {
    const fixture = rawCauseFixture("a-p-c0v-s6", "prelaunch-resource-refusal");
    const refusalSubroute = fixture.packet.terminalSubroutes.find((entry) =>
      entry.dispositionCode === "prelaunch-resource-refusal");
    expect(refusalSubroute).toBeDefined();
    const candidateFilename = fixture.packet.terminalCandidateContract.decisionRosters.find((entry) =>
      entry.subrouteId === refusalSubroute!.subrouteId)!.candidateFilename;
    const candidatePath = resolve(fixture.root, fixture.attemptDirectory, candidateFilename);
    const catalogueBytes = new Uint8Array(readFileSync(resolve(
      fixture.root,
      fixture.packet.bindings.packetCatalogue.path,
    )));
    const forgedLocks = Object.freeze({
      packageLock: Object.freeze({
        schema: "phase10-c0v-s6-lock-v1" as const,
        packetId: "phase10-c0v-s6-execution-v2-recovery-v5-packet-paths-v1",
        attemptId: `${fixture.packet.packetId}:${fixture.packet.registeredAttemptId}`,
        processId: process.pid,
        acquiredAt: "2026-08-22T12:00:00.000Z",
      }),
      packetLock: Object.freeze({
        schema: "phase10-c0v-s6-lock-v1" as const,
        packetId: fixture.packet.packetId,
        attemptId: fixture.packet.registeredAttemptId,
        processId: process.pid,
        acquiredAt: "2026-08-22T12:00:00.000Z",
      }),
    });
    const forgedAuthority = Object.freeze({
      catalogue: parsePhase10C0VS6PacketCatalogue(
        parsePhase10C0VS6PrettyJsonBytes(catalogueBytes, "forged finalizer catalogue"),
      ),
      catalogueBytes,
      packet: fixture.packet,
      packetProtocolBytes: fixture.packetProtocolBytes,
      packetProtocolIdentity: fixture.packetProtocolIdentity,
    });

    expect(() => independentlyFinalizePhase10C0VS6ApPacket({
      ...rawCauseInput(fixture),
      locks: forgedLocks,
      lockedAuthority: forgedAuthority,
      watchdog: Object.freeze({}) as Phase10C0VS6ParentWatchdogContext,
      capturedGovernedCallerResult: null,
    })).toThrow(/not issued by the active package-lock callback/u);

    rmSync(resolve(fixture.root, fixture.packet.paths.preflightReceiptPath));
    await expect(phase10C0VS6WithPackageAndPacketLocks(
      phase10C0VS6PhysicalRepositoryRoot(fixture.root),
      fixture.packet.packetId,
      "run",
      (locks, lockedAuthority, watchdog) => {
        writeBytes(fixture.root, fixture.packet.paths.preflightReceiptPath, fixture.preflightBytes);
        writeRawExit(fixture, "no-worker");
        return independentlyFinalizePhase10C0VS6ApPacket({
          ...rawCauseInput(fixture),
          locks,
          lockedAuthority,
          watchdog,
          capturedGovernedCallerResult: null,
        });
      },
    )).rejects.toThrow(
      /implementation-freeze commit differs from independently derived first-introduction commit/u,
    );
    expect(existsSync(candidatePath)).toBe(false);
    expect(existsSync(resolve(fixture.root, fixture.packet.paths.terminalReceiptPath))).toBe(false);
    expect(existsSync(resolve(fixture.root, fixture.packet.paths.packageLockPath))).toBe(true);
    expect(existsSync(resolve(fixture.root, fixture.packet.paths.lockPath))).toBe(true);
    for (const projection of fixture.packet.resources.publicationFinalizationProjections) {
      expect(existsSync(resolve(fixture.root, projection.path))).toBe(false);
      expect(existsSync(resolve(fixture.root, projection.stagingPath))).toBe(false);
    }
  }, 300_000);

  it("raw-projects a retained prelaunch refusal and rejects forged cause bytes", () => {
    const fixture = rawCauseFixture("c0v-moving-produce", "prelaunch-resource-refusal");
    writeRawExit(fixture, "no-worker");
    const evaluation = independentlyEvaluatePhase10C0VS6RefusalCause(rawCauseInput(fixture));
    expect(evaluation).toMatchObject({
      selectedSubrouteId: "moving-prelaunch-refusal",
      dispositionCode: "prelaunch-resource-refusal",
      workerProcessInvocationCount: 0,
      workerInvocations: null,
      workerInvocationRecords: [],
      verdict: "pass",
    });
    expect(independentlyProjectPhase10C0VS6RawLifecycleRoute(rawCauseInput(fixture))).toMatchObject({
      selectedSubrouteId: "moving-prelaunch-refusal",
      dispositionCode: "prelaunch-resource-refusal",
      terminalState: "scientific-refusal",
      produceInvocationRecords: [],
      packetInvocationRecords: [],
      registeredCap: null,
    });
    expect(evaluation.observations).toHaveLength(3);
    expect(evaluation.observations.filter((entry) => entry.routeConditionMatched)).toHaveLength(1);
    const receipt = causeReceiptValue(fixture, evaluation);
    expect(parsePhase10C0VS6CauseEvaluationReceipt(receipt, fixture.packet, evaluation).verdict)
      .toBe("pass");
    const forgedObservations = receipt.observations.map((entry, index) => index === 0
      ? { ...entry, observedValue: Number(entry.observedValue) - 1 }
      : entry);
    expect(() => parsePhase10C0VS6CauseEvaluationReceipt({
      ...receipt,
      observations: forgedObservations,
    }, fixture.packet, evaluation)).toThrow(/observations authority/u);
    const forgedEvidence = receipt.evidence.map((entry, index) => index === 0
      ? { ...entry, evidenceId: `${entry.evidenceId}-forged` }
      : entry);
    expect(() => parsePhase10C0VS6CauseEvaluationReceipt({
      ...receipt,
      evidence: forgedEvidence,
    }, fixture.packet, evaluation)).toThrow(/evidence/u);
  });

  it("raw-projects all seven produce cap prefixes with a strict equality boundary", () => {
    const packetIds = [
      "c0v-moving-produce",
      "c0v-radial-produce",
      "c0v-static-produce",
    ] as const;
    let capCount = 0;
    for (const packetId of packetIds) {
      const packetBytes = new Uint8Array(readFileSync(resolve(
        process.cwd(),
        `research/phase10-execution-v2/recovery-v5/packets/${packetId}/protocol.json`,
      )));
      const packet = parsePhase10C0VS6PacketProtocol(
        parsePhase10C0VS6PrettyJsonBytes(packetBytes, `${packetId} cap matrix protocol`),
      );
      for (const binding of packet.registeredCapBindings) {
        const subroutes = packet.terminalSubroutes.filter((entry) =>
          entry.classificationConditionIds.includes(binding.conditionId));
        expect(subroutes).toHaveLength(1);
        const fixture = rawCauseFixture(packetId);
        writeRawExit(fixture, "registered-cap");
        writeRawWorkerStream(fixture, subroutes[0]!.subrouteId, 1);
        const evaluation = independentlyEvaluatePhase10C0VS6RefusalCause(rawCauseInput(fixture));
        const lifecycle = independentlyProjectPhase10C0VS6RawLifecycleRoute(rawCauseInput(fixture));
        expect(evaluation.selectedSubrouteId).toBe(subroutes[0]!.subrouteId);
        expect(evaluation.dispositionCode).toBe("registered-cap-resource-refusal");
        expect(evaluation.workerInvocationRecords.at(-1)).toMatchObject({
          invocationId: binding.invocationId,
          terminalState: "registered-cap",
          elapsedNanoseconds:
            evaluation.workerInvocationRecords.at(-1)!.registeredWallSecondsMaximum * 1_000_000_000 + 1,
        });
        const observation = evaluation.observations.find((entry) => entry.conditionId === binding.conditionId);
        expect(observation?.observedValue).toBe(
          evaluation.workerInvocationRecords.at(-1)!.wallSeconds,
        );
        expect(lifecycle).toMatchObject({
          selectedSubrouteId: subroutes[0]!.subrouteId,
          dispositionCode: "registered-cap-resource-refusal",
          terminalState: "registered-cap-resource-refusal",
          registeredCap: {
            conditionId: binding.conditionId,
            invocationId: binding.invocationId,
            observedWallSeconds: evaluation.workerInvocationRecords.at(-1)!.wallSeconds,
            registeredWallSecondsMaximum:
              evaluation.workerInvocationRecords.at(-1)!.registeredWallSecondsMaximum,
            unit: "seconds",
            makerReturnRequired: packetId !== "c0v-radial-produce",
          },
        });
        expect(lifecycle.produceInvocationRecords).toEqual(evaluation.workerInvocationRecords);
        expect(lifecycle.packetInvocationRecords).toEqual([]);
        const equalityBytes = phase10C0VS6WorkerInvocationEventBytes(
          workerEventsForSubroute(fixture.packet, subroutes[0]!.subrouteId, 0),
          fixture.packet.workerInvocationContract,
        );
        writeFileSync(
          resolve(fixture.root, fixture.attemptDirectory, fixture.packet.workerInvocationContract.filename),
          equalityBytes,
        );
        expect(() => independentlyEvaluatePhase10C0VS6RefusalCause(rawCauseInput(fixture)))
          .toThrow(/raw worker\/exit bytes|strict cap state/u);
        expect(() => independentlyProjectPhase10C0VS6RawLifecycleRoute(rawCauseInput(fixture)))
          .toThrow(/raw worker\/exit bytes|strict cap state/u);
        capCount += 1;
      }
    }
    expect(capCount).toBe(7);
  });

  it("refuses strict-over-cap timing on every complete produce leaf while allowing equality", () => {
    let verifiedLeaves = 0;
    for (const packetId of [
      "c0v-moving-produce",
      "c0v-radial-produce",
      "c0v-static-produce",
    ] as const) {
      const packetBytes = new Uint8Array(readFileSync(resolve(
        process.cwd(),
        `research/phase10-execution-v2/recovery-v5/packets/${packetId}/protocol.json`,
      )));
      const packet = parsePhase10C0VS6PacketProtocol(
        parsePhase10C0VS6PrettyJsonBytes(packetBytes, `${packetId} complete timing protocol`),
      );
      const completeRosters = packet.executableInvocationRosters.filter(
        (entry) => entry.completionRule === "complete-roster",
      );
      expect(completeRosters.length).toBeGreaterThan(0);
      const roster = completeRosters[0]!;
      for (const invocation of roster.invocations) {
        const maximumNanoseconds = invocation.registeredWallSecondsMaximum * 1_000_000_000;
        const equalityBytes = phase10C0VS6WorkerInvocationEventBytes(
          workerEventsForSubroute(
            packet,
            roster.tupleId,
            1,
            new Map([[invocation.invocationId, maximumNanoseconds]]),
          ),
          packet.workerInvocationContract,
        );
        expect(independentlyEvaluatePhase10C0VS6WorkerInvocations(
          equalityBytes,
          packet,
          roster.tupleId,
          Date.parse("2021-01-01T00:00:00.000Z"),
        ).invocationRecords.find((entry) => entry.invocationId === invocation.invocationId))
          .toMatchObject({ elapsedNanoseconds: maximumNanoseconds, terminalState: "complete" });

        const overrunBytes = phase10C0VS6WorkerInvocationEventBytes(
          workerEventsForSubroute(
            packet,
            roster.tupleId,
            1,
            new Map([[invocation.invocationId, maximumNanoseconds + 1]]),
          ),
          packet.workerInvocationContract,
        );
        expect(() => independentlyEvaluatePhase10C0VS6WorkerInvocations(
          overrunBytes,
          packet,
          roster.tupleId,
          Date.parse("2021-01-01T00:00:00.000Z"),
        )).toThrow(/strict cap state/u);
        verifiedLeaves += 1;
      }
    }
    expect(verifiedLeaves).toBe(7);
  });

  it("preserves infrastructure failure after a closed leaf without granting a claim row", () => {
    const completeEvents = workerInvocationEvents();
    const infrastructureStop = Object.freeze({
      ...completeEvents.at(-1)!,
      terminalState: "infrastructure-failure" as const,
    });
    const afterFinal = Object.freeze([
      ...completeEvents.slice(0, -1),
      infrastructureStop,
    ]);
    const afterFinalBytes = phase10C0VS6WorkerInvocationEventBytes(
      afterFinal,
      workerInvocationContract,
    );
    expect(parsePhase10C0VS6WorkerInvocationEventBytes(
      afterFinalBytes,
      workerInvocationContract,
    ).at(-1)?.terminalState).toBe("infrastructure-failure");
    expect(() => independentlyEvaluatePhase10C0VS6WorkerInvocations(
      afterFinalBytes,
      workerPacketAuthority(),
      "synthetic-tuple",
      Date.parse("2026-08-23T00:00:00.000Z"),
    )).toThrow(/worker boundary state|invocation roster/u);

    const first = workerInvocationAuthority();
    const second = Object.freeze({
      ...first,
      invocationId: "inv-synthetic-second-production",
    });
    const betweenLeavesAuthority = Object.freeze({
      workerInvocationContract,
      executableInvocationRosters: Object.freeze([Object.freeze({
        tupleId: "synthetic-two-leaf-tuple",
        completionRule: "complete-roster" as const,
        prefixOfTupleId: null,
        invocations: Object.freeze([first, second]),
      })]),
    });
    // The same raw sequence is an honest transport failure between leaves when protocol
    // authority expected a second invocation.  It remains parseable raw evidence, but cannot
    // satisfy that two-leaf claim-bearing roster.
    expect(parsePhase10C0VS6WorkerInvocationEventBytes(
      afterFinalBytes,
      workerInvocationContract,
    )).toHaveLength(4);
    expect(() => independentlyEvaluatePhase10C0VS6WorkerInvocations(
      afterFinalBytes,
      betweenLeavesAuthority,
      "synthetic-two-leaf-tuple",
      Date.parse("2026-08-23T00:00:00.000Z"),
    )).toThrow(/exact worker boundaries and invocation pairs/u);
  });

  it("raw-projects moving and static semantic refusals and rejects a wrong exit class", () => {
    for (const [packetId, expectedSubroute] of [
      ["c0v-moving-produce", "moving-discrepancy-refusal"],
      ["c0v-static-produce", "static-preimplementation-refusal"],
    ] as const) {
      const fixture = rawCauseFixture(packetId);
      writeRawExit(fixture, "complete");
      writeRawWorkerStream(fixture, expectedSubroute);
      const scienceProtocol = fixture.packet.bindings.scienceProtocol!;
      const referenceOrRefusal = fixture.packet.bindings.referenceOrRefusal!;
      const semanticInput = Object.freeze({
        ...rawCauseInput(fixture),
        scienceProtocolIdentity: scienceProtocol,
        scienceProtocolBytes: new Uint8Array(readFileSync(resolve(fixture.root, scienceProtocol.path))),
        referenceOrRefusalIdentity: referenceOrRefusal,
        referenceOrRefusalBytes: new Uint8Array(readFileSync(resolve(fixture.root, referenceOrRefusal.path))),
      });
      const reproof = packetId === "c0v-moving-produce"
        ? independentlyReprovePhase10C0VMovingDiscrepancyArtifacts(semanticInput)
        : independentlyReprovePhase10C0VStaticRefusalArtifacts(semanticInput);
      const governedEvaluation = packetId === "c0v-moving-produce"
        ? independentlyEvaluatePhase10C0VMovingDiscrepancy(semanticInput)
        : independentlyEvaluatePhase10C0VStaticRefusal(semanticInput);
      expect(reproof).toEqual(governedEvaluation);
      const evaluation = independentlyEvaluatePhase10C0VS6RefusalCause(rawCauseInput(fixture));
      expect(evaluation.semanticEvaluation).toEqual(reproof);
      expect(evaluation.selectedSubrouteId).toBe(expectedSubroute);
      expect(evaluation.observations.every((entry) => entry.routeConditionMatched)).toBe(true);
      expect(independentlyProjectPhase10C0VS6RawLifecycleRoute(rawCauseInput(fixture))).toMatchObject({
        selectedSubrouteId: expectedSubroute,
        dispositionCode: evaluation.dispositionCode,
        terminalState: "scientific-refusal",
        produceInvocationRecords: evaluation.workerInvocationRecords,
        packetInvocationRecords: [],
        registeredCap: null,
      });

      const exitPath = resolve(fixture.root, fixture.attemptDirectory, "exit-status.json");
      writeFileSync(exitPath, phase10C0VS6PrettyJsonBytes({
        schema: fixture.packet.exitStatusContract.rowSchema,
        packetId: fixture.packet.packetId,
        attemptId: fixture.packet.registeredAttemptId,
        workerProcessInvocationCount: 1,
        workerStarted: true,
        exitCode: null,
        signal: "SIGTERM",
        classification: "registered-cap",
      }));
      expect(() => independentlyEvaluatePhase10C0VS6RefusalCause(rawCauseInput(fixture)))
        .toThrow(/raw worker\/exit bytes/u);
      expect(() => independentlyProjectPhase10C0VS6RawLifecycleRoute(rawCauseInput(fixture)))
        .toThrow(/raw worker\/exit bytes/u);
    }

    const packetRoot = resolve(import.meta.dirname, "../../research/phase10-execution-v2/recovery-v5/packets");
    const registeredExports = readdirSync(packetRoot).flatMap((packetDirectory) => {
      const registry = JSON.parse(readFileSync(
        resolve(packetRoot, packetDirectory, "callable-registry.json"),
        "utf8",
      )) as Readonly<{ readonly callables: readonly Readonly<{ readonly exportName: string }>[] }>;
      return registry.callables.map((entry) => entry.exportName);
    });
    expect(registeredExports).not.toContain("independentlyReprovePhase10C0VMovingDiscrepancyArtifacts");
    expect(registeredExports).not.toContain("independentlyReprovePhase10C0VStaticRefusalArtifacts");
  });

  it("covers the exact union of all execution-v2 registered callable IDs", () => {
    const packetRoot = resolve(import.meta.dirname, "../../research/phase10-execution-v2/recovery-v5/packets");
    const callableIds = readdirSync(packetRoot).flatMap((packetDirectory) => {
      const registry = JSON.parse(readFileSync(
        resolve(packetRoot, packetDirectory, "callable-registry.json"),
        "utf8",
      )) as { readonly callables: readonly { readonly callableId: string }[] };
      return registry.callables.map((entry) => entry.callableId);
    });
    expect(() => phase10C0VS6AssertBuiltinAllowlistRegistryCoverage(callableIds)).not.toThrow();
    expect(() => phase10C0VS6AssertBuiltinAllowlistRegistryCoverage(callableIds.slice(1)))
      .toThrow(/callable-ID union differs/u);
  });

  function invocation(
    terminalState: "complete" | "registered-cap" | "infrastructure-failure",
    finishedAt: string,
    elapsedNanoseconds: number,
  ): unknown {
    const wallSeconds = elapsedNanoseconds / 1_000_000_000;
    return [{
      invocationId: "inv-cap-boundary",
      callableId: "phase10-synthetic-producer",
      negativeControlId: null,
      invocationClass: "solver-production",
      startedAt: "2026-08-22T00:00:00.000Z",
      finishedAt,
      elapsedNanoseconds,
      wallSeconds,
      registeredWallSecondsMaximum: 300,
      terminalState,
    }];
  }

  it("keeps the invocation-cap boundary disjoint", () => {
    expect(parsePhase10C0VS6ExecutableInvocationRecords(
      invocation("complete", "2026-08-22T00:05:00.000Z", 300_000_000_000),
    )[0]?.terminalState).toBe("complete");
    expect(parsePhase10C0VS6ExecutableInvocationRecords(
      invocation("infrastructure-failure", "2026-08-22T00:05:00.000Z", 300_000_000_000),
    )[0]?.terminalState).toBe("infrastructure-failure");
    expect(() => parsePhase10C0VS6ExecutableInvocationRecords(
      invocation("registered-cap", "2026-08-22T00:05:00.000Z", 300_000_000_000),
    )).toThrow(/strict cap state|cap classification/u);
    expect(parsePhase10C0VS6ExecutableInvocationRecords(
      invocation("registered-cap", "2026-08-22T00:05:00.000Z", 300_000_000_001),
    )[0]?.terminalState).toBe("registered-cap");
    expect(() => parsePhase10C0VS6ExecutableInvocationRecords(
      invocation("infrastructure-failure", "2026-08-22T00:05:00.000Z", 300_000_000_001),
    )).toThrow(/strict cap state|cap classification/u);
  });

  it("admits exact empty case progress only for a route-cause cap", () => {
    const routeCausePartial = {
      capId: "cond-c0v-moving-cap-cause",
      registeredLimit: 14_400,
      observedValue: 14_400.001,
      unit: "seconds",
      cappedInvocationId: "inv-c0v-moving-cause",
      cappedInvocationClass: "route-cause-evaluator",
      invocationStartedAt: "2026-08-22T00:00:00.000Z",
      invocationStoppedAt: "2026-08-22T04:00:00.001Z",
      invocationElapsedNanoseconds: 14_400_001_000_000,
      rosterCaseIds: [],
      startedCaseIds: [],
      completedCaseIds: [],
      activeCaseId: null,
      completedNumericFieldValueCount: 0,
      completedUniformFieldValueCount: 0,
      retainedCandidateBytes: 0,
      acceptedValidWitnessProduced: false,
    };
    expect(parsePhase10C0VS6PartialExecution(routeCausePartial).cappedInvocationClass)
      .toBe("route-cause-evaluator");
    expect(() => parsePhase10C0VS6PartialExecution({
      ...routeCausePartial,
      rosterCaseIds: ["radial-small"],
    })).toThrow(/exact empty solver-case progress/u);
    expect(() => parsePhase10C0VS6PartialExecution({
      ...routeCausePartial,
      cappedInvocationClass: "numerical-evaluator",
    })).toThrow(/must not be empty for a radial pipeline cap/u);
  });

  it("rederives exact worker leaf timing from the parent-owned invocation stream", () => {
    const bytes = phase10C0VS6WorkerInvocationEventBytes(
      workerInvocationEvents(),
      workerInvocationContract,
    );
    const evaluated = independentlyEvaluatePhase10C0VS6WorkerInvocations(
      bytes,
      workerPacketAuthority(),
      "synthetic-tuple",
      Date.parse("2026-08-22T00:05:00.000Z"),
    );
    expect(evaluated.workerWallSeconds).toBe(299.999);
    expect(evaluated.invocationRecords).toEqual([expect.objectContaining({
      invocationId: "inv-synthetic-production",
      wallSeconds: 299.999,
      terminalState: "complete",
    })]);
  });

  it("durably appends canonical parent-owned worker JSONL and seals an immutable identity", () => {
    const root = temporaryRoot("worker-invocation-append");
    const physical = phase10C0VS6PhysicalRepositoryRoot(root);
    const path = "out/attempt/worker-invocations.jsonl";
    const events = workerInvocationEvents();
    const writer = phase10C0VS6CreateWorkerInvocationEventLog(
      physical,
      path,
      workerInvocationContract,
      events[0]!,
    );
    for (const event of events.slice(1)) writer.append(event);
    const closed = writer.closeAndReopen();
    expect(closed.bytes).toEqual(phase10C0VS6WorkerInvocationEventBytes(events, workerInvocationContract));
    expect(closed.records).toEqual(events);
    expect(phase10C0VS6ReopenWorkerInvocationEventLog(
      physical,
      closed.identity,
      workerInvocationContract,
    ).records).toEqual(events);
    expect(() => writer.append(events.at(-1)!)).toThrow(/closed/u);
    expect(() => writer.closeAndReopen()).toThrow(/already closed/u);
    expect(() => phase10C0VS6CreateWorkerInvocationEventLog(
      physical,
      path,
      workerInvocationContract,
      events[0]!,
    )).toThrow(/append resume is forbidden/u);

    writeFileSync(resolve(root, path), "{}\n", { flag: "a" });
    expect(() => phase10C0VS6ReopenWorkerInvocationEventLog(
      physical,
      closed.identity,
      workerInvocationContract,
    )).toThrow(/immutable worker invocation event log/u);
  });

  it("rejects sequence, clock, and invocation-boundary drift before appending", () => {
    const root = temporaryRoot("worker-invocation-append-attacks");
    const physical = phase10C0VS6PhysicalRepositoryRoot(root);
    const path = "out/attempt/worker-invocations.jsonl";
    const events = workerInvocationEvents();
    const writer = phase10C0VS6CreateWorkerInvocationEventLog(
      physical,
      path,
      workerInvocationContract,
      events[0]!,
    );
    expect(() => writer.append(Object.freeze({ ...events[1]!, sequence: 2 })))
      .toThrow(/contiguous index 1/u);
    expect(() => writer.append(Object.freeze({
      ...events[1]!,
      observedAt: "2026-08-21T23:59:59.999Z",
    }))).toThrow(/moved backwards/u);
    expect(() => writer.append(Object.freeze({
      ...events[2]!,
      sequence: 1,
    }))).toThrow(/start an invocation/u);
    writer.append(events[1]!);
    expect(() => writer.append(Object.freeze({
      ...events[2]!,
      invocationId: "inv-forged-production",
    }))).toThrow(/exactly finish the active invocation/u);
    writer.append(events[2]!);
    writer.append(events[3]!);
    expect(writer.closeAndReopen().records).toEqual(events);
  });

  it("keeps UTC provenance from changing the monotonic cap boundary", () => {
    const equalityWithLongUtc = independentlyEvaluatePhase10C0VS6WorkerInvocations(
      phase10C0VS6WorkerInvocationEventBytes(
        workerInvocationEvents("2026-08-22T00:10:00.000Z", "complete", 300_000_000_000),
        workerInvocationContract,
      ),
      workerPacketAuthority(),
      "synthetic-tuple",
      Date.parse("2026-08-22T00:10:00.000Z"),
    );
    expect(equalityWithLongUtc.invocationRecords[0]).toMatchObject({
      elapsedNanoseconds: 300_000_000_000,
      wallSeconds: 300,
      terminalState: "complete",
    });

    const overByOneNanosecondWithShortUtc = independentlyEvaluatePhase10C0VS6WorkerInvocations(
      phase10C0VS6WorkerInvocationEventBytes(
        workerInvocationEvents("2026-08-22T00:00:00.001Z", "registered-cap", 300_000_000_001),
        workerInvocationContract,
      ),
      workerPacketAuthority("registered-cap"),
      "synthetic-tuple",
      Date.parse("2026-08-22T00:00:00.001Z"),
    );
    expect(overByOneNanosecondWithShortUtc.invocationRecords[0]).toMatchObject({
      elapsedNanoseconds: 300_000_000_001,
      terminalState: "registered-cap",
    });

    expect(() => independentlyEvaluatePhase10C0VS6WorkerInvocations(
      phase10C0VS6WorkerInvocationEventBytes(
        workerInvocationEvents("2026-08-21T23:59:59.999Z", "registered-cap", 300_000_000_001),
        workerInvocationContract,
      ),
      workerPacketAuthority("registered-cap"),
      "synthetic-tuple",
      Date.parse("2026-08-22T00:00:00.000Z"),
    )).toThrow(/UTC-provenance/u);
  });

  it("rejects omitted, reordered, and future worker invocation events", () => {
    const events = workerInvocationEvents();
    const omitted = [...events.slice(0, 2), ...events.slice(3)];
    expect(() => independentlyEvaluatePhase10C0VS6WorkerInvocations(
      phase10C0VS6WorkerInvocationEventBytes(omitted, workerInvocationContract),
      workerPacketAuthority(),
      "synthetic-tuple",
      Date.parse("2026-08-22T00:05:00.000Z"),
    )).toThrow(/exact worker boundaries and invocation pairs/u);

    const reordered = events.map((entry, index) => Object.freeze({
      ...entry,
      sequence: index,
      event: index === 1 ? "invocation-finished" : index === 2 ? "invocation-started" : entry.event,
      terminalState: index === 1 ? "complete" : index === 2 ? "running" : entry.terminalState,
    })) as readonly Phase10C0VS6WorkerInvocationEventRecord[];
    expect(() => independentlyEvaluatePhase10C0VS6WorkerInvocations(
      phase10C0VS6WorkerInvocationEventBytes(reordered, workerInvocationContract),
      workerPacketAuthority(),
      "synthetic-tuple",
      Date.parse("2026-08-22T00:05:00.000Z"),
    )).toThrow(/exact adjacent start\/finish pair/u);

    expect(() => independentlyEvaluatePhase10C0VS6WorkerInvocations(
      phase10C0VS6WorkerInvocationEventBytes(events, workerInvocationContract),
      workerPacketAuthority(),
      "synthetic-tuple",
      Date.parse("2026-08-21T23:59:59.999Z"),
    )).toThrow(/verifier's future/u);
  });

  it("accepts only a strictly over-cap worker invocation as registered cap", () => {
    expect(() => independentlyEvaluatePhase10C0VS6WorkerInvocations(
      phase10C0VS6WorkerInvocationEventBytes(
        workerInvocationEvents("2026-08-22T00:05:00.000Z", "registered-cap"),
        workerInvocationContract,
      ),
      workerPacketAuthority("registered-cap"),
      "synthetic-tuple",
      Date.parse("2026-08-22T00:05:01.000Z"),
    )).toThrow(/strict cap state|cap classification/u);
    expect(independentlyEvaluatePhase10C0VS6WorkerInvocations(
      phase10C0VS6WorkerInvocationEventBytes(
        workerInvocationEvents("2026-08-22T00:05:00.001Z", "registered-cap"),
        workerInvocationContract,
      ),
      workerPacketAuthority("registered-cap"),
      "synthetic-tuple",
      Date.parse("2026-08-22T00:05:01.000Z"),
    ).terminalState).toBe("registered-cap");
  });

  it("preserves a signaled capped child without fabricating an exit code", () => {
    const common = {
      schema: "phase10-c0v-exit-status-v1",
      packetId: "c0v-radial-produce",
      attemptId: "c0v-radial-produce-20260822-v1",
      workerProcessInvocationCount: 1,
      workerStarted: true,
      exitCode: null,
      signal: "SIGTERM",
    };
    expect(parsePhase10C0VS6ExitStatusReceipt({
      ...common,
      classification: "registered-cap",
    }, exitStatusPacketAuthority).classification).toBe("registered-cap");
    expect(parsePhase10C0VS6ExitStatusReceipt({
      ...common,
      classification: "infrastructure-failure",
    }, exitStatusPacketAuthority).classification).toBe("infrastructure-failure");
    expect(() => parsePhase10C0VS6ExitStatusReceipt({
      ...common,
      exitCode: 1,
      classification: "infrastructure-failure",
    }, exitStatusPacketAuthority)).toThrow(/worker\/count\/exit\/signal classification/u);
    expect(() => parsePhase10C0VS6ExitStatusReceipt({
      ...common,
      classification: "complete",
    }, exitStatusPacketAuthority)).toThrow(/complete classification requires raw exit code zero/u);
    expect(() => parsePhase10C0VS6ExitStatusReceipt({
      ...common,
      exitCode: 0,
      signal: null,
      classification: "infrastructure-failure",
    }, exitStatusPacketAuthority)).toThrow(/infrastructure failure requires a nonzero raw code or a signal/u);
  });

  it("binds a freeze evaluation to independently derived protocol, preflight, Git, and closure facts", () => {
    const packet = Object.freeze({
      packetId: "c0v-radial-produce",
      registeredAttemptId: "c0v-radial-produce-20260822-v1",
      freezeEvaluationContract: Object.freeze({
        schema: "phase10-c0v-s6-freeze-evaluation-contract-v1",
        filename: "freeze-evaluation.json",
        rowSchema: "phase10-c0v-s6-freeze-evaluation-v1",
        evaluationIdRule: "freeze-packet-registered-attempt-v1",
        exactFields: Object.freeze([
          "schema", "evaluationId", "packetId", "attemptId", "protocol", "preflight",
          "implementationFreezeCommit", "launchHead", "launchBranch", "anchorPaths",
          "artifacts", "parserRuntimeArtifacts", "artifactFailure", "invokedCheckIds", "verdict", "reasons",
        ]),
        artifactFailureExactFields: Object.freeze([
          "artifactRole", "expected", "observed", "failureClass",
        ]),
        artifactFailureRule: "null-except-radial-preproduction-artifact-refusal",
        verdictRule: "pass-means-freeze-and-selected-artifact-observation-independently-rederived",
        constructionRule: "immutable-before-terminal-candidate-no-overwrite",
      }),
      terminalCandidateContract: Object.freeze({
        schema: "phase10-c0v-terminal-candidate-contract-v1",
        rowSchema: "phase10-c0v-terminal-candidate-v1",
        successFilename: "terminal-success-candidate.json",
        exactFields: Object.freeze([]),
        decisionExactFields: Object.freeze([]),
        decisionEvidenceExactFields: Object.freeze(["evidenceRole", "artifact"] as const),
        decisionRosters: Object.freeze([Object.freeze({
          subrouteId: "synthetic",
          candidateFilename: "terminal-success-candidate.json",
          candidateVerdict: "accepted-route-candidate",
          candidateProducedOutputIds: Object.freeze([]),
          candidateExecutedCheckIds: Object.freeze(["chk-c0v-radial-freeze-ancestry"]),
          candidateExecutedNegativeControlIds: Object.freeze([]),
          candidateReasonCodes: Object.freeze([]),
          candidateCallerInvocationIds: Object.freeze([]),
          decisions: Object.freeze([Object.freeze({
            decisionRole: "freeze",
            fieldName: "freezeDecision",
            decisionId: "decision-synthetic-freeze-v1",
            evaluatorCallableId: "phase10-c0v-s6-freeze-evaluator",
            invokedCheckIds: Object.freeze(["chk-c0v-radial-freeze-ancestry"]),
            expectedVerdict: "pass",
            evidence: Object.freeze([Object.freeze({
              evidenceRole: "freeze-evaluation",
              artifactRelativePath: "freeze-evaluation.json",
            })]),
          })]),
        })]),
        verdictRule: "accepted-route-candidate-for-every-current-materializable-subroute",
        forbiddenFields: Object.freeze(["attemptLedger", "packetVerification", "terminalReceipt"] as const),
        constructionRule: "immutable-preledger-candidate-no-overwrite",
      }),
    } satisfies Pick<
      Phase10C0VS6PacketProtocol,
      "packetId" | "registeredAttemptId" | "freezeEvaluationContract" | "terminalCandidateContract"
    >);
    const authority = Object.freeze({
      protocol: identity("research/protocol.json"),
      preflight: identity("evidence/preflight.json"),
      implementationFreezeCommit: "a".repeat(40),
      launchHead: "b".repeat(40),
      launchBranch: "phase10/evidence-verification" as const,
      anchorPaths: Object.freeze(["runner/anchor.ts"]),
      artifacts: Object.freeze([identity("runner/anchor.ts")]),
      parserRuntimeArtifacts: Object.freeze([
        identity("node_modules/typescript/lib/typescript.js"),
        identity("node_modules/typescript/package.json"),
      ]),
      artifactFailure: null,
    });
    const receipt = {
      schema: "phase10-c0v-s6-freeze-evaluation-v1",
      evaluationId: "freeze-c0v-radial-produce-c0v-radial-produce-20260822-v1-v1",
      packetId: "c0v-radial-produce",
      attemptId: "c0v-radial-produce-20260822-v1",
      protocol: authority.protocol,
      preflight: authority.preflight,
      implementationFreezeCommit: authority.implementationFreezeCommit,
      launchHead: authority.launchHead,
      launchBranch: authority.launchBranch,
      anchorPaths: authority.anchorPaths,
      artifacts: authority.artifacts,
      parserRuntimeArtifacts: authority.parserRuntimeArtifacts,
      artifactFailure: null,
      invokedCheckIds: ["chk-c0v-radial-freeze-ancestry"],
      verdict: "pass",
      reasons: [],
    };
    expect(parsePhase10C0VS6FreezeEvaluationReceipt(receipt, packet, authority).verdict).toBe("pass");
    expect(() => parsePhase10C0VS6FreezeEvaluationReceipt({
      ...receipt,
      preflight: identity("evidence/alternate-preflight.json"),
    }, packet, authority)).toThrow(/preflight/u);
    expect(() => parsePhase10C0VS6FreezeEvaluationReceipt({
      ...receipt,
      artifacts: [identity("runner/tuned.ts")],
    }, packet, authority)).toThrow(/artifacts authority/u);
  });

  it("admits only exact freeze lifecycle dirt and a normal launch-HEAD index", () => {
    const root = temporaryRoot("freeze-worktree-stage");
    git(root, ["init"]);
    git(root, ["config", "user.email", "phase10@example.invalid"]);
    git(root, ["config", "user.name", "Phase 10 Synthetic"]);
    write(root, "baseline.txt", "launch authority\n");
    git(root, ["add", "baseline.txt"]);
    git(root, ["commit", "-m", "synthetic launch"]);
    const launchHead = git(root, ["rev-parse", "HEAD"]);
    const packetBytes = new Uint8Array(readFileSync(
      resolve(process.cwd(), "research/phase10-execution-v2/recovery-v5/packets/c0v-moving-produce/protocol.json"),
    ));
    const packet = parsePhase10C0VS6PacketProtocol(
      parsePhase10C0VS6PrettyJsonBytes(packetBytes, "freeze-stage packet"),
    );

    expect(phase10C0VS6AssertFreezeWorktreeStage(root, packet, launchHead)).toEqual([]);
    write(root, packet.paths.preflightReceiptPath, "preflight\n");
    expect(phase10C0VS6AssertFreezeWorktreeStage(root, packet, launchHead))
      .toEqual([packet.paths.preflightReceiptPath]);
    expect(phase10C0VS6ReopenFreezeRetainedPreflight(
      root,
      packet,
      new TextEncoder().encode("preflight\n"),
    ).path).toBe(packet.paths.preflightReceiptPath);
    expect(() => phase10C0VS6ReopenFreezeRetainedPreflight(
      root,
      packet,
      new TextEncoder().encode("alternate canonical preflight\n"),
    )).toThrow(/differs from the exact live/u);

    write(root, "unrelated.txt", "unregistered\n");
    expect(() => phase10C0VS6AssertFreezeWorktreeStage(root, packet, launchHead))
      .toThrow(/differs from every exact/u);
    rmSync(resolve(root, "unrelated.txt"));

    const selectedSubrouteId = "moving-discrepancy-refusal";
    const candidatePaths = packet.candidateFilenameRosters[selectedSubrouteId]!.map((filename) => {
      const matches = packet.paths.allowedPublicationPaths.filter((path) => path.endsWith(`/${filename}`));
      expect(matches).toHaveLength(1);
      return matches[0]!;
    });
    for (const path of candidatePaths) write(root, path, `${path}\n`);
    expect(phase10C0VS6AssertFreezeWorktreeStage(root, packet, launchHead))
      .toEqual([packet.paths.preflightReceiptPath, ...candidatePaths].sort(codePointCompare));

    const verificationPath = packet.paths.allowedPublicationPaths.find((path) =>
      path.endsWith(`/${packet.verification.filename}`))!;
    write(root, verificationPath, "verification\n");
    expect(() => phase10C0VS6AssertFreezeWorktreeStage(root, packet, launchHead))
      .toThrow(/differs from every exact/u);
    write(root, packet.paths.terminalReceiptPath, "terminal\n");
    expect(() => phase10C0VS6AssertFreezeWorktreeStage(root, packet, launchHead)).not.toThrow();

    git(root, ["update-index", "--assume-unchanged", "baseline.txt"]);
    expect(() => phase10C0VS6AssertFreezeWorktreeStage(root, packet, launchHead))
      .toThrow(/normal uppercase H/u);
  });

  it("records classification assembly separately from its exact independent evaluator roster", () => {
    const classification = {
      validationId: "classification-c0v-moving-produce-attempt-v1-moving-discrepancy-refusal-v1",
      assemblerCallableId: "phase10-c0v-moving-attempt-receipt-writer",
      componentEvaluatorCallableIds: [
        "phase10-c0v-moving-evaluator",
        "phase10-c0v-s6-freeze-evaluator",
        "phase10-c0v-s6-attempt-census-evaluator",
        "phase10-c0v-s6-resource-evaluator",
      ],
      method: "independent-reference-discrepancy-classification",
      validatedDispositionCode: "reference-discrepancy-refusal",
      observations: [{
        conditionId: "cond-synthetic",
        kind: "reference-check-outcome",
        comparator: "equal",
        registeredValue: "fail",
        observedValue: "fail",
        unit: "outcome",
        conditionPassed: true,
        evidenceIds: ["evidence-synthetic"],
      }],
      evidence: [{
        evidenceId: "evidence-synthetic",
        evidenceRole: "classification-input",
        retentionClass: "tracked-evidence",
        artifact: identity("evidence/cause.json"),
        inlineObservationPath: null,
      }],
      zeroScientificExecution: true,
      partialExecutionMatched: true,
      acceptedValidWitnessAbsent: true,
      acceptedNumericalVerdictAbsent: true,
      completedNumericalNegativeControlCampaignCreditAbsent: true,
      verdict: "pass",
      errors: [],
    };
    expect(parsePhase10C0VS6ClassificationValidation(classification).assemblerCallableId)
      .toBe("phase10-c0v-moving-attempt-receipt-writer");
    expect(() => parsePhase10C0VS6ClassificationValidation({
      ...classification,
      componentEvaluatorCallableIds: [
        "phase10-c0v-moving-evaluator",
        "phase10-c0v-moving-evaluator",
      ],
    })).toThrow(/must be unique/u);
    const withoutAssembler = { ...classification } as Record<string, unknown>;
    delete withoutAssembler.assemblerCallableId;
    expect(() => parsePhase10C0VS6ClassificationValidation({
      validationId: classification.validationId,
      validatorCallableId: "phase10-c0v-moving-evaluator",
      ...withoutAssembler,
    })).toThrow(/ordered fields differ/u);
  });

  it("constructs the immutable terminal candidate before ledger, census, resource, or final receipt", () => {
    const candidateContract = Object.freeze({
      schema: "phase10-c0v-terminal-candidate-contract-v1" as const,
      rowSchema: "phase10-c0v-terminal-candidate-v1" as const,
      successFilename: "terminal-success-candidate.json" as const,
      exactFields: Object.freeze([
        "schema", "packetId", "attemptId", "selectedSubrouteId", "dispositionCode",
        "preflight", "exitStatus", "producedOutputIds", "executedCheckIds",
        "executedNegativeControlIds", "callerInvocationResults", "freezeDecision", "causeDecision",
        "verdict", "reasons",
      ]),
      decisionExactFields: Object.freeze([
        "decisionId", "evaluatorCallableId", "invokedCheckIds", "verdict", "reasons", "evidence",
      ]),
      decisionEvidenceExactFields: Object.freeze(["evidenceRole", "artifact"] as const),
      decisionRosters: Object.freeze([Object.freeze({
        subrouteId: "synthetic-refusal",
        candidateFilename: "terminal-success-candidate.json" as const,
        candidateVerdict: "accepted-route-candidate" as const,
        candidateProducedOutputIds: Object.freeze(["out-synthetic-preflight"]),
        candidateExecutedCheckIds: Object.freeze(["chk-synthetic-freeze"]),
        candidateExecutedNegativeControlIds: Object.freeze([]),
        candidateReasonCodes: Object.freeze([]),
        candidateCallerInvocationIds: Object.freeze([]),
        decisions: Object.freeze([Object.freeze({
          decisionRole: "freeze" as const,
          fieldName: "freezeDecision" as const,
          decisionId: "decision-synthetic-freeze-v1",
          evaluatorCallableId: "phase10-c0v-s6-freeze-evaluator",
          invokedCheckIds: Object.freeze(["chk-synthetic-freeze"]),
          expectedVerdict: "pass" as const,
          evidence: Object.freeze([Object.freeze({
            evidenceRole: "freeze-evaluation" as const,
            artifactRelativePath: "freeze-evaluation.json" as const,
          })]),
        })]),
      })]),
      verdictRule: "accepted-route-candidate-for-every-current-materializable-subroute" as const,
      forbiddenFields: Object.freeze(["attemptLedger", "packetVerification", "terminalReceipt"] as const),
      constructionRule: "immutable-preledger-candidate-no-overwrite" as const,
    });
    const packet = Object.freeze({
      packetId: "c0v-radial-produce" as const,
      registeredAttemptId: "c0v-radial-produce-20260822-v1",
      terminalSubroutes: Object.freeze([Object.freeze({
        subrouteId: "synthetic-refusal",
        dispositionCode: "preproduction-artifact-refusal" as const,
        classificationConditionIds: Object.freeze(["cond-synthetic"]),
        requiredOutputIds: Object.freeze(["out-synthetic-preflight"]),
        forbiddenOutputIds: Object.freeze([]),
        requiredCheckIds: Object.freeze(["chk-synthetic-freeze"]),
        forbiddenCheckIds: Object.freeze([]),
        requiredNegativeControlIds: Object.freeze([]),
        forbiddenNegativeControlIds: Object.freeze([]),
      })]),
      terminalCandidateContract: candidateContract,
      terminalReceiptContract: Object.freeze({
        callerInvocationResultExactFields: Object.freeze([
          "callerInvocationId", "stage", "callerCallableId", "evaluatorCallableId", "terminalState",
          "executedCheckIds", "evaluatedCheckIds", "executedNegativeControlIds", "evaluatorResult",
          "sourceArtifactIdentities",
        ]),
        callerResultSourceIdentityExactFields: Object.freeze(["artifactRole", "artifact"]),
        callerInvocationResultRosters: Object.freeze([Object.freeze({
          subrouteId: "synthetic-refusal",
          callerInvocationResults: Object.freeze([]),
        })]),
      }) as unknown as Phase10C0VS6PacketProtocol["terminalReceiptContract"],
    } satisfies Pick<
      Phase10C0VS6PacketProtocol,
      "packetId" | "registeredAttemptId" | "terminalSubroutes" | "terminalCandidateContract" |
      "terminalReceiptContract"
    >);
    const freezeEvidence = identity("out/attempt/freeze-evaluation.json");
    const authority = Object.freeze({
      selectedSubrouteId: "synthetic-refusal",
      attemptDirectory: "out/attempt",
      preflight: identity("evidence/preflight.json"),
      exitStatus: identity("out/attempt/exit-status.json"),
      decisionResults: Object.freeze([Object.freeze({
        decisionRole: "freeze" as const,
        evidence: freezeEvidence,
        verdict: "pass" as const,
        reasons: Object.freeze([]),
      })]),
      callerInvocationResults: Object.freeze([]),
    });
    const decision = {
      decisionId: "decision-synthetic-freeze-v1",
      evaluatorCallableId: "phase10-c0v-s6-freeze-evaluator",
      invokedCheckIds: ["chk-synthetic-freeze"],
      verdict: "pass",
      reasons: [],
      evidence: [{ evidenceRole: "freeze-evaluation", artifact: freezeEvidence }],
    };
    const candidate = {
      schema: "phase10-c0v-terminal-candidate-v1",
      packetId: "c0v-radial-produce",
      attemptId: "c0v-radial-produce-20260822-v1",
      selectedSubrouteId: "synthetic-refusal",
      dispositionCode: "preproduction-artifact-refusal",
      preflight: authority.preflight,
      exitStatus: authority.exitStatus,
      producedOutputIds: ["out-synthetic-preflight"],
      executedCheckIds: ["chk-synthetic-freeze"],
      executedNegativeControlIds: [],
      callerInvocationResults: [],
      freezeDecision: decision,
      causeDecision: null,
      verdict: "accepted-route-candidate",
      reasons: [],
    };
    expect(parsePhase10C0VS6TerminalCandidate(candidate, packet, authority).verdict)
      .toBe("accepted-route-candidate");
    expect(() => parsePhase10C0VS6TerminalCandidate({
      ...candidate,
      attemptLedger: identity("evidence/attempts.jsonl"),
    }, packet, authority)).toThrow(/ordered fields differ/u);
    expect(() => parsePhase10C0VS6TerminalCandidate({
      ...candidate,
      freezeDecision: {
        ...decision,
        evidence: [{ evidenceRole: "freeze-evaluation", artifact: identity("out/attempt/forged.json") }],
      },
    }, packet, authority)).toThrow(/artifact path differs/u);
  });

  it("never publishes a radial scientific result with failed negative controls", () => {
    const artifact = { path: "evidence/synthetic.json", byteLength: 1, sha256: "0".repeat(64) };
    const result = {
      schema: "phase10-c0v-radial-result-v2",
      resultId: "c0v-radial-result-v2",
      layerId: "C0V-RADIAL",
      branch: "independent-reference",
      protocol: artifact,
      referenceOrRefusal: artifact,
      attemptLedger: artifact,
      selectedAttemptId: "c0v-radial-produce-20260822-v1",
      attemptDispositionCode: "production-complete",
      witness: artifact,
      evaluation: artifact,
      terminalStatus: "fail",
      scientificDisposition: "fail",
      negativeControlDisposition: "fail",
      resourceDisposition: "within-cap",
      claimBoundary: { allowed: ["measured"], forbidden: ["tuned"] },
    };
    expect(() => parsePhase10C0VS6RadialResultV2(result)).toThrow(/negativeControlDisposition/u);
  });

  it.each([
    "out/file:stream",
    "out/con.txt/value",
    "out/trailing. /value",
    "out/wild*/value",
    "out/question?/value",
  ])("rejects Windows-ambiguous path %s", (path) => {
    expect(() => phase10C0VS6SafeRelativePath(path, "synthetic path")).toThrow();
  });

  it("creates once, reopens exact bytes, and refuses overwrite", () => {
    const root = phase10C0VS6PhysicalRepositoryRoot(temporaryRoot("exclusive"));
    const bytes = new TextEncoder().encode("immutable\n");
    expect(phase10C0VS6WriteExclusiveOrExact(root, "attempt/a.txt", bytes).disposition).toBe("created");
    expect(phase10C0VS6WriteExclusiveOrExact(root, "attempt/a.txt", bytes).disposition).toBe("reopened-exact");
    expect(() => phase10C0VS6WriteExclusiveOrExact(
      root,
      "attempt/a.txt",
      new TextEncoder().encode("changed\n"),
    )).toThrow(/different bytes/u);
  });

  it("accepts growing logs only as exact terminal-byte prefixes", () => {
    const path = "out/attempt/stdout.log";
    const firstBytes = new TextEncoder().encode("first\n");
    const finalBytes = new TextEncoder().encode("first\nsecond\n");
    const firstIdentity = phase10C0VS6ArtifactIdentity(path, firstBytes);
    const finalIdentity = phase10C0VS6ArtifactIdentity(path, finalBytes);
    const observations = Object.freeze([
      Object.freeze({
        observationId: "before-worker",
        observedAt: "2026-08-22T00:00:00.000Z",
        artifacts: Object.freeze([firstIdentity]),
        concurrentBytes: firstIdentity.byteLength,
      }),
      Object.freeze({
        observationId: "terminal",
        observedAt: "2026-08-22T00:00:01.000Z",
        artifacts: Object.freeze([finalIdentity]),
        concurrentBytes: finalIdentity.byteLength,
      }),
    ]);
    expect(phase10C0VS6VerifyAppendOnlyResourceHistory(
      observations,
      new Set([path]),
      () => finalBytes,
    ).get(path)).toEqual(finalIdentity);
    const rewritten = new TextEncoder().encode("other\nsecond\n");
    expect(() => phase10C0VS6VerifyAppendOnlyResourceHistory(
      observations,
      new Set([path]),
      () => rewritten,
    )).toThrow(/terminal live bytes|exact terminal-byte prefix/u);
    expect(() => phase10C0VS6VerifyAppendOnlyResourceHistory(
      Object.freeze([observations[1]!, observations[0]!]),
      new Set([path]),
      () => finalBytes,
    )).toThrow(/truncated/u);
    expect(() => phase10C0VS6VerifyAppendOnlyResourceHistory(
      Object.freeze([
        observations[0]!,
        Object.freeze({ ...observations[1]!, artifacts: Object.freeze([]), concurrentBytes: 0 }),
      ]),
      new Set([path]),
      () => finalBytes,
    )).toThrow(/disappeared/u);
  });

  it("rejects a hard-linked retained artifact", () => {
    const rootPath = temporaryRoot("hardlink-artifact");
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    phase10C0VS6WriteExclusiveOrExact(root, "attempt/a.txt", new TextEncoder().encode("x"));
    linkSync(resolve(rootPath, "attempt/a.txt"), resolve(rootPath, "attempt/b.txt"));
    expect(() => phase10C0VS6ReadUniquePhysicalFile(root, "attempt/a.txt")).toThrow(/unique regular file/u);
  });

  it("publishes through a registered stage and fail-stops on a stranded stage", () => {
    const rootPath = temporaryRoot("publication");
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    const bytes = new TextEncoder().encode("final evidence\n");
    const finalPath = "evidence/final.json";
    const stagePath = "evidence/final.json.stage-attempt-v1";
    mkdirSync(resolve(rootPath, "evidence"), { recursive: false });
    writeFileSync(resolve(rootPath, stagePath), "partial", { flag: "wx" });
    expect(() => phase10C0VS6PublishCrashSafeExclusive(root, finalPath, stagePath, bytes))
      .toThrow(/separately governed recovery/u);
    expect(existsSync(resolve(rootPath, stagePath))).toBe(true);
    expect(existsSync(resolve(rootPath, finalPath))).toBe(false);
    const cleanFinalPath = "evidence/clean-final.json";
    const cleanStagePath = "evidence/clean-final.json.stage-attempt-v1";
    expect(phase10C0VS6PublishCrashSafeExclusive(root, cleanFinalPath, cleanStagePath, bytes).disposition)
      .toBe("created");
    expect(existsSync(resolve(rootPath, cleanStagePath))).toBe(false);
    expect(new Uint8Array(readFileSync(resolve(rootPath, cleanFinalPath)))).toEqual(bytes);
    expect(phase10C0VS6PublishCrashSafeExclusive(root, cleanFinalPath, cleanStagePath, bytes).disposition)
      .toBe("reopened-exact");
  });

  it("retains and refuses a lock whose link identity changes during the action", async () => {
    const rootPath = temporaryRoot("lock-link");
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    await expect(phase10C0VS6WithExclusiveLock(
      root,
      "locks/packet.lock",
      "packet",
      "attempt",
      () => {
        linkSync(resolve(rootPath, "locks/packet.lock"), resolve(rootPath, "locks/second-name.lock"));
        return true;
      },
    )).rejects.toThrow(/lock changed/u);
    expect(existsSync(resolve(rootPath, "locks/packet.lock"))).toBe(true);
  });

  it("holds the lock across a deferred asynchronous action", async () => {
    const rootPath = temporaryRoot("lock-deferred");
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    let release!: () => void;
    const gate = new Promise<void>((resolveGate) => {
      release = resolveGate;
    });
    const first = phase10C0VS6WithExclusiveLock(
      root,
      "locks/packet.lock",
      "packet",
      "attempt",
      async () => gate,
    );
    expect(existsSync(resolve(rootPath, "locks/packet.lock"))).toBe(true);
    await expect(phase10C0VS6WithExclusiveLock(
      root,
      "locks/packet.lock",
      "packet",
      "attempt",
      async () => true,
    )).rejects.toThrow(/concurrent or stale execution/u);
    release();
    await expect(first).resolves.toBeUndefined();
    expect(existsSync(resolve(rootPath, "locks/packet.lock"))).toBe(false);
  });

  it("retains the lock when an asynchronous action rejects", async () => {
    const rootPath = temporaryRoot("lock-rejection");
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    await expect(phase10C0VS6WithExclusiveLock(
      root,
      "locks/packet.lock",
      "packet",
      "attempt",
      async () => {
        throw new Error("synthetic action failure");
      },
    )).rejects.toThrow(/synthetic action failure/u);
    expect(existsSync(resolve(rootPath, "locks/packet.lock"))).toBe(true);
  });

  it("classifies governed caps only from exact parent-monotonic integer duration", () => {
    expect(phase10C0VS6ClassifyGovernedElapsedNanoseconds(300_000_000_000, 300))
      .toBe("complete");
    expect(phase10C0VS6ClassifyGovernedElapsedNanoseconds(300_000_000_001, 300))
      .toBe("registered-cap");
    expect(phase10C0VS6ClassifyGovernedElapsedNanoseconds(14_400_000_000_000, 14400))
      .toBe("complete");
    expect(phase10C0VS6ClassifyGovernedElapsedNanoseconds(14_400_000_000_001, 14400))
      .toBe("registered-cap");
  });

  it("synchronously refuses a next action after event-loop starvation crosses the outer limit", async () => {
    const maximumElapsedNanoseconds = 1_000_000_000;
    const startedAt = 10_000_000_000n;
    let now = startedAt;
    const clock = vi.spyOn(hrtime, "bigint").mockImplementation(() => now);
    let equalityWasAccepted = false;
    let nextActionBegan = false;
    let terminationCalled = false;
    try {
      const run = phase10C0VS6WithOuterInfrastructureWatchdog(
        maximumElapsedNanoseconds,
        (watchdog) => {
          watchdog.registerTerminationTarget(() => {
            terminationCalled = true;
          });
          now = startedAt + BigInt(maximumElapsedNanoseconds);
          watchdog.assertActive();
          equalityWasAccepted = true;

          // Model a synchronous decoder that held the event loop across the deadline.  No timer
          // callback can run between this clock advance and the explicit liveness assertion.
          now += 1_000_000n;
          watchdog.assertActive();
          nextActionBegan = true;
        },
        "starved synchronous parent action",
      );
      await expect(run).rejects.toMatchObject({
        name: "Phase10C0VS6ParentTimeoutError",
        elapsedNanoseconds: maximumElapsedNanoseconds + 1_000_000,
        maximumElapsedNanoseconds,
      });
      expect(equalityWasAccepted).toBe(true);
      expect(nextActionBegan).toBe(false);
      expect(terminationCalled).toBe(true);
    } finally {
      clock.mockRestore();
    }
  });

  it("synchronously caps a governed leaf after event-loop starvation crosses its limit", async () => {
    const leafMaximumElapsedNanoseconds = 300_000_000_000;
    const startedAt = 20_000_000_000n;
    let now = startedAt;
    const clock = vi.spyOn(hrtime, "bigint").mockImplementation(() => now);
    let equalityWasAccepted = false;
    let nextActionBegan = false;
    let terminationCalled = false;
    try {
      const result = await phase10C0VS6WithOuterInfrastructureWatchdog(
        1_000_000_000_000,
        (outer) => phase10C0VS6RunGovernedLeafWithWatchdog(
          outer,
          300,
          () => {
            terminationCalled = true;
          },
          (_signal, assertActive) => {
            now = startedAt + BigInt(leafMaximumElapsedNanoseconds);
            assertActive();
            equalityWasAccepted = true;

            // The event loop has not run the limit-plus-one-millisecond timer. The leaf's own
            // synchronous assertion must nevertheless classify the exact monotonic overrun.
            now += 1_000_000n;
            assertActive();
            nextActionBegan = true;
            throw new Error("unreachable governed action after cap");
          },
        ),
        "starved governed-leaf parent",
      );
      expect(result).toEqual({
        terminalState: "registered-cap",
        startedAtMonotonicNanoseconds: startedAt,
        finishedAtMonotonicNanoseconds:
          startedAt + BigInt(leafMaximumElapsedNanoseconds + 1_000_000),
        elapsedNanoseconds: leafMaximumElapsedNanoseconds + 1_000_000,
        value: null,
      });
      expect(equalityWasAccepted).toBe(true);
      expect(nextActionBegan).toBe(false);
      expect(terminationCalled).toBe(true);
    } finally {
      clock.mockRestore();
    }
  });

  it("classifies a governed result at its authenticated arrival boundary, not promise settlement", async () => {
    const leafMaximumElapsedNanoseconds = 300_000_000_000;
    const startedAt = 30_000_000_000n;
    let now = startedAt;
    const clock = vi.spyOn(hrtime, "bigint").mockImplementation(() => now);
    try {
      const result = await phase10C0VS6WithOuterInfrastructureWatchdog(
        1_000_000_000_000,
        (outer) => phase10C0VS6RunGovernedLeafWithWatchdog(
          outer,
          300,
          () => {
            throw new Error("timely completed leaf must not be terminated");
          },
          (_signal, _assertActive, complete, issuedStartedAt) => {
            expect(issuedStartedAt).toBe(startedAt);
            now = startedAt + BigInt(leafMaximumElapsedNanoseconds);
            const boundary = complete("captured-result-line");
            expect(boundary).toMatchObject({
              startedAtMonotonicNanoseconds: startedAt,
              finishedAtMonotonicNanoseconds: now,
              elapsedNanoseconds: leafMaximumElapsedNanoseconds,
            });
            // Simulate parent microtask/decoder delay after the raw result line was captured.
            now += 1_000_000n;
            return boundary;
          },
        ),
        "authenticated governed completion parent",
      );
      expect(result).toEqual({
        terminalState: "complete",
        startedAtMonotonicNanoseconds: startedAt,
        finishedAtMonotonicNanoseconds:
          startedAt + BigInt(leafMaximumElapsedNanoseconds),
        elapsedNanoseconds: leafMaximumElapsedNanoseconds,
        value: "captured-result-line",
      });
    } finally {
      clock.mockRestore();
    }
  });

  it("rejects a caller-forged governed completion boundary and quiesces the child", async () => {
    let terminationCalled = false;
    await expect(phase10C0VS6WithOuterInfrastructureWatchdog(
      1_000_000_000_000,
      (outer) => phase10C0VS6RunGovernedLeafWithWatchdog(
        outer,
        300,
        () => {
          terminationCalled = true;
        },
        () => Object.freeze({
          value: "forged",
          startedAtMonotonicNanoseconds: 0n,
          finishedAtMonotonicNanoseconds: 1n,
          elapsedNanoseconds: 1,
        }),
      ),
      "forged governed completion parent",
    )).rejects.toThrow(/no exact parent-issued completion boundary/u);
    expect(terminationCalled).toBe(true);
  });

  it("keeps registered-cap elapsed at the authenticated timer boundary, excluding quiescence", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const startedAt = 40_000_000_000n;
    const maximumElapsedNanoseconds = 300_000_000_000;
    let now = startedAt;
    const clock = vi.spyOn(hrtime, "bigint").mockImplementation(() => now);
    let releaseAction!: () => void;
    const actionGate = new Promise<void>((resolveGate) => {
      releaseAction = resolveGate;
    });
    try {
      const run = phase10C0VS6WithOuterInfrastructureWatchdog(
        1_000_000_000_000,
        (outer) => phase10C0VS6RunGovernedLeafWithWatchdog(
          outer,
          300,
          () => {
            // Termination/quiescence occurs after the exact timer boundary and must not be
            // charged to the governed invocation.
            now += 50_000_000_000n;
            releaseAction();
          },
          async () => {
            await actionGate;
            throw new Error("terminated governed action");
          },
        ),
        "cap-boundary accounting parent",
      );
      now = startedAt + BigInt(maximumElapsedNanoseconds) + 1_000_000n;
      await vi.advanceTimersByTimeAsync(300_001);
      await expect(run).resolves.toEqual({
        terminalState: "registered-cap",
        startedAtMonotonicNanoseconds: startedAt,
        finishedAtMonotonicNanoseconds:
          startedAt + BigInt(maximumElapsedNanoseconds + 1_000_000),
        elapsedNanoseconds: maximumElapsedNanoseconds + 1_000_000,
        value: null,
      });
    } finally {
      clock.mockRestore();
      vi.useRealTimers();
    }
  });

  it("awaits timeout quiescence, prevents later writes, and retains both locks", async () => {
    const rootPath = temporaryRoot("outer-watchdog");
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    let terminationCalled = false;
    let attemptedPostTimeoutWrite = false;
    let releaseAction!: () => void;
    const actionGate = new Promise<void>((resolveGate) => {
      releaseAction = resolveGate;
    });
    await expect(phase10C0VS6WithExclusiveLock(
      root,
      "locks/package.lock",
      "package",
      "attempt",
      async () => phase10C0VS6WithExclusiveLock(
        root,
        "locks/packet.lock",
        "packet",
        "attempt",
        async () => phase10C0VS6WithOuterInfrastructureWatchdog(
          1_000_000,
          async (watchdog) => {
            const releaseTarget = watchdog.registerTerminationTarget(async () => {
              terminationCalled = true;
              releaseAction();
            });
            try {
              await actionGate;
              watchdog.assertActive();
              attemptedPostTimeoutWrite = true;
              write(rootPath, "evidence/forbidden-after-timeout.json", "{}\n");
            } finally {
              releaseTarget();
            }
          },
          "synthetic locked packet action",
        ),
      ),
    )).rejects.toThrow(/parent-monotonic limit/u);
    expect(terminationCalled).toBe(true);
    expect(attemptedPostTimeoutWrite).toBe(false);
    expect(existsSync(resolve(rootPath, "evidence/forbidden-after-timeout.json"))).toBe(false);
    expect(existsSync(resolve(rootPath, "locks/package.lock"))).toBe(true);
    expect(existsSync(resolve(rootPath, "locks/packet.lock"))).toBe(true);
  });

  it("awaits action quiescence even when the outer termination callback rejects", async () => {
    const rootPath = temporaryRoot("outer-watchdog-rejecting-terminator");
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    let actionSettled = false;
    let releaseAction!: () => void;
    const actionGate = new Promise<void>((resolveGate) => {
      releaseAction = resolveGate;
    });
    await expect(phase10C0VS6WithExclusiveLock(
      root,
      "locks/package.lock",
      "package",
      "attempt",
      async () => phase10C0VS6WithExclusiveLock(
        root,
        "locks/packet.lock",
        "packet",
        "attempt",
        async () => phase10C0VS6WithOuterInfrastructureWatchdog(
          1_000_000,
          async (watchdog) => {
            const releaseTarget = watchdog.registerTerminationTarget(async () => {
              releaseAction();
              throw new Error("synthetic termination failure");
            });
            try {
              await actionGate;
              await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 5));
              watchdog.assertActive();
              write(rootPath, "evidence/forbidden-after-rejected-termination.json", "{}\n");
            } finally {
              actionSettled = true;
              releaseTarget();
            }
          },
          "synthetic rejecting termination action",
        ),
      ),
    )).rejects.toThrow(/synthetic termination failure/u);
    expect(actionSettled).toBe(true);
    expect(existsSync(resolve(rootPath, "evidence/forbidden-after-rejected-termination.json"))).toBe(false);
    expect(existsSync(resolve(rootPath, "locks/package.lock"))).toBe(true);
    expect(existsSync(resolve(rootPath, "locks/packet.lock"))).toBe(true);
  });

  it("awaits governed-leaf quiescence when a rejecting terminator fires at limit plus one millisecond", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "hrtime"] });
    try {
      let releaseLeaf!: () => void;
      const leafGate = new Promise<void>((resolveGate) => {
        releaseLeaf = resolveGate;
      });
      let actionSettled = false;
      let attemptedPostTimeoutWrite = false;
      const run = phase10C0VS6WithOuterInfrastructureWatchdog(
        1_000_000_000_000,
        async (outer) => phase10C0VS6RunGovernedLeafWithWatchdog(
          outer,
          300,
          async () => {
            releaseLeaf();
            throw new Error("synthetic leaf termination failure");
          },
          async (_signal, assertActive) => {
            try {
              await leafGate;
              await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 5));
              assertActive();
              attemptedPostTimeoutWrite = true;
              throw new Error("unreachable governed action after timeout");
            } finally {
              actionSettled = true;
            }
          },
        ),
        "synthetic leaf parent",
      );
      const rejected = expect(run).rejects.toThrow(/synthetic leaf termination failure/u);
      await vi.advanceTimersByTimeAsync(300_010);
      await rejected;
      expect(actionSettled).toBe(true);
      expect(attemptedPostTimeoutWrite).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("terminates and awaits an active child when the outer action rejects", async () => {
    let announceTermination!: () => void;
    const terminationEntered = new Promise<void>((resolveEntered) => {
      announceTermination = resolveEntered;
    });
    let releaseChild!: () => void;
    const childQuiescence = new Promise<void>((resolveChild) => {
      releaseChild = resolveChild;
    });
    let childQuiesced = false;
    const run = phase10C0VS6WithOuterInfrastructureWatchdog(
      1_000_000_000,
      (outer) => {
        outer.registerTerminationTarget(async () => {
          announceTermination();
          await childQuiescence;
          childQuiesced = true;
        });
        throw new Error("synthetic primary outer rejection");
      },
      "ordinary-rejection outer action",
    );
    const outcome = run.then(
      () => Object.freeze({ kind: "resolved" as const, error: null }),
      (error: unknown) => Object.freeze({ kind: "rejected" as const, error }),
    );
    await terminationEntered;
    let wrapperSettled = false;
    void outcome.then(() => {
      wrapperSettled = true;
    });
    await Promise.resolve();
    expect(wrapperSettled).toBe(false);
    releaseChild();
    const settled = await outcome;
    expect(settled.kind).toBe("rejected");
    expect(settled.error).toBeInstanceOf(Error);
    expect((settled.error as Error).message).toMatch(/synthetic primary outer rejection/u);
    expect(childQuiesced).toBe(true);
  });

  it("terminates and awaits a child left active by an otherwise completed outer action", async () => {
    let announceTermination!: () => void;
    const terminationEntered = new Promise<void>((resolveEntered) => {
      announceTermination = resolveEntered;
    });
    let releaseChild!: () => void;
    const childQuiescence = new Promise<void>((resolveChild) => {
      releaseChild = resolveChild;
    });
    const run = phase10C0VS6WithOuterInfrastructureWatchdog(
      1_000_000_000,
      (outer) => {
        outer.registerTerminationTarget(async () => {
          announceTermination();
          await childQuiescence;
        });
        return "must-not-escape";
      },
      "active-target outer action",
    );
    const outcome = run.then(
      () => Object.freeze({ kind: "resolved" as const }),
      (error: unknown) => Object.freeze({ kind: "rejected" as const, error }),
    );
    await terminationEntered;
    let wrapperSettled = false;
    void outcome.then(() => {
      wrapperSettled = true;
    });
    await Promise.resolve();
    expect(wrapperSettled).toBe(false);
    releaseChild();
    const settled = await outcome;
    expect(settled.kind).toBe("rejected");
    if (settled.kind === "rejected") {
      expect(settled.error).toBeInstanceOf(Error);
      expect((settled.error as Error).message).toMatch(/termination target remained registered/u);
    }
  });

  it("terminates and awaits governed-leaf child quiescence on ordinary action rejection", async () => {
    let announceTermination!: () => void;
    const terminationEntered = new Promise<void>((resolveEntered) => {
      announceTermination = resolveEntered;
    });
    let releaseChild!: () => void;
    const childQuiescence = new Promise<void>((resolveChild) => {
      releaseChild = resolveChild;
    });
    let childQuiesced = false;
    const run = phase10C0VS6WithOuterInfrastructureWatchdog(
      1_000_000_000,
      async (outer) => phase10C0VS6RunGovernedLeafWithWatchdog(
        outer,
        300,
        async () => {
          announceTermination();
          await childQuiescence;
          childQuiesced = true;
        },
        () => {
          throw new Error("synthetic primary leaf rejection");
        },
      ),
      "ordinary-rejection leaf parent",
    );
    const outcome = run.then(
      () => Object.freeze({ kind: "resolved" as const, error: null }),
      (error: unknown) => Object.freeze({ kind: "rejected" as const, error }),
    );
    await terminationEntered;
    let wrapperSettled = false;
    void outcome.then(() => {
      wrapperSettled = true;
    });
    await Promise.resolve();
    expect(wrapperSettled).toBe(false);
    releaseChild();
    const settled = await outcome;
    expect(settled.kind).toBe("rejected");
    expect(settled.error).toBeInstanceOf(Error);
    expect((settled.error as Error).message).toMatch(/synthetic primary leaf rejection/u);
    expect(childQuiesced).toBe(true);
  });

  it("serializes distinct packets under the catalogue-bound package lock", async () => {
    const rootPath = temporaryRoot("package-lock-deferred");
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    for (const path of [
      "research/phase10-execution-v2/recovery-v5/recovery-authority.json",
      "research/phase10-execution-v2/recovery-v5/packet-catalogue.json",
      "research/phase10-execution-v2/recovery-v5/packets/c0v-moving-produce/protocol.json",
      "research/phase10-execution-v2/recovery-v5/packets/c0v-radial-produce/protocol.json",
    ]) {
      const destination = resolve(rootPath, path);
      mkdirSync(resolve(destination, ".."), { recursive: true });
      writeFileSync(destination, readFileSync(resolve(process.cwd(), path)), { flag: "wx" });
    }
    copyRecoveryPredecessorState(rootPath);
    let release!: () => void;
    const gate = new Promise<void>((resolveGate) => {
      release = resolveGate;
    });
    const packageLockPath = "out/phase10-execution-v2/recovery-v5/locks/package.lock";
    const movingLockPath = "out/phase10-execution-v2/recovery-v5/locks/c0v-moving-produce.lock";
    let authorityReadObserved = false;
    let capturedActive:
      | Readonly<{ locks: Parameters<typeof phase10C0VS6AssertActiveLockedPacketAuthority>[1];
        authority: Parameters<typeof phase10C0VS6AssertActiveLockedPacketAuthority>[2] }>
      | null = null;
    const first = phase10C0VS6WithPackageAndPacketLocks(
      root,
      "c0v-moving-produce",
      "run",
      async (locks, authority) => {
        expect(authority.packet.packetId).toBe("c0v-moving-produce");
        capturedActive = Object.freeze({ locks, authority });
        expect(() => phase10C0VS6AssertActiveLockedPacketAuthority(
          root,
          locks,
          authority,
          "run",
        )).not.toThrow();
        expect(() => phase10C0VS6AssertActiveLockedPacketAuthority(
          root,
          locks,
          authority,
          "verify-existing",
        )).toThrow(/authority\/mode was not issued/u);
        return gate;
      },
      () => {
        expect(existsSync(resolve(rootPath, packageLockPath))).toBe(true);
        expect(existsSync(resolve(rootPath, movingLockPath))).toBe(true);
        authorityReadObserved = true;
      },
    );
    expect(authorityReadObserved).toBe(true);
    expect(existsSync(resolve(rootPath, packageLockPath))).toBe(true);
    expect(existsSync(resolve(rootPath, movingLockPath))).toBe(true);
    await expect(phase10C0VS6WithPackageAndPacketLocks(
      root,
      "c0v-radial-produce",
      "run",
      async () => true,
    )).rejects.toThrow(/concurrent or stale execution/u);
    expect(existsSync(resolve(rootPath, "out/phase10-execution-v2/recovery-v5/locks/c0v-radial-produce.lock"))).toBe(false);
    release();
    await expect(first).resolves.toBeUndefined();
    expect(existsSync(resolve(rootPath, packageLockPath))).toBe(false);
    expect(existsSync(resolve(rootPath, movingLockPath))).toBe(false);
    expect(capturedActive).not.toBeNull();
    expect(() => phase10C0VS6AssertActiveLockedPacketAuthority(
      root,
      capturedActive!.locks,
      capturedActive!.authority,
      "run",
    )).toThrow(/not issued by the active package-lock callback/u);
  });

  it("rejects same-attempt reruns and partial remnants before invoking packet work", async () => {
    const makeLockedRoot = (label: string): { rootPath: string; root: ReturnType<typeof phase10C0VS6PhysicalRepositoryRoot> } => {
      const rootPath = temporaryRoot(label);
      for (const path of [
        "research/phase10-execution-v2/recovery-v5/recovery-authority.json",
        "research/phase10-execution-v2/recovery-v5/packet-catalogue.json",
        "research/phase10-execution-v2/recovery-v5/packets/c0v-moving-produce/protocol.json",
      ]) {
        const destination = resolve(rootPath, path);
        mkdirSync(resolve(destination, ".."), { recursive: true });
        writeFileSync(destination, readFileSync(resolve(process.cwd(), path)), { flag: "wx" });
      }
      copyRecoveryPredecessorState(rootPath);
      return { rootPath, root: phase10C0VS6PhysicalRepositoryRoot(rootPath) };
    };

    const completed = makeLockedRoot("same-attempt-complete");
    const completedPreflight = "evidence/phase10-obligation-preflight-v2/packets/c0v-moving-produce/preflight.json";
    mkdirSync(resolve(completed.rootPath, completedPreflight, ".."), { recursive: true });
    writeFileSync(resolve(completed.rootPath, completedPreflight), "already complete\n", { flag: "wx" });
    let completedActionCalled = false;
    await expect(phase10C0VS6WithPackageAndPacketLocks(
      completed.root,
      "c0v-moving-produce",
      "run",
      async () => {
        completedActionCalled = true;
      },
    )).rejects.toThrow(/same-attempt execution is forbidden/u);
    expect(completedActionCalled).toBe(false);
    expect(existsSync(resolve(completed.rootPath, "out/phase10-execution-v2/recovery-v5/locks/package.lock"))).toBe(true);
    expect(existsSync(resolve(completed.rootPath, "out/phase10-execution-v2/recovery-v5/locks/c0v-moving-produce.lock"))).toBe(true);

    const partial = makeLockedRoot("same-attempt-partial");
    mkdirSync(resolve(partial.rootPath, "out/phase10-execution-v2/recovery-v5/attempts/c0v-moving-produce"), { recursive: true });
    let partialActionCalled = false;
    await expect(phase10C0VS6WithPackageAndPacketLocks(
      partial.root,
      "c0v-moving-produce",
      "run",
      async () => {
        partialActionCalled = true;
      },
    )).rejects.toThrow(/same-attempt execution is forbidden/u);
    expect(partialActionCalled).toBe(false);

    const verify = makeLockedRoot("same-attempt-verify");
    mkdirSync(resolve(verify.rootPath, "out/phase10-execution-v2/recovery-v5/attempts/c0v-moving-produce"), { recursive: true });
    await expect(phase10C0VS6WithPackageAndPacketLocks(
      verify.root,
      "c0v-moving-produce",
      "verify-existing",
      async (locks, authority) => {
        expect(() => phase10C0VS6AssertActiveLockedPacketAuthority(
          verify.root,
          locks,
          authority,
          "verify-existing",
        )).not.toThrow();
        expect(() => phase10C0VS6AssertActiveLockedPacketAuthority(
          verify.root,
          locks,
          authority,
          "run",
        )).toThrow(/authority\/mode was not issued/u);
        return authority.packet.packetId;
      },
    )).resolves.toBe("c0v-moving-produce");
  });

  it("raw-derives every nonproduce cap prefix before terminal materialization", () => {
    const packetIds = [
      "a-p-c0v-s6",
      "c0v-moving-publish",
      "c0v-radial-publish",
      "c0v-static-publish",
      "c0v-aggregate",
    ] as const;
    let verifiedCaps = 0;
    for (const packetId of packetIds) {
      const bytes = new Uint8Array(readFileSync(resolve(
        process.cwd(),
        `research/phase10-execution-v2/recovery-v5/packets/${packetId}/protocol.json`,
      )));
      const packet = parsePhase10C0VS6PacketProtocol(
        parsePhase10C0VS6PrettyJsonBytes(bytes, `${packetId} test protocol`),
      );
      for (const binding of packet.verificationRegisteredCapBindings) {
        const subroutes = packet.terminalSubroutes.filter((entry) =>
          entry.classificationConditionIds.includes(binding.conditionId));
        expect(subroutes).toHaveLength(1);
        const cappedIndex = packet.verificationInvocationRoster.findIndex((entry) =>
          entry.invocationId === binding.invocationId);
        expect(cappedIndex).toBeGreaterThanOrEqual(0);
        const roster = packet.verificationInvocationRoster.slice(0, cappedIndex + 1);
        const events: Phase10C0VS6WorkerInvocationEventRecord[] = [];
        let epoch = Date.parse("2020-01-01T00:00:00.000Z");
        let monotonicOffsetNanoseconds = 0;
        const instant = () => new Date(epoch).toISOString();
        events.push({
          schema: "phase10-c0v-worker-invocation-row-v1", sequence: 0, observedAt: instant(),
          monotonicOffsetNanoseconds,
          event: "worker-started", invocationId: null, callableId: null, negativeControlId: null,
          invocationClass: null, registeredWallSecondsMaximum: null, terminalState: "running",
        });
        for (const [index, invocation] of roster.entries()) {
          events.push({
            schema: "phase10-c0v-worker-invocation-row-v1", sequence: events.length, observedAt: instant(),
            monotonicOffsetNanoseconds,
            event: "invocation-started", ...invocation, terminalState: "running",
          });
          const elapsedMilliseconds = index === cappedIndex ? 14_400_001 : 1;
          epoch += elapsedMilliseconds;
          monotonicOffsetNanoseconds += elapsedMilliseconds * 1_000_000;
          events.push({
            schema: "phase10-c0v-worker-invocation-row-v1", sequence: events.length, observedAt: instant(),
            monotonicOffsetNanoseconds,
            event: "invocation-finished", ...invocation,
            terminalState: index === cappedIndex ? "registered-cap" : "complete",
          });
        }
        events.push({
          schema: "phase10-c0v-worker-invocation-row-v1", sequence: events.length, observedAt: instant(),
          monotonicOffsetNanoseconds,
          event: "worker-stopped", invocationId: null, callableId: null, negativeControlId: null,
          invocationClass: null, registeredWallSecondsMaximum: null, terminalState: "registered-cap",
        });
        const eventBytes = phase10C0VS6WorkerInvocationEventBytes(events, packet.workerInvocationContract);
        const evaluation = independentlyEvaluatePhase10C0VS6PacketWorkerInvocations(
          eventBytes,
          packet,
          subroutes[0]!.subrouteId,
          Date.parse("2021-01-01T00:00:00.000Z"),
        );
        expect(evaluation.invocationRecords).toHaveLength(cappedIndex + 1);
        expect(evaluation.invocationRecords.at(-1)).toMatchObject({
          invocationId: binding.invocationId,
          terminalState: "registered-cap",
          wallSeconds: 14_400.001,
        });
        const equalityEvents = events.map((entry) => ({ ...entry }));
        const cappedFinishIndex = 2 + 2 * cappedIndex;
        const cappedStart = Date.parse(equalityEvents[cappedFinishIndex - 1]!.observedAt);
        equalityEvents[cappedFinishIndex]!.observedAt = new Date(cappedStart + 14_400_000).toISOString();
        equalityEvents[cappedFinishIndex]!.monotonicOffsetNanoseconds =
          equalityEvents[cappedFinishIndex - 1]!.monotonicOffsetNanoseconds + 14_400_000_000_000;
        equalityEvents.at(-1)!.observedAt = equalityEvents[cappedFinishIndex]!.observedAt;
        equalityEvents.at(-1)!.monotonicOffsetNanoseconds =
          equalityEvents[cappedFinishIndex]!.monotonicOffsetNanoseconds;
        const equalityBytes = phase10C0VS6WorkerInvocationEventBytes(
          equalityEvents,
          packet.workerInvocationContract,
        );
        expect(() => independentlyEvaluatePhase10C0VS6PacketWorkerInvocations(
          equalityBytes,
          packet,
          subroutes[0]!.subrouteId,
          Date.parse("2021-01-01T00:00:00.000Z"),
        )).toThrow(/strict cap state/u);
        verifiedCaps += 1;
      }
    }
    expect(verifiedCaps).toBeGreaterThan(0);
  });

  it("treats governed retained roots as a closed physical world", () => {
    const rootPath = temporaryRoot("closed-retained-root");
    write(rootPath, "owned/expected.bin", "expected\n");
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    const expectedBytes = new Uint8Array(readFileSync(resolve(rootPath, "owned/expected.bin")));
    const expected = phase10C0VS6ArtifactIdentity("owned/expected.bin", expectedBytes);
    expect(phase10C0VS6AssertExactPhysicalRootCensus(root, ["owned"], [expected]))
      .toEqual([expected]);
    write(rootPath, "owned/unknown.bin", "unregistered\n");
    expect(() => phase10C0VS6AssertExactPhysicalRootCensus(root, ["owned"], [expected]))
      .toThrow(/census identity roster cardinality differs/u);
  });

  it("binds resolution metadata to the exact HEAD blob while accepting only Git-equivalent EOLs", () => {
    const root = importAuditWorkspace("export function rootExport(): number { return 1; }\n");
    const lf = readFileSync(resolve(root, "package.json"), "utf8").replaceAll("\r\n", "\n");
    const canonical = phase10C0VS6GitCanonicalWorktreeIdentity(root, "package.json");
    writeFileSync(resolve(root, "package.json"), lf.replaceAll("\n", "\r\n"));
    expect(phase10C0VS6GitCanonicalWorktreeIdentity(root, "package.json")).toEqual(canonical);
    writeFileSync(resolve(root, "package.json"), lf.replace("\n", " \n").replaceAll("\n", "\r\n"));
    expect(() => phase10C0VS6GitCanonicalWorktreeIdentity(root, "package.json"))
      .toThrow(/do not Git-normalize to the exact launch-HEAD blob/u);
  });

  it("rejects hard-linked source closure bytes and alternate loaders", () => {
    const hardLinkRoot = importAuditWorkspace("export function rootExport(): number { return 1; }\n");
    linkSync(resolve(hardLinkRoot, "runner/root.ts"), resolve(hardLinkRoot, "runner/root-copy.ts"));
    expect(() => phase10C0VS6ImportClosure(hardLinkRoot, "runner/root.ts")).toThrow(/unique regular file/u);

    const loaderRoot = importAuditWorkspace(
      "export function rootExport(): unknown { return process.getBuiltinModule('node:fs'); }\n",
    );
    expect(() => phase10C0VS6ImportClosure(loaderRoot, "runner/root.ts"))
      .toThrow(/(?:alternate code loader|loader-capable global)/u);

    const memberLoaderRoot = importAuditWorkspace(
      "class Loader { require(value: string): string { return value; } }\n" +
      "export function rootExport(): string { return new Loader().require('node:fs'); }\n",
    );
    expect(() => phase10C0VS6ImportClosure(memberLoaderRoot, "runner/root.ts"))
      .toThrow(/alternate code loader reference require/u);

    const aliasLoaderRoot = importAuditWorkspace(
      "const load = process.getBuiltinModule;\nexport function rootExport(): unknown { return load('node:fs'); }\n",
    );
    expect(() => phase10C0VS6ImportClosure(aliasLoaderRoot, "runner/root.ts"))
      .toThrow(/(?:alternate code loader reference getBuiltinModule|loader-capable global reference process)/u);

    const computedProcessLoaderRoot = importAuditWorkspace(
      "const key = 'get' + 'BuiltinModule';\n" +
      "const load = (process as unknown as Record<string, unknown>)[key];\n" +
      "export const rootExport = load;\n",
    );
    expect(() => phase10C0VS6ImportClosure(computedProcessLoaderRoot, "runner/root.ts"))
      .toThrow(/(?:alternate code loader reference getBuiltinModule|loader-capable global reference process)/u);

    const computedGlobalFunctionRoot = importAuditWorkspace(
      "const key = 'Fun' + 'ction';\n" +
      "export const rootExport = (globalThis as unknown as Record<string, unknown>)[key];\n",
    );
    expect(() => phase10C0VS6ImportClosure(computedGlobalFunctionRoot, "runner/root.ts"))
      .toThrow(/(?:alternate code loader reference Function|loader-capable global reference globalThis)/u);

    const reflectedLoaderRoot = importAuditWorkspace(
      "const lookup = Reflect.get;\nexport const rootExport = lookup(process, 'pid');\n",
    );
    expect(() => phase10C0VS6ImportClosure(reflectedLoaderRoot, "runner/root.ts"))
      .toThrow(/loader-capable global reference Reflect/u);

    const constructorLoaderRoot = importAuditWorkspace(
      "export const rootExport = (() => {}).constructor(\"return import('node:fs')\");\n",
    );
    expect(() => phase10C0VS6ImportClosure(constructorLoaderRoot, "runner/root.ts"))
      .toThrow(/alternate code loader reference constructor/u);

    const computedConstructorLoaderRoot = importAuditWorkspace(
      "const key = 'con' + 'structor';\nexport const rootExport = (() => {})[key];\n",
    );
    expect(() => phase10C0VS6ImportClosure(computedConstructorLoaderRoot, "runner/root.ts"))
      .toThrow(/alternate code loader reference constructor/u);

    const prototypeConstructionRoot = importAuditWorkspace(
      "export const rootExport = Object.setPrototypeOf({}, {});\n",
    );
    expect(() => phase10C0VS6ImportClosure(prototypeConstructionRoot, "runner/root.ts"))
      .toThrow(/prototype-construction API/u);
  });

  it("rejects a coherently changed assume-unchanged manifest and dependency", () => {
    const root = temporaryRoot("head-bound-manifest");
    git(root, ["init"]);
    git(root, ["config", "user.email", "phase10@example.invalid"]);
    git(root, ["config", "user.name", "Phase 10 Synthetic"]);
    const itemPath = "evidence/item.json";
    mkdirSync(resolve(root, "evidence"), { recursive: false });
    const originalItem = new TextEncoder().encode("{\"value\":1}\n");
    const originalIdentity = phase10C0VS6ArtifactIdentity(itemPath, originalItem);
    writeFileSync(resolve(root, itemPath), originalItem, { flag: "wx" });
    const manifest = (identityValue: Phase10C0VS6ArtifactIdentity): string => `${JSON.stringify({
      schema: "phase6-evidence-manifest-v1",
      movedFrom: "synthetic",
      movedTo: "evidence/",
      note: "synthetic",
      fileCount: 1,
      totalBytes: identityValue.byteLength,
      files: { "item.json": { bytes: identityValue.byteLength, sha256: identityValue.sha256 } },
    }, null, 1)}\n`;
    writeFileSync(resolve(root, "evidence/MANIFEST.json"), manifest(originalIdentity), { flag: "wx" });
    git(root, ["add", "evidence/MANIFEST.json", itemPath]);
    git(root, ["commit", "-m", "synthetic manifest authority"]);
    const head = git(root, ["rev-parse", "HEAD"]);
    expect(phase10C0VS6HeadBoundManifestEntries(root, head).get(itemPath)).toEqual(originalIdentity);
    const changedItem = new TextEncoder().encode("{\"value\":2}\n");
    const changedIdentity = phase10C0VS6ArtifactIdentity(itemPath, changedItem);
    writeFileSync(resolve(root, itemPath), changedItem);
    writeFileSync(resolve(root, "evidence/MANIFEST.json"), manifest(changedIdentity));
    git(root, ["update-index", "--assume-unchanged", "evidence/MANIFEST.json", itemPath]);
    expect(() => phase10C0VS6HeadBoundManifestEntries(root, head)).toThrow(/launch HEAD/u);
  });

  it("reopens a historical launch manifest after a later evidence-manifest commit", () => {
    const root = temporaryRoot("historical-head-manifest");
    git(root, ["init"]);
    git(root, ["config", "user.email", "phase10@example.invalid"]);
    git(root, ["config", "user.name", "Phase 10 Synthetic"]);
    mkdirSync(resolve(root, "evidence"), { recursive: false });
    const firstPath = "evidence/first.json";
    const firstBytes = new TextEncoder().encode("{\"value\":1}\n");
    const firstIdentity = phase10C0VS6ArtifactIdentity(firstPath, firstBytes);
    writeFileSync(resolve(root, firstPath), firstBytes, { flag: "wx" });
    const manifest = (entries: readonly Phase10C0VS6ArtifactIdentity[]): Uint8Array =>
      new TextEncoder().encode(`${JSON.stringify({
        schema: "phase6-evidence-manifest-v1",
        movedFrom: "synthetic",
        movedTo: "evidence/",
        note: "synthetic",
        fileCount: entries.length,
        totalBytes: entries.reduce((sum, entry) => sum + entry.byteLength, 0),
        files: Object.fromEntries(entries.map((entry) => [
          entry.path.slice("evidence/".length),
          { bytes: entry.byteLength, sha256: entry.sha256 },
        ])),
      }, null, 1)}\n`);
    const firstManifestBytes = manifest([firstIdentity]);
    writeFileSync(resolve(root, "evidence/MANIFEST.json"), firstManifestBytes, { flag: "wx" });
    git(root, ["add", "evidence/MANIFEST.json", firstPath]);
    git(root, ["commit", "-m", "first manifest"]);
    const firstHead = git(root, ["rev-parse", "HEAD"]);

    const secondPath = "evidence/second.json";
    const secondBytes = new TextEncoder().encode("{\"value\":2}\n");
    const secondIdentity = phase10C0VS6ArtifactIdentity(secondPath, secondBytes);
    writeFileSync(resolve(root, secondPath), secondBytes, { flag: "wx" });
    writeFileSync(resolve(root, "evidence/MANIFEST.json"), manifest([firstIdentity, secondIdentity]));
    git(root, ["add", "evidence/MANIFEST.json", secondPath]);
    git(root, ["commit", "-m", "later manifest suffix"]);

    expect(() => phase10C0VS6HeadBoundManifestEntries(root, firstHead)).toThrow(/launch HEAD/u);
    const historical = phase10C0VS6HistoricalHeadManifest(root, firstHead);
    expect(historical.identity).toEqual(
      phase10C0VS6ArtifactIdentity("evidence/MANIFEST.json", firstManifestBytes),
    );
    expect([...historical.entries.entries()]).toEqual([[firstPath, firstIdentity]]);
  });

  it("binds the retained preflight manifest identity to the recorded launch HEAD bytes", () => {
    const root = temporaryRoot("head-bound-preflight-manifest");
    git(root, ["init"]);
    git(root, ["config", "user.email", "phase10@example.invalid"]);
    git(root, ["config", "user.name", "Phase 10 Synthetic"]);
    mkdirSync(resolve(root, "evidence"), { recursive: false });
    const manifestBytes = new TextEncoder().encode(`${JSON.stringify({
      schema: "phase6-evidence-manifest-v1",
      movedFrom: "synthetic",
      movedTo: "evidence/",
      note: "synthetic",
      fileCount: 0,
      totalBytes: 0,
      files: {},
    }, null, 1)}\n`);
    writeFileSync(resolve(root, "evidence/MANIFEST.json"), manifestBytes, { flag: "wx" });
    git(root, ["add", "evidence/MANIFEST.json"]);
    git(root, ["commit", "-m", "synthetic manifest identity"]);
    const head = git(root, ["rev-parse", "HEAD"]);
    const identity = phase10C0VS6ArtifactIdentity("evidence/MANIFEST.json", manifestBytes);
    const preflight = {
      observed: { head, evidenceManifest: identity },
    } as unknown as Parameters<typeof phase10C0VS6ValidateHeadBoundPreflightManifest>[1];
    expect(phase10C0VS6ValidateHeadBoundPreflightManifest(root, preflight).size).toBe(0);
    const forgedPreflight = {
      observed: {
        head,
        evidenceManifest: { ...identity, sha256: "0".repeat(64) },
      },
    } as unknown as Parameters<typeof phase10C0VS6ValidateHeadBoundPreflightManifest>[1];
    expect(() => phase10C0VS6ValidateHeadBoundPreflightManifest(root, forgedPreflight))
      .toThrow(/retained preflight evidence manifest/u);
  });

  it("materializes only an exact-byte descriptor-stable filesystem-policy artifact refusal", () => {
    const root = temporaryRoot("artifact-filesystem-policy");
    const sciencePath = "research/science.json";
    const referencePath = "evidence/reference.json";
    write(root, sciencePath, "{\"science\":true}\n");
    write(root, referencePath, "{\"reference\":true}\n");
    const scienceBytes = new Uint8Array(readFileSync(resolve(root, sciencePath)));
    const referenceBytes = new Uint8Array(readFileSync(resolve(root, referencePath)));
    const packet = {
      packetId: "c0v-radial-produce",
      bindings: {
        scienceProtocol: phase10C0VS6ArtifactIdentity(sciencePath, scienceBytes),
        referenceOrRefusal: phase10C0VS6ArtifactIdentity(referencePath, referenceBytes),
      },
    } as unknown as Phase10C0VS6PacketProtocol;
    linkSync(resolve(root, sciencePath), resolve(root, "research/science-hardlink.json"));
    const failures = phase10C0VS6ObserveRadialArtifactFailures(root, packet);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({
      artifactRole: "science-protocol",
      observed: packet.bindings.scienceProtocol,
      failureClass: "filesystem-object-policy-failure",
      filesystemObservation: {
        failureReasons: ["link-count-not-one"],
        parentAliased: false,
        readMethod: "descriptor-hash-fstat-before-after",
      },
    });
    writeFileSync(resolve(root, referencePath), "{\"reference\":false}\n");
    expect(() => phase10C0VS6ObserveRadialArtifactFailures(root, packet))
      .toThrow(/exact packet\/HEAD bytes/u);
  });

  it("requires null verification execution exactly on radial validated-refusal routes", () => {
    const refusalSubrouteIds = Object.freeze([
      "radial-artifact-refusal",
      "radial-cap-evaluator",
      "radial-cap-nc-finite-shell",
      "radial-cap-nc-forged-summary",
      "radial-cap-nc-robin",
      "radial-cap-production",
      "radial-prelaunch-refusal",
    ]);
    const packet = {
      packetId: "c0v-radial-produce",
      verification: {
        executionProvenanceRule:
          "nonnull-completed-main-evaluator-for-normal-credit-route-null-exactly-radial-validated-refusal-no-verification-on-other-maker-return",
      },
      terminalSubroutes: [
        {
          subrouteId: "radial-complete-pass",
          requiredOutputIds: ["out-c0v-radial-produce-verification"],
        },
        ...refusalSubrouteIds.map((subrouteId) => ({
          subrouteId,
          requiredOutputIds: ["out-c0v-radial-produce-verification"],
        })),
      ],
    } as unknown as Phase10C0VS6PacketProtocol;
    const execution = Object.freeze({
      evaluatorCallableId: "phase10-c0v-radial-evaluator",
      modulePath: "runner/src/phase10-c0v-radial-evaluator.ts",
      exportName: "independentlyEvaluatePhase10C0VRadial",
      byteLength: 1,
      sha256: "0".repeat(64),
      runtime: "Node.js 23.6.0",
      command: "node runner/src/phase10-c0v-s6-executor.ts run --packet c0v-radial-produce",
      gitHead: "0".repeat(40),
      startedOn: "2026-08-22T00:00:00.000Z",
      endedOn: "2026-08-22T00:00:00.001Z",
      processConcurrency: 1,
    });
    expect(parsePhase10C0VS6ContextualVerificationExecution(
      execution,
      packet,
      "radial-complete-pass",
    )).toEqual(execution);
    expect(() => parsePhase10C0VS6ContextualVerificationExecution(
      null,
      packet,
      "radial-complete-pass",
    )).toThrow(/must contain completed main-evaluator provenance/u);
    for (const subrouteId of refusalSubrouteIds) {
      expect(parsePhase10C0VS6ContextualVerificationExecution(
        null,
        packet,
        subrouteId,
      )).toBeNull();
      expect(() => parsePhase10C0VS6ContextualVerificationExecution(
        execution,
        packet,
        subrouteId,
      )).toThrow(/must be null for a radial validated refusal/u);
    }
  });

  it("admits only exact direct prototype inspections in trusted strict parsers", () => {
    const repositoryRoot = resolve(import.meta.dirname, "../..");
    expect(() => phase10C0VS6ImportClosure(
      repositoryRoot,
      "runner/src/gate4-evidence.ts",
    )).not.toThrow();
    expect(() => phase10C0VS6ImportClosure(
      repositoryRoot,
      "runner/src/phase10-c0v-s6-worker-transport.ts",
    )).not.toThrow();
    const aliasRoot = importAuditWorkspace(
      "const keys = Reflect.ownKeys;\nexport const rootExport = keys;\n",
    );
    expect(() => phase10C0VS6ImportClosure(aliasRoot, "runner/root.ts"))
      .toThrow(/loader-capable global reference Reflect/u);
    const prototypeAliasRoot = importAuditWorkspace(
      "const inspect = Object.getPrototypeOf;\nexport const rootExport = inspect;\n",
    );
    expect(() => phase10C0VS6ImportClosure(prototypeAliasRoot, "runner/root.ts"))
      .toThrow(/prototype-construction API Object\.getPrototypeOf/u);
  });

  it.each(["node:fs", "node:child_process"])(
    "rejects %s from the radial producer builtin closure",
    (builtin) => {
      const root = importAuditWorkspace(
        `import { ${builtin === "node:fs" ? "readFileSync" : "spawnSync"} } from ${JSON.stringify(builtin)};\n` +
        `export function rootExport(): unknown { return ${builtin === "node:fs" ? "readFileSync" : "spawnSync"}; }\n`,
      );
      const modulePath = "runner/root.ts";
      const bytes = new Uint8Array(readFileSync(resolve(root, modulePath)));
      expect(() => phase10C0VS6AssertCallableRegistration(root, {
        callableId: "phase10-c0v-radial-production-producer",
        modulePath,
        exportName: "rootExport",
        identity: phase10C0VS6ArtifactIdentity(modulePath, bytes),
      })).toThrow(/builtin-module closure differs/u);
    },
  );

  it("resolves the live publish producer, verifier, and check-caller closures under exact builtin rosters", () => {
    const repositoryRoot = resolve(import.meta.dirname, "../..");
    for (const layer of ["moving", "radial", "static"] as const) {
      const registryPath = resolve(
        repositoryRoot,
        `research/phase10-execution-v2/recovery-v5/packets/c0v-${layer}-publish/callable-registry.json`,
      );
      const registry = JSON.parse(readFileSync(registryPath, "utf8")) as {
        readonly callables: readonly {
          readonly callableId: string;
          readonly modulePath: string;
          readonly exportName: string;
        }[];
      };
      const expectedIds = [
        `phase10-c0v-${layer}-publish-producer`,
        `phase10-c0v-${layer}-publication-verifier`,
        `phase10-c0v-${layer}-publish-check-caller`,
      ];
      for (const callableId of expectedIds) {
        const matches = registry.callables.filter((entry) => entry.callableId === callableId);
        expect(matches).toHaveLength(1);
        const registration = matches[0]!;
        const moduleBytes = new Uint8Array(readFileSync(resolve(repositoryRoot, registration.modulePath)));
        expect(() => phase10C0VS6AssertCallableRegistration(repositoryRoot, {
          callableId: registration.callableId,
          modulePath: registration.modulePath,
          exportName: registration.exportName,
          identity: phase10C0VS6ArtifactIdentity(registration.modulePath, moduleBytes),
        })).not.toThrow();
      }
    }
  });

  it("rejects one extra producer/evaluator shared module", () => {
    const producer = audit(["runner/producer.ts", "runner/runtime.ts", "runner/extra.ts"]);
    const evaluator = audit(["runner/evaluator.ts", "runner/runtime.ts", "runner/extra.ts"]);
    expect(() => phase10C0VS6AssertScientificClosureSeparation(
      producer,
      evaluator,
      ["runner/runtime.ts"],
    )).toThrow(/shared closure differs/u);
  });

  it("rejects tuning a producer dependency that existed at the science freeze", () => {
    const root = temporaryRoot("anti-tuning");
    git(root, ["init"]);
    git(root, ["config", "user.email", "synthetic@example.invalid"]);
    git(root, ["config", "user.name", "Synthetic Test"]);
    const path = "solver-cpu/src/spherical-reference.ts";
    write(root, path, "export const frozenPhysics = 1;\n");
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "science freeze"]);
    const scienceFreeze = git(root, ["rev-parse", "HEAD"]);
    writeFileSync(resolve(root, path), "export const frozenPhysics = 2;\n");
    git(root, ["add", path]);
    git(root, ["commit", "-m", "tuned implementation"]);
    const implementationFreeze = git(root, ["rev-parse", "HEAD"]);
    expect(() => phase10C0VS6AssertPreexistingScienceClosureUnchanged(
      root,
      scienceFreeze,
      implementationFreeze,
      [path],
    )).toThrow(/differs from the S5 science freeze/u);
  });
});
