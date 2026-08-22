import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  canonicalJson,
  canonicalJsonBytes,
  sha256Bytes,
  type StrictJson,
} from "../src/gate4-evidence.ts";
import {
  parsePhase10ObligationMatrix,
} from "../src/phase10-contracts.ts";
import {
  runPhase10MissingProducerControl,
  runPhase10UncalledCheckControl,
} from "../src/phase10-ap-negative-controls.ts";
import {
  PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH,
  parsePhase10ScopeClassificationProtocol,
  parsePhase10ScopeOverlayRow,
  parsePhase10ScopeReport,
  type Phase10ScopeCorpusCounts,
  type Phase10ScopeOverlayRow,
} from "../src/phase10-scope-contracts.ts";
import {
  PHASE10_AS_CHECK_IDS,
} from "../src/phase10-scope-checks.ts";
import {
  PHASE10_SCOPE_PRODUCE_COMMAND,
  producePhase10ScopeArtifacts,
  publishPhase10ScopeCandidate,
  validatePhase10ScopeCandidateForPublication,
} from "../src/phase10-scope-overlay.ts";
import {
  phase10ScopeOverlayVerify,
  type Phase10ScopeVerificationEvaluation,
} from "../src/phase10-scope-overlay-verify.ts";
import {
  writePhase10ScopeVerificationReceipt,
} from "../src/phase10-scope-verification-receipt.ts";
import {
  publishPhase10StaticPacketReceipts,
  writePhase10StaticTerminalReceipt,
} from "../src/phase10-static-packet-receipts.ts";

const SOURCE_REPOSITORY = fileURLToPath(new URL("../..", import.meta.url));
const FOUNDATION_PATH = "research/phase10-foundation-freeze-v1.json";
const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json";
const SCHEMA_REGISTRY_PATH = "research/phase10-artifact-schema-registry-v1.json";
const C0_PROTOCOL_PATH = "research/phase10-c0-protocol-v1.json";
const C0V_FOUNDATION_PATH = "research/phase10-c0v-foundation-v1.json";
const CONTRACT_PATH = "runner/src/phase10-scope-contracts.ts";
const VERIFIER_PATH = "runner/src/phase10-scope-overlay-verify.ts";
const RECEIPT_WRITER_PATH = "runner/src/phase10-scope-verification-receipt.ts";
const CHARTER_PATH = "project charter.md";
const DECISION_PATH = "docs/decisions/0052-adopt-phase10-evidence-verification.md";
const PHASE8A_FREEZE_PATH = "evidence/phase8-target-book/freeze.json";
const PHASE8A_PATH = "research/phase8-target-book.jsonl";
const PHASE8B_PATH = "evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl";
const PHASE8B_METADATA_PATHS = [
  "evidence/phase8b-native-histories-v1/records.jsonl",
  "evidence/phase8b-bacon-seed-history-v1/records.jsonl",
  "evidence/phase8b-plot-digitization-v3/records.jsonl",
  "evidence/phase8b-p2-terminal-v1/records.jsonl",
] as const;
const CALLABLE_REGISTRY_PATH =
  "research/phase10-execution-v1/packets/a-s/callable-registry.json";
const PACKET_PROTOCOL_PATH = "research/phase10-execution-v1/packets/a-s/protocol.json";
const AP_CALLABLE_REGISTRY_PATH =
  "research/phase10-execution-v1/packets/a-p/callable-registry.json";
const AP_PACKET_PROTOCOL_PATH = "research/phase10-execution-v1/packets/a-p/protocol.json";
const AP_TERMINAL_RECEIPT_PATH =
  "evidence/phase10-obligation-preflight-v1/packets/a-p/terminal-receipt.json";
const AP_PREFLIGHT_RECEIPT_PATH =
  "evidence/phase10-obligation-preflight-v1/packets/a-p/preflight.json";
const AP_VERIFICATION_PATH = "evidence/phase10-obligation-preflight-v1/verification.json";
const AP_PRODUCE_COMMAND =
  "node runner/src/phase10-ap-publish.ts produce --repository-root . --out out/phase10-obligation-preflight-v1-candidate";
const AP_VERIFY_COMMAND =
  "node runner/src/phase10-ap-independent.ts verify --repository-root . --bundle out/phase10-obligation-preflight-v1-candidate --receipt out/phase10-obligation-preflight-v1-candidate/verification.json";
const AP_VERIFIED_OUTPUT_IDS = [
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
] as const;
const AP_CONTROL_IDS = [
  "nc-ap-missing-producer",
  "nc-ap-uncalled-check",
] as const;
const AP_VERIFICATION_LIMITS = [
  "A-P establishes registered-obligation completeness only; it does not establish scientific correctness.",
  "The verification excludes the later A-P terminal receipt by the frozen acyclic output DAG; that receipt binds this verification.",
].sort();
const PACKET_CATALOGUE_PATH = "research/phase10-execution-v1/packet-catalogue.json";
const EXECUTION_README_PATH = "research/phase10-execution-v1/README.md";
const PRODUCER_PATH = "runner/src/phase10-scope-overlay.ts";
const CHECKS_PATH = "runner/src/phase10-scope-checks.ts";
const NEGATIVE_CONTROLS_PATH = "runner/src/phase10-scope-negative-controls.ts";
const STATIC_RECEIPTS_PATH = "runner/src/phase10-static-packet-receipts.ts";
const GENERIC_CONTRACTS_PATH = "runner/src/phase10-contracts.ts";
const OBLIGATION_PREFLIGHT_PATH = "runner/src/phase10-obligation-preflight.ts";
const RUNNER_ATTRIBUTES_PATH = "runner/src/.gitattributes";
const SCOPE_EVIDENCE_PATH = "evidence/phase10-scope-intake-v1";
const STATIC_RECEIPT_DIRECTORY = "evidence/phase10-obligation-preflight-v1/packets/a-s";
const STATIC_ATTEMPT_ID = "s2-static-20260821-v1";
const SCOPE_FREEZE_COMMIT = "ca40a47a06cda23772b00ca93dce1d4d69d082ab";
const SCOPE_CHARTER_CONTENT_COMMIT = "0c889c3423d87f9062555a058a320c4a5cce2bc5";
// The A-S protocol froze the raw Windows v1.28 working-tree bytes. Git stores
// the charter blob with LF endings, while the then-live file retained CRLF on
// every line except these lines touched by the historical patch sequence.
// Reconstructing that exact byte form keeps this fixture independent of the
// later live charter without weakening the protocol's raw-byte identity.
const SCOPE_CHARTER_LF_LINES = new Set([
  3, 7, 8, 9, 74, 75, 76, 77, 78, 79, 104, 205, 259, 371, 398, 399, 400,
  401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 422,
]);
const SCOPE_FREEZE_IDENTITIES = Object.freeze({
  [PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH]: Object.freeze({
    byteLength: 477980,
    sha256: "e5a7196f9a1cefc2bb6548887b76d70d5633d7bb0b43ffd96c94c6ac74a76c39",
  }),
  [CONTRACT_PATH]: Object.freeze({
    byteLength: 51753,
    sha256: "599499bdc2794d9ba189879f52c8a21d1fcd93608f971ddb248daa5d2009f69f",
  }),
});

const REPOSITORY_FILES = [
  ".gitattributes",
  ".gitignore",
  FOUNDATION_PATH,
  MATRIX_PATH,
  SCHEMA_REGISTRY_PATH,
  C0_PROTOCOL_PATH,
  C0V_FOUNDATION_PATH,
  PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH,
  CONTRACT_PATH,
  VERIFIER_PATH,
  RECEIPT_WRITER_PATH,
  CHARTER_PATH,
  DECISION_PATH,
  PHASE8A_FREEZE_PATH,
  PHASE8A_PATH,
  PHASE8B_PATH,
  ...PHASE8B_METADATA_PATHS,
  CALLABLE_REGISTRY_PATH,
  PACKET_PROTOCOL_PATH,
  AP_CALLABLE_REGISTRY_PATH,
  AP_PACKET_PROTOCOL_PATH,
  PACKET_CATALOGUE_PATH,
  EXECUTION_README_PATH,
  PRODUCER_PATH,
  CHECKS_PATH,
  NEGATIVE_CONTROLS_PATH,
  STATIC_RECEIPTS_PATH,
  GENERIC_CONTRACTS_PATH,
  OBLIGATION_PREFLIGHT_PATH,
  RUNNER_ATTRIBUTES_PATH,
] as const;

const PRODUCER_FILES = [
  "phase8a-overlay.jsonl",
  "phase8b-overlay.jsonl",
  "scope-report.json",
  "scope-artifact-index.json",
] as const;

interface TestState {
  readonly repositoryRoot: string;
  readonly commit: string;
  readonly bundleDirectory: string;
  readonly artifacts: ReadonlyMap<string, Uint8Array>;
  readonly evaluation: Phase10ScopeVerificationEvaluation;
}

let state: TestState;

function bytes(path: string): Uint8Array {
  return new Uint8Array(readFileSync(path));
}

function frozenScopeCharterBytes(): Uint8Array {
  const frozen = spawnSync(
    "git",
    ["show", `${SCOPE_CHARTER_CONTENT_COMMIT}:${CHARTER_PATH}`],
    { cwd: SOURCE_REPOSITORY, windowsHide: true },
  );
  if (frozen.status !== 0) {
    throw new Error(
      `git show ${SCOPE_CHARTER_CONTENT_COMMIT}:${CHARTER_PATH} failed: ${String(frozen.stderr)}`,
    );
  }
  const normalizedText = new TextDecoder().decode(frozen.stdout as Uint8Array);
  if (!normalizedText.endsWith("\n") || normalizedText.includes("\r")) {
    throw new Error("registered v1.28 charter blob is not canonical LF text");
  }
  const lines = normalizedText.slice(0, -1).split("\n");
  return new TextEncoder().encode(
    lines
      .map((line, index) => `${line}${SCOPE_CHARTER_LF_LINES.has(index + 1) ? "\n" : "\r\n"}`)
      .join(""),
  );
}

function copy(repositoryRoot: string, path: string): void {
  const destination = resolve(repositoryRoot, path);
  mkdirSync(dirname(destination), { recursive: true });
  if (path === CHARTER_PATH) {
    writeFileSync(destination, frozenScopeCharterBytes());
    return;
  }
  copyFileSync(resolve(SOURCE_REPOSITORY, path), destination);
}

function git(repositoryRoot: string, args: readonly string[]): string {
  const result = spawnSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  }
  return result.stdout.trim();
}

function jsonlRows<T>(artifactBytes: Uint8Array): readonly T[] {
  const text = new TextDecoder().decode(artifactBytes);
  return text.slice(0, -1).split("\n").map((line) => JSON.parse(line) as T);
}

function replacePrettyJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

type DependencyFixtureState =
  | "pass"
  | "cross-attempt-terminal"
  | "empty-artifact-roster"
  | "historical-drift"
  | "missing-terminal"
  | "missing-preflight"
  | "schema-substitution"
  | "tampered-preflight"
  | "tampered-control-witness"
  | "stale"
  | "non-pass";

function writeApDependencyFixture(
  repositoryRoot: string,
  state: DependencyFixtureState,
): void {
  const registryPath = resolve(repositoryRoot, AP_CALLABLE_REGISTRY_PATH);
  const registry = JSON.parse(readFileSync(registryPath, "utf8")) as {
    registryId: string;
    matrixId: string;
    protocolId: string;
    callables: Array<{
      callableId: string;
      role: string;
      resolution: string;
      modulePath: string;
      exportName: string;
      identity: null | { byteLength: number; sha256: string };
      producedOutputIds: string[];
      invokedCheckIds: string[];
    }>;
  };
  registry.registryId = "phase10-a-p-test-fixture-callables-v1";
  const exportsByModule = new Map<string, Set<string>>();
  for (const callable of registry.callables) {
    const exports = exportsByModule.get(callable.modulePath) ?? new Set<string>();
    exports.add(callable.exportName);
    exportsByModule.set(callable.modulePath, exports);
  }
  const moduleBytes = new Map<string, Uint8Array>();
  for (const [modulePath, exportNames] of exportsByModule) {
    const source = [...exportNames]
      .sort()
      .map((exportName) => `export function ${exportName}(): void {}\n`)
      .join("");
    const sourceBytes = new TextEncoder().encode(source);
    const absolutePath = resolve(repositoryRoot, modulePath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, sourceBytes);
    moduleBytes.set(modulePath, sourceBytes);
  }
  for (const callable of registry.callables) {
    const sourceBytes = moduleBytes.get(callable.modulePath) as Uint8Array;
    callable.resolution = "resolved";
    callable.identity = {
      byteLength: sourceBytes.byteLength,
      sha256: sha256Bytes(sourceBytes),
    };
  }
  replacePrettyJson(registryPath, registry);
  git(repositoryRoot, ["init", "--quiet", "--initial-branch=phase10/evidence-verification"]);
  git(repositoryRoot, ["add", "--all"]);
  git(repositoryRoot, [
    "-c", "user.name=Phase10 Integration Test",
    "-c", "user.email=phase10-integration@example.invalid",
    "commit", "--quiet", "-m", "Freeze dependency implementation",
  ]);
  const dependencyHead = git(repositoryRoot, ["rev-parse", "HEAD"]);

  if (state === "historical-drift") {
    const changedModulePath = registry.callables[0]?.modulePath;
    if (changedModulePath === undefined) throw new Error("A-P fixture registry has no callables");
    writeFileSync(resolve(repositoryRoot, changedModulePath), "// committed after the falsely retained head\n", { flag: "a" });
    const changedBytes = bytes(resolve(repositoryRoot, changedModulePath));
    for (const callable of registry.callables.filter((entry) => entry.modulePath === changedModulePath)) {
      callable.identity = {
        byteLength: changedBytes.byteLength,
        sha256: sha256Bytes(changedBytes),
      };
    }
    replacePrettyJson(registryPath, registry);
    git(repositoryRoot, ["add", "--all"]);
    git(repositoryRoot, [
      "-c", "user.name=Phase10 Integration Test",
      "-c", "user.email=phase10-integration@example.invalid",
      "commit", "--quiet", "-m", "Advance dependency implementation after retained head",
    ]);
  }

  const matrixValue = JSON.parse(
    readFileSync(resolve(repositoryRoot, MATRIX_PATH), "utf8"),
  ) as StrictJson;
  const protocolValue = JSON.parse(
    readFileSync(resolve(repositoryRoot, AP_PACKET_PROTOCOL_PATH), "utf8"),
  ) as StrictJson;
  const protocol = protocolValue as {
    protocolId: string;
    matrixId: string;
    packetId: string;
    registeredOutputIds: string[];
    registeredCheckIds: string[];
    registeredNegativeControlIds: string[];
    boundDependencyPacketIds: string[];
  };
  const dependencyRuntime = process.version;
  const matrix = parsePhase10ObligationMatrix(matrixValue);
  const output = (outputId: string) => {
    const matches = matrix.outputs.filter((entry) => entry.packetId === "a-p" && entry.outputId === outputId);
    if (matches.length !== 1 || matches[0]!.artifact.field !== null) {
      throw new Error(`A-P fixture lacks one file output ${outputId}`);
    }
    return matches[0]!;
  };
  const fixtureIdentity = (path: string) => {
    const artifactBytes = bytes(resolve(repositoryRoot, path));
    return {
      path,
      byteLength: artifactBytes.byteLength,
      sha256: sha256Bytes(artifactBytes),
    };
  };

  const controls = {
    repositoryRoot,
    matrix: matrixValue,
    protocol: protocolValue,
    registryBytes: bytes(registryPath),
  } as const;
  const missingReceipt = runPhase10MissingProducerControl(controls);
  const uncalledReceipt = runPhase10UncalledCheckControl(controls);
  const missingPath = output("out-ap-missing-producer-receipt").artifact.path;
  const uncalledPath = output("out-ap-uncalled-check-receipt").artifact.path;
  mkdirSync(dirname(resolve(repositoryRoot, missingPath)), { recursive: true });
  replacePrettyJson(resolve(repositoryRoot, missingPath), missingReceipt);
  replacePrettyJson(resolve(repositoryRoot, uncalledPath), uncalledReceipt);
  const excludedFromIndex = new Set([
    "out-ap-artifact-index",
    "out-ap-verification",
    "out-ap-self-execution-receipt",
  ]);
  const indexEntries = matrix.outputs
    .filter((entry) => entry.packetId === "a-p" && !excludedFromIndex.has(entry.outputId))
    .map((entry) => {
      if (entry.artifact.field !== null) throw new Error(`${entry.outputId} fixture artifact is not a file`);
      const artifactBytes = bytes(resolve(repositoryRoot, entry.artifact.path));
      return {
        artifactId: entry.outputId,
        path: entry.artifact.path,
        mediaType: entry.artifact.path.endsWith(".md")
          ? "text/markdown; charset=utf-8"
          : "application/json",
        byteLength: artifactBytes.byteLength,
        sha256: sha256Bytes(artifactBytes),
        role: "obligation-preflight",
        producedBy: entry.producerCallableId,
      };
    })
    .sort((left, right) => left.artifactId.localeCompare(right.artifactId));
  const artifactIndexPath = output("out-ap-artifact-index").artifact.path;
  replacePrettyJson(resolve(repositoryRoot, artifactIndexPath), {
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-obligation-preflight-v1",
    artifacts: indexEntries,
  });

  const dependencyPreflight = {
    schema: "phase10-preflight-receipt-v1",
    receiptId: "phase10-a-p-test-fixture-preflight-v1",
    matrixId: protocol.matrixId,
    protocolId: protocol.protocolId,
    registryId: registry.registryId,
    packetId: protocol.packetId,
    attemptId: "test-fixture",
    stage: "run",
    observed: {
      launchClass: "static-contract",
      machineLaunchChecks: "not-applicable",
      branch: "phase10/evidence-verification",
      head: dependencyHead,
      runtime: dependencyRuntime,
      command: AP_PRODUCE_COMMAND,
      repositoryBundleRoot: ".",
      candidateDirectory: "out/phase10-obligation-preflight-v1-candidate",
      registeredAttemptRoot: "out/phase10-execution-v1/attempts/a-p",
      finalPreflightReceiptPath: AP_PREFLIGHT_RECEIPT_PATH,
      finalTerminalReceiptPath: AP_TERMINAL_RECEIPT_PATH,
      verificationPaths: [AP_VERIFICATION_PATH],
      matrix: fixtureIdentity(MATRIX_PATH),
      protocol: fixtureIdentity(AP_PACKET_PROTOCOL_PATH),
      callableRegistry: fixtureIdentity(AP_CALLABLE_REGISTRY_PATH),
      dependencyPacketIds: protocol.boundDependencyPacketIds,
      dependencyArtifacts: [],
    },
    outputIds: protocol.registeredOutputIds,
    checkIds: protocol.registeredCheckIds,
    negativeControlIds: protocol.registeredNegativeControlIds,
    callableIds: registry.callables.map((callable) => callable.callableId),
    selectedBranches: {},
    verdict: "pass",
    reasons: [],
  };
  if (state === "tampered-preflight") {
    dependencyPreflight.observed.matrix.sha256 = "0".repeat(64);
  }
  if (state !== "missing-preflight") {
    const preflightPath = resolve(repositoryRoot, AP_PREFLIGHT_RECEIPT_PATH);
    mkdirSync(dirname(preflightPath), { recursive: true });
    replacePrettyJson(preflightPath, dependencyPreflight);
  }
  const terminalReceipt = {
    schema: "phase10-execution-receipt-v1",
    receiptId: "phase10-a-p-test-fixture-terminal-v1",
    matrixId: protocol.matrixId,
    protocolId: protocol.protocolId,
    registryId: registry.registryId,
    packetId: protocol.packetId,
    terminalState: state === "non-pass" ? "fail" : "pass",
    producedOutputIds: protocol.registeredOutputIds,
    executedCheckIds: protocol.registeredCheckIds,
    evaluatedCheckIds: protocol.registeredCheckIds,
    executedNegativeControlIds: protocol.registeredNegativeControlIds,
    boundDependencyPacketIds: protocol.boundDependencyPacketIds,
  };
  if (state === "cross-attempt-terminal") {
    terminalReceipt.receiptId = "phase10-a-p-another-attempt-terminal-v1";
  }
  if (state !== "missing-terminal") {
    const terminalPath = resolve(repositoryRoot, AP_TERMINAL_RECEIPT_PATH);
    mkdirSync(dirname(terminalPath), { recursive: true });
    replacePrettyJson(terminalPath, terminalReceipt);
  }
  const verification = {
    schema: "phase10-packet-verification-v1",
    verificationId: "phase10-a-p-verification-v1",
    matrixId: protocol.matrixId,
    protocolId: protocol.protocolId,
    registryId: registry.registryId,
    packetId: protocol.packetId,
    terminalState: "pass",
    verifiedArtifacts: AP_VERIFIED_OUTPUT_IDS.map((outputId) => {
      const artifact = output(outputId).artifact;
      const artifactBytes = bytes(resolve(repositoryRoot, artifact.path));
      return {
        outputId,
        path: artifact.path,
        byteLength: artifactBytes.byteLength,
        sha256: sha256Bytes(artifactBytes),
      };
    }),
    checkResults: protocol.registeredCheckIds.map((checkId) => ({
      checkId,
      verdict: "pass",
      reasons: [],
      witnessOutputIds: [AP_VERIFIED_OUTPUT_IDS[0]],
    })),
    executedNegativeControlIds: protocol.registeredNegativeControlIds,
    negativeControlResults: [missingReceipt, uncalledReceipt].map((receipt, index) => ({
      negativeControlId: AP_CONTROL_IDS[index]!,
      mutationExecuted: true,
      rejected: true,
      beforeWitness: receipt.beforeWitness,
      afterWitness: receipt.afterWitness,
      errors: [] as string[],
    })),
    boundDependencyPacketIds: protocol.boundDependencyPacketIds,
    execution: {
      evaluatorCallableId: "phase10-ap-evaluator",
      modulePath: "runner/src/phase10-ap-independent.ts",
      exportName: "independentlyVerifyPhase10ApArtifacts",
      byteLength: registry.callables.find(
        (callable) => callable.callableId === "phase10-ap-evaluator",
      )!.identity!.byteLength,
      sha256: registry.callables.find(
        (callable) => callable.callableId === "phase10-ap-evaluator",
      )!.identity!.sha256,
      runtime: dependencyRuntime,
      command: AP_VERIFY_COMMAND,
      gitHead: dependencyHead,
      startedOn: "2026-08-21T12:00:00.000Z",
      endedOn: "2026-08-21T12:00:00.001Z",
      processConcurrency: 1,
    },
    aggregateVerdict: "pass",
    limits: AP_VERIFICATION_LIMITS,
  };
  if (state === "schema-substitution") verification.schema = "phase10-as-verification-v1";
  if (state === "empty-artifact-roster") verification.verifiedArtifacts = [];
  if (state === "tampered-control-witness") {
    const first = verification.negativeControlResults[0]!;
    verification.negativeControlResults[0] = {
      ...first,
      afterWitness: { ...first.afterWitness, sha256: "0".repeat(64) },
    };
  }
  const verificationPath = resolve(repositoryRoot, AP_VERIFICATION_PATH);
  mkdirSync(dirname(verificationPath), { recursive: true });
  replacePrettyJson(verificationPath, verification);
  if (state === "stale") {
    const firstModulePath = registry.callables[0]?.modulePath;
    if (firstModulePath === undefined) throw new Error("A-P fixture registry has no callables");
    writeFileSync(resolve(repositoryRoot, firstModulePath), "// stale after registry pin\n", { flag: "a" });
  }
  git(repositoryRoot, ["add", "--all"]);
  git(repositoryRoot, [
    "-c", "user.name=Phase10 Integration Test",
    "-c", "user.email=phase10-integration@example.invalid",
    "commit", "--quiet", "-m", "Retain passing dependency evidence",
  ]);
}

function createIntegrationRepository(
  prefix: string,
  dependencyState: DependencyFixtureState = "pass",
): string {
  const repositoryRoot = mkdtempSync(join(tmpdir(), prefix));
  for (const path of REPOSITORY_FILES) copy(repositoryRoot, path);
  writeApDependencyFixture(repositoryRoot, dependencyState);
  return repositoryRoot;
}

function runModule(
  repositoryRoot: string,
  modulePath: string,
  args: readonly string[],
): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, [resolve(SOURCE_REPOSITORY, modulePath), ...args], {
    cwd: repositoryRoot,
    encoding: "utf8",
    windowsHide: true,
  });
}

function runProduce(repositoryRoot: string): ReturnType<typeof spawnSync> {
  return runModule(repositoryRoot, PRODUCER_PATH, [
    "produce",
    "--repository-root", ".",
    "--protocol", PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH,
    "--out", "out/phase10-scope-intake-v1-candidate",
  ]);
}

function runVerify(repositoryRoot: string): ReturnType<typeof spawnSync> {
  return runModule(repositoryRoot, VERIFIER_PATH, [
    "verify",
    "--repository-root", ".",
    "--protocol", PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH,
    "--bundle", "out/phase10-scope-intake-v1-candidate",
    "--receipt", "out/phase10-scope-intake-v1-candidate/scope-verification.json",
  ]);
}

function runPublish(repositoryRoot: string): ReturnType<typeof spawnSync> {
  return runModule(repositoryRoot, PRODUCER_PATH, [
    "publish",
    "--repository-root", ".",
    "--candidate", "out/phase10-scope-intake-v1-candidate",
    "--out", SCOPE_EVIDENCE_PATH,
  ]);
}

function staticOptions(repositoryRoot: string): {
  readonly repositoryRoot: string;
  readonly packetId: "a-s";
  readonly attemptId: string;
  readonly candidateDirectory: string;
  readonly command: typeof PHASE10_SCOPE_PRODUCE_COMMAND;
  readonly repositoryBundleRoot: ".";
} {
  return Object.freeze({
    repositoryRoot,
    packetId: "a-s",
    attemptId: STATIC_ATTEMPT_ID,
    candidateDirectory: "out/phase10-scope-intake-v1-candidate",
    command: PHASE10_SCOPE_PRODUCE_COMMAND,
    repositoryBundleRoot: ".",
  });
}

function parsePrettyJson(artifactBytes: Uint8Array, label: string): unknown {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(artifactBytes);
  expect(text, label).not.toContain("\r");
  const parsed = JSON.parse(text) as unknown;
  expect(text, label).toBe(`${JSON.stringify(parsed, null, 2)}\n`);
  return parsed;
}

function prettyJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);
}

function compactJsonlBytes(rows: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function writeBundle(
  repositoryRoot: string,
  name: string,
  artifacts: ReadonlyMap<string, Uint8Array>,
  override: Partial<Record<(typeof PRODUCER_FILES)[number], Uint8Array>> = {},
): string {
  const directory = resolve(repositoryRoot, "out", name);
  mkdirSync(directory, { recursive: true });
  for (const fileName of PRODUCER_FILES) {
    const artifactBytes = override[fileName] ?? artifacts.get(fileName);
    if (artifactBytes === undefined) throw new Error(`test bundle lacks ${fileName}`);
    writeFileSync(resolve(directory, fileName), artifactBytes, { flag: "wx" });
  }
  return directory;
}

function independentlyCount(rows: readonly Phase10ScopeOverlayRow[]): Phase10ScopeCorpusCounts {
  const template = <T extends string>(keys: readonly T[]): Record<T, number> =>
    Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;
  const phenomenonClass = template([
    "aggregation", "impurity-or-chemistry", "mixed-or-uncertain", "nucleation",
    "polycrystal-or-twin", "riming-or-graupel", "single-crystal",
  ] as const);
  const modelClassScope = template(["in", "mixed", "out", "unresolved"] as const);
  const representabilityBlockerCardinality = { zero: 0, one: 0, multiple: 0 };
  const representabilityBlockerKindOccurrences = template([
    "missing-forcing-map", "missing-observation-operator", "missing-physical-operator",
    "numerical-inadequacy", "other",
  ] as const);
  const specimenApparatusCompatibility = template([
    "adapter-required", "direct", "incompatible", "source-blocked",
  ] as const);
  const immutableEvidenceRole = template([
    "descriptive-only", "phase8a-historical-held-out-no-current-gate-effect",
    "phase8a-historical-input", "phase8a-historical-model-development",
    "phase8a-historical-out-of-model", "phase8b-development",
  ] as const);
  const phaseOwnership = template([
    "outside-phase7-and-phase10", "phase10-development",
    "phase7-held-out-product-gpu-obligation", "shared-read-only-input",
  ] as const);
  const currentDecisionEligibility = template([
    "categorical-only", "diagnostic-only", "quantitative", "refused",
  ] as const);
  for (const row of rows) {
    phenomenonClass[row.phenomenonClass] += 1;
    modelClassScope[row.modelClassScope.status] += 1;
    representabilityBlockerCardinality[
      row.representabilityBlockers.length === 0 ? "zero" :
        row.representabilityBlockers.length === 1 ? "one" : "multiple"
    ] += 1;
    for (const blocker of row.representabilityBlockers) {
      representabilityBlockerKindOccurrences[blocker.kind] += 1;
    }
    specimenApparatusCompatibility[row.specimenApparatusCompatibility.status] += 1;
    immutableEvidenceRole[row.immutableEvidenceRole] += 1;
    phaseOwnership[row.phaseOwnership] += 1;
    currentDecisionEligibility[row.currentDecisionEligibility.status] += 1;
  }
  return {
    totalRows: rows.length,
    phenomenonClass,
    modelClassScope,
    representabilityBlockerCardinality,
    representabilityBlockerKindOccurrences,
    specimenApparatusCompatibility,
    immutableEvidenceRole,
    phaseOwnership,
    currentDecisionEligibility,
  };
}

beforeAll(() => {
  const repositoryRoot = mkdtempSync(join(tmpdir(), "phase10-as-focused-"));
  for (const path of REPOSITORY_FILES) {
    copy(repositoryRoot, path);
  }
  git(repositoryRoot, ["init", "--quiet", "--initial-branch=phase10/evidence-verification"]);
  git(repositoryRoot, ["add", "--all"]);
  git(repositoryRoot, [
    "-c", "user.name=Phase10 Focused Test",
    "-c", "user.email=phase10-test@example.invalid",
    "commit", "--quiet", "-m", "Freeze test protocol",
  ]);
  const commit = git(repositoryRoot, ["rev-parse", "HEAD"]);
  const producer = producePhase10ScopeArtifacts({
    protocolPath: PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH,
    protocolBytes: bytes(resolve(repositoryRoot, PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH)),
    foundationBytes: bytes(resolve(repositoryRoot, FOUNDATION_PATH)),
    matrixBytes: bytes(resolve(repositoryRoot, MATRIX_PATH)),
    schemaRegistryBytes: bytes(resolve(repositoryRoot, SCHEMA_REGISTRY_PATH)),
    contractBytes: bytes(resolve(repositoryRoot, CONTRACT_PATH)),
    charterBytes: bytes(resolve(repositoryRoot, CHARTER_PATH)),
    decisionBytes: bytes(resolve(repositoryRoot, DECISION_PATH)),
    phase8aFreezeBytes: bytes(resolve(repositoryRoot, PHASE8A_FREEZE_PATH)),
    phase8aBytes: bytes(resolve(repositoryRoot, PHASE8A_PATH)),
    phase8bBytes: bytes(resolve(repositoryRoot, PHASE8B_PATH)),
    provenance: {
      commit,
      command: PHASE10_SCOPE_PRODUCE_COMMAND,
      startedOn: "2026-08-21T12:00:00.000Z",
      endedOn: "2026-08-21T12:00:00.001Z",
      actualConcurrency: 1,
    },
  });
  const bundleDirectory = writeBundle(repositoryRoot, "valid", producer.artifacts);
  const evaluation = phase10ScopeOverlayVerify({
    repositoryRoot,
    protocolPath: PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH,
    bundleDirectory,
  });
  state = Object.freeze({
    repositoryRoot,
    commit,
    bundleDirectory,
    artifacts: producer.artifacts,
    evaluation,
  });
}, 30_000);

afterAll(() => {
  if (state !== undefined) rmSync(state.repositoryRoot, { recursive: true, force: true });
});

describe("Phase 10 A-S scope overlay", () => {
  it("reconstructs the registered raw v1.28 charter instead of substituting the later live charter", () => {
    const protocol = parsePhase10ScopeClassificationProtocol(
      JSON.parse(
        readFileSync(
          resolve(state.repositoryRoot, PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH),
          "utf8",
        ),
      ),
    );
    const frozenCharter = bytes(resolve(state.repositoryRoot, CHARTER_PATH));
    expect(frozenCharter.byteLength).toBe(protocol.rules.authority.charterArtifact.byteLength);
    expect(sha256Bytes(frozenCharter)).toBe(protocol.rules.authority.charterArtifact.sha256);
    expect(sha256Bytes(bytes(resolve(SOURCE_REPOSITORY, CHARTER_PATH))))
      .not.toBe(protocol.rules.authority.charterArtifact.sha256);
  });

  it("independently executes every registered check and exact mutation control", () => {
    expect(
      state.evaluation.verdict,
      JSON.stringify({
        checks: state.evaluation.checkResults.filter((result) => result.verdict === "fail"),
        controls: state.evaluation.negativeControlResults.filter((result) =>
          !result.mutationExecuted || !result.rejected || result.errors.length > 0),
      }),
    ).toBe("pass");
    expect(state.evaluation.executedCheckIds).toEqual([...PHASE10_AS_CHECK_IDS]);
    expect(state.evaluation.checkResults).toHaveLength(11);
    for (const result of state.evaluation.checkResults) {
      expect(result.verdict, `${result.checkId}: ${result.detail.errors.join("; ")}`).toBe("pass");
      expect(result.detail.errors).toEqual([]);
      expect(result.detail.witnessOutputIds).toEqual([...result.detail.witnessOutputIds].sort());
    }
    expect(state.evaluation.executedNegativeControlIds).toEqual([
      "nc-as-collapse-multiple-blockers",
      "nc-as-drop-one-overlay-row",
      "nc-as-rewrite-frozen-role",
      "nc-as-upgrade-validation-credit",
    ]);
    for (const result of state.evaluation.negativeControlResults) {
      expect(result.mutationExecuted, result.errors.join("; ")).toBe(true);
      expect(result.rejected, result.errors.join("; ")).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.beforeWitness.sha256).not.toBe(result.afterWitness.sha256);
      expect(result.beforeWitness.semanticFingerprint.sha256)
        .not.toBe(result.afterWitness.semanticFingerprint.sha256);
      expect(result.afterWitness.path).toBe(
        `out/phase10-scope-negative-controls/${result.negativeControlId}/${
          result.beforeWitness.path.split("/").at(-1)
        }`,
      );
    }
  });

  it("retains exactly 18 Phase 8A entries plus status and all 51 Phase 8B rows", () => {
    const source8a = jsonlRows<Record<string, unknown>>(bytes(resolve(state.repositoryRoot, PHASE8A_PATH)));
    expect(source8a).toHaveLength(19);
    expect(source8a.filter((row) => row.recordKind === "entry")).toHaveLength(18);
    expect(source8a.at(-1)?.recordKind).toBe("book-status");
    const rows8a = jsonlRows<unknown>(state.artifacts.get("phase8a-overlay.jsonl")!)
      .map(parsePhase10ScopeOverlayRow);
    const rows8b = jsonlRows<unknown>(state.artifacts.get("phase8b-overlay.jsonl")!)
      .map(parsePhase10ScopeOverlayRow);
    expect(rows8a).toHaveLength(18);
    expect(rows8b).toHaveLength(51);
    expect(rows8a.every((row) => row.corpus === "phase8a")).toBe(true);
    expect(rows8b.every((row) => row.corpus === "phase8b")).toBe(true);
  });

  it("preserves immutable roles, seven held-out owners, and the zero-held-out successor corpus", () => {
    const rows8a = jsonlRows<unknown>(state.artifacts.get("phase8a-overlay.jsonl")!)
      .map(parsePhase10ScopeOverlayRow);
    const rows8b = jsonlRows<unknown>(state.artifacts.get("phase8b-overlay.jsonl")!)
      .map(parsePhase10ScopeOverlayRow);
    const heldOut = rows8a.filter(
      (row) => row.immutableEvidenceRole === "phase8a-historical-held-out-no-current-gate-effect",
    );
    expect(heldOut).toHaveLength(7);
    expect(heldOut.every(
      (row) => row.phaseOwnership === "phase7-held-out-product-gpu-obligation",
    )).toBe(true);
    expect(rows8b.every((row) =>
      row.immutableEvidenceRole === "phase8b-development" &&
      row.phaseOwnership === "phase10-development"
    )).toBe(true);
  });

  it("retains cited reasons, multi-blocker witnesses, and the challenged scope distinctions", () => {
    const rows = [
      ...jsonlRows<unknown>(state.artifacts.get("phase8a-overlay.jsonl")!).map(parsePhase10ScopeOverlayRow),
      ...jsonlRows<unknown>(state.artifacts.get("phase8b-overlay.jsonl")!).map(parsePhase10ScopeOverlayRow),
    ];
    expect(rows.every((row) =>
      row.modelClassScope.reason.length > 0 &&
      row.modelClassScope.citationRefs.length > 0 &&
      row.specimenApparatusCompatibility.reason.length > 0 &&
      row.specimenApparatusCompatibility.citationRefs.length > 0
    )).toBe(true);
    expect(rows.some((row) => row.representabilityBlockers.length >= 2)).toBe(true);
    const bySource = new Map(rows.map((row) => [row.sourceJoin.sourceRecordId, row]));
    expect(bySource.get("P8-T-BACON-SEED-HISTORY")).toMatchObject({
      phenomenonClass: "nucleation",
      modelClassScope: { status: "out" },
      phaseOwnership: "phase7-held-out-product-gpu-obligation",
    });
    expect(bySource.get("P8-T-NELSON-SUBLIMATION")).toMatchObject({
      phenomenonClass: "single-crystal",
      modelClassScope: { status: "out" },
    });
    expect(bySource.get("P8B-P1-BACON-INITIATION-ASPECT")).toMatchObject({
      phenomenonClass: "nucleation",
      modelClassScope: { status: "out" },
    });
    const unobservedLevitation = rows.filter((row) =>
      row.modelClassScope.reason.includes("crystallography") ||
      row.modelClassScope.reason.includes("grain count")
    );
    expect(unobservedLevitation.length).toBeGreaterThan(0);
    expect(unobservedLevitation.every((row) =>
      row.phenomenonClass === "mixed-or-uncertain" &&
      row.modelClassScope.status === "unresolved"
    )).toBe(true);
  });

  it("matches both report count families to an independent overlay reduction", () => {
    const rows8a = jsonlRows<unknown>(state.artifacts.get("phase8a-overlay.jsonl")!)
      .map(parsePhase10ScopeOverlayRow);
    const rows8b = jsonlRows<unknown>(state.artifacts.get("phase8b-overlay.jsonl")!)
      .map(parsePhase10ScopeOverlayRow);
    const report = parsePhase10ScopeReport(
      parsePrettyJson(state.artifacts.get("scope-report.json")!, "scope report"),
    );
    expect(report.phase8aCounts).toEqual(independentlyCount(rows8a));
    expect(report.phase8bCounts).toEqual(independentlyCount(rows8b));
    expect(report.phase8aCounts.totalRows).toBe(18);
    expect(report.phase8bCounts.totalRows).toBe(51);
    expect(report.phase8aCounts.currentDecisionEligibility.quantitative).toBe(0);
    expect(report.phase8bCounts.currentDecisionEligibility.quantitative).toBe(0);
  });

  it("rejects a coordinated zero-blocker validation-credit upgrade even with repaired report and index", () => {
    const phase8a = jsonlRows<Record<string, unknown>>(
      state.artifacts.get("phase8a-overlay.jsonl")!,
    ).map((row) => structuredClone(row));
    const upgraded = phase8a.find((row) => {
      const blockers = row.representabilityBlockers;
      const eligibility = row.currentDecisionEligibility as Record<string, unknown>;
      return Array.isArray(blockers) && blockers.length === 0 && eligibility.status === "diagnostic-only";
    });
    expect(upgraded).toBeDefined();
    upgraded!.currentDecisionEligibility = {
      blockingOperandIds: [],
      reason: "Adversarial coordinated upgrade with no protocol authority.",
      status: "quantitative",
    };
    const phase8aBytes = compactJsonlBytes(phase8a);

    const report = structuredClone(parsePrettyJson(
      state.artifacts.get("scope-report.json")!,
      "scope report",
    )) as Record<string, unknown>;
    const phase8aCounts = report.phase8aCounts as Record<string, unknown>;
    const eligibilityCounts = phase8aCounts.currentDecisionEligibility as Record<string, number>;
    eligibilityCounts["diagnostic-only"]! -= 1;
    eligibilityCounts.quantitative! += 1;
    const reportBytes = prettyJsonBytes(report);

    const index = structuredClone(parsePrettyJson(
      state.artifacts.get("scope-artifact-index.json")!,
      "scope artifact index",
    )) as { artifacts: Array<Record<string, unknown>> };
    for (const entry of index.artifacts) {
      const replacement = entry.artifactId === "out-as-phase8a-overlay"
        ? phase8aBytes
        : entry.artifactId === "out-as-report"
          ? reportBytes
          : undefined;
      if (replacement !== undefined) {
        entry.byteLength = replacement.byteLength;
        entry.sha256 = sha256Bytes(replacement);
      }
    }
    const indexBytes = prettyJsonBytes(index);
    const bundleDirectory = writeBundle(
      state.repositoryRoot,
      "eligibility-upgrade",
      state.artifacts,
      {
        "phase8a-overlay.jsonl": phase8aBytes,
        "scope-report.json": reportBytes,
        "scope-artifact-index.json": indexBytes,
      },
    );
    const evaluation = phase10ScopeOverlayVerify({
      repositoryRoot: state.repositoryRoot,
      protocolPath: PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH,
      bundleDirectory,
    });
    expect(evaluation.verdict).toBe("fail");
    expect(evaluation.checkResults.find(
      (result) => result.checkId === "chk-as-modelclass-blocker-separation",
    )?.verdict).toBe("fail");
    expect(evaluation.checkResults.find(
      (result) => result.checkId === "chk-as-artifact-index-integrity",
    )?.verdict).toBe("pass");
    expect(evaluation.checkResults.find(
      (result) => result.checkId === "chk-as-separate-corpus-totals",
    )?.verdict).toBe("pass");
  });

  it("rejects a coordinated producer-provenance rewrite even with a repaired artifact index", () => {
    const report = structuredClone(parsePrettyJson(
      state.artifacts.get("scope-report.json")!,
      "scope report",
    )) as Record<string, unknown>;
    const producer = report.producer as Record<string, unknown>;
    producer.command = "node runner/src/phase10-scope-overlay.ts produce --repository-root tampered";
    producer.actualConcurrency = 2;
    const reportBytes = prettyJsonBytes(report);

    const index = structuredClone(parsePrettyJson(
      state.artifacts.get("scope-artifact-index.json")!,
      "scope artifact index",
    )) as { artifacts: Array<Record<string, unknown>> };
    const reportEntry = index.artifacts.find((entry) => entry.artifactId === "out-as-report");
    expect(reportEntry).toBeDefined();
    reportEntry!.byteLength = reportBytes.byteLength;
    reportEntry!.sha256 = sha256Bytes(reportBytes);
    const indexBytes = prettyJsonBytes(index);
    const bundleDirectory = writeBundle(
      state.repositoryRoot,
      "producer-provenance-rewrite",
      state.artifacts,
      {
        "scope-report.json": reportBytes,
        "scope-artifact-index.json": indexBytes,
      },
    );
    const evaluation = phase10ScopeOverlayVerify({
      repositoryRoot: state.repositoryRoot,
      protocolPath: PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH,
      bundleDirectory,
    });
    expect(evaluation.verdict).toBe("fail");
    expect(evaluation.checkResults.find(
      (result) => result.checkId === "chk-as-artifact-index-integrity",
    )?.verdict).toBe("pass");
    expect(evaluation.checkResults.find(
      (result) => result.checkId === "chk-as-protocol-before-classification",
    )?.verdict).toBe("fail");
  });

  it("binds canonical producer bytes through the exact three-entry index and four evaluated paths", () => {
    for (const name of PRODUCER_FILES) {
      const artifactBytes = state.artifacts.get(name)!;
      if (name.endsWith(".json")) parsePrettyJson(artifactBytes, name);
      else expect(new TextDecoder().decode(artifactBytes)).not.toContain("\r");
    }
    const index = JSON.parse(
      new TextDecoder().decode(state.artifacts.get("scope-artifact-index.json")!),
    ) as { readonly artifacts: readonly { readonly artifactId: string; readonly path: string }[] };
    expect(index.artifacts.map((entry) => [entry.artifactId, entry.path])).toEqual([
      ["out-as-phase8a-overlay", "phase8a-overlay.jsonl"],
      ["out-as-phase8b-overlay", "phase8b-overlay.jsonl"],
      ["out-as-report", "scope-report.json"],
    ]);
    expect(state.evaluation.evaluatedArtifacts.map((entry) => [entry.outputId, entry.path])).toEqual([
      ["out-as-artifact-index", "evidence/phase10-scope-intake-v1/scope-artifact-index.json"],
      ["out-as-phase8a-overlay", "evidence/phase10-scope-intake-v1/phase8a-overlay.jsonl"],
      ["out-as-phase8b-overlay", "evidence/phase10-scope-intake-v1/phase8b-overlay.jsonl"],
      ["out-as-report", "evidence/phase10-scope-intake-v1/scope-report.json"],
    ]);
  });

  it("writes only a canonical packet-specific verification receipt with resolved evaluator bytes", () => {
    const bundleDirectory = writeBundle(state.repositoryRoot, "receipt", state.artifacts);
    const receipt = writePhase10ScopeVerificationReceipt({
      repositoryRoot: state.repositoryRoot,
      bundleDirectory,
      evaluation: state.evaluation,
      startedOn: "2026-08-21T12:00:01.000Z",
      endedOn: "2026-08-21T12:00:01.001Z",
    });
    const receiptBytes = bytes(resolve(bundleDirectory, "scope-verification.json"));
    expect(parsePrettyJson(receiptBytes, "verification receipt")).toEqual(receipt);
    expect(receipt.verdict).toBe("pass");
    expect(receipt.evaluator).toMatchObject({
      callableId: "phase10-as-verifier",
      modulePath: VERIFIER_PATH,
      exportName: "phase10ScopeOverlayVerify",
      byteLength: bytes(resolve(state.repositoryRoot, VERIFIER_PATH)).byteLength,
      sha256: sha256Bytes(bytes(resolve(state.repositoryRoot, VERIFIER_PATH))),
    });
    expect(receipt.callableRegistry.path).toBe(CALLABLE_REGISTRY_PATH);
  });

  it("requires the exact candidate-local receipt path at the CLI boundary", () => {
    const bundleDirectory = writeBundle(state.repositoryRoot, "cli", state.artifacts);
    const modulePath = resolve(SOURCE_REPOSITORY, VERIFIER_PATH);
    const command = [
      modulePath,
      "verify",
      "--repository-root", state.repositoryRoot,
      "--protocol", PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH,
      "--bundle", "out/cli",
      "--receipt", "out/cli/scope-verification.json",
    ];
    const accepted = spawnSync(process.execPath, command, {
      cwd: SOURCE_REPOSITORY,
      encoding: "utf8",
      windowsHide: true,
    });
    expect(accepted.status, accepted.stderr).toBe(0);
    expect(bytes(resolve(bundleDirectory, "scope-verification.json")).byteLength).toBeGreaterThan(0);
    const omitted = spawnSync(process.execPath, command.slice(0, -2), {
      cwd: SOURCE_REPOSITORY,
      encoding: "utf8",
      windowsHide: true,
    });
    expect(omitted.status).not.toBe(0);
    expect(omitted.stderr).toMatch(/--receipt/u);
  });

  it("fails closed on unsafe protocol paths and noncanonical candidate bytes", () => {
    expect(() => phase10ScopeOverlayVerify({
      repositoryRoot: state.repositoryRoot,
      protocolPath: "../phase10-scope-classification-protocol-v1.json",
      bundleDirectory: state.bundleDirectory,
    })).toThrow(/protocol path must be/u);
    const original = state.artifacts.get("phase8a-overlay.jsonl")!;
    const malformed = new Uint8Array(original.byteLength + 1);
    malformed.set(original);
    malformed[malformed.length - 1] = 0x20;
    const bundleDirectory = writeBundle(
      state.repositoryRoot,
      "noncanonical",
      state.artifacts,
      { "phase8a-overlay.jsonl": malformed },
    );
    expect(() => phase10ScopeOverlayVerify({
      repositoryRoot: state.repositoryRoot,
      protocolPath: PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH,
      bundleDirectory,
    })).toThrow(/LF-terminated JSONL/u);
  });

  it("keeps the independent evaluator source free of producer imports", () => {
    const source = new TextDecoder().decode(bytes(resolve(SOURCE_REPOSITORY, VERIFIER_PATH)));
    expect(source).not.toMatch(/from\s+["']\.\/phase10-scope-overlay\.ts["']/u);
    expect(source).not.toContain("producePhase10ScopeArtifacts");
    expect(canonicalJson(state.evaluation.executedCheckIds)).toBe(canonicalJson(PHASE10_AS_CHECK_IDS));
  });

  it("pins every resolved A-S callable module as checkout-stable binary text", () => {
    const registry = JSON.parse(
      readFileSync(resolve(SOURCE_REPOSITORY, CALLABLE_REGISTRY_PATH), "utf8"),
    ) as { callables: Array<{ resolution: string; modulePath: string }> };
    const modulePaths = [...new Set(
      registry.callables
        .filter((callable) => callable.resolution === "resolved")
        .map((callable) => callable.modulePath),
    )].sort();
    const attributes = git(SOURCE_REPOSITORY, ["check-attr", "text", "--", ...modulePaths]);
    expect(attributes.split("\n")).toEqual(
      modulePaths.map((modulePath) => `${modulePath}: text: unset`),
    );
  });

  it("binds the A-S protocol and contract to the reachable ca40a47 freeze blobs", () => {
    const ancestor = spawnSync(
      "git",
      ["merge-base", "--is-ancestor", SCOPE_FREEZE_COMMIT, "HEAD"],
      { cwd: SOURCE_REPOSITORY, windowsHide: true },
    );
    expect(ancestor.status, String(ancestor.stderr)).toBe(0);
    for (const [path, expected] of Object.entries(SCOPE_FREEZE_IDENTITIES)) {
      const workingBytes = bytes(resolve(SOURCE_REPOSITORY, path));
      expect(workingBytes.byteLength, path).toBe(expected.byteLength);
      expect(sha256Bytes(workingBytes), path).toBe(expected.sha256);
      const frozen = spawnSync("git", ["show", `${SCOPE_FREEZE_COMMIT}:${path}`], {
        cwd: SOURCE_REPOSITORY,
        windowsHide: true,
      });
      expect(frozen.status, `${path}: ${String(frozen.stderr)}`).toBe(0);
      const frozenBytes = new Uint8Array(frozen.stdout as Uint8Array);
      expect(frozenBytes.byteLength, `${path} frozen blob`).toBe(expected.byteLength);
      expect(sha256Bytes(frozenBytes), `${path} frozen blob`).toBe(expected.sha256);
    }
  });
});

describe("Phase 10 A-S static packet lifecycle", () => {
  it("rejects a structurally valid committed post-freeze classification-protocol drift", () => {
    const repositoryRoot = createIntegrationRepository("phase10-as-protocol-drift-");
    try {
      const protocolPath = resolve(repositoryRoot, PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH);
      const protocol = JSON.parse(readFileSync(protocolPath, "utf8")) as {
        createdOn: string;
        classifications: Array<{ classifiedOn: string }>;
      };
      protocol.createdOn = "2026-08-20";
      for (const classification of protocol.classifications) classification.classifiedOn = protocol.createdOn;
      replacePrettyJson(protocolPath, protocol);
      expect(() => parsePhase10ScopeClassificationProtocol(protocol)).not.toThrow();
      git(repositoryRoot, ["add", "--", PHASE10_SCOPE_CLASSIFICATION_PROTOCOL_PATH]);
      git(repositoryRoot, [
        "-c", "user.name=Phase10 Integration Test",
        "-c", "user.email=phase10-integration@example.invalid",
        "commit", "--quiet", "-m", "Inject structurally valid post-freeze protocol drift",
      ]);
      const produced = runProduce(repositoryRoot);
      expect(produced.status).not.toBe(0);
      expect(produced.stderr).toMatch(/scope protocol differs from the exact ca40a47/u);
    } finally {
      rmSync(repositoryRoot, { recursive: true, force: true });
    }
  }, 30_000);

  it("requires an exact passing A-P dependency lifecycle before A-S preflight", () => {
    for (const [state, message] of [
      ["cross-attempt-terminal", /terminal receipt ID or pass state/u],
      ["empty-artifact-roster", /verified artifact IDs/u],
      ["historical-drift", /bytes at the retained dependency head differ/u],
      ["missing-terminal", /dependency terminal receipt|ENOENT|no such file/u],
      ["missing-preflight", /dependency preflight receipt|ENOENT|no such file/u],
      ["schema-substitution", /verification identity, schema, or pass verdict/u],
      ["tampered-preflight", /preflight observed matrix/u],
      ["tampered-control-witness", /dependency negative control .* differs/u],
      ["stale", /module byte identity differs/u],
      ["non-pass", /terminal receipt ID or pass state/u],
    ] as const) {
      const repositoryRoot = createIntegrationRepository(`phase10-as-dependency-${state}-`, state);
      try {
        const produced = runProduce(repositoryRoot);
        expect(produced.status, `${state}: ${produced.stderr}`).not.toBe(0);
        expect(produced.stderr).toMatch(message);
        expect(
          existsSync(resolve(repositoryRoot, "out/phase10-scope-intake-v1-candidate")),
        ).toBe(false);
      } finally {
        rmSync(repositoryRoot, { recursive: true, force: true });
      }
    }
  }, 60_000);

  it("executes the exact clean-head produce, verify, publish sequence and resumes exact publication", () => {
    const repositoryRoot = createIntegrationRepository("phase10-as-lifecycle-");
    try {
      const produce = runProduce(repositoryRoot);
      expect(produce.status, String(produce.stderr)).toBe(0);
      const preflightPath = resolve(repositoryRoot, "out/phase10-scope-intake-v1-candidate/preflight.json");
      expect(existsSync(preflightPath)).toBe(true);
      const preflight = JSON.parse(readFileSync(preflightPath, "utf8")) as {
        observed: {
          branch: string;
          head: string;
          runtime: string;
          dependencyArtifacts: unknown;
        };
      };
      expect(preflight.observed).toMatchObject({
        branch: "phase10/evidence-verification",
        head: git(repositoryRoot, ["rev-parse", "HEAD"]),
        runtime: process.version,
      });
      expect(
        preflight.observed.dependencyArtifacts,
      ).toEqual([
        expect.objectContaining({
          packetId: "a-p",
          preflightReceipt: expect.objectContaining({ path: AP_PREFLIGHT_RECEIPT_PATH }),
          terminalReceipt: expect.objectContaining({ path: AP_TERMINAL_RECEIPT_PATH }),
          verificationArtifacts: [expect.objectContaining({ path: AP_VERIFICATION_PATH })],
        }),
      ]);

      const verify = runVerify(repositoryRoot);
      expect(verify.status, String(verify.stderr)).toBe(0);
      const publish = runPublish(repositoryRoot);
      expect(publish.status, String(publish.stderr)).toBe(0);
      for (const path of [
        `${SCOPE_EVIDENCE_PATH}/phase8a-overlay.jsonl`,
        `${SCOPE_EVIDENCE_PATH}/phase8b-overlay.jsonl`,
        `${SCOPE_EVIDENCE_PATH}/scope-report.json`,
        `${SCOPE_EVIDENCE_PATH}/scope-artifact-index.json`,
        `${SCOPE_EVIDENCE_PATH}/scope-verification.json`,
        `${STATIC_RECEIPT_DIRECTORY}/preflight.json`,
        `${STATIC_RECEIPT_DIRECTORY}/terminal-receipt.json`,
      ]) {
        expect(existsSync(resolve(repositoryRoot, path)), path).toBe(true);
      }
      const resumed = runPublish(repositoryRoot);
      expect(resumed.status, String(resumed.stderr)).toBe(0);
    } finally {
      rmSync(repositoryRoot, { recursive: true, force: true });
    }
  }, 30_000);

  it("refuses a dirty preflight and a tampered retained observed runtime", () => {
    const dirtyRepository = createIntegrationRepository("phase10-as-dirty-");
    const tamperedRepository = createIntegrationRepository("phase10-as-observed-");
    try {
      writeFileSync(resolve(dirtyRepository, EXECUTION_README_PATH), "\n", { flag: "a" });
      const dirty = runProduce(dirtyRepository);
      expect(dirty.status).not.toBe(0);
      expect(dirty.stderr).toMatch(/repository changes exist/u);
      expect(existsSync(resolve(dirtyRepository, "out/phase10-scope-intake-v1-candidate"))).toBe(false);

      const tamperedProduce = runProduce(tamperedRepository);
      expect(tamperedProduce.status, String(tamperedProduce.stderr)).toBe(0);
      const tamperedVerify = runVerify(tamperedRepository);
      expect(tamperedVerify.status, String(tamperedVerify.stderr)).toBe(0);
      const preflightPath = resolve(
        tamperedRepository,
        "out/phase10-scope-intake-v1-candidate/preflight.json",
      );
      const preflight = JSON.parse(readFileSync(preflightPath, "utf8")) as {
        observed: Record<string, unknown>;
      };
      preflight.observed.runtime = "v0.0.0-tampered";
      replacePrettyJson(preflightPath, preflight);
      const tampered = runPublish(tamperedRepository);
      expect(tampered.status).not.toBe(0);
      expect(tampered.stderr).toMatch(/observed runtime differs/u);
      expect(existsSync(resolve(tamperedRepository, SCOPE_EVIDENCE_PATH))).toBe(false);
      expect(existsSync(resolve(tamperedRepository, STATIC_RECEIPT_DIRECTORY))).toBe(false);
    } finally {
      rmSync(dirtyRepository, { recursive: true, force: true });
      rmSync(tamperedRepository, { recursive: true, force: true });
    }
  }, 30_000);

  it("rejects terminal obligation-set drift and malformed mutation witnesses", () => {
    const terminalRepository = createIntegrationRepository("phase10-as-terminal-");
    const witnessRepository = createIntegrationRepository("phase10-as-witness-");
    try {
      const terminalProduce = runProduce(terminalRepository);
      expect(terminalProduce.status, String(terminalProduce.stderr)).toBe(0);
      const terminalVerify = runVerify(terminalRepository);
      expect(terminalVerify.status, String(terminalVerify.stderr)).toBe(0);
      const options = staticOptions(terminalRepository);
      writePhase10StaticTerminalReceipt({ ...options, terminalState: "pass" });
      const terminalPath = resolve(
        terminalRepository,
        "out/phase10-scope-intake-v1-candidate/terminal-receipt.json",
      );
      const terminal = JSON.parse(readFileSync(terminalPath, "utf8")) as {
        executedCheckIds: string[];
      };
      terminal.executedCheckIds = terminal.executedCheckIds.slice(1);
      replacePrettyJson(terminalPath, terminal);
      expect(() => publishPhase10StaticPacketReceipts(options)).toThrow(/receipt executed checks/u);

      const witnessProduce = runProduce(witnessRepository);
      expect(witnessProduce.status, String(witnessProduce.stderr)).toBe(0);
      const witnessVerify = runVerify(witnessRepository);
      expect(witnessVerify.status, String(witnessVerify.stderr)).toBe(0);
      const verificationPath = resolve(
        witnessRepository,
        "out/phase10-scope-intake-v1-candidate/scope-verification.json",
      );
      const originalVerification = readFileSync(verificationPath, "utf8");
      const verification = JSON.parse(originalVerification) as {
        negativeControlResults: Array<{
          negativeControlId: string;
          beforeWitness: {
            artifactId: string;
            path: string;
            byteLength: number;
            sha256: string;
            semanticFingerprint: { projection: unknown; sha256: string };
          };
          afterWitness: {
            artifactId: string;
            path: string;
            byteLength: number;
            sha256: string;
            semanticFingerprint: { projection: unknown; sha256: string };
          };
        }>;
      };
      verification.negativeControlResults[0]!.afterWitness.semanticFingerprint.projection = {
        tampered: true,
      };
      replacePrettyJson(verificationPath, verification);
      expect(() => validatePhase10ScopeCandidateForPublication({
        repositoryRoot: witnessRepository,
        candidateRelativePath: "out/phase10-scope-intake-v1-candidate",
        outputRelativePath: SCOPE_EVIDENCE_PATH,
      })).toThrow(/semantic-fingerprint digest differs/u);

      const transformed = JSON.parse(originalVerification) as typeof verification;
      const upgrade = transformed.negativeControlResults.find(
        (row) => row.negativeControlId === "nc-as-upgrade-validation-credit",
      );
      expect(upgrade).toBeDefined();
      upgrade!.afterWitness.semanticFingerprint.projection = {
        quantitativeValidationEarned: "tampered",
      };
      upgrade!.afterWitness.semanticFingerprint.sha256 = sha256Bytes(
        canonicalJsonBytes(upgrade!.afterWitness.semanticFingerprint.projection),
      );
      replacePrettyJson(verificationPath, transformed);
      expect(() => validatePhase10ScopeCandidateForPublication({
        repositoryRoot: witnessRepository,
        candidateRelativePath: "out/phase10-scope-intake-v1-candidate",
        outputRelativePath: SCOPE_EVIDENCE_PATH,
      })).toThrow(/false-to-true mutation/u);

      const coordinateTamper = JSON.parse(originalVerification) as typeof verification;
      const coordinateUpgrade = coordinateTamper.negativeControlResults.find(
        (row) => row.negativeControlId === "nc-as-upgrade-validation-credit",
      );
      expect(coordinateUpgrade).toBeDefined();
      const overlayBytes = bytes(resolve(
        witnessRepository,
        "out/phase10-scope-intake-v1-candidate/phase8a-overlay.jsonl",
      ));
      coordinateUpgrade!.beforeWitness.artifactId = "out-as-phase8a-overlay";
      coordinateUpgrade!.beforeWitness.path =
        "evidence/phase10-scope-intake-v1/phase8a-overlay.jsonl";
      coordinateUpgrade!.beforeWitness.byteLength = overlayBytes.byteLength;
      coordinateUpgrade!.beforeWitness.sha256 = sha256Bytes(overlayBytes);
      coordinateUpgrade!.afterWitness.artifactId = "out-as-phase8a-overlay";
      coordinateUpgrade!.afterWitness.path =
        "out/phase10-scope-negative-controls/nc-as-upgrade-validation-credit/phase8a-overlay.jsonl";
      replacePrettyJson(verificationPath, coordinateTamper);
      expect(() => validatePhase10ScopeCandidateForPublication({
        repositoryRoot: witnessRepository,
        candidateRelativePath: "out/phase10-scope-intake-v1-candidate",
        outputRelativePath: SCOPE_EVIDENCE_PATH,
      })).toThrow(/exact frozen target artifact/u);
    } finally {
      rmSync(terminalRepository, { recursive: true, force: true });
      rmSync(witnessRepository, { recursive: true, force: true });
    }
  }, 30_000);

  it("prevalidates a conflicting receipt destination and safely retries after its removal", () => {
    const repositoryRoot = createIntegrationRepository("phase10-as-destination-");
    try {
      const produce = runProduce(repositoryRoot);
      expect(produce.status, String(produce.stderr)).toBe(0);
      const verify = runVerify(repositoryRoot);
      expect(verify.status, String(verify.stderr)).toBe(0);
      writePhase10StaticTerminalReceipt({ ...staticOptions(repositoryRoot), terminalState: "pass" });
      const receiptDirectory = resolve(repositoryRoot, STATIC_RECEIPT_DIRECTORY);
      mkdirSync(receiptDirectory, { recursive: true });
      writeFileSync(resolve(receiptDirectory, "injected.txt"), "injected\n", { flag: "wx" });
      const refused = runPublish(repositoryRoot);
      expect(refused.status).not.toBe(0);
      expect(refused.stderr).toMatch(/outside the exact receipt pair/u);
      expect(existsSync(resolve(repositoryRoot, SCOPE_EVIDENCE_PATH))).toBe(false);
      rmSync(receiptDirectory, { recursive: true, force: true });
      const retried = runPublish(repositoryRoot);
      expect(retried.status, String(retried.stderr)).toBe(0);
      expect(existsSync(resolve(repositoryRoot, SCOPE_EVIDENCE_PATH))).toBe(true);
      expect(existsSync(resolve(repositoryRoot, `${STATIC_RECEIPT_DIRECTORY}/terminal-receipt.json`))).toBe(true);
    } finally {
      rmSync(repositoryRoot, { recursive: true, force: true });
    }
  }, 30_000);

  it("resumes either exact scope-only or receipt-only partial publication orientation", () => {
    for (const orientation of ["scope-only", "receipts-only"] as const) {
      const repositoryRoot = createIntegrationRepository(`phase10-as-${orientation}-`);
      try {
        const produce = runProduce(repositoryRoot);
        expect(produce.status, String(produce.stderr)).toBe(0);
        const verify = runVerify(repositoryRoot);
        expect(verify.status, String(verify.stderr)).toBe(0);
        const options = staticOptions(repositoryRoot);
        writePhase10StaticTerminalReceipt({ ...options, terminalState: "pass" });
        if (orientation === "scope-only") {
          publishPhase10ScopeCandidate({
            repositoryRoot,
            candidateRelativePath: options.candidateDirectory,
            outputRelativePath: SCOPE_EVIDENCE_PATH,
          });
        } else {
          publishPhase10StaticPacketReceipts(options);
        }
        const resumed = runPublish(repositoryRoot);
        expect(resumed.status, `${orientation}: ${resumed.stderr}`).toBe(0);
        expect(existsSync(resolve(repositoryRoot, `${SCOPE_EVIDENCE_PATH}/scope-report.json`))).toBe(true);
        expect(existsSync(resolve(repositoryRoot, `${STATIC_RECEIPT_DIRECTORY}/terminal-receipt.json`))).toBe(true);
      } finally {
        rmSync(repositoryRoot, { recursive: true, force: true });
      }
    }
  }, 30_000);

  it("documents identity verification, manifest pinning, and seven-file staging before npm test", () => {
    const readme = readFileSync(resolve(SOURCE_REPOSITORY, EXECUTION_README_PATH), "utf8");
    const identityIndex = readme.indexOf("$phase10PublishedPaths");
    const manifestIndex = readme.indexOf(
      "update `evidence/MANIFEST.json` manually",
      identityIndex,
    );
    const stageIndex = readme.indexOf("git add -- evidence/phase10-scope-intake-v1/phase8a-overlay.jsonl");
    const finalTestIndex = readme.indexOf("npm test", stageIndex);
    expect(identityIndex).toBeGreaterThan(0);
    expect(manifestIndex).toBeGreaterThan(identityIndex);
    expect(stageIndex).toBeGreaterThan(manifestIndex);
    expect(finalTestIndex).toBeGreaterThan(stageIndex);
    expect(readme).not.toContain("npm run evidence:pin");
    for (const path of [
      `${SCOPE_EVIDENCE_PATH}/phase8a-overlay.jsonl`,
      `${SCOPE_EVIDENCE_PATH}/phase8b-overlay.jsonl`,
      `${SCOPE_EVIDENCE_PATH}/scope-report.json`,
      `${SCOPE_EVIDENCE_PATH}/scope-artifact-index.json`,
      `${SCOPE_EVIDENCE_PATH}/scope-verification.json`,
      `${STATIC_RECEIPT_DIRECTORY}/preflight.json`,
      `${STATIC_RECEIPT_DIRECTORY}/terminal-receipt.json`,
    ]) {
      expect(readme, path).toContain(path);
    }
  });
});
