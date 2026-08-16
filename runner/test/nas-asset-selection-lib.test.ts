import { createHash } from "node:crypto";
import {
  appendFileSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import {
  loadBoundCollectionSelection,
} from "../../scripts/nas-asset-selection-lib.ts";
import {
  parseNasAssetCatalogV1,
  type NasAssetCatalogV1,
  type NasAssetCollectionV1,
  type NasManifestSelectorV1,
} from "../../scripts/nas-asset-lib.ts";
import { verifyNasAssets } from "../../scripts/nas-assets.ts";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "..", "..");
const REAL_CATALOGUE = parseNasAssetCatalogV1(
  readFileSync(join(REPOSITORY_ROOT, "docs", "nas-assets.json"), "utf8"),
);
const temporaryRoots: string[] = [];

const temporaryRoot = (label: string): string => {
  const root = mkdtempSync(join(tmpdir(), `nas-selection-${label}-`));
  temporaryRoots.push(root);
  return root;
};

afterAll(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
});

const sha256 = (bytes: string | Buffer): string => createHash("sha256").update(bytes).digest("hex");

const fixtureCatalogue = (
  manifestBytes: Buffer,
  selector: NasManifestSelectorV1,
  aggregate: { readonly files: number; readonly bytes: number },
  options: {
    readonly storage?: "tracked" | "nas-private";
    readonly locator?: string | null;
    readonly historicalRepoPath?: string | null;
  } = {},
): NasAssetCatalogV1 => {
  const template = REAL_CATALOGUE.collections.find((entry) => entry.assetId === "earlier-phase3-visual");
  if (template === undefined) throw new Error("missing fixture collection template");
  const collection: NasAssetCollectionV1 = {
    ...structuredClone(template),
    assetId: "fixture-selection",
    version: "v1",
    state: options.locator === null ? "unavailable" : "active",
    locator: options.locator === undefined ? "payload" : options.locator,
    historicalRepoPath: options.historicalRepoPath === undefined
      ? "payload"
      : options.historicalRepoPath,
    aggregate,
    ownerManifest: {
      storage: options.storage ?? "tracked",
      path: "manifests/owner.json",
      format: "fixture-owner-v1",
      bytes: manifestBytes.byteLength,
      sha256: sha256(manifestBytes),
      selector,
    },
    unresolved: options.locator === null ? ["fixture payload is intentionally unavailable"] : [],
  };
  return parseNasAssetCatalogV1(JSON.stringify({
    ...REAL_CATALOGUE,
    collections: [collection],
    overlays: [],
    systemExclusions: [],
  }));
};

const writeFixtureManifest = (root: string, bytes: Buffer): void => {
  mkdirSync(join(root, "manifests"), { recursive: true });
  writeFileSync(join(root, "manifests", "owner.json"), bytes);
};

describe("exact catalogue-bound owner-manifest selection", () => {
  it("loads the migrated Phase 3 ledger selection from its governed locator", () => {
    const selection = loadBoundCollectionSelection({
      catalogue: REAL_CATALOGUE,
      collection: "earlier-phase3-visual@2026-08-01",
      repoRoot: REPOSITORY_ROOT,
      shareRoot: null,
    });
    expect(selection).toMatchObject({
      identity: "earlier-phase3-visual@2026-08-01",
      state: "active",
      locator: "collections/earlier-phase3-visual/2026-08-01/payload",
      ownershipRoot: "collections/earlier-phase3-visual/2026-08-01/payload",
      fileCount: 10,
      totalBytes: 984_164,
    });
    expect(selection.files[0]).toEqual({
      sharePath: "collections/earlier-phase3-visual/2026-08-01/payload/fallback-webgl2.png",
      relativePath: "fallback-webgl2.png",
      bytes: 134_851,
      sha256: "fad6b3bbf9df70e2e90a4d0579fa51311c84e41ba56f1dd996fbbd88e987b054",
    });
    expect(selection.treeSha256).toBe(sha256(JSON.stringify(selection.files.map((file) => [
      file.relativePath,
      file.bytes,
      file.sha256,
    ]))));
  });

  it("uses the historical root for an unavailable json-tree-key collection", () => {
    const selection = loadBoundCollectionSelection({
      catalogue: REAL_CATALOGUE,
      collection: "earlier-phase2b@2026-08-01",
      repoRoot: REPOSITORY_ROOT,
      shareRoot: null,
    });
    expect(selection).toMatchObject({
      state: "unavailable",
      locator: null,
      ownershipRoot: "out/phase2b",
      fileCount: 11,
      totalBytes: 60_438_811,
    });
    expect(selection.files.every((file) => file.sharePath.startsWith("out/phase2b/"))).toBe(true);
    expect(selection.files.every((file) => !file.relativePath.startsWith("out/phase2b/"))).toBe(true);
  });

  it("applies path-prefix inclusions and exclusions before exact aggregate binding", () => {
    const rows = [
      { path: "payload/keep/a.bin", bytes: 3, sha256: sha256("one") },
      { path: "payload/skip/b.bin", bytes: 4, sha256: sha256("two!") },
      { path: "other/not-owned.bin", bytes: 5, sha256: sha256("other") },
    ];
    const bytes = Buffer.from(JSON.stringify({ files: rows }));
    const root = temporaryRoot("prefixes");
    writeFixtureManifest(root, bytes);
    const selection = loadBoundCollectionSelection({
      catalogue: fixtureCatalogue(bytes, {
        kind: "path-prefixes",
        include: ["payload"],
        exclude: ["payload/skip"],
      }, { files: 1, bytes: 3 }),
      collection: "fixture-selection@v1",
      repoRoot: root,
      shareRoot: null,
    });
    expect(selection.files).toEqual([{
      sharePath: "payload/keep/a.bin",
      relativePath: "keep/a.bin",
      bytes: 3,
      sha256: sha256("one"),
    }]);
  });

  it("selects NAS-private JSONL rows and prefixes their manifest-relative paths", () => {
    const bytes = Buffer.from([
      JSON.stringify({ recordType: "header" }),
      JSON.stringify({
        recordType: "file", path: "a.bin", bytes: 3, sha256: sha256("one"), storageClass: "private",
      }),
      JSON.stringify({
        recordType: "file", path: "not-selected.bin", bytes: 4, sha256: sha256("two!"), storageClass: "other",
      }),
      "",
    ].join("\n"));
    const shareRoot = temporaryRoot("jsonl");
    writeFixtureManifest(shareRoot, bytes);
    const selection = loadBoundCollectionSelection({
      catalogue: fixtureCatalogue(bytes, {
        kind: "jsonl-field-equals",
        recordType: "file",
        field: "storageClass",
        equals: "private",
      }, { files: 1, bytes: 3 }, { storage: "nas-private" }),
      collection: "fixture-selection@v1",
      repoRoot: temporaryRoot("unused-repo"),
      shareRoot,
    });
    expect(selection.ownerManifestSha256).toBe(sha256(bytes));
    expect(selection.files[0]).toMatchObject({ sharePath: "payload/a.bin", relativePath: "a.bin" });
  });

  it("preserves all-selector full paths and strips an exactly equal single-file locator", () => {
    const bytes = Buffer.from(JSON.stringify({
      files: [{ path: "payload.bin", bytes: 3, sha256: sha256("one") }],
    }));
    const root = temporaryRoot("all");
    writeFixtureManifest(root, bytes);
    const selection = loadBoundCollectionSelection({
      catalogue: fixtureCatalogue(bytes, { kind: "all" }, { files: 1, bytes: 3 }, {
        locator: "payload.bin",
        historicalRepoPath: "payload.bin",
      }),
      collection: "fixture-selection@v1",
      repoRoot: root,
      shareRoot: null,
    });
    expect(selection.files[0]?.relativePath).toBe("");
  });

  it("requires an exact versioned catalogue identity", () => {
    expect(() => loadBoundCollectionSelection({
      catalogue: REAL_CATALOGUE,
      collection: "earlier-phase3-visual",
      repoRoot: REPOSITORY_ROOT,
      shareRoot: null,
    })).toThrow(/exact @version/u);
    expect(() => loadBoundCollectionSelection({
      catalogue: REAL_CATALOGUE,
      collection: "absent@v1",
      repoRoot: REPOSITORY_ROOT,
      shareRoot: null,
    })).toThrow(/exactly one catalogue entry/u);
  });

  it("refuses documented-only and missing owner manifests", () => {
    const template = REAL_CATALOGUE.collections.find((entry) => entry.assetId === "earlier-phase3-visual");
    if (template?.ownerManifest === null || template?.ownerManifest === undefined) {
      throw new Error("missing selection refusal template");
    }
    const documentedCatalogue = {
      ...REAL_CATALOGUE,
      collections: [{
        ...template,
        ownerManifest: {
          ...template.ownerManifest,
          selector: { kind: "documented-only", record: "docs/local-assets.md" },
        },
      }],
    } as NasAssetCatalogV1;
    expect(() => loadBoundCollectionSelection({
      catalogue: documentedCatalogue,
      collection: "earlier-phase3-visual@2026-08-01",
      repoRoot: REPOSITORY_ROOT,
      shareRoot: null,
    })).toThrow(/documented-only/u);
    const missingCatalogue = {
      ...REAL_CATALOGUE,
      collections: [{ ...template, state: "provisional", ownerManifest: null }],
    } as NasAssetCatalogV1;
    expect(() => loadBoundCollectionSelection({
      catalogue: missingCatalogue,
      collection: "earlier-phase3-visual@2026-08-01",
      repoRoot: REPOSITORY_ROOT,
      shareRoot: null,
    })).toThrow(/no owner manifest/u);
  });

  it("requires a share root for NAS-private manifests", () => {
    const bytes = Buffer.from("{}");
    expect(() => loadBoundCollectionSelection({
      catalogue: fixtureCatalogue(bytes, { kind: "all" }, { files: 1, bytes: 1 }, {
        storage: "nas-private",
      }),
      collection: "fixture-selection@v1",
      repoRoot: temporaryRoot("private-detached"),
      shareRoot: null,
    })).toThrow(/attached validated share root/u);
  });

  it("refuses owner-manifest binding drift before parsing rows", () => {
    const bound = Buffer.from(JSON.stringify({
      files: [{ path: "payload/a.bin", bytes: 3, sha256: sha256("one") }],
    }));
    const root = temporaryRoot("binding-drift");
    writeFixtureManifest(root, Buffer.from(`${bound.toString("utf8")} `));
    expect(() => loadBoundCollectionSelection({
      catalogue: fixtureCatalogue(bound, { kind: "all" }, { files: 1, bytes: 3 }),
      collection: "fixture-selection@v1",
      repoRoot: root,
      shareRoot: null,
    })).toThrow(/byte length or SHA-256/u);
  });

  it.each([
    {
      label: "utf8-bom",
      bytes: Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]),
        Buffer.from(JSON.stringify({
          files: [{ path: "payload/secret-bom-file.bin", bytes: 3, sha256: sha256("one") }],
        })),
      ]),
      expected: /byte-order mark/u,
      secret: "secret-bom-file.bin",
    },
    {
      label: "invalid-utf8",
      bytes: Buffer.concat([
        Buffer.from(`{"files":[{"path":"payload/secret-invalid-file.bin","bytes":3,"sha256":"${sha256("one")}"}],"note":"`),
        Buffer.from([0xff]),
        Buffer.from('"}'),
      ]),
      expected: /not valid UTF-8/u,
      secret: "secret-invalid-file.bin",
    },
  ])("gives load and read-only verify the same strict $label semantics", ({ label, bytes, expected, secret }) => {
    const root = temporaryRoot(label);
    writeFixtureManifest(root, bytes);
    const catalogue = fixtureCatalogue(bytes, { kind: "all" }, { files: 1, bytes: 3 });
    expect(() => loadBoundCollectionSelection({
      catalogue,
      collection: "fixture-selection@v1",
      repoRoot: root,
      shareRoot: null,
    })).toThrow(expected);

    const report = verifyNasAssets(
      catalogue,
      root,
      {},
      null,
      ["fixture-selection@v1"],
      false,
      [],
    );
    expect(report.ok).toBe(false);
    expect(report.defects).toContainEqual({ code: "owner-manifest-selector-invalid", count: 1 });
    expect(JSON.stringify(report)).not.toContain(secret);
  });

  it("refuses empty selections even when the catalogue aggregate is zero", () => {
    const bytes = Buffer.from(JSON.stringify({ files: [] }));
    const root = temporaryRoot("empty");
    writeFixtureManifest(root, bytes);
    expect(() => loadBoundCollectionSelection({
      catalogue: fixtureCatalogue(bytes, { kind: "all" }, { files: 0, bytes: 0 }),
      collection: "fixture-selection@v1",
      repoRoot: root,
      shareRoot: null,
    })).toThrow(/selected no files/u);
  });

  it("refuses selected duplicate, case-alias, and non-NFC paths", () => {
    const cases: readonly [string, readonly Record<string, unknown>[], RegExp][] = [
      ["duplicate", [
        { path: "payload/a.bin", bytes: 3, sha256: sha256("one") },
        { path: "payload/a.bin", bytes: 3, sha256: sha256("one") },
      ], /duplicate or case\/Unicode/u],
      ["case-alias", [
        { path: "payload/A.bin", bytes: 3, sha256: sha256("one") },
        { path: "payload/a.bin", bytes: 4, sha256: sha256("two!") },
      ], /duplicate or case\/Unicode/u],
      ["non-nfc", [
        { path: "payload/cafe\u0301.bin", bytes: 3, sha256: sha256("one") },
      ], /safe NFC/u],
    ];
    for (const [label, rows, expected] of cases) {
      const bytes = Buffer.from(JSON.stringify({ files: rows }));
      const root = temporaryRoot(label);
      writeFixtureManifest(root, bytes);
      expect(() => loadBoundCollectionSelection({
        catalogue: fixtureCatalogue(bytes, { kind: "all" }, {
          files: rows.length,
          bytes: rows.reduce((sum, row) => sum + Number(row.bytes), 0),
        }),
        collection: "fixture-selection@v1",
        repoRoot: root,
        shareRoot: null,
      })).toThrow(expected);
    }
  });

  it("refuses a selected file path that aliases an ancestor directory", () => {
    const rows = [
      { path: "payload/a", bytes: 3, sha256: sha256("one") },
      { path: "payload/A/b.bin", bytes: 4, sha256: sha256("two!") },
    ];
    const bytes = Buffer.from(JSON.stringify({ files: rows }));
    const root = temporaryRoot("file-ancestor");
    writeFixtureManifest(root, bytes);
    expect(() => loadBoundCollectionSelection({
      catalogue: fixtureCatalogue(bytes, { kind: "all" }, { files: 2, bytes: 7 }),
      collection: "fixture-selection@v1",
      repoRoot: root,
      shareRoot: null,
    })).toThrow(/ancestor of another selected file/u);
  });

  it("refuses exact-containment violations and catalogue aggregate mismatches", () => {
    const bytes = Buffer.from(JSON.stringify({
      files: [{ path: "other/a.bin", bytes: 3, sha256: sha256("one") }],
    }));
    const root = temporaryRoot("outside");
    writeFixtureManifest(root, bytes);
    expect(() => loadBoundCollectionSelection({
      catalogue: fixtureCatalogue(bytes, { kind: "all" }, { files: 1, bytes: 3 }),
      collection: "fixture-selection@v1",
      repoRoot: root,
      shareRoot: null,
    })).toThrow(/outside the collection ownership root/u);

    const inside = Buffer.from(JSON.stringify({
      files: [{ path: "payload/a.bin", bytes: 3, sha256: sha256("one") }],
    }));
    const aggregateRoot = temporaryRoot("aggregate");
    writeFixtureManifest(aggregateRoot, inside);
    expect(() => loadBoundCollectionSelection({
      catalogue: fixtureCatalogue(inside, { kind: "all" }, { files: 1, bytes: 4 }),
      collection: "fixture-selection@v1",
      repoRoot: aggregateRoot,
      shareRoot: null,
    })).toThrow(/catalogue aggregate/u);
  });

  it("refuses hard-linked manifests and descriptor-visible mutation during a bounded read", () => {
    const bytes = Buffer.from(JSON.stringify({
      files: [{ path: "payload/a.bin", bytes: 3, sha256: sha256("one") }],
    }));
    const linkedRoot = temporaryRoot("hardlink");
    mkdirSync(join(linkedRoot, "manifests"));
    const original = join(linkedRoot, "original.json");
    writeFileSync(original, bytes);
    linkSync(original, join(linkedRoot, "manifests", "owner.json"));
    expect(() => loadBoundCollectionSelection({
      catalogue: fixtureCatalogue(bytes, { kind: "all" }, { files: 1, bytes: 3 }),
      collection: "fixture-selection@v1",
      repoRoot: linkedRoot,
      shareRoot: null,
    })).toThrow(/missing, unsafe, or not an ordinary file/u);

    const changingRoot = temporaryRoot("changing");
    writeFixtureManifest(changingRoot, bytes);
    let changed = false;
    expect(() => loadBoundCollectionSelection({
      catalogue: fixtureCatalogue(bytes, { kind: "all" }, { files: 1, bytes: 3 }),
      collection: "fixture-selection@v1",
      repoRoot: changingRoot,
      shareRoot: null,
      hooks: {
        afterManifestChunk: () => {
          if (changed) return;
          changed = true;
          appendFileSync(join(changingRoot, "manifests", "owner.json"), " ");
        },
      },
    })).toThrow(/changed while reading/u);
    expect(changed).toBe(true);
  });
});
