import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  parseNamedCrystalCatalog,
  renderNamedCrystalCatalogTable,
  summarizeNamedCrystalCatalog,
} from "../../scripts/named-crystal-catalog.ts";

const REPO = resolve(import.meta.dirname, "../..");
const MANIFEST = resolve(REPO, "docs/named-snow-crystal-catalog.json");
const rawManifest = (): Record<string, unknown> =>
  JSON.parse(readFileSync(MANIFEST, "utf8")) as Record<string, unknown>;

const acceptedVariant = (entryId: string, webPayloadBytes = 1_000_000) => ({
  entryId,
  variation: { driver: "qualified G-G parameter", value: 1, unit: "recorded units" },
  links: {
    preview: "out/example.png",
    webAsset: "out/example-growth-v1.bin",
    recipeOrScene: "docs/example.json",
    scientificBundle: "collections/example/payload/",
  },
  webPayloadBytes,
});

describe("named snow-crystal catalog", () => {
  it("pins the 35-row, 33-type, 99-animation maker scope", () => {
    const catalog = parseNamedCrystalCatalog(rawManifest());
    expect(summarizeNamedCrystalCatalog(catalog)).toEqual({
      taxonomyRows: 35,
      includedTypes: 33,
      excludedTypes: 2,
      ggTypes: 24,
      composeTypes: 9,
      requiredSlots: 99,
      acceptedSlots: 24,
      remainingSlots: 75,
    });
    expect(catalog.entries.filter((entry) => entry.route === "excluded-new-physics").map((entry) => entry.name))
      .toEqual(["Rimed", "Graupel"]);
  });

  it("renders a text table with linked current records without accepting candidates", () => {
    const catalog = parseNamedCrystalCatalog(rawManifest());
    const table = renderNamedCrystalCatalogTable(catalog, resolve(REPO, "docs/named-snow-crystal-catalog.md"));
    expect(table).toContain("| Hollow Columns | gg |");
    expect(table).toContain("[fig30 (anchor)](../evidence/gutcheck-gg-realism/fig-records/fig30-record.json)");
    expect(table).toContain("[scroll-stop-100 (anchor)](named-snow-crystal-early-stop-probe-review.json)");
    expect(table).toContain("| Required accepted animations | 99 |");
    expect(table).toContain("| Accepted animations | 24 |");
    expect(table).toContain("lower: [preview](../out/named-crystal-catalog/direct-production-v1/review-renders/solid-columns-lower-tilt55.png)");
    expect(table).toContain("[web](../out/named-crystal-catalog/direct-production-v1/solid-columns-lower/growth-v1.bin)");
    expect(table).toContain("[science](../out/named-crystal-catalog/direct-production-v1/solid-columns-lower)");
    expect(table).toContain("| Rimed | excluded-new-physics | — | — | Excluded");
  });

  it("rejects any other excluded-type set or route total", () => {
    const raw = rawManifest();
    const entries = raw["entries"] as Array<Record<string, unknown>>;
    const rimed = entries.find((entry) => entry["name"] === "Rimed")!;
    rimed["route"] = "gg-plus";
    rimed["variants"] = { lower: null, baseline: null, upper: null };
    rimed["exclusionReason"] = null;
    expect(() => parseNamedCrystalCatalog(raw)).toThrow(/route\/count contract|exclusions/);
  });

  it("rejects duplicate accepted identities and payloads at the ceiling", () => {
    const duplicated = rawManifest();
    const duplicatedEntries = duplicated["entries"] as Array<Record<string, unknown>>;
    (duplicatedEntries[0]!["variants"] as Record<string, unknown>)["lower"] = acceptedVariant("duplicate");
    (duplicatedEntries[1]!["variants"] as Record<string, unknown>)["baseline"] = acceptedVariant("duplicate");
    expect(() => parseNamedCrystalCatalog(duplicated)).toThrow(/fills more than one slot/);

    const oversized = rawManifest();
    const oversizedEntries = oversized["entries"] as Array<Record<string, unknown>>;
    (oversizedEntries[0]!["variants"] as Record<string, unknown>)["lower"] = acceptedVariant(
      "too-large",
      20_000_000,
    );
    expect(() => parseNamedCrystalCatalog(oversized)).toThrow(/below 20000000/);
  });
});
