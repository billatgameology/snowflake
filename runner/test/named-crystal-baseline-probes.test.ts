import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { GG_PRESETS } from "@vcc/core";
import { GGPlusSolver, GGSolver } from "@vcc/solver-cpu";
import {
  loadProbePlan,
  seedGeometryForProfile,
} from "../../scripts/named-crystal-baseline-probes.ts";

const REPO = resolve(import.meta.dirname, "../..");
const MANIFEST = resolve(REPO, "docs/named-snow-crystal-baseline-probes.json");

describe("named-crystal baseline probe tranche", () => {
  it("covers every direct-growth catalog row once under the registered 24-process host plan", () => {
    const plan = loadProbePlan(MANIFEST, resolve(REPO, "out/test-baseline-probes"), REPO);
    expect(plan.jobs).toHaveLength(24);
    expect(new Set(plan.jobs.map((job) => job.typeId)).size).toBe(24);
    expect(plan.jobs.filter((job) => job.route === "gg-plus")).toHaveLength(13);
    expect(plan.jobs.filter((job) => job.route === "gg")).toHaveLength(11);
    expect(plan.execution).toMatchObject({
      processConcurrency: 24,
      physicalCores: 24,
      logicalProcessors: 24,
      hostProcessor: "Intel Core Ultra 9 285K",
    });
    expect(plan.webPayloadLimitBytes).toBe(20_000_000);
    for (const job of plan.jobs) {
      expect(job.specSha256).toMatch(/^[0-9a-f]{64}$/u);
      expect(job.reviewViews.length).toBeGreaterThan(0);
      expect(job.spec.label).toBe(`${job.typeName} — named catalog baseline probe`);
    }
  });

  it("materializes every custom profile as a fitting, connected GG+ seed", () => {
    const plan = loadProbePlan(MANIFEST, resolve(REPO, "out/test-baseline-probes"), REPO);
    for (const job of plan.jobs) {
      const geometry = seedGeometryForProfile(job.seedProfile);
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
      expect(solver.attachedCount, job.typeId).toBeGreaterThan(0);
      if (geometry !== undefined) {
        expect((job.spec.seedGeometry as Record<string, unknown>).version, job.typeId).toBe(1);
      }
    }
  });

  it("places every shortened schedule transition strictly inside its probe tick cap", () => {
    const plan = loadProbePlan(MANIFEST, resolve(REPO, "out/test-baseline-probes"), REPO);
    for (const job of plan.jobs.filter((candidate) => candidate.scheduleProfile !== "source")) {
      const stages = job.spec.stages as readonly Record<string, unknown>[];
      const transitions = stages.slice(0, -1).map((stage) => stage.untilTick as number);
      expect(stages.at(-1)?.untilTick, job.typeId).toBeNull();
      expect(transitions.length, job.typeId).toBeGreaterThan(0);
      expect(transitions, job.typeId).toEqual([...transitions].sort((left, right) => left - right));
      for (const tick of transitions) {
        expect(tick, job.typeId).toBeGreaterThan(0);
        expect(tick, job.typeId).toBeLessThan(job.tickCap);
      }
    }
  });
});
