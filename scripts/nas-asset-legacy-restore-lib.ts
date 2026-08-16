// Exact, no-clobber restore of grandfathered NAS collections into disposable local staging.
//
// This module deliberately writes no receipt and grants no prune authority. A failed restore
// leaves its newly reserved destination in place so an interrupted or partial copy is visible and
// can never be mistaken for a successful fresh-stage restore.

import { createHash } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readSync,
  realpathSync,
  writeSync,
  type Stats,
} from "node:fs";
import {
  dirname,
  isAbsolute,
  parse,
  relative,
  resolve,
  sep,
} from "node:path";

import {
  assertPortableShareRelativePath,
  inventoryStableTree,
  openContainedRegularFile,
  portableSharePathCollisionKey,
  type NasAssetCatalogV1,
} from "./nas-asset-lib.ts";
import {
  loadBoundCollectionSelection,
  type BoundCollectionFileV1,
  type BoundCollectionSelectionV1,
} from "./nas-asset-selection-lib.ts";
import { detectNasMount } from "./nas-root.ts";

export const NAS_LEGACY_RESTORE_REPORT_FORMAT = "snowflake-nas-legacy-restore-report-v1" as const;

const COPY_BUFFER_BYTES = 1024 * 1024;

export type NasLegacyRestoreErrorCode =
  | "catalogue-selection-invalid"
  | "collection-not-active"
  | "collection-locator-invalid"
  | "destination-invalid"
  | "destination-collision"
  | "destination-unsafe"
  | "share-invalid"
  | "share-overlap"
  | "source-missing-or-unsafe"
  | "source-byte-mismatch"
  | "destination-byte-mismatch";

export class NasLegacyRestoreError extends Error {
  override readonly name = "NasLegacyRestoreError";
  readonly code: NasLegacyRestoreErrorCode;
  readonly destinationReserved: boolean;

  constructor(
    code: NasLegacyRestoreErrorCode,
    message: string,
    destinationReserved = false,
  ) {
    super(message);
    this.code = code;
    this.destinationReserved = destinationReserved;
  }
}

export interface NasLegacyRestoreHooks {
  /** Test/fault hook. Production callers leave this unset. */
  readonly beforeDestinationReservation?: () => void;
  /** Test/fault hook. Production callers leave this unset. */
  readonly afterDestinationReservation?: (destinationPath: string) => void;
  /** Test/fault hook. Production callers leave this unset. */
  readonly afterSourceChunk?: (context: {
    readonly relativePath: string;
    readonly fileIndex: number;
    readonly bytesRead: number;
  }) => void;
  /** Test/fault hook. Production callers leave this unset. */
  readonly afterFileCopied?: (context: {
    readonly destinationPath: string;
    readonly relativePath: string;
    readonly fileIndex: number;
  }) => void;
  /** Test/fault hook. Production callers leave this unset. */
  readonly beforeDestinationVerification?: (destinationPath: string) => void;
}

export interface NasLegacyRestoreOptions {
  readonly catalogue: NasAssetCatalogV1;
  /** Exact `assetId@version`. */
  readonly collection: string;
  readonly repoRoot: string;
  /** Explicit or auto-detected root already chosen by the CLI; marker validation repeats here. */
  readonly shareRoot: string;
  readonly destinationPath: string;
  readonly hooks?: NasLegacyRestoreHooks;
}

export interface NasLegacyVerifyOptions {
  readonly catalogue: NasAssetCatalogV1;
  /** Exact `assetId@version`. */
  readonly collection: string;
  readonly repoRoot: string;
  readonly shareRoot: string;
  readonly destinationPath: string;
  readonly hooks?: Pick<NasLegacyRestoreHooks, "beforeDestinationVerification">;
}

export interface NasLegacyRestoreSuccessReport {
  readonly format: typeof NAS_LEGACY_RESTORE_REPORT_FORMAT;
  readonly command: "restore" | "verify";
  readonly ok: true;
  readonly collection: string;
  /** Deliberately path-free: the policy fixes the destination namespace. */
  readonly destinationScope: "repo-out-restores";
  readonly fileCount: number;
  readonly totalBytes: number;
  readonly treeSha256: string;
  readonly durableReceiptWritten: false;
  readonly pruneAuthorized: false;
  readonly limits: readonly string[];
}

interface DirectoryBinding {
  readonly path: string;
  readonly dev: number;
  readonly ino: number;
  readonly mode: number;
}

interface RestoreContext {
  readonly repo: DirectoryBinding;
  readonly share: DirectoryBinding;
  readonly selection: BoundCollectionSelectionV1;
  readonly destination: string;
  readonly destinationRelative: string;
}

const fail = (
  code: NasLegacyRestoreErrorCode,
  message: string,
  destinationReserved = false,
): never => {
  throw new NasLegacyRestoreError(code, message, destinationReserved);
};

const statObjectIdentity = (status: Stats): string =>
  [
    status.dev,
    status.ino,
    status.mode,
    status.nlink,
    status.size,
    status.mtimeMs,
    status.ctimeMs,
  ].join(":");

const pathIsWithin = (root: string, candidate: string): boolean => {
  const relation = relative(root, candidate);
  return relation === "" ||
    (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
};

const pathsOverlap = (left: string, right: string): boolean =>
  pathIsWithin(left, right) || pathIsWithin(right, left);

const lstatOrNull = (path: string): Stats | null => {
  try {
    return lstatSync(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
};

/** Reject symlinks/junctions in every existing component of an absolute directory path. */
const bindStrictDirectory = (
  directory: string,
  code: NasLegacyRestoreErrorCode,
  label: string,
): DirectoryBinding => {
  const absolute = resolve(directory);
  const parsed = parse(absolute);
  let current = parsed.root;
  for (const part of absolute.slice(parsed.root.length).split(sep).filter((entry) => entry !== "")) {
    current = resolve(current, part);
    let status: Stats;
    try {
      status = lstatSync(current);
    } catch {
      return fail(code, `${label} does not exist`);
    }
    if (!status.isDirectory() || status.isSymbolicLink()) {
      return fail(code, `${label} contains a link or non-directory component`);
    }
  }
  const status = lstatSync(absolute);
  return { path: absolute, dev: status.dev, ino: status.ino, mode: status.mode };
};

const assertDirectoryBinding = (
  binding: DirectoryBinding,
  code: NasLegacyRestoreErrorCode,
  label: string,
  destinationReserved = false,
): void => {
  let status: Stats;
  try {
    status = lstatSync(binding.path);
  } catch {
    return fail(code, `${label} disappeared`, destinationReserved);
  }
  if (
    !status.isDirectory() ||
    status.isSymbolicLink() ||
    status.dev !== binding.dev ||
    status.ino !== binding.ino ||
    status.mode !== binding.mode
  ) {
    return fail(code, `${label} changed identity`, destinationReserved);
  }
};

const exactSiblingState = (
  parent: string,
  name: string,
  code: NasLegacyRestoreErrorCode,
  destinationReserved = false,
): "absent" | "exact" => {
  const key = portableSharePathCollisionKey(name);
  let matches: string[];
  try {
    matches = readdirSync(parent).filter((entry) => portableSharePathCollisionKey(entry) === key);
  } catch {
    return fail(code, "directory contents cannot be read safely", destinationReserved);
  }
  if (matches.length === 0) return "absent";
  if (matches.length !== 1 || matches[0] !== name) {
    return fail(code, "a case or Unicode path alias exists", destinationReserved);
  }
  return "exact";
};

const destinationRelativePath = (repoRoot: string, destinationPath: string): string => {
  const absolute = resolve(destinationPath);
  const nativeRelative = relative(repoRoot, absolute);
  if (
    nativeRelative === "" ||
    nativeRelative === ".." ||
    nativeRelative.startsWith(`..${sep}`) ||
    isAbsolute(nativeRelative)
  ) {
    return fail("destination-invalid", "destination must be inside the repository");
  }
  const portable = nativeRelative.split(sep).join("/");
  try {
    assertPortableShareRelativePath(portable, "restore destination");
  } catch {
    return fail("destination-invalid", "destination is not a portable repository-relative path");
  }
  if (!portable.startsWith("out/restores/") || portable === "out/restores/") {
    return fail("destination-invalid", "destination must be a child of repo out/restores");
  }
  return portable;
};

const createOrValidateParent = (
  repo: DirectoryBinding,
  destinationRelative: string,
): DirectoryBinding => {
  const parts = destinationRelative.split("/");
  let current = repo.path;
  for (const part of parts.slice(0, -1)) {
    assertDirectoryBinding(repo, "destination-unsafe", "repository root");
    const state = exactSiblingState(current, part, "destination-unsafe");
    const child = resolve(current, part);
    if (state === "absent") {
      try {
        mkdirSync(child, { mode: 0o700 });
      } catch {
        return fail("destination-unsafe", "restore destination parent could not be created safely");
      }
    }
    const status = lstatSync(child);
    if (!status.isDirectory() || status.isSymbolicLink()) {
      return fail("destination-unsafe", "restore destination has a linked or non-directory ancestor");
    }
    const real = realpathSync.native(child);
    if (!pathIsWithin(repo.path, real) || real !== child) {
      return fail("destination-unsafe", "restore destination ancestor resolves through an alias");
    }
    current = child;
  }
  const status = lstatSync(current);
  return { path: current, dev: status.dev, ino: status.ino, mode: status.mode };
};

const assertExactExistingRelativeDirectory = (
  root: DirectoryBinding,
  relativePath: string,
  code: NasLegacyRestoreErrorCode,
  destinationReserved = false,
): DirectoryBinding => {
  let current = root.path;
  for (const part of relativePath.split("/").filter((entry) => entry !== "")) {
    assertDirectoryBinding(root, code, "bound root", destinationReserved);
    if (exactSiblingState(current, part, code, destinationReserved) !== "exact") {
      return fail(code, "required directory is absent", destinationReserved);
    }
    current = resolve(current, part);
    const status = lstatSync(current);
    if (!status.isDirectory() || status.isSymbolicLink()) {
      return fail(code, "required directory is unsafe", destinationReserved);
    }
    const real = realpathSync.native(current);
    if (!pathIsWithin(root.path, real) || real !== current) {
      return fail(code, "required directory resolves through an alias", destinationReserved);
    }
  }
  const status = lstatSync(current);
  return { path: current, dev: status.dev, ino: status.ino, mode: status.mode };
};

const reserveDestination = (
  repo: DirectoryBinding,
  destination: string,
  destinationRelative: string,
  hooks: NasLegacyRestoreHooks | undefined,
): DirectoryBinding => {
  const parent = createOrValidateParent(repo, destinationRelative);
  const name = destinationRelative.split("/").at(-1) as string;
  if (exactSiblingState(parent.path, name, "destination-collision") !== "absent") {
    return fail("destination-collision", "restore destination already exists");
  }
  hooks?.beforeDestinationReservation?.();
  assertDirectoryBinding(repo, "destination-unsafe", "repository root");
  const parentRelative = dirname(destinationRelative).split(sep).join("/");
  const reboundParent = assertExactExistingRelativeDirectory(
    repo,
    parentRelative === "." ? "" : parentRelative,
    "destination-unsafe",
  );
  if (
    reboundParent.dev !== parent.dev ||
    reboundParent.ino !== parent.ino ||
    reboundParent.mode !== parent.mode
  ) {
    return fail("destination-unsafe", "restore destination parent changed before reservation");
  }
  if (exactSiblingState(parent.path, name, "destination-collision") !== "absent") {
    return fail("destination-collision", "restore destination appeared before reservation");
  }
  try {
    mkdirSync(destination, { mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      return fail("destination-collision", "restore destination already exists");
    }
    return fail("destination-unsafe", "restore destination could not be reserved");
  }
  const status = lstatSync(destination);
  if (!status.isDirectory() || status.isSymbolicLink() || realpathSync.native(destination) !== destination) {
    return fail("destination-unsafe", "reserved restore destination is unsafe", true);
  }
  hooks?.afterDestinationReservation?.(destination);
  return { path: destination, dev: status.dev, ino: status.ino, mode: status.mode };
};

const markedShare = (shareRoot: string): DirectoryBinding => {
  let detected: string | null;
  try {
    detected = detectNasMount({ VCC_NAS_ROOT: shareRoot }, []);
  } catch {
    return fail("share-invalid", "configured NAS root is not the marked project share");
  }
  if (detected === null) return fail("share-invalid", "marked project share is detached");
  return bindStrictDirectory(detected, "share-invalid", "marked project share");
};

const revalidateMarkedShare = (share: DirectoryBinding): void => {
  const rebound = markedShare(share.path);
  if (rebound.dev !== share.dev || rebound.ino !== share.ino || rebound.mode !== share.mode) {
    return fail("share-invalid", "marked project share changed identity");
  }
};

const loadActiveSelection = (
  options: Pick<NasLegacyRestoreOptions, "catalogue" | "collection">,
  repo: DirectoryBinding,
  share: DirectoryBinding,
): BoundCollectionSelectionV1 => {
  let selection: BoundCollectionSelectionV1;
  try {
    selection = loadBoundCollectionSelection({
      catalogue: options.catalogue,
      collection: options.collection,
      repoRoot: repo.path,
      shareRoot: share.path,
    });
  } catch {
    return fail("catalogue-selection-invalid", "collection selection is not exactly bound");
  }
  if (selection.state !== "active") {
    return fail("collection-not-active", "only active collections may be restored");
  }
  if (selection.locator === null || selection.files.some((file) => file.relativePath === "")) {
    return fail("collection-locator-invalid", "active collection does not have a restorable directory locator");
  }
  return selection;
};

const prepareContext = (
  options: Pick<
    NasLegacyRestoreOptions,
    "catalogue" | "collection" | "repoRoot" | "shareRoot" | "destinationPath"
  >,
): RestoreContext => {
  const repo = bindStrictDirectory(options.repoRoot, "destination-invalid", "repository root");
  const share = markedShare(options.shareRoot);
  if (pathsOverlap(repo.path, share.path)) {
    return fail("share-overlap", "repository and governed share roots must not overlap");
  }
  const destination = resolve(options.destinationPath);
  const destinationRelative = destinationRelativePath(repo.path, destination);
  if (pathsOverlap(destination, share.path)) {
    return fail("share-overlap", "restore destination and governed share roots must not overlap");
  }
  const selection = loadActiveSelection(options, repo, share);
  return { repo, share, selection, destination, destinationRelative };
};

const assertExactSourcePath = (
  share: DirectoryBinding,
  sharePath: string,
): void => {
  let current = share.path;
  const parts = sharePath.split("/");
  for (let index = 0; index < parts.length; index += 1) {
    assertDirectoryBinding(share, "share-invalid", "marked project share", true);
    const part = parts[index] as string;
    if (exactSiblingState(current, part, "source-missing-or-unsafe", true) !== "exact") {
      return fail("source-missing-or-unsafe", "selected source path is absent", true);
    }
    current = resolve(current, part);
    const status = lstatSync(current);
    if (status.isSymbolicLink()) {
      return fail("source-missing-or-unsafe", "selected source path contains a symbolic link", true);
    }
    if (index < parts.length - 1 && !status.isDirectory()) {
      return fail("source-missing-or-unsafe", "selected source ancestor is not a directory", true);
    }
    if (index === parts.length - 1 && (!status.isFile() || status.nlink !== 1)) {
      return fail("source-missing-or-unsafe", "selected source is not one ordinary unlinked file", true);
    }
  }
};

const ensureOwnedDestinationParent = (
  destinationRoot: DirectoryBinding,
  relativePath: string,
): string => {
  const parentPortable = dirname(relativePath).split(sep).join("/");
  if (parentPortable === ".") return destinationRoot.path;
  let current = destinationRoot.path;
  for (const part of parentPortable.split("/")) {
    assertDirectoryBinding(destinationRoot, "destination-unsafe", "reserved destination", true);
    const state = exactSiblingState(current, part, "destination-unsafe", true);
    const child = resolve(current, part);
    if (state === "absent") {
      try {
        mkdirSync(child, { mode: 0o700 });
      } catch {
        return fail("destination-unsafe", "destination subdirectory could not be created", true);
      }
    }
    const status = lstatSync(child);
    if (!status.isDirectory() || status.isSymbolicLink() || realpathSync.native(child) !== child) {
      return fail("destination-unsafe", "destination subdirectory is unsafe", true);
    }
    current = child;
  }
  return current;
};

const copyExpectedFile = (
  share: DirectoryBinding,
  destination: DirectoryBinding,
  locator: string,
  expected: BoundCollectionFileV1,
  fileIndex: number,
  hooks: NasLegacyRestoreHooks | undefined,
): void => {
  assertExactSourcePath(share, expected.sharePath);
  const opened = openContainedRegularFile(share.path, expected.sharePath, locator);
  if (opened.kind !== "ok") {
    return fail("source-missing-or-unsafe", "selected source cannot be opened safely", true);
  }
  const sourceFd = opened.fd;
  let destinationFd: number | null = null;
  try {
    const before = fstatSync(sourceFd);
    if (
      !before.isFile() ||
      before.nlink !== 1 ||
      before.dev !== opened.dev ||
      before.ino !== opened.ino ||
      before.size !== opened.byteLength ||
      before.size !== expected.bytes
    ) {
      return fail("source-byte-mismatch", "selected source disagrees with its owner row", true);
    }
    const parent = ensureOwnedDestinationParent(destination, expected.relativePath);
    const name = expected.relativePath.split("/").at(-1) as string;
    if (exactSiblingState(parent, name, "destination-collision", true) !== "absent") {
      return fail("destination-collision", "destination file already exists", true);
    }
    const target = resolve(destination.path, ...expected.relativePath.split("/"));
    if (!pathIsWithin(destination.path, target)) {
      return fail("destination-unsafe", "destination file escapes the reserved root", true);
    }
    try {
      destinationFd = openSync(
        target,
        constants.O_CREAT |
          constants.O_EXCL |
          constants.O_WRONLY |
          (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
        0o600,
      );
    } catch {
      return fail("destination-collision", "destination file could not be created without replacement", true);
    }
    const digest = createHash("sha256");
    const buffer = Buffer.allocUnsafe(COPY_BUFFER_BYTES);
    let total = 0;
    while (total <= expected.bytes) {
      const requested = Math.min(buffer.byteLength, expected.bytes + 1 - total);
      const count = readSync(sourceFd, buffer, 0, requested, null);
      if (count === 0) break;
      digest.update(buffer.subarray(0, count));
      let offset = 0;
      while (offset < count) {
        const written = writeSync(destinationFd, buffer, offset, count - offset, null);
        if (written <= 0) {
          return fail("destination-byte-mismatch", "destination write made no progress", true);
        }
        offset += written;
      }
      total += count;
      hooks?.afterSourceChunk?.({ relativePath: expected.relativePath, fileIndex, bytesRead: total });
      if (total > expected.bytes) {
        return fail("source-byte-mismatch", "selected source grew beyond its owner row", true);
      }
    }
    fsyncSync(destinationFd);
    const after = fstatSync(sourceFd);
    const current = lstatSync(opened.path);
    const placed = fstatSync(destinationFd);
    const placedPath = lstatSync(target);
    if (
      statObjectIdentity(after) !== statObjectIdentity(before) ||
      statObjectIdentity(current) !== statObjectIdentity(before) ||
      current.isSymbolicLink() ||
      total !== expected.bytes ||
      digest.digest("hex") !== expected.sha256
    ) {
      return fail("source-byte-mismatch", "selected source mutated or disagrees with its owner row", true);
    }
    if (
      !placed.isFile() ||
      placed.nlink !== 1 ||
      placedPath.isSymbolicLink() ||
      statObjectIdentity(placed) !== statObjectIdentity(placedPath) ||
      placed.size !== expected.bytes
    ) {
      return fail("destination-byte-mismatch", "placed destination file changed identity", true);
    }
    hooks?.afterFileCopied?.({ destinationPath: target, relativePath: expected.relativePath, fileIndex });
  } catch (error) {
    if (error instanceof NasLegacyRestoreError) throw error;
    return fail("source-byte-mismatch", "source copy failed closed", true);
  } finally {
    closeSync(sourceFd);
    if (destinationFd !== null) closeSync(destinationFd);
  }
};

const expectedDirectories = (selection: BoundCollectionSelectionV1): readonly string[] => {
  const directories = new Set<string>();
  for (const file of selection.files) {
    let parent = dirname(file.relativePath).split(sep).join("/");
    while (parent !== "." && parent !== "") {
      directories.add(parent);
      const next = dirname(parent).split(sep).join("/");
      if (next === parent) break;
      parent = next;
    }
  }
  return [...directories].sort();
};

const inventoryDirectoryShape = (root: DirectoryBinding): readonly string[] => {
  const directories: string[] = [];
  const names = new Set<string>();
  const walk = (directory: string, prefix: string): void => {
    assertDirectoryBinding(root, "destination-unsafe", "restored destination", true);
    const before = lstatSync(directory);
    const entries = readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
    for (const entry of entries) {
      const relativePath = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      try {
        assertPortableShareRelativePath(relativePath, "restored path");
      } catch {
        return fail("destination-byte-mismatch", "restored tree contains an unsafe path", true);
      }
      const key = portableSharePathCollisionKey(relativePath);
      if (names.has(key)) {
        return fail("destination-byte-mismatch", "restored tree contains a case or Unicode alias", true);
      }
      names.add(key);
      const absolute = resolve(directory, entry.name);
      const status = lstatSync(absolute);
      if (status.isSymbolicLink()) {
        return fail("destination-byte-mismatch", "restored tree contains a symbolic link", true);
      }
      if (status.isDirectory()) {
        directories.push(relativePath);
        walk(absolute, relativePath);
      } else if (!status.isFile() || status.nlink !== 1) {
        return fail("destination-byte-mismatch", "restored tree contains a special or linked file", true);
      }
    }
    const finalNames = readdirSync(directory).sort();
    const after = lstatSync(directory);
    if (
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.mode !== after.mode ||
      before.mtimeMs !== after.mtimeMs ||
      before.ctimeMs !== after.ctimeMs ||
      finalNames.length !== entries.length ||
      finalNames.some((name, index) => name !== entries[index]?.name)
    ) {
      return fail("destination-byte-mismatch", "restored directory mutated during verification", true);
    }
  };
  walk(root.path, "");
  return directories.sort();
};

const verifyDestination = (
  destination: DirectoryBinding,
  selection: BoundCollectionSelectionV1,
  hooks: Pick<NasLegacyRestoreHooks, "beforeDestinationVerification"> | undefined,
): void => {
  hooks?.beforeDestinationVerification?.(destination.path);
  assertDirectoryBinding(destination, "destination-unsafe", "restored destination", true);
  let inventory;
  try {
    inventory = inventoryStableTree(destination.path);
  } catch {
    return fail("destination-byte-mismatch", "restored tree cannot be inventoried exactly", true);
  }
  if (
    inventory.fileCount !== selection.fileCount ||
    inventory.totalBytes !== selection.totalBytes ||
    inventory.treeSha256 !== selection.treeSha256 ||
    inventory.files.some((file, index) => {
      const expected = selection.files[index];
      return expected === undefined ||
        file.path !== expected.relativePath ||
        file.byteLength !== expected.bytes ||
        file.sha256 !== expected.sha256;
    })
  ) {
    return fail("destination-byte-mismatch", "restored tree differs from its exact owner rows", true);
  }
  const actualDirectories = inventoryDirectoryShape(destination);
  const wantedDirectories = expectedDirectories(selection);
  if (
    actualDirectories.length !== wantedDirectories.length ||
    actualDirectories.some((path, index) => path !== wantedDirectories[index])
  ) {
    return fail("destination-byte-mismatch", "restored tree contains an extra or missing directory", true);
  }
};

const successReport = (
  command: "restore" | "verify",
  selection: BoundCollectionSelectionV1,
): NasLegacyRestoreSuccessReport => ({
  format: NAS_LEGACY_RESTORE_REPORT_FORMAT,
  command,
  ok: true,
  collection: selection.identity,
  destinationScope: "repo-out-restores",
  fileCount: selection.fileCount,
  totalBytes: selection.totalBytes,
  treeSha256: selection.treeSha256,
  durableReceiptWritten: false,
  pruneAuthorized: false,
  limits: [
    "This result verifies one fresh local staging tree and is not a durable publication receipt.",
    "This command never grants local or NAS prune authority.",
  ],
});

/** Restore one active legacy collection into an atomically reserved fresh local staging tree. */
export function restoreLegacyNasCollection(
  options: NasLegacyRestoreOptions,
): NasLegacyRestoreSuccessReport {
  const context = prepareContext(options);
  const destination = reserveDestination(
    context.repo,
    context.destination,
    context.destinationRelative,
    options.hooks,
  );
  try {
    assertDirectoryBinding(destination, "destination-unsafe", "reserved destination", true);
    for (let index = 0; index < context.selection.files.length; index += 1) {
      copyExpectedFile(
        context.share,
        destination,
        context.selection.locator as string,
        context.selection.files[index] as BoundCollectionFileV1,
        index,
        options.hooks,
      );
    }
    revalidateMarkedShare(context.share);
    verifyDestination(destination, context.selection, options.hooks);
    revalidateMarkedShare(context.share);
    return successReport("restore", context.selection);
  } catch (error) {
    if (error instanceof NasLegacyRestoreError) {
      if (error.destinationReserved) throw error;
      throw new NasLegacyRestoreError(error.code, error.message, true);
    }
    return fail("destination-byte-mismatch", "restore failed after destination reservation", true);
  }
}

/** Verify an existing restored tree against the same exact owner selection used by restore. */
export function verifyLegacyNasRestore(
  options: NasLegacyVerifyOptions,
): NasLegacyRestoreSuccessReport {
  const context = prepareContext(options);
  const destinationRelative = context.destinationRelative;
  const destination = assertExactExistingRelativeDirectory(
    context.repo,
    destinationRelative,
    "destination-invalid",
  );
  verifyDestination(destination, context.selection, options.hooks);
  revalidateMarkedShare(context.share);
  return successReport("verify", context.selection);
}
