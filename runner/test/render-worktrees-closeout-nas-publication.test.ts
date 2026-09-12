import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import {
  RENDER_CLOSEOUT_IDENTITY,
  RENDER_CLOSEOUT_LOCATOR,
  RENDER_CLOSEOUT_MANIFEST_PATH,
  activateRenderCloseoutCollection,
  buildRenderCloseoutOwnerManifest,
  copySelectedOutput,
} from "../../scripts/nas-publish-render-worktrees-closeout.ts";
import {
  inventoryStableTree,
  parseNasAssetCatalogV1,
  type NasTreeInventoryV1,
} from "../../scripts/nas-asset-lib.ts";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CATALOG = parseNasAssetCatalogV1(readFileSync(`${REPOSITORY_ROOT}docs/nas-assets.json`, "utf8"));
const PROVISIONAL_CATALOG = parseNasAssetCatalogV1(JSON.stringify({
  ...CATALOG,
  collections: CATALOG.collections.map((collection) =>
    `${collection.assetId}@${collection.version}` === RENDER_CLOSEOUT_IDENTITY
      ? {
          ...collection,
          state: "provisional",
          aggregate: { files: 0, bytes: 0 },
          ownerManifest: null,
          verification: {
            status: "unavailable",
            at: null,
            host: null,
            receipt: null,
            limits: ["Synthetic provisional fixture for the activation unit test."],
          },
          unresolved: ["Synthetic publication pending."],
        }
      : collection,
  ),
}));
const DIGEST_A = "a".repeat(64);
const DIGEST_B = "b".repeat(64);
const DIGEST_C = "c".repeat(64);
const TEMP_ROOTS: string[] = [];

const INVENTORY: NasTreeInventoryV1 = {
  format: "snowflake-nas-tree-inventory-v1",
  fileCount: 2,
  totalBytes: 7,
  treeSha256: DIGEST_C,
  files: [
    { path: "named-crystal-catalog/run/frame.bin", byteLength: 3, sha256: DIGEST_A },
    { path: "named-crystal-gallery-volume-previews/card.png", byteLength: 4, sha256: DIGEST_B },
  ],
};

afterEach(() => {
  for (const root of TEMP_ROOTS.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("render worktree closeout NAS publication", () => {
  it("builds one public owner row per exact payload file", () => {
    expect(buildRenderCloseoutOwnerManifest(INVENTORY)).toEqual({
      format: "snowflake-nas-ledger-v1",
      collection: RENDER_CLOSEOUT_IDENTITY,
      locator: RENDER_CLOSEOUT_LOCATOR,
      treeSha256: DIGEST_C,
      files: [
        {
          path: `${RENDER_CLOSEOUT_LOCATOR}/named-crystal-catalog/run/frame.bin`,
          bytes: 3,
          sha256: DIGEST_A,
        },
        {
          path: `${RENDER_CLOSEOUT_LOCATOR}/named-crystal-gallery-volume-previews/card.png`,
          bytes: 4,
          sha256: DIGEST_B,
        },
      ],
    });
  });

  it("activates only the provisional closeout collection after publication", () => {
    const manifest = buildRenderCloseoutOwnerManifest(INVENTORY);
    const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
    const publication = {
      path: "_control/receipts/publication/render-worktrees-closeout/2026-09-04/publish.json",
      bytes: 100,
      sha256: DIGEST_A,
      value: {},
    };
    const activated = activateRenderCloseoutCollection({
      catalogue: PROVISIONAL_CATALOG,
      inventory: INVENTORY,
      manifestBytes: manifestBytes.byteLength,
      manifestSha256: createHash("sha256").update(manifestBytes).digest("hex"),
      publication,
      verifiedAt: "2026-09-04T20:00:00.000Z",
      host: "Windows-test",
    });
    const selected = activated.collections.find(
      (collection) => `${collection.assetId}@${collection.version}` === RENDER_CLOSEOUT_IDENTITY,
    );

    expect(selected).toMatchObject({
      state: "active",
      aggregate: { files: 2, bytes: 7 },
      ownerManifest: {
        storage: "tracked",
        path: RENDER_CLOSEOUT_MANIFEST_PATH,
        selector: { kind: "path-prefixes", include: [RENDER_CLOSEOUT_LOCATOR], exclude: [] },
      },
      restore: { status: "documented" },
      verification: { status: "full-hash", at: "2026-09-04", host: "Windows-test" },
      unresolved: [],
    });
    expect(
      activated.collections.filter(
        (collection) => `${collection.assetId}@${collection.version}` !== RENDER_CLOSEOUT_IDENTITY,
      ),
    ).toEqual(
      PROVISIONAL_CATALOG.collections.filter(
        (collection) => `${collection.assetId}@${collection.version}` !== RENDER_CLOSEOUT_IDENTITY,
      ),
    );
  });

  it("copies selected output and compares its file and byte counts", () => {
    const root = mkdtempSync(join(tmpdir(), "render-closeout-test-"));
    TEMP_ROOTS.push(root);
    const source = join(root, "source");
    const destination = join(root, "destination");
    mkdirSync(join(source, "keep-dir"), { recursive: true });
    mkdirSync(join(source, "growth-scientific"));
    writeFileSync(join(source, "keep-dir", "frame.bin"), Buffer.from([1, 2, 3]));
    writeFileSync(join(source, "note.log"), "done\n");
    writeFileSync(join(source, "growth-scientific", "large.bin"), Buffer.from([9, 9, 9]));
    const expectedNames = ["growth-scientific", "keep-dir", "note.log"];
    const selectedNames = ["keep-dir", "note.log"];

    const copied = copySelectedOutput({
      sourceRoot: source,
      destinationRoot: destination,
      expectedNames,
      selectedNames,
      label: "test output",
    });
    expect(copied).toEqual({ fileCount: 2, totalBytes: 8 });
    expect(inventoryStableTree(destination).files.map((file) => file.path)).toEqual([
      "keep-dir/frame.bin",
      "note.log",
    ]);

    writeFileSync(join(source, "unexpected.bin"), "unexpected");
    expect(() => copySelectedOutput({
      sourceRoot: source,
      destinationRoot: join(root, "refused"),
      expectedNames,
      selectedNames,
      label: "test output",
    })).toThrow(/top-level names changed/u);
  });
});
