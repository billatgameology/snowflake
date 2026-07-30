// Pin-register recommendation 10 — the completion-time provenance re-check.
//
// The gap it closes is TEMPORAL, not a missing field. `phase6SweepPreflight` already refuses to run on
// a dirty tracked tree, and it checks that exactly once, before the first child starts. The sweep then
// runs unattended for hours. Arm 1 ran while nine commits landed on main and nothing noticed, because
// nothing looked twice. The maker's standing constraint — no evidence run while another session
// commits to main, until this check exists — is what these tests are for.
//
// None of these mutate a tracked file. An earlier control in this session left an attacker mutation in
// `solver-cpu/src/lk-solver.ts` through a crash, and a test that edits real source is one crash away
// from doing the same. The digest is a pure function of file bytes, so a temp tree proves the
// detection and a separate assertion proves the real files are the ones being hashed.

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  PHASE6_SOURCE_ROOTS,
  phase6CompletionDrift,
  phase6ExecutionFingerprint,
  phase6SourceGraph,
  type Phase6ExecutionFingerprint,
} from "../src/phase6-sweep.ts";

const REPO_ROOT = join(import.meta.dirname, "..", "..");

/** A throwaway tree with the same three roots, so digest behaviour is tested without touching source. */
function makeTree(contents: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "phase6-provenance-"));
  for (const dir of PHASE6_SOURCE_ROOTS) mkdirSync(join(root, dir), { recursive: true });
  for (const [path, body] of Object.entries(contents)) writeFileSync(join(root, path), body);
  return root;
}
const trees: string[] = [];
afterAll(() => {
  for (const t of trees) rmSync(t, { recursive: true, force: true });
});
function tree(contents: Record<string, string>): string {
  const root = makeTree(contents);
  trees.push(root);
  return root;
}

describe("the executed source graph", () => {
  it("hashes the files that can actually change what a sweep computes", () => {
    // The failure this guards is a wrong root or a wrong extension filter, which would produce a
    // perfectly stable digest over the wrong files. Each of these is named for a reason: params and
    // libbrecht hold the kinetics, lk-solver the growth loop, and the two harness files decide what
    // is measured and how it is scored.
    const paths = new Set(phase6SourceGraph(REPO_ROOT).files.map((f) => f.path));
    for (const required of [
      "core/src/params.ts",
      "core/src/libbrecht.ts",
      "core/src/lattice.ts",
      "solver-cpu/src/lk-solver.ts",
      "solver-cpu/src/operator.ts",
      "runner/src/phase6-protocol.ts",
      "runner/src/phase6-sweep.ts",
      "runner/src/phase6-crossplatform.ts",
      "runner/src/grow-lk-defaults.ts",
      "runner/src/main.ts",
    ]) {
      expect(paths, `${required} is not in the hashed source graph`).toContain(required);
    }
  });

  it("is repo-relative and posix-separated, so a Windows digest equals a Linux one", () => {
    for (const f of phase6SourceGraph(REPO_ROOT).files) {
      expect(f.path).not.toContain("\\");
      expect(f.path.startsWith("core/") || f.path.startsWith("solver-cpu/") || f.path.startsWith("runner/")).toBe(true);
      expect(f.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("changes on a ONE-BYTE edit to any hashed file", () => {
    const a = tree({ "solver-cpu/src/lk-solver.ts": "export const x = 1;\n" });
    const before = phase6SourceGraph(a).digest;
    writeFileSync(join(a, "solver-cpu/src/lk-solver.ts"), "export const x = 2;\n");
    expect(phase6SourceGraph(a).digest).not.toBe(before);
  });

  it("changes when a file is ADDED or REMOVED, not only when one is edited", () => {
    const a = tree({ "core/src/params.ts": "export const p = 1;\n" });
    const oneFile = phase6SourceGraph(a);
    writeFileSync(join(a, "core/src/extra.ts"), "export const q = 2;\n");
    const twoFiles = phase6SourceGraph(a);
    expect(twoFiles.files.length).toBe(oneFile.files.length + 1);
    expect(twoFiles.digest).not.toBe(oneFile.digest);
    rmSync(join(a, "core/src/extra.ts"));
    expect(phase6SourceGraph(a).digest).toBe(oneFile.digest);
  });

  it("is order-independent — the same files hash the same however the walk finds them", () => {
    const a = tree({ "core/src/a.ts": "1\n", "core/src/b.ts": "2\n" });
    const b = tree({ "core/src/b.ts": "2\n", "core/src/a.ts": "1\n" });
    expect(phase6SourceGraph(a).digest).toBe(phase6SourceGraph(b).digest);
  });

  it("THROWS on a missing source root rather than hashing a smaller set", () => {
    // The dangerous failure: a root that silently disappears shrinks the fingerprint to whatever
    // remains, and two runs over different file sets then compare EQUAL.
    const a = tree({ "core/src/params.ts": "1\n" });
    rmSync(join(a, "solver-cpu/src"), { recursive: true });
    expect(() => phase6SourceGraph(a)).toThrow(/solver-cpu\/src does not exist/);
  });
});

describe("completion-time drift", () => {
  const clean: Phase6ExecutionFingerprint = {
    head: "b70128563630fb7c2aa81239b9df880a274dde89",
    trackedStatus: "",
    treeIsClean: true,
    sourceGraphSha256: "a".repeat(64),
    sourceFileCount: 39,
  };

  it("reports nothing when the repository did not move", () => {
    expect(phase6CompletionDrift(clean, clean)).toEqual([]);
  });

  it("CATCHES the nine-commit hazard: HEAD moving mid-sweep", () => {
    const after = { ...clean, head: "0".repeat(40) };
    expect(phase6CompletionDrift(clean, after).some((d) => d.startsWith("HEAD moved"))).toBe(true);
  });

  it("CATCHES the mid-sweep solver edit, which HEAD alone cannot see", () => {
    // An uncommitted edit at hour three that is reverted before hour six moves neither `head` nor
    // the final `trackedStatus`. Only a digest taken at both ends differs — and here it would not,
    // which is why the graph is hashed at both ends rather than only checked for cleanliness.
    const after = { ...clean, sourceGraphSha256: "b".repeat(64) };
    const drift = phase6CompletionDrift(clean, after);
    expect(drift.some((d) => d.includes("executed source graph changed"))).toBe(true);
    expect(drift.some((d) => d.includes("Earlier points and later points did not run the same code"))).toBe(true);
  });

  it("catches a worktree that became dirty, and one that started dirty", () => {
    const dirtied = { ...clean, trackedStatus: " M solver-cpu/src/lk-solver.ts", treeIsClean: false };
    const drift = phase6CompletionDrift(clean, dirtied);
    expect(drift.some((d) => d.includes("tracked worktree changed"))).toBe(true);
    expect(drift.some((d) => d.includes("dirty at completion"))).toBe(true);
    // And a tree dirty at BOTH ends is still a failure — unchanged is not the same as acceptable.
    expect(phase6CompletionDrift(dirtied, dirtied).some((d) => d.includes("dirty at completion"))).toBe(true);
  });

  it("names every drift at once rather than one per run", () => {
    const after: Phase6ExecutionFingerprint = {
      head: "1".repeat(40),
      trackedStatus: " M core/src/params.ts",
      treeIsClean: false,
      sourceGraphSha256: "c".repeat(64),
      sourceFileCount: 40,
    };
    // An operator who has just spent fifteen hours of compute should be told all of it at once.
    expect(phase6CompletionDrift(clean, after).length).toBe(4);
  });

  it("measures the real repository without throwing", () => {
    const f = phase6ExecutionFingerprint(REPO_ROOT);
    expect(f.head).toMatch(/^[0-9a-f]{40}$/);
    expect(f.sourceGraphSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(f.sourceFileCount).toBeGreaterThan(30);
    expect(f.treeIsClean).toBe(f.trackedStatus === "");
  });
});
