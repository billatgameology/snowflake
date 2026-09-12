// Exact, read-only owner-manifest selection for legacy NAS collections.
//
// This module resolves no mount and performs no payload mutation. Callers provide a repository
// root and, for NAS-private owner manifests, an already validated share root. The returned rows
// are catalog-bound, locator-stripped, and suitable as the byte contract for a later restore.

import { createHash } from "node:crypto";
import {
  closeSync,
  fstatSync,
  lstatSync,
  readSync,
} from "node:fs";

import {
  assertPortableShareRelativePath,
  openContainedRegularFile,
  portableSharePathCollisionKey,
  type NasAssetCatalogV1,
  type NasAssetCollectionV1,
  type NasManifestSelectorV1,
  type NasOwnerManifestV1,
} from "./nas-asset-lib.ts";

export const MAX_NAS_OWNER_MANIFEST_BYTES = 32 * 1024 * 1024;

export type NasAssetSelectionErrorCode =
  | "collection-invalid"
  | "owner-manifest-not-declared"
  | "owner-manifest-unavailable"
  | "owner-manifest-read-failed"
  | "owner-manifest-byte-or-digest-mismatch"
  | "owner-manifest-selector-unsupported"
  | "owner-manifest-selector-invalid"
  | "collection-aggregate-mismatch";

export class NasAssetSelectionError extends Error {
  override readonly name = "NasAssetSelectionError";
  readonly code: NasAssetSelectionErrorCode;

  constructor(
    code: NasAssetSelectionErrorCode,
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

export interface BoundCollectionFileV1 {
  /** Historical/current path exactly as selected from the owner manifest. */
  readonly sharePath: string;
  /** Exact path after stripping the collection locator or historical root. */
  readonly relativePath: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface BoundCollectionSelectionV1 {
  readonly identity: string;
  readonly state: NasAssetCollectionV1["state"];
  readonly locator: string | null;
  /** `locator` when present; otherwise the unavailable collection's historical repository root. */
  readonly ownershipRoot: string;
  readonly ownerManifestSha256: string;
  readonly files: readonly BoundCollectionFileV1[];
  readonly fileCount: number;
  readonly totalBytes: number;
  /** SHA-256 of JSON tuples `[relativePath, bytes, sha256]` in portable path order. */
  readonly treeSha256: string;
}

export interface BoundCollectionSelectionHooks {
  /** Test/fault hook. Production callers leave this unset. */
  readonly afterManifestChunk?: (bytesRead: number) => void;
}

export interface LoadBoundCollectionSelectionOptions {
  readonly catalogue: NasAssetCatalogV1;
  /** Exact `assetId@version`; unversioned and ambiguous references are refused. */
  readonly collection: string;
  readonly repoRoot: string;
  /** Required only when the selected owner manifest has `nas-private` storage. */
  readonly shareRoot: string | null;
  readonly hooks?: BoundCollectionSelectionHooks;
}

export interface BindCollectionSelectionOptions {
  readonly catalogue: NasAssetCatalogV1;
  /** Exact `assetId@version`; unversioned and ambiguous references are refused. */
  readonly collection: string;
  /** Bytes already read through `readBoundOwnerManifest`. They are re-hashed before selection. */
  readonly ownerManifestBytes: Buffer;
}

export interface ReadBoundOwnerManifestOptions {
  readonly binding: NasOwnerManifestV1;
  readonly repoRoot: string;
  readonly shareRoot: string | null;
  readonly hooks?: BoundCollectionSelectionHooks;
}

interface ManifestRow {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface BoundOwnerManifestReadV1 {
  readonly bytes: Buffer;
  readonly byteLength: number;
  readonly sha256: string;
}

const fail = (
  message: string,
  code: NasAssetSelectionErrorCode = "owner-manifest-selector-invalid",
): never => {
  throw new NasAssetSelectionError(code, message);
};

const comparePortablePaths = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const pathContainsExactly = (parent: string, child: string): boolean =>
  child === parent || child.startsWith(`${parent}/`);

const asRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return fail(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
};

const asSafeByteLength = (value: unknown, label: string): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    return fail(`${label} must be a non-negative safe integer`);
  }
  return value;
};

const decodeUtf8 = (bytes: Buffer, label: string): string => {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return fail(`${label} must not begin with a UTF-8 byte-order mark`);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return fail(`${label} is not valid UTF-8`);
  }
};

const parseJsonObject = (bytes: Buffer, label: string): Record<string, unknown> => {
  const source = decodeUtf8(bytes, label);
  let parsed: unknown;
  try {
    parsed = JSON.parse(source) as unknown;
  } catch {
    return fail(`${label} is malformed JSON`);
  }
  return asRecord(parsed, label);
};

const parseManifestRow = (value: unknown, path: string, label: string): ManifestRow => {
  const row = asRecord(value, label);
  assertPortableShareRelativePath(path, `${label}.path`);
  const bytes = asSafeByteLength(row.bytes, `${label}.bytes`);
  if (typeof row.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(row.sha256)) {
    return fail(`${label}.sha256 must be lowercase SHA-256 hex`);
  }
  return { path, bytes, sha256: row.sha256 };
};

/** Read at most `maximumBytes` plus one sentinel byte from the already-open descriptor. */
export function readDescriptorCapped(
  fd: number,
  maximumBytes: number,
  label: string,
  afterChunk?: (bytesRead: number) => void,
): Buffer {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 0) {
    return fail(`${label} has an invalid bounded read limit`, "owner-manifest-read-failed");
  }
  const chunks: Buffer[] = [];
  let total = 0;
  while (true) {
    const remainingExpected = maximumBytes - total;
    const requested = remainingExpected >= 1024 * 1024
      ? 1024 * 1024
      : remainingExpected >= 0
        ? remainingExpected + 1
        : 0;
    if (requested === 0) return fail(`${label} exceeds its bounded read limit`, "owner-manifest-read-failed");
    const chunk = Buffer.allocUnsafe(requested);
    const count = readSync(fd, chunk, 0, chunk.length, null);
    if (count === 0) break;
    chunks.push(chunk.subarray(0, count));
    total += count;
    afterChunk?.(total);
    if (total > maximumBytes) return fail(`${label} exceeds its bounded read limit`, "owner-manifest-read-failed");
  }
  return Buffer.concat(chunks, total);
}

const readBoundManifestFile = (
  root: string,
  binding: NasOwnerManifestV1,
  hooks: BoundCollectionSelectionHooks | undefined,
): BoundOwnerManifestReadV1 => {
  const opened = openContainedRegularFile(root, binding.path);
  if (opened.kind !== "ok") {
    return fail(
      "owner manifest is missing, unsafe, or not an ordinary file",
      "owner-manifest-unavailable",
    );
  }
  try {
    if (opened.byteLength > MAX_NAS_OWNER_MANIFEST_BYTES) {
      return fail("owner manifest exceeds its bounded read limit", "owner-manifest-read-failed");
    }
    const before = fstatSync(opened.fd);
    const bytes = readDescriptorCapped(
      opened.fd,
      MAX_NAS_OWNER_MANIFEST_BYTES,
      "owner manifest",
      hooks?.afterManifestChunk,
    );
    const after = fstatSync(opened.fd);
    let currentPath;
    try {
      currentPath = lstatSync(opened.path);
    } catch {
      return fail("owner manifest changed while reading", "owner-manifest-read-failed");
    }
    if (
      !before.isFile() ||
      before.nlink !== 1 ||
      !after.isFile() ||
      after.nlink !== 1 ||
      after.dev !== before.dev ||
      after.ino !== before.ino ||
      after.mode !== before.mode ||
      after.size !== before.size ||
      after.mtimeMs !== before.mtimeMs ||
      after.ctimeMs !== before.ctimeMs ||
      after.dev !== opened.dev ||
      after.ino !== opened.ino ||
      after.size !== opened.byteLength ||
      currentPath.isSymbolicLink() ||
      !currentPath.isFile() ||
      currentPath.nlink !== 1 ||
      currentPath.dev !== after.dev ||
      currentPath.ino !== after.ino ||
      currentPath.mode !== after.mode ||
      currentPath.size !== after.size ||
      currentPath.mtimeMs !== after.mtimeMs ||
      currentPath.ctimeMs !== after.ctimeMs ||
      bytes.byteLength !== opened.byteLength
    ) {
      return fail("owner manifest changed while reading", "owner-manifest-read-failed");
    }
    return {
      bytes,
      byteLength: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  } finally {
    closeSync(opened.fd);
  }
};

/** Read and exact-bind one tracked or NAS-private owner manifest without parsing its selection. */
export function readBoundOwnerManifest(
  options: ReadBoundOwnerManifestOptions,
): BoundOwnerManifestReadV1 {
  const root = options.binding.storage === "tracked" ? options.repoRoot : options.shareRoot;
  if (root === null) {
    return fail(
      "NAS-private owner manifest requires an attached validated share root",
      "owner-manifest-unavailable",
    );
  }
  const read = readBoundManifestFile(root, options.binding, options.hooks);
  if (read.byteLength !== options.binding.bytes || read.sha256 !== options.binding.sha256) {
    return fail(
      "owner manifest byte length or SHA-256 disagrees with the catalogue binding",
      "owner-manifest-byte-or-digest-mismatch",
    );
  }
  return read;
}

const rowsForPathPrefixes = (
  bytes: Buffer,
  selector: Extract<NasManifestSelectorV1, { readonly kind: "path-prefixes" }>,
): readonly ManifestRow[] => {
  const manifest = parseJsonObject(bytes, "path-prefix owner manifest");
  if (!Array.isArray(manifest.files)) return fail("path-prefix owner manifest files must be an array");
  const rows: ManifestRow[] = [];
  for (let index = 0; index < manifest.files.length; index += 1) {
    const value = asRecord(manifest.files[index], `manifest.files[${index}]`);
    if (typeof value.path !== "string") return fail(`manifest.files[${index}].path must be a string`);
    const included = selector.include.some((prefix) => pathContainsExactly(prefix, value.path as string));
    const excluded = selector.exclude.some((prefix) => pathContainsExactly(prefix, value.path as string));
    if (included && !excluded) rows.push(parseManifestRow(value, value.path, `manifest.files[${index}]`));
  }
  return rows;
};

const rowsForJsonTree = (
  bytes: Buffer,
  selector: Extract<NasManifestSelectorV1, { readonly kind: "json-tree-key" }>,
): readonly ManifestRow[] => {
  const manifest = parseJsonObject(bytes, "tree owner manifest");
  const trees = asRecord(manifest.trees, "tree owner manifest.trees");
  const tree = asRecord(trees[selector.key], "selected tree");
  const fileRecord = asRecord(tree.files, "selected tree.files");
  const rows = Object.entries(fileRecord).map(([relativePath, value]) => {
    assertPortableShareRelativePath(relativePath, "selected tree relative path");
    return parseManifestRow(value, `${selector.key}/${relativePath}`, "selected tree.files row");
  });
  if (asSafeByteLength(tree.fileCount, "selected tree.fileCount") !== rows.length) {
    return fail("selected tree fileCount disagrees with its rows");
  }
  const totalBytes = rows.reduce((sum, row) => sum + row.bytes, 0);
  if (!Number.isSafeInteger(totalBytes)) return fail("selected tree bytes exceed the safe-integer range");
  if (asSafeByteLength(tree.bytes, "selected tree.bytes") !== totalBytes) {
    return fail("selected tree bytes disagree with its rows");
  }
  return rows;
};

const rowsForJsonlField = (
  bytes: Buffer,
  selector: Extract<NasManifestSelectorV1, { readonly kind: "jsonl-field-equals" }>,
  ownershipRoot: string,
): readonly ManifestRow[] => {
  const lines = decodeUtf8(bytes, "owner JSONL").split("\n");
  const rows: ManifestRow[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] as string;
    if (line === "") continue;
    let value: unknown;
    try {
      value = JSON.parse(line) as unknown;
    } catch {
      return fail(`owner JSONL line ${index + 1} is malformed`);
    }
    const row = asRecord(value, `owner JSONL line ${index + 1}`);
    if (row.recordType !== selector.recordType || row[selector.field] !== selector.equals) continue;
    if (typeof row.path !== "string") return fail(`owner JSONL line ${index + 1} path must be a string`);
    assertPortableShareRelativePath(row.path, `owner JSONL line ${index + 1}.path`);
    rows.push(parseManifestRow(
      row,
      `${ownershipRoot}/${row.path}`,
      `owner JSONL line ${index + 1}`,
    ));
  }
  return rows;
};

const rowsForAll = (bytes: Buffer): readonly ManifestRow[] => {
  const manifest = parseJsonObject(bytes, "all-rows owner manifest");
  if (!Array.isArray(manifest.files)) return fail("all-rows owner manifest files must be an array");
  return manifest.files.map((value, index) => {
    const row = asRecord(value, `manifest.files[${index}]`);
    if (typeof row.path !== "string") return fail(`manifest.files[${index}].path must be a string`);
    return parseManifestRow(row, row.path, `manifest.files[${index}]`);
  });
};

const selectRows = (
  bytes: Buffer,
  selector: NasManifestSelectorV1,
  ownershipRoot: string,
): readonly ManifestRow[] => {
  if (selector.kind === "path-prefixes") return rowsForPathPrefixes(bytes, selector);
  if (selector.kind === "json-tree-key") return rowsForJsonTree(bytes, selector);
  if (selector.kind === "jsonl-field-equals") return rowsForJsonlField(bytes, selector, ownershipRoot);
  if (selector.kind === "all") return rowsForAll(bytes);
  return fail("documented-only owner manifests do not define an exact byte selection");
};

const stripOwnershipRoot = (ownershipRoot: string, sharePath: string): string => {
  if (!pathContainsExactly(ownershipRoot, sharePath)) {
    return fail("selected manifest row is outside the collection ownership root");
  }
  if (sharePath === ownershipRoot) return "";
  const relativePath = sharePath.slice(ownershipRoot.length + 1);
  assertPortableShareRelativePath(relativePath, "selected relative path");
  return relativePath;
};

const exactCollection = (
  catalogue: NasAssetCatalogV1,
  reference: string,
): NasAssetCollectionV1 => {
  if (!reference.includes("@")) {
    return fail("collection reference must include an exact @version", "collection-invalid");
  }
  const matches = catalogue.collections.filter((collection) =>
    `${collection.assetId}@${collection.version}` === reference);
  if (matches.length !== 1) {
    return fail("collection reference does not identify exactly one catalogue entry", "collection-invalid");
  }
  return matches[0] as NasAssetCollectionV1;
};

/** Bind already-read owner-manifest bytes to one catalogue selection and exact aggregate. */
export function bindCollectionSelection(
  options: BindCollectionSelectionOptions,
): BoundCollectionSelectionV1 {
  const collection = exactCollection(options.catalogue, options.collection);
  const manifest = collection.ownerManifest;
  if (manifest === null) return fail("collection has no owner manifest", "owner-manifest-not-declared");
  if (manifest.selector.kind === "documented-only") {
    return fail(
      "documented-only owner manifests do not define an exact byte selection",
      "owner-manifest-selector-unsupported",
    );
  }
  const ownerManifestSha256 = createHash("sha256").update(options.ownerManifestBytes).digest("hex");
  if (
    options.ownerManifestBytes.byteLength !== manifest.bytes ||
    ownerManifestSha256 !== manifest.sha256
  ) {
    return fail(
      "owner manifest byte length or SHA-256 disagrees with the catalogue binding",
      "owner-manifest-byte-or-digest-mismatch",
    );
  }
  const ownershipRoot = collection.locator ?? collection.historicalRepoPath;
  if (ownershipRoot === null) return fail("collection has no locator or historical ownership root");

  const selected = selectRows(options.ownerManifestBytes, manifest.selector, ownershipRoot);
  if (selected.length === 0) return fail("owner manifest selector selected no files");
  const collisionKeys = new Set<string>();
  const files = selected.map((row) => {
    const collisionKey = portableSharePathCollisionKey(row.path);
    if (collisionKeys.has(collisionKey)) {
      return fail("selected manifest rows contain a duplicate or case/Unicode path alias");
    }
    collisionKeys.add(collisionKey);
    return {
      sharePath: row.path,
      relativePath: stripOwnershipRoot(ownershipRoot, row.path),
      bytes: row.bytes,
      sha256: row.sha256,
    };
  }).sort((left, right) => comparePortablePaths(left.relativePath, right.relativePath));

  const relativeCollisionKeys = new Set(files.map((file) =>
    portableSharePathCollisionKey(file.relativePath)));
  for (const file of files) {
    if (file.relativePath === "") {
      if (files.length !== 1) return fail("a selected file path is an ancestor of another selected file");
      continue;
    }
    const segments = file.relativePath.split("/");
    for (let length = 1; length < segments.length; length += 1) {
      const ancestor = segments.slice(0, length).join("/");
      if (relativeCollisionKeys.has(portableSharePathCollisionKey(ancestor))) {
        return fail("a selected file path is an ancestor of another selected file");
      }
    }
  }

  let totalBytes = 0;
  for (const file of files) {
    totalBytes += file.bytes;
    if (!Number.isSafeInteger(totalBytes)) return fail("selected manifest bytes exceed the safe-integer range");
  }
  if (files.length !== collection.aggregate.files || totalBytes !== collection.aggregate.bytes) {
    return fail(
      "selected owner-manifest rows disagree with the catalogue aggregate",
      "collection-aggregate-mismatch",
    );
  }
  const treeSha256 = createHash("sha256")
    .update(JSON.stringify(files.map((file) => [file.relativePath, file.bytes, file.sha256])))
    .digest("hex");
  return {
    identity: options.collection,
    state: collection.state,
    locator: collection.locator,
    ownershipRoot,
    ownerManifestSha256,
    files,
    fileCount: files.length,
    totalBytes,
    treeSha256,
  };
}

/**
 * Load one exact owner-manifest selection and bind it to its catalogue identity and aggregate.
 * Payload bytes are not opened. A NAS-private manifest requires an already validated share root.
 */
export function loadBoundCollectionSelection(
  options: LoadBoundCollectionSelectionOptions,
): BoundCollectionSelectionV1 {
  const collection = exactCollection(options.catalogue, options.collection);
  const manifest = collection.ownerManifest;
  if (manifest === null) return fail("collection has no owner manifest", "owner-manifest-not-declared");
  if (manifest.selector.kind === "documented-only") {
    return fail(
      "documented-only owner manifests do not define an exact byte selection",
      "owner-manifest-selector-unsupported",
    );
  }
  const read = readBoundOwnerManifest({
    binding: manifest,
    repoRoot: options.repoRoot,
    shareRoot: options.shareRoot,
    hooks: options.hooks,
  });
  return bindCollectionSelection({
    catalogue: options.catalogue,
    collection: options.collection,
    ownerManifestBytes: read.bytes,
  });
}
