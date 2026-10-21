import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { firstBatchRosterSha256, planFirstBatchResume } from "../src/hil-bld-batch-main.ts";
import { launchDiscoveryRows } from "../src/hil-bld-batch-execution.ts";
import { namedBatchRows } from "../src/hil-bld-batch-roster.ts";
import { hilOperationalWorkers, type HilOperationalBatch } from "../src/hil-operational-batch-main.ts";
import { hilGrowthDynamicsOct21CampaignBinding, validateHilGrowthDynamicsOct21Campaign } from "../src/hil-growth-dynamics-oct21-main.ts";
import { HIL_GROWTH_DYNAMICS_OCT21 as batch, HIL_GROWTH_DYNAMICS_OCT21_ROWS as entries } from "../src/hil-growth-dynamics-oct21-roster.ts";
import { HIL_WARM_REFINEMENT_ROWS } from "../src/hil-warm-refinement-roster.ts";
import type { DiscoveryRow } from "../src/post-phase10-discovery.ts";

const temporary: string[] = [];
afterEach(() => { for (const directory of temporary.splice(0)) rmSync(directory, { recursive: true, force: true }); });
const cli = (...args: string[]) => spawnSync(process.execPath, ["runner/src/hil-growth-dynamics-oct21-main.ts", ...args],
  { encoding: "utf8", windowsHide: true });
const config: HilOperationalBatch = { batch, entryPath: "unused", concurrency: 20, workerCeiling: 20,
  campaignSchema: "test", label: "test", plan: "test", budgetBasis: "test" };

describe("HIL October21 long growth dynamics queue", () => {
  it("has exactly the registered ordered 24 rows and HIL-only twenty-slot ceiling", () => {
    const expected = [
      "w4-h1-broad", "w4-h1-early20-w6", "w4-h3-broad", "w4-h3-early20-w6",
      "c1-h1-neither", "c1-h1-basal-only", "c1-h1-prism-only", "c1-h1-both",
      "c1-h3-neither", "c1-h3-basal-only", "c1-h3-prism-only", "c1-h3-both",
      "h1-p50662p5-switch7", "h1-p50662p5-switch15", "h1-p50662p5-source", "h1-p50662p5-destination",
      "h1-p101325-switch7", "h1-p101325-switch15", "h1-p101325-source", "h1-p101325-destination",
      "h1-p202650-switch7", "h1-p202650-switch15", "h1-p202650-source", "h1-p202650-destination",
    ].map((suffix) => `gd21-hil-${suffix}`);
    expect(entries.map(({ row }) => row.id)).toEqual(expected);
    expect(new Set(expected).size).toBe(24);
    expect(batch.workerCeilings).toEqual({ HIL: 20 });
    expect(namedBatchRows(batch, "HIL")).toHaveLength(24);
    expect(() => namedBatchRows(batch, "BLD")).toThrow("not assigned");
    expect(entries.slice(20).every(({ row }) => row.pressurePa === 202650)).toBe(true);
  });

  it("matches W4 to all four historical fine controls, changing only ID and CFL", () => {
    for (const [index, representation, arm] of [[0, "fine-thin", "broad"], [1, "fine-thin", "early"],
      [2, "fine-thick", "broad"], [3, "fine-thick", "early"]] as const) {
      const old = HIL_WARM_REFINEMENT_ROWS.find(({ row }) => row.id === `warm-refine-${representation}-t4p5-${arm}`)!;
      expect(entries[index]).toEqual({ ...old, row: { ...old.row, id: entries[index].row.id, cflFill: 0.025 } });
      expect(entries[index].row.sigmaInfinity).toBe((0.02 + ((-4.5 + 2) / (-5 + 2)) * (0.05 - 0.02)) * 0.075);
    }
  });

  it("independently expands cold geometry, all four arms and exact table forcing", () => {
    const coldSigma = (0.102 + ((-14.4 + 10) / (-15 + 10)) * (0.157 - 0.102)) * 0.1;
    for (const [index, seedThickness, arm] of [
      [4, 1, "neither"], [5, 1, "basal-only"], [6, 1, "prism-only"], [7, 1, "both"],
      [8, 3, "neither"], [9, 3, "basal-only"], [10, 3, "prism-only"], [11, 3, "both"],
    ] as const) {
      const expected: DiscoveryRow = { id: `gd21-hil-c1-h${seedThickness}-${arm}`, lane: "cavity-mechanism",
        conditional: false, tempC: -14.4, fraction: 0.1, sigmaInfinity: coldSigma, pressurePa: 101325,
        paramSet: "M1", dimsN: 126, dxUm: 0.175, seedRadius: 4, seedThickness, cflFill: 0.025,
        targetExtent: 57, maxSteps: 100000, experimentalFacetDips: arm,
        spatialSampleExtents: [9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53] };
      expect(entries[index]).toEqual({ host: "HIL", track: "cold-core-tip", row: expected });
    }
  });

  it("pins all history/static controls, pressure order, triggers and observations without experiment flags", () => {
    for (let index = 12; index < 24; index++) {
      const pressurePa = [50662.5, 101325, 202650][Math.floor((index - 12) / 4)];
      const arm = ["switch7", "switch15", "source", "destination"][(index - 12) % 4];
      const tempC = arm === "destination" ? -6 : -14.4;
      const sigmaWater = tempC === -6 ? 0.05 + 0.2 * (0.102 - 0.05)
        : 0.102 + ((-14.4 + 10) / -5) * (0.157 - 0.102);
      const expected: DiscoveryRow = { id: `gd21-hil-h1-p${String(pressurePa).replace(".", "p")}-${arm}`,
        lane: "followup-history", conditional: false, tempC, fraction: 0.2,
        sigmaInfinity: sigmaWater * 0.2, pressurePa, paramSet: "M1", dimsN: 96, dxUm: 0.35,
        seedRadius: 2, seedThickness: 1, cflFill: 0.025, targetExtent: 57, maxSteps: 100000,
        spatialSampleExtents: [5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55],
        ...(arm === "switch7" || arm === "switch15" ? { timelineEvent: {
          triggerLargestExtent: arm === "switch7" ? 7 : 15, tempC: -6,
          sigmaInfinity: (0.05 + 0.2 * (0.102 - 0.05)) * 0.2 } } : {}) };
      expect(entries[index]).toEqual({ host: "HIL", track: "environment-history", row: expected });
      expect(entries[index].row.targetExtent).toBeLessThan(0.65 * entries[index].row.dimsN);
    }
  });

  it("binds ceiling and scientific identity, allowing only bounded operational worker changes", () => {
    const binding = hilGrowthDynamicsOct21CampaignBinding();
    expect(binding).toMatchObject({ workerCeiling: 20, host: "HIL", checkpointFormat: "discovery-resume-v1",
      rosterSha256: firstBatchRosterSha256("HIL", batch), rows: entries.map(({ row }) => row) });
    expect(binding).not.toHaveProperty("requestedConcurrency");
    expect(() => validateHilGrowthDynamicsOct21Campaign(binding)).not.toThrow();
    for (const change of [{ workerCeiling: 32 }, { host: "BLD" }, { gitHead: "wrong" }, { node: "wrong" },
      { v8: "wrong" }, { hostIdentity: {} }, { rows: [] }, { rosterSha256: "wrong" }]) {
      expect(() => validateHilGrowthDynamicsOct21Campaign({ ...binding, ...change })).toThrow("does not match");
    }
    expect(hilOperationalWorkers([], config)).toBe(20);
    expect(hilOperationalWorkers(["--workers", "12"], config)).toBe(12);
    for (const value of ["0", "21", "1.5", "-1", "NaN"]) {
      expect(() => hilOperationalWorkers(["--workers", value], config)).toThrow();
    }
    expect(() => hilOperationalWorkers(["--workers", "12"], { ...config, workerCeiling: undefined })).toThrow("fixed worker count");
  });

  it("routes real list and rejects wrong-host/invalid-worker launches before touching output", () => {
    const listed = cli("list", "HIL");
    expect(listed.status, listed.stderr).toBe(0);
    expect(JSON.parse(listed.stdout).entries).toEqual(entries);
    expect(cli("launch", "BLD", "unused").stderr).toContain("assigned only to HIL");
    expect(cli("launch", "HIL", "unused", "--workers", "21").stderr).toContain("between 1 and 20");
    expect(cli("probe", "HIL", "unused").status).toBe(1);
    expect(cli("run-row", "gd21-bld-f0", "unused").stderr).toContain("unknown");
  });

  it("refills a bounded process fixture and routes bootstrap resume at a lower count without a wall timer", async () => {
    const directory = mkdtempSync(join(tmpdir(), "vcc-gd21-route-")); temporary.push(directory);
    const entryPath = join(directory, "child.mjs");
    writeFileSync(entryPath, "console.log(process.argv.slice(2)); await new Promise(r => setTimeout(r, 150));\n");
    const rows = entries.slice(0, 3).map(({ row }) => row);
    await launchDiscoveryRows({ campaignDirectory: directory, launchName: "first", rows,
      concurrency: hilOperationalWorkers(["--workers", "2"], config), entryPath, attemptName: "first" });
    const pending = planFirstBatchResume(directory, rows).pending;
    expect(pending.map(({ command }) => command)).toEqual(["resume-row", "resume-row", "resume-row"]);
    await launchDiscoveryRows({ campaignDirectory: directory, launchName: "second", rows,
      concurrency: hilOperationalWorkers(["--workers", "1"], config), entryPath, attemptName: "second",
      resumeExistingRows: true, workerArguments: (row, output) => [pending.find((item) => item.row.id === row.id)!.command, row.id, output] });
    const read = (leaf: string) => JSON.parse(readFileSync(join(directory, leaf), "utf8"));
    expect(read("first-complete.json").actualMaximumConcurrency).toBe(2);
    expect(read("second-complete.json").actualMaximumConcurrency).toBe(1);
    expect(read("second-launch.json")).not.toHaveProperty("hardWallSeconds");
    expect(read(`rows/${rows[0].id}/attempts/second/process.json`).command[2]).toBe("resume-row");
  });
});
