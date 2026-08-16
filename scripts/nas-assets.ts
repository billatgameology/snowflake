// Read-only audit and verification entry point for governed NAS assets.
//
// This first CLI intentionally has no publication, movement, restoration, or deletion path.
// Default verification reads only bounded catalogue/owner-manifest bytes. Payload hashing is an
// explicit, single-collection operation so a routine check cannot accidentally start a 447 GB
// share walk.

import { createHash } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  opendirSync,
  readSync,
} from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertPortableShareRelativePath,
  openContainedRegularFile,
  parseNasAssetCatalogV1,
  portableSharePathCollisionKey,
  resolveContainedDirectory,
  type NasAssetCatalogV1,
  type NasAssetCollectionV1,
  type NasOwnerManifestV1,
} from "./nas-asset-lib.ts";
import {
  bindCollectionSelection,
  MAX_NAS_OWNER_MANIFEST_BYTES,
  NasAssetSelectionError,
  readBoundOwnerManifest,
  readDescriptorCapped,
  type BoundCollectionSelectionV1,
  type BoundOwnerManifestReadV1,
} from "./nas-asset-selection-lib.ts";
import { detectNasMount } from "./nas-root.ts";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_CATALOG_PATH = resolve(PROJECT_ROOT, "docs/nas-assets.json");
const REPORT_FORMAT = "snowflake-nas-assets-readonly-report-v1" as const;
const MAX_CATALOG_BYTES = 4 * 1024 * 1024;
const MAX_OWNER_MANIFEST_BYTES = MAX_NAS_OWNER_MANIFEST_BYTES;
const MAX_TOP_LEVEL_ENTRIES = 4_096;

type EntryKind = "directory" | "file" | "symlink" | "special" | "unstatable";

export interface TopLevelEntryDescription {
  readonly name: string;
  readonly kind: EntryKind;
}

export interface TopLevelAuditCounts {
  readonly entries: number;
  readonly classifiedEntries: number;
  readonly unclassifiedEntries: number;
  readonly unsafeEntries: number;
  readonly caseOrNfcAliasEntries: number;
  readonly symlinkEntries: number;
  readonly specialOrUnstatableEntries: number;
  readonly wrongKindEntries: number;
  readonly missingRequiredRoots: number;
}

export interface ReportIssue {
  readonly code: string;
  readonly count: number;
}

interface IssueSink {
  add(code: string, count?: number): void;
  list(): readonly ReportIssue[];
  total(): number;
}

function issueSink(): IssueSink {
  const counts = new Map<string, number>();
  return {
    add(code, count = 1) {
      if (count <= 0) return;
      counts.set(code, (counts.get(code) ?? 0) + count);
    },
    list() {
      return [...counts]
        .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
        .map(([code, count]) => ({ code, count }));
    },
    total() {
      let total = 0;
      for (const count of counts.values()) total += count;
      return total;
    },
  };
}

function firstSegment(path: string): string {
  return path.split("/", 1)[0] as string;
}

function topLevelPolicy(catalogue: NasAssetCatalogV1): {
  readonly known: ReadonlySet<string>;
  readonly requiredDirectories: ReadonlySet<string>;
} {
  const known = new Set<string>([
    firstSegment(catalogue.shareMarker.path),
    firstSegment(catalogue.controlRoot),
    ...catalogue.systemExclusions.map((entry) => firstSegment(entry.path)),
  ]);
  const requiredDirectories = new Set<string>([firstSegment(catalogue.controlRoot)]);
  const addOwnedPath = (path: string | null, required: boolean): void => {
    if (path === null) return;
    const top = firstSegment(path);
    known.add(top);
    if (required && path.includes("/")) requiredDirectories.add(top);
  };
  for (const collection of catalogue.collections) {
    const required = collection.state === "active" || collection.state === "provisional";
    addOwnedPath(collection.locator, required);
    for (const alias of collection.legacyAliases) addOwnedPath(alias, false);
    for (const prefix of collection.serve.prefixes) addOwnedPath(prefix, required);
    if (collection.ownerManifest?.storage === "nas-private") {
      addOwnedPath(collection.ownerManifest.path, required);
    }
  }
  for (const overlay of catalogue.overlays) {
    if (overlay.manifest.storage === "nas-private") addOwnedPath(overlay.manifest.path, false);
  }
  return { known, requiredDirectories };
}

/**
 * Classify already-stated top-level metadata without returning any entry name. This is exported
 * so case/NFC and Windows-name controls remain cross-platform fixture tests.
 */
export function auditTopLevelEntries(
  catalogue: NasAssetCatalogV1,
  entries: readonly TopLevelEntryDescription[],
): TopLevelAuditCounts {
  const policy = topLevelPolicy(catalogue);
  const actualNames = new Set(entries.map((entry) => entry.name));
  const namesByCollisionKey = new Map<string, Set<string>>();
  for (const entry of entries) {
    const key = portableSharePathCollisionKey(entry.name);
    const names = namesByCollisionKey.get(key) ?? new Set<string>();
    names.add(entry.name);
    namesByCollisionKey.set(key, names);
  }
  const knownByCollisionKey = new Map<string, Set<string>>();
  for (const name of policy.known) {
    const key = portableSharePathCollisionKey(name);
    const names = knownByCollisionKey.get(key) ?? new Set<string>();
    names.add(name);
    knownByCollisionKey.set(key, names);
  }

  let classifiedEntries = 0;
  let unclassifiedEntries = 0;
  let unsafeEntries = 0;
  let caseOrNfcAliasEntries = 0;
  let symlinkEntries = 0;
  let specialOrUnstatableEntries = 0;
  let wrongKindEntries = 0;
  for (const entry of entries) {
    const classified = policy.known.has(entry.name);
    if (classified) classifiedEntries += 1;
    else unclassifiedEntries += 1;
    try {
      assertPortableShareRelativePath(entry.name, "top-level entry");
    } catch {
      unsafeEntries += 1;
    }
    const key = portableSharePathCollisionKey(entry.name);
    const actualAliases = namesByCollisionKey.get(key)?.size ?? 0;
    const knownAliases = knownByCollisionKey.get(key);
    if (actualAliases > 1 || (!classified && knownAliases !== undefined)) caseOrNfcAliasEntries += 1;
    if (entry.kind === "symlink") symlinkEntries += 1;
    if (entry.kind === "special" || entry.kind === "unstatable") specialOrUnstatableEntries += 1;
    if (policy.requiredDirectories.has(entry.name) && entry.kind !== "directory") wrongKindEntries += 1;
  }
  let missingRequiredRoots = 0;
  for (const name of policy.requiredDirectories) {
    if (!actualNames.has(name)) missingRequiredRoots += 1;
  }
  return {
    entries: entries.length,
    classifiedEntries,
    unclassifiedEntries,
    unsafeEntries,
    caseOrNfcAliasEntries,
    symlinkEntries,
    specialOrUnstatableEntries,
    wrongKindEntries,
    missingRequiredRoots,
  };
}

interface CommonOptions {
  readonly command: "audit" | "verify";
  readonly catalogPath: string;
  readonly repoRoot: string;
  readonly nasRoot: string | null;
  readonly collectionSelectors: readonly string[];
  readonly full: boolean;
}

function parseArguments(argv: readonly string[], cwd: string): CommonOptions {
  const command = argv[0];
  if (command !== "audit" && command !== "verify") {
    throw new Error("first argument must be exactly audit or verify");
  }
  let catalogPath = DEFAULT_CATALOG_PATH;
  let repoRoot = PROJECT_ROOT;
  let nasRoot: string | null = null;
  let full = false;
  let sawCatalog = false;
  let sawRepoRoot = false;
  let sawNasRoot = false;
  const collectionSelectors: string[] = [];
  for (let index = 1; index < argv.length; index += 1) {
    const argument = argv[index] as string;
    if (argument === "--full") {
      if (full) throw new Error("--full may appear only once");
      full = true;
      continue;
    }
    const withValue = ["--catalog", "--repo-root", "--nas-root", "--collection"].includes(argument);
    if (!withValue) throw new Error(`unknown argument ${argument}`);
    const value = argv[index + 1];
    if (value === undefined || value === "" || value.startsWith("--")) {
      throw new Error(`${argument} requires one non-empty value`);
    }
    index += 1;
    if (argument === "--catalog") {
      if (sawCatalog) throw new Error("--catalog may appear only once");
      sawCatalog = true;
      catalogPath = resolve(cwd, value);
    } else if (argument === "--repo-root") {
      if (sawRepoRoot) throw new Error("--repo-root may appear only once");
      sawRepoRoot = true;
      repoRoot = resolve(cwd, value);
    } else if (argument === "--nas-root") {
      if (sawNasRoot) throw new Error("--nas-root may appear only once");
      sawNasRoot = true;
      nasRoot = resolve(cwd, value);
    } else {
      if (collectionSelectors.includes(value)) throw new Error(`duplicate --collection selector ${value}`);
      collectionSelectors.push(value);
    }
  }
  if (command === "audit" && (full || collectionSelectors.length > 0)) {
    throw new Error("audit does not accept --full or --collection");
  }
  if (command === "audit" && sawRepoRoot) {
    throw new Error("audit does not accept the verify-only --repo-root option");
  }
  if (full && collectionSelectors.length !== 1) {
    throw new Error("--full requires exactly one explicit --collection selector");
  }
  return { command, catalogPath, repoRoot, nasRoot, collectionSelectors, full };
}

/** Read at most maximumBytes plus one sentinel byte, even if the file grows while open. */
export const readFileDescriptorCapped = readDescriptorCapped;

function readBoundedLocalFile(path: string, maximumBytes: number, label: string): Buffer {
  const status = lstatSync(path);
  if (!status.isFile() || status.isSymbolicLink()) throw new Error(`${label} is not an ordinary file`);
  if (status.nlink !== 1) throw new Error(`${label} is hard-linked`);
  if (status.size > maximumBytes) throw new Error(`${label} exceeds its bounded read limit`);
  const fd = openSync(
    path,
    constants.O_RDONLY | (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
  );
  try {
    const opened = fstatSync(fd);
    if (
      !opened.isFile() ||
      opened.nlink !== 1 ||
      opened.dev !== status.dev ||
      opened.ino !== status.ino ||
      opened.mode !== status.mode ||
      opened.size !== status.size ||
      opened.mtimeMs !== status.mtimeMs ||
      opened.ctimeMs !== status.ctimeMs
    ) {
      throw new Error(`${label} changed before opening`);
    }
    const value = readFileDescriptorCapped(fd, maximumBytes, label);
    const after = fstatSync(fd);
    const currentPath = lstatSync(path);
    if (
      after.dev !== opened.dev ||
      after.ino !== opened.ino ||
      after.mode !== opened.mode ||
      after.size !== opened.size ||
      after.mtimeMs !== opened.mtimeMs ||
      after.ctimeMs !== opened.ctimeMs ||
      after.nlink !== 1 ||
      currentPath.isSymbolicLink() ||
      currentPath.nlink !== 1 ||
      currentPath.dev !== after.dev ||
      currentPath.ino !== after.ino ||
      currentPath.mode !== after.mode ||
      currentPath.size !== after.size ||
      currentPath.mtimeMs !== after.mtimeMs ||
      currentPath.ctimeMs !== after.ctimeMs ||
      value.byteLength !== status.size
    ) {
      throw new Error(`${label} changed while reading`);
    }
    return value;
  } finally {
    closeSync(fd);
  }
}

function loadCatalog(path: string): NasAssetCatalogV1 {
  const bytes = readBoundedLocalFile(path, MAX_CATALOG_BYTES, "catalogue");
  return parseNasAssetCatalogV1(bytes.toString("utf8"));
}

function mountEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
  explicitRoot: string | null,
): Readonly<Record<string, string | undefined>> {
  if (explicitRoot === null) return environment;
  return { ...environment, VCC_NAS_ROOT: explicitRoot, GUTCHECK_NAS_ROOT: undefined };
}

function resolveMount(
  environment: Readonly<Record<string, string | undefined>>,
  explicitRoot: string | null,
  candidates?: readonly string[],
): string | null {
  return detectNasMount(
    mountEnvironment(environment, explicitRoot),
    explicitRoot === null ? candidates : [],
  );
}

function readTopLevelMetadata(mount: string): {
  readonly entries: readonly TopLevelEntryDescription[];
  readonly truncated: boolean;
} {
  const directory = opendirSync(mount);
  const entries: TopLevelEntryDescription[] = [];
  let truncated = false;
  try {
    while (true) {
      const entry = directory.readSync();
      if (entry === null) break;
      if (entries.length >= MAX_TOP_LEVEL_ENTRIES) {
        truncated = true;
        break;
      }
      let kind: EntryKind = "unstatable";
      try {
        const status = lstatSync(resolve(mount, entry.name));
        if (status.isSymbolicLink()) kind = "symlink";
        else if (status.isDirectory()) kind = "directory";
        else if (status.isFile()) kind = "file";
        else kind = "special";
      } catch {
        kind = "unstatable";
      }
      entries.push({ name: entry.name, kind });
    }
  } finally {
    directory.closeSync();
  }
  return { entries, truncated };
}

export interface AuditReport {
  readonly format: typeof REPORT_FORMAT;
  readonly command: "audit";
  readonly ok: boolean;
  readonly scope: "bounded-top-level-metadata";
  readonly mount: "attached" | "detached" | "invalid";
  readonly catalogueCollections: number;
  readonly counts: TopLevelAuditCounts | null;
  readonly defects: readonly ReportIssue[];
  readonly limits: readonly string[];
}

export function auditNasAssets(
  catalogue: NasAssetCatalogV1,
  environment: Readonly<Record<string, string | undefined>>,
  explicitRoot: string | null,
  candidates?: readonly string[],
): AuditReport {
  const defects = issueSink();
  let mountState: AuditReport["mount"] = "detached";
  let counts: TopLevelAuditCounts | null = null;
  let mount: string | null = null;
  try {
    mount = resolveMount(environment, explicitRoot, candidates);
  } catch {
    mountState = "invalid";
    defects.add("wrong-or-invalid-share-marker");
  }
  if (mount === null && mountState !== "invalid") defects.add("nas-detached");
  if (mount !== null) {
    mountState = "attached";
    try {
      const metadata = readTopLevelMetadata(mount);
      counts = auditTopLevelEntries(catalogue, metadata.entries);
      if (metadata.truncated) defects.add("top-level-entry-limit-exceeded");
      defects.add("unclassified-top-level-entry", counts.unclassifiedEntries);
      defects.add("unsafe-top-level-entry", counts.unsafeEntries);
      defects.add("case-or-nfc-top-level-alias", counts.caseOrNfcAliasEntries);
      defects.add("top-level-symlink", counts.symlinkEntries);
      defects.add("top-level-special-or-unstatable", counts.specialOrUnstatableEntries);
      defects.add("catalogued-top-level-wrong-kind", counts.wrongKindEntries);
      defects.add("catalogued-top-level-missing", counts.missingRequiredRoots);
    } catch {
      defects.add("top-level-metadata-read-failed");
    }
  }
  return {
    format: REPORT_FORMAT,
    command: "audit",
    ok: defects.total() === 0,
    scope: "bounded-top-level-metadata",
    mount: mountState,
    catalogueCollections: catalogue.collections.length,
    counts,
    defects: defects.list(),
    limits: [
      "No collection payload was opened or hashed.",
      `The scan stops after ${MAX_TOP_LEVEL_ENTRIES} top-level entries.`,
      "An unclassified entry is reported only as an aggregate count; its name is never emitted or catalogued.",
      "No publication, restoration, movement, quarantine, or deletion is available in this command.",
    ],
  };
}

interface CollectionVerifyResult {
  readonly identity: string;
  readonly state: NasAssetCollectionV1["state"];
  readonly manifest: "verified" | "mismatch" | "unavailable" | "not-declared";
  readonly aggregate: "verified" | "mismatch" | "unsupported" | "not-checked";
  readonly payload: "not-run" | "verified-full" | "mismatch" | "catalogued-unavailable";
}

interface OverlayVerifyResult {
  readonly overlayId: string;
  readonly manifest: "verified" | "mismatch" | "unavailable";
}

export interface VerifyReport {
  readonly format: typeof REPORT_FORMAT;
  readonly command: "verify";
  readonly ok: boolean;
  readonly scope: "owner-manifest-and-selector-aggregates" | "explicit-single-collection-full-hash";
  readonly mount: "attached" | "detached" | "not-required" | "invalid";
  readonly collections: readonly CollectionVerifyResult[];
  readonly overlays: readonly OverlayVerifyResult[];
  readonly defects: readonly ReportIssue[];
  readonly limitations: readonly ReportIssue[];
  readonly fullPayloadTotals: { readonly files: number; readonly bytes: number } | null;
  readonly limits: readonly string[];
}

function collectionIdentity(collection: NasAssetCollectionV1): string {
  return `${collection.assetId}@${collection.version}`;
}

function selectCollections(catalogue: NasAssetCatalogV1, selectors: readonly string[]): readonly NasAssetCollectionV1[] {
  if (selectors.length === 0) return catalogue.collections;
  const selected: NasAssetCollectionV1[] = [];
  for (const selector of selectors) {
    const matches = selector.includes("@")
      ? catalogue.collections.filter((collection) => collectionIdentity(collection) === selector)
      : catalogue.collections.filter((collection) => collection.assetId === selector);
    if (matches.length === 0) throw new Error(`unknown collection selector ${selector}`);
    if (matches.length > 1) throw new Error(`ambiguous collection selector ${selector}; include @version`);
    const match = matches[0] as NasAssetCollectionV1;
    if (selected.includes(match)) throw new Error(`duplicate selected collection ${selector}`);
    selected.push(match);
  }
  return selected;
}

function hashOpenedPayload(
  nasRoot: string,
  allowedPrefix: string,
  row: BoundCollectionSelectionV1["files"][number],
): "verified" | "mismatch" {
  const opened = openContainedRegularFile(nasRoot, row.sharePath, allowedPrefix);
  if (opened.kind !== "ok") return "mismatch";
  try {
    const before = fstatSync(opened.fd);
    if (!before.isFile() || before.size !== row.bytes) return "mismatch";
    const digest = createHash("sha256");
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    let total = 0;
    while (true) {
      const remainingExpected = row.bytes - total;
      const requested = remainingExpected >= buffer.length
        ? buffer.length
        : remainingExpected >= 0
          ? remainingExpected + 1
          : 0;
      if (requested === 0) return "mismatch";
      const count = readSync(opened.fd, buffer, 0, requested, null);
      if (count === 0) break;
      digest.update(buffer.subarray(0, count));
      total += count;
      if (total > row.bytes) return "mismatch";
    }
    const after = fstatSync(opened.fd);
    let currentPathStatus;
    try {
      currentPathStatus = lstatSync(opened.path);
    } catch {
      return "mismatch";
    }
    if (
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.mode !== after.mode ||
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs ||
      before.ctimeMs !== after.ctimeMs ||
      before.nlink !== 1 ||
      after.nlink !== 1 ||
      currentPathStatus.isSymbolicLink() ||
      !currentPathStatus.isFile() ||
      currentPathStatus.nlink !== 1 ||
      currentPathStatus.dev !== after.dev ||
      currentPathStatus.ino !== after.ino ||
      currentPathStatus.mode !== after.mode ||
      currentPathStatus.size !== after.size ||
      currentPathStatus.mtimeMs !== after.mtimeMs ||
      currentPathStatus.ctimeMs !== after.ctimeMs ||
      total !== row.bytes
    ) return "mismatch";
    return digest.digest("hex") === row.sha256 ? "verified" : "mismatch";
  } finally {
    closeSync(opened.fd);
  }
}

export function verifyNasAssets(
  catalogue: NasAssetCatalogV1,
  repoRoot: string,
  environment: Readonly<Record<string, string | undefined>>,
  explicitRoot: string | null,
  selectors: readonly string[],
  full: boolean,
  candidates?: readonly string[],
): VerifyReport {
  const defects = issueSink();
  const limitations = issueSink();
  const selected = selectCollections(catalogue, selectors);
  const verifyOverlays = !full && selectors.length === 0;
  const needsPrivateManifest = selected.some((collection) => collection.ownerManifest?.storage === "nas-private") ||
    (verifyOverlays && catalogue.overlays.some((overlay) => overlay.manifest.storage === "nas-private"));
  let mount: string | null = null;
  let mountState: VerifyReport["mount"] = needsPrivateManifest || full ? "detached" : "not-required";
  if (needsPrivateManifest || full || explicitRoot !== null) {
    try {
      mount = resolveMount(environment, explicitRoot, candidates);
      if (mount !== null) mountState = "attached";
      else if (needsPrivateManifest || full) defects.add("nas-detached-for-requested-verification");
    } catch {
      mountState = "invalid";
      defects.add("wrong-or-invalid-share-marker");
    }
  }

  const cache = new Map<string, BoundOwnerManifestReadV1>();
  const readManifest = (binding: NasOwnerManifestV1): BoundOwnerManifestReadV1 | null => {
    const key = `${binding.storage}\0${binding.path}\0${binding.bytes}\0${binding.sha256}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    if (binding.storage === "nas-private" && mount === null) return null;
    const read = readBoundOwnerManifest({ binding, repoRoot, shareRoot: mount });
    cache.set(key, read);
    return read;
  };

  const collectionResults: CollectionVerifyResult[] = [];
  let fullPayloadTotals: VerifyReport["fullPayloadTotals"] = null;
  for (const collection of selected) {
    const identity = collectionIdentity(collection);
    if (collection.ownerManifest === null) {
      limitations.add("owner-manifest-not-declared");
      collectionResults.push({
        identity,
        state: collection.state,
        manifest: "not-declared",
        aggregate: "not-checked",
        payload: collection.state === "unavailable" ? "catalogued-unavailable" : "not-run",
      });
      continue;
    }
    let read: BoundOwnerManifestReadV1 | null = null;
    try {
      read = readManifest(collection.ownerManifest);
    } catch (error) {
      if (
        error instanceof NasAssetSelectionError &&
        error.code === "owner-manifest-byte-or-digest-mismatch"
      ) {
        defects.add("owner-manifest-byte-or-digest-mismatch");
        collectionResults.push({
          identity,
          state: collection.state,
          manifest: "mismatch",
          aggregate: "not-checked",
          payload: collection.state === "unavailable" ? "catalogued-unavailable" : "not-run",
        });
        continue;
      }
      defects.add("owner-manifest-read-failed");
    }
    if (read === null) {
      defects.add("owner-manifest-unavailable");
      collectionResults.push({
        identity,
        state: collection.state,
        manifest: "unavailable",
        aggregate: "not-checked",
        payload: collection.state === "unavailable" ? "catalogued-unavailable" : "not-run",
      });
      continue;
    }
    let selection: BoundCollectionSelectionV1 | null = null;
    let aggregate: CollectionVerifyResult["aggregate"] = "not-checked";
    if (collection.ownerManifest.selector.kind === "documented-only") {
      aggregate = "unsupported";
      limitations.add("documented-only-selector-has-no-machine-aggregate");
    } else {
      try {
        selection = bindCollectionSelection({
          catalogue,
          collection: identity,
          ownerManifestBytes: read.bytes,
        });
        aggregate = "verified";
      } catch (error) {
        aggregate = "mismatch";
        if (
          error instanceof NasAssetSelectionError &&
          error.code === "collection-aggregate-mismatch"
        ) {
          defects.add("collection-aggregate-mismatch");
        } else {
          defects.add("owner-manifest-selector-invalid");
        }
      }
    }

    let payload: CollectionVerifyResult["payload"] = collection.state === "unavailable"
      ? "catalogued-unavailable"
      : "not-run";
    if (full) {
      if (mount === null || collection.locator === null || selection === null || aggregate !== "verified") {
        payload = "mismatch";
        defects.add("full-verification-precondition-failed");
      } else {
        const singleFileCollection = selection.files.length === 1 && selection.files[0]?.relativePath === "";
        if (!singleFileCollection && resolveContainedDirectory(mount, collection.locator).kind !== "ok") {
          payload = "mismatch";
          defects.add("collection-root-missing-or-unsafe");
          fullPayloadTotals = { files: selection.fileCount, bytes: selection.totalBytes };
          collectionResults.push({ identity, state: collection.state, manifest: "verified", aggregate, payload });
          continue;
        }
        let mismatches = 0;
        for (const row of selection.files) {
          if (hashOpenedPayload(mount, collection.locator, row) !== "verified") mismatches += 1;
        }
        fullPayloadTotals = { files: selection.fileCount, bytes: selection.totalBytes };
        if (mismatches === 0) payload = "verified-full";
        else {
          payload = "mismatch";
          defects.add("payload-byte-or-digest-mismatch", mismatches);
        }
      }
    } else if (collection.state !== "unavailable") {
      limitations.add("payload-bytes-not-read", collection.aggregate.files > 0 ? 1 : 0);
    }
    collectionResults.push({ identity, state: collection.state, manifest: "verified", aggregate, payload });
  }

  const overlayResults: OverlayVerifyResult[] = [];
  if (verifyOverlays) {
    for (const overlay of catalogue.overlays) {
      let read: BoundOwnerManifestReadV1 | null = null;
      try {
        read = readManifest(overlay.manifest);
      } catch (error) {
        if (
          error instanceof NasAssetSelectionError &&
          error.code === "owner-manifest-byte-or-digest-mismatch"
        ) {
          defects.add("overlay-manifest-byte-or-digest-mismatch");
          overlayResults.push({ overlayId: overlay.overlayId, manifest: "mismatch" });
          continue;
        }
        defects.add("overlay-manifest-read-failed");
      }
      if (read === null) {
        defects.add("overlay-manifest-unavailable");
        overlayResults.push({ overlayId: overlay.overlayId, manifest: "unavailable" });
      } else {
        overlayResults.push({ overlayId: overlay.overlayId, manifest: "verified" });
      }
    }
  }

  return {
    format: REPORT_FORMAT,
    command: "verify",
    ok: defects.total() === 0,
    scope: full ? "explicit-single-collection-full-hash" : "owner-manifest-and-selector-aggregates",
    mount: mountState,
    collections: collectionResults,
    overlays: overlayResults,
    defects: defects.list(),
    limitations: limitations.list(),
    fullPayloadTotals,
    limits: full
      ? [
          "Payload hashing was limited to the one explicitly selected collection and its registered selector rows.",
          "No publication, restoration, movement, quarantine, or deletion is available in this command.",
        ]
      : [
          `Owner-manifest reads are capped at ${MAX_OWNER_MANIFEST_BYTES} bytes each.`,
          "A verified owner-manifest digest and aggregate do not prove that any payload byte is currently present or unchanged.",
          "Unavailable state is reported from the catalogue; it is not converted into a storage verification claim.",
          "No publication, restoration, movement, quarantine, or deletion is available in this command.",
        ],
  };
}

export interface NasAssetsCliIo {
  readonly cwd?: string;
  readonly environment?: Readonly<Record<string, string | undefined>>;
  /** Fixture-only mount candidates; omitted in normal CLI use. */
  readonly nasCandidates?: readonly string[];
  readonly write?: (line: string) => void;
}

/** Run one command and emit exactly one machine-readable JSON document. */
export function runNasAssetsCli(argv: readonly string[], io: NasAssetsCliIo = {}): number {
  const write = io.write ?? ((line: string) => console.log(line));
  try {
    const options = parseArguments(argv, io.cwd ?? process.cwd());
    const catalogue = loadCatalog(options.catalogPath);
    const environment = io.environment ?? process.env;
    const report = options.command === "audit"
      ? auditNasAssets(catalogue, environment, options.nasRoot, io.nasCandidates)
      : verifyNasAssets(
          catalogue,
          options.repoRoot,
          environment,
          options.nasRoot,
          options.collectionSelectors,
          options.full,
          io.nasCandidates,
        );
    write(JSON.stringify(report));
    return report.ok ? 0 : 1;
  } catch (error) {
    write(JSON.stringify({
      format: REPORT_FORMAT,
      command: argv[0] ?? null,
      ok: false,
      fatal: error instanceof Error ? error.message : String(error),
      defects: [{ code: "fatal-input-or-catalogue-error", count: 1 }],
    }));
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && resolve(invokedPath) === fileURLToPath(import.meta.url)) {
  process.exitCode = runNasAssetsCli(process.argv.slice(2));
}
