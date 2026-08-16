import { createHash } from "node:crypto";
import {
  appendFileSync,
  closeSync,
  constants,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import {
  auditTopLevelEntries,
  readFileDescriptorCapped,
  runNasAssetsCli,
  type NasAssetsCliIo,
} from "../../scripts/nas-assets.ts";
import {
  parseNasAssetCatalogV1,
  type NasAssetCatalogV1,
} from "../../scripts/nas-asset-lib.ts";
import { NAS_SHARE_MARKER, NAS_SHARE_MARKER_PATH } from "../../scripts/nas-root.ts";

const REPO = resolve(import.meta.dirname, "..", "..");
const REAL_CATALOG_PATH = join(REPO, "docs", "nas-assets.json");
const REAL_CATALOG = parseNasAssetCatalogV1(readFileSync(REAL_CATALOG_PATH, "utf8"));
const temporaryRoots: string[] = [];

function temporaryRoot(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `nas-assets-${label}-`));
  temporaryRoots.push(root);
  return root;
}

afterAll(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
});

function writeMarker(root: string, marker: unknown = NAS_SHARE_MARKER): void {
  writeFileSync(join(root, NAS_SHARE_MARKER_PATH), `${JSON.stringify(marker)}\n`);
}

function makeAuditShare(): string {
  const root = temporaryRoot("audit-share");
  writeMarker(root);
  mkdirSync(join(root, "collections"));
  mkdirSync(join(root, "out"));
  mkdirSync(join(root, "research-cache"));
  mkdirSync(join(root, "_control"));
  return root;
}

interface CliResult {
  readonly code: number;
  readonly raw: string;
  readonly report: Record<string, unknown>;
}

function run(argv: readonly string[], overrides: NasAssetsCliIo = {}): CliResult {
  const lines: string[] = [];
  const code = runNasAssetsCli(argv, {
    cwd: REPO,
    environment: {},
    nasCandidates: [],
    ...overrides,
    write: (line) => lines.push(line),
  });
  expect(lines).toHaveLength(1);
  return {
    code,
    raw: lines[0] as string,
    report: JSON.parse(lines[0] as string) as Record<string, unknown>,
  };
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function privateFixtureCatalog(manifestBytes: Buffer, payloadFiles: number, payloadBytes: number): unknown {
  const template = REAL_CATALOG.collections.find((collection) => collection.assetId === "research-private-freeze");
  if (template === undefined) throw new Error("missing private collection template");
  return {
    format: REAL_CATALOG.format,
    projectId: REAL_CATALOG.projectId,
    shareMarker: REAL_CATALOG.shareMarker,
    canonicalEnvironmentVariable: REAL_CATALOG.canonicalEnvironmentVariable,
    compatibilityEnvironmentVariable: REAL_CATALOG.compatibilityEnvironmentVariable,
    controlRoot: REAL_CATALOG.controlRoot,
    collections: [{
      ...structuredClone(template),
      assetId: "fixture-private",
      version: "v1",
      state: "active",
      locator: "payload",
      historicalRepoPath: null,
      legacyAliases: [],
      aggregate: { files: payloadFiles, bytes: payloadBytes },
      ownerManifest: {
        storage: "nas-private",
        path: "private/manifest.jsonl",
        format: "fixture-jsonl-v1",
        bytes: manifestBytes.byteLength,
        sha256: sha256(manifestBytes),
        selector: {
          kind: "jsonl-field-equals",
          recordType: "file",
          field: "storageClass",
          equals: "fixture-private",
        },
      },
      serve: { policy: "deny", prefixes: [] },
      supersedes: [],
      unresolved: [],
    }],
    overlays: [],
    systemExclusions: [],
  };
}

function makePrivateVerifyFixture(): {
  readonly root: string;
  readonly catalogue: string;
  readonly manifest: Buffer;
} {
  const root = temporaryRoot("private-verify");
  writeMarker(root);
  mkdirSync(join(root, "private"));
  const one = "one";
  const two = "two!";
  const manifest = Buffer.from([
    JSON.stringify({ recordType: "header", schemaVersion: 1 }),
    JSON.stringify({
      recordType: "file",
      path: "a.bin",
      bytes: Buffer.byteLength(one),
      sha256: sha256(one),
      storageClass: "fixture-private",
    }),
    JSON.stringify({
      recordType: "file",
      path: "sub/b.bin",
      bytes: Buffer.byteLength(two),
      sha256: sha256(two),
      storageClass: "fixture-private",
    }),
    "",
  ].join("\n"));
  writeFileSync(join(root, "private", "manifest.jsonl"), manifest);
  const catalogue = join(temporaryRoot("private-catalog"), "catalog.json");
  writeFileSync(catalogue, JSON.stringify(privateFixtureCatalog(manifest, 2, 7)));
  return { root, catalogue, manifest };
}

describe("NAS asset CLI argument boundary", () => {
  it.each([
    { argv: [] },
    { argv: ["unknown"] },
    { argv: ["audit", "--unknown"] },
    { argv: ["audit", "--catalog"] },
    { argv: ["audit", "--full"] },
    { argv: ["audit", "--collection", "fixture"] },
    { argv: ["audit", "--repo-root", "/tmp"] },
    { argv: ["verify", "--full"] },
    { argv: ["verify", "--full", "--collection", "one", "--collection", "two"] },
  ])("rejects malformed argv $argv with one JSON failure document", ({ argv }) => {
    const result = run(argv);
    expect(result.code).toBe(1);
    expect(result.report).toMatchObject({ ok: false });
    expect(result.raw.trim().startsWith("{")).toBe(true);
  });

  it("registers read-only checks and legacy restore without exposing publish or prune", () => {
    const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts["assets:audit"]).toBe("node scripts/nas-assets.ts audit");
    expect(pkg.scripts["assets:verify"]).toBe("node scripts/nas-assets.ts verify");
    expect(pkg.scripts["assets:restore"]).toBe("node scripts/nas-asset-restore.ts restore");
    expect(pkg.scripts["assets:verify-restored"]).toBe("node scripts/nas-asset-restore.ts verify");
    expect(Object.keys(pkg.scripts).some((name) => /^assets:(?:publish|prune)$/u.test(name))).toBe(false);
  });

  it("caps a descriptor read even when the file grows after the first chunk", () => {
    const root = temporaryRoot("bounded-growth");
    const path = join(root, "growing.bin");
    writeFileSync(path, "abc");
    const fd = openSync(path, constants.O_RDONLY);
    let appended = false;
    try {
      expect(() => readFileDescriptorCapped(fd, 4, "fixture", () => {
        if (appended) return;
        appended = true;
        appendFileSync(path, "0123456789");
      })).toThrow(/bounded read limit/u);
    } finally {
      closeSync(fd);
    }
    expect(appended).toBe(true);
  });
});

describe("bounded top-level NAS audit", () => {
  it("accepts a marked fixture containing only required catalogued roots", () => {
    const root = makeAuditShare();
    const result = run(["audit", "--nas-root", root]);
    expect(result.code).toBe(0);
    expect(result.report).toMatchObject({
      ok: true,
      scope: "bounded-top-level-metadata",
      mount: "attached",
    });
  });

  it("reports unclassified and reserved names only as counts and never emits either name", () => {
    const root = makeAuditShare();
    const secretName = "private-unregistered-source-name";
    writeFileSync(join(root, secretName), "must not leak");
    writeFileSync(join(root, "CON"), "reserved");
    const result = run(["audit", "--nas-root", root]);
    expect(result.code).toBe(1);
    expect(result.raw).not.toContain(secretName);
    expect(result.raw).not.toContain("CON");
    expect(result.report).toMatchObject({ ok: false, mount: "attached" });
    const counts = result.report.counts as Record<string, number>;
    expect(counts.unclassifiedEntries).toBe(2);
    expect(counts.unsafeEntries).toBe(1);
  });

  it("detects case and decomposed-Unicode aliases without host filesystem assumptions", () => {
    const first = REAL_CATALOG.collections[0];
    if (first === undefined) throw new Error("fixture catalogue has no collection");
    const shaped = {
      ...REAL_CATALOG,
      collections: [{ ...first, locator: "café/items", legacyAliases: [] }],
      overlays: [],
      systemExclusions: [],
    } as NasAssetCatalogV1;
    const counts = auditTopLevelEntries(shaped, [
      { name: "out", kind: "directory" },
      { name: "OUT", kind: "directory" },
      { name: "café", kind: "directory" },
      { name: "cafe\u0301", kind: "directory" },
      { name: "CON", kind: "file" },
      { name: NAS_SHARE_MARKER_PATH, kind: "file" },
      { name: "_control", kind: "directory" },
    ]);
    expect(counts.caseOrNfcAliasEntries).toBe(4);
    expect(counts.unsafeEntries).toBe(2);
    expect(counts.unclassifiedEntries).toBe(3);
  });

  it("distinguishes a detached share from an explicitly wrong marker", () => {
    const detached = run(["audit"]);
    expect(detached.code).toBe(1);
    expect(detached.report).toMatchObject({ mount: "detached", ok: false });

    const wrong = temporaryRoot("wrong-marker");
    writeMarker(wrong, { format: "wrong", projectId: NAS_SHARE_MARKER.projectId });
    const invalid = run(["audit", "--nas-root", wrong]);
    expect(invalid.code).toBe(1);
    expect(invalid.report).toMatchObject({ mount: "invalid", ok: false, counts: null });
  });
});

describe("bounded owner-manifest verification", () => {
  it("verifies tracked path-prefix and tree-key aggregates without a NAS mount", () => {
    const pathPrefixes = run(["verify", "--collection", "phase9-failed-debug"]);
    expect(pathPrefixes.code).toBe(0);
    expect(pathPrefixes.report).toMatchObject({ ok: true, mount: "not-required" });
    expect(pathPrefixes.report.collections).toEqual([
      expect.objectContaining({ manifest: "verified", aggregate: "verified", payload: "not-run" }),
    ]);

    const treeKey = run(["verify", "--collection", "earlier-phase3-visual"]);
    expect(treeKey.code).toBe(0);
    expect(treeKey.report.collections).toEqual([
      expect.objectContaining({ manifest: "verified", aggregate: "verified", payload: "not-run" }),
    ]);
  });

  it("preserves documented-only and unavailable limits instead of upgrading them", () => {
    const documented = run(["verify", "--collection", "research-mac-snapshot"]);
    expect(documented.code).toBe(0);
    expect(documented.report.collections).toEqual([
      expect.objectContaining({ manifest: "verified", aggregate: "unsupported", payload: "not-run" }),
    ]);

    const unavailable = run(["verify", "--collection", "earlier-phase2b"]);
    expect(unavailable.code).toBe(0);
    expect(unavailable.report.collections).toEqual([
      expect.objectContaining({
        state: "unavailable",
        manifest: "verified",
        aggregate: "verified",
        payload: "catalogued-unavailable",
      }),
    ]);
  });

  it("verifies all-selector aggregates for an unavailable collection without a locator", () => {
    const repoRoot = temporaryRoot("unavailable-all-repo");
    const manifest = Buffer.from(JSON.stringify({
      files: [{ path: "out/phase2b/a.bin", bytes: 3, sha256: sha256("one") }],
    }));
    writeFileSync(join(repoRoot, "manifest.json"), manifest);
    const template = REAL_CATALOG.collections.find((collection) => collection.assetId === "earlier-phase2b");
    if (template === undefined) throw new Error("missing unavailable collection template");
    const collection = structuredClone(template) as unknown as {
      aggregate: { files: number; bytes: number };
      ownerManifest: { path: string; format: string; bytes: number; sha256: string; selector: unknown };
    };
    collection.aggregate = { files: 1, bytes: 3 };
    collection.ownerManifest = {
      ...collection.ownerManifest,
      path: "manifest.json",
      format: "fixture-all-v1",
      bytes: manifest.byteLength,
      sha256: sha256(manifest),
      selector: { kind: "all" },
    } as typeof collection.ownerManifest;
    const catalog = {
      format: REAL_CATALOG.format,
      projectId: REAL_CATALOG.projectId,
      shareMarker: REAL_CATALOG.shareMarker,
      canonicalEnvironmentVariable: REAL_CATALOG.canonicalEnvironmentVariable,
      compatibilityEnvironmentVariable: REAL_CATALOG.compatibilityEnvironmentVariable,
      controlRoot: REAL_CATALOG.controlRoot,
      collections: [collection],
      overlays: [],
      systemExclusions: [],
    };
    const catalogPath = join(temporaryRoot("unavailable-all-catalog"), "catalog.json");
    writeFileSync(catalogPath, JSON.stringify(catalog));
    const result = run([
      "verify", "--catalog", catalogPath, "--repo-root", repoRoot,
      "--collection", "earlier-phase2b",
    ]);
    expect(result.code).toBe(0);
    expect(result.report.collections).toEqual([
      expect.objectContaining({ aggregate: "verified", payload: "catalogued-unavailable" }),
    ]);

    const outside = Buffer.from(JSON.stringify({
      files: [{ path: "out/legacy/a.bin", bytes: 3, sha256: sha256("one") }],
    }));
    writeFileSync(join(repoRoot, "manifest.json"), outside);
    collection.ownerManifest.bytes = outside.byteLength;
    collection.ownerManifest.sha256 = sha256(outside);
    writeFileSync(catalogPath, JSON.stringify({ ...catalog, collections: [collection] }));
    const rejected = run([
      "verify", "--catalog", catalogPath, "--repo-root", repoRoot,
      "--collection", "earlier-phase2b",
    ]);
    expect(rejected.code).toBe(1);
    expect(rejected.raw).toContain("owner-manifest-selector-invalid");
  });

  it("verifies a NAS-private JSONL manifest and explicitly reports that payload bytes were not read", () => {
    const fixture = makePrivateVerifyFixture();
    const result = run([
      "verify",
      "--catalog", fixture.catalogue,
      "--nas-root", fixture.root,
      "--collection", "fixture-private",
    ]);
    expect(result.code).toBe(0);
    expect(result.report).toMatchObject({
      ok: true,
      mount: "attached",
      scope: "owner-manifest-and-selector-aggregates",
      fullPayloadTotals: null,
    });
    expect(result.report.collections).toEqual([
      expect.objectContaining({ manifest: "verified", aggregate: "verified", payload: "not-run" }),
    ]);
    expect(result.raw).toContain("payload-bytes-not-read");
  });

  it("fails honestly when an active NAS-private owner manifest is detached", () => {
    const fixture = makePrivateVerifyFixture();
    const result = run([
      "verify",
      "--catalog", fixture.catalogue,
      "--collection", "fixture-private",
    ]);
    expect(result.code).toBe(1);
    expect(result.report).toMatchObject({ ok: false, mount: "detached" });
    expect(result.report.collections).toEqual([
      expect.objectContaining({ state: "active", manifest: "unavailable", aggregate: "not-checked" }),
    ]);
    expect(result.raw).toContain("nas-detached-for-requested-verification");
  });

  it("fails closed when registered owner-manifest bytes have a different digest", () => {
    const fixture = makePrivateVerifyFixture();
    const catalog = privateFixtureCatalog(fixture.manifest, 2, 7) as {
      collections: Array<{ ownerManifest: { sha256: string } }>;
    };
    catalog.collections[0]!.ownerManifest.sha256 = "0".repeat(64);
    writeFileSync(fixture.catalogue, JSON.stringify(catalog));
    const result = run([
      "verify",
      "--catalog", fixture.catalogue,
      "--nas-root", fixture.root,
      "--collection", "fixture-private",
    ]);
    expect(result.code).toBe(1);
    expect(result.raw).toContain("owner-manifest-byte-or-digest-mismatch");
    expect(result.report.collections).toEqual([
      expect.objectContaining({ manifest: "mismatch", aggregate: "not-checked" }),
    ]);
  });

  it("does not require a private overlay mount for one targeted tracked collection", () => {
    const shaped = structuredClone(REAL_CATALOG) as unknown as {
      overlays: Array<{ manifest: { storage: string; path: string } }>;
    };
    const overlay = shaped.overlays[0];
    if (overlay === undefined) throw new Error("fixture catalogue has no overlay");
    overlay.manifest.storage = "nas-private";
    overlay.manifest.path = "private/unrelated-overlay.json";
    const catalogPath = join(temporaryRoot("private-overlay-catalog"), "catalog.json");
    writeFileSync(catalogPath, JSON.stringify(shaped));
    const result = run([
      "verify",
      "--catalog", catalogPath,
      "--collection", "phase9-failed-debug",
    ]);
    expect(result.code).toBe(0);
    expect(result.report).toMatchObject({ ok: true, mount: "not-required", overlays: [] });
  });
});

describe("explicit full verification", () => {
  it("hashes only the explicitly selected manifest rows and catches a payload mutation", () => {
    const fixture = makePrivateVerifyFixture();
    mkdirSync(join(fixture.root, "payload", "sub"), { recursive: true });
    writeFileSync(join(fixture.root, "payload", "a.bin"), "one");
    writeFileSync(join(fixture.root, "payload", "sub", "b.bin"), "two!");
    const argv = [
      "verify",
      "--catalog", fixture.catalogue,
      "--nas-root", fixture.root,
      "--collection", "fixture-private",
      "--full",
    ];
    const green = run(argv);
    expect(green.code).toBe(0);
    expect(green.report).toMatchObject({
      ok: true,
      scope: "explicit-single-collection-full-hash",
      fullPayloadTotals: { files: 2, bytes: 7 },
    });
    expect(green.report.collections).toEqual([
      expect.objectContaining({ payload: "verified-full" }),
    ]);

    writeFileSync(join(fixture.root, "payload", "a.bin"), "bad");
    const bad = run(argv);
    expect(bad.code).toBe(1);
    expect(bad.raw).toContain("payload-byte-or-digest-mismatch");
    expect(bad.report.collections).toEqual([
      expect.objectContaining({ payload: "mismatch" }),
    ]);
  });

  it("rejects an all-selector row outside its collection locator instead of rewriting it", () => {
    const root = temporaryRoot("all-row-outside");
    writeMarker(root);
    mkdirSync(join(root, "private"));
    mkdirSync(join(root, "payload", "other"), { recursive: true });
    writeFileSync(join(root, "payload", "other", "a.bin"), "one");
    const manifest = Buffer.from(JSON.stringify({
      files: [{ path: "other/a.bin", bytes: 3, sha256: sha256("one") }],
    }));
    writeFileSync(join(root, "private", "manifest.json"), manifest);
    const catalogue = privateFixtureCatalog(manifest, 1, 3) as {
      collections: Array<{
        ownerManifest: { path: string; selector: unknown };
      }>;
    };
    catalogue.collections[0]!.ownerManifest.path = "private/manifest.json";
    catalogue.collections[0]!.ownerManifest.selector = { kind: "all" };
    const catalogPath = join(temporaryRoot("all-row-outside-catalog"), "catalog.json");
    writeFileSync(catalogPath, JSON.stringify(catalogue));

    const result = run([
      "verify", "--catalog", catalogPath, "--nas-root", root,
      "--collection", "fixture-private", "--full",
    ]);
    expect(result.code).toBe(1);
    expect(result.raw).toContain("owner-manifest-selector-invalid");
    expect(result.report.collections).toEqual([
      expect.objectContaining({ aggregate: "mismatch", payload: "mismatch" }),
    ]);
  });

  it("refuses an empty owner-manifest selection before inspecting a collection root", () => {
    const root = temporaryRoot("empty-all-root");
    writeMarker(root);
    mkdirSync(join(root, "private"));
    const manifest = Buffer.from(JSON.stringify({ files: [] }));
    writeFileSync(join(root, "private", "manifest.json"), manifest);
    const catalogue = privateFixtureCatalog(manifest, 0, 0) as {
      collections: Array<{
        locator: string;
        ownerManifest: { path: string; selector: unknown };
      }>;
    };
    catalogue.collections[0]!.locator = "missing-payload";
    catalogue.collections[0]!.ownerManifest.path = "private/manifest.json";
    catalogue.collections[0]!.ownerManifest.selector = { kind: "all" };
    const catalogPath = join(temporaryRoot("empty-all-catalog"), "catalog.json");
    writeFileSync(catalogPath, JSON.stringify(catalogue));

    const result = run([
      "verify", "--catalog", catalogPath, "--nas-root", root,
      "--collection", "fixture-private", "--full",
    ]);
    expect(result.code).toBe(1);
    expect(result.raw).toContain("owner-manifest-selector-invalid");
    expect(result.raw).not.toContain("collection-root-missing-or-unsafe");
    expect(result.report.collections).toEqual([
      expect.objectContaining({ aggregate: "mismatch", payload: "mismatch" }),
    ]);
  });

  it("fully verifies a single-file collection whose sole row equals its locator", () => {
    const root = temporaryRoot("single-file-collection");
    writeMarker(root);
    mkdirSync(join(root, "private"));
    writeFileSync(join(root, "payload.bin"), "one");
    const manifest = Buffer.from(JSON.stringify({
      files: [{ path: "payload.bin", bytes: 3, sha256: sha256("one") }],
    }));
    writeFileSync(join(root, "private", "manifest.json"), manifest);
    const catalogue = privateFixtureCatalog(manifest, 1, 3) as {
      collections: Array<{
        locator: string;
        ownerManifest: { path: string; selector: unknown };
      }>;
    };
    catalogue.collections[0]!.locator = "payload.bin";
    catalogue.collections[0]!.ownerManifest.path = "private/manifest.json";
    catalogue.collections[0]!.ownerManifest.selector = { kind: "all" };
    const catalogPath = join(temporaryRoot("single-file-catalog"), "catalog.json");
    writeFileSync(catalogPath, JSON.stringify(catalogue));

    const result = run([
      "verify", "--catalog", catalogPath, "--nas-root", root,
      "--collection", "fixture-private", "--full",
    ]);
    expect(result.code).toBe(0);
    expect(result.report.collections).toEqual([
      expect.objectContaining({ aggregate: "verified", payload: "verified-full" }),
    ]);
  });
});
