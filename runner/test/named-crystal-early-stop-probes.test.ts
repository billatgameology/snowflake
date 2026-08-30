import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadEarlyStopPlan } from "../../scripts/named-crystal-early-stop-probes.ts";

const REPO = resolve(import.meta.dirname, "../..");
const MANIFEST = resolve(REPO, "docs/named-snow-crystal-early-stop-probes.json");
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
});
