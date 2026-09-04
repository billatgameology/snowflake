// Bounded publication command for the completed render worktrees.
//
// The command cannot select another source, collection, version, destination, or restore root. It
// copies without deleting, and every durable NAS write delegates to the shared transaction core.

import { createHash } from "node:crypto";
import {
  appendFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statfsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  hashStableRegularFile,
  inventoryStableTree,
  parseNasAssetCatalogV1,
  writeJsonAtomic,
  type NasAssetCatalogV1,
  type NasTreeFileV1,
  type NasTreeInventoryV1,
} from "./nas-asset-lib.ts";
import {
  NAS_PUBLICATION_RECEIPT_FORMAT,
  NAS_RESTORE_RECEIPT_FORMAT,
  publishCollectionFixture,
  restoreCollectionFixture,
  validateForwardPublishIntent,
  type NasAssetTransactionHooks,
} from "./nas-asset-transaction-lib.ts";
import { detectNasMount } from "./nas-root.ts";

export const RENDER_CLOSEOUT_IDENTITY = "render-worktrees-closeout@2026-09-04" as const;
export const RENDER_CLOSEOUT_ASSET_ID = "render-worktrees-closeout" as const;
export const RENDER_CLOSEOUT_VERSION = "2026-09-04" as const;
export const RENDER_CLOSEOUT_LOCATOR =
  "collections/render-worktrees-closeout/2026-09-04/payload" as const;
export const RENDER_CLOSEOUT_MANIFEST_PATH =
  "docs/nas-assets/manifests/render-worktrees-closeout/2026-09-04.json" as const;
export const RENDER_CLOSEOUT_PUBLISH_TRANSACTION =
  "render-worktrees-closeout-20260904-publish" as const;
export const RENDER_CLOSEOUT_RESTORE_TRANSACTION =
  "render-worktrees-closeout-20260904-restore" as const;
export const RENDER_CLOSEOUT_PUBLICATION_RECEIPT =
  `_control/receipts/publication/${RENDER_CLOSEOUT_ASSET_ID}/${RENDER_CLOSEOUT_VERSION}/${RENDER_CLOSEOUT_PUBLISH_TRANSACTION}.json` as const;
export const RENDER_CLOSEOUT_RESTORE_RECEIPT =
  `_control/receipts/restore/${RENDER_CLOSEOUT_ASSET_ID}/${RENDER_CLOSEOUT_VERSION}/${RENDER_CLOSEOUT_RESTORE_TRANSACTION}.json` as const;

const EXPECTED_PROVISIONAL_CATALOG_SHA256 =
  "47268255b6a76bb9c95cf75a39ab82ef031570d21dd0f68902cac2afd73dde5d";
const REPOSITORY_ROOT = resolve(import.meta.dirname, "..");
const CATALOG_PATH = resolve(REPOSITORY_ROOT, "docs/nas-assets.json");
const SOURCE_ROOT = resolve(REPOSITORY_ROOT, "out");
const ANIMATION_WORKTREE_ROOT = resolve(REPOSITORY_ROOT, "../snowflake-animation");
const ANIMATION_OUT_ROOT = resolve(ANIMATION_WORKTREE_ROOT, "out");
const ANIMATION_RESIDUAL_ROOT = resolve(SOURCE_ROOT, "animation-worktree-closeout");
const RESTORE_ROOT = resolve(REPOSITORY_ROOT, "../snowflake-render-closeout-restore");
const OPERATOR_ROOT = resolve(tmpdir(), "vcc-render-worktrees-closeout-2026-09-04");
const MANIFEST_PATH = resolve(REPOSITORY_ROOT, RENDER_CLOSEOUT_MANIFEST_PATH);
const FREE_SPACE_MARGIN_BYTES = 1024 * 1024 * 1024;

const ANIMATION_EXCLUDED_ROOT = "growth-scientific";
const ANIMATION_RESIDUAL_NAMES = [
  "dev-server.log",
  "film-regression.png",
  "growth-assets",
  "growth-pilot",
  "growth-presets",
  "gutcheck-animation-queue",
  "gutcheck-figure-previews",
  "gutcheck-gg-realism",
  "library-initial.png",
  "library-needle.png",
  "nas-publish-gutcheck-growth-scientific-2026-08-26",
  "nas-restore-gutcheck-growth-scientific-2026-09-04.log",
  "nas-verify-gutcheck-growth-scientific-2026-09-04.log",
  "nas-verify-restored-gutcheck-growth-scientific-2026-09-04.log",
  "shoot-library.mjs",
] as const;
const ANIMATION_EXPECTED_NAMES = [...ANIMATION_RESIDUAL_NAMES, ANIMATION_EXCLUDED_ROOT].sort();
const CLOSEOUT_EXPECTED_NAMES = [
  "animation-worktree-closeout",
  "named-crystal-catalog",
  "named-crystal-gallery-site",
  "named-crystal-gallery-volume-previews",
  "named-crystal-volume-stability",
] as const;

type Command =
  | "--copy-animation-residual"
  | "--dry-run"
  | "--publish"
  | "--restore"
  | "--register";

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

export interface RenderCloseoutOwnerManifestV1 {
  readonly format: "snowflake-nas-ledger-v1";
  readonly collection: typeof RENDER_CLOSEOUT_IDENTITY;
  readonly locator: typeof RENDER_CLOSEOUT_LOCATOR;
  readonly treeSha256: string;
  readonly files: readonly {
    readonly path: string;
    readonly bytes: number;
    readonly sha256: string;
  }[];
}

const sha256 = (bytes: Buffer | string): string =>
  createHash("sha256").update(bytes).digest("hex");

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

const assertExactTopLevel = (root: string, expectedNames: readonly string[], label: string): void => {
  const status = lstatSync(root);
  if (!status.isDirectory() || status.isSymbolicLink()) {
    throw new Error(`${label} is not an ordinary directory`);
  }
  const actualNames = readdirSync(root).sort();
  const expected = [...expectedNames].sort();
  if (actualNames.length !== expected.length || actualNames.some((name, index) => name !== expected[index])) {
    throw new Error(`${label} top-level names changed`);
  }
};

const combineFiles = (files: readonly NasTreeFileV1[]): NasTreeInventoryV1 => {
  const sorted = [...files].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  const totalBytes = sorted.reduce((sum, file) => sum + file.byteLength, 0);
  if (!Number.isSafeInteger(totalBytes)) throw new Error("selected inventory exceeds safe integer range");
  const treeSha256 = createHash("sha256")
    .update(JSON.stringify(sorted.map((file) => [file.path, file.byteLength, file.sha256])))
    .digest("hex");
  return {
    format: "snowflake-nas-tree-inventory-v1",
    fileCount: sorted.length,
    totalBytes,
    treeSha256,
    files: sorted,
  };
};

export const inventoryAnimationResidual = (
  sourceRoot: string,
  expectedNames: readonly string[] = ANIMATION_EXPECTED_NAMES,
  selectedNames: readonly string[] = ANIMATION_RESIDUAL_NAMES,
): NasTreeInventoryV1 => {
  assertExactTopLevel(sourceRoot, expectedNames, "animation out root");
  const selected = new Set(selectedNames);
  const files: NasTreeFileV1[] = [];
  for (const name of selectedNames) {
    if (!selected.has(name)) throw new Error("animation residual selection contains a duplicate");
    selected.delete(name);
    const sourcePath = resolve(sourceRoot, name);
    const status = lstatSync(sourcePath);
    if (status.isSymbolicLink()) throw new Error(`animation residual refuses symbolic links: ${name}`);
    if (status.isDirectory()) {
      const inventory = inventoryStableTree(sourcePath);
      files.push(...inventory.files.map((file) => ({ ...file, path: `${name}/${file.path}` })));
    } else if (status.isFile()) {
      files.push({ path: name, ...hashStableRegularFile(sourcePath) });
    } else {
      throw new Error(`animation residual refuses special files: ${name}`);
    }
  }
  return combineFiles(files);
};

export const copyAnimationResidual = (options: {
  readonly sourceRoot: string;
  readonly destinationRoot: string;
  readonly expectedNames?: readonly string[];
  readonly selectedNames?: readonly string[];
}): NasTreeInventoryV1 => {
  if (existsSync(options.destinationRoot)) throw new Error("animation residual destination already exists");
  const expectedNames = options.expectedNames ?? ANIMATION_EXPECTED_NAMES;
  const selectedNames = options.selectedNames ?? ANIMATION_RESIDUAL_NAMES;
  const sourceBefore = inventoryAnimationResidual(options.sourceRoot, expectedNames, selectedNames);
  mkdirSync(options.destinationRoot, { recursive: false });
  for (const name of selectedNames) {
    cpSync(resolve(options.sourceRoot, name), resolve(options.destinationRoot, name), {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
  }
  const sourceAfter = inventoryAnimationResidual(options.sourceRoot, expectedNames, selectedNames);
  const destination = inventoryStableTree(options.destinationRoot);
  assertSameSummary(inventorySummary(sourceBefore), inventorySummary(sourceAfter), "animation residual source");
  assertSameSummary(inventorySummary(sourceBefore), inventorySummary(destination), "animation residual copy");
  return destination;
};

const readReceipt = (shareRoot: string, relativePath: string): ReceiptBinding => {
  const bytes = readFileSync(resolve(shareRoot, ...relativePath.split("/")));
  return {
    path: relativePath,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    value: record(JSON.parse(bytes.toString("utf8")) as unknown, relativePath),
  };
};

const assertPublicationReceipt = (binding: ReceiptBinding): TreeSummary => {
  const receipt = binding.value;
  if (
    receipt.format !== NAS_PUBLICATION_RECEIPT_FORMAT ||
    receipt.transactionId !== RENDER_CLOSEOUT_PUBLISH_TRANSACTION ||
    receipt.identity !== RENDER_CLOSEOUT_IDENTITY ||
    receipt.locator !== RENDER_CLOSEOUT_LOCATOR
  ) {
    throw new Error("publication receipt identity is not the registered closeout transaction");
  }
  const source = summary(receipt.source, "publication.source");
  assertSameSummary(source, summary(receipt.staged, "publication.staged"), "publication stage");
  assertSameSummary(source, summary(receipt.final, "publication.final"), "publication final");
  return source;
};

const assertRestoreReceipt = (binding: ReceiptBinding, publication: ReceiptBinding): TreeSummary => {
  const receipt = binding.value;
  if (
    receipt.format !== NAS_RESTORE_RECEIPT_FORMAT ||
    receipt.transactionId !== RENDER_CLOSEOUT_RESTORE_TRANSACTION ||
    receipt.identity !== RENDER_CLOSEOUT_IDENTITY ||
    receipt.locator !== RENDER_CLOSEOUT_LOCATOR ||
    receipt.publicationTransactionId !== RENDER_CLOSEOUT_PUBLISH_TRANSACTION ||
    receipt.publicationReceiptPath !== publication.path ||
    receipt.publicationReceiptSha256 !== publication.sha256
  ) {
    throw new Error("restore receipt identity is not the registered closeout transaction");
  }
  return summary(receipt.restored, "restore.restored");
};

const catalogueAndIntent = (): {
  readonly catalogue: NasAssetCatalogV1;
  readonly collection: NasAssetCatalogV1["collections"][number];
} => {
  const sourceBytes = readFileSync(CATALOG_PATH);
  const actualDigest = sha256(sourceBytes);
  if (actualDigest !== EXPECTED_PROVISIONAL_CATALOG_SHA256) {
    throw new Error(`tracked catalogue changed after provisional registration (${actualDigest})`);
  }
  const catalogue = parseNasAssetCatalogV1(sourceBytes.toString("utf8"));
  const collection = catalogue.collections.find(
    (candidate) => `${candidate.assetId}@${candidate.version}` === RENDER_CLOSEOUT_IDENTITY,
  );
  if (collection === undefined) throw new Error("provisional closeout collection is missing");
  validateForwardPublishIntent(collection, catalogue.collections);
  return { catalogue, collection };
};

const mount = (): string => {
  const result = detectNasMount();
  if (result === null) throw new Error("the marked snowcrystal NAS share is not attached");
  return result;
};

const logFactory = (command: Command): ((message: string) => void) => {
  mkdirSync(OPERATOR_ROOT, { recursive: true });
  const logPath = resolve(OPERATOR_ROOT, `${command.slice(2)}.log`);
  return (message: string): void => {
    const line = `${new Date().toISOString()} ${message}`;
    console.log(line);
    appendFileSync(logPath, `${line}\n`, "utf8");
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
  log(`${label}: files=${inventory.fileCount} bytes=${inventory.totalBytes} treeSha256=${inventory.treeSha256}`);
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

export const buildRenderCloseoutOwnerManifest = (
  inventory: NasTreeInventoryV1,
): RenderCloseoutOwnerManifestV1 => ({
  format: "snowflake-nas-ledger-v1",
  collection: RENDER_CLOSEOUT_IDENTITY,
  locator: RENDER_CLOSEOUT_LOCATOR,
  treeSha256: inventory.treeSha256,
  files: inventory.files.map((file) => ({
    path: `${RENDER_CLOSEOUT_LOCATOR}/${file.path}`,
    bytes: file.byteLength,
    sha256: file.sha256,
  })),
});

export const activateRenderCloseoutCollection = (options: {
  readonly catalogue: NasAssetCatalogV1;
  readonly inventory: NasTreeInventoryV1;
  readonly manifestBytes: number;
  readonly manifestSha256: string;
  readonly publication: ReceiptBinding;
  readonly restoration: ReceiptBinding;
  readonly verifiedAt: string;
  readonly host: string;
}): NasAssetCatalogV1 => {
  const collections = options.catalogue.collections.map((collection) => {
    if (`${collection.assetId}@${collection.version}` !== RENDER_CLOSEOUT_IDENTITY) return collection;
    if (collection.state !== "provisional") throw new Error("closeout collection is not provisional");
    return {
      ...collection,
      state: "active" as const,
      aggregate: { files: options.inventory.fileCount, bytes: options.inventory.totalBytes },
      ownerManifest: {
        storage: "tracked" as const,
        path: RENDER_CLOSEOUT_MANIFEST_PATH,
        format: "snowflake-nas-ledger-v1",
        bytes: options.manifestBytes,
        sha256: options.manifestSha256,
        selector: { kind: "path-prefixes" as const, include: [RENDER_CLOSEOUT_LOCATOR], exclude: [] },
      },
      restore: { ...collection.restore, status: "tested" as const },
      verification: {
        status: "full-hash" as const,
        at: options.verifiedAt.slice(0, 10),
        host: options.host,
        receipt: options.publication.path,
        limits: [
          `Publication receipt SHA-256 ${options.publication.sha256}; source, stage and final matched ${options.inventory.fileCount} files / ${options.inventory.totalBytes} bytes / tree SHA-256 ${options.inventory.treeSha256}.`,
          `Fresh restore receipt ${options.restoration.path} has SHA-256 ${options.restoration.sha256} and binds the same complete tree.`,
          "Windows cannot fsync an SMB directory handle; durability is observation-based through repeated final hashes, a later fresh-process verifier and a fresh restore, not a hardware crash-durability claim.",
          "The source worktrees are removed only after the verified collection metadata is committed, merged and pushed to the remote main branch.",
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

const copyResidual = (): void => {
  const log = logFactory("--copy-animation-residual");
  const inventory = copyAnimationResidual({
    sourceRoot: ANIMATION_OUT_ROOT,
    destinationRoot: ANIMATION_RESIDUAL_ROOT,
  });
  const report = {
    format: "render-worktrees-animation-residual-copy-v1",
    ok: true,
    source: "registered-animation-worktree-out-excluding-growth-scientific",
    destination: "named-catalog-out/animation-worktree-closeout",
    aggregate: inventorySummary(inventory),
    sourceRetained: true,
    destructiveAction: false,
  };
  writeJsonAtomic(resolve(OPERATOR_ROOT, "animation-residual-copy.json"), report);
  log(JSON.stringify(report));
};

const dryRun = (): void => {
  const log = logFactory("--dry-run");
  const { collection } = catalogueAndIntent();
  assertExactTopLevel(SOURCE_ROOT, CLOSEOUT_EXPECTED_NAMES, "closeout source root");
  const shareRoot = mount();
  ensureAbsent(resolve(shareRoot, "collections", RENDER_CLOSEOUT_ASSET_ID, RENDER_CLOSEOUT_VERSION), "final collection");
  ensureAbsent(resolve(shareRoot, ...RENDER_CLOSEOUT_PUBLICATION_RECEIPT.split("/")), "publication receipt");
  ensureAbsent(resolve(shareRoot, ...RENDER_CLOSEOUT_RESTORE_RECEIPT.split("/")), "restore receipt");
  ensureAbsent(RESTORE_ROOT, "fresh restore destination");
  const inventory = inventoryWithProgress(SOURCE_ROOT, "source", log);
  const filesystem = statfsSync(shareRoot);
  const freeBytes = filesystem.bavail * filesystem.bsize;
  if (freeBytes < inventory.totalBytes + FREE_SPACE_MARGIN_BYTES) {
    throw new Error(`NAS free space ${freeBytes} is insufficient for ${inventory.totalBytes} bytes plus margin`);
  }
  const report = {
    format: "render-worktrees-closeout-nas-dry-run-v1",
    ok: true,
    identity: RENDER_CLOSEOUT_IDENTITY,
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
};

const publish = (): void => {
  const log = logFactory("--publish");
  const { catalogue, collection } = catalogueAndIntent();
  assertExactTopLevel(SOURCE_ROOT, CLOSEOUT_EXPECTED_NAMES, "closeout source root");
  const shareRoot = mount();
  ensureAbsent(resolve(shareRoot, "collections", RENDER_CLOSEOUT_ASSET_ID, RENDER_CLOSEOUT_VERSION), "final collection");
  ensureAbsent(resolve(shareRoot, ...RENDER_CLOSEOUT_PUBLICATION_RECEIPT.split("/")), "publication receipt");
  const result = publishCollectionFixture({
    shareRoot,
    sourceRoot: SOURCE_ROOT,
    collection,
    catalogueCollections: catalogue.collections,
    transactionId: RENDER_CLOSEOUT_PUBLISH_TRANSACTION,
    hooks: transactionProgress("publish", log),
  });
  const report = {
    format: "render-worktrees-closeout-nas-publish-result-v1",
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
  const publication = readReceipt(shareRoot, RENDER_CLOSEOUT_PUBLICATION_RECEIPT);
  assertPublicationReceipt(publication);
  ensureAbsent(RESTORE_ROOT, "fresh restore destination");
  ensureAbsent(resolve(shareRoot, ...RENDER_CLOSEOUT_RESTORE_RECEIPT.split("/")), "restore receipt");
  mkdirSync(dirname(RESTORE_ROOT), { recursive: true });
  const result = restoreCollectionFixture({
    shareRoot,
    destinationPath: RESTORE_ROOT,
    collection,
    publicationReceiptPath: RENDER_CLOSEOUT_PUBLICATION_RECEIPT,
    transactionId: RENDER_CLOSEOUT_RESTORE_TRANSACTION,
    hooks: transactionProgress("restore", log),
  });
  const report = {
    format: "render-worktrees-closeout-nas-restore-result-v1",
    ok: true,
    identity: result.identity,
    publicationReceipt: RENDER_CLOSEOUT_PUBLICATION_RECEIPT,
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
  const publication = readReceipt(shareRoot, RENDER_CLOSEOUT_PUBLICATION_RECEIPT);
  const restoration = readReceipt(shareRoot, RENDER_CLOSEOUT_RESTORE_RECEIPT);
  const publishedSummary = assertPublicationReceipt(publication);
  const restoredSummary = assertRestoreReceipt(restoration, publication);
  assertSameSummary(publishedSummary, restoredSummary, "fresh restore");
  assertExactTopLevel(SOURCE_ROOT, CLOSEOUT_EXPECTED_NAMES, "closeout source root");
  const sourceInventory = inventoryWithProgress(SOURCE_ROOT, "source-registration", log);
  assertSameSummary(publishedSummary, inventorySummary(sourceInventory), "source registration inventory");

  ensureAbsent(MANIFEST_PATH, "tracked owner manifest");
  const manifest = buildRenderCloseoutOwnerManifest(sourceInventory);
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeJsonAtomic(MANIFEST_PATH, manifest);
  const manifestBytes = readFileSync(MANIFEST_PATH);
  const manifestSha256 = sha256(manifestBytes);
  const verifiedAt = text(restoration.value.verifiedAt, "restore.verifiedAt");
  const activeCatalogue = activateRenderCloseoutCollection({
    catalogue,
    inventory: sourceInventory,
    manifestBytes: manifestBytes.byteLength,
    manifestSha256,
    publication,
    restoration,
    verifiedAt,
    host: process.env.COMPUTERNAME ?? "Windows",
  });
  writeJsonAtomic(CATALOG_PATH, activeCatalogue);
  const report = {
    format: "render-worktrees-closeout-nas-registration-result-v1",
    ok: true,
    identity: RENDER_CLOSEOUT_IDENTITY,
    aggregate: inventorySummary(sourceInventory),
    ownerManifest: {
      path: RENDER_CLOSEOUT_MANIFEST_PATH,
      bytes: manifestBytes.byteLength,
      sha256: manifestSha256,
    },
    publicationReceipt: { path: publication.path, bytes: publication.bytes, sha256: publication.sha256 },
    restoreReceipt: { path: restoration.path, bytes: restoration.bytes, sha256: restoration.sha256 },
    sourceRetained: true,
    destructiveAction: false,
  };
  writeJsonAtomic(resolve(OPERATOR_ROOT, "registration-result.json"), report);
  log(JSON.stringify(report));
};

const main = (): void => {
  const command = process.argv[2] as Command | undefined;
  const commands: readonly Command[] = [
    "--copy-animation-residual",
    "--dry-run",
    "--publish",
    "--restore",
    "--register",
  ];
  if (process.argv.length !== 3 || command === undefined || !commands.includes(command)) {
    throw new Error(`usage: node scripts/nas-publish-render-worktrees-closeout.ts ${commands.join("|")}`);
  }
  if (command === "--copy-animation-residual") copyResidual();
  else if (command === "--dry-run") dryRun();
  else if (command === "--publish") publish();
  else if (command === "--restore") restore();
  else register();
};

const invokedPath = process.argv[1] === undefined ? null : pathToFileURL(resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) main();
