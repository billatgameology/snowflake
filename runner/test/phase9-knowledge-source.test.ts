import { createHash } from "node:crypto";
import {
  appendFileSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import {
  loadCatalogueBoundKnowledgeSources,
  type Phase9KnowledgeSourceIdentity,
} from "../../scripts/phase9-knowledge-source-lib.ts";
import {
  parseNasAssetCatalogV1,
  type NasAssetCatalogV1,
  type NasAssetCollectionV1,
} from "../../scripts/nas-asset-lib.ts";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "..", "..");
const REAL_CATALOGUE = parseNasAssetCatalogV1(
  readFileSync(join(REPOSITORY_ROOT, "docs", "nas-assets.json"), "utf8"),
);
const COLLECTION = "fixture-phase9-knowledge@v1";
const LOCATOR = "research-cache/content";
const temporaryRoots: string[] = [];

const temporaryRoot = (label: string): string => {
  const root = mkdtempSync(join(tmpdir(), `phase9-knowledge-${label}-`));
  temporaryRoots.push(root);
  return root;
};

afterAll(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
});

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

const CAN_HARDLINK = (() => {
  const root = temporaryRoot("hardlink-probe");
  try {
    writeFileSync(join(root, "source"), "probe");
    linkSync(join(root, "source"), join(root, "alias"));
    return true;
  } catch {
    return false;
  }
})();

const sha256 = (data: string | Buffer): string => createHash("sha256").update(data).digest("hex");

const sourceRows = [
  ["lambPdf", "lamb.pdf", "lamb bytes"],
  ["iceNodeArchive", "icenode.zip", "archive bytes"],
  ["dimensions20231128", "histories/dimensions-20231128.dat", "0 1 2 3 4 5 6 7\n"],
  ["dimensions20240814", "histories/dimensions-20240814.dat", "1 2 3 4 5 6 7 8\n"],
] as const;

interface KnowledgeFixture {
  readonly catalogue: NasAssetCatalogV1;
  readonly repoRoot: string;
  readonly shareRoot: string;
  readonly identities: readonly Phase9KnowledgeSourceIdentity[];
  readonly physicalPaths: Readonly<Record<string, string>>;
}

const makeFixture = (options: {
  readonly omitManifestId?: string;
  readonly addExtraManifestRow?: boolean;
} = {}): KnowledgeFixture => {
  const repoRoot = temporaryRoot("repo");
  const shareRoot = temporaryRoot("share");
  const identities: Phase9KnowledgeSourceIdentity[] = sourceRows.map(([id, relativePath, data]) => ({
    id,
    sharePath: `${LOCATOR}/${relativePath}`,
    recordedPath: `/Volumes/snowcrystal/${LOCATOR}/${relativePath}`,
    bytes: Buffer.byteLength(data),
    sha256: sha256(data),
  }));
  const physicalPaths: Record<string, string> = {};
  for (const [index, identity] of identities.entries()) {
    const physicalPath = join(shareRoot, ...identity.sharePath.split("/"));
    mkdirSync(dirname(physicalPath), { recursive: true });
    writeFileSync(physicalPath, sourceRows[index]?.[2] ?? "");
    physicalPaths[identity.id] = physicalPath;
  }

  const manifestFiles = identities
    .filter((identity) => identity.id !== options.omitManifestId)
    .map(({ sharePath: path, bytes, sha256: digest }) => ({ path, bytes, sha256: digest }));
  if (options.addExtraManifestRow === true) {
    const data = "extra";
    const path = `${LOCATOR}/extra.bin`;
    const physicalPath = join(shareRoot, ...path.split("/"));
    writeFileSync(physicalPath, data);
    manifestFiles.push({ path, bytes: Buffer.byteLength(data), sha256: sha256(data) });
  }
  const manifestBytes = Buffer.from(JSON.stringify({ files: manifestFiles }));
  mkdirSync(join(repoRoot, "manifests"), { recursive: true });
  writeFileSync(join(repoRoot, "manifests", "phase9.json"), manifestBytes);

  const template = REAL_CATALOGUE.collections.find(
    (collection) => collection.assetId === "research-private-freeze",
  );
  if (template === undefined) throw new Error("real Phase 9 knowledge collection is missing");
  const aggregate = {
    files: manifestFiles.length,
    bytes: manifestFiles.reduce((sum, file) => sum + file.bytes, 0),
  };
  const collection: NasAssetCollectionV1 = {
    ...structuredClone(template),
    assetId: "fixture-phase9-knowledge",
    version: "v1",
    locator: LOCATOR,
    legacyAliases: [],
    aggregate,
    ownerManifest: {
      storage: "tracked",
      path: "manifests/phase9.json",
      format: "fixture-phase9-knowledge-v1",
      bytes: manifestBytes.byteLength,
      sha256: sha256(manifestBytes),
      selector: { kind: "all" },
    },
  };
  const catalogue = parseNasAssetCatalogV1(JSON.stringify({
    ...REAL_CATALOGUE,
    collections: [collection],
    overlays: [],
    systemExclusions: [],
  }));
  return { catalogue, repoRoot, shareRoot, identities, physicalPaths };
};

const loadFixture = (
  fixture: KnowledgeFixture,
  hooks?: Parameters<typeof loadCatalogueBoundKnowledgeSources>[0]["hooks"],
) => loadCatalogueBoundKnowledgeSources({
  catalogue: fixture.catalogue,
  repoRoot: fixture.repoRoot,
  shareRoot: fixture.shareRoot,
  collection: COLLECTION,
  locator: LOCATOR,
  identities: fixture.identities,
  hooks,
});

describe("catalogue-bound Phase 9 knowledge source reads", () => {
  it("loads exactly four selected members through their bound descriptors", () => {
    const fixture = makeFixture();
    const loaded = loadFixture(fixture);
    expect(Object.keys(loaded).sort()).toEqual([
      "dimensions20231128",
      "dimensions20240814",
      "iceNodeArchive",
      "lambPdf",
    ]);
    for (const identity of fixture.identities) {
      expect(loaded[identity.id]).toMatchObject(identity);
      expect(sha256(loaded[identity.id].data)).toBe(identity.sha256);
    }
  });

  it("refuses a required path outside the exact owner-manifest selection", () => {
    const fixture = makeFixture({ omitManifestId: "dimensions20240814" });
    expect(() => loadFixture(fixture)).toThrow(/is not a member/u);
  });

  it("loads only the four frozen identities from a broader collection selection", () => {
    const fixture = makeFixture({ addExtraManifestRow: true });
    const loaded = loadFixture(fixture);
    expect(Object.keys(loaded).sort()).toEqual([
      "dimensions20231128",
      "dimensions20240814",
      "iceNodeArchive",
      "lambPdf",
    ]);
  });

  it.skipIf(!CAN_SYMLINK)("refuses a selected source that is a symlink escape", () => {
    const fixture = makeFixture();
    const identity = fixture.identities.find(({ id }) => id === "lambPdf");
    if (identity === undefined) throw new Error("missing fixture source");
    const outside = temporaryRoot("outside");
    const outsidePath = join(outside, "lamb.pdf");
    writeFileSync(outsidePath, "lamb bytes");
    rmSync(fixture.physicalPaths.lambPdf as string);
    symlinkSync(outsidePath, fixture.physicalPaths.lambPdf as string);
    expect(() => loadFixture(fixture)).toThrow(/missing or unsafe/u);
  });

  it.skipIf(!CAN_HARDLINK)("refuses a selected source with a second hard-link name", () => {
    const fixture = makeFixture();
    const outside = temporaryRoot("hardlink-outside");
    linkSync(fixture.physicalPaths.lambPdf as string, join(outside, "alias.pdf"));
    expect(() => loadFixture(fixture)).toThrow(/hard-linked/u);
  });

  it("refuses payload mutation during the descriptor read", () => {
    const fixture = makeFixture();
    let mutated = false;
    expect(() => loadFixture(fixture, {
      afterPayloadChunk: (source, physicalPath) => {
        if (!mutated && source.id === "lambPdf") {
          mutated = true;
          appendFileSync(physicalPath, "mutation");
        }
      },
    })).toThrow(/exceeds its bound byte length|changed while reading/u);
    expect(mutated).toBe(true);
  });

  it("refuses same-length payload corruption by digest", () => {
    const fixture = makeFixture();
    const identity = fixture.identities.find(({ id }) => id === "lambPdf");
    if (identity === undefined) throw new Error("missing fixture source");
    const corrupted = "Lamb bytes";
    expect(Buffer.byteLength(corrupted)).toBe(identity.bytes);
    writeFileSync(fixture.physicalPaths.lambPdf as string, corrupted);
    expect(() => loadFixture(fixture)).toThrow(/bytes disagree with its catalogue binding/u);
  });

  it("refuses path replacement while retaining the original open descriptor", () => {
    const fixture = makeFixture();
    let replaced = false;
    expect(() => loadFixture(fixture, {
      afterPayloadChunk: (source, physicalPath) => {
        if (!replaced && source.id === "lambPdf") {
          replaced = true;
          renameSync(physicalPath, `${physicalPath}.original`);
          writeFileSync(physicalPath, sourceRows[0][2]);
        }
      },
    })).toThrow(/removed or replaced|changed while reading|replaced while reading/u);
    expect(replaced).toBe(true);
  });

  it.skipIf(!CAN_SYMLINK)(
    "refuses an in-share ancestor symlink rebound to the original payload",
    () => {
      const fixture = makeFixture();
      const physicalPath = fixture.physicalPaths.dimensions20231128 as string;
      const ancestor = dirname(physicalPath);
      const originalAncestor = `${ancestor}.original`;
      let rebound = false;
      expect(() => loadFixture(fixture, {
        afterPayloadChunk: (source) => {
          if (!rebound && source.id === "dimensions20231128") {
            rebound = true;
            renameSync(ancestor, originalAncestor);
            symlinkSync(originalAncestor, ancestor, "dir");
          }
        },
      })).toThrow(/path changed after reading/u);
      expect(rebound).toBe(true);
    },
  );
});
