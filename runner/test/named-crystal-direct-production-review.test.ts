import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { parseNamedCrystalCatalog } from "../../scripts/named-crystal-catalog.ts";

const REPO = resolve(import.meta.dirname, "../..");
const REVIEW = resolve(REPO, "docs", "named-snow-crystal-direct-production-review.json");
const CATALOG = resolve(REPO, "docs", "named-snow-crystal-catalog.json");
const SUPERSESSION = resolve(REPO, "docs", "named-snow-crystal-resolution-supersession.json");

interface ReviewWire {
  readonly format: string;
  readonly sourceReport: { readonly byteLength: number; readonly sha256: string };
  readonly contactSheet: { readonly byteLength: number; readonly sha256: string };
  readonly executionSummary: {
    readonly actualWorkerCount: number;
    readonly completed: number;
    readonly failed: number;
    readonly maximumWebBytes: number;
    readonly webPayloadLimitBytes: number;
    readonly allWebAssetsDecoderVerified: boolean;
    readonly minimumFrameCount: number;
    readonly maximumFrameCount: number;
  };
  readonly counts: {
    readonly acceptedFamilies: number;
    readonly acceptedVariants: number;
    readonly catalogSlotsFilledAfterReview: number;
  };
  readonly families: readonly {
    readonly typeId: string;
    readonly status: string;
    readonly variants: readonly {
      readonly jobId: string;
      readonly slot: "lower" | "baseline" | "upper";
      readonly webByteLength: number;
      readonly webSha256: string;
      readonly frameCount: number;
      readonly bundleTreeSha256: string;
    }[];
  }[];
}

describe("named crystal direct-production review", () => {
  it("binds the exact 24-worker dual-output run and its three-view review", () => {
    const review = JSON.parse(readFileSync(REVIEW, "utf8")) as ReviewWire;
    expect(review.format).toBe("named-crystal-direct-production-review-v1");
    expect(review.sourceReport).toEqual({
      path: "out/named-crystal-catalog/direct-production-v1/report.json",
      byteLength: 567_085,
      sha256: "ed3153cb3480180555c972ee07c0ec635111deb0773ed9bdcc1726e16dd4ef52",
    });
    expect(review.contactSheet.byteLength).toBe(8_384_905);
    expect(review.contactSheet.sha256).toBe(
      "a77d447ecb0ca6b3f4f43de02007d165076f062aa6becbfc4c4ab3677e463346",
    );
    expect(review.executionSummary).toMatchObject({
      actualWorkerCount: 24,
      completed: 24,
      failed: 0,
      maximumWebBytes: 361_488,
      webPayloadLimitBytes: 20_000_000,
      allWebAssetsDecoderVerified: true,
      minimumFrameCount: 101,
      maximumFrameCount: 121,
    });
    expect(review.counts).toEqual({
      acceptedFamilies: 8,
      acceptedVariants: 24,
      catalogSlotsFilledAfterReview: 24,
    });
    expect(review.families).toHaveLength(8);
    expect(review.families.flatMap(({ variants }) => variants)).toHaveLength(24);
    for (const family of review.families) {
      expect(family.status).toBe("accepted");
      expect(family.variants.map(({ slot }) => slot).sort()).toEqual(["baseline", "lower", "upper"]);
      for (const variant of family.variants) {
        expect(variant.webByteLength).toBeLessThan(20_000_000);
        expect(variant.webSha256).toMatch(/^[0-9a-f]{64}$/);
        expect(variant.bundleTreeSha256).toMatch(/^[0-9a-f]{64}$/);
        expect(variant.frameCount).toBeGreaterThanOrEqual(100);
        expect(variant.frameCount).toBeLessThanOrEqual(122);
      }
    }
  });

  it("preserves the reviewed 24 identities while the later resolution decision resets completion credit", () => {
    const review = JSON.parse(readFileSync(REVIEW, "utf8")) as ReviewWire;
    const catalog = parseNamedCrystalCatalog(JSON.parse(readFileSync(CATALOG, "utf8")) as unknown);
    const supersession = JSON.parse(readFileSync(SUPERSESSION, "utf8")) as {
      readonly format: string;
      readonly firstProductionReview: {
        readonly priorAcceptedVariants: number;
        readonly disposition: string;
      };
      readonly secondProductionScreen: {
        readonly executionSummary: {
          readonly actualWorkerCount: number;
          readonly completed: number;
          readonly failed: number;
          readonly maximumWebBytes: number;
          readonly webPayloadLimitBytes: number;
          readonly minimumMeshStateCount: number;
          readonly maximumMeshStateCount: number;
        };
        readonly families: readonly {
          readonly status: string;
          readonly variants: readonly {
            readonly verticalClearance: null | {
              readonly lowerLayers: number;
              readonly upperLayers: number;
            };
          }[];
        }[];
      };
      readonly catalogAfterSupersession: {
        readonly acceptedSlots: number;
        readonly remainingSlots: number;
      };
    };
    const accepted = catalog.entries.flatMap((entry) =>
      Object.values(entry.variants).filter((variant) => variant !== null),
    );
    expect(review.families.flatMap(({ variants }) => variants)).toHaveLength(24);
    expect(accepted).toHaveLength(0);
    expect(supersession.format).toBe("named-crystal-resolution-supersession-v1");
    expect(supersession.firstProductionReview).toEqual({
      path: "docs/named-snow-crystal-direct-production-review.json",
      byteLength: 24_369,
      sha256: "931e297d66487ab757a9f2964861e2974c72b0b5e639b8d557cfb9f8fd606b07",
      priorAcceptedVariants: 24,
      disposition: "morphology-screen-pass-resolution-superseded",
    });
    expect(supersession.secondProductionScreen.executionSummary).toMatchObject({
      actualWorkerCount: 24,
      completed: 24,
      failed: 0,
      maximumWebBytes: 3_576_987,
      webPayloadLimitBytes: 20_000_000,
      minimumMeshStateCount: 115,
      maximumMeshStateCount: 121,
    });
    expect(supersession.secondProductionScreen.families).toHaveLength(8);
    expect(supersession.catalogAfterSupersession).toMatchObject({ acceptedSlots: 0, remainingSlots: 99 });
    for (const family of supersession.secondProductionScreen.families) {
      expect(family.status).toBe("morphology-screen-pass-resolution-superseded");
      expect(family.variants).toHaveLength(3);
      for (const variant of family.variants) {
        if (variant.verticalClearance !== null) {
          expect(variant.verticalClearance.lowerLayers).toBeGreaterThanOrEqual(41);
          expect(variant.verticalClearance.upperLayers).toBeGreaterThanOrEqual(41);
        }
      }
    }
  });
});
