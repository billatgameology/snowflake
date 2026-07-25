import {
  existsSync,
  linkSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import {
  GATE5_ARTIFACT_INDEX_PATH,
  GATE5_REPORT_PATH,
  runGate5,
  verifyGate5Aggregate,
} from "../src/gate5-aggregate.ts";
import {
  runPhase5Lane,
  type Phase5RepositoryIdentity,
} from "../src/gate5-lane.ts";
import { publishPhase5Lane } from "../src/gate5-evidence.ts";
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

function temporaryRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "vcc-gate5-runner-"));
  roots.push(root);
  return root;
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
    const result = runPhase5Lane({
      repoRoot: root,
      runProbe: passingPhase5Capture,
      collectRepositoryIdentity: () => identity,
      collectSourceHashes: () => TEST_PHASE5_SOURCE_HASHES,
      verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
    });
    expect(result.bundle.report.gatePass).toBe(true);
    expect(result.bundle.manifest.repository).toEqual(identity);
  });

  it("fails closed before probing a dirty repository", () => {
    const root = temporaryRepo();
    let probed = false;
    expect(() =>
      runPhase5Lane({
        repoRoot: root,
        runProbe: () => {
          probed = true;
          return passingPhase5Capture();
        },
        collectRepositoryIdentity: () => ({ ...identity, clean: false }),
        collectSourceHashes: () => TEST_PHASE5_SOURCE_HASHES,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/must be clean/);
    expect(probed).toBe(false);
    expect(existsSync(lanePath(root))).toBe(false);
  });

  it("rejects repository drift between capture and publication", () => {
    const root = temporaryRepo();
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
        collectSourceHashes: () => TEST_PHASE5_SOURCE_HASHES,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/changed during browser capture/);
    expect(existsSync(lanePath(root))).toBe(false);
  });

  it("removes the canonical lane when source identity drifts after rename", () => {
    const root = temporaryRepo();
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
        collectSourceHashes: () => TEST_PHASE5_SOURCE_HASHES,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/changed during lane publication/);
    expect(identityCalls).toBe(3);
    expect(existsSync(lanePath(root))).toBe(false);
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
