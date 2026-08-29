import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  GROWTH_SCIENTIFIC_IDENTITY,
  GROWTH_SCIENTIFIC_LOCATOR,
  GROWTH_SCIENTIFIC_MANIFEST_PATH,
  activateGrowthScientificCollection,
  buildGrowthScientificOwnerManifest,
} from "../../scripts/nas-publish-gutcheck-growth-scientific.ts";
import {
  parseNasAssetCatalogV1,
  type NasTreeInventoryV1,
} from "../../scripts/nas-asset-lib.ts";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CATALOG = parseNasAssetCatalogV1(
  readFileSync(`${REPOSITORY_ROOT}docs/nas-assets.json`, "utf8"),
);
const DIGEST_A = "a".repeat(64);
const DIGEST_B = "b".repeat(64);
const DIGEST_C = "c".repeat(64);

const INVENTORY: NasTreeInventoryV1 = {
  format: "snowflake-nas-tree-inventory-v1",
  fileCount: 2,
  totalBytes: 7,
  treeSha256: DIGEST_C,
  files: [
    { path: "crystal-a/frame-000.bin", byteLength: 3, sha256: DIGEST_A },
    { path: "crystal-b/state.bin", byteLength: 4, sha256: DIGEST_B },
  ],
};

describe("gut-check scientific NAS publication registration", () => {
  it("builds one public owner row per exact payload file", () => {
    expect(buildGrowthScientificOwnerManifest(INVENTORY)).toEqual({
      format: "snowflake-nas-ledger-v1",
      collection: GROWTH_SCIENTIFIC_IDENTITY,
      locator: GROWTH_SCIENTIFIC_LOCATOR,
      treeSha256: DIGEST_C,
      files: [
        {
          path: `${GROWTH_SCIENTIFIC_LOCATOR}/crystal-a/frame-000.bin`,
          bytes: 3,
          sha256: DIGEST_A,
        },
        {
          path: `${GROWTH_SCIENTIFIC_LOCATOR}/crystal-b/state.bin`,
          bytes: 4,
          sha256: DIGEST_B,
        },
      ],
    });
  });

  it("activates only the provisional collection after both receipt bindings exist", () => {
    const manifest = buildGrowthScientificOwnerManifest(INVENTORY);
    const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
    const publication = {
      path: "_control/receipts/publication/gutcheck-growth-scientific/2026-08-26/publish.json",
      bytes: 100,
      sha256: DIGEST_A,
      value: {},
    };
    const restore = {
      path: "_control/receipts/restore/gutcheck-growth-scientific/2026-08-26/restore.json",
      bytes: 101,
      sha256: DIGEST_B,
      value: {},
    };
    const activated = activateGrowthScientificCollection({
      catalogue: CATALOG,
      inventory: INVENTORY,
      manifestBytes: manifestBytes.byteLength,
      manifestSha256: createHash("sha256").update(manifestBytes).digest("hex"),
      publication,
      restore,
      verifiedAt: "2026-08-29T20:00:00.000Z",
      host: "Windows-test",
    });
    const selected = activated.collections.find(
      (collection) => `${collection.assetId}@${collection.version}` === GROWTH_SCIENTIFIC_IDENTITY,
    );

    expect(selected).toMatchObject({
      state: "active",
      aggregate: { files: 2, bytes: 7 },
      ownerManifest: {
        storage: "tracked",
        path: GROWTH_SCIENTIFIC_MANIFEST_PATH,
        format: "snowflake-nas-ledger-v1",
        selector: { kind: "path-prefixes", include: [GROWTH_SCIENTIFIC_LOCATOR], exclude: [] },
      },
      restore: { status: "tested" },
      verification: { status: "full-hash", at: "2026-08-29", host: "Windows-test" },
      unresolved: [],
    });
    expect(
      activated.collections.filter(
        (collection) => `${collection.assetId}@${collection.version}` !== GROWTH_SCIENTIFIC_IDENTITY,
      ),
    ).toEqual(
      CATALOG.collections.filter(
        (collection) => `${collection.assetId}@${collection.version}` !== GROWTH_SCIENTIFIC_IDENTITY,
      ),
    );
  });
});
