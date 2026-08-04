// Gut-check spike (docs/plans/explore-gg-realism-gutcheck.md, "large-artifact inventory" WP):
// restore a gutcheck-large-*.zip produced by scripts/gutcheck-archive-pack.ts back into the
// out/ tree, verifying every file's sha256 against the git-tracked inventory:
//
//   node scripts/gutcheck-archive-restore.ts <path/to/zip>            # into out/gutcheck-gg-realism
//   node scripts/gutcheck-archive-restore.ts <zip> --dest <dir>       # elsewhere (tests, staging)
//   node scripts/gutcheck-archive-restore.ts <zip> --force            # overwrite differing files
//
// Fail-closed by design (2026-08-04 adversarial review, recorded in the plan):
// - tracked/inventory.json missing or unreadable is a hard abort, never a warning;
// - the zip's own sha256 is checked against the inventory's archives ledger first — a
//   same-named ledger entry with a different hash (corrupted/partial download) aborts;
// - archive entries are vetted by NAME (must sit under "large/", no absolute or ".."
//   or backslash components) and by TYPE (`tar -tvf`; only regular files and directories
//   pass — symlinks/FIFOs/devices abort before extraction);
// - extraction uses bsdtar (`tar -xf`, reads zip; ships with macOS and Windows 10+) into a
//   temp dir under --dest; placement renames per file (copy fallback across volumes) and a
//   SIGINT/SIGTERM mid-run removes the temp dir.
// Per-file statuses:
//   OK          sha256 matches tracked/inventory.json
//   SKIP        an identical file (same hash) is already in place
//   UNVERIFIED  placed, but the relpath is not in the inventory — exit 1 (investigate)
//   MISMATCH    hash differs from inventory — file is NOT placed; exit 1
//   EXISTS      destination file exists with different content and no --force; NOT placed; exit 1
//   ERROR       this entry failed (unreadable destination, extraction gap, ...); exit 1
// The inventory read is always the repo's tracked/inventory.json (resolved relative to this
// script, not the CWD), so a fresh clone verifies a Dropbox download against git history.

import { createHash } from "node:crypto";
import {
  copyFileSync,
  createReadStream,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..", "out/gutcheck-gg-realism");
const INVENTORY = join(ROOT, "tracked", "inventory.json");

interface FileEntry {
  relPath: string;
  sha256: string;
  bytes: number;
}
interface ArchiveEntry {
  name: string;
  group: string;
  sha256: string;
  bytes: number;
}
interface Inventory {
  format: string;
  files: FileEntry[];
  archives?: ArchiveEntry[];
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

function loadInventory(): Inventory {
  let raw: string;
  try {
    raw = readFileSync(INVENTORY, "utf8");
  } catch (error) {
    throw new Error(
      `cannot read ${INVENTORY} — restore verifies against the tracked inventory and refuses ` +
        `to run blind (${error instanceof Error ? error.message : String(error)})`,
    );
  }
  const parsed = JSON.parse(raw) as Inventory;
  if (parsed.format !== "gutcheck-large-inventory-v1" || !Array.isArray(parsed.files)) {
    throw new Error(`${INVENTORY} has unexpected format "${parsed.format}" — refusing to run blind`);
  }
  return parsed;
}

// `tar -tvf` lines look like "-rw-r--r--  0 clipper staff  123 Jan  1 00:00 large/x/y.bin".
// The leading mode character is the entry type; the name is everything after the timestamp
// columns. Parsing the name from -tv output is brittle across tar builds, so entry TYPES
// come from -tv and entry NAMES from plain -t, and the counts must agree.
function listEntries(zipPath: string): { names: string[]; badTypes: string[] } {
  const t = spawnSync("tar", ["-tf", zipPath], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (t.status !== 0) throw new Error(`tar -tf failed: ${t.stderr}`);
  const names = t.stdout.split("\n").filter((line) => line.length > 0);
  const tv = spawnSync("tar", ["-tvf", zipPath], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (tv.status !== 0) throw new Error(`tar -tvf failed: ${tv.stderr}`);
  const tvLines = tv.stdout.split("\n").filter((line) => line.length > 0);
  if (tvLines.length !== names.length) {
    throw new Error(`tar -t and tar -tv disagree on entry count (${names.length} vs ${tvLines.length})`);
  }
  const badTypes: string[] = [];
  for (let i = 0; i < tvLines.length; i++) {
    const typeChar = tvLines[i]![0];
    if (typeChar !== "-" && typeChar !== "d") {
      badTypes.push(`${names[i]} (type '${typeChar}')`);
    }
  }
  return { names, badTypes };
}

async function main(): Promise<void> {
  const { zipPath, dest, force } = parseArgs();
  statSync(zipPath);
  const inventory = loadInventory();
  const inventoryByPath = new Map(inventory.files.map((f) => [`large/${f.relPath}`, f]));

  // Verify the archive itself against the ledger before trusting its contents.
  const zipSha = await sha256File(zipPath);
  const zipName = basename(zipPath);
  const ledger = inventory.archives ?? [];
  const byName = ledger.find((a) => a.name === zipName);
  if (byName !== undefined && byName.sha256 !== zipSha) {
    throw new Error(
      `archive hash mismatch for ${zipName}:\n  ledger  ${byName.sha256}\n  actual  ${zipSha}\n` +
        `The download is corrupted or partial — refusing to extract.`,
    );
  }
  if (byName === undefined) {
    const bySha = ledger.find((a) => a.sha256 === zipSha);
    if (bySha !== undefined) {
      console.log(`archive matches ledger entry ${bySha.name} (renamed copy) — ok`);
    } else {
      console.warn(
        `warning: ${zipName} is not in the archives ledger (older/newer inventory?); ` +
          `individual files are still verified below`,
      );
    }
  } else {
    console.log(`archive verified against ledger: ${zipName}`);
  }

  const { names, badTypes } = listEntries(zipPath);
  if (badTypes.length > 0) {
    throw new Error(
      `archive contains non-regular entries, refusing to extract:\n  ${badTypes.join("\n  ")}`,
    );
  }
  const fileEntries: string[] = [];
  for (const entry of names) {
    if (entry.startsWith("/") || entry.includes("\\") || entry.split("/").includes("..")) {
      throw new Error(`unsafe entry path, refusing archive: ${entry}`);
    }
    if (!entry.startsWith("large/")) {
      throw new Error(`entry outside large/, not a gutcheck archive: ${entry}`);
    }
    if (!entry.endsWith("/")) fileEntries.push(entry);
  }
  if (fileEntries.length === 0) throw new Error("archive contains no files");

  mkdirSync(dest, { recursive: true });
  const tmp = mkdtempSync(join(dest, ".restore-tmp-"));
  const cleanup = (): void => rmSync(tmp, { recursive: true, force: true });
  const onSignal = (signal: string): void => {
    cleanup();
    console.error(`\n${signal}: removed temp dir, destination untouched beyond files already placed`);
    process.exit(1);
  };
  process.on("SIGINT", () => onSignal("SIGINT"));
  process.on("SIGTERM", () => onSignal("SIGTERM"));

  const counts = { OK: 0, SKIP: 0, UNVERIFIED: 0, MISMATCH: 0, EXISTS: 0, ERROR: 0 };
  try {
    const extract = spawnSync("tar", ["-xf", zipPath, "-C", tmp], { stdio: "inherit" });
    if (extract.status !== 0) throw new Error(`tar -xf failed (status ${extract.status})`);

    for (const entry of fileEntries) {
      try {
        const extracted = join(tmp, entry);
        const target = join(dest, entry);
        if (!lstatSync(extracted).isFile()) {
          console.error(`ERROR      ${entry} extracted as a non-regular file`);
          counts.ERROR++;
          continue;
        }
        const digest = await sha256File(extracted);
        const expected = inventoryByPath.get(entry);

        if (expected !== undefined && digest !== expected.sha256) {
          console.error(`MISMATCH   ${entry}\n  expected ${expected.sha256}\n  archive  ${digest}`);
          counts.MISMATCH++;
          continue;
        }

        // Distinguish "target absent" (restore proceeds) from "target unreadable"
        // (refuse — an EACCES/EIO must never be treated as an empty slot).
        let existingSha: string | null = null;
        try {
          statSync(target);
          existingSha = await sha256File(target);
        } catch (error) {
          const code = (error as NodeJS.ErrnoException).code;
          if (code !== "ENOENT") {
            console.error(`ERROR      ${entry} destination unreadable (${code}); not placed`);
            counts.ERROR++;
            continue;
          }
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
        try {
          renameSync(extracted, target);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
          copyFileSync(extracted, target);
          rmSync(extracted, { force: true });
        }
        if (expected === undefined) {
          console.warn(`UNVERIFIED ${entry} (placed; not in tracked inventory)`);
          counts.UNVERIFIED++;
        } else {
          counts.OK++;
        }
      } catch (error) {
        console.error(
          `ERROR      ${entry}: ${error instanceof Error ? error.message : String(error)}`,
        );
        counts.ERROR++;
      }
    }
  } finally {
    cleanup();
  }

  // Completeness note: inventory files in this archive's groups that the archive lacks.
  const groupsInArchive = new Set(fileEntries.map((e) => e.split("/")[1]!));
  const missing = inventory.files.filter(
    (f) => groupsInArchive.has(f.relPath.split("/")[0]!) && !fileEntries.includes(`large/${f.relPath}`),
  );
  if (missing.length > 0) {
    console.warn(
      `note: ${missing.length} inventory file(s) in group(s) ${[...groupsInArchive].join(", ")} ` +
        `are not in this archive (stale or partial pack?) — first: ${missing[0]!.relPath}`,
    );
  }

  console.log(
    `restored to ${dest}: ${counts.OK} verified, ${counts.SKIP} already present, ` +
      `${counts.UNVERIFIED} unverified, ${counts.MISMATCH} mismatched, ${counts.EXISTS} blocked, ` +
      `${counts.ERROR} errors`,
  );
  if (counts.MISMATCH > 0 || counts.EXISTS > 0 || counts.ERROR > 0 || counts.UNVERIFIED > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
