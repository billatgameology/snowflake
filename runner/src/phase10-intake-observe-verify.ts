import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  assertBranchAndClean,
  assertObservationFreezeHead,
  identityOf,
  loadIntakeAuthority,
  parseStrictJsonFile,
  readRegularFile,
  safeRepositoryPath,
} from "./phase10-intake-authority.ts";
import {
  PHASE10_AI_DECISIONS_PATH,
  PHASE10_AI_DECISION_VALIDATION_PATH,
  PHASE10_AI_OBSERVATIONS_PATH,
  PHASE10_AI_OBSERVATION_ATTEMPT,
  PHASE10_AI_OBSERVATION_VALIDATION_PATH,
  PHASE10_AI_PACKET_PROTOCOL_PATH,
  PHASE10_AI_SEMANTIC_REVIEW_PATH,
  artifactTuple,
  parseIntakeDecisionInput,
  parseIntakeObservations,
  parseIntakeSemanticReview,
  prettyJsonBytes,
  sha256Bytes,
  type ArtifactTuple,
  type IntakeDecisionInput,
  type IntakeObservations,
  type IntakeSemanticReview,
} from "./phase10-intake-contracts.ts";

interface ObservationValidationReceipt {
  readonly schema: "phase10-ai-observation-validation-v1";
  readonly validationId: "phase10-a-i-observation-validation-20260821-v1";
  readonly protocol: ArtifactTuple;
  readonly protocolFreezeCommit: string;
  readonly observations: ArtifactTuple;
  readonly rawArtifacts: readonly ArtifactTuple[];
  readonly exactQueryCount: 24;
  readonly nasState: "receipt-verified" | "unavailable-refusal";
  readonly verdict: "pass";
  readonly limits: readonly string[];
}

const AI_INTAKE_PROTOCOL_IDENTITY = Object.freeze({ path: "research/phase10-execution-v1/packets/a-i/intake-protocol.json", byteLength: 26443, sha256: "6adffffdbd02b7e023072f2e096909f43ee557b1fcd45e7a0d7f52107f36fe78" });

interface DecisionValidationReceipt {
  readonly schema: "phase10-ai-decision-validation-v1";
  readonly validationId: "phase10-a-i-decision-validation-20260821-v1";
  readonly protocol: ArtifactTuple;
  readonly protocolFreezeCommit: string;
  readonly observations: ArtifactTuple;
  readonly decisions: ArtifactTuple;
  readonly payloadCount: 14;
  readonly selectedLineageCount: 12;
  readonly structuralVerdict: "pass";
  readonly semanticReviewRequired: true;
  readonly limits: readonly string[];
}

function fail(message: string): never {
  throw new Error(`Phase 10 A-I observation verifier refused: ${message}`);
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((entry, index) => entry !== wanted[index])) fail(`${label} keys differ`);
}

function options(argv: readonly string[], names: readonly string[], label: string): Readonly<Record<string, string>> {
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

function sameIdentity(actual: ArtifactTuple, expected: ArtifactTuple, label: string): void {
  if (actual.path !== expected.path || actual.byteLength !== expected.byteLength || actual.sha256 !== expected.sha256) fail(`${label} identity differs`);
}

export function reopenPhase10IntakeRaw(repositoryRoot: string, observations: IntakeObservations): readonly ArtifactTuple[] {
  const tuples = [
    ...observations.queryExecutions.map((entry) => entry.rawResponse),
    observations.existingNasVerification.attemptReport,
  ].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  if (tuples.length !== 25 || new Set(tuples.map((entry) => entry.path)).size !== tuples.length) fail("raw artifact roster is not exact 24 queries plus one NAS report");
  for (const tuple of tuples) sameIdentity(identityOf(repositoryRoot, tuple.path, `raw observation ${tuple.path}`), tuple, `raw observation ${tuple.path}`);
  for (const execution of observations.queryExecutions) {
    const bytes = readRegularFile(repositoryRoot, execution.rawResponse.path, `raw query ${execution.queryId}`);
    if (execution.terminalState === "network-refusal") {
      if (bytes.byteLength !== 0) fail(`${execution.queryId} network refusal retained nonempty response bytes`);
      continue;
    }
    if (execution.httpStatus !== null && execution.httpStatus >= 200 && execution.httpStatus < 300) {
      if (bytes.byteLength === 0) fail(`${execution.queryId} successful HTTP response is empty`);
      if (execution.endpoint.includes("api.crossref.org") || execution.endpoint.includes("api.datacite.org") || execution.endpoint.includes("api.figshare.com")) {
        try { JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); } catch { fail(`${execution.queryId} expected JSON service response is not JSON`); }
      } else if (execution.endpoint.includes("export.arxiv.org")) {
        const source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        if (!source.includes("<feed") || !source.includes("http://www.w3.org/2005/Atom")) fail(`${execution.queryId} arXiv response is not an Atom feed`);
      }
    }
  }
  const nasBytes = readRegularFile(repositoryRoot, observations.existingNasVerification.attemptReport.path, "raw NAS verification report");
  let nas: unknown;
  try { nas = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(nasBytes)); } catch { fail("raw NAS verification report is not JSON"); }
  const report = object(nas, "raw NAS verification report");
  const executionRefusal = report.format === "phase10-ai-nas-execution-refusal-v1";
  if (executionRefusal) exactKeys(report, ["format", "message", "exitStatus"], "raw NAS execution refusal");
  else exactKeys(report, ["format", "command", "ok", "scope", "mount", "collections", "overlays", "defects", "limitations", "fullPayloadTotals", "limits"], "raw NAS verification report");
  const collections = executionRefusal ? [] : Array.isArray(report.collections) ? report.collections : fail("raw NAS verification collections must be an array");
  const overlays = executionRefusal ? [] : Array.isArray(report.overlays) ? report.overlays : fail("raw NAS verification overlays must be an array");
  const defects = executionRefusal ? [] : Array.isArray(report.defects) ? report.defects : fail("raw NAS verification defects must be an array");
  const totals = executionRefusal || report.fullPayloadTotals === null ? null : object(report.fullPayloadTotals, "raw NAS full totals");
  const exactPass = !executionRefusal && report.format === "snowflake-nas-assets-readonly-report-v1" && report.command === "verify" && report.ok === true &&
    report.scope === "explicit-single-collection-full-hash" && report.mount === "attached" && overlays.length === 0 && defects.length === 0 &&
    totals?.files === 26 && totals.bytes === 165722101 && collections.length === 1;
  if (!executionRefusal && collections.length === 1) {
    const collection = object(collections[0], "raw NAS verified collection");
    exactKeys(collection, ["identity", "state", "manifest", "aggregate", "payload"], "raw NAS verified collection");
    if (exactPass && (collection.identity !== "post-phase9-intake@2026-08-13" || collection.state !== "provisional" || collection.manifest !== "verified" || collection.aggregate !== "verified" || collection.payload !== "verified-full")) fail("NAS full report collection row differs from the frozen collection");
  }
  if (observations.existingNasVerification.state === "receipt-verified") {
    if (!exactPass) fail("NAS receipt branch is not backed by the exact successful full report");
    sameIdentity(observations.existingNasVerification.verificationReceipt!, observations.existingNasVerification.attemptReport, "NAS verification receipt");
  } else if (exactPass) {
    fail("NAS refusal branch contradicts a successful raw report");
  }
  return Object.freeze(tuples);
}

export function assertPhase10IntakeDecisionSupport(
  repositoryRoot: string,
  decisions: IntakeDecisionInput,
  observations: IntakeObservations,
): void {
  if (decisions.decidedOn < observations.observedOn) fail("decisions precede the normalized current observations they cite");
  const executions = new Map(observations.queryExecutions.map((entry) => [entry.queryId, entry] as const));
  const responseText = new Map(observations.queryExecutions.map((entry) => {
    const bytes = readRegularFile(repositoryRoot, entry.rawResponse.path, `decision support ${entry.queryId}`);
    let source = "";
    try { source = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { source = ""; }
    return [entry.queryId, source] as const;
  }));
  const relationStatus = {
    correction: "correctionStatus",
    version: "versionStatus",
    supplement: "supplementStatus",
    "native-data": "nativeDataStatus",
    "later-output": "laterOutputStatus",
  } as const;
  for (const decision of decisions.currencyDecisions) {
    const lineageExecutions = decision.basisQueryIds.map((queryId) => executions.get(queryId)!);
    const allSuccessful = lineageExecutions.every((entry) => entry.terminalState === "http-response" && entry.httpStatus !== null && entry.httpStatus >= 200 && entry.httpStatus < 300);
    if (!allSuccessful) {
      if (
        decision.terminalDisposition !== "source-refusal" || decision.candidates.length !== 0 ||
        [decision.correctionStatus, decision.versionStatus, decision.supplementStatus, decision.nativeDataStatus, decision.laterOutputStatus].some((entry) => entry !== "not-applicable")
      ) fail(`${decision.lineageId} failed request roster must yield a source-refusal with no candidates and not-applicable components`);
      continue;
    }
    const combined = decision.basisQueryIds.map((queryId) => responseText.get(queryId) ?? "").join("\n");
    for (const candidate of decision.candidates) {
      if (!combined.includes(candidate.identity) || !combined.includes(candidate.locator)) fail(`${decision.lineageId} candidate ${candidate.candidateId} is not bound by raw response strings`);
    }
    for (const [relation, statusField] of Object.entries(relationStatus) as [keyof typeof relationStatus, typeof relationStatus[keyof typeof relationStatus]][]) {
      const related = decision.candidates.filter((candidate) => candidate.relation === relation);
      const status = decision[statusField];
      if (status === "checked-bound" && !related.some((candidate) => candidate.disposition === "bound")) fail(`${decision.lineageId} ${statusField} is bound without a bound candidate`);
      if (status === "checked-none-found" && related.some((candidate) => candidate.disposition === "bound")) fail(`${decision.lineageId} ${statusField} contradicts a bound candidate`);
    }
    if (decision.terminalDisposition === "priority-lead-unavailable" && !decision.candidates.some((candidate) => candidate.disposition === "unavailable")) fail(`${decision.lineageId} priority-lead-unavailable lacks an unavailable candidate`);
  }
}

export function validatePhase10IntakeObservations(request: {
  readonly repositoryRoot: string;
  readonly packetProtocolPath: string;
  readonly observationsPath: string;
  readonly rawAttemptPath: string;
  readonly receiptPath: string;
}): ObservationValidationReceipt {
  const root = resolve(request.repositoryRoot);
  if (request.packetProtocolPath !== PHASE10_AI_PACKET_PROTOCOL_PATH || request.observationsPath !== PHASE10_AI_OBSERVATIONS_PATH || request.rawAttemptPath !== PHASE10_AI_OBSERVATION_ATTEMPT || request.receiptPath !== PHASE10_AI_OBSERVATION_VALIDATION_PATH) fail("observation validation paths differ from the frozen command");
  assertBranchAndClean(root, [PHASE10_AI_OBSERVATIONS_PATH]);
  const authority = loadIntakeAuthority(root, AI_INTAKE_PROTOCOL_IDENTITY);
  assertObservationFreezeHead(authority);
  const observationBytes = readRegularFile(root, PHASE10_AI_OBSERVATIONS_PATH, "A-I observations");
  const observations = parseIntakeObservations(parseStrictJsonFile(observationBytes, "A-I observations"), authority.protocol);
  const rawArtifacts = reopenPhase10IntakeRaw(root, observations);
  const receipt: ObservationValidationReceipt = Object.freeze({
    schema: "phase10-ai-observation-validation-v1",
    validationId: "phase10-a-i-observation-validation-20260821-v1",
    protocol: AI_INTAKE_PROTOCOL_IDENTITY,
    protocolFreezeCommit: authority.freezeCommit,
    observations: Object.freeze({ path: PHASE10_AI_OBSERVATIONS_PATH, byteLength: observationBytes.byteLength, sha256: sha256Bytes(observationBytes) }),
    rawArtifacts,
    exactQueryCount: 24,
    nasState: observations.existingNasVerification.state,
    verdict: "pass",
    limits: Object.freeze([
      "PASS verifies the frozen request roster, terminal response capture, raw byte identities, and NAS branch; it does not endorse analyst semantic dispositions.",
      "Raw response bodies remain ignored working material and are not authorized for Git publication.",
    ]),
  });
  const receiptTarget = safeRepositoryPath(root, request.receiptPath, "observation validation receipt");
  if (existsSync(receiptTarget)) fail("observation validation receipt already exists");
  writeFileSync(receiptTarget, prettyJsonBytes(receipt), { flag: "wx" });
  return receipt;
}

export function validatePhase10IntakeDecisions(request: {
  readonly repositoryRoot: string;
  readonly packetProtocolPath: string;
  readonly decisionsPath: string;
  readonly observationsPath: string;
  readonly receiptPath: string;
}): { readonly receipt: DecisionValidationReceipt; readonly decisions: IntakeDecisionInput } {
  const root = resolve(request.repositoryRoot);
  if (request.packetProtocolPath !== PHASE10_AI_PACKET_PROTOCOL_PATH || request.decisionsPath !== PHASE10_AI_DECISIONS_PATH || request.observationsPath !== PHASE10_AI_OBSERVATIONS_PATH || request.receiptPath !== PHASE10_AI_DECISION_VALIDATION_PATH) fail("decision validation paths differ from the frozen command");
  assertBranchAndClean(root, [PHASE10_AI_OBSERVATIONS_PATH, PHASE10_AI_DECISIONS_PATH]);
  const authority = loadIntakeAuthority(root, AI_INTAKE_PROTOCOL_IDENTITY);
  assertObservationFreezeHead(authority);
  const observationBytes = readRegularFile(root, PHASE10_AI_OBSERVATIONS_PATH, "A-I observations");
  const observations = parseIntakeObservations(parseStrictJsonFile(observationBytes, "A-I observations"), authority.protocol);
  reopenPhase10IntakeRaw(root, observations);
  const observationReceiptBytes = readRegularFile(root, PHASE10_AI_OBSERVATION_VALIDATION_PATH, "observation validation receipt");
  const observationReceiptValue = parseStrictJsonFile(observationReceiptBytes, "observation validation receipt");
  if (observationReceiptValue === null || typeof observationReceiptValue !== "object" || Array.isArray(observationReceiptValue)) fail("observation validation receipt is malformed");
  const observationReceipt = observationReceiptValue as Record<string, unknown>;
  if (observationReceipt.schema !== "phase10-ai-observation-validation-v1" || observationReceipt.verdict !== "pass") fail("observation validation receipt is not pass");
  const boundObservation = observationReceipt.observations as Record<string, unknown> | undefined;
  if (boundObservation?.path !== PHASE10_AI_OBSERVATIONS_PATH || boundObservation.byteLength !== observationBytes.byteLength || boundObservation.sha256 !== sha256Bytes(observationBytes)) fail("observation validation receipt is stale");
  const decisionBytes = readRegularFile(root, PHASE10_AI_DECISIONS_PATH, "A-I decisions");
  const decisions = parseIntakeDecisionInput(parseStrictJsonFile(decisionBytes, "A-I decisions"), authority.protocol);
  assertPhase10IntakeDecisionSupport(root, decisions, observations);
  const receipt: DecisionValidationReceipt = Object.freeze({
    schema: "phase10-ai-decision-validation-v1",
    validationId: "phase10-a-i-decision-validation-20260821-v1",
    protocol: AI_INTAKE_PROTOCOL_IDENTITY,
    protocolFreezeCommit: authority.freezeCommit,
    observations: Object.freeze({ path: PHASE10_AI_OBSERVATIONS_PATH, byteLength: observationBytes.byteLength, sha256: sha256Bytes(observationBytes) }),
    decisions: Object.freeze({ path: PHASE10_AI_DECISIONS_PATH, byteLength: decisionBytes.byteLength, sha256: sha256Bytes(decisionBytes) }),
    payloadCount: 14,
    selectedLineageCount: 12,
    structuralVerdict: "pass",
    semanticReviewRequired: true,
    limits: Object.freeze([
      "Structural PASS does not establish that analyst judgments are factually correct; a non-author semantic review remains required.",
      "Disposition reasons and candidate descriptions are rights-safe paraphrases, not source quotations or numeric row bodies.",
    ]),
  });
  const receiptTarget = safeRepositoryPath(root, request.receiptPath, "decision validation receipt");
  if (existsSync(receiptTarget)) fail("decision validation receipt already exists");
  writeFileSync(receiptTarget, prettyJsonBytes(receipt), { flag: "wx" });
  return Object.freeze({ receipt, decisions });
}

export function validatePhase10IntakeSemanticReview(request: {
  readonly repositoryRoot: string;
  readonly packetProtocolPath: string;
  readonly reviewPath: string;
}): IntakeSemanticReview {
  const root = resolve(request.repositoryRoot);
  if (request.packetProtocolPath !== PHASE10_AI_PACKET_PROTOCOL_PATH || request.reviewPath !== PHASE10_AI_SEMANTIC_REVIEW_PATH) fail("semantic-review validation paths differ from the frozen command");
  assertBranchAndClean(root, [PHASE10_AI_OBSERVATIONS_PATH, PHASE10_AI_DECISIONS_PATH, PHASE10_AI_SEMANTIC_REVIEW_PATH]);
  const authority = loadIntakeAuthority(root, AI_INTAKE_PROTOCOL_IDENTITY);
  assertObservationFreezeHead(authority);
  const observationBytes = readRegularFile(root, PHASE10_AI_OBSERVATIONS_PATH, "A-I observations");
  const observations = parseIntakeObservations(parseStrictJsonFile(observationBytes, "A-I observations"), authority.protocol);
  const rawArtifacts = reopenPhase10IntakeRaw(root, observations);
  const decisionBytes = readRegularFile(root, PHASE10_AI_DECISIONS_PATH, "A-I decisions");
  const decisions = parseIntakeDecisionInput(parseStrictJsonFile(decisionBytes, "A-I decisions"), authority.protocol);
  assertPhase10IntakeDecisionSupport(root, decisions, observations);
  const observationReceiptBytes = readRegularFile(root, PHASE10_AI_OBSERVATION_VALIDATION_PATH, "observation validation receipt");
  const decisionReceiptBytes = readRegularFile(root, PHASE10_AI_DECISION_VALIDATION_PATH, "decision validation receipt");
  const reviewBytes = readRegularFile(root, PHASE10_AI_SEMANTIC_REVIEW_PATH, "A-I semantic review");
  const review = parseIntakeSemanticReview(parseStrictJsonFile(reviewBytes, "A-I semantic review"));
  sameIdentity(review.protocol, AI_INTAKE_PROTOCOL_IDENTITY, "semantic review protocol");
  sameIdentity(review.observations, identityOf(root, PHASE10_AI_OBSERVATIONS_PATH, "semantic-review observations"), "semantic review observations");
  sameIdentity(review.decisions, identityOf(root, PHASE10_AI_DECISIONS_PATH, "semantic-review decisions"), "semantic review decisions");
  sameIdentity(review.observationValidationReceipt, Object.freeze({ path: PHASE10_AI_OBSERVATION_VALIDATION_PATH, byteLength: observationReceiptBytes.byteLength, sha256: sha256Bytes(observationReceiptBytes) }), "semantic review observation-validation receipt");
  sameIdentity(review.decisionValidationReceipt, Object.freeze({ path: PHASE10_AI_DECISION_VALIDATION_PATH, byteLength: decisionReceiptBytes.byteLength, sha256: sha256Bytes(decisionReceiptBytes) }), "semantic review decision-validation receipt");
  if (review.rawArtifacts.length !== rawArtifacts.length || review.rawArtifacts.some((entry, index) => {
    const expected = rawArtifacts[index];
    return expected === undefined || entry.path !== expected.path || entry.byteLength !== expected.byteLength || entry.sha256 !== expected.sha256;
  })) fail("semantic review raw-artifact roster differs from independently reopened observation bytes");
  if (review.reviewedOn < decisions.decidedOn || review.reviewedOn < observations.observedOn) fail("semantic review predates its decisions or observations");
  const observationReceipt = object(parseStrictJsonFile(observationReceiptBytes, "observation validation receipt"), "observation validation receipt");
  exactKeys(observationReceipt, ["schema", "validationId", "protocol", "protocolFreezeCommit", "observations", "rawArtifacts", "exactQueryCount", "nasState", "verdict", "limits"], "observation validation receipt");
  if (observationReceipt.schema !== "phase10-ai-observation-validation-v1" || observationReceipt.verdict !== "pass" || observationReceipt.protocolFreezeCommit !== authority.freezeCommit) fail("semantic review binds a non-passing or stale observation validation");
  const receiptRaw = Array.isArray(observationReceipt.rawArtifacts) ? observationReceipt.rawArtifacts.map((entry, index) => artifactTuple(entry, `observation receipt rawArtifacts[${index}]`)) : fail("observation validation raw roster is malformed");
  if (receiptRaw.length !== rawArtifacts.length || receiptRaw.some((entry, index) => {
    const expected = rawArtifacts[index];
    return expected === undefined || entry.path !== expected.path || entry.byteLength !== expected.byteLength || entry.sha256 !== expected.sha256;
  })) fail("observation validation receipt raw roster is stale");
  const decisionReceipt = object(parseStrictJsonFile(decisionReceiptBytes, "decision validation receipt"), "decision validation receipt");
  exactKeys(decisionReceipt, ["schema", "validationId", "protocol", "protocolFreezeCommit", "observations", "decisions", "payloadCount", "selectedLineageCount", "structuralVerdict", "semanticReviewRequired", "limits"], "decision validation receipt");
  if (decisionReceipt.schema !== "phase10-ai-decision-validation-v1" || decisionReceipt.structuralVerdict !== "pass" || decisionReceipt.semanticReviewRequired !== true || decisionReceipt.protocolFreezeCommit !== authority.freezeCommit) fail("semantic review binds a non-passing or stale decision validation");
  return review;
}

function main(argv: readonly string[]): void {
  if (argv[0] === "validate-observations") {
    const parsed = options(argv.slice(1), ["repository-root", "protocol", "observations", "raw", "receipt"], "observation validation command");
    const receipt = validatePhase10IntakeObservations({ repositoryRoot: parsed["repository-root"]!, packetProtocolPath: parsed.protocol!, observationsPath: parsed.observations!, rawAttemptPath: parsed.raw!, receiptPath: parsed.receipt! });
    process.stdout.write(`${JSON.stringify({ state: "observation-validation-complete", verdict: receipt.verdict })}\n`);
    return;
  }
  if (argv[0] === "validate-decisions") {
    const parsed = options(argv.slice(1), ["repository-root", "protocol", "decisions", "observations", "receipt"], "decision validation command");
    const result = validatePhase10IntakeDecisions({ repositoryRoot: parsed["repository-root"]!, packetProtocolPath: parsed.protocol!, decisionsPath: parsed.decisions!, observationsPath: parsed.observations!, receiptPath: parsed.receipt! });
    process.stdout.write(`${JSON.stringify({ state: "decision-validation-complete", verdict: result.receipt.structuralVerdict, semanticReviewRequired: true })}\n`);
    return;
  }
  if (argv[0] === "validate-semantic-review") {
    const parsed = options(argv.slice(1), ["repository-root", "protocol", "review"], "semantic-review validation command");
    const review = validatePhase10IntakeSemanticReview({ repositoryRoot: parsed["repository-root"]!, packetProtocolPath: parsed.protocol!, reviewPath: parsed.review! });
    process.stdout.write(`${JSON.stringify({ state: "semantic-review-validation-complete", verdict: review.verdict, unresolvedBlockers: review.unresolvedBlockers.length })}\n`);
    return;
  }
  fail("usage: validate-observations ... | validate-decisions ... | validate-semantic-review ...");
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  try { main(process.argv.slice(2)); } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
