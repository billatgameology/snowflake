import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadDirectProductionPlan2,
  scaleSpecRho,
} from "../../scripts/named-crystal-direct-production-2.ts";
import { buildProductionArgv } from "../../scripts/named-crystal-direct-production.ts";

const REPO = resolve(import.meta.dirname, "../..");
const SCRIPT = join(REPO, "scripts", "named-crystal-direct-production-2.ts");
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("named crystal direct production tranche two", () => {
  it("materializes eight source-bound families into 24 full-core jobs", () => {
    const plan = loadDirectProductionPlan2();
    expect(plan.jobs).toHaveLength(24);
    expect(new Set(plan.jobs.map(({ jobId }) => jobId))).toHaveLength(24);
    expect(new Set(plan.jobs.map(({ typeId }) => typeId))).toHaveLength(8);
    for (const typeId of new Set(plan.jobs.map(({ typeId }) => typeId))) {
      expect(plan.jobs.filter((job) => job.typeId === typeId).map(({ slot }) => slot).sort())
        .toEqual(["baseline", "lower", "upper"]);
    }
    expect(plan.execution).toMatchObject({
      processConcurrency: 24,
      physicalCores: 24,
      logicalProcessors: 24,
    });
    expect(plan.webPayloadLimitBytes).toBe(20_000_000);
  });

  it("binds the registered dimensions, caps, and current-audit anchors", () => {
    const plan = loadDirectProductionPlan2();
    const expected = new Map<string, { dims: string; cap: number }>([
      ["simple-prisms", { dims: "400,400,160", cap: 1706 }],
      ["hexagonal-plates", { dims: "192,192,64", cap: 6000 }],
      ["hollow-columns", { dims: "96,96,192", cap: 6000 }],
      ["stellar-plates", { dims: "256,256,80", cap: 6000 }],
      ["capped-columns", { dims: "144,144,192", cap: 6000 }],
      ["sectored-plates", { dims: "192,192,64", cap: 6000 }],
      ["simple-needles", { dims: "96,96,192", cap: 6000 }],
      ["fernlike-stellar-dendrites", { dims: "256,256,80", cap: 6000 }],
    ]);
    for (const [typeId, contract] of expected) {
      const jobs = plan.jobs.filter((job) => job.typeId === typeId);
      expect(new Set(jobs.map(({ dims }) => dims.join(",")))).toEqual(new Set([contract.dims]));
      expect(new Set(jobs.map(({ tickCap }) => tickCap))).toEqual(new Set([contract.cap]));
      expect(jobs.every(({ framesEvery }) => framesEvery === Math.ceil(contract.cap / 120))).toBe(true);
    }
    expect(plan.jobs.find(({ jobId }) => jobId === "simple-prisms-baseline")).toMatchObject({
      sourceJobId: "fig11",
      sourceSpecSha256: "2b0190f5256c11d7a964ab5016734826548de905d3e941a0eb52da58cf88e033",
    });
    expect(plan.jobs.find(({ jobId }) => jobId === "hexagonal-plates-baseline")).toMatchObject({
      sourceJobId: "sweep-t2p5-r0p08",
      sourceSpecSha256: "0535b0f3bd75767c06b7bb0e2e9bb2d0c2599cf182a413e1c3e297b2c812c28b",
    });
  });

  it("scales only static rho and its label", () => {
    const source = {
      label: "static",
      rho: 0.4,
      phi: 0.01,
      ggThreshTable: { "01": 2.5 },
      kappa: { default: 0.1, overrides: {} },
    };
    const scaled = scaleSpecRho(source, 1.05, "Static");
    expect(scaled.rho).toBe(0.42);
    expect(scaled.label).toContain("rho scale 1.05");
    const fixed = structuredClone(scaled);
    delete fixed.rho;
    delete fixed.label;
    const expected = structuredClone(source) as Record<string, unknown>;
    delete expected.rho;
    delete expected.label;
    expect(fixed).toEqual(expected);
    expect(source.rho).toBe(0.4);
  });

  it("scales every staged rho while retaining transitions and all other fields", () => {
    const source = {
      label: "staged",
      stages: [
        { rho: 0.08, phi: 0.001, ggThreshTable: { "01": 2.5 } },
        { rho: 0.12, phi: 0.002, ggThreshTable: { "01": 2.2 } },
      ],
      transitions: [{ tick: 2500, stage: 1 }],
    };
    const scaled = scaleSpecRho(source, 0.95, "Staged");
    expect((scaled.stages as { rho: number }[]).map(({ rho }) => rho)).toEqual([0.076, 0.114]);
    expect(scaled.transitions).toEqual(source.transitions);
    const fixed = structuredClone(scaled);
    delete fixed.label;
    for (const stage of fixed.stages as Record<string, unknown>[]) delete stage.rho;
    const expected = structuredClone(source) as Record<string, unknown>;
    delete expected.label;
    for (const stage of expected.stages as Record<string, unknown>[]) delete stage.rho;
    expect(fixed).toEqual(expected);
    expect(source.stages.map(({ rho }) => rho)).toEqual([0.08, 0.12]);
  });

  it("builds scientific and web products from the same replay", () => {
    const plan = loadDirectProductionPlan2();
    const job = plan.jobs.find(({ jobId }) => jobId === "hollow-columns-baseline")!;
    const argv = buildProductionArgv(plan, job).join(" ");
    expect(argv).toContain("--out-state");
    expect(argv).toContain("--frames-dir");
    expect(argv).toContain("--frames-every 50");
    expect(argv).toContain("--growth-out");
    expect(argv).toContain("--out-mesh");
    expect(argv).toContain("--record");
  });

  it("plans read-only against a fresh output root", () => {
    const root = mkdtempSync(join(tmpdir(), "named-direct-production-2-"));
    roots.push(root);
    const outRoot = join(root, "fresh-output");
    const output = execFileSync(process.execPath, [SCRIPT, "plan", "--out-root", outRoot], {
      cwd: REPO,
      encoding: "utf8",
    });
    expect(output).toContain("pending simple-prisms-lower");
    expect(output).toContain('"jobs":24');
    expect(output).toContain('"processConcurrency":24');
    expect(existsSync(outRoot)).toBe(false);
  });
});
