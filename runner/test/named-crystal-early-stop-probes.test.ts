import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadEarlyStopPlan } from "../../scripts/named-crystal-early-stop-probes.ts";

const REPO = resolve(import.meta.dirname, "../..");
const MANIFEST = resolve(REPO, "docs/named-snow-crystal-early-stop-probes.json");
const REVIEW = resolve(REPO, "docs/named-snow-crystal-early-stop-probe-review.json");
const EXPECTED_TYPES = ["cups", "scrolls-on-plates", "triangular-forms"];
const EXPECTED_TICKS = [100, 200, 300, 400, 600, 800, 1000, 1200];

const withoutLabel = (spec: Record<string, unknown>): Record<string, unknown> => {
  const copy = JSON.parse(JSON.stringify(spec)) as Record<string, unknown>;
  delete copy.label;
  return copy;
};

describe("named-crystal early-stop probe tranche", () => {
  it("registers eight stop ticks for each of three review-selected families", () => {
    const plan = loadEarlyStopPlan(MANIFEST, resolve(REPO, "out/test-early-stop-probes"), REPO);
    expect(plan.jobs).toHaveLength(24);
    expect(new Set(plan.jobs.map(({ jobId }) => jobId)).size).toBe(24);
    expect([...new Set(plan.jobs.map(({ typeId }) => typeId))].sort()).toEqual(EXPECTED_TYPES);
    expect(plan.execution).toMatchObject({
      processConcurrency: 24,
      physicalCores: 24,
      logicalProcessors: 24,
      hostProcessor: "Intel Core Ultra 9 285K",
    });
    expect(plan.webPayloadLimitBytes).toBe(20_000_000);
    for (const typeId of EXPECTED_TYPES) {
      const family = plan.jobs.filter((job) => job.typeId === typeId);
      expect(family, typeId).toHaveLength(8);
      expect(family.map(({ stopTick }) => stopTick).sort((left, right) => left - right)).toEqual(
        EXPECTED_TICKS,
      );
    }
  });

  it("holds each source seed and growth recipe fixed while changing only stop time", () => {
    const plan = loadEarlyStopPlan(MANIFEST, resolve(REPO, "out/test-early-stop-probes"), REPO);
    for (const typeId of EXPECTED_TYPES) {
      const family = plan.jobs.filter((job) => job.typeId === typeId);
      expect(new Set(family.map(({ sourceSpecSha256 }) => sourceSpecSha256)).size, typeId).toBe(1);
      expect(new Set(family.map(({ sourceDriverValue }) => sourceDriverValue)).size, typeId).toBe(1);
      expect(new Set(family.map(({ initialSeedSiteCount }) => initialSeedSiteCount)).size, typeId).toBe(1);
      expect(new Set(family.map(({ dims }) => dims.join(","))).size, typeId).toBe(1);
      expect(family[0]!.initialSeedSiteCount, typeId).toBeGreaterThan(0);
      for (const job of family.slice(1)) {
        expect(withoutLabel(job.spec), job.jobId).toEqual(withoutLabel(family[0]!.spec));
      }
    }
  });

  it("selects three meaningfully grown production candidates per family without filling slots", () => {
    const review = JSON.parse(readFileSync(REVIEW, "utf8")) as {
      readonly sourceReport: { readonly sha256: string };
      readonly contactSheet: { readonly sha256: string };
      readonly executionSummary: {
        readonly actualWorkerCount: number;
        readonly completed: number;
        readonly failed: number;
        readonly maximumWebBytes: number;
        readonly webPayloadLimitBytes: number;
      };
      readonly counts: Record<string, number>;
      readonly families: readonly {
        readonly typeId: string;
        readonly selected: readonly {
          readonly jobId: string;
          readonly newAttachedSites: number;
          readonly webBytes: number;
          readonly specSha256: string;
        }[];
      }[];
    };
    expect(review.families.map(({ typeId }) => typeId).sort()).toEqual(EXPECTED_TYPES);
    expect(review.sourceReport.sha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(review.contactSheet.sha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(review.executionSummary).toMatchObject({
      actualWorkerCount: 24,
      completed: 24,
      failed: 0,
      webPayloadLimitBytes: 20_000_000,
    });
    expect(review.executionSummary.maximumWebBytes).toBeLessThan(
      review.executionSummary.webPayloadLimitBytes,
    );
    expect(review.counts).toEqual({
      advanceCandidateFamilies: 3,
      selectedProductionCandidates: 9,
      formalCatalogSlotsFilled: 0,
    });
    for (const family of review.families) {
      expect(family.selected, family.typeId).toHaveLength(3);
      for (const candidate of family.selected) {
        expect(candidate.newAttachedSites, candidate.jobId).toBeGreaterThan(0);
        expect(candidate.webBytes, candidate.jobId).toBeLessThan(20_000_000);
        expect(candidate.specSha256, candidate.jobId).toMatch(/^[0-9a-f]{64}$/u);
      }
    }
  });
});
