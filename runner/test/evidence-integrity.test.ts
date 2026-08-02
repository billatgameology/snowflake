// Evidence integrity — the Phase 6 lessons that are ENFORCED rather than remembered.
//
// Several incidents in Phase 6 nearly destroyed or corrupted evidence, and none failed a test at
// the time. Each rule below exists because of a specific one, named in its own block. A rule written
// only in a document is a rule that gets re-learned; these fail `npm test`.
//
// See docs/phase6-lessons.md for the full incident list and the rules that could NOT be automated.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const EVIDENCE = join(REPO, "evidence");
const MANIFEST = join(EVIDENCE, "MANIFEST.json");
const EXPECTED_MANIFEST_METADATA = {
  movedFrom: "out/ (gitignored), plus the byte-identical tracked arm64 fingerprint formerly under docs/",
  movedTo: "evidence/ (tracked)",
  note: "Historical sweep digests were computed before their move and re-verified afterward. The arm64 fingerprint preserves the exact former docs/ Git blob (18398 bytes, SHA-256 d6686f8e...). The x64 fingerprint is the complete 2026-08-01 lightweight fixture re-execution backing the exact per-entry comparison; it reproduces registered digest 2a9f64b3. These are preserved claim-backing bytes, not regenerated production sweeps.",
} as const;

interface Manifest {
  readonly schema: string;
  readonly movedFrom: string;
  readonly movedTo: string;
  readonly note: string;
  readonly fileCount: number;
  readonly totalBytes: number;
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
    expect(Object.keys(manifest).sort()).toEqual([
      "fileCount", "files", "movedFrom", "movedTo", "note", "schema", "totalBytes",
    ]);
    expect(manifest.schema).toBe("phase6-evidence-manifest-v1");
    expect(manifest.movedFrom).toBe(EXPECTED_MANIFEST_METADATA.movedFrom);
    expect(manifest.movedTo).toBe(EXPECTED_MANIFEST_METADATA.movedTo);
    expect(manifest.note).toBe(EXPECTED_MANIFEST_METADATA.note);
    const entries = Object.entries(manifest.files);
    expect(entries.length).toBeGreaterThan(0);
    expect(manifest.fileCount).toBe(entries.length);
    expect(manifest.totalBytes).toBe(entries.reduce((sum, [, pin]) => sum + pin.bytes, 0));
    const evidenceRoot = resolve(EVIDENCE);
    const indexEntries = execFileSync("git", ["ls-files", "-s", "-z"], {
        cwd: REPO,
        encoding: "utf8",
        maxBuffer: 128 * 1024 * 1024,
      }).split("\0").filter(Boolean);
    const trackedModes = new Map(indexEntries.map((entry) => {
      const tab = entry.indexOf("\t");
      if (tab < 0) throw new Error(`unparseable git index entry: ${entry}`);
      return [entry.slice(tab + 1), entry.slice(0, tab).split(" ")[0] as string] as const;
    }));
    const tracked = new Set(trackedModes.keys());
    for (const required of ["evidence/MANIFEST.json", "evidence/OUT-TREES-MANIFEST.json"]) {
      expect(tracked.has(required), `${required} must be tracked, not merely present locally`).toBe(true);
      expect(["100644", "100755"], `${required} must be a regular tracked file`).toContain(
        trackedModes.get(required),
      );
    }
    for (const [rel, want] of entries) {
      expect(isAbsolute(rel), `evidence manifest path must be relative: ${rel}`).toBe(false);
      expect(rel, `evidence manifest path must use canonical forward slashes: ${rel}`).not.toContain("\\");
      expect(rel, `evidence manifest path has an empty segment: ${rel}`).not.toContain("//");
      expect(rel, `evidence manifest path has a dot segment: ${rel}`).not.toMatch(/(?:^|\/)\.{1,2}(?:\/|$)/);
      const resolved = resolve(EVIDENCE, rel);
      expect(
        resolved.startsWith(`${evidenceRoot}${sep}`),
        `evidence manifest path escapes evidence/: ${rel}`,
      ).toBe(true);
      expect(relative(EVIDENCE, resolved).replace(/\\/g, "/"), `canonical evidence path ${rel}`).toBe(rel);
      expect(
        tracked.has(`evidence/${rel}`),
        `evidence/${rel} must be tracked, not merely present locally`,
      ).toBe(true);
      expect(
        ["100644", "100755"],
        `evidence/${rel} must be a regular tracked file, never a symlink or submodule`,
      ).toContain(trackedModes.get(`evidence/${rel}`));
      expect(Object.keys(want).sort(), `evidence/${rel} pin schema`).toEqual(["bytes", "sha256"]);
      expect(Number.isInteger(want.bytes) && want.bytes >= 0, `evidence/${rel} pin bytes`).toBe(true);
      expect(want.sha256, `evidence/${rel} pin digest syntax`).toMatch(/^[0-9a-f]{64}$/);
      const p = join(EVIDENCE, rel);
      expect(existsSync(p), `evidence/${rel} is in the manifest but not on disk`).toBe(true);
      const diskEntry = lstatSync(p);
      expect(diskEntry.isSymbolicLink(), `evidence/${rel} must not be a filesystem symlink`).toBe(false);
      expect(diskEntry.isFile(), `evidence/${rel} must be a regular file`).toBe(true);
      expect(diskEntry.size, `evidence/${rel} byte length`).toBe(want.bytes);
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
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest;
    const paths = Object.keys(manifest.files).map((rel) => `evidence/${rel}`);
    // Feed the inventory on stdin rather than one argv per artifact. R15 is expected to publish
    // thousands of per-case files; a single Windows command line would fail before git could check
    // them, silently turning this protection into a scale limit.
    const attributesToPin = ["text", "eol", "working-tree-encoding", "filter", "ident"] as const;
    const out = execFileSync("git", ["check-attr", ...attributesToPin, "--stdin"], {
      cwd: REPO,
      encoding: "utf8",
      input: `${paths.join("\n")}\n`,
      maxBuffer: 128 * 1024 * 1024,
    });
    const lines = out.trim().split(/\r?\n/);
    expect(lines).toHaveLength(paths.length * attributesToPin.length);
    const lineSet = new Set(lines);
    for (const path of paths) {
      expect(
        lineSet.has(`${path}: text: unset`),
        `${path} must be \`-text\` so checkout conversion cannot change registered bytes`,
      ).toBe(true);
      for (const attribute of attributesToPin.slice(1)) {
        expect(
          lineSet.has(`${path}: ${attribute}: unspecified`),
          `${path} must not enable ${attribute}, which could rewrite registered bytes`,
        ).toBe(true);
      }
    }
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

  // Education figure metadata is authored as HTML attributes, so `&ldquo;` means a curly quote.
  // Escaping the undecoded attribute a second time emitted literal `&amp;ldquo;` text in the
  // generated provenance page. Bind both the rendered bytes and a non-vacuous named mutation.
  it("the generated figure inventory decodes attribute entities before HTML escaping", () => {
    const pagePath = join(REPO, "docs/education/figures.html");
    const page = readFileSync(pagePath, "utf8");
    const doubleEscapedEntity = /&amp;(?:#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);/g;
    expect(page.match(doubleEscapedEntity), "figures.html contains a double-escaped HTML entity").toBeNull();
    expect(page).toContain("Libbrecht, “Snow Crystals”");
    expect(page).toContain("PDF p. 18 · printed p. 17");

    // Negative control: execute the historical failure shape and prove this detector sees it.
    const mutated = page.replace(
      "Libbrecht, “Snow Crystals”",
      "Libbrecht, &amp;ldquo;Snow Crystals&amp;rdquo;",
    );
    expect(mutated, "double-escape negative control did not execute its named mutation").not.toBe(page);
    expect(mutated.match(doubleEscapedEntity)?.[0]).toBe("&amp;ldquo;");
  });

  // ── INCIDENT: a provenance edit silently reattributed Figure 4.12 digitizations to the later
  // M1 closed form, classified a contextual non-input as P2, and described every project-derived
  // value as citation-backed. Those statements were individually plausible and jointly false.
  // Bind the public teaching copy to the current parameter authority, including a named mutation
  // for each failure class so this is an enforcing audit rather than a prose snapshot.
  it("chapter 16 preserves the parameter table's scoped provenance and distinct mappings", () => {
    const chapterPath = join(REPO, "docs/education/chapters/16-where-the-numbers-came-from.html");
    const tablePath = join(REPO, "docs/libbrecht-parameters.md");
    const chapter = readFileSync(chapterPath, "utf8");
    const parameterTable = readFileSync(tablePath, "utf8");

    const audit = (page: string, table: string): string[] => {
      const problems: string[] = [];
      const prose = page.replace(/\s+/g, " ");
      const fullTableStart = page.indexOf("/* ---- section 2 : physical constants");
      const fullTableEnd = page.indexOf("var CLASS_ORDER", fullTableStart);
      const grouped = fullTableStart >= 0 && fullTableEnd > fullTableStart
        ? page.slice(fullTableStart, fullTableEnd)
        : "";

      if (!table.includes("No adopted source value or source transcription enters this file without a citation")) {
        problems.push("parameter authority citation scope");
      }
      if (!table.includes("project-derived/P4 value") || !table.includes("named operands and method")) {
        problems.push("parameter authority derivation scope");
      }
      if (!prose.includes("Every adopted source value or transcription has a citation")) {
        problems.push("teaching citation scope");
      }
      if (!prose.includes("every adopted solver input carries one")) {
        problems.push("provenance-class heading scope");
      }
      if (!prose.includes("recorded operands and method, and a test")) {
        problems.push("P4 method/test statement");
      }
      if (!prose.includes("Computed, not assumed: worst error")) {
        problems.push("leave-one-out computation status");
      }
      if (/No number is guessed, interpolated, or recalled from memory/.test(page)) {
        problems.push("obsolete absolute no-number rule");
      }
      if (/rendering of the frozen file|frozen source file|grouped view of the frozen sections/.test(page)) {
        problems.push("current table mislabeled R15-frozen");
      }
      if ((page.match(/source: "monograph Figure 4\.12 digitization"/g) ?? []).length !== 3) {
        problems.push("Figure 4.12 attribution count");
      }
      if (/source: "M1 closed form, arXiv:2306\.13087v1"/.test(page)) {
        problems.push("digitized range reattributed to M1");
      }
      if ((grouped.match(/cls: "P3"/g) ?? []).length !== 4) {
        problems.push("grouped P3 count");
      }
      if (!prose.includes("you get four grouped rows")) {
        problems.push("reported P3 count");
      }
      if (!/name: "chi_0\(T, P\)"[\s\S]*?cls: null,[\s\S]*?kind: "OUTSIDE"/.test(grouped)) {
        problems.push("chi_0 outside-taxonomy bucket");
      }
      if (!/name: "D\(T\), temperature dependence"[\s\S]*?cls: null,[\s\S]*?(?=\n\s*\{ name:)/.test(grouped)) {
        problems.push("D(T) gap row");
      }
      if (!page.includes('["OUTSIDE", "Outside"]')) {
        problems.push("outside filter control");
      }
      return problems;
    };

    expect(audit(chapter, parameterTable)).toEqual([]);

    const controls = [
      {
        name: "Figure 4.12 range reattributed to M1",
        page: chapter.replace(
          'source: "monograph Figure 4.12 digitization"',
          'source: "M1 closed form, arXiv:2306.13087v1"',
        ),
        table: parameterTable,
      },
      {
        name: "contextual chi_0 collapsed into GAP",
        page: chapter.replace(', kind: "OUTSIDE" },', " },"),
        table: parameterTable,
      },
      {
        name: "reported P3 count changed to three",
        page: chapter.replace("you get four grouped rows", "you get three grouped rows"),
        table: parameterTable,
      },
      {
        name: "P4 choice falsely described as citation-backed",
        page: chapter.replace("recorded operands and method, and a test", "a citation and a test"),
        table: parameterTable,
      },
      {
        name: "current table mislabeled frozen",
        page: chapter.replace("current content-pinned parameter file", "frozen file"),
        table: parameterTable,
      },
      {
        name: "citation requirement widened to project-derived values",
        page: chapter,
        table: parameterTable.replace(
          "No adopted source value or source transcription enters this file without a citation",
          "No adopted solver-input value or source transcription enters this file without a citation",
        ),
      },
    ];
    for (const control of controls) {
      expect(
        control.page !== chapter || control.table !== parameterTable,
        `${control.name} negative control did not execute its named mutation`,
      ).toBe(true);
      expect(audit(control.page, control.table), `${control.name} escaped the audit`).not.toEqual([]);
    }
  });
});
