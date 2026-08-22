import { createHash } from "node:crypto";
import { spawnSync, execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { canonicalJson, strictJsonSnapshot } from "../src/gate4-evidence.ts";
import {
  PHASE10_C0_DERIVE_PACKET_PROTOCOL_PATH,
  PHASE10_C0_EXECUTOR_RESOURCES,
  phase10C0ParseRetainedPreflight,
  phase10C0PrettyJsonBytes,
} from "../src/phase10-c0-contracts.ts";
import {
  phase10AcquireWriterLock,
  phase10CandidateVerificationTerminalState,
  phase10ClassifyWorkerOutcome,
  phase10ParseExecutorArguments,
  phase10RunExecutor,
} from "../src/phase10-executor.ts";
import { phase10ValidateExecutionPredicates, phase10ValidatePublishedDependency } from "../src/phase10-execution-preflight.ts";

const SOURCE_ROOT = resolve(import.meta.dirname, "../..");
const tempDirectories: string[] = [];

function git(root: string, args: readonly string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true }).trim();
}

function commit(root: string, message: string): void {
  git(root, ["add", "--all"]);
  execFileSync("git", [
    "-c", "user.name=Phase 10 Synthetic Test",
    "-c", "user.email=phase10-test@example.invalid",
    "commit", "--quiet", "-m", message,
  ], { cwd: root, windowsHide: true });
}

function cloneFrozenExecutorFixture(): string {
  const parent = mkdtempSync(join(tmpdir(), "phase10-executor-fixture-"));
  tempDirectories.push(parent);
  const root = join(parent, "repo");
  execFileSync("git", ["clone", "--quiet", "--branch", "phase10/evidence-verification", SOURCE_ROOT, root], { windowsHide: true });
  const runnerSource = join(root, "runner/src");
  for (const name of readdirSync(join(SOURCE_ROOT, "runner/src"))) {
    if (name.startsWith("phase10-c0") && name.endsWith(".ts")) cpSync(join(SOURCE_ROOT, "runner/src", name), join(runnerSource, name));
  }
  for (const name of ["phase10-execution-preflight.ts", "phase10-executor.ts", "phase10-executor-worker.ts", ".gitattributes"]) {
    cpSync(join(SOURCE_ROOT, "runner/src", name), join(runnerSource, name));
  }
  for (const packetId of ["c0-derive", "c0-publish"]) {
    const target = join(root, "research/phase10-execution-v1/packets", packetId);
    mkdirSync(target, { recursive: true });
    cpSync(join(SOURCE_ROOT, "research/phase10-execution-v1/packets", packetId), target, { recursive: true });
  }
  cpSync(join(SOURCE_ROOT, "research/.gitattributes"), join(root, "research/.gitattributes"));
  if (git(root, ["status", "--porcelain"]) !== "") {
    commit(root, "test: freeze synthetic C0 executor sources");
  }
  return root;
}

function deriveCheck(root: string) {
  return phase10RunExecutor({
    mode: "check",
    packetId: "c0-derive",
    protocolPath: PHASE10_C0_DERIVE_PACKET_PROTOCOL_PATH,
    attemptId: "synthetic-executor-v1",
  }, root);
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function writePretty(path: string, value: unknown): Uint8Array {
  const bytes = phase10C0PrettyJsonBytes(value);
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, bytes);
  return bytes;
}

function publishSyntheticDeriveDependency(root: string, preflight: Record<string, unknown>): void {
  const outputRoot = join(root, "evidence/phase10-numerical-verification-v1");
  mkdirSync(outputRoot, { recursive: true });
  const artifacts = [
    ["out-c0-analysis", "c0-analysis.json", phase10C0PrettyJsonBytes({ schema: "synthetic-c0-analysis" })],
    ["out-c0-comparisons", "c0-comparisons.jsonl", new TextEncoder().encode("{}\n")],
    ["out-c0-gaps", "c0-target-field-gaps.json", phase10C0PrettyJsonBytes({ schema: "synthetic-c0-gaps" })],
    ["out-c0-historical-limit", "c0-historical-verifier-limit.json", phase10C0PrettyJsonBytes({ schema: "synthetic-c0-limit" })],
  ] as const;
  for (const [, name, bytes] of artifacts) writeFileSync(join(outputRoot, name), bytes);
  const registry = JSON.parse(readFileSync(join(root, "research/phase10-execution-v1/packets/c0-derive/callable-registry.json"), "utf8")) as {
    registryId: string; callables: Array<{ callableId: string; modulePath: string; exportName: string; identity: { byteLength: number; sha256: string } }>;
  };
  const evaluator = registry.callables.find((entry) => entry.callableId === "phase10-c0-evaluator")!;
  const observed = preflight.observed as Record<string, unknown>;
  const checkWitnesses: Readonly<Record<string, readonly string[]>> = {
    "chk-c0-all-spacings": ["out-c0-comparisons"],
    "chk-c0-comparison-roster": ["out-c0-comparisons"],
    "chk-c0-cost-separation": ["out-c0-analysis"],
    "chk-c0-field-allowlist": ["out-c0-analysis", "out-c0-gaps"],
    "chk-c0-independent-rederivation": ["out-c0-analysis", "out-c0-comparisons"],
    "chk-c0-no-solver": ["out-c0-analysis"],
    "chk-c0-operand-echo": ["out-c0-comparisons"],
    "chk-c0-row-roster": ["out-c0-comparisons"],
  };
  const controls = preflight.negativeControlIds as string[];
  const semantic = (projection: unknown): { readonly projection: ReturnType<typeof strictJsonSnapshot>; readonly sha256: string } => {
    const snapshot = strictJsonSnapshot(projection);
    return { projection: snapshot, sha256: sha256(new TextEncoder().encode(canonicalJson(snapshot))) };
  };
  const cleanRowsProjection = { presentExpectedRowCount: 80, missingRowIds: [], duplicateRowIds: [], defectCodes: [] };
  const cleanSpacingProjection = {
    spacingVerdicts: [{ dxUm: 0.7, verdict: "pass" }, { dxUm: 0.35, verdict: "pass" }],
    overallVerdict: "pass",
    firstRowATempC: -31,
  };
  const controlWitness = (negativeControlId: string): {
    readonly artifactId: string; readonly path: string; readonly beforeLength: number; readonly beforeSha: string;
    readonly beforeProjection: unknown; readonly afterProjection: unknown;
  } => {
    if (negativeControlId === "nc-c0-missing-row") return {
      artifactId: "input-c0-rows", path: "evidence/phase6-wp2-ladder/rows.jsonl", beforeLength: 73_873,
      beforeSha: "c4fa70f7d8351f998f4800ff580ddaad0eb09fd2e2f2df7f606ca717e789cd14",
      beforeProjection: cleanRowsProjection,
      afterProjection: { presentExpectedRowCount: 79, missingRowIds: ["synthetic-row"], duplicateRowIds: [], defectCodes: ["c0-missing-row"] },
    };
    if (negativeControlId === "nc-c0-duplicate-or-truncated") return {
      artifactId: "input-c0-rows", path: "evidence/phase6-wp2-ladder/rows.jsonl", beforeLength: 73_873,
      beforeSha: "c4fa70f7d8351f998f4800ff580ddaad0eb09fd2e2f2df7f606ca717e789cd14",
      beforeProjection: cleanRowsProjection,
      afterProjection: { presentExpectedRowCount: 79, missingRowIds: ["synthetic-row"], duplicateRowIds: ["synthetic-row"], defectCodes: ["c0-duplicate-row", "c0-missing-row"] },
    };
    if (negativeControlId === "nc-c0-forbidden-field" || negativeControlId === "nc-c0-forged-producer-verdict") {
      const bytes = artifacts.find(([outputId]) => outputId === "out-c0-analysis")![2];
      const beforeProjection = { fieldNames: ["overallNoPassClass", "overallVerdict"], overallVerdict: "pass", overallNoPassClass: null };
      return {
        artifactId: "out-c0-analysis", path: "evidence/phase10-numerical-verification-v1/c0-analysis.json",
        beforeLength: bytes.byteLength, beforeSha: sha256(bytes), beforeProjection,
        afterProjection: negativeControlId === "nc-c0-forbidden-field"
          ? { fieldNames: ["occupancyMask", "overallNoPassClass", "overallVerdict"], overallVerdict: "pass", overallNoPassClass: null }
          : { fieldNames: ["overallNoPassClass", "overallVerdict"], overallVerdict: "no-pass", overallNoPassClass: "criterion" },
      };
    }
    const bytes = artifacts.find(([outputId]) => outputId === "out-c0-comparisons")![2];
    if (negativeControlId === "nc-c0-operand-echo") return {
      artifactId: "out-c0-comparisons", path: "evidence/phase10-numerical-verification-v1/c0-comparisons.jsonl",
      beforeLength: bytes.byteLength, beforeSha: sha256(bytes), beforeProjection: cleanSpacingProjection,
      afterProjection: { ...cleanSpacingProjection, firstRowATempC: -30 },
    };
    const failed = negativeControlId === "nc-c0-coarse-fail-fine-pass" ? 0.7 : 0.35;
    return {
      artifactId: "out-c0-comparisons", path: "evidence/phase10-numerical-verification-v1/c0-comparisons.jsonl",
      beforeLength: bytes.byteLength, beforeSha: sha256(bytes), beforeProjection: cleanSpacingProjection,
      afterProjection: {
        spacingVerdicts: [{ dxUm: 0.7, verdict: failed === 0.7 ? "no-pass" : "pass" }, { dxUm: 0.35, verdict: failed === 0.35 ? "no-pass" : "pass" }],
        overallVerdict: "no-pass",
        firstRowATempC: -31,
      },
    };
  };
  const verification = {
    schema: "phase10-packet-verification-v1",
    verificationId: "phase10-c0-derive-verification-v1",
    matrixId: preflight.matrixId,
    protocolId: preflight.protocolId,
    registryId: registry.registryId,
    packetId: "c0-derive",
    terminalState: "complete",
    verifiedArtifacts: artifacts.map(([outputId, name, bytes]) => ({
      outputId,
      path: `evidence/phase10-numerical-verification-v1/${name}`,
      byteLength: bytes.byteLength,
      sha256: sha256(bytes),
    })),
    checkResults: (preflight.checkIds as string[]).map((checkId) => ({ checkId, verdict: "pass", reasons: [], witnessOutputIds: checkWitnesses[checkId] })),
    executedNegativeControlIds: controls,
    negativeControlResults: controls.map((negativeControlId, index) => {
      const witness = controlWitness(negativeControlId);
      return {
        negativeControlId,
        mutationExecuted: true,
        rejected: true,
        beforeWitness: { artifactId: witness.artifactId, path: witness.path, byteLength: witness.beforeLength, sha256: witness.beforeSha, semanticFingerprint: semantic(witness.beforeProjection) },
        afterWitness: { artifactId: witness.artifactId, path: witness.path, byteLength: witness.beforeLength + 1, sha256: sha256(new TextEncoder().encode(`after-${index}`)), semanticFingerprint: semantic(witness.afterProjection) },
        errors: [],
      };
    }),
    boundDependencyPacketIds: ["a-p"],
    execution: {
      evaluatorCallableId: evaluator.callableId,
      modulePath: evaluator.modulePath,
      exportName: evaluator.exportName,
      byteLength: evaluator.identity.byteLength,
      sha256: evaluator.identity.sha256,
      runtime: observed.runtime,
      command: observed.command,
      gitHead: observed.head,
      startedOn: "2026-08-21T20:00:00.000Z",
      endedOn: "2026-08-21T20:00:01.000Z",
      processConcurrency: 1,
    },
    aggregateVerdict: "pass",
    limits: ["synthetic dependency fixture; no scientific bytes opened"],
  };
  writePretty(join(outputRoot, "c0-derive-verification.json"), verification);
  const packetReceiptRoot = join(root, "evidence/phase10-obligation-preflight-v1/packets/c0-derive");
  writePretty(join(packetReceiptRoot, "preflight.json"), preflight);
  writePretty(join(packetReceiptRoot, "terminal-receipt.json"), {
    schema: "phase10-execution-receipt-v1",
    receiptId: `phase10-c0-derive-${String(preflight.attemptId)}-terminal-v1`,
    matrixId: preflight.matrixId,
    protocolId: preflight.protocolId,
    registryId: preflight.registryId,
    packetId: "c0-derive",
    terminalState: "complete",
    producedOutputIds: preflight.outputIds,
    executedCheckIds: preflight.checkIds,
    evaluatedCheckIds: preflight.checkIds,
    executedNegativeControlIds: preflight.negativeControlIds,
    boundDependencyPacketIds: ["a-p"],
  });
  commit(root, "test: publish synthetic C0 derive dependency receipts");
}

function publishSyntheticPublishDependency(root: string, preflight: Record<string, unknown>): void {
  const outputRoot = join(root, "evidence/phase10-numerical-verification-v1");
  const reportBytes = phase10C0PrettyJsonBytes({ schema: "synthetic-c0-report" });
  const indexBytes = phase10C0PrettyJsonBytes({ schema: "synthetic-c0-index" });
  writeFileSync(join(outputRoot, "c0-report.json"), reportBytes);
  writeFileSync(join(outputRoot, "c0-artifact-index.json"), indexBytes);
  const paths: Readonly<Record<string, string>> = {
    "out-c0-analysis": "c0-analysis.json",
    "out-c0-artifact-index": "c0-artifact-index.json",
    "out-c0-comparisons": "c0-comparisons.jsonl",
    "out-c0-gaps": "c0-target-field-gaps.json",
    "out-c0-historical-limit": "c0-historical-verifier-limit.json",
    "out-c0-report": "c0-report.json",
  };
  const checkWitnesses: Readonly<Record<string, readonly string[]>> = {
    "chk-c0-publish-artifact-graph": ["out-c0-artifact-index"],
    "chk-c0-publish-breakdown": ["out-c0-analysis", "out-c0-comparisons", "out-c0-report"],
    "chk-c0-publish-gap-list": ["out-c0-gaps", "out-c0-report"],
    "chk-c0-publish-historical-limit": ["out-c0-historical-limit", "out-c0-report"],
    "chk-c0-publish-no-habit-claim": ["out-c0-report"],
  };
  const observed = preflight.observed as Record<string, unknown>;
  writePretty(join(outputRoot, "c0-verification.json"), {
    schema: "phase10-independent-verification-v1",
    verificationId: "phase10-c0-publication-verification-v1",
    matrixId: preflight.matrixId,
    protocolId: preflight.protocolId,
    registryId: preflight.registryId,
    packetId: "c0-publish",
    terminalState: "complete",
    verifiedArtifacts: Object.entries(paths).map(([outputId, name]) => {
      const bytes = new Uint8Array(readFileSync(join(outputRoot, name)));
      return { outputId, path: `evidence/phase10-numerical-verification-v1/${name}`, byteLength: bytes.byteLength, sha256: sha256(bytes) };
    }),
    checkResults: (preflight.checkIds as string[]).map((checkId) => ({ checkId, verdict: "pass", reasons: [], witnessOutputIds: checkWitnesses[checkId] })),
    executedNegativeControlIds: [],
    boundDependencyPacketIds: ["a-p", "c0-derive"],
    execution: {
      runtime: observed.runtime,
      command: observed.command,
      cwd: observed.cwd,
      gitHead: observed.head,
      startedIso: "2026-08-21T21:00:00.000Z",
      finishedIso: "2026-08-21T21:00:01.000Z",
      processConcurrency: 1,
    },
    aggregateVerdict: "pass",
    limits: ["synthetic dependency fixture; no scientific bytes opened"],
  });
  const packetReceiptRoot = join(root, "evidence/phase10-obligation-preflight-v1/packets/c0-publish");
  writePretty(join(packetReceiptRoot, "preflight.json"), preflight);
  writePretty(join(packetReceiptRoot, "terminal-receipt.json"), {
    schema: "phase10-execution-receipt-v1",
    receiptId: `phase10-c0-publish-${String(preflight.attemptId)}-terminal-v1`,
    matrixId: preflight.matrixId,
    protocolId: preflight.protocolId,
    registryId: preflight.registryId,
    packetId: "c0-publish",
    terminalState: "complete",
    producedOutputIds: preflight.outputIds,
    executedCheckIds: preflight.checkIds,
    evaluatedCheckIds: preflight.checkIds,
    executedNegativeControlIds: [],
    boundDependencyPacketIds: ["a-p", "c0-derive"],
  });
  commit(root, "test: publish synthetic C0 publication dependency receipts");
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("Phase 10 bounded non-solver executor", () => {
  it("accepts only the exact hard-coded CLI grammar and never accepts a JSON command", () => {
    expect(phase10ParseExecutorArguments([
      "run", "--packet", "c0-derive", "--protocol", PHASE10_C0_DERIVE_PACKET_PROTOCOL_PATH, "--attempt", "attempt-1",
    ])).toMatchObject({ mode: "run", packetId: "c0-derive", attemptId: "attempt-1" });
    for (const argv of [
      [] as string[],
      ["run", "--packet", "unknown", "--protocol", PHASE10_C0_DERIVE_PACKET_PROTOCOL_PATH, "--attempt", "attempt-1"],
      ["run", "--command", "node fake.ts", "--protocol", PHASE10_C0_DERIVE_PACKET_PROTOCOL_PATH, "--attempt", "attempt-1"],
      ["run", "--packet", "c0-derive", "--protocol", "protocol.json", "--attempt", "attempt-1"],
      ["run", "--packet", "c0-derive", "--protocol", PHASE10_C0_DERIVE_PACKET_PROTOCOL_PATH, "--attempt", "../escape"],
    ]) expect(() => phase10ParseExecutorArguments(argv)).toThrow(/usage|unknown|protocol|attempt/u);
    const source = readFileSync(join(SOURCE_ROOT, "runner/src/phase10-executor.ts"), "utf8");
    expect(source).toMatch(/spawnSync\(process\.execPath, \[/u);
    expect(source).not.toMatch(/spawnSync\([^\n]*(?:observed|protocol|command)/u);
  });

  it("fails every runtime, branch, head, dirt, and disk launch predicate by name", () => {
    const valid = {
      runtime: "v24.13.1",
      branch: "phase10/evidence-verification",
      head: "1".repeat(40),
      dirtyStatusLines: [] as readonly string[],
      diskFreeBytes: PHASE10_C0_EXECUTOR_RESOURCES.minimumFreeBytes,
    };
    expect(() => phase10ValidateExecutionPredicates(valid)).not.toThrow();
    for (const mutation of [
      { runtime: "v24.13.0" },
      { branch: "main" },
      { head: "bad" },
      { dirtyStatusLines: [" M runner/src/fake.ts"] },
      { diskFreeBytes: PHASE10_C0_EXECUTOR_RESOURCES.minimumFreeBytes - 1 },
    ]) expect(() => phase10ValidateExecutionPredicates({ ...valid, ...mutation })).toThrow(/runtime|branch|head|clean|disk/u);
  });

  it("refuses an existing or stale writer lock and never auto-removes it", () => {
    const root = mkdtempSync(join(tmpdir(), "phase10-executor-lock-"));
    tempDirectories.push(root);
    const release = phase10AcquireWriterLock(root, "out/phase10-execution-v1/attempts/c0-derive/writer.lock", "attempt-1");
    expect(() => phase10AcquireWriterLock(root, "out/phase10-execution-v1/attempts/c0-derive/writer.lock", "attempt-2")).toThrow(/stale locks are never auto-removed/u);
    expect(existsSync(join(root, "out/phase10-execution-v1/attempts/c0-derive/writer.lock"))).toBe(true);
    release();
  });

  it("losing concurrent run acquires no authorization observation before the writer lock", () => {
    const root = cloneFrozenExecutorFixture();
    const lockPath = "out/phase10-execution-v1/attempts/c0-derive/writer.lock";
    const release = phase10AcquireWriterLock(root, lockPath, "winning-attempt");
    try {
      const trackedPath = join(root, "runner/src/phase10-c0-checks.ts");
      writeFileSync(trackedPath, `${readFileSync(trackedPath, "utf8")}\n// concurrent post-lock drift\n`);
      expect(() => phase10RunExecutor({
        mode: "run",
        packetId: "c0-derive",
        protocolPath: PHASE10_C0_DERIVE_PACKET_PROTOCOL_PATH,
        attemptId: "losing-attempt",
      }, root)).toThrow(/writer lock exists or cannot be acquired/u);
      expect(existsSync(join(root, lockPath))).toBe(true);
      expect(existsSync(join(root, "out/phase10-execution-v1/attempts/c0-derive/losing-attempt"))).toBe(false);
    } finally {
      release();
    }
  });

  it("classifies the hard timeout as failure and pins the production bound to 300 seconds", () => {
    const error = Object.assign(new Error("timed out"), { code: "ETIMEDOUT" });
    expect(phase10ClassifyWorkerOutcome({ status: null, signal: "SIGKILL", error })).toEqual({ success: false, timedOut: true });
    expect(PHASE10_C0_EXECUTOR_RESOURCES.maxWallSeconds).toBe(300);
  });

  it("derives the generic terminal state from the exact candidate verification contract", () => {
    const common = {
      matrixId: "phase10-selected-package-obligations-v1",
      protocolId: "phase10-c0-derive-existing-byte-v1",
      registryId: "phase10-c0-derive-resolved-callables-v2",
      packetId: "c0-derive",
      verifiedArtifacts: [],
      checkResults: [],
      executedNegativeControlIds: [],
      negativeControlResults: [],
      boundDependencyPacketIds: ["a-p"],
      execution: {},
      limits: [],
    };
    const failed = {
      ...common,
      schema: "phase10-packet-verification-v1",
      verificationId: "phase10-c0-derive-verification-v1",
      terminalState: "fail",
      aggregateVerdict: "fail",
    };
    expect(phase10CandidateVerificationTerminalState("c0-derive", failed)).toBe("fail");
    expect(phase10CandidateVerificationTerminalState("c0-derive", {
      ...failed,
      terminalState: "complete",
      aggregateVerdict: "pass",
    })).toBe("complete");
    expect(() => phase10CandidateVerificationTerminalState("c0-derive", {
      ...failed,
      terminalState: "complete",
    })).toThrow(/state differs/u);
    expect(() => phase10CandidateVerificationTerminalState("c0-publish", {
      schema: "phase10-independent-verification-v1",
      verificationId: "phase10-c0-publication-verification-v1",
      matrixId: common.matrixId,
      protocolId: "phase10-c0-publish-existing-byte-v1",
      registryId: "phase10-c0-publish-resolved-callables-v2",
      packetId: "c0-publish",
      terminalState: "fail",
      verifiedArtifacts: [],
      checkResults: [],
      executedNegativeControlIds: [],
      boundDependencyPacketIds: ["a-p", "c0-derive"],
      execution: {},
      aggregateVerdict: "fail",
      limits: [],
    })).toThrow(/state differs/u);
  });

  it("runs a read-only preflight against a clean committed synthetic code freeze without opening rows", () => {
    const root = cloneFrozenExecutorFixture();
    const before = git(root, ["status", "--porcelain=v1", "--untracked-files=all"]);
    const receipt = deriveCheck(root);
    expect(receipt).toMatchObject({ packetId: "c0-derive", attemptId: "synthetic-executor-v1", verdict: "pass" });
    const observed = (receipt as Record<string, unknown>).observed as Record<string, unknown>;
    const freeze = observed.codeFreeze as { artifacts: Array<{ path: string }> };
    const frozenPaths = freeze.artifacts.map((artifact) => artifact.path);
    expect(frozenPaths).toEqual(expect.arrayContaining([
      "runner/src/phase10-obligation-preflight.ts",
      "runner/src/phase10-c0-publication-verifier.ts",
      "runner/src/phase10-executor-worker.ts",
    ]));
    expect(git(root, ["status", "--porcelain=v1", "--untracked-files=all"])).toBe(before);
    expect(existsSync(join(root, "out/phase10-execution-v1/attempts/c0-derive"))).toBe(false);
    expect(existsSync(join(root, "out/phase10-execution-v1/attempts/c0-derive/synthetic-executor-v1"))).toBe(false);
  });

  it("rejects stage-set, command, path, and resource mutations in retained preflight bytes", () => {
    const root = cloneFrozenExecutorFixture();
    const receipt = deriveCheck(root) as Record<string, unknown>;
    const observed = receipt.observed as Record<string, unknown>;
    const resources = observed.resources as Record<string, unknown>;
    const mutations = [
      { ...receipt, outputIds: (receipt.outputIds as unknown[]).slice(1) },
      { ...receipt, checkIds: (receipt.checkIds as unknown[]).slice(1) },
      { ...receipt, negativeControlIds: (receipt.negativeControlIds as unknown[]).slice(1) },
      { ...receipt, observed: { ...observed, command: "node fake.ts" } },
      { ...receipt, observed: { ...observed, candidateDirectory: "out/wrong" } },
      { ...receipt, observed: { ...observed, resources: { ...resources, observedFreeBytes: 1 } } },
    ];
    for (const mutation of mutations) {
      expect(() => phase10C0ParseRetainedPreflight(phase10C0PrettyJsonBytes(mutation), "c0-derive")).toThrow(/outputs|checks|controls|path|provenance|resource|free bytes/u);
    }
  });

  it("rejects dependency schema substitution and callable, preflight, and eager-worker transitive drift", () => {
    const root = cloneFrozenExecutorFixture();
    expect(() => deriveCheck(root)).not.toThrow();
    const verificationPath = join(root, "evidence/phase10-obligation-preflight-v1/verification.json");
    const originalVerification = readFileSync(verificationPath, "utf8");
    const verification = JSON.parse(originalVerification) as Record<string, unknown>;
    writeFileSync(verificationPath, `${JSON.stringify({ ...verification, schema: "phase10-independent-verification-v1" }, null, 2)}\n`);
    commit(root, "test: substitute dependency schema");
    expect(() => deriveCheck(root)).toThrow(/verification.*identity|schema/u);
    writeFileSync(verificationPath, originalVerification);
    commit(root, "test: restore dependency schema");
    expect(() => deriveCheck(root)).not.toThrow();
    const supportPath = join(root, "runner/src/phase10-c0-contracts.ts");
    writeFileSync(supportPath, `${readFileSync(supportPath, "utf8")}\n// synthetic support drift\n`);
    commit(root, "test: drift transitive support module");
    expect(() => deriveCheck(root)).toThrow(/code-freeze artifact|transitive code freeze/u);
    writeFileSync(supportPath, readFileSync(join(SOURCE_ROOT, "runner/src/phase10-c0-contracts.ts")));
    commit(root, "test: restore transitive support module");
    expect(() => deriveCheck(root)).not.toThrow();

    const preflightDependency = join(root, "runner/src/phase10-obligation-preflight.ts");
    writeFileSync(preflightDependency, `${readFileSync(preflightDependency, "utf8")}\n// synthetic preflight dependency drift\n`);
    commit(root, "test: drift preflight-only import");
    expect(() => deriveCheck(root)).toThrow(/code-freeze artifact|transitive code freeze/u);
    writeFileSync(preflightDependency, readFileSync(join(SOURCE_ROOT, "runner/src/phase10-obligation-preflight.ts")));
    commit(root, "test: restore preflight-only import");
    expect(() => deriveCheck(root)).not.toThrow();

    const eagerWorkerDependency = join(root, "runner/src/phase10-c0-publication-verifier.ts");
    writeFileSync(eagerWorkerDependency, `${readFileSync(eagerWorkerDependency, "utf8")}\n// synthetic eager-worker dependency drift\n`);
    commit(root, "test: drift eager worker publish-side import");
    expect(() => deriveCheck(root)).toThrow(/code-freeze artifact|transitive code freeze/u);
  });

  it("accepts the registered c0-publish dependency schema and rejects a generic-schema substitution", () => {
    const root = cloneFrozenExecutorFixture();
    const derivePreflight = deriveCheck(root) as Record<string, unknown>;
    publishSyntheticDeriveDependency(root, derivePreflight);
    const publishCheck = (): unknown => phase10RunExecutor({
      mode: "check",
      packetId: "c0-publish",
      protocolPath: "research/phase10-execution-v1/packets/c0-publish/protocol.json",
      attemptId: "synthetic-publish-v1",
    }, root);
    const checked = publishCheck() as Record<string, unknown>;
    expect(checked).toMatchObject({ packetId: "c0-publish", verdict: "pass" });
    const observed = checked.observed as Record<string, unknown>;
    const freeze = observed.codeFreeze as { artifacts: Array<{ path: string }> };
    expect(freeze.artifacts.map((artifact) => artifact.path)).toContain("runner/src/phase10-c0-derive.ts");
    const verificationPath = join(root, "evidence/phase10-numerical-verification-v1/c0-derive-verification.json");
    const verification = JSON.parse(readFileSync(verificationPath, "utf8")) as Record<string, unknown>;
    writePretty(verificationPath, { ...verification, schema: "phase10-independent-verification-v1" });
    commit(root, "test: substitute C0 derive dependency schema");
    expect(publishCheck).toThrow(/verification.*identity|schema/u);
  });

  it("validates the distinct c0-publish independent-verification dependency shape and six-artifact roster", () => {
    const root = cloneFrozenExecutorFixture();
    const derivePreflight = deriveCheck(root) as Record<string, unknown>;
    publishSyntheticDeriveDependency(root, derivePreflight);
    const publishPreflight = phase10RunExecutor({
      mode: "check",
      packetId: "c0-publish",
      protocolPath: "research/phase10-execution-v1/packets/c0-publish/protocol.json",
      attemptId: "synthetic-publish-dependency-v1",
    }, root) as Record<string, unknown>;
    publishSyntheticPublishDependency(root, publishPreflight);
    expect(phase10ValidatePublishedDependency(root, "c0-publish")).toMatchObject({ packetId: "c0-publish" });
    const verificationPath = join(root, "evidence/phase10-numerical-verification-v1/c0-verification.json");
    const verification = JSON.parse(readFileSync(verificationPath, "utf8")) as Record<string, unknown>;
    writePretty(verificationPath, { ...verification, schema: "phase10-packet-verification-v1", negativeControlResults: [] });
    commit(root, "test: substitute generic verification for C0 publication schema");
    expect(() => phase10ValidatePublishedDependency(root, "c0-publish")).toThrow(/fields differ|identity/u);
  });

  it("CLI no-args exits nonzero before any execution or scientific input access", () => {
    const result = spawnSync(process.execPath, [join(SOURCE_ROOT, "runner/src/phase10-executor.ts")], {
      cwd: SOURCE_ROOT,
      encoding: "utf8",
      windowsHide: true,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/usage/u);
  });
});
