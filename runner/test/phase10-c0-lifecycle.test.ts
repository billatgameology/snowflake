import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  PHASE10_C0_GAP_IDS,
  PHASE10_C0_EXECUTOR_RESOURCES,
  PHASE10_C0_ROW_FIELDS,
  phase10C0EverySpacing,
  phase10C0ExecutorCommand,
  phase10C0ExpectedRows,
  phase10C0JsonlBytes,
  phase10C0ParsePrettyJson,
  phase10C0PrettyJsonBytes,
  parsePhase10C0Rows,
  type Phase10C0DeriveCandidateBytes,
  type Phase10C0ExecutionProvenance,
  type Phase10C0Row,
} from "../src/phase10-c0-contracts.ts";
import { producePhase10C0DeriveArtifacts } from "../src/phase10-c0-derive.ts";
import { writePhase10C0DeriveVerificationReceipt } from "../src/phase10-c0-derive-verification-receipt.ts";
import {
  independentlyEvaluatePhase10C0Derive,
  phase10C0ProveNegativeControlMutation,
  type Phase10C0EvaluatorExecution,
} from "../src/phase10-c0-independent.ts";
import {
  phase10C0CoarseFailFinePass,
  phase10C0DuplicateOrTruncatedRow,
  phase10C0FineFailCoarsePass,
  phase10C0ForbiddenField,
  phase10C0ForgedProducerVerdict,
  phase10C0MissingRow,
  phase10C0OperandEcho,
  type Phase10C0Mutation,
} from "../src/phase10-c0-negative-controls.ts";
import {
  PHASE10_C0_PUBLICATION_PATH,
  producePhase10C0PublishArtifacts,
  publishPhase10C0PacketCandidate,
} from "../src/phase10-c0-publish.ts";
import { phase10C0PublicationVerifier } from "../src/phase10-c0-publication-verifier.ts";
import { writePhase10C0PublishVerificationReceipt } from "../src/phase10-c0-publish-verification-receipt.ts";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");
const SCIENCE_PROTOCOL_BYTES = new Uint8Array(
  readFileSync(join(REPOSITORY_ROOT, "research/phase10-c0-protocol-v1.json")),
);
const HEAD = "78c1875cac6e744307995c12300cf2c3d431c5b2";
const PRODUCE_COMMAND = phase10C0ExecutorCommand("c0-derive", "synthetic-c0-derive-v1");
const tempDirectories: string[] = [];

function pretty(value: unknown): Uint8Array {
  return phase10C0PrettyJsonBytes(value);
}

const DUMMY_SHA = "0".repeat(64);

function identity(path: string): Record<string, unknown> {
  return { path, byteLength: 1, sha256: DUMMY_SHA };
}

function syntheticPreflight(packetId: "c0-derive" | "c0-publish"): Uint8Array {
  const attemptId = packetId === "c0-derive" ? "synthetic-c0-derive-v1" : "synthetic-c0-publish-v1";
  const protocolId = packetId === "c0-derive" ? "phase10-c0-derive-existing-byte-v1" : "phase10-c0-publish-existing-byte-v1";
  const registryId = packetId === "c0-derive" ? "phase10-c0-derive-resolved-callables-v3" : "phase10-c0-publish-resolved-callables-v3";
  const outputIds = packetId === "c0-derive"
    ? ["out-c0-analysis", "out-c0-comparisons", "out-c0-derive-verification", "out-c0-gaps", "out-c0-historical-limit"]
    : ["out-c0-artifact-index", "out-c0-report", "out-c0-verification-receipt"];
  const checkIds = packetId === "c0-derive"
    ? ["chk-c0-all-spacings", "chk-c0-comparison-roster", "chk-c0-cost-separation", "chk-c0-field-allowlist", "chk-c0-independent-rederivation", "chk-c0-no-solver", "chk-c0-operand-echo", "chk-c0-row-roster"]
    : ["chk-c0-publish-artifact-graph", "chk-c0-publish-breakdown", "chk-c0-publish-gap-list", "chk-c0-publish-historical-limit", "chk-c0-publish-no-habit-claim"];
  const controlIds = packetId === "c0-derive"
    ? ["nc-c0-coarse-fail-fine-pass", "nc-c0-duplicate-or-truncated", "nc-c0-fine-fail-coarse-pass", "nc-c0-forbidden-field", "nc-c0-forged-producer-verdict", "nc-c0-missing-row", "nc-c0-operand-echo"]
    : [];
  const callableIds = packetId === "c0-derive"
    ? ["phase10-c0-derive-check-caller", "phase10-c0-derive-producer", "phase10-c0-derive-verification-receipt-writer", "phase10-c0-evaluator", "phase10-nc-c0-coarse-fail-fine-pass", "phase10-nc-c0-duplicate-or-truncated", "phase10-nc-c0-fine-fail-coarse-pass", "phase10-nc-c0-forbidden-field", "phase10-nc-c0-forged-producer-verdict", "phase10-nc-c0-missing-row", "phase10-nc-c0-operand-echo"].sort()
    : ["phase10-c0-publication-verifier", "phase10-c0-publish-check-caller", "phase10-c0-publish-producer", "phase10-c0-publish-verification-receipt-writer"].sort();
  const dependencies = packetId === "c0-derive" ? ["a-p"] : ["a-p", "c0-derive"];
  const packetRoot = `out/phase10-execution-v1/attempts/${packetId}`;
  const attemptRoot = `${packetRoot}/${attemptId}`;
  return pretty({
    schema: "phase10-preflight-receipt-v1",
    receiptId: `phase10-${packetId}-${attemptId}-preflight-v1`,
    matrixId: "phase10-selected-package-obligations-v1",
    protocolId,
    registryId,
    packetId,
    attemptId,
    stage: "run",
    observed: {
      launchClass: "non-solver",
      branch: "phase10/evidence-verification",
      head: HEAD,
      runtime: "v24.13.1",
      command: phase10C0ExecutorCommand(packetId, attemptId),
      cwd: REPOSITORY_ROOT,
      repositoryBundleRoot: ".",
      matrix: identity("research/phase10-obligation-matrix-v1.json"),
      packetCatalogue: identity("research/phase10-execution-v1/packet-catalogue.json"),
      artifactSchemaRegistry: identity("research/phase10-artifact-schema-registry-v1.json"),
      scienceProtocol: identity("research/phase10-c0-protocol-v1.json"),
      protocol: identity(`research/phase10-execution-v1/packets/${packetId}/protocol.json`),
      callableRegistry: identity(`research/phase10-execution-v1/packets/${packetId}/callable-registry.json`),
      codeFreeze: { commit: HEAD, artifacts: [identity("research/phase10-c0-protocol-v1.json")] },
      registeredAttemptRoot: packetRoot,
      attemptDirectory: attemptRoot,
      candidateDirectory: `${attemptRoot}/candidate`,
      stdoutPath: `${attemptRoot}/stdout.log`,
      stderrPath: `${attemptRoot}/stderr.log`,
      exitStatusPath: `${attemptRoot}/exit-status.json`,
      resourceLedgerPath: `${attemptRoot}/resource-ledger.json`,
      lockPath: `${packetRoot}/writer.lock`,
      finalPreflightReceiptPath: `evidence/phase10-obligation-preflight-v1/packets/${packetId}/preflight.json`,
      finalTerminalReceiptPath: `evidence/phase10-obligation-preflight-v1/packets/${packetId}/terminal-receipt.json`,
      verificationPaths: [packetId === "c0-derive" ? "evidence/phase10-numerical-verification-v1/c0-derive-verification.json" : "evidence/phase10-numerical-verification-v1/c0-verification.json"],
      dependencyPacketIds: dependencies,
      dependencyArtifacts: dependencies.map((dependency) => ({
        packetId: dependency,
        protocol: identity(`research/phase10-execution-v1/packets/${dependency}/protocol.json`),
        callableRegistry: identity(`research/phase10-execution-v1/packets/${dependency}/callable-registry.json`),
        preflightReceipt: identity(`evidence/phase10-obligation-preflight-v1/packets/${dependency}/preflight.json`),
        terminalReceipt: identity(`evidence/phase10-obligation-preflight-v1/packets/${dependency}/terminal-receipt.json`),
        verificationArtifacts: [identity(`evidence/synthetic/${dependency}-verification.json`)],
      })),
      resources: { ...PHASE10_C0_EXECUTOR_RESOURCES, observedFreeBytes: PHASE10_C0_EXECUTOR_RESOURCES.minimumFreeBytes },
    },
    outputIds,
    checkIds,
    negativeControlIds: controlIds,
    callableIds,
    selectedBranches: {},
    verdict: "pass",
    reasons: [],
  });
}

function asObject(bytes: Uint8Array): Record<string, unknown> {
  return phase10C0ParsePrettyJson(bytes, "test artifact") as Record<string, unknown>;
}

function jsonlObjects(bytes: Uint8Array): Record<string, unknown>[] {
  const text = new TextDecoder().decode(bytes);
  return text.slice(0, -1).split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
}

function syntheticRows(): readonly Phase10C0Row[] {
  return phase10C0ExpectedRows().map((expected, index) => Object.freeze({
    ...expected,
    stopReason: "size-target",
    cycles: 100 + index,
    totalSweeps: 1_000 + index * 2,
    wallSeconds: 5 + index / 10,
    attachedCount: 10_000,
    finalExtent: expected.targetExtent,
    aspectRatio: 0.5,
    symmetryError: index / 1_000_000,
    engine: "node-v24.13.1-v8-synthetic",
    peakRssBytes: 1_000_000 + index * 1_000,
    gitHead: /^dom-0\.35-n(112|128)@/u.test(expected.rowId)
      ? "aa812952efbf5c4ef7152cc7595342092a51b000"
      : "f59d18702301155c0c2e7eaecc3442e6cf117123",
    startedIso: "2026-08-21T10:00:00.000Z",
    finishedIso: "2026-08-21T10:01:00.000Z",
    concurrency: 1,
    host: "synthetic-host",
    dispatcherCommand: "synthetic frozen Phase 6 row fixture",
  }));
}

function rowsBytes(rows: readonly Phase10C0Row[] = syntheticRows()): Uint8Array {
  return new TextEncoder().encode(`${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
}

function historicalReport(): Uint8Array {
  return pretty({
    overallVerdict: "pass",
    overallNoPassClass: null,
    expectedRowCount: 80,
    presentExpectedRowCount: 80,
    missingRowIds: [],
    unexpectedRowIds: [],
    spacings: [
      { dxUm: 0.7, domainPass: true, auxiliaryPass: true, verdict: "pass", noPassClass: null },
      { dxUm: 0.35, domainPass: true, auxiliaryPass: true, verdict: "pass", noPassClass: null },
    ],
  });
}

function producerExecution(): Phase10C0ExecutionProvenance {
  return Object.freeze({
    runtime: "v24.13.1",
    command: PRODUCE_COMMAND,
    cwd: REPOSITORY_ROOT,
    gitHead: HEAD,
    startedIso: "2026-08-21T11:00:00.000Z",
    finishedIso: "2026-08-21T11:00:01.000Z",
    processConcurrency: 1,
  });
}

function publicationExecution(): Phase10C0ExecutionProvenance {
  return Object.freeze({ ...producerExecution(), command: phase10C0ExecutorCommand("c0-publish", "synthetic-c0-publish-v1") });
}

function evaluatorExecution(): Phase10C0EvaluatorExecution {
  const bytes = new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "runner/src/phase10-c0-independent.ts")));
  return Object.freeze({
    evaluatorCallableId: "phase10-c0-evaluator",
    modulePath: "runner/src/phase10-c0-independent.ts",
    exportName: "independentlyEvaluatePhase10C0Derive",
    byteLength: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    runtime: "v24.13.1",
    command: PRODUCE_COMMAND,
    gitHead: HEAD,
    startedOn: "2026-08-21T11:00:02.000Z",
    endedOn: "2026-08-21T11:00:03.000Z",
    processConcurrency: 1,
  });
}

function deriveFixture(): {
  readonly candidate: Phase10C0DeriveCandidateBytes;
  readonly historicalReportBytes: Uint8Array;
} {
  const inputRows = rowsBytes();
  const historicalReportBytes = historicalReport();
  const artifacts = producePhase10C0DeriveArtifacts({
    scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
    preflightReceiptBytes: syntheticPreflight("c0-derive"),
    rowsBytes: inputRows,
    historicalReportBytes,
    execution: producerExecution(),
    enforceFrozenInputIdentities: false,
  });
  return Object.freeze({
    historicalReportBytes,
    candidate: Object.freeze({ rowsBytes: inputRows, ...artifacts }),
  });
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("Phase 10 C0 frozen existing-byte lifecycle", () => {
  it("enumerates and strictly parses exactly 80 rows and 64 registered pairings", () => {
    const parsed = parsePhase10C0Rows(rowsBytes());
    expect(parsed.rowsById.size).toBe(80);
    expect(parsed.pairings).toHaveLength(64);
    expect(parsed.defects).toEqual([]);
    expect(parsed.missingRowIds).toEqual([]);
  });

  it("binds the report transitively through analysis and every comparison snapshot to the 80 rows", () => {
    const fixture = deriveFixture();
    const analysis = asObject(fixture.candidate.analysisBytes);
    const comparisonsText = new TextDecoder().decode(fixture.candidate.comparisonsBytes);
    const comparisons = comparisonsText.slice(0, -1).split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
    const rowsIdentity = analysis.rowsArtifact as Record<string, unknown>;
    expect(rowsIdentity.sha256).toBe(createHash("sha256").update(fixture.candidate.rowsBytes).digest("hex"));
    expect((analysis.roster as Record<string, unknown>).presentExpectedRowCount).toBe(80);
    expect(comparisons).toHaveLength(64);
    const witnessed = new Set(comparisons.flatMap((row) => [
      (row.rowA as Record<string, unknown>).rowId,
      (row.rowB as Record<string, unknown>).rowId,
    ]));
    expect(witnessed.size).toBe(80);
    expect(comparisons.every((row) =>
      Object.keys(row.rowA as object).length === 36 && Object.keys(row.rowB as object).length === 36)).toBe(true);
  });

  it("independently re-derives all checks and executes all seven named controls", () => {
    const fixture = deriveFixture();
    const evaluation = independentlyEvaluatePhase10C0Derive({
      scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
      preflightReceiptBytes: syntheticPreflight("c0-derive"),
      historicalReportBytes: fixture.historicalReportBytes,
      candidate: fixture.candidate,
      evaluatorExecution: evaluatorExecution(),
      evaluatorCwd: REPOSITORY_ROOT,
      enforceFrozenInputIdentities: false,
    });
    expect(evaluation.aggregateVerdict).toBe("pass");
    expect(evaluation.checkResults).toHaveLength(8);
    expect(evaluation.checkResults.every((result) => result.verdict === "pass")).toBe(true);
    expect(evaluation.negativeControlResults).toHaveLength(7);
    expect(evaluation.negativeControlResults.every((result) =>
      result.mutationExecuted && result.rejected && result.errors.length === 0)).toBe(true);
  });

  it("rejects a coordinated derived diagnostic rewrite instead of trusting its producer", () => {
    const fixture = deriveFixture();
    const comparisons = jsonlObjects(fixture.candidate.comparisonsBytes);
    const first = comparisons[0]!;
    const diagnostics = first.normalizedDiagnostics as Array<Record<string, unknown>>;
    comparisons[0] = {
      ...first,
      normalizedDiagnostics: [{ ...diagnostics[0]!, valueA: (diagnostics[0]!.valueA as number) + 1 }, ...diagnostics.slice(1)],
    };
    const evaluation = independentlyEvaluatePhase10C0Derive({
      scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
      preflightReceiptBytes: syntheticPreflight("c0-derive"),
      historicalReportBytes: fixture.historicalReportBytes,
      candidate: { ...fixture.candidate, comparisonsBytes: phase10C0JsonlBytes(comparisons) },
      evaluatorExecution: evaluatorExecution(),
      evaluatorCwd: REPOSITORY_ROOT,
      enforceFrozenInputIdentities: false,
      executeNegativeControls: false,
    });
    const result = evaluation.checkResults.find((entry) => entry.checkId === "chk-c0-independent-rederivation");
    expect(result?.verdict).toBe("fail");
    expect(result?.reasons.join(" ")).toMatch(/normalized delta differs/u);
  });

  it("independently rejects a producer-side error-source map defect and nested extra field", () => {
    const fixture = deriveFixture();
    const comparisons = jsonlObjects(fixture.candidate.comparisonsBytes);
    comparisons[0] = { ...comparisons[0]!, errorSourceId: "relaxTol" };
    const mapped = independentlyEvaluatePhase10C0Derive({
      scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
      preflightReceiptBytes: syntheticPreflight("c0-derive"),
      historicalReportBytes: fixture.historicalReportBytes,
      candidate: { ...fixture.candidate, comparisonsBytes: phase10C0JsonlBytes(comparisons) },
      evaluatorExecution: evaluatorExecution(),
      evaluatorCwd: REPOSITORY_ROOT,
      enforceFrozenInputIdentities: false,
      executeNegativeControls: false,
    });
    expect(mapped.checkResults.find((entry) => entry.checkId === "chk-c0-independent-rederivation")?.verdict).toBe("fail");

    const nested = jsonlObjects(fixture.candidate.comparisonsBytes);
    const categorical = nested[0]!.categoricalDiagnostics as Array<Record<string, unknown>>;
    nested[0] = { ...nested[0]!, categoricalDiagnostics: [{ ...categorical[0]!, occupancyMask: "forbidden" }] };
    const extra = independentlyEvaluatePhase10C0Derive({
      scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
      preflightReceiptBytes: syntheticPreflight("c0-derive"),
      historicalReportBytes: fixture.historicalReportBytes,
      candidate: { ...fixture.candidate, comparisonsBytes: phase10C0JsonlBytes(nested) },
      evaluatorExecution: evaluatorExecution(),
      evaluatorCwd: REPOSITORY_ROOT,
      enforceFrozenInputIdentities: false,
      executeNegativeControls: false,
    });
    expect(extra.checkResults.find((entry) => entry.checkId === "chk-c0-field-allowlist")?.verdict).toBe("fail");
  });

  it("independently proves every exact control target and rejects no-op, wrong-target, and cross-target attacks", () => {
    const fixture = deriveFixture();
    const controls = [
      phase10C0CoarseFailFinePass,
      phase10C0DuplicateOrTruncatedRow,
      phase10C0FineFailCoarsePass,
      phase10C0ForbiddenField,
      phase10C0ForgedProducerVerdict,
      phase10C0MissingRow,
      phase10C0OperandEcho,
    ].map((callable) => callable(fixture.candidate));
    const originalBytes = (mutation: Phase10C0Mutation): Uint8Array => mutation.artifactId === "input-c0-rows"
      ? fixture.candidate.rowsBytes
      : mutation.artifactId === "out-c0-analysis"
      ? fixture.candidate.analysisBytes
      : fixture.candidate.comparisonsBytes;
    for (const [index, mutation] of controls.entries()) {
      expect(phase10C0ProveNegativeControlMutation(fixture.candidate, mutation)).toBe(true);
      const noOp = { ...mutation, mutatedBytes: originalBytes(mutation), candidate: fixture.candidate };
      expect(phase10C0ProveNegativeControlMutation(fixture.candidate, noOp)).toBe(false);
      const wrongTarget = { ...mutation, semanticTarget: { mutation: "wrong-attack" } };
      expect(phase10C0ProveNegativeControlMutation(fixture.candidate, wrongTarget)).toBe(false);
      const other = controls[(index + 1) % controls.length]!;
      const crossTarget = { ...mutation, mutatedBytes: other.mutatedBytes, candidate: other.candidate };
      expect(phase10C0ProveNegativeControlMutation(fixture.candidate, crossTarget)).toBe(false);
    }
  });

  it("binds producer and evaluator provenance to the exact same retained preflight", () => {
    const fixture = deriveFixture();
    const mutations = [
      { evaluatorExecution: { ...evaluatorExecution(), command: "node fake.ts" }, evaluatorCwd: REPOSITORY_ROOT, preflightReceiptBytes: syntheticPreflight("c0-derive") },
      { evaluatorExecution: { ...evaluatorExecution(), gitHead: "1".repeat(40) }, evaluatorCwd: REPOSITORY_ROOT, preflightReceiptBytes: syntheticPreflight("c0-derive") },
      { evaluatorExecution: { ...evaluatorExecution(), runtime: "v24.13.0" }, evaluatorCwd: REPOSITORY_ROOT, preflightReceiptBytes: syntheticPreflight("c0-derive") },
      { evaluatorExecution: evaluatorExecution(), evaluatorCwd: `${REPOSITORY_ROOT}-other`, preflightReceiptBytes: syntheticPreflight("c0-derive") },
      { evaluatorExecution: evaluatorExecution(), evaluatorCwd: REPOSITORY_ROOT, preflightReceiptBytes: syntheticPreflight("c0-publish") },
    ];
    for (const mutation of mutations) {
      expect(() => independentlyEvaluatePhase10C0Derive({
        scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
        historicalReportBytes: fixture.historicalReportBytes,
        candidate: fixture.candidate,
        enforceFrozenInputIdentities: false,
        executeNegativeControls: false,
        ...mutation,
      })).toThrow(/preflight|provenance|execution/u);
    }
    const resourceReceipt = asObject(syntheticPreflight("c0-derive"));
    const observed = resourceReceipt.observed as Record<string, unknown>;
    const resources = observed.resources as Record<string, unknown>;
    const insufficient = pretty({ ...resourceReceipt, observed: { ...observed, resources: { ...resources, observedFreeBytes: 1 } } });
    expect(() => independentlyEvaluatePhase10C0Derive({
      scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
      preflightReceiptBytes: insufficient,
      historicalReportBytes: fixture.historicalReportBytes,
      candidate: fixture.candidate,
      evaluatorExecution: evaluatorExecution(),
      evaluatorCwd: REPOSITORY_ROOT,
      enforceFrozenInputIdentities: false,
      executeNegativeControls: false,
    })).toThrow(/free bytes|resource/u);

    const analysis = asObject(fixture.candidate.analysisBytes);
    const recorded = analysis.execution as Record<string, unknown>;
    for (const productionMutation of [
      { command: "node renamed-solver.ts" },
      { gitHead: "2".repeat(40) },
      { cwd: `${REPOSITORY_ROOT}-other` },
      { runtime: "v24.13.0" },
      { processConcurrency: 2 },
    ]) {
      const result = independentlyEvaluatePhase10C0Derive({
        scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
        preflightReceiptBytes: syntheticPreflight("c0-derive"),
        historicalReportBytes: fixture.historicalReportBytes,
        candidate: { ...fixture.candidate, analysisBytes: pretty({ ...analysis, execution: { ...recorded, ...productionMutation } }) },
        evaluatorExecution: evaluatorExecution(),
        evaluatorCwd: REPOSITORY_ROOT,
        enforceFrozenInputIdentities: false,
        executeNegativeControls: false,
      });
      expect(result.checkResults.find((entry) => entry.checkId === "chk-c0-no-solver")?.verdict).toBe("fail");
    }
    expect(() => producePhase10C0PublishArtifacts({
      preflightReceiptBytes: syntheticPreflight("c0-publish"),
      execution: { ...publicationExecution(), command: "node fake-publisher.ts" },
      analysisBytes: fixture.candidate.analysisBytes,
      comparisonsBytes: fixture.candidate.comparisonsBytes,
      gapsBytes: fixture.candidate.gapsBytes,
      historicalLimitBytes: fixture.candidate.historicalLimitBytes,
      publishedIso: "2026-08-21T12:00:00.000Z",
    })).toThrow(/retained preflight|execution differs/u);
  });

  it("uses the authoritative all-spacings rule in both mixed directions", () => {
    expect(phase10C0EverySpacing(["pass", "no-pass"])).toBe("no-pass");
    expect(phase10C0EverySpacing(["no-pass", "pass"])).toBe("no-pass");
    expect(phase10C0EverySpacing(["pass", "pass"])).toBe("pass");
  });

  it("fail-closes missing, duplicate, truncated, malformed, and operand-mutated rows", () => {
    const clean = new TextDecoder().decode(rowsBytes());
    const lines = clean.slice(0, -1).split("\n");
    const first = JSON.parse(lines[0]!) as Record<string, unknown>;
    const mutants = [
      `${lines.slice(1).join("\n")}\n`,
      `${[lines[0]!, ...lines].join("\n")}\n`,
      clean.slice(0, -1),
      `${["{", ...lines.slice(1)].join("\n")}\n`,
      `${[JSON.stringify({ ...first, tempC: (first.tempC as number) + 1 }), ...lines.slice(1)].join("\n")}\n`,
    ];
    for (const mutant of mutants) {
      const parsed = parsePhase10C0Rows(new TextEncoder().encode(mutant));
      expect(parsed.defects.length).toBeGreaterThan(0);
      expect(parsed.missingRowIds.length > 0 || parsed.defects.some((defect) => defect.scope === "input")).toBe(true);
    }
  });

  it("persists only the exact allowlist and explicitly refuses all ten absent field groups", () => {
    const fixture = deriveFixture();
    const gaps = asObject(fixture.candidate.gapsBytes);
    expect(gaps.persistedFieldIds).toEqual([...PHASE10_C0_ROW_FIELDS].sort());
    expect((gaps.gaps as Array<Record<string, unknown>>).map((gap) => gap.gapId)).toEqual(PHASE10_C0_GAP_IDS);
    expect((gaps.gaps as Array<Record<string, unknown>>).every((gap) =>
      gap.availability === "unavailable" && gap.disposition === "explicit-refusal")).toBe(true);
    expect(gaps.targetObservationOperatorStatus).toBe("not-defined-in-selected-package");
  });

  it("records the historical some/every discrepancy without rewriting Phase 6", () => {
    const fixture = deriveFixture();
    const limit = asObject(fixture.candidate.historicalLimitBytes);
    expect(limit.phase6EvidenceMutationAuthorized).toBe(false);
    expect(limit.historicalReportUse).toBe("cross-check-only");
    expect(limit.disposition).toBe("excluded-as-authority");
    expect(limit.issue).toMatchObject({
      observedReduction: "any-spacing-some",
      authoritativeReduction: "all-spacings-every",
    });
  });

  it("builds and independently verifies the report/index without any scientific claim upgrade", () => {
    const fixture = deriveFixture();
    const publication = producePhase10C0PublishArtifacts({
      preflightReceiptBytes: syntheticPreflight("c0-publish"),
      execution: publicationExecution(),
      analysisBytes: fixture.candidate.analysisBytes,
      comparisonsBytes: fixture.candidate.comparisonsBytes,
      gapsBytes: fixture.candidate.gapsBytes,
      historicalLimitBytes: fixture.candidate.historicalLimitBytes,
      publishedIso: "2026-08-21T12:00:00.000Z",
    });
    const evaluation = phase10C0PublicationVerifier({
      scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
      preflightReceiptBytes: syntheticPreflight("c0-publish"),
      candidate: { ...fixture.candidate, ...publication },
      execution: publicationExecution(),
    });
    expect(evaluation.aggregateVerdict).toBe("pass");
    expect(evaluation.verifiedArtifacts).toHaveLength(6);
    expect(evaluation.checkResults.every((result) => result.verdict === "pass")).toBe(true);
    const report = asObject(publication.reportBytes);
    expect(report.scientificDisposition).toMatchObject({
      solverExecuted: false,
      solverAccuracyPass: false,
      robustHabitClaim: false,
      targetScoreProduced: false,
      quantitativeValidationClaim: false,
    });
  });

  it("rejects a coordinated report provenance and matching index rewrite", () => {
    const fixture = deriveFixture();
    const publication = producePhase10C0PublishArtifacts({
      preflightReceiptBytes: syntheticPreflight("c0-publish"),
      execution: publicationExecution(),
      analysisBytes: fixture.candidate.analysisBytes,
      comparisonsBytes: fixture.candidate.comparisonsBytes,
      gapsBytes: fixture.candidate.gapsBytes,
      historicalLimitBytes: fixture.candidate.historicalLimitBytes,
      publishedIso: "2026-08-21T12:00:00.000Z",
    });
    const report = asObject(publication.reportBytes);
    const analysisArtifact = report.analysisArtifact as Record<string, unknown>;
    const mutatedReportBytes = pretty({
      ...report,
      analysisArtifact: { ...analysisArtifact, sha256: "0".repeat(64) },
    });
    const index = asObject(publication.artifactIndexBytes);
    const artifacts = (index.artifacts as Array<Record<string, unknown>>).map((entry) =>
      entry.artifactId === "out-c0-report"
        ? {
          ...entry,
          byteLength: mutatedReportBytes.byteLength,
          sha256: createHash("sha256").update(mutatedReportBytes).digest("hex"),
        }
        : entry);
    const evaluation = phase10C0PublicationVerifier({
      scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
      preflightReceiptBytes: syntheticPreflight("c0-publish"),
      candidate: {
        ...fixture.candidate,
        ...publication,
        reportBytes: mutatedReportBytes,
        artifactIndexBytes: pretty({ ...index, artifacts }),
      },
      execution: publicationExecution(),
    });
    const result = evaluation.checkResults.find((entry) => entry.checkId === "chk-c0-publish-artifact-graph");
    expect(result?.verdict).toBe("fail");
    expect(result?.reasons.join(" ")).toMatch(/report analysisArtifact identity differs/u);
  });

  it("writes both independently derived verification receipt schemas from resolved callables", () => {
    const fixture = deriveFixture();
    const deriveEvaluation = independentlyEvaluatePhase10C0Derive({
      scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
      preflightReceiptBytes: syntheticPreflight("c0-derive"),
      historicalReportBytes: fixture.historicalReportBytes,
      candidate: fixture.candidate,
      evaluatorExecution: evaluatorExecution(),
      evaluatorCwd: REPOSITORY_ROOT,
      enforceFrozenInputIdentities: false,
    });
    const deriveReceipt = asObject(writePhase10C0DeriveVerificationReceipt({
      packetProtocolBytes: new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "research/phase10-execution-v1/packets/c0-derive/protocol.json"))),
      callableRegistryBytes: new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "research/phase10-execution-v1/packets/c0-derive/callable-registry.json"))),
      preflightReceiptBytes: syntheticPreflight("c0-derive"),
      evaluation: deriveEvaluation,
      execution: evaluatorExecution(),
      evaluatorCwd: REPOSITORY_ROOT,
    }));
    expect(deriveReceipt).toMatchObject({
      schema: "phase10-packet-verification-v1",
      packetId: "c0-derive",
      terminalState: "complete",
      aggregateVerdict: "pass",
    });
    expect((deriveReceipt.negativeControlResults as unknown[]).length).toBe(7);
    const forgedDeriveEvaluation = {
      ...deriveEvaluation,
      verifiedArtifacts: deriveEvaluation.verifiedArtifacts.map((artifact, index) =>
        index === 0 ? { ...artifact, path: "evidence/forged.json" } : artifact),
    };
    expect(() => writePhase10C0DeriveVerificationReceipt({
      packetProtocolBytes: new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "research/phase10-execution-v1/packets/c0-derive/protocol.json"))),
      callableRegistryBytes: new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "research/phase10-execution-v1/packets/c0-derive/callable-registry.json"))),
      preflightReceiptBytes: syntheticPreflight("c0-derive"),
      evaluation: forgedDeriveEvaluation,
      execution: evaluatorExecution(),
      evaluatorCwd: REPOSITORY_ROOT,
    })).toThrow(/verified artifact tuple differs/u);

    const publication = producePhase10C0PublishArtifacts({
      preflightReceiptBytes: syntheticPreflight("c0-publish"),
      execution: publicationExecution(),
      analysisBytes: fixture.candidate.analysisBytes,
      comparisonsBytes: fixture.candidate.comparisonsBytes,
      gapsBytes: fixture.candidate.gapsBytes,
      historicalLimitBytes: fixture.candidate.historicalLimitBytes,
      publishedIso: "2026-08-21T12:00:00.000Z",
    });
    const publishExecution = publicationExecution();
    const publishEvaluation = phase10C0PublicationVerifier({
      scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
      preflightReceiptBytes: syntheticPreflight("c0-publish"),
      candidate: { ...fixture.candidate, ...publication },
      execution: publishExecution,
    });
    const publishReceipt = asObject(writePhase10C0PublishVerificationReceipt({
      packetProtocolBytes: new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "research/phase10-execution-v1/packets/c0-publish/protocol.json"))),
      callableRegistryBytes: new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "research/phase10-execution-v1/packets/c0-publish/callable-registry.json"))),
      evaluatorModuleBytes: new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "runner/src/phase10-c0-publication-verifier.ts"))),
      preflightReceiptBytes: syntheticPreflight("c0-publish"),
      evaluation: publishEvaluation,
      execution: publishExecution,
    }));
    expect(publishReceipt).toMatchObject({
      schema: "phase10-independent-verification-v1",
      packetId: "c0-publish",
      terminalState: "complete",
      aggregateVerdict: "pass",
    });
    expect(publishReceipt.executedNegativeControlIds).toEqual([]);
    const forgedPublishEvaluation = {
      ...publishEvaluation,
      checkResults: publishEvaluation.checkResults.map((result, index) =>
        index === 0 ? { ...result, witnessOutputIds: ["out-c0-report"] } : result),
    };
    expect(() => writePhase10C0PublishVerificationReceipt({
      packetProtocolBytes: new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "research/phase10-execution-v1/packets/c0-publish/protocol.json"))),
      callableRegistryBytes: new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "research/phase10-execution-v1/packets/c0-publish/callable-registry.json"))),
      evaluatorModuleBytes: new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "runner/src/phase10-c0-publication-verifier.ts"))),
      preflightReceiptBytes: syntheticPreflight("c0-publish"),
      evaluation: forgedPublishEvaluation,
      execution: publishExecution,
    })).toThrow(/result\/witness contract differs/u);
  });

  it("installs derive and publish artifacts idempotently at only the registered destination", () => {
    const fixture = deriveFixture();
    const deriveProtocolBytes = new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "research/phase10-execution-v1/packets/c0-derive/protocol.json")));
    const deriveRegistryBytes = new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "research/phase10-execution-v1/packets/c0-derive/callable-registry.json")));
    const deriveEvaluation = independentlyEvaluatePhase10C0Derive({
      scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
      preflightReceiptBytes: syntheticPreflight("c0-derive"),
      historicalReportBytes: fixture.historicalReportBytes,
      candidate: fixture.candidate,
      evaluatorExecution: evaluatorExecution(),
      evaluatorCwd: REPOSITORY_ROOT,
      enforceFrozenInputIdentities: false,
    });
    const deriveVerificationBytes = writePhase10C0DeriveVerificationReceipt({
      packetProtocolBytes: deriveProtocolBytes,
      callableRegistryBytes: deriveRegistryBytes,
      preflightReceiptBytes: syntheticPreflight("c0-derive"),
      evaluation: deriveEvaluation,
      execution: evaluatorExecution(),
      evaluatorCwd: REPOSITORY_ROOT,
    });
    const publication = producePhase10C0PublishArtifacts({
      preflightReceiptBytes: syntheticPreflight("c0-publish"),
      execution: publicationExecution(),
      analysisBytes: fixture.candidate.analysisBytes,
      comparisonsBytes: fixture.candidate.comparisonsBytes,
      gapsBytes: fixture.candidate.gapsBytes,
      historicalLimitBytes: fixture.candidate.historicalLimitBytes,
      publishedIso: "2026-08-21T12:00:00.000Z",
    });
    const publishProtocolBytes = new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "research/phase10-execution-v1/packets/c0-publish/protocol.json")));
    const publishRegistryBytes = new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "research/phase10-execution-v1/packets/c0-publish/callable-registry.json")));
    const publishEvaluatorBytes = new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "runner/src/phase10-c0-publication-verifier.ts")));
    const publishEvaluation = phase10C0PublicationVerifier({
      scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
      preflightReceiptBytes: syntheticPreflight("c0-publish"),
      candidate: { ...fixture.candidate, ...publication },
      execution: publicationExecution(),
    });
    const publishVerificationBytes = writePhase10C0PublishVerificationReceipt({
      packetProtocolBytes: publishProtocolBytes,
      callableRegistryBytes: publishRegistryBytes,
      evaluatorModuleBytes: publishEvaluatorBytes,
      preflightReceiptBytes: syntheticPreflight("c0-publish"),
      evaluation: publishEvaluation,
      execution: publicationExecution(),
    });
    const root = mkdtempSync(join(tmpdir(), "phase10-c0-publication-"));
    tempDirectories.push(root);
    const deriveCandidate = join(root, "out/derive");
    const publishCandidate = join(root, "out/publish");
    mkdirSync(deriveCandidate, { recursive: true });
    mkdirSync(publishCandidate, { recursive: true });
    for (const [name, bytes] of [
      ["c0-analysis.json", fixture.candidate.analysisBytes],
      ["c0-comparisons.jsonl", fixture.candidate.comparisonsBytes],
      ["c0-derive-verification.json", deriveVerificationBytes],
      ["c0-historical-verifier-limit.json", fixture.candidate.historicalLimitBytes],
      ["c0-target-field-gaps.json", fixture.candidate.gapsBytes],
    ] as const) writeFileSync(join(deriveCandidate, name), bytes);
    for (const [name, bytes] of [
      ["c0-artifact-index.json", publication.artifactIndexBytes],
      ["c0-report.json", publication.reportBytes],
      ["c0-verification.json", publishVerificationBytes],
    ] as const) writeFileSync(join(publishCandidate, name), bytes);
    const deriveContext = {
      packetId: "c0-derive" as const,
      scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
      packetProtocolBytes: deriveProtocolBytes,
      callableRegistryBytes: deriveRegistryBytes,
      preflightReceiptBytes: syntheticPreflight("c0-derive"),
      rowsBytes: fixture.candidate.rowsBytes,
      historicalReportBytes: fixture.historicalReportBytes,
      evaluatorExecution: evaluatorExecution(),
      evaluatorCwd: REPOSITORY_ROOT,
      enforceFrozenInputIdentities: false,
    };
    const deriveRequest = { repositoryRoot: root, packetId: "c0-derive" as const, candidateDirectory: "out/derive", outputDirectory: PHASE10_C0_PUBLICATION_PATH as typeof PHASE10_C0_PUBLICATION_PATH, verificationContext: deriveContext };
    const partialOutput = join(root, PHASE10_C0_PUBLICATION_PATH);
    mkdirSync(partialOutput, { recursive: true });
    writeFileSync(join(partialOutput, "c0-analysis.json"), fixture.candidate.analysisBytes);
    expect(publishPhase10C0PacketCandidate(deriveRequest)).toBe(true);
    expect(publishPhase10C0PacketCandidate(deriveRequest)).toBe(false);
    const unknown = join(root, PHASE10_C0_PUBLICATION_PATH, "unregistered.json");
    writeFileSync(unknown, pretty({ schema: "unregistered" }));
    expect(() => publishPhase10C0PacketCandidate(deriveRequest)).toThrow(/unregistered file/u);
    rmSync(unknown);
    const publishContext = {
      packetId: "c0-publish" as const,
      scienceProtocolBytes: SCIENCE_PROTOCOL_BYTES,
      packetProtocolBytes: publishProtocolBytes,
      callableRegistryBytes: publishRegistryBytes,
      evaluatorModuleBytes: publishEvaluatorBytes,
      preflightReceiptBytes: syntheticPreflight("c0-publish"),
      execution: publicationExecution(),
    };
    const publishRequest = { repositoryRoot: root, packetId: "c0-publish" as const, candidateDirectory: "out/publish", outputDirectory: PHASE10_C0_PUBLICATION_PATH as typeof PHASE10_C0_PUBLICATION_PATH, verificationContext: publishContext };
    expect(publishPhase10C0PacketCandidate(publishRequest)).toBe(true);
    expect(publishPhase10C0PacketCandidate(publishRequest)).toBe(false);
    writeFileSync(join(publishCandidate, "c0-verification.json"), pretty({ schema: "synthetic-publication-verification" }));
    expect(() => publishPhase10C0PacketCandidate(publishRequest)).toThrow(/stale, forged/u);

    const forgedRoot = mkdtempSync(join(tmpdir(), "phase10-c0-forged-publication-"));
    tempDirectories.push(forgedRoot);
    const forgedCandidate = join(forgedRoot, "out/derive");
    mkdirSync(forgedCandidate, { recursive: true });
    for (const [name, bytes] of [
      ["c0-analysis.json", fixture.candidate.analysisBytes],
      ["c0-comparisons.jsonl", fixture.candidate.comparisonsBytes],
      ["c0-derive-verification.json", pretty({ schema: "synthetic-verification" })],
      ["c0-historical-verifier-limit.json", fixture.candidate.historicalLimitBytes],
      ["c0-target-field-gaps.json", fixture.candidate.gapsBytes],
    ] as const) writeFileSync(join(forgedCandidate, name), bytes);
    expect(() => publishPhase10C0PacketCandidate({ ...deriveRequest, repositoryRoot: forgedRoot })).toThrow(/stale, forged/u);
    expect(existsSync(join(forgedRoot, PHASE10_C0_PUBLICATION_PATH))).toBe(false);
  });

  it("exposes only executor-guarded exact commands and contains no solver import or call", () => {
    expect(PHASE10_C0_EXECUTOR_RESOURCES).toEqual({
      solverExecutionAuthorized: false,
      requiredRuntime: "v24.13.1",
      processConcurrency: 1,
      scientificProcessHours: 0,
      projectedScratchBytes: 16 * 1024 * 1024,
      projectedOutputBytes: 4 * 1024 * 1024,
      minimumFreeBytes: 64 * 1024 * 1024,
      maxWallSeconds: 300,
      nasRequired: false,
      c0vScratchCapBytes: null,
    });
    expect(PRODUCE_COMMAND).toBe(
      "node runner/src/phase10-executor.ts run --packet c0-derive --protocol research/phase10-execution-v1/packets/c0-derive/protocol.json --attempt synthetic-c0-derive-v1",
    );
    expect(phase10C0ExecutorCommand("c0-publish", "synthetic-c0-publish-v1")).toBe(
      "node runner/src/phase10-executor.ts run --packet c0-publish --protocol research/phase10-execution-v1/packets/c0-publish/protocol.json --attempt synthetic-c0-publish-v1",
    );
    const sourceNames = [
      "phase10-c0-contracts.ts", "phase10-c0-derive.ts", "phase10-c0-independent.ts",
      "phase10-c0-negative-controls.ts", "phase10-c0-publish.ts", "phase10-c0-publication-verifier.ts",
      "phase10-c0-publication-guard.ts", "phase10-execution-preflight.ts", "phase10-executor.ts",
      "phase10-executor-worker.ts",
    ];
    for (const name of sourceNames) {
      const source = readFileSync(join(REPOSITORY_ROOT, "runner/src", name), "utf8");
      expect(source).not.toMatch(/from\s+["'][^"']*solver|import\s*\([^)]*solver|new\s+(?:GG|LK)Solver|\.advanceSurface\s*\(/u);
    }
  });
});
