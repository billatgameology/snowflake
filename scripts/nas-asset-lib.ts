// Shared, fail-closed primitives for the NAS asset-governance workstream.
//
// This module deliberately does not detect a live share or move/delete files. It defines the
// portable identities and fixture-testable safety boundary used by those higher-level tools.

import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  lstatSync,
  openSync,
  readSync,
  readdirSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import type { Stats } from "node:fs";
import { basename, dirname, isAbsolute, posix, relative, resolve, sep, win32 } from "node:path";

export const NAS_ASSET_CATALOG_FORMAT = "snowflake-nas-asset-catalog-v1" as const;
export const NAS_TREE_INVENTORY_FORMAT = "snowflake-nas-tree-inventory-v1" as const;
export const NAS_SHARE_MARKER_PATH = ".snowflake-nas.json" as const;
export const NAS_SHARE_MARKER_FORMAT = "snowflake-nas-share-v1" as const;
export const NAS_SHARE_PROJECT_ID = "virtual-cloud-chamber" as const;

export const NAS_STORAGE_CLASSES = [
  "tracked-evidence",
  "external-evidence",
  "private-source",
  "irreplaceable-master",
  "generated-cache",
  "scratch",
] as const;
export type NasStorageClass = (typeof NAS_STORAGE_CLASSES)[number];

export const NAS_RIGHTS_POLICIES = [
  "project-owned",
  "public-third-party",
  "restricted-third-party",
  "private",
  "mixed",
] as const;
export type NasRightsPolicy = (typeof NAS_RIGHTS_POLICIES)[number];

export const NAS_SERVE_POLICIES = ["deny", "generated-public-loopback"] as const;
export type NasServePolicy = (typeof NAS_SERVE_POLICIES)[number];

export const NAS_RETENTION_POLICIES = [
  "permanent",
  "retain-until-superseded",
  "regenerable",
  "temporary",
  "maker-approved-delete-only",
] as const;
export type NasRetentionPolicy = (typeof NAS_RETENTION_POLICIES)[number];

export const NAS_MUTABILITY_POLICIES = ["immutable", "append-only", "working"] as const;
export type NasMutabilityPolicy = (typeof NAS_MUTABILITY_POLICIES)[number];

export const NAS_COLLECTION_STATES = [
  "active",
  "provisional",
  "unavailable",
  "superseded",
  "quarantined",
] as const;
export type NasCollectionState = (typeof NAS_COLLECTION_STATES)[number];

export const NAS_PRIVACY_POLICIES = ["public", "private", "mixed"] as const;
export type NasPrivacyPolicy = (typeof NAS_PRIVACY_POLICIES)[number];

export const NAS_REPRODUCIBILITY_KINDS = [
  "exact-recipe",
  "source-origin",
  "git",
  "none",
  "unknown",
] as const;
export type NasReproducibilityKind = (typeof NAS_REPRODUCIBILITY_KINDS)[number];

export const NAS_VERIFICATION_LEVELS = [
  "full-hash",
  "sampled-size",
  "manifest-only",
  "unavailable",
] as const;
export type NasVerificationLevel = (typeof NAS_VERIFICATION_LEVELS)[number];

export const NAS_BACKUP_STATUSES = ["not-required", "required-missing", "verified"] as const;
export type NasBackupStatus = (typeof NAS_BACKUP_STATUSES)[number];

export const NAS_GC_POLICIES = ["never", "plan-only"] as const;
export type NasGcPolicy = (typeof NAS_GC_POLICIES)[number];

export type NasManifestSelectorV1 =
  | {
      readonly kind: "path-prefixes";
      readonly include: readonly string[];
      readonly exclude: readonly string[];
    }
  | {
      readonly kind: "json-tree-key";
      readonly key: string;
    }
  | {
      readonly kind: "jsonl-field-equals";
      readonly recordType: string;
      readonly field: string;
      readonly equals: string;
    }
  | {
      readonly kind: "all";
    }
  | {
      readonly kind: "documented-only";
      readonly record: string;
    };

export interface NasOwnerManifestV1 {
  readonly storage: "tracked" | "nas-private";
  readonly path: string;
  readonly format: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly selector: NasManifestSelectorV1;
}

export interface NasRestoreProcedureV1 {
  readonly status: "tested" | "documented" | "pending" | "unavailable";
  readonly command: string | null;
  readonly verifyCommand: string | null;
  readonly record: string | null;
}

export interface NasReproducibilityV1 {
  readonly kind: NasReproducibilityKind;
  readonly record: string | null;
}

export interface NasCollectionProvenanceV1 {
  readonly record: string;
  readonly producerCommit: string | null;
  readonly command: string | null;
}

export interface NasRightsV1 {
  readonly kind: NasRightsPolicy;
  readonly redistribution: "allowed" | "restricted" | "unknown";
}

export interface NasExternalAuthorityV1 {
  readonly charterRefs: readonly string[];
  readonly decisionRefs: readonly string[];
  readonly planRefs: readonly string[];
  readonly claimRefs: readonly string[];
}

export interface NasVerificationV1 {
  readonly status: NasVerificationLevel;
  readonly at: string | null;
  readonly host: string | null;
  readonly receipt: string | null;
  readonly limits: readonly string[];
}

export interface NasBackupV1 {
  readonly status: NasBackupStatus;
  readonly independentDomains: readonly string[];
  readonly receipts: readonly string[];
}

export interface NasGarbageCollectionV1 {
  readonly policy: NasGcPolicy;
  readonly graceDays: number | null;
  readonly approver: string;
}

export interface NasCollectionAggregateV1 {
  readonly files: number;
  readonly bytes: number;
}

export interface NasServeV1 {
  readonly policy: NasServePolicy;
  readonly prefixes: readonly string[];
}

export interface NasRetentionV1 {
  readonly policy: NasRetentionPolicy;
  readonly garbageCollection: NasGarbageCollectionV1;
}

export interface NasAssetCollectionV1 {
  readonly assetId: string;
  readonly version: string;
  readonly state: NasCollectionState;
  readonly ownerWorkstream: string;
  readonly locator: string | null;
  readonly historicalRepoPath: string | null;
  readonly legacyAliases: readonly string[];
  readonly storageClass: NasStorageClass | null;
  readonly aggregate: NasCollectionAggregateV1;
  readonly ownerManifest: NasOwnerManifestV1 | null;
  readonly rights: NasRightsV1;
  readonly privacy: NasPrivacyPolicy;
  readonly serve: NasServeV1;
  readonly retention: NasRetentionV1;
  readonly mutability: NasMutabilityPolicy;
  readonly externalEvidenceAuthority: NasExternalAuthorityV1 | null;
  readonly provenance: NasCollectionProvenanceV1;
  readonly reproducibility: NasReproducibilityV1;
  readonly restore: NasRestoreProcedureV1;
  readonly verification: NasVerificationV1;
  readonly storageDomains: readonly string[];
  readonly backup: NasBackupV1;
  readonly supersedes: readonly string[];
  readonly unresolved: readonly string[];
}

export interface NasCatalogOverlayV1 {
  readonly overlayId: string;
  readonly manifest: NasOwnerManifestV1;
  readonly appliesTo: readonly string[];
  readonly relationship: string;
}

export interface NasSystemExclusionV1 {
  readonly path: string;
  readonly reason: string;
}

export interface NasShareMarkerV1 {
  readonly path: string;
  readonly format: string;
  readonly projectId: string;
}

export interface NasAssetCatalogV1 {
  readonly format: typeof NAS_ASSET_CATALOG_FORMAT;
  readonly projectId: string;
  readonly shareMarker: NasShareMarkerV1;
  readonly canonicalEnvironmentVariable: "VCC_NAS_ROOT";
  readonly compatibilityEnvironmentVariable: "GUTCHECK_NAS_ROOT";
  readonly controlRoot: "_control";
  readonly collections: readonly NasAssetCollectionV1[];
  readonly overlays: readonly NasCatalogOverlayV1[];
  readonly systemExclusions: readonly NasSystemExclusionV1[];
}

export class NasAssetValidationError extends Error {
  override readonly name = "NasAssetValidationError";
}

const fail = (message: string): never => {
  throw new NasAssetValidationError(message);
};

/** The comparison key used to detect aliases on case-insensitive NFC filesystems. */
export const portableSharePathCollisionKey = (value: string): string =>
  value.normalize("NFC").toLowerCase();

/**
 * Assert a non-empty, NFC, share-relative POSIX identity representable on Windows and macOS.
 * Host-native mount roots are intentionally outside this contract.
 */
export function assertPortableShareRelativePath(value: string, label = "share-relative path"): void {
  if (
    value.length === 0 ||
    value !== value.normalize("NFC") ||
    value.startsWith("/") ||
    value.endsWith("/") ||
    value.includes("\\") ||
    isAbsolute(value) ||
    win32.isAbsolute(value) ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    fail(`${label} must be a safe NFC share-relative POSIX path`);
  }
  for (const segment of value.split("/")) {
    if (
      segment === "" ||
      segment === "." ||
      segment === ".." ||
      /[<>:"|?*]/u.test(segment) ||
      /[. ]$/u.test(segment) ||
      /^(?:con|prn|aux|nul|clock\$|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(segment)
    ) {
      fail(`${label} contains a non-portable segment: ${JSON.stringify(segment)}`);
    }
  }
}

export const portableShareRelativePathIsSafe = (value: string): boolean => {
  try {
    assertPortableShareRelativePath(value);
    return true;
  } catch {
    return false;
  }
};

type JsonObject = Record<string, unknown>;

function object(value: unknown, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value as JsonObject;
}

function exactKeys(record: JsonObject, keys: readonly string[], label: string): void {
  const actual = Object.keys(record).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    fail(`${label} keys must be exactly ${expected.join(", ")}; got ${actual.join(", ")}`);
  }
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "" || /[\u0000-\u001f\u007f]/u.test(value)) {
    fail(`${label} must be a non-empty control-free string`);
  }
  return value as string;
}

function integer(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    fail(`${label} must be a non-negative safe integer`);
  }
  return value as number;
}

function oneOf<const T extends readonly string[]>(value: unknown, allowed: T, label: string): T[number] {
  if (typeof value !== "string" || !allowed.includes(value)) {
    fail(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T[number];
}

function path(value: unknown, label: string): string {
  const parsed = nonEmptyString(value, label);
  assertPortableShareRelativePath(parsed, label);
  return parsed;
}

function parseStringPaths(value: unknown, label: string, allowEmpty: boolean): readonly string[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    fail(`${label} must be ${allowEmpty ? "an" : "a non-empty"} array`);
  }
  const result = (value as unknown[]).map((entry, index) => path(entry, `${label}[${index}]`));
  const seen = new Set<string>();
  for (const entry of result) {
    const key = portableSharePathCollisionKey(entry);
    if (seen.has(key)) fail(`${label} contains a case/Unicode alias: ${entry}`);
    seen.add(key);
  }
  return result;
}

function parseStrings(value: unknown, label: string, allowEmpty: boolean): readonly string[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    fail(`${label} must be ${allowEmpty ? "an" : "a non-empty"} array`);
  }
  const result = (value as unknown[]).map((entry, index) => nonEmptyString(entry, `${label}[${index}]`));
  const seen = new Set<string>();
  for (const entry of result) {
    if (seen.has(entry)) fail(`${label} contains a duplicate: ${entry}`);
    seen.add(entry);
  }
  return result;
}

function nullableString(value: unknown, label: string): string | null {
  return value === null ? null : nonEmptyString(value, label);
}

function nullablePath(value: unknown, label: string): string | null {
  return value === null ? null : path(value, label);
}

function parseSelector(value: unknown, label: string): NasManifestSelectorV1 {
  const record = object(value, label);
  const kind = nonEmptyString(record.kind, `${label}.kind`);
  if (kind === "all") {
    exactKeys(record, ["kind"], label);
    return { kind };
  }
  if (kind === "path-prefixes") {
    exactKeys(record, ["exclude", "include", "kind"], label);
    return {
      kind,
      include: parseStringPaths(record.include, `${label}.include`, false),
      exclude: parseStringPaths(record.exclude, `${label}.exclude`, true),
    };
  }
  if (kind === "json-tree-key") {
    exactKeys(record, ["key", "kind"], label);
    return { kind, key: path(record.key, `${label}.key`) };
  }
  if (kind === "jsonl-field-equals") {
    exactKeys(record, ["equals", "field", "kind", "recordType"], label);
    return {
      kind,
      recordType: nonEmptyString(record.recordType, `${label}.recordType`),
      field: nonEmptyString(record.field, `${label}.field`),
      equals: nonEmptyString(record.equals, `${label}.equals`),
    };
  }
  if (kind === "documented-only") {
    exactKeys(record, ["kind", "record"], label);
    return { kind, record: path(record.record, `${label}.record`) };
  }
  return fail(`${label}.kind is not recognized`);
}

function parseManifest(value: unknown, label: string): NasOwnerManifestV1 {
  const record = object(value, label);
  exactKeys(record, ["bytes", "format", "path", "selector", "sha256", "storage"], label);
  const sha256 = nonEmptyString(record.sha256, `${label}.sha256`);
  if (!/^[0-9a-f]{64}$/u.test(sha256)) fail(`${label}.sha256 must be lowercase SHA-256 hex`);
  return {
    storage: oneOf(record.storage, ["tracked", "nas-private"] as const, `${label}.storage`),
    path: path(record.path, `${label}.path`),
    format: nonEmptyString(record.format, `${label}.format`),
    bytes: integer(record.bytes, `${label}.bytes`),
    sha256,
    selector: parseSelector(record.selector, `${label}.selector`),
  };
}

function parseRestore(value: unknown, label: string): NasRestoreProcedureV1 {
  const record = object(value, label);
  exactKeys(record, ["command", "record", "status", "verifyCommand"], label);
  return {
    status: oneOf(record.status, ["tested", "documented", "pending", "unavailable"] as const, `${label}.status`),
    command: nullableString(record.command, `${label}.command`),
    verifyCommand: nullableString(record.verifyCommand, `${label}.verifyCommand`),
    record: nullablePath(record.record, `${label}.record`),
  };
}

function parseReproducibility(value: unknown, label: string): NasReproducibilityV1 {
  const record = object(value, label);
  exactKeys(record, ["kind", "record"], label);
  return {
    kind: oneOf(record.kind, NAS_REPRODUCIBILITY_KINDS, `${label}.kind`),
    record: nullablePath(record.record, `${label}.record`),
  };
}

function parseProvenance(value: unknown, label: string): NasCollectionProvenanceV1 {
  const record = object(value, label);
  exactKeys(record, ["command", "producerCommit", "record"], label);
  const producerCommit = nullableString(record.producerCommit, `${label}.producerCommit`);
  if (producerCommit !== null && !/^[0-9a-f]{7,40}$/u.test(producerCommit)) {
    fail(`${label}.producerCommit must be a lowercase Git object abbreviation`);
  }
  return {
    record: path(record.record, `${label}.record`),
    producerCommit,
    command: nullableString(record.command, `${label}.command`),
  };
}

function parseRights(value: unknown, label: string): NasRightsV1 {
  const record = object(value, label);
  exactKeys(record, ["kind", "redistribution"], label);
  return {
    kind: oneOf(record.kind, NAS_RIGHTS_POLICIES, `${label}.kind`),
    redistribution: oneOf(record.redistribution, ["allowed", "restricted", "unknown"] as const, `${label}.redistribution`),
  };
}

function parseAuthority(value: unknown, label: string): NasExternalAuthorityV1 | null {
  if (value === null) return null;
  const record = object(value, label);
  exactKeys(record, ["charterRefs", "claimRefs", "decisionRefs", "planRefs"], label);
  return {
    charterRefs: parseStrings(record.charterRefs, `${label}.charterRefs`, true),
    decisionRefs: parseStringPaths(record.decisionRefs, `${label}.decisionRefs`, true),
    planRefs: parseStringPaths(record.planRefs, `${label}.planRefs`, false),
    claimRefs: parseStringPaths(record.claimRefs, `${label}.claimRefs`, true),
  };
}

function parseVerification(value: unknown, label: string): NasVerificationV1 {
  const record = object(value, label);
  exactKeys(record, ["at", "host", "limits", "receipt", "status"], label);
  const at = nullableString(record.at, `${label}.at`);
  if (at !== null && !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/u.test(at)) {
    fail(`${label}.at must be an ISO date or UTC timestamp`);
  }
  const receipt = record.receipt === null ? null : path(record.receipt, `${label}.receipt`);
  return {
    status: oneOf(record.status, NAS_VERIFICATION_LEVELS, `${label}.status`),
    at,
    host: nullableString(record.host, `${label}.host`),
    receipt,
    limits: parseStrings(record.limits, `${label}.limits`, true),
  };
}

function parseBackup(value: unknown, label: string): NasBackupV1 {
  const record = object(value, label);
  exactKeys(record, ["independentDomains", "receipts", "status"], label);
  return {
    status: oneOf(record.status, NAS_BACKUP_STATUSES, `${label}.status`),
    independentDomains: parseStrings(record.independentDomains, `${label}.independentDomains`, true),
    receipts: parseStringPaths(record.receipts, `${label}.receipts`, true),
  };
}

function parseGarbageCollection(value: unknown, label: string): NasGarbageCollectionV1 {
  const record = object(value, label);
  exactKeys(record, ["approver", "graceDays", "policy"], label);
  const graceDays = record.graceDays === null ? null : integer(record.graceDays, `${label}.graceDays`);
  return {
    policy: oneOf(record.policy, NAS_GC_POLICIES, `${label}.policy`),
    graceDays,
    approver: nonEmptyString(record.approver, `${label}.approver`),
  };
}

const collectionReference = (value: string): boolean =>
  /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*@[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value);

function parseCollectionReferences(value: unknown, label: string): readonly string[] {
  const values = parseStrings(value, label, true);
  for (const reference of values) {
    if (!collectionReference(reference)) fail(`${label} contains an invalid collection reference: ${reference}`);
  }
  return values;
}

function parseAggregate(value: unknown, label: string): NasCollectionAggregateV1 {
  const record = object(value, label);
  exactKeys(record, ["bytes", "files"], label);
  return { files: integer(record.files, `${label}.files`), bytes: integer(record.bytes, `${label}.bytes`) };
}

function parseServe(value: unknown, label: string): NasServeV1 {
  const record = object(value, label);
  exactKeys(record, ["policy", "prefixes"], label);
  return {
    policy: oneOf(record.policy, NAS_SERVE_POLICIES, `${label}.policy`),
    prefixes: parseStringPaths(record.prefixes, `${label}.prefixes`, true),
  };
}

function parseRetention(value: unknown, label: string): NasRetentionV1 {
  const record = object(value, label);
  exactKeys(record, ["garbageCollection", "policy"], label);
  return {
    policy: oneOf(record.policy, NAS_RETENTION_POLICIES, `${label}.policy`),
    garbageCollection: parseGarbageCollection(record.garbageCollection, `${label}.garbageCollection`),
  };
}

function parseCollection(value: unknown, index: number): NasAssetCollectionV1 {
  const label = `catalog.collections[${index}]`;
  const record = object(value, label);
  exactKeys(
    record,
    [
      "assetId",
      "aggregate",
      "backup",
      "externalEvidenceAuthority",
      "historicalRepoPath",
      "legacyAliases",
      "locator",
      "mutability",
      "ownerManifest",
      "ownerWorkstream",
      "privacy",
      "provenance",
      "reproducibility",
      "restore",
      "retention",
      "rights",
      "serve",
      "state",
      "storageDomains",
      "storageClass",
      "supersedes",
      "unresolved",
      "verification",
      "version",
    ],
    label,
  );
  const assetId = nonEmptyString(record.assetId, `${label}.assetId`);
  const version = nonEmptyString(record.version, `${label}.version`);
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(assetId)) {
    fail(`${label}.assetId must be a lowercase kebab-case stable ID`);
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(version)) fail(`${label}.version is not portable`);
  const collection: NasAssetCollectionV1 = {
    assetId,
    version,
    state: oneOf(record.state, NAS_COLLECTION_STATES, `${label}.state`),
    ownerWorkstream: nonEmptyString(record.ownerWorkstream, `${label}.ownerWorkstream`),
    locator: nullablePath(record.locator, `${label}.locator`),
    historicalRepoPath: nullablePath(record.historicalRepoPath, `${label}.historicalRepoPath`),
    legacyAliases: parseStringPaths(record.legacyAliases, `${label}.legacyAliases`, true),
    storageClass: record.storageClass === null ? null : oneOf(record.storageClass, NAS_STORAGE_CLASSES, `${label}.storageClass`),
    aggregate: parseAggregate(record.aggregate, `${label}.aggregate`),
    ownerManifest: record.ownerManifest === null ? null : parseManifest(record.ownerManifest, `${label}.ownerManifest`),
    rights: parseRights(record.rights, `${label}.rights`),
    privacy: oneOf(record.privacy, NAS_PRIVACY_POLICIES, `${label}.privacy`),
    serve: parseServe(record.serve, `${label}.serve`),
    retention: parseRetention(record.retention, `${label}.retention`),
    mutability: oneOf(record.mutability, NAS_MUTABILITY_POLICIES, `${label}.mutability`),
    externalEvidenceAuthority: parseAuthority(record.externalEvidenceAuthority, `${label}.externalEvidenceAuthority`),
    provenance: parseProvenance(record.provenance, `${label}.provenance`),
    reproducibility: parseReproducibility(record.reproducibility, `${label}.reproducibility`),
    restore: parseRestore(record.restore, `${label}.restore`),
    verification: parseVerification(record.verification, `${label}.verification`),
    storageDomains: parseStrings(record.storageDomains, `${label}.storageDomains`, true),
    backup: parseBackup(record.backup, `${label}.backup`),
    supersedes: parseCollectionReferences(record.supersedes, `${label}.supersedes`),
    unresolved: parseStrings(record.unresolved, `${label}.unresolved`, true),
  };

  if (collection.state === "active") {
    if (collection.locator === null || collection.storageClass === null || collection.ownerManifest === null) {
      fail(`${label} active collections require a locator, storage class, and owner manifest`);
    }
    if (collection.unresolved.length !== 0) fail(`${label} active collections cannot have unresolved items`);
    const activeManifest = collection.ownerManifest;
    if (activeManifest === null) fail(`${label} active collection owner manifest vanished`);
    if (activeManifest?.selector.kind === "documented-only") {
      fail(`${label} active collections require a machine-readable owner selector`);
    }
    if (collection.verification.status === "unavailable") fail(`${label} active collections require verification evidence`);
    if (collection.storageDomains.length === 0) fail(`${label} active collections require a storage domain`);
    if (["pending", "unavailable"].includes(collection.restore.status) || collection.restore.verifyCommand === null) {
      fail(`${label} active collections require a documented restore and executable verifier`);
    }
  }
  if (collection.state === "provisional" && (collection.locator === null || collection.unresolved.length === 0)) {
    fail(`${label} provisional collections require a locator and unresolved item`);
  }
  if (collection.state === "unavailable" && (collection.locator !== null || collection.historicalRepoPath === null || collection.unresolved.length === 0)) {
    fail(`${label} unavailable collections require no locator, a historical path, and an unresolved item`);
  }
  const ownershipRoot = collection.locator ?? collection.historicalRepoPath;
  if (
    ownershipRoot !== null &&
    collection.ownerManifest?.selector.kind === "path-prefixes" &&
    collection.ownerManifest.selector.include.some(
      (include) => include !== ownershipRoot && !include.startsWith(`${ownershipRoot}/`),
    )
  ) {
    fail(`${label} manifest selector includes bytes outside its locator`);
  }
  if (
    ownershipRoot !== null &&
    collection.ownerManifest?.selector.kind === "json-tree-key" &&
    collection.ownerManifest.selector.key !== ownershipRoot &&
    !collection.ownerManifest.selector.key.startsWith(`${ownershipRoot}/`)
  ) {
    fail(`${label} tree selector is outside its locator`);
  }
  if (collection.storageClass === "external-evidence") {
    const authority = collection.externalEvidenceAuthority;
    if (
      authority === null ||
      authority.planRefs.length === 0 ||
      authority.claimRefs.length === 0 ||
      (authority.charterRefs.length === 0 && authority.decisionRefs.length === 0)
    ) {
      fail(`${label} external evidence requires plan plus charter/decision authority`);
    }
    if (
      collection.state === "active" &&
      (collection.mutability !== "immutable" ||
        collection.verification.status !== "full-hash" ||
        collection.verification.at === null ||
        collection.verification.host === null ||
        collection.verification.receipt === null ||
        collection.reproducibility.record === null ||
        collection.restore.command === null ||
        collection.restore.verifyCommand === null ||
        collection.backup.status === "not-required")
    ) {
      fail(`${label} active external evidence requires immutable, hash-verified, restorable bindings and backup policy`);
    }
  } else if (collection.externalEvidenceAuthority !== null) {
    fail(`${label} non-external-evidence collection cannot claim external evidence authority`);
  }
  if (collection.serve.policy === "deny") {
    if (collection.serve.prefixes.length !== 0) fail(`${label} denied collections cannot have serve prefixes`);
  } else {
    if (
      collection.state !== "active" ||
      collection.storageClass !== "generated-cache" ||
      collection.rights.kind !== "project-owned" ||
      collection.rights.redistribution !== "allowed" ||
      collection.privacy !== "public" ||
      collection.locator === null ||
      collection.serve.prefixes.length === 0
    ) {
      fail(`${label} serving requires active public project-owned generated cache`);
    }
    for (const prefix of collection.serve.prefixes) {
      if (prefix !== collection.locator && !prefix.startsWith(`${collection.locator}/`)) {
        fail(`${label}.serve prefix ${prefix} is outside its locator`);
      }
      const selector = collection.ownerManifest?.selector;
      if (
        selector?.kind !== "path-prefixes" ||
        !selector.include.some((include) => pathPrefixContains(include, prefix)) ||
        selector.exclude.some((exclude) => pathPrefixesOverlap(exclude, prefix))
      ) {
        fail(`${label}.serve prefix ${prefix} is not wholly owned by its manifest selector`);
      }
    }
  }
  if (collection.backup.status === "verified" && (collection.backup.independentDomains.length === 0 || collection.backup.receipts.length === 0)) {
    fail(`${label} verified backup requires an independent domain and receipt`);
  }
  if (collection.backup.status !== "verified" && collection.backup.receipts.length !== 0) {
    fail(`${label} unverified backup cannot cite backup receipts`);
  }
  if (
    collection.storageClass === "irreplaceable-master" &&
    collection.backup.status === "not-required"
  ) {
    fail(`${label} irreplaceable masters require an independent backup`);
  }
  if (
    ["tracked-evidence", "external-evidence", "irreplaceable-master"].includes(collection.storageClass ?? "") &&
    collection.retention.garbageCollection.policy !== "never"
  ) {
    fail(`${label} durable evidence and masters cannot be garbage-collected`);
  }
  return collection;
}

function parseOverlay(value: unknown, index: number): NasCatalogOverlayV1 {
  const label = `catalog.overlays[${index}]`;
  const record = object(value, label);
  exactKeys(record, ["appliesTo", "manifest", "overlayId", "relationship"], label);
  const overlayId = nonEmptyString(record.overlayId, `${label}.overlayId`);
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(overlayId)) fail(`${label}.overlayId must be kebab-case`);
  return {
    overlayId,
    manifest: parseManifest(record.manifest, `${label}.manifest`),
    appliesTo: parseCollectionReferences(record.appliesTo, `${label}.appliesTo`),
    relationship: nonEmptyString(record.relationship, `${label}.relationship`),
  };
}

function parseSystemExclusion(value: unknown, index: number): NasSystemExclusionV1 {
  const label = `catalog.systemExclusions[${index}]`;
  const record = object(value, label);
  exactKeys(record, ["path", "reason"], label);
  return { path: path(record.path, `${label}.path`), reason: nonEmptyString(record.reason, `${label}.reason`) };
}

function pathPrefixContains(parent: string, child: string): boolean {
  const parentKey = portableSharePathCollisionKey(parent);
  const childKey = portableSharePathCollisionKey(child);
  return childKey === parentKey || childKey.startsWith(`${parentKey}/`);
}

function pathPrefixesOverlap(left: string, right: string): boolean {
  return pathPrefixContains(left, right) || pathPrefixContains(right, left);
}

function selectorsProveDisjoint(left: NasOwnerManifestV1 | null, right: NasOwnerManifestV1 | null): boolean {
  if (left === null || right === null) return false;
  const a = left.selector;
  const b = right.selector;
  if (a.kind === "jsonl-field-equals" && b.kind === "jsonl-field-equals") {
    return left.path === right.path && left.sha256 === right.sha256 &&
      a.recordType === b.recordType && a.field === b.field && a.equals !== b.equals;
  }
  if (a.kind !== "path-prefixes" || b.kind !== "path-prefixes") return false;
  for (const aRoot of a.include) {
    for (const bRoot of b.include) {
      if (!pathPrefixesOverlap(aRoot, bRoot)) continue;
      const intersection = pathPrefixContains(aRoot, bRoot) ? bRoot : aRoot;
      const excluded = [...a.exclude, ...b.exclude].some((prefix) => pathPrefixContains(prefix, intersection));
      if (!excluded) return false;
    }
  }
  return true;
}

function pathSelectorMaySelectUnder(
  selector: Extract<NasManifestSelectorV1, { readonly kind: "path-prefixes" }>,
  root: string,
): boolean {
  for (const include of selector.include) {
    if (!pathPrefixesOverlap(include, root)) continue;
    const intersection = pathPrefixContains(include, root) ? root : include;
    if (!selector.exclude.some((exclude) => pathPrefixContains(exclude, intersection))) return true;
  }
  return false;
}

function collectionsProveDisjoint(left: NasAssetCollectionV1, right: NasAssetCollectionV1): boolean {
  if (selectorsProveDisjoint(left.ownerManifest, right.ownerManifest)) return true;
  const leftSelector = left.ownerManifest?.selector;
  if (leftSelector?.kind === "path-prefixes" && right.locator !== null && !pathSelectorMaySelectUnder(leftSelector, right.locator)) {
    return true;
  }
  const rightSelector = right.ownerManifest?.selector;
  return rightSelector?.kind === "path-prefixes" && left.locator !== null && !pathSelectorMaySelectUnder(rightSelector, left.locator);
}

/** Strictly validate and copy the federated v1 catalogue; unknown fields fail closed. */
export function validateNasAssetCatalogV1(value: unknown): NasAssetCatalogV1 {
  const record = object(value, "catalog");
  exactKeys(record, [
    "canonicalEnvironmentVariable",
    "collections",
    "compatibilityEnvironmentVariable",
    "controlRoot",
    "format",
    "overlays",
    "projectId",
    "shareMarker",
    "systemExclusions",
  ], "catalog");
  if (record.format !== NAS_ASSET_CATALOG_FORMAT) fail(`catalog.format must be ${NAS_ASSET_CATALOG_FORMAT}`);
  const projectId = nonEmptyString(record.projectId, "catalog.projectId");
  if (projectId !== NAS_SHARE_PROJECT_ID) fail(`catalog.projectId must be ${NAS_SHARE_PROJECT_ID}`);
  const markerRecord = object(record.shareMarker, "catalog.shareMarker");
  exactKeys(markerRecord, ["format", "path", "projectId"], "catalog.shareMarker");
  const shareMarker: NasShareMarkerV1 = {
    path: path(markerRecord.path, "catalog.shareMarker.path"),
    format: nonEmptyString(markerRecord.format, "catalog.shareMarker.format"),
    projectId: nonEmptyString(markerRecord.projectId, "catalog.shareMarker.projectId"),
  };
  if (shareMarker.projectId !== projectId) fail("catalog.shareMarker.projectId must match catalog.projectId");
  if (shareMarker.path !== NAS_SHARE_MARKER_PATH) {
    fail(`catalog.shareMarker.path must be ${NAS_SHARE_MARKER_PATH}`);
  }
  if (shareMarker.format !== NAS_SHARE_MARKER_FORMAT) {
    fail(`catalog.shareMarker.format must be ${NAS_SHARE_MARKER_FORMAT}`);
  }
  if (record.canonicalEnvironmentVariable !== "VCC_NAS_ROOT") fail("catalog canonical environment must be VCC_NAS_ROOT");
  if (record.compatibilityEnvironmentVariable !== "GUTCHECK_NAS_ROOT") fail("catalog compatibility environment must be GUTCHECK_NAS_ROOT");
  if (record.controlRoot !== "_control") fail("catalog.controlRoot must be _control");
  if (!Array.isArray(record.collections)) fail("catalog.collections must be an array");
  const collections = (record.collections as unknown[]).map(parseCollection);
  if (!Array.isArray(record.overlays)) fail("catalog.overlays must be an array");
  const overlays = (record.overlays as unknown[]).map(parseOverlay);
  if (!Array.isArray(record.systemExclusions)) fail("catalog.systemExclusions must be an array");
  const systemExclusions = (record.systemExclusions as unknown[]).map(parseSystemExclusion);
  const exclusionKeys = new Set<string>();
  for (const exclusion of systemExclusions) {
    const key = portableSharePathCollisionKey(exclusion.path);
    if (exclusionKeys.has(key)) fail(`duplicate system exclusion ${exclusion.path}`);
    exclusionKeys.add(key);
  }
  const reservedPaths = ["_control", shareMarker.path, ...systemExclusions.map((entry) => entry.path)];
  const assertOutsideReserved = (candidate: string, label: string): void => {
    const conflict = reservedPaths.find((reserved) => pathPrefixesOverlap(reserved, candidate));
    if (conflict !== undefined) fail(`${label} overlaps reserved NAS namespace ${conflict}`);
  };
  const identities = new Set<string>();
  const ownedLocators: Array<{
    readonly path: string;
    readonly collection: NasAssetCollectionV1;
    readonly identity: string;
    readonly kind: "canonical" | "alias";
  }> = [];
  const servePrefixes: Array<{ readonly prefix: string; readonly owner: string }> = [];
  for (const collection of collections) {
    const identity = `${collection.assetId}@${collection.version}`;
    if (identities.has(identity)) fail(`duplicate collection identity ${identity}`);
    identities.add(identity);
    if (collection.locator !== null) {
      assertOutsideReserved(collection.locator, `collection locator ${collection.locator} for ${identity}`);
      for (const owner of ownedLocators) {
        if (!pathPrefixesOverlap(collection.locator, owner.path)) continue;
        if (
          owner.kind === "alias" ||
          (!collectionsProveDisjoint(collection, owner.collection) &&
            !(
              collection.serve.policy === "deny" &&
              owner.collection.serve.policy === "deny" &&
              (collection.state === "provisional" || owner.collection.state === "provisional")
            ))
        ) {
          fail(`collection locator ${collection.locator} for ${identity} overlaps non-disjoint ${owner.path} for ${owner.identity}`);
        }
      }
      ownedLocators.push({ path: collection.locator, collection, identity, kind: "canonical" });
    }
    for (const alias of collection.legacyAliases) {
      assertOutsideReserved(alias, `legacy alias ${alias} for ${identity}`);
      const conflict = ownedLocators.find((owner) => pathPrefixesOverlap(alias, owner.path));
      if (conflict !== undefined) {
        fail(`legacy alias ${alias} for ${identity} overlaps ${conflict.path} for ${conflict.identity}`);
      }
      ownedLocators.push({ path: alias, collection, identity, kind: "alias" });
    }
    for (const prefix of collection.serve.prefixes) {
      assertOutsideReserved(prefix, `serve prefix ${prefix} for ${identity}`);
      const conflict = servePrefixes.find((candidate) =>
        pathPrefixesOverlap(prefix, candidate.prefix));
      if (conflict !== undefined) {
        fail(`serve prefix ${prefix} for ${identity} overlaps ${conflict.prefix} for ${conflict.owner}`);
      }
      servePrefixes.push({ prefix, owner: identity });
    }
  }
  for (const collection of collections) {
    for (const reference of collection.supersedes) {
      if (!identities.has(reference)) fail(`${collection.assetId}@${collection.version} supersedes unknown ${reference}`);
    }
  }
  const overlayIds = new Set<string>();
  for (const overlay of overlays) {
    if (overlayIds.has(overlay.overlayId)) fail(`duplicate overlay identity ${overlay.overlayId}`);
    overlayIds.add(overlay.overlayId);
    for (const reference of overlay.appliesTo) {
      if (!identities.has(reference)) fail(`overlay ${overlay.overlayId} references unknown ${reference}`);
    }
  }
  return {
    format: NAS_ASSET_CATALOG_FORMAT,
    projectId,
    shareMarker,
    canonicalEnvironmentVariable: "VCC_NAS_ROOT",
    compatibilityEnvironmentVariable: "GUTCHECK_NAS_ROOT",
    controlRoot: "_control",
    collections,
    overlays,
    systemExclusions,
  };
}

export function parseNasAssetCatalogV1(source: string): NasAssetCatalogV1 {
  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch (error) {
    fail(`catalog is not JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  return validateNasAssetCatalogV1(value);
}

export type NasRootEnvironmentResolution =
  | { readonly kind: "unset" }
  | {
      readonly kind: "configured";
      readonly root: string;
      readonly source: "canonical" | "legacy" | "canonical-and-legacy";
    };

function normalizeEnvironmentRoot(value: string, platform: NodeJS.Platform): string {
  if (/^[\s]*$/u.test(value) || /[\u0000-\u001f\u007f]/u.test(value)) {
    fail("NAS root environment value must be a non-empty control-free absolute path");
  }
  const pathApi = platform === "win32" ? win32 : posix;
  if (!pathApi.isAbsolute(value)) fail(`NAS root environment value must be absolute: ${value}`);
  const normalized = pathApi.normalize(value).replace(/\\/gu, "/").replace(/\/*$/u, "/");
  return platform === "win32" ? normalized.toLowerCase() : normalized;
}

/** Resolve canonical VCC_NAS_ROOT plus its temporary compatibility alias, failing on conflict. */
export function resolveNasRootEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
  platform: NodeJS.Platform = process.platform,
): NasRootEnvironmentResolution {
  const canonicalRaw = environment.VCC_NAS_ROOT;
  const legacyRaw = environment.GUTCHECK_NAS_ROOT;
  const canonical = canonicalRaw === undefined || canonicalRaw === "" ? undefined : normalizeEnvironmentRoot(canonicalRaw, platform);
  const legacy = legacyRaw === undefined || legacyRaw === "" ? undefined : normalizeEnvironmentRoot(legacyRaw, platform);
  if (canonical !== undefined && legacy !== undefined && canonical !== legacy) {
    fail(`VCC_NAS_ROOT conflicts with legacy GUTCHECK_NAS_ROOT`);
  }
  if (canonical !== undefined) {
    return { kind: "configured", root: canonical, source: legacy === undefined ? "canonical" : "canonical-and-legacy" };
  }
  if (legacy !== undefined) return { kind: "configured", root: legacy, source: "legacy" };
  return { kind: "unset" };
}

export type NasCatalogServeDecision =
  | {
      readonly kind: "allow";
      readonly collection: NasAssetCollectionV1;
      readonly matchedPrefix: string;
      readonly pathWithinPrefix: string;
    }
  | {
      readonly kind: "deny";
      readonly reason: "unsafe-path" | "unclassified" | "collection-denied";
      readonly collection?: NasAssetCollectionV1;
    };

/** Authorize only an explicitly catalogued prefix, preserving exact case and NFC spelling. */
export function decideNasCatalogServePath(
  catalogue: NasAssetCatalogV1,
  requestedPath: string,
): NasCatalogServeDecision {
  try {
    assertPortableShareRelativePath(requestedPath, "requested NAS path");
  } catch {
    return { kind: "deny", reason: "unsafe-path" };
  }
  for (const collection of catalogue.collections) {
    for (const prefix of collection.serve.prefixes) {
      if (requestedPath !== prefix && !requestedPath.startsWith(`${prefix}/`)) continue;
      return {
        kind: "allow",
        collection,
        matchedPrefix: prefix,
        pathWithinPrefix: requestedPath === prefix ? "" : requestedPath.slice(prefix.length + 1),
      };
    }
  }
  const containing = catalogue.collections
    .flatMap((collection) => [collection.locator, ...collection.legacyAliases]
      .filter((candidate): candidate is string => candidate !== null)
      .filter((candidate) => requestedPath === candidate || requestedPath.startsWith(`${candidate}/`))
      .map((candidate) => ({ collection, length: candidate.length })))
    .sort((left, right) => right.length - left.length)[0];
  if (containing !== undefined) {
    return { kind: "deny", reason: "collection-denied", collection: containing.collection };
  }
  return { kind: "deny", reason: "unclassified" };
}

export type DecodedNasRequestPath =
  | { readonly kind: "ok"; readonly path: string }
  | { readonly kind: "deny"; readonly reason: "malformed-encoding" | "unsafe-path" };

/** Decode one middleware URL exactly once and require one leading route separator. */
export function decodeNasRequestPath(rawUrl: string): DecodedNasRequestPath {
  const encodedPath = rawUrl.split("?", 1)[0] ?? "";
  let decoded: string;
  try {
    decoded = decodeURIComponent(encodedPath);
  } catch {
    return { kind: "deny", reason: "malformed-encoding" };
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return { kind: "deny", reason: "unsafe-path" };
  }
  const relativePath = decoded.slice(1);
  try {
    assertPortableShareRelativePath(relativePath, "requested NAS path");
  } catch {
    return { kind: "deny", reason: "unsafe-path" };
  }
  return { kind: "ok", path: relativePath };
}

export type ContainedRegularFileResolution =
  | { readonly kind: "ok"; readonly path: string; readonly byteLength: number; readonly dev: number; readonly ino: number }
  | { readonly kind: "forbidden"; readonly reason: string }
  | { readonly kind: "not-found"; readonly reason: string };

export type OpenedContainedRegularFileResolution =
  | { readonly kind: "ok"; readonly path: string; readonly byteLength: number; readonly dev: number; readonly ino: number; readonly fd: number }
  | { readonly kind: "forbidden"; readonly reason: string }
  | { readonly kind: "not-found"; readonly reason: string };

export type ContainedDirectoryResolution =
  | { readonly kind: "ok"; readonly path: string; readonly dev: number; readonly ino: number }
  | { readonly kind: "forbidden"; readonly reason: string }
  | { readonly kind: "not-found"; readonly reason: string };

function nativePathIsWithin(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel));
}

/** Resolve one ordinary directory beneath an authorized prefix without following links. */
export function resolveContainedDirectory(
  root: string,
  relativePath: string,
  allowedPrefix: string = relativePath,
): ContainedDirectoryResolution {
  try {
    assertPortableShareRelativePath(relativePath);
    assertPortableShareRelativePath(allowedPrefix, "allowed NAS prefix");
  } catch (error) {
    return { kind: "forbidden", reason: error instanceof Error ? error.message : "unsafe path" };
  }
  if (relativePath !== allowedPrefix && !relativePath.startsWith(`${allowedPrefix}/`)) {
    return { kind: "forbidden", reason: "path is outside the authorized collection prefix" };
  }
  const lexicalRoot = resolve(root);
  const lexicalTarget = resolve(lexicalRoot, relativePath);
  const lexicalAllowed = resolve(lexicalRoot, allowedPrefix);
  if (!nativePathIsWithin(lexicalRoot, lexicalTarget) || !nativePathIsWithin(lexicalAllowed, lexicalTarget)) {
    return { kind: "forbidden", reason: "lexical path escapes the root" };
  }
  let realRoot: string;
  try {
    realRoot = realpathSync.native(lexicalRoot);
    const status = lstatSync(realRoot);
    if (!status.isDirectory() || status.isSymbolicLink()) {
      return { kind: "forbidden", reason: "resolved root is not an ordinary directory" };
    }
  } catch {
    return { kind: "not-found", reason: "root does not resolve" };
  }
  let current = realRoot;
  try {
    for (const part of relativePath.split("/")) {
      current = resolve(current, part);
      const status = lstatSync(current);
      if (status.isSymbolicLink()) return { kind: "forbidden", reason: "symbolic links are forbidden" };
      if (!status.isDirectory()) return { kind: "not-found", reason: "path is not an ordinary directory" };
    }
    const realAllowed = resolve(realRoot, allowedPrefix);
    const currentReal = realpathSync.native(current);
    if (currentReal !== current || !nativePathIsWithin(realAllowed, currentReal)) {
      return { kind: "forbidden", reason: "directory escapes the authorized prefix" };
    }
    const final = lstatSync(currentReal);
    if (!final.isDirectory() || final.isSymbolicLink()) {
      return { kind: "forbidden", reason: "directory changed while resolving" };
    }
    return { kind: "ok", path: currentReal, dev: final.dev, ino: final.ino };
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ELOOP"
      ? { kind: "forbidden", reason: "symbolic-link loop" }
      : { kind: "not-found", reason: "directory does not resolve" };
  }
}

/**
 * Open an ordinary file beneath one authorized catalogue prefix. Every share-relative path
 * component is lstat-checked; even an in-share symlink into another collection is refused.
 */
export function openContainedRegularFile(
  root: string,
  relativePath: string,
  allowedPrefix: string = relativePath,
): OpenedContainedRegularFileResolution {
  try {
    assertPortableShareRelativePath(relativePath);
    assertPortableShareRelativePath(allowedPrefix, "allowed NAS prefix");
  } catch (error) {
    return { kind: "forbidden", reason: error instanceof Error ? error.message : "unsafe path" };
  }
  if (relativePath !== allowedPrefix && !relativePath.startsWith(`${allowedPrefix}/`)) {
    return { kind: "forbidden", reason: "path is outside the authorized collection prefix" };
  }
  const lexicalRoot = resolve(root);
  const lexicalTarget = resolve(lexicalRoot, relativePath);
  const lexicalAllowed = resolve(lexicalRoot, allowedPrefix);
  if (!nativePathIsWithin(lexicalRoot, lexicalTarget) || !nativePathIsWithin(lexicalAllowed, lexicalTarget)) {
    return { kind: "forbidden", reason: "lexical path escapes the root" };
  }
  let realRoot: string;
  try {
    realRoot = realpathSync.native(lexicalRoot);
  } catch {
    return { kind: "not-found", reason: "root does not resolve" };
  }
  try {
    const rootStatus = lstatSync(realRoot);
    if (!rootStatus.isDirectory() || rootStatus.isSymbolicLink()) {
      return { kind: "forbidden", reason: "resolved root is not an ordinary directory" };
    }
  } catch {
    return { kind: "not-found", reason: "root cannot be stated" };
  }

  let current = realRoot;
  const parts = relativePath.split("/");
  try {
    for (let index = 0; index < parts.length; index += 1) {
      current = resolve(current, parts[index] as string);
      const status = lstatSync(current);
      if (status.isSymbolicLink()) return { kind: "forbidden", reason: "symbolic links are forbidden in served paths" };
      if (index < parts.length - 1 && !status.isDirectory()) {
        return { kind: "not-found", reason: "intermediate path is not a directory" };
      }
      if (index === parts.length - 1) {
        if (!status.isFile()) return { kind: "not-found", reason: "target is not an ordinary file" };
        if (status.nlink !== 1) return { kind: "forbidden", reason: "hard-linked files are forbidden" };
      }
    }
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return code === "ELOOP"
      ? { kind: "forbidden", reason: "symbolic-link loop" }
      : { kind: "not-found", reason: "path does not resolve" };
  }

  const realAllowed = resolve(realRoot, allowedPrefix);
  if (!nativePathIsWithin(realAllowed, current)) {
    return { kind: "forbidden", reason: "target escapes the authorized prefix" };
  }

  let fd: number;
  try {
    fd = openSync(current, constants.O_RDONLY | (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0));
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ELOOP"
      ? { kind: "forbidden", reason: "final target became a symbolic link" }
      : { kind: "not-found", reason: "target cannot be opened" };
  }
  try {
    const opened = fstatSync(fd);
    const currentStatus = lstatSync(current);
    const currentReal = realpathSync.native(current);
    if (
      !opened.isFile() ||
      currentStatus.isSymbolicLink() ||
      opened.nlink !== 1 ||
      currentStatus.nlink !== 1 ||
      opened.dev !== currentStatus.dev ||
      opened.ino !== currentStatus.ino ||
      currentReal !== current ||
      !nativePathIsWithin(realAllowed, currentReal)
    ) {
      closeSync(fd);
      return { kind: "forbidden", reason: "target changed while opening" };
    }
    return {
      kind: "ok",
      path: currentReal,
      byteLength: opened.size,
      dev: opened.dev,
      ino: opened.ino,
      fd,
    };
  } catch {
    closeSync(fd);
    return { kind: "not-found", reason: "opened target cannot be verified" };
  }
}

/** Resolve an ordinary file while still closing the descriptor before return. */
export function resolveContainedRegularFile(
  root: string,
  relativePath: string,
  allowedPrefix: string = relativePath,
): ContainedRegularFileResolution {
  const opened = openContainedRegularFile(root, relativePath, allowedPrefix);
  if (opened.kind !== "ok") return opened;
  closeSync(opened.fd);
  return {
    kind: "ok",
    path: opened.path,
    byteLength: opened.byteLength,
    dev: opened.dev,
    ino: opened.ino,
  };
}

export interface StableFileHash {
  readonly byteLength: number;
  readonly sha256: string;
}

export interface StableHashOptions {
  readonly chunkBytes?: number;
  /** Progress hook for cancellation/reporting; source mutations made by it are still detected. */
  readonly onChunk?: (bytesRead: number) => void;
}

function statIdentity(status: Stats): string {
  return [status.dev, status.ino, status.mode, status.size, status.mtimeMs, status.ctimeMs].join(":");
}

const comparePortableNames = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

/** Hash one ordinary file and refuse replacement or metadata mutation across the read. */
export function hashStableRegularFile(filePath: string, options: StableHashOptions = {}): StableFileHash {
  const initialPathStatus = lstatSync(filePath);
  if (!initialPathStatus.isFile() || initialPathStatus.isSymbolicLink()) fail(`source is not an ordinary file: ${filePath}`);
  if (initialPathStatus.nlink !== 1) fail(`source is hard-linked: ${filePath}`);
  const chunkBytes = options.chunkBytes ?? 1024 * 1024;
  if (!Number.isSafeInteger(chunkBytes) || chunkBytes <= 0 || chunkBytes > 64 * 1024 * 1024) {
    fail("chunkBytes must be an integer between 1 and 67108864");
  }
  const fd = openSync(
    filePath,
    constants.O_RDONLY | (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
  );
  try {
    const before = fstatSync(fd);
    if (
      !before.isFile() ||
      before.nlink !== 1 ||
      before.dev !== initialPathStatus.dev ||
      before.ino !== initialPathStatus.ino
    ) {
      fail(`source changed before hashing: ${filePath}`);
    }
    const digest = createHash("sha256");
    const buffer = Buffer.allocUnsafe(chunkBytes);
    let byteLength = 0;
    while (true) {
      const count = readSync(fd, buffer, 0, buffer.length, null);
      if (count === 0) break;
      digest.update(buffer.subarray(0, count));
      byteLength += count;
      options.onChunk?.(byteLength);
    }
    const after = fstatSync(fd);
    const finalPathStatus = (() => {
      try {
        return lstatSync(filePath);
      } catch {
        return fail(`source disappeared while hashing: ${filePath}`);
      }
    })();
    if (
      statIdentity(before) !== statIdentity(after) ||
      statIdentity(initialPathStatus) !== statIdentity(finalPathStatus) ||
      after.nlink !== 1 ||
      finalPathStatus.nlink !== 1 ||
      after.dev !== finalPathStatus.dev ||
      after.ino !== finalPathStatus.ino ||
      byteLength !== after.size
    ) {
      fail(`source mutated while hashing: ${filePath}`);
    }
    return { byteLength, sha256: digest.digest("hex") };
  } finally {
    closeSync(fd);
  }
}

export interface NasTreeFileV1 {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface NasTreeInventoryV1 {
  readonly format: typeof NAS_TREE_INVENTORY_FORMAT;
  readonly fileCount: number;
  readonly totalBytes: number;
  readonly treeSha256: string;
  readonly files: readonly NasTreeFileV1[];
}

export interface StableTreeInventoryOptions {
  /** Test/progress hook; any mutation it performs must be caught by the verification pass. */
  readonly afterFirstPassFile?: (relativePath: string, filesHashed: number) => void;
  /** Test/fault hook at the late boundary; production callers leave this unset. */
  readonly beforeFinalShapePass?: () => void;
}

/** Deterministically inventory and then fully re-verify an ordinary-file tree. */
export function inventoryStableTree(
  root: string,
  options: StableTreeInventoryOptions = {},
): NasTreeInventoryV1 {
  const rootStatus = lstatSync(root);
  if (!rootStatus.isDirectory() || rootStatus.isSymbolicLink()) fail(`inventory root is not an ordinary directory: ${root}`);
  const files: NasTreeFileV1[] = [];
  const portableNames = new Set<string>();
  const walk = (directory: string, prefix: string): void => {
    const before = lstatSync(directory);
    if (!before.isDirectory() || before.isSymbolicLink()) fail(`inventory encountered a non-directory: ${directory}`);
    const entries = readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
      comparePortableNames(left.name, right.name),
    );
    for (const entry of entries) {
      const relativeEntry = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      assertPortableShareRelativePath(relativeEntry, "inventory path");
      const key = portableSharePathCollisionKey(relativeEntry);
      if (portableNames.has(key)) fail(`inventory contains a case/Unicode path collision: ${relativeEntry}`);
      portableNames.add(key);
      const absoluteEntry = resolve(directory, entry.name);
      const status = lstatSync(absoluteEntry);
      if (status.isSymbolicLink()) fail(`inventory refuses symbolic links: ${relativeEntry}`);
      if (status.isDirectory()) {
        walk(absoluteEntry, relativeEntry);
      } else if (status.isFile()) {
        const hashed = hashStableRegularFile(absoluteEntry);
        files.push({ path: relativeEntry, ...hashed });
        options.afterFirstPassFile?.(relativeEntry, files.length);
      } else {
        fail(`inventory refuses special files: ${relativeEntry}`);
      }
    }
    const finalNames = readdirSync(directory).sort(comparePortableNames);
    const after = lstatSync(directory);
    if (
      statIdentity(before) !== statIdentity(after) ||
      finalNames.length !== entries.length ||
      finalNames.some((name, index) => name !== entries[index]?.name)
    ) {
      fail(`directory mutated while inventorying: ${directory}`);
    }
  };
  walk(resolve(root), "");
  files.sort((left, right) => comparePortableNames(left.path, right.path));
  const verifiedIdentities = new Map<string, string>();
  for (const file of files) {
    const absolute = resolve(root, file.path);
    const verified = hashStableRegularFile(absolute);
    if (verified.byteLength !== file.byteLength || verified.sha256 !== file.sha256) {
      fail(`tree file mutated between inventory passes: ${file.path}`);
    }
    verifiedIdentities.set(file.path, statIdentity(lstatSync(absolute)));
  }
  for (const file of files) {
    const absolute = resolve(root, file.path);
    let status: Stats;
    try {
      status = lstatSync(absolute);
    } catch {
      return fail(`tree file disappeared after verification: ${file.path}`);
    }
    if (!status.isFile() || status.isSymbolicLink() || status.nlink !== 1) {
      fail(`tree file type changed after verification: ${file.path}`);
    }
    const finalIdentity = statIdentity(status);
    if (finalIdentity !== verifiedIdentities.get(file.path)) {
      fail(`tree file mutated after verification: ${file.path}`);
    }
  }
  options.beforeFinalShapePass?.();
  const finalPortableNames = new Set<string>();
  const finalFilePaths: string[] = [];
  const verifyFinalShape = (directory: string, prefix: string): void => {
    const before = lstatSync(directory);
    if (!before.isDirectory() || before.isSymbolicLink()) {
      fail(`tree directory changed before final shape verification: ${directory}`);
    }
    const entries = readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
      comparePortableNames(left.name, right.name),
    );
    for (const entry of entries) {
      const relativeEntry = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      assertPortableShareRelativePath(relativeEntry, "final inventory path");
      const key = portableSharePathCollisionKey(relativeEntry);
      if (finalPortableNames.has(key)) fail(`final inventory contains a case/Unicode collision: ${relativeEntry}`);
      finalPortableNames.add(key);
      const absoluteEntry = resolve(directory, entry.name);
      const status = lstatSync(absoluteEntry);
      if (status.isSymbolicLink()) fail(`final inventory refuses symbolic links: ${relativeEntry}`);
      if (status.isDirectory()) {
        verifyFinalShape(absoluteEntry, relativeEntry);
      } else if (status.isFile()) {
        if (status.nlink !== 1) fail(`final inventory refuses hard-linked files: ${relativeEntry}`);
        if (statIdentity(status) !== verifiedIdentities.get(relativeEntry)) {
          fail(`tree file set or identity changed during final shape verification: ${relativeEntry}`);
        }
        finalFilePaths.push(relativeEntry);
      } else {
        fail(`final inventory refuses special files: ${relativeEntry}`);
      }
    }
    const finalNames = readdirSync(directory).sort(comparePortableNames);
    const after = lstatSync(directory);
    if (
      statIdentity(before) !== statIdentity(after) ||
      finalNames.length !== entries.length ||
      finalNames.some((name, index) => name !== entries[index]?.name)
    ) {
      fail(`directory mutated during final shape verification: ${directory}`);
    }
  };
  verifyFinalShape(resolve(root), "");
  finalFilePaths.sort(comparePortableNames);
  if (
    finalFilePaths.length !== files.length ||
    finalFilePaths.some((path, index) => path !== files[index]?.path)
  ) {
    fail("tree file set changed before inventory publication");
  }
  const totalBytes = files.reduce((sum, file) => sum + file.byteLength, 0);
  if (!Number.isSafeInteger(totalBytes)) fail("inventory total exceeds the JSON safe-integer range");
  const treeSha256 = createHash("sha256")
    .update(JSON.stringify(files.map((file) => [file.path, file.byteLength, file.sha256])))
    .digest("hex");
  return { format: NAS_TREE_INVENTORY_FORMAT, fileCount: files.length, totalBytes, treeSha256, files };
}

function assertLosslessJsonValue(value: unknown, label: string, ancestors = new Set<object>()): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${label} contains a non-finite number`);
    return;
  }
  if (typeof value !== "object" || value === null) return fail(`${label} contains a non-JSON value`);
  const objectValue: object = value;
  if (ancestors.has(objectValue)) fail(`${label} contains a cycle`);
  ancestors.add(objectValue);
  try {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (!(index in value)) fail(`${label}[${index}] is a sparse array entry`);
        assertLosslessJsonValue(value[index], `${label}[${index}]`, ancestors);
      }
      return;
    }
    const prototype = Object.getPrototypeOf(objectValue) as unknown;
    if (prototype !== Object.prototype && prototype !== null) fail(`${label} is not a plain JSON object`);
    const ownKeys = Reflect.ownKeys(objectValue);
    if (ownKeys.some((key) => typeof key !== "string")) fail(`${label} has a symbol key`);
    const descriptors = Object.getOwnPropertyDescriptors(objectValue);
    for (const key of ownKeys as string[]) {
      const descriptor = descriptors[key];
      if (descriptor === undefined || descriptor.enumerable !== true || descriptor.get !== undefined || descriptor.set !== undefined) {
        fail(`${label}.${key} is not a plain enumerable data field`);
      }
      assertLosslessJsonValue(descriptor.value, `${label}.${key}`, ancestors);
    }
  } finally {
    ancestors.delete(objectValue);
  }
}

function fsyncParentDirectory(targetPath: string): void {
  // Node does not expose a portable directory handle on Windows. The POSIX path is crash-durable;
  // Windows SMB rename durability remains an explicitly unexecuted plan limit.
  if (process.platform === "win32") return;
  const fd = openSync(dirname(targetPath), constants.O_RDONLY);
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

/** Write lossless JSON bytes to a sibling temporary file, fsync, rename, then fsync its parent. */
export function writeJsonAtomic(targetPath: string, value: unknown): void {
  assertLosslessJsonValue(value, "JSON value");
  const encoded = JSON.stringify(value, null, 2);
  if (encoded === undefined) fail("value is not JSON-serializable");
  const serialized = `${encoded}\n`;
  const temporaryPath = resolve(dirname(targetPath), `.${basename(targetPath)}.${process.pid}.${randomUUID()}.tmp`);
  let created = false;
  try {
    const fd = openSync(temporaryPath, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
    created = true;
    try {
      writeFileSync(fd, serialized, "utf8");
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    renameSync(temporaryPath, targetPath);
    fsyncParentDirectory(targetPath);
    created = false;
  } finally {
    if (created) {
      try {
        unlinkSync(temporaryPath);
      } catch {
        // Preserve the original error; a later audit identifies unexpected staging residue.
      }
    }
  }
}
