// Fixture-testable transactional core for forward NAS asset publication and restoration.
//
// This module never detects a mount, edits the tracked catalogue, or deletes a source tree. A
// caller must supply every filesystem root explicitly. The first prune surface is deliberately a
// plan computation only; a later CLI must additionally bind the plan to committed catalogue bytes
// before any destructive executor can exist.

import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readSync,
  realpathSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeSync,
  type Stats,
} from "node:fs";
import { basename, dirname, isAbsolute, parse, relative, resolve, sep } from "node:path";

import {
  assertPortableShareRelativePath,
  inventoryStableTree,
  openContainedRegularFile,
  portableSharePathCollisionKey,
  resolveContainedDirectory,
  type NasAssetCollectionV1,
  type NasTreeFileV1,
  type NasTreeInventoryV1,
} from "./nas-asset-lib.ts";

export const NAS_PUBLICATION_RECEIPT_FORMAT = "snowflake-nas-publication-receipt-v1" as const;
export const NAS_RESTORE_RECEIPT_FORMAT = "snowflake-nas-restore-receipt-v1" as const;
export const NAS_LOCAL_PRUNE_PLAN_FORMAT = "snowflake-nas-local-prune-plan-v1" as const;

const MAX_RECEIPT_BYTES = 1024 * 1024;
const COPY_BUFFER_BYTES = 1024 * 1024;
const SAFE_TRANSACTION_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const SAFE_DIGEST = /^[0-9a-f]{64}$/u;

export type NasAssetTransactionPhase =
  | "publish-lock-acquired"
  | "publish-source-inventoried"
  | "publish-file-copied"
  | "publish-stage-verified"
  | "publish-final-absent"
  | "publish-final-published"
  | "publish-final-verified"
  | "publish-receipt-written"
  | "restore-lock-acquired"
  | "restore-source-inventoried"
  | "restore-file-copied"
  | "restore-stage-verified"
  | "restore-target-absent"
  | "restore-target-published"
  | "restore-target-verified"
  | "restore-receipt-written";

export interface NasAssetTransactionPhaseContext {
  readonly transactionId: string;
  readonly identity: string;
  readonly shareRoot: string;
  readonly sourceRoot?: string;
  readonly stageRoot?: string;
  readonly stagePayloadPath?: string;
  readonly finalEnvelopePath?: string;
  readonly finalPayloadPath?: string;
  readonly destinationPath?: string;
  readonly relativePath?: string;
}

export interface NasAssetTransactionHooks {
  /** Test/fault-injection hook. Production callers leave this unset. */
  readonly afterPhase?: (
    phase: NasAssetTransactionPhase,
    context: NasAssetTransactionPhaseContext,
  ) => void;
}

export interface ForwardPublishIntent {
  readonly identity: string;
  readonly locator: string;
  readonly envelope: string;
  readonly lockName: string;
}

export interface NasTreeSummaryV1 {
  readonly fileCount: number;
  readonly totalBytes: number;
  readonly treeSha256: string;
}

export interface NasPublicationReceiptV1 {
  readonly format: typeof NAS_PUBLICATION_RECEIPT_FORMAT;
  readonly transactionId: string;
  readonly identity: string;
  readonly locator: string;
  readonly source: NasTreeSummaryV1;
  readonly staged: NasTreeSummaryV1;
  readonly final: NasTreeSummaryV1;
  readonly verifiedAt: string;
  readonly limits: readonly string[];
}

export interface NasRestoreReceiptV1 {
  readonly format: typeof NAS_RESTORE_RECEIPT_FORMAT;
  readonly transactionId: string;
  readonly identity: string;
  readonly locator: string;
  readonly publicationTransactionId: string;
  readonly publicationReceiptPath: string;
  readonly publicationReceiptSha256: string;
  readonly restored: NasTreeSummaryV1;
  readonly verifiedAt: string;
  readonly limits: readonly string[];
}

export interface PublishCollectionOptions {
  readonly shareRoot: string;
  readonly sourceRoot: string;
  readonly collection: NasAssetCollectionV1;
  readonly catalogueCollections: readonly NasAssetCollectionV1[];
  readonly transactionId?: string;
  readonly now?: () => Date;
  readonly hooks?: NasAssetTransactionHooks;
}

export interface PublishCollectionResult {
  readonly transactionId: string;
  readonly identity: string;
  readonly locator: string;
  readonly finalEnvelopePath: string;
  readonly finalPayloadPath: string;
  readonly publicationReceiptPath: string;
  readonly publicationReceiptSha256: string;
  readonly receipt: NasPublicationReceiptV1;
}

export interface RestoreCollectionOptions {
  readonly shareRoot: string;
  readonly destinationPath: string;
  readonly collection: NasAssetCollectionV1;
  readonly publicationReceiptPath: string;
  readonly transactionId?: string;
  readonly now?: () => Date;
  readonly hooks?: NasAssetTransactionHooks;
}

export interface RestoreCollectionResult {
  readonly transactionId: string;
  readonly identity: string;
  readonly destinationPath: string;
  readonly restoreReceiptPath: string;
  readonly restoreReceiptSha256: string;
  readonly receipt: NasRestoreReceiptV1;
}

export interface NasLocalPrunePlanV1 {
  readonly format: typeof NAS_LOCAL_PRUNE_PLAN_FORMAT;
  readonly planId: string;
  readonly identity: string;
  readonly locator: string;
  readonly storageClass: NasAssetCollectionV1["storageClass"];
  readonly sourceRoot: string;
  readonly sourceRootIdentity: {
    readonly dev: number;
    readonly ino: number;
  };
  readonly publicationReceiptPath: string;
  readonly publicationReceiptSha256: string;
  readonly restoreReceiptPath: string;
  readonly restoreReceiptSha256: string;
  readonly final: NasTreeSummaryV1;
  readonly files: readonly NasTreeFileV1[];
  readonly computedAt: string;
  readonly executionSupported: false;
  readonly limits: readonly string[];
}

export interface ComputeLocalPrunePlanOptions {
  readonly shareRoot: string;
  readonly sourceRoot: string;
  readonly collection: NasAssetCollectionV1;
  readonly publicationReceiptPath: string;
  readonly restoreReceiptPath: string;
  readonly planId?: string;
  readonly now?: () => Date;
}

export interface WrittenJson {
  readonly byteLength: number;
  readonly sha256: string;
}

interface ReadReceipt<T> {
  readonly value: T;
  readonly byteLength: number;
  readonly sha256: string;
}

interface HeldLock {
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly ownerPath: string;
  readonly directoryDev: number;
  readonly directoryIno: number;
  readonly ownerIdentity: string;
  readonly ownerByteLength: number;
  readonly ownerSha256: string;
}

interface OwnedTreeBinding {
  readonly rootPath: string;
  readonly rootStatus: Stats;
  readonly fileIdentities: ReadonlyMap<string, string>;
  readonly directoryIdentities: ReadonlyMap<string, Stats>;
}

const collectionIdentity = (collection: NasAssetCollectionV1): string =>
  `${collection.assetId}@${collection.version}`;

const forwardLocator = (collection: NasAssetCollectionV1): string =>
  `collections/${collection.assetId}/${collection.version}/payload`;

const forwardEnvelope = (collection: NasAssetCollectionV1): string =>
  `collections/${collection.assetId}/${collection.version}`;

const pathContains = (parent: string, child: string): boolean => {
  const parentKey = portableSharePathCollisionKey(parent);
  const childKey = portableSharePathCollisionKey(child);
  return childKey === parentKey || childKey.startsWith(`${parentKey}/`);
};

const pathsOverlap = (left: string, right: string): boolean =>
  pathContains(left, right) || pathContains(right, left);

const assertTransactionId = (value: string, label: string): void => {
  if (!SAFE_TRANSACTION_ID.test(value)) throw new Error(`${label} is not a portable transaction identity`);
  assertPortableShareRelativePath(`${value}.json`, label);
};

const transactionId = (specified: string | undefined): string => {
  const value = specified ?? randomUUID();
  assertTransactionId(value, "transactionId");
  return value;
};

const statIdentity = (status: Stats): string =>
  [status.dev, status.ino, status.mode, status.nlink, status.size, status.mtimeMs, status.ctimeMs].join(":");

const sameDirectoryObject = (expected: Stats, actual: Stats): boolean =>
  actual.isDirectory() &&
  !actual.isSymbolicLink() &&
  expected.dev === actual.dev &&
  expected.ino === actual.ino &&
  expected.mode === actual.mode;

const rootIsWithin = (root: string, candidate: string): boolean => {
  const relation = relative(root, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
};

const lstatOrNull = (path: string): Stats | null => {
  try {
    return lstatSync(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
};

const assertAbsent = (path: string, label: string): void => {
  if (lstatOrNull(path) !== null) throw new Error(`${label} already exists; refusing to replace it`);
};

const ordinaryDirectoryRoot = (root: string, label: string): string => {
  const lexical = resolve(root);
  const status = lstatSync(lexical);
  if (!status.isDirectory() || status.isSymbolicLink()) {
    throw new Error(`${label} is not an ordinary non-symlink directory`);
  }
  const real = realpathSync.native(lexical);
  const realStatus = lstatSync(real);
  if (!realStatus.isDirectory() || realStatus.isSymbolicLink()) {
    throw new Error(`${label} does not resolve to an ordinary directory`);
  }
  return real;
};

/** Require every existing component, including ancestors, to be a real directory. */
const strictExistingDirectory = (directory: string, label: string): { readonly path: string; readonly status: Stats } => {
  const absolute = resolve(directory);
  const parsed = parse(absolute);
  let current = parsed.root;
  const rest = absolute.slice(parsed.root.length).split(sep).filter((part) => part !== "");
  for (const part of rest) {
    current = resolve(current, part);
    const status = lstatSync(current);
    if (!status.isDirectory() || status.isSymbolicLink()) {
      throw new Error(`${label} contains a symlink or non-directory component: ${current}`);
    }
  }
  const status = lstatSync(absolute);
  return { path: absolute, status };
};

const ensureShareDirectory = (shareRoot: string, relativePath: string): string => {
  assertPortableShareRelativePath(relativePath, "transaction directory");
  const realRoot = ordinaryDirectoryRoot(shareRoot, "share root");
  let current = realRoot;
  for (const part of relativePath.split("/")) {
    current = resolve(current, part);
    if (!rootIsWithin(realRoot, current)) throw new Error("transaction directory escapes the share root");
    const existing = lstatOrNull(current);
    if (existing === null) {
      mkdirSync(current, { mode: 0o700 });
    } else if (!existing.isDirectory() || existing.isSymbolicLink()) {
      throw new Error(`transaction directory component is not an ordinary directory: ${relativePath}`);
    }
    const final = lstatSync(current);
    if (!final.isDirectory() || final.isSymbolicLink() || realpathSync.native(current) !== current) {
      throw new Error(`transaction directory component changed or resolves through a link: ${relativePath}`);
    }
  }
  return current;
};

const ensurePrivateTreeDirectory = (root: string, relativePath: string): string => {
  if (relativePath === "") return ordinaryDirectoryRoot(root, "private staging root");
  assertPortableShareRelativePath(relativePath, "staging directory");
  const realRoot = ordinaryDirectoryRoot(root, "private staging root");
  let current = realRoot;
  for (const part of relativePath.split("/")) {
    current = resolve(current, part);
    if (!rootIsWithin(realRoot, current)) throw new Error("staging directory escapes its root");
    const existing = lstatOrNull(current);
    if (existing === null) mkdirSync(current, { mode: 0o700 });
    else if (!existing.isDirectory() || existing.isSymbolicLink()) {
      throw new Error(`staging directory component is unsafe: ${relativePath}`);
    }
  }
  return current;
};

const fsyncDirectory = (directory: string): void => {
  if (process.platform === "win32") return;
  const fd = openSync(directory, constants.O_RDONLY);
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
};

const assertLosslessJson = (value: unknown, label: string, ancestors = new Set<object>()): void => {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${label} contains a non-finite number`);
    return;
  }
  if (typeof value !== "object") throw new Error(`${label} contains a non-JSON value`);
  if (ancestors.has(value)) throw new Error(`${label} contains a cycle`);
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (!(index in value)) throw new Error(`${label} contains a sparse array`);
        assertLosslessJson(value[index], `${label}[${index}]`, ancestors);
      }
      return;
    }
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
      throw new Error(`${label} is not a plain JSON object`);
    }
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") throw new Error(`${label} contains a symbol key`);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || !descriptor.enumerable || descriptor.get !== undefined || descriptor.set !== undefined) {
        throw new Error(`${label}.${key} is not a plain enumerable data field`);
      }
      assertLosslessJson(descriptor.value, `${label}.${key}`, ancestors);
    }
  } finally {
    ancestors.delete(value);
  }
};

/** Create one JSON file directly with O_EXCL. A partial crash residue is never treated as valid. */
export const writeTransactionJsonNoReplace = (targetPath: string, value: unknown): WrittenJson => {
  assertLosslessJson(value, "transaction JSON");
  const encoded = JSON.stringify(value, null, 2);
  if (encoded === undefined) throw new Error("transaction JSON is not serializable");
  const bytes = Buffer.from(`${encoded}\n`, "utf8");
  const parent = strictExistingDirectory(dirname(targetPath), "transaction JSON parent");
  assertAbsent(targetPath, "transaction JSON target");
  let fd: number | null = null;
  let created = false;
  try {
    fd = openSync(targetPath, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
    created = true;
    let offset = 0;
    while (offset < bytes.byteLength) {
      const count = writeSync(fd, bytes, offset, bytes.byteLength - offset, null);
      if (count <= 0) throw new Error("transaction JSON write made no progress");
      offset += count;
    }
    fsyncSync(fd);
    closeSync(fd);
    fd = null;
    fsyncDirectory(parent.path);
    created = false;
    return {
      byteLength: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  } finally {
    if (fd !== null) closeSync(fd);
    if (created) {
      try {
        unlinkSync(targetPath);
      } catch {
        // Keep the original write error. Any crash residue is invalid because readers parse and
        // bind exact bytes before using a receipt.
      }
    }
  }
};

const summary = (inventory: NasTreeInventoryV1): NasTreeSummaryV1 => ({
  fileCount: inventory.fileCount,
  totalBytes: inventory.totalBytes,
  treeSha256: inventory.treeSha256,
});

const assertSameTree = (
  expected: NasTreeInventoryV1 | NasTreeSummaryV1,
  actual: NasTreeInventoryV1 | NasTreeSummaryV1,
  label: string,
): void => {
  if (
    expected.fileCount !== actual.fileCount ||
    expected.totalBytes !== actual.totalBytes ||
    expected.treeSha256 !== actual.treeSha256
  ) {
    throw new Error(`${label} file set, lengths, or digests do not match`);
  }
};

const phase = (
  hooks: NasAssetTransactionHooks | undefined,
  name: NasAssetTransactionPhase,
  context: NasAssetTransactionPhaseContext,
): void => hooks?.afterPhase?.(name, context);

const acquireLock = (
  shareRoot: string,
  kind: "publish" | "restore",
  identity: string,
  txn: string,
): HeldLock => {
  const lockParentRelative = `_control/locks/${kind}`;
  const parent = ensureShareDirectory(shareRoot, lockParentRelative);
  const lockName = `${identity}.lock`;
  assertPortableShareRelativePath(lockName, "transaction lock name");
  const absolutePath = resolve(parent, lockName);
  try {
    mkdirSync(absolutePath, { mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error(`transaction lock already exists for ${identity}; stale locks are never broken automatically`);
    }
    throw error;
  }
  const ownerPath = resolve(absolutePath, "owner.json");
  const written = writeTransactionJsonNoReplace(ownerPath, {
    format: "snowflake-nas-transaction-lock-v1",
    transactionId: txn,
    identity,
    operation: kind,
  });
  const directory = lstatSync(absolutePath);
  const owner = lstatSync(ownerPath);
  if (!directory.isDirectory() || directory.isSymbolicLink() || !owner.isFile() || owner.isSymbolicLink() || owner.nlink !== 1) {
    throw new Error("transaction lock changed while being acquired");
  }
  fsyncDirectory(parent);
  return {
    relativePath: `${lockParentRelative}/${lockName}`,
    absolutePath,
    ownerPath,
    directoryDev: directory.dev,
    directoryIno: directory.ino,
    ownerIdentity: statIdentity(owner),
    ownerByteLength: written.byteLength,
    ownerSha256: written.sha256,
  };
};

const releaseLock = (lock: HeldLock): void => {
  const directory = lstatSync(lock.absolutePath);
  if (
    !directory.isDirectory() ||
    directory.isSymbolicLink() ||
    directory.dev !== lock.directoryDev ||
    directory.ino !== lock.directoryIno
  ) {
    throw new Error("transaction lock directory changed; refusing to release it");
  }
  const owner = lstatSync(lock.ownerPath);
  if (
    !owner.isFile() ||
    owner.isSymbolicLink() ||
    owner.nlink !== 1 ||
    statIdentity(owner) !== lock.ownerIdentity ||
    owner.size !== lock.ownerByteLength
  ) {
    throw new Error("transaction lock owner changed; refusing to release it");
  }
  const fd = openSync(
    lock.ownerPath,
    constants.O_RDONLY | (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
  );
  try {
    const opened = fstatSync(fd);
    const bytes = Buffer.allocUnsafe(lock.ownerByteLength);
    let total = 0;
    while (total < bytes.byteLength) {
      const count = readSync(fd, bytes, total, bytes.byteLength - total, total);
      if (count === 0) break;
      total += count;
    }
    const after = fstatSync(fd);
    const current = lstatSync(lock.ownerPath);
    if (
      total !== lock.ownerByteLength ||
      statIdentity(opened) !== lock.ownerIdentity ||
      statIdentity(after) !== lock.ownerIdentity ||
      statIdentity(current) !== lock.ownerIdentity ||
      createHash("sha256").update(bytes).digest("hex") !== lock.ownerSha256
    ) {
      throw new Error("transaction lock owner bytes changed; refusing to release it");
    }
  } finally {
    closeSync(fd);
  }
  const directoryBeforeUnlink = lstatSync(lock.absolutePath);
  if (directoryBeforeUnlink.dev !== lock.directoryDev || directoryBeforeUnlink.ino !== lock.directoryIno) {
    throw new Error("transaction lock directory changed before release");
  }
  unlinkSync(lock.ownerPath);
  const directoryBeforeRemove = lstatSync(lock.absolutePath);
  if (directoryBeforeRemove.dev !== lock.directoryDev || directoryBeforeRemove.ino !== lock.directoryIno) {
    throw new Error("transaction lock directory changed during release");
  }
  rmdirSync(lock.absolutePath);
  fsyncDirectory(dirname(lock.absolutePath));
};

const copiedFileSourceStatus = (path: string): Stats => {
  const status = lstatSync(path);
  if (!status.isFile() || status.isSymbolicLink()) throw new Error(`copy source is not an ordinary file: ${path}`);
  if (status.nlink !== 1) throw new Error(`copy source is hard-linked: ${path}`);
  return status;
};

const copyExpectedFile = (
  sourceRoot: string,
  destinationRoot: string,
  expected: NasTreeFileV1,
): Stats => {
  assertPortableShareRelativePath(expected.path, "inventory file path");
  const sourceRealRoot = ordinaryDirectoryRoot(sourceRoot, "copy source root");
  const destinationRealRoot = ordinaryDirectoryRoot(destinationRoot, "copy destination root");
  const sourcePath = resolve(sourceRealRoot, expected.path);
  const destinationPath = resolve(destinationRealRoot, expected.path);
  if (!rootIsWithin(sourceRealRoot, sourcePath) || !rootIsWithin(destinationRealRoot, destinationPath)) {
    throw new Error(`copy path escapes a transaction root: ${expected.path}`);
  }
  const parentRelative = dirname(expected.path).replace(/\\/gu, "/");
  ensurePrivateTreeDirectory(destinationRealRoot, parentRelative === "." ? "" : parentRelative);
  const source = openContainedRegularFile(sourceRealRoot, expected.path);
  if (source.kind !== "ok") throw new Error(`copy source is missing or unsafe: ${expected.path}`);
  const initial = copiedFileSourceStatus(source.path);
  const sourceFd = source.fd;
  let destinationFd: number | null = null;
  try {
    const opened = fstatSync(sourceFd);
    if (!opened.isFile() || opened.nlink !== 1 || statIdentity(initial) !== statIdentity(opened)) {
      throw new Error(`copy source changed before opening: ${expected.path}`);
    }
    destinationFd = openSync(
      destinationPath,
      constants.O_CREAT |
        constants.O_EXCL |
        constants.O_WRONLY |
        (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
      0o600,
    );
    const digest = createHash("sha256");
    const buffer = Buffer.allocUnsafe(COPY_BUFFER_BYTES);
    let total = 0;
    while (total <= expected.byteLength) {
      const remainingWithSentinel = expected.byteLength + 1 - total;
      const requested = Math.min(buffer.byteLength, remainingWithSentinel);
      const count = readSync(sourceFd, buffer, 0, requested, null);
      if (count === 0) break;
      digest.update(buffer.subarray(0, count));
      let offset = 0;
      while (offset < count) {
        const written = writeSync(destinationFd, buffer, offset, count - offset, null);
        if (written <= 0) throw new Error(`staged copy made no progress: ${expected.path}`);
        offset += written;
      }
      total += count;
      if (total > expected.byteLength) {
        throw new Error(`copy source grew beyond its inventoried byte length: ${expected.path}`);
      }
    }
    fsyncSync(destinationFd);
    const after = fstatSync(sourceFd);
    const current = copiedFileSourceStatus(source.path);
    const destinationOpened = fstatSync(destinationFd);
    const destinationCurrent = lstatSync(destinationPath);
    if (
      statIdentity(opened) !== statIdentity(after) ||
      statIdentity(initial) !== statIdentity(current) ||
      after.dev !== current.dev ||
      after.ino !== current.ino ||
      total !== expected.byteLength ||
      digest.digest("hex") !== expected.sha256 ||
      !destinationOpened.isFile() ||
      destinationOpened.nlink !== 1 ||
      statIdentity(destinationOpened) !== statIdentity(destinationCurrent)
    ) {
      throw new Error(`copy source mutated or disagrees with inventory: ${expected.path}`);
    }
    return destinationOpened;
  } finally {
    closeSync(sourceFd);
    if (destinationFd !== null) closeSync(destinationFd);
  }
};

const copyInventory = (
  inventory: NasTreeInventoryV1,
  sourceRoot: string,
  destinationRoot: string,
  hooks: NasAssetTransactionHooks | undefined,
  phaseName: "publish-file-copied" | "restore-file-copied",
  baseContext: NasAssetTransactionPhaseContext,
  expectedDestinationRoot?: Stats,
): OwnedTreeBinding => {
  const destinationRealRoot = ordinaryDirectoryRoot(destinationRoot, "transaction copy destination root");
  const rootStatus = expectedDestinationRoot ?? lstatSync(destinationRealRoot);
  const assertRootOwned = (): void => {
    const current = lstatSync(destinationRealRoot);
    if (!sameDirectoryObject(rootStatus, current) || realpathSync.native(destinationRealRoot) !== destinationRealRoot) {
      throw new Error("transaction copy destination root changed");
    }
  };
  assertRootOwned();
  const fileIdentities = new Map<string, string>();
  for (const file of inventory.files) {
    assertRootOwned();
    const destinationStatus = copyExpectedFile(sourceRoot, destinationRealRoot, file);
    fileIdentities.set(file.path, statIdentity(destinationStatus));
    phase(hooks, phaseName, { ...baseContext, relativePath: file.path });
    assertRootOwned();
    const currentFile = lstatSync(resolve(destinationRealRoot, file.path));
    if (statIdentity(currentFile) !== statIdentity(destinationStatus)) {
      throw new Error(`transaction copied file ownership changed: ${file.path}`);
    }
  }
  const directoryIdentities = new Map<string, Stats>();
  const directories = new Set<string>();
  for (const file of inventory.files) {
    let currentDirectory = dirname(file.path).replace(/\\/gu, "/");
    while (currentDirectory !== "." && currentDirectory !== "") {
      directories.add(currentDirectory);
      const next = dirname(currentDirectory).replace(/\\/gu, "/");
      if (next === currentDirectory) break;
      currentDirectory = next;
    }
  }
  for (const directory of [...directories].sort()) {
    const status = lstatSync(resolve(destinationRealRoot, directory));
    if (!status.isDirectory() || status.isSymbolicLink()) {
      throw new Error(`transaction copied directory ownership changed: ${directory}`);
    }
    directoryIdentities.set(directory, status);
  }
  assertRootOwned();
  return { rootPath: destinationRealRoot, rootStatus, fileIdentities, directoryIdentities };
};

const assertOwnedTreeBinding = (binding: OwnedTreeBinding, expected: NasTreeInventoryV1): void => {
  const currentRoot = lstatSync(binding.rootPath);
  if (!sameDirectoryObject(binding.rootStatus, currentRoot) || realpathSync.native(binding.rootPath) !== binding.rootPath) {
    throw new Error("transaction-owned tree root changed");
  }
  const current = inventoryStableTree(binding.rootPath);
  assertSameTree(expected, current, "transaction staging cleanup tree");
  for (const [path, identity] of binding.fileIdentities) {
    if (statIdentity(lstatSync(resolve(binding.rootPath, path))) !== identity) {
      throw new Error(`transaction-owned file changed: ${path}`);
    }
  }
  for (const [path, identity] of binding.directoryIdentities) {
    if (statIdentity(lstatSync(resolve(binding.rootPath, path))) !== statIdentity(identity)) {
      throw new Error(`transaction-owned directory changed: ${path}`);
    }
  }
};

const removeVerifiedInventory = (binding: OwnedTreeBinding, expected: NasTreeInventoryV1): void => {
  assertOwnedTreeBinding(binding, expected);
  for (const file of expected.files) {
    const target = resolve(binding.rootPath, file.path);
    if (!rootIsWithin(binding.rootPath, target)) throw new Error("transaction staging cleanup path escapes its root");
    const status = lstatSync(target);
    if (
      !status.isFile() ||
      status.isSymbolicLink() ||
      status.nlink !== 1 ||
      status.size !== file.byteLength ||
      statIdentity(status) !== binding.fileIdentities.get(file.path)
    ) {
      throw new Error("transaction staging cleanup file changed");
    }
    unlinkSync(target);
  }
  const directories = new Set<string>();
  for (const file of expected.files) {
    let currentDirectory = dirname(file.path).replace(/\\/gu, "/");
    while (currentDirectory !== "." && currentDirectory !== "") {
      directories.add(currentDirectory);
      const next = dirname(currentDirectory).replace(/\\/gu, "/");
      if (next === currentDirectory) break;
      currentDirectory = next;
    }
  }
  for (const directory of [...directories].sort((left, right) => right.split("/").length - left.split("/").length)) {
    const target = resolve(binding.rootPath, directory);
    const expectedDirectory = binding.directoryIdentities.get(directory);
    if (expectedDirectory === undefined || !sameDirectoryObject(expectedDirectory, lstatSync(target))) {
      throw new Error("transaction staging cleanup directory changed");
    }
    rmdirSync(target);
  }
  const finalRoot = lstatSync(binding.rootPath);
  if (!sameDirectoryObject(binding.rootStatus, finalRoot)) {
    throw new Error("transaction staging cleanup root changed");
  }
  rmdirSync(binding.rootPath);
};

/** Validate the strict, forward-only collection intent used by the transaction core. */
export const validateForwardPublishIntent = (
  collection: NasAssetCollectionV1,
  catalogueCollections: readonly NasAssetCollectionV1[],
): ForwardPublishIntent => {
  const identity = collectionIdentity(collection);
  if (collection.state !== "provisional") throw new Error(`${identity} is not a provisional publish intent`);
  if (collection.storageClass === null || collection.storageClass === "tracked-evidence" || collection.storageClass === "scratch") {
    throw new Error(`${identity} storage class is not publishable by the NAS transaction workflow`);
  }
  if (collection.mutability !== "immutable") throw new Error(`${identity} forward publication must be immutable`);
  if (collection.legacyAliases.length !== 0) throw new Error(`${identity} forward publication cannot declare legacy aliases`);
  if (collection.ownerManifest !== null || collection.aggregate.files !== 0 || collection.aggregate.bytes !== 0) {
    throw new Error(`${identity} publish intent contains already-computed publication fields`);
  }
  if (collection.verification.status !== "unavailable" || collection.verification.receipt !== null) {
    throw new Error(`${identity} publish intent contains pre-attested verification`);
  }
  if (collection.serve.policy !== "deny" || collection.serve.prefixes.length !== 0) {
    throw new Error(`${identity} cannot be served before publication and registration complete`);
  }
  if (
    collection.restore.command === null ||
    collection.restore.verifyCommand === null ||
    collection.restore.status === "pending" ||
    collection.restore.status === "unavailable"
  ) {
    throw new Error(`${identity} requires a documented restore and verifier before publication`);
  }
  if (collection.storageDomains.length === 0) throw new Error(`${identity} must declare its storage domain`);
  if (
    collection.storageClass === "generated-cache" &&
    (collection.reproducibility.kind !== "exact-recipe" || collection.reproducibility.record === null)
  ) {
    throw new Error(`${identity} generated cache requires an exact recipe`);
  }
  if (collection.storageClass === "external-evidence" && collection.externalEvidenceAuthority === null) {
    throw new Error(`${identity} external evidence lacks governing authority`);
  }
  const locator = forwardLocator(collection);
  const envelope = forwardEnvelope(collection);
  assertPortableShareRelativePath(locator, "forward collection locator");
  if (collection.locator !== locator) {
    throw new Error(`${identity} is a grandfathered or non-forward locator; expected ${locator}`);
  }
  const identityKey = portableSharePathCollisionKey(identity);
  for (const candidate of catalogueCollections) {
    if (candidate === collection) continue;
    const candidateIdentity = collectionIdentity(candidate);
    if (portableSharePathCollisionKey(candidateIdentity) === identityKey) {
      throw new Error(`${identity} has a case/Unicode identity collision with ${candidateIdentity}`);
    }
    for (const candidatePath of [candidate.locator, ...candidate.legacyAliases]) {
      if (candidatePath === null) continue;
      assertPortableShareRelativePath(candidatePath, "catalogue collection path");
      if (pathsOverlap(envelope, candidatePath)) {
        throw new Error(`${identity} forward envelope collides with catalogue path ${candidatePath}`);
      }
    }
  }
  return { identity, locator, envelope, lockName: `${identity}.lock` };
};

const validateForwardCollection = (collection: NasAssetCollectionV1): ForwardPublishIntent => {
  const identity = collectionIdentity(collection);
  const locator = forwardLocator(collection);
  const envelope = forwardEnvelope(collection);
  if (collection.locator !== locator) {
    throw new Error(`${identity} is grandfathered and cannot use forward transaction receipts or prune plans`);
  }
  return { identity, locator, envelope, lockName: `${identity}.lock` };
};

const createStageEnvelope = (shareRoot: string, identity: string, txn: string): {
  readonly stageRoot: string;
  readonly stagePayload: string;
  readonly stageRootStatus: Stats;
  readonly stagePayloadStatus: Stats;
} => {
  const parent = ensureShareDirectory(shareRoot, "_control/staging/publish");
  const name = `${identity}.${txn}`;
  assertPortableShareRelativePath(name, "staging transaction name");
  const stageRoot = resolve(parent, name);
  mkdirSync(stageRoot, { mode: 0o700 });
  const stagePayload = resolve(stageRoot, "payload");
  mkdirSync(stagePayload, { mode: 0o700 });
  fsyncDirectory(parent);
  return {
    stageRoot,
    stagePayload,
    stageRootStatus: lstatSync(stageRoot),
    stagePayloadStatus: lstatSync(stagePayload),
  };
};

const receiptTarget = (
  shareRoot: string,
  kind: "publication" | "restore",
  collection: NasAssetCollectionV1,
  txn: string,
): { readonly relativePath: string; readonly absolutePath: string } => {
  const parentRelative = `_control/receipts/${kind}/${collection.assetId}/${collection.version}`;
  const parent = ensureShareDirectory(shareRoot, parentRelative);
  const relativePath = `${parentRelative}/${txn}.json`;
  return { relativePath, absolutePath: resolve(parent, `${txn}.json`) };
};

const canonicalReceiptPath = (
  kind: "publication" | "restore",
  collection: NasAssetCollectionV1,
  txn: string,
): string => `_control/receipts/${kind}/${collection.assetId}/${collection.version}/${txn}.json`;

const assertCanonicalReceiptPath = (
  actual: string,
  kind: "publication" | "restore",
  collection: NasAssetCollectionV1,
  txn: string,
): void => {
  const expected = canonicalReceiptPath(kind, collection, txn);
  if (actual !== expected) throw new Error(`${kind} receipt is not at its canonical transaction path`);
};

/** Copy, independently verify, and publish one immutable forward collection. */
export const publishCollectionFixture = (options: PublishCollectionOptions): PublishCollectionResult => {
  const intent = validateForwardPublishIntent(options.collection, options.catalogueCollections);
  const shareRoot = ordinaryDirectoryRoot(options.shareRoot, "share root");
  const sourceRoot = ordinaryDirectoryRoot(options.sourceRoot, "publication source root");
  if (rootIsWithin(shareRoot, sourceRoot) || rootIsWithin(sourceRoot, shareRoot)) {
    throw new Error("publication source and governed share roots must not overlap");
  }
  const txn = transactionId(options.transactionId);
  const finalEnvelopePath = resolve(shareRoot, intent.envelope);
  const finalPayloadPath = resolve(shareRoot, intent.locator);
  assertAbsent(finalEnvelopePath, "immutable final collection");
  const lock = acquireLock(shareRoot, "publish", intent.identity, txn);
  const baseContext: NasAssetTransactionPhaseContext = {
    transactionId: txn,
    identity: intent.identity,
    shareRoot,
    sourceRoot,
    finalEnvelopePath,
    finalPayloadPath,
  };
  phase(options.hooks, "publish-lock-acquired", baseContext);
  // A pre-existing destination observed after lock acquisition is an ordinary collision, not an
  // interrupted transaction owned by this lock.
  if (lstatOrNull(finalEnvelopePath) !== null) {
    releaseLock(lock);
    throw new Error("immutable final collection appeared before staging; refusing to replace it");
  }
  const finalParentPath = ensureShareDirectory(shareRoot, `collections/${options.collection.assetId}`);
  const finalParentStatus = lstatSync(finalParentPath);
  const { stageRoot, stagePayload, stageRootStatus, stagePayloadStatus } = createStageEnvelope(
    shareRoot,
    intent.identity,
    txn,
  );
  if (lstatSync(stageRoot).dev !== finalParentStatus.dev) {
    throw new Error("publication staging and final collection parent are not on the same filesystem");
  }
  const context = { ...baseContext, stageRoot, stagePayloadPath: stagePayload };
  const sourceInitial = inventoryStableTree(sourceRoot);
  phase(options.hooks, "publish-source-inventoried", context);
  const stagedBinding = copyInventory(
    sourceInitial,
    sourceRoot,
    stagePayload,
    options.hooks,
    "publish-file-copied",
    context,
    stagePayloadStatus,
  );
  const sourceAfterCopy = inventoryStableTree(sourceRoot);
  const staged = inventoryStableTree(stagePayload);
  assertSameTree(sourceInitial, sourceAfterCopy, "source after staged copy");
  assertSameTree(sourceInitial, staged, "staged payload");
  phase(options.hooks, "publish-stage-verified", context);
  const sourceBeforePublish = inventoryStableTree(sourceRoot);
  const stagedBeforePublish = inventoryStableTree(stagePayload);
  assertSameTree(sourceInitial, sourceBeforePublish, "source immediately before publication");
  assertSameTree(sourceInitial, stagedBeforePublish, "stage immediately before publication");

  assertAbsent(finalEnvelopePath, "immutable final collection");
  phase(options.hooks, "publish-final-absent", context);
  assertOwnedTreeBinding(stagedBinding, stagedBeforePublish);
  const finalParentBeforeReservation = lstatSync(finalParentPath);
  if (
    !sameDirectoryObject(finalParentStatus, finalParentBeforeReservation) ||
    realpathSync.native(finalParentPath) !== finalParentPath
  ) {
    throw new Error("immutable final collection parent changed before reservation");
  }
  try {
    // mkdir is the portable atomic no-replace reservation. A check followed by directory rename
    // is unsafe because POSIX rename replaces an existing empty directory.
    mkdirSync(finalEnvelopePath, { mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error("immutable final collection already exists; refusing to replace it");
    }
    throw error;
  }
  fsyncDirectory(dirname(finalEnvelopePath));
  const finalEnvelopeStatus = lstatSync(finalEnvelopePath);
  if (
    !finalEnvelopeStatus.isDirectory() ||
    finalEnvelopeStatus.isSymbolicLink() ||
    realpathSync.native(finalEnvelopePath) !== finalEnvelopePath ||
    !rootIsWithin(shareRoot, finalEnvelopePath)
  ) {
    throw new Error("immutable final collection reservation is outside the governed share");
  }
  assertAbsent(finalPayloadPath, "immutable final payload");
  const finalEnvelopeBeforePlacement = lstatSync(finalEnvelopePath);
  if (!sameDirectoryObject(finalEnvelopeStatus, finalEnvelopeBeforePlacement)) {
    throw new Error("immutable final collection reservation changed before payload placement");
  }
  renameSync(stagePayload, finalPayloadPath);
  const finalPayloadStatus = lstatSync(finalPayloadPath);
  if (!sameDirectoryObject(stagedBinding.rootStatus, finalPayloadStatus)) {
    throw new Error("published payload is not the verified transaction-owned staging tree");
  }
  const emptiedStageRoot = lstatSync(stageRoot);
  if (!sameDirectoryObject(stageRootStatus, emptiedStageRoot)) {
    throw new Error("publication staging envelope changed before cleanup");
  }
  rmdirSync(stageRoot);
  fsyncDirectory(finalEnvelopePath);
  phase(options.hooks, "publish-final-published", context);

  const finalResolution = resolveContainedDirectory(shareRoot, intent.locator);
  if (finalResolution.kind !== "ok") throw new Error("published payload is missing or unsafe after rename");
  const finalInventory = inventoryStableTree(finalResolution.path);
  assertSameTree(sourceInitial, finalInventory, "final published payload");
  phase(options.hooks, "publish-final-verified", context);
  // The callback models the seam between verification and receipt publication. Re-inventory both
  // durable and local sides after it so a late mutation cannot inherit the earlier verdict.
  const sourceAtReceipt = inventoryStableTree(sourceRoot);
  const finalAtReceipt = inventoryStableTree(finalResolution.path);
  assertSameTree(sourceInitial, sourceAtReceipt, "source at publication receipt boundary");
  assertSameTree(sourceInitial, finalAtReceipt, "final payload at publication receipt boundary");

  const receipt: NasPublicationReceiptV1 = {
    format: NAS_PUBLICATION_RECEIPT_FORMAT,
    transactionId: txn,
    identity: intent.identity,
    locator: intent.locator,
    source: summary(sourceInitial),
    staged: summary(stagedBeforePublish),
    final: summary(finalAtReceipt),
    verifiedAt: (options.now ?? (() => new Date()))().toISOString(),
    limits: [
      "This receipt contains aggregate digests only; private filenames and host paths are intentionally omitted.",
      "Tracked catalogue registration and a committed Git binding are outside this fixture transaction core.",
    ],
  };
  const target = receiptTarget(shareRoot, "publication", options.collection, txn);
  const written = writeTransactionJsonNoReplace(target.absolutePath, receipt);
  phase(options.hooks, "publish-receipt-written", context);
  releaseLock(lock);
  return {
    transactionId: txn,
    identity: intent.identity,
    locator: intent.locator,
    finalEnvelopePath,
    finalPayloadPath,
    publicationReceiptPath: target.relativePath,
    publicationReceiptSha256: written.sha256,
    receipt,
  };
};

const readContainedBytes = (shareRoot: string, relativePath: string): { readonly bytes: Buffer; readonly sha256: string } => {
  assertPortableShareRelativePath(relativePath, "receipt path");
  if (!pathContains("_control/receipts", relativePath)) {
    throw new Error("transaction receipt is outside the receipt namespace");
  }
  const opened = openContainedRegularFile(shareRoot, relativePath, "_control/receipts");
  if (opened.kind !== "ok") throw new Error("transaction receipt is missing or unsafe");
  try {
    if (opened.byteLength > MAX_RECEIPT_BYTES) throw new Error("transaction receipt exceeds its bounded read limit");
    const before = fstatSync(opened.fd);
    const bytes = Buffer.allocUnsafe(opened.byteLength);
    let total = 0;
    while (total < bytes.byteLength) {
      const count = readSync(opened.fd, bytes, total, bytes.byteLength - total, total);
      if (count === 0) break;
      total += count;
    }
    const after = fstatSync(opened.fd);
    const current = lstatSync(opened.path);
    if (
      total !== opened.byteLength ||
      !before.isFile() ||
      before.nlink !== 1 ||
      statIdentity(before) !== statIdentity(after) ||
      statIdentity(after) !== statIdentity(current) ||
      current.isSymbolicLink()
    ) {
      throw new Error("transaction receipt changed while reading");
    }
    return { bytes, sha256: createHash("sha256").update(bytes).digest("hex") };
  } finally {
    closeSync(opened.fd);
  }
};

const record = (value: unknown, label: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
};

const exactKeys = (value: Record<string, unknown>, expected: readonly string[], label: string): void => {
  const actual = Object.keys(value).sort();
  const sorted = [...expected].sort();
  if (actual.length !== sorted.length || actual.some((key, index) => key !== sorted[index])) {
    throw new Error(`${label} has unknown or missing fields`);
  }
};

const nonEmptyString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value === "" || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error(`${label} must be a non-empty control-free string`);
  }
  return value;
};

const integer = (value: unknown, label: string): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer`);
  }
  return value;
};

const digest = (value: unknown, label: string): string => {
  if (typeof value !== "string" || !SAFE_DIGEST.test(value)) throw new Error(`${label} is not lowercase SHA-256`);
  return value;
};

const parsedTransactionId = (value: unknown, label: string): string => {
  const parsed = nonEmptyString(value, label);
  assertTransactionId(parsed, label);
  return parsed;
};

const utcTimestamp = (value: unknown, label: string): string => {
  const parsed = nonEmptyString(value, label);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(parsed)) {
    throw new Error(`${label} must be a UTC timestamp`);
  }
  return parsed;
};

const parseSummary = (value: unknown, label: string): NasTreeSummaryV1 => {
  const item = record(value, label);
  exactKeys(item, ["fileCount", "totalBytes", "treeSha256"], label);
  return {
    fileCount: integer(item.fileCount, `${label}.fileCount`),
    totalBytes: integer(item.totalBytes, `${label}.totalBytes`),
    treeSha256: digest(item.treeSha256, `${label}.treeSha256`),
  };
};

const parseLimits = (value: unknown, label: string): readonly string[] => {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value.map((entry, index) => nonEmptyString(entry, `${label}[${index}]`));
};

const parsePublicationReceipt = (value: unknown): NasPublicationReceiptV1 => {
  const item = record(value, "publication receipt");
  exactKeys(item, ["final", "format", "identity", "limits", "locator", "source", "staged", "transactionId", "verifiedAt"], "publication receipt");
  if (item.format !== NAS_PUBLICATION_RECEIPT_FORMAT) throw new Error("publication receipt has the wrong format");
  const locator = nonEmptyString(item.locator, "publication receipt.locator");
  assertPortableShareRelativePath(locator, "publication receipt.locator");
  return {
    format: NAS_PUBLICATION_RECEIPT_FORMAT,
    transactionId: parsedTransactionId(item.transactionId, "publication receipt.transactionId"),
    identity: nonEmptyString(item.identity, "publication receipt.identity"),
    locator,
    source: parseSummary(item.source, "publication receipt.source"),
    staged: parseSummary(item.staged, "publication receipt.staged"),
    final: parseSummary(item.final, "publication receipt.final"),
    verifiedAt: utcTimestamp(item.verifiedAt, "publication receipt.verifiedAt"),
    limits: parseLimits(item.limits, "publication receipt.limits"),
  };
};

const parseRestoreReceipt = (value: unknown): NasRestoreReceiptV1 => {
  const item = record(value, "restore receipt");
  exactKeys(item, [
    "format",
    "identity",
    "limits",
    "locator",
    "publicationReceiptPath",
    "publicationReceiptSha256",
    "publicationTransactionId",
    "restored",
    "transactionId",
    "verifiedAt",
  ], "restore receipt");
  if (item.format !== NAS_RESTORE_RECEIPT_FORMAT) throw new Error("restore receipt has the wrong format");
  const locator = nonEmptyString(item.locator, "restore receipt.locator");
  const publicationReceiptPath = nonEmptyString(item.publicationReceiptPath, "restore receipt.publicationReceiptPath");
  assertPortableShareRelativePath(locator, "restore receipt.locator");
  assertPortableShareRelativePath(publicationReceiptPath, "restore receipt.publicationReceiptPath");
  return {
    format: NAS_RESTORE_RECEIPT_FORMAT,
    transactionId: parsedTransactionId(item.transactionId, "restore receipt.transactionId"),
    identity: nonEmptyString(item.identity, "restore receipt.identity"),
    locator,
    publicationTransactionId: parsedTransactionId(
      item.publicationTransactionId,
      "restore receipt.publicationTransactionId",
    ),
    publicationReceiptPath,
    publicationReceiptSha256: digest(item.publicationReceiptSha256, "restore receipt.publicationReceiptSha256"),
    restored: parseSummary(item.restored, "restore receipt.restored"),
    verifiedAt: utcTimestamp(item.verifiedAt, "restore receipt.verifiedAt"),
    limits: parseLimits(item.limits, "restore receipt.limits"),
  };
};

const readReceipt = <T>(
  shareRoot: string,
  relativePath: string,
  parser: (value: unknown) => T,
): ReadReceipt<T> => {
  const read = readContainedBytes(shareRoot, relativePath);
  let parsed: unknown;
  try {
    parsed = JSON.parse(read.bytes.toString("utf8")) as unknown;
  } catch {
    throw new Error("transaction receipt is malformed JSON");
  }
  return { value: parser(parsed), byteLength: read.bytes.byteLength, sha256: read.sha256 };
};

const assertPublicationMatches = (
  collection: NasAssetCollectionV1,
  receipt: NasPublicationReceiptV1,
): ForwardPublishIntent => {
  const intent = validateForwardCollection(collection);
  if (receipt.identity !== intent.identity || receipt.locator !== intent.locator) {
    throw new Error("publication receipt does not identify the selected collection");
  }
  assertSameTree(receipt.source, receipt.staged, "publication receipt source/stage");
  assertSameTree(receipt.source, receipt.final, "publication receipt source/final");
  return intent;
};

const createRestoreStage = (destinationPath: string, txn: string): {
  readonly destination: string;
  readonly parent: string;
  readonly parentStatus: Stats;
  readonly stage: string;
  readonly stageStatus: Stats;
} => {
  const destination = resolve(destinationPath);
  const parent = strictExistingDirectory(dirname(destination), "restore destination parent");
  assertAbsent(destination, "restore destination");
  const stage = resolve(parent.path, `.${basename(destination)}.restore-${txn}`);
  assertAbsent(stage, "restore staging directory");
  mkdirSync(stage, { mode: 0o700 });
  fsyncDirectory(parent.path);
  // Creating our own sibling staging directory legitimately changes the parent's timestamps and
  // link count. Bind the identity only after that controlled mutation; subsequent copying occurs
  // below the staging directory and must not mutate the parent again.
  return {
    destination,
    parent: parent.path,
    parentStatus: lstatSync(parent.path),
    stage,
    stageStatus: lstatSync(stage),
  };
};

const assertRestoreOutsideShare = (shareRoot: string, destinationPath: string): string => {
  const destination = resolve(destinationPath);
  const parent = strictExistingDirectory(dirname(destination), "restore destination parent");
  // `strictExistingDirectory` rejects symbolic links, but its returned path still preserves the
  // caller's spelling. On a case-insensitive filesystem that spelling can be an alias of the
  // governed share (for example `SHARE` for the physical directory `share`). Canonicalize the
  // existing parent before deriving the absent child so the overlap check and every later
  // lock/stage mutation use the physical namespace rather than a lexical alias.
  const canonicalParent = realpathSync.native(parent.path);
  const normalized = resolve(canonicalParent, basename(destination));
  if (rootIsWithin(shareRoot, normalized) || rootIsWithin(normalized, shareRoot)) {
    throw new Error("restore destination and governed share roots must not overlap");
  }
  return normalized;
};

const lockPath = (shareRoot: string, kind: "publish" | "restore", identity: string): string =>
  resolve(shareRoot, "_control", "locks", kind, `${identity}.lock`);

const assertNoOutstandingLock = (
  shareRoot: string,
  kind: "publish" | "restore",
  identity: string,
): void => {
  if (lstatOrNull(lockPath(shareRoot, kind, identity)) !== null) {
    throw new Error(`outstanding ${kind} transaction lock exists for ${identity}`);
  }
};

/** Restore one forward publication into a newly named target and independently verify it. */
export const restoreCollectionFixture = (options: RestoreCollectionOptions): RestoreCollectionResult => {
  const shareRoot = ordinaryDirectoryRoot(options.shareRoot, "share root");
  const destinationPath = assertRestoreOutsideShare(shareRoot, options.destinationPath);
  const publicationRead = readReceipt(shareRoot, options.publicationReceiptPath, parsePublicationReceipt);
  assertCanonicalReceiptPath(
    options.publicationReceiptPath,
    "publication",
    options.collection,
    publicationRead.value.transactionId,
  );
  const intent = assertPublicationMatches(options.collection, publicationRead.value);
  const txn = transactionId(options.transactionId);
  // Reject ordinary input defects before taking a persistent lock. The same checks repeat while
  // creating the stage after lock acquisition, closing cooperative contention without turning a
  // typo or pre-existing target into an artificial stale lock.
  strictExistingDirectory(dirname(destinationPath), "restore destination parent");
  assertAbsent(destinationPath, "restore destination");
  assertNoOutstandingLock(shareRoot, "publish", intent.identity);
  const finalResolution = resolveContainedDirectory(shareRoot, intent.locator);
  if (finalResolution.kind !== "ok") throw new Error("published payload is missing or unsafe");
  const lock = acquireLock(shareRoot, "restore", intent.identity, txn);
  const restoreTarget = createRestoreStage(destinationPath, txn);
  const context: NasAssetTransactionPhaseContext = {
    transactionId: txn,
    identity: intent.identity,
    shareRoot,
    sourceRoot: finalResolution.path,
    stageRoot: restoreTarget.stage,
    stagePayloadPath: restoreTarget.stage,
    finalEnvelopePath: resolve(shareRoot, intent.envelope),
    finalPayloadPath: finalResolution.path,
    destinationPath: restoreTarget.destination,
  };
  phase(options.hooks, "restore-lock-acquired", context);
  const finalInitial = inventoryStableTree(finalResolution.path);
  assertSameTree(publicationRead.value.final, finalInitial, "published payload before restore");
  phase(options.hooks, "restore-source-inventoried", context);
  const stagedBinding = copyInventory(
    finalInitial,
    finalResolution.path,
    restoreTarget.stage,
    options.hooks,
    "restore-file-copied",
    context,
    restoreTarget.stageStatus,
  );
  const finalAfterCopy = inventoryStableTree(finalResolution.path);
  const staged = inventoryStableTree(restoreTarget.stage);
  assertSameTree(finalInitial, finalAfterCopy, "published payload after restore copy");
  assertSameTree(finalInitial, staged, "restored staging payload");
  phase(options.hooks, "restore-stage-verified", context);
  const finalBeforePlacement = inventoryStableTree(finalResolution.path);
  const stagedBeforePlacement = inventoryStableTree(restoreTarget.stage);
  assertSameTree(finalInitial, finalBeforePlacement, "published payload before restore placement");
  assertSameTree(finalInitial, stagedBeforePlacement, "restore stage before placement");
  const parentCurrent = lstatSync(restoreTarget.parent);
  if (
    !parentCurrent.isDirectory() ||
    parentCurrent.isSymbolicLink() ||
    statIdentity(parentCurrent) !== statIdentity(restoreTarget.parentStatus)
  ) {
    throw new Error("restore destination parent changed during staging");
  }
  assertAbsent(restoreTarget.destination, "restore destination");
  phase(options.hooks, "restore-target-absent", context);
  const parentBeforeReservation = lstatSync(restoreTarget.parent);
  if (
    !sameDirectoryObject(restoreTarget.parentStatus, parentBeforeReservation) ||
    realpathSync.native(restoreTarget.parent) !== restoreTarget.parent
  ) {
    throw new Error("restore destination parent changed before reservation");
  }
  try {
    // Reserve the target name atomically. Directory rename is not no-replace on POSIX: it can
    // silently replace an existing empty directory created after the preceding absence check.
    mkdirSync(restoreTarget.destination, { mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error("restore destination already exists; refusing to replace it");
    }
    throw error;
  }
  const destinationReservation = lstatSync(restoreTarget.destination);
  if (
    !destinationReservation.isDirectory() ||
    destinationReservation.isSymbolicLink() ||
    realpathSync.native(restoreTarget.destination) !== restoreTarget.destination
  ) {
    throw new Error("restore destination reservation is unsafe");
  }
  const destinationBinding = copyInventory(
    stagedBeforePlacement,
    restoreTarget.stage,
    restoreTarget.destination,
    undefined,
    "restore-file-copied",
    context,
    destinationReservation,
  );
  fsyncDirectory(restoreTarget.parent);
  phase(options.hooks, "restore-target-published", context);
  const restored = inventoryStableTree(restoreTarget.destination);
  assertSameTree(finalInitial, restored, "placed restore tree");
  phase(options.hooks, "restore-target-verified", context);
  const finalAtReceipt = inventoryStableTree(finalResolution.path);
  const restoredAtReceipt = inventoryStableTree(restoreTarget.destination);
  assertSameTree(finalInitial, finalAtReceipt, "published payload at restore receipt boundary");
  assertSameTree(finalInitial, restoredAtReceipt, "restored tree at receipt boundary");
  assertOwnedTreeBinding(destinationBinding, restoredAtReceipt);
  const receipt: NasRestoreReceiptV1 = {
    format: NAS_RESTORE_RECEIPT_FORMAT,
    transactionId: txn,
    identity: intent.identity,
    locator: intent.locator,
    publicationTransactionId: publicationRead.value.transactionId,
    publicationReceiptPath: options.publicationReceiptPath,
    publicationReceiptSha256: publicationRead.sha256,
    restored: summary(restoredAtReceipt),
    verifiedAt: (options.now ?? (() => new Date()))().toISOString(),
    limits: [
      "The receipt binds exact restored bytes but omits the host destination and all private filenames.",
      "Claim-specific verifier adapters and tracked catalogue registration are outside this fixture core.",
    ],
  };
  removeVerifiedInventory(stagedBinding, stagedBeforePlacement);
  const target = receiptTarget(shareRoot, "restore", options.collection, txn);
  const written = writeTransactionJsonNoReplace(target.absolutePath, receipt);
  phase(options.hooks, "restore-receipt-written", context);
  releaseLock(lock);
  return {
    transactionId: txn,
    identity: intent.identity,
    destinationPath: restoreTarget.destination,
    restoreReceiptPath: target.relativePath,
    restoreReceiptSha256: written.sha256,
    receipt,
  };
};

const assertPruneClassGate = (collection: NasAssetCollectionV1): void => {
  const identity = collectionIdentity(collection);
  if (collection.state !== "active") throw new Error(`${identity} is not active in the supplied catalogue state`);
  if (collection.storageClass === null || collection.storageClass === "tracked-evidence" || collection.storageClass === "scratch") {
    throw new Error(`${identity} storage class can never receive a local prune plan from this workflow`);
  }
  if (collection.storageClass === "generated-cache") {
    if (collection.reproducibility.kind !== "exact-recipe" || collection.reproducibility.record === null) {
      throw new Error(`${identity} generated cache lacks its exact regeneration recipe`);
    }
    if (collection.backup.status === "required-missing") {
      throw new Error(`${identity} explicitly requires a backup that is still missing`);
    }
    return;
  }
  if (collection.storageClass === "external-evidence") {
    throw new Error(`${identity} external evidence requires a claim-specific restore verifier outside this fixture core`);
  }
  if (
    collection.backup.status !== "verified" ||
    collection.backup.independentDomains.length === 0 ||
    collection.backup.receipts.length === 0
  ) {
    throw new Error(`${identity} requires a verified independent-domain backup before local pruning`);
  }
};

/**
 * Compute an exact local prune plan. This function never removes or renames a source byte, and the
 * returned plan explicitly says execution is unsupported until a future CLI binds committed Git
 * catalogue state and receives separate destructive authorization.
 */
export const computeLocalPrunePlan = (options: ComputeLocalPrunePlanOptions): NasLocalPrunePlanV1 => {
  const intent = validateForwardCollection(options.collection);
  assertPruneClassGate(options.collection);
  const shareRoot = ordinaryDirectoryRoot(options.shareRoot, "share root");
  const publicationRead = readReceipt(shareRoot, options.publicationReceiptPath, parsePublicationReceipt);
  assertCanonicalReceiptPath(
    options.publicationReceiptPath,
    "publication",
    options.collection,
    publicationRead.value.transactionId,
  );
  assertPublicationMatches(options.collection, publicationRead.value);
  const restoreRead = readReceipt(shareRoot, options.restoreReceiptPath, parseRestoreReceipt);
  assertCanonicalReceiptPath(
    options.restoreReceiptPath,
    "restore",
    options.collection,
    restoreRead.value.transactionId,
  );
  if (
    restoreRead.value.identity !== intent.identity ||
    restoreRead.value.locator !== intent.locator ||
    restoreRead.value.publicationTransactionId !== publicationRead.value.transactionId ||
    restoreRead.value.publicationReceiptPath !== options.publicationReceiptPath ||
    restoreRead.value.publicationReceiptSha256 !== publicationRead.sha256
  ) {
    throw new Error("restore receipt is not bound to the selected verified publication receipt");
  }
  assertSameTree(publicationRead.value.final, restoreRead.value.restored, "publication/restore receipts");
  assertNoOutstandingLock(shareRoot, "publish", intent.identity);
  assertNoOutstandingLock(shareRoot, "restore", intent.identity);
  const finalResolution = resolveContainedDirectory(shareRoot, intent.locator);
  if (finalResolution.kind !== "ok") throw new Error("published payload is missing or unsafe during prune planning");
  const finalInventory = inventoryStableTree(finalResolution.path);
  assertSameTree(publicationRead.value.final, finalInventory, "current published payload");
  const sourceRoot = ordinaryDirectoryRoot(options.sourceRoot, "local prune source root");
  const sourceInventory = inventoryStableTree(sourceRoot);
  assertSameTree(publicationRead.value.source, sourceInventory, "current local prune source");
  const sourceStatus = lstatSync(sourceRoot);
  if (!sourceStatus.isDirectory() || sourceStatus.isSymbolicLink()) {
    throw new Error("local prune source root changed after inventory");
  }
  const id = options.planId ?? randomUUID();
  assertTransactionId(id, "planId");
  return {
    format: NAS_LOCAL_PRUNE_PLAN_FORMAT,
    planId: id,
    identity: intent.identity,
    locator: intent.locator,
    storageClass: options.collection.storageClass,
    sourceRoot,
    sourceRootIdentity: { dev: sourceStatus.dev, ino: sourceStatus.ino },
    publicationReceiptPath: options.publicationReceiptPath,
    publicationReceiptSha256: publicationRead.sha256,
    restoreReceiptPath: options.restoreReceiptPath,
    restoreReceiptSha256: restoreRead.sha256,
    final: summary(finalInventory),
    files: sourceInventory.files,
    computedAt: (options.now ?? (() => new Date()))().toISOString(),
    executionSupported: false,
    limits: [
      "This is a computation-only plan. The transaction core exports no delete or rename operation for source bytes.",
      "A future executor must bind exact committed catalogue and receipt bytes from Git HEAD and reverify every prerequisite.",
    ],
  };
};

/** Write a locally chosen prune-plan path once; this still performs no source mutation. */
export const writeLocalPrunePlanNoReplace = (
  targetPath: string,
  plan: NasLocalPrunePlanV1,
): WrittenJson => writeTransactionJsonNoReplace(targetPath, plan);
