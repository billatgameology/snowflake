/**
 * Render education-only source plates from locally cached research PDFs.
 *
 *   node docs/education/tools/build-source-plates.mjs
 *
 * The output stays under gitignored research/figures/. These are copyrighted
 * source pages for a personal offline build, not publishable site assets. The
 * public course retains only cited placeholders and links to the papers.
 *
 * This tool is deliberately separate from app/scripts/phase6-crop-figures.mjs:
 * these plates support the education course and do not change Phase 6 evidence.
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { join, resolve } from "node:path";

const REPO = resolve(import.meta.dirname, "../../..");
const RESEARCH = join(REPO, "research");
const OUT = join(RESEARCH, "figures");

const PLATES = Object.freeze([
  {
    paper: "2109.00098v1",
    page: 19,
    file: "tax1-needle-matrix-p1-minus0.5-to-3C.png",
    label: "TAX1 Figure 24a",
  },
  {
    paper: "2109.00098v1",
    page: 20,
    file: "tax1-needle-matrix-p2-minus4-to-7C.png",
    label: "TAX1 Figure 24b",
  },
  {
    paper: "2109.00098v1",
    page: 21,
    file: "tax1-needle-matrix-p3-minus8-to-11C.png",
    label: "TAX1 Figure 24c",
  },
  {
    paper: "2109.00098v1",
    page: 22,
    file: "tax1-needle-matrix-p4-minus12-to-15C.png",
    label: "TAX1 Figure 24d",
  },
  {
    paper: "2109.00098v1",
    page: 23,
    file: "tax1-needle-matrix-p5-minus16-to-21C.png",
    label: "TAX1 Figure 24e",
  },
  {
    paper: "GravnerGriffeath_PhysRevE09",
    page: 13,
    file: "gg-3d-morphologies-fig23-31.png",
    label: "Gravner-Griffeath Figures 23–31",
  },
]);

const missing = PLATES
  .map((plate) => join(RESEARCH, `${plate.paper}.pdf`))
  .filter((path, index, paths) => paths.indexOf(path) === index && !existsSync(path));

if (missing.length) {
  console.error("Missing locally cached research PDF(s):");
  for (const path of missing) console.error(`  ${path}`);
  console.error("Restore them from the URLs and hashes recorded under research/ before rendering.");
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const render = String.raw`
import fitz
import json
import os
import sys

research, out, jobs_json = sys.argv[1:4]
jobs = json.loads(jobs_json)
for job in jobs:
    source = os.path.join(research, job["paper"] + ".pdf")
    document = fitz.open(source)
    page = document[job["page"] - 1]
    pixmap = page.get_pixmap(dpi=300, colorspace=fitz.csRGB)
    destination = os.path.join(out, job["file"])
    pixmap.save(destination)
    document.close()
    print("%s\t%dx%d" % (job["file"], pixmap.width, pixmap.height))
`;

const rendered = execFileSync(
  "python",
  ["-c", render, RESEARCH, OUT, JSON.stringify(PLATES)],
  { cwd: REPO, encoding: "utf8" },
);
process.stdout.write(rendered);

console.log("\nLocal plate provenance (copy these values only after inspecting the rendered pages):");
for (const plate of PLATES) {
  const path = join(OUT, plate.file);
  const bytes = statSync(path).size;
  const sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
  console.log(`${plate.label}\t${bytes}\t${sha256}`);
}

console.log("\nThese files are gitignored copyrighted research media. Do not publish or commit them.");
