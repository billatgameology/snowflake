import {
  mkdirSync,
  linkSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import {
  NAS_ASSET_CATALOG_FORMAT,
  assertPortableShareRelativePath,
  decodeNasRequestPath,
  decideNasCatalogServePath,
  hashStableRegularFile,
  inventoryStableTree,
  openContainedRegularFile,
  parseNasAssetCatalogV1,
  portableSharePathCollisionKey,
  resolveContainedDirectory,
  resolveContainedRegularFile,
  resolveNasRootEnvironment,
  validateNasAssetCatalogV1,
  writeJsonAtomic,
  type NasAssetCatalogV1,
} from "../../scripts/nas-asset-lib.ts";

const temporaryRoots: string[] = [];
const temporaryRoot = (label: string): string => {
  const root = mkdtempSync(join(tmpdir(), `nas-asset-${label}-`));
  temporaryRoots.push(root);
  return root;
};

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

afterAll(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
});

const manifest = () => ({
  storage: "tracked",
  path: "docs/nas-ledger.json",
  format: "legacy-ledger-v1",
  bytes: 120,
  sha256: "a".repeat(64),
  selector: {
    kind: "path-prefixes",
    include: ["artifacts/site/2026-08-15-v1"],
    exclude: [],
  },
});

const collection = (overrides: Record<string, unknown> = {}) => ({
  assetId: "generated-site",
  version: "2026-08-15-v1",
  state: "active",
  ownerWorkstream: "repository-infrastructure",
  locator: "artifacts/site/2026-08-15-v1",
  historicalRepoPath: null,
  legacyAliases: ["out/gutcheck-gg-realism/site"],
  storageClass: "generated-cache",
  aggregate: { files: 2, bytes: 12 },
  rights: { kind: "project-owned", redistribution: "allowed" },
  privacy: "public",
  serve: {
    policy: "generated-public-loopback",
    prefixes: ["artifacts/site/2026-08-15-v1"],
  },
  retention: {
    policy: "regenerable",
    garbageCollection: { policy: "plan-only", graceDays: null, approver: "maker" },
  },
  mutability: "immutable",
  ownerManifest: manifest(),
  externalEvidenceAuthority: null,
  provenance: {
    record: "docs/plans/nas-asset-governance.md",
    producerCommit: null,
    command: "npm run build",
  },
  reproducibility: {
    kind: "exact-recipe",
    record: "docs/plans/nas-asset-governance.md",
  },
  restore: {
    status: "tested",
    command: "npm run assets:restore -- --collection generated-site",
    verifyCommand: "npm run assets:verify -- --collection generated-site",
    record: "docs/plans/nas-asset-governance.md",
  },
  verification: {
    status: "full-hash",
    at: "2026-08-15",
    host: "fixture",
    receipt: null,
    limits: [],
  },
  storageDomains: ["snowcrystal-nas"],
  backup: { status: "not-required", independentDomains: [], receipts: [] },
  supersedes: [],
  unresolved: [],
  ...overrides,
});

const catalogValue = (...collections: unknown[]) => ({
  format: NAS_ASSET_CATALOG_FORMAT,
  projectId: "virtual-cloud-chamber",
  shareMarker: {
    path: ".snowflake-nas.json",
    format: "snowflake-nas-share-v1",
    projectId: "virtual-cloud-chamber",
  },
  canonicalEnvironmentVariable: "VCC_NAS_ROOT",
  compatibilityEnvironmentVariable: "GUTCHECK_NAS_ROOT",
  controlRoot: "_control",
  collections: collections.length === 0 ? [collection()] : collections,
  overlays: [],
  systemExclusions: [
    { path: "#recycle", reason: "NAS recycle namespace is not an asset collection" },
    { path: "_control", reason: "transaction control state is never served" },
  ],
});

describe("portable share-relative identities", () => {
  it("accepts normalized POSIX identities and gives case/NFC collision keys", () => {
    expect(() => assertPortableShareRelativePath("research-cache/sources/paper 1.pdf")).not.toThrow();
    expect(portableSharePathCollisionKey("ARTIFACTS/CAFÉ.bin")).toBe(
      portableSharePathCollisionKey("artifacts/café.bin"),
    );
  });

  it.each([
    "",
    "/absolute",
    "C:/absolute",
    "../escape",
    "a/../escape",
    "a/./b",
    "a//b",
    "a\\b",
    "a/b/",
    "a/control\u0000",
    "a/CON",
    "a/con.txt",
    "a/LPT9.log",
    "a/CLOCK$",
    "a/bad:name",
    "a/bad?.txt",
    "a/trailing.",
    "a/trailing ",
    "cafe\u0301/file",
  ])("rejects unsafe or cross-host-unrepresentable path %j", (unsafe) => {
    expect(() => assertPortableShareRelativePath(unsafe)).toThrow();
  });
});

describe("federated catalogue validation", () => {
  it("constructs a strict typed v1 catalogue", () => {
    const parsed = validateNasAssetCatalogV1(catalogValue());
    expect(parsed.format).toBe(NAS_ASSET_CATALOG_FORMAT);
    expect(parsed.collections[0]?.assetId).toBe("generated-site");
    expect(parseNasAssetCatalogV1(JSON.stringify(parsed))).toEqual(parsed);
  });

  it("rejects unknown, missing, and malformed fields", () => {
    expect(() => validateNasAssetCatalogV1({ ...catalogValue(), surprise: true })).toThrow(/keys/u);
    const missing = collection();
    delete (missing as { restore?: unknown }).restore;
    expect(() => validateNasAssetCatalogV1(catalogValue(missing))).toThrow(/keys/u);
    expect(() => validateNasAssetCatalogV1(catalogValue(collection({ ownerManifest: { ...manifest(), sha256: "A".repeat(64) } })))).toThrow(/SHA-256/u);
    expect(() => parseNasAssetCatalogV1("{")) .toThrow(/not JSON/u);
  });

  it("rejects duplicate identities and exact case/Unicode locator aliases", () => {
    expect(() => validateNasAssetCatalogV1(catalogValue(collection(), collection({
      locator: "artifacts/other",
      legacyAliases: [],
      serve: { policy: "deny", prefixes: [] },
      ownerManifest: {
        ...manifest(),
        selector: { kind: "path-prefixes", include: ["artifacts/other"], exclude: [] },
      },
    })))).toThrow(/duplicate/u);
    expect(() => validateNasAssetCatalogV1(catalogValue(
      collection(),
      collection({
        assetId: "second-site",
        locator: "ARTIFACTS/SITE/2026-08-15-v1",
        legacyAliases: [],
        serve: { policy: "deny", prefixes: [] },
        ownerManifest: {
          ...manifest(),
          selector: { kind: "path-prefixes", include: ["ARTIFACTS/SITE/2026-08-15-v1"], exclude: [] },
        },
      }),
    ))).toThrow(/non-disjoint/u);
  });

  it("allows one physical locator only when a shared manifest proves selector disjointness", () => {
    const first = collection({
      locator: "out/gutcheck",
      legacyAliases: [],
      serve: { policy: "generated-public-loopback", prefixes: ["out/gutcheck/large"] },
      ownerManifest: {
        ...manifest(),
        selector: { kind: "path-prefixes", include: ["out/gutcheck/large"], exclude: [] },
      },
    });
    const remainder = collection({
      assetId: "gutcheck-remainder",
      locator: "out/gutcheck",
      legacyAliases: [],
      serve: { policy: "deny", prefixes: [] },
      ownerManifest: {
        ...manifest(),
        selector: {
          kind: "path-prefixes",
          include: ["out/gutcheck"],
          exclude: ["out/gutcheck/large"],
        },
      },
    });
    expect(() => validateNasAssetCatalogV1(catalogValue(first, remainder))).not.toThrow();
    const overlapping = {
      ...remainder,
      ownerManifest: {
        ...manifest(),
        selector: { kind: "path-prefixes", include: ["out/gutcheck"], exclude: [] },
      },
    };
    expect(() => validateNasAssetCatalogV1(catalogValue(first, overlapping))).toThrow(/non-disjoint/u);
  });

  it("rejects ancestor ownership overlap and every reserved namespace", () => {
    const parent = collection({
      locator: "research-cache",
      legacyAliases: [],
      serve: { policy: "deny", prefixes: [] },
      ownerManifest: {
        ...manifest(),
        selector: { kind: "path-prefixes", include: ["research-cache"], exclude: [] },
      },
    });
    const child = collection({
      assetId: "nested-public",
      locator: "research-cache/public",
      legacyAliases: [],
      serve: { policy: "deny", prefixes: [] },
      ownerManifest: {
        ...manifest(),
        selector: { kind: "path-prefixes", include: ["research-cache/public"], exclude: [] },
      },
    });
    expect(() => validateNasAssetCatalogV1(catalogValue(parent, child))).toThrow(/non-disjoint/u);

    const reserved = collection({
      locator: "_control/staging/public",
      legacyAliases: [],
      serve: { policy: "generated-public-loopback", prefixes: ["_control/staging/public"] },
      ownerManifest: {
        ...manifest(),
        selector: { kind: "path-prefixes", include: ["_control/staging/public"], exclude: [] },
      },
    });
    expect(() => validateNasAssetCatalogV1(catalogValue(reserved))).toThrow(/reserved/u);
  });

  it("rejects a serve prefix broader than the collection selector", () => {
    expect(() => validateNasAssetCatalogV1(catalogValue(collection({
      locator: "out/gutcheck",
      legacyAliases: [],
      serve: { policy: "generated-public-loopback", prefixes: ["out/gutcheck"] },
      ownerManifest: {
        ...manifest(),
        selector: { kind: "path-prefixes", include: ["out/gutcheck/large"], exclude: [] },
      },
    })))).toThrow(/not wholly owned/u);
  });

  it("rejects an owner selector that reaches above or outside its locator", () => {
    expect(() => validateNasAssetCatalogV1(catalogValue(collection({
      locator: "payload/public",
      legacyAliases: [],
      serve: { policy: "deny", prefixes: [] },
      ownerManifest: {
        ...manifest(),
        selector: { kind: "path-prefixes", include: ["payload"], exclude: [] },
      },
    })))).toThrow(/outside its locator/u);

    expect(() => validateNasAssetCatalogV1(catalogValue(collection({
      locator: "payload/public",
      legacyAliases: [],
      serve: { policy: "deny", prefixes: [] },
      ownerManifest: {
        ...manifest(),
        selector: { kind: "json-tree-key", key: "payload" },
      },
    })))).toThrow(/tree selector is outside/u);
  });

  it("pins the catalogue and resolver to one share marker identity", () => {
    const differentPath = catalogValue(collection()) as Record<string, unknown>;
    differentPath.shareMarker = {
      path: "different-marker.json",
      format: "snowflake-nas-share-v1",
      projectId: "virtual-cloud-chamber",
    };
    expect(() => validateNasAssetCatalogV1(differentPath)).toThrow(/shareMarker\.path/u);

    const differentFormat = catalogValue(collection()) as Record<string, unknown>;
    differentFormat.shareMarker = {
      path: ".snowflake-nas.json",
      format: "different-share-v9",
      projectId: "virtual-cloud-chamber",
    };
    expect(() => validateNasAssetCatalogV1(differentFormat)).toThrow(/shareMarker\.format/u);
  });

  it("allows serving only project-owned generated-cache collections", () => {
    expect(() => validateNasAssetCatalogV1(catalogValue(collection({ rights: { kind: "restricted-third-party", redistribution: "restricted" } })))).toThrow(/serving requires/u);
    expect(() => validateNasAssetCatalogV1(catalogValue(collection({ storageClass: "private-source" })))).toThrow(/serving requires/u);
    expect(() => validateNasAssetCatalogV1(catalogValue(collection({ locator: "a/CON/file" })))).toThrow(/non-portable/u);
  });

  it("requires explicit authority and non-GC retention for external evidence", () => {
    expect(() => validateNasAssetCatalogV1(catalogValue(collection({
      storageClass: "external-evidence",
      serve: { policy: "deny", prefixes: [] },
    })))).toThrow(/authority/u);
  });

  it("requires active external evidence to be immutable, claim-bound, verified, and restorable", () => {
    const externalAuthority = {
      charterRefs: ["project charter.md §1.5"],
      decisionRefs: ["docs/decisions/0038-version-evidence-artifacts.md"],
      planRefs: ["docs/plans/nas-asset-governance.md"],
      claimRefs: ["docs/PROGRESS.md"],
    };
    const external = collection({
      storageClass: "external-evidence",
      serve: { policy: "deny", prefixes: [] },
      mutability: "immutable",
      externalEvidenceAuthority: externalAuthority,
      retention: {
        policy: "permanent",
        garbageCollection: { policy: "never", graceDays: null, approver: "maker" },
      },
      reproducibility: { kind: "none", record: "docs/plans/nas-asset-governance.md" },
      verification: {
        status: "full-hash",
        at: "2026-08-15",
        host: "fixture",
        receipt: "docs/nas-inventory-audit-20260815.md",
        limits: [],
      },
      backup: { status: "required-missing", independentDomains: [], receipts: [] },
    });
    expect(() => validateNasAssetCatalogV1(catalogValue(external))).not.toThrow();
    expect(() => validateNasAssetCatalogV1(catalogValue({ ...external, mutability: "working" }))).toThrow(/immutable/u);
    expect(() => validateNasAssetCatalogV1(catalogValue({
      ...external,
      externalEvidenceAuthority: { ...externalAuthority, claimRefs: [] },
    }))).toThrow(/authority/u);
    expect(() => validateNasAssetCatalogV1(catalogValue({
      ...external,
      verification: { ...external.verification, status: "manifest-only" },
    }))).toThrow(/hash-verified/u);
    expect(() => validateNasAssetCatalogV1(catalogValue({
      ...external,
      restore: { ...external.restore, verifyCommand: null },
    }))).toThrow(/verifier/u);
    expect(() => validateNasAssetCatalogV1(catalogValue({
      ...external,
      backup: { status: "not-required", independentDomains: [], receipts: [] },
    }))).toThrow(/backup policy/u);
  });
});

describe("NAS root environment compatibility", () => {
  it("prefers the canonical setting and accepts an equal legacy alias", () => {
    expect(resolveNasRootEnvironment({ VCC_NAS_ROOT: "/Volumes/snowcrystal/" }, "darwin")).toEqual({
      kind: "configured",
      root: "/Volumes/snowcrystal/",
      source: "canonical",
    });
    expect(resolveNasRootEnvironment({
      VCC_NAS_ROOT: "/Volumes/snowcrystal",
      GUTCHECK_NAS_ROOT: "/Volumes/snowcrystal/",
    }, "darwin")).toEqual({
      kind: "configured",
      root: "/Volumes/snowcrystal/",
      source: "canonical-and-legacy",
    });
  });

  it("compares Windows aliases case-insensitively without a Windows host", () => {
    expect(resolveNasRootEnvironment({ VCC_NAS_ROOT: "S:/", GUTCHECK_NAS_ROOT: "s:\\" }, "win32")).toEqual({
      kind: "configured",
      root: "s:/",
      source: "canonical-and-legacy",
    });
  });

  it("fails on conflicts or non-absolute configuration and reports unset", () => {
    expect(() => resolveNasRootEnvironment({ VCC_NAS_ROOT: "/one", GUTCHECK_NAS_ROOT: "/two" }, "darwin")).toThrow(/conflicts/u);
    expect(() => resolveNasRootEnvironment({ VCC_NAS_ROOT: "relative/share" }, "darwin")).toThrow(/absolute/u);
    expect(resolveNasRootEnvironment({})).toEqual({ kind: "unset" });
  });
});

describe("catalogue serving decision", () => {
  const catalog = validateNasAssetCatalogV1(catalogValue(
    collection(),
    collection({
      assetId: "private-sources",
      version: "v1",
      locator: "research-cache/content",
      legacyAliases: [],
      storageClass: "private-source",
      ownerManifest: {
        ...manifest(),
        selector: { kind: "path-prefixes", include: ["research-cache/content"], exclude: [] },
      },
      rights: { kind: "restricted-third-party", redistribution: "restricted" },
      privacy: "private",
      serve: { policy: "deny", prefixes: [] },
      retention: {
        policy: "permanent",
        garbageCollection: { policy: "never", graceDays: null, approver: "maker" },
      },
    }),
  ));

  it("allows only exact explicit prefixes and does not inherit legacy aliases", () => {
    const canonical = decideNasCatalogServePath(catalog, "artifacts/site/2026-08-15-v1/index.html");
    expect(canonical.kind).toBe("allow");
    if (canonical.kind === "allow") {
      expect(canonical.pathWithinPrefix).toBe("index.html");
      expect(canonical.matchedPrefix).toBe("artifacts/site/2026-08-15-v1");
    }
    const legacy = decideNasCatalogServePath(catalog, "out/gutcheck-gg-realism/site/index.html");
    expect(legacy).toMatchObject({ kind: "deny", reason: "collection-denied" });
  });

  it("denies private, unclassified, prefix-lookalike, and unsafe paths", () => {
    expect(decideNasCatalogServePath(catalog, "research-cache/content/source.pdf")).toMatchObject({ kind: "deny", reason: "collection-denied" });
    expect(decideNasCatalogServePath(catalog, "_control/secret.txt")).toEqual({ kind: "deny", reason: "unclassified" });
    expect(decideNasCatalogServePath(catalog, "artifacts/site/2026-08-15-v10/file")).toEqual({ kind: "deny", reason: "unclassified" });
    expect(decideNasCatalogServePath(catalog, "../escape")).toEqual({ kind: "deny", reason: "unsafe-path" });
    expect(decideNasCatalogServePath(catalog, "ARTIFACTS/site/2026-08-15-v1/file")).toEqual({ kind: "deny", reason: "unclassified" });
  });

  it("decodes a middleware URL once and rejects ambiguous or malformed forms", () => {
    expect(decodeNasRequestPath("/artifacts/site/file%20one.bin?download=1")).toEqual({
      kind: "ok",
      path: "artifacts/site/file one.bin",
    });
    expect(decodeNasRequestPath("//artifacts/site/file.bin").kind).toBe("deny");
    expect(decodeNasRequestPath("/artifacts%5Csite/file.bin").kind).toBe("deny");
    expect(decodeNasRequestPath("/%zz")).toEqual({ kind: "deny", reason: "malformed-encoding" });
  });
});

describe("contained regular-file resolution", () => {
  it("resolves a contained file and refuses traversal, directories, and absence", () => {
    const root = temporaryRoot("resolve");
    mkdirSync(join(root, "collection"));
    writeFileSync(join(root, "collection", "file.bin"), "payload");
    expect(resolveContainedRegularFile(root, "collection/file.bin")).toMatchObject({ kind: "ok", byteLength: 7 });
    expect(resolveContainedRegularFile(root, "../escape").kind).toBe("forbidden");
    expect(resolveContainedRegularFile(root, "collection").kind).toBe("not-found");
    expect(resolveContainedRegularFile(root, "collection/missing").kind).toBe("not-found");
  });

  it.skipIf(!CAN_SYMLINK)("refuses a symlink to a regular file outside the root", () => {
    const root = temporaryRoot("escape-root");
    const outside = temporaryRoot("escape-outside");
    mkdirSync(join(root, "collection"));
    writeFileSync(join(outside, "secret"), "secret");
    symlinkSync(join(outside, "secret"), join(root, "collection", "leak"));
    expect(resolveContainedRegularFile(root, "collection/leak").kind).toBe("forbidden");
  });

  it.skipIf(!CAN_SYMLINK)("refuses final and intermediate links into another in-share collection", () => {
    const root = temporaryRoot("cross-collection-link");
    mkdirSync(join(root, "public"));
    mkdirSync(join(root, "private"));
    writeFileSync(join(root, "private", "secret.bin"), "secret");
    symlinkSync(join(root, "private", "secret.bin"), join(root, "public", "file.bin"));
    expect(openContainedRegularFile(root, "public/file.bin", "public").kind).toBe("forbidden");
    rmSync(join(root, "public", "file.bin"));
    symlinkSync(join(root, "private"), join(root, "public", "linked-private"), "dir");
    expect(openContainedRegularFile(root, "public/linked-private/secret.bin", "public").kind).toBe("forbidden");
  });

  it.skipIf(!CAN_HARDLINK)("refuses a public hard link to a private in-share file", () => {
    const root = temporaryRoot("cross-collection-hardlink");
    mkdirSync(join(root, "public"));
    mkdirSync(join(root, "private"));
    writeFileSync(join(root, "private", "secret.bin"), "secret");
    linkSync(join(root, "private", "secret.bin"), join(root, "public", "exposed.bin"));
    expect(openContainedRegularFile(root, "public/exposed.bin", "public")).toMatchObject({
      kind: "forbidden",
      reason: "hard-linked files are forbidden",
    });
  });
});

describe("contained directory resolution", () => {
  it("resolves an ordinary directory and rejects absence or a regular file", () => {
    const root = temporaryRoot("resolve-directory");
    mkdirSync(join(root, "collection"));
    writeFileSync(join(root, "file.bin"), "payload");
    expect(resolveContainedDirectory(root, "collection").kind).toBe("ok");
    expect(resolveContainedDirectory(root, "missing").kind).toBe("not-found");
    expect(resolveContainedDirectory(root, "file.bin").kind).toBe("not-found");
  });

  it.skipIf(!CAN_SYMLINK)("rejects an intermediate directory symlink", () => {
    const root = temporaryRoot("resolve-directory-link");
    const outside = temporaryRoot("resolve-directory-outside");
    mkdirSync(join(outside, "payload"));
    symlinkSync(outside, join(root, "linked"), "dir");
    expect(resolveContainedDirectory(root, "linked/payload").kind).toBe("forbidden");
  });
});

describe("stable hashing and inventory", () => {
  it("hashes and inventories ordinary files in deterministic path order", () => {
    const root = temporaryRoot("inventory");
    mkdirSync(join(root, "z"));
    writeFileSync(join(root, "z", "second.bin"), "second");
    writeFileSync(join(root, "first.bin"), "first");
    const first = inventoryStableTree(root);
    const second = inventoryStableTree(root);
    expect(first).toEqual(second);
    expect(first.files.map((file) => file.path)).toEqual(["first.bin", "z/second.bin"]);
    expect(first.files.map((file) => file.sha256)).toEqual([
      "a7937b64b8caa58f03721bb6bacf5c78cb235febe0e70b1b84cd99541461a08e",
      "16367aacb67a4a017c8da8ab95682ccb390863780f7114dda0a0e0c55644c7c4",
    ]);
    expect(first.fileCount).toBe(2);
    expect(first.totalBytes).toBe(11);
    expect(first.treeSha256).toBe("d09811f0b3054ea490c1ff09d14481041583ea6ca1dbdfaf8210fe3c19dfe89e");
  });

  it("rejects a file changed after it was hashed while the first tree pass continues", () => {
    const root = temporaryRoot("tree-cross-file-mutation");
    writeFileSync(join(root, "a.bin"), "first value");
    writeFileSync(join(root, "b.bin"), "second value");
    expect(() => inventoryStableTree(root, {
      afterFirstPassFile: (relativePath) => {
        if (relativePath === "b.bin") writeFileSync(join(root, "a.bin"), "changed after first hash");
      },
    })).toThrow(/between inventory passes/u);
  });

  it("rejects an extra file introduced after byte re-verification but before publication", () => {
    const root = temporaryRoot("tree-late-extra");
    writeFileSync(join(root, "registered.bin"), "registered");
    let mutationRan = false;
    expect(() => inventoryStableTree(root, {
      beforeFinalShapePass: () => {
        writeFileSync(join(root, "late-extra.bin"), "late");
        mutationRan = true;
      },
    })).toThrow(/file set|identity changed/u);
    expect(mutationRan).toBe(true);
    expect(readFileSync(join(root, "late-extra.bin"), "utf8")).toBe("late");
  });

  it("detects a source mutation during hashing", () => {
    const root = temporaryRoot("mutation");
    const file = join(root, "source.bin");
    writeFileSync(file, "abcdef");
    let changed = false;
    expect(() => hashStableRegularFile(file, {
      chunkBytes: 2,
      onChunk: () => {
        if (changed) return;
        changed = true;
        writeFileSync(file, "abcdef-mutated");
      },
    })).toThrow(/mutated/u);
  });

  it.skipIf(!CAN_SYMLINK)("refuses symlinks as inventory members", () => {
    const root = temporaryRoot("inventory-link");
    writeFileSync(join(root, "target"), "target");
    symlinkSync(join(root, "target"), join(root, "alias"));
    expect(() => inventoryStableTree(root)).toThrow(/symbolic/u);
  });

  it.skipIf(!CAN_HARDLINK)("refuses hard links as inventory members", () => {
    const root = temporaryRoot("inventory-hardlink");
    writeFileSync(join(root, "source"), "source");
    linkSync(join(root, "source"), join(root, "alias"));
    expect(() => inventoryStableTree(root)).toThrow(/hard-linked/u);
  });
});

describe("atomic JSON publication", () => {
  it("replaces complete JSON and leaves no sibling staging residue", () => {
    const root = temporaryRoot("atomic");
    const target = join(root, "catalog.json");
    writeFileSync(target, "old");
    writeJsonAtomic(target, { format: "fixture", count: 2 });
    expect(JSON.parse(readFileSync(target, "utf8"))).toEqual({ format: "fixture", count: 2 });
    expect(readdirSync(root)).toEqual(["catalog.json"]);
  });

  it("refuses a non-JSON top-level value without touching the destination", () => {
    const root = temporaryRoot("atomic-invalid");
    const target = join(root, "catalog.json");
    writeFileSync(target, "preserved");
    expect(() => writeJsonAtomic(target, undefined)).toThrow(/non-JSON/u);
    expect(readFileSync(target, "utf8")).toBe("preserved");
    expect(readdirSync(root)).toEqual(["catalog.json"]);
  });

  it("refuses nested lossy JSON values without touching the destination", () => {
    const root = temporaryRoot("atomic-lossy");
    const target = join(root, "catalog.json");
    writeFileSync(target, "preserved");
    expect(() => writeJsonAtomic(target, { required: undefined, numeric: Number.NaN })).toThrow(/non-JSON|non-finite/u);
    expect(readFileSync(target, "utf8")).toBe("preserved");
    expect(readdirSync(root)).toEqual(["catalog.json"]);
  });
});

// Compile-time assertion that the validated object is the public strict type.
const _catalogTypeCheck: NasAssetCatalogV1 = validateNasAssetCatalogV1(catalogValue());
void _catalogTypeCheck;
