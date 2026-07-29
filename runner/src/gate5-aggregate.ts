// Phase 5 aggregate gate.
//
// Only this command can make the Phase 5 claim. It reopens the complete Windows lane,
// recomputes repository and protocol identity, re-derives every criterion, and publishes
// an index last as the aggregate commit marker.

import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
} from "./gate4-evidence.ts";
import {
  PHASE5_LANE_INDEX_PATH,
  verifyPhase5LaneBundle,
  type Phase5ArtifactDescriptor,
  type Phase5LaneVerificationHooks,
  type Phase5SourceHash,
  type VerifiedPhase5LaneBundle,
} from "./gate5-evidence.ts";
import {
  collectPhase5CommitSourceHashes,
  collectPhase5RepositoryIdentity,
  PHASE5_WINDOWS_LANE_DIRECTORY,
  type Phase5RepositoryIdentity,
} from "./gate5-lane.ts";
import { evaluatePhase5Lane } from "./gate5-protocol.ts";
import {
  PHASE5_EVIDENCE_SCHEMA,
  PHASE5_GATE_COMMAND,
  PHASE5_PROTOCOL,
  PHASE5_PROTOCOL_SHA256,
} from "./phase5-protocol.ts";

export const GATE5_REPORT_PATH = "out/phase5/gate5-report.json";
export const GATE5_ARTIFACT_INDEX_PATH =
  "out/phase5/gate5-artifact-index.json";

const SHA256 = /^[0-9a-f]{64}$/;

interface FileIdentity {
  readonly dev: bigint;
  readonly ino: bigint;
}

interface DirectoryIdentity extends FileIdentity {
  readonly realPath: string;
}

export interface Phase5AggregateReport {
  readonly schema: typeof PHASE5_EVIDENCE_SCHEMA.aggregateReport;
  readonly protocol: typeof PHASE5_PROTOCOL;
  readonly protocolSha256: typeof PHASE5_PROTOCOL_SHA256;
  readonly repository: Phase5RepositoryIdentity;
  readonly lane: {
    readonly id: "windows-d3d12";
    readonly directory: "windows-d3d12";
    readonly manifest: Phase5ArtifactDescriptor;
    readonly report: Phase5ArtifactDescriptor;
    readonly index: Phase5ArtifactDescriptor;
  };
  readonly criteria: ReturnType<typeof evaluatePhase5Lane>["criteria"];
  readonly gatePass: true;
  readonly exitCode: 0;
}

export interface Phase5AggregateArtifactIndex {
  readonly schema: typeof PHASE5_EVIDENCE_SCHEMA.artifactIndex;
  readonly publication: "complete";
  readonly report: Phase5ArtifactDescriptor;
  /** Aggregate report first, then every reopened lane artifact in path order. */
  readonly artifacts: readonly Phase5ArtifactDescriptor[];
}

export interface VerifiedPhase5Aggregate {
  readonly reportPath: string;
  readonly indexPath: string;
  readonly report: Phase5AggregateReport;
  readonly index: Phase5AggregateArtifactIndex;
  readonly lane: VerifiedPhase5LaneBundle;
}

export interface RunGate5Options {
  readonly repoRoot?: string;
  readonly laneDirectory?: string;
  readonly reportPath?: string;
  readonly indexPath?: string;
  readonly collectRepositoryIdentity?: () => Phase5RepositoryIdentity;
  /**
   * Test-only seam. The flagless CLI always re-exports the lane's commit and hashes that
   * snapshot, which is the same inventory the lane published.
   */
  readonly collectSourceHashes?: (commit: string) => readonly Phase5SourceHash[];
  /** Test-only checkpoint-size seam; the CLI never supplies it. */
  readonly laneVerificationHooks?: Phase5LaneVerificationHooks;
  /** Test-only mutation seam, called after the commit marker is renamed. */
  readonly afterPublish?: (paths: {
    readonly reportPath: string;
    readonly indexPath: string;
    readonly laneDirectory: string;
  }) => void;
}

function lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function directoryIdentity(path: string, label: string): DirectoryIdentity {
  const metadata = lstatSync(path, { bigint: true });
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new Error(`GATE5: ${label} is not an independent directory`);
  }
  const realPath = realpathSync.native(path);
  if (resolve(realPath) !== resolve(path)) {
    throw new Error(`GATE5: ${label} resolves through an alias or junction`);
  }
  return { dev: metadata.dev, ino: metadata.ino, realPath };
}

function assertDirectoryIdentity(
  path: string,
  expected: DirectoryIdentity,
  label: string,
): void {
  const actual = directoryIdentity(path, label);
  if (
    actual.dev !== expected.dev ||
    actual.ino !== expected.ino ||
    actual.realPath !== expected.realPath
  ) {
    throw new Error(`GATE5: ${label} identity changed`);
  }
}

function fileIdentity(path: string, label: string): FileIdentity {
  const metadata = lstatSync(path, { bigint: true });
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.nlink !== 1n ||
    resolve(realpathSync.native(path)) !== resolve(path)
  ) {
    throw new Error(`GATE5: ${label} is not an independent regular file`);
  }
  return { dev: metadata.dev, ino: metadata.ino };
}

function assertFileIdentity(
  path: string,
  expected: FileIdentity,
  label: string,
): void {
  const actual = fileIdentity(path, label);
  if (actual.dev !== expected.dev || actual.ino !== expected.ino) {
    throw new Error(`GATE5: ${label} identity changed`);
  }
}

function removeOwnedFile(
  path: string,
  expected: FileIdentity,
  label: string,
): void {
  if (!existsSync(path)) return;
  assertFileIdentity(path, expected, label);
  rmSync(path, { force: true });
}

function artifactDescriptor(
  path: string,
  kind: string,
  bytes: Uint8Array,
): Phase5ArtifactDescriptor {
  return {
    path,
    kind,
    byteLength: bytes.byteLength,
    sha256: sha256Bytes(bytes),
  };
}

function reopenedDescriptor(
  absolute: string,
  path: string,
  kind: string,
): Phase5ArtifactDescriptor {
  const metadata = lstatSync(absolute);
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.nlink !== 1
  ) {
    throw new Error(`GATE5: artifact is not an independent regular file: ${path}`);
  }
  return artifactDescriptor(path, kind, new Uint8Array(readFileSync(absolute)));
}

function readIndependentArtifact(absolute: string, label: string): Uint8Array {
  const metadata = lstatSync(absolute);
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.nlink !== 1
  ) {
    throw new Error(`GATE5: ${label} is not an independent regular file`);
  }
  if (resolve(realpathSync.native(absolute)) !== resolve(absolute)) {
    throw new Error(`GATE5: ${label} resolves through an alias`);
  }
  return new Uint8Array(readFileSync(absolute));
}

function prefixedLaneArtifacts(
  lane: VerifiedPhase5LaneBundle,
): readonly Phase5ArtifactDescriptor[] {
  const indexAbsolute = join(lane.directory, PHASE5_LANE_INDEX_PATH);
  const entries = [
    reopenedDescriptor(
      indexAbsolute,
      `windows-d3d12/${PHASE5_LANE_INDEX_PATH}`,
      "phase5-lane-artifact-index+json",
    ),
    ...lane.index.artifacts.map((entry) => ({
      ...entry,
      path: `windows-d3d12/${entry.path}`,
    })),
  ];
  return entries.sort((left, right) => lexical(left.path, right.path));
}

function buildAggregateReport(
  identity: Phase5RepositoryIdentity,
  lane: VerifiedPhase5LaneBundle,
): Phase5AggregateReport {
  const verdict = evaluatePhase5Lane(lane.report.raw);
  if (
    !verdict.gatePass ||
    verdict.exitCode !== 0 ||
    canonicalJson(verdict.criteria) !== canonicalJson(lane.report.criteria)
  ) {
    throw new Error("GATE5: lane criteria do not independently re-evaluate to pass");
  }
  if (
    lane.manifest.repository.commit !== identity.commit ||
    !lane.manifest.repository.clean ||
    lane.report.raw.repository.commit !== identity.commit ||
    !lane.report.raw.repository.clean
  ) {
    throw new Error("GATE5: lane repository identity differs from the aggregate commit");
  }
  return {
    schema: PHASE5_EVIDENCE_SCHEMA.aggregateReport,
    protocol: PHASE5_PROTOCOL,
    protocolSha256: PHASE5_PROTOCOL_SHA256,
    repository: identity,
    lane: {
      id: "windows-d3d12",
      directory: "windows-d3d12",
      manifest: lane.index.manifest,
      report: lane.index.report,
      index: reopenedDescriptor(
        join(lane.directory, PHASE5_LANE_INDEX_PATH),
        PHASE5_LANE_INDEX_PATH,
        "phase5-lane-artifact-index+json",
      ),
    },
    criteria: verdict.criteria,
    gatePass: true,
    exitCode: 0,
  };
}

function buildAggregateIndex(
  reportBytes: Uint8Array,
  lane: VerifiedPhase5LaneBundle,
): Phase5AggregateArtifactIndex {
  const report = artifactDescriptor(
    basename(GATE5_REPORT_PATH),
    "phase5-gate-report+json",
    reportBytes,
  );
  return {
    schema: PHASE5_EVIDENCE_SCHEMA.artifactIndex,
    publication: "complete",
    report,
    artifacts: [report, ...prefixedLaneArtifacts(lane)],
  };
}

function canonicalObject<T>(bytes: Uint8Array, label: string): T {
  const parsed = parseCanonicalJson(bytes, label);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} must be an object`);
  }
  return parsed as unknown as T;
}

function sameIdentity(
  left: Phase5RepositoryIdentity,
  right: Phase5RepositoryIdentity,
): boolean {
  return left.commit === right.commit && left.clean === right.clean;
}

function assertAggregateParentSet(
  parent: string,
  laneDirectory: string,
  reportPath: string,
  indexPath: string,
): void {
  const allowed = new Set([
    basename(laneDirectory),
    basename(reportPath),
    basename(indexPath),
  ]);
  const actual = readdirSync(parent);
  const extras = actual.filter((name) => !allowed.has(name));
  if (extras.length > 0) {
    throw new Error(
      `GATE5: aggregate directory contains unindexed entries: ${extras.sort(lexical).join(", ")}`,
    );
  }
}

export function verifyGate5Aggregate(
  options: RunGate5Options = {},
): VerifiedPhase5Aggregate {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const laneDirectory = resolve(
    repoRoot,
    options.laneDirectory ?? PHASE5_WINDOWS_LANE_DIRECTORY,
  );
  const reportPath = resolve(
    repoRoot,
    options.reportPath ?? GATE5_REPORT_PATH,
  );
  const indexPath = resolve(
    repoRoot,
    options.indexPath ?? GATE5_ARTIFACT_INDEX_PATH,
  );
  if (dirname(reportPath) !== dirname(indexPath) || dirname(laneDirectory) !== dirname(reportPath)) {
    throw new Error("GATE5: lane, report, and index must share one publication directory");
  }
  const parentIdentity = directoryIdentity(
    dirname(reportPath),
    "aggregate publication parent",
  );
  const laneIdentity = directoryIdentity(laneDirectory, "canonical lane");
  assertAggregateParentSet(dirname(reportPath), laneDirectory, reportPath, indexPath);
  const identity = options.collectRepositoryIdentity?.() ??
    collectPhase5RepositoryIdentity(repoRoot);
  if (!identity.clean) throw new Error("GATE5: repository is dirty");
  const sourceHashes = [
    ...(options.collectSourceHashes?.(identity.commit) ??
      collectPhase5CommitSourceHashes(repoRoot, identity.commit)),
  ];
  const lane = verifyPhase5LaneBundle(
    laneDirectory,
    sourceHashes,
    options.laneVerificationHooks,
  );
  const expectedReport = buildAggregateReport(identity, lane);
  const expectedReportBytes = canonicalJsonBytes(expectedReport);
  const reportBytes = readIndependentArtifact(reportPath, "aggregate report");
  const report = canonicalObject<Phase5AggregateReport>(
    reportBytes,
    "Phase 5 aggregate report",
  );
  if (
    sha256Bytes(reportBytes) !== sha256Bytes(expectedReportBytes) ||
    canonicalJson(report) !== canonicalJson(expectedReport)
  ) {
    throw new Error("GATE5: aggregate report differs from reopened lane evidence");
  }
  const expectedIndex = buildAggregateIndex(expectedReportBytes, lane);
  const indexBytes = readIndependentArtifact(indexPath, "aggregate artifact index");
  const index = canonicalObject<Phase5AggregateArtifactIndex>(
    indexBytes,
    "Phase 5 aggregate artifact index",
  );
  if (canonicalJson(index) !== canonicalJson(expectedIndex)) {
    throw new Error("GATE5: aggregate artifact index is not fully cross-linked");
  }
  if (
    index.schema !== PHASE5_EVIDENCE_SCHEMA.artifactIndex ||
    index.publication !== "complete" ||
    !SHA256.test(index.report.sha256)
  ) {
    throw new Error("GATE5: aggregate artifact index identity differs");
  }
  assertDirectoryIdentity(
    dirname(reportPath),
    parentIdentity,
    "aggregate publication parent",
  );
  assertDirectoryIdentity(laneDirectory, laneIdentity, "canonical lane");
  return { reportPath, indexPath, report, index, lane };
}

function writeTemporary(path: string, bytes: Uint8Array): void {
  writeFileSync(path, bytes, { flag: "wx" });
  const reopened = new Uint8Array(readFileSync(path));
  if (
    reopened.byteLength !== bytes.byteLength ||
    sha256Bytes(reopened) !== sha256Bytes(bytes)
  ) {
    throw new Error(`GATE5: temporary artifact changed during write: ${path}`);
  }
}

export function runGate5(
  options: RunGate5Options = {},
): VerifiedPhase5Aggregate {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const laneDirectory = resolve(
    repoRoot,
    options.laneDirectory ?? PHASE5_WINDOWS_LANE_DIRECTORY,
  );
  const reportPath = resolve(
    repoRoot,
    options.reportPath ?? GATE5_REPORT_PATH,
  );
  const indexPath = resolve(
    repoRoot,
    options.indexPath ?? GATE5_ARTIFACT_INDEX_PATH,
  );
  if (
    dirname(reportPath) !== dirname(indexPath) ||
    dirname(laneDirectory) !== dirname(reportPath)
  ) {
    throw new Error("GATE5: lane, report, and index must share one publication directory");
  }
  const parentIdentity = directoryIdentity(
    dirname(reportPath),
    "aggregate publication parent",
  );
  if (existsSync(indexPath)) {
    throw new Error("GATE5: aggregate evidence already exists");
  }
  const orphanReportExists = existsSync(reportPath);
  const orphanReportIdentity = orphanReportExists
    ? fileIdentity(reportPath, "orphan aggregate report")
    : null;
  assertAggregateParentSet(dirname(reportPath), laneDirectory, reportPath, indexPath);
  const identity = options.collectRepositoryIdentity?.() ??
    collectPhase5RepositoryIdentity(repoRoot);
  if (!identity.clean) throw new Error("GATE5: repository must be clean");
  const sourceHashes = [
    ...(options.collectSourceHashes?.(identity.commit) ??
      collectPhase5CommitSourceHashes(repoRoot, identity.commit)),
  ];
  const lane = verifyPhase5LaneBundle(
    laneDirectory,
    sourceHashes,
    options.laneVerificationHooks,
  );
  const report = buildAggregateReport(identity, lane);
  const reportBytes = canonicalJsonBytes(report);
  if (orphanReportExists) {
    const reopened = readIndependentArtifact(reportPath, "orphan aggregate report");
    if (
      reopened.byteLength !== reportBytes.byteLength ||
      sha256Bytes(reopened) !== sha256Bytes(reportBytes)
    ) {
      throw new Error(
        "GATE5: orphan aggregate report does not match the current authenticated lane",
      );
    }
    if (orphanReportIdentity === null) {
      throw new Error("GATE5: orphan aggregate report identity is unavailable");
    }
    assertFileIdentity(
      reportPath,
      orphanReportIdentity,
      "orphan aggregate report",
    );
  }
  const index = buildAggregateIndex(reportBytes, lane);
  const indexBytes = canonicalJsonBytes(index);
  const nonce = `${process.pid}-${randomUUID()}`;
  const reportTemporary = join(
    dirname(reportPath),
    `.${basename(reportPath)}.attempt-${nonce}`,
  );
  const indexTemporary = join(
    dirname(indexPath),
    `.${basename(indexPath)}.attempt-${nonce}`,
  );
  let reportOwned = false;
  let indexOwned = false;
  let reportIdentity: FileIdentity | null = orphanReportIdentity;
  let indexIdentity: FileIdentity | null = null;
  try {
    if (!orphanReportExists) {
      writeTemporary(reportTemporary, reportBytes);
      reportIdentity = fileIdentity(reportTemporary, "temporary aggregate report");
    }
    writeTemporary(indexTemporary, indexBytes);
    indexIdentity = fileIdentity(indexTemporary, "temporary aggregate index");
    const afterIdentity = options.collectRepositoryIdentity?.() ??
      collectPhase5RepositoryIdentity(repoRoot);
    const afterHashes = [
      ...(options.collectSourceHashes?.(afterIdentity.commit) ??
        collectPhase5CommitSourceHashes(repoRoot, afterIdentity.commit)),
    ];
    if (
      !sameIdentity(identity, afterIdentity) ||
      !afterIdentity.clean ||
      canonicalJson(sourceHashes) !== canonicalJson(afterHashes)
    ) {
      throw new Error("GATE5: repository changed during aggregate publication");
    }
    if (reportIdentity === null || indexIdentity === null) {
      throw new Error("GATE5: aggregate temporary identity is unavailable");
    }
    assertDirectoryIdentity(
      dirname(reportPath),
      parentIdentity,
      "aggregate publication parent",
    );
    assertFileIdentity(
      orphanReportExists ? reportPath : reportTemporary,
      reportIdentity,
      orphanReportExists
        ? "orphan aggregate report"
        : "temporary aggregate report",
    );
    assertFileIdentity(
      indexTemporary,
      indexIdentity,
      "temporary aggregate index",
    );
    // The report is data; the index rename below is the commit marker. A matching
    // index-less report is a recoverable interrupted prior publication.
    if (!orphanReportExists) {
      renameSync(reportTemporary, reportPath);
      reportOwned = true;
    }
    renameSync(indexTemporary, indexPath);
    indexOwned = true;
    assertFileIdentity(reportPath, reportIdentity, "aggregate report");
    assertFileIdentity(indexPath, indexIdentity, "aggregate artifact index");
    options.afterPublish?.({ reportPath, indexPath, laneDirectory });
    assertDirectoryIdentity(
      dirname(reportPath),
      parentIdentity,
      "aggregate publication parent",
    );
    return verifyGate5Aggregate({
      repoRoot,
      laneDirectory,
      reportPath,
      indexPath,
      collectRepositoryIdentity: options.collectRepositoryIdentity,
      collectSourceHashes: options.collectSourceHashes,
      laneVerificationHooks: options.laneVerificationHooks,
    });
  } catch (error) {
    const cleanupErrors: unknown[] = [];
    for (const [path, identity, label] of [
      [
        indexOwned ? indexPath : indexTemporary,
        indexIdentity,
        "owned aggregate index",
      ],
      ...(orphanReportExists
        ? []
        : [[
            reportOwned ? reportPath : reportTemporary,
            reportIdentity,
            "owned aggregate report",
          ]] as const),
    ] as const) {
      if (identity === null) continue;
      try {
        removeOwnedFile(path, identity, label);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    if (cleanupErrors.length > 0) {
      throw new AggregateError(
        [error, ...cleanupErrors],
        "GATE5: publication failed and safe cleanup refused replaced paths",
      );
    }
    throw error;
  }
}

export interface Gate5TerminalPresentation {
  readonly exitCode: 0;
  readonly stdoutLines: readonly string[];
}

export function formatGate5TerminalPresentation(
  result: VerifiedPhase5Aggregate,
): Gate5TerminalPresentation {
  return {
    exitCode: 0,
    stdoutLines: [
      `GATE5 PROTOCOL ${PHASE5_PROTOCOL}`,
      `GATE5 COMMAND ${PHASE5_GATE_COMMAND}`,
      `GATE5 COMMIT ${result.report.repository.commit}`,
      `GATE5 CRITERIA ${result.report.criteria.length}/${result.report.criteria.length}`,
      `GATE5 REPORT ${result.reportPath}`,
      `GATE5 INDEX ${result.indexPath}`,
      "GATE5 EXIT STATUS: 0",
    ],
  };
}

/** Flagless CLI boundary. */
export function gate5(): 0 {
  const presentation = formatGate5TerminalPresentation(runGate5());
  for (const line of presentation.stdoutLines) console.log(line);
  return presentation.exitCode;
}
