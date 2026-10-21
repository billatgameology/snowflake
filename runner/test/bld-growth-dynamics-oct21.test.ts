import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { BLD_GROWTH_DYNAMICS_OCT21_CONFIG as config,
  bldGrowthDynamicsOct21CampaignBinding, validateBldGrowthDynamicsOct21Campaign } from "../src/bld-growth-dynamics-oct21-main.ts";
import { BLD_GROWTH_DYNAMICS_OCT21_ROWS as entries } from "../src/bld-growth-dynamics-oct21-roster.ts";
import { firstBatchRosterSha256, planFirstBatchResume } from "../src/hil-bld-batch-main.ts";
import { launchDiscoveryRows } from "../src/hil-bld-batch-execution.ts";
import { hilOperationalWorkers } from "../src/hil-operational-batch-main.ts";

const temporary: string[] = [];
afterEach(() => { for (const directory of temporary.splice(0)) rmSync(directory, { recursive: true, force: true }); });
const cli = (...args: string[]) => spawnSync(process.execPath,
  ["runner/src/bld-growth-dynamics-oct21-main.ts", ...args], { encoding: "utf8", windowsHide: true });

describe("BLD growth dynamics dispatch and recovery", () => {
  it("binds BLD, all scientific rows and producer/runtime while recording workers per attempt", () => {
    const binding = bldGrowthDynamicsOct21CampaignBinding();
    expect(binding).toMatchObject({ host: "BLD", workerCeiling: 32,
      checkpointFormat: "discovery-resume-v1", rows: entries.map(({ row }) => row),
      rosterSha256: firstBatchRosterSha256("BLD", config.batch) });
    expect(binding).not.toHaveProperty("requestedConcurrency");
    expect(() => validateBldGrowthDynamicsOct21Campaign(binding)).not.toThrow();
    for (const change of [{ host: "HIL" }, { workerCeiling: 20 }, { gitHead: "other" },
      { node: "other" }, { v8: "other" }, { hostIdentity: {} }, { rosterSha256: "other" },
      { rows: [] }, { rows: [{ ...binding.rows[0], targetExtent: 31 }, ...binding.rows.slice(1)] }]) {
      expect(() => validateBldGrowthDynamicsOct21Campaign({ ...binding, ...change })).toThrow("does not match");
    }
    expect(hilOperationalWorkers([], config)).toBe(32);
    expect(hilOperationalWorkers(["--workers", "16"], config)).toBe(16);
    for (const value of ["0", "33", "1.5", "-1", "NaN"]) {
      expect(() => hilOperationalWorkers(["--workers", value], config)).toThrow();
    }
  });

  it("lists only BLD and rejects HIL/probe/invalid worker routes before output creation", () => {
    const listed = cli("list", "BLD");
    expect(listed.status, listed.stderr).toBe(0);
    expect(JSON.parse(listed.stdout).entries).toEqual(entries);
    expect(cli("list", "HIL").status).toBe(1);
    expect(cli("launch", "HIL", "unused").stderr).toContain("assigned only to BLD");
    expect(cli("resume", "HIL", "unused").stderr).toContain("assigned only to BLD");
    expect(cli("launch", "BLD", "unused", "--workers", "33").stderr).toContain("between 1 and 32");
    expect(cli("probe", "BLD", "unused").status).toBe(1);
    expect(cli("run-row", "gd21-hil-w4-h1-broad", "unused").stderr).toContain("unknown");
  });

  it("refills and resumes unfinished BLD rows at fewer workers, retaining attempt logs without a wall deadline", async () => {
    const directory = mkdtempSync(join(tmpdir(), "vcc-bld-gd21-route-")); temporary.push(directory);
    const entryPath = join(directory, "child.mjs");
    writeFileSync(entryPath, "console.log(process.argv.slice(2)); await new Promise(r => setTimeout(r, 150));\n");
    const rows = entries.slice(0, 3).map(({ row }) => row);
    await launchDiscoveryRows({ campaignDirectory: directory, launchName: "first", rows,
      concurrency: hilOperationalWorkers(["--workers", "2"], config), entryPath, attemptName: "first" });
    const pending = planFirstBatchResume(directory, rows).pending;
    expect(pending.map(({ command }) => command)).toEqual(["resume-row", "resume-row", "resume-row"]);
    await launchDiscoveryRows({ campaignDirectory: directory, launchName: "second", rows,
      concurrency: hilOperationalWorkers(["--workers", "1"], config), entryPath, attemptName: "second",
      resumeExistingRows: true, workerArguments: (row, output) => [
        pending.find((item) => item.row.id === row.id)!.command, row.id, output] });
    const read = (leaf: string) => JSON.parse(readFileSync(join(directory, leaf), "utf8"));
    expect(read("first-complete.json").actualMaximumConcurrency).toBe(2);
    expect(read("second-complete.json").actualMaximumConcurrency).toBe(1);
    expect(read("second-complete.json").exits).toHaveLength(3);
    expect(read("second-launch.json")).not.toHaveProperty("hardWallSeconds");
    expect(read(`rows/${rows[0].id}/attempts/second/process.json`).command[2]).toBe("resume-row");
    expect(read(`rows/${rows[0].id}/attempts/first/process.json`).command).toBeDefined();
  });
});
