import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  type RepairJobWire,
  materializeFleetCCadenceRepairJobs,
} from "../../scripts/named-crystal-final-resolution-c-cadence-repair.ts";
import { loadFinalResolutionPlanC } from "../../scripts/named-crystal-final-resolution-production-c.ts";

const REPO = resolve(import.meta.dirname, "../..");
const MANIFEST = join(
  REPO,
  "docs",
  "named-snow-crystal-final-resolution-c-cadence-repair.json",
);

const repairJobs = (): readonly RepairJobWire[] => {
  const wire = JSON.parse(readFileSync(MANIFEST, "utf8")) as { readonly jobs: readonly RepairJobWire[] };
  return wire.jobs;
};

describe("named crystal final-resolution Fleet C cadence repair", () => {
  it("changes only sampling cadence for the three registered failures", () => {
    const sourcePlan = loadFinalResolutionPlanC();
    const repaired = materializeFleetCCadenceRepairJobs(sourcePlan, repairJobs());
    expect(repaired.map(({ jobId, framesEvery }) => ({ jobId, framesEvery }))).toEqual([
      { jobId: "columns-on-plates-upper", framesEvery: 86 },
      { jobId: "double-plates-baseline", framesEvery: 282 },
      { jobId: "double-plates-upper", framesEvery: 260 },
    ]);
    for (const job of repaired) {
      const source = sourcePlan.production.jobs.find(({ jobId }) => jobId === job.jobId)!;
      const sourceWithoutCadence = { ...source, framesEvery: 0 };
      const repairedWithoutCadence = { ...job, framesEvery: 0 };
      expect(repairedWithoutCadence).toEqual(sourceWithoutCadence);
    }
  });

  it("pins three under-floor first timelines and exact 121-frame repairs", () => {
    expect(repairJobs().map((job) => ({
      jobId: job.jobId,
      finalTick: job.finalTick,
      first: [job.firstFramesEvery, job.firstFrameCount],
      repair: [job.repairFramesEvery, job.expectedRepairFrameCount],
      invariants: Object.keys(job.invariantFiles).sort(),
    }))).toEqual([
      {
        jobId: "columns-on-plates-upper",
        finalTick: 10251,
        first: [119, 88],
        repair: [86, 121],
        invariants: ["growth-v1.bin", "mesh.bin", "record.json", "state.bin"],
      },
      {
        jobId: "double-plates-baseline",
        finalTick: 33737,
        first: [359, 95],
        repair: [282, 121],
        invariants: ["growth-v1.bin", "mesh.bin", "record.json", "state.bin"],
      },
      {
        jobId: "double-plates-upper",
        finalTick: 31081,
        first: [359, 88],
        repair: [260, 121],
        invariants: ["growth-v1.bin", "mesh.bin", "record.json", "state.bin"],
      },
    ]);
  });

  it("refuses a widened or duplicate repair set", () => {
    const sourcePlan = loadFinalResolutionPlanC();
    const jobs = repairJobs();
    expect(() => materializeFleetCCadenceRepairJobs(sourcePlan, jobs.slice(0, 2))).toThrow(
      /exactly three unique/,
    );
    expect(() => materializeFleetCCadenceRepairJobs(sourcePlan, [jobs[0]!, jobs[0]!, jobs[1]!]))
      .toThrow(/exactly three unique/);
  });
});
