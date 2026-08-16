import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  parseNasAssetCatalogV1,
  type NasAssetCatalogV1,
  type NasManifestSelectorV1,
  type NasOwnerManifestV1,
} from "../../scripts/nas-asset-lib.ts";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CATALOG_PATH = `${REPOSITORY_ROOT}docs/nas-assets.json`;
const CATALOG_SOURCE = readFileSync(CATALOG_PATH, "utf8");
const CATALOG = parseNasAssetCatalogV1(CATALOG_SOURCE);

type Aggregate = { readonly files: number; readonly bytes: number };
type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown, label: string): JsonRecord => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} is not an object`);
  }
  return value as JsonRecord;
};

const asArray = (value: unknown, label: string): readonly unknown[] => {
  if (!Array.isArray(value)) throw new Error(`${label} is not an array`);
  return value;
};

const asNumber = (value: unknown, label: string): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} is not a non-negative safe integer`);
  }
  return value;
};

const asString = (value: unknown, label: string): string => {
  if (typeof value !== "string") throw new Error(`${label} is not a string`);
  return value;
};

const sumRows = (rows: readonly unknown[], label: string): Aggregate => ({
  files: rows.length,
  bytes: rows.reduce<number>(
    (total, row, index) => total + asNumber(asRecord(row, `${label}[${index}]`).bytes, `${label}[${index}].bytes`),
    0,
  ),
});

const pathMatches = (path: string, prefix: string): boolean =>
  path === prefix || path.startsWith(`${prefix}/`);

const selectPathRows = (
  rows: readonly unknown[],
  selector: Extract<NasManifestSelectorV1, { readonly kind: "path-prefixes" }>,
  label: string,
): Aggregate => {
  const selected = rows.filter((row, index) => {
    const path = asString(asRecord(row, `${label}[${index}]`).path, `${label}[${index}].path`);
    return (
      selector.include.some((prefix) => pathMatches(path, prefix)) &&
      !selector.exclude.some((prefix) => pathMatches(path, prefix))
    );
  });
  return sumRows(selected, `${label}.selected`);
};

const parseTrackedManifest = (manifest: NasOwnerManifestV1): unknown =>
  JSON.parse(readFileSync(`${REPOSITORY_ROOT}${manifest.path}`, "utf8")) as unknown;

const aggregateTrackedSelector = (manifest: NasOwnerManifestV1): Aggregate => {
  if (manifest.storage !== "tracked") throw new Error(`not a tracked manifest: ${manifest.path}`);
  if (manifest.selector.kind === "documented-only") {
    throw new Error(`documented-only selector is not machine aggregable: ${manifest.path}`);
  }

  const parsed = asRecord(parseTrackedManifest(manifest), manifest.path);
  if (manifest.format === "snowflake-nas-ledger-v1") {
    const rows = asArray(parsed.files, `${manifest.path}.files`);
    if (manifest.selector.kind === "all") return sumRows(rows, `${manifest.path}.files`);
    if (manifest.selector.kind !== "path-prefixes") {
      throw new Error(`unsupported ledger selector ${manifest.selector.kind}`);
    }
    return selectPathRows(rows, manifest.selector, `${manifest.path}.files`);
  }

  if (manifest.format === "out-tree-digest-manifest-v1") {
    const trees = asRecord(parsed.trees, `${manifest.path}.trees`);
    if (manifest.selector.kind === "all") {
      return {
        files: asNumber(parsed.totalFiles, `${manifest.path}.totalFiles`),
        bytes: asNumber(parsed.totalBytes, `${manifest.path}.totalBytes`),
      };
    }
    if (manifest.selector.kind !== "json-tree-key") {
      throw new Error(`unsupported out-tree selector ${manifest.selector.kind}`);
    }
    const tree = asRecord(trees[manifest.selector.key], `${manifest.path}.trees.${manifest.selector.key}`);
    const files = asRecord(tree.files, `${manifest.path}.trees.${manifest.selector.key}.files`);
    const independentlySummed = sumRows(Object.values(files), `${manifest.path}.trees.${manifest.selector.key}.files`);
    expect(independentlySummed).toEqual({
      files: asNumber(tree.fileCount, `${manifest.path}.trees.${manifest.selector.key}.fileCount`),
      bytes: asNumber(tree.bytes, `${manifest.path}.trees.${manifest.selector.key}.bytes`),
    });
    return independentlySummed;
  }

  if (manifest.format === "gutcheck-research-inventory-v1") {
    if (manifest.selector.kind !== "all") {
      throw new Error(`unsupported media-inventory selector ${manifest.selector.kind}`);
    }
    const rows = asArray(parsed.files, `${manifest.path}.files`);
    const aggregate = sumRows(rows, `${manifest.path}.files`);
    const totals = asRecord(parsed.totals, `${manifest.path}.totals`);
    expect(aggregate).toEqual({
      files: asNumber(totals.files, `${manifest.path}.totals.files`),
      bytes: asNumber(totals.bytes, `${manifest.path}.totals.bytes`),
    });
    return aggregate;
  }

  if (manifest.format === "gutcheck-large-inventory-v1") {
    if (manifest.selector.kind !== "all") {
      throw new Error(`unsupported large-inventory selector ${manifest.selector.kind}`);
    }
    const loose = sumRows(asArray(parsed.files, `${manifest.path}.files`), `${manifest.path}.files`);
    const archives = sumRows(asArray(parsed.archives, `${manifest.path}.archives`), `${manifest.path}.archives`);
    return { files: loose.files + archives.files, bytes: loose.bytes + archives.bytes };
  }

  throw new Error(`unsupported machine-readable tracked manifest format ${manifest.format}`);
};

const collectionByReference = (
  catalog: NasAssetCatalogV1,
  reference: string,
): NasAssetCatalogV1["collections"][number] | undefined =>
  catalog.collections.find((collection) => `${collection.assetId}@${collection.version}` === reference);

describe("tracked NAS asset catalogue", () => {
  it("loads the strict real catalogue and pins the read-only census dispositions", () => {
    const expected = {
      "gutcheck-generated-public@2026-08-15": ["active", 21480, 446258860293],
      "earlier-phase3-visual@2026-08-01": ["active", 10, 984164],
      "research-private-freeze@2026-08-11": ["active", 3642, 1593265642],
      "research-tracked-record-mirror@2026-08-11": ["active", 20, 948955],
      "gutcheck-workspace-remainder@2026-08-15": ["provisional", 931, 833991988],
      "gutcheck-retained-archives@2026-08-07": ["provisional", 6, 10721854876],
      "out-legacy-scratch-archives@2026-08-15": ["provisional", 2, 41999619],
      "phase9-failed-debug@2026-08-13": ["provisional", 10, 85153],
      "phase6-arm64-host-record@2026-08-12": ["provisional", 55, 43644],
      "wp3-phase4-review@2026-08-12": ["provisional", 21, 2530556],
      "research-recovery-scratch@2026-08-11": ["provisional", 72991, 2401810560],
      "research-mac-snapshot@2026-08-15": ["provisional", 1, 1172661248],
      "phase8b-derived@2026-08-15": ["provisional", 66, 11636810],
      "phase8b-search@2026-08-15": ["provisional", 115, 232427655],
      "phase9-search@2026-08-15": ["provisional", 3, 631494],
      "post-phase9-intake@2026-08-13": ["provisional", 27, 165728249],
      "research-copy-verification-residue@2026-08-10": ["provisional", 24, 110412535],
      "earlier-phase2b@2026-08-01": ["unavailable", 11, 60438811],
      "earlier-phase4@2026-08-01": ["unavailable", 125, 519684864],
      "earlier-phase4-visual@2026-08-01": ["unavailable", 21, 1924721],
      "earlier-phase5@2026-08-01": ["unavailable", 78, 80944402],
      "earlier-phase5-wp5-0a611e7@2026-08-01": ["unavailable", 78, 79697941],
      "earlier-phase5-wp5-0a611e7-original@2026-08-01": ["unavailable", 78, 79697941],
      "earlier-phase5-wp7-32eed48-superseded@2026-08-01": ["unavailable", 78, 80944780],
    } as const;

    expect(Object.fromEntries(CATALOG.collections.map((collection) => [
      `${collection.assetId}@${collection.version}`,
      [collection.state, collection.aggregate.files, collection.aggregate.bytes],
    ]))).toEqual(expected);
    expect(CATALOG.overlays.map((overlay) => overlay.overlayId)).toEqual([
      "research-media-subset",
      "gutcheck-large-products-and-archives",
      "phase3-visual-nas-presence",
    ]);
    expect(CATALOG.systemExclusions.map((exclusion) => exclusion.path)).toEqual([
      "#recycle",
      ".DS_Store",
      "_control",
    ]);
  });

  it("recomputes every tracked manifest byte length and digest", () => {
    const manifests = [
      ...CATALOG.collections.flatMap((collection) => collection.ownerManifest === null ? [] : [collection.ownerManifest]),
      ...CATALOG.overlays.map((overlay) => overlay.manifest),
    ].filter((manifest) => manifest.storage === "tracked");
    const unique = new Map<string, NasOwnerManifestV1>();
    for (const manifest of manifests) {
      const prior = unique.get(manifest.path);
      if (prior !== undefined) {
        expect({ bytes: manifest.bytes, sha256: manifest.sha256 }).toEqual({
          bytes: prior.bytes,
          sha256: prior.sha256,
        });
      } else {
        unique.set(manifest.path, manifest);
      }
    }

    for (const manifest of unique.values()) {
      const bytes = readFileSync(`${REPOSITORY_ROOT}${manifest.path}`);
      expect(bytes.byteLength, manifest.path).toBe(manifest.bytes);
      expect(createHash("sha256").update(bytes).digest("hex"), manifest.path).toBe(manifest.sha256);
    }
  });

  it("binds every active restore declaration to the real destination-aware commands", () => {
    const pkg = JSON.parse(readFileSync(`${REPOSITORY_ROOT}package.json`, "utf8")) as {
      readonly scripts: Readonly<Record<string, string>>;
    };
    expect(pkg.scripts["assets:restore"]).toBe("node scripts/nas-asset-restore.ts restore");
    expect(pkg.scripts["assets:verify-restored"]).toBe("node scripts/nas-asset-restore.ts verify");

    for (const collection of CATALOG.collections.filter(({ state }) => state === "active")) {
      const identity = `${collection.assetId}@${collection.version}`;
      const destination = `out/restores/${collection.assetId}-${collection.version}`;
      expect(collection.restore.command, identity).toBe(
        `npm run assets:restore -- --collection ${identity} --to ${destination}`,
      );
      expect(collection.restore.verifyCommand, identity).toBe(
        `npm run assets:verify-restored -- --collection ${identity} --from ${destination}`,
      );
    }
  });

  it("re-derives every machine-readable tracked owner selection", () => {
    for (const collection of CATALOG.collections) {
      const manifest = collection.ownerManifest;
      if (
        manifest === null ||
        manifest.storage !== "tracked" ||
        manifest.selector.kind === "documented-only"
      ) {
        continue;
      }
      expect(aggregateTrackedSelector(manifest), `${collection.assetId}@${collection.version}`).toEqual(
        collection.aggregate,
      );
    }
  });

  it("checks machine-readable overlay scopes without turning them into competing owners", () => {
    const overlays = Object.fromEntries(CATALOG.overlays.map((overlay) => [overlay.overlayId, overlay]));
    expect(aggregateTrackedSelector(overlays["research-media-subset"]!.manifest)).toEqual({
      files: 2477,
      bytes: 2013534785,
    });
    expect(aggregateTrackedSelector(overlays["gutcheck-large-products-and-archives"]!.manifest)).toEqual({
      files: 1651,
      bytes: 52869829197,
    });

    const phase3Overlay = aggregateTrackedSelector(overlays["phase3-visual-nas-presence"]!.manifest);
    expect(phase3Overlay).toEqual(
      collectionByReference(CATALOG, "earlier-phase3-visual@2026-08-01")?.aggregate,
    );
  });

  it("binds the private whole-cache manifest without publishing a sensitive root name", () => {
    const privateSelections = CATALOG.collections.filter(
      (collection) => collection.ownerManifest?.format === "vcc-research-cache-jsonl-v1",
    );
    expect(privateSelections.map((collection) => [
      collection.ownerManifest?.selector.kind === "jsonl-field-equals"
        ? collection.ownerManifest.selector.equals
        : null,
      collection.aggregate,
    ])).toEqual([
      ["ignored-research-cache", { files: 3642, bytes: 1593265642 }],
      ["tracked-project-record", { files: 20, bytes: 948955 }],
      ["recovery-or-scratch", { files: 72991, bytes: 2401810560 }],
    ]);
    for (const collection of privateSelections) {
      expect(collection.ownerManifest).toMatchObject({
        storage: "nas-private",
        path: "research-cache/RESEARCH-CACHE-MANIFEST.jsonl",
        bytes: 20531852,
        sha256: "3f5b2cd66f653a75f7ed91d769e35b97194e8ffe16901a1a3267d1bf497b6846",
      });
    }

    const serialized = CATALOG_SOURCE.toLowerCase();
    for (const forbidden of ["openalex", "api-key", "apikey", "access-token", "credential"]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("resolves every external-evidence authority and requires accepted decisions", () => {
    const external = CATALOG.collections.filter((collection) => collection.storageClass === "external-evidence");
    expect(external.length).toBeGreaterThan(0);
    for (const collection of external) {
      const authority = collection.externalEvidenceAuthority;
      expect(authority, collection.assetId).not.toBeNull();
      if (authority === null) continue;
      for (const decision of authority.decisionRefs) {
        const text = readFileSync(`${REPOSITORY_ROOT}${decision}`, "utf8");
        expect(text, `${collection.assetId}: ${decision}`).toMatch(/\*\*Status:\*\* accepted/iu);
      }
      for (const record of [...authority.planRefs, ...authority.claimRefs]) {
        expect(() => readFileSync(`${REPOSITORY_ROOT}${record}`), `${collection.assetId}: ${record}`).not.toThrow();
      }
    }
  });
});
