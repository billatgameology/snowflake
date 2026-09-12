import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadFinalResolutionPlan,
  verifyFinalResolutionVerticalClearance,
} from "../../scripts/named-crystal-final-resolution-production.ts";
import { loadDirectProductionPlan } from "../../scripts/named-crystal-direct-production.ts";

const REPO = resolve(import.meta.dirname, "../..");
const SCRIPT = join(REPO, "scripts", "named-crystal-final-resolution-production.ts");
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

const familyContract = (fleet: "a" | "b"): Map<string, { dims: string; cap: number | number[] }> =>
  fleet === "a"
    ? new Map([
      ["simple-prisms", { dims: "500,500,256", cap: 1706 }],
      ["hexagonal-plates", { dims: "500,500,96", cap: 30000 }],
      ["hollow-columns", { dims: "128,128,768", cap: 25000 }],
      ["stellar-plates", { dims: "500,500,96", cap: 30000 }],
      ["capped-columns", { dims: "320,320,512", cap: 48350 }],
      ["sectored-plates", { dims: "600,600,96", cap: 67200 }],
      ["simple-needles", { dims: "128,128,768", cap: 25075 }],
      ["fernlike-stellar-dendrites", { dims: "800,800,96", cap: 28512 }],
    ])
    : new Map([
      ["solid-columns", { dims: "192,192,576", cap: 6000 }],
      ["sheaths", { dims: "128,128,768", cap: 6000 }],
      ["split-plates-and-stars", { dims: "600,600,96", cap: 6000 }],
      ["isolated-bullets", { dims: "192,192,576", cap: 5000 }],
      ["scrolls-on-plates", { dims: "500,500,192", cap: [100, 300, 400] }],
      ["triangular-forms", { dims: "500,500,96", cap: [200, 400, 600] }],
      ["cups", { dims: "256,256,512", cap: [100, 200, 400] }],
      ["hollow-plates", { dims: "500,500,96", cap: 1500 }],
    ]);

describe("named crystal final-resolution production", () => {
  it.each(["a", "b"] as const)("materializes Fleet %s as 24 jobs on 24 workers", (fleet) => {
    const plan = loadFinalResolutionPlan(fleet);
    expect(plan.production.jobs).toHaveLength(24);
    expect(new Set(plan.production.jobs.map(({ jobId }) => jobId))).toHaveLength(24);
    expect(new Set(plan.production.jobs.map(({ typeId }) => typeId))).toHaveLength(8);
    expect(plan.production.execution).toMatchObject({
      processConcurrency: 24,
      physicalCores: 24,
      logicalProcessors: 24,
    });
    expect(plan.production.webPayloadLimitBytes).toBe(20_000_000);
    expect(plan.production.scientificFrameTarget).toBe(120);
  });

  it.each(["a", "b"] as const)("binds Fleet %s dimensions and stop caps", (fleet) => {
    const plan = loadFinalResolutionPlan(fleet);
    for (const [typeId, expected] of familyContract(fleet)) {
      const jobs = plan.production.jobs.filter((job) => job.typeId === typeId);
      expect(new Set(jobs.map(({ dims }) => dims.join(",")))).toEqual(new Set([expected.dims]));
      const caps = jobs.map(({ tickCap }) => tickCap).sort((left, right) => left - right);
      expect(caps).toEqual(Array.isArray(expected.cap) ? expected.cap : [expected.cap, expected.cap, expected.cap]);
      expect(jobs.map(({ slot }) => slot).sort()).toEqual(["baseline", "lower", "upper"]);
    }
  });

  it("binds Fleet A to exact strong native-scale sources and one schedule-wide driver", () => {
    const jobs = loadFinalResolutionPlan("a").production.jobs;
    expect(jobs.find(({ jobId }) => jobId === "hollow-columns-baseline")).toMatchObject({
      sourceJobId: "fig30",
      sourceSpecSha256: "5aebc31dd63041206025551872299dca3908c3ed92410fb1bdd9594b4b0f9622",
      driverName: "rho-scale",
      driverValue: 1,
    });
    expect(jobs.find(({ jobId }) => jobId === "fernlike-stellar-dendrites-baseline")).toMatchObject({
      sourceJobId: "fig13",
      sourceSpecSha256: "16ddbfcfee13c95d8968e29bd13d3bc054c97aa065c91e6da210bba76f2fff83",
      dims: [800, 800, 96],
    });
    for (const typeId of new Set(jobs.map(({ typeId }) => typeId))) {
      expect(jobs.filter((job) => job.typeId === typeId).map(({ driverValue }) => driverValue))
        .toEqual([0.95, 1, 1.05]);
    }
  });

  it("changes only Fleet B domains while preserving all reviewed recipes and stops", () => {
    const finalJobs = loadFinalResolutionPlan("b").production.jobs;
    const sourceJobs = loadDirectProductionPlan().jobs;
    for (const final of finalJobs) {
      const source = sourceJobs.find(({ jobId }) => jobId === final.jobId)!;
      expect(final.spec).toEqual(source.spec);
      expect(final.specSha256).toBe(source.specSha256);
      expect(final.tickCap).toBe(source.tickCap);
      expect(final.driverName).toBe(source.driverName);
      expect(final.driverValue).toBe(source.driverValue);
      expect(final.dims).not.toEqual(source.dims);
    }
  });

  it("enforces both fractional and absolute Z clearance against bound records", () => {
    const root = mkdtempSync(join(tmpdir(), "named-final-clearance-"));
    roots.push(root);
    const plan = loadFinalResolutionPlan("a", undefined, root);
    const vertical = plan.production.jobs.filter(({ typeId }) =>
      plan.verticalClearance.typeIds.includes(typeId)
    );
    for (const job of vertical) {
      const directory = join(root, job.jobId);
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(directory, "record.json"), JSON.stringify({
        dims: { nx: job.dims[0], ny: job.dims[1], nz: job.dims[2] },
        mesh: { bboxCartesian: { zMin: job.dims[2] * 0.1, zMax: job.dims[2] * 0.9 } },
      }));
    }
    expect(verifyFinalResolutionVerticalClearance(plan).requiredResults).toBe(9);

    const failed = vertical[0]!;
    writeFileSync(join(root, failed.jobId, "record.json"), JSON.stringify({
      dims: { nx: failed.dims[0], ny: failed.dims[1], nz: failed.dims[2] },
      mesh: { bboxCartesian: { zMin: 15, zMax: failed.dims[2] - 15 } },
    }));
    expect(() => verifyFinalResolutionVerticalClearance(plan)).toThrow(/vertical clearance/);
  });

  it.each(["a", "b"] as const)("plans Fleet %s without creating a fresh output root", (fleet) => {
    const root = mkdtempSync(join(tmpdir(), `named-final-${fleet}-`));
    roots.push(root);
    const outRoot = join(root, "fresh-output");
    const output = execFileSync(
      process.execPath,
      [SCRIPT, "plan", "--fleet", fleet, "--out-root", outRoot],
      { cwd: REPO, encoding: "utf8" },
    );
    expect(output).toContain('"jobs":24');
    expect(output).toContain(`"fleet":"${fleet}"`);
    expect(output).toContain('"finalResolution":true');
    expect(existsSync(outRoot)).toBe(false);
  });
});
