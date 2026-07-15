#!/usr/bin/env node
// Rule 7 lint — a bare `alpha`/`beta` is banned from this repository. rule7-waive: the rule must name what it bans. (AGENTS.md Rule 7,
// charter §3.3). Libbrecht's attachment coefficient and Gravner-Griffeath's attachment
// threshold are unrelated quantities both conventionally written with the same Greek letter;
// an identifier that names either without provenance is a conflation hazard. Enforced by this
// script, wired into `npm test`, because vigilance does not survive a model handoff.
//
// ── Mention-vs-use policy (decided 2026-07-14, with the Phase 2 scaffold) ──────────────────
//
// The ban targets USES: identifiers that could flow into solver code. It must not gag
// MENTIONS: the specs legitimately *discuss* the symbol collision, and the ban's own text has
// to quote the banned spellings to state them.
//
// 1. Code files (.ts/.js/.py/.wgsl/...): every identifier token is checked, comments
//    included. A token violates when it is the bare stem (any case), or the stem  // rule7-waive: policy text.
//    qualified without provenance (alpha1, beta_01, alphaBasal, BETA_MAX — a digit, `_`, `$`,  // rule7-waive: policy examples.
//    or camelCase hump after the bare stem). Natural words with lowercase continuations
//    (alphabet, betatron) pass. Allowlist: tokens starting with `alphaHK` or `ggThresh`, and
//    exactly `reiterAlpha`/`reiterBeta`/`reiterGamma` (Phase 1's Reiter CA parameters).
// 2. Markdown files (synced 2026-07-14 to AGENTS.md Rule 7's mention-vs-use paragraph: the
//    ban targets identifiers "in code everywhere, and in inline code in docs"):
//    a. Fenced code blocks (``` / ~~~) are checked under the full identifier rule — they are
//       implementation-shaped and get copied into implementations.
//    b. Inline code spans (`...`) are checked under the identifier rule, with two structural
//       mention-forms exempt: a span that is EXACTLY one bare stem (a span like the word  // rule7-waive: policy text.
//       alpha alone names the symbol in order to discuss it — there is no code around it,  // rule7-waive: policy text.
//       so it cannot be a use), and Greek letters in spans (paper notation under
//       discussion; prose-Greek provenance is reviewer-enforced per AGENTS.md, and the
//       lint mechanically enforces only the identifier cases). Anything else in a span —
//       e.g. a span holding an assignment statement — violates and needs a per-line
//       waiver: this is why "a fixture containing `const alpha = 1`" in a plan's prose  // rule7-waive: policy example.
//       carries one (phase-2-cpu-solver.md), while the same text in a fenced block or a
//       .ts file simply fails.
//    c. Prose outside code spans is not mechanically checked (reviewer territory).
// 3. Greek letters: in checked text, a bare Greek letter form violates (both are valid
//    JS identifiers) — unless immediately followed by a subscript digit: indexed paper
//    notation in the specs' math blocks names G-G's published symbols and is a mention.
// 4. Per-line waiver: a line containing `rule7-waive: <reason>` is skipped. For deliberate
//    mentions inside code — this script's own patterns, a test's fixture strings. The reason
//    is mandatory; a bare marker does not waive.
// 5. File set: `git ls-files --cached --others --exclude-standard` — tracked plus
//    untracked-but-not-ignored. This scans spike/ and docs/ automatically and excludes
//    gitignored research media and node_modules. scripts/lint-rule7-fixtures/ is excluded
//    from the repo scan (fixtures exist to fail; the fixture test lints them explicitly via
//    --file).
//
// Usage:
//   node scripts/lint-rule7.mjs              # scan the repository
//   node scripts/lint-rule7.mjs --file A B   # scan exactly the given files (fixture tests)

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".wgsl", ".glsl", ".c", ".h", ".cpp", ".hpp", ".rs", ".go", ".java",
  ".sh", ".bash", ".zsh", ".html", ".css", ".svelte", ".vue",
]);
const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown"]);

const BARE_STEM = /^(alpha|beta)$/i; // rule7-waive: the pattern must spell the stems to detect them.
// Stem plus a provenance-free qualifier: digit, underscore, dollar, or camelCase hump.
const QUALIFIED_STEM = /^(alpha|beta)[0-9_$A-Z]|^(ALPHA|BETA)[0-9_$]/; // rule7-waive: lint self-reference.
const ALLOWLIST_PREFIX = /^(alphaHK|ggThresh)/;
const ALLOWLIST_EXACT = new Set(["reiterAlpha", "reiterBeta", "reiterGamma"]);
const IDENTIFIER = /[A-Za-z_$][A-Za-z0-9_$]*/g;
// Greek lowercase stems not followed by a subscript digit (U+2080-U+2089).
const GREEK_BARE = /[αβ](?![₀-₉])/g; // rule7-waive: the pattern must spell the letters to detect them.
const WAIVER = /rule7-waive:\s*\S/;

function violationsInLine(line) {
  const found = [];
  if (WAIVER.test(line)) return found;
  for (const match of line.matchAll(IDENTIFIER)) {
    const token = match[0];
    if (ALLOWLIST_PREFIX.test(token) || ALLOWLIST_EXACT.has(token)) continue;
    if (BARE_STEM.test(token) || QUALIFIED_STEM.test(token)) found.push(token);
  }
  for (const match of line.matchAll(GREEK_BARE)) found.push(match[0]);
  return found;
}

// Markdown prose line: check inline code spans only (header policy 2b). A span that is
// exactly one bare stem is a structural mention (it names the symbol; nothing is computed);
// Greek in spans is paper notation (reviewer-enforced provenance). Everything else in a
// span gets the identifier rule; the per-line waiver applies as everywhere.
const INLINE_SPAN = /`([^`]+)`/g;

function violationsInSpans(line) {
  const found = [];
  if (WAIVER.test(line)) return found;
  for (const span of line.matchAll(INLINE_SPAN)) {
    const content = span[1];
    if (BARE_STEM.test(content.trim())) continue; // single-symbol mention
    for (const match of content.matchAll(IDENTIFIER)) {
      const token = match[0];
      if (ALLOWLIST_PREFIX.test(token) || ALLOWLIST_EXACT.has(token)) continue;
      if (BARE_STEM.test(token) || QUALIFIED_STEM.test(token)) found.push(token);
    }
  }
  return found;
}

function checkFile(path) {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return []; // deleted-but-listed or unreadable: nothing to check
  }
  const ext = extname(path).toLowerCase();
  const isMarkdown = MARKDOWN_EXTENSIONS.has(ext);
  if (!isMarkdown && !CODE_EXTENSIONS.has(ext)) return [];

  const results = [];
  const lines = text.split("\n");
  let inFence = false;
  let fenceMarker = "";
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    if (isMarkdown) {
      const fence = line.match(/^\s*(```+|~~~+)/);
      if (fence) {
        if (!inFence) {
          inFence = true;
          fenceMarker = fence[1][0];
        } else if (fence[1][0] === fenceMarker) {
          inFence = false;
        }
        continue;
      }
      if (!inFence) {
        // Prose line: inline code spans only (header policy 2b).
        for (const token of violationsInSpans(line)) {
          results.push({ path, line: n + 1, token });
        }
        continue;
      }
    }
    for (const token of violationsInLine(line)) {
      results.push({ path, line: n + 1, token });
    }
  }
  return results;
}

function repoFiles() {
  const out = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: process.cwd(), maxBuffer: 64 * 1024 * 1024 },
  ).toString("utf8");
  return out
    .split("\0")
    .filter((f) => f.length > 0)
    .filter((f) => !f.startsWith("scripts/lint-rule7-fixtures/"));
}

const args = process.argv.slice(2);
let files;
if (args[0] === "--file") {
  files = args.slice(1).map((f) => resolve(f));
  if (files.length === 0) {
    console.error("--file requires at least one path");
    process.exit(2);
  }
} else if (args.length === 0) {
  files = repoFiles();
} else {
  console.error(`unknown arguments: ${args.join(" ")}`);
  process.exit(2);
}

const violations = files.flatMap(checkFile);
if (violations.length > 0) {
  console.error("Rule 7 violations (bare alpha/beta — see AGENTS.md Rule 7):"); // rule7-waive: error message names the rule.
  for (const v of violations) {
    console.error(`  ${v.path}:${v.line}: \`${v.token}\``);
  }
  console.error(
    `${violations.length} violation(s). Use alphaHK* for the Hertz-Knudsen coefficient, ggThresh* for G-G thresholds.`,
  );
  process.exit(1);
}
console.log(`rule7: clean (${files.length} files scanned)`);
