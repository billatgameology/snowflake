// Gut-check spike (docs/plans/explore-gg-realism-gutcheck.md, "large-artifact inventory" WP):
// scan out/gutcheck-gg-realism/large/ and rebuild the tracked large-artifact inventory (relpath, bytes,
// sha256 per file — the git-tracked ledger of the gitignored binaries), then optionally zip
// whole groups for off-machine backup (Dropbox etc.):
//
//   node scripts/gutcheck-archive-pack.ts                 # byte-verify restored local files
//   node scripts/gutcheck-archive-pack.ts --refresh       # intentionally adopt changed/new files
//   node scripts/gutcheck-archive-pack.ts --pack all      # + zip every group into archives/
//   node scripts/gutcheck-archive-pack.ts --pack meshes,anim-B
//   node scripts/gutcheck-archive-pack.ts --pack all --level 6   # deflate level (default 1)
//
// Groups are the top-level folders under large/ (checkpoints, meshes, figs, anim-B, ...).
// Zip entries are rooted at "large/<group>/..." so scripts/gutcheck-archive-restore.ts can
// place them unambiguously. Verification hashes every locally present byte: size/mtime are
// useful inventory metadata, never substitutes for content authentication. Archives previously
// recorded in the ledger stay recorded after the local zip is deleted (the upload may outlive it).

import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  constants,
  createReadStream,
  fstatSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { spawn, spawnSync } from "node:child_process";

import {
  updateGutcheckEvidenceManifest,
  withExclusivePublicationLockAsync,
} from "./gutcheck-evidence-lib.ts";
import {
  archiveEntryPathIsSafe,
  archiveEntryPortableKey,
  archiveMemberListSha256,
} from "./gutcheck-archive-lib.ts";

// Script-location-relative, so invocation from any CWD resolves the same tree. The env
// overrides exist for the regression tests (runner/test/gutcheck-hardening.test.ts), which
// must exercise this script against fixture trees without touching the real ledger.
const ROOT = resolve(process.env.GUTCHECK_OUT_ROOT ?? resolve(import.meta.dirname, "..", "out/gutcheck-gg-realism"));
const LARGE = join(ROOT, "large");
// The tracked inventory moved out of gitignored out/ into the evidence tree on 2026-08-12
// (with the rest of the spike's tracked provenance); rewriting it obliges the MANIFEST re-pin
// below. The bulk trees it inventories stay under out/.
const TRACKED_DIR = resolve(import.meta.dirname, "..", "evidence/gutcheck-gg-realism");
const INVENTORY = resolve(process.env.GUTCHECK_INVENTORY ?? join(TRACKED_DIR, "large-artifact-inventory.json"));
// Re-pin evidence/MANIFEST.json only when writing the real tracked inventory — a fixture
// inventory outside the evidence tree must not churn the repo's manifest.
const INVENTORY_IN_EVIDENCE = INVENTORY.startsWith(resolve(import.meta.dirname, "..", "evidence") + sep);
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
  /** SHA-256 of JSON.stringify(sorted archive member paths); absent on legacy entries. */
  memberListSha256?: string;
}
interface Inventory {
  format: "gutcheck-large-inventory-v1";
  generated: string;
  root: string; // repo-relative location the relPaths are under
  files: FileEntry[];
  archives: ArchiveEntry[];
}

interface Args {
  pack: string[] | "all" | null;
  level: number;
  replaceInventory: boolean;
  initInventory: boolean;
  refresh: boolean;
}
function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: Args = { pack: null, level: 1, replaceInventory: false, initInventory: false, refresh: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--pack") {
      const value = argv[++i];
      if (value === undefined) throw new Error("--pack needs a value (all or group,group)");
      args.pack = value === "all" ? "all" : value.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg === "--level") {
      args.level = Number(argv[++i]);
      if (!Number.isInteger(args.level) || args.level < 0 || args.level > 9) {
        throw new Error("--level must be an integer 0..9");
      }
    } else if (arg === "--replace-inventory") {
      args.replaceInventory = true;
    } else if (arg === "--init-inventory") {
      args.initInventory = true;
    } else if (arg === "--refresh") {
      args.refresh = true;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return args;
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

async function inspectRegularFile(
  path: string,
): Promise<{ bytes: number; mtimeMs: number; sha256: string }> {
  const fd = openSync(
    path,
    constants.O_RDONLY | (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
  );
  try {
    const before = fstatSync(fd);
    if (!before.isFile()) {
      throw new Error(`refusing to inventory a non-regular file: ${path}`);
    }
    const hash = createHash("sha256");
    const stream = createReadStream(path, { fd, autoClose: false });
    for await (const chunk of stream) hash.update(chunk as Buffer);
    const after = fstatSync(fd);
    if (
      after.dev !== before.dev ||
      after.ino !== before.ino ||
      after.size !== before.size ||
      after.mtimeMs !== before.mtimeMs ||
      after.ctimeMs !== before.ctimeMs
    ) {
      throw new Error(`source changed while it was being hashed: ${path}`);
    }
    return { bytes: before.size, mtimeMs: before.mtimeMs, sha256: hash.digest("hex") };
  } finally {
    closeSync(fd);
  }
}

interface ExpectedArchiveMember {
  path: string;
  bytes: number;
  sha256: string;
}

/**
 * Authenticate every uncompressed member byte without materializing a second copy. `unzip -p`
 * emits file payloads in archive order; the independently listed names plus ledgered byte
 * lengths make each boundary unambiguous. A name-only zip check missed a source mutation that
 * happened after scanning but before zip read it (round-3 review, 2026-08-13).
 */
function verifyArchivePayload(zipPath: string, expected: readonly ExpectedArchiveMember[]): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn("unzip", ["-p", zipPath], { stdio: ["ignore", "pipe", "pipe"] });
    let index = 0;
    let remaining = expected[0]?.bytes ?? 0;
    let hash = createHash("sha256");
    let failure: Error | null = null;
    let stderr = "";

    const finishZeroLengthMembers = (): void => {
      while (failure === null && index < expected.length && remaining === 0) {
        const member = expected[index]!;
        const digest = hash.digest("hex");
        if (digest !== member.sha256) {
          failure = new Error(
            `archive payload mismatch for ${member.path}: scanned ${member.sha256}, zipped ${digest}`,
          );
          child.kill();
          return;
        }
        index++;
        remaining = expected[index]?.bytes ?? 0;
        hash = createHash("sha256");
      }
    };

    finishZeroLengthMembers();
    child.stdout.on("data", (chunk: Buffer) => {
      if (failure !== null) return;
      let offset = 0;
      while (offset < chunk.length && failure === null) {
        if (index >= expected.length) {
          failure = new Error("archive payload contains bytes beyond the declared member list");
          child.kill();
          return;
        }
        const take = Math.min(remaining, chunk.length - offset);
        hash.update(chunk.subarray(offset, offset + take));
        offset += take;
        remaining -= take;
        finishZeroLengthMembers();
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < 64 * 1024) stderr += chunk.toString();
    });
    child.on("error", (error) => {
      failure ??= error;
    });
    child.on("close", (code) => {
      finishZeroLengthMembers();
      if (failure !== null) {
        rejectPromise(failure);
      } else if (code !== 0) {
        rejectPromise(new Error(`unzip -p verification failed (status ${String(code)}): ${stderr.trim()}`));
      } else if (index !== expected.length) {
        const member = expected[index];
        rejectPromise(
          new Error(
            `archive payload ended early${member === undefined ? "" : ` in ${member.path}`} ` +
              `(${String(remaining)} byte(s) missing)`,
          ),
        );
      } else {
        resolvePromise();
      }
    });
  });
}

// lstat, never stat: a symlink under the archive tree (out/leak -> ../outside) was followed,
// inventoried, and ZIPPED in adversarial review (2026-08-12 round 2). The archive trees must
// contain regular files only, and anything else fails the whole run closed rather than being
// silently skipped — a skipped symlink would make the inventory quietly incomplete.
function walk(dir: string, base: string, acc: string[]): void {
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith(".")) continue;
    const full = join(dir, name);
    const rel = base === "" ? name : `${base}/${name}`;
    const stat = lstatSync(full);
    if (stat.isSymbolicLink()) {
      throw new Error(`refusing to inventory a symlink: ${full} — archive trees hold regular files only`);
    }
    if (stat.isDirectory()) walk(full, rel, acc);
    else if (stat.isFile()) acc.push(rel);
    else throw new Error(`refusing to inventory a non-regular file: ${full}`);
  }
}

// Fail CLOSED on a bad ledger. The catch-everything version treated a truncated or
// wrong-format inventory as "no prior" and overwrote 1,640 entries with whatever was local
// (2026-08-12 round-2 review). The ledger is git-tracked, so the recovery for corruption is
// `git restore`, not a rebuild; only --init-inventory may start one where none exists.
function loadPrior(initInventory: boolean): Inventory | null {
  let raw: string;
  try {
    raw = readFileSync(INVENTORY, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      if (initInventory) {
        console.warn(`no inventory at ${INVENTORY} — initializing a new ledger (--init-inventory)`);
        return null;
      }
      throw new Error(`no inventory at ${INVENTORY}; pass --init-inventory to create one from the local scan`);
    }
    throw new Error(`cannot read inventory ${INVENTORY} (${String(code)}) — failing closed, not treating as fresh`);
  }
  let parsed: Inventory;
  try {
    parsed = JSON.parse(raw) as Inventory;
  } catch {
    throw new Error(`inventory ${INVENTORY} is not valid JSON — refusing to overwrite a corrupted ledger; restore it with git first`);
  }
  if (parsed.format !== "gutcheck-large-inventory-v1" || !Array.isArray(parsed.files)) {
    throw new Error(`inventory ${INVENTORY} has unrecognized format ${JSON.stringify((parsed as { format?: unknown }).format)} — failing closed`);
  }
  return parsed;
}

function formatBytes(n: number): string {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024).toFixed(1)} KB`;
}

const pathIsWithin = (root: string, candidate: string): boolean => {
  const prefix = root.endsWith(sep) ? root : root + sep;
  return candidate === root || candidate.startsWith(prefix);
};

const requireContainedPlainDirectory = (candidate: string, root: string, label: string): void => {
  const candidateStat = lstatSync(candidate);
  if (candidateStat.isSymbolicLink() || !candidateStat.isDirectory()) {
    throw new Error(`${label} must be a real directory, not a symlink or other file: ${candidate}`);
  }
  const realRoot = realpathSync.native(root);
  const realCandidate = realpathSync.native(candidate);
  if (!pathIsWithin(realRoot, realCandidate)) {
    throw new Error(`${label} resolves outside the gut-check root: ${realCandidate}`);
  }
};

async function mainWithInventoryLock(): Promise<void> {
  const { pack, level, replaceInventory, initInventory, refresh } = parseArgs();
  // `walk()` lstats descendants, but readdirSync follows a symlink supplied as its starting
  // directory. A prepared out/.../large -> outside therefore bypassed the descendant policy
  // until the root itself was checked (round-3 closing audit).
  requireContainedPlainDirectory(LARGE, ROOT, "large artifact root");
  const prior = loadPrior(initInventory);
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
    if (name.startsWith(".") || EXTRAS_SKIP.has(name.toLowerCase())) continue;
    // Loose .zip/.tar files at OUT root are transfer bundles (Finder "Compress" on
    // archives/ produces exactly this) — packing one into an archive would duplicate
    // gigabytes and nest the archive set inside itself.
    if (/\.(zip|tar|tar\.gz|tgz)$/i.test(name)) continue;
    const full = join(ROOT, name);
    const rootStat = lstatSync(full);
    if (rootStat.isSymbolicLink()) {
      throw new Error(`refusing to inventory a symlink: ${full} — archive trees hold regular files only`);
    }
    if (rootStat.isDirectory()) walk(full, name, extraPaths);
    else if (rootStat.isFile()) extraPaths.push(name);
    else throw new Error(`refusing to inventory a non-regular file: ${full}`);
  }

  // `files` is exactly what was SCANNED locally this run — archive membership derives only
  // from it. Preserved-absent ledger entries are merged later into `ledgerFiles` for the
  // inventory write and must never inflate an archive's declared contents (round-2 review:
  // sparse packing published false completeness).
  const files: FileEntry[] = [];
  let hashed = 0;
  // Verification vs refresh: the DEFAULT hashes every locally present file, reports any
  // changed digest or unledgered path, and aborts without writing. Metadata equality is not
  // byte verification: a restore/copy can preserve both size and mtime. `--refresh` (or
  // `--replace-inventory`) is the only intentional adoption path.
  const mismatches: string[] = [];
  const unexpected: string[] = [];
  const adopt = refresh || replaceInventory;
  for (const relPath of relPaths) {
    const full = join(LARGE, relPath);
    const group = relPath.split("/")[0]!;
    const cached = priorByPath.get(relPath);
    const inspected = await inspectRegularFile(full);
    if (cached !== undefined && cached.sha256 !== inspected.sha256 && !adopt) {
      mismatches.push(`large/${relPath}: ledger ${cached.sha256.slice(0, 12)}… local ${inspected.sha256.slice(0, 12)}…`);
    }
    if (cached === undefined && prior !== null && !adopt) unexpected.push(`large/${relPath}`);
    files.push({ relPath, group, ...inspected });
    hashed++;
  }

  for (const relPath of extraPaths) {
    const full = join(ROOT, relPath);
    const cached = priorByPath.get(`out:${relPath}`);
    const inspected = await inspectRegularFile(full);
    if (cached !== undefined && cached.sha256 !== inspected.sha256 && !adopt) {
      mismatches.push(`${relPath}: ledger ${cached.sha256.slice(0, 12)}… local ${inspected.sha256.slice(0, 12)}…`);
    }
    if (cached === undefined && prior !== null && !adopt) unexpected.push(relPath);
    files.push({ relPath, group: "extras", ...inspected, root: "out" });
    hashed++;
  }

  if (mismatches.length > 0 || unexpected.length > 0) {
    const mismatchBlock = mismatches.length === 0 ? "" : `\nchanged bytes:\n  ${mismatches.join("\n  ")}`;
    const unexpectedBlock =
      unexpected.length === 0 ? "" : `\nunledgered local files:\n  ${unexpected.join("\n  ")}`;
    throw new Error(
      `local files disagree with the ledger (nothing written):${mismatchBlock}${unexpectedBlock}\n` +
        `Verification reports; it does not redefine truth. Re-run with --refresh to adopt these bytes intentionally.`,
    );
  }

  // Sparse local trees are the NORM since the bulk moved to the NAS (2026-08-12): a scan
  // sees only what is restored locally, and rebuilding the ledger from the scan alone
  // reduced the real 1,640-file inventory to one entry in adversarial review. Default is
  // verify/merge — prior entries whose files are absent locally are preserved verbatim —
  // and --replace-inventory is the explicit, reported way to rebuild from local files only.
  const scannedKeys = new Set(files.map((f) => (f.root === "out" ? `out:${f.relPath}` : f.relPath)));
  const absent = [...priorByPath.entries()]
    .filter(([key]) => !scannedKeys.has(key))
    .map(([, entry]) => entry);
  if (replaceInventory) {
    if (absent.length > 0) {
      const sample = absent.slice(0, 3).map((e) => e.relPath).join(", ");
      console.warn(`--replace-inventory: dropping ${absent.length} ledger entr(ies) with no local file (${sample}${absent.length > 3 ? ", …" : ""})`);
    }
  } else if (absent.length > 0) {
    console.log(`${absent.length} ledger entr(ies) have no local file (bulk on the NAS): preserved, not re-verified`);
  }
  // What the ledger records (scanned + preserved) vs what an archive may contain (scanned
  // only) are kept as separate lists on purpose.
  const ledgerFiles = replaceInventory ? files : [...files, ...absent];

  // Every recorded path must round-trip on both supported filesystems. In particular,
  // case-only or Unicode-normalization aliases are distinct on this macOS volume but collide
  // on Windows, and could make restore overwrite one member with another.
  const portablePaths = new Map<string, string>();
  for (const entry of ledgerFiles) {
    const memberPath = entry.root === "out" ? entry.relPath : `large/${entry.relPath}`;
    if (!archiveEntryPathIsSafe(memberPath)) {
      throw new Error(`inventory contains a non-portable member path: ${memberPath}`);
    }
    const expectedGroup = entry.root === "out" ? "extras" : entry.relPath.split("/")[0];
    if (expectedGroup === undefined || expectedGroup === "" || entry.group !== expectedGroup) {
      throw new Error(
        `inventory group mismatch for ${memberPath}: recorded ${entry.group}, expected ${String(expectedGroup)}`,
      );
    }
    const key = archiveEntryPortableKey(memberPath);
    const priorPath = portablePaths.get(key);
    if (priorPath !== undefined && priorPath !== memberPath) {
      throw new Error(`inventory paths collide on a supported host: ${priorPath} and ${memberPath}`);
    }
    portablePaths.set(key, memberPath);
  }

  const groups = [...new Set(ledgerFiles.map((f) => f.group))].sort();
  const archives: ArchiveEntry[] = [...(prior?.archives ?? [])];

  // Atomic (temp + rename) so a crash mid-write can never truncate the tracked ledger. An
  // inventory-only run writes after hashing; a pack run writes after each authenticated
  // archive, so a later group failure cannot erase completed work.
  const writeInventory = (): void => {
    mkdirSync(dirname(INVENTORY), { recursive: true });
    const inventory: Inventory = {
      format: "gutcheck-large-inventory-v1",
      generated: new Date().toISOString(),
      root: "out/gutcheck-gg-realism/large",
      files: ledgerFiles,
      archives: [...archives].sort((a, b) => a.name.localeCompare(b.name)),
    };
    // Temp file in the SAME directory as the target so the rename stays atomic even when
    // GUTCHECK_INVENTORY points a test at a fixture path.
    const tmpPath = join(
      dirname(INVENTORY),
      `.${basename(INVENTORY)}.${String(process.pid)}-${randomUUID()}.tmp`,
    );
    try {
      writeFileSync(tmpPath, JSON.stringify(inventory, null, 1));
      renameSync(tmpPath, INVENTORY);
    } finally {
      rmSync(tmpPath, { force: true });
    }
    // The real inventory lives in the evidence tree, so every rewrite re-pins the MANIFEST;
    // a fixture inventory must not churn the repo's manifest.
    if (INVENTORY_IN_EVIDENCE) updateGutcheckEvidenceManifest();
  };

  const packGroups = pack === null ? [] : pack === "all" ? groups : pack;
  for (const group of packGroups) {
    if (!groups.includes(group)) throw new Error(`unknown group "${group}" (have: ${groups.join(", ")})`);
    // An archive of a partially restored group would carry the group's name while holding a
    // subset of its ledgered files — false completeness (round-2 review). Refuse instead.
    const absentInGroup = replaceInventory ? [] : absent.filter((e) => e.group === group);
    if (absentInGroup.length > 0) {
      const sample = absentInGroup.slice(0, 3).map((e) => e.relPath).join(", ");
      throw new Error(
        `cannot pack group "${group}": ${absentInGroup.length} ledgered file(s) are not restored locally ` +
          `(${sample}${absentInGroup.length > 3 ? ", …" : ""}). Restore them first, or use --replace-inventory ` +
          `to deliberately redefine the group as the local set.`,
      );
    }
  }
  if (packGroups.length === 0) writeInventory();

  for (const group of packGroups) {
    mkdirSync(ARCHIVES, { recursive: true });
    requireContainedPlainDirectory(ARCHIVES, ROOT, "archive publication directory");
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    // The archive is built from the EXPLICIT scanned member list (`zip -@` on stdin), into a
    // temp file, verified, then atomically hard-linked into an absent destination. The previous shape
    // — `zip -r` over directories with a shared exclusion list, after deleting the existing
    // same-day archive — had two review-caught failures (2026-08-12 round 2): the blanket
    // `-x large/*` made every large/ group zip exit "Nothing to do!" AFTER the good archive
    // was already deleted, and directory recursion is what allowed the symlink follow. An
    // explicit list has no exclusion logic to get wrong and nothing to resurrect.
    const members = files.filter((f) => f.group === group);
    const memberPaths = members.map((f) => (f.root === "out" ? f.relPath : `large/${f.relPath}`));
    if (memberPaths.length === 0) throw new Error(`group "${group}" has no locally scanned files to pack`);
    const unsafeMember = memberPaths.find((path) => !archiveEntryPathIsSafe(path));
    if (unsafeMember !== undefined) {
      throw new Error(`refusing non-portable archive member path: ${unsafeMember}`);
    }
    console.log(`packing ${group} (${memberPaths.length} files, deflate level ${level}) ...`);
    const tmpZip = join(ARCHIVES, `.gutcheck-large-${group}.${String(process.pid)}-${randomUUID()}.tmp`);
    rmSync(tmpZip, { force: true });
    let publishedName = "";
    let zipBytes = 0;
    let zipSha = "";
    try {
      const result = spawnSync("zip", ["-q", `-${level}`, tmpZip, "-@"], {
        cwd: ROOT,
        input: memberPaths.join("\n") + "\n",
        stdio: ["pipe", "inherit", "inherit"],
      });
      if (result.status !== 0) throw new Error(`zip failed for group ${group} (status ${String(result.status)})`);
      // The zip must contain exactly the declared member set — nothing extra, nothing missing.
      const listing = spawnSync("unzip", ["-Z1", tmpZip], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
      if (listing.status !== 0) throw new Error(`unzip -Z1 verification failed for ${group}`);
      const zippedInOrder = listing.stdout
        .split("\n")
        .map((line) => line.replace(/\r$/, ""))
        .filter((line) => line !== "" && !line.endsWith("/"));
      if (new Set(zippedInOrder).size !== zippedInOrder.length) {
        throw new Error(`archive for ${group} contains duplicate member names`);
      }
      const zipped = [...zippedInOrder].sort();
      const declared = [...memberPaths].sort();
      if (zipped.length !== declared.length || zipped.some((entryName, i) => entryName !== declared[i])) {
        throw new Error(`archive member set does not match the declared list for ${group} (${String(zipped.length)} vs ${String(declared.length)})`);
      }
      const byPath = new Map(
        memberPaths.map((path, index) => [
          path,
          { path, bytes: members[index]!.bytes, sha256: members[index]!.sha256 },
        ]),
      );
      await verifyArchivePayload(
        tmpZip,
        zippedInOrder.map((path) => byPath.get(path)!),
      );
      zipBytes = statSync(tmpZip).size;
      zipSha = await sha256File(tmpZip);
      // Content-addressed immutable names avoid delete/overwrite publication on every host.
      // linkSync is the same-filesystem, atomic NO-CLOBBER publication primitive: renameSync
      // would silently replace an existing path on POSIX. An identical concurrent pack may
      // already have published this exact byte hash; accept only that case.
      publishedName = `gutcheck-large-${group}-${stamp}-${zipSha}.zip`;
      const publishedPath = join(ARCHIVES, publishedName);
      try {
        linkSync(tmpZip, publishedPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        const existingSha = await sha256File(publishedPath).catch(() => null);
        if (existingSha !== zipSha) throw error;
      }
    } finally {
      rmSync(tmpZip, { force: true });
    }
    const entry: ArchiveEntry = {
      name: publishedName,
      group,
      createdAt: new Date().toISOString(),
      bytes: zipBytes,
      sha256: zipSha,
      fileCount: members.length,
      totalBytes: members.reduce((acc, f) => acc + f.bytes, 0),
      memberListSha256: archiveMemberListSha256(memberPaths),
    };
    const existing = archives.findIndex((a) => a.name === publishedName);
    if (existing >= 0) archives[existing] = entry;
    else archives.push(entry);
    writeInventory();
    console.log(`  archives/${publishedName}  ${formatBytes(zipBytes)}  sha256 ${zipSha}`);
  }

  console.log(
    `inventory: ${ledgerFiles.length} files (${hashed} hashed, ` +
      `${replaceInventory ? 0 : absent.length} preserved absent) in ${groups.length} groups`,
  );
  for (const group of groups) {
    const members = ledgerFiles.filter((f) => f.group === group);
    console.log(
      `  ${group.padEnd(12)} ${String(members.length).padStart(4)} files  ${formatBytes(
        members.reduce((acc, f) => acc + f.bytes, 0),
      )}`,
    );
  }
  console.log(`wrote ${INVENTORY}`);
}

async function main(): Promise<void> {
  // Serialize the whole inventory read/scan/archive/write transaction. Per-archive no-clobber
  // publication alone is insufficient: two different group packs could otherwise both read
  // the same prior ledger and the later writer would lose the earlier archive row.
  requireContainedPlainDirectory(ROOT, ROOT, "gut-check output root");
  // Keep the lock in ignored out/ (and dot-prefixed so the extras scan skips it). A lock next
  // to the tracked inventory would itself sit inside the evidence subtree while the manifest
  // updater scans it.
  await withExclusivePublicationLockAsync(join(ROOT, ".archive-inventory-publication"), mainWithInventoryLock);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
