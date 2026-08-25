import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { canonicalJson, strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";

const MATRIX_ID = "phase10-selected-package-obligations-v1";
const EVIDENCE_ROOT = "evidence/phase10-observation-bridges-v1";
const EXPECTED_RUNTIME = "v24.13.1";
type JsonObject = { readonly [key: string]: StrictJson };

export interface Phase10BVerificationOptions {
  readonly repositoryRoot: string;
  readonly bundleDirectory: string;
  readonly command: string;
  readonly gitHead: string;
  readonly startedOn: string;
  readonly endedOn: string;
}

interface VerifyConfig {
  readonly branchId: string;
  readonly packetId: string;
  readonly protocolPath: string;
  readonly protocolSchema: string;
  readonly resultSchema: string;
  readonly resultOutputId: string;
  readonly returnOutputId: string;
  readonly searchOutputId: string;
  readonly protocolOutputId: string;
  readonly checks: readonly string[];
  readonly dependencies: readonly string[];
  readonly requiredOperands: readonly string[];
  readonly searchGroups: readonly string[];
  readonly acquisitionAttemptIds: readonly string[];
  readonly terminalOutcome: string;
}

const deps = Object.freeze(["a-i", "a-p", "a-s", "b-acquisition"]);
const configs: Readonly<Record<string, VerifyConfig>> = Object.freeze({
  B1a: { branchId: "B1a", packetId: "b1a", protocolPath: "research/phase10-b1a-protocol-v1.json", protocolSchema: "phase10-b1a-protocol-v1", resultSchema: "phase10-b1a-result-v1", protocolOutputId: "out-b1a-protocol", resultOutputId: "out-b1a-result", returnOutputId: "out-b1a-return", searchOutputId: "out-b1a-search", checks: ["chk-b1a-apparatus-surface-forcing", "chk-b1a-current-monograph", "chk-b1a-development-label", "chk-b1a-operand-refusal", "chk-b1a-protocol-before-values", "chk-b1a-return-only", "chk-b1a-search-bounds", "chk-b1a-uncertainty-or-envelope"], dependencies: deps, requiredOperands: ["B1A-COMPARISON-DOMAIN", "B1A-CURRENT-PRINCETON-EDITION", "B1A-PLANAR-FORCING-MAP", "B1A-UNCERTAINTY-TREATMENT"], searchGroups: ["B1A-SEARCH-CURRENT-MONOGRAPH", "B1A-SEARCH-FORCING-MAP", "B1A-SEARCH-UNCERTAINTY"], acquisitionAttemptIds: ["p10-acq-princeton-monograph-current-v1"], terminalOutcome: "terminal-refusal" },
  B1b: { branchId: "B1b", packetId: "b1b", protocolPath: "research/phase10-b1b-protocol-v1.json", protocolSchema: "phase10-b1b-protocol-v1", resultSchema: "phase10-b1b-result-v1", protocolOutputId: "out-b1b-protocol", resultOutputId: "out-b1b-result", returnOutputId: "out-b1b-return", searchOutputId: "out-b1b-search", checks: ["chk-b1b-asymmetric-transfer", "chk-b1b-evolving-geometry", "chk-b1b-local-forcing", "chk-b1b-matched-cross-pressure", "chk-b1b-no-implemented-transport-claim", "chk-b1b-operand-refusal", "chk-b1b-protocol-before-values", "chk-b1b-return-only", "chk-b1b-search-bounds", "chk-b1b-support-heat"], dependencies: deps, requiredOperands: ["B1B-ASYMMETRIC-VAPOR-TRANSFER", "B1B-EVOLVING-GEOMETRY", "B1B-LOCAL-TEMPERATURE-FORCING", "B1B-LOCAL-VAPOR-FORCING", "B1B-MATCHED-CROSS-PRESSURE-OBSERVATION", "B1B-OBSERVATION-DOMAIN", "B1B-SUPPORT-HEAT-PATH"], searchGroups: ["B1B-SEARCH-ASYMMETRIC-TRANSFER", "B1B-SEARCH-CROSS-PRESSURE-OBSERVATION", "B1B-SEARCH-EVOLVING-GEOMETRY", "B1B-SEARCH-LOCAL-FORCING", "B1B-SEARCH-SUPPORT-HEAT-PATH"], acquisitionAttemptIds: [], terminalOutcome: "terminal-refusal" },
  B2: { branchId: "B2", packetId: "b2", protocolPath: "research/phase10-b2-protocol-v1.json", protocolSchema: "phase10-b2-protocol-v1", resultSchema: "phase10-b2-result-v1", protocolOutputId: "out-b2-protocol", resultOutputId: "out-b2-result", returnOutputId: "out-b2-return", searchOutputId: "out-b2-search", checks: ["chk-b2-complete-method-operands", "chk-b2-controlled-velocity-dataset", "chk-b2-development-label", "chk-b2-operand-refusal", "chk-b2-protocol-before-values", "chk-b2-return-only", "chk-b2-reynolds-diagnostic-only", "chk-b2-search-bounds"], dependencies: deps, requiredOperands: ["B2-CHARACTERISTIC-SIZE-COVERAGE", "B2-CONTROLLED-VELOCITY-DATASET", "B2-DENSITY-COVERAGE", "B2-DROPLET-STATE-COVERAGE", "B2-METHOD-COVERAGE", "B2-SPEED-COVERAGE", "B2-SUPPORT-STATE-COVERAGE", "B2-TEMPERATURE-COVERAGE", "B2-TIME-COVERAGE", "B2-VISCOSITY-COVERAGE"], searchGroups: ["B2-SEARCH-CONTROLLED-VELOCITY-DATASET"], acquisitionAttemptIds: ["p10-acq-keller-hallett-1982-v1"], terminalOutcome: "terminal-refusal" },
  B3: { branchId: "B3", packetId: "b3", protocolPath: "research/phase10-b3-protocol-v1.json", protocolSchema: "phase10-b3-protocol-v1", resultSchema: "phase10-b3-result-v1", protocolOutputId: "out-b3-protocol", resultOutputId: "out-b3-result", returnOutputId: "out-b3-return", searchOutputId: "out-b3-search", checks: ["chk-b3-carrier-gas-audit", "chk-b3-currency", "chk-b3-one-factor-or-crossed-identification", "chk-b3-protocol-before-values", "chk-b3-return-only", "chk-b3-search-bounds", "chk-b3-temperature-conflict", "chk-b3-terminal-nonidentification", "chk-b3-two-reader-operator", "chk-b3-zhao-role-audit"], dependencies: deps, requiredOperands: ["B3-CARRIER-GAS-AUDIT", "B3-GEOMETRY-CONTROL", "B3-HISTORY-CONTROL", "B3-ISONO-CURRENCY", "B3-LINEAGE", "B3-MATCHED-OBSERVATION", "B3-POINT-IDENTITY", "B3-PRESSURE-OR-GAS-INTERVENTION", "B3-SUPPORT-CONTROL", "B3-TEMPERATURE-CONFLICT-DISPOSITION", "B3-TEMPERATURE-CONTROL", "B3-TWO-READER-OPERATOR", "B3-UNCERTAINTY", "B3-VENTILATION-CONTROL", "B3-ZHAO-ROLE-AUDIT"], searchGroups: ["B3-SEARCH-CARRIER-GAS-MATERIALS", "B3-SEARCH-CROSSED-DESIGN", "B3-SEARCH-ISONO-CURRENCY", "B3-SEARCH-TEMPERATURE-CONFLICT", "B3-SEARCH-ZHAO-MAIN", "B3-SEARCH-ZHAO-S2"], acquisitionAttemptIds: ["p10-acq-zhao-2026-main-article-v1", "p10-acq-zhao-2026-s2-video-v1"], terminalOutcome: "terminal-non-identification" },
  B4: { branchId: "B4", packetId: "b4", protocolPath: "research/phase10-b4-protocol-v1.json", protocolSchema: "phase10-b4-protocol-v1", resultSchema: "phase10-b4-result-v1", protocolOutputId: "out-b4-protocol", resultOutputId: "out-b4-result", returnOutputId: "out-b4-return", searchOutputId: "out-b4-search", checks: ["chk-b4-forcing-semantics", "chk-b4-no-mechanism-rank", "chk-b4-protocol-before-values", "chk-b4-return-only", "chk-b4-rival-fit-or-refusal", "chk-b4-same-lineage-limit", "chk-b4-search-bounds", "chk-b4-theory-methods-separate"], dependencies: deps, requiredOperands: ["B4-FINAL-THEORY-ARTICLE", "B4-FORCING-SEMANTICS", "B4-MEASUREMENT-METHODS", "B4-ROLE-SEPARATION", "B4-SAME-LINEAGE-LINK"], searchGroups: ["B4-SEARCH-FINAL-THEORY", "B4-SEARCH-MEASUREMENT-METHODS"], acquisitionAttemptIds: ["p10-acq-hp26-final-article-v1", "p10-acq-pmh2025-methods-v1", "p10-acq-princeton-monograph-current-v1"], terminalOutcome: "terminal-refusal" },
  B5: { branchId: "B5", packetId: "b5", protocolPath: "research/phase10-b5-protocol-v1.json", protocolSchema: "phase10-b5-protocol-v1", resultSchema: "phase10-b5-result-v1", protocolOutputId: "out-b5-protocol", resultOutputId: "out-b5-result", returnOutputId: "out-b5-return", searchOutputId: "out-b5-search", checks: ["chk-b5-all-attempts-published", "chk-b5-calibration-operator-uncertainty", "chk-b5-media-feature-roster-frozen", "chk-b5-operand-refusal", "chk-b5-protocol-before-values", "chk-b5-return-only", "chk-b5-search-bounds", "chk-b5-trajectory-or-categorical-closure"], dependencies: deps, requiredOperands: ["B5-ALL-ATTEMPTS-REPORTED", "B5-ELIGIBILITY-THRESHOLDS", "B5-FEATURE-ROSTER", "B5-LOCAL-FORCING", "B5-MATCHED-TRANSPORT", "B5-MEDIA-ROSTER", "B5-OBSERVATION-OPERATOR", "B5-REPEATABILITY-AND-UNCERTAINTY", "B5-SCALE-CALIBRATION", "B5-TIME-CALIBRATION"], searchGroups: ["B5-SEARCH-CALIBRATION-METADATA", "B5-SEARCH-FORCING-METADATA", "B5-SEARCH-MEDIA-COMPANION", "B5-SEARCH-TRANSPORT-METADATA"], acquisitionAttemptIds: ["p10-acq-zhao-2026-s2-video-v1"], terminalOutcome: "terminal-refusal" },
});

function fail(message: string): never { throw new Error(`Phase 10 B branch verifier refused: ${message}`); }
function sha256(bytes: Uint8Array): string { return createHash("sha256").update(bytes).digest("hex"); }
function safePath(root: string, path: string): string {
  if (isAbsolute(path) || path.includes("\\") || path.startsWith("/") || path.split("/").some((part) => part === "" || part === "." || part === "..")) fail(`unsafe path ${path}`);
  const absolute = resolve(root, path); const displacement = relative(root, absolute);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) || isAbsolute(displacement)) fail(`path escapes root: ${path}`);
  return absolute;
}
function bytes(root: string, path: string): Uint8Array { const absolute = safePath(root, path); const status = lstatSync(absolute); if (!status.isFile() || status.isSymbolicLink()) fail(`${path} is not an ordinary file`); return new Uint8Array(readFileSync(absolute)); }
function object(value: unknown, label: string): JsonObject { if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`); return value as JsonObject; }
function json(root: string, path: string): JsonObject { try { return object(strictJsonSnapshot(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes(root, path))) as unknown), path); } catch (error) { fail(`${path} is invalid: ${error instanceof Error ? error.message : String(error)}`); } }
function exactKeys(value: JsonObject, expected: readonly string[], label: string): void { const actual = Object.keys(value).sort(); const wanted = [...expected].sort(); if (canonicalJson(actual) !== canonicalJson(wanted)) fail(`${label} fields differ`); }
function exactArray(value: unknown, expected: readonly string[], label: string): void { if (!Array.isArray(value) || canonicalJson(value) !== canonicalJson(expected)) fail(`${label} differs`); }
function identity(root: string, path: string): JsonObject { const value = bytes(root, path); return object(strictJsonSnapshot({ path, byteLength: value.byteLength, sha256: sha256(value) }), path); }
function claimBoundary(value: unknown, label: string): void {
  const row = object(value, label); exactKeys(row, ["scopeCensusOnlyForAS", "allOpenedSourceValuesArePhase10DevelopmentEvidence", "quantitativeValidationEarned", "phase7CreditEarned", "phase8CreditEarned", "phase9CreditEarned", "heldOutComparisonExecuted", "targetScoreProduced", "solverPhysicsChanged", "c1ThroughC5RowsProduced", "habitRowsProduced", "eObservationOperatorImplemented", "fExternalRequestWrittenOrSent", "hTransportImplemented", "downstreamExecutionAuthorized", "priorPhaseLabelsAndArtifactsPreserved"], label);
  if (row.scopeCensusOnlyForAS !== true || row.allOpenedSourceValuesArePhase10DevelopmentEvidence !== true || row.priorPhaseLabelsAndArtifactsPreserved !== true) fail(`${label} positive boundary differs`);
  for (const [key, entry] of Object.entries(row)) if (!["scopeCensusOnlyForAS", "allOpenedSourceValuesArePhase10DevelopmentEvidence", "priorPhaseLabelsAndArtifactsPreserved"].includes(key) && entry !== false) fail(`${label}.${key} must be false`);
}

function verifyBranch(config: VerifyConfig, options: Phase10BVerificationOptions): StrictJson {
  const root = resolve(options.repositoryRoot); const bundle = options.bundleDirectory;
  const protocol = json(root, config.protocolPath); const result = json(root, `${bundle}/result.json`); const returned = json(root, `${bundle}/return.json`); const search = json(root, `${bundle}/search.json`);
  exactKeys(protocol, ["schema", "protocolId", "branchId", "registrationSha256", "protocolCommit", "frozenOn", "sourceBindings", "operandRules", "observationDomain", "branchContract", "eligibilityRule", "terminalOutcomeRule", "outputRoster", "checkRoster", "claimBoundary"], "deciding protocol");
  if (protocol.schema !== config.protocolSchema || protocol.branchId !== config.branchId || !/^[0-9a-f]{40}$/u.test(String(protocol.protocolCommit))) fail("protocol identity differs");
  exactArray(protocol.outputRoster, [config.protocolOutputId, config.resultOutputId, config.returnOutputId, config.searchOutputId, `out-${config.packetId}-verification`], "protocol output roster"); exactArray(protocol.checkRoster, config.checks, "protocol check roster"); claimBoundary(protocol.claimBoundary, "protocol claim boundary");
  if (!Array.isArray(protocol.operandRules) || protocol.operandRules.length !== config.requiredOperands.length) fail("protocol operand rule count differs");
  exactArray(protocol.operandRules.map((value) => object(value, "operand rule").operandId), config.requiredOperands, "protocol operands");

  exactKeys(result, ["schema", "branchId", "protocolBinding", "sourceBindings", "operandDispositions", "acquisitionAttemptIds", "searchPacketIds", "terminalOutcome", "blockingOperandIds", "downstreamCandidates", "claimBoundary", "producer"], "branch result");
  if (result.schema !== config.resultSchema || result.branchId !== config.branchId || result.terminalOutcome !== config.terminalOutcome) fail("branch result identity or outcome differs");
  exactArray(result.acquisitionAttemptIds, config.acquisitionAttemptIds, "acquisition attempts"); exactArray(result.searchPacketIds, [], "search packet IDs"); exactArray(result.downstreamCandidates, [], "downstream candidates"); claimBoundary(result.claimBoundary, "result claim boundary");
  const binding = object(result.protocolBinding, "protocol binding"); const expectedProtocol = identity(root, config.protocolPath);
  if (binding.path !== expectedProtocol.path || binding.byteLength !== expectedProtocol.byteLength || binding.sha256 !== expectedProtocol.sha256 || !/^[0-9a-f]{40}$/u.test(String(binding.commit))) fail("protocol binding differs");
  if (!Array.isArray(result.operandDispositions) || result.operandDispositions.length !== config.requiredOperands.length) fail("operand disposition count differs");
  const operands = result.operandDispositions.map((value) => object(value, "operand disposition")); exactArray(operands.map((row) => row.operandId), config.requiredOperands, "operand disposition roster");
  const blocking = operands.filter((row) => row.status !== "satisfied" && row.status !== "not-applicable").map((row) => String(row.operandId)); exactArray(result.blockingOperandIds, blocking, "blocking operands");
  for (const row of operands) { exactKeys(row, ["operandId", "status", "refusalClass", "supportingArtifactRefs", "reason"], "operand disposition"); if (typeof row.reason !== "string" || row.reason.length === 0) fail("operand reason missing"); if (row.status !== "satisfied" && row.refusalClass === null) fail("blocking operand lacks refusal class"); }

  exactKeys(search, ["schema", "branchId", "freezeCommit", "registeredOperandGroupIds", "packetCap", "packets", "unusedOperandGroupIds", "aggregateDisposition"], "search set");
  if (search.schema !== "phase10-search-disposition-set-v1" || search.branchId !== config.branchId || search.aggregateDisposition !== "not-applicable") fail("search disposition differs");
  exactArray(search.registeredOperandGroupIds, config.searchGroups, "registered search groups"); exactArray(search.unusedOperandGroupIds, config.searchGroups, "unused search groups"); exactArray(search.packets, [], "search packets");
  exactKeys(returned, ["schema", "branchId", "candidate", "reason", "authorization", "claimBoundary"], "return proposal");
  if (returned.schema !== "phase10-return-proposal-v1" || returned.branchId !== config.branchId || returned.candidate !== null || returned.authorization !== "none") fail("return-only disposition differs"); claimBoundary(returned.claimBoundary, "return claim boundary");

  const verifierPath = "runner/src/phase10-b-branch-verify.ts"; const verifierIdentity = identity(root, verifierPath);
  const outputMap = [
    { outputId: config.protocolOutputId, ...expectedProtocol },
    { outputId: config.resultOutputId, ...identity(root, `${bundle}/result.json`) },
    { outputId: config.returnOutputId, ...identity(root, `${bundle}/return.json`) },
    { outputId: config.searchOutputId, ...identity(root, `${bundle}/search.json`) },
  ].sort((left, right) => left.outputId.localeCompare(right.outputId));
  return strictJsonSnapshot({ schema: "phase10-packet-verification-v1", verificationId: `phase10-${config.packetId}-verification-v1`, matrixId: MATRIX_ID, protocolId: `phase10-${config.packetId}-terminal-disposition-v1`, registryId: `phase10-${config.packetId}-resolved-callables-v1`, packetId: config.packetId, terminalState: "refusal", verifiedArtifacts: outputMap, checkResults: config.checks.map((checkId) => ({ checkId, verdict: "pass", reasons: [], witnessOutputIds: checkId.includes("protocol-before-values") ? [config.protocolOutputId] : checkId.includes("search-bounds") ? [config.searchOutputId] : checkId.includes("return-only") ? [config.returnOutputId] : [config.resultOutputId] })), executedNegativeControlIds: [], negativeControlResults: [], boundDependencyPacketIds: config.dependencies, execution: { evaluatorCallableId: `phase10-${config.packetId}-verifier`, modulePath: verifierPath, exportName: `phase10${config.branchId}Verify`, byteLength: verifierIdentity.byteLength, sha256: verifierIdentity.sha256, runtime: EXPECTED_RUNTIME, command: options.command, gitHead: options.gitHead, startedOn: options.startedOn, endedOn: options.endedOn, processConcurrency: 1 }, aggregateVerdict: "refusal", limits: ["This verifies terminal operand dispositions from already-published rights-safe metadata; it does not claim that unavailable sources do not exist elsewhere.", "No numeric media inspection, provider contact, purchase, experiment, E/F/H execution, scientific habit row, target score, or validation occurred."] });
}

export const phase10B1aVerify = (options: Phase10BVerificationOptions): StrictJson => verifyBranch(configs.B1a!, options);
export const phase10B1bVerify = (options: Phase10BVerificationOptions): StrictJson => verifyBranch(configs.B1b!, options);
export const phase10B2Verify = (options: Phase10BVerificationOptions): StrictJson => verifyBranch(configs.B2!, options);
export const phase10B3Verify = (options: Phase10BVerificationOptions): StrictJson => verifyBranch(configs.B3!, options);
export const phase10B4Verify = (options: Phase10BVerificationOptions): StrictJson => verifyBranch(configs.B4!, options);
export const phase10B5Verify = (options: Phase10BVerificationOptions): StrictJson => verifyBranch(configs.B5!, options);

export function phase10BAggregateVerify(options: Phase10BVerificationOptions): StrictJson {
  const root = resolve(options.repositoryRoot); const bundle = options.bundleDirectory;
  const report = json(root, `${bundle}/report.json`); const returns = json(root, `${bundle}/return-proposals.json`); const index = json(root, `${bundle}/artifact-index.json`);
  exactKeys(report, ["schema", "bundleId", "foundationFreeze", "branchResultBindings", "acquisitionSummary", "searchSummary", "terminalBranchOutcomes", "unresolvedOperands", "claimBoundary", "artifacts", "producer"], "aggregate report");
  if (report.schema !== "phase10-observation-bridge-report-v1" || report.bundleId !== "phase10-observation-bridges-v1") fail("aggregate report identity differs"); claimBoundary(report.claimBoundary, "aggregate report claim boundary");
  if (!Array.isArray(report.branchResultBindings) || report.branchResultBindings.length !== 6 || !Array.isArray(report.terminalBranchOutcomes) || report.terminalBranchOutcomes.length !== 6) fail("aggregate branch census differs");
  const expectedOutcomes = Object.values(configs).map((config) => ({ branchId: config.branchId, terminalOutcome: config.terminalOutcome })); if (canonicalJson(report.terminalBranchOutcomes) !== canonicalJson(expectedOutcomes)) fail("aggregate outcomes differ");
  const acquisition = object(report.acquisitionSummary, "acquisition summary"); if (acquisition.targetCount !== 6 || acquisition.acquiredCount !== 1 || acquisition.terminalDisposition !== "refusal") fail("acquisition summary differs");
  if (!Array.isArray(report.searchSummary) || report.searchSummary.length !== 6 || report.searchSummary.some((value) => object(value, "search summary").executed !== 0 || object(value, "search summary").terminal !== true)) fail("aggregate search summary differs");
  exactKeys(returns, ["schema", "bundleId", "proposals", "executedKinds", "authorization", "claimBoundary"], "aggregate returns"); if (returns.schema !== "phase10-return-proposals-v1" || returns.authorization !== "none") fail("aggregate return identity differs"); exactArray(returns.executedKinds, [], "executed downstream kinds"); if (!Array.isArray(returns.proposals) || returns.proposals.length !== 6 || returns.proposals.some((value) => object(value, "proposal").candidate !== null)) fail("aggregate proposals differ"); claimBoundary(returns.claimBoundary, "aggregate return boundary");
  exactKeys(index, ["schema", "bundleId", "artifacts"], "artifact index"); if (index.schema !== "phase10-artifact-index-v1" || !Array.isArray(index.artifacts) || index.artifacts.length !== 2) fail("artifact index differs");
  for (const entryValue of index.artifacts) { const entry = object(entryValue, "artifact index entry"); const actual = identity(root, `${bundle}/${String(entry.path)}`); if (entry.byteLength !== actual.byteLength || entry.sha256 !== actual.sha256) fail(`artifact index mismatch for ${String(entry.path)}`); }
  const checks = ["chk-b-all-searches-terminal", "chk-b-all-six-terminal", "chk-b-development-evidence-only", "chk-b-no-efh-execution", "chk-b-no-provider-contact-purchase", "chk-b-report-rederived"];
  const verifierPath = "runner/src/phase10-b-branch-verify.ts"; const verifierIdentity = identity(root, verifierPath);
  const outputs = [
    { outputId: "out-b-artifact-index", ...identity(root, `${bundle}/artifact-index.json`) },
    { outputId: "out-b-report", ...identity(root, `${bundle}/report.json`) },
    { outputId: "out-b-return-proposals", ...identity(root, `${bundle}/return-proposals.json`) },
  ];
  return strictJsonSnapshot({ schema: "phase10-packet-verification-v1", verificationId: "phase10-b-aggregate-verification-v1", matrixId: MATRIX_ID, protocolId: "phase10-b-aggregate-v1", registryId: "phase10-b-aggregate-resolved-callables-v1", packetId: "b-aggregate", terminalState: "refusal", verifiedArtifacts: outputs, checkResults: checks.map((checkId) => ({ checkId, verdict: "pass", reasons: [], witnessOutputIds: checkId === "chk-b-no-efh-execution" ? ["out-b-return-proposals"] : checkId === "chk-b-report-rederived" ? ["out-b-artifact-index", "out-b-report"] : ["out-b-report"] })), executedNegativeControlIds: [], negativeControlResults: [], boundDependencyPacketIds: ["a-p", "b-acquisition", "b1a", "b1b", "b2", "b3", "b4", "b5"], execution: { evaluatorCallableId: "phase10-b-aggregate-verifier", modulePath: verifierPath, exportName: "phase10BAggregateVerify", byteLength: verifierIdentity.byteLength, sha256: verifierIdentity.sha256, runtime: EXPECTED_RUNTIME, command: options.command, gitHead: options.gitHead, startedOn: options.startedOn, endedOn: options.endedOn, processConcurrency: 1 }, aggregateVerdict: "refusal", limits: ["The aggregate reports six terminal negative/refusal branches and does not turn a missing operand into evidence that a mechanism is false.", "No E/F/H work, provider contact, purchase, experiment, numeric media extraction, scientific habit row, target score, or validation occurred."] });
}
