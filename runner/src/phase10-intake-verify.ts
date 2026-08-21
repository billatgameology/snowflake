import { existsSync, lstatSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  assertBranchAndClean,
  assertCommittedInputAtHead,
  assertOnlyFrozenInputsChangedSinceFreeze,
  identityOf,
  loadIntakeAuthority,
  parseStrictJsonFile,
  readRegularFile,
  safeRepositoryPath,
  type IntakeAuthority,
} from "./phase10-intake-authority.ts";
import {
  PHASE10_AI_BUNDLE_ID,
  PHASE10_AI_CHECK_IDS,
  PHASE10_AI_CHECK_WITNESSES,
  PHASE10_AI_CLAIM_BOUNDARY,
  PHASE10_AI_DECISIONS_PATH,
  PHASE10_AI_DECISION_VALIDATION_PATH,
  PHASE10_AI_OBSERVATIONS_PATH,
  PHASE10_AI_OBSERVATION_VALIDATION_PATH,
  PHASE10_AI_OUTPUTS,
  PHASE10_AI_PACKET_PROTOCOL_PATH,
  PHASE10_AI_PRODUCE_COMMAND,
  PHASE10_AI_REOPEN_TRIGGERS,
  PHASE10_AI_SEMANTIC_REVIEW_PATH,
  PHASE10_AI_VERIFY_COMMAND,
  PHASE10_AI_VERIFICATION_LIMITS,
  artifactTuple,
  jsonlBytes,
  lexical,
  parseCurrencySnapshot,
  parseFoundationIntake,
  parseIntakeDecisionInput,
  parseIntakeObservations,
  parseIntakeSemanticReview,
  parsePrettyJsonBytes,
  parseTrackedIntakeFiles,
  prettyJsonBytes,
  sha256Bytes,
  type ArtifactIndexEntry,
  type ArtifactTuple,
  type CurrencySnapshotRow,
  type FileCustodyRow,
  type IntakeDecisionInput,
  type IntakeDispositionRow,
  type IntakeObservations,
  type IntakeSemanticReview,
} from "./phase10-intake-contracts.ts";
import { phase10AICheckCaller } from "./phase10-intake-checks.ts";
import {
  assertPhase10IntakeDecisionSupport,
  reopenPhase10IntakeRaw,
} from "./phase10-intake-observe-verify.ts";
import { writePhase10IntakeVerificationReceipt } from "./phase10-intake-verification-receipt.ts";

const CANDIDATE_DIRECTORY = "out/phase10-scope-intake-v1-a-i-candidate" as const;
const AI_INTAKE_PROTOCOL_IDENTITY = Object.freeze({ path: "research/phase10-execution-v1/packets/a-i/intake-protocol.json", byteLength: 26443, sha256: "6adffffdbd02b7e023072f2e096909f43ee557b1fcd45e7a0d7f52107f36fe78" });
const PRODUCER_ID = "phase10-a-i-producer" as const;
const PRODUCER_NAMES = Object.freeze(PHASE10_AI_OUTPUTS.filter((entry) => entry.outputId !== "out-ai-verification").map((entry) => entry.candidateName));
const ALLOWED_CANDIDATE_NAMES = new Set([...PRODUCER_NAMES, "preflight.json", "intake-verification.json", "terminal-receipt.json"]);

export interface Phase10AIValidatedArtifact {
  readonly outputId: string;
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10AICheckResult {
  readonly checkId: typeof PHASE10_AI_CHECK_IDS[number];
  readonly verdict: "pass" | "fail" | "refusal";
  readonly reasons: readonly string[];
  readonly witnessOutputIds: readonly string[];
}

export interface Phase10AIIndependentEvaluation {
  readonly verdict: "pass" | "fail" | "refusal";
  readonly verifiedArtifacts: readonly Phase10AIValidatedArtifact[];
  readonly checkResults: readonly Phase10AICheckResult[];
  readonly executedNegativeControlIds: readonly string[];
  readonly negativeControlResults: readonly StrictJson[];
}

function fail(message: string): never {
  throw new Error(`Phase 10 A-I independent verification refused: ${message}`);
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(lexical);
  const wanted = [...expected].sort(lexical);
  if (actual.length !== wanted.length || actual.some((entry, index) => entry !== wanted[index])) fail(`${label} keys differ`);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((entry, index) => entry === right[index]);
}

function tuple(path: string, bytes: Uint8Array): ArtifactTuple {
  return Object.freeze({ path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) });
}

function sameTuple(actual: ArtifactTuple, expected: ArtifactTuple, label: string): void {
  if (actual.path !== expected.path || actual.byteLength !== expected.byteLength || actual.sha256 !== expected.sha256) fail(`${label} differs`);
}

function rosterSha(value: unknown): string {
  return sha256Bytes(new TextEncoder().encode(JSON.stringify(strictJsonSnapshot(value))));
}

function timestamp(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) || Number.isNaN(Date.parse(value))) fail(`${label} is not an exact UTC timestamp`);
  return value;
}

function indexEntry(artifactId: string, path: string, mediaType: string, bytes: Uint8Array, role: string): ArtifactIndexEntry {
  return Object.freeze({ artifactId, path, mediaType, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes), role, producedBy: PRODUCER_ID });
}

function readInputChain(authority: IntakeAuthority): {
  readonly decisions: IntakeDecisionInput;
  readonly observations: IntakeObservations;
  readonly review: IntakeSemanticReview;
  readonly reviewIdentity: ArtifactTuple;
} {
  const root = authority.repositoryRoot;
  const decisionBytes = assertCommittedInputAtHead(root, PHASE10_AI_DECISIONS_PATH, "committed A-I decisions");
  const observationBytes = assertCommittedInputAtHead(root, PHASE10_AI_OBSERVATIONS_PATH, "committed A-I observations");
  const reviewBytes = assertCommittedInputAtHead(root, PHASE10_AI_SEMANTIC_REVIEW_PATH, "committed A-I semantic review");
  const decisions = parseIntakeDecisionInput(parseStrictJsonFile(decisionBytes, "A-I decisions"), authority.protocol);
  const observations = parseIntakeObservations(parseStrictJsonFile(observationBytes, "A-I observations"), authority.protocol);
  const review = parseIntakeSemanticReview(parseStrictJsonFile(reviewBytes, "A-I semantic review"));
  const rawArtifacts = reopenPhase10IntakeRaw(root, observations);
  assertPhase10IntakeDecisionSupport(root, decisions, observations);
  const observationReceiptBytes = readRegularFile(root, PHASE10_AI_OBSERVATION_VALIDATION_PATH, "observation validation receipt");
  const decisionReceiptBytes = readRegularFile(root, PHASE10_AI_DECISION_VALIDATION_PATH, "decision validation receipt");
  const observationReceipt = object(parseStrictJsonFile(observationReceiptBytes, "observation validation receipt"), "observation validation receipt");
  exactKeys(observationReceipt, ["schema", "validationId", "protocol", "protocolFreezeCommit", "observations", "rawArtifacts", "exactQueryCount", "nasState", "verdict", "limits"], "observation validation receipt");
  if (observationReceipt.schema !== "phase10-ai-observation-validation-v1" || observationReceipt.verdict !== "pass" || observationReceipt.protocolFreezeCommit !== authority.freezeCommit || observationReceipt.exactQueryCount !== 24 || observationReceipt.nasState !== observations.existingNasVerification.state) fail("observation validation receipt is stale or non-passing");
  sameTuple(artifactTuple(observationReceipt.protocol, "observation receipt protocol"), AI_INTAKE_PROTOCOL_IDENTITY, "observation receipt protocol");
  sameTuple(artifactTuple(observationReceipt.observations, "observation receipt observations"), tuple(PHASE10_AI_OBSERVATIONS_PATH, observationBytes), "observation receipt observations");
  const receiptRaw = Array.isArray(observationReceipt.rawArtifacts) ? observationReceipt.rawArtifacts.map((entry, index) => artifactTuple(entry, `observation receipt raw ${index}`)) : fail("observation receipt raw roster is malformed");
  if (receiptRaw.length !== rawArtifacts.length || receiptRaw.some((entry, index) => {
    const expected = rawArtifacts[index];
    return expected === undefined || entry.path !== expected.path || entry.byteLength !== expected.byteLength || entry.sha256 !== expected.sha256;
  })) fail("observation receipt raw roster is stale");
  const decisionReceipt = object(parseStrictJsonFile(decisionReceiptBytes, "decision validation receipt"), "decision validation receipt");
  exactKeys(decisionReceipt, ["schema", "validationId", "protocol", "protocolFreezeCommit", "observations", "decisions", "payloadCount", "selectedLineageCount", "structuralVerdict", "semanticReviewRequired", "limits"], "decision validation receipt");
  if (decisionReceipt.schema !== "phase10-ai-decision-validation-v1" || decisionReceipt.structuralVerdict !== "pass" || decisionReceipt.semanticReviewRequired !== true || decisionReceipt.protocolFreezeCommit !== authority.freezeCommit || decisionReceipt.payloadCount !== 14 || decisionReceipt.selectedLineageCount !== 12) fail("decision validation receipt is stale or non-passing");
  sameTuple(artifactTuple(decisionReceipt.protocol, "decision receipt protocol"), AI_INTAKE_PROTOCOL_IDENTITY, "decision receipt protocol");
  sameTuple(artifactTuple(decisionReceipt.observations, "decision receipt observations"), tuple(PHASE10_AI_OBSERVATIONS_PATH, observationBytes), "decision receipt observations");
  sameTuple(artifactTuple(decisionReceipt.decisions, "decision receipt decisions"), tuple(PHASE10_AI_DECISIONS_PATH, decisionBytes), "decision receipt decisions");
  sameTuple(review.protocol, AI_INTAKE_PROTOCOL_IDENTITY, "semantic review protocol");
  sameTuple(review.decisions, tuple(PHASE10_AI_DECISIONS_PATH, decisionBytes), "semantic review decisions");
  sameTuple(review.observations, tuple(PHASE10_AI_OBSERVATIONS_PATH, observationBytes), "semantic review observations");
  sameTuple(review.observationValidationReceipt, tuple(PHASE10_AI_OBSERVATION_VALIDATION_PATH, observationReceiptBytes), "semantic review observation validation");
  sameTuple(review.decisionValidationReceipt, tuple(PHASE10_AI_DECISION_VALIDATION_PATH, decisionReceiptBytes), "semantic review decision validation");
  if (review.rawArtifacts.length !== rawArtifacts.length || review.rawArtifacts.some((entry, index) => {
    const expected = rawArtifacts[index];
    return expected === undefined || entry.path !== expected.path || entry.byteLength !== expected.byteLength || entry.sha256 !== expected.sha256;
  })) fail("semantic review raw roster differs from reopened bytes");
  if (review.reviewedOn < decisions.decidedOn || review.reviewedOn < observations.observedOn) fail("semantic review predates its inputs");
  return Object.freeze({ decisions, observations, review, reviewIdentity: tuple(PHASE10_AI_SEMANTIC_REVIEW_PATH, reviewBytes) });
}

function deriveCustody(authority: IntakeAuthority, foundationValue: StrictJson, trackedValue: StrictJson): readonly FileCustodyRow[] {
  const foundation = parseFoundationIntake(foundationValue);
  const tracked = parseTrackedIntakeFiles(trackedValue);
  if (tracked.map((entry) => entry.path).join("\0") !== foundation.custodyFilePaths.join("\0")) fail("24-file tracked/foundation roster differs");
  if (rosterSha(tracked.map((entry) => ({ path: entry.path, role: entry.role, byteLength: entry.byteLength, sha256: entry.sha256 }))) !== authority.protocol.custodyTupleRosterSha256) fail("24-file tuple digest differs");
  if (rosterSha(foundation.sourcePayloads.map((entry) => ({ payloadId: entry.payloadId, path: entry.path, byteLength: entry.byteLength, sha256: entry.sha256 }))) !== authority.protocol.sourcePayloadTupleRosterSha256) fail("14-payload tuple digest differs");
  const payloadByPath = new Map(foundation.sourcePayloads.map((entry) => [entry.path, entry] as const));
  const rows = tracked.map((entry, index) => {
    const payload = payloadByPath.get(entry.path);
    if (payload !== undefined && (payload.byteLength !== entry.byteLength || payload.sha256 !== entry.sha256 || payload.intakeRole !== entry.role)) fail(`${entry.path} source tuple differs`);
    const custodyClass = entry.path.startsWith("sources/") ? "source-payload" : entry.path.startsWith("raw-acquisition/") ? "raw-acquisition-history" : entry.path.startsWith("provenance/") ? "acquisition-metadata" : fail(`${entry.path} has no frozen custody class`);
    return Object.freeze({
      schema: "phase10-file-custody-row-v1" as const,
      custodyEntryId: `phase10-ai-custody-${String(index + 1).padStart(2, "0")}`,
      custodyBinding: Object.freeze({ intakeArtifact: authority.protocol.trackedIntake, collectionId: "post-phase9-intake@2026-08-13", ownerManifest: authority.protocol.existingOwnerManifest, relativePath: entry.path, role: entry.role, byteLength: entry.byteLength, sha256: entry.sha256 }),
      custodyClass,
      payloadId: payload?.payloadId ?? null,
    });
  });
  if (rows.length !== 24 || rows.filter((entry) => entry.custodyClass === "source-payload").length !== 14 || rows.filter((entry) => entry.custodyClass === "raw-acquisition-history").length !== 1 || rows.filter((entry) => entry.custodyClass === "acquisition-metadata").length !== 9) fail("custody denominators differ");
  return Object.freeze(rows);
}

function deriveDispositions(decisions: IntakeDecisionInput, custody: readonly FileCustodyRow[]): readonly IntakeDispositionRow[] {
  const bindings = new Map(custody.filter((entry) => entry.payloadId !== null).map((entry) => [entry.payloadId!, entry.custodyBinding] as const));
  return Object.freeze(decisions.dispositions.map((decision) => {
    const custodyBinding = bindings.get(decision.payloadId);
    if (custodyBinding === undefined) fail(`${decision.payloadId} lacks custody`);
    return Object.freeze({ schema: "phase10-intake-disposition-row-v1" as const, payloadId: decision.payloadId, custodyBinding, identity: decision.identity, version: decision.version, rights: decision.rights, lineage: decision.lineage, duplicate: decision.duplicate, purpose: decision.purpose, eligibility: decision.eligibility, openedByPhase10: decision.openedByPhase10, terminal: decision.terminal });
  }));
}

function deriveCurrencyIndependently(
  authority: IntakeAuthority,
  decisions: IntakeDecisionInput,
  observations: IntakeObservations,
): readonly CurrencySnapshotRow[] {
  const executions = new Map(observations.queryExecutions.map((entry) => [entry.queryId, entry] as const));
  return Object.freeze(authority.protocol.lineagePlan.map((plan) => {
    const decision = decisions.currencyDecisions.find((entry) => entry.lineageId === plan.lineageId);
    if (decision === undefined) fail(`${plan.lineageId} has no independently reopened currency decision`);
    return parseCurrencySnapshot({
      schema: "phase10-currency-snapshot-row-v1",
      snapshotId: decision.snapshotId,
      lineageId: plan.lineageId,
      selectedByBranches: plan.selectedByBranches,
      seedPayloadIds: plan.seedPayloadIds,
      cutoffDate: plan.cutoffDate,
      dateWindow: plan.dateWindow,
      queries: plan.queries.map((query) => {
        const execution = executions.get(query.queryId);
        if (execution === undefined) fail(`${query.queryId} has no independently reopened execution`);
        return Object.freeze({ queryId: query.queryId, serviceId: query.serviceId, endpoint: query.endpoint, query: query.query, executedOn: execution.startedOn.slice(0, 10) });
      }),
      candidates: decision.candidates,
      correctionStatus: decision.correctionStatus,
      versionStatus: decision.versionStatus,
      supplementStatus: decision.supplementStatus,
      nativeDataStatus: decision.nativeDataStatus,
      laterOutputStatus: decision.laterOutputStatus,
      terminalDisposition: decision.terminalDisposition,
      reopenTriggers: [...PHASE10_AI_REOPEN_TRIGGERS].sort(lexical),
      closed: true,
    }, `independent currency snapshot ${plan.lineageId}`);
  }));
}

function candidateFiles(root: string, candidateRelative: string): ReadonlyMap<string, Uint8Array> {
  if (candidateRelative !== CANDIDATE_DIRECTORY) fail("candidate path differs from frozen verify command");
  const candidate = safeRepositoryPath(root, candidateRelative, "A-I verification candidate");
  const stat = lstatSync(candidate);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("candidate is not a non-symlink directory");
  const names = readdirSync(candidate).sort(lexical);
  if (names.some((name) => !ALLOWED_CANDIDATE_NAMES.has(name))) fail("candidate contains an unknown file");
  const result = new Map<string, Uint8Array>();
  for (const name of PRODUCER_NAMES) {
    const relativePath = `${candidateRelative}/${name}`;
    if (!existsSync(resolve(candidate, name))) fail(`candidate lacks ${name}`);
    result.set(name, readRegularFile(root, relativePath, `candidate ${name}`));
  }
  return result;
}

function expectedOutputs(authority: IntakeAuthority, inputs: ReturnType<typeof readInputChain>, actual: ReadonlyMap<string, Uint8Array>): ReadonlyMap<string, Uint8Array> {
  const foundation = parseStrictJsonFile(readRegularFile(authority.repositoryRoot, authority.protocol.foundationFreeze.path, "Phase 10 foundation"), "Phase 10 foundation");
  const tracked = parseStrictJsonFile(readRegularFile(authority.repositoryRoot, authority.protocol.trackedIntake.path, "tracked intake"), "tracked intake");
  const custody = deriveCustody(authority, foundation, tracked);
  const dispositions = deriveDispositions(inputs.decisions, custody);
  const currency = deriveCurrencyIndependently(authority, inputs.decisions, inputs.observations);
  const fileCustodyBytes = jsonlBytes(custody);
  const dispositionsBytes = jsonlBytes(dispositions);
  const currencyBytes = jsonlBytes(currency);
  const actualReport = object(parsePrettyJsonBytes(actual.get("intake-report.json")!, "A-I report"), "A-I report");
  exactKeys(actualReport, ["schema", "bundleId", "foundationFreeze", "protocolBinding", "counts", "nasVerification", "currencySummary", "claimBoundary", "artifacts", "producer"], "A-I report");
  const producer = object(actualReport.producer, "A-I report producer");
  exactKeys(producer, ["producerId", "commit", "command", "startedOn", "endedOn", "actualConcurrency"], "A-I report producer");
  const startedOn = timestamp(producer.startedOn, "A-I report producer.startedOn");
  const endedOn = timestamp(producer.endedOn, "A-I report producer.endedOn");
  if (endedOn < startedOn || producer.producerId !== PRODUCER_ID || producer.commit !== authority.head || producer.command !== PHASE10_AI_PRODUCE_COMMAND || producer.actualConcurrency !== 1) fail("A-I report producer provenance differs");
  const reportArtifacts = Object.freeze([
    indexEntry("out-ai-currency", "currency.jsonl", "application/x-ndjson", currencyBytes, "closed per-work currency snapshots"),
    indexEntry("out-ai-dispositions", "post-freeze-dispositions.jsonl", "application/x-ndjson", dispositionsBytes, "terminal 14-payload dispositions"),
    indexEntry("out-ai-file-custody", "file-custody.jsonl", "application/x-ndjson", fileCustodyBytes, "exact 24-file custody projection"),
    Object.freeze({ artifactId: "dependency-a-s-verification", path: "scope-verification.json", mediaType: "application/json", byteLength: authority.scopeDependency.verification.byteLength, sha256: authority.scopeDependency.verification.sha256, role: "required completed A-S scope dependency", producedBy: "phase10-as-verification-receipt-writer" }),
  ].sort((left, right) => lexical(left.artifactId, right.artifactId)));
  const reportBytes = prettyJsonBytes(Object.freeze({
    schema: "phase10-intake-report-v1",
    bundleId: PHASE10_AI_BUNDLE_ID,
    foundationFreeze: authority.protocol.foundationFreeze,
    protocolBinding: Object.freeze({ ...AI_INTAKE_PROTOCOL_IDENTITY, commit: authority.freezeCommit }),
    counts: Object.freeze({ trackedCustodyFiles: 24, sourcePayloads: 14, rawAcquisitionHistoryFiles: 1, acquisitionMetadataFiles: 9, nasAggregateFiles: 26, trackedAndNasScopesDistinct: true }),
    nasVerification: Object.freeze({ existingCollection: inputs.observations.existingNasVerification, newCollection: inputs.observations.newNasCollection, scopeDependency: authority.scopeDependency }),
    currencySummary: Object.freeze({ selectedLineageIds: Object.freeze(currency.map((entry) => entry.lineageId)), snapshotCount: currency.length, standingWatchAuthorized: false, reopenTriggers: Object.freeze([...PHASE10_AI_REOPEN_TRIGGERS]), semanticReview: inputs.reviewIdentity }),
    claimBoundary: PHASE10_AI_CLAIM_BOUNDARY,
    artifacts: reportArtifacts,
    producer: Object.freeze({ producerId: PRODUCER_ID, commit: authority.head, command: PHASE10_AI_PRODUCE_COMMAND, startedOn, endedOn, actualConcurrency: 1 }),
  }));
  const indexArtifacts = Object.freeze([
    indexEntry("out-ai-currency", "currency.jsonl", "application/x-ndjson", currencyBytes, "closed per-work currency snapshots"),
    indexEntry("out-ai-dispositions", "post-freeze-dispositions.jsonl", "application/x-ndjson", dispositionsBytes, "terminal 14-payload dispositions"),
    indexEntry("out-ai-file-custody", "file-custody.jsonl", "application/x-ndjson", fileCustodyBytes, "exact 24-file custody projection"),
    indexEntry("out-ai-report", "intake-report.json", "application/json", reportBytes, "A-I aggregate report"),
  ].sort((left, right) => lexical(left.artifactId, right.artifactId)));
  return new Map([
    ["currency.jsonl", currencyBytes],
    ["post-freeze-dispositions.jsonl", dispositionsBytes],
    ["file-custody.jsonl", fileCustodyBytes],
    ["intake-report.json", reportBytes],
    ["intake-artifact-index.json", prettyJsonBytes(Object.freeze({ schema: "phase10-artifact-index-v1", bundleId: PHASE10_AI_BUNDLE_ID, artifacts: indexArtifacts }))],
  ]);
}

function passingCheckResults(): readonly Phase10AICheckResult[] {
  const results = phase10AICheckCaller((checkId): Phase10AICheckResult => Object.freeze({ checkId, verdict: "pass" as const, reasons: Object.freeze([]), witnessOutputIds: PHASE10_AI_CHECK_WITNESSES[checkId] }));
  if (results.length !== PHASE10_AI_CHECK_IDS.length || results.some((entry, index) => entry.checkId !== PHASE10_AI_CHECK_IDS[index])) fail("registered check caller did not execute the exact ordered check roster");
  return Object.freeze(results);
}

/** Independently reopen and rederive all five producer artifacts without importing the producer or check caller. */
export function phase10IntakeVerify(request: { readonly repositoryRoot: string; readonly candidateDirectory: string; readonly allowPublishedOutputs?: boolean }): Phase10AIIndependentEvaluation {
  const root = resolve(request.repositoryRoot);
  assertBranchAndClean(root, request.allowPublishedOutputs === true ? [
    ...PHASE10_AI_OUTPUTS.map((entry) => entry.path),
    "evidence/phase10-obligation-preflight-v1/packets/a-i/preflight.json",
    "evidence/phase10-obligation-preflight-v1/packets/a-i/terminal-receipt.json",
  ] : []);
  const authority = loadIntakeAuthority(root, AI_INTAKE_PROTOCOL_IDENTITY);
  assertOnlyFrozenInputsChangedSinceFreeze(authority);
  const inputs = readInputChain(authority);
  const actual = candidateFiles(root, request.candidateDirectory);
  const expected = expectedOutputs(authority, inputs, actual);
  for (const [name, expectedBytes] of expected) {
    const actualBytes = actual.get(name);
    if (actualBytes === undefined || !sameBytes(actualBytes, expectedBytes)) fail(`${name} differs from independent reconstruction`);
  }
  const verifiedArtifacts = Object.freeze(PHASE10_AI_OUTPUTS.filter((entry) => entry.outputId !== "out-ai-verification").map((entry) => {
    const bytes = actual.get(entry.candidateName)!;
    return Object.freeze({ outputId: entry.outputId, path: entry.path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) });
  }).sort((left, right) => lexical(left.outputId, right.outputId)));
  return Object.freeze({ verdict: "pass", verifiedArtifacts, checkResults: passingCheckResults(), executedNegativeControlIds: Object.freeze([]), negativeControlResults: Object.freeze([]) });
}

function exactOptions(argv: readonly string[], names: readonly string[]): Readonly<Record<string, string>> {
  if (argv.length !== names.length * 2) fail("verify command has the wrong argument count");
  const allowed = new Set(names);
  const result: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === undefined || value === undefined || !flag.startsWith("--")) fail("verify command has malformed arguments");
    const name = flag.slice(2);
    if (!allowed.has(name) || Object.hasOwn(result, name)) fail(`verify command has unknown or duplicate ${flag}`);
    result[name] = value;
  }
  return Object.freeze(result);
}

function main(argv: readonly string[]): void {
  if (argv[0] !== "verify") fail("usage: verify --repository-root ROOT --protocol PROTOCOL --bundle BUNDLE --receipt RECEIPT");
  const options = exactOptions(argv.slice(1), ["repository-root", "protocol", "bundle", "receipt"]);
  if (options.protocol !== PHASE10_AI_PACKET_PROTOCOL_PATH || options.bundle !== CANDIDATE_DIRECTORY || options.receipt !== `${CANDIDATE_DIRECTORY}/intake-verification.json`) fail("verify paths differ from the frozen command");
  const startedOn = new Date().toISOString();
  const evaluation = phase10IntakeVerify({ repositoryRoot: options["repository-root"]!, candidateDirectory: options.bundle! });
  const root = resolve(options["repository-root"]!);
  const head = loadIntakeAuthority(root, AI_INTAKE_PROTOCOL_IDENTITY).head;
  const receipt = writePhase10IntakeVerificationReceipt({ repositoryRoot: root, candidateDirectory: options.bundle!, evaluation, command: PHASE10_AI_VERIFY_COMMAND, gitHead: head, startedOn, endedOn: new Date().toISOString() });
  process.stdout.write(`${JSON.stringify({ state: "verified", verdict: receipt.aggregateVerdict, checkCount: receipt.checkResults.length })}\n`);
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  try { main(process.argv.slice(2)); } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
