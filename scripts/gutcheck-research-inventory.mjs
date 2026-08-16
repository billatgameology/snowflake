// Inventory private research media without tracking the third-party bytes themselves.
//
// The tracked prose indexes preserve source context but do not enumerate the cache. This writes
// the per-file path/size/hash manifest that makes the named media scope auditable and restorable.
//
//   node scripts/gutcheck-research-inventory.mjs --root <path/to/research> [--out <file>]
//        [--all]   include every file, not just media
//
// Scope is MEDIA by default. Derived text can greatly outnumber the images, video, and PDFs;
// hashing all of it mostly describes our own extraction output rather than the copyright risk or
// irreplaceable inputs. The media is what cannot be re-derived, so the media is what is listed.
//
// The manifest carries paths, sizes and hashes ONLY. No media, no captions, no extracted
// text — nothing third-party — so it is safe to track even though everything it describes is
// deliberately untracked.
//
// The private loose cache lives under share-relative
// `collections/research-private-freeze/2026-08-11/payload/`; a worktree normally carries only
// tracked indexes. Run with --root pointed at that collection or a staged extraction. See
// docs/local-assets.md.

import { createHash } from "node:crypto";
import { createReadStream, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, posix, relative, resolve, sep } from "node:path";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d;
};

const root = resolve(arg("root", "research"));
const outPath = resolve(arg("out", "research/media-inventory.json"));

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile()) acc.push(full);
  }
  return acc;
}

function sha256(path) {
  return new Promise((ok, fail) => {
    const h = createHash("sha256");
    const s = createReadStream(path);
    s.on("error", fail);
    s.on("data", (c) => h.update(c));
    s.on("end", () => ok(h.digest("hex")));
  });
}

const MEDIA = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".tif", ".tiff", ".pdf", ".mp4", ".mov", ".webm"]);
const includeAll = process.argv.includes("--all");
const all = walk(root).filter((f) => resolve(f) !== outPath);
const files = all
  .filter((f) => includeAll || MEDIA.has(f.slice(f.lastIndexOf(".")).toLowerCase()))
  .sort();
console.log(
  `hashing ${files.length} of ${all.length} files under ${root}` +
    (includeAll ? " (all)" : " (media only; --all for everything)"),
);

const entries = [];
let bytes = 0;
for (let i = 0; i < files.length; i++) {
  const f = files[i];
  // POSIX separators so the manifest is identical whichever OS produced it.
  const rel = relative(root, f).split(sep).join(posix.sep);
  const size = statSync(f).size;
  entries.push({ path: rel, bytes: size, sha256: await sha256(f), group: rel.split("/")[0] });
  bytes += size;
  if ((i + 1) % 200 === 0) console.log(`  ${i + 1}/${files.length}`);
}

const groups = {};
for (const e of entries) {
  const g = (groups[e.group] ??= { files: 0, bytes: 0 });
  g.files++;
  g.bytes += e.bytes;
}

writeFileSync(
  outPath,
  JSON.stringify(
    {
      format: "gutcheck-research-inventory-v1",
      note:
        "Per-file manifest of the unversioned research/ media cache. Paths, sizes and hashes " +
        "only — no third-party content. See docs/local-assets.md for where the bytes live.",
      scope: includeAll ? "all files" : "media only (images, video, PDF)",
      generated: new Date().toISOString(),
      root: "research",
      totals: { files: entries.length, bytes, filesInTree: all.length },
      groups: Object.fromEntries(
        Object.entries(groups).sort((a, b) => b[1].bytes - a[1].bytes),
      ),
      files: entries,
    },
    null,
    1,
  ),
);

console.log(`\n${entries.length} files, ${(bytes / 1e9).toFixed(2)} GB -> ${outPath}`);
for (const [g, v] of Object.entries(groups).sort((a, b) => b[1].bytes - a[1].bytes)) {
  console.log(`  ${String(v.files).padStart(5)}  ${(v.bytes / 1e6).toFixed(0).padStart(7)} MB  ${g}`);
}
