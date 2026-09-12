import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadFinalResolutionPlanC,
  verifyFinalResolutionVerticalClearanceC,
} from "../../scripts/named-crystal-final-resolution-production-c.ts";

const REPO = resolve(import.meta.dirname, "../..");
const SCRIPT = join(REPO, "scripts", "named-crystal-final-resolution-production-c.ts");
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("named crystal final-resolution Fleet C", () => {
  it("materializes 15 exact-source variants plus nine capped-bullet stops", () => {
    const plan = loadFinalResolutionPlanC();
    expect(plan.production.jobs).toHaveLength(24);
    expect(new Set(plan.production.jobs.map(({ jobId }) => jobId))).toHaveLength(24);
    expect(new Set(plan.production.jobs.map(({ typeId }) => typeId))).toHaveLength(6);
    expect(plan.production.jobs.filter(({ typeId }) => typeId !== "capped-bullets")).toHaveLength(15);
    expect(plan.production.jobs.filter(({ typeId }) => typeId === "capped-bullets")).toHaveLength(9);
    expect(plan.production.execution.processConcurrency).toBe(24);
    expect(plan.production.webPayloadLimitBytes).toBe(20_000_000);
  });

  it("binds the five native-scale source contracts", () => {
    const jobs = loadFinalResolutionPlanC().production.jobs;
    const expected = new Map([
      ["columns-on-plates", { source: "fig39", dims: "600,600,192", cap: 14269 }],
      ["skeletal-forms", { source: "fig19", dims: "800,800,96", cap: 60000 }],
      ["simple-stars", { source: "fig16", dims: "800,800,96", cap: 38501 }],
      ["stellar-dendrites", { source: "fig15", dims: "800,800,96", cap: 34502 }],
      ["double-plates", { source: "fig6", dims: "600,600,96", cap: 42981 }],
    ]);
    for (const [typeId, contract] of expected) {
      const family = jobs.filter((job) => job.typeId === typeId);
      expect(family.map(({ driverValue }) => driverValue)).toEqual([0.95, 1, 1.05]);
      expect(new Set(family.map(({ sourceJobId }) => sourceJobId))).toEqual(new Set([contract.source]));
      expect(new Set(family.map(({ dims }) => dims.join(",")))).toEqual(new Set([contract.dims]));
      expect(new Set(family.map(({ tickCap }) => tickCap))).toEqual(new Set([contract.cap]));
    }
  });

  it("keeps one capped-bullet seed/schedule while varying only post-transition stop", () => {
    const family = loadFinalResolutionPlanC().production.jobs.filter(({ typeId }) => typeId === "capped-bullets");
    expect(family.map(({ driverValue }) => driverValue)).toEqual([
      2750, 3000, 3250, 3500, 3750, 4000, 4500, 5000, 5500,
    ]);
    expect(family.map(({ tickCap }) => tickCap)).toEqual(family.map(({ driverValue }) => driverValue));
    expect(new Set(family.map(({ dims }) => dims.join(",")))).toEqual(new Set(["320,320,512"]));
    expect(new Set(family.map(({ sourceSpecSha256 }) => sourceSpecSha256))).toEqual(new Set([
      "e4b67acf9bdf4e4cead663681ad16d3a579f1b5fa65b69a6fc2c3355eb6da048",
    ]));
    const fixed = family.map(({ spec }) => {
      const copy = structuredClone(spec);
      delete copy.label;
      return copy;
    });
    for (const spec of fixed.slice(1)) expect(spec).toEqual(fixed[0]);
    expect((fixed[0]!.stages as { untilTick: number | null }[])[0]!.untilTick).toBe(2500);
  });

  it("enforces vertical clearance for the hybrid and every capped-bullet candidate", () => {
    const root = mkdtempSync(join(tmpdir(), "named-final-c-clearance-"));
    roots.push(root);
    const plan = loadFinalResolutionPlanC(undefined, root);
    const vertical = plan.production.jobs.filter(({ typeId }) =>
      plan.verticalClearance.typeIds.includes(typeId)
    );
    expect(vertical).toHaveLength(12);
    for (const job of vertical) {
      const directory = join(root, job.jobId);
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(directory, "record.json"), JSON.stringify({
        dims: { nx: job.dims[0], ny: job.dims[1], nz: job.dims[2] },
        mesh: { bboxCartesian: { zMin: job.dims[2] * 0.1, zMax: job.dims[2] * 0.9 } },
      }));
    }
    expect(verifyFinalResolutionVerticalClearanceC(plan).requiredResults).toBe(12);
    const failed = vertical.at(-1)!;
    writeFileSync(join(root, failed.jobId, "record.json"), JSON.stringify({
      dims: { nx: failed.dims[0], ny: failed.dims[1], nz: failed.dims[2] },
      mesh: { bboxCartesian: { zMin: 15, zMax: failed.dims[2] - 15 } },
    }));
    expect(() => verifyFinalResolutionVerticalClearanceC(plan)).toThrow(/vertical clearance/);
  });

  it("plans without creating a fresh output root", () => {
    const root = mkdtempSync(join(tmpdir(), "named-final-c-"));
    roots.push(root);
    const outRoot = join(root, "fresh-output");
    const output = execFileSync(process.execPath, [SCRIPT, "plan", "--out-root", outRoot], {
      cwd: REPO,
      encoding: "utf8",
    });
    expect(output).toContain('"jobs":24');
    expect(output).toContain('"fleet":"c"');
    expect(output).toContain('"cappedBulletSearchJobs":9');
    expect(existsSync(outRoot)).toBe(false);
  });
});
