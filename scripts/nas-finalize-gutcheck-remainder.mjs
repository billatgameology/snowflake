#!/usr/bin/env node

// One-time correction for the retained gut-check workspace remainder.
//
// The default mode is read-only.  --apply performs only same-share, absent-target renames.
// A held lock is never stale-broken.  Before the aggregate receipt exists, an apply failure
// invokes the same exact rollback that an operator can request later with --rollback.  After
// receipt publication, reversal is deliberately outside this program's authority.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  closeSync,
  chmodSync,
  constants,
  fchmodSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertPortableShareRelativePath,
  inventoryStableTree,
  parseNasAssetCatalogV1,
  portableSharePathCollisionKey,
} from "../scripts/nas-asset-lib.ts";
import { bindCollectionSelection } from "../scripts/nas-asset-selection-lib.ts";
import { detectNasMount, pathIsWithinRoot } from "../scripts/nas-root.ts";

const PROGRAM_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(PROGRAM_PATH), "..");
const BATCH = "gutcheck-workspace-remainder-2026-08-16";
const SOURCE_COLLECTION = "gutcheck-workspace-remainder@2026-08-15";
const SOURCE_LOCATOR = "collections/gutcheck-workspace-remainder/2026-08-15/payload";
const FINAL_ASSET_ROOT = "collections/gutcheck-generated-diagnostic-frames";
const FINAL_VERSION_ROOT = `${FINAL_ASSET_ROOT}/2026-08-15`;
const FINAL_LOCATOR = `${FINAL_VERSION_ROOT}/payload`;
const QUARANTINE_ROOT = `_control/quarantine/unresolved/${BATCH}`;
const PRIVATE_MANIFEST_NAME = "manifest.private.jsonl";
const PRIVATE_MANIFEST_PATH = `${QUARANTINE_ROOT}/${PRIVATE_MANIFEST_NAME}`;
const STAGING_ROOT = `_control/staging/${BATCH}`;
const STAGING_DIAGNOSTIC = `${STAGING_ROOT}/diagnostic`;
const ROLLBACK_MANIFEST_NAME = "rollback-manifest.private.jsonl";
const LOCK_ROOT = `_control/locks/${BATCH}.lock`;
const LOCK_OWNER_NAME = "owner.json";
const RECEIPT_BATCH_ROOT = `_control/receipts/migrations/${BATCH}`;
const RECEIPT_PATH = `${RECEIPT_BATCH_ROOT}/result.json`;
const RECEIPT_TEMP_NAME = ".result.pending";
const RECEIPT_PROGRAM_NAME = "apply.mjs";
const RECEIPT_SELECTORS_NAME = "selectors.json";

const SELECTOR_SOURCE_COMMIT = "4d2aed0fe698d02eaa1cb0c9b5cde9560384776c";
const SELECTOR_SOURCE_CATALOGUE_SHA256 =
  "fe6459827f8492200f64507fce21ebc8a0187bb5d78f418aa016c0c6f3ba3275";
const SELECTOR_IDS = Object.freeze([
  "gutcheck-generated-diagnostic-frames",
  "gutcheck-git-record-mirrors",
  "gutcheck-workspace-remainder",
]);

const CATALOGUE_PATH = resolve(REPO_ROOT, "docs/nas-assets.json");
const LEDGER_PATH = resolve(REPO_ROOT, "docs/nas-ledger.json");
const CANDIDATE_LEDGER_PATH = resolve(REPO_ROOT, "out/nas-ledger.after.json");

const PINNED = Object.freeze({
  catalogue: {
    bytes: 66_060,
    sha256: "49a83a59ee158345731f8d27b18caf1eff546ade2d8282a31dd508b52fa33ca2",
  },
  ledger: {
    bytes: 5_263_948,
    sha256: "76d8c54f20e75913dda3e621dd67a45321cab130559a7956a6cb8ccc1e53a6b4",
  },
  source: {
    files: 931,
    bytes: 833_991_988,
    treeSha256: "63e32a8ab0e3025cbba22ba8e789e65be0c283fbc8595247b21fb65b34ea7ddd",
  },
  diagnostic: {
    files: 434,
    bytes: 666_233_360,
    treeSha256: "d223ded77137f5fb2bd0bdb73d40def04d2ec6df8aa3000d87ecd034774e572b",
  },
  redundant: {
    files: 128,
    bytes: 174_537,
    treeSha256: "58c693738d3373eaa55d10f57ce6e88edc29637eb9cb673cedb114394c93852f",
  },
  remainder: {
    files: 369,
    bytes: 167_584_091,
    treeSha256: "4b6842984673c8263e3b493d1c96e3f483eeb9adc4f45990a74ee2b7a261a8d8",
  },
  quarantine: {
    files: 497,
    bytes: 167_758_628,
    treeSha256: "d0f92c9e14d0f1e42905fdc99ba134106ad939239322aa5e19768e108f8e71e8",
    manifestBytes: 119_048,
    manifestSha256: "ac1a27c3d30c4b1f69b2e01f3c2476d225121c3026ca904df1c28738dc24a957",
  },
  finalLedger: {
    files: 22_728,
    bytes: 468_862_902_379,
    manifestBytes: 5_165_509,
    manifestSha256: "aedde64bb1d01632d790fbf0d3a5ca7a3b3a594b90f3714033b48b1cfeccee05",
  },
  selectors: {
    bytes: 4_478,
    sha256: "5dd489853d35d2cd8efffdbc0df10b20d4da7c62a2cda42e7e4b03a129cce37c",
  },
});

const DIAGNOSTIC_TOP_LEVEL = Object.freeze([
  "cart-B",
  "p7",
  "pgm",
  "pgm-1200",
  "pgm-1200-noise",
  "pgm-1200-plate",
  "pgm-384-z144-n0",
  "pgm-384-z48-n0",
]);

const REDUNDANT_FIGURE_RECORDS = new Set([
  "figs/fig10-record.json",
  "figs/fig11-record.json",
  "figs/fig13-record.json",
  "figs/fig15-record.json",
  "figs/fig16-record.json",
  "figs/fig17-record.json",
  "figs/fig19-record.json",
  "figs/fig20-record.json",
  "figs/fig20v2-record.json",
  "figs/fig21-record.json",
  "figs/fig29-record.json",
  "figs/fig3-record.json",
  "figs/fig30-record.json",
  "figs/fig31-record.json",
  "figs/fig32-record.json",
  "figs/fig33-record.json",
  "figs/fig37-record.json",
  "figs/fig38-record.json",
  "figs/fig39-record.json",
  "figs/fig40-record.json",
  "figs/fig41-record.json",
  "figs/fig42-record.json",
  "figs/fig42v2-record.json",
  "figs/fig43-record.json",
  "figs/fig44-record.json",
  "figs/fig45-record.json",
  "figs/fig46-record.json",
  "figs/fig47-record.json",
  "figs/fig6-record.json",
  "figs/fig7-record.json",
  "figs/fig8-record.json",
  "figs/fig9-record.json",
  "figs/fig9v2-record.json",
  "figs/smoke-capped-record.json",
  "figs/test-plate-record.json",
]);

const EXPECTED_MOVE_RECORD = Object.freeze({
  date: "2026-08-16",
  group:
    "Gutcheck workspace correction: classified diagnostic frames moved to their generated-cache collection; redundant Git mirrors and still-mixed rows moved to private quarantine",
  files: 931,
  bytes: 833991988,
  method: "manifest-selected absent-target same-share renames; no payload deletion",
  verification:
    "exact 931-row source full-hash; disjoint 434/128/369 partition; final 434-row collection and 497-row quarantine full-hash; private quarantine manifest and aggregate correction receipt byte-verified",
});

class Refusal extends Error {
  constructor(code) {
    super(code);
    this.name = "Refusal";
    this.code = code;
  }
}

const refuse = (code) => {
  throw new Refusal(code);
};

const compareBytes = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const compactJson = (value) => Buffer.from(JSON.stringify(value), "utf8");
const pathContains = (parent, child) => child === parent || child.startsWith(`${parent}/`);
const isMissing = (error) => error?.code === "ENOENT";

const fullStatIdentity = (status) =>
  [
    status.dev,
    status.ino,
    status.mode,
    status.nlink,
    status.size,
    status.mtimeMs,
    status.ctimeMs,
  ].join(":");

const inodeIdentity = (status) =>
  [status.dev, status.ino, status.mode, status.nlink, status.size].join(":");

const directoryIdentity = (status) => [status.dev, status.ino, status.mode].join(":");

function existsLexically(path) {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (isMissing(error)) return false;
    refuse("path-state-unreadable");
  }
}

function assertAbsent(path, code = "required-target-not-absent") {
  if (existsLexically(path)) refuse(code);
}

function assertPortableChildAbsent(parent, name, code = "portable-target-not-absent") {
  assertDirectory(parent, code);
  if (name.includes("/") || name === "." || name === ".." || name === "") refuse(code);
  try {
    assertPortableShareRelativePath(name, "target child");
  } catch {
    refuse(code);
  }
  const key = portableSharePathCollisionKey(name);
  if (readdirSync(parent.path).some((entry) => portableSharePathCollisionKey(entry) === key)) {
    refuse(code);
  }
  assertDirectory(parent, code);
}

function assertPortableChildUnique(parent, name, code = "portable-target-collision") {
  assertDirectory(parent, code);
  const key = portableSharePathCollisionKey(name);
  const matches = readdirSync(parent.path).filter((entry) => portableSharePathCollisionKey(entry) === key);
  if (matches.length !== 1 || matches[0] !== name) refuse(code);
  assertDirectory(parent, code);
}

function decodeJson(bytes, code) {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    refuse(code);
  }
  let source;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    refuse(code);
  }
  try {
    return JSON.parse(source);
  } catch {
    refuse(code);
  }
}

function readStableOrdinaryFile(path, maximumBytes, code) {
  let initial;
  try {
    initial = lstatSync(path);
  } catch {
    refuse(code);
  }
  if (!initial.isFile() || initial.isSymbolicLink() || initial.nlink !== 1 || initial.size > maximumBytes) {
    refuse(code);
  }
  let fd;
  try {
    fd = openSync(
      path,
      constants.O_RDONLY | (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
    );
  } catch {
    refuse(code);
  }
  try {
    const before = fstatSync(fd);
    if (!before.isFile() || before.nlink !== 1 || fullStatIdentity(before) !== fullStatIdentity(initial)) {
      refuse(code);
    }
    const chunks = [];
    let total = 0;
    while (true) {
      const remaining = maximumBytes - total;
      if (remaining < 0) refuse(code);
      const chunk = Buffer.allocUnsafe(Math.min(1024 * 1024, remaining + 1));
      const count = readSync(fd, chunk, 0, chunk.length, null);
      if (count === 0) break;
      total += count;
      if (total > maximumBytes) refuse(code);
      chunks.push(chunk.subarray(0, count));
    }
    const after = fstatSync(fd);
    let current;
    try {
      current = lstatSync(path);
    } catch {
      refuse(code);
    }
    if (
      fullStatIdentity(before) !== fullStatIdentity(after) ||
      fullStatIdentity(before) !== fullStatIdentity(current) ||
      current.isSymbolicLink() ||
      !current.isFile() ||
      current.nlink !== 1 ||
      total !== before.size
    ) {
      refuse(code);
    }
    const bytes = Buffer.concat(chunks, total);
    return {
      bytes,
      byteLength: bytes.byteLength,
      sha256: sha256(bytes),
      identity: fullStatIdentity(current),
    };
  } finally {
    closeSync(fd);
  }
}

// SMB metadata caches can report different mtime/ctime values for the same open inode through
// lstat and fstat. NAS control files are always checked against exact expected bytes, so bind the
// path to one ordinary inode, mode, link count and size while reading, without treating those
// server timestamp discrepancies as content mutation.
function readStableNasControlFile(path, maximumBytes, code) {
  let initial;
  try {
    initial = lstatSync(path);
  } catch {
    refuse(code);
  }
  if (!initial.isFile() || initial.isSymbolicLink() || initial.nlink !== 1 || initial.size > maximumBytes) {
    refuse(code);
  }
  let fd;
  try {
    fd = openSync(
      path,
      constants.O_RDONLY | (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
    );
  } catch {
    refuse(code);
  }
  try {
    const before = fstatSync(fd);
    if (!before.isFile() || before.nlink !== 1 || inodeIdentity(before) !== inodeIdentity(initial)) {
      refuse(code);
    }
    const chunks = [];
    let total = 0;
    while (true) {
      const remaining = maximumBytes - total;
      if (remaining < 0) refuse(code);
      const chunk = Buffer.allocUnsafe(Math.min(1024 * 1024, remaining + 1));
      const count = readSync(fd, chunk, 0, chunk.length, null);
      if (count === 0) break;
      total += count;
      if (total > maximumBytes) refuse(code);
      chunks.push(chunk.subarray(0, count));
    }
    const after = fstatSync(fd);
    let current;
    try {
      current = lstatSync(path);
    } catch {
      refuse(code);
    }
    if (
      inodeIdentity(before) !== inodeIdentity(after) ||
      inodeIdentity(before) !== inodeIdentity(current) ||
      current.isSymbolicLink() ||
      !current.isFile() ||
      current.nlink !== 1 ||
      total !== before.size ||
      realpathSync.native(path) !== path
    ) {
      refuse(code);
    }
    const bytes = Buffer.concat(chunks, total);
    return {
      bytes,
      byteLength: bytes.byteLength,
      sha256: sha256(bytes),
      identity: inodeIdentity(current),
    };
  } finally {
    closeSync(fd);
  }
}

function assertPinnedFile(read, pin, code) {
  if (read.byteLength !== pin.bytes || read.sha256 !== pin.sha256) refuse(code);
}

function asObject(value, code) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) refuse(code);
  return value;
}

function asFileRows(value, code) {
  if (!Array.isArray(value)) refuse(code);
  const collisionKeys = new Set();
  return value.map((raw) => {
    const row = asObject(raw, code);
    if (Object.keys(row).sort().join("\0") !== ["bytes", "path", "sha256"].join("\0")) refuse(code);
    if (typeof row.path !== "string") refuse(code);
    try {
      assertPortableShareRelativePath(row.path, "ledger row");
    } catch {
      refuse(code);
    }
    if (!Number.isSafeInteger(row.bytes) || row.bytes < 0 || !/^[0-9a-f]{64}$/u.test(row.sha256)) {
      refuse(code);
    }
    const collisionKey = portableSharePathCollisionKey(row.path);
    if (collisionKeys.has(collisionKey)) refuse(code);
    collisionKeys.add(collisionKey);
    return { path: row.path, bytes: row.bytes, sha256: row.sha256 };
  });
}

function summaryForRows(rows) {
  const sorted = [...rows].sort((left, right) => compareBytes(left.relativePath, right.relativePath));
  let bytes = 0;
  const collisions = new Set();
  for (const row of sorted) {
    try {
      assertPortableShareRelativePath(row.relativePath, "selection row");
    } catch {
      refuse("partition-invalid");
    }
    const key = portableSharePathCollisionKey(row.relativePath);
    if (collisions.has(key)) refuse("partition-invalid");
    collisions.add(key);
    bytes += row.bytes;
    if (!Number.isSafeInteger(bytes)) refuse("partition-invalid");
  }
  return {
    files: sorted.length,
    bytes,
    treeSha256: sha256(
      Buffer.from(JSON.stringify(sorted.map((row) => [row.relativePath, row.bytes, row.sha256]))),
    ),
    rows: sorted,
  };
}

function assertSummary(actual, expected, code) {
  if (
    actual.files !== expected.files ||
    actual.bytes !== expected.bytes ||
    actual.treeSha256 !== expected.treeSha256
  ) {
    refuse(code);
  }
}

function classifyRow(relativePath) {
  if (DIAGNOSTIC_TOP_LEVEL.some((prefix) => pathContains(prefix, relativePath))) return "diagnostic";
  const underGeneratedRecords = pathContains("gen", relativePath) && !pathContains("gen/renders", relativePath);
  if (underGeneratedRecords || REDUNDANT_FIGURE_RECORDS.has(relativePath)) return "redundant";
  return "remainder";
}

function buildPrivateManifest(quarantineRows) {
  const identity = `quarantine:${BATCH}`;
  const lines = [
    JSON.stringify({
      recordType: "header",
      format: "snowflake-nas-private-owner-jsonl-v1",
      identity,
      files: PINNED.quarantine.files,
      bytes: PINNED.quarantine.bytes,
    }),
    ...quarantineRows.map((row) =>
      JSON.stringify({
        recordType: "file",
        collection: identity,
        storageClass: "unresolved",
        path: row.relativePath,
        bytes: row.bytes,
        sha256: row.sha256,
      }),
    ),
  ];
  const bytes = Buffer.from(`${lines.join("\n")}\n`, "utf8");
  if (
    bytes.byteLength !== PINNED.quarantine.manifestBytes ||
    sha256(bytes) !== PINNED.quarantine.manifestSha256
  ) {
    refuse("private-manifest-pin-mismatch");
  }
  return bytes;
}

function buildCanonicalSelectorBundle() {
  let sourceBytes;
  try {
    sourceBytes = execFileSync(
      "git",
      ["show", `${SELECTOR_SOURCE_COMMIT}:docs/nas-assets.json`],
      { cwd: REPO_ROOT, encoding: "buffer", maxBuffer: 1024 * 1024 },
    );
  } catch {
    refuse("selector-source-unavailable");
  }
  if (sha256(sourceBytes) !== SELECTOR_SOURCE_CATALOGUE_SHA256) {
    refuse("selector-source-pin-mismatch");
  }
  const source = asObject(decodeJson(sourceBytes, "selector-source-invalid"), "selector-source-invalid");
  if (!Array.isArray(source.collections)) refuse("selector-source-invalid");
  const bundle = {};
  for (const id of SELECTOR_IDS) {
    const hits = source.collections.filter(
      (collection) =>
        collection !== null &&
        typeof collection === "object" &&
        !Array.isArray(collection) &&
        collection.assetId === id &&
        collection.version === "2026-08-15",
    );
    const selector = hits[0]?.ownerManifest?.selector;
    if (hits.length !== 1 || selector === null || typeof selector !== "object" || Array.isArray(selector)) {
      refuse("selector-source-invalid");
    }
    bundle[id] = selector;
  }
  const bytes = compactJson(bundle);
  if (bytes.byteLength !== PINNED.selectors.bytes || sha256(bytes) !== PINNED.selectors.sha256) {
    refuse("selector-bundle-pin-mismatch");
  }
  return bytes;
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validateCandidateLedger(currentLedger, candidateRead, sourceRows, diagnosticRows, quarantineRows) {
  const current = asObject(currentLedger, "current-ledger-invalid");
  const candidate = asObject(decodeJson(candidateRead.bytes, "candidate-ledger-invalid"), "candidate-ledger-invalid");
  const currentKeys = Object.keys(current).sort();
  const candidateKeys = Object.keys(candidate).sort();
  if (!sameJson(currentKeys, candidateKeys)) refuse("candidate-ledger-invalid");
  if (!sameJson(candidate.nas, current.nas)) refuse("candidate-ledger-invalid");
  if (!Array.isArray(current.moves) || !Array.isArray(candidate.moves)) refuse("candidate-ledger-invalid");
  if (
    candidate.moves.length !== current.moves.length + 1 ||
    !sameJson(candidate.moves.slice(0, -1), current.moves) ||
    !sameJson(candidate.moves.at(-1), EXPECTED_MOVE_RECORD)
  ) {
    refuse("candidate-ledger-invalid");
  }
  if (
    typeof candidate.generated !== "string" ||
    !/^2026-08-16T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/u.test(candidate.generated)
  ) {
    refuse("candidate-ledger-invalid");
  }
  if (
    candidate.fileCount !== PINNED.finalLedger.files ||
    candidate.totalBytes !== PINNED.finalLedger.bytes
  ) {
    refuse("candidate-ledger-invalid");
  }

  const currentFiles = asFileRows(current.files, "current-ledger-invalid");
  const candidateFiles = asFileRows(candidate.files, "candidate-ledger-invalid");
  if (current.fileCount !== currentFiles.length) refuse("current-ledger-invalid");
  const sourcePaths = new Set(sourceRows.map((row) => row.sharePath));
  const diagnosticBySharePath = new Map(diagnosticRows.map((row) => [row.sharePath, row]));
  const quarantinePaths = new Set(quarantineRows.map((row) => row.sharePath));
  if (sourcePaths.size !== PINNED.source.files || quarantinePaths.size !== PINNED.quarantine.files) {
    refuse("candidate-ledger-invalid");
  }
  const expected = [];
  for (const row of currentFiles) {
    if (!sourcePaths.has(row.path)) {
      expected.push(row);
      continue;
    }
    if (quarantinePaths.has(row.path)) continue;
    const selected = diagnosticBySharePath.get(row.path);
    if (selected === undefined) refuse("candidate-ledger-invalid");
    expected.push({
      path: `${FINAL_LOCATOR}/${selected.relativePath}`,
      bytes: row.bytes,
      sha256: row.sha256,
    });
  }
  const byPath = (left, right) => compareBytes(left.path, right.path);
  expected.sort(byPath);
  candidateFiles.sort(byPath);
  if (!sameJson(expected, candidateFiles)) refuse("candidate-ledger-row-transform-mismatch");
  const total = candidateFiles.reduce((sum, row) => sum + row.bytes, 0);
  if (total !== PINNED.finalLedger.bytes || candidateFiles.length !== PINNED.finalLedger.files) {
    refuse("candidate-ledger-invalid");
  }
  for (const row of candidateFiles) {
    if (!row.path.startsWith("collections/") || row.path.startsWith(`${SOURCE_LOCATOR}/`) || row.path.startsWith("_control/")) {
      refuse("candidate-ledger-invalid");
    }
  }
}

function loadLocalContracts() {
  const programRead = readStableOrdinaryFile(PROGRAM_PATH, 1024 * 1024, "apply-program-read-failed");
  const catalogueRead = readStableOrdinaryFile(CATALOGUE_PATH, PINNED.catalogue.bytes, "catalogue-read-failed");
  assertPinnedFile(catalogueRead, PINNED.catalogue, "catalogue-pin-mismatch");
  const ledgerRead = readStableOrdinaryFile(LEDGER_PATH, PINNED.ledger.bytes, "ledger-read-failed");
  assertPinnedFile(ledgerRead, PINNED.ledger, "ledger-pin-mismatch");
  const candidateRead = readStableOrdinaryFile(
    CANDIDATE_LEDGER_PATH,
    32 * 1024 * 1024,
    "candidate-ledger-required",
  );
  assertPinnedFile(
    candidateRead,
    { bytes: PINNED.finalLedger.manifestBytes, sha256: PINNED.finalLedger.manifestSha256 },
    "candidate-ledger-pin-mismatch",
  );

  let catalogue;
  try {
    catalogue = parseNasAssetCatalogV1(new TextDecoder("utf-8", { fatal: true }).decode(catalogueRead.bytes));
  } catch {
    refuse("catalogue-schema-invalid");
  }
  const sourceCollection = catalogue.collections.filter(
    (collection) => `${collection.assetId}@${collection.version}` === SOURCE_COLLECTION,
  );
  if (
    sourceCollection.length !== 1 ||
    sourceCollection[0].state !== "provisional" ||
    sourceCollection[0].locator !== SOURCE_LOCATOR ||
    sourceCollection[0].aggregate.files !== PINNED.source.files ||
    sourceCollection[0].aggregate.bytes !== PINNED.source.bytes
  ) {
    refuse("source-catalogue-contract-mismatch");
  }
  let selection;
  try {
    selection = bindCollectionSelection({
      catalogue,
      collection: SOURCE_COLLECTION,
      ownerManifestBytes: ledgerRead.bytes,
    });
  } catch {
    refuse("source-selection-invalid");
  }
  const source = summaryForRows(selection.files);
  assertSummary(source, PINNED.source, "source-selection-pin-mismatch");

  const partitionRows = { diagnostic: [], redundant: [], remainder: [] };
  for (const row of selection.files) partitionRows[classifyRow(row.relativePath)].push(row);
  const diagnostic = summaryForRows(partitionRows.diagnostic);
  const redundant = summaryForRows(partitionRows.redundant);
  const remainder = summaryForRows(partitionRows.remainder);
  const quarantine = summaryForRows([...partitionRows.redundant, ...partitionRows.remainder]);
  assertSummary(diagnostic, PINNED.diagnostic, "diagnostic-partition-pin-mismatch");
  assertSummary(redundant, PINNED.redundant, "redundant-partition-pin-mismatch");
  assertSummary(remainder, PINNED.remainder, "remainder-partition-pin-mismatch");
  assertSummary(quarantine, PINNED.quarantine, "quarantine-partition-pin-mismatch");
  if (
    diagnostic.files + redundant.files + remainder.files !== source.files ||
    diagnostic.bytes + redundant.bytes + remainder.bytes !== source.bytes
  ) {
    refuse("partition-not-disjoint-and-exhaustive");
  }
  const ownerCount = new Map();
  for (const group of [diagnostic.rows, redundant.rows, remainder.rows]) {
    for (const row of group) ownerCount.set(row.relativePath, (ownerCount.get(row.relativePath) ?? 0) + 1);
  }
  if (ownerCount.size !== source.files || [...ownerCount.values()].some((count) => count !== 1)) {
    refuse("partition-not-disjoint-and-exhaustive");
  }

  validateCandidateLedger(
    decodeJson(ledgerRead.bytes, "current-ledger-invalid"),
    candidateRead,
    selection.files,
    diagnostic.rows,
    quarantine.rows,
  );
  const privateManifestBytes = buildPrivateManifest(quarantine.rows);
  const selectorBundleBytes = buildCanonicalSelectorBundle();
  return {
    programRead,
    catalogueRead,
    ledgerRead,
    candidateRead,
    selection,
    source,
    diagnostic,
    redundant,
    remainder,
    quarantine,
    privateManifestBytes,
    selectorBundleBytes,
  };
}

function resolveShareRoot(explicitRoot) {
  const environment = explicitRoot === null
    ? process.env
    : { VCC_NAS_ROOT: explicitRoot, GUTCHECK_NAS_ROOT: undefined };
  let detected;
  try {
    detected = explicitRoot === null ? detectNasMount(environment) : detectNasMount(environment, []);
  } catch {
    refuse("marked-share-validation-failed");
  }
  if (detected === null) refuse("marked-share-not-attached");
  const lexical = resolve(detected);
  let real;
  let status;
  try {
    real = realpathSync.native(lexical);
    status = lstatSync(real);
  } catch {
    refuse("marked-share-validation-failed");
  }
  if (!status.isDirectory() || status.isSymbolicLink()) refuse("marked-share-validation-failed");
  return { path: real, dev: status.dev, ino: status.ino, mode: status.mode };
}

function absolute(share, relativePath) {
  try {
    assertPortableShareRelativePath(relativePath, "fixed migration path");
  } catch {
    refuse("fixed-path-invalid");
  }
  const path = resolve(share.path, relativePath);
  if (!pathIsWithinRoot(share.path, path)) refuse("fixed-path-escape");
  return path;
}

function captureDirectory(share, relativePath, code = "directory-invalid") {
  const path = absolute(share, relativePath);
  let current = share.path;
  let final;
  try {
    for (const part of relativePath.split("/")) {
      current = resolve(current, part);
      const status = lstatSync(current);
      if (!status.isDirectory() || status.isSymbolicLink() || status.dev !== share.dev) refuse(code);
      final = status;
    }
    if (realpathSync.native(path) !== path || !pathIsWithinRoot(share.path, path)) refuse(code);
  } catch (error) {
    if (error instanceof Refusal) throw error;
    refuse(code);
  }
  return {
    relativePath,
    path,
    dev: final.dev,
    ino: final.ino,
    mode: final.mode,
    identity: directoryIdentity(final),
  };
}

function assertDirectory(binding, code = "directory-changed") {
  let status;
  try {
    status = lstatSync(binding.path);
    if (
      !status.isDirectory() ||
      status.isSymbolicLink() ||
      directoryIdentity(status) !== binding.identity ||
      realpathSync.native(binding.path) !== binding.path
    ) {
      refuse(code);
    }
  } catch (error) {
    if (error instanceof Refusal) throw error;
    refuse(code);
  }
  return status;
}

function assertShare(share) {
  let current;
  try {
    current = lstatSync(share.path);
  } catch {
    refuse("share-changed");
  }
  if (
    !current.isDirectory() ||
    current.isSymbolicLink() ||
    current.dev !== share.dev ||
    current.ino !== share.ino ||
    realpathSync.native(share.path) !== share.path
  ) {
    refuse("share-changed");
  }
}

function fsyncDirectory(binding) {
  assertDirectory(binding);
  const fd = openSync(binding.path, constants.O_RDONLY);
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  assertDirectory(binding);
}

function assertStrictTreeShape(share, rootPath, code) {
  const root = lstatSync(rootPath);
  if (!root.isDirectory() || root.isSymbolicLink() || root.dev !== share.dev) refuse(code);
  if (realpathSync.native(rootPath) !== rootPath || !pathIsWithinRoot(share.path, rootPath)) refuse(code);
  const portableKeys = new Set();
  const topLevel = [];
  const walk = (directory, prefix) => {
    const before = lstatSync(directory);
    if (!before.isDirectory() || before.isSymbolicLink() || before.dev !== share.dev) refuse(code);
    const entries = readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
      compareBytes(left.name, right.name),
    );
    if (entries.length === 0) refuse(code);
    for (const entry of entries) {
      const relativePath = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      try {
        assertPortableShareRelativePath(relativePath, "payload path");
      } catch {
        refuse(code);
      }
      const collisionKey = portableSharePathCollisionKey(relativePath);
      if (portableKeys.has(collisionKey)) refuse(code);
      portableKeys.add(collisionKey);
      const entryPath = resolve(directory, entry.name);
      const status = lstatSync(entryPath);
      if (status.isSymbolicLink() || status.dev !== share.dev) refuse(code);
      if (status.isDirectory()) {
        if (realpathSync.native(entryPath) !== entryPath) refuse(code);
        walk(entryPath, relativePath);
      } else if (status.isFile()) {
        if (status.nlink !== 1 || realpathSync.native(entryPath) !== entryPath) refuse(code);
      } else {
        refuse(code);
      }
      if (prefix === "") topLevel.push({ name: entry.name, status });
    }
    const afterNames = readdirSync(directory).sort(compareBytes);
    const after = lstatSync(directory);
    if (
      fullStatIdentity(before) !== fullStatIdentity(after) ||
      afterNames.length !== entries.length ||
      afterNames.some((name, index) => name !== entries[index]?.name)
    ) {
      refuse(code);
    }
  };
  walk(rootPath, "");
  return topLevel.sort((left, right) => compareBytes(left.name, right.name));
}

function comparePhysicalInventory(inventory, expected, code) {
  if (
    inventory.fileCount !== expected.files ||
    inventory.totalBytes !== expected.bytes ||
    inventory.treeSha256 !== expected.treeSha256 ||
    inventory.files.length !== expected.rows.length
  ) {
    refuse(code);
  }
  for (let index = 0; index < expected.rows.length; index += 1) {
    const actual = inventory.files[index];
    const row = expected.rows[index];
    if (
      actual.path !== row.relativePath ||
      actual.byteLength !== row.bytes ||
      actual.sha256 !== row.sha256
    ) {
      refuse(code);
    }
  }
}

function verifyPhysicalTree(share, rootPath, expected, code) {
  const topLevel = assertStrictTreeShape(share, rootPath, code);
  let inventory;
  try {
    inventory = inventoryStableTree(rootPath);
  } catch {
    refuse(code);
  }
  assertStrictTreeShape(share, rootPath, code);
  comparePhysicalInventory(inventory, expected, code);
  return { inventory, topLevel };
}

function captureEntry(parent, name, code = "entry-invalid") {
  assertDirectory(parent);
  const path = resolve(parent.path, name);
  if (!pathIsWithinRoot(parent.path, path)) refuse(code);
  let status;
  try {
    status = lstatSync(path);
  } catch {
    refuse(code);
  }
  if (status.isSymbolicLink() || (!status.isDirectory() && !status.isFile()) || status.nlink < 1) refuse(code);
  if (status.isFile() && status.nlink !== 1) refuse(code);
  if (realpathSync.native(path) !== path) refuse(code);
  return {
    name,
    path,
    dev: status.dev,
    ino: status.ino,
    mode: status.mode,
    size: status.size,
    isDirectory: status.isDirectory(),
    identity: inodeIdentity(status),
  };
}

function assertEntry(entry, code = "entry-changed") {
  let current;
  try {
    current = lstatSync(entry.path);
  } catch {
    refuse(code);
  }
  if (
    current.isSymbolicLink() ||
    current.isDirectory() !== entry.isDirectory ||
    current.dev !== entry.dev ||
    current.ino !== entry.ino ||
    current.mode !== entry.mode ||
    current.size !== entry.size ||
    realpathSync.native(entry.path) !== entry.path
  ) {
    refuse(code);
  }
}

function createOwnedDirectoryDirect(parent, name, mode, code = "directory-create-failed") {
  assertDirectory(parent);
  assertPortableChildAbsent(parent, name, code);
  const path = resolve(parent.path, name);
  try {
    mkdirSync(path, { mode });
    chmodSync(path, mode & 0o777);
  } catch {
    refuse(code);
  }
  const status = lstatSync(path);
  if (!status.isDirectory() || status.isSymbolicLink() || status.dev !== parent.dev || realpathSync.native(path) !== path) {
    refuse(code);
  }
  assertPortableChildUnique(parent, name, code);
  fsyncDirectory(parent);
  return {
    relativePath: parent.relativePath === "" ? name : `${parent.relativePath}/${name}`,
    path,
    dev: status.dev,
    ino: status.ino,
    mode: status.mode,
    identity: directoryIdentity(status),
  };
}

function safeRename(sourceParent, destinationParent, sourceName, destinationName = sourceName) {
  assertDirectory(sourceParent, "rename-source-parent-changed");
  assertDirectory(destinationParent, "rename-destination-parent-changed");
  const source = captureEntry(sourceParent, sourceName, "rename-source-invalid");
  const destinationPath = resolve(destinationParent.path, destinationName);
  assertPortableChildAbsent(destinationParent, destinationName, "rename-destination-not-absent");
  renameSync(source.path, destinationPath);
  const moved = { ...source, name: destinationName, path: destinationPath };
  assertEntry(moved, "renamed-entry-identity-mismatch");
  assertAbsent(source.path, "rename-source-still-present");
  assertPortableChildUnique(destinationParent, destinationName, "rename-destination-collision");
  assertDirectory(sourceParent, "rename-source-parent-changed");
  assertDirectory(destinationParent, "rename-destination-parent-changed");
  fsyncDirectory(sourceParent);
  if (sourceParent.path !== destinationParent.path) fsyncDirectory(destinationParent);
  return moved;
}

function removeProvenEmptyDirectory(binding, code = "directory-not-proven-empty") {
  assertDirectory(binding, code);
  if (readdirSync(binding.path).length !== 0) refuse(code);
  const parentPath = dirname(binding.path);
  const parentStatus = lstatSync(parentPath);
  const parent = {
    relativePath: dirname(binding.relativePath),
    path: parentPath,
    dev: parentStatus.dev,
    ino: parentStatus.ino,
    mode: parentStatus.mode,
    identity: directoryIdentity(parentStatus),
  };
  assertDirectory(parent, code);
  rmdirSync(binding.path);
  assertAbsent(binding.path, code);
  fsyncDirectory(parent);
}

function writePrivateFileNoReplace(parent, name, bytes, code) {
  assertDirectory(parent);
  const path = resolve(parent.path, name);
  assertPortableChildAbsent(parent, name, code);
  let fd;
  let created = null;
  try {
    fd = openSync(
      path,
      constants.O_CREAT |
        constants.O_EXCL |
        constants.O_WRONLY |
        (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
      0o600,
    );
    created = fstatSync(fd);
    if (!created.isFile() || created.nlink !== 1) refuse(code);
    fchmodSync(fd, 0o600);
    let offset = 0;
    while (offset < bytes.byteLength) {
      const count = writeSync(fd, bytes, offset, bytes.byteLength - offset, offset);
      if (count <= 0) refuse(code);
      offset += count;
    }
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    fsyncDirectory(parent);
    assertPortableChildUnique(parent, name, code);
    const verified = readStableNasControlFile(path, bytes.byteLength, code);
    const status = lstatSync(path);
    if (
      verified.byteLength !== bytes.byteLength ||
      verified.sha256 !== sha256(bytes) ||
      (status.mode & 0o077) !== 0 ||
      (status.mode & 0o600) !== 0o600
    ) {
      refuse(code);
    }
    return { path, identity: verified.identity, byteLength: verified.byteLength, sha256: verified.sha256 };
  } catch {
    if (fd !== undefined) {
      try {
        closeSync(fd);
      } catch {
        // The guarded path cleanup below remains identity-bound.
      }
    }
    if (created !== null) {
      try {
        const current = lstatSync(path);
        if (current.dev === created.dev && current.ino === created.ino && current.isFile() && !current.isSymbolicLink()) {
          unlinkSync(path);
          fsyncDirectory(parent);
        }
      } catch {
        // Ambiguous cleanup is intentionally left beneath the held transaction lock.
      }
    }
    refuse(code);
  }
}

function unlinkExactPrivateFile(path, expectedBytes, expectedSha256, code) {
  const read = readStableNasControlFile(path, expectedBytes, code);
  if (read.byteLength !== expectedBytes || read.sha256 !== expectedSha256) refuse(code);
  const before = lstatSync(path);
  if ((before.mode & 0o077) !== 0 || (before.mode & 0o600) !== 0o600) refuse(code);
  unlinkSync(path);
  assertAbsent(path, code);
  return before;
}

function normalizedSourceModes(sourceModes, code = "migration-lock-invalid") {
  const modes = {};
  for (const key of ["asset", "version", "payload"]) {
    const mode = sourceModes?.[key];
    if (!Number.isInteger(mode) || mode < 0 || mode > 0o777) refuse(code);
    modes[key] = mode;
  }
  return modes;
}

function lockOwnerBytes(sourceModes) {
  return compactJson({
    format: "snowflake-nas-migration-lock-v1",
    batch: BATCH,
    operation: "migration",
    sourceModes: normalizedSourceModes(sourceModes),
  });
}

function acquireLock(parents, sourceModes) {
  const lockDirectory = createOwnedDirectoryDirect(parents.locks, `${BATCH}.lock`, 0o700, "migration-lock-held");
  const ownerBytes = lockOwnerBytes(sourceModes);
  try {
    const owner = writePrivateFileNoReplace(lockDirectory, LOCK_OWNER_NAME, ownerBytes, "migration-lock-write-failed");
    return { directory: lockDirectory, owner, ownerBytes, sourceModes: normalizedSourceModes(sourceModes) };
  } catch (error) {
    try {
      removeProvenEmptyDirectory(lockDirectory, "migration-lock-write-failed");
    } catch {
      // A non-empty or ambiguous lock remains fail-closed for manual inspection.
    }
    throw error;
  }
}

function bindExistingLock(share) {
  const directory = captureDirectory(share, LOCK_ROOT, "migration-lock-invalid");
  const ownerPath = resolve(directory.path, LOCK_OWNER_NAME);
  const owner = readStableNasControlFile(ownerPath, 1024, "migration-lock-invalid");
  const decoded = asObject(decodeJson(owner.bytes, "migration-lock-invalid"), "migration-lock-invalid");
  if (
    Object.keys(decoded).sort().join("\0") !==
      ["batch", "format", "operation", "sourceModes"].sort().join("\0") ||
    decoded.format !== "snowflake-nas-migration-lock-v1" ||
    decoded.batch !== BATCH ||
    decoded.operation !== "migration"
  ) {
    refuse("migration-lock-invalid");
  }
  const modesObject = asObject(decoded.sourceModes, "migration-lock-invalid");
  if (Object.keys(modesObject).sort().join("\0") !== ["asset", "payload", "version"].sort().join("\0")) {
    refuse("migration-lock-invalid");
  }
  const sourceModes = normalizedSourceModes(modesObject);
  const ownerBytes = lockOwnerBytes(sourceModes);
  if (!owner.bytes.equals(ownerBytes)) refuse("migration-lock-invalid");
  if (readdirSync(directory.path).sort(compareBytes).join("\0") !== LOCK_OWNER_NAME) {
    refuse("migration-lock-invalid");
  }
  return { directory, owner: { path: ownerPath, ...owner }, ownerBytes, sourceModes };
}

function releaseLock(lock) {
  assertDirectory(lock.directory, "migration-lock-changed");
  const current = readStableNasControlFile(lock.owner.path, lock.ownerBytes.byteLength, "migration-lock-changed");
  if (current.sha256 !== sha256(lock.ownerBytes) || current.identity !== lock.owner.identity) {
    refuse("migration-lock-changed");
  }
  unlinkSync(lock.owner.path);
  assertAbsent(lock.owner.path, "migration-lock-release-failed");
  removeProvenEmptyDirectory(lock.directory, "migration-lock-release-failed");
}

function existingParents(share) {
  const parents = {
    collections: captureDirectory(share, "collections"),
    staging: captureDirectory(share, "_control/staging"),
    locks: captureDirectory(share, "_control/locks"),
    receipts: captureDirectory(share, "_control/receipts/migrations"),
    quarantine: captureDirectory(share, "_control/quarantine/unresolved"),
  };
  for (const binding of Object.values(parents)) {
    if (binding.dev !== share.dev) refuse("cross-device-parent");
  }
  return parents;
}

function assertMigrationTargetsAbsent(parents) {
  assertPortableChildAbsent(parents.collections, "gutcheck-generated-diagnostic-frames");
  assertPortableChildAbsent(parents.quarantine, BATCH);
  assertPortableChildAbsent(parents.receipts, BATCH);
  assertPortableChildAbsent(parents.staging, BATCH);
}

function assertInitialTargetsAbsent(parents) {
  assertMigrationTargetsAbsent(parents);
  assertPortableChildAbsent(parents.locks, `${BATCH}.lock`);
}

function assertSourceTopLevel(physical) {
  const actual = physical.topLevel.map((entry) => entry.name).sort(compareBytes);
  const expected = [...new Set(physical.inventory.files.map((file) => file.path.split("/")[0]))].sort(compareBytes);
  if (!sameJson(actual, expected)) refuse("source-top-level-shape-invalid");
  for (const name of DIAGNOSTIC_TOP_LEVEL) {
    const entry = physical.topLevel.find((candidate) => candidate.name === name);
    if (entry === undefined || !entry.status.isDirectory() || entry.status.isSymbolicLink()) {
      refuse("diagnostic-subtree-shape-invalid");
    }
  }
}

function revalidateCandidate(contracts) {
  const candidate = readStableOrdinaryFile(CANDIDATE_LEDGER_PATH, 32 * 1024 * 1024, "candidate-ledger-changed");
  if (
    candidate.byteLength !== contracts.candidateRead.byteLength ||
    candidate.sha256 !== contracts.candidateRead.sha256 ||
    candidate.identity !== contracts.candidateRead.identity
  ) {
    refuse("candidate-ledger-changed");
  }
}

function revalidateDurableInputs(contracts) {
  revalidateCandidate(contracts);
  const catalogue = readStableOrdinaryFile(CATALOGUE_PATH, PINNED.catalogue.bytes, "catalogue-changed");
  if (
    catalogue.byteLength !== contracts.catalogueRead.byteLength ||
    catalogue.sha256 !== contracts.catalogueRead.sha256 ||
    catalogue.identity !== contracts.catalogueRead.identity
  ) {
    refuse("catalogue-changed");
  }
  const ledger = readStableOrdinaryFile(LEDGER_PATH, PINNED.ledger.bytes, "ledger-changed");
  if (
    ledger.byteLength !== contracts.ledgerRead.byteLength ||
    ledger.sha256 !== contracts.ledgerRead.sha256 ||
    ledger.identity !== contracts.ledgerRead.identity
  ) {
    refuse("ledger-changed");
  }
  const program = readStableOrdinaryFile(PROGRAM_PATH, 1024 * 1024, "apply-program-changed");
  if (
    program.byteLength !== contracts.programRead.byteLength ||
    program.sha256 !== contracts.programRead.sha256 ||
    program.identity !== contracts.programRead.identity
  ) {
    refuse("apply-program-changed");
  }
  const selectors = buildCanonicalSelectorBundle();
  if (!selectors.equals(contracts.selectorBundleBytes)) refuse("selector-bundle-changed");
}

function buildReceipt(contracts) {
  return {
    format: "snowflake-nas-layout-migration-correction-v1",
    batch: BATCH,
    moved: { files: PINNED.source.files, bytes: PINNED.source.bytes },
    collection: {
      id: "gutcheck-generated-diagnostic-frames@2026-08-15",
      files: PINNED.diagnostic.files,
      bytes: PINNED.diagnostic.bytes,
      treeSha256: PINNED.diagnostic.treeSha256,
      ownerManifest: {
        bytes: contracts.candidateRead.byteLength,
        sha256: contracts.candidateRead.sha256,
      },
      selectorBundleSha256: sha256(contracts.selectorBundleBytes),
    },
    applyProgram: {
      bytes: contracts.programRead.byteLength,
      sha256: contracts.programRead.sha256,
    },
    selectorBundle: {
      sourceCommit: SELECTOR_SOURCE_COMMIT,
      sourceCatalogueSha256: SELECTOR_SOURCE_CATALOGUE_SHA256,
      bytes: contracts.selectorBundleBytes.byteLength,
      sha256: sha256(contracts.selectorBundleBytes),
    },
    quarantine: {
      files: PINNED.quarantine.files,
      bytes: PINNED.quarantine.bytes,
      manifestBytes: PINNED.quarantine.manifestBytes,
      manifestSha256: PINNED.quarantine.manifestSha256,
    },
    verification:
      "all 931 source rows were descriptor-hashed against the bound ledger before movement; the 434/128/369 selector partition was disjoint and exhaustive; both final partitions were independently descriptor-hashed after absent-target same-share renames; both manifests, the apply program and the canonical selector bundle were byte-verified; the superseded source locator and transaction staging were absent at receipt publication",
    supersededSourceAbsent: true,
    transactionStagingAbsent: true,
  };
}

function publishAtomicReceipt(receiptParent, receipt) {
  const bytes = compactJson(receipt);
  const temp = writePrivateFileNoReplace(receiptParent, RECEIPT_TEMP_NAME, bytes, "receipt-temp-write-failed");
  const finalPath = resolve(receiptParent.path, "result.json");
  assertAbsent(finalPath, "receipt-already-exists");
  try {
    renameSync(temp.path, finalPath);
  } catch {
    const current = lstatSync(temp.path);
    if (inodeIdentity(current) === temp.identity) unlinkSync(temp.path);
    refuse("receipt-publication-failed");
  }
  fsyncDirectory(receiptParent);
  const final = readStableNasControlFile(finalPath, bytes.byteLength, "receipt-verification-failed");
  if (final.byteLength !== bytes.byteLength || final.sha256 !== sha256(bytes)) {
    refuse("receipt-verification-failed");
  }
  return final;
}

function topLevelNames(rows) {
  return [...new Set(rows.map((row) => row.relativePath.split("/")[0]))].sort(compareBytes);
}

function optionalDirectory(share, relativePath) {
  if (!existsLexically(absolute(share, relativePath))) return null;
  return captureDirectory(share, relativePath, "owned-directory-invalid");
}

function ensureOnlyAllowedEntries(binding, allowed, code) {
  if (binding === null) return;
  assertDirectory(binding, code);
  const names = readdirSync(binding.path).sort(compareBytes);
  if (names.some((name) => !allowed.has(name))) refuse(code);
}

function ensureSourceRoot(share, parents, sourceModes) {
  let sourceAsset = optionalDirectory(share, "collections/gutcheck-workspace-remainder");
  if (sourceAsset === null) {
    sourceAsset = createOwnedDirectoryDirect(
      parents.collections,
      "gutcheck-workspace-remainder",
      sourceModes.asset & 0o777,
      "rollback-source-create-failed",
    );
  }
  let sourceVersion = optionalDirectory(share, "collections/gutcheck-workspace-remainder/2026-08-15");
  if (sourceVersion === null) {
    sourceVersion = createOwnedDirectoryDirect(
      sourceAsset,
      "2026-08-15",
      sourceModes.version & 0o777,
      "rollback-source-create-failed",
    );
  }
  const sourcePath = absolute(share, SOURCE_LOCATOR);
  if (existsLexically(sourcePath)) return captureDirectory(share, SOURCE_LOCATOR, "rollback-source-invalid");
  return createOwnedDirectoryDirect(
    sourceVersion,
    "payload",
    sourceModes.payload & 0o777,
    "rollback-source-create-failed",
  );
}

function locationEntry(parent, name) {
  if (parent === null) return null;
  const path = resolve(parent.path, name);
  if (!existsLexically(path)) return null;
  return captureEntry(parent, name, "rollback-placement-invalid");
}

function removeOwnedEnvelopeIfEmpty(binding) {
  if (binding === null) return;
  removeProvenEmptyDirectory(binding, "rollback-owned-envelope-not-empty");
}

function rollbackFromDisk(share, parents, contracts, sourceModes, lock) {
  if (existsLexically(absolute(share, RECEIPT_PATH))) refuse("receipt-exists-rollback-forbidden");

  let staging = optionalDirectory(share, STAGING_ROOT);
  let stagingDiagnostic = optionalDirectory(share, STAGING_DIAGNOSTIC);
  let quarantine = optionalDirectory(share, QUARANTINE_ROOT);
  let finalAsset = optionalDirectory(share, FINAL_ASSET_ROOT);
  let finalVersion = optionalDirectory(share, FINAL_VERSION_ROOT);
  let finalPayload = optionalDirectory(share, FINAL_LOCATOR);
  let receiptBatch = optionalDirectory(share, RECEIPT_BATCH_ROOT);

  const diagnosticNames = new Set(DIAGNOSTIC_TOP_LEVEL);
  const quarantineNames = new Set(topLevelNames(contracts.quarantine.rows));
  const sourceNames = new Set([...diagnosticNames, ...quarantineNames]);
  ensureOnlyAllowedEntries(staging, new Set(["diagnostic", ROLLBACK_MANIFEST_NAME]), "rollback-staging-ambiguous");
  ensureOnlyAllowedEntries(stagingDiagnostic, diagnosticNames, "rollback-staging-ambiguous");
  ensureOnlyAllowedEntries(finalPayload, diagnosticNames, "rollback-final-ambiguous");
  ensureOnlyAllowedEntries(finalVersion, new Set(["payload"]), "rollback-final-ambiguous");
  ensureOnlyAllowedEntries(finalAsset, new Set(["2026-08-15"]), "rollback-final-ambiguous");
  ensureOnlyAllowedEntries(quarantine, new Set([...quarantineNames, PRIVATE_MANIFEST_NAME]), "rollback-quarantine-ambiguous");
  ensureOnlyAllowedEntries(
    receiptBatch,
    new Set([RECEIPT_TEMP_NAME, RECEIPT_PROGRAM_NAME, RECEIPT_SELECTORS_NAME]),
    "rollback-receipt-ambiguous",
  );

  let source = optionalDirectory(share, SOURCE_LOCATOR);
  if (source !== null) ensureOnlyAllowedEntries(source, sourceNames, "rollback-source-ambiguous");
  source = ensureSourceRoot(share, parents, sourceModes);

  const quarantineManifestPath = absolute(share, PRIVATE_MANIFEST_PATH);
  const rollbackManifestPath = resolve(staging?.path ?? "", ROLLBACK_MANIFEST_NAME);
  const manifestAtQuarantine = existsLexically(quarantineManifestPath);
  const manifestAtStaging = staging !== null && existsLexically(rollbackManifestPath);
  if (manifestAtQuarantine && manifestAtStaging) refuse("rollback-manifest-placement-ambiguous");
  if (manifestAtQuarantine) {
    if (staging === null) staging = createOwnedDirectoryDirect(parents.staging, BATCH, 0o700, "rollback-staging-create-failed");
    const read = readStableNasControlFile(
      quarantineManifestPath,
      PINNED.quarantine.manifestBytes,
      "rollback-manifest-invalid",
    );
    if (read.sha256 !== PINNED.quarantine.manifestSha256) refuse("rollback-manifest-invalid");
    safeRename(quarantine, staging, PRIVATE_MANIFEST_NAME, ROLLBACK_MANIFEST_NAME);
  }

  for (const name of quarantineNames) {
    const atSource = locationEntry(source, name);
    const atQuarantine = locationEntry(quarantine, name);
    if ((atSource === null) === (atQuarantine === null)) refuse("rollback-quarantine-placement-ambiguous");
    if (atQuarantine !== null) safeRename(quarantine, source, name);
  }

  for (const name of DIAGNOSTIC_TOP_LEVEL) {
    const placements = [
      [source, locationEntry(source, name)],
      [stagingDiagnostic, locationEntry(stagingDiagnostic, name)],
      [finalPayload, locationEntry(finalPayload, name)],
    ].filter((entry) => entry[1] !== null);
    if (placements.length !== 1) refuse("rollback-diagnostic-placement-ambiguous");
    if (placements[0][0].path !== source.path) safeRename(placements[0][0], source, name);
  }

  verifyPhysicalTree(share, source.path, contracts.source, "rollback-source-verification-failed");

  quarantine = optionalDirectory(share, QUARANTINE_ROOT);
  finalPayload = optionalDirectory(share, FINAL_LOCATOR);
  stagingDiagnostic = optionalDirectory(share, STAGING_DIAGNOSTIC);
  if (quarantine !== null) removeOwnedEnvelopeIfEmpty(quarantine);
  if (finalPayload !== null) removeOwnedEnvelopeIfEmpty(finalPayload);
  finalVersion = optionalDirectory(share, FINAL_VERSION_ROOT);
  if (finalVersion !== null) removeOwnedEnvelopeIfEmpty(finalVersion);
  finalAsset = optionalDirectory(share, FINAL_ASSET_ROOT);
  if (finalAsset !== null) removeOwnedEnvelopeIfEmpty(finalAsset);
  if (stagingDiagnostic !== null) removeOwnedEnvelopeIfEmpty(stagingDiagnostic);

  staging = optionalDirectory(share, STAGING_ROOT);
  if (staging !== null) {
    const manifestPath = resolve(staging.path, ROLLBACK_MANIFEST_NAME);
    if (existsLexically(manifestPath)) {
      unlinkExactPrivateFile(
        manifestPath,
        PINNED.quarantine.manifestBytes,
        PINNED.quarantine.manifestSha256,
        "rollback-manifest-invalid",
      );
      fsyncDirectory(staging);
    }
    removeOwnedEnvelopeIfEmpty(staging);
  }

  receiptBatch = optionalDirectory(share, RECEIPT_BATCH_ROOT);
  if (receiptBatch !== null) {
    const tempPath = resolve(receiptBatch.path, RECEIPT_TEMP_NAME);
    if (existsLexically(tempPath)) {
      const expectedReceipt = compactJson(buildReceipt(contracts));
      unlinkExactPrivateFile(
        tempPath,
        expectedReceipt.byteLength,
        sha256(expectedReceipt),
        "rollback-partial-receipt-requires-inspection",
      );
      fsyncDirectory(receiptBatch);
    }
    const programPath = resolve(receiptBatch.path, RECEIPT_PROGRAM_NAME);
    if (existsLexically(programPath)) {
      unlinkExactPrivateFile(
        programPath,
        contracts.programRead.byteLength,
        contracts.programRead.sha256,
        "rollback-program-archive-invalid",
      );
      fsyncDirectory(receiptBatch);
    }
    const selectorsPath = resolve(receiptBatch.path, RECEIPT_SELECTORS_NAME);
    if (existsLexically(selectorsPath)) {
      unlinkExactPrivateFile(
        selectorsPath,
        contracts.selectorBundleBytes.byteLength,
        sha256(contracts.selectorBundleBytes),
        "rollback-selector-archive-invalid",
      );
      fsyncDirectory(receiptBatch);
    }
    removeOwnedEnvelopeIfEmpty(receiptBatch);
  }

  for (const relativePath of [FINAL_ASSET_ROOT, QUARANTINE_ROOT, RECEIPT_BATCH_ROOT, STAGING_ROOT]) {
    assertAbsent(absolute(share, relativePath), "rollback-target-remains");
  }
  releaseLock(lock);
}

function prepareInitialShare(share, contracts) {
  assertShare(share);
  const parents = existingParents(share);
  assertInitialTargetsAbsent(parents);
  const sourceAsset = captureDirectory(share, "collections/gutcheck-workspace-remainder", "source-envelope-invalid");
  const sourceVersion = captureDirectory(
    share,
    "collections/gutcheck-workspace-remainder/2026-08-15",
    "source-envelope-invalid",
  );
  const source = captureDirectory(share, SOURCE_LOCATOR, "source-root-invalid");
  ensureOnlyAllowedEntries(sourceAsset, new Set(["2026-08-15"]), "source-envelope-not-exclusive");
  ensureOnlyAllowedEntries(sourceVersion, new Set(["payload"]), "source-envelope-not-exclusive");
  const physical = verifyPhysicalTree(share, source.path, contracts.source, "source-physical-pin-mismatch");
  assertSourceTopLevel(physical);
  for (const binding of Object.values(parents)) assertDirectory(binding);
  assertShare(share);
  return {
    parents,
    sourceAsset,
    sourceVersion,
    source,
    sourceModes: normalizedSourceModes({
      asset: sourceAsset.mode & 0o777,
      version: sourceVersion.mode & 0o777,
      payload: source.mode & 0o777,
    }),
    physical,
  };
}

function applyMigration(share, contracts, initial) {
  let lock = null;
  let receiptPublished = false;
  try {
    lock = acquireLock(initial.parents, initial.sourceModes);
    assertShare(share);
    for (const binding of Object.values(initial.parents)) assertDirectory(binding);
    assertMigrationTargetsAbsent(initial.parents);
    ensureOnlyAllowedEntries(initial.sourceAsset, new Set(["2026-08-15"]), "source-envelope-not-exclusive");
    ensureOnlyAllowedEntries(initial.sourceVersion, new Set(["payload"]), "source-envelope-not-exclusive");

    // The read-only preflight may have taken time.  Re-hash the complete source after taking the
    // lock and immediately before the first move; no pre-lock result is inherited as authority.
    const source = captureDirectory(share, SOURCE_LOCATOR, "source-root-changed");
    const lockedPhysical = verifyPhysicalTree(
      share,
      source.path,
      contracts.source,
      "locked-source-physical-pin-mismatch",
    );
    assertSourceTopLevel(lockedPhysical);

    const staging = createOwnedDirectoryDirect(initial.parents.staging, BATCH, 0o700, "staging-create-failed");
    const stagingDiagnostic = createOwnedDirectoryDirect(staging, "diagnostic", 0o700, "staging-create-failed");
    for (const name of DIAGNOSTIC_TOP_LEVEL) safeRename(source, stagingDiagnostic, name);

    verifyPhysicalTree(
      share,
      stagingDiagnostic.path,
      contracts.diagnostic,
      "diagnostic-stage-verification-failed",
    );
    verifyPhysicalTree(share, source.path, contracts.quarantine, "quarantine-source-verification-failed");

    const quarantine = createOwnedDirectoryDirect(initial.parents.quarantine, BATCH, 0o700, "quarantine-create-failed");
    const remainingNames = readdirSync(source.path).sort(compareBytes);
    const expectedRemaining = topLevelNames(contracts.quarantine.rows);
    if (!sameJson(remainingNames, expectedRemaining)) refuse("quarantine-top-level-mismatch");
    for (const name of remainingNames) safeRename(source, quarantine, name);
    verifyPhysicalTree(share, quarantine.path, contracts.quarantine, "quarantine-final-verification-failed");

    const finalAsset = createOwnedDirectoryDirect(initial.parents.collections, "gutcheck-generated-diagnostic-frames", 0o755, "final-create-failed");
    const finalVersion = createOwnedDirectoryDirect(finalAsset, "2026-08-15", 0o755, "final-create-failed");
    safeRename(staging, finalVersion, "diagnostic", "payload");
    const finalPayload = captureDirectory(share, FINAL_LOCATOR, "final-payload-invalid");

    verifyPhysicalTree(share, finalPayload.path, contracts.diagnostic, "final-diagnostic-verification-failed");
    verifyPhysicalTree(share, quarantine.path, contracts.quarantine, "final-quarantine-verification-failed");

    writePrivateFileNoReplace(
      quarantine,
      PRIVATE_MANIFEST_NAME,
      contracts.privateManifestBytes,
      "private-manifest-publication-failed",
    );

    removeProvenEmptyDirectory(source, "source-root-not-empty");
    removeProvenEmptyDirectory(initial.sourceVersion, "source-version-envelope-not-empty");
    removeProvenEmptyDirectory(initial.sourceAsset, "source-asset-envelope-not-empty");
    removeProvenEmptyDirectory(staging, "staging-root-not-empty");
    assertAbsent(absolute(share, SOURCE_LOCATOR), "source-root-remains");
    assertAbsent(absolute(share, "collections/gutcheck-workspace-remainder"), "source-envelope-remains");
    assertAbsent(absolute(share, STAGING_ROOT), "staging-root-remains");

    revalidateDurableInputs(contracts);
    assertShare(share);
    const receiptBatch = createOwnedDirectoryDirect(initial.parents.receipts, BATCH, 0o700, "receipt-directory-create-failed");
    writePrivateFileNoReplace(
      receiptBatch,
      RECEIPT_PROGRAM_NAME,
      contracts.programRead.bytes,
      "apply-program-archive-failed",
    );
    writePrivateFileNoReplace(
      receiptBatch,
      RECEIPT_SELECTORS_NAME,
      contracts.selectorBundleBytes,
      "selector-bundle-archive-failed",
    );
    publishAtomicReceipt(receiptBatch, buildReceipt(contracts));
    receiptPublished = true;
    releaseLock(lock);
    lock = null;
  } catch (error) {
    if (lock !== null && !receiptPublished && !existsLexically(absolute(share, RECEIPT_PATH))) {
      try {
        rollbackFromDisk(share, initial.parents, contracts, initial.sourceModes, lock);
        lock = null;
        process.stderr.write("rollback=complete receipt=absent\n");
      } catch {
        process.stderr.write("rollback=failed lock=retained receipt=absent\n");
      }
    } else if (receiptPublished || existsLexically(absolute(share, RECEIPT_PATH))) {
      process.stderr.write("rollback=forbidden receipt=published\n");
    }
    throw error;
  }
}

function parseArguments(argv) {
  let mode = "dry-run";
  let explicitRoot = null;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--apply") {
      if (mode !== "dry-run") refuse("arguments-invalid");
      mode = "apply";
    } else if (arg === "--rollback") {
      if (mode !== "dry-run") refuse("arguments-invalid");
      mode = "rollback";
    } else if (arg === "--nas-root") {
      if (explicitRoot !== null || index + 1 >= argv.length) refuse("arguments-invalid");
      explicitRoot = argv[index + 1];
      index += 1;
    } else {
      refuse("arguments-invalid");
    }
  }
  return { mode, explicitRoot };
}

function printDryRun(contracts) {
  process.stdout.write(
    [
      "mode=dry-run writes=0",
      `source files=${contracts.source.files} bytes=${contracts.source.bytes} treeSha256=${contracts.source.treeSha256}`,
      `partition diagnostic files=${contracts.diagnostic.files} bytes=${contracts.diagnostic.bytes} treeSha256=${contracts.diagnostic.treeSha256}`,
      `partition redundant files=${contracts.redundant.files} bytes=${contracts.redundant.bytes} treeSha256=${contracts.redundant.treeSha256}`,
      `partition remainder files=${contracts.remainder.files} bytes=${contracts.remainder.bytes} treeSha256=${contracts.remainder.treeSha256}`,
      `partition quarantine files=${contracts.quarantine.files} bytes=${contracts.quarantine.bytes} treeSha256=${contracts.quarantine.treeSha256}`,
      `privateManifest bytes=${contracts.privateManifestBytes.byteLength} sha256=${sha256(contracts.privateManifestBytes)}`,
      `candidateLedger files=${PINNED.finalLedger.files} bytes=${PINNED.finalLedger.bytes} manifestBytes=${contracts.candidateRead.byteLength} manifestSha256=${contracts.candidateRead.sha256}`,
      `applyProgram bytes=${contracts.programRead.byteLength} sha256=${contracts.programRead.sha256}`,
      `selectorBundle bytes=${contracts.selectorBundleBytes.byteLength} sha256=${sha256(contracts.selectorBundleBytes)}`,
      "preflight=ready targets=absent links=0 special=0 emptyDirectories=0 collisions=0",
    ].join("\n") + "\n",
  );
}

function main() {
  let phase = "arguments";
  try {
    const options = parseArguments(process.argv.slice(2));
    phase = "local-contracts";
    const contracts = loadLocalContracts();
    phase = "share-identity";
    const share = resolveShareRoot(options.explicitRoot);

    if (options.mode === "rollback") {
      phase = "rollback";
      const parents = existingParents(share);
      const lock = bindExistingLock(share);
      rollbackFromDisk(share, parents, contracts, lock.sourceModes, lock);
      process.stdout.write(
        `mode=rollback sourceFiles=${PINNED.source.files} sourceBytes=${PINNED.source.bytes} receipt=absent lock=released\n`,
      );
      return;
    }

    phase = "physical-preflight";
    const initial = prepareInitialShare(share, contracts);
    if (options.mode === "dry-run") {
      printDryRun(contracts);
      return;
    }
    phase = "apply";
    applyMigration(share, contracts, initial);
    process.stdout.write(
      `mode=apply movedFiles=${PINNED.source.files} movedBytes=${PINNED.source.bytes} collectionFiles=${PINNED.diagnostic.files} quarantineFiles=${PINNED.quarantine.files} receipt=published lock=released\n`,
    );
  } catch (error) {
    const code = error instanceof Refusal ? error.code : "unexpected-refusal";
    process.stderr.write(`status=refused phase=${phase} code=${code}\n`);
    process.exitCode = 1;
  }
}

main();
