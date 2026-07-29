import {
  existsSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import {
  GATE5_ARTIFACT_INDEX_PATH,
  GATE5_REPORT_PATH,
  runGate5,
  verifyGate5Aggregate,
} from "../src/gate5-aggregate.ts";
import {
  collectPhase5CommitSourceHashes,
  collectPhase5SourceHashes,
  openPhase5SourceSnapshot,
  runPhase5Lane,
  PHASE5_SOURCE_SNAPSHOT_DIRECTORY,
  type Phase5RepositoryIdentity,
  type Phase5SourceSnapshot,
} from "../src/gate5-lane.ts";
import {
  publishPhase5Lane,
  type Phase5SourceHash,
} from "../src/gate5-evidence.ts";
import { canonicalJson } from "../src/gate4-evidence.ts";
import {
  TEST_PHASE5_CHECKPOINT_HOOKS,
  TEST_PHASE5_COMMIT,
  TEST_PHASE5_SOURCE_HASHES,
  passingPhase5Capture,
} from "./phase5-test-fixtures.ts";

const roots: string[] = [];
const identity: Phase5RepositoryIdentity = {
  commit: TEST_PHASE5_COMMIT,
  clean: true,
};

/** Tracked content for the throwaway repositories that exercise the real snapshot export. */
const SNAPSHOT_FIXTURE_FILES: Readonly<Record<string, string>> = {
  ".gitignore": "node_modules/\nout/\n",
  "package.json": "{\n  \"name\": \"phase5-snapshot-fixture\"\n}\n",
  "core/src/index.ts": "export const phase5SnapshotFixture = 1;\n",
  "runner/src/main.ts": "export const phase5SnapshotRunner = 1;\n",
};

interface SnapshotSeam {
  readonly open: (commit: string) => Phase5SourceSnapshot;
  readonly root: string;
  readonly released: () => number;
}

function temporaryRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "vcc-gate5-runner-"));
  roots.push(root);
  return root;
}

function gitIn(root: string, args: readonly string[]): string {
  const child = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });
  if (child.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${child.stderr}`);
  }
  return child.stdout.trim();
}

function temporaryGitRepo(): string {
  const root = realpathSync.native(temporaryRepo());
  gitIn(root, ["-c", "init.defaultBranch=main", "init", "--quiet"]);
  gitIn(root, ["config", "user.name", "Phase 5 Fixture"]);
  gitIn(root, ["config", "user.email", "phase5@example.invalid"]);
  gitIn(root, ["config", "commit.gpgsign", "false"]);
  gitIn(root, ["config", "core.autocrlf", "false"]);
  gitIn(root, ["config", "core.hooksPath", join(root, "absent-hooks")]);
  for (const [path, contents] of Object.entries(SNAPSHOT_FIXTURE_FILES)) {
    const absolute = join(root, ...path.split("/"));
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, contents);
  }
  gitIn(root, ["add", "--all"]);
  gitIn(root, ["commit", "--quiet", "--message", "phase5 source snapshot fixture"]);
  return root;
}

/** Test-only stand-in for the detached worktree; the real export has its own suite below. */
function snapshotSeam(
  repoRoot: string,
  readSourceHashes: () => readonly Phase5SourceHash[] =
    () => TEST_PHASE5_SOURCE_HASHES,
): SnapshotSeam {
  const root = join(repoRoot, "source-snapshot");
  mkdirSync(root, { recursive: true });
  let released = 0;
  return {
    root,
    released: () => released,
    open: (commit: string) => ({
      root,
      commit,
      readSourceHashes,
      release: () => {
        released += 1;
      },
    }),
  };
}

function lanePath(root: string): string {
  return join(root, "out", "phase5", "windows-d3d12");
}

function reportPath(root: string): string {
  return join(root, ...GATE5_REPORT_PATH.split("/"));
}

function indexPath(root: string): string {
  return join(root, ...GATE5_ARTIFACT_INDEX_PATH.split("/"));
}

function publishLane(root: string): void {
  publishPhase5Lane({
    canonicalDirectory: lanePath(root),
    capture: passingPhase5Capture(),
    sourceHashes: TEST_PHASE5_SOURCE_HASHES,
    attemptId: "aggregate-fixture",
    verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
  });
}

function aggregateOptions(root: string) {
  return {
    repoRoot: root,
    collectRepositoryIdentity: () => identity,
    collectSourceHashes: () => TEST_PHASE5_SOURCE_HASHES,
    laneVerificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
  } as const;
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    if (existsSync(root)) rmSync(root, { recursive: true, force: true });
  }
});

describe("Phase 5 lane runner", () => {
  it("publishes only after stable clean provenance and source snapshots", () => {
    const root = temporaryRepo();
    const seam = snapshotSeam(root);
    const result = runPhase5Lane({
      repoRoot: root,
      runProbe: passingPhase5Capture,
      collectRepositoryIdentity: () => identity,
      openSourceSnapshot: seam.open,
      verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
    });
    expect(result.bundle.report.gatePass).toBe(true);
    expect(result.bundle.manifest.repository).toEqual(identity);
    expect(canonicalJson([...result.bundle.manifest.sourceHashes])).toBe(
      canonicalJson([...TEST_PHASE5_SOURCE_HASHES]),
    );
    expect(seam.released()).toBe(1);
  });

  it("fails closed before probing a dirty repository", () => {
    const root = temporaryRepo();
    const seam = snapshotSeam(root);
    let probed = false;
    expect(() =>
      runPhase5Lane({
        repoRoot: root,
        runProbe: () => {
          probed = true;
          return passingPhase5Capture();
        },
        collectRepositoryIdentity: () => ({ ...identity, clean: false }),
        openSourceSnapshot: seam.open,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/must be clean/);
    expect(probed).toBe(false);
    expect(seam.released()).toBe(0);
    expect(existsSync(lanePath(root))).toBe(false);
  });

  it("rejects repository drift between capture and publication", () => {
    const root = temporaryRepo();
    const seam = snapshotSeam(root);
    let calls = 0;
    expect(() =>
      runPhase5Lane({
        repoRoot: root,
        runProbe: passingPhase5Capture,
        collectRepositoryIdentity: () => {
          calls += 1;
          return calls === 1 ? identity : {
            commit: "2".repeat(40),
            clean: true,
          };
        },
        openSourceSnapshot: seam.open,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/changed during browser capture/);
    expect(seam.released()).toBe(1);
    expect(existsSync(lanePath(root))).toBe(false);
  });

  it("removes the canonical lane when source identity drifts after rename", () => {
    const root = temporaryRepo();
    const seam = snapshotSeam(root);
    let identityCalls = 0;
    expect(() =>
      runPhase5Lane({
        repoRoot: root,
        runProbe: passingPhase5Capture,
        collectRepositoryIdentity: () => {
          identityCalls += 1;
          return identityCalls < 3
            ? identity
            : { commit: "4".repeat(40), clean: true };
        },
        openSourceSnapshot: seam.open,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/changed during lane publication/);
    expect(identityCalls).toBe(3);
    expect(seam.released()).toBe(1);
    expect(existsSync(lanePath(root))).toBe(false);
  });

  it("runs the probe from the snapshot root, never the live working tree", () => {
    const root = temporaryRepo();
    const seam = snapshotSeam(root);
    let observed: string | null = null;
    const result = runPhase5Lane({
      repoRoot: root,
      runProbe: () => {
        observed = seam.root;
        return passingPhase5Capture();
      },
      collectRepositoryIdentity: () => identity,
      openSourceSnapshot: (commit) => {
        expect(commit).toBe(identity.commit);
        return seam.open(commit);
      },
      verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
    });
    expect(observed).toBe(seam.root);
    expect(result.bundle.report.gatePass).toBe(true);
  });

  it("rejects a source snapshot pinned to another commit", () => {
    const root = temporaryRepo();
    const seam = snapshotSeam(root);
    let probed = false;
    expect(() =>
      runPhase5Lane({
        repoRoot: root,
        runProbe: () => {
          probed = true;
          return passingPhase5Capture();
        },
        collectRepositoryIdentity: () => identity,
        openSourceSnapshot: () => ({
          ...seam.open("5".repeat(40)),
          commit: "5".repeat(40),
        }),
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/source snapshot commit differs/);
    expect(probed).toBe(false);
    expect(existsSync(lanePath(root))).toBe(false);
  });

  it("rejects executed-source drift even when the working tree is restored", () => {
    const root = temporaryRepo();
    // The exact reviewer exploit. Nothing the live tree does is consulted for the inventory,
    // so only the executed snapshot's own re-read can record the change.
    let reads = 0;
    let released = 0;
    const snapshotRoot = join(root, "source-snapshot");
    mkdirSync(snapshotRoot, { recursive: true });
    expect(() =>
      runPhase5Lane({
        repoRoot: root,
        runProbe: passingPhase5Capture,
        collectRepositoryIdentity: () => identity,
        openSourceSnapshot: (commit) => ({
          root: snapshotRoot,
          commit,
          readSourceHashes: () => {
            reads += 1;
            return reads === 1 ? TEST_PHASE5_SOURCE_HASHES : [{
              ...TEST_PHASE5_SOURCE_HASHES[0],
              sha256: "9".repeat(64),
            }];
          },
          release: () => {
            released += 1;
          },
        }),
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/changed during browser capture/);
    expect(reads).toBe(2);
    expect(released).toBe(1);
    expect(existsSync(lanePath(root))).toBe(false);
  });
});

describe("Phase 5 immutable source snapshot", () => {
  it("exports a detached commit-bound worktree that live edits cannot change", () => {
    const repo = temporaryGitRepo();
    const commit = gitIn(repo, ["rev-parse", "HEAD"]);
    const snapshot = openPhase5SourceSnapshot(repo, commit);
    const snapshotRoot = snapshot.root;
    try {
      expect(dirname(snapshotRoot)).toBe(
        join(repo, ...PHASE5_SOURCE_SNAPSHOT_DIRECTORY.split("/")),
      );
      expect(snapshot.commit).toBe(commit);
      expect(gitIn(snapshotRoot, ["rev-parse", "HEAD"])).toBe(commit);
      expect(
        gitIn(snapshotRoot, ["status", "--porcelain=v1", "--untracked-files=all"]),
      ).toBe("");
      const executed = canonicalJson([...snapshot.readSourceHashes()]);
      expect(executed).toBe(canonicalJson([...collectPhase5SourceHashes(repo)]));
      const live = join(repo, "core", "src", "index.ts");
      const original = readFileSync(live, "utf8");
      writeFileSync(live, "export const phase5SnapshotFixture = 2;\n");
      expect(readFileSync(join(snapshotRoot, "core", "src", "index.ts"), "utf8"))
        .toBe(original);
      expect(canonicalJson([...snapshot.readSourceHashes()])).toBe(executed);
      expect(canonicalJson([...collectPhase5SourceHashes(repo)])).not.toBe(executed);
      // Restoring the live tree is exactly the race the reviewer named; it never reaches
      // the snapshot, so it can neither hide nor forge the executed inventory.
      writeFileSync(live, original);
      expect(canonicalJson([...snapshot.readSourceHashes()])).toBe(executed);
    } finally {
      snapshot.release();
    }
    expect(existsSync(snapshotRoot)).toBe(false);
    expect(gitIn(repo, ["worktree", "list"])).not.toContain(basename(snapshotRoot));
  });

  it("derives the registered inventory from the commit, not from the checkout", () => {
    const repo = temporaryGitRepo();
    const commit = gitIn(repo, ["rev-parse", "HEAD"]);
    const committed = canonicalJson([
      ...collectPhase5CommitSourceHashes(repo, commit),
    ]);
    const live = join(repo, "core", "src", "index.ts");
    const original = readFileSync(live, "utf8");
    writeFileSync(live, "export const phase5SnapshotFixture = 3;\n");
    expect(canonicalJson([...collectPhase5CommitSourceHashes(repo, commit)]))
      .toBe(committed);
    expect(canonicalJson([...collectPhase5SourceHashes(repo)])).not.toBe(committed);
    writeFileSync(live, original);
    expect(canonicalJson([...collectPhase5CommitSourceHashes(repo, commit)]))
      .toBe(committed);
    expect(
      existsSync(join(repo, ...PHASE5_SOURCE_SNAPSHOT_DIRECTORY.split("/"))),
    ).toBe(true);
    expect(
      readdirSync(join(repo, ...PHASE5_SOURCE_SNAPSHOT_DIRECTORY.split("/"))),
    ).toEqual([]);
  });

  it("releases the snapshot when the inventory read fails", () => {
    const repo = temporaryGitRepo();
    let released = 0;
    let snapshotRoot: string | null = null;
    expect(() =>
      collectPhase5CommitSourceHashes(repo, gitIn(repo, ["rev-parse", "HEAD"]), (
        commit,
      ) => {
        const snapshot = openPhase5SourceSnapshot(repo, commit);
        snapshotRoot = snapshot.root;
        return {
          ...snapshot,
          readSourceHashes: () => {
            throw new Error("inventory read refused");
          },
          release: () => {
            released += 1;
            snapshot.release();
          },
        };
      }),
    ).toThrow(/inventory read refused/);
    expect(released).toBe(1);
    expect(snapshotRoot).not.toBeNull();
    expect(existsSync(snapshotRoot ?? "")).toBe(false);
  });

  it("refuses a snapshot request without a full commit id", () => {
    const repo = temporaryGitRepo();
    expect(() => openPhase5SourceSnapshot(repo, "HEAD")).toThrow(
      /full lowercase commit id/,
    );
    expect(existsSync(join(repo, ...PHASE5_SOURCE_SNAPSHOT_DIRECTORY.split("/"))))
      .toBe(false);
  });

  it("removes the snapshot without descending into the installed dependencies", () => {
    const repo = temporaryGitRepo();
    const installed = join(repo, "node_modules", "phase5-fixture-dependency");
    mkdirSync(installed, { recursive: true });
    writeFileSync(join(installed, "keep.txt"), "keep");
    const snapshot = openPhase5SourceSnapshot(repo, gitIn(repo, ["rev-parse", "HEAD"]));
    const linked = join(snapshot.root, "node_modules");
    expect(lstatSync(linked).isSymbolicLink()).toBe(true);
    expect(
      readFileSync(join(linked, "phase5-fixture-dependency", "keep.txt"), "utf8"),
    ).toBe("keep");
    snapshot.release();
    expect(existsSync(snapshot.root)).toBe(false);
    expect(readFileSync(join(installed, "keep.txt"), "utf8")).toBe("keep");
    snapshot.release();
    expect(readFileSync(join(installed, "keep.txt"), "utf8")).toBe("keep");
  });

  it("quarantines the snapshot before any recursive removal", () => {
    const repo = temporaryGitRepo();
    const snapshot = openPhase5SourceSnapshot(repo, gitIn(repo, ["rev-parse", "HEAD"]));
    const parent = dirname(snapshot.root);
    // No dependency tree exists in this fixture, so nothing was linked. A real directory at
    // that name is the guard's refusal case, and it stops removal after the quarantine
    // rename — which is only observable if the rename happens before the recursion.
    mkdirSync(join(snapshot.root, "node_modules"));
    expect(() => snapshot.release()).toThrow(/dependency link was replaced/);
    expect(existsSync(snapshot.root)).toBe(false);
    const quarantined = readdirSync(parent).filter(
      (name) => name.startsWith(".discard-"),
    );
    expect(quarantined).toHaveLength(1);
    expect(existsSync(join(parent, quarantined[0], "node_modules"))).toBe(true);
    expect(existsSync(join(parent, quarantined[0], "package.json"))).toBe(true);
  });

  it("refuses to delete a replacement that appears at the private snapshot path", () => {
    const repo = temporaryGitRepo();
    const snapshot = openPhase5SourceSnapshot(repo, gitIn(repo, ["rev-parse", "HEAD"]));
    const moved = join(repo, "moved-owned-snapshot");
    renameSync(snapshot.root, moved);
    mkdirSync(snapshot.root);
    writeFileSync(join(snapshot.root, "replacement-owner.txt"), "keep");
    expect(() => snapshot.release()).toThrow(/identity changed/);
    expect(readFileSync(join(snapshot.root, "replacement-owner.txt"), "utf8"))
      .toBe("keep");
    expect(existsSync(join(moved, "package.json"))).toBe(true);
  });
});

describe("Phase 5 aggregate gate", () => {
  it("reopens the lane, re-derives all criteria, and commits the index last", () => {
    const root = temporaryRepo();
    publishLane(root);
    const result = runGate5(aggregateOptions(root));
    expect(result.report.gatePass).toBe(true);
    expect(result.report.criteria).toHaveLength(16);
    expect(result.index.artifacts[0]).toEqual(result.index.report);
    expect(
      verifyGate5Aggregate(aggregateOptions(root)).report.repository.commit,
    ).toBe(TEST_PHASE5_COMMIT);
  });

  it("re-derives the lane's commit inventory with no seams at all", () => {
    // Full unseamed path: real repository identity and a real snapshot export on both the
    // publishing and the reopening side. A checkout-derived inventory cannot survive this,
    // because a git-clean checkout is not byte-equal to its own commit on every host.
    const repo = temporaryGitRepo();
    const commit = gitIn(repo, ["rev-parse", "HEAD"]);
    const capture = passingPhase5Capture();
    publishPhase5Lane({
      canonicalDirectory: lanePath(repo),
      capture: {
        ...capture,
        raw: { ...capture.raw, repository: { commit, clean: true } },
      },
      sourceHashes: collectPhase5CommitSourceHashes(repo, commit),
      attemptId: "commit-derived",
      verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
    });
    const result = runGate5({
      repoRoot: repo,
      laneVerificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
    });
    expect(result.report.gatePass).toBe(true);
    expect(result.report.repository).toEqual({ commit, clean: true });
    expect(
      canonicalJson([...result.lane.manifest.sourceHashes]),
    ).toBe(canonicalJson([...collectPhase5CommitSourceHashes(repo, commit)]));
    expect(
      verifyGate5Aggregate({
        repoRoot: repo,
        laneVerificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }).report.gatePass,
    ).toBe(true);
  });

  it("rejects a lane from another commit", () => {
    const root = temporaryRepo();
    publishLane(root);
    expect(() =>
      runGate5({
        ...aggregateOptions(root),
        collectRepositoryIdentity: () => ({
          commit: "3".repeat(40),
          clean: true,
        }),
      }),
    ).toThrow(/repository identity differs/);
    expect(existsSync(reportPath(root))).toBe(false);
    expect(existsSync(indexPath(root))).toBe(false);
  });

  it("rejects source drift before aggregate publication", () => {
    const root = temporaryRepo();
    publishLane(root);
    expect(() =>
      runGate5({
        ...aggregateOptions(root),
        collectSourceHashes: () => [{
          ...TEST_PHASE5_SOURCE_HASHES[0],
          sha256: "0".repeat(64),
        }],
      }),
    ).toThrow(/source hashes differ/);
    expect(existsSync(reportPath(root))).toBe(false);
  });

  it("detects post-publication lane mutation and removes only its aggregate files", () => {
    const root = temporaryRepo();
    publishLane(root);
    expect(() =>
      runGate5({
        ...aggregateOptions(root),
        afterPublish: ({ laneDirectory }) => {
          writeFileSync(join(laneDirectory, "stdout.log"), "mutated\n");
        },
      }),
    ).toThrow();
    expect(existsSync(reportPath(root))).toBe(false);
    expect(existsSync(indexPath(root))).toBe(false);
    expect(existsSync(lanePath(root))).toBe(true);
  });

  it("refuses to delete a replacement aggregate report during failed cleanup", () => {
    const root = temporaryRepo();
    publishLane(root);
    const movedReport = join(root, "moved-owned-gate5-report.json");
    expect(() =>
      runGate5({
        ...aggregateOptions(root),
        afterPublish: ({ reportPath: publishedReportPath }) => {
          renameSync(publishedReportPath, movedReport);
          writeFileSync(publishedReportPath, "replacement-owner\n");
        },
      }),
    ).toThrow(/safe cleanup refused replaced paths/);
    expect(readFileSync(reportPath(root), "utf8")).toBe("replacement-owner\n");
    expect(existsSync(movedReport)).toBe(true);
    expect(existsSync(indexPath(root))).toBe(false);
  });

  it("recovers an authenticated orphan report after an interrupted publication", () => {
    const root = temporaryRepo();
    publishLane(root);
    runGate5(aggregateOptions(root));
    const reportBefore = readFileSync(reportPath(root));
    rmSync(indexPath(root));
    const recovered = runGate5(aggregateOptions(root));
    expect(recovered.report.gatePass).toBe(true);
    expect(readFileSync(reportPath(root))).toEqual(reportBefore);
    expect(existsSync(indexPath(root))).toBe(true);
  });

  it("rejects aggregate report mutation against its commit marker", () => {
    const root = temporaryRepo();
    publishLane(root);
    runGate5(aggregateOptions(root));
    writeFileSync(reportPath(root), `${readFileSync(reportPath(root), "utf8")} `);
    expect(() => verifyGate5Aggregate(aggregateOptions(root))).toThrow();
  });

  it("rejects hard-linked aggregate artifacts", () => {
    const root = temporaryRepo();
    publishLane(root);
    runGate5(aggregateOptions(root));
    linkSync(reportPath(root), join(root, "aggregate-report-alias.json"));
    expect(() => verifyGate5Aggregate(aggregateOptions(root))).toThrow(
      /independent regular file/,
    );
  });

  it("never overwrites completed aggregate evidence", () => {
    const root = temporaryRepo();
    publishLane(root);
    runGate5(aggregateOptions(root));
    const before = readFileSync(reportPath(root));
    expect(() => runGate5(aggregateOptions(root))).toThrow(/already exists/);
    expect(readFileSync(reportPath(root))).toEqual(before);
  });

  it("rejects unindexed aggregate-directory entries", () => {
    const root = temporaryRepo();
    publishLane(root);
    writeFileSync(join(root, "out", "phase5", "stray.txt"), "stray");
    expect(() => runGate5(aggregateOptions(root))).toThrow(/unindexed entries/);
  });

  it("makes both public commands flagless at the CLI boundary", () => {
    for (const command of ["gate5-lane", "gate5"]) {
      const child = spawnSync(
        process.execPath,
        ["runner/src/main.ts", command, "--not-allowed"],
        {
          cwd: process.cwd(),
          encoding: "utf8",
          windowsHide: true,
        },
      );
      expect(child.status).toBe(2);
      expect(child.stderr).toContain(`${command} takes no flags`);
      expect(child.stderr).toContain("EXIT STATUS: 2");
    }
  });

  it("ships the real browser entrypoint with a strict private-directory contract", () => {
    const source = readFileSync(
      join(process.cwd(), "app", "scripts", "phase5-gate.mjs"),
      "utf8",
    );
    for (const probe of [
      "phase5-wp1.mjs",
      "phase5-wp2.mjs",
      "phase5-wp3.mjs",
      "phase5-wp4.mjs",
      "phase5-performance.mjs",
    ]) {
      expect(source).toContain(`runJsonProbe("${probe}")`);
    }
    expect(source).toContain("derivePhase5CheckpointVerification");
    expect(source).not.toContain("__vccPhase5GateHarness");
    const child = spawnSync(
      process.execPath,
      ["app/scripts/phase5-gate.mjs"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        windowsHide: true,
      },
    );
    expect(child.status).toBe(1);
    expect(child.stderr).toContain(
      "requires exactly one private capture-directory argument",
    );
  });
});
