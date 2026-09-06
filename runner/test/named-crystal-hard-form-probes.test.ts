import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { GG_PRESETS } from "@vcc/core";
import { GGPlusSolver, GGSolver } from "@vcc/solver-cpu";
import {
  loadHardFormPlan,
  seedGeometryForHardForm,
} from "../../scripts/named-crystal-hard-form-probes.ts";

const REPO = resolve(import.meta.dirname, "../..");
const MANIFEST = resolve(REPO, "docs/named-snow-crystal-hard-form-probes.json");
const REVIEW = resolve(REPO, "docs/named-snow-crystal-hard-form-probe-review.json");
const EXPECTED_TYPES = [
  "cups",
  "hollow-plates",
  "multiply-capped-columns",
  "needle-clusters",
  "scrolls-on-plates",
  "triangular-forms",
];

describe("named-crystal hard-form probe tranche", () => {
  it("registers four one-driver variants for each of six failed GG+ families", () => {
    const plan = loadHardFormPlan(MANIFEST, resolve(REPO, "out/test-hard-form-probes"), REPO);
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
      expect(family, typeId).toHaveLength(4);
      expect(new Set(family.map(({ driverValue }) => driverValue)).size, typeId).toBe(4);
      expect(new Set(family.map(({ driverName }) => driverName)).size, typeId).toBe(1);
      for (const job of family) expect(job.specSha256).toMatch(/^[0-9a-f]{64}$/u);
    }
  });

  it("materializes every custom seed as a fitting connected GG+ initial condition", () => {
    const plan = loadHardFormPlan(MANIFEST, resolve(REPO, "out/test-hard-form-probes"), REPO);
    for (const job of plan.jobs) {
      const geometry = seedGeometryForHardForm(job.seedProfile, job.driverValue);
      const dims = { nx: job.dims[0], ny: job.dims[1], nz: job.dims[2] };
      const solver = geometry === undefined
        ? new GGSolver({ dims, params: GG_PRESETS.plate, rngSeed: 1, domain: "hexPrism" })
        : new GGPlusSolver({
            dims,
            params: GG_PRESETS.plate,
            rngSeed: 1,
            domain: "hexPrism",
            seedGeometry: geometry,
          });
      expect(solver.attachedCount, job.jobId).toBeGreaterThan(0);
      if (geometry !== undefined) {
        expect((job.spec.seedGeometry as Record<string, unknown>).version, job.jobId).toBe(1);
      }
    }
  });

  it("builds six alternating stages and derives the multiply-capped stop from one interval", () => {
    const plan = loadHardFormPlan(MANIFEST, resolve(REPO, "out/test-hard-form-probes"), REPO);
    const jobs = plan.jobs.filter(({ typeId }) => typeId === "multiply-capped-columns");
    for (const job of jobs) {
      const stages = job.spec.stages as readonly Record<string, unknown>[];
      expect(stages).toHaveLength(6);
      expect(stages.map(({ untilTick }) => untilTick)).toEqual([
        job.driverValue,
        job.driverValue * 2,
        job.driverValue * 3,
        job.driverValue * 4,
        job.driverValue * 5,
        null,
      ]);
      expect(job.tickCap).toBe(job.driverValue * 6);
    }
  });

  it("records a complete post-run family review without filling catalog slots", () => {
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
      readonly families: readonly { readonly typeId: string; readonly status: string }[];
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
      advanceCandidateFamilies: 1,
      composeRequiredFamilies: 2,
      earlyStopRequiredFamilies: 3,
      formalCatalogSlotsFilled: 0,
    });
  });
});
