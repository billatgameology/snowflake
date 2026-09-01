import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { createNamedCrystalCatalogService } from "../named-crystal-catalog-service.ts";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");

describe("named crystal local gallery service", () => {
  it("builds the complete accepted catalog index with three variants per included family", () => {
    const service = createNamedCrystalCatalogService(REPOSITORY_ROOT);
    const index = service.index as {
      counts: {
        families: number;
        includedFamilies: number;
        variants: number;
        directFamilies: number;
        composeFamilies: number;
        excludedFamilies: number;
      };
      entries: Array<{ route: string; variants: unknown[] }>;
    };
    expect(index.counts).toEqual({
      families: 35,
      includedFamilies: 33,
      variants: 99,
      directFamilies: 22,
      composeFamilies: 11,
      excludedFamilies: 2,
    });
    expect(index.entries).toHaveLength(35);
    expect(index.entries.filter((entry) => entry.route !== "excluded-new-physics"))
      .toSatisfy((entries: Array<{ variants: unknown[] }>) => entries.every((entry) => entry.variants.length === 3));
  });
});
