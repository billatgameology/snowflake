/**
 * Build a self-contained personal copy of the education site, with locally
 * cached source media baked in.
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
 * copies every referenced local image or video beside the pages and rewrites
 * the paths, so the result is one folder you can move, archive, or read on a
 * machine that has no checkout at all.
 *
 * WHERE IT WRITES, AND WHY THAT MATTERS
 * -------------------------------------
 * out/ is gitignored. That is deliberate and load-bearing: this build contains
 * copyrighted third-party source figures and video, so it is a PERSONAL copy.
 * Do not commit it, publish it, or upload it anywhere. The published site
 * deliberately has no source media in it — see decision 0004.
 * A README is written into the build repeating that.
 *
 * If a figure is missing from your local cache the build still succeeds: that
 * page simply keeps the cited placeholder, exactly as the published site does.
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";

const REPO = resolve(import.meta.dirname, "../../..");
const RESEARCH = resolve(REPO, "research");
const SRC = join(REPO, "docs/education");
const OUT = join(REPO, "out/education-local");
const FIGDIR = join(OUT, "figures");
const MEDIADIR = join(OUT, "media");
const SOURCE_MAP = join(OUT, "source-media-map.json");
const SITE_MANIFEST = join(SRC, "tools/site-manifest.json");
const canonicalPath = realpathSync.native ?? realpathSync;

const FIGURE_TYPES = new Map([
  [".avif", "image/avif"],
  [".gif", "image/gif"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);
const VIDEO_TYPES = new Map([
  [".m4v", "video/mp4"],
  [".mov", "video/quicktime"],
  [".mp4", "video/mp4"],
  [".webm", "video/webm"],
]);

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

function slash(path) {
  return path.split(sep).join("/");
}

function isWithin(root, candidate) {
  const rel = relative(root, candidate);
  return rel === "" || (!isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`));
}

/**
 * A worktree may deliberately mount its ignored media cache from another
 * registered worktree. Trust only canonical research roots named by
 * `git worktree list`; an arbitrary junction out of research/ remains an
 * error.
 */
function trustedResearchRoots() {
  const listing = execFileSync("git", ["worktree", "list", "--porcelain"], {
    cwd: REPO,
    encoding: "utf8",
  });
  const roots = [];
  const seen = new Set();
  for (const match of listing.matchAll(/^worktree (.+)$/gm)) {
    const candidate = resolve(match[1], "research");
    if (!existsSync(candidate)) continue;
    const root = canonicalPath(candidate);
    const key = process.platform === "win32" ? root.toLowerCase() : root;
    if (!seen.has(key)) {
      seen.add(key);
      roots.push(root);
    }
  }
  if (!roots.length) {
    throw new Error("No registered git worktree has a readable research/ directory");
  }
  return roots;
}

const TRUSTED_RESEARCH_ROOTS = trustedResearchRoots();

function canonicalResearchName(path) {
  for (const root of TRUSTED_RESEARCH_ROOTS) {
    if (isWithin(root, path)) return `research/${slash(relative(root, path))}`;
  }
  throw new Error(`Canonical source escaped every registered worktree research root: ${path}`);
}

function expectedType(src, kind) {
  const extension = extname(src).toLowerCase();
  const types = kind === "figure" ? FIGURE_TYPES : VIDEO_TYPES;
  const mimeType = types.get(extension);
  if (!mimeType) {
    throw new Error(`Unsupported ${kind} extension ${extension || "(none)"}: ${src}`);
  }
  return { extension, mimeType };
}

function readHeader(path, length = 32) {
  const fd = openSync(path, "r");
  try {
    const bytes = Buffer.alloc(length);
    const count = readSync(fd, bytes, 0, bytes.length, 0);
    return bytes.subarray(0, count);
  } finally {
    closeSync(fd);
  }
}

function isIsoBmff(header) {
  return header.length >= 12 && header.subarray(4, 8).toString("ascii") === "ftyp";
}

function validateSignature(path, extension, kind) {
  const header = readHeader(path);
  let valid = false;
  if (kind === "figure") {
    if (extension === ".png") {
      valid = header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    } else if (extension === ".jpg" || extension === ".jpeg") {
      valid = header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    } else if (extension === ".gif") {
      const signature = header.subarray(0, 6).toString("ascii");
      valid = signature === "GIF87a" || signature === "GIF89a";
    } else if (extension === ".webp") {
      valid = header.subarray(0, 4).toString("ascii") === "RIFF"
        && header.subarray(8, 12).toString("ascii") === "WEBP";
    } else if (extension === ".avif") {
      const brands = header.subarray(8, 32).toString("ascii");
      valid = isIsoBmff(header) && (brands.includes("avif") || brands.includes("avis"));
    }
  } else if (extension === ".webm") {
    valid = header.length >= 4
      && header[0] === 0x1a && header[1] === 0x45
      && header[2] === 0xdf && header[3] === 0xa3;
  } else {
    valid = isIsoBmff(header);
  }
  if (!valid) {
    throw new Error(`${kind} bytes do not match the ${extension} extension: ${path}`);
  }
}

function resolveSource(authoredPage, src, kind) {
  const { extension, mimeType } = expectedType(src, kind);
  const lexical = kind === "figure"
    ? resolve(REPO, src)
    : resolve(dirname(authoredPage), src);
  if (!isWithin(RESEARCH, lexical) || lexical === RESEARCH) {
    throw new Error(`Refusing ${kind} path outside this worktree's research/ mount: ${src}`);
  }
  if (!existsSync(lexical)) return { status: "missing" };

  const canonical = canonicalPath(lexical);
  canonicalResearchName(canonical);
  const stats = statSync(canonical);
  if (!stats.isFile()) throw new Error(`${kind} source is not a regular file: ${src}`);
  if (stats.size === 0) throw new Error(`${kind} source is empty: ${src}`);
  validateSignature(canonical, extension, kind);
  return {
    status: "present",
    canonical,
    canonicalResearchPath: canonicalResearchName(canonical),
    extension,
    mimeType,
    bytes: stats.size,
  };
}

function sha256(path) {
  const hash = createHash("sha256");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  const fd = openSync(path, "r");
  try {
    for (;;) {
      const count = readSync(fd, buffer, 0, buffer.length, null);
      if (count === 0) break;
      hash.update(buffer.subarray(0, count));
    }
  } finally {
    closeSync(fd);
  }
  return hash.digest("hex");
}

function safeFlatName(preferred, fallback, extension) {
  const preferredExtension = extname(preferred);
  const rawStem = basename(preferred, preferredExtension);
  const stem = rawStem
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[. -]+$/g, "")
    .replace(/^[. ]+/g, "");
  return `${stem || fallback}${extension}`;
}

function allocateName(preferred, fallback, extension, used) {
  const flat = safeFlatName(preferred, fallback, extension);
  const stem = basename(flat, extension);
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? flat : `${stem}-${n}${extension}`;
    // The folder is advertised as portable, so reserve case-insensitively even
    // when the builder itself runs on a case-sensitive filesystem.
    const key = candidate.toLowerCase();
    if (!used.has(key)) {
      used.add(key);
      return candidate;
    }
  }
}

/** A flat, readable filename for a figure, derived from its source path. */
function figureName(src, extension) {
  const portable = src.replaceAll("\\", "/");
  // research/1910.06389v2-llm/figures/fig-2.1/visual.png -> monograph-fig-2.1.png
  let m = /1910\.06389v2-llm\/figures\/fig-([^/]+)\//.exec(portable);
  if (m) return `monograph-fig-${m[1]}${extension}`;
  // research/figures/some-crop.png -> some-crop.png
  return basename(portable);
}

function noteSource(map, src, pagePath, record) {
  let entry = map.get(src);
  if (!entry) {
    entry = {
      source: src,
      pages: new Set(),
      canonical: record?.canonical,
      canonicalResearchPath: record?.canonicalResearchPath,
      copiedFilename: record?.name,
      copiedPath: record?.copiedPath,
      mimeType: record?.mimeType,
      bytes: record?.bytes,
      sourceSha256: record?.sourceSha256,
      outputSha256: record?.outputSha256,
      status: record ? "copied" : "missing",
    };
    map.set(src, entry);
  } else if (record && entry.canonical !== record.canonical) {
    throw new Error(`The same authored source resolves to different canonical files: ${src}`);
  }
  entry.pages.add(pagePath);
}

function manifestEntry(entry) {
  const { canonical: _canonical, pages, ...portable } = entry;
  return { ...portable, pages: [...pages].sort() };
}

/* -------------------------------------------------------------------- build */

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(FIGDIR, { recursive: true });
mkdirSync(MEDIADIR, { recursive: true });

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
pages.sort();

const expectedPages = Object.keys(JSON.parse(readFileSync(SITE_MANIFEST, "utf8"))).sort();
const builtPages = pages.map((page) => slash(relative(OUT, page))).sort();
if (JSON.stringify(builtPages) !== JSON.stringify(expectedPages)) {
  throw new Error(
    `Offline build page set does not match site-manifest.json: expected ${expectedPages.length}, built ${builtPages.length}`,
  );
}

const copied = new Map(); // canonical absolute source -> copy record
const copiedMedia = new Map();
const figureSources = new Map();
const videoSources = new Map();
const usedFigureNames = new Set();
const usedMediaNames = new Set();
let rewritten = 0;
let mediaRewritten = 0;

for (const page of pages) {
  let html = readFileSync(page, "utf8");
  const pagePath = slash(relative(OUT, page));
  const authoredPage = join(SRC, relative(OUT, page));
  const pageDepth = relative(OUT, dirname(page)) === "" ? 0 : 1;
  const base = "../".repeat(pageDepth) + "figures/";

  html = html.replace(/data-src="([^"]+)"/g, (whole, src) => {
    const source = resolveSource(authoredPage, src, "figure");
    if (source.status === "missing") {
      noteSource(figureSources, src, pagePath);
      return whole;
    }

    let record = copied.get(source.canonical);
    if (!record) {
      const name = allocateName(
        figureName(src, source.extension),
        "figure",
        source.extension,
        usedFigureNames,
      );
      const output = join(FIGDIR, name);
      const sourceSha256 = sha256(source.canonical);
      copyFileSync(source.canonical, output);
      const outputSha256 = sha256(output);
      if (sourceSha256 !== outputSha256) {
        throw new Error(`Copied figure hash mismatch: ${src}`);
      }
      record = {
        ...source,
        name,
        copiedPath: `figures/${name}`,
        sourceSha256,
        outputSha256,
      };
      copied.set(source.canonical, record);
    }
    noteSource(figureSources, src, pagePath, record);
    rewritten++;
    return `data-src="${record.name}"`;
  });

  html = html.replace(/data-offline-video-source="([^"]+)"/g, (whole, src) => {
    const source = resolveSource(authoredPage, src, "video");
    if (source.status === "missing") {
      noteSource(videoSources, src, pagePath);
      return whole;
    }

    let record = copiedMedia.get(source.canonical);
    if (!record) {
      const name = allocateName(
        basename(src.replaceAll("\\", "/")),
        "source-movie",
        source.extension,
        usedMediaNames,
      );
      const output = join(MEDIADIR, name);
      const sourceSha256 = sha256(source.canonical);
      copyFileSync(source.canonical, output);
      const outputSha256 = sha256(output);
      if (sourceSha256 !== outputSha256) {
        throw new Error(`Copied video hash mismatch: ${src}`);
      }
      record = {
        ...source,
        name,
        copiedPath: `media/${name}`,
        sourceSha256,
        outputSha256,
      };
      copiedMedia.set(source.canonical, record);
    }
    noteSource(videoSources, src, pagePath, record);
    mediaRewritten++;
    return `data-local-video="${"../".repeat(pageDepth)}media/${record.name}"`;
  });

  // Point the page at the local figures folder instead of the repository root.
  html = html.replace(/<body([^>]*)data-depth="(\d+)"([^>]*)>/,
    (_m, a, d, b) => `<body${a}data-depth="${d}" data-figure-base="${base}"${b}>`);

  writeFileSync(page, html, "utf8");
}

/* ------------------------------------------------------------------- README */

const bytes = [...copied.values()]
  .reduce((n, record) => n + record.bytes, 0);
const mediaBytes = [...copiedMedia.values()]
  .reduce((n, record) => n + record.bytes, 0);

writeFileSync(join(OUT, "README.txt"), `Snow Crystals — personal local copy
===================================

Open index.html in a browser. Everything works offline; locally cached source
figures and video are included beside the pages so this folder can be moved or
copied anywhere for personal study.

DO NOT PUBLISH THIS FOLDER.

The ${copied.size} images in figures/ and ${copiedMedia.size} video file(s) in
media/ are copyrighted third-party research media, reproduced here for personal
reading only. Each page names its source and rightsholder where known. These
files are not part of the project repository and are not in the published site,
which shows citation cards pointing at the original sources instead. Putting
this folder on a web server, in a git repository, or in shared storage would
republish someone else's work.

source-media-map.json records each authored source, copied filename, byte
length, and source/output SHA-256 hashes so the offline verifier can derive its
media-copy verdict from the built bytes.

See docs/decisions/0004-research-media-not-versioned.md in the repository.

Rebuild with:  node docs/education/tools/build-local.mjs
`, "utf8");

/* ------------------------------------------------------------------- report */

const sourceMap = {
  schemaVersion: 1,
  buildKind: "personal-offline-education",
  figures: [...figureSources.values()].map(manifestEntry)
    .sort((a, b) => a.source.localeCompare(b.source)),
  videos: [...videoSources.values()].map(manifestEntry)
    .sort((a, b) => a.source.localeCompare(b.source)),
};
writeFileSync(SOURCE_MAP, `${JSON.stringify(sourceMap, null, 2)}\n`, "utf8");
const missingFigures = sourceMap.figures.filter((entry) => entry.status === "missing");
const missingVideos = sourceMap.videos.filter((entry) => entry.status === "missing");

console.log(`Built ${OUT}`);
console.log(`  ${pages.length} pages`);
console.log(`  ${copied.size} figures copied (${(bytes / 1024 / 1024).toFixed(1)} MB), ${rewritten} references rewritten`);
console.log(`  ${copiedMedia.size} local video(s) copied (${(mediaBytes / 1024 / 1024).toFixed(1)} MB), ${mediaRewritten} references rewritten`);
if (missingFigures.length) {
  console.log(`  ${missingFigures.length} figure(s) not in your local cache; those keep the cited placeholder:`);
  for (const entry of missingFigures.slice(0, 10)) console.log(`    ${entry.source}`);
}
if (missingVideos.length) {
  console.log(`  ${missingVideos.length} local video(s) absent; those keep the rights-aware source card:`);
  for (const entry of missingVideos.slice(0, 10)) console.log(`    ${entry.source}`);
}
console.log(`  source/copy hash map: ${SOURCE_MAP}`);
console.log(`\nOpen: ${join(OUT, "index.html")}`);
console.log("This folder contains copyrighted source media. Personal use only — do not publish it.");
