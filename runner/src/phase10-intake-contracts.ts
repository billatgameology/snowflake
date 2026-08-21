import { createHash } from "node:crypto";
import { canonicalJson, strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";

export const PHASE10_AI_PACKET_ID = "a-i" as const;
export const PHASE10_AI_PACKET_PROTOCOL_PATH =
  "research/phase10-execution-v1/packets/a-i/protocol.json" as const;
export const PHASE10_AI_INTAKE_PROTOCOL_PATH =
  "research/phase10-execution-v1/packets/a-i/intake-protocol.json" as const;
export const PHASE10_AI_OBSERVATIONS_PATH =
  "research/phase10-execution-v1/packets/a-i/observations.json" as const;
export const PHASE10_AI_DECISIONS_PATH =
  "research/phase10-execution-v1/packets/a-i/disposition-decisions.json" as const;
export const PHASE10_AI_SEMANTIC_REVIEW_PATH =
  "research/phase10-execution-v1/packets/a-i/semantic-review.json" as const;
export const PHASE10_AI_OBSERVATION_ATTEMPT =
  "out/phase10-execution-v1/attempts/a-i/observe-20260821-v1" as const;
export const PHASE10_AI_OBSERVATION_VALIDATION_PATH =
  "out/phase10-execution-v1/attempts/a-i/observe-20260821-v1/validation.json" as const;
export const PHASE10_AI_DECISION_VALIDATION_PATH =
  "out/phase10-execution-v1/attempts/a-i/observe-20260821-v1/decision-validation.json" as const;
export const PHASE10_AI_STATIC_ATTEMPT_ID = "s3-static-20260821-v1" as const;
export const PHASE10_AI_BUNDLE_ID = "phase10-scope-intake-v1" as const;
export const PHASE10_AI_PRODUCE_COMMAND =
  "node runner/src/phase10-intake.ts produce --repository-root . --protocol research/phase10-execution-v1/packets/a-i/protocol.json --out out/phase10-scope-intake-v1-a-i-candidate" as const;
export const PHASE10_AI_VERIFY_COMMAND =
  "node runner/src/phase10-intake-verify.ts verify --repository-root . --protocol research/phase10-execution-v1/packets/a-i/protocol.json --bundle out/phase10-scope-intake-v1-a-i-candidate --receipt out/phase10-scope-intake-v1-a-i-candidate/intake-verification.json" as const;
export const PHASE10_AI_PUBLISH_COMMAND =
  "node runner/src/phase10-intake.ts publish --repository-root . --candidate out/phase10-scope-intake-v1-a-i-candidate --out evidence/phase10-scope-intake-v1" as const;
export const PHASE10_AI_OBSERVE_COMMAND =
  "node runner/src/phase10-intake-observe.ts observe --repository-root . --protocol research/phase10-execution-v1/packets/a-i/protocol.json --raw-out out/phase10-execution-v1/attempts/a-i/observe-20260821-v1 --out research/phase10-execution-v1/packets/a-i/observations.json" as const;
export const PHASE10_AI_VALIDATE_OBSERVATION_COMMAND =
  "node runner/src/phase10-intake-observe-verify.ts validate-observations --repository-root . --protocol research/phase10-execution-v1/packets/a-i/protocol.json --observations research/phase10-execution-v1/packets/a-i/observations.json --raw out/phase10-execution-v1/attempts/a-i/observe-20260821-v1 --receipt out/phase10-execution-v1/attempts/a-i/observe-20260821-v1/validation.json" as const;
export const PHASE10_AI_VALIDATE_DECISION_COMMAND =
  "node runner/src/phase10-intake-observe-verify.ts validate-decisions --repository-root . --protocol research/phase10-execution-v1/packets/a-i/protocol.json --decisions research/phase10-execution-v1/packets/a-i/disposition-decisions.json --observations research/phase10-execution-v1/packets/a-i/observations.json --receipt out/phase10-execution-v1/attempts/a-i/observe-20260821-v1/decision-validation.json" as const;
export const PHASE10_AI_VALIDATE_SEMANTIC_REVIEW_COMMAND =
  "node runner/src/phase10-intake-observe-verify.ts validate-semantic-review --repository-root . --protocol research/phase10-execution-v1/packets/a-i/protocol.json --review research/phase10-execution-v1/packets/a-i/semantic-review.json" as const;
export const PHASE10_AI_INTAKE_PROTOCOL_IDENTITY = Object.freeze({
  path: PHASE10_AI_INTAKE_PROTOCOL_PATH,
  byteLength: 26443,
  sha256: "6adffffdbd02b7e023072f2e096909f43ee557b1fcd45e7a0d7f52107f36fe78",
});

export const PHASE10_AI_CHECK_IDS = Object.freeze([
  "chk-ai-currency-closed-once",
  "chk-ai-development-evidence-label",
  "chk-ai-exact-14-payloads",
  "chk-ai-exact-24-files",
  "chk-ai-rights-safe-projection",
  "chk-ai-terminal-dimensions",
  "chk-ai-three-denominators",
] as const);

export const PHASE10_AI_CHECK_WITNESSES = Object.freeze({
  "chk-ai-currency-closed-once": Object.freeze(["out-ai-currency"]),
  "chk-ai-development-evidence-label": Object.freeze(["out-ai-currency", "out-ai-dispositions"]),
  "chk-ai-exact-14-payloads": Object.freeze(["out-ai-dispositions"]),
  "chk-ai-exact-24-files": Object.freeze(["out-ai-file-custody"]),
  "chk-ai-rights-safe-projection": Object.freeze(["out-ai-dispositions", "out-ai-file-custody"]),
  "chk-ai-terminal-dimensions": Object.freeze(["out-ai-dispositions"]),
  "chk-ai-three-denominators": Object.freeze(["out-ai-report"]),
} as const);

export const PHASE10_AI_PRODUCER_OUTPUT_IDS = Object.freeze([
  "out-ai-artifact-index",
  "out-ai-currency",
  "out-ai-dispositions",
  "out-ai-file-custody",
  "out-ai-report",
] as const);

export const PHASE10_AI_OUTPUTS = Object.freeze([
  Object.freeze({ outputId: "out-ai-artifact-index", path: "evidence/phase10-scope-intake-v1/intake-artifact-index.json", candidateName: "intake-artifact-index.json", mediaType: "application/json" }),
  Object.freeze({ outputId: "out-ai-currency", path: "evidence/phase10-scope-intake-v1/currency.jsonl", candidateName: "currency.jsonl", mediaType: "application/x-ndjson" }),
  Object.freeze({ outputId: "out-ai-dispositions", path: "evidence/phase10-scope-intake-v1/post-freeze-dispositions.jsonl", candidateName: "post-freeze-dispositions.jsonl", mediaType: "application/x-ndjson" }),
  Object.freeze({ outputId: "out-ai-file-custody", path: "evidence/phase10-scope-intake-v1/file-custody.jsonl", candidateName: "file-custody.jsonl", mediaType: "application/x-ndjson" }),
  Object.freeze({ outputId: "out-ai-report", path: "evidence/phase10-scope-intake-v1/intake-report.json", candidateName: "intake-report.json", mediaType: "application/json" }),
  Object.freeze({ outputId: "out-ai-verification", path: "evidence/phase10-scope-intake-v1/intake-verification.json", candidateName: "intake-verification.json", mediaType: "application/json" }),
] as const);

export const PHASE10_AI_REOPEN_TRIGGERS = Object.freeze([
  "correction or version change to a consumed source",
  "maker-scheduled refresh",
  "newly selected load-bearing family",
  "unavailable priority lead becomes available",
] as const);

export const PHASE10_AI_VERIFICATION_LIMITS = Object.freeze([
  "A-I verifies the frozen intake, custody, currency, rights-safe projection, and terminal-disposition contract; it does not establish scientific validation or downstream Phase 10 results.",
  "The non-author semantic review is a committed, identity-bound judgment record; automated checks establish its provenance and zero-blocker disposition, not a theorem that every human judgment is correct.",
  "The private 26-file NAS roster is checked only through its bounded verifier and 24-of-26 tuple projection; private-only row names and restricted payload bytes are not published.",
].sort(lexical));

export const PHASE10_AI_CLAIM_BOUNDARY = Object.freeze({
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

const RIGHTS_SAFE_ALLOWED = Object.freeze([
  "artifact identities",
  "citations and persistent locators",
  "dates, endpoint identities, and query text",
  "byte lengths and SHA-256 digests",
  "NAS-relative bindings",
  "rights, lineage, purpose, and eligibility dispositions",
  "paraphrased reasons",
  "schemas and protocol definitions",
  "explicitly authorized project-derived summaries",
] as const);
const RIGHTS_SAFE_FORBIDDEN = Object.freeze([
  "restricted source payload bytes",
  "restricted PDFs, archives, datasets, or video",
  "frames or copied tables",
  "long source excerpts",
  "unapproved numeric row bodies",
] as const);

export type Phase10AICheckId = typeof PHASE10_AI_CHECK_IDS[number];
export type Phase10AIOutputId = typeof PHASE10_AI_OUTPUTS[number]["outputId"];

export interface ArtifactTuple {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface ProtocolBinding extends ArtifactTuple {
  readonly commit: string;
}

export interface ArtifactIndexEntry {
  readonly artifactId: string;
  readonly path: string;
  readonly mediaType: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly role: string;
  readonly producedBy: string;
}

export interface CustodyBinding {
  readonly intakeArtifact: ArtifactTuple;
  readonly collectionId: string;
  readonly ownerManifest: ArtifactTuple;
  readonly relativePath: string;
  readonly role: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface FileCustodyRow {
  readonly schema: "phase10-file-custody-row-v1";
  readonly custodyEntryId: string;
  readonly custodyBinding: CustodyBinding;
  readonly custodyClass: "source-payload" | "raw-acquisition-history" | "acquisition-metadata";
  readonly payloadId: string | null;
}

export interface PersistentId {
  readonly scheme: string;
  readonly value: string;
}

export interface IdentityDisposition {
  readonly status: "ambiguous" | "unavailable" | "verified";
  readonly canonicalCitation: string | null;
  readonly persistentIds: readonly PersistentId[];
}

export interface VersionDisposition {
  readonly status: "current-checked" | "not-applicable" | "partial" | "superseded" | "uncertain";
  readonly editionOrRelease: string | null;
  readonly correctionStatus: CurrencyComponentStatus;
  readonly supplementStatus: CurrencyComponentStatus;
  readonly currentnessSnapshotId: string | null;
}

export interface RightsDisposition {
  readonly status: "public-redistributable" | "restricted-third-party" | "unknown";
  readonly redistribution: "allowed" | "restricted" | "unknown";
  readonly trackedDerivativePolicy: "metadata-only" | "project-derived-summary-authorized" | "redistributable";
  readonly nasStorageRequired: boolean;
}

export interface LineageDisposition {
  readonly lineageId: string;
  readonly laboratoryOrProjectId: string | null;
  readonly methodId: string | null;
  readonly campaignId: string | null;
  readonly relatedPayloadIds: readonly string[];
}

export interface DuplicateDisposition {
  readonly status: "canonical" | "distinct" | "exact-duplicate" | "malformed-acquisition-copy" | "near-duplicate" | "not-applicable";
  readonly canonicalPayloadId: string | null;
  readonly basis: "digest" | "identity-version" | "manual-audit" | "not-applicable";
}

export interface PurposeDisposition {
  readonly candidateBranches: readonly ("B1a" | "B1b" | "B2" | "B3" | "B4" | "B5")[];
  readonly role: "apparatus" | "calibration-media" | "mapping" | "method" | "observation" | "provenance-only" | "reproducibility-only" | "theory" | "transport";
  readonly reason: string;
  readonly routingState: "confirmed" | "refused";
}

export interface DecisionEligibility {
  readonly status: "categorical-only" | "diagnostic-only" | "quantitative" | "refused";
  readonly blockingOperandIds: readonly string[];
  readonly reason: string;
}

export interface IntakeDispositionObservation {
  readonly payloadId: string;
  readonly identity: IdentityDisposition;
  readonly version: VersionDisposition;
  readonly rights: RightsDisposition;
  readonly lineage: LineageDisposition;
  readonly duplicate: DuplicateDisposition;
  readonly purpose: PurposeDisposition;
  readonly eligibility: DecisionEligibility;
  readonly openedByPhase10: false;
  readonly terminal: true;
}

export interface IntakeDispositionRow extends IntakeDispositionObservation {
  readonly schema: "phase10-intake-disposition-row-v1";
  readonly custodyBinding: CustodyBinding;
}

export type CurrencyComponentStatus = "checked-bound" | "checked-none-found" | "not-applicable" | "unresolved";

export interface CurrencySnapshotRow {
  readonly schema: "phase10-currency-snapshot-row-v1";
  readonly snapshotId: string;
  readonly lineageId: string;
  readonly selectedByBranches: readonly string[];
  readonly seedPayloadIds: readonly string[];
  readonly cutoffDate: string;
  readonly dateWindow: { readonly from: string; readonly through: string };
  readonly queries: readonly {
    readonly queryId: string;
    readonly serviceId: string;
    readonly endpoint: string;
    readonly query: string;
    readonly executedOn: string;
  }[];
  readonly candidates: readonly {
    readonly candidateId: string;
    readonly identity: string;
    readonly locator: string;
    readonly relation: "correction" | "version" | "supplement" | "native-data" | "later-output" | "unrelated";
    readonly disposition: "bound" | "no-change" | "unavailable" | "rejected" | "unresolved";
  }[];
  readonly correctionStatus: CurrencyComponentStatus;
  readonly versionStatus: CurrencyComponentStatus;
  readonly supplementStatus: CurrencyComponentStatus;
  readonly nativeDataStatus: CurrencyComponentStatus;
  readonly laterOutputStatus: CurrencyComponentStatus;
  readonly terminalDisposition: "correction-bound" | "current-no-change" | "priority-lead-unavailable" | "source-refusal" | "version-bound";
  readonly reopenTriggers: readonly string[];
  readonly closed: true;
}

export interface NasVerificationObservation {
  readonly state: "receipt-verified" | "unavailable-refusal";
  readonly checkedOn: string;
  readonly collectionId: string;
  readonly aggregateFiles: 26;
  readonly aggregateBytes: 165722101;
  readonly ownerManifest: ArtifactTuple;
  readonly matchedTrackedTupleCount: 24 | null;
  readonly privateOnlyTupleCount: 2 | null;
  readonly attemptReport: ArtifactTuple;
  readonly verificationReceipt: ArtifactTuple | null;
  readonly refusalReason: string | null;
  readonly restoreStatus: "pending";
  readonly backupStatus: "required-missing";
}

export interface IntakeObservations {
  readonly schema: "phase10-intake-observations-v1";
  readonly observationId: string;
  readonly observedOn: string;
  readonly queryExecutions: readonly QueryExecution[];
  readonly existingNasVerification: NasVerificationObservation;
  readonly newNasCollection: {
    readonly state: "not-applicable-no-new-bytes";
    readonly collectionId: "phase10-source-intake@2026-08-21-v1";
    readonly receipt: null;
    readonly sourcePruneAuthorized: false;
  };
}

export interface BasisRef {
  readonly basisId: string;
  readonly kind: "frozen-foundation" | "frozen-tracked-metadata" | "normalized-current-observation" | "paraphrased-analyst-judgment";
  readonly locator: string;
  readonly reason: string;
}

export interface DispositionDecision extends IntakeDispositionObservation {
  readonly basisRefs: readonly BasisRef[];
}

export interface CurrencyDecision {
  readonly snapshotId: string;
  readonly lineageId: string;
  readonly candidates: CurrencySnapshotRow["candidates"];
  readonly correctionStatus: CurrencyComponentStatus;
  readonly versionStatus: CurrencyComponentStatus;
  readonly supplementStatus: CurrencyComponentStatus;
  readonly nativeDataStatus: CurrencyComponentStatus;
  readonly laterOutputStatus: CurrencyComponentStatus;
  readonly terminalDisposition: CurrencySnapshotRow["terminalDisposition"];
  readonly basisQueryIds: readonly string[];
}

export interface IntakeDecisionInput {
  readonly schema: "phase10-intake-disposition-decisions-v1";
  readonly decisionId: string;
  readonly decidedOn: string;
  readonly dispositions: readonly DispositionDecision[];
  readonly currencyDecisions: readonly CurrencyDecision[];
  readonly semanticReviewRequired: true;
}

export interface IntakeSemanticReview {
  readonly schema: "phase10-intake-semantic-review-v1";
  readonly reviewId: string;
  readonly reviewedOn: string;
  readonly reviewer: {
    readonly model: string;
    readonly role: "non-author-semantic-reviewer";
    readonly sharedContextWithDeveloper: boolean;
    readonly authoredDecisionInput: false;
  };
  readonly protocol: ArtifactTuple;
  readonly decisions: ArtifactTuple;
  readonly observations: ArtifactTuple;
  readonly observationValidationReceipt: ArtifactTuple;
  readonly decisionValidationReceipt: ArtifactTuple;
  readonly rawArtifacts: readonly ArtifactTuple[];
  readonly reexecuted: readonly string[];
  readonly unresolvedBlockers: readonly string[];
  readonly limits: readonly string[];
  readonly verdict: "pass";
}

export interface QueryExecution {
  readonly queryId: string;
  readonly requestMethod: "GET" | "POST";
  readonly requestBody: string | null;
  readonly endpoint: string;
  readonly query: string;
  readonly startedOn: string;
  readonly endedOn: string;
  readonly terminalState: "http-response" | "network-refusal";
  readonly httpStatus: number | null;
  readonly responseUrl: string | null;
  readonly contentType: string | null;
  readonly rawResponse: ArtifactTuple;
  readonly error: string | null;
}

export interface IntakeProtocol {
  readonly raw: StrictJson;
  readonly protocolId: string;
  readonly createdOn: string;
  readonly foundationFreeze: ArtifactTuple;
  readonly obligationMatrix: ArtifactTuple;
  readonly artifactSchemaRegistry: ArtifactTuple;
  readonly trackedIntake: ArtifactTuple;
  readonly decisionPath: string;
  readonly observationPath: string;
  readonly semanticReviewPath: string;
  readonly custodyTupleRosterSha256: string;
  readonly sourcePayloadTupleRosterSha256: string;
  readonly existingOwnerManifest: ArtifactTuple;
  readonly outputArtifacts: readonly typeof PHASE10_AI_OUTPUTS[number][];
  readonly lineagePlan: readonly LineagePlan[];
  readonly unselectedPayloadPlan: readonly {
    readonly payloadId: string;
    readonly lineageId: string;
  }[];
  readonly observationAttempt: string;
  readonly observationValidationPath: string;
  readonly decisionValidationPath: string;
}

export interface CurrencyQueryPlan {
  readonly queryId: string;
  readonly serviceId: string;
  readonly requestMethod: "GET" | "POST";
  readonly requestBody: string | null;
  readonly endpoint: string;
  readonly query: string;
}

export interface LineagePlan {
  readonly lineageId: string;
  readonly selectedByBranches: readonly string[];
  readonly seedPayloadIds: readonly string[];
  readonly cutoffDate: string;
  readonly dateWindow: { readonly from: string; readonly through: string };
  readonly queries: readonly CurrencyQueryPlan[];
}

export interface FoundationIntake {
  readonly custodyFilePaths: readonly string[];
  readonly sourcePayloads: readonly {
    readonly payloadId: string;
    readonly path: string;
    readonly byteLength: number;
    readonly sha256: string;
    readonly intakeRole: string;
  }[];
}

export interface TrackedIntakeFile {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly role: string;
}

type JsonObject = { readonly [key: string]: StrictJson };

function invalid(label: string, detail: string): never {
  throw new Error(`${label} ${detail}`);
}

export function lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) invalid(label, "must be an object");
  return value as Record<string, unknown>;
}

function root(value: unknown, label: string): JsonObject {
  return object(strictJsonSnapshot(value), label) as JsonObject;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(lexical);
  const wanted = [...expected].sort(lexical);
  if (actual.length !== wanted.length || actual.some((entry, index) => entry !== wanted[index])) {
    invalid(label, `keys differ: got [${actual.join(", ")}], expected [${wanted.join(", ")}]`);
  }
}

function array(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) invalid(label, "must be an array");
  return value;
}

function text(value: unknown, label: string, maximum = 500): string {
  if (
    typeof value !== "string" || value.length === 0 || value !== value.trim() ||
    value.length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)
  ) invalid(label, `must be a trimmed rights-safe string of at most ${maximum} characters`);
  return value;
}

function nullableText(value: unknown, label: string, maximum = 500): string | null {
  return value === null ? null : text(value, label, maximum);
}

function stableId(value: unknown, label: string): string {
  const result = text(value, label, 160);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u.test(result)) invalid(label, "must be a stable ID");
  return result;
}

function path(value: unknown, label: string): string {
  const result = text(value, label, 600);
  if (
    result.includes("\\") || result.startsWith("/") || result.endsWith("/") ||
    result.split("/").some((part) => part === "" || part === "." || part === "..")
  ) invalid(label, "must be a safe relative POSIX path");
  return result;
}

function integer(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) invalid(label, "must be a nonnegative safe integer");
  return value;
}

function bool<T extends boolean>(value: unknown, expected: T, label: string): T {
  if (value !== expected) invalid(label, `must be ${String(expected)}`);
  return expected;
}

function literal<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  const result = text(value, label);
  if (!(allowed as readonly string[]).includes(result)) invalid(label, `must be one of ${allowed.join(", ")}`);
  return result as T;
}

function sha(value: unknown, label: string): string {
  const result = text(value, label, 64);
  if (!/^[0-9a-f]{64}$/u.test(result)) invalid(label, "must be a lowercase SHA-256");
  return result;
}

function isoDate(value: unknown, label: string): string {
  const result = text(value, label, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(result) || Number.isNaN(Date.parse(`${result}T00:00:00.000Z`))) {
    invalid(label, "must be an ISO date");
  }
  return result;
}

function isoTimestamp(value: unknown, label: string): string {
  const result = text(value, label, 24);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(result) || Number.isNaN(Date.parse(result))) invalid(label, "must be an ISO timestamp");
  return result;
}

function sortedUniqueStrings(value: unknown, label: string, allowEmpty = false): readonly string[] {
  const values = array(value, label).map((entry, index) => text(entry, `${label}[${index}]`));
  if (!allowEmpty && values.length === 0) invalid(label, "must not be empty");
  const sorted = [...values].sort(lexical);
  if (new Set(values).size !== values.length || values.some((entry, index) => entry !== sorted[index])) {
    invalid(label, "must be sorted and unique");
  }
  return Object.freeze(values);
}

function exactStringArray(value: unknown, expected: readonly string[], label: string): readonly string[] {
  const values = array(value, label).map((entry, index) => text(entry, `${label}[${index}]`));
  if (values.length !== expected.length || values.some((entry, index) => entry !== expected[index])) invalid(label, "differs from the exact frozen roster");
  return Object.freeze(values);
}

export function artifactTuple(value: unknown, label: string): ArtifactTuple {
  const row = object(value, label);
  exactKeys(row, ["path", "byteLength", "sha256"], label);
  return Object.freeze({
    path: path(row.path, `${label}.path`),
    byteLength: integer(row.byteLength, `${label}.byteLength`),
    sha256: sha(row.sha256, `${label}.sha256`),
  });
}

export function sha256Bytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function prettyJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

export function jsonlBytes(rows: readonly unknown[]): Uint8Array {
  if (rows.length === 0) invalid("JSONL rows", "must not be empty");
  return new TextEncoder().encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function decoded(bytes: Uint8Array, label: string): string {
  let result: string;
  try {
    result = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    invalid(label, "must be UTF-8");
  }
  if (result.includes("\r") || !result.endsWith("\n")) invalid(label, "must use LF and one terminal LF");
  return result;
}

export function parsePrettyJsonBytes(bytes: Uint8Array, label: string): StrictJson {
  const source = decoded(bytes, label);
  let parsed: unknown;
  try { parsed = JSON.parse(source) as unknown; } catch { invalid(label, "must be JSON"); }
  const snapshot = strictJsonSnapshot(parsed);
  const expected = prettyJsonBytes(snapshot);
  if (expected.byteLength !== bytes.byteLength || !expected.every((entry, index) => entry === bytes[index])) {
    invalid(label, "must be exact two-space JSON with one terminal LF");
  }
  return snapshot;
}

export function parseJsonlBytes(bytes: Uint8Array, label: string): readonly StrictJson[] {
  const source = decoded(bytes, label);
  const lines = source.slice(0, -1).split("\n");
  if (lines.length === 0 || lines.some((line) => line.length === 0)) invalid(label, "must not have empty rows");
  return Object.freeze(lines.map((line, index) => {
    let parsed: unknown;
    try { parsed = JSON.parse(line) as unknown; } catch { invalid(`${label}[${index}]`, "must be JSON"); }
    const snapshot = strictJsonSnapshot(parsed);
    if (canonicalJson(snapshot) !== line) invalid(`${label}[${index}]`, "must be canonical JSON");
    return snapshot;
  }));
}

function exactTuple(actual: ArtifactTuple, expected: ArtifactTuple, label: string): void {
  if (actual.path !== expected.path || actual.byteLength !== expected.byteLength || actual.sha256 !== expected.sha256) {
    invalid(label, "differs from the frozen identity");
  }
}

export function parseIntakeProtocol(value: unknown): IntakeProtocol {
  const label = "A-I intake protocol";
  const row = root(value, label);
  exactKeys(row, [
    "schema", "protocolId", "createdOn", "foundationFreeze", "obligationMatrix",
    "artifactSchemaRegistry", "trackedIntake", "decisionInput", "observationInput", "semanticReviewInput", "observationExecution", "observationRequestPolicies", "decisionSchema", "observationSchema", "semanticReviewSchema", "custody",
    "existingNasCollection", "newNasCollection", "currency", "lineagePlan", "unselectedPayloadPlan", "rightsSafeProjection",
    "scopeDependency", "outputArtifacts", "commands", "claimBoundary",
  ], label);
  literal(row.schema, ["phase10-intake-protocol-v1"] as const, `${label}.schema`);
  const decisionInput = object(row.decisionInput, `${label}.decisionInput`);
  exactKeys(decisionInput, ["path", "schema", "mustBeAbsentAtProtocolFreeze", "mustBeCommittedBeforeProduction", "rightsSafeMetadataOnly", "semanticReviewRequired", "basisKinds", "basisLocatorTemplates"], `${label}.decisionInput`);
  if (path(decisionInput.path, `${label}.decisionInput.path`) !== PHASE10_AI_DECISIONS_PATH) invalid(`${label}.decisionInput.path`, "differs");
  literal(decisionInput.schema, ["phase10-intake-disposition-decisions-v1"] as const, `${label}.decisionInput.schema`);
  bool(decisionInput.mustBeAbsentAtProtocolFreeze, true, `${label}.decisionInput.mustBeAbsentAtProtocolFreeze`);
  bool(decisionInput.mustBeCommittedBeforeProduction, true, `${label}.decisionInput.mustBeCommittedBeforeProduction`);
  bool(decisionInput.rightsSafeMetadataOnly, true, `${label}.decisionInput.rightsSafeMetadataOnly`);
  bool(decisionInput.semanticReviewRequired, true, `${label}.decisionInput.semanticReviewRequired`);
  const basisKinds = sortedUniqueStrings(decisionInput.basisKinds, `${label}.decisionInput.basisKinds`);
  if (basisKinds.join("\0") !== ["frozen-foundation", "frozen-tracked-metadata", "normalized-current-observation", "paraphrased-analyst-judgment"].sort(lexical).join("\0")) invalid(`${label}.decisionInput.basisKinds`, "differ");
  const basisTemplates = object(decisionInput.basisLocatorTemplates, `${label}.decisionInput.basisLocatorTemplates`);
  exactKeys(basisTemplates, ["frozenFoundation", "frozenTrackedMetadata", "normalizedCurrentObservation", "paraphrasedAnalystJudgment"], `${label}.decisionInput.basisLocatorTemplates`);
  if (
    basisTemplates.frozenFoundation !== "research/phase10-foundation-freeze-v1.json#intakeRoster/sourcePayloads[payloadId={payloadId}]" ||
    basisTemplates.frozenTrackedMetadata !== "research/phase9-post-freeze-source-intake-v1.json#files[source-payload-for={payloadId}]" ||
    basisTemplates.normalizedCurrentObservation !== "research/phase10-execution-v1/packets/a-i/observations.json#queryExecutions[queryId={queryId}]" ||
    basisTemplates.paraphrasedAnalystJudgment !== "analyst-judgment:{payloadId}"
  ) invalid(`${label}.decisionInput.basisLocatorTemplates`, "differ");
  const observation = object(row.observationInput, `${label}.observationInput`);
  exactKeys(observation, ["path", "schema", "mustBeAbsentAtProtocolFreeze", "mustBeCommittedBeforeProduction", "rightsSafeMetadataOnly"], `${label}.observationInput`);
  if (path(observation.path, `${label}.observationInput.path`) !== PHASE10_AI_OBSERVATIONS_PATH) invalid(`${label}.observationInput.path`, "differs");
  literal(observation.schema, ["phase10-intake-observations-v1"] as const, `${label}.observationInput.schema`);
  bool(observation.mustBeAbsentAtProtocolFreeze, true, `${label}.observationInput.mustBeAbsentAtProtocolFreeze`);
  bool(observation.mustBeCommittedBeforeProduction, true, `${label}.observationInput.mustBeCommittedBeforeProduction`);
  bool(observation.rightsSafeMetadataOnly, true, `${label}.observationInput.rightsSafeMetadataOnly`);
  const semanticReviewInput = object(row.semanticReviewInput, `${label}.semanticReviewInput`);
  exactKeys(semanticReviewInput, ["path", "schema", "mustBeAbsentAtProtocolFreeze", "mustBeCommittedBeforeProduction", "reviewerMustBeNonAuthor", "zeroUnresolvedBlockersRequired"], `${label}.semanticReviewInput`);
  if (path(semanticReviewInput.path, `${label}.semanticReviewInput.path`) !== PHASE10_AI_SEMANTIC_REVIEW_PATH) invalid(`${label}.semanticReviewInput.path`, "differs");
  literal(semanticReviewInput.schema, ["phase10-intake-semantic-review-v1"] as const, `${label}.semanticReviewInput.schema`);
  bool(semanticReviewInput.mustBeAbsentAtProtocolFreeze, true, `${label}.semanticReviewInput.mustBeAbsentAtProtocolFreeze`);
  bool(semanticReviewInput.mustBeCommittedBeforeProduction, true, `${label}.semanticReviewInput.mustBeCommittedBeforeProduction`);
  bool(semanticReviewInput.reviewerMustBeNonAuthor, true, `${label}.semanticReviewInput.reviewerMustBeNonAuthor`);
  bool(semanticReviewInput.zeroUnresolvedBlockersRequired, true, `${label}.semanticReviewInput.zeroUnresolvedBlockersRequired`);
  const execution = object(row.observationExecution, `${label}.observationExecution`);
  exactKeys(execution, ["attemptDirectory", "rawDirectory", "validationReceiptPath", "decisionValidationReceiptPath", "processConcurrency", "httpPolicy", "rawBodiesTracked", "rawBodiesRetainedThroughIndependentEvaluation", "responseProjection", "nasCommand"], `${label}.observationExecution`);
  if (
    path(execution.attemptDirectory, `${label}.observationExecution.attemptDirectory`) !== PHASE10_AI_OBSERVATION_ATTEMPT ||
    path(execution.rawDirectory, `${label}.observationExecution.rawDirectory`) !== `${PHASE10_AI_OBSERVATION_ATTEMPT}/raw` ||
    path(execution.validationReceiptPath, `${label}.observationExecution.validationReceiptPath`) !== PHASE10_AI_OBSERVATION_VALIDATION_PATH ||
    path(execution.decisionValidationReceiptPath, `${label}.observationExecution.decisionValidationReceiptPath`) !== PHASE10_AI_DECISION_VALIDATION_PATH ||
    integer(execution.processConcurrency, `${label}.observationExecution.processConcurrency`) !== 1 ||
    execution.rawBodiesTracked !== false || execution.rawBodiesRetainedThroughIndependentEvaluation !== true ||
    execution.nasCommand !== "npm run assets:verify -- --collection post-phase9-intake@2026-08-13 --full"
  ) invalid(`${label}.observationExecution`, "differs from the bounded observation execution");
  const httpPolicy = object(execution.httpPolicy, `${label}.observationExecution.httpPolicy`);
  exactKeys(httpPolicy, ["timeoutMs", "maxResponseBytes", "redirect", "userAgent"], `${label}.observationExecution.httpPolicy`);
  if (httpPolicy.timeoutMs !== 30000 || httpPolicy.maxResponseBytes !== 8388608 || httpPolicy.redirect !== "follow" || httpPolicy.userAgent !== "snowflake-phase10-a-i/1.0 (finite source-currency observation)") invalid(`${label}.observationExecution.httpPolicy`, "differs");
  exactStringArray(execution.responseProjection, ["queryId", "requestMethod", "requestBody", "endpoint", "query", "startedOn", "endedOn", "httpStatus", "responseUrl", "contentType", "rawResponse"], `${label}.observationExecution.responseProjection`);
  const requestPolicies = object(row.observationRequestPolicies, `${label}.observationRequestPolicies`);
  exactKeys(requestPolicies, ["arxiv-api", "crossref-rest", "datacite-rest", "figshare-api"], `${label}.observationRequestPolicies`);
  const methods = new Map<string, "GET" | "POST">();
  for (const [serviceId, expected] of Object.entries({
    "arxiv-api": { requestMethod: "GET", accept: "application/atom+xml", contentType: null },
    "crossref-rest": { requestMethod: "GET", accept: "application/json", contentType: null },
    "datacite-rest": { requestMethod: "GET", accept: "application/json", contentType: null },
    "figshare-api": { requestMethod: "POST", accept: "application/json", contentType: "application/json" },
  } as const)) {
    const policy = object(requestPolicies[serviceId], `${label}.observationRequestPolicies.${serviceId}`);
    exactKeys(policy, ["requestMethod", "accept", "contentType"], `${label}.observationRequestPolicies.${serviceId}`);
    if (canonicalJson(policy) !== canonicalJson(expected)) invalid(`${label}.observationRequestPolicies.${serviceId}`, "differs");
    methods.set(serviceId, expected.requestMethod);
  }
  const decisionSchema = object(row.decisionSchema, `${label}.decisionSchema`);
  exactKeys(decisionSchema, ["exactFields", "dispositionExactFields", "currencyDecisionExactFields", "basisRefExactFields"], `${label}.decisionSchema`);
  const expectedDecisionSchema = {
    exactFields: ["schema", "decisionId", "decidedOn", "dispositions", "currencyDecisions", "semanticReviewRequired"],
    dispositionExactFields: ["payloadId", "identity", "version", "rights", "lineage", "duplicate", "purpose", "eligibility", "openedByPhase10", "terminal", "basisRefs"],
    currencyDecisionExactFields: ["snapshotId", "lineageId", "candidates", "correctionStatus", "versionStatus", "supplementStatus", "nativeDataStatus", "laterOutputStatus", "terminalDisposition", "basisQueryIds"],
    basisRefExactFields: ["basisId", "kind", "locator", "reason"],
  };
  if (canonicalJson(decisionSchema) !== canonicalJson(expectedDecisionSchema)) invalid(`${label}.decisionSchema`, "differs");
  const observationSchema = object(row.observationSchema, `${label}.observationSchema`);
  exactKeys(observationSchema, ["exactFields", "queryExecutionExactFields", "nasVerificationExactFields", "newNasCollectionExactFields", "queryTerminalStates", "nasTerminalStates"], `${label}.observationSchema`);
  const expectedObservationSchema = {
    exactFields: ["schema", "observationId", "observedOn", "queryExecutions", "existingNasVerification", "newNasCollection"],
    queryExecutionExactFields: ["queryId", "requestMethod", "requestBody", "endpoint", "query", "startedOn", "endedOn", "terminalState", "httpStatus", "responseUrl", "contentType", "rawResponse", "error"],
    nasVerificationExactFields: ["state", "checkedOn", "collectionId", "aggregateFiles", "aggregateBytes", "ownerManifest", "matchedTrackedTupleCount", "privateOnlyTupleCount", "attemptReport", "verificationReceipt", "refusalReason", "restoreStatus", "backupStatus"],
    newNasCollectionExactFields: ["state", "collectionId", "receipt", "sourcePruneAuthorized"],
    queryTerminalStates: ["http-response", "network-refusal"],
    nasTerminalStates: ["receipt-verified", "unavailable-refusal"],
  };
  if (canonicalJson(observationSchema) !== canonicalJson(expectedObservationSchema)) invalid(`${label}.observationSchema`, "differs");
  const semanticReviewSchema = object(row.semanticReviewSchema, `${label}.semanticReviewSchema`);
  exactKeys(semanticReviewSchema, ["exactFields", "reviewerExactFields", "requiredBindings", "minimumReexecutedCount", "minimumLimitCount"], `${label}.semanticReviewSchema`);
  const expectedSemanticReviewSchema = {
    exactFields: ["schema", "reviewId", "reviewedOn", "reviewer", "protocol", "decisions", "observations", "observationValidationReceipt", "decisionValidationReceipt", "rawArtifacts", "reexecuted", "unresolvedBlockers", "limits", "verdict"],
    reviewerExactFields: ["model", "role", "sharedContextWithDeveloper", "authoredDecisionInput"],
    requiredBindings: ["protocol", "decisions", "observations", "observationValidationReceipt", "decisionValidationReceipt", "rawArtifacts"],
    minimumReexecutedCount: 1,
    minimumLimitCount: 1,
  };
  if (canonicalJson(semanticReviewSchema) !== canonicalJson(expectedSemanticReviewSchema)) invalid(`${label}.semanticReviewSchema`, "differs");
  const custody = object(row.custody, `${label}.custody`);
  exactKeys(custody, ["trackedFileCount", "sourcePayloadCount", "rawAcquisitionHistoryCount", "acquisitionMetadataCount", "nasAggregateFileCount", "custodyTupleRosterSha256", "sourcePayloadTupleRosterSha256"], `${label}.custody`);
  const expectedCounts = [24, 14, 1, 9, 26] as const;
  [custody.trackedFileCount, custody.sourcePayloadCount, custody.rawAcquisitionHistoryCount, custody.acquisitionMetadataCount, custody.nasAggregateFileCount].forEach((entry, index) => {
    if (integer(entry, `${label}.custody count`) !== expectedCounts[index]) invalid(`${label}.custody`, "denominators differ");
  });
  const existingNas = object(row.existingNasCollection, `${label}.existingNasCollection`);
  exactKeys(existingNas, ["collectionId", "state", "locator", "storageClass", "aggregateFiles", "aggregateBytes", "ownerManifest", "rights", "privacy", "servePolicy", "mutability", "retentionPolicy", "restoreStatus", "backupStatus"], `${label}.existingNasCollection`);
  if (
    stableId(existingNas.collectionId, `${label}.existingNasCollection.collectionId`) !== "post-phase9-intake@2026-08-13" ||
    literal(existingNas.state, ["provisional"] as const, `${label}.existingNasCollection.state`) !== "provisional" ||
    integer(existingNas.aggregateFiles, `${label}.existingNasCollection.aggregateFiles`) !== 26 ||
    integer(existingNas.aggregateBytes, `${label}.existingNasCollection.aggregateBytes`) !== 165722101 ||
    literal(existingNas.restoreStatus, ["pending"] as const, `${label}.existingNasCollection.restoreStatus`) !== "pending" ||
    literal(existingNas.backupStatus, ["required-missing"] as const, `${label}.existingNasCollection.backupStatus`) !== "required-missing"
  ) invalid(`${label}.existingNasCollection`, "governance state differs");
  ["locator", "storageClass", "rights", "privacy", "servePolicy", "mutability", "retentionPolicy"].forEach((key) => text(existingNas[key], `${label}.existingNasCollection.${key}`));
  const newNas = object(row.newNasCollection, `${label}.newNasCollection`);
  exactKeys(newNas, ["collectionId", "aIAction", "receipt", "sourcePruneAuthorized"], `${label}.newNasCollection`);
  literal(newNas.collectionId, ["phase10-source-intake@2026-08-21-v1"] as const, `${label}.newNasCollection.collectionId`);
  literal(newNas.aIAction, ["not-applicable-no-new-bytes"] as const, `${label}.newNasCollection.aIAction`);
  if (newNas.receipt !== null) invalid(`${label}.newNasCollection.receipt`, "must be null");
  bool(newNas.sourcePruneAuthorized, false, `${label}.newNasCollection.sourcePruneAuthorized`);
  const currency = object(row.currency, `${label}.currency`);
  exactKeys(currency, ["selectedBranchIds", "snapshotCountPerSelectedLineage", "standingWatchAuthorized", "reopenTriggers"], `${label}.currency`);
  const branches = sortedUniqueStrings(currency.selectedBranchIds, `${label}.currency.selectedBranchIds`);
  if (branches.join("\0") !== ["B1a", "B1b", "B2", "B3", "B4", "B5"].join("\0")) invalid(`${label}.currency.selectedBranchIds`, "differs");
  if (integer(currency.snapshotCountPerSelectedLineage, `${label}.currency.snapshotCountPerSelectedLineage`) !== 1) invalid(`${label}.currency`, "must close once");
  bool(currency.standingWatchAuthorized, false, `${label}.currency.standingWatchAuthorized`);
  const triggers = sortedUniqueStrings(currency.reopenTriggers, `${label}.currency.reopenTriggers`);
  if (triggers.join("\0") !== [...PHASE10_AI_REOPEN_TRIGGERS].sort(lexical).join("\0")) invalid(`${label}.currency.reopenTriggers`, "differs");
  const lineagePlan = array(row.lineagePlan, `${label}.lineagePlan`).map((entry, index) => {
    const plan = object(entry, `${label}.lineagePlan[${index}]`);
    exactKeys(plan, ["lineageId", "selectedByBranches", "seedPayloadIds", "cutoffDate", "dateWindow", "queries"], `${label}.lineagePlan[${index}]`);
    const window = object(plan.dateWindow, `${label}.lineagePlan[${index}].dateWindow`);
    exactKeys(window, ["from", "through"], `${label}.lineagePlan[${index}].dateWindow`);
    const from = isoDate(window.from, `${label}.lineagePlan[${index}].dateWindow.from`);
    const through = isoDate(window.through, `${label}.lineagePlan[${index}].dateWindow.through`);
    const cutoffDate = isoDate(plan.cutoffDate, `${label}.lineagePlan[${index}].cutoffDate`);
    if (from > through || through > cutoffDate) invalid(`${label}.lineagePlan[${index}].dateWindow`, "must end by cutoff");
    const queries = array(plan.queries, `${label}.lineagePlan[${index}].queries`).map((queryValue, queryIndex) => {
      const query = object(queryValue, `${label}.lineagePlan[${index}].queries[${queryIndex}]`);
      exactKeys(query, ["queryId", "serviceId", "requestMethod", "requestBody", "endpoint", "query"], `${label}.lineagePlan[${index}].queries[${queryIndex}]`);
      const serviceId = stableId(query.serviceId, `${label}.lineagePlan service ID`);
      const expectedMethod = methods.get(serviceId);
      if (expectedMethod === undefined) invalid(`${label}.lineagePlan service ID`, "has no frozen request policy");
      const requestMethod = literal(query.requestMethod, ["GET", "POST"] as const, `${label}.lineagePlan request method`);
      if (requestMethod !== expectedMethod) invalid(`${label}.lineagePlan request method`, "differs from its frozen service policy");
      const queryText = text(query.query, `${label}.lineagePlan query`, 500);
      const requestBody = query.requestBody === null ? null : text(query.requestBody, `${label}.lineagePlan request body`, 1000);
      if (requestMethod === "POST") {
        let body: unknown;
        try { body = JSON.parse(requestBody ?? "") as unknown; } catch { invalid(`${label}.lineagePlan request body`, "POST body must be JSON"); }
        if (canonicalJson(strictJsonSnapshot(body)) !== requestBody) invalid(`${label}.lineagePlan request body`, "POST body must be canonical JSON");
      } else if (requestBody !== null) invalid(`${label}.lineagePlan request body`, "must be null for GET");
      return Object.freeze({ queryId: stableId(query.queryId, `${label}.lineagePlan query ID`), serviceId, requestMethod, requestBody, endpoint: text(query.endpoint, `${label}.lineagePlan endpoint`, 500), query: queryText });
    });
    if (queries.length === 0 || queries.some((query, queryIndex) => queryIndex > 0 && queries[queryIndex - 1]!.queryId >= query.queryId)) invalid(`${label}.lineagePlan[${index}].queries`, "must be nonempty, sorted, and unique");
    return Object.freeze({ lineageId: stableId(plan.lineageId, `${label}.lineagePlan[${index}].lineageId`), selectedByBranches: sortedUniqueStrings(plan.selectedByBranches, `${label}.lineagePlan[${index}].selectedByBranches`), seedPayloadIds: sortedUniqueStrings(plan.seedPayloadIds, `${label}.lineagePlan[${index}].seedPayloadIds`), cutoffDate, dateWindow: Object.freeze({ from, through }), queries: Object.freeze(queries) });
  });
  if (lineagePlan.length !== 12 || lineagePlan.some((entry, index) => index > 0 && lineagePlan[index - 1]!.lineageId >= entry.lineageId)) invalid(`${label}.lineagePlan`, "must be 12 sorted unique work lineages");
  const selectedPayloadIds = lineagePlan.flatMap((entry) => entry.seedPayloadIds);
  if (selectedPayloadIds.length !== 12 || new Set(selectedPayloadIds).size !== 12) invalid(`${label}.lineagePlan`, "must select exactly 12 distinct payloads");
  const unselectedPayloadPlan = array(row.unselectedPayloadPlan, `${label}.unselectedPayloadPlan`).map((entry, index) => {
    const plan = object(entry, `${label}.unselectedPayloadPlan[${index}]`);
    exactKeys(plan, ["payloadId", "lineageId", "candidateBranches", "requiredRoutingState"], `${label}.unselectedPayloadPlan[${index}]`);
    if (array(plan.candidateBranches, `${label}.unselectedPayloadPlan[${index}].candidateBranches`).length !== 0 || plan.requiredRoutingState !== "refused") invalid(`${label}.unselectedPayloadPlan[${index}]`, "must freeze no branch and refusal");
    return Object.freeze({ payloadId: stableId(plan.payloadId, `${label}.unselectedPayloadPlan[${index}].payloadId`), lineageId: stableId(plan.lineageId, `${label}.unselectedPayloadPlan[${index}].lineageId`) });
  });
  if (unselectedPayloadPlan.length !== 2 || unselectedPayloadPlan.some((entry, index) => index > 0 && unselectedPayloadPlan[index - 1]!.payloadId >= entry.payloadId) || unselectedPayloadPlan.some((entry) => selectedPayloadIds.includes(entry.payloadId))) invalid(`${label}.unselectedPayloadPlan`, "must be two sorted distinct unselected payloads");
  const rightsSafe = object(row.rightsSafeProjection, `${label}.rightsSafeProjection`);
  exactKeys(rightsSafe, ["allowed", "forbidden", "defaultRestrictedOrUnknownDerivativePolicy"], `${label}.rightsSafeProjection`);
  if (
    exactStringArray(rightsSafe.allowed, RIGHTS_SAFE_ALLOWED, `${label}.rightsSafeProjection.allowed`).join("\0") !== RIGHTS_SAFE_ALLOWED.join("\0") ||
    exactStringArray(rightsSafe.forbidden, RIGHTS_SAFE_FORBIDDEN, `${label}.rightsSafeProjection.forbidden`).join("\0") !== RIGHTS_SAFE_FORBIDDEN.join("\0") ||
    rightsSafe.defaultRestrictedOrUnknownDerivativePolicy !== "metadata-only"
  ) invalid(`${label}.rightsSafeProjection`, "differs from frozen tracked/private boundary");
  const commands = object(row.commands, `${label}.commands`);
  exactKeys(commands, ["observe", "validateObservation", "validateDecisions", "validateSemanticReview", "produce", "verify", "publish"], `${label}.commands`);
  if (
    commands.observe !== PHASE10_AI_OBSERVE_COMMAND || commands.validateObservation !== PHASE10_AI_VALIDATE_OBSERVATION_COMMAND ||
    commands.validateDecisions !== PHASE10_AI_VALIDATE_DECISION_COMMAND || commands.validateSemanticReview !== PHASE10_AI_VALIDATE_SEMANTIC_REVIEW_COMMAND ||
    commands.produce !== PHASE10_AI_PRODUCE_COMMAND || commands.verify !== PHASE10_AI_VERIFY_COMMAND || commands.publish !== PHASE10_AI_PUBLISH_COMMAND
  ) invalid(`${label}.commands`, "differ from exact frozen CLI");
  const outputs = array(row.outputArtifacts, `${label}.outputArtifacts`).map((entry, index) => {
    const output = object(entry, `${label}.outputArtifacts[${index}]`);
    exactKeys(output, ["outputId", "path", "candidateName", "mediaType"], `${label}.outputArtifacts[${index}]`);
    return Object.freeze({ outputId: stableId(output.outputId, `${label}.outputArtifacts[${index}].outputId`) as Phase10AIOutputId, path: path(output.path, `${label}.outputArtifacts[${index}].path`), candidateName: path(output.candidateName, `${label}.outputArtifacts[${index}].candidateName`), mediaType: text(output.mediaType, `${label}.outputArtifacts[${index}].mediaType`) });
  });
  if (canonicalJson(outputs) !== canonicalJson(PHASE10_AI_OUTPUTS)) invalid(`${label}.outputArtifacts`, "differ from registered outputs");
  const claim = root(row.claimBoundary, `${label}.claimBoundary`);
  if (canonicalJson(claim) !== canonicalJson(PHASE10_AI_CLAIM_BOUNDARY)) invalid(`${label}.claimBoundary`, "differs from frozen boundary");
  const dependency = object(row.scopeDependency, `${label}.scopeDependency`);
  exactKeys(dependency, ["packetId", "preflightReceiptPath", "terminalReceiptPath", "verificationPath", "requiredTerminalState", "requiredAggregateVerdict"], `${label}.scopeDependency`);
  if (
    dependency.packetId !== "a-s" || dependency.requiredTerminalState !== "pass" || dependency.requiredAggregateVerdict !== "pass" ||
    dependency.preflightReceiptPath !== "evidence/phase10-obligation-preflight-v1/packets/a-s/preflight.json" ||
    dependency.terminalReceiptPath !== "evidence/phase10-obligation-preflight-v1/packets/a-s/terminal-receipt.json" ||
    dependency.verificationPath !== "evidence/phase10-scope-intake-v1/scope-verification.json"
  ) invalid(`${label}.scopeDependency`, "differs from completed A-S prerequisite");
  return Object.freeze({
    raw: strictJsonSnapshot(row),
    protocolId: stableId(row.protocolId, `${label}.protocolId`),
    createdOn: isoDate(row.createdOn, `${label}.createdOn`),
    foundationFreeze: artifactTuple(row.foundationFreeze, `${label}.foundationFreeze`),
    obligationMatrix: artifactTuple(row.obligationMatrix, `${label}.obligationMatrix`),
    artifactSchemaRegistry: artifactTuple(row.artifactSchemaRegistry, `${label}.artifactSchemaRegistry`),
    trackedIntake: artifactTuple(row.trackedIntake, `${label}.trackedIntake`),
    decisionPath: PHASE10_AI_DECISIONS_PATH,
    observationPath: PHASE10_AI_OBSERVATIONS_PATH,
    semanticReviewPath: PHASE10_AI_SEMANTIC_REVIEW_PATH,
    custodyTupleRosterSha256: sha(custody.custodyTupleRosterSha256, `${label}.custody.custodyTupleRosterSha256`),
    sourcePayloadTupleRosterSha256: sha(custody.sourcePayloadTupleRosterSha256, `${label}.custody.sourcePayloadTupleRosterSha256`),
    existingOwnerManifest: artifactTuple(existingNas.ownerManifest, `${label}.existingNasCollection.ownerManifest`),
    outputArtifacts: Object.freeze(outputs) as IntakeProtocol["outputArtifacts"],
    lineagePlan: Object.freeze(lineagePlan),
    unselectedPayloadPlan: Object.freeze(unselectedPayloadPlan),
    observationAttempt: PHASE10_AI_OBSERVATION_ATTEMPT,
    observationValidationPath: PHASE10_AI_OBSERVATION_VALIDATION_PATH,
    decisionValidationPath: PHASE10_AI_DECISION_VALIDATION_PATH,
  });
}

export function parseFoundationIntake(value: unknown): FoundationIntake {
  const row = root(value, "Phase 10 foundation");
  const intake = object(row.intakeRoster, "Phase 10 foundation.intakeRoster");
  const custodyFilePaths = sortedUniqueStrings(intake.custodyFilePaths, "Phase 10 foundation custody paths");
  if (custodyFilePaths.length !== 24) invalid("Phase 10 foundation custody paths", "must contain 24 paths");
  const sourcePayloads = array(intake.sourcePayloads, "Phase 10 foundation source payloads").map((entry, index) => {
    const item = object(entry, `Phase 10 foundation source payloads[${index}]`);
    exactKeys(item, ["payloadId", "path", "byteLength", "sha256", "intakeRole"], `Phase 10 foundation source payloads[${index}]`);
    return Object.freeze({ payloadId: stableId(item.payloadId, `source payload ${index} ID`), path: path(item.path, `source payload ${index} path`), byteLength: integer(item.byteLength, `source payload ${index} bytes`), sha256: sha(item.sha256, `source payload ${index} SHA`), intakeRole: text(item.intakeRole, `source payload ${index} role`) });
  });
  if (sourcePayloads.length !== 14 || sourcePayloads.some((entry, index) => index > 0 && sourcePayloads[index - 1]!.payloadId >= entry.payloadId)) invalid("Phase 10 foundation source payloads", "must be 14 sorted unique payloads");
  return Object.freeze({ custodyFilePaths, sourcePayloads: Object.freeze(sourcePayloads) });
}

export function parseTrackedIntakeFiles(value: unknown): readonly TrackedIntakeFile[] {
  const row = root(value, "tracked post-freeze intake");
  exactKeys(row, ["schema", "createdOn", "acquisitionWindow", "state", "nas", "rights", "files", "containerChecks", "historicalBoundary", "duplicatesAndScratchNotArchived"], "tracked post-freeze intake");
  const files = array(row.files, "tracked post-freeze intake.files").map((entry, index) => {
    const item = object(entry, `tracked post-freeze intake.files[${index}]`);
    const keys = Object.keys(item);
    if (!["path", "bytes", "sha256", "role"].every((key) => keys.includes(key)) || keys.some((key) => !["path", "bytes", "sha256", "role", "source", "note"].includes(key))) invalid(`tracked post-freeze intake.files[${index}]`, "keys differ from the bounded input row");
    if (item.source !== undefined) text(item.source, `tracked post-freeze intake.files[${index}].source`, 2000);
    if (item.note !== undefined) text(item.note, `tracked post-freeze intake.files[${index}].note`, 4000);
    return Object.freeze({ path: path(item.path, `tracked post-freeze intake.files[${index}].path`), byteLength: integer(item.bytes, `tracked post-freeze intake.files[${index}].bytes`), sha256: sha(item.sha256, `tracked post-freeze intake.files[${index}].sha256`), role: text(item.role, `tracked post-freeze intake.files[${index}].role`) });
  });
  const sorted = [...files].sort((left, right) => lexical(left.path, right.path));
  if (sorted.length !== 24 || sorted.some((entry, index) => index > 0 && sorted[index - 1]!.path === entry.path)) invalid("tracked post-freeze intake.files", "must contain 24 unique paths");
  return Object.freeze(sorted);
}

function persistentId(value: unknown, label: string): PersistentId {
  const row = object(value, label);
  exactKeys(row, ["scheme", "value"], label);
  return Object.freeze({ scheme: text(row.scheme, `${label}.scheme`, 80), value: text(row.value, `${label}.value`, 300) });
}

function identityDisposition(value: unknown, label: string): IdentityDisposition {
  const row = object(value, label);
  exactKeys(row, ["status", "canonicalCitation", "persistentIds"], label);
  const ids = array(row.persistentIds, `${label}.persistentIds`).map((entry, index) => persistentId(entry, `${label}.persistentIds[${index}]`));
  if (ids.some((entry, index) => index > 0 && `${ids[index - 1]!.scheme}\0${ids[index - 1]!.value}` >= `${entry.scheme}\0${entry.value}`)) invalid(`${label}.persistentIds`, "must be sorted and unique");
  const result = Object.freeze({ status: literal(row.status, ["ambiguous", "unavailable", "verified"] as const, `${label}.status`), canonicalCitation: nullableText(row.canonicalCitation, `${label}.canonicalCitation`, 500), persistentIds: Object.freeze(ids) });
  if (result.status === "verified" && result.canonicalCitation === null && result.persistentIds.length === 0) invalid(label, "verified identity needs a citation or persistent ID");
  return result;
}

function componentStatus(value: unknown, label: string): CurrencyComponentStatus {
  return literal(value, ["checked-bound", "checked-none-found", "not-applicable", "unresolved"] as const, label);
}

function versionDisposition(value: unknown, label: string): VersionDisposition {
  const row = object(value, label);
  exactKeys(row, ["status", "editionOrRelease", "correctionStatus", "supplementStatus", "currentnessSnapshotId"], label);
  return Object.freeze({ status: literal(row.status, ["current-checked", "not-applicable", "partial", "superseded", "uncertain"] as const, `${label}.status`), editionOrRelease: nullableText(row.editionOrRelease, `${label}.editionOrRelease`, 300), correctionStatus: componentStatus(row.correctionStatus, `${label}.correctionStatus`), supplementStatus: componentStatus(row.supplementStatus, `${label}.supplementStatus`), currentnessSnapshotId: row.currentnessSnapshotId === null ? null : stableId(row.currentnessSnapshotId, `${label}.currentnessSnapshotId`) });
}

function rightsDisposition(value: unknown, label: string): RightsDisposition {
  const row = object(value, label);
  exactKeys(row, ["status", "redistribution", "trackedDerivativePolicy", "nasStorageRequired"], label);
  const result = Object.freeze({ status: literal(row.status, ["public-redistributable", "restricted-third-party", "unknown"] as const, `${label}.status`), redistribution: literal(row.redistribution, ["allowed", "restricted", "unknown"] as const, `${label}.redistribution`), trackedDerivativePolicy: literal(row.trackedDerivativePolicy, ["metadata-only", "project-derived-summary-authorized", "redistributable"] as const, `${label}.trackedDerivativePolicy`), nasStorageRequired: typeof row.nasStorageRequired === "boolean" ? row.nasStorageRequired : invalid(`${label}.nasStorageRequired`, "must be boolean") });
  if (result.status === "public-redistributable") {
    if (result.redistribution !== "allowed") invalid(label, "public rights require allowed redistribution");
  } else if (result.trackedDerivativePolicy !== "metadata-only" || result.redistribution === "allowed" || !result.nasStorageRequired) {
    invalid(label, "restricted or unknown rights require metadata-only tracked projection and NAS storage");
  }
  return result;
}

function lineageDisposition(value: unknown, label: string): LineageDisposition {
  const row = object(value, label);
  exactKeys(row, ["lineageId", "laboratoryOrProjectId", "methodId", "campaignId", "relatedPayloadIds"], label);
  return Object.freeze({ lineageId: stableId(row.lineageId, `${label}.lineageId`), laboratoryOrProjectId: row.laboratoryOrProjectId === null ? null : stableId(row.laboratoryOrProjectId, `${label}.laboratoryOrProjectId`), methodId: row.methodId === null ? null : stableId(row.methodId, `${label}.methodId`), campaignId: row.campaignId === null ? null : stableId(row.campaignId, `${label}.campaignId`), relatedPayloadIds: sortedUniqueStrings(row.relatedPayloadIds, `${label}.relatedPayloadIds`) });
}

function duplicateDisposition(value: unknown, label: string): DuplicateDisposition {
  const row = object(value, label);
  exactKeys(row, ["status", "canonicalPayloadId", "basis"], label);
  const result = Object.freeze({ status: literal(row.status, ["canonical", "distinct", "exact-duplicate", "malformed-acquisition-copy", "near-duplicate", "not-applicable"] as const, `${label}.status`), canonicalPayloadId: row.canonicalPayloadId === null ? null : stableId(row.canonicalPayloadId, `${label}.canonicalPayloadId`), basis: literal(row.basis, ["digest", "identity-version", "manual-audit", "not-applicable"] as const, `${label}.basis`) });
  const requiresCanonical = ["exact-duplicate", "malformed-acquisition-copy", "near-duplicate"].includes(result.status);
  if (requiresCanonical !== (result.canonicalPayloadId !== null)) invalid(label, "canonical payload binding disagrees with duplicate status");
  return result;
}

function purposeDisposition(value: unknown, label: string): PurposeDisposition {
  const row = object(value, label);
  exactKeys(row, ["candidateBranches", "role", "reason", "routingState"], label);
  const branches = sortedUniqueStrings(row.candidateBranches, `${label}.candidateBranches`, true);
  if (branches.some((entry) => !["B1a", "B1b", "B2", "B3", "B4", "B5"].includes(entry))) invalid(`${label}.candidateBranches`, "contains an unregistered B branch");
  const routingState = literal(row.routingState, ["confirmed", "refused"] as const, `${label}.routingState`);
  if (routingState === "confirmed" && branches.length === 0) invalid(label, "confirmed routing requires a B branch");
  return Object.freeze({ candidateBranches: branches as PurposeDisposition["candidateBranches"], role: literal(row.role, ["apparatus", "calibration-media", "mapping", "method", "observation", "provenance-only", "reproducibility-only", "theory", "transport"] as const, `${label}.role`), reason: text(row.reason, `${label}.reason`, 500), routingState });
}

function eligibility(value: unknown, label: string): DecisionEligibility {
  const row = object(value, label);
  exactKeys(row, ["status", "blockingOperandIds", "reason"], label);
  const result = Object.freeze({ status: literal(row.status, ["categorical-only", "diagnostic-only", "quantitative", "refused"] as const, `${label}.status`), blockingOperandIds: sortedUniqueStrings(row.blockingOperandIds, `${label}.blockingOperandIds`, true), reason: text(row.reason, `${label}.reason`, 500) });
  if ((result.status === "refused") !== (result.blockingOperandIds.length > 0)) invalid(label, "refusal and blocking operands disagree");
  return result;
}

function dispositionObservation(value: unknown, label: string): IntakeDispositionObservation {
  const row = object(value, label);
  exactKeys(row, ["payloadId", "identity", "version", "rights", "lineage", "duplicate", "purpose", "eligibility", "openedByPhase10", "terminal"], label);
  const purpose = purposeDisposition(row.purpose, `${label}.purpose`);
  const decision = eligibility(row.eligibility, `${label}.eligibility`);
  if ((purpose.routingState === "refused") !== (decision.status === "refused")) invalid(label, "routing refusal and eligibility refusal disagree");
  return Object.freeze({ payloadId: stableId(row.payloadId, `${label}.payloadId`), identity: identityDisposition(row.identity, `${label}.identity`), version: versionDisposition(row.version, `${label}.version`), rights: rightsDisposition(row.rights, `${label}.rights`), lineage: lineageDisposition(row.lineage, `${label}.lineage`), duplicate: duplicateDisposition(row.duplicate, `${label}.duplicate`), purpose, eligibility: decision, openedByPhase10: bool(row.openedByPhase10, false, `${label}.openedByPhase10`), terminal: bool(row.terminal, true, `${label}.terminal`) });
}

export function parseCurrencySnapshot(value: unknown, label: string): CurrencySnapshotRow {
  const row = object(value, label);
  exactKeys(row, ["schema", "snapshotId", "lineageId", "selectedByBranches", "seedPayloadIds", "cutoffDate", "dateWindow", "queries", "candidates", "correctionStatus", "versionStatus", "supplementStatus", "nativeDataStatus", "laterOutputStatus", "terminalDisposition", "reopenTriggers", "closed"], label);
  literal(row.schema, ["phase10-currency-snapshot-row-v1"] as const, `${label}.schema`);
  const dateWindow = object(row.dateWindow, `${label}.dateWindow`);
  exactKeys(dateWindow, ["from", "through"], `${label}.dateWindow`);
  const from = isoDate(dateWindow.from, `${label}.dateWindow.from`);
  const through = isoDate(dateWindow.through, `${label}.dateWindow.through`);
  const cutoffDate = isoDate(row.cutoffDate, `${label}.cutoffDate`);
  if (from > through || through > cutoffDate) invalid(`${label}.dateWindow`, "must end on or before cutoffDate");
  const queries = array(row.queries, `${label}.queries`).map((entry, index) => {
    const query = object(entry, `${label}.queries[${index}]`);
    exactKeys(query, ["queryId", "serviceId", "endpoint", "query", "executedOn"], `${label}.queries[${index}]`);
    const executedOn = isoDate(query.executedOn, `${label}.queries[${index}].executedOn`);
    if (executedOn < from || executedOn > through) invalid(`${label}.queries[${index}].executedOn`, "is outside dateWindow");
    return Object.freeze({ queryId: stableId(query.queryId, `${label}.queries[${index}].queryId`), serviceId: stableId(query.serviceId, `${label}.queries[${index}].serviceId`), endpoint: text(query.endpoint, `${label}.queries[${index}].endpoint`, 500), query: text(query.query, `${label}.queries[${index}].query`, 500), executedOn });
  });
  if (queries.length === 0 || queries.some((entry, index) => index > 0 && queries[index - 1]!.queryId >= entry.queryId)) invalid(`${label}.queries`, "must be nonempty, sorted, and unique");
  const candidates = array(row.candidates, `${label}.candidates`).map((entry, index) => {
    const candidate = object(entry, `${label}.candidates[${index}]`);
    exactKeys(candidate, ["candidateId", "identity", "locator", "relation", "disposition"], `${label}.candidates[${index}]`);
    return Object.freeze({ candidateId: stableId(candidate.candidateId, `${label}.candidates[${index}].candidateId`), identity: text(candidate.identity, `${label}.candidates[${index}].identity`, 500), locator: text(candidate.locator, `${label}.candidates[${index}].locator`, 500), relation: literal(candidate.relation, ["correction", "version", "supplement", "native-data", "later-output", "unrelated"] as const, `${label}.candidates[${index}].relation`), disposition: literal(candidate.disposition, ["bound", "no-change", "unavailable", "rejected", "unresolved"] as const, `${label}.candidates[${index}].disposition`) });
  });
  if (candidates.some((entry, index) => index > 0 && candidates[index - 1]!.candidateId >= entry.candidateId) || candidates.some((entry) => entry.disposition === "unresolved")) invalid(`${label}.candidates`, "must be sorted, unique, and terminal");
  const statuses = [componentStatus(row.correctionStatus, `${label}.correctionStatus`), componentStatus(row.versionStatus, `${label}.versionStatus`), componentStatus(row.supplementStatus, `${label}.supplementStatus`), componentStatus(row.nativeDataStatus, `${label}.nativeDataStatus`), componentStatus(row.laterOutputStatus, `${label}.laterOutputStatus`)] as const;
  if (statuses.includes("unresolved")) invalid(label, "currency component statuses must be terminal");
  const terminalDisposition = literal(row.terminalDisposition, ["correction-bound", "current-no-change", "priority-lead-unavailable", "source-refusal", "version-bound"] as const, `${label}.terminalDisposition`);
  if (terminalDisposition === "correction-bound" && statuses[0] !== "checked-bound") invalid(label, "correction-bound needs a bound correction");
  if (terminalDisposition === "version-bound" && statuses[1] !== "checked-bound") invalid(label, "version-bound needs a bound version");
  if (terminalDisposition === "current-no-change" && statuses.includes("checked-bound")) invalid(label, "current-no-change cannot contain a bound component");
  const triggers = sortedUniqueStrings(row.reopenTriggers, `${label}.reopenTriggers`);
  if (triggers.join("\0") !== [...PHASE10_AI_REOPEN_TRIGGERS].sort(lexical).join("\0")) invalid(`${label}.reopenTriggers`, "differ from frozen policy");
  return Object.freeze({ schema: "phase10-currency-snapshot-row-v1", snapshotId: stableId(row.snapshotId, `${label}.snapshotId`), lineageId: stableId(row.lineageId, `${label}.lineageId`), selectedByBranches: sortedUniqueStrings(row.selectedByBranches, `${label}.selectedByBranches`), seedPayloadIds: sortedUniqueStrings(row.seedPayloadIds, `${label}.seedPayloadIds`), cutoffDate, dateWindow: Object.freeze({ from, through }), queries: Object.freeze(queries), candidates: Object.freeze(candidates), correctionStatus: statuses[0], versionStatus: statuses[1], supplementStatus: statuses[2], nativeDataStatus: statuses[3], laterOutputStatus: statuses[4], terminalDisposition, reopenTriggers: triggers, closed: bool(row.closed, true, `${label}.closed`) });
}

function basisRef(value: unknown, label: string): BasisRef {
  const row = object(value, label);
  exactKeys(row, ["basisId", "kind", "locator", "reason"], label);
  return Object.freeze({
    basisId: stableId(row.basisId, `${label}.basisId`),
    kind: literal(row.kind, ["frozen-foundation", "frozen-tracked-metadata", "normalized-current-observation", "paraphrased-analyst-judgment"] as const, `${label}.kind`),
    locator: text(row.locator, `${label}.locator`, 500),
    reason: text(row.reason, `${label}.reason`, 500),
  });
}

function dispositionDecision(value: unknown, label: string): DispositionDecision {
  const row = object(value, label);
  exactKeys(row, ["payloadId", "identity", "version", "rights", "lineage", "duplicate", "purpose", "eligibility", "openedByPhase10", "terminal", "basisRefs"], label);
  const disposition = dispositionObservation({ payloadId: row.payloadId, identity: row.identity, version: row.version, rights: row.rights, lineage: row.lineage, duplicate: row.duplicate, purpose: row.purpose, eligibility: row.eligibility, openedByPhase10: row.openedByPhase10, terminal: row.terminal }, label);
  const basisRefs = array(row.basisRefs, `${label}.basisRefs`).map((entry, index) => basisRef(entry, `${label}.basisRefs[${index}]`));
  if (basisRefs.length < 3 || basisRefs.some((entry, index) => index > 0 && basisRefs[index - 1]!.basisId >= entry.basisId)) invalid(`${label}.basisRefs`, "must be nontrivial, sorted, and unique");
  for (const required of ["frozen-foundation", "frozen-tracked-metadata", "paraphrased-analyst-judgment"] as const) {
    if (!basisRefs.some((entry) => entry.kind === required)) invalid(`${label}.basisRefs`, `must include ${required}`);
  }
  return Object.freeze({ ...disposition, basisRefs: Object.freeze(basisRefs) });
}

function currencyDecision(value: unknown, label: string): CurrencyDecision {
  const row = object(value, label);
  exactKeys(row, ["snapshotId", "lineageId", "candidates", "correctionStatus", "versionStatus", "supplementStatus", "nativeDataStatus", "laterOutputStatus", "terminalDisposition", "basisQueryIds"], label);
  const candidates = array(row.candidates, `${label}.candidates`).map((entry, index) => {
    const candidate = object(entry, `${label}.candidates[${index}]`);
    exactKeys(candidate, ["candidateId", "identity", "locator", "relation", "disposition"], `${label}.candidates[${index}]`);
    return Object.freeze({ candidateId: stableId(candidate.candidateId, `${label}.candidates[${index}].candidateId`), identity: text(candidate.identity, `${label}.candidates[${index}].identity`, 500), locator: text(candidate.locator, `${label}.candidates[${index}].locator`, 500), relation: literal(candidate.relation, ["correction", "version", "supplement", "native-data", "later-output", "unrelated"] as const, `${label}.candidates[${index}].relation`), disposition: literal(candidate.disposition, ["bound", "no-change", "unavailable", "rejected"] as const, `${label}.candidates[${index}].disposition`) });
  });
  if (candidates.some((entry, index) => index > 0 && candidates[index - 1]!.candidateId >= entry.candidateId)) invalid(`${label}.candidates`, "must be sorted and unique");
  const statuses = [componentStatus(row.correctionStatus, `${label}.correctionStatus`), componentStatus(row.versionStatus, `${label}.versionStatus`), componentStatus(row.supplementStatus, `${label}.supplementStatus`), componentStatus(row.nativeDataStatus, `${label}.nativeDataStatus`), componentStatus(row.laterOutputStatus, `${label}.laterOutputStatus`)] as const;
  if (statuses.includes("unresolved")) invalid(label, "component statuses must be terminal");
  const terminalDisposition = literal(row.terminalDisposition, ["correction-bound", "current-no-change", "priority-lead-unavailable", "source-refusal", "version-bound"] as const, `${label}.terminalDisposition`);
  if (terminalDisposition === "correction-bound" && statuses[0] !== "checked-bound") invalid(label, "correction-bound needs a bound correction");
  if (terminalDisposition === "version-bound" && statuses[1] !== "checked-bound") invalid(label, "version-bound needs a bound version");
  if (terminalDisposition === "current-no-change" && statuses.includes("checked-bound")) invalid(label, "current-no-change cannot contain a bound component");
  return Object.freeze({ snapshotId: stableId(row.snapshotId, `${label}.snapshotId`), lineageId: stableId(row.lineageId, `${label}.lineageId`), candidates: Object.freeze(candidates), correctionStatus: statuses[0], versionStatus: statuses[1], supplementStatus: statuses[2], nativeDataStatus: statuses[3], laterOutputStatus: statuses[4], terminalDisposition, basisQueryIds: sortedUniqueStrings(row.basisQueryIds, `${label}.basisQueryIds`) });
}

export function parseIntakeDecisionInput(value: unknown, protocol: IntakeProtocol): IntakeDecisionInput {
  const label = "A-I disposition decisions";
  const row = root(value, label);
  exactKeys(row, ["schema", "decisionId", "decidedOn", "dispositions", "currencyDecisions", "semanticReviewRequired"], label);
  literal(row.schema, ["phase10-intake-disposition-decisions-v1"] as const, `${label}.schema`);
  const dispositions = array(row.dispositions, `${label}.dispositions`).map((entry, index) => dispositionDecision(entry, `${label}.dispositions[${index}]`));
  if (dispositions.length !== 14 || dispositions.some((entry, index) => index > 0 && dispositions[index - 1]!.payloadId >= entry.payloadId)) invalid(`${label}.dispositions`, "must be 14 sorted unique payloads");
  const payloadIds = new Set(dispositions.map((entry) => entry.payloadId));
  const selectedPlans = new Map(protocol.lineagePlan.flatMap((plan) => plan.seedPayloadIds.map((payloadId) => [payloadId, plan] as const)));
  const unselectedPlans = new Map(protocol.unselectedPayloadPlan.map((plan) => [plan.payloadId, plan] as const));
  if (payloadIds.size !== 14 || dispositions.some((entry) => !selectedPlans.has(entry.payloadId) && !unselectedPlans.has(entry.payloadId))) invalid(`${label}.dispositions`, "differ from the frozen 14-payload roster");
  for (const disposition of dispositions) {
    if (!disposition.lineage.relatedPayloadIds.includes(disposition.payloadId) || disposition.lineage.relatedPayloadIds.some((entry) => !payloadIds.has(entry))) invalid(`${label}.dispositions`, "lineage relatedPayloadIds must be closed and include self");
    if (disposition.duplicate.canonicalPayloadId !== null && !payloadIds.has(disposition.duplicate.canonicalPayloadId)) invalid(`${label}.dispositions`, "duplicate canonical payload is outside the roster");
    const selected = selectedPlans.get(disposition.payloadId);
    const prefix = `basis-${disposition.payloadId.toLowerCase()}`;
    const expectedBasis: readonly { readonly basisId: string; readonly kind: BasisRef["kind"]; readonly locator: string }[] = [
      { basisId: `${prefix}-analyst`, kind: "paraphrased-analyst-judgment" as const, locator: `analyst-judgment:${disposition.payloadId}` },
      { basisId: `${prefix}-foundation`, kind: "frozen-foundation" as const, locator: `research/phase10-foundation-freeze-v1.json#intakeRoster/sourcePayloads[payloadId=${disposition.payloadId}]` },
      { basisId: `${prefix}-metadata`, kind: "frozen-tracked-metadata" as const, locator: `research/phase9-post-freeze-source-intake-v1.json#files[source-payload-for=${disposition.payloadId}]` },
      ...(selected?.queries.map((query) => ({ basisId: `${prefix}-query-${query.queryId}`, kind: "normalized-current-observation" as const, locator: `research/phase10-execution-v1/packets/a-i/observations.json#queryExecutions[queryId=${query.queryId}]` })) ?? []),
    ].sort((left, right) => lexical(left.basisId, right.basisId));
    if (
      disposition.basisRefs.length !== expectedBasis.length || disposition.basisRefs.some((basis, index) => {
        const expected = expectedBasis[index];
        return expected === undefined || basis.basisId !== expected.basisId || basis.kind !== expected.kind || basis.locator !== expected.locator;
      })
    ) invalid(`${label}.dispositions`, "basis roster/locators differ from frozen foundation, metadata, observation, and analyst authorities");
    if (selected !== undefined) {
      if (disposition.lineage.lineageId !== selected.lineageId || disposition.purpose.candidateBranches.join("\0") !== selected.selectedByBranches.join("\0") || !disposition.basisRefs.some((entry) => entry.kind === "normalized-current-observation")) invalid(`${label}.dispositions`, "selected payload differs from frozen lineage/branch/current-observation requirements");
    } else {
      const unselected = unselectedPlans.get(disposition.payloadId)!;
      if (disposition.lineage.lineageId !== unselected.lineageId || disposition.purpose.candidateBranches.length !== 0 || disposition.purpose.routingState !== "refused") invalid(`${label}.dispositions`, "unselected payload differs from frozen lineage/refusal");
    }
  }
  const currencyDecisions = array(row.currencyDecisions, `${label}.currencyDecisions`).map((entry, index) => currencyDecision(entry, `${label}.currencyDecisions[${index}]`));
  if (currencyDecisions.length !== 12 || currencyDecisions.some((entry, index) => index > 0 && currencyDecisions[index - 1]!.lineageId >= entry.lineageId)) invalid(`${label}.currencyDecisions`, "must be one sorted row per selected lineage");
  for (const [index, plan] of protocol.lineagePlan.entries()) {
    const decision = currencyDecisions[index];
    if (decision === undefined || decision.lineageId !== plan.lineageId || decision.basisQueryIds.join("\0") !== plan.queries.map((entry) => entry.queryId).sort(lexical).join("\0")) invalid(`${label}.currencyDecisions[${index}]`, "differs from the frozen lineage/query roster");
  }
  for (const disposition of dispositions) {
    const selected = selectedPlans.get(disposition.payloadId);
    const snapshotId = selected === undefined ? null : currencyDecisions.find((entry) => entry.lineageId === selected.lineageId)?.snapshotId ?? null;
    if (disposition.version.currentnessSnapshotId !== snapshotId) invalid(`${label}.dispositions`, "currentness snapshot binding differs");
  }
  return Object.freeze({ schema: "phase10-intake-disposition-decisions-v1", decisionId: stableId(row.decisionId, `${label}.decisionId`), decidedOn: isoDate(row.decidedOn, `${label}.decidedOn`), dispositions: Object.freeze(dispositions), currencyDecisions: Object.freeze(currencyDecisions), semanticReviewRequired: bool(row.semanticReviewRequired, true, `${label}.semanticReviewRequired`) });
}

export function parseIntakeSemanticReview(value: unknown): IntakeSemanticReview {
  const label = "A-I semantic review";
  const row = root(value, label);
  exactKeys(row, ["schema", "reviewId", "reviewedOn", "reviewer", "protocol", "decisions", "observations", "observationValidationReceipt", "decisionValidationReceipt", "rawArtifacts", "reexecuted", "unresolvedBlockers", "limits", "verdict"], label);
  literal(row.schema, ["phase10-intake-semantic-review-v1"] as const, `${label}.schema`);
  const reviewer = object(row.reviewer, `${label}.reviewer`);
  exactKeys(reviewer, ["model", "role", "sharedContextWithDeveloper", "authoredDecisionInput"], `${label}.reviewer`);
  const rawArtifacts = array(row.rawArtifacts, `${label}.rawArtifacts`).map((entry, index) => artifactTuple(entry, `${label}.rawArtifacts[${index}]`));
  if (rawArtifacts.length !== 25 || rawArtifacts.some((entry, index) => index > 0 && rawArtifacts[index - 1]!.path >= entry.path)) invalid(`${label}.rawArtifacts`, "must be the exact sorted unique 24-query-plus-NAS roster");
  const reexecuted = sortedUniqueStrings(row.reexecuted, `${label}.reexecuted`);
  const limits = sortedUniqueStrings(row.limits, `${label}.limits`);
  if (array(row.unresolvedBlockers, `${label}.unresolvedBlockers`).length !== 0) invalid(`${label}.unresolvedBlockers`, "must be empty before A-I production");
  return Object.freeze({
    schema: "phase10-intake-semantic-review-v1",
    reviewId: stableId(row.reviewId, `${label}.reviewId`),
    reviewedOn: isoDate(row.reviewedOn, `${label}.reviewedOn`),
    reviewer: Object.freeze({
      model: text(reviewer.model, `${label}.reviewer.model`, 200),
      role: literal(reviewer.role, ["non-author-semantic-reviewer"] as const, `${label}.reviewer.role`),
      sharedContextWithDeveloper: typeof reviewer.sharedContextWithDeveloper === "boolean" ? reviewer.sharedContextWithDeveloper : invalid(`${label}.reviewer.sharedContextWithDeveloper`, "must be boolean"),
      authoredDecisionInput: bool(reviewer.authoredDecisionInput, false, `${label}.reviewer.authoredDecisionInput`),
    }),
    protocol: artifactTuple(row.protocol, `${label}.protocol`),
    decisions: artifactTuple(row.decisions, `${label}.decisions`),
    observations: artifactTuple(row.observations, `${label}.observations`),
    observationValidationReceipt: artifactTuple(row.observationValidationReceipt, `${label}.observationValidationReceipt`),
    decisionValidationReceipt: artifactTuple(row.decisionValidationReceipt, `${label}.decisionValidationReceipt`),
    rawArtifacts: Object.freeze(rawArtifacts),
    reexecuted,
    unresolvedBlockers: Object.freeze([]),
    limits,
    verdict: literal(row.verdict, ["pass"] as const, `${label}.verdict`),
  });
}

function queryExecution(value: unknown, label: string): QueryExecution {
  const row = object(value, label);
  exactKeys(row, ["queryId", "requestMethod", "requestBody", "endpoint", "query", "startedOn", "endedOn", "terminalState", "httpStatus", "responseUrl", "contentType", "rawResponse", "error"], label);
  const startedOn = isoTimestamp(row.startedOn, `${label}.startedOn`);
  const endedOn = isoTimestamp(row.endedOn, `${label}.endedOn`);
  if (endedOn < startedOn) invalid(label, "endedOn precedes startedOn");
  const terminalState = literal(row.terminalState, ["http-response", "network-refusal"] as const, `${label}.terminalState`);
  const httpStatus = row.httpStatus === null ? null : integer(row.httpStatus, `${label}.httpStatus`);
  const responseUrl = nullableText(row.responseUrl, `${label}.responseUrl`, 1000);
  const contentType = nullableText(row.contentType, `${label}.contentType`, 200);
  const error = nullableText(row.error, `${label}.error`, 500);
  if (terminalState === "http-response" ? httpStatus === null || httpStatus < 100 || httpStatus > 599 || responseUrl === null || error !== null : httpStatus !== null || responseUrl !== null || contentType !== null || error === null) invalid(label, "terminal query fields disagree");
  const requestMethod = literal(row.requestMethod, ["GET", "POST"] as const, `${label}.requestMethod`);
  const requestBody = row.requestBody === null ? null : text(row.requestBody, `${label}.requestBody`, 1000);
  if (requestMethod === "GET" ? requestBody !== null : requestBody === null) invalid(label, "requestBody disagrees with requestMethod");
  return Object.freeze({ queryId: stableId(row.queryId, `${label}.queryId`), requestMethod, requestBody, endpoint: text(row.endpoint, `${label}.endpoint`, 500), query: text(row.query, `${label}.query`, 500), startedOn, endedOn, terminalState, httpStatus, responseUrl, contentType, rawResponse: artifactTuple(row.rawResponse, `${label}.rawResponse`), error });
}

function nasObservation(value: unknown, label: string): NasVerificationObservation {
  const row = object(value, label);
  exactKeys(row, ["state", "checkedOn", "collectionId", "aggregateFiles", "aggregateBytes", "ownerManifest", "matchedTrackedTupleCount", "privateOnlyTupleCount", "attemptReport", "verificationReceipt", "refusalReason", "restoreStatus", "backupStatus"], label);
  const state = literal(row.state, ["receipt-verified", "unavailable-refusal"] as const, `${label}.state`);
  const matched = row.matchedTrackedTupleCount === null ? null : integer(row.matchedTrackedTupleCount, `${label}.matchedTrackedTupleCount`);
  const privateOnly = row.privateOnlyTupleCount === null ? null : integer(row.privateOnlyTupleCount, `${label}.privateOnlyTupleCount`);
  const attemptReport = artifactTuple(row.attemptReport, `${label}.attemptReport`);
  const receipt = row.verificationReceipt === null ? null : artifactTuple(row.verificationReceipt, `${label}.verificationReceipt`);
  const refusal = nullableText(row.refusalReason, `${label}.refusalReason`, 500);
  if (state === "receipt-verified" ? receipt === null || matched !== 24 || privateOnly !== 2 || refusal !== null : receipt !== null || matched !== null || privateOnly !== null || refusal === null) invalid(label, "state-specific receipt/refusal fields differ");
  if (receipt !== null) exactTuple(receipt, attemptReport, `${label}.verificationReceipt`);
  return Object.freeze({ state, checkedOn: isoDate(row.checkedOn, `${label}.checkedOn`), collectionId: literal(row.collectionId, ["post-phase9-intake@2026-08-13"] as const, `${label}.collectionId`), aggregateFiles: integer(row.aggregateFiles, `${label}.aggregateFiles`) === 26 ? 26 : invalid(`${label}.aggregateFiles`, "must be 26"), aggregateBytes: integer(row.aggregateBytes, `${label}.aggregateBytes`) === 165722101 ? 165722101 : invalid(`${label}.aggregateBytes`, "differs"), ownerManifest: artifactTuple(row.ownerManifest, `${label}.ownerManifest`), matchedTrackedTupleCount: matched as 24 | null, privateOnlyTupleCount: privateOnly as 2 | null, attemptReport, verificationReceipt: receipt, refusalReason: refusal, restoreStatus: literal(row.restoreStatus, ["pending"] as const, `${label}.restoreStatus`), backupStatus: literal(row.backupStatus, ["required-missing"] as const, `${label}.backupStatus`) });
}

export function parseIntakeObservations(value: unknown, protocol: IntakeProtocol): IntakeObservations {
  const label = "A-I observations";
  const row = root(value, label);
  exactKeys(row, ["schema", "observationId", "observedOn", "queryExecutions", "existingNasVerification", "newNasCollection"], label);
  literal(row.schema, ["phase10-intake-observations-v1"] as const, `${label}.schema`);
  const observedOn = isoDate(row.observedOn, `${label}.observedOn`);
  const executions = array(row.queryExecutions, `${label}.queryExecutions`).map((entry, index) => queryExecution(entry, `${label}.queryExecutions[${index}]`));
  const plans = protocol.lineagePlan.flatMap((entry) => entry.queries).sort((left, right) => lexical(left.queryId, right.queryId));
  if (executions.length !== plans.length || executions.some((entry, index) => index > 0 && executions[index - 1]!.queryId >= entry.queryId)) invalid(`${label}.queryExecutions`, "must be the exact sorted frozen query roster");
  for (const [index, plan] of plans.entries()) {
    const execution = executions[index]!;
    if (execution.queryId !== plan.queryId || execution.endpoint !== plan.endpoint || execution.query !== plan.query || execution.requestMethod !== plan.requestMethod || execution.requestBody !== plan.requestBody || execution.startedOn.slice(0, 10) !== observedOn || execution.rawResponse.path !== `${protocol.observationAttempt}/raw/${plan.queryId}.body`) invalid(`${label}.queryExecutions[${index}]`, "differs from frozen request/date/raw path");
  }
  const nas = nasObservation(row.existingNasVerification, `${label}.existingNasVerification`);
  exactTuple(nas.ownerManifest, protocol.existingOwnerManifest, `${label}.existingNasVerification.ownerManifest`);
  if (nas.checkedOn !== observedOn || nas.attemptReport.path !== `${protocol.observationAttempt}/raw/nas-verification.json`) invalid(`${label}.existingNasVerification`, "date/report path differs");
  const newNas = object(row.newNasCollection, `${label}.newNasCollection`);
  exactKeys(newNas, ["state", "collectionId", "receipt", "sourcePruneAuthorized"], `${label}.newNasCollection`);
  literal(newNas.state, ["not-applicable-no-new-bytes"] as const, `${label}.newNasCollection.state`);
  literal(newNas.collectionId, ["phase10-source-intake@2026-08-21-v1"] as const, `${label}.newNasCollection.collectionId`);
  if (newNas.receipt !== null) invalid(`${label}.newNasCollection.receipt`, "must be null");
  return Object.freeze({ schema: "phase10-intake-observations-v1", observationId: stableId(row.observationId, `${label}.observationId`), observedOn, queryExecutions: Object.freeze(executions), existingNasVerification: nas, newNasCollection: Object.freeze({ state: "not-applicable-no-new-bytes", collectionId: "phase10-source-intake@2026-08-21-v1", receipt: null, sourcePruneAuthorized: bool(newNas.sourcePruneAuthorized, false, `${label}.newNasCollection.sourcePruneAuthorized`) }) });
}

export function composeCurrencySnapshots(decisions: IntakeDecisionInput, observations: IntakeObservations, protocol: IntakeProtocol): readonly CurrencySnapshotRow[] {
  const executions = new Map(observations.queryExecutions.map((entry) => [entry.queryId, entry] as const));
  return Object.freeze(protocol.lineagePlan.map((plan) => {
    const decision = decisions.currencyDecisions.find((entry) => entry.lineageId === plan.lineageId)!;
    return parseCurrencySnapshot({
      schema: "phase10-currency-snapshot-row-v1",
      snapshotId: decision.snapshotId,
      lineageId: plan.lineageId,
      selectedByBranches: plan.selectedByBranches,
      seedPayloadIds: plan.seedPayloadIds,
      cutoffDate: plan.cutoffDate,
      dateWindow: plan.dateWindow,
      queries: plan.queries.map((query) => ({ queryId: query.queryId, serviceId: query.serviceId, endpoint: query.endpoint, query: query.query, executedOn: executions.get(query.queryId)!.startedOn.slice(0, 10) })),
      candidates: decision.candidates,
      correctionStatus: decision.correctionStatus,
      versionStatus: decision.versionStatus,
      supplementStatus: decision.supplementStatus,
      nativeDataStatus: decision.nativeDataStatus,
      laterOutputStatus: decision.laterOutputStatus,
      terminalDisposition: decision.terminalDisposition,
      reopenTriggers: [...PHASE10_AI_REOPEN_TRIGGERS].sort(lexical),
      closed: true,
    }, `currency snapshot ${plan.lineageId}`);
  }));
}

export function parseFileCustodyRow(value: unknown, label: string): FileCustodyRow {
  const row = object(value, label);
  exactKeys(row, ["schema", "custodyEntryId", "custodyBinding", "custodyClass", "payloadId"], label);
  const binding = object(row.custodyBinding, `${label}.custodyBinding`);
  exactKeys(binding, ["intakeArtifact", "collectionId", "ownerManifest", "relativePath", "role", "byteLength", "sha256"], `${label}.custodyBinding`);
  return Object.freeze({ schema: literal(row.schema, ["phase10-file-custody-row-v1"] as const, `${label}.schema`), custodyEntryId: stableId(row.custodyEntryId, `${label}.custodyEntryId`), custodyBinding: Object.freeze({ intakeArtifact: artifactTuple(binding.intakeArtifact, `${label}.custodyBinding.intakeArtifact`), collectionId: stableId(binding.collectionId, `${label}.custodyBinding.collectionId`), ownerManifest: artifactTuple(binding.ownerManifest, `${label}.custodyBinding.ownerManifest`), relativePath: path(binding.relativePath, `${label}.custodyBinding.relativePath`), role: text(binding.role, `${label}.custodyBinding.role`), byteLength: integer(binding.byteLength, `${label}.custodyBinding.byteLength`), sha256: sha(binding.sha256, `${label}.custodyBinding.sha256`) }), custodyClass: literal(row.custodyClass, ["source-payload", "raw-acquisition-history", "acquisition-metadata"] as const, `${label}.custodyClass`), payloadId: row.payloadId === null ? null : stableId(row.payloadId, `${label}.payloadId`) });
}

export function parseIntakeDispositionRow(value: unknown, label: string): IntakeDispositionRow {
  const row = object(value, label);
  exactKeys(row, ["schema", "payloadId", "custodyBinding", "identity", "version", "rights", "lineage", "duplicate", "purpose", "eligibility", "openedByPhase10", "terminal"], label);
  literal(row.schema, ["phase10-intake-disposition-row-v1"] as const, `${label}.schema`);
  const observation = dispositionObservation(Object.freeze({ payloadId: row.payloadId, identity: row.identity, version: row.version, rights: row.rights, lineage: row.lineage, duplicate: row.duplicate, purpose: row.purpose, eligibility: row.eligibility, openedByPhase10: row.openedByPhase10, terminal: row.terminal }), label);
  const bindingRow = object(row.custodyBinding, `${label}.custodyBinding`);
  const custody = parseFileCustodyRow({ schema: "phase10-file-custody-row-v1", custodyEntryId: `custody-${observation.payloadId.toLowerCase()}`, custodyBinding: bindingRow, custodyClass: "source-payload", payloadId: observation.payloadId }, `${label}.custodyProjection`);
  return Object.freeze({ schema: "phase10-intake-disposition-row-v1", ...observation, custodyBinding: custody.custodyBinding });
}

export function assertTuple(actual: ArtifactTuple, expected: ArtifactTuple, label: string): void {
  exactTuple(actual, expected, label);
}
