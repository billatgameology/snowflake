// Bounded operational execution of the committed efed3cc recovery scope. No NAS writes.
import { createHash } from 'node:crypto';
import { closeSync, constants, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readSync, realpathSync, writeFileSync, writeSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostname } from 'node:os';
import { execFileSync } from 'node:child_process';
import { detectGovernedVccNasMount } from '../../../scripts/nas-root.ts';
import { inventoryStableTree, openContainedRegularFile, parseNasAssetCatalogV1 } from '../../../scripts/nas-asset-lib.ts';
import { loadBoundCollectionSelection } from '../../../scripts/nas-asset-selection-lib.ts';

const script = fileURLToPath(import.meta.url);
const repo = resolve(dirname(script), '../../..');
const output = resolve(repo, 'out/new-host-readiness-2026-10-07');
const receipts = join(output, 'nas');
const comparisonRoot = join(output, 'comparison-inputs');
const backupRoot = 'C:/Users/biao3/snowflake-nas-backup';
const expectedHead = 'efed3cca41e2aa07f37ac440bf5ef737b55b223b';
const recordPin = { bytes: 3002, sha256: '5488f738f3068e74cfdbc38e07c35c1a30e21fe73f891a22ab1e8d50399086f8' };
const custody = '_control/quarantine/unresolved/journey-worktree-closeout-20260912-basic-backup/out/gutcheck-growth-runB';
const videoPath = 'collections/gutcheck-generated-diagnostic-frames/2026-08-15/payload/p7/growth-B-intro.mp4';
const collections = ['windows-phase6-ladder-workspace@2026-08-20', 'windows-out-gate-artifacts@2026-08-20'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw new Error(message); };
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
if (execFileSync('git', ['merge-base', '--is-ancestor', expectedHead, sourceHead], { cwd: repo }).length) fail('unexpected ancestry response');
const mode = process.argv[2];
if (!['copy', 'verify'].includes(mode) || process.argv.length !== 3) fail('usage: node recover-known-nas.mjs copy|verify');
const catalogue = parseNasAssetCatalogV1(readFileSync(join(repo, 'docs/nas-assets.json'), 'utf8'));
const share = detectGovernedVccNasMount();
if (share === null) fail('marked NAS unavailable');
const selections = collections.map(collection => loadBoundCollectionSelection({ catalogue, collection, repoRoot: repo, shareRoot: share }));
const command = `node out/new-host-readiness-2026-10-07/nas/recover-known-nas.mjs ${mode}`;
const base = { recordedAt: new Date().toISOString(), hostname: hostname(), sourceHead, scopeCommit: expectedHead, node: process.version, command, helperSha256: sha(readFileSync(script)), nasMutation: false, sourcePruneAuthority: false };

function absent(path) {
  try { lstatSync(path); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  fail(`destination already exists: ${path}`);
}
function safeParents(path) {
  const absolute = resolve(path);
  const parent = dirname(absolute);
  if (parent !== absolute) safeParents(parent);
  try {
    const item = lstatSync(absolute);
    if (!item.isDirectory() || item.isSymbolicLink()) fail(`unsafe directory: ${absolute}`);
    if (realpathSync.native(absolute).toLowerCase() !== absolute.toLowerCase()) fail(`aliased directory: ${absolute}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    mkdirSync(absolute);
  }
}
function freshDirectory(path, allowedRoot) {
  const suffix = relative(resolve(allowedRoot), resolve(path));
  if (!suffix || suffix === '..' || suffix.startsWith(`..${sep}`) || resolve(path)[1] !== ':') fail('destination outside reviewed root');
  absent(path);
  safeParents(dirname(path));
  mkdirSync(path);
}
function readExpected(root, path, prefix, expected) {
  const opened = openContainedRegularFile(root, path, prefix);
  if (opened.kind !== 'ok') fail(`cannot read exact regular input: ${path}`);
  try {
    if (opened.byteLength !== expected.bytes) fail(`source length mismatch: ${path}`);
    const bytes = Buffer.alloc(expected.bytes);
    let offset = 0;
    while (offset < bytes.length) {
      const got = readSync(opened.fd, bytes, offset, Math.min(1048576, bytes.length - offset), offset);
      if (!got) fail(`source truncated: ${path}`);
      offset += got;
    }
    if (sha(bytes) !== expected.sha256) fail(`source digest mismatch: ${path}`);
    return bytes;
  } finally { closeSync(opened.fd); }
}
function copyExpected(root, path, prefix, destination, expected) {
  const opened = openContainedRegularFile(root, path, prefix);
  if (opened.kind !== 'ok') fail(`cannot copy exact regular input: ${path}`);
  let target;
  try {
    if (opened.byteLength !== expected.bytes) fail(`source length mismatch: ${path}`);
    absent(destination);
    safeParents(dirname(destination));
    target = openSync(destination, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
    const initial = fstatSync(opened.fd);
    const buffer = Buffer.allocUnsafe(1048576);
    const digest = createHash('sha256');
    let offset = 0;
    while (offset < expected.bytes) {
      const count = readSync(opened.fd, buffer, 0, Math.min(buffer.length, expected.bytes - offset), offset);
      if (!count) fail(`source truncated: ${path}`);
      digest.update(buffer.subarray(0, count));
      let written = 0;
      while (written < count) written += writeSync(target, buffer, written, count - written);
      offset += count;
    }
    if (digest.digest('hex') !== expected.sha256) fail(`source digest mismatch: ${path}`);
    // Windows SMB can preserve stat metadata after a same-length rewrite: reread same descriptor.
    const reread = createHash('sha256');
    for (let position = 0; position < expected.bytes;) {
      const count = readSync(opened.fd, buffer, 0, Math.min(buffer.length, expected.bytes - position), position);
      if (!count) fail(`source disappeared: ${path}`);
      reread.update(buffer.subarray(0, count)); position += count;
    }
    if (reread.digest('hex') !== expected.sha256) fail(`source changed while copying: ${path}`);
    const final = fstatSync(opened.fd);
    if (initial.dev !== final.dev || initial.ino !== final.ino || final.size !== expected.bytes || final.nlink !== 1) fail('source descriptor changed');
    const reopened = openContainedRegularFile(root, path, prefix);
    if (reopened.kind !== 'ok') fail('source path no longer bound');
    closeSync(reopened.fd);
    if (reopened.dev !== opened.dev || reopened.ino !== opened.ino) fail('source path replaced');
    fsyncSync(target);
  } finally { if (target !== undefined) closeSync(target); closeSync(opened.fd); }
}
function exactInventory(root, rows) {
  const inventory = inventoryStableTree(root);
  const expected = [...rows].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  if (inventory.files.length !== expected.length || inventory.files.some((file, index) => file.path !== expected[index].path || file.byteLength !== expected[index].bytes || file.sha256 !== expected[index].sha256)) fail(`tree differs from registered set: ${root}`);
  return inventory;
}
function receipt(name, value) { writeFileSync(join(receipts, name), `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' }); }
function selectionRows(selection) { return selection.files.map(row => ({ path: row.relativePath, bytes: row.bytes, sha256: row.sha256 })); }
function collectionBackupPath(selection) { const [id, version] = selection.identity.split('@'); return resolve(backupRoot, 'collections', id, version, 'payload'); }

if (mode === 'copy') {
  absent(comparisonRoot);
  for (const selection of selections) absent(collectionBackupPath(selection));
  const recordBytes = readExpected(share, `${custody}/comparison-record-v2.json`, custody, recordPin);
  const record = JSON.parse(recordBytes.toString('utf8'));
  const comparisonRows = [
    { path: 'comparison-record-v2.json', sourcePath: `${custody}/comparison-record-v2.json`, ...recordPin },
    { path: 'gutcheck-growth-v1.bin', sourcePath: `${custody}/gutcheck-growth-v1.bin`, bytes: record.compact.asset.bytes, sha256: record.compact.asset.sha256 },
    { path: 'growth-B-intro.mp4', sourcePath: videoPath, bytes: record.legacy.lightweightMedia.derivedVideo.bytes, sha256: record.legacy.lightweightMedia.derivedVideo.sha256 },
    ...record.legacy.lightweightMedia.posters.map(poster => ({ path: poster.url.split('/').at(-1), sourcePath: `${custody}/comparison-inputs/${poster.url.split('/').at(-1)}`, bytes: poster.bytes, sha256: poster.sha256 })),
  ];
  const videoOwner = loadBoundCollectionSelection({ catalogue, collection: 'gutcheck-generated-diagnostic-frames@2026-08-15', repoRoot: repo, shareRoot: share });
  const boundVideo = videoOwner.files.find(row => row.sharePath === videoPath);
  if (!boundVideo || boundVideo.bytes !== comparisonRows[2].bytes || boundVideo.sha256 !== comparisonRows[2].sha256) fail('MP4 does not match existing collection owner');
  freshDirectory(comparisonRoot, output);
  for (const row of comparisonRows) copyExpected(share, row.sourcePath, row.sourcePath.startsWith(custody) ? custody : videoOwner.locator, join(comparisonRoot, row.path), row);
  const comparisonInventory = exactInventory(comparisonRoot, comparisonRows);
  receipt('comparison-recovery.json', { ...base, format: 'bounded-comparison-recovery-v1', destination: comparisonRoot, sourceRecord: recordPin, videoCollection: videoOwner.identity, files: comparisonRows, inventory: comparisonInventory, limits: ['Known quarantine is restore-only custody, not new durable publication.', 'No historical capture is changed or replaced.'] });
  const completed = [];
  for (const selection of selections) {
    const destination = collectionBackupPath(selection);
    freshDirectory(destination, backupRoot);
    for (const row of selection.files) copyExpected(share, row.sharePath, selection.locator, join(destination, row.relativePath), row);
    const inventory = exactInventory(destination, selectionRows(selection));
    completed.push({ collection: selection.identity, destination, ownerManifestSha256: selection.ownerManifestSha256, expectedTreeSha256: selection.treeSha256, files: selection.files, inventory });
  }
  receipt('independent-backup-copy.json', { ...base, format: 'bounded-independent-backup-copy-v1', backupRoot, storageDomain: { drive: 'C:', physicalDisk: 1, busType: 'NVMe', localFixedNTFS: true, observationCommand: 'Get-Partition -DriveLetter C; Get-Disk -Number 1; Get-CimInstance Win32_LogicalDisk -Filter DeviceID=C:' }, collections: completed, totalFiles: completed.reduce((n, c) => n + c.inventory.fileCount, 0), totalBytes: completed.reduce((n, c) => n + c.inventory.totalBytes, 0), nextCommand: 'node out/new-host-readiness-2026-10-07/nas/recover-known-nas.mjs verify', limits: ['NAS and original source copies retained.', 'Fresh-process recovery remains required.', 'No off-site protection or source-prune authorization is claimed.'] });
  console.log(JSON.stringify({ ok: true, comparison: { files: comparisonInventory.fileCount, bytes: comparisonInventory.totalBytes }, backup: { files: completed.reduce((n,c) => n+c.inventory.fileCount,0), bytes: completed.reduce((n,c) => n+c.inventory.totalBytes,0) } }));
} else {
  const recovery = JSON.parse(readFileSync(join(receipts, 'comparison-recovery.json'), 'utf8'));
  const comparisonInventory = exactInventory(comparisonRoot, recovery.files);
  const verified = [];
  for (const selection of selections) {
    const source = collectionBackupPath(selection);
    const backupInventory = exactInventory(source, selectionRows(selection));
    const destination = join(repo, 'out/restores/new-host-independent-backup-2026-10-07', selection.identity.replace('@', '-'));
    freshDirectory(destination, join(repo, 'out/restores'));
    for (const row of selection.files) copyExpected(source, row.relativePath, row.relativePath, join(destination, row.relativePath), row);
    const inventory = exactInventory(destination, selectionRows(selection));
    verified.push({ collection: selection.identity, backupSource: source, restoredDestination: destination, ownerManifestSha256: selection.ownerManifestSha256, expectedTreeSha256: selection.treeSha256, backupInventory, restoredInventory: inventory, files: selection.files });
  }
  receipt('independent-backup-recovery.json', { ...base, format: 'bounded-independent-backup-recovery-v1', comparisonInventory, collections: verified, totalFiles: verified.reduce((n,c) => n+c.restoredInventory.fileCount,0), totalBytes: verified.reduce((n,c) => n+c.restoredInventory.totalBytes,0), scientificState: 'historical bytes unchanged; operational recovery only', limits: ['Recovery source is the current independent C backup, not NAS.', 'Other required-missing backups and unresolved custody are outside this bounded scope.', 'NAS and all original source custody retained; no prune authorization.'] });
  console.log(JSON.stringify({ ok: true, freshProcess: true, comparisonFiles: comparisonInventory.fileCount, backupRecoveredFiles: verified.reduce((n,c) => n+c.restoredInventory.fileCount,0), backupRecoveredBytes: verified.reduce((n,c) => n+c.restoredInventory.totalBytes,0) }));
}
