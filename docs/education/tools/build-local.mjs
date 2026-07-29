/**
 * Build a self-contained personal copy of the education site, with the source
 * figures baked in.
 *
 *   node docs/education/tools/build-local.mjs
 *
 * Output: out/education-local/  — open index.html in a browser.
 *
 * WHY THIS EXISTS
 * ---------------
 * The site resolves figures out of the gitignored research/ cache, two levels
 * above itself. That works when you open it from a checkout, but it means the
 * site is not portable: move the folder and the figures vanish. This build
 * copies every referenced image in beside the pages and rewrites the paths, so
 * the result is one folder you can move, archive, or read on a machine that has
 * no checkout at all.
 *
 * WHERE IT WRITES, AND WHY THAT MATTERS
 * -------------------------------------
 * out/ is gitignored. That is deliberate and load-bearing: this build contains
 * Kenneth G. Libbrecht's copyrighted figures, so it is a PERSONAL copy. Do not
 * commit it, publish it, or upload it anywhere. The published site deliberately
 * has no images in it — see docs/decisions/0004-research-media-not-versioned.md.
 * A README is written into the build repeating that.
 *
 * If a figure is missing from your local cache the build still succeeds: that
 * page simply keeps the cited placeholder, exactly as the published site does.
 */

import {
  readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync,
  readdirSync, statSync, rmSync,
} from "node:fs";
import { join, resolve, dirname, relative } from "node:path";

const REPO = resolve(import.meta.dirname, "../../..");
const SRC = join(REPO, "docs/education");
const OUT = join(REPO, "out/education-local");
const FIGDIR = join(OUT, "figures");

/* ------------------------------------------------------------------ helpers */

function copyTree(from, to, skip = () => false) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    const s = join(from, entry);
    const d = join(to, entry);
    if (skip(s, entry)) continue;
    if (statSync(s).isDirectory()) copyTree(s, d, skip);
    else copyFileSync(s, d);
  }
}

/** A flat, readable filename for a figure, derived from its source path. */
function figureName(src) {
  // research/1910.06389v2-llm/figures/fig-2.1/visual.png -> monograph-fig-2.1.png
  let m = /1910\.06389v2-llm\/figures\/fig-([^/]+)\//.exec(src);
  if (m) return `monograph-fig-${m[1]}.png`;
  // research/figures/some-crop.png -> some-crop.png
  m = /([^/]+)$/.exec(src);
  return m ? m[1] : "figure.png";
}

/* -------------------------------------------------------------------- build */

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(FIGDIR, { recursive: true });

// Everything except the tooling, which is repository machinery, not the site.
copyTree(SRC, OUT, (_p, entry) => entry === "tools" || entry === ".nojekyll");

const pages = [];
for (const entry of readdirSync(OUT)) {
  if (entry.endsWith(".html")) pages.push(join(OUT, entry));
}
const chapterDir = join(OUT, "chapters");
if (existsSync(chapterDir)) {
  for (const entry of readdirSync(chapterDir)) {
    if (entry.endsWith(".html")) pages.push(join(chapterDir, entry));
  }
}

const copied = new Map();   // original src -> flat filename
const missing = new Set();
let rewritten = 0;

for (const page of pages) {
  let html = readFileSync(page, "utf8");
  const pageDepth = relative(OUT, dirname(page)) === "" ? 0 : 1;
  const base = "../".repeat(pageDepth) + "figures/";

  html = html.replace(/data-src="([^"]+)"/g, (whole, src) => {
    const abs = join(REPO, src);
    if (!existsSync(abs)) { missing.add(src); return whole; }

    let name = copied.get(src);
    if (!name) {
      name = figureName(src);
      // guard against two different sources flattening to the same name
      let n = 1;
      while ([...copied.values()].includes(name)) {
        name = name.replace(/(\.png)$/, `-${++n}$1`);
      }
      copyFileSync(abs, join(FIGDIR, name));
      copied.set(src, name);
    }
    rewritten++;
    return `data-src="${name}"`;
  });

  // Point the page at the local figures folder instead of the repository root.
  html = html.replace(/<body([^>]*)data-depth="(\d+)"([^>]*)>/,
    (_m, a, d, b) => `<body${a}data-depth="${d}" data-figure-base="${base}"${b}>`);

  writeFileSync(page, html, "utf8");
}

/* ------------------------------------------------------------------- README */

const bytes = [...copied.values()]
  .reduce((n, f) => n + statSync(join(FIGDIR, f)).size, 0);

writeFileSync(join(OUT, "README.txt"), `Snow Crystals — personal local copy
===================================

Open index.html in a browser. Everything works offline; the source figures are
included in figures/ so this folder can be moved or copied anywhere.

DO NOT PUBLISH THIS FOLDER.

The ${copied.size} images in figures/ are Kenneth G. Libbrecht's copyrighted work,
reproduced here for personal reading only. They are not part of the project
repository and are not in the published site, which shows citation cards
pointing at the original papers instead. Putting this folder on a web server,
in a git repository, or in shared storage would republish someone else's work.

See docs/decisions/0004-research-media-not-versioned.md in the repository.

Rebuild with:  node docs/education/tools/build-local.mjs
`, "utf8");

/* ------------------------------------------------------------------- report */

console.log(`Built ${OUT}`);
console.log(`  ${pages.length} pages`);
console.log(`  ${copied.size} figures copied (${(bytes / 1024 / 1024).toFixed(1)} MB), ${rewritten} references rewritten`);
if (missing.size) {
  console.log(`  ${missing.size} figure(s) not in your local cache — those keep the cited placeholder:`);
  for (const m of [...missing].slice(0, 10)) console.log(`    ${m}`);
}
console.log(`\nOpen: ${join(OUT, "index.html")}`);
console.log("This folder contains copyrighted figures. Personal use only — do not publish it.");
