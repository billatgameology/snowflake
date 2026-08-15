// Gut-check spike (docs/plans/explore-gg-realism-gutcheck.md, "large-artifact inventory" WP):
// restore a gutcheck-large-*.zip produced by scripts/gutcheck-archive-pack.ts back into the
// out/ tree, verifying every file's sha256 against the git-tracked inventory:
//
//   node scripts/gutcheck-archive-restore.ts <path/to/zip>            # into out/gutcheck-gg-realism
//   node scripts/gutcheck-archive-restore.ts <zip> --dest <dir>       # elsewhere (tests, staging)
//   node scripts/gutcheck-archive-restore.ts <zip> --force            # overwrite differing files
//
// Fail-closed by design (2026-08-04 adversarial review, recorded in the plan):
// - the tracked inventory missing or unreadable is a hard abort, never a warning;
// - the zip's own sha256 is checked against the inventory's archives ledger first — a
//   same-named ledger entry with a different hash (corrupted/partial download) aborts;
// - archive entries are vetted by NAME (forward-slash relative paths under `large/**` or the
//   root workspace layer; never absolute, backslash-containing, `..`, `archives/`, `site/`,
//   or `tracked/`) and by TYPE (archive listing; only regular files and directories pass —
//   symlinks/FIFOs/devices abort before extraction);
// - ledgered archives must match their declared group and count before extraction; newly
//   packed archives also bind the exact sorted member-name set, while legacy entries without
//   that field warn and retain archive-hash/group/count/per-file-digest enforcement;
// - extraction uses Info-ZIP on macOS/Linux and bsdtar on Windows into a temp dir under --dest;
//   placement renames per file (copy fallback across volumes) and a SIGINT/SIGTERM mid-run
//   removes the temp dir.
// Per-file statuses:
//   OK          sha256 matches the tracked inventory
//   SKIP        an identical file (same hash) is already in place
//   UNVERIFIED  placed, but the relpath is not in the inventory — exit 1 (investigate)
//   MISMATCH    hash differs from inventory — file is NOT placed; exit 1
//   EXISTS      destination file exists with different content and no --force; NOT placed; exit 1
//   ERROR       this entry failed (unreadable destination, extraction gap, ...); exit 1
// An archive absent from the archive ledger may still place individually verified files, but
// the overall command exits 1: per-file authenticity does not prove group completeness.
// The inventory read is always the repo's tracked inventory (resolved relative to this
// script, not the CWD), so a fresh clone verifies a Dropbox download against git history.

import { createHash } from "node:crypto";
import {
  copyFileSync,
  createReadStream,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { prepareSafePlacement } from "./gutcheck-restore-lib.ts";
import {
  archiveEntryPathIsSafe,
  archiveEntryPortableKey,
  archiveGroupForEntry,
  archiveMemberListSha256,
} from "./gutcheck-archive-lib.ts";

const ROOT = resolve(import.meta.dirname, "..", "out/gutcheck-gg-realism");
// Tracked inventory relocated to the evidence tree 2026-08-12 (out/ is fully disposable).
// GUTCHECK_INVENTORY exists for the regression tests, which run this script against fixture
// ledgers without touching the real one.
const INVENTORY = resolve(
  process.env.GUTCHECK_INVENTORY ??
    resolve(import.meta.dirname, "..", "evidence/gutcheck-gg-realism/large-artifact-inventory.json"),
);

// The Windows zip reader below needs bsdtar. Windows ships it as System32\tar.exe, but a Git-Bash or
// MSYS PATH puts GNU tar ahead of it, and GNU tar neither reads zip nor accepts a drive letter
// (it reads "G:\..." as a remote host and fails with "Cannot connect to G:"). Found the first
// time either script was run on Windows, 2026-08-06 — the plan had flagged Windows execution as
// asserted-from-documentation-only. Resolve System32 explicitly there. macOS and GitHub's Ubuntu
// runner use Info-ZIP `unzip`; Ubuntu's GNU tar cannot read ZIP.
const TAR = ((): string => {
  if (process.platform !== "win32") return "tar";
  const system32 = join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe");
  return existsSync(system32) ? system32 : "tar";
})();
const USE_INFOZIP = process.platform !== "win32";

interface FileEntry {
  relPath: string;
  sha256: string;
  bytes: number;
  /** "out" = workspace layer at OUT root; otherwise relative to large/. */
  root?: "large" | "out";
}
interface ArchiveEntry {
  name: string;
  group: string;
  sha256: string;
  bytes: number;
  fileCount: number;
  totalBytes: number;
  /** SHA-256 of JSON.stringify(sorted archive member paths); absent on legacy entries. */
  memberListSha256?: string;
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

// bsdtar `-tvf` and Info-ZIP `unzip -Z -s` both put a Unix-like mode at the start of each member
// detail line. Parsing the name from those detail lines is brittle, so entry TYPES come from the
// detail listing and entry NAMES from the corresponding names-only listing; the counts must agree.
// Windows bsdtar terminates its listing lines with CRLF. Splitting on "\n" alone leaves a
// trailing "\r" on every name, which silently breaks BOTH the directory test ("large/x/\r" no
// longer ends in "/", so a directory is treated as a file) and every lstat of an extracted
// path — the 2026-08-06 first-run-on-Windows symptom was all-entries ENOENT.
function splitLines(stdout: string): string[] {
  return stdout.split("\n").map((line) => line.replace(/\r$/, "")).filter((line) => line.length > 0);
}

function listEntries(zipPath: string): { names: string[]; badTypes: string[] } {
  const namesCommand = USE_INFOZIP ? "unzip" : TAR;
  const namesArgs = USE_INFOZIP ? ["-Z1", zipPath] : ["-tf", zipPath];
  const detailsCommand = USE_INFOZIP ? "unzip" : TAR;
  const detailsArgs = USE_INFOZIP ? ["-Z", "-s", zipPath] : ["-tvf", zipPath];
  const namesResult = spawnSync(namesCommand, namesArgs, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (namesResult.status !== 0) {
    throw new Error(
      `${namesCommand} ${namesArgs[0]} failed: ${namesResult.error?.message ?? namesResult.stderr}`,
    );
  }
  const names = splitLines(namesResult.stdout);
  const detailsResult = spawnSync(detailsCommand, detailsArgs, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (detailsResult.status !== 0) {
    throw new Error(
      `${detailsCommand} ${detailsArgs[0]} failed: ` +
        `${detailsResult.error?.message ?? detailsResult.stderr}`,
    );
  }
  const detailLines = USE_INFOZIP
    ? splitLines(detailsResult.stdout).filter((line) => /^[-bcdlps]/u.test(line))
    : splitLines(detailsResult.stdout);
  if (detailLines.length !== names.length) {
    throw new Error(
      `archive name and type listings disagree on entry count ` +
        `(${names.length} vs ${detailLines.length})`,
    );
  }
  const badTypes: string[] = [];
  for (let i = 0; i < detailLines.length; i++) {
    const typeChar = detailLines[i]![0];
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
  // Entry paths are relative to OUT: heavy binaries under "large/…", the workspace
  // evidence layer (records, renders, composites, specs, logs) at the root.
  const inventoryByPath = new Map(
    inventory.files.map((f) => [f.root === "out" ? f.relPath : `large/${f.relPath}`, f]),
  );

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
    if (!archiveEntryPathIsSafe(entry)) {
      throw new Error(`unsafe entry path, refusing archive: ${entry}`);
    }
    // Refuse anything that would land outside the destination tree. Entries may sit under
    // large/ (binaries) or at OUT root (the extras/workspace layer); archives/, site/ and
    // tracked/ are never packed, so an entry claiming those is not one of ours.
    const top = entry.split("/")[0]!;
    const foldedTop = top.toLowerCase();
    if (foldedTop === "archives" || foldedTop === "site" || foldedTop === "tracked") {
      throw new Error(`entry in a never-packed location, not a gutcheck archive: ${entry}`);
    }
    if (foldedTop === "large" && top !== "large") {
      throw new Error(`entry aliases the canonical large/ root on a case-insensitive host: ${entry}`);
    }
    if (!entry.endsWith("/")) fileEntries.push(entry);
  }
  if (fileEntries.length === 0) throw new Error("archive contains no files");
  if (new Set(fileEntries).size !== fileEntries.length) {
    throw new Error(`archive ${zipName} contains duplicate file entries — refusing ambiguous extraction`);
  }
  const portableNames = new Map<string, string>();
  for (const entry of fileEntries) {
    const key = archiveEntryPortableKey(entry);
    const priorEntry = portableNames.get(key);
    if (priorEntry !== undefined && priorEntry !== entry) {
      throw new Error(
        `archive ${zipName} contains paths that collide on a supported host: ${priorEntry} and ${entry}`,
      );
    }
    portableNames.set(key, entry);
  }
  // A ledgered archive declares its group, count and (for newly packed archives) exact member
  // identity. Check all of that BEFORE extraction: count alone allowed a same-count member
  // substitution to place a wrong-group file and merely warn about the omitted member.
  const declaredBy = byName ?? ledger.find((a) => a.sha256 === zipSha);
  const archiveUnverified = declaredBy === undefined;
  if (declaredBy !== undefined && fileEntries.length !== declaredBy.fileCount) {
    throw new Error(
      `archive ${zipName} holds ${String(fileEntries.length)} files but the ledger declares ` +
        `${String(declaredBy.fileCount)} — refusing a partial or altered archive`,
    );
  }
  if (declaredBy !== undefined) {
    const wrongGroup = fileEntries.filter((entry) => archiveGroupForEntry(entry) !== declaredBy.group);
    if (wrongGroup.length > 0) {
      throw new Error(
        `archive ${zipName} is ledgered as group "${declaredBy.group}" but contains ` +
          `${wrongGroup.slice(0, 3).join(", ")}${wrongGroup.length > 3 ? ", …" : ""}`,
      );
    }
    const unledgered = fileEntries.filter((entry) => !inventoryByPath.has(entry));
    if (unledgered.length > 0) {
      throw new Error(
        `ledgered archive ${zipName} contains ${String(unledgered.length)} unledgered member(s): ` +
          `${unledgered.slice(0, 3).join(", ")}${unledgered.length > 3 ? ", …" : ""}`,
      );
    }
    if (declaredBy.memberListSha256 !== undefined) {
      const actualMembers = archiveMemberListSha256(fileEntries);
      if (actualMembers !== declaredBy.memberListSha256) {
        throw new Error(
          `archive member-list mismatch for ${zipName}:\n  ledger  ${declaredBy.memberListSha256}\n` +
            `  actual  ${actualMembers}\nRefusing same-count member substitution.`,
        );
      }
    } else {
      console.warn(
        `warning: ${zipName} is a legacy ledger entry without memberListSha256; ` +
          `archive hash, group, count, and per-file digests are enforced, but historical exact membership is not asserted`,
      );
    }
  }

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
    const extractCommand = USE_INFOZIP ? "unzip" : TAR;
    const extractArgs = USE_INFOZIP
      ? ["-qq", "-o", zipPath, "-d", tmp]
      : ["-xf", zipPath, "-C", tmp];
    const extract = spawnSync(extractCommand, extractArgs, { stdio: "inherit" });
    if (extract.status !== 0) {
      throw new Error(
        `${extractCommand} extraction failed ` +
          `(${extract.error?.message ?? `status ${String(extract.status)}`})`,
      );
    }

    for (const entry of fileEntries) {
      try {
        const extracted = join(tmp, entry);
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

        // Validate the destination chain BEFORE even accepting an identical existing target.
        // The old SKIP path hashed through dest/large -> outside and exited 0 without ever
        // calling the placement guard (round-3 review, 2026-08-13).
        let inspectedTarget: string;
        try {
          inspectedTarget = prepareSafePlacement(dest, entry);
        } catch (error) {
          console.error(`ERROR      ${entry} ${error instanceof Error ? error.message : String(error)}`);
          counts.ERROR++;
          continue;
        }

        // Distinguish "target absent" (restore proceeds) from "target unreadable"
        // (refuse — an EACCES/EIO must never be treated as an empty slot).
        let existingSha: string | null = null;
        try {
          statSync(inspectedTarget);
          existingSha = await sha256File(inspectedTarget);
        } catch (error) {
          const code = (error as NodeJS.ErrnoException).code;
          if (code !== "ENOENT") {
            console.error(`ERROR      ${entry} destination unreadable (${code}); not placed`);
            counts.ERROR++;
            continue;
          }
        }
        if (existingSha === digest) {
          if (expected === undefined) {
            console.warn(`UNVERIFIED ${entry} (already present; not in tracked inventory)`);
            counts.UNVERIFIED++;
          } else {
            counts.SKIP++;
          }
          continue;
        }
        if (existingSha !== null && !force) {
          console.error(`EXISTS     ${entry} (destination differs; rerun with --force to overwrite)`);
          counts.EXISTS++;
          continue;
        }

        // Destination-side guard, immediately before placement: a symlinked ancestor under
        // --dest (dest/figs -> elsewhere) passed every entry-NAME check and wrote outside
        // the tree (adversarial review 2026-08-12). The reads above may have gone through
        // such a link harmlessly; the WRITE must not.
        let safeTarget: string;
        try {
          safeTarget = prepareSafePlacement(dest, entry);
        } catch (error) {
          console.error(`ERROR      ${entry} ${error instanceof Error ? error.message : String(error)}`);
          counts.ERROR++;
          continue;
        }
        try {
          renameSync(extracted, safeTarget);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
          copyFileSync(extracted, safeTarget);
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
  const entrySet = new Set(fileEntries);
  const groupsInArchive = new Set(
    fileEntries.map((e) => (e.startsWith("large/") ? e.split("/")[1]! : "extras")),
  );
  const missing = inventory.files.filter((f) => {
    const key = f.root === "out" ? f.relPath : `large/${f.relPath}`;
    const group = f.root === "out" ? "extras" : f.relPath.split("/")[0]!;
    return groupsInArchive.has(group) && !entrySet.has(key);
  });
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
  if (archiveUnverified) {
    console.warn("archive-level UNVERIFIED: no archive-ledger entry authenticated this member set");
  }
  if (
    archiveUnverified ||
    counts.MISMATCH > 0 ||
    counts.EXISTS > 0 ||
    counts.ERROR > 0 ||
    counts.UNVERIFIED > 0
  ) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
