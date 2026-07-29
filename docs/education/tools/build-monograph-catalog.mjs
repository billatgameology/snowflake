/**
 * Build docs/education/tools/monograph-figure-catalog.md — a greppable index of
 * all 376 figures in Libbrecht's "Snow Crystals" monograph (arXiv:1910.06389v2),
 * with each figure's published caption and the path to its cropped image.
 *
 *   node docs/education/tools/build-monograph-catalog.mjs
 *
 * Reads research/1910.06389v2-llm/figures.jsonl, which is produced by
 * scripts/build_pdf_llm_bundle.py. Both the bundle and the images it points at
 * are gitignored under decision 0004 — the catalog (captions and provenance,
 * no image bytes) is the tracked artifact, and it exists so a chapter author
 * can find the right figure and quote its caption exactly without opening a
 * 523-page PDF.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO = resolve(import.meta.dirname, "../../..");
const BUNDLE = join(REPO, "research/1910.06389v2-llm");
const OUT = join(REPO, "docs/education/tools/monograph-figure-catalog.md");

const jsonl = join(BUNDLE, "figures.jsonl");
if (!existsSync(jsonl)) {
  console.error(`Missing ${jsonl}`);
  console.error("Rebuild it with: python3 scripts/build_pdf_llm_bundle.py --force research/1910.06389v2.pdf");
  process.exit(1);
}

const rows = [];
for (const line of readFileSync(jsonl, "utf8").split("\n")) {
  if (!line.trim()) continue;
  let f;
  try { f = JSON.parse(line); } catch { continue; }
  const rel = `research/1910.06389v2-llm/figures/fig-${f.figure_id}/visual.png`;
  rows.push({
    id: f.figure_id,
    pdf: f.pdf_page,
    printed: f.printed_page,
    cats: (f.categories || []).join("/") || "—",
    caption: (f.caption?.text || "").replace(/\s+/g, " ").trim(),
    rel,
    present: existsSync(join(REPO, rel)),
  });
}

rows.sort((a, b) => {
  const [ac, an] = a.id.split(".").map(Number);
  const [bc, bn] = b.id.split(".").map(Number);
  return ac - bc || an - bn;
});

const present = rows.filter((r) => r.present).length;
const out = [];

out.push("# Monograph figure catalog — all figures, with captions");
out.push("");
out.push("**Generated. Do not edit by hand** — run:");
out.push("");
out.push("```");
out.push("node docs/education/tools/build-monograph-catalog.mjs");
out.push("```");
out.push("");
out.push(
  "A greppable index of every figure in Kenneth Libbrecht's *Snow Crystals* " +
  "([arXiv:1910.06389v2](https://arxiv.org/abs/1910.06389)), so a chapter author can find the " +
  "right figure and quote its published caption exactly without opening the 523-page PDF."
);
out.push("");
out.push(
  "The image paths point into the **gitignored** `research/` cache " +
  "([decision 0004](../../decisions/0004-research-media-not-versioned.md)). Captions and " +
  "provenance are tracked here; the image bytes are not. See [`../FIGURES.md`](../FIGURES.md) " +
  "for how to restore them locally."
);
out.push("");
out.push(`Figures: **${rows.length}** · present in this checkout: **${present}**`);
out.push("");

let chapter = null;
for (const r of rows) {
  const ch = r.id.split(".")[0];
  if (ch !== chapter) {
    chapter = ch;
    out.push("");
    out.push(`## Chapter ${ch}`);
    out.push("");
  }
  out.push(`### Figure ${r.id}`);
  out.push("");
  out.push(`- PDF page ${r.pdf} · printed page ${r.printed} · \`${r.cats}\``);
  out.push(`- \`${r.rel}\``);
  out.push(`- Caption: ${r.caption || "*(none extracted)*"}`);
  out.push("");
}

writeFileSync(OUT, out.join("\n"), "utf8");
console.log(`Wrote ${OUT}`);
console.log(`  ${rows.length} figures, ${present} present locally`);
