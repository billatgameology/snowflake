import { strictJsonSnapshot } from "./gate4-evidence.ts";
import {
  aggregateMediaType,
  parsePhase10C0VAggregateArtifactIndexBytes,
  parsePhase10C0VAggregateLayerResultBytes,
  parsePhase10C0VAnyLayerNonpassControlReceiptBytes,
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
import type { Phase10C0VS6RawRuntimeAuthorityInput } from "./phase10-c0v-s6-runtime-authority.ts";

const LAYER_ORDER = Object.freeze([
  Object.freeze({
    layerId: "C0V-RADIAL",
    packetId: "c0v-radial-produce",
    publishPacketId: "c0v-radial-publish",
    resultPath: "evidence/phase10-numerical-verification-v1/c0v-radial-result.json",
    resultSchema: "phase10-c0v-radial-result-v2",
    indexPath: "evidence/phase10-numerical-verification-v1/c0v-radial-artifact-index.json",
    indexOutputId: "out-c0v-radial-artifact-index",
    indexProducer: "phase10-c0v-radial-publish-producer",
  }),
  Object.freeze({
    layerId: "C0V-STATIC",
    packetId: "c0v-static-produce",
    publishPacketId: "c0v-static-publish",
    resultPath: "evidence/phase10-numerical-verification-v1/c0v-static-result.json",
    resultSchema: "phase10-c0v-static-result-v1",
    indexPath: "evidence/phase10-numerical-verification-v1/c0v-static-artifact-index.json",
    indexOutputId: "out-c0v-static-artifact-index",
    indexProducer: "phase10-c0v-static-publish-producer",
  }),
  Object.freeze({
    layerId: "C0V-MOVING-EVENT",
    packetId: "c0v-moving-produce",
    publishPacketId: "c0v-moving-publish",
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

interface LayerInput {
  readonly layerId: Phase10C0VAggregateLayerId;
  readonly packetId: Phase10C0VResourceLedgerAttempt["packetId"];
  readonly result: Phase10C0VAggregateLayerResult;
  readonly resultBytes: Uint8Array;
  readonly resultIdentity: Phase10C0VS6ArtifactIdentity;
  readonly sourceIndex: Phase10C0VAggregateArtifactIndex;
  readonly sourceIndexBytes: Uint8Array;
  readonly sourceIndexIdentity: Phase10C0VS6ArtifactIdentity;
  readonly attempt: Phase10C0VS6AttemptRowV2;
  readonly attemptLedgerBytes: Uint8Array;
}

interface AggregateInputs {
  readonly root: Phase10C0VS6PhysicalRoot;
  readonly dependencies: Phase10C0VS6ReopenedDependencySet;
  readonly layers: readonly [LayerInput, LayerInput, LayerInput];
  readonly negativeControl: Phase10C0VAnyLayerNonpassControlReceipt;
  readonly claimBoundary: Phase10C0VClaimBoundary;
}

export interface Phase10C0VAnyLayerNonpassResult {
  readonly receipt: Phase10C0VAnyLayerNonpassControlReceipt;
  readonly bytes: Uint8Array;
}

export interface Phase10C0VAggregateProduceResult {
  readonly terminalTable: Phase10C0VTerminalTable;
  readonly resourceLedger: Phase10C0VResourceLedger;
  readonly aggregate: Phase10C0VAggregateResult;
  readonly artifactIndex: Phase10C0VAggregateArtifactIndex;
  readonly bytes: Phase10C0VAggregateCandidateBytes;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V aggregate producer refused: ${message}`);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function syntheticIdentity(layerId: Phase10C0VAggregateLayerId): Phase10C0VS6ArtifactIdentity {
  const stem = layerId === "C0V-RADIAL" ? "radial" : layerId === "C0V-STATIC" ? "static" : "moving";
  const path = `out/phase10-execution-v2/fixtures/c0v-aggregate/synthetic-${stem}-result.json`;
  return phase10C0VS6ArtifactIdentity(path, new TextEncoder().encode(`phase10-c0v-synthetic-${stem}-pass-v1\n`));
}

function syntheticClaimBoundary(): Phase10C0VClaimBoundary {
  return Object.freeze({
    allowed: Object.freeze(["synthetic-aggregate-negative-control"]),
    forbidden: Object.freeze(["evidence-credit", "qualification-credit"]),
  });
}

function aggregateFacts(rows: readonly Phase10C0VTerminalTableRow[]): {
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

function table(
  tableId: string,
  rows: readonly [Phase10C0VTerminalTableRow, Phase10C0VTerminalTableRow, Phase10C0VTerminalTableRow],
): Phase10C0VTerminalTable {
  return Object.freeze({
    schema: "phase10-c0v-terminal-table-v1",
    tableId,
    rows,
    ...aggregateFacts(rows),
  });
}

function syntheticCleanTable(): Phase10C0VTerminalTable {
  const boundary = syntheticClaimBoundary();
  const row = (layerId: Phase10C0VAggregateLayerId): Phase10C0VTerminalTableRow => Object.freeze({
    layerId,
    branch: "independent-reference",
    terminalStatus: "pass",
    result: syntheticIdentity(layerId),
    scientificDisposition: "pass",
    negativeControlDisposition: "pass",
    resourceDisposition: "within-cap",
    claimBoundary: boundary,
  });
  return table("c0v-terminal-table-synthetic-all-pass-v1", Object.freeze([
    row("C0V-RADIAL"), row("C0V-STATIC"), row("C0V-MOVING-EVENT"),
  ] as const));
}

function mutateSyntheticTable(clean: Phase10C0VTerminalTable): Phase10C0VTerminalTable {
  const radial = clean.rows[0];
  return table("c0v-terminal-table-synthetic-radial-refusal-v1", Object.freeze([
    Object.freeze({ ...radial, scientificDisposition: "refusal" as const }),
    clean.rows[1],
    clean.rows[2],
  ] as const));
}

function outcome(value: Phase10C0VTerminalTable): Phase10C0VAggregateOutcome {
  const packageCompletionEligible = value.allThreeTerminal;
  return Object.freeze({
    aggregateStatus: value.aggregateStatus,
    packageCompletionEligible,
    dependentQualificationBlocked: value.aggregateStatus === "non-pass",
  });
}

export function phase10C0VAnyLayerNonpass(
  request: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VAnyLayerNonpassResult {
  const dependencies = phase10C0VS6ReopenPublishedDependencies(request);
  if (dependencies.packet.packetId !== "c0v-aggregate" || dependencies.packet.executionMode !== "aggregate" ||
    dependencies.preflight.verdict !== "pass" || dependencies.preflight.refusalCandidate !== null ||
    dependencies.packet.aggregateNegativeControlContract === null) {
    fail("negative control requires the exact passing aggregate packet/preflight authority");
  }
  return constructAnyLayerNonpassControlReceipt();
}

function constructAnyLayerNonpassControlReceipt(): Phase10C0VAnyLayerNonpassResult {
  const cleanTable = syntheticCleanTable();
  const mutatedTable = mutateSyntheticTable(cleanTable);
  const cleanOutcome = outcome(cleanTable);
  const attackedOutcome = outcome(mutatedTable);
  const result: Phase10C0VNegativeControlResult = Object.freeze({
    negativeControlId: "nc-c0v-any-layer-nonpass",
    mutationExecuted: true,
    witnessMoved: true,
    cleanCapturePreserved: true,
    attackedCheckFailed: cleanOutcome.aggregateStatus === "pass" && attackedOutcome.aggregateStatus === "non-pass",
    pass: cleanOutcome.aggregateStatus === "pass" && attackedOutcome.aggregateStatus === "non-pass" &&
      attackedOutcome.packageCompletionEligible && attackedOutcome.dependentQualificationBlocked,
  });
  const receipt: Phase10C0VAnyLayerNonpassControlReceipt = Object.freeze({
    schema: "phase10-c0v-any-layer-nonpass-control-v1",
    negativeControlId: "nc-c0v-any-layer-nonpass",
    ownerCheckId: "chk-c0v-any-layer-nonpass",
    callableId: "phase10-nc-c0v-any-layer-nonpass",
    cleanTable,
    mutatedLayerId: "C0V-RADIAL",
    mutatedTable,
    mutation: Object.freeze({
      field: "scientificDisposition",
      before: "pass",
      after: "refusal",
      changedRowCount: 1,
      otherRowsUnchanged: true,
    }),
    cleanOutcome,
    attackedOutcome,
    result,
  });
  return Object.freeze({
    receipt,
    bytes: phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(receipt)),
  });
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

function deriveInputs(request: Phase10C0VS6RawRuntimeAuthorityInput): AggregateInputs {
  // These are pre-verification candidate inputs. The aggregate check caller reopens and deeply
  // verifies all seven prior packets; verification-v2 alone owns complete package acceptance.
  const dependencies = phase10C0VS6ReopenPublishedDependencies(request);
  if (dependencies.packet.packetId !== "c0v-aggregate" || dependencies.packet.executionMode !== "aggregate" ||
    dependencies.preflight.verdict !== "pass" || dependencies.preflight.refusalCandidate !== null ||
    dependencies.packet.aggregateNegativeControlContract === null) {
    fail("aggregate production requires exact passing raw aggregate authority");
  }
  const root = phase10C0VS6PhysicalRepositoryRoot(request.repositoryRoot);
  const manifest = phase10C0VS6ValidateHeadBoundPreflightManifest(root.path, dependencies.preflight);
  const layers = LAYER_ORDER.map((config) => {
    const resultArtifact = artifact(dependencies, config.resultPath, config.resultSchema);
    const result = parsePhase10C0VAggregateLayerResultBytes(resultArtifact.bytes, config.layerId);
    const sourceIndexArtifact = artifact(dependencies, config.indexPath, "phase10-artifact-index-v1");
    const sourceIndex = parsePhase10C0VAggregateArtifactIndexBytes(
      sourceIndexArtifact.bytes, `${config.layerId} source artifact index`,
    );
    const resultIndexRows = sourceIndex.artifacts.filter((entry) => entry.path === config.resultPath);
    if (resultIndexRows.length !== 1) fail(`${config.layerId} source index lacks its exact result`);
    phase10C0VS6SameIdentity(resultIndexRows[0]!, resultArtifact.identity, `${config.layerId} indexed result`);
    const attemptLedgerBytes = readBound(root, result.attemptLedger, manifest, `${config.layerId} attempt ledger`);
    const attempts = parsePhase10C0VS6AttemptLedgerV2(attemptLedgerBytes, `${config.layerId} attempt ledger`);
    if (attempts.length !== 1) fail(`${config.layerId} current-v1 ledger must contain exactly one attempt`);
    const attempt = attempts[0]!;
    if (attempt.layerId !== config.layerId || attempt.terminalStatus !== result.terminalStatus ||
      attempt.branch !== result.branch || attempt.dispositionCode !== ("attemptDispositionCode" in result
        ? result.attemptDispositionCode
        : config.layerId === "C0V-STATIC"
          ? "preimplementation-reference-refusal"
          : "reference-discrepancy-refusal")) {
      fail(`${config.layerId} result differs from its selected attempt row`);
    }
    return Object.freeze({
      layerId: config.layerId,
      packetId: config.packetId,
      result,
      resultBytes: resultArtifact.bytes,
      resultIdentity: resultArtifact.identity,
      sourceIndex,
      sourceIndexBytes: sourceIndexArtifact.bytes,
      sourceIndexIdentity: sourceIndexArtifact.identity,
      attempt,
      attemptLedgerBytes,
    });
  });
  const ncContract = dependencies.packet.aggregateNegativeControlContract;
  const expectedAttemptDirectory = `${dependencies.packet.paths.attemptRoot}/${dependencies.packet.registeredAttemptId}`;
  if (dependencies.preflight.observed.attemptDirectory !== expectedAttemptDirectory) {
    fail("aggregate preflight attempt directory differs from packet authority");
  }
  const ncPath = `${dependencies.preflight.observed.attemptDirectory}/${ncContract.filename}`;
  const ncBytes = phase10C0VS6ReadUniquePhysicalFile(root, ncPath);
  const negativeControl = parsePhase10C0VAnyLayerNonpassControlReceiptBytes(ncBytes);
  return Object.freeze({
    root,
    dependencies,
    layers: Object.freeze(layers) as unknown as readonly [LayerInput, LayerInput, LayerInput],
    negativeControl,
    claimBoundary: dependencies.packet.claimBoundary,
  });
}

function terminalTable(inputs: AggregateInputs): Phase10C0VTerminalTable {
  const rows = inputs.layers.map((entry): Phase10C0VTerminalTableRow => Object.freeze({
    layerId: entry.layerId,
    branch: entry.result.branch,
    terminalStatus: entry.result.terminalStatus,
    result: entry.resultIdentity,
    scientificDisposition: entry.result.scientificDisposition,
    negativeControlDisposition: entry.result.negativeControlDisposition,
    resourceDisposition: entry.result.resourceDisposition,
    claimBoundary: entry.result.claimBoundary,
  }));
  return table("c0v-terminal-table-v1", Object.freeze(rows) as unknown as readonly [
    Phase10C0VTerminalTableRow, Phase10C0VTerminalTableRow, Phase10C0VTerminalTableRow,
  ]);
}

function resourceAttempt(entry: LayerInput): Phase10C0VResourceLedgerAttempt {
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

function resourceLedger(inputs: AggregateInputs): Phase10C0VResourceLedger {
  const attempts = Object.freeze(inputs.layers.map(resourceAttempt)) as unknown as readonly [
    Phase10C0VResourceLedgerAttempt, Phase10C0VResourceLedgerAttempt, Phase10C0VResourceLedgerAttempt,
  ];
  const elapsed = attempts.reduce((sum, entry) => sum + entry.governedInvocationElapsedNanoseconds, 0);
  if (!Number.isSafeInteger(elapsed)) fail("aggregate governed elapsed nanoseconds exceed safe integer range");
  const terminalRetainedBytes = attempts.reduce((sum, entry) => sum + entry.terminalRetainedBytes, 0);
  if (!Number.isSafeInteger(terminalRetainedBytes)) fail("aggregate retained bytes exceed safe integer range");
  const maximumObservedConcurrentBytes = Math.max(...attempts.map((entry) => entry.maximumObservedConcurrentBytes));
  const anyLayerResourceRefusal = attempts.some((entry) =>
    entry.dispositionCode === "prelaunch-resource-refusal" ||
    entry.dispositionCode === "registered-cap-resource-refusal");
  const capExceeded = anyLayerResourceRefusal || elapsed > PACKAGE_ELAPSED_MAXIMUM ||
    maximumObservedConcurrentBytes > PACKAGE_BYTES_MAXIMUM || terminalRetainedBytes > PACKAGE_BYTES_MAXIMUM;
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
      maximumObservedConcurrentBytes,
      terminalRetainedBytes,
    }),
    capExceeded,
    disposition: capExceeded ? "resource-refusal" : "within-cap",
  });
}

function aggregateResult(
  inputs: AggregateInputs,
  tableValue: Phase10C0VTerminalTable,
  tableBytes: Uint8Array,
  ledgerBytes: Uint8Array,
): Phase10C0VAggregateResult {
  if (!inputs.negativeControl.result.pass) fail("retained any-layer-nonpass control did not pass");
  return Object.freeze({
    schema: "phase10-c0v-aggregate-v1",
    aggregateId: "c0v-aggregate-v1",
    terminalTable: phase10C0VS6ArtifactIdentity(TABLE_PATH, tableBytes),
    resourceLedger: phase10C0VS6ArtifactIdentity(RESOURCE_PATH, ledgerBytes),
    layerResults: Object.freeze(inputs.layers.map((entry) => entry.resultIdentity)) as unknown as readonly [
      Phase10C0VS6ArtifactIdentity, Phase10C0VS6ArtifactIdentity, Phase10C0VS6ArtifactIdentity,
    ],
    allThreeTerminal: tableValue.allThreeTerminal,
    allIndependentReferences: tableValue.allIndependentReferences,
    allLayersPass: tableValue.allLayersPass,
    aggregateStatus: tableValue.aggregateStatus,
    negativeControl: inputs.negativeControl.result,
    packageCompletionEligible: tableValue.allThreeTerminal,
    dependentQualificationBlocked: tableValue.aggregateStatus === "non-pass",
    claimBoundary: inputs.claimBoundary,
  });
}

function indexEntry(
  artifactId: string,
  path: string,
  bytes: Uint8Array,
  role: string,
  producedBy: string,
): Phase10C0VAggregateArtifactIndexEntry {
  const identity = phase10C0VS6ArtifactIdentity(path, bytes);
  return Object.freeze({
    artifactId,
    ...identity,
    mediaType: aggregateMediaType(path),
    role,
    producedBy,
  });
}

function artifactIndex(
  inputs: AggregateInputs,
  tableBytes: Uint8Array,
  ledgerBytes: Uint8Array,
  aggregateBytes: Uint8Array,
): Phase10C0VAggregateArtifactIndex {
  const byPath = new Map<string, Phase10C0VAggregateArtifactIndexEntry>();
  const byId = new Map<string, Phase10C0VAggregateArtifactIndexEntry>();
  const add = (entry: Phase10C0VAggregateArtifactIndexEntry): void => {
    const same = (left: Phase10C0VAggregateArtifactIndexEntry, right: Phase10C0VAggregateArtifactIndexEntry): boolean =>
      left.artifactId === right.artifactId && left.path === right.path && left.byteLength === right.byteLength &&
      left.sha256 === right.sha256 && left.mediaType === right.mediaType && left.role === right.role &&
      left.producedBy === right.producedBy;
    const pathPrior = byPath.get(entry.path);
    const idPrior = byId.get(entry.artifactId);
    if ((pathPrior !== undefined && !same(pathPrior, entry)) || (idPrior !== undefined && !same(idPrior, entry))) {
      fail(`artifact index collision at ${entry.artifactId}/${entry.path}`);
    }
    byPath.set(entry.path, entry);
    byId.set(entry.artifactId, entry);
  };
  for (const [index, layer] of inputs.layers.entries()) {
    for (const entry of layer.sourceIndex.artifacts) add(entry);
    const config = LAYER_ORDER[index]!;
    add(indexEntry(
      config.indexOutputId,
      config.indexPath,
      layer.sourceIndexBytes,
      "layer-artifact-index",
      config.indexProducer,
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

export function producePhase10C0VAggregate(
  request: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VAggregateProduceResult {
  const inputs = deriveInputs(request);
  const terminal = terminalTable(inputs);
  const terminalBytes = phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(terminal));
  const resources = resourceLedger(inputs);
  const resourceBytes = phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(resources));
  const aggregate = aggregateResult(inputs, terminal, terminalBytes, resourceBytes);
  const aggregateBytes = phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(aggregate));
  const index = artifactIndex(inputs, terminalBytes, resourceBytes, aggregateBytes);
  const artifactIndexBytes = phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(index));
  return Object.freeze({
    terminalTable: terminal,
    resourceLedger: resources,
    aggregate,
    artifactIndex: index,
    bytes: Object.freeze({
      terminalTable: terminalBytes,
      resourceLedger: resourceBytes,
      aggregate: aggregateBytes,
      artifactIndex: artifactIndexBytes,
    }),
  });
}
