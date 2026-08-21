import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PHASE10_AI_CHECK_IDS,
  PHASE10_AI_DECISIONS_PATH,
  PHASE10_AI_INTAKE_PROTOCOL_IDENTITY,
  PHASE10_AI_INTAKE_PROTOCOL_PATH,
  PHASE10_AI_OBSERVATIONS_PATH,
  PHASE10_AI_OBSERVATION_ATTEMPT,
  PHASE10_AI_OBSERVATION_VALIDATION_PATH,
  PHASE10_AI_PRODUCE_COMMAND,
  PHASE10_AI_DECISION_VALIDATION_PATH,
  PHASE10_AI_OUTPUTS,
  PHASE10_AI_SEMANTIC_REVIEW_PATH,
  PHASE10_AI_STATIC_ATTEMPT_ID,
  artifactTuple,
  parseFoundationIntake,
  parseIntakeDecisionInput,
  parseIntakeObservations,
  parseIntakeProtocol,
  parseIntakeSemanticReview,
  prettyJsonBytes,
  sha256Bytes,
  type ArtifactTuple,
  type IntakeProtocol,
} from "../src/phase10-intake-contracts.ts";
import {
  assertPhase10IntakeDecisionSupport,
  reopenPhase10IntakeRaw,
  validatePhase10IntakeDecisions,
  validatePhase10IntakeObservations,
  validatePhase10IntakeSemanticReview,
} from "../src/phase10-intake-observe-verify.ts";
import { parsePhase10CallableRegistry } from "../src/phase10-contracts.ts";
import { loadIntakeAuthority } from "../src/phase10-intake-authority.ts";
import { writePhase10StaticTerminalReceipt } from "../src/phase10-static-packet-receipts.ts";

const SOURCE_REPOSITORY = fileURLToPath(new URL("../..", import.meta.url));
const AI_PACKET_DIRECTORY = "research/phase10-execution-v1/packets/a-i";
const CANDIDATE = "out/phase10-scope-intake-v1-a-i-candidate";
const EVIDENCE = "evidence/phase10-scope-intake-v1";
const AI_IMPLEMENTATION_PATHS = [
  "research/.gitattributes",
  `${AI_PACKET_DIRECTORY}/protocol.json`,
  `${AI_PACKET_DIRECTORY}/intake-protocol.json`,
  `${AI_PACKET_DIRECTORY}/callable-registry.json`,
  "runner/src/phase10-static-packet-receipts.ts",
  "runner/src/phase10-intake-authority.ts",
  "runner/src/phase10-intake-checks.ts",
  "runner/src/phase10-intake-contracts.ts",
  "runner/src/phase10-intake-observe.ts",
  "runner/src/phase10-intake-observe-verify.ts",
  "runner/src/phase10-intake.ts",
  "runner/src/phase10-intake-verify.ts",
  "runner/src/phase10-intake-verification-receipt.ts",
] as const;

const PRODUCE = ["runner/src/phase10-intake.ts", "produce", "--repository-root", ".", "--protocol", `${AI_PACKET_DIRECTORY}/protocol.json`, "--out", CANDIDATE] as const;
const VERIFY = ["runner/src/phase10-intake-verify.ts", "verify", "--repository-root", ".", "--protocol", `${AI_PACKET_DIRECTORY}/protocol.json`, "--bundle", CANDIDATE, "--receipt", `${CANDIDATE}/intake-verification.json`] as const;
const PUBLISH = ["runner/src/phase10-intake.ts", "publish", "--repository-root", ".", "--candidate", CANDIDATE, "--out", EVIDENCE] as const;

interface Fixture {
  readonly root: string;
  readonly freezeCommit: string;
  readonly inputCommit: string;
  readonly protocol: IntakeProtocol;
  readonly rawArtifacts: readonly ArtifactTuple[];
}

let fixture: Fixture;
const temporaryRoots: string[] = [];

function json(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function pretty(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, prettyJsonBytes(value));
}

function tuple(relativePath: string, bytes: Uint8Array): ArtifactTuple {
  return Object.freeze({ path: relativePath, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) });
}

function git(root: string, args: readonly string[]): string {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function run(root: string, argv: readonly string[]): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, argv, { cwd: root, encoding: "utf8", windowsHide: true });
}

function expectGreen(result: ReturnType<typeof spawnSync>, label: string): void {
  expect(result.status, `${label}\nstdout:\n${String(result.stdout)}\nstderr:\n${String(result.stderr)}`).toBe(0);
}

function copyCurrent(root: string, relativePath: string): void {
  const target = resolve(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(resolve(SOURCE_REPOSITORY, relativePath), target);
}

function cloneWithFreeze(mutateBeforeFreeze?: (root: string) => void): { readonly root: string; readonly protocol: IntakeProtocol; readonly freezeCommit: string } {
  const root = mkdtempSync(join(tmpdir(), "snowflake-phase10-ai-"));
  temporaryRoots.push(root);
  const clone = spawnSync("git", ["clone", "--no-hardlinks", "--quiet", SOURCE_REPOSITORY, root], { encoding: "utf8", windowsHide: true });
  if (clone.status !== 0) throw new Error(`git clone failed: ${clone.stderr}`);
  symlinkSync(resolve(SOURCE_REPOSITORY, "node_modules"), resolve(root, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  for (const path of AI_IMPLEMENTATION_PATHS) copyCurrent(root, path);
  for (const input of [PHASE10_AI_OBSERVATIONS_PATH, PHASE10_AI_DECISIONS_PATH, PHASE10_AI_SEMANTIC_REVIEW_PATH]) {
    if (existsSync(resolve(root, input))) rmSync(resolve(root, input));
  }
  mutateBeforeFreeze?.(root);
  git(root, ["add", "--", ...AI_IMPLEMENTATION_PATHS]);
  git(root, ["-c", "user.name=Phase10 A-I Test", "-c", "user.email=phase10-ai@example.invalid", "commit", "--quiet", "-m", "Freeze A-I protocol before synthetic values"]);
  const freezeCommit = git(root, ["rev-parse", "HEAD"]);
  const protocol = parseIntakeProtocol(json(resolve(root, PHASE10_AI_INTAKE_PROTOCOL_PATH)));
  return Object.freeze({ root, protocol, freezeCommit });
}

function writeSyntheticObservations(root: string, protocol: IntakeProtocol): readonly ArtifactTuple[] {
  const rawArtifacts: ArtifactTuple[] = [];
  const executions = protocol.lineagePlan.flatMap((lineage) => lineage.queries).sort((left, right) => left.queryId.localeCompare(right.queryId)).map((query, index) => {
    const rawPath = `${PHASE10_AI_OBSERVATION_ATTEMPT}/raw/${query.queryId}.body`;
    const body = query.serviceId === "arxiv-api"
      ? new TextEncoder().encode(`<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><id>${query.queryId}</id></feed>`)
      : new TextEncoder().encode(`${JSON.stringify({ queryId: query.queryId, result: "synthetic-no-change" })}\n`);
    const target = resolve(root, rawPath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, body);
    const rawResponse = tuple(rawPath, body);
    rawArtifacts.push(rawResponse);
    const minute = String(index).padStart(2, "0");
    return Object.freeze({
      queryId: query.queryId,
      requestMethod: query.requestMethod,
      requestBody: query.requestBody,
      endpoint: query.endpoint,
      query: query.query,
      startedOn: `2026-08-21T12:${minute}:00.000Z`,
      endedOn: `2026-08-21T12:${minute}:01.000Z`,
      terminalState: "http-response",
      httpStatus: 200,
      responseUrl: query.endpoint,
      contentType: query.serviceId === "arxiv-api" ? "application/atom+xml" : "application/json",
      rawResponse,
      error: null,
    });
  });
  const nasPath = `${PHASE10_AI_OBSERVATION_ATTEMPT}/raw/nas-verification.json`;
  const nasBytes = prettyJsonBytes(Object.freeze({ format: "phase10-ai-nas-execution-refusal-v1", message: "Synthetic fixture deliberately has no NAS mount.", exitStatus: 1 }));
  mkdirSync(dirname(resolve(root, nasPath)), { recursive: true });
  writeFileSync(resolve(root, nasPath), nasBytes);
  const nasTuple = tuple(nasPath, nasBytes);
  rawArtifacts.push(nasTuple);
  pretty(resolve(root, PHASE10_AI_OBSERVATIONS_PATH), Object.freeze({
    schema: "phase10-intake-observations-v1",
    observationId: "phase10-a-i-observations-20260821-v1",
    observedOn: "2026-08-21",
    queryExecutions: executions,
    existingNasVerification: Object.freeze({
      state: "unavailable-refusal",
      checkedOn: "2026-08-21",
      collectionId: "post-phase9-intake@2026-08-13",
      aggregateFiles: 26,
      aggregateBytes: 165722101,
      ownerManifest: protocol.existingOwnerManifest,
      matchedTrackedTupleCount: null,
      privateOnlyTupleCount: null,
      attemptReport: nasTuple,
      verificationReceipt: null,
      refusalReason: "Synthetic fixture deliberately records a terminal NAS refusal.",
      restoreStatus: "pending",
      backupStatus: "required-missing",
    }),
    newNasCollection: Object.freeze({ state: "not-applicable-no-new-bytes", collectionId: "phase10-source-intake@2026-08-21-v1", receipt: null, sourcePruneAuthorized: false }),
  }));
  return Object.freeze(rawArtifacts.sort((left, right) => left.path.localeCompare(right.path)));
}

function writeSyntheticDecisions(root: string, protocol: IntakeProtocol): void {
  const foundation = parseFoundationIntake(json(resolve(root, protocol.foundationFreeze.path)));
  const selected = new Map(protocol.lineagePlan.flatMap((lineage) => lineage.seedPayloadIds.map((payloadId) => [payloadId, lineage] as const)));
  const unselected = new Map(protocol.unselectedPayloadPlan.map((entry) => [entry.payloadId, entry] as const));
  const dispositions = foundation.sourcePayloads.map((payload) => {
    const lineage = selected.get(payload.payloadId);
    const unselectedLineage = unselected.get(payload.payloadId);
    if (lineage === undefined && unselectedLineage === undefined) throw new Error(`missing frozen lineage for ${payload.payloadId}`);
    const prefix = `basis-${payload.payloadId.toLowerCase()}`;
    const basisRefs = [
      { basisId: `${prefix}-analyst`, kind: "paraphrased-analyst-judgment", locator: `analyst-judgment:${payload.payloadId}`, reason: "Synthetic analyst classification for contract testing." },
      { basisId: `${prefix}-foundation`, kind: "frozen-foundation", locator: `research/phase10-foundation-freeze-v1.json#intakeRoster/sourcePayloads[payloadId=${payload.payloadId}]`, reason: "Frozen source-payload authority." },
      { basisId: `${prefix}-metadata`, kind: "frozen-tracked-metadata", locator: `research/phase9-post-freeze-source-intake-v1.json#files[source-payload-for=${payload.payloadId}]`, reason: "Frozen tracked metadata authority." },
      ...(lineage?.queries.map((query) => ({ basisId: `${prefix}-query-${query.queryId}`, kind: "normalized-current-observation", locator: `research/phase10-execution-v1/packets/a-i/observations.json#queryExecutions[queryId=${query.queryId}]`, reason: "Bound synthetic currentness observation." })) ?? []),
    ].sort((left, right) => left.basisId.localeCompare(right.basisId));
    const isSelected = lineage !== undefined;
    const lineageId = lineage?.lineageId ?? unselectedLineage!.lineageId;
    const snapshotId = isSelected ? `snapshot-${lineageId}` : null;
    return Object.freeze({
      payloadId: payload.payloadId,
      identity: Object.freeze({ status: "verified", canonicalCitation: `Synthetic metadata record for ${payload.payloadId}`, persistentIds: Object.freeze([]) }),
      version: Object.freeze({ status: isSelected ? "current-checked" : "not-applicable", editionOrRelease: null, correctionStatus: isSelected ? "checked-none-found" : "not-applicable", supplementStatus: isSelected ? "checked-none-found" : "not-applicable", currentnessSnapshotId: snapshotId }),
      rights: Object.freeze({ status: "unknown", redistribution: "unknown", trackedDerivativePolicy: "metadata-only", nasStorageRequired: true }),
      lineage: Object.freeze({ lineageId, laboratoryOrProjectId: null, methodId: null, campaignId: null, relatedPayloadIds: Object.freeze([payload.payloadId]) }),
      duplicate: Object.freeze({ status: "distinct", canonicalPayloadId: null, basis: "manual-audit" }),
      purpose: Object.freeze({ candidateBranches: lineage?.selectedByBranches ?? Object.freeze([]), role: "provenance-only", reason: isSelected ? "Synthetic selected-branch routing." : "Synthetic terminal refusal for an unselected payload.", routingState: isSelected ? "confirmed" : "refused" }),
      eligibility: Object.freeze({ status: isSelected ? "diagnostic-only" : "refused", blockingOperandIds: isSelected ? Object.freeze([]) : Object.freeze(["source-not-selected"]), reason: isSelected ? "Synthetic diagnostic-only development evidence." : "Not selected by the frozen branch roster." }),
      openedByPhase10: false,
      terminal: true,
      basisRefs,
    });
  }).sort((left, right) => left.payloadId.localeCompare(right.payloadId));
  const currencyDecisions = protocol.lineagePlan.map((lineage) => Object.freeze({
    snapshotId: `snapshot-${lineage.lineageId}`,
    lineageId: lineage.lineageId,
    candidates: Object.freeze([]),
    correctionStatus: "checked-none-found",
    versionStatus: "checked-none-found",
    supplementStatus: "checked-none-found",
    nativeDataStatus: "checked-none-found",
    laterOutputStatus: "checked-none-found",
    terminalDisposition: "current-no-change",
    basisQueryIds: Object.freeze(lineage.queries.map((query) => query.queryId).sort()),
  }));
  pretty(resolve(root, PHASE10_AI_DECISIONS_PATH), Object.freeze({ schema: "phase10-intake-disposition-decisions-v1", decisionId: "phase10-a-i-decisions-20260821-v1", decidedOn: "2026-08-21", dispositions, currencyDecisions, semanticReviewRequired: true }));
}

function writeSyntheticReview(root: string, rawArtifacts: readonly ArtifactTuple[]): void {
  const identity = (path: string): ArtifactTuple => {
    const bytes = new Uint8Array(readFileSync(resolve(root, path)));
    return tuple(path, bytes);
  };
  pretty(resolve(root, PHASE10_AI_SEMANTIC_REVIEW_PATH), Object.freeze({
    schema: "phase10-intake-semantic-review-v1",
    reviewId: "phase10-a-i-semantic-review-20260821-v1",
    reviewedOn: "2026-08-21",
    reviewer: Object.freeze({ model: "Synthetic non-author fixture", role: "non-author-semantic-reviewer", sharedContextWithDeveloper: false, authoredDecisionInput: false }),
    protocol: PHASE10_AI_INTAKE_PROTOCOL_IDENTITY,
    decisions: identity(PHASE10_AI_DECISIONS_PATH),
    observations: identity(PHASE10_AI_OBSERVATIONS_PATH),
    observationValidationReceipt: identity(PHASE10_AI_OBSERVATION_VALIDATION_PATH),
    decisionValidationReceipt: identity(PHASE10_AI_DECISION_VALIDATION_PATH),
    rawArtifacts,
    reexecuted: Object.freeze(["Reopened every retained synthetic raw response and both structural validation receipts."]),
    unresolvedBlockers: Object.freeze([]),
    limits: Object.freeze(["Synthetic fixture proves contract behavior only and makes no source-value claim."]),
    verdict: "pass",
  }));
}

function buildFixture(mutateBeforeFreeze?: (root: string) => void): Fixture {
  const frozen = cloneWithFreeze(mutateBeforeFreeze);
  const rawArtifacts = writeSyntheticObservations(frozen.root, frozen.protocol);
  validatePhase10IntakeObservations({ repositoryRoot: frozen.root, packetProtocolPath: `${AI_PACKET_DIRECTORY}/protocol.json`, observationsPath: PHASE10_AI_OBSERVATIONS_PATH, rawAttemptPath: PHASE10_AI_OBSERVATION_ATTEMPT, receiptPath: PHASE10_AI_OBSERVATION_VALIDATION_PATH });
  writeSyntheticDecisions(frozen.root, frozen.protocol);
  validatePhase10IntakeDecisions({ repositoryRoot: frozen.root, packetProtocolPath: `${AI_PACKET_DIRECTORY}/protocol.json`, decisionsPath: PHASE10_AI_DECISIONS_PATH, observationsPath: PHASE10_AI_OBSERVATIONS_PATH, receiptPath: PHASE10_AI_DECISION_VALIDATION_PATH });
  writeSyntheticReview(frozen.root, rawArtifacts);
  validatePhase10IntakeSemanticReview({ repositoryRoot: frozen.root, packetProtocolPath: `${AI_PACKET_DIRECTORY}/protocol.json`, reviewPath: PHASE10_AI_SEMANTIC_REVIEW_PATH });
  git(frozen.root, ["add", "--", PHASE10_AI_OBSERVATIONS_PATH, PHASE10_AI_DECISIONS_PATH, PHASE10_AI_SEMANTIC_REVIEW_PATH]);
  git(frozen.root, ["-c", "user.name=Phase10 A-I Test", "-c", "user.email=phase10-ai@example.invalid", "commit", "--quiet", "-m", "Commit three reviewed A-I inputs"]);
  return Object.freeze({ ...frozen, inputCommit: git(frozen.root, ["rev-parse", "HEAD"]), rawArtifacts });
}

beforeAll(() => { fixture = buildFixture(); }, 120_000);
afterAll(() => { for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true }); });

describe("Phase 10 A-I frozen intake contract", () => {
  it("freezes 12 work lineages, 24 explicit requests, 14 payloads, and the 24/26 custody distinction", () => {
    expect(fixture.protocol.lineagePlan).toHaveLength(12);
    const queries = fixture.protocol.lineagePlan.flatMap((entry) => entry.queries);
    expect(queries).toHaveLength(24);
    expect(queries.filter((entry) => entry.requestMethod === "POST")).toEqual([expect.objectContaining({ queryId: "q-zhao-2026-figshare", requestBody: expect.stringContaining("search_for") })]);
    expect(fixture.protocol.unselectedPayloadPlan.map((entry) => entry.payloadId)).toEqual(["P10-AI-LAMB-ETAL-2025-SOURCE", "P10-AI-LIBBRECHT-SNOW-CRYSTALS-PREVIEW"]);
    expect(parseFoundationIntake(json(resolve(fixture.root, fixture.protocol.foundationFreeze.path))).sourcePayloads).toHaveLength(14);
    const protocolBytes = new Uint8Array(readFileSync(resolve(SOURCE_REPOSITORY, PHASE10_AI_INTAKE_PROTOCOL_PATH)));
    expect(protocolBytes).toEqual(prettyJsonBytes(JSON.parse(new TextDecoder().decode(protocolBytes))));
  });

  it("rejects rights-boundary weakening and wrong request method/body mutations", () => {
    const source = json(resolve(fixture.root, PHASE10_AI_INTAKE_PROTOCOL_PATH)) as Record<string, unknown>;
    const rights = structuredClone(source) as any;
    rights.rightsSafeProjection.defaultRestrictedOrUnknownDerivativePolicy = "project-derived-summary-authorized";
    expect(() => parseIntakeProtocol(rights)).toThrow(/rightsSafeProjection/u);
    const method = structuredClone(source) as any;
    method.lineagePlan.at(-1).queries[1].requestMethod = "GET";
    method.lineagePlan.at(-1).queries[1].requestBody = null;
    expect(() => parseIntakeProtocol(method)).toThrow(/request method/u);
    const body = structuredClone(source) as any;
    body.lineagePlan.at(-1).queries[1].requestBody = "{\"search_for\":\"invented\"}";
    const protocolPath = resolve(fixture.root, PHASE10_AI_INTAKE_PROTOCOL_PATH);
    const original = readFileSync(protocolPath);
    pretty(protocolPath, body);
    expect(() => loadIntakeAuthority(fixture.root, PHASE10_AI_INTAKE_PROTOCOL_IDENTITY)).toThrow(/semantic protocol.*identity/u);
    writeFileSync(protocolPath, original);
  });

  it("requires a non-author, zero-blocker review with the exact retained raw roster", () => {
    const value = json(resolve(fixture.root, PHASE10_AI_SEMANTIC_REVIEW_PATH)) as any;
    expect(parseIntakeSemanticReview(value).rawArtifacts).toHaveLength(25);
    const blocker = structuredClone(value);
    blocker.unresolvedBlockers = ["unresolved-source-identity"];
    expect(() => parseIntakeSemanticReview(blocker)).toThrow(/must be empty/u);
    const author = structuredClone(value);
    author.reviewer.authoredDecisionInput = true;
    expect(() => parseIntakeSemanticReview(author)).toThrow(/must be false/u);
  });

  it("refuses failed-request no-change claims, invented candidates, and fake basis locators", () => {
    const observationValue = json(resolve(fixture.root, PHASE10_AI_OBSERVATIONS_PATH)) as any;
    const decisionValue = json(resolve(fixture.root, PHASE10_AI_DECISIONS_PATH)) as any;
    const failedObservation = structuredClone(observationValue);
    const failedExecution = failedObservation.queryExecutions[0];
    const rawPath = resolve(fixture.root, failedExecution.rawResponse.path);
    const rawBytes = readFileSync(rawPath);
    try {
      const empty = new Uint8Array();
      writeFileSync(rawPath, empty);
      failedExecution.terminalState = "network-refusal";
      failedExecution.httpStatus = null;
      failedExecution.responseUrl = null;
      failedExecution.contentType = null;
      failedExecution.error = "Synthetic endpoint refusal.";
      failedExecution.rawResponse = tuple(failedExecution.rawResponse.path, empty);
      const observations = parseIntakeObservations(failedObservation, fixture.protocol);
      reopenPhase10IntakeRaw(fixture.root, observations);
      const decisions = parseIntakeDecisionInput(decisionValue, fixture.protocol);
      expect(() => assertPhase10IntakeDecisionSupport(fixture.root, decisions, observations)).toThrow(/failed request roster must yield a source-refusal/u);
    } finally {
      writeFileSync(rawPath, rawBytes);
    }

    const invented = structuredClone(decisionValue);
    invented.currencyDecisions[0].candidates = [{ candidateId: "candidate-invented", identity: "invented-current-version", locator: "https://example.invalid/invented-current-version", relation: "version", disposition: "bound" }];
    invented.currencyDecisions[0].versionStatus = "checked-bound";
    invented.currencyDecisions[0].terminalDisposition = "version-bound";
    const inventedDecisions = parseIntakeDecisionInput(invented, fixture.protocol);
    const observations = parseIntakeObservations(observationValue, fixture.protocol);
    expect(() => assertPhase10IntakeDecisionSupport(fixture.root, inventedDecisions, observations)).toThrow(/candidate candidate-invented is not bound by raw response strings/u);

    const fakeBasis = structuredClone(decisionValue);
    const foundationBasis = fakeBasis.dispositions[0].basisRefs.find((entry: any) => entry.kind === "frozen-foundation");
    foundationBasis.locator = "research/phase10-foundation-freeze-v1.json#invented";
    expect(() => parseIntakeDecisionInput(fakeBasis, fixture.protocol)).toThrow(/basis roster\/locators differ/u);
  });

  it("reopens the exact governed NAS collection and totals on the receipt branch", () => {
    const observationValue = json(resolve(fixture.root, PHASE10_AI_OBSERVATIONS_PATH)) as any;
    const nasPath = resolve(fixture.root, observationValue.existingNasVerification.attemptReport.path);
    const refusalBytes = readFileSync(nasPath);
    const passingReport = {
      format: "snowflake-nas-assets-readonly-report-v1",
      command: "verify",
      ok: true,
      scope: "explicit-single-collection-full-hash",
      mount: "attached",
      collections: [{ identity: "post-phase9-intake@2026-08-13", state: "provisional", manifest: "verified", aggregate: "verified", payload: "verified-full" }],
      overlays: [],
      defects: [],
      limitations: [],
      fullPayloadTotals: { files: 26, bytes: 165722101 },
      limits: [],
    };
    const observationsFor = (report: unknown) => {
      const bytes = prettyJsonBytes(report);
      writeFileSync(nasPath, bytes);
      const value = structuredClone(observationValue);
      const identity = tuple(value.existingNasVerification.attemptReport.path, bytes);
      Object.assign(value.existingNasVerification, { state: "receipt-verified", matchedTrackedTupleCount: 24, privateOnlyTupleCount: 2, attemptReport: identity, verificationReceipt: identity, refusalReason: null });
      return parseIntakeObservations(value, fixture.protocol);
    };
    try {
      expect(reopenPhase10IntakeRaw(fixture.root, observationsFor(passingReport))).toHaveLength(25);
      const wrongCollection = structuredClone(passingReport);
      wrongCollection.collections[0]!.identity = "another-collection@2026-08-13";
      expect(() => reopenPhase10IntakeRaw(fixture.root, observationsFor(wrongCollection))).toThrow(/collection row differs/u);
      const wrongTotals = structuredClone(passingReport);
      wrongTotals.fullPayloadTotals.files = 25;
      expect(() => reopenPhase10IntakeRaw(fixture.root, observationsFor(wrongTotals))).toThrow(/exact successful full report/u);
    } finally {
      writeFileSync(nasPath, refusalBytes);
    }
  });

  it("pins the four callable roles, their current bytes, and checkout-stable attributes", () => {
    const registry = parsePhase10CallableRegistry(json(resolve(SOURCE_REPOSITORY, `${AI_PACKET_DIRECTORY}/callable-registry.json`)) as any);
    expect(registry.callables.map((entry) => [entry.callableId, entry.role])).toEqual([
      ["phase10-a-i-check-caller", "check-caller"],
      ["phase10-a-i-producer", "producer"],
      ["phase10-a-i-verification-receipt-writer", "producer"],
      ["phase10-ai-verifier", "independent-evaluator"],
    ]);
    for (const callable of registry.callables) {
      const bytes = new Uint8Array(readFileSync(resolve(SOURCE_REPOSITORY, callable.modulePath!)));
      expect(callable.identity).toEqual({ byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) });
    }
    const attrs = git(SOURCE_REPOSITORY, ["check-attr", "text", "--", ...registry.callables.map((entry) => entry.modulePath!)]);
    expect(attrs.split("\n").every((line) => line.endsWith(": unset"))).toBe(true);
    const verifier = readFileSync(resolve(SOURCE_REPOSITORY, "runner/src/phase10-intake-verify.ts"), "utf8");
    expect(verifier).not.toMatch(/from ["']\.\/phase10-intake(?:\.ts)?["']/u);
    expect(verifier).not.toMatch(/composeCurrencySnapshots/u);
    expect(verifier).toMatch(/from ["']\.\/phase10-intake-checks\.ts["']/u);
    expect(verifier).toMatch(/phase10AICheckCaller\(/u);
  });
});

describe("Phase 10 A-I synthetic lifecycle", () => {
  it("runs exact produce, safely resumes a partial candidate, verifies, and publishes beside unchanged A-S bytes", () => {
    const produced = run(fixture.root, PRODUCE);
    expectGreen(produced, "initial A-I produce");
    const candidateBytes = new Map(PHASE10_AI_OUTPUTS.filter((entry) => entry.outputId !== "out-ai-verification").map((entry) => [entry.candidateName, new Uint8Array(readFileSync(resolve(fixture.root, CANDIDATE, entry.candidateName)))] as const));
    rmSync(resolve(fixture.root, CANDIDATE, "intake-report.json"));
    rmSync(resolve(fixture.root, CANDIDATE, "intake-artifact-index.json"));
    expectGreen(run(fixture.root, PRODUCE), "resumed A-I produce");
    for (const name of ["currency.jsonl", "post-freeze-dispositions.jsonl", "file-custody.jsonl"] as const) {
      expect(new Uint8Array(readFileSync(resolve(fixture.root, CANDIDATE, name)))).toEqual(candidateBytes.get(name));
    }
    const originalCurrency = candidateBytes.get("currency.jsonl")!;
    writeFileSync(resolve(fixture.root, CANDIDATE, "currency.jsonl"), new TextEncoder().encode("{}\n"));
    const drifted = run(fixture.root, PRODUCE);
    expect(drifted.status).not.toBe(0);
    expect(String(drifted.stderr)).toMatch(/retained partial currency\.jsonl differs/u);
    writeFileSync(resolve(fixture.root, CANDIDATE, "currency.jsonl"), originalCurrency);
    expectGreen(run(fixture.root, VERIFY), "A-I verify");
    writePhase10StaticTerminalReceipt({ repositoryRoot: fixture.root, packetId: "a-i", attemptId: PHASE10_AI_STATIC_ATTEMPT_ID, candidateDirectory: CANDIDATE, command: PHASE10_AI_PRODUCE_COMMAND, repositoryBundleRoot: ".", terminalState: "complete" });
    const asNames = ["phase8a-overlay.jsonl", "phase8b-overlay.jsonl", "scope-artifact-index.json", "scope-report.json", "scope-verification.json"];
    const asBefore = new Map(asNames.map((name) => [name, sha256Bytes(new Uint8Array(readFileSync(resolve(fixture.root, EVIDENCE, name))))] as const));
    const first = PHASE10_AI_OUTPUTS[0]!;
    copyFileSync(resolve(fixture.root, CANDIDATE, first.candidateName), resolve(fixture.root, first.path));
    expectGreen(run(fixture.root, PUBLISH), "A-I partial publication resume");
    expectGreen(run(fixture.root, PUBLISH), "A-I idempotent publication resume");
    for (const [name, digest] of asBefore) expect(sha256Bytes(new Uint8Array(readFileSync(resolve(fixture.root, EVIDENCE, name))))).toBe(digest);
    const receipt = json(resolve(fixture.root, CANDIDATE, "intake-verification.json")) as any;
    expect(receipt.terminalState).toBe("complete");
    expect(receipt.aggregateVerdict).toBe("pass");
    expect(receipt.checkResults.map((entry: any) => entry.checkId)).toEqual(PHASE10_AI_CHECK_IDS);
    expect(receipt.verifiedArtifacts).toHaveLength(5);
    expect(receipt.boundDependencyPacketIds).toEqual(["a-p"]);
    expect(json(resolve(fixture.root, "evidence/phase10-obligation-preflight-v1/packets/a-i/terminal-receipt.json"))).toMatchObject({ terminalState: "complete", producedOutputIds: PHASE10_AI_OUTPUTS.map((entry) => entry.outputId) });
  }, 120_000);

  it("refuses duplicate artifacts, wrong dependency, and wrong evaluator provenance before any new write", () => {
    const path = resolve(fixture.root, CANDIDATE, "intake-verification.json");
    const original = readFileSync(path);
    const mutations = [
      (value: any) => { value.verifiedArtifacts[1] = structuredClone(value.verifiedArtifacts[0]); },
      (value: any) => { value.boundDependencyPacketIds = []; },
      (value: any) => { value.execution.evaluatorCallableId = "phase10-a-i-producer"; },
      (value: any) => { value.checkResults[0].checkId = "chk-ai-three-denominators"; },
    ];
    for (const mutate of mutations) {
      const value = JSON.parse(original.toString("utf8"));
      mutate(value);
      pretty(path, value);
      const result = run(fixture.root, PUBLISH);
      expect(result.status).not.toBe(0);
    }
    writeFileSync(path, original);
    expectGreen(run(fixture.root, PUBLISH), "restored exact verification receipt");
  }, 120_000);

  it("rejects a producer-only shared currency-derivation bug", () => {
    const asymmetric = buildFixture((root) => {
      const path = resolve(root, "runner/src/phase10-intake-contracts.ts");
      const source = readFileSync(path, "utf8");
      const marker = "export function composeCurrencySnapshots";
      const offset = source.indexOf(marker);
      if (offset < 0) throw new Error("shared currency helper marker is absent");
      const prefix = source.slice(0, offset);
      const suffix = source.slice(offset).replace(
        "selectedByBranches: plan.selectedByBranches,",
        "selectedByBranches: Object.freeze([...plan.selectedByBranches, \"shared-derivation-bug\"].sort(lexical)),",
      );
      if (suffix === source.slice(offset)) throw new Error("shared currency helper mutation did not execute");
      writeFileSync(path, `${prefix}${suffix}`);
    });
    expectGreen(run(asymmetric.root, PRODUCE), "producer with synthetic shared currency bug");
    const result = run(asymmetric.root, VERIFY);
    expect(result.status).not.toBe(0);
    expect(String(result.stderr)).toMatch(/currency\.jsonl differs from independent reconstruction/u);
  }, 120_000);

  it("rejects an implementation that omits a registered check-caller invocation", () => {
    const omitted = buildFixture((root) => {
      const modulePath = "runner/src/phase10-intake-checks.ts";
      const target = resolve(root, modulePath);
      const source = readFileSync(target, "utf8");
      const mutated = source.replace("return PHASE10_AI_CHECK_IDS.map", "return PHASE10_AI_CHECK_IDS.slice(1).map");
      if (mutated === source) throw new Error("check-caller omission mutation did not execute");
      writeFileSync(target, mutated);
      const registryPath = resolve(root, `${AI_PACKET_DIRECTORY}/callable-registry.json`);
      const registry = json(registryPath) as any;
      const caller = registry.callables.find((entry: any) => entry.callableId === "phase10-a-i-check-caller");
      const bytes = new TextEncoder().encode(mutated);
      caller.identity = { byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
      pretty(registryPath, registry);
    });
    expectGreen(run(omitted.root, PRODUCE), "producer with an omission-mutated registered check caller");
    const result = run(omitted.root, VERIFY);
    expect(result.status).not.toBe(0);
    expect(String(result.stderr)).toMatch(/registered check caller did not execute the exact ordered check roster/u);
  }, 120_000);

  it("refuses a committed post-freeze support-module drift", () => {
    const driftFixture = buildFixture();
    const target = resolve(driftFixture.root, "runner/src/phase10-intake-contracts.ts");
    writeFileSync(target, `${readFileSync(target, "utf8")}\n// synthetic post-freeze drift\n`);
    git(driftFixture.root, ["add", "--", "runner/src/phase10-intake-contracts.ts"]);
    git(driftFixture.root, ["-c", "user.name=Phase10 A-I Test", "-c", "user.email=phase10-ai@example.invalid", "commit", "--quiet", "-m", "Synthetic forbidden support drift"]);
    const result = run(driftFixture.root, PRODUCE);
    expect(result.status).not.toBe(0);
    expect(String(result.stderr)).toMatch(/post-freeze history|semantic protocol bytes changed|registry/u);
  });
});

describe("Phase 10 A-I freeze-before-input ordering", () => {
  it("refuses observation from a descendant HEAD before any endpoint or NAS operation", async () => {
    const frozen = cloneWithFreeze();
    pretty(resolve(frozen.root, "descendant.json"), { state: "unrelated" });
    git(frozen.root, ["add", "--", "descendant.json"]);
    git(frozen.root, ["-c", "user.name=Phase10 A-I Test", "-c", "user.email=phase10-ai@example.invalid", "commit", "--quiet", "-m", "Advance after observation freeze"]);
    const module = await import("../src/phase10-intake-observe.ts");
    await expect(module.observePhase10Intake({ repositoryRoot: frozen.root, packetProtocolPath: `${AI_PACKET_DIRECTORY}/protocol.json`, rawAttemptPath: PHASE10_AI_OBSERVATION_ATTEMPT, outputPath: PHASE10_AI_OBSERVATIONS_PATH })).rejects.toThrow(/exact semantic-protocol freeze HEAD/u);
    expect(existsSync(resolve(frozen.root, PHASE10_AI_OBSERVATION_ATTEMPT))).toBe(false);
  }, 120_000);
});
