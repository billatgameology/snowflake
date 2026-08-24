const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const matrixPath = "research/phase10-c0v-s6-obligation-matrix-v1.json";
const cataloguePath = "research/phase10-execution-v2/packet-catalogue.json";
const matrix = JSON.parse(fs.readFileSync(matrixPath, "utf8"));
const catalogue = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));
// The rejected native-launcher design is historical plan context, not S6 execution authority.
// Normalize the hand-authored catalogue to the accepted visible-entry loader boundary before
// deriving any identities so a resumed pre-freeze tree cannot retain the obsolete prerequisite.
delete catalogue.runtimeLauncherContract;
catalogue.runtimeLoaderContract = {
  schema: "phase10-c0v-s6-runtime-loader-contract-v1",
  execArgvRule: "parent-and-worker-process-exec-argv-exact-empty-array",
  forbiddenEnvironmentKeyRule: "ascii-uppercase-equals-NODE-or-TS_NODE-or-starts-NODE_-or-TS_NODE_",
  exactWorkerEnvironment: [
    { key: "GIT_CONFIG_GLOBAL", value: "NUL" },
    { key: "GIT_CONFIG_NOSYSTEM", value: "1" },
    { key: "GIT_OPTIONAL_LOCKS", value: "0" },
    { key: "GIT_TERMINAL_PROMPT", value: "0" },
    { key: "LC_ALL", value: "C" },
    { key: "PATH", value: "C:\\Program Files\\Git\\cmd" },
    { key: "PATHEXT", value: ".COM;.EXE" },
    { key: "SYSTEMROOT", value: "C:\\WINDOWS" },
  ],
  workerEnvironmentRule: "parent-materializes-exact-clean-environment-worker-independently-exact-compares-complete-environment-no-ambient-clone",
  preflightRecordingRule: "frozen-code-rejection-no-ambient-environment-values-serialized",
  entryObservationScopeRule: "visible-at-entry-loader-state-enforced-deliberate-trace-erasure-outside-registered-threat-model",
};
const packetIds = catalogue.packets.map((entry) => entry.packetId);

function identity(filePath) {
  const bytes = fs.readFileSync(filePath);
  return { path: filePath.replaceAll("\\", "/"), byteLength: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex") };
}

const PREOBSERVATION_COMMIT = "cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9";
const preObservationProductionClosurePaths = [
  "app/package.json", "core/package.json", "core/src/checkpoint.ts", "core/src/index.ts",
  "core/src/lattice.ts", "core/src/libbrecht.ts", "core/src/lk-resume-checkpoint.ts",
  "core/src/metrics.ts", "core/src/params.ts", "core/src/prng.ts", "core/src/state.ts",
  "core/src/target-observables.ts", "core/src/timeline.ts", "package-lock.json", "package.json",
  "runner/package.json", "runner/src/gate4-evidence.ts", "runner/src/phase10-c0v-contracts.ts",
  "solver-cpu/package.json", "solver-cpu/src/spherical-reference.ts", "solver-gpu/package.json",
  "tsconfig.base.json", "tsconfig.json",
];
const preObservationProductionClosureArtifacts = preObservationProductionClosurePaths.map((filePath) => {
  const bytes = execFileSync("git", ["show", `${PREOBSERVATION_COMMIT}:${filePath}`]);
  return { path: filePath, byteLength: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex") };
});

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

// The catalogue is hand-authored design authority but shares the same exact pretty-2/LF byte
// contract as every generated consumer. Canonicalize it before computing any bound identity.
writeJson(cataloguePath, catalogue);

const callableLocations = {
  "phase10-a-p-c0v-s6-producer": ["runner/src/phase10-c0v-s6-ap.ts", "producePhase10C0VS6ApArtifacts"],
  "phase10-a-p-c0v-s6-check-caller": ["runner/src/phase10-c0v-s6-ap.ts", "verifyPhase10C0VS6ApArtifacts"],
  "phase10-a-p-c0v-s6-evaluator": ["runner/src/phase10-c0v-s6-ap-independent.ts", "independentlyVerifyPhase10C0VS6ApArtifacts"],
  "phase10-nc-a-p-c0v-s6-missing-producer": ["runner/src/phase10-c0v-s6-ap-negative-controls.ts", "runPhase10C0VS6MissingProducerControl"],
  "phase10-nc-a-p-c0v-s6-uncalled-check": ["runner/src/phase10-c0v-s6-ap-negative-controls.ts", "runPhase10C0VS6UncalledCheckControl"],
  "phase10-a-p-c0v-s6-verification-receipt-writer": ["runner/src/phase10-c0v-s6-receipts.ts", "writePhase10C0VS6ApVerificationReceipt"],
  "phase10-c0v-s6-terminal-receipt-writer": ["runner/src/phase10-c0v-s6-receipts.ts", "writePhase10C0VS6TerminalReceipt"],
  "phase10-c0v-s6-preflight-receipt-writer": ["runner/src/phase10-c0v-s6-receipts.ts", "writePhase10C0VS6PreflightReceipt"],
  "phase10-c0v-s6-packet-verification-receipt-writer": ["runner/src/phase10-c0v-s6-receipts.ts", "writePhase10C0VS6PacketVerificationReceipt"],

  "phase10-c0v-moving-attempt-receipt-writer": ["runner/src/phase10-c0v-s6-attempt.ts", "writePhase10C0VMovingAttemptReceipt"],
  "phase10-c0v-moving-protocol-producer": ["runner/src/phase10-c0v-s6-attempt.ts", "reopenPhase10C0VMovingProtocol"],
  "phase10-c0v-moving-reference-producer": ["runner/src/phase10-c0v-s6-attempt.ts", "reopenPhase10C0VMovingReference"],
  "phase10-c0v-moving-produce-check-caller": ["runner/src/phase10-c0v-s6-refusal.ts", "phase10C0VMovingProduceCheckCaller"],
  "phase10-c0v-moving-evaluator": ["runner/src/phase10-c0v-s6-refusal.ts", "independentlyEvaluatePhase10C0VMovingDiscrepancy"],

  "phase10-c0v-radial-attempt-receipt-writer": ["runner/src/phase10-c0v-s6-attempt.ts", "writePhase10C0VRadialAttemptReceipt"],
  "phase10-c0v-radial-protocol-producer": ["runner/src/phase10-c0v-s6-attempt.ts", "reopenPhase10C0VRadialProtocol"],
  "phase10-c0v-radial-reference-producer": ["runner/src/phase10-c0v-s6-attempt.ts", "reopenPhase10C0VRadialReference"],
  "phase10-c0v-radial-production-producer": ["runner/src/phase10-c0v-radial-production.ts", "producePhase10C0VRadialWitness"],
  "phase10-c0v-radial-evaluation-receipt-writer": ["runner/src/phase10-c0v-s6-receipts.ts", "writePhase10C0VRadialEvaluationReceipt"],
  "phase10-c0v-radial-produce-check-caller": ["runner/src/phase10-c0v-radial-checks.ts", "phase10C0VRadialProduceCheckCaller"],
  "phase10-c0v-radial-evaluator": ["runner/src/phase10-c0v-radial-evaluator.ts", "independentlyEvaluatePhase10C0VRadial"],
  "phase10-nc-radial-finite-shell-term": ["runner/src/phase10-c0v-radial-negative-controls.ts", "phase10RadialFiniteShellTerm"],
  "phase10-nc-radial-forged-summary": ["runner/src/phase10-c0v-radial-negative-controls.ts", "phase10RadialForgedSummary"],
  "phase10-nc-radial-robin-coefficient": ["runner/src/phase10-c0v-radial-negative-controls.ts", "phase10RadialRobinCoefficient"],
  "phase10-c0v-s6-refusal-check-caller": ["runner/src/phase10-c0v-s6-refusal.ts", "phase10C0VS6RefusalCheckCaller"],
  "phase10-c0v-s6-refusal-evaluator": ["runner/src/phase10-c0v-s6-refusal.ts", "independentlyEvaluatePhase10C0VS6RefusalCause"],

  "phase10-c0v-static-attempt-receipt-writer": ["runner/src/phase10-c0v-s6-attempt.ts", "writePhase10C0VStaticAttemptReceipt"],
  "phase10-c0v-static-protocol-producer": ["runner/src/phase10-c0v-s6-attempt.ts", "reopenPhase10C0VStaticProtocol"],
  "phase10-c0v-static-refusal-receipt-writer": ["runner/src/phase10-c0v-s6-attempt.ts", "reopenPhase10C0VStaticReferenceRefusal"],
  "phase10-c0v-static-produce-check-caller": ["runner/src/phase10-c0v-s6-refusal.ts", "phase10C0VStaticProduceCheckCaller"],
  "phase10-c0v-static-refusal-evaluator": ["runner/src/phase10-c0v-s6-refusal.ts", "independentlyEvaluatePhase10C0VStaticRefusal"],

  "phase10-c0v-s6-freeze-check-caller": ["runner/src/phase10-c0v-s6-freeze.ts", "phase10C0VS6FreezeAncestryCheckCaller"],
  "phase10-c0v-s6-freeze-evaluator": ["runner/src/phase10-c0v-s6-freeze.ts", "independentlyEvaluatePhase10C0VS6FreezeAncestry"],
  "phase10-c0v-s6-resource-check-caller": ["runner/src/phase10-c0v-s6-resource.ts", "phase10C0VS6ResourceBoundaryCheckCaller"],
  "phase10-c0v-s6-resource-evaluator": ["runner/src/phase10-c0v-s6-resource.ts", "independentlyEvaluatePhase10C0VS6ResourceBoundary"],
  "phase10-c0v-s6-attempt-census-check-caller": ["runner/src/phase10-c0v-s6-attempt-census.ts", "phase10C0VS6AttemptCensusCheckCaller"],
  "phase10-c0v-s6-attempt-census-evaluator": ["runner/src/phase10-c0v-s6-attempt-census.ts", "independentlyCensusPhase10C0VS6Attempt"],

  "phase10-c0v-moving-publish-producer": ["runner/src/phase10-c0v-s6-publication.ts", "producePhase10C0VMovingPublication"],
  "phase10-c0v-moving-publish-check-caller": ["runner/src/phase10-c0v-s6-publication-checks.ts", "phase10C0VMovingPublishCheckCaller"],
  "phase10-c0v-moving-publication-verifier": ["runner/src/phase10-c0v-s6-publication-verifier.ts", "independentlyVerifyPhase10C0VMovingPublication"],
  "phase10-c0v-moving-publish-verification-receipt-writer": ["runner/src/phase10-c0v-s6-receipts.ts", "writePhase10C0VMovingPublishVerificationReceipt"],
  "phase10-c0v-radial-publish-producer": ["runner/src/phase10-c0v-s6-publication.ts", "producePhase10C0VRadialPublication"],
  "phase10-c0v-radial-publish-check-caller": ["runner/src/phase10-c0v-s6-publication-checks.ts", "phase10C0VRadialPublishCheckCaller"],
  "phase10-c0v-radial-publication-verifier": ["runner/src/phase10-c0v-s6-publication-verifier.ts", "independentlyVerifyPhase10C0VRadialPublication"],
  "phase10-c0v-radial-publish-verification-receipt-writer": ["runner/src/phase10-c0v-s6-receipts.ts", "writePhase10C0VRadialPublishVerificationReceipt"],
  "phase10-c0v-static-publish-producer": ["runner/src/phase10-c0v-s6-publication.ts", "producePhase10C0VStaticPublication"],
  "phase10-c0v-static-publish-check-caller": ["runner/src/phase10-c0v-s6-publication-checks.ts", "phase10C0VStaticPublishCheckCaller"],
  "phase10-c0v-static-publication-verifier": ["runner/src/phase10-c0v-s6-publication-verifier.ts", "independentlyVerifyPhase10C0VStaticPublication"],
  "phase10-c0v-static-publish-verification-receipt-writer": ["runner/src/phase10-c0v-s6-receipts.ts", "writePhase10C0VStaticPublishVerificationReceipt"],

  "phase10-c0v-aggregate-producer": ["runner/src/phase10-c0v-s6-aggregate.ts", "producePhase10C0VAggregate"],
  "phase10-c0v-aggregate-check-caller": ["runner/src/phase10-c0v-s6-aggregate-checks.ts", "phase10C0VAggregateCheckCaller"],
  "phase10-c0v-aggregate-evaluator": ["runner/src/phase10-c0v-s6-aggregate-verifier.ts", "independentlyVerifyPhase10C0VAggregate"],
  "phase10-c0v-aggregate-verification-receipt-writer": ["runner/src/phase10-c0v-s6-receipts.ts", "writePhase10C0VAggregateVerificationReceipt"],
  "phase10-nc-c0v-any-layer-nonpass": ["runner/src/phase10-c0v-s6-aggregate.ts", "phase10C0VAnyLayerNonpass"],
};

function packetCallables(packetId) {
  const outputs = matrix.outputs.filter((entry) => entry.packetId === packetId);
  const checks = matrix.checks.filter((entry) => entry.packetId === packetId);
  const controls = matrix.negativeControls.filter((entry) => entry.packetId === packetId);
  const ids = new Set();
  outputs.forEach((entry) => ids.add(entry.producerCallableId));
  checks.forEach((entry) => { ids.add(entry.callerCallableId); ids.add(entry.independentEvaluatorCallableId); });
  controls.forEach((entry) => ids.add(entry.callableId));
  ids.add("phase10-c0v-s6-freeze-evaluator");
  return [...ids].sort().map((callableId) => {
    const location = callableLocations[callableId];
    if (!location) throw new Error(`missing callable location ${callableId}`);
    const producedOutputIds = outputs.filter((entry) => entry.producerCallableId === callableId).map((entry) => entry.outputId).sort();
    const invokedCheckIds = checks.filter((entry) => entry.callerCallableId === callableId).map((entry) => entry.checkId).sort();
    const evaluatedCheckIds = checks.filter((entry) => entry.independentEvaluatorCallableId === callableId).map((entry) => entry.checkId).sort();
    const executedNegativeControlIds = controls.filter((entry) => entry.callableId === callableId).map((entry) => entry.negativeControlId).sort();
    const role = executedNegativeControlIds.length ? "negative-control" : invokedCheckIds.length ? "check-caller" :
      evaluatedCheckIds.length || callableId === "phase10-c0v-s6-freeze-evaluator" ? "independent-evaluator" : "producer";
    const moduleIdentity = identity(location[0]);
    return {
      callableId,
      role,
      resolution: "resolved",
      modulePath: location[0],
      exportName: location[1],
      identity: { byteLength: moduleIdentity.byteLength, sha256: moduleIdentity.sha256 },
      producedOutputIds,
      invokedCheckIds,
      evaluatedCheckIds,
      executedNegativeControlIds,
    };
  });
}

for (const packetId of packetIds) {
  writeJson(`research/phase10-execution-v2/packets/${packetId}/callable-registry.json`, {
    schema: "phase10-c0v-s6-callable-registry-v1",
    registryId: `phase10-${packetId}-execution-v2-callables-v1`,
    matrixId: "phase10-c0v-s6-obligations-v1",
    protocolId: `phase10-${packetId}-execution-v2-v1`,
    packetId,
    callables: packetCallables(packetId),
  });
}

const originalApPaths = [
  "evidence/phase10-obligation-preflight-v1/artifact-index.json",
  "evidence/phase10-obligation-preflight-v1/missing-producer.json",
  "evidence/phase10-obligation-preflight-v1/packets/a-p/preflight.json",
  "evidence/phase10-obligation-preflight-v1/packets/a-p/terminal-receipt.json",
  "evidence/phase10-obligation-preflight-v1/uncalled-check.json",
  "evidence/phase10-obligation-preflight-v1/verification.json",
];
const originalApEvidence = originalApPaths.map(identity);
const packageStorageBaselinePaths = [
  "evidence/phase10-numerical-verification-v1/c0v-moving-reference.json",
  "evidence/phase10-numerical-verification-v1/c0v-radial-reference.json",
  "evidence/phase10-numerical-verification-v1/c0v-static-reference-refusal.json",
  "out/phase10-c0v-reference-v1/attempts/c0v-moving-reference-20260821-v1/reference-candidate.json",
  "out/phase10-c0v-reference-v1/attempts/c0v-moving-reference-20260821-v1/targeted-check.json",
  "out/phase10-c0v-reference-v1/attempts/c0v-radial-reference-20260821-v1/reference-candidate.json",
  "out/phase10-c0v-reference-v1/attempts/c0v-radial-reference-20260821-v1/targeted-check.json",
  "out/phase10-c0v-reference-v1/attempts/c0v-static-refusal-20260821-v1/reference-candidate.json",
  "out/phase10-c0v-reference-v1/attempts/c0v-static-refusal-20260821-v1/targeted-check.json",
  "out/phase10-c0v-reference-v1/superseded/cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9/published/c0v-moving-reference.json",
  "out/phase10-c0v-reference-v1/superseded/cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9/published/c0v-radial-reference.json",
  "out/phase10-c0v-reference-v1/superseded/cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9/published/c0v-static-reference-refusal.json",
];
const packageStorageBaselineArtifacts = packageStorageBaselinePaths.map(identity);
const layerArtifacts = {
  moving: ["research/phase10-c0v-moving-protocol-v1.json", "evidence/phase10-numerical-verification-v1/c0v-moving-reference.json"],
  radial: ["research/phase10-c0v-radial-protocol-v1.json", "evidence/phase10-numerical-verification-v1/c0v-radial-reference.json"],
  static: ["research/phase10-c0v-static-protocol-v1.json", "evidence/phase10-numerical-verification-v1/c0v-static-reference-refusal.json"],
};
const successorContractsPath = "research/phase10-c0v-s6-schema-contracts-v1.json";
const successorRegistryPath = "research/phase10-c0v-s6-artifact-schema-registry-v1.json";
const successorContracts = JSON.parse(fs.readFileSync(successorContractsPath, "utf8"));
const predecessorMatrix = JSON.parse(fs.readFileSync("research/phase10-obligation-matrix-v1.json", "utf8"));
const successorContractIdentity = identity(successorContractsPath);
const schemaFormats = {
  "phase10-c0v-attempt-row-v2": "jsonl-row",
  "phase10-c0v-radial-result-v2": "json",
  "phase10-c0v-s6-preflight-receipt-v2": "json",
  "phase10-c0v-s6-terminal-receipt-v2": "json",
  "phase10-packet-verification-v2": "json",
};
const overriddenOutputIds = new Set(successorContracts.scope.overriddenOutputIds);
const addedOutputIds = new Set(successorContracts.scope.addedOutputIds);
const governedOutputIds = new Set([...addedOutputIds, ...overriddenOutputIds]);
const successorSchemaRows = successorContracts.scope.addedSchemaIds.map((schemaId) => {
  const outputBindings = matrix.outputs
    .filter((output) => output.artifact.schemaId === schemaId && governedOutputIds.has(output.outputId))
    .map((output) => {
      const predecessor = predecessorMatrix.outputs.find((entry) => entry.outputId === output.outputId);
      const bindingKind = overriddenOutputIds.has(output.outputId) ? "supersedes" : "added";
      if ((bindingKind === "supersedes") !== (predecessor !== undefined) ||
        predecessor !== undefined && predecessor.artifact.path !== output.artifact.path) {
        throw new Error(`successor output binding mismatch ${output.outputId}`);
      }
      return {
        bindingKind,
        packetId: output.packetId,
        outputId: output.outputId,
        path: output.artifact.path,
        previousSchemaId: predecessor?.artifact.schemaId ?? null,
      };
    });
  if (outputBindings.length === 0) throw new Error(`successor schema has no output binding ${schemaId}`);
  const boundPacketIds = new Set(outputBindings.map((binding) => binding.packetId));
  return {
    schemaId,
    state: "defined",
    format: schemaFormats[schemaId],
    contract: {
      ...successorContractIdentity,
      pointer: `/schemas/${schemaId}`,
    },
    outputBindings,
    requiredBeforePacketIds: packetIds.filter((packetId) =>
      packetId === "a-p-c0v-s6" || boundPacketIds.has(packetId)),
  };
});
writeJson(successorRegistryPath, {
  schema: "phase10-c0v-s6-artifact-schema-registry-v1",
  registryId: "phase10-c0v-s6-successor-artifact-schemas-v1",
  createdOn: "2026-08-22",
  bindings: {
    predecessorRegistry: identity("research/phase10-c0v-artifact-schema-registry-v1.json"),
    predecessorContracts: identity("research/phase10-c0v-schema-contracts-v1.json"),
    successorContracts: successorContractIdentity,
  },
  overridePolicy: {
    mode: "scoped-output-schema-replacement-and-addition",
    allowedPacketIds: packetIds,
    addedOutputIds: successorContracts.scope.addedOutputIds,
    overriddenOutputIds: successorContracts.scope.overriddenOutputIds,
    pathMutationAllowed: false,
    predecessorMutationAllowed: false,
    otherDuplicateSchemaIdsAllowed: false,
  },
  publicationSchemaRule: "every-s6-published-output-schema-and-binding-registered-exactly-once",
  schemas: successorSchemaRows,
});
matrix.bindings.successorSchemaRegistry = identity(successorRegistryPath);
matrix.bindings.successorSchemaContracts = successorContractIdentity;
writeJson(matrixPath, matrix);
const identityBindings = {
  matrix: identity(matrixPath),
  packetCatalogue: identity(cataloguePath),
  predecessorSchemaRegistry: identity("research/phase10-c0v-artifact-schema-registry-v1.json"),
  predecessorSchemaContracts: identity("research/phase10-c0v-schema-contracts-v1.json"),
  successorSchemaRegistry: identity(successorRegistryPath),
  successorSchemaContracts: successorContractIdentity,
};

const AP_DEPENDENCIES = [
  ["a-p", "evidence/phase10-obligation-preflight-v1/artifact-index.json", "phase10-artifact-index-v1"],
  ["a-p", "evidence/phase10-obligation-preflight-v1/missing-producer.json", "phase10-ap-negative-control-v1"],
  ["a-p", "evidence/phase10-obligation-preflight-v1/packets/a-p/preflight.json", "phase10-preflight-receipt-v1"],
  ["a-p", "evidence/phase10-obligation-preflight-v1/packets/a-p/terminal-receipt.json", "phase10-execution-receipt-v1"],
  ["a-p", "evidence/phase10-obligation-preflight-v1/uncalled-check.json", "phase10-ap-negative-control-v1"],
  ["a-p", "evidence/phase10-obligation-preflight-v1/verification.json", "phase10-packet-verification-v1"],
];
const S6_AP_DEPENDENCIES = [
  ["a-p-c0v-s6", "evidence/phase10-obligation-preflight-v2/artifact-index.json", "phase10-artifact-index-v1"],
  ["a-p-c0v-s6", "evidence/phase10-obligation-preflight-v2/missing-producer.json", "phase10-ap-negative-control-v1"],
  ["a-p-c0v-s6", "evidence/phase10-obligation-preflight-v2/packets/a-p-c0v-s6/preflight.json", "phase10-c0v-s6-preflight-receipt-v2"],
  ["a-p-c0v-s6", "evidence/phase10-obligation-preflight-v2/packets/a-p-c0v-s6/terminal-receipt.json", "phase10-c0v-s6-terminal-receipt-v2"],
  ["a-p-c0v-s6", "evidence/phase10-obligation-preflight-v2/uncalled-check.json", "phase10-ap-negative-control-v1"],
  ["a-p-c0v-s6", "evidence/phase10-obligation-preflight-v2/verification.json", "phase10-packet-verification-v2"],
];
const produceDependencies = {
  "c0v-moving-produce": [
    ["c0v-moving-produce", "evidence/phase10-numerical-verification-v1/c0v-moving-attempts.jsonl", "phase10-c0v-attempt-ledger-v2"],
    ["c0v-moving-produce", "evidence/phase10-obligation-preflight-v2/packets/c0v-moving-produce/preflight.json", "phase10-c0v-s6-preflight-receipt-v2"],
    ["c0v-moving-produce", "evidence/phase10-obligation-preflight-v2/packets/c0v-moving-produce/terminal-receipt.json", "phase10-c0v-s6-terminal-receipt-v2"],
    ["c0v-moving-produce", "evidence/phase10-obligation-preflight-v2/packets/c0v-moving-produce/verification.json", "phase10-packet-verification-v2"],
  ],
  "c0v-radial-produce": [
    ["c0v-radial-produce", "evidence/phase10-numerical-verification-v1/c0v-radial-attempts.jsonl", "phase10-c0v-attempt-ledger-v2"],
    ["c0v-radial-produce", "evidence/phase10-numerical-verification-v1/c0v-radial-evaluation.json", "phase10-c0v-radial-evaluation-v1"],
    ["c0v-radial-produce", "evidence/phase10-numerical-verification-v1/c0v-radial-witness.bin", "phase10-c0v-radial-witness-v1"],
    ["c0v-radial-produce", "evidence/phase10-obligation-preflight-v2/packets/c0v-radial-produce/preflight.json", "phase10-c0v-s6-preflight-receipt-v2"],
    ["c0v-radial-produce", "evidence/phase10-obligation-preflight-v2/packets/c0v-radial-produce/terminal-receipt.json", "phase10-c0v-s6-terminal-receipt-v2"],
    ["c0v-radial-produce", "evidence/phase10-obligation-preflight-v2/packets/c0v-radial-produce/verification.json", "phase10-packet-verification-v2"],
  ],
  "c0v-static-produce": [
    ["c0v-static-produce", "evidence/phase10-numerical-verification-v1/c0v-static-attempts.jsonl", "phase10-c0v-attempt-ledger-v2"],
    ["c0v-static-produce", "evidence/phase10-obligation-preflight-v2/packets/c0v-static-produce/preflight.json", "phase10-c0v-s6-preflight-receipt-v2"],
    ["c0v-static-produce", "evidence/phase10-obligation-preflight-v2/packets/c0v-static-produce/terminal-receipt.json", "phase10-c0v-s6-terminal-receipt-v2"],
    ["c0v-static-produce", "evidence/phase10-obligation-preflight-v2/packets/c0v-static-produce/verification.json", "phase10-packet-verification-v2"],
  ],
};
const publishDependencies = {
  "c0v-moving-publish": [
    ["c0v-moving-publish", "evidence/phase10-numerical-verification-v1/c0v-moving-artifact-index.json", "phase10-artifact-index-v1"],
    ["c0v-moving-publish", "evidence/phase10-numerical-verification-v1/c0v-moving-publish-verification.json", "phase10-packet-verification-v2"],
    ["c0v-moving-publish", "evidence/phase10-numerical-verification-v1/c0v-moving-result.json", "phase10-c0v-moving-result-v1"],
    ["c0v-moving-publish", "evidence/phase10-obligation-preflight-v2/packets/c0v-moving-publish/preflight.json", "phase10-c0v-s6-preflight-receipt-v2"],
    ["c0v-moving-publish", "evidence/phase10-obligation-preflight-v2/packets/c0v-moving-publish/terminal-receipt.json", "phase10-c0v-s6-terminal-receipt-v2"],
  ],
  "c0v-radial-publish": [
    ["c0v-radial-publish", "evidence/phase10-numerical-verification-v1/c0v-radial-artifact-index.json", "phase10-artifact-index-v1"],
    ["c0v-radial-publish", "evidence/phase10-numerical-verification-v1/c0v-radial-publish-verification.json", "phase10-packet-verification-v2"],
    ["c0v-radial-publish", "evidence/phase10-numerical-verification-v1/c0v-radial-result.json", "phase10-c0v-radial-result-v2"],
    ["c0v-radial-publish", "evidence/phase10-obligation-preflight-v2/packets/c0v-radial-publish/preflight.json", "phase10-c0v-s6-preflight-receipt-v2"],
    ["c0v-radial-publish", "evidence/phase10-obligation-preflight-v2/packets/c0v-radial-publish/terminal-receipt.json", "phase10-c0v-s6-terminal-receipt-v2"],
  ],
  "c0v-static-publish": [
    ["c0v-static-publish", "evidence/phase10-numerical-verification-v1/c0v-static-artifact-index.json", "phase10-artifact-index-v1"],
    ["c0v-static-publish", "evidence/phase10-numerical-verification-v1/c0v-static-publish-verification.json", "phase10-packet-verification-v2"],
    ["c0v-static-publish", "evidence/phase10-numerical-verification-v1/c0v-static-result.json", "phase10-c0v-static-result-v1"],
    ["c0v-static-publish", "evidence/phase10-obligation-preflight-v2/packets/c0v-static-publish/preflight.json", "phase10-c0v-s6-preflight-receipt-v2"],
    ["c0v-static-publish", "evidence/phase10-obligation-preflight-v2/packets/c0v-static-publish/terminal-receipt.json", "phase10-c0v-s6-terminal-receipt-v2"],
  ],
};

function dependencyRows(packetId) {
  let rows;
  if (packetId === "a-p-c0v-s6") rows = AP_DEPENDENCIES;
  else if (packetId.endsWith("-produce")) rows = S6_AP_DEPENDENCIES;
  else if (packetId.endsWith("-publish")) {
    const producer = packetId.replace("-publish", "-produce");
    rows = [...S6_AP_DEPENDENCIES, ...produceDependencies[producer]];
  } else rows = [...S6_AP_DEPENDENCIES, ...publishDependencies["c0v-moving-publish"], ...publishDependencies["c0v-radial-publish"], ...publishDependencies["c0v-static-publish"]];
  const dispositionsFor = (dependencyPacketId, artifactPath) => {
    if (dependencyPacketId === "c0v-radial-produce") {
      if (artifactPath.endsWith("/c0v-radial-evaluation.json") || artifactPath.endsWith("/c0v-radial-witness.bin")) {
        return ["production-complete"];
      }
      return [
        "prelaunch-resource-refusal",
        "preproduction-artifact-refusal",
        "production-complete",
        "registered-cap-resource-refusal",
      ];
    }
    if (dependencyPacketId === "c0v-moving-produce") return ["reference-discrepancy-refusal"];
    if (dependencyPacketId === "c0v-static-produce") return ["preimplementation-reference-refusal"];
    return [null];
  };
  return rows.slice().sort((a, b) => `${a[0]}\0${a[1]}`.localeCompare(`${b[0]}\0${b[1]}`)).map(([dependencyPacketId, artifactPath, schemaId]) => ({
    packetId: dependencyPacketId,
    artifactPath,
    schemaId,
    retentionClass: "tracked-evidence",
    applicableDispositionCodes: dispositionsFor(dependencyPacketId, artifactPath),
  }));
}

const countNames = ["protocolReopenCount", "referenceOrRefusalReopenCount", "workerProcessInvocationCount", "solverWorkerInvocationCount", "productionInvocationCount", "discrepancyOrRefusalEvaluatorInvocationCount", "freezeEvaluatorInvocationCount", "resourceEvaluatorInvocationCount", "attemptCensusEvaluatorInvocationCount", "checkCallerInvocationCount", "numericalEvaluatorInvocationCount", "numericalNegativeControlInvocationCount", "acceptedValidWitnessCount", "acceptedNumericalVerdictCount"];
function counts(values) { return Object.fromEntries(countNames.map((name, index) => [name, values[index]])); }
function tuple(tupleId, dispositionCode, terminalStatus, lifecycleStage, values, wallRule, partialRule) {
  return { tupleId, dispositionCode, terminalStatus, lifecycleStage, record: counts(values), governedInvocationElapsedNanosecondsRule: wallRule, partialExecutionRule: partialRule };
}
function invocation(invocationId, callableId, negativeControlId, invocationClass, registeredWallSecondsMaximum, terminalState = "complete") {
  return { invocationId, callableId, negativeControlId, invocationClass, registeredWallSecondsMaximum, terminalState };
}
// The single governed moving/static worker leaf is the registered check-caller wrapper.  It
// invokes its independent evaluator exactly once; registering the bare evaluator here would
// require a second execution merely to prove that the caller ran.
const movingLeaf = invocation("inv-c0v-moving-cause", "phase10-c0v-moving-produce-check-caller", null, "route-cause-evaluator", 14400);
const staticLeaf = invocation("inv-c0v-static-cause", "phase10-c0v-static-produce-check-caller", null, "route-cause-evaluator", 14400);
const radialLeaves = [
  invocation("inv-c0v-radial-production", "phase10-c0v-radial-production-producer", null, "solver-production", 300),
  invocation("inv-c0v-radial-evaluator", "phase10-c0v-radial-evaluator", null, "numerical-evaluator", 14400),
  invocation("inv-c0v-radial-nc-finite-shell-term", "phase10-nc-radial-finite-shell-term", "nc-radial-finite-shell-term", "numerical-negative-control", 14400),
  invocation("inv-c0v-radial-nc-forged-summary", "phase10-nc-radial-forged-summary", "nc-radial-forged-summary", "numerical-negative-control", 14400),
  invocation("inv-c0v-radial-nc-robin-coefficient", "phase10-nc-radial-robin-coefficient", "nc-radial-robin-coefficient", "numerical-negative-control", 14400),
];
function withFinalState(values, state) { return values.map((entry, index) => index === values.length - 1 ? { ...entry, terminalState: state } : { ...entry }); }
function tupleAuthority(packetId) {
  if (packetId === "c0v-moving-produce" || packetId === "c0v-static-produce") {
    const prefix = packetId.startsWith("c0v-moving") ? "moving" : "static";
    const disposition = prefix === "moving" ? "reference-discrepancy-refusal" : "preimplementation-reference-refusal";
    const leaf = prefix === "moving" ? movingLeaf : staticLeaf;
    const tuples = [
      tuple(`${prefix}-${prefix === "moving" ? "discrepancy" : "preimplementation"}-refusal`, disposition, "refusal", "postworker-classified-refusal", [1,1,1,0,0,1,1,1,1,4,0,0,0,0], "measured-sum", "must-be-null"),
      tuple(`${prefix}-prelaunch-refusal`, "prelaunch-resource-refusal", "refusal", "prelaunch-resource-refusal", [1,1,0,0,0,1,1,0,1,3,0,0,0,0], "exact-zero", "must-be-null"),
      tuple(`${prefix}-cap-cause`, "registered-cap-resource-refusal", "refusal", "registered-cap-route-cause", [1,1,1,0,0,1,1,1,1,5,0,0,0,0], "measured-sum", "must-be-present"),
    ];
    const fullId = tuples[0].tupleId;
    const rosters = [
      { tupleId: fullId, completionRule: "complete-roster", prefixOfTupleId: null, invocations: [leaf] },
      { tupleId: tuples[1].tupleId, completionRule: "complete-roster", prefixOfTupleId: null, invocations: [] },
      { tupleId: tuples[2].tupleId, completionRule: "registered-cap-prefix", prefixOfTupleId: fullId, invocations: withFinalState([leaf], "registered-cap") },
    ];
    return { tuples, rosters, capBindings: [{ tupleId: tuples[2].tupleId, invocationId: leaf.invocationId, conditionId: `cond-c0v-${prefix}-cap-cause`, observedValueSource: "capped-invocation-wall" }] };
  }
  if (packetId !== "c0v-radial-produce") return { tuples: [], rosters: [], capBindings: [] };
  const tuples = [
    tuple("radial-complete-pass", "production-complete", "pass", "production-complete", [1,1,1,1,1,0,1,1,1,4,1,3,1,1], "measured-sum", "must-be-null"),
    tuple("radial-complete-fail", "production-complete", "fail", "production-complete", [1,1,1,1,1,0,1,1,1,4,1,3,1,1], "measured-sum", "must-be-null"),
    tuple("radial-artifact-refusal", "preproduction-artifact-refusal", "refusal", "preproduction-artifact-refusal", [1,1,0,0,0,1,1,0,1,3,0,0,0,0], "exact-zero", "must-be-null"),
    tuple("radial-prelaunch-refusal", "prelaunch-resource-refusal", "refusal", "prelaunch-resource-refusal", [1,1,0,0,0,1,1,0,1,3,0,0,0,0], "exact-zero", "must-be-null"),
    tuple("radial-cap-production", "registered-cap-resource-refusal", "refusal", "registered-cap-production", [1,1,1,1,1,1,1,1,1,4,0,0,0,0], "measured-sum", "must-be-present"),
    tuple("radial-cap-evaluator", "registered-cap-resource-refusal", "refusal", "registered-cap-evaluator", [1,1,1,1,1,1,1,1,1,5,1,0,0,0], "measured-sum", "must-be-present"),
    tuple("radial-cap-nc-finite-shell", "registered-cap-resource-refusal", "refusal", "registered-cap-nc-finite-shell", [1,1,1,1,1,1,1,1,1,5,1,1,0,0], "measured-sum", "must-be-present"),
    tuple("radial-cap-nc-forged-summary", "registered-cap-resource-refusal", "refusal", "registered-cap-nc-forged-summary", [1,1,1,1,1,1,1,1,1,5,1,2,0,0], "measured-sum", "must-be-present"),
    tuple("radial-cap-nc-robin", "registered-cap-resource-refusal", "refusal", "registered-cap-nc-robin", [1,1,1,1,1,1,1,1,1,5,1,3,0,0], "measured-sum", "must-be-present"),
  ];
  const fullId = "radial-complete-pass";
  const rosters = tuples.map((entry) => {
    if (entry.tupleId === "radial-complete-pass" || entry.tupleId === "radial-complete-fail") return { tupleId: entry.tupleId, completionRule: "complete-roster", prefixOfTupleId: null, invocations: radialLeaves };
    if (entry.tupleId === "radial-artifact-refusal" || entry.tupleId === "radial-prelaunch-refusal") return { tupleId: entry.tupleId, completionRule: "complete-roster", prefixOfTupleId: null, invocations: [] };
    if (entry.tupleId.startsWith("radial-cap-")) {
      const capIndex = { "radial-cap-production": 0, "radial-cap-evaluator": 1, "radial-cap-nc-finite-shell": 2, "radial-cap-nc-forged-summary": 3, "radial-cap-nc-robin": 4 }[entry.tupleId];
      return { tupleId: entry.tupleId, completionRule: "registered-cap-prefix", prefixOfTupleId: fullId, invocations: withFinalState(radialLeaves.slice(0, capIndex + 1), "registered-cap") };
    }
    throw new Error(`unregistered radial tuple ${entry.tupleId}`);
  });
  const capBindings = [
    ["radial-cap-production", radialLeaves[0].invocationId, "cond-c0v-radial-cap-production"],
    ["radial-cap-evaluator", radialLeaves[1].invocationId, "cond-c0v-radial-cap-evaluator"],
    ["radial-cap-nc-finite-shell", radialLeaves[2].invocationId, "cond-c0v-radial-cap-nc-finite-shell"],
    ["radial-cap-nc-forged-summary", radialLeaves[3].invocationId, "cond-c0v-radial-cap-nc-forged-summary"],
    ["radial-cap-nc-robin", radialLeaves[4].invocationId, "cond-c0v-radial-cap-nc-robin"],
  ].map(([tupleId, invocationId, conditionId]) => ({ tupleId, invocationId, conditionId, observedValueSource: "capped-invocation-wall" }));
  return { tuples, rosters, capBindings };
}

function condition(conditionId, kind, comparator, registeredValue, unit, routeSelecting) { return { conditionId, kind, comparator, registeredValue, unit, routeSelecting }; }
function classificationConditions(packetId) {
  const packetResourcesAuthority = packetResources(packetId);
  const verificationCapConditions = verificationInvocationRoster(packetId).map((entry) =>
    condition(`cond-cap-${entry.invocationId.slice(4)}`, "wall-seconds", "greater-than", 14400, "seconds", true));
  const prelaunchConditions = [
    condition(`cond-${packetId}-prelaunch-free-space`, "available-bytes", "less-than", packetResourcesAuthority.minimumFreeBytes, "bytes", true),
    condition(`cond-${packetId}-prelaunch-process-hours`, "process-hours", "greater-than", packetResourcesAuthority.packageProcessHoursMaximum, "hours", true),
    condition(`cond-${packetId}-prelaunch-storage`, "retained-bytes", "greater-than", packetResourcesAuthority.retainedStorageBytesMaximum, "bytes", true),
  ];
  if (packetId === "c0v-moving-produce") return [...prelaunchConditions, ...verificationCapConditions,
    condition("cond-c0v-moving-cap-cause", "wall-seconds", "greater-than", 14400, "seconds", true),
    condition("cond-c0v-moving-claim-boundary", "lifecycle-classification", "classified-as", "discrepancy-recording-only", "classification", false),
    condition("cond-c0v-moving-code-import-receipt", "artifact-presence", "present", true, null, false),
    condition("cond-c0v-moving-disposition", "reference-disposition", "equal", "reference-discrepancy-refusal", "disposition", true),
    condition("cond-c0v-moving-expected-outcome", "reference-check-outcome", "equal", "pass", "outcome", true),
    condition("cond-c0v-moving-independent-errors-present", "artifact-presence", "equal", true, null, true),
    condition("cond-c0v-moving-observed-outcome", "reference-check-outcome", "equal", "fail", "outcome", true),
    condition("cond-c0v-moving-reference-identity", "artifact-identity", "identity-equal", layerArtifacts.moving[1], "artifact-identity", true),
    condition("cond-c0v-moving-science-protocol-identity", "artifact-identity", "identity-equal", layerArtifacts.moving[0], "artifact-identity", true),
  ];
  if (packetId === "c0v-static-produce") return [...prelaunchConditions, ...verificationCapConditions,
    condition("cond-c0v-static-cap-cause", "wall-seconds", "greater-than", 14400, "seconds", true),
    condition("cond-c0v-static-attempted-routes", "refusal-ground", "classified-as", "exact-attempted-route-roster", "classification", true),
    condition("cond-c0v-static-claim-boundary", "lifecycle-classification", "classified-as", "preimplementation-refusal-only", "classification", false),
    condition("cond-c0v-static-code-import-receipt", "artifact-presence", "present", true, null, false),
    condition("cond-c0v-static-independent-check", "reference-check-outcome", "equal", "pass", "outcome", true),
    condition("cond-c0v-static-reason-code", "refusal-ground", "classified-as", "pinned-preimplementation-refusal", "reason-code", true),
    condition("cond-c0v-static-refusal-identity", "artifact-identity", "identity-equal", layerArtifacts.static[1], "artifact-identity", true),
    condition("cond-c0v-static-science-protocol-identity", "artifact-identity", "identity-equal", layerArtifacts.static[0], "artifact-identity", true),
    condition("cond-c0v-static-zero-execution", "lifecycle-classification", "equal", true, "classification", true),
  ];
  if (packetId !== "c0v-radial-produce") return [...prelaunchConditions, ...verificationCapConditions];
  return [...prelaunchConditions, ...verificationCapConditions,
    condition("cond-c0v-radial-artifact-precondition-failed", "artifact-filesystem-policy", "not-equal", "regular-single-link-unaliased", "classification", true),
    condition("cond-c0v-radial-cap-evaluator", "wall-seconds", "greater-than", 14400, "seconds", true),
    condition("cond-c0v-radial-cap-nc-finite-shell", "wall-seconds", "greater-than", 14400, "seconds", true),
    condition("cond-c0v-radial-cap-nc-forged-summary", "wall-seconds", "greater-than", 14400, "seconds", true),
    condition("cond-c0v-radial-cap-nc-robin", "wall-seconds", "greater-than", 14400, "seconds", true),
    condition("cond-c0v-radial-cap-production", "wall-seconds", "greater-than", 300, "seconds", true),
    condition("cond-c0v-radial-negative-control-campaign", "negative-control-outcome", "not-equal", "pass", "outcome", true),
    condition("cond-c0v-radial-process-exit-corroboration", "process-exit", "not-equal", 0, "exit-code", false),
    condition("cond-c0v-radial-production-complete", "lifecycle-classification", "classified-as", "production-complete", "classification", true),
    condition("cond-c0v-radial-reference-disposition", "reference-disposition", "equal", "reference-frozen", "disposition", true),
    condition("cond-c0v-radial-reference-identity", "artifact-identity", "identity-equal", layerArtifacts.radial[1], "artifact-identity", true),
    condition("cond-c0v-radial-science-protocol-identity", "artifact-identity", "identity-equal", layerArtifacts.radial[0], "artifact-identity", true),
  ];
}

const preflightObservedFields = ["launchClass", "executionMode", "selectedRouteId", "branch", "head", "runtime", "command", "cwd", "repositoryBundleRoot", "compositeMatrix", "packetCatalogue", "successorSchemaRegistry", "evidenceManifest", "scienceProtocol", "referenceOrRefusal", "packetProtocol", "callableRegistry", "codeFreeze", "registeredAttemptRoot", "attemptDirectory", "candidateDirectory", "stdoutPath", "stderrPath", "exitStatusPath", "packageLockPath", "lockPath", "finalPreflightReceiptPath", "finalTerminalReceiptPath", "verificationPaths", "dependencyPacketIds", "dependencyArtifacts", "resources", "ancestry"];
const preflightResourceFields = ["requiredRuntime", "processConcurrency", "solverProcessConcurrency", "solverWorkerTimeoutSeconds", "perExecutableControlInvocationWallHoursMaximum", "outerInfrastructureOrchestrationAllowanceSeconds", "outerInfrastructureSafetyTimeoutSeconds", "outerInfrastructureTimingRule", "packageElapsedNanosecondsMaximum", "packageProcessHoursMaximum", "currentPacketRegisteredElapsedNanosecondsMaximum", "currentPacketRegisteredProcessHoursMaximum", "attemptRootWritePolicy", "transientCopyAccounting", "filesystemObjectPolicy", "publicationTransitionPolicy", "lockLifetimePolicy", "lockAcquisitionPolicy", "packageStorageAccountingRule", "packageStorageBaselineArtifacts", "packageStorageBaselineBytes", "retainedStorageBytesMaximum", "projectedScratchBytes", "projectedPublicationBytes", "publicationFinalizationProjections", "minimumFreeBytes", "packageElapsedNanosecondsBeforeAttempt", "projectedPackageElapsedNanosecondsAfterAttempt", "packageProcessHoursBeforeAttempt", "projectedPackageProcessHoursAfterAttempt", "packageRetainedBytesBeforeAttempt", "projectedPackageBytesAfterAttempt", "observedFreeBytes", "automaticRetry", "automaticRefinementOrFanOut", "nasOrNetworkAccess"];
const ancestryFields = ["repositoryClean", "headMatchesLaunch", "requiredCommitsAreAncestors", "boundArtifactsMatch", "codeFreezeMatches", "verdict", "errors"];
const workerProgressContract = {
  schema: "phase10-c0v-worker-progress-contract-v1", filename: "worker-progress.jsonl", rowSchema: "phase10-c0v-worker-progress-row-v1",
  exactFields: ["schema", "sequence", "observedAt", "event", "invocationId", "caseId", "startedCaseIds", "completedCaseIds", "activeCaseId", "completedNumericFieldValueCount", "completedUniformFieldValueCount", "candidateByteLength", "candidateSha256", "terminalState"],
  eventValues: ["worker-started", "invocation-started", "case-started", "case-completed", "invocation-finished", "worker-stopped"],
  eventStateTransitions: [
    { transitionId: "worker-started", event: "worker-started", positionRule: "first-record-only", invocationRule: "invocation-id-null", caseRule: "case-and-active-null-empty-prefixes", terminalStateValues: ["running"], progressRule: "zero-counts-zero-candidate" },
    { transitionId: "invocation-started", event: "invocation-started", positionRule: "next-unfinished-protocol-invocation", invocationRule: "exact-open-invocation-id", caseRule: "case-id-null-progress-unchanged", terminalStateValues: ["running"], progressRule: "candidate-state-monotone" },
    { transitionId: "case-started", event: "case-started", positionRule: "inside-solver-production-only", invocationRule: "exact-open-solver-production-id", caseRule: "append-next-case-to-started-and-set-active", terminalStateValues: ["running"], progressRule: "completed-counts-unchanged" },
    { transitionId: "case-completed", event: "case-completed", positionRule: "inside-solver-production-only", invocationRule: "exact-open-solver-production-id", caseRule: "append-active-case-to-completed-and-clear-active", terminalStateValues: ["running"], progressRule: "counts-advance-by-completed-case-node-count" },
    { transitionId: "invocation-finished", event: "invocation-finished", positionRule: "closes-exact-open-invocation", invocationRule: "same-open-invocation-id", caseRule: "case-id-null-started-completed-active-and-cumulative-progress-preserved", terminalStateValues: ["complete", "registered-cap", "infrastructure-failure"], progressRule: "candidate-state-monotone" },
    { transitionId: "worker-stopped", event: "worker-stopped", positionRule: "final-record-only", invocationRule: "invocation-id-null-no-open-invocation", caseRule: "case-id-null-started-completed-active-and-cumulative-progress-preserved", terminalStateValues: ["complete", "registered-cap", "infrastructure-failure"], progressRule: "terminal-state-matches-final-invocation-and-candidate-state" },
  ],
  caseOrder: ["radial-dr-0p7um", "radial-dr-0p35um", "radial-dr-0p175um", "radial-dr-0p0875um"],
  completedFieldValueCounts: [21,40,80,159], writer: "parent-executor-from-structured-child-messages", sequenceRule: "zero-based-contiguous", timestampRule: "canonical-millisecond-utc-nondecreasing-within-attempt", prefixRule: "started-and-completed-case-lists-are-exact-roster-prefixes", countRule: "numeric-and-uniform-counts-equal-sum-of-completed-case-node-counts", candidateRule: "zero-and-null-until-exact-retained-candidate-exists", embeddedRule: "compact-jsonl-lf-reserialization-matches-artifact-identity",
};

const workerInvocationContract = {
  schema: "phase10-c0v-worker-invocation-contract-v1",
  filename: "worker-invocations.jsonl",
  rowSchema: "phase10-c0v-worker-invocation-row-v1",
  exactFields: ["schema", "sequence", "observedAt", "monotonicOffsetNanoseconds", "event", "invocationId", "callableId", "negativeControlId", "invocationClass", "registeredWallSecondsMaximum", "terminalState"],
  eventValues: ["worker-started", "invocation-started", "invocation-finished", "worker-stopped"],
  eventStateTransitions: [
    { transitionId: "worker-started", event: "worker-started", positionRule: "first-record-only", invocationRule: "all-invocation-fields-null", terminalStateValues: ["running"] },
    { transitionId: "invocation-started", event: "invocation-started", positionRule: "next-unfinished-protocol-invocation", invocationRule: "exact-open-protocol-invocation", terminalStateValues: ["running"] },
    { transitionId: "invocation-finished", event: "invocation-finished", positionRule: "closes-exact-open-invocation", invocationRule: "same-open-protocol-invocation", terminalStateValues: ["complete", "registered-cap", "infrastructure-failure"] },
    { transitionId: "worker-stopped", event: "worker-stopped", positionRule: "final-record-only", invocationRule: "all-invocation-fields-null-no-open-invocation", terminalStateValues: ["complete", "registered-cap", "infrastructure-failure"] },
  ],
  writer: "parent-executor-from-structured-child-messages",
  sequenceRule: "zero-based-contiguous",
  timestampRule: "canonical-millisecond-utc-nondecreasing-within-attempt",
  monotonicClockRule: "parent-owned-zero-based-safe-integer-nanoseconds-nondecreasing",
  durationRule: "elapsed-nanoseconds-from-invocation-offset-difference-wall-seconds-derived-only-from-elapsed",
  rosterRule: "exact-protocol-leaf-roster-or-registered-prefix",
  embeddedDerivationRule: "attempt-or-verification-records-derived-from-raw-parent-events",
};

const exitStatusContract = {
  schema: "phase10-c0v-exit-status-contract-v1",
  filename: "exit-status.json",
  rowSchema: "phase10-c0v-exit-status-v1",
  exactFields: ["schema", "packetId", "attemptId", "workerProcessInvocationCount", "workerStarted", "exitCode", "signal", "classification"],
  classificationValues: ["no-worker", "complete", "registered-cap", "infrastructure-failure"],
  exitCodeRule: "no-worker-both-null-worker-exactly-one-code-or-signal",
  signalRule: "raw-child-signal-never-route-selecting",
  ownership: "parent-executor",
};

const freezeEvaluationContract = {
  schema: "phase10-c0v-s6-freeze-evaluation-contract-v1",
  filename: "freeze-evaluation.json",
  rowSchema: "phase10-c0v-s6-freeze-evaluation-v1",
  evaluationIdRule: "freeze-packet-registered-attempt-v1",
  exactFields: ["schema", "evaluationId", "packetId", "attemptId", "protocol", "preflight", "implementationFreezeCommit", "launchHead", "launchBranch", "anchorPaths", "artifacts", "parserRuntimeArtifacts", "artifactFailure", "invokedCheckIds", "verdict", "reasons"],
  artifactFailureExactFields: ["artifactRole", "expected", "observed", "filesystemObservation", "failureClass"],
  artifactFailureRule: "null-except-radial-preproduction-artifact-refusal",
  verdictRule: "pass-means-freeze-and-selected-artifact-observation-independently-rederived",
  constructionRule: "immutable-before-terminal-candidate-no-overwrite",
};

const causeEvaluationContract = {
  schema: "phase10-c0v-s6-cause-evaluation-contract-v1",
  filename: "cause-evaluation.json",
  rowSchema: "phase10-c0v-s6-cause-evaluation-v1",
  evaluationIdRule: "cause-packet-registered-attempt-subroute-v1",
  exactFields: ["schema", "evaluationId", "packetId", "attemptId", "selectedSubrouteId", "dispositionCode", "protocol", "preflight", "exitStatus", "workerInvocations", "classificationConditionIds", "observations", "evidence", "evaluatorCallableId", "invokedCheckIds", "verdict", "reasons"],
  observationExactFields: ["conditionId", "kind", "comparator", "registeredValue", "observedValue", "unit", "routeConditionMatched", "preconditionPassed", "evidenceIds"],
  evidenceExactFields: ["evidenceId", "evidenceRole", "retentionClass", "artifact", "inlineObservationPath"],
  workerInvocationsRule: "null-iff-worker-process-count-zero-otherwise-exact-attempt-local-identity",
  selectionRule: "exact-terminal-subroute-condition-roster-and-raw-observations",
  evidenceRule: "condition-specific-tracked-identities-or-inline-observations-no-self-identity",
  routeRule: "cross-route-extra-missing-or-relabelled-observation-refuses",
  constructionRule: "immutable-before-terminal-candidate-no-overwrite",
};

function terminalCandidateContractFor(packetId, authority, subroutes) {
  const tupleById = new Map(authority.tuples.map((entry) => [entry.tupleId, entry]));
  const layer = packetLayer(packetId);
  const freezeCheckId = layer ? `chk-c0v-${layer}-freeze-ancestry` : null;
  const decisionsFor = (subroute) => {
    const tupleEntry = tupleById.get(subroute.subrouteId);
    const decisions = [];
    if (freezeCheckId && subroute.requiredCheckIds.includes(freezeCheckId)) {
      decisions.push({
        decisionRole: "freeze",
        fieldName: "freezeDecision",
        decisionId: `decision-${packetId}-${subroute.subrouteId}-freeze-v1`,
        evaluatorCallableId: "phase10-c0v-s6-freeze-evaluator",
        invokedCheckIds: [freezeCheckId],
        expectedVerdict: "pass",
        evidence: [{evidenceRole:"freeze-evaluation",artifactRelativePath:"freeze-evaluation.json"}],
      });
    }
    const causeRequired = subroute.dispositionCode !== null && subroute.dispositionCode !== "production-complete";
    if (causeRequired) {
      let evaluatorCallableId = "phase10-c0v-s6-refusal-evaluator";
      if (packetId === "c0v-moving-produce" &&
        tupleEntry.dispositionCode === "reference-discrepancy-refusal") {
        evaluatorCallableId = "phase10-c0v-moving-evaluator";
      } else if (packetId === "c0v-static-produce" &&
        tupleEntry.dispositionCode === "preimplementation-reference-refusal") {
        evaluatorCallableId = "phase10-c0v-static-refusal-evaluator";
      }
      const invokedCheckIds = subroute.requiredCheckIds.filter((checkId) => {
        const check = matrix.checks.find((entry) => entry.checkId === checkId);
        return check && check.independentEvaluatorCallableId === evaluatorCallableId;
      });
      decisions.push({
        decisionRole: "cause",
        fieldName: "causeDecision",
        decisionId: `decision-${packetId}-${subroute.subrouteId}-cause-v1`,
        evaluatorCallableId,
        invokedCheckIds,
        expectedVerdict: "pass",
        evidence: [{evidenceRole:"cause-evaluation",artifactRelativePath:"cause-evaluation.json"}],
      });
    }
    return decisions;
  };
  return {
  schema: "phase10-c0v-terminal-candidate-contract-v1",
  rowSchema: "phase10-c0v-terminal-candidate-v1",
  successFilename: "terminal-success-candidate.json",
  exactFields: ["schema", "packetId", "attemptId", "selectedSubrouteId", "dispositionCode", "preflight", "exitStatus", "producedOutputIds", "executedCheckIds", "executedNegativeControlIds", "callerInvocationResults", "freezeDecision", "causeDecision", "verdict", "reasons"],
  decisionExactFields: ["decisionId", "evaluatorCallableId", "invokedCheckIds", "verdict", "reasons", "evidence"],
  decisionEvidenceExactFields: ["evidenceRole", "artifact"],
  decisionRosters: subroutes.map((subroute) => ({
    subrouteId: subroute.subrouteId,
    candidateFilename: "terminal-success-candidate.json",
    candidateVerdict: "accepted-route-candidate",
    candidateProducedOutputIds: subroute.requiredOutputIds.filter((outputId) =>
      !outputId.endsWith("-attempt-ledger") && !outputId.endsWith("-verification") &&
      !outputId.endsWith("-terminal-receipt")),
    candidateExecutedCheckIds: subroute.requiredCheckIds.filter((checkId) =>
      !checkId.endsWith("-attempt-census") && !checkId.endsWith("-resource-boundary")),
    candidateExecutedNegativeControlIds: subroute.requiredNegativeControlIds,
    candidateReasonCodes: [],
    candidateCallerInvocationIds: [],
    decisions: decisionsFor(subroute),
  })),
  verdictRule: "accepted-route-candidate-for-every-current-materializable-subroute",
  forbiddenFields: ["attemptLedger", "packetVerification", "terminalReceipt"],
  constructionRule: "immutable-preledger-candidate-no-overwrite",
  };
};

function terminalReceiptContractFor(packetId, authority, subroutes, candidateContract) {
  const packet = matrix.packets.find((entry) => entry.packetId === packetId);
  const preflightOutputId = packet.outputIds.find((entry) => entry.endsWith("-preflight"));
  const candidateById = new Map(candidateContract.decisionRosters.map((entry) => [entry.subrouteId, entry]));
  const outputSource = (outputId) => ({
    artifactRole: `output:${outputId}`,
    sourceKind: "registered-output",
    outputId,
    artifactRelativePath: null,
  });
  const internalSource = (relativePath) => ({
    artifactRole: `internal:${relativePath}`,
    sourceKind: "attempt-internal",
    outputId: null,
    artifactRelativePath: relativePath,
  });
  const resultSources = (subroute, evaluatorCallableId, terminalState) => {
    const sources = [outputSource(preflightOutputId)];
    if (terminalState === "child-registered-cap") {
      sources.push(internalSource("worker-invocations.jsonl"));
      if (packetId === "c0v-radial-produce") sources.push(internalSource("worker-progress.jsonl"));
      return sources;
    }
    if (evaluatorCallableId === "phase10-c0v-s6-freeze-evaluator") {
      sources.push(internalSource("freeze-evaluation.json"));
    } else if (evaluatorCallableId === "phase10-c0v-s6-attempt-census-evaluator" ||
      evaluatorCallableId === "phase10-c0v-s6-resource-evaluator") {
      sources.push(internalSource("terminal-success-candidate.json"));
      const attemptLedgerId = subroute.requiredOutputIds.find((entry) => entry.endsWith("-attempt-ledger"));
      if (attemptLedgerId) sources.push(outputSource(attemptLedgerId));
    } else if (evaluatorCallableId === "phase10-c0v-s6-refusal-evaluator" ||
      evaluatorCallableId === "phase10-c0v-moving-evaluator" ||
      evaluatorCallableId === "phase10-c0v-static-refusal-evaluator") {
      sources.push(internalSource("cause-evaluation.json"));
    } else {
      const candidate = candidateById.get(subroute.subrouteId);
      for (const outputId of candidate.candidateProducedOutputIds) {
        if (outputId !== preflightOutputId) sources.push(outputSource(outputId));
      }
      if (packetId === "c0v-aggregate") {
        sources.push(internalSource("any-layer-nonpass-control.json"));
      }
    }
    return [...new Map(sources.map((entry) => [entry.artifactRole, entry])).values()];
  };
  const capInvocationFor = (subroute) => {
    if (subroute.dispositionCode !== "registered-cap-resource-refusal") return null;
    if (packetId.endsWith("-produce")) {
      const binding = authority.capBindings.find((entry) => entry.tupleId === subroute.subrouteId);
      const roster = authority.rosters.find((entry) => entry.tupleId === subroute.subrouteId);
      return binding && roster ? roster.invocations.find((entry) => entry.invocationId === binding.invocationId) : null;
    }
    const binding = verificationRegisteredCapBindings(packetId).find((entry) =>
      subroute.subrouteId === `${packetId}-registered-cap-${entry.invocationId.slice(4)}`);
    return binding ? verificationInvocationRoster(packetId).find((entry) => entry.invocationId === binding.invocationId) : null;
  };
  const capCallerFor = (subroute) => {
    const capped = capInvocationFor(subroute);
    if (!capped) return null;
    if (packetId === "c0v-radial-produce" && capped.invocationClass !== "solver-production") {
      return ["phase10-c0v-radial-produce-check-caller", "phase10-c0v-radial-evaluator"];
    }
    if (packetId === "c0v-moving-produce") {
      return ["phase10-c0v-moving-produce-check-caller", "phase10-c0v-moving-evaluator"];
    }
    if (packetId === "c0v-static-produce") {
      return ["phase10-c0v-static-produce-check-caller", "phase10-c0v-static-refusal-evaluator"];
    }
    const byCaller = matrix.checks.find((entry) => entry.callerCallableId === capped.callableId);
    return byCaller ? [byCaller.callerCallableId, byCaller.independentEvaluatorCallableId] : null;
  };
  const stageRank = (checkId) => checkId.endsWith("freeze-ancestry") ? 0
    : checkId.endsWith("attempt-census") ? 20
      : checkId.endsWith("resource-boundary") ? 30
        : 10;
  const mainCallerIds = new Set([
    "phase10-a-p-c0v-s6-check-caller",
    "phase10-c0v-radial-produce-check-caller",
    "phase10-c0v-moving-publish-check-caller",
    "phase10-c0v-radial-publish-check-caller",
    "phase10-c0v-static-publish-check-caller",
    "phase10-c0v-aggregate-check-caller",
  ]);
  const callerInvocationResultRosters = subroutes.map((subroute) => {
    const groups = new Map();
    for (const checkId of subroute.requiredCheckIds) {
      const check = matrix.checks.find((entry) => entry.checkId === checkId);
      if (!check) throw new Error(`missing check authority ${checkId}`);
      const key = `${check.callerCallableId}\0${check.independentEvaluatorCallableId}`;
      const existing = groups.get(key);
      if (existing) existing.checkIds.push(checkId);
      else groups.set(key, {
        callerCallableId: check.callerCallableId,
        evaluatorCallableId: check.independentEvaluatorCallableId,
        checkIds: [checkId],
        rank: stageRank(checkId),
        terminalState: "complete",
      });
    }
    const rows = [...groups.values()].sort((left, right) =>
      left.rank - right.rank || left.checkIds[0].localeCompare(right.checkIds[0]));
    const cappedCaller = capCallerFor(subroute);
    if (cappedCaller) {
      const insertion = rows.findIndex((entry) => entry.rank >= 10);
      rows.splice(insertion < 0 ? rows.length : insertion, 0, {
        callerCallableId: cappedCaller[0],
        evaluatorCallableId: cappedCaller[1],
        checkIds: [],
        rank: 10,
        terminalState: "child-registered-cap",
      });
    }
    const callerInvocationResults = rows.map((entry, index) => ({
      callerInvocationId: `caller-${subroute.subrouteId}-${index + 1}`,
      stage: entry.rank >= 20 ? "post-candidate" : "pre-candidate",
      callerCallableId: entry.callerCallableId,
      evaluatorCallableId: entry.evaluatorCallableId,
      terminalState: entry.terminalState,
      executedCheckIds: entry.checkIds,
      evaluatedCheckIds: entry.checkIds,
      executedNegativeControlIds: entry.terminalState === "complete" && mainCallerIds.has(entry.callerCallableId)
        ? subroute.requiredNegativeControlIds
        : [],
      evaluatorResultRule: entry.terminalState === "complete"
        ? "canonical-rerun-exact"
        : "null-child-registered-cap",
      sourceArtifactAuthorities: resultSources(subroute, entry.evaluatorCallableId, entry.terminalState),
    }));
    return { subrouteId: subroute.subrouteId, callerInvocationResults };
  });
  return {
    schema: "phase10-c0v-s6-terminal-receipt-contract-v1",
    receiptSchema: "phase10-c0v-s6-terminal-receipt-v2",
    receiptIdRule: "phase10-packet-attempt-terminal-v2",
    constructionOrder: "terminal-candidate-then-ledger-then-verification-then-final-terminal",
    radialValidatedRefusalCreditRule: "artifact-prelaunch-and-five-cap-refusals-require-verification-and-dependency-credit",
    makerReturnRule: "moving-static-route-cap-and-nonproduce-cap-have-null-verification-zero-credit",
    infrastructureFailStopRule: "retain-ignored-root-and-lock-no-candidate-ledger-verification-or-final-receipt-successor-required",
    callerInvocationResultExactFields: ["callerInvocationId", "stage", "callerCallableId", "evaluatorCallableId", "terminalState", "executedCheckIds", "evaluatedCheckIds", "executedNegativeControlIds", "evaluatorResult", "sourceArtifactIdentities"],
    callerResultSourceIdentityExactFields: ["artifactRole", "artifact"],
    callerInvocationResultRosters,
    callerResultRule: "candidate-prestage-subsequence-verification-full-rerun-terminal-exact-copy",
  };
}

const radialBinaryLayout = {
  magic: "C0VRAD01", formatVersion: 1, endiannessMarker: 16909060, schemaId: "phase10-c0v-radial-witness-v1", schemaByteLength: 29, headerByteLength: 153, payloadByteLength: 5738, fileByteLength: 5891, protocolDigestSource: "s5-science-protocol", referenceDigestSource: "s5-reference",
  producerEvaluatorSharedRuntimeClosurePaths: ["runner/src/gate4-evidence.ts", "runner/src/phase10-c0v-contracts.ts", "runner/src/phase10-c0v-s6-contracts.ts", "runner/src/phase10-c0v-s6-execution-contracts.ts"],
  headerOffsets: { magic:[0,8], formatVersion:[8,12], endiannessMarker:[12,16], schemaByteLength:[16,20], schema:[20,49], protocolSha256:[49,81], referenceSha256:[81,113], payloadByteLength:[113,121], payloadSha256:[121,153], payload:[153,5891] },
  globalFloatNames: ["radiusM", "farRadiusM", "sigmaInfinity", "tempC", "pressurePa", "alphaHKConst", "kBoltzmannJPerK", "celsiusZeroK", "waterMoleculeMassKg", "iceNumberDensityPerM3", "diffusivityAir1AtmM2S", "standardAtmospherePa", "saturationPressurePrefactorMbar", "saturationPressureExponentK", "mbarToPa", "temperatureK", "saturationPressurePa", "saturationNumberDensityPerM3", "diffusivityM2S", "thermalSpeedMS", "kineticVelocityMS", "kineticLengthM"],
  caseOrder: workerProgressContract.caseOrder, caseNodeCounts:[21,40,80,159], caseScalarNames:["requestedSpacingM", "actualSpacingM", "sigmaSurface", "sigmaShell", "growthVelocityKineticMS", "growthVelocityFluxMS", "surfaceGradientPerM", "robinLeft", "robinRight", "robinResidual", "uniformSigmaSurface", "uniformSigmaShell", "uniformGrowthVelocityKineticMS", "uniformGrowthVelocityFluxMS", "uniformSurfaceGradientPerM", "uniformRobinLeft", "uniformRobinRight", "uniformRobinResidual"], caseRecordByteLengths:[523,828,1469,2734], payloadPrefixByteLength:184, recordByteLengthPrefixPresent:false, numericEncoding:"float64-le-finite-no-negative-zero", exactZeroEncoding:"positive-zero", trailingBytesAllowed:false,
};
const radialSummary = { schema:"phase10-c0v-radial-producer-summary-v1", authority:"non-authoritative", exactFields:["schema", "authority", "caseCount", "totalNumericFieldValues", "totalUniformFieldValues", "allFinite", "reportedDisposition", "reportedMaximum"], caseCount:4, totalNumericFieldValues:300, totalUniformFieldValues:300, reportedMaximumRule:"maximum-absolute-stored-robin-residual-without-reference-comparison", evaluatorUse:"inventory-and-parse-only-never-metrics-or-verdict" };
const radialControls = [
  { negativeControlId:"nc-radial-finite-shell-term", operator:"coherent-first-case-missing-shell-constant", invariantBindings:["all-other-cases-unchanged", "global-operands-unchanged", "reference-identity-unchanged", "uniform-records-unchanged"], expected:"independent-radial-evaluator-fail" },
  { negativeControlId:"nc-radial-forged-summary", operator:"flip-external-summary-disposition-and-set-maximum-one", invariantBindings:["reference-identity-unchanged", "witness-bytes-unchanged", "witness-digest-unchanged"], expected:"clean-independent-evaluation-identical" },
  { negativeControlId:"nc-radial-robin-coefficient", operator:"coherent-all-numeric-cases-half-robin-coefficient", invariantBindings:["global-operands-unchanged", "header-bindings-unchanged", "reference-identity-unchanged", "uniform-records-unchanged"], expected:"independent-radial-evaluator-fail" },
];
const aggregateNegativeControlContract = {
  schema: "phase10-c0v-any-layer-nonpass-control-contract-v1",
  filename: "any-layer-nonpass-control.json",
  rowSchema: "phase10-c0v-any-layer-nonpass-control-v1",
  exactFields: ["schema", "negativeControlId", "ownerCheckId", "callableId", "cleanTable", "mutatedLayerId", "mutatedTable", "mutation", "cleanOutcome", "attackedOutcome", "result"],
  mutationExactFields: ["field", "before", "after", "changedRowCount", "otherRowsUnchanged"],
  outcomeExactFields: ["aggregateStatus", "packageCompletionEligible", "dependentQualificationBlocked"],
  resultExactFields: ["negativeControlId", "mutationExecuted", "witnessMoved", "cleanCapturePreserved", "attackedCheckFailed", "pass"],
  mutationRule: "three-row-all-independent-pass-radial-scientific-disposition-pass-to-refusal-only",
  reproofRule: "producer-embeds-result-only-verifier-rederives-full-receipt-and-exact-compares",
};

function packetLayer(packetId) { return packetId.includes("moving") ? "moving" : packetId.includes("radial") ? "radial" : packetId.includes("static") ? "static" : null; }
function packetResources(packetId) {
  const layer = packetLayer(packetId);
  const produce = packetId.endsWith("-produce");
  const values = produce && layer === "moving" ? [33554432,8388608,134217728] : produce && (layer === "radial" || layer === "static") ? [8388608,2097152,67108864] : [16777216,4194304,67108864];
  const cataloguePacket = catalogue.packets.find((entry) => entry.packetId === packetId);
  if (!cataloguePacket) throw new Error(`missing catalogue packet ${packetId}`);
  if (values[0] !== cataloguePacket.maximumStdoutBytes +
    cataloguePacket.maximumOtherAttemptRootBytes) {
    throw new Error(`non-stderr scratch split differs for ${packetId}`);
  }
  const projectedScratchBytes = cataloguePacket.maximumStdoutBytes +
    catalogue.workerTransportContract.maximumStderrBytes +
    cataloguePacket.maximumOtherAttemptRootBytes;
  const registeredSeconds = {"a-p-c0v-s6":57600,"c0v-moving-produce":14400,"c0v-moving-publish":28800,"c0v-radial-produce":57900,"c0v-radial-publish":28800,"c0v-static-produce":14400,"c0v-static-publish":28800,"c0v-aggregate":43200}[packetId];
  const registeredElapsedNanoseconds = registeredSeconds * 1000000000;
  const registeredHours = registeredElapsedNanoseconds / 3600000000000;
  const verificationPath = allowedPaths(packetId).find((entry) => entry.endsWith(`/${cataloguePacket.verificationFilename}`));
  if (!verificationPath) throw new Error(`missing verification publication path ${packetId}`);
  const attemptId = `${packetId}-20260822-v1`;
  return { requiredRuntime:"Node v24.13.1", solverWorkerTimeoutSeconds:packetId === "c0v-radial-produce" ? 300 : null, perExecutableControlInvocationWallHoursMaximum:4, outerInfrastructureOrchestrationAllowanceSeconds:3600, outerInfrastructureSafetyTimeoutSeconds:registeredSeconds+3600, outerInfrastructureTimingRule:"parent-monotonic-nanoseconds-limit-plus-one-millisecond-fail-stop-stale-lock-invalidates-claims", packageElapsedNanosecondsMaximum:86400000000000, packageProcessHoursMaximum:24, currentPacketRegisteredElapsedNanosecondsMaximum:registeredElapsedNanoseconds, currentPacketRegisteredProcessHoursMaximum:registeredHours, attemptRootWritePolicy:"exclusive-create-append-only-no-delete-no-overwrite", transientCopyAccounting:"all-physical-staging-copies-counted", filesystemObjectPolicy:"regular-file-single-link-unaliased-parent", publicationTransitionPolicy:"registered-stage-to-final-hardlink-window-no-credit-final-single-link", lockLifetimePolicy:"held-through-awaited-worker-and-rejected-action-until-governed-recovery", lockAcquisitionPolicy:"compiled-package-then-packet-before-authority-read-stale-global-halts-all", packageStorageAccountingRule:"physical-path-copies-no-content-deduplication", packageStorageBaselineArtifacts, packageStorageBaselineBytes:1629577, processConcurrency:1, solverProcessConcurrency:packetId === "c0v-radial-produce" ? 1 : 0, retainedStorageBytesMaximum:68719476736, projectedScratchBytes, projectedPublicationBytes:values[1], publicationFinalizationProjections:[{artifactRole:"packet-verification",path:verificationPath,stagingPath:`${verificationPath}.stage-${attemptId}`,maximumByteLength:524288},{artifactRole:"terminal-receipt",path:cataloguePacket.terminalReceiptPath,stagingPath:`${cataloguePacket.terminalReceiptPath}.stage-${attemptId}`,maximumByteLength:131072}], minimumFreeBytes:values[2], automaticRetry:false, automaticRefinementOrFanOut:false };
}
function route(packetId) {
  const layer = packetLayer(packetId);
  if (!layer) return [null,null];
  if (layer === "moving") return ["route-c0v-moving-discrepancy-match-only", "reference-discrepancy-refusal"];
  if (layer === "radial") return ["route-c0v-radial-independent-reference", "reference-frozen"];
  return ["route-c0v-static-preimplementation-refusal", "reference-refusal"];
}
function executionMode(packetId) { if(packetId === "a-p-c0v-s6")return "supplemental-ap";if(packetId === "c0v-aggregate")return "aggregate";if(packetId.endsWith("-publish"))return "layer-publish";if(packetId === "c0v-radial-produce")return "radial-production";if(packetId === "c0v-moving-produce")return "discrepancy-match-only";return "preimplementation-refusal"; }
function allowedTerminalClasses(packetId) { if(packetId === "c0v-radial-produce")return ["packet-resource-refusal","scientific-fail","scientific-pass","scientific-refusal"];if(packetId.endsWith("-produce"))return ["packet-resource-refusal","scientific-refusal"];return ["packet-resource-refusal","structural-complete"]; }
function candidateNames(packetId, tupleEntry) { if(packetId === "c0v-radial-produce")return tupleEntry.dispositionCode === "production-complete" ? ["c0v-radial-attempts.jsonl","c0v-radial-evaluation.json","c0v-radial-witness.bin"] : ["c0v-radial-attempts.jsonl"];return {"a-p-c0v-s6":["artifact-index.json","missing-producer.json","uncalled-check.json"],"c0v-moving-produce":["c0v-moving-attempts.jsonl"],"c0v-moving-publish":["c0v-moving-artifact-index.json","c0v-moving-result.json"],"c0v-radial-publish":["c0v-radial-artifact-index.json","c0v-radial-result.json"],"c0v-static-produce":["c0v-static-attempts.jsonl"],"c0v-static-publish":["c0v-static-artifact-index.json","c0v-static-result.json"],"c0v-aggregate":["c0v-aggregate.json","c0v-artifact-index.json","c0v-resource-ledger.json","c0v-terminal-table.json"]}[packetId]; }
function allowedPaths(packetId) { const c=catalogue.packets.find((entry)=>entry.packetId===packetId);const payload={"a-p-c0v-s6":["evidence/phase10-obligation-preflight-v2/artifact-index.json","evidence/phase10-obligation-preflight-v2/missing-producer.json","evidence/phase10-obligation-preflight-v2/uncalled-check.json","evidence/phase10-obligation-preflight-v2/verification.json"],"c0v-moving-produce":["evidence/phase10-numerical-verification-v1/c0v-moving-attempts.jsonl",`evidence/phase10-obligation-preflight-v2/packets/${packetId}/verification.json`],"c0v-moving-publish":["evidence/phase10-numerical-verification-v1/c0v-moving-artifact-index.json","evidence/phase10-numerical-verification-v1/c0v-moving-publish-verification.json","evidence/phase10-numerical-verification-v1/c0v-moving-result.json"],"c0v-radial-produce":["evidence/phase10-numerical-verification-v1/c0v-radial-attempts.jsonl","evidence/phase10-numerical-verification-v1/c0v-radial-evaluation.json","evidence/phase10-numerical-verification-v1/c0v-radial-witness.bin",`evidence/phase10-obligation-preflight-v2/packets/${packetId}/verification.json`],"c0v-radial-publish":["evidence/phase10-numerical-verification-v1/c0v-radial-artifact-index.json","evidence/phase10-numerical-verification-v1/c0v-radial-publish-verification.json","evidence/phase10-numerical-verification-v1/c0v-radial-result.json"],"c0v-static-produce":["evidence/phase10-numerical-verification-v1/c0v-static-attempts.jsonl",`evidence/phase10-obligation-preflight-v2/packets/${packetId}/verification.json`],"c0v-static-publish":["evidence/phase10-numerical-verification-v1/c0v-static-artifact-index.json","evidence/phase10-numerical-verification-v1/c0v-static-publish-verification.json","evidence/phase10-numerical-verification-v1/c0v-static-result.json"],"c0v-aggregate":["evidence/phase10-numerical-verification-v1/c0v-aggregate-verification.json","evidence/phase10-numerical-verification-v1/c0v-aggregate.json","evidence/phase10-numerical-verification-v1/c0v-artifact-index.json","evidence/phase10-numerical-verification-v1/c0v-resource-ledger.json","evidence/phase10-numerical-verification-v1/c0v-terminal-table.json"]}[packetId];return [...payload,c.preflightReceiptPath,c.terminalReceiptPath].sort(); }
function internalNames(packetId) {
  const base=["cause-evaluation.json","exit-status.json","freeze-evaluation.json","stderr.log","stdout.log","terminal-success-candidate.json","worker-invocations.jsonl"];
  if(packetId === "c0v-aggregate")base.push("any-layer-nonpass-control.json");
  if(packetId.endsWith("-produce")){
    if(packetId==="c0v-radial-produce")base.push("c0v-radial-producer-summary.json","worker-progress.jsonl","nc-radial-finite-shell-term-witness.bin","nc-radial-forged-summary.json","nc-radial-robin-coefficient-witness.bin");
  }
  return base.sort();
}

function internalArtifactRosters(packetId, authority, subroutes) {
  const finish = (rosterId, relativePaths) => ({ rosterId, relativePaths:[...new Set(relativePaths)].sort() });
  if (!packetId.endsWith("-produce")) {
    return subroutes.map((subroute) => {
      const prelaunch = subroute.dispositionCode === "prelaunch-resource-refusal";
      const paths = ["exit-status.json", "freeze-evaluation.json", "stderr.log", "stdout.log", "terminal-success-candidate.json"];
      if (subroute.dispositionCode !== null) paths.push("cause-evaluation.json");
      if (!prelaunch) paths.push("worker-invocations.jsonl");
      if (packetId === "c0v-aggregate" && (subroute.dispositionCode === null ||
        subroute.subrouteId.endsWith("aggregate-producer") ||
        subroute.subrouteId.endsWith("aggregate-check-caller"))) {
        paths.push("any-layer-nonpass-control.json");
      }
      return finish(subroute.subrouteId, paths);
    });
  }
  return authority.tuples.map((tupleEntry, index) => {
    const invocationRoster = authority.rosters[index];
    const paths = ["exit-status.json", "freeze-evaluation.json", "stderr.log", "stdout.log", "terminal-success-candidate.json"];
    if (tupleEntry.record.workerProcessInvocationCount > 0) paths.push("worker-invocations.jsonl");
    if (tupleEntry.record.discrepancyOrRefusalEvaluatorInvocationCount > 0) paths.push("cause-evaluation.json");
    if (packetId === "c0v-radial-produce" && tupleEntry.record.solverWorkerInvocationCount > 0) paths.push("worker-progress.jsonl");
    if (packetId === "c0v-radial-produce" && invocationRoster) {
      const completedIds = new Set(invocationRoster.invocations.filter((entry) => entry.terminalState === "complete").map((entry) => entry.invocationId));
      const acceptedProduction = tupleEntry.dispositionCode === "production-complete";
      if (completedIds.has("inv-c0v-radial-production")) {
        paths.push("candidate/c0v-radial-producer-summary.json");
        if (!acceptedProduction) paths.push("candidate/c0v-radial-witness.bin");
      }
      if (completedIds.has("inv-c0v-radial-nc-finite-shell-term")) paths.push("candidate/nc-radial-finite-shell-term-witness.bin");
      if (completedIds.has("inv-c0v-radial-nc-forged-summary")) paths.push("candidate/nc-radial-forged-summary.json");
      if (completedIds.has("inv-c0v-radial-nc-robin-coefficient")) paths.push("candidate/nc-radial-robin-coefficient-witness.bin");
    }
    return finish(tupleEntry.tupleId, paths);
  });
}
function claimBoundary(packetId) { const allowed={"a-p-c0v-s6":["exact-s6-obligation-completeness","scoped-successor-schema-validity"],"c0v-moving-produce":["pinned-reference-discrepancy-recording","zero-solver-scientific-credit"],"c0v-moving-publish":["publish-pinned-moving-refusal"],"c0v-radial-produce":["four-case-radial-reference-comparison-or-registered-refusal","no-target-fit-or-validation-claim"],"c0v-radial-publish":["publish-artifact-derived-radial-terminal-state"],"c0v-static-produce":["pinned-preimplementation-refusal","zero-solver-scientific-credit"],"c0v-static-publish":["publish-pinned-static-refusal"],"c0v-aggregate":["package-completion-and-nonpass-aggregation"]}[packetId].sort();return {allowed,forbidden:["c1-through-c5-qualification","model-tuning","new-validation-label","target-facing-score"].sort()}; }

function verificationInvocationRoster(packetId) {
  const maximum = 14400;
  const row = (invocationId, callableId, negativeControlId, invocationClass) => ({ invocationId, callableId, negativeControlId, invocationClass, registeredWallSecondsMaximum: maximum });
  return {
    "a-p-c0v-s6": [
      row("inv-a-p-c0v-s6-nc-missing-producer", "phase10-nc-a-p-c0v-s6-missing-producer", "nc-ap-c0v-s6-missing-producer", "packet-negative-control"),
      row("inv-a-p-c0v-s6-nc-uncalled-check", "phase10-nc-a-p-c0v-s6-uncalled-check", "nc-ap-c0v-s6-uncalled-check", "packet-negative-control"),
      row("inv-a-p-c0v-s6-producer", "phase10-a-p-c0v-s6-producer", null, "packet-producer"),
      // The final governed leaf is the registered strict check caller.  The caller invokes the
      // independent evaluator exactly once and returns its reproof; timing a second evaluator
      // leaf would either duplicate the evaluation or falsely claim a caller invocation.
      row("inv-a-p-c0v-s6-check-caller", "phase10-a-p-c0v-s6-check-caller", null, "packet-evaluator"),
    ],
    "c0v-moving-produce": [],
  "c0v-moving-publish": [
    row("inv-c0v-moving-publish-producer", "phase10-c0v-moving-publish-producer", null, "packet-producer"),
    row("inv-c0v-moving-publish-check-caller", "phase10-c0v-moving-publish-check-caller", null, "packet-evaluator"),
    ],
    "c0v-radial-produce": [],
  "c0v-radial-publish": [
    row("inv-c0v-radial-publish-producer", "phase10-c0v-radial-publish-producer", null, "packet-producer"),
    row("inv-c0v-radial-publish-check-caller", "phase10-c0v-radial-publish-check-caller", null, "packet-evaluator"),
    ],
    "c0v-static-produce": [],
  "c0v-static-publish": [
    row("inv-c0v-static-publish-producer", "phase10-c0v-static-publish-producer", null, "packet-producer"),
    row("inv-c0v-static-publish-check-caller", "phase10-c0v-static-publish-check-caller", null, "packet-evaluator"),
  ],
  "c0v-aggregate": [
    row("inv-c0v-aggregate-nc-any-layer-nonpass", "phase10-nc-c0v-any-layer-nonpass", "nc-c0v-any-layer-nonpass", "packet-negative-control"),
    row("inv-c0v-aggregate-producer", "phase10-c0v-aggregate-producer", null, "packet-producer"),
    row("inv-c0v-aggregate-check-caller", "phase10-c0v-aggregate-check-caller", null, "packet-evaluator"),
  ],
  }[packetId];
}

function verificationRegisteredCapBindings(packetId) {
  return verificationInvocationRoster(packetId).map((entry) => ({
    invocationId: entry.invocationId,
    conditionId: `cond-cap-${entry.invocationId.slice(4)}`,
    observedValueSource: "capped-verification-invocation-wall",
  }));
}

function resourceConditionIds(packetId) {
  return [
    `cond-${packetId}-prelaunch-free-space`,
    `cond-${packetId}-prelaunch-process-hours`,
    `cond-${packetId}-prelaunch-storage`,
  ];
}

function routeCauseConditionIds(packetId) {
  if (packetId === "c0v-moving-produce") return [
    "cond-c0v-moving-science-protocol-identity", "cond-c0v-moving-reference-identity",
    "cond-c0v-moving-expected-outcome", "cond-c0v-moving-observed-outcome",
    "cond-c0v-moving-disposition", "cond-c0v-moving-independent-errors-present",
    "cond-c0v-moving-code-import-receipt", "cond-c0v-moving-claim-boundary",
  ];
  if (packetId === "c0v-static-produce") return [
    "cond-c0v-static-science-protocol-identity", "cond-c0v-static-refusal-identity",
    "cond-c0v-static-reason-code", "cond-c0v-static-attempted-routes",
    "cond-c0v-static-independent-check", "cond-c0v-static-zero-execution",
    "cond-c0v-static-code-import-receipt", "cond-c0v-static-claim-boundary",
  ];
  return [];
}

function selectedRouteDefinition(packetId) {
  const selectedRouteId = route(packetId)[0];
  return selectedRouteId === null ? null : matrix.routes.find((entry) => entry.routeId === selectedRouteId);
}

function produceRouteUniverse(packetId) {
  const selected = selectedRouteDefinition(packetId);
  const subroutes = selected.terminalSubroutes;
  return {
    outputs: [...new Set(subroutes.flatMap((entry) => [...entry.requiredOutputIds, ...entry.forbiddenOutputIds]))].sort(),
    checks: [...new Set(subroutes.flatMap((entry) => [...entry.requiredCheckIds, ...entry.forbiddenCheckIds]))].sort(),
    controls: [...new Set(subroutes.flatMap((entry) => [...entry.requiredNegativeControlIds, ...entry.forbiddenNegativeControlIds]))].sort(),
  };
}

function requiredChecksForTuple(packetId, tupleEntry) {
  const layer = packetLayer(packetId);
  const checks = [];
  if (tupleEntry.record.attemptCensusEvaluatorInvocationCount > 0) checks.push(`chk-c0v-${layer}-attempt-census`);
  if (tupleEntry.record.freezeEvaluatorInvocationCount > 0) checks.push(`chk-c0v-${layer}-freeze-ancestry`);
  if (tupleEntry.record.resourceEvaluatorInvocationCount > 0) checks.push(`chk-c0v-${layer}-resource-boundary`);
  if (packetId === "c0v-moving-produce" && tupleEntry.record.discrepancyOrRefusalEvaluatorInvocationCount > 0) {
    checks.push(tupleEntry.dispositionCode === "reference-discrepancy-refusal"
      ? "chk-c0v-moving-discrepancy-validity" : "chk-c0v-moving-resource-refusal-validity");
  }
  if (packetId === "c0v-static-produce" && tupleEntry.record.discrepancyOrRefusalEvaluatorInvocationCount > 0) {
    checks.push(tupleEntry.dispositionCode === "preimplementation-reference-refusal"
      ? "chk-c0v-static-refusal-validity" : "chk-c0v-static-resource-refusal-validity");
  }
  if (packetId === "c0v-radial-produce") {
    if (tupleEntry.dispositionCode === "preproduction-artifact-refusal") checks.push("chk-c0v-radial-artifact-refusal-validity");
    else if (tupleEntry.dispositionCode === "prelaunch-resource-refusal" || tupleEntry.dispositionCode === "registered-cap-resource-refusal") checks.push("chk-c0v-radial-resource-refusal-validity");
    // A numerical evaluator/control may have been entered before a registered cap, but no
    // radial science caller completes and no check credit exists on a cap route.  Only the
    // full production-complete campaign may register the two science checks as executed.
    if (tupleEntry.dispositionCode === "production-complete") {
      checks.push("chk-c0v-radial-numeric", "chk-c0v-radial-reference-independence");
    }
  }
  return [...new Set(checks)].sort();
}

function classificationConditionIdsForTuple(packetId, tupleEntry, capBindings) {
  if (tupleEntry.dispositionCode === "prelaunch-resource-refusal") return resourceConditionIds(packetId);
  if (tupleEntry.dispositionCode === "preproduction-artifact-refusal") return ["cond-c0v-radial-artifact-precondition-failed"];
  if (tupleEntry.dispositionCode === "registered-cap-resource-refusal") {
    return [capBindings.find((entry) => entry.tupleId === tupleEntry.tupleId).conditionId];
  }
  if (tupleEntry.dispositionCode === "reference-discrepancy-refusal" ||
    tupleEntry.dispositionCode === "preimplementation-reference-refusal") return routeCauseConditionIds(packetId);
  return [];
}

function terminalSubroutes(packetId, authority) {
  const packet = matrix.packets.find((entry) => entry.packetId === packetId);
  if (packetId.endsWith("-produce")) {
    const universe = produceRouteUniverse(packetId);
    return authority.tuples.map((tupleEntry) => {
      const requiredOutputIds = universe.outputs.filter((outputId) => {
        if (outputId.includes("-evaluation") || outputId.includes("-witness")) return tupleEntry.dispositionCode === "production-complete";
        if (outputId.includes("produce-verification")) return [
          "production-complete", "reference-discrepancy-refusal", "preimplementation-reference-refusal",
        ].includes(tupleEntry.dispositionCode) || packetId === "c0v-radial-produce" && [
          "preproduction-artifact-refusal", "prelaunch-resource-refusal", "registered-cap-resource-refusal",
        ].includes(tupleEntry.dispositionCode);
        if (outputId.includes("reference-refusal")) return packetId === "c0v-static-produce";
        if (outputId.endsWith("-reference")) return packetId !== "c0v-static-produce";
        return !outputId.includes("-evaluation") && !outputId.includes("-witness");
      });
      const requiredCheckIds = requiredChecksForTuple(packetId, tupleEntry);
      // A radial registered-cap row preserves the exact attempted invocation prefix, including
      // any earlier completed controls and the sole capped control, in its raw timing/partial-
      // execution records.  It does not complete the registered three-control campaign and
      // therefore earns no executed negative-control credit.  Only a fully completed radial
      // production campaign may carry the complete registered control roster here.
      const requiredNegativeControlIds = packetId === "c0v-radial-produce" &&
        tupleEntry.dispositionCode === "production-complete"
        ? universe.controls
        : [];
      return {
        subrouteId: tupleEntry.tupleId,
        dispositionCode: tupleEntry.dispositionCode,
        classificationConditionIds: classificationConditionIdsForTuple(packetId, tupleEntry, authority.capBindings),
        requiredOutputIds,
        forbiddenOutputIds: universe.outputs.filter((entry) => !requiredOutputIds.includes(entry)),
        requiredCheckIds,
        forbiddenCheckIds: universe.checks.filter((entry) => !requiredCheckIds.includes(entry)),
        requiredNegativeControlIds,
        forbiddenNegativeControlIds: universe.controls.filter((entry) => !requiredNegativeControlIds.includes(entry)),
      };
    });
  }
  const preflightOutputId = packet.outputIds.find((entry) => entry.endsWith("-preflight"));
  const terminalOutputId = packet.outputIds.find((entry) => entry.endsWith("-terminal-receipt"));
  const resourceCheckId = packet.checkIds.find((entry) => entry.endsWith("resource-refusal-validity"));
  const normalCheckIds = packet.checkIds.filter((entry) => entry !== resourceCheckId);
  const complete = {
    subrouteId: `${packetId}-structural-complete`, dispositionCode: null, classificationConditionIds: [],
    requiredOutputIds: packet.outputIds, forbiddenOutputIds: [], requiredCheckIds: normalCheckIds,
    forbiddenCheckIds: [resourceCheckId], requiredNegativeControlIds: packet.negativeControlIds, forbiddenNegativeControlIds: [],
  };
  const maker = (subrouteId, dispositionCode, conditionIds) => ({
    subrouteId, dispositionCode, classificationConditionIds: conditionIds,
    requiredOutputIds: [preflightOutputId, terminalOutputId].sort(),
    forbiddenOutputIds: packet.outputIds.filter((entry) => entry !== preflightOutputId && entry !== terminalOutputId),
    requiredCheckIds: [resourceCheckId],
    forbiddenCheckIds: packet.checkIds.filter((entry) => entry !== resourceCheckId),
    requiredNegativeControlIds: [], forbiddenNegativeControlIds: packet.negativeControlIds,
  });
  return [
    complete,
    maker(`${packetId}-prelaunch-resource-refusal`, "prelaunch-resource-refusal", resourceConditionIds(packetId)),
    ...verificationRegisteredCapBindings(packetId).map((binding) => maker(
      `${packetId}-registered-cap-${binding.invocationId.slice(4)}`,
      "registered-cap-resource-refusal",
      [binding.conditionId],
    )),
  ];
}

function classificationMethod(dispositionCode) {
  if (dispositionCode === "preproduction-artifact-refusal") return "independent-artifact-precondition-classification";
  if (dispositionCode === "prelaunch-resource-refusal") return "independent-prelaunch-resource-classification";
  if (dispositionCode === "registered-cap-resource-refusal") return "independent-registered-cap-classification";
  if (dispositionCode === "reference-discrepancy-refusal") return "independent-reference-discrepancy-classification";
  if (dispositionCode === "preimplementation-reference-refusal") return "independent-preimplementation-refusal-classification";
  throw new Error(`no classification method for ${dispositionCode}`);
}

function classificationProjectionRosters(packetId, authority, subroutes, candidateContract) {
  const conditions = classificationConditions(packetId);
  const tupleById = new Map(authority.tuples.map((entry) => [entry.tupleId, entry]));
  const invocationRosterById = new Map(authority.rosters.map((entry) => [entry.tupleId, entry]));
  const candidateById = new Map(candidateContract.decisionRosters.map((entry) => [entry.subrouteId, entry]));
  const produce = packetId.endsWith("-produce");
  const layer = packetLayer(packetId);
  const assemblerCallableId = produce
    ? `phase10-c0v-${layer}-attempt-receipt-writer`
    : "phase10-c0v-s6-terminal-receipt-writer";
  const evidenceAuthority = (evidenceId, evidenceRole, retentionClass, artifactSource, artifactRelativePath, inlineObservationPath) => ({
    evidenceId, evidenceRole, retentionClass, artifactSource, artifactRelativePath, inlineObservationPath,
  });
  return subroutes.filter((subroute) => subroute.dispositionCode !== null && subroute.dispositionCode !== "production-complete").map((subroute) => {
    const tupleEntry = tupleById.get(subroute.subrouteId);
    const invocationRoster = invocationRosterById.get(subroute.subrouteId);
    const candidate = candidateById.get(subroute.subrouteId);
    const conditionAuthorities = subroute.classificationConditionIds.map((conditionId) => {
      const registered = conditions.find((entry) => entry.conditionId === conditionId);
      if (!registered) throw new Error(`missing classification condition ${conditionId}`);
      return registered;
    });
    const evidence = new Map();
    const add = (entry) => evidence.set(entry.evidenceId, entry);
    const packetEvidenceId = `evidence-${packetId}-packet-protocol`;
    add(evidenceAuthority(packetEvidenceId, "packet-protocol", "tracked-authority", "bindings.packetProtocol", null, null));
    const preflightEvidenceId = `evidence-${packetId}-preflight`;
    const scienceEvidenceId = `evidence-${packetId}-science-protocol`;
    const referenceEvidenceId = `evidence-${packetId}-reference-or-refusal`;
    const exitRawEvidenceId = `evidence-${packetId}-${subroute.subrouteId}-exit-raw`;
    const invocationRawEvidenceId = `evidence-${packetId}-${subroute.subrouteId}-invocations-raw`;
    const progressRawEvidenceId = `evidence-${packetId}-${subroute.subrouteId}-progress-raw`;
    const selectedConditionCardinality = subroute.dispositionCode === "prelaunch-resource-refusal" ? "exactly-one" : "all";
    const observations = conditionAuthorities.map((registered) => {
      const evidenceIds = [packetEvidenceId];
      let observedValueSource;
      let observedValueDerivation = "identity";
      let finalizedValueBinding = null;
      if (registered.conditionId.endsWith("prelaunch-free-space")) {
        observedValueSource = "preflight.observed.resources.observedFreeBytes";
        add(evidenceAuthority(preflightEvidenceId, "preflight-receipt", "tracked-evidence", "retainedPreflight", null, null));
        evidenceIds.push(preflightEvidenceId);
      } else if (registered.conditionId.endsWith("prelaunch-process-hours")) {
        observedValueSource = "preflight.observed.resources.projectedPackageProcessHoursAfterAttempt";
        add(evidenceAuthority(preflightEvidenceId, "preflight-receipt", "tracked-evidence", "retainedPreflight", null, null));
        evidenceIds.push(preflightEvidenceId);
      } else if (registered.conditionId.endsWith("prelaunch-storage")) {
        observedValueSource = "preflight.observed.resources.projectedPackageBytesAfterAttempt";
        add(evidenceAuthority(preflightEvidenceId, "preflight-receipt", "tracked-evidence", "retainedPreflight", null, null));
        evidenceIds.push(preflightEvidenceId);
      } else if (registered.conditionId === "cond-c0v-radial-artifact-precondition-failed") {
        observedValueSource = "preflight.refusalCandidate.failedArtifact.failureClass";
        add(evidenceAuthority(preflightEvidenceId, "preflight-receipt", "tracked-evidence", "retainedPreflight", null, null));
        add(evidenceAuthority(
          `evidence-${packetId}-${subroute.subrouteId}-filesystem-inline`,
          "classification-input",
          "embedded-preflight-observation",
          null,
          null,
          "preflight.refusalCandidate.failedArtifact.filesystemObservation",
        ));
        evidenceIds.push(preflightEvidenceId);
        evidenceIds.push(`evidence-${packetId}-${subroute.subrouteId}-filesystem-inline`);
      } else if (registered.kind === "wall-seconds") {
        const capBinding = [...authority.capBindings, ...verificationRegisteredCapBindings(packetId)].find((entry) => entry.conditionId === registered.conditionId);
        if (!capBinding) throw new Error(`missing cap binding for ${registered.conditionId}`);
        observedValueSource = `internal.workerInvocations.${capBinding.invocationId}.elapsedNanoseconds`;
        observedValueDerivation = "elapsed-nanoseconds-divided-by-1000000000";
        finalizedValueBinding = produce
          ? `attempt.executableInvocationRecords.${capBinding.invocationId}.wallSeconds`
          : `terminalReceipt.invocationRecords.${capBinding.invocationId}.wallSeconds`;
        add(evidenceAuthority(exitRawEvidenceId, "exit-record", "ignored-staging-corroboration", "internal.exitStatus", "exit-status.json", null));
        add(evidenceAuthority(invocationRawEvidenceId, "classification-input", "ignored-staging-corroboration", "internal.workerInvocations", "worker-invocations.jsonl", null));
        evidenceIds.push(exitRawEvidenceId, invocationRawEvidenceId);
        if (packetId === "c0v-radial-produce") {
          add(evidenceAuthority(progressRawEvidenceId, "classification-input", "ignored-staging-corroboration", "internal.workerProgress", "worker-progress.jsonl", null));
          evidenceIds.push(progressRawEvidenceId);
        }
      } else if (registered.conditionId.includes("science-protocol-identity")) {
        observedValueSource = "bindings.scienceProtocol";
        add(evidenceAuthority(scienceEvidenceId, "science-protocol", "tracked-authority", "bindings.scienceProtocol", null, null));
        evidenceIds.push(scienceEvidenceId);
      } else {
        observedValueSource = `bindings.referenceOrRefusal.${registered.conditionId.replace(/^cond-c0v-(?:moving|static)-/, "")}`;
        add(evidenceAuthority(referenceEvidenceId, "reference-or-refusal", "tracked-authority", "bindings.referenceOrRefusal", null, null));
        evidenceIds.push(referenceEvidenceId);
      }
      return {
        conditionId: registered.conditionId,
        kind: registered.kind,
        comparator: registered.comparator,
        registeredValue: registered.registeredValue,
        unit: registered.unit,
        observedValueSource,
        observedValueDerivation,
        finalizedValueBinding,
        conditionPassRule: selectedConditionCardinality === "exactly-one" ? "exactly-one-selected-pass" : "must-pass",
        evidenceIds: [...new Set(evidenceIds)].sort(),
      };
    });
    const componentEvaluatorCallableIds = [];
    const causeDecision = candidate?.decisions.find((entry) => entry.decisionRole === "cause");
    if (causeDecision) componentEvaluatorCallableIds.push(causeDecision.evaluatorCallableId);
    const freezeDecision = candidate?.decisions.find((entry) => entry.decisionRole === "freeze");
    if (freezeDecision) componentEvaluatorCallableIds.push(freezeDecision.evaluatorCallableId);
    if (subroute.requiredCheckIds.some((entry) => entry.endsWith("attempt-census"))) {
      componentEvaluatorCallableIds.push("phase10-c0v-s6-attempt-census-evaluator");
    }
    if (subroute.requiredCheckIds.some((entry) => entry.endsWith("resource-boundary"))) {
      componentEvaluatorCallableIds.push("phase10-c0v-s6-resource-evaluator");
    }
    return {
      subrouteId: subroute.subrouteId,
      validationId: `classification-${packetId}-${packetId}-20260822-v1-${subroute.subrouteId}-v1`,
      assemblerCallableId,
      componentEvaluatorCallableIds,
      method: classificationMethod(subroute.dispositionCode),
      selectedConditionCardinality,
      observations,
      evidence: [...evidence.values()].sort((left,right)=>left.evidenceId < right.evidenceId ? -1 : left.evidenceId > right.evidenceId ? 1 : 0),
      projectionRule: "cause-evaluation-attempt-classification-and-final-rerun-exactly-equal",
    };
  });
}

for (const packetId of packetIds) {
  const packet = matrix.packets.find((entry) => entry.packetId === packetId);
  const cat = catalogue.packets.find((entry) => entry.packetId === packetId);
  const layer = packetLayer(packetId);
  const layerIdentity = layer ? layerArtifacts[layer].map(identity) : [null,null];
  const authority = tupleAuthority(packetId);
  const packetTerminalSubroutes = terminalSubroutes(packetId, authority);
  let packetTerminalCandidateContract = terminalCandidateContractFor(packetId,authority,packetTerminalSubroutes);
  const packetTerminalReceiptContract = terminalReceiptContractFor(
    packetId,
    authority,
    packetTerminalSubroutes,
    packetTerminalCandidateContract,
  );
  const callerRosterBySubroute = new Map(packetTerminalReceiptContract.callerInvocationResultRosters.map(
    (entry) => [entry.subrouteId, entry.callerInvocationResults],
  ));
  packetTerminalCandidateContract = {
    ...packetTerminalCandidateContract,
    decisionRosters: packetTerminalCandidateContract.decisionRosters.map((entry) => ({
      ...entry,
      candidateCallerInvocationIds: callerRosterBySubroute.get(entry.subrouteId)
        .filter((result) => result.stage === "pre-candidate")
        .map((result) => result.callerInvocationId),
    })),
  };
  const packetClassificationProjectionRosters = classificationProjectionRosters(
    packetId,
    authority,
    packetTerminalSubroutes,
    packetTerminalCandidateContract,
  );
  const observations = authority.tuples.map((entry) => ({
    tupleId:entry.tupleId,
    observationPointIds:[`obs-${layer}-terminal-retention`],
  }));
  const candidateRosters = authority.tuples.length
    ? Object.fromEntries(authority.tuples.map((entry) => [entry.tupleId,candidateNames(packetId,entry)]))
    : Object.fromEntries(packetTerminalSubroutes.map((entry) => [
      entry.subrouteId,
      entry.dispositionCode === null ? candidateNames(packetId,{}) : [],
    ]));
  const [selectedRouteId,s5ArtifactDisposition] = route(packetId);
  const commandBase = `--packet ${packetId} --protocol research/phase10-execution-v2/packets/${packetId}/protocol.json --attempt ${packetId}-20260822-v1`;
  const protocol = {
    schema:"phase10-c0v-s6-packet-protocol-v1",protocolId:`phase10-${packetId}-execution-v2-v1`,matrixId:"phase10-c0v-s6-obligations-v1",packetId,registryId:`phase10-${packetId}-execution-v2-callables-v1`,registeredAttemptId:`${packetId}-20260822-v1`,executionMode:executionMode(packetId),
    bindings:{...identityBindings,callableRegistry:identity(`research/phase10-execution-v2/packets/${packetId}/callable-registry.json`),scienceProtocol:layerIdentity[0],referenceOrRefusal:layerIdentity[1],originalApEvidence},
    selectedRouteId,s5ArtifactDisposition,registeredOutputIds:packet.outputIds,registeredCheckIds:packet.checkIds,registeredNegativeControlIds:packet.negativeControlIds,boundDependencyPacketIds:packet.dependencyPacketIds,dependencyArtifactContracts:dependencyRows(packetId),
    commandTemplates:[{commandId:"check",command:`node runner/src/phase10-c0v-s6-executor.ts check ${commandBase}`},{commandId:"run",command:`node runner/src/phase10-c0v-s6-executor.ts run ${commandBase}`}],
    paths:{attemptRoot:cat.attemptRoot,packageLockPath:catalogue.packageLockPath,lockPath:cat.lockPath,preflightReceiptPath:cat.preflightReceiptPath,terminalReceiptPath:cat.terminalReceiptPath,allowedPublicationPaths:allowedPaths(packetId),publicationStagingPaths:allowedPaths(packetId).map((finalPath)=>({finalPath,stagingPath:`${finalPath}.stage-${packetId}-20260822-v1`})),internalOnlyFilenames:internalNames(packetId)},candidateFilenameRosters:candidateRosters,internalArtifactRosters:internalArtifactRosters(packetId, authority, packetTerminalSubroutes),verification:{filename:cat.verificationFilename,schemaId:cat.verificationSchemaId,verificationIdRule:"phase10-packet-attempt-verification-v2",executionProvenanceRule:"nonnull-completed-main-evaluator-for-normal-credit-route-null-exactly-radial-validated-refusal-no-verification-on-other-maker-return"},allowedCleanTerminalClasses:allowedTerminalClasses(packetId),terminalSubroutes:packetTerminalSubroutes,resources:packetResources(packetId),
    ancestryAuthority:{launchBranch:"phase10/evidence-verification",governanceCommit:"fdb829b7a31e9e2573d8217d317ad7f5ffbc54fc",s5ScienceFreezeCommit:"cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9",s5InfrastructureCorrectionCommit:"cd331b75be4527bab11f3139d968626914a87694",s5EvidenceFreezeCommit:"a14d9049751d561629a6fdc6bf85fdc9cc99e870",cleanWorktreeRequired:true,headMustEqualLaunchCommit:true,launchCleanObservationRule:"preflight-observes-empty-status-before-first-generated-write",indexConcealmentRule:"git-ls-files-t-v-roster-equals-launch-head-and-every-tag-is-uppercase-H",postLaunchRevalidationRule:"launch-head-authority-bytes-exact-with-stage-selected-generated-dirt-only",postLaunchDirtyAllowlistRule:"freeze-preflight-only-packet-verification-selected-required-publications-minus-current-verification-and-terminal-final-reopen-selected-required-publications",implementationFreezeRule:"common-first-introduction-commit-of-execution-v2-authority-and-callable-closure",codeFreezeSource:"git-first-introduction-plus-current-byte-match"},
    preObservationProductionClosure:packetId === "c0v-radial-produce" ? {schema:"phase10-c0v-s6-preobservation-production-closure-v1",commit:PREOBSERVATION_COMMIT,artifacts:preObservationProductionClosureArtifacts,membershipRule:"producer-import-closure-and-resolution-artifacts-existing-at-s5-science-freeze",comparisonRule:"live-and-implementation-blobs-equal-cf0-raw-bytes"} : null,
    preflightObservedContract:{schema:"phase10-c0v-s6-preflight-observed-contract-v1",observedFieldOrder:preflightObservedFields,resourceFieldOrder:preflightResourceFields,ancestryFieldOrder:ancestryFields,selectedBranchesFieldOrder:["selectedRouteId","s5ArtifactDisposition"],stage:"run",commandTemplateId:"run",launchClass:packet.launchClass,cwd:".",repositoryBundleRoot:".",packetCataloguePath:cataloguePath,cleanWorktreeRequired:true,nasOrNetworkAccess:false,allowedRefusalDispositionCodes:packetId === "c0v-radial-produce" ? ["prelaunch-resource-refusal","preproduction-artifact-refusal"] : ["prelaunch-resource-refusal"]},
    workerInvocationContract,workerProgressContract:packetId === "c0v-radial-produce" ? workerProgressContract : null,exitStatusContract,freezeEvaluationContract,causeEvaluationContract,terminalCandidateContract:packetTerminalCandidateContract,terminalReceiptContract:packetTerminalReceiptContract,executionRecordTuples:authority.tuples,executableInvocationRosters:authority.rosters,verificationInvocationRoster:verificationInvocationRoster(packetId),verificationRegisteredCapBindings:verificationRegisteredCapBindings(packetId),resourceObservationPointRosters:observations,registeredCapBindings:authority.capBindings,classificationConditions:classificationConditions(packetId),classificationProjectionRosters:packetClassificationProjectionRosters,radialBinaryLayout:packetId === "c0v-radial-produce" ? radialBinaryLayout : null,radialProducerSummary:packetId === "c0v-radial-produce" ? radialSummary : null,controlOperators:packetId === "c0v-radial-produce" ? radialControls : [],aggregateNegativeControlContract:packetId === "c0v-aggregate" ? aggregateNegativeControlContract : null,claimBoundary:claimBoundary(packetId),
  };
  writeJson(`research/phase10-execution-v2/packets/${packetId}/protocol.json`, protocol);
}
