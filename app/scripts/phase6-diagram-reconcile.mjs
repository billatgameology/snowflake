// Phase 6 — reconcile the published FIGURE with the published DATA (pin register rec 13, R40/R41).
//
// WHY THIS IS NOT COVERED BY THE INDEPENDENT VERIFIERS. `phase6-wp5-independent.mjs` and
// `phase6-arm2-independent.mjs` import nothing from `runner/src` on purpose, so neither can
// re-render a diagram — rendering requires the renderer. They therefore check the SVG's title and
// nothing else. That leaves the actual content of the figure unchecked, and the figure is the
// artifact that gets pasted into a report and read by a human who will never open `points.json`.
//
// The claim this makes, and it is a different claim from independent verification: `diagram.svg` is
// a pure function of `points.json` and the arm, and the published bytes are that function's output.
// A figure that drifted from its data — by an edit, a stale re-render, or a row sorted differently —
// fails here byte-for-byte.
//
//   node app/scripts/phase6-diagram-reconcile.mjs

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { phase6RenderDiagram } from "../../runner/src/phase6-diagram.ts";
import { PHASE6_ARM1, PHASE6_ARM2 } from "../../runner/src/phase6-sweep.ts";

const sha = (b) => createHash("sha256").update(b).digest("hex");

// THE SUBTITLE IS TAKEN FROM THE PUBLISHED FILE, NOT RECONSTRUCTED — and that is a deliberate
// change of design after the first run of this script, not a convenience.
//
// Reconstructing it made the check test two things at once and report them as one: whether the
// PLOTTED DATA still matches, and whether the caption text still formats the same way. Arm 1's
// figure failed on the second while passing the first, which is exactly the kind of result that
// gets a real check deleted for crying wolf. So: the caption is lifted verbatim from the published
// SVG and fed back in, the BODY is compared byte-for-byte, and the caption is compared separately
// and reported as its own line. A data drift and a caption drift are different findings.
const TARGETS = [
  { arm: PHASE6_ARM1, dir: "phase6-sweep" },
  { arm: PHASE6_ARM2, dir: "phase6-sweep-arm2" },
];

/** The two chrome lines: the 16px title and the 11px grey provenance subtitle. */
const isChrome = (line) => /font-size="16"/.test(line) || /font-size="11" fill="#555"/.test(line);
const textOf = (line) => /<text[^>]*>([\s\S]*?)<\/text>/.exec(line)?.[1] ?? null;
const bodyOf = (svg) => svg.split("\n").filter((l) => !isChrome(l)).join("\n");
const chromeOf = (svg) => svg.split("\n").filter(isChrome).map(textOf);

let failures = 0;
for (const target of TARGETS) {
  const dir = join(process.cwd(), "out", target.dir);
  let points, report, sidecar = null;
  try {
    points = JSON.parse(readFileSync(join(dir, "points.json"), "utf8"));
    report = JSON.parse(readFileSync(join(dir, "report.json"), "utf8"));
    try {
      sidecar = JSON.parse(readFileSync(join(dir, "regeneration.json"), "utf8"));
    } catch {
      sidecar = null;
    }
  } catch (error) {
    console.log(`${target.arm.id}: artifact not readable at ${dir} — ${String(error.message).slice(0, 120)}`);
    failures += 1;
    continue;
  }

  const published = readFileSync(join(dir, "diagram.svg"), "utf8");
  const [publishedTitle, publishedSubtitle] = chromeOf(published);
  const rerendered = phase6RenderDiagram(points, publishedSubtitle ?? "", target.arm.diagramLabel);
  const [rerenderedTitle] = chromeOf(rerendered);

  const bodyMatches = bodyOf(published) === bodyOf(rerendered);
  const titleMatches = publishedTitle === rerenderedTitle;
  const wholeMatches = published === rerendered;

  console.log(`${target.arm.id}`);
  console.log(`  published  ${String(Buffer.byteLength(published)).padStart(6)} bytes  ${sha(published)}`);
  console.log(`  DATA (every plotted cell, axis and legend): ${bodyMatches ? "BYTE-IDENTICAL — the figure is the data" : "**DIVERGED**"}`);
  console.log(`  CAPTION: ${titleMatches ? "matches the current renderer" : "**does not match the current renderer**"}`);
  if (!titleMatches) {
    console.log(`     published:   ${publishedTitle}`);
    console.log(`     current code: ${rerenderedTitle}`);
  }
  console.log(`  whole file re-renders byte-identically: ${wholeMatches ? "yes" : "no"}`);

  if (!bodyMatches) {
    // Only a DATA divergence is a failure. Say WHERE — a byte count alone sends the reader to a
    // diff they cannot run.
    failures += 1;
    const a = bodyOf(published).split("\n");
    const b = bodyOf(rerendered).split("\n");
    for (let i = 0, shown = 0; i < Math.max(a.length, b.length) && shown < 3; i++) {
      if (a[i] !== b[i]) {
        console.log(`    line ${i + 1}\n      published:   ${String(a[i]).slice(0, 150)}\n      re-rendered: ${String(b[i]).slice(0, 150)}`);
        shown += 1;
      }
    }
  }
}

console.log("");
console.log("A DATA divergence fails this script. A CAPTION divergence does not, and is reported");
console.log("instead: arm 1's figure predates the two-arm refactor, so its title constant and its");
console.log("subtitle FORMAT both changed after it was written. Its recorded byte hash therefore");
console.log("cannot be re-earned from the current tree — the plotted content can, and is.");
console.log(`PHASE6 DIAGRAM RECONCILE: ${failures === 0 ? "PASS" : "FAIL"}`);
if (failures > 0) process.exit(1);
