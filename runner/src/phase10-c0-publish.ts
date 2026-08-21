import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  PHASE10_C0_DERIVE_OUTPUTS,
  PHASE10_C0_GAP_IDS,
  PHASE10_C0_PUBLISH_OUTPUTS,
  PHASE10_C0_SCIENCE_PROTOCOL_ID,
  phase10C0ArtifactIdentity,
  phase10C0AssertBoundExecution,
  phase10C0Lexical,
  phase10C0ParsePrettyJson,
  phase10C0PrettyJsonBytes,
  type Phase10C0ExecutionProvenance,
} from "./phase10-c0-contracts.ts";
import {
  phase10C0ValidateCandidateVerification,
  type Phase10C0PublicationVerificationContext,
} from "./phase10-c0-publication-guard.ts";

type JsonObject = { readonly [key: string]: StrictJson };

export const PHASE10_C0_PUBLICATION_PATH =
  "evidence/phase10-numerical-verification-v1";

export interface Phase10C0PublishProduceRequest {
  readonly preflightReceiptBytes: Uint8Array;
  readonly execution: Phase10C0ExecutionProvenance;
  readonly analysisBytes: Uint8Array;
  readonly comparisonsBytes: Uint8Array;
  readonly gapsBytes: Uint8Array;
  readonly historicalLimitBytes: Uint8Array;
  readonly publishedIso: string;
}

export interface Phase10C0PublishArtifacts {
  readonly reportBytes: Uint8Array;
  readonly artifactIndexBytes: Uint8Array;
}

export interface Phase10C0PublicationRequest {
  readonly repositoryRoot: string;
  readonly packetId: "c0-derive" | "c0-publish";
  readonly candidateDirectory: string;
  readonly outputDirectory: typeof PHASE10_C0_PUBLICATION_PATH;
  readonly verificationContext: Phase10C0PublicationVerificationContext;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0 publication refused: ${message}`);
}

function object(value: StrictJson, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as JsonObject;
}

function exactKeys(value: object, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(phase10C0Lexical);
  const wanted = [...expected].sort(phase10C0Lexical);
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) fail(`${label} fields differ`);
}

function asArray(value: StrictJson, label: string): readonly StrictJson[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value;
}

function timestamp(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value))) fail(`${label} is not an ISO timestamp`);
}

function artifactIndexEntry(
  artifactId: string,
  path: string,
  bytes: Uint8Array,
  role: string,
  producedBy: string,
): StrictJson {
  const identity = phase10C0ArtifactIdentity(path, bytes);
  return strictJsonSnapshot({
    artifactId,
    path,
    mediaType: path.endsWith(".jsonl") ? "application/x-ndjson" : "application/json",
    byteLength: identity.byteLength,
    sha256: identity.sha256,
    role,
    producedBy,
  });
}

/** Produce the report and self-excluding index from reopened derive bytes. */
export function producePhase10C0PublishArtifacts(
  request: Phase10C0PublishProduceRequest,
): Phase10C0PublishArtifacts {
  phase10C0AssertBoundExecution(request.execution, request.preflightReceiptBytes, "c0-publish");
  timestamp(request.publishedIso, "publishedIso");
  const analysis = object(phase10C0ParsePrettyJson(request.analysisBytes, "C0 analysis"), "C0 analysis");
  const gaps = object(phase10C0ParsePrettyJson(request.gapsBytes, "C0 gaps"), "C0 gaps");
  const historical = object(phase10C0ParsePrettyJson(request.historicalLimitBytes, "C0 historical limit"), "C0 historical limit");
  if (
    analysis.schema !== "phase10-c0-analysis-v1" || gaps.schema !== "phase10-c0-gap-report-v1" ||
    historical.schema !== "phase10-c0-historical-limit-v1" ||
    analysis.protocolId !== PHASE10_C0_SCIENCE_PROTOCOL_ID ||
    gaps.protocolId !== PHASE10_C0_SCIENCE_PROTOCOL_ID ||
    historical.protocolId !== PHASE10_C0_SCIENCE_PROTOCOL_ID
  ) fail("derive artifact schema or protocol identity differs");
  const roster = object(analysis.roster, "C0 analysis roster");
  const spacingResults = asArray(analysis.spacingResults, "C0 analysis spacingResults");
  const gapItems = asArray(gaps.gaps, "C0 gap items");
  const gapIds = gapItems.map((value, index) => {
    const row = object(value, `C0 gap ${index}`);
    if (typeof row.gapId !== "string") fail(`C0 gap ${index} lacks gapId`);
    return row.gapId;
  });
  if (JSON.stringify(gapIds) !== JSON.stringify(PHASE10_C0_GAP_IDS)) fail("C0 gap roster differs");
  const issue = object(historical.issue, "C0 historical issue");
  const artifactDefects = asArray(analysis.artifactDefects, "C0 artifact defects");
  const diagnosticComplete = artifactDefects.length === 0 && roster.presentExpectedRowCount === 80 && roster.emittedPairingCount === 64;
  const report = strictJsonSnapshot({
    schema: "phase10-c0-report-v1",
    protocolId: PHASE10_C0_SCIENCE_PROTOCOL_ID,
    analysisArtifact: phase10C0ArtifactIdentity(PHASE10_C0_DERIVE_OUTPUTS["out-c0-analysis"].path, request.analysisBytes),
    comparisonsArtifact: phase10C0ArtifactIdentity(PHASE10_C0_DERIVE_OUTPUTS["out-c0-comparisons"].path, request.comparisonsBytes),
    gapArtifact: phase10C0ArtifactIdentity(PHASE10_C0_DERIVE_OUTPUTS["out-c0-gaps"].path, request.gapsBytes),
    historicalLimitArtifact: phase10C0ArtifactIdentity(PHASE10_C0_DERIVE_OUTPUTS["out-c0-historical-limit"].path, request.historicalLimitBytes),
    comparisonBreakdown: {
      expectedRowCount: roster.expectedRowCount,
      presentExpectedRowCount: roster.presentExpectedRowCount,
      expectedPairingCount: roster.expectedPairingCount,
      emittedPairingCount: roster.emittedPairingCount,
      spacingResults,
      overallVerdict: analysis.overallVerdict,
      overallNoPassClass: analysis.overallNoPassClass,
    },
    gapSummary: {
      gapCount: gapIds.length,
      gapIds,
      targetObservationOperatorStatus: gaps.targetObservationOperatorStatus,
    },
    historicalLimitSummary: {
      disposition: historical.disposition,
      historicalReportUse: historical.historicalReportUse,
      observedReduction: issue.observedReduction,
      authoritativeReduction: issue.authoritativeReduction,
    },
    scientificDisposition: {
      status: diagnosticComplete ? "diagnostic-complete" : "artifact-failure",
      solverExecuted: false,
      solverAccuracyPass: false,
      robustHabitClaim: false,
      targetScoreProduced: false,
      quantitativeValidationClaim: false,
    },
    claimLimits: [
      "C0 ranks only persisted or independently derivable diagnostic fields.",
      "Neutral-only historical habit classes do not establish a robust habit observable.",
      "No solver run, absolute-accuracy reference, target score, or quantitative validation occurred.",
    ],
    publishedIso: request.publishedIso,
  });
  const reportBytes = phase10C0PrettyJsonBytes(report);
  const artifacts = [
    artifactIndexEntry("out-c0-analysis", PHASE10_C0_DERIVE_OUTPUTS["out-c0-analysis"].path, request.analysisBytes, "c0-analysis", "phase10-c0-derive-producer"),
    artifactIndexEntry("out-c0-comparisons", PHASE10_C0_DERIVE_OUTPUTS["out-c0-comparisons"].path, request.comparisonsBytes, "c0-comparisons", "phase10-c0-derive-producer"),
    artifactIndexEntry("out-c0-gaps", PHASE10_C0_DERIVE_OUTPUTS["out-c0-gaps"].path, request.gapsBytes, "c0-gap-report", "phase10-c0-derive-producer"),
    artifactIndexEntry("out-c0-historical-limit", PHASE10_C0_DERIVE_OUTPUTS["out-c0-historical-limit"].path, request.historicalLimitBytes, "c0-historical-limit", "phase10-c0-derive-producer"),
    artifactIndexEntry("out-c0-report", PHASE10_C0_PUBLISH_OUTPUTS["out-c0-report"].path, reportBytes, "c0-report", "phase10-c0-publish-producer"),
  ].sort((left, right) => phase10C0Lexical((left as JsonObject).artifactId as string, (right as JsonObject).artifactId as string));
  const artifactIndexBytes = phase10C0PrettyJsonBytes({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-numerical-verification-v1",
    artifacts,
  });
  return Object.freeze({ reportBytes, artifactIndexBytes });
}

const DERIVE_FILES = Object.freeze([
  "c0-analysis.json",
  "c0-comparisons.jsonl",
  "c0-derive-verification.json",
  "c0-historical-verifier-limit.json",
  "c0-target-field-gaps.json",
]);
const PUBLISH_FILES = Object.freeze([
  "c0-artifact-index.json",
  "c0-report.json",
  "c0-verification.json",
]);
const COMPLETE_FILES = Object.freeze([...DERIVE_FILES, ...PUBLISH_FILES].sort(phase10C0Lexical));

function pathWithin(parent: string, child: string): boolean {
  const displacement = relative(parent, child);
  return displacement !== "" && displacement !== ".." && !displacement.startsWith(`..${sep}`) && !isAbsolute(displacement);
}

function safeRoot(value: string): string {
  const root = realpathSync(resolve(value));
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("repository root must be a non-symlink directory");
  return root;
}

function safeRelative(value: string, label: string): string {
  if (isAbsolute(value) || value.includes("\\") || value.startsWith("/") || value.endsWith("/") || value.split("/").some((part) => part === "" || part === "." || part === "..")) {
    fail(`${label} is not a safe repository-relative path`);
  }
  return value;
}

function readCandidate(root: string, candidateRelative: string, fileName: string): Uint8Array {
  const candidate = resolve(root, safeRelative(candidateRelative, "candidate directory"));
  if (!pathWithin(root, candidate)) fail("candidate directory escapes repository root");
  const absolute = resolve(candidate, fileName);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${fileName} is not a regular candidate file`);
  const physical = realpathSync(absolute);
  if (relative(candidate, physical).replaceAll("\\", "/") !== fileName) fail(`${fileName} aliases outside the candidate`);
  return new Uint8Array(readFileSync(physical));
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function writeExclusive(path: string, bytes: Uint8Array): void {
  let descriptor: number | undefined;
  try {
    descriptor = openSync(path, "wx");
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    throw error;
  }
  if (!sameBytes(new Uint8Array(readFileSync(path)), bytes)) fail(`${basename(path)} readback differs`);
}

/**
 * Idempotently install only the exact packet-owned evidence files. Preflight/terminal receipts
 * remain the shared executor's separate packet-catalogue publication.
 */
export function publishPhase10C0PacketCandidate(request: Phase10C0PublicationRequest): boolean {
  const root = safeRoot(request.repositoryRoot);
  if (request.outputDirectory !== PHASE10_C0_PUBLICATION_PATH) fail("C0 output directory differs from registration");
  const output = resolve(root, request.outputDirectory);
  if (!pathWithin(root, output)) fail("C0 output directory escapes repository root");
  const packetFiles = request.packetId === "c0-derive" ? DERIVE_FILES : PUBLISH_FILES;
  const candidateBytes = new Map(packetFiles.map((fileName) => [fileName, readCandidate(root, request.candidateDirectory, fileName)] as const));
  if (request.verificationContext.packetId !== request.packetId) fail("publication verification context packet differs");
  if (existsSync(output)) {
    const stat = lstatSync(output);
    if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(output) !== output) fail("existing C0 publication directory is aliased or not a directory");
    const names = readdirSync(output).sort(phase10C0Lexical);
    if (names.some((name) => !COMPLETE_FILES.includes(name))) fail("existing C0 publication contains an unregistered file");
    if (request.packetId === "c0-publish" && DERIVE_FILES.some((fileName) => !existsSync(resolve(output, fileName)))) {
      fail("C0 publish requires the complete derive publication dependency");
    }
  } else if (request.packetId === "c0-publish") fail("C0 publish cannot precede the derive publication");
  if (request.packetId === "c0-publish") {
    for (const fileName of DERIVE_FILES) {
      const absolute = resolve(output, fileName);
      const stat = lstatSync(absolute);
      if (!stat.isFile() || stat.isSymbolicLink()) fail(`derive dependency ${fileName} is not a regular published file`);
      candidateBytes.set(fileName, new Uint8Array(readFileSync(absolute)));
    }
  }
  phase10C0ValidateCandidateVerification(
    request.verificationContext,
    Object.fromEntries(candidateBytes) as Readonly<Record<string, Uint8Array>>,
  );
  if (!existsSync(output)) {
    mkdirSync(dirname(output), { recursive: true });
    mkdirSync(output);
  }
  let changed = false;
  const stage = resolve(output, `.c0-${request.packetId}-stage-${process.pid}`);
  if (existsSync(stage)) fail("C0 publication staging directory already exists");
  mkdirSync(stage);
  try {
    for (const fileName of packetFiles) {
      const bytes = candidateBytes.get(fileName)!;
      const destination = resolve(output, fileName);
      if (existsSync(destination)) {
        const stat = lstatSync(destination);
        if (!stat.isFile() || stat.isSymbolicLink() || !sameBytes(new Uint8Array(readFileSync(destination)), bytes)) {
          fail(`existing C0 publication differs at ${fileName}`);
        }
        continue;
      }
      const staged = resolve(stage, fileName);
      writeExclusive(staged, bytes);
      renameSync(staged, destination);
      changed = true;
    }
  } finally {
    if (existsSync(stage)) rmSync(stage, { recursive: true, force: false });
  }
  for (const fileName of packetFiles) {
    if (!sameBytes(new Uint8Array(readFileSync(resolve(output, fileName))), candidateBytes.get(fileName)!)) fail(`published C0 readback differs at ${fileName}`);
  }
  return changed;
}
