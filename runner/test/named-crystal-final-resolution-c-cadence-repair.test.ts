import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  type RepairJobWire,
  assertFleetCRepairGrowthEquivalent,
  assertFleetCRepairRecordsEquivalent,
  materializeFleetCCadenceRepairJobs,
  requireFleetCRepairFileIdentity,
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

  it("allows only registered record provenance fields to differ", () => {
    const first = {
      tick: 10,
      attachedCount: 20,
      mesh: { path: "old/mesh.bin", vertexCount: 40 },
      growth: { path: "old/growth.bin", bytes: 100, eventCount: 20 },
      elapsedSeconds: 999,
    };
    const repaired = {
      ...first,
      mesh: { ...first.mesh, path: "repair/mesh.bin" },
      growth: { ...first.growth, path: "repair/growth.bin", bytes: 110 },
      elapsedSeconds: 123,
    };
    expect(() => assertFleetCRepairRecordsEquivalent(first, repaired, "fixture")).not.toThrow();
    expect(() => assertFleetCRepairRecordsEquivalent(
      first,
      { ...repaired, attachedCount: 21 },
      "fixture",
    )).toThrow(/record changed/);
  });

  it("refuses changed solver bytes or decoded attachment events", () => {
    const root = mkdtempSync(join(tmpdir(), "fleet-c-repair-equivalence-"));
    try {
      const path = join(root, "state.bin");
      writeFileSync(path, Buffer.from([1, 2, 3]));
      expect(() => requireFleetCRepairFileIdentity(path, {
        byteLength: 3,
        sha256: "039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81",
      }, "fixture state")).not.toThrow();
      writeFileSync(path, Buffer.from([1, 2, 4]));
      expect(() => requireFleetCRepairFileIdentity(path, {
        byteLength: 3,
        sha256: "039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81",
      }, "fixture state")).toThrow(/identity drift/);

      const growth = {
        eventCount: 2,
        seedCount: 1,
        finalTick: 10,
        dims: [4, 4, 4] as const,
        center: [2, 2, 2] as const,
        flatIndices: new Uint32Array([1, 5]),
        attachTicks: new Uint32Array([0, 10]),
      };
      expect(() => assertFleetCRepairGrowthEquivalent(growth, {
        ...growth,
        flatIndices: new Uint32Array([1, 6]),
      }, "fixture")).toThrow(/decoded growth events changed/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
