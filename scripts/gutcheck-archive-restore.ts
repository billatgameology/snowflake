// Gut-check spike (docs/plans/explore-gg-realism-gutcheck.md, "large-artifact inventory" WP):
// restore a gutcheck-large-*.zip produced by scripts/gutcheck-archive-pack.ts back into the
// out/ tree, verifying every file's sha256 against the git-tracked inventory:
//
//   node scripts/gutcheck-archive-restore.ts <path/to/zip>            # into out/gutcheck-gg-realism
//   node scripts/gutcheck-archive-restore.ts <zip> --dest <dir>       # elsewhere (tests, staging)
//   node scripts/gutcheck-archive-restore.ts <zip> --force            # overwrite differing files
//
// Extraction uses bsdtar (`tar -xf`, reads zip; ships with macOS and Windows 10+), into a
// temp dir on the destination volume, so placement is an atomic same-volume rename. Entry
// names must all sit under "large/" with no absolute or ".." components, or the archive is
// rejected outright. Verification statuses per file:
//   OK          sha256 matches tracked/inventory.json
//   SKIP        an identical file (same hash) is already in place
//   UNVERIFIED  placed, but the relpath is not in the inventory (exit stays 0; investigate)
//   MISMATCH    hash differs from inventory — file is NOT placed; exit 1
//   EXISTS      destination file exists with different content and no --force; NOT placed; exit 1
// The inventory read is always the repo's tracked/inventory.json (run from the repo root),
// regardless of --dest, so a fresh clone verifies a Dropbox download against git history.

import { createHash } from "node:crypto";
import {
  createReadStream,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = resolve("out/gutcheck-gg-realism");
const INVENTORY = join(ROOT, "tracked", "inventory.json");

interface FileEntry {
  relPath: string;
  sha256: string;
  bytes: number;
}
interface Inventory {
  format: string;
  files: FileEntry[];
}

function parseArgs(): { zipPath: string; dest: string; force: boolean } {
  const argv = process.argv.slice(2);
  let zipPath: string | null = null;
  let dest = ROOT;
  let force = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--dest") {
      const value = argv[++i];
      if (value === undefined) throw new Error("--dest needs a directory");
      dest = resolve(value);
    } else if (arg === "--force") {
      force = true;
    } else if (zipPath === null) {
      zipPath = resolve(arg);
    } else {
      throw new Error(`unexpected argument: ${arg}`);
    }
  }
  if (zipPath === null) {
    throw new Error("usage: node scripts/gutcheck-archive-restore.ts <zip> [--dest <dir>] [--force]");
  }
  return { zipPath, dest, force };
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

function listEntries(zipPath: string): string[] {
  const result = spawnSync("tar", ["-tf", zipPath], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`tar -tf failed: ${result.stderr}`);
  return result.stdout.split("\n").filter((line) => line.length > 0);
}

async function main(): Promise<void> {
  const { zipPath, dest, force } = parseArgs();
  statSync(zipPath);

  const entries = listEntries(zipPath);
  const fileEntries: string[] = [];
  for (const entry of entries) {
    if (entry.startsWith("/") || entry.split("/").includes("..")) {
      throw new Error(`unsafe entry path, refusing archive: ${entry}`);
    }
    if (!entry.startsWith("large/")) {
      throw new Error(`entry outside large/, not a gutcheck archive: ${entry}`);
    }
    if (!entry.endsWith("/")) fileEntries.push(entry);
  }
  if (fileEntries.length === 0) throw new Error("archive contains no files");

  let inventoryByPath = new Map<string, FileEntry>();
  try {
    const inventory = JSON.parse(readFileSync(INVENTORY, "utf8")) as Inventory;
    inventoryByPath = new Map(inventory.files.map((f) => [`large/${f.relPath}`, f]));
  } catch {
    console.warn(`warning: could not read ${INVENTORY}; every file will be UNVERIFIED`);
  }

  mkdirSync(dest, { recursive: true });
  const tmp = mkdtempSync(join(dest, ".restore-tmp-"));
  const counts = { OK: 0, SKIP: 0, UNVERIFIED: 0, MISMATCH: 0, EXISTS: 0 };
  try {
    const extract = spawnSync("tar", ["-xf", zipPath, "-C", tmp], { stdio: "inherit" });
    if (extract.status !== 0) throw new Error(`tar -xf failed (status ${extract.status})`);

    for (const entry of fileEntries) {
      const extracted = join(tmp, entry);
      const target = join(dest, entry);
      const digest = await sha256File(extracted);
      const expected = inventoryByPath.get(entry);

      if (expected !== undefined && digest !== expected.sha256) {
        console.error(`MISMATCH   ${entry}\n  expected ${expected.sha256}\n  archive  ${digest}`);
        counts.MISMATCH++;
        continue;
      }

      let existingSha: string | null = null;
      try {
        statSync(target);
        existingSha = await sha256File(target);
      } catch {
        /* target absent */
      }
      if (existingSha === digest) {
        counts.SKIP++;
        continue;
      }
      if (existingSha !== null && !force) {
        console.error(`EXISTS     ${entry} (destination differs; rerun with --force to overwrite)`);
        counts.EXISTS++;
        continue;
      }

      mkdirSync(dirname(target), { recursive: true });
      renameSync(extracted, target);
      if (expected === undefined) {
        console.warn(`UNVERIFIED ${entry} (placed; not in tracked inventory)`);
        counts.UNVERIFIED++;
      } else {
        counts.OK++;
      }
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  console.log(
    `restored to ${dest}: ${counts.OK} verified, ${counts.SKIP} already present, ` +
      `${counts.UNVERIFIED} unverified, ${counts.MISMATCH} mismatched, ${counts.EXISTS} blocked`,
  );
  if (counts.MISMATCH > 0 || counts.EXISTS > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
