import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(import.meta.dirname, "../..");
const REVIEW_PATH = resolve(REPO, "docs/named-snow-crystal-baseline-probe-review.json");
const MANIFEST_PATH = resolve(REPO, "docs/named-snow-crystal-baseline-probes.json");

interface ProbeReview {
  readonly sourceReport: { readonly byteLength: number; readonly sha256: string };
  readonly contactSheet: { readonly byteLength: number; readonly sha256: string };
  readonly executionSummary: {
    readonly actualWorkerCount: number;
    readonly completed: number;
    readonly failed: number;
    readonly maximumWebBytes: number;
    readonly webPayloadLimitBytes: number;
  };
  readonly counts: {
    readonly advanceCandidate: number;
    readonly retuneCandidate: number;
    readonly failedProbe: number;
    readonly formalCatalogSlotsFilled: number;
  };
  readonly reviews: readonly { readonly typeId: string; readonly status: string }[];
}

describe("named-crystal baseline probe review", () => {
  const review = JSON.parse(readFileSync(REVIEW_PATH, "utf8")) as ProbeReview;
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as {
    readonly jobs: readonly { readonly typeId: string }[];
  };

  it("pins the local executed report and corrected three-view contact sheet", () => {
    expect(review.sourceReport.byteLength).toBeGreaterThan(0);
    expect(review.sourceReport.sha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(review.contactSheet.byteLength).toBeGreaterThan(0);
    expect(review.contactSheet.sha256).toMatch(/^[0-9a-f]{64}$/u);
  });

  it("records a complete, internally consistent 24-type screening", () => {
    expect(review.reviews).toHaveLength(24);
    expect(new Set(review.reviews.map(({ typeId }) => typeId)).size).toBe(24);
    expect(review.reviews.map(({ typeId }) => typeId).sort()).toEqual(
      manifest.jobs.map(({ typeId }) => typeId).sort(),
    );
    expect(review.counts).toEqual({
      advanceCandidate: 10,
      retuneCandidate: 5,
      failedProbe: 9,
      formalCatalogSlotsFilled: 0,
    });
    expect(
      review.reviews.filter(({ status }) => status === "advance-candidate"),
    ).toHaveLength(review.counts.advanceCandidate);
    expect(
      review.reviews.filter(({ status }) => status === "retune-candidate"),
    ).toHaveLength(review.counts.retuneCandidate);
    expect(review.reviews.filter(({ status }) => status === "failed-probe")).toHaveLength(
      review.counts.failedProbe,
    );
  });

  it("records all 24 completed workers and enforces the strict web ceiling", () => {
    expect(review.executionSummary).toMatchObject({
      actualWorkerCount: 24,
      completed: 24,
      failed: 0,
      webPayloadLimitBytes: 20_000_000,
    });
    expect(review.executionSummary.maximumWebBytes).toBeLessThan(
      review.executionSummary.webPayloadLimitBytes,
    );
  });
});
