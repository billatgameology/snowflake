// Gut-check spike (docs/plans/explore-gg-realism-gutcheck.md, "large-artifact inventory" WP):
// scan out/gutcheck-gg-realism/large/ and rebuild tracked/inventory.json (relpath, bytes,
// sha256 per file — the git-tracked ledger of the gitignored binaries), then optionally zip
// whole groups for off-machine backup (Dropbox etc.):
//
//   node scripts/gutcheck-archive-pack.ts                 # inventory refresh only
//   node scripts/gutcheck-archive-pack.ts --pack all      # + zip every group into archives/
//   node scripts/gutcheck-archive-pack.ts --pack meshes,anim-B
//   node scripts/gutcheck-archive-pack.ts --pack all --level 6   # deflate level (default 1)
//
// Groups are the top-level folders under large/ (checkpoints, meshes, figs, anim-B, ...).
// Zip entries are rooted at "large/<group>/..." so scripts/gutcheck-archive-restore.ts can
// place them unambiguously. sha256 hashing is cached by (relpath, bytes, mtimeMs) so a
// refresh does not re-hash unchanged multi-GB files. Archives previously recorded in the
// ledger stay recorded even after the local zip is deleted (the upload may outlive it).

import { createHash } from "node:crypto";
import {
  createReadStream,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

// Script-location-relative, so invocation from any CWD resolves the same tree.
const ROOT = resolve(import.meta.dirname, "..", "out/gutcheck-gg-realism");
const LARGE = join(ROOT, "large");
const TRACKED_DIR = join(ROOT, "tracked");
const INVENTORY = join(TRACKED_DIR, "inventory.json");
const ARCHIVES = join(ROOT, "archives");

interface FileEntry {
  /** posix-style; relative to large/ when root is "large", else relative to OUT. */
  relPath: string;
  group: string;
  bytes: number;
  mtimeMs: number;
  sha256: string;
  /** Omitted (legacy) or "large" = under large/. "out" = the workspace evidence layer. */
  root?: "large" | "out";
}
interface ArchiveEntry {
  name: string;
  group: string;
  createdAt: string;
  bytes: number;
  sha256: string;
  fileCount: number;
  totalBytes: number;
}
interface Inventory {
  format: "gutcheck-large-inventory-v1";
  generated: string;
  root: string; // repo-relative location the relPaths are under
  files: FileEntry[];
  archives: ArchiveEntry[];
}

function parseArgs(): { pack: string[] | "all" | null; level: number } {
  const argv = process.argv.slice(2);
  let pack: string[] | "all" | null = null;
  let level = 1;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--pack") {
      const value = argv[++i];
      if (value === undefined) throw new Error("--pack needs a value (all or group,group)");
      pack = value === "all" ? "all" : value.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg === "--level") {
      level = Number(argv[++i]);
      if (!Number.isInteger(level) || level < 0 || level > 9) {
        throw new Error("--level must be an integer 0..9");
      }
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return { pack, level };
}

function sha256File(path: string): Promise<string> {
  return new Promise((resolvePromise, rejectPromise) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("error", rejectPromise);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolvePromise(hash.digest("hex")));
  });
}

function walk(dir: string, base: string, acc: string[]): void {
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith(".")) continue;
    const full = join(dir, name);
    const rel = base === "" ? name : `${base}/${name}`;
    if (statSync(full).isDirectory()) walk(full, rel, acc);
    else acc.push(rel);
  }
}

function loadPrior(): Inventory | null {
  try {
    const parsed = JSON.parse(readFileSync(INVENTORY, "utf8")) as Inventory;
    return parsed.format === "gutcheck-large-inventory-v1" ? parsed : null;
  } catch {
    return null;
  }
}

function formatBytes(n: number): string {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024).toFixed(1)} KB`;
}

async function main(): Promise<void> {
  const { pack, level } = parseArgs();
  const prior = loadPrior();
  // Cache key namespaces the two roots so an "out"-rooted figs/x.png can never be matched
  // against a "large"-rooted figs/x.png.
  const priorByPath = new Map<string, FileEntry>(
    (prior?.files ?? []).map((f) => [f.root === "out" ? `out:${f.relPath}` : f.relPath, f]),
  );

  // Two roots. large/ holds the heavy binaries, grouped by kind. The workspace layer —
  // run records the coverage table cites, renders, composites, specs, logs — lives beside
  // it under OUT and is equally unrecoverable if lost (gitignored, and not regenerable
  // without re-running the sweep), so it is inventoried and packed as the "extras" group.
  const EXTRAS_SKIP = new Set(["large", "archives", "site", "tracked"]);
  const relPaths: string[] = [];
  walk(LARGE, "", relPaths);
  const extraPaths: string[] = [];
  for (const name of readdirSync(ROOT).sort()) {
    if (name.startsWith(".") || EXTRAS_SKIP.has(name)) continue;
    // Loose .zip/.tar files at OUT root are transfer bundles (Finder "Compress" on
    // archives/ produces exactly this) — packing one into an archive would duplicate
    // gigabytes and nest the archive set inside itself.
    if (/\.(zip|tar|tar\.gz|tgz)$/i.test(name)) continue;
    const full = join(ROOT, name);
    if (statSync(full).isDirectory()) walk(full, name, extraPaths);
    else extraPaths.push(name);
  }

  const files: FileEntry[] = [];
  let hashed = 0;
  let reused = 0;
  for (const relPath of relPaths) {
    const full = join(LARGE, relPath);
    const st = statSync(full);
    const group = relPath.split("/")[0]!;
    const cached = priorByPath.get(relPath);
    if (cached !== undefined && cached.bytes === st.size && cached.mtimeMs === st.mtimeMs) {
      files.push({ relPath, group, bytes: st.size, mtimeMs: st.mtimeMs, sha256: cached.sha256 });
      reused++;
    } else {
      const digest = await sha256File(full);
      files.push({ relPath, group, bytes: st.size, mtimeMs: st.mtimeMs, sha256: digest });
      hashed++;
    }
  }

  for (const relPath of extraPaths) {
    const full = join(ROOT, relPath);
    const st = statSync(full);
    const cached = priorByPath.get(`out:${relPath}`);
    if (cached !== undefined && cached.bytes === st.size && cached.mtimeMs === st.mtimeMs) {
      files.push({ relPath, group: "extras", bytes: st.size, mtimeMs: st.mtimeMs, sha256: cached.sha256, root: "out" });
      reused++;
    } else {
      const digest = await sha256File(full);
      files.push({ relPath, group: "extras", bytes: st.size, mtimeMs: st.mtimeMs, sha256: digest, root: "out" });
      hashed++;
    }
  }

  const groups = [...new Set(files.map((f) => f.group))].sort();
  const archives: ArchiveEntry[] = [...(prior?.archives ?? [])];

  // Atomic (temp + rename) so a crash mid-write can never truncate the tracked ledger,
  // and written after hashing and again after every archive so no completed work is lost
  // to a later failure.
  const writeInventory = (): void => {
    mkdirSync(TRACKED_DIR, { recursive: true });
    const inventory: Inventory = {
      format: "gutcheck-large-inventory-v1",
      generated: new Date().toISOString(),
      root: "out/gutcheck-gg-realism/large",
      files,
      archives: [...archives].sort((a, b) => a.name.localeCompare(b.name)),
    };
    const tmpPath = join(TRACKED_DIR, ".inventory.json.tmp");
    writeFileSync(tmpPath, JSON.stringify(inventory, null, 1));
    renameSync(tmpPath, INVENTORY);
  };

  const packGroups = pack === null ? [] : pack === "all" ? groups : pack;
  for (const group of packGroups) {
    if (!groups.includes(group)) throw new Error(`unknown group "${group}" (have: ${groups.join(", ")})`);
  }
  writeInventory();

  for (const group of packGroups) {
    mkdirSync(ARCHIVES, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const name = `gutcheck-large-${group}-${stamp}.zip`;
    const zipPath = join(ARCHIVES, name);
    // zip -r against an existing archive UPDATES it in place, resurrecting entries for
    // files deleted since the previous pack — always start from a fresh archive.
    rmSync(zipPath, { force: true });
    console.log(`packing ${group} -> archives/${name} (deflate level ${level}) ...`);
    // -x '*/.*' keeps dot-prefixed names (.DS_Store etc.) out of the zip so the archive
    // holds exactly the file set the inventory walk hashed. The extras group zips the
    // workspace layer at OUT root (entries like "figs/fig38-record.json"); every other
    // group zips its large/ subtree.
    const targets =
      group === "extras"
        ? [...new Set(extraPaths.map((p) => p.split("/")[0]!))]
        : [`large/${group}`];
    const result = spawnSync(
      "zip",
      ["-r", "-q", `-${level}`, zipPath, ...targets, "-x", "*/.*", "-x", "archives/*", "-x", "site/*", "-x", "large/*"],
      { cwd: ROOT, stdio: "inherit" },
    );
    if (result.status !== 0) throw new Error(`zip failed for group ${group} (status ${result.status})`);
    const zipStat = statSync(zipPath);
    const zipSha = await sha256File(zipPath);
    const members = files.filter((f) => f.group === group);
    const entry: ArchiveEntry = {
      name,
      group,
      createdAt: new Date().toISOString(),
      bytes: zipStat.size,
      sha256: zipSha,
      fileCount: members.length,
      totalBytes: members.reduce((acc, f) => acc + f.bytes, 0),
    };
    const existing = archives.findIndex((a) => a.name === name);
    if (existing >= 0) archives[existing] = entry;
    else archives.push(entry);
    writeInventory();
    console.log(`  ${formatBytes(zipStat.size)}  sha256 ${zipSha}`);
  }

  console.log(`inventory: ${files.length} files (${hashed} hashed, ${reused} cached) in ${groups.length} groups`);
  for (const group of groups) {
    const members = files.filter((f) => f.group === group);
    console.log(
      `  ${group.padEnd(12)} ${String(members.length).padStart(4)} files  ${formatBytes(
        members.reduce((acc, f) => acc + f.bytes, 0),
      )}`,
    );
  }
  console.log(`wrote ${INVENTORY}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
