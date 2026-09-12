// Bounded publication command for the completed render worktrees.
//
// The command cannot select another source, collection, version, or destination. It copies without
// deleting, and every durable NAS write delegates to the shared transaction core.

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
  inventoryStableTree,
  parseNasAssetCatalogV1,
  writeJsonAtomic,
  type NasAssetCatalogV1,
  type NasTreeInventoryV1,
} from "./nas-asset-lib.ts";
import {
  NAS_PUBLICATION_RECEIPT_FORMAT,
  publishCollectionFixture,
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
export const RENDER_CLOSEOUT_PUBLICATION_RECEIPT =
  `_control/receipts/publication/${RENDER_CLOSEOUT_ASSET_ID}/${RENDER_CLOSEOUT_VERSION}/${RENDER_CLOSEOUT_PUBLISH_TRANSACTION}.json` as const;

const REPOSITORY_ROOT = resolve(import.meta.dirname, "..");
const CATALOG_PATH = resolve(REPOSITORY_ROOT, "docs/nas-assets.json");
const SOURCE_ROOT = resolve(REPOSITORY_ROOT, "out");
const ANIMATION_WORKTREE_ROOT = resolve(REPOSITORY_ROOT, "../snowflake-animation");
const ANIMATION_OUT_ROOT = resolve(ANIMATION_WORKTREE_ROOT, "out");
const ANIMATION_RESIDUAL_ROOT = resolve(SOURCE_ROOT, "animation-worktree-closeout");
const MAIN_WORKTREE_ROOT = resolve(REPOSITORY_ROOT, "../snowflake");
const MAIN_OUT_ROOT = resolve(MAIN_WORKTREE_ROOT, "out");
const MAIN_RESIDUAL_ROOT = resolve(SOURCE_ROOT, "main-worktree-closeout");
const NAMED_BUILD_ROOT = resolve(SOURCE_ROOT, "named-worktree-build");
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
  "shoot-library.mjs",
] as const;
const ANIMATION_EXPECTED_NAMES = [
  ...ANIMATION_RESIDUAL_NAMES,
  ANIMATION_EXCLUDED_ROOT,
  "restores",
].sort();
const MAIN_EXPECTED_NAMES = ["growth-pilot", "gutcheck-animation-queue"] as const;
const CLOSEOUT_EXPECTED_NAMES = [
  "animation-worktree-closeout",
  "main-worktree-closeout",
  "named-crystal-catalog",
  "named-crystal-gallery-site",
  "named-crystal-gallery-volume-previews",
  "named-crystal-volume-stability",
  "named-worktree-build",
] as const;

type Command =
  | "--copy-worktree-output"
  | "--dry-run"
  | "--publish"
  | "--register";

interface TreeSummary {
  readonly fileCount: number;
  readonly totalBytes: number;
  readonly treeSha256: string;
}

export interface SimpleTreeSummary {
  readonly fileCount: number;
  readonly totalBytes: number;
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

const addSimpleSummary = (left: SimpleTreeSummary, right: SimpleTreeSummary): SimpleTreeSummary => ({
  fileCount: left.fileCount + right.fileCount,
  totalBytes: left.totalBytes + right.totalBytes,
});

export const summarizeRegularOutput = (path: string): SimpleTreeSummary => {
  const status = lstatSync(path);
  if (status.isSymbolicLink()) throw new Error(`output copy refuses symbolic links: ${path}`);
  if (status.isFile()) return { fileCount: 1, totalBytes: status.size };
  if (!status.isDirectory()) throw new Error(`output copy refuses special files: ${path}`);
  return readdirSync(path).reduce<SimpleTreeSummary>(
    (sum, name) => addSimpleSummary(sum, summarizeRegularOutput(resolve(path, name))),
    { fileCount: 0, totalBytes: 0 },
  );
};

const summarizeSelectedOutput = (sourceRoot: string, selectedNames: readonly string[]): SimpleTreeSummary =>
  selectedNames.reduce<SimpleTreeSummary>(
    (sum, name) => addSimpleSummary(sum, summarizeRegularOutput(resolve(sourceRoot, name))),
    { fileCount: 0, totalBytes: 0 },
  );

const assertSameSimpleSummary = (
  expected: SimpleTreeSummary,
  actual: SimpleTreeSummary,
  label: string,
): void => {
  if (expected.fileCount !== actual.fileCount || expected.totalBytes !== actual.totalBytes) {
    throw new Error(`${label} file count or byte count differs from its source`);
  }
};

export const copySelectedOutput = (options: {
  readonly sourceRoot: string;
  readonly destinationRoot: string;
  readonly expectedNames: readonly string[];
  readonly selectedNames: readonly string[];
  readonly label: string;
}): SimpleTreeSummary => {
  if (existsSync(options.destinationRoot)) throw new Error(`${options.label} destination already exists`);
  assertExactTopLevel(options.sourceRoot, options.expectedNames, options.label);
  const source = summarizeSelectedOutput(options.sourceRoot, options.selectedNames);
  mkdirSync(options.destinationRoot, { recursive: false });
  for (const name of options.selectedNames) {
    cpSync(resolve(options.sourceRoot, name), resolve(options.destinationRoot, name), {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
  }
  const destination = summarizeRegularOutput(options.destinationRoot);
  assertSameSimpleSummary(source, destination, options.label);
  return destination;
};

export const copyDirectoryOutput = (options: {
  readonly sourceRoot: string;
  readonly destinationRoot: string;
  readonly label: string;
}): SimpleTreeSummary => {
  if (existsSync(options.destinationRoot)) throw new Error(`${options.label} destination already exists`);
  const source = summarizeRegularOutput(options.sourceRoot);
  cpSync(options.sourceRoot, options.destinationRoot, {
    recursive: true,
    errorOnExist: true,
    force: false,
  });
  const destination = summarizeRegularOutput(options.destinationRoot);
  assertSameSimpleSummary(source, destination, options.label);
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

const catalogueAndIntent = (): {
  readonly catalogue: NasAssetCatalogV1;
  readonly collection: NasAssetCatalogV1["collections"][number];
} => {
  const sourceBytes = readFileSync(CATALOG_PATH);
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
      restore: { ...collection.restore, status: "documented" as const },
      verification: {
        status: "full-hash" as const,
        at: options.verifiedAt.slice(0, 10),
        host: options.host,
        receipt: options.publication.path,
        limits: [
          `Publication receipt SHA-256 ${options.publication.sha256}; source, stage and final matched ${options.inventory.fileCount} files / ${options.inventory.totalBytes} bytes / tree SHA-256 ${options.inventory.treeSha256}.`,
          "Maker direction on 2026-09-04 requests the standard publication receipt and tracked owner manifest without another same-machine restore or independent verifier.",
          "The restore command is documented for the maker's test on another computer. All workstation sources, worktrees and branches remain in place until that test is confirmed.",
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

const copyWorktreeOutput = (): void => {
  const log = logFactory("--copy-worktree-output");
  ensureAbsent(ANIMATION_RESIDUAL_ROOT, "animation closeout destination");
  ensureAbsent(MAIN_RESIDUAL_ROOT, "main closeout destination");
  ensureAbsent(NAMED_BUILD_ROOT, "named build destination");

  mkdirSync(ANIMATION_RESIDUAL_ROOT);
  const animationOut = copySelectedOutput({
    sourceRoot: ANIMATION_OUT_ROOT,
    destinationRoot: resolve(ANIMATION_RESIDUAL_ROOT, "out"),
    expectedNames: ANIMATION_EXPECTED_NAMES,
    selectedNames: ANIMATION_RESIDUAL_NAMES,
    label: "animation out",
  });
  const animationBuild = copyDirectoryOutput({
    sourceRoot: resolve(ANIMATION_WORKTREE_ROOT, "app/dist"),
    destinationRoot: resolve(ANIMATION_RESIDUAL_ROOT, "app-dist"),
    label: "animation app build",
  });

  mkdirSync(MAIN_RESIDUAL_ROOT);
  const mainOut = copySelectedOutput({
    sourceRoot: MAIN_OUT_ROOT,
    destinationRoot: resolve(MAIN_RESIDUAL_ROOT, "out"),
    expectedNames: MAIN_EXPECTED_NAMES,
    selectedNames: MAIN_EXPECTED_NAMES,
    label: "main out",
  });

  mkdirSync(NAMED_BUILD_ROOT);
  const namedBuild = copyDirectoryOutput({
    sourceRoot: resolve(REPOSITORY_ROOT, "app/dist"),
    destinationRoot: resolve(NAMED_BUILD_ROOT, "app-dist"),
    label: "named-catalog app build",
  });

  const copied = [animationOut, animationBuild, mainOut, namedBuild].reduce<SimpleTreeSummary>(
    addSimpleSummary,
    { fileCount: 0, totalBytes: 0 },
  );
  const report = {
    format: "render-worktrees-output-copy-v1",
    ok: true,
    destination: "named-catalog/out",
    copied,
    sources: {
      animationOut,
      animationBuild,
      mainOut,
      namedBuild,
    },
    excluded: {
      animationScientific: "already active as gutcheck-growth-scientific@2026-08-26",
      interruptedRestore: "incomplete duplicate retained locally for later maker-authorized cleanup",
      dependencyCaches: "reinstallable node_modules directories",
    },
    sourceRetained: true,
    destructiveAction: false,
  };
  writeJsonAtomic(resolve(OPERATOR_ROOT, "worktree-output-copy.json"), report);
  log(JSON.stringify(report));
};

const dryRun = (): void => {
  const log = logFactory("--dry-run");
  const { collection } = catalogueAndIntent();
  assertExactTopLevel(SOURCE_ROOT, CLOSEOUT_EXPECTED_NAMES, "closeout source root");
  const shareRoot = mount();
  ensureAbsent(resolve(shareRoot, "collections", RENDER_CLOSEOUT_ASSET_ID, RENDER_CLOSEOUT_VERSION), "final collection");
  ensureAbsent(resolve(shareRoot, ...RENDER_CLOSEOUT_PUBLICATION_RECEIPT.split("/")), "publication receipt");
  const source = summarizeRegularOutput(SOURCE_ROOT);
  const filesystem = statfsSync(shareRoot);
  const freeBytes = filesystem.bavail * filesystem.bsize;
  if (freeBytes < source.totalBytes + FREE_SPACE_MARGIN_BYTES) {
    throw new Error(`NAS free space ${freeBytes} is insufficient for ${source.totalBytes} bytes plus margin`);
  }
  const report = {
    format: "render-worktrees-closeout-nas-dry-run-v1",
    ok: true,
    identity: RENDER_CLOSEOUT_IDENTITY,
    source,
    nasMount: "attached-marked-share",
    nasFreeBytes: freeBytes,
    finalLocator: collection.locator,
    finalAbsent: true,
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

const register = (): void => {
  const log = logFactory("--register");
  const { catalogue } = catalogueAndIntent();
  const shareRoot = mount();
  const publication = readReceipt(shareRoot, RENDER_CLOSEOUT_PUBLICATION_RECEIPT);
  const publishedSummary = assertPublicationReceipt(publication);
  assertExactTopLevel(SOURCE_ROOT, CLOSEOUT_EXPECTED_NAMES, "closeout source root");
  const sourceInventory = inventoryWithProgress(SOURCE_ROOT, "source-registration", log);
  assertSameSummary(publishedSummary, inventorySummary(sourceInventory), "source registration inventory");

  ensureAbsent(MANIFEST_PATH, "tracked owner manifest");
  const manifest = buildRenderCloseoutOwnerManifest(sourceInventory);
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeJsonAtomic(MANIFEST_PATH, manifest);
  const manifestBytes = readFileSync(MANIFEST_PATH);
  const manifestSha256 = sha256(manifestBytes);
  const verifiedAt = text(publication.value.verifiedAt, "publication.verifiedAt");
  const activeCatalogue = activateRenderCloseoutCollection({
    catalogue,
    inventory: sourceInventory,
    manifestBytes: manifestBytes.byteLength,
    manifestSha256,
    publication,
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
    restorePerformed: false,
    sourceRetained: true,
    destructiveAction: false,
  };
  writeJsonAtomic(resolve(OPERATOR_ROOT, "registration-result.json"), report);
  log(JSON.stringify(report));
};

const main = (): void => {
  const command = process.argv[2] as Command | undefined;
  const commands: readonly Command[] = [
    "--copy-worktree-output",
    "--dry-run",
    "--publish",
    "--register",
  ];
  if (process.argv.length !== 3 || command === undefined || !commands.includes(command)) {
    throw new Error(`usage: node scripts/nas-publish-render-worktrees-closeout.ts ${commands.join("|")}`);
  }
  if (command === "--copy-worktree-output") copyWorktreeOutput();
  else if (command === "--dry-run") dryRun();
  else if (command === "--publish") publish();
  else register();
};

const invokedPath = process.argv[1] === undefined ? null : pathToFileURL(resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) main();
