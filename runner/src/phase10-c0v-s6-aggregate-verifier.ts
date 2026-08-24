import { strictJsonSnapshot } from "./gate4-evidence.ts";
import {
  aggregateMediaType,
  parsePhase10C0VAggregateArtifactIndexBytes,
  parsePhase10C0VAggregateLayerResultBytes,
  parsePhase10C0VAggregateResultBytes,
  parsePhase10C0VAnyLayerNonpassControlReceiptBytes,
  parsePhase10C0VResourceLedgerBytes,
  parsePhase10C0VTerminalTableBytes,
  type Phase10C0VAggregateArtifactIndex,
  type Phase10C0VAggregateArtifactIndexEntry,
  type Phase10C0VAggregateCandidateBytes,
  type Phase10C0VAggregateLayerId,
  type Phase10C0VAggregateLayerResult,
  type Phase10C0VAggregateOutcome,
  type Phase10C0VAggregateResult,
  type Phase10C0VAnyLayerNonpassControlReceipt,
  type Phase10C0VClaimBoundary,
  type Phase10C0VNegativeControlResult,
  type Phase10C0VResourceLedger,
  type Phase10C0VResourceLedgerAttempt,
  type Phase10C0VTerminalTable,
  type Phase10C0VTerminalTableRow,
} from "./phase10-c0v-s6-aggregate-contracts.ts";
import {
  parsePhase10C0VS6AttemptLedgerV2,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6PrettyJsonBytes,
  phase10C0VS6SameIdentity,
  phase10C0VS6SameJson,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6AttemptRowV2,
} from "./phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6PhysicalRepositoryRoot,
  phase10C0VS6ReadUniquePhysicalFile,
  type Phase10C0VS6PhysicalRoot,
} from "./phase10-c0v-s6-filesystem.ts";
import {
  phase10C0VS6ReopenPublishedDependencies,
  phase10C0VS6ValidateHeadBoundPreflightManifest,
  type Phase10C0VS6ReopenedDependencyArtifact,
  type Phase10C0VS6ReopenedDependencySet,
} from "./phase10-c0v-s6-dependencies.ts";
import {
  independentlyReopenPhase10C0VS6VerifiedPublishedDependencies,
} from "./phase10-c0v-s6-published-packet.ts";
import type { Phase10C0VS6RawRuntimeAuthorityInput } from "./phase10-c0v-s6-runtime-authority.ts";

const LAYERS = Object.freeze([
  Object.freeze({
    layerId: "C0V-RADIAL",
    packetId: "c0v-radial-produce",
    resultPath: "evidence/phase10-numerical-verification-v1/c0v-radial-result.json",
    resultSchema: "phase10-c0v-radial-result-v2",
    indexPath: "evidence/phase10-numerical-verification-v1/c0v-radial-artifact-index.json",
    indexOutputId: "out-c0v-radial-artifact-index",
    indexProducer: "phase10-c0v-radial-publish-producer",
  }),
  Object.freeze({
    layerId: "C0V-STATIC",
    packetId: "c0v-static-produce",
    resultPath: "evidence/phase10-numerical-verification-v1/c0v-static-result.json",
    resultSchema: "phase10-c0v-static-result-v1",
    indexPath: "evidence/phase10-numerical-verification-v1/c0v-static-artifact-index.json",
    indexOutputId: "out-c0v-static-artifact-index",
    indexProducer: "phase10-c0v-static-publish-producer",
  }),
  Object.freeze({
    layerId: "C0V-MOVING-EVENT",
    packetId: "c0v-moving-produce",
    resultPath: "evidence/phase10-numerical-verification-v1/c0v-moving-result.json",
    resultSchema: "phase10-c0v-moving-result-v1",
    indexPath: "evidence/phase10-numerical-verification-v1/c0v-moving-artifact-index.json",
    indexOutputId: "out-c0v-moving-artifact-index",
    indexProducer: "phase10-c0v-moving-publish-producer",
  }),
] as const);

const TABLE_PATH = "evidence/phase10-numerical-verification-v1/c0v-terminal-table.json";
const RESOURCE_PATH = "evidence/phase10-numerical-verification-v1/c0v-resource-ledger.json";
const AGGREGATE_PATH = "evidence/phase10-numerical-verification-v1/c0v-aggregate.json";
const INDEX_PATH = "evidence/phase10-numerical-verification-v1/c0v-artifact-index.json";
const PACKAGE_ELAPSED_MAXIMUM = 86_400_000_000_000;
const PACKAGE_BYTES_MAXIMUM = 68_719_476_736;

export type Phase10C0VAggregateCheckId =
  | "chk-c0v-all-three-terminal"
  | "chk-c0v-any-layer-nonpass"
  | "chk-c0v-resource-ledger"
  | "chk-c0v-verdict-rederived";

export interface Phase10C0VAggregateVerificationRequest extends Phase10C0VS6RawRuntimeAuthorityInput {
  readonly candidate: Phase10C0VAggregateCandidateBytes;
}

export interface Phase10C0VAggregateCheckResult {
  readonly checkId: Phase10C0VAggregateCheckId;
  readonly verdict: "pass";
  readonly reasons: readonly [];
  readonly witnessOutputIds: readonly string[];
}

export interface Phase10C0VAggregateNegativeControlReproof {
  readonly negativeControlId: "nc-c0v-any-layer-nonpass";
  readonly receipt: Phase10C0VS6ArtifactIdentity;
  readonly result: Phase10C0VNegativeControlResult;
  readonly verdict: "pass";
}

export interface Phase10C0VAggregateIndependentEvaluation {
  readonly schema: "phase10-c0v-aggregate-independent-evaluation-v1";
  readonly packetId: "c0v-aggregate";
  readonly evaluatorCallableId: "phase10-c0v-aggregate-evaluator";
  readonly terminalTable: Phase10C0VTerminalTable;
  readonly resourceLedger: Phase10C0VResourceLedger;
  readonly aggregate: Phase10C0VAggregateResult;
  readonly artifactIndex: Phase10C0VAggregateArtifactIndex;
  readonly outputIdentities: readonly [
    Phase10C0VS6ArtifactIdentity,
    Phase10C0VS6ArtifactIdentity,
    Phase10C0VS6ArtifactIdentity,
    Phase10C0VS6ArtifactIdentity,
  ];
  readonly negativeControlReproof: Phase10C0VAggregateNegativeControlReproof;
  readonly checkResults: readonly Phase10C0VAggregateCheckResult[];
  readonly aggregateVerdict: "pass";
}

interface LayerInput {
  readonly layerId: Phase10C0VAggregateLayerId;
  readonly packetId: Phase10C0VResourceLedgerAttempt["packetId"];
  readonly result: Phase10C0VAggregateLayerResult;
  readonly resultIdentity: Phase10C0VS6ArtifactIdentity;
  readonly sourceIndex: Phase10C0VAggregateArtifactIndex;
  readonly sourceIndexBytes: Uint8Array;
  readonly attempt: Phase10C0VS6AttemptRowV2;
}

interface Inputs {
  readonly root: Phase10C0VS6PhysicalRoot;
  readonly dependencies: Phase10C0VS6ReopenedDependencySet;
  readonly layers: readonly [LayerInput, LayerInput, LayerInput];
  readonly negativeControlBytes: Uint8Array;
  readonly negativeControlIdentity: Phase10C0VS6ArtifactIdentity;
  readonly claimBoundary: Phase10C0VClaimBoundary;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V aggregate independent verifier refused: ${message}`);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function artifact(
  dependencies: Phase10C0VS6ReopenedDependencySet,
  path: string,
  schemaId: string,
): Phase10C0VS6ReopenedDependencyArtifact {
  const matches = dependencies.artifacts.filter((entry) => entry.identity.path === path && entry.schemaId === schemaId);
  if (matches.length !== 1) fail(`${path} does not resolve one exact dependency artifact`);
  return matches[0]!;
}

function readBound(
  root: Phase10C0VS6PhysicalRoot,
  identity: Phase10C0VS6ArtifactIdentity,
  manifest: ReadonlyMap<string, Phase10C0VS6ArtifactIdentity>,
  label: string,
): Uint8Array {
  const pinned = manifest.get(identity.path);
  if (pinned === undefined) fail(`${label} is absent from the HEAD-bound evidence manifest`);
  phase10C0VS6SameIdentity(pinned, identity, `${label} manifest identity`);
  const bytes = phase10C0VS6ReadUniquePhysicalFile(root, identity.path);
  phase10C0VS6SameIdentity(phase10C0VS6ArtifactIdentity(identity.path, bytes), identity, `${label} live identity`);
  return bytes;
}

function inputs(request: Phase10C0VAggregateVerificationRequest): Inputs {
  const dependencies = phase10C0VS6ReopenPublishedDependencies(request);
  const deep = independentlyReopenPhase10C0VS6VerifiedPublishedDependencies(request);
  const expectedPrefix = Object.freeze([
    "a-p-c0v-s6",
    "c0v-moving-produce",
    "c0v-moving-publish",
    "c0v-radial-produce",
    "c0v-radial-publish",
    "c0v-static-produce",
    "c0v-static-publish",
  ] as const);
  if (deep.selectedPackets.length !== expectedPrefix.length ||
    deep.selectedPackets.some((entry, index) => entry.packet.packetId !== expectedPrefix[index]) ||
    deep.selectedPackets.some((entry) => !entry.terminalReceipt.acceptedPacketCredit ||
      !entry.terminalReceipt.dependencyValid || entry.terminalReceipt.verdict !== "complete")) {
    fail("aggregate dependency closure is not the exact seven-packet verified chronological prefix");
  }
  if (dependencies.packet.packetId !== "c0v-aggregate" || dependencies.packet.executionMode !== "aggregate" ||
    dependencies.preflight.verdict !== "pass" || dependencies.preflight.refusalCandidate !== null ||
    dependencies.packet.aggregateNegativeControlContract === null) {
    fail("aggregate verification requires exact passing raw aggregate authority");
  }
  const root = phase10C0VS6PhysicalRepositoryRoot(request.repositoryRoot);
  const manifest = phase10C0VS6ValidateHeadBoundPreflightManifest(root.path, dependencies.preflight);
  const layers = LAYERS.map((config) => {
    const resultArtifact = artifact(dependencies, config.resultPath, config.resultSchema);
    const result = parsePhase10C0VAggregateLayerResultBytes(resultArtifact.bytes, config.layerId);
    const indexArtifact = artifact(dependencies, config.indexPath, "phase10-artifact-index-v1");
    const sourceIndex = parsePhase10C0VAggregateArtifactIndexBytes(
      indexArtifact.bytes, `${config.layerId} source artifact index`,
    );
    const indexedResult = sourceIndex.artifacts.filter((entry) => entry.path === config.resultPath);
    if (indexedResult.length !== 1) fail(`${config.layerId} source index lacks one exact result`);
    phase10C0VS6SameIdentity(indexedResult[0]!, resultArtifact.identity, `${config.layerId} indexed result`);
    const ledgerBytes = readBound(root, result.attemptLedger, manifest, `${config.layerId} attempt ledger`);
    const attempts = parsePhase10C0VS6AttemptLedgerV2(ledgerBytes, `${config.layerId} attempt ledger`);
    if (attempts.length !== 1) fail(`${config.layerId} current-v1 ledger must contain exactly one attempt`);
    const attempt = attempts[0]!;
    const expectedDisposition = "attemptDispositionCode" in result
      ? result.attemptDispositionCode
      : config.layerId === "C0V-STATIC"
        ? "preimplementation-reference-refusal"
        : "reference-discrepancy-refusal";
    if (attempt.layerId !== config.layerId || attempt.branch !== result.branch ||
      attempt.terminalStatus !== result.terminalStatus || attempt.dispositionCode !== expectedDisposition) {
      fail(`${config.layerId} result differs from its selected attempt`);
    }
    return Object.freeze({
      layerId: config.layerId,
      packetId: config.packetId,
      result,
      resultIdentity: resultArtifact.identity,
      sourceIndex,
      sourceIndexBytes: indexArtifact.bytes,
      attempt,
    });
  });
  const ncContract = dependencies.packet.aggregateNegativeControlContract;
  const expectedAttemptDirectory = `${dependencies.packet.paths.attemptRoot}/${dependencies.packet.registeredAttemptId}`;
  if (dependencies.preflight.observed.attemptDirectory !== expectedAttemptDirectory) {
    fail("aggregate preflight attempt directory differs from packet authority");
  }
  const ncPath = `${dependencies.preflight.observed.attemptDirectory}/${ncContract.filename}`;
  const negativeControlBytes = phase10C0VS6ReadUniquePhysicalFile(root, ncPath);
  return Object.freeze({
    root,
    dependencies,
    layers: Object.freeze(layers) as unknown as readonly [LayerInput, LayerInput, LayerInput],
    negativeControlBytes,
    negativeControlIdentity: phase10C0VS6ArtifactIdentity(ncPath, negativeControlBytes),
    claimBoundary: dependencies.packet.claimBoundary,
  });
}

function syntheticIdentity(layerId: Phase10C0VAggregateLayerId): Phase10C0VS6ArtifactIdentity {
  const stem = layerId === "C0V-RADIAL" ? "radial" : layerId === "C0V-STATIC" ? "static" : "moving";
  return phase10C0VS6ArtifactIdentity(
    `out/phase10-execution-v2/fixtures/c0v-aggregate/synthetic-${stem}-result.json`,
    new TextEncoder().encode(`phase10-c0v-synthetic-${stem}-pass-v1\n`),
  );
}

function syntheticBoundary(): Phase10C0VClaimBoundary {
  return Object.freeze({
    allowed: Object.freeze(["synthetic-aggregate-negative-control"]),
    forbidden: Object.freeze(["evidence-credit", "qualification-credit"]),
  });
}

function facts(rows: readonly Phase10C0VTerminalTableRow[]): {
  readonly allThreeTerminal: boolean;
  readonly allIndependentReferences: boolean;
  readonly allLayersPass: boolean;
  readonly aggregateStatus: "pass" | "non-pass";
} {
  const allThreeTerminal = rows.length === 3 && rows.every((entry) =>
    entry.terminalStatus === "pass" || entry.terminalStatus === "fail" || entry.terminalStatus === "refusal");
  const allIndependentReferences = rows.every((entry) => entry.branch === "independent-reference");
  const allLayersPass = rows.every((entry) =>
    entry.terminalStatus === "pass" && entry.scientificDisposition === "pass");
  return Object.freeze({
    allThreeTerminal,
    allIndependentReferences,
    allLayersPass,
    aggregateStatus: allThreeTerminal && allIndependentReferences && allLayersPass ? "pass" : "non-pass",
  });
}

function makeTable(
  tableId: string,
  rows: readonly [Phase10C0VTerminalTableRow, Phase10C0VTerminalTableRow, Phase10C0VTerminalTableRow],
): Phase10C0VTerminalTable {
  return Object.freeze({ schema: "phase10-c0v-terminal-table-v1", tableId, rows, ...facts(rows) });
}

function independentCleanTable(): Phase10C0VTerminalTable {
  const boundary = syntheticBoundary();
  const make = (layerId: Phase10C0VAggregateLayerId): Phase10C0VTerminalTableRow => Object.freeze({
    layerId,
    branch: "independent-reference",
    terminalStatus: "pass",
    result: syntheticIdentity(layerId),
    scientificDisposition: "pass",
    negativeControlDisposition: "pass",
    resourceDisposition: "within-cap",
    claimBoundary: boundary,
  });
  return makeTable("c0v-terminal-table-synthetic-all-pass-v1", Object.freeze([
    make("C0V-RADIAL"), make("C0V-STATIC"), make("C0V-MOVING-EVENT"),
  ] as const));
}

function independentMutation(clean: Phase10C0VTerminalTable): Phase10C0VTerminalTable {
  return makeTable("c0v-terminal-table-synthetic-radial-refusal-v1", Object.freeze([
    Object.freeze({ ...clean.rows[0], scientificDisposition: "refusal" as const }),
    clean.rows[1],
    clean.rows[2],
  ] as const));
}

function deriveOutcome(table: Phase10C0VTerminalTable): Phase10C0VAggregateOutcome {
  return Object.freeze({
    aggregateStatus: table.aggregateStatus,
    packageCompletionEligible: table.allThreeTerminal,
    dependentQualificationBlocked: table.aggregateStatus === "non-pass",
  });
}

export function independentlyReprovePhase10C0VAnyLayerNonpass(
  receiptBytes: Uint8Array,
  receiptPath = "out/phase10-execution-v2/recovery-v1/attempts/c0v-aggregate/synthetic/any-layer-nonpass-control.json",
): Phase10C0VAggregateNegativeControlReproof {
  const receipt = parsePhase10C0VAnyLayerNonpassControlReceiptBytes(receiptBytes);
  const clean = independentCleanTable();
  const mutated = independentMutation(clean);
  const cleanOutcome = deriveOutcome(clean);
  const attackedOutcome = deriveOutcome(mutated);
  phase10C0VS6SameJson(receipt.cleanTable, clean, "negative-control clean table");
  phase10C0VS6SameJson(receipt.mutatedTable, mutated, "negative-control mutated table");
  phase10C0VS6SameJson(receipt.cleanOutcome, cleanOutcome, "negative-control clean outcome");
  phase10C0VS6SameJson(receipt.attackedOutcome, attackedOutcome, "negative-control attacked outcome");
  const expectedResult: Phase10C0VNegativeControlResult = Object.freeze({
    negativeControlId: "nc-c0v-any-layer-nonpass",
    mutationExecuted: true,
    witnessMoved: true,
    cleanCapturePreserved: true,
    attackedCheckFailed: true,
    pass: true,
  });
  phase10C0VS6SameJson(receipt.result, expectedResult, "negative-control result");
  return Object.freeze({
    negativeControlId: "nc-c0v-any-layer-nonpass",
    receipt: phase10C0VS6ArtifactIdentity(receiptPath, receiptBytes),
    result: expectedResult,
    verdict: "pass",
  });
}

function actualTable(layerInputs: Inputs["layers"]): Phase10C0VTerminalTable {
  const rows = layerInputs.map((entry): Phase10C0VTerminalTableRow => Object.freeze({
    layerId: entry.layerId,
    branch: entry.result.branch,
    terminalStatus: entry.result.terminalStatus,
    result: entry.resultIdentity,
    scientificDisposition: entry.result.scientificDisposition,
    negativeControlDisposition: entry.result.negativeControlDisposition,
    resourceDisposition: entry.result.resourceDisposition,
    claimBoundary: entry.result.claimBoundary,
  }));
  return makeTable("c0v-terminal-table-v1", Object.freeze(rows) as unknown as readonly [
    Phase10C0VTerminalTableRow, Phase10C0VTerminalTableRow, Phase10C0VTerminalTableRow,
  ]);
}

function attempt(entry: LayerInput): Phase10C0VResourceLedgerAttempt {
  const elapsed = entry.attempt.executionRecord.governedInvocationElapsedNanoseconds;
  return Object.freeze({
    packetId: entry.packetId,
    attemptId: entry.attempt.attemptId,
    attemptLedger: entry.result.attemptLedger,
    terminalStatus: entry.attempt.terminalStatus,
    dispositionCode: entry.attempt.dispositionCode,
    governedInvocationElapsedNanoseconds: elapsed,
    processHours: elapsed / 3_600_000_000_000,
    maximumObservedConcurrentBytes: entry.attempt.resourceRecord.maximumObservedConcurrentBytes,
    terminalRetainedBytes: entry.attempt.resourceRecord.terminalRetainedBytes,
  });
}

function expectedResourceLedger(value: Inputs): Phase10C0VResourceLedger {
  const attempts = Object.freeze(value.layers.map(attempt)) as unknown as Phase10C0VResourceLedger["attempts"];
  const elapsed = attempts.reduce((sum, entry) => sum + entry.governedInvocationElapsedNanoseconds, 0);
  const retained = attempts.reduce((sum, entry) => sum + entry.terminalRetainedBytes, 0);
  if (!Number.isSafeInteger(elapsed) || !Number.isSafeInteger(retained)) fail("resource totals exceed safe integer range");
  const maximum = Math.max(...attempts.map((entry) => entry.maximumObservedConcurrentBytes));
  const capExceeded = attempts.some((entry) =>
    entry.dispositionCode === "prelaunch-resource-refusal" ||
    entry.dispositionCode === "registered-cap-resource-refusal") ||
    elapsed > PACKAGE_ELAPSED_MAXIMUM || maximum > PACKAGE_BYTES_MAXIMUM || retained > PACKAGE_BYTES_MAXIMUM;
  return Object.freeze({
    schema: "phase10-c0v-resource-ledger-v1",
    ledgerId: "c0v-resource-ledger-v1",
    requiredRuntime: "Node v24.13.1",
    perInvocationWallHoursMaximum: 4,
    packageProcessHoursMaximum: 24,
    solverControlProcessConcurrency: 1,
    scratchRetainedGiBMaximum: 64,
    attempts,
    totals: Object.freeze({
      governedInvocationElapsedNanoseconds: elapsed,
      processHours: elapsed / 3_600_000_000_000,
      maximumObservedConcurrentBytes: maximum,
      terminalRetainedBytes: retained,
    }),
    capExceeded,
    disposition: capExceeded ? "resource-refusal" : "within-cap",
  });
}

function expectedAggregate(
  value: Inputs,
  table: Phase10C0VTerminalTable,
  tableBytes: Uint8Array,
  ledgerBytes: Uint8Array,
  control: Phase10C0VAggregateNegativeControlReproof,
): Phase10C0VAggregateResult {
  return Object.freeze({
    schema: "phase10-c0v-aggregate-v1",
    aggregateId: "c0v-aggregate-v1",
    terminalTable: phase10C0VS6ArtifactIdentity(TABLE_PATH, tableBytes),
    resourceLedger: phase10C0VS6ArtifactIdentity(RESOURCE_PATH, ledgerBytes),
    layerResults: Object.freeze(value.layers.map((entry) => entry.resultIdentity)) as unknown as Phase10C0VAggregateResult["layerResults"],
    allThreeTerminal: table.allThreeTerminal,
    allIndependentReferences: table.allIndependentReferences,
    allLayersPass: table.allLayersPass,
    aggregateStatus: table.aggregateStatus,
    negativeControl: control.result,
    packageCompletionEligible: table.allThreeTerminal,
    dependentQualificationBlocked: table.aggregateStatus === "non-pass",
    claimBoundary: value.claimBoundary,
  });
}

function indexEntry(
  artifactId: string,
  path: string,
  bytes: Uint8Array,
  role: string,
  producedBy: string,
): Phase10C0VAggregateArtifactIndexEntry {
  return Object.freeze({
    artifactId,
    ...phase10C0VS6ArtifactIdentity(path, bytes),
    mediaType: aggregateMediaType(path),
    role,
    producedBy,
  });
}

function expectedIndex(
  value: Inputs,
  tableBytes: Uint8Array,
  ledgerBytes: Uint8Array,
  aggregateBytes: Uint8Array,
): Phase10C0VAggregateArtifactIndex {
  const byPath = new Map<string, Phase10C0VAggregateArtifactIndexEntry>();
  const byId = new Map<string, Phase10C0VAggregateArtifactIndexEntry>();
  const same = (left: Phase10C0VAggregateArtifactIndexEntry, right: Phase10C0VAggregateArtifactIndexEntry): boolean =>
    left.artifactId === right.artifactId && left.path === right.path && left.byteLength === right.byteLength &&
    left.sha256 === right.sha256 && left.mediaType === right.mediaType && left.role === right.role &&
    left.producedBy === right.producedBy;
  const add = (entry: Phase10C0VAggregateArtifactIndexEntry): void => {
    const oldPath = byPath.get(entry.path);
    const oldId = byId.get(entry.artifactId);
    if ((oldPath !== undefined && !same(oldPath, entry)) || (oldId !== undefined && !same(oldId, entry))) {
      fail(`artifact index collision at ${entry.artifactId}/${entry.path}`);
    }
    byPath.set(entry.path, entry);
    byId.set(entry.artifactId, entry);
  };
  for (const [index, layer] of value.layers.entries()) {
    for (const entry of layer.sourceIndex.artifacts) add(entry);
    const config = LAYERS[index]!;
    add(indexEntry(
      config.indexOutputId, config.indexPath, layer.sourceIndexBytes, "layer-artifact-index", config.indexProducer,
    ));
  }
  add(indexEntry("out-c0v-terminal-table", TABLE_PATH, tableBytes, "terminal-table", "phase10-c0v-aggregate-producer"));
  add(indexEntry("out-c0v-resource-ledger", RESOURCE_PATH, ledgerBytes, "resource-ledger", "phase10-c0v-aggregate-producer"));
  add(indexEntry("out-c0v-aggregate", AGGREGATE_PATH, aggregateBytes, "aggregate-result", "phase10-c0v-aggregate-producer"));
  return Object.freeze({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-numerical-verification-v1",
    artifacts: Object.freeze([...byPath.values()].sort((left, right) => compareText(left.artifactId, right.artifactId))),
  });
}

export function independentlyVerifyPhase10C0VAggregate(
  request: Phase10C0VAggregateVerificationRequest,
): Phase10C0VAggregateIndependentEvaluation {
  const value = inputs(request);
  const control = independentlyReprovePhase10C0VAnyLayerNonpass(
    value.negativeControlBytes,
    value.negativeControlIdentity.path,
  );
  const terminal = actualTable(value.layers);
  const terminalBytes = phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(terminal));
  const resources = expectedResourceLedger(value);
  const resourceBytes = phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(resources));
  const aggregate = expectedAggregate(value, terminal, terminalBytes, resourceBytes, control);
  const aggregateBytes = phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(aggregate));
  const index = expectedIndex(value, terminalBytes, resourceBytes, aggregateBytes);

  const parsedTerminal = parsePhase10C0VTerminalTableBytes(request.candidate.terminalTable);
  const parsedResources = parsePhase10C0VResourceLedgerBytes(request.candidate.resourceLedger);
  const parsedAggregate = parsePhase10C0VAggregateResultBytes(request.candidate.aggregate);
  const parsedIndex = parsePhase10C0VAggregateArtifactIndexBytes(request.candidate.artifactIndex);
  phase10C0VS6SameJson(parsedTerminal, terminal, "terminal-table independent derivation");
  phase10C0VS6SameJson(parsedResources, resources, "resource-ledger independent derivation");
  phase10C0VS6SameJson(parsedAggregate, aggregate, "aggregate independent derivation");
  phase10C0VS6SameJson(parsedIndex, index, "global artifact-index independent derivation");

  const outputIdentities = Object.freeze([
    phase10C0VS6ArtifactIdentity(TABLE_PATH, request.candidate.terminalTable),
    phase10C0VS6ArtifactIdentity(RESOURCE_PATH, request.candidate.resourceLedger),
    phase10C0VS6ArtifactIdentity(AGGREGATE_PATH, request.candidate.aggregate),
    phase10C0VS6ArtifactIdentity(INDEX_PATH, request.candidate.artifactIndex),
  ] as const);
  const checkResults = Object.freeze([
    Object.freeze({
      checkId: "chk-c0v-all-three-terminal",
      verdict: "pass",
      reasons: Object.freeze([]) as readonly [],
      witnessOutputIds: Object.freeze(["out-c0v-terminal-table"]),
    }),
    Object.freeze({
      checkId: "chk-c0v-any-layer-nonpass",
      verdict: "pass",
      reasons: Object.freeze([]) as readonly [],
      witnessOutputIds: Object.freeze(["out-c0v-aggregate", "out-c0v-terminal-table"]),
    }),
    Object.freeze({
      checkId: "chk-c0v-resource-ledger",
      verdict: "pass",
      reasons: Object.freeze([]) as readonly [],
      witnessOutputIds: Object.freeze(["out-c0v-resource-ledger"]),
    }),
    Object.freeze({
      checkId: "chk-c0v-verdict-rederived",
      verdict: "pass",
      reasons: Object.freeze([]) as readonly [],
      witnessOutputIds: Object.freeze(["out-c0v-aggregate"]),
    }),
  ] as const satisfies readonly Phase10C0VAggregateCheckResult[]);
  return Object.freeze({
    schema: "phase10-c0v-aggregate-independent-evaluation-v1",
    packetId: "c0v-aggregate",
    evaluatorCallableId: "phase10-c0v-aggregate-evaluator",
    terminalTable: parsedTerminal,
    resourceLedger: parsedResources,
    aggregate: parsedAggregate,
    artifactIndex: parsedIndex,
    outputIdentities,
    negativeControlReproof: control,
    checkResults,
    aggregateVerdict: "pass",
  });
}
