// Windows workstation → NAS governed archival, one-time bounded program.
//
// Registered in docs/plans/nas-asset-governance.md ("Windows write lane", 2026-08-20).
// Modeled on the sanctioned reference implementation scripts/nas-finalize-gutcheck-remainder.mjs
// (AGENTS.md Rule 15): pinned expectations, per-batch lock, stable inventory with refusals,
// staged copy, absent-target rename, final reopen-and-re-hash, receipt-last. The one structural
// difference from the reference is copy-IN (workstation → share) instead of same-share rename,
// because the source filesystem is not the share; every staged byte is length- and SHA-256-
// verified against its source before promotion, and re-hashed at the final path afterward.
//
// Durability note (win32): fsyncParentDirectory is a platform no-op, so this program's claims
// are VERIFICATION-based — the receipt is written only after final-path re-hash, and the lane
// requires a later fresh-process `assets:verify --full` pass per collection. Deletes nothing,
// anywhere, ever; --rollback (pre-receipt only) moves its own staged/final trees to
// _control/trash/ rather than deleting.
//
// Modes: (default) read-only plan+preconditions; --apply; --rollback.
import { closeSync, copyFileSync, constants as fsConstants, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync, writeSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";

// ── Pinned expectations ─────────────────────────────────────────────────────────────────────
const BATCH = "windows-workspace-2026-08-20";
const REPO = resolve(import.meta.dirname, "..");
const LADDER_WORKTREE = "G:/Code Files/snowflake-phase6-ladder";
const MARKER = { format: "snowflake-nas-share-v1", projectId: "virtual-cloud-chamber" };

/**
 * The registered collections. The seven `earlier-*` entries were PRE-REGISTERED by the Mac's
 * cataloguing as state=unavailable with `evidence/OUT-TREES-MANIFEST.json` as their owner
 * manifest (json-tree-key selector per tree) — this program completes them at their registered
 * version, verifying every archived byte against the OUT-TREES pins. `earlier-phase3-visual`
 * is already active on the share and is NOT re-archived. Scratch's roots are every out/
 * top-level NOT owned by another collection — enumerated, not globbed, so an unexpected new
 * entry is a refusal, not a silent inclusion.
 */
const EVIDENCE_TREES = [
  "out/phase2b", "out/phase4", "out/phase4-visual", "out/phase5", "out/phase5-wp5-0a611e7",
  "out/phase5-wp5-0a611e7-original", "out/phase5-wp7-32eed48-superseded", "out/phase3-visual",
];
const COLLECTIONS = [
  { id: "earlier-phase2b", version: "2026-08-01", roots: ["out/phase2b"], outTreeKey: "out/phase2b" },
  { id: "earlier-phase4", version: "2026-08-01", roots: ["out/phase4"], outTreeKey: "out/phase4" },
  { id: "earlier-phase4-visual", version: "2026-08-01", roots: ["out/phase4-visual"], outTreeKey: "out/phase4-visual" },
  { id: "earlier-phase5", version: "2026-08-01", roots: ["out/phase5"], outTreeKey: "out/phase5" },
  { id: "earlier-phase5-wp5-0a611e7", version: "2026-08-01", roots: ["out/phase5-wp5-0a611e7"], outTreeKey: "out/phase5-wp5-0a611e7" },
  { id: "earlier-phase5-wp5-0a611e7-original", version: "2026-08-01", roots: ["out/phase5-wp5-0a611e7-original"], outTreeKey: "out/phase5-wp5-0a611e7-original" },
  { id: "earlier-phase5-wp7-32eed48-superseded", version: "2026-08-01", roots: ["out/phase5-wp7-32eed48-superseded"], outTreeKey: "out/phase5-wp7-32eed48-superseded" },
  {
    id: "windows-out-gate-artifacts", version: "2026-08-20",
    roots: ["out:root-claim-files"],
  },
  {
    id: "windows-phase6-ladder-workspace", version: "2026-08-20",
    roots: [`${LADDER_WORKTREE}/out`],
  },
  {
    id: "windows-repo-bundle", version: "2026-08-20",
    roots: ["out:bundle"],
  },
  {
    id: "windows-out-scratch", version: "2026-08-20",
    roots: ["out:scratch-remainder"],
  },
];
const OUT_TREES_MANIFEST = JSON.parse(readFileSync(resolve(REPO, "evidence", "OUT-TREES-MANIFEST.json"), "utf8"));
// out/ root files that back recorded gate claims (PROGRESS gate rows) — evidence class.
const ROOT_CLAIM_PATTERN = /^(plate-gate.*\.(ckpt|log)|gate2b.*|gate3.*|gate4.*|gate5.*)$/;

// ── Small helpers ───────────────────────────────────────────────────────────────────────────
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
const fail = (message) => { throw new Error(`NAS-ARCHIVE: ${message}`); };
const collisionKey = (value) => value.normalize("NFC").toLowerCase();
const SAFE_SEGMENT = /^(?!(?:con|prn|aux|nul|clock\$|com[1-9]|lpt[1-9])(?:\.|$))(?!.*[<>:"|?*\\\u0000-\u001f])(?!\.{1,2}$).+$/iu;
const segmentSafe = (segment) =>
  SAFE_SEGMENT.test(segment) && !/[. ]$/u.test(segment) && segment === segment.normalize("NFC");

function resolveShare() {
  const root = "S:/";
  const markerPath = resolve(root, ".snowflake-nas.json");
  const marker = JSON.parse(readFileSync(markerPath, "utf8"));
  if (marker.format !== MARKER.format || marker.projectId !== MARKER.projectId)
    fail("share marker mismatch — refusing to treat S:/ as the snowcrystal share");
  return resolve(root);
}

/**
 * Inventory one source tree: regular files only; refuse symlinks, nlink>1, unsafe names.
 * For the scratch class only (`allowLinkExclusions`), a symlink/junction is recorded as an
 * exclusion and NOT followed — scratch worktrees legitimately contain node_modules junctions
 * into the repository, which are regenerable tooling, not durable data. Claim-backing classes
 * keep the hard refusal.
 */
const linkExclusions = [];
const hardLinkNotes = [];
function inventoryTree(rootAbsolute, label, allowLinkExclusions = false) {
  const rows = [];
  const seenKeys = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = join(dir, entry.name);
      const status = lstatSync(absolute);
      if (status.isSymbolicLink()) {
        if (allowLinkExclusions) { linkExclusions.push({ label, path: absolute }); continue; }
        fail(`${label}: symlink refused: ${absolute}`);
      }
      if (entry.isDirectory()) { walk(absolute); continue; }
      if (!status.isFile()) fail(`${label}: special file refused: ${absolute}`);
      if (status.nlink !== 1) {
        // Scratch worktrees were created with hardlink dedup into the repository. For the
        // scratch class the file is INCLUDED and recorded: the copy materializes independent
        // bytes, and the source/staged/final triple hash catches any mid-copy mutation, which
        // is the only aliasing hazard here. Claim-backing classes keep the hard refusal.
        if (allowLinkExclusions) hardLinkNotes.push({ label, path: absolute, nlink: status.nlink });
        else fail(`${label}: hard-linked source refused (nlink=${status.nlink}): ${absolute}`);
      }
      const rel = relative(rootAbsolute, absolute).split(sep).join("/");
      for (const segment of rel.split("/"))
        if (!segmentSafe(segment)) fail(`${label}: unsafe path segment "${segment}" in ${rel}`);
      const key = collisionKey(rel);
      if (seenKeys.has(key)) fail(`${label}: case/NFC alias collision: ${rel} vs ${seenKeys.get(key)}`);
      seenKeys.set(key, rel);
      rows.push({ rel, absolute, bytes: status.size });
    }
  };
  walk(rootAbsolute);
  return rows;
}

/** Build the complete source roster for one collection. Returns [{shareRel, absolute, bytes}]. */
function collectionSources(collection, bundleDir) {
  const rows = [];
  const push = (prefix, treeRows) => {
    for (const row of treeRows) rows.push({ shareRel: `${prefix}/${row.rel}`, absolute: row.absolute, bytes: row.bytes });
  };
  for (const root of collection.roots) {
    if (root === "out:root-claim-files") {
      for (const entry of readdirSync(resolve(REPO, "out"), { withFileTypes: true })) {
        if (!entry.isFile() || !ROOT_CLAIM_PATTERN.test(entry.name)) continue;
        const absolute = resolve(REPO, "out", entry.name);
        const status = lstatSync(absolute);
        if (status.nlink !== 1 || status.isSymbolicLink()) fail(`root claim file refused: ${entry.name}`);
        rows.push({ shareRel: `out-root/${entry.name}`, absolute, bytes: status.size });
      }
    } else if (root === "out:bundle") {
      for (const name of ["snowflake.bundle", "bundle-verify.txt", "bundle-head.txt"]) {
        const absolute = resolve(bundleDir, name);
        rows.push({ shareRel: name, absolute, bytes: statSync(absolute).size });
      }
    } else if (root === "out:scratch-remainder") {
      const owned = new Set([...EVIDENCE_TREES.map((t) => t.split("/")[1]), "restores"]);
      for (const entry of readdirSync(resolve(REPO, "out"), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (entry.isDirectory()) {
          if (owned.has(entry.name)) continue;
          push(entry.name, inventoryTree(resolve(REPO, "out", entry.name), `scratch/${entry.name}`, true));
        } else if (entry.isFile() && !ROOT_CLAIM_PATTERN.test(entry.name)) {
          const absolute = resolve(REPO, "out", entry.name);
          const status = lstatSync(absolute);
          if (status.isSymbolicLink() || status.nlink !== 1) fail(`scratch root file refused: ${entry.name}`);
          if (!segmentSafe(entry.name)) fail(`scratch root file unsafe name: ${entry.name}`);
          rows.push({ shareRel: `out-root/${entry.name}`, absolute, bytes: status.size });
        }
      }
    } else if (root.startsWith("out/")) {
      const tree = inventoryTree(resolve(REPO, root), root);
      if (collection.outTreeKey !== undefined) {
        // Pre-registered completion: every byte must match the tracked OUT-TREES-MANIFEST owner
        // pins — exact file set, exact sizes, and (verified at staging) exact SHA-256 digests.
        const pinned = OUT_TREES_MANIFEST.trees[collection.outTreeKey];
        if (pinned === undefined) fail(`${collection.id}: no OUT-TREES-MANIFEST entry for ${collection.outTreeKey}`);
        if (tree.length !== pinned.fileCount)
          fail(`${collection.id}: local file count ${tree.length} != pinned ${pinned.fileCount}`);
        for (const row of tree) {
          const pin = pinned.files[row.rel];
          if (pin === undefined) fail(`${collection.id}: ${row.rel} is not in OUT-TREES-MANIFEST`);
          if (pin.bytes !== row.bytes) fail(`${collection.id}: ${row.rel} is ${row.bytes} bytes, pinned ${pin.bytes}`);
          rows.push({ shareRel: row.rel, absolute: row.absolute, bytes: row.bytes, expectedSha256: pin.sha256 });
        }
        for (const rel of Object.keys(pinned.files))
          if (!tree.some((row) => row.rel === rel)) fail(`${collection.id}: pinned file missing locally: ${rel}`);
      } else {
        push(root.slice(4), tree);
      }
    } else {
      push("ladder-out", inventoryTree(resolve(root), root));
    }
  };
  const keys = new Map();
  for (const row of rows) {
    const key = collisionKey(row.shareRel);
    if (keys.has(key)) fail(`${collection.id}: share-path collision: ${row.shareRel} vs ${keys.get(key)}`);
    keys.set(key, row.shareRel);
  }
  return rows;
}

function hashFile(absolute) {
  return sha256(readFileSync(absolute));
}

// ── Modes ───────────────────────────────────────────────────────────────────────────────────
const mode = process.argv.includes("--apply") ? "apply" : process.argv.includes("--rollback") ? "rollback" : "plan";
const share = resolveShare();
const staging = resolve(share, "_control", "staging", BATCH);
const lockDir = resolve(share, "_control", "locks", `${BATCH}.lock`);
const receiptDir = resolve(share, "_control", "receipts", "migrations", BATCH);
const receiptPath = resolve(receiptDir, "result.json");
const bundleDir = resolve(REPO, "out", "nas-archive-bundle");

if (mode === "rollback") {
  if (existsSync(receiptPath)) { console.log("rollback=forbidden receipt=published"); process.exit(1); }
  const trash = resolve(share, "_control", "trash", `${BATCH}-rollback-${Date.now()}`);
  mkdirSync(trash, { recursive: true });
  let moved = 0;
  if (existsSync(staging)) { renameSync(staging, resolve(trash, "staging")); moved += 1; }
  for (const collection of COLLECTIONS) {
    const final = resolve(share, "collections", collection.id);
    if (existsSync(final)) { renameSync(final, resolve(trash, collection.id)); moved += 1; }
  }
  if (existsSync(lockDir)) renameSync(lockDir, resolve(trash, "lock"));
  console.log(`rollback=complete receipt=absent movedRoots=${moved} trash=${trash}`);
  process.exit(0);
}

// Preconditions (both plan and apply).
if (existsSync(receiptPath)) fail("receipt already published — this batch is complete; refusing to run again");
for (const collection of COLLECTIONS) {
  const finalRoot = resolve(share, "collections", collection.id);
  if (existsSync(finalRoot)) fail(`final target already exists: ${finalRoot}`);
}
if (existsSync(staging)) fail(`staging already exists: ${staging} (run --rollback first)`);

// Fresh git bundle (local write only; part of the source set).
mkdirSync(bundleDir, { recursive: true });
const bundlePath = resolve(bundleDir, "snowflake.bundle");
if (!existsSync(bundlePath) || mode === "apply") {
  execFileSync("git", ["bundle", "create", bundlePath, "--all"], { cwd: REPO, stdio: "pipe" });
  const verify = execFileSync("git", ["bundle", "verify", bundlePath], { cwd: REPO, encoding: "utf8" });
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO, encoding: "utf8" }).trim();
  writeFileSync(resolve(bundleDir, "bundle-verify.txt"), verify);
  writeFileSync(resolve(bundleDir, "bundle-head.txt"), `${head}\n`);
}

// Inventory + source hashing.
const planned = [];
for (const collection of COLLECTIONS) {
  const sources = collectionSources(collection, bundleDir);
  const totalBytes = sources.reduce((sum, row) => sum + row.bytes, 0);
  planned.push({ collection, sources, totalBytes });
  console.log(`plan ${collection.id}@${collection.version}: ${sources.length} files, ${totalBytes.toLocaleString()} bytes`);
}
if (mode === "plan") {
  console.log("mode=plan (read-only). Nothing written to the share. Run with --apply after review.");
  process.exit(0);
}

// ── Apply ───────────────────────────────────────────────────────────────────────────────────
// Lock (exclusive create; never stale-broken by this program).
mkdirSync(dirname(lockDir), { recursive: true });
try {
  mkdirSync(lockDir);
} catch {
  fail(`lock exists: ${lockDir} — another run owns this batch; resolve manually`);
}
const ownerFd = openSync(resolve(lockDir, "owner.json"), "wx");
writeSync(ownerFd, JSON.stringify({ format: "snowflake-nas-migration-lock-v1", batch: BATCH, host: process.env.COMPUTERNAME ?? "windows", pid: process.pid, startedAt: new Date().toISOString() }));
closeSync(ownerFd);

const manifests = [];
try {
  for (const { collection, sources, totalBytes } of planned) {
    const stageRoot = resolve(staging, collection.id, collection.version, "payload");
    mkdirSync(stageRoot, { recursive: true });
    const rows = [];
    let done = 0;
    for (const source of sources) {
      const sourceBytes = readFileSync(source.absolute);
      if (sourceBytes.length !== source.bytes)
        fail(`${collection.id}: ${source.shareRel} changed size during archival (${source.bytes} → ${sourceBytes.length})`);
      const digest = sha256(sourceBytes);
      if (source.expectedSha256 !== undefined && digest !== source.expectedSha256)
        fail(`${collection.id}: ${source.shareRel} digest ${digest} != OUT-TREES-MANIFEST pin ${source.expectedSha256}`);
      const target = resolve(stageRoot, ...source.shareRel.split("/"));
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(source.absolute, target, fsConstants.COPYFILE_EXCL);
      const staged = readFileSync(target);
      if (staged.length !== sourceBytes.length || sha256(staged) !== digest)
        fail(`${collection.id}: staged bytes differ from source: ${source.shareRel}`);
      rows.push({ path: `collections/${collection.id}/${collection.version}/payload/${source.shareRel}`, bytes: staged.length, sha256: digest });
      done += 1;
      if (done % 250 === 0) console.log(`  ${collection.id}: staged ${done}/${sources.length}`);
    }
    manifests.push({ collection, rows, totalBytes, fileCount: rows.length });
    console.log(`staged ${collection.id}: ${rows.length} files verified`);
  }

  // Promote: absent-target renames, collection by collection.
  for (const { collection } of planned) {
    const finalVersionDir = resolve(share, "collections", collection.id, collection.version);
    mkdirSync(dirname(finalVersionDir), { recursive: true });
    if (existsSync(finalVersionDir)) fail(`final version dir appeared mid-run: ${finalVersionDir}`);
    renameSync(resolve(staging, collection.id, collection.version), finalVersionDir);
    console.log(`promoted ${collection.id}@${collection.version}`);
  }

  // Final reopen-and-re-hash (the win32 durability mitigation: verify, then receipt).
  for (const manifest of manifests) {
    for (const row of manifest.rows) {
      const finalAbsolute = resolve(share, ...row.path.split("/"));
      const finalBytes = readFileSync(finalAbsolute);
      if (finalBytes.length !== row.bytes || sha256(finalBytes) !== row.sha256)
        fail(`final re-hash mismatch: ${row.path}`);
    }
    console.log(`re-hashed ${manifest.collection.id}: ${manifest.rows.length}/${manifest.rows.length} byte-identical at final path`);
  }

  // Candidate ledger/catalogue material + receipt.
  const outDir = resolve(REPO, "out", `nas-archive-${BATCH}`);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "new-ledger-rows.json"), JSON.stringify(manifests.flatMap((m) => m.rows), null, 1));
  writeFileSync(resolve(outDir, "aggregates.json"), JSON.stringify(manifests.map((m) => ({ id: `${m.collection.id}@${m.collection.version}`, files: m.fileCount, bytes: m.totalBytes })), null, 1));

  mkdirSync(receiptDir, { recursive: true });
  copyFileSync(resolve(REPO, "scripts", "nas-archive-windows-workspace.mjs"), resolve(receiptDir, "apply.mjs"));
  const receipt = {
    format: "snowflake-nas-windows-archive-receipt-v1",
    batch: BATCH,
    host: process.env.COMPUTERNAME ?? "windows",
    collections: manifests.map((m) => ({
      id: `${m.collection.id}@${m.collection.version}`,
      files: m.fileCount,
      bytes: m.totalBytes,
      treeSha256: sha256(Buffer.from(m.rows.map((r) => `${r.sha256}  ${r.path}`).join("\n"), "utf8")),
    })),
    method: "workstation-to-share staged copy, source/staged/final triple byte verification; no source deletion",
    linkExclusions: linkExclusions.map((entry) => `${entry.label}: ${entry.path}`),
    hardLinkedSourcesIncluded: hardLinkNotes.map((entry) => `${entry.label}: ${entry.path} (nlink=${entry.nlink})`),
    durabilityNote: "win32 directory fsync is unavailable; this receipt was written only after full final-path re-hash, and lane closure requires a later fresh-process assets:verify --full per collection",
    verifiedAt: new Date().toISOString(),
  };
  const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 1)}\n`, "utf8");
  const pending = resolve(receiptDir, ".result.pending");
  const pendingFd = openSync(pending, "wx");
  writeSync(pendingFd, receiptBytes);
  closeSync(pendingFd);
  if (existsSync(receiptPath)) fail("receipt appeared mid-run");
  renameSync(pending, receiptPath);
  const rereadReceipt = readFileSync(receiptPath);
  if (sha256(rereadReceipt) !== sha256(receiptBytes)) fail("receipt readback mismatch");
  writeFileSync(resolve(outDir, "receipt-copy.json"), rereadReceipt);
  console.log(`receipt=published sha256=${sha256(receiptBytes)} bytes=${receiptBytes.length}`);
  console.log("apply=complete — install ledger/catalogue updates and run the fresh-process verifies");
} finally {
  // The lock stays if the receipt published (the batch is closed, not reusable); it is moved to
  // trash only by --rollback. Recorded so an operator understands a remaining lock is expected.
  if (!existsSync(receiptPath)) console.log("note: no receipt published; run --rollback to retire staging and the lock");
}
