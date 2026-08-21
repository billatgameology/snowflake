import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { canonicalJson, strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
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
  PHASE10_AI_CLAIM_BOUNDARY,
  PHASE10_AI_DECISIONS_PATH,
  PHASE10_AI_DECISION_VALIDATION_PATH,
  PHASE10_AI_OBSERVATIONS_PATH,
  PHASE10_AI_OBSERVATION_VALIDATION_PATH,
  PHASE10_AI_OUTPUTS,
  PHASE10_AI_PACKET_PROTOCOL_PATH,
  PHASE10_AI_PRODUCER_OUTPUT_IDS,
  PHASE10_AI_PRODUCE_COMMAND,
  PHASE10_AI_REOPEN_TRIGGERS,
  PHASE10_AI_SEMANTIC_REVIEW_PATH,
  PHASE10_AI_STATIC_ATTEMPT_ID,
  PHASE10_AI_VERIFY_COMMAND,
  artifactTuple,
  composeCurrencySnapshots,
  jsonlBytes,
  lexical,
  parseCurrencySnapshot,
  parseFileCustodyRow,
  parseFoundationIntake,
  parseIntakeDecisionInput,
  parseIntakeDispositionRow,
  parseIntakeObservations,
  parseIntakeSemanticReview,
  parseJsonlBytes,
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
import {
  publishPhase10StaticPacketReceipts,
  validatePhase10StaticPacketReceiptsForPublication,
  writePhase10StaticPreflightReceipt,
  writePhase10StaticTerminalReceipt,
} from "./phase10-static-packet-receipts.ts";
import { phase10IntakeVerify } from "./phase10-intake-verify.ts";
import { writePhase10IntakeVerificationReceipt } from "./phase10-intake-verification-receipt.ts";

const PRODUCER_ID = "phase10-a-i-producer";
const AI_INTAKE_PROTOCOL_IDENTITY = Object.freeze({ path: "research/phase10-execution-v1/packets/a-i/intake-protocol.json", byteLength: 26443, sha256: "6adffffdbd02b7e023072f2e096909f43ee557b1fcd45e7a0d7f52107f36fe78" });
const PUBLISHED_DIRECTORY = "evidence/phase10-scope-intake-v1";
const CANDIDATE_DIRECTORY = "out/phase10-scope-intake-v1-a-i-candidate";
const EXPECTED_EXISTING_NAMES = Object.freeze([
  "phase8a-overlay.jsonl",
  "phase8b-overlay.jsonl",
  "scope-artifact-index.json",
  "scope-report.json",
  "scope-verification.json",
]);
const AI_NAMES = Object.freeze(PHASE10_AI_OUTPUTS.map((entry) => entry.candidateName).sort(lexical));

export interface Phase10IntakeBundle {
  readonly custodyRows: readonly FileCustodyRow[];
  readonly dispositionRows: readonly IntakeDispositionRow[];
  readonly currencyRows: readonly CurrencySnapshotRow[];
  readonly fileCustodyBytes: Uint8Array;
  readonly dispositionsBytes: Uint8Array;
  readonly currencyBytes: Uint8Array;
  readonly reportBytes: Uint8Array;
  readonly artifactIndexBytes: Uint8Array;
}

interface ProducerInputs {
  readonly authority: IntakeAuthority;
  readonly decisions: IntakeDecisionInput;
  readonly observations: IntakeObservations;
  readonly semanticReview: IntakeSemanticReview;
  readonly semanticReviewIdentity: ArtifactTuple;
  readonly foundationValue: StrictJson;
  readonly trackedIntakeValue: StrictJson;
  readonly startedOn: string;
  readonly endedOn: string;
}

function fail(message: string): never {
  throw new Error(`Phase 10 A-I producer refused: ${message}`);
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

function retainedProducerTimes(repositoryRoot: string, candidateRelative: string): { readonly startedOn: string; readonly endedOn: string } | null {
  const relativePath = `${candidateRelative}/intake-report.json`;
  const target = safeRepositoryPath(repositoryRoot, relativePath, "retained A-I report");
  if (!existsSync(target)) return null;
  const report = object(parsePrettyJsonBytes(readRegularFile(repositoryRoot, relativePath, "retained A-I report"), "retained A-I report"), "retained A-I report");
  const producer = object(report.producer, "retained A-I report producer");
  const startedOn = producer.startedOn;
  const endedOn = producer.endedOn;
  if (typeof startedOn !== "string" || typeof endedOn !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(startedOn) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(endedOn) || Number.isNaN(Date.parse(startedOn)) || Number.isNaN(Date.parse(endedOn)) || endedOn < startedOn) fail("retained A-I producer timestamps are malformed");
  return Object.freeze({ startedOn, endedOn });
}

function tuple(path: string, bytes: Uint8Array): ArtifactTuple {
  return Object.freeze({ path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) });
}

function rosterSha(value: unknown): string {
  return sha256Bytes(new TextEncoder().encode(JSON.stringify(strictJsonSnapshot(value))));
}

function indexEntry(artifactId: string, path: string, mediaType: string, bytes: Uint8Array, role: string, producedBy = PRODUCER_ID): ArtifactIndexEntry {
  return Object.freeze({ artifactId, path, mediaType, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes), role, producedBy });
}

function sameTuple(actual: ArtifactTuple, expected: ArtifactTuple, label: string): void {
  if (actual.path !== expected.path || actual.byteLength !== expected.byteLength || actual.sha256 !== expected.sha256) fail(`${label} differs`);
}

function validateInputReceipts(repositoryRoot: string, decisionsBytes: Uint8Array, observationsBytes: Uint8Array, reviewBytes: Uint8Array): IntakeSemanticReview {
  const observationReceiptBytes = readRegularFile(repositoryRoot, PHASE10_AI_OBSERVATION_VALIDATION_PATH, "observation validation receipt");
  const observationReceipt = object(parseStrictJsonFile(observationReceiptBytes, "observation validation receipt"), "observation validation receipt");
  exactKeys(observationReceipt, ["schema", "validationId", "protocol", "protocolFreezeCommit", "observations", "rawArtifacts", "exactQueryCount", "nasState", "verdict", "limits"], "observation validation receipt");
  if (observationReceipt.schema !== "phase10-ai-observation-validation-v1" || observationReceipt.verdict !== "pass") fail("observation validation receipt is not pass");
  const observationBinding = object(observationReceipt.observations, "observation receipt binding");
  if (observationBinding.path !== PHASE10_AI_OBSERVATIONS_PATH || observationBinding.byteLength !== observationsBytes.byteLength || observationBinding.sha256 !== sha256Bytes(observationsBytes)) fail("observation validation receipt is stale");
  const rawArtifacts = Array.isArray(observationReceipt.rawArtifacts) ? observationReceipt.rawArtifacts.map((entry, index) => artifactTuple(entry, `observation raw artifact ${index}`)) : fail("observation validation raw roster is malformed");
  if (rawArtifacts.length !== 25 || rawArtifacts.some((entry, index) => index > 0 && rawArtifacts[index - 1]!.path >= entry.path)) fail("observation validation raw roster differs");
  for (const raw of rawArtifacts) sameTuple(identityOf(repositoryRoot, raw.path, `retained raw input ${raw.path}`), raw, `retained raw input ${raw.path}`);
  const decisionReceiptBytes = readRegularFile(repositoryRoot, PHASE10_AI_DECISION_VALIDATION_PATH, "decision validation receipt");
  const decisionReceipt = object(parseStrictJsonFile(decisionReceiptBytes, "decision validation receipt"), "decision validation receipt");
  exactKeys(decisionReceipt, ["schema", "validationId", "protocol", "protocolFreezeCommit", "observations", "decisions", "payloadCount", "selectedLineageCount", "structuralVerdict", "semanticReviewRequired", "limits"], "decision validation receipt");
  if (decisionReceipt.schema !== "phase10-ai-decision-validation-v1" || decisionReceipt.structuralVerdict !== "pass" || decisionReceipt.semanticReviewRequired !== true) fail("decision validation receipt is not structural pass with review retained");
  const decisionBinding = object(decisionReceipt.decisions, "decision receipt binding");
  if (decisionBinding.path !== PHASE10_AI_DECISIONS_PATH || decisionBinding.byteLength !== decisionsBytes.byteLength || decisionBinding.sha256 !== sha256Bytes(decisionsBytes)) fail("decision validation receipt is stale");
  const review = parseIntakeSemanticReview(parseStrictJsonFile(reviewBytes, "A-I semantic review"));
  sameTuple(review.protocol, AI_INTAKE_PROTOCOL_IDENTITY, "semantic review protocol binding");
  sameTuple(review.decisions, tuple(PHASE10_AI_DECISIONS_PATH, decisionsBytes), "semantic review decision binding");
  sameTuple(review.observations, tuple(PHASE10_AI_OBSERVATIONS_PATH, observationsBytes), "semantic review observation binding");
  sameTuple(review.observationValidationReceipt, tuple(PHASE10_AI_OBSERVATION_VALIDATION_PATH, observationReceiptBytes), "semantic review observation-validation binding");
  sameTuple(review.decisionValidationReceipt, tuple(PHASE10_AI_DECISION_VALIDATION_PATH, decisionReceiptBytes), "semantic review decision-validation binding");
  if (review.rawArtifacts.length !== rawArtifacts.length || review.rawArtifacts.some((entry, index) => {
    const expected = rawArtifacts[index];
    return expected === undefined || entry.path !== expected.path || entry.byteLength !== expected.byteLength || entry.sha256 !== expected.sha256;
  })) fail("semantic review raw roster differs from retained validated bytes");
  return review;
}

function custodyRows(inputs: ProducerInputs): readonly FileCustodyRow[] {
  const foundation = parseFoundationIntake(inputs.foundationValue);
  const tracked = parseTrackedIntakeFiles(inputs.trackedIntakeValue);
  if (tracked.map((entry) => entry.path).join("\0") !== foundation.custodyFilePaths.join("\0")) fail("tracked 24-file path roster differs from foundation");
  const custodyProjection = tracked.map((entry) => ({ path: entry.path, role: entry.role, byteLength: entry.byteLength, sha256: entry.sha256 }));
  if (rosterSha(custodyProjection) !== inputs.authority.protocol.custodyTupleRosterSha256) fail("tracked 24-file tuple roster digest differs from foundation");
  const sourceProjection = foundation.sourcePayloads.map((entry) => ({ payloadId: entry.payloadId, path: entry.path, byteLength: entry.byteLength, sha256: entry.sha256 }));
  if (rosterSha(sourceProjection) !== inputs.authority.protocol.sourcePayloadTupleRosterSha256) fail("14-payload tuple roster digest differs from foundation");
  const payloadByPath = new Map(foundation.sourcePayloads.map((entry) => [entry.path, entry] as const));
  return Object.freeze(tracked.map((entry, index) => {
    const payload = payloadByPath.get(entry.path);
    if (payload !== undefined && (payload.byteLength !== entry.byteLength || payload.sha256 !== entry.sha256 || payload.intakeRole !== entry.role)) fail(`${entry.path} source tuple differs from foundation`);
    const custodyClass = entry.path.startsWith("sources/") ? "source-payload" : entry.path.startsWith("raw-acquisition/") ? "raw-acquisition-history" : entry.path.startsWith("provenance/") ? "acquisition-metadata" : fail(`${entry.path} has an unregistered custody class`);
    return Object.freeze({
      schema: "phase10-file-custody-row-v1",
      custodyEntryId: `phase10-ai-custody-${String(index + 1).padStart(2, "0")}`,
      custodyBinding: Object.freeze({ intakeArtifact: inputs.authority.protocol.trackedIntake, collectionId: "post-phase9-intake@2026-08-13", ownerManifest: inputs.authority.protocol.existingOwnerManifest, relativePath: entry.path, role: entry.role, byteLength: entry.byteLength, sha256: entry.sha256 }),
      custodyClass,
      payloadId: payload?.payloadId ?? null,
    } satisfies FileCustodyRow);
  }));
}

function dispositionRows(decisions: IntakeDecisionInput, custody: readonly FileCustodyRow[]): readonly IntakeDispositionRow[] {
  const custodyByPayload = new Map(custody.filter((entry) => entry.payloadId !== null).map((entry) => [entry.payloadId!, entry.custodyBinding] as const));
  return Object.freeze(decisions.dispositions.map((decision) => {
    const binding = custodyByPayload.get(decision.payloadId);
    if (binding === undefined) fail(`${decision.payloadId} has no source custody row`);
    return Object.freeze({ schema: "phase10-intake-disposition-row-v1", payloadId: decision.payloadId, custodyBinding: binding, identity: decision.identity, version: decision.version, rights: decision.rights, lineage: decision.lineage, duplicate: decision.duplicate, purpose: decision.purpose, eligibility: decision.eligibility, openedByPhase10: decision.openedByPhase10, terminal: decision.terminal });
  }));
}

/** Deterministically project two committed rights-safe inputs into the five producer artifacts. */
export function producePhase10IntakeArtifacts(inputs: ProducerInputs): Phase10IntakeBundle {
  const custody = custodyRows(inputs);
  const dispositions = dispositionRows(inputs.decisions, custody);
  const currency = composeCurrencySnapshots(inputs.decisions, inputs.observations, inputs.authority.protocol);
  const fileCustodyBytes = jsonlBytes(custody);
  const dispositionsBytes = jsonlBytes(dispositions);
  const currencyBytes = jsonlBytes(currency);
  const reportArtifacts = Object.freeze([
    indexEntry("out-ai-currency", "currency.jsonl", "application/x-ndjson", currencyBytes, "closed per-work currency snapshots"),
    indexEntry("out-ai-dispositions", "post-freeze-dispositions.jsonl", "application/x-ndjson", dispositionsBytes, "terminal 14-payload dispositions"),
    indexEntry("out-ai-file-custody", "file-custody.jsonl", "application/x-ndjson", fileCustodyBytes, "exact 24-file custody projection"),
    Object.freeze({ artifactId: "dependency-a-s-verification", path: "scope-verification.json", mediaType: "application/json", byteLength: inputs.authority.scopeDependency.verification.byteLength, sha256: inputs.authority.scopeDependency.verification.sha256, role: "required completed A-S scope dependency", producedBy: "phase10-as-verification-receipt-writer" }),
  ].sort((left, right) => lexical(left.artifactId, right.artifactId)));
  const report = Object.freeze({
    schema: "phase10-intake-report-v1",
    bundleId: PHASE10_AI_BUNDLE_ID,
    foundationFreeze: inputs.authority.protocol.foundationFreeze,
    protocolBinding: Object.freeze({ ...AI_INTAKE_PROTOCOL_IDENTITY, commit: inputs.authority.freezeCommit }),
    counts: Object.freeze({ trackedCustodyFiles: 24, sourcePayloads: 14, rawAcquisitionHistoryFiles: 1, acquisitionMetadataFiles: 9, nasAggregateFiles: 26, trackedAndNasScopesDistinct: true }),
    nasVerification: Object.freeze({
      existingCollection: inputs.observations.existingNasVerification,
      newCollection: inputs.observations.newNasCollection,
      scopeDependency: inputs.authority.scopeDependency,
    }),
    currencySummary: Object.freeze({ selectedLineageIds: Object.freeze(currency.map((entry) => entry.lineageId)), snapshotCount: currency.length, standingWatchAuthorized: false, reopenTriggers: Object.freeze([...PHASE10_AI_REOPEN_TRIGGERS]), semanticReview: inputs.semanticReviewIdentity }),
    claimBoundary: PHASE10_AI_CLAIM_BOUNDARY,
    artifacts: reportArtifacts,
    producer: Object.freeze({ producerId: PRODUCER_ID, commit: inputs.authority.head, command: PHASE10_AI_PRODUCE_COMMAND, startedOn: inputs.startedOn, endedOn: inputs.endedOn, actualConcurrency: 1 }),
  });
  const reportBytes = prettyJsonBytes(report);
  const indexArtifacts = Object.freeze([
    indexEntry("out-ai-currency", "currency.jsonl", "application/x-ndjson", currencyBytes, "closed per-work currency snapshots"),
    indexEntry("out-ai-dispositions", "post-freeze-dispositions.jsonl", "application/x-ndjson", dispositionsBytes, "terminal 14-payload dispositions"),
    indexEntry("out-ai-file-custody", "file-custody.jsonl", "application/x-ndjson", fileCustodyBytes, "exact 24-file custody projection"),
    indexEntry("out-ai-report", "intake-report.json", "application/json", reportBytes, "A-I aggregate report"),
  ].sort((left, right) => lexical(left.artifactId, right.artifactId)));
  const artifactIndexBytes = prettyJsonBytes(Object.freeze({ schema: "phase10-artifact-index-v1", bundleId: PHASE10_AI_BUNDLE_ID, artifacts: indexArtifacts }));
  return Object.freeze({ custodyRows: custody, dispositionRows: dispositions, currencyRows: currency, fileCustodyBytes, dispositionsBytes, currencyBytes, reportBytes, artifactIndexBytes });
}

function writeCandidate(repositoryRoot: string, candidateRelative: string, bundle: Phase10IntakeBundle): void {
  const candidate = safeRepositoryPath(repositoryRoot, candidateRelative, "A-I candidate");
  const existing = readdirSync(candidate).sort(lexical);
  const files = new Map<string, Uint8Array>([
    ["currency.jsonl", bundle.currencyBytes],
    ["post-freeze-dispositions.jsonl", bundle.dispositionsBytes],
    ["file-custody.jsonl", bundle.fileCustodyBytes],
    ["intake-report.json", bundle.reportBytes],
    ["intake-artifact-index.json", bundle.artifactIndexBytes],
  ]);
  const allowed = new Set(["preflight.json", ...files.keys()]);
  if (!existing.includes("preflight.json") || existing.some((name) => !allowed.has(name))) fail("candidate contains files outside the exact resumable producer set");
  for (const [name, bytes] of files) {
    const target = resolve(candidate, name);
    if (existsSync(target)) {
      const stat = lstatSync(target);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || !sameBytes(new Uint8Array(readFileSync(target)), bytes)) fail(`retained partial ${name} differs from the exact derived bytes`);
      continue;
    }
    writeFileSync(target, bytes, { flag: "wx" });
    if (!sameBytes(new Uint8Array(readFileSync(target)), bytes)) fail(`retained partial ${name} readback differs`);
  }
}

function readCandidate(repositoryRoot: string, candidateRelative: string): ReadonlyMap<string, Uint8Array> {
  const candidate = safeRepositoryPath(repositoryRoot, candidateRelative, "A-I candidate");
  const stat = lstatSync(candidate);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("candidate is not a non-symlink directory");
  const result = new Map<string, Uint8Array>();
  for (const output of PHASE10_AI_OUTPUTS) {
    const target = resolve(candidate, output.candidateName);
    if (!existsSync(target)) fail(`candidate lacks ${output.candidateName}`);
    const file = lstatSync(target);
    if (!file.isFile() || file.isSymbolicLink() || file.nlink !== 1) fail(`${output.candidateName} is not a regular single-link file`);
    result.set(output.candidateName, new Uint8Array(readFileSync(target)));
  }
  return result;
}

function validateCandidateArtifacts(candidate: ReadonlyMap<string, Uint8Array>): void {
  const custody = parseJsonlBytes(candidate.get("file-custody.jsonl")!, "candidate custody").map((entry, index) => parseFileCustodyRow(entry, `candidate custody[${index}]`));
  if (custody.length !== 24 || custody.filter((entry) => entry.custodyClass === "source-payload" && entry.payloadId !== null).length !== 14 || custody.filter((entry) => entry.custodyClass === "raw-acquisition-history").length !== 1 || custody.filter((entry) => entry.custodyClass === "acquisition-metadata").length !== 9) fail("candidate custody denominators differ");
  const dispositions = parseJsonlBytes(candidate.get("post-freeze-dispositions.jsonl")!, "candidate dispositions").map((entry, index) => parseIntakeDispositionRow(entry, `candidate dispositions[${index}]`));
  if (dispositions.length !== 14) fail("candidate disposition denominator differs");
  const currency = parseJsonlBytes(candidate.get("currency.jsonl")!, "candidate currency").map((entry, index) => parseCurrencySnapshot(entry, `candidate currency[${index}]`));
  if (currency.length !== 12) fail("candidate selected-lineage denominator differs");
  const report = object(parsePrettyJsonBytes(candidate.get("intake-report.json")!, "candidate report"), "candidate report");
  exactKeys(report, ["schema", "bundleId", "foundationFreeze", "protocolBinding", "counts", "nasVerification", "currencySummary", "claimBoundary", "artifacts", "producer"], "candidate report");
  if (report.schema !== "phase10-intake-report-v1" || report.bundleId !== PHASE10_AI_BUNDLE_ID || canonicalJson(report.claimBoundary) !== canonicalJson(PHASE10_AI_CLAIM_BOUNDARY)) fail("candidate report boundary differs");
  const index = object(parsePrettyJsonBytes(candidate.get("intake-artifact-index.json")!, "candidate index"), "candidate index");
  exactKeys(index, ["schema", "bundleId", "artifacts"], "candidate index");
  if (index.schema !== "phase10-artifact-index-v1" || index.bundleId !== PHASE10_AI_BUNDLE_ID || !Array.isArray(index.artifacts) || index.artifacts.length !== 4) fail("candidate artifact index differs");
  for (const artifact of index.artifacts) {
    const entry = object(artifact, "candidate index artifact");
    const path = String(entry.path);
    const bytes = candidate.get(path);
    if (bytes === undefined || entry.byteLength !== bytes.byteLength || entry.sha256 !== sha256Bytes(bytes)) fail(`candidate index is stale for ${path}`);
  }
}

function validateVerificationReceipt(candidate: ReadonlyMap<string, Uint8Array>): void {
  const receipt = object(parsePrettyJsonBytes(candidate.get("intake-verification.json")!, "candidate verification"), "candidate verification");
  exactKeys(receipt, ["schema", "verificationId", "matrixId", "protocolId", "registryId", "packetId", "terminalState", "verifiedArtifacts", "checkResults", "executedNegativeControlIds", "negativeControlResults", "boundDependencyPacketIds", "execution", "aggregateVerdict", "limits"], "candidate verification");
  if (receipt.schema !== "phase10-packet-verification-v1" || receipt.verificationId !== "phase10-a-i-verification-v1" || receipt.packetId !== "a-i" || receipt.terminalState !== "complete" || receipt.aggregateVerdict !== "pass") fail("candidate independent verification is not an A-I pass");
  if (!Array.isArray(receipt.executedNegativeControlIds) || receipt.executedNegativeControlIds.length !== 0 || !Array.isArray(receipt.negativeControlResults) || receipt.negativeControlResults.length !== 0) fail("candidate verification invents negative controls");
  if (!Array.isArray(receipt.checkResults) || receipt.checkResults.length !== 7 || receipt.checkResults.some((entry) => object(entry, "verification check").verdict !== "pass")) fail("candidate verification checks are not all pass");
  if (!Array.isArray(receipt.verifiedArtifacts) || receipt.verifiedArtifacts.length !== 5) fail("candidate verification artifact roster differs");
  for (const value of receipt.verifiedArtifacts) {
    const entry = object(value, "verified artifact");
    const registered = PHASE10_AI_OUTPUTS.find((output) => output.outputId === entry.outputId);
    if (registered === undefined || registered.outputId === "out-ai-verification") fail("verified artifact ID is not a producer output");
    const bytes = candidate.get(registered.candidateName)!;
    if (entry.path !== registered.path || entry.byteLength !== bytes.byteLength || entry.sha256 !== sha256Bytes(bytes)) fail(`${registered.outputId} verified identity differs`);
  }
}

function rerunIndependentVerification(repositoryRoot: string, candidateRelativePath: string): void {
  const startedOn = new Date().toISOString();
  const evaluation = phase10IntakeVerify({ repositoryRoot, candidateDirectory: candidateRelativePath, allowPublishedOutputs: true });
  const authority = loadIntakeAuthority(repositoryRoot, AI_INTAKE_PROTOCOL_IDENTITY);
  writePhase10IntakeVerificationReceipt({ repositoryRoot, candidateDirectory: candidateRelativePath, evaluation, command: PHASE10_AI_VERIFY_COMMAND, gitHead: authority.head, startedOn, endedOn: new Date().toISOString(), allowPublishedOutputs: true });
}

function allowedPublishedNames(candidate: ReadonlyMap<string, Uint8Array>, outputDirectory: string): void {
  const names = readdirSync(outputDirectory).sort(lexical);
  const allowed = new Set([...EXPECTED_EXISTING_NAMES, ...AI_NAMES]);
  if (names.some((name) => !allowed.has(name))) fail("scope/intake publication contains an unknown file");
  for (const name of EXPECTED_EXISTING_NAMES) if (!names.includes(name)) fail(`scope/intake publication lost existing A-S file ${name}`);
  for (const name of AI_NAMES) {
    const target = resolve(outputDirectory, name);
    if (!existsSync(target)) continue;
    const stat = lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || !sameBytes(new Uint8Array(readFileSync(target)), candidate.get(name)!)) fail(`existing A-I publication ${name} differs from candidate`);
  }
}

export function publishPhase10IntakeCandidate(request: { readonly repositoryRoot: string; readonly candidateRelativePath: string; readonly outputRelativePath: string }): void {
  const root = resolve(request.repositoryRoot);
  if (request.candidateRelativePath !== CANDIDATE_DIRECTORY || request.outputRelativePath !== PUBLISHED_DIRECTORY) fail("publication paths differ from the frozen command");
  const candidate = readCandidate(root, request.candidateRelativePath);
  validateCandidateArtifacts(candidate);
  validateVerificationReceipt(candidate);
  rerunIndependentVerification(root, request.candidateRelativePath);
  const output = safeRepositoryPath(root, request.outputRelativePath, "scope/intake publication");
  const stat = lstatSync(output);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("scope/intake publication is not an existing non-symlink directory");
  allowedPublishedNames(candidate, output);
  for (const name of AI_NAMES) {
    const target = resolve(output, name);
    if (existsSync(target)) continue;
    writeFileSync(target, candidate.get(name)!, { flag: "wx" });
    if (!sameBytes(new Uint8Array(readFileSync(target)), candidate.get(name)!)) fail(`published ${name} differs after write`);
  }
  allowedPublishedNames(candidate, output);
}

function parseOptions(argv: readonly string[], names: readonly string[], label: string): Readonly<Record<string, string>> {
  if (argv.length !== names.length * 2) fail(`${label} has the wrong argument count`);
  const allowed = new Set(names);
  const result: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === undefined || value === undefined || !flag.startsWith("--")) fail(`${label} has malformed arguments`);
    const name = flag.slice(2);
    if (!allowed.has(name) || Object.hasOwn(result, name)) fail(`${label} has unknown or duplicate ${flag}`);
    result[name] = value;
  }
  return Object.freeze(result);
}

function runProduce(options: Readonly<Record<string, string>>): void {
  const root = resolve(options["repository-root"]!);
  if (options.protocol !== PHASE10_AI_PACKET_PROTOCOL_PATH || options.out !== CANDIDATE_DIRECTORY) fail("produce paths differ from the frozen command");
  const ignored = spawnSync("git", ["check-ignore", "--quiet", options.out], { cwd: root, windowsHide: true });
  if (ignored.status !== 0) fail("candidate path is not ignored");
  writePhase10StaticPreflightReceipt({ repositoryRoot: root, packetId: "a-i", attemptId: PHASE10_AI_STATIC_ATTEMPT_ID, candidateDirectory: options.out!, command: PHASE10_AI_PRODUCE_COMMAND, repositoryBundleRoot: ".", allowValidatedResume: true });
  const retainedTimes = retainedProducerTimes(root, options.out!);
  const startedOn = retainedTimes?.startedOn ?? new Date().toISOString();
  const authority = loadIntakeAuthority(root, AI_INTAKE_PROTOCOL_IDENTITY);
  assertOnlyFrozenInputsChangedSinceFreeze(authority);
  const decisionBytes = assertCommittedInputAtHead(root, PHASE10_AI_DECISIONS_PATH, "committed A-I decisions");
  const observationBytes = assertCommittedInputAtHead(root, PHASE10_AI_OBSERVATIONS_PATH, "committed A-I observations");
  const reviewBytes = assertCommittedInputAtHead(root, PHASE10_AI_SEMANTIC_REVIEW_PATH, "committed A-I semantic review");
  const semanticReview = validateInputReceipts(root, decisionBytes, observationBytes, reviewBytes);
  const decisions = parseIntakeDecisionInput(parseStrictJsonFile(decisionBytes, "A-I decisions"), authority.protocol);
  const observations = parseIntakeObservations(parseStrictJsonFile(observationBytes, "A-I observations"), authority.protocol);
  const bundle = producePhase10IntakeArtifacts({ authority, decisions, observations, semanticReview, semanticReviewIdentity: tuple(PHASE10_AI_SEMANTIC_REVIEW_PATH, reviewBytes), foundationValue: parseStrictJsonFile(readRegularFile(root, authority.protocol.foundationFreeze.path, "Phase 10 foundation"), "Phase 10 foundation"), trackedIntakeValue: parseStrictJsonFile(readRegularFile(root, authority.protocol.trackedIntake.path, "tracked intake"), "tracked intake"), startedOn, endedOn: retainedTimes?.endedOn ?? new Date().toISOString() });
  writeCandidate(root, options.out!, bundle);
  process.stdout.write(`${JSON.stringify({ state: "candidate-awaiting-independent-verification", custodyFiles: 24, payloads: 14, selectedLineages: 12 })}\n`);
}

function runPublish(options: Readonly<Record<string, string>>): void {
  const root = resolve(options["repository-root"]!);
  if (options.candidate !== CANDIDATE_DIRECTORY || options.out !== PUBLISHED_DIRECTORY) fail("publish paths differ from the frozen command");
  const candidate = readCandidate(root, options.candidate!);
  validateCandidateArtifacts(candidate);
  validateVerificationReceipt(candidate);
  rerunIndependentVerification(root, options.candidate!);
  writePhase10StaticTerminalReceipt({ repositoryRoot: root, packetId: "a-i", attemptId: PHASE10_AI_STATIC_ATTEMPT_ID, candidateDirectory: options.candidate!, command: PHASE10_AI_PRODUCE_COMMAND, repositoryBundleRoot: ".", terminalState: "complete" });
  const receiptOptions = { repositoryRoot: root, packetId: "a-i", attemptId: PHASE10_AI_STATIC_ATTEMPT_ID, candidateDirectory: options.candidate!, command: PHASE10_AI_PRODUCE_COMMAND, repositoryBundleRoot: "." } as const;
  validatePhase10StaticPacketReceiptsForPublication(receiptOptions);
  publishPhase10IntakeCandidate({ repositoryRoot: root, candidateRelativePath: options.candidate!, outputRelativePath: options.out! });
  publishPhase10StaticPacketReceipts(receiptOptions);
  process.stdout.write(`${JSON.stringify({ state: "published", path: PUBLISHED_DIRECTORY, terminalState: "complete" })}\n`);
}

function main(argv: readonly string[]): void {
  if (argv[0] === "produce") return runProduce(parseOptions(argv.slice(1), ["repository-root", "protocol", "out"], "A-I produce command"));
  if (argv[0] === "publish") return runPublish(parseOptions(argv.slice(1), ["repository-root", "candidate", "out"], "A-I publish command"));
  fail("usage: produce --repository-root ROOT --protocol PROTOCOL --out CANDIDATE | publish --repository-root ROOT --candidate CANDIDATE --out EVIDENCE");
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  try { main(process.argv.slice(2)); } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
