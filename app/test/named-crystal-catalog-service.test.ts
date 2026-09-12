import { resolve } from "node:path";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import type { IncomingMessage, ServerResponse } from "node:http";

import { describe, expect, it } from "vitest";

import { createNamedCrystalCatalogService } from "../named-crystal-catalog-service.ts";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");

describe("named crystal local gallery service", () => {
  it("loads a checkout without generated scenes and refuses unavailable or unknown assets", () => {
    const root = mkdtempSync(resolve(tmpdir(), "catalog-checkout-"));
    try {
      mkdirSync(resolve(root, "docs"));
      for (const name of ["named-snow-crystal-catalog.json", "named-snow-crystal-final-direct-review.json", "named-snow-crystal-final-compose-review.json"]) {
        copyFileSync(resolve(REPOSITORY_ROOT, "docs", name), resolve(root, "docs", name));
      }
      const service = createNamedCrystalCatalogService(root);
      const request = (url: string) => {
        const response = { statusCode: 0, setHeader() {}, end() {} };
        service.handler({ url, method: "GET" } as IncomingMessage, response as unknown as ServerResponse);
        return response.statusCode;
      };
      expect(request("/index.json")).toBe(200);
      expect(request("/scene/12-branched-stars-lower.json")).toBe(409);
      expect(request("/scene/not-catalogued.json")).toBe(403);
      expect(request(`/growth/${"0".repeat(64)}.bin`)).toBe(403);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

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
      entries: Array<{
        route: string;
        variants: Array<{ entryId: string; previewUrl: string; sceneUrl: string }>;
      }>;
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
    const variants = index.entries.flatMap((entry) => entry.variants);
    expect(variants).toSatisfy((items: typeof variants) => items.every((variant) =>
      variant.previewUrl === `/named-crystal-catalog-api/preview/${variant.entryId}.png`
      && variant.sceneUrl === `/named-crystal-catalog-api/scene/${variant.entryId}.json`));
  });
});
