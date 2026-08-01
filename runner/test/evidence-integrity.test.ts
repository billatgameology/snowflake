// Evidence integrity — the Phase 6 lessons that are ENFORCED rather than remembered.
//
// Three incidents in Phase 6 nearly destroyed measured evidence, and none of them failed a test at
// the time. Each rule below exists because of a specific one, named in its own block. A rule written
// only in a document is a rule that gets re-learned; these fail `npm test`.
//
// See docs/phase6-lessons.md for the full incident list and the rules that could NOT be automated.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const EVIDENCE = join(REPO, "evidence");
const MANIFEST = join(EVIDENCE, "MANIFEST.json");

interface Manifest {
  readonly files: Record<string, { readonly bytes: number; readonly sha256: string }>;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const sha256 = (p: string): string => createHash("sha256").update(readFileSync(p)).digest("hex");

describe("evidence integrity (Phase 6 lessons, enforced)", () => {
  // ── INCIDENT: arm 1's 204 measurements — 89 core-hours — existed in NO COMMIT for the entire
  // phase, because `out/` is gitignored and the convention was "track the hashes, not the artifact".
  // A hash proves a file has not changed; it does not preserve it. ADR 0038 moved evidence into a
  // tracked tree. This asserts it is still there and still itself.
  it("every file in the manifest exists and matches its digest", () => {
    expect(existsSync(MANIFEST), "evidence/MANIFEST.json is missing — ADR 0038").toBe(true);
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest;
    const entries = Object.entries(manifest.files);
    expect(entries.length).toBeGreaterThan(0);
    for (const [rel, want] of entries) {
      const p = join(EVIDENCE, rel);
      expect(existsSync(p), `evidence/${rel} is in the manifest but not on disk`).toBe(true);
      expect(statSync(p).size, `evidence/${rel} byte length`).toBe(want.bytes);
      expect(sha256(p), `evidence/${rel} digest`).toBe(want.sha256);
    }
  });

  // A manifest that lists a subset is a manifest that lets an artifact appear unrecorded.
  it("no evidence file is missing from the manifest", () => {
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest;
    const known = new Set(Object.keys(manifest.files));
    const stray: string[] = [];
    for (const f of walk(EVIDENCE)) {
      const rel = relative(EVIDENCE, f).replace(/\\/g, "/");
      if (rel === "MANIFEST.json" || rel === "OUT-TREES-MANIFEST.json") continue;
      if (!known.has(rel)) stray.push(rel);
    }
    expect(stray, `evidence files absent from MANIFEST.json: ${stray.join(", ")}`).toEqual([]);
  });

  // ── INCIDENT: creating evidence/ produced "warning: LF will be replaced by CRLF in
  // evidence/phase6-sweep/points.json". The committed blob was correct, but `core.autocrlf=true`
  // converts on CHECKOUT — so a fresh clone on Windows would have written CRLF and every sha256
  // printed in the published reports would have failed against the file the reader actually has.
  // Intact in the object store, unverifiable in practice. Caught by one warning line.
  it("git is forbidden from rewriting evidence line endings", () => {
    const attributes = join(REPO, ".gitattributes");
    expect(existsSync(attributes), ".gitattributes is missing — evidence bytes are unprotected").toBe(true);
    // Ask git itself rather than parsing the file: the question is what git DOES, not what we wrote.
    const out = execFileSync("git", ["check-attr", "text", "--", "evidence/phase6-sweep/points.json"], {
      cwd: REPO,
      encoding: "utf8",
    });
    expect(
      out.trim(),
      "evidence/** must be `-text` so no end-of-line conversion can change a hash-registered byte",
    ).toMatch(/text: unset$/);
  });

  // ── INCIDENT: the published reports print byte hashes for the sweep artifacts. Before ADR 0038
  // those hashes named files the reader did not have. They must now resolve inside the repository.
  it("the hashes printed in the published reports resolve to tracked files", () => {
    const registered: Record<string, string> = {
      // research/phase6-sweep-report.md provenance table
      "phase6-sweep/points.json": "0ed613bce61e44829f722e069a818e0da4981ecd34829b0b49eaba15e11cf89a",
      "phase6-sweep/report.json": "71ae094c38778b0d2c62f3952e4ca641c0bc8f5d91b350248c5c78800830f2a9",
      "phase6-sweep/diagram.svg": "40458703061af5b54d6629484aa84762fb995a15f5443904c3462d2ff5939234",
      // evidence/phase6-sweep-arm2/regeneration.json sidecar (erratum E4)
      "phase6-sweep-arm2/points.json": "b3fb4616d6413520f6505bfb6e1e068544622fee76bbca743f2aa01a7549a520",
    };
    for (const [rel, want] of Object.entries(registered)) {
      const p = join(EVIDENCE, rel);
      expect(existsSync(p), `a published hash names evidence/${rel}, which is not present`).toBe(true);
      expect(sha256(p), `evidence/${rel} no longer matches the hash printed in the reports`).toBe(want);
    }
  });

  // ── INCIDENT: ~862 MB of earlier-phase artifacts stay in the ignored out/ tree under a read-only
  // constraint (ADR 0038). They existed on one disk with no tracked record of their contents, so
  // partial deletion or corruption was undetectable. Their digests are registered; this asserts the
  // register itself is present and non-trivial, NOT that the trees exist — they legitimately do not
  // on a fresh clone.
  it("the out/ tree digest register is present and non-empty", () => {
    const p = join(EVIDENCE, "OUT-TREES-MANIFEST.json");
    expect(existsSync(p), "evidence/OUT-TREES-MANIFEST.json is missing — ADR 0038").toBe(true);
    const m = JSON.parse(readFileSync(p, "utf8")) as { totalFiles: number; trees: Record<string, unknown> };
    expect(m.totalFiles).toBeGreaterThan(400);
    expect(Object.keys(m.trees).length).toBeGreaterThan(4);
  });
});
