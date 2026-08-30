// Bounded publication command for the completed gut-check scientific growth bundles.
//
// This is intentionally collection-specific. It cannot select another source, collection,
// version, destination, or restore root, and it never deletes a byte. Generic forward NAS
// publication remains outside the repository command surface.

import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statfsSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  inventoryStableTree,
  parseNasAssetCatalogV1,
  writeJsonAtomic,
  type NasAssetCatalogV1,
  type NasTreeInventoryV1,
} from "./nas-asset-lib.ts";
import {
  NAS_PUBLICATION_RECEIPT_FORMAT,
  publishCollectionFixture,
  restoreCollectionFixture,
  validateForwardPublishIntent,
  type NasAssetTransactionHooks,
} from "./nas-asset-transaction-lib.ts";
import { detectNasMount } from "./nas-root.ts";

export const GROWTH_SCIENTIFIC_IDENTITY = "gutcheck-growth-scientific@2026-08-26" as const;
export const GROWTH_SCIENTIFIC_ASSET_ID = "gutcheck-growth-scientific" as const;
export const GROWTH_SCIENTIFIC_VERSION = "2026-08-26" as const;
export const GROWTH_SCIENTIFIC_LOCATOR =
  "collections/gutcheck-growth-scientific/2026-08-26/payload" as const;
export const GROWTH_SCIENTIFIC_MANIFEST_PATH =
  "docs/nas-assets/manifests/gutcheck-growth-scientific/2026-08-26.json" as const;
export const GROWTH_SCIENTIFIC_PUBLISH_TRANSACTION =
  "gutcheck-growth-scientific-20260829-publish3" as const;
export const GROWTH_SCIENTIFIC_RESTORE_TRANSACTION =
  "gutcheck-growth-scientific-20260829-restore" as const;
export const GROWTH_SCIENTIFIC_PUBLICATION_RECEIPT =
  `_control/receipts/publication/${GROWTH_SCIENTIFIC_ASSET_ID}/${GROWTH_SCIENTIFIC_VERSION}/${GROWTH_SCIENTIFIC_PUBLISH_TRANSACTION}.json` as const;
export const GROWTH_SCIENTIFIC_RESTORE_RECEIPT =
  `_control/receipts/restore/${GROWTH_SCIENTIFIC_ASSET_ID}/${GROWTH_SCIENTIFIC_VERSION}/${GROWTH_SCIENTIFIC_RESTORE_TRANSACTION}.json` as const;

const EXPECTED_PROVISIONAL_CATALOG_SHA256 =
  "8e03e1d06639c33302c0bb55061e5628a776a6d17a2eb10300346b6366e1f724";
const REPOSITORY_ROOT = resolve(import.meta.dirname, "..");
const CATALOG_PATH = resolve(REPOSITORY_ROOT, "docs/nas-assets.json");
const SOURCE_ROOT = resolve(REPOSITORY_ROOT, "out/growth-scientific");
const RESTORE_ROOT = resolve(
  REPOSITORY_ROOT,
  "out/restores/gutcheck-growth-scientific-2026-08-26",
);
const OPERATOR_ROOT = resolve(REPOSITORY_ROOT, "out/nas-publish-gutcheck-growth-scientific-2026-08-26");
const MANIFEST_PATH = resolve(REPOSITORY_ROOT, GROWTH_SCIENTIFIC_MANIFEST_PATH);
const FREE_SPACE_MARGIN_BYTES = 1024 * 1024 * 1024;
const FAILED_PUBLISH_TRANSACTION = "gutcheck-growth-scientific-20260829-publish2";
const FAILED_STAGE_NAME = `${GROWTH_SCIENTIFIC_IDENTITY}.${FAILED_PUBLISH_TRANSACTION}`;
const FAILED_QUARANTINE_RELATIVE =
  "_control/quarantine/unresolved/gutcheck-growth-scientific-20260829-publish-attempt2";
const FAILED_STAGE_FILE_COUNT = 6_308;
const FAILED_STAGE_TOTAL_BYTES = 84_247_312_054;
const FAILED_STAGE_TREE_SHA256 = "4a1e18634896a58b5e8acf26a041c75de72982bd32a665cae7762976f6465f3e";

type Command = "--dry-run" | "--retire-failed-publish" | "--publish" | "--restore" | "--register";

interface TreeSummary {
  readonly fileCount: number;
  readonly totalBytes: number;
  readonly treeSha256: string;
}

interface ReceiptBinding {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly value: Record<string, unknown>;
}

export interface GrowthScientificOwnerManifestV1 {
  readonly format: "snowflake-nas-ledger-v1";
  readonly collection: typeof GROWTH_SCIENTIFIC_IDENTITY;
  readonly locator: typeof GROWTH_SCIENTIFIC_LOCATOR;
  readonly treeSha256: string;
  readonly files: readonly {
    readonly path: string;
    readonly bytes: number;
    readonly sha256: string;
  }[];
}

const sha256 = (bytes: Buffer | string): string =>
  createHash("sha256").update(bytes).digest("hex");

const serializedJson = (value: unknown): Buffer =>
  Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");

const record = (value: unknown, label: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} is not an object`);
  }
  return value as Record<string, unknown>;
};

const nonNegativeInteger = (value: unknown, label: string): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} is not a non-negative safe integer`);
  }
  return value;
};

const digest = (value: unknown, label: string): string => {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/u.test(value)) {
    throw new Error(`${label} is not lowercase SHA-256`);
  }
  return value;
};

const text = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} is not a string`);
  return value;
};

const summary = (value: unknown, label: string): TreeSummary => {
  const candidate = record(value, label);
  return {
    fileCount: nonNegativeInteger(candidate.fileCount, `${label}.fileCount`),
    totalBytes: nonNegativeInteger(candidate.totalBytes, `${label}.totalBytes`),
    treeSha256: digest(candidate.treeSha256, `${label}.treeSha256`),
  };
};

const inventorySummary = (inventory: NasTreeInventoryV1): TreeSummary => ({
  fileCount: inventory.fileCount,
  totalBytes: inventory.totalBytes,
  treeSha256: inventory.treeSha256,
});

const assertSameSummary = (expected: TreeSummary, actual: TreeSummary, label: string): void => {
  if (
    expected.fileCount !== actual.fileCount ||
    expected.totalBytes !== actual.totalBytes ||
    expected.treeSha256 !== actual.treeSha256
  ) {
    throw new Error(`${label} does not match the registered tree summary`);
  }
};

const readReceipt = (shareRoot: string, relativePath: string): ReceiptBinding => {
  const bytes = readFileSync(resolve(shareRoot, ...relativePath.split("/")));
  const value = record(JSON.parse(bytes.toString("utf8")) as unknown, relativePath);
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes), value };
};

const assertPublicationReceipt = (binding: ReceiptBinding): TreeSummary => {
  const receipt = binding.value;
  if (
    receipt.format !== NAS_PUBLICATION_RECEIPT_FORMAT ||
    receipt.transactionId !== GROWTH_SCIENTIFIC_PUBLISH_TRANSACTION ||
    receipt.identity !== GROWTH_SCIENTIFIC_IDENTITY ||
    receipt.locator !== GROWTH_SCIENTIFIC_LOCATOR
  ) {
    throw new Error("publication receipt identity is not the registered growth-scientific transaction");
  }
  const source = summary(receipt.source, "publication.source");
  assertSameSummary(source, summary(receipt.staged, "publication.staged"), "publication stage");
  assertSameSummary(source, summary(receipt.final, "publication.final"), "publication final");
  return source;
};

const catalogueAndIntent = (): {
  readonly sourceBytes: Buffer;
  readonly catalogue: NasAssetCatalogV1;
  readonly collection: NasAssetCatalogV1["collections"][number];
} => {
  const sourceBytes = readFileSync(CATALOG_PATH);
  const actualDigest = sha256(sourceBytes);
  if (actualDigest !== EXPECTED_PROVISIONAL_CATALOG_SHA256) {
    throw new Error(
      `tracked catalogue changed after provisional registration (${actualDigest}); refusing the frozen publication`,
    );
  }
  const catalogue = parseNasAssetCatalogV1(sourceBytes.toString("utf8"));
  const collection = catalogue.collections.find(
    (candidate) => `${candidate.assetId}@${candidate.version}` === GROWTH_SCIENTIFIC_IDENTITY,
  );
  if (collection === undefined) throw new Error("provisional growth-scientific collection is missing");
  validateForwardPublishIntent(collection, catalogue.collections);
  return { sourceBytes, catalogue, collection };
};

const mount = (): string => {
  const result = detectNasMount();
  if (result === null) throw new Error("the marked snowcrystal NAS share is not attached");
  return result;
};

const logFactory = (command: Command): ((message: string) => void) => {
  mkdirSync(OPERATOR_ROOT, { recursive: true });
  const path = resolve(OPERATOR_ROOT, `${command.slice(2)}.log`);
  return (message: string): void => {
    const line = `${new Date().toISOString()} ${message}`;
    console.log(line);
    appendFileSync(path, `${line}\n`, "utf8");
  };
};

const inventoryWithProgress = (
  root: string,
  label: string,
  log: (message: string) => void,
): NasTreeInventoryV1 => {
  let lastReportAt = 0;
  log(`${label}: stable inventory started`);
  const inventory = inventoryStableTree(root, {
    afterFirstPassFile(relativePath, filesHashed) {
      const now = Date.now();
      if (now - lastReportAt >= 15_000 || filesHashed % 500 === 0) {
        log(`${label}: first-pass files=${filesHashed} current=${relativePath}`);
        lastReportAt = now;
      }
    },
  });
  log(
    `${label}: files=${inventory.fileCount} bytes=${inventory.totalBytes} treeSha256=${inventory.treeSha256}`,
  );
  return inventory;
};

const transactionProgress = (
  label: "publish" | "restore",
  log: (message: string) => void,
): NasAssetTransactionHooks => {
  let copied = 0;
  let lastReportAt = 0;
  return {
    afterPhase(phase, context) {
      if (phase.endsWith("file-copied")) {
        copied += 1;
        const now = Date.now();
        if (now - lastReportAt >= 15_000 || copied % 500 === 0) {
          log(`${label}: copied=${copied} current=${context.relativePath ?? "unknown"}`);
          lastReportAt = now;
        }
      } else {
        log(`${label}: ${phase}`);
      }
    },
  };
};

export const buildGrowthScientificOwnerManifest = (
  inventory: NasTreeInventoryV1,
): GrowthScientificOwnerManifestV1 => ({
  format: "snowflake-nas-ledger-v1",
  collection: GROWTH_SCIENTIFIC_IDENTITY,
  locator: GROWTH_SCIENTIFIC_LOCATOR,
  treeSha256: inventory.treeSha256,
  files: inventory.files.map((file) => ({
    path: `${GROWTH_SCIENTIFIC_LOCATOR}/${file.path}`,
    bytes: file.byteLength,
    sha256: file.sha256,
  })),
});

export const activateGrowthScientificCollection = (options: {
  readonly catalogue: NasAssetCatalogV1;
  readonly inventory: NasTreeInventoryV1;
  readonly manifestBytes: number;
  readonly manifestSha256: string;
  readonly publication: ReceiptBinding;
  readonly verifiedAt: string;
  readonly host: string;
}): NasAssetCatalogV1 => {
  const collections = options.catalogue.collections.map((collection) => {
    const identity = `${collection.assetId}@${collection.version}`;
    if (identity !== GROWTH_SCIENTIFIC_IDENTITY) return collection;
    if (collection.state !== "provisional") throw new Error("growth-scientific collection is not provisional");
    return {
      ...collection,
      state: "active" as const,
      aggregate: {
        files: options.inventory.fileCount,
        bytes: options.inventory.totalBytes,
      },
      ownerManifest: {
        storage: "tracked" as const,
        path: GROWTH_SCIENTIFIC_MANIFEST_PATH,
        format: "snowflake-nas-ledger-v1",
        bytes: options.manifestBytes,
        sha256: options.manifestSha256,
        selector: {
          kind: "path-prefixes" as const,
          include: [GROWTH_SCIENTIFIC_LOCATOR],
          exclude: [],
        },
      },
      restore: { ...collection.restore, status: "documented" as const },
      verification: {
        status: "full-hash" as const,
        at: options.verifiedAt.slice(0, 10),
        host: options.host,
        receipt: options.publication.path,
        limits: [
          `Publication receipt SHA-256 ${options.publication.sha256}; source, stage, and final matched ${options.inventory.fileCount} files / ${options.inventory.totalBytes} bytes / tree SHA-256 ${options.inventory.treeSha256}.`,
          "Maker direction on 2026-08-29 narrowed completion to the basic durable copy plus tracked owner manifest; an independent fresh restore and later fresh-process full verifier were not run.",
          "Windows cannot fsync an SMB directory handle; durability is observation-based through final close, reopen, and repeated hash verification within the publication process, not a hardware crash-durability claim.",
          "The workstation source remains in place; publication authorizes no deletion.",
        ],
      },
      unresolved: [],
    };
  });
  return parseNasAssetCatalogV1(JSON.stringify({ ...options.catalogue, collections }));
};

const ensureAbsent = (path: string, label: string): void => {
  if (existsSync(path)) throw new Error(`${label} already exists; refusing to replace it`);
};

const dryRun = (): void => {
  const log = logFactory("--dry-run");
  const { catalogue, collection } = catalogueAndIntent();
  const shareRoot = mount();
  ensureAbsent(resolve(shareRoot, "collections", GROWTH_SCIENTIFIC_ASSET_ID, GROWTH_SCIENTIFIC_VERSION), "final collection");
  ensureAbsent(resolve(shareRoot, ...GROWTH_SCIENTIFIC_PUBLICATION_RECEIPT.split("/")), "publication receipt");
  ensureAbsent(resolve(shareRoot, ...GROWTH_SCIENTIFIC_RESTORE_RECEIPT.split("/")), "restore receipt");
  ensureAbsent(RESTORE_ROOT, "fresh restore destination");
  const inventory = inventoryWithProgress(SOURCE_ROOT, "source", log);
  const filesystem = statfsSync(shareRoot);
  const freeBytes = filesystem.bavail * filesystem.bsize;
  if (freeBytes < inventory.totalBytes + FREE_SPACE_MARGIN_BYTES) {
    throw new Error(`NAS free space ${freeBytes} is insufficient for ${inventory.totalBytes} bytes plus margin`);
  }
  const report = {
    format: "gutcheck-growth-scientific-nas-dry-run-v1",
    ok: true,
    identity: GROWTH_SCIENTIFIC_IDENTITY,
    source: inventorySummary(inventory),
    nasMount: "attached-marked-share",
    nasFreeBytes: freeBytes,
    finalLocator: collection.locator,
    finalAbsent: true,
    restoreAbsent: true,
    destructiveAction: false,
  };
  writeJsonAtomic(resolve(OPERATOR_ROOT, "dry-run.json"), report);
  log(JSON.stringify(report));
  void catalogue;
};

const publish = (): void => {
  const log = logFactory("--publish");
  const { catalogue, collection } = catalogueAndIntent();
  const shareRoot = mount();
  ensureAbsent(resolve(shareRoot, "collections", GROWTH_SCIENTIFIC_ASSET_ID, GROWTH_SCIENTIFIC_VERSION), "final collection");
  ensureAbsent(resolve(shareRoot, ...GROWTH_SCIENTIFIC_PUBLICATION_RECEIPT.split("/")), "publication receipt");
  const result = publishCollectionFixture({
    shareRoot,
    sourceRoot: SOURCE_ROOT,
    collection,
    catalogueCollections: catalogue.collections,
    transactionId: GROWTH_SCIENTIFIC_PUBLISH_TRANSACTION,
    hooks: transactionProgress("publish", log),
  });
  const report = {
    format: "gutcheck-growth-scientific-nas-publish-result-v1",
    ok: true,
    identity: result.identity,
    locator: result.locator,
    publicationReceipt: result.publicationReceiptPath,
    publicationReceiptSha256: result.publicationReceiptSha256,
    final: result.receipt.final,
    destructiveAction: false,
  };
  writeJsonAtomic(resolve(OPERATOR_ROOT, "publish-result.json"), report);
  log(JSON.stringify(report));
};

const restore = (): void => {
  const log = logFactory("--restore");
  const { catalogue, collection } = catalogueAndIntent();
  const shareRoot = mount();
  const publication = readReceipt(shareRoot, GROWTH_SCIENTIFIC_PUBLICATION_RECEIPT);
  assertPublicationReceipt(publication);
  ensureAbsent(RESTORE_ROOT, "fresh restore destination");
  ensureAbsent(resolve(shareRoot, ...GROWTH_SCIENTIFIC_RESTORE_RECEIPT.split("/")), "restore receipt");
  mkdirSync(dirname(RESTORE_ROOT), { recursive: true });
  const result = restoreCollectionFixture({
    shareRoot,
    destinationPath: RESTORE_ROOT,
    collection,
    publicationReceiptPath: GROWTH_SCIENTIFIC_PUBLICATION_RECEIPT,
    transactionId: GROWTH_SCIENTIFIC_RESTORE_TRANSACTION,
    hooks: transactionProgress("restore", log),
  });
  const report = {
    format: "gutcheck-growth-scientific-nas-restore-result-v1",
    ok: true,
    identity: result.identity,
    publicationReceipt: GROWTH_SCIENTIFIC_PUBLICATION_RECEIPT,
    restoreReceipt: result.restoreReceiptPath,
    restoreReceiptSha256: result.restoreReceiptSha256,
    restored: result.receipt.restored,
    destructiveAction: false,
  };
  writeJsonAtomic(resolve(OPERATOR_ROOT, "restore-result.json"), report);
  log(JSON.stringify(report));
  void catalogue;
};

const register = (): void => {
  const log = logFactory("--register");
  const { catalogue } = catalogueAndIntent();
  const shareRoot = mount();
  const publication = readReceipt(shareRoot, GROWTH_SCIENTIFIC_PUBLICATION_RECEIPT);
  const publishedSummary = assertPublicationReceipt(publication);
  const sourceInventory = inventoryWithProgress(SOURCE_ROOT, "source-registration", log);
  assertSameSummary(publishedSummary, inventorySummary(sourceInventory), "source registration inventory");

  const manifest = buildGrowthScientificOwnerManifest(sourceInventory);
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeJsonAtomic(MANIFEST_PATH, manifest);
  const manifestBytes = readFileSync(MANIFEST_PATH);
  const manifestDigest = sha256(manifestBytes);
  const verifiedAt = text(publication.value.verifiedAt, "publication.verifiedAt");
  const activeCatalogue = activateGrowthScientificCollection({
    catalogue,
    inventory: sourceInventory,
    manifestBytes: manifestBytes.byteLength,
    manifestSha256: manifestDigest,
    publication,
    verifiedAt,
    host: process.env.COMPUTERNAME ?? "Windows",
  });
  writeJsonAtomic(CATALOG_PATH, activeCatalogue);
  const report = {
    format: "gutcheck-growth-scientific-nas-registration-result-v1",
    ok: true,
    identity: GROWTH_SCIENTIFIC_IDENTITY,
    aggregate: inventorySummary(sourceInventory),
    ownerManifest: {
      path: GROWTH_SCIENTIFIC_MANIFEST_PATH,
      bytes: manifestBytes.byteLength,
      sha256: manifestDigest,
    },
    publicationReceipt: {
      path: publication.path,
      bytes: publication.bytes,
      sha256: publication.sha256,
    },
    restorePerformed: false,
    sourceRetained: true,
    destructiveAction: false,
  };
  writeJsonAtomic(resolve(OPERATOR_ROOT, "registration-result.json"), report);
  log(JSON.stringify(report));
};

const retireFailedPublish = (): void => {
  const log = logFactory("--retire-failed-publish");
  catalogueAndIntent();
  const shareRoot = mount();
  const stagePath = resolve(shareRoot, "_control/staging/publish", FAILED_STAGE_NAME);
  const lockPath = resolve(
    shareRoot,
    "_control/locks/publish",
    `${GROWTH_SCIENTIFIC_IDENTITY}.lock`,
  );
  const oldReceiptPath = resolve(
    shareRoot,
    "_control/receipts/publication",
    GROWTH_SCIENTIFIC_ASSET_ID,
    GROWTH_SCIENTIFIC_VERSION,
    `${FAILED_PUBLISH_TRANSACTION}.json`,
  );
  const finalPath = resolve(
    shareRoot,
    "collections",
    GROWTH_SCIENTIFIC_ASSET_ID,
    GROWTH_SCIENTIFIC_VERSION,
  );
  const quarantinePath = resolve(shareRoot, ...FAILED_QUARANTINE_RELATIVE.split("/"));
  if (!existsSync(stagePath) || !lstatSync(stagePath).isDirectory()) {
    throw new Error("the exact failed publication stage is absent or not a directory");
  }
  if (!existsSync(lockPath) || !lstatSync(lockPath).isDirectory()) {
    throw new Error("the exact failed publication lock is absent or not a directory");
  }
  ensureAbsent(oldReceiptPath, "failed-attempt publication receipt");
  ensureAbsent(finalPath, "final collection");
  ensureAbsent(quarantinePath, "failed-attempt quarantine target");
  const owner = record(
    JSON.parse(readFileSync(resolve(lockPath, "owner.json"), "utf8")) as unknown,
    "failed publication lock owner",
  );
  if (
    owner.format !== "snowflake-nas-transaction-lock-v1" ||
    owner.transactionId !== FAILED_PUBLISH_TRANSACTION ||
    owner.identity !== GROWTH_SCIENTIFIC_IDENTITY ||
    owner.operation !== "publish"
  ) {
    throw new Error("failed publication lock owner does not match the exact second attempt");
  }
  const staged = inventoryWithProgress(resolve(stagePath, "payload"), "failed-stage", log);
  if (
    staged.fileCount !== FAILED_STAGE_FILE_COUNT ||
    staged.totalBytes !== FAILED_STAGE_TOTAL_BYTES ||
    staged.treeSha256 !== FAILED_STAGE_TREE_SHA256
  ) {
    throw new Error("failed publication stage contains an unexpected byte or path");
  }
  mkdirSync(dirname(quarantinePath), { recursive: true });
  mkdirSync(quarantinePath);
  renameSync(stagePath, resolve(quarantinePath, "stage"));
  renameSync(lockPath, resolve(quarantinePath, "lock"));
  const failureRecord = {
    format: "gutcheck-growth-scientific-nas-failed-publication-v1",
    identity: GROWTH_SCIENTIFIC_IDENTITY,
    transactionId: FAILED_PUBLISH_TRANSACTION,
    failure:
      "The transaction core bound mutable SMB directory metadata after the copy; a later close-time metadata settlement changed one unchanged directory's mtime/ctime before the final publication boundary.",
    staged: inventorySummary(staged),
    finalCollectionCreated: false,
    publicationReceiptCreated: false,
    disposition: "Stage and lock moved intact to non-served unresolved quarantine; no byte deleted.",
    retiredAt: new Date().toISOString(),
  };
  writeJsonAtomic(resolve(quarantinePath, "failure.json"), failureRecord);
  writeJsonAtomic(resolve(OPERATOR_ROOT, "failed-publish-retirement-attempt2.json"), {
    ...failureRecord,
    quarantine: FAILED_QUARANTINE_RELATIVE,
  });
  log(JSON.stringify({ ok: true, quarantine: FAILED_QUARANTINE_RELATIVE, staged: failureRecord.staged }));
};

const main = (): void => {
  const command = process.argv[2] as Command | undefined;
  if (
    process.argv.length !== 3 ||
    !["--dry-run", "--retire-failed-publish", "--publish", "--restore", "--register"].includes(command ?? "")
  ) {
    throw new Error("usage: node scripts/nas-publish-gutcheck-growth-scientific.ts --dry-run|--retire-failed-publish|--publish|--restore|--register");
  }
  if (command === "--dry-run") dryRun();
  else if (command === "--retire-failed-publish") retireFailedPublish();
  else if (command === "--publish") publish();
  else if (command === "--restore") restore();
  else register();
};

const invokedPath = process.argv[1] === undefined ? null : pathToFileURL(resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) main();
