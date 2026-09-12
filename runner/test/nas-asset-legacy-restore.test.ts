import { createHash } from "node:crypto";
import {
  appendFileSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import {
  NasLegacyRestoreError,
  restoreLegacyNasCollection,
  verifyLegacyNasRestore,
} from "../../scripts/nas-asset-legacy-restore-lib.ts";
import {
  parseNasAssetCatalogV1,
  type NasAssetCatalogV1,
  type NasAssetCollectionV1,
  type NasCollectionState,
  type NasManifestSelectorV1,
} from "../../scripts/nas-asset-lib.ts";
import { NAS_SHARE_MARKER, NAS_SHARE_MARKER_PATH } from "../../scripts/nas-root.ts";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "..", "..");
const REAL_CATALOGUE = parseNasAssetCatalogV1(
  readFileSync(join(REPOSITORY_ROOT, "docs", "nas-assets.json"), "utf8"),
);
const temporaryRoots: string[] = [];

const temporaryRoot = (label: string): string => {
  const root = mkdtempSync(join(tmpdir(), `nas-legacy-restore-${label}-`));
  temporaryRoots.push(root);
  return root;
};

// Creating symlinks on Windows needs SeCreateSymbolicLinkPrivilege (admin or Developer Mode);
// without it the escape fixtures below throw EPERM during setup, misreporting the guards as
// broken. Same probe as nas-asset-lib.test.ts; capable hosts still run every guard.
const CAN_SYMLINK = (() => {
  const root = temporaryRoot("symlink-probe");
  try {
    symlinkSync(join(root, "missing"), join(root, "link"));
    rmSync(join(root, "link"));
    return true;
  } catch {
    return false;
  }
})();

afterAll(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
});

const sha256 = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");

interface FixtureFile {
  readonly relativePath: string;
  readonly bytes: Buffer;
  readonly storageClass?: string;
}

interface RestoreFixture {
  readonly repo: string;
  readonly share: string;
  readonly catalogue: NasAssetCatalogV1;
  readonly identity: string;
  readonly destination: string;
  readonly files: readonly FixtureFile[];
}

const collectionTemplate = (privateManifest: boolean): NasAssetCollectionV1 => {
  const assetId = privateManifest ? "research-private-freeze" : "gutcheck-generated-public";
  const template = REAL_CATALOGUE.collections.find((entry) => entry.assetId === assetId);
  if (template === undefined) throw new Error("fixture collection template is missing");
  return structuredClone(template);
};

const fixtureCollection = (
  manifestBytes: Buffer,
  files: readonly FixtureFile[],
  options: {
    readonly assetId?: string;
    readonly state?: NasCollectionState;
    readonly locator?: string | null;
    readonly privateManifest?: boolean;
    readonly selector?: NasManifestSelectorV1;
  } = {},
): NasAssetCollectionV1 => {
  const privateManifest = options.privateManifest ?? false;
  const state = options.state ?? "active";
  const locator = options.locator === undefined ? "payload" : options.locator;
  const selectedStorage = options.selector?.kind === "jsonl-field-equals"
    ? options.selector.equals
    : null;
  const selected = selectedStorage === null
    ? files
    : files.filter((file) => file.storageClass === selectedStorage);
  const template = collectionTemplate(privateManifest);
  return {
    ...template,
    assetId: options.assetId ?? "fixture-legacy",
    version: "v1",
    state,
    locator,
    historicalRepoPath: "payload",
    legacyAliases: [],
    aggregate: {
      files: selected.length,
      bytes: selected.reduce((sum, file) => sum + file.bytes.byteLength, 0),
    },
    ownerManifest: {
      storage: privateManifest ? "nas-private" : "tracked",
      path: privateManifest ? "private/owner.jsonl" : "manifests/owner.json",
      format: privateManifest ? "fixture-private-jsonl-v1" : "fixture-owner-v1",
      bytes: manifestBytes.byteLength,
      sha256: sha256(manifestBytes),
      selector: options.selector ?? { kind: "all" },
    },
    serve: { policy: "deny", prefixes: [] },
    restore: {
      status: "documented",
      command: "npm run assets:restore -- --collection fixture-legacy@v1 --to out/restores/fixture-legacy-v1",
      verifyCommand: "npm run assets:verify-restored -- --collection fixture-legacy@v1 --from out/restores/fixture-legacy-v1",
      record: "docs/nas-inventory-audit-20260815.md",
    },
    verification: {
      status: "manifest-only",
      at: "2026-08-15",
      host: "fixture",
      receipt: "docs/nas-inventory-audit-20260815.md",
      limits: ["Fixture selection only."],
    },
    unresolved: state === "active" ? [] : ["Fixture collection is intentionally not active."],
  };
};

const fixtureCatalogue = (collection: NasAssetCollectionV1): NasAssetCatalogV1 =>
  parseNasAssetCatalogV1(JSON.stringify({
    ...REAL_CATALOGUE,
    collections: [collection],
    overlays: [],
    systemExclusions: [],
  }));

const makeFixture = (
  label: string,
  options: {
    readonly files?: readonly FixtureFile[];
    readonly state?: NasCollectionState;
    readonly privateManifest?: boolean;
    readonly selector?: NasManifestSelectorV1;
    readonly assetId?: string;
    readonly locator?: string | null;
  } = {},
): RestoreFixture => {
  const repo = temporaryRoot(`${label}-repo`);
  const share = temporaryRoot(`${label}-share`);
  writeFileSync(join(share, NAS_SHARE_MARKER_PATH), `${JSON.stringify(NAS_SHARE_MARKER)}\n`);
  const files = options.files ?? [
    { relativePath: "a.bin", bytes: Buffer.from("one") },
    { relativePath: "nested/b.bin", bytes: Buffer.from("two!") },
  ];
  for (const file of files) {
    const target = join(share, "payload", ...file.relativePath.split("/"));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.bytes);
  }
  let manifestBytes: Buffer;
  if (options.privateManifest) {
    manifestBytes = Buffer.from([
      JSON.stringify({ recordType: "header", schemaVersion: 1 }),
      ...files.map((file) => JSON.stringify({
        recordType: "file",
        path: file.relativePath,
        bytes: file.bytes.byteLength,
        sha256: sha256(file.bytes),
        storageClass: file.storageClass ?? "private",
      })),
      "",
    ].join("\n"));
    mkdirSync(join(share, "private"));
    writeFileSync(join(share, "private", "owner.jsonl"), manifestBytes);
  } else {
    manifestBytes = Buffer.from(JSON.stringify({
      files: files.map((file) => ({
        path: `payload/${file.relativePath}`,
        bytes: file.bytes.byteLength,
        sha256: sha256(file.bytes),
      })),
    }));
    mkdirSync(join(repo, "manifests"));
    writeFileSync(join(repo, "manifests", "owner.json"), manifestBytes);
  }
  const collection = fixtureCollection(manifestBytes, files, {
    assetId: options.assetId,
    state: options.state,
    locator: options.locator,
    privateManifest: options.privateManifest,
    selector: options.selector,
  });
  const catalogue = fixtureCatalogue(collection);
  return {
    repo,
    share,
    catalogue,
    identity: `${collection.assetId}@${collection.version}`,
    destination: join(repo, "out", "restores", `${collection.assetId}-${collection.version}`),
    files,
  };
};

const restore = (fixture: RestoreFixture, destination = fixture.destination) =>
  restoreLegacyNasCollection({
    catalogue: fixture.catalogue,
    collection: fixture.identity,
    repoRoot: fixture.repo,
    shareRoot: fixture.share,
    destinationPath: destination,
  });

describe("legacy NAS restore and restored-tree verifier", () => {
  it("restores one active exact version into fresh out/restores staging and verifies it again", () => {
    const fixture = makeFixture("success");
    const restored = restore(fixture);
    expect(restored).toMatchObject({
      command: "restore",
      ok: true,
      collection: "fixture-legacy@v1",
      destinationScope: "repo-out-restores",
      fileCount: 2,
      totalBytes: 7,
      durableReceiptWritten: false,
      pruneAuthorized: false,
    });
    const independentlyComputedTree = sha256(JSON.stringify([
      ["a.bin", 3, sha256("one")],
      ["nested/b.bin", 4, sha256("two!")],
    ]));
    expect(restored.treeSha256).toBe(independentlyComputedTree);
    expect(readFileSync(join(fixture.destination, "a.bin"), "utf8")).toBe("one");
    expect(readFileSync(join(fixture.destination, "nested", "b.bin"), "utf8")).toBe("two!");
    expect(readdirSync(fixture.destination).sort()).toEqual(["a.bin", "nested"]);

    const verified = verifyLegacyNasRestore({
      catalogue: fixture.catalogue,
      collection: fixture.identity,
      repoRoot: fixture.repo,
      shareRoot: fixture.share,
      destinationPath: fixture.destination,
    });
    expect(verified).toMatchObject({ command: "verify", ok: true, treeSha256: restored.treeSha256 });
  });

  it("requires an exact version and refuses provisional or unavailable catalogue state", () => {
    const exact = makeFixture("unversioned");
    expect(() => restoreLegacyNasCollection({
      catalogue: exact.catalogue,
      collection: "fixture-legacy",
      repoRoot: exact.repo,
      shareRoot: exact.share,
      destinationPath: exact.destination,
    })).toThrowError(expect.objectContaining({ code: "catalogue-selection-invalid" }));

    const provisional = makeFixture("provisional", { state: "provisional" });
    expect(() => restore(provisional)).toThrowError(expect.objectContaining({ code: "collection-not-active" }));

    const unavailable = makeFixture("unavailable", { state: "unavailable", locator: null });
    expect(() => restore(unavailable)).toThrowError(expect.objectContaining({ code: "collection-not-active" }));
  });

  it("refuses a single-file locator because the destination contract is an exact tree", () => {
    const fixture = makeFixture("single-file-locator", {
      files: [{ relativePath: "a.bin", bytes: Buffer.from("one") }],
      locator: "payload/a.bin",
    });
    expect(() => restore(fixture)).toThrowError(expect.objectContaining({
      code: "collection-locator-invalid",
      destinationReserved: false,
    }));
  });

  it("restores each active NAS-private research selector without copying sibling-class rows", () => {
    const files: readonly FixtureFile[] = [
      { relativePath: "private/a.pdf", bytes: Buffer.from("private-source"), storageClass: "private" },
      { relativePath: "records/b.json", bytes: Buffer.from("tracked-record"), storageClass: "record" },
    ];
    const privateFixture = makeFixture("research-private", {
      files,
      privateManifest: true,
      assetId: "fixture-private",
      selector: {
        kind: "jsonl-field-equals",
        recordType: "file",
        field: "storageClass",
        equals: "private",
      },
    });
    const privateResult = restore(privateFixture);
    expect(privateResult).toMatchObject({ fileCount: 1, totalBytes: 14 });
    expect(readFileSync(join(privateFixture.destination, "private", "a.pdf"), "utf8")).toBe("private-source");
    expect(() => readFileSync(join(privateFixture.destination, "records", "b.json"))).toThrow();

    const recordFixture = makeFixture("research-record", {
      files,
      privateManifest: true,
      assetId: "fixture-record",
      selector: {
        kind: "jsonl-field-equals",
        recordType: "file",
        field: "storageClass",
        equals: "record",
      },
    });
    const recordResult = restore(recordFixture);
    expect(recordResult).toMatchObject({ fileCount: 1, totalBytes: 14 });
    expect(readFileSync(join(recordFixture.destination, "records", "b.json"), "utf8")).toBe("tracked-record");
    expect(() => readFileSync(join(recordFixture.destination, "private", "a.pdf"))).toThrow();
  });

  it("allows only explicitly named children of repo out/restores", () => {
    const fixture = makeFixture("destination-scope");
    for (const destination of [
      join(fixture.repo, "research", "restore"),
      join(fixture.repo, "out", "restore"),
      join(fixture.repo, "out", "restores"),
      join(dirname(fixture.repo), "outside"),
    ]) {
      expect(() => restore(fixture, destination)).toThrowError(
        expect.objectContaining({ code: "destination-invalid", destinationReserved: false }),
      );
    }
  });

  it("never overwrites an existing destination or a case-fold alias", () => {
    const fixture = makeFixture("collision");
    mkdirSync(fixture.destination, { recursive: true });
    writeFileSync(join(fixture.destination, "keep.txt"), "keep");
    expect(() => restore(fixture)).toThrowError(expect.objectContaining({ code: "destination-collision" }));
    expect(readFileSync(join(fixture.destination, "keep.txt"), "utf8")).toBe("keep");

    const aliasFixture = makeFixture("destination-alias");
    mkdirSync(join(aliasFixture.repo, "out", "restores", "FIXTURE-LEGACY-V1"), { recursive: true });
    expect(() => restore(aliasFixture)).toThrowError(expect.objectContaining({ code: "destination-collision" }));
  });

  it.skipIf(!CAN_SYMLINK)("refuses a symlinked destination ancestor and places nothing through it", () => {
    const fixture = makeFixture("destination-symlink");
    const outside = temporaryRoot("destination-symlink-outside");
    symlinkSync(outside, join(fixture.repo, "out"), "dir");
    expect(() => restore(fixture)).toThrowError(expect.objectContaining({ code: "destination-unsafe" }));
    expect(readdirSync(outside)).toEqual([]);
  });

  it.skipIf(!CAN_SYMLINK)("refuses a parent swapped after validation and does not place outside", () => {
    const fixture = makeFixture("destination-parent-swap");
    const outside = temporaryRoot("destination-parent-swap-outside");
    let attacked = false;
    expect(() => restoreLegacyNasCollection({
      catalogue: fixture.catalogue,
      collection: fixture.identity,
      repoRoot: fixture.repo,
      shareRoot: fixture.share,
      destinationPath: fixture.destination,
      hooks: {
        beforeDestinationReservation: () => {
          const parent = join(fixture.repo, "out", "restores");
          rmSync(parent, { recursive: true });
          symlinkSync(outside, parent, "dir");
          attacked = true;
        },
      },
    })).toThrowError(expect.objectContaining({ code: "destination-unsafe", destinationReserved: false }));
    expect(attacked).toBe(true);
    expect(readdirSync(outside)).toEqual([]);
  });

  it.skipIf(!CAN_SYMLINK)("refuses missing, symlinked, hard-linked, or case-aliased source files", () => {
    const missing = makeFixture("source-missing");
    rmSync(join(missing.share, "payload", "a.bin"));
    expect(() => restore(missing)).toThrowError(expect.objectContaining({ code: "source-missing-or-unsafe" }));

    const linked = makeFixture("source-symlink");
    rmSync(join(linked.share, "payload", "a.bin"));
    symlinkSync(join(linked.share, "payload", "nested", "b.bin"), join(linked.share, "payload", "a.bin"));
    expect(() => restore(linked)).toThrowError(expect.objectContaining({ code: "source-missing-or-unsafe" }));

    const hard = makeFixture("source-hardlink");
    linkSync(join(hard.share, "payload", "a.bin"), join(hard.share, "payload", "a-copy.bin"));
    expect(() => restore(hard)).toThrowError(expect.objectContaining({ code: "source-missing-or-unsafe" }));

    const alias = makeFixture("source-case-alias");
    const payload = join(alias.share, "payload");
    const moved = join(alias.share, "Payload");
    // On case-insensitive filesystems the rename may preserve the displayed spelling or be a
    // no-op. In either case, an exact sibling mismatch is required when the spelling differs.
    const originalFiles = readdirSync(payload);
    expect(originalFiles.length).toBeGreaterThan(0);
    rmSync(payload, { recursive: true });
    mkdirSync(moved);
    writeFileSync(join(moved, "a.bin"), "one");
    mkdirSync(join(moved, "nested"));
    writeFileSync(join(moved, "nested", "b.bin"), "two!");
    if (readdirSync(alias.share).includes("Payload")) {
      expect(() => restore(alias)).toThrowError(expect.objectContaining({ code: "source-missing-or-unsafe" }));
    }
  });

  it("detects source append, truncation, and same-length mutation during descriptor-bound copy", () => {
    const mutations = [
      (path: string) => appendFileSync(path, "x"),
      (path: string) => truncateSync(path, 1),
      (path: string) => writeFileSync(path, "xxx"),
    ];
    for (const [index, mutate] of mutations.entries()) {
      const fixture = makeFixture(`source-mutation-${index}`, {
        files: [{ relativePath: "secret-source-name.bin", bytes: Buffer.from("one") }],
      });
      let changed = false;
      expect(() => restoreLegacyNasCollection({
        catalogue: fixture.catalogue,
        collection: fixture.identity,
        repoRoot: fixture.repo,
        shareRoot: fixture.share,
        destinationPath: fixture.destination,
        hooks: {
          afterSourceChunk: () => {
            if (changed) return;
            mutate(join(fixture.share, "payload", "secret-source-name.bin"));
            changed = true;
          },
        },
      })).toThrowError(expect.objectContaining({ code: "source-byte-mismatch", destinationReserved: true }));
      expect(changed).toBe(true);
    }
  });

  it("revalidates a cached source alias snapshot before reporting success", () => {
    const fixture = makeFixture("source-alias-after-snapshot", {
      files: [
        { relativePath: "a.bin", bytes: Buffer.from("one") },
        { relativePath: "b.bin", bytes: Buffer.from("two") },
      ],
    });
    let renamed = false;
    expect(() => restoreLegacyNasCollection({
      catalogue: fixture.catalogue,
      collection: fixture.identity,
      repoRoot: fixture.repo,
      shareRoot: fixture.share,
      destinationPath: fixture.destination,
      hooks: {
        afterFileCopied: ({ fileIndex }) => {
          if (fileIndex !== 0 || renamed) return;
          renameSync(
            join(fixture.share, "payload", "a.bin"),
            join(fixture.share, "payload", "A.BIN"),
          );
          renamed = true;
        },
      },
    })).toThrowError(expect.objectContaining({
      code: "source-missing-or-unsafe",
      destinationReserved: true,
    }));
    expect(renamed).toBe(true);
    expect(readdirSync(join(fixture.share, "payload"))).toContain("A.BIN");
  });

  it("final verification catches a destination alias introduced after namespace capture", () => {
    const fixture = makeFixture("destination-alias-after-snapshot", {
      files: [
        { relativePath: "a.bin", bytes: Buffer.from("one") },
        { relativePath: "b.bin", bytes: Buffer.from("two") },
      ],
    });
    let renamed = false;
    expect(() => restoreLegacyNasCollection({
      catalogue: fixture.catalogue,
      collection: fixture.identity,
      repoRoot: fixture.repo,
      shareRoot: fixture.share,
      destinationPath: fixture.destination,
      hooks: {
        afterFileCopied: ({ destinationPath, fileIndex }) => {
          if (fileIndex !== 0 || renamed) return;
          renameSync(destinationPath, join(dirname(destinationPath), "A.BIN"));
          renamed = true;
        },
      },
    })).toThrowError(expect.objectContaining({
      code: "destination-byte-mismatch",
      destinationReserved: true,
    }));
    expect(renamed).toBe(true);
    expect(readdirSync(fixture.destination)).toContain("A.BIN");
  });

  it("scans alias namespaces by directory rather than once per flat file", () => {
    const runFlatRestore = (label: string, fileCount: number): Readonly<Record<string, number>> => {
      const files = Array.from({ length: fileCount }, (_, index) => ({
        relativePath: `flat-${String(index).padStart(4, "0")}.bin`,
        bytes: Buffer.from(`value-${index}`),
      }));
      const fixture = makeFixture(label, { files });
      const reads: Record<string, number> = {};
      const result = restoreLegacyNasCollection({
        catalogue: fixture.catalogue,
        collection: fixture.identity,
        repoRoot: fixture.repo,
        shareRoot: fixture.share,
        destinationPath: fixture.destination,
        hooks: {
          afterDirectoryAliasScan: ({ scope, phase }) => {
            const key = `${scope}:${phase}`;
            reads[key] = (reads[key] ?? 0) + 1;
          },
        },
      });
      expect(result.fileCount).toBe(fileCount);
      return reads;
    };

    const oneFile = runFlatRestore("alias-scan-one", 1);
    const manyFiles = runFlatRestore("alias-scan-many", 128);
    expect(manyFiles).toEqual(oneFile);
    expect(manyFiles).toEqual({
      "destination:capture": 2,
      "destination:shape": 2,
      "destination:sibling-check": 6,
      "source:capture": 4,
      "source:revalidate": 4,
    });
  });

  it.skipIf(!CAN_SYMLINK)("rejects extra files, empty directories, symlinks, and hard links before success", () => {
    const attacks: readonly ((destination: string) => void)[] = [
      (destination) => writeFileSync(join(destination, "extra-private-name.bin"), "extra"),
      (destination) => mkdirSync(join(destination, "empty-extra")),
      (destination) => symlinkSync("a.bin", join(destination, "linked-extra")),
      (destination) => linkSync(join(destination, "a.bin"), join(destination, "hard-extra")),
    ];
    for (const [index, attack] of attacks.entries()) {
      const fixture = makeFixture(`destination-extra-${index}`);
      expect(() => restoreLegacyNasCollection({
        catalogue: fixture.catalogue,
        collection: fixture.identity,
        repoRoot: fixture.repo,
        shareRoot: fixture.share,
        destinationPath: fixture.destination,
        hooks: { beforeDestinationVerification: attack },
      })).toThrowError(expect.objectContaining({ code: "destination-byte-mismatch", destinationReserved: true }));
    }
  });

  it("destination-aware verification refuses changed, missing, and extra bytes", () => {
    const verify = (fixture: RestoreFixture) => verifyLegacyNasRestore({
      catalogue: fixture.catalogue,
      collection: fixture.identity,
      repoRoot: fixture.repo,
      shareRoot: fixture.share,
      destinationPath: fixture.destination,
    });

    const changed = makeFixture("verify-changed");
    restore(changed);
    writeFileSync(join(changed.destination, "a.bin"), "xxx");
    expect(() => verify(changed)).toThrowError(expect.objectContaining({ code: "destination-byte-mismatch" }));

    const missing = makeFixture("verify-missing");
    restore(missing);
    rmSync(join(missing.destination, "a.bin"));
    expect(() => verify(missing)).toThrowError(expect.objectContaining({ code: "destination-byte-mismatch" }));

    const extra = makeFixture("verify-extra");
    restore(extra);
    writeFileSync(join(extra.destination, "not-in-owner.json"), "extra");
    expect(() => verify(extra)).toThrowError(expect.objectContaining({ code: "destination-byte-mismatch" }));
  });

  it("refuses repository/share overlap before creating a destination", () => {
    const fixture = makeFixture("overlap");
    const nestedRepo = join(fixture.share, "repo");
    mkdirSync(nestedRepo);
    expect(() => restoreLegacyNasCollection({
      catalogue: fixture.catalogue,
      collection: fixture.identity,
      repoRoot: nestedRepo,
      shareRoot: fixture.share,
      destinationPath: join(nestedRepo, "out", "restores", "fixture"),
    })).toThrowError(expect.objectContaining({ code: "share-overlap", destinationReserved: false }));
  });

  it("keeps a failed reserved destination visible and never writes a receipt", () => {
    const fixture = makeFixture("partial-visible", {
      files: [{ relativePath: "a.bin", bytes: Buffer.from("one") }],
    });
    appendFileSync(join(fixture.share, "payload", "a.bin"), "wrong");
    let caught: unknown;
    try {
      restore(fixture);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(NasLegacyRestoreError);
    expect(caught).toMatchObject({ destinationReserved: true });
    expect(readdirSync(join(fixture.repo, "out", "restores"))).toContain("fixture-legacy-v1");
    expect(readdirSync(fixture.share)).not.toContain("_control");
  });
});
