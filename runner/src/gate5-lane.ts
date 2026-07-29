// Phase 5 Windows/D3D12 lane orchestration.
//
// The browser probe writes an untrusted private capture. This module owns repository
// provenance, the immutable commit-bound source snapshot the probe executes from, strict
// capture ingestion, and the only rename into the canonical lane.

import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import {
  canonicalJson,
  parseCanonicalJson,
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  publishPhase5Lane,
  type Phase5FixtureCapture,
  type Phase5LaneCapture,
  type Phase5LaneVerificationHooks,
  type Phase5SourceHash,
  type VerifiedPhase5LaneBundle,
} from "./gate5-evidence.ts";
import {
  evaluatePhase5Lane,
  validatePhase5RawEvidence,
  type Phase5LaneRawEvidence,
} from "./gate5-protocol.ts";
import {
  PHASE5_EVIDENCE_SCHEMA,
  PHASE5_FIXTURES,
  PHASE5_LANE_COMMAND,
  PHASE5_PROTOCOL,
} from "./phase5-protocol.ts";

export const PHASE5_WINDOWS_LANE_DIRECTORY =
  "out/phase5/windows-d3d12";
/**
 * Snapshot parent. It is deliberately outside `out/phase5`, whose entry set the aggregate
 * gate enumerates, so a snapshot can never be mistaken for aggregate evidence.
 */
export const PHASE5_SOURCE_SNAPSHOT_DIRECTORY =
  "out/phase5-source";
export const PHASE5_BROWSER_PROBE_PATH =
  "app/scripts/phase5-gate.mjs";
export const PHASE5_PROBE_CAPTURE_SCHEMA =
  "phase5-browser-capture-v1";

const SOURCE_PATHS = [
  "app",
  "core",
  "package-lock.json",
  "package.json",
  "runner",
  "scripts",
  "solver-cpu",
  "solver-gpu",
  "tsconfig.base.json",
  "tsconfig.json",
  "vitest.config.ts",
] as const;

const CAPTURE_JSON = "capture.json";
const UTF8 = new TextDecoder("utf-8", { fatal: true });
// Five individually bounded production probes run serially on the one physical adapter.
const BROWSER_PROBE_TIMEOUT_MS = 3 * 60 * 60 * 1_000;
const CAPTURE_LABEL = "owned browser capture directory";
const SOURCE_SNAPSHOT_LABEL = "owned Phase 5 source snapshot";
const COMMIT = /^[0-9a-f]{40}$/;

interface OwnedDirectoryIdentity {
  readonly dev: bigint;
  readonly ino: bigint;
  readonly realPath: string;
}

interface OwnedFileIdentity {
  readonly dev: bigint;
  readonly ino: bigint;
  readonly realPath: string;
  readonly byteLength: bigint;
}

export interface Phase5RepositoryIdentity {
  readonly commit: string;
  readonly clean: boolean;
}

export interface Phase5LaneOutcome {
  readonly bundle: VerifiedPhase5LaneBundle;
  readonly sourceHashes: readonly Phase5SourceHash[];
}

/**
 * The immutable, commit-bound tree the browser probe executes from.
 *
 * Hashing a live working tree before and after a multi-hour browser run authenticates
 * nothing: an edit that is restored before the closing hash passes while different bytes
 * executed. A detached worktree pins one commit in a private directory that no editor,
 * formatter, or concurrent session writes, so the published inventory describes exactly the
 * bytes Vite served.
 */
export interface Phase5SourceSnapshot {
  /** Absolute root of the snapshot; the probe runs with this as its repository root. */
  readonly root: string;
  /** The commit the snapshot is pinned to. */
  readonly commit: string;
  /** Re-reads the snapshot's tracked source inventory from disk. */
  readonly readSourceHashes: () => readonly Phase5SourceHash[];
  /** Removes the snapshot. Safe to call repeatedly; the first call owns the removal. */
  readonly release: () => void;
}

export interface RunPhase5LaneOptions {
  readonly repoRoot?: string;
  readonly canonicalDirectory?: string;
  /**
   * Test-only seam. The flagless CLI always launches the registered browser probe.
   * The returned capture remains subject to the complete publisher/verifier path.
   */
  readonly runProbe?: () => Phase5LaneCapture;
  readonly collectRepositoryIdentity?: () => Phase5RepositoryIdentity;
  /**
   * Test-only seam. The flagless CLI always exports a detached commit-bound worktree, runs
   * the probe from it, and publishes its inventory.
   */
  readonly openSourceSnapshot?: (commit: string) => Phase5SourceSnapshot;
  /** Test-only checkpoint-size seam; the CLI never supplies it. */
  readonly verificationHooks?: Phase5LaneVerificationHooks;
}

function lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function directoryIdentity(path: string, label: string): OwnedDirectoryIdentity {
  const metadata = lstatSync(path, { bigint: true });
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new Error(`GATE5-LANE: ${label} is not an independent directory`);
  }
  const realPath = realpathSync.native(path);
  if (resolve(realPath) !== resolve(path)) {
    throw new Error(`GATE5-LANE: ${label} resolves through an alias or junction`);
  }
  return { dev: metadata.dev, ino: metadata.ino, realPath };
}

function assertDirectoryIdentity(
  path: string,
  expected: OwnedDirectoryIdentity,
  label: string,
): void {
  const actual = directoryIdentity(path, label);
  if (
    actual.dev !== expected.dev ||
    actual.ino !== expected.ino ||
    actual.realPath !== expected.realPath
  ) {
    throw new Error(`GATE5-LANE: ${label} identity changed`);
  }
}

function fileIdentity(path: string, label: string): OwnedFileIdentity {
  const metadata = lstatSync(path, { bigint: true });
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.nlink !== 1n
  ) {
    throw new Error(`GATE5-LANE: ${label} is not an independent regular file`);
  }
  const realPath = realpathSync.native(path);
  if (resolve(realPath) !== resolve(path)) {
    throw new Error(`GATE5-LANE: ${label} resolves through an alias`);
  }
  return {
    dev: metadata.dev,
    ino: metadata.ino,
    realPath,
    byteLength: metadata.size,
  };
}

function readStableFile(path: string, label: string): Uint8Array {
  const before = fileIdentity(path, label);
  const bytes = new Uint8Array(readFileSync(path));
  const after = fileIdentity(path, label);
  if (
    before.dev !== after.dev ||
    before.ino !== after.ino ||
    before.realPath !== after.realPath ||
    before.byteLength !== after.byteLength ||
    BigInt(bytes.byteLength) !== before.byteLength
  ) {
    throw new Error(`GATE5-LANE: ${label} identity changed during read`);
  }
  return bytes;
}

/**
 * Recursive removal of a path that was merely checked is a race: the name can be replaced
 * between the check and the delete, and the delete then destroys a tree we never owned.
 *
 * Quarantine first. The rename moves whatever occupies the public name into a private sibling
 * that only this process can name, and the moved tree is re-authenticated there before any
 * recursion. A tree that fails that second check is left in quarantine and reported rather
 * than deleted, which is the same refusal discipline the publisher applies to its staging lane.
 */
function removeOwnedDirectory(
  path: string,
  identity: OwnedDirectoryIdentity,
  label: string,
  beforeRemoval?: (quarantined: string) => void,
): void {
  if (!existsSync(path)) return;
  assertDirectoryIdentity(path, identity, label);
  const quarantined = join(
    dirname(path),
    `.discard-${process.pid}-${randomUUID()}`,
  );
  if (existsSync(quarantined)) {
    throw new Error(`GATE5-LANE: ${label} quarantine path already exists`);
  }
  renameSync(path, quarantined);
  assertDirectoryIdentity(
    quarantined,
    { ...identity, realPath: resolve(quarantined) },
    label,
  );
  beforeRemoval?.(quarantined);
  rmSync(quarantined, { recursive: true, force: true });
}

function gitText(repoRoot: string, args: readonly string[]): string {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function gitStatusText(root: string): string {
  return execFileSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all"],
    {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

export function collectPhase5RepositoryIdentity(
  repoRoot = process.cwd(),
): Phase5RepositoryIdentity {
  const root = resolve(repoRoot);
  const rootMetadata = lstatSync(root);
  if (
    !rootMetadata.isDirectory() ||
    rootMetadata.isSymbolicLink() ||
    resolve(realpathSync.native(root)) !== root
  ) {
    throw new Error("GATE5-LANE: repository root is aliased");
  }
  if (resolve(gitText(root, ["rev-parse", "--show-toplevel"])) !== root) {
    throw new Error("GATE5-LANE: working directory is not the repository root");
  }
  const commit = gitText(root, ["rev-parse", "HEAD"]);
  if (!COMMIT.test(commit)) {
    throw new Error("GATE5-LANE: git did not return a full lowercase commit id");
  }
  return { commit, clean: gitStatusText(root).length === 0 };
}

export function collectPhase5SourceHashes(
  repoRoot = process.cwd(),
): readonly Phase5SourceHash[] {
  const root = resolve(repoRoot);
  const listed = execFileSync(
    "git",
    ["ls-files", "-z", "--", ...SOURCE_PATHS],
    { cwd: root, encoding: "buffer", windowsHide: true },
  );
  const paths = UTF8.decode(listed)
    .split("\0")
    .filter((path) => path.length > 0)
    .sort(lexical);
  if (paths.length === 0 || new Set(paths).size !== paths.length) {
    throw new Error("GATE5-LANE: tracked source inventory is empty or duplicated");
  }
  return paths.map((path) => {
    const absolute = join(root, ...path.split("/"));
    const bytes = readStableFile(absolute, `tracked source ${path}`);
    return { path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
  });
}

/**
 * Installed dependencies are not tracked source and have never been part of this inventory,
 * but the probe's Vite server serves and resolves only under its own root. Republishing the
 * parent's dependency tree inside the snapshot keeps the executed layout identical to the
 * repository's while every authenticated path still comes from the pinned commit.
 */
function linkSnapshotDependencies(repoRoot: string, snapshotRoot: string): void {
  const installed = join(repoRoot, "node_modules");
  if (!existsSync(installed)) return;
  const link = join(snapshotRoot, "node_modules");
  if (lstatSync(link, { throwIfNoEntry: false }) !== undefined) {
    throw new Error("GATE5-LANE: source snapshot already carries a dependency tree");
  }
  symlinkSync(installed, link, "junction");
}

/**
 * Detach the dependency link before any recursive removal so removal can never reach the
 * repository's real dependency tree, whatever a given platform's recursive delete does with
 * a directory link.
 */
function unlinkSnapshotDependencies(snapshotRoot: string): void {
  const link = join(snapshotRoot, "node_modules");
  const metadata = lstatSync(link, { throwIfNoEntry: false });
  if (metadata === undefined) return;
  if (!metadata.isSymbolicLink()) {
    throw new Error(
      "GATE5-LANE: source snapshot dependency link was replaced by a real tree",
    );
  }
  unlinkSync(link);
}

/**
 * Export `commit` into a private detached worktree and hand back the authenticated snapshot.
 * The caller runs the probe from `root` and publishes `readSourceHashes()`, so the recorded
 * inventory is the executed inventory rather than a working tree that can change and be
 * restored around the run.
 */
export function openPhase5SourceSnapshot(
  repoRoot: string,
  commit: string,
): Phase5SourceSnapshot {
  if (!COMMIT.test(commit)) {
    throw new Error("GATE5-LANE: source snapshot needs a full lowercase commit id");
  }
  const root = resolve(repoRoot);
  const parent = join(root, ...PHASE5_SOURCE_SNAPSHOT_DIRECTORY.split("/"));
  mkdirSync(parent, { recursive: true });
  // Authenticate the parent before git creates anything. An aliased ancestor would fail the
  // snapshot's own identity check moments later, and by then the worktree would already be
  // registered and unremovable under this module's refusal rule.
  directoryIdentity(parent, "Phase 5 source snapshot parent");
  const snapshotRoot = join(parent, `.source-${process.pid}-${randomUUID()}`);
  if (existsSync(snapshotRoot)) {
    throw new Error("GATE5-LANE: source snapshot path already exists");
  }
  // Export the committed bytes, not a host-localized rendering of them. Line-ending smudging
  // is a per-host checkout setting, so a default export can differ from a repository that git
  // itself calls clean; the inventory has to be a function of the commit alone.
  gitText(root, [
    "-c",
    "core.autocrlf=false",
    "-c",
    "core.eol=lf",
    "worktree",
    "add",
    "--detach",
    snapshotRoot,
    commit,
  ]);
  // Authenticate before anything else records the path: an identity we cannot establish is
  // never recursively removed, so an unauthenticatable directory is reported and left alone.
  const identity = directoryIdentity(snapshotRoot, SOURCE_SNAPSHOT_LABEL);
  let released = false;
  const release = (): void => {
    if (released) return;
    released = true;
    removeOwnedDirectory(
      snapshotRoot,
      identity,
      SOURCE_SNAPSHOT_LABEL,
      unlinkSnapshotDependencies,
    );
    gitText(root, ["worktree", "prune"]);
  };
  try {
    if (
      gitText(snapshotRoot, ["rev-parse", "HEAD"]) !== commit ||
      resolve(gitText(snapshotRoot, ["rev-parse", "--show-toplevel"])) !== snapshotRoot
    ) {
      throw new Error("GATE5-LANE: source snapshot is not the detached commit worktree");
    }
    if (gitStatusText(snapshotRoot).length !== 0) {
      throw new Error("GATE5-LANE: source snapshot is not clean");
    }
    linkSnapshotDependencies(root, snapshotRoot);
  } catch (error) {
    release();
    throw error;
  }
  return {
    root: snapshotRoot,
    commit,
    readSourceHashes: () => {
      assertDirectoryIdentity(snapshotRoot, identity, SOURCE_SNAPSHOT_LABEL);
      const hashes = collectPhase5SourceHashes(snapshotRoot);
      assertDirectoryIdentity(snapshotRoot, identity, SOURCE_SNAPSHOT_LABEL);
      return hashes;
    },
    release,
  };
}

/**
 * The registered Phase 5 source inventory: the tracked source of one commit, read from a
 * freshly exported snapshot. Both public commands derive it this way so the recorded
 * inventory is reproducible from the commit id alone.
 *
 * A git-clean checkout is not a substitute. Line-ending configuration means a working tree
 * git calls clean can hold bytes its own committed blobs do not, so hashing the checkout
 * records a host artifact and leaves the change-and-restore window open.
 */
export function collectPhase5CommitSourceHashes(
  repoRoot: string,
  commit: string,
  openSourceSnapshot: (commit: string) => Phase5SourceSnapshot =
    (pinned: string) => openPhase5SourceSnapshot(repoRoot, pinned),
): readonly Phase5SourceHash[] {
  const snapshot = openSourceSnapshot(commit);
  try {
    if (snapshot.commit !== commit) {
      throw new Error("GATE5-LANE: source snapshot commit differs from the request");
    }
    return snapshot.readSourceHashes();
  } finally {
    snapshot.release();
  }
}

function plainObject(
  value: unknown,
  label: string,
): Readonly<Record<string, StrictJson>> {
  const snapshot = strictJsonSnapshot(value);
  if (snapshot === null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error(`${label} must be an object`);
  }
  return snapshot as Readonly<Record<string, StrictJson>>;
}

function exactKeys(
  value: Readonly<Record<string, StrictJson>>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort(lexical);
  const wanted = [...expected].sort(lexical);
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    throw new Error(`${label} keys differ`);
  }
}

function captureFixturePath(id: string, name: string): string {
  return `fixtures/${id}/${name}`;
}

function listRegularCaptureFiles(root: string): readonly string[] {
  const result: string[] = [];
  const visit = (directory: string): void => {
    for (const name of readdirSync(directory).sort(lexical)) {
      const absolute = join(directory, name);
      const metadata = lstatSync(absolute);
      if (metadata.isSymbolicLink()) {
        throw new Error(`GATE5-LANE: capture contains a symbolic link: ${absolute}`);
      }
      if (metadata.isDirectory()) visit(absolute);
      else if (metadata.isFile() && metadata.nlink === 1) {
        result.push(relative(root, absolute).split(sep).join("/"));
      } else {
        throw new Error(`GATE5-LANE: capture entry is not an independent regular file: ${absolute}`);
      }
    }
  };
  visit(root);
  return result.sort(lexical);
}

function captureJson(root: string, path: string, label: string): StrictJson {
  return parseCanonicalJson(
    readStableFile(join(root, ...path.split("/")), label),
    label,
  );
}

function readPhase5ProbeCapture(
  captureDirectory: string,
  stdout: Uint8Array,
  stderr: Uint8Array,
): Phase5LaneCapture {
  const root = resolve(captureDirectory);
  const rootIdentity = directoryIdentity(root, "browser capture directory");
  const blocking = PHASE5_FIXTURES.filter((fixture) => fixture.blocking);
  const expected = [
    CAPTURE_JSON,
    ...blocking.flatMap((fixture) => [
      captureFixturePath(fixture.id, "cpu-reference.ckpt"),
      captureFixturePath(fixture.id, "gpu-export.ckpt"),
      captureFixturePath(fixture.id, "comparison.json"),
      captureFixturePath(fixture.id, "events.json"),
      captureFixturePath(fixture.id, "timing.json"),
      captureFixturePath(fixture.id, "readback.json"),
    ]),
  ].sort(lexical);
  const actual = listRegularCaptureFiles(root);
  assertDirectoryIdentity(root, rootIdentity, "browser capture directory");
  if (
    actual.length !== expected.length ||
    actual.some((path, index) => path !== expected[index])
  ) {
    throw new Error("GATE5-LANE: browser capture file set differs from the contract");
  }

  const header = plainObject(
    captureJson(root, CAPTURE_JSON, "Phase 5 browser capture"),
    "Phase 5 browser capture",
  );
  exactKeys(
    header,
    ["schema", "startedAtUtc", "completedAtUtc", "raw"],
    "Phase 5 browser capture",
  );
  if (
    header.schema !== PHASE5_PROBE_CAPTURE_SCHEMA ||
    typeof header.startedAtUtc !== "string" ||
    typeof header.completedAtUtc !== "string"
  ) {
    throw new Error("GATE5-LANE: browser capture identity differs");
  }
  const raw = validatePhase5RawEvidence(
    header.raw,
  ) as Phase5LaneRawEvidence;
  // Fail before copying potentially large checkpoints when raw evidence is incomplete.
  if (raw.publicationVerified) {
    throw new Error(
      "GATE5-LANE: browser capture cannot preclaim publisher-owned verification",
    );
  }
  const prepublicationVerdict = evaluatePhase5Lane({
    ...raw,
    publicationVerified: true,
  });
  if (!prepublicationVerdict.gatePass) {
    throw new Error(
      "GATE5-LANE: browser evidence fails " +
        prepublicationVerdict.criteria
          .filter((criterion) => !criterion.pass)
          .map((criterion) => criterion.id)
          .join(", "),
    );
  }
  const fixtures: Phase5FixtureCapture[] = blocking.map((fixture) => ({
    id: fixture.id,
    config: { schema: "phase5-fixture-config-v1", fixture },
    cpuReferenceCheckpoint: new Uint8Array(
      readStableFile(
        join(root, ...captureFixturePath(fixture.id, "cpu-reference.ckpt").split("/")),
        `${fixture.id} CPU checkpoint`,
      ),
    ),
    gpuExportCheckpoint: new Uint8Array(
      readStableFile(
        join(root, ...captureFixturePath(fixture.id, "gpu-export.ckpt").split("/")),
        `${fixture.id} GPU checkpoint`,
      ),
    ),
    comparison: captureJson(
      root,
      captureFixturePath(fixture.id, "comparison.json"),
      `${fixture.id} comparison`,
    ),
    events: captureJson(
      root,
      captureFixturePath(fixture.id, "events.json"),
      `${fixture.id} events`,
    ),
    timing: captureJson(
      root,
      captureFixturePath(fixture.id, "timing.json"),
      `${fixture.id} timing`,
    ),
    readback: captureJson(
      root,
      captureFixturePath(fixture.id, "readback.json"),
      `${fixture.id} readback`,
    ),
  }));
  assertDirectoryIdentity(root, rootIdentity, "browser capture directory");
  return {
    startedAtUtc: header.startedAtUtc,
    completedAtUtc: header.completedAtUtc,
    raw,
    fixtures,
    stdout: stdout.slice(),
    stderr: stderr.slice(),
    exitStatus: 0,
  };
}

/**
 * `sourceRoot` is the immutable snapshot, never the live working tree: the probe resolves its
 * own repository root from its own location, so launching the snapshot's copy roots Vite,
 * every WP probe, and the probe's own provenance query inside the pinned commit. The capture
 * directory stays beside the canonical lane because it is runner-owned output, not source.
 */
function runBrowserProbe(
  sourceRoot: string,
  canonicalDirectory: string,
): Phase5LaneCapture {
  const script = resolve(sourceRoot, PHASE5_BROWSER_PROBE_PATH);
  if (!existsSync(script)) {
    throw new Error(
      `GATE5-LANE: registered browser probe is missing: ${PHASE5_BROWSER_PROBE_PATH}`,
    );
  }
  const parent = dirname(canonicalDirectory);
  mkdirSync(parent, { recursive: true });
  const captureDirectory = join(
    parent,
    `.windows-d3d12.capture-${process.pid}-${randomUUID()}`,
  );
  mkdirSync(captureDirectory, { recursive: false });
  const captureIdentity = directoryIdentity(captureDirectory, CAPTURE_LABEL);
  try {
    const child = spawnSync(process.execPath, [script, captureDirectory], {
      cwd: sourceRoot,
      encoding: "buffer",
      windowsHide: true,
      maxBuffer: 64 * 1024 * 1024,
      timeout: BROWSER_PROBE_TIMEOUT_MS,
      killSignal: "SIGKILL",
    });
    assertDirectoryIdentity(captureDirectory, captureIdentity, CAPTURE_LABEL);
    const stdout = new Uint8Array(child.stdout ?? new Uint8Array());
    const stderr = new Uint8Array(child.stderr ?? new Uint8Array());
    if (child.error !== undefined) throw child.error;
    if (child.status !== 0) {
      throw new Error(
        `GATE5-LANE: browser probe exited ${String(child.status)}\n` +
          UTF8.decode(stderr),
      );
    }
    return readPhase5ProbeCapture(captureDirectory, stdout, stderr);
  } finally {
    removeOwnedDirectory(captureDirectory, captureIdentity, CAPTURE_LABEL);
  }
}

function sameIdentity(
  left: Phase5RepositoryIdentity,
  right: Phase5RepositoryIdentity,
): boolean {
  return left.commit === right.commit && left.clean === right.clean;
}

export function runPhase5Lane(
  options: RunPhase5LaneOptions = {},
): Phase5LaneOutcome {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const canonicalDirectory = resolve(
    repoRoot,
    options.canonicalDirectory ?? PHASE5_WINDOWS_LANE_DIRECTORY,
  );
  if (existsSync(canonicalDirectory)) {
    throw new Error(`GATE5-LANE: canonical lane already exists: ${canonicalDirectory}`);
  }
  const identity = options.collectRepositoryIdentity?.() ??
    collectPhase5RepositoryIdentity(repoRoot);
  if (!identity.clean) {
    throw new Error("GATE5-LANE: repository must be clean before canonical capture");
  }
  const snapshot = (options.openSourceSnapshot ??
    ((commit: string) => openPhase5SourceSnapshot(repoRoot, commit)))(identity.commit);
  try {
    if (snapshot.commit !== identity.commit) {
      throw new Error("GATE5-LANE: source snapshot commit differs from the runner snapshot");
    }
    // The published inventory is the snapshot's, so it describes the bytes that executed.
    const sourceHashes = [...snapshot.readSourceHashes()];
    const published = canonicalJson(sourceHashes);
    const capture = options.runProbe?.() ??
      runBrowserProbe(snapshot.root, canonicalDirectory);
    if (
      capture.raw.repository.commit !== identity.commit ||
      !capture.raw.repository.clean
    ) {
      throw new Error("GATE5-LANE: browser provenance differs from the runner snapshot");
    }
    const readSourceState = (): {
      readonly identity: Phase5RepositoryIdentity;
      readonly snapshotHashes: string;
    } => ({
      identity: options.collectRepositoryIdentity?.() ??
        collectPhase5RepositoryIdentity(repoRoot),
      snapshotHashes: canonicalJson([...snapshot.readSourceHashes()]),
    });
    const after = readSourceState();
    if (
      !sameIdentity(identity, after.identity) ||
      !after.identity.clean ||
      after.snapshotHashes !== published
    ) {
      throw new Error("GATE5-LANE: repository changed during browser capture");
    }
    const assertPublicationSourceIdentity = (): void => {
      const publication = readSourceState();
      if (
        !sameIdentity(identity, publication.identity) ||
        !publication.identity.clean ||
        publication.snapshotHashes !== published
      ) {
        throw new Error("GATE5-LANE: repository changed during lane publication");
      }
    };
    const bundle = publishPhase5Lane({
      canonicalDirectory,
      capture,
      sourceHashes,
      verificationHooks: options.verificationHooks,
      hooks: { afterRename: assertPublicationSourceIdentity },
    });
    return { bundle, sourceHashes };
  } finally {
    snapshot.release();
  }
}

export interface Phase5LaneTerminalPresentation {
  readonly exitCode: 0;
  readonly stdoutLines: readonly string[];
}

export function formatPhase5LaneTerminalPresentation(
  outcome: Phase5LaneOutcome,
): Phase5LaneTerminalPresentation {
  return {
    exitCode: 0,
    stdoutLines: [
      `GATE5-LANE PROTOCOL ${PHASE5_PROTOCOL}`,
      `GATE5-LANE COMMAND ${PHASE5_LANE_COMMAND}`,
      `GATE5-LANE COMMIT ${outcome.bundle.manifest.repository.commit}`,
      `GATE5-LANE BACKEND ${outcome.bundle.manifest.adapter.backend}`,
      `GATE5-LANE SOURCE-FILES ${outcome.sourceHashes.length}`,
      `GATE5-LANE PUBLISHED ${outcome.bundle.directory}`,
      `GATE5-LANE EXIT STATUS: 0`,
    ],
  };
}

/** Flagless CLI boundary. */
export function gate5Lane(): 0 {
  const presentation = formatPhase5LaneTerminalPresentation(runPhase5Lane());
  for (const line of presentation.stdoutLines) console.log(line);
  return presentation.exitCode;
}
