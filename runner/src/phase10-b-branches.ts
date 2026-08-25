import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  phase10BAggregateCheckCaller,
  phase10B1aCheckCaller,
  phase10B1bCheckCaller,
  phase10B2CheckCaller,
  phase10B3CheckCaller,
  phase10B4CheckCaller,
  phase10B5CheckCaller,
} from "./phase10-b-branch-checks.ts";
import {
  phase10BAggregateVerify,
  phase10B1aVerify,
  phase10B1bVerify,
  phase10B2Verify,
  phase10B3Verify,
  phase10B4Verify,
  phase10B5Verify,
  type Phase10BVerificationOptions,
} from "./phase10-b-branch-verify.ts";
import { parsePhase10ExecutionReceipt } from "./phase10-contracts.ts";
import {
  phase10ObligationReceiptPreflight,
  phase10ObligationRunPreflight,
  type Phase10ObligationPreflightPass,
} from "./phase10-obligation-preflight.ts";

const EXPECTED_BRANCH = "phase10/evidence-verification";
const EXPECTED_RUNTIME = "v24.13.1";
const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json";
const FOUNDATION_PATH = "research/phase10-foundation-freeze-v1.json";
const SCHEMA_REGISTRY_PATH = "research/phase10-b-branch-artifact-schema-registry-v1.json";
const PACKET_CATALOGUE_PATH = "research/phase10-execution-v1/packet-catalogue.json";
const DISPOSITIONS_PATH = "evidence/phase10-scope-intake-v1/post-freeze-dispositions.jsonl";
const CURRENCY_PATH = "evidence/phase10-scope-intake-v1/currency.jsonl";
const ACQUISITION_PATH = "evidence/phase10-observation-bridges-v1/acquisition-round.json";
const EVIDENCE_ROOT = "evidence/phase10-observation-bridges-v1";
const PREFLIGHT_ROOT = "evidence/phase10-obligation-preflight-v1/packets";
const BUNDLE_ID = "phase10-observation-bridges-v1";
const BRANCH_IDS = Object.freeze(["B1a", "B1b", "B2", "B3", "B4", "B5"] as const);
type BranchId = typeof BRANCH_IDS[number];
type JsonObject = { readonly [key: string]: StrictJson };

interface BranchConfig {
  readonly branchId: BranchId;
  readonly packetId: string;
  readonly protocolSchema: string;
  readonly resultSchema: string;
  readonly protocolOutputPath: string;
  readonly registrationSha256: string;
  readonly eligibleOutcome: string;
  readonly terminalOutcome: "terminal-refusal" | "terminal-non-identification";
  readonly requiredOperands: readonly string[];
  readonly searchGroups: readonly string[];
  readonly maximumSearchPackets: number;
  readonly acquisitionAttemptIds: readonly string[];
  readonly checks: readonly string[];
  readonly outputs: readonly string[];
  readonly dependencies: readonly string[];
  readonly contract: JsonObject;
  readonly dispositions: Readonly<Record<string, { readonly status: string; readonly refusalClass: string | null; readonly reason: string }>>;
}

const CLAIM_BOUNDARY = Object.freeze({
  scopeCensusOnlyForAS: true,
  allOpenedSourceValuesArePhase10DevelopmentEvidence: true,
  quantitativeValidationEarned: false,
  phase7CreditEarned: false,
  phase8CreditEarned: false,
  phase9CreditEarned: false,
  heldOutComparisonExecuted: false,
  targetScoreProduced: false,
  solverPhysicsChanged: false,
  c1ThroughC5RowsProduced: false,
  habitRowsProduced: false,
  eObservationOperatorImplemented: false,
  fExternalRequestWrittenOrSent: false,
  hTransportImplemented: false,
  downstreamExecutionAuthorized: false,
  priorPhaseLabelsAndArtifactsPreserved: true,
} as const);

const deps = Object.freeze(["a-i", "a-p", "a-s", "b-acquisition"]);
const sourceUnavailable = (reason: string) => Object.freeze({ status: "source-incomplete", refusalClass: "source", reason });
const rightsBlocked = (reason: string) => Object.freeze({ status: "rights-blocked", refusalClass: "rights", reason });
const nonIdentifying = (reason: string) => Object.freeze({ status: "non-identifying", refusalClass: "non-identification", reason });
const satisfied = (reason: string) => Object.freeze({ status: "satisfied", refusalClass: null, reason });

const configurations: Readonly<Record<BranchId, BranchConfig>> = Object.freeze({
  B1a: {
    branchId: "B1a", packetId: "b1a", protocolSchema: "phase10-b1a-protocol-v1", resultSchema: "phase10-b1a-result-v1",
    protocolOutputPath: "research/phase10-b1a-protocol-v1.json", registrationSha256: "fcc9b4e5d6e947288aa749dad8f0a0226326320a57ad80327793b26391e00579",
    eligibleOutcome: "eligible-bridge", terminalOutcome: "terminal-refusal", maximumSearchPackets: 3,
    requiredOperands: ["B1A-COMPARISON-DOMAIN", "B1A-CURRENT-PRINCETON-EDITION", "B1A-PLANAR-FORCING-MAP", "B1A-UNCERTAINTY-TREATMENT"],
    searchGroups: ["B1A-SEARCH-CURRENT-MONOGRAPH", "B1A-SEARCH-FORCING-MAP", "B1A-SEARCH-UNCERTAINTY"],
    acquisitionAttemptIds: ["p10-acq-princeton-monograph-current-v1"], checks: phase10B1aCheckCaller(), dependencies: deps,
    outputs: ["out-b1a-protocol", "out-b1a-result", "out-b1a-return", "out-b1a-search", "out-b1a-verification"],
    contract: {
      schema: "phase10-b1a-contract-v1", apparatusForcing: "source-defined planar apparatus forcing", surfaceForcing: "surface supersaturation at the observed facet", mappingDefinition: "source-backed apparatus-to-surface map", validDomain: { domainId: "b1a-planar-facet-domain", description: "planar Sei–Gonda facet observations in the complete source domain", sourceRefIds: ["a-i-dispositions", "b-acquisition-round"] }, transferArgument: null, currentMonographComparison: "complete current Princeton edition required", uncertaintyMode: "non-statistical-sensitivity-envelope", modelInputUncertainty: null, observationUncertainty: null, sensitivityEnvelope: "predeclared bounded sensitivity only after forcing and source operands are complete",
    },
    dispositions: {
      "B1A-COMPARISON-DOMAIN": sourceUnavailable("The complete planar-facet source domain is not available for inspection."),
      "B1A-CURRENT-PRINCETON-EDITION": rightsBlocked("The frozen current-edition endpoint returned an access page; the partial preview cannot substitute."),
      "B1A-PLANAR-FORCING-MAP": sourceUnavailable("No complete eligible source supports the apparatus-to-surface forcing map."),
      "B1A-UNCERTAINTY-TREATMENT": Object.freeze({ status: "uncertainty-missing", refusalClass: "uncertainty", reason: "Source-backed uncertainty or an admissible sensitivity envelope cannot be instantiated without the complete forcing operands." }),
    },
  },
  B1b: {
    branchId: "B1b", packetId: "b1b", protocolSchema: "phase10-b1b-protocol-v1", resultSchema: "phase10-b1b-result-v1",
    protocolOutputPath: "research/phase10-b1b-protocol-v1.json", registrationSha256: "b6762abc7946283ba7d74a87406f60309990f6156e0d725285648937107c866c",
    eligibleOutcome: "eligible-bridge", terminalOutcome: "terminal-refusal", maximumSearchPackets: 5,
    requiredOperands: ["B1B-ASYMMETRIC-VAPOR-TRANSFER", "B1B-EVOLVING-GEOMETRY", "B1B-LOCAL-TEMPERATURE-FORCING", "B1B-LOCAL-VAPOR-FORCING", "B1B-MATCHED-CROSS-PRESSURE-OBSERVATION", "B1B-OBSERVATION-DOMAIN", "B1B-SUPPORT-HEAT-PATH"],
    searchGroups: ["B1B-SEARCH-ASYMMETRIC-TRANSFER", "B1B-SEARCH-CROSS-PRESSURE-OBSERVATION", "B1B-SEARCH-EVOLVING-GEOMETRY", "B1B-SEARCH-LOCAL-FORCING", "B1B-SEARCH-SUPPORT-HEAT-PATH"],
    acquisitionAttemptIds: [], checks: phase10B1bCheckCaller(), dependencies: deps,
    outputs: ["out-b1b-protocol", "out-b1b-result", "out-b1b-return", "out-b1b-search", "out-b1b-verification"],
    contract: {
      schema: "phase10-b1b-contract-v1", localVaporForcing: "source-backed local vapor forcing", localTemperatureForcing: "source-backed local temperature forcing", supportHeatPath: "source-backed support heat path", asymmetricVaporTransfer: "source-backed asymmetric transfer", evolvingGeometry: "source-backed evolving geometry", matchedCrossPressureObservation: "same-observable matched-pressure observation", observationDomain: { domainId: "b1b-supported-growth-domain", description: "supported ice growth with local forcing and geometry histories", sourceRefIds: ["a-i-dispositions"] }, analyticScalarComparison: null,
    },
    dispositions: Object.fromEntries(["B1B-ASYMMETRIC-VAPOR-TRANSFER", "B1B-EVOLVING-GEOMETRY", "B1B-LOCAL-TEMPERATURE-FORCING", "B1B-LOCAL-VAPOR-FORCING", "B1B-MATCHED-CROSS-PRESSURE-OBSERVATION", "B1B-OBSERVATION-DOMAIN", "B1B-SUPPORT-HEAT-PATH"].map((operand) => [operand, sourceUnavailable("All five registered B1b payloads are terminally refused by A-I because their governed private bytes were not verified as available.")])) as BranchConfig["dispositions"],
  },
  B2: {
    branchId: "B2", packetId: "b2", protocolSchema: "phase10-b2-protocol-v1", resultSchema: "phase10-b2-result-v1",
    protocolOutputPath: "research/phase10-b2-protocol-v1.json", registrationSha256: "f21c38a6cd6006a864c040c83391cc91573e20395cb900b4815908be8eceb091",
    eligibleOutcome: "eligible-dataset", terminalOutcome: "terminal-refusal", maximumSearchPackets: 1,
    requiredOperands: ["B2-CHARACTERISTIC-SIZE-COVERAGE", "B2-CONTROLLED-VELOCITY-DATASET", "B2-DENSITY-COVERAGE", "B2-DROPLET-STATE-COVERAGE", "B2-METHOD-COVERAGE", "B2-SPEED-COVERAGE", "B2-SUPPORT-STATE-COVERAGE", "B2-TEMPERATURE-COVERAGE", "B2-TIME-COVERAGE", "B2-VISCOSITY-COVERAGE"],
    searchGroups: ["B2-SEARCH-CONTROLLED-VELOCITY-DATASET"], acquisitionAttemptIds: ["p10-acq-keller-hallett-1982-v1"], checks: phase10B2CheckCaller(), dependencies: deps,
    outputs: ["out-b2-protocol", "out-b2-result", "out-b2-return", "out-b2-search", "out-b2-verification"],
    contract: {
      schema: "phase10-b2-contract-v1", datasetIdentity: "complete controlled-velocity dataset binding", intervalDefinition: "predeclared complete reported interval", densityCoverage: "interval-wide", viscosityCoverage: "interval-wide", speedCoverage: "interval-wide", characteristicSizeCoverage: "interval-wide", timeCoverage: "interval-wide", temperatureCoverage: "interval-wide", dropletStateCoverage: "interval-wide", supportStateCoverage: "interval-wide", methodCoverage: "complete source method", reynoldsDiagnostic: "diagnostic only; never a universal no-ventilation rule",
    },
    dispositions: Object.fromEntries(["B2-CHARACTERISTIC-SIZE-COVERAGE", "B2-CONTROLLED-VELOCITY-DATASET", "B2-DENSITY-COVERAGE", "B2-DROPLET-STATE-COVERAGE", "B2-METHOD-COVERAGE", "B2-SPEED-COVERAGE", "B2-SUPPORT-STATE-COVERAGE", "B2-TEMPERATURE-COVERAGE", "B2-TIME-COVERAGE", "B2-VISCOSITY-COVERAGE"].map((operand) => [operand, rightsBlocked("The exact Keller–Hallett endpoint returned an access page rather than the complete paper or dataset; purchase is not authorized.")])) as BranchConfig["dispositions"],
  },
  B3: {
    branchId: "B3", packetId: "b3", protocolSchema: "phase10-b3-protocol-v1", resultSchema: "phase10-b3-result-v1",
    protocolOutputPath: "research/phase10-b3-protocol-v1.json", registrationSha256: "04a44371531b82d16b6712c3e531ad6ef2a48986da858d90a71afc7e8d9fc79a",
    eligibleOutcome: "eligible-bridge", terminalOutcome: "terminal-non-identification", maximumSearchPackets: 6,
    requiredOperands: ["B3-CARRIER-GAS-AUDIT", "B3-GEOMETRY-CONTROL", "B3-HISTORY-CONTROL", "B3-ISONO-CURRENCY", "B3-LINEAGE", "B3-MATCHED-OBSERVATION", "B3-POINT-IDENTITY", "B3-PRESSURE-OR-GAS-INTERVENTION", "B3-SUPPORT-CONTROL", "B3-TEMPERATURE-CONFLICT-DISPOSITION", "B3-TEMPERATURE-CONTROL", "B3-TWO-READER-OPERATOR", "B3-UNCERTAINTY", "B3-VENTILATION-CONTROL", "B3-ZHAO-ROLE-AUDIT"],
    searchGroups: ["B3-SEARCH-CARRIER-GAS-MATERIALS", "B3-SEARCH-CROSSED-DESIGN", "B3-SEARCH-ISONO-CURRENCY", "B3-SEARCH-TEMPERATURE-CONFLICT", "B3-SEARCH-ZHAO-MAIN", "B3-SEARCH-ZHAO-S2"],
    acquisitionAttemptIds: ["p10-acq-zhao-2026-main-article-v1", "p10-acq-zhao-2026-s2-video-v1"], checks: phase10B3CheckCaller(), dependencies: deps,
    outputs: ["out-b3-protocol", "out-b3-result", "out-b3-return", "out-b3-search", "out-b3-verification"],
    contract: {
      schema: "phase10-b3-contract-v1", heldGeometry: "same geometry required", heldSupport: "same support required", heldTemperature: "same local temperature required", heldHistory: "same growth history required", heldVentilation: "same ventilation required", pressureGasIntervention: "one-factor pressure or crossed carrier-gas intervention", matchedObservation: "same observation operator and point identity", isonoCurrency: "closed A-I currency binding", twoReaderOperator: "two independent readers required for any extracted point", pointIdentity: "stable source and condition point ID", uncertainty: "source-backed or predeclared non-statistical envelope", lineage: "same apparatus and campaign lineage", temperatureConflictDisposition: "unresolved conflict blocks identification", carrierGasAudit: "carrier composition and role must be source-complete", zhaoRoleAudit: "main article, s001, and s002 have separate roles", identificationRule: "eligible only when every held axis and the intervention are source-complete",
    },
    dispositions: Object.fromEntries(["B3-CARRIER-GAS-AUDIT", "B3-GEOMETRY-CONTROL", "B3-HISTORY-CONTROL", "B3-ISONO-CURRENCY", "B3-LINEAGE", "B3-MATCHED-OBSERVATION", "B3-POINT-IDENTITY", "B3-PRESSURE-OR-GAS-INTERVENTION", "B3-SUPPORT-CONTROL", "B3-TEMPERATURE-CONFLICT-DISPOSITION", "B3-TEMPERATURE-CONTROL", "B3-TWO-READER-OPERATOR", "B3-UNCERTAINTY", "B3-VENTILATION-CONTROL", "B3-ZHAO-ROLE-AUDIT"].map((operand) => [operand, nonIdentifying("The A-I carrier-gas sources remain unavailable; Zhao S2 is bound, but its main article is rights-blocked, so no same-geometry crossed design can be identified.")])) as BranchConfig["dispositions"],
  },
  B4: {
    branchId: "B4", packetId: "b4", protocolSchema: "phase10-b4-protocol-v1", resultSchema: "phase10-b4-result-v1",
    protocolOutputPath: "research/phase10-b4-protocol-v1.json", registrationSha256: "8488767f8158180b6f97a72f29ee45290cb2cb7cd4b8384c72535ef1533f3bfa",
    eligibleOutcome: "eligible-bridge", terminalOutcome: "terminal-refusal", maximumSearchPackets: 2,
    requiredOperands: ["B4-FINAL-THEORY-ARTICLE", "B4-FORCING-SEMANTICS", "B4-MEASUREMENT-METHODS", "B4-ROLE-SEPARATION", "B4-SAME-LINEAGE-LINK"],
    searchGroups: ["B4-SEARCH-FINAL-THEORY", "B4-SEARCH-MEASUREMENT-METHODS"], acquisitionAttemptIds: ["p10-acq-hp26-final-article-v1", "p10-acq-pmh2025-methods-v1", "p10-acq-princeton-monograph-current-v1"], checks: phase10B4CheckCaller(), dependencies: deps,
    outputs: ["out-b4-protocol", "out-b4-result", "out-b4-return", "out-b4-search", "out-b4-verification"],
    contract: {
      schema: "phase10-b4-contract-v1", finalTheoryBinding: "complete HP26 final theory article", methodsBinding: "complete PMH2025 measurement Methods", roleSeparationRule: "theory and Methods cannot substitute for one another", forcingSemantics: "measurement forcing must come from Methods", sameLineageDefinition: "same apparatus, campaign, and observation lineage", theoryReplayOrRivalFit: "only after both independent roles and same-lineage operands are complete", mechanismRankingBlockers: ["B4-CURRENT-MONOGRAPH-COMPARISON", "B4-LATTICE-TO-WIDTH-MAP", "B4-MATCHED-TRANSPORT", "B4-NUMERIC-SPATIAL-OR-RIM-TRAJECTORIES", "B4-PHYSICAL-WIDTH"],
    },
    dispositions: {
      "B4-FINAL-THEORY-ARTICLE": rightsBlocked("The exact final-article endpoint returned access status 403."),
      "B4-FORCING-SEMANTICS": rightsBlocked("The complete measurement Methods source is rights-blocked."),
      "B4-MEASUREMENT-METHODS": rightsBlocked("The exact Methods endpoint returned access status 403."),
      "B4-ROLE-SEPARATION": satisfied("The frozen protocol keeps the final theory and measurement Methods roles separate."),
      "B4-SAME-LINEAGE-LINK": sourceUnavailable("The A-I datasets are unavailable and the complete Methods article is rights-blocked, so the lineage join cannot be established."),
    },
  },
  B5: {
    branchId: "B5", packetId: "b5", protocolSchema: "phase10-b5-protocol-v1", resultSchema: "phase10-b5-result-v1",
    protocolOutputPath: "research/phase10-b5-protocol-v1.json", registrationSha256: "66e7c1a4d03b1a2d09d26b81125913ebe6ba54e2557862170fb5975a11e4a97c",
    eligibleOutcome: "eligible-observable", terminalOutcome: "terminal-refusal", maximumSearchPackets: 4,
    requiredOperands: ["B5-ALL-ATTEMPTS-REPORTED", "B5-ELIGIBILITY-THRESHOLDS", "B5-FEATURE-ROSTER", "B5-LOCAL-FORCING", "B5-MATCHED-TRANSPORT", "B5-MEDIA-ROSTER", "B5-OBSERVATION-OPERATOR", "B5-REPEATABILITY-AND-UNCERTAINTY", "B5-SCALE-CALIBRATION", "B5-TIME-CALIBRATION"],
    searchGroups: ["B5-SEARCH-CALIBRATION-METADATA", "B5-SEARCH-FORCING-METADATA", "B5-SEARCH-MEDIA-COMPANION", "B5-SEARCH-TRANSPORT-METADATA"], acquisitionAttemptIds: ["p10-acq-zhao-2026-s2-video-v1"], checks: phase10B5CheckCaller(), dependencies: deps,
    outputs: ["out-b5-protocol", "out-b5-result", "out-b5-return", "out-b5-search", "out-b5-verification"],
    contract: {
      schema: "phase10-b5-contract-v1", mediaRoster: ["Zhao 2026 S2, bound but not numerically inspected"], featureRoster: ["trajectory or categorical surface-state feature, pending complete calibration"], scaleCalibration: "source-backed scale required", timeCalibration: "source-backed timebase required", extractionOperator: "frozen operator required before numeric inspection", repeatabilityMethod: "all attempts reported; no favorable selection", uncertaintyMethod: "source-backed or predeclared non-statistical envelope", eligibilityThresholds: "media, calibration, local forcing, transport, operator, and uncertainty all required", attemptRoster: [], allAttemptsRequired: true,
    },
    dispositions: {
      "B5-ALL-ATTEMPTS-REPORTED": satisfied("No numeric extraction attempt was authorized or executed, so the complete attempt roster is empty and reported."),
      "B5-ELIGIBILITY-THRESHOLDS": satisfied("The protocol freezes the conjunctive eligibility rule before any numeric media inspection."),
      "B5-FEATURE-ROSTER": sourceUnavailable("A usable feature roster cannot be completed from the bound S2 video without its rights-blocked main article and unavailable calibration sources."),
      "B5-LOCAL-FORCING": sourceUnavailable("Local forcing metadata is unavailable."),
      "B5-MATCHED-TRANSPORT": Object.freeze({ status: "transport-missing", refusalClass: "transport", reason: "No matched transport operand is available." }),
      "B5-MEDIA-ROSTER": sourceUnavailable("Zhao S2 is bound, but the other registered media candidates remain unavailable and the main article is rights-blocked."),
      "B5-OBSERVATION-OPERATOR": Object.freeze({ status: "operator-missing", refusalClass: "observation-operator", reason: "No calibrated observation operator can be instantiated before the source operands are complete." }),
      "B5-REPEATABILITY-AND-UNCERTAINTY": Object.freeze({ status: "uncertainty-missing", refusalClass: "uncertainty", reason: "Repeatability and uncertainty cannot be estimated without an eligible calibrated attempt roster." }),
      "B5-SCALE-CALIBRATION": Object.freeze({ status: "calibration-missing", refusalClass: "calibration", reason: "Scale calibration metadata is unavailable." }),
      "B5-TIME-CALIBRATION": Object.freeze({ status: "calibration-missing", refusalClass: "calibration", reason: "Time calibration metadata is unavailable." }),
    },
  },
});

function fail(message: string): never { throw new Error(`Phase 10 B branches refused: ${message}`); }
function sha256(bytes: Uint8Array): string { return createHash("sha256").update(bytes).digest("hex"); }
function git(root: string, args: readonly string[]): string {
  try { return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch (error) { fail(`git ${args.join(" ")} failed: ${error instanceof Error ? error.message : String(error)}`); }
}
function safePath(root: string, path: string): string {
  if (isAbsolute(path) || path.includes("\\") || path.startsWith("/") || path.split("/").some((part) => part === "" || part === "." || part === "..")) fail(`unsafe path ${path}`);
  const absolute = resolve(root, path); const displacement = relative(root, absolute);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) || isAbsolute(displacement)) fail(`path escapes root: ${path}`);
  return absolute;
}
function bytes(root: string, path: string): Uint8Array {
  const absolute = safePath(root, path); const status = lstatSync(absolute);
  if (!status.isFile() || status.isSymbolicLink()) fail(`${path} is not an ordinary file`);
  return new Uint8Array(readFileSync(absolute));
}
function json(root: string, path: string): StrictJson {
  try { return strictJsonSnapshot(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes(root, path))) as unknown); }
  catch (error) { fail(`${path} is not strict JSON: ${error instanceof Error ? error.message : String(error)}`); }
}
function pretty(value: unknown): Uint8Array { return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`); }
function identity(root: string, path: string): StrictJson { const value = bytes(root, path); return strictJsonSnapshot({ path, byteLength: value.byteLength, sha256: sha256(value) }); }
function writeExclusive(root: string, path: string, value: Uint8Array): void {
  const absolute = safePath(root, path); mkdirSync(dirname(absolute), { recursive: true });
  let fd: number | undefined;
  try { fd = openSync(absolute, "wx"); writeFileSync(fd, value); fsyncSync(fd); closeSync(fd); fd = undefined; }
  catch (error) { if (fd !== undefined) closeSync(fd); throw error; }
}
function writeOrMatch(root: string, path: string, value: Uint8Array): void {
  const absolute = safePath(root, path);
  if (existsSync(absolute)) { const old = bytes(root, path); if (old.byteLength !== value.byteLength || sha256(old) !== sha256(value)) fail(`existing ${path} differs`); return; }
  writeExclusive(root, path, value);
}
function assertRepository(root: string, requireClean: boolean): string {
  if (git(root, ["branch", "--show-current"]) !== EXPECTED_BRANCH) fail(`wrong branch`);
  if (process.version !== EXPECTED_RUNTIME) fail(`runtime ${process.version} differs`);
  if (requireClean) { const dirty = git(root, ["status", "--porcelain=v1", "--untracked-files=all"]); if (dirty !== "") fail(`repository must be clean: ${dirty.replaceAll("\n", " | ")}`); }
  return git(root, ["rev-parse", "HEAD"]);
}

function sourceBindings(root: string): StrictJson[] {
  return [
    { bindingId: "a-i-currency", sourceKind: "tracked-artifact", payloadId: null, artifact: identity(root, CURRENCY_PATH), privateSource: null, developmentEvidence: true },
    { bindingId: "a-i-dispositions", sourceKind: "tracked-artifact", payloadId: null, artifact: identity(root, DISPOSITIONS_PATH), privateSource: null, developmentEvidence: true },
    { bindingId: "b-acquisition-round", sourceKind: "tracked-artifact", payloadId: null, artifact: identity(root, ACQUISITION_PATH), privateSource: null, developmentEvidence: true },
  ].map(strictJsonSnapshot);
}
function searchGroupForOperand(config: BranchConfig, operandId: string, foundation: JsonObject): string | null {
  const registrations = foundation.branchRegistrations;
  if (!Array.isArray(registrations)) fail("foundation branch registrations differ");
  const registration = registrations.find((value) => (value as JsonObject).branchId === config.branchId) as JsonObject | undefined;
  if (registration === undefined || !Array.isArray(registration.searchOperandGroups)) fail(`${config.branchId} registration missing`);
  for (const value of registration.searchOperandGroups) {
    const group = value as JsonObject;
    if (Array.isArray(group.coversOperandIds) && group.coversOperandIds.includes(operandId)) return String(group.groupId);
  }
  return null;
}
function protocolArtifact(root: string, config: BranchConfig, protocolCommit: string): StrictJson {
  const foundation = json(root, FOUNDATION_PATH) as JsonObject;
  const sourceRefs = ["a-i-currency", "a-i-dispositions", "b-acquisition-round"];
  return strictJsonSnapshot({
    schema: config.protocolSchema,
    protocolId: `phase10-${config.packetId}-terminal-disposition-v1`,
    branchId: config.branchId,
    registrationSha256: config.registrationSha256,
    protocolCommit,
    frozenOn: "2026-08-25",
    sourceBindings: sourceBindings(root),
    operandRules: config.requiredOperands.map((operandId) => ({ operandId, required: true, searchGroupId: searchGroupForOperand(config, operandId, foundation), eligibilityUse: "required-conjunct" })),
    observationDomain: { domainId: `${config.packetId}-registered-domain`, description: "Rights-safe metadata domain bounded by A-I and the terminal six-target acquisition round.", sourceRefIds: sourceRefs },
    branchContract: config.contract,
    eligibilityRule: { ruleId: `${config.packetId}-all-required-operands`, conjunctiveOperandIds: config.requiredOperands, allowedNotApplicableOperandIds: [], description: "The eligible outcome requires every registered required operand; otherwise the named terminal refusal or non-identification outcome applies." },
    terminalOutcomeRule: { eligibleOutcome: config.eligibleOutcome, refusalOutcome: "terminal-refusal", nonIdentificationAllowed: config.branchId === "B3", categoricalOnlyAllowed: config.branchId === "B5" },
    outputRoster: config.outputs,
    checkRoster: config.checks,
    claimBoundary: CLAIM_BOUNDARY,
  });
}

function moduleIdentity(root: string, path: string): { readonly byteLength: number; readonly sha256: string } {
  const value = bytes(root, path); return Object.freeze({ byteLength: value.byteLength, sha256: sha256(value) });
}
function callable(callableId: string, role: string, modulePath: string, exportName: string, identityValue: ReturnType<typeof moduleIdentity>, producedOutputIds: readonly string[], invokedCheckIds: readonly string[], evaluatedCheckIds: readonly string[]): StrictJson {
  return strictJsonSnapshot({ callableId, role, resolution: "resolved", modulePath, exportName, identity: identityValue, producedOutputIds, invokedCheckIds, evaluatedCheckIds, executedNegativeControlIds: [] });
}
function packetAuthority(root: string, config: BranchConfig): { readonly protocol: StrictJson; readonly registry: StrictJson } {
  const schemaIdentity = identity(root, SCHEMA_REGISTRY_PATH) as JsonObject;
  const producerModule = "runner/src/phase10-b-branches.ts";
  const checkModule = "runner/src/phase10-b-branch-checks.ts";
  const verifierModule = "runner/src/phase10-b-branch-verify.ts";
  const suffix = config.branchId === "B1a" ? "B1a" : config.branchId === "B1b" ? "B1b" : config.branchId;
  const callables = [
    callable(`phase10-${config.packetId}-check-caller`, "check-caller", checkModule, `phase10${suffix}CheckCaller`, moduleIdentity(root, checkModule), [], config.checks, []),
    callable(`phase10-${config.packetId}-protocol-producer`, "producer", producerModule, `producePhase10${suffix}Protocol`, moduleIdentity(root, producerModule), [config.outputs[0]!], [], []),
    callable(`phase10-${config.packetId}-result-producer`, "producer", producerModule, `producePhase10${suffix}Result`, moduleIdentity(root, producerModule), config.outputs.slice(1, 4), [], []),
    callable(`phase10-${config.packetId}-verification-receipt-writer`, "producer", producerModule, `writePhase10${suffix}VerificationReceipt`, moduleIdentity(root, producerModule), [config.outputs[4]!], [], []),
    callable(`phase10-${config.packetId}-verifier`, "independent-evaluator", verifierModule, `phase10${suffix}Verify`, moduleIdentity(root, verifierModule), [], [], config.checks),
  ].sort((left, right) => String((left as JsonObject).callableId).localeCompare(String((right as JsonObject).callableId)));
  return Object.freeze({
    protocol: strictJsonSnapshot({ schema: "phase10-packet-protocol-v1", protocolId: `phase10-${config.packetId}-terminal-disposition-v1`, matrixId: "phase10-selected-package-obligations-v1", packetId: config.packetId, artifactSchemaRegistry: schemaIdentity, selectedBranches: [], registeredOutputIds: config.outputs, registeredCheckIds: config.checks, registeredNegativeControlIds: [], boundDependencyPacketIds: config.dependencies }),
    registry: strictJsonSnapshot({ schema: "phase10-callable-registry-v1", registryId: `phase10-${config.packetId}-resolved-callables-v1`, matrixId: "phase10-selected-package-obligations-v1", protocolId: `phase10-${config.packetId}-terminal-disposition-v1`, packetId: config.packetId, callables }),
  });
}

function aggregateAuthority(root: string): { readonly protocol: StrictJson; readonly registry: StrictJson } {
  const packetId = "b-aggregate";
  const outputs = ["out-b-artifact-index", "out-b-report", "out-b-return-proposals", "out-b-verification"];
  const checks = phase10BAggregateCheckCaller();
  const dependencies = ["a-p", "b-acquisition", "b1a", "b1b", "b2", "b3", "b4", "b5"];
  const producerModule = "runner/src/phase10-b-branches.ts";
  const checkModule = "runner/src/phase10-b-branch-checks.ts";
  const verifierModule = "runner/src/phase10-b-branch-verify.ts";
  const callables = [
    callable("phase10-b-aggregate-check-caller", "check-caller", checkModule, "phase10BAggregateCheckCaller", moduleIdentity(root, checkModule), [], checks, []),
    callable("phase10-b-aggregate-producer", "producer", producerModule, "producePhase10BAggregateArtifacts", moduleIdentity(root, producerModule), outputs.slice(0, 3), [], []),
    callable("phase10-b-aggregate-verification-receipt-writer", "producer", producerModule, "writePhase10BAggregateVerificationReceipt", moduleIdentity(root, producerModule), [outputs[3]!], [], []),
    callable("phase10-b-aggregate-verifier", "independent-evaluator", verifierModule, "phase10BAggregateVerify", moduleIdentity(root, verifierModule), [], [], checks),
  ].sort((left, right) => String((left as JsonObject).callableId).localeCompare(String((right as JsonObject).callableId)));
  return Object.freeze({
    protocol: strictJsonSnapshot({ schema: "phase10-packet-protocol-v1", protocolId: "phase10-b-aggregate-v1", matrixId: "phase10-selected-package-obligations-v1", packetId, artifactSchemaRegistry: identity(root, SCHEMA_REGISTRY_PATH), selectedBranches: [], registeredOutputIds: outputs, registeredCheckIds: checks, registeredNegativeControlIds: [], boundDependencyPacketIds: dependencies }),
    registry: strictJsonSnapshot({ schema: "phase10-callable-registry-v1", registryId: "phase10-b-aggregate-resolved-callables-v1", matrixId: "phase10-selected-package-obligations-v1", protocolId: "phase10-b-aggregate-v1", packetId, callables }),
  });
}

function freezeProtocols(root: string): StrictJson {
  const head = assertRepository(root, false);
  for (const branchId of BRANCH_IDS) {
    const config = configurations[branchId];
    writeExclusive(root, config.protocolOutputPath, pretty(protocolArtifact(root, config, head)));
    const authority = packetAuthority(root, config);
    writeExclusive(root, `research/phase10-execution-v1/packets/${config.packetId}/protocol.json`, pretty(authority.protocol));
    writeExclusive(root, `research/phase10-execution-v1/packets/${config.packetId}/callable-registry.json`, pretty(authority.registry));
  }
  const aggregate = aggregateAuthority(root);
  writeExclusive(root, "research/phase10-execution-v1/packets/b-aggregate/protocol.json", pretty(aggregate.protocol));
  writeExclusive(root, "research/phase10-execution-v1/packets/b-aggregate/callable-registry.json", pretty(aggregate.registry));
  return strictJsonSnapshot({ state: "protocols-frozen-for-commit", branches: BRANCH_IDS, protocolCommitPredecessor: head });
}

function protocolBinding(root: string, config: BranchConfig): StrictJson {
  const commit = git(root, ["log", "--diff-filter=A", "--format=%H", "-1", "--", config.protocolOutputPath]);
  if (!/^[0-9a-f]{40}$/u.test(commit)) fail(`${config.branchId} protocol is not committed`);
  const committed = new Uint8Array(execFileSync("git", ["show", `${commit}:${config.protocolOutputPath}`], { cwd: root, encoding: "buffer" }));
  const live = bytes(root, config.protocolOutputPath);
  if (sha256(committed) !== sha256(live) || committed.byteLength !== live.byteLength) fail(`${config.branchId} protocol changed after first commit`);
  return strictJsonSnapshot({ ...(identity(root, config.protocolOutputPath) as JsonObject), commit });
}
function produceBranchResult(root: string, config: BranchConfig, head: string, startedOn: string, endedOn: string): { readonly result: StrictJson; readonly search: StrictJson; readonly returned: StrictJson } {
  const binding = protocolBinding(root, config);
  const operands = config.requiredOperands.map((operandId) => ({ operandId, ...config.dispositions[operandId]!, supportingArtifactRefs: ["a-i-dispositions", "b-acquisition-round"] }));
  const blocking = operands.filter((row) => row.status !== "satisfied" && row.status !== "not-applicable").map((row) => row.operandId);
  const producerId = `phase10-${config.packetId}-result-producer`;
  const result = strictJsonSnapshot({
    schema: config.resultSchema, branchId: config.branchId, protocolBinding: binding, sourceBindings: sourceBindings(root), operandDispositions: operands,
    acquisitionAttemptIds: config.acquisitionAttemptIds, searchPacketIds: [], terminalOutcome: config.terminalOutcome, blockingOperandIds: blocking,
    downstreamCandidates: [], claimBoundary: CLAIM_BOUNDARY,
    producer: { producerId, commit: head, command: `node runner/src/phase10-b-branches.ts run-branches --repository-root .`, startedOn, endedOn, actualConcurrency: 1 },
  });
  const search = strictJsonSnapshot({ schema: "phase10-search-disposition-set-v1", branchId: config.branchId, freezeCommit: (binding as JsonObject).commit, registeredOperandGroupIds: config.searchGroups, packetCap: config.maximumSearchPackets, packets: [], unusedOperandGroupIds: config.searchGroups, aggregateDisposition: "not-applicable" });
  const returned = strictJsonSnapshot({ schema: "phase10-return-proposal-v1", branchId: config.branchId, candidate: null, reason: "The terminal branch disposition does not establish enough source-complete operands for an actionable E, F, or H proposal.", authorization: "none", claimBoundary: CLAIM_BOUNDARY });
  return Object.freeze({ result, search, returned });
}

function loadPreflight(root: string, config: BranchConfig): { readonly pass: Phase10ObligationPreflightPass; readonly matrix: StrictJson; readonly protocol: StrictJson; readonly registry: StrictJson } {
  const matrix = json(root, MATRIX_PATH);
  const protocolPath = `research/phase10-execution-v1/packets/${config.packetId}/protocol.json`;
  const registryPath = `research/phase10-execution-v1/packets/${config.packetId}/callable-registry.json`;
  const protocol = json(root, protocolPath); const registry = json(root, registryPath);
  const pass = phase10ObligationRunPreflight(matrix, protocol, registry, root);
  if (pass.packetId !== config.packetId || pass.outputIds.length !== config.outputs.length || pass.checkIds.length !== config.checks.length) fail(`${config.packetId} obligation preflight differs`);
  return Object.freeze({ pass, matrix, protocol, registry });
}
function dependencyBindings(root: string, dependencies: readonly string[]): StrictJson {
  const catalogue = json(root, PACKET_CATALOGUE_PATH) as JsonObject;
  if (!Array.isArray(catalogue.packets)) fail("packet catalogue differs");
  const packetRows = catalogue.packets;
  return strictJsonSnapshot(dependencies.map((packetId) => {
    const row = packetRows.find((value) => (value as JsonObject).packetId === packetId) as JsonObject | undefined;
    if (row === undefined) fail(`packet catalogue omits ${packetId}`);
    const terminalPath = String(row.terminalReceiptPath); const terminal = parsePhase10ExecutionReceipt(json(root, terminalPath));
    if (terminal.packetId !== packetId || !["pass", "complete", "refusal"].includes(terminal.terminalState)) fail(`${packetId} is not terminal`);
    const verificationPaths = row.verificationPaths as readonly StrictJson[];
    return { packetId, protocol: identity(root, String(row.protocolPath)), callableRegistry: identity(root, String(row.callableRegistryPath)), terminalReceipt: identity(root, terminalPath), verificationArtifacts: verificationPaths.map((path) => identity(root, String(path))) };
  }));
}
function preflightReceipt(root: string, config: BranchConfig, pass: Phase10ObligationPreflightPass, head: string, command: string): StrictJson {
  return strictJsonSnapshot({ schema: "phase10-preflight-receipt-v1", receiptId: `phase10-${config.packetId}-terminal-v1-preflight`, matrixId: pass.matrixId, protocolId: pass.protocolId, registryId: pass.registryId, packetId: config.packetId, attemptId: `${config.packetId}-terminal-v1`, stage: "run", observed: { launchClass: "deciding-extraction", machineLaunchChecks: "branch-clean-runtime-unique-output", branch: EXPECTED_BRANCH, head, runtime: process.version, command, repositoryBundleRoot: ".", attemptDirectory: `out/phase10-execution-v1/attempts/${config.packetId}/terminal-v1`, candidateDirectory: `out/phase10-execution-v1/attempts/${config.packetId}/terminal-v1/candidate`, registeredAttemptRoot: `out/phase10-execution-v1/attempts/${config.packetId}`, finalPreflightReceiptPath: `${PREFLIGHT_ROOT}/${config.packetId}/preflight.json`, finalTerminalReceiptPath: `${PREFLIGHT_ROOT}/${config.packetId}/terminal-receipt.json`, verificationPaths: [`${EVIDENCE_ROOT}/${config.packetId}-verification.json`], matrix: identity(root, MATRIX_PATH), protocol: identity(root, `research/phase10-execution-v1/packets/${config.packetId}/protocol.json`), callableRegistry: identity(root, `research/phase10-execution-v1/packets/${config.packetId}/callable-registry.json`), decidingProtocol: identity(root, config.protocolOutputPath), dependencyPacketIds: config.dependencies, dependencyArtifacts: dependencyBindings(root, config.dependencies) }, outputIds: pass.outputIds, checkIds: pass.checkIds, negativeControlIds: pass.negativeControlIds, callableIds: pass.callableIds, selectedBranches: pass.selectedBranches, verdict: "pass", reasons: [] });
}

function verificationFor(config: BranchConfig, options: Phase10BVerificationOptions): StrictJson {
  if (config.branchId === "B1a") return phase10B1aVerify(options);
  if (config.branchId === "B1b") return phase10B1bVerify(options);
  if (config.branchId === "B2") return phase10B2Verify(options);
  if (config.branchId === "B3") return phase10B3Verify(options);
  if (config.branchId === "B4") return phase10B4Verify(options);
  return phase10B5Verify(options);
}
function runBranches(root: string): StrictJson {
  const head = assertRepository(root, true); const command = "node runner/src/phase10-b-branches.ts run-branches --repository-root .";
  const completed: StrictJson[] = [];
  for (const branchId of BRANCH_IDS) {
    const config = configurations[branchId]; const authority = loadPreflight(root, config);
    const attempt = `out/phase10-execution-v1/attempts/${config.packetId}/terminal-v1`; const candidate = `${attempt}/candidate`;
    if (existsSync(safePath(root, attempt))) fail(`${config.packetId} attempt already exists`);
    const finals = [config.protocolOutputPath, `${EVIDENCE_ROOT}/${config.packetId}-result.json`, `${EVIDENCE_ROOT}/${config.packetId}-return.json`, `${EVIDENCE_ROOT}/${config.packetId}-search.json`, `${EVIDENCE_ROOT}/${config.packetId}-verification.json`, `${PREFLIGHT_ROOT}/${config.packetId}/preflight.json`, `${PREFLIGHT_ROOT}/${config.packetId}/terminal-receipt.json`];
    for (const path of finals.slice(1)) if (existsSync(safePath(root, path))) fail(`${path} already exists`);
    mkdirSync(safePath(root, candidate), { recursive: true });
    const preflight = preflightReceipt(root, config, authority.pass, head, command); writeExclusive(root, `${attempt}/preflight.json`, pretty(preflight));
    const startedOn = new Date().toISOString(); const produced = produceBranchResult(root, config, head, startedOn, new Date().toISOString());
    writeExclusive(root, `${candidate}/result.json`, pretty(produced.result)); writeExclusive(root, `${candidate}/return.json`, pretty(produced.returned)); writeExclusive(root, `${candidate}/search.json`, pretty(produced.search));
    const verification = verificationFor(config, { repositoryRoot: root, bundleDirectory: candidate, command, gitHead: head, startedOn: new Date().toISOString(), endedOn: new Date().toISOString() });
    writeExclusive(root, `${candidate}/verification.json`, pretty(verification));
    const terminal = strictJsonSnapshot({ schema: "phase10-execution-receipt-v1", receiptId: `phase10-${config.packetId}-terminal-v1`, matrixId: authority.pass.matrixId, protocolId: authority.pass.protocolId, registryId: authority.pass.registryId, packetId: config.packetId, terminalState: config.terminalOutcome === "terminal-non-identification" ? "refusal" : "refusal", producedOutputIds: config.outputs, executedCheckIds: config.checks, evaluatedCheckIds: config.checks, executedNegativeControlIds: [], boundDependencyPacketIds: config.dependencies });
    phase10ObligationReceiptPreflight(authority.matrix, authority.protocol, authority.registry, terminal, root);
    writeOrMatch(root, `${EVIDENCE_ROOT}/${config.packetId}-result.json`, bytes(root, `${candidate}/result.json`));
    writeOrMatch(root, `${EVIDENCE_ROOT}/${config.packetId}-return.json`, bytes(root, `${candidate}/return.json`));
    writeOrMatch(root, `${EVIDENCE_ROOT}/${config.packetId}-search.json`, bytes(root, `${candidate}/search.json`));
    writeOrMatch(root, `${EVIDENCE_ROOT}/${config.packetId}-verification.json`, bytes(root, `${candidate}/verification.json`));
    writeOrMatch(root, `${PREFLIGHT_ROOT}/${config.packetId}/preflight.json`, bytes(root, `${attempt}/preflight.json`));
    writeOrMatch(root, `${PREFLIGHT_ROOT}/${config.packetId}/terminal-receipt.json`, pretty(terminal));
    completed.push(strictJsonSnapshot({ packetId: config.packetId, terminalState: "refusal", checkCount: config.checks.length }));
  }
  return strictJsonSnapshot({ state: "branches-published", packets: completed });
}

function artifactEntry(root: string, artifactId: string, path: string, role: string, producedBy: string): StrictJson {
  const value = identity(root, path) as JsonObject; return strictJsonSnapshot({ artifactId, path: path.replace(`${EVIDENCE_ROOT}/`, ""), mediaType: "application/json", byteLength: value.byteLength, sha256: value.sha256, role, producedBy });
}
function produceAggregate(root: string, head: string, startedOn: string, endedOn: string): { readonly report: StrictJson; readonly returns: StrictJson; readonly index: StrictJson } {
  const results = BRANCH_IDS.map((branchId) => json(root, `${EVIDENCE_ROOT}/${configurations[branchId].packetId}-result.json`) as JsonObject);
  const searches = BRANCH_IDS.map((branchId) => json(root, `${EVIDENCE_ROOT}/${configurations[branchId].packetId}-search.json`) as JsonObject);
  const proposals = BRANCH_IDS.map((branchId) => json(root, `${EVIDENCE_ROOT}/${configurations[branchId].packetId}-return.json`));
  const acquisition = json(root, ACQUISITION_PATH) as JsonObject;
  const unresolved = [...new Set(results.flatMap((row) => row.blockingOperandIds as readonly string[]))].sort();
  const branchResultBindings = BRANCH_IDS.map((branchId) => identity(root, `${EVIDENCE_ROOT}/${configurations[branchId].packetId}-result.json`));
  const producer = { producerId: "phase10-b-aggregate-producer", commit: head, command: "node runner/src/phase10-b-branches.ts run-aggregate --repository-root .", startedOn, endedOn, actualConcurrency: 1 };
  const returns = strictJsonSnapshot({ schema: "phase10-return-proposals-v1", bundleId: BUNDLE_ID, proposals, executedKinds: [], authorization: "none", claimBoundary: CLAIM_BOUNDARY });
  const reportArtifacts = BRANCH_IDS.flatMap((branchId) => {
    const packetId = configurations[branchId].packetId;
    return [artifactEntry(root, `${packetId}-result`, `${EVIDENCE_ROOT}/${packetId}-result.json`, "terminal branch result", `phase10-${packetId}-result-producer`), artifactEntry(root, `${packetId}-search`, `${EVIDENCE_ROOT}/${packetId}-search.json`, "terminal search disposition", `phase10-${packetId}-result-producer`)];
  });
  const report = strictJsonSnapshot({ schema: "phase10-observation-bridge-report-v1", bundleId: BUNDLE_ID, foundationFreeze: identity(root, FOUNDATION_PATH), branchResultBindings, acquisitionSummary: { targetCount: Array.isArray(acquisition.targets) ? acquisition.targets.length : 0, acquiredCount: Array.isArray(acquisition.targets) ? acquisition.targets.filter((row) => (row as JsonObject).terminalDisposition === "acquired-and-bound").length : 0, terminalDisposition: acquisition.terminalDisposition }, searchSummary: BRANCH_IDS.map((branchId, index) => ({ branchId, registered: configurations[branchId].searchGroups.length, executed: Array.isArray(searches[index]!.packets) ? searches[index]!.packets.length : 0, unused: Array.isArray(searches[index]!.unusedOperandGroupIds) ? searches[index]!.unusedOperandGroupIds.length : 0, terminal: true })), terminalBranchOutcomes: results.map((row) => ({ branchId: row.branchId, terminalOutcome: row.terminalOutcome })), unresolvedOperands: unresolved, claimBoundary: CLAIM_BOUNDARY, artifacts: reportArtifacts, producer });
  const reportBytes = pretty(report); const returnsBytes = pretty(returns);
  const index = strictJsonSnapshot({ schema: "phase10-artifact-index-v1", bundleId: BUNDLE_ID, artifacts: [
    { artifactId: "out-b-report", path: "report.json", mediaType: "application/json", byteLength: reportBytes.byteLength, sha256: sha256(reportBytes), role: "aggregate observation-bridge report", producedBy: "phase10-b-aggregate-producer" },
    { artifactId: "out-b-return-proposals", path: "return-proposals.json", mediaType: "application/json", byteLength: returnsBytes.byteLength, sha256: sha256(returnsBytes), role: "return-only E/F/H proposal dispositions", producedBy: "phase10-b-aggregate-producer" },
  ] });
  return Object.freeze({ report, returns, index });
}
function runAggregate(root: string): StrictJson {
  const head = assertRepository(root, true); const config = { packetId: "b-aggregate", outputs: ["out-b-artifact-index", "out-b-report", "out-b-return-proposals", "out-b-verification"], checks: phase10BAggregateCheckCaller(), dependencies: ["a-p", "b-acquisition", "b1a", "b1b", "b2", "b3", "b4", "b5"] } as const;
  const matrix = json(root, MATRIX_PATH); const protocol = json(root, "research/phase10-execution-v1/packets/b-aggregate/protocol.json"); const registry = json(root, "research/phase10-execution-v1/packets/b-aggregate/callable-registry.json");
  const pass = phase10ObligationRunPreflight(matrix, protocol, registry, root); const attempt = "out/phase10-execution-v1/attempts/b-aggregate/terminal-v1"; const candidate = `${attempt}/candidate`;
  if (existsSync(safePath(root, attempt))) fail("b-aggregate attempt already exists");
  for (const name of ["artifact-index.json", "report.json", "return-proposals.json", "verification.json"]) if (existsSync(safePath(root, `${EVIDENCE_ROOT}/${name}`))) fail(`aggregate ${name} exists`);
  mkdirSync(safePath(root, candidate), { recursive: true });
  const command = "node runner/src/phase10-b-branches.ts run-aggregate --repository-root .";
  const pseudoConfig = { ...configurations.B1a, packetId: config.packetId, outputs: config.outputs, checks: config.checks, dependencies: config.dependencies, protocolOutputPath: "research/phase10-execution-v1/packets/b-aggregate/protocol.json" };
  writeExclusive(root, `${attempt}/preflight.json`, pretty(preflightReceipt(root, pseudoConfig, pass, head, command)));
  const startedOn = new Date().toISOString(); const produced = produceAggregate(root, head, startedOn, new Date().toISOString());
  writeExclusive(root, `${candidate}/report.json`, pretty(produced.report)); writeExclusive(root, `${candidate}/return-proposals.json`, pretty(produced.returns)); writeExclusive(root, `${candidate}/artifact-index.json`, pretty(produced.index));
  const verification = phase10BAggregateVerify({ repositoryRoot: root, bundleDirectory: candidate, command, gitHead: head, startedOn: new Date().toISOString(), endedOn: new Date().toISOString() }); writeExclusive(root, `${candidate}/verification.json`, pretty(verification));
  const terminal = strictJsonSnapshot({ schema: "phase10-execution-receipt-v1", receiptId: "phase10-b-aggregate-terminal-v1", matrixId: pass.matrixId, protocolId: pass.protocolId, registryId: pass.registryId, packetId: config.packetId, terminalState: "refusal", producedOutputIds: config.outputs, executedCheckIds: config.checks, evaluatedCheckIds: config.checks, executedNegativeControlIds: [], boundDependencyPacketIds: config.dependencies });
  phase10ObligationReceiptPreflight(matrix, protocol, registry, terminal, root);
  for (const name of ["artifact-index.json", "report.json", "return-proposals.json", "verification.json"]) writeOrMatch(root, `${EVIDENCE_ROOT}/${name}`, bytes(root, `${candidate}/${name}`));
  writeOrMatch(root, `${PREFLIGHT_ROOT}/b-aggregate/preflight.json`, bytes(root, `${attempt}/preflight.json`)); writeOrMatch(root, `${PREFLIGHT_ROOT}/b-aggregate/terminal-receipt.json`, pretty(terminal));
  return strictJsonSnapshot({ state: "aggregate-published", terminalState: "refusal", checkCount: config.checks.length });
}

export const producePhase10B1aProtocol = (root: string, commit: string): StrictJson => protocolArtifact(root, configurations.B1a, commit);
export const producePhase10B1bProtocol = (root: string, commit: string): StrictJson => protocolArtifact(root, configurations.B1b, commit);
export const producePhase10B2Protocol = (root: string, commit: string): StrictJson => protocolArtifact(root, configurations.B2, commit);
export const producePhase10B3Protocol = (root: string, commit: string): StrictJson => protocolArtifact(root, configurations.B3, commit);
export const producePhase10B4Protocol = (root: string, commit: string): StrictJson => protocolArtifact(root, configurations.B4, commit);
export const producePhase10B5Protocol = (root: string, commit: string): StrictJson => protocolArtifact(root, configurations.B5, commit);
export const producePhase10B1aResult = (root: string, head: string, startedOn: string, endedOn: string) => produceBranchResult(root, configurations.B1a, head, startedOn, endedOn);
export const producePhase10B1bResult = (root: string, head: string, startedOn: string, endedOn: string) => produceBranchResult(root, configurations.B1b, head, startedOn, endedOn);
export const producePhase10B2Result = (root: string, head: string, startedOn: string, endedOn: string) => produceBranchResult(root, configurations.B2, head, startedOn, endedOn);
export const producePhase10B3Result = (root: string, head: string, startedOn: string, endedOn: string) => produceBranchResult(root, configurations.B3, head, startedOn, endedOn);
export const producePhase10B4Result = (root: string, head: string, startedOn: string, endedOn: string) => produceBranchResult(root, configurations.B4, head, startedOn, endedOn);
export const producePhase10B5Result = (root: string, head: string, startedOn: string, endedOn: string) => produceBranchResult(root, configurations.B5, head, startedOn, endedOn);
export const writePhase10B1aVerificationReceipt = (options: Phase10BVerificationOptions) => phase10B1aVerify(options);
export const writePhase10B1bVerificationReceipt = (options: Phase10BVerificationOptions) => phase10B1bVerify(options);
export const writePhase10B2VerificationReceipt = (options: Phase10BVerificationOptions) => phase10B2Verify(options);
export const writePhase10B3VerificationReceipt = (options: Phase10BVerificationOptions) => phase10B3Verify(options);
export const writePhase10B4VerificationReceipt = (options: Phase10BVerificationOptions) => phase10B4Verify(options);
export const writePhase10B5VerificationReceipt = (options: Phase10BVerificationOptions) => phase10B5Verify(options);
export const producePhase10BAggregateArtifacts = (root: string, head: string, startedOn: string, endedOn: string) => produceAggregate(root, head, startedOn, endedOn);
export const writePhase10BAggregateVerificationReceipt = (options: Phase10BVerificationOptions) => phase10BAggregateVerify(options);

async function main(): Promise<void> {
  try {
    const argv = process.argv.slice(2); if (argv.length !== 3 || !["freeze-protocols", "run-branches", "run-aggregate"].includes(argv[0] ?? "") || argv[1] !== "--repository-root") fail("usage: freeze-protocols|run-branches|run-aggregate --repository-root <path>");
    const root = realpathSync.native(resolve(argv[2]!)); const result = argv[0] === "freeze-protocols" ? freezeProtocols(root) : argv[0] === "run-branches" ? runBranches(root) : runAggregate(root); console.log(JSON.stringify(result));
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
