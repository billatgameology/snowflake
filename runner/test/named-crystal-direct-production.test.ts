import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  buildProductionArgv,
  loadDirectProductionPlan,
} from "../../scripts/named-crystal-direct-production.ts";

const REPO = resolve(import.meta.dirname, "../..");
const SCRIPT = join(REPO, "scripts", "named-crystal-direct-production.ts");
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("named crystal direct production", () => {
  it("materializes eight reviewed three-variant families into 24 unique jobs", () => {
    const plan = loadDirectProductionPlan();
    expect(plan.jobs).toHaveLength(24);
    expect(new Set(plan.jobs.map(({ jobId }) => jobId))).toHaveLength(24);
    expect(new Set(plan.jobs.map(({ typeId }) => typeId))).toHaveLength(8);
    for (const typeId of new Set(plan.jobs.map(({ typeId }) => typeId))) {
      expect(plan.jobs.filter((job) => job.typeId === typeId).map(({ slot }) => slot).sort())
        .toEqual(["baseline", "lower", "upper"]);
    }
    expect(plan.execution.processConcurrency).toBe(24);
    expect(plan.webPayloadLimitBytes).toBe(20_000_000);
  });

  it("keeps the four rho families fixed except for label and the registered five-percent driver", () => {
    const plan = loadDirectProductionPlan();
    const rhoTypes = ["solid-columns", "sheaths", "split-plates-and-stars", "isolated-bullets"];
    for (const typeId of rhoTypes) {
      const jobs = plan.jobs.filter((job) => job.typeId === typeId);
      expect(jobs.map(({ driverValue }) => driverValue)).toEqual([0.95, 1, 1.05]);
      expect(jobs.map(({ spec }) => spec.rho)).toEqual([0.095, 0.1, 0.105]);
      const fixed = jobs.map(({ spec }) => {
        const copy = structuredClone(spec);
        delete copy.label;
        delete copy.rho;
        return copy;
      });
      expect(fixed[1]).toEqual(fixed[0]);
      expect(fixed[2]).toEqual(fixed[0]);
      expect(new Set(jobs.map(({ dims }) => dims.join(",")))).toHaveLength(1);
      expect(new Set(jobs.map(({ tickCap }) => tickCap))).toHaveLength(1);
    }
  });

  it("binds exact reviewed early-stop and hollow-plate sources with production frame cadence", () => {
    const plan = loadDirectProductionPlan();
    const scrolls = plan.jobs.filter(({ typeId }) => typeId === "scrolls-on-plates");
    expect(scrolls.map(({ driverValue }) => driverValue)).toEqual([100, 300, 400]);
    expect(scrolls.map(({ framesEvery }) => framesEvery)).toEqual([1, 3, 4]);
    expect(scrolls.map(({ specSha256 }) => specSha256)).toEqual([
      "8645ea739f4129698a7af8573762055351fd7bc1f534e083dec062e24c477ed6",
      "0696b2b9818652cde6d69ae6c2d1ff87b93b7df81ece8fede92c9b99283edce4",
      "83d0f73fde64e10cdfa978004c17ed59a943c83149577527c06a67538f361f0c",
    ]);
    const hollow = plan.jobs.filter(({ typeId }) => typeId === "hollow-plates");
    expect(hollow.map(({ driverValue }) => driverValue)).toEqual([1, 2, 4]);
    expect(hollow.map(({ sourceSpecSha256 }) => sourceSpecSha256)).toEqual([
      "cc9251f2a3e88d5072579ea10fc9a8935a287d18f53ed78541cd7269f2ab0e45",
      "90802cec507f034ce2656610bc6c754a52f3fae72a3aade73a791ea948ad83dc",
      "e5345e7ed286304eb0d23e830fb7ab65d0f3df0a4d8683ee15ac0525207eba8a",
    ]);
    expect(hollow.every(({ framesEvery }) => framesEvery === 13)).toBe(true);
  });

  it("builds one replay that contains both full scientific and compact web products", () => {
    const plan = loadDirectProductionPlan();
    const job = plan.jobs.find(({ jobId }) => jobId === "cups-baseline")!;
    const argv = buildProductionArgv(plan, job).join(" ");
    expect(argv).toContain("--out-state");
    expect(argv).toContain("--frames-dir");
    expect(argv).toContain("--frames-every 2");
    expect(argv).toContain("--growth-out");
    expect(argv).toContain("--out-mesh");
    expect(argv).toContain("--record");
  });

  it("plans read-only against a fresh output root", () => {
    const root = mkdtempSync(join(tmpdir(), "named-direct-production-"));
    roots.push(root);
    const outRoot = join(root, "fresh-output");
    const output = execFileSync(
      process.execPath,
      [SCRIPT, "plan", "--out-root", outRoot],
      { cwd: REPO, encoding: "utf8" },
    );
    expect(output).toContain("pending solid-columns-lower");
    expect(output).toContain('"jobs":24');
    expect(output).toContain('"processConcurrency":24');
    expect(existsSync(outRoot)).toBe(false);
  });
});
